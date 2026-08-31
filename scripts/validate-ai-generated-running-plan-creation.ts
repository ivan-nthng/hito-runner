import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
  AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
  AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
  buildAiGeneratedRunningPlanDevFixtureProviderDraft,
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  buildAiGeneratedRunningPlanQaFixtureAuthoringInput,
  buildProspectiveAiGeneratedRunningPlanQaFixtureAuthoringInput,
  isAiGeneratedRunningPlanDevFixtureEnabled,
  resolveAiGeneratedRunningPlanDevFixtureDelayMs,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import {
  DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS,
  generateAiFirstPlanDraftPreview,
  resolveAiPlanStructuredResponseProviderSettings,
} from "../src/lib/ai-first-plan-draft-service";
import { validateAdaptiveTrainingDecisionGoldenProof } from "./adaptive-training-decision-golden-proof";
import { retainAdaptiveTrainingSourceCandidateForUser } from "../src/lib/adaptive-blueprint-persistence";
import {
  areMateriallyEquivalentAiFirstPlanRequestContexts,
  getAiPlanGenerationResponseByProviderIdForUser,
  getAiPlanGenerationResponseForUser,
  getReusableAiPlanGenerationResponseForUser,
  isCurrentAiPlanGenerationResponseLineageForCandidate,
  recordAiPlanGenerationAttemptResultForUser,
  recordAiPlanGenerationResponseOutcomeForUser,
  recordAiPlanGenerationReviewVerdictForUser,
  retainCompletedAiPlanGenerationResponseForUser,
  type AiPlanGenerationAttemptVersionContext,
} from "../src/lib/ai-plan-generation-response-persistence";
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
  AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
  AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  compileAiAuthoredPlanFirstDraft,
} from "../src/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION,
  AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN,
  AI_AUTHORED_PLAN_FIRST_PROVIDER_CONTRACT_VERSION,
  AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
  aiAuthoredPlanFirstCompilerDraftSchema,
  buildAiAuthoredPlanFirstPrompt,
  resolveAiAuthoredPlanFirstDetailedEndDate,
  type AiAuthoredPlanFirstCompilerDraft,
  type AiAuthoredPlanFirstCompilerUnit,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildAiGeneratedRunningPlanPreview as buildAiGeneratedRunningPlanPreviewRuntime,
  buildAiGeneratedRunningPlanAuthoringInput as buildAiGeneratedRunningPlanAuthoringInputRuntime,
} from "../src/lib/ai-generated-running-plan";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import { DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE } from "../src/lib/local-auth-account-registry.server";
import { buildReviewedFirstPlanImportedSeed } from "../src/lib/active-plan-persistence";
import {
  confirmRunningPlanDraftForUser,
  projectRunningPlanPreviewResultForProduct,
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
import { normalizePlanGoalIntent } from "../src/lib/plan-creation-engine/plan-goal-intent";
import { GENERATED_PLAN_RUNNER_COMMENT_MAX_LENGTH } from "../src/lib/structured-plan-authoring-schema";
import { addDaysIso, startOfWeekIso } from "../src/lib/training";
import type { Database, Json } from "../src/lib/supabase/database";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import {
  parsePositiveIntegerOption,
  resolveDirectCanaryTimeoutPolicy,
} from "./ai-first-plan-draft-ops/cli";
import { validatePlanFirstHeartRateTargetContract } from "./plan-first-heart-rate-target-proof";
import {
  formatDisposablePersistenceBlocker,
  readDisposablePersistenceCliOptions,
  resolveDisposablePersistencePreflight,
} from "./lib/qa-pool-persistence-proof";
import {
  buildAiGeneratedRunningPlanAuthoringInput,
  buildReviewedAiGeneratedRunningPlanPreview,
  validatePlanFirstProviderRepresentationContract,
} from "./plan-first-provider-representation-proof";
import {
  buildProofPersonalRunnerCapability,
  buildProofRunnerCapability,
} from "./runner-plan-capability-proof-helpers";

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
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        targetDate: "2026-08-02",
      },
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

function buildAiGeneratedRunningPlanPreview(
  input: RunningPlanPreviewActionInput,
  options: Parameters<typeof buildAiGeneratedRunningPlanPreviewRuntime>[1] = {},
) {
  const profile = buildProofRunnerCapability(input);
  return buildAiGeneratedRunningPlanPreviewRuntime(input, {
    ...options,
    runnerCapability: options.runnerCapability ?? profile.runnerCapability,
    acceptedHeartRateProfile: options.acceptedHeartRateProfile ?? profile.acceptedHeartRateProfile,
  });
}

validateDirectLiveCanaryTimeoutPolicy();
validatePlanFirstHeartRateTargetContract();
await validatePlanFirstPreviewScenarios();
validateAdaptiveTrainingDecisionGoldenProof();
await validatePlanFirstAuthoringAuthority();
await validateRunnerPlanCapabilityAdmissionContract();
await validateRunnerPlanCommentContract();
await validateFaithfulPlanFirstAtomization();
validateDistanceFirstInputTruth();
await validateFirstPlanGenerationLifecycle();
await validateTypedPlanFirstFailureOutcomes();
await validatePlanFirstProviderRepresentationContract();
await validateLocalDevFixtureAvailabilityGating();
await validateLocalGenerationIncidentTrail();
if (readDisposablePersistenceCliOptions().requirePersistence) {
  await validateCompletedAiPlanResponseRetentionPersistence();
}

console.log("AI-generated plan-first creation contract checks passed.", {
  scenarios: scenarios.map((scenario) => scenario.name),
  sourceKind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  contractMode: "adaptive_blueprint_four_week",
});

