import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { createFirstPlanFromReviewedCanonicalPlanForUser } from "@/lib/active-plan-persistence";
import type {
  AiFirstPlanDraftDebugMetadata,
  AiFirstPlanDraftPreviewMetadata,
  AiFirstPlanDraftUnavailableMetadata,
  GenerateAiFirstPlanDraftPreviewOptions,
} from "@/lib/ai-first-plan-draft-service";
import { AI_AUTHORED_PLAN_FIRST_SOURCE_KIND } from "@/lib/ai-authored-plan-first-compiler";
import { importedPlanSchema, type TrainingPlanV2 } from "@/lib/imported-plan";
import {
  buildStructuredFirstPlanAuthoringInput,
  buildStructuredFirstPlanDraftReview,
  buildStructuredFirstPlanDraftSummary,
  buildStructuredFirstPlanProfilePatch,
  normalizeSupportedStructuredFirstPlanOnboardingInput,
  structuredFirstPlanOnboardingInputSchema,
  type StructuredFirstPlanAuthoringInput,
  type StructuredFirstPlanDraftReview,
  type StructuredFirstPlanDraftSummary,
  type StructuredFirstPlanOnboardingInput,
} from "@/lib/structured-first-plan-onboarding";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { structuredPlanAuthoringInputSchema } from "@/lib/structured-plan-authoring";
import { buildPlanScopedStructuredAuthoringMetadata } from "@/lib/plan-authoring-snapshot";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/supabase/env";
import {
  digestSha256Hex,
  safeTokenEqual,
  signStableJsonPayload,
  stableJsonStringify,
} from "@/lib/review-token-signing";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";

const structuredFirstPlanDraftInputSchema = z.unknown();
const structuredFirstPlanConfirmInputSchema = z.unknown();
const DEFAULT_STRUCTURED_FIRST_PLAN_MODEL = "gpt-4.1-mini";
const PRODUCT_FIRST_PLAN_TIMEOUT_MS = 0;
const DEFAULT_STRUCTURED_FIRST_PLAN_MAX_OUTPUT_TOKENS = 32_000;

const structuredFirstPlanDraftGenerationDebugSchema = z
  .object({
    timeoutMs: z.number().int().nonnegative(),
    maxOutputTokens: z.number().int().positive(),
    contractMode: z.literal("plan_first"),
    responseSchemaMode: z.literal("responses_json_schema_plan_first_strict"),
    requestPhase: z.enum([
      "not_started",
      "request_started",
      "response_parsed",
      "normalized",
      "rejected_after_validation",
      "request_failed",
      "request_cancelled",
      "response_incomplete",
      "timeout_before_response",
    ]),
    abortFired: z.boolean(),
    openAiElapsedMs: z.number().int().nonnegative().nullable(),
    promptCharEstimate: z.number().int().nonnegative().nullable(),
    responseStatus: z.string().trim().min(1).max(80).nullable().optional(),
    responseIncompleteReason: z.string().trim().min(1).max(120).nullable().optional(),
    inputTokens: z.number().int().nonnegative().nullable().optional(),
    outputTokens: z.number().int().nonnegative().nullable().optional(),
    totalTokens: z.number().int().nonnegative().nullable().optional(),
    outputTextChars: z.number().int().nonnegative().nullable().optional(),
    reasoningEffortSent: z.boolean(),
  })
  .strict();

const structuredFirstPlanDraftGenerationMetadataSchema = z
  .object({
    sourceStatus: z.literal("ai_authored"),
    sourceKind: z.literal(AI_AUTHORED_PLAN_FIRST_SOURCE_KIND),
    validationIssues: z.array(z.string().trim().min(1)).max(12),
    validationIssueCount: z.number().int().min(0),
    reviewAssumptions: z.array(z.string().trim().min(1)).max(8),
    metricPolicySummary: z.string().trim().min(1).max(360).nullable(),
    model: z.string().trim().min(1).nullable(),
    responseId: z.string().trim().min(1).nullable(),
    elapsedMs: z.number().int().nonnegative().nullable(),
    debug: structuredFirstPlanDraftGenerationDebugSchema.nullable(),
  })
  .strict();

const structuredFirstPlanDraftPayloadSchema = z
  .object({
    input: structuredFirstPlanOnboardingInputSchema,
    authoringInput: structuredPlanAuthoringInputSchema,
    canonicalPlan: importedPlanSchema,
    summary: z.unknown().optional(),
    generation: structuredFirstPlanDraftGenerationMetadataSchema,
    draftToken: z.string().trim().min(16),
  })
  .strict();

const structuredFirstPlanConfirmRequestSchema = z
  .object({
    draft: structuredFirstPlanDraftPayloadSchema,
  })
  .strict();

