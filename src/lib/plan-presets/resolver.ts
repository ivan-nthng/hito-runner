import {
  normalizeFirstPlanExecutionMode,
  type FirstPlanGoalDistance,
} from "@/lib/first-plan-authoring-utils";
import { PLAN_PRESET_RECIPES, getPlanPresetRecipe } from "@/lib/plan-presets/recipes";
import {
  planPresetEligibilityInputSchema,
  type PlanPresetCardId,
  type PlanPresetCardViewModel,
  type PlanPresetEligibilityResult,
  type PlanPresetMetricTruthSummary,
  type PlanPresetProgramSummaryFields,
  type PlanPresetReason,
  type PlanPresetReasonCode,
  type PlanPresetRecipeSummary,
} from "@/lib/plan-presets/schema";
import {
  buildStructuredFirstPlanAuthoringInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "@/lib/structured-first-plan-onboarding";
import { addDaysIso } from "@/lib/training";
import { deriveAvailableTrainingWeekdays } from "@/lib/runner-training-preferences";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

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

type ProgramSummaryContext = {
  startDate: string;
  daysPerWeek: number;
  longRunDay: WeekdayName;
};

export function resolvePlanPresetCards(
  rawInput: StructuredFirstPlanOnboardingRequestInput,
): PlanPresetEligibilityResult {
  const input = planPresetEligibilityInputSchema.parse(rawInput);
  const baseAuthoringInput = buildStructuredFirstPlanAuthoringInput(input);
  const programSummaryContext: ProgramSummaryContext = {
    startDate: baseAuthoringInput.schedule.startDate,
    daysPerWeek: input.availability.runningDaysPerWeek,
    longRunDay: baseAuthoringInput.availability.preferredLongRunDay,
  };
  const execution = normalizeFirstPlanExecutionMode(input.execution);
  const fixedRestDays = WEEKDAY_NAMES.filter((weekday) =>
    input.availability.fixedRestDays.includes(weekday),
  );
  const availableWeekdayCount = deriveAvailableTrainingWeekdays(fixedRestDays).length;
  const metricTruth = buildPresetMetricTruth(input);
  const globalCustomReasons = buildGlobalCustomReasons(input);
  const missingWatchSupport = execution.watchAccess !== "watch_or_app";
  const unsupportedGoal = !supportedPresetGoalDistances.has(input.goal.goalDistance);
  const recommendedCardId = goalDistanceToCardId[input.goal.goalDistance] ?? null;
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
      missingWatchSupport,
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
  missingWatchSupport,
}: {
  recipe: PlanPresetRecipeSummary;
  input: ParsedPlanPresetInput;
  availableWeekdayCount: number;
  metricTruth: PlanPresetMetricTruthSummary;
  programSummaryContext: ProgramSummaryContext;
  recommendedCardId: PlanPresetCardId | null;
  firstCustomReason: PlanPresetReason | null;
  missingWatchSupport: boolean;
}): PlanPresetCardViewModel {
  const availabilityReason = resolveAvailabilityReason(recipe, input, availableWeekdayCount);

  if (firstCustomReason) {
    return buildUnavailableLikeCard(recipe, {
      programSummaryContext,
      state: "custom_fit",
      resultCode: "custom_recommended",
      customRoutingReason: firstCustomReason,
      safetyMetricNote: metricTruth.notes[0] ?? recipe.metricPolicySummary,
    });
  }

  if (missingWatchSupport) {
    return buildUnavailableLikeCard(recipe, {
      programSummaryContext,
      state: "needs_more_info",
      resultCode: "needs_more_info",
      disabledReason: reason(
        "missing_watch_app_support",
        "Tell Hito whether a watch or app can execute structured targets before choosing a preset.",
      ),
      requiredMissingFields: ["execution.watchAccess"],
      safetyMetricNote:
        "Preset cards need watch/app execution support before Hito can produce watch-executable structured workouts.",
    });
  }

  if (availabilityReason) {
    return buildUnavailableLikeCard(recipe, {
      programSummaryContext,
      state: "unavailable",
      resultCode: "unavailable",
      disabledReason: availabilityReason,
      safetyMetricNote: metricTruth.notes[0] ?? recipe.metricPolicySummary,
    });
  }

  const recommended = recipe.cardId === recommendedCardId;

  return {
    ...buildProgramSummaryFields({
      recipe,
      programSummaryContext,
      metricModeSummary: metricTruth.notes[0] ?? recipe.metricPolicySummary,
      disabledReason: null,
      customRoutingReason: null,
    }),
    cardId: recipe.cardId,
    label: recipe.distanceLabel,
    distanceLabel: recipe.distanceLabel,
    familyLabel: recipe.familyLabel,
    state: recommended ? "recommended" : "available",
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
    reviewBeforeCreateRequired: true,
  };
}

