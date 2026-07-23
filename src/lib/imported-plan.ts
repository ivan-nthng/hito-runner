import { z } from "zod";
import {
  normalizeExecutableStepInstructions,
  stepPlannedDistanceKm,
  stepPlannedDurationMin,
} from "@/lib/training";
import {
  CALENDAR_ICON_KEY_VALUES,
  CANONICAL_EXECUTABLE_MODE_VALUES,
  CANONICAL_METRIC_GUIDANCE_VALUES,
  CANONICAL_WORKOUT_FAMILY_VALUES,
  CANONICAL_WORKOUT_IDENTITY_VALUES,
  HR_TARGET_SOURCE_VALUES,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalGoalContext,
} from "@/lib/rich-workout-model";
import { PRIMARY_EXECUTION_MODE_VALUES } from "@/lib/workout-document";
import type { RunnerProfileSummary } from "@/lib/training";
import type { Json } from "@/lib/supabase/database";
import { reduceRepeatChildrenToChildFirst } from "@/lib/planned-workout-block-contract";
import {
  normalizeWorkoutDocumentTarget,
  workoutDocumentRepeatChildren,
  type WorkoutDocument,
  type WorkoutDocumentPrescription,
  type WorkoutDocumentRepeatChildPrescription,
  type WorkoutDocumentSection,
  type WorkoutDocumentTarget,
  type WorkoutDocumentType,
  type WorkoutDocumentUnitPrescription,
} from "@/lib/workout-document";

export const FUTURE_TEMPLATE_VERSION = "training-plan-v2";
export const FUTURE_TEMPLATE_DOWNLOAD_PATH = "/templates/hito-training-plan-v2-template.json";
export const ML_AGENT_TEMPLATE_META_KEY = "_ml_agent_template";
export const REMOVED_LEGACY_IMPORT_NOTICE =
  "Legacy week_1_preview[] JSON is no longer supported. Convert this file to training-plan-v2 before importing.";
export const TRAINING_PLAN_V2_SEGMENT_TYPE_VALUES = [
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
] as const;

