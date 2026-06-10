import {
  collectRunningPlanCompositionGrammarIssues,
  resolveRunningPlanCompositionWeek,
  type RunningPlanCompositionDevelopmentTouch,
} from "@/lib/plan-creation-engine/composition-grammar";
import type {
  RunningPlanPreviewCalendarRow,
  RunningPlanPreviewCalendarWorkoutDayKind,
  RunningPlanPreviewLoadContext,
} from "@/lib/plan-creation-engine/preview-builder-shared";
import type { RunningPlanRunnerLevel } from "@/lib/plan-creation-engine/source-types";

export const HALF_MARATHON_PLAN_BUILDER_WEEKS = 14 as const;
export const HALF_MARATHON_CUTBACK_WEEKS = [4, 8, 12] as const;
export const HALF_MARATHON_PENULTIMATE_WEEK = 13 as const;
export const HALF_MARATHON_ENDPOINT_WEEK = 14 as const;
export const HALF_MARATHON_ENDPOINT_DISTANCE_METERS = 21_100 as const;

export const HALF_MARATHON_DEVELOPMENT_TOUCH_VALUES = [
  "strides",
  "tempo",
  "threshold",
  "intervals",
  "hills",
] as const;

export type HalfMarathonDevelopmentTouch = (typeof HALF_MARATHON_DEVELOPMENT_TOUCH_VALUES)[number];

export interface HalfMarathonDiversityPolicyInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  weekNumber: number;
}

export interface HalfMarathonDiversityValidationInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  rows: readonly RunningPlanPreviewCalendarRow[];
}

export function resolveHalfMarathonDevelopmentTouch({
  runnerLevel,
  loadContext,
  weekNumber,
}: HalfMarathonDiversityPolicyInput): HalfMarathonDevelopmentTouch | null {
  return toHalfMarathonDevelopmentTouch(
    resolveRunningPlanCompositionWeek({
      family: "Half Marathon",
      runnerLevel,
      loadContext,
      weekNumber,
      horizonWeeks: HALF_MARATHON_PLAN_BUILDER_WEEKS,
    }).developmentTouch,
  );
}

export function validateHalfMarathonDiversityPolicy({
  runnerLevel,
  loadContext,
  rows,
}: HalfMarathonDiversityValidationInput): readonly string[] {
  const issues: string[] = [];
  const nonRestRows = rows.filter((row) => !row.isRestDay);
  const workoutKinds = new Set(nonRestRows.map((row) => row.workoutDayKind));

  validateHalfGlobalGates(workoutKinds, issues);
  validateHalfRunnerLevelGates({ runnerLevel, loadContext, workoutKinds, issues });
  validateHalfWeekRules(rows, issues);
  validateHalfRecoverySpacing(rows, issues);
  validateDevelopmentDensity(rows, issues);
  validateConservativeDurabilityIdentity({ loadContext, rows, issues });
  issues.push(
    ...collectRunningPlanCompositionGrammarIssues({
      family: "Half Marathon",
      runnerLevel,
      loadContext,
      horizonWeeks: HALF_MARATHON_PLAN_BUILDER_WEEKS,
      rows,
    }),
  );

  return issues;
}

function validateConservativeDurabilityIdentity({
  loadContext,
  rows,
  issues,
}: {
  loadContext: RunningPlanPreviewLoadContext;
  rows: readonly RunningPlanPreviewCalendarRow[];
  issues: string[];
}) {
  if (loadContext !== "conservative") {
    return;
  }

  const rowText = JSON.stringify(rows.filter((row) => !row.isRestDay));
  if (
    !/half_marathon_durability_tempo|half_marathon_aerobic_durability|controlled_steady_finish/.test(
      rowText,
    )
  ) {
    issues.push(
      "Conservative Half Marathon preview must keep half-specific durability in workout segments.",
    );
  }
}

export function isHalfMarathonDevelopmentTouch(
  kind: RunningPlanPreviewCalendarWorkoutDayKind,
): kind is HalfMarathonDevelopmentTouch {
  return HALF_MARATHON_DEVELOPMENT_TOUCH_VALUES.includes(kind as HalfMarathonDevelopmentTouch);
}

function toHalfMarathonDevelopmentTouch(
  touch: RunningPlanCompositionDevelopmentTouch | null,
): HalfMarathonDevelopmentTouch | null {
  return touch &&
    HALF_MARATHON_DEVELOPMENT_TOUCH_VALUES.includes(touch as HalfMarathonDevelopmentTouch)
    ? (touch as HalfMarathonDevelopmentTouch)
    : null;
}

