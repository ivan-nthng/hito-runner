import type { StructuredFirstPlanAuthoringInput } from "../../src/lib/structured-first-plan-onboarding";
import type { FixtureKind } from "./cli";

export function buildDefaultAuthoringInput(fixtureKind: FixtureKind) {
  if (fixtureKind === "identity_coverage") {
    return buildIdentityCoverageAuthoringInput();
  }

  if (fixtureKind === "one_week_smoke") {
    return buildOneWeekSmokeAuthoringInput();
  }

  if (fixtureKind === "compact_smoke") {
    return buildCompactSmokeAuthoringInput();
  }

  if (fixtureKind === "balanced_half") {
    return buildBalancedHalfAuthoringInput();
  }

  if (fixtureKind === "marathon_balanced") {
    return buildMarathonBalancedAuthoringInput();
  }

  if (fixtureKind === "marathon_target_long") {
    return buildMarathonTargetLongAuthoringInput();
  }

  if (fixtureKind === "five_k_short") {
    return buildShortRoadPerformanceAuthoringInput("5k");
  }

  if (fixtureKind === "ten_k_short") {
    return buildShortRoadPerformanceAuthoringInput("10k");
  }

  if (fixtureKind === "ultra_trail") {
    return buildUltraTrailAuthoringInput();
  }

  if (fixtureKind === "mountain_trail") {
    return buildMountainTrailAuthoringInput();
  }

  return {
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon · Target time",
      goalStyle: "target_time",
      targetTime: "2:00:00",
      targetEventName: "Half marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: "2026-07-26",
      preparationHorizonWeeks: null,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 12,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
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
      notes: "Ops smoke fixture for AI-authored first-plan draft validation.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildShortRoadPerformanceAuthoringInput(goalType: "5k" | "10k") {
  const goalLabel = goalType === "5k" ? "5K · Balanced" : "10K · Balanced";

  return {
    goal: {
      goalType,
      goalLabel,
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: null,
    },
    schedule: {
      startDate: "2026-05-29",
      targetDate: null,
      preparationHorizonWeeks: 8,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 4,
      baselineLongRunKm: null,
      baselineLongRunDurationMin: 55,
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
      notes: "Short road-performance envelope fixture.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildUltraTrailAuthoringInput() {
  return {
    ...buildMountainTrailAuthoringInput(),
    goal: {
      goalType: "ultra_marathon",
      goalLabel: "Ultra · Trail durability",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: null,
    },
    preferences: {
      preferredWorkoutMix: "long_run_focus",
      terrainFocus: "mountain",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Ultra envelope fixture with time-on-feet durability.",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildMountainTrailAuthoringInput() {
  return {
    goal: {
      goalType: "mountain_running",
      goalLabel: "Mountain running · Balanced",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: null,
    },
    schedule: {
      startDate: "2026-05-29",
      targetDate: null,
      preparationHorizonWeeks: 10,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: null,
      baselineLongRunDurationMin: 75,
      age: 36,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "rpe",
    },
    currentLevel: {
      recentResultSummary: null,
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: null,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
    preferences: {
      preferredWorkoutMix: "balanced",
      terrainFocus: "mountain",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Mountain/trail envelope fixture with terrain control.",
    },
    execution: {
      watchAccess: "unknown",
      guidancePreference: "effort",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildMarathonTargetLongAuthoringInput() {
  return {
    goal: {
      goalType: "marathon",
      goalLabel: "Marathon · Target-time long horizon",
      goalStyle: "target_time",
      targetTime: "3:50:00",
      targetEventName: "Target marathon plan",
    },
    schedule: {
      startDate: "2026-05-29",
      targetDate: "2026-12-11",
      preparationHorizonWeeks: null,
    },
    runnerProfile: {
      experienceLevel: "new_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: null,
      baselineLongRunDurationMin: 60,
      age: 36,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: null,
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: null,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Sunday"],
      unavailableDays: ["Wednesday", "Saturday"],
      maxRunningDaysPerWeek: 5,
      allowBackToBackDays: false,
      preferredLongRunDay: "Sunday",
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
    preferences: {
      preferredWorkoutMix: "balanced",
      terrainFocus: "rolling",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes:
        "Long-horizon target-date fixture for bounded AI-authored blueprint plus backend extension.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildMarathonBalancedAuthoringInput() {
  return {
    goal: {
      goalType: "marathon",
      goalLabel: "Marathon · Balanced blueprint-only proof",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: "Balanced marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: "2026-07-26",
      preparationHorizonWeeks: 8,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 18,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary:
        "Currently running five days per week with a comfortable long run near 18 km.",
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
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
      notes: "Marathon balanced live proof fixture for blueprint-only first-plan creation.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildBalancedHalfAuthoringInput() {
  return {
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon · Balanced cadence smoke",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: "Balanced half marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: "2026-07-12",
      preparationHorizonWeeks: 6,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 11,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
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
      notes: "Balanced half-marathon live trace fixture for moderate early cadence validation.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildIdentityCoverageAuthoringInput() {
  return {
    goal: {
      goalType: "half_marathon",
      goalLabel: "Identity coverage · Coach sample",
      goalStyle: "target_time",
      targetTime: "2:00:00",
      targetEventName: "Identity coverage fixture",
    },
    schedule: {
      startDate: "2026-07-06",
      targetDate: "2026-08-02",
      preparationHorizonWeeks: 4,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 12,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
      preferredWorkoutMix: "balanced",
      terrainFocus: "mountain",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Non-mutating identity coverage fixture for coach-facing blueprint sample output.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildOneWeekSmokeAuthoringInput() {
  return {
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon · One-week diagnostic smoke",
      goalStyle: "target_time",
      targetTime: "2:00:00",
      targetEventName: "Half marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: null,
      preparationHorizonWeeks: 1,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 3,
      baselineLongRunKm: 8,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Thursday", "Saturday"],
      unavailableDays: ["Tuesday", "Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 3,
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
      notes:
        "One-week non-mutating diagnostic live smoke for AI-authored first-plan draft validation.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildCompactSmokeAuthoringInput() {
  return {
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon · Target time compact smoke",
      goalStyle: "target_time",
      targetTime: "2:00:00",
      targetEventName: "Half marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: null,
      preparationHorizonWeeks: 2,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 4,
      baselineLongRunKm: 10,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
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
      notes: "Compact non-mutating live smoke for AI-authored first-plan draft validation.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}
