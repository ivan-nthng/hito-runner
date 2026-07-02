import type {
  AiFirstPlanBlueprintAuthoredDateSource,
  AiFirstPlanBlueprintDatePlacementMetadata,
  AiFirstPlanBlueprintTraceMetadata,
  AiFirstPlanDraftMetadata,
  AiFirstPlanDraftNormalizationResult,
} from "@/lib/ai-first-plan-draft-metadata";
import {
  buildAiFirstPlanBlueprintTrace,
  buildAiFirstPlanBlueprintPrompt,
  normalizeAiFirstPlanBlueprintToTrainingPlan,
} from "@/lib/ai-first-plan-blueprint-authoring";
import {
  buildAiFirstPlanBlueprintHorizonTrace,
  resolveAiFirstPlanBlueprintHorizonStrategy,
  type AiFirstPlanBlueprintHorizonStrategy,
  type AiFirstPlanBlueprintHorizonTraceMetadata,
} from "@/lib/ai-first-plan-blueprint-horizon";
import { resolveAuthoringHorizonWeeks } from "@/lib/ai-first-plan-blueprint-policy";
import { buildAiFirstPlanEnvelopePrompt } from "@/lib/ai-first-plan-envelope-prompt";
import { expandAiFirstPlanEnvelopeToTrainingPlan } from "@/lib/ai-first-plan-envelope-expand";
import { buildAiFirstPlanEnvelopeTrace } from "@/lib/ai-first-plan-envelope-trace";
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
export type AiFirstPlanGenerationContract = "blueprint" | "envelope";

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
  fetchImpl?: typeof fetch;
  generationLedger?: AiPlanGenerationLedgerOptions;
  blueprintEnforcePreferredLongRunDay?: boolean;
}

