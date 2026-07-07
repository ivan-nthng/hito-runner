import { resolveRunningPlanCutbackWeeks } from "@/lib/plan-creation-engine/horizon-policy";
import { diffDaysIso } from "@/lib/training";
import type {
  RunningPlanBenchmarkPaceTruth,
  RunningPlanRange,
  RunningPlanRunnerLevel,
  RunningPlanSegmentPrescription,
  RunningPlanWatchExecutableSegmentTemplate,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";

export const TEN_K_BEGINNER_DOSE_POLICY_VERSION = "ten_k_beginner_dose_policy_v1" as const;

const FORBIDDEN_LOW_SUPPORT_KINDS = ["tempo", "intervals", "hills", "threshold"] as const;
const ADAPTATION_WEEKS = 4;
const WEEK_ONE_TOTAL_HARD_CAP_MINUTES = 100;
const WEEK_ONE_LONG_RUN_HARD_CAP_MINUTES = 35;
const EASY_RUN_HARD_CAP_MINUTES = 30;
const RECOVERY_RUN_HARD_CAP_MINUTES = 25;
const PEAK_LONG_RUN_HARD_CAP_MINUTES = 75;
const EARLY_PHASE_MAX_CONSECUTIVE_RUN_DAYS = 2;

export interface TenKBeginnerDosePolicyInput {
  runnerLevel: RunningPlanRunnerLevel;
  benchmarkPaceTruth: RunningPlanBenchmarkPaceTruth | null;
}

export interface TenKBeginnerDosePolicySummary {
  policyVersion: typeof TEN_K_BEGINNER_DOSE_POLICY_VERSION;
  applies: boolean;
  effectiveRunnerLevel: RunningPlanRunnerLevel;
  reason:
    | "beginner_new_runner"
    | "visible_beginner_without_benchmark_truth"
    | "supported_runner_or_benchmark_truth";
}

export interface TenKBeginnerDosePrescriptionInput {
  workoutDayKind: RunningPlanWorkoutDayKind;
  segmentRole: RunningPlanWatchExecutableSegmentTemplate["segmentRole"];
  weekNumber: number;
  horizonWeeks: number;
  prescription: RunningPlanSegmentPrescription;
}

export interface TenKBeginnerDoseValidationRow {
  rowId: string;
  date?: string | null;
  weekNumber: number;
  isRestDay: boolean;
  workoutDayKind: RunningPlanWorkoutDayKind | "rest" | "unknown";
  endpointDistanceMeters?: number | null;
  segments: readonly {
    primaryPrescription: RunningPlanSegmentPrescription;
  }[];
}

export function normalizeTenKBeginnerDoseWorkoutDayKind(
  value: string | null | undefined,
): RunningPlanWorkoutDayKind | "rest" | "unknown" {
  switch (value) {
    case null:
    case undefined:
    case "":
    case "rest":
      return "rest";
    case "recovery":
    case "recovery_jog":
      return "recovery";
    case "easy":
    case "easy_aerobic_run":
    case "cutback_aerobic_run":
      return "easy";
    case "easy_run_with_strides":
    case "strides":
      return "strides";
    case "long_run":
    case "long_aerobic_run":
    case "long_run_with_steady_finish":
      return "long_run";
    case "cutback_long_run":
    case "taper_long_run":
      return "cutback_long_run";
    case "steady_aerobic_run":
      return "steady_aerobic_run";
    case "progression":
    case "progression_run":
      return "progression";
    case "tempo":
    case "controlled_tempo_session":
      return "tempo";
    case "threshold":
    case "half_marathon_threshold_durability":
      return "threshold";
    case "intervals":
    case "10k_rhythm_intervals":
    case "5k_sharpening_repeats":
    case "time_intervals":
    case "distance_intervals":
      return "intervals";
    case "hills":
    case "rolling_hills_session":
    case "uphill_repeats":
    case "controlled_downhill_durability":
      return "hills";
    case "final_selected_distance_day":
    case "selected_distance_completion_or_checkpoint":
      return "final_selected_distance_day";
    default:
      return "unknown";
  }
}

export function summarizeTenKBeginnerDosePolicy(
  input: TenKBeginnerDosePolicyInput,
): TenKBeginnerDosePolicySummary {
  if (input.runnerLevel === "beginner_new_runner") {
    return {
      policyVersion: TEN_K_BEGINNER_DOSE_POLICY_VERSION,
      applies: true,
      effectiveRunnerLevel: "beginner_new_runner",
      reason: "beginner_new_runner",
    };
  }

  if (input.runnerLevel === "sometimes_runs" && input.benchmarkPaceTruth === null) {
    return {
      policyVersion: TEN_K_BEGINNER_DOSE_POLICY_VERSION,
      applies: true,
      effectiveRunnerLevel: "beginner_new_runner",
      reason: "visible_beginner_without_benchmark_truth",
    };
  }

  return {
    policyVersion: TEN_K_BEGINNER_DOSE_POLICY_VERSION,
    applies: false,
    effectiveRunnerLevel: input.runnerLevel,
    reason: "supported_runner_or_benchmark_truth",
  };
}

export function shouldApplyTenKBeginnerDosePolicy(input: TenKBeginnerDosePolicyInput) {
  return summarizeTenKBeginnerDosePolicy(input).applies;
}

export function resolveTenKBeginnerDosePolicyRunnerLevel(
  input: TenKBeginnerDosePolicyInput,
): RunningPlanRunnerLevel {
  return summarizeTenKBeginnerDosePolicy(input).effectiveRunnerLevel;
}

export function resolveTenKBeginnerWorkoutTotalMinutes(input: {
  workoutDayKind: RunningPlanWorkoutDayKind;
  weekNumber: number;
  horizonWeeks: number;
}): number | null {
  switch (input.workoutDayKind) {
    case "easy":
      return input.weekNumber <= ADAPTATION_WEEKS ? 20 : input.weekNumber <= 8 ? 25 : 30;
    case "recovery":
      return input.weekNumber <= ADAPTATION_WEEKS ? 20 : 25;
    case "strides":
      return 15;
    case "long_run":
      return resolveLowSupportLongRunTotalMinutes(input);
    case "cutback_long_run":
      return resolveLowSupportCutbackLongRunTotalMinutes(input);
    case "final_selected_distance_day":
      return null;
    case "steady_aerobic_run":
    case "progression":
    case "tempo":
    case "threshold":
    case "intervals":
    case "hills":
      return null;
  }
}

export function resolveTenKBeginnerDosePrescription({
  horizonWeeks,
  prescription,
  segmentRole,
  weekNumber,
  workoutDayKind,
}: TenKBeginnerDosePrescriptionInput): RunningPlanSegmentPrescription {
  switch (workoutDayKind) {
    case "easy":
      return withSupportRunDuration({
        prescription,
        segmentRole,
        mainMinutes: weekNumber <= ADAPTATION_WEEKS ? 10 : weekNumber <= 8 ? 15 : 20,
      });
    case "recovery":
      return withSupportRunDuration({
        prescription,
        segmentRole,
        mainMinutes: weekNumber <= ADAPTATION_WEEKS ? 10 : 15,
      });
    case "strides":
      return withStridesAdaptationDuration({ prescription, segmentRole });
    case "long_run":
      return withLongRunDuration({
        prescription,
        segmentRole,
        totalMinutes: resolveLowSupportLongRunTotalMinutes({ weekNumber, horizonWeeks }),
      });
    case "cutback_long_run":
      return withCutbackLongRunDuration({
        prescription,
        segmentRole,
        totalMinutes: resolveLowSupportCutbackLongRunTotalMinutes({ weekNumber, horizonWeeks }),
      });
    default:
      return prescription;
  }
}

export function collectTenKBeginnerDosePolicyIssues({
  benchmarkPaceTruth,
  rows,
  runnerLevel,
}: TenKBeginnerDosePolicyInput & {
  rows: readonly TenKBeginnerDoseValidationRow[];
}): readonly string[] {
  if (!shouldApplyTenKBeginnerDosePolicy({ runnerLevel, benchmarkPaceTruth })) {
    return [];
  }

  const issues: string[] = [];
  const nonRestRows = rows.filter((row) => !row.isRestDay);
  const weekOneRows = nonRestRows.filter((row) => row.weekNumber === 1);
  const weekOneTotalMinutes = sumRowsDurationMinutes(weekOneRows);
  const weekOneLongRunMinutes = sumRowsDurationMinutes(
    weekOneRows.filter((row) => row.workoutDayKind === "long_run"),
  );
  const longRunDurations = nonRestRows
    .filter((row) => row.workoutDayKind === "long_run")
    .map((row) => ({ row, durationMinutes: rowDurationMinutes(row) }));

  if (weekOneTotalMinutes > WEEK_ONE_TOTAL_HARD_CAP_MINUTES) {
    issues.push(
      `Low-support 10K Week 1 running minutes must be <= ${WEEK_ONE_TOTAL_HARD_CAP_MINUTES}, got ${formatMinutes(weekOneTotalMinutes)}.`,
    );
  }

  if (weekOneLongRunMinutes > WEEK_ONE_LONG_RUN_HARD_CAP_MINUTES) {
    issues.push(
      `Low-support 10K Week 1 long run must be <= ${WEEK_ONE_LONG_RUN_HARD_CAP_MINUTES} min, got ${formatMinutes(weekOneLongRunMinutes)}.`,
    );
  }

  for (const row of nonRestRows) {
    if (row.workoutDayKind === "unknown") {
      issues.push(`Low-support 10K has unknown workout kind (${row.rowId}).`);
      continue;
    }

    if (FORBIDDEN_LOW_SUPPORT_KINDS.includes(row.workoutDayKind as never)) {
      issues.push(`Low-support 10K must not include ${row.workoutDayKind} (${row.rowId}).`);
    }

    if (
      row.weekNumber <= ADAPTATION_WEEKS &&
      FORBIDDEN_LOW_SUPPORT_KINDS.includes(row.workoutDayKind as never)
    ) {
      issues.push(
        `Low-support 10K adaptation Week ${row.weekNumber} must stay easy/run-walk/strides only.`,
      );
    }

    const durationMinutes = rowDurationMinutes(row);
    if (row.workoutDayKind === "easy" && durationMinutes > EASY_RUN_HARD_CAP_MINUTES) {
      issues.push(
        `Low-support 10K easy run must be <= ${EASY_RUN_HARD_CAP_MINUTES} min (${row.rowId}: ${formatMinutes(durationMinutes)}).`,
      );
    }

    if (row.workoutDayKind === "recovery" && durationMinutes > RECOVERY_RUN_HARD_CAP_MINUTES) {
      issues.push(
        `Low-support 10K recovery run must be <= ${RECOVERY_RUN_HARD_CAP_MINUTES} min (${row.rowId}: ${formatMinutes(durationMinutes)}).`,
      );
    }
  }

  const peakLongRunMinutes = Math.max(0, ...longRunDurations.map((entry) => entry.durationMinutes));
  if (peakLongRunMinutes > PEAK_LONG_RUN_HARD_CAP_MINUTES) {
    issues.push(
      `Low-support 10K peak long run must be <= ${PEAK_LONG_RUN_HARD_CAP_MINUTES} min, got ${formatMinutes(peakLongRunMinutes)}.`,
    );
  }

  validateLongRunProgression(longRunDurations, issues);
  validateCutbackProgression(nonRestRows, issues);
  validateEarlyConsecutiveRunDays(nonRestRows, issues);

  const finalNonRestRow = nonRestRows.at(-1);
  if (
    !finalNonRestRow ||
    finalNonRestRow.workoutDayKind !== "final_selected_distance_day" ||
    finalNonRestRow.endpointDistanceMeters !== 10_000
  ) {
    issues.push("Low-support 10K must preserve exact final 10000m endpoint.");
  }

  return issues;
}

function withSupportRunDuration({
  mainMinutes,
  prescription,
  segmentRole,
}: {
  prescription: RunningPlanSegmentPrescription;
  segmentRole: RunningPlanWatchExecutableSegmentTemplate["segmentRole"];
  mainMinutes: number;
}): RunningPlanSegmentPrescription {
  if (segmentRole === "warmup" || segmentRole === "opener" || segmentRole === "cooldown") {
    return withDurationMinutes(prescription, 5);
  }

  if (segmentRole === "main") {
    return withDurationMinutes(prescription, mainMinutes);
  }

  return prescription;
}

function withStridesAdaptationDuration({
  prescription,
  segmentRole,
}: {
  prescription: RunningPlanSegmentPrescription;
  segmentRole: RunningPlanWatchExecutableSegmentTemplate["segmentRole"];
}): RunningPlanSegmentPrescription {
  if (segmentRole === "warmup" || segmentRole === "cooldown") {
    return withDurationMinutes(prescription, 5);
  }

  if (segmentRole === "main") {
    return withDurationMinutes(prescription, 5);
  }

  if (segmentRole === "work" && prescription.mode === "repeat") {
    return {
      ...prescription,
      repeatCount: exactRange(4),
    };
  }

  return prescription;
}

function withLongRunDuration({
  prescription,
  segmentRole,
  totalMinutes,
}: {
  prescription: RunningPlanSegmentPrescription;
  segmentRole: RunningPlanWatchExecutableSegmentTemplate["segmentRole"];
  totalMinutes: number;
}): RunningPlanSegmentPrescription {
  if (segmentRole === "opener") {
    return withDurationMinutes(prescription, 5);
  }

  if (segmentRole === "main") {
    return withDurationMinutes(prescription, Math.max(20, totalMinutes - 15));
  }

  if (segmentRole === "checkpoint") {
    return withDurationMinutes(prescription, 5);
  }

  if (segmentRole === "finish") {
    return withDurationMinutes(prescription, 5);
  }

  return prescription;
}

function withCutbackLongRunDuration({
  prescription,
  segmentRole,
  totalMinutes,
}: {
  prescription: RunningPlanSegmentPrescription;
  segmentRole: RunningPlanWatchExecutableSegmentTemplate["segmentRole"];
  totalMinutes: number;
}): RunningPlanSegmentPrescription {
  if (segmentRole === "opener" || segmentRole === "finish") {
    return withDurationMinutes(prescription, 5);
  }

  if (segmentRole === "main") {
    return withDurationMinutes(prescription, Math.max(20, totalMinutes - 10));
  }

  return prescription;
}

function withDurationMinutes(
  prescription: RunningPlanSegmentPrescription,
  minutesValue: number,
): RunningPlanSegmentPrescription {
  const durationSeconds = exactRange(minutesValue * 60);

  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return { ...prescription, durationSeconds };
    case "recovery_time":
      return { ...prescription, recoveryDurationSeconds: durationSeconds };
    case "free_run_with_cap":
      return { ...prescription, durationSecondsOrDistanceMeters: durationSeconds };
    case "distance":
    case "distance_with_default_hr_cap":
    case "recovery_distance":
    case "repeat":
      return prescription;
  }
}

