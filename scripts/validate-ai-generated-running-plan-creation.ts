import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
  AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
  AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  isAiGeneratedRunningPlanDevFixtureEnabled,
  resolveAiGeneratedRunningPlanDevFixtureDelayMs,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import {
  attachOutputToAiPlanGenerationLedgerTrace,
  createAiPlanGenerationLedgerTrace,
  updateAiPlanGenerationLedgerTrace,
} from "../src/lib/ai-plan-generation-ledger";
import {
  queryLocalRuntimeEvents,
  readLocalRuntimeArtifact,
} from "../src/lib/local-runtime-observability";
import {
  AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  compileAiAuthoredPlanFirstDraft,
} from "../src/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN,
  aiAuthoredPlanFirstCompilerDraftSchema,
  buildAiAuthoredPlanFirstPrompt,
  type AiAuthoredPlanFirstCompilerDraft,
  type AiAuthoredPlanFirstCompilerUnit,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildAiGeneratedRunningPlanPreview as buildAiGeneratedRunningPlanPreviewRuntime,
  buildAiGeneratedRunningPlanAuthoringInput as buildAiGeneratedRunningPlanAuthoringInputRuntime,
} from "../src/lib/ai-generated-running-plan";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import { buildReviewedFirstPlanImportedSeed } from "../src/lib/active-plan-persistence";
import {
  buildReviewedAiGeneratedRunningPlanPreview as buildReviewedAiGeneratedRunningPlanPreviewRuntime,
  confirmRunningPlanDraftForUser,
  runningPlanConfirmInputSchema,
  runningPlanPreviewInputSchema,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  buildRunningPlanCanonicalPlan,
  buildRunningPlanPersistenceMetadata,
  validateRunningPlanReviewExactness,
  validateSelfContainedRunningPlanReviewToken,
} from "../src/lib/running-plan-engine-review";
import { base64UrlDecodeUtf8 } from "../src/lib/review-token-signing";
import { selectedDistanceEndpointMainDistanceMeters } from "../src/lib/plan-creation-engine";
import { GENERATED_PLAN_RUNNER_COMMENT_MAX_LENGTH } from "../src/lib/structured-plan-authoring-schema";
import { addDaysIso } from "../src/lib/training";
import { validateGeneratedLongRunExecutionPolicyContract } from "./long-run-execution-policy-proof";
import {
  parsePositiveIntegerOption,
  resolveDirectCanaryTimeoutPolicy,
} from "./ai-first-plan-draft-ops/cli";
import { validatePlanFirstHeartRateTargetContract } from "./plan-first-heart-rate-target-proof";
import { validatePlanFirstProviderRepresentationContract } from "./plan-first-provider-representation-proof";
import {
  buildProofPersonalRunnerProfileSnapshot,
  buildProofRunnerProfileSnapshot,
} from "./runner-profile-snapshot-proof-helpers";

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
} as const;

