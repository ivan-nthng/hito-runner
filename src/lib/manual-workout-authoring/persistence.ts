import type { EmptyActivePlanCreationInput } from "@/lib/active-plan-persistence";
import { trainingPlanV2Schema, type TrainingPlanV2 } from "@/lib/imported-plan";
import {
  MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  type ManualWorkoutCanonicalDraft,
  type ManualEmptyPlanSetupInput,
  type ManualSetupRunningLevel,
  type ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring/schema";
import type { Json } from "@/lib/supabase/database";
import type {
  Step,
  StepPrescription,
  StepRepeatChildPrescription,
  StepUnitPrescription,
} from "@/lib/training";

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

export function buildManualEmptyActivePlanCreationInput(input: {
  setup: ManualEmptyPlanSetupInput;
  currentDate: string;
}): EmptyActivePlanCreationInput {
  const runningLevelLabel = formatManualSetupRunningLevel(input.setup.runningLevel);
  const baselineNotes = `Manual setup running level: ${runningLevelLabel}.`;

  return {
    profile: {
      goalType: "build_consistency",
      goalLabel: "Manual user-built plan",
      baselineSessionsPerWeek: 0,
      baselineLongRunKm: 0,
      baselineNotes,
      firstName: null,
      lastName: null,
      displayName: null,
      avatarUrl: null,
      avatarStoragePath: null,
      age: input.setup.age,
      weightKg: input.setup.weightKg,
      heightCm: input.setup.heightCm,
    },
    title: "Manual user-built plan",
    goalSummary: "Manual user-built plan",
    sourceTemplate: "training-plan-v2",
    schemaVersion: "training-plan-v2",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: input.currentDate,
    endDate: input.currentDate,
    targetDate: null,
    goalMetadata: toJson({
      source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
      manual_user_built_plan: {
        source_kind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
        source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
        creation_mode: "empty_manual_setup",
        setup_payload_version: MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
        row_count: 0,
        non_rest_row_count: 0,
        running_level: input.setup.runningLevel,
      },
    }),
    planPreferences: toJson({
      preferred_workout_mix: "Manual user-built plan v1",
      notes:
        "Created from Manual setup as an empty active plan. Workouts are added only after backend review and confirmation.",
      manual_setup: {
        setup_payload_version: MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
        running_level: input.setup.runningLevel,
      },
      manual_workout_authoring_reviews: [],
    }),
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
  const target = prescription.mode === "repeats" ? undefined : step.target;

  return {
    segment_id: step.segment_id ?? `manual-segment-${sequence}`,
    segment_type: segmentType,
    label: step.label ?? `Segment ${sequence}`,
    sequence: step.sequence ?? sequence,
    ...(step.guidance ? { guidance: step.guidance } : {}),
    prescription,
    ...(step.duration_min ? { duration_min: step.duration_min } : {}),
    ...(step.distance_km ? { distance_km: step.distance_km } : {}),
    ...(target ? { target } : {}),
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
      ...(prescription.children?.length
        ? { children: prescription.children.map(normalizeRepeatChildPrescription) }
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

function normalizeRepeatChildPrescription(
  child: StepRepeatChildPrescription,
): StepRepeatChildPrescription {
  return {
    role: child.role,
    ...(child.label ? { label: child.label } : {}),
    ...(child.sequence ? { sequence: child.sequence } : {}),
    ...(child.guidance ? { guidance: child.guidance } : {}),
    prescription: normalizeStepUnitPrescription(child.prescription),
    ...(child.target ? { target: child.target } : {}),
  };
}

function normalizeStepUnitPrescription(unit: StepUnitPrescription): StepUnitPrescription {
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

export function deriveManualTargetTruthMode(
  draft: ManualWorkoutCanonicalDraft,
): ManualWorkoutTargetTruthMode {
  if (draft.workoutType === "rest") {
    return "none";
  }

  return "structure_only";
}

function formatManualSetupRunningLevel(runningLevel: ManualSetupRunningLevel) {
  switch (runningLevel) {
    case "new_to_running":
      return "new to running";
    case "beginner":
      return "beginner";
    case "running_regularly":
      return "running regularly";
    case "performance_focused":
      return "performance focused";
  }
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
