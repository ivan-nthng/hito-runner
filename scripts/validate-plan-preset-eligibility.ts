import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  getPlanPresetGoalContracts,
  getPlanPresetLoadAdjustments,
  getPlanPresetProgramScenarios,
  resolvePlanPresetProgram,
  resolvePlanPresetProgramCsvPathForDiagnostics,
  type PlanPresetProgramScenario,
} from "../src/lib/plan-presets/program-data";
import { PLAN_PRESET_RECIPES, getPlanPresetRecipe } from "../src/lib/plan-presets/recipes";
import { resolvePlanPresetCards } from "../src/lib/plan-presets/resolver";
import {
  PLAN_PRESET_CARD_STATE_VALUES,
  PLAN_PRESET_REASON_CODE_VALUES,
  PLAN_PRESET_RESULT_CODE_VALUES,
  planPresetEligibilityInputSchema,
  type PlanPresetCardId,
  type PlanPresetCardRequestInput,
  type PlanPresetCardViewModel,
  type PlanPresetEligibilityRequestInput,
  type PlanPresetEligibilityResult,
  type PlanPresetRecipeFamilyId,
} from "../src/lib/plan-presets/schema";
import { addDaysIso } from "../src/lib/training";

const baseInput = {
  profile: {
    age: 36,
    weightKg: 76,
    heightCm: 180,
  },
  benchmark: {
    fitnessLevel: "running_regularly",
  },
  availability: {
    runningDaysPerWeek: 4,
    fixedRestDays: ["Wednesday", "Sunday"],
    preferredLongRunDay: "Saturday",
  },
  goal: {
    goalDistance: "half_marathon",
    goalStyle: "balanced",
    terrainFocus: "standard",
  },
  execution: {
    watchAccess: "watch_or_app",
    guidancePreference: "mixed",
  },
  strength: {
    preference: "mobility",
  },
  schedule: null,
  comment: null,
} satisfies PlanPresetEligibilityRequestInput;

const activeProgramCsvFiles = [
  "preset-program-scenario-matrix.csv",
  "preset-program-load-adjustments.csv",
  "preset-goal-contract-matrix.csv",
] as const;

const removedLegacyBuilderFiles = [
  "src/lib/plan-presets/algorithmic-builder.ts",
  "src/lib/plan-presets/expand.ts",
  "src/lib/plan-presets/composition.ts",
  "src/lib/plan-presets/persistence-metadata.ts",
  "src/lib/plan-presets/review-token.ts",
  "src/lib/plan-presets/recipe-expanders/shared.ts",
  "src/lib/plan-presets/preset-workout-identity-library.csv",
  "src/lib/plan-presets/preset-phase-template-table.csv",
  "src/lib/plan-presets/preset-weekly-archetype-table.csv",
  "src/lib/plan-presets/preset-identity-placement-rules.csv",
  "src/lib/plan-presets/preset-segment-anatomy-table.csv",
  "src/lib/plan-presets/preset-progression-math-rules.csv",
  "src/lib/plan-presets/preset-quality-gates.csv",
  "src/lib/plan-presets/preset-builder-io-contract.csv",
] as const;

function main() {
  validateLegacyReviewBuilderDemotion();
  validateSupportedSetup();
  validateActiveProgramSourceOfTruth();
  validatePlanPresetProgramCsvRuntimeResolution();
  validateProgramSummaryCards();
  validateCustomRouting();
  validateWatchSupportAssumed();
  validateProgressiveCardContract();
  validateReviewReadyMatrixCardCoverage();
  validateMetricTruth();
  validateReasonCodeBounds();

  console.log("Plan preset card-discovery fixtures passed.");
}

function validateLegacyReviewBuilderDemotion() {
  for (const filePath of removedLegacyBuilderFiles) {
    assert.equal(
      existsSync(resolve(process.cwd(), filePath)),
      false,
      `Legacy Plan Preset builder/review artifact should not remain in runtime source: ${filePath}`,
    );
  }
}

