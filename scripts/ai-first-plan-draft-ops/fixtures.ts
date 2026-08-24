import { normalizePlanGoalIntent } from "../../src/lib/plan-creation-engine/plan-goal-intent";
import { buildAcceptedEffectiveRunnerHeartRateProfile } from "../../src/lib/heart-rate-zones";
import type { StructuredPlanAuthoringInput } from "../../src/lib/structured-plan-authoring-schema";
import { buildProofInitialPlanProfile } from "../runner-fitness-profile-initial-plan-proof-helpers";
import type { FixtureKind } from "./cli";

export function buildDefaultAuthoringInput(fixtureKind: FixtureKind): StructuredPlanAuthoringInput {
  const goalDistance = fixtureKind === "representative_half" ? "Half Marathon" : "10K";
  const targetDate = fixtureKind === "representative_half" ? "2026-11-15" : "2026-08-30";

  const planGoalIntent = normalizePlanGoalIntent({
    rawIntent: {
      distance: { kind: "preset", preset: goalDistance },
      targetDate,
    },
    startDate: "2026-07-06",
  });

  if (!planGoalIntent.ok) {
    throw new Error(planGoalIntent.message);
  }

  const heartRateProfile = buildAcceptedEffectiveRunnerHeartRateProfile({
    age: 36,
    storedProfile: {
      version: "runner_hr_profile_v2",
      source: "estimated",
    },
  });

  if (!heartRateProfile) {
    throw new Error("Representative plan-first fixture requires an accepted HR profile.");
  }

  const previewInput = {
    age: 36,
    heightCm: 178,
    weightKg: 72,
    runnerLevel: "runs_a_lot" as const,
    daysPerWeek: 4 as const,
    fixedRestDays: ["Wednesday", "Friday", "Sunday"] as const,
    preferredLongRunDay: "Saturday" as const,
    startDate: "2026-07-06",
    benchmark: {
      kind: "recent_5k" as const,
      minutes: 27,
      seconds: 30,
    },
    planGoalIntent: {
      distance: { kind: "preset" as const, preset: goalDistance },
      targetDate,
    },
  };
  const initialPlanProfile = buildProofInitialPlanProfile(previewInput).initialPlanProfile;

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
      heartRateProfile,
    },
    availability: {
      fixedRestDays: ["Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 4,
      preferredLongRunDay: "Saturday",
    },
    planGoalIntent: planGoalIntent.intent,
    initialPlanProfile,
    initialPlanAdmission: "authoring_ready_constraint_only",
  };
}