export type StructuredFirstPlanDraftResult =
  | StructuredFirstPlanDraftSuccess
  | StructuredFirstPlanCorrectionRequired
  | {
      ok: false;
      status: "draft_failed";
      reason: "ai_authored_plan_first_unavailable";
      code: "ai_authored_plan_first_unavailable";
      message: string;
      generation: StructuredFirstPlanDraftFailureMetadata;
      safety: StructuredFirstPlanDraftSafety;
    };

export interface StructuredFirstPlanDraftSuccess {
  ok: true;
  status: "draft_ready";
  sourceKind: string;
  review: StructuredFirstPlanDraftReview;
  draft: {
    input: StructuredFirstPlanOnboardingInput;
    authoringInput: StructuredFirstPlanAuthoringInput;
    canonicalPlan: TrainingPlanV2;
    summary: StructuredFirstPlanDraftSummary;
    generation: StructuredFirstPlanDraftGenerationMetadata;
    draftToken: string;
  };
  generation: StructuredFirstPlanDraftGenerationMetadata;
  safety: StructuredFirstPlanDraftSafety;
}

export interface StructuredFirstPlanCorrectionRequired {
  ok: true;
  status: "correction_required";
  sourceKind: "structured_constructor";
  reason: "invalid_structured_input";
  correction: {
    message: string;
    fields: string[];
  };
  safety: StructuredFirstPlanDraftSafety;
}

export interface StructuredFirstPlanDraftSafety {
  requiresExplicitApply: true;
  doesNotMutatePlan: true;
  rawInputPersisted: false;
  usesCanonicalStructuredAuthoring: true;
}

export type StructuredFirstPlanDraftGenerationMetadata = z.output<
  typeof structuredFirstPlanDraftGenerationMetadataSchema
>;

export interface StructuredFirstPlanDraftFailureMetadata {
  sourceKind: typeof AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;
  sourceStatus: "plan_first_unavailable";
  unavailableReason: string;
  validationIssues: string[];
  validationIssueCount: number;
  model: string | null;
  responseId: string | null;
  elapsedMs: number | null;
  debug: z.output<typeof structuredFirstPlanDraftGenerationDebugSchema> | null;
}

export interface GenerateStructuredFirstPlanDraftOptions {
  aiPreview?: Pick<
    GenerateAiFirstPlanDraftPreviewOptions,
    "apiKey" | "model" | "timeoutMs" | "maxOutputTokens" | "fetchImpl" | "signal" | "today"
  >;
}

interface StructuredFirstPlanActionDebugContext {
  actionPathName: "generateStructuredFirstPlanDraft";
  userId: string;
  rawInput: unknown;
  parsedInput: StructuredFirstPlanOnboardingInput | null;
  authoringInput: StructuredFirstPlanAuthoringInput | null;
  serviceOptions: StructuredFirstPlanAiPreviewDebugSummary;
  result: StructuredFirstPlanDraftResult;
  errorLayer: string | null;
}

interface StructuredFirstPlanAiPreviewDebugSummary {
  contractMode: "plan_first";
  model: string | null;
  timeoutMs: number | null;
  maxOutputTokens: number | null;
  explicitOptionKeys: string[];
  envSource: {
    openAiFirstPlanModel: "env" | "default";
    openAiFirstPlanMaxOutputTokens: "env" | "default";
    genericOpenAiPlanModelConfigured: boolean;
  };
}

export type ConfirmStructuredFirstPlanDraftResult =
  | {
      ok: true;
      status: "created";
      effectiveStartDate: string;
      appliedStartDate: string;
      normalizedFromStartDate: string | null;
      firstDayResolution: FirstDayResolution | null;
      workoutCount: number;
      schemaVersion: string;
      sourceKind: string | undefined;
      onboardingContract: "structured_first_plan_onboarding_v1";
      safety: {
        requiresExplicitApply: false;
        doesNotMutatePlan: false;
        rawInputPersisted: false;
      };
    }
  | {
      ok: false;
      status: "blocked";
      reason: "invalid_draft" | "active_plan_exists" | "apply_blocked";
      message: string;
    };

export const generateStructuredFirstPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => structuredFirstPlanDraftInputSchema.parse(value))
  .handler(async ({ data }): Promise<StructuredFirstPlanDraftResult> => {
    const userId = await requirePersistedUserIdForCurrentRequest();

    return generateStructuredFirstPlanDraftForUser(userId, data, {
      aiPreview: { signal: getRequest().signal },
    });
  });

export const confirmStructuredFirstPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => structuredFirstPlanConfirmInputSchema.parse(value))
  .handler(async ({ data }): Promise<ConfirmStructuredFirstPlanDraftResult> => {
    const userId = await requirePersistedUserIdForCurrentRequest();

    return confirmStructuredFirstPlanDraftForUser(userId, data);
  });

