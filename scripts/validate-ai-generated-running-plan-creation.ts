import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  isAiGeneratedRunningPlanDevFixtureEnabled,
  resolveAiGeneratedRunningPlanDevFixtureDelayMs,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import {
  AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  type AiAuthoredPlanFirstDraft,
} from "../src/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
  buildAiAuthoredPlanFirstOpenAiSchema,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildAiGeneratedRunningPlanAuthoringInput,
} from "../src/lib/ai-generated-running-plan";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import { buildReviewedFirstPlanImportedSeed } from "../src/lib/active-plan-persistence";
import {
  buildReviewedAiGeneratedRunningPlanPreview,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  buildRunningPlanCanonicalPlan,
  validateRunningPlanReviewExactness,
  validateSelfContainedRunningPlanReviewToken,
} from "../src/lib/running-plan-engine-review";
import { selectedDistanceEndpointMainDistanceMeters } from "../src/lib/plan-creation-engine";

const baseInput = {
  age: 36,
  heightCm: 178,
  weightKg: 74,
  runnerLevel: "runs_a_lot",
  daysPerWeek: 5,
  fixedRestDays: ["Wednesday", "Saturday"],
  preferredLongRunDay: "Sunday",
  startDate: "2026-06-08",
  benchmark: { kind: "unknown" },
} satisfies Omit<RunningPlanPreviewActionInput, "distanceFamily">;

const scenarios = [
  {
    name: "10K no benchmark",
    input: {
      ...baseInput,
      runnerLevel: "sometimes_runs",
      distanceFamily: "10K",
      planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
    },
    expectedEndpointMeters: 10_000,
  },
  {
    name: "Half Marathon target time",
    input: {
      ...baseInput,
      distanceFamily: "Half Marathon",
      startDate: "2026-07-02",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2026-11-26",
        targetFinishTime: "2:00:00",
      },
    },
    expectedEndpointMeters: 21_100,
    expectedFinalDate: "2026-11-26",
  },
  {
    name: "Marathon target time",
    input: {
      ...baseInput,
      distanceFamily: "Marathon Completion",
      startDate: "2026-07-20",
      fixedRestDays: ["Tuesday", "Saturday"],
      preferredLongRunDay: "Sunday",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Marathon" },
        targetDate: "2026-12-20",
        targetFinishTime: "4:00:00",
      },
    },
    expectedEndpointMeters: 42_195,
    expectedFinalDate: "2026-12-20",
  },
  {
    name: "Custom 15K target time",
    input: {
      ...baseInput,
      distanceFamily: null,
      startDate: "2026-07-06",
      planGoalIntent: {
        distance: { kind: "custom", distanceKm: 15, label: "15K" },
        targetDate: "2026-10-04",
        targetFinishTime: "1:25:00",
      },
    },
    expectedEndpointMeters: 15_000,
    expectedFinalDate: "2026-10-04",
  },
] satisfies Array<{
  name: string;
  input: RunningPlanPreviewActionInput;
  expectedEndpointMeters: number;
  expectedFinalDate?: string;
}>;

await validatePlanFirstPreviewScenarios();
await validateProviderContractBoundary();
await validateFirstPlanGenerationLifecycle();
await validateInvalidProviderOutputFailsBeforeReview();
await validatePathologicalProviderNumberFailsBeforeReview();
await validateProviderStructuralBoundsFailBeforeReview();
await validateLocalDevFixtureAvailabilityGating();
validateNoLegacyGeneratedPlanAuthoringSourceImports();

console.log("AI-generated plan-first creation contract checks passed.", {
  scenarios: scenarios.map((scenario) => scenario.name),
  sourceKind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  contractMode: "plan_first",
});

