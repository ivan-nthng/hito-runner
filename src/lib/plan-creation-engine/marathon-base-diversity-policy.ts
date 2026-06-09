import type {
  RunningPlanPreviewCalendarRow,
  RunningPlanPreviewCalendarWorkoutDayKind,
  RunningPlanPreviewLoadContext,
} from "@/lib/plan-creation-engine/preview-builder-shared";
import type {
  RunningPlanRunnerLevel,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";

export const MARATHON_BASE_PLAN_BUILDER_WEEKS = 16 as const;
export const MARATHON_BASE_CUTBACK_WEEKS = [4, 8, 12] as const;
export const MARATHON_BASE_PENULTIMATE_WEEK = 15 as const;
export const MARATHON_BASE_ENDPOINT_WEEK = 16 as const;

export const MARATHON_BASE_DEVELOPMENT_TOUCH_VALUES = [
  "strides",
  "tempo",
  "threshold",
  "hills",
] as const;

export type MarathonBaseDevelopmentTouch = (typeof MARATHON_BASE_DEVELOPMENT_TOUCH_VALUES)[number];

export interface MarathonBaseDiversityPolicyInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  weekNumber: number;
}

export interface MarathonBaseDiversityValidationInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  rows: readonly RunningPlanPreviewCalendarRow[];
}

export function resolveMarathonBaseDevelopmentTouch({
  runnerLevel,
  loadContext,
  weekNumber,
}: MarathonBaseDiversityPolicyInput): MarathonBaseDevelopmentTouch | null {
  if (weekNumber === MARATHON_BASE_ENDPOINT_WEEK) {
    return null;
  }

  if (MARATHON_BASE_CUTBACK_WEEKS.includes(weekNumber as never)) {
    return null;
  }

  if (weekNumber === MARATHON_BASE_PENULTIMATE_WEEK) {
    return "strides";
  }

  if (runnerLevel === "beginner_new_runner") {
    return null;
  }

  if (loadContext === "conservative") {
    return resolveConservativeMarathonBaseTouch(runnerLevel, weekNumber);
  }

  return resolveStandardMarathonBaseTouch(runnerLevel, weekNumber);
}

export function validateMarathonBaseDiversityPolicy({
  runnerLevel,
  loadContext,
  rows,
}: MarathonBaseDiversityValidationInput): readonly string[] {
  const issues: string[] = [];
  const nonRestRows = rows.filter((row) => !row.isRestDay);
  const workoutKinds = new Set(nonRestRows.map((row) => row.workoutDayKind));

  validateMarathonBaseGlobalGates(workoutKinds, rows, issues);
  validateMarathonBaseRunnerLevelGates({ runnerLevel, loadContext, workoutKinds, issues });
  validateMarathonBaseWeekRules(rows, issues);
  validateMarathonBaseRecoverySpacing(rows, issues);
  validateDevelopmentDensity(rows, issues);

  return issues;
}

export function isMarathonBaseDevelopmentTouch(
  kind: RunningPlanPreviewCalendarWorkoutDayKind,
): kind is MarathonBaseDevelopmentTouch {
  return MARATHON_BASE_DEVELOPMENT_TOUCH_VALUES.includes(kind as MarathonBaseDevelopmentTouch);
}

function resolveConservativeMarathonBaseTouch(
  runnerLevel: Exclude<RunningPlanRunnerLevel, "beginner_new_runner">,
  weekNumber: number,
): MarathonBaseDevelopmentTouch | null {
  if (weekNumber === 2 || weekNumber === 6) {
    return "strides";
  }

  if (runnerLevel !== "sometimes_runs" && (weekNumber === 3 || weekNumber === 10)) {
    return "tempo";
  }

  return null;
}

function resolveStandardMarathonBaseTouch(
  runnerLevel: Exclude<RunningPlanRunnerLevel, "beginner_new_runner">,
  weekNumber: number,
): MarathonBaseDevelopmentTouch | null {
  switch (weekNumber) {
    case 2:
      return "strides";
    case 3:
    case 10:
      return "tempo";
    case 6:
      if (runnerLevel === "runs_a_lot" || runnerLevel === "professional_competitive") {
        return "threshold";
      }
      return "strides";
    case 13:
      return runnerLevel === "sometimes_runs" ? "tempo" : "hills";
    case 14:
      return runnerLevel === "professional_competitive" ? "threshold" : null;
    default:
      return null;
  }
}

function validateMarathonBaseGlobalGates(
  workoutKinds: ReadonlySet<RunningPlanPreviewCalendarWorkoutDayKind>,
  rows: readonly RunningPlanPreviewCalendarRow[],
  issues: string[],
) {
  const requiredKinds: readonly RunningPlanPreviewCalendarWorkoutDayKind[] = [
    "easy",
    "recovery",
    "long_run",
    "cutback_long_run",
    "marathon_base_endpoint",
  ];

  for (const requiredKind of requiredKinds) {
    if (!workoutKinds.has(requiredKind)) {
      issues.push(`Marathon Base preview must include ${requiredKind}.`);
    }
  }

  if (workoutKinds.has("final_selected_distance_day")) {
    issues.push("Marathon Base preview must not use final_selected_distance_day.");
  }

  if (workoutKinds.has("intervals")) {
    issues.push("Marathon Base preview must not include intervals.");
  }

  const text = JSON.stringify(rows);
  if (/42195|42\.195|full_marathon|race_readiness|race_peak|race_pace|target_time/i.test(text)) {
    issues.push("Marathon Base preview must not imply full marathon race readiness.");
  }
}

