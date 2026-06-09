import type { RunningPlanEngineSourceModel } from "@/lib/plan-creation-engine/source-types";

export const metricAndHrPolicy: RunningPlanEngineSourceModel["metricAndHrPolicy"] = {
  watchAppExecutionAssumed: true,
  watchAccessInputRequired: false,
  noWatchSelectableNormalPath: false,
  userProvidedBenchmarkRequiredInNormalPath: false,
  targetTimeUnlocksPace: false,
  precisePaceAllowedInNormalPath: false,
  personalHrTruthRequiredForPersonalHrTargets: true,
  defaultHrZones: {
    mode: "editable_hito_default_hr_zones",
    labels: ["Hito default HR zones", "editable default zones", "not personal HR-zone truth"],
    personalTruth: false,
    allowedUses: [
      "conservative easy-day HR caps",
      "steady aerobic guardrails",
      "long-run HR ceilings in conservative contexts",
    ],
    forbiddenClaims: [
      "personal zones",
      "measured threshold truth",
      "individualized biometric certainty",
    ],
  },
} as const;
