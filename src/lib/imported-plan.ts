import { z } from "zod";
import {
  normalizeExecutableStepInstructions,
  stepPlannedDistanceKm,
  stepPlannedDurationMin,
} from "@/lib/training";
import type {
  RunnerProfileSummary,
  Step,
  StepPrescription,
  StepTarget,
  StepUnitPrescription,
  WorkoutType,
} from "@/lib/training";
import type { Json } from "@/lib/supabase/database";

export const FUTURE_TEMPLATE_VERSION = "training-plan-v2";
export const FUTURE_TEMPLATE_DOWNLOAD_PATH = "/templates/hito-training-plan-v2-template.json";
export const ML_AGENT_TEMPLATE_META_KEY = "_ml_agent_template";
export const REMOVED_LEGACY_IMPORT_NOTICE =
  "Legacy week_1_preview[] JSON is no longer supported. Convert this file to training-plan-v2 before importing.";

export const V2_IMPORT_ROOT_KEYS = [
  "schema_version",
  "plan_id",
  "plan_name",
  "source_kind",
  "_ml_agent_template",
  "created_at",
  "generated_for",
  "goal",
  "runner_profile",
  "start_date",
  "preparation_horizon_weeks",
  "preparation_horizon_months",
  "target_date",
  "plan_preferences",
  "planned_workouts[]",
] as const;

export const V2_IGNORED_WORKOUT_KEYS = [
  "status",
  "completion_state",
  "ai_adjustable",
  "ai_adjustment_candidate",
  "ai_notes",
  "ai_recovery_recommendation",
  "ai_risk_flags",
  "completed_result",
  "garmin_sync_placeholder",
  "strava_sync_placeholder",
  "user_feedback_placeholder",
  "pain_tracking_placeholder",
] as const;

const targetValueSchema = z.union([z.string(), z.number()]);
const placeholderEnvelopeSchema = z.union([z.boolean(), z.record(z.string(), z.unknown())]);

const v2TargetSchema = z
  .object({
    intensity: z.string().trim().min(1).optional(),
    hr_bpm_range: z.string().trim().min(1).optional(),
    hr_bpm: z.string().trim().min(1).optional(),
    pace_min_per_km_range: z.string().trim().min(1).optional(),
    pace_range_min_km: z.string().trim().min(1).optional(),
    pace: z.string().trim().min(1).optional(),
    rpe: targetValueSchema.optional(),
    cadence_spm_range: z.string().trim().min(1).optional(),
    cue: z.string().trim().min(1).optional(),
    hint: z.string().trim().min(1).optional(),
    extra: z.record(z.string(), targetValueSchema).optional(),
  })
  .catchall(targetValueSchema);

