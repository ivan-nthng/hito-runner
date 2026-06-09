import { createServerFn } from "@tanstack/react-start";
import { getActivePlan } from "@/lib/active-plan-persistence";
import { requireAuthenticatedUser } from "@/lib/backend/auth";
import { resolvePlanPresetCards } from "@/lib/plan-presets/resolver";
import {
  planPresetCardInputSchema,
  type PlanPresetEligibilityResult,
} from "@/lib/plan-presets/schema";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";

type PlanPresetActivePlanBlockedResult = {
  ok: false;
  status: "blocked";
  reason: "active_plan_exists";
  message: string;
};

export type PlanPresetCardsActionResult =
  | PlanPresetEligibilityResult
  | PlanPresetActivePlanBlockedResult;

type PlanPresetPreviewOnlyBlockedResult = {
  ok: false;
  status: "blocked";
  reason: "preview_only";
  message: string;
};

export type PlanPresetReviewDraftActionResult = PlanPresetPreviewOnlyBlockedResult;
export type PlanPresetConfirmActionResult = PlanPresetPreviewOnlyBlockedResult;

export const getPlanPresetCards = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => planPresetCardInputSchema.parse(value))
  .handler(async ({ data }): Promise<PlanPresetCardsActionResult> => {
    const userId = await requireNoActivePlanForPresetAction();

    if (!userId.ok) {
      return userId.result;
    }

    return resolvePlanPresetCards(data, { recommendationMode: "neutral" });
  });

export const reviewPlanPresetDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async (): Promise<PlanPresetReviewDraftActionResult> => {
    return buildPlanPresetPreviewOnlyBlockedResult();
  });

export const confirmPlanPresetDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async (): Promise<PlanPresetConfirmActionResult> => {
    return buildPlanPresetPreviewOnlyBlockedResult();
  });

function buildPlanPresetPreviewOnlyBlockedResult(): PlanPresetPreviewOnlyBlockedResult {
  return {
    ok: false,
    status: "blocked",
    reason: "preview_only",
    message:
      "Plan presets are preview-only in this flow. Review the selected-plan preview; creating a plan from this legacy preset seam is not available.",
  };
}

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
