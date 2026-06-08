import type { PlanPresetCardId } from "@/lib/plan-presets/schema";
import type { ProgressivePlanPresetContext } from "@/lib/plan-presets/progressive-context";
import type {
  PlanPresetCardViewModel,
  PlanPresetPostSelectionRefinement,
  PlanPresetReason,
  PlanPresetReasonCode,
  PlanPresetRecipeSummary,
} from "@/lib/plan-presets/schema";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";

export function buildProgressiveCustomReason(
  context: ProgressivePlanPresetContext,
  {
    includeUnsupportedGoal,
    supportedPresetGoalDistances,
  }: { includeUnsupportedGoal: boolean; supportedPresetGoalDistances: ReadonlySet<string> },
) {
  if (context.targetDate) {
    return reason(
      "target_date_present",
      "Target-date plans use Advanced custom program in preset v1.",
    );
  }

  if (context.targetTime) {
    return reason(
      "target_time_present",
      "Target-time plans use Advanced custom program in preset v1.",
    );
  }

  if (context.comment.length > 0) {
    if (hasInjuryOrPainSignal(context.comment)) {
      return reason(
        "injury_or_pain_signal",
        "Pain, injury, or recovery context should use Advanced custom program.",
      );
    }

    if (hasWorkoutRemovalRequest(context.comment)) {
      return reason(
        "workout_type_removal_requested",
        "Removing core workout types should use Advanced custom program.",
      );
    }

    return reason(
      "material_comment_present",
      "Detailed comments or unusual constraints should use Advanced custom program.",
    );
  }

  if (
    includeUnsupportedGoal &&
    context.goalDistance &&
    !supportedPresetGoalDistances.has(context.goalDistance)
  ) {
    return reason("unsupported_goal", "This goal is not exposed as a preset card in v1.");
  }

  return null;
}

export function resolveProgressiveHardBlockReason(
  recipe: PlanPresetRecipeSummary,
  context: ProgressivePlanPresetContext,
) {
  if (
    context.runningDaysPerWeek != null &&
    context.availableWeekdayCount < context.runningDaysPerWeek
  ) {
    return reason(
      "fixed_rest_conflict",
      "Fixed rest days leave fewer trainable days than the selected weekly availability.",
    );
  }

  if (context.runningDaysPerWeek === 1) {
    return reason(
      "insufficient_availability",
      `${recipe.distanceLabel} preset needs more than one running day per week.`,
    );
  }

  if (
    recipe.cardId === "marathon" &&
    (context.fitnessLevel === "new_to_running" || context.fitnessLevel === "beginner")
  ) {
    return reason(
      "level_too_low_for_family",
      "Marathon Base is not a supported quick preset for new or beginner runners.",
    );
  }

  if (
    recipe.cardId !== "10k" &&
    context.runningDaysPerWeek != null &&
    context.runningDaysPerWeek <= 2
  ) {
    return reason(
      "insufficient_availability",
      `${recipe.distanceLabel} preset needs more weekly running availability.`,
    );
  }

  return null;
}

export function resolveProgressiveMissingInfoReason(context: ProgressivePlanPresetContext) {
  if (!context.hasMinimumProfile) {
    return reason(
      "missing_minimum_profile",
      "Add basic runner profile and running level before choosing a preset.",
    );
  }

  if (context.runningDaysPerWeek == null) {
    return reason(
      "missing_weekly_days",
      "Choose weekly running days before reviewing exact preset rows.",
    );
  }

  return null;
}

export function resolveLongRunConflictReason(context: ProgressivePlanPresetContext) {
  if (context.preferredLongRunDay && context.fixedRestDays.includes(context.preferredLongRunDay)) {
    return reason("long_run_conflict", "Preferred long-run day cannot also be a fixed rest day.");
  }

  return null;
}

export function resolveProgressiveFit(
  recipe: PlanPresetRecipeSummary,
  context: ProgressivePlanPresetContext,
  targetCardId: PlanPresetCardId | null,
): {
  state: PlanPresetCardViewModel["state"];
  resultCode: PlanPresetCardViewModel["resultCode"];
  disabledReason: PlanPresetReason | null;
  requiredFields: string[];
  reviewReady: boolean;
  refinement: PlanPresetPostSelectionRefinement | null;
} {
  const runningDays = context.runningDaysPerWeek ?? recipe.minRunningDaysPerWeek;

  if (runningDays < recipe.minRunningDaysPerWeek) {
    const canImproveWithRefinement =
      (recipe.cardId === "10k" && runningDays === 2) ||
      (recipe.cardId === "half_marathon" && runningDays === 3);
    const availabilityReason = reason(
      canImproveWithRefinement ? "insufficient_availability" : "level_too_low_for_family",
      `${recipe.distanceLabel} works better with ${recipe.minRunningDaysPerWeek}+ running days per week.`,
    );

    return {
      state: canImproveWithRefinement ? "not_ideal" : "unavailable",
      resultCode: canImproveWithRefinement ? "not_ideal" : "unavailable",
      disabledReason: availabilityReason,
      requiredFields: ["availability.runningDaysPerWeek"],
      reviewReady: false,
      refinement: buildRefinement({
        requiredFields: ["availability.runningDaysPerWeek"],
        reason: availabilityReason,
        defaultSummary: [
          `${recipe.distanceLabel} needs ${recipe.minRunningDaysPerWeek}+ days/week before exact rows are built.`,
        ],
      }),
    };
  }

  if (runningDays > recipe.maxRunningDaysPerWeek) {
    const excessReason = reason(
      "excess_availability_for_recipe",
      `${recipe.distanceLabel} preset is not ideal for ${runningDays} running days per week.`,
    );

    return {
      state: "not_ideal",
      resultCode: "not_ideal",
      disabledReason: excessReason,
      requiredFields: ["availability.runningDaysPerWeek"],
      reviewReady: false,
      refinement: buildRefinement({
        requiredFields: ["availability.runningDaysPerWeek"],
        reason: excessReason,
        defaultSummary: [`Use ${recipe.maxRunningDaysPerWeek} or fewer days/week for this recipe.`],
      }),
    };
  }

  const levelReason = resolveProgressiveLevelFitReason(recipe, context);

  if (levelReason) {
    return {
      state: "not_ideal",
      resultCode: "not_ideal",
      disabledReason: levelReason,
      requiredFields: buildSelectedCardRequiredFields(recipe),
      reviewReady: false,
      refinement: buildSelectedCardRefinement(recipe, levelReason),
    };
  }

  const recommended = targetCardId
    ? recipe.cardId === targetCardId
    : isProgressiveRecommendedByLevel(recipe, context);

  return {
    state: recommended ? "recommended" : "available",
    resultCode: recommended ? "eligible_recommended" : "eligible_available",
    disabledReason: null,
    requiredFields: buildSelectedCardRequiredFields(recipe),
    reviewReady: false,
    refinement: buildSelectedCardRefinement(recipe, null),
  };
}

