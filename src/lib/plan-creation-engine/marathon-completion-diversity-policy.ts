import {
  collectRunningPlanCompositionGrammarIssues,
  type RunningPlanCompositionDevelopmentTouch,
} from "@/lib/plan-creation-engine/composition-grammar";
import { findForbiddenRunnerFacingLanguageMatches } from "@/lib/plan-creation-engine/forbidden-runner-facing-language";
import {
  MARATHON_COMPLETION_DEVELOPMENT_TOUCH_VALUES,
  MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
  resolveMarathonCompletionCutbackWeeks,
  resolveMarathonCompletionDevelopmentTouch,
  resolveMarathonCompletionEndpointWeek,
  resolveMarathonCompletionTaperWeek,
  type MarathonCompletionDevelopmentTouch,
} from "@/lib/plan-creation-engine/marathon-completion-policy";
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

export { MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS };

export interface MarathonCompletionDiversityPolicyInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  weekNumber: number;
  horizonWeeks: number;
}

export interface MarathonCompletionDiversityValidationInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
  rows: readonly RunningPlanPreviewCalendarRow[];
}

export function resolveMarathonCompletionBuilderDevelopmentTouch(
  input: MarathonCompletionDiversityPolicyInput,
): MarathonCompletionDevelopmentTouch | null {
  return toMarathonCompletionDevelopmentTouch(resolveMarathonCompletionDevelopmentTouch(input));
}

export function validateMarathonCompletionDiversityPolicy({
  runnerLevel,
  loadContext,
  daysPerWeek,
  rows,
}: MarathonCompletionDiversityValidationInput): readonly string[] {
  const issues: string[] = [];
  const nonRestRows = rows.filter((row) => !row.isRestDay);
  const workoutKinds = new Set(nonRestRows.map((row) => row.workoutDayKind));
  const horizonWeeks = maxWeekNumber(rows);

  validateMarathonCompletionGlobalGates(workoutKinds, rows, issues);
  validateMarathonCompletionRunnerLevelGates({
    runnerLevel,
    loadContext,
    daysPerWeek,
    workoutKinds,
    rows,
    issues,
  });
  validateMarathonCompletionWeekRules({ rows, horizonWeeks, issues });
  validateMarathonCompletionRecoverySpacing(rows, issues);
  validateMarathonCompletionDevelopmentDensity({ rows, horizonWeeks, issues });
  validateMarathonCompletionIdentitySignals({ rows, runnerLevel, issues });
  validateMarathonCompletionAntiFlatness({ rows, horizonWeeks, issues });
  issues.push(
    ...collectRunningPlanCompositionGrammarIssues({
      family: "Marathon Completion",
      runnerLevel,
      loadContext,
      horizonWeeks,
      rows,
    }),
  );
  issues.push(
    ...collectRunnerFacingPreviewRichnessIssues({
      family: "Marathon Completion",
      runnerLevel,
      loadContext,
      rows,
    }),
  );

  return issues;
}

export function isMarathonCompletionDevelopmentTouch(
  kind: RunningPlanPreviewCalendarWorkoutDayKind,
): kind is MarathonCompletionDevelopmentTouch {
  return MARATHON_COMPLETION_DEVELOPMENT_TOUCH_VALUES.includes(
    kind as MarathonCompletionDevelopmentTouch,
  );
}

function toMarathonCompletionDevelopmentTouch(
  touch: RunningPlanCompositionDevelopmentTouch | null,
): MarathonCompletionDevelopmentTouch | null {
  return touch &&
    MARATHON_COMPLETION_DEVELOPMENT_TOUCH_VALUES.includes(
      touch as MarathonCompletionDevelopmentTouch,
    )
    ? (touch as MarathonCompletionDevelopmentTouch)
    : null;
}

function validateMarathonCompletionGlobalGates(
  workoutKinds: ReadonlySet<RunningPlanPreviewCalendarWorkoutDayKind>,
  rows: readonly RunningPlanPreviewCalendarRow[],
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
      issues.push(`Marathon Completion preview must include ${requiredKind}.`);
    }
  }

  for (const forbiddenKind of [
    "marathon_base_endpoint",
    "threshold",
    "intervals",
    "hills",
  ] as const) {
    if (workoutKinds.has(forbiddenKind)) {
      issues.push(`Marathon Completion preview must not include ${forbiddenKind}.`);
    }
  }

  const text = JSON.stringify(rows);
  const forbiddenRunnerFacingMatches = findForbiddenRunnerFacingLanguageMatches(rows);
  const marathonPerformanceLeakSignals = new Set(
    forbiddenRunnerFacingMatches.map((match) => match.signal),
  );
  if (
    marathonPerformanceLeakSignals.has("race_pace_claim") ||
    marathonPerformanceLeakSignals.has("goal_pace_claim") ||
    marathonPerformanceLeakSignals.has("target_pace_claim") ||
    marathonPerformanceLeakSignals.has("target_time_claim") ||
    marathonPerformanceLeakSignals.has("race_readiness_claim") ||
    marathonPerformanceLeakSignals.has("race_peak_claim") ||
    /sub-|boston/i.test(text)
  ) {
    issues.push("Marathon Completion preview must not imply target-time race readiness.");
  }
}

