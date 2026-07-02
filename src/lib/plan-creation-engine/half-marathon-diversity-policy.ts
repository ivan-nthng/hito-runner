import {
  collectRunningPlanCompositionGrammarIssues,
  resolveRunningPlanCompositionWeek,
  type RunningPlanCompositionDevelopmentTouch,
} from "@/lib/plan-creation-engine/composition-grammar";
import {
  isBeginnerHalfMarathonRunner,
  resolveBeginnerHalfMarathonAdaptationWeeks,
  resolveBeginnerHalfMarathonCutbackWeeks,
  resolveBeginnerHalfMarathonHorizonWeeks,
  resolveBeginnerHalfMarathonMinimumWeeks,
  type BeginnerHalfMarathonPolicyInput,
} from "@/lib/plan-creation-engine/beginner-half-marathon-policy";
import {
  resolveRunningPlanCutbackWeeks,
  resolveRunningPlanHorizonSelection,
} from "@/lib/plan-creation-engine/horizon-policy";
import { collectRunnerFacingPreviewRichnessIssues } from "@/lib/plan-creation-engine/runner-facing-richness";
import type {
  RunningPlanPreviewCalendarRow,
  RunningPlanPreviewCalendarWorkoutDayKind,
  RunningPlanPreviewLoadContext,
} from "@/lib/plan-creation-engine/preview-builder-shared";
import type {
  RunningPlanDaysPerWeek,
  RunningPlanRunnerLevel,
} from "@/lib/plan-creation-engine/source-types";

export const HALF_MARATHON_PLAN_BUILDER_WEEKS = 14 as const;
export const HALF_MARATHON_CUTBACK_WEEKS = [4, 8, 12] as const;
export const HALF_MARATHON_PENULTIMATE_WEEK = 13 as const;
export const HALF_MARATHON_ENDPOINT_WEEK = 14 as const;
export const HALF_MARATHON_ENDPOINT_DISTANCE_METERS = 21_100 as const;

export const HALF_MARATHON_DEVELOPMENT_TOUCH_VALUES = [
  "strides",
  "progression",
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
  horizonWeeks?: number;
}

export interface HalfMarathonDiversityValidationInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
  rows: readonly RunningPlanPreviewCalendarRow[];
}

export function resolveHalfMarathonBuilderWeeks({
  runnerLevel,
  loadContext,
  daysPerWeek,
}: BeginnerHalfMarathonPolicyInput) {
  return resolveRunningPlanHorizonSelection({
    family: "Half Marathon",
    runnerLevel,
    loadContext,
    daysPerWeek,
  }).horizonWeeks;
}

export function resolveHalfMarathonCutbackWeeks({
  runnerLevel,
  horizonWeeks,
}: BeginnerHalfMarathonPolicyInput & { horizonWeeks: number }) {
  if (isBeginnerHalfMarathonRunner(runnerLevel)) {
    return resolveBeginnerHalfMarathonCutbackWeeks(horizonWeeks);
  }

  return resolveRunningPlanCutbackWeeks(horizonWeeks);
}

export function resolveHalfMarathonDevelopmentTouch({
  runnerLevel,
  loadContext,
  weekNumber,
  horizonWeeks,
}: HalfMarathonDiversityPolicyInput): HalfMarathonDevelopmentTouch | null {
  return toHalfMarathonDevelopmentTouch(
    resolveRunningPlanCompositionWeek({
      family: "Half Marathon",
      runnerLevel,
      loadContext,
      weekNumber,
      horizonWeeks: horizonWeeks ?? HALF_MARATHON_PLAN_BUILDER_WEEKS,
    }).developmentTouch,
  );
}

