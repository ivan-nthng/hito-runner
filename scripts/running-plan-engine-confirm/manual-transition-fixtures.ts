import type { ExistingPlanContext } from "../../src/lib/active-plan-persistence";
import type { buildImportedPlanSeed } from "../../src/lib/imported-plan";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "../../src/lib/manual-workout-authoring/schema";
import type { Database } from "../../src/lib/supabase/database";

export type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
export type PersistedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];

type ImportedSeedWorkout = ReturnType<typeof buildImportedPlanSeed>["workouts"][number];

export function buildManualActivePlanContext(
  overrides: {
    plan?: Partial<PersistedPlanCycleRow>;
    workouts?: PersistedWorkoutRow[];
  } = {},
): ExistingPlanContext {
  const plan: PersistedPlanCycleRow = {
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-07T10:00:00Z",
    end_date: "2026-07-01",
    goal_metadata: {
      source_status: "manual_user_built_plan_created",
    },
    goal_summary: "Manual user-built plan",
    id: "manual-plan-1",
    plan_preferences: null,
    schema_version: "training-plan-v2",
    source_kind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    source_template: "manual_user_built_plan_v1",
    start_date: "2026-06-01",
    status: "active",
    target_date: null,
    title: "Manual Plan",
    user_id: "transition-dry-run-user",
    ...overrides.plan,
  };
  const workouts = overrides.workouts ?? [
    buildManualPersistedWorkout({
      id: "manual-workout-past",
      date: "2026-06-03",
      title: "Logged manual workout",
      workoutType: "easy",
      displayOrder: 0,
    }),
    buildManualPersistedWorkout({
      id: "manual-workout-future-1",
      date: "2026-06-09",
      title: "Future manual workout",
      workoutType: "quality",
      displayOrder: 1,
    }),
    buildManualPersistedWorkout({
      id: "manual-workout-future-2",
      date: "2026-06-12",
      title: "Future manual long run",
      workoutType: "long_run",
      displayOrder: 2,
    }),
  ];

  return {
    activePlan: plan,
    existingWorkouts: {
      workouts,
      logsByWorkoutId: new Map([
        [
          "manual-workout-past",
          {
            actual_distance_km: 6,
            actual_duration_min: 42,
            body_notes: null,
            id: "manual-log-1",
            intervals_completed: null,
            logged_at: "2026-06-03T12:00:00Z",
            notes: "Completed before transition.",
            outcome: "completed",
            planned_workout_id: "manual-workout-past",
            rpe: 4,
            updated_at: "2026-06-03T12:00:00Z",
            user_id: "transition-dry-run-user",
          },
        ],
      ]),
    },
  };
}

function buildManualPersistedWorkout(input: {
  id: string;
  date: string;
  title: string;
  workoutType: PersistedWorkoutRow["workout_type"];
  displayOrder: number;
}): PersistedWorkoutRow {
  return {
    calendar_icon_key: "run",
    created_at: "2026-06-01T10:00:00Z",
    display_order: input.displayOrder,
    estimated_fatigue: null,
    goal_context: {
      manual_user_built_plan: true,
    },
    id: input.id,
    metric_mode: {
      executable_mode: "structure_only_executable",
      pace_targets_allowed: false,
      hr_targets_allowed: false,
    },
    notes: null,
    phase: "Manual",
    plan_cycle_id: "manual-plan-1",
    planned_rpe: null,
    recovery_priority: null,
    source_workout_id: input.id,
    source_workout_type: "manual_workout",
    steps: [],
    title: input.title,
    user_id: "transition-dry-run-user",
    week_number: 1,
    weekday: "Tuesday",
    workout_date: input.date,
    workout_family: "easy_run",
    workout_identity: input.id,
    workout_type: input.workoutType,
  };
}

export function buildPersistedWorkoutFromSeed(
  workout: ImportedSeedWorkout,
  index: number,
  planCycleId: string,
  userId: string,
): PersistedWorkoutRow {
  return {
    calendar_icon_key: workout.calendarIconKey,
    created_at: "2026-06-08T10:00:00Z",
    display_order: index,
    estimated_fatigue: workout.estimatedFatigue,
    goal_context: workout.goalContext,
    id: `selected-workout-${index + 1}`,
    metric_mode: workout.metricMode,
    notes: workout.notes,
    phase: workout.phase,
    plan_cycle_id: planCycleId,
    planned_rpe: workout.plannedRpe,
    recovery_priority: workout.recoveryPriority,
    source_workout_id: workout.sourceWorkoutId,
    source_workout_type: workout.sourceWorkoutType,
    steps: workout.steps,
    title: workout.title,
    user_id: userId,
    week_number: workout.weekNumber,
    weekday: workout.weekday,
    workout_date: workout.workoutDate,
    workout_family: workout.workoutFamily,
    workout_identity: workout.workoutIdentity,
    workout_type: workout.workoutType,
  };
}
