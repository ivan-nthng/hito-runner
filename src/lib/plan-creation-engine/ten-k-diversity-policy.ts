import {
  collectRunningPlanCompositionGrammarIssues,
  resolveRunningPlanCompositionWeek,
  type RunningPlanCompositionDevelopmentTouch,
} from "@/lib/plan-creation-engine/composition-grammar";
import {
  resolveRunningPlanCutbackWeeks,
  resolveRunningPlanEndpointWeek,
  resolveRunningPlanTaperWeek,
} from "@/lib/plan-creation-engine/horizon-policy";
import type {
  RunningPlanRunnerLevel,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";

export const TEN_K_CUTBACK_WEEKS = [4, 8] as const;
export const TEN_K_TAPER_SHARPENING_WEEK = 9 as const;
export const TEN_K_ENDPOINT_WEEK = 10 as const;

export const TEN_K_DEVELOPMENT_TOUCH_VALUES = ["strides", "tempo", "intervals", "hills"] as const;

export type TenKDevelopmentTouch = (typeof TEN_K_DEVELOPMENT_TOUCH_VALUES)[number];
export type TenKLoadContext = "standard" | "conservative";
export type TenKDiversityWorkoutKind = RunningPlanWorkoutDayKind | "rest";

export interface TenKDiversityPolicyInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: TenKLoadContext;
  weekNumber: number;
  horizonWeeks?: number;
}

export interface TenKDiversityValidationRow {
  rowId: string;
  dayNumber: number;
  weekNumber: number;
  isRestDay: boolean;
  workoutDayKind: TenKDiversityWorkoutKind;
}

export interface TenKDiversityValidationInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: TenKLoadContext;
  rows: readonly TenKDiversityValidationRow[];
}

export function resolveTenKDevelopmentTouch({
  runnerLevel,
  loadContext,
  weekNumber,
  horizonWeeks = TEN_K_ENDPOINT_WEEK,
}: TenKDiversityPolicyInput): TenKDevelopmentTouch | null {
  return toTenKDevelopmentTouch(
    resolveRunningPlanCompositionWeek({
      family: "10K",
      runnerLevel,
      loadContext,
      weekNumber,
      horizonWeeks,
    }).developmentTouch,
  );
}

export function validateTenKDiversityPolicy({
  runnerLevel,
  loadContext,
  rows,
}: TenKDiversityValidationInput): readonly string[] {
  const issues: string[] = [];
  const nonRestRows = rows.filter((row) => !row.isRestDay);
  const workoutKinds = new Set(nonRestRows.map((row) => row.workoutDayKind));
  const horizonWeeks = maxWeekNumber(rows);

  validateGlobalDiversityGates(workoutKinds, issues);
  validateRunnerLevelDiversityGates({ runnerLevel, loadContext, workoutKinds, issues });
  validateWeekRules({ rows, horizonWeeks, issues });
  validateRecoverySpacing(rows, issues);
  validateDevelopmentDensity({ rows, horizonWeeks, issues });
  validateLongHorizonAntiFlatness({ runnerLevel, loadContext, rows, horizonWeeks, issues });
  issues.push(
    ...collectRunningPlanCompositionGrammarIssues({
      family: "10K",
      runnerLevel,
      loadContext,
      horizonWeeks,
      rows,
    }),
  );

  return issues;
}

export function isTenKDevelopmentTouch(
  kind: TenKDiversityWorkoutKind,
): kind is TenKDevelopmentTouch {
  return TEN_K_DEVELOPMENT_TOUCH_VALUES.includes(kind as TenKDevelopmentTouch);
}

function toTenKDevelopmentTouch(
  touch: RunningPlanCompositionDevelopmentTouch | null,
): TenKDevelopmentTouch | null {
  return touch && TEN_K_DEVELOPMENT_TOUCH_VALUES.includes(touch as TenKDevelopmentTouch)
    ? (touch as TenKDevelopmentTouch)
    : null;
}

function validateGlobalDiversityGates(
  workoutKinds: ReadonlySet<TenKDiversityWorkoutKind>,
  issues: string[],
) {
  const requiredKinds: readonly TenKDiversityWorkoutKind[] = [
    "easy",
    "recovery",
    "long_run",
    "cutback_long_run",
    "final_selected_distance_day",
  ];

  for (const requiredKind of requiredKinds) {
    if (!workoutKinds.has(requiredKind)) {
      issues.push(`10K preview must include ${requiredKind}.`);
    }
  }

  if (workoutKinds.has("threshold")) {
    issues.push("10K preview must not include threshold.");
  }
}

