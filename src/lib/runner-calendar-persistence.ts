import { getSourcePlanProvenancesForUser } from "@/lib/source-plan-provenance-persistence";
import type { SourcePlanProvenanceRow } from "@/lib/source-plan-provenance-persistence";
import { collectRowsForIdBatches } from "@/lib/supabase/batched-in-filter";
import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
export type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];

export type CalendarWorkoutContext = {
  sourcePlansById: Map<string, SourcePlanProvenanceRow>;
  existingWorkouts: {
    workouts: PersistedPlannedWorkoutRow[];
    logsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  };
};

export async function getCalendarWorkoutMutationContext(
  userId: string,
): Promise<CalendarWorkoutContext> {
  const existingWorkouts = await getCalendarWorkoutsWithLogsForUser(userId);

  return {
    sourcePlansById: await getSourcePlanProvenancesForUser(
      userId,
      existingWorkouts.workouts.map((workout) => workout.plan_cycle_id),
    ),
    existingWorkouts,
  };
}

export async function getCalendarWorkoutsWithLogsForUser(
  userId: string,
): Promise<CalendarWorkoutContext["existingWorkouts"]> {
  const supabase = createAdminSupabaseClient();
  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  const workouts = workoutsResult.data as PersistedPlannedWorkoutRow[];
  const workoutIds = workouts.map((workout) => workout.id);
  const logs = await collectRowsForIdBatches<PersistedWorkoutLogRow>(
    workoutIds,
    async (ids) => await supabase.from("workout_logs").select("*").in("planned_workout_id", ids),
  );

  return {
    workouts,
    logsByWorkoutId: new Map(logs.map((log) => [log.planned_workout_id, log])),
  };
}