function resolveLowSupportLongRunTotalMinutes({
  horizonWeeks,
  weekNumber,
}: {
  weekNumber: number;
  horizonWeeks: number;
}) {
  if (weekNumber >= horizonWeeks - 1) {
    return 40;
  }

  const cutbackWeeks = resolveRunningPlanCutbackWeeks(horizonWeeks);
  const buildLongRunWeeks = Array.from({ length: weekNumber }, (_, index) => index + 1).filter(
    (candidateWeek) => candidateWeek < horizonWeeks - 1 && !cutbackWeeks.includes(candidateWeek),
  );
  const buildIndex = Math.max(0, buildLongRunWeeks.length - 1);

  return Math.min(75, 35 + buildIndex * 5);
}

function resolveLowSupportCutbackLongRunTotalMinutes({
  horizonWeeks,
  weekNumber,
}: {
  weekNumber: number;
  horizonWeeks: number;
}) {
  const previousLongRunMinutes = resolveLowSupportLongRunTotalMinutes({
    horizonWeeks,
    weekNumber: Math.max(1, weekNumber - 1),
  });

  return Math.max(30, roundToFive(previousLongRunMinutes * 0.8));
}

function validateEarlyConsecutiveRunDays(
  rows: readonly TenKBeginnerDoseValidationRow[],
  issues: string[],
) {
  const datedRows = rows
    .filter((row) => row.date && row.weekNumber <= ADAPTATION_WEEKS)
    .sort((left, right) => left.date!.localeCompare(right.date!));

  let currentStreak = 0;
  let previousDate: string | null = null;

  for (const row of datedRows) {
    currentStreak =
      previousDate && diffDaysIso(row.date!, previousDate) === 1 ? currentStreak + 1 : 1;
    previousDate = row.date!;

    if (currentStreak > EARLY_PHASE_MAX_CONSECUTIVE_RUN_DAYS) {
      issues.push(
        `Low-support 10K adaptation must not exceed ${EARLY_PHASE_MAX_CONSECUTIVE_RUN_DAYS} consecutive running days (${row.rowId}).`,
      );
      return;
    }
  }
}

