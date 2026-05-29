import type {
  AiBlueprintWeek,
  AiBlueprintWorkout,
  AiFirstPlanBlueprint,
  CanonicalSegment,
  CanonicalWorkout,
  NormalizationIssue,
  StructuredAuthoringInput,
} from "@/lib/ai-first-plan-blueprint-schema";
import { FUTURE_TEMPLATE_VERSION } from "@/lib/imported-plan";
import { mainLikeSegmentTypes } from "@/lib/ai-first-plan-blueprint-taxonomy";
import type { AiFirstPlanBlueprintNormalizationContext } from "@/lib/ai-first-plan-blueprint-validation";
import {
  canonicalFamilyToLegacyWorkoutType,
  normalizeCanonicalGoalContext,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalMetricGuidance,
  type CanonicalMetricModeJson,
} from "@/lib/rich-workout-model";
import { normalizeExecutableStepInstructions, type Step } from "@/lib/training";

export type BuildBlueprintWorkoutSegments = (input: {
  workout: AiBlueprintWorkout;
  date: string;
  totalDurationMin: number;
  context: AiFirstPlanBlueprintNormalizationContext;
  deterministicWorkout: CanonicalWorkout | null;
  repairs: string[];
}) => CanonicalSegment[];

export function normalizeBlueprintWorkout({
  blueprint,
  week,
  workout,
  date,
  context,
  deterministicWorkout,
  repairs,
  issues,
  buildWorkoutSegments,
}: {
  blueprint: AiFirstPlanBlueprint;
  week: AiBlueprintWeek;
  workout: AiBlueprintWorkout;
  date: string;
  context: AiFirstPlanBlueprintNormalizationContext;
  deterministicWorkout: CanonicalWorkout | null;
  repairs: string[];
  issues: NormalizationIssue[];
  buildWorkoutSegments: BuildBlueprintWorkoutSegments;
}): CanonicalWorkout {
  const resolved = resolveCanonicalWorkoutModel({
    workoutType: canonicalFamilyToLegacyWorkoutType(workout.workoutFamily, workout.workoutIdentity),
    workoutFamily: workout.workoutFamily,
    workoutIdentity: workout.workoutIdentity,
    calendarIconKey: workout.calendarIconKey,
    title: workout.title,
  });
  const totalDurationMin = estimateBlueprintWorkoutDurationMin(workout, deterministicWorkout);
  if (
    resolved.workoutFamily !== workout.workoutFamily ||
    resolved.calendarIconKey !== workout.calendarIconKey
  ) {
    repairs.push(
      `${date}: canonicalized ${workout.workoutIdentity} to family ${resolved.workoutFamily} and icon ${resolved.calendarIconKey}.`,
    );
  }
  const canonicalWorkout = {
    ...workout,
    workoutFamily: resolved.workoutFamily,
    workoutIdentity: resolved.workoutIdentity,
    calendarIconKey: resolved.calendarIconKey,
  } as AiBlueprintWorkout;
  const segments = normalizeExecutableStepInstructions(
    buildWorkoutSegments({
      workout: canonicalWorkout,
      date,
      totalDurationMin,
      context,
      deterministicWorkout,
      repairs,
    }) as unknown as Step[],
  ) as unknown as CanonicalSegment[];

  if (
    totalDurationMin >= 35 &&
    (segments.length < 3 ||
      !segments.some((segment) => segment.segment_type === "warmup") ||
      !segments.some((segment) => mainLikeSegmentTypes.has(segment.segment_type ?? "")) ||
      !segments.some((segment) => segment.segment_type === "cooldown"))
  ) {
    issues.push({
      code: "one_block_substantial_workout",
      path: `${date}.segments`,
      message: `${workout.title} did not expand into warmup/main/cooldown structure.`,
    });
  }

  return {
    workout_id: `ai-blueprint-${slugify(workout.workoutIdentity)}-${date}`,
    date,
    weekday: workout.weekday,
    week_number: week.weekNumber,
    phase: week.phase,
    workout_type: canonicalFamilyToLegacyWorkoutType(
      resolved.workoutFamily,
      resolved.workoutIdentity,
    ),
    source_workout_type: resolved.workoutIdentity,
    workout_family: resolved.workoutFamily,
    workout_identity: resolved.workoutIdentity,
    calendar_icon_key: resolved.calendarIconKey,
    goal_context: normalizeBlueprintGoalContext(context.authoringInput, blueprint),
    metric_mode: buildWorkoutMetricMode(segments, context),
    title: workout.title,
    summary: workout.summary,
    planned_rpe: workout.plannedRpe,
    estimated_fatigue: workout.estimatedFatigue,
    recovery_priority: workout.recoveryPriority,
    segments,
  };
}

