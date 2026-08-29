import {
  buildAcceptedEffectiveRunnerHeartRateProfile,
  type PersonalHeartRateProfileInput,
} from "../src/lib/heart-rate-zones";
import type { BuildRunningPlanPreviewInput } from "../src/lib/plan-creation-engine";
import { deriveRunnerPlanCapabilityVectorV1 } from "../src/lib/runner-activity/plan-capability";
import type { RunnerPlanCapabilitySourceActivityV1 } from "../src/lib/runner-activity/plan-capability-contract";
import {
  RUNNER_FITNESS_PROFILE_FORMULA_VERSION,
  RUNNER_FITNESS_PROFILE_HISTORY_FORMULA_VERSION,
  RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION,
  type RunnerActivityProgressProductFactMetric,
  type RunnerActivityProgressProductSnapshot,
  type RunnerFitnessProfileComponentStateV1,
  type RunnerFitnessProfileSnapshotV1,
} from "../src/lib/runner-activity/product-contract";
import type { RunnerFitnessLevel } from "../src/lib/runner-training-preferences";
import { addDaysIso } from "../src/lib/training";

const PROOF_PERSONAL_ZONES = [
  { reference: "Z1", minBpm: 100, maxBpm: 120 },
  { reference: "Z2", minBpm: 121, maxBpm: 140 },
  { reference: "Z3", minBpm: 141, maxBpm: 155 },
  { reference: "Z4", minBpm: 156, maxBpm: 170 },
  { reference: "Z5", minBpm: 171, maxBpm: 190 },
] as const satisfies PersonalHeartRateProfileInput["zones"];

