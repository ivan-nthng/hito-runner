import {
  weekdayValues,
  type EasySupportKind,
  type NormalizedStructuredInput,
  type StructuredPlanAuthoringInput,
  type StructuredWeekday,
  type TrainingPhase,
} from "@/lib/structured-plan-authoring-schema";
import { diffDaysIso } from "@/lib/training";

export type SupportedIntensityCadenceFrequency = "none" | "every_two_weeks" | "weekly";
export type SupportedIntensityWorkoutKind = "none" | "strides" | "progression" | "tempo";
export type SupportedSpecificityIdentity =
  | "easy_run_with_strides"
  | "progression_run"
  | "controlled_tempo_session"
  | "half_marathon_threshold_durability"
  | "marathon_steady_specificity"
  | "race_pace_session"
  | "long_run_with_steady_finish";

export interface SupportedIntensityCadencePolicy {
  applies: boolean;
  frequency: SupportedIntensityCadenceFrequency;
  workoutKind: SupportedIntensityWorkoutKind;
  reason: string;
}

export function isCutbackWeek(weekNumber: number, normalized: StructuredPlanAuthoringInput) {
  const horizonWeeks = resolveStructuredHorizonWeeks(normalized);

  return weekNumber > 1 && weekNumber < horizonWeeks && weekNumber % 4 === 0;
}

export function isMountainSpecificPlan(normalized: NormalizedStructuredInput) {
  return (
    normalized.goal.goalType === "mountain_running" ||
    normalized.preferences.terrainFocus === "mountain"
  );
}

export function shouldUseProgressionSpecificity(
  normalized: NormalizedStructuredInput,
  weekNumber: number,
) {
  if (weekNumber <= Math.ceil(normalized.schedule.horizonWeeks * 0.55)) return false;

  return (
    normalized.preferences.preferredWorkoutMix === "long_run_focus" ||
    ["half_marathon", "marathon", "ultra_marathon"].includes(normalized.goal.goalType)
  );
}

export function shouldUseBaseStrides(normalized: NormalizedStructuredInput) {
  if (normalized.preferences.preferredWorkoutMix === "easy_heavy") {
    return false;
  }

  return ["5k", "10k"].includes(normalized.goal.goalType);
}

export function deriveEasySupportKind({
  normalized,
  weekNumber,
  phase,
  technicalTrailExposure,
}: {
  normalized: NormalizedStructuredInput;
  weekNumber: number;
  phase: TrainingPhase;
  technicalTrailExposure: boolean;
}): EasySupportKind {
  if (technicalTrailExposure) return "easy";
  if (phase === "Taper") return "recovery";
  if (isCutbackWeek(weekNumber, normalized)) return "cutback";

  if (shouldVaryConservativeSupportRuns(normalized) && weekNumber > 1 && weekNumber % 3 === 0) {
    return "recovery";
  }

  return "easy";
}

const recoveryFirstLongRunHeavyGoals = new Set(["marathon", "ultra_marathon", "mountain_running"]);

export function shouldUseRecoveryFirstAfterLongRun(normalized: StructuredPlanAuthoringInput) {
  const beginnerRecoveryFirst =
    !hasUsableRecent5kBenchmark(normalized) &&
    (normalized.runnerProfile.experienceLevel === "new_runner" ||
      normalized.runnerProfile.baselineSessionsPerWeek <= 2 ||
      normalized.availability.maxRunningDaysPerWeek <= 2);

  if (!recoveryFirstLongRunHeavyGoals.has(normalized.goal.goalType) && !beginnerRecoveryFirst) {
    return false;
  }

  return (
    beginnerRecoveryFirst ||
    normalized.runnerProfile.experienceLevel === "new_runner" ||
    normalized.runnerProfile.baselineSessionsPerWeek <= 3 ||
    normalized.availability.maxRunningDaysPerWeek <= 3
  );
}

export function shouldUseBeginnerRunWalkAdaptation(
  normalized: StructuredPlanAuthoringInput,
  weekNumber: number,
  horizonWeeksOverride?: number,
) {
  if (!isBeginnerRunWalkAdaptationCandidate(normalized)) {
    return false;
  }

  return weekNumber <= beginnerRunWalkAdaptationWeekCount(normalized, horizonWeeksOverride);
}

