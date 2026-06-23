import { createServerFn } from "@tanstack/react-start";
import { requireAuthenticatedUser } from "@/lib/backend/auth";
import { resolvePlanPresetCards } from "@/lib/plan-presets/resolver";
import {
  planPresetCardInputSchema,
  type PlanPresetEligibilityResult,
} from "@/lib/plan-presets/schema";

type PlanPresetDiscoveryBlockedResult = {
  ok: false;
  status: "blocked";
  reason: "preset_discovery_unavailable";
  message: string;
};

export type PlanPresetCardsActionResult =
  | PlanPresetEligibilityResult
  | PlanPresetDiscoveryBlockedResult;

export const getPlanPresetCards = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => planPresetCardInputSchema.parse(value))
  .handler(async ({ data }): Promise<PlanPresetCardsActionResult> => {
    requireAuthenticatedUser();

    return resolvePlanPresetCards(data, { recommendationMode: "neutral" });
  });