async function validateCompletedAiPlanResponseRetentionPersistence() {
  const preflight = resolveDisposablePersistencePreflight({
    options: readDisposablePersistenceCliOptions(),
    includeNotRequested: false,
    envIncompleteReason:
      "AI plan response retention persistence proof requires the repository-managed local Supabase environment.",
    envIncompleteOverrideHint:
      "Run the repository local Supabase configure/status procedure before this proof.",
    invalidUrlReason: "The configured Supabase URL is invalid.",
    invalidUrlOverrideHint: "Restore the repository-managed local Supabase environment.",
    nonLoopbackBlockedReason:
      "AI plan response retention persistence proof is restricted to disposable loopback Supabase.",
    nonLoopbackOverrideHint: "Use the repository-managed local Supabase target only.",
  });
  if (!preflight.shouldRun) {
    throw new Error(
      formatDisposablePersistenceBlocker("AI plan response retention proof", preflight),
    );
  }

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  assert.ok(publishableKey, "Local Supabase publishable key must be configured.");
  const admin = createAdminSupabaseClient();
  const createdUserIds: string[] = [];
  const password = `Ai-Retention-Proof-Aa1-${crypto.randomUUID()}`;
  const ownerEmail = `ai-retention-owner-${crypto.randomUUID()}@example.test`;
  const otherEmail = `ai-retention-other-${crypto.randomUUID()}@example.test`;

  try {
    const ownerCreate = await admin.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
    });
    assert.equal(ownerCreate.error, null, "Disposable response owner creation must succeed.");
    assert.ok(ownerCreate.data.user);
    createdUserIds.push(ownerCreate.data.user!.id);

    const otherCreate = await admin.auth.admin.createUser({
      email: otherEmail,
      password,
      email_confirm: true,
    });
    assert.equal(otherCreate.error, null, "Disposable isolation user creation must succeed.");
    assert.ok(otherCreate.data.user);
    createdUserIds.push(otherCreate.data.user!.id);

    const ownerId = ownerCreate.data.user!.id;
    const otherId = otherCreate.data.user!.id;
    const clientOptions = {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    };
    const ownerClient = createClient<Database>(preflight.target.url, publishableKey, clientOptions);
    const otherClient = createClient<Database>(preflight.target.url, publishableKey, clientOptions);
    const ownerSignIn = await ownerClient.auth.signInWithPassword({
      email: ownerEmail,
      password,
    });
    const otherSignIn = await otherClient.auth.signInWithPassword({
      email: otherEmail,
      password,
    });
    assert.equal(ownerSignIn.error, null, "Disposable response owner sign-in must succeed.");
    assert.equal(otherSignIn.error, null, "Disposable isolation sign-in must succeed.");

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
    const validDraft = parseFixtureProviderDraft(fixtureBody.output_text);
    const invalidCompilerDraft = structuredClone(validDraft);
    const firstRunningWorkout = invalidCompilerDraft.detailed_block.workouts[0];
    assert.ok(firstRunningWorkout, "Retention proof requires a running workout.");
    firstRunningWorkout!.date = "2026-07-10";

    const schemaResponseId = `resp_schema_${crypto.randomUUID()}`;
    const schemaRejectedJson = ` \n${JSON.stringify({ workouts: [], endpoint: null }, null, 2)}\n `;
    const schemaRejected = await generateAiFirstPlanDraftPreview({
      input: resolved.authoringInput,
      apiKey: "synthetic-retention-schema-proof",
      model: "gpt-5.2-retention-schema-proof",
      today: scenario.input.startDate,
      candidateOwnerUserId: ownerId,
      generationLedger: { disabled: true },
      fetchImpl: async () =>
        jsonResponse({
          id: schemaResponseId,
          status: "completed",
          output_text: schemaRejectedJson,
        }),
    });
    assert.equal(schemaRejected.ok, false, "Schema rejection must remain unavailable.");
    const schemaRow = await getAiPlanGenerationResponseByProviderIdForUser(
      ownerId,
      schemaResponseId,
    );
    assert.ok(schemaRow, "Parseable JSON must be retained before schema rejection.");
    assert.equal(schemaRow!.response_body, schemaRejectedJson);
    assert.equal(schemaRow!.schema_outcome, "rejected");
    assert.equal(schemaRow!.compiler_outcome, "not_run");
    assert.match(schemaRow!.diagnostic_code ?? "", /^[a-z0-9._-]+$/);
    assert.match(schemaRow!.diagnostic_path ?? "", /^[A-Za-z0-9._[\]-]+$/);

    const compilerResponseId = `resp_compiler_${crypto.randomUUID()}`;
    const compilerRejectedJson = JSON.stringify(invalidCompilerDraft, null, 2);
    const compilerRejected = await generateAiFirstPlanDraftPreview({
      input: resolved.authoringInput,
      apiKey: "synthetic-retention-compiler-proof",
      model: "gpt-5.2-retention-compiler-proof",
      today: scenario.input.startDate,
      candidateOwnerUserId: ownerId,
      generationLedger: { disabled: true },
      fetchImpl: async () =>
        jsonResponse({
          id: compilerResponseId,
          status: "completed",
          output_text: compilerRejectedJson,
        }),
    });
    assert.equal(compilerRejected.ok, false, "Compiler rejection must remain unavailable.");
    const compilerRow = await getAiPlanGenerationResponseByProviderIdForUser(
      ownerId,
      compilerResponseId,
    );
    assert.ok(compilerRow, "Parseable JSON must survive compiler rejection.");
    assert.equal(compilerRow!.response_body, compilerRejectedJson);
    assert.equal(compilerRow!.schema_outcome, "accepted");
    assert.equal(compilerRow!.compiler_outcome, "rejected");
    assert.equal(compilerRow!.diagnostic_code, "ai_authored_plan_first_date_out_of_range");
    assert.equal(compilerRow!.diagnostic_path, "detailed_block.workouts.0.date");
    assert.ok(compilerRow!.request_context, "Provider attempts must retain exact request facts.");
    assert.match(compilerRow!.request_fingerprint_sha256 ?? "", /^[0-9a-f]{64}$/);
    assert.ok(compilerRow!.version_context, "Provider attempts must freeze their version set.");
    assert.match(compilerRow!.version_fingerprint_sha256 ?? "", /^[0-9a-f]{64}$/);
    assert.equal(compilerRow!.provider_model, "gpt-5.2-retention-compiler-proof");
    assert.ok(
      compilerRow!.provider_attempt,
      "Provider attempts must retain usage and timing facts.",
    );
    assert.equal(
      (compilerRow!.attempt_result as { outcome?: unknown } | null)?.outcome,
      "technical_rejection",
    );
    const compilerPrompt = buildAiAuthoredPlanFirstPrompt({
      authoringInput: resolved.authoringInput,
      today: scenario.input.startDate,
    });
    const compilerVersionContext: AiPlanGenerationAttemptVersionContext = {
      schemaVersion: AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
      promptVersion: AI_AUTHORED_PLAN_FIRST_PROVIDER_CONTRACT_VERSION,
      policyVersion: AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION,
      compilerVersion: AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
      providerSettings: resolveAiPlanStructuredResponseProviderSettings({
        model: compilerRow!.provider_model!,
        contractMode: compilerRejected.metadata.generationTrace!.request.contractMode,
        responseSchemaMode: compilerRejected.metadata.generationTrace!.request.responseSchemaMode,
        responseSchemaName: AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
        timeoutMs: compilerRejected.metadata.generationTrace!.request.timeoutMs,
        maxOutputTokens: compilerRejected.metadata.generationTrace!.request.maxOutputTokens,
      }),
    };
    const exactReusable = await getReusableAiPlanGenerationResponseForUser({
      userId: ownerId,
      requestContext: resolved.authoringInput,
      versionContext: compilerVersionContext,
      providerModel: compilerRow!.provider_model!,
      prompt: compilerPrompt,
    });
    assert.equal(
      exactReusable?.id,
      compilerRow!.id,
      "Exact duplicate lookup must return the immutable owner response.",
    );
    const foreignReusable = await getReusableAiPlanGenerationResponseForUser({
      userId: otherId,
      requestContext: resolved.authoringInput,
      versionContext: compilerVersionContext,
      providerModel: compilerRow!.provider_model!,
      prompt: compilerPrompt,
    });
    assert.equal(foreignReusable, null, "An exact request hash must remain owner-isolated.");
    const changedSettingsReusable = await getReusableAiPlanGenerationResponseForUser({
      userId: ownerId,
      requestContext: resolved.authoringInput,
      versionContext: {
        ...compilerVersionContext,
        providerSettings: {
          ...compilerVersionContext.providerSettings,
          maxOutputTokens: compilerVersionContext.providerSettings.maxOutputTokens + 1,
        },
      },
      providerModel: compilerRow!.provider_model!,
      prompt: compilerPrompt,
    });
    assert.equal(
      changedSettingsReusable,
      null,
      "A provider-settings change must not reuse a retained response.",
    );

    const acceptedResponseId = `resp_accepted_${crypto.randomUUID()}`;
    const accepted = await generateAiFirstPlanDraftPreview({
      input: resolved.authoringInput,
      apiKey: "synthetic-retention-accepted-proof",
      model: "gpt-5.2-retention-accepted-proof",
      today: scenario.input.startDate,
      candidateOwnerUserId: ownerId,
      generationLedger: { disabled: true },
      fetchImpl: async () =>
        jsonResponse({
          id: acceptedResponseId,
          status: "completed",
          output_text: fixtureBody.output_text,
        }),
    });
    assert.equal(accepted.ok, true, accepted.ok ? "" : accepted.message);
    const acceptedRow = await getAiPlanGenerationResponseByProviderIdForUser(
      ownerId,
      acceptedResponseId,
    );
    assert.ok(acceptedRow, "Accepted parseable JSON must also be retained.");
    assert.equal(acceptedRow!.response_body, fixtureBody.output_text);
    assert.equal(acceptedRow!.schema_outcome, "accepted");
    assert.equal(acceptedRow!.compiler_outcome, "accepted");
    assert.equal(acceptedRow!.diagnostic_code, null);
    assert.equal(acceptedRow!.diagnostic_path, null);
    assert.ok(
      accepted.retainedSourceCandidate,
      "An accepted owner-bound response must retain its Blueprint and detailed candidate.",
    );
    const localFixtureResponseId = `local_fixture_accepted_${crypto.randomUUID()}`;
    const localFixtureAccepted = await generateAiFirstPlanDraftPreview({
      input: resolved.authoringInput,
      apiKey: "local-qa-dev-ai-generated-plan-fixture",
      model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
      today: scenario.input.startDate,
      candidateOwnerUserId: ownerId,
      generationLedger: { disabled: true },
      fetchImpl: async () =>
        jsonResponse({
          id: localFixtureResponseId,
          status: "completed",
          output_text: fixtureBody.output_text,
        }),
    });
    assert.equal(
      localFixtureAccepted.ok,
      true,
      localFixtureAccepted.ok ? "" : localFixtureAccepted.message,
    );
    if (!localFixtureAccepted.ok) throw new Error(localFixtureAccepted.message);
    assert.ok(
      localFixtureAccepted.retainedSourceCandidate,
      "An accepted owner-bound local fixture must retain its response and source candidate.",
    );
    const localFixtureResponse = await getAiPlanGenerationResponseByProviderIdForUser(
      ownerId,
      localFixtureResponseId,
    );
    assert.ok(localFixtureResponse, "The accepted local fixture response must be retained.");
    assert.equal(localFixtureResponse!.provider_model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
    const volatileAcceptedRetryInput = structuredClone(resolved.authoringInput);
    volatileAcceptedRetryInput.runnerCapability = {
      ...volatileAcceptedRetryInput.runnerCapability,
      vectorId: "1".repeat(64),
      snapshot: {
        ...volatileAcceptedRetryInput.runnerCapability.snapshot,
        snapshotId: "accepted-volatile-retry",
      },
    };
    let duplicateInitialDispatches = 0;
    const acceptedDuplicate = await generateAiFirstPlanDraftPreview({
      input: volatileAcceptedRetryInput,
      apiKey: null,
      model: "gpt-5.2-retention-accepted-proof",
      today: scenario.input.startDate,
      candidateOwnerUserId: ownerId,
      generationLedger: { disabled: true },
      fetchImpl: async () => {
        duplicateInitialDispatches += 1;
        throw new Error("A materially unchanged retained initial request must not dispatch.");
      },
    });
    assert.equal(
      acceptedDuplicate.ok,
      true,
      acceptedDuplicate.ok
        ? ""
        : `${acceptedDuplicate.reason}:${acceptedDuplicate.metadata.unavailableReason}`,
    );
    assert.equal(duplicateInitialDispatches, 0);
    assert.equal(acceptedDuplicate.metadata.responseId, acceptedResponseId);

    const { requestContext: _requestContext, ...acceptedAuthoringInput } = resolved.authoringInput;
    const idempotentSourceCandidate = await retainAdaptiveTrainingSourceCandidateForUser({
      userId: ownerId,
      retainedResponse: acceptedRow!,
      blueprint: accepted.blueprint,
      canonicalPlan: accepted.canonicalPlan,
      selfAudit: accepted.selfAudit,
      reviewConflicts: accepted.reviewConflicts,
      authoringInput: acceptedAuthoringInput,
    });
    assert.deepEqual(
      idempotentSourceCandidate,
      accepted.retainedSourceCandidate,
      "Replaying identical accepted source truth must reuse one Blueprint and candidate.",
    );

    const blueprintRead = await ownerClient
      .from("adaptive_training_blueprint_versions")
      .select("*")
      .eq("id", accepted.retainedSourceCandidate!.blueprintId)
      .maybeSingle();
    assert.equal(blueprintRead.error, null);
    assert.equal(blueprintRead.data?.user_id, ownerId);
    assert.equal(blueprintRead.data?.source_response_id, acceptedRow!.id);
    assert.equal(
      blueprintRead.data?.content_sha256,
      accepted.retainedSourceCandidate!.blueprintSha256,
    );
    assert.deepEqual(blueprintRead.data?.blueprint_content, accepted.blueprint);
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        blueprintRead.data?.blueprint_content ?? {},
        "response_body",
      ),
      false,
      "Blueprint persistence must not duplicate the retained raw provider response.",
    );

    const candidateRead = await ownerClient
      .from("adaptive_training_detailed_candidates")
      .select("*")
      .eq("id", accepted.retainedSourceCandidate!.candidateId)
      .maybeSingle();
    assert.equal(candidateRead.error, null);
    assert.equal(candidateRead.data?.user_id, ownerId);
    assert.equal(candidateRead.data?.blueprint_id, accepted.retainedSourceCandidate!.blueprintId);
    assert.equal(
      candidateRead.data?.candidate_sha256,
      accepted.retainedSourceCandidate!.candidateSha256,
    );
    assert.equal(
      candidateRead.data?.input_fingerprint_sha256,
      accepted.retainedSourceCandidate!.inputFingerprintSha256,
    );
    assert.deepEqual(candidateRead.data?.input_snapshot, acceptedAuthoringInput);
    assert.deepEqual(candidateRead.data?.candidate_content, {
      canonicalPlan: accepted.canonicalPlan,
      selfAudit: accepted.selfAudit,
      reviewConflicts: accepted.reviewConflicts,
    });
    assert.deepEqual(candidateRead.data?.confirmation_lineage, {
      kind: "initial_detailed_block_candidate",
      state: "unconfirmed",
      predecessorCandidateId: null,
      predecessorConfirmationId: null,
    });
    assert.deepEqual(candidateRead.data?.fact_references, [
      { kind: "authoring_fact_group", path: "runnerFacts" },
      { kind: "authoring_fact_group", path: "availability" },
      { kind: "authoring_fact_group", path: "planGoalIntent" },
      { kind: "authoring_fact_group", path: "schedule" },
    ]);
    assert.deepEqual(candidateRead.data?.input_provenance, {
      kind: "structured_authoring_input",
      retainedResponseId: acceptedRow!.id,
      retainedResponseSha256: acceptedRow!.response_sha256,
      sourceContractVersion: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
      compilerVersion: AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
    });

    const isolatedBlueprintRead = await otherClient
      .from("adaptive_training_blueprint_versions")
      .select("id")
      .eq("id", accepted.retainedSourceCandidate!.blueprintId)
      .maybeSingle();
    const isolatedCandidateRead = await otherClient
      .from("adaptive_training_detailed_candidates")
      .select("id")
      .eq("id", accepted.retainedSourceCandidate!.candidateId)
      .maybeSingle();
    assert.equal(isolatedBlueprintRead.error, null);
    assert.equal(isolatedBlueprintRead.data, null, "Another runner must not read a Blueprint.");
    assert.equal(isolatedCandidateRead.error, null);
    assert.equal(isolatedCandidateRead.data, null, "Another runner must not read a candidate.");

    const forbiddenOwnerInsert = await ownerClient
      .from("adaptive_training_blueprint_versions")
      .insert({
        user_id: ownerId,
        source_response_id: acceptedRow!.id,
        version: 99,
        source_contract_version: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
        compiler_version: accepted.blueprint.version,
        blueprint_content: accepted.blueprint,
        content_sha256: accepted.retainedSourceCandidate!.blueprintSha256,
      });
    assert.ok(forbiddenOwnerInsert.error, "Authenticated owners must not write source truth.");

    const forbiddenBlueprintUpdate = await admin
      .from("adaptive_training_blueprint_versions")
      .update({ compiler_version: "rewritten" })
      .eq("id", accepted.retainedSourceCandidate!.blueprintId);
    const forbiddenCandidateUpdate = await admin
      .from("adaptive_training_detailed_candidates")
      .update({ version: 2 })
      .eq("id", accepted.retainedSourceCandidate!.candidateId);
    assert.ok(forbiddenBlueprintUpdate.error, "Accepted Blueprint content must be immutable.");
    assert.ok(forbiddenCandidateUpdate.error, "Detailed candidates must be immutable.");

    const crossOwnerRetention = await admin.rpc("retain_adaptive_training_source_candidate", {
      p_user_id: otherId,
      p_source_response_id: acceptedRow!.id,
      p_blueprint_version: 1,
      p_source_contract_version: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
      p_compiler_version: accepted.blueprint.version,
      p_blueprint_content: accepted.blueprint,
      p_candidate_version: 1,
      p_interval_start_date: accepted.blueprint.detailedHorizon.startDate,
      p_interval_end_date: accepted.blueprint.detailedHorizon.endDate,
      p_candidate_content: {
        canonicalPlan: accepted.canonicalPlan,
        selfAudit: accepted.selfAudit,
        reviewConflicts: accepted.reviewConflicts,
      },
      p_input_snapshot: acceptedAuthoringInput,
      p_input_provenance: {},
      p_fact_references: [],
      p_confirmation_lineage: {},
    });
    assert.ok(crossOwnerRetention.error, "A retained response must not cross runner ownership.");

    const immutableAliasDraft = JSON.parse(fixtureBody.output_text) as {
      blueprint: {
        phases: Array<{ workout_families: string[] }>;
      };
    };
    const easyFamilyPhase = immutableAliasDraft.blueprint.phases.find((phase) =>
      phase.workout_families.includes("easy"),
    );
    assert.ok(easyFamilyPhase, "The deterministic draft must expose one canonical easy family.");
    const easyFamilyIndex = easyFamilyPhase!.workout_families.indexOf("easy");
    easyFamilyPhase!.workout_families[easyFamilyIndex] = "easy_aerobic_run";
    const immutableAliasBody = JSON.stringify(immutableAliasDraft);
    const immutableAliasModel = `gpt-5.2-immutable-alias-proof-${crypto.randomUUID()}`;
    const immutableAliasResponseId = `resp_immutable_alias_${crypto.randomUUID()}`;
    const immutableAliasPrompt = buildAiAuthoredPlanFirstPrompt({
      authoringInput: resolved.authoringInput,
      today: scenario.input.startDate,
    });
    const immutableAliasVersionContext: AiPlanGenerationAttemptVersionContext = {
      schemaVersion: AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
      promptVersion: AI_AUTHORED_PLAN_FIRST_PROVIDER_CONTRACT_VERSION,
      policyVersion: AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION,
      compilerVersion: AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
      providerSettings: resolveAiPlanStructuredResponseProviderSettings({
        model: immutableAliasModel,
        contractMode: "adaptive_blueprint_four_week",
        responseSchemaMode: "responses_json_schema_adaptive_blueprint_four_week_v1_strict",
        responseSchemaName: AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
        timeoutMs: 0,
        maxOutputTokens: DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS,
      }),
    };
    let immutableAliasTrace = await createAiPlanGenerationLedgerTrace({
      providerKind: "openai_responses_api",
      model: immutableAliasModel,
      contractMode: "adaptive_blueprint_four_week",
      responseSchemaMode: "responses_json_schema_adaptive_blueprint_four_week_v1_strict",
      systemPrompt: immutableAliasPrompt.systemPrompt,
      userPrompt: immutableAliasPrompt.userPrompt,
      responseSchema: immutableAliasPrompt.responseSchema,
      timeoutMs: 0,
      maxOutputTokens: DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS,
    });
    immutableAliasTrace = await attachOutputToAiPlanGenerationLedgerTrace({
      trace: immutableAliasTrace,
      rawOutput: immutableAliasBody,
      parsedOutput: immutableAliasDraft,
      options: { disabled: true },
    });
    const immutableAliasRow = await retainCompletedAiPlanGenerationResponseForUser({
      userId: ownerId,
      generationId: immutableAliasTrace.generationId,
      providerResponseId: immutableAliasResponseId,
      responseBody: immutableAliasBody,
      requestContext: resolved.authoringInput,
      versionContext: immutableAliasVersionContext,
      generationTrace: immutableAliasTrace,
    });
    const aliasPath = `blueprint.phases.${immutableAliasDraft.blueprint.phases.indexOf(
      easyFamilyPhase!,
    )}.workout_families.${easyFamilyIndex}`;
    await recordAiPlanGenerationResponseOutcomeForUser({
      userId: ownerId,
      responseRecordId: immutableAliasRow.id,
      schemaOutcome: "rejected",
      compilerOutcome: "not_run",
      diagnostic: {
        code: "ai_authored_plan_first_provider_schema_invalid",
        path: aliasPath,
      },
    });
    await recordAiPlanGenerationAttemptResultForUser({
      userId: ownerId,
      responseRecordId: immutableAliasRow.id,
      result: {
        outcome: "technical_rejection",
        candidateRecordId: null,
        candidateSha256: null,
        noPrescriptionReason: null,
      },
    });

    const immutableRetryInput = structuredClone(resolved.authoringInput);
    immutableRetryInput.runnerCapability = {
      ...immutableRetryInput.runnerCapability,
      vectorId: "2".repeat(64),
      snapshot: {
        ...immutableRetryInput.runnerCapability.snapshot,
        snapshotId: "immutable-alias-retry",
      },
    };
    const immutableRetryPrompt = buildAiAuthoredPlanFirstPrompt({
      authoringInput: immutableRetryInput,
      today: scenario.input.startDate,
    });
    const immutableReusable = await getReusableAiPlanGenerationResponseForUser({
      userId: ownerId,
      requestContext: immutableRetryInput,
      versionContext: immutableAliasVersionContext,
      providerModel: immutableAliasModel,
      prompt: immutableRetryPrompt,
    });
    assert.equal(
      immutableReusable?.id,
      immutableAliasRow.id,
      "A retry that changes only capability revision identities must reach the retained response before candidate persistence.",
    );
    let immutableRetryDispatches = 0;
    const immutableRecovered = await generateAiFirstPlanDraftPreview({
      input: immutableRetryInput,
      apiKey: null,
      model: immutableAliasModel,
      today: scenario.input.startDate,
      candidateOwnerUserId: ownerId,
      generationLedger: { disabled: true },
      fetchImpl: async () => {
        immutableRetryDispatches += 1;
        throw new Error("Immutable response recovery must not dispatch a provider request.");
      },
    });
    assert.equal(
      immutableRecovered.ok,
      true,
      immutableRecovered.ok
        ? ""
        : `${immutableRecovered.metadata.unavailableReason}:${immutableRecovered.issues.join(",")}`,
    );
    if (!immutableRecovered.ok) throw new Error(immutableRecovered.message);
    assert.equal(immutableRetryDispatches, 0);
    assert.equal(immutableRecovered.metadata.responseId, immutableAliasResponseId);
    assert.ok(immutableRecovered.retainedSourceCandidate);
    assert.deepEqual(immutableRecovered.metadata.validationIssues, [
      `ai_authored_blueprint_family_alias_normalized:${aliasPath}:easy`,
    ]);

    const immutableResponseRead = await getAiPlanGenerationResponseForUser(
      ownerId,
      immutableAliasRow.id,
    );
    assert.equal(immutableResponseRead?.schema_outcome, "rejected");
    assert.equal(immutableResponseRead?.compiler_outcome, "not_run");
    assert.equal(
      (immutableResponseRead?.attempt_result as { outcome?: unknown } | null)?.outcome,
      "technical_rejection",
    );
    const immutableCandidateRead = await ownerClient
      .from("adaptive_training_detailed_candidates")
      .select("*")
      .eq("id", immutableRecovered.retainedSourceCandidate!.candidateId)
      .single();
    assert.equal(immutableCandidateRead.error, null);
    assert.equal(
      (immutableCandidateRead.data!.input_provenance as Record<string, unknown>)
        .immutableRecompileKind,
      "immutable_initial_response_recompile_v1",
    );
    assert.equal(
      (immutableCandidateRead.data!.input_provenance as Record<string, unknown>)
        .aliasNormalizationCount,
      1,
    );
    assert.equal(
      isCurrentAiPlanGenerationResponseLineageForCandidate(
        immutableResponseRead!,
        immutableCandidateRead.data!.input_provenance,
        {
          id: immutableCandidateRead.data!.id,
          sha256: immutableCandidateRead.data!.candidate_sha256,
        },
      ),
      true,
      "The proven immutable candidate must be eligible for ordinary Saved review hydration.",
    );

    const immutableDuplicate = await generateAiFirstPlanDraftPreview({
      input: immutableRetryInput,
      apiKey: null,
      model: immutableAliasModel,
      today: scenario.input.startDate,
      candidateOwnerUserId: ownerId,
      generationLedger: { disabled: true },
      fetchImpl: async () => {
        immutableRetryDispatches += 1;
        throw new Error("Duplicate immutable recovery must remain provider-free.");
      },
    });
    assert.equal(immutableDuplicate.ok, true);
    assert.equal(immutableRetryDispatches, 0);
    assert.deepEqual(
      immutableDuplicate.ok ? immutableDuplicate.retainedSourceCandidate : null,
      immutableRecovered.retainedSourceCandidate,
    );

    const changedImmutableFacts = structuredClone(immutableRetryInput);
    changedImmutableFacts.runnerCapability = {
      ...changedImmutableFacts.runnerCapability,
      sourceFingerprint: "f".repeat(64),
      vectorId: "e".repeat(64),
    };
    const changedImmutableRetry = await generateAiFirstPlanDraftPreview({
      input: changedImmutableFacts,
      apiKey: null,
      model: immutableAliasModel,
      today: scenario.input.startDate,
      candidateOwnerUserId: ownerId,
      generationLedger: { disabled: true },
      fetchImpl: async () => {
        immutableRetryDispatches += 1;
        throw new Error("A changed request must not silently reuse immutable response truth.");
      },
    });
    assert.equal(changedImmutableRetry.ok, false);
    assert.equal(changedImmutableRetry.metadata.unavailableReason, "openai_not_configured");
    assert.equal(immutableRetryDispatches, 0);

    const forgedImmutableSnapshot = structuredClone(immutableRetryInput);
    forgedImmutableSnapshot.runnerFacts.weightKg += 1;
    const forgedImmutableRetention = await admin.rpc("retain_adaptive_training_source_candidate", {
      p_user_id: ownerId,
      p_source_response_id: immutableAliasRow.id,
      p_blueprint_version: 99,
      p_source_contract_version: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
      p_compiler_version: AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
      p_blueprint_content: immutableRecovered.blueprint,
      p_candidate_version: 99,
      p_interval_start_date: immutableRecovered.blueprint.detailedHorizon.startDate,
      p_interval_end_date: immutableRecovered.blueprint.detailedHorizon.endDate,
      p_candidate_content: {
        canonicalPlan: immutableRecovered.canonicalPlan,
        selfAudit: immutableRecovered.selfAudit,
        reviewConflicts: immutableRecovered.reviewConflicts,
      },
      p_input_snapshot: forgedImmutableSnapshot,
      p_input_provenance: immutableCandidateRead.data!.input_provenance,
      p_fact_references: immutableCandidateRead.data!.fact_references,
      p_confirmation_lineage: immutableCandidateRead.data!.confirmation_lineage,
    });
    assert.ok(
      forgedImmutableRetention.error,
      "A forged material input must fail before immutable candidate retention.",
    );
    const foreignImmutableRetention = await admin.rpc("retain_adaptive_training_source_candidate", {
      p_user_id: otherId,
      p_source_response_id: immutableAliasRow.id,
      p_blueprint_version: 99,
      p_source_contract_version: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
      p_compiler_version: AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
      p_blueprint_content: immutableRecovered.blueprint,
      p_candidate_version: 99,
      p_interval_start_date: immutableRecovered.blueprint.detailedHorizon.startDate,
      p_interval_end_date: immutableRecovered.blueprint.detailedHorizon.endDate,
      p_candidate_content: {
        canonicalPlan: immutableRecovered.canonicalPlan,
        selfAudit: immutableRecovered.selfAudit,
        reviewConflicts: immutableRecovered.reviewConflicts,
      },
      p_input_snapshot: immutableRetryInput,
      p_input_provenance: immutableCandidateRead.data!.input_provenance,
      p_fact_references: immutableCandidateRead.data!.fact_references,
      p_confirmation_lineage: immutableCandidateRead.data!.confirmation_lineage,
    });
    assert.ok(foreignImmutableRetention.error, "Immutable recovery must remain owner-bound.");

    const canonicalResponseId = `resp_canonical_${crypto.randomUUID()}`;
    const originalFetch = globalThis.fetch;
    let canonicalTransportCallCount = 0;
    let canonicalRequestHasDispatcher = false;
    globalThis.fetch = (async (url, init) => {
      if (String(url) === "https://api.openai.com/v1/responses") {
        canonicalTransportCallCount += 1;
        canonicalRequestHasDispatcher =
          Boolean(init) && typeof init === "object" && "dispatcher" in init;
        return jsonResponse({
          id: canonicalResponseId,
          status: "completed",
          output_text: fixtureBody.output_text,
        });
      }
      return originalFetch(url, init);
    }) as typeof fetch;
    try {
      const canonicalTransport = await generateAiFirstPlanDraftPreview({
        input: resolved.authoringInput,
        apiKey: "synthetic-retention-canonical-proof",
        model: "gpt-5.2-retention-canonical-transport-proof",
        today: scenario.input.startDate,
        candidateOwnerUserId: ownerId,
        generationLedger: { disabled: true },
      });
      assert.equal(canonicalTransport.ok, true, "Owned canonical transport must remain accepted.");
      assert.equal(canonicalTransportCallCount, 1);
      assert.equal(canonicalRequestHasDispatcher, true);
      assert.ok(
        await getAiPlanGenerationResponseByProviderIdForUser(ownerId, canonicalResponseId),
        "Owned canonical transport must retain its completed JSON before returning.",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }

    const ownerRead = await ownerClient
      .from("ai_plan_generation_responses")
      .select("id, response_body")
      .eq("id", compilerRow!.id)
      .maybeSingle();
    assert.equal(ownerRead.error, null);
    assert.equal(ownerRead.data?.response_body, compilerRejectedJson);
    const isolatedRead = await otherClient
      .from("ai_plan_generation_responses")
      .select("id")
      .eq("id", compilerRow!.id)
      .maybeSingle();
    assert.equal(isolatedRead.error, null);
    assert.equal(isolatedRead.data, null, "Another runner must not read retained JSON.");
    assert.equal(await getAiPlanGenerationResponseForUser(otherId, compilerRow!.id), null);

    const forbiddenOwnerUpdate = await ownerClient
      .from("ai_plan_generation_responses")
      .update({ diagnostic_code: "owner_write_must_fail" })
      .eq("id", compilerRow!.id);
    assert.ok(forbiddenOwnerUpdate.error, "Authenticated owners must not mutate server truth.");
    const immutableBodyUpdate = await admin
      .from("ai_plan_generation_responses")
      .update({ response_body: "{}" })
      .eq("id", compilerRow!.id);
    assert.ok(immutableBodyUpdate.error, "Retained JSON must be immutable after insert.");
    const immutableContextUpdate = await admin
      .from("ai_plan_generation_responses")
      .update({ request_context: { rewritten: true } })
      .eq("id", compilerRow!.id);
    assert.ok(immutableContextUpdate.error, "Provider request lineage must be immutable.");
    await assert.rejects(
      recordAiPlanGenerationResponseOutcomeForUser({
        userId: ownerId,
        responseRecordId: compilerRow!.id,
        schemaOutcome: "accepted",
        compilerOutcome: "accepted",
        diagnostic: null,
      }),
      /final|retained/i,
      "Validation outcomes must not be rewritten after finalization.",
    );
    const reviewed = await recordAiPlanGenerationReviewVerdictForUser({
      userId: ownerId,
      responseRecordId: compilerRow!.id,
      reviewer: "qa",
      verdict: {
        verdict: "rejected",
        discriminator: "synthetic_compiler_rejection",
        reviewedAt: "2026-08-22T00:00:00.000Z",
      },
    });
    assert.equal((reviewed.qa_verdict as { verdict?: unknown } | null)?.verdict, "rejected");
    await assert.rejects(
      recordAiPlanGenerationReviewVerdictForUser({
        userId: ownerId,
        responseRecordId: compilerRow!.id,
        reviewer: "qa",
        verdict: {
          verdict: "approved",
          discriminator: null,
          reviewedAt: "2026-08-22T00:01:00.000Z",
        },
      }),
      /final/i,
      "A provider-attempt review verdict must be immutable after first retention.",
    );

    const idempotent = await retainCompletedAiPlanGenerationResponseForUser({
      userId: ownerId,
      generationId: compilerRow!.generation_id,
      providerResponseId: compilerRow!.provider_response_id,
      responseBody: compilerRejectedJson,
      requestContext: resolved.authoringInput,
      versionContext: compilerVersionContext,
      generationTrace: compilerRejected.metadata.generationTrace!,
    });
    assert.equal(idempotent.id, compilerRow!.id);

    for (const table of ["planned_workouts", "plan_cycles"] as const) {
      const rows = await admin
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("user_id", ownerId);
      assert.equal(rows.error, null);
      assert.equal(rows.count, 0, `Raw response retention must create zero ${table} rows.`);
    }

    const ownerRows = await admin
      .from("ai_plan_generation_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId);
    assert.equal(ownerRows.error, null);
    assert.equal(ownerRows.count, 6, "The proof must retain every parseable outcome.");
    const blueprintRows = await admin
      .from("adaptive_training_blueprint_versions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId);
    const candidateRows = await admin
      .from("adaptive_training_detailed_candidates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId);
    assert.equal(blueprintRows.error, null);
    assert.equal(candidateRows.error, null);
    assert.equal(
      blueprintRows.count,
      4,
      "Only accepted responses and the proven immutable recompile create Blueprint versions.",
    );
    assert.equal(
      candidateRows.count,
      4,
      "Only accepted responses and the proven immutable recompile create detailed candidates.",
    );
    const confirmationRows = await admin
      .from("adaptive_training_block_confirmations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId);
    assert.equal(confirmationRows.error, null);
    assert.equal(
      confirmationRows.count,
      0,
      "Immutable response recompilation must not create a confirmation or Calendar write.",
    );
  } finally {
    for (const userId of createdUserIds.reverse()) {
      const deleted = await admin.auth.admin.deleteUser(userId);
      assert.equal(deleted.error, null, "Disposable retention proof user cleanup must succeed.");
    }
    if (createdUserIds.length > 0) {
      for (const table of [
        "ai_plan_generation_responses",
        "adaptive_training_blueprint_versions",
        "adaptive_training_detailed_candidates",
      ] as const) {
        const remaining = await admin
          .from(table)
          .select("id", { count: "exact", head: true })
          .in("user_id", createdUserIds);
        assert.equal(remaining.error, null);
        assert.equal(remaining.count, 0, `Auth cleanup must cascade ${table} rows.`);
      }
    }
  }
}

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
    providerContractVersion: string;
    runnerFacts: {
      calendar: {
        detailed_block_end_date: string;
        future_projection_start_date: string | null;
      };
      runner: { plan_request_comment?: string };
    };
  };
  assert.equal(
    containsObjectKey(validPrompt.responseSchema, "pattern"),
    false,
    "The OpenAI schema must stay structural; local compiler validation owns regex semantics.",
  );
  assert.equal(
    validProviderContext.providerContractVersion,
    "adaptive-blueprint-four-week-direct-v36",
  );
  assert.equal(validProviderContext.runnerFacts.calendar.detailed_block_end_date, "2026-08-02");
  assert.equal(
    validProviderContext.runnerFacts.calendar.future_projection_start_date,
    "2026-08-03",
  );
  assert.match(validPrompt.systemPrompt, /phase that straddles/i);
  assert.match(validPrompt.systemPrompt, /exact non-rest workout count/i);
  assert.match(validPrompt.systemPrompt, /audit cadence mechanically/i);
  assert.match(validPrompt.systemPrompt, /calendar week is Monday through Sunday/i);
  assert.match(validPrompt.systemPrompt, /two phases share one calendar week/i);
  assert.match(validPrompt.systemPrompt, /Do not generate one every-other-day sequence/i);
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
    echoedDraft.detailed_block.workouts[0]!.cue = runnerCommentCanary;
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
        : `${scenario.name} failed: ${result.unavailable.error.message} ${JSON.stringify(result.unavailable.error.issues)}`,
    );
    if (!result.ok) throw new Error(result.unavailable.error.message);

    assertProductPreviewProjection(scenario.name, result);

    const canonicalPlan = await assertReviewedDraftExactness({
      scenarioName: scenario.name,
      draft: result.draft,
      expectedEndpointMeters: scenario.expectedEndpointMeters,
      expectedFinalDate: scenario.expectedFinalDate,
    });

    assert.equal(result.draft.sourceKind, AI_AUTHORED_PLAN_FIRST_SOURCE_KIND);
    assert.equal(result.draft.aiGeneration.status, "ai_authored");
    assert.equal(
      result.draft.aiGeneration.generationTrace?.usage.reasoningTokens,
      25,
      "The provider ledger must preserve exact reported reasoning-token usage.",
    );
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
    message: "Complete the runner profile facts before creating a generated plan.",
  });

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: authoring.authoringInput,
    today: ambitiousShortHorizonInput.startDate,
    env: {
      LOCAL_AUTH_BYPASS_ENABLED: "true",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
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

  let missingTargetProviderCalls = 0;
  const missingTarget = await buildReviewedAiGeneratedRunningPlanPreview(
    {
      ...ambitiousShortHorizonInput,
      planGoalIntent: {
        distance: ambitiousShortHorizonInput.planGoalIntent.distance,
      },
    },
    {
      aiPreview: {
        apiKey: "must-not-call-provider-without-target",
        fetchImpl: async () => {
          missingTargetProviderCalls += 1;
          throw new Error("A missing runner-selected target reached provider dispatch.");
        },
      },
    },
  );
  assert.equal(missingTarget.ok, false);
  if (missingTarget.ok) throw new Error("Missing target unexpectedly reached review.");
  assert.equal(missingTarget.unavailable.previewOutcome, "invalid_structural_input");
  assert.equal(missingTarget.unavailable.callsOpenAi, false);
  assert.equal(missingTargetProviderCalls, 0);

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

async function validateRunnerPlanCapabilityAdmissionContract() {
  const input = scenarios[0]!.input;
  const factual = buildProofRunnerCapability(input, {
    recentState: "available",
    rollingState: "partial",
    latestState: "available",
  });
  const factualAuthoring = buildAiGeneratedRunningPlanAuthoringInputRuntime(
    input,
    factual.runnerCapability,
    factual.acceptedHeartRateProfile,
  );
  assert.equal(factualAuthoring.ok, true, factualAuthoring.ok ? "" : factualAuthoring.message);
  if (!factualAuthoring.ok) throw new Error(factualAuthoring.message);
  assert.equal(
    factualAuthoring.authoringInput.runnerCapability.vectorId,
    factual.runnerCapability.vectorId,
  );
  assert.equal(factual.runnerCapability.sevenDaySlices.length, 12);
  assert.deepEqual(factual.runnerCapability.windows.base28.sliceIndexes, [0, 1, 2, 3]);
  assert.equal(
    factual.runnerCapability.windows.capacity90.leadingPartialBoundary.contextOnly,
    true,
  );
  assert.equal(factual.runnerCapability.openingAnchor.basis, "distance_metres");
  assert.equal(factual.runnerCapability.sevenDaySlices[0]?.contactCount, 2);

  const partial = buildProofRunnerCapability(input, {
    recentState: "partial",
    rollingState: "unavailable",
  });
  assert.equal(partial.runnerCapability.evidenceConfidence.recent7, "observed_sparse");

  const constraintOnly = buildProofRunnerCapability(input, {
    recentState: "unavailable",
    rollingState: "not_applicable",
  });
  const constraintAuthoring = buildAiGeneratedRunningPlanAuthoringInputRuntime(
    input,
    constraintOnly.runnerCapability,
    constraintOnly.acceptedHeartRateProfile,
  );
  assert.equal(constraintAuthoring.ok, true);
  assert.equal(constraintOnly.runnerCapability.openingAnchor.basis, "unavailable");
  assert.equal(
    constraintOnly.runnerCapability.additionalEasyContact.decision,
    "not_applicable_reentry",
  );

  const updating = buildProofRunnerCapability(input, { recentState: "updating" });
  const contradictory = buildProofRunnerCapability(input, {
    recentState: "contradictory",
  });

  let providerCalls = 0;
  for (const blocked of [updating, contradictory]) {
    const result = await buildAiGeneratedRunningPlanPreviewRuntime(input, {
      runnerCapability: blocked.runnerCapability,
      acceptedHeartRateProfile: blocked.acceptedHeartRateProfile,
      aiPreview: {
        apiKey: "must-not-dispatch-runner-capability-proof",
        generationLedger: { disabled: true },
        fetchImpl: async () => {
          providerCalls += 1;
          throw new Error("Blocked runner capability reached provider dispatch.");
        },
      },
    });
    assert.equal(result.ok, false);
  }

  const persistedThreeDayProfile = buildProofRunnerCapability({ ...input, daysPerWeek: 3 });
  const conflict = await buildAiGeneratedRunningPlanPreviewRuntime(input, {
    runnerCapability: persistedThreeDayProfile.runnerCapability,
    acceptedHeartRateProfile: persistedThreeDayProfile.acceptedHeartRateProfile,
    aiPreview: {
      apiKey: "must-not-dispatch-schedule-conflict-proof",
      generationLedger: { disabled: true },
      fetchImpl: async () => {
        providerCalls += 1;
        throw new Error("Conflicting schedule reached provider dispatch.");
      },
    },
  });
  assert.equal(conflict.ok, false);
  assert.equal(
    providerCalls,
    0,
    "Blocked capability admission must precede provider lookup/dispatch.",
  );

  const zeroBaselineFixture = buildAiGeneratedRunningPlanQaFixtureAuthoringInput("2026-06-08", {
    mode: "prospective_preview",
    selectedTargetDate: "2026-08-02",
  });
  const providerDraft = buildAiGeneratedRunningPlanDevFixtureProviderDraft(zeroBaselineFixture);
  const forgedOpening = structuredClone(zeroBaselineFixture);
  forgedOpening.runnerCapability = {
    ...forgedOpening.runnerCapability,
    openingAnchor: {
      basis: "duration_seconds",
      recent7DistanceMetres: null,
      recent7DurationSeconds: 60,
      enforcedOpeningDemand: 60,
      longRunDemand: null,
      reasonCodes: [],
    },
    additionalEasyContact: {
      currentContacts: 1,
      proposedContacts: 2,
      decision: "not_admitted",
      supportSliceIndex: null,
      maximumOpeningDemand: 60,
      reasonCodes: ["limitation_state_unavailable"],
    },
  };
  const forgedOpeningResult = compileAiAuthoredPlanFirstDraft({
    draft: providerDraft,
    authoringInput: forgedOpening,
  });
  assert.equal(
    forgedOpeningResult.ok,
    true,
    "Observed opening capability is coaching context, not Backend plan-composition authority.",
  );

  const changedFacts = buildProofRunnerCapability(input, {
    recentState: "available",
    rollingState: "partial",
    formulaSuffix: "v2",
  });
  const changedAuthoring = buildAiGeneratedRunningPlanAuthoringInputRuntime(
    input,
    changedFacts.runnerCapability,
    changedFacts.acceptedHeartRateProfile,
  );
  assert.equal(changedAuthoring.ok, true);
  if (!changedAuthoring.ok) throw new Error(changedAuthoring.message);
  assert.notEqual(
    JSON.stringify(factualAuthoring.authoringInput),
    JSON.stringify(changedAuthoring.authoringInput),
    "Snapshot/formula changes must alter exact retained-response request context.",
  );
}

async function validateFaithfulPlanFirstAtomization() {
  const paceInput = {
    ...scenarios[0]!.input,
    benchmark: { kind: "recent_5k_pace" as const, recent5kPace: "5:30/km" },
    planGoalIntent: {
      ...scenarios[0]!.input.planGoalIntent,
      targetDate: "2026-06-15",
    },
  };
  const personalProfile = buildProofPersonalRunnerCapability(paceInput);
  const resolved = buildAiGeneratedRunningPlanAuthoringInputRuntime(
    paceInput,
    personalProfile.runnerCapability,
    personalProfile.acceptedHeartRateProfile,
  );
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);
  const benchmarkBackedPrompt = buildAiAuthoredPlanFirstPrompt({
    authoringInput: resolved.authoringInput,
    today: resolved.authoringInput.schedule.startDate,
  });
  assert.match(
    JSON.stringify(benchmarkBackedPrompt.responseSchema),
    /"primary_execution_mode":\{"type":"string","const":"pace"\}/,
    "An independently eligible runner benchmark must keep executable pace representable.",
  );

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
    blueprint: {
      start_date: "2026-06-08",
      selected_target_date: "2026-06-15",
      target_assumption: "10K target on 2026-06-15",
      phases: [
        {
          phase: "Specific",
          start_date: "2026-06-08",
          end_date: "2026-06-10",
          expected_weekly_cadence: 4,
          workout_families: ["race"],
        },
        {
          phase: "Build",
          start_date: "2026-06-11",
          end_date: "2026-06-11",
          expected_weekly_cadence: 4,
          workout_families: ["intervals"],
        },
        {
          phase: "Endurance",
          start_date: "2026-06-12",
          end_date: "2026-06-13",
          expected_weekly_cadence: 4,
          workout_families: ["long"],
        },
        {
          phase: "Terrain",
          start_date: "2026-06-14",
          end_date: "2026-06-14",
          expected_weekly_cadence: 4,
          workout_families: ["trail"],
        },
        {
          phase: "Goal",
          start_date: "2026-06-15",
          end_date: "2026-06-15",
          expected_weekly_cadence: 4,
          workout_families: ["race"],
        },
      ],
      projections: [],
    },
    detailed_block: {
      start_date: "2026-06-08",
      end_date: "2026-06-15",
      workouts: [
        {
          date: "2026-06-08",
          phase: "Specific",
          workout_identity: "race_pace_session",
          title: "Race pace rehearsal",
          cue: "Execute the authored race-pace structure.",
          sections: [
            unit(
              "main",
              "Race pace",
              { mode: "time", duration_min: 20 },
              paceTarget("5:00-5:10/km"),
            ),
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
      final_workout: {
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
    runnerCapability: personalProfile.runnerCapability,
    acceptedHeartRateProfile: personalProfile.acceptedHeartRateProfile,
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
  arbitraryTitleDraft.detailed_block.workouts[1]!.title = "Coach Surprise Session";
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
  unknownIdentityDraft.detailed_block.workouts[1]!.workout_identity = "coach_surprise_session";
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
      targetDate: paceInput.planGoalIntent.targetDate,
      targetFinishTime: "1:10:00",
    },
  };
  const targetProfile = buildProofPersonalRunnerCapability(targetInput);
  const targetResolved = buildAiGeneratedRunningPlanAuthoringInputRuntime(
    targetInput,
    targetProfile.runnerCapability,
    targetProfile.acceptedHeartRateProfile,
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

  const volatileOnlyRetry = structuredClone(resolved.authoringInput);
  volatileOnlyRetry.runnerCapability = {
    ...volatileOnlyRetry.runnerCapability,
    vectorId: "3".repeat(64),
    snapshot: {
      ...volatileOnlyRetry.runnerCapability.snapshot,
      snapshotId: "volatile-observation-retry",
    },
  };
  assert.equal(
    areMateriallyEquivalentAiFirstPlanRequestContexts(resolved.authoringInput, volatileOnlyRetry),
    true,
    "An unchanged capability request may reuse an immutable first-plan response.",
  );
  const changedFactsRetry = structuredClone(volatileOnlyRetry);
  changedFactsRetry.runnerCapability = {
    ...changedFactsRetry.runnerCapability,
    sourceFingerprint: "d".repeat(64),
    vectorId: "c".repeat(64),
  };
  assert.equal(
    areMateriallyEquivalentAiFirstPlanRequestContexts(resolved.authoringInput, changedFactsRetry),
    false,
    "A runner-facts revision must not reuse an immutable first-plan response.",
  );
  const changedGoalRetry = structuredClone(volatileOnlyRetry);
  changedGoalRetry.planGoalIntent.targetDate = "2026-08-03";
  assert.equal(
    areMateriallyEquivalentAiFirstPlanRequestContexts(resolved.authoringInput, changedGoalRetry),
    false,
    "A target-date change must not reuse an immutable first-plan response.",
  );
  const changedEvidenceRetry = structuredClone(volatileOnlyRetry);
  changedEvidenceRetry.runnerCapability = {
    ...changedEvidenceRetry.runnerCapability,
    sourceFingerprint: "b".repeat(64),
    vectorId: "a".repeat(64),
  };
  assert.equal(
    areMateriallyEquivalentAiFirstPlanRequestContexts(
      resolved.authoringInput,
      changedEvidenceRetry,
    ),
    false,
    "A factual evidence change must not reuse an immutable first-plan response.",
  );

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
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
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

  const canonicalTransportCallCount = 0;
  const canonicalTransport = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "canonical-transport-plan-first-proof",
    model: "canonical-transport-plan-first-proof",
    generationLedger: { disabled: true },
    fetchImpl: globalThis.fetch,
  });
  assert.equal(canonicalTransport.ok, false);
  if (canonicalTransport.ok || canonicalTransport.reason === "structured_input_invalid") {
    throw new Error("Ownerless canonical transport unexpectedly reached provider work.");
  }
  assert.equal(
    canonicalTransport.metadata.unavailableReason,
    "ai_plan_generation_response_owner_required",
  );
  assert.equal(canonicalTransport.metadata.debug.requestPhase, "not_started");
  assert.equal(canonicalTransportCallCount, 0);

  let incompleteCallCount = 0;
  let incompleteRequestBody: Record<string, unknown> | null = null;
  const incomplete = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "incomplete-plan-first-proof",
    model: "gpt-5.2-incomplete-plan-first-proof",
    generationLedger: { disabled: true },
    fetchImpl: async (_url, init) => {
      incompleteCallCount += 1;
      incompleteRequestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
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
  assert.equal(incomplete.metadata.debug.maxOutputTokens, DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS);
  assert.equal(incompleteRequestBody?.max_output_tokens, 128_000);
  assert.deepEqual(incompleteRequestBody?.reasoning, { effort: "low" });
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
  const runningDay = invalidCompilerDraft.detailed_block.workouts[0];
  const secondRunningDay = invalidCompilerDraft.detailed_block.workouts[1];
  assert.ok(runningDay, "Fixture must expose a running day.");
  assert.ok(secondRunningDay, "Fixture must expose a second running day.");
  secondRunningDay.date = runningDay.date;
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
    assertProductUnavailableProjection(notConfigured);

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
      if (scenarioCase.expected === "compiler_rejection") {
        assert.equal(
          result.unavailable.error.compilerDiagnostic?.code,
          "ai_authored_plan_first_duplicate_date",
        );
        assert.equal(
          result.unavailable.error.compilerDiagnostic?.path,
          "detailed_block.workouts.1.date",
        );
      } else {
        assert.equal(result.unavailable.error.compilerDiagnostic, null);
      }
      assertProductUnavailableProjection(result);
    }
  } finally {
    if (originalFixtureFlag === undefined) {
      delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
    } else {
      process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = originalFixtureFlag;
    }
  }
}

function assertProductPreviewProjection(
  scenarioName: string,
  result: Extract<
    Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>,
    { ok: true }
  >,
) {
  const product = projectRunningPlanPreviewResultForProduct(result);
  assert.equal(product.ok, true);
  if (!product.ok) throw new Error(`${scenarioName} Product projection unexpectedly failed.`);

  assert.deepEqual(Object.keys(product.draft).sort(), [
    "calendarRows",
    "candidate",
    "goal",
    "previewInput",
    "previewOutcome",
    "reviewChecksum",
    "reviewToken",
    "savedPlanReviewCandidate",
    "schedule",
    "sourceKind",
    "workoutDocuments",
  ]);
  assert.deepEqual(Object.keys(product.draft.goal).sort(), [
    "distanceLabel",
    "targetDate",
    "targetFinishTime",
  ]);
  assert.deepEqual(Object.keys(product.draft.schedule).sort(), ["endDate", "startDate"]);
  assert.equal(product.draft.reviewToken, result.draft.reviewToken);
  assert.equal(product.draft.reviewChecksum, result.draft.reviewChecksum);
  assert.deepEqual(
    product.draft.savedPlanReviewCandidate,
    result.draft.sourceCandidate
      ? {
          id: result.draft.sourceCandidate.candidateId,
          version: result.draft.sourceCandidate.candidateVersion,
          sha256: result.draft.sourceCandidate.candidateSha256,
        }
      : null,
  );
  assert.deepEqual(product.draft.previewInput, result.draft.previewInput);
  assert.deepEqual(product.draft.workoutDocuments, result.draft.workoutDocuments);
  assert.deepEqual(product.draft.candidate, result.draft.candidate);
  assert.equal(product.draft.candidate.command.operation, "materialize");
  if (product.draft.candidate.command.operation !== "materialize") return;
  assert.deepEqual(product.draft.candidate.command.documents, product.draft.workoutDocuments);
  assert.equal(
    product.draft.candidate.command.provenanceReferences.every((reference) =>
      Boolean(
        reference &&
        typeof reference === "object" &&
        !Array.isArray(reference) &&
        "adaptiveTrainingSourceCandidate" in reference,
      ),
    ),
    true,
  );
  assert.deepEqual(Object.keys(product.draft.calendarRows[0] ?? {}).sort(), [
    "date",
    "endpointDistanceMeters",
    "isRestDay",
    "rowId",
    "title",
    "weekNumber",
    "weekday",
  ]);
  assert.ok(
    Buffer.byteLength(JSON.stringify(product), "utf8") <
      Buffer.byteLength(JSON.stringify(result), "utf8"),
    `${scenarioName} Product preview must be smaller than the internal reviewed draft.`,
  );
}

function assertProductUnavailableProjection(
  result: Extract<
    Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>,
    { ok: false }
  >,
) {
  const loggedErrors: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => loggedErrors.push(args);
  let product: ReturnType<typeof projectRunningPlanPreviewResultForProduct>;
  try {
    product = projectRunningPlanPreviewResultForProduct(result);
  } finally {
    console.error = originalConsoleError;
  }
  assert.deepEqual(Object.keys(product).sort(), ["ok", "unavailable"]);
  assert.equal(product.ok, false);
  if (product.ok) throw new Error("Unavailable Product projection unexpectedly became ready.");
  assert.deepEqual(Object.keys(product.unavailable).sort(), ["error", "previewOutcome"]);
  assert.deepEqual(Object.keys(product.unavailable.error).sort(), [
    "code",
    "compilerDiagnostic",
    "message",
  ]);
  assert.deepEqual(
    product.unavailable.error.compilerDiagnostic,
    result.unavailable.error.compilerDiagnostic,
  );
  if (result.unavailable.previewOutcome === "compiler_rejection") {
    assert.deepEqual(loggedErrors, [
      [
        "[generated-plan/preview] compiler_rejection",
        JSON.stringify({
          code: "ai_generated_plan_unavailable",
          compilerDiagnostic: result.unavailable.error.compilerDiagnostic,
        }),
      ],
    ]);
    assert.deepEqual(Object.keys(JSON.parse(String(loggedErrors[0]?.[1]))).sort(), [
      "code",
      "compilerDiagnostic",
    ]);
  } else {
    assert.deepEqual(loggedErrors, []);
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
      responseSchemaMode: "responses_json_schema_adaptive_blueprint_four_week_v1_strict",
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
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
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
      authoringInput: buildAiGeneratedRunningPlanQaFixtureAuthoringInput(),
      env: localDevFixtureEnv,
    }),
    null,
    "Fixture environment residue must not authorize an ordinary local account.",
  );
  assert.equal(
    buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      qaFixtureAuthorized: true,
      authoringInput: buildAiGeneratedRunningPlanQaFixtureAuthoringInput(),
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
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE;
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

    const fixtureAuthoringInput = buildAiGeneratedRunningPlanQaFixtureAuthoringInput();
    const fixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      qaFixtureAuthorized: true,
      authoringInput: fixtureAuthoringInput,
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
    const fixtureCompile = compileAiAuthoredPlanFirstDraft({
      draft: fixtureDraft,
      authoringInput: fixtureAuthoringInput,
    });
    assert.equal(fixtureCompile.ok, true);
    if (!fixtureCompile.ok) throw new Error(fixtureCompile.issues[0]?.message);

    const noPaceAuthorityInput = structuredClone(fixtureAuthoringInput);
    noPaceAuthorityInput.runnerFacts.benchmark = null;
    const aspirationalGoalIntent = normalizePlanGoalIntent({
      rawIntent: {
        distance: { kind: "preset", preset: "10K" },
        targetDate: noPaceAuthorityInput.planGoalIntent.targetDate,
        targetFinishTime: "55:00",
      },
      startDate: noPaceAuthorityInput.schedule.startDate,
    });
    assert.equal(aspirationalGoalIntent.ok, true);
    if (!aspirationalGoalIntent.ok) throw new Error(aspirationalGoalIntent.message);
    noPaceAuthorityInput.planGoalIntent = aspirationalGoalIntent.intent;
    noPaceAuthorityInput.availability.maxRunningDaysPerWeek = null;
    assert.equal(noPaceAuthorityInput.runnerCapability.performanceEvidence.state, "unavailable");
    assert.equal(
      noPaceAuthorityInput.planGoalIntent.metricTruthPolicy.segmentPaceTargetsAllowedFromGoal,
      false,
    );
    const noPaceAuthorityPrompt = buildAiAuthoredPlanFirstPrompt({
      authoringInput: noPaceAuthorityInput,
      today: noPaceAuthorityInput.schedule.startDate,
    });
    assert.doesNotMatch(
      JSON.stringify(noPaceAuthorityPrompt.responseSchema),
      /"primary_execution_mode":\{"type":"string","const":"pace"\}/,
      "An aspirational goal without performance evidence must make pace unrepresentable to the provider.",
    );
    assert.match(
      noPaceAuthorityPrompt.systemPrompt,
      /target_finish_time and goal\.target_outcome_pace are aspirational goal metadata only/,
    );
    assert.match(
      noPaceAuthorityPrompt.systemPrompt,
      /controlled_tempo_session without factual pace authority.*exact full accepted Z4 band.*Repeat recovery child longer than 1\.5 minutes.*exact full accepted Z2 band/s,
      "The provider contract must state the exact no-pace controlled-tempo work and recovery bands enforced by the compiler.",
    );
    const noPaceAuthorityDraft =
      buildAiGeneratedRunningPlanDevFixtureProviderDraft(noPaceAuthorityInput);
    const noPaceAuthorityCompile = compileAiAuthoredPlanFirstDraft({
      draft: noPaceAuthorityDraft,
      authoringInput: noPaceAuthorityInput,
    });
    assert.equal(
      noPaceAuthorityCompile.ok,
      true,
      noPaceAuthorityCompile.ok ? "" : noPaceAuthorityCompile.issues[0]?.message,
    );
    if (!noPaceAuthorityCompile.ok) {
      throw new Error(noPaceAuthorityCompile.issues[0]?.message);
    }
    const noPaceTempoDraft = buildAiGeneratedRunningPlanDevFixtureProviderDraft(
      noPaceAuthorityInput,
      "non_repeat_tempo",
    );
    const noPaceTempoDays = [
      ...noPaceTempoDraft.detailed_block.workouts,
      noPaceTempoDraft.detailed_block.final_workout,
    ];
    const noPaceTempoWorkout = noPaceTempoDays.find(
      (workout) => workout.workout_identity === "controlled_tempo_session",
    );
    const noPaceTempoWork = noPaceTempoWorkout?.sections.find(
      (section) =>
        section.kind === "unit" &&
        section.segment_type === "tempo_block" &&
        section.prescription.mode === "time" &&
        section.prescription.duration_min > 2,
    );
    const z2 = noPaceAuthorityInput.runnerFacts.heartRateProfile.zones.find(
      (zone) => zone.reference === "Z2",
    );
    const z3 = noPaceAuthorityInput.runnerFacts.heartRateProfile.zones.find(
      (zone) => zone.reference === "Z3",
    );
    const z4 = noPaceAuthorityInput.runnerFacts.heartRateProfile.zones.find(
      (zone) => zone.reference === "Z4",
    );
    assert.ok(noPaceTempoWorkout && noPaceTempoWork && z2 && z3 && z4);
    if (
      !noPaceTempoWorkout ||
      !noPaceTempoWork ||
      noPaceTempoWork.kind !== "unit" ||
      !z2 ||
      !z3 ||
      !z4
    ) {
      throw new Error("No-pace controlled-tempo fixture truth is unavailable.");
    }
    assert.deepEqual(noPaceTempoWork.target, {
      primary_execution_mode: "heart_rate",
      band_reference: "Z4",
      command: `${z4.minBpm}-${z4.maxBpm} bpm`,
    });
    const noPaceTempoCompile = compileAiAuthoredPlanFirstDraft({
      draft: noPaceTempoDraft,
      authoringInput: noPaceAuthorityInput,
    });
    assert.equal(
      noPaceTempoCompile.ok,
      true,
      noPaceTempoCompile.ok ? "" : noPaceTempoCompile.issues[0]?.message,
    );

    const wrongTempoBandDraft: AiAuthoredPlanFirstCompilerDraft = structuredClone(noPaceTempoDraft);
    const wrongTempoWorkout = [
      ...wrongTempoBandDraft.detailed_block.workouts,
      wrongTempoBandDraft.detailed_block.final_workout,
    ].find((workout) => workout.workout_identity === "controlled_tempo_session");
    const wrongTempoWork = wrongTempoWorkout?.sections.find(
      (section) => section.kind === "unit" && section.segment_type === "tempo_block",
    );
    assert.ok(wrongTempoWork && wrongTempoWork.kind === "unit");
    if (!wrongTempoWork || wrongTempoWork.kind !== "unit") {
      throw new Error("Wrong-band controlled-tempo fixture is unavailable.");
    }
    wrongTempoWork.target = {
      primary_execution_mode: "heart_rate",
      band_reference: "Z3",
      command: `${z3.minBpm}-${z3.maxBpm} bpm`,
    };
    const wrongTempoBandCompile = compileAiAuthoredPlanFirstDraft({
      draft: wrongTempoBandDraft,
      authoringInput: noPaceAuthorityInput,
    });
    assert.equal(
      wrongTempoBandCompile.ok,
      true,
      "Controlled-tempo band choice is reviewable coaching content when it stays inside accepted factual HR authority.",
    );

    const repeatedTempoDraft: AiAuthoredPlanFirstCompilerDraft = structuredClone(noPaceTempoDraft);
    const repeatedTempoWorkout = [
      ...repeatedTempoDraft.detailed_block.workouts,
      repeatedTempoDraft.detailed_block.final_workout,
    ].find((workout) => workout.workout_identity === "controlled_tempo_session");
    const repeatedTempoWorkIndex = repeatedTempoWorkout?.sections.findIndex(
      (section) => section.kind === "unit" && section.segment_type === "tempo_block",
    );
    assert.ok(
      repeatedTempoWorkout && repeatedTempoWorkIndex != null && repeatedTempoWorkIndex >= 0,
    );
    if (!repeatedTempoWorkout || repeatedTempoWorkIndex == null || repeatedTempoWorkIndex < 0) {
      throw new Error("Repeated controlled-tempo fixture is unavailable.");
    }
    repeatedTempoWorkout.sections[repeatedTempoWorkIndex] = {
      kind: "repeat",
      segment_type: "interval_block",
      label: "Controlled Tempo Repeats",
      cue: "Stay controlled throughout the set.",
      rounds: 3,
      children: [
        {
          role: "work",
          label: "Work",
          cue: "Run at controlled tempo effort.",
          prescription: { mode: "time", duration_min: 6 },
          target: {
            primary_execution_mode: "heart_rate",
            band_reference: "Z4",
            command: `${z4.minBpm}-${z4.maxBpm} bpm`,
          },
        },
        {
          role: "recover",
          label: "Recovery",
          cue: "Relax and recover before the next repeat.",
          prescription: { mode: "time", duration_min: 2 },
          target: {
            primary_execution_mode: "heart_rate",
            band_reference: "Z2",
            command: `${z2.minBpm}-${z2.maxBpm} bpm`,
          },
        },
      ],
    };
    const repeatedTempoCompile = compileAiAuthoredPlanFirstDraft({
      draft: repeatedTempoDraft,
      authoringInput: noPaceAuthorityInput,
    });
    assert.equal(
      repeatedTempoCompile.ok,
      true,
      repeatedTempoCompile.ok ? "" : repeatedTempoCompile.issues[0]?.message,
    );
    const wrongTempoRecoveryDraft = structuredClone(repeatedTempoDraft);
    const wrongTempoRecoveryWorkout = [
      ...wrongTempoRecoveryDraft.detailed_block.workouts,
      wrongTempoRecoveryDraft.detailed_block.final_workout,
    ].find((workout) => workout.workout_identity === "controlled_tempo_session");
    const wrongTempoRecoveryRepeat = wrongTempoRecoveryWorkout?.sections.find(
      (section) => section.kind === "repeat" && section.segment_type === "interval_block",
    );
    const wrongTempoRecovery =
      wrongTempoRecoveryRepeat?.kind === "repeat"
        ? wrongTempoRecoveryRepeat.children.find((child) => child.role === "recover")
        : null;
    assert.ok(wrongTempoRecovery);
    if (!wrongTempoRecovery) {
      throw new Error("Wrong-band controlled-tempo recovery fixture is unavailable.");
    }
    wrongTempoRecovery.target = {
      primary_execution_mode: "heart_rate",
      band_reference: "Z3",
      command: `${z3.minBpm}-${z3.maxBpm} bpm`,
    };
    const wrongTempoRecoveryCompile = compileAiAuthoredPlanFirstDraft({
      draft: wrongTempoRecoveryDraft,
      authoringInput: noPaceAuthorityInput,
    });
    assert.equal(
      wrongTempoRecoveryCompile.ok,
      true,
      "Controlled-tempo recovery band choice is reviewable coaching content when it stays inside accepted factual HR authority.",
    );
    const noPaceAuthorityDays = [
      ...noPaceAuthorityDraft.detailed_block.workouts,
      noPaceAuthorityDraft.detailed_block.final_workout,
    ];
    const noPaceAuthorityTargets = noPaceAuthorityDays.flatMap((workout) =>
      workout.sections.flatMap((section) =>
        section.kind === "repeat"
          ? section.children.map((child) => child.target)
          : section.kind === "unit"
            ? [section.target]
            : [],
      ),
    );
    assert.equal(
      noPaceAuthorityTargets.some((target) => target.primary_execution_mode === "pace"),
      false,
      "A constraint-only initial plan must not invent executable pace authority.",
    );
    assert.equal(
      noPaceAuthorityCompile.canonicalPlan.planned_workouts.some((workout) =>
        workout.segments.some(
          (segment) =>
            segment.target?.pace != null ||
            segment.prescription?.children?.some((child) => child.target?.pace != null),
        ),
      ),
      false,
    );

    const noPaceShortWork = noPaceAuthorityDays.flatMap((workout) =>
      workout.sections.flatMap((section) => {
        if (section.kind !== "repeat") return [];
        return section.children
          .filter((child) => child.role === "work")
          .filter(
            (child) =>
              (workout.workout_identity === "easy_run_with_strides" &&
                child.prescription.mode === "time" &&
                child.prescription.duration_min <= 0.5) ||
              (workout.workout_identity === "controlled_tempo_session" &&
                child.prescription.mode === "time" &&
                child.prescription.duration_min <= 2) ||
              (workout.workout_identity === "distance_intervals" &&
                child.prescription.mode === "distance" &&
                child.prescription.distance_km <= 0.4),
          )
          .map((child) => ({ workoutIdentity: workout.workout_identity, child }));
      }),
    );
    assert.ok(noPaceShortWork.length >= 3);
    assert.ok(
      noPaceShortWork.some(({ workoutIdentity }) => workoutIdentity === "easy_run_with_strides"),
    );
    assert.ok(
      noPaceShortWork.some(({ workoutIdentity }) => workoutIdentity === "controlled_tempo_session"),
    );
    assert.ok(
      noPaceShortWork.some(({ workoutIdentity }) => workoutIdentity === "distance_intervals"),
    );
    for (const { workoutIdentity, child } of noPaceShortWork) {
      assert.deepEqual(child.target, {
        primary_execution_mode: "effort",
        effort_kind:
          workoutIdentity === "easy_run_with_strides"
            ? "controlled_stride"
            : "controlled_short_repetition",
      });
      assert.match(child.cue ?? "", /controlled|smooth|relaxed/i);
    }
    const noPaceShortRecoveries = noPaceAuthorityDays.flatMap((workout) =>
      workout.sections.flatMap((section) => {
        if (section.kind !== "repeat") return [];
        return section.children
          .filter((child) => child.role === "recover")
          .filter(
            (child) =>
              child.prescription.mode === "time" &&
              ((workout.workout_identity === "easy_run_with_strides" &&
                child.prescription.duration_min <= 1) ||
                ((workout.workout_identity === "controlled_tempo_session" ||
                  workout.workout_identity === "distance_intervals") &&
                  child.prescription.duration_min <= 1.5)),
          );
      }),
    );
    assert.ok(noPaceShortRecoveries.length >= 3);
    for (const child of noPaceShortRecoveries) {
      assert.deepEqual(child.target, {
        primary_execution_mode: "effort",
        effort_kind: "controlled_short_recovery",
      });
      assert.match(child.cue ?? "", /relaxed.*controlled|controlled.*recover fully/i);
    }

    const delayedHeartRateDraft: AiAuthoredPlanFirstCompilerDraft =
      structuredClone(noPaceAuthorityDraft);
    const delayedHeartRateDays = [
      ...delayedHeartRateDraft.detailed_block.workouts,
      delayedHeartRateDraft.detailed_block.final_workout,
    ];
    const strideWorkout = delayedHeartRateDays.find(
      (workout) => workout.workout_identity === "easy_run_with_strides",
    );
    const strideRepeat = strideWorkout?.sections.find((section) => section.kind === "repeat");
    const sustainedHeartRateTarget = delayedHeartRateDays
      .flatMap((workout) => workout.sections)
      .find(
        (section) =>
          section.kind === "unit" && section.target.primary_execution_mode === "heart_rate",
      );
    if (
      !strideRepeat ||
      strideRepeat.kind !== "repeat" ||
      !sustainedHeartRateTarget ||
      sustainedHeartRateTarget.kind !== "unit"
    ) {
      throw new Error("Short-work delayed-HR negative fixture is unavailable.");
    }
    strideRepeat.children[0]!.target = structuredClone(sustainedHeartRateTarget.target);
    const delayedHeartRateCompile = compileAiAuthoredPlanFirstDraft({
      draft: delayedHeartRateDraft,
      authoringInput: noPaceAuthorityInput,
    });
    assert.equal(
      delayedHeartRateCompile.ok,
      true,
      "Short-work HR suitability is coaching review, not compiler admission authority.",
    );

    const delayedRecoveryHeartRateDraft: AiAuthoredPlanFirstCompilerDraft =
      structuredClone(noPaceAuthorityDraft);
    const delayedRecoveryDays = [
      ...delayedRecoveryHeartRateDraft.detailed_block.workouts,
      delayedRecoveryHeartRateDraft.detailed_block.final_workout,
    ];
    const delayedRecoveryStride = delayedRecoveryDays.find(
      (workout) => workout.workout_identity === "easy_run_with_strides",
    );
    const delayedRecoveryRepeat = delayedRecoveryStride?.sections.find(
      (section) => section.kind === "repeat",
    );
    const delayedRecoveryChild =
      delayedRecoveryRepeat?.kind === "repeat"
        ? delayedRecoveryRepeat.children.find((child) => child.role === "recover")
        : null;
    if (!delayedRecoveryChild) {
      throw new Error("Short-recovery delayed-HR negative fixture is unavailable.");
    }
    delayedRecoveryChild.target = structuredClone(sustainedHeartRateTarget.target);
    const delayedRecoveryHeartRateCompile = compileAiAuthoredPlanFirstDraft({
      draft: delayedRecoveryHeartRateDraft,
      authoringInput: noPaceAuthorityInput,
    });
    assert.equal(
      delayedRecoveryHeartRateCompile.ok,
      true,
      "Short-recovery HR suitability is coaching review, not compiler admission authority.",
    );

    const noPaceWeeks = new Map<string, typeof noPaceAuthorityDraft.detailed_block.workouts>();
    for (const workout of noPaceAuthorityDays) {
      const weekStart = startOfWeekIso(workout.date);
      const week = noPaceWeeks.get(weekStart) ?? [];
      week.push(workout);
      noPaceWeeks.set(weekStart, week);
    }
    const fullNoPaceWeeks = [...noPaceWeeks.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
    assert.equal(fullNoPaceWeeks.length, 4);
    const timedMinutes = (workouts: typeof noPaceAuthorityDays) =>
      workouts.reduce(
        (weekTotal, workout) =>
          weekTotal +
          workout.sections.reduce((workoutTotal, section) => {
            if (section.kind === "hydration") return workoutTotal;
            if (section.kind === "unit") {
              return (
                workoutTotal +
                (section.prescription.mode === "time" ? section.prescription.duration_min : 0)
              );
            }
            return (
              workoutTotal +
              section.children.reduce(
                (repeatTotal, child) =>
                  repeatTotal +
                  (child.prescription.mode === "time"
                    ? child.prescription.duration_min * section.rounds
                    : 0),
                0,
              )
            );
          }, 0),
        0,
      );
    const thirdNoPaceWeek = fullNoPaceWeeks[2]![1];
    const fourthNoPaceWeek = fullNoPaceWeeks[3]![1];
    assert.ok(fourthNoPaceWeek.length <= thirdNoPaceWeek.length);
    assert.ok(timedMinutes(fourthNoPaceWeek) <= timedMinutes(thirdNoPaceWeek) * 0.85);

    const inventedPaceDraft: AiAuthoredPlanFirstCompilerDraft =
      structuredClone(noPaceAuthorityDraft);
    const inventedPaceSection = inventedPaceDraft.detailed_block.workouts[0]?.sections.find(
      (section) => section.kind === "unit",
    );
    if (!inventedPaceSection || inventedPaceSection.kind !== "unit") {
      throw new Error("No-authority pace negative fixture is unavailable.");
    }
    inventedPaceSection.target = {
      primary_execution_mode: "pace",
      command: "7:00-7:30/km",
    };
    const inventedPaceCompile = compileAiAuthoredPlanFirstDraft({
      draft: inventedPaceDraft,
      authoringInput: noPaceAuthorityInput,
    });
    assert.equal(inventedPaceCompile.ok, false);
    if (inventedPaceCompile.ok) {
      throw new Error("Executable pace compiled without factual authority.");
    }
    assert.ok(
      inventedPaceCompile.issues.some(
        (issue) =>
          issue.code === "ai_authored_plan_first_executable_pace_without_factual_authority",
      ),
    );

    const risingContactCutbackDraft: AiAuthoredPlanFirstCompilerDraft =
      structuredClone(noPaceAuthorityDraft);
    const fourthWeekStart = addDaysIso(risingContactCutbackDraft.detailed_block.start_date, 21);
    const occupiedDates = new Set(noPaceAuthorityDays.map((workout) => workout.date));
    const extraCutbackDate = Array.from({ length: 7 }, (_, index) =>
      addDaysIso(fourthWeekStart, index),
    ).find((date) => !occupiedDates.has(date));
    if (!extraCutbackDate) throw new Error("Cutback-contact negative fixture is unavailable.");
    risingContactCutbackDraft.detailed_block.workouts.push({
      ...structuredClone(risingContactCutbackDraft.detailed_block.workouts[0]!),
      date: extraCutbackDate,
    });
    const risingContactCutbackCompile = compileAiAuthoredPlanFirstDraft({
      draft: risingContactCutbackDraft,
      authoringInput: noPaceAuthorityInput,
    });
    assert.equal(risingContactCutbackCompile.ok, true);
    if (!risingContactCutbackCompile.ok) {
      throw new Error("A reviewable fourth-week contact increase remained fatal.");
    }

    const authoredHills = [
      ...fixtureDraft.detailed_block.workouts,
      fixtureDraft.detailed_block.final_workout,
    ].find((workout) => workout.workout_identity === "uphill_repeats");
    assert.ok(authoredHills, "QA fixture must cover terrain-safe uphill repeats.");
    const authoredHillRepeat = authoredHills?.sections.find((section) => section.kind === "repeat");
    assert.equal(authoredHillRepeat?.kind, "repeat");
    if (!authoredHillRepeat || authoredHillRepeat.kind !== "repeat") {
      throw new Error("QA fixture uphill repeats are unavailable.");
    }
    assert.deepEqual(
      authoredHillRepeat.children.map((child) => child.target),
      [
        { primary_execution_mode: "effort", effort_kind: "controlled_uphill" },
        {
          primary_execution_mode: "effort",
          effort_kind: "controlled_downhill_recovery",
        },
      ],
    );
    assert.equal(authoredHillRepeat.rounds, 6);
    assert.deepEqual(
      authoredHillRepeat.children.map((child) => child.prescription),
      [
        { mode: "distance", distance_km: 0.1 },
        { mode: "time", duration_min: 1 },
      ],
    );
    assert.match(authoredHillRepeat.children[0]?.cue ?? "", /controlled.*(?:not|never).*sprint/i);
    assert.match(authoredHillRepeat.children[1]?.cue ?? "", /control/i);
    const compiledHills = fixtureCompile.canonicalPlan.planned_workouts.find(
      (workout) => workout.workout_identity === "uphill_repeats",
    );
    assert.ok(compiledHills);
    const compiledTerrainTargets = compiledHills?.segments
      .flatMap((segment) => segment.prescription?.children ?? [])
      .map((child) => child.target);
    assert.deepEqual(
      compiledTerrainTargets?.map((target) => target?.primary_execution_mode),
      ["effort", "effort"],
    );
    assert.equal(
      compiledTerrainTargets?.some(
        (target) => target?.pace != null || target?.hr_bpm_range != null,
      ),
      false,
    );

    const unsafeTerrainDraft: AiAuthoredPlanFirstCompilerDraft = structuredClone(fixtureDraft);
    const unsafeHills = [
      ...unsafeTerrainDraft.detailed_block.workouts,
      unsafeTerrainDraft.detailed_block.final_workout,
    ].find((workout) => workout.workout_identity === "uphill_repeats");
    const unsafeHillRepeat = unsafeHills?.sections.find((section) => section.kind === "repeat");
    if (!unsafeHillRepeat || unsafeHillRepeat.kind !== "repeat") {
      throw new Error("Unsafe terrain regression fixture is unavailable.");
    }
    unsafeHillRepeat.children[0]!.target = {
      primary_execution_mode: "pace",
      command: "5:00-5:20/km",
    };
    const unsafeTerrainCompile = compileAiAuthoredPlanFirstDraft({
      draft: unsafeTerrainDraft,
      authoringInput: fixtureAuthoringInput,
    });
    assert.equal(
      unsafeTerrainCompile.ok,
      true,
      "Terrain target choice remains AI-authored coaching content when factual pace authority exists.",
    );

    const missingTerrainDistanceDraft: AiAuthoredPlanFirstCompilerDraft =
      structuredClone(fixtureDraft);
    const missingTerrainDistanceWorkout = [
      ...missingTerrainDistanceDraft.detailed_block.workouts,
      missingTerrainDistanceDraft.detailed_block.final_workout,
    ].find((workout) => workout.workout_identity === "uphill_repeats");
    const missingTerrainDistanceRepeat = missingTerrainDistanceWorkout?.sections.find(
      (section) => section.kind === "repeat",
    );
    if (!missingTerrainDistanceRepeat || missingTerrainDistanceRepeat.kind !== "repeat") {
      throw new Error("Terrain-distance negative fixture is unavailable.");
    }
    missingTerrainDistanceRepeat.children[0]!.prescription = {
      mode: "time",
      duration_min: 1,
    };
    const missingTerrainDistanceCompile = compileAiAuthoredPlanFirstDraft({
      draft: missingTerrainDistanceDraft,
      authoringInput: fixtureAuthoringInput,
    });
    assert.equal(
      missingTerrainDistanceCompile.ok,
      true,
      "Terrain work-unit choice is reviewable when the runnable leaf remains executable.",
    );

    const missingRecoveryDurationDraft: AiAuthoredPlanFirstCompilerDraft =
      structuredClone(fixtureDraft);
    const missingRecoveryDurationWorkout = [
      ...missingRecoveryDurationDraft.detailed_block.workouts,
      missingRecoveryDurationDraft.detailed_block.final_workout,
    ].find((workout) => workout.workout_identity === "uphill_repeats");
    const missingRecoveryDurationRepeat = missingRecoveryDurationWorkout?.sections.find(
      (section) => section.kind === "repeat",
    );
    if (!missingRecoveryDurationRepeat || missingRecoveryDurationRepeat.kind !== "repeat") {
      throw new Error("Terrain-recovery negative fixture is unavailable.");
    }
    missingRecoveryDurationRepeat.children[1]!.prescription = {
      mode: "distance",
      distance_km: 0.1,
    };
    const missingRecoveryDurationCompile = compileAiAuthoredPlanFirstDraft({
      draft: missingRecoveryDurationDraft,
      authoringInput: fixtureAuthoringInput,
    });
    assert.equal(
      missingRecoveryDurationCompile.ok,
      true,
      "Terrain recovery-unit choice is reviewable when the runnable leaf remains executable.",
    );
    assert.match(
      buildAiAuthoredPlanFirstPrompt({
        authoringInput: fixtureAuthoringInput,
        today: fixtureAuthoringInput.schedule.startDate,
      }).systemPrompt,
      /Every detailed workout must use a canonical workout_identity whose resolved workout family is listed in the owning Blueprint phase\.workout_families/,
      "The provider contract must state the same detailed-family ownership rule that the compiler enforces.",
    );
    assert.match(
      buildAiAuthoredPlanFirstPrompt({
        authoringInput: {
          ...fixtureAuthoringInput,
          runnerFacts: { ...fixtureAuthoringInput.runnerFacts, benchmark: null },
          planGoalIntent: {
            ...fixtureAuthoringInput.planGoalIntent,
            targetFinishTime: null,
          },
        },
        today: fixtureAuthoringInput.schedule.startDate,
      }).systemPrompt,
      /A stride recovery child must be exactly 1 minute; a controlled_tempo_session or distance_intervals short-work recovery child must be exactly 1 or 1\.5 minutes/,
      "The provider contract must expose the exact short-recovery durations accepted by the delayed-metric safety validator.",
    );
    for (const workout of fixtureCompile.canonicalPlan.planned_workouts) {
      if (workout.workout_family === "rest") continue;
      const phase = fixtureCompile.blueprint.phases.find(
        (candidate) => workout.date >= candidate.start_date && workout.date <= candidate.end_date,
      );
      assert.ok(
        phase?.workout_families.includes(workout.workout_family),
        `${workout.date} ${workout.workout_family} must be explained by its immutable Blueprint phase.`,
      );
    }

    const missingTargetCompile = compileAiAuthoredPlanFirstDraft({
      draft: fixtureDraft,
      authoringInput: {
        ...fixtureAuthoringInput,
        planGoalIntent: {
          ...fixtureAuthoringInput.planGoalIntent,
          targetDate: null,
        },
      },
    });
    assert.equal(missingTargetCompile.ok, false);
    if (missingTargetCompile.ok) {
      throw new Error("A fixture Blueprint compiled without a runner-selected target.");
    }
    assert.ok(
      missingTargetCompile.issues.some(
        (issue) => issue.code === "ai_authored_blueprint_selected_target_missing",
      ),
    );

    const postdatedFactsCompile = compileAiAuthoredPlanFirstDraft({
      draft: fixtureDraft,
      authoringInput: {
        ...fixtureAuthoringInput,
        runnerCapability: {
          ...fixtureAuthoringInput.runnerCapability,
          cutoff: {
            ...fixtureAuthoringInput.runnerCapability.cutoff,
            date: addDaysIso(fixtureAuthoringInput.schedule.startDate, 1),
          },
        },
      },
    });
    assert.equal(postdatedFactsCompile.ok, false);
    if (postdatedFactsCompile.ok) {
      throw new Error("Postdated runner facts unexpectedly compiled into an initial block.");
    }
    assert.ok(
      postdatedFactsCompile.issues.some(
        (issue) => issue.code === "ai_authored_blueprint_profile_cutoff_after_detailed_start",
      ),
    );

    const familyMismatchDraft = structuredClone(fixtureDraft);
    const familyMismatchRecoveryDay = familyMismatchDraft.detailed_block.workouts.find(
      (workout) => workout.workout_identity === "recovery_jog",
    );
    assert.ok(familyMismatchRecoveryDay, "The regression fixture requires one recovery workout.");
    assert.ok(familyMismatchDraft.blueprint.phases[0]?.workout_families.includes("recovery"));
    familyMismatchDraft.blueprint.phases[0]!.workout_families =
      familyMismatchDraft.blueprint.phases[0]!.workout_families.filter(
        (family) => family !== "recovery",
      );
    const familyMismatchCompile = compileAiAuthoredPlanFirstDraft({
      draft: familyMismatchDraft,
      authoringInput: fixtureAuthoringInput,
    });
    assert.equal(familyMismatchCompile.ok, true);
    if (!familyMismatchCompile.ok) {
      throw new Error("A mechanically derived detailed family did not reach Review.");
    }
    assert.ok(
      familyMismatchCompile.blueprint.phases[0]?.workout_families.includes("recovery"),
      "The normalized Blueprint must describe the unchanged detailed workout family.",
    );
    assert.ok(
      familyMismatchCompile.validationIssues.includes(
        `ai_authored_blueprint_detailed_family_derived:blueprint.phases.0.workout_families:recovery:detailed_block.days.${familyMismatchRecoveryDay.date}`,
      ),
      "A derived detailed family must remain visible in validation metadata.",
    );
    const phaseMismatchDraft = structuredClone(fixtureDraft);
    const recoveryDay = phaseMismatchDraft.detailed_block.workouts.find(
      (workout) => workout.workout_identity === "recovery_jog",
    );
    assert.ok(recoveryDay, "The regression fixture requires one recovery workout.");
    recoveryDay.phase = "Foreign provider phase";
    const phaseMismatchCompile = compileAiAuthoredPlanFirstDraft({
      draft: phaseMismatchDraft,
      authoringInput: fixtureAuthoringInput,
    });
    assert.equal(phaseMismatchCompile.ok, false);
    if (phaseMismatchCompile.ok) {
      throw new Error("A detailed workout with a foreign phase unexpectedly compiled.");
    }
    assert.ok(
      phaseMismatchCompile.issues.some(
        (issue) => issue.code === "ai_authored_blueprint_detailed_phase_mismatch",
      ),
      "Phase-family normalization must not weaken phase/date ownership checks.",
    );
    const familyAliasDraft = structuredClone(fixtureDraft);
    const aliasPhase = familyAliasDraft.blueprint.phases.find((phase) =>
      phase.workout_families.includes("easy"),
    );
    assert.ok(aliasPhase, "The regression fixture requires one phase with the easy family.");
    const aliasProjection = familyAliasDraft.blueprint.projections.find(
      (projection) =>
        projection.phase === aliasPhase.phase &&
        projection.date >= aliasPhase.start_date &&
        projection.date <= aliasPhase.end_date &&
        projection.cadence_or_workout_family === "easy",
    );
    assert.ok(aliasProjection, "The regression fixture requires one easy projection.");
    aliasPhase.workout_families[aliasPhase.workout_families.indexOf("easy")] = "strides" as never;
    aliasProjection.cadence_or_workout_family = "strides" as never;
    const familyAliasCompile = compileAiAuthoredPlanFirstDraft({
      draft: familyAliasDraft,
      authoringInput: fixtureAuthoringInput,
    });
    assert.equal(familyAliasCompile.ok, true);
    if (!familyAliasCompile.ok) {
      throw new Error("A canonical workout-identity alias did not normalize to its family.");
    }
    assert.ok(
      familyAliasCompile.blueprint.phases
        .find((phase) => phase.phase === aliasPhase.phase)
        ?.workout_families.includes("easy"),
      "The normalized Blueprint must retain the derived canonical family.",
    );
    assert.equal(
      familyAliasCompile.blueprint.projections.find(
        (projection) => projection.projection_id === aliasProjection.projection_id,
      )?.cadence_or_workout_family,
      "easy",
    );
    assert.equal(
      familyAliasCompile.validationIssues.filter((issue) =>
        issue.startsWith("ai_authored_blueprint_family_alias_normalized:"),
      ).length,
      2,
      "Every accepted provider family alias normalization must remain visible in metadata.",
    );
    const unknownFamilyDraft = structuredClone(fixtureDraft);
    unknownFamilyDraft.blueprint.phases[0]!.workout_families[0] = "not_a_workout_family" as never;
    const unknownFamilyCompile = compileAiAuthoredPlanFirstDraft({
      draft: unknownFamilyDraft,
      authoringInput: fixtureAuthoringInput,
    });
    assert.equal(unknownFamilyCompile.ok, false);
    if (unknownFamilyCompile.ok) {
      throw new Error("An unknown provider family unexpectedly compiled.");
    }
    assert.ok(
      unknownFamilyCompile.issues.some(
        (issue) => issue.code === "ai_authored_plan_first_provider_schema_invalid",
      ),
      "Unknown provider family values must remain fail-closed at the strict schema boundary.",
    );
    assert.ok(
      [...fixtureDraft.detailed_block.workouts, fixtureDraft.detailed_block.final_workout]
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
    const qaFixtureAuthoringInput = buildAiGeneratedRunningPlanQaFixtureAuthoringInput(
      result.draft.normalizedInputSummary.runnerCapability.cutoff.date,
      {
        mode: "prospective_preview",
        selectedTargetDate: scenarios[0]!.input.planGoalIntent.targetDate,
      },
    );
    const acceptedQaFixtureAuthoringInput = buildAiGeneratedRunningPlanAuthoringInputRuntime(
      scenarios[0]!.input,
      result.draft.normalizedInputSummary.runnerCapability,
      result.draft.normalizedInputSummary.heartRateProfile,
    );
    assert.equal(
      acceptedQaFixtureAuthoringInput.ok,
      true,
      acceptedQaFixtureAuthoringInput.ok ? "" : acceptedQaFixtureAuthoringInput.message,
    );
    if (!acceptedQaFixtureAuthoringInput.ok) {
      throw new Error(acceptedQaFixtureAuthoringInput.message);
    }
    const prospectiveAcceptedInput = buildProspectiveAiGeneratedRunningPlanQaFixtureAuthoringInput(
      acceptedQaFixtureAuthoringInput.authoringInput,
    );
    assert.deepEqual(
      {
        ...prospectiveAcceptedInput,
        schedule: acceptedQaFixtureAuthoringInput.authoringInput.schedule,
      },
      acceptedQaFixtureAuthoringInput.authoringInput,
      "The QA fixture may only rebase the accepted schedule start date.",
    );
    assert.equal(
      result.draft.normalizedInputSummary.age,
      scenarios[0]!.input.age,
      "The QA fixture must preserve the accepted persisted runner age.",
    );
    assert.equal(result.draft.normalizedInputSummary.heightCm, scenarios[0]!.input.heightCm);
    assert.equal(result.draft.normalizedInputSummary.weightKg, scenarios[0]!.input.weightKg);
    assert.deepEqual(
      result.draft.normalizedInputSummary.runnerCapability,
      acceptedQaFixtureAuthoringInput.authoringInput.runnerCapability,
      "The QA fixture must freeze the accepted server-owned runner capability.",
    );
    assert.ok(
      qaFixtureAuthoringInput.runnerCapability.cutoff.date <=
        qaFixtureAuthoringInput.schedule.startDate,
      "QA preview facts must not post-date its prospective detailed start.",
    );
    assert.equal(
      result.draft.normalizedInputSummary.startDate,
      qaFixtureAuthoringInput.schedule.startDate,
    );
    assert.equal(
      result.draft.normalizedInputSummary.planGoalIntent.distance?.distanceMeters,
      10_000,
    );
    assert.equal(result.draft.blueprint.selectedTargetDate, result.draft.canonicalPlan.target_date);
    assert.ok(
      result.draft.blueprint.selectedTargetDate > result.draft.blueprint.detailedHorizon.endDate,
    );
    assert.equal(
      result.draft.blueprint.detailedHorizon.endDate,
      resolveAiAuthoredPlanFirstDetailedEndDate({
        startDate: qaFixtureAuthoringInput.schedule.startDate,
        targetDate: qaFixtureAuthoringInput.planGoalIntent.targetDate!,
      }),
    );
    assert.ok(
      result.draft.endpointProof.finalDate <= result.draft.blueprint.detailedHorizon.endDate,
    );
    assert.ok(
      result.draft.canonicalPlan.planned_workouts.some(
        (workout) => workout.date === result.draft.endpointProof.finalDate,
      ),
    );
    assert.equal(result.draft.endpointProof.endpointMainDistanceMeters, null);
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
    assert.equal(
      inputIndependentResult.draft.blueprint.selectedTargetDate,
      scenarios[2]!.input.planGoalIntent.targetDate,
      "QA fixture must preserve the runner-selected target date.",
    );
    assert.notDeepEqual(
      inputIndependentResult.draft.canonicalPlan,
      result.draft.canonicalPlan,
      "Different runner-selected target dates must not reuse one fixture Blueprint.",
    );

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

function buildScenarioAiPreviewOptions(
  input: RunningPlanPreviewActionInput,
  config: { nonRepeatTempo?: boolean } = {},
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const env = {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
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
  if (expectedEndpointMeters != null && draft.blueprint.detailedHorizon.targetBoundary) {
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
  } else if (expectedEndpointMeters != null) {
    assert.equal(
      endpointWorkout,
      undefined,
      `${scenarioName} must keep its future target non-executable outside the four-week detail block.`,
    );
    if (expectedFinalDate) {
      assert.equal(draft.blueprint.selectedTargetDate, expectedFinalDate);
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
        if (target?.primary_execution_mode === "effort") {
          assert.equal(segment.prescription?.mode, "repeats");
          assert.ok("role" in leaf);
          if (workout.workout_identity === "uphill_repeats") {
            assert.ok(leaf.role === "work" || leaf.role === "recover");
            assert.match(target.intensity ?? "", /Controlled (?:uphill effort|downhill recovery)/);
          } else if (workout.workout_identity === "easy_run_with_strides") {
            assert.equal(leaf.prescription?.mode, "time");
            if (leaf.role === "work") {
              assert.equal(target.intensity, "Controlled stride effort");
              assert.ok((leaf.prescription?.duration_min ?? Infinity) <= 0.5);
            } else {
              assert.equal(leaf.role, "recover");
              assert.equal(target.intensity, "Controlled short recovery effort");
              assert.ok((leaf.prescription?.duration_min ?? Infinity) <= 1);
            }
          } else {
            assert.ok(
              workout.workout_identity === "controlled_tempo_session" ||
                workout.workout_identity === "distance_intervals",
            );
            if (leaf.role === "work") {
              assert.equal(target.intensity, "Controlled short repetition effort");
            } else {
              assert.equal(leaf.role, "recover");
              assert.equal(target.intensity, "Controlled short recovery effort");
              assert.equal(leaf.prescription?.mode, "time");
              assert.ok((leaf.prescription?.duration_min ?? Infinity) <= 1.5);
            }
          }
          assert.equal(hasPace || hasHeartRate, false);
        }
        assert.ok(
          target?.primary_execution_mode === "pace" ||
            target?.primary_execution_mode === "heart_rate" ||
            target?.primary_execution_mode === "effort",
          `${scenarioName} generated runnable leaves allow only pace, BPM, or bounded controlled-effort commands.`,
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
  assert.equal(work.target?.primary_execution_mode, "heart_rate");
  assert.match(work.target?.hr_bpm_range ?? "", /^\d+-\d+ bpm$/);
  assert.equal(work.guidance, "Keep the effort controlled at RPE max 7/10.");
  assert.equal(work.target?.intensity, undefined);
  assert.equal(work.target?.hint, undefined);
  assert.equal(work.target?.pace, undefined);
  assert.equal(work.target?.extra?.hr_zone_reference, "Z4");

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

function containsObjectKey(value: unknown, key: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => containsObjectKey(entry, key));
  if (value == null || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    Object.prototype.hasOwnProperty.call(record, key) ||
    Object.values(record).some((entry) => containsObjectKey(entry, key))
  );
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
        output_tokens_details: { reasoning_tokens: 25 },
        total_tokens: 200,
      },
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}