export function beginnerRunWalkAdaptationWeekCount(
  normalized: StructuredPlanAuthoringInput,
  horizonWeeksOverride?: number,
) {
  const horizonWeeks = horizonWeeksOverride ?? resolveStructuredHorizonWeeks(normalized);
  const maxAdaptationWeeks = recoveryFirstLongRunHeavyGoals.has(normalized.goal.goalType) ? 6 : 4;
  const phaseAwareWeeks = Math.max(3, Math.ceil(horizonWeeks * 0.2));

  return Math.max(1, Math.min(horizonWeeks, maxAdaptationWeeks, phaseAwareWeeks));
}

function isBeginnerRunWalkAdaptationCandidate(normalized: StructuredPlanAuthoringInput) {
  const missingBenchmark = !hasUsableRecent5kBenchmark(normalized);
  const weakSupport =
    normalized.runnerProfile.baselineSessionsPerWeek <= 2 ||
    normalized.availability.maxRunningDaysPerWeek <= 2;

  return (
    missingBenchmark && (normalized.runnerProfile.experienceLevel === "new_runner" || weakSupport)
  );
}

const lowSupportMarathonExtensionStartWeek = 17;

export function shouldUseLowSupportMarathonExtensionArchetypes(
  normalized: NormalizedStructuredInput,
  weekNumber: number,
) {
  return (
    normalized.goal.goalType === "marathon" &&
    normalized.schedule.horizonWeeks >= 20 &&
    weekNumber >= lowSupportMarathonExtensionStartWeek &&
    shouldUseRecoveryFirstAfterLongRun(normalized)
  );
}

export function shouldUseGentleStridesSupport({
  normalized,
  weekNumber,
  phase,
  weekday,
}: {
  normalized: NormalizedStructuredInput;
  weekNumber: number;
  phase: TrainingPhase;
  weekday: StructuredWeekday;
}) {
  if (!shouldUseLowSupportMarathonExtensionArchetypes(normalized, weekNumber)) {
    return false;
  }

  if (phase === "Taper" || isCutbackWeek(weekNumber, normalized)) {
    return false;
  }

  if (!isSafeLowSupportMarathonVariationWeekday(normalized, weekday)) {
    return false;
  }

  if (phase === "Build") {
    return weekNumber % 4 === 1;
  }

  if (phase === "Specific") {
    return weekNumber % 3 === 1;
  }

  return false;
}

export function shouldUseCutbackSupportArchetype(
  normalized: NormalizedStructuredInput,
  weekNumber: number,
) {
  return (
    shouldUseLowSupportMarathonExtensionArchetypes(normalized, weekNumber) &&
    isCutbackWeek(weekNumber, normalized)
  );
}

export function shouldUseTaperRecoverySupportArchetype({
  normalized,
  weekNumber,
  phase,
}: {
  normalized: NormalizedStructuredInput;
  weekNumber: number;
  phase: TrainingPhase;
}) {
  return (
    shouldUseLowSupportMarathonExtensionArchetypes(normalized, weekNumber) && phase === "Taper"
  );
}

function isSafeLowSupportMarathonVariationWeekday(
  normalized: NormalizedStructuredInput,
  weekday: StructuredWeekday,
) {
  const nextAfterLongRun = findNextRunningWeekdayAfterLongRun(
    normalized.availability.runningDays,
    normalized.availability.longRunDay,
  );
  const previousBeforeLongRun = findPreviousRunningWeekdayBeforeLongRun(
    normalized.availability.runningDays,
    normalized.availability.longRunDay,
  );

  return (
    weekday !== normalized.availability.longRunDay &&
    weekday !== nextAfterLongRun &&
    weekday !== previousBeforeLongRun
  );
}

export function findNextRunningWeekdayAfterLongRun(
  runningDays: readonly StructuredWeekday[],
  longRunDay: StructuredWeekday,
) {
  return findAdjacentRunningWeekday(runningDays, longRunDay, "next");
}

export function findPreviousRunningWeekdayBeforeLongRun(
  runningDays: readonly StructuredWeekday[],
  longRunDay: StructuredWeekday,
) {
  return findAdjacentRunningWeekday(runningDays, longRunDay, "previous");
}

