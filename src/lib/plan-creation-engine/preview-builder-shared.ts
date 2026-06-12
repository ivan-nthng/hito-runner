import {
  resolveRunningPlanPreviewSegments,
  runningPlanPrescriptionIsExact,
} from "@/lib/plan-creation-engine/prescription-resolver";
import {
  getRunningPlanWorkoutDayTemplate,
  resolveRunningPlanEndpointTemplate,
  RUNNING_PLAN_SOURCE_MODEL,
} from "@/lib/plan-creation-engine/source-model";
import {
  resolveRunningPlanHorizonSelection,
  type RunningPlanHorizonSelection,
} from "@/lib/plan-creation-engine/horizon-policy";
import { findForbiddenRunnerFacingLanguageMatches } from "@/lib/plan-creation-engine/forbidden-runner-facing-language";
import {
  RUNNING_PLAN_DAYS_PER_WEEK_VALUES,
  RUNNING_PLAN_DISTANCE_FAMILY_VALUES,
  RUNNING_PLAN_RUNNER_LEVEL_VALUES,
  type RunningPlanBuilderInput,
  type RunningPlanDaysPerWeek,
  type RunningPlanDistanceFamily,
  type RunningPlanEndpointTemplate,
  type RunningPlanRunnerLevel,
  type RunningPlanSegmentPrescription,
  type RunningPlanTargetTruthMode,
  type RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import { collectRunningPlanPreviewPrescriptionGrammarIssues } from "@/lib/plan-creation-engine/prescription-quality";
import { addDaysIso, todayIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export const RUNNING_PLAN_PREVIEW_REST_DAY_KIND = "rest" as const;

const WEEKDAY_INDEX = new Map(WEEKDAY_NAMES.map((weekday, index) => [weekday, index]));

export type RunningPlanPreviewLoadContext = "standard" | "conservative";
export type RunningPlanPreviewCalendarWorkoutDayKind =
  | RunningPlanWorkoutDayKind
  | typeof RUNNING_PLAN_PREVIEW_REST_DAY_KIND;

export interface BuildRunningPlanPreviewInput {
  age: number;
  heightCm: number;
  weightKg: number;
  runnerLevel: RunningPlanRunnerLevel;
  distanceFamily: RunningPlanDistanceFamily;
  daysPerWeek?: RunningPlanDaysPerWeek | null;
  fixedRestDays?: readonly WeekdayName[] | null;
  preferredLongRunDay?: WeekdayName | null;
  startDate?: string | null;
}

export interface RunningPlanPreviewCalendarRow {
  rowId: string;
  date: string;
  weekNumber: number;
  dayNumber: number;
  weekday: WeekdayName;
  isRestDay: boolean;
  workoutDayKind: RunningPlanPreviewCalendarWorkoutDayKind;
  title: string;
  watchExecutable: boolean;
  primaryContract: "numeric_structure" | null;
  targetTruthModes: readonly RunningPlanTargetTruthMode[];
  cueRole: "secondary_only" | null;
  segments: readonly RunningPlanEndpointTemplate["segments"];
  endpointGateId: string | null;
  endpointDistanceMeters: number | null;
}

export interface RunningPlanPreviewNormalizedInputSummary extends RunningPlanBuilderInput {
  normalizedBy: string;
  sourceModelVersion: typeof RUNNING_PLAN_SOURCE_MODEL.sourceVersion;
  longRunDaySource: "runner_preference" | "backend_default" | "backend_fallback";
  trainingWeekdays: readonly WeekdayName[];
  loadContext: RunningPlanPreviewLoadContext;
  horizonSelection: RunningPlanHorizonSelection;
}

export type RunningPlanPreviewUnavailableCode =
  | "unsupported_distance_family"
  | "unsupported_runner_level"
  | "unsupported_days_per_week"
  | "invalid_runner_basics"
  | "invalid_start_date"
  | "invalid_fixed_rest_day"
  | "long_run_day_blocked"
  | "insufficient_available_days"
  | "builder_validation_failed";

export interface RunningPlanPreviewValidationStatus {
  ok: boolean;
  issues: readonly string[];
  forbiddenOutputGateIdsChecked: readonly string[];
  rejectedOldBehaviorSignalsChecked: readonly string[];
}

export interface NormalizeRunningPlanPreviewInputOptions {
  input: BuildRunningPlanPreviewInput;
  family: RunningPlanDistanceFamily;
  sourceKind: string;
}

export function normalizeRunningPlanPreviewInput({
  input,
  family,
  sourceKind,
}: NormalizeRunningPlanPreviewInputOptions):
  | { ok: true; input: RunningPlanPreviewNormalizedInputSummary }
  | {
      ok: false;
      error: {
        code: RunningPlanPreviewUnavailableCode;
        message: string;
      };
    } {
  if (!RUNNING_PLAN_DISTANCE_FAMILY_VALUES.includes(input.distanceFamily)) {
    return failure(
      "unsupported_distance_family",
      `Unsupported distance family: ${String(input.distanceFamily)}.`,
    );
  }

  if (input.distanceFamily !== family) {
    return failure(
      "unsupported_distance_family",
      `This builder only supports the ${family} family.`,
    );
  }

  if (!runnerBasicsAreValid(input)) {
    return failure(
      "invalid_runner_basics",
      "Runner age, height, and weight must be finite positive numbers.",
    );
  }

  if (!RUNNING_PLAN_RUNNER_LEVEL_VALUES.includes(input.runnerLevel)) {
    return failure(
      "unsupported_runner_level",
      `Unsupported runner level: ${String(input.runnerLevel)}.`,
    );
  }

  const daysPerWeek =
    input.daysPerWeek ?? RUNNING_PLAN_SOURCE_MODEL.builderInputContract.backendDefaults.daysPerWeek;
  if (!RUNNING_PLAN_DAYS_PER_WEEK_VALUES.includes(daysPerWeek)) {
    return failure("unsupported_days_per_week", `Unsupported days/week: ${String(daysPerWeek)}.`);
  }

  const startDate = input.startDate ?? todayIso();
  if (!isIsoDate(startDate)) {
    return failure("invalid_start_date", `Invalid start date: ${String(input.startDate)}.`);
  }

  const rawFixedRestDays = [
    ...(input.fixedRestDays ??
      RUNNING_PLAN_SOURCE_MODEL.builderInputContract.backendDefaults.fixedRestDays),
  ];
  for (const fixedRestDay of rawFixedRestDays) {
    if (!WEEKDAY_NAMES.includes(fixedRestDay)) {
      return failure("invalid_fixed_rest_day", `Invalid fixed rest day: ${String(fixedRestDay)}.`);
    }
  }

  const fixedRestDays = uniqueWeekdays(rawFixedRestDays);
  const longRunResolution = resolveLongRunDay({
    fixedRestDays,
    preferredLongRunDay: input.preferredLongRunDay ?? null,
  });
  if (!longRunResolution.ok) {
    return failure(longRunResolution.code, longRunResolution.message);
  }

  const trainingWeekdays = resolveTrainingWeekdays({
    daysPerWeek,
    fixedRestDays,
    longRunDay: longRunResolution.longRunDay,
  });
  if (!trainingWeekdays.ok) {
    return failure(trainingWeekdays.code, trainingWeekdays.message);
  }
  const loadContext = resolveLoadContext(input);

  return {
    ok: true,
    input: {
      age: input.age,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      runnerLevel: input.runnerLevel,
      distanceFamily: family,
      daysPerWeek,
      fixedRestDays,
      preferredLongRunDay: longRunResolution.longRunDay,
      startDate,
      normalizedBy: sourceKind,
      sourceModelVersion: RUNNING_PLAN_SOURCE_MODEL.sourceVersion,
      longRunDaySource: longRunResolution.source,
      trainingWeekdays: trainingWeekdays.weekdays,
      loadContext,
      horizonSelection: resolveRunningPlanHorizonSelection({
        family,
        runnerLevel: input.runnerLevel,
        loadContext,
        daysPerWeek,
      }),
    },
  };
}

export interface BuildRunningPlanCalendarRowsOptions {
  input: RunningPlanPreviewNormalizedInputSummary;
  family: RunningPlanDistanceFamily;
  horizonWeeks: number;
  rowIdPrefix: string;
  recoveryAfterKinds: readonly RunningPlanPreviewCalendarWorkoutDayKind[];
  selectWorkoutDayKind: (context: {
    weekNumber: number;
    weekday: WeekdayName;
    longRunDay: WeekdayName;
    nextAfterLongRunDay: WeekdayName;
    developmentWeekday: WeekdayName | null;
    runnerLevel: RunningPlanRunnerLevel;
    loadContext: RunningPlanPreviewLoadContext;
    horizonWeeks: number;
  }) => RunningPlanWorkoutDayKind;
}

export function buildRunningPlanCalendarRows({
  input,
  family,
  horizonWeeks,
  rowIdPrefix,
  recoveryAfterKinds,
  selectWorkoutDayKind,
}: BuildRunningPlanCalendarRowsOptions): readonly RunningPlanPreviewCalendarRow[] {
  const rows: RunningPlanPreviewCalendarRow[] = [];
  const trainingWeekdaySet = new Set(input.trainingWeekdays);
  const nextAfterLongRunDay = resolveNextTrainingWeekdayAfter(
    input.preferredLongRunDay,
    input.trainingWeekdays,
  );
  const developmentWeekday = resolveDevelopmentWeekday(
    input.trainingWeekdays,
    input.preferredLongRunDay,
  );
  const finalEndpointDayNumber = resolveFinalEndpointDayNumber({
    startDate: input.startDate,
    longRunDay: input.preferredLongRunDay,
    horizonWeeks,
  });

  for (let dayOffset = 0; dayOffset < horizonWeeks * 7; dayOffset += 1) {
    const date = addDaysIso(input.startDate, dayOffset);
    const weekday = weekdayLong(date) as WeekdayName;
    const weekNumber = Math.floor(dayOffset / 7) + 1;
    const dayNumber = dayOffset + 1;

    if (
      !trainingWeekdaySet.has(weekday) ||
      input.fixedRestDays.includes(weekday) ||
      dayNumber > finalEndpointDayNumber
    ) {
      rows.push(buildRestRow({ date, weekNumber, dayNumber, weekday, rowIdPrefix }));
      continue;
    }

    const workoutDayKind = selectWorkoutDayKind({
      weekNumber,
      weekday,
      longRunDay: input.preferredLongRunDay,
      nextAfterLongRunDay,
      developmentWeekday,
      runnerLevel: input.runnerLevel,
      loadContext: input.loadContext,
      horizonWeeks,
    });

    rows.push(
      buildWorkoutRow({
        date,
        weekNumber,
        dayNumber,
        weekday,
        workoutDayKind,
        rowIdPrefix,
        family,
        runnerLevel: input.runnerLevel,
        loadContext: input.loadContext,
        horizonWeeks,
      }),
    );
  }

  return enforceRecoveryAfterStressors({
    rows,
    recoveryAfterKinds,
    rowIdPrefix,
    family,
    runnerLevel: input.runnerLevel,
    loadContext: input.loadContext,
    horizonWeeks,
  });
}

export function buildWorkoutRow({
  date,
  weekNumber,
  dayNumber,
  weekday,
  workoutDayKind,
  rowIdPrefix,
  family,
  runnerLevel,
  loadContext,
  horizonWeeks,
}: {
  date: string;
  weekNumber: number;
  dayNumber: number;
  weekday: WeekdayName;
  workoutDayKind: RunningPlanWorkoutDayKind;
  rowIdPrefix: string;
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  horizonWeeks: number;
}): RunningPlanPreviewCalendarRow {
  const template =
    workoutDayKind === "final_selected_distance_day" || workoutDayKind === "marathon_base_endpoint"
      ? resolveRunningPlanEndpointTemplate(family)
      : getRunningPlanWorkoutDayTemplate(workoutDayKind);
  const segments = resolveRunningPlanPreviewSegments({
    family,
    workoutDayKind,
    runnerLevel,
    loadContext,
    weekNumber,
    horizonWeeks,
    segments: template.segments,
  });

  return {
    rowId: `${rowIdPrefix}-w${weekNumber}-d${dayNumber}-${workoutDayKind}`,
    date,
    weekNumber,
    dayNumber,
    weekday,
    isRestDay: false,
    workoutDayKind,
    title: template.label,
    watchExecutable: template.watchExecutable,
    primaryContract: template.primaryContract,
    targetTruthModes: template.targetTruthModes,
    cueRole: template.cueRole,
    segments,
    endpointGateId: "endpointGateId" in template ? template.endpointGateId : null,
    endpointDistanceMeters:
      "endpointDistanceMeters" in template ? template.endpointDistanceMeters : null,
  };
}

export function buildRestRow({
  date,
  weekNumber,
  dayNumber,
  weekday,
  rowIdPrefix,
}: {
  date: string;
  weekNumber: number;
  dayNumber: number;
  weekday: WeekdayName;
  rowIdPrefix: string;
}): RunningPlanPreviewCalendarRow {
  return {
    rowId: `${rowIdPrefix}-w${weekNumber}-d${dayNumber}-rest`,
    date,
    weekNumber,
    dayNumber,
    weekday,
    isRestDay: true,
    workoutDayKind: RUNNING_PLAN_PREVIEW_REST_DAY_KIND,
    title: "Rest Day",
    watchExecutable: false,
    primaryContract: null,
    targetTruthModes: [],
    cueRole: null,
    segments: [],
    endpointGateId: null,
    endpointDistanceMeters: null,
  };
}

export function validateCommonPreviewRows({
  rows,
  fixedRestDays,
  expectedFinalWorkoutKind,
  expectedEndpointDistanceMeters,
  familyLabel,
  issues,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  fixedRestDays: readonly WeekdayName[];
  expectedFinalWorkoutKind: RunningPlanWorkoutDayKind;
  expectedEndpointDistanceMeters: number | null;
  familyLabel: string;
  issues: string[];
}) {
  validateFixedRestDays(rows, fixedRestDays, issues);
  validateWatchExecutableRows(rows, issues);
  validateForbiddenSignals(rows, issues);
  issues.push(...collectRunningPlanPreviewPrescriptionGrammarIssues(rows));

  const finalNonRestRow = rows.filter((row) => !row.isRestDay).at(-1);
  if (!finalNonRestRow) {
    issues.push(`${familyLabel} preview must include non-rest rows.`);
    return;
  }

  if (finalNonRestRow.workoutDayKind !== expectedFinalWorkoutKind) {
    issues.push(`${familyLabel} final non-rest row must be ${expectedFinalWorkoutKind}.`);
  }

  if (finalNonRestRow.endpointDistanceMeters !== expectedEndpointDistanceMeters) {
    issues.push(
      `${familyLabel} endpoint meters must be ${String(expectedEndpointDistanceMeters)}.`,
    );
  }
}

export function endpointTemplateMainDistanceMeters(template: RunningPlanEndpointTemplate) {
  const mainSegment = template.segments.find((segment) => segment.segmentRole === "main");
  if (!mainSegment || mainSegment.primaryPrescription.mode !== "distance") {
    return null;
  }

  const distanceMeters = mainSegment.primaryPrescription.distanceMeters;
  if (distanceMeters.min !== distanceMeters.max) {
    return null;
  }

  return distanceMeters.min;
}

export function segmentPrescriptionIsNumeric(prescription: RunningPlanSegmentPrescription) {
  return runningPlanPrescriptionIsExact(prescription);
}

export function isRunningPlanIsoDate(value: string) {
  return isIsoDate(value);
}

function enforceRecoveryAfterStressors({
  rows,
  recoveryAfterKinds,
  rowIdPrefix,
  family,
  runnerLevel,
  loadContext,
  horizonWeeks,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  recoveryAfterKinds: readonly RunningPlanPreviewCalendarWorkoutDayKind[];
  rowIdPrefix: string;
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  horizonWeeks: number;
}): readonly RunningPlanPreviewCalendarRow[] {
  const repairedRows = [...rows];

  for (let index = 0; index < repairedRows.length; index += 1) {
    const row = repairedRows[index]!;
    if (!recoveryAfterKinds.includes(row.workoutDayKind)) {
      continue;
    }

    const nextRunningIndex = repairedRows.findIndex(
      (candidate, candidateIndex) => candidateIndex > index && !candidate.isRestDay,
    );
    if (nextRunningIndex === -1) {
      continue;
    }

    const nextRow = repairedRows[nextRunningIndex]!;
    if (nextRow.workoutDayKind === "recovery" || nextRow.workoutDayKind === "easy") {
      continue;
    }

    if (
      nextRow.workoutDayKind === "long_run" ||
      nextRow.workoutDayKind === "cutback_long_run" ||
      nextRow.workoutDayKind === "final_selected_distance_day" ||
      nextRow.workoutDayKind === "marathon_base_endpoint"
    ) {
      continue;
    }

    repairedRows[nextRunningIndex] = buildWorkoutRow({
      date: nextRow.date,
      weekNumber: nextRow.weekNumber,
      dayNumber: nextRow.dayNumber,
      weekday: nextRow.weekday,
      workoutDayKind: "recovery",
      rowIdPrefix,
      family,
      runnerLevel,
      loadContext,
      horizonWeeks,
    });
  }

  return repairedRows;
}

function validateFixedRestDays(
  rows: readonly RunningPlanPreviewCalendarRow[],
  fixedRestDays: readonly WeekdayName[],
  issues: string[],
) {
  for (const row of rows) {
    if (!row.isRestDay && fixedRestDays.includes(row.weekday)) {
      issues.push(`Fixed rest day violation on ${row.date} (${row.weekday}).`);
    }
  }
}

function validateWatchExecutableRows(
  rows: readonly RunningPlanPreviewCalendarRow[],
  issues: string[],
) {
  for (const row of rows) {
    if (row.isRestDay) {
      continue;
    }

    if (!row.watchExecutable || row.primaryContract !== "numeric_structure") {
      issues.push(`${row.rowId} is not watch-executable numeric structure.`);
    }

    if (row.cueRole !== "secondary_only") {
      issues.push(`${row.rowId} must keep cues secondary.`);
    }

    if (row.segments.length === 0) {
      issues.push(`${row.rowId} has no segments.`);
    }

    for (const segment of row.segments) {
      if (!segmentPrescriptionIsNumeric(segment.primaryPrescription)) {
        issues.push(`${row.rowId}.${segment.id} lacks exact numeric execution structure.`);
      }
    }
  }
}

function validateForbiddenSignals(
  rows: readonly RunningPlanPreviewCalendarRow[],
  issues: string[],
) {
  const text = JSON.stringify(rows);
  const forbiddenRunnerFacingMatches = findForbiddenRunnerFacingLanguageMatches(rows);

  if (forbiddenRunnerFacingMatches.length > 0) {
    issues.push(
      `Preview rows must not contain forbidden runner-facing metric or race-readiness language: ${[
        ...new Set(forbiddenRunnerFacingMatches.map((match) => match.signal)),
      ].join(", ")}.`,
    );
  }

  if (/recent5k|recent_5k|5k_benchmark|watchAccess|no_watch/i.test(text)) {
    issues.push("Preview rows must not contain 5K benchmark or watch/no-watch gate fields.");
  }
}

function resolveLongRunDay({
  fixedRestDays,
  preferredLongRunDay,
}: {
  fixedRestDays: readonly WeekdayName[];
  preferredLongRunDay: WeekdayName | null;
}):
  | {
      ok: true;
      longRunDay: WeekdayName;
      source: RunningPlanPreviewNormalizedInputSummary["longRunDaySource"];
    }
  | {
      ok: false;
      code: Extract<RunningPlanPreviewUnavailableCode, "long_run_day_blocked">;
      message: string;
    } {
  if (preferredLongRunDay) {
    if (fixedRestDays.includes(preferredLongRunDay)) {
      return {
        ok: false,
        code: "long_run_day_blocked",
        message: `Preferred long-run day ${preferredLongRunDay} is a fixed rest day.`,
      };
    }

    return { ok: true, longRunDay: preferredLongRunDay, source: "runner_preference" };
  }

  const fallback =
    RUNNING_PLAN_SOURCE_MODEL.builderInputContract.backendDefaults.preferredLongRunDayFallback;
  if (!fixedRestDays.includes(fallback)) {
    return { ok: true, longRunDay: fallback, source: "backend_default" };
  }

  const fallbackCandidates: readonly WeekdayName[] = [
    "Saturday",
    "Friday",
    "Thursday",
    "Tuesday",
    "Monday",
  ];
  const fallbackLongRunDay = fallbackCandidates.find((weekday) => !fixedRestDays.includes(weekday));
  if (!fallbackLongRunDay) {
    return {
      ok: false,
      code: "long_run_day_blocked",
      message: "No viable backend fallback long-run day is available.",
    };
  }

  return { ok: true, longRunDay: fallbackLongRunDay, source: "backend_fallback" };
}

function resolveTrainingWeekdays({
  daysPerWeek,
  fixedRestDays,
  longRunDay,
}: {
  daysPerWeek: RunningPlanDaysPerWeek;
  fixedRestDays: readonly WeekdayName[];
  longRunDay: WeekdayName;
}):
  | { ok: true; weekdays: readonly WeekdayName[] }
  | {
      ok: false;
      code: Extract<RunningPlanPreviewUnavailableCode, "insufficient_available_days">;
      message: string;
    } {
  const allowedWeekdays = WEEKDAY_NAMES.filter((weekday) => !fixedRestDays.includes(weekday));
  if (allowedWeekdays.length < daysPerWeek) {
    return {
      ok: false,
      code: "insufficient_available_days",
      message: `Only ${allowedWeekdays.length} weekdays are available for ${daysPerWeek} runs/week.`,
    };
  }

  const preferredOffsetsByDayCount: Readonly<Record<RunningPlanDaysPerWeek, readonly number[]>> = {
    3: [1, 3, 0],
    4: [1, 2, 4, 0],
    5: [1, 2, 3, 5, 0],
  };
  const selected: WeekdayName[] = [];
  const addWeekday = (weekday: WeekdayName) => {
    if (!fixedRestDays.includes(weekday) && !selected.includes(weekday)) {
      selected.push(weekday);
    }
  };

  for (const offset of preferredOffsetsByDayCount[daysPerWeek]) {
    addWeekday(weekdayOffset(longRunDay, offset));
  }

  for (const weekday of allowedWeekdays) {
    if (selected.length >= daysPerWeek) {
      break;
    }
    addWeekday(weekday);
  }

  if (!selected.includes(longRunDay)) {
    selected.push(longRunDay);
  }

  return {
    ok: true,
    weekdays: [...selected].sort((left, right) => weekdayIndex(left) - weekdayIndex(right)),
  };
}

function resolveNextTrainingWeekdayAfter(
  longRunDay: WeekdayName,
  trainingWeekdays: readonly WeekdayName[],
): WeekdayName {
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = weekdayOffset(longRunDay, offset);
    if (trainingWeekdays.includes(candidate)) {
      return candidate;
    }
  }

  return longRunDay;
}

function resolveDevelopmentWeekday(
  trainingWeekdays: readonly WeekdayName[],
  longRunDay: WeekdayName,
): WeekdayName | null {
  const nextAfterLongRunDay = resolveNextTrainingWeekdayAfter(longRunDay, trainingWeekdays);
  const candidates = trainingWeekdays.filter(
    (weekday) => weekday !== longRunDay && weekday !== nextAfterLongRunDay,
  );

  if (!candidates.length) {
    return null;
  }

  const safelySpacedCandidates = candidates
    .map((weekday) => ({
      weekday,
      spacingBeforeLongRun: (weekdayIndex(longRunDay) - weekdayIndex(weekday) + 7) % 7,
    }))
    .filter((candidate) => candidate.spacingBeforeLongRun >= 2)
    .sort((left, right) => right.spacingBeforeLongRun - left.spacingBeforeLongRun);

  return safelySpacedCandidates[0]?.weekday ?? null;
}

function resolveFinalEndpointDayNumber({
  startDate,
  longRunDay,
  horizonWeeks,
}: {
  startDate: string;
  longRunDay: WeekdayName;
  horizonWeeks: number;
}) {
  const finalWeekStartOffset = (horizonWeeks - 1) * 7;

  for (let offset = finalWeekStartOffset; offset < horizonWeeks * 7; offset += 1) {
    const date = addDaysIso(startDate, offset);
    if (weekdayLong(date) === longRunDay) {
      return offset + 1;
    }
  }

  return horizonWeeks * 7;
}

function resolveLoadContext(
  input: Pick<BuildRunningPlanPreviewInput, "age" | "heightCm" | "weightKg">,
) {
  const relativeLoadIndex = input.weightKg / Math.max(input.heightCm, 1);
  if (input.age >= 50 || relativeLoadIndex >= 0.55) {
    return "conservative";
  }

  return "standard";
}

function runnerBasicsAreValid(
  input: Pick<BuildRunningPlanPreviewInput, "age" | "heightCm" | "weightKg">,
) {
  return [input.age, input.heightCm, input.weightKg].every(
    (value) => Number.isFinite(value) && value > 0,
  );
}

function uniqueWeekdays(weekdays: readonly WeekdayName[]) {
  return WEEKDAY_NAMES.filter((weekday) => weekdays.includes(weekday));
}

function weekdayOffset(weekday: WeekdayName, offset: number): WeekdayName {
  return WEEKDAY_NAMES[(weekdayIndex(weekday) + offset) % WEEKDAY_NAMES.length]!;
}

function weekdayIndex(weekday: WeekdayName) {
  return WEEKDAY_INDEX.get(weekday) ?? 0;
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function failure(
  code: RunningPlanPreviewUnavailableCode,
  message: string,
): {
  ok: false;
  error: {
    code: RunningPlanPreviewUnavailableCode;
    message: string;
  };
} {
  return { ok: false, error: { code, message } };
}
