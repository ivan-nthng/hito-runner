import type { ImportedPlanSeed } from "@/lib/imported-plan";
import {
  persistedWorkoutRowToImportedSeed,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/persisted-plan-replacement";
import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type SupabaseAdminClient = ReturnType<typeof createAdminSupabaseClient>;

type EvidenceRow =
  | {
      table: "workout_result_assets";
      id: string;
      plannedWorkoutId: string;
      workoutLogId: string | null;
    }
  | {
      table: "workout_actual_metrics";
      id: string;
      plannedWorkoutId: string;
      workoutLogId: string | null;
    }
  | {
      table: "workout_comparisons";
      id: string;
      plannedWorkoutId: string;
    }
  | {
      table: "workout_ai_insights";
      id: string;
      plannedWorkoutId: string;
    };

export type PreservedWorkoutCarryForwardLink = {
  sourceWorkoutId: string;
  workoutDate: string;
};

export type ActivePlanCarryForwardResult = {
  importedSeed: ImportedPlanSeed;
  preservedWorkouts: PreservedWorkoutCarryForwardLink[];
};

export async function buildActivePlanReplacementCarryForward(input: {
  userId: string;
  importedSeed: ImportedPlanSeed;
  existingWorkouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  replacementStartsAt: string;
  evidenceWorkoutIds?: Set<string>;
}): Promise<ActivePlanCarryForwardResult> {
  const evidenceWorkoutIds =
    input.evidenceWorkoutIds ??
    (await fetchReplacementEvidenceWorkoutIds(
      input.userId,
      input.existingWorkouts.map((workout) => workout.id),
    ));
  const preservedRows = input.existingWorkouts
    .filter(
      (workout) =>
        workout.workout_date < input.replacementStartsAt ||
        input.logsByWorkoutId.has(workout.id) ||
        evidenceWorkoutIds.has(workout.id),
    )
    .sort(sortPersistedWorkoutRows);
  const preservedDates = new Set(preservedRows.map((workout) => workout.workout_date));
  const futureReplacementRows = input.importedSeed.workouts
    .filter((workout) => workout.workoutDate >= input.replacementStartsAt)
    .filter((workout) => !preservedDates.has(workout.workoutDate));
  const workouts = normalizeReplacementWorkoutOrder([
    ...preservedRows.map((workout) =>
      persistedWorkoutRowToImportedSeed(workout, {
        fallbackSourceWorkoutIdPrefix: "carried-forward",
        normalizeSteps: false,
      }),
    ),
    ...futureReplacementRows,
  ]);
  const firstWorkout = workouts[0];

  if (!firstWorkout) {
    throw new Error("Active-plan replacement must preserve or create at least one calendar row.");
  }

  return {
    importedSeed: {
      ...input.importedSeed,
      startDate: firstWorkout.workoutDate,
      endDate: workouts.at(-1)?.workoutDate ?? firstWorkout.workoutDate,
      workouts,
    },
    preservedWorkouts: preservedRows.map((workout) => ({
      sourceWorkoutId: workout.id,
      workoutDate: workout.workout_date,
    })),
  };
}

export async function copyCarryForwardLogs(input: {
  supabase: SupabaseAdminClient;
  userId: string;
  insertedWorkouts: PersistedPlannedWorkoutRow[];
  sourceLogsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  preservedWorkouts: PreservedWorkoutCarryForwardLink[];
}) {
  const insertedWorkoutsByDate = new Map(
    input.insertedWorkouts.map((workout) => [workout.workout_date, workout]),
  );
  const nextWorkoutIdBySourceWorkoutId = new Map<string, string>();
  const nextLogIdBySourceLogId = new Map<string, string>();
  const logRows: Database["public"]["Tables"]["workout_logs"]["Insert"][] = [];

  for (const preserved of input.preservedWorkouts) {
    const nextWorkout = insertedWorkoutsByDate.get(preserved.workoutDate);

    if (!nextWorkout) {
      throw new Error(
        `Active-plan replacement lost preserved workout history for ${preserved.workoutDate}. Current plan is unchanged.`,
      );
    }

    nextWorkoutIdBySourceWorkoutId.set(preserved.sourceWorkoutId, nextWorkout.id);
    const sourceLog = input.sourceLogsByWorkoutId.get(preserved.sourceWorkoutId);

    if (!sourceLog) {
      continue;
    }

    const nextLogId = crypto.randomUUID();
    nextLogIdBySourceLogId.set(sourceLog.id, nextLogId);
    logRows.push({
      id: nextLogId,
      planned_workout_id: nextWorkout.id,
      user_id: input.userId,
      outcome: sourceLog.outcome,
      actual_distance_km: sourceLog.actual_distance_km,
      actual_duration_min: sourceLog.actual_duration_min,
      rpe: sourceLog.rpe,
      notes: sourceLog.notes,
      intervals_completed: sourceLog.intervals_completed,
      body_notes: sourceLog.body_notes,
      logged_at: sourceLog.logged_at,
      updated_at: sourceLog.updated_at,
    });
  }

  if (logRows.length > 0) {
    const insert = await input.supabase.from("workout_logs").insert(logRows);

    if (insert.error) {
      throw new Error(insert.error.message);
    }
  }

  return {
    nextWorkoutIdBySourceWorkoutId,
    nextLogIdBySourceLogId,
  };
}

export async function relinkCarryForwardEvidence(input: {
  supabase: SupabaseAdminClient;
  userId: string;
  sourceWorkoutIds: string[];
  nextWorkoutIdBySourceWorkoutId: Map<string, string>;
  nextLogIdBySourceLogId: Map<string, string>;
}) {
  if (input.sourceWorkoutIds.length === 0) {
    return async () => {};
  }

  const rows = await loadEvidenceRows(input.supabase, input.userId, input.sourceWorkoutIds);
  const applied: EvidenceRow[] = [];

  try {
    for (const row of rows) {
      const nextWorkoutId = input.nextWorkoutIdBySourceWorkoutId.get(row.plannedWorkoutId);

      if (!nextWorkoutId) {
        continue;
      }

      if (row.table === "workout_result_assets") {
        const update = await input.supabase
          .from("workout_result_assets")
          .update({
            planned_workout_id: nextWorkoutId,
            workout_log_id: row.workoutLogId
              ? (input.nextLogIdBySourceLogId.get(row.workoutLogId) ?? null)
              : null,
          })
          .eq("id", row.id)
          .eq("user_id", input.userId);

        if (update.error) throw new Error(update.error.message);
      } else if (row.table === "workout_actual_metrics") {
        const update = await input.supabase
          .from("workout_actual_metrics")
          .update({
            planned_workout_id: nextWorkoutId,
            workout_log_id: row.workoutLogId
              ? (input.nextLogIdBySourceLogId.get(row.workoutLogId) ?? null)
              : null,
          })
          .eq("id", row.id)
          .eq("user_id", input.userId);

        if (update.error) throw new Error(update.error.message);
      } else if (row.table === "workout_comparisons") {
        const update = await input.supabase
          .from("workout_comparisons")
          .update({ planned_workout_id: nextWorkoutId })
          .eq("id", row.id)
          .eq("user_id", input.userId);

        if (update.error) throw new Error(update.error.message);
      } else {
        const update = await input.supabase
          .from("workout_ai_insights")
          .update({ planned_workout_id: nextWorkoutId })
          .eq("id", row.id)
          .eq("user_id", input.userId);

        if (update.error) throw new Error(update.error.message);
      }

      applied.push(row);
    }
  } catch (error) {
    await rollbackEvidenceRelinks(input.supabase, applied);
    throw error;
  }

  return () => rollbackEvidenceRelinks(input.supabase, applied);
}

async function fetchReplacementEvidenceWorkoutIds(userId: string, workoutIds: string[]) {
  const rows = await loadEvidenceRows(createAdminSupabaseClient(), userId, workoutIds);

  return new Set(rows.map((row) => row.plannedWorkoutId));
}

async function loadEvidenceRows(
  supabase: SupabaseAdminClient,
  userId: string,
  workoutIds: string[],
): Promise<EvidenceRow[]> {
  if (workoutIds.length === 0) {
    return [];
  }

  const [assets, metrics, comparisons, insights] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("id, planned_workout_id, workout_log_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_actual_metrics")
      .select("id, planned_workout_id, workout_log_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_comparisons")
      .select("id, planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_ai_insights")
      .select("id, planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
  ]);

  if (assets.error) throw new Error(assets.error.message);
  if (metrics.error) throw new Error(metrics.error.message);
  if (comparisons.error) throw new Error(comparisons.error.message);
  if (insights.error) throw new Error(insights.error.message);

  return [
    ...(assets.data ?? []).map((row) => ({
      table: "workout_result_assets" as const,
      id: row.id,
      plannedWorkoutId: row.planned_workout_id,
      workoutLogId: row.workout_log_id,
    })),
    ...(metrics.data ?? []).map((row) => ({
      table: "workout_actual_metrics" as const,
      id: row.id,
      plannedWorkoutId: row.planned_workout_id,
      workoutLogId: row.workout_log_id,
    })),
    ...(comparisons.data ?? []).map((row) => ({
      table: "workout_comparisons" as const,
      id: row.id,
      plannedWorkoutId: row.planned_workout_id,
    })),
    ...(insights.data ?? []).map((row) => ({
      table: "workout_ai_insights" as const,
      id: row.id,
      plannedWorkoutId: row.planned_workout_id,
    })),
  ];
}

