import type { TrainingPlanV2 } from "@/lib/imported-plan";
import type { NormalizedStructuredInput } from "@/lib/structured-plan-authoring-schema";
import type { BuildWorkoutContext } from "@/lib/structured-plan-authoring-workouts";
import {
  replaceLongRunWithSteadyFinish,
  replaceSpecificWorkoutInWeek,
} from "@/lib/plan-presets/recipe-expanders/shared";

export const PLAN_PRESET_DAY_PRIMITIVES = [
  "rest",
  "fixed_rest",
  "recovery_run",
  "easy_run",
  "steady_run",
  "long_run",
  "hill_session",
  "tempo_threshold_session",
  "marathon_steady_specificity",
  "cutback_long_run",
] as const;

export type PlanPresetDayPrimitive = (typeof PLAN_PRESET_DAY_PRIMITIVES)[number];

export const PLAN_PRESET_WEEK_ARCHETYPES = [
  "foundation_week",
  "build_week",
  "cutback_week",
  "specificity_week",
  "recovery_support_week",
  "peak_safe_week",
] as const;

export type PlanPresetWeekArchetype = (typeof PLAN_PRESET_WEEK_ARCHETYPES)[number];

export const PLAN_PRESET_SUPPORT_IDENTITIES = [
  "rest_and_recovery",
  "recovery_jog",
  "easy_aerobic_run",
  "cutback_aerobic_run",
  "easy_run_with_strides",
  "steady_aerobic_run",
  "long_aerobic_run",
  "cutback_long_run",
] as const;

export type PlanPresetWorkoutIdentity = TrainingPlanV2["planned_workouts"][number][
  | "workout_identity"
  | "source_workout_type"];

export type PlanPresetCompositionContract = {
  recipeLabel: string;
  allowedIdentities: ReadonlySet<string>;
  requiredIdentities?: readonly string[];
  specificTouchIdentities?: ReadonlySet<string>;
  maxSpecificTouchesPerWeek?: number;
};

export type PlanPresetCompositionStep =
  | {
      kind: "specific_workout";
      weekNumber: number;
      label: string;
      buildWorkout: (context: BuildWorkoutContext) => unknown;
    }
  | {
      kind: "long_run_steady_finish";
      weekNumber: number;
    };

export function planPresetWorkoutIdentity(workout: TrainingPlanV2["planned_workouts"][number]) {
  return workout.workout_identity ?? workout.source_workout_type ?? null;
}

export function applyPlanPresetCompositionSteps({
  workouts,
  normalized,
  recipeLabel,
  steps,
}: {
  workouts: TrainingPlanV2["planned_workouts"];
  normalized: NormalizedStructuredInput;
  recipeLabel: string;
  steps: readonly PlanPresetCompositionStep[];
}) {
  return steps.reduce<TrainingPlanV2["planned_workouts"]>((nextWorkouts, step) => {
    if (step.kind === "long_run_steady_finish") {
      return replaceLongRunWithSteadyFinish(nextWorkouts, normalized, step.weekNumber, recipeLabel);
    }

    return replaceSpecificWorkoutInWeek(
      nextWorkouts,
      normalized,
      step.weekNumber,
      step.buildWorkout,
      step.label,
    );
  }, workouts);
}

export function assertPlanPresetComposition(
  canonicalPlan: TrainingPlanV2,
  contract: PlanPresetCompositionContract,
) {
  const identities = new Set<string>();
  const specificTouchCountsByWeek = new Map<number, number>();

  for (const workout of canonicalPlan.planned_workouts) {
    const identity = planPresetWorkoutIdentity(workout);

    if (!identity || !contract.allowedIdentities.has(identity)) {
      throw new Error(
        `${contract.recipeLabel} generated unsupported workout identity: ${identity ?? "unknown"}.`,
      );
    }

    identities.add(identity);

    if (contract.specificTouchIdentities?.has(identity)) {
      specificTouchCountsByWeek.set(
        workout.week_number,
        (specificTouchCountsByWeek.get(workout.week_number) ?? 0) + 1,
      );
    }
  }

  for (const requiredIdentity of contract.requiredIdentities ?? []) {
    if (!identities.has(requiredIdentity)) {
      throw new Error(`${contract.recipeLabel} is missing required identity ${requiredIdentity}.`);
    }
  }

  if (typeof contract.maxSpecificTouchesPerWeek !== "number") {
    return;
  }

  for (const [weekNumber, count] of specificTouchCountsByWeek) {
    if (count > contract.maxSpecificTouchesPerWeek) {
      throw new Error(
        `${contract.recipeLabel} generated ${count} moderate/specific touches in week ${weekNumber}.`,
      );
    }
  }
}
