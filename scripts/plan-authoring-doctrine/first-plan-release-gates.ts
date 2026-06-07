import assert from "node:assert/strict";
import {
  buildStructuredFirstPlanAuthoringInput,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "../../src/lib/structured-first-plan-onboarding";
import { buildReviewedFirstPlanImportedSeed } from "../../src/lib/active-plan-persistence";
import { buildPersistedWorkoutInsertRows } from "../../src/lib/persisted-plan-replacement";
import { generateAiFirstPlanDraftPreview } from "../../src/lib/ai-first-plan-draft-service";
import { generateStructuredFirstPlanDraftForUser } from "../../src/lib/first-plan-actions";
import {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  type AiFirstPlanBlueprint,
} from "../../src/lib/ai-first-plan-blueprint-authoring";
import { resolveAiFirstPlanBlueprintHorizonStrategy } from "../../src/lib/ai-first-plan-blueprint-horizon";
import { buildMockAiFirstPlanEnvelope } from "../../src/lib/ai-first-plan-envelope-policy";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "../../src/lib/structured-plan-authoring";
import { addDaysIso, diffDaysIso, weekdayLong } from "../../src/lib/training";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";
import type { WeekdayName } from "../../src/lib/weekday-rest-invariants";

export type DoctrineRequestBuilder = (
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  overrides?: Partial<StructuredFirstPlanOnboardingRequestInput>,
) => StructuredFirstPlanOnboardingRequestInput;

export interface FirstPlanReleaseGateDependencies {
  assertBeginnerRunWalkAdaptation: (input: {
    plan: TrainingPlanV2;
    adaptationWeeks: number;
    label: string;
  }) => void;
  assertFixedRestDays: (plan: TrainingPlanV2) => void;
  assertFixedRestDayNames: (plan: TrainingPlanV2, restDays: WeekdayName[], label: string) => void;
  assertLowSupportMarathonExtensionRichness: (input: {
    plan: TrainingPlanV2;
    extensionStartWeek: number;
    label: string;
  }) => void;
  assertNoFakeMetricTargetRegression: (plan: TrainingPlanV2, label: string) => void;
  assertNoSingleSegmentNonRestWorkouts: (plan: TrainingPlanV2, label: string) => void;
  assertRecoveryFirstAfterLongRuns: (plan: TrainingPlanV2, label: string) => void;
  assertRichWorkoutContract: (plan: TrainingPlanV2, label: string) => void;
  assertStructureOnlyExecutableContract: (plan: TrainingPlanV2, label: string) => void;
  assertWeeklyLongRunDay: (
    plan: TrainingPlanV2,
    expectedWeekday: WeekdayName,
    label: string,
  ) => void;
  buildAiFirstPlanAuthoringInput: (
    overrides?: Partial<StructuredPlanAuthoringInput>,
  ) => StructuredPlanAuthoringInput;
  buildAiFirstPlanBlueprintFixture: () => AiFirstPlanBlueprint;
  buildBalancedHalfEnvelopeAuthoringInput: () => StructuredPlanAuthoringInput;
  buildLongHorizonMarathonAiFirstPlanAuthoringInput: () => StructuredPlanAuthoringInput;
  buildRequest: DoctrineRequestBuilder;
  countNonRestWorkouts: (plan: TrainingPlanV2) => number;
  openAiFixtureResponse: (responseId: string, payload: unknown) => Response;
  readAiFirstPlanReferenceFixture: () => unknown;
}

export async function assertFirstPlanReleaseGateContracts(deps: FirstPlanReleaseGateDependencies) {
  await assertAiFirstPlanDraftServiceContract(deps);
  await assertStructuredFirstPlanDraftBlueprintReviewContract(deps);
  assertReviewedFirstPlanPersistenceExactness();
}

async function assertAiFirstPlanDraftServiceContract(deps: FirstPlanReleaseGateDependencies) {
  const {
    buildAiFirstPlanAuthoringInput,
    buildAiFirstPlanBlueprintFixture,
    buildBalancedHalfEnvelopeAuthoringInput,
    buildLongHorizonMarathonAiFirstPlanAuthoringInput,
    countNonRestWorkouts,
    openAiFixtureResponse,
    readAiFirstPlanReferenceFixture,
  } = deps;
  const authoringInput = buildAiFirstPlanAuthoringInput();
  const referenceFixture = readAiFirstPlanReferenceFixture();
  const blueprint = buildAiFirstPlanBlueprintFixture();
  const validResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    referenceExample: referenceFixture,
    today: "2026-05-26",
    apiKey: "test-openai-key",
    model: "test-ai-first-plan-model",
    timeoutMs: 1_000,
    fetchImpl: (async () =>
      openAiFixtureResponse("ai-first-plan-blueprint-valid", blueprint)) as typeof fetch,
  });

  assert.equal(validResult.ok, true, "AI first-plan service should return a bounded result");

  if (validResult.ok) {
    assert.equal(
      validResult.metadata.status,
      "ai_authored",
      "valid AI first-plan service draft should preserve ai_authored status",
    );
    assert.equal(
      validResult.metadata.responseId,
      "ai-first-plan-blueprint-valid",
      "AI first-plan service should expose bounded response id metadata",
    );
    assert.equal(
      validResult.metadata.source,
      "openai_ai_first_plan_blueprint",
      "AI first-plan service should default to the compact blueprint contract",
    );
    assert.equal(
      validResult.canonicalPlan.schema_version,
      "training-plan-v2",
      "AI first-plan service should return normalized training-plan-v2",
    );
  }

  const longHorizonAuthoringInput = buildLongHorizonMarathonAiFirstPlanAuthoringInput();
  const longHorizonStrategy = resolveAiFirstPlanBlueprintHorizonStrategy({
    authoringInput: longHorizonAuthoringInput,
    today: "2026-05-29",
    referenceExample: null,
  });
  const boundedLongHorizonBlueprint = buildMinimalAiFirstPlanBlueprintForAuthoringInput(
    longHorizonStrategy.openAiAuthoringInput,
    { horizonWeeks: longHorizonStrategy.aiAuthoredHorizonWeeks },
  );
  const longHorizonResult = await generateAiFirstPlanDraftPreview({
    input: longHorizonAuthoringInput,
    inputKind: "structured_authoring",
    referenceExample: null,
    today: "2026-05-29",
    apiKey: "test-openai-key",
    model: "test-ai-first-plan-model",
    timeoutMs: 1_000,
    fetchImpl: (async () =>
      openAiFixtureResponse(
        "ai-first-plan-blueprint-long-horizon-valid",
        boundedLongHorizonBlueprint,
      )) as typeof fetch,
  });

  assert.equal(
    longHorizonStrategy.requestedHorizonWeeks,
    29,
    "long target-date fixture should preserve the full 29-week requested horizon",
  );
  assert.equal(
    longHorizonStrategy.aiAuthoredHorizonWeeks,
    16,
    "long target-date fixture should cap the AI-authored prompt horizon",
  );
  assert.equal(
    longHorizonResult.ok,
    true,
    "bounded long-horizon blueprint should extend into a complete reviewable plan",
  );

  if (longHorizonResult.ok) {
    assert.equal(
      longHorizonResult.metadata.status,
      "repaired_ai_draft",
      "backend-extended long-horizon blueprint should be labelled as repaired metadata",
    );
    assert.equal(
      longHorizonResult.canonicalPlan.source_kind,
      "ai_first_plan_blueprint_v1",
      "backend-extended long-horizon plan must keep blueprint source kind",
    );
    assert.equal(
      longHorizonResult.canonicalPlan.preparation_horizon_weeks,
      29,
      "backend-extended long-horizon plan should cover the requested target-date horizon",
    );
    assert.equal(
      longHorizonResult.canonicalPlan.planned_workouts.length,
      29 * 7,
      "backend-extended long-horizon plan should include every reviewed calendar row",
    );
    assert.equal(
      countNonRestWorkouts(longHorizonResult.canonicalPlan),
      145,
      "backend-extended long-horizon plan should preserve every required running slot",
    );
    assert.equal(
      longHorizonResult.metadata.blueprintTrace?.blueprintHorizonStrategy?.backendExtendedWeeks,
      13,
      "long-horizon trace should expose backend-extended weeks",
    );
    assert.ok(
      (longHorizonResult.metadata.blueprintTrace?.blueprintHorizonStrategy
        ?.promptCharEstimateAfter ?? Number.POSITIVE_INFINITY) <
        (longHorizonResult.metadata.blueprintTrace?.blueprintHorizonStrategy
          ?.promptCharEstimateBefore ?? 0),
      "long-horizon trace should prove the capped prompt is smaller than the full prompt",
    );
  }

  const envelopeAuthoringInput = buildBalancedHalfEnvelopeAuthoringInput();
  const envelope = buildMockAiFirstPlanEnvelope(envelopeAuthoringInput);
  const envelopeResult = await generateAiFirstPlanDraftPreview({
    input: envelopeAuthoringInput,
    inputKind: "structured_authoring",
    apiKey: "test-openai-key",
    model: "test-ai-first-plan-model",
    contractMode: "envelope",
    timeoutMs: 1_000,
    fetchImpl: (async () =>
      openAiFixtureResponse("ai-first-plan-envelope-valid", envelope)) as typeof fetch,
  });

  assert.equal(
    envelopeResult.ok,
    true,
    "internal envelope service option should return a reviewable canonical result",
  );

  if (envelopeResult.ok) {
    assert.equal(
      envelopeResult.canonicalPlan.source_kind,
      "ai_first_plan_envelope_v1",
      "internal envelope service option should preserve envelope source kind",
    );
    assert.equal(
      envelopeResult.metadata.status,
      "expanded_from_envelope",
      "internal envelope service option should expose expanded envelope status",
    );
    assert.equal(
      envelopeResult.metadata.source,
      "openai_ai_first_plan_envelope",
      "internal envelope service option should expose envelope source metadata",
    );
    assert.equal(
      envelopeResult.metadata.fallbackReason,
      null,
      "internal envelope service option should not use fallback on valid envelope output",
    );
    assert.equal(
      envelopeResult.metadata.validationIssueCount,
      0,
      "internal envelope service option should pass canonical validation",
    );
    assert.ok(
      envelopeResult.metadata.envelopeTrace,
      "internal envelope service option should expose bounded envelope trace metadata",
    );
  }

  const invalidResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    apiKey: "test-openai-key",
    model: "test-ai-first-plan-model",
    timeoutMs: 1_000,
    fetchImpl: (async () =>
      openAiFixtureResponse("ai-first-plan-invalid", {
        schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
        planName: "Invalid",
        weeks: [],
      })) as typeof fetch,
  });

  assert.equal(
    invalidResult.ok,
    false,
    "invalid AI first-plan service draft should return bounded blueprint-unavailable failure",
  );

  if (!invalidResult.ok && invalidResult.reason === "ai_first_plan_blueprint_unavailable") {
    assert.equal(
      invalidResult.metadata.sourceStatus,
      "blueprint_unavailable",
      "invalid AI first-plan service draft should not become deterministic fallback",
    );
    assert.equal(
      invalidResult.metadata.fallbackReason,
      "ai_first_plan_blueprint_schema_invalid",
      "invalid AI first-plan service draft should expose validation fallback reason",
    );
    assert.ok(
      invalidResult.metadata.validationIssueCount > 0,
      "invalid AI first-plan service draft should expose bounded validation issue count",
    );
  }

  const timeoutResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    apiKey: "test-openai-key",
    model: "test-ai-first-plan-model",
    timeoutMs: 5,
    fetchImpl: (async () => new Promise<Response>(() => undefined)) as typeof fetch,
  });

  assert.equal(
    timeoutResult.ok,
    false,
    "timed-out AI first-plan service should return bounded blueprint-unavailable failure",
  );

  if (!timeoutResult.ok && timeoutResult.reason === "ai_first_plan_blueprint_unavailable") {
    assert.equal(
      timeoutResult.metadata.sourceStatus,
      "blueprint_unavailable",
      "timed-out AI first-plan service should not become deterministic fallback",
    );
    assert.equal(
      timeoutResult.metadata.fallbackReason,
      "ai_first_plan_blueprint_timed_out",
      "timed-out AI first-plan service should expose timeout fallback reason",
    );
  }
}

