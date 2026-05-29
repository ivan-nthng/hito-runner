import {
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type LegacyWorkoutType,
} from "@/lib/rich-workout-model";
import { buildGeneratedWorkoutMetricMode } from "@/lib/structured-plan-authoring-metrics";
import type { NormalizedStructuredInput } from "@/lib/structured-plan-authoring-schema";

type GeneratedWorkoutDraft = {
  workout_type: LegacyWorkoutType;
  source_workout_type?: string;
  title: string;
  segments: Array<{
    segment_type?: string;
    label?: string;
    target?: Record<string, unknown>;
    recovery_target?: Record<string, unknown>;
  }>;
};

export function finalizeGeneratedWorkoutRows<T extends GeneratedWorkoutDraft>(
  workouts: T[],
  normalized: NormalizedStructuredInput,
) {
  return workouts.map((workout) => attachCanonicalWorkoutFields(workout, normalized));
}

function attachCanonicalWorkoutFields<T extends GeneratedWorkoutDraft>(
  workout: T,
  normalized: NormalizedStructuredInput,
) {
  const richWorkout = resolveCanonicalWorkoutModel({
    workoutType: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    title: workout.title,
    steps: workout.segments,
    metricMode: buildGeneratedWorkoutMetricMode(normalized, workout.segments),
  });

  return {
    ...workout,
    workout_family: richWorkout.workoutFamily,
    workout_identity: richWorkout.workoutIdentity,
    calendar_icon_key: richWorkout.calendarIconKey,
    goal_context: buildGeneratedWorkoutGoalContext(normalized),
    metric_mode: toCanonicalMetricModeJson(richWorkout.metricMode),
  };
}

function buildGeneratedWorkoutGoalContext(normalized: NormalizedStructuredInput) {
  return {
    goal_type: normalized.goal.goalType,
    ...(normalized.goal.goalStyle ? { goal_style: normalized.goal.goalStyle } : {}),
    terrain_focus: normalized.preferences.terrainFocus,
    ...(normalized.schedule.targetDate ? { target_date: normalized.schedule.targetDate } : {}),
    ...(normalized.goal.targetTime ? { target_time: normalized.goal.targetTime } : {}),
  };
}
