import {
  collectRunningPlanCompositionGrammarIssues,
  resolveRunningPlanCompositionWeek,
  type RunningPlanCompositionDevelopmentTouch,
} from "@/lib/plan-creation-engine/composition-grammar";
import { findForbiddenRunnerFacingLanguageMatches } from "@/lib/plan-creation-engine/forbidden-runner-facing-language";
import {
  resolveRunningPlanCutbackWeeks,
  resolveRunningPlanEndpointWeek,
  resolveRunningPlanTaperWeek,
} from "@/lib/plan-creation-engine/horizon-policy";
import { collectRunnerFacingPreviewRichnessIssues } from "@/lib/plan-creation-engine/runner-facing-richness";
import type {
  RunningPlanPreviewCalendarRow,
  RunningPlanPreviewCalendarWorkoutDayKind,
  RunningPlanPreviewLoadContext,
} from "@/lib/plan-creation-engine/preview-builder-shared";
import type { RunningPlanRunnerLevel } from "@/lib/plan-creation-engine/source-types";

export const MARATHON_BASE_PLAN_BUILDER_WEEKS = 16 as const;
export const MARATHON_BASE_CUTBACK_WEEKS = [4, 8, 12] as const;
export const MARATHON_BASE_PENULTIMATE_WEEK = 15 as const;
export const MARATHON_BASE_ENDPOINT_WEEK = 16 as const;

export const MARATHON_BASE_DEVELOPMENT_TOUCH_VALUES = [
  "strides",
  "steady_aerobic_run",
  "tempo",
  "threshold",
  "hills",
] as const;

export type MarathonBaseDevelopmentTouch = (typeof MARATHON_BASE_DEVELOPMENT_TOUCH_VALUES)[number];

export interface MarathonBaseDiversityPolicyInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  weekNumber: number;
  horizonWeeks: number;
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
  horizonWeeks,
}: MarathonBaseDiversityPolicyInput): MarathonBaseDevelopmentTouch | null {
  return toMarathonBaseDevelopmentTouch(
    resolveRunningPlanCompositionWeek({
      family: "Marathon Base",
      runnerLevel,
      loadContext,
      weekNumber,
      horizonWeeks,
    }).developmentTouch,
  );
}

export function resolveMarathonBaseCutbackWeeks(horizonWeeks: number) {
  return resolveRunningPlanCutbackWeeks(horizonWeeks);
}

export function resolveMarathonBaseEndpointWeek(horizonWeeks: number) {
  return resolveRunningPlanEndpointWeek(horizonWeeks);
}

export function resolveMarathonBaseTaperWeek(horizonWeeks: number) {
  return resolveRunningPlanTaperWeek(horizonWeeks);
}

