import {
  resolveRunningPlanCutbackWeeks,
  resolveRunningPlanEndpointWeek,
  resolveRunningPlanTaperWeek,
} from "@/lib/plan-creation-engine/horizon-policy";
import type {
  RunningPlanCompositionDevelopmentTouch,
  RunningPlanCompositionLoadContext,
  RunningPlanCompositionLongRunRole,
  RunningPlanCompositionSignal,
} from "@/lib/plan-creation-engine/composition-grammar";
import type { RunningPlanRunnerLevel } from "@/lib/plan-creation-engine/source-types";

export const MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS = 42_195 as const;

export const MARATHON_COMPLETION_DEVELOPMENT_TOUCH_VALUES = [
  "strides",
  "steady_aerobic_run",
  "progression",
  "tempo",
] as const;

export type MarathonCompletionDevelopmentTouch =
  (typeof MARATHON_COMPLETION_DEVELOPMENT_TOUCH_VALUES)[number];

export interface MarathonCompletionPolicyInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanCompositionLoadContext;
  weekNumber: number;
  horizonWeeks: number;
}

export function resolveMarathonCompletionCutbackWeeks(horizonWeeks: number) {
  return resolveRunningPlanCutbackWeeks(horizonWeeks);
}

export function resolveMarathonCompletionTaperWeek(horizonWeeks: number) {
  return resolveRunningPlanTaperWeek(horizonWeeks);
}

export function resolveMarathonCompletionEndpointWeek(horizonWeeks: number) {
  return resolveRunningPlanEndpointWeek(horizonWeeks);
}

export function resolveMarathonCompletionAdaptationWeeks({
  runnerLevel,
  loadContext,
  horizonWeeks,
}: Omit<MarathonCompletionPolicyInput, "weekNumber">) {
  if (runnerLevel !== "beginner_new_runner") {
    return 0;
  }

  const ratio = loadContext === "conservative" ? 0.22 : 0.18;
  return Math.max(8, Math.min(20, Math.ceil(horizonWeeks * ratio)));
}

export function isMarathonCompletionAdaptationWeek(input: MarathonCompletionPolicyInput) {
  return input.weekNumber <= resolveMarathonCompletionAdaptationWeeks(input);
}

export function resolveMarathonCompletionDevelopmentTouch({
  runnerLevel,
  loadContext,
  weekNumber,
  horizonWeeks,
}: MarathonCompletionPolicyInput): MarathonCompletionDevelopmentTouch | null {
  const cutbackWeeks = resolveMarathonCompletionCutbackWeeks(horizonWeeks);
  const taperWeek = resolveMarathonCompletionTaperWeek(horizonWeeks);
  const endpointWeek = resolveMarathonCompletionEndpointWeek(horizonWeeks);

  if (weekNumber === endpointWeek || cutbackWeeks.includes(weekNumber)) {
    return null;
  }

  if (weekNumber === taperWeek) {
    return "strides";
  }

  const adaptationWeeks = resolveMarathonCompletionAdaptationWeeks({
    runnerLevel,
    loadContext,
    horizonWeeks,
  });
  if (weekNumber <= adaptationWeeks) {
    return null;
  }

  const phaseProgress = weekNumber / Math.max(1, horizonWeeks);

  if (runnerLevel === "beginner_new_runner") {
    if (weekNumber % 10 === 2 || weekNumber % 10 === 3) {
      return "strides";
    }

    if (phaseProgress >= 0.45 && (weekNumber % 10 === 6 || weekNumber % 10 === 7)) {
      return "steady_aerobic_run";
    }

    return null;
  }

  if (runnerLevel === "sometimes_runs") {
    if (weekNumber % 8 === 2) {
      return phaseProgress >= 0.55 ? "progression" : "strides";
    }

    if (weekNumber % 8 === 6) {
      if (phaseProgress >= 0.75 && loadContext === "standard") {
        return "tempo";
      }

      return phaseProgress >= 0.4 ? "progression" : "steady_aerobic_run";
    }

    return null;
  }

  const developmentSlot = weekNumber % (loadContext === "conservative" ? 8 : 6);
  if (developmentSlot === 2) {
    if (phaseProgress >= 0.62) {
      return runnerLevel === "professional_competitive" ? "tempo" : "progression";
    }

    return phaseProgress >= 0.32 ? "steady_aerobic_run" : "strides";
  }

  if (developmentSlot === 5 || (loadContext === "conservative" && developmentSlot === 6)) {
    if (phaseProgress >= 0.72) {
      return "tempo";
    }

    return phaseProgress >= 0.45 ? "progression" : "steady_aerobic_run";
  }

  return null;
}

