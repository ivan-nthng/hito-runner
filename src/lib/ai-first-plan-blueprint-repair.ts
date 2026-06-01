import type { AiBlueprintWeek, AiBlueprintWorkout } from "@/lib/ai-first-plan-blueprint-schema";
import type { AiFirstPlanBlueprintNormalizationContext } from "@/lib/ai-first-plan-blueprint-validation";
import {
  isSupportedModerateIntensityIdentity,
  resolveSupportedSpecificityIdentityOptions,
  resolveSupportedIntensityCadence,
  shouldScheduleSupportedIntensityWeek,
  shouldUseBeginnerRunWalkAdaptation,
  shouldUseLongRunSteadyFinishAsSpecificStimulus,
  shouldUseRecoveryFirstAfterLongRun,
} from "@/lib/structured-plan-authoring-policy";
import { diffDaysIso } from "@/lib/training";

type BlueprintWorkoutEntry = { week: AiBlueprintWeek; workout: AiBlueprintWorkout };
type BlueprintWorkoutByDate = Map<string, BlueprintWorkoutEntry>;
type SupportedCadenceIdentity =
  | "easy_run_with_strides"
  | "progression_run"
  | "controlled_tempo_session"
  | "half_marathon_threshold_durability"
  | "marathon_steady_specificity"
  | "race_pace_session";

export function repairBeginnerRunWalkBlueprintAdaptation({
  blueprintWorkouts,
  context,
  adaptationHorizonWeeks,
  repairs,
}: {
  blueprintWorkouts: BlueprintWorkoutByDate;
  context: AiFirstPlanBlueprintNormalizationContext;
  adaptationHorizonWeeks: number;
  repairs: string[];
}) {
  const entries = [...blueprintWorkouts.entries()].sort(([leftDate], [rightDate]) =>
    leftDate.localeCompare(rightDate),
  );

  for (const [date, entry] of entries) {
    if (
      !shouldUseBeginnerRunWalkAdaptation(
        context.authoringInput,
        entry.week.weekNumber,
        adaptationHorizonWeeks,
      ) ||
      isBeginnerAdaptationSafeBlueprintWorkout(entry.workout)
    ) {
      continue;
    }

    const repairedWorkout = buildBeginnerAdaptationBlueprintWorkout({
      workout: entry.workout,
      defaultHrAllowed: context.defaultHrAllowed,
    });

    blueprintWorkouts.set(date, {
      ...entry,
      workout: repairedWorkout,
    });
    repairs.push(
      `${date}: beginner run/walk adaptation changed ${entry.workout.workoutIdentity} to ${repairedWorkout.workoutIdentity}.`,
    );
  }
}

export function repairRecoveryFirstBlueprintSequencing({
  blueprintWorkouts,
  context,
  repairs,
}: {
  blueprintWorkouts: BlueprintWorkoutByDate;
  context: AiFirstPlanBlueprintNormalizationContext;
  repairs: string[];
}) {
  if (!shouldUseRecoveryFirstAfterLongRun(context.authoringInput)) {
    return;
  }

  const entries = [...blueprintWorkouts.entries()].sort(([leftDate], [rightDate]) =>
    leftDate.localeCompare(rightDate),
  );

  for (let index = 0; index < entries.length; index += 1) {
    const [longRunDate, longRunEntry] = entries[index]!;

    if (!isBlueprintLongRunWorkout(longRunEntry.workout)) {
      continue;
    }

    const nextEntry = entries[index + 1] ?? null;

    if (!nextEntry) {
      continue;
    }

    const [nextDate, nextBlueprintEntry] = nextEntry;

    if (isRecoveryFirstBlueprintWorkout(nextBlueprintEntry.workout)) {
      continue;
    }

    const repairedWorkout = buildRecoveryFirstBlueprintWorkout({
      workout: nextBlueprintEntry.workout,
      nextDate,
      longRunDate,
      defaultHrAllowed: context.defaultHrAllowed,
    });

    blueprintWorkouts.set(nextDate, {
      ...nextBlueprintEntry,
      workout: repairedWorkout,
    });
    entries[index + 1] = [
      nextDate,
      {
        ...nextBlueprintEntry,
        workout: repairedWorkout,
      },
    ];

    repairs.push(
      `${nextDate}: recovery-first sequencing changed ${nextBlueprintEntry.workout.workoutIdentity} after ${longRunDate} long run to ${repairedWorkout.workoutIdentity}.`,
    );
  }
}

