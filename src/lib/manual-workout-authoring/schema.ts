import { z } from "zod";
import type { CanonicalMetricModeJson } from "@/lib/rich-workout-model";
import {
  AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
  type WorkoutDocumentContent,
  type WorkoutDocumentType as WorkoutType,
} from "@/lib/workout-document";

export const MANUAL_WORKOUT_AUTHORING_SOURCE_KIND = "manual_workout_authoring_v1" as const;
export const MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS = "manual_draft_reviewed" as const;
export const MANUAL_USER_BUILT_PLAN_SOURCE_KIND = "manual_user_built_plan_v1" as const;
export const MANUAL_USER_BUILT_PLAN_SOURCE_STATUS = "manual_user_built_plan_created" as const;
export const MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION = "manual_workout_review_payload_v1" as const;
export const MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION = "manual_empty_plan_setup_v1" as const;

export const MANUAL_SETUP_RUNNING_LEVEL_VALUES = [
  "new_to_running",
  "beginner",
  "running_regularly",
  "performance_focused",
] as const;

export type ManualSetupRunningLevel = (typeof MANUAL_SETUP_RUNNING_LEVEL_VALUES)[number];

export const MANUAL_WORKOUT_TARGET_TRUTH_MODE_VALUES = [
  "structure_only",
  "editable_default_hr",
  "none",
] as const;

export type ManualWorkoutTargetTruthMode = (typeof MANUAL_WORKOUT_TARGET_TRUTH_MODE_VALUES)[number];

export const MANUAL_WORKOUT_TARGET_SOURCE_VALUES = [
  "user_entered",
  "runner_entered",
  "hito_generated",
  "hito_recommended",
  "inferred",
  "template",
  "benchmark",
  "target_time",
  "personal_hr_zone",
  "default_estimated_hr",
  "age_estimated",
  AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
] as const;

export type ManualWorkoutTargetSource = (typeof MANUAL_WORKOUT_TARGET_SOURCE_VALUES)[number];

export interface ManualWorkoutDraftProcessingOptions {
  allowPreservedAiAuthoredTargets?: boolean;
  allowPersistedTemplateShape?: boolean;
}

export const MANUAL_WORKOUT_TEMPLATE_KEY_VALUES = [
  "rest_day",
  "recovery_jog",
  "easy_aerobic_run",
  "steady_aerobic_run",
  "easy_run_with_strides",
  "progression_run",
  "controlled_tempo_session",
  "half_marathon_threshold_durability",
  "time_intervals",
  "distance_intervals",
  "long_aerobic_run",
  "long_run_with_steady_finish",
  "cutback_long_run",
  "taper_long_run",
  "uphill_repeats",
  "rolling_hills_session",
  "run_walk_adaptation",
  "technical_trail_easy",
] as const;

export type ManualWorkoutTemplateKey = (typeof MANUAL_WORKOUT_TEMPLATE_KEY_VALUES)[number];

export const MANUAL_WORKOUT_BLOCK_KEY_VALUES = [
  "warmup_block",
  "cooldown_block",
  "easy_run_block",
  "steady_run_block",
  "progression_block",
  "tempo_block",
  "threshold_block",
  "interval_work_block",
  "interval_recovery_block",
  "hill_work_block",
  "downhill_control_block",
  "rest_walk_jog_recovery_block",
  "long_run_body_block",
  "long_run_finish_block",
  "strides_block",
  "drills_mobility_note_block",
  "coach_cue_note_block",
] as const;

export type ManualWorkoutBlockKey = (typeof MANUAL_WORKOUT_BLOCK_KEY_VALUES)[number];

export const MANUAL_WORKOUT_REPEAT_SAFETY_KIND_VALUES = [
  "intervals",
  "tempo_repeats",
  "hill_repeats",
  "run_walk",
  "strides",
  "downhill_control",
] as const;

export type ManualWorkoutRepeatSafetyKind =
  (typeof MANUAL_WORKOUT_REPEAT_SAFETY_KIND_VALUES)[number];

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const requiredProfileNumber = (fieldLabel: string) =>
  z.number({
    required_error: `${fieldLabel} is required.`,
    invalid_type_error: `${fieldLabel} is required.`,
  });