async function assertStructuredFirstPlanDraftBlueprintReviewContract(
  deps: FirstPlanReleaseGateDependencies,
) {
  const {
    assertBeginnerRunWalkAdaptation,
    assertFixedRestDays,
    assertFixedRestDayNames,
    assertLowSupportMarathonExtensionRichness,
    assertNoFakeMetricTargetRegression,
    assertNoSingleSegmentNonRestWorkouts,
    assertRecoveryFirstAfterLongRuns,
    assertRichWorkoutContract,
    assertStructureOnlyExecutableContract,
    assertWeeklyLongRunDay,
    buildLongHorizonMarathonAiFirstPlanAuthoringInput,
    buildRequest,
    countNonRestWorkouts,
    openAiFixtureResponse,
  } = deps;
  const availability = {
    runningDaysPerWeek: 2,
    fixedRestDays: ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    preferredLongRunDay: "Tuesday",
  } satisfies StructuredFirstPlanOnboardingRequestInput["availability"];
  const initialInput = parseStructuredFirstPlanOnboardingInput(
    buildRequest("half_marathon", {
      availability,
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-06-14",
      },
    }),
  );
  const initialAuthoringInput = buildStructuredFirstPlanAuthoringInput(initialInput);
  const targetDate = addDaysIso(initialAuthoringInput.schedule.startDate, 13);
  const input = parseStructuredFirstPlanOnboardingInput(
    buildRequest("half_marathon", {
      availability,
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate,
      },
    }),
  );
  const authoringInput = buildStructuredFirstPlanAuthoringInput(input);
  const blueprint = buildMinimalAiFirstPlanBlueprintForAuthoringInput(authoringInput);
  const aiResult = await generateStructuredFirstPlanDraftForUser("doctrine-fixture-user", input, {
    aiPreview: {
      apiKey: "test-openai-key",
      model: "test-ai-first-plan-model",
      timeoutMs: 1_000,
      fetchImpl: (async () =>
        openAiFixtureResponse("structured-first-plan-blueprint-valid", blueprint)) as typeof fetch,
    },
  });

  assert.equal(aiResult.ok, true, "structured first-plan draft should return a bounded result");
  assert.equal(aiResult.status, "draft_ready", "structured first-plan draft should be ready");

  if (aiResult.ok && aiResult.status === "draft_ready") {
    assert.equal(
      aiResult.sourceKind,
      "ai_first_plan_blueprint_v1",
      "structured first-plan draft should expose AI blueprint source kind",
    );
    assert.equal(
      aiResult.generation.sourceStatus,
      "ai_authored",
      "structured first-plan draft should expose AI-authored source status",
    );
    assert.equal(
      aiResult.draft.canonicalPlan.source_kind,
      "ai_first_plan_blueprint_v1",
      "structured first-plan draft should review canonical AI blueprint plan truth",
    );
    assert.ok(
      aiResult.draft.draftToken.includes(":"),
      "structured first-plan draft should include a signed reviewed-plan token",
    );
    assertRichWorkoutContract(aiResult.draft.canonicalPlan, "structured first-plan AI draft");
    assertFixedRestDays(aiResult.draft.canonicalPlan);
    assertStructureOnlyExecutableContract(
      aiResult.draft.canonicalPlan,
      "structured first-plan AI draft executable contract",
    );
  }

  const missingExecutionSurfaceResult = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    {
      ...input,
      execution: { watchAccess: "unknown", guidancePreference: "effort" },
    },
    {
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 1_000,
        fetchImpl: (async () => {
          throw new Error("missing execution support should stop before OpenAI");
        }) as typeof fetch,
      },
    },
  );

  assert.equal(
    missingExecutionSurfaceResult.ok,
    true,
    "missing execution surface should return a bounded correction result",
  );
  assert.equal(
    missingExecutionSurfaceResult.status,
    "correction_required",
    "missing execution surface should not enter AI draft generation",
  );

  if (
    missingExecutionSurfaceResult.ok &&
    missingExecutionSurfaceResult.status === "correction_required"
  ) {
    assert.equal(
      missingExecutionSurfaceResult.reason,
      "missing_executable_target_support",
      "missing execution surface should expose the executable target support reason",
    );
    assert.deepEqual(
      missingExecutionSurfaceResult.correction.fields,
      ["execution.watchAccess"],
      "missing execution surface correction should point at watch access",
    );
  }

  const envelopeInput = parseStructuredFirstPlanOnboardingInput(
    buildRequest("half_marathon", {
      profile: { age: 38, weightKg: 72, heightCm: 178 },
      benchmark: { kind: "recent_5k_time", recent5kTime: "24:30" },
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
      },
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "balanced",
        terrainFocus: "standard",
        targetTime: null,
        targetDate: "2026-07-12",
      },
      schedule: {
        startDate: "2026-06-01",
        targetDate: "2026-07-12",
      },
      strength: { preference: "mobility" },
      execution: { watchAccess: "watch_or_app", guidancePreference: "effort" },
      comment: null,
    }),
  );
  const envelopeAuthoringInput = buildStructuredFirstPlanAuthoringInput(envelopeInput);
  const envelope = buildMockAiFirstPlanEnvelope(envelopeAuthoringInput);
  const envelopeDraft = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    envelopeInput,
    {
      internalDraftContract: "envelope",
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 1_000,
        fetchImpl: (async () =>
          openAiFixtureResponse("structured-first-plan-envelope-valid", envelope)) as typeof fetch,
      },
    },
  );

  assert.equal(
    envelopeDraft.ok,
    true,
    "explicit internal envelope structured first-plan option should return a draft",
  );

  if (envelopeDraft.ok && envelopeDraft.status === "draft_ready") {
    assert.equal(
      envelopeDraft.sourceKind,
      "ai_first_plan_envelope_v1",
      "explicit internal envelope draft should expose envelope source kind",
    );
    assert.equal(
      envelopeDraft.generation.sourceStatus,
      "expanded_from_envelope",
      "explicit internal envelope draft should expose expanded envelope status",
    );
    assert.equal(
      envelopeDraft.draft.canonicalPlan.source_kind,
      "ai_first_plan_envelope_v1",
      "explicit internal envelope draft should review canonical envelope plan truth",
    );
    assert.equal(
      envelopeDraft.safety.doesNotMutatePlan,
      true,
      "explicit internal envelope draft generation must remain non-mutating",
    );
    assert.ok(
      envelopeDraft.draft.draftToken.includes(":"),
      "explicit internal envelope draft should include a signed reviewed-plan token",
    );
    assertRichWorkoutContract(
      envelopeDraft.draft.canonicalPlan,
      "explicit internal envelope structured draft",
    );
    assertFixedRestDayNames(
      envelopeDraft.draft.canonicalPlan,
      ["Wednesday", "Sunday"],
      "explicit internal envelope structured draft",
    );
    assertWeeklyLongRunDay(
      envelopeDraft.draft.canonicalPlan,
      "Saturday",
      "explicit internal envelope structured draft",
    );
    assertNoFakeMetricTargetRegression(
      envelopeDraft.draft.canonicalPlan,
      "explicit internal envelope structured draft",
    );
    assert.ok(
      envelopeDraft.generation.envelopeTrace,
      "explicit internal envelope draft should carry bounded envelope trace metadata",
    );
  }

  const invalidEnvelopeDraft = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    envelopeInput,
    {
      internalDraftContract: "envelope",
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 1_000,
        fetchImpl: (async () =>
          openAiFixtureResponse("structured-first-plan-envelope-invalid", {
            ...envelope,
            phases: [],
          })) as typeof fetch,
      },
    },
  );

  assert.equal(
    invalidEnvelopeDraft.ok,
    false,
    "invalid internal envelope structured first-plan option should fail bounded",
  );

  if (!invalidEnvelopeDraft.ok && invalidEnvelopeDraft.status === "draft_failed") {
    assert.equal(
      invalidEnvelopeDraft.reason,
      "ai_first_plan_envelope_unavailable",
      "invalid internal envelope draft should expose envelope unavailable reason",
    );
    assert.equal(
      invalidEnvelopeDraft.generation.sourceKind,
      "ai_first_plan_envelope_v1",
      "invalid internal envelope draft should keep envelope source boundary",
    );
    assert.equal(
      invalidEnvelopeDraft.generation.sourceStatus,
      "envelope_unavailable",
      "invalid internal envelope draft should expose unavailable envelope status",
    );
    assert.ok(
      !("draft" in invalidEnvelopeDraft),
      "invalid internal envelope draft must not include a reviewed-plan token",
    );
  }

  const timedOutEnvelopeDraft = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    envelopeInput,
    {
      internalDraftContract: "envelope",
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 5,
        fetchImpl: (async () => new Promise<Response>(() => undefined)) as typeof fetch,
      },
    },
  );

  assert.equal(
    timedOutEnvelopeDraft.ok,
    false,
    "timed-out internal envelope structured first-plan option should fail bounded",
  );

  if (!timedOutEnvelopeDraft.ok && timedOutEnvelopeDraft.status === "draft_failed") {
    assert.equal(
      timedOutEnvelopeDraft.generation.fallbackReason,
      "ai_first_plan_envelope_timed_out",
      "timed-out internal envelope draft should expose bounded timeout reason",
    );
    assert.ok(
      !("draft" in timedOutEnvelopeDraft),
      "timed-out internal envelope draft must not include a reviewed-plan token",
    );
  }

  const invalidResult = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    input,
    {
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 1_000,
        fetchImpl: (async () =>
          openAiFixtureResponse("structured-first-plan-blueprint-invalid", {
            schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
            planName: "Invalid",
            weeks: [],
          })) as typeof fetch,
      },
    },
  );

  assert.equal(
    invalidResult.ok,
    false,
    "invalid blueprint structured first-plan draft should return bounded failure",
  );
  assert.equal(
    invalidResult.status,
    "draft_failed",
    "invalid blueprint must not produce a reviewable deterministic draft",
  );

  if (!invalidResult.ok && invalidResult.status === "draft_failed") {
    assert.equal(
      invalidResult.generation.sourceStatus,
      "blueprint_unavailable",
      "invalid blueprint structured draft should expose unavailable status",
    );
    assert.equal(
      invalidResult.generation.fallbackReason,
      "ai_first_plan_blueprint_schema_invalid",
      "invalid blueprint structured draft should expose bounded fallback reason",
    );
    assert.equal(
      invalidResult.generation.sourceKind,
      "ai_first_plan_blueprint_v1",
      "invalid blueprint structured draft should keep the blueprint source boundary",
    );
  }

  const partialInput = parseStructuredFirstPlanOnboardingInput(
    buildRequest("marathon", {
      profile: { age: 36, weightKg: 72, heightCm: 178 },
      benchmark: { fitnessLevel: "new_to_running" },
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: ["Wednesday", "Saturday"],
        preferredLongRunDay: "Sunday",
      },
      goal: {
        goalDistance: "marathon",
        goalStyle: "target_time",
        terrainFocus: "rolling",
        targetTime: "3:50:00",
        targetDate: "2026-12-11",
      },
      schedule: {
        startDate: "2026-05-29",
        targetDate: "2026-12-11",
      },
      strength: { preference: "mobility" },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
      comment: null,
    }),
  );
  const partialAuthoringInput = buildStructuredFirstPlanAuthoringInput(partialInput);
  const partialHorizonWeeks = Math.ceil(
    (diffDaysIso(
      partialAuthoringInput.schedule.targetDate!,
      partialAuthoringInput.schedule.startDate,
    ) +
      1) /
      7,
  );
  const boundedHorizonStrategy = resolveAiFirstPlanBlueprintHorizonStrategy({
    authoringInput: partialAuthoringInput,
    today: "2026-05-29",
    referenceExample: null,
  });
  const boundedHorizonBlueprint = buildMinimalAiFirstPlanBlueprintForAuthoringInput(
    boundedHorizonStrategy.openAiAuthoringInput,
    { horizonWeeks: boundedHorizonStrategy.aiAuthoredHorizonWeeks },
  );
  const forcedPostLongRunSteady =
    forceFirstPostLongRunBlueprintWorkoutToSteady(boundedHorizonBlueprint);
  const boundedHorizonResult = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    partialInput,
    {
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 1_000,
        fetchImpl: (async () =>
          openAiFixtureResponse(
            "structured-first-plan-blueprint-long-horizon-valid",
            boundedHorizonBlueprint,
          )) as typeof fetch,
      },
    },
  );

  assert.equal(
    partialHorizonWeeks,
    29,
    "long target-date structured first-plan scenario should reproduce the 29-week marathon horizon",
  );
  assert.equal(
    boundedHorizonStrategy.aiAuthoredHorizonWeeks,
    16,
    "long target-date structured first-plan scenario should cap the OpenAI prompt horizon",
  );
  assert.equal(
    boundedHorizonResult.ok,
    true,
    "long target-date structured first-plan draft should review a complete backend-extended blueprint plan",
  );

  if (boundedHorizonResult.ok && boundedHorizonResult.status === "draft_ready") {
    assert.equal(
      boundedHorizonResult.draft.canonicalPlan.source_kind,
      "ai_first_plan_blueprint_v1",
      "long target-date structured first-plan review should remain blueprint-backed",
    );
    assert.equal(
      boundedHorizonResult.generation.sourceStatus,
      "repaired_ai_draft",
      "long target-date backend extension should be visible in review metadata",
    );
    assert.equal(
      boundedHorizonResult.generation.blueprintTrace?.blueprintHorizonStrategy
        ?.requestedHorizonWeeks,
      29,
      "structured review trace should preserve requested horizon weeks",
    );
    assert.equal(
      boundedHorizonResult.generation.blueprintTrace?.blueprintHorizonStrategy
        ?.backendExtendedWeeks,
      13,
      "structured review trace should expose backend-extended weeks",
    );
    assert.equal(
      boundedHorizonResult.draft.canonicalPlan.planned_workouts.length,
      29 * 7,
      "long target-date structured review should include full calendar rows",
    );
    assert.equal(
      countNonRestWorkouts(boundedHorizonResult.draft.canonicalPlan),
      145,
      "long target-date structured review should include every required running slot",
    );
    assertFixedRestDayNames(
      boundedHorizonResult.draft.canonicalPlan,
      ["Wednesday", "Saturday"],
      "long target-date low-support marathon review",
    );
    assertWeeklyLongRunDay(
      boundedHorizonResult.draft.canonicalPlan,
      "Sunday",
      "long target-date low-support marathon review",
    );
    assertRecoveryFirstAfterLongRuns(
      boundedHorizonResult.draft.canonicalPlan,
      "long target-date low-support marathon review",
    );
    assertRichWorkoutContract(
      boundedHorizonResult.draft.canonicalPlan,
      "long target-date low-support marathon review",
    );
    assertNoSingleSegmentNonRestWorkouts(
      boundedHorizonResult.draft.canonicalPlan,
      "long target-date low-support marathon review",
    );
    assertNoFakeMetricTargetRegression(
      boundedHorizonResult.draft.canonicalPlan,
      "long target-date low-support marathon review",
    );
    assertBeginnerRunWalkAdaptation({
      plan: boundedHorizonResult.draft.canonicalPlan,
      adaptationWeeks: 6,
      label: "long target-date low-support marathon review",
    });
    assertLowSupportMarathonExtensionRichness({
      plan: boundedHorizonResult.draft.canonicalPlan,
      extensionStartWeek: boundedHorizonStrategy.aiAuthoredHorizonWeeks + 1,
      label: "long target-date low-support marathon review",
    });
    assert.equal(
      boundedHorizonResult.generation.blueprintTrace?.requiredCadenceSlots.length,
      0,
      "low-support marathon target-date review should keep cadence kind none",
    );
    assert.ok(
      forcedPostLongRunSteady,
      "doctrine fixture should force a post-long-run steady blueprint workout before repair",
    );
    assert.ok(
      boundedHorizonResult.generation.repairs.some((repair) =>
        repair.includes(`recovery-first sequencing changed steady_aerobic_run`),
      ),
      "post-long-run steady blueprint workout should be repaired before review",
    );
    assert.equal(
      boundedHorizonResult.generation.blueprintTrace?.deterministicFallbackBoundary.used,
      false,
      "long target-date structured review must not use deterministic fallback",
    );
  }

  const nonSundayLongRunAuthoringInput = structuredPlanAuthoringInputSchema.parse({
    ...partialAuthoringInput,
    schedule: {
      ...partialAuthoringInput.schedule,
      startDate: "2026-06-01",
      targetDate: null,
      preparationHorizonWeeks: 4,
    },
    availability: {
      ...partialAuthoringInput.availability,
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Sunday"],
      unavailableDays: ["Wednesday", "Saturday"],
      preferredLongRunDay: "Tuesday",
    },
  });
  const nonSundayLongRunPlan = buildStructuredAuthoringPlan(nonSundayLongRunAuthoringInput);

  assertWeeklyLongRunDay(
    nonSundayLongRunPlan,
    "Tuesday",
    "non-Sunday low-support marathon recovery sequencing fixture",
  );
  assertFixedRestDayNames(
    nonSundayLongRunPlan,
    ["Wednesday", "Saturday"],
    "non-Sunday low-support marathon recovery sequencing fixture",
  );
  assertRecoveryFirstAfterLongRuns(
    nonSundayLongRunPlan,
    "non-Sunday low-support marathon recovery sequencing fixture",
  );

  const partialBlueprint = {
    ...buildMinimalAiFirstPlanBlueprintForAuthoringInput(partialAuthoringInput, {
      horizonWeeks: partialHorizonWeeks,
    }),
  };
  partialBlueprint.weeks = partialBlueprint.weeks.slice(0, 5);
  const partialResult = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    partialInput,
    {
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 1_000,
        fetchImpl: (async () =>
          openAiFixtureResponse(
            "structured-first-plan-blueprint-partial",
            partialBlueprint,
          )) as typeof fetch,
      },
    },
  );

  assert.equal(
    partialHorizonWeeks,
    29,
    "partial blueprint doctrine scenario should reproduce the 29-week marathon horizon",
  );
  assert.equal(
    partialResult.ok,
    false,
    "partial blueprint structured first-plan draft should return bounded failure",
  );

  if (!partialResult.ok && partialResult.status === "draft_failed") {
    assert.equal(
      partialResult.generation.fallbackReason,
      "ai_first_plan_blueprint_incomplete",
      "partial blueprint structured draft should expose incomplete fallback reason",
    );
    assert.ok(
      partialResult.generation.validationIssues.some((issue) =>
        issue.includes("incomplete_blueprint_weeks"),
      ),
      "partial blueprint structured draft should report missing week validation issue",
    );
    assert.equal(
      partialResult.generation.blueprintTrace?.blueprintCompleteness?.expectedWeekCount,
      16,
      "partial blueprint structured draft trace should include the bounded AI-authored expected week count",
    );
    assert.equal(
      partialResult.generation.blueprintTrace?.blueprintCompleteness?.actualWeekCount,
      5,
      "partial blueprint structured draft trace should include actual authored week count",
    );
    assert.equal(
      partialResult.generation.blueprintTrace?.blueprintHorizonStrategy?.requestedHorizonWeeks,
      29,
      "partial blueprint structured draft trace should still expose the full requested horizon",
    );
    assert.equal(
      partialResult.generation.blueprintTrace?.blueprintHorizonStrategy?.backendExtendedWeeks,
      13,
      "partial blueprint structured draft trace should expose planned backend extension boundary",
    );
    assert.equal(
      partialResult.generation.blueprintTrace?.deterministicFallbackBoundary.used,
      false,
      "partial blueprint structured draft must not use deterministic fallback",
    );
    assert.ok(
      !("draft" in partialResult),
      "partial blueprint structured draft must not include a reviewed-plan token",
    );
  }

  const timeoutResult = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    input,
    {
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 5,
        fetchImpl: (async () => new Promise<Response>(() => undefined)) as typeof fetch,
      },
    },
  );

  assert.equal(
    timeoutResult.ok,
    false,
    "timed-out blueprint structured first-plan draft should return bounded failure",
  );

  if (!timeoutResult.ok && timeoutResult.status === "draft_failed") {
    assert.equal(
      timeoutResult.generation.sourceStatus,
      "blueprint_unavailable",
      "timed-out blueprint structured draft should expose unavailable status",
    );
    assert.equal(
      timeoutResult.generation.fallbackReason,
      "ai_first_plan_blueprint_timed_out",
      "timed-out blueprint structured draft should expose bounded timeout reason",
    );
    assert.ok(
      !("draft" in timeoutResult),
      "timed-out blueprint structured draft must not include a reviewed-plan token",
    );
  }
}