export function validateMarathonBaseDiversityPolicy({
  runnerLevel,
  loadContext,
  rows,
}: MarathonBaseDiversityValidationInput): readonly string[] {
  const issues: string[] = [];
  const nonRestRows = rows.filter((row) => !row.isRestDay);
  const workoutKinds = new Set(nonRestRows.map((row) => row.workoutDayKind));
  const horizonWeeks = maxWeekNumber(rows);

  validateMarathonBaseGlobalGates(workoutKinds, rows, issues);
  validateMarathonBaseRunnerLevelGates({ runnerLevel, loadContext, workoutKinds, rows, issues });
  validateMarathonBaseWeekRules({ rows, horizonWeeks, issues });
  validateMarathonBaseRecoverySpacing(rows, issues);
  validateDevelopmentDensity({ rows, horizonWeeks, issues });
  validateLongHorizonAntiFlatness({ runnerLevel, loadContext, rows, horizonWeeks, issues });
  validateConservativeDurabilityIdentity({ loadContext, rows, issues });
  issues.push(
    ...collectRunningPlanCompositionGrammarIssues({
      family: "Marathon Base",
      runnerLevel,
      loadContext,
      horizonWeeks,
      rows,
    }),
  );
  issues.push(
    ...collectRunnerFacingPreviewRichnessIssues({
      family: "Marathon Base",
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
  const durabilitySignalPattern =
    /marathon_base_time_on_feet|marathon_base_steady_finish|durability_steady_finish/;
  const hasDurabilitySignal = durabilitySignalPattern.test(rowText);

  if (!hasDurabilitySignal) {
    issues.push(
      "Conservative Marathon Base preview must keep time-on-feet or steady-finish long-run identity.",
    );
  }
}

export function isMarathonBaseDevelopmentTouch(
  kind: RunningPlanPreviewCalendarWorkoutDayKind,
): kind is MarathonBaseDevelopmentTouch {
  return MARATHON_BASE_DEVELOPMENT_TOUCH_VALUES.includes(kind as MarathonBaseDevelopmentTouch);
}

function toMarathonBaseDevelopmentTouch(
  touch: RunningPlanCompositionDevelopmentTouch | null,
): MarathonBaseDevelopmentTouch | null {
  return touch &&
    MARATHON_BASE_DEVELOPMENT_TOUCH_VALUES.includes(touch as MarathonBaseDevelopmentTouch)
    ? (touch as MarathonBaseDevelopmentTouch)
    : null;
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
  const forbiddenRunnerFacingSignals = new Set(
    findForbiddenRunnerFacingLanguageMatches(rows).map((match) => match.signal),
  );
  if (
    /42195|42\.195|full[\s_-]*marathon/i.test(text) ||
    forbiddenRunnerFacingSignals.has("race_readiness_claim") ||
    forbiddenRunnerFacingSignals.has("race_peak_claim") ||
    forbiddenRunnerFacingSignals.has("race_pace_claim") ||
    forbiddenRunnerFacingSignals.has("target_time_claim")
  ) {
    issues.push("Marathon Base preview must not imply full marathon race readiness.");
  }
}

function validateMarathonBaseRunnerLevelGates({
  runnerLevel,
  loadContext,
  workoutKinds,
  rows,
  issues,
}: {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  workoutKinds: ReadonlySet<RunningPlanPreviewCalendarWorkoutDayKind>;
  rows: readonly RunningPlanPreviewCalendarRow[];
  issues: string[];
}) {
  if (runnerLevel === "beginner_new_runner") {
    for (const forbiddenKind of ["tempo", "threshold", "hills", "intervals"] as const) {
      if (workoutKinds.has(forbiddenKind)) {
        issues.push(`Beginner Marathon Base preview must not include ${forbiddenKind}.`);
      }
    }
    if (!hasDurabilitySignal(rows)) {
      issues.push("Beginner Marathon Base preview must include honest base durability identity.");
    }
    if (!workoutKinds.has("strides")) {
      issues.push("Beginner Marathon Base preview must include light turnover strides.");
    }
    if (!workoutKinds.has("steady_aerobic_run")) {
      issues.push("Beginner Marathon Base preview must include soft steady aerobic support.");
    }
    return;
  }

  if (!workoutKinds.has("strides")) {
    issues.push("Marathon Base preview must include strides.");
  }

  if (loadContext === "conservative" && !workoutKinds.has("steady_aerobic_run")) {
    issues.push("Conservative Marathon Base preview must include soft steady aerobic support.");
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

function validateMarathonBaseWeekRules({
  rows,
  horizonWeeks,
  issues,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  horizonWeeks: number;
  issues: string[];
}) {
  const cutbackWeeks = resolveMarathonBaseCutbackWeeks(horizonWeeks);
  const taperWeek = resolveMarathonBaseTaperWeek(horizonWeeks);
  const endpointWeek = resolveMarathonBaseEndpointWeek(horizonWeeks);

  for (const cutbackWeek of cutbackWeeks) {
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

  const penultimateRows = rowsForWeek(rows, taperWeek);
  if (!penultimateRows.some((row) => row.workoutDayKind === "strides")) {
    issues.push("Marathon Base penultimate week must include strides.");
  }
  for (const forbiddenKind of ["tempo", "threshold", "hills", "intervals"] as const) {
    if (penultimateRows.some((row) => row.workoutDayKind === forbiddenKind)) {
      issues.push(`Marathon Base penultimate week must not include ${forbiddenKind}.`);
    }
  }

  const endpointRows = rowsForWeek(rows, endpointWeek);
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

function validateDevelopmentDensity({
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
      (row) => row.weekNumber === weekNumber && isMarathonBaseDevelopmentTouch(row.workoutDayKind),
    ).length;
    if (developmentCount > 1) {
      issues.push(`Marathon Base week ${weekNumber} has ${developmentCount} development touches.`);
    }
  }
}

function validateLongHorizonAntiFlatness({
  runnerLevel,
  loadContext,
  rows,
  horizonWeeks,
  issues,
}: {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  rows: readonly RunningPlanPreviewCalendarRow[];
  horizonWeeks: number;
  issues: string[];
}) {
  const needsAntiFlatnessGate =
    horizonWeeks >= 24 && (runnerLevel === "beginner_new_runner" || loadContext === "conservative");

  if (!needsAntiFlatnessGate) {
    return;
  }

  const developmentWeeks = uniqueNumbers(
    rows
      .filter((row) => !row.isRestDay && isMarathonBaseDevelopmentTouch(row.workoutDayKind))
      .map((row) => row.weekNumber),
  );
  const maxAllowedGap = horizonWeeks >= 40 ? 14 : 12;
  const observedGap = maxDevelopmentWeekGap(developmentWeeks, horizonWeeks);

  if (developmentWeeks.length < 3 || observedGap > maxAllowedGap) {
    issues.push(
      `Long-horizon Marathon Base preview has excessive identity desert: ${developmentWeeks.join(", ") || "none"}.`,
    );
  }
}

function rowsForWeek(rows: readonly RunningPlanPreviewCalendarRow[], weekNumber: number) {
  return rows.filter((row) => row.weekNumber === weekNumber);
}

function hasDurabilitySignal(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return /marathon_base_time_on_feet|durability_steady_finish|marathon_base_honest_endpoint/.test(
    JSON.stringify(rows.filter((row) => !row.isRestDay)),
  );
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
