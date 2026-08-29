import type {
  AiFirstPlanDraftMetadata,
  AiFirstPlanDraftNormalizationResult,
} from "@/lib/ai-first-plan-draft-metadata";
import {
  retainAdaptiveTrainingSourceCandidateForUser,
  type RetainedAdaptiveTrainingSourceCandidate,
} from "@/lib/adaptive-blueprint-persistence";
import {
  AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
  AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  compileAiAuthoredPlanFirstDraft,
  type AiAuthoredBlueprintReviewConflict,
  type AiAuthoredBlueprintSummary,
} from "@/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION,
  AI_AUTHORED_PLAN_FIRST_PROVIDER_CONTRACT_VERSION,
  AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
  buildAiAuthoredPlanFirstPrompt,
  type AiAuthoredPlanFirstSelfAudit,
} from "@/lib/ai-authored-plan-first-provider-contract";
import {
  attachOutputToAiPlanGenerationLedgerTrace,
  createAiPlanGenerationLedgerTrace,
  updateAiPlanGenerationLedgerTrace,
  type AiPlanGenerationLedgerOptions,
  type AiPlanGenerationLedgerTrace,
} from "@/lib/ai-plan-generation-ledger";
import {
  buildAiFirstPlanImmutableRecompileProvenance,
  getReusableAiPlanGenerationResponseForUser,
  recordAiPlanGenerationAttemptResultForUser,
  recordAiPlanGenerationResponseOutcomeForUser,
  retainCompletedAiPlanGenerationResponseForUser,
  type AiPlanGenerationAttemptVersionContext,
  type AiPlanGenerationResponseRow,
  type AiPlanGenerationValidationOutcome,
} from "@/lib/ai-plan-generation-response-persistence";
import { type TrainingPlanV2 } from "@/lib/imported-plan";
import {
  recordLocalProviderTranscript,
  type LocalProviderTranscriptOutcome,
} from "@/lib/local-runtime-observability";
import { serverEnv } from "@/lib/supabase/env";
import {
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "@/lib/structured-plan-authoring-schema";
import { createServerOnlyFn } from "@tanstack/react-start";
import type { Dispatcher } from "undici";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_PLAN_MODEL = "gpt-5.2";
export const DEFAULT_AI_FIRST_PLAN_TIMEOUT_MS = 0;
// A first-plan response contains a complete Blueprint plus four executable weeks. GPT-5.2 counts
// both visible JSON and reasoning against max_output_tokens, so the former 32k ceiling could end an
// otherwise valid Structured Output before the provider completed it.
export const DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS = 128_000;
const AI_FIRST_PLAN_REASONING_EFFORT = "low" as const;
const AI_FIRST_PLAN_CONTRACT_MODE = "adaptive_blueprint_four_week" as const;
const AI_FIRST_PLAN_RESPONSE_SCHEMA_MODE =
  "responses_json_schema_adaptive_blueprint_four_week_v1_strict" as const;
const OPENAI_PROVIDER_HEADERS_TIMEOUT_MS = 0;
const OPENAI_PROVIDER_BODY_TIMEOUT_MS = 0;
let openAiProviderDispatcherPromise: Promise<Dispatcher> | null = null;

type OpenAiResponseBody = {
  id?: string;
  status?: string;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  incomplete_details?: {
    reason?: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    output_tokens_details?: {
      reasoning_tokens?: number;
    };
    total_tokens?: number;
  };
};

export interface GenerateAiFirstPlanDraftPreviewOptions {
  input: unknown;
  today?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  apiKey?: string | null;
  model?: string | null;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  generationLedger?: AiPlanGenerationLedgerOptions;
  candidateOwnerUserId?: string | null;
}

export interface AiPlanStructuredResponseRequest {
  apiKey: string;
  model: string;
  prompt: {
    systemPrompt: string;
    userPrompt: string;
    responseSchema: unknown;
  };
  responseSchemaName: string;
  contractMode: string;
  responseSchemaMode: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  generationLedger?: AiPlanGenerationLedgerOptions;
  transcriptRedactedValues?: readonly string[];
}

export type AiPlanStructuredResponseProviderSettings = {
  contractMode: string;
  responseSchemaMode: string;
  responseSchemaName: string;
  timeoutMs: number;
  maxOutputTokens: number;
  reasoningEffort: typeof AI_FIRST_PLAN_REASONING_EFFORT | null;
  textVerbosity: "low";
};

export function resolveAiPlanStructuredResponseProviderSettings(input: {
  model: string;
  contractMode: string;
  responseSchemaMode: string;
  responseSchemaName: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
}): AiPlanStructuredResponseProviderSettings {
  return {
    contractMode: input.contractMode,
    responseSchemaMode: input.responseSchemaMode,
    responseSchemaName: input.responseSchemaName,
    timeoutMs: input.timeoutMs ?? DEFAULT_AI_FIRST_PLAN_TIMEOUT_MS,
    maxOutputTokens: input.maxOutputTokens ?? DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS,
    reasoningEffort: supportsReasoningEffort(input.model) ? AI_FIRST_PLAN_REASONING_EFFORT : null,
    textVerbosity: "low",
  };
}

export type AiPlanStructuredResponseResult = {
  rawOutput: string;
  parsedOutput: unknown;
  providerResponseId: string | null;
  generationTrace: AiPlanGenerationLedgerTrace | null;
};

export interface AiFirstPlanDraftPreviewMetadata extends AiFirstPlanDraftMetadata {
  model: string;
  responseId: string | null;
  elapsedMs: number;
  validationIssueCount: number;
  generationTrace: AiPlanGenerationLedgerTrace | null;
  debug: AiFirstPlanDraftDebugMetadata;
}

interface AiFirstPlanDraftDebugMetadata {
  timeoutMs: number;
  maxOutputTokens: number;
  contractMode: typeof AI_FIRST_PLAN_CONTRACT_MODE;
  responseSchemaMode: typeof AI_FIRST_PLAN_RESPONSE_SCHEMA_MODE;
  requestPhase:
    | "not_started"
    | "request_started"
    | "response_parsed"
    | "normalized"
    | "rejected_after_validation"
    | "request_failed"
    | "request_cancelled"
    | "response_incomplete"
    | "timeout_before_response";
  abortReason: "cancelled" | "timeout" | null;
  abortFired: boolean;
  transportMode: "not_started" | "canonical_no_deadline" | "injected";
  transportHeadersTimeoutMs: number | null;
  transportBodyTimeoutMs: number | null;
  transportFailureCode:
    | "request_signal_aborted"
    | "backend_timeout"
    | "provider_headers_timeout"
    | "provider_body_timeout"
    | "provider_connect_timeout"
    | "provider_connection_reset"
    | "provider_dns_failure"
    | "provider_transport_error"
    | null;
  openAiElapsedMs: number | null;
  promptCharEstimate: number | null;
  systemPromptChars: number | null;
  userPromptChars: number | null;
  responseSchemaChars: number | null;
  responseStatus: string | null;
  responseIncompleteReason: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
  outputTextChars: number | null;
  reasoningEffortSent: boolean;
}

interface AiFirstPlanDraftUnavailableMetadata {
  sourceKind: typeof AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;
  sourceStatus: "plan_first_unavailable";
  unavailableReason: string;
  model: string;
  responseId: string | null;
  elapsedMs: number;
  validationIssues: string[];
  validationIssueCount: number;
  compilerDiagnostic: {
    code: string;
    path: string;
  } | null;
  generationTrace: AiPlanGenerationLedgerTrace | null;
  debug: AiFirstPlanDraftDebugMetadata;
}

type AiFirstPlanDraftPreviewResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      blueprint: AiAuthoredBlueprintSummary;
      selfAudit: AiAuthoredPlanFirstSelfAudit | null;
      reviewConflicts: AiAuthoredBlueprintReviewConflict[];
      retainedSourceCandidate: RetainedAdaptiveTrainingSourceCandidate | null;
      metadata: AiFirstPlanDraftPreviewMetadata;
    }
  | {
      ok: false;
      reason: "ai_authored_plan_first_unavailable";
      message: string;
      issues: string[];
      metadata: AiFirstPlanDraftUnavailableMetadata;
    }
  | {
      ok: false;
      reason: "structured_input_invalid";
      issues: string[];
    };