export function buildRestWorkout({
  date,
  weekday,
  weekNumber,
  phase,
  context,
}: {
  date: string;
  weekday: string;
  weekNumber: number;
  phase: string;
  context: AiFirstPlanBlueprintNormalizationContext;
}): CanonicalWorkout {
  const segments: CanonicalSegment[] = [
    {
      segment_id: `ai-blueprint-rest-${date}`,
      segment_type: "rest",
      sequence: 1,
      label: "Rest",
      guidance: "No running today. Keep the day genuinely restorative.",
      prescription: { mode: "none" },
      target: { cue: "Protect the recovery day so the next run can stay controlled." },
    },
  ];

  return {
    workout_id: `ai-blueprint-rest-${date}`,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "rest",
    source_workout_type: "rest_and_recovery",
    workout_family: "rest",
    workout_identity: "rest_and_recovery",
    calendar_icon_key: "rest",
    goal_context: normalizeBlueprintGoalContext(context.authoringInput, null),
    metric_mode: toCanonicalMetricModeJson({
      guidance: "effort",
      paceTargetsAllowed: false,
      hrTargetsAllowed: false,
      hrTargetSource: "effort_only",
      hrTargetLabel: null,
      hrTargetSourceNote: null,
      reason: "Rest day has no execution metric targets.",
    }),
    title: "Rest and recovery",
    summary: "No running today. Keep the day genuinely restful.",
    planned_rpe: 1,
    estimated_fatigue: "very_low",
    recovery_priority: "high",
    segments,
  };
}

export function buildAiFirstPlanBlueprintCandidatePlan({
  blueprint,
  authoringInput,
  normalizedWorkouts,
}: {
  blueprint: AiFirstPlanBlueprint;
  authoringInput: StructuredAuthoringInput;
  normalizedWorkouts: CanonicalWorkout[];
}) {
  return {
    schema_version: FUTURE_TEMPLATE_VERSION,
    plan_id: `ai-first-plan-blueprint-${slugify(authoringInput.goal.goalType)}-${blueprint.startDate}`,
    plan_name: blueprint.planName,
    source_kind: "ai_first_plan_blueprint_v1",
    created_at: new Date(`${blueprint.startDate}T00:00:00.000Z`).toISOString(),
    generated_for: blueprint.generatedFor,
    goal: {
      goal_type: authoringInput.goal.goalType,
      goal_label: authoringInput.goal.goalLabel,
      ...(authoringInput.schedule.targetDate || authoringInput.goal.targetEventName
        ? {
            target_event: {
              ...(authoringInput.goal.targetEventName
                ? {
                    event_name: authoringInput.goal.targetEventName,
                    label: authoringInput.goal.targetEventName,
                  }
                : {}),
              ...(authoringInput.schedule.targetDate
                ? {
                    event_date: authoringInput.schedule.targetDate,
                    date: authoringInput.schedule.targetDate,
                  }
                : {}),
            },
          }
        : {}),
    },
    runner_profile: {
      experience_level: authoringInput.runnerProfile.experienceLevel,
      baseline_sessions_per_week: authoringInput.runnerProfile.baselineSessionsPerWeek,
      ...(authoringInput.runnerProfile.baselineLongRunKm
        ? { baseline_long_run_km: authoringInput.runnerProfile.baselineLongRunKm }
        : {}),
      ...(authoringInput.runnerProfile.baselineLongRunDurationMin
        ? {
            baseline_long_run_duration_min: authoringInput.runnerProfile.baselineLongRunDurationMin,
          }
        : {}),
      ...(authoringInput.runnerProfile.age ? { age: authoringInput.runnerProfile.age } : {}),
      ...(authoringInput.currentLevel.recentResultSummary
        ? { recent_result_summary: authoringInput.currentLevel.recentResultSummary }
        : {}),
      ...(authoringInput.currentLevel.currentEasyPaceRange
        ? { current_easy_pace_range: authoringInput.currentLevel.currentEasyPaceRange }
        : {}),
      ...(authoringInput.currentLevel.currentTrainingLoadSummary
        ? { current_training_load_summary: authoringInput.currentLevel.currentTrainingLoadSummary }
        : {}),
    },
    start_date: blueprint.startDate,
    preparation_horizon_weeks: blueprint.preparationHorizonWeeks,
    ...(blueprint.targetDate ? { target_date: blueprint.targetDate } : {}),
    plan_preferences: {
      preferred_running_days: authoringInput.availability.preferredRunningDays,
      blocked_days: authoringInput.availability.unavailableDays,
      preferred_long_run_day: authoringInput.availability.preferredLongRunDay ?? undefined,
      max_running_days_per_week: authoringInput.availability.maxRunningDaysPerWeek,
      allow_back_to_back_days: authoringInput.availability.allowBackToBackDays,
      terrain_focus: authoringInput.preferences.terrainFocus,
    },
    training_constraints: {
      running_days_per_week: authoringInput.availability.maxRunningDaysPerWeek,
      full_rest_days: authoringInput.availability.unavailableDays,
      ...(authoringInput.availability.preferredLongRunDay
        ? { long_run_day: authoringInput.availability.preferredLongRunDay }
        : {}),
    },
    planned_workouts: normalizedWorkouts,
  };
}