export function repairSupportedIntensityBlueprintCadence({
  blueprintWorkouts,
  context,
  repairs,
}: {
  blueprintWorkouts: BlueprintWorkoutByDate;
  context: AiFirstPlanBlueprintNormalizationContext;
  repairs: string[];
}) {
  const entriesByWeek = new Map<number, Array<[string, BlueprintWorkoutEntry]>>();

  for (const entry of [...blueprintWorkouts.entries()].sort(([leftDate], [rightDate]) =>
    leftDate.localeCompare(rightDate),
  )) {
    const weekEntries = entriesByWeek.get(entry[1].week.weekNumber) ?? [];
    weekEntries.push(entry);
    entriesByWeek.set(entry[1].week.weekNumber, weekEntries);
  }

  for (const [weekNumber, entries] of entriesByWeek) {
    const cadence = resolveSupportedIntensityCadence(context.authoringInput, weekNumber);

    if (!cadence.applies) {
      continue;
    }

    const scheduledWeek = shouldScheduleSupportedIntensityWeek(
      context.authoringInput,
      weekNumber,
      cadence,
    );
    const specificityOptions = scheduledWeek
      ? resolveSupportedSpecificityIdentityOptions(context.authoringInput, weekNumber, cadence)
      : [];
    const longRunSteadyFinishCounts =
      scheduledWeek &&
      shouldUseLongRunSteadyFinishAsSpecificStimulus(context.authoringInput, weekNumber, cadence);
    let keptModerateTouch = false;

    if (longRunSteadyFinishCounts) {
      const longRunEntry = entries.find(([, entry]) => isBlueprintLongRunWorkout(entry.workout));

      if (longRunEntry) {
        const [longRunDate, entry] = longRunEntry;

        if (entry.workout.workoutIdentity !== "long_run_with_steady_finish") {
          const originalIdentity = entry.workout.workoutIdentity;
          const repairedWorkout = buildLongRunSteadyFinishBlueprintWorkout({
            workout: entry.workout,
            defaultHrAllowed: context.defaultHrAllowed,
          });

          blueprintWorkouts.set(longRunDate, {
            ...entry,
            workout: repairedWorkout,
          });
          entry.workout = repairedWorkout;
          repairs.push(
            `${longRunDate}: supported-specificity cadence changed ${originalIdentity} to ${repairedWorkout.workoutIdentity}.`,
          );
        }

        keptModerateTouch = true;
      }
    }

    for (const [date, entry] of entries) {
      if (
        longRunSteadyFinishCounts &&
        entry.workout.workoutIdentity === "long_run_with_steady_finish"
      ) {
        continue;
      }

      if (!isSupportedModerateIntensityIdentity(entry.workout.workoutIdentity)) {
        continue;
      }

      const allowedIdentities: readonly SupportedCadenceIdentity[] = specificityOptions.filter(
        (identity): identity is SupportedCadenceIdentity =>
          identity !== "long_run_with_steady_finish",
      );
      const preferredAllowedIdentity = allowedIdentities[0] ?? null;
      const shouldKeepModerateTouch =
        allowedIdentities.includes(entry.workout.workoutIdentity as SupportedCadenceIdentity) &&
        !keptModerateTouch &&
        scheduledWeek;

      if (shouldKeepModerateTouch) {
        keptModerateTouch = true;
        continue;
      }

      const repairedWorkout =
        preferredAllowedIdentity && !keptModerateTouch
          ? buildSupportedCadenceBlueprintWorkout({
              workout: entry.workout,
              identity: preferredAllowedIdentity,
              defaultHrAllowed: context.defaultHrAllowed,
            })
          : buildEasySupportBlueprintWorkout({
              workout: entry.workout,
              defaultHrAllowed: context.defaultHrAllowed,
            });

      if (preferredAllowedIdentity && !keptModerateTouch) {
        keptModerateTouch = true;
      }

      blueprintWorkouts.set(date, {
        ...entry,
        workout: repairedWorkout,
      });
      repairs.push(
        `${date}: supported-intensity cadence changed ${entry.workout.workoutIdentity} to ${repairedWorkout.workoutIdentity}.`,
      );
    }
  }
}

