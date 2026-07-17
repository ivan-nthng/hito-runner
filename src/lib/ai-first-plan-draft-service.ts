import type {
  AiFirstPlanDraftMetadata,
  AiFirstPlanDraftNormalizationResult,
} from "@/lib/ai-first-plan-draft-metadata";
import {
  AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  compileAiAuthoredPlanFirstDraft,
} from "@/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
  buildAiAuthoredPlanFirstPrompt,
} from "@/lib/ai-authored-plan-first-provider-contract";
import {
  attachOutputToAiPlanGenerationLedgerTrace,
  createAiPlanGenerationLedgerTrace,
  updateAiPlanGenerationLedgerTrace,
  type AiPlanGenerationLedgerOptions,
  type AiPlanGenerationLedgerTrace,
} from "@/lib/ai-plan-generation-ledger";
import { type TrainingPlanV2 } from "@/lib/imported-plan";
import { serverEnv } from "@/lib/supabase/env";
import {
  buildStructuredFirstPlanAuthoringInput,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanAuthoringInput,
} from "@/lib/structured-first-plan-onboarding";
import { structuredPlanAuthoringInputSchema } from "@/lib/structured-plan-authoring";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_PLAN_MODEL = "gpt-5";
const DEFAULT_AI_FIRST_PLAN_TIMEOUT_MS = 0;
const DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS = 32_000;
const AI_FIRST_PLAN_CONTRACT_MODE = "plan_first" as const;
const AI_FIRST_PLAN_RESPONSE_SCHEMA_MODE = "responses_json_schema_plan_first_strict" as const;

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
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

export type AiFirstPlanDraftServiceInputKind = "structured_authoring" | "structured_onboarding";

export interface GenerateAiFirstPlanDraftPreviewOptions {
  input: unknown;
  inputKind?: AiFirstPlanDraftServiceInputKind;
  today?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  apiKey?: string | null;
  model?: string | null;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  generationLedger?: AiPlanGenerationLedgerOptions;
}

export interface AiFirstPlanDraftPreviewMetadata extends AiFirstPlanDraftMetadata {
  model: string;
  responseId: string | null;
  elapsedMs: number;
  validationIssueCount: number;
  generationTrace: AiPlanGenerationLedgerTrace | null;
  debug: AiFirstPlanDraftDebugMetadata;
}

export interface AiFirstPlanDraftDebugMetadata {
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
  abortFired: boolean;
  openAiElapsedMs: number | null;
  promptCharEstimate: number | null;
  systemPromptChars: number | null;
  userPromptChars: number | null;
  responseSchemaChars: number | null;
  responseStatus: string | null;
  responseIncompleteReason: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  outputTextChars: number | null;
  reasoningEffortSent: boolean;
}

export interface AiFirstPlanDraftUnavailableMetadata {
  sourceKind: typeof AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;
  sourceStatus: "plan_first_unavailable";
  unavailableReason: string;
  model: string;
  responseId: string | null;
  elapsedMs: number;
  validationIssues: string[];
  validationIssueCount: number;
  generationTrace: AiPlanGenerationLedgerTrace | null;
  debug: AiFirstPlanDraftDebugMetadata;
}

export type AiFirstPlanDraftPreviewResult =
  | {
      ok: true;
      authoringInput: StructuredFirstPlanAuthoringInput;
      canonicalPlan: TrainingPlanV2;
      metadata: AiFirstPlanDraftPreviewMetadata;
    }
  | {
      ok: false;
      reason: "ai_authored_plan_first_unavailable";
      message: string;
      issues: string[];
      authoringInput: StructuredFirstPlanAuthoringInput;
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
      authoringInput: StructuredFirstPlanAuthoringInput;
    }
  | {
      ok: false;
      reason: "structured_input_invalid";
      issues: string[];
    };