function validateRunnerLevelDiversityGates({
  runnerLevel,
  loadContext,
  workoutKinds,
  issues,
}: {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: TenKLoadContext;
  workoutKinds: ReadonlySet<TenKDiversityWorkoutKind>;
  issues: string[];
}) {
  if (runnerLevel === "beginner_new_runner") {
    for (const forbiddenKind of ["tempo", "intervals", "hills"] as const) {
      if (workoutKinds.has(forbiddenKind)) {
        issues.push(`Beginner 10K preview must not include ${forbiddenKind}.`);
      }
    }

    if (!workoutKinds.has("strides")) {
      issues.push("Beginner 10K preview must include strides.");
    }
    return;
  }

  if (loadContext === "conservative") {
    for (const forbiddenKind of ["intervals", "hills"] as const) {
      if (workoutKinds.has(forbiddenKind)) {
        issues.push(`Conservative 10K preview must not force ${forbiddenKind}.`);
      }
    }
    if (!workoutKinds.has("strides")) {
      issues.push("Conservative 10K preview must include strides.");
    }
    return;
  }

  for (const requiredKind of ["strides", "tempo", "intervals"] as const) {
    if (!workoutKinds.has(requiredKind)) {
      issues.push(`Supported standard-load 10K preview must include ${requiredKind}.`);
    }
  }

  const isHigherSupport =
    runnerLevel === "runs_a_lot" || runnerLevel === "professional_competitive";
  if (isHigherSupport && !workoutKinds.has("hills")) {
    issues.push(`${runnerLevel} standard-load 10K preview must include hills.`);
  }

  const developmentKinds = TEN_K_DEVELOPMENT_TOUCH_VALUES.filter((kind) => workoutKinds.has(kind));
  if (
    developmentKinds.length > 0 &&
    developmentKinds.every((kind) => kind === "strides" || kind === "tempo")
  ) {
    issues.push("Supported standard-load 10K preview must not use only strides plus tempo.");
  }
}

function validateWeekRules({
  rows,
  horizonWeeks,
  issues,
}: {
  rows: readonly TenKDiversityValidationRow[];
  horizonWeeks: number;
  issues: string[];
}) {
  const cutbackWeeks = resolveRunningPlanCutbackWeeks(horizonWeeks);
  const taperWeek = resolveRunningPlanTaperWeek(horizonWeeks);
  const endpointWeek = resolveRunningPlanEndpointWeek(horizonWeeks);

  for (const cutbackWeek of cutbackWeeks) {
    const weekRows = rowsForWeek(rows, cutbackWeek);
    if (!weekRows.some((row) => row.workoutDayKind === "cutback_long_run")) {
      issues.push(`Week ${cutbackWeek} must include cutback_long_run.`);
    }

    for (const forbiddenKind of ["intervals", "hills", "threshold"] as const) {
      if (weekRows.some((row) => row.workoutDayKind === forbiddenKind)) {
        issues.push(`Week ${cutbackWeek} must not include ${forbiddenKind}.`);
      }
    }
  }

  const taperRows = rowsForWeek(rows, taperWeek);
  if (!taperRows.some((row) => row.workoutDayKind === "strides")) {
    issues.push(`Week ${taperWeek} must include strides.`);
  }
  for (const forbiddenKind of ["intervals", "hills", "tempo", "threshold"] as const) {
    if (taperRows.some((row) => row.workoutDayKind === forbiddenKind)) {
      issues.push(`Week ${taperWeek} must not include ${forbiddenKind}.`);
    }
  }

  const endpointRows = rowsForWeek(rows, endpointWeek);
  const endpointNonRestRows = endpointRows.filter((row) => !row.isRestDay);
  if (!endpointNonRestRows.some((row) => row.workoutDayKind === "final_selected_distance_day")) {
    issues.push(`Week ${endpointWeek} must include final_selected_distance_day.`);
  }
  for (const row of endpointNonRestRows) {
    if (
      row.workoutDayKind !== "final_selected_distance_day" &&
      row.workoutDayKind !== "easy" &&
      row.workoutDayKind !== "recovery"
    ) {
      issues.push(`Week ${endpointWeek} non-endpoint workouts must stay easy or recovery.`);
    }
  }
}

function validateRecoverySpacing(rows: readonly TenKDiversityValidationRow[], issues: string[]) {
  const recoveryRequiredAfter: readonly TenKDiversityWorkoutKind[] = [
    "long_run",
    "cutback_long_run",
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
        `Next running row after ${row.rowId} must be recovery or easy, got ${nextRunningRow.workoutDayKind}.`,
      );
    }
  }
}

function validateDevelopmentDensity({
  rows,
  horizonWeeks,
  issues,
}: {
  rows: readonly TenKDiversityValidationRow[];
  horizonWeeks: number;
  issues: string[];
}) {
  for (let weekNumber = 1; weekNumber <= horizonWeeks; weekNumber += 1) {
    const developmentRows = rowsForWeek(rows, weekNumber).filter((row) =>
      isTenKDevelopmentTouch(row.workoutDayKind),
    );

    if (developmentRows.length > 1) {
      issues.push(`Week ${weekNumber} must not contain more than one development touch.`);
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
  loadContext: TenKLoadContext;
  rows: readonly TenKDiversityValidationRow[];
  horizonWeeks: number;
  issues: string[];
}) {
  if (
    horizonWeeks < 16 ||
    runnerLevel === "beginner_new_runner" ||
    loadContext !== "conservative"
  ) {
    return;
  }

  const developmentWeeks = uniqueNumbers(
    rows
      .filter((row) => !row.isRestDay && isTenKDevelopmentTouch(row.workoutDayKind))
      .map((row) => row.weekNumber),
  );
  const observedGap = maxDevelopmentWeekGap(developmentWeeks, horizonWeeks);

  if (developmentWeeks.length < 5 || observedGap > 10) {
    issues.push(
      `Long-horizon conservative 10K preview has excessive identity desert: ${developmentWeeks.join(", ") || "none"}.`,
    );
  }
}

function rowsForWeek(rows: readonly TenKDiversityValidationRow[], weekNumber: number) {
  return rows.filter((row) => row.weekNumber === weekNumber);
}

function maxWeekNumber(rows: readonly TenKDiversityValidationRow[]) {
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
