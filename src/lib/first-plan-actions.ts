import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  applyImportedPlanForUser,
  createFirstPlanFromReviewedCanonicalPlanForUser,
} from "@/lib/active-plan-persistence";
import type {
  AiFirstPlanDraftDebugMetadata,
  AiFirstPlanDraftPreviewMetadata,
  GenerateAiFirstPlanDraftPreviewOptions,
} from "@/lib/ai-first-plan-draft-service";
import type { CapabilityLockedResponse } from "@/lib/entitlements/types";
import { importedPlanSchema, type TrainingPlanV2 } from "@/lib/imported-plan";
import {
  buildStructuredFirstPlanAuthoringInput,
  buildStructuredFirstPlanDraftReview,
  buildStructuredFirstPlanDraftSummary,
  buildStructuredFirstPlanProfilePatch,
  buildStructuredFirstPlanResultContext,
  parseStructuredFirstPlanOnboardingInput,
  structuredFirstPlanOnboardingInputSchema,
  type StructuredFirstPlanAuthoringInput,
  type StructuredFirstPlanDraftReview,
  type StructuredFirstPlanDraftSummary,
  type StructuredFirstPlanOnboardingInput,
} from "@/lib/structured-first-plan-onboarding";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "@/lib/structured-plan-authoring";
import { buildPlanScopedStructuredAuthoringMetadata } from "@/lib/plan-authoring-snapshot";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/supabase/env";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import type { VoiceToPlanDraftResult } from "@/lib/voice-to-plan-authoring";

const structuredFirstPlanDraftInputSchema = z.unknown();
const structuredFirstPlanConfirmInputSchema = z.unknown();
const voiceToPlanInputSchema = z.unknown();
const voiceToPlanConfirmInputSchema = z.unknown();

const structuredFirstPlanDraftGenerationDebugSchema = z
  .object({
    timeoutMs: z.number().int().nonnegative(),
    maxOutputTokens: z.number().int().positive(),
    contractMode: z.enum(["blueprint", "strict_draft"]),
    responseSchemaMode: z.enum([
      "responses_json_schema_blueprint_strict",
      "responses_json_schema_draft_strict",
    ]),
    requestPhase: z.enum([
      "not_started",
      "request_started",
      "response_parsed",
      "normalized",
      "fallback_after_validation",
      "request_failed",
      "timeout_before_response",
    ]),
    abortFired: z.boolean(),
    openAiElapsedMs: z.number().int().nonnegative().nullable(),
    promptCharEstimate: z.number().int().nonnegative().nullable(),
    reasoningEffortSent: z.boolean(),
  })
  .strict();

const structuredFirstPlanBlueprintTraceWeekSchema = z
  .object({
    weekNumber: z.number().int().min(1).max(52),
    phase: z.string().trim().min(1).nullable().optional(),
    theme: z.string().trim().min(1).max(180).nullable().optional(),
    identities: z.array(z.string().trim().min(1).max(120)).max(7),
    families: z.array(z.string().trim().min(1).max(120)).max(7),
    icons: z.array(z.string().trim().min(1).max(120)).max(7),
    dates: z.array(z.string().trim().min(1).max(32)).max(7).optional(),
  })
  .strict();

const structuredFirstPlanBlueprintTraceSchema = z
  .object({
    sourceKind: z.string().trim().min(1).nullable(),
    sourceStatus: z.enum(["ai_authored", "repaired_ai_draft", "deterministic_fallback"]),
    fallbackReason: z.string().trim().min(1).nullable(),
    model: z.string().trim().min(1).nullable(),
    timeoutMs: z.number().int().nonnegative().nullable(),
    elapsedMs: z.number().int().nonnegative().nullable(),
    opsMode: z.string().trim().min(1).nullable().optional(),
    opsFixture: z.string().trim().min(1).nullable().optional(),
    requestSummary: z
      .object({
        goalFamily: z.string().trim().min(1).max(80),
        goalType: z.string().trim().min(1).max(80),
        goalStyle: z.string().trim().min(1).max(80).nullable(),
        goalDistance: z.string().trim().min(1).max(80),
        targetTimePresent: z.boolean(),
        targetDate: z.string().trim().min(1).nullable(),
        runningDaysPerWeek: z.number().int().min(1).max(7),
        fixedRestDays: z.array(z.string().trim().min(1).max(16)).max(7),
        preferredLongRunDay: z.string().trim().min(1).max(16).nullable(),
      })
      .strict(),
    requiredCadenceSlots: z
      .array(
        z
          .object({
            weekNumber: z.number().int().min(1).max(52),
            date: z.string().trim().min(1).max(32),
            weekday: z.string().trim().min(1).max(16),
            kind: z.string().trim().min(1).max(40),
            identityOptions: z.array(z.string().trim().min(1).max(120)).max(12),
            purpose: z.string().trim().min(1).max(180),
          })
          .strict(),
      )
      .max(52),
    authoredBlueprintWeeks: z.array(structuredFirstPlanBlueprintTraceWeekSchema).max(52),
    validationIssueCodes: z.array(z.string().trim().min(1).max(120)).max(24),
    validationIssueSummary: z.array(z.string().trim().min(1).max(220)).max(12),
    repairs: z.array(z.string().trim().min(1).max(220)).max(12),
    normalizedCanonicalWeeks: z.array(structuredFirstPlanBlueprintTraceWeekSchema).max(52),
    deterministicFallbackBoundary: z
      .object({
        used: z.boolean(),
        reason: z.string().trim().min(1).nullable(),
      })
      .strict(),
    finalReviewedPlanIdentityCounts: z.record(z.string(), z.number().int().nonnegative()),
    finalReviewedPlanFamilyCounts: z.record(z.string(), z.number().int().nonnegative()),
    finalReviewedPlanIconCounts: z.record(z.string(), z.number().int().nonnegative()),
    persistedIdentityCounts: z.record(z.string(), z.number().int().nonnegative()).nullable(),
  })
  .strict();

