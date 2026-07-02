import {
  FUTURE_TEMPLATE_VERSION,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import { finalizeGeneratedWorkoutRows } from "@/lib/structured-plan-authoring-finalize";
import {
  buildPreferenceNotes,
  compareWeekdays,
  chooseSupportedIntensityWeekday,
  findNextRunningWeekdayAfterLongRun,
  findPreviousRunningWeekdayBeforeLongRun,
  isoWeekday,
  phaseForWeek,
  resolveSupportedIntensityCadence,
  shouldAvoidQuality,
  shouldUseBeginnerRunWalkAdaptation,
  shouldUseCutbackSupportArchetype,
  shouldUseGentleStridesSupport,
  shouldUseRecoveryFirstAfterLongRun,
  shouldUseTaperRecoverySupportArchetype,
  slugify,
} from "@/lib/structured-plan-authoring-policy";
import {
  structuredPlanAuthoringInputSchema,
  type NormalizedStructuredInput,
  type StructuredPlanAuthoringInput,
} from "@/lib/structured-plan-authoring-schema";
import {
  buildStructuredPlanGoalIntentInput,
  distanceFamilyForStructuredGoalType,
  normalizePlanGoalIntent,
  type NormalizedPlanGoalIntent,
} from "@/lib/plan-creation-engine/plan-goal-intent";
import {
  buildLongRunWorkout,
  buildQualityWorkout,
} from "@/lib/structured-plan-authoring-sequencing";
import {
  buildAerobicStridesWorkout,
  buildCutbackAerobicWorkout,
  buildEasyWorkout,
  buildRestWorkout,
  buildSteadyWorkout,
} from "@/lib/structured-plan-authoring-workouts";
import { addDaysIso, diffDaysIso } from "@/lib/training";

export {
  structuredPlanAuthoringInputSchema,
  weekdayValues,
  type StructuredPlanAuthoringInput,
  type StructuredWeekday,
} from "@/lib/structured-plan-authoring-schema";

export function buildStructuredAuthoringPlan(input: StructuredPlanAuthoringInput): TrainingPlanV2 {
  const normalized = normalizeStructuredPlanAuthoringInput(input);
  const workouts = buildGeneratedWorkouts(normalized);

  return trainingPlanV2Schema.parse({
    schema_version: FUTURE_TEMPLATE_VERSION,
    plan_id: `generated-${slugify(normalized.goal.goalType)}-${normalized.schedule.startDate}`,
    plan_name: normalized.goal.goalLabel,
    source_kind: "structured_authoring_v1",
    created_at: new Date().toISOString(),
    generated_for: "You",
    goal: {
      goal_type: normalized.goal.goalType,
      goal_label: normalized.goal.goalLabel,
      ...(normalized.schedule.targetDate || normalized.goal.targetEventName
        ? {
            target_event: {
              ...(normalized.goal.targetEventName
                ? {
                    event_name: normalized.goal.targetEventName,
                    label: normalized.goal.targetEventName,
                  }
                : {}),
              ...(normalized.schedule.targetDate
                ? {
                    event_date: normalized.schedule.targetDate,
                    date: normalized.schedule.targetDate,
                  }
                : {}),
            },
          }
        : {}),
    },
    runner_profile: {
      experience_level: normalized.runnerProfile.experienceLevel,
      baseline_sessions_per_week: normalized.runnerProfile.baselineSessionsPerWeek,
      ...(normalized.runnerProfile.baselineLongRunKm
        ? { baseline_long_run_km: normalized.runnerProfile.baselineLongRunKm }
        : {}),
      ...(normalized.runnerProfile.baselineLongRunDurationMin
        ? { baseline_long_run_duration_min: normalized.runnerProfile.baselineLongRunDurationMin }
        : {}),
      ...(normalized.runnerProfile.age ? { age: normalized.runnerProfile.age } : {}),
      ...(normalized.runnerProfile.recentInjuryRecoveryContext
        ? {
            recent_injury_recovery_context: normalized.runnerProfile.recentInjuryRecoveryContext,
          }
        : {}),
      ...(normalized.runnerProfile.preferredEffortLanguage
        ? { preferred_effort_language: normalized.runnerProfile.preferredEffortLanguage }
        : {}),
      ...(normalized.currentLevel.recentResultSummary
        ? { recent_result_summary: normalized.currentLevel.recentResultSummary }
        : {}),
      ...(normalized.currentLevel.currentEasyPaceRange
        ? { current_easy_pace_range: normalized.currentLevel.currentEasyPaceRange }
        : {}),
      ...(normalized.currentLevel.currentTrainingLoadSummary
        ? { current_training_load_summary: normalized.currentLevel.currentTrainingLoadSummary }
        : {}),
      ...(normalized.currentLevel.recentRaceResults.length > 0
        ? {
            recent_race_results: normalized.currentLevel.recentRaceResults.map((entry) => ({
              distance: entry.distance,
              result_time: entry.resultTime,
              ...(entry.resultDate ? { result_date: entry.resultDate } : {}),
            })),
          }
        : {}),
    },
    start_date: normalized.schedule.startDate,
    preparation_horizon_weeks: normalized.schedule.horizonWeeks,
    ...(normalized.schedule.targetDate ? { target_date: normalized.schedule.targetDate } : {}),
    plan_preferences: {
      preferred_run_days: normalized.availability.runningDays,
      blocked_days: normalized.availability.unavailableDays,
      max_running_days_per_week: normalized.availability.maxRunningDaysPerWeek,
      allow_back_to_back_days: normalized.availability.allowBackToBackDays,
      preferred_long_run_day: normalized.availability.longRunDay,
      injury_constraints: normalized.constraints.injuryConstraints,
      hard_constraints: normalized.constraints.hardConstraints,
      ...(normalized.preferences.preferredWorkoutMix
        ? { preferred_workout_mix: normalized.preferences.preferredWorkoutMix }
        : {}),
      terrain_focus: normalized.preferences.terrainFocus,
      ...(normalized.preferences.strengthOrMobilityInterest
        ? {
            strength_or_mobility_interest: normalized.preferences.strengthOrMobilityInterest,
          }
        : {}),
      indoor_treadmill_ok: normalized.preferences.indoorTreadmillOk,
      ...(buildPreferenceNotes(normalized) ? { notes: buildPreferenceNotes(normalized) } : {}),
    },
    planned_workouts: workouts,
  });
}

export function normalizeStructuredPlanAuthoringInput(
  input: StructuredPlanAuthoringInput,
): NormalizedStructuredInput {
  const parsed = structuredPlanAuthoringInputSchema.parse(input);
  const runningDays = Array.from(
    new Set(
      parsed.availability.preferredRunningDays.filter(
        (day) => !parsed.availability.unavailableDays.includes(day),
      ),
    ),
  ).sort(compareWeekdays);

  if (runningDays.length === 0) {
    throw new Error("Structured plan authoring needs at least one available running day.");
  }

  const limitedRunningDays = runningDays.slice(0, parsed.availability.maxRunningDaysPerWeek);
  const longRunDay =
    parsed.availability.preferredLongRunDay &&
    limitedRunningDays.includes(parsed.availability.preferredLongRunDay)
      ? parsed.availability.preferredLongRunDay
      : (limitedRunningDays.at(-1) ?? "Sunday");
  const otherRunDays = limitedRunningDays.filter((day) => day !== longRunDay);
  const supportedIntensityCadence = resolveSupportedIntensityCadence(parsed);
  const supportedIntensityDay = chooseSupportedIntensityWeekday({
    normalized: parsed,
    runningDays: limitedRunningDays,
    longRunDay,
    otherRunDays,
  });
  const qualityDay =
    otherRunDays.length >= 1 &&
    (!shouldAvoidQuality(parsed) || supportedIntensityCadence.frequency !== "none")
      ? (supportedIntensityDay ?? otherRunDays[0] ?? null)
      : null;
  const steadyCandidates = otherRunDays.filter((day) => day !== qualityDay);
  let steadyDay =
    steadyCandidates.length >= 1 && parsed.preferences.preferredWorkoutMix !== "easy_heavy"
      ? steadyCandidates[0]
      : null;

  if (steadyDay && shouldUseRecoveryFirstAfterLongRun(parsed)) {
    steadyDay = chooseRecoverySafeSteadyDay({
      currentSteadyDay: steadyDay,
      longRunDay,
      qualityDay,
      runningDays: limitedRunningDays,
      otherRunDays,
    });
  }
  const endDate = parsed.schedule.targetDate
    ? parsed.schedule.targetDate
    : addDaysIso(parsed.schedule.startDate, parsed.schedule.preparationHorizonWeeks! * 7 - 1);
  const horizonWeeks =
    parsed.schedule.preparationHorizonWeeks ??
    Math.max(1, Math.ceil((diffDaysIso(endDate, parsed.schedule.startDate) + 1) / 7));
  const planGoalIntent = resolveStructuredPlanGoalIntent({
    parsed,
    horizonWeeks,
  });

  return {
    ...parsed,
    planGoalIntent,
    schedule: {
      ...parsed.schedule,
      horizonWeeks,
      endDate,
    },
    availability: {
      ...parsed.availability,
      preferredRunningDays: limitedRunningDays,
      runningDays: limitedRunningDays,
      longRunDay,
      qualityDay,
      steadyDay,
    },
  };
}

function resolveStructuredPlanGoalIntent(input: {
  parsed: StructuredPlanAuthoringInput;
  horizonWeeks: number;
}): NormalizedPlanGoalIntent {
  if (input.parsed.planGoalIntent) {
    return input.parsed.planGoalIntent;
  }

  const result = normalizePlanGoalIntent({
    rawIntent: buildStructuredPlanGoalIntentInput({
      goal: input.parsed.goal,
      schedule: input.parsed.schedule,
    }),
    distanceFamily: distanceFamilyForStructuredGoalType(input.parsed.goal.goalType),
    startDate: input.parsed.schedule.startDate,
    horizonWeeks: input.horizonWeeks,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.intent;
}

function chooseRecoverySafeSteadyDay({
  currentSteadyDay,
  longRunDay,
  qualityDay,
  runningDays,
  otherRunDays,
}: {
  currentSteadyDay: NormalizedStructuredInput["availability"]["steadyDay"];
  longRunDay: NormalizedStructuredInput["availability"]["longRunDay"];
  qualityDay: NormalizedStructuredInput["availability"]["qualityDay"];
  runningDays: NormalizedStructuredInput["availability"]["runningDays"];
  otherRunDays: NormalizedStructuredInput["availability"]["runningDays"];
}) {
  const nextAfterLongRun = findNextRunningWeekdayAfterLongRun(runningDays, longRunDay);

  if (currentSteadyDay !== nextAfterLongRun) {
    return currentSteadyDay;
  }

  const previousBeforeLongRun = findPreviousRunningWeekdayBeforeLongRun(runningDays, longRunDay);
  const candidates = otherRunDays.filter((day) => day !== qualityDay);
  const nonAdjacentCandidate = candidates.find(
    (day) => day !== nextAfterLongRun && day !== previousBeforeLongRun,
  );

  return nonAdjacentCandidate ?? candidates.find((day) => day !== nextAfterLongRun) ?? null;
}

function buildGeneratedWorkouts(normalized: NormalizedStructuredInput) {
  const workouts = [];
  const totalDays = diffDaysIso(normalized.schedule.endDate, normalized.schedule.startDate) + 1;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset += 1) {
    const date = addDaysIso(normalized.schedule.startDate, dayOffset);
    const weekNumber = Math.floor(dayOffset / 7) + 1;
    const weekday = isoWeekday(date);
    const workoutId = `wk_${weekNumber}_${date}`;
    const phase = phaseForWeek(weekNumber, normalized.schedule.horizonWeeks);

    if (!normalized.availability.runningDays.includes(weekday)) {
      workouts.push(buildRestWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }));
      continue;
    }

    if (weekday === normalized.availability.longRunDay) {
      workouts.push(
        buildLongRunWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
      );
      continue;
    }

    if (weekday === normalized.availability.qualityDay) {
      workouts.push(
        buildQualityWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
      );
      continue;
    }

    if (
      weekday === normalized.availability.steadyDay &&
      shouldUseGentleStridesSupport({ normalized, weekNumber, phase, weekday })
    ) {
      workouts.push(
        buildAerobicStridesWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
      );
      continue;
    }

    if (weekday === normalized.availability.steadyDay) {
      if (shouldUseBeginnerRunWalkAdaptation(normalized, weekNumber)) {
        workouts.push(
          buildEasyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
        );
        continue;
      }

      if (shouldUseCutbackSupportArchetype(normalized, weekNumber)) {
        workouts.push(
          buildCutbackAerobicWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
        );
        continue;
      }

      if (shouldUseTaperRecoverySupportArchetype({ normalized, weekNumber, phase })) {
        workouts.push(
          buildEasyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
        );
        continue;
      }

      workouts.push(
        buildSteadyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
      );
      continue;
    }

    workouts.push(buildEasyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }));
  }

  return finalizeGeneratedWorkoutRows(workouts, normalized);
}
