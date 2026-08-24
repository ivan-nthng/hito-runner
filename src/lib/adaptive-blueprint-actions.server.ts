import "@tanstack/react-start/server-only";

import type { AdaptiveContinuationInput } from "@/lib/adaptive-blueprint-product-contract";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedContinuationDevFixtureOpenAiFetch,
  isAiGeneratedRunningPlanDevFixtureEnabled,
  resolveAiGeneratedRunningPlanProviderMode,
} from "@/lib/ai-generated-running-plan-dev-fixture";
import {
  ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
  ADAPTIVE_CONTINUATION_COMPILER_VERSION,
  ADAPTIVE_CONTINUATION_PROMPT_VERSION,
  ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
  ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
  buildAdaptiveContinuationAuthoringPrompt,
  compileAdaptiveContinuationProviderResponse,
  type AdaptiveContinuationAuthoringBriefV2,
} from "@/lib/adaptive-continuation-authoring";
import {
  parseAdaptiveContinuationHorizonCheckIn,
  type AdaptiveContinuationCandidateDraft,
} from "@/lib/adaptive-blueprint-continuation";
import {
  getAdaptiveTrainingDetailedCandidateForUser,
  getAdaptiveTrainingContinuationSourceStateForUser,
  getAdaptiveTrainingOriginalAuthoringInputForUser,
  retainAdaptiveTrainingContinuationCandidateForUser,
  retainAdaptiveTrainingContinuationInputRevisionForUser,
} from "@/lib/adaptive-blueprint-persistence";
import {
  getAdaptiveBlueprintCalendarReadModelForUser,
  getAdaptiveBlueprintContinuationDecisionForUser,
  readAdaptiveProjectionPreferences,
} from "@/lib/adaptive-blueprint-read-model";
import {
  DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS,
  DEFAULT_AI_FIRST_PLAN_TIMEOUT_MS,
  requestAiPlanStructuredResponse,
  resolveAiPlanStructuredResponseProviderSettings,
  type AiPlanStructuredResponseResult,
} from "@/lib/ai-first-plan-draft-service";
import {
  getAiPlanGenerationResponseForUser,
  getReusableAiPlanGenerationResponseForUser,
  recordAiPlanGenerationAttemptResultForUser,
  recordAiPlanGenerationResponseOutcomeForUser,
  retainCompletedAiPlanGenerationResponseForUser,
  type AiPlanGenerationAttemptVersionContext,
} from "@/lib/ai-plan-generation-response-persistence";
import { CONTINUATION_DECISION_POLICY_VERSION } from "@/lib/adaptive-training-decision";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { digestSha256Hex, stableJsonStringify } from "@/lib/review-token-signing";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { serverEnv } from "@/lib/supabase/env";
import { structuredPlanAuthoringInputSchema } from "@/lib/structured-plan-authoring-schema";

export async function submitAdaptiveContinuationInputForCurrentRequest(
  input: AdaptiveContinuationInput,
) {
  return submitAdaptiveContinuationInputForUser(
    await requirePersistedUserIdForCurrentRequest(),
    input,
  );
}

export async function prepareAdaptiveContinuationCandidateForCurrentRequest() {
  const auth = getRequestAuthContext();
  const userId = await requirePersistedUserIdForCurrentRequest();
  return prepareAdaptiveContinuationCandidateForUser(
    {
      userId,
      asOfDate: await getRunnerCalendarDateForUserId(userId),
    },
    {
      qaFixtureAuthorized: auth.provider === "local" && Boolean(auth.userId),
    },
  );
}

export async function submitAdaptiveContinuationInputForUser(
  userId: string,
  input: AdaptiveContinuationInput,
) {
  const state = await getAdaptiveTrainingContinuationSourceStateForUser(userId);
  if (!state) {
    return { ok: false as const, reason: "source_missing" as const };
  }
  if (
    state.blueprint.id !== input.expectedBlueprint.id ||
    state.blueprint.version !== input.expectedBlueprint.version ||
    state.blueprint.content_sha256 !== input.expectedBlueprint.sha256 ||
    state.confirmation.id !== input.expectedConfirmationId ||
    (input.horizonCheckIn !== null &&
      input.horizonCheckIn.confirmationId !== input.expectedConfirmationId)
  ) {
    return { ok: false as const, reason: "source_stale" as const };
  }
  const retained = await retainAdaptiveTrainingContinuationInputRevisionForUser({
    userId,
    blueprint: input.expectedBlueprint,
    activeProjectionPreferences: input.activeProjectionPreferences,
    horizonCheckIn: input.horizonCheckIn,
  });
  return { ok: true as const, retained };
}

