import {
  buildAiFirstPlanDraftPrompt,
  normalizeAiFirstPlanDraftToTrainingPlan,
  type AiFirstPlanBlueprintTraceMetadata,
  type AiFirstPlanDraftMetadata,
  type AiFirstPlanDraftNormalizationResult,
} from "@/lib/ai-first-plan-draft-authoring";
import type { NormalizationIssue } from "@/lib/ai-first-plan-blueprint-schema";
import {
  buildAiFirstPlanBlueprintTrace,
  buildAiFirstPlanBlueprintPrompt,
  normalizeAiFirstPlanBlueprintToTrainingPlan,
} from "@/lib/ai-first-plan-blueprint-authoring";
import {
  attachBlueprintHorizonTrace,
  buildAiFirstPlanBlueprintHorizonTrace,
  extendAiFirstPlanBlueprintPlanToRequestedHorizon,
  resolveAiFirstPlanBlueprintHorizonStrategy,
  type AiFirstPlanBlueprintHorizonStrategy,
  type AiFirstPlanBlueprintHorizonTraceMetadata,
} from "@/lib/ai-first-plan-blueprint-horizon";
import { type TrainingPlanV2 } from "@/lib/imported-plan";
import { serverEnv } from "@/lib/supabase/env";
import {
  buildStructuredFirstPlanAuthoringInput,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanAuthoringInput,
} from "@/lib/structured-first-plan-onboarding";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "@/lib/structured-plan-authoring";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_PLAN_MODEL = "gpt-5";
const DEFAULT_AI_FIRST_PLAN_TIMEOUT_MS = 45_000;
const DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS = 32_000;
const DEFAULT_AI_FIRST_PLAN_CONTRACT = "blueprint";