const v2RunnerProfileSchema = z
  .object({
    experience_level: z.string().trim().min(1).optional(),
    baseline_sessions_per_week: z.number().int().min(1).max(7).optional(),
    baseline_long_run_km: z.number().positive().optional(),
    baseline_long_run_duration_min: z.number().int().positive().optional(),
    age: z.number().int().min(1).max(120).optional(),
    height_cm: z.number().min(1).max(300).optional(),
    weight_kg: z.number().min(1).max(500).optional(),
    primary_goal: z.string().trim().min(1).optional(),
    secondary_goal: z.string().trim().min(1).optional(),
    current_easy_aerobic_hr_bpm: z.string().trim().min(1).optional(),
    risk_policy: z.string().trim().min(1).optional(),
    recent_injury_recovery_context: z.string().trim().min(1).optional(),
    preferred_effort_language: z.string().trim().min(1).optional(),
    recent_result_summary: z.string().trim().min(1).optional(),
    current_easy_pace_range: z.string().trim().min(1).optional(),
    current_training_load_summary: z.string().trim().min(1).optional(),
    recent_race_results: z
      .array(
        z
          .object({
            distance: z.string().trim().min(1),
            result_time: z.string().trim().min(1),
            result_date: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

const v2TrainingConstraintsSchema = z
  .object({
    running_days_per_week: z.number().int().min(1).max(7).optional(),
    full_rest_days: z.array(z.string().trim().min(1)).optional(),
    long_run_day: z.string().trim().min(1).optional(),
    intensity_distribution: z.string().trim().min(1).optional(),
    progression_policy: z.string().trim().min(1).optional(),
  })
  .strict();

const v2GoalSchema = z
  .object({
    goal_type: z.string().trim().min(1),
    goal_label: z.string().trim().min(1),
    target_event: z
      .object({
        label: z.string().trim().min(1).optional(),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        event_name: z.string().trim().min(1).optional(),
        event_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const v2PlanPreferencesSchema = z
  .object({
    preferred_running_days: z.array(z.string().trim().min(1)).optional(),
    preferred_run_days: z.array(z.string().trim().min(1)).optional(),
    unavailable_days: z.array(z.string().trim().min(1)).optional(),
    blocked_days: z.array(z.string().trim().min(1)).optional(),
    max_weekly_sessions: z.number().int().positive().optional(),
    max_running_days_per_week: z.number().int().positive().optional(),
    no_double_days: z.boolean().optional(),
    allow_back_to_back_days: z.boolean().optional(),
    preferred_long_run_day: z.string().trim().min(1).optional(),
    injury_constraints: z.array(z.string().trim().min(1)).optional(),
    hard_constraints: z.array(z.string().trim().min(1)).optional(),
    preferred_workout_mix: z.string().trim().min(1).optional(),
    terrain_focus: z.enum(["standard", "rolling", "mountain"]).optional(),
    strength_or_mobility_interest: z.string().trim().min(1).optional(),
    indoor_treadmill_ok: z.boolean().optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

const v2UnitPrescriptionSchema = z
  .object({
    mode: z.enum(["time", "distance", "none"]),
    duration_min: z.number().positive().optional(),
    distance_km: z.number().positive().optional(),
  })
  .strict()
  .superRefine((unit, context) => {
    if (unit.mode === "time" && !unit.duration_min) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["duration_min"],
        message: "time prescription units require duration_min.",
      });
    }

    if (unit.mode === "distance" && !unit.distance_km) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["distance_km"],
        message: "distance prescription units require distance_km.",
      });
    }
  });

const v2SegmentPrescriptionSchema = z
  .object({
    mode: z.enum(["time", "distance", "repeats", "none"]),
    duration_min: z.number().positive().optional(),
    distance_km: z.number().positive().optional(),
    repeat_count: z.number().int().positive().optional(),
    repeat_unit: v2UnitPrescriptionSchema.optional(),
    recovery_unit: v2UnitPrescriptionSchema.optional(),
  })
  .strict()
  .superRefine((prescription, context) => {
    if (prescription.mode === "time" && !prescription.duration_min) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["duration_min"],
        message: "time prescriptions require duration_min.",
      });
    }

    if (prescription.mode === "distance" && !prescription.distance_km) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["distance_km"],
        message: "distance prescriptions require distance_km.",
      });
    }

    if (prescription.mode === "repeats") {
      if (!prescription.repeat_count) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["repeat_count"],
          message: "repeat prescriptions require repeat_count.",
        });
      }

      if (!prescription.repeat_unit) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["repeat_unit"],
          message: "repeat prescriptions require repeat_unit.",
        });
      }
    }
  });

const v2SegmentSchema = z
  .object({
    segment_id: z.string().trim().min(1).optional(),
    segment_type: z.enum([
      "warmup",
      "main",
      "cooldown",
      "recovery",
      "rest",
      "mobility",
      "mobility_optional",
      "strength",
      "activation",
      "drills",
      "strides",
      "recovery_jog",
      "fueling",
      "tempo_block",
      "interval_block",
    ]),
    label: z.string().trim().min(1).optional(),
    sequence: z.number().int().min(1).optional(),
    guidance: z.string().trim().min(1).optional(),
    prescription: v2SegmentPrescriptionSchema.optional(),
    duration_min: z.number().positive().optional(),
    distance_km: z.number().positive().optional(),
    target: v2TargetSchema.optional(),
    repeat_count: z.number().int().positive().optional(),
    work_distance_km: z.number().positive().optional(),
    work_duration_min: z.number().positive().optional(),
    work_duration_sec: z.number().positive().optional(),
    recovery_duration_min: z.number().positive().optional(),
    recovery_duration_sec: z.number().positive().optional(),
    recovery_distance_km: z.number().positive().optional(),
    recovery_target: v2TargetSchema.optional(),
  })
  .strict()
  .superRefine((segment, context) => {
    if (segment.prescription) {
      if (
        (segment.segment_type === "interval_block" || segment.segment_type === "strides") &&
        segment.prescription.mode !== "repeats"
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prescription", "mode"],
          message: `${segment.segment_type} segments require prescription.mode = repeats.`,
        });
      }

      if (
        (segment.segment_type === "rest" || segment.segment_type === "fueling") &&
        segment.prescription.mode !== "none"
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prescription", "mode"],
          message: `${segment.segment_type} segments require prescription.mode = none.`,
        });
      }

      return;
    }

    if (segment.segment_type === "interval_block" || segment.segment_type === "strides") {
      if (!segment.repeat_count) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["repeat_count"],
          message: `repeat_count is required for ${segment.segment_type} segments.`,
        });
      }

      if (
        !segment.work_distance_km &&
        !segment.work_duration_min &&
        !segment.work_duration_sec &&
        !segment.duration_min
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["work_distance_km"],
          message: `${segment.segment_type} segments need work_distance_km, work_duration_min, work_duration_sec, or duration_min.`,
        });
      }

      return;
    }

    if (segment.segment_type === "rest" || segment.segment_type === "fueling") {
      return;
    }

    if (
      segment.segment_type === "tempo_block" &&
      (segment.repeat_count ||
        segment.work_distance_km ||
        segment.work_duration_min ||
        segment.work_duration_sec ||
        segment.recovery_duration_min ||
        segment.recovery_duration_sec ||
        segment.recovery_distance_km)
    ) {
      if (!segment.repeat_count) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["repeat_count"],
          message: "repeat_count is required for repeated tempo_block segments.",
        });
      }

      if (
        !segment.work_distance_km &&
        !segment.work_duration_min &&
        !segment.work_duration_sec &&
        !segment.duration_min
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["work_distance_km"],
          message:
            "repeated tempo_block segments need work_distance_km, work_duration_min, work_duration_sec, or duration_min.",
        });
      }

      return;
    }

    if (!segment.duration_min && !segment.distance_km) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["duration_min"],
        message: `${segment.segment_type} segments require duration_min or distance_km.`,
      });
    }
  });