export interface AiFirstPlanDraftPreviewMetadata extends AiFirstPlanDraftMetadata {
  fallbackReason: string | null;
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
  contractMode: AiFirstPlanGenerationContract;
  responseSchemaMode:
    | "responses_json_schema_blueprint_strict"
    | "responses_json_schema_envelope_strict";
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
  sourceKind: "ai_first_plan_blueprint_v1" | "ai_first_plan_envelope_v1";
  sourceStatus: "blueprint_unavailable" | "envelope_unavailable";
  fallbackReason: string;
  model: string;
  responseId: string | null;
  elapsedMs: number;
  validationIssues: string[];
  validationIssueCount: number;
  generationTrace: AiPlanGenerationLedgerTrace | null;
  debug: AiFirstPlanDraftDebugMetadata;
  blueprintTrace?: AiFirstPlanBlueprintTraceMetadata | null;
  envelopeTrace?: unknown;
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
      reason: "ai_first_plan_blueprint_unavailable" | "ai_first_plan_envelope_unavailable";
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
  fetchImpl = globalThis.fetch,
  generationLedger,
  blueprintEnforcePreferredLongRunDay,
}: GenerateAiFirstPlanDraftPreviewOptions): Promise<AiFirstPlanDraftPreviewResult> {
  const authoringInputResult = resolveStructuredAuthoringInput(input, inputKind);

  if (!authoringInputResult.ok) {
    return authoringInputResult;
  }

  const authoringInput = authoringInputResult.authoringInput;
  const startedAt = Date.now();
  const blueprintHorizonStrategy =
    contractMode === "blueprint"
      ? resolveAiFirstPlanBlueprintHorizonStrategy({
          authoringInput,
          today,
          referenceExample,
          maxAuthoredWeeks: resolveAuthoringHorizonWeeks(authoringInput),
        })
      : null;
  const openAiAuthoringInput = blueprintHorizonStrategy?.openAiAuthoringInput ?? authoringInput;
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
        contractMode,
      }),
      generationTrace: null,
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
        debug: { ...responseDebug, requestPhase: "fallback_after_validation" },
        generationTrace: latestGenerationTrace,
        blueprintHorizonStrategy,
      });
    }

    const normalized = normalizeOpenAiFirstPlanContractOutput({
      contractMode,
      parsedOutput,
      authoringInput,
      openAiAuthoringInput,
      blueprintHorizonStrategy,
      responseDebug,
      blueprintEnforcePreferredLongRunDay,
    });

    if (!normalized.ok) {
      latestGenerationTrace = await recordAiPlanGenerationUnavailable({
        trace: latestGenerationTrace,
        reason: normalized.reason,
        issues: normalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        parseStatus: "parsed_json",
        normalizationStatus: "failed",
        repairs: normalized.fallback.repairs,
        options: generationLedger,
      });

      return unavailableAiFirstPlanDraft({
        authoringInput,
        reason: normalized.reason,
        issues: normalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: latestGenerationTrace?.provider.responseId ?? response.body.id ?? null,
        startedAt,
        fallbackMetadata: normalized.fallback,
        debug: { ...responseDebug, requestPhase: "fallback_after_validation" },
        generationTrace: latestGenerationTrace,
        blueprintHorizonStrategy,
      });
    }

    const finalized = normalized;

    if (!finalized.ok) {
      latestGenerationTrace = await recordAiPlanGenerationUnavailable({
        trace: latestGenerationTrace,
        reason: finalized.reason,
        issues: finalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        parseStatus: "parsed_json",
        normalizationStatus: "finalization_failed",
        repairs: finalized.fallbackMetadata.repairs,
        options: generationLedger,
      });

      return unavailableAiFirstPlanDraft({
        authoringInput,
        reason: finalized.reason,
        issues: finalized.issues.map((issue) => `${issue.code}: ${issue.message}`).slice(0, 12),
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: latestGenerationTrace?.provider.responseId ?? response.body.id ?? null,
        startedAt,
        fallbackMetadata: finalized.fallbackMetadata,
        debug: { ...responseDebug, requestPhase: "fallback_after_validation" },
        generationTrace: latestGenerationTrace,
        blueprintHorizonStrategy,
      });
    }

    latestGenerationTrace = await updateAiPlanGenerationLedgerTrace(
      latestGenerationTrace,
      {
        pipeline: {
          parseStatus: "parsed_json",
          normalizationStatus: "normalized",
          repairs: finalized.metadata.repairs,
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
        fallbackReason: null,
        model: model ?? DEFAULT_OPENAI_PLAN_MODEL,
        responseId: response.body.id ?? null,
        elapsedMs: Date.now() - startedAt,
        validationIssueCount: finalized.metadata.validationIssues.length,
        generationTrace: latestGenerationTrace,
        debug: { ...responseDebug, requestPhase: "normalized" },
        blueprintTrace:
          contractMode === "blueprint"
            ? enrichAiFirstPlanBlueprintTrace({
                trace: finalized.metadata.blueprintTrace ?? null,
                authoringInput,
                canonicalPlan: finalized.canonicalPlan,
                sourceStatus: toBlueprintTraceSourceStatus(finalized.metadata.status),
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
                authoredDateSource: resolveAuthoredDateSource(latestGenerationTrace),
              })
            : (finalized.metadata.blueprintTrace ?? null),
        envelopeTrace: finalized.metadata.envelopeTrace ?? null,
        datePlacement: withHorizonDatePlacement({
          datePlacement: finalized.metadata.datePlacement ?? null,
          strategy: blueprintHorizonStrategy,
          authoredDateSource: resolveAuthoredDateSource(latestGenerationTrace),
        }),
      },
    };
  } catch (error) {
    const fallbackReason = classifyAiFirstPlanDraftError(error, contractMode);
    const errorGenerationTrace = generationTraceFromError(error) ?? latestGenerationTrace;
    const fallbackParseStatus =
      error instanceof AiFirstPlanDraftServiceError &&
      error.reason === "ai_first_plan_draft_empty_output"
        ? "empty_output"
        : "not_started";
    const fallbackFinalOutcome =
      fallbackReason.includes("timed_out") ||
      errorGenerationTrace?.pipeline.finalOutcome === "timeout"
        ? "timeout"
        : errorGenerationTrace?.pipeline.finalOutcome === "provider_error"
          ? "provider_error"
          : "unavailable";
    latestGenerationTrace = await recordAiPlanGenerationUnavailable({
      trace: errorGenerationTrace,
      reason: fallbackReason,
      issues: [boundedErrorMessage(error, fallbackReason)],
      parseStatus:
        errorGenerationTrace?.pipeline.parseStatus &&
        errorGenerationTrace.pipeline.parseStatus !== "not_started"
          ? errorGenerationTrace.pipeline.parseStatus
          : fallbackParseStatus,
      normalizationStatus:
        errorGenerationTrace?.pipeline.normalizationStatus &&
        errorGenerationTrace.pipeline.normalizationStatus !== "not_started"
          ? errorGenerationTrace.pipeline.normalizationStatus
          : "not_started",
      finalOutcome: fallbackFinalOutcome,
      options: generationLedger,
    });

    return unavailableAiFirstPlanDraft({
      authoringInput,
      reason: fallbackReason,
      issues: [boundedErrorMessage(error, fallbackReason)],
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
              contractMode,
            }),
      generationTrace: latestGenerationTrace,
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

function normalizeOpenAiFirstPlanContractOutput({
  contractMode,
  parsedOutput,
  authoringInput,
  openAiAuthoringInput,
  blueprintHorizonStrategy,
  responseDebug,
  blueprintEnforcePreferredLongRunDay,
}: {
  contractMode: AiFirstPlanGenerationContract;
  parsedOutput: unknown;
  authoringInput: StructuredFirstPlanAuthoringInput;
  openAiAuthoringInput: StructuredFirstPlanAuthoringInput;
  blueprintHorizonStrategy: AiFirstPlanBlueprintHorizonStrategy | null;
  responseDebug: AiFirstPlanDraftDebugMetadata;
  blueprintEnforcePreferredLongRunDay?: boolean;
}): AiFirstPlanDraftNormalizationResult {
  if (contractMode === "blueprint") {
    return normalizeAiFirstPlanBlueprintToTrainingPlan({
      blueprint: parsedOutput,
      authoringInput: openAiAuthoringInput,
      deterministicSupportAuthoringInput: undefined,
      normalizationOptions: {
        enforcePreferredLongRunDay: blueprintEnforcePreferredLongRunDay,
      },
      useDeterministicSupport: false,
    });
  }

  if (contractMode === "envelope") {
    const expanded = expandAiFirstPlanEnvelopeToTrainingPlan({
      envelope: parsedOutput,
      authoringInput,
    });

    if (!expanded.ok) {
      return {
        ok: false,
        reason: expanded.reason,
        issues: expanded.issues.map((issue) => ({
          code: issue.code,
          message: issue.message,
          path: issue.path,
        })),
        fallback: {
          status: "expanded_from_envelope",
          source: "openai_ai_first_plan_envelope",
          validationIssues: expanded.issues
            .map((issue) => `${issue.code}: ${issue.message}`)
            .slice(0, 12),
          repairs: [],
          reviewAssumptions: [],
          metricPolicySummary:
            "Envelope expansion failed before producing a reviewable canonical plan.",
          envelopeTrace: buildAiFirstPlanEnvelopeTrace({
            envelope: parsedOutput,
            authoringInput,
            result: expanded,
            sizeComparison: buildAiFirstPlanEnvelopeServiceSizeComparison({
              envelope: parsedOutput,
              responseDebug,
            }),
          }),
        },
      };
    }

    return {
      ok: true,
      canonicalPlan: expanded.canonicalPlan,
      metadata: {
        status: "expanded_from_envelope",
        source: "openai_ai_first_plan_envelope",
        validationIssues: expanded.metadata.validationIssues,
        repairs: expanded.metadata.repairs,
        reviewAssumptions: expanded.metadata.reviewAssumptions,
        metricPolicySummary:
          "Backend expanded compact envelope intent into canonical rows with existing metric gates.",
        envelopeTrace: buildAiFirstPlanEnvelopeTrace({
          envelope: parsedOutput,
          authoringInput,
          result: expanded,
          sizeComparison: buildAiFirstPlanEnvelopeServiceSizeComparison({
            envelope: parsedOutput,
            responseDebug,
          }),
        }),
      },
    };
  }

  const exhaustiveContract: never = contractMode;
  return exhaustiveContract;
}

function buildAiFirstPlanEnvelopeServiceSizeComparison({
  envelope,
  responseDebug,
}: {
  envelope: unknown;
  responseDebug: AiFirstPlanDraftDebugMetadata;
}) {
  return {
    envelopePromptCharEstimate: responseDebug.promptCharEstimate,
    envelopeSystemPromptChars: responseDebug.systemPromptChars,
    envelopeUserPromptChars: responseDebug.userPromptChars,
    envelopeResponseSchemaChars: responseDebug.responseSchemaChars,
    envelopeOutputChars: JSON.stringify(envelope).length,
    envelopeLiveOutputChars: responseDebug.outputTextChars,
    blueprintFullOutputChars: null,
    blueprintBoundedOutputChars: null,
    blueprintPromptCharEstimateBefore: null,
    blueprintPromptCharEstimateAfter: null,
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
  generationLedger,
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
  generationLedger?: AiPlanGenerationLedgerOptions;
}) {
  const prompt = buildOpenAiFirstPlanContractPrompt({
    contractMode,
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
  let generationTrace = await createAiPlanGenerationLedgerTrace({
    providerKind: resolveAiPlanGenerationProviderKind({ apiKey, model }),
    model,
    contractMode,
    responseSchemaMode: responseSchemaModeForContract(contractMode),
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
    responseSchema: prompt.responseSchema,
    timeoutMs,
    maxOutputTokens,
  });
  generationTrace =
    (await updateAiPlanGenerationLedgerTrace(generationTrace, {}, generationLedger)) ??
    generationTrace;
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
              name: responseSchemaNameForContract(contractMode),
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
                unavailableReason: `${contractPrefix(contractMode)}_request_failed`,
                validationIssues: [extractOpenAiError(body)],
              },
            },
            generationLedger,
          )) ?? generationTrace;

        throw new AiFirstPlanDraftServiceError(
          `${contractPrefix(contractMode)}_request_failed`,
          [extractOpenAiError(body)],
          { ...responseDebug, requestPhase: "request_failed" },
          generationTrace,
        );
      }

      return { body, debug: responseDebug, generationTrace };
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
        generationTrace,
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
      generationTrace,
    );
  });
}