async function validatePlanFirstPreviewScenarios() {
  for (const scenario of scenarios) {
    const result = await buildReviewedAiGeneratedRunningPlanPreview(scenario.input, {
      aiPreview: buildScenarioAiPreviewOptions(scenario.input),
    });

    assert.equal(
      result.ok,
      true,
      result.ok
        ? `${scenario.name} must produce reviewed plan-first preview.`
        : `${scenario.name} failed: ${result.unavailable.error.message}`,
    );
    if (!result.ok) throw new Error(result.unavailable.error.message);

    const canonicalPlan = await assertReviewedDraftExactness({
      scenarioName: scenario.name,
      draft: result.draft,
      expectedEndpointMeters: scenario.expectedEndpointMeters,
      expectedFinalDate: scenario.expectedFinalDate,
    });

    assert.equal(result.draft.sourceKind, AI_AUTHORED_PLAN_FIRST_SOURCE_KIND);
    assert.equal(result.draft.aiGeneration.status, "ai_authored");
    assert.equal(result.draft.reviewSafety.confirmCallsOpenAi, false);
    assert.equal(result.draft.reviewSafety.trustedClientRows, false);
    assert.equal(
      result.draft.normalizedInputSummary.planGoalIntent?.distance?.distanceMeters,
      scenario.expectedEndpointMeters,
    );
    assertPlanFirstGuidanceAndRepeatShape({
      scenarioName: scenario.name,
      canonicalPlan,
    });
    assertNoLegacyOrDebugReadback({
      scenarioName: scenario.name,
      value: {
        draft: result.draft,
        canonicalPlan,
        importedSeed: buildImportedPlanSeed(canonicalPlan),
        reviewedSeed: buildReviewedFirstPlanImportedSeed(canonicalPlan),
      },
    });
  }
}

async function validateProviderContractBoundary() {
  const scenario = scenarios[1]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  let capturedRequest: { url: string; body: Record<string, unknown> } | null = null;
  const result = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    inputKind: "structured_authoring",
    apiKey: "paid-provider-contract-plan-first-proof",
    model: "gpt-5-provider-contract-plan-first-proof",
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    timeoutMs: 5_000,
    maxOutputTokens: 12_000,
    fetchImpl: async (url, init) => {
      capturedRequest = {
        url: String(url),
        body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
      };

      return fixtureFetch(url, init);
    },
  });

  assert.equal(
    result.ok,
    true,
    result.ok ? "Provider contract proof must compile." : result.message,
  );
  if (!result.ok) throw new Error(result.message);

  assert.notEqual(capturedRequest, null, "Provider request must be captured.");
  if (!capturedRequest) throw new Error("Provider request was not captured.");

  const serializedRequest = JSON.stringify(capturedRequest.body);
  const requestInput = capturedRequest.body.input as Array<{
    role: string;
    content: Array<{ type: string; text: string }>;
  }>;
  const systemPrompt = requestInput.find((message) => message.role === "system")?.content[0]?.text;
  const userPrompt = requestInput.find((message) => message.role === "user")?.content[0]?.text;
  const responseSchema = (
    capturedRequest.body.text as { format?: { schema?: Record<string, unknown> } }
  )?.format?.schema;
  assert.ok(systemPrompt, "Provider request must include a system prompt.");
  assert.ok(userPrompt, "Provider request must include a user prompt.");
  assert.ok(responseSchema, "Provider request must include a strict response schema.");

  const providerFacts = JSON.parse(userPrompt) as {
    runnerFacts: {
      calendar: { workout_weekdays: string[]; rest_weekdays: string[] };
    };
  };
  const schemaChars = JSON.stringify(responseSchema).length;
  const oldSchemaChars = 19_478;
  assert.match(capturedRequest.url, /\/v1\/responses$/);
  assert.match(serializedRequest, new RegExp(AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME));
  assert.match(systemPrompt, /weeks\[\]\.days\[\]/i);
  assert.match(systemPrompt, /repeat\.children/i);
  assert.ok(
    schemaChars < oldSchemaChars / 2,
    `Provider schema must be less than half the retired ${oldSchemaChars}-character contract; received ${schemaChars}.`,
  );
  assert.ok(
    userPrompt.length < 3_000,
    `Provider facts must stay compact; received ${userPrompt.length}.`,
  );
  assert.doesNotMatch(userPrompt, /goalType|distance_build|planGoalIntent|metricTruthPolicy/i);
  assert.doesNotMatch(userPrompt, /allowBackToBackDays|Goal intent is|outcome pace may/i);
  assert.doesNotMatch(JSON.stringify(responseSchema), /"number"/);
  assert.match(JSON.stringify(responseSchema), /"integer"/);
  assert.deepEqual(
    new Set([
      ...providerFacts.runnerFacts.calendar.workout_weekdays,
      ...providerFacts.runnerFacts.calendar.rest_weekdays,
    ]).size,
    7,
  );
  assert.deepEqual(
    providerFacts.runnerFacts.calendar.workout_weekdays.filter((day) =>
      providerFacts.runnerFacts.calendar.rest_weekdays.includes(day),
    ),
    [],
  );
  assert.equal(
    resolved.authoringInput.availability.allowBackToBackDays,
    true,
    "Selected adjacent workout weekdays must be represented honestly in canonical authoring input.",
  );
  assert.deepEqual(responseSchema, buildAiAuthoredPlanFirstOpenAiSchema());
  assert.equal(result.metadata.debug.contractMode, "plan_first");
  assert.equal(result.metadata.debug.responseSchemaMode, "responses_json_schema_plan_first_strict");
  assert.equal(result.metadata.generationTrace?.request.contractMode, "plan_first");
  assert.equal(result.canonicalPlan.source_kind, AI_AUTHORED_PLAN_FIRST_SOURCE_KIND);
}