const scenarios = [
  {
    name: "10K no benchmark",
    input: {
      ...baseInput,
      runnerLevel: "sometimes_runs",
      planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
    },
    expectedEndpointMeters: 10_000,
  },
  {
    name: "Half Marathon target time",
    input: {
      ...baseInput,
      startDate: "2026-07-02",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2026-11-26",
        targetFinishTime: "2:00:00",
      },
    },
    expectedEndpointMeters: 21_100,
    expectedFinalDate: "2026-11-26",
    expectedNonRepeatTempo: true,
  },
  {
    name: "Marathon target time",
    input: {
      ...baseInput,
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
  expectedNonRepeatTempo?: boolean;
}>;

function buildAiGeneratedRunningPlanAuthoringInput(
  input: RunningPlanPreviewActionInput,
  profileSnapshot = buildProofRunnerProfileSnapshot(input),
) {
  return buildAiGeneratedRunningPlanAuthoringInputRuntime(input, profileSnapshot);
}

function buildAiGeneratedRunningPlanPreview(
  input: RunningPlanPreviewActionInput,
  options: Parameters<typeof buildAiGeneratedRunningPlanPreviewRuntime>[1] = {},
) {
  return buildAiGeneratedRunningPlanPreviewRuntime(input, {
    ...options,
    runnerProfileSnapshot: options.runnerProfileSnapshot ?? buildProofRunnerProfileSnapshot(input),
  });
}

function buildReviewedAiGeneratedRunningPlanPreview(
  input: RunningPlanPreviewActionInput,
  options: Parameters<typeof buildReviewedAiGeneratedRunningPlanPreviewRuntime>[1] = {},
) {
  return buildReviewedAiGeneratedRunningPlanPreviewRuntime(input, {
    ...options,
    runnerProfileSnapshot: options.runnerProfileSnapshot ?? buildProofRunnerProfileSnapshot(input),
  });
}

validateGeneratedLongRunExecutionPolicyContract();
validateDirectLiveCanaryTimeoutPolicy();
validatePlanFirstHeartRateTargetContract();
await validatePlanFirstPreviewScenarios();
await validatePlanFirstAuthoringAuthority();
await validateRunnerPlanCommentContract();
await validateFaithfulPlanFirstAtomization();
validateDistanceFirstInputTruth();
await validateFirstPlanGenerationLifecycle();
await validateTypedPlanFirstFailureOutcomes();
await validatePlanFirstProviderRepresentationContract();
await validateLocalDevFixtureAvailabilityGating();
await validateLocalGenerationIncidentTrail();
validateNoLegacyGeneratedPlanAuthoringSourceImports();

console.log("AI-generated plan-first creation contract checks passed.", {
  scenarios: scenarios.map((scenario) => scenario.name),
  sourceKind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  contractMode: "plan_first",
});

function validateDirectLiveCanaryTimeoutPolicy() {
  assert.throws(
    () => resolveDirectCanaryTimeoutPolicy({}, "live"),
    /--live requires an explicit --timeout-ms value/,
    "A paid direct canary must never inherit an implicit client deadline.",
  );
  assert.deepEqual(resolveDirectCanaryTimeoutPolicy({ "timeout-ms": "0" }, "live"), {
    timeoutMs: 0,
    deadline: "none",
    source: "explicit_cli",
  });
  assert.deepEqual(resolveDirectCanaryTimeoutPolicy({ "timeout-ms": "120000" }, "live"), {
    timeoutMs: 120_000,
    deadline: "bounded",
    source: "explicit_cli",
  });
  assert.deepEqual(resolveDirectCanaryTimeoutPolicy({}, "mock"), {
    timeoutMs: 45_000,
    deadline: "bounded",
    source: "mock_default",
  });
  for (const timeoutMs of ["0junk", "1.5", "-1", "2147483648"]) {
    assert.throws(
      () => resolveDirectCanaryTimeoutPolicy({ "timeout-ms": timeoutMs }, "live"),
      /--timeout-ms must be an integer between 0 and 2147483647/,
      `The direct canary must reject an unsafe timeout value: ${timeoutMs}.`,
    );
  }
  assert.throws(
    () => parsePositiveIntegerOption("0"),
    /--max-output-tokens must be a positive integer/,
    "Allowing a no-deadline timeout must not weaken the output-token bound.",
  );
  for (const maxOutputTokens of ["1.5", "12000junk"]) {
    assert.throws(
      () => parsePositiveIntegerOption(maxOutputTokens),
      /--max-output-tokens must be a positive integer/,
      `The output-token bound must reject a malformed integer: ${maxOutputTokens}.`,
    );
  }
}

async function validateRunnerPlanCommentContract() {
  const scenario = scenarios[1]!;
  const runnerCommentCanary = `private-plan-context-${crypto.randomUUID()}`;
  const validInput = {
    ...scenario.input,
    runnerComment: `  ${runnerCommentCanary}  `,
  } satisfies RunningPlanPreviewActionInput;
  const parsedValidInput = runningPlanPreviewInputSchema.safeParse(validInput);
  assert.equal(parsedValidInput.success, true);
  if (!parsedValidInput.success) throw new Error(parsedValidInput.error.message);
  assert.equal(parsedValidInput.data.runnerComment, runnerCommentCanary);

  const validAuthoring = buildAiGeneratedRunningPlanAuthoringInput(parsedValidInput.data);
  assert.equal(validAuthoring.ok, true, validAuthoring.ok ? "" : validAuthoring.message);
  if (!validAuthoring.ok) throw new Error(validAuthoring.message);
  assert.equal(validAuthoring.authoringInput.requestContext?.runnerComment, runnerCommentCanary);
  assert.equal("runnerComment" in validAuthoring.normalizedInputSummary, false);

  const validPrompt = buildAiAuthoredPlanFirstPrompt({
    authoringInput: validAuthoring.authoringInput,
    today: scenario.input.startDate,
  });
  const validProviderContext = JSON.parse(validPrompt.userPrompt) as {
    runnerFacts: { runner: { plan_request_comment?: string } };
  };
  assert.equal(validProviderContext.runnerFacts.runner.plan_request_comment, runnerCommentCanary);
  assert.match(validPrompt.systemPrompt, /informational training history or current context/i);
  assert.match(validPrompt.systemPrompt, /never overrides the exact goal/i);

  const absentAuthoring = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  const blankInput = runningPlanPreviewInputSchema.safeParse({
    ...scenario.input,
    runnerComment: " \n\t ",
  });
  assert.equal(absentAuthoring.ok, true, absentAuthoring.ok ? "" : absentAuthoring.message);
  assert.equal(blankInput.success, true);
  if (!absentAuthoring.ok || !blankInput.success) {
    throw new Error("Blank runner-comment proof could not normalize.");
  }
  assert.equal(blankInput.data.runnerComment, undefined);
  const blankAuthoring = buildAiGeneratedRunningPlanAuthoringInput(blankInput.data);
  assert.equal(blankAuthoring.ok, true, blankAuthoring.ok ? "" : blankAuthoring.message);
  if (!blankAuthoring.ok) throw new Error(blankAuthoring.message);
  assert.deepEqual(blankAuthoring.authoringInput, absentAuthoring.authoringInput);
  assert.deepEqual(blankAuthoring.normalizedInputSummary, absentAuthoring.normalizedInputSummary);
  assert.equal(
    buildAiAuthoredPlanFirstPrompt({
      authoringInput: blankAuthoring.authoringInput,
      today: scenario.input.startDate,
    }).userPrompt,
    buildAiAuthoredPlanFirstPrompt({
      authoringInput: absentAuthoring.authoringInput,
      today: scenario.input.startDate,
    }).userPrompt,
  );

  const excessiveInput = {
    ...scenario.input,
    runnerComment: "x".repeat(GENERATED_PLAN_RUNNER_COMMENT_MAX_LENGTH + 1),
  } satisfies RunningPlanPreviewActionInput;
  const excessiveSchemaResult = runningPlanPreviewInputSchema.safeParse(excessiveInput);
  assert.equal(excessiveSchemaResult.success, false);
  if (!excessiveSchemaResult.success) {
    assert.match(
      excessiveSchemaResult.error.issues.map((issue) => issue.message).join(" | "),
      new RegExp(`${GENERATED_PLAN_RUNNER_COMMENT_MAX_LENGTH} characters or fewer`, "i"),
    );
  }
  const excessiveAuthoring = buildAiGeneratedRunningPlanAuthoringInput(excessiveInput);
  assert.equal(excessiveAuthoring.ok, false);
  if (!excessiveAuthoring.ok) {
    assert.equal(excessiveAuthoring.reason, "structured_input_invalid");
    assert.match(
      excessiveAuthoring.message,
      new RegExp(`${GENERATED_PLAN_RUNNER_COMMENT_MAX_LENGTH} characters or fewer`, "i"),
    );
  }
  assert.equal(
    runningPlanPreviewInputSchema.safeParse({
      ...scenario.input,
      runnerComment: 42,
    }).success,
    false,
  );

  const artifactRoot = await mkdtemp(join(tmpdir(), "hito-runner-plan-comment-"));
  try {
    const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
      authoringInput: validAuthoring.authoringInput,
      today: scenario.input.startDate,
    });
    let dispatchedRequestBody = "";
    const providerResult = await generateAiFirstPlanDraftPreview({
      input: validAuthoring.authoringInput,
      apiKey: "synthetic-runner-comment-provider-proof",
      model: "gpt-5-runner-comment-provider-proof",
      today: scenario.input.startDate,
      generationLedger: {
        forceArtifactWrite: true,
        artifactRoot,
        runtimeUrl: "http://127.0.0.1:3000",
      },
      fetchImpl: async (url, init) => {
        dispatchedRequestBody = String(init?.body ?? "");
        return fixtureFetch(url, init);
      },
    });
    assert.equal(providerResult.ok, true, providerResult.ok ? "" : providerResult.message);
    if (!providerResult.ok) throw new Error(providerResult.message);
    assert.equal(dispatchedRequestBody.split(runnerCommentCanary).length - 1, 1);
    assert.equal("authoringInput" in providerResult, false);
    assert.equal(JSON.stringify(providerResult).includes(runnerCommentCanary), false);

    const generationId = providerResult.metadata.generationTrace?.generationId;
    assert.ok(generationId);
    const events = await queryLocalRuntimeEvents({ root: artifactRoot, generationId });
    assert.equal(JSON.stringify(events).includes(runnerCommentCanary), false);
    const transcriptEvent = events.find(
      (event) => event.outcomeCode === "provider_transcript_completed",
    );
    assert.ok(transcriptEvent?.rawArtifactPath);
    const transcript = await readLocalRuntimeArtifact({
      root: artifactRoot,
      rawArtifactPath: transcriptEvent!.rawArtifactPath!,
    });
    assert.equal(transcript.contents.includes(runnerCommentCanary), false);
    assert.match(transcript.contents, /\[REDACTED_RUNNER_CONTEXT\]/);

    const reviewed = await buildReviewedAiGeneratedRunningPlanPreview(parsedValidInput.data, {
      aiPreview: {
        apiKey: "synthetic-runner-comment-review-proof",
        model: "gpt-5-runner-comment-review-proof",
        today: scenario.input.startDate,
        generationLedger: { disabled: true },
        fetchImpl: buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
          authoringInput: validAuthoring.authoringInput,
          today: scenario.input.startDate,
        }),
      },
    });
    assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
    if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
    assert.equal("runnerComment" in reviewed.draft.previewInput, false);
    assert.equal("runnerComment" in reviewed.draft.normalizedInputSummary, false);
    assert.equal(JSON.stringify(reviewed.draft).includes(runnerCommentCanary), false);

    const encodedReviewEnvelope = reviewed.draft.reviewToken.split(".")[1];
    assert.ok(encodedReviewEnvelope);
    const decodedReviewEnvelope = base64UrlDecodeUtf8(encodedReviewEnvelope!);
    assert.equal(decodedReviewEnvelope.includes(runnerCommentCanary), false);
    assert.doesNotMatch(
      decodedReviewEnvelope,
      /"runnerComment"|"requestContext"|"plan_request_comment"/,
    );
    const exactness = await validateSelfContainedRunningPlanReviewToken({
      reviewToken: reviewed.draft.reviewToken,
      reviewChecksum: reviewed.draft.reviewChecksum,
    });
    assert.equal(exactness.ok, true);
    if (!exactness.ok) throw new Error(exactness.message);
    assert.equal(JSON.stringify(exactness.reviewPayload).includes(runnerCommentCanary), false);

    const persistenceMetadata = buildRunningPlanPersistenceMetadata({
      draft: reviewed.draft,
      canonicalPlan: buildRunningPlanCanonicalPlan(reviewed.draft),
      reviewChecksum: reviewed.draft.reviewChecksum,
    });
    assert.equal(JSON.stringify(persistenceMetadata).includes(runnerCommentCanary), false);
    assert.equal(
      runningPlanConfirmInputSchema.safeParse({
        previewInput: {
          ...reviewed.draft.previewInput,
          runnerComment: runnerCommentCanary,
        },
        sourceKind: reviewed.draft.sourceKind,
        reviewToken: reviewed.draft.reviewToken,
        reviewChecksum: reviewed.draft.reviewChecksum,
      }).success,
      false,
    );

    const echoFixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
      authoringInput: validAuthoring.authoringInput,
      today: scenario.input.startDate,
    });
    const echoFixtureResponse = await echoFixtureFetch("https://api.openai.com/v1/responses", {});
    const echoFixtureBody = (await echoFixtureResponse.json()) as {
      id: string;
      status: string;
      output_text: string;
      usage: unknown;
    };
    const echoedDraft = parseFixtureProviderDraft(echoFixtureBody.output_text);
    const transientCompilerInput = compileAiAuthoredPlanFirstDraft({
      draft: echoedDraft,
      authoringInput: validAuthoring.authoringInput,
    });
    assert.equal(transientCompilerInput.ok, false);
    if (!transientCompilerInput.ok) {
      assert.equal(
        transientCompilerInput.reason,
        "ai_authored_plan_first_transient_context_after_dispatch",
      );
    }
    echoedDraft.workouts[0]!.cue = runnerCommentCanary;
    const echoedResult = await generateAiFirstPlanDraftPreview({
      input: validAuthoring.authoringInput,
      apiKey: "synthetic-runner-comment-echo-proof",
      model: "gpt-5-runner-comment-echo-proof",
      today: scenario.input.startDate,
      generationLedger: { disabled: true },
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            ...echoFixtureBody,
            id: "synthetic-runner-comment-echo",
            output_text: JSON.stringify(echoedDraft),
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    });
    assert.equal(echoedResult.ok, false);
    if (echoedResult.ok || echoedResult.reason === "structured_input_invalid") {
      throw new Error("Echoed transient runner context unexpectedly reached a canonical draft.");
    }
    assert.equal(
      echoedResult.metadata.unavailableReason,
      "ai_authored_plan_first_runner_context_echoed",
    );
    assert.equal("authoringInput" in echoedResult, false);
    assert.equal("reviewToken" in echoedResult, false);
    assert.equal(JSON.stringify(echoedResult).includes(runnerCommentCanary), false);
    const echoedPreview = await buildReviewedAiGeneratedRunningPlanPreview(parsedValidInput.data, {
      aiPreview: {
        apiKey: "synthetic-runner-comment-echo-preview-proof",
        model: "gpt-5-runner-comment-echo-preview-proof",
        today: scenario.input.startDate,
        generationLedger: { disabled: true },
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              ...echoFixtureBody,
              id: "synthetic-runner-comment-echo-preview",
              output_text: JSON.stringify(echoedDraft),
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      },
    });
    assert.equal(echoedPreview.ok, false);
    if (echoedPreview.ok) {
      throw new Error("Echoed transient runner context unexpectedly reached signed review.");
    }
    assert.equal(echoedPreview.unavailable.previewOutcome, "malformed_provider_output");
    assert.equal(JSON.stringify(echoedPreview).includes(runnerCommentCanary), false);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
}

