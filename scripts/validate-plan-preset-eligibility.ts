import assert from "node:assert/strict";
import { resolvePlanPresetCards } from "../src/lib/plan-presets/resolver";
import {
  PLAN_PRESET_CARD_STATE_VALUES,
  PLAN_PRESET_REASON_CODE_VALUES,
  PLAN_PRESET_RESULT_CODE_VALUES,
} from "../src/lib/plan-presets/schema";
import { validateTenKFoundationDrafts } from "./plan-presets/10k-foundation";
import { validatePlanPresetConfirmPersistenceContract } from "./plan-presets/confirm-persistence";
import { validateHalfMarathonBalancedDrafts } from "./plan-presets/half-marathon-balanced";
import { validateMarathonBaseDrafts } from "./plan-presets/marathon-base";
import { assertCardProgramSummary, baseInput, findCard } from "./plan-presets/helpers";

async function main() {
  validateSupportedSetup();
  validateProgramSummaryCards();
  validateCustomRouting();
  validateNeedsInfo();
  validateMetricTruth();
  validateReasonCodeBounds();
  validateTenKFoundationDrafts();
  validateHalfMarathonBalancedDrafts();
  validateMarathonBaseDrafts();
  await validatePlanPresetConfirmPersistenceContract();

  console.log("Plan preset eligibility fixtures passed.");
}

function validateSupportedSetup() {
  const result = resolvePlanPresetCards(baseInput);
  const halfCard = findCard(result, "half_marathon");
  const tenKCard = findCard(result, "10k");

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
  assert.equal(tenKCard.state, "available");
  assert.equal(tenKCard.resultCode, "eligible_available");
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
    durationWeeks: 10,
    startDate: "2026-06-08",
    estimatedEndDate: "2026-08-16",
    daysPerWeek: 4,
    longRunDay: "Saturday",
    programFamily: "10K Foundation",
  });
  assertCardProgramSummary(findCard(result, "half_marathon"), {
    durationWeeks: 12,
    startDate: "2026-06-08",
    estimatedEndDate: "2026-08-30",
    daysPerWeek: 4,
    longRunDay: "Saturday",
    programFamily: "Half Marathon Balanced",
  });
  assertCardProgramSummary(findCard(result, "marathon"), {
    durationWeeks: 16,
    startDate: "2026-06-08",
    estimatedEndDate: "2026-09-27",
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
  assert.equal(targetDateHalfCard.estimatedEndDate, "2026-08-30");
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

function validateNeedsInfo() {
  const result = resolvePlanPresetCards({
    ...baseInput,
    execution: {
      watchAccess: "unknown",
      guidancePreference: "mixed",
    },
  });
  const halfCard = findCard(result, "half_marathon");

  assert.equal(result.advancedCustom.recommended, false);
  assert.equal(halfCard.state, "needs_more_info");
  assert.equal(halfCard.resultCode, "needs_more_info");
  assert.equal(halfCard.disabledReason?.code, "missing_watch_app_support");
  assert.ok(halfCard.disabledReasonSummary);
  assert.deepEqual(halfCard.requiredMissingFields, ["execution.watchAccess"]);
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
      runningDaysPerWeek: 3,
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

    for (const reason of [card.disabledReason, card.customRoutingReason]) {
      if (!reason) continue;
      assert.equal(
        allowedReasonCodes.has(reason.code),
        true,
        `Unexpected reason code ${reason.code}`,
      );
      assert.equal(reason.message.length > 0 && reason.message.length <= 220, true);
    }
  }

  assert.equal(findCard(result, "half_marathon").state, "unavailable");
  assert.equal(findCard(result, "half_marathon").disabledReason?.code, "insufficient_availability");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