export function buildRefinement({
  requiredFields,
  optionalFields = [],
  reason: refinementReason,
  defaultSummary,
}: {
  requiredFields: string[];
  optionalFields?: string[];
  reason: PlanPresetReason | null;
  defaultSummary: string[];
}): PlanPresetPostSelectionRefinement {
  return {
    requiredBeforeReview: requiredFields.length > 0,
    reason: refinementReason,
    requiredFields,
    optionalFields,
    defaultSummary,
  };
}

export function suggestDaysPerWeek(
  recipe: PlanPresetRecipeSummary,
  fitnessLevel: RunnerFitnessLevel | null,
) {
  if (recipe.cardId === "marathon") return 5;
  if (recipe.cardId === "half_marathon") return 4;
  if (fitnessLevel === "new_to_running") return 3;
  return recipe.minRunningDaysPerWeek;
}

function resolveProgressiveLevelFitReason(
  recipe: PlanPresetRecipeSummary,
  context: ProgressivePlanPresetContext,
) {
  if (recipe.cardId === "half_marathon" && context.fitnessLevel === "new_to_running") {
    return reason(
      "level_too_low_for_family",
      "Half Marathon Balanced is possible later, but 10K Foundation is safer first.",
    );
  }

  if (
    recipe.cardId === "marathon" &&
    context.fitnessLevel === "running_regularly" &&
    !context.hasBenchmarkTruth &&
    (context.runningDaysPerWeek ?? 0) < 5
  ) {
    return reason(
      "level_too_low_for_family",
      "Marathon Base needs stronger durability evidence or five running days per week.",
    );
  }

  return null;
}

function isProgressiveRecommendedByLevel(
  recipe: PlanPresetRecipeSummary,
  context: ProgressivePlanPresetContext,
) {
  if (context.fitnessLevel === "new_to_running" || context.fitnessLevel === "beginner") {
    return recipe.cardId === "10k";
  }

  if (context.fitnessLevel === "performance_focused" && (context.runningDaysPerWeek ?? 0) >= 5) {
    return recipe.cardId === "marathon";
  }

  if (context.fitnessLevel === "running_regularly" && (context.runningDaysPerWeek ?? 0) >= 4) {
    return recipe.cardId === "half_marathon";
  }

  return recipe.cardId === "10k";
}

function buildSelectedCardRequiredFields(recipe: PlanPresetRecipeSummary) {
  return [
    "goal.goalDistance",
    "goal.goalStyle",
    "goal.terrainFocus",
    "availability.preferredLongRunDay",
    recipe.cardId === "marathon" ? "benchmark.fitnessLevel" : null,
  ].filter((value): value is string => value != null);
}

function buildSelectedCardRefinement(
  recipe: PlanPresetRecipeSummary,
  refinementReason: PlanPresetReason | null,
) {
  return buildRefinement({
    requiredFields: buildSelectedCardRequiredFields(recipe),
    optionalFields: [
      "availability.fixedRestDays",
      "execution.guidancePreference",
      "strength.preference",
    ],
    reason: refinementReason,
    defaultSummary: [
      `${recipe.distanceLabel} can default to ${recipe.minRunningDaysPerWeek}-${recipe.maxRunningDaysPerWeek} running days/week once preferences are confirmed.`,
      "Watch/app support is assumed for new plans; metric truth still controls pace and HR targets.",
    ],
  });
}

function hasInjuryOrPainSignal(comment: string) {
  return /\b(injury|injured|pain|ache|aching|hurt|hurts|sore|strain|sprain|rehab|recovering|recovery)\b/i.test(
    comment,
  );
}

function hasWorkoutRemovalRequest(comment: string) {
  return /\b(no|without|remove|skip|avoid)\s+(long\s+run|rest|easy|tempo|speed|workout|running)\b/i.test(
    comment,
  );
}

function reason(code: PlanPresetReasonCode, message: string): PlanPresetReason {
  return { code, message };
}
