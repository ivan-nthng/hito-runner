import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  isAiGeneratedRunningPlanDevFixtureEnabled,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildAiGeneratedRunningPlanAuthoringInput,
  isAiGeneratedRunningPlanPreviewDraft,
} from "../src/lib/ai-generated-running-plan";
import type { AiPlanGenerationLedgerTrace } from "../src/lib/ai-plan-generation-ledger";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import { buildReviewedFirstPlanImportedSeed } from "../src/lib/active-plan-persistence";
import { summarizeRunnerFacingCanonicalRichness } from "../src/lib/plan-creation-engine/runner-facing-richness";
import { summarizeRunningPlanCanonicalPrescriptionGrammar } from "../src/lib/plan-creation-engine";
import {
  buildReviewedAiGeneratedRunningPlanPreview,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  buildRunningPlanPersistenceMetadata,
  buildRunningPlanCanonicalPlan,
  validateRunningPlanReviewExactness,
  validateSelfContainedRunningPlanReviewToken,
} from "../src/lib/running-plan-engine-review";

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
    name: "10K preset",
    input: {
      ...baseInput,
      distanceFamily: "10K",
      planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
    },
    expectedEndpointMeters: 10_000,
  },
  {
    name: "Browser-equivalent Quick setup 10K no benchmark",
    input: {
      age: 34,
      heightCm: 178,
      weightKg: 72,
      runnerLevel: "runs_a_lot",
      distanceFamily: "10K",
      daysPerWeek: null,
      fixedRestDays: [],
      preferredLongRunDay: null,
      startDate: null,
      benchmark: { kind: "unknown" },
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        targetFinishTime: null,
        targetDate: null,
      },
    },
    expectedEndpointMeters: 10_000,
  },
  {
    name: "10K preset with benchmark-backed specificity",
    input: {
      ...baseInput,
      distanceFamily: "10K",
      benchmark: { kind: "recent_5k_time", recent5kTime: "25:00" },
      planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
    },
    expectedEndpointMeters: 10_000,
    expectedRepeatRich: true,
  },
  {
    name: "Half Marathon preset",
    input: {
      ...baseInput,
      distanceFamily: "Half Marathon",
      planGoalIntent: { distance: { kind: "preset", preset: "Half Marathon" } },
    },
    expectedEndpointMeters: 21_100,
  },
  {
    name: "Half Marathon target date overrides preferred long-run day",
    input: {
      ...baseInput,
      distanceFamily: "Half Marathon",
      startDate: null,
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2026-11-26",
        targetFinishTime: "2:00:00",
      },
    },
    expectedEndpointMeters: 21_100,
    expectedFinalDate: "2026-11-26",
    expectedRepeatRich: true,
  },
  {
    name: "Marathon preset target date and finish time",
    input: {
      ...baseInput,
      distanceFamily: "Marathon Completion",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Marathon" },
        targetDate: "2026-11-01",
        targetFinishTime: "4:30:00",
      },
    },
    expectedEndpointMeters: 42_195,
    expectedFinalDate: "2026-11-01",
    expectedRepeatRich: true,
  },
  {
    name: "Custom 15K distance",
    input: {
      ...baseInput,
      distanceFamily: "10K",
      planGoalIntent: {
        distance: { kind: "custom", distanceKm: 15, label: "City 15K" },
        targetDate: "2026-09-13",
        targetFinishTime: "1:20:00",
      },
    },
    expectedEndpointMeters: 15_000,
    expectedFinalDate: "2026-09-13",
    expectedCustomDistance: true,
    expectedWorkoutGoalType: "distance_build",
    expectedRepeatRich: true,
  },
  {
    name: "Custom distance",
    input: {
      ...baseInput,
      distanceFamily: "10K",
      planGoalIntent: {
        distance: { kind: "custom", distanceKm: 30, label: "City 30K" },
        targetOutcomePace: "6:15/km",
        targetDate: "2026-10-04",
        targetFinishTime: "3:10:00",
      },
    },
    expectedEndpointMeters: 30_000,
    expectedFinalDate: "2026-10-04",
    expectedCustomDistance: true,
    expectedWorkoutGoalType: "distance_build",
    expectedRepeatRich: true,
  },
  {
    name: "Warning-only aggressive 10K",
    input: {
      ...baseInput,
      distanceFamily: "10K",
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        targetDate: "2026-06-19",
        targetFinishTime: "20:00",
      },
    },
    expectedEndpointMeters: 10_000,
    expectedFeasibility: "aggressive_or_short_horizon",
  },
  {
    name: "Warning-only aggressive Half Marathon",
    input: {
      ...baseInput,
      distanceFamily: "Half Marathon",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2026-07-02",
        targetFinishTime: "1:00:00",
      },
    },
    expectedEndpointMeters: 21_100,
    expectedFeasibility: "aggressive_or_short_horizon",
  },
  {
    name: "Awkward late-week start keeps Sunday long-run preference flexible",
    input: {
      ...baseInput,
      distanceFamily: "Half Marathon",
      startDate: "2026-06-11",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2026-09-20",
        targetFinishTime: "2:00:00",
      },
    },
    expectedEndpointMeters: 21_100,
    expectedFinalDate: "2026-09-20",
    expectedRepeatRich: true,
  },
] as const satisfies readonly Array<{
  name: string;
  input: RunningPlanPreviewActionInput;
  expectedEndpointMeters: number;
  expectedFinalDate?: string;
  expectedFeasibility?: "aggressive_or_short_horizon";
  expectedPreviewOutcome?: "preview_ready" | "preview_ready_with_warnings";
  expectedCustomDistance?: boolean;
  expectedWorkoutGoalType?: string;
  expectedRepeatRich?: boolean;
}>;