function assertReviewedFirstPlanPersistenceExactness() {
  const reviewedPlan = buildReviewedFirstPlanExactnessFixture();
  const seed = buildReviewedFirstPlanImportedSeed(reviewedPlan);
  const rows = buildPersistedWorkoutInsertRows("reviewed-plan", "reviewed-user", seed.workouts);

  assert.equal(
    seed.workouts.length,
    reviewedPlan.planned_workouts.length,
    "reviewed first-plan persistence seed should keep every reviewed calendar row",
  );
  assert.equal(
    seed.endDate,
    "2026-06-01",
    "reviewed first-plan persistence seed should keep trailing reviewed calendar days",
  );
  assert.equal(
    rows.length,
    reviewedPlan.planned_workouts.length,
    "reviewed first-plan persisted rows should match reviewed row count exactly",
  );
  assert.equal(
    rows.at(-1)?.workout_date,
    "2026-06-01",
    "reviewed first-plan persisted rows should keep reviewed final date",
  );

  const reviewedRestRow = rows.find((row) => row.workout_date === "2026-05-31");
  assert.ok(reviewedRestRow, "reviewed rest day should be persisted");
  assert.equal(
    reviewedRestRow?.title,
    "Rest and recovery",
    "reviewed rest day title should not be rewritten into synthetic fixed-rest copy",
  );
  assert.equal(
    reviewedRestRow?.notes,
    "No run today; protect recovery.",
    "reviewed rest day notes should come from the reviewed canonical row",
  );
  assert.deepEqual(
    reviewedRestRow?.steps,
    [],
    "reviewed rest day should keep the canonical empty persisted steps shape",
  );
  assert.notEqual(
    reviewedRestRow?.notes,
    "Fixed weekday rest day.",
    "reviewed first-plan confirm must not insert synthetic fixed-rest notes",
  );

  const invalidReviewedPlan: TrainingPlanV2 = {
    ...reviewedPlan,
    planned_workouts: reviewedPlan.planned_workouts.map((workout) =>
      workout.date === "2026-05-31"
        ? {
            ...workout,
            workout_type: "easy",
            source_workout_type: "easy_aerobic_run",
            workout_family: "easy",
            workout_identity: "easy_aerobic_run",
            calendar_icon_key: "easy",
            title: "Invalid fixed-rest run",
            summary: "This tampered draft tries to place running on a fixed rest day.",
            segments: [
              {
                segment_id: "invalid-main",
                segment_type: "main",
                label: "Easy run",
                sequence: 1,
                guidance: "This should be rejected before persistence.",
                prescription: { mode: "time", duration_min: 30 },
              },
            ],
          }
        : workout,
    ),
  };

  assert.throws(
    () => buildReviewedFirstPlanImportedSeed(invalidReviewedPlan),
    /Fixed rest-day constraints would be violated/,
    "reviewed first-plan persistence should validate fixed rest days without rewriting",
  );
}