function validateSupportedSetup() {
  const result = resolvePlanPresetCards(baseInput);
  const halfCard = findCard(result, "half_marathon");
  const tenKCard = findCard(result, "10k");

  assert.equal(result.sourceKind, "plan_preset_v1");
  assert.equal(result.safety.doesNotCallOpenAi, true);
  assert.equal(result.safety.doesNotMutatePlan, true);
  assert.equal(result.safety.persistsNothing, true);
  assert.equal(result.persisted, false);
  assert.equal(result.recommendedCardId, "half_marathon");
  assert.equal(halfCard.state, "recommended");
  assert.equal(halfCard.resultCode, "eligible_recommended");
  assert.equal(halfCard.recipeId, "plan_preset_half_marathon_balanced_v1");
  assert.equal(halfCard.recipeFamilyId, "half_marathon_balanced");
  assert.equal(halfCard.reviewBeforeCreateRequired, true);
  assertNoLegacyReviewPayload(halfCard);
  assert.equal(tenKCard.state, "available");
  assert.equal(tenKCard.resultCode, "eligible_available");
}

function validateActiveProgramSourceOfTruth() {
  const scenarios = getPlanPresetProgramScenarios();
  const loadAdjustments = getPlanPresetLoadAdjustments();
  const goalContracts = getPlanPresetGoalContracts();
  const tenKRecipe = getPlanPresetRecipe("10k")!;
  const halfRecipe = getPlanPresetRecipe("half_marathon")!;
  const marathonRecipe = getPlanPresetRecipe("marathon")!;
  const commonResolutionInput = {
    startDate: "2026-06-08",
    age: 36,
    weightKg: 76,
    heightCm: 180,
  };

  assert.equal(scenarios.length, 60);
  assert.equal(loadAdjustments.length, 20);
  assert.equal(goalContracts.length, 50);
  assert.equal(
    scenarios.every((scenario) => scenario.durationMinWeeks <= scenario.durationMaxWeeks),
    true,
  );
  assert.deepEqual(
    new Set(scenarios.map((scenario) => scenario.familyId)),
    new Set(PLAN_PRESET_RECIPES.map((recipe) => recipe.recipeFamilyId)),
  );

  const tenKTwoDay = resolvePlanPresetProgram({
    recipe: tenKRecipe,
    runnerLevel: "beginner",
    daysPerWeek: 2,
    ...commonResolutionInput,
  });
  const tenKThreeDay = resolvePlanPresetProgram({
    recipe: tenKRecipe,
    runnerLevel: "beginner",
    daysPerWeek: 3,
    ...commonResolutionInput,
  });
  const halfTwoDay = resolvePlanPresetProgram({
    recipe: halfRecipe,
    runnerLevel: "running_regularly",
    daysPerWeek: 2,
    ...commonResolutionInput,
  });
  const marathonTwoDay = resolvePlanPresetProgram({
    recipe: marathonRecipe,
    runnerLevel: "running_regularly",
    daysPerWeek: 2,
    ...commonResolutionInput,
  });
  const highConservatism = resolvePlanPresetProgram({
    recipe: tenKRecipe,
    runnerLevel: "beginner",
    daysPerWeek: 3,
    startDate: "2026-06-08",
    age: 67,
    weightKg: 96,
    heightCm: 165,
  });

  assert.equal(tenKTwoDay.scenario.cardState, "available");
  assert.equal(tenKTwoDay.durationWeeks > tenKThreeDay.durationWeeks, true);
  assert.equal(halfTwoDay.scenario.cardState, "available");
  assert.equal(halfTwoDay.durationWeeks > tenKThreeDay.durationWeeks, true);
  assert.equal(marathonTwoDay.scenario.cardState, "unavailable");
  assert.equal(highConservatism.durationWeeks > tenKThreeDay.durationWeeks, true);
  assert.equal(
    highConservatism.progressionConservatism === "high" ||
      highConservatism.progressionConservatism === "maximum_preset",
    true,
  );
  assert.equal(
    /\b(weight|bmi|obese|overweight|underweight|medical)\b/i.test(
      highConservatism.loadAdjustmentSummary,
    ),
    false,
  );
}

function validatePlanPresetProgramCsvRuntimeResolution() {
  for (const fileName of activeProgramCsvFiles) {
    const resolvedPath = resolvePlanPresetProgramCsvPathForDiagnostics(fileName);

    assert.equal(resolvedPath.endsWith(`/src/lib/plan-presets/${fileName}`), true);
  }
}

