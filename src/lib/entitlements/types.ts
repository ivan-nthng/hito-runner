import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";

export type CapabilityKey = "ai_plan_update" | "garmin_ai_interpretation";

export type RunnerTier = "basic" | "pro";

export type RunnerEntitlementSource =
  | "prebilling_default_pro"
  | "manual_override"
  | "subscription"
  | "promo";

export interface RunnerEntitlement {
  userId: string;
  tier: RunnerTier;
  source: RunnerEntitlementSource;
  status: "active";
  isDefault: boolean;
}

export interface CapabilityUsageSummary {
  model: "metered_included";
  periodKey: "lifetime";
  used: number;
  limit: number;
  remaining: number;
}

export type CapabilityCheckResult =
  | {
      allowed: true;
      capabilityKey: CapabilityKey;
      tier: RunnerTier;
      source: RunnerEntitlementSource;
      usage: CapabilityUsageSummary | null;
    }
  | {
      allowed: false;
      reason: "capability_locked";
      capabilityKey: CapabilityKey;
      tier: RunnerTier;
      source: RunnerEntitlementSource;
      requiredTier: "pro";
      message: string;
      usage: CapabilityUsageSummary | null;
    };

export interface CapabilityLockedResponse {
  ok: false;
  reason: "capability_locked";
  capability: CapabilityKey;
  currentTier: RunnerTier;
  requiredTier: "pro";
  message: string;
  usage?: CapabilityUsageSummary;
}

export type EntitlementSupabaseClient = SupabaseClient<Database>;