function validateLongRunProgression(
  entries: readonly {
    row: TenKBeginnerDoseValidationRow;
    durationMinutes: number;
  }[],
  issues: string[],
) {
  let previousBuildLongRun: {
    row: TenKBeginnerDoseValidationRow;
    durationMinutes: number;
  } | null = null;

  for (const entry of entries) {
    if (
      entry.row.weekNumber <= 1 ||
      entry.row.weekNumber >= maxWeek(entries.map(({ row }) => row))
    ) {
      previousBuildLongRun = entry;
      continue;
    }

    if (!previousBuildLongRun || entry.durationMinutes <= previousBuildLongRun.durationMinutes) {
      previousBuildLongRun = entry;
      continue;
    }

    const delta = entry.durationMinutes - previousBuildLongRun.durationMinutes;
    const relativeIncrease = delta / previousBuildLongRun.durationMinutes;
    if (delta > 10 || relativeIncrease > 0.15) {
      issues.push(
        `Low-support 10K long-run progression from ${previousBuildLongRun.row.rowId} to ${entry.row.rowId} exceeds 10 min / 15%.`,
      );
    }

    previousBuildLongRun = entry;
  }
}

function validateCutbackProgression(
  rows: readonly TenKBeginnerDoseValidationRow[],
  issues: string[],
) {
  const cutbackRows = rows.filter((row) => row.workoutDayKind === "cutback_long_run");
  const longRows = rows.filter((row) => row.workoutDayKind === "long_run");

  for (const cutbackRow of cutbackRows) {
    const previousLongRun = [...longRows]
      .reverse()
      .find((row) => row.weekNumber < cutbackRow.weekNumber);
    if (!previousLongRun) {
      continue;
    }

    const previousMinutes = rowDurationMinutes(previousLongRun);
    const cutbackMinutes = rowDurationMinutes(cutbackRow);
    const reduction = 1 - cutbackMinutes / previousMinutes;

    if (reduction < 0.15 || reduction > 0.25) {
      issues.push(
        `Low-support 10K cutback ${cutbackRow.rowId} must reduce the prior long run by 15-25%, got ${Math.round(reduction * 100)}%.`,
      );
    }
  }
}