async function validateFirstPlanGenerationLifecycle() {
  const scenario = scenarios[0]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const fixtureResponse = await fixtureFetch("https://api.openai.com/v1/responses", {});
  const completedBody = (await fixtureResponse.json()) as Record<string, unknown>;
  const delayedFixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    env: {
      LOCAL_AUTH_BYPASS_ENABLED: "true",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV]: "120001",
    },
  });
  assert.notEqual(delayedFixtureOptions, null);
  if (!delayedFixtureOptions?.fetchImpl) {
    throw new Error("Delayed local plan-first fixture fetch was not configured.");
  }

  const originalDateNow = Date.now;
  const originalSetTimeout = globalThis.setTimeout;
  let fakeNow = Date.UTC(2026, 6, 16, 12, 0, 0);
  let completeCallCount = 0;
  let scheduledFixtureDelayMs = 0;
  const delayedFixtureFetch = delayedFixtureOptions.fetchImpl;

  Date.now = () => fakeNow;
  globalThis.setTimeout = ((callback: (...args: unknown[]) => void, delay?: number) => {
    scheduledFixtureDelayMs = Number(delay ?? 0);
    fakeNow += scheduledFixtureDelayMs;
    queueMicrotask(callback);
    return 1 as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;
  try {
    const result = await buildReviewedAiGeneratedRunningPlanPreview(scenario.input, {
      aiPreview: {
        ...delayedFixtureOptions,
        generationLedger: { disabled: true },
        fetchImpl: async (url, init) => {
          completeCallCount += 1;
          return delayedFixtureFetch(url, init);
        },
      },
    });

    assert.equal(
      result.ok,
      true,
      "The opted-in local fixture response after 120 seconds must reach ordinary review.",
    );
    if (!result.ok) throw new Error(result.unavailable.error.message);
    assert.equal(scheduledFixtureDelayMs, 120_001);
    assert.equal(completeCallCount, 1, "Late completion must not trigger a second provider call.");
    assert.equal(result.draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.kind, "local_dev_fixture");
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.paidProviderCall, false);
    assert.equal(result.draft.aiGeneration.debug?.timeoutMs, 0);
    assert.ok(result.draft.aiGeneration.elapsedMs >= 120_001);
    assert.ok(result.draft.reviewToken.length >= 16);
    assert.equal(result.draft.reviewChecksum.length, 64);
    assert.equal(result.draft.reviewSafety.confirmPathImplemented, true);
    assert.equal(result.draft.reviewSafety.persisted, false);
  } finally {
    Date.now = originalDateNow;
    globalThis.setTimeout = originalSetTimeout;
  }

  const cancelled = await runCancelledFirstPlanRequest({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  assertUnavailableLifecycleResult(cancelled.result, {
    expectedReason: /cancelled/,
    expectedRequestPhase: "request_cancelled",
  });
  assert.equal(cancelled.callCount, 1);
  assert.equal(cancelled.result.metadata.generationTrace?.pipeline.finalOutcome, "cancelled");

  let providerFailureCallCount = 0;
  const providerFailure = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    inputKind: "structured_authoring",
    apiKey: "provider-failure-plan-first-proof",
    model: "provider-failure-plan-first-proof",
    generationLedger: { disabled: true },
    fetchImpl: async () => {
      providerFailureCallCount += 1;
      return jsonResponse(
        {
          id: "resp_provider_failure_plan_first",
          status: "failed",
          error: { message: "Injected provider failure." },
        },
        503,
      );
    },
  });
  assertUnavailableLifecycleResult(providerFailure, {
    expectedReason: /request_failed/,
    expectedRequestPhase: "request_failed",
  });
  assert.equal(providerFailureCallCount, 1);

  let incompleteCallCount = 0;
  const incomplete = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    inputKind: "structured_authoring",
    apiKey: "incomplete-plan-first-proof",
    model: "incomplete-plan-first-proof",
    generationLedger: { disabled: true },
    fetchImpl: async () => {
      incompleteCallCount += 1;
      return jsonResponse({
        ...completedBody,
        id: "resp_incomplete_plan_first",
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
      });
    },
  });
  assertUnavailableLifecycleResult(incomplete, {
    expectedReason: /incomplete_output/,
    expectedRequestPhase: "response_incomplete",
  });
  assert.equal(incompleteCallCount, 1);
  assert.equal(incomplete.metadata.responseId, "resp_incomplete_plan_first");
  assert.equal(incomplete.metadata.debug.responseIncompleteReason, "max_output_tokens");
}

