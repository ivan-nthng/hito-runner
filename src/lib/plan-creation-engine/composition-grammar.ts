import type {
  RunningPlanDistanceFamily,
  RunningPlanRunnerLevel,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import {
  inferBeginnerHalfMarathonDaysPerWeek,
  isBeginnerHalfMarathonRunner,
  resolveBeginnerHalfMarathonAdaptationWeeks,
  resolveBeginnerHalfMarathonCutbackWeeks,
  resolveBeginnerHalfMarathonDevelopmentTouch,
  resolveBeginnerHalfMarathonEndpointWeek,
  resolveBeginnerHalfMarathonTaperWeek,
} from "@/lib/plan-creation-engine/beginner-half-marathon-policy";
import {
  isMarathonCompletionAdaptationWeek,
  resolveMarathonCompletionCutbackWeeks,
  resolveMarathonCompletionDevelopmentTouch,
  resolveMarathonCompletionEndpointWeek,
  resolveMarathonCompletionFamilySignals,
  resolveMarathonCompletionLongRunRole,
  resolveMarathonCompletionTaperWeek,
} from "@/lib/plan-creation-engine/marathon-completion-policy";
import {
  resolveRunningPlanCutbackWeeks,
  resolveRunningPlanEndpointWeek,
  resolveRunningPlanTaperWeek,
} from "@/lib/plan-creation-engine/horizon-policy";

export const RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION =
  "running_plan_composition_grammar_v1" as const;

export const RUNNING_PLAN_WEEK_ARCHETYPE_VALUES = [
  "adaptation_run_walk_week",
  "easy_support_week",
  "turnover_week",
  "steady_support_week",
  "progression_support_week",
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
  "steady_aerobic_run",
  "progression",
  "tempo",
  "threshold",
  "intervals",
  "hills",
] as const;

export type RunningPlanCompositionDevelopmentTouch =
  (typeof RUNNING_PLAN_COMPOSITION_DEVELOPMENT_TOUCH_VALUES)[number];

export const RUNNING_PLAN_COMPOSITION_SIGNAL_VALUES = [
  "ten_k_turnover",
  "ten_k_steady_support",
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
  "marathon_base_steady_support",
  "marathon_base_tempo_support",
  "marathon_base_threshold_durability",
  "marathon_base_hill_strength",
  "marathon_base_time_on_feet",
  "marathon_base_steady_finish",
  "marathon_base_honest_endpoint",
  "marathon_completion_exact_endpoint",
  "marathon_completion_time_on_feet",
  "marathon_completion_long_run_durability",
  "marathon_completion_cutback_protection",
  "marathon_completion_taper",
  "marathon_completion_turnover",
  "marathon_completion_steady_support",
  "marathon_completion_progression_support",
  "marathon_completion_specificity",
] as const;

export type RunningPlanCompositionSignal = (typeof RUNNING_PLAN_COMPOSITION_SIGNAL_VALUES)[number];

export const RUNNING_PLAN_COMPOSITION_LONG_RUN_ROLE_VALUES = [
  "support",
  "durability_checkpoint",
  "steady_finish",
  "cutback",
  "taper",
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

function resolveFamilyConfig({
  family,
  runnerLevel,
  loadContext,
  horizonWeeks,
}: Omit<ResolveRunningPlanCompositionWeekOptions, "weekNumber">) {
  if (family === "Half Marathon" && isBeginnerHalfMarathonRunner(runnerLevel)) {
    return {
      cutbackWeeks: resolveBeginnerHalfMarathonCutbackWeeks(horizonWeeks),
      taperWeek: resolveBeginnerHalfMarathonTaperWeek(horizonWeeks),
      endpointWeek: resolveBeginnerHalfMarathonEndpointWeek(horizonWeeks),
    };
  }

  if (family === "Marathon Completion") {
    return {
      cutbackWeeks: resolveMarathonCompletionCutbackWeeks(horizonWeeks),
      taperWeek: resolveMarathonCompletionTaperWeek(horizonWeeks),
      endpointWeek: resolveMarathonCompletionEndpointWeek(horizonWeeks),
    };
  }

  return {
    cutbackWeeks: resolveRunningPlanCutbackWeeks(horizonWeeks),
    taperWeek: resolveRunningPlanTaperWeek(horizonWeeks),
    endpointWeek: resolveRunningPlanEndpointWeek(horizonWeeks),
  };
}

function resolveBeginnerHalfMarathonLongRunRole({
  loadContext,
  weekNumber,
  horizonWeeks,
  developmentTouch,
}: Pick<ResolveRunningPlanCompositionWeekOptions, "loadContext" | "weekNumber" | "horizonWeeks"> & {
  developmentTouch: RunningPlanCompositionDevelopmentTouch | null;
}): RunningPlanCompositionLongRunRole {
  if (developmentTouch !== null) {
    return "support";
  }

  const daysPerWeek = inferBeginnerHalfMarathonDaysPerWeek({ loadContext, horizonWeeks });
  const adaptationWeeks = resolveBeginnerHalfMarathonAdaptationWeeks({ loadContext, daysPerWeek });
  if (weekNumber <= adaptationWeeks) {
    return "support";
  }

  if (loadContext === "standard" && daysPerWeek >= 4 && weekNumber === horizonWeeks - 4) {
    return "steady_finish";
  }

  return "durability_checkpoint";
}

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
  horizonWeeks,
}: ResolveRunningPlanCompositionWeekOptions): RunningPlanCompositionDevelopmentTouch | null {
  const config = resolveFamilyConfig({ family, runnerLevel, loadContext, horizonWeeks });

  if (weekNumber === config.endpointWeek || config.cutbackWeeks.includes(weekNumber)) {
    return null;
  }

  if (weekNumber === config.taperWeek) {
    return "strides";
  }

  if (family === "10K") {
    return resolveTenKDevelopmentTouch({ runnerLevel, loadContext, weekNumber, horizonWeeks });
  }

  if (family === "Half Marathon" && isBeginnerHalfMarathonRunner(runnerLevel)) {
    return resolveBeginnerHalfMarathonDevelopmentTouch({
      loadContext,
      horizonWeeks,
      weekNumber,
    });
  }

  if (family === "Marathon Completion") {
    return resolveMarathonCompletionDevelopmentTouch({
      runnerLevel,
      loadContext,
      weekNumber,
      horizonWeeks,
    });
  }

  if (family === "Marathon Base" && runnerLevel === "beginner_new_runner") {
    return resolveBeginnerMarathonBaseDevelopmentTouch({
      loadContext,
      weekNumber,
      horizonWeeks,
    });
  }

  if (runnerLevel === "beginner_new_runner") {
    return null;
  }

  if (family === "Half Marathon") {
    return resolveHalfMarathonDevelopmentTouch({
      runnerLevel,
      loadContext,
      weekNumber,
      horizonWeeks,
    });
  }

  return resolveMarathonBaseDevelopmentTouch({
    runnerLevel,
    loadContext,
    weekNumber,
    horizonWeeks,
  });
}

