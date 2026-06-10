import type {
  RunningPlanDistanceFamily,
  RunningPlanRunnerLevel,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";

export const RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION =
  "running_plan_composition_grammar_v1" as const;

export const RUNNING_PLAN_WEEK_ARCHETYPE_VALUES = [
  "easy_support_week",
  "turnover_week",
  "tempo_support_week",
  "threshold_support_week",
  "interval_week",
  "hill_strength_week",
  "long_run_durability_week",
  "long_run_steady_finish_week",
  "cutback_week",
  "taper_sharpening_week",
  "endpoint_week",
] as const;

export type RunningPlanWeekArchetype = (typeof RUNNING_PLAN_WEEK_ARCHETYPE_VALUES)[number];

export const RUNNING_PLAN_COMPOSITION_DEVELOPMENT_TOUCH_VALUES = [
  "strides",
  "tempo",
  "threshold",
  "intervals",
  "hills",
] as const;

export type RunningPlanCompositionDevelopmentTouch =
  (typeof RUNNING_PLAN_COMPOSITION_DEVELOPMENT_TOUCH_VALUES)[number];

export const RUNNING_PLAN_COMPOSITION_SIGNAL_VALUES = [
  "ten_k_turnover",
  "ten_k_tempo_support",
  "ten_k_repeatability",
  "ten_k_hill_strength",
  "ten_k_exact_endpoint",
  "half_turnover",
  "half_sustained_support",
  "half_specific_durability",
  "half_threshold_durability",
  "half_durable_repeatability",
  "half_long_run_durability",
  "half_long_run_steady_finish",
  "half_exact_endpoint",
  "marathon_base_turnover",
  "marathon_base_tempo_support",
  "marathon_base_threshold_durability",
  "marathon_base_hill_strength",
  "marathon_base_time_on_feet",
  "marathon_base_steady_finish",
  "marathon_base_honest_endpoint",
] as const;

export type RunningPlanCompositionSignal = (typeof RUNNING_PLAN_COMPOSITION_SIGNAL_VALUES)[number];

export const RUNNING_PLAN_COMPOSITION_LONG_RUN_ROLE_VALUES = [
  "support",
  "durability_checkpoint",
  "steady_finish",
  "cutback",
  "endpoint",
] as const;

export type RunningPlanCompositionLongRunRole =
  (typeof RUNNING_PLAN_COMPOSITION_LONG_RUN_ROLE_VALUES)[number];

export type RunningPlanCompositionLoadContext = "standard" | "conservative";

export interface ResolveRunningPlanCompositionWeekOptions {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanCompositionLoadContext;
  weekNumber: number;
  horizonWeeks: number;
}

export interface RunningPlanCompositionWeek {
  version: typeof RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION;
  family: RunningPlanDistanceFamily;
  weekNumber: number;
  archetype: RunningPlanWeekArchetype;
  developmentTouch: RunningPlanCompositionDevelopmentTouch | null;
  developmentTouchCountsAsWeeklyStimulus: boolean;
  longRunRole: RunningPlanCompositionLongRunRole;
  familySignals: readonly RunningPlanCompositionSignal[];
}

export interface RunningPlanCompositionValidationRow {
  weekNumber: number;
  isRestDay: boolean;
  workoutDayKind: RunningPlanWorkoutDayKind | "rest";
}

export interface ValidateRunningPlanCompositionGrammarOptions extends Omit<
  ResolveRunningPlanCompositionWeekOptions,
  "weekNumber"
> {
  rows: readonly RunningPlanCompositionValidationRow[];
}

const FAMILY_CONFIG = {
  "10K": {
    cutbackWeeks: [4, 8],
    taperWeek: 9,
    endpointWeek: 10,
  },
  "Half Marathon": {
    cutbackWeeks: [4, 8, 12],
    taperWeek: 13,
    endpointWeek: 14,
  },
  "Marathon Base": {
    cutbackWeeks: [4, 8, 12],
    taperWeek: 15,
    endpointWeek: 16,
  },
} as const satisfies Record<
  RunningPlanDistanceFamily,
  {
    cutbackWeeks: readonly number[];
    taperWeek: number;
    endpointWeek: number;
  }
>;

export function resolveRunningPlanCompositionWeek(
  options: ResolveRunningPlanCompositionWeekOptions,
): RunningPlanCompositionWeek {
  const developmentTouch = resolveDevelopmentTouch(options);
  const longRunRole = resolveLongRunRole({ ...options, developmentTouch });
  const archetype = resolveWeekArchetype({ ...options, developmentTouch, longRunRole });

  return {
    version: RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
    family: options.family,
    weekNumber: options.weekNumber,
    archetype,
    developmentTouch,
    developmentTouchCountsAsWeeklyStimulus:
      developmentTouch !== null || longRunRole === "steady_finish",
    longRunRole,
    familySignals: resolveFamilySignals({ ...options, developmentTouch, longRunRole }),
  };
}

export function collectRunningPlanCompositionGrammarIssues({
  rows,
  ...options
}: ValidateRunningPlanCompositionGrammarOptions): readonly string[] {
  const issues: string[] = [];

  for (let weekNumber = 1; weekNumber <= options.horizonWeeks; weekNumber += 1) {
    const expected = resolveRunningPlanCompositionWeek({ ...options, weekNumber });
    const weekRows = rows.filter((row) => row.weekNumber === weekNumber);
    const workoutKinds = weekRows.filter((row) => !row.isRestDay).map((row) => row.workoutDayKind);
    const developmentTouches = workoutKinds.filter(isRunningPlanCompositionDevelopmentTouch);

    if (developmentTouches.length > 1) {
      issues.push(
        `${options.family} week ${weekNumber} has ${developmentTouches.length} development touches.`,
      );
    }

    if (expected.developmentTouch && !workoutKinds.includes(expected.developmentTouch)) {
      issues.push(
        `${options.family} week ${weekNumber} must include ${expected.developmentTouch}.`,
      );
    }

    if (!expected.developmentTouch && developmentTouches.length > 0) {
      issues.push(
        `${options.family} week ${weekNumber} must not include development touch ${developmentTouches.join(", ")}.`,
      );
    }

    validateForbiddenWeekCombinations({
      family: options.family,
      weekNumber,
      workoutKinds,
      issues,
    });
  }

  validateBlockWideCompositionSignals({
    ...options,
    rows,
    issues,
  });

  return issues;
}

export function isRunningPlanCompositionDevelopmentTouch(
  kind: RunningPlanWorkoutDayKind | "rest",
): kind is RunningPlanCompositionDevelopmentTouch {
  return RUNNING_PLAN_COMPOSITION_DEVELOPMENT_TOUCH_VALUES.includes(
    kind as RunningPlanCompositionDevelopmentTouch,
  );
}

function resolveDevelopmentTouch({
  family,
  runnerLevel,
  loadContext,
  weekNumber,
}: ResolveRunningPlanCompositionWeekOptions): RunningPlanCompositionDevelopmentTouch | null {
  const config = FAMILY_CONFIG[family];

  if (weekNumber === config.endpointWeek || config.cutbackWeeks.includes(weekNumber)) {
    return null;
  }

  if (weekNumber === config.taperWeek) {
    return "strides";
  }

  if (family === "10K") {
    return resolveTenKDevelopmentTouch({ runnerLevel, loadContext, weekNumber });
  }

  if (runnerLevel === "beginner_new_runner") {
    return null;
  }

  if (family === "Half Marathon") {
    return resolveHalfMarathonDevelopmentTouch({ runnerLevel, loadContext, weekNumber });
  }

  return resolveMarathonBaseDevelopmentTouch({ runnerLevel, loadContext, weekNumber });
}

function resolveTenKDevelopmentTouch({
  runnerLevel,
  loadContext,
  weekNumber,
}: {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanCompositionLoadContext;
  weekNumber: number;
}): RunningPlanCompositionDevelopmentTouch | null {
  if (runnerLevel === "beginner_new_runner") {
    return weekNumber === 2 || weekNumber === 5 || weekNumber === 7 ? "strides" : null;
  }

  if (loadContext === "conservative") {
    if (weekNumber === 2 || weekNumber === 5) {
      return "strides";
    }

    return weekNumber === 3 || weekNumber === 7 ? "tempo" : null;
  }

  switch (weekNumber) {
    case 2:
      return "strides";
    case 3:
      return "tempo";
    case 5:
      return "intervals";
    case 6:
      return runnerLevel === "professional_competitive" ? "intervals" : null;
    case 7:
      return runnerLevel === "runs_a_lot" || runnerLevel === "professional_competitive"
        ? "hills"
        : "tempo";
    default:
      return null;
  }
}

function resolveHalfMarathonDevelopmentTouch({
  runnerLevel,
  loadContext,
  weekNumber,
}: {
  runnerLevel: Exclude<RunningPlanRunnerLevel, "beginner_new_runner">;
  loadContext: RunningPlanCompositionLoadContext;
  weekNumber: number;
}): RunningPlanCompositionDevelopmentTouch | null {
  if (loadContext === "conservative") {
    if (weekNumber === 2) {
      return "strides";
    }

    return weekNumber === 3 || weekNumber === 6 || weekNumber === 9 || weekNumber === 11
      ? "tempo"
      : null;
  }

  switch (weekNumber) {
    case 2:
      return "strides";
    case 3:
      return "tempo";
    case 6:
    case 11:
      return runnerLevel === "runs_a_lot" || runnerLevel === "professional_competitive"
        ? "threshold"
        : "tempo";
    case 9:
      if (runnerLevel === "professional_competitive") {
        return "intervals";
      }
      return runnerLevel === "sometimes_runs" ? "intervals" : "tempo";
    default:
      return null;
  }
}

function resolveMarathonBaseDevelopmentTouch({
  runnerLevel,
  loadContext,
  weekNumber,
}: {
  runnerLevel: Exclude<RunningPlanRunnerLevel, "beginner_new_runner">;
  loadContext: RunningPlanCompositionLoadContext;
  weekNumber: number;
}): RunningPlanCompositionDevelopmentTouch | null {
  if (loadContext === "conservative") {
    if (weekNumber === 2 || weekNumber === 6) {
      return "strides";
    }

    return runnerLevel !== "sometimes_runs" && (weekNumber === 3 || weekNumber === 10)
      ? "tempo"
      : null;
  }

  switch (weekNumber) {
    case 2:
      return "strides";
    case 3:
    case 10:
      return "tempo";
    case 6:
      return runnerLevel === "runs_a_lot" || runnerLevel === "professional_competitive"
        ? "threshold"
        : "strides";
    case 13:
      return runnerLevel === "sometimes_runs" ? "tempo" : "hills";
    case 14:
      return runnerLevel === "professional_competitive" ? "threshold" : null;
    default:
      return null;
  }
}

function resolveLongRunRole({
  family,
  runnerLevel,
  loadContext,
  weekNumber,
  horizonWeeks,
  developmentTouch,
}: ResolveRunningPlanCompositionWeekOptions & {
  developmentTouch: RunningPlanCompositionDevelopmentTouch | null;
}): RunningPlanCompositionLongRunRole {
  const config = FAMILY_CONFIG[family];

  if (weekNumber === config.endpointWeek) {
    return "endpoint";
  }

  if (config.cutbackWeeks.includes(weekNumber)) {
    return "cutback";
  }

  if (family === "10K" || runnerLevel === "beginner_new_runner") {
    return "support";
  }

  if (loadContext === "conservative") {
    return resolveConservativeLongRunRole({
      family,
      runnerLevel,
      weekNumber,
      horizonWeeks,
      developmentTouch,
    });
  }

  const lateBuildWeek = weekNumber >= Math.ceil(horizonWeeks * 0.65);
  const durabilityWeek = weekNumber >= Math.ceil(horizonWeeks * 0.5);

  if (lateBuildWeek && developmentTouch === null) {
    return "steady_finish";
  }

  return durabilityWeek ? "durability_checkpoint" : "support";
}

function resolveConservativeLongRunRole({
  family,
  runnerLevel,
  weekNumber,
  horizonWeeks,
  developmentTouch,
}: Pick<
  ResolveRunningPlanCompositionWeekOptions,
  "family" | "runnerLevel" | "weekNumber" | "horizonWeeks"
> & {
  developmentTouch: RunningPlanCompositionDevelopmentTouch | null;
}): RunningPlanCompositionLongRunRole {
  if (developmentTouch !== null) {
    return "support";
  }

  const durabilityWeek = weekNumber >= Math.ceil(horizonWeeks * 0.45);
  const lateBuildWeek = weekNumber >= Math.ceil(horizonWeeks * 0.65);
  if (!durabilityWeek) {
    return "support";
  }

  if (family === "Half Marathon") {
    return lateBuildWeek ? "steady_finish" : "durability_checkpoint";
  }

  if (lateBuildWeek && runnerLevel !== "sometimes_runs") {
    return "steady_finish";
  }

  return "durability_checkpoint";
}

function resolveWeekArchetype({
  family,
  weekNumber,
  developmentTouch,
  longRunRole,
}: ResolveRunningPlanCompositionWeekOptions & {
  developmentTouch: RunningPlanCompositionDevelopmentTouch | null;
  longRunRole: RunningPlanCompositionLongRunRole;
}): RunningPlanWeekArchetype {
  const config = FAMILY_CONFIG[family];

  if (weekNumber === config.endpointWeek) {
    return "endpoint_week";
  }

  if (config.cutbackWeeks.includes(weekNumber)) {
    return "cutback_week";
  }

  if (weekNumber === config.taperWeek) {
    return "taper_sharpening_week";
  }

  if (longRunRole === "steady_finish") {
    return "long_run_steady_finish_week";
  }

  if (longRunRole === "durability_checkpoint" && developmentTouch === null) {
    return "long_run_durability_week";
  }

  switch (developmentTouch) {
    case "strides":
      return "turnover_week";
    case "tempo":
      return "tempo_support_week";
    case "threshold":
      return "threshold_support_week";
    case "intervals":
      return "interval_week";
    case "hills":
      return "hill_strength_week";
    case null:
      return "easy_support_week";
  }
}

function resolveFamilySignals({
  family,
  runnerLevel,
  loadContext,
  weekNumber,
  developmentTouch,
  longRunRole,
}: ResolveRunningPlanCompositionWeekOptions & {
  developmentTouch: RunningPlanCompositionDevelopmentTouch | null;
  longRunRole: RunningPlanCompositionLongRunRole;
}): readonly RunningPlanCompositionSignal[] {
  const signals = new Set<RunningPlanCompositionSignal>();

  if (family === "10K") {
    if (developmentTouch === "strides") {
      signals.add("ten_k_turnover");
    }
    if (developmentTouch === "tempo") {
      signals.add("ten_k_tempo_support");
    }
    if (developmentTouch === "intervals") {
      signals.add("ten_k_repeatability");
    }
    if (developmentTouch === "hills") {
      signals.add("ten_k_hill_strength");
    }
    if (longRunRole === "endpoint") {
      signals.add("ten_k_exact_endpoint");
    }
  }

  if (family === "Half Marathon") {
    if (developmentTouch === "strides") {
      signals.add("half_turnover");
    }
    if (developmentTouch === "tempo") {
      signals.add("half_sustained_support");
    }
    if (
      (loadContext === "conservative" ||
        (runnerLevel === "sometimes_runs" && loadContext === "standard")) &&
      developmentTouch === "tempo" &&
      weekNumber >= 9
    ) {
      signals.add("half_specific_durability");
    }
    if (developmentTouch === "threshold") {
      signals.add("half_threshold_durability");
    }
    if (developmentTouch === "intervals") {
      signals.add("half_durable_repeatability");
    }
    if (longRunRole === "durability_checkpoint") {
      signals.add("half_long_run_durability");
    }
    if (longRunRole === "steady_finish") {
      signals.add("half_long_run_steady_finish");
    }
    if (longRunRole === "endpoint") {
      signals.add("half_exact_endpoint");
    }
  }

  if (family === "Marathon Base") {
    if (developmentTouch === "strides") {
      signals.add("marathon_base_turnover");
    }
    if (developmentTouch === "tempo") {
      signals.add("marathon_base_tempo_support");
    }
    if (developmentTouch === "threshold") {
      signals.add("marathon_base_threshold_durability");
    }
    if (developmentTouch === "hills") {
      signals.add("marathon_base_hill_strength");
    }
    if (longRunRole === "durability_checkpoint") {
      signals.add("marathon_base_time_on_feet");
    }
    if (longRunRole === "steady_finish") {
      signals.add("marathon_base_steady_finish");
    }
    if (longRunRole === "endpoint") {
      signals.add("marathon_base_honest_endpoint");
    }
  }

  return [...signals];
}

function validateForbiddenWeekCombinations({
  family,
  weekNumber,
  workoutKinds,
  issues,
}: {
  family: RunningPlanDistanceFamily;
  weekNumber: number;
  workoutKinds: readonly (RunningPlanWorkoutDayKind | "rest")[];
  issues: string[];
}) {
  if (workoutKinds.includes("intervals") && workoutKinds.includes("hills")) {
    issues.push(`${family} week ${weekNumber} must not combine intervals and hills.`);
  }

  if (family === "10K" && workoutKinds.includes("threshold")) {
    issues.push("10K composition grammar must not include threshold in v1.");
  }

  if (family === "Marathon Base" && workoutKinds.includes("intervals")) {
    issues.push("Marathon Base composition grammar must not include intervals.");
  }
}

function validateBlockWideCompositionSignals({
  family,
  runnerLevel,
  loadContext,
  horizonWeeks,
  rows,
  issues,
}: ValidateRunningPlanCompositionGrammarOptions & { issues: string[] }) {
  const actualWorkoutKinds = new Set(
    rows.filter((row) => !row.isRestDay).map((row) => row.workoutDayKind),
  );
  const expectedSignals = collectExpectedSignals({
    family,
    runnerLevel,
    loadContext,
    horizonWeeks,
  });

  if (
    family === "10K" &&
    runnerLevel !== "beginner_new_runner" &&
    loadContext === "standard" &&
    !actualWorkoutKinds.has("intervals")
  ) {
    issues.push("Supported standard-load 10K composition must include interval repeatability.");
  }

  if (
    family === "10K" &&
    loadContext === "standard" &&
    (runnerLevel === "runs_a_lot" || runnerLevel === "professional_competitive") &&
    !actualWorkoutKinds.has("hills")
  ) {
    issues.push("Higher-support standard-load 10K composition must include hill strength.");
  }

  if (
    family === "Half Marathon" &&
    runnerLevel === "sometimes_runs" &&
    loadContext === "standard" &&
    !expectedSignals.has("half_specific_durability") &&
    !expectedSignals.has("half_long_run_durability") &&
    !expectedSignals.has("half_long_run_steady_finish")
  ) {
    issues.push("Half Marathon sometimes_runs composition must include durability signal.");
  }

  if (
    family === "Half Marathon" &&
    loadContext === "conservative" &&
    !expectedSignals.has("half_specific_durability") &&
    !expectedSignals.has("half_long_run_durability") &&
    !expectedSignals.has("half_long_run_steady_finish")
  ) {
    issues.push(
      "Conservative Half Marathon composition must preserve half-specific durability through soft tempo or long-run role.",
    );
  }

  if (
    family === "Half Marathon" &&
    loadContext === "standard" &&
    (runnerLevel === "runs_a_lot" || runnerLevel === "professional_competitive") &&
    !actualWorkoutKinds.has("threshold")
  ) {
    issues.push("Higher-support Half Marathon composition must include threshold durability.");
  }

  if (
    family === "Marathon Base" &&
    runnerLevel !== "beginner_new_runner" &&
    loadContext === "standard" &&
    !actualWorkoutKinds.has("tempo")
  ) {
    issues.push("Standard-load Marathon Base composition must include tempo support.");
  }

  if (
    family === "Marathon Base" &&
    runnerLevel !== "beginner_new_runner" &&
    !expectedSignals.has("marathon_base_time_on_feet") &&
    !expectedSignals.has("marathon_base_steady_finish")
  ) {
    issues.push(
      "Marathon Base composition must include time-on-feet or steady-finish long-run durability.",
    );
  }
}

function collectExpectedSignals({
  family,
  runnerLevel,
  loadContext,
  horizonWeeks,
}: Omit<ResolveRunningPlanCompositionWeekOptions, "weekNumber">) {
  const signals = new Set<RunningPlanCompositionSignal>();

  for (let weekNumber = 1; weekNumber <= horizonWeeks; weekNumber += 1) {
    const week = resolveRunningPlanCompositionWeek({
      family,
      runnerLevel,
      loadContext,
      weekNumber,
      horizonWeeks,
    });
    for (const signal of week.familySignals) {
      signals.add(signal);
    }
  }

  return signals;
}