export function shouldVaryConservativeSupportRuns(normalized: NormalizedStructuredInput) {
  if (shouldAvoidQuality(normalized)) return true;
  if (normalized.runnerProfile.baselineSessionsPerWeek <= 3) return true;
  if (normalized.availability.maxRunningDaysPerWeek <= 3) return true;

  return (
    normalized.runnerProfile.experienceLevel === "new_runner" &&
    !getRecent5kPaceSecondsPerKm(normalized)
  );
}

export function isLimitedSharpeningSupport(normalized: NormalizedStructuredInput) {
  if (normalized.runnerProfile.baselineSessionsPerWeek <= 3) return true;
  if (normalized.runnerProfile.experienceLevel === "new_runner") return true;
  if (normalized.runnerProfile.age && normalized.runnerProfile.age >= 60) return true;

  return !getRecent5kPaceSecondsPerKm(normalized);
}

export function resolveSupportedIntensityCadence(
  normalized: StructuredPlanAuthoringInput,
  weekNumber?: number,
): SupportedIntensityCadencePolicy {
  if (!isSupportedIntensityScope(normalized)) {
    return supportedIntensityCadence(
      "none",
      "none",
      "Runner profile is outside this beginner/recreational cadence ladder.",
      false,
    );
  }

  if (weekNumber && shouldUseBeginnerRunWalkAdaptation(normalized, weekNumber)) {
    return supportedIntensityCadence(
      "none",
      "none",
      "Early adaptation weeks stay run/walk or easy-only.",
    );
  }

  if (normalized.availability.maxRunningDaysPerWeek <= 3) {
    return supportedIntensityCadence(
      "none",
      "none",
      "Three or fewer running days/week keeps intensity out of the first plan.",
    );
  }

  if (hasActiveCautionNote(normalized)) {
    return supportedIntensityCadence(
      "none",
      "none",
      "Caution, injury, or recovery context keeps intensity out.",
    );
  }

  if (!hasStableLongRunDurability(normalized)) {
    return supportedIntensityCadence(
      "none",
      "none",
      "Long-run durability baseline is not strong enough for moderate intensity.",
    );
  }

  if (!hasSafeModerateIntensitySpacing(normalized)) {
    return supportedIntensityCadence(
      "none",
      "none",
      "Available running days cannot keep moderate work safely away from the long run.",
    );
  }

  const hasBenchmark = hasUsableRecent5kBenchmark(normalized);
  const longRunHeavyLowSupport =
    isLongRunHeavyGoal(normalized) &&
    !hasBenchmark &&
    (normalized.runnerProfile.experienceLevel === "new_runner" ||
      normalized.runnerProfile.experienceLevel === "returning_runner" ||
      normalized.runnerProfile.baselineSessionsPerWeek <= 3);

  if (
    normalized.goal.goalType === "half_marathon" &&
    normalized.goal.goalStyle === "balanced" &&
    !normalized.goal.targetTime
  ) {
    return supportedIntensityCadence(
      "every_two_weeks",
      chooseSupportedIntensityWorkoutKind(normalized, "every_two_weeks", hasBenchmark),
      "Balanced half-marathon support uses moderate specificity every two weeks, not target-time cadence.",
    );
  }

  if (
    normalized.availability.maxRunningDaysPerWeek >= 4 &&
    normalized.runnerProfile.baselineSessionsPerWeek >= 4 &&
    !longRunHeavyLowSupport &&
    (hasBenchmark || normalized.runnerProfile.experienceLevel === "consistent_runner")
  ) {
    return supportedIntensityCadence(
      "weekly",
      chooseSupportedIntensityWorkoutKind(normalized, "weekly", hasBenchmark),
      "Recreational support evidence allows one moderate touch per week.",
    );
  }

  return supportedIntensityCadence(
    "every_two_weeks",
    chooseSupportedIntensityWorkoutKind(normalized, "every_two_weeks", hasBenchmark),
    "Beginner/recreational support evidence allows one moderate touch every two weeks.",
  );
}

