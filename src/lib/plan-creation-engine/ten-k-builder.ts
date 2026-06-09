import {
  getRunningPlanWorkoutDayTemplate,
  resolveRunningPlanEndpointTemplate,
  RUNNING_PLAN_SOURCE_MODEL,
} from "@/lib/plan-creation-engine/source-model";
import {
  resolveTenKDevelopmentTouch,
  TEN_K_ENDPOINT_WEEK,
  type TenKLoadContext,
  validateTenKDiversityPolicy,
} from "@/lib/plan-creation-engine/ten-k-diversity-policy";
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
  type RunningPlanWatchExecutableSegmentTemplate,
  type RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import { addDaysIso, todayIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export const TEN_K_PLAN_BUILDER_SOURCE_KIND = "running_plan_engine_10k_builder_v1" as const;
export const TEN_K_PLAN_BUILDER_WEEKS = 10 as const;

const TEN_K_ENDPOINT_DISTANCE_METERS = 10_000;
const REST_DAY_KIND = "rest" as const;
const WEEKDAY_INDEX = new Map(WEEKDAY_NAMES.map((weekday, index) => [weekday, index]));

export interface BuildTenKPlanPreviewInput {
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

export type TenKPlanCalendarWorkoutDayKind = RunningPlanWorkoutDayKind | typeof REST_DAY_KIND;

export interface TenKPlanCalendarRow {
  rowId: string;
  date: string;
  weekNumber: number;
  dayNumber: number;
  weekday: WeekdayName;
  isRestDay: boolean;
  workoutDayKind: TenKPlanCalendarWorkoutDayKind;
  title: string;
  watchExecutable: boolean;
  primaryContract: "numeric_structure" | null;
  targetTruthModes: readonly RunningPlanTargetTruthMode[];
  cueRole: "secondary_only" | null;
  segments: readonly RunningPlanWatchExecutableSegmentTemplate[];
  endpointGateId: string | null;
  endpointDistanceMeters: number | null;
}

export interface TenKPlanNormalizedInputSummary extends RunningPlanBuilderInput {
  normalizedBy: typeof TEN_K_PLAN_BUILDER_SOURCE_KIND;
  sourceModelVersion: typeof RUNNING_PLAN_SOURCE_MODEL.sourceVersion;
  longRunDaySource: "runner_preference" | "backend_default" | "backend_fallback";
  trainingWeekdays: readonly WeekdayName[];
  loadContext: TenKLoadContext;
}

export interface TenKPlanEndpointProof {
  endpointTemplateFamily: "10K";
  endpointGateId: string;
  finalRowId: string;
  finalDate: string;
  finalWorkoutDayKind: "final_selected_distance_day";
  endpointDistanceMeters: 10000;
  endpointMainDistanceMeters: 10000;
  finalRowIsLastNonRest: true;
  rejectedGenericFinalOutputs: readonly string[];
}

export interface TenKPlanBuilderValidationStatus {
  ok: boolean;
  issues: readonly string[];
  forbiddenOutputGateIdsChecked: readonly string[];
  rejectedOldBehaviorSignalsChecked: readonly string[];
}

export interface TenKPlanPreviewDraft {
  sourceKind: typeof TEN_K_PLAN_BUILDER_SOURCE_KIND;
  source_kind: typeof TEN_K_PLAN_BUILDER_SOURCE_KIND;
  sourceStatus: "preview_ready";
  source_status: "preview_ready";
  persisted: false;
  mutates: false;
  callsOpenAi: false;
  planFamily: "10K";
  planVersion: typeof TEN_K_PLAN_BUILDER_SOURCE_KIND;
  sourceModelVersion: typeof RUNNING_PLAN_SOURCE_MODEL.sourceVersion;
  reviewSafety: {
    persisted: false;
    mutates: false;
    confirmPathImplemented: false;
    callsOpenAi: false;
  };
  normalizedInputSummary: TenKPlanNormalizedInputSummary;
  calendarRows: readonly TenKPlanCalendarRow[];
  endpointProof: TenKPlanEndpointProof;
  validation: TenKPlanBuilderValidationStatus & { ok: true };
}

export interface TenKPlanBuilderUnavailable {
  sourceKind: typeof TEN_K_PLAN_BUILDER_SOURCE_KIND;
  source_kind: typeof TEN_K_PLAN_BUILDER_SOURCE_KIND;
  sourceStatus: "preview_unavailable";
  source_status: "preview_unavailable";
  persisted: false;
  mutates: false;
  callsOpenAi: false;
  planFamily: "10K";
  error: {
    code:
      | "unsupported_distance_family"
      | "unsupported_runner_level"
      | "unsupported_days_per_week"
      | "invalid_runner_basics"
      | "invalid_start_date"
      | "invalid_fixed_rest_day"
      | "long_run_day_blocked"
      | "insufficient_available_days"
      | "builder_validation_failed";
    message: string;
  };
  normalizedInputSummary?: TenKPlanNormalizedInputSummary;
  validation?: TenKPlanBuilderValidationStatus;
}

export type TenKPlanBuilderResult =
  | { ok: true; draft: TenKPlanPreviewDraft }
  | { ok: false; unavailable: TenKPlanBuilderUnavailable };

export function buildTenKPlanPreviewDraft(input: BuildTenKPlanPreviewInput): TenKPlanBuilderResult {
  const normalized = normalizeTenKPlanBuilderInput(input);
  if (!normalized.ok) {
    return {
      ok: false,
      unavailable: buildUnavailable(normalized.error.code, normalized.error.message),
    };
  }

  const calendarRows = buildTenKCalendarRows(normalized.input);
  const endpointProof = buildEndpointProof(calendarRows);
  const validation = validateTenKPlanPreview({
    calendarRows,
    endpointProof,
    normalizedInputSummary: normalized.input,
  });

  if (!validation.ok || !endpointProof) {
    return {
      ok: false,
      unavailable: buildUnavailable(
        "builder_validation_failed",
        "The 10K preview did not satisfy endpoint or watch-executable gates.",
        normalized.input,
        validation,
      ),
    };
  }

  return {
    ok: true,
    draft: {
      sourceKind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
      source_kind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
      sourceStatus: "preview_ready",
      source_status: "preview_ready",
      persisted: false,
      mutates: false,
      callsOpenAi: false,
      planFamily: "10K",
      planVersion: TEN_K_PLAN_BUILDER_SOURCE_KIND,
      sourceModelVersion: RUNNING_PLAN_SOURCE_MODEL.sourceVersion,
      reviewSafety: {
        persisted: false,
        mutates: false,
        confirmPathImplemented: false,
        callsOpenAi: false,
      },
      normalizedInputSummary: normalized.input,
      calendarRows,
      endpointProof,
      validation: { ...validation, ok: true },
    },
  };
}

function normalizeTenKPlanBuilderInput(input: BuildTenKPlanPreviewInput):
  | { ok: true; input: TenKPlanNormalizedInputSummary }
  | {
      ok: false;
      error: {
        code: TenKPlanBuilderUnavailable["error"]["code"];
        message: string;
      };
    } {
  if (!RUNNING_PLAN_DISTANCE_FAMILY_VALUES.includes(input.distanceFamily)) {
    return failure(
      "unsupported_distance_family",
      `Unsupported distance family: ${String(input.distanceFamily)}.`,
    );
  }

  if (input.distanceFamily !== "10K") {
    return failure("unsupported_distance_family", "This builder only supports the 10K family.");
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

  const fixedRestDays = uniqueWeekdays(
    input.fixedRestDays ??
      RUNNING_PLAN_SOURCE_MODEL.builderInputContract.backendDefaults.fixedRestDays,
  );

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

  return {
    ok: true,
    input: {
      age: input.age,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      runnerLevel: input.runnerLevel,
      distanceFamily: "10K",
      daysPerWeek,
      fixedRestDays,
      preferredLongRunDay: longRunResolution.longRunDay,
      startDate,
      normalizedBy: TEN_K_PLAN_BUILDER_SOURCE_KIND,
      sourceModelVersion: RUNNING_PLAN_SOURCE_MODEL.sourceVersion,
      longRunDaySource: longRunResolution.source,
      trainingWeekdays: trainingWeekdays.weekdays,
      loadContext: resolveLoadContext(input),
    },
  };
}

function buildTenKCalendarRows(
  input: TenKPlanNormalizedInputSummary,
): readonly TenKPlanCalendarRow[] {
  const rows: TenKPlanCalendarRow[] = [];
  const trainingWeekdaySet = new Set(input.trainingWeekdays);
  const nextAfterLongRunDay = resolveNextTrainingWeekdayAfter(
    input.preferredLongRunDay,
    input.trainingWeekdays,
  );
  const developmentWeekday = resolveDevelopmentWeekday(
    input.trainingWeekdays,
    input.preferredLongRunDay,
  );
  const finalEndpointDayNumber = resolveFinalEndpointDayNumber(
    input.startDate,
    input.preferredLongRunDay,
  );

  for (let dayOffset = 0; dayOffset < TEN_K_PLAN_BUILDER_WEEKS * 7; dayOffset += 1) {
    const date = addDaysIso(input.startDate, dayOffset);
    const weekday = weekdayLong(date) as WeekdayName;
    const weekNumber = Math.floor(dayOffset / 7) + 1;
    const dayNumber = dayOffset + 1;

    if (
      !trainingWeekdaySet.has(weekday) ||
      input.fixedRestDays.includes(weekday) ||
      isAfterEndpointInFinalWeek(dayNumber, finalEndpointDayNumber)
    ) {
      rows.push(buildRestRow({ date, weekNumber, dayNumber, weekday }));
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
    });

    rows.push(buildWorkoutRow({ date, weekNumber, dayNumber, weekday, workoutDayKind }));
  }

  return enforceRecoveryAfterStressors(rows);
}

function buildWorkoutRow({
  date,
  weekNumber,
  dayNumber,
  weekday,
  workoutDayKind,
}: {
  date: string;
  weekNumber: number;
  dayNumber: number;
  weekday: WeekdayName;
  workoutDayKind: RunningPlanWorkoutDayKind;
}): TenKPlanCalendarRow {
  const template =
    workoutDayKind === "final_selected_distance_day"
      ? resolveRunningPlanEndpointTemplate("10K")
      : getRunningPlanWorkoutDayTemplate(workoutDayKind);

  return {
    rowId: `10k-w${weekNumber}-d${dayNumber}-${workoutDayKind}`,
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
    segments: template.segments,
    endpointGateId:
      "endpointGateId" in template
        ? (template as RunningPlanEndpointTemplate).endpointGateId
        : null,
    endpointDistanceMeters:
      "endpointDistanceMeters" in template
        ? (template as RunningPlanEndpointTemplate).endpointDistanceMeters
        : null,
  };
}

function buildRestRow({
  date,
  weekNumber,
  dayNumber,
  weekday,
}: {
  date: string;
  weekNumber: number;
  dayNumber: number;
  weekday: WeekdayName;
}): TenKPlanCalendarRow {
  return {
    rowId: `10k-w${weekNumber}-d${dayNumber}-rest`,
    date,
    weekNumber,
    dayNumber,
    weekday,
    isRestDay: true,
    workoutDayKind: REST_DAY_KIND,
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

function selectWorkoutDayKind({
  weekNumber,
  weekday,
  longRunDay,
  nextAfterLongRunDay,
  developmentWeekday,
  runnerLevel,
  loadContext,
}: {
  weekNumber: number;
  weekday: WeekdayName;
  longRunDay: WeekdayName;
  nextAfterLongRunDay: WeekdayName;
  developmentWeekday: WeekdayName | null;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: TenKPlanNormalizedInputSummary["loadContext"];
}): RunningPlanWorkoutDayKind {
  if (weekday === longRunDay) {
    if (weekNumber === TEN_K_PLAN_BUILDER_WEEKS) {
      return "final_selected_distance_day";
    }

    return weekNumber % 4 === 0 ? "cutback_long_run" : "long_run";
  }

  if (weekday === nextAfterLongRunDay && weekNumber > 1) {
    return "recovery";
  }

  const developmentTouch = resolveTenKDevelopmentTouch({ runnerLevel, loadContext, weekNumber });
  if (weekNumber < TEN_K_ENDPOINT_WEEK && weekday === developmentWeekday && developmentTouch) {
    return developmentTouch;
  }

  return "easy";
}

function enforceRecoveryAfterStressors(
  rows: readonly TenKPlanCalendarRow[],
): readonly TenKPlanCalendarRow[] {
  const repairedRows = [...rows];

  for (let index = 0; index < repairedRows.length; index += 1) {
    const row = repairedRows[index]!;
    if (!requiresRecoveryAfter(row.workoutDayKind)) {
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
      nextRow.workoutDayKind === "final_selected_distance_day"
    ) {
      continue;
    }

    repairedRows[nextRunningIndex] = buildWorkoutRow({
      date: nextRow.date,
      weekNumber: nextRow.weekNumber,
      dayNumber: nextRow.dayNumber,
      weekday: nextRow.weekday,
      workoutDayKind: "recovery",
    });
  }

  return repairedRows;
}

function buildEndpointProof(rows: readonly TenKPlanCalendarRow[]): TenKPlanEndpointProof | null {
  const finalNonRestRow = rows.filter((row) => !row.isRestDay).at(-1);
  const endpointTemplate = resolveRunningPlanEndpointTemplate("10K");
  const endpointMainDistanceMeters = endpointTemplateMainDistanceMeters(endpointTemplate);

  if (
    !finalNonRestRow ||
    finalNonRestRow.workoutDayKind !== "final_selected_distance_day" ||
    endpointTemplate.endpointDistanceMeters !== TEN_K_ENDPOINT_DISTANCE_METERS ||
    endpointMainDistanceMeters !== TEN_K_ENDPOINT_DISTANCE_METERS
  ) {
    return null;
  }

  return {
    endpointTemplateFamily: "10K",
    endpointGateId: endpointTemplate.endpointGateId,
    finalRowId: finalNonRestRow.rowId,
    finalDate: finalNonRestRow.date,
    finalWorkoutDayKind: "final_selected_distance_day",
    endpointDistanceMeters: TEN_K_ENDPOINT_DISTANCE_METERS,
    endpointMainDistanceMeters: TEN_K_ENDPOINT_DISTANCE_METERS,
    finalRowIsLastNonRest: true,
    rejectedGenericFinalOutputs:
      RUNNING_PLAN_SOURCE_MODEL.endpointGates["10K"].rejectedFinalOutputs,
  };
}

function validateTenKPlanPreview({
  calendarRows,
  endpointProof,
  normalizedInputSummary,
}: {
  calendarRows: readonly TenKPlanCalendarRow[];
  endpointProof: TenKPlanEndpointProof | null;
  normalizedInputSummary: TenKPlanNormalizedInputSummary;
}): TenKPlanBuilderValidationStatus {
  const issues: string[] = [];

  validateEndpointRows(calendarRows, endpointProof, issues);
  validateFixedRestDays(calendarRows, normalizedInputSummary.fixedRestDays, issues);
  validateWatchExecutableRows(calendarRows, issues);
  validateForbiddenSignals(calendarRows, issues);
  issues.push(
    ...validateTenKDiversityPolicy({
      runnerLevel: normalizedInputSummary.runnerLevel,
      loadContext: normalizedInputSummary.loadContext,
      rows: calendarRows,
    }),
  );

  return {
    ok: issues.length === 0,
    issues,
    forbiddenOutputGateIdsChecked: RUNNING_PLAN_SOURCE_MODEL.forbiddenOutputGates.map(
      (gate) => gate.gateId,
    ),
    rejectedOldBehaviorSignalsChecked: [
      "final_generic_long_run",
      "final_rest_or_recovery",
      "metadata_only_endpoint",
      "fake_precise_pace",
      "fake_personal_hr",
      "user_provided_5k_benchmark_dependency",
      "watch_no_watch_gate",
      "zero_intervals_supported_standard_load",
      "zero_hills_higher_support_standard_load",
      "strides_tempo_only_supported_standard_load",
      "threshold_in_10k_preview",
      "unsafe_beginner_development_touch",
      "post_stressor_recovery_spacing",
    ],
  };
}

function validateEndpointRows(
  rows: readonly TenKPlanCalendarRow[],
  endpointProof: TenKPlanEndpointProof | null,
  issues: string[],
) {
  const nonRestRows = rows.filter((row) => !row.isRestDay);
  const finalNonRestRow = nonRestRows.at(-1);

  if (!endpointProof) {
    issues.push("Final 10K endpoint proof is missing.");
    return;
  }

  if (!finalNonRestRow || finalNonRestRow.workoutDayKind !== "final_selected_distance_day") {
    issues.push("Final non-rest row must be final_selected_distance_day.");
  }

  if (finalNonRestRow?.endpointDistanceMeters !== TEN_K_ENDPOINT_DISTANCE_METERS) {
    issues.push("Final endpoint row must carry exactly 10000 endpoint meters.");
  }

  const rejectedFinalKinds: readonly TenKPlanCalendarWorkoutDayKind[] = [
    "rest",
    "recovery",
    "easy",
    "long_run",
    "cutback_long_run",
  ];
  if (finalNonRestRow && rejectedFinalKinds.includes(finalNonRestRow.workoutDayKind)) {
    issues.push(`Final non-rest row must not be ${finalNonRestRow.workoutDayKind}.`);
  }
}

function validateFixedRestDays(
  rows: readonly TenKPlanCalendarRow[],
  fixedRestDays: readonly WeekdayName[],
  issues: string[],
) {
  for (const row of rows) {
    if (!row.isRestDay && fixedRestDays.includes(row.weekday)) {
      issues.push(`Fixed rest day violation on ${row.date} (${row.weekday}).`);
    }
  }
}

function validateWatchExecutableRows(rows: readonly TenKPlanCalendarRow[], issues: string[]) {
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
        issues.push(`${row.rowId}.${segment.id} lacks numeric execution structure.`);
      }
    }
  }
}

function validateForbiddenSignals(rows: readonly TenKPlanCalendarRow[], issues: string[]) {
  const text = JSON.stringify(rows);

  if (/pace_min|pace_target|pace_range|race_pace|personal_hr|effort_only/i.test(text)) {
    issues.push("Preview rows must not contain fake pace, personal HR, or effort-only targets.");
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
      source: TenKPlanNormalizedInputSummary["longRunDaySource"];
    }
  | {
      ok: false;
      code: Extract<TenKPlanBuilderUnavailable["error"]["code"], "long_run_day_blocked">;
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
}:
  | {
      daysPerWeek: RunningPlanDaysPerWeek;
      fixedRestDays: readonly WeekdayName[];
      longRunDay: WeekdayName;
    }
  | never):
  | { ok: true; weekdays: readonly WeekdayName[] }
  | {
      ok: false;
      code: Extract<TenKPlanBuilderUnavailable["error"]["code"], "insufficient_available_days">;
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

  return candidates
    .map((weekday) => ({
      weekday,
      spacingBeforeLongRun: (weekdayIndex(longRunDay) - weekdayIndex(weekday) + 7) % 7,
    }))
    .sort((left, right) => right.spacingBeforeLongRun - left.spacingBeforeLongRun)[0]!.weekday;
}

function requiresRecoveryAfter(kind: TenKPlanCalendarWorkoutDayKind) {
  return (
    kind === "long_run" || kind === "cutback_long_run" || kind === "intervals" || kind === "hills"
  );
}

function resolveFinalEndpointDayNumber(startDate: string, longRunDay: WeekdayName) {
  const finalWeekStartOffset = (TEN_K_PLAN_BUILDER_WEEKS - 1) * 7;

  for (let offset = finalWeekStartOffset; offset < TEN_K_PLAN_BUILDER_WEEKS * 7; offset += 1) {
    const date = addDaysIso(startDate, offset);
    if (weekdayLong(date) === longRunDay) {
      return offset + 1;
    }
  }

  return TEN_K_PLAN_BUILDER_WEEKS * 7;
}

function isAfterEndpointInFinalWeek(dayNumber: number, finalEndpointDayNumber: number) {
  return dayNumber > finalEndpointDayNumber;
}

function resolveLoadContext(
  input: Pick<BuildTenKPlanPreviewInput, "age" | "heightCm" | "weightKg">,
) {
  const relativeLoadIndex = input.weightKg / Math.max(input.heightCm, 1);
  if (input.age >= 50 || relativeLoadIndex >= 0.55) {
    return "conservative";
  }

  return "standard";
}

function runnerBasicsAreValid(
  input: Pick<BuildTenKPlanPreviewInput, "age" | "heightCm" | "weightKg">,
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

function endpointTemplateMainDistanceMeters(template: RunningPlanEndpointTemplate) {
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

function segmentPrescriptionIsNumeric(prescription: RunningPlanSegmentPrescription) {
  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return rangeIsPositive(prescription.durationSeconds);
    case "distance":
    case "distance_with_default_hr_cap":
      return rangeIsPositive(prescription.distanceMeters);
    case "recovery_time":
      return rangeIsPositive(prescription.recoveryDurationSeconds);
    case "recovery_distance":
      return rangeIsPositive(prescription.recoveryDistanceMeters);
    case "free_run_with_cap":
      return (
        rangeIsPositive(prescription.durationSecondsOrDistanceMeters) &&
        prescription.explicitCap.length > 0
      );
    case "repeat":
      return (
        rangeIsPositive(prescription.repeatCount) &&
        repeatPrescriptionIsNumeric(prescription.work) &&
        repeatPrescriptionIsNumeric(prescription.recovery)
      );
  }
}

function repeatPrescriptionIsNumeric(
  prescription:
    | Extract<RunningPlanSegmentPrescription, { mode: "repeat" }>["work"]
    | Extract<RunningPlanSegmentPrescription, { mode: "repeat" }>["recovery"],
) {
  if (prescription.mode === "time") {
    return rangeIsPositive(prescription.durationSeconds);
  }
  if (prescription.mode === "distance") {
    return rangeIsPositive(prescription.distanceMeters);
  }
  if (prescription.mode === "recovery_time") {
    return rangeIsPositive(prescription.recoveryDurationSeconds);
  }

  return rangeIsPositive(prescription.recoveryDistanceMeters);
}

function rangeIsPositive(range: { min: number; max: number }) {
  return (
    Number.isFinite(range.min) &&
    Number.isFinite(range.max) &&
    range.min > 0 &&
    range.max >= range.min
  );
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function failure(
  code: TenKPlanBuilderUnavailable["error"]["code"],
  message: string,
): {
  ok: false;
  error: {
    code: TenKPlanBuilderUnavailable["error"]["code"];
    message: string;
  };
} {
  return { ok: false, error: { code, message } };
}

function buildUnavailable(
  code: TenKPlanBuilderUnavailable["error"]["code"],
  message: string,
  normalizedInputSummary?: TenKPlanNormalizedInputSummary,
  validation?: TenKPlanBuilderValidationStatus,
): TenKPlanBuilderUnavailable {
  return {
    sourceKind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
    source_kind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
    sourceStatus: "preview_unavailable",
    source_status: "preview_unavailable",
    persisted: false,
    mutates: false,
    callsOpenAi: false,
    planFamily: "10K",
    error: { code, message },
    normalizedInputSummary,
    validation,
  };
}
