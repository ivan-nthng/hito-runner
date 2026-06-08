import type { FirstPlanGoalDistance } from "@/lib/first-plan-authoring-utils";
import {
  buildPlanPresetProgramSummaryFields,
  type PlanPresetProgramSummaryContext,
} from "@/lib/plan-presets/card-summary";
import {
  buildProgressiveContext,
  type ProgressivePlanPresetContext,
} from "@/lib/plan-presets/progressive-context";
import {
  buildProgressiveCustomReason,
  buildRefinement,
  resolveLongRunConflictReason,
  resolveProgressiveFit,
  resolveProgressiveHardBlockReason,
  resolveProgressiveMissingInfoReason,
  suggestDaysPerWeek,
} from "@/lib/plan-presets/progressive-policy";
import { PLAN_PRESET_RECIPES } from "@/lib/plan-presets/recipes";
import type {
  PlanPresetCardId,
  PlanPresetCardInput,
  PlanPresetCardViewModel,
  PlanPresetEligibilityResult,
  PlanPresetPostSelectionRefinement,
  PlanPresetReason,
  PlanPresetRecipeSummary,
} from "@/lib/plan-presets/schema";

type ResolveProgressivePlanPresetCardsOptions = {
  recommendationMode?: "goal_distance" | "neutral";
};

const supportedPresetGoalDistances = new Set<FirstPlanGoalDistance>([
  "10k",
  "half_marathon",
  "marathon",
]);

const goalDistanceToCardId: Partial<Record<FirstPlanGoalDistance, PlanPresetCardId>> = {
  "10k": "10k",
  half_marathon: "half_marathon",
  marathon: "marathon",
};

export function resolveProgressivePlanPresetCards(
  input: PlanPresetCardInput,
  options: ResolveProgressivePlanPresetCardsOptions = {},
): PlanPresetEligibilityResult {
  const context = buildProgressiveContext(input);
  const recommendationMode = options.recommendationMode ?? "goal_distance";
  const firstCustomReason = buildProgressiveCustomReason(context, {
    includeUnsupportedGoal: recommendationMode === "goal_distance",
    supportedPresetGoalDistances,
  });
  const targetCardId =
    recommendationMode === "goal_distance" && context.goalDistance
      ? (goalDistanceToCardId[context.goalDistance] ?? null)
      : null;
  const cards = PLAN_PRESET_RECIPES.map((recipe) =>
    buildProgressivePresetCard({
      recipe,
      context,
      targetCardId,
      firstCustomReason,
    }),
  );
  const recommendedCardId = cards.find((card) => card.state === "recommended")?.cardId ?? null;

  return {
    ok: true,
    sourceKind: "plan_preset_v1",
    persisted: false,
    cards,
    recommendedCardId,
    advancedCustom: {
      recommended: Boolean(firstCustomReason),
      reason: firstCustomReason,
      route: "advanced_custom_program",
    },
    metricTruth: context.metricTruth,
    safety: {
      doesNotCallOpenAi: true,
      doesNotMutatePlan: true,
      persistsNothing: true,
      frontendMustNotComputeEligibility: true,
    },
  };
}