export function shouldScheduleSupportedIntensityWeek(
  normalized: StructuredPlanAuthoringInput,
  weekNumber: number,
  cadence = resolveSupportedIntensityCadence(normalized, weekNumber),
) {
  if (!cadence.applies || cadence.frequency === "none") {
    return false;
  }

  const firstEligibleWeek = firstSupportedIntensityWeek(normalized);

  if (weekNumber < firstEligibleWeek) {
    return false;
  }

  if (isSupportedIntensityRecoveryWeek(normalized, weekNumber)) {
    return false;
  }

  if (cadence.frequency === "weekly") {
    return true;
  }

  return (weekNumber - firstEligibleWeek) % 2 === 0;
}

export function chooseSupportedIntensityWeekday({
  normalized,
  runningDays,
  longRunDay,
  otherRunDays,
}: {
  normalized: StructuredPlanAuthoringInput;
  runningDays: readonly StructuredWeekday[];
  longRunDay: StructuredWeekday;
  otherRunDays: readonly StructuredWeekday[];
}) {
  const cadence = resolveSupportedIntensityCadence(normalized);

  if (!cadence.applies || cadence.frequency === "none") {
    return null;
  }

  const nextAfterLongRun = findNextRunningWeekdayAfterLongRun(runningDays, longRunDay);
  const previousBeforeLongRun = findPreviousRunningWeekdayBeforeLongRun(runningDays, longRunDay);
  const nonAdjacentCandidate = otherRunDays.find(
    (day) => day !== nextAfterLongRun && day !== previousBeforeLongRun,
  );

  return nonAdjacentCandidate ?? null;
}

export function isSupportedModerateIntensityIdentity(identity: string | null | undefined) {
  return (
    identity === "easy_run_with_strides" ||
    identity === "progression_run" ||
    identity === "controlled_tempo_session" ||
    identity === "time_intervals" ||
    identity === "distance_intervals" ||
    identity === "5k_sharpening_repeats" ||
    identity === "10k_rhythm_intervals" ||
    identity === "half_marathon_threshold_durability" ||
    identity === "marathon_steady_specificity" ||
    identity === "race_pace_session" ||
    identity === "taper_tuneup_run" ||
    identity === "rolling_hills_session" ||
    identity === "hill_repeats" ||
    identity === "uphill_repeats"
  );
}

export function shouldAddLongRunSteadyFinish(
  normalized: StructuredPlanAuthoringInput,
  weekNumber: number,
) {
  if (isCutbackWeek(weekNumber, normalized)) return false;
  const horizonWeeks = resolveStructuredHorizonWeeks(normalized);
  if (horizonWeeks < 14) return false;
  if (weekNumber <= Math.ceil(horizonWeeks * 0.5)) return false;
  if (phaseForWeek(weekNumber, horizonWeeks) === "Taper") return false;
  if (normalized.runnerProfile.baselineSessionsPerWeek < 4) return false;
  if (normalized.preferences.preferredWorkoutMix === "easy_heavy") return false;

  return (
    normalized.preferences.preferredWorkoutMix === "long_run_focus" ||
    ["half_marathon", "marathon", "ultra_marathon", "mountain_running"].includes(
      normalized.goal.goalType,
    )
  );
}

export function shouldUseLongRunSteadyFinishAsSpecificStimulus(
  normalized: StructuredPlanAuthoringInput,
  weekNumber: number,
  cadence = resolveSupportedIntensityCadence(normalized, weekNumber),
) {
  if (!["half_marathon", "marathon"].includes(normalized.goal.goalType)) {
    return false;
  }

  if (
    !cadence.applies ||
    cadence.frequency === "none" ||
    !shouldScheduleSupportedIntensityWeek(normalized, weekNumber, cadence)
  ) {
    return false;
  }

  return shouldAddLongRunSteadyFinish(normalized, weekNumber);
}

export function resolveSupportedSpecificityIdentityOptions(
  normalized: StructuredPlanAuthoringInput,
  weekNumber: number,
  cadence = resolveSupportedIntensityCadence(normalized, weekNumber),
): readonly SupportedSpecificityIdentity[] {
  if (
    !cadence.applies ||
    cadence.frequency === "none" ||
    !shouldScheduleSupportedIntensityWeek(normalized, weekNumber, cadence)
  ) {
    return [];
  }

  if (shouldUseLongRunSteadyFinishAsSpecificStimulus(normalized, weekNumber, cadence)) {
    return ["long_run_with_steady_finish"];
  }

  switch (normalized.goal.goalType) {
    case "half_marathon":
      return resolveHalfMarathonSpecificityOptions(normalized, weekNumber, cadence);
    case "marathon":
      return resolveMarathonSpecificityOptions(normalized, weekNumber, cadence);
    default:
      return supportedSpecificityOptionsForWorkoutKind(cadence.workoutKind);
  }
}