export const V2_IMPORT_ROOT_KEYS = [
  "schema_version",
  "plan_id",
  "plan_name",
  "source_kind",
  "source_status",
  "export_metadata",
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
const targetSourceSchema = z.string().trim().min(1).max(80);
const targetPositiveIntSchema = z.number().int().positive();
const placeholderEnvelopeSchema = z.union([z.boolean(), z.record(z.string(), z.unknown())]);

const v2TargetSchema = z
  .object({
    primary_execution_mode: z.enum(PRIMARY_EXECUTION_MODE_VALUES).optional(),
    target_source: targetSourceSchema.optional(),
    intensity: z.string().trim().min(1).optional(),
    hr_bpm_range: z.string().trim().min(1).optional(),
    hr_bpm: z.string().trim().min(1).optional(),
    hr_bpm_cap: targetPositiveIntSchema.optional(),
    hr_bpm_min: targetPositiveIntSchema.optional(),
    hr_bpm_max: targetPositiveIntSchema.optional(),
    hr_target_source: z.enum(HR_TARGET_SOURCE_VALUES).optional(),
    label: z.string().trim().min(1).max(120).optional(),
    source_note: z.string().trim().min(1).max(200).optional(),
    pace_min_per_km_range: z.string().trim().min(1).optional(),
    pace_range_min_km: z.string().trim().min(1).optional(),
    pace: z.string().trim().min(1).optional(),
    pace_seconds_per_km: targetPositiveIntSchema.optional(),
    pace_min_seconds_per_km: targetPositiveIntSchema.optional(),
    pace_max_seconds_per_km: targetPositiveIntSchema.optional(),
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
    distance_km: z.number().positive().optional(),
    distance_meters: z.number().int().positive().optional(),
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

const v2ExportMetadataSchema = z
  .object({
    export_format_version: z.string().trim().min(1).optional(),
    exported_at: z.string().datetime().optional(),
    source_kind: z.string().trim().min(1).optional(),
    source_status: z.string().trim().min(1).optional(),
    row_counts: z
      .object({
        day_count: z.number().int().nonnegative(),
        workout_count: z.number().int().nonnegative(),
        weeks_count: z.number().int().nonnegative(),
      })
      .strict()
      .optional(),
    privacy: z
      .object({
        internal_database_ids_omitted: z.boolean().optional(),
        auth_ids_omitted: z.boolean().optional(),
        provider_tokens_omitted: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const v2WorkoutGoalContextSchema = z
  .object({
    goal_type: z.string().trim().min(1),
    goal_style: z.string().trim().min(1).optional().nullable(),
    distance_km: z.number().positive().optional(),
    distance_meters: z.number().int().positive().optional(),
    terrain_focus: z.enum(["standard", "rolling", "mountain"]).optional().nullable(),
    target_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    target_time: z.string().trim().min(1).max(32).optional().nullable(),
  })
  .strict();

const v2WorkoutMetricModeSchema = z
  .object({
    guidance: z.enum(CANONICAL_METRIC_GUIDANCE_VALUES),
    executable_mode: z.enum(CANONICAL_EXECUTABLE_MODE_VALUES).optional(),
    pace_targets_allowed: z.boolean(),
    hr_targets_allowed: z.boolean(),
    hr_target_source: z.enum(HR_TARGET_SOURCE_VALUES).optional(),
    hr_target_label: z.string().trim().min(1).max(120).optional().nullable(),
    hr_target_source_note: z.string().trim().min(1).max(200).optional().nullable(),
    reason: z.string().trim().min(1).max(200),
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

const v2RepeatChildRoleSchema = z.enum([
  "warm_up",
  "run",
  "walk",
  "work",
  "recover",
  "finish",
  "cooldown",
]);

const v2RepeatChildSchema = z
  .object({
    role: v2RepeatChildRoleSchema,
    label: z.string().trim().min(1).max(120).optional(),
    sequence: z.number().int().min(1).optional(),
    guidance: z.string().trim().min(1).optional(),
    prescription: v2UnitPrescriptionSchema,
    target: v2TargetSchema.optional(),
  })
  .strict();

const v2SegmentPrescriptionSchema = z
  .object({
    mode: z.enum(["time", "distance", "repeats", "none"]),
    duration_min: z.number().positive().optional(),
    distance_km: z.number().positive().optional(),
    repeat_count: z.number().int().positive().optional(),
    children: z.array(v2RepeatChildSchema).min(1).max(12).optional(),
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

      if (!prescription.children?.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["children"],
          message: "repeat prescriptions require children[].",
        });
      }
    }
  });

const v2SegmentSchema = z
  .object({
    segment_id: z.string().trim().min(1).optional(),
    segment_type: z.enum(TRAINING_PLAN_V2_SEGMENT_TYPE_VALUES),
    label: z.string().trim().min(1).optional(),
    sequence: z.number().int().min(1).optional(),
    guidance: z.string().trim().min(1).optional(),
    prescription: v2SegmentPrescriptionSchema.optional(),
    duration_min: z.number().positive().optional(),
    distance_km: z.number().positive().optional(),
    target: v2TargetSchema.optional(),
    recovery_target: v2TargetSchema.optional(),
  })
  .strict()
  .superRefine((segment, context) => {
    if (segment.segment_type === "fueling" && (segment.target || segment.recovery_target)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["target"],
        message: "fueling segments are non-runnable and cannot own an execution target.",
      });
    }

    if (segment.prescription) {
      if (
        segment.prescription.mode === "repeats" &&
        segment.prescription.children?.length &&
        (segment.target || segment.recovery_target)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["target"],
          message:
            "repeat prescriptions with children[] must keep targets on child blocks, not the Repeat set parent.",
        });
      }

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
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prescription"],
        message: `${segment.segment_type} segments require prescription.mode = repeats.`,
      });
      return;
    }

    if (segment.segment_type === "rest" || segment.segment_type === "fueling") {
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
    workout_family: z.enum(CANONICAL_WORKOUT_FAMILY_VALUES).optional(),
    workout_identity: z.enum(CANONICAL_WORKOUT_IDENTITY_VALUES).optional(),
    calendar_icon_key: z.enum(CALENDAR_ICON_KEY_VALUES).optional(),
    goal_context: v2WorkoutGoalContextSchema.optional(),
    metric_mode: v2WorkoutMetricModeSchema.optional(),
    source_workout_type: z.string().trim().min(1).optional(),
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
    source_status: z.string().trim().min(1).optional(),
    export_metadata: v2ExportMetadataSchema.optional(),
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
export const TRAINING_PLAN_V2_IMPORT_SOURCE_KIND = "training_plan_v2_import" as const;

export type ImportedWorkoutSeed = WorkoutDocument;

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
    .map((entry, index) => {
      const steps = normalizeV2Segments(entry.segments);
      const richWorkout = resolveCanonicalWorkoutModel({
        workoutType: entry.workout_type,
        sourceWorkoutType: entry.source_workout_type,
        workoutFamily: entry.workout_family,
        workoutIdentity: entry.workout_identity,
        calendarIconKey: entry.calendar_icon_key,
        metricMode: entry.metric_mode ?? null,
        title: entry.title,
        steps,
      });

      return {
        workoutDate: entry.date,
        weekday: entry.weekday,
        weekNumber: entry.week_number,
        phase: entry.phase,
        workoutType: normalizeV2WorkoutType(entry.workout_type),
        sourceWorkoutId: entry.workout_id,
        sourceWorkoutType:
          entry.source_workout_type ?? entry.workout_identity ?? entry.workout_type,
        workoutFamily: richWorkout.workoutFamily,
        workoutIdentity: richWorkout.workoutIdentity,
        calendarIconKey: richWorkout.calendarIconKey,
        goalContext: normalizeWorkoutGoalContext(entry.goal_context),
        metricMode: toCanonicalMetricModeJson(richWorkout.metricMode),
        title: entry.title,
        notes: buildV2Notes(entry),
        plannedRpe: entry.planned_rpe ?? null,
        estimatedFatigue: entry.estimated_fatigue ?? null,
        recoveryPriority: entry.recovery_priority ?? null,
        steps,
        displayOrder: index,
      };
    });

  const profile = buildImportedProfile(plan.plan_name, plan.generated_for, workouts, plan);

  return {
    profile,
    title: plan.plan_name,
    goalSummary: buildV2GoalSummary(plan),
    sourceTemplate: FUTURE_TEMPLATE_VERSION,
    schemaVersion: plan.schema_version,
    sourceKind: plan.source_kind?.trim() || TRAINING_PLAN_V2_IMPORT_SOURCE_KIND,
    startDate: plan.start_date,
    endDate: workouts.at(-1)?.workoutDate ?? plan.start_date,
    targetDate: deriveTargetDate(plan),
    goalMetadata: buildGoalMetadata(plan),
    planPreferences: buildPersistedPlanPreferences(plan),
    workouts,
  };
}

export function normalizeConfirmedExternalImportSeed(
  plan: ImportedPlan,
  seed: ImportedPlanSeed,
): ImportedPlanSeed {
  const root = asJsonRecord(seed.goalMetadata);
  const existingImportProvenance = asJsonRecord(root[TRAINING_PLAN_V2_IMPORT_SOURCE_KIND]);
  const originSourceKind = plan.source_kind?.trim() || null;
  const originSourceStatus = plan.source_status?.trim() || null;

  return {
    ...seed,
    sourceKind: TRAINING_PLAN_V2_IMPORT_SOURCE_KIND,
    goalMetadata: {
      ...root,
      [TRAINING_PLAN_V2_IMPORT_SOURCE_KIND]: {
        ...existingImportProvenance,
        ...(originSourceKind ? { origin_source_kind: originSourceKind } : {}),
        ...(originSourceStatus ? { origin_source_status: originSourceStatus } : {}),
      },
    } satisfies Json,
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

function asJsonRecord(value: Json | null | undefined): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
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

function normalizeWorkoutGoalContext(
  value: TrainingPlanV2["planned_workouts"][number]["goal_context"] | undefined,
): CanonicalGoalContext | null {
  if (!value) {
    return null;
  }

  return {
    goalType: value.goal_type,
    goalStyle: value.goal_style ?? null,
    distanceKm: value.distance_km ?? null,
    distanceMeters: value.distance_meters ?? null,
    terrainFocus: value.terrain_focus ?? null,
    targetDate: value.target_date ?? null,
    targetTime: value.target_time ?? null,
  };
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
    ...(plan.goal?.distance_km ? { distance_km: plan.goal.distance_km } : {}),
    ...(plan.goal?.distance_meters ? { distance_meters: plan.goal.distance_meters } : {}),
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
): WorkoutDocumentType {
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
): WorkoutDocumentSection[] {
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
): WorkoutDocumentSection {
  const target = normalizeWorkoutDocumentTarget(segment.target);
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
    const repeatedType = segment.segment_type === "tempo_block" ? "tempo" : "intervals";
    const repeatChildren = buildRepeatChildrenFromPrescription(prescription);

    return {
      segment_id: segmentId,
      segment_type: segment.segment_type,
      sequence: segment.sequence ?? sequence,
      label,
      guidance: guidanceText,
      prescription,
      type: repeatedType,
      repeats: prescription.repeat_count,
      ...(repeatChildren.length > 0 ? { children: repeatChildren } : {}),
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

function buildRepeatChildrenFromPrescription(
  prescription: WorkoutDocumentPrescription,
): WorkoutDocumentSection[] {
  return workoutDocumentRepeatChildren({
    type: "repeat",
    prescription,
  });
}

function normalizeRepeatChildrenFromPrescription(input: {
  children?: WorkoutDocumentRepeatChildPrescription[];
}): WorkoutDocumentRepeatChildPrescription[] {
  return reduceRepeatChildrenToChildFirst<WorkoutDocumentTarget>({
    children: input.children,
  }).children;
}

function buildSegmentPrescription(
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
): WorkoutDocumentPrescription {
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
      ...(segment.prescription.children?.length
        ? {
            children: normalizeRepeatChildrenFromPrescription({
              children: segment.prescription.children,
            }).map((child) => ({
              role: child.role,
              ...(child.label ? { label: child.label } : {}),
              ...(child.sequence ? { sequence: child.sequence } : {}),
              ...(child.guidance ? { guidance: child.guidance } : {}),
              prescription: normalizeUnitPrescription(child.prescription),
              ...(child.target ? { target: normalizeWorkoutDocumentTarget(child.target) } : {}),
            })),
          }
        : {}),
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
  unit: WorkoutDocumentUnitPrescription | null | undefined,
): WorkoutDocumentUnitPrescription {
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

function estimateDistanceKm(steps: WorkoutDocumentSection[], workoutType: WorkoutDocumentType) {
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

function estimateDurationFromDistanceKm(distanceKm: number, workoutType: WorkoutDocumentType) {
  if (!distanceKm) {
    return 0;
  }

  const pace = paceMinutesPerKm(workoutType);

  if (!pace) {
    return 0;
  }

  return Math.round(distanceKm * pace);
}

function paceMinutesPerKm(workoutType: WorkoutDocumentType) {
  const paceMap: Record<WorkoutDocumentType, number> = {
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