export async function generateAiFirstPlanDraftPreview({
  input,
  inputKind = "structured_authoring",
  today,
  timeoutMs = DEFAULT_AI_FIRST_PLAN_TIMEOUT_MS,
  maxOutputTokens = DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS,
  apiKey = serverEnv.openAiApiKey,
  model = serverEnv.openAiPlanModel ?? DEFAULT_OPENAI_PLAN_MODEL,
  fetchImpl = globalThis.fetch,
  signal,
  generationLedger,
}: GenerateAiFirstPlanDraftPreviewOptions): Promise<AiFirstPlanDraftPreviewResult> {
  const authoringInputResult = resolveStructuredAuthoringInput(input, inputKind);

  if (!authoringInputResult.ok) {
    return authoringInputResult;
  }

  const authoringInput = authoringInputResult.authoringInput;
  const startedAt = Date.now();
  let latestGenerationTrace: AiPlanGenerationLedgerTrace | null = null;

  if (!apiKey) {
    return unavailableAiFirstPlanDraft({
      authoringInput,
      reason: "openai_not_configured",
      issues: ["OpenAI is not configured for AI-authored first-plan drafting."],
      model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
      responseId: null,
      startedAt,
      debug: buildNotStartedDebug({
        timeoutMs,
        maxOutputTokens,
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
      }),
      generationTrace: null,
    });
  }

  try {
    const response = await requestOpenAiFirstPlanDraft({
      apiKey,
      model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
      authoringInput,
      today,
      timeoutMs,
      maxOutputTokens,
      fetchImpl,
      signal,
      generationLedger,
    });
    latestGenerationTrace = response.generationTrace;
    const rawOutput = extractStructuredOutputText(response.body, response.debug);
    const responseDebug = {
      ...response.debug,
      outputTextChars: rawOutput.length,
    };
    const parsedOutput = safeParseJson(rawOutput);
    latestGenerationTrace = await attachOutputToAiPlanGenerationLedgerTrace({
      trace: latestGenerationTrace,
      rawOutput,
      parsedOutput,
      options: generationLedger,
    });

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
        authoringInput,
        reason: "ai_first_plan_draft_non_json_output",
        issues: ["OpenAI returned a non-JSON AI first-plan draft payload."],
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: latestGenerationTrace?.provider.responseId ?? response.body.id ?? null,
        startedAt,
        debug: { ...responseDebug, requestPhase: "rejected_after_validation" },
        generationTrace: latestGenerationTrace,
      });
    }

    const normalized = normalizeOpenAiFirstPlanContractOutput({
      parsedOutput,
      authoringInput,
    });

    if (!normalized.ok) {
      latestGenerationTrace = await recordAiPlanGenerationUnavailable({
        trace: latestGenerationTrace,
        reason: normalized.reason,
        issues: normalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        parseStatus: "parsed_json",
        normalizationStatus: "failed",
        options: generationLedger,
      });

      return unavailableAiFirstPlanDraft({
        authoringInput,
        reason: normalized.reason,
        issues: normalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: latestGenerationTrace?.provider.responseId ?? response.body.id ?? null,
        startedAt,
        debug: { ...responseDebug, requestPhase: "rejected_after_validation" },
        generationTrace: latestGenerationTrace,
      });
    }

    const finalized = normalized;

    latestGenerationTrace = await updateAiPlanGenerationLedgerTrace(
      latestGenerationTrace,
      {
        pipeline: {
          parseStatus: "parsed_json",
          normalizationStatus: "normalized",
          validationIssues: finalized.metadata.validationIssues,
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
      authoringInput,
      canonicalPlan: finalized.canonicalPlan,
      metadata: {
        ...finalized.metadata,
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: response.body.id ?? null,
        elapsedMs: Date.now() - startedAt,
        validationIssueCount: finalized.metadata.validationIssues.length,
        generationTrace: latestGenerationTrace,
        debug: { ...responseDebug, requestPhase: "normalized" },
      },
    };
  } catch (error) {
    const unavailableReason = classifyAiFirstPlanDraftError(error);
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
      issues: [boundedErrorMessage(error, unavailableReason)],
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
      authoringInput,
      reason: unavailableReason,
      issues: [boundedErrorMessage(error, unavailableReason)],
      model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
      responseId: latestGenerationTrace?.provider.responseId ?? null,
      startedAt,
      debug:
        error instanceof AiFirstPlanDraftServiceError
          ? error.debug
          : buildNotStartedDebug({
              timeoutMs,
              maxOutputTokens,
              model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
            }),
      generationTrace: latestGenerationTrace,
    });
  }
}

