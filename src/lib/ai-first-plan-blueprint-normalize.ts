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
import { normalizeAiAuthoredWorkoutSections } from "@/lib/ai-first-plan-blueprint-sections";
import type { AiFirstPlanBlueprintNormalizationContext } from "@/lib/ai-first-plan-blueprint-validation";
import { stripDisallowedDefaultEstimatedHrTargetsFromSegments } from "@/lib/default-estimated-hr-target-policy";
import { DEFAULT_ESTIMATED_HR_SOURCE_NOTE } from "@/lib/heart-rate-zones";
import {
  canonicalFamilyToLegacyWorkoutType,
  deriveExecutableModeFromSegments,
  normalizeCanonicalGoalContext,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalMetricGuidance,
  type CanonicalMetricModeJson,
} from "@/lib/rich-workout-model";
import type { StepTarget } from "@/lib/training";
import { SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND } from "@/lib/plan-creation-engine/selected-distance-endpoint";

export function normalizeBlueprintWorkout({
  blueprint,
  week,
  workout,
  date,
  context,
  repairs,
  issues,
}: {
  blueprint: AiFirstPlanBlueprint;
  week: AiBlueprintWeek;
  workout: AiBlueprintWorkout;
  date: string;
  context: AiFirstPlanBlueprintNormalizationContext;
  repairs: string[];
  issues: NormalizationIssue[];
}): CanonicalWorkout {
  const resolved = resolveCanonicalWorkoutModel({
    workoutType: canonicalFamilyToLegacyWorkoutType(workout.workoutFamily, workout.workoutIdentity),
    workoutFamily: workout.workoutFamily,
    workoutIdentity: workout.workoutIdentity,
    calendarIconKey: workout.calendarIconKey,
    title: workout.title,
  });
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
  const isSelectedDistanceEndpoint =
    canonicalWorkout.workoutIdentity === "selected_distance_completion_or_checkpoint" &&
    isSelectedDistanceEndpointDate({
      date,
      weekNumber: week.weekNumber,
      context,
    }) &&
    Boolean(context.authoringInput.planGoalIntent?.distance);

  if (isSelectedDistanceEndpoint) {
    repairs.push(
      `${date}: canonicalized selected-distance endpoint source kind while preserving AI-authored sections.`,
    );
  }

  const rawSegments = normalizeAiAuthoredWorkoutSections({
    workout: canonicalWorkout,
    date,
    issues,
  });
  const segments = stripDisallowedDefaultEstimatedHrTargetsFromSegments(rawSegments, {
    sourceWorkoutType: resolved.workoutIdentity,
    workoutType: canonicalFamilyToLegacyWorkoutType(
      resolved.workoutFamily,
      resolved.workoutIdentity,
    ),
  });

  if (
    estimateAiAuthoredWorkoutLoadMinutes(segments) >= 35 &&
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
    source_workout_type: isSelectedDistanceEndpoint
      ? SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND
      : resolved.workoutIdentity,
    workout_family: resolved.workoutFamily,
    workout_identity: resolved.workoutIdentity,
    calendar_icon_key: resolved.calendarIconKey,
    goal_context: normalizeBlueprintGoalContext(context.authoringInput, blueprint),
    metric_mode: buildWorkoutMetricMode(segments),
    title: workout.title,
    summary: workout.summary,
    planned_rpe: workout.plannedRpe,
    estimated_fatigue: workout.estimatedFatigue,
    recovery_priority: workout.recoveryPriority,
    segments,
  };
}

function isSelectedDistanceEndpointDate({
  date,
  weekNumber,
  context,
}: {
  date: string;
  weekNumber: number;
  context: AiFirstPlanBlueprintNormalizationContext;
}) {
  if (context.authoringInput.schedule.targetDate) {
    return date === context.authoringInput.schedule.targetDate;
  }

  return weekNumber === context.expectedHorizonWeeks;
}