async function runCancelledFirstPlanRequest(input: {
  authoringInput: Extract<
    ReturnType<typeof buildAiGeneratedRunningPlanAuthoringInput>,
    { ok: true }
  >["authoringInput"];
  today: string;
}) {
  const controller = new AbortController();
  let callCount = 0;
  let markFetchStarted!: () => void;
  const fetchStarted = new Promise<void>((resolve) => {
    markFetchStarted = resolve;
  });
  const resultPromise = generateAiFirstPlanDraftPreview({
    input: input.authoringInput,
    inputKind: "structured_authoring",
    apiKey: "cancelled-plan-first-proof",
    model: "cancelled-plan-first-proof",
    today: input.today,
    signal: controller.signal,
    generationLedger: { disabled: true },
    fetchImpl: async (_url, init) => {
      callCount += 1;
      markFetchStarted();
      const requestSignal = init?.signal;

      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener(
          "abort",
          () => reject(new DOMException("Injected cancellation.", "AbortError")),
          { once: true },
        );
      });
    },
  });

  await fetchStarted;
  controller.abort("runner_cancelled");

  return { result: await resultPromise, callCount };
}

function assertUnavailableLifecycleResult(
  result: Awaited<ReturnType<typeof generateAiFirstPlanDraftPreview>>,
  expected: {
    expectedReason: RegExp;
    expectedRequestPhase: string;
  },
) {
  assert.equal(result.ok, false, "Failure lifecycle must not create canonical review truth.");
  if (result.ok || result.reason === "structured_input_invalid") {
    throw new Error("Failure lifecycle unexpectedly produced or skipped provider truth.");
  }
  assert.match(result.metadata.unavailableReason, expected.expectedReason);
  assert.equal(result.metadata.debug.requestPhase, expected.expectedRequestPhase);
  assert.doesNotMatch(JSON.stringify(result), /reviewToken|reviewChecksum|persisted_plan_created/);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function validatePathologicalProviderNumberFailsBeforeReview() {
  const scenario = scenarios[0]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const fixtureResponse = await fixtureFetch("https://api.openai.com/v1/responses", {});
  const fixtureBody = (await fixtureResponse.json()) as { output_text: string };
  const pathologicalDraft = JSON.parse(fixtureBody.output_text) as {
    weeks: Array<{ days: Array<{ steps: Array<{ duration_seconds: number | null }> }> }>;
  };
  const firstStep = pathologicalDraft.weeks.flatMap((week) => week.days)[0]?.steps[0];
  assert.ok(firstStep, "Fixture must expose a provider step for pathological-number proof.");
  firstStep.duration_seconds = Number.MIN_VALUE;

  const result = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    inputKind: "structured_authoring",
    apiKey: "pathological-number-plan-first-proof",
    model: "pathological-number-plan-first-proof",
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    fetchImpl: async () =>
      openAiPlanFirstResponse("resp_pathological_plan_first", pathologicalDraft),
  });

  assert.equal(result.ok, false, "Pathological provider numbers must fail before review.");
  if (result.ok) throw new Error("Pathological provider number unexpectedly reached review.");
  assert.match(result.issues.join("\n"), /integer|greater than or equal to 5/i);
  assert.equal(JSON.stringify(result).includes("reviewToken"), false);
}