export function phaseForWeek(blueprint: AiFirstPlanBlueprint, weekNumber: number) {
  return blueprint.weeks.find((week) => week.weekNumber === weekNumber)?.phase ?? "Base";
}

function buildWorkoutMetricMode(
  segments: CanonicalSegment[],
  context: AiFirstPlanBlueprintNormalizationContext,
): CanonicalMetricModeJson {
  const hasPace = segments.some((segment) => targetHasMetric(segment.target, "pace"));
  const hasHr = segments.some((segment) => targetHasMetric(segment.target, "hr"));
  const guidance: CanonicalMetricGuidance = hasPace
    ? hasHr
      ? "mixed"
      : "pace"
    : hasHr
      ? "heart_rate"
      : "effort";

  return toCanonicalMetricModeJson({
    guidance,
    paceTargetsAllowed: hasPace,
    hrTargetsAllowed: hasHr,
    hrTargetSource: hasHr ? "default_estimated_hr" : "effort_only",
    hrTargetLabel: hasHr ? "Default HR guidance" : null,
    hrTargetSourceNote: hasHr ? "Estimated from age, not personalized zones." : null,
    reason:
      hasPace && hasHr
        ? "Pace guidance is gated by benchmark/watch truth, and HR guidance is age-estimated default guidance."
        : hasPace
          ? "Pace guidance is gated by benchmark/watch truth."
          : hasHr
            ? "HR guidance is a broad age-estimated default, not personalized zones."
            : context.estimatedMaxHr
              ? "Metric resolver keeps this workout effort-guided; default HR is not useful for this workout type."
              : "Metric resolver keeps this workout effort-guided without numeric pace or HR targets.",
  });
}

function targetHasMetric(target: Step["target"] | undefined, metric: "pace" | "hr") {
  if (!target) {
    return false;
  }

  if (metric === "pace") {
    return Boolean(target.pace_min_per_km_range || target.pace_range_min_km || target.pace);
  }

  return Boolean(target.hr_bpm_range || target.hr_bpm);
}

function normalizeBlueprintGoalContext(
  authoringInput: StructuredAuthoringInput,
  blueprint: AiFirstPlanBlueprint | null,
): CanonicalWorkout["goal_context"] {
  const normalized = normalizeCanonicalGoalContext({
    goalType: authoringInput.goal.goalType,
    goalStyle: authoringInput.goal.goalStyle ?? null,
    terrainFocus: authoringInput.preferences.terrainFocus ?? "standard",
    targetDate: authoringInput.schedule.targetDate ?? blueprint?.targetDate ?? null,
    targetTime: authoringInput.goal.targetTime ?? null,
  });

  return {
    goal_type: normalized?.goalType ?? authoringInput.goal.goalType,
    ...(normalized?.goalStyle ? { goal_style: normalized.goalStyle } : {}),
    ...(normalized?.terrainFocus ? { terrain_focus: normalized.terrainFocus } : {}),
    ...(normalized?.targetDate ? { target_date: normalized.targetDate } : {}),
    ...(normalized?.targetTime ? { target_time: normalized.targetTime } : {}),
  };
}

function estimateBlueprintWorkoutDurationMin(
  workout: AiBlueprintWorkout,
  deterministicWorkout: CanonicalWorkout | null,
) {
  const deterministicDuration = deterministicWorkout
    ? estimateCanonicalWorkoutDurationMin(deterministicWorkout)
    : 0;

  if (deterministicDuration > 0) {
    if (workout.workoutIdentity === "cutback_long_run") {
      return Math.max(35, Math.round(deterministicDuration * 0.75));
    }

    if (workout.workoutIdentity === "taper_long_run") {
      return Math.max(30, Math.round(deterministicDuration * 0.65));
    }

    if (workout.workoutIdentity === "ultra_time_on_feet_durability") {
      return Math.max(50, Math.round(deterministicDuration * 0.9));
    }

    if (workout.workoutIdentity === "hike_run_endurance") {
      return Math.max(45, Math.round(deterministicDuration * 0.9));
    }

    return deterministicDuration;
  }

  switch (workout.workoutFamily) {
    case "long":
      return 75;
    case "tempo":
    case "intervals":
    case "hills":
    case "trail":
      return 50;
    case "steady":
      return 45;
    case "recovery":
      return 30;
    default:
      return 40;
  }
}

function estimateCanonicalWorkoutDurationMin(workout: CanonicalWorkout) {
  return workout.segments.reduce((total, segment) => {
    if (typeof segment.duration_min === "number") {
      return total + segment.duration_min;
    }

    if (segment.prescription?.duration_min) {
      return total + segment.prescription.duration_min;
    }

    if (typeof segment.distance_km === "number") {
      return total + segment.distance_km * 6;
    }

    if (segment.prescription?.distance_km) {
      return total + segment.prescription.distance_km * 6;
    }

    return total;
  }, 0);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
