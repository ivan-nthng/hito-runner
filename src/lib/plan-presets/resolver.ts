import {
  normalizeSupportedFirstPlanExecutionMode,
  type FirstPlanGoalDistance,
} from "@/lib/first-plan-authoring-utils";
import {
  buildPlanPresetProgramSummaryFields,
  type PlanPresetProgramSummaryContext,
} from "@/lib/plan-presets/card-summary";
import { resolvePlanPresetProgram } from "@/lib/plan-presets/program-data";
import { resolveProgressivePlanPresetCards } from "@/lib/plan-presets/progressive-cards";
import { PLAN_PRESET_RECIPES, getPlanPresetRecipe } from "@/lib/plan-presets/recipes";
import {
  planPresetCardInputSchema,
  planPresetEligibilityInputSchema,
  type PlanPresetCardId,
  type PlanPresetCardRequestInput,
  type PlanPresetCardViewModel,
  type PlanPresetEligibilityResult,
  type PlanPresetMetricTruthSummary,
  type PlanPresetReason,
  type PlanPresetReasonCode,
  type PlanPresetRecipeSummary,
} from "@/lib/plan-presets/schema";
import {
  buildStructuredFirstPlanAuthoringInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "@/lib/structured-first-plan-onboarding";
import { deriveAvailableTrainingWeekdays } from "@/lib/runner-training-preferences";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";

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

type ParsedPlanPresetInput = ReturnType<typeof planPresetEligibilityInputSchema.parse>;

type ResolvePlanPresetCardsOptions = {
  recommendationMode?: "goal_distance" | "neutral";
};

export function resolvePlanPresetCards(
  rawInput: StructuredFirstPlanOnboardingRequestInput | PlanPresetCardRequestInput,
  options: ResolvePlanPresetCardsOptions = {},
): PlanPresetEligibilityResult {
  const resolvedInput = planPresetEligibilityInputSchema.safeParse(rawInput);

  if (!resolvedInput.success) {
    return resolveProgressivePlanPresetCards(planPresetCardInputSchema.parse(rawInput), options);
  }

  return resolveResolvedPlanPresetCards(resolvedInput.data, options);
}

function resolveResolvedPlanPresetCards(
  input: ParsedPlanPresetInput,
  options: ResolvePlanPresetCardsOptions = {},
): PlanPresetEligibilityResult {
  const recommendationMode = options.recommendationMode ?? "goal_distance";
  const baseAuthoringInput = buildStructuredFirstPlanAuthoringInput(input);
  const programSummaryContext: PlanPresetProgramSummaryContext = {
    startDate: baseAuthoringInput.schedule.startDate,
    daysPerWeek: input.availability.runningDaysPerWeek,
    longRunDay: baseAuthoringInput.availability.preferredLongRunDay,
  };
  const fixedRestDays = WEEKDAY_NAMES.filter((weekday) =>
    input.availability.fixedRestDays.includes(weekday),
  );
  const availableWeekdayCount = deriveAvailableTrainingWeekdays(fixedRestDays).length;
  const metricTruth = buildPresetMetricTruth(input);
  const globalCustomReasons = buildGlobalCustomReasons(input, {
    includeUnsupportedGoal: recommendationMode === "goal_distance",
  });
  const unsupportedGoal =
    recommendationMode === "goal_distance" &&
    !supportedPresetGoalDistances.has(input.goal.goalDistance);
  const recommendedCardId =
    recommendationMode === "goal_distance"
      ? (goalDistanceToCardId[input.goal.goalDistance] ?? null)
      : null;
  const firstCustomReason = globalCustomReasons[0] ?? null;
  const customRecommended = Boolean(firstCustomReason || unsupportedGoal);
  const cards = PLAN_PRESET_RECIPES.map((recipe) =>
    buildPresetCard({
      recipe,
      input,
      availableWeekdayCount,
      metricTruth,
      programSummaryContext,
      recommendedCardId,
      firstCustomReason:
        firstCustomReason ??
        (unsupportedGoal
          ? reason(
              "unsupported_goal",
              "This goal is better handled by Advanced custom program in preset v1.",
            )
          : null),
    }),
  );

  return {
    ok: true,
    sourceKind: "plan_preset_v1",
    persisted: false,
    cards,
    recommendedCardId: cards.find((card) => card.state === "recommended")?.cardId ?? null,
    advancedCustom: {
      recommended: customRecommended,
      reason:
        firstCustomReason ??
        (unsupportedGoal
          ? reason(
              "unsupported_goal",
              "This setup should use Advanced custom program until this preset family is approved.",
            )
          : null),
      route: "advanced_custom_program",
    },
    metricTruth,
    safety: {
      doesNotCallOpenAi: true,
      doesNotMutatePlan: true,
      persistsNothing: true,
      frontendMustNotComputeEligibility: true,
    },
  };
}

function buildPresetCard({
  recipe,
  input,
  availableWeekdayCount,
  metricTruth,
  programSummaryContext,
  recommendedCardId,
  firstCustomReason,
}: {
  recipe: PlanPresetRecipeSummary;
  input: ParsedPlanPresetInput;
  availableWeekdayCount: number;
  metricTruth: PlanPresetMetricTruthSummary;
  programSummaryContext: PlanPresetProgramSummaryContext;
  recommendedCardId: PlanPresetCardId | null;
  firstCustomReason: PlanPresetReason | null;
}): PlanPresetCardViewModel {
  const program = resolvePlanPresetProgram({
    recipe,
    startDate: programSummaryContext.startDate,
    runnerLevel: resolveInputRunnerLevel(input),
    daysPerWeek: input.availability.runningDaysPerWeek,
    age: input.profile.age,
    weightKg: input.profile.weightKg,
    heightCm: input.profile.heightCm,
  });
  const programSpecificSummaryContext = {
    ...programSummaryContext,
    durationWeeks: program.durationWeeks,
  };
  const availabilityReason = resolveAvailabilityReason({
    recipe,
    input,
    availableWeekdayCount,
    scenario: program.scenario,
  });

  if (firstCustomReason) {
    return buildUnavailableLikeCard(recipe, {
      programSummaryContext: programSpecificSummaryContext,
      state: "custom_fit",
      resultCode: "custom_recommended",
      customRoutingReason: firstCustomReason,
      safetyMetricNote: metricTruth.notes[0] ?? recipe.metricPolicySummary,
    });
  }

  if (availabilityReason) {
    const state = program.scenario.cardState === "not_ideal" ? "not_ideal" : "unavailable";

    return buildUnavailableLikeCard(recipe, {
      programSummaryContext: programSpecificSummaryContext,
      state,
      resultCode: state,
      disabledReason: availabilityReason,
      safetyMetricNote: metricTruth.notes[0] ?? recipe.metricPolicySummary,
    });
  }

  const recommended =
    recipe.cardId === recommendedCardId && program.scenario.cardState !== "not_ideal";
  const state = recommended ? "recommended" : "available";

  return {
    ...buildPlanPresetProgramSummaryFields({
      recipe,
      programSummaryContext: programSpecificSummaryContext,
      metricModeSummary: metricTruth.notes[0] ?? recipe.metricPolicySummary,
      disabledReason: null,
      customRoutingReason: null,
    }),
    cardId: recipe.cardId,
    label: recipe.distanceLabel,
    distanceLabel: recipe.distanceLabel,
    familyLabel: recipe.familyLabel,
    state,
    resultCode: recommended ? "eligible_recommended" : "eligible_available",
    recipeFamilyId: recipe.recipeFamilyId,
    recipeId: recipe.recipeId,
    presetVersion: recipe.presetVersion,
    commitmentSummary: recipe.commitmentSummary,
    fitSummary: recommended ? `Recommended: ${recipe.fitSummary}` : recipe.fitSummary,
    safetyMetricNote: metricTruth.notes[0] ?? recipe.metricPolicySummary,
    disabledReason: null,
    customRoutingReason: null,
    requiredMissingFields: [],
    reviewReady: true,
    postSelectionRefinement: null,
    reviewBeforeCreateRequired: true,
  };
}

function buildUnavailableLikeCard(
  recipe: PlanPresetRecipeSummary,
  overrides: Pick<PlanPresetCardViewModel, "state" | "resultCode" | "safetyMetricNote"> & {
    programSummaryContext: PlanPresetProgramSummaryContext;
  } & Partial<
      Pick<
        PlanPresetCardViewModel,
        "disabledReason" | "customRoutingReason" | "requiredMissingFields"
      >
    >,
): PlanPresetCardViewModel {
  const disabledReason = overrides.disabledReason ?? null;
  const customRoutingReason = overrides.customRoutingReason ?? null;
  const hasRecipeReference = overrides.state !== "unavailable" && overrides.state !== "custom_fit";

  return {
    ...buildPlanPresetProgramSummaryFields({
      recipe,
      programSummaryContext: overrides.programSummaryContext,
      metricModeSummary: overrides.safetyMetricNote,
      disabledReason,
      customRoutingReason,
    }),
    cardId: recipe.cardId,
    label: recipe.distanceLabel,
    distanceLabel: recipe.distanceLabel,
    familyLabel: recipe.familyLabel,
    state: overrides.state,
    resultCode: overrides.resultCode,
    recipeFamilyId: hasRecipeReference ? recipe.recipeFamilyId : null,
    recipeId: hasRecipeReference ? recipe.recipeId : null,
    presetVersion: hasRecipeReference ? recipe.presetVersion : null,
    commitmentSummary: recipe.commitmentSummary,
    fitSummary: recipe.fitSummary,
    safetyMetricNote: overrides.safetyMetricNote,
    disabledReason,
    customRoutingReason,
    requiredMissingFields: overrides.requiredMissingFields ?? [],
    reviewReady: false,
    postSelectionRefinement: null,
    reviewBeforeCreateRequired: true,
  };
}

function buildPresetMetricTruth(input: ParsedPlanPresetInput): PlanPresetMetricTruthSummary {
  const execution = normalizeSupportedFirstPlanExecutionMode(input.execution);
  const hasWatchExecution = execution.watchAccess === "watch_or_app";
  const hasRecent5k = input.benchmark.kind !== "unknown";
  const wantsPace =
    execution.guidancePreference === "pace" || execution.guidancePreference === "mixed";
  const paceTargetsAllowed = hasWatchExecution && hasRecent5k && wantsPace;
  const defaultEstimatedHrAvailable = typeof input.profile.age === "number";

  if (paceTargetsAllowed) {
    return {
      executableMode: "pace_executable",
      paceTargetsAllowed: true,
      paceTruthSource: "recent_5k",
      hrTargetsAllowed: false,
      hrTargetSource: "effort_only",
      defaultEstimatedHrAvailable,
      defaultEstimatedHrIsAdvisoryOnly: true,
      notes: [
        defaultEstimatedHrAvailable
          ? "Recent 5K truth can support broad pace targets; age-estimated HR stays advisory and is not a personal HR target."
          : "Recent 5K truth can support broad pace targets; personal HR targets require HR-zone truth.",
      ],
    };
  }

  return {
    executableMode: "structure_only_executable",
    paceTargetsAllowed: false,
    paceTruthSource: "none",
    hrTargetsAllowed: false,
    hrTargetSource: "effort_only",
    defaultEstimatedHrAvailable,
    defaultEstimatedHrIsAdvisoryOnly: true,
    notes: [
      defaultEstimatedHrAvailable
        ? "Preset workouts can be structure-only executable; no pace target is created without benchmark truth, and age-estimated HR is advisory only."
        : "Preset workouts can be structure-only executable; pace and HR targets require backend-supported metric truth.",
    ],
  };
}

function buildGlobalCustomReasons(
  input: ParsedPlanPresetInput,
  { includeUnsupportedGoal }: { includeUnsupportedGoal: boolean },
) {
  const reasons: PlanPresetReason[] = [];
  const targetDate = input.schedule?.targetDate ?? input.goal.targetDate ?? null;

  if (targetDate) {
    reasons.push(
      reason("target_date_present", "Target-date plans use Advanced custom program in preset v1."),
    );
  }

  if (input.goal.goalStyle === "target_time" || input.goal.targetTime) {
    reasons.push(
      reason("target_time_present", "Target-time plans use Advanced custom program in preset v1."),
    );

    if (input.benchmark.kind === "unknown") {
      reasons.push(
        reason(
          "metric_truth_insufficient_for_target",
          "Target-time specificity needs benchmark truth before pace targets can be considered.",
        ),
      );
    }
  }

  const comment = input.comment?.trim() ?? "";

  if (comment.length > 0) {
    reasons.push(
      reason(
        hasInjuryOrPainSignal(comment) ? "injury_or_pain_signal" : "material_comment_present",
        hasInjuryOrPainSignal(comment)
          ? "Pain, injury, or recovery context should use Advanced custom program."
          : "Detailed comments or unusual constraints should use Advanced custom program.",
      ),
    );
  }

  if (includeUnsupportedGoal && !supportedPresetGoalDistances.has(input.goal.goalDistance)) {
    reasons.push(reason("unsupported_goal", "This goal is not exposed as a preset card in v1."));
  }

  return reasons;
}

function resolveAvailabilityReason({
  recipe,
  input,
  availableWeekdayCount,
  scenario,
}: {
  recipe: PlanPresetRecipeSummary;
  input: ParsedPlanPresetInput;
  availableWeekdayCount: number;
  scenario: ReturnType<typeof resolvePlanPresetProgram>["scenario"];
}) {
  if (availableWeekdayCount < input.availability.runningDaysPerWeek) {
    return reason(
      "fixed_rest_conflict",
      "Fixed rest days leave fewer trainable days than the selected weekly availability.",
    );
  }

  if (scenario.cardState === "unavailable") {
    return reason(
      input.availability.runningDaysPerWeek <= 1
        ? "insufficient_availability"
        : "level_too_low_for_family",
      scenario.notes || `${recipe.distanceLabel} is not a supported preset fit for this setup.`,
    );
  }

  if (scenario.routeOutcome === "advanced_custom") {
    return reason(
      scenario.cardState === "not_ideal" ? "recipe_not_available" : "level_too_low_for_family",
      scenario.notes ||
        `${recipe.distanceLabel} should use Advanced custom program for this setup.`,
    );
  }

  return null;
}

function resolveInputRunnerLevel(input: ParsedPlanPresetInput) {
  if ("fitnessLevel" in input.benchmark && input.benchmark.fitnessLevel) {
    return input.benchmark.fitnessLevel;
  }

  return "running_regularly";
}

function hasInjuryOrPainSignal(comment: string) {
  return /\b(injury|injured|pain|ache|aching|hurt|hurts|sore|strain|sprain|rehab|recovering|recovery)\b/i.test(
    comment,
  );
}

function reason(code: PlanPresetReasonCode, message: string): PlanPresetReason {
  return { code, message };
}
