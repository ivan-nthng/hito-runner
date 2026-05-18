import "@tanstack/react-start/server-only";

import { isRunnerTier } from "@/lib/entitlements/capability-registry";
import type {
  EntitlementSupabaseClient,
  RunnerEntitlement,
  RunnerEntitlementSource,
} from "@/lib/entitlements/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const DEFAULT_ENTITLEMENT_SOURCE = "prebilling_default_pro" satisfies RunnerEntitlementSource;

export async function resolveRunnerEntitlement(
  userId: string,
  supabase: EntitlementSupabaseClient = createAdminSupabaseClient(),
): Promise<RunnerEntitlement> {
  const result = await supabase
    .from("runner_entitlements")
    .select("user_id,tier,source,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Could not resolve runner entitlement: ${result.error.message}`);
  }

  if (
    result.data?.status === "active" &&
    isRunnerTier(result.data.tier) &&
    isRunnerEntitlementSource(result.data.source)
  ) {
    return {
      userId,
      tier: result.data.tier,
      source: result.data.source,
      status: "active",
      isDefault: false,
    };
  }

  return {
    userId,
    tier: "pro",
    source: DEFAULT_ENTITLEMENT_SOURCE,
    status: "active",
    isDefault: true,
  };
}

function isRunnerEntitlementSource(value: string): value is RunnerEntitlementSource {
  return (
    value === "prebilling_default_pro" ||
    value === "manual_override" ||
    value === "subscription" ||
    value === "promo"
  );
}