async function validatePlanFirstPreviewScenarios() {
  for (const scenario of scenarios) {
    const result = await buildReviewedAiGeneratedRunningPlanPreview(scenario.input, {
      aiPreview: buildScenarioAiPreviewOptions(scenario.input, {
        nonRepeatTempo: "expectedNonRepeatTempo" in scenario,
      }),
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
    assertPreviewTargetTruth({
      scenarioName: scenario.name,
      canonicalPlan,
      calendarRows: result.draft.calendarRows,
    });
    if (scenario.name === "10K no benchmark") {
      const runWalkRow = result.draft.calendarRows.find((row) => row.title === "Run/Walk");
      assert.ok(runWalkRow, "Beginner fixture must expose its authored Run/Walk contact.");
      assert.equal(
        runWalkRow.workoutDayKind,
        "recovery",
        "Run/Walk adaptation must not be reclassified as intervals because it uses Repeat children.",
      );
    }
    assert.deepEqual(
      result.draft.workoutDocuments,
      buildImportedPlanSeed(canonicalPlan).workouts,
      `${scenario.name} reviewed preview must return the canonical backend WorkoutDocument read model.`,
    );
    if ("expectedNonRepeatTempo" in scenario && scenario.expectedNonRepeatTempo) {
      assert.equal(result.draft.aiGeneration.generationTrace?.provider.kind, "local_dev_fixture");
      assert.equal(result.draft.aiGeneration.generationTrace?.provider.paidProviderCall, false);
      assertNonRepeatTempoFixtureReviewTruth({
        scenarioName: scenario.name,
        canonicalPlan,
        calendarRows: result.draft.calendarRows,
      });
    }
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

async function validatePlanFirstAuthoringAuthority() {
  const ambitiousShortHorizonInput = {
    ...baseInput,
    benchmark: { kind: "unknown" as const },
    startDate: "2026-07-06",
    planGoalIntent: {
      distance: { kind: "preset" as const, preset: "Marathon" as const },
      targetDate: "2026-07-12",
      targetFinishTime: "1:30:00",
    },
  };
  const authoring = buildAiGeneratedRunningPlanAuthoringInput(ambitiousShortHorizonInput);
  assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
  if (!authoring.ok) throw new Error(authoring.message);
  assert.equal(authoring.normalizedInputSummary.loadContext, "ai_authored");

  const missingAcceptedBaseline = buildAiGeneratedRunningPlanAuthoringInputRuntime(
    ambitiousShortHorizonInput,
    null,
  );
  assert.deepEqual(missingAcceptedBaseline, {
    ok: false,
    reason: "structured_input_invalid",
    message: "Save and accept the runner baseline before creating a generated plan.",
  });

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: authoring.authoringInput,
    today: ambitiousShortHorizonInput.startDate,
    env: {
      LOCAL_AUTH_BYPASS_ENABLED: "true",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]: "true",
      [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "qa_fixture",
    },
  });
  let providerCalls = 0;
  const reviewed = await buildReviewedAiGeneratedRunningPlanPreview(ambitiousShortHorizonInput, {
    aiPreview: {
      apiKey: "local-qa-dev-ai-generated-plan-fixture",
      model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
      today: ambitiousShortHorizonInput.startDate,
      generationLedger: { disabled: true },
      fetchImpl: async (url, init) => {
        providerCalls += 1;
        return fixtureFetch(url, init);
      },
    },
  });
  assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
  assert.equal(providerCalls, 1, "Every structurally valid future goal must reach AI authorship.");

  let invalidProviderCalls = 0;
  const invalid = await buildReviewedAiGeneratedRunningPlanPreview(
    {
      ...ambitiousShortHorizonInput,
      planGoalIntent: {
        ...ambitiousShortHorizonInput.planGoalIntent,
        targetDate: ambitiousShortHorizonInput.startDate,
      },
    },
    {
      aiPreview: {
        apiKey: "must-not-call-provider",
        fetchImpl: async () => {
          invalidProviderCalls += 1;
          throw new Error("Structurally invalid input reached provider.");
        },
      },
    },
  );
  assert.equal(invalid.ok, false);
  if (invalid.ok) throw new Error("Same-day target unexpectedly reached review.");
  assert.equal(invalid.unavailable.previewOutcome, "invalid_structural_input");
  assert.equal(invalid.unavailable.debug.generationTrace?.provider.kind, "not_started");
  assert.equal(invalid.unavailable.debug.generationTrace?.pipeline.finalOutcome, "rejected");
  assert.equal(
    invalid.unavailable.debug.generationTrace?.pipeline.unavailableReason,
    "invalid_plan_goal_intent",
  );
  assert.equal(invalidProviderCalls, 0);

  const flexibleAvailabilityInput = {
    ...ambitiousShortHorizonInput,
    daysPerWeek: null,
    fixedRestDays: null,
  };
  const flexibleAvailability = await buildReviewedAiGeneratedRunningPlanPreview(
    flexibleAvailabilityInput,
    {
      aiPreview: buildScenarioAiPreviewOptions(flexibleAvailabilityInput),
    },
  );
  assert.equal(
    flexibleAvailability.ok,
    true,
    flexibleAvailability.ok ? "" : flexibleAvailability.unavailable.error.message,
  );
  if (!flexibleAvailability.ok) throw new Error(flexibleAvailability.unavailable.error.message);
  assert.equal(flexibleAvailability.draft.normalizedInputSummary.daysPerWeek, null);
  assert.equal(flexibleAvailability.draft.normalizedInputSummary.fixedRestDays, null);
  assert.equal(invalidProviderCalls, 0);
}

async function validateFaithfulPlanFirstAtomization() {
  const paceInput = {
    ...scenarios[0]!.input,
    benchmark: { kind: "recent_5k_pace" as const, recent5kPace: "5:30/km" },
  };
  const personalProfileSnapshot = buildProofPersonalRunnerProfileSnapshot(paceInput);
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(paceInput, personalProfileSnapshot);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const heartRateZone = resolved.authoringInput.runnerFacts.heartRateProfile.zones.find(
    (candidate) => candidate.reference === "Z2",
  );
  assert.ok(heartRateZone, "Projection proof requires the accepted Z2 snapshot.");
  const paceTarget = (command: string): AiAuthoredPlanFirstCompilerUnit["target"] => ({
    primary_execution_mode: "pace",
    command,
  });
  const heartRateTarget = (): AiAuthoredPlanFirstCompilerUnit["target"] => ({
    primary_execution_mode: "heart_rate",
    band_reference: "Z2",
    command: `${heartRateZone!.minBpm}-${heartRateZone!.maxBpm} bpm`,
  });
  const unit = (
    segmentType: "warmup" | "main",
    label: string,
    prescription:
      | { mode: "time"; duration_min: number }
      | { mode: "distance"; distance_km: number },
    target: AiAuthoredPlanFirstCompilerUnit["target"],
  ) => ({
    kind: "unit" as const,
    segment_type: segmentType,
    label,
    cue: null,
    prescription,
    target,
  });

  const draft = {
    workouts: [
      {
        date: "2026-06-08",
        phase: "Specific",
        workout_identity: "race_pace_session",
        title: "Race pace rehearsal",
        cue: "Execute the authored race-pace structure.",
        sections: [
          unit("main", "Race pace", { mode: "time", duration_min: 20 }, paceTarget("5:00-5:10/km")),
        ],
      },
      {
        date: "2026-06-11",
        phase: "Build",
        workout_identity: "distance_intervals",
        title: "Ordered interval sequence",
        cue: "Preserve the authored order.",
        sections: [
          {
            kind: "repeat",
            segment_type: "interval_block",
            label: "Ordered set",
            cue: null,
            rounds: 3,
            children: [
              {
                role: "run",
                label: "Settle",
                cue: null,
                prescription: { mode: "time", duration_min: 1 },
                target: paceTarget("5:50-6:00/km"),
              },
              {
                role: "work",
                label: "Work",
                cue: null,
                prescription: { mode: "time", duration_min: 2 },
                target: paceTarget("4:50/km"),
              },
              {
                role: "recover",
                label: "Float",
                cue: null,
                prescription: { mode: "time", duration_min: 1 },
                target: paceTarget("6:45-7:15/km"),
              },
              {
                role: "finish",
                label: "Finish",
                cue: null,
                prescription: { mode: "time", duration_min: 0.5 },
                target: paceTarget("5:30-5:40/km"),
              },
            ],
          },
        ],
      },
      {
        date: "2026-06-12",
        phase: "Endurance",
        workout_identity: "long_aerobic_run",
        title: "Long aerobic run",
        cue: "Complete the authored aerobic duration.",
        sections: [unit("main", "Main", { mode: "time", duration_min: 60 }, heartRateTarget())],
      },
      {
        date: "2026-06-14",
        phase: "Terrain",
        workout_identity: "technical_trail_easy",
        title: "Technical trail easy",
        cue: "Follow the authored trail structure.",
        sections: [
          unit("main", "Trail", { mode: "time", duration_min: 40 }, paceTarget("6:10-6:40/km")),
        ],
      },
    ],
    endpoint: {
      date: "2026-06-15",
      phase: "Goal",
      workout_identity: "selected_distance_completion_or_checkpoint",
      title: "10K endpoint",
      cue: "Complete the selected distance.",
      sections: [
        unit(
          "main",
          "Selected distance",
          { mode: "distance", distance_km: 10 },
          paceTarget("5:20-5:30/km"),
        ),
      ],
    },
  } satisfies AiAuthoredPlanFirstCompilerDraft;

  const compiled = compileAiAuthoredPlanFirstDraft({
    draft,
    authoringInput: resolved.authoringInput,
  });
  assert.equal(compiled.ok, true, compiled.ok ? "" : JSON.stringify(compiled.issues));
  if (!compiled.ok) throw new Error(JSON.stringify(compiled.issues));

  const intervalWorkout = compiled.canonicalPlan.planned_workouts.find(
    (workout) => workout.workout_identity === "distance_intervals",
  );
  const readbackRepeat = buildImportedPlanSeed(compiled.canonicalPlan)
    .workouts.find((workout) => workout.sourceWorkoutId === intervalWorkout?.workout_id)
    ?.steps.find((step) => step.prescription?.mode === "repeats");
  assert.deepEqual(
    readbackRepeat?.children?.map((child) => child.type),
    ["run", "work", "recovery", "finish"],
    "WorkoutDocument readback must preserve the canonical run child and ordered Repeat roles.",
  );
  assert.equal(
    selectedDistanceEndpointMainDistanceMeters({
      endpointKind: compiled.canonicalPlan.planned_workouts.at(-1)?.source_workout_type,
      segments: compiled.canonicalPlan.planned_workouts.at(-1)?.segments ?? [],
    }),
    10_000,
  );

  const reviewedProjection = await buildReviewedAiGeneratedRunningPlanPreview(paceInput, {
    runnerProfileSnapshot: personalProfileSnapshot,
    aiPreview: {
      apiKey: "projection-contract-proof",
      today: paceInput.startDate,
      fetchImpl: async () => openAiPlanFirstResponse("resp-faithful-projection", draft),
    },
  });
  assert.equal(
    reviewedProjection.ok,
    true,
    reviewedProjection.ok ? "" : JSON.stringify(reviewedProjection.unavailable),
  );
  if (!reviewedProjection.ok) throw new Error(reviewedProjection.unavailable.error.message);
  assert.ok(reviewedProjection.draft.calendarRows.some((row) => row.workoutDayKind === "race"));
  assert.ok(reviewedProjection.draft.calendarRows.some((row) => row.workoutDayKind === "trail"));

  const arbitraryTitleDraft = structuredClone(draft);
  arbitraryTitleDraft.workouts[1]!.title = "Coach Surprise Session";
  const arbitraryTitleResult = compileAiAuthoredPlanFirstDraft({
    draft: arbitraryTitleDraft,
    authoringInput: resolved.authoringInput,
  });
  assert.equal(arbitraryTitleResult.ok, true);
  if (!arbitraryTitleResult.ok) throw new Error(JSON.stringify(arbitraryTitleResult.issues));
  assert.equal(
    arbitraryTitleResult.canonicalPlan.planned_workouts.find(
      (workout) => workout.title === "Coach Surprise Session",
    )?.workout_identity,
    "distance_intervals",
  );

  const unknownIdentityDraft = structuredClone(draft) as unknown as {
    workouts: Array<{ workout_identity: string }>;
  };
  unknownIdentityDraft.workouts[1]!.workout_identity = "coach_surprise_session";
  const unknownIdentityResult = compileAiAuthoredPlanFirstDraft({
    draft: unknownIdentityDraft,
    authoringInput: resolved.authoringInput,
  });
  assert.equal(unknownIdentityResult.ok, false);
  if (unknownIdentityResult.ok) throw new Error("Unknown identity unexpectedly compiled.");
  assert.match(JSON.stringify(unknownIdentityResult.issues), /workout_identity_invalid/);

  const targetInput = {
    ...paceInput,
    planGoalIntent: {
      distance: { kind: "preset" as const, preset: "10K" as const },
      targetFinishTime: "1:10:00",
    },
  };
  const targetResolved = buildAiGeneratedRunningPlanAuthoringInput(
    targetInput,
    buildProofPersonalRunnerProfileSnapshot(targetInput),
  );
  assert.equal(targetResolved.ok, true);
  if (!targetResolved.ok) throw new Error(targetResolved.message);
  const targetResult = compileAiAuthoredPlanFirstDraft({
    draft,
    authoringInput: targetResolved.authoringInput,
  });
  assert.equal(targetResult.ok, true);
  if (!targetResult.ok) throw new Error(JSON.stringify(targetResult.issues));
  assert.ok(
    targetResult.canonicalPlan.planned_workouts.every(
      (workout) => workout.goal_context?.target_time === "1:10:00",
    ),
  );
}

function validateDistanceFirstInputTruth() {
  const missingDistance = runningPlanPreviewInputSchema.safeParse({
    ...baseInput,
    planGoalIntent: { targetDate: "2026-10-04" },
  });
  assert.equal(
    missingDistance.success,
    false,
    "Generated-plan input must reject a missing planGoalIntent.distance before provider work.",
  );

  const exactDistance = buildAiGeneratedRunningPlanAuthoringInput({
    ...baseInput,
    planGoalIntent: {
      distance: { kind: "custom", distanceKm: 15, label: "Custom 15K" },
    },
  });
  assert.equal(exactDistance.ok, true, exactDistance.ok ? "" : exactDistance.message);
  if (!exactDistance.ok) throw new Error(exactDistance.message);
  assert.equal(exactDistance.planGoalIntent.distance?.distanceMeters, 15_000);
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
  const delayedFixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    env: {
      LOCAL_AUTH_BYPASS_ENABLED: "true",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]: "true",
      [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "qa_fixture",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV]: "120001",
    },
  });

  const originalDateNow = Date.now;
  const originalSetTimeout = globalThis.setTimeout;
  let fakeNow = Date.UTC(2026, 6, 16, 12, 0, 0);
  let completeCallCount = 0;
  let scheduledFixtureDelayMs = 0;

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
        apiKey: "local-qa-dev-ai-generated-plan-fixture",
        model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
        today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
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
    assert.equal(result.draft.aiGeneration.debug?.abortReason, null);
    assert.ok(result.draft.aiGeneration.elapsedMs >= 120_001);
    assert.ok(result.draft.reviewToken.length >= 16);
    assert.equal(result.draft.reviewChecksum.length, 64);
    assert.equal(result.draft.reviewSafety.confirmPathImplemented, true);
    assert.equal(result.draft.reviewSafety.persisted, false);
  } finally {
    Date.now = originalDateNow;
    globalThis.setTimeout = originalSetTimeout;
  }

  const timedOut = await runTimedOutFirstPlanRequest({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  assertUnavailableLifecycleResult(timedOut.result, {
    expectedReason: /timed_out/,
    expectedRequestPhase: "timeout_before_response",
  });
  assert.equal(timedOut.callCount, 1);
  assert.equal(timedOut.result.metadata.debug.timeoutMs, 20);
  assert.equal(timedOut.result.metadata.debug.abortReason, "timeout");
  assert.equal(timedOut.result.metadata.generationTrace?.request.timeoutMs, 20);
  assert.equal(timedOut.result.metadata.generationTrace?.pipeline.finalOutcome, "timeout");
  assert.equal(timedOut.result.metadata.responseId, null);

  const cancelled = await runCancelledFirstPlanRequest({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  assertUnavailableLifecycleResult(cancelled.result, {
    expectedReason: /cancelled/,
    expectedRequestPhase: "request_cancelled",
  });
  assert.equal(cancelled.callCount, 1);
  assert.equal(cancelled.result.metadata.debug.timeoutMs, 0);
  assert.equal(cancelled.result.metadata.debug.abortReason, "cancelled");
  assert.equal(cancelled.result.metadata.debug.transportFailureCode, "request_signal_aborted");
  assert.equal(cancelled.result.metadata.generationTrace?.pipeline.finalOutcome, "cancelled");

  let transportFailureCallCount = 0;
  const transportFailure = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "transport-failure-plan-first-proof",
    model: "transport-failure-plan-first-proof",
    generationLedger: { disabled: true },
    fetchImpl: async () => {
      transportFailureCallCount += 1;
      throw new TypeError("SENSITIVE_TRANSPORT_MESSAGE", {
        cause: Object.assign(new Error("SENSITIVE_CAUSE_MESSAGE"), {
          code: "UND_ERR_HEADERS_TIMEOUT",
        }),
      });
    },
  });
  assertUnavailableLifecycleResult(transportFailure, {
    expectedReason: /provider_transport_failed/,
    expectedRequestPhase: "request_failed",
  });
  assert.equal(transportFailureCallCount, 1);
  assert.equal(transportFailure.metadata.debug.abortReason, null);
  assert.equal(transportFailure.metadata.debug.transportMode, "injected");
  assert.equal(transportFailure.metadata.debug.transportFailureCode, "provider_headers_timeout");
  assert.equal(
    transportFailure.metadata.generationTrace?.pipeline.issueCodes.includes(
      "provider_headers_timeout",
    ),
    true,
  );
  assert.doesNotMatch(
    JSON.stringify(transportFailure),
    /SENSITIVE_TRANSPORT_MESSAGE|SENSITIVE_CAUSE_MESSAGE|UND_ERR_HEADERS_TIMEOUT/,
  );

  let externalAbortCallCount = 0;
  const externalAbort = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "external-abort-plan-first-proof",
    model: "external-abort-plan-first-proof",
    generationLedger: { disabled: true },
    fetchImpl: async () => {
      externalAbortCallCount += 1;
      throw new DOMException("External transport abort.", "AbortError");
    },
  });
  assertUnavailableLifecycleResult(externalAbort, {
    expectedReason: /provider_transport_failed/,
    expectedRequestPhase: "request_failed",
  });
  assert.equal(externalAbortCallCount, 1);
  assert.equal(externalAbort.metadata.debug.abortReason, null);
  assert.equal(externalAbort.metadata.debug.transportFailureCode, "provider_transport_error");

  let providerFailureCallCount = 0;
  const providerFailure = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
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
  assert.equal(providerFailure.metadata.debug.abortReason, null);

  const originalFetch = globalThis.fetch;
  let canonicalTransportCallCount = 0;
  let canonicalRequestHasDispatcher = false;
  globalThis.fetch = (async (_url, init) => {
    canonicalTransportCallCount += 1;
    canonicalRequestHasDispatcher =
      Boolean(init) && typeof init === "object" && "dispatcher" in init;
    return jsonResponse(completedBody);
  }) as typeof fetch;
  try {
    const canonicalTransport = await generateAiFirstPlanDraftPreview({
      input: resolved.authoringInput,
      apiKey: "canonical-transport-plan-first-proof",
      model: "canonical-transport-plan-first-proof",
      generationLedger: { disabled: true },
    });
    assert.equal(canonicalTransport.ok, true);
    if (!canonicalTransport.ok) {
      throw new Error(canonicalTransport.metadata.unavailableReason);
    }
    assert.equal(canonicalTransportCallCount, 1);
    assert.equal(canonicalRequestHasDispatcher, true);
    assert.equal(canonicalTransport.metadata.debug.transportMode, "canonical_no_deadline");
    assert.equal(canonicalTransport.metadata.debug.transportHeadersTimeoutMs, 0);
    assert.equal(canonicalTransport.metadata.debug.transportBodyTimeoutMs, 0);
    assert.equal(canonicalTransport.metadata.debug.transportFailureCode, null);
  } finally {
    globalThis.fetch = originalFetch;
  }

  let incompleteCallCount = 0;
  const incomplete = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
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
  assert.equal(incomplete.metadata.debug.abortReason, null);
  assert.equal(incomplete.metadata.debug.responseIncompleteReason, "max_output_tokens");
}