function isBeginnerAdaptationSafeBlueprintWorkout(workout: AiBlueprintWorkout) {
  return (
    workout.workoutFamily === "long" ||
    workout.workoutIdentity === "easy_aerobic_run" ||
    workout.workoutIdentity === "recovery_jog" ||
    workout.workoutIdentity === "cutback_aerobic_run"
  );
}

function buildBeginnerAdaptationBlueprintWorkout({
  workout,
  defaultHrAllowed,
}: {
  workout: AiBlueprintWorkout;
  defaultHrAllowed: boolean;
}): AiBlueprintWorkout {
  return {
    ...workout,
    workoutFamily: "easy",
    workoutIdentity: "easy_aerobic_run",
    calendarIconKey: "easy",
    title: "Run/walk adaptation",
    summary: "Beginner-friendly run/walk adaptation with planned walk breaks.",
    plannedRpe: Math.min(workout.plannedRpe, 4),
    estimatedFatigue: "low",
    recoveryPriority: "high",
    segmentIntent: "easy_aerobic",
    metricIntent: defaultHrAllowed ? "default_hr_if_allowed" : "effort_only",
  };
}

function buildRecoveryFirstBlueprintWorkout({
  workout,
  nextDate,
  longRunDate,
  defaultHrAllowed,
}: {
  workout: AiBlueprintWorkout;
  nextDate: string;
  longRunDate: string;
  defaultHrAllowed: boolean;
}): AiBlueprintWorkout {
  const gapDays = diffDaysIso(nextDate, longRunDate);
  const useRecovery = gapDays <= 2;

  return {
    ...workout,
    workoutFamily: useRecovery ? "recovery" : "easy",
    workoutIdentity: useRecovery ? "recovery_jog" : "easy_aerobic_run",
    calendarIconKey: useRecovery ? "recovery" : "easy",
    title: useRecovery ? "Recovery jog" : "Easy aerobic run",
    summary: useRecovery
      ? "Very easy recovery running after the previous long run."
      : "Comfortable easy aerobic running after the previous long run.",
    plannedRpe: useRecovery ? Math.min(workout.plannedRpe, 3) : Math.min(workout.plannedRpe, 4),
    estimatedFatigue: useRecovery ? "very_low" : "low",
    recoveryPriority: "high",
    segmentIntent: useRecovery ? "recovery" : "easy_aerobic",
    metricIntent: defaultHrAllowed ? "default_hr_if_allowed" : "effort_only",
  };
}