export async function generateStructuredFirstPlanDraftForUser(
  userId: string,
  input: unknown,
  options: GenerateStructuredFirstPlanDraftOptions = {},
): Promise<StructuredFirstPlanDraftResult> {
  const aiPreviewConfig = resolveStructuredFirstPlanAiPreviewConfig(options.aiPreview);
  const parsed = parseStructuredFirstPlanDraftInput(input);

  if (!parsed.ok) {
    await writeStructuredFirstPlanActionDebugArtifact({
      actionPathName: "generateStructuredFirstPlanDraft",
      userId,
      rawInput: input,
      parsedInput: null,
      authoringInput: null,
      serviceOptions: aiPreviewConfig.summary,
      result: parsed.result,
      errorLayer: "backend_parser",
    });

    return parsed.result;
  }

  try {
    const authoringInput = buildStructuredFirstPlanAuthoringInput(parsed.input);
    const aiDraft = await generateFirstPlanStructuredDraft(authoringInput, aiPreviewConfig.options);

    if (!aiDraft.ok) {
      await writeStructuredFirstPlanActionDebugArtifact({
        actionPathName: "generateStructuredFirstPlanDraft",
        userId,
        rawInput: input,
        parsedInput: parsed.input,
        authoringInput,
        serviceOptions: aiPreviewConfig.summary,
        result: aiDraft.result,
        errorLayer: classifyStructuredDraftFailureLayer(aiDraft.result),
      });

      return aiDraft.result;
    }

    const canonicalPlan = aiDraft.canonicalPlan;
    const generation = aiDraft.generation;
    const summary = buildStructuredFirstPlanDraftSummary(canonicalPlan, authoringInput);
    const draft = {
      input: parsed.input,
      authoringInput,
      canonicalPlan,
      summary,
      generation,
      draftToken: "",
    };
    draft.draftToken = await signStructuredFirstPlanDraft(draft);

    const result: StructuredFirstPlanDraftResult = {
      ok: true,
      status: "draft_ready",
      sourceKind: generation.sourceKind,
      review: buildStructuredFirstPlanDraftReview(parsed.input, canonicalPlan, authoringInput),
      draft,
      generation,
      safety: buildStructuredDraftSafety(),
    };

    await writeStructuredFirstPlanActionDebugArtifact({
      actionPathName: "generateStructuredFirstPlanDraft",
      userId,
      rawInput: input,
      parsedInput: parsed.input,
      authoringInput,
      serviceOptions: aiPreviewConfig.summary,
      result,
      errorLayer: null,
    });

    return result;
  } catch (error) {
    const result = buildStructuredCorrectionResult(error);

    await writeStructuredFirstPlanActionDebugArtifact({
      actionPathName: "generateStructuredFirstPlanDraft",
      userId,
      rawInput: input,
      parsedInput: parsed.ok ? parsed.input : null,
      authoringInput: null,
      serviceOptions: aiPreviewConfig.summary,
      result,
      errorLayer: "authoring_input_mapper",
    });

    return result;
  }
}

async function confirmStructuredFirstPlanDraftForUser(
  userId: string,
  input: unknown,
): Promise<ConfirmStructuredFirstPlanDraftResult> {
  if (await hasActivePlanForUser(userId)) {
    return {
      ok: false,
      status: "blocked",
      reason: "active_plan_exists",
      message:
        "Structured setup can create a first plan only when there is no active plan. Use Add plan from the calendar to start a reviewed plan change.",
    };
  }

  const parsed = parseStructuredFirstPlanConfirmRequest(input);

  if (!parsed.ok) {
    return {
      ok: false,
      status: "blocked",
      reason: "invalid_draft",
      message: parsed.message,
    };
  }

  try {
    const rebuiltAuthoringInput = buildStructuredFirstPlanAuthoringInput(
      parsed.request.draft.input,
    );

    if (!sameJson(rebuiltAuthoringInput, parsed.request.draft.authoringInput)) {
      return {
        ok: false,
        status: "blocked",
        reason: "invalid_draft",
        message:
          "This structured draft no longer matches the setup answers. Generate a fresh review before creating a plan.",
      };
    }

    if (!(await isStructuredFirstPlanDraftSignatureValid(parsed.request.draft))) {
      return {
        ok: false,
        status: "blocked",
        reason: "invalid_draft",
        message:
          "This structured draft is no longer current. Generate a fresh review before creating a plan.",
      };
    }

    const profilePatch = buildStructuredFirstPlanProfilePatch(parsed.request.draft.input);
    const reviewedPlan = parsed.request.draft.canonicalPlan;
    const reviewedGeneration = parsed.request.draft.generation;

    const supportedReviewedDraft = resolveSupportedStructuredFirstPlanDraftSource({
      sourceKind: reviewedPlan.source_kind,
      generationSourceKind: reviewedGeneration.sourceKind,
      sourceStatus: reviewedGeneration.sourceStatus,
    });

    if (!supportedReviewedDraft.ok) {
      return {
        ok: false,
        status: "blocked",
        reason: "invalid_draft",
        message: supportedReviewedDraft.message,
      };
    }

    const review = buildStructuredFirstPlanDraftReview(
      parsed.request.draft.input,
      reviewedPlan,
      rebuiltAuthoringInput,
    );
    const applyResult = await createFirstPlanFromReviewedCanonicalPlanForUser(
      userId,
      reviewedPlan,
      profilePatch,
      buildPlanScopedStructuredAuthoringMetadata({
        source: supportedReviewedDraft.snapshotSource,
        authoringInput: rebuiltAuthoringInput,
        goalStyle: parsed.request.draft.input.goal.goalStyle,
        targetTime:
          parsed.request.draft.input.goal.goalStyle === "target_time"
            ? (parsed.request.draft.input.goal.targetTime ?? null)
            : null,
        metricPolicySummary:
          parsed.request.draft.generation.metricPolicySummary ?? review.planShape.metricPolicy,
        reviewAssumptions:
          parsed.request.draft.generation.reviewAssumptions.length > 0
            ? parsed.request.draft.generation.reviewAssumptions
            : review.assumptions,
      }),
    );

    return {
      ...applyResult,
      status: "created",
      schemaVersion: reviewedPlan.schema_version,
      sourceKind: reviewedPlan.source_kind,
      onboardingContract: "structured_first_plan_onboarding_v1",
      safety: {
        requiresExplicitApply: false,
        doesNotMutatePlan: false,
        rawInputPersisted: false,
      },
    };
  } catch {
    return {
      ok: false,
      status: "blocked",
      reason: "invalid_draft",
      message:
        "This structured draft is no longer valid. Generate a fresh review before creating a plan.",
    };
  }
}

