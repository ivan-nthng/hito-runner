import type { TrainingPlanV2 } from "@/lib/imported-plan";
import { getPlanPresetRecipe } from "@/lib/plan-presets/recipes";
import {
  planPresetEligibilityInputSchema,
  type PlanPresetCardId,
  type PlanPresetEligibilityInput,
  type PlanPresetRecipeId,
  type PlanPresetReviewDraftContract,
} from "@/lib/plan-presets/schema";
import { resolvePlanPresetCards } from "@/lib/plan-presets/resolver";
import {
  buildStructuredFirstPlanAuthoringInput,
  type StructuredFirstPlanAuthoringInput,
} from "@/lib/structured-first-plan-onboarding";
import {
  buildTenKFoundationAuthoringInput,
  buildTenKFoundationCanonicalPlan,
  TEN_K_FOUNDATION_GUARDRAIL_SUMMARY,
  TEN_K_FOUNDATION_PRESET_ID,
  validateTenKFoundationInput,
} from "@/lib/plan-presets/recipe-expanders/10k-foundation";
import {
  buildHalfMarathonBalancedAuthoringInput,
  buildHalfMarathonBalancedCanonicalPlan,
  HALF_MARATHON_BALANCED_GUARDRAIL_SUMMARY,
  HALF_MARATHON_BALANCED_PRESET_ID,
  validateHalfMarathonBalancedInput,
} from "@/lib/plan-presets/recipe-expanders/half-marathon-balanced";
import {
  buildMarathonBaseAuthoringInput,
  buildMarathonBaseCanonicalPlan,
  MARATHON_BASE_GUARDRAIL_SUMMARY,
  MARATHON_BASE_PRESET_ID,
  validateMarathonBaseInput,
} from "@/lib/plan-presets/recipe-expanders/marathon-base";
import { countRows, summarizeIdentities } from "@/lib/plan-presets/recipe-expanders/shared";

type PlanPresetRecipeExpander = {
  recipeId: PlanPresetRecipeId;
  guardrailSummary: string;
  validateInput: (input: PlanPresetEligibilityInput) => void;
  buildAuthoringInput: (
    sourceInput: StructuredFirstPlanAuthoringInput,
    horizonWeeks: number,
  ) => StructuredFirstPlanAuthoringInput;
  buildCanonicalPlan: (authoringInput: StructuredFirstPlanAuthoringInput) => TrainingPlanV2;
};

const recipeExpanders = new Map<PlanPresetRecipeId, PlanPresetRecipeExpander>([
  [
    TEN_K_FOUNDATION_PRESET_ID,
    {
      recipeId: TEN_K_FOUNDATION_PRESET_ID,
      guardrailSummary: TEN_K_FOUNDATION_GUARDRAIL_SUMMARY,
      validateInput: validateTenKFoundationInput,
      buildAuthoringInput: buildTenKFoundationAuthoringInput,
      buildCanonicalPlan: buildTenKFoundationCanonicalPlan,
    },
  ],
  [
    HALF_MARATHON_BALANCED_PRESET_ID,
    {
      recipeId: HALF_MARATHON_BALANCED_PRESET_ID,
      guardrailSummary: HALF_MARATHON_BALANCED_GUARDRAIL_SUMMARY,
      validateInput: validateHalfMarathonBalancedInput,
      buildAuthoringInput: buildHalfMarathonBalancedAuthoringInput,
      buildCanonicalPlan: buildHalfMarathonBalancedCanonicalPlan,
    },
  ],
  [
    MARATHON_BASE_PRESET_ID,
    {
      recipeId: MARATHON_BASE_PRESET_ID,
      guardrailSummary: MARATHON_BASE_GUARDRAIL_SUMMARY,
      validateInput: validateMarathonBaseInput,
      buildAuthoringInput: buildMarathonBaseAuthoringInput,
      buildCanonicalPlan: buildMarathonBaseCanonicalPlan,
    },
  ],
]);