export function buildProofRunnerCapability(
  input: BuildRunningPlanPreviewInput,
  options: {
    profileRevision?: number;
    fitnessLevel?: RunnerFitnessLevel;
    personalZones?: PersonalHeartRateProfileInput["zones"];
    recentState?: RunnerFitnessProfileComponentStateV1;
    rollingState?: RunnerFitnessProfileComponentStateV1;
    latestState?: RunnerFitnessProfileComponentStateV1;
    constraintsState?: RunnerFitnessProfileComponentStateV1;
    cutoffDate?: string;
    formulaSuffix?: string;
    sourceActivities?: readonly RunnerPlanCapabilitySourceActivityV1[];
  } = {},
) {
  const profileRevision = options.profileRevision ?? 1;
  const cutoffDate = options.cutoffDate ?? input.startDate ?? "2026-06-08";
  const recentState = options.recentState ?? "unavailable";
  const rollingState = options.rollingState ?? "unavailable";
  const latestState = options.latestState ?? "unavailable";
  const constraintsState = options.constraintsState ?? "partial";
  const formulaSuffix = options.formulaSuffix ?? "v1";
  const storedProfile = options.personalZones
    ? {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: options.personalZones,
      }
    : {
        version: "runner_hr_profile_v2",
        source: "estimated",
      };
  const acceptedHeartRateProfile = buildAcceptedEffectiveRunnerHeartRateProfile({
    age: input.age,
    storedProfile,
  });
  if (!acceptedHeartRateProfile) {
    throw new Error("Proof runner profile must produce accepted heart-rate truth.");
  }

  const fitnessLevel = options.fitnessLevel ?? fitnessLevelForPlanRunner(input.runnerLevel);
  const current = buildProgressWindow(cutoffDate, 27, `proof_recent_${formulaSuffix}`);
  const previous = buildProgressWindow(
    addDaysIso(cutoffDate, -28),
    27,
    `proof_recent_${formulaSuffix}`,
  );
  const hasRecentData = recentState === "available" || recentState === "partial";
  const hasRollingData = rollingState === "available" || rollingState === "partial";
  const hasLatestData = latestState === "available" || latestState === "partial";
  const stateIdentity = [constraintsState, recentState, latestState, rollingState].join("-");
  const snapshot: RunnerFitnessProfileSnapshotV1 = {
    version: RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION,
    snapshotId: `proof-profile-${profileRevision}-${formulaSuffix}-${stateIdentity}`,
    runnerId: "proof-runner",
    asOf: `${cutoffDate}T12:00:00.000Z`,
    cutoffDate,
    timeZone: "UTC",
    runnerFactsRevision: `proof-facts-${profileRevision}-${formulaSuffix}-${stateIdentity}`,
    formulaVersions: {
      profile: RUNNER_FITNESS_PROFILE_FORMULA_VERSION,
      runnerActivity: [RUNNER_FITNESS_PROFILE_HISTORY_FORMULA_VERSION, formulaSuffix].sort(),
      sessionRpeLoad: hasRollingData ? `proof_session_rpe_${formulaSuffix}` : null,
    },
    provenance: {
      identityProfile: {
        revision: profileRevision,
        fingerprint: `proof-profile-fingerprint-${profileRevision}`,
      },
      calendarOutcomes: { fingerprint: `proof-calendar-${stateIdentity}` },
      resultEvidence: { fingerprint: `proof-evidence-${stateIdentity}` },
      runnerActivity: { fingerprint: `proof-activity-${formulaSuffix}-${stateIdentity}` },
    },
    planAuthoringSource: {
      version: "runner_plan_capability_source_v1",
      state:
        recentState === "updating"
          ? "updating"
          : recentState === "contradictory"
            ? "contradictory"
            : "current",
      activities: options.sourceActivities
        ? [...options.sourceActivities]
        : hasRecentData
          ? [
              {
                activityId: "proof-recent-easy",
                activityRevisionId: `proof-recent-easy-revision-${formulaSuffix}`,
                sourceRevisionId: `proof-recent-easy-source-${formulaSuffix}`,
                localDate: addDaysIso(cutoffDate, -4),
                durationSeconds: 2400,
                distanceMetres: 7000,
                classification: "easy" as const,
              },
              {
                activityId: "proof-recent-long",
                activityRevisionId: `proof-recent-long-revision-${formulaSuffix}`,
                sourceRevisionId: `proof-recent-long-source-${formulaSuffix}`,
                localDate: cutoffDate,
                durationSeconds: 3600,
                distanceMetres: 10000,
                classification: "long" as const,
              },
            ]
          : [],
      records: [],
      formulaVersions: [RUNNER_FITNESS_PROFILE_HISTORY_FORMULA_VERSION, formulaSuffix].sort(),
      reasonCodes:
        recentState === "updating"
          ? (["source_revision_updating"] as const)
          : recentState === "contradictory"
            ? (["source_revision_contradictory"] as const)
            : [],
    },
    components: {
      constraints: {
        state: constraintsState,
        data:
          constraintsState === "unavailable"
            ? null
            : {
                fitnessLevel,
                trainingPreferences: {
                  blocked_days: [...(input.fixedRestDays ?? [])],
                  preferred_long_run_day: input.preferredLongRunDay ?? null,
                  max_running_days_per_week: input.daysPerWeek ?? null,
                },
                currentGoal: null,
                preferredUnits: null,
                limitationState: null,
                runnerEnteredFacts: {
                  source: "runner_profile",
                  revision: profileRevision,
                  lastConfirmedAt: null,
                },
              },
        coverage: coverage(constraintsState === "unavailable" ? 0 : 2, 6),
        reasonCodes: constraintsState === "contradictory" ? ["proof_constraint_conflict"] : [],
      },
      recent28Day: {
        state: recentState,
        data: hasRecentData
          ? {
              current,
              previous,
              calendarOutcomes: [],
              evidence: {
                dueWorkoutCount: 0,
                resolvedOutcomeCount: 0,
                acceptedActualCount: 0,
                completionOnlyCount: 0,
                missingCount: 0,
                updatingCount: 0,
                removedCount: 0,
                workouts: [],
              },
              sessionRpeLoad: null,
            }
          : null,
        coverage: coverage(hasRecentData ? 2 : 0, hasRecentData ? 2 : 0),
        reasonCodes: recentState === "contradictory" ? ["proof_recent_conflict"] : [],
      },
      latestFive: {
        state: latestState,
        data: hasLatestData
          ? {
              inspectionOnly: true,
              items: [
                {
                  activityId: "proof-activity",
                  localDate: cutoffDate,
                  workoutContext: "easy",
                  actualEvidenceState: "accepted_actual",
                  durationMin: 40,
                  distanceKm: 7,
                  paceSecondsPerKm: null,
                  averageHeartRate: null,
                  elevationGainMetres: null,
                  sessionRpe: 3,
                },
              ],
            }
          : null,
        coverage: {
          ...coverage(hasLatestData ? 1 : 0, hasLatestData ? 1 : 0),
          coveredDates: hasLatestData ? [cutoffDate] : [],
        },
        reasonCodes: [],
      },
      rolling90Day: {
        state: rollingState,
        data: hasRollingData
          ? {
              window: {
                startDate: addDaysIso(cutoffDate, -89),
                endDate: cutoffDate,
                cutoffDate,
                timezoneBasis: "historical_local_date",
                weekStartsOn: "monday",
              },
              acceptedActivityCount: 2,
              weeklyDistribution: [],
              longestDuration: { localDate: cutoffDate, minutes: 55 },
              longestDistance: { localDate: cutoffDate, kilometers: 10 },
              sessionRpeLoad: null,
              records: [],
            }
          : null,
        coverage: coverage(hasRollingData ? 2 : 0, hasRollingData ? 2 : 0),
        reasonCodes: rollingState === "contradictory" ? ["proof_rolling_conflict"] : [],
      },
      comparablePerformance: {
        state: "unavailable",
        data: null,
        coverage: coverage(0, 0),
        reasonCodes: ["normalized_stream_not_persisted"],
      },
    },
  };

  return {
    acceptedHeartRateProfile,
    runnerCapability: deriveRunnerPlanCapabilityVectorV1({
      snapshot,
      currentRunningLimitation: input.currentRunningLimitation,
    }),
  };
}

