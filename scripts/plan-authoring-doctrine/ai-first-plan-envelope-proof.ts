import assert from "node:assert/strict";
import { resolveAiFirstPlanBlueprintHorizonStrategy } from "../../src/lib/ai-first-plan-blueprint-horizon";
import { decodeAndValidateAiFirstPlanEnvelope } from "../../src/lib/ai-first-plan-envelope-decode";
import { expandAiFirstPlanEnvelopeToTrainingPlan } from "../../src/lib/ai-first-plan-envelope-expand";
import { buildMockAiFirstPlanEnvelope } from "../../src/lib/ai-first-plan-envelope-policy";
import { AI_FIRST_PLAN_ENVELOPE_SCHEMA_VERSION } from "../../src/lib/ai-first-plan-envelope-schema";
import { buildAiFirstPlanEnvelopeTrace } from "../../src/lib/ai-first-plan-envelope-trace";
import {
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "../../src/lib/structured-plan-authoring";
import { buildMinimalAiFirstPlanBlueprintForAuthoringInput } from "./ai-first-plan-blueprint-fixtures";
import {
  assertFixedRestDayNames,
  assertNoTwoQualityWeeks,
  assertRichWorkoutContract,
  assertWeeklyLongRunDay,
  buildAiFirstPlanAuthoringInput,
  buildLongHorizonMarathonAiFirstPlanAuthoringInput,
  countNonRestWorkouts,
  hasTargetKey,
  sourceWorkoutTypes,
} from "./ai-first-plan-proof-shared";

export function assertAiFirstPlanEnvelopeContracts() {
  assertAiFirstPlanEnvelopeContract();
}

function buildShortRoadEnvelopeAuthoringInput(
  goalType: "5k" | "10k",
): StructuredPlanAuthoringInput {
  const base = buildAiFirstPlanAuthoringInput();

  return structuredPlanAuthoringInputSchema.parse({
    ...base,
    goal: {
      goalType,
      goalLabel: goalType === "5k" ? "5K balanced envelope" : "10K balanced envelope",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: null,
    },
    schedule: {
      startDate: "2026-05-29",
      targetDate: null,
      preparationHorizonWeeks: 8,
    },
    runnerProfile: {
      ...base.runnerProfile,
      age: 36,
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 4,
      baselineLongRunKm: null,
      baselineLongRunDurationMin: 55,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      ...base.currentLevel,
      recentResultSummary: "Recent 5K benchmark supports broad training guidance.",
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: 330,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: null,
    },
    availability: {
      ...base.availability,
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Saturday"],
      unavailableDays: ["Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 4,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    preferences: {
      ...base.preferences,
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Doctrine envelope road-specificity fixture.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  });
}

export function buildBalancedHalfEnvelopeAuthoringInput(): StructuredPlanAuthoringInput {
  const base = buildAiFirstPlanAuthoringInput();

  return structuredPlanAuthoringInputSchema.parse({
    ...base,
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon balanced envelope",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: "Balanced half marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: "2026-07-12",
      preparationHorizonWeeks: 6,
    },
    runnerProfile: {
      ...base.runnerProfile,
      age: 38,
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 11,
      baselineLongRunDurationMin: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      ...base.currentLevel,
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      ...base.availability,
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    preferences: {
      ...base.preferences,
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Doctrine envelope balanced half-specificity fixture.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  });
}

function assertAiFirstPlanEnvelopeContract() {
  const authoringInput = buildLongHorizonMarathonAiFirstPlanAuthoringInput();
  const envelope = buildMockAiFirstPlanEnvelope(authoringInput);
  const decoded = decodeAndValidateAiFirstPlanEnvelope({ envelope, authoringInput });

  assert.equal(
    envelope.schemaVersion,
    AI_FIRST_PLAN_ENVELOPE_SCHEMA_VERSION,
    "AI first-plan envelope should expose the compact envelope schema version",
  );
  assert.equal(decoded.ok, true, "valid AI first-plan envelope should decode and validate");

  if (decoded.ok) {
    assert.equal(
      decoded.decoded.horizonWeeks,
      29,
      "decoded long target-date envelope should preserve the requested horizon",
    );
    assert.equal(
      decoded.decoded.weeklyRhythm.longRunDay,
      "Sunday",
      "decoded long target-date envelope should preserve preferred long-run day",
    );
  }

  const expanded = expandAiFirstPlanEnvelopeToTrainingPlan({ envelope, authoringInput });

  assert.equal(
    expanded.ok,
    true,
    expanded.ok
      ? "valid AI first-plan envelope should expand canonically"
      : `valid AI first-plan envelope should expand canonically: ${JSON.stringify(
          expanded.issues,
        )}`,
  );

  if (expanded.ok) {
    const plan = expanded.canonicalPlan;

    assert.equal(
      plan.source_kind,
      "ai_first_plan_envelope_v1",
      "AI first-plan envelope expansion should be source-visible and non-blueprint-production",
    );
    assert.equal(
      plan.preparation_horizon_weeks,
      29,
      "AI first-plan envelope expansion should cover the full long target-date horizon",
    );
    assert.equal(
      plan.planned_workouts.length,
      29 * 7,
      "AI first-plan envelope expansion should include one reviewed row per calendar date",
    );
    assert.equal(
      countNonRestWorkouts(plan),
      145,
      "AI first-plan envelope expansion should preserve every validated running slot",
    );
    assertRichWorkoutContract(plan, "AI first-plan envelope expansion");
    assertFixedRestDayNames(plan, ["Wednesday", "Saturday"], "AI first-plan envelope expansion");
    assertWeeklyLongRunDay(plan, "Sunday", "AI first-plan envelope expansion");
    assert.equal(
      hasTargetKey(plan, "pace_min_per_km_range"),
      false,
      "AI first-plan envelope expansion must preserve backend pace gates",
    );

    const horizonStrategy = resolveAiFirstPlanBlueprintHorizonStrategy({
      authoringInput,
      today: "2026-05-29",
      referenceExample: null,
    });
    const fullBlueprint = buildMinimalAiFirstPlanBlueprintForAuthoringInput(authoringInput, {
      horizonWeeks: horizonStrategy.requestedHorizonWeeks,
    });
    const boundedBlueprint = buildMinimalAiFirstPlanBlueprintForAuthoringInput(
      horizonStrategy.openAiAuthoringInput,
      { horizonWeeks: horizonStrategy.aiAuthoredHorizonWeeks },
    );
    const sizeComparison = {
      envelopeOutputChars: JSON.stringify(envelope).length,
      blueprintFullOutputChars: JSON.stringify(fullBlueprint).length,
      blueprintBoundedOutputChars: JSON.stringify(boundedBlueprint).length,
      blueprintPromptCharEstimateBefore: horizonStrategy.promptCharEstimateBefore,
      blueprintPromptCharEstimateAfter: horizonStrategy.promptCharEstimateAfter,
    };
    const trace = buildAiFirstPlanEnvelopeTrace({
      envelope,
      authoringInput,
      result: expanded,
      sizeComparison,
    });

    assert.ok(
      sizeComparison.envelopeOutputChars < sizeComparison.blueprintBoundedOutputChars,
      "AI first-plan envelope should be materially smaller than bounded row-level blueprint output",
    );
    assert.equal(
      trace.expandedPlan?.weekCount,
      29,
      "AI first-plan envelope trace should expose expanded week count",
    );
    assert.equal(
      trace.expandedPlan?.richRowCompleteness.missingRichRows,
      0,
      "AI first-plan envelope trace should prove rich row completeness",
    );
    assert.equal(
      trace.safetyMetadata.productionBlueprintPathChanged,
      false,
      "AI first-plan envelope proof must not change production blueprint behavior",
    );
  }

  const invalidEnvelope = {
    ...envelope,
    weeklyRhythm: {
      ...envelope.weeklyRhythm,
      longRunDay: "we",
      qualityFrequency: "w",
      specialtyFrequency: "w",
    },
  };
  const missingPhaseEnvelope = {
    ...envelope,
    phases: [],
  };
  const invalid = expandAiFirstPlanEnvelopeToTrainingPlan({
    envelope: invalidEnvelope,
    authoringInput,
  });

  assert.equal(invalid.ok, false, "invalid AI first-plan envelope should fail bounded");

  if (!invalid.ok) {
    assert.equal(
      invalid.reason,
      "ai_first_plan_envelope_invalid",
      "invalid AI first-plan envelope should fail before canonical expansion",
    );
    assert.ok(
      invalid.issues.some(
        (issue) =>
          issue.code === "envelope_long_run_day_mismatch" ||
          issue.code === "envelope_long_run_on_fixed_rest_day",
      ),
      "invalid AI first-plan envelope should report long-run safety issues",
    );
  }

  const missingPhases = expandAiFirstPlanEnvelopeToTrainingPlan({
    envelope: missingPhaseEnvelope,
    authoringInput,
  });

  assert.equal(missingPhases.ok, false, "missing envelope phases should fail bounded");

  if (!missingPhases.ok) {
    assert.ok(
      missingPhases.issues.some(
        (issue) =>
          issue.code === "envelope_missing_phases" || issue.code === "envelope_schema_invalid",
      ),
      "invalid AI first-plan envelope should report missing phases",
    );
  }

  assertAiFirstPlanEnvelopeRoadSpecificityContract();
}

function assertAiFirstPlanEnvelopeRoadSpecificityContract() {
  const cases: Array<{
    label: string;
    authoringInput: StructuredPlanAuthoringInput;
    expectedIdentity: string;
    expectedFulfilledMinimum: number;
  }> = [
    {
      label: "AI envelope 5K road specificity",
      authoringInput: buildShortRoadEnvelopeAuthoringInput("5k"),
      expectedIdentity: "5k_sharpening_repeats",
      expectedFulfilledMinimum: 2,
    },
    {
      label: "AI envelope 10K road specificity",
      authoringInput: buildShortRoadEnvelopeAuthoringInput("10k"),
      expectedIdentity: "10k_rhythm_intervals",
      expectedFulfilledMinimum: 2,
    },
    {
      label: "AI envelope balanced half road specificity",
      authoringInput: buildBalancedHalfEnvelopeAuthoringInput(),
      expectedIdentity: "half_marathon_threshold_durability",
      expectedFulfilledMinimum: 1,
    },
  ];

  for (const { label, authoringInput, expectedIdentity, expectedFulfilledMinimum } of cases) {
    const envelope = buildMockAiFirstPlanEnvelope(authoringInput);
    const expanded = expandAiFirstPlanEnvelopeToTrainingPlan({ envelope, authoringInput });

    assert.equal(
      expanded.ok,
      true,
      expanded.ok
        ? `${label}: envelope should expand`
        : `${label}: envelope should expand: ${JSON.stringify(expanded.issues)}`,
    );

    if (!expanded.ok) {
      continue;
    }

    const plan = expanded.canonicalPlan;
    const identities = sourceWorkoutTypes(plan);

    assertRichWorkoutContract(plan, label);
    assert.ok(identities.has(expectedIdentity), `${label}: should include ${expectedIdentity}`);
    assertNoTwoQualityWeeks(plan, label);

    const specificityTrace = expanded.metadata.specificityTrace;
    const fulfilled = specificityTrace.fulfilledIdentities.filter(
      (entry) => entry.toIdentity === expectedIdentity,
    );

    assert.ok(
      fulfilled.length >= expectedFulfilledMinimum,
      `${label}: should prove declared envelope specificity was fulfilled`,
    );

    const trace = buildAiFirstPlanEnvelopeTrace({
      envelope,
      authoringInput,
      result: expanded,
      sizeComparison: {
        envelopePromptCharEstimate: null,
        envelopeSystemPromptChars: null,
        envelopeUserPromptChars: null,
        envelopeResponseSchemaChars: null,
        envelopeOutputChars: JSON.stringify(envelope).length,
        envelopeLiveOutputChars: null,
        blueprintFullOutputChars: null,
        blueprintBoundedOutputChars: null,
        blueprintPromptCharEstimateBefore: null,
        blueprintPromptCharEstimateAfter: null,
      },
    });
    const traceValidation = trace.validation as {
      specificityTrace?: { fulfilledIdentities: Array<{ toIdentity: string }> };
    };

    assert.ok(
      traceValidation.specificityTrace?.fulfilledIdentities.some(
        (entry) => entry.toIdentity === expectedIdentity,
      ),
      `${label}: trace should expose declared-to-fulfilled specificity mapping`,
    );
  }
}