async function validateProviderStructuralBoundsFailBeforeReview() {
  const scenario = scenarios[0]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const fixtureResponse = await fixtureFetch("https://api.openai.com/v1/responses", {});
  const fixtureBody = (await fixtureResponse.json()) as { output_text: string };
  const providerDraft = JSON.parse(fixtureBody.output_text) as ProviderProofDraft;
  const repeatStep = providerDraft.weeks
    .flatMap((week) => week.days)
    .flatMap((day) => day.steps)
    .find((step) => step.repeat);
  assert.ok(repeatStep?.repeat, "Fixture must expose a Repeat for structural-bound proof.");

  const cases: Array<{
    name: string;
    mutate: (draft: ProviderProofDraft) => void;
    expectedIssue: RegExp;
  }> = [
    {
      name: "non-contiguous authored horizon",
      mutate: (draft) => {
        draft.weeks[1]!.week = 3;
      },
      expectedIssue: /Expected week 2|week_sequence_mismatch/i,
    },
    {
      name: "invalid calendar date",
      mutate: (draft) => {
        draft.weeks[0]!.days[0]!.date = "2026-02-30";
      },
      expectedIssue: /real ISO calendar date/i,
    },
    {
      name: "empty Repeat child",
      mutate: (draft) => {
        const step = findProviderRepeatStep(draft);
        step.repeat!.children[0]!.duration_seconds = null;
        step.repeat!.children[0]!.distance_meters = null;
      },
      expectedIssue: /Repeat child needs a duration_seconds or distance_meters/i,
    },
    {
      name: "expanded Repeat load",
      mutate: (draft) => {
        const step = findProviderRepeatStep(draft);
        step.repeat!.count = 100;
        step.repeat!.children[0]!.duration_seconds = null;
        step.repeat!.children[0]!.distance_meters = 500_000;
      },
      expectedIssue: /Expanded Repeat distance cannot exceed/i,
    },
  ];

  for (const scenarioCase of cases) {
    const invalidDraft = structuredClone(providerDraft);
    scenarioCase.mutate(invalidDraft);
    const result = await generateAiFirstPlanDraftPreview({
      input: resolved.authoringInput,
      inputKind: "structured_authoring",
      apiKey: `provider-structural-${scenarioCase.name}`,
      model: "provider-structural-bound-proof",
      today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
      fetchImpl: async () =>
        openAiPlanFirstResponse(`resp_provider_structural_${scenarioCase.name}`, invalidDraft),
    });

    assert.equal(result.ok, false, `${scenarioCase.name} must fail before review.`);
    if (result.ok) throw new Error(`${scenarioCase.name} unexpectedly reached review.`);
    assert.match(result.issues.join("\n"), scenarioCase.expectedIssue);
    assert.equal(JSON.stringify(result).includes("reviewToken"), false);
  }
}

type ProviderProofDraft = {
  weeks: Array<{
    week: number;
    days: Array<{
      date: string;
      steps: Array<{
        duration_seconds: number | null;
        repeat: {
          count: number;
          children: Array<{
            duration_seconds: number | null;
            distance_meters: number | null;
          }>;
        } | null;
      }>;
    }>;
  }>;
};

function findProviderRepeatStep(draft: ProviderProofDraft) {
  const step = draft.weeks
    .flatMap((week) => week.days)
    .flatMap((day) => day.steps)
    .find((candidate) => candidate.repeat);
  assert.ok(step?.repeat, "Fixture must expose a Repeat step.");
  return step;
}

async function validateInvalidProviderOutputFailsBeforeReview() {
  const scenario = scenarios[0]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const invalid = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    inputKind: "structured_authoring",
    apiKey: "invalid-plan-first-proof",
    model: "invalid-plan-first-proof",
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    fetchImpl: async () =>
      openAiPlanFirstResponse("resp_invalid_plan_first", {
        metadata: {
          goal: "Invalid plan",
          target_date: null,
          target_time: null,
          athlete: null,
          rest_days: [],
          long_run_day: null,
          note: null,
          warnings: [],
          assumptions: [],
        },
        weeks: [],
      }),
  });

  assert.equal(invalid.ok, false, "Invalid plan-first provider output must be unavailable.");
  if (invalid.ok) {
    throw new Error("Invalid plan-first output unexpectedly produced canonical review data.");
  }
  assert.equal(invalid.reason, "ai_authored_plan_first_unavailable");
  assert.match(
    invalid.issues.join("\n"),
    /too_small|weeks|schema|invalid/i,
    "Invalid plan-first output must expose bounded compiler diagnostics before review.",
  );
  assert.equal(JSON.stringify(invalid).includes("reviewToken"), false);
}