export function buildProofPersonalRunnerCapability(input: BuildRunningPlanPreviewInput) {
  return buildProofRunnerCapability(input, { personalZones: PROOF_PERSONAL_ZONES });
}

function buildProgressWindow(
  cutoffDate: string,
  days: number,
  formulaVersion: string,
): RunnerActivityProgressProductSnapshot {
  const metric = (unit: RunnerActivityProgressProductFactMetric["unit"], value: number) => ({
    availability: "available" as const,
    confidence: "complete" as const,
    value,
    unit,
    includedActivityCount: 2,
    missingActivityCount: 0,
    missingReasons: [],
  });
  return {
    window: {
      startDate: addDaysIso(cutoffDate, -days),
      endDate: cutoffDate,
      cutoffDate,
      timezoneBasis: "historical_local_date",
      weekStartsOn: "monday",
    },
    formulaVersion,
    eligibleActivityCount: 2,
    facts: {
      sessions: metric("sessions", 2),
      runningTime: metric("minutes", 80),
      distance: metric("kilometers", 14),
      elevationGain: metric("meters", 100),
      longestDistance: metric("kilometers", 8),
      longestDuration: metric("minutes", 45),
    },
  };
}

function coverage(includedCount: number, candidateCount: number) {
  return {
    includedCount,
    candidateCount,
    missingCount: Math.max(0, candidateCount - includedCount),
    coveredDates: [] as string[],
  };
}

function fitnessLevelForPlanRunner(
  runnerLevel: BuildRunningPlanPreviewInput["runnerLevel"],
): RunnerFitnessLevel {
  switch (runnerLevel) {
    case "beginner_new_runner":
      return "new_to_running";
    case "sometimes_runs":
      return "beginner";
    case "runs_a_lot":
      return "running_regularly";
    case "professional_competitive":
      return "performance_focused";
  }
}
