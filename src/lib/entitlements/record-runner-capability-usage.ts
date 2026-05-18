import "@tanstack/react-start/server-only";

import { getCapabilityPolicy } from "@/lib/entitlements/capability-registry";
import { resolveRunnerEntitlement } from "@/lib/entitlements/resolve-runner-entitlement";
import type {
  CapabilityKey,
  CapabilityUsageSummary,
  EntitlementSupabaseClient,
} from "@/lib/entitlements/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function recordRunnerCapabilityUsage({
  userId,
  capabilityKey,
  periodKey = "lifetime",
  supabase = createAdminSupabaseClient(),
}: {
  userId: string;
  capabilityKey: CapabilityKey;
  periodKey?: "lifetime";
  supabase?: EntitlementSupabaseClient;
}): Promise<CapabilityUsageSummary | null> {
  const entitlement = await resolveRunnerEntitlement(userId, supabase);

  if (entitlement.tier !== "basic") {
    return null;
  }

  const policy = getCapabilityPolicy(capabilityKey);

  if (policy.basic.model !== "metered_included") {
    return null;
  }

  const currentResult = await supabase
    .from("runner_capability_usage")
    .select("used_count")
    .eq("user_id", userId)
    .eq("capability_key", capabilityKey)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (currentResult.error) {
    throw new Error(
      `Could not read capability usage before recording: ${currentResult.error.message}`,
    );
  }

  const nextUsedCount = (currentResult.data?.used_count ?? 0) + 1;
  const writeResult = currentResult.data
    ? await supabase
        .from("runner_capability_usage")
        .update({ used_count: nextUsedCount })
        .eq("user_id", userId)
        .eq("capability_key", capabilityKey)
        .eq("period_key", periodKey)
        .select("used_count")
        .single()
    : await supabase
        .from("runner_capability_usage")
        .insert({
          user_id: userId,
          capability_key: capabilityKey,
          period_key: periodKey,
          used_count: nextUsedCount,
        })
        .select("used_count")
        .single();

  if (writeResult.error) {
    throw new Error(`Could not record capability usage: ${writeResult.error.message}`);
  }

  const used = writeResult.data.used_count;

  return {
    model: "metered_included",
    periodKey,
    used,
    limit: policy.basic.limit,
    remaining: Math.max(0, policy.basic.limit - used),
  };
}