async function runTimedOutFirstPlanRequest(input: {
  authoringInput: Extract<
    ReturnType<typeof buildAiGeneratedRunningPlanAuthoringInput>,
    { ok: true }
  >["authoringInput"];
  today: string;
}) {
  let callCount = 0;
  const result = await generateAiFirstPlanDraftPreview({
    input: input.authoringInput,
    apiKey: "timed-out-plan-first-proof",
    model: "timed-out-plan-first-proof",
    today: input.today,
    timeoutMs: 20,
    generationLedger: { disabled: true },
    fetchImpl: async (_url, init) => {
      callCount += 1;
      const requestSignal = init?.signal;

      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener(
          "abort",
          () => reject(new DOMException("Injected timeout.", "AbortError")),
          { once: true },
        );
      });
    },
  });

  return { result, callCount };
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

async function validateTypedPlanFirstFailureOutcomes() {
  const scenario = scenarios[0]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const fixtureResponse = await fixtureFetch("https://api.openai.com/v1/responses", {});
  const completedBody = (await fixtureResponse.json()) as { output_text: string };
  const invalidCompilerDraft = parseFixtureProviderDraft(completedBody.output_text);
  const runningDay = invalidCompilerDraft.workouts[0];
  assert.ok(runningDay, "Fixture must expose a running day.");
  runningDay.date = "2026-06-10";
  const originalFixtureFlag = process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
  process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = "0";

  try {
    const notConfigured = await buildAiGeneratedRunningPlanPreview(scenario.input, {
      aiPreview: {
        apiKey: null,
        generationLedger: { disabled: true },
      },
    });
    assert.equal(notConfigured.ok, false);
    if (notConfigured.ok)
      throw new Error("Missing provider credentials unexpectedly produced a draft.");
    assert.equal(notConfigured.unavailable.previewOutcome, "provider_runtime_failure");
    assert.equal(notConfigured.unavailable.debug.generationTrace?.provider.kind, "not_started");
    assert.equal(notConfigured.unavailable.debug.generationTrace?.provider.paidProviderCall, false);

    const cases = [
      {
        expected: "provider_runtime_failure",
        fetchImpl: async () =>
          jsonResponse(
            {
              id: "resp_typed_provider_failure",
              status: "failed",
              error: { message: "Injected provider failure." },
            },
            503,
          ),
      },
      {
        expected: "provider_incomplete_output",
        fetchImpl: async () =>
          jsonResponse({
            ...completedBody,
            id: "resp_typed_incomplete",
            status: "incomplete",
            incomplete_details: { reason: "max_output_tokens" },
          }),
      },
      {
        expected: "malformed_provider_output",
        fetchImpl: async () =>
          jsonResponse({
            id: "resp_typed_malformed",
            status: "completed",
            output_text: "{not-json",
          }),
      },
      {
        expected: "compiler_rejection",
        fetchImpl: async () =>
          openAiPlanFirstResponse("resp_typed_compiler_rejection", invalidCompilerDraft),
      },
    ] as const;

    for (const scenarioCase of cases) {
      const result = await buildAiGeneratedRunningPlanPreview(scenario.input, {
        aiPreview: {
          apiKey: `typed-${scenarioCase.expected}`,
          model: "typed-plan-first-failure-proof",
          generationLedger: { disabled: true },
          fetchImpl: scenarioCase.fetchImpl,
        },
      });
      assert.equal(result.ok, false, `${scenarioCase.expected} unexpectedly produced a draft.`);
      if (result.ok) throw new Error(`${scenarioCase.expected} unexpectedly produced a draft.`);
      assert.equal(result.unavailable.previewOutcome, scenarioCase.expected);
      assert.equal(result.unavailable.persisted, false);
    }
  } finally {
    if (originalFixtureFlag === undefined) {
      delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
    } else {
      process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = originalFixtureFlag;
    }
  }
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

async function validateLocalGenerationIncidentTrail() {
  const artifactRoot = await mkdtemp(join(tmpdir(), "hito-ai-plan-incidents-"));
  const runnerCanary = "RUNNER_FREE_TEXT_CANARY_DO_NOT_STORE";
  const providerCanary = "PROVIDER_OUTPUT_CANARY_DO_NOT_STORE";
  const secretCanary = "sk-secret-canary-do-not-store";

  try {
    let trace = await createAiPlanGenerationLedgerTrace({
      providerKind: "local_dev_fixture",
      model: "local-fixture-model",
      contractMode: "plan_first",
      responseSchemaMode: "responses_json_schema_plan_first_direct_v1_strict",
      systemPrompt: `system ${secretCanary}`,
      userPrompt: `runner ${runnerCanary}`,
      responseSchema: { type: "object", properties: { secret: { type: "string" } } },
      timeoutMs: 0,
      maxOutputTokens: 4_000,
    });
    trace =
      (await attachOutputToAiPlanGenerationLedgerTrace({
        trace,
        rawOutput: JSON.stringify({
          workouts: [{ title: providerCanary }],
          providerControlledKey: providerCanary,
        }),
        parsedOutput: {
          workouts: [{ title: providerCanary }],
          providerControlledKey: providerCanary,
        },
        options: {
          forceArtifactWrite: true,
          artifactRoot,
          runtimeUrl: "http://127.0.0.1:3000",
        },
      })) ?? trace;
    trace =
      (await updateAiPlanGenerationLedgerTrace(
        trace,
        {
          pipeline: {
            ...trace.pipeline,
            issueCodes: ["ai_authored_plan_first_provider_schema_invalid"],
            finalOutcome: "rejected",
            unavailableReason: "ai_authored_plan_first_provider_schema_invalid",
          },
        },
        {
          forceArtifactWrite: true,
          artifactRoot,
          runtimeUrl: "http://127.0.0.1:3000",
        },
      )) ?? trace;

    assert.equal(trace.artifacts.written, true);
    assert.ok(trace.artifacts.path);
    assert.ok(trace.artifacts.expiresAt);
    assert.equal(trace.artifacts.path!.startsWith("/"), false);
    const artifactPath = join(artifactRoot, trace.artifacts.path!);
    const artifact = await readFile(artifactPath, "utf8");
    assert.doesNotMatch(artifact, new RegExp(runnerCanary));
    assert.doesNotMatch(artifact, new RegExp(providerCanary));
    assert.doesNotMatch(artifact, new RegExp(secretCanary));
    assert.match(artifact, /ai_authored_plan_first_provider_schema_invalid/);
    assert.equal((await stat(artifactPath)).mode & 0o777, 0o600);
    const events = await queryLocalRuntimeEvents({
      root: artifactRoot,
      generationId: trace.generationId,
      outcomeCode: "ai_authored_plan_first_provider_schema_invalid",
    });
    assert.equal(events.length, 1);

    const blockedRoot = join(artifactRoot, "non-loopback");
    const blockedTrace = await updateAiPlanGenerationLedgerTrace(
      trace,
      {},
      {
        forceArtifactWrite: true,
        artifactRoot: blockedRoot,
        runtimeUrl: "https://hosted.example.test",
      },
    );
    assert.equal(blockedTrace?.artifacts.path, trace.artifacts.path);
    await assert.rejects(stat(blockedRoot), /ENOENT/);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
}

async function validateLocalDevFixtureAvailabilityGating() {
  const boundaryArtifactRoot = await mkdtemp(join(tmpdir(), "hito-provider-boundary-"));
  const localDevFixtureEnv = {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]: "true",
    [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "qa_fixture",
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
    /requires the local plan-first fixture to be enabled/,
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
      [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "real",
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
  assert.equal(
    buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      qaFixtureAuthorized: false,
      env: localDevFixtureEnv,
    }),
    null,
    "Fixture environment residue must not authorize an ordinary local account.",
  );
  assert.equal(
    buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      qaFixtureAuthorized: true,
      env: {
        ...localDevFixtureEnv,
        NEXT_PUBLIC_SUPABASE_URL: "https://hosted.example.supabase.co",
        [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV]: "non_repeat_tempo",
      },
    }),
    null,
  );

  const envKeys = [
    "LOCAL_AUTH_BYPASS_ENABLED",
    "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
    "HITO_AI_GENERATED_PLAN_DEV_FIXTURE",
    AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
    "HITO_LOCAL_RUNTIME_OBSERVABILITY",
    "HITO_LOCAL_RUNTIME_OBSERVABILITY_ROOT",
    "HITO_LOCAL_RUNTIME_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "VERCEL",
    "CI",
  ] as const;
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  try {
    process.env.LOCAL_AUTH_BYPASS_ENABLED = "true";
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = "/tmp/hito-local-auth.json";
    process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE = "true";
    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "qa_fixture";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.HITO_LOCAL_RUNTIME_OBSERVABILITY = "1";
    process.env.HITO_LOCAL_RUNTIME_OBSERVABILITY_ROOT = boundaryArtifactRoot;
    process.env.HITO_LOCAL_RUNTIME_URL = "http://127.0.0.1:3000";
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV];
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
    delete process.env.VERCEL;
    delete process.env.CI;

    let invalidFixtureProviderCalls = 0;
    const invalidFixtureInput = await buildReviewedAiGeneratedRunningPlanPreview(
      {
        ...scenarios[0]!.input,
        planGoalIntent: {
          ...scenarios[0]!.input.planGoalIntent,
          targetDate: scenarios[0]!.input.startDate,
        },
      },
      {
        qaFixtureAuthorized: true,
        aiPreview: {
          apiKey: "must-not-bypass-normal-preview-input",
          fetchImpl: async () => {
            invalidFixtureProviderCalls += 1;
            throw new Error("Structurally invalid fixture input reached a provider.");
          },
          generationLedger: { disabled: true },
        },
      },
    );
    assert.equal(invalidFixtureInput.ok, false);
    if (!invalidFixtureInput.ok) {
      assert.equal(invalidFixtureInput.unavailable.previewOutcome, "invalid_structural_input");
      assert.equal(invalidFixtureInput.unavailable.callsOpenAi, false);
    }
    assert.equal(invalidFixtureProviderCalls, 0);

    const fixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      qaFixtureAuthorized: true,
    });
    assert.ok(fixtureOptions?.fetchImpl);
    const fixtureProviderResponse = await fixtureOptions!.fetchImpl!(
      "https://api.openai.com/v1/responses",
      {},
    );
    const fixtureProviderBody = (await fixtureProviderResponse.json()) as {
      id: string;
      model?: string;
      output_text: string;
    };
    assert.equal(fixtureProviderBody.id, AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID);
    const fixtureDraft = parseFixtureProviderDraft(fixtureProviderBody.output_text);
    assert.ok(
      [...fixtureDraft.workouts, fixtureDraft.endpoint]
        .flatMap((workout) => workout.sections)
        .flatMap((section) =>
          section.kind === "repeat"
            ? section.children.map((child) => child.target)
            : section.kind === "unit"
              ? [section.target]
              : [],
        )
        .filter((target) => target.primary_execution_mode === "heart_rate")
        .every((target) => Boolean(target.band_reference)),
      "The deterministic QA fixture must author explicit HR band identity.",
    );

    let providerOverrideCallCount = 0;
    let scheduledFixtureDelayMs = 0;
    const originalSetTimeout = globalThis.setTimeout;
    process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV] = "15000";
    globalThis.setTimeout = ((callback: (...args: unknown[]) => void, delay?: number) => {
      scheduledFixtureDelayMs = Number(delay ?? 0);
      queueMicrotask(callback);
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    const result = await (async () => {
      try {
        return await buildReviewedAiGeneratedRunningPlanPreview(scenarios[0]!.input, {
          qaFixtureAuthorized: true,
          aiPreview: {
            apiKey: "must-not-replace-local-fixture",
            model: "must-not-replace-local-fixture",
            signal: new AbortController().signal,
            fetchImpl: async () => {
              providerOverrideCallCount += 1;
              throw new Error("Local fixture provider transport was replaced.");
            },
            generationLedger: {
              forceArtifactWrite: true,
              artifactRoot: boundaryArtifactRoot,
              runtimeUrl: "http://127.0.0.1:3000",
            },
          },
        });
      } finally {
        globalThis.setTimeout = originalSetTimeout;
        delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV];
      }
    })();
    assert.equal(scheduledFixtureDelayMs, 15_000);
    assert.equal(result.ok, true, "Request cancellation plumbing must preserve the local fixture.");
    if (!result.ok) throw new Error(result.unavailable.error.message);
    assert.equal(providerOverrideCallCount, 0);
    assert.equal(result.draft.callsOpenAi, false);
    assert.equal(result.draft.reviewSafety.callsOpenAi, false);
    assert.equal(result.draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.kind, "local_dev_fixture");
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.paidProviderCall, false);
    assert.equal(
      result.draft.aiGeneration.responseId,
      AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
    );
    assert.equal(result.draft.normalizedInputSummary.startDate, "2026-07-06");
    assert.equal(
      result.draft.normalizedInputSummary.planGoalIntent.distance?.distanceMeters,
      10_000,
    );
    assert.equal(result.draft.endpointProof.finalDate, "2026-08-01");
    assert.equal(result.draft.endpointProof.endpointMainDistanceMeters, 10_000);
    assert.equal(result.draft.persisted, false);
    assert.equal(result.draft.mutates, false);
    assert.ok(result.draft.reviewToken.length >= 16);
    assert.equal(result.draft.reviewChecksum.length, 64);
    const fixtureGenerationId = result.draft.aiGeneration.generationTrace?.generationId;
    assert.ok(fixtureGenerationId);
    const fixtureEvents = await queryLocalRuntimeEvents({
      root: boundaryArtifactRoot,
      generationId: fixtureGenerationId,
    });
    assert.equal(
      fixtureEvents.some((event) => event.providerKind === "openai_responses_api"),
      false,
    );
    assert.equal(
      fixtureEvents.filter((event) => event.outcomeCode === "reviewed_draft_signed").length,
      1,
    );

    process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV] = "non_repeat_tempo";
    const inputIndependentResult = await buildReviewedAiGeneratedRunningPlanPreview(
      scenarios[2]!.input,
      {
        qaFixtureAuthorized: true,
        aiPreview: {
          apiKey: "must-not-replace-local-fixture",
          model: "must-not-replace-local-fixture",
          fetchImpl: async () => {
            providerOverrideCallCount += 1;
            throw new Error("Runner input reached the local fixture transport.");
          },
          generationLedger: { disabled: true },
        },
      },
    );
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
    assert.equal(inputIndependentResult.ok, true);
    if (!inputIndependentResult.ok) {
      throw new Error(inputIndependentResult.unavailable.error.message);
    }
    assert.equal(providerOverrideCallCount, 0);
    assert.deepEqual(
      inputIndependentResult.draft.canonicalPlan,
      result.draft.canonicalPlan,
      "QA fixture content must not change with runner facts, goal, dates, or scenario residue.",
    );
    assert.deepEqual(inputIndependentResult.draft.workoutDocuments, result.draft.workoutDocuments);

    const fixtureCommentCanary = "FIXTURE_RUNNER_COMMENT_MUST_NOT_SHAPE_OR_PERSIST";
    const commentedFixtureResult = await buildReviewedAiGeneratedRunningPlanPreview(
      {
        ...scenarios[0]!.input,
        runnerComment: `  ${fixtureCommentCanary}  `,
      },
      {
        qaFixtureAuthorized: true,
        aiPreview: {
          apiKey: "must-not-replace-local-fixture",
          model: "must-not-replace-local-fixture",
          fetchImpl: async () => {
            providerOverrideCallCount += 1;
            throw new Error("Runner comment reached the local fixture transport.");
          },
          generationLedger: { disabled: true },
        },
      },
    );
    assert.equal(commentedFixtureResult.ok, true);
    if (!commentedFixtureResult.ok) {
      throw new Error(commentedFixtureResult.unavailable.error.message);
    }
    assert.equal(providerOverrideCallCount, 0);
    assert.equal(commentedFixtureResult.draft.callsOpenAi, false);
    assert.equal(
      commentedFixtureResult.draft.aiGeneration.generationTrace?.provider.kind,
      "local_dev_fixture",
    );
    assert.equal("runnerComment" in commentedFixtureResult.draft.previewInput, false);
    assert.equal("runnerComment" in commentedFixtureResult.draft.normalizedInputSummary, false);
    assert.deepEqual(commentedFixtureResult.draft.canonicalPlan, result.draft.canonicalPlan);
    assert.deepEqual(commentedFixtureResult.draft.workoutDocuments, result.draft.workoutDocuments);
    assert.equal(commentedFixtureResult.draft.reviewChecksum, result.draft.reviewChecksum);
    assert.equal(
      JSON.stringify(commentedFixtureResult.draft).includes(fixtureCommentCanary),
      false,
    );
    const fixtureEncodedReviewEnvelope = commentedFixtureResult.draft.reviewToken.split(".")[1];
    assert.ok(fixtureEncodedReviewEnvelope);
    const fixtureDecodedReviewEnvelope = base64UrlDecodeUtf8(fixtureEncodedReviewEnvelope!);
    assert.equal(fixtureDecodedReviewEnvelope.includes(fixtureCommentCanary), false);
    assert.doesNotMatch(
      fixtureDecodedReviewEnvelope,
      /"runnerComment"|"requestContext"|"plan_request_comment"/,
    );
    const fixturePersistenceMetadata = buildRunningPlanPersistenceMetadata({
      draft: commentedFixtureResult.draft,
      canonicalPlan: buildRunningPlanCanonicalPlan(commentedFixtureResult.draft),
      reviewChecksum: commentedFixtureResult.draft.reviewChecksum,
    });
    assert.doesNotMatch(
      JSON.stringify(fixturePersistenceMetadata),
      new RegExp(fixtureCommentCanary),
    );

    const unauthorizedConfirm = await confirmRunningPlanDraftForUser("ordinary-local-runner", {
      previewInput: result.draft.previewInput,
      sourceKind: result.draft.sourceKind,
      reviewToken: result.draft.reviewToken,
      reviewChecksum: result.draft.reviewChecksum,
    });
    assert.equal(unauthorizedConfirm.ok, false);
    if (!unauthorizedConfirm.ok) {
      assert.equal(unauthorizedConfirm.reason, "fixture_not_authorized");
      assert.equal(unauthorizedConfirm.persisted, false);
    }
    const unauthorizedEvents = await queryLocalRuntimeEvents({
      root: boundaryArtifactRoot,
      generationId: fixtureGenerationId,
      outcomeCode: "local_qa_fixture_not_authorized",
    });
    assert.equal(unauthorizedEvents.length, 1);
    assert.equal(unauthorizedEvents[0]?.providerKind, "local_dev_fixture");
    assert.doesNotMatch(
      JSON.stringify(unauthorizedEvents),
      /ordinary-local-runner|reviewToken|prompt|cookie/i,
    );

    let unauthorizedProviderCallCount = 0;
    const unauthenticatedFixtureUnavailable = await buildReviewedAiGeneratedRunningPlanPreview(
      scenarios[0]!.input,
      {
        qaFixtureAuthorized: false,
        aiPreview: {
          apiKey: "must-not-call-any-provider",
          fetchImpl: async () => {
            unauthorizedProviderCallCount += 1;
            throw new Error("Unauthorized QA fixture request reached a provider.");
          },
          generationLedger: {
            forceArtifactWrite: true,
            artifactRoot: boundaryArtifactRoot,
            runtimeUrl: "http://127.0.0.1:3000",
          },
        },
      },
    );
    assert.equal(unauthenticatedFixtureUnavailable.ok, false);
    if (!unauthenticatedFixtureUnavailable.ok) {
      assert.equal(unauthorizedProviderCallCount, 0);
      assert.equal(unauthenticatedFixtureUnavailable.unavailable.persisted, false);
      assert.equal(unauthenticatedFixtureUnavailable.unavailable.callsOpenAi, false);
      assert.equal(
        unauthenticatedFixtureUnavailable.unavailable.error.code,
        "local_qa_fixture_not_authorized",
      );
      assert.equal(
        unauthenticatedFixtureUnavailable.unavailable.debug.generationTrace?.provider.kind,
        "not_started",
      );
      const unauthenticatedGenerationId =
        unauthenticatedFixtureUnavailable.unavailable.debug.generationTrace?.generationId;
      assert.ok(unauthenticatedGenerationId);
      const unauthenticatedEvents = await queryLocalRuntimeEvents({
        root: boundaryArtifactRoot,
        generationId: unauthenticatedGenerationId,
      });
      assert.ok(
        unauthenticatedEvents.some(
          (event) =>
            event.providerKind === "not_started" &&
            event.outcomeCode === "local_qa_fixture_not_authorized",
        ),
      );
      assert.equal(
        unauthenticatedEvents.some((event) => event.providerKind === "openai_responses_api"),
        false,
      );
      assert.doesNotMatch(
        JSON.stringify(unauthenticatedEvents),
        /runner|prompt|authorization|cookie/i,
      );
    }

    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "real";
    process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE = "true";
    const realModeAuthoring = buildAiGeneratedRunningPlanAuthoringInput(scenarios[3]!.input);
    assert.equal(realModeAuthoring.ok, true, realModeAuthoring.ok ? "" : realModeAuthoring.message);
    if (!realModeAuthoring.ok) throw new Error(realModeAuthoring.message);
    const realModeResponse = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
      authoringInput: realModeAuthoring.authoringInput,
      today: realModeAuthoring.authoringInput.schedule.startDate,
    });
    let realModeProviderCallCount = 0;
    const realModeResult = await buildReviewedAiGeneratedRunningPlanPreview(scenarios[3]!.input, {
      qaFixtureAuthorized: false,
      aiPreview: {
        apiKey: "synthetic-real-mode-provider-key",
        model: "gpt-4.1-mini",
        fetchImpl: async (url, init) => {
          realModeProviderCallCount += 1;
          return realModeResponse(url, init);
        },
        generationLedger: { disabled: true },
      },
    });
    assert.equal(realModeResult.ok, true);
    if (!realModeResult.ok) throw new Error(realModeResult.unavailable.error.message);
    assert.equal(realModeProviderCallCount, 1);
    assert.equal(realModeResult.draft.aiGeneration.model, "gpt-4.1-mini");
    assert.equal(
      realModeResult.draft.aiGeneration.generationTrace?.provider.kind,
      "openai_responses_api",
    );
    assert.equal(realModeResult.draft.callsOpenAi, true);
  } finally {
    for (const key of envKeys) {
      const value = previousEnv[key];
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    await rm(boundaryArtifactRoot, { recursive: true, force: true });
  }
}