function validateMarathonCompletionRunnerLevelGates({
  runnerLevel,
  loadContext,
  daysPerWeek,
  workoutKinds,
  rows,
  issues,
}: {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
  workoutKinds: ReadonlySet<RunningPlanPreviewCalendarWorkoutDayKind>;
  rows: readonly RunningPlanPreviewCalendarRow[];
  issues: string[];
}) {
  if (runnerLevel === "beginner_new_runner") {
    for (const forbiddenKind of [
      "progression",
      "tempo",
      "threshold",
      "intervals",
      "hills",
    ] as const) {
      if (workoutKinds.has(forbiddenKind)) {
        issues.push(`Beginner Marathon Completion preview must not include ${forbiddenKind}.`);
      }
    }

    assertMinimumKindCount(
      rows,
      "strides",
      daysPerWeek === 5 && loadContext === "standard" ? 4 : 3,
      issues,
    );
    assertMinimumKindCount(
      rows,
      "steady_aerobic_run",
      loadContext === "conservative" ? 3 : 4,
      issues,
    );
    return;
  }

  assertMinimumKindCount(rows, "strides", 2, issues);
  assertMinimumKindCount(
    rows,
    "steady_aerobic_run",
    loadContext === "conservative" ? 3 : 2,
    issues,
  );
  assertMinimumKindCount(rows, "progression", 2, issues);

  if (runnerLevel === "sometimes_runs" && loadContext === "standard") {
    assertMinimumKindCount(rows, "tempo", 2, issues);
  }

  if (runnerLevel === "runs_a_lot" && loadContext === "standard") {
    assertMinimumKindCount(rows, "tempo", 1, issues);
  }

  if (runnerLevel !== "sometimes_runs" && loadContext === "conservative") {
    assertMinimumKindCount(rows, "tempo", 2, issues);
  }
}

function validateMarathonCompletionWeekRules({
  rows,
  horizonWeeks,
  issues,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  horizonWeeks: number;
  issues: string[];
}) {
  const cutbackWeeks = resolveMarathonCompletionCutbackWeeks(horizonWeeks);
  const taperWeek = resolveMarathonCompletionTaperWeek(horizonWeeks);
  const endpointWeek = resolveMarathonCompletionEndpointWeek(horizonWeeks);

  for (const cutbackWeek of cutbackWeeks) {
    const weekRows = rowsForWeek(rows, cutbackWeek);
    if (!weekRows.some((row) => row.workoutDayKind === "cutback_long_run")) {
      issues.push(`Marathon Completion week ${cutbackWeek} must include cutback_long_run.`);
    }

    if (weekRows.some((row) => isMarathonCompletionDevelopmentTouch(row.workoutDayKind))) {
      issues.push(
        `Marathon Completion week ${cutbackWeek} must keep cutback free of development touch.`,
      );
    }
  }

  const taperRows = rowsForWeek(rows, taperWeek);
  if (!taperRows.some((row) => row.workoutDayKind === "long_run")) {
    issues.push("Marathon Completion taper week must include a reduced long run.");
  }
  if (!taperRows.some((row) => row.workoutDayKind === "strides")) {
    issues.push("Marathon Completion taper week must include light strides.");
  }
  for (const forbiddenKind of [
    "progression",
    "tempo",
    "threshold",
    "intervals",
    "hills",
  ] as const) {
    if (taperRows.some((row) => row.workoutDayKind === forbiddenKind)) {
      issues.push(`Marathon Completion taper week must not include ${forbiddenKind}.`);
    }
  }

  const endpointRows = rowsForWeek(rows, endpointWeek);
  const endpointNonRestRows = endpointRows.filter((row) => !row.isRestDay);
  if (!endpointNonRestRows.some((row) => row.workoutDayKind === "final_selected_distance_day")) {
    issues.push("Marathon Completion final week must include final_selected_distance_day.");
  }
  for (const row of endpointNonRestRows) {
    if (
      row.workoutDayKind !== "final_selected_distance_day" &&
      row.workoutDayKind !== "easy" &&
      row.workoutDayKind !== "recovery"
    ) {
      issues.push(
        "Marathon Completion final-week non-endpoint workouts must stay easy or recovery.",
      );
    }
  }
}