function buildReviewedFirstPlanExactnessFixture(): TrainingPlanV2 {
  const metricMode = {
    guidance: "effort" as const,
    pace_targets_allowed: false,
    hr_targets_allowed: false,
    hr_target_source: "effort_only" as const,
    reason: "Fixture stays effort-only.",
  };
  const goalContext = {
    goal_type: "half_marathon",
    goal_style: "target_time",
    terrain_focus: "standard" as const,
    target_date: "2026-06-01",
    target_time: "2:00:00",
  };

  return {
    schema_version: "training-plan-v2",
    plan_name: "Reviewed AI blueprint exactness fixture",
    source_kind: "ai_first_plan_blueprint_v1",
    generated_for: "Doctrine fixture",
    goal: {
      goal_type: "half_marathon",
      goal_label: "Half marathon target-time plan",
      target_event: { date: "2026-06-01" },
    },
    runner_profile: {
      experience_level: "returning_runner",
      baseline_sessions_per_week: 2,
      baseline_long_run_duration_min: 45,
      age: 34,
      primary_goal: "Half marathon",
    },
    start_date: "2026-05-30",
    preparation_horizon_weeks: 1,
    target_date: "2026-06-01",
    plan_preferences: {
      preferred_run_days: ["Saturday"],
      blocked_days: ["Sunday"],
      max_running_days_per_week: 1,
      preferred_long_run_day: "Saturday",
    },
    training_constraints: {
      running_days_per_week: 1,
      full_rest_days: ["Sunday"],
      long_run_day: "Saturday",
    },
    planned_workouts: [
      {
        workout_id: "reviewed-easy-2026-05-30",
        date: "2026-05-30",
        weekday: "Saturday",
        week_number: 1,
        phase: "Base",
        workout_type: "easy",
        source_workout_type: "easy_aerobic_run",
        workout_family: "easy",
        workout_identity: "easy_aerobic_run",
        calendar_icon_key: "easy",
        goal_context: goalContext,
        metric_mode: metricMode,
        title: "Easy aerobic run",
        summary: "A reviewed easy run with visible structure.",
        planned_rpe: 4,
        estimated_fatigue: "low",
        recovery_priority: "medium",
        segments: [
          {
            segment_id: "easy-warmup",
            segment_type: "warmup",
            label: "Ease in",
            sequence: 1,
            guidance: "Start relaxed and conversational.",
            prescription: { mode: "time", duration_min: 8 },
          },
          {
            segment_id: "easy-main",
            segment_type: "main",
            label: "Easy aerobic",
            sequence: 2,
            guidance: "Stay smooth and effort-led.",
            prescription: { mode: "time", duration_min: 24 },
          },
          {
            segment_id: "easy-finish",
            segment_type: "cooldown",
            label: "Easy finish",
            sequence: 3,
            guidance: "Finish lighter than you started.",
            prescription: { mode: "time", duration_min: 8 },
          },
        ],
      },
      {
        workout_id: "reviewed-rest-2026-05-31",
        date: "2026-05-31",
        weekday: "Sunday",
        week_number: 1,
        phase: "Base",
        workout_type: "rest",
        source_workout_type: "rest_and_recovery",
        workout_family: "rest",
        workout_identity: "rest_and_recovery",
        calendar_icon_key: "rest",
        goal_context: goalContext,
        metric_mode: metricMode,
        title: "Rest and recovery",
        summary: "Reviewed rest day should persist exactly.",
        estimated_fatigue: "low",
        recovery_priority: "high",
        segments: [
          {
            segment_id: "reviewed-rest",
            segment_type: "rest",
            label: "Rest and recovery",
            sequence: 1,
            guidance: "No run today; protect recovery.",
            prescription: { mode: "none" },
          },
        ],
      },
      {
        workout_id: "reviewed-trailing-rest-2026-06-01",
        date: "2026-06-01",
        weekday: "Monday",
        week_number: 1,
        phase: "Base",
        workout_type: "rest",
        source_workout_type: "rest_and_recovery",
        workout_family: "rest",
        workout_identity: "rest_and_recovery",
        calendar_icon_key: "rest",
        goal_context: goalContext,
        metric_mode: metricMode,
        title: "Trailing reviewed rest",
        summary: "Reviewed trailing calendar day should not be dropped.",
        estimated_fatigue: "low",
        recovery_priority: "medium",
        segments: [
          {
            segment_id: "reviewed-trailing-rest",
            segment_type: "rest",
            label: "Rest",
            sequence: 1,
            guidance: "Keep the reviewed trailing day in saved mode.",
            prescription: { mode: "none" },
          },
        ],
      },
    ],
  };
}