const v2WorkoutSchema = z
  .object({
    workout_id: z.string().trim().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekday: z.string().trim().min(1),
    week_number: z.number().int().min(1),
    phase: z.string().trim().min(1),
    status: z.unknown().optional(),
    completion_state: z.unknown().optional(),
    ai_adjustable: z.unknown().optional(),
    ai_adjustment_candidate: z.unknown().optional(),
    ai_notes: z.unknown().optional(),
    ai_recovery_recommendation: z.unknown().optional(),
    ai_risk_flags: z.unknown().optional(),
    completed_result: z.unknown().optional(),
    garmin_sync_placeholder: placeholderEnvelopeSchema.optional(),
    strava_sync_placeholder: placeholderEnvelopeSchema.optional(),
    user_feedback_placeholder: placeholderEnvelopeSchema.optional(),
    pain_tracking_placeholder: placeholderEnvelopeSchema.optional(),
    segments: z.array(v2SegmentSchema).min(1),
    workout_type: z.enum([
      "easy",
      "steady_or_easy",
      "rest",
      "long_run",
      "quality",
      "tempo",
      "intervals",
      "progression",
      "race",
      "recovery",
    ]),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    planned_rpe: z.number().int().min(1).max(10).optional(),
    estimated_fatigue: z.string().trim().min(1).optional(),
    recovery_priority: z.string().trim().min(1).optional(),
  })
  .strict();

export const trainingPlanV2Schema = z
  .object({
    plan_id: z.string().trim().min(1).optional(),
    schema_version: z.literal(FUTURE_TEMPLATE_VERSION),
    plan_name: z.string().trim().min(1),
    source_kind: z.string().trim().min(1).optional(),
    [ML_AGENT_TEMPLATE_META_KEY]: z.unknown().optional(),
    created_at: z.string().datetime().optional(),
    generated_for: z.string().trim().min(1),
    goal: v2GoalSchema.optional(),
    runner_profile: v2RunnerProfileSchema.optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    preparation_horizon_weeks: z.number().int().positive().optional(),
    preparation_horizon_months: z.number().int().positive().optional(),
    target_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    plan_preferences: v2PlanPreferencesSchema.optional(),
    training_constraints: v2TrainingConstraintsSchema.optional(),
    planned_workouts: z.array(v2WorkoutSchema).min(1),
  })
  .strict();

export const importedPlanSchema = trainingPlanV2Schema;

export type TrainingPlanV2 = z.infer<typeof trainingPlanV2Schema>;
export type ImportedPlan = TrainingPlanV2;

export interface ImportedWorkoutSeed {
  workoutDate: string;
  weekday: string;
  weekNumber: number;
  phase: string;
  workoutType: WorkoutType;
  sourceWorkoutId: string;
  sourceWorkoutType: string;
  title: string;
  notes: string | null;
  plannedRpe: number | null;
  estimatedFatigue: string | null;
  recoveryPriority: string | null;
  steps: Step[];
  displayOrder: number;
}

export interface ImportedPlanSeed {
  profile: RunnerProfileSummary;
  title: string;
  goalSummary: string;
  sourceTemplate: string;
  schemaVersion: string;
  sourceKind: string | null;
  startDate: string;
  endDate: string;
  targetDate: string | null;
  goalMetadata: Json | null;
  planPreferences: Json | null;
  workouts: ImportedWorkoutSeed[];
}

export interface ImportedPlanSummary {
  planName: string;
  generatedFor: string;
  days: number;
  workouts: number;
  format: "training-plan-v2";
  contractLabel: string;
}