function validateMarathonBaseRunnerLevelGates({
  runnerLevel,
  loadContext,
  workoutKinds,
  issues,
}: {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  workoutKinds: ReadonlySet<RunningPlanPreviewCalendarWorkoutDayKind>;
  issues: string[];
}) {
  if (runnerLevel === "beginner_new_runner") {
    issues.push("Marathon Base preview must block beginner_new_runner.");
    return;
  }

  if (!workoutKinds.has("strides")) {
    issues.push("Marathon Base preview must include strides.");
  }

  if (loadContext === "standard" && !workoutKinds.has("tempo")) {
    issues.push("Standard-load Marathon Base preview must include tempo.");
  }

  if (runnerLevel === "sometimes_runs" && workoutKinds.has("threshold")) {
    issues.push("Marathon Base sometimes_runs preview must not include threshold.");
  }

  if (loadContext === "conservative" && workoutKinds.has("threshold")) {
    issues.push("Conservative Marathon Base preview must not include threshold.");
  }
}

function validateMarathonBaseWeekRules(
  rows: readonly RunningPlanPreviewCalendarRow[],
  issues: string[],
) {
  for (const cutbackWeek of MARATHON_BASE_CUTBACK_WEEKS) {
    const weekRows = rowsForWeek(rows, cutbackWeek);
    if (!weekRows.some((row) => row.workoutDayKind === "cutback_long_run")) {
      issues.push(`Marathon Base week ${cutbackWeek} must include cutback_long_run.`);
    }

    for (const forbiddenKind of ["threshold", "hills", "intervals"] as const) {
      if (weekRows.some((row) => row.workoutDayKind === forbiddenKind)) {
        issues.push(`Marathon Base week ${cutbackWeek} must not include ${forbiddenKind}.`);
      }
    }
  }

  const penultimateRows = rowsForWeek(rows, MARATHON_BASE_PENULTIMATE_WEEK);
  if (!penultimateRows.some((row) => row.workoutDayKind === "strides")) {
    issues.push("Marathon Base penultimate week must include strides.");
  }
  for (const forbiddenKind of ["tempo", "threshold", "hills", "intervals"] as const) {
    if (penultimateRows.some((row) => row.workoutDayKind === forbiddenKind)) {
      issues.push(`Marathon Base penultimate week must not include ${forbiddenKind}.`);
    }
  }

  const endpointRows = rowsForWeek(rows, MARATHON_BASE_ENDPOINT_WEEK);
  const endpointNonRestRows = endpointRows.filter((row) => !row.isRestDay);
  if (!endpointNonRestRows.some((row) => row.workoutDayKind === "marathon_base_endpoint")) {
    issues.push("Marathon Base final week must include marathon_base_endpoint.");
  }
  for (const row of endpointNonRestRows) {
    if (
      row.workoutDayKind !== "marathon_base_endpoint" &&
      row.workoutDayKind !== "easy" &&
      row.workoutDayKind !== "recovery"
    ) {
      issues.push("Marathon Base final-week non-endpoint workouts must stay easy or recovery.");
    }
  }
}

function validateMarathonBaseRecoverySpacing(
  rows: readonly RunningPlanPreviewCalendarRow[],
  issues: string[],
) {
  const recoveryRequiredAfter: readonly RunningPlanPreviewCalendarWorkoutDayKind[] = [
    "long_run",
    "cutback_long_run",
    "threshold",
    "hills",
  ];

  for (const row of rows) {
    if (!recoveryRequiredAfter.includes(row.workoutDayKind)) {
      continue;
    }

    const nextRunningRow = rows.find(
      (candidate) => candidate.dayNumber > row.dayNumber && !candidate.isRestDay,
    );
    if (!nextRunningRow) {
      continue;
    }

    if (nextRunningRow.workoutDayKind !== "recovery" && nextRunningRow.workoutDayKind !== "easy") {
      issues.push(
        `Next running row after ${row.workoutDayKind} must be recovery/easy, got ${nextRunningRow.workoutDayKind}.`,
      );
    }
  }
}

function validateDevelopmentDensity(
  rows: readonly RunningPlanPreviewCalendarRow[],
  issues: string[],
) {
  for (let weekNumber = 1; weekNumber <= MARATHON_BASE_PLAN_BUILDER_WEEKS; weekNumber += 1) {
    const developmentCount = rows.filter(
      (row) => row.weekNumber === weekNumber && isMarathonBaseDevelopmentTouch(row.workoutDayKind),
    ).length;
    if (developmentCount > 1) {
      issues.push(`Marathon Base week ${weekNumber} has ${developmentCount} development touches.`);
    }
  }
}

function rowsForWeek(rows: readonly RunningPlanPreviewCalendarRow[], weekNumber: number) {
  return rows.filter((row) => row.weekNumber === weekNumber);
}
