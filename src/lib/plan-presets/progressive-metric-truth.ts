import { normalizeSupportedFirstPlanExecutionMode } from "@/lib/first-plan-authoring-utils";
import type { PlanPresetCardInput, PlanPresetMetricTruthSummary } from "@/lib/plan-presets/schema";

export function buildProgressiveMetricTruth(
  input: PlanPresetCardInput,
  {
    defaultEstimatedHrAvailable,
    hasBenchmarkTruth,
  }: { defaultEstimatedHrAvailable: boolean; hasBenchmarkTruth: boolean },
): PlanPresetMetricTruthSummary {
  const execution = normalizeSupportedFirstPlanExecutionMode(input.execution);
  const wantsPace =
    execution.guidancePreference === "pace" || execution.guidancePreference === "mixed";
  const paceTargetsAllowed = hasBenchmarkTruth && wantsPace;

  if (paceTargetsAllowed) {
    return {
      executableMode: "pace_executable",
      paceTargetsAllowed: true,
      paceTruthSource: "recent_5k",
      hrTargetsAllowed: false,
      hrTargetSource: "effort_only",
      defaultEstimatedHrAvailable,
      defaultEstimatedHrIsAdvisoryOnly: true,
      notes: [
        defaultEstimatedHrAvailable
          ? "Recent 5K truth can support broad pace targets; age-estimated HR stays advisory and is not a personal HR target."
          : "Recent 5K truth can support broad pace targets; personal HR targets require HR-zone truth.",
      ],
    };
  }

  return {
    executableMode: "structure_only_executable",
    paceTargetsAllowed: false,
    paceTruthSource: "none",
    hrTargetsAllowed: false,
    hrTargetSource: "effort_only",
    defaultEstimatedHrAvailable,
    defaultEstimatedHrIsAdvisoryOnly: true,
    notes: [
      defaultEstimatedHrAvailable
        ? "Preset workouts can be structure-only executable; no pace target is created without benchmark truth, and age-estimated HR is advisory only."
        : "Preset workouts can be structure-only executable; pace and HR targets require backend-supported metric truth.",
    ],
  };
}