export function validateImportedPlanJson(raw: string) {
  try {
    const parsedJson = JSON.parse(raw) as unknown;

    if (looksLikeRemovedLegacyImport(parsedJson)) {
      return {
        success: false as const,
        error: new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: ["week_1_preview"],
            message: REMOVED_LEGACY_IMPORT_NOTICE,
          },
        ]),
      };
    }

    return trainingPlanV2Schema.safeParse(parsedJson);
  } catch {
    return null;
  }
}

export function summarizeImportedPlan(plan: ImportedPlan): ImportedPlanSummary {
  return {
    planName: plan.plan_name,
    generatedFor: plan.generated_for,
    days: plan.planned_workouts.length,
    workouts: plan.planned_workouts.filter((item) => item.workout_type !== "rest").length,
    format: "training-plan-v2",
    contractLabel: "training-plan-v2",
  };
}

export function buildImportedPlanSeed(plan: ImportedPlan): ImportedPlanSeed {
  return buildTrainingPlanV2Seed(plan);
}

function buildTrainingPlanV2Seed(plan: TrainingPlanV2): ImportedPlanSeed {
  const workouts = plan.planned_workouts
    .slice()
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.week_number - right.week_number ||
        left.title.localeCompare(right.title),
    )
    .map((entry, index) => ({
      workoutDate: entry.date,
      weekday: entry.weekday,
      weekNumber: entry.week_number,
      phase: entry.phase,
      workoutType: normalizeV2WorkoutType(entry.workout_type),
      sourceWorkoutId: entry.workout_id,
      sourceWorkoutType: entry.workout_type,
      title: entry.title,
      notes: buildV2Notes(entry),
      plannedRpe: entry.planned_rpe ?? null,
      estimatedFatigue: entry.estimated_fatigue ?? null,
      recoveryPriority: entry.recovery_priority ?? null,
      steps: normalizeV2Segments(entry.segments),
      displayOrder: index,
    }));

  const profile = buildImportedProfile(plan.plan_name, plan.generated_for, workouts, plan);

  return {
    profile,
    title: plan.plan_name,
    goalSummary: buildV2GoalSummary(plan),
    sourceTemplate: FUTURE_TEMPLATE_VERSION,
    schemaVersion: plan.schema_version,
    sourceKind: plan.source_kind?.trim() || "training_plan_v2_import",
    startDate: plan.start_date,
    endDate: workouts.at(-1)?.workoutDate ?? plan.start_date,
    targetDate: deriveTargetDate(plan),
    goalMetadata: buildGoalMetadata(plan),
    planPreferences: buildPersistedPlanPreferences(plan),
    workouts,
  };
}

function buildImportedProfile(
  planName: string,
  generatedFor: string,
  workouts: ImportedWorkoutSeed[],
  trainingPlan?: TrainingPlanV2,
): RunnerProfileSummary {
  const baselineSessionsPerWeek =
    trainingPlan?.runner_profile?.baseline_sessions_per_week ??
    deriveBaselineSessionsPerWeek(workouts);
  const baselineLongRunKm = deriveBaselineLongRunKm(workouts, trainingPlan);

  return {
    goalType: deriveRunnerGoalType(planName, trainingPlan),
    goalLabel:
      trainingPlan?.goal?.goal_label?.trim() ||
      trainingPlan?.runner_profile?.primary_goal?.trim() ||
      planName,
    baselineSessionsPerWeek,
    baselineLongRunKm,
    baselineNotes: buildImportedProfileNotes(generatedFor, trainingPlan),
  };
}

function buildV2GoalSummary(plan: TrainingPlanV2) {
  const goalLabel = plan.goal?.goal_label?.trim();

  if (goalLabel) {
    return goalLabel;
  }

  const primaryGoal = plan.runner_profile?.primary_goal?.trim();

  if (primaryGoal) {
    return primaryGoal;
  }

  return `Imported ${FUTURE_TEMPLATE_VERSION} plan for ${plan.generated_for}.`;
}

function deriveBaselineSessionsPerWeek(workouts: ImportedWorkoutSeed[]) {
  const countsByWeek = new Map<number, number>();

  for (const workout of workouts) {
    if (workout.workoutType === "rest") {
      continue;
    }

    countsByWeek.set(workout.weekNumber, (countsByWeek.get(workout.weekNumber) ?? 0) + 1);
  }

  return Math.min(7, Math.max(0, ...Array.from(countsByWeek.values())));
}

function inferGoalType(planName: string): RunnerProfileSummary["goalType"] {
  if (/marathon|race/i.test(planName)) {
    return "first_race";
  }

  if (/distance|build/i.test(planName)) {
    return "distance_build";
  }

  return "build_consistency";
}