async function main() {
  assertNormalPreviewEntrypointUsesAiGeneratedPath();
  assertGeneratedPathUsesDatedOpenAiContract();
  assertLocalDevFixtureAvailabilityGating();

  const proofs = [];
  for (const scenario of scenarios) {
    const proof = await validateAiGeneratedScenario(scenario);
    proofs.push(proof);
  }

  await validateUnavailableDoesNotFallbackToDeterministicBuilder();
  await validateImpossibleGoalReturnsTypedReason();
  await validateDefaultLocalFixturePreviewPath();

  console.log("AI-generated running-plan creation contract checks passed.", {
    scenarios: proofs,
    deterministicBuilders: "removed",
  });
}

async function validateAiGeneratedScenario(scenario: (typeof scenarios)[number]) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) {
    throw new Error(resolved.message);
  }

  const fixturePreviewOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    env: localDevFixtureEnv(),
  });
  assert.notEqual(
    fixturePreviewOptions,
    null,
    "Local QA/dev fixture must be available in local-auth non-deployed validation env.",
  );
  const ledgerArtifactRoot = mkdtempSync(join(tmpdir(), "hito-ai-plan-ledger-success-"));

  const result = await buildReviewedAiGeneratedRunningPlanPreview(scenario.input, {
    aiPreview:
      fixturePreviewOptions == null
        ? undefined
        : {
            ...fixturePreviewOptions,
            generationLedger: {
              forceArtifactWrite: true,
              artifactRoot: ledgerArtifactRoot,
            },
          },
  });

  if (!result.ok) {
    rmSync(ledgerArtifactRoot, { recursive: true, force: true });
    throw new Error(
      `${scenario.name} must produce a reviewed AI-authored preview: ${result.unavailable.error.message} ${JSON.stringify(
        result.unavailable.error.issues,
      )}`,
    );
  }

  const draft = result.draft;
  const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
  const importedSeed = buildImportedPlanSeed(canonicalPlan);
  const finalNonRest = canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest")
    .at(-1);

  assert.equal(draft.sourceKind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(draft.source_kind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(isAiGeneratedRunningPlanPreviewDraft(draft), true);
  assert.equal(draft.callsOpenAi, true);
  assert.equal(draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
  assert.match(
    draft.aiGeneration.responseId ?? "",
    /local-dev-ai-generated-/,
    `${scenario.name} must be clearly marked as local QA/dev fixture output.`,
  );
  assertReviewedGenerationTrace({
    scenarioName: scenario.name,
    trace: draft.aiGeneration.generationTrace,
    expectedResponseId: draft.aiGeneration.responseId,
    expectedProviderKind: "local_dev_fixture",
    expectedPaidProviderCall: false,
    expectedArtifactRoot: ledgerArtifactRoot,
    expectedCanonicalRowCount: canonicalPlan.planned_workouts.length,
    expectedRunningWorkoutCount: canonicalPlan.planned_workouts.filter(
      (workout) => workout.workout_type !== "rest",
    ).length,
  });
  rmSync(ledgerArtifactRoot, { recursive: true, force: true });
  assert.equal(draft.reviewSafety.confirmCallsOpenAi, false);
  assert.equal(
    draft.previewOutcome,
    scenario.expectedPreviewOutcome ??
      (scenario.expectedFeasibility === "aggressive_or_short_horizon"
        ? "preview_ready_with_warnings"
        : "preview_ready"),
    `${scenario.name} must expose the expected typed preview outcome.`,
  );
  if (draft.previewOutcome === "preview_ready_with_warnings") {
    assert.ok(
      draft.previewWarnings.length > 0,
      `${scenario.name} warning outcome must include backend-authored warning assumptions.`,
    );
  } else {
    assert.deepEqual(draft.previewWarnings, []);
  }
  assert.equal(draft.endpointProof.endpointDistanceMeters, scenario.expectedEndpointMeters);
  if (scenario.expectedCustomDistance) {
    assert.equal(
      draft.normalizedInputSummary.planGoalIntent.distance?.kind,
      "custom",
      `${scenario.name} must preserve runner custom goal intent.`,
    );
    assert.notEqual(
      draft.endpointProof.endpointDistanceMeters,
      21_100,
      `${scenario.name} must not collapse the endpoint to half-marathon distance.`,
    );
  }
  assertDistanceGoalTruth({
    scenarioName: scenario.name,
    canonicalPlan,
    draft,
    expectedEndpointMeters: scenario.expectedEndpointMeters,
  });
  if (scenario.expectedWorkoutGoalType) {
    assertWorkoutGoalType(canonicalPlan, scenario.name, scenario.expectedWorkoutGoalType);
  }
  if (scenario.expectedFinalDate) {
    assert.equal(
      draft.endpointProof.finalDate,
      scenario.expectedFinalDate,
      `${scenario.name} endpoint workout must land on the authored target date.`,
    );
  }
  assert.equal(canonicalPlan.source_kind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.doesNotThrow(
    () => buildReviewedFirstPlanImportedSeed(canonicalPlan),
    `${scenario.name} reviewed canonical plan must pass first-plan persistence seed guards.`,
  );
  assertOpenAiAuthoredDatePlacement({
    scenarioName: scenario.name,
    canonicalPlan,
    metadata: draft.aiGeneration,
    fixedRestDays: draft.normalizedInputSummary.fixedRestDays,
  });
  assert.equal(importedSeed.workouts.length, canonicalPlan.planned_workouts.length);
  const richness = summarizeRunnerFacingCanonicalRichness({
    family: qualityFamilyForDistanceMeters(scenario.expectedEndpointMeters),
    runnerLevel: draft.normalizedInputSummary.runnerLevel,
    loadContext: draft.normalizedInputSummary.loadContext,
    rows: canonicalPlan.planned_workouts,
  });
  assert.deepEqual(
    richness.issues,
    [],
    `${scenario.name} richness issues: ${JSON.stringify({
      issues: richness.issues,
      sourceTypes: canonicalPlan.planned_workouts
        .filter((workout) => workout.workout_type !== "rest")
        .map((workout) => ({
          week: workout.week_number,
          type: workout.source_workout_type,
          identity: workout.workout_identity,
          family: workout.workout_family,
          title: workout.title,
        })),
    })}`,
  );
  const prescriptionGrammar = summarizeRunningPlanCanonicalPrescriptionGrammar(
    canonicalPlan.planned_workouts,
  );
  assert.deepEqual(
    prescriptionGrammar.issues,
    [],
    `${scenario.name} prescription grammar issues: ${JSON.stringify(prescriptionGrammar.issues)}`,
  );
  assert.equal(
    draft.normalizedInputSummary.planGoalIntent.metricTruthPolicy.segmentPaceTargetsAllowedFromGoal,
    false,
  );
  assert.equal(
    draft.normalizedInputSummary.planGoalIntent.metricTruthPolicy.hrTargetsAllowedFromGoal,
    false,
  );

  if (scenario.expectedFeasibility) {
    assert.equal(
      draft.normalizedInputSummary.planGoalIntent.feasibility.status,
      scenario.expectedFeasibility,
      `${scenario.name} must warn without blocking reviewed AI plan creation.`,
    );
    assert.match(
      JSON.stringify(draft.normalizedInputSummary.planGoalIntent.assumptions),
      /not promiseable|short horizon|aggressive/i,
    );
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
      ? `${scenario.name} review token must validate.`
      : `${scenario.name} review token must validate: ${exactness.reason} ${exactness.message}`,
  );
  assertDistanceGoalPersistenceMetadata({
    scenarioName: scenario.name,
    draft,
    canonicalPlan,
    expectedEndpointMeters: scenario.expectedEndpointMeters,
  });

  const decoded = await validateSelfContainedRunningPlanReviewToken({
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(decoded.ok, true, `${scenario.name} self-contained review token must decode.`);
  if (!decoded.ok) throw new Error(decoded.message);
  assert.deepEqual(jsonStable(decoded.canonicalPlan), jsonStable(canonicalPlan));
  assert.deepEqual(decoded.draft.previewInput, draft.previewInput);
  assertNoRunnerFacingFixtureCopy({
    scenarioName: scenario.name,
    canonicalPlan,
    importedSeed,
    previewRows: draft.calendarRows,
    decodedCanonicalPlan: decoded.canonicalPlan,
  });
  assertNoPersistedLegacyRepeatSignals({
    scenarioName: scenario.name,
    draft,
    decodedDraft: decoded.draft,
  });

  const staleSetup = await validateRunningPlanReviewExactness({
    draft: {
      ...draft,
      previewInput: {
        ...draft.previewInput,
        startDate: "2026-06-15",
      },
    },
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(staleSetup.ok, false, `${scenario.name} stale reviewed setup must reject.`);

  assertNoFakeMetricTruth(canonicalPlan);
  assertNoLegacyRepeatFieldsOrParentRepeatTargets(canonicalPlan);
  if (scenario.expectedRepeatRich) {
    assertRepeatRichChildrenWhereSportsSafe(canonicalPlan, scenario.name);
  }

  return {
    name: scenario.name,
    sourceKind: draft.sourceKind,
    endpointMeters: draft.endpointProof.endpointDistanceMeters,
    reviewTokenBytes: draft.reviewToken.length,
    feasibility: draft.normalizedInputSummary.planGoalIntent.feasibility.status,
  };
}

async function validateUnavailableDoesNotFallbackToDeterministicBuilder() {
  const unavailable = await buildReviewedAiGeneratedRunningPlanPreview(scenarios[0].input, {
    aiPreview: {
      apiKey: null,
      model: "mock-ai-generated-plan",
      today: "2026-06-08",
    },
  });

  assert.equal(unavailable.ok, false, "AI unavailable must not use deterministic fallback.");
  if (unavailable.ok) {
    throw new Error("AI unavailable unexpectedly returned a reviewed draft.");
  }

  assert.equal(unavailable.unavailable.sourceKind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(unavailable.unavailable.persisted, false);
  assert.equal(unavailable.unavailable.callsOpenAi, true);
  assert.equal(unavailable.unavailable.previewOutcome, "ai_unavailable_retryable");
  assert.match(unavailable.unavailable.error.message, /OpenAI|AI|unavailable/i);

  const ledgerArtifactRoot = mkdtempSync(join(tmpdir(), "hito-ai-plan-ledger-failure-"));
  try {
    const invalid = await buildReviewedAiGeneratedRunningPlanPreview(scenarios[0].input, {
      aiPreview: {
        apiKey: "paid-openai-ledger-validation-key",
        model: "gpt-5-ledger-validation",
        today: "2026-06-08",
        generationLedger: {
          forceArtifactWrite: true,
          artifactRoot: ledgerArtifactRoot,
        },
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              id: "resp_invalid_ai_generation_ledger_validation",
              status: "completed",
              output_text: JSON.stringify({
                schemaVersion: "ai-first-plan-blueprint-v1",
                weeks: [],
              }),
              usage: {
                input_tokens: 321,
                output_tokens: 654,
                total_tokens: 975,
              },
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          ),
      },
    });

    assert.equal(invalid.ok, false, "Invalid AI blueprint must return unavailable.");
    if (invalid.ok) {
      throw new Error("Invalid AI blueprint unexpectedly produced reviewed preview.");
    }

    const trace = invalid.unavailable.debug.generationTrace;
    assert.notEqual(trace, null, "Invalid AI blueprint must still return generation trace.");
    if (!trace) throw new Error("Missing invalid AI blueprint generation trace.");
    assert.equal(trace.provider.responseId, "resp_invalid_ai_generation_ledger_validation");
    assert.equal(invalid.unavailable.previewOutcome, "internal_validation_bug");
    assert.equal(trace.provider.kind, "openai_responses_api");
    assert.equal(trace.provider.paidProviderCall, true);
    assert.equal(trace.usage.inputTokens, 321);
    assert.equal(trace.usage.outputTokens, 654);
    assert.equal(trace.usage.totalTokens, 975);
    assert.equal(trace.pipeline.parseStatus, "parsed_json");
    assert.equal(trace.pipeline.normalizationStatus, "failed");
    assert.equal(trace.pipeline.finalOutcome, "unavailable");
    assert.match(trace.pipeline.unavailableReason ?? "", /blueprint/i);
    assert.equal(
      invalid.unavailable.debug.previewActionTrace.provider?.responseId,
      "resp_invalid_ai_generation_ledger_validation",
    );
    assert.equal(invalid.unavailable.debug.previewActionTrace.liveOpenAiCalled, true);
    assert.match(
      JSON.stringify(invalid.unavailable.debug.previewActionTrace.validationIssues),
      /schema_invalid|week/i,
    );
    assert.equal(trace.artifacts.written, true);
    assert.ok(trace.artifacts.path?.startsWith(ledgerArtifactRoot));
    assert.ok(trace.artifacts.path && existsSync(trace.artifacts.path));
    const artifact = JSON.parse(readFileSync(trace.artifacts.path, "utf8")) as {
      provider?: { responseId?: string | null };
      usage?: { totalTokens?: number | null };
      pipeline?: { finalOutcome?: string | null };
    };
    assert.equal(artifact.provider?.responseId, trace.provider.responseId);
    assert.equal(artifact.usage?.totalTokens, trace.usage.totalTokens);
    assert.equal(artifact.pipeline?.finalOutcome, trace.pipeline.finalOutcome);
  } finally {
    rmSync(ledgerArtifactRoot, { recursive: true, force: true });
  }
}

async function validateImpossibleGoalReturnsTypedReason() {
  const impossible = await buildReviewedAiGeneratedRunningPlanPreview({
    ...baseInput,
    distanceFamily: "Marathon Completion",
    planGoalIntent: {
      distance: { kind: "preset", preset: "Marathon" },
      targetDate: "2026-06-14",
      targetFinishTime: "4:00:00",
    },
  });

  assert.equal(impossible.ok, false, "Marathon in one week must not produce a reviewed draft.");
  if (impossible.ok) {
    throw new Error("Impossible marathon unexpectedly returned a reviewed draft.");
  }

  assert.equal(impossible.unavailable.previewOutcome, "impossible_goal_with_reason");
  assert.equal(impossible.unavailable.error.code, "impossible_plan_goal");
  assert.match(impossible.unavailable.error.message, /marathon.*not enough time/i);
  assert.equal(impossible.unavailable.debug.previewActionTrace.liveOpenAiCalled, false);
}

async function validateDefaultLocalFixturePreviewPath() {
  const previousEnv = snapshotEnv([
    "HITO_AI_GENERATED_PLAN_DEV_FIXTURE",
    "LOCAL_AUTH_BYPASS_ENABLED",
    "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
    "VERCEL",
    "CI",
  ]);

  try {
    process.env.LOCAL_AUTH_BYPASS_ENABLED = "true";
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = "scripts/fixtures/local-auth-users.json";
    delete process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE;
    delete process.env.VERCEL;
    delete process.env.CI;

    const result = await buildReviewedAiGeneratedRunningPlanPreview(scenarios[4].input);
    assert.equal(
      result.ok,
      true,
      result.ok
        ? "Default local fixture preview path must return a reviewed draft."
        : result.unavailable.error.message,
    );
    if (!result.ok) {
      throw new Error(result.unavailable.error.message);
    }

    assert.equal(result.draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
    assert.equal(
      result.draft.aiGeneration.generationTrace?.provider.kind,
      "local_dev_fixture",
      "Server-action default options should use the same local fixture in local-auth QA/dev runtime.",
    );
  } finally {
    restoreEnv(previousEnv);
  }
}

function assertReviewedGenerationTrace(input: {
  scenarioName: string;
  trace: AiPlanGenerationLedgerTrace | null;
  expectedResponseId: string | null;
  expectedProviderKind: "openai_responses_api" | "local_dev_fixture";
  expectedPaidProviderCall: boolean;
  expectedArtifactRoot: string;
  expectedCanonicalRowCount: number;
  expectedRunningWorkoutCount: number;
}) {
  assert.notEqual(input.trace, null, `${input.scenarioName} must return a generation trace.`);
  if (!input.trace) {
    throw new Error(`${input.scenarioName} missing generation trace.`);
  }

  assert.equal(input.trace.provider.responseId, input.expectedResponseId);
  assert.equal(input.trace.provider.kind, input.expectedProviderKind);
  assert.equal(input.trace.provider.paidProviderCall, input.expectedPaidProviderCall);
  assert.equal(input.trace.pipeline.parseStatus, "parsed_json");
  assert.equal(input.trace.pipeline.normalizationStatus, "normalized");
  assert.equal(input.trace.pipeline.finalOutcome, "reviewed_draft_signed");
  assert.equal(input.trace.pipeline.canonicalRowCount, input.expectedCanonicalRowCount);
  assert.equal(input.trace.pipeline.runningWorkoutCount, input.expectedRunningWorkoutCount);
  assert.equal(input.trace.output.sanitizedPayloadStored, false);
  assert.match(input.trace.request.promptHash, /^[a-f0-9]{64}$/);
  assert.match(input.trace.output.rawOutputHash ?? "", /^[a-f0-9]{64}$/);
  assert.equal(input.trace.artifacts.written, true);
  assert.ok(input.trace.artifacts.path?.startsWith(input.expectedArtifactRoot));
  assert.ok(input.trace.artifacts.path && existsSync(input.trace.artifacts.path));
}

function assertNormalPreviewEntrypointUsesAiGeneratedPath() {
  const source = readFileSync("src/lib/running-plan-engine-actions.ts", "utf8");
  const handlerStart = source.indexOf("export const previewRunningPlanDraft");
  const handlerEnd = source.indexOf("export const confirmRunningPlanDraft", handlerStart);
  const handlerSource = source.slice(handlerStart, handlerEnd);

  assert.match(
    handlerSource,
    /buildReviewedAiGeneratedRunningPlanPreview/,
    "Runner-facing selected-plan preview must call the unified AI-generated plan path.",
  );
  assert.doesNotMatch(
    handlerSource,
    /buildReviewedRunningPlanPreview\(data\)|buildRunningPlanPreview\(data\)/,
    "Runner-facing selected-plan preview must not silently use deterministic builders.",
  );
}

function assertGeneratedPathUsesDatedOpenAiContract() {
  const generatedSource = readFileSync("src/lib/ai-generated-running-plan.ts", "utf8");
  const fixtureSource = readFileSync("src/lib/ai-generated-running-plan-dev-fixture.ts", "utf8");
  const serviceSource = readFileSync("src/lib/ai-first-plan-draft-service.ts", "utf8");
  const promptSource = readFileSync("src/lib/ai-first-plan-blueprint-prompt.ts", "utf8");

  assert.doesNotMatch(
    generatedSource,
    /blueprintDateAuthorshipMode|blueprintMaxAuthoredHorizonWeeks|allowDeterministicFallback/,
    "Generated-plan preview must not expose legacy date-authorship mode toggles.",
  );
  assert.match(
    promptSource,
    /OpenAI-authored dated plan constraints/,
    "Generated-plan prompt must make OpenAI/local fixture author dated workouts.",
  );
  assert.doesNotMatch(
    fixtureSource,
    /buildStructuredAuthoringPlan|buildRequiredCadenceSlots|Required authored workout slots|backend_required_slots/,
    "Local QA/dev fixture must not build product plans through deterministic required slots.",
  );
  assert.match(
    serviceSource,
    /useDeterministicSupport:\s*false/,
    "Generated-plan normalization must not use deterministic support as hidden dated plan truth.",
  );
  assert.doesNotMatch(
    serviceSource,
    /allowDeterministicFallback|deterministicFallback\(|backend_required_slots/,
    "Generated-plan service must not keep a deterministic fallback product path.",
  );
}

function assertOpenAiAuthoredDatePlacement(input: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
  metadata: {
    datePlacement?: DatePlacementTrace | null;
    blueprintTrace?: { datePlacement?: DatePlacementTrace | null } | null;
  };
  fixedRestDays: readonly string[];
}) {
  const datePlacement =
    input.metadata.datePlacement ?? input.metadata.blueprintTrace?.datePlacement ?? null;
  const nonRestWorkouts = input.canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_type !== "rest",
  );

  assert.notEqual(datePlacement, null, `${input.scenarioName} must return date placement trace.`);
  if (!datePlacement) throw new Error(`${input.scenarioName} missing date placement trace.`);
  assert.equal(datePlacement.mode, "openai_authored_dated_plan");
  assert.equal(datePlacement.authoredDateSource, "local_fixture_authored_date");
  assert.notEqual(datePlacement.validationStatus, "backend_rejected_date");
  assert.equal(datePlacement.explicitAuthoredWorkoutDateCount, nonRestWorkouts.length);
  assert.equal(datePlacement.missingAuthoredWorkoutDateCount, 0);
  assert.equal(datePlacement.backendExtendedWeeks, 0);

  for (const workout of nonRestWorkouts) {
    assert.match(workout.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(
      input.fixedRestDays.includes(workout.weekday),
      false,
      `${input.scenarioName} must not author workouts on fixed rest day ${workout.weekday}.`,
    );
  }
}

type DatePlacementTrace = {
  mode: string;
  authoredDateSource: string;
  validationStatus: string;
  explicitAuthoredWorkoutDateCount: number | null;
  missingAuthoredWorkoutDateCount: number | null;
  backendExtendedWeeks: number | null;
};

function assertLocalDevFixtureAvailabilityGating() {
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled(localDevFixtureEnv()),
    true,
    "Local QA/dev fixture should auto-enable only for local-auth non-deployed runtime.",
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      ...localDevFixtureEnv(),
      HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "false",
    }),
    false,
    "Explicit false must disable the local QA/dev fixture.",
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      ...localDevFixtureEnv(),
      VERCEL: "1",
    }),
    false,
    "Deployed runtimes must not enable the local QA/dev fixture.",
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
      LOCAL_AUTH_BYPASS_ENABLED: "false",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "",
    }),
    false,
    "Explicit true still requires local auth bypass so production cannot opt in accidentally.",
  );
}

function localDevFixtureEnv() {
  return {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "scripts/fixtures/local-auth-users.json",
  };
}

function assertNoRunnerFacingFixtureCopy(input: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
  importedSeed: ReturnType<typeof buildImportedPlanSeed>;
  previewRows: unknown;
  decodedCanonicalPlan: unknown;
}) {
  const serialized = JSON.stringify({
    canonicalPlan: input.canonicalPlan,
    importedSeed: input.importedSeed,
    previewRows: input.previewRows,
    decodedCanonicalPlan: input.decodedCanonicalPlan,
  });

  assert.doesNotMatch(
    serialized,
    /Mock AI|Local QA\/dev AI fixture|Local QA\/dev mock|mock OpenAI/i,
    `${input.scenarioName} runner-facing canonical/readback output must not expose fixture copy.`,
  );
}