type StructuredAuthoringInputResolution =
  | {
      ok: true;
      authoringInput: StructuredPlanAuthoringInput;
    }
  | {
      ok: false;
      reason: "structured_input_invalid";
      issues: string[];
    };

export async function generateAiFirstPlanDraftPreview({
  input,
  today,
  timeoutMs = DEFAULT_AI_FIRST_PLAN_TIMEOUT_MS,
  maxOutputTokens = DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS,
  apiKey = serverEnv.openAiApiKey,
  model = serverEnv.openAiPlanModel ?? DEFAULT_OPENAI_PLAN_MODEL,
  fetchImpl = globalThis.fetch,
  signal,
  generationLedger,
  candidateOwnerUserId = null,
}: GenerateAiFirstPlanDraftPreviewOptions): Promise<AiFirstPlanDraftPreviewResult> {
  const authoringInputResult = resolveStructuredAuthoringInput(input);

  if (!authoringInputResult.ok) {
    return authoringInputResult;
  }

  const authoringInput = authoringInputResult.authoringInput;
  const startedAt = Date.now();
  const resolvedModel = model ?? DEFAULT_OPENAI_PLAN_MODEL;
  const providerKind = resolveAiPlanGenerationProviderKind({ apiKey, model: resolvedModel });
  const prompt = buildAiAuthoredPlanFirstPrompt({ authoringInput, today });
  const versionContext: AiPlanGenerationAttemptVersionContext = {
    schemaVersion: AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
    promptVersion: AI_AUTHORED_PLAN_FIRST_PROVIDER_CONTRACT_VERSION,
    policyVersion: AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION,
    compilerVersion: AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
    providerSettings: resolveAiPlanStructuredResponseProviderSettings({
      model: resolvedModel,
      contractMode: AI_FIRST_PLAN_CONTRACT_MODE,
      responseSchemaMode: AI_FIRST_PLAN_RESPONSE_SCHEMA_MODE,
      responseSchemaName: AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
      timeoutMs,
      maxOutputTokens,
    }),
  };
  let latestGenerationTrace: AiPlanGenerationLedgerTrace | null =
    await createAiPlanGenerationLedgerTrace({
      providerKind,
      model: resolvedModel,
      contractMode: AI_FIRST_PLAN_CONTRACT_MODE,
      responseSchemaMode: AI_FIRST_PLAN_RESPONSE_SCHEMA_MODE,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      responseSchema: prompt.responseSchema,
      timeoutMs,
      maxOutputTokens,
    });

  if (
    providerKind === "openai_responses_api" &&
    fetchImpl === globalThis.fetch &&
    !candidateOwnerUserId
  ) {
    const reason = "ai_plan_generation_response_owner_required";
    latestGenerationTrace = await recordAiPlanGenerationUnavailable({
      trace: latestGenerationTrace,
      reason,
      issues: [reason],
      parseStatus: "not_started",
      normalizationStatus: "not_started",
      options: generationLedger,
    });
    return unavailableAiFirstPlanDraft({
      reason,
      issues: ["AI plan generation requires private response-retention ownership."],
      model: resolvedModel,
      responseId: null,
      startedAt,
      debug: buildNotStartedDebug({ timeoutMs, maxOutputTokens, model: resolvedModel }),
      generationTrace: latestGenerationTrace,
    });
  }

  let reusableResponse: AiPlanGenerationResponseRow | null = null;
  if (candidateOwnerUserId) {
    try {
      reusableResponse = await getReusableAiPlanGenerationResponseForUser({
        userId: candidateOwnerUserId,
        requestContext: authoringInput,
        versionContext,
        providerModel: resolvedModel,
        prompt,
      });
    } catch {
      const reason = "ai_plan_generation_response_reuse_lookup_failed";
      latestGenerationTrace = await recordAiPlanGenerationUnavailable({
        trace: latestGenerationTrace,
        reason,
        issues: [reason],
        parseStatus: "not_started",
        normalizationStatus: "not_started",
        options: generationLedger,
      });
      return unavailableAiFirstPlanDraft({
        reason,
        issues: ["Private exact-request response lookup failed before provider dispatch."],
        model: resolvedModel,
        responseId: null,
        startedAt,
        debug: buildNotStartedDebug({ timeoutMs, maxOutputTokens, model: resolvedModel }),
        generationTrace: latestGenerationTrace,
      });
    }
  }

  if (!apiKey && !reusableResponse) {
    latestGenerationTrace = await recordAiPlanGenerationUnavailable({
      trace: latestGenerationTrace,
      reason: "openai_not_configured",
      issues: ["openai_not_configured"],
      parseStatus: "not_started",
      normalizationStatus: "not_started",
      options: generationLedger,
    });
    return unavailableAiFirstPlanDraft({
      reason: "openai_not_configured",
      issues: ["OpenAI is not configured for AI-authored first-plan drafting."],
      model: resolvedModel,
      responseId: null,
      startedAt,
      debug: buildNotStartedDebug({
        timeoutMs,
        maxOutputTokens,
        model: resolvedModel,
      }),
      generationTrace: latestGenerationTrace,
    });
  }

  try {
    const response = reusableResponse
      ? null
      : await requestOpenAiFirstPlanDraft({
          apiKey: apiKey!,
          model: resolvedModel,
          timeoutMs,
          maxOutputTokens,
          fetchImpl,
          signal,
          generationLedger,
          prompt,
          transcriptRedactedValues: authoringInput.requestContext?.runnerComment
            ? [authoringInput.requestContext.runnerComment]
            : [],
          generationTrace: latestGenerationTrace,
        });
    latestGenerationTrace = response?.generationTrace ?? null;
    const rawOutput = reusableResponse
      ? reusableResponse.response_body
      : extractStructuredOutputText(response!.body, response!.debug);
    const responseId =
      reusableResponse?.provider_response_id ??
      latestGenerationTrace?.provider.responseId ??
      response?.body.id ??
      null;
    const responseDebug = reusableResponse
      ? {
          ...buildRequestDebug({
            model: resolvedModel,
            timeoutMs,
            maxOutputTokens,
            systemPromptChars: prompt.systemPrompt.length,
            userPromptChars: prompt.userPrompt.length,
            responseSchemaChars: JSON.stringify(prompt.responseSchema).length,
            requestPhase: "response_parsed",
            abortReason: null,
            abortFired: false,
            transportMode: "not_started",
            openAiElapsedMs: 0,
          }),
          outputTextChars: rawOutput.length,
        }
      : {
          ...response!.debug,
          outputTextChars: rawOutput.length,
        };
    const parsedOutput = safeParseJson(rawOutput);
    if (!reusableResponse) {
      latestGenerationTrace = await attachOutputToAiPlanGenerationLedgerTrace({
        trace: latestGenerationTrace,
        rawOutput,
        parsedOutput,
        options: generationLedger,
      });
    }

    if (!parsedOutput) {
      latestGenerationTrace = await recordAiPlanGenerationUnavailable({
        trace: latestGenerationTrace,
        reason: "ai_first_plan_draft_non_json_output",
        issues: ["OpenAI returned a non-JSON AI first-plan draft payload."],
        parseStatus: "non_json",
        normalizationStatus: "not_started",
        options: generationLedger,
      });

      return unavailableAiFirstPlanDraft({
        reason: "ai_first_plan_draft_non_json_output",
        issues: ["OpenAI returned a non-JSON AI first-plan draft payload."],
        model: resolvedModel,
        responseId,
        startedAt,
        debug: { ...responseDebug, requestPhase: "rejected_after_validation" },
        generationTrace: latestGenerationTrace,
      });
    }

    let retainedResponse: AiPlanGenerationResponseRow | null = reusableResponse;
    if (
      !reusableResponse &&
      (providerKind === "openai_responses_api" || providerKind === "local_dev_fixture") &&
      candidateOwnerUserId
    ) {
      const generationTrace = latestGenerationTrace;
      const generationId = generationTrace?.generationId;
      if (!generationId || !generationTrace) {
        throw new AiFirstPlanDraftServiceError(
          "ai_plan_generation_response_retention_failed",
          ["The completed AI plan response has no retention identity."],
          { ...responseDebug, requestPhase: "request_failed" },
          latestGenerationTrace,
        );
      }
      try {
        retainedResponse = await retainCompletedAiPlanGenerationResponseForUser({
          userId: candidateOwnerUserId,
          generationId,
          providerResponseId: responseId,
          responseBody: rawOutput,
          requestContext: authoringInput,
          versionContext,
          generationTrace,
        });
      } catch {
        throw new AiFirstPlanDraftServiceError(
          "ai_plan_generation_response_retention_failed",
          ["The completed AI plan response could not be retained privately."],
          { ...responseDebug, requestPhase: "request_failed" },
          latestGenerationTrace,
        );
      }
    }

    const runnerComment = authoringInput.requestContext?.runnerComment;
    if (runnerComment && containsExactRunnerContext(parsedOutput, runnerComment)) {
      const reason = "ai_authored_plan_first_runner_context_echoed";
      await recordRetainedResponseOutcome({
        retainedResponse,
        userId: candidateOwnerUserId,
        schemaOutcome: "not_run",
        compilerOutcome: "rejected",
        diagnostic: { code: reason, path: "response" },
        debug: responseDebug,
        generationTrace: latestGenerationTrace,
        attemptResult: {
          outcome: "technical_rejection",
          candidateRecordId: null,
          candidateSha256: null,
          noPrescriptionReason: null,
        },
      });
      latestGenerationTrace = await recordAiPlanGenerationUnavailable({
        trace: latestGenerationTrace,
        reason,
        issues: [reason],
        parseStatus: "parsed_json",
        normalizationStatus: "failed",
        options: generationLedger,
      });

      return unavailableAiFirstPlanDraft({
        reason,
        issues: ["OpenAI repeated transient runner context in the authored plan output."],
        model: resolvedModel,
        responseId,
        startedAt,
        debug: { ...responseDebug, requestPhase: "rejected_after_validation" },
        generationTrace: latestGenerationTrace,
      });
    }

    const { requestContext: _requestContext, ...compilerAuthoringInput } = authoringInput;
    const normalized = normalizeOpenAiFirstPlanContractOutput({
      parsedOutput,
      authoringInput: compilerAuthoringInput,
    });

    if (!normalized.ok) {
      const schemaRejected = normalized.reason === "ai_authored_plan_first_provider_schema_invalid";
      await recordRetainedResponseOutcome({
        retainedResponse,
        userId: candidateOwnerUserId,
        schemaOutcome: schemaRejected ? "rejected" : "accepted",
        compilerOutcome: schemaRejected ? "not_run" : "rejected",
        diagnostic: normalized.issues[0]
          ? {
              code: normalized.issues[0].code,
              path: normalized.issues[0].path ?? "root",
            }
          : { code: normalized.reason, path: "root" },
        debug: responseDebug,
        generationTrace: latestGenerationTrace,
        attemptResult: {
          outcome: "technical_rejection",
          candidateRecordId: null,
          candidateSha256: null,
          noPrescriptionReason: null,
        },
      });
      latestGenerationTrace = await recordAiPlanGenerationUnavailable({
        trace: latestGenerationTrace,
        reason: normalized.reason,
        issues: normalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        parseStatus: "parsed_json",
        normalizationStatus: "failed",
        options: generationLedger,
      });

      return unavailableAiFirstPlanDraft({
        reason: normalized.reason,
        issues: normalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        compilerDiagnostic: normalized.issues[0]
          ? { code: normalized.issues[0].code, path: normalized.issues[0].path ?? "root" }
          : null,
        model: resolvedModel,
        responseId,
        startedAt,
        debug: { ...responseDebug, requestPhase: "rejected_after_validation" },
        generationTrace: latestGenerationTrace,
      });
    }

    const finalized = normalized;

    const immutableRecompileProvenance = reusableResponse
      ? await buildAiFirstPlanImmutableRecompileProvenance({
          response: reusableResponse,
          currentRequestContext: authoringInput,
          compilerVersion: AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
          validationIssues: finalized.metadata.validationIssues,
        })
      : null;
    if (
      reusableResponse &&
      (reusableResponse.schema_outcome !== "accepted" ||
        reusableResponse.compiler_outcome !== "accepted") &&
      !immutableRecompileProvenance
    ) {
      throw new AiFirstPlanDraftServiceError(
        "ai_plan_generation_response_recompile_not_admitted",
        ["The retained response is not eligible for immutable first-plan recompilation."],
        { ...responseDebug, requestPhase: "rejected_after_validation" },
        latestGenerationTrace,
      );
    }

    const acceptedRetainedResponse = immutableRecompileProvenance
      ? reusableResponse
      : await recordRetainedResponseOutcome({
          retainedResponse,
          userId: candidateOwnerUserId,
          schemaOutcome: "accepted",
          compilerOutcome: "accepted",
          diagnostic: null,
          debug: responseDebug,
          generationTrace: latestGenerationTrace,
        });

    let retainedSourceCandidate: RetainedAdaptiveTrainingSourceCandidate | null = null;
    if (acceptedRetainedResponse && candidateOwnerUserId) {
      try {
        let candidateAuthoringInput = compilerAuthoringInput;
        if (
          reusableResponse?.schema_outcome === "accepted" &&
          reusableResponse.compiler_outcome === "accepted"
        ) {
          const retainedAuthoringInput = structuredPlanAuthoringInputSchema.safeParse(
            reusableResponse.request_context,
          );
          if (!retainedAuthoringInput.success) {
            throw new Error("The accepted retained response has invalid authoring lineage.");
          }
          const { requestContext: _retainedRequestContext, ...retainedCompilerAuthoringInput } =
            retainedAuthoringInput.data;
          candidateAuthoringInput = retainedCompilerAuthoringInput;
        }
        retainedSourceCandidate = await retainAdaptiveTrainingSourceCandidateForUser({
          userId: candidateOwnerUserId,
          retainedResponse: acceptedRetainedResponse,
          blueprint: finalized.blueprint,
          canonicalPlan: finalized.canonicalPlan,
          selfAudit: finalized.selfAudit,
          reviewConflicts: finalized.reviewConflicts,
          authoringInput: candidateAuthoringInput,
          immutableRecompileProvenance: immutableRecompileProvenance ?? undefined,
        });
      } catch {
        throw new AiFirstPlanDraftServiceError(
          "ai_blueprint_candidate_persistence_failed",
          ["The accepted adaptive Blueprint candidate could not be retained privately."],
          { ...responseDebug, requestPhase: "request_failed" },
          latestGenerationTrace,
        );
      }
      if (!immutableRecompileProvenance) {
        await recordAiPlanGenerationAttemptResultForUser({
          userId: candidateOwnerUserId,
          responseRecordId: acceptedRetainedResponse.id,
          result: {
            outcome: "candidate_ready",
            candidateRecordId: retainedSourceCandidate.candidateId,
            candidateSha256: retainedSourceCandidate.candidateSha256,
            noPrescriptionReason: null,
          },
        });
      }
    }

    latestGenerationTrace = await updateAiPlanGenerationLedgerTrace(
      latestGenerationTrace,
      {
        timings: {
          compileCompletedAt: new Date().toISOString(),
        },
        pipeline: {
          parseStatus: "parsed_json",
          normalizationStatus: "normalized",
          issueCodes: diagnosticCodesFromIssues(finalized.metadata.validationIssues),
          canonicalRowCount: finalized.canonicalPlan.planned_workouts.length,
          runningWorkoutCount: finalized.canonicalPlan.planned_workouts.filter(
            (workout) => workout.workout_type !== "rest",
          ).length,
          finalOutcome: "canonical_draft_ready",
          unavailableReason: null,
        },
      },
      generationLedger,
    );

    return {
      ok: true,
      canonicalPlan: finalized.canonicalPlan,
      blueprint: finalized.blueprint,
      selfAudit: finalized.selfAudit,
      reviewConflicts: finalized.reviewConflicts,
      retainedSourceCandidate,
      metadata: {
        ...finalized.metadata,
        model: resolvedModel,
        responseId,
        elapsedMs: Date.now() - startedAt,
        validationIssueCount: finalized.metadata.validationIssues.length,
        generationTrace: latestGenerationTrace,
        debug: { ...responseDebug, requestPhase: "normalized" },
      },
    };
  } catch (error) {
    const unavailableReason =
      error instanceof AiFirstPlanDraftServiceError
        ? error.reason
        : "ai_authored_plan_first_provider_transport_failed";
    const errorGenerationTrace = generationTraceFromError(error) ?? latestGenerationTrace;
    const unavailableParseStatus =
      error instanceof AiFirstPlanDraftServiceError &&
      error.reason === "ai_first_plan_draft_empty_output"
        ? "empty_output"
        : "not_started";
    const unavailableFinalOutcome =
      unavailableReason.includes("cancelled") ||
      errorGenerationTrace?.pipeline.finalOutcome === "cancelled"
        ? "cancelled"
        : unavailableReason.includes("timed_out") ||
            errorGenerationTrace?.pipeline.finalOutcome === "timeout"
          ? "timeout"
          : errorGenerationTrace?.pipeline.finalOutcome === "provider_error"
            ? "provider_error"
            : "unavailable";
    latestGenerationTrace = await recordAiPlanGenerationUnavailable({
      trace: errorGenerationTrace,
      reason: unavailableReason,
      issues:
        error instanceof AiFirstPlanDraftServiceError && error.debug.transportFailureCode
          ? [error.debug.transportFailureCode]
          : [
              `${unavailableReason}: ${boundedErrorMessage(
                error,
                "Provider request failed safely.",
              )}`,
            ],
      parseStatus:
        errorGenerationTrace?.pipeline.parseStatus &&
        errorGenerationTrace.pipeline.parseStatus !== "not_started"
          ? errorGenerationTrace.pipeline.parseStatus
          : unavailableParseStatus,
      normalizationStatus:
        errorGenerationTrace?.pipeline.normalizationStatus &&
        errorGenerationTrace.pipeline.normalizationStatus !== "not_started"
          ? errorGenerationTrace.pipeline.normalizationStatus
          : "not_started",
      finalOutcome: unavailableFinalOutcome,
      options: generationLedger,
    });

    return unavailableAiFirstPlanDraft({
      reason: unavailableReason,
      issues: [boundedErrorMessage(error, unavailableReason)],
      model: resolvedModel,
      responseId: latestGenerationTrace?.provider.responseId ?? null,
      startedAt,
      debug:
        error instanceof AiFirstPlanDraftServiceError
          ? error.debug
          : buildNotStartedDebug({
              timeoutMs,
              maxOutputTokens,
              model: resolvedModel,
            }),
      generationTrace: latestGenerationTrace,
    });
  }
}