function validateMarathonCompletionRecoverySpacing(
  rows: readonly RunningPlanPreviewCalendarRow[],
  issues: string[],
) {
  const recoveryRequiredAfter: readonly RunningPlanPreviewCalendarWorkoutDayKind[] = [
    "long_run",
    "cutback_long_run",
    "progression",
    "tempo",
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

function validateMarathonCompletionDevelopmentDensity({
  rows,
  horizonWeeks,
  issues,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  horizonWeeks: number;
  issues: string[];
}) {
  for (let weekNumber = 1; weekNumber <= horizonWeeks; weekNumber += 1) {
    const developmentCount = rows.filter(
      (row) =>
        row.weekNumber === weekNumber && isMarathonCompletionDevelopmentTouch(row.workoutDayKind),
    ).length;
    if (developmentCount > 1) {
      issues.push(
        `Marathon Completion week ${weekNumber} has ${developmentCount} development touches.`,
      );
    }
  }
}

function validateMarathonCompletionIdentitySignals({
  rows,
  runnerLevel,
  issues,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  runnerLevel: RunningPlanRunnerLevel;
  issues: string[];
}) {
  const nonRestText = JSON.stringify(rows.filter((row) => !row.isRestDay));
  const requiredPatterns: readonly RegExp[] = [
    /marathon_completion_exact_endpoint/,
    /marathon_completion_time_on_feet/,
    /marathon_completion_long_run_durability/,
    /marathon_completion_cutback_protection/,
    /marathon_completion_taper/,
  ];

  for (const pattern of requiredPatterns) {
    if (!pattern.test(nonRestText)) {
      issues.push(`Marathon Completion preview missing identity signal ${String(pattern)}.`);
    }
  }

  if (
    !/marathon_completion_turnover|marathon_completion_steady_support|marathon_completion_progression_support|marathon_completion_specificity/.test(
      nonRestText,
    )
  ) {
    issues.push("Marathon Completion preview must include recurring midweek support identity.");
  }

  if (
    runnerLevel === "beginner_new_runner" &&
    !/marathon_completion_run_walk_adaptation/.test(nonRestText)
  ) {
    issues.push("Beginner Marathon Completion preview must include run-walk adaptation evidence.");
  }
}

function validateMarathonCompletionAntiFlatness({
  rows,
  horizonWeeks,
  issues,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  horizonWeeks: number;
  issues: string[];
}) {
  const developmentWeeks = uniqueNumbers(
    rows
      .filter((row) => !row.isRestDay && isMarathonCompletionDevelopmentTouch(row.workoutDayKind))
      .map((row) => row.weekNumber),
  );
  const adaptationWeeks = uniqueNumbers(
    rows
      .filter(
        (row) =>
          !row.isRestDay && JSON.stringify(row.segments).includes("marathon_completion_run_walk"),
      )
      .map((row) => row.weekNumber),
  );
  const identityWeeks = uniqueNumbers([...adaptationWeeks, ...developmentWeeks]);
  const observedGap = maxDevelopmentWeekGap(identityWeeks, horizonWeeks);

  if (identityWeeks.length < 5 || observedGap > 14) {
    issues.push(
      `Marathon Completion preview has excessive identity desert: ${identityWeeks.join(", ") || "none"}.`,
    );
  }
}

function assertMinimumKindCount(
  rows: readonly RunningPlanPreviewCalendarRow[],
  kind: RunningPlanPreviewCalendarWorkoutDayKind,
  minimumCount: number,
  issues: string[],
) {
  const count = rows.filter((row) => row.workoutDayKind === kind).length;
  if (count < minimumCount) {
    issues.push(`Marathon Completion preview must include at least ${minimumCount} ${kind} rows.`);
  }
}

function rowsForWeek(rows: readonly RunningPlanPreviewCalendarRow[], weekNumber: number) {
  return rows.filter((row) => row.weekNumber === weekNumber);
}

function maxWeekNumber(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return Math.max(...rows.map((row) => row.weekNumber));
}

function maxDevelopmentWeekGap(developmentWeeks: readonly number[], horizonWeeks: number) {
  if (developmentWeeks.length === 0) {
    return horizonWeeks;
  }

  const sortedWeeks = [...developmentWeeks].sort((a, b) => a - b);
  const gaps = [sortedWeeks[0]! - 1];

  for (let index = 1; index < sortedWeeks.length; index += 1) {
    gaps.push(sortedWeeks[index]! - sortedWeeks[index - 1]!);
  }

  gaps.push(horizonWeeks - sortedWeeks[sortedWeeks.length - 1]!);

  return Math.max(...gaps);
}

function uniqueNumbers(values: readonly number[]) {
  return [...new Set(values)];
}