function assertNoPersistedLegacyRepeatSignals(input: {
  scenarioName: string;
  draft: { validation: unknown };
  decodedDraft: unknown;
}) {
  const serialized = JSON.stringify({
    validation: input.draft.validation,
    decodedDraft: input.decodedDraft,
  });

  assert.doesNotMatch(
    serialized,
    /repeat_unit|recovery_unit/,
    `${input.scenarioName} persisted review metadata must not carry stale repeat_unit/recovery_unit vocabulary.`,
  );
}

function assertDistanceGoalTruth(input: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
  draft: {
    normalizedInputSummary: { planGoalIntent: { distance: { distanceMeters: number } | null } };
  };
  expectedEndpointMeters: number;
}) {
  assert.equal(
    input.canonicalPlan.goal.goal_type,
    "distance_build",
    `${input.scenarioName} canonical plan goal must use unified distance_build truth.`,
  );
  assert.equal(
    input.draft.normalizedInputSummary.planGoalIntent.distance?.distanceMeters,
    input.expectedEndpointMeters,
    `${input.scenarioName} signed normalized goal intent must carry exact distanceMeters.`,
  );
  assertWorkoutGoalType(input.canonicalPlan, input.scenarioName, "distance_build");
}

function assertDistanceGoalPersistenceMetadata(input: {
  scenarioName: string;
  draft: Parameters<typeof buildRunningPlanPersistenceMetadata>[0]["draft"];
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
  expectedEndpointMeters: number;
}) {
  const metadata = buildRunningPlanPersistenceMetadata({
    draft: input.draft,
    canonicalPlan: input.canonicalPlan,
    reviewChecksum: input.draft.reviewChecksum,
  });
  const goalMetadata = metadata.goalMetadata as {
    selected_plan_engine?: {
      family?: string;
      legacy_family_bucket?: string;
      ui_distance_family?: string;
      distance_goal?: { goal_type?: string; distance_meters?: number };
    };
  };

  assert.equal(
    goalMetadata.selected_plan_engine?.family,
    undefined,
    `${input.scenarioName} AI-generated persistence metadata must not store family as product truth.`,
  );
  assert.equal(
    goalMetadata.selected_plan_engine?.legacy_family_bucket,
    undefined,
    `${input.scenarioName} persistence metadata must not store legacy family buckets.`,
  );
  assert.equal(
    goalMetadata.selected_plan_engine?.ui_distance_family,
    undefined,
    `${input.scenarioName} persistence metadata must not store UI distance family buckets.`,
  );
  assert.equal(
    goalMetadata.selected_plan_engine?.distance_goal?.goal_type,
    "distance_build",
    `${input.scenarioName} persistence metadata must expose distance_goal product truth.`,
  );
  assert.equal(
    goalMetadata.selected_plan_engine?.distance_goal?.distance_meters,
    input.expectedEndpointMeters,
    `${input.scenarioName} persistence metadata must preserve exact distanceMeters.`,
  );
}

