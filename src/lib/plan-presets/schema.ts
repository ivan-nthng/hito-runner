import { z } from "zod";
import type { CanonicalExecutableMode, HrTargetSource } from "@/lib/rich-workout-model";
import {
  FIRST_PLAN_GOAL_DISTANCE_VALUES,
  FIRST_PLAN_GOAL_STYLE_VALUES,
  FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES,
  FIRST_PLAN_TERRAIN_FOCUS_VALUES,
  FIRST_PLAN_WATCH_ACCESS_VALUES,
} from "@/lib/first-plan-authoring-utils";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import { FITNESS_LEVEL_VALUES } from "@/lib/runner-training-preferences";
import {
  structuredFirstPlanOnboardingInputSchema,
  type StructuredFirstPlanAuthoringInput,
  type StructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "@/lib/structured-first-plan-onboarding";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export const planPresetEligibilityInputSchema = structuredFirstPlanOnboardingInputSchema;

const weekdayNameSchema = z.enum(WEEKDAY_NAMES);

export const planPresetCardInputSchema = z
  .object({
    profile: z
      .object({
        age: z.number().int().min(13).max(100).optional().nullable(),
        weightKg: z.number().positive().max(300).optional().nullable(),
        heightCm: z.number().positive().max(260).optional().nullable(),
      })
      .partial()
      .optional()
      .nullable(),
    benchmark: z
      .object({
        fitnessLevel: z.enum(FITNESS_LEVEL_VALUES).optional().nullable(),
        recent5kTime: z.string().trim().optional().nullable(),
      })
      .partial()
      .optional()
      .nullable(),
    availability: z
      .object({
        runningDaysPerWeek: z.number().int().min(1).max(7).optional().nullable(),
        fixedRestDays: z.array(weekdayNameSchema).max(6).optional().nullable(),
        preferredLongRunDay: weekdayNameSchema.optional().nullable(),
      })
      .partial()
      .optional()
      .nullable(),
    goal: z
      .object({
        goalDistance: z.enum(FIRST_PLAN_GOAL_DISTANCE_VALUES).optional().nullable(),
        goalStyle: z.enum(FIRST_PLAN_GOAL_STYLE_VALUES).optional().nullable(),
        terrainFocus: z.enum(FIRST_PLAN_TERRAIN_FOCUS_VALUES).optional().nullable(),
        targetTime: z.string().trim().optional().nullable(),
        targetDate: z.string().trim().optional().nullable(),
      })
      .partial()
      .optional()
      .nullable(),
    execution: z
      .object({
        watchAccess: z.enum(FIRST_PLAN_WATCH_ACCESS_VALUES).optional().nullable(),
        guidancePreference: z.enum(FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES).optional().nullable(),
      })
      .partial()
      .optional()
      .nullable(),
    strength: z
      .object({
        preference: z.enum(["none", "mobility", "strength"]).optional().nullable(),
      })
      .partial()
      .optional()
      .nullable(),
    schedule: z
      .object({
        startDate: z.string().trim().optional().nullable(),
        targetDate: z.string().trim().optional().nullable(),
      })
      .partial()
      .optional()
      .nullable(),
    comment: z.string().trim().optional().nullable(),
  })
  .strict();

export type PlanPresetEligibilityInput = StructuredFirstPlanOnboardingInput;
export type PlanPresetEligibilityRequestInput = StructuredFirstPlanOnboardingRequestInput;
export type PlanPresetCardInput = z.output<typeof planPresetCardInputSchema>;
export type PlanPresetCardRequestInput = z.input<typeof planPresetCardInputSchema>;

export const PLAN_PRESET_CARD_STATE_VALUES = [
  "recommended",
  "available",
  "needs_more_info",
  "not_ideal",
  "custom_fit",
  "unavailable",
] as const;

export type PlanPresetCardState = (typeof PLAN_PRESET_CARD_STATE_VALUES)[number];

export const PLAN_PRESET_RESULT_CODE_VALUES = [
  "eligible_recommended",
  "eligible_available",
  "needs_more_info",
  "not_ideal",
  "correction_required",
  "custom_recommended",
  "unavailable",
] as const;

export type PlanPresetResultCode = (typeof PLAN_PRESET_RESULT_CODE_VALUES)[number];

export const PLAN_PRESET_REASON_CODE_VALUES = [
  "target_date_present",
  "target_time_present",
  "material_comment_present",
  "injury_or_pain_signal",
  "workout_type_removal_requested",
  "missing_minimum_profile",
  "missing_weekly_days",
  "missing_required_profile",
  "insufficient_availability",
  "fixed_rest_conflict",
  "long_run_conflict",
  "level_too_low_for_family",
  "excess_availability_for_recipe",
  "unsupported_goal",
  "metric_truth_insufficient_for_target",
  "recipe_not_available",
] as const;

export type PlanPresetReasonCode = (typeof PLAN_PRESET_REASON_CODE_VALUES)[number];

export type PlanPresetCardId = "10k" | "half_marathon" | "marathon";

export type PlanPresetRecipeFamilyId =
  | "10k_foundation"
  | "half_marathon_balanced"
  | "marathon_base";

export type PlanPresetRecipeId =
  | "plan_preset_10k_foundation_v1"
  | "plan_preset_half_marathon_balanced_v1"
  | "plan_preset_marathon_base_v1";

export interface PlanPresetRecipeSummary {
  cardId: PlanPresetCardId;
  recipeFamilyId: PlanPresetRecipeFamilyId;
  recipeId: PlanPresetRecipeId;
  presetVersion: "v1";
  distanceLabel: "10K" | "Half marathon" | "Marathon";
  familyLabel: "Foundation" | "Balanced" | "Base" | "Durability";
  programFamily: string;
  minRunningDaysPerWeek: number;
  maxRunningDaysPerWeek: number;
  defaultHorizonWeeks: number;
  commitmentSummary: string;
  fitSummary: string;
  workoutMixSummary: string;
  keyWorkoutTypes: readonly string[];
  levelFitSummary: string;
  avoidsSummary: string;
  metricPolicySummary: string;
}

export interface PlanPresetReason {
  code: PlanPresetReasonCode;
  message: string;
}

export interface PlanPresetPostSelectionRefinement {
  requiredBeforeReview: boolean;
  reason: PlanPresetReason | null;
  requiredFields: string[];
  optionalFields: string[];
  defaultSummary: string[];
}

export interface PlanPresetMetricTruthSummary {
  executableMode: Extract<
    CanonicalExecutableMode,
    "pace_executable" | "structure_only_executable" | "correction_required"
  >;
  paceTargetsAllowed: boolean;
  paceTruthSource: "recent_5k" | "none";
  hrTargetsAllowed: false;
  hrTargetSource: Extract<HrTargetSource, "effort_only">;
  defaultEstimatedHrAvailable: boolean;
  defaultEstimatedHrIsAdvisoryOnly: true;
  notes: string[];
}

export interface PlanPresetProgramSummaryFields {
  durationWeeks: number;
  startDate: string;
  estimatedEndDate: string;
  daysPerWeek: number;
  longRunDay: WeekdayName;
  programFamily: string;
  workoutMixSummary: string;
  keyWorkoutTypes: string[];
  metricModeSummary: string;
  whyThisFits: string;
  levelFitSummary: string;
  disabledReasonSummary: string | null;
  customReasonSummary: string | null;
}

export interface PlanPresetCardViewModel extends PlanPresetProgramSummaryFields {
  cardId: PlanPresetCardId;
  label: string;
  distanceLabel: PlanPresetRecipeSummary["distanceLabel"];
  familyLabel: PlanPresetRecipeSummary["familyLabel"] | null;
  state: PlanPresetCardState;
  resultCode: PlanPresetResultCode;
  recipeFamilyId: PlanPresetRecipeFamilyId | null;
  recipeId: PlanPresetRecipeId | null;
  presetVersion: PlanPresetRecipeSummary["presetVersion"] | null;
  commitmentSummary: string;
  fitSummary: string;
  safetyMetricNote: string;
  disabledReason: PlanPresetReason | null;
  customRoutingReason: PlanPresetReason | null;
  requiredMissingFields: string[];
  reviewReady: boolean;
  postSelectionRefinement: PlanPresetPostSelectionRefinement | null;
  reviewBeforeCreateRequired: true;
}

export interface PlanPresetEligibilityResult {
  ok: true;
  sourceKind: "plan_preset_v1";
  persisted: false;
  cards: PlanPresetCardViewModel[];
  recommendedCardId: PlanPresetCardId | null;
  advancedCustom: {
    recommended: boolean;
    reason: PlanPresetReason | null;
    route: "advanced_custom_program";
  };
  metricTruth: PlanPresetMetricTruthSummary;
  safety: {
    doesNotCallOpenAi: true;
    doesNotMutatePlan: true;
    persistsNothing: true;
    frontendMustNotComputeEligibility: true;
  };
}

export interface PlanPresetReviewDraftContract {
  sourceKind: "plan_preset_v1";
  source_kind: "plan_preset_v1";
  sourceStatus: "preset_recipe_expanded";
  presetId: PlanPresetRecipeId;
  presetVersion: PlanPresetRecipeSummary["presetVersion"];
  persisted: false;
  authoringInput: StructuredFirstPlanAuthoringInput;
  canonicalPlan: TrainingPlanV2;
  metricTruth: PlanPresetMetricTruthSummary;
  reviewShape: {
    whyThisFit: string;
    runningDaysPerWeek: number;
    fixedRestDays: WeekdayName[];
    preferredLongRunDay: WeekdayName | null;
    horizonWeeks: number;
    targetMode: "preset_no_target_date_or_time";
    metricPolicy: string;
    durationWeeks: number;
    startDate: string;
    estimatedEndDate: string;
    daysPerWeek: number;
    longRunDay: WeekdayName;
    programFamily: string;
    workoutMixSummary: string;
    keyWorkoutTypes: string[];
    metricModeSummary: string;
    whyThisFits: string;
    levelFitSummary: string;
    disabledReasonSummary: null;
    customReasonSummary: null;
    weeklyRhythmSummary: string;
    restDays: WeekdayName[];
    safetyAssumptions: string[];
    adaptiveProgram: {
      scenarioId: string;
      programBias: string;
      finalOutcomeRule: string;
      progressionConservatism: string;
      impactLoadAdjustment: string;
      longRunRampPolicy: string;
      cutbackFrequency: string;
      moderateTouchCapPerWeek: number;
      delaySharpWork: boolean;
      loadAdjustmentSummary: string;
    };
    rowCounts: {
      calendarRows: number;
      nonRestRows: number;
      restRows: number;
      weekCount: number;
    };
    identitySummary: string[];
  };
  safety: {
    doesNotCallOpenAi: true;
    doesNotMutatePlan: true;
    persistsNothing: true;
    confirmPathImplemented: true;
  };
}