const structuredFirstPlanDraftGenerationMetadataSchema = z
  .object({
    sourceStatus: z.enum(["ai_authored", "repaired_ai_draft", "deterministic_fallback"]),
    sourceKind: z.string().trim().min(1),
    fallbackReason: z.string().trim().min(1).nullable(),
    repairs: z.array(z.string().trim().min(1)).max(12),
    validationIssues: z.array(z.string().trim().min(1)).max(12),
    validationIssueCount: z.number().int().min(0),
    reviewAssumptions: z.array(z.string().trim().min(1)).max(8),
    metricPolicySummary: z.string().trim().min(1).max(360).nullable(),
    model: z.string().trim().min(1).nullable(),
    responseId: z.string().trim().min(1).nullable(),
    elapsedMs: z.number().int().nonnegative().nullable(),
    debug: structuredFirstPlanDraftGenerationDebugSchema.nullable(),
    blueprintTrace: structuredFirstPlanBlueprintTraceSchema.nullable().optional(),
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
      reason: "generation_failed";
      message: string;
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

export interface GenerateStructuredFirstPlanDraftOptions {
  aiPreview?: Pick<
    GenerateAiFirstPlanDraftPreviewOptions,
    | "apiKey"
    | "model"
    | "timeoutMs"
    | "maxOutputTokens"
    | "fetchImpl"
    | "referenceExample"
    | "today"
  >;
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

export type ConfirmVoiceToPlanDraftResult =
  | CapabilityLockedResponse
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
      onboardingContract: "voice_to_plan_v1";
      safety: {
        requiresExplicitApply: false;
        doesNotMutatePlan: false;
        rawTranscriptPersisted: false;
      };
    }
  | {
      ok: false;
      status: "blocked";
      reason: "invalid_draft" | "active_plan_exists" | "apply_blocked";
      message: string;
    };

export const completeStructuredFirstPlanOnboarding = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => parseStructuredFirstPlanOnboardingInput(value))
  .handler(async ({ data }) => {
    const userId = await requirePersistedUserIdForCurrentRequest();

    return completeStructuredFirstPlanOnboardingForUser(userId, data);
  });

export const generateStructuredFirstPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => structuredFirstPlanDraftInputSchema.parse(value))
  .handler(async ({ data }): Promise<StructuredFirstPlanDraftResult> => {
    const userId = await requirePersistedUserIdForCurrentRequest();

    return generateStructuredFirstPlanDraftForUser(userId, data);
  });

export const confirmStructuredFirstPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => structuredFirstPlanConfirmInputSchema.parse(value))
  .handler(async ({ data }): Promise<ConfirmStructuredFirstPlanDraftResult> => {
    const userId = await requirePersistedUserIdForCurrentRequest();

    return confirmStructuredFirstPlanDraftForUser(userId, data);
  });

export const generateVoiceToPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => voiceToPlanInputSchema.parse(value))
  .handler(async ({ data }): Promise<VoiceToPlanDraftResult> => {
    const userId = await requirePersistedUserIdForCurrentRequest();
    const { generateVoiceToPlanDraftForUser } = await import("@/lib/voice-to-plan-authoring");

    return generateVoiceToPlanDraftForUser({
      userId,
      request: data,
    });
  });