function buildOpenAiFirstPlanContractPrompt({
  contractMode,
  authoringInput,
  today,
  referenceExample,
}: {
  contractMode: AiFirstPlanGenerationContract;
  authoringInput: StructuredFirstPlanAuthoringInput;
  today: string | undefined;
  referenceExample: unknown;
}) {
  if (contractMode === "blueprint") {
    return buildAiFirstPlanBlueprintPrompt({
      authoringInput,
      today,
      referenceExample,
    });
  }

  if (contractMode === "envelope") {
    void today;
    void referenceExample;

    return buildAiFirstPlanEnvelopePrompt({
      authoringInput,
    });
  }

  const exhaustiveContract: never = contractMode;
  void today;
  void referenceExample;
  return exhaustiveContract;
}

function responseSchemaNameForContract(contractMode: AiFirstPlanGenerationContract) {
  switch (contractMode) {
    case "blueprint":
      return "ai_first_plan_blueprint";
    case "envelope":
      return "ai_first_plan_envelope";
  }
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
    responseSchemaMode: responseSchemaModeForContract(contractMode),
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

function responseSchemaModeForContract(
  contractMode: AiFirstPlanGenerationContract,
): AiFirstPlanDraftDebugMetadata["responseSchemaMode"] {
  switch (contractMode) {
    case "blueprint":
      return "responses_json_schema_blueprint_strict";
    case "envelope":
      return "responses_json_schema_envelope_strict";
  }
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
  repairs = [],
  options,
}: {
  trace: AiPlanGenerationLedgerTrace | null;
  reason: string;
  issues: string[];
  parseStatus: AiPlanGenerationLedgerTrace["pipeline"]["parseStatus"];
  normalizationStatus: AiPlanGenerationLedgerTrace["pipeline"]["normalizationStatus"];
  finalOutcome?: AiPlanGenerationLedgerTrace["pipeline"]["finalOutcome"];
  repairs?: readonly string[];
  options?: AiPlanGenerationLedgerOptions;
}) {
  return updateAiPlanGenerationLedgerTrace(
    trace,
    {
      pipeline: {
        parseStatus,
        normalizationStatus,
        repairs,
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
  fallbackMetadata,
  debug,
  generationTrace,
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
  generationTrace?: AiPlanGenerationLedgerTrace | null;
  blueprintHorizonStrategy?: AiFirstPlanBlueprintHorizonStrategy | null;
}): Extract<
  AiFirstPlanDraftPreviewResult,
  {
    ok: false;
    reason: "ai_first_plan_blueprint_unavailable" | "ai_first_plan_envelope_unavailable";
  }
> {
  const validationIssues = issues
    .map((issue) => issue.trim())
    .filter(Boolean)
    .slice(0, 12);
  const elapsedMs = Date.now() - startedAt;
  const isBlueprint = debug.contractMode === "blueprint";
  const isEnvelope = debug.contractMode === "envelope";
  const sourceKind = sourceKindForUnavailableContract(debug.contractMode);
  const sourceStatus = sourceStatusForUnavailableContract(debug.contractMode);
  const blueprintTrace = isBlueprint
    ? buildUnavailableBlueprintTrace({
        trace: fallbackMetadata?.blueprintTrace ?? null,
        authoringInput,
        sourceKind: "ai_first_plan_blueprint_v1",
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
    reason: unavailableReasonForContract(debug.contractMode),
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
      generationTrace: generationTrace ?? null,
      debug,
      blueprintTrace,
      envelopeTrace: isEnvelope ? (fallbackMetadata?.envelopeTrace ?? null) : undefined,
    },
  };
}

function sourceKindForUnavailableContract(contractMode: AiFirstPlanGenerationContract) {
  switch (contractMode) {
    case "blueprint":
      return "ai_first_plan_blueprint_v1" as const;
    case "envelope":
      return "ai_first_plan_envelope_v1" as const;
  }
}

function sourceStatusForUnavailableContract(contractMode: AiFirstPlanGenerationContract) {
  switch (contractMode) {
    case "blueprint":
      return "blueprint_unavailable" as const;
    case "envelope":
      return "envelope_unavailable" as const;
  }
}

function unavailableReasonForContract(contractMode: AiFirstPlanGenerationContract) {
  switch (contractMode) {
    case "blueprint":
      return "ai_first_plan_blueprint_unavailable" as const;
    case "envelope":
      return "ai_first_plan_envelope_unavailable" as const;
  }
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
  sourceKind: "ai_first_plan_blueprint_v1";
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
  authoredDateSource,
}: {
  trace: AiFirstPlanDraftPreviewMetadata["blueprintTrace"];
  authoringInput: StructuredFirstPlanAuthoringInput;
  canonicalPlan: TrainingPlanV2;
  sourceStatus: AiFirstPlanBlueprintTraceMetadata["sourceStatus"];
  fallbackReason: string | null;
  issues: string[];
  repairs: string[];
  model: string;
  elapsedMs: number;
  debug: AiFirstPlanDraftDebugMetadata;
  blueprintHorizonStrategy?: AiFirstPlanBlueprintHorizonTraceMetadata;
  authoredDateSource?: AiFirstPlanBlueprintAuthoredDateSource;
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
      authoredDateSource,
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
      used: false,
      reason: fallbackReason,
    },
    datePlacement:
      withHorizonDatePlacement({
        datePlacement: baseTrace.datePlacement,
        strategy: blueprintHorizonStrategy,
        authoredDateSource,
      }) ?? baseTrace.datePlacement,
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

function toBlueprintTraceSourceStatus(
  status: AiFirstPlanDraftPreviewMetadata["status"],
): AiFirstPlanBlueprintTraceMetadata["sourceStatus"] {
  switch (status) {
    case "ai_authored":
    case "repaired_ai_draft":
      return status;
    case "expanded_from_envelope":
    case "blueprint_unavailable":
    case "envelope_unavailable":
      return "blueprint_unavailable";
  }
}

function withHorizonDatePlacement({
  datePlacement,
  strategy,
  authoredDateSource,
}: {
  datePlacement: AiFirstPlanBlueprintDatePlacementMetadata | null;
  strategy?: AiFirstPlanBlueprintHorizonStrategy | AiFirstPlanBlueprintHorizonTraceMetadata | null;
  authoredDateSource?: AiFirstPlanBlueprintAuthoredDateSource;
}): AiFirstPlanBlueprintDatePlacementMetadata | undefined {
  if (!datePlacement) {
    return undefined;
  }

  return {
    ...datePlacement,
    ...(authoredDateSource ? { authoredDateSource } : {}),
    backendExtendedWeeks: strategy?.backendExtendedWeeks ?? datePlacement.backendExtendedWeeks,
  };
}

function resolveAuthoredDateSource(
  trace: AiPlanGenerationLedgerTrace | null,
): AiFirstPlanBlueprintAuthoredDateSource {
  return trace?.provider.kind === "local_dev_fixture"
    ? "local_fixture_authored_date"
    : "openai_authored_date";
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
  switch (contractMode) {
    case "blueprint":
      return "ai_first_plan_blueprint";
    case "envelope":
      return "ai_first_plan_envelope";
  }
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
    readonly generationTrace: AiPlanGenerationLedgerTrace | null = null,
  ) {
    super(`${reason}: ${issues.slice(0, 3).join(" | ")}`);
  }
}