function validateProgramSummaryCards() {
  const result = resolvePlanPresetCards({
    ...baseInput,
    schedule: {
      startDate: "2026-06-08",
      targetDate: null,
    },
  });

  assertCardProgramSummary(findCard(result, "10k"), {
    startDate: "2026-06-08",
    daysPerWeek: 4,
    longRunDay: "Saturday",
    programFamily: "10K Foundation",
  });
  assertCardProgramSummary(findCard(result, "half_marathon"), {
    startDate: "2026-06-08",
    daysPerWeek: 4,
    longRunDay: "Saturday",
    programFamily: "Half Marathon Balanced",
  });
  assertCardProgramSummary(findCard(result, "marathon"), {
    startDate: "2026-06-08",
    daysPerWeek: 4,
    longRunDay: "Saturday",
    programFamily: "Marathon Base",
  });
}

function validateCustomRouting() {
  const targetDateResult = resolvePlanPresetCards({
    ...baseInput,
    schedule: {
      startDate: "2026-06-08",
      targetDate: "2026-09-20",
    },
  });
  assert.equal(targetDateResult.advancedCustom.recommended, true);
  assert.equal(targetDateResult.advancedCustom.reason?.code, "target_date_present");
  const targetDateHalfCard = findCard(targetDateResult, "half_marathon");
  assert.equal(targetDateHalfCard.state, "custom_fit");
  assert.ok(targetDateHalfCard.customReasonSummary);
  assert.equal(targetDateHalfCard.startDate, "2026-06-08");
  assert.equal(
    targetDateHalfCard.estimatedEndDate,
    addDaysIso(targetDateHalfCard.startDate, targetDateHalfCard.durationWeeks * 7 - 1),
  );
  assert.notEqual(targetDateHalfCard.estimatedEndDate, "2026-09-20");

  const targetTimeResult = resolvePlanPresetCards({
    ...baseInput,
    goal: {
      ...baseInput.goal,
      goalStyle: "target_time",
      targetTime: "1:55:00",
    },
  });
  assert.equal(targetTimeResult.advancedCustom.reason?.code, "target_time_present");
  const targetTimeHalfCard = findCard(targetTimeResult, "half_marathon");
  assert.equal(targetTimeHalfCard.state, "custom_fit");
  assert.ok(targetTimeHalfCard.customReasonSummary);

  const commentResult = resolvePlanPresetCards({
    ...baseInput,
    comment: "I need this to work around shift-work travel and uneven weekly availability.",
  });
  assert.equal(commentResult.advancedCustom.reason?.code, "material_comment_present");
  assert.equal(findCard(commentResult, "half_marathon").state, "custom_fit");

  const injuryResult = resolvePlanPresetCards({
    ...baseInput,
    comment: "Recovering from knee pain and need a careful ramp.",
  });
  assert.equal(injuryResult.advancedCustom.reason?.code, "injury_or_pain_signal");
  assert.equal(findCard(injuryResult, "half_marathon").state, "custom_fit");
}

function validateWatchSupportAssumed() {
  const omittedExecutionResult = resolvePlanPresetCards({
    ...baseInput,
    execution: undefined,
  });
  const omittedExecutionHalfCard = findCard(omittedExecutionResult, "half_marathon");

  assert.equal(omittedExecutionResult.advancedCustom.recommended, false);
  assert.equal(omittedExecutionHalfCard.state, "recommended");
  assert.equal(omittedExecutionHalfCard.resultCode, "eligible_recommended");
  assert.equal(omittedExecutionHalfCard.disabledReason, null);
  assert.deepEqual(omittedExecutionHalfCard.requiredMissingFields, []);
  assert.equal(omittedExecutionResult.metricTruth.executableMode, "structure_only_executable");

  for (const watchAccess of ["unknown", "none"] as const) {
    const result = resolvePlanPresetCards({
      ...baseInput,
      execution: {
        watchAccess,
        guidancePreference: "mixed",
      },
    });
    const halfCard = findCard(result, "half_marathon");

    assert.equal(result.advancedCustom.recommended, false);
    assert.equal(halfCard.state, "recommended");
    assert.equal(halfCard.resultCode, "eligible_recommended");
    assert.equal(halfCard.disabledReason, null);
    assert.deepEqual(halfCard.requiredMissingFields, []);
    assert.equal(result.metricTruth.executableMode, "structure_only_executable");
  }
}