function validateHalfGlobalGates(
  workoutKinds: ReadonlySet<RunningPlanPreviewCalendarWorkoutDayKind>,
  issues: string[],
) {
  const requiredKinds: readonly RunningPlanPreviewCalendarWorkoutDayKind[] = [
    "easy",
    "recovery",
    "long_run",
    "cutback_long_run",
    "final_selected_distance_day",
  ];

  for (const requiredKind of requiredKinds) {
    if (!workoutKinds.has(requiredKind)) {
      issues.push(`Half Marathon preview must include ${requiredKind}.`);
    }
  }

  if (workoutKinds.has("marathon_base_endpoint")) {
    issues.push("Half Marathon preview must not use marathon_base_endpoint.");
  }
}

function validateHalfRunnerLevelGates({
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
    issues.push("Half Marathon preview must block beginner_new_runner.");
    return;
  }

  if (!workoutKinds.has("strides")) {
    issues.push("Half Marathon preview must include strides.");
  }

  if (!workoutKinds.has("tempo") && !workoutKinds.has("threshold")) {
    issues.push("Half Marathon preview must include tempo or threshold development.");
  }

  if (runnerLevel === "sometimes_runs" && workoutKinds.has("threshold")) {
    issues.push("Half Marathon sometimes_runs preview must not include threshold.");
  }

  if (loadContext === "conservative") {
    for (const forbiddenKind of ["threshold", "intervals"] as const) {
      if (workoutKinds.has(forbiddenKind)) {
        issues.push(`Conservative Half Marathon preview must not include ${forbiddenKind}.`);
      }
    }
    return;
  }

  const isHigherSupport =
    runnerLevel === "runs_a_lot" || runnerLevel === "professional_competitive";
  if (isHigherSupport && !workoutKinds.has("threshold")) {
    issues.push(`${runnerLevel} standard-load Half Marathon preview must include threshold.`);
  }

  if (!workoutKinds.has("tempo")) {
    issues.push("Supported Half Marathon preview must include tempo.");
  }
}

function validateHalfWeekRules(rows: readonly RunningPlanPreviewCalendarRow[], issues: string[]) {
  for (const cutbackWeek of HALF_MARATHON_CUTBACK_WEEKS) {
    const weekRows = rowsForWeek(rows, cutbackWeek);
    if (!weekRows.some((row) => row.workoutDayKind === "cutback_long_run")) {
      issues.push(`Half Marathon week ${cutbackWeek} must include cutback_long_run.`);
    }

    for (const forbiddenKind of ["threshold", "intervals"] as const) {
      if (weekRows.some((row) => row.workoutDayKind === forbiddenKind)) {
        issues.push(`Half Marathon week ${cutbackWeek} must not include ${forbiddenKind}.`);
      }
    }
  }

  const penultimateRows = rowsForWeek(rows, HALF_MARATHON_PENULTIMATE_WEEK);
  if (!penultimateRows.some((row) => row.workoutDayKind === "strides")) {
    issues.push("Half Marathon penultimate week must include strides.");
  }
  for (const forbiddenKind of ["tempo", "threshold", "intervals", "hills"] as const) {
    if (penultimateRows.some((row) => row.workoutDayKind === forbiddenKind)) {
      issues.push(`Half Marathon penultimate week must not include ${forbiddenKind}.`);
    }
  }

  const endpointRows = rowsForWeek(rows, HALF_MARATHON_ENDPOINT_WEEK);
  const endpointNonRestRows = endpointRows.filter((row) => !row.isRestDay);
  if (!endpointNonRestRows.some((row) => row.workoutDayKind === "final_selected_distance_day")) {
    issues.push("Half Marathon final week must include final_selected_distance_day.");
  }
  for (const row of endpointNonRestRows) {
    if (
      row.workoutDayKind !== "final_selected_distance_day" &&
      row.workoutDayKind !== "easy" &&
      row.workoutDayKind !== "recovery"
    ) {
      issues.push("Half Marathon final-week non-endpoint workouts must stay easy or recovery.");
    }
  }
}

function validateHalfRecoverySpacing(
  rows: readonly RunningPlanPreviewCalendarRow[],
  issues: string[],
) {
  const recoveryRequiredAfter: readonly RunningPlanPreviewCalendarWorkoutDayKind[] = [
    "long_run",
    "cutback_long_run",
    "threshold",
    "intervals",
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
  for (let weekNumber = 1; weekNumber <= HALF_MARATHON_PLAN_BUILDER_WEEKS; weekNumber += 1) {
    const developmentCount = rows.filter(
      (row) => row.weekNumber === weekNumber && isHalfMarathonDevelopmentTouch(row.workoutDayKind),
    ).length;
    if (developmentCount > 1) {
      issues.push(`Half Marathon week ${weekNumber} has ${developmentCount} development touches.`);
    }
  }
}

function rowsForWeek(rows: readonly RunningPlanPreviewCalendarRow[], weekNumber: number) {
  return rows.filter((row) => row.weekNumber === weekNumber);
}
