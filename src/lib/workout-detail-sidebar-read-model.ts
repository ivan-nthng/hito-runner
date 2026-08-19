import "@tanstack/react-start/server-only";

import type { Database } from "@/lib/supabase/database";
import { collectRowsForIdBatches } from "@/lib/supabase/batched-in-filter";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { addDaysIso, startOfWeekIso } from "@/lib/training";
import { getFitCompletedPlannedWorkoutIds } from "@/lib/workout-result-import/read-workout-result-feedback";
import type { WorkoutDetailSidebarReadModel } from "@/lib/workout-detail-sidebar-contract";

type WorkoutSidebarPlannedWorkoutRow = Pick<
  Database["public"]["Tables"]["planned_workouts"]["Row"],
  "id" | "user_id" | "workout_date" | "workout_type"
>;

type WorkoutSidebarLogRow = Pick<
  Database["public"]["Tables"]["workout_logs"]["Row"],
  "planned_workout_id" | "user_id" | "outcome"
>;

interface BuildWorkoutSidebarWeekSummaryInput {
  userId: string;
  currentDate: string;
  plannedWorkouts: readonly WorkoutSidebarPlannedWorkoutRow[];
  logs: readonly WorkoutSidebarLogRow[];
  fitCompletedWorkoutIds: ReadonlySet<string>;
}

export async function getWorkoutDetailSidebarReadModelForUser(input: {
  userId: string;
  currentDate: string;
}): Promise<WorkoutDetailSidebarReadModel> {
  return {
    week: await readWorkoutSidebarWeekSummary(input),
  };
}

export function buildWorkoutSidebarWeekSummary(
  input: BuildWorkoutSidebarWeekSummaryInput,
): WorkoutDetailSidebarReadModel["week"] {
  const weekStartDate = startOfWeekIso(input.currentDate);
  const weekEndDate = addDaysIso(weekStartDate, 6);
  const scheduledWorkouts = input.plannedWorkouts.filter(
    (workout) =>
      workout.user_id === input.userId &&
      workout.workout_type !== "rest" &&
      workout.workout_date >= weekStartDate &&
      workout.workout_date <= weekEndDate,
  );
  const scheduledWorkoutIds = new Set(scheduledWorkouts.map((workout) => workout.id));
  const logsByWorkoutId = new Map(
    input.logs
      .filter(
        (log) => log.user_id === input.userId && scheduledWorkoutIds.has(log.planned_workout_id),
      )
      .map((log) => [log.planned_workout_id, log]),
  );
  let completedWorkoutCount = 0;

  for (const workout of scheduledWorkouts) {
    const log = logsByWorkoutId.get(workout.id) ?? null;
    const fitCompleted = input.fitCompletedWorkoutIds.has(workout.id);
    const completed = fitCompleted ? log?.outcome !== "partial" : log?.outcome === "completed";

    if (completed) {
      completedWorkoutCount += 1;
    }
  }

  return {
    scheduledWorkoutCount: scheduledWorkouts.length,
    completedWorkoutCount,
  };
}

async function readWorkoutSidebarWeekSummary(input: { userId: string; currentDate: string }) {
  const supabase = createAdminSupabaseClient();
  const weekStartDate = startOfWeekIso(input.currentDate);
  const weekEndDate = addDaysIso(weekStartDate, 6);
  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("id, user_id, workout_date, workout_type")
    .eq("user_id", input.userId)
    .neq("workout_type", "rest")
    .gte("workout_date", weekStartDate)
    .lte("workout_date", weekEndDate)
    .order("workout_date", { ascending: true })
    .order("id", { ascending: true });

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  const plannedWorkouts = workoutsResult.data ?? [];
  const plannedWorkoutIds = plannedWorkouts.map((workout) => workout.id);
  const [logs, fitCompletedWorkoutIds] = await Promise.all([
    collectRowsForIdBatches<WorkoutSidebarLogRow>(
      plannedWorkoutIds,
      async (ids) =>
        await supabase
          .from("workout_logs")
          .select("planned_workout_id, user_id, outcome")
          .eq("user_id", input.userId)
          .in("planned_workout_id", ids),
    ),
    getFitCompletedPlannedWorkoutIds({ userId: input.userId, plannedWorkoutIds }),
  ]);

  return buildWorkoutSidebarWeekSummary({
    userId: input.userId,
    currentDate: input.currentDate,
    plannedWorkouts,
    logs,
    fitCompletedWorkoutIds,
  });
}
