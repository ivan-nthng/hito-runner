import type { StructuredFirstPlanAuthoringInput } from "../../src/lib/structured-first-plan-onboarding";
import { normalizePlanGoalIntent } from "../../src/lib/plan-creation-engine/plan-goal-intent";
import type { FixtureKind } from "./cli";

export function buildDefaultAuthoringInput(
  fixtureKind: FixtureKind,
): StructuredFirstPlanAuthoringInput {
  if (fixtureKind !== "representative_10k") {
    throw new Error(`Unsupported plan-first fixture: ${fixtureKind}`);
  }

  const planGoalIntent = normalizePlanGoalIntent({
    rawIntent: {
      distance: { kind: "preset", preset: "10K" },
    },
    startDate: "2026-07-06",
    horizonWeeks: 4,
  });

  if (!planGoalIntent.ok) {
    throw new Error(planGoalIntent.message);
  }

  return {
    goal: {
      goalType: "distance_goal",
      goalLabel: "10K · Representative plan-first proof",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: null,
    },
    schedule: {
      startDate: "2026-07-06",
      targetDate: null,
      preparationHorizonWeeks: 4,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 4,
      baselineLongRunKm: 8,
      baselineLongRunDurationMin: null,
      age: 36,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K benchmark supports broad training guidance.",
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: 330,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Saturday"],
      unavailableDays: ["Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 4,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
    preferences: {
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Non-mutating representative 10K plan-first provider proof.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
    planGoalIntent: planGoalIntent.intent,
  };
}