async function validateLocalDevFixtureAvailabilityGating() {
  const localDevFixtureEnv = {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
  };

  assert.equal(isAiGeneratedRunningPlanDevFixtureEnabled(localDevFixtureEnv), true);
  assert.equal(resolveAiGeneratedRunningPlanDevFixtureDelayMs(localDevFixtureEnv), 0);
  assert.equal(
    resolveAiGeneratedRunningPlanDevFixtureDelayMs({
      ...localDevFixtureEnv,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV]: "120001",
    }),
    120_001,
  );
  assert.throws(
    () =>
      resolveAiGeneratedRunningPlanDevFixtureDelayMs({
        ...localDevFixtureEnv,
        NEXT_PUBLIC_SUPABASE_URL: "https://hosted.example.supabase.co",
        [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV]: "120001",
      }),
    /requires loopback NEXT_PUBLIC_SUPABASE_URL/,
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      ...localDevFixtureEnv,
      HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "false",
    }),
    false,
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      ...localDevFixtureEnv,
      VERCEL: "1",
    }),
    false,
  );
  assert.equal(
    buildScenarioAiPreviewOptions(scenarios[0]!.input).model,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  );

  const envKeys = [
    "LOCAL_AUTH_BYPASS_ENABLED",
    "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
    "HITO_AI_GENERATED_PLAN_DEV_FIXTURE",
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
    "NEXT_PUBLIC_SUPABASE_URL",
    "VERCEL",
    "CI",
  ] as const;
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  try {
    process.env.LOCAL_AUTH_BYPASS_ENABLED = "true";
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = "/tmp/hito-local-auth.json";
    process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV];
    delete process.env.VERCEL;
    delete process.env.CI;

    let providerOverrideCallCount = 0;
    const result = await buildReviewedAiGeneratedRunningPlanPreview(scenarios[0]!.input, {
      aiPreview: {
        apiKey: "must-not-replace-local-fixture",
        model: "must-not-replace-local-fixture",
        signal: new AbortController().signal,
        fetchImpl: async () => {
          providerOverrideCallCount += 1;
          throw new Error("Local fixture provider transport was replaced.");
        },
      },
    });
    assert.equal(result.ok, true, "Request cancellation plumbing must preserve the local fixture.");
    if (!result.ok) throw new Error(result.unavailable.error.message);
    assert.equal(providerOverrideCallCount, 0);
    assert.equal(result.draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.kind, "local_dev_fixture");
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.paidProviderCall, false);
  } finally {
    for (const key of envKeys) {
      const value = previousEnv[key];
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function validateNoLegacyGeneratedPlanAuthoringSourceImports() {
  const checkedFiles = [
    "src/lib/ai-first-plan-draft-service.ts",
    "src/lib/ai-generated-running-plan.ts",
    "src/lib/ai-generated-running-plan-dev-fixture.ts",
    "src/lib/first-plan-actions.ts",
    "scripts/author-ai-first-plan-draft.ts",
  ];

  for (const file of checkedFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /repeat_unit|recovery_unit/,
      `${file} must not import or expose deleted generated-plan legacy authoring paths.`,
    );
  }
}

function buildScenarioAiPreviewOptions(input: RunningPlanPreviewActionInput) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const options = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: resolved.authoringInput,
    today: input.startDate ?? resolved.authoringInput.schedule.startDate,
    env: {
      LOCAL_AUTH_BYPASS_ENABLED: "true",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
    },
  });

  assert.notEqual(options, null, "Local plan-first fixture options must be available.");
  if (!options) throw new Error("Missing local plan-first fixture options.");

  return options;
}