function parseStructuredFirstPlanDraftInput(input: unknown):
  | {
      ok: true;
      input: StructuredFirstPlanOnboardingInput;
    }
  | {
      ok: false;
      result: StructuredFirstPlanCorrectionRequired;
    } {
  const result = structuredFirstPlanOnboardingInputSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      result: buildStructuredCorrectionResult(result.error),
    };
  }

  return {
    ok: true,
    input: normalizeSupportedStructuredFirstPlanOnboardingInput(result.data),
  };
}

function parseStructuredFirstPlanConfirmRequest(input: unknown):
  | {
      ok: true;
      request: z.output<typeof structuredFirstPlanConfirmRequestSchema>;
    }
  | {
      ok: false;
      message: string;
    } {
  const result = structuredFirstPlanConfirmRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      message: "This structured draft is missing required review data. Generate a fresh review.",
    };
  }

  return {
    ok: true,
    request: result.data,
  };
}

function buildStructuredCorrectionResult(error: unknown): StructuredFirstPlanCorrectionRequired {
  return {
    ok: true,
    status: "correction_required",
    sourceKind: "structured_constructor",
    reason: "invalid_structured_input",
    correction: {
      message: mapStructuredFirstPlanOnboardingError(error),
      fields: collectStructuredCorrectionFields(error),
    },
    safety: buildStructuredDraftSafety(),
  };
}

async function generateFirstPlanStructuredDraft(
  authoringInput: StructuredFirstPlanAuthoringInput,
  aiPreviewOptions: NonNullable<
    ReturnType<typeof resolveStructuredFirstPlanAiPreviewConfig>["options"]
  >,
): Promise<
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      generation: StructuredFirstPlanDraftGenerationMetadata;
    }
  | {
      ok: false;
      result: Extract<StructuredFirstPlanDraftResult, { ok: false }>;
    }
> {
  const { generateAiFirstPlanDraftPreview } = await import("@/lib/ai-first-plan-draft-service");
  const result = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    ...(aiPreviewOptions ?? {}),
  });

  if (!result.ok) {
    return {
      ok: false,
      result: buildStructuredAiDraftUnavailableResult(result),
    };
  }

  const supportedSource = resolveSupportedStructuredFirstPlanDraftSource({
    sourceKind: result.canonicalPlan.source_kind,
    generationSourceKind: result.canonicalPlan.source_kind,
    sourceStatus: result.metadata.status,
  });

  if (!supportedSource.ok) {
    return {
      ok: false,
      result: buildStructuredAiDraftUnavailableResult({
        ok: false,
        reason: "ai_authored_plan_first_unavailable",
        message: "We could not create a safe AI-authored plan draft. Please retry.",
        issues: ["AI first-plan generation returned an unsupported source boundary."],
        authoringInput,
        metadata: {
          sourceKind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
          sourceStatus: "plan_first_unavailable",
          unavailableReason: "unsupported_source_boundary",
          model: result.metadata.model,
          responseId: result.metadata.responseId,
          elapsedMs: result.metadata.elapsedMs,
          validationIssues: ["AI first-plan generation returned an unsupported source boundary."],
          validationIssueCount: 1,
          debug: result.metadata.debug,
        },
      }),
    };
  }

  return {
    ok: true,
    canonicalPlan: result.canonicalPlan,
    generation: buildStructuredDraftGenerationMetadata(result.metadata, result.canonicalPlan),
  };
}