export function buildMinimalAiFirstPlanBlueprintForAuthoringInput(
  authoringInput: ReturnType<typeof buildStructuredFirstPlanAuthoringInput>,
  options: { horizonWeeks?: number } = {},
): AiFirstPlanBlueprint {
  const startDate = authoringInput.schedule.startDate;
  const runningDays = authoringInput.availability.preferredRunningDays.filter(
    (weekday) => !authoringInput.availability.unavailableDays.includes(weekday),
  );
  const horizonWeeks = options.horizonWeeks ?? 2;

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint first-plan review fixture",
    generatedFor: "Doctrine fixture",
    goalSummary: authoringInput.goal.goalLabel,
    startDate,
    targetDate: authoringInput.schedule.targetDate ?? addDaysIso(startDate, horizonWeeks * 7 - 1),
    preparationHorizonWeeks: horizonWeeks,
    planPreferences: {
      preferredRunningDays: authoringInput.availability.preferredRunningDays,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    },
    reviewAssumptions: [
      "Backend expands compact workout intent into canonical segments and metric truth.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace and personal HR truth gates.",
    weeks: Array.from({ length: horizonWeeks }, (_value, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase: weekIndex === 0 ? "Base" : "Build",
      theme: weekIndex === 0 ? "Set rhythm" : "Progress durability",
      microcycleIntent: "Keep the compact AI-authored week simple but reviewable.",
      cutbackWeek: false,
      taperWeek: false,
      longRunIntent: "Keep the long run on the reviewed preferred long-run day.",
      longRunProgression: "Progress long-run durability conservatively.",
      plannedWorkouts: runningDays.map((weekday) => {
        const isLongRun = weekday === authoringInput.availability.preferredLongRunDay;
        const date = dateForWeekdayInSevenDayWindow(addDaysIso(startDate, weekIndex * 7), weekday);

        return {
          date,
          weekday,
          workoutFamily: isLongRun ? "long" : "easy",
          workoutIdentity: isLongRun ? "long_aerobic_run" : "easy_aerobic_run",
          calendarIconKey: isLongRun ? "long" : "easy",
          title: isLongRun ? "Long aerobic run" : "Easy aerobic run",
          summary: isLongRun
            ? "Reviewable long-run durability from the AI-authored blueprint."
            : "Reviewable easy support running from the AI-authored blueprint.",
          plannedRpe: isLongRun ? 5 : 4,
          estimatedFatigue: isLongRun ? "medium" : "low",
          recoveryPriority: isLongRun ? "high" : "medium",
          segmentIntent: isLongRun ? "long_durability" : "easy_aerobic",
          metricIntent: "mixed_if_allowed",
        };
      }),
    })),
  };
}