export const manualEmptyPlanSetupInputSchema = z
  .object({
    age: requiredProfileNumber("Age")
      .int("Age must be a whole number.")
      .min(13, "Age must be between 13 and 100.")
      .max(100, "Age must be between 13 and 100."),
    weightKg: requiredProfileNumber("Weight")
      .min(30, "Weight must be between 30 kg and 250 kg.")
      .max(250, "Weight must be between 30 kg and 250 kg.")
      .refine((value) => Number.isInteger(value * 2), "Weight must use 0.5 kg increments."),
    heightCm: requiredProfileNumber("Height")
      .int("Height must be a whole number.")
      .min(120, "Height must be between 120 cm and 230 cm.")
      .max(230, "Height must be between 120 cm and 230 cm."),
    runningLevel: z.enum(MANUAL_SETUP_RUNNING_LEVEL_VALUES),
  })
  .strict();

export type ManualEmptyPlanSetupInput = z.output<typeof manualEmptyPlanSetupInputSchema>;

const manualWorkoutTargetInputSchema = z
  .object({
    targetSource: z.enum(MANUAL_WORKOUT_TARGET_SOURCE_VALUES).optional(),
    intensity: z.string().trim().min(1).max(120).optional(),
    label: z.string().trim().min(1).max(120).optional(),
    sourceNote: z.string().trim().min(1).max(200).optional(),
    cue: z.string().trim().min(1).max(200).optional(),
    hint: z.string().trim().min(1).max(200).optional(),
    rpe: z.union([z.string().trim().min(1).max(32), z.number().min(0).max(10)]).optional(),
    paceTargetSource: z.enum(MANUAL_WORKOUT_TARGET_SOURCE_VALUES).optional(),
    pace: z.string().trim().min(1).max(80).optional(),
    paceMinPerKmRange: z.string().trim().min(1).max(80).optional(),
    hrBpmCap: z.union([z.number().int(), z.string().trim().min(1).max(16)]).optional(),
    hrBpmRange: z.string().trim().min(1).max(80).optional(),
    hrTargetSource: z.enum(MANUAL_WORKOUT_TARGET_SOURCE_VALUES).optional(),
    hrZone: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const manualWorkoutBlockInputSchema = z
  .object({
    blockKey: z.enum(MANUAL_WORKOUT_BLOCK_KEY_VALUES),
    label: z.string().trim().min(1).max(120).optional(),
    durationSeconds: z
      .number()
      .int()
      .positive()
      .max(8 * 60 * 60)
      .optional(),
    distanceMeters: z.number().int().positive().max(100_000).optional(),
    noteText: z.string().trim().min(1).max(500).optional(),
    targetTruthMode: z.enum(MANUAL_WORKOUT_TARGET_TRUTH_MODE_VALUES).optional(),
    target: manualWorkoutTargetInputSchema.optional(),
    nestedRepeatGroup: z.unknown().optional(),
  })
  .strict();

export type ManualWorkoutBlockInput = z.infer<typeof manualWorkoutBlockInputSchema>;

function normalizeManualWorkoutRepeatGroupInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  const children = Array.isArray(record.children) ? record.children : [];

  if (children.length > 0 && record.workBlock === undefined) {
    return {
      ...record,
      workBlock: children[0],
      children,
    };
  }

  if (children.length === 0 && record.workBlock !== undefined) {
    return {
      ...record,
      children: [record.workBlock, record.recoveryBlock].filter(Boolean),
    };
  }

  return value;
}

export const manualWorkoutRepeatGroupInputSchema = z.preprocess(
  normalizeManualWorkoutRepeatGroupInput,
  z
    .object({
      repeatCount: z.number().int().min(2).max(50),
      safetyKind: z.enum(MANUAL_WORKOUT_REPEAT_SAFETY_KIND_VALUES),
      groupLabel: z.string().trim().min(1).max(120).optional(),
      children: z.array(manualWorkoutBlockInputSchema).min(1).max(20).optional(),
      workBlock: manualWorkoutBlockInputSchema,
      recoveryBlock: manualWorkoutBlockInputSchema.optional(),
      nestedRepeatGroup: z.unknown().optional(),
    })
    .strict(),
);

export type ManualWorkoutRepeatGroupInput = z.infer<typeof manualWorkoutRepeatGroupInputSchema>;

export const manualWorkoutConstructorEntrySchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("block"),
      block: manualWorkoutBlockInputSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("repeat_group"),
      group: manualWorkoutRepeatGroupInputSchema,
    })
    .strict(),
]);