function resolveStructuredFirstPlanAiPreviewConfig(
  overrides: GenerateStructuredFirstPlanDraftOptions["aiPreview"] = {},
) {
  const defaults = {
    model: serverEnv.openAiFirstPlanModel ?? DEFAULT_STRUCTURED_FIRST_PLAN_MODEL,
    timeoutMs: PRODUCT_FIRST_PLAN_TIMEOUT_MS,
    maxOutputTokens: positiveIntegerEnv(
      serverEnv.openAiFirstPlanMaxOutputTokens,
      DEFAULT_STRUCTURED_FIRST_PLAN_MAX_OUTPUT_TOKENS,
    ),
  };
  const options = { ...defaults, ...(overrides ?? {}) };

  return {
    options,
    summary: {
      contractMode: "plan_first",
      model: typeof options.model === "string" ? options.model : null,
      timeoutMs: typeof options.timeoutMs === "number" ? options.timeoutMs : null,
      maxOutputTokens: typeof options.maxOutputTokens === "number" ? options.maxOutputTokens : null,
      explicitOptionKeys: Object.keys(overrides ?? {}).sort(),
      envSource: {
        openAiFirstPlanModel: serverEnv.openAiFirstPlanModel ? "env" : "default",
        openAiFirstPlanMaxOutputTokens: serverEnv.openAiFirstPlanMaxOutputTokens
          ? "env"
          : "default",
        genericOpenAiPlanModelConfigured: Boolean(serverEnv.openAiPlanModel),
      },
    } satisfies StructuredFirstPlanAiPreviewDebugSummary,
  };
}

function positiveIntegerEnv(value: string | null, defaultValue: number) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

function resolveSupportedStructuredFirstPlanDraftSource({
  sourceKind,
  generationSourceKind,
  sourceStatus,
}: {
  sourceKind: string | undefined;
  generationSourceKind: string;
  sourceStatus: StructuredFirstPlanDraftGenerationMetadata["sourceStatus"];
}):
  | {
      ok: true;
      snapshotSource: "ai_authored_plan_first";
    }
  | {
      ok: false;
      message: string;
    } {
  if (
    sourceKind === AI_AUTHORED_PLAN_FIRST_SOURCE_KIND &&
    generationSourceKind === AI_AUTHORED_PLAN_FIRST_SOURCE_KIND &&
    sourceStatus === "ai_authored"
  ) {
    return {
      ok: true,
      snapshotSource: "ai_authored_plan_first",
    };
  }

  return {
    ok: false,
    message:
      "This structured draft was not created by a supported AI first-plan path. Generate a fresh review before creating a plan.",
  };
}

function buildStructuredDraftGenerationMetadata(
  metadata: AiFirstPlanDraftPreviewMetadata,
  canonicalPlan: TrainingPlanV2,
): StructuredFirstPlanDraftGenerationMetadata {
  return structuredFirstPlanDraftGenerationMetadataSchema.parse({
    sourceStatus: metadata.status,
    sourceKind: canonicalPlan.source_kind ?? AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
    validationIssues: metadata.validationIssues.slice(0, 12),
    validationIssueCount: metadata.validationIssueCount,
    reviewAssumptions: metadata.reviewAssumptions.slice(0, 8),
    metricPolicySummary: metadata.metricPolicySummary || null,
    model: metadata.model || null,
    responseId: metadata.responseId,
    elapsedMs: metadata.elapsedMs,
    debug: sanitizeStructuredDraftGenerationDebug(metadata.debug),
  });
}

function buildStructuredAiDraftUnavailableResult(result: {
  issues: string[];
  message?: string;
  reason: "ai_authored_plan_first_unavailable" | string;
  metadata?: AiFirstPlanDraftUnavailableMetadata;
}): Extract<StructuredFirstPlanDraftResult, { ok: false }> {
  const validationIssues = (result.metadata?.validationIssues ?? result.issues)
    .map((issue) => issue.trim())
    .filter(Boolean)
    .slice(0, 12);

  const sourceKind = result.metadata?.sourceKind ?? AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;

  return {
    ok: false,
    status: "draft_failed",
    reason: "ai_authored_plan_first_unavailable",
    code: "ai_authored_plan_first_unavailable",
    message: result.message ?? "We could not create a safe AI-authored plan draft. Please retry.",
    generation: {
      sourceKind,
      sourceStatus: "plan_first_unavailable",
      unavailableReason: result.metadata?.unavailableReason ?? result.reason,
      validationIssues,
      validationIssueCount: result.metadata?.validationIssueCount ?? validationIssues.length,
      model: result.metadata?.model ?? null,
      responseId: result.metadata?.responseId ?? null,
      elapsedMs: result.metadata?.elapsedMs ?? null,
      debug: result.metadata?.debug
        ? sanitizeStructuredDraftGenerationDebug(result.metadata.debug)
        : null,
    },
    safety: buildStructuredDraftSafety(),
  };
}

