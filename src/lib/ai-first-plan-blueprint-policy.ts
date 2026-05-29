import { addDaysIso, diffDaysIso, weekdayLong } from "@/lib/training";
import type { StructuredAuthoringInput } from "@/lib/ai-first-plan-blueprint-schema";
import { type AuthoredWorkoutIdentity, weekdayIndex } from "@/lib/ai-first-plan-blueprint-taxonomy";

export type GoalFamilyPolicyKey =
  | "beginner_consistency"
  | "five_k"
  | "ten_k"
  | "half_marathon"
  | "marathon"
  | "ultra"
  | "mountain_trail";

export type GoalFamilyCadenceKind = "none" | "quality" | "specialty";
export type GoalFamilyCadenceFrequency = "none" | "weekly" | "every_two_weeks";

export interface GoalFamilyIdentityPolicy {
  key: GoalFamilyPolicyKey;
  label: string;
  allowedIdentities: Set<AuthoredWorkoutIdentity>;
  expectedSupportIdentities: Set<AuthoredWorkoutIdentity>;
  expectedQualityIdentities: Set<AuthoredWorkoutIdentity>;
  longRunIdentities: Set<AuthoredWorkoutIdentity>;
  cutbackTaperIdentities: Set<AuthoredWorkoutIdentity>;
  specialtyIdentities: Set<AuthoredWorkoutIdentity>;
  excludedIdentities: Set<AuthoredWorkoutIdentity>;
  cadence: {
    kind: GoalFamilyCadenceKind;
    frequency: GoalFamilyCadenceFrequency;
    useLongRunSlot?: boolean;
  };
}

export type RequiredCadenceSlot = {
  date: string;
  weekday: string;
  kind: GoalFamilyCadenceKind;
  identityOptions: AuthoredWorkoutIdentity[];
  purpose: string;
};

const supportIdentityValues = [
  "easy_aerobic_run",
  "recovery_jog",
  "steady_aerobic_run",
  "cutback_aerobic_run",
  "easy_run_with_strides",
] as const satisfies readonly AuthoredWorkoutIdentity[];
const baseLongRunIdentityValues = [
  "long_aerobic_run",
  "long_run_with_steady_finish",
  "cutback_long_run",
  "taper_long_run",
] as const satisfies readonly AuthoredWorkoutIdentity[];
const cutbackTaperIdentityValues = [
  "cutback_aerobic_run",
  "cutback_long_run",
  "taper_long_run",
  "taper_tuneup_run",
] as const satisfies readonly AuthoredWorkoutIdentity[];

const identitySet = (values: readonly AuthoredWorkoutIdentity[]) =>
  new Set<AuthoredWorkoutIdentity>(values);
const allSupportAndLongIdentities = [
  ...supportIdentityValues,
  ...baseLongRunIdentityValues,
] as const satisfies readonly AuthoredWorkoutIdentity[];