function resolveStructuredAuthoringInput(
  input: unknown,
  inputKind: AiFirstPlanDraftServiceInputKind,
): StructuredAuthoringInputResolution {
  try {
    if (inputKind === "structured_onboarding") {
      const onboardingInput = parseStructuredFirstPlanOnboardingInput(input);

      return {
        ok: true,
        authoringInput: buildStructuredFirstPlanAuthoringInput(onboardingInput),
      };
    }

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
  authoringInput: StructuredFirstPlanAuthoringInput;
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
    metadata: {
      status: "ai_authored",
      source: "openai_ai_authored_full_plan_draft",
      validationIssues: compiled.validationIssues,
      reviewAssumptions: compiled.reviewAssumptions,
      metricPolicySummary:
        "Backend parsed and atomized the AI-authored full plan draft into Hito training-plan-v2 without authoring or substituting the coach plan.",
    },
  };
}

async function requestOpenAiFirstPlanDraft({
  apiKey,
  model,
  authoringInput,
  today,
  timeoutMs,
  maxOutputTokens,
  fetchImpl,
  signal,
  generationLedger,
}: {
  apiKey: string;
  model: string;
  authoringInput: StructuredFirstPlanAuthoringInput;
  today: string | undefined;
  timeoutMs: number;
  maxOutputTokens: number;
  fetchImpl: typeof fetch;
  signal?: AbortSignal;
  generationLedger?: AiPlanGenerationLedgerOptions;
}) {
  const prompt = buildOpenAiFirstPlanContractPrompt({
    authoringInput,
    today,
  });
  const controller = new AbortController();
  const requestStartedAt = Date.now();
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
    abortFired: false,
    openAiElapsedMs: null,
  });
  let generationTrace = await createAiPlanGenerationLedgerTrace({
    providerKind: resolveAiPlanGenerationProviderKind({ apiKey, model }),
    model,
    contractMode: AI_FIRST_PLAN_CONTRACT_MODE,
    responseSchemaMode: AI_FIRST_PLAN_RESPONSE_SCHEMA_MODE,
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
    responseSchema: prompt.responseSchema,
    timeoutMs,
    maxOutputTokens,
  });
  generationTrace =
    (await updateAiPlanGenerationLedgerTrace(generationTrace, {}, generationLedger)) ??
    generationTrace;
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
            abortFired: true,
            openAiElapsedMs: Date.now() - requestStartedAt,
          },
          generationTrace,
        );
      }

      const response = await fetchImpl(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          ...(supportsReasoningEffort(model) ? { reasoning: { effort: "minimal" } } : {}),
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
            format: {
              type: "json_schema",
              name: AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
              strict: true,
              schema: prompt.responseSchema,
            },
          },
        }),
        signal: controller.signal,
      });
      const body = (await response.json()) as OpenAiResponseBody;
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
              totalTokens: normalizeTokenCount(body.usage?.total_tokens),
            },
            pipeline: {
              finalOutcome: "response_received",
            },
          },
          generationLedger,
        )) ?? generationTrace;

      if (!response.ok) {
        generationTrace =
          (await updateAiPlanGenerationLedgerTrace(
            generationTrace,
            {
              pipeline: {
                ...generationTrace.pipeline,
                finalOutcome: "provider_error",
                unavailableReason: "ai_authored_plan_first_request_failed",
                validationIssues: [extractOpenAiError(body)],
              },
            },
            generationLedger,
          )) ?? generationTrace;

        throw new AiFirstPlanDraftServiceError(
          "ai_authored_plan_first_request_failed",
          [extractOpenAiError(body)],
          { ...responseDebug, requestPhase: "request_failed" },
          generationTrace,
        );
      }

      const providerStatus = normalizeProviderResponseStatus(body.status);
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
                ? extractOpenAiError(body)
                : `OpenAI first-plan generation did not complete (status: ${providerStatus ?? "missing"}).`,
        ];
        generationTrace =
          (await updateAiPlanGenerationLedgerTrace(
            generationTrace,
            {
              pipeline: {
                ...generationTrace.pipeline,
                finalOutcome: cancelled ? "cancelled" : failed ? "provider_error" : "unavailable",
                unavailableReason: reason,
                validationIssues: issues,
              },
            },
            generationLedger,
          )) ?? generationTrace;

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

      return { body, debug: responseDebug, generationTrace };
    } catch (error) {
      if (error instanceof AiFirstPlanDraftServiceError) {
        throw error;
      }

      const cancelled = abortReason === "cancelled";
      throw new AiFirstPlanDraftServiceError(
        cancelled ? "ai_authored_plan_first_cancelled" : classifyAiFirstPlanDraftError(error),
        [boundedErrorMessage(error, "AI first-plan request failed.")],
        {
          ...baseDebug,
          requestPhase: cancelled
            ? "request_cancelled"
            : abortReason === "timeout"
              ? "timeout_before_response"
              : "request_failed",
          abortFired,
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
          abortFired: true,
          openAiElapsedMs: Date.now() - requestStartedAt,
        },
        generationTrace,
      );
    });
  } finally {
    signal?.removeEventListener("abort", cancelRequest);
  }
}