function classifyStructuredDraftFailureLayer(
  result: Extract<StructuredFirstPlanDraftResult, { ok: false }>,
) {
  const unavailableReason = result.generation.unavailableReason;
  const requestPhase = result.generation.debug?.requestPhase ?? null;

  if (unavailableReason.includes("timed_out") || requestPhase === "timeout_before_response") {
    return "openai_timeout";
  }

  if (unavailableReason.includes("cancelled") || requestPhase === "request_cancelled") {
    return "openai_cancelled";
  }

  if (unavailableReason.includes("incomplete") || requestPhase === "response_incomplete") {
    return "openai_incomplete";
  }

  if (unavailableReason.includes("schema") || unavailableReason.includes("non_json")) {
    return "openai_schema";
  }

  if (unavailableReason.includes("request_failed")) {
    return "openai_request";
  }

  if (unavailableReason.includes("not_configured")) {
    return "service_unavailable";
  }

  if (requestPhase === "rejected_after_validation") {
    return "plan_first_validation";
  }

  return "action_result_mapping";
}

async function writeStructuredFirstPlanActionDebugArtifact(
  context: StructuredFirstPlanActionDebugContext,
) {
  if (!shouldWriteStructuredFirstPlanActionDebugArtifact()) {
    return;
  }

  try {
    const fsModule = "node:fs/promises";
    const pathModule = "node:path";
    const { mkdir, writeFile } = (await import(
      /* @vite-ignore */ fsModule
    )) as typeof import("node:fs/promises");
    const { join } = (await import(/* @vite-ignore */ pathModule)) as typeof import("node:path");
    const processLike = getProcessLike();
    const cwd = processLike?.cwd?.() ?? ".";
    const timestamp = new Date().toISOString();
    const date = timestamp.slice(0, 10);
    const userHash = await digestSha256Hex(context.userId);
    const resultSummary = summarizeStructuredFirstPlanActionResult(context.result);
    const artifactDir = join(
      cwd,
      "qa-artifacts",
      "debug",
      date,
      "structured-onboarding-browser-action",
    );
    const artifactPath = join(
      artifactDir,
      `${timestamp.replace(/[:.]/g, "-")}-${context.actionPathName}-${resultSummary.status}-${userHash.slice(0, 12)}.json`,
    );
    const artifact = {
      timestamp,
      actionPathName: context.actionPathName,
      artifactKind: "structured_onboarding_browser_action_trace_v1",
      user: {
        userIdHash: userHash,
        userIdSuffix: context.userId.slice(-8),
      },
      runtime: {
        nodeEnv: processLike?.env?.NODE_ENV ?? null,
        vercelEnv: processLike?.env?.VERCEL_ENV ?? null,
      },
      frontendRequestPayload: summarizeStructuredFirstPlanRequestPayload(context.rawInput),
      parsedStructuredSetupRequest: context.parsedInput
        ? summarizeStructuredFirstPlanSetup(context.parsedInput)
        : null,
      derivedAuthoringInputSummary: context.authoringInput
        ? summarizeStructuredFirstPlanAuthoringInput(context.authoringInput)
        : null,
      effectiveServiceOptions: context.serviceOptions,
      result: resultSummary,
      failure: {
        layer: context.errorLayer,
        category: context.errorLayer,
        openAiReturnedBeforeFailure: didOpenAiReturnBeforeStructuredResult(context.result),
      },
      comparisonKeys: {
        setupSummaryHash: await digestSha256Hex(
          stableJsonStringify(
            context.parsedInput ? summarizeStructuredFirstPlanSetup(context.parsedInput) : null,
          ),
        ),
        authoringSummaryHash: await digestSha256Hex(
          stableJsonStringify(
            context.authoringInput
              ? summarizeStructuredFirstPlanAuthoringInput(context.authoringInput)
              : null,
          ),
        ),
      },
    };

    await mkdir(artifactDir, { recursive: true });
    await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  } catch (error) {
    console.warn("Could not write structured onboarding debug artifact.", error);
  }
}

function shouldWriteStructuredFirstPlanActionDebugArtifact() {
  const processLike = getProcessLike();
  const env = processLike?.env ?? {};

  if (env.HITO_STRUCTURED_ONBOARDING_DEBUG === "0") {
    return false;
  }

  return (
    env.HITO_STRUCTURED_ONBOARDING_DEBUG === "1" ||
    env.NODE_ENV === "development" ||
    env.VERCEL_ENV === "development" ||
    env.VERCEL_ENV === "preview"
  );
}

function getProcessLike():
  | {
      env?: Record<string, string | undefined>;
      cwd?: () => string;
    }
  | undefined {
  return (
    globalThis as typeof globalThis & {
      process?: {
        env?: Record<string, string | undefined>;
        cwd?: () => string;
      };
    }
  ).process;
}