export const confirmVoiceToPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => voiceToPlanConfirmInputSchema.parse(value))
  .handler(async ({ data }): Promise<ConfirmVoiceToPlanDraftResult> => {
    const userId = await requirePersistedUserIdForCurrentRequest();
    const { checkRunnerCapability, capabilityLockedResponse } =
      await import("@/lib/entitlements/check-runner-capability");
    const capabilityCheck = await checkRunnerCapability({
      userId,
      capabilityKey: "voice_to_plan",
    });

    if (!capabilityCheck.allowed) {
      return capabilityLockedResponse(capabilityCheck);
    }

    if (await hasActivePlanForUser(userId)) {
      return {
        ok: false,
        status: "blocked",
        reason: "active_plan_exists",
        message:
          "Voice-to-plan can create a first plan only when there is no active plan. Use Open plan to update or replace an existing plan.",
      };
    }

    const { parseVoiceToPlanConfirmRequest } = await import("@/lib/voice-to-plan-authoring");
    const parsed = parseVoiceToPlanConfirmRequest(data);

    if (!parsed.ok) {
      return {
        ok: false,
        status: "blocked",
        reason: parsed.reason,
        message: parsed.message,
      };
    }

    try {
      const applyResult = await applyImportedPlanForUser(
        userId,
        parsed.canonicalPlan,
        null,
        null,
        parsed.profilePatch,
        buildPlanScopedStructuredAuthoringMetadata({
          source: "voice_to_plan",
          authoringInput: parsed.authoringInput,
          goalStyle: parsed.request.supplement.goalStyle ?? null,
          targetTime: parsed.request.supplement.targetTime ?? null,
        }),
      );

      if (!applyResult.ok) {
        return {
          ok: false,
          status: "blocked",
          reason: "apply_blocked",
          message: "This voice draft needs review before it can create a plan.",
        };
      }

      return {
        ...applyResult,
        status: "created",
        schemaVersion: parsed.canonicalPlan.schema_version,
        sourceKind: parsed.canonicalPlan.source_kind,
        onboardingContract: "voice_to_plan_v1",
        safety: {
          requiresExplicitApply: false,
          doesNotMutatePlan: false,
          rawTranscriptPersisted: false,
        },
      };
    } catch {
      return {
        ok: false,
        status: "blocked",
        reason: "invalid_draft",
        message:
          "This voice draft is no longer valid. Generate a fresh review before creating a plan.",
      };
    }
  });

export async function generateStructuredFirstPlanDraftForUser(
  userId: string,
  input: unknown,
  options: GenerateStructuredFirstPlanDraftOptions = {},
): Promise<StructuredFirstPlanDraftResult> {
  void userId;

  const parsed = parseStructuredFirstPlanDraftInput(input);

  if (!parsed.ok) {
    return parsed.result;
  }

  try {
    const authoringInput = buildStructuredFirstPlanAuthoringInput(parsed.input);
    const aiDraft = await generateFirstPlanBlueprintDraft(authoringInput, options);
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

    return {
      ok: true,
      status: "draft_ready",
      sourceKind: generation.sourceKind,
      review: buildStructuredFirstPlanDraftReview(parsed.input, canonicalPlan, authoringInput),
      draft,
      generation,
      safety: buildStructuredDraftSafety(),
    };
  } catch (error) {
    return buildStructuredCorrectionResult(error);
  }
}