function buildOpenAiFirstPlanContractPrompt({
  authoringInput,
  today,
}: {
  authoringInput: StructuredFirstPlanAuthoringInput;
  today: string | undefined;
}) {
  return buildAiAuthoredPlanFirstPrompt({
    authoringInput,
    today,
  });
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
    abortFired: false,
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
  abortFired,
  openAiElapsedMs,
}: {
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  systemPromptChars: number | null;
  userPromptChars: number | null;
  responseSchemaChars: number | null;
  requestPhase: AiFirstPlanDraftDebugMetadata["requestPhase"];
  abortFired: boolean;
  openAiElapsedMs: number | null;
}): AiFirstPlanDraftDebugMetadata {
  return {
    timeoutMs,
    maxOutputTokens,
    contractMode: AI_FIRST_PLAN_CONTRACT_MODE,
    responseSchemaMode: AI_FIRST_PLAN_RESPONSE_SCHEMA_MODE,
    requestPhase,
    abortFired,
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

function resolveAiPlanGenerationProviderKind({ apiKey, model }: { apiKey: string; model: string }) {
  return apiKey === "local-qa-dev-ai-generated-plan-fixture" ||
    model === "hito-local-qa-dev-ai-generated-plan-fixture"
    ? "local_dev_fixture"
    : "openai_responses_api";
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
  return updateAiPlanGenerationLedgerTrace(
    trace,
    {
      pipeline: {
        parseStatus,
        normalizationStatus,
        validationIssues: issues,
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

function unavailableAiFirstPlanDraft({
  authoringInput,
  reason,
  issues,
  model,
  responseId,
  startedAt,
  debug,
  generationTrace,
}: {
  authoringInput: StructuredFirstPlanAuthoringInput;
  reason: string;
  issues: string[];
  model: string;
  responseId: string | null;
  startedAt: number;
  debug: AiFirstPlanDraftDebugMetadata;
  generationTrace?: AiPlanGenerationLedgerTrace | null;
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
    authoringInput,
    metadata: {
      sourceKind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
      sourceStatus: "plan_first_unavailable",
      unavailableReason: reason,
      model,
      responseId,
      elapsedMs,
      validationIssues,
      validationIssueCount: validationIssues.length,
      generationTrace: generationTrace ?? null,
      debug,
    },
  };
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
    return response.output_text.trim();
  }

  for (const outputItem of response.output ?? []) {
    for (const part of outputItem.content ?? []) {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  throw new AiFirstPlanDraftServiceError(
    "ai_first_plan_draft_empty_output",
    ["OpenAI did not return structured AI first-plan draft text."],
    { ...debug, requestPhase: "request_failed" },
  );
}

function extractOpenAiError(response: OpenAiResponseBody) {
  if (typeof response.error?.message === "string" && response.error.message.trim()) {
    return response.error.message.trim();
  }

  return "Unknown OpenAI error.";
}

function safeParseJson(raw: string) {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function classifyAiFirstPlanDraftError(error: unknown) {
  if (error instanceof AiFirstPlanDraftServiceError) {
    return error.reason;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "ai_authored_plan_first_cancelled";
  }

  return "ai_authored_plan_first_unavailable";
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