function collectSegmentTargets(segment: CanonicalSegment) {
  const parentTarget = segment.target as Record<string, unknown> | undefined;
  const childTargets =
    segment.prescription?.mode === "repeats" && segment.prescription.children?.length
      ? segment.prescription.children
          .map((child) => child.target as Record<string, unknown> | undefined)
          .filter((target): target is Record<string, unknown> => Boolean(target))
      : [];

  return [parentTarget, ...childTargets].filter((target): target is Record<string, unknown> =>
    Boolean(target),
  );
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
      executableMode: "none",
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

function buildWorkoutMetricMode(segments: CanonicalSegment[]): CanonicalMetricModeJson {
  const hasPace = segments.some((segment) =>
    collectSegmentTargets(segment).some((target) => targetHasMetric(target, "pace")),
  );
  const hasPersonalHr = segments.some((segment) =>
    collectSegmentTargets(segment).some(
      (target) => targetHasMetric(target, "hr") && target.hr_target_source === "personal_hr_zone",
    ),
  );
  const hasDefaultEstimatedHr = segments.some((segment) =>
    collectSegmentTargets(segment).some(
      (target) =>
        targetHasMetric(target, "hr") && target.hr_target_source === "default_estimated_hr",
    ),
  );
  const executableMode =
    hasPace && hasPersonalHr
      ? "mixed_metric_executable"
      : hasPace
        ? "pace_executable"
        : hasPersonalHr
          ? "hr_executable"
          : deriveExecutableModeFromSegments(segments);
  const guidance: CanonicalMetricGuidance = hasPace
    ? hasPersonalHr
      ? "mixed"
      : "pace"
    : hasPersonalHr
      ? "heart_rate"
      : hasDefaultEstimatedHr
        ? "heart_rate"
        : "effort";

  return toCanonicalMetricModeJson({
    guidance,
    executableMode,
    paceTargetsAllowed: hasPace,
    hrTargetsAllowed: hasPersonalHr,
    hrTargetSource: hasPersonalHr
      ? "personal_hr_zone"
      : hasDefaultEstimatedHr
        ? "default_estimated_hr"
        : "effort_only",
    hrTargetLabel: hasDefaultEstimatedHr ? "Editable default estimated HR guidance" : null,
    hrTargetSourceNote: hasDefaultEstimatedHr ? DEFAULT_ESTIMATED_HR_SOURCE_NOTE : null,
    reason:
      hasPace && hasPersonalHr
        ? "Pace guidance is gated by benchmark/watch truth, and HR guidance uses personal HR-zone truth."
        : hasPace
          ? "Pace guidance is gated by benchmark/watch truth."
          : hasPersonalHr
            ? "HR guidance uses personal HR-zone truth."
            : hasDefaultEstimatedHr
              ? "Workout uses default estimated HR guidance as non-personal target fallback."
              : executableMode === "structure_only_executable"
                ? "Workout is executable by numeric duration, distance, repeat, work, and recovery structure without pace or HR targets."
                : "Workout requires correction because it lacks executable metric truth and executable numeric structure.",
  });
}

function targetHasMetric(target: StepTarget | undefined, metric: "pace" | "hr") {
  if (!target) {
    return false;
  }

  if (metric === "pace") {
    return Boolean(target.pace_min_per_km_range || target.pace_range_min_km || target.pace);
  }

  return Boolean(target.hr_bpm_range || target.hr_bpm);
}

function estimateAiAuthoredWorkoutLoadMinutes(segments: CanonicalSegment[]) {
  return segments.reduce((total, segment) => total + estimateSegmentLoadMinutes(segment), 0);
}

function estimateSegmentLoadMinutes(segment: CanonicalSegment): number {
  const prescription = segment.prescription;

  if (prescription?.mode === "time") {
    return prescription.duration_min ?? segment.duration_min ?? 0;
  }

  if (prescription?.mode === "distance") {
    return (prescription.distance_km ?? segment.distance_km ?? 0) * 6;
  }

  if (prescription?.mode === "repeats") {
    const childLoad = (prescription.children ?? []).reduce(
      (total, child) => total + estimateUnitLoadMinutes(child.prescription),
      0,
    );

    return childLoad * (prescription.repeat_count ?? 1);
  }

  if (typeof segment.duration_min === "number") {
    return segment.duration_min;
  }

  if (typeof segment.distance_km === "number") {
    return segment.distance_km * 6;
  }

  return 0;
}

function estimateUnitLoadMinutes(input: {
  mode: string;
  duration_min?: number;
  distance_km?: number;
}) {
  if (input.mode === "time") {
    return input.duration_min ?? 0;
  }

  if (input.mode === "distance") {
    return (input.distance_km ?? 0) * 6;
  }

  return 0;
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

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
