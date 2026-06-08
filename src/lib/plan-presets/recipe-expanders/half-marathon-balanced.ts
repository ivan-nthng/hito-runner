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
  buildHalfMarathonThresholdWorkout,
  buildProgressionWorkout,
  buildTempoWorkout,
} from "@/lib/structured-plan-authoring-workouts";
import {
  assertFixedRestAndLongRunDay,
  buildPresetNotes,
  buildWorkoutContext,
  enforcePostLongRunRecovery,
  expandSingleSegmentSupportRows,
  retagWorkout,
} from "@/lib/plan-presets/recipe-expanders/shared";

export const HALF_MARATHON_BALANCED_PRESET_ID = "plan_preset_half_marathon_balanced_v1";
export const HALF_MARATHON_BALANCED_GUARDRAIL_SUMMARY =
  "Half Marathon Balanced excludes target-date, target-time, race-pace, taper, interval overreach, and two-quality-week patterns in v1.";

const allowedHalfMarathonBalancedIdentities = new Set<string>([
  ...PLAN_PRESET_SUPPORT_IDENTITIES,
  "long_run_with_steady_finish",
  "controlled_tempo_session",
  "progression_run",
  "half_marathon_threshold_durability",
]);

const halfMarathonBalancedSpecificIdentities = new Set<string>([
  "controlled_tempo_session",
  "progression_run",
  "half_marathon_threshold_durability",
  "long_run_with_steady_finish",
]);

const halfMarathonBalancedCompositionSteps: readonly PlanPresetCompositionStep[] = [
  {
    kind: "specific_workout",
    weekNumber: 5,
    buildWorkout: buildTempoWorkout,
    label: "Build-phase controlled tempo",
  },
  {
    kind: "long_run_steady_finish",
    weekNumber: 7,
  },
  {
    kind: "specific_workout",
    weekNumber: 9,
    buildWorkout: buildHalfMarathonThresholdWorkout,
    label: "Specific-phase threshold durability",
  },
];

export function validateHalfMarathonBalancedInput(input: PlanPresetEligibilityInput) {
  if (input.goal.goalDistance !== "half_marathon") {
    throw new Error("Half Marathon Balanced draft expansion requires a half-marathon setup.");
  }

  if (input.goal.goalStyle !== "balanced") {
    throw new Error("Half Marathon Balanced supports balanced goal style only.");
  }
}

export function buildHalfMarathonBalancedAuthoringInput(
  sourceInput: StructuredFirstPlanAuthoringInput,
  horizonWeeks: number,
): StructuredFirstPlanAuthoringInput {
  return structuredPlanAuthoringInputSchema.parse({
    ...sourceInput,
    goal: {
      ...sourceInput.goal,
      goalType: "half_marathon",
      goalLabel: "Half Marathon Balanced",
      targetTime: null,
      targetEventName: "Half Marathon Balanced Plan Preset",
    },
    schedule: {
      ...sourceInput.schedule,
      targetDate: null,
      preparationHorizonWeeks: horizonWeeks,
    },
    preferences: {
      ...sourceInput.preferences,
      preferredWorkoutMix: "balanced",
      notes: buildPresetNotes("Half Marathon Balanced", sourceInput.preferences.notes),
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
  });
}

export function buildHalfMarathonBalancedCanonicalPlan(
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  const normalized = normalizeStructuredPlanAuthoringInput(authoringInput);
  const generatedPlan = buildStructuredAuthoringPlan(authoringInput);
  const planWorkouts = finalizeGeneratedWorkoutRows(
    expandSingleSegmentSupportRows(
      enforcePostLongRunRecovery(
        applyHalfMarathonBalancedPattern(generatedPlan.planned_workouts, normalized),
      ),
    ),
    normalized,
  );
  const canonicalPlan = trainingPlanV2Schema.parse({
    ...generatedPlan,
    plan_id: `plan-preset-half-marathon-balanced-${generatedPlan.start_date}`,
    plan_name: "Half Marathon Balanced Plan Preset",
    source_kind: "plan_preset_v1",
    goal: {
      ...(generatedPlan.goal ?? {}),
      goal_type: "half_marathon",
      goal_label: "Half Marathon Balanced",
    },
    planned_workouts: planWorkouts,
  });

  assertHalfMarathonBalancedPlan(canonicalPlan, authoringInput);

  return canonicalPlan;
}

function applyHalfMarathonBalancedPattern(
  workouts: TrainingPlanV2["planned_workouts"],
  normalized: NormalizedStructuredInput,
) {
  let nextWorkouts = workouts.map((workout) =>
    toHalfMarathonBalancedWorkout(workout, normalized),
  ) as TrainingPlanV2["planned_workouts"];
  nextWorkouts = applyPlanPresetCompositionSteps({
    workouts: nextWorkouts,
    normalized,
    recipeLabel: "Half Marathon Balanced",
    steps: halfMarathonBalancedCompositionSteps,
  });

  return nextWorkouts;
}

function toHalfMarathonBalancedWorkout(
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
    identity === "10k_rhythm_intervals"
  ) {
    return buildProgressionWorkout(context);
  }

  return workout;
}

function assertHalfMarathonBalancedPlan(
  canonicalPlan: TrainingPlanV2,
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  assertFixedRestAndLongRunDay({
    canonicalPlan,
    authoringInput,
    recipeLabel: "Half Marathon Balanced",
  });

  assertPlanPresetComposition(canonicalPlan, {
    recipeLabel: "Half Marathon Balanced",
    allowedIdentities: allowedHalfMarathonBalancedIdentities,
    requiredIdentities: [
      "controlled_tempo_session",
      "half_marathon_threshold_durability",
      "long_run_with_steady_finish",
    ],
    specificTouchIdentities: halfMarathonBalancedSpecificIdentities,
    maxSpecificTouchesPerWeek: 1,
  });
}
