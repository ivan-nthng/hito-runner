import type { RunningPlanEngineSourceModel } from "@/lib/plan-creation-engine/source-types";

export const runnerLevels: RunningPlanEngineSourceModel["runnerLevels"] = {
  beginner_new_runner:
    "Very new or not yet durable; variety comes first from structure, strides, progression, and careful long-run growth.",
  sometimes_runs:
    "Some continuity but not highly stable; completion and repeatable development outrank ambition.",
  runs_a_lot:
    "Recreationally durable and supportable; one quality touch maximum with clearer distance-specific work.",
  professional_competitive:
    "Advanced profile signal, but this normal product path remains a conservative base unless a later advanced track exists.",
} as const;

export const builderInputContract: RunningPlanEngineSourceModel["builderInputContract"] = {
  requiredFields: [
    {
      field: "age",
      required: true,
      source: "runner_input",
      purpose: "Moderates ramp speed, cutbacks, and abrupt load jumps without medical inference.",
    },
    {
      field: "heightCm",
      required: true,
      source: "runner_input",
      purpose: "Contributes to neutral load context only; never creates body-shaming copy.",
    },
    {
      field: "weightKg",
      required: true,
      source: "runner_input",
      purpose: "Contributes to neutral load context only; never creates injury inference.",
    },
    {
      field: "runnerLevel",
      required: true,
      source: "runner_input",
      purpose: "Chooses conservative support level and intensity ceiling.",
    },
    {
      field: "distanceFamily",
      required: true,
      source: "runner_input",
      purpose: "Selects the supported endpoint family promise.",
    },
    {
      field: "startDate",
      required: true,
      source: "backend_default",
      purpose: "Anchors the non-mutating calendar preview before confirm.",
    },
  ],
  optionalFields: [
    {
      field: "daysPerWeek",
      required: false,
      source: "runner_input",
      purpose:
        "Controls support density, runway, and rest-day count; backend supplies a safe default.",
    },
    {
      field: "fixedRestDays",
      required: false,
      source: "runner_input",
      purpose: "Hard placement constraint for future builder rows.",
    },
    {
      field: "preferredLongRunDay",
      required: false,
      source: "runner_input",
      purpose: "Preferred long-run anchor when viable; backend corrects conflicts before review.",
    },
    {
      field: "benchmarkPaceTruth",
      required: false,
      source: "runner_input",
      purpose:
        "Optional recent 5K benchmark truth can unlock broad pace ranges; absence keeps the plan structure-only.",
    },
  ],
  backendDefaults: {
    daysPerWeek: 3,
    fixedRestDays: [],
    preferredLongRunDayFallback: "Sunday",
  },
  deliberatelyAbsentFields: [
    {
      field: "watchAccess",
      reason: "Supported normal plan creation assumes watch/app execution server-side.",
    },
    {
      field: "noWatchOrNoApp",
      reason: "No-watch/no-app is not a selectable normal plan path.",
    },
    {
      field: "targetTime",
      reason: "Target-time requests route to Advanced/custom and do not unlock pace truth.",
    },
    {
      field: "personalHrZones",
      reason: "Personal HR truth is not collected by this normal v1 path.",
    },
  ],
} as const;