export type ManualWorkoutConstructorEntryInput = z.infer<
  typeof manualWorkoutConstructorEntrySchema
>;

export const manualWorkoutDraftContextSchema = z
  .object({
    mode: z
      .enum(["no_active_plan_draft", "user_built_plan_draft", "existing_active_plan"])
      .default("no_active_plan_draft"),
    activePlanId: z.string().uuid().optional(),
    activePlanSourceKind: z.string().trim().min(1).max(80).optional(),
    targetDateProtection: z
      .enum([
        "none",
        "past_workout",
        "logged_workout",
        "provider_evidence",
        "actual_metrics",
        "comparison_or_ai_insight",
      ])
      .default("none"),
  })
  .strict();

export type ManualWorkoutDraftContext = z.infer<typeof manualWorkoutDraftContextSchema>;

export const manualWorkoutDraftInputSchema = z
  .object({
    templateKey: z.enum(MANUAL_WORKOUT_TEMPLATE_KEY_VALUES),
    workoutDate: isoDateSchema,
    title: z.string().trim().min(1).max(120).optional(),
    notes: z.string().trim().max(1000).optional().nullable(),
    targetTruthMode: z.enum(MANUAL_WORKOUT_TARGET_TRUTH_MODE_VALUES).optional(),
    entries: z.array(manualWorkoutConstructorEntrySchema).min(0).max(20).optional(),
    context: manualWorkoutDraftContextSchema.optional(),
  })
  .strict();

export type ManualWorkoutDraftInput = z.input<typeof manualWorkoutDraftInputSchema>;
export type ParsedManualWorkoutDraftInput = z.output<typeof manualWorkoutDraftInputSchema>;