export const goalFamilyIdentityPolicies: Record<GoalFamilyPolicyKey, GoalFamilyIdentityPolicy> = {
  beginner_consistency: {
    key: "beginner_consistency",
    label: "Beginner / consistency",
    allowedIdentities: identitySet([
      ...supportIdentityValues,
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
      "progression_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet(["progression_run"]),
    longRunIdentities: identitySet(["long_aerobic_run"]),
    cutbackTaperIdentities: identitySet([
      "cutback_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    specialtyIdentities: identitySet([]),
    excludedIdentities: identitySet([
      "controlled_tempo_session",
      "time_intervals",
      "distance_intervals",
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "race_pace_session",
      "taper_tuneup_run",
      "quality_session",
    ]),
    cadence: { kind: "none", frequency: "none" },
  },
  five_k: {
    key: "five_k",
    label: "5K",
    allowedIdentities: identitySet([
      ...allSupportAndLongIdentities,
      "progression_run",
      "controlled_tempo_session",
      "time_intervals",
      "distance_intervals",
      "5k_sharpening_repeats",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([
      "5k_sharpening_repeats",
      "time_intervals",
      "distance_intervals",
      "controlled_tempo_session",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    longRunIdentities: identitySet(["long_aerobic_run", "cutback_long_run", "taper_long_run"]),
    cutbackTaperIdentities: identitySet(cutbackTaperIdentityValues),
    specialtyIdentities: identitySet(["5k_sharpening_repeats"]),
    excludedIdentities: identitySet([
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "ultra_time_on_feet_durability",
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "quality_session",
    ]),
    cadence: { kind: "quality", frequency: "weekly" },
  },
  ten_k: {
    key: "ten_k",
    label: "10K",
    allowedIdentities: identitySet([
      ...allSupportAndLongIdentities,
      "progression_run",
      "controlled_tempo_session",
      "time_intervals",
      "distance_intervals",
      "10k_rhythm_intervals",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([
      "10k_rhythm_intervals",
      "time_intervals",
      "distance_intervals",
      "controlled_tempo_session",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    longRunIdentities: identitySet(["long_aerobic_run", "cutback_long_run", "taper_long_run"]),
    cutbackTaperIdentities: identitySet(cutbackTaperIdentityValues),
    specialtyIdentities: identitySet(["10k_rhythm_intervals"]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "ultra_time_on_feet_durability",
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "quality_session",
    ]),
    cadence: { kind: "quality", frequency: "weekly" },
  },
  half_marathon: {
    key: "half_marathon",
    label: "Half marathon",
    allowedIdentities: identitySet([
      ...allSupportAndLongIdentities,
      "progression_run",
      "controlled_tempo_session",
      "half_marathon_threshold_durability",
      "time_intervals",
      "distance_intervals",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([
      "half_marathon_threshold_durability",
      "controlled_tempo_session",
      "time_intervals",
      "distance_intervals",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    longRunIdentities: identitySet([
      "long_aerobic_run",
      "long_run_with_steady_finish",
      "cutback_long_run",
      "taper_long_run",
    ]),
    cutbackTaperIdentities: identitySet(cutbackTaperIdentityValues),
    specialtyIdentities: identitySet([
      "half_marathon_threshold_durability",
      "long_run_with_steady_finish",
    ]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "marathon_steady_specificity",
      "ultra_time_on_feet_durability",
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "quality_session",
    ]),
    cadence: { kind: "quality", frequency: "weekly" },
  },
  marathon: {
    key: "marathon",
    label: "Marathon",
    allowedIdentities: identitySet([
      ...allSupportAndLongIdentities,
      "progression_run",
      "controlled_tempo_session",
      "marathon_steady_specificity",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([
      "marathon_steady_specificity",
      "controlled_tempo_session",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    longRunIdentities: identitySet([
      "long_aerobic_run",
      "long_run_with_steady_finish",
      "cutback_long_run",
      "taper_long_run",
    ]),
    cutbackTaperIdentities: identitySet(cutbackTaperIdentityValues),
    specialtyIdentities: identitySet([
      "marathon_steady_specificity",
      "long_run_with_steady_finish",
    ]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "ultra_time_on_feet_durability",
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "quality_session",
    ]),
    cadence: { kind: "quality", frequency: "every_two_weeks" },
  },
  ultra: {
    key: "ultra",
    label: "Ultra",
    allowedIdentities: identitySet([
      ...supportIdentityValues,
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
      "cutback_aerobic_run",
      "steady_aerobic_run",
      "ultra_time_on_feet_durability",
      "hike_run_endurance",
      "technical_trail_easy",
      "rolling_hills_session",
      "climbing_steady_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([]),
    longRunIdentities: identitySet([
      "ultra_time_on_feet_durability",
      "hike_run_endurance",
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    cutbackTaperIdentities: identitySet([
      "cutback_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    specialtyIdentities: identitySet([
      "ultra_time_on_feet_durability",
      "hike_run_endurance",
      "technical_trail_easy",
      "rolling_hills_session",
      "climbing_steady_run",
    ]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "race_pace_session",
      "quality_session",
    ]),
    cadence: { kind: "specialty", frequency: "every_two_weeks" },
  },
  mountain_trail: {
    key: "mountain_trail",
    label: "Mountain / trail",
    allowedIdentities: identitySet([
      ...supportIdentityValues,
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
      "technical_trail_easy",
      "rolling_hills_session",
      "uphill_repeats",
      "controlled_downhill_durability",
      "hike_run_endurance",
      "mountain_long_run_time_on_feet",
      "ultra_time_on_feet_durability",
      "climbing_steady_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet(["rolling_hills_session", "uphill_repeats"]),
    longRunIdentities: identitySet([
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "ultra_time_on_feet_durability",
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    cutbackTaperIdentities: identitySet([
      "cutback_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    specialtyIdentities: identitySet([
      "technical_trail_easy",
      "rolling_hills_session",
      "uphill_repeats",
      "controlled_downhill_durability",
      "hike_run_endurance",
      "mountain_long_run_time_on_feet",
      "ultra_time_on_feet_durability",
      "climbing_steady_run",
    ]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "race_pace_session",
      "taper_tuneup_run",
      "quality_session",
    ]),
    cadence: { kind: "specialty", frequency: "every_two_weeks" },
  },
};

export function buildPromptGoalFamilyIdentityPolicy(authoringInput: StructuredAuthoringInput) {
  const policy = resolveGoalFamilyIdentityPolicy(authoringInput);

  return {
    family: policy.label,
    allowedIdentities: [...policy.allowedIdentities],
    expectedSupportIdentities: [...policy.expectedSupportIdentities],
    expectedQualityIdentities: [...policy.expectedQualityIdentities],
    longRunIdentities: [...policy.longRunIdentities],
    cutbackTaperIdentities: [...policy.cutbackTaperIdentities],
    specialtyIdentities: [...policy.specialtyIdentities],
    excludedIdentities: [...policy.excludedIdentities],
    cadence: buildPromptGoalFamilyCadencePolicy(authoringInput, policy),
  };
}

export function buildRequiredCadenceSlots(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
) {
  const slots = new Map<number, RequiredCadenceSlot>();

  if (!isGoalFamilyCadencePlan(authoringInput, policy)) {
    return slots;
  }

  const horizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const runningDays = authoringInput.availability.preferredRunningDays.filter(
    (day) => !fixedRestDays.has(day),
  );
  const preferredLongRunDay = authoringInput.availability.preferredLongRunDay ?? null;
  const cadenceWeekday = chooseGoalFamilyCadenceWeekday(policy, runningDays, preferredLongRunDay);

  if (!cadenceWeekday) {
    return slots;
  }

  for (let weekIndex = 0; weekIndex < horizonWeeks; weekIndex += 1) {
    const weekNumber = weekIndex + 1;

    if (!shouldRequireGoalFamilyCadenceSlot(authoringInput, policy, weekNumber)) {
      continue;
    }

    const weekStart = addDaysIso(authoringInput.schedule.startDate, weekIndex * 7);
    const cadenceDate = Array.from({ length: 7 }, (_day, dayIndex) =>
      addDaysIso(weekStart, dayIndex),
    ).find((date) => weekdayLong(date) === cadenceWeekday);

    if (cadenceDate) {
      slots.set(weekNumber, {
        date: cadenceDate,
        weekday: cadenceWeekday,
        kind: policy.cadence.kind,
        identityOptions: cadenceIdentityOptionsForGoal(authoringInput, policy, weekNumber),
        purpose: cadencePurposeForGoal(authoringInput, policy, weekNumber),
      });
    }
  }

  return slots;
}

export function resolveGoalFamilyIdentityPolicy(
  authoringInput: StructuredAuthoringInput,
): GoalFamilyIdentityPolicy {
  switch (authoringInput.goal.goalType) {
    case "5k":
      return goalFamilyIdentityPolicies.five_k;
    case "10k":
      return goalFamilyIdentityPolicies.ten_k;
    case "half_marathon":
      return goalFamilyIdentityPolicies.half_marathon;
    case "marathon":
      return goalFamilyIdentityPolicies.marathon;
    case "ultra_marathon":
      return goalFamilyIdentityPolicies.ultra;
    case "mountain_running":
      return goalFamilyIdentityPolicies.mountain_trail;
    case "build_consistency":
    default:
      return goalFamilyIdentityPolicies.beginner_consistency;
  }
}

export function isGoalFamilyCadencePlan(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
) {
  if (policy.cadence.frequency === "none") {
    return false;
  }

  if (
    authoringInput.runnerProfile.experienceLevel === "new_runner" ||
    authoringInput.availability.maxRunningDaysPerWeek <= 3
  ) {
    return false;
  }

  if (policy.key === "half_marathon") {
    const hasPerformanceIntent =
      Boolean(authoringInput.goal.targetTime) ||
      authoringInput.goal.goalStyle === "target_time" ||
      authoringInput.goal.goalStyle === "ambitious";

    return hasPerformanceIntent || isBalancedHalfMarathonCadencePlan(authoringInput, policy);
  }

  return policy.key !== "beginner_consistency";
}

export function resolveAuthoringHorizonWeeks(authoringInput: StructuredAuthoringInput) {
  if (authoringInput.schedule.preparationHorizonWeeks) {
    return authoringInput.schedule.preparationHorizonWeeks;
  }

  if (authoringInput.schedule.targetDate) {
    return Math.max(
      1,
      Math.ceil(
        (diffDaysIso(authoringInput.schedule.targetDate, authoringInput.schedule.startDate) + 1) /
          7,
      ),
    );
  }

  return 1;
}

function isBalancedHalfMarathonCadencePlan(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
) {
  return (
    policy.key === "half_marathon" &&
    authoringInput.goal.goalStyle === "balanced" &&
    !authoringInput.goal.targetTime
  );
}

function buildPromptGoalFamilyCadencePolicy(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
) {
  if (!isGoalFamilyCadencePlan(authoringInput, policy)) {
    return {
      kind: "none",
      frequency: "none",
      reason: "Runner support level does not require forced quality or specialty cadence.",
    };
  }

  if (isBalancedHalfMarathonCadencePlan(authoringInput, policy)) {
    return {
      kind: "quality",
      frequency: "moderate_every_two_weeks_after_week_1",
      reason:
        "Supported balanced half-marathon plans may use Week 1 to acclimate, then need moderate half-specific rhythm from Week 2 without target-time intensity.",
    };
  }

  return policy.cadence;
}

function shouldRequireGoalFamilyCadenceSlot(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
  weekNumber: number,
) {
  if (isBalancedHalfMarathonCadencePlan(authoringInput, policy)) {
    return weekNumber >= 2 && weekNumber % 2 === 0;
  }

  return (
    policy.cadence.frequency === "weekly" ||
    (policy.cadence.frequency === "every_two_weeks" && weekNumber % 2 === 1)
  );
}

function chooseGoalFamilyCadenceWeekday(
  policy: GoalFamilyIdentityPolicy,
  runningDays: string[],
  preferredLongRunDay: string | null,
) {
  if (
    policy.cadence.useLongRunSlot &&
    preferredLongRunDay &&
    runningDays.includes(preferredLongRunDay)
  ) {
    return preferredLongRunDay;
  }

  const candidateWeekdays = runningDays.filter((weekday) => weekday !== preferredLongRunDay);

  if (preferredLongRunDay && runningDays.includes(preferredLongRunDay)) {
    const safetyRankedCandidates = candidateWeekdays
      .map((weekday) => ({
        weekday,
        safety: scoreCadenceWeekdaySafety(weekday, preferredLongRunDay),
      }))
      .filter((candidate) => !candidate.safety.adjacentToLongRun)
      .sort(
        (left, right) =>
          right.safety.spacingScore - left.safety.spacingScore ||
          cadenceWeekdayPreferenceIndex(left.weekday) -
            cadenceWeekdayPreferenceIndex(right.weekday),
      );

    if (safetyRankedCandidates[0]) {
      return safetyRankedCandidates[0].weekday;
    }

    return null;
  }

  const candidateOrder = ["Tuesday", "Thursday", "Monday", "Friday", "Wednesday", "Saturday"];

  return candidateOrder.find((weekday) => candidateWeekdays.includes(weekday)) ?? null;
}

function scoreCadenceWeekdaySafety(weekday: string, preferredLongRunDay: string) {
  const weekdayOffset = forwardWeekdayOffset(preferredLongRunDay, weekday);
  const reverseOffset = forwardWeekdayOffset(weekday, preferredLongRunDay);

  return {
    adjacentToLongRun: weekdayOffset === 1 || reverseOffset === 1,
    spacingScore: Math.min(weekdayOffset, reverseOffset),
  };
}

function forwardWeekdayOffset(fromWeekday: string, toWeekday: string) {
  return (weekdayIndex(toWeekday) - weekdayIndex(fromWeekday) + 7) % 7;
}

function cadenceWeekdayPreferenceIndex(weekday: string) {
  const preferenceOrder = ["Tuesday", "Thursday", "Wednesday", "Friday", "Monday", "Saturday"];
  const index = preferenceOrder.indexOf(weekday);

  return index === -1 ? preferenceOrder.length : index;
}

function cadenceIdentityOptionsForGoal(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
  weekNumber: number,
) {
  const isFinalTwoWeeks =
    weekNumber >= Math.max(1, resolveAuthoringHorizonWeeks(authoringInput) - 1);

  if (isBalancedHalfMarathonCadencePlan(authoringInput, policy)) {
    const balancedHalfOptions: AuthoredWorkoutIdentity[] = isFinalTwoWeeks
      ? ["taper_tuneup_run", "progression_run", "controlled_tempo_session"]
      : ["progression_run", "controlled_tempo_session", "half_marathon_threshold_durability"];

    return balancedHalfOptions.filter((identity) => policy.allowedIdentities.has(identity));
  }

  if (isFinalTwoWeeks) {
    const taperOptions = [...policy.cutbackTaperIdentities].filter((identity) =>
      policy.allowedIdentities.has(identity),
    );

    if (policy.cadence.kind === "specialty") {
      return [...new Set([...taperOptions, ...policy.specialtyIdentities])];
    }

    return [...new Set([...taperOptions, ...policy.expectedQualityIdentities])];
  }

  if (policy.cadence.useLongRunSlot) {
    return [...new Set([...policy.longRunIdentities, ...policy.specialtyIdentities])];
  }

  return [
    ...new Set([
      ...policy.expectedQualityIdentities,
      ...policy.specialtyIdentities,
      ...policy.longRunIdentities,
    ]),
  ].filter((identity) => policy.allowedIdentities.has(identity));
}

function cadencePurposeForGoal(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
  weekNumber: number,
) {
  const isFinalTwoWeeks =
    weekNumber >= Math.max(1, resolveAuthoringHorizonWeeks(authoringInput) - 1);

  if (isFinalTwoWeeks) {
    return "Reduced specificity that preserves freshness while keeping the goal-family signal visible.";
  }

  switch (policy.key) {
    case "five_k":
      return "Controlled faster-running rhythm or short sharpening repeats.";
    case "ten_k":
      return "Sustained rhythm, cruise-style intervals, or controlled faster running.";
    case "half_marathon":
      if (isBalancedHalfMarathonCadencePlan(authoringInput, policy)) {
        return "Moderate balanced half-marathon rhythm: progression, controlled tempo, or threshold durability without early target-time intensity.";
      }

      return "Half-marathon threshold durability, controlled tempo, or race-rhythm preparation.";
    case "marathon":
      return "Marathon-specific steady durability without unsupported race-pace precision.";
    case "ultra":
      return "Ultra time-on-feet, hike-run durability, or terrain-patient endurance.";
    case "mountain_trail":
      return "Trail, hill, downhill-control, climbing, or mountain time-on-feet specificity.";
    default:
      return "Safe goal-family cadence without adding unsupported hard-day density.";
  }
}