function resolveTenKDevelopmentTouch({
  runnerLevel,
  loadContext,
  weekNumber,
  horizonWeeks,
}: {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanCompositionLoadContext;
  weekNumber: number;
  horizonWeeks: number;
}): RunningPlanCompositionDevelopmentTouch | null {
  if (runnerLevel === "beginner_new_runner") {
    return weekNumber === 2 || weekNumber === 5 || weekNumber === 7 ? "strides" : null;
  }

  if (loadContext === "conservative") {
    const lateReminderWeek = resolveSoftBridgeWeek({
      horizonWeeks,
      targetWeek: Math.ceil(horizonWeeks * 0.65),
    });
    if (weekNumber === 2 || weekNumber === 5) {
      return "strides";
    }

    return weekNumber === 3 || weekNumber === 7 || weekNumber === lateReminderWeek ? "tempo" : null;
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
  horizonWeeks,
}: {
  runnerLevel: Exclude<RunningPlanRunnerLevel, "beginner_new_runner">;
  loadContext: RunningPlanCompositionLoadContext;
  weekNumber: number;
  horizonWeeks: number;
}): RunningPlanCompositionDevelopmentTouch | null {
  const lateDurabilityWeek = Math.ceil(horizonWeeks * 0.7);

  if (loadContext === "conservative") {
    if (weekNumber === 2) {
      return "strides";
    }

    return weekNumber === 3 ||
      weekNumber === 6 ||
      weekNumber === 9 ||
      weekNumber === 11 ||
      weekNumber === lateDurabilityWeek
      ? "tempo"
      : null;
  }

  if (weekNumber === lateDurabilityWeek) {
    return runnerLevel === "professional_competitive" ? "threshold" : "tempo";
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
  horizonWeeks,
}: {
  runnerLevel: Exclude<RunningPlanRunnerLevel, "beginner_new_runner">;
  loadContext: RunningPlanCompositionLoadContext;
  weekNumber: number;
  horizonWeeks: number;
}): RunningPlanCompositionDevelopmentTouch | null {
  if (loadContext === "conservative") {
    const bridgeWeeks = resolveConservativeMarathonBaseBridgeWeeks(horizonWeeks);
    if (bridgeWeeks.includes(weekNumber)) {
      return "steady_aerobic_run";
    }

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

function resolveBeginnerMarathonBaseDevelopmentTouch({
  loadContext,
  weekNumber,
  horizonWeeks,
}: {
  loadContext: RunningPlanCompositionLoadContext;
  weekNumber: number;
  horizonWeeks: number;
}): RunningPlanCompositionDevelopmentTouch | null {
  const bridgeWeeks = resolveBeginnerMarathonBaseBridgeWeeks({ loadContext, horizonWeeks });

  if (weekNumber === bridgeWeeks.earlyTurnoverWeek || weekNumber === bridgeWeeks.midTurnoverWeek) {
    return "strides";
  }

  if (
    weekNumber === bridgeWeeks.steadyBridgeWeek ||
    (bridgeWeeks.lateSteadyBridgeWeek !== null && weekNumber === bridgeWeeks.lateSteadyBridgeWeek)
  ) {
    return "steady_aerobic_run";
  }

  return null;
}

function resolveBeginnerMarathonBaseBridgeWeeks({
  loadContext,
  horizonWeeks,
}: {
  loadContext: RunningPlanCompositionLoadContext;
  horizonWeeks: number;
}) {
  return {
    earlyTurnoverWeek: resolveSoftBridgeWeek({
      horizonWeeks,
      targetWeek: Math.ceil(horizonWeeks * (loadContext === "conservative" ? 0.2 : 0.18)),
    }),
    midTurnoverWeek: resolveSoftBridgeWeek({
      horizonWeeks,
      targetWeek: Math.ceil(horizonWeeks * 0.42),
    }),
    steadyBridgeWeek: resolveSoftBridgeWeek({
      horizonWeeks,
      targetWeek: Math.ceil(horizonWeeks * 0.62),
    }),
    lateSteadyBridgeWeek:
      horizonWeeks >= 32
        ? resolveSoftBridgeWeek({
            horizonWeeks,
            targetWeek: Math.ceil(horizonWeeks * 0.82),
          })
        : null,
  };
}

function resolveConservativeMarathonBaseBridgeWeeks(horizonWeeks: number) {
  const bridgeTargets = horizonWeeks >= 40 ? [0.32, 0.5, 0.68, 0.84] : [0.5, 0.72];

  return uniqueNumbers(
    bridgeTargets.map((ratio) =>
      resolveSoftBridgeWeek({
        horizonWeeks,
        targetWeek: Math.ceil(horizonWeeks * ratio),
      }),
    ),
  );
}

function resolveSoftBridgeWeek({
  horizonWeeks,
  targetWeek,
}: {
  horizonWeeks: number;
  targetWeek: number;
}) {
  const blockedWeeks = new Set([
    ...resolveRunningPlanCutbackWeeks(horizonWeeks),
    resolveRunningPlanTaperWeek(horizonWeeks),
    resolveRunningPlanEndpointWeek(horizonWeeks),
  ]);
  const minimumWeek = 2;
  const maximumWeek = Math.max(minimumWeek, horizonWeeks - 2);
  let candidate = Math.min(Math.max(targetWeek, minimumWeek), maximumWeek);

  while (blockedWeeks.has(candidate) && candidate < maximumWeek) {
    candidate += 1;
  }

  while (blockedWeeks.has(candidate) && candidate > minimumWeek) {
    candidate -= 1;
  }

  return candidate;
}

function uniqueNumbers(values: readonly number[]) {
  return [...new Set(values)];
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
  const config = resolveFamilyConfig({ family, runnerLevel, loadContext, horizonWeeks });

  if (weekNumber === config.endpointWeek) {
    return "endpoint";
  }

  if (config.cutbackWeeks.includes(weekNumber)) {
    return "cutback";
  }

  if (family === "Half Marathon" && isBeginnerHalfMarathonRunner(runnerLevel)) {
    return resolveBeginnerHalfMarathonLongRunRole({
      loadContext,
      weekNumber,
      horizonWeeks,
      developmentTouch,
    });
  }

  if (family === "Marathon Completion") {
    return resolveMarathonCompletionLongRunRole({
      runnerLevel,
      loadContext,
      weekNumber,
      horizonWeeks,
      developmentTouch,
    });
  }

  if (family === "10K") {
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
  runnerLevel,
  loadContext,
  weekNumber,
  horizonWeeks,
  developmentTouch,
  longRunRole,
}: ResolveRunningPlanCompositionWeekOptions & {
  developmentTouch: RunningPlanCompositionDevelopmentTouch | null;
  longRunRole: RunningPlanCompositionLongRunRole;
}): RunningPlanWeekArchetype {
  const config = resolveFamilyConfig({ family, runnerLevel, loadContext, horizonWeeks });

  if (weekNumber === config.endpointWeek) {
    return "endpoint_week";
  }

  if (config.cutbackWeeks.includes(weekNumber)) {
    return "cutback_week";
  }

  if (weekNumber === config.taperWeek) {
    return "taper_sharpening_week";
  }

  if (
    family === "Marathon Completion" &&
    runnerLevel === "beginner_new_runner" &&
    isMarathonCompletionAdaptationWeek({ runnerLevel, loadContext, weekNumber, horizonWeeks })
  ) {
    return "adaptation_run_walk_week";
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
    case "steady_aerobic_run":
      return "steady_support_week";
    case "progression":
      return "progression_support_week";
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
  horizonWeeks,
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
    if (developmentTouch === "steady_aerobic_run") {
      signals.add("ten_k_steady_support");
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
      (isBeginnerHalfMarathonRunner(runnerLevel) ||
        loadContext === "conservative" ||
        (runnerLevel === "sometimes_runs" && loadContext === "standard")) &&
      developmentTouch === "tempo" &&
      weekNumber >= Math.ceil(horizonWeeks * 0.55)
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
    if (developmentTouch === "steady_aerobic_run") {
      signals.add("marathon_base_steady_support");
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

  if (family === "Marathon Completion") {
    for (const signal of resolveMarathonCompletionFamilySignals({
      developmentTouch,
      longRunRole,
    })) {
      signals.add(signal);
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

  if (family === "Marathon Completion") {
    for (const forbiddenKind of ["threshold", "intervals", "hills"] as const) {
      if (workoutKinds.includes(forbiddenKind)) {
        issues.push(`Marathon Completion composition grammar must not include ${forbiddenKind}.`);
      }
    }
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

  if (family === "Marathon Completion") {
    const requiredSignals: readonly RunningPlanCompositionSignal[] = [
      "marathon_completion_exact_endpoint",
      "marathon_completion_time_on_feet",
      "marathon_completion_long_run_durability",
      "marathon_completion_cutback_protection",
      "marathon_completion_taper",
    ];
    for (const requiredSignal of requiredSignals) {
      if (!expectedSignals.has(requiredSignal)) {
        issues.push(`Marathon Completion composition must include ${requiredSignal}.`);
      }
    }

    const midweekSignals: readonly RunningPlanCompositionSignal[] = [
      "marathon_completion_turnover",
      "marathon_completion_steady_support",
      "marathon_completion_progression_support",
      "marathon_completion_specificity",
    ];
    if (!midweekSignals.some((signal) => expectedSignals.has(signal))) {
      issues.push("Marathon Completion composition must include recurring midweek support signal.");
    }

    for (const forbiddenKind of ["threshold", "intervals", "hills"] as const) {
      if (actualWorkoutKinds.has(forbiddenKind)) {
        issues.push(`Marathon Completion composition must not include ${forbiddenKind}.`);
      }
    }
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
