import type { CanonicalExecutableMode, HrTargetSource } from "@/lib/rich-workout-model";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import {
  structuredFirstPlanOnboardingInputSchema,
  type StructuredFirstPlanAuthoringInput,
  type StructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "@/lib/structured-first-plan-onboarding";
import type { WeekdayName } from "@/lib/weekday-rest-invariants";

export const planPresetEligibilityInputSchema = structuredFirstPlanOnboardingInputSchema;

export type PlanPresetEligibilityInput = StructuredFirstPlanOnboardingInput;
export type PlanPresetEligibilityRequestInput = StructuredFirstPlanOnboardingRequestInput;

export const PLAN_PRESET_CARD_STATE_VALUES = [
  "recommended",
  "available",
  "needs_more_info",
  "custom_fit",
  "unavailable",
] as const;

export type PlanPresetCardState = (typeof PLAN_PRESET_CARD_STATE_VALUES)[number];

export const PLAN_PRESET_RESULT_CODE_VALUES = [
  "eligible_recommended",
  "eligible_available",
  "needs_more_info",
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
  "missing_watch_app_support",
  "missing_required_profile",
  "insufficient_availability",
  "fixed_rest_conflict",
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