type OpenAiResponseEnvelope = {
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
export type AiFirstPlanGenerationContract = "blueprint" | "strict_draft";

export interface GenerateAiFirstPlanDraftPreviewOptions {
  input: unknown;
  inputKind?: AiFirstPlanDraftServiceInputKind;
  referenceExample?: unknown;
  today?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  apiKey?: string | null;
  model?: string | null;
  contractMode?: AiFirstPlanGenerationContract;
  allowDeterministicFallback?: boolean;
  fetchImpl?: typeof fetch;
}

export interface AiFirstPlanDraftPreviewMetadata extends AiFirstPlanDraftMetadata {
  fallbackReason: string | null;
  model: string;
  responseId: string | null;
  elapsedMs: number;
  validationIssueCount: number;
  debug: AiFirstPlanDraftDebugMetadata;
}

export interface AiFirstPlanDraftDebugMetadata {
  timeoutMs: number;
  maxOutputTokens: number;
  contractMode: AiFirstPlanGenerationContract;
  responseSchemaMode:
    | "responses_json_schema_blueprint_strict"
    | "responses_json_schema_draft_strict";
  requestPhase:
    | "not_started"
    | "request_started"
    | "response_parsed"
    | "normalized"
    | "fallback_after_validation"
    | "request_failed"
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
  sourceKind: "ai_first_plan_blueprint_v1" | "ai_first_plan_draft_v1";
  sourceStatus: "blueprint_unavailable" | "draft_unavailable";
  fallbackReason: string;
  model: string;
  responseId: string | null;
  elapsedMs: number;
  validationIssues: string[];
  validationIssueCount: number;
  debug: AiFirstPlanDraftDebugMetadata;
  blueprintTrace?: AiFirstPlanBlueprintTraceMetadata | null;
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
      reason: "ai_first_plan_blueprint_unavailable" | "ai_first_plan_draft_unavailable";
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
  referenceExample,
  today,
  timeoutMs = DEFAULT_AI_FIRST_PLAN_TIMEOUT_MS,
  maxOutputTokens = DEFAULT_AI_FIRST_PLAN_MAX_OUTPUT_TOKENS,
  apiKey = serverEnv.openAiApiKey,
  model = serverEnv.openAiPlanModel ?? DEFAULT_OPENAI_PLAN_MODEL,
  contractMode = DEFAULT_AI_FIRST_PLAN_CONTRACT,
  allowDeterministicFallback,
  fetchImpl = globalThis.fetch,
}: GenerateAiFirstPlanDraftPreviewOptions): Promise<AiFirstPlanDraftPreviewResult> {
  const authoringInputResult = resolveStructuredAuthoringInput(input, inputKind);

  if (!authoringInputResult.ok) {
    return authoringInputResult;
  }

  const authoringInput = authoringInputResult.authoringInput;
  const startedAt = Date.now();
  const useDeterministicFallback =
    allowDeterministicFallback ?? contractMode !== DEFAULT_AI_FIRST_PLAN_CONTRACT;
  const blueprintHorizonStrategy =
    contractMode === "blueprint"
      ? resolveAiFirstPlanBlueprintHorizonStrategy({
          authoringInput,
          today,
          referenceExample,
        })
      : null;
  const openAiAuthoringInput = blueprintHorizonStrategy?.openAiAuthoringInput ?? authoringInput;

  if (!apiKey) {
    return fallbackOrUnavailable({
      authoringInput,
      reason: "openai_not_configured",
      issues: ["OpenAI is not configured for AI-authored first-plan drafting."],
      model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
      responseId: null,
      startedAt,
      allowDeterministicFallback: useDeterministicFallback,
      debug: buildNotStartedDebug({
        timeoutMs,
        maxOutputTokens,
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        contractMode,
      }),
      blueprintHorizonStrategy,
    });
  }

  try {
    const response = await requestOpenAiFirstPlanDraft({
      apiKey,
      model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
      authoringInput: openAiAuthoringInput,
      referenceExample,
      today,
      timeoutMs,
      maxOutputTokens,
      contractMode,
      fetchImpl,
    });
    const rawOutput = extractStructuredOutputText(response.body, response.debug);
    const responseDebug = {
      ...response.debug,
      outputTextChars: rawOutput.length,
    };
    const parsedOutput = safeParseJson(rawOutput);

    if (!parsedOutput) {
      return fallbackOrUnavailable({
        authoringInput,
        reason: "ai_first_plan_draft_non_json_output",
        issues: ["OpenAI returned a non-JSON AI first-plan draft payload."],
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: response.body.id ?? null,
        startedAt,
        allowDeterministicFallback: useDeterministicFallback,
        debug: { ...responseDebug, requestPhase: "fallback_after_validation" },
        blueprintHorizonStrategy,
      });
    }

    const normalized =
      contractMode === "blueprint"
        ? normalizeAiFirstPlanBlueprintToTrainingPlan({
            blueprint: parsedOutput,
            authoringInput: openAiAuthoringInput,
            deterministicSupportAuthoringInput:
              blueprintHorizonStrategy && blueprintHorizonStrategy.backendExtendedWeeks > 0
                ? authoringInput
                : undefined,
          })
        : normalizeAiFirstPlanDraftToTrainingPlan({
            draft: parsedOutput,
            authoringInput,
          });

    if (!normalized.ok) {
      return fallbackOrUnavailable({
        authoringInput,
        reason: normalized.reason,
        issues: normalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: response.body.id ?? null,
        startedAt,
        fallbackMetadata: normalized.fallback,
        allowDeterministicFallback: useDeterministicFallback,
        debug: { ...responseDebug, requestPhase: "fallback_after_validation" },
        blueprintHorizonStrategy,
      });
    }

    const finalized =
      contractMode === "blueprint" && blueprintHorizonStrategy
        ? finalizeBlueprintHorizonPlan({
            normalized,
            authoringInput,
            blueprintHorizonStrategy,
            responseDebug,
          })
        : normalized;

    if (!finalized.ok) {
      return fallbackOrUnavailable({
        authoringInput,
        reason: finalized.reason,
        issues: finalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: response.body.id ?? null,
        startedAt,
        fallbackMetadata: finalized.fallbackMetadata,
        allowDeterministicFallback: useDeterministicFallback,
        debug: { ...responseDebug, requestPhase: "fallback_after_validation" },
        blueprintHorizonStrategy,
      });
    }

    return {
      ok: true,
      authoringInput,
      canonicalPlan: finalized.canonicalPlan,
      metadata: {
        ...finalized.metadata,
        fallbackReason: null,
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: response.body.id ?? null,
        elapsedMs: Date.now() - startedAt,
        validationIssueCount: finalized.metadata.validationIssues.length,
        debug: { ...responseDebug, requestPhase: "normalized" },
        blueprintTrace:
          contractMode === "blueprint"
            ? enrichAiFirstPlanBlueprintTrace({
                trace: finalized.metadata.blueprintTrace ?? null,
                authoringInput,
                canonicalPlan: finalized.canonicalPlan,
                sourceStatus: finalized.metadata.status,
                fallbackReason: null,
                issues: finalized.metadata.validationIssues,
                repairs: finalized.metadata.repairs,
                model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
                elapsedMs: Date.now() - startedAt,
                debug: { ...responseDebug, requestPhase: "normalized" },
                blueprintHorizonStrategy: buildAiFirstPlanBlueprintHorizonTrace({
                  strategy: blueprintHorizonStrategy,
                  promptCharEstimateAfter: responseDebug.promptCharEstimate,
                  finalWorkoutCount: finalized.canonicalPlan.planned_workouts.length,
                }),
              })
            : (finalized.metadata.blueprintTrace ?? null),
      },
    };
  } catch (error) {
    const fallbackReason = classifyAiFirstPlanDraftError(error, contractMode);

    return fallbackOrUnavailable({
      authoringInput,
      reason: fallbackReason,
      issues: [boundedErrorMessage(error, fallbackReason)],
      model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
      responseId: null,
      startedAt,
      allowDeterministicFallback: useDeterministicFallback,
      debug:
        error instanceof AiFirstPlanDraftServiceError
          ? error.debug
          : buildNotStartedDebug({
              timeoutMs,
              maxOutputTokens,
              model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
              contractMode,
            }),
      blueprintHorizonStrategy,
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

function finalizeBlueprintHorizonPlan({
  normalized,
  authoringInput,
  blueprintHorizonStrategy,
  responseDebug,
}: {
  normalized: Extract<AiFirstPlanDraftNormalizationResult, { ok: true }>;
  authoringInput: StructuredFirstPlanAuthoringInput;
  blueprintHorizonStrategy: AiFirstPlanBlueprintHorizonStrategy;
  responseDebug: AiFirstPlanDraftDebugMetadata;
}):
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      metadata: AiFirstPlanDraftMetadata;
    }
  | {
      ok: false;
      reason: string;
      issues: NormalizationIssue[];
      fallbackMetadata: AiFirstPlanDraftMetadata;
    } {
  const extended = extendAiFirstPlanBlueprintPlanToRequestedHorizon({
    canonicalPlan: normalized.canonicalPlan,
    fullAuthoringInput: authoringInput,
    strategy: blueprintHorizonStrategy,
  });

  if (!extended.ok) {
    return {
      ok: false,
      reason: extended.reason,
      issues: extended.issues,
      fallbackMetadata: {
        ...normalized.metadata,
        blueprintTrace: attachBlueprintHorizonTrace({
          trace: normalized.metadata.blueprintTrace ?? null,
          strategy: blueprintHorizonStrategy,
          promptCharEstimateAfter: responseDebug.promptCharEstimate,
          finalWorkoutCount: null,
        }),
      },
    };
  }

  const repairs = [...normalized.metadata.repairs, ...extended.repairs];
  const status = repairs.length > 0 ? "repaired_ai_draft" : normalized.metadata.status;

  return {
    ok: true,
    canonicalPlan: extended.canonicalPlan,
    metadata: {
      ...normalized.metadata,
      status,
      repairs,
      blueprintTrace: attachBlueprintHorizonTrace({
        trace: normalized.metadata.blueprintTrace ?? null,
        strategy: blueprintHorizonStrategy,
        promptCharEstimateAfter: responseDebug.promptCharEstimate,
        finalWorkoutCount: extended.canonicalPlan.planned_workouts.length,
      }),
    },
  };
}

async function requestOpenAiFirstPlanDraft({
  apiKey,
  model,
  authoringInput,
  referenceExample,
  today,
  timeoutMs,
  maxOutputTokens,
  contractMode,
  fetchImpl,
}: {
  apiKey: string;
  model: string;
  authoringInput: StructuredFirstPlanAuthoringInput;
  referenceExample: unknown;
  today: string | undefined;
  timeoutMs: number;
  maxOutputTokens: number;
  contractMode: AiFirstPlanGenerationContract;
  fetchImpl: typeof fetch;
}) {
  const prompt =
    contractMode === "blueprint"
      ? buildAiFirstPlanBlueprintPrompt({
          authoringInput,
          today,
          referenceExample,
        })
      : buildAiFirstPlanDraftPrompt({
          authoringInput,
          today,
          referenceExample,
        });
  const controller = new AbortController();
  const requestStartedAt = Date.now();
  let abortFired = false;
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
    contractMode,
  });
  const request = async () => {
    try {
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
              name:
                contractMode === "blueprint" ? "ai_first_plan_blueprint" : "ai_first_plan_draft",
              strict: true,
              schema: prompt.responseSchema,
            },
          },
        }),
        signal: controller.signal,
      });
      const body = (await response.json()) as OpenAiResponseEnvelope;
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

      if (!response.ok) {
        throw new AiFirstPlanDraftServiceError(
          `${contractPrefix(contractMode)}_request_failed`,
          [extractOpenAiError(body)],
          { ...responseDebug, requestPhase: "request_failed" },
        );
      }

      return { body, debug: responseDebug };
    } catch (error) {
      if (error instanceof AiFirstPlanDraftServiceError) {
        throw error;
      }

      throw new AiFirstPlanDraftServiceError(
        classifyAiFirstPlanDraftError(error, contractMode),
        [boundedErrorMessage(error, "AI first-plan request failed.")],
        {
          ...baseDebug,
          requestPhase: abortFired ? "timeout_before_response" : "request_failed",
          abortFired,
          openAiElapsedMs: Date.now() - requestStartedAt,
        },
      );
    }
  };

  return withTimeout(request(), timeoutMs, () => {
    abortFired = true;
    controller.abort();

    return new AiFirstPlanDraftServiceError(
      `${contractPrefix(contractMode)}_timed_out`,
      [`AI first-plan request timed out after ${timeoutMs} ms.`],
      {
        ...baseDebug,
        requestPhase: "timeout_before_response",
        abortFired: true,
        openAiElapsedMs: Date.now() - requestStartedAt,
      },
    );
  });
}

