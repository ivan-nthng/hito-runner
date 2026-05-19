import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applyImportedPlanForUser } from "@/lib/active-plan-persistence";
import type { CapabilityLockedResponse } from "@/lib/entitlements/types";
import {
  buildStructuredFirstPlanAuthoringInput,
  buildStructuredFirstPlanProfilePatch,
  buildStructuredFirstPlanResultContext,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingInput,
} from "@/lib/structured-first-plan-onboarding";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { buildStructuredAuthoringPlan } from "@/lib/structured-plan-authoring";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import type { VoiceToPlanDraftResult } from "@/lib/voice-to-plan-authoring";

const voiceToPlanInputSchema = z.unknown();
const voiceToPlanConfirmInputSchema = z.unknown();

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
