import { z } from "zod";
import { WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION } from "@/lib/workout-authoring-review";

export const MANUAL_WORKOUT_AUTHORING_SOURCE_KIND = "manual_workout_authoring_v1" as const;
export const MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS = "manual_draft_reviewed" as const;
export const MANUAL_USER_BUILT_PLAN_SOURCE_KIND = "manual_user_built_plan_v1" as const;
export const MANUAL_USER_BUILT_PLAN_SOURCE_STATUS = "manual_user_built_plan_created" as const;
export const MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION = WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION;
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

export function inputHasClientPayload(error: z.ZodError) {
  return error.issues.some((issue) => issue.code === "unrecognized_keys");
}

export interface ManualWorkoutReviewMetadata {
  sourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
  sourceStatus: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS;
  templateKey: ManualWorkoutTemplateKey;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  totalDurationMin: number;
  totalDistanceKm: number;
  mappingGaps: string[];
}

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
      activePlanId: null;
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
