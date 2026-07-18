import type { CapabilityKey, RunnerTier } from "@/lib/entitlements/types";

export const CAPABILITY_KEYS = [
  "garmin_ai_interpretation",
] as const satisfies readonly CapabilityKey[];

export interface CapabilityPolicy {
  capabilityKey: CapabilityKey;
  basic:
    | {
        model: "metered_included";
        limit: number;
        periodKey: "lifetime";
      }
    | {
        model: "pro_only";
      };
  pro: {
    model: "unlimited";
  };
}

export const CAPABILITY_REGISTRY: Record<CapabilityKey, CapabilityPolicy> = {
  garmin_ai_interpretation: {
    capabilityKey: "garmin_ai_interpretation",
    basic: {
      model: "pro_only",
    },
    pro: {
      model: "unlimited",
    },
  },
};

export function getCapabilityPolicy(capabilityKey: CapabilityKey) {
  return CAPABILITY_REGISTRY[capabilityKey];
}

export function isRunnerTier(value: string): value is RunnerTier {
  return value === "basic" || value === "pro";
}