function assertWorkoutGoalType(
  plan: ReturnType<typeof buildRunningPlanCanonicalPlan>,
  scenarioName: string,
  expectedGoalType: string,
) {
  const nonRestGoalTypes = new Set(
    plan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.goal_context?.goal_type ?? null),
  );

  assert.deepEqual(
    [...nonRestGoalTypes],
    [expectedGoalType],
    `${scenarioName} persisted workout goal_context must remain ${expectedGoalType}.`,
  );
}

function assertNoFakeMetricTruth(plan: ReturnType<typeof buildRunningPlanCanonicalPlan>) {
  const serialized = JSON.stringify(plan);

  assert.doesNotMatch(serialized, /personal_hr|personal_hr_zone|measured_threshold/i);
  assert.doesNotMatch(serialized, /goal[_-]?pace|target_outcome_pace_as_workout_target/i);
}

function assertNoLegacyRepeatFieldsOrParentRepeatTargets(
  plan: ReturnType<typeof buildRunningPlanCanonicalPlan>,
) {
  const serialized = JSON.stringify(plan);

  assert.doesNotMatch(serialized, /repeat_unit|recovery_unit/);

  for (const workout of plan.planned_workouts) {
    for (const segment of workout.segments) {
      if (segment.prescription?.mode === "repeats") {
        assert.equal(
          segment.target,
          undefined,
          "Repeat parent must stay structural-only; child blocks own target/readback truth.",
        );
      }
    }
  }
}

function assertRepeatRichChildrenWhereSportsSafe(
  plan: ReturnType<typeof buildRunningPlanCanonicalPlan>,
  scenarioName: string,
) {
  const repeatSegments = plan.planned_workouts.flatMap((workout) =>
    workout.segments.filter((segment) => segment.prescription?.mode === "repeats"),
  );
  const repeatWithChildren = repeatSegments.find(
    (segment) =>
      segment.prescription?.mode === "repeats" &&
      Array.isArray(segment.prescription.children) &&
      segment.prescription.children.length >= 2,
  );

  assert.ok(
    repeatWithChildren,
    `${scenarioName} fixture plan should include at least one structural Repeat set with ordered children[].`,
  );
}

function qualityFamilyForDistanceMeters(
  meters: number,
): RunningPlanPreviewActionInput["distanceFamily"] {
  if (meters <= 10_000) return "10K";
  if (meters <= 21_100) return "Half Marathon";
  return "Marathon Completion";
}

function jsonStable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function snapshotEnv(keys: readonly string[]) {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