export function hasRaceSpecificMetricSupport(normalized: StructuredPlanAuthoringInput) {
  return (
    hasUsableRecent5kBenchmark(normalized) &&
    normalized.execution.watchAccess === "watch_or_app" &&
    (normalized.execution.guidancePreference === "pace" ||
      normalized.execution.guidancePreference === "mixed")
  );
}

export function isSupportedSpecificityIdentity(identity: string | null | undefined) {
  return (
    identity === "easy_run_with_strides" ||
    identity === "progression_run" ||
    identity === "controlled_tempo_session" ||
    identity === "half_marathon_threshold_durability" ||
    identity === "marathon_steady_specificity" ||
    identity === "race_pace_session" ||
    identity === "long_run_with_steady_finish"
  );
}

export function isHighAmbitionPlan(normalized: NormalizedStructuredInput) {
  return (
    normalized.goal.goalStyle === "ambitious" ||
    normalized.goal.goalStyle === "target_time" ||
    Boolean(normalized.goal.targetTime) ||
    normalized.preferences.preferredWorkoutMix === "long_run_focus" ||
    normalized.constraints.hardConstraints.some((constraint) => /target time/i.test(constraint))
  );
}

export function shouldAvoidQuality(normalized: StructuredPlanAuthoringInput) {
  if (shouldCapBuildConsistencyQuality(normalized)) {
    return true;
  }

  if (normalized.runnerProfile.baselineSessionsPerWeek < 3) {
    return true;
  }

  if (
    normalized.runnerProfile.experienceLevel === "new_runner" &&
    !normalized.currentLevel.recent5kPaceSecondsPerKm
  ) {
    return true;
  }

  if (
    normalized.runnerProfile.age &&
    normalized.runnerProfile.age >= 65 &&
    !normalized.currentLevel.recent5kPaceSecondsPerKm
  ) {
    return true;
  }

  return [
    ...normalized.constraints.injuryConstraints,
    ...normalized.constraints.hardConstraints,
  ].some((value) => /avoid speed|no speed|avoid intensity|no intensity|injury/i.test(value));
}

export function shouldCapBuildConsistencyQuality(normalized: StructuredPlanAuthoringInput) {
  if (normalized.goal.goalType !== "build_consistency") {
    return false;
  }

  if (normalized.runnerProfile.experienceLevel === "new_runner") {
    return true;
  }

  if (
    normalized.runnerProfile.baselineSessionsPerWeek <= 3 ||
    normalized.availability.maxRunningDaysPerWeek <= 3
  ) {
    return true;
  }

  return !hasUsableRecent5kBenchmark(normalized) && !hasTargetTimePressure(normalized);
}

export function hasTargetTimePressure(normalized: StructuredPlanAuthoringInput) {
  if (normalized.goal.goalStyle === "target_time" || normalized.goal.targetTime) {
    return true;
  }

  return normalized.constraints.hardConstraints.some((constraint) =>
    /target time/i.test(constraint),
  );
}

export function buildRestGuidance(normalized: StructuredPlanAuthoringInput) {
  const constraint =
    normalized.constraints.injuryConstraints[0] ??
    normalized.constraints.hardConstraints[0] ??
    null;

  if (constraint) {
    return `Rest day keeps this constraint intact: ${constraint}`;
  }

  return "No running scheduled today.";
}

export function buildPreferenceNotes(normalized: StructuredPlanAuthoringInput) {
  const notes = [normalized.preferences.notes, normalized.currentLevel.recentResultSummary].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  return notes.join(" · ") || null;
}

export function phaseForWeek(weekNumber: number, horizonWeeks: number): TrainingPhase {
  if (horizonWeeks <= 1) {
    return "Base";
  }

  if (horizonWeeks <= 2) {
    return weekNumber === horizonWeeks ? "Taper" : "Base";
  }

  const progress = weekNumber / horizonWeeks;

  if (progress <= 0.3) {
    return "Base";
  }

  if (progress <= 0.65) {
    return "Build";
  }

  if (progress <= 0.88) {
    return "Specific";
  }

  return "Taper";
}