function summarizeStructuredFirstPlanRequestPayload(input: unknown) {
  if (!input || typeof input !== "object") {
    return {
      type: typeof input,
      keys: [],
    };
  }

  return {
    type: "object",
    keys: Object.keys(input).sort(),
    shapeHashSafe: true,
  };
}

function summarizeStructuredFirstPlanSetup(input: StructuredFirstPlanOnboardingInput) {
  return {
    profile: {
      age: input.profile.age,
      heightCm: input.profile.heightCm,
      weightKg: input.profile.weightKg,
    },
    availability: {
      fixedRestDays: input.availability.fixedRestDays,
      runningDaysPerWeek: input.availability.runningDaysPerWeek,
      preferredLongRunDay: input.availability.preferredLongRunDay ?? null,
    },
    benchmark: summarizeStructuredBenchmark(input.benchmark),
    execution: input.execution,
    goal: {
      goalDistance: input.goal.goalDistance,
      goalStyle: input.goal.goalStyle,
      terrainFocus: "terrainFocus" in input.goal ? input.goal.terrainFocus : null,
      targetTimePresent: "targetTime" in input.goal ? Boolean(input.goal.targetTime) : false,
      targetDatePresent: "targetDate" in input.goal ? Boolean(input.goal.targetDate) : false,
      targetDate: input.goal.targetDate ?? null,
    },
    schedule: {
      startDate: input.schedule?.startDate ?? null,
      targetDate: input.schedule?.targetDate ?? null,
      targetDatePresent: Boolean(input.schedule?.targetDate ?? input.goal.targetDate),
    },
    strengthPreference: input.strength?.preference ?? null,
    comment: {
      present: Boolean(input.comment?.trim()),
      chars: input.comment?.trim().length ?? 0,
    },
  };
}

function summarizeStructuredBenchmark(benchmark: StructuredFirstPlanOnboardingInput["benchmark"]) {
  if ("fitnessLevel" in benchmark) {
    return {
      kind: benchmark.kind,
      fitnessLevel: benchmark.fitnessLevel,
      recent5kTimePresent: false,
      recent5kPacePresent: false,
    };
  }

  return {
    kind: benchmark.kind,
    recent5kTimePresent: "recent5kTime" in benchmark && Boolean(benchmark.recent5kTime),
    recent5kPacePresent: "recent5kPace" in benchmark && Boolean(benchmark.recent5kPace),
  };
}

function summarizeStructuredFirstPlanAuthoringInput(
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  return {
    goal: {
      goalType: authoringInput.goal.goalType,
      goalLabel: authoringInput.goal.goalLabel,
      goalStyle: authoringInput.goal.goalStyle,
      targetTimePresent: Boolean(authoringInput.goal.targetTime),
    },
    planGoalIntent: authoringInput.planGoalIntent ?? null,
    schedule: {
      startDate: authoringInput.schedule.startDate,
      targetDate: authoringInput.schedule.targetDate ?? null,
      preparationHorizonWeeks: authoringInput.schedule.preparationHorizonWeeks ?? null,
    },
    availability: {
      preferredRunningDays: authoringInput.availability.preferredRunningDays,
      unavailableDays: authoringInput.availability.unavailableDays,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
      allowBackToBackDays: authoringInput.availability.allowBackToBackDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
    },
    runnerProfile: {
      age: authoringInput.runnerProfile.age,
      experienceLevel: authoringInput.runnerProfile.experienceLevel,
      baselineSessionsPerWeek: authoringInput.runnerProfile.baselineSessionsPerWeek ?? null,
      baselineLongRunDurationMin: authoringInput.runnerProfile.baselineLongRunDurationMin ?? null,
    },
    currentLevel: {
      hasRecentResultSummary: Boolean(authoringInput.currentLevel.recentResultSummary),
      recentRaceResultCount: authoringInput.currentLevel.recentRaceResults.length,
      hasRecent5kPace: authoringInput.currentLevel.recent5kPaceSecondsPerKm != null,
      hasCurrentTrainingLoadSummary: Boolean(
        authoringInput.currentLevel.currentTrainingLoadSummary,
      ),
    },
    execution: authoringInput.execution,
    preferences: {
      terrainFocus: authoringInput.preferences.terrainFocus ?? null,
      preferredWorkoutMix: authoringInput.preferences.preferredWorkoutMix ?? null,
      strengthOrMobilityInterest: authoringInput.preferences.strengthOrMobilityInterest ?? null,
      notes: {
        present: Boolean(authoringInput.preferences.notes?.trim()),
        chars: authoringInput.preferences.notes?.trim().length ?? 0,
      },
    },
  };
}

