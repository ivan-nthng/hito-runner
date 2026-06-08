import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createFirstPlanFromReviewedCanonicalPlanForUser,
  getActivePlan,
} from "@/lib/active-plan-persistence";
import { requireAuthenticatedUser } from "@/lib/backend/auth";
import { buildPlanPresetReviewDraftContract } from "@/lib/plan-presets/expand";
import { buildPlanPresetPersistenceMetadata } from "@/lib/plan-presets/persistence-metadata";
import { resolvePlanPresetCards } from "@/lib/plan-presets/resolver";
import {
  planPresetEligibilityInputSchema,
  type PlanPresetCardId,
  type PlanPresetEligibilityResult,
  type PlanPresetReviewDraftContract,
} from "@/lib/plan-presets/schema";
import {
  isPlanPresetReviewDraftSignatureValid,
  signPlanPresetReviewDraft,
} from "@/lib/plan-presets/review-token";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import { buildStructuredFirstPlanProfilePatch } from "@/lib/structured-first-plan-onboarding";

const planPresetCardIdSchema = z.enum(["10k", "half_marathon", "marathon"]);

const planPresetReviewInputSchema = z.object({
  cardId: planPresetCardIdSchema,
  input: planPresetEligibilityInputSchema,
});

const planPresetConfirmInputSchema = z.object({
  cardId: planPresetCardIdSchema,
  input: planPresetEligibilityInputSchema,
  reviewToken: z.string().trim().min(16),
  reviewChecksum: z.string().trim().min(16),
});

type PlanPresetActivePlanBlockedResult = {
  ok: false;
  status: "blocked";
  reason: "active_plan_exists";
  message: string;
};

export type PlanPresetCardsActionResult =
  | PlanPresetEligibilityResult
  | PlanPresetActivePlanBlockedResult;

export type PlanPresetReviewDraftActionResult =
  | {
      ok: true;
      status: "draft_ready";
      draft: PlanPresetReviewDraftContract;
      reviewToken: string;
      reviewChecksum: string;
    }
  | {
      ok: false;
      status: "blocked";
      reason: "active_plan_exists" | "draft_unavailable";
      message: string;
    };

export type PlanPresetConfirmActionResult =
  | {
      ok: true;
      status: "created";
      sourceKind: "plan_preset_v1";
      sourceStatus: "preset_recipe_expanded";
      persisted: true;
      presetId: PlanPresetReviewDraftContract["presetId"];
      presetVersion: PlanPresetReviewDraftContract["presetVersion"];
      schemaVersion: PlanPresetReviewDraftContract["canonicalPlan"]["schema_version"];
      effectiveStartDate: string;
      appliedStartDate: string;
      normalizedFromStartDate: string | null;
      firstDayResolution: null;
      workoutCount: number;
      rowCounts: PlanPresetReviewDraftContract["reviewShape"]["rowCounts"];
      startDate: string;
      estimatedEndDate: string;
      safety: {
        requiresExplicitConfirm: false;
        reviewTokenAccepted: true;
        rebuiltServerSide: true;
        doesNotCallOpenAi: true;
      };
    }
  | {
      ok: false;
      status: "blocked";
      reason:
        | "active_plan_exists"
        | "duplicate_confirm"
        | "invalid_draft"
        | "apply_blocked"
        | "unsupported_preset"
        | "missing_or_invalid_review_token"
        | "persistence_failed";
      message: string;
    };

export const getPlanPresetCards = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => planPresetEligibilityInputSchema.parse(value))
  .handler(async ({ data }): Promise<PlanPresetCardsActionResult> => {
    const userId = await requireNoActivePlanForPresetAction();

    if (!userId.ok) {
      return userId.result;
    }

    return resolvePlanPresetCards(data);
  });

export const reviewPlanPresetDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => planPresetReviewInputSchema.parse(value))
  .handler(async ({ data }): Promise<PlanPresetReviewDraftActionResult> => {
    const userId = await requireNoActivePlanForPresetAction();

    if (!userId.ok) {
      return userId.result;
    }

    try {
      const draft = buildPlanPresetReviewDraftContract({
        cardId: data.cardId,
        input: data.input,
      });
      const signature = await signPlanPresetReviewDraft({
        cardId: data.cardId,
        input: data.input,
        draft,
      });

      return {
        ok: true,
        status: "draft_ready",
        draft,
        ...signature,
      };
    } catch (error) {
      return {
        ok: false,
        status: "blocked",
        reason: "draft_unavailable",
        message:
          error instanceof Error
            ? error.message
            : "This preset review is not available for the current setup.",
      };
    }
  });