export function validateHalfMarathonDiversityPolicy({
  runnerLevel,
  loadContext,
  daysPerWeek,
  rows,
}: HalfMarathonDiversityValidationInput): readonly string[] {
  const issues: string[] = [];
  const nonRestRows = rows.filter((row) => !row.isRestDay);
  const workoutKinds = new Set(nonRestRows.map((row) => row.workoutDayKind));
  const horizonWeeks = maxWeekNumber(rows);

  validateHalfGlobalGates(workoutKinds, issues);
  validateHalfRunnerLevelGates({
    runnerLevel,
    loadContext,
    daysPerWeek,
    horizonWeeks,
    workoutKinds,
    rows,
    issues,
  });
  validateHalfWeekRules({ rows, runnerLevel, loadContext, daysPerWeek, horizonWeeks, issues });
  validateHalfRecoverySpacing(rows, issues);
  validateDevelopmentDensity(rows, issues);
  validateConservativeDurabilityIdentity({ loadContext, rows, issues });
  issues.push(
    ...collectRunningPlanCompositionGrammarIssues({
      family: "Half Marathon",
      runnerLevel,
      loadContext,
      horizonWeeks,
      rows,
    }),
  );
  issues.push(
    ...collectRunnerFacingPreviewRichnessIssues({
      family: "Half Marathon",
      runnerLevel,
      loadContext,
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
}

function validateHalfRunnerLevelGates({
  runnerLevel,
  loadContext,
  daysPerWeek,
  horizonWeeks,
  workoutKinds,
  rows,
  issues,
}: {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
  horizonWeeks: number;
  workoutKinds: ReadonlySet<RunningPlanPreviewCalendarWorkoutDayKind>;
  rows: readonly RunningPlanPreviewCalendarRow[];
  issues: string[];
}) {
  if (isBeginnerHalfMarathonRunner(runnerLevel)) {
    validateBeginnerHalfMarathonBridgeGates({
      loadContext,
      daysPerWeek,
      horizonWeeks,
      workoutKinds,
      rows,
      issues,
    });
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

function validateBeginnerHalfMarathonBridgeGates({
  loadContext,
  daysPerWeek,
  horizonWeeks,
  workoutKinds,
  rows,
  issues,
}: {
  loadContext: RunningPlanPreviewLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
  horizonWeeks: number;
  workoutKinds: ReadonlySet<RunningPlanPreviewCalendarWorkoutDayKind>;
  rows: readonly RunningPlanPreviewCalendarRow[];
  issues: string[];
}) {
  const minimumWeeks = resolveBeginnerHalfMarathonMinimumWeeks({ loadContext, daysPerWeek });
  if (horizonWeeks < minimumWeeks) {
    issues.push(
      `Beginner Half Marathon bridge horizon must be at least ${minimumWeeks} weeks for ${daysPerWeek}d ${loadContext} load.`,
    );
  }

  const preferredWeeks = resolveBeginnerHalfMarathonHorizonWeeks({
    runnerLevel: "beginner_new_runner",
    loadContext,
    daysPerWeek,
  } satisfies BeginnerHalfMarathonPolicyInput);
  if (preferredWeeks && horizonWeeks !== preferredWeeks) {
    issues.push(
      `Beginner Half Marathon bridge horizon must be ${preferredWeeks} weeks for ${daysPerWeek}d ${loadContext} load.`,
    );
  }

  for (const forbiddenKind of ["threshold", "intervals", "hills"] as const) {
    if (workoutKinds.has(forbiddenKind)) {
      issues.push(`Beginner Half Marathon bridge must not include ${forbiddenKind}.`);
    }
  }

  const strideCount = rows.filter((row) => row.workoutDayKind === "strides").length;
  const minimumStrides = loadContext === "standard" && daysPerWeek === 5 ? 3 : 2;
  if (strideCount < minimumStrides) {
    issues.push(
      `Beginner Half Marathon bridge must include at least ${minimumStrides} strides weeks.`,
    );
  }

  const tempoLikeCount = rows.filter((row) => row.workoutDayKind === "tempo").length;
  const minimumTempoLike =
    loadContext === "conservative" ? (daysPerWeek === 3 ? 0 : 1) : daysPerWeek === 3 ? 1 : 2;
  if (tempoLikeCount < minimumTempoLike) {
    issues.push(
      `Beginner Half Marathon bridge must include at least ${minimumTempoLike} late tempo-like durability weeks.`,
    );
  }

  const cutbackCount = rows.filter((row) => row.workoutDayKind === "cutback_long_run").length;
  const minimumCutbacks = loadContext === "conservative" && daysPerWeek === 3 ? 5 : 4;
  if (cutbackCount < minimumCutbacks) {
    issues.push(
      `Beginner Half Marathon bridge must include at least ${minimumCutbacks} cutback long runs.`,
    );
  }

  const rowText = JSON.stringify(rows.filter((row) => !row.isRestDay));
  if (!/beginner_run_walk_adaptation|run-walk/i.test(rowText)) {
    issues.push("Beginner Half Marathon bridge must include run-walk adaptation evidence.");
  }
  if (!/half_marathon_aerobic_durability|half_marathon_endurance_base/.test(rowText)) {
    issues.push("Beginner Half Marathon bridge long runs must carry durability identity.");
  }
}

function validateHalfWeekRules({
  rows,
  runnerLevel,
  loadContext,
  daysPerWeek,
  horizonWeeks,
  issues,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
  horizonWeeks: number;
  issues: string[];
}) {
  const cutbackWeeks = isBeginnerHalfMarathonRunner(runnerLevel)
    ? resolveBeginnerHalfMarathonCutbackWeeks(horizonWeeks)
    : resolveRunningPlanCutbackWeeks(horizonWeeks);
  const penultimateWeek = horizonWeeks - 1;
  const endpointWeek = horizonWeeks;

  for (const cutbackWeek of cutbackWeeks) {
    const weekRows = rowsForWeek(rows, cutbackWeek);
    if (!weekRows.some((row) => row.workoutDayKind === "cutback_long_run")) {
      issues.push(`Half Marathon week ${cutbackWeek} must include cutback_long_run.`);
    }

    const forbiddenCutbackKinds: readonly RunningPlanPreviewCalendarWorkoutDayKind[] =
      isBeginnerHalfMarathonRunner(runnerLevel)
        ? ["progression", "tempo", "threshold", "intervals", "hills"]
        : ["threshold", "intervals"];
    for (const forbiddenKind of forbiddenCutbackKinds) {
      if (weekRows.some((row) => row.workoutDayKind === forbiddenKind)) {
        issues.push(`Half Marathon week ${cutbackWeek} must not include ${forbiddenKind}.`);
      }
    }
  }

  const penultimateRows = rowsForWeek(rows, penultimateWeek);
  if (!penultimateRows.some((row) => row.workoutDayKind === "strides")) {
    issues.push("Half Marathon penultimate week must include strides.");
  }
  for (const forbiddenKind of [
    "progression",
    "tempo",
    "threshold",
    "intervals",
    "hills",
  ] as const) {
    if (penultimateRows.some((row) => row.workoutDayKind === forbiddenKind)) {
      issues.push(`Half Marathon penultimate week must not include ${forbiddenKind}.`);
    }
  }

  const endpointRows = rowsForWeek(rows, endpointWeek);
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

  if (isBeginnerHalfMarathonRunner(runnerLevel)) {
    validateBeginnerHalfNoEarlyStrides({
      rows,
      loadContext,
      daysPerWeek,
      issues,
    });
  }
}

function validateHalfRecoverySpacing(
  rows: readonly RunningPlanPreviewCalendarRow[],
  issues: string[],
) {
  const recoveryRequiredAfter: readonly RunningPlanPreviewCalendarWorkoutDayKind[] = [
    "long_run",
    "cutback_long_run",
    "progression",
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
  const horizonWeeks = maxWeekNumber(rows);

  for (let weekNumber = 1; weekNumber <= horizonWeeks; weekNumber += 1) {
    const developmentCount = rows.filter(
      (row) => row.weekNumber === weekNumber && isHalfMarathonDevelopmentTouch(row.workoutDayKind),
    ).length;
    if (developmentCount > 1) {
      issues.push(`Half Marathon week ${weekNumber} has ${developmentCount} development touches.`);
    }
  }
}

function validateBeginnerHalfNoEarlyStrides({
  rows,
  loadContext,
  daysPerWeek,
  issues,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  loadContext: RunningPlanPreviewLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
  issues: string[];
}) {
  const adaptationWeeks = Math.max(
    1,
    Math.floor(resolveBeginnerHalfMarathonAdaptationWeeks({ loadContext, daysPerWeek }) / 2),
  );
  const earlyStrideRow = rows.find(
    (row) => row.workoutDayKind === "strides" && row.weekNumber <= adaptationWeeks,
  );

  if (earlyStrideRow) {
    issues.push(
      `Beginner Half Marathon bridge must not include strides in early adaptation week ${earlyStrideRow.weekNumber}.`,
    );
  }
}

function rowsForWeek(rows: readonly RunningPlanPreviewCalendarRow[], weekNumber: number) {
  return rows.filter((row) => row.weekNumber === weekNumber);
}

function maxWeekNumber(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return Math.max(0, ...rows.map((row) => row.weekNumber));
}