function buildUnavailableLikeCard(
  recipe: PlanPresetRecipeSummary,
  overrides: Pick<PlanPresetCardViewModel, "state" | "resultCode" | "safetyMetricNote"> & {
    programSummaryContext: ProgramSummaryContext;
  } & Partial<
      Pick<
        PlanPresetCardViewModel,
        "disabledReason" | "customRoutingReason" | "requiredMissingFields"
      >
    >,
): PlanPresetCardViewModel {
  const disabledReason = overrides.disabledReason ?? null;
  const customRoutingReason = overrides.customRoutingReason ?? null;

  return {
    ...buildProgramSummaryFields({
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
    recipeFamilyId: null,
    recipeId: null,
    presetVersion: null,
    commitmentSummary: recipe.commitmentSummary,
    fitSummary: recipe.fitSummary,
    safetyMetricNote: overrides.safetyMetricNote,
    disabledReason,
    customRoutingReason,
    requiredMissingFields: overrides.requiredMissingFields ?? [],
    reviewBeforeCreateRequired: true,
  };
}

function buildProgramSummaryFields({
  recipe,
  programSummaryContext,
  metricModeSummary,
  disabledReason,
  customRoutingReason,
}: {
  recipe: PlanPresetRecipeSummary;
  programSummaryContext: ProgramSummaryContext;
  metricModeSummary: string;
  disabledReason: PlanPresetReason | null;
  customRoutingReason: PlanPresetReason | null;
}): PlanPresetProgramSummaryFields {
  return {
    durationWeeks: recipe.defaultHorizonWeeks,
    startDate: programSummaryContext.startDate,
    estimatedEndDate: addDaysIso(
      programSummaryContext.startDate,
      recipe.defaultHorizonWeeks * 7 - 1,
    ),
    daysPerWeek: programSummaryContext.daysPerWeek,
    longRunDay: programSummaryContext.longRunDay,
    programFamily: recipe.programFamily,
    workoutMixSummary: recipe.workoutMixSummary,
    keyWorkoutTypes: [...recipe.keyWorkoutTypes],
    metricModeSummary,
    whyThisFits: recipe.fitSummary,
    levelFitSummary: recipe.levelFitSummary,
    disabledReasonSummary: disabledReason?.message ?? null,
    customReasonSummary: customRoutingReason?.message ?? null,
  };
}

function buildPresetMetricTruth(input: ParsedPlanPresetInput): PlanPresetMetricTruthSummary {
  const execution = normalizeFirstPlanExecutionMode(input.execution);
  const hasWatchExecution = execution.watchAccess === "watch_or_app";
  const hasRecent5k = input.benchmark.kind !== "unknown";
  const wantsPace =
    execution.guidancePreference === "pace" || execution.guidancePreference === "mixed";
  const paceTargetsAllowed = hasWatchExecution && hasRecent5k && wantsPace;
  const defaultEstimatedHrAvailable = typeof input.profile.age === "number";

  if (!hasWatchExecution) {
    return {
      executableMode: "correction_required",
      paceTargetsAllowed: false,
      paceTruthSource: "none",
      hrTargetsAllowed: false,
      hrTargetSource: "effort_only",
      defaultEstimatedHrAvailable,
      defaultEstimatedHrIsAdvisoryOnly: true,
      notes: [
        "Watch/app support is required before preset workouts can be watch-executable.",
        "No pace or HR target truth is inferred from profile fields.",
      ],
    };
  }

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

function buildGlobalCustomReasons(input: ParsedPlanPresetInput) {
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

  if (!supportedPresetGoalDistances.has(input.goal.goalDistance)) {
    reasons.push(reason("unsupported_goal", "This goal is not exposed as a preset card in v1."));
  }

  return reasons;
}

function resolveAvailabilityReason(
  recipe: PlanPresetRecipeSummary,
  input: ParsedPlanPresetInput,
  availableWeekdayCount: number,
) {
  if (availableWeekdayCount < input.availability.runningDaysPerWeek) {
    return reason(
      "fixed_rest_conflict",
      "Fixed rest days leave fewer trainable days than the selected weekly availability.",
    );
  }

  if (input.availability.runningDaysPerWeek < recipe.minRunningDaysPerWeek) {
    return reason(
      "insufficient_availability",
      `${recipe.distanceLabel} preset needs at least ${recipe.minRunningDaysPerWeek} running days per week.`,
    );
  }

  if (input.availability.runningDaysPerWeek > recipe.maxRunningDaysPerWeek) {
    return reason(
      "insufficient_availability",
      `${recipe.distanceLabel} preset supports up to ${recipe.maxRunningDaysPerWeek} running days per week.`,
    );
  }

  if (recipe.cardId === "half_marathon" && !hasHalfMarathonBaseSupport(input)) {
    return reason(
      "recipe_not_available",
      "Half marathon balanced preset v1 needs continuous-running support evidence; use Advanced custom program for this setup.",
    );
  }

  if (recipe.cardId === "marathon" && !hasMarathonBaseSupport(input)) {
    return reason(
      "recipe_not_available",
      "Marathon base preset v1 needs long-run tolerance support evidence; use Advanced custom program for this setup.",
    );
  }

  return null;
}

function hasHalfMarathonBaseSupport(input: ParsedPlanPresetInput) {
  if (input.benchmark.kind !== "unknown") {
    return true;
  }

  return (
    "fitnessLevel" in input.benchmark &&
    (input.benchmark.fitnessLevel === "running_regularly" ||
      input.benchmark.fitnessLevel === "performance_focused")
  );
}

function hasMarathonBaseSupport(input: ParsedPlanPresetInput) {
  if (input.benchmark.kind !== "unknown") {
    return true;
  }

  return (
    "fitnessLevel" in input.benchmark &&
    (input.benchmark.fitnessLevel === "performance_focused" ||
      (input.benchmark.fitnessLevel === "running_regularly" &&
        input.availability.runningDaysPerWeek >= 5))
  );
}

function hasInjuryOrPainSignal(comment: string) {
  return /\b(injury|injured|pain|ache|aching|hurt|hurts|sore|strain|sprain|rehab|recovering|recovery)\b/i.test(
    comment,
  );
}

function reason(code: PlanPresetReasonCode, message: string): PlanPresetReason {
  return { code, message };
}
