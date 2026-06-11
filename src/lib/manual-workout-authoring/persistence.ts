import { trainingPlanV2Schema, type TrainingPlanV2 } from "@/lib/imported-plan";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
  type ManualWorkoutCanonicalDraft,
  type ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring/schema";
import type { AdditionalPlanPersistenceMetadata } from "@/lib/plan-authoring-snapshot";
import type { Json } from "@/lib/supabase/database";
import type { Step, StepPrescription, StepUnitPrescription } from "@/lib/training";

export function buildManualWorkoutUserBuiltTrainingPlan(
  draft: ManualWorkoutCanonicalDraft,
): TrainingPlanV2 {
  return trainingPlanV2Schema.parse({
    schema_version: "training-plan-v2",
    plan_name: "Manual user-built plan",
    source_kind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    generated_for: "Hito manual plan runner",
    goal: {
      goal_type: "build_consistency",
      goal_label: "Manual user-built plan",
    },
    runner_profile: {
      primary_goal: "Manual user-built plan",
      baseline_sessions_per_week: 1,
      risk_policy:
        "Manual user-built plan starts only after explicit backend review and confirmation.",
      preferred_effort_language:
        "Use executable duration, distance, repeat, work, and recovery structure before cues.",
    },
    start_date: draft.workoutDate,
    preparation_horizon_weeks: 1,
    plan_preferences: {
      preferred_running_days: [draft.weekday],
      max_running_days_per_week: 1,
      no_double_days: false,
      allow_back_to_back_days: true,
      preferred_workout_mix: "Manual user-built plan v1",
      notes:
        "Created from one reviewed manual workout. Empty active manual plans are not persisted.",
    },
    training_constraints: {
      running_days_per_week: 1,
      full_rest_days: [],
      intensity_distribution:
        "User-authored first workout only; no generated cadence or recurrence is inferred.",
      progression_policy:
        "Manual user-built plan creation persists only the reviewed workout that the runner confirmed.",
    },
    planned_workouts: [buildManualWorkoutTrainingPlanRow(draft)],
  } satisfies TrainingPlanV2);
}

function buildManualWorkoutTrainingPlanRow(
  draft: ManualWorkoutCanonicalDraft,
): TrainingPlanV2["planned_workouts"][number] {
  return {
    workout_id: `manual-${draft.workoutDate}-${draft.templateKey}`,
    date: draft.workoutDate,
    weekday: draft.weekday,
    week_number: 1,
    phase: "Manual build",
    segments:
      draft.workoutType === "rest"
        ? [buildManualRestSegment(draft)]
        : draft.steps.map((step, index) => buildManualWorkoutSegment(step, index + 1)),
    workout_type: draft.workoutType,
    source_workout_type: draft.sourceWorkoutType,
    workout_family: draft.workoutFamily,
    workout_identity: draft.workoutIdentity,
    calendar_icon_key: draft.calendarIconKey,
    goal_context: {
      goal_type: "build_consistency",
      goal_style: "manual_user_built",
      terrain_focus: "standard",
      target_date: null,
      target_time: null,
    },
    metric_mode: draft.metricMode,
    title: draft.title,
    summary: draft.notes ?? "Manual workout reviewed and confirmed by the runner.",
    ...(draft.plannedRpe ? { planned_rpe: draft.plannedRpe } : {}),
    ...(draft.estimatedFatigue ? { estimated_fatigue: draft.estimatedFatigue } : {}),
    ...(draft.recoveryPriority ? { recovery_priority: draft.recoveryPriority } : {}),
  };
}

function buildManualRestSegment(
  draft: ManualWorkoutCanonicalDraft,
): TrainingPlanV2["planned_workouts"][number]["segments"][number] {
  return {
    segment_id: `manual-${draft.workoutDate}-rest`,
    segment_type: "rest",
    label: "Rest",
    sequence: 1,
    guidance: draft.notes ?? "Rest and recover.",
    prescription: { mode: "none" },
    target: {
      cue: "Rest and recover.",
    },
  };
}

function buildManualWorkoutSegment(
  step: Step,
  sequence: number,
): TrainingPlanV2["planned_workouts"][number]["segments"][number] {
  const prescription = normalizeStepPrescription(step.prescription, step);
  const segmentType = normalizeManualSegmentType(step.segment_type, prescription);

  return {
    segment_id: step.segment_id ?? `manual-segment-${sequence}`,
    segment_type: segmentType,
    label: step.label ?? `Segment ${sequence}`,
    sequence: step.sequence ?? sequence,
    ...(step.guidance ? { guidance: step.guidance } : {}),
    prescription,
    ...(step.duration_min ? { duration_min: step.duration_min } : {}),
    ...(step.distance_km ? { distance_km: step.distance_km } : {}),
    ...(step.target ? { target: step.target } : {}),
    ...(step.repeats ? { repeat_count: step.repeats } : {}),
    ...(step.work?.distance_km ? { work_distance_km: step.work.distance_km } : {}),
    ...(step.work?.duration_min ? { work_duration_min: step.work.duration_min } : {}),
    ...(step.recovery?.duration_min ? { recovery_duration_min: step.recovery.duration_min } : {}),
    ...(step.recovery?.distance_km ? { recovery_distance_km: step.recovery.distance_km } : {}),
    ...(step.recovery?.target ? { recovery_target: step.recovery.target } : {}),
  };
}