export type AdaptiveContinuationPreparationDependencies = {
  qaFixtureAuthorized?: boolean;
  providerModel?: string;
  requestStructuredResponse?: (input: {
    prompt: ReturnType<typeof buildAdaptiveContinuationAuthoringPrompt>;
    brief: AdaptiveContinuationAuthoringBriefV2;
  }) => Promise<AiPlanStructuredResponseResult>;
  explicitRetainedResponseRecompile?: {
    responseRecordId: string;
    rejectedCandidateId: string;
    expectedRejectedCandidateCompilerVersion: `adaptive_continuation_compiler_v${number}`;
    expectedPromptVersion: "adaptive_continuation_prompt_v5";
    expectedCompilerVersion: "adaptive_continuation_compiler_v3";
  };
  explicitTechnicallyRejectedRetainedResponseRecompile?: {
    responseRecordId: string;
    expectedPromptVersion: `adaptive_continuation_prompt_v${number}`;
    expectedCompilerVersion: `adaptive_continuation_compiler_v${number}`;
    expectedDiagnosticCode: string;
  };
};

type ContinuationDecisionContext = NonNullable<
  Awaited<ReturnType<typeof getAdaptiveBlueprintContinuationDecisionForUser>>
>;
type ReadyContinuationContext = ContinuationDecisionContext & {
  decision: Extract<
    NonNullable<ContinuationDecisionContext["decision"]>,
    { status: "authoring_ready" }
  >;
  window: NonNullable<ContinuationDecisionContext["window"]>;
  facts: NonNullable<ContinuationDecisionContext["facts"]> & {
    targetIntervalOccupancy: NonNullable<
      NonNullable<ContinuationDecisionContext["facts"]>["targetIntervalOccupancy"]
    >;
  };
};