export function resolveMarathonCompletionLongRunRole({
  runnerLevel,
  loadContext,
  weekNumber,
  horizonWeeks,
  developmentTouch,
}: MarathonCompletionPolicyInput & {
  developmentTouch: RunningPlanCompositionDevelopmentTouch | null;
}): RunningPlanCompositionLongRunRole {
  const cutbackWeeks = resolveMarathonCompletionCutbackWeeks(horizonWeeks);
  const taperWeek = resolveMarathonCompletionTaperWeek(horizonWeeks);
  const endpointWeek = resolveMarathonCompletionEndpointWeek(horizonWeeks);

  if (weekNumber === endpointWeek) {
    return "endpoint";
  }

  if (weekNumber === taperWeek) {
    return "taper";
  }

  if (cutbackWeeks.includes(weekNumber)) {
    return "cutback";
  }

  if (isMarathonCompletionAdaptationWeek({ runnerLevel, loadContext, weekNumber, horizonWeeks })) {
    return "support";
  }

  const phaseProgress = weekNumber / Math.max(1, horizonWeeks);
  const durabilityThreshold = loadContext === "conservative" ? 0.48 : 0.42;
  const steadyFinishThreshold = loadContext === "conservative" ? 0.72 : 0.62;

  if (developmentTouch !== null) {
    return phaseProgress >= durabilityThreshold ? "durability_checkpoint" : "support";
  }

  if (runnerLevel === "beginner_new_runner") {
    const canUseLateSteadyFinish = loadContext === "standard" && phaseProgress >= 0.82;
    if (canUseLateSteadyFinish) {
      return "steady_finish";
    }

    return phaseProgress >= durabilityThreshold ? "durability_checkpoint" : "support";
  }

  if (phaseProgress >= steadyFinishThreshold) {
    return "steady_finish";
  }

  return phaseProgress >= durabilityThreshold ? "durability_checkpoint" : "support";
}

export function resolveMarathonCompletionFamilySignals({
  developmentTouch,
  longRunRole,
}: {
  developmentTouch: RunningPlanCompositionDevelopmentTouch | null;
  longRunRole: RunningPlanCompositionLongRunRole;
}): readonly RunningPlanCompositionSignal[] {
  const signals = new Set<RunningPlanCompositionSignal>();

  if (developmentTouch === "strides") {
    signals.add("marathon_completion_turnover");
  }

  if (developmentTouch === "steady_aerobic_run") {
    signals.add("marathon_completion_steady_support");
  }

  if (developmentTouch === "progression") {
    signals.add("marathon_completion_progression_support");
  }

  if (developmentTouch === "tempo") {
    signals.add("marathon_completion_specificity");
  }

  if (longRunRole === "support" || longRunRole === "durability_checkpoint") {
    signals.add("marathon_completion_time_on_feet");
  }

  if (longRunRole === "durability_checkpoint" || longRunRole === "steady_finish") {
    signals.add("marathon_completion_long_run_durability");
  }

  if (longRunRole === "steady_finish") {
    signals.add("marathon_completion_specificity");
  }

  if (longRunRole === "cutback") {
    signals.add("marathon_completion_cutback_protection");
  }

  if (longRunRole === "taper") {
    signals.add("marathon_completion_taper");
  }

  if (longRunRole === "endpoint") {
    signals.add("marathon_completion_exact_endpoint");
  }

  return [...signals];
}