function validateNoLegacyGeneratedPlanAuthoringSourceImports() {
  const checkedFiles = [
    "src/lib/ai-first-plan-draft-service.ts",
    "src/lib/ai-generated-running-plan.ts",
    "src/lib/ai-generated-running-plan-dev-fixture.ts",
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

function buildScenarioAiPreviewOptions(
  input: RunningPlanPreviewActionInput,
  config: { nonRepeatTempo?: boolean } = {},
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const env = {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]: "true",
    [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "qa_fixture",
    ...(config.nonRepeatTempo
      ? {
          [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV]: "non_repeat_tempo",
        }
      : {}),
  };
  const fetchImpl = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: input.startDate ?? resolved.authoringInput.schedule.startDate,
    env,
  });

  return {
    apiKey: "local-qa-dev-ai-generated-plan-fixture",
    model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
    today: input.startDate ?? resolved.authoringInput.schedule.startDate,
    fetchImpl,
  };
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

  const persistenceMetadata = buildRunningPlanPersistenceMetadata({
    draft,
    canonicalPlan,
    reviewChecksum: draft.reviewChecksum,
  });
  const metricPolicy = (
    persistenceMetadata.goalMetadata as {
      selected_plan_engine?: {
        metric_policy?: {
          paceTargetsAllowed?: boolean;
          heartRateTargetsAllowed?: boolean;
        };
      };
    }
  ).selected_plan_engine?.metric_policy;
  const serializedCanonicalPlan = JSON.stringify(canonicalPlan);
  const hasPaceCommand =
    /"primary_execution_mode":"pace"/.test(serializedCanonicalPlan) &&
    /"pace":"\d{1,2}:[0-5]\d/.test(serializedCanonicalPlan);
  const hasAcceptedHeartRateCommand =
    /"primary_execution_mode":"heart_rate"/.test(serializedCanonicalPlan) &&
    /"hr_target_source":"(?:personal_hr_zone|default_estimated_hr)"/.test(serializedCanonicalPlan);
  assert.equal(
    metricPolicy?.paceTargetsAllowed,
    hasPaceCommand,
    `${scenarioName} persistence metadata must match reviewed pace-primary truth.`,
  );
  assert.equal(
    metricPolicy?.heartRateTargetsAllowed,
    hasAcceptedHeartRateCommand,
    `${scenarioName} persistence metadata must match reviewed accepted-HR-primary truth.`,
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
  assert.deepEqual(decoded.draft.workoutDocuments, draft.workoutDocuments);

  const tamperedReadModelDraft = {
    ...draft,
    workoutDocuments: draft.workoutDocuments.map((document, index) =>
      index === 0
        ? {
            ...document,
            title: `${document.title} (tampered)`,
          }
        : document,
    ),
  };
  const tamperedReadModelExactness = await validateRunningPlanReviewExactness({
    draft: tamperedReadModelDraft,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(
    tamperedReadModelExactness.ok,
    false,
    `${scenarioName} must reject a WorkoutDocument-only review payload substitution.`,
  );
  if (tamperedReadModelExactness.ok) {
    throw new Error(`${scenarioName} accepted a tampered WorkoutDocument read model.`);
  }
  assert.equal(tamperedReadModelExactness.reason, "stale_review");

  const tamperedTargetDraft = structuredClone(draft);
  const tamperedTarget = findRecordWithStringKey(
    tamperedTargetDraft.workoutDocuments,
    "primary_execution_mode",
  );
  assert.ok(tamperedTarget, `${scenarioName} must expose a signed primary execution mode.`);
  if (tamperedTarget && typeof tamperedTarget.intensity === "string") {
    tamperedTarget.intensity = `${tamperedTarget.intensity} (tampered)`;
  } else if (tamperedTarget) {
    tamperedTarget.primary_execution_mode = "run_walk";
  }
  const tamperedTargetExactness = await validateRunningPlanReviewExactness({
    draft: tamperedTargetDraft,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(
    tamperedTargetExactness.ok,
    false,
    `${scenarioName} must reject an AI-authored primary-command substitution after review.`,
  );

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
  for (const segment of repeatSegments) {
    assert.ok(
      segment.prescription?.mode === "repeats" && (segment.prescription.children ?? []).length >= 1,
      `${scenarioName} must preserve every AI-authored Repeat child.`,
    );
    assert.equal(
      Boolean(segment.target),
      false,
      `${scenarioName} repeat parents must stay structural-only.`,
    );
  }
  let runnableLeafCount = 0;
  for (const workout of canonicalPlan.planned_workouts) {
    if (workout.workout_type === "rest") continue;
    for (const segment of workout.segments) {
      const leaves =
        segment.prescription?.mode === "repeats"
          ? (segment.prescription.children ?? [])
          : segment.segment_type === "fueling"
            ? []
            : [segment];
      for (const leaf of leaves) {
        runnableLeafCount += 1;
        const target = leaf.target;
        assert.ok(
          target?.primary_execution_mode,
          `${scenarioName} runnable leaves must author one primary execution mode.`,
        );
        const hasPace = Boolean(target?.pace ?? target?.pace_min_per_km_range);
        const hasHeartRate = Boolean(target?.hr_bpm_range ?? target?.hr_bpm);
        assert.equal(
          hasPace && hasHeartRate,
          false,
          `${scenarioName} one leaf cannot command pace and heart rate together.`,
        );
        if (target?.primary_execution_mode === "pace") {
          assert.match(
            target.pace ?? target.pace_min_per_km_range ?? "",
            new RegExp(AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN),
          );
        }
        if (target?.primary_execution_mode === "heart_rate") {
          assert.ok(
            target.hr_target_source === "personal_hr_zone" ||
              target.hr_target_source === "default_estimated_hr",
            `${scenarioName} HR-primary leaves must retain accepted profile provenance.`,
          );
          assert.equal(hasHeartRate, true);
        }
        assert.ok(
          target?.primary_execution_mode === "pace" ||
            target?.primary_execution_mode === "heart_rate",
          `${scenarioName} generated runnable leaves allow only numeric pace or BPM commands.`,
        );
      }
    }
  }
  const hydrationSteps = canonicalPlan.planned_workouts.flatMap((workout) =>
    workout.segments.filter((segment) => segment.segment_type === "fueling"),
  );
  assert.ok(hydrationSteps.length > 0, `${scenarioName} must cover authored Hydration.`);
  for (const hydration of hydrationSteps) {
    assert.equal(hydration.label, "Hydration");
    assert.equal(hydration.guidance, "Take water.");
    assert.equal(hydration.prescription?.mode, "none");
    assert.equal(hydration.target, undefined);
  }
  assert.ok(runnableLeafCount > 0);
  assert.doesNotMatch(serialized, /repeat_unit|recovery_unit/);
  assert.doesNotMatch(
    serialized,
    /"hr_target_source":"effort_only"[^}]*"hr_bpm_range"/,
    `${scenarioName} BPM guidance must retain effective profile provenance.`,
  );
  assert.doesNotMatch(serialized, /Mock AI|Local QA\/dev AI fixture/i);
  assert.match(
    serialized,
    /ai_authored_effort_guidance|ai_authored_plan_guidance|AI-authored coaching guidance/i,
    `${scenarioName} must preserve AI-authored plan guidance as compiled target/readback metadata.`,
  );
}

function assertPreviewTargetTruth({
  scenarioName,
  canonicalPlan,
  calendarRows,
}: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
  calendarRows: Extract<
    Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>,
    { ok: true }
  >["draft"]["calendarRows"];
}) {
  let targetCount = 0;

  for (const workout of canonicalPlan.planned_workouts) {
    const row = calendarRows.find((candidate) => candidate.rowId === workout.workout_id);
    assert.ok(row, `${scenarioName} review rows must include ${workout.workout_id}.`);
    if (!row) continue;
    if (row.isRestDay) continue;

    workout.segments.forEach((segment, segmentIndex) => {
      const previewSegment = row.segments[segmentIndex];
      assert.ok(previewSegment, `${scenarioName} review must preserve segment order.`);
      if (!previewSegment) return;

      if (segment.target) {
        targetCount += 1;
        assert.deepEqual(previewSegment.target, segment.target);
      }

      if (segment.prescription?.mode !== "repeats") return;
      const previewPrescription = previewSegment.primaryPrescription;
      assert.equal(previewPrescription.mode, "repeat");
      if (previewPrescription.mode !== "repeat") return;
      (segment.prescription.children ?? []).forEach((child, childIndex) => {
        if (!child.target) return;
        targetCount += 1;
        assert.deepEqual(previewPrescription.children[childIndex]?.target, child.target);
      });
    });
  }

  assert.ok(targetCount > 0, `${scenarioName} must prove runner-visible target truth.`);
}

function assertNonRepeatTempoFixtureReviewTruth({
  scenarioName,
  canonicalPlan,
  calendarRows,
}: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
  calendarRows: Extract<
    Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>,
    { ok: true }
  >["draft"]["calendarRows"];
}) {
  const tempo = canonicalPlan.planned_workouts.find(
    (workout) =>
      workout.workout_identity === "controlled_tempo_session" &&
      workout.segments.some(
        (segment) =>
          segment.label === "Work" &&
          segment.segment_type === "tempo_block" &&
          segment.prescription?.mode === "time",
      ),
  );
  assert.ok(tempo, `${scenarioName} fixture must author a continuous Tempo workout.`);
  if (!tempo) return;
  assert.equal(
    tempo.segments.some((segment) => segment.prescription?.mode === "repeats"),
    false,
    `${scenarioName} continuous Tempo must not contain a Repeat block.`,
  );

  const work = tempo.segments.find((segment) => segment.label === "Work");
  assert.ok(work, `${scenarioName} continuous Tempo must include an authored Work segment.`);
  if (!work) return;
  assert.equal(work.prescription?.mode, "time");
  assert.equal(work.target?.primary_execution_mode, "pace");
  assert.equal(work.target?.pace, "4:50-5:00/km");
  assert.equal(work.target?.intensity, undefined);
  assert.equal(work.target?.hint, undefined);
  assert.equal(work.target?.extra?.hr_zone, undefined);
  assert.equal(work.target?.hr_bpm_range, undefined);

  const reviewRow = calendarRows.find((row) => row.rowId === tempo.workout_id);
  const reviewWork = reviewRow?.segments.find((segment) => segment.id === work.segment_id);
  assert.ok(reviewWork, `${scenarioName} signed review must retain the Tempo Work segment.`);
  assert.equal(
    reviewWork?.segmentRole,
    "work",
    `${scenarioName} review projection must preserve the canonical Tempo Work role.`,
  );
  assert.equal(reviewWork?.primaryPrescription.mode, "time");
  assert.deepEqual(reviewWork?.target, work.target);
}

function collectStringValuesForKey(value: unknown, key: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStringValuesForKey(entry, key));
  }
  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  return [
    ...(typeof record[key] === "string" ? [record[key]] : []),
    ...Object.entries(record)
      .filter(([entryKey]) => entryKey !== key)
      .flatMap(([, entryValue]) => collectStringValuesForKey(entryValue, key)),
  ];
}

function findRecordWithStringKey(value: unknown, key: string): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = findRecordWithStringKey(entry, key);
      if (match) return match;
    }
    return null;
  }
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record[key] === "string") {
    return record;
  }
  for (const entry of Object.values(record)) {
    const match = findRecordWithStringKey(entry, key);
    if (match) return match;
  }
  return null;
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

function parseFixtureProviderDraft(outputText: string) {
  const parsed = aiAuthoredPlanFirstCompilerDraftSchema.safeParse(JSON.parse(outputText));
  assert.equal(parsed.success, true);
  if (!parsed.success) throw new Error(parsed.error.message);
  return parsed.data;
}

function openAiPlanFirstResponse(responseId: string, draft: AiAuthoredPlanFirstCompilerDraft) {
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
