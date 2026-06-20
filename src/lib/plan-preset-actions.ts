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

export const getPlanPresetCards = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => planPresetCardInputSchema.parse(value))
  .handler(async ({ data }): Promise<PlanPresetCardsActionResult> => {
    const userId = await requireNoActivePlanForPresetAction();

    if (!userId.ok) {
      return userId.result;
    }

    return resolvePlanPresetCards(data, { recommendationMode: "neutral" });
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