export async function prepareAdaptiveContinuationCandidateForUser(
  input: { userId: string; asOfDate: string },
  dependencies: AdaptiveContinuationPreparationDependencies = {},
) {
  if (
    dependencies.explicitRetainedResponseRecompile &&
    dependencies.explicitTechnicallyRejectedRetainedResponseRecompile
  ) {
    throw new Error("A continuation response may use only one explicit recompile mode.");
  }
  const publicBefore = await getAdaptiveBlueprintCalendarReadModelForUser(
    input.userId,
    input.asOfDate,
  );
  if (
    publicBefore.continuation.status === "candidate_ready" &&
    !dependencies.explicitRetainedResponseRecompile &&
    !dependencies.explicitTechnicallyRejectedRetainedResponseRecompile
  ) {
    return { ok: true as const, state: publicBefore.continuation, retained: false as const };
  }
  const current = await getAdaptiveBlueprintContinuationDecisionForUser(input);
  if (!current || !current.decision || current.decision.status !== "authoring_ready") {
    return {
      ok: false as const,
      reason: "not_ready" as const,
      state: publicBefore.continuation,
    };
  }
  if (
    !current.window ||
    !current.facts ||
    !current.facts.targetIntervalOccupancy ||
    !current.state.latestInputRevision
  ) {
    throw new Error("The adaptive continuation decision is missing its frozen source facts.");
  }
  const originalInput = await getAdaptiveTrainingOriginalAuthoringInputForUser({
    userId: input.userId,
    blueprintId: current.state.blueprint.id,
  });
  const parsedOriginal = structuredPlanAuthoringInputSchema.safeParse(originalInput);
  if (!parsedOriginal.success) {
    throw new Error("The immutable Blueprint is missing its original authoring input.");
  }
  const { requestContext: _requestContext, ...originalAuthoringInput } = parsedOriginal.data;
  const comparableContextKeys = new Set(current.decision.comparableContextKeys);
  const brief: AdaptiveContinuationAuthoringBriefV2 = {
    version: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
    decision: {
      version: current.decision.version,
      policyVersion: current.decision.policyVersion,
      status: current.decision.status,
      authoringMode: current.decision.authoringMode,
      interval: current.decision.interval,
      projectionIds: current.decision.projectionIds,
      comparableContextKeys: current.decision.comparableContextKeys,
      progress: {
        quality: current.decision.fitnessProfile.quality,
        explicitMissingReasons: current.decision.fitnessProfile.missingReasons,
        comparableContexts: current.decision.fitnessProfile.comparableGroups.map((group) => ({
          contextKey: group.contextKey,
          acceptedFitDayCount: group.acceptedActualDays.length,
          compatibleRpeDayCount: group.compatibleRpeDays.length,
          detailChangeEligible: comparableContextKeys.has(group.contextKey),
        })),
      },
    },
    blueprint: {
      id: current.state.blueprint.id,
      version: current.state.blueprint.version,
      sha256: current.state.blueprint.content_sha256,
      selectedTargetDate: current.blueprint.selectedTargetDate,
    },
    predecessorConfirmationId: current.state.confirmation.id,
    projections: current.projections,
    constraints: {
      profileFingerprint: current.facts.normalizedProfileConstraintSha256,
      continuationInputFingerprint: current.state.latestInputRevision.content_sha256,
      targetIntervalOccupancyFingerprint:
        current.facts.targetIntervalOccupancy.calendarOccupancyFingerprint,
      calendarOutcomeFingerprint: current.facts.calendar.calendarOutcomeFingerprint,
      evidenceRevisionFingerprint: current.facts.evidence.evidenceRevisionFingerprint,
      activePreferenceCount: current.state.latestInputRevision
        ? current.preferenceApplications.length
        : 0,
      occupiedDates: current.facts.targetIntervalOccupancy.occupiedDates.map(
        (entry) => entry.workoutDate,
      ),
    },
  };
  const prompt = buildAdaptiveContinuationAuthoringPrompt({ brief, originalAuthoringInput });
  const providerModel =
    dependencies.providerModel ??
    (dependencies.requestStructuredResponse ||
    resolveAiGeneratedRunningPlanProviderMode() === "qa_fixture"
      ? AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL
      : (serverEnv.openAiPlanModel ?? "gpt-5.2"));
  const versionContext: AiPlanGenerationAttemptVersionContext = {
    schemaVersion: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
    promptVersion: ADAPTIVE_CONTINUATION_PROMPT_VERSION,
    policyVersion: CONTINUATION_DECISION_POLICY_VERSION,
    compilerVersion: ADAPTIVE_CONTINUATION_COMPILER_VERSION,
    providerSettings: resolveAiPlanStructuredResponseProviderSettings({
      model: providerModel,
      contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
      responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
      responseSchemaName: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
      timeoutMs: DEFAULT_AI_FIRST_PLAN_TIMEOUT_MS,
      maxOutputTokens: DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS,
    }),
  };
  const requestContext = { brief };
  const coachRejectedRetainedResponse = dependencies.explicitRetainedResponseRecompile
    ? await requireRejectedRetainedResponseForRecompile({
        userId: input.userId,
        current: current as ReadyContinuationContext,
        requestContext,
        providerModel,
        ...dependencies.explicitRetainedResponseRecompile,
      })
    : null;
  const technicallyRejectedRetainedResponse =
    dependencies.explicitTechnicallyRejectedRetainedResponseRecompile
      ? await requireTechnicallyRejectedRetainedResponseForRecompile({
          userId: input.userId,
          requestContext,
          providerModel,
          ...dependencies.explicitTechnicallyRejectedRetainedResponseRecompile,
        })
      : null;
  const explicitRetainedResponse =
    coachRejectedRetainedResponse ?? technicallyRejectedRetainedResponse;
  const reusableResponse = explicitRetainedResponse
    ? null
    : await getReusableAiPlanGenerationResponseForUser({
        userId: input.userId,
        requestContext,
        versionContext,
        providerModel,
        prompt,
      });
  const requested = reusableResponse
    ? null
    : explicitRetainedResponse
      ? null
      : dependencies.requestStructuredResponse
        ? await dependencies.requestStructuredResponse({ prompt, brief })
        : await requestDefaultStructuredResponse({
            prompt,
            brief,
            originalAuthoringInput,
            providerModel,
            qaFixtureAuthorized: dependencies.qaFixtureAuthorized === true,
          });
  let retainedResponse = explicitRetainedResponse ?? reusableResponse;
  if (!retainedResponse) {
    const generationId = requested?.generationTrace?.generationId;
    if (!generationId || !requested?.generationTrace) {
      throw new Error("The completed continuation response has no retention identity.");
    }
    retainedResponse = await retainCompletedAiPlanGenerationResponseForUser({
      userId: input.userId,
      generationId,
      providerResponseId: requested.providerResponseId,
      responseBody: requested.rawOutput,
      requestContext,
      versionContext,
      generationTrace: requested.generationTrace,
    });
  }
  const compiled = compileAdaptiveContinuationProviderResponse({
    response: requested?.parsedOutput ?? JSON.parse(retainedResponse.response_body),
    brief,
    blueprint: current.blueprint,
    originalAuthoringInput,
    explicitRetainedTargetBoundaryRepair: Boolean(coachRejectedRetainedResponse),
  });
  if (!compiled.ok) {
    if (explicitRetainedResponse) {
      throw new Error(
        `The rejected retained continuation response cannot be safely recompiled: ${compiled.issues[0]?.code ?? compiled.reason}.`,
      );
    }
    await recordAiPlanGenerationResponseOutcomeForUser({
      userId: input.userId,
      responseRecordId: retainedResponse.id,
      schemaOutcome:
        compiled.reason === "adaptive_continuation_provider_schema_invalid"
          ? "rejected"
          : "accepted",
      compilerOutcome:
        compiled.reason === "adaptive_continuation_provider_schema_invalid"
          ? "not_run"
          : "rejected",
      diagnostic: {
        code: compiled.issues[0]?.code ?? compiled.reason,
        path: compiled.issues[0]?.path ?? "root",
      },
    });
    await recordAiPlanGenerationAttemptResultForUser({
      userId: input.userId,
      responseRecordId: retainedResponse.id,
      result: {
        outcome: "technical_rejection",
        candidateRecordId: null,
        candidateSha256: null,
        noPrescriptionReason: null,
      },
    });
    return {
      ok: false as const,
      reason: "compiler_rejection" as const,
      diagnostic: {
        code: compiled.issues[0]?.code ?? compiled.reason,
        path: compiled.issues[0]?.path ?? "root",
      },
    };
  }
  const acceptedResponse = technicallyRejectedRetainedResponse
    ? technicallyRejectedRetainedResponse
    : explicitRetainedResponse
      ? explicitRetainedResponse
      : await recordAiPlanGenerationResponseOutcomeForUser({
          userId: input.userId,
          responseRecordId: retainedResponse.id,
          schemaOutcome: "accepted",
          compilerOutcome: "accepted",
          diagnostic: null,
        });
  const authoringBriefSha256 = await digestSha256Hex(JSON.stringify(brief));
  const decisionSha256 = await digestSha256Hex(JSON.stringify(current.decision));
  const candidate = buildCandidateDraft({
    current: current as ReadyContinuationContext,
    workoutDocuments: compiled.workoutDocuments,
    authoringBriefSha256,
    decisionSha256,
    retainedResponse: acceptedResponse,
    technicalRecompile: technicallyRejectedRetainedResponse
      ? {
          sourceCompilerVersion:
            dependencies.explicitTechnicallyRejectedRetainedResponseRecompile!
              .expectedCompilerVersion,
          diagnosticCode:
            dependencies.explicitTechnicallyRejectedRetainedResponseRecompile!
              .expectedDiagnosticCode,
        }
      : null,
  });
  const retained = await retainAdaptiveTrainingContinuationCandidateForUser({
    userId: input.userId,
    blueprint: {
      id: current.state.blueprint.id,
      version: current.state.blueprint.version,
      sha256: current.state.blueprint.content_sha256,
    },
    predecessorConfirmationId: current.state.confirmation.id,
    retainedResponse: acceptedResponse,
    candidate,
  });
  if (!explicitRetainedResponse) {
    await recordAiPlanGenerationAttemptResultForUser({
      userId: input.userId,
      responseRecordId: acceptedResponse.id,
      result: {
        outcome: "candidate_ready",
        candidateRecordId: retained.candidateId,
        candidateSha256: retained.candidateSha256,
        noPrescriptionReason: null,
      },
    });
  }
  const publicAfter = await getAdaptiveBlueprintCalendarReadModelForUser(
    input.userId,
    input.asOfDate,
  );
  if (publicAfter.continuation.status !== "candidate_ready") {
    throw new Error("The retained continuation candidate is not current after readback.");
  }
  return {
    ok: true as const,
    state: publicAfter.continuation,
    retained: true as const,
    retainedCandidate: retained,
    recompiledFromRetainedResponse: Boolean(explicitRetainedResponse),
    providerDispatchCount: explicitRetainedResponse ? (0 as const) : requested ? 1 : 0,
  };
}