async function rollbackEvidenceRelinks(supabase: SupabaseAdminClient, rows: EvidenceRow[]) {
  for (const row of rows.slice().reverse()) {
    if (row.table === "workout_result_assets") {
      const rollback = await supabase
        .from("workout_result_assets")
        .update({
          planned_workout_id: row.plannedWorkoutId,
          workout_log_id: row.workoutLogId,
        })
        .eq("id", row.id);

      if (rollback.error) throw new Error(rollback.error.message);
    } else if (row.table === "workout_actual_metrics") {
      const rollback = await supabase
        .from("workout_actual_metrics")
        .update({
          planned_workout_id: row.plannedWorkoutId,
          workout_log_id: row.workoutLogId,
        })
        .eq("id", row.id);

      if (rollback.error) throw new Error(rollback.error.message);
    } else if (row.table === "workout_comparisons") {
      const rollback = await supabase
        .from("workout_comparisons")
        .update({ planned_workout_id: row.plannedWorkoutId })
        .eq("id", row.id);

      if (rollback.error) throw new Error(rollback.error.message);
    } else {
      const rollback = await supabase
        .from("workout_ai_insights")
        .update({ planned_workout_id: row.plannedWorkoutId })
        .eq("id", row.id);

      if (rollback.error) throw new Error(rollback.error.message);
    }
  }
}

function normalizeReplacementWorkoutOrder(workouts: ImportedPlanSeed["workouts"]) {
  return workouts
    .slice()
    .sort(sortImportedWorkouts)
    .map((workout, index) => ({
      ...workout,
      displayOrder: index,
    }));
}

function sortImportedWorkouts(
  left: ImportedPlanSeed["workouts"][number],
  right: ImportedPlanSeed["workouts"][number],
) {
  return left.workoutDate === right.workoutDate
    ? left.displayOrder - right.displayOrder
    : left.workoutDate.localeCompare(right.workoutDate);
}

function sortPersistedWorkoutRows(
  left: PersistedPlannedWorkoutRow,
  right: PersistedPlannedWorkoutRow,
) {
  return left.workout_date === right.workout_date
    ? left.display_order - right.display_order
    : left.workout_date.localeCompare(right.workout_date);
}
