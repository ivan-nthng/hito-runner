import { normalizePlanGoalIntent } from "../../src/lib/plan-creation-engine/plan-goal-intent";
import type { StructuredPlanAuthoringInput } from "../../src/lib/structured-plan-authoring-schema";
import type { FixtureKind } from "./cli";

export function buildDefaultAuthoringInput(fixtureKind: FixtureKind): StructuredPlanAuthoringInput {
  if (fixtureKind !== "representative_10k") {
    throw new Error(`Unsupported plan-first fixture: ${fixtureKind}`);
  }

  const planGoalIntent = normalizePlanGoalIntent({
    rawIntent: {
      distance: { kind: "preset", preset: "10K" },
    },
    startDate: "2026-07-06",
  });

  if (!planGoalIntent.ok) {
    throw new Error(planGoalIntent.message);
  }

  return {
    schedule: {
      startDate: "2026-07-06",
    },
    runnerFacts: {
      age: 36,
      heightCm: 178,
      weightKg: 72,
      selfReportedLevel: "runs_a_lot",
      benchmark: {
        kind: "recent_5k",
        source: "recent_5k_pace",
        paceSecondsPerKm: 330,
        label: "Recent 5K pace 5:30/km",
      },
    },
    availability: {
      fixedRestDays: ["Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 4,
      preferredLongRunDay: "Saturday",
    },
    planGoalIntent: planGoalIntent.intent,
  };
}