function validateProgressiveCardContract() {
  const emptyResult = resolvePlanPresetCards({});

  assert.equal(emptyResult.cards.length, 3);
  assert.equal(
    emptyResult.cards.every((card) => card.state === "needs_more_info"),
    true,
  );
  assert.equal(
    emptyResult.cards.every((card) => card.disabledReason?.code === "missing_minimum_profile"),
    true,
  );
  assert.equal(
    emptyResult.cards.every((card) => card.reviewReady === false),
    true,
  );
  assert.equal(
    emptyResult.cards.every((card) =>
      card.requiredMissingFields.includes("benchmark.fitnessLevel"),
    ),
    true,
  );

  const minimumProfile = progressiveInput({
    profile: { age: 36, weightKg: 76, heightCm: 180 },
    benchmark: { fitnessLevel: "running_regularly" },
  });
  const missingWeeklyDaysResult = resolvePlanPresetCards(minimumProfile);

  assert.equal(
    missingWeeklyDaysResult.cards.every((card) => card.state === "needs_more_info"),
    true,
  );
  assert.equal(
    missingWeeklyDaysResult.cards.every(
      (card) => card.disabledReason?.code === "missing_weekly_days",
    ),
    true,
  );
  assert.equal(
    missingWeeklyDaysResult.cards.every((card) =>
      card.requiredMissingFields.includes("availability.runningDaysPerWeek"),
    ),
    true,
  );
  assert.equal(planPresetEligibilityInputSchema.safeParse(minimumProfile).success, false);

  const twoDayResult = resolvePlanPresetCards(
    progressiveInput({
      availability: { runningDaysPerWeek: 2, fixedRestDays: [], preferredLongRunDay: "Saturday" },
      benchmark: { fitnessLevel: "beginner" },
    }),
  );
  assert.equal(findCard(twoDayResult, "10k").state, "not_ideal");
  assert.equal(findCard(twoDayResult, "10k").resultCode, "not_ideal");
  assert.equal(findCard(twoDayResult, "half_marathon").state, "unavailable");
  assert.equal(findCard(twoDayResult, "marathon").state, "unavailable");

  const threeDayBeginnerResult = resolvePlanPresetCards(
    progressiveInput({
      availability: { runningDaysPerWeek: 3, fixedRestDays: [], preferredLongRunDay: "Saturday" },
      benchmark: { fitnessLevel: "beginner" },
    }),
  );
  assert.equal(findCard(threeDayBeginnerResult, "10k").state, "recommended");
  assert.equal(findCard(threeDayBeginnerResult, "half_marathon").state, "not_ideal");
  assert.equal(findCard(threeDayBeginnerResult, "marathon").state, "unavailable");
  assert.equal(findCard(threeDayBeginnerResult, "10k").reviewReady, false);
  assert.ok(findCard(threeDayBeginnerResult, "10k").postSelectionRefinement);

  const fourDayRegularResult = resolvePlanPresetCards(
    progressiveInput({
      availability: { runningDaysPerWeek: 4, fixedRestDays: [], preferredLongRunDay: "Saturday" },
      benchmark: { fitnessLevel: "running_regularly" },
    }),
  );
  assert.equal(findCard(fourDayRegularResult, "10k").state, "available");
  assert.equal(findCard(fourDayRegularResult, "half_marathon").state, "recommended");
  assert.equal(findCard(fourDayRegularResult, "marathon").state, "not_ideal");

  const fiveDayPerformanceResult = resolvePlanPresetCards(
    progressiveInput({
      availability: { runningDaysPerWeek: 5, fixedRestDays: [], preferredLongRunDay: "Saturday" },
      benchmark: { fitnessLevel: "performance_focused" },
    }),
  );
  assert.equal(findCard(fiveDayPerformanceResult, "marathon").state, "recommended");
  assert.equal(fiveDayPerformanceResult.recommendedCardId, "marathon");

  const fixedRestConflictResult = resolvePlanPresetCards(
    progressiveInput({
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: ["Monday", "Tuesday", "Wednesday"],
        preferredLongRunDay: "Saturday",
      },
    }),
  );
  assert.equal(
    fixedRestConflictResult.cards.every((card) => card.state === "unavailable"),
    true,
  );
  assert.equal(
    fixedRestConflictResult.cards.every(
      (card) => card.disabledReason?.code === "fixed_rest_conflict",
    ),
    true,
  );

  const longRunConflictResult = resolvePlanPresetCards(
    progressiveInput({
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: ["Saturday"],
        preferredLongRunDay: "Saturday",
      },
    }),
  );
  assert.equal(
    longRunConflictResult.cards.every((card) => card.state === "needs_more_info"),
    true,
  );
  assert.equal(
    longRunConflictResult.cards.every((card) => card.disabledReason?.code === "long_run_conflict"),
    true,
  );

  const targetDateResult = resolvePlanPresetCards(
    progressiveInput({
      schedule: { startDate: "2026-06-08", targetDate: "2026-10-10" },
    }),
  );
  assert.equal(
    targetDateResult.cards.every((card) => card.state === "custom_fit"),
    true,
  );
  assert.equal(targetDateResult.advancedCustom.reason?.code, "target_date_present");

  const workoutRemovalResult = resolvePlanPresetCards(
    progressiveInput({ comment: "Please remove long run workouts from the plan." }),
  );
  assert.equal(workoutRemovalResult.advancedCustom.reason?.code, "workout_type_removal_requested");
  assert.equal(
    workoutRemovalResult.cards.every((card) => card.state === "custom_fit"),
    true,
  );

  const benchmarkPaceResult = resolvePlanPresetCards(
    progressiveInput({
      benchmark: { fitnessLevel: "custom", recent5kTime: "24:00" },
      execution: { guidancePreference: "mixed" },
    }),
  );
  assert.equal(benchmarkPaceResult.metricTruth.executableMode, "pace_executable");
  assert.equal(benchmarkPaceResult.metricTruth.paceTargetsAllowed, true);
}