function buildSupportedCadenceBlueprintWorkout({
  workout,
  identity,
  defaultHrAllowed,
}: {
  workout: AiBlueprintWorkout;
  identity: SupportedCadenceIdentity;
  defaultHrAllowed: boolean;
}): AiBlueprintWorkout {
  switch (identity) {
    case "race_pace_session":
      return {
        ...workout,
        workoutFamily: "race",
        workoutIdentity: "race_pace_session",
        calendarIconKey: "race",
        title: "Controlled race-rhythm session",
        summary: "Selective race-specific rhythm only because benchmark and device gates allow it.",
        plannedRpe: Math.min(Math.max(workout.plannedRpe, 6), 7),
        estimatedFatigue: "medium",
        recoveryPriority: "medium",
        segmentIntent: "race_tuneup",
        metricIntent: "pace_if_allowed",
      };
    case "half_marathon_threshold_durability":
      return {
        ...workout,
        workoutFamily: "tempo",
        workoutIdentity: "half_marathon_threshold_durability",
        calendarIconKey: "tempo",
        title: "Half marathon threshold durability",
        summary: "Controlled threshold durability for supported half-marathon specificity.",
        plannedRpe: Math.min(Math.max(workout.plannedRpe, 6), 7),
        estimatedFatigue: "medium",
        recoveryPriority: "medium",
        segmentIntent: "threshold_durability",
        metricIntent: defaultHrAllowed ? "mixed_if_allowed" : "effort_only",
      };
    case "marathon_steady_specificity":
      return {
        ...workout,
        workoutFamily: "steady",
        workoutIdentity: "marathon_steady_specificity",
        calendarIconKey: "steady",
        title: "Marathon steady specificity",
        summary: "Controlled marathon-aerobic durability without unsupported race-pace precision.",
        plannedRpe: Math.min(Math.max(workout.plannedRpe, 5), 6),
        estimatedFatigue: "medium",
        recoveryPriority: "medium",
        segmentIntent: "marathon_steady",
        metricIntent: defaultHrAllowed ? "mixed_if_allowed" : "effort_only",
      };
    case "controlled_tempo_session":
      return {
        ...workout,
        workoutFamily: "tempo",
        workoutIdentity: "controlled_tempo_session",
        calendarIconKey: "tempo",
        title: "Controlled tempo session",
        summary: "One controlled tempo touch placed by backend support-evidence cadence.",
        plannedRpe: Math.min(Math.max(workout.plannedRpe, 6), 7),
        estimatedFatigue: "medium",
        recoveryPriority: "medium",
        segmentIntent: "tempo_sustained",
        metricIntent: defaultHrAllowed ? "mixed_if_allowed" : "effort_only",
      };
    case "progression_run":
      return {
        ...workout,
        workoutFamily: "progression",
        workoutIdentity: "progression_run",
        calendarIconKey: "progression",
        title: "Progression run",
        summary: "Begin easy and finish with a controlled steady lift, not a race effort.",
        plannedRpe: Math.min(Math.max(workout.plannedRpe, 5), 6),
        estimatedFatigue: "medium",
        recoveryPriority: "medium",
        segmentIntent: "progression",
        metricIntent: defaultHrAllowed ? "mixed_if_allowed" : "effort_only",
      };
    case "easy_run_with_strides":
      return {
        ...workout,
        workoutFamily: "easy",
        workoutIdentity: "easy_run_with_strides",
        calendarIconKey: "easy",
        title: "Easy run with relaxed strides",
        summary: "Easy aerobic running with short relaxed strides for safe leg speed.",
        plannedRpe: Math.min(Math.max(workout.plannedRpe, 4), 5),
        estimatedFatigue: "low",
        recoveryPriority: "medium",
        segmentIntent: "easy_aerobic",
        metricIntent: defaultHrAllowed ? "default_hr_if_allowed" : "effort_only",
      };
  }
}

function buildEasySupportBlueprintWorkout({
  workout,
  defaultHrAllowed,
}: {
  workout: AiBlueprintWorkout;
  defaultHrAllowed: boolean;
}): AiBlueprintWorkout {
  return {
    ...workout,
    workoutFamily: "easy",
    workoutIdentity: "easy_aerobic_run",
    calendarIconKey: "easy",
    title: "Easy aerobic run",
    summary: "Comfortable aerobic support running after cadence safety downgrade.",
    plannedRpe: Math.min(workout.plannedRpe, 4),
    estimatedFatigue: "low",
    recoveryPriority: "medium",
    segmentIntent: "easy_aerobic",
    metricIntent: defaultHrAllowed ? "default_hr_if_allowed" : "effort_only",
  };
}

function buildLongRunSteadyFinishBlueprintWorkout({
  workout,
  defaultHrAllowed,
}: {
  workout: AiBlueprintWorkout;
  defaultHrAllowed: boolean;
}): AiBlueprintWorkout {
  return {
    ...workout,
    workoutFamily: "long",
    workoutIdentity: "long_run_with_steady_finish",
    calendarIconKey: "long",
    title: "Long run with steady finish",
    summary:
      "Easy long-run base with one controlled steady finish as the week's specific stimulus.",
    plannedRpe: Math.min(Math.max(workout.plannedRpe, 5), 6),
    estimatedFatigue: "medium",
    recoveryPriority: "high",
    segmentIntent: "long_steady_finish",
    metricIntent: defaultHrAllowed ? "default_hr_if_allowed" : "effort_only",
  };
}

function isBlueprintLongRunWorkout(workout: AiBlueprintWorkout) {
  return (
    workout.workoutFamily === "long" ||
    workout.workoutIdentity === "hike_run_endurance" ||
    workout.workoutIdentity === "mountain_long_run_time_on_feet" ||
    workout.workoutIdentity === "ultra_time_on_feet_durability"
  );
}

function isRecoveryFirstBlueprintWorkout(workout: AiBlueprintWorkout) {
  return (
    workout.workoutIdentity === "recovery_jog" || workout.workoutIdentity === "easy_aerobic_run"
  );
}
