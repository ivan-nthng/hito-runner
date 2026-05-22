import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applyImportedPlanForUser } from "@/lib/active-plan-persistence";
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
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import type { VoiceToPlanDraftResult } from "@/lib/voice-to-plan-authoring";

const structuredFirstPlanDraftInputSchema = z.unknown();
const structuredFirstPlanConfirmInputSchema = z.unknown();
const voiceToPlanInputSchema = z.unknown();
const voiceToPlanConfirmInputSchema = z.unknown();

const structuredFirstPlanDraftPayloadSchema = z
  .object({
    input: structuredFirstPlanOnboardingInputSchema,
    authoringInput: structuredPlanAuthoringInputSchema,
    canonicalPlan: importedPlanSchema,
    summary: z.unknown().optional(),
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
  sourceKind: "structured_constructor";
  review: StructuredFirstPlanDraftReview;
  draft: {
    input: StructuredFirstPlanOnboardingInput;
    authoringInput: StructuredFirstPlanAuthoringInput;
    canonicalPlan: TrainingPlanV2;
    summary: StructuredFirstPlanDraftSummary;
  };
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
): Promise<StructuredFirstPlanDraftResult> {
  void userId;

  const parsed = parseStructuredFirstPlanDraftInput(input);

  if (!parsed.ok) {
    return parsed.result;
  }

  try {
    const authoringInput = buildStructuredFirstPlanAuthoringInput(parsed.input);
    const canonicalPlan = buildStructuredAuthoringPlan(authoringInput);
    const summary = buildStructuredFirstPlanDraftSummary(canonicalPlan, authoringInput);

    return {
      ok: true,
      status: "draft_ready",
      sourceKind: "structured_constructor",
      review: buildStructuredFirstPlanDraftReview(parsed.input, canonicalPlan, authoringInput),
      draft: {
        input: parsed.input,
        authoringInput,
        canonicalPlan,
        summary,
      },
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

    const generatedPlan = buildStructuredAuthoringPlan(rebuiltAuthoringInput);

    if (!draftPlanStillMatches(parsed.request.draft.canonicalPlan, generatedPlan)) {
      return {
        ok: false,
        status: "blocked",
        reason: "invalid_draft",
        message:
          "This structured draft is no longer current. Generate a fresh review before creating a plan.",
      };
    }

    const profilePatch = buildStructuredFirstPlanProfilePatch(parsed.request.draft.input);
    const applyResult = await applyImportedPlanForUser(
      userId,
      generatedPlan,
      null,
      null,
      profilePatch,
    );

    if (!applyResult.ok) {
      return {
        ok: false,
        status: "blocked",
        reason: "apply_blocked",
        message: "This structured draft needs review before it can create a plan.",
      };
    }

    return {
      ...applyResult,
      status: "created",
      schemaVersion: generatedPlan.schema_version,
      sourceKind: generatedPlan.source_kind,
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
    const applyResult = await applyImportedPlanForUser(
      userId,
      generatedPlan,
      null,
      null,
      profilePatch,
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

function draftPlanStillMatches(reviewedPlan: TrainingPlanV2, generatedPlan: TrainingPlanV2) {
  return sameJson(planComparisonPayload(reviewedPlan), planComparisonPayload(generatedPlan));
}

function planComparisonPayload(plan: TrainingPlanV2) {
  return {
    schemaVersion: plan.schema_version,
    sourceKind: plan.source_kind,
    planName: plan.plan_name,
    startDate: plan.start_date,
    targetDate: plan.target_date ?? null,
    workoutCount: plan.planned_workouts.length,
    workouts: plan.planned_workouts.map((workout) => ({
      date: workout.date,
      workoutType: workout.workout_type,
      sourceWorkoutType: workout.source_workout_type ?? null,
      title: workout.title,
      summary: workout.summary,
      segments: workout.segments,
    })),
  };
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