export function buildPlanPresetReviewDraftContract({
  cardId,
  input,
}: {
  cardId: PlanPresetCardId;
  input: unknown;
}): PlanPresetReviewDraftContract {
  const parsedInput = planPresetEligibilityInputSchema.parse(input);
  const recipe = getPlanPresetRecipe(cardId);

  if (!recipe) {
    throw new Error("Plan preset recipe is not available.");
  }

  const expander = recipeExpanders.get(recipe.recipeId);

  if (!expander) {
    throw new Error(
      "Plan preset draft expansion is currently implemented only for 10K Foundation, Half Marathon Balanced, and Marathon Base.",
    );
  }

  expander.validateInput(parsedInput);

  const eligibility = resolvePlanPresetCards(parsedInput);
  const selectedCard = eligibility.cards.find((card) => card.cardId === cardId);

  if (
    !selectedCard ||
    selectedCard.recipeId !== recipe.recipeId ||
    (selectedCard.state !== "recommended" && selectedCard.state !== "available")
  ) {
    throw new Error("Plan preset is not eligible for non-mutating draft expansion.");
  }

  const baseAuthoringInput = buildStructuredFirstPlanAuthoringInput(parsedInput);
  const authoringInput = expander.buildAuthoringInput(
    baseAuthoringInput,
    recipe.defaultHorizonWeeks,
  );
  const canonicalPlan = expander.buildCanonicalPlan(authoringInput);
  const rowCounts = countRows(canonicalPlan);

  return {
    sourceKind: "plan_preset_v1",
    source_kind: "plan_preset_v1",
    sourceStatus: "preset_recipe_expanded",
    presetId: recipe.recipeId,
    presetVersion: recipe.presetVersion,
    persisted: false,
    authoringInput,
    canonicalPlan,
    metricTruth: eligibility.metricTruth,
    reviewShape: {
      whyThisFit: recipe.fitSummary,
      runningDaysPerWeek: parsedInput.availability.runningDaysPerWeek,
      fixedRestDays: parsedInput.availability.fixedRestDays,
      preferredLongRunDay: parsedInput.availability.preferredLongRunDay ?? null,
      horizonWeeks: recipe.defaultHorizonWeeks,
      targetMode: "preset_no_target_date_or_time",
      metricPolicy: recipe.metricPolicySummary,
      durationWeeks: selectedCard.durationWeeks,
      startDate: authoringInput.schedule.startDate,
      estimatedEndDate: selectedCard.estimatedEndDate,
      daysPerWeek: selectedCard.daysPerWeek,
      longRunDay: authoringInput.availability.preferredLongRunDay,
      programFamily: selectedCard.programFamily,
      workoutMixSummary: selectedCard.workoutMixSummary,
      keyWorkoutTypes: selectedCard.keyWorkoutTypes,
      metricModeSummary: selectedCard.metricModeSummary,
      whyThisFits: selectedCard.whyThisFits,
      levelFitSummary: selectedCard.levelFitSummary,
      disabledReasonSummary: null,
      customReasonSummary: null,
      weeklyRhythmSummary: buildWeeklyRhythmSummary({
        daysPerWeek: selectedCard.daysPerWeek,
        restDays: parsedInput.availability.fixedRestDays,
        longRunDay: authoringInput.availability.preferredLongRunDay,
      }),
      restDays: parsedInput.availability.fixedRestDays,
      safetyAssumptions: [
        "Preset review is non-mutating until explicit confirm.",
        "Backend recipe truth owns eligibility, metric policy, and row expansion.",
        expander.guardrailSummary,
      ],
      rowCounts,
      identitySummary: summarizeIdentities(canonicalPlan),
    },
    safety: {
      doesNotCallOpenAi: true,
      doesNotMutatePlan: true,
      persistsNothing: true,
      confirmPathImplemented: true,
    },
  };
}

function buildWeeklyRhythmSummary({
  daysPerWeek,
  restDays,
  longRunDay,
}: {
  daysPerWeek: number;
  restDays: string[];
  longRunDay: string;
}) {
  const restSummary = restDays.length > 0 ? `rest on ${restDays.join(" and ")}` : "flexible rest";

  return `${daysPerWeek} runs/week, ${restSummary}, long run on ${longRunDay}.`;
}