export const confirmPlanPresetDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<PlanPresetConfirmActionResult> => {
    const parsed = parsePlanPresetConfirmRequest(data);

    if (!parsed.ok) {
      return parsed.result;
    }

    const auth = requireAuthenticatedUser();
    const persistedUserId = await getPersistedUserIdForAuthContext(auth);

    if (!persistedUserId) {
      throw new Error("Authentication is required for this action.");
    }

    let draft: PlanPresetReviewDraftContract;

    try {
      draft = buildPlanPresetReviewDraftContract({
        cardId: parsed.request.cardId,
        input: parsed.request.input,
      });
    } catch {
      return {
        ok: false,
        status: "blocked",
        reason: "unsupported_preset",
        message:
          "This plan preset can no longer be confirmed for the current setup. Review the preset again before creating a plan.",
      };
    }

    const signatureValid = await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: parsed.request.cardId,
        input: parsed.request.input,
        draft,
      },
      {
        reviewToken: parsed.request.reviewToken,
        reviewChecksum: parsed.request.reviewChecksum,
      },
    );

    if (!signatureValid) {
      return invalidPlanPresetReviewTokenResult();
    }

    const activePlan = await getActivePlan(persistedUserId);

    if (activePlan) {
      return buildPlanPresetActivePlanBlockedResult(activePlan.source_kind);
    }

    try {
      const applyResult = await createFirstPlanFromReviewedCanonicalPlanForUser(
        persistedUserId,
        draft.canonicalPlan,
        buildStructuredFirstPlanProfilePatch(parsed.request.input),
        buildPlanPresetPersistenceMetadata(draft),
      );

      return {
        ...applyResult,
        status: "created",
        sourceKind: draft.sourceKind,
        sourceStatus: draft.sourceStatus,
        persisted: true,
        presetId: draft.presetId,
        presetVersion: draft.presetVersion,
        schemaVersion: draft.canonicalPlan.schema_version,
        rowCounts: draft.reviewShape.rowCounts,
        startDate: draft.reviewShape.startDate,
        estimatedEndDate: draft.reviewShape.estimatedEndDate,
        safety: {
          requiresExplicitConfirm: false,
          reviewTokenAccepted: true,
          rebuiltServerSide: true,
          doesNotCallOpenAi: true,
        },
      };
    } catch (error) {
      return mapPlanPresetApplyError(error);
    }
  });

async function requireNoActivePlanForPresetAction(): Promise<
  | { ok: true; userId: string }
  | {
      ok: false;
      result: PlanPresetActivePlanBlockedResult;
    }
> {
  const auth = requireAuthenticatedUser();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  if (!persistedUserId) {
    throw new Error("Authentication is required for this action.");
  }

  const activePlan = await getActivePlan(persistedUserId);

  if (activePlan) {
    return {
      ok: false,
      result: {
        ok: false,
        status: "blocked",
        reason: "active_plan_exists",
        message:
          "Plan presets can create a new plan only when there is no active plan. Use Open plan to update or replace an existing plan.",
      },
    };
  }

  return { ok: true, userId: persistedUserId };
}

function parsePlanPresetConfirmRequest(
  value: unknown,
):
  | { ok: true; request: z.output<typeof planPresetConfirmInputSchema> }
  | { ok: false; result: Extract<PlanPresetConfirmActionResult, { ok: false }> } {
  const parsed = planPresetConfirmInputSchema.safeParse(value);

  if (parsed.success) {
    return { ok: true, request: parsed.data };
  }

  const paths = parsed.error.issues.map((issue) => String(issue.path[0] ?? ""));

  if (paths.includes("reviewToken") || paths.includes("reviewChecksum")) {
    return {
      ok: false,
      result: invalidPlanPresetReviewTokenResult(),
    };
  }

  if (paths.includes("cardId")) {
    return {
      ok: false,
      result: {
        ok: false,
        status: "blocked",
        reason: "unsupported_preset",
        message:
          "This plan preset is not supported. Choose an available preset and generate a fresh review.",
      },
    };
  }

  return {
    ok: false,
    result: {
      ok: false,
      status: "blocked",
      reason: "invalid_draft",
      message:
        "This plan preset review is no longer current. Generate a fresh review before creating a plan.",
    },
  };
}

function invalidPlanPresetReviewTokenResult(): Extract<
  PlanPresetConfirmActionResult,
  { ok: false; reason: "missing_or_invalid_review_token" }
> {
  return {
    ok: false,
    status: "blocked",
    reason: "missing_or_invalid_review_token",
    message:
      "This plan preset review is no longer current. Generate a fresh review before creating a plan.",
  };
}

function buildPlanPresetActivePlanBlockedResult(
  activePlanSourceKind: string | null,
): Extract<
  PlanPresetConfirmActionResult,
  { ok: false; reason: "active_plan_exists" | "duplicate_confirm" }
> {
  if (activePlanSourceKind === "plan_preset_v1") {
    return {
      ok: false,
      status: "blocked",
      reason: "duplicate_confirm",
      message:
        "This preset already created an active plan. Open the plan instead of confirming again.",
    };
  }

  return {
    ok: false,
    status: "blocked",
    reason: "active_plan_exists",
    message:
      "Plan presets can create a new plan only when there is no active plan. Use Open plan to update or replace an existing plan.",
  };
}

function mapPlanPresetApplyError(error: unknown): Extract<
  PlanPresetConfirmActionResult,
  {
    ok: false;
    reason: "active_plan_exists" | "duplicate_confirm" | "apply_blocked" | "persistence_failed";
  }
> {
  const message = error instanceof Error ? error.message : "";

  if (/duplicate|unique/i.test(message)) {
    return {
      ok: false,
      status: "blocked",
      reason: "duplicate_confirm",
      message:
        "This preset already created an active plan. Open the plan instead of confirming again.",
    };
  }

  if (/active plan/i.test(message)) {
    return {
      ok: false,
      status: "blocked",
      reason: "active_plan_exists",
      message:
        "Plan presets can create a new plan only when there is no active plan. Use Open plan to update or replace an existing plan.",
    };
  }

  if (/weekday|rest|invariant|reviewed|validation|cannot/i.test(message)) {
    return {
      ok: false,
      status: "blocked",
      reason: "apply_blocked",
      message:
        "This reviewed preset could not be safely applied. Generate a fresh review before creating a plan.",
    };
  }

  return {
    ok: false,
    status: "blocked",
    reason: "persistence_failed",
    message:
      "We could not create this preset plan safely. Please retry after generating a fresh review.",
  };
}