function sumRowsDurationMinutes(rows: readonly TenKBeginnerDoseValidationRow[]) {
  return rows.reduce((total, row) => total + rowDurationMinutes(row), 0);
}

function rowDurationMinutes(row: TenKBeginnerDoseValidationRow) {
  return row.segments.reduce(
    (total, segment) => total + prescriptionDurationMinutes(segment.primaryPrescription),
    0,
  );
}

function prescriptionDurationMinutes(prescription: RunningPlanSegmentPrescription): number {
  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return rangeMinutes(prescription.durationSeconds);
    case "recovery_time":
      return rangeMinutes(prescription.recoveryDurationSeconds);
    case "free_run_with_cap":
      return rangeMinutes(prescription.durationSecondsOrDistanceMeters);
    case "repeat": {
      const repeatCount = prescription.repeatCount.min;
      const childMinutes = prescription.children.reduce(
        (total, child) =>
          total +
          (child.prescription.mode === "time"
            ? rangeMinutes(child.prescription.durationSeconds)
            : 0),
        0,
      );

      return repeatCount * childMinutes;
    }
    case "distance":
    case "distance_with_default_hr_cap":
    case "recovery_distance":
      return 0;
  }
}

function rangeMinutes(range: RunningPlanRange) {
  return range.min / 60;
}

function exactRange(value: number): RunningPlanRange {
  return { min: value, max: value };
}

function roundToFive(value: number) {
  return Math.round(value / 5) * 5;
}

function maxWeek(rows: readonly { weekNumber: number }[]) {
  return Math.max(0, ...rows.map((row) => row.weekNumber));
}

function formatMinutes(value: number) {
  return `${Number(value.toFixed(2))} min`;
}