function forceFirstPostLongRunBlueprintWorkoutToSteady(blueprint: AiFirstPlanBlueprint) {
  const entries = blueprint.weeks
    .flatMap((week) => week.plannedWorkouts.map((workout) => ({ week, workout })))
    .filter((entry) => entry.workout.date)
    .sort((left, right) => left.workout.date!.localeCompare(right.workout.date!));

  for (let index = 0; index < entries.length; index += 1) {
    const longRunEntry = entries[index]!;

    if (longRunEntry.workout.workoutFamily !== "long") {
      continue;
    }

    const nextEntry = entries[index + 1] ?? null;

    if (!nextEntry) {
      return null;
    }

    nextEntry.workout.workoutFamily = "steady";
    nextEntry.workout.workoutIdentity = "steady_aerobic_run";
    nextEntry.workout.calendarIconKey = "steady";
    nextEntry.workout.title = "Steady aerobic run";
    nextEntry.workout.summary =
      "Deliberately inserted doctrine fixture violation after a long run.";
    nextEntry.workout.plannedRpe = 5;
    nextEntry.workout.estimatedFatigue = "medium";
    nextEntry.workout.recoveryPriority = "medium";
    nextEntry.workout.segmentIntent = "steady_aerobic";
    nextEntry.workout.metricIntent = "mixed_if_allowed";

    return {
      longRunDate: longRunEntry.workout.date!,
      repairedDate: nextEntry.workout.date!,
    };
  }

  return null;
}

function dateForWeekdayInSevenDayWindow(startDate: string, weekday: WeekdayName) {
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDaysIso(startDate, offset);

    if (weekdayLong(date) === weekday) {
      return date;
    }
  }

  return startDate;
}