export const manualWorkoutAddToActivePlanInputSchema = z
  .object({
    activePlanId: z.string().uuid().optional(),
    draftInput: z.unknown(),
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict();

export type ManualWorkoutAddToActivePlanInput = z.output<
  typeof manualWorkoutAddToActivePlanInputSchema
>;

export interface ManualWorkoutDraftIssue {
  code:
    | "invalid_input"
    | "unsupported_template"
    | "unsupported_mapping"
    | "nested_repeat_not_supported"
    | "missing_executable_structure"
    | "missing_recovery"
    | "unsafe_block_structure"
    | "unsafe_metric_truth"
    | "protected_date_conflict"
    | "active_plan_conflict";
  message: string;
  path?: Array<string | number>;
}

export interface ManualWorkoutDraftConflict {
  code:
    | "existing_active_plan_not_supported"
    | "protected_past_or_history"
    | "protected_provider_or_analysis";
  message: string;
  workoutDate: string;
  activePlanId?: string | null;
}

export interface ManualWorkoutReviewSummary {
  headline: string;
  bullets: string[];
  warnings: string[];
}

export interface ManualWorkoutCanonicalDraft extends WorkoutDocumentContent<
  CanonicalMetricModeJson,
  string
> {
  sourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
  sourceStatus: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS;
  source_kind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
  persisted: false;
  templateKey: ManualWorkoutTemplateKey;
  workoutDate: string;
  weekday: string;
  plannedRpe: number | null;
  estimatedFatigue: string | null;
  recoveryPriority: string | null;
  totalDurationMin: number;
  totalDistanceKm: number;
  mappingGaps: string[];
}

export type ManualWorkoutDraftReviewResult =
  | {
      ok: true;
      status: "draft_ready";
      draft: ManualWorkoutCanonicalDraft;
      review: ManualWorkoutReviewSummary;
      reviewToken: string;
      reviewChecksum: string;
      exactnessPayloadVersion: typeof MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION;
      conflicts: ManualWorkoutDraftConflict[];
    }
  | {
      ok: false;
      status: "draft_rejected";
      reason:
        | "invalid_input"
        | "unsupported_template"
        | "unsupported_mapping"
        | "unsafe_block_structure"
        | "unsafe_metric_truth"
        | "protected_date_conflict"
        | "active_plan_conflict";
      message: string;
      issues: ManualWorkoutDraftIssue[];
      conflicts: ManualWorkoutDraftConflict[];
      persisted: false;
    };

export type ManualWorkoutReviewExactnessFailureReason =
  | "manual_workout_required"
  | "invalid_review"
  | "stale_review"
  | "invalid_input"
  | "unsupported_template"
  | "unsupported_mapping"
  | "unsafe_block_structure"
  | "unsafe_metric_truth"
  | "protected_date_conflict"
  | "active_plan_conflict";

export type ManualWorkoutAddToActivePlanFailureReason =
  | "unauthenticated"
  | "no_active_plan"
  | "unsupported_active_plan_source"
  | "unsupported_source_metadata"
  | "manual_workout_required"
  | "invalid_review"
  | "stale_review"
  | "invalid_input"
  | "unsupported_template"
  | "unsupported_mapping"
  | "unsafe_block_structure"
  | "unsafe_metric_truth"
  | "protected_day"
  | "protected_date_conflict"
  | "active_plan_conflict"
  | "occupied_day"
  | "persistence_failed";

export type ManualEmptyPlanCreateFailureReason =
  | "unauthenticated"
  | "active_plan_exists"
  | "invalid_input"
  | "persistence_failed";

export type ManualEmptyPlanCreateResult =
  | {
      ok: true;
      status: "created";
      persisted: true;
      sourceKind: typeof MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
      sourceStatus: typeof MANUAL_USER_BUILT_PLAN_SOURCE_STATUS;
      schemaVersion: "training-plan-v2";
      activePlanId: string;
      effectiveStartDate: string;
      appliedStartDate: string;
      workoutCount: 0;
      calendarRowCount: 0;
      nonRestWorkoutCount: 0;
      setup: ManualEmptyPlanSetupInput;
      sourceMetadata: {
        creationMode: "empty_manual_setup";
        setupPayloadVersion: typeof MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION;
        rowCount: 0;
        nonRestRowCount: 0;
        runningLevel: ManualSetupRunningLevel;
      };
      safety: {
        createsFakeWorkout: false;
        trustedClientRows: false;
        callsOpenAi: false;
        readyForManualAdd: true;
      };
    }
  | {
      ok: false;
      status: "blocked";
      persisted: false;
      reason: ManualEmptyPlanCreateFailureReason;
      message: string;
      sourceKind?: typeof MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
    };

export type ManualWorkoutAddToActivePlanResult =
  | {
      ok: true;
      status: "created";
      persisted: true;
      sourceKind: string;
      sourceStatus: string | null;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      workoutSourceStatus: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS;
      activePlanId: string;
      plannedWorkoutId: string;
      workoutDate: string;
      templateKey: ManualWorkoutTemplateKey;
      reviewChecksum: string;
      exactnessPayloadVersion: typeof MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      sourceMetadata: {
        editSourceKind?: "active_plan_user_edit_v1";
        mutationKind?: "user_added_workout" | "user_copied_workout";
        originalPlanSourceKind?: string;
        originalPlanSourceStatus?: string | null;
        mutationMode?: "direct_manual_edit";
        mutationPayloadVersion?: string;
        mutationChecksum?: string;
        sourceWorkoutId?: string;
        sourceWorkoutDate?: string;
        targetWorkoutId?: string;
        templateKey: ManualWorkoutTemplateKey;
        workoutDate: string;
        reviewChecksum: string;
        metricTruthMode: ManualWorkoutTargetTruthMode;
        mappingGaps: string[];
        warnings: string[];
      };
      safety: {
        requiresExplicitConfirm: true;
        trustedClientRows: false;
        serverRebuiltReview: true;
        targetDayKind: "rest_day";
        activePlanSourceVerified: true;
        callsOpenAi: false;
      };
    }
  | {
      ok: false;
      status: "blocked";
      persisted: false;
      reason: ManualWorkoutAddToActivePlanFailureReason;
      message: string;
      sourceKind?: string | null;
      workoutSourceKind?: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
    };
