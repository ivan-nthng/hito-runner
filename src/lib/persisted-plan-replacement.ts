import type { ImportedPlanSeed } from "@/lib/imported-plan";
import {
  normalizeCanonicalGoalContext,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
} from "@/lib/rich-workout-model";
import type { Json } from "@/lib/supabase/database";
import type { Database } from "@/lib/supabase/database";
import { normalizeExecutableStepInstructions, type Step } from "@/lib/training";

type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];

export function buildPersistedWorkoutInsertRows(
  planCycleId: string,
  userId: string,
  workouts: ImportedPlanSeed["workouts"],
) {
  return workouts.map((workout) => ({
    plan_cycle_id: planCycleId,
    user_id: userId,
    workout_date: workout.workoutDate,
    weekday: workout.weekday,
    week_number: workout.weekNumber,
    phase: workout.phase,
    workout_type: workout.workoutType,
    source_workout_id: workout.sourceWorkoutId,
    source_workout_type: workout.sourceWorkoutType,
    workout_family: workout.workoutFamily,
    workout_identity: workout.workoutIdentity,
    calendar_icon_key: workout.calendarIconKey,
    goal_context: workout.goalContext as Json,
    metric_mode: workout.metricMode as Json,
    title: workout.title,
    notes: workout.notes,
    planned_rpe: workout.plannedRpe,
    estimated_fatigue: workout.estimatedFatigue,
    recovery_priority: workout.recoveryPriority,
    steps: workout.steps as Json,
    display_order: workout.displayOrder,
  }));
}

export function persistedWorkoutRowToImportedSeed(
  workout: PersistedPlannedWorkoutRow,
  options: {
    displayOrder?: number;
    fallbackSourceWorkoutIdPrefix?: string;
    normalizeSteps?: boolean;
  } = {},
): ImportedPlanSeed["workouts"][number] {
  const rawSteps = ((workout.steps as Step[] | null) ?? []).map((step) => ({ ...step }));
  const steps =
    options.normalizeSteps === false ? rawSteps : normalizeExecutableStepInstructions(rawSteps);
  const richWorkout = resolveCanonicalWorkoutModel({
    workoutType: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    workoutFamily: workout.workout_family,
    workoutIdentity: workout.workout_identity,
    calendarIconKey: workout.calendar_icon_key,
    metricMode: workout.metric_mode,
    title: workout.title,
    steps,
  });

  return {
    workoutDate: workout.workout_date,
    weekday: workout.weekday,
    weekNumber: workout.week_number,
    phase: workout.phase,
    workoutType: workout.workout_type,
    sourceWorkoutId:
      workout.source_workout_id ??
      `${options.fallbackSourceWorkoutIdPrefix ?? "preserved"}-${workout.id}`,
    sourceWorkoutType: workout.source_workout_type ?? workout.workout_type,
    workoutFamily: richWorkout.workoutFamily,
    workoutIdentity: richWorkout.workoutIdentity,
    calendarIconKey: richWorkout.calendarIconKey,
    goalContext: normalizeCanonicalGoalContext(workout.goal_context),
    metricMode: toCanonicalMetricModeJson(richWorkout.metricMode),
    title: workout.title,
    notes: workout.notes ?? null,
    plannedRpe: workout.planned_rpe ?? null,
    estimatedFatigue: workout.estimated_fatigue ?? null,
    recoveryPriority: workout.recovery_priority ?? null,
    steps,
    displayOrder: options.displayOrder ?? workout.display_order,
  };
}

export function buildImportedLogCarryForwardPlan(
  existingWorkouts: PersistedPlannedWorkoutRow[],
  logsByWorkoutId: Map<string, PersistedWorkoutLogRow>,
  importedWorkouts: ImportedPlanSeed["workouts"],
) {
  const loggedExistingWorkouts = existingWorkouts
    .map((workout) => ({
      workout,
      log: logsByWorkoutId.get(workout.id) ?? null,
    }))
    .filter((entry) => entry.log);

  if (loggedExistingWorkouts.length === 0) {
    return {
      ok: true as const,
      logs: [] as Array<{ log: PersistedWorkoutLogRow; workoutDate: string }>,
    };
  }

  const importedWorkoutsByDate = new Map(
    importedWorkouts.map((workout) => [workout.workoutDate, workout]),
  );
  const unmatchedLoggedDates: string[] = [];
  const preservedLogs: Array<{ log: PersistedWorkoutLogRow; workoutDate: string }> = [];

  for (const entry of loggedExistingWorkouts) {
    const importedWorkout = importedWorkoutsByDate.get(entry.workout.workout_date);

    if (!importedWorkout || !isSameImportedWorkout(entry.workout, importedWorkout)) {
      unmatchedLoggedDates.push(entry.workout.workout_date);
      continue;
    }

    preservedLogs.push({
      log: entry.log!,
      workoutDate: importedWorkout.workoutDate,
    });
  }

  if (unmatchedLoggedDates.length > 0) {
    return {
      ok: false as const,
      message: `This JSON was not applied because it would detach saved workout history on ${unmatchedLoggedDates.join(", ")}. Logged days must match exactly by date and workout content before the active plan can be replaced.`,
    };
  }

  return {
    ok: true as const,
    logs: preservedLogs,
  };
}

function isSameImportedWorkout(
  existingWorkout: PersistedPlannedWorkoutRow,
  importedWorkout: ImportedPlanSeed["workouts"][number],
) {
  return (
    existingWorkout.workout_date === importedWorkout.workoutDate &&
    existingWorkout.workout_type === importedWorkout.workoutType &&
    existingWorkout.title === importedWorkout.title &&
    (existingWorkout.notes ?? null) === (importedWorkout.notes ?? null) &&
    stableJsonStringify(existingWorkout.steps ?? []) === stableJsonStringify(importedWorkout.steps)
  );
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    );
  }

  return value;
}