export function firstTaperWeek(horizonWeeks: number) {
  for (let week = 1; week <= horizonWeeks; week += 1) {
    if (phaseForWeek(week, horizonWeeks) === "Taper") {
      return week;
    }
  }

  return horizonWeeks + 1;
}

function resolveStructuredHorizonWeeks(normalized: StructuredPlanAuthoringInput) {
  const schedule = normalized.schedule as StructuredPlanAuthoringInput["schedule"] & {
    horizonWeeks?: number;
  };

  if (Number.isInteger(schedule.horizonWeeks) && schedule.horizonWeeks! > 0) {
    return schedule.horizonWeeks!;
  }

  if (normalized.schedule.preparationHorizonWeeks) {
    return normalized.schedule.preparationHorizonWeeks;
  }

  if (normalized.schedule.targetDate) {
    return Math.max(
      1,
      Math.ceil(
        (diffDaysIso(normalized.schedule.targetDate, normalized.schedule.startDate) + 1) / 7,
      ),
    );
  }

  return 8;
}

function supportedIntensityCadence(
  frequency: SupportedIntensityCadenceFrequency,
  workoutKind: SupportedIntensityWorkoutKind,
  reason: string,
  applies = true,
): SupportedIntensityCadencePolicy {
  return { applies, frequency, workoutKind, reason };
}

function isSupportedIntensityScope(normalized: StructuredPlanAuthoringInput) {
  if (
    normalized.runnerProfile.experienceLevel === "experienced_runner" &&
    !["half_marathon", "marathon"].includes(normalized.goal.goalType)
  ) {
    return false;
  }

  if (normalized.goal.goalType === "build_consistency") {
    return false;
  }

  if (normalized.currentLevel.currentTrainingLoadSummary) {
    return false;
  }

  return ["distance_build", "5k", "10k", "half_marathon", "marathon"].includes(
    normalized.goal.goalType,
  );
}

function chooseSupportedIntensityWorkoutKind(
  normalized: StructuredPlanAuthoringInput,
  frequency: Exclude<SupportedIntensityCadenceFrequency, "none">,
  hasBenchmark: boolean,
): SupportedIntensityWorkoutKind {
  if (frequency === "every_two_weeks") {
    return hasBenchmark && normalized.runnerProfile.experienceLevel === "consistent_runner"
      ? "progression"
      : "strides";
  }

  if (
    hasBenchmark &&
    (normalized.goal.goalType === "half_marathon" ||
      normalized.goal.goalType === "10k" ||
      normalized.goal.goalType === "marathon")
  ) {
    return "tempo";
  }

  return "progression";
}

function resolveHalfMarathonSpecificityOptions(
  normalized: StructuredPlanAuthoringInput,
  weekNumber: number,
  cadence: SupportedIntensityCadencePolicy,
): readonly SupportedSpecificityIdentity[] {
  const phase = phaseForWeek(weekNumber, resolveStructuredHorizonWeeks(normalized));
  const raceRhythm = hasRaceSpecificMetricSupport(normalized);

  if (phase === "Base") {
    return cadence.frequency === "weekly"
      ? ["controlled_tempo_session", "progression_run", "easy_run_with_strides"]
      : ["progression_run", "controlled_tempo_session", "easy_run_with_strides"];
  }

  if (phase === "Build") {
    return cadence.frequency === "weekly"
      ? [
          "half_marathon_threshold_durability",
          "controlled_tempo_session",
          "progression_run",
          ...(raceRhythm ? (["race_pace_session"] as const) : []),
        ]
      : ["controlled_tempo_session", "progression_run", "easy_run_with_strides"];
  }

  if (phase === "Specific") {
    return cadence.frequency === "weekly"
      ? [
          "half_marathon_threshold_durability",
          ...(raceRhythm ? (["race_pace_session"] as const) : []),
          "controlled_tempo_session",
          "progression_run",
        ]
      : ["controlled_tempo_session", "half_marathon_threshold_durability", "progression_run"];
  }

  return ["progression_run", "easy_run_with_strides"];
}