function validateReviewReadyMatrixCardCoverage() {
  const reviewReadyCards: string[] = [];
  const keyCards = new Map<string, PlanPresetCardViewModel>();

  for (const scenario of getPlanPresetProgramScenarios()) {
    const cardId = cardIdForScenario(scenario);
    const input = matrixInputForScenario(scenario);
    const result = resolvePlanPresetCards(input);
    const card = findCard(result, cardId);
    const key = `${scenario.familyId}/${scenario.runnerLevel}/${scenario.daysPerWeek}`;
    const program = resolvePlanPresetProgram({
      recipe: getPlanPresetRecipe(cardId)!,
      startDate: "2026-06-08",
      runnerLevel: scenario.runnerLevel,
      daysPerWeek: scenario.daysPerWeek,
      age: 36,
      weightKg: 76,
      heightCm: 180,
    });

    assertNoLegacyReviewPayload(card);

    if (!card.reviewReady) {
      continue;
    }

    reviewReadyCards.push(key);
    assert.equal(card.durationWeeks, program.durationWeeks);
    assert.equal(card.estimatedEndDate, program.estimatedEndDate);
    assert.equal(card.recipeId, getPlanPresetRecipe(cardId)!.recipeId);
    assert.equal(card.presetVersion, "v1");
    assert.equal(card.reviewBeforeCreateRequired, true);

    if (
      (scenario.familyId === "10k_foundation" && scenario.daysPerWeek === 2) ||
      (scenario.familyId === "half_marathon_balanced" && scenario.daysPerWeek === 2) ||
      (scenario.familyId === "marathon_base" &&
        scenario.runnerLevel === "beginner" &&
        scenario.daysPerWeek === 3)
    ) {
      keyCards.set(key, card);
    }
  }

  assert.equal(reviewReadyCards.length, 36);

  assertKeyMatrixCard(keyCards, "10k_foundation/new_to_running/2", {
    state: "recommended",
    reviewReady: true,
    durationWeeks: 21,
  });
  assertKeyMatrixCard(keyCards, "10k_foundation/beginner/2", {
    state: "recommended",
    reviewReady: true,
    durationWeeks: 19,
  });
  assertKeyMatrixCard(keyCards, "10k_foundation/running_regularly/2", {
    state: "recommended",
    reviewReady: true,
    durationWeeks: 17,
  });
  assertKeyMatrixCard(keyCards, "10k_foundation/performance_focused/2", {
    state: "available",
    reviewReady: true,
    durationWeeks: 17,
  });
  assertKeyMatrixCard(keyCards, "half_marathon_balanced/running_regularly/2", {
    state: "recommended",
    reviewReady: true,
    durationWeeks: 17,
  });
  assertKeyMatrixCard(keyCards, "half_marathon_balanced/performance_focused/2", {
    state: "available",
    reviewReady: true,
    durationWeeks: 17,
  });
  assertKeyMatrixCard(keyCards, "marathon_base/beginner/3", {
    state: "available",
    reviewReady: true,
    durationWeeks: 25,
  });
}

