import { trainingPlanV2Schema, type TrainingPlanV2 } from "@/lib/imported-plan";
import type { PlanPresetEligibilityInput } from "@/lib/plan-presets/schema";
import {
  PLAN_PRESET_SUPPORT_IDENTITIES,
  assertPlanPresetComposition,
} from "@/lib/plan-presets/composition";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "@/lib/structured-plan-authoring";
import type { StructuredFirstPlanAuthoringInput } from "@/lib/structured-first-plan-onboarding";
import {
  assertFixedRestAndLongRunDay,
  buildPresetNotes,
  enforcePostLongRunRecovery,
  retagWorkout,
} from "@/lib/plan-presets/recipe-expanders/shared";

export const TEN_K_FOUNDATION_PRESET_ID = "plan_preset_10k_foundation_v1";
export const TEN_K_FOUNDATION_GUARDRAIL_SUMMARY =
  "10K Foundation excludes target-date, target-time, race-pace, and taper-specific identities in v1.";

const tenKFoundationGoalStyles = new Set(["relaxed", "balanced"]);

const allowedTenKFoundationIdentities = new Set<string>([
  ...PLAN_PRESET_SUPPORT_IDENTITIES,
  "controlled_tempo_session",
  "progression_run",
  "10k_rhythm_intervals",
]);

export function validateTenKFoundationInput(input: PlanPresetEligibilityInput) {
  if (input.goal.goalDistance !== "10k") {
    throw new Error("10K Foundation draft expansion requires a 10K setup.");
  }

  if (!tenKFoundationGoalStyles.has(input.goal.goalStyle)) {
    throw new Error("10K Foundation supports relaxed or balanced goal styles only.");
  }
}

export function buildTenKFoundationAuthoringInput(
  sourceInput: StructuredFirstPlanAuthoringInput,
  horizonWeeks: number,
): StructuredFirstPlanAuthoringInput {
  return structuredPlanAuthoringInputSchema.parse({
    ...sourceInput,
    goal: {
      ...sourceInput.goal,
      goalType: "10k",
      goalLabel: "10K Foundation",
      targetTime: null,
      targetEventName: "10K Foundation Plan Preset",
    },
    schedule: {
      ...sourceInput.schedule,
      targetDate: null,
      preparationHorizonWeeks: horizonWeeks,
    },
    preferences: {
      ...sourceInput.preferences,
      preferredWorkoutMix: "easy_heavy",
      notes: buildPresetNotes("10K Foundation", sourceInput.preferences.notes),
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
  });
}

export function buildTenKFoundationCanonicalPlan(
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  const generatedPlan = buildStructuredAuthoringPlan(authoringInput);
  const planWorkouts = enforcePostLongRunRecovery(
    generatedPlan.planned_workouts.map(toTenKFoundationWorkout),
  );
  const canonicalPlan = trainingPlanV2Schema.parse({
    ...generatedPlan,
    plan_id: `plan-preset-10k-foundation-${generatedPlan.start_date}`,
    plan_name: "10K Foundation Plan Preset",
    source_kind: "plan_preset_v1",
    goal: {
      ...(generatedPlan.goal ?? {}),
      goal_type: "10k",
      goal_label: "10K Foundation",
    },
    planned_workouts: planWorkouts,
  });

  assertTenKFoundationPlan(canonicalPlan, authoringInput);

  return canonicalPlan;
}

function toTenKFoundationWorkout(workout: TrainingPlanV2["planned_workouts"][number]) {
  const identity = workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type;

  if (identity === "taper_tuneup_run") {
    return retagWorkout(
      workout,
      "easy_aerobic_run",
      "Easy aerobic run",
      "Easy aerobic support run.",
    );
  }

  if (identity === "taper_long_run") {
    return retagWorkout(workout, "long_aerobic_run", "Long aerobic run", "Long aerobic run.");
  }

  if (identity === "race_pace_session") {
    return retagWorkout(
      workout,
      "progression_run",
      "Progression run",
      "Controlled progression run without race-pace targeting.",
    );
  }

  if (identity === "5k_sharpening_repeats") {
    return retagWorkout(
      workout,
      "easy_run_with_strides",
      "Easy run with relaxed strides",
      "Easy aerobic run with short relaxed strides.",
    );
  }

  return workout;
}

function assertTenKFoundationPlan(
  canonicalPlan: TrainingPlanV2,
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  assertFixedRestAndLongRunDay({
    canonicalPlan,
    authoringInput,
    recipeLabel: "10K Foundation",
  });

  assertPlanPresetComposition(canonicalPlan, {
    recipeLabel: "10K Foundation",
    allowedIdentities: allowedTenKFoundationIdentities,
  });
}