function resolveMarathonSpecificityOptions(
  normalized: StructuredPlanAuthoringInput,
  weekNumber: number,
  cadence: SupportedIntensityCadencePolicy,
): readonly SupportedSpecificityIdentity[] {
  const phase = phaseForWeek(weekNumber, resolveStructuredHorizonWeeks(normalized));
  const raceRhythm = hasRaceSpecificMetricSupport(normalized);

  if (phase === "Build") {
    if (
      cadence.frequency === "weekly" &&
      hasUsableRecent5kBenchmark(normalized) &&
      weekNumber % 4 === 2
    ) {
      return ["controlled_tempo_session", "marathon_steady_specificity"];
    }

    return cadence.frequency === "weekly" && hasUsableRecent5kBenchmark(normalized)
      ? ["marathon_steady_specificity", "controlled_tempo_session"]
      : ["marathon_steady_specificity"];
  }

  if (phase === "Specific") {
    return [
      "marathon_steady_specificity",
      ...(raceRhythm ? (["race_pace_session"] as const) : []),
      ...(cadence.frequency === "weekly" && hasUsableRecent5kBenchmark(normalized)
        ? (["controlled_tempo_session"] as const)
        : []),
    ];
  }

  return ["marathon_steady_specificity"];
}

function supportedSpecificityOptionsForWorkoutKind(
  workoutKind: SupportedIntensityWorkoutKind,
): readonly SupportedSpecificityIdentity[] {
  switch (workoutKind) {
    case "tempo":
      return ["controlled_tempo_session", "progression_run", "easy_run_with_strides"];
    case "progression":
      return ["progression_run", "easy_run_with_strides"];
    case "strides":
      return ["easy_run_with_strides"];
    case "none":
      return [];
  }
}

function firstSupportedIntensityWeek(normalized: StructuredPlanAuthoringInput) {
  if (isBeginnerRunWalkAdaptationCandidate(normalized)) {
    return beginnerRunWalkAdaptationWeekCount(normalized) + 1;
  }

  if (
    normalized.goal.goalType === "half_marathon" &&
    normalized.goal.goalStyle === "balanced" &&
    !normalized.goal.targetTime
  ) {
    return 2;
  }

  if (!hasUsableRecent5kBenchmark(normalized)) {
    return 2;
  }

  if (
    normalized.runnerProfile.experienceLevel === "new_runner" ||
    normalized.runnerProfile.experienceLevel === "returning_runner"
  ) {
    return 2;
  }

  return 1;
}

function isSupportedIntensityRecoveryWeek(
  normalized: StructuredPlanAuthoringInput,
  weekNumber: number,
) {
  const horizonWeeks = resolveStructuredHorizonWeeks(normalized);
  const cutbackWeek = weekNumber > 1 && weekNumber < horizonWeeks && weekNumber % 4 === 0;

  return cutbackWeek || phaseForWeek(weekNumber, horizonWeeks) === "Taper";
}