export async function confirmStructuredFirstPlanDraftForUser(
  userId: string,
  input: unknown,
): Promise<ConfirmStructuredFirstPlanDraftResult> {
  if (await hasActivePlanForUser(userId)) {
    return {
      ok: false,
      status: "blocked",
      reason: "active_plan_exists",
      message:
        "Structured setup can create a first plan only when there is no active plan. Use Open plan to update or replace an existing plan.",
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
        source:
          reviewedPlan.source_kind === "ai_first_plan_blueprint_v1"
            ? "ai_first_plan_blueprint"
            : "structured_first_plan",
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

export async function completeStructuredFirstPlanOnboardingForUser(
  userId: string,
  input: StructuredFirstPlanOnboardingInput,
) {
  try {
    const authoringInput = buildStructuredFirstPlanAuthoringInput(input);
    const generatedPlan = buildStructuredAuthoringPlan(authoringInput);
    const profilePatch = buildStructuredFirstPlanProfilePatch(input);
    const review = buildStructuredFirstPlanDraftReview(input, generatedPlan, authoringInput);
    const applyResult = await applyImportedPlanForUser(
      userId,
      generatedPlan,
      null,
      null,
      profilePatch,
      buildPlanScopedStructuredAuthoringMetadata({
        source: "structured_first_plan",
        authoringInput,
        goalStyle: input.goal.goalStyle,
        targetTime: input.goal.goalStyle === "target_time" ? (input.goal.targetTime ?? null) : null,
        metricPolicySummary: review.planShape.metricPolicy,
        reviewAssumptions: review.assumptions,
      }),
    );
    const generationContext = buildStructuredFirstPlanResultContext(input);

    return {
      ...applyResult,
      schemaVersion: generatedPlan.schema_version,
      sourceKind: generatedPlan.source_kind,
      workoutCount: generatedPlan.planned_workouts.length,
      onboardingContract: "structured_first_plan_onboarding_v1" as const,
      generationContext,
    };
  } catch (error) {
    throw new Error(mapStructuredFirstPlanOnboardingError(error));
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
    input: result.data,
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

async function generateFirstPlanBlueprintDraft(
  authoringInput: StructuredFirstPlanAuthoringInput,
  options: GenerateStructuredFirstPlanDraftOptions,
) {
  const { generateAiFirstPlanDraftPreview } = await import("@/lib/ai-first-plan-draft-service");
  const result = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    contractMode: "blueprint",
    ...(options.aiPreview ?? {}),
  });

  if (!result.ok) {
    const canonicalPlan = buildStructuredAuthoringPlan(authoringInput);

    return {
      canonicalPlan,
      generation: buildStructuredDraftGenerationMetadataFromFallback({
        sourceKind: canonicalPlan.source_kind ?? "structured_authoring_v1",
        fallbackReason: result.reason,
        validationIssues: result.issues,
      }),
    };
  }

  return {
    canonicalPlan: result.canonicalPlan,
    generation: buildStructuredDraftGenerationMetadata(result.metadata, result.canonicalPlan),
  };
}

function buildStructuredDraftGenerationMetadata(
  metadata: AiFirstPlanDraftPreviewMetadata,
  canonicalPlan: TrainingPlanV2,
): StructuredFirstPlanDraftGenerationMetadata {
  return structuredFirstPlanDraftGenerationMetadataSchema.parse({
    sourceStatus: metadata.status,
    sourceKind: canonicalPlan.source_kind ?? sourceKindFromGenerationSource(metadata.source),
    fallbackReason: metadata.fallbackReason,
    repairs: metadata.repairs.slice(0, 12),
    validationIssues: metadata.validationIssues.slice(0, 12),
    validationIssueCount: metadata.validationIssueCount,
    reviewAssumptions: metadata.reviewAssumptions.slice(0, 8),
    metricPolicySummary: metadata.metricPolicySummary || null,
    model: metadata.model || null,
    responseId: metadata.responseId,
    elapsedMs: metadata.elapsedMs,
    debug: sanitizeStructuredDraftGenerationDebug(metadata.debug),
    blueprintTrace: metadata.blueprintTrace ?? null,
  });
}

function buildStructuredDraftGenerationMetadataFromFallback({
  sourceKind,
  fallbackReason,
  validationIssues,
}: {
  sourceKind: string;
  fallbackReason: string;
  validationIssues: string[];
}): StructuredFirstPlanDraftGenerationMetadata {
  return structuredFirstPlanDraftGenerationMetadataSchema.parse({
    sourceStatus: "deterministic_fallback",
    sourceKind,
    fallbackReason,
    repairs: [],
    validationIssues: validationIssues.slice(0, 12),
    validationIssueCount: validationIssues.length,
    reviewAssumptions: [
      "Hito used the deterministic structured generator because AI first-plan drafting did not return a valid reviewed draft.",
    ],
    metricPolicySummary:
      "Deterministic fallback preserves existing pace, default-HR, fixed-rest-day, and effort-safety gates.",
    model: null,
    responseId: null,
    elapsedMs: null,
    debug: null,
    blueprintTrace: null,
  });
}

function sourceKindFromGenerationSource(source: AiFirstPlanDraftPreviewMetadata["source"]) {
  switch (source) {
    case "openai_ai_first_plan_blueprint":
      return "ai_first_plan_blueprint_v1";
    case "openai_ai_first_plan_draft":
      return "ai_first_plan_draft_v1";
    case "deterministic_structured_generator":
      return "structured_authoring_v1";
  }
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
  const payload = stableJsonStringify({ ...draft, draftToken: "" });
  const secret = serverEnv.supabaseServiceRoleKey ?? serverEnv.openAiApiKey;

  if (!secret) {
    return `sha256:${await digestSha256Hex(payload)}`;
  }

  return `hmac-sha256:${await hmacSha256Hex(secret, payload)}`;
}

async function isStructuredFirstPlanDraftSignatureValid(
  draft: z.output<typeof structuredFirstPlanDraftPayloadSchema>,
) {
  const expected = await signStructuredFirstPlanDraft({ ...draft, draftToken: "" });

  return safeTokenEqual(draft.draftToken, expected);
}

function safeTokenEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

async function digestSha256Hex(payload: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));

  return bytesToHex(digest);
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));

  return bytesToHex(signature);
}

function bytesToHex(value: ArrayBuffer) {
  return Array.from(new Uint8Array(value))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    );
  }

  return value;
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