function deriveRunnerGoalType(
  planName: string,
  trainingPlan?: TrainingPlanV2,
): RunnerProfileSummary["goalType"] {
  const goalType = trainingPlan?.goal?.goal_type?.trim().toLowerCase();

  if (
    goalType &&
    ["5k", "10k", "half_marathon", "marathon", "first_race", "race_ready"].includes(goalType)
  ) {
    return "first_race";
  }

  if (goalType === "ultra_marathon") {
    return "first_race";
  }

  if (goalType === "mountain_running") {
    return "distance_build";
  }

  if (goalType === "distance_build") {
    return "distance_build";
  }

  if (goalType === "build_consistency") {
    return "build_consistency";
  }

  return inferGoalType(planName);
}

function deriveBaselineLongRunKm(workouts: ImportedWorkoutSeed[], trainingPlan?: TrainingPlanV2) {
  const explicitKm = trainingPlan?.runner_profile?.baseline_long_run_km;

  if (explicitKm) {
    return explicitKm;
  }

  const explicitDuration = trainingPlan?.runner_profile?.baseline_long_run_duration_min;

  if (explicitDuration) {
    return Number((explicitDuration / 7).toFixed(1));
  }

  return workouts
    .filter((workout) => workout.workoutType === "long_run")
    .map((workout) => estimateDistanceKm(workout.steps, workout.workoutType))
    .reduce((max, value) => Math.max(max, value), 0);
}

function buildImportedProfileNotes(generatedFor: string, trainingPlan?: TrainingPlanV2) {
  const notes = [
    trainingPlan?.runner_profile?.recent_result_summary,
    trainingPlan?.runner_profile?.current_training_load_summary,
    trainingPlan?.runner_profile?.recent_injury_recovery_context,
    trainingPlan?.runner_profile?.current_easy_aerobic_hr_bpm
      ? `Current easy aerobic HR ${trainingPlan.runner_profile.current_easy_aerobic_hr_bpm}`
      : null,
    trainingPlan?.runner_profile?.risk_policy,
    trainingPlan?.runner_profile?.secondary_goal,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" · ");

  if (notes) {
    return notes;
  }

  return `Imported from JSON for ${generatedFor}.`;
}

function deriveTargetDate(plan: TrainingPlanV2) {
  return (
    plan.target_date ?? plan.goal?.target_event?.event_date ?? plan.goal?.target_event?.date ?? null
  );
}

function buildGoalMetadata(plan: TrainingPlanV2): Json | null {
  const targetDate = deriveTargetDate(plan);
  const goalType = plan.goal?.goal_type?.trim() || null;
  const goalLabel =
    plan.goal?.goal_label?.trim() || plan.runner_profile?.primary_goal?.trim() || null;
  const targetEvent = plan.goal?.target_event;
  const primaryGoal = plan.runner_profile?.primary_goal?.trim() || null;
  const secondaryGoal = plan.runner_profile?.secondary_goal?.trim() || null;

  const metadata = {
    ...(goalType ? { goal_type: goalType } : {}),
    ...(goalLabel ? { goal_label: goalLabel } : {}),
    ...(targetDate ? { target_date: targetDate } : {}),
    ...(targetEvent
      ? {
          target_event: {
            ...(targetEvent.label ? { label: targetEvent.label } : {}),
            ...(targetEvent.event_name ? { event_name: targetEvent.event_name } : {}),
            ...(targetDate ? { date: targetDate } : {}),
          },
        }
      : {}),
    ...(primaryGoal ? { primary_goal: primaryGoal } : {}),
    ...(secondaryGoal ? { secondary_goal: secondaryGoal } : {}),
  } satisfies Record<string, Json>;

  return Object.keys(metadata).length > 0 ? metadata : null;
}

