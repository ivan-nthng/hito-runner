import {
  buildAcceptedEffectiveRunnerHeartRateProfile,
  type PersonalHeartRateProfileInput,
} from "../src/lib/heart-rate-zones";
import type { BuildRunningPlanPreviewInput } from "../src/lib/plan-creation-engine";
import type { RunnerFitnessLevel } from "../src/lib/runner-training-preferences";
import type { RunnerPlanAuthoringProfileSnapshot } from "../src/lib/user-settings-actions";

const PROOF_PERSONAL_ZONES = [
  { reference: "Z1", minBpm: 100, maxBpm: 120 },
  { reference: "Z2", minBpm: 121, maxBpm: 140 },
  { reference: "Z3", minBpm: 141, maxBpm: 155 },
  { reference: "Z4", minBpm: 156, maxBpm: 170 },
  { reference: "Z5", minBpm: 171, maxBpm: 190 },
] as const satisfies PersonalHeartRateProfileInput["zones"];

export function buildProofRunnerProfileSnapshot(
  input: BuildRunningPlanPreviewInput,
  options: {
    profileRevision?: number;
    fitnessLevel?: RunnerFitnessLevel;
    personalZones?: PersonalHeartRateProfileInput["zones"];
  } = {},
): RunnerPlanAuthoringProfileSnapshot {
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
  const heartRateProfile = buildAcceptedEffectiveRunnerHeartRateProfile({
    age: input.age,
    storedProfile,
  });

  if (!heartRateProfile) {
    throw new Error("Proof runner profile must produce accepted heart-rate truth.");
  }

  return {
    profileRevision: options.profileRevision ?? 1,
    age: input.age,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    fitnessLevel: options.fitnessLevel ?? fitnessLevelForPlanRunner(input.runnerLevel),
    heartRateProfile,
  };
}

export function buildProofPersonalRunnerProfileSnapshot(input: BuildRunningPlanPreviewInput) {
  return buildProofRunnerProfileSnapshot(input, { personalZones: PROOF_PERSONAL_ZONES });
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