function buildNotStartedDebug({
  timeoutMs,
  maxOutputTokens,
  model,
  contractMode,
}: {
  timeoutMs: number;
  maxOutputTokens: number;
  model: string;
  contractMode: AiFirstPlanGenerationContract;
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
    contractMode,
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
  contractMode,
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
  contractMode: AiFirstPlanGenerationContract;
}): AiFirstPlanDraftDebugMetadata {
  return {
    timeoutMs,
    maxOutputTokens,
    contractMode,
    responseSchemaMode:
      contractMode === "blueprint"
        ? "responses_json_schema_blueprint_strict"
        : "responses_json_schema_draft_strict",
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

function supportsReasoningEffort(model: string) {
  const normalized = model.trim().toLowerCase();

  return normalized.startsWith("gpt-5") || normalized.startsWith("o");
}

function fallbackOrUnavailable({
  allowDeterministicFallback,
  ...args
}: {
  allowDeterministicFallback: boolean;
  authoringInput: StructuredFirstPlanAuthoringInput;
  reason: string;
  issues: string[];
  model: string;
  responseId: string | null;
  startedAt: number;
  fallbackMetadata?: AiFirstPlanDraftMetadata;
  debug: AiFirstPlanDraftDebugMetadata;
  blueprintHorizonStrategy?: AiFirstPlanBlueprintHorizonStrategy | null;
}):
  | Extract<AiFirstPlanDraftPreviewResult, { ok: true }>
  | Extract<
      AiFirstPlanDraftPreviewResult,
      {
        ok: false;
        reason: "ai_first_plan_blueprint_unavailable" | "ai_first_plan_draft_unavailable";
      }
    > {
  if (allowDeterministicFallback) {
    return deterministicFallback(args);
  }

  return unavailableAiFirstPlanDraft(args);
}

function unavailableAiFirstPlanDraft({
  authoringInput,
  reason,
  issues,
  model,
  responseId,
  startedAt,
  fallbackMetadata,
  debug,
  blueprintHorizonStrategy,
}: {
  authoringInput: StructuredFirstPlanAuthoringInput;
  reason: string;
  issues: string[];
  model: string;
  responseId: string | null;
  startedAt: number;
  fallbackMetadata?: AiFirstPlanDraftMetadata;
  debug: AiFirstPlanDraftDebugMetadata;
  blueprintHorizonStrategy?: AiFirstPlanBlueprintHorizonStrategy | null;
}): Extract<
  AiFirstPlanDraftPreviewResult,
  {
    ok: false;
    reason: "ai_first_plan_blueprint_unavailable" | "ai_first_plan_draft_unavailable";
  }
> {
  const validationIssues = issues
    .map((issue) => issue.trim())
    .filter(Boolean)
    .slice(0, 12);
  const elapsedMs = Date.now() - startedAt;
  const isBlueprint = debug.contractMode === "blueprint";
  const sourceKind = isBlueprint ? "ai_first_plan_blueprint_v1" : "ai_first_plan_draft_v1";
  const sourceStatus = isBlueprint ? "blueprint_unavailable" : "draft_unavailable";
  const blueprintTrace = isBlueprint
    ? buildUnavailableBlueprintTrace({
        trace: fallbackMetadata?.blueprintTrace ?? null,
        authoringInput,
        sourceKind,
        reason,
        issues: validationIssues,
        repairs: fallbackMetadata?.repairs ?? [],
        model,
        elapsedMs,
        debug,
        blueprintHorizonStrategy: buildAiFirstPlanBlueprintHorizonTrace({
          strategy: blueprintHorizonStrategy ?? null,
          promptCharEstimateAfter: debug.promptCharEstimate,
          finalWorkoutCount: null,
        }),
      })
    : (fallbackMetadata?.blueprintTrace ?? null);

  return {
    ok: false,
    reason: isBlueprint ? "ai_first_plan_blueprint_unavailable" : "ai_first_plan_draft_unavailable",
    message: "We could not create a safe AI-authored plan draft. Please retry.",
    issues: validationIssues,
    authoringInput,
    metadata: {
      sourceKind,
      sourceStatus,
      fallbackReason: reason,
      model,
      responseId,
      elapsedMs,
      validationIssues,
      validationIssueCount: validationIssues.length,
      debug,
      blueprintTrace,
    },
  };
}

function deterministicFallback({
  authoringInput,
  reason,
  issues,
  model,
  responseId,
  startedAt,
  fallbackMetadata,
  debug,
  blueprintHorizonStrategy,
}: {
  authoringInput: StructuredFirstPlanAuthoringInput;
  reason: string;
  issues: string[];
  model: string;
  responseId: string | null;
  startedAt: number;
  fallbackMetadata?: AiFirstPlanDraftMetadata;
  debug: AiFirstPlanDraftDebugMetadata;
  blueprintHorizonStrategy?: AiFirstPlanBlueprintHorizonStrategy | null;
}): Extract<AiFirstPlanDraftPreviewResult, { ok: true }> {
  const canonicalPlan = buildStructuredAuthoringPlan(authoringInput);
  const validationIssues = issues
    .map((issue) => issue.trim())
    .filter(Boolean)
    .slice(0, 12);
  const elapsedMs = Date.now() - startedAt;
  const fallbackTrace =
    debug.contractMode === "blueprint"
      ? enrichAiFirstPlanBlueprintTrace({
          trace: fallbackMetadata?.blueprintTrace ?? null,
          authoringInput,
          canonicalPlan,
          sourceStatus: "deterministic_fallback",
          fallbackReason: reason,
          issues: validationIssues,
          repairs: fallbackMetadata?.repairs ?? [],
          model,
          elapsedMs,
          debug,
          blueprintHorizonStrategy: buildAiFirstPlanBlueprintHorizonTrace({
            strategy: blueprintHorizonStrategy ?? null,
            promptCharEstimateAfter: debug.promptCharEstimate,
            finalWorkoutCount: canonicalPlan.planned_workouts.length,
          }),
        })
      : (fallbackMetadata?.blueprintTrace ?? null);

  return {
    ok: true,
    authoringInput,
    canonicalPlan,
    metadata: {
      ...(fallbackMetadata ?? {
        status: "deterministic_fallback" as const,
        source: "deterministic_structured_generator" as const,
        validationIssues,
        repairs: [],
        reviewAssumptions: [
          "Hito used the deterministic structured generator because AI first-plan drafting did not return a valid reviewed draft.",
        ],
        metricPolicySummary:
          "Deterministic fallback preserves existing pace, default-HR, fixed-rest-day, and effort-safety gates.",
      }),
      status: "deterministic_fallback",
      source: "deterministic_structured_generator",
      fallbackReason: reason,
      validationIssues,
      model,
      responseId,
      elapsedMs,
      validationIssueCount: validationIssues.length,
      debug,
      blueprintTrace: fallbackTrace,
    },
  };
}

function buildUnavailableBlueprintTrace({
  trace,
  authoringInput,
  sourceKind,
  reason,
  issues,
  repairs,
  model,
  elapsedMs,
  debug,
  blueprintHorizonStrategy,
}: {
  trace: AiFirstPlanBlueprintTraceMetadata | null;
  authoringInput: StructuredFirstPlanAuthoringInput;
  sourceKind: "ai_first_plan_blueprint_v1" | "ai_first_plan_draft_v1";
  reason: string;
  issues: string[];
  repairs: string[];
  model: string;
  elapsedMs: number;
  debug: AiFirstPlanDraftDebugMetadata;
  blueprintHorizonStrategy?: AiFirstPlanBlueprintHorizonTraceMetadata;
}): AiFirstPlanBlueprintTraceMetadata {
  const baseTrace =
    trace ??
    buildAiFirstPlanBlueprintTrace({
      authoringInput,
      blueprint: null,
      normalizedWorkouts: null,
      sourceStatus: "blueprint_unavailable",
      sourceKind,
      fallbackReason: reason,
      issues: issuesToTraceIssues(issues, reason),
      repairs,
    });

  return {
    ...baseTrace,
    sourceKind,
    sourceStatus: "blueprint_unavailable",
    fallbackReason: reason,
    model,
    timeoutMs: debug.timeoutMs,
    elapsedMs,
    deterministicFallbackBoundary: {
      used: false,
      reason,
    },
    ...(blueprintHorizonStrategy ? { blueprintHorizonStrategy } : {}),
  };
}

function enrichAiFirstPlanBlueprintTrace({
  trace,
  authoringInput,
  canonicalPlan,
  sourceStatus,
  fallbackReason,
  issues,
  repairs,
  model,
  elapsedMs,
  debug,
  blueprintHorizonStrategy,
}: {
  trace: AiFirstPlanDraftPreviewMetadata["blueprintTrace"];
  authoringInput: StructuredFirstPlanAuthoringInput;
  canonicalPlan: TrainingPlanV2;
  sourceStatus: AiFirstPlanDraftPreviewMetadata["status"];
  fallbackReason: string | null;
  issues: string[];
  repairs: string[];
  model: string;
  elapsedMs: number;
  debug: AiFirstPlanDraftDebugMetadata;
  blueprintHorizonStrategy?: AiFirstPlanBlueprintHorizonTraceMetadata;
}) {
  const baseTrace =
    trace ??
    buildAiFirstPlanBlueprintTrace({
      authoringInput,
      blueprint: null,
      normalizedWorkouts: canonicalPlan.planned_workouts,
      sourceStatus,
      sourceKind: canonicalPlan.source_kind ?? null,
      fallbackReason,
      issues: issuesToTraceIssues(issues, fallbackReason ?? "unknown"),
      repairs,
    });

  return {
    ...baseTrace,
    sourceKind: canonicalPlan.source_kind ?? baseTrace.sourceKind,
    sourceStatus,
    fallbackReason,
    model,
    timeoutMs: debug.timeoutMs,
    elapsedMs,
    deterministicFallbackBoundary: {
      used: sourceStatus === "deterministic_fallback",
      reason: fallbackReason,
    },
    normalizedCanonicalWeeks: groupCanonicalIdentityTraceByWeek(canonicalPlan.planned_workouts),
    finalReviewedPlanIdentityCounts: countCanonicalWorkoutField(
      canonicalPlan.planned_workouts,
      "workout_identity",
    ),
    finalReviewedPlanFamilyCounts: countCanonicalWorkoutField(
      canonicalPlan.planned_workouts,
      "workout_family",
    ),
    finalReviewedPlanIconCounts: countCanonicalWorkoutField(
      canonicalPlan.planned_workouts,
      "calendar_icon_key",
    ),
    ...(blueprintHorizonStrategy ? { blueprintHorizonStrategy } : {}),
  };
}

function groupCanonicalIdentityTraceByWeek(workouts: TrainingPlanV2["planned_workouts"]) {
  const byWeek = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of workouts) {
    byWeek.set(workout.week_number, [...(byWeek.get(workout.week_number) ?? []), workout]);
  }

  return [...byWeek.entries()]
    .sort(([left], [right]) => left - right)
    .slice(0, 52)
    .map(([weekNumber, weekWorkouts]) => ({
      weekNumber,
      identities: weekWorkouts.map((workout) => workout.workout_identity ?? "unknown").slice(0, 7),
      families: weekWorkouts.map((workout) => workout.workout_family ?? "unknown").slice(0, 7),
      icons: weekWorkouts.map((workout) => workout.calendar_icon_key ?? "unknown").slice(0, 7),
    }));
}

function countCanonicalWorkoutField(
  workouts: TrainingPlanV2["planned_workouts"],
  field: "workout_identity" | "workout_family" | "calendar_icon_key",
) {
  return workouts.reduce<Record<string, number>>((counts, workout) => {
    const value = workout[field] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function issuesToTraceIssues(issues: string[], fallbackCode: string) {
  return issues.map((issue) => ({
    code: issue.includes(":") ? (issue.split(":")[0]?.trim() ?? "unknown") : fallbackCode,
    message: issue,
  }));
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
  response: OpenAiResponseEnvelope,
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

function extractOpenAiError(response: OpenAiResponseEnvelope) {
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

function classifyAiFirstPlanDraftError(
  error: unknown,
  contractMode: AiFirstPlanGenerationContract = DEFAULT_AI_FIRST_PLAN_CONTRACT,
) {
  if (error instanceof AiFirstPlanDraftServiceError) {
    return error.reason;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return `${contractPrefix(contractMode)}_timed_out`;
  }

  return `${contractPrefix(contractMode)}_unavailable`;
}

function contractPrefix(contractMode: AiFirstPlanGenerationContract) {
  return contractMode === "blueprint" ? "ai_first_plan_blueprint" : "ai_first_plan_draft";
}

function boundedErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AiFirstPlanDraftServiceError) {
    return error.issues.join(" | ").slice(0, 300) || fallback;
  }

  if (error instanceof Error) {
    return error.message.trim().slice(0, 300) || fallback;
  }

  return fallback;
}

class AiFirstPlanDraftServiceError extends Error {
  constructor(
    readonly reason: string,
    readonly issues: string[],
    readonly debug: AiFirstPlanDraftDebugMetadata,
  ) {
    super(`${reason}: ${issues.slice(0, 3).join(" | ")}`);
  }
}