function buildProgressivePresetCard({
  recipe,
  context,
  targetCardId,
  firstCustomReason,
}: {
  recipe: PlanPresetRecipeSummary;
  context: ProgressivePlanPresetContext;
  targetCardId: PlanPresetCardId | null;
  firstCustomReason: PlanPresetReason | null;
}): PlanPresetCardViewModel {
  const suggestedDaysPerWeek = suggestDaysPerWeek(recipe, context.fitnessLevel);
  const programSummaryContext: PlanPresetProgramSummaryContext = {
    startDate: context.startDate,
    daysPerWeek: context.runningDaysPerWeek ?? suggestedDaysPerWeek,
    longRunDay: context.longRunDay,
  };
  const safetyMetricNote = context.metricTruth.notes[0] ?? recipe.metricPolicySummary;

  if (firstCustomReason) {
    return buildProgressiveCardView({
      recipe,
      programSummaryContext,
      state: "custom_fit",
      resultCode: "custom_recommended",
      metricModeSummary: safetyMetricNote,
      customRoutingReason: firstCustomReason,
      reviewReady: false,
      refinement: buildRefinement({
        requiredFields: [],
        reason: firstCustomReason,
        defaultSummary: [
          "Use Advanced custom program for target-date, target-time, injury, or unusual constraints.",
        ],
      }),
    });
  }

  const blockedReason = resolveProgressiveHardBlockReason(recipe, context);

  if (blockedReason) {
    return buildProgressiveCardView({
      recipe,
      programSummaryContext,
      state: "unavailable",
      resultCode: "unavailable",
      metricModeSummary: safetyMetricNote,
      disabledReason: blockedReason,
      reviewReady: false,
      refinement: buildRefinement({
        requiredFields: [],
        reason: blockedReason,
        defaultSummary: ["Choose a different preset family or use Advanced custom program."],
      }),
    });
  }

  const missingReason = resolveProgressiveMissingInfoReason(context);

  if (missingReason) {
    const requiredFields =
      missingReason.code === "missing_weekly_days"
        ? ["availability.runningDaysPerWeek"]
        : ["profile.age", "profile.weightKg", "profile.heightCm", "benchmark.fitnessLevel"];

    return buildProgressiveCardView({
      recipe,
      programSummaryContext,
      state: "needs_more_info",
      resultCode: "needs_more_info",
      metricModeSummary: safetyMetricNote,
      disabledReason: missingReason,
      requiredMissingFields: requiredFields,
      reviewReady: false,
      refinement: buildRefinement({
        requiredFields,
        reason: missingReason,
        defaultSummary: [
          `${recipe.distanceLabel} will use ${suggestedDaysPerWeek} days/week unless the runner chooses a different supported rhythm.`,
        ],
      }),
    });
  }

  const longRunConflictReason = resolveLongRunConflictReason(context);

  if (longRunConflictReason) {
    return buildProgressiveCardView({
      recipe,
      programSummaryContext,
      state: "needs_more_info",
      resultCode: "needs_more_info",
      metricModeSummary: safetyMetricNote,
      disabledReason: longRunConflictReason,
      requiredMissingFields: ["availability.preferredLongRunDay", "availability.fixedRestDays"],
      reviewReady: false,
      refinement: buildRefinement({
        requiredFields: ["availability.preferredLongRunDay", "availability.fixedRestDays"],
        reason: longRunConflictReason,
        defaultSummary: ["Pick a long-run day that is not also a fixed rest day."],
      }),
    });
  }

  const fit = resolveProgressiveFit(recipe, context, targetCardId);

  return buildProgressiveCardView({
    recipe,
    programSummaryContext,
    state: fit.state,
    resultCode: fit.resultCode,
    metricModeSummary: safetyMetricNote,
    disabledReason: fit.disabledReason,
    requiredMissingFields: fit.requiredFields,
    reviewReady: fit.reviewReady,
    refinement: fit.refinement,
    fitSummaryPrefix: fit.state === "recommended" ? "Recommended: " : undefined,
  });
}

function buildProgressiveCardView({
  recipe,
  programSummaryContext,
  state,
  resultCode,
  metricModeSummary,
  disabledReason = null,
  customRoutingReason = null,
  requiredMissingFields = [],
  reviewReady,
  refinement,
  fitSummaryPrefix = "",
}: {
  recipe: PlanPresetRecipeSummary;
  programSummaryContext: PlanPresetProgramSummaryContext;
  state: PlanPresetCardViewModel["state"];
  resultCode: PlanPresetCardViewModel["resultCode"];
  metricModeSummary: string;
  disabledReason?: PlanPresetReason | null;
  customRoutingReason?: PlanPresetReason | null;
  requiredMissingFields?: string[];
  reviewReady: boolean;
  refinement: PlanPresetPostSelectionRefinement | null;
  fitSummaryPrefix?: string;
}): PlanPresetCardViewModel {
  return {
    ...buildPlanPresetProgramSummaryFields({
      recipe,
      programSummaryContext,
      metricModeSummary,
      disabledReason,
      customRoutingReason,
    }),
    cardId: recipe.cardId,
    label: recipe.distanceLabel,
    distanceLabel: recipe.distanceLabel,
    familyLabel: recipe.familyLabel,
    state,
    resultCode,
    recipeFamilyId:
      state === "unavailable" || state === "custom_fit" ? null : recipe.recipeFamilyId,
    recipeId: state === "unavailable" || state === "custom_fit" ? null : recipe.recipeId,
    presetVersion: state === "unavailable" || state === "custom_fit" ? null : recipe.presetVersion,
    commitmentSummary: recipe.commitmentSummary,
    fitSummary: `${fitSummaryPrefix}${recipe.fitSummary}`,
    safetyMetricNote: metricModeSummary,
    disabledReason,
    customRoutingReason,
    requiredMissingFields,
    reviewReady,
    postSelectionRefinement: refinement,
    reviewBeforeCreateRequired: true,
  };
}