function summarizeStructuredFirstPlanActionResult(result: StructuredFirstPlanDraftResult) {
  if (result.ok && result.status === "draft_ready") {
    return {
      ok: true,
      status: result.status,
      sourceKind: result.generation.sourceKind,
      sourceStatus: result.generation.sourceStatus,
      validationIssueCount: result.generation.validationIssueCount,
      validationIssues: result.generation.validationIssues,
      model: result.generation.model,
      elapsedMs: result.generation.elapsedMs,
      workoutCount: result.draft.canonicalPlan.planned_workouts.length,
      debug: result.generation.debug,
    };
  }

  if (result.ok && result.status === "correction_required") {
    return {
      ok: true,
      status: result.status,
      reason: result.reason,
      fields: result.correction.fields,
      message: result.correction.message,
    };
  }

  return {
    ok: false,
    status: result.status,
    reason: result.reason,
    code: result.code,
    message: result.message,
    sourceKind: result.generation.sourceKind,
    sourceStatus: result.generation.sourceStatus,
    unavailableReason: result.generation.unavailableReason,
    validationIssueCount: result.generation.validationIssueCount,
    validationIssues: result.generation.validationIssues,
    model: result.generation.model,
    elapsedMs: result.generation.elapsedMs,
    debug: result.generation.debug,
  };
}

function didOpenAiReturnBeforeStructuredResult(result: StructuredFirstPlanDraftResult) {
  const debug =
    result.ok && result.status === "draft_ready"
      ? result.generation.debug
      : !result.ok
        ? result.generation.debug
        : null;
  const requestPhase = debug?.requestPhase ?? null;

  return requestPhase === "rejected_after_validation" || requestPhase === "normalized";
}

function sanitizeStructuredDraftGenerationDebug(
  debug: AiFirstPlanDraftDebugMetadata,
): z.output<typeof structuredFirstPlanDraftGenerationDebugSchema> {
  return structuredFirstPlanDraftGenerationDebugSchema.parse({
    timeoutMs: debug.timeoutMs,
    maxOutputTokens: debug.maxOutputTokens,
    contractMode: debug.contractMode,
    responseSchemaMode: debug.responseSchemaMode,
    requestPhase: debug.requestPhase,
    abortFired: debug.abortFired,
    openAiElapsedMs: debug.openAiElapsedMs,
    promptCharEstimate: debug.promptCharEstimate,
    responseStatus: debug.responseStatus,
    responseIncompleteReason: debug.responseIncompleteReason,
    inputTokens: debug.inputTokens,
    outputTokens: debug.outputTokens,
    totalTokens: debug.totalTokens,
    outputTextChars: debug.outputTextChars,
    reasoningEffortSent: debug.reasoningEffortSent,
  });
}

function collectStructuredCorrectionFields(error: unknown) {
  if (!(error instanceof z.ZodError)) {
    return [];
  }

  return Array.from(new Set(error.issues.map((issue) => issue.path.join(".")).filter(Boolean)));
}

function buildStructuredDraftSafety(): StructuredFirstPlanDraftSafety {
  return {
    requiresExplicitApply: true,
    doesNotMutatePlan: true,
    rawInputPersisted: false,
    usesCanonicalStructuredAuthoring: true,
  };
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function signStructuredFirstPlanDraft(
  draft: z.output<typeof structuredFirstPlanDraftPayloadSchema>,
) {
  const secret = serverEnv.supabaseServiceRoleKey ?? serverEnv.openAiApiKey;

  return signStableJsonPayload({ ...draft, draftToken: "" }, secret);
}

async function isStructuredFirstPlanDraftSignatureValid(
  draft: z.output<typeof structuredFirstPlanDraftPayloadSchema>,
) {
  const expected = await signStructuredFirstPlanDraft({ ...draft, draftToken: "" });

  return safeTokenEqual(draft.draftToken, expected);
}

async function hasActivePlanForUser(userId: string) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from("plan_cycles")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return Boolean(result.data);
}

function mapStructuredFirstPlanOnboardingError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (
    /running days per week|fixed rest days|available running day|allowed training day/i.test(
      message,
    )
  ) {
    return "Choose running days and fixed rest days that can fit together.";
  }

  if (
    /profile\.age|\bage\b|profile\.weightKg|\bweight\b|profile\.heightCm|\bheight\b/i.test(message)
  ) {
    return "Enter age, weight, and height within the supported ranges before creating the plan.";
  }

  if (/goalDistance|goal distance/i.test(message)) {
    return "Choose a supported goal distance.";
  }

  if (/target date|at least 7 days|calendar date/i.test(message)) {
    return "Choose a target date that is valid and at least 7 days from the plan start.";
  }

  if (/target time|recent 5k|pace|time like/i.test(message)) {
    return "Check the benchmark or target time format before creating the plan.";
  }

  if (/terrain/i.test(message)) {
    return "Choose a supported terrain focus: standard, rolling, or mountain.";
  }

  if (/Fixed rest-day|fixed rest day|blocked/i.test(message)) {
    return "This setup would place training on a fixed rest day. Adjust the rest days or running days and try again.";
  }

  return "We could not create a plan from these setup answers. Check the details and try again.";
}
