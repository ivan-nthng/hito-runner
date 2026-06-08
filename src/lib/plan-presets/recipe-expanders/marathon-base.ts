import { trainingPlanV2Schema, type TrainingPlanV2 } from "@/lib/imported-plan";
import type { PlanPresetEligibilityInput } from "@/lib/plan-presets/schema";
import {
  PLAN_PRESET_SUPPORT_IDENTITIES,
  applyPlanPresetCompositionSteps,
  assertPlanPresetComposition,
  type PlanPresetCompositionStep,
} from "@/lib/plan-presets/composition";
import {
  buildStructuredAuthoringPlan,
  normalizeStructuredPlanAuthoringInput,
  structuredPlanAuthoringInputSchema,
} from "@/lib/structured-plan-authoring";
import { finalizeGeneratedWorkoutRows } from "@/lib/structured-plan-authoring-finalize";
import type { NormalizedStructuredInput } from "@/lib/structured-plan-authoring-schema";
import type { StructuredFirstPlanAuthoringInput } from "@/lib/structured-first-plan-onboarding";
import {
  buildEasyWorkout,
  buildMarathonSteadySpecificityWorkout,
} from "@/lib/structured-plan-authoring-workouts";
import {
  assertFixedRestAndLongRunDay,
  buildPresetNotes,
  buildWorkoutContext,
  enforcePostLongRunRecovery,
  expandSingleSegmentSupportRows,
  retagWorkout,
} from "@/lib/plan-presets/recipe-expanders/shared";

export const MARATHON_BASE_PRESET_ID = "plan_preset_marathon_base_v1";
export const MARATHON_BASE_GUARDRAIL_SUMMARY =
  "Marathon Base excludes target-date, target-time, race-pace, taper tune-up, road interval, aggressive performance, and two-quality-week patterns in v1.";

const allowedMarathonBaseIdentities = new Set<string>([
  ...PLAN_PRESET_SUPPORT_IDENTITIES,
  "long_run_with_steady_finish",
  "marathon_steady_specificity",
]);

const marathonBaseSpecificIdentities = new Set<string>([
  "marathon_steady_specificity",
  "long_run_with_steady_finish",
]);

const marathonBaseCompositionSteps: readonly PlanPresetCompositionStep[] = [
  {
    kind: "specific_workout",
    weekNumber: 5,
    buildWorkout: buildMarathonSteadySpecificityWorkout,
    label: "Marathon Base build-phase steady durability",
  },
  {
    kind: "specific_workout",
    weekNumber: 7,
    buildWorkout: buildMarathonSteadySpecificityWorkout,
    label: "Marathon Base recurring steady durability",
  },
];

export function validateMarathonBaseInput(input: PlanPresetEligibilityInput) {
  if (input.goal.goalDistance !== "marathon") {
    throw new Error("Marathon Base draft expansion requires a marathon setup.");
  }

  if (input.goal.goalStyle !== "balanced") {
    throw new Error("Marathon Base supports balanced goal style only.");
  }
}

export function buildMarathonBaseAuthoringInput(
  sourceInput: StructuredFirstPlanAuthoringInput,
  horizonWeeks: number,
): StructuredFirstPlanAuthoringInput {
  return structuredPlanAuthoringInputSchema.parse({
    ...sourceInput,
    goal: {
      ...sourceInput.goal,
      goalType: "marathon",
      goalLabel: "Marathon Base",
      targetTime: null,
      targetEventName: "Marathon Base Plan Preset",
    },
    schedule: {
      ...sourceInput.schedule,
      targetDate: null,
      preparationHorizonWeeks: horizonWeeks,
    },
    preferences: {
      ...sourceInput.preferences,
      preferredWorkoutMix: "balanced",
      notes: buildPresetNotes("Marathon Base", sourceInput.preferences.notes),
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
  });
}

export function buildMarathonBaseCanonicalPlan(authoringInput: StructuredFirstPlanAuthoringInput) {
  const normalized = normalizeStructuredPlanAuthoringInput(authoringInput);
  const generatedPlan = buildStructuredAuthoringPlan(authoringInput);
  const planWorkouts = finalizeGeneratedWorkoutRows(
    expandSingleSegmentSupportRows(
      enforcePostLongRunRecovery(
        applyMarathonBasePattern(generatedPlan.planned_workouts, normalized),
      ),
    ),
    normalized,
  );
  const canonicalPlan = trainingPlanV2Schema.parse({
    ...generatedPlan,
    plan_id: `plan-preset-marathon-base-${generatedPlan.start_date}`,
    plan_name: "Marathon Base Plan Preset",
    source_kind: "plan_preset_v1",
    goal: {
      ...(generatedPlan.goal ?? {}),
      goal_type: "marathon",
      goal_label: "Marathon Base",
    },
    planned_workouts: planWorkouts,
  });

  assertMarathonBasePlan(canonicalPlan, authoringInput);

  return canonicalPlan;
}

function applyMarathonBasePattern(
  workouts: TrainingPlanV2["planned_workouts"],
  normalized: NormalizedStructuredInput,
) {
  let nextWorkouts = workouts.map((workout) =>
    toMarathonBaseWorkout(workout, normalized),
  ) as TrainingPlanV2["planned_workouts"];
  nextWorkouts = applyPlanPresetCompositionSteps({
    workouts: nextWorkouts,
    normalized,
    recipeLabel: "Marathon Base",
    steps: marathonBaseCompositionSteps,
  });

  return nextWorkouts;
}

function toMarathonBaseWorkout(
  workout: TrainingPlanV2["planned_workouts"][number],
  normalized: NormalizedStructuredInput,
) {
  const identity = workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type;
  const context = buildWorkoutContext(workout, normalized);

  if (identity === "taper_tuneup_run") {
    return buildEasyWorkout(context);
  }

  if (identity === "taper_long_run") {
    return retagWorkout(workout, "cutback_long_run", "Cutback long run", "Reduced long run.");
  }

  if (
    identity === "race_pace_session" ||
    identity === "distance_intervals" ||
    identity === "time_intervals" ||
    identity === "5k_sharpening_repeats" ||
    identity === "10k_rhythm_intervals" ||
    identity === "half_marathon_threshold_durability" ||
    identity === "controlled_tempo_session" ||
    identity === "progression_run"
  ) {
    return buildMarathonSteadySpecificityWorkout(context);
  }

  return workout;
}

function assertMarathonBasePlan(
  canonicalPlan: TrainingPlanV2,
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  assertFixedRestAndLongRunDay({
    canonicalPlan,
    authoringInput,
    recipeLabel: "Marathon Base",
  });

  assertPlanPresetComposition(canonicalPlan, {
    recipeLabel: "Marathon Base",
    allowedIdentities: allowedMarathonBaseIdentities,
    requiredIdentities: [
      "marathon_steady_specificity",
      "long_run_with_steady_finish",
      "cutback_long_run",
    ],
    specificTouchIdentities: marathonBaseSpecificIdentities,
    maxSpecificTouchesPerWeek: 1,
  });
}