function validateMetricTruth() {
  const noBenchmarkResult = resolvePlanPresetCards({
    ...baseInput,
    benchmark: {
      fitnessLevel: "beginner",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "pace",
    },
  });
  assert.equal(noBenchmarkResult.metricTruth.executableMode, "structure_only_executable");
  assert.equal(noBenchmarkResult.metricTruth.paceTargetsAllowed, false);
  assert.equal(noBenchmarkResult.metricTruth.paceTruthSource, "none");
  assert.equal(noBenchmarkResult.metricTruth.hrTargetsAllowed, false);
  assert.equal(noBenchmarkResult.metricTruth.defaultEstimatedHrAvailable, true);
  assert.equal(noBenchmarkResult.metricTruth.defaultEstimatedHrIsAdvisoryOnly, true);

  const staleNoWatchResult = resolvePlanPresetCards({
    ...baseInput,
    benchmark: {
      fitnessLevel: "beginner",
    },
    execution: {
      watchAccess: "none",
      guidancePreference: "pace",
    },
  });
  assert.equal(staleNoWatchResult.metricTruth.executableMode, "structure_only_executable");
  assert.equal(staleNoWatchResult.metricTruth.paceTargetsAllowed, false);
  assert.equal(staleNoWatchResult.metricTruth.paceTruthSource, "none");
  assert.equal(staleNoWatchResult.metricTruth.hrTargetsAllowed, false);

  const benchmarkResult = resolvePlanPresetCards({
    ...baseInput,
    benchmark: {
      fitnessLevel: "custom",
      recent5kTime: "25:00",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  });
  assert.equal(benchmarkResult.metricTruth.executableMode, "pace_executable");
  assert.equal(benchmarkResult.metricTruth.paceTargetsAllowed, true);
  assert.equal(benchmarkResult.metricTruth.paceTruthSource, "recent_5k");
  assert.equal(benchmarkResult.metricTruth.hrTargetsAllowed, false);
  assert.equal(benchmarkResult.metricTruth.hrTargetSource, "effort_only");

  const targetTimeWithoutBenchmark = resolvePlanPresetCards({
    ...baseInput,
    benchmark: {
      fitnessLevel: "beginner",
    },
    goal: {
      ...baseInput.goal,
      goalStyle: "target_time",
      targetTime: "1:55:00",
    },
  });
  assert.equal(
    targetTimeWithoutBenchmark.cards.some(
      (card) => card.recipeId != null || card.state === "recommended",
    ),
    false,
  );
  assert.equal(
    targetTimeWithoutBenchmark.cards.every((card) => card.state === "custom_fit"),
    true,
  );
}

function validateReasonCodeBounds() {
  const result = resolvePlanPresetCards({
    ...baseInput,
    availability: {
      ...baseInput.availability,
      runningDaysPerWeek: 1,
    },
  });
  const allowedStates = new Set(PLAN_PRESET_CARD_STATE_VALUES);
  const allowedResultCodes = new Set(PLAN_PRESET_RESULT_CODE_VALUES);
  const allowedReasonCodes = new Set(PLAN_PRESET_REASON_CODE_VALUES);

  for (const card of result.cards) {
    assert.equal(allowedStates.has(card.state), true, `Unexpected card state ${card.state}`);
    assert.equal(
      allowedResultCodes.has(card.resultCode),
      true,
      `Unexpected result code ${card.resultCode}`,
    );

    for (const reason of [
      card.disabledReason,
      card.customRoutingReason,
      card.postSelectionRefinement?.reason ?? null,
    ]) {
      if (!reason) continue;
      assert.equal(
        allowedReasonCodes.has(reason.code),
        true,
        `Unexpected reason code ${reason.code}`,
      );
      assert.equal(reason.message.length > 0 && reason.message.length <= 220, true);
    }
  }

  assert.equal(
    result.cards.every((card) => card.state === "unavailable"),
    true,
  );
  assert.equal(
    result.cards.every((card) => card.disabledReason?.code === "insufficient_availability"),
    true,
  );
}

function progressiveInput(
  overrides: Partial<PlanPresetCardRequestInput> = {},
): PlanPresetCardRequestInput {
  return {
    profile: {
      age: 36,
      weightKg: 76,
      heightCm: 180,
      ...(overrides.profile ?? {}),
    },
    benchmark: {
      fitnessLevel: "running_regularly",
      ...(overrides.benchmark ?? {}),
    },
    availability: overrides.availability,
    goal: overrides.goal,
    execution: overrides.execution,
    strength: overrides.strength,
    schedule: overrides.schedule ?? { startDate: "2026-06-08" },
    comment: overrides.comment,
  };
}

function cardIdForScenario(scenario: PlanPresetProgramScenario): PlanPresetCardId {
  return (
    {
      "10k_foundation": "10k",
      half_marathon_balanced: "half_marathon",
      marathon_base: "marathon",
    } satisfies Record<PlanPresetRecipeFamilyId, PlanPresetCardId>
  )[scenario.familyId];
}

function matrixInputForScenario(scenario: PlanPresetProgramScenario): PlanPresetCardRequestInput {
  return {
    ...baseInput,
    benchmark: {
      fitnessLevel: scenario.runnerLevel,
    },
    availability: {
      runningDaysPerWeek: scenario.daysPerWeek,
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
    },
    goal: goalForScenario(scenario),
    schedule: {
      startDate: "2026-06-08",
      targetDate: null,
    },
  };
}

function goalForScenario(scenario: PlanPresetProgramScenario): PlanPresetCardRequestInput["goal"] {
  if (scenario.familyId === "10k_foundation") {
    return {
      goalDistance: "10k",
      goalStyle: "relaxed",
      terrainFocus: "standard",
    };
  }

  if (scenario.familyId === "half_marathon_balanced") {
    return {
      goalDistance: "half_marathon",
      goalStyle: "balanced",
      terrainFocus: "standard",
    };
  }

  return {
    goalDistance: "marathon",
    goalStyle: "balanced",
    terrainFocus: "standard",
  };
}

function assertKeyMatrixCard(
  cards: Map<string, PlanPresetCardViewModel>,
  key: string,
  expected: {
    state: "recommended" | "available";
    reviewReady: true;
    durationWeeks: number;
  },
) {
  const card = cards.get(key);

  assert.ok(card, `Expected matrix key card ${key}.`);
  assert.equal(card.state, expected.state);
  assert.equal(card.reviewReady, expected.reviewReady);
  assert.equal(card.durationWeeks, expected.durationWeeks);
  assert.equal(card.recipeId != null, true);
}

function assertCardProgramSummary(
  card: PlanPresetCardViewModel,
  expected: {
    durationWeeks?: number;
    startDate: string;
    estimatedEndDate?: string;
    daysPerWeek: number;
    longRunDay: string;
    programFamily: string;
  },
) {
  if (typeof expected.durationWeeks === "number") {
    assert.equal(card.durationWeeks, expected.durationWeeks);
  }

  assert.equal(card.startDate, expected.startDate);
  assert.equal(
    card.estimatedEndDate,
    expected.estimatedEndDate ?? addDaysIso(card.startDate, card.durationWeeks * 7 - 1),
  );
  assert.equal(card.daysPerWeek, expected.daysPerWeek);
  assert.equal(card.longRunDay, expected.longRunDay);
  assert.equal(card.programFamily, expected.programFamily);
  assert.ok(card.durationWeeks > 0);
  assert.ok(card.workoutMixSummary.length > 0);
  assert.ok(card.keyWorkoutTypes.length >= 3);
  assert.ok(card.metricModeSummary.length > 0);
  assert.ok(card.whyThisFits.length > 0);
  assert.ok(card.levelFitSummary.length > 0);
}

function assertNoLegacyReviewPayload(card: PlanPresetCardViewModel) {
  assert.equal(Object.hasOwn(card, "reviewToken"), false);
  assert.equal(Object.hasOwn(card, "reviewChecksum"), false);
  assert.equal(Object.hasOwn(card, "canonicalPlan"), false);
}

function findCard(result: PlanPresetEligibilityResult, cardId: PlanPresetCardId) {
  const card = result.cards.find((candidate) => candidate.cardId === cardId);

  assert.ok(card, `Expected ${cardId} card.`);

  return card;
}

main();