function normalizeStepPrescription(
  prescription: StepPrescription | undefined,
  step: Step,
): NonNullable<TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"]> {
  if (prescription) {
    return {
      mode: prescription.mode,
      ...(prescription.duration_min ? { duration_min: prescription.duration_min } : {}),
      ...(prescription.distance_km ? { distance_km: prescription.distance_km } : {}),
      ...(prescription.repeat_count ? { repeat_count: prescription.repeat_count } : {}),
      ...(prescription.repeat_unit
        ? { repeat_unit: normalizeStepUnitPrescription(prescription.repeat_unit) }
        : {}),
      ...(prescription.recovery_unit
        ? { recovery_unit: normalizeStepUnitPrescription(prescription.recovery_unit) }
        : {}),
    };
  }

  if (step.distance_km) {
    return {
      mode: "distance",
      distance_km: step.distance_km,
    };
  }

  if (step.duration_min) {
    return {
      mode: "time",
      duration_min: step.duration_min,
    };
  }

  return {
    mode: "none",
  };
}

function normalizeStepUnitPrescription(
  unit: StepUnitPrescription,
): NonNullable<
  TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"]
>["repeat_unit"] {
  return {
    mode: unit.mode,
    ...(unit.duration_min ? { duration_min: unit.duration_min } : {}),
    ...(unit.distance_km ? { distance_km: unit.distance_km } : {}),
  };
}

function normalizeManualSegmentType(
  segmentType: string | undefined,
  prescription: NonNullable<
    TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"]
  >,
): TrainingPlanV2["planned_workouts"][number]["segments"][number]["segment_type"] {
  switch (segmentType) {
    case "warmup":
    case "main":
    case "cooldown":
    case "recovery":
    case "rest":
    case "mobility":
    case "mobility_optional":
    case "strength":
    case "activation":
    case "drills":
    case "strides":
    case "recovery_jog":
    case "fueling":
    case "tempo_block":
    case "interval_block":
      return segmentType;
    default:
      return prescription.mode === "repeats" ? "interval_block" : "main";
  }
}

export function buildManualWorkoutPersistenceMetadata(input: {
  draft: ManualWorkoutCanonicalDraft;
  canonicalPlan: TrainingPlanV2;
  reviewChecksum: string;
  warnings: string[];
}): AdditionalPlanPersistenceMetadata {
  const targetTruthMode = deriveManualTargetTruthMode(input.draft);

  return {
    goalMetadata: toJson({
      source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
      manual_user_built_plan: {
        source_kind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
        source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
        workout_authoring_source_kind: input.draft.sourceKind,
        workout_authoring_source_status: input.draft.sourceStatus,
        template_key: input.draft.templateKey,
        template_version: "manual_workout_template_registry_v1",
        workout_date: input.draft.workoutDate,
        row_count: input.canonicalPlan.planned_workouts.length,
        non_rest_row_count: input.canonicalPlan.planned_workouts.filter(
          (workout) => workout.workout_type !== "rest",
        ).length,
        review_payload_version: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
        review_checksum: input.reviewChecksum,
        mapping_gaps: input.draft.mappingGaps,
        metric_truth_mode: targetTruthMode,
        warnings: input.warnings,
      },
    }),
    planPreferences: toJson({
      manual_workout_authoring_review: {
        source_kind: input.draft.sourceKind,
        source_status: input.draft.sourceStatus,
        template_key: input.draft.templateKey,
        template_version: "manual_workout_template_registry_v1",
        workout_date: input.draft.workoutDate,
        review_payload_version: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
        review_checksum: input.reviewChecksum,
        row_count: input.canonicalPlan.planned_workouts.length,
        metric_truth_mode: targetTruthMode,
        mapping_gaps: input.draft.mappingGaps,
      },
    }),
  };
}

export function deriveManualTargetTruthMode(
  draft: ManualWorkoutCanonicalDraft,
): ManualWorkoutTargetTruthMode {
  if (draft.workoutType === "rest") {
    return "none";
  }

  return draft.metricMode.hr_target_source === "default_estimated_hr"
    ? "editable_default_hr"
    : "structure_only";
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