function buildPersistedPlanPreferences(plan: TrainingPlanV2): Json | null {
  const notes = [
    plan.plan_preferences?.notes?.trim() || null,
    plan.training_constraints?.intensity_distribution?.trim() || null,
    plan.training_constraints?.progression_policy?.trim() || null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  const preferences = {
    ...(plan.plan_preferences?.preferred_run_days
      ? { preferred_run_days: plan.plan_preferences.preferred_run_days }
      : {}),
    ...(plan.plan_preferences?.preferred_running_days
      ? { preferred_run_days: plan.plan_preferences.preferred_running_days }
      : {}),
    ...(plan.plan_preferences?.blocked_days
      ? { blocked_days: plan.plan_preferences.blocked_days }
      : {}),
    ...(plan.plan_preferences?.unavailable_days
      ? { blocked_days: plan.plan_preferences.unavailable_days }
      : {}),
    ...(plan.plan_preferences?.max_running_days_per_week
      ? { max_running_days_per_week: plan.plan_preferences.max_running_days_per_week }
      : {}),
    ...(plan.plan_preferences?.max_weekly_sessions
      ? { max_running_days_per_week: plan.plan_preferences.max_weekly_sessions }
      : {}),
    ...(typeof plan.plan_preferences?.allow_back_to_back_days === "boolean"
      ? { allow_back_to_back_days: plan.plan_preferences.allow_back_to_back_days }
      : {}),
    ...(typeof plan.plan_preferences?.no_double_days === "boolean"
      ? { allow_back_to_back_days: !plan.plan_preferences.no_double_days }
      : {}),
    ...(plan.plan_preferences?.preferred_long_run_day
      ? { preferred_long_run_day: plan.plan_preferences.preferred_long_run_day }
      : {}),
    ...(plan.plan_preferences?.injury_constraints
      ? { injury_constraints: plan.plan_preferences.injury_constraints }
      : {}),
    ...(plan.plan_preferences?.hard_constraints
      ? { hard_constraints: plan.plan_preferences.hard_constraints }
      : {}),
    ...(plan.plan_preferences?.preferred_workout_mix
      ? { preferred_workout_mix: plan.plan_preferences.preferred_workout_mix }
      : {}),
    ...(plan.plan_preferences?.terrain_focus
      ? { terrain_focus: plan.plan_preferences.terrain_focus }
      : {}),
    ...(plan.plan_preferences?.strength_or_mobility_interest
      ? {
          strength_or_mobility_interest: plan.plan_preferences.strength_or_mobility_interest,
        }
      : {}),
    ...(typeof plan.plan_preferences?.indoor_treadmill_ok === "boolean"
      ? { indoor_treadmill_ok: plan.plan_preferences.indoor_treadmill_ok }
      : {}),
    ...(plan.training_constraints?.running_days_per_week
      ? { max_running_days_per_week: plan.training_constraints.running_days_per_week }
      : {}),
    ...(plan.training_constraints?.full_rest_days
      ? { blocked_days: plan.training_constraints.full_rest_days }
      : {}),
    ...(plan.training_constraints?.long_run_day
      ? { preferred_long_run_day: plan.training_constraints.long_run_day }
      : {}),
    ...(notes ? { notes } : {}),
  } satisfies Record<string, Json>;

  return Object.keys(preferences).length > 0 ? preferences : null;
}

function normalizeV2WorkoutType(
  workoutType: TrainingPlanV2["planned_workouts"][number]["workout_type"],
): WorkoutType {
  switch (workoutType) {
    case "rest":
      return "rest";
    case "long_run":
      return "long_run";
    case "quality":
    case "tempo":
    case "intervals":
    case "progression":
    case "race":
      return "quality";
    case "steady_or_easy":
      return "steady_or_easy";
    case "recovery":
    case "easy":
    default:
      return "easy";
  }
}

function buildV2Notes(workout: TrainingPlanV2["planned_workouts"][number]) {
  if (normalizeV2WorkoutType(workout.workout_type) === "rest") {
    const hint = workout.segments.find((segment) => extractSegmentGuidance(segment))?.guidance;
    return hint ?? workout.summary;
  }

  return workout.summary;
}

function normalizeV2Segments(
  segments: TrainingPlanV2["planned_workouts"][number]["segments"],
): Step[] {
  const normalizedSegments = segments.flatMap((segment, index) => {
    if (segment.segment_type === "rest") {
      return [];
    }

    return [normalizeV2Segment(segment, index + 1)];
  });

  return normalizeExecutableStepInstructions(normalizedSegments);
}

function normalizeV2Segment(
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
  sequence: number,
): Step {
  const target = normalizeSegmentTarget(segment.target);
  const guidance = extractSegmentGuidance(segment);
  const guidanceText = guidance.guidance;
  const segmentId = segment.segment_id ?? `segment-${sequence}`;
  const label = segment.label ?? buildDefaultSegmentLabel(segment.segment_type, sequence);
  const prescription = buildSegmentPrescription(segment);

  if (
    segment.segment_type === "interval_block" ||
    segment.segment_type === "strides" ||
    (segment.segment_type === "tempo_block" && prescription.mode === "repeats")
  ) {
    const recoveryTarget = normalizeSegmentTarget(segment.recovery_target);
    const repeatedType = segment.segment_type === "tempo_block" ? "tempo" : "intervals";

    return {
      segment_id: segmentId,
      segment_type: segment.segment_type,
      sequence: segment.sequence ?? sequence,
      label,
      guidance: guidanceText,
      prescription,
      type: repeatedType,
      repeats: prescription.repeat_count,
      work: {
        type: "work",
        ...(guidanceText ? { guidance: guidanceText } : {}),
        ...(prescription.repeat_unit?.distance_km
          ? { distance_km: prescription.repeat_unit.distance_km }
          : {}),
        ...(prescription.repeat_unit?.duration_min
          ? { duration_min: prescription.repeat_unit.duration_min }
          : {}),
        ...(target ? { target } : {}),
        ...(prescription.repeat_unit ? { prescription: prescription.repeat_unit } : {}),
      },
      recovery: {
        type: "recovery",
        ...(prescription.recovery_unit?.distance_km
          ? { distance_km: prescription.recovery_unit.distance_km }
          : {}),
        ...(prescription.recovery_unit?.duration_min
          ? { duration_min: prescription.recovery_unit.duration_min }
          : {}),
        ...(recoveryTarget ? { target: recoveryTarget } : {}),
        ...(prescription.recovery_unit ? { prescription: prescription.recovery_unit } : {}),
      },
    };
  }

  return {
    segment_id: segmentId,
    segment_type: segment.segment_type,
    sequence: segment.sequence ?? sequence,
    label,
    guidance: guidanceText,
    prescription,
    type: mapSegmentTypeToStepType(segment.segment_type),
    ...(prescription.duration_min ? { duration_min: prescription.duration_min } : {}),
    ...(prescription.distance_km ? { distance_km: prescription.distance_km } : {}),
    ...(target ? { target } : {}),
  };
}

function buildSegmentPrescription(
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
): StepPrescription {
  if (segment.prescription) {
    return {
      mode: segment.prescription.mode,
      ...(segment.prescription.duration_min
        ? { duration_min: segment.prescription.duration_min }
        : {}),
      ...(segment.prescription.distance_km
        ? { distance_km: segment.prescription.distance_km }
        : {}),
      ...(segment.prescription.repeat_count
        ? { repeat_count: segment.prescription.repeat_count }
        : {}),
      ...(segment.prescription.repeat_unit
        ? { repeat_unit: normalizeUnitPrescription(segment.prescription.repeat_unit) }
        : {}),
      ...(segment.prescription.recovery_unit
        ? { recovery_unit: normalizeUnitPrescription(segment.prescription.recovery_unit) }
        : {}),
    };
  }

  if (
    segment.segment_type === "interval_block" ||
    segment.segment_type === "strides" ||
    (segment.segment_type === "tempo_block" && segment.repeat_count)
  ) {
    const workDurationMin =
      segment.work_duration_min ??
      (segment.work_duration_sec
        ? Number((segment.work_duration_sec / 60).toFixed(2))
        : undefined) ??
      segment.duration_min;
    const recoveryDurationMin =
      segment.recovery_duration_min ??
      (segment.recovery_duration_sec
        ? Number((segment.recovery_duration_sec / 60).toFixed(2))
        : undefined);

    return {
      mode: "repeats",
      repeat_count: segment.repeat_count,
      repeat_unit: segment.work_distance_km
        ? {
            mode: "distance",
            distance_km: segment.work_distance_km,
          }
        : {
            mode: "time",
            duration_min: workDurationMin,
          },
      recovery_unit:
        recoveryDurationMin || segment.recovery_distance_km
          ? segment.recovery_distance_km
            ? {
                mode: "distance",
                distance_km: segment.recovery_distance_km,
              }
            : {
                mode: "time",
                duration_min: recoveryDurationMin,
              }
          : {
              mode: "none",
            },
    };
  }

  if (segment.segment_type === "rest" || segment.segment_type === "fueling") {
    return {
      mode: "none",
    };
  }

  if (segment.distance_km) {
    return {
      mode: "distance",
      distance_km: segment.distance_km,
    };
  }

  return {
    mode: "time",
    duration_min: segment.duration_min,
  };
}

function normalizeUnitPrescription(
  unit: TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"]["repeat_unit"],
): StepUnitPrescription {
  if (!unit) {
    return {
      mode: "none",
    };
  }

  return {
    mode: unit.mode,
    ...(unit.duration_min ? { duration_min: unit.duration_min } : {}),
    ...(unit.distance_km ? { distance_km: unit.distance_km } : {}),
  };
}

function normalizeSegmentTarget(
  target: TrainingPlanV2["planned_workouts"][number]["segments"][number]["target"] | undefined,
): StepTarget | undefined {
  if (!target) {
    return undefined;
  }

  const extra: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(target.extra ?? {})) {
    if (
      key === "hr_bpm" ||
      key === "hr_bpm_range" ||
      key === "pace_range_min_km" ||
      key === "pace_min_per_km_range"
    ) {
      continue;
    }

    extra[key] = value;
  }

  for (const [key, value] of Object.entries(target)) {
    if (
      key === "intensity" ||
      key === "hr_bpm_range" ||
      key === "hr_bpm" ||
      key === "pace_min_per_km_range" ||
      key === "pace_range_min_km" ||
      key === "pace" ||
      key === "rpe" ||
      key === "cadence_spm_range" ||
      key === "cue" ||
      key === "hint" ||
      key === "extra"
    ) {
      continue;
    }

    extra[key] = value;
  }

  const hrRange =
    typeof target.hr_bpm_range === "string"
      ? target.hr_bpm_range
      : typeof target.hr_bpm === "string"
        ? target.hr_bpm
        : undefined;
  const paceRange =
    typeof target.pace_min_per_km_range === "string"
      ? target.pace_min_per_km_range
      : typeof target.pace_range_min_km === "string"
        ? target.pace_range_min_km
        : undefined;

  return {
    ...(typeof target.intensity === "string" ? { intensity: target.intensity } : {}),
    ...(hrRange ? { hr_bpm_range: hrRange } : {}),
    ...(paceRange ? { pace_min_per_km_range: paceRange } : {}),
    ...(typeof target.pace === "string" ? { pace: target.pace } : {}),
    ...(typeof target.rpe === "string" || typeof target.rpe === "number"
      ? { rpe: target.rpe }
      : {}),
    ...(typeof target.cadence_spm_range === "string"
      ? { cadence_spm_range: target.cadence_spm_range }
      : {}),
    ...(typeof target.cue === "string" ? { cue: target.cue } : {}),
    ...(typeof target.hint === "string" ? { hint: target.hint } : {}),
    ...(Object.keys(extra).length > 0 ? { extra } : {}),
  };
}

