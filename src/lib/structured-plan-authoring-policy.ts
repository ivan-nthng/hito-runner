import {
  weekdayValues,
  type EasySupportKind,
  type NormalizedStructuredInput,
  type StructuredPlanAuthoringInput,
  type StructuredWeekday,
  type TrainingPhase,
} from "@/lib/structured-plan-authoring-schema";

export function isCutbackWeek(weekNumber: number, normalized: NormalizedStructuredInput) {
  return weekNumber > 1 && weekNumber < normalized.schedule.horizonWeeks && weekNumber % 4 === 0;
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

export function shouldAddLongRunSteadyFinish(
  normalized: NormalizedStructuredInput,
  weekNumber: number,
) {
  if (isCutbackWeek(weekNumber, normalized)) return false;
  if (weekNumber <= Math.ceil(normalized.schedule.horizonWeeks * 0.5)) return false;
  if (phaseForWeek(weekNumber, normalized.schedule.horizonWeeks) === "Taper") return false;
  if (normalized.runnerProfile.baselineSessionsPerWeek < 4) return false;
  if (normalized.preferences.preferredWorkoutMix === "easy_heavy") return false;

  return (
    normalized.preferences.preferredWorkoutMix === "long_run_focus" ||
    ["half_marathon", "marathon", "ultra_marathon", "mountain_running"].includes(
      normalized.goal.goalType,
    )
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