async function requireTechnicallyRejectedRetainedResponseForRecompile(input: {
  userId: string;
  requestContext: { brief: AdaptiveContinuationAuthoringBriefV2 };
  providerModel: string;
  responseRecordId: string;
  expectedPromptVersion: `adaptive_continuation_prompt_v${number}`;
  expectedCompilerVersion: `adaptive_continuation_compiler_v${number}`;
  expectedDiagnosticCode: string;
}) {
  const response = await getAiPlanGenerationResponseForUser(input.userId, input.responseRecordId);
  const versionContext = response?.version_context;
  const attemptResult = response?.attempt_result;
  if (
    !response ||
    response.user_id !== input.userId ||
    response.provider_model !== input.providerModel ||
    response.schema_outcome !== "accepted" ||
    response.compiler_outcome !== "rejected" ||
    response.diagnostic_code !== input.expectedDiagnosticCode ||
    !isRecord(versionContext) ||
    versionContext.promptVersion !== input.expectedPromptVersion ||
    versionContext.compilerVersion !== input.expectedCompilerVersion ||
    !isRecord(attemptResult) ||
    attemptResult.outcome !== "technical_rejection" ||
    attemptResult.candidateRecordId !== null ||
    stableJsonStringify(response.request_context) !== stableJsonStringify(input.requestContext)
  ) {
    throw new Error(
      "The retained response does not match the current owner-bound technical rejection.",
    );
  }
  return response;
}