function hasActiveCautionNote(normalized: StructuredPlanAuthoringInput) {
  const cautionText = [
    normalized.runnerProfile.recentInjuryRecoveryContext,
    ...normalized.constraints.injuryConstraints,
    ...normalized.constraints.hardConstraints,
    normalized.preferences.notes,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  return /avoid speed|no speed|avoid intensity|no intensity|injury|pain|rehab|caution|recovery flag|fatigue/i.test(
    cautionText,
  );
}

function hasStableLongRunDurability(normalized: StructuredPlanAuthoringInput) {
  const baselineDurationMin =
    normalized.runnerProfile.baselineLongRunDurationMin ??
    (normalized.runnerProfile.baselineLongRunKm
      ? normalized.runnerProfile.baselineLongRunKm * 7
      : null);

  if (!baselineDurationMin) {
    return false;
  }

  return baselineDurationMin >= stableLongRunThresholdMin(normalized.goal.goalType);
}

function stableLongRunThresholdMin(goalType: StructuredPlanAuthoringInput["goal"]["goalType"]) {
  switch (goalType) {
    case "half_marathon":
      return 60;
    case "marathon":
      return 75;
    case "ultra_marathon":
    case "mountain_running":
      return 85;
    case "5k":
    case "10k":
    case "build_consistency":
    case "distance_build":
      return 45;
  }
}

function hasSafeModerateIntensitySpacing(normalized: StructuredPlanAuthoringInput) {
  const fixedRestDays = new Set(normalized.availability.unavailableDays);
  const runningDays = Array.from(
    new Set(normalized.availability.preferredRunningDays.filter((day) => !fixedRestDays.has(day))),
  ).sort(compareWeekdays);
  const limitedRunningDays = runningDays.slice(0, normalized.availability.maxRunningDaysPerWeek);
  const longRunDay =
    normalized.availability.preferredLongRunDay &&
    limitedRunningDays.includes(normalized.availability.preferredLongRunDay)
      ? normalized.availability.preferredLongRunDay
      : (limitedRunningDays.at(-1) ?? null);

  if (!longRunDay) {
    return false;
  }

  const otherRunDays = limitedRunningDays.filter((day) => day !== longRunDay);

  return Boolean(
    chooseSafeModerateIntensityWeekday({
      runningDays: limitedRunningDays,
      longRunDay,
      otherRunDays,
    }),
  );
}

function chooseSafeModerateIntensityWeekday({
  runningDays,
  longRunDay,
  otherRunDays,
}: {
  runningDays: readonly StructuredWeekday[];
  longRunDay: StructuredWeekday;
  otherRunDays: readonly StructuredWeekday[];
}) {
  const nextAfterLongRun = findNextRunningWeekdayAfterLongRun(runningDays, longRunDay);
  const previousBeforeLongRun = findPreviousRunningWeekdayBeforeLongRun(runningDays, longRunDay);

  return (
    otherRunDays.find((day) => day !== nextAfterLongRun && day !== previousBeforeLongRun) ?? null
  );
}

function isLongRunHeavyGoal(normalized: StructuredPlanAuthoringInput) {
  return ["marathon", "ultra_marathon", "mountain_running"].includes(normalized.goal.goalType);
}

export function compareWeekdays(left: StructuredWeekday, right: StructuredWeekday) {
  return weekdayValues.indexOf(left) - weekdayValues.indexOf(right);
}

export function isoWeekday(isoDate: string): StructuredWeekday {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }) as StructuredWeekday;
}

export function roundToFive(value: number) {
  return Math.round(value / 5) * 5;
}

export function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getRecent5kPaceSecondsPerKm(normalized: NormalizedStructuredInput) {
  return getRecent5kPaceSecondsPerKmFromCurrentLevel(normalized.currentLevel);
}

export function hasUsableRecent5kBenchmark(normalized: StructuredPlanAuthoringInput) {
  return Boolean(getRecent5kPaceSecondsPerKmFromCurrentLevel(normalized.currentLevel));
}

export function getRecent5kPaceSecondsPerKmFromCurrentLevel(
  currentLevel: StructuredPlanAuthoringInput["currentLevel"],
) {
  if (currentLevel.recent5kPaceSecondsPerKm) {
    return currentLevel.recent5kPaceSecondsPerKm;
  }

  const recent5k = currentLevel.recentRaceResults.find((result) =>
    /^5\s*k(m)?$/i.test(result.distance.trim()),
  );
  const resultSeconds = recent5k ? parseDurationSeconds(recent5k.resultTime) : null;

  return resultSeconds ? resultSeconds / 5 : null;
}

export function parseDurationSeconds(value: string) {
  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.length !== 2 && parts.length !== 3) return null;
  if (parts.some((part) => !Number.isInteger(part) || part < 0)) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;

    if (seconds == null || seconds >= 60) return null;
    return minutes! * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;

  if (minutes == null || seconds == null || minutes >= 60 || seconds >= 60) return null;
  return hours! * 3600 + minutes * 60 + seconds;
}

function findAdjacentRunningWeekday(
  runningDays: readonly StructuredWeekday[],
  longRunDay: StructuredWeekday,
  direction: "next" | "previous",
) {
  const longRunIndex = weekdayValues.indexOf(longRunDay);
  const candidateOffsets = runningDays
    .filter((day) => day !== longRunDay)
    .map((day) => {
      const dayIndex = weekdayValues.indexOf(day);
      const offset =
        direction === "next"
          ? (dayIndex - longRunIndex + 7) % 7
          : (longRunIndex - dayIndex + 7) % 7;

      return { day, offset };
    })
    .filter((candidate) => candidate.offset > 0)
    .sort((left, right) => left.offset - right.offset);

  return candidateOffsets[0]?.day ?? null;
}