function extractSegmentGuidance(
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
) {
  if (segment.guidance) {
    return {
      guidance: segment.guidance,
    };
  }

  if (typeof segment.target?.hint === "string") {
    return {
      guidance: segment.target.hint,
    };
  }

  return {
    guidance: null,
  };
}

function mapSegmentTypeToStepType(segmentType: string) {
  switch (segmentType) {
    case "tempo_block":
      return "tempo";
    case "main":
      return "run";
    case "activation":
    case "drills":
    case "mobility_optional":
      return "mobility";
    case "recovery_jog":
      return "recovery";
    default:
      return segmentType;
  }
}

function buildDefaultSegmentLabel(segmentType: string, sequence: number) {
  switch (segmentType) {
    case "warmup":
      return "Warmup";
    case "main":
      return "Main";
    case "cooldown":
      return "Cooldown";
    case "recovery":
      return "Recovery";
    case "rest":
      return "Rest";
    case "mobility":
      return "Mobility";
    case "mobility_optional":
      return "Optional mobility";
    case "strength":
      return "Strength";
    case "activation":
      return "Activation";
    case "drills":
      return "Drills";
    case "strides":
      return "Strides";
    case "recovery_jog":
      return "Recovery jog";
    case "fueling":
      return "Fueling";
    case "tempo_block":
      return "Tempo";
    case "interval_block":
      return "Intervals";
    default:
      return `Segment ${sequence}`;
  }
}