async function assertReviewedDraftExactness({
  scenarioName,
  draft,
  expectedEndpointMeters,
  expectedGoalMeters,
  expectedFinalDate,
}: {
  scenarioName: string;
  draft: Extract<
    Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>,
    { ok: true }
  >["draft"];
  expectedGoalMeters?: number;
  expectedEndpointMeters?: number;
  expectedFinalDate?: string;
}) {
  const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
  assert.equal(canonicalPlan.source_kind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(canonicalPlan.goal.goal_type, "distance_goal");
  const resolvedExpectedGoalMeters = expectedGoalMeters ?? expectedEndpointMeters;
  if (resolvedExpectedGoalMeters != null) {
    assert.equal(canonicalPlan.goal.distance_meters, resolvedExpectedGoalMeters);
  }

  const endpointWorkout =
    expectedEndpointMeters == null
      ? null
      : ((expectedFinalDate
          ? canonicalPlan.planned_workouts.find(
              (workout) =>
                workout.date === expectedFinalDate &&
                plannedWorkoutEndpointDistanceMeters(workout) === expectedEndpointMeters,
            )
          : null) ??
        canonicalPlan.planned_workouts.find(
          (workout) =>
            workout.source_workout_type === "final_selected_distance_day" &&
            plannedWorkoutEndpointDistanceMeters(workout) === expectedEndpointMeters,
        ));
  if (expectedEndpointMeters != null) {
    assert.notEqual(
      endpointWorkout,
      undefined,
      `${scenarioName} must include selected-distance endpoint.`,
    );
    if (!endpointWorkout) throw new Error(`${scenarioName} missing selected-distance endpoint.`);
    assert.equal(
      plannedWorkoutEndpointDistanceMeters(endpointWorkout),
      expectedEndpointMeters,
      `${scenarioName} endpoint must preserve exact selected distance.`,
    );
    if (expectedFinalDate) {
      assert.equal(endpointWorkout.date, expectedFinalDate);
    }
  }

  const exactness = await validateRunningPlanReviewExactness({
    draft,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(
    exactness.ok,
    true,
    exactness.ok
      ? `${scenarioName} review token must validate.`
      : `${scenarioName} review token failed: ${exactness.message}`,
  );

  const decoded = await validateSelfContainedRunningPlanReviewToken({
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(
    decoded.ok,
    true,
    decoded.ok
      ? `${scenarioName} self-contained review token must validate.`
      : `${scenarioName} self-contained review token failed: ${decoded.message}`,
  );
  if (!decoded.ok) throw new Error(`${scenarioName} decoded token failed.`);
  assert.deepEqual(decoded.draft.calendarRows, draft.calendarRows);

  return canonicalPlan;
}

function plannedWorkoutEndpointDistanceMeters(
  workout: ReturnType<typeof buildRunningPlanCanonicalPlan>["planned_workouts"][number],
) {
  return selectedDistanceEndpointMainDistanceMeters({
    endpointKind: workout.source_workout_type,
    segments: workout.segments,
  });
}

function assertPlanFirstGuidanceAndRepeatShape({
  scenarioName,
  canonicalPlan,
}: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
}) {
  const serialized = JSON.stringify(canonicalPlan);
  const repeatSegments = canonicalPlan.planned_workouts.flatMap((workout) =>
    workout.segments.filter((segment) => segment.prescription?.mode === "repeats"),
  );
  assert.ok(repeatSegments.length > 0, `${scenarioName} must preserve authored repeat structure.`);
  assert.ok(
    repeatSegments.some(
      (segment) =>
        segment.prescription?.mode === "repeats" &&
        (segment.prescription.children ?? []).length >= 2,
    ),
    `${scenarioName} must preserve ordered repeat children.`,
  );
  assert.equal(
    repeatSegments.some((segment) => Boolean(segment.target)),
    false,
    `${scenarioName} repeat parents must stay structural-only.`,
  );
  assert.doesNotMatch(serialized, /repeat_unit|recovery_unit/);
  assert.doesNotMatch(serialized, /\b(?:1[2-9]\d|2\d\d)\s*bpm\b/i);
  assert.doesNotMatch(serialized, /Mock AI|Local QA\/dev AI fixture/i);
  assert.match(
    serialized,
    /ai_authored_effort_guidance|ai_authored_plan_guidance|HR-zone guidance|Pace guidance/i,
    `${scenarioName} must preserve AI-authored plan guidance as compiled target/readback metadata.`,
  );
}

function assertNoLegacyOrDebugReadback({
  scenarioName,
  value,
}: {
  scenarioName: string;
  value: unknown;
}) {
  assert.doesNotMatch(
    JSON.stringify(value),
    /repeat_unit|recovery_unit/,
    `${scenarioName} readback must not preserve deleted generated-plan legacy vocabulary.`,
  );
}

function openAiPlanFirstResponse(responseId: string, draft: unknown) {
  return new Response(
    JSON.stringify({
      id: responseId,
      status: "completed",
      output_text: JSON.stringify(draft),
      usage: {
        input_tokens: 100,
        output_tokens: 100,
        total_tokens: 200,
      },
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}

void (null as AiAuthoredPlanFirstDraft | null);