async function requireRejectedRetainedResponseForRecompile(input: {
  userId: string;
  current: ReadyContinuationContext;
  requestContext: { brief: AdaptiveContinuationAuthoringBriefV2 };
  providerModel: string;
  responseRecordId: string;
  rejectedCandidateId: string;
  expectedRejectedCandidateCompilerVersion: `adaptive_continuation_compiler_v${number}`;
  expectedPromptVersion: "adaptive_continuation_prompt_v5";
  expectedCompilerVersion: "adaptive_continuation_compiler_v3";
}) {
  const [response, candidate] = await Promise.all([
    getAiPlanGenerationResponseForUser(input.userId, input.responseRecordId),
    getAdaptiveTrainingDetailedCandidateForUser({
      userId: input.userId,
      candidateId: input.rejectedCandidateId,
    }),
  ]);
  const versionContext = response?.version_context;
  const coachVerdict = response?.running_coach_verdict;
  const inputSnapshot = candidate?.input_snapshot;
  const inputProvenance = candidate?.input_provenance;
  const candidateBlueprint = isRecord(inputSnapshot) ? inputSnapshot.blueprint : null;
  const candidateConfirmation = isRecord(inputSnapshot) ? inputSnapshot.confirmation : null;
  if (
    !response ||
    !candidate ||
    response.user_id !== input.userId ||
    response.provider_model !== input.providerModel ||
    response.schema_outcome !== "accepted" ||
    response.compiler_outcome !== "accepted" ||
    candidate.source_response_id !== response.id ||
    candidate.blueprint_id !== input.current.state.blueprint.id ||
    !isRecord(inputProvenance) ||
    inputProvenance.compilerVersion !== input.expectedRejectedCandidateCompilerVersion ||
    !isRecord(candidateBlueprint) ||
    candidateBlueprint.version !== input.current.state.blueprint.version ||
    candidateBlueprint.sha256 !== input.current.state.blueprint.content_sha256 ||
    !isRecord(candidateConfirmation) ||
    candidateConfirmation.id !== input.current.state.confirmation.id ||
    !isRecord(versionContext) ||
    versionContext.promptVersion !== input.expectedPromptVersion ||
    versionContext.compilerVersion !== input.expectedCompilerVersion ||
    !isRecord(coachVerdict) ||
    coachVerdict.verdict !== "rejected" ||
    stableJsonStringify(response.request_context) !== stableJsonStringify(input.requestContext)
  ) {
    throw new Error(
      "The retained response does not match the rejected current continuation lineage.",
    );
  }
  return response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function requestDefaultStructuredResponse(input: {
  prompt: ReturnType<typeof buildAdaptiveContinuationAuthoringPrompt>;
  brief: AdaptiveContinuationAuthoringBriefV2;
  originalAuthoringInput: Parameters<
    typeof buildAiGeneratedContinuationDevFixtureOpenAiFetch
  >[0]["authoringInput"];
  providerModel: string;
  qaFixtureAuthorized: boolean;
}) {
  if (resolveAiGeneratedRunningPlanProviderMode() === "qa_fixture") {
    if (!isAiGeneratedRunningPlanDevFixtureEnabled() || !input.qaFixtureAuthorized) {
      throw new Error(
        "This local QA fixture session is not authorized to prepare an adaptive continuation candidate.",
      );
    }
    return requestAiPlanStructuredResponse({
      apiKey: "local-adaptive-continuation-fixture",
      model: input.providerModel,
      prompt: input.prompt,
      responseSchemaName: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
      contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
      responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
      fetchImpl: buildAiGeneratedContinuationDevFixtureOpenAiFetch({
        authoringInput: input.originalAuthoringInput,
        brief: input.brief,
      }),
      generationLedger: { disabled: true },
    });
  }

  const apiKey = serverEnv.openAiApiKey;
  if (!apiKey) throw new Error("OpenAI is not configured for continuation authoring.");
  return requestAiPlanStructuredResponse({
    apiKey,
    model: input.providerModel,
    prompt: input.prompt,
    responseSchemaName: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
    contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
    responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
  });
}

function buildCandidateDraft(input: {
  current: ReadyContinuationContext;
  workoutDocuments: AdaptiveContinuationCandidateDraft["candidateContent"]["workoutDocuments"];
  authoringBriefSha256: string;
  decisionSha256: string;
  retainedResponse: Awaited<ReturnType<typeof recordAiPlanGenerationResponseOutcomeForUser>>;
  technicalRecompile: {
    sourceCompilerVersion: `adaptive_continuation_compiler_v${number}`;
    diagnosticCode: string;
  } | null;
}): AdaptiveContinuationCandidateDraft {
  const { current } = input;
  if (!current.window || !current.facts || !current.state.latestInputRevision) {
    throw new Error("The adaptive continuation candidate cannot freeze incomplete inputs.");
  }
  const parsedCheckIn = parseAdaptiveContinuationHorizonCheckIn(
    current.state.latestInputRevision.horizon_check_in,
  );
  if (!parsedCheckIn) {
    throw new Error("The adaptive continuation candidate requires a retained horizon check-in.");
  }
  const omitAsOf = <T extends { asOf: string }>(packet: T): Omit<T, "asOf"> => {
    const { asOf: _asOf, ...rest } = packet;
    return rest;
  };
  const mode = current.decision.authoringMode;
  return {
    intervalStartDate: current.window.intervalStartDate,
    intervalEndDate: current.window.intervalEndDate,
    candidateContent: {
      contractVersion: "adaptive_detailed_block_review_candidate_v1",
      blockMode: current.window.mode,
      interval: {
        startDate: current.window.intervalStartDate,
        endDate: current.window.intervalEndDate,
      },
      workoutDocuments: input.workoutDocuments,
      factsUsed: {
        evidenceCutoffDate: current.window.evidenceCutoffDate,
        calendarOutcomeFingerprint: current.facts.calendar.calendarOutcomeFingerprint,
        evidenceRevisionFingerprint: current.facts.evidence.evidenceRevisionFingerprint,
        targetIntervalOccupancyFingerprint:
          current.facts.targetIntervalOccupancy.calendarOccupancyFingerprint,
      },
      factsMissing: [...current.decision.fitnessProfile.missingReasons],
      conflicts: current.conflicts,
      preferenceApplications: current.preferenceApplications,
      performanceAdaptation: {
        applied: mode === "fact_shaped",
        mode,
        comparableContextKeys: [...current.decision.comparableContextKeys],
        reason:
          mode === "fact_shaped"
            ? "fact_shaped_from_comparable_fit_and_rpe"
            : mode === "constraint_only"
              ? "constraint_only_no_performance_inference"
              : "blueprint_faithful_no_performance_inference",
      },
      bridgeExceptionUsed: current.window.mode === "resolved_interruption_bridge",
    },
    inputSnapshot: {
      contractVersion: "adaptive_continuation_frozen_input_v1",
      blueprint: {
        id: current.state.blueprint.id,
        version: current.state.blueprint.version,
        sha256: current.state.blueprint.content_sha256,
      },
      confirmation: {
        id: current.state.confirmation.id,
        blockMode: current.state.confirmation.block_mode,
        intervalStartDate: current.state.confirmation.interval_start_date,
        intervalEndDate: current.state.confirmation.interval_end_date,
        candidateId: current.state.confirmation.detailed_candidate_id,
        candidateVersion: current.state.confirmation.candidate_version,
        candidateSha256: current.state.confirmation.candidate_sha256,
      },
      continuationInput: {
        id: current.state.latestInputRevision.id,
        revision: current.state.latestInputRevision.revision,
        sha256: current.state.latestInputRevision.content_sha256,
        horizonCheckIn: parsedCheckIn,
        activeProjectionPreferences: readAdaptiveProjectionPreferences(
          current.state.latestInputRevision.active_projection_preferences,
        ),
      },
      normalizedProfileConstraints: current.facts.normalizedProfileConstraints,
      calendar: omitAsOf(current.facts.calendar),
      evidence: omitAsOf(current.facts.evidence),
      targetIntervalOccupancy: current.facts.targetIntervalOccupancy,
      decision: current.decision,
      decisionSha256: input.decisionSha256,
      authoringBriefSha256: input.authoringBriefSha256,
    },
    inputProvenance: {
      kind: "adaptive_continuation_provider_authoring",
      contractVersion: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
      decisionContractVersion: "continuation_decision_input_v1",
      decisionPolicyVersion: "continuation_decision_policy_v1",
      compilerVersion: ADAPTIVE_CONTINUATION_COMPILER_VERSION,
      retainedResponseId: input.retainedResponse.id,
      retainedResponseSha256: input.retainedResponse.response_sha256,
      ...(input.technicalRecompile
        ? {
            retainedResponseOriginalCompilerOutcome: "rejected" as const,
            recompiledFromCompilerVersion: input.technicalRecompile.sourceCompilerVersion,
            recompiledDiagnosticCode: input.technicalRecompile.diagnosticCode,
          }
        : {}),
    },
    factReferences: [
      { kind: "calendar_outcomes", sha256: current.facts.calendar.calendarOutcomeFingerprint },
      { kind: "result_evidence", sha256: current.facts.evidence.evidenceRevisionFingerprint },
      {
        kind: "target_interval_occupancy",
        sha256: current.facts.targetIntervalOccupancy.calendarOccupancyFingerprint,
      },
      { kind: "profile_constraints", sha256: current.facts.normalizedProfileConstraintSha256 },
      { kind: "authoring_brief", sha256: input.authoringBriefSha256 },
    ],
    confirmationLineage: {
      kind: "continuation_detailed_block_candidate",
      state: "unconfirmed",
      predecessorCandidateId: current.state.confirmation.detailed_candidate_id,
      predecessorConfirmationId: current.state.confirmation.id,
      blockMode: current.window.mode,
      bridgeExceptionUsed: current.window.mode === "resolved_interruption_bridge",
    },
  };
}