function estimateDistanceKm(steps: Step[], workoutType: WorkoutType) {
  let totalDistanceKm = 0;

  for (const step of steps) {
    totalDistanceKm += stepPlannedDistanceKm(step);
  }

  if (totalDistanceKm > 0) {
    return Number(totalDistanceKm.toFixed(1));
  }

  let totalDurationMin = 0;

  for (const step of steps) {
    totalDurationMin += stepPlannedDurationMin(step, workoutType);
  }

  if (!totalDurationMin) {
    return 0;
  }

  const pace = paceMinutesPerKm(workoutType);

  if (!pace) {
    return 0;
  }

  return Number((totalDurationMin / pace).toFixed(1));
}

function estimateDurationFromDistanceKm(distanceKm: number, workoutType: WorkoutType) {
  if (!distanceKm) {
    return 0;
  }

  const pace = paceMinutesPerKm(workoutType);

  if (!pace) {
    return 0;
  }

  return Math.round(distanceKm * pace);
}

function paceMinutesPerKm(workoutType: WorkoutType) {
  const paceMap: Record<WorkoutType, number> = {
    easy: 7.0,
    steady_or_easy: 6.6,
    long_run: 6.8,
    quality: 5.8,
    rest: 0,
  };

  return paceMap[workoutType];
}

function isTrainingPlanV2ImportCandidate(value: unknown): value is { schema_version: string } {
  return Boolean(
    value &&
    typeof value === "object" &&
    "schema_version" in value &&
    typeof value.schema_version === "string",
  );
}

function looksLikeRemovedLegacyImport(value: unknown): value is {
  plan_name?: unknown;
  generated_for?: unknown;
  start_date?: unknown;
  week_1_preview?: unknown;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "week_1_preview" in value ||
    (!isTrainingPlanV2ImportCandidate(value) &&
      ("plan_name" in value || "generated_for" in value || "start_date" in value))
  );
}
