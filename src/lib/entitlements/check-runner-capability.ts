import "@tanstack/react-start/server-only";

import { getCapabilityPolicy } from "@/lib/entitlements/capability-registry";
import { resolveRunnerEntitlement } from "@/lib/entitlements/resolve-runner-entitlement";
import type {
  CapabilityCheckResult,
  CapabilityKey,
  CapabilityLockedResponse,
  CapabilityUsageSummary,
  EntitlementSupabaseClient,
} from "@/lib/entitlements/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function checkRunnerCapability({
  userId,
  capabilityKey,
  supabase = createAdminSupabaseClient(),
}: {
  userId: string;
  capabilityKey: CapabilityKey;
  supabase?: EntitlementSupabaseClient;
}): Promise<CapabilityCheckResult> {
  const entitlement = await resolveRunnerEntitlement(userId, supabase);
  const policy = getCapabilityPolicy(capabilityKey);

  if (entitlement.tier === "pro") {
    return {
      allowed: true,
      capabilityKey,
      tier: entitlement.tier,
      source: entitlement.source,
      usage: null,
    };
  }

  if (policy.basic.model === "pro_only") {
    return {
      allowed: false,
      reason: "capability_locked",
      capabilityKey,
      tier: entitlement.tier,
      source: entitlement.source,
      requiredTier: "pro",
      message: buildCapabilityLockedMessage(capabilityKey),
      usage: null,
    };
  }

  const usage = await getMeteredUsage({
    userId,
    capabilityKey,
    periodKey: policy.basic.periodKey,
    limit: policy.basic.limit,
    supabase,
  });

  if (usage.remaining <= 0) {
    return {
      allowed: false,
      reason: "capability_locked",
      capabilityKey,
      tier: entitlement.tier,
      source: entitlement.source,
      requiredTier: "pro",
      message: buildCapabilityLockedMessage(capabilityKey),
      usage,
    };
  }

  return {
    allowed: true,
    capabilityKey,
    tier: entitlement.tier,
    source: entitlement.source,
    usage,
  };
}

export function capabilityLockedResponse(
  check: Extract<CapabilityCheckResult, { allowed: false }>,
): CapabilityLockedResponse {
  return {
    ok: false,
    reason: "capability_locked",
    capability: check.capabilityKey,
    currentTier: check.tier,
    requiredTier: check.requiredTier,
    message: check.message,
    ...(check.usage ? { usage: check.usage } : {}),
  };
}

async function getMeteredUsage({
  userId,
  capabilityKey,
  periodKey,
  limit,
  supabase,
}: {
  userId: string;
  capabilityKey: CapabilityKey;
  periodKey: "lifetime";
  limit: number;
  supabase: EntitlementSupabaseClient;
}): Promise<CapabilityUsageSummary> {
  const result = await supabase
    .from("runner_capability_usage")
    .select("used_count")
    .eq("user_id", userId)
    .eq("capability_key", capabilityKey)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Could not resolve capability usage: ${result.error.message}`);
  }

  const used = result.data?.used_count ?? 0;

  return {
    model: "metered_included",
    periodKey,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

function buildCapabilityLockedMessage(capabilityKey: CapabilityKey) {
  switch (capabilityKey) {
    case "garmin_ai_interpretation":
      return "Garmin upload and factual comparison are still available. AI interpretation is a Pro capability.";
  }
}