function resolveStructuredAuthoringInput(input: unknown): StructuredAuthoringInputResolution {
  try {
    const parsed = structuredPlanAuthoringInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        reason: "structured_input_invalid",
        issues: parsed.error.issues
          .slice(0, 12)
          .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`),
      };
    }

    return {
      ok: true,
      authoringInput: parsed.data,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      issues: [boundedErrorMessage(error, "Structured first-plan input failed validation.")],
    };
  }
}

function normalizeOpenAiFirstPlanContractOutput({
  parsedOutput,
  authoringInput,
}: {
  parsedOutput: unknown;
  authoringInput: StructuredPlanAuthoringInput;
}): AiFirstPlanDraftNormalizationResult {
  const compiled = compileAiAuthoredPlanFirstDraft({
    draft: parsedOutput,
    authoringInput,
  });

  if (!compiled.ok) {
    return {
      ok: false,
      reason: compiled.reason,
      issues: compiled.issues,
    };
  }

  return {
    ok: true,
    canonicalPlan: compiled.canonicalPlan,
    blueprint: compiled.blueprint,
    selfAudit: compiled.selfAudit,
    reviewConflicts: compiled.reviewConflicts,
    metadata: {
      status: "ai_authored",
      source: "openai_adaptive_blueprint_four_week_draft",
      validationIssues: compiled.validationIssues,
    },
  };
}

async function requestOpenAiFirstPlanDraft({
  apiKey,
  model,
  timeoutMs,
  maxOutputTokens,
  fetchImpl,
  signal,
  generationLedger,
  prompt,
  responseSchemaName = AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
  transcriptRedactedValues,
  generationTrace: initialGenerationTrace,
}: {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  fetchImpl: typeof fetch;
  signal?: AbortSignal;
  generationLedger?: AiPlanGenerationLedgerOptions;
  prompt: { systemPrompt: string; userPrompt: string; responseSchema: unknown };
  responseSchemaName?: string;
  transcriptRedactedValues: readonly string[];
  generationTrace: AiPlanGenerationLedgerTrace | null;
}) {
  const controller = new AbortController();
  const requestStartedAt = Date.now();
  const requestStartedAtIso = new Date(requestStartedAt).toISOString();
  let abortFired = false;
  let abortReason: "cancelled" | "timeout" | null = null;
  const baseDebug = buildRequestDebug({
    model,
    timeoutMs,
    maxOutputTokens,
    systemPromptChars: prompt.systemPrompt.length,
    userPromptChars: prompt.userPrompt.length,
    responseSchemaChars: JSON.stringify(prompt.responseSchema).length,
    requestPhase: "request_started",
    abortReason: null,
    abortFired: false,
    transportMode: fetchImpl === globalThis.fetch ? "canonical_no_deadline" : "injected",
    openAiElapsedMs: null,
  });
  let generationTrace = initialGenerationTrace;
  const requestBody = JSON.stringify({
    model,
    ...(supportsReasoningEffort(model)
      ? { reasoning: { effort: AI_FIRST_PLAN_REASONING_EFFORT } }
      : {}),
    max_output_tokens: maxOutputTokens,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: prompt.systemPrompt,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt.userPrompt,
          },
        ],
      },
    ],
    text: {
      verbosity: "low",
      format: {
        type: "json_schema",
        name: responseSchemaName,
        strict: true,
        schema: prompt.responseSchema,
      },
    },
  });
  let responseBodyText: string | null = null;
  let httpStatus: number | null = null;
  let responseContentType: string | null = null;
  let responseReceivedAt: string | null = null;
  let providerResponseId: string | null = null;
  let providerStatus: string | null = null;
  let providerRequestStarted = false;
  let transcriptRecorded = false;
  const recordTranscript = async (outcome: LocalProviderTranscriptOutcome) => {
    if (
      !providerRequestStarted ||
      transcriptRecorded ||
      resolveAiPlanGenerationProviderKind({ apiKey, model }) !== "openai_responses_api"
    ) {
      return;
    }
    transcriptRecorded = true;
    await recordLocalProviderTranscript(
      {
        generationId: generationTrace?.generationId ?? "generation_unavailable",
        providerResponseId,
        model,
        outcome,
        providerStatus,
        httpStatus,
        responseContentType,
        requestStartedAt: requestStartedAtIso,
        responseReceivedAt,
        requestBody,
        responseBody: responseBodyText,
        redactedValues: transcriptRedactedValues,
      },
      {
        disabled: generationLedger?.disabled,
        forceWrite: generationLedger?.forceArtifactWrite,
        root: generationLedger?.artifactRoot,
        runtimeUrl: generationLedger?.runtimeUrl,
      },
    );
  };
  const cancelRequest = () => {
    if (abortReason) {
      return;
    }

    abortReason = "cancelled";
    abortFired = true;
    controller.abort(signal?.reason);
  };

  if (signal?.aborted) {
    cancelRequest();
  } else {
    signal?.addEventListener("abort", cancelRequest, { once: true });
  }

  const request = async () => {
    try {
      if (abortReason === "cancelled") {
        throw new AiFirstPlanDraftServiceError(
          "ai_authored_plan_first_cancelled",
          ["AI first-plan generation was cancelled before the provider request completed."],
          {
            ...baseDebug,
            requestPhase: "request_cancelled",
            abortReason: "cancelled",
            abortFired: true,
            openAiElapsedMs: Date.now() - requestStartedAt,
          },
          generationTrace,
        );
      }

      generationTrace =
        (await updateAiPlanGenerationLedgerTrace(
          generationTrace,
          { timings: { requestStartedAt: requestStartedAtIso } },
          generationLedger,
        )) ?? generationTrace;
      providerRequestStarted = true;
      const requestInit: RequestInit & { dispatcher?: Dispatcher } = {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: requestBody,
        signal: controller.signal,
      };
      if (fetchImpl === globalThis.fetch) {
        requestInit.dispatcher = await getOpenAiProviderDispatcher();
      }
      const response = await fetchImpl(OPENAI_RESPONSES_URL, requestInit);
      httpStatus = response.status;
      responseContentType = response.headers.get("content-type");
      responseReceivedAt = new Date().toISOString();
      try {
        responseBodyText = await response.text();
      } catch {
        await recordTranscript("response_read_failed");
        throw new AiFirstPlanDraftServiceError(
          "ai_authored_plan_first_provider_response_read_failed",
          ["OpenAI response body could not be read."],
          { ...baseDebug, requestPhase: "request_failed" },
          generationTrace,
        );
      }
      const parsedResponse = safeParseJson(responseBodyText);
      if (!parsedResponse || typeof parsedResponse !== "object" || Array.isArray(parsedResponse)) {
        await recordTranscript("malformed_response");
        throw new AiFirstPlanDraftServiceError(
          "ai_authored_plan_first_provider_response_malformed",
          ["OpenAI returned a malformed response envelope."],
          { ...baseDebug, requestPhase: "request_failed" },
          generationTrace,
        );
      }
      const body = parsedResponse as OpenAiResponseBody;
      providerStatus = normalizeProviderResponseStatus(body.status);
      providerResponseId = typeof body.id === "string" ? body.id : null;
      const responseDebug: AiFirstPlanDraftDebugMetadata = {
        ...baseDebug,
        requestPhase: "response_parsed",
        abortFired,
        openAiElapsedMs: Date.now() - requestStartedAt,
        responseStatus: typeof body.status === "string" ? body.status : null,
        responseIncompleteReason:
          typeof body.incomplete_details?.reason === "string"
            ? body.incomplete_details.reason
            : null,
        inputTokens: normalizeTokenCount(body.usage?.input_tokens),
        outputTokens: normalizeTokenCount(body.usage?.output_tokens),
        reasoningTokens: normalizeTokenCount(body.usage?.output_tokens_details?.reasoning_tokens),
        totalTokens: normalizeTokenCount(body.usage?.total_tokens),
      };
      generationTrace =
        (await updateAiPlanGenerationLedgerTrace(
          generationTrace,
          {
            provider: {
              responseId: body.id ?? null,
              responseStatus: typeof body.status === "string" ? body.status : null,
              responseIncompleteReason:
                typeof body.incomplete_details?.reason === "string"
                  ? body.incomplete_details.reason
                  : null,
            },
            usage: {
              inputTokens: normalizeTokenCount(body.usage?.input_tokens),
              outputTokens: normalizeTokenCount(body.usage?.output_tokens),
              reasoningTokens: normalizeTokenCount(
                body.usage?.output_tokens_details?.reasoning_tokens,
              ),
              totalTokens: normalizeTokenCount(body.usage?.total_tokens),
            },
            timings: {
              responseReceivedAt,
            },
            pipeline: {
              finalOutcome: "response_received",
            },
          },
          generationLedger,
        )) ?? generationTrace;

      if (!response.ok) {
        await recordTranscript("http_error");
        generationTrace =
          (await updateAiPlanGenerationLedgerTrace(
            generationTrace,
            {
              pipeline: {
                finalOutcome: "provider_error",
                unavailableReason: "ai_authored_plan_first_request_failed",
                issueCodes: ["ai_authored_plan_first_request_failed"],
              },
            },
            generationLedger,
          )) ?? generationTrace;

        throw new AiFirstPlanDraftServiceError(
          "ai_authored_plan_first_request_failed",
          ["OpenAI rejected the first-plan request."],
          { ...responseDebug, requestPhase: "request_failed" },
          generationTrace,
        );
      }

      if (providerStatus !== "completed") {
        const incomplete = providerStatus === "incomplete";
        const cancelled = providerStatus === "cancelled";
        const failed = providerStatus === "failed";
        const reason = cancelled
          ? "ai_authored_plan_first_cancelled"
          : incomplete
            ? "ai_authored_plan_first_incomplete_output"
            : failed
              ? "ai_authored_plan_first_request_failed"
              : "ai_authored_plan_first_provider_not_completed";
        const issues = [
          incomplete
            ? `OpenAI returned incomplete first-plan output${body.incomplete_details?.reason ? `: ${body.incomplete_details.reason}` : "."}`
            : cancelled
              ? "OpenAI cancelled first-plan generation before completion."
              : failed
                ? "OpenAI failed first-plan generation."
                : `OpenAI first-plan generation did not complete (status: ${providerStatus ?? "missing"}).`,
        ];
        await recordTranscript(
          cancelled
            ? "cancelled"
            : incomplete
              ? "incomplete"
              : failed
                ? "failed"
                : "provider_not_completed",
        );
        generationTrace =
          (await updateAiPlanGenerationLedgerTrace(
            generationTrace,
            {
              pipeline: {
                finalOutcome: cancelled ? "cancelled" : failed ? "provider_error" : "unavailable",
                unavailableReason: reason,
                issueCodes: [reason],
              },
            },
            generationLedger,
          )) ?? generationTrace;

        console.error(
          "[generated-plan/provider] response_not_completed",
          JSON.stringify({
            generationId: generationTrace?.generationId ?? null,
            model,
            responseId: providerResponseId,
            responseStatus: responseDebug.responseStatus,
            responseIncompleteReason: responseDebug.responseIncompleteReason,
            maxOutputTokens,
            inputTokens: responseDebug.inputTokens,
            outputTokens: responseDebug.outputTokens,
            reasoningTokens: responseDebug.reasoningTokens,
            totalTokens: responseDebug.totalTokens,
            openAiElapsedMs: responseDebug.openAiElapsedMs,
            unavailableReason: reason,
          }),
        );

        throw new AiFirstPlanDraftServiceError(
          reason,
          issues,
          {
            ...responseDebug,
            requestPhase: cancelled
              ? "request_cancelled"
              : incomplete
                ? "response_incomplete"
                : "request_failed",
          },
          generationTrace,
        );
      }

      await recordTranscript("completed");
      return { body, debug: responseDebug, generationTrace };
    } catch (error) {
      if (error instanceof AiFirstPlanDraftServiceError) {
        throw error;
      }

      const cancelled = abortReason === "cancelled";
      const transportFailureCode = cancelled
        ? "request_signal_aborted"
        : abortReason === "timeout"
          ? "backend_timeout"
          : classifyProviderTransportFailure(error);
      throw new AiFirstPlanDraftServiceError(
        cancelled
          ? "ai_authored_plan_first_cancelled"
          : abortReason === "timeout"
            ? "ai_authored_plan_first_timed_out"
            : "ai_authored_plan_first_provider_transport_failed",
        [transportFailureCode],
        {
          ...baseDebug,
          requestPhase: cancelled
            ? "request_cancelled"
            : abortReason === "timeout"
              ? "timeout_before_response"
              : "request_failed",
          abortReason,
          abortFired,
          transportFailureCode,
          openAiElapsedMs: Date.now() - requestStartedAt,
        },
        generationTrace,
      );
    }
  };

  try {
    return await withTimeout(request(), timeoutMs, () => {
      abortReason = "timeout";
      abortFired = true;
      controller.abort();

      return new AiFirstPlanDraftServiceError(
        "ai_authored_plan_first_timed_out",
        [`AI first-plan request timed out after ${timeoutMs} ms.`],
        {
          ...baseDebug,
          requestPhase: "timeout_before_response",
          abortReason: "timeout",
          abortFired: true,
          openAiElapsedMs: Date.now() - requestStartedAt,
        },
        generationTrace,
      );
    });
  } catch (error) {
    await recordTranscript(
      abortReason === "timeout"
        ? "timeout"
        : abortReason === "cancelled"
          ? "cancelled"
          : "transport_error",
    );
    throw error;
  } finally {
    signal?.removeEventListener("abort", cancelRequest);
  }
}

/**
 * One server-owned Responses API transport for plan authoring contracts. Callers must retain a
 * completed output before compiling it into an owner-visible candidate.
 */
export async function requestAiPlanStructuredResponse(
  input: AiPlanStructuredResponseRequest,
): Promise<AiPlanStructuredResponseResult> {
  const providerSettings = resolveAiPlanStructuredResponseProviderSettings(input);
  const timeoutMs = providerSettings.timeoutMs;
  const maxOutputTokens = providerSettings.maxOutputTokens;
  const fetchImpl = input.fetchImpl ?? globalThis.fetch;
  const generationTrace = await createAiPlanGenerationLedgerTrace({
    providerKind: resolveAiPlanGenerationProviderKind({ apiKey: input.apiKey, model: input.model }),
    model: input.model,
    contractMode: input.contractMode,
    responseSchemaMode: input.responseSchemaMode,
    systemPrompt: input.prompt.systemPrompt,
    userPrompt: input.prompt.userPrompt,
    responseSchema: input.prompt.responseSchema,
    timeoutMs,
    maxOutputTokens,
  });
  const response = await requestOpenAiFirstPlanDraft({
    apiKey: input.apiKey,
    model: input.model,
    timeoutMs,
    maxOutputTokens,
    fetchImpl,
    signal: input.signal,
    generationLedger: input.generationLedger,
    prompt: input.prompt,
    responseSchemaName: input.responseSchemaName,
    transcriptRedactedValues: input.transcriptRedactedValues ?? [],
    generationTrace,
  });
  const rawOutput = extractStructuredOutputText(response.body, response.debug);
  const parsedOutput = safeParseJson(rawOutput);
  const traced = await attachOutputToAiPlanGenerationLedgerTrace({
    trace: response.generationTrace,
    rawOutput,
    parsedOutput,
    options: input.generationLedger,
  });
  if (parsedOutput == null) {
    throw new Error("The completed AI plan response is not parseable JSON.");
  }
  return {
    rawOutput,
    parsedOutput,
    providerResponseId: response.body.id ?? null,
    generationTrace: traced,
  };
}

function buildNotStartedDebug({
  timeoutMs,
  maxOutputTokens,
  model,
}: {
  timeoutMs: number;
  maxOutputTokens: number;
  model: string;
}): AiFirstPlanDraftDebugMetadata {
  return buildRequestDebug({
    model,
    timeoutMs,
    maxOutputTokens,
    systemPromptChars: null,
    userPromptChars: null,
    responseSchemaChars: null,
    requestPhase: "not_started",
    abortReason: null,
    abortFired: false,
    transportMode: "not_started",
    openAiElapsedMs: null,
  });
}

function buildRequestDebug({
  model,
  timeoutMs,
  maxOutputTokens,
  systemPromptChars,
  userPromptChars,
  responseSchemaChars,
  requestPhase,
  abortReason,
  abortFired,
  transportMode,
  openAiElapsedMs,
}: {
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  systemPromptChars: number | null;
  userPromptChars: number | null;
  responseSchemaChars: number | null;
  requestPhase: AiFirstPlanDraftDebugMetadata["requestPhase"];
  abortReason: AiFirstPlanDraftDebugMetadata["abortReason"];
  abortFired: boolean;
  transportMode: AiFirstPlanDraftDebugMetadata["transportMode"];
  openAiElapsedMs: number | null;
}): AiFirstPlanDraftDebugMetadata {
  return {
    timeoutMs,
    maxOutputTokens,
    contractMode: AI_FIRST_PLAN_CONTRACT_MODE,
    responseSchemaMode: AI_FIRST_PLAN_RESPONSE_SCHEMA_MODE,
    requestPhase,
    abortReason,
    abortFired,
    transportMode,
    transportHeadersTimeoutMs:
      transportMode === "canonical_no_deadline" ? OPENAI_PROVIDER_HEADERS_TIMEOUT_MS : null,
    transportBodyTimeoutMs:
      transportMode === "canonical_no_deadline" ? OPENAI_PROVIDER_BODY_TIMEOUT_MS : null,
    transportFailureCode: null,
    openAiElapsedMs,
    promptCharEstimate:
      systemPromptChars == null || userPromptChars == null || responseSchemaChars == null
        ? null
        : systemPromptChars + userPromptChars + responseSchemaChars,
    systemPromptChars,
    userPromptChars,
    responseSchemaChars,
    responseStatus: null,
    responseIncompleteReason: null,
    inputTokens: null,
    outputTokens: null,
    reasoningTokens: null,
    totalTokens: null,
    outputTextChars: null,
    reasoningEffortSent: supportsReasoningEffort(model),
  };
}

function normalizeTokenCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : null;
}

function normalizeProviderResponseStatus(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

function supportsReasoningEffort(model: string) {
  const normalized = model.trim().toLowerCase();

  return normalized.startsWith("gpt-5") || normalized.startsWith("o");
}

function resolveAiPlanGenerationProviderKind({
  apiKey,
  model,
}: {
  apiKey: string | null;
  model: string;
}) {
  if (!apiKey) {
    return "not_started";
  }

  return apiKey === "local-qa-dev-ai-generated-plan-fixture" ||
    model === "hito-local-qa-dev-ai-generated-plan-fixture"
    ? "local_dev_fixture"
    : "openai_responses_api";
}

async function recordRetainedResponseOutcome({
  retainedResponse,
  userId,
  schemaOutcome,
  compilerOutcome,
  diagnostic,
  debug,
  generationTrace,
  attemptResult,
}: {
  retainedResponse: AiPlanGenerationResponseRow | null;
  userId: string | null;
  schemaOutcome: AiPlanGenerationValidationOutcome;
  compilerOutcome: AiPlanGenerationValidationOutcome;
  diagnostic: { code: string; path: string } | null;
  debug: AiFirstPlanDraftDebugMetadata;
  generationTrace: AiPlanGenerationLedgerTrace | null;
  attemptResult?: Parameters<typeof recordAiPlanGenerationAttemptResultForUser>[0]["result"];
}) {
  if (!retainedResponse) {
    return null;
  }
  if (!userId) {
    throw new AiFirstPlanDraftServiceError(
      "ai_plan_generation_response_outcome_persistence_failed",
      ["The retained AI plan response has no owner context."],
      { ...debug, requestPhase: "request_failed" },
      generationTrace,
    );
  }

  try {
    const recorded = await recordAiPlanGenerationResponseOutcomeForUser({
      userId,
      responseRecordId: retainedResponse.id,
      schemaOutcome,
      compilerOutcome,
      diagnostic,
    });
    if (attemptResult) {
      return recordAiPlanGenerationAttemptResultForUser({
        userId,
        responseRecordId: retainedResponse.id,
        result: attemptResult,
      });
    }
    return recorded;
  } catch {
    throw new AiFirstPlanDraftServiceError(
      "ai_plan_generation_response_outcome_persistence_failed",
      ["The AI plan response validation outcome could not be retained privately."],
      { ...debug, requestPhase: "request_failed" },
      generationTrace,
    );
  }
}

async function recordAiPlanGenerationUnavailable({
  trace,
  reason,
  issues,
  parseStatus,
  normalizationStatus,
  finalOutcome = "unavailable",
  options,
}: {
  trace: AiPlanGenerationLedgerTrace | null;
  reason: string;
  issues: string[];
  parseStatus: AiPlanGenerationLedgerTrace["pipeline"]["parseStatus"];
  normalizationStatus: AiPlanGenerationLedgerTrace["pipeline"]["normalizationStatus"];
  finalOutcome?: AiPlanGenerationLedgerTrace["pipeline"]["finalOutcome"];
  options?: AiPlanGenerationLedgerOptions;
}) {
  const issueCodes = diagnosticCodesFromIssues(issues, reason);
  if (
    trace?.pipeline.finalOutcome === finalOutcome &&
    trace.pipeline.unavailableReason === reason &&
    trace.pipeline.parseStatus === parseStatus &&
    trace.pipeline.normalizationStatus === normalizationStatus &&
    trace.pipeline.issueCodes.length === issueCodes.length &&
    trace.pipeline.issueCodes.every((code, index) => code === issueCodes[index])
  ) {
    return trace;
  }

  return updateAiPlanGenerationLedgerTrace(
    trace,
    {
      pipeline: {
        parseStatus,
        normalizationStatus,
        issueCodes,
        canonicalRowCount: null,
        runningWorkoutCount: null,
        finalOutcome,
        unavailableReason: reason,
      },
    },
    options,
  );
}

function generationTraceFromError(error: unknown) {
  return error instanceof AiFirstPlanDraftServiceError ? error.generationTrace : null;
}

function diagnosticCodesFromIssues(issues: readonly string[], fallback?: string) {
  const codes = issues
    .map((issue) => issue.split(":", 1)[0]?.trim() ?? "")
    .filter((code) => /^[a-z0-9_]+$/i.test(code))
    .slice(0, 12);

  if (codes.length > 0) {
    return Array.from(new Set(codes));
  }

  return fallback ? [fallback] : [];
}

function unavailableAiFirstPlanDraft({
  reason,
  issues,
  model,
  responseId,
  startedAt,
  debug,
  generationTrace,
  compilerDiagnostic = null,
}: {
  reason: string;
  issues: string[];
  model: string;
  responseId: string | null;
  startedAt: number;
  debug: AiFirstPlanDraftDebugMetadata;
  generationTrace?: AiPlanGenerationLedgerTrace | null;
  compilerDiagnostic?: AiFirstPlanDraftUnavailableMetadata["compilerDiagnostic"];
}): Extract<
  AiFirstPlanDraftPreviewResult,
  {
    ok: false;
    reason: "ai_authored_plan_first_unavailable";
  }
> {
  const validationIssues = issues
    .map((issue) => issue.trim())
    .filter(Boolean)
    .slice(0, 12);
  const elapsedMs = Date.now() - startedAt;

  return {
    ok: false,
    reason: "ai_authored_plan_first_unavailable",
    message: "We could not create a safe AI-authored plan draft. Please retry.",
    issues: validationIssues,
    metadata: {
      sourceKind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
      sourceStatus: "plan_first_unavailable",
      unavailableReason: reason,
      model,
      responseId,
      elapsedMs,
      validationIssues,
      validationIssueCount: validationIssues.length,
      compilerDiagnostic,
      generationTrace: generationTrace ?? null,
      debug,
    },
  };
}

function containsExactRunnerContext(value: unknown, runnerComment: string): boolean {
  if (typeof value === "string") {
    return value.includes(runnerComment);
  }
  if (Array.isArray(value)) {
    return value.some((entry) => containsExactRunnerContext(entry, runnerComment));
  }
  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => containsExactRunnerContext(entry, runnerComment));
  }

  return false;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => AiFirstPlanDraftServiceError,
) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(onTimeout());
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function extractStructuredOutputText(
  response: OpenAiResponseBody,
  debug: AiFirstPlanDraftDebugMetadata,
) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  for (const outputItem of response.output ?? []) {
    for (const part of outputItem.content ?? []) {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }

  throw new AiFirstPlanDraftServiceError(
    "ai_first_plan_draft_empty_output",
    ["OpenAI did not return structured AI first-plan draft text."],
    { ...debug, requestPhase: "request_failed" },
  );
}

function safeParseJson(raw: string) {
  if (hasPathologicalJsonNumber(raw)) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function hasPathologicalJsonNumber(raw: string) {
  let inString = false;
  let escaped = false;

  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index]!;
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character !== "-" && (character < "0" || character > "9")) {
      continue;
    }

    let tokenEnd = index + 1;
    while (tokenEnd < raw.length && /[0-9eE+.-]/.test(raw[tokenEnd]!)) {
      tokenEnd += 1;
    }
    if (tokenEnd - index > 48) {
      return true;
    }
    index = tokenEnd - 1;
  }

  return false;
}

function classifyProviderTransportFailure(
  error: unknown,
): NonNullable<AiFirstPlanDraftDebugMetadata["transportFailureCode"]> {
  switch (findTransportErrorCode(error)) {
    case "UND_ERR_HEADERS_TIMEOUT":
      return "provider_headers_timeout";
    case "UND_ERR_BODY_TIMEOUT":
      return "provider_body_timeout";
    case "UND_ERR_CONNECT_TIMEOUT":
      return "provider_connect_timeout";
    case "ECONNRESET":
    case "UND_ERR_SOCKET":
      return "provider_connection_reset";
    case "EAI_AGAIN":
    case "ENOTFOUND":
      return "provider_dns_failure";
    default:
      return "provider_transport_error";
  }
}

const getOpenAiProviderDispatcher = createServerOnlyFn(async (): Promise<Dispatcher> => {
  openAiProviderDispatcherPromise ??= import("undici").then(
    ({ Agent }) =>
      new Agent({
        headersTimeout: OPENAI_PROVIDER_HEADERS_TIMEOUT_MS,
        bodyTimeout: OPENAI_PROVIDER_BODY_TIMEOUT_MS,
      }),
  );
  return openAiProviderDispatcherPromise;
});

function findTransportErrorCode(error: unknown, depth = 0): string | null {
  if (!error || typeof error !== "object" || depth > 3) {
    return null;
  }

  const code = Reflect.get(error, "code");
  if (typeof code === "string" && /^[A-Z0-9_]+$/.test(code)) {
    return code;
  }

  return findTransportErrorCode(Reflect.get(error, "cause"), depth + 1);
}

function boundedErrorMessage(error: unknown, defaultMessage: string) {
  if (error instanceof AiFirstPlanDraftServiceError) {
    return error.issues.join(" | ").slice(0, 300) || defaultMessage;
  }

  if (error instanceof Error) {
    return error.message.trim().slice(0, 300) || defaultMessage;
  }

  return defaultMessage;
}

class AiFirstPlanDraftServiceError extends Error {
  constructor(
    readonly reason: string,
    readonly issues: string[],
    readonly debug: AiFirstPlanDraftDebugMetadata,
    readonly generationTrace: AiPlanGenerationLedgerTrace | null = null,
  ) {
    super(`${reason}: ${issues.slice(0, 3).join(" | ")}`);
  }
}
