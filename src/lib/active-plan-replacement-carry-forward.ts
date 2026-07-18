import type { ImportedPlanSeed } from "@/lib/imported-plan";
import {
  persistedWorkoutRowToImportedSeed,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/persisted-plan-replacement";
import type { Database, Json } from "@/lib/supabase/database";
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
      differencePayload: Database["public"]["Tables"]["workout_comparisons"]["Row"]["difference_payload"];
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

export type ActivePlanHistoryDisposition = "carry_forward" | "archive_only";

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

export async function prepareActivePlanReplacementPersistence(input: {
  supabase: SupabaseAdminClient;
  userId: string;
  insertedWorkouts: Array<{ id: string; workout_date: string }>;
  currentWorkoutIds: string[];
  sourceLogsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  preservedWorkouts: PreservedWorkoutCarryForwardLink[];
  historyDisposition: ActivePlanHistoryDisposition;
}) {
  const evidenceRows = await loadEvidenceRows(
    input.supabase,
    input.userId,
    input.currentWorkoutIds,
  );
  const expectedHistory = buildExpectedHistorySnapshot(input, evidenceRows);

  if (input.historyDisposition === "archive_only") {
    return {
      logRows: [] as unknown as Json,
      evidenceRelinks: [] as unknown as Json,
      expectedHistory,
    };
  }

  const insertedWorkoutsByDate = new Map(
    input.insertedWorkouts.map((workout) => [workout.workout_date, workout]),
  );
  const nextWorkoutIdBySourceWorkoutId = new Map<string, string>();
  const nextLogIdBySourceLogId = new Map<string, string>();
  const logRows: Array<{
    id: string;
    planned_workout_id: string;
    source_log_id: string;
    source_workout_id: string;
  }> = [];

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
      source_log_id: sourceLog.id,
      source_workout_id: preserved.sourceWorkoutId,
    });
  }

  const evidenceRelinks = evidenceRows.map((row) => {
    const targetWorkoutId = nextWorkoutIdBySourceWorkoutId.get(row.plannedWorkoutId);

    if (!targetWorkoutId) {
      throw new Error(
        `Active-plan replacement lost evidence-backed workout ${row.plannedWorkoutId}. Current plan is unchanged.`,
      );
    }

    if (row.table === "workout_comparisons") {
      return {
        table: row.table,
        id: row.id,
        source_workout_id: row.plannedWorkoutId,
        target_workout_id: targetWorkoutId,
        source_difference_payload: row.differencePayload,
        target_difference_payload: relinkComparisonPlannedWorkoutIdentity(
          row.differencePayload,
          row.plannedWorkoutId,
          targetWorkoutId,
        ),
      };
    }

    if (row.table === "workout_result_assets" || row.table === "workout_actual_metrics") {
      return {
        table: row.table,
        id: row.id,
        source_workout_id: row.plannedWorkoutId,
        target_workout_id: targetWorkoutId,
        source_workout_log_id: row.workoutLogId,
        target_workout_log_id: row.workoutLogId
          ? (nextLogIdBySourceLogId.get(row.workoutLogId) ?? null)
          : null,
      };
    }

    return {
      table: row.table,
      id: row.id,
      source_workout_id: row.plannedWorkoutId,
      target_workout_id: targetWorkoutId,
    };
  });

  return {
    logRows: logRows as unknown as Json,
    evidenceRelinks: evidenceRelinks as unknown as Json,
    expectedHistory,
  };
}

function buildExpectedHistorySnapshot(
  input: {
    currentWorkoutIds: string[];
    sourceLogsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  },
  evidenceRows: EvidenceRow[],
) {
  return {
    workout_ids: input.currentWorkoutIds.slice().sort(),
    log_ids: [...input.sourceLogsByWorkoutId.values()].map((log) => log.id).sort(),
    asset_ids: evidenceRows
      .filter((row) => row.table === "workout_result_assets")
      .map((row) => row.id)
      .sort(),
    metric_ids: evidenceRows
      .filter((row) => row.table === "workout_actual_metrics")
      .map((row) => row.id)
      .sort(),
    comparison_ids: evidenceRows
      .filter((row) => row.table === "workout_comparisons")
      .map((row) => row.id)
      .sort(),
    insight_ids: evidenceRows
      .filter((row) => row.table === "workout_ai_insights")
      .map((row) => row.id)
      .sort(),
  } as Json;
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
      .select("id, planned_workout_id, difference_payload")
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
      differencePayload: row.difference_payload,
    })),
    ...(insights.data ?? []).map((row) => ({
      table: "workout_ai_insights" as const,
      id: row.id,
      plannedWorkoutId: row.planned_workout_id,
    })),
  ];
}

export function relinkComparisonPlannedWorkoutIdentity(
  value: Database["public"]["Tables"]["workout_comparisons"]["Row"]["difference_payload"],
  sourceWorkoutId: string,
  nextWorkoutId: string,
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Comparison evidence payload is malformed and cannot be carried forward.");
  }

  const plannedWorkout = value.plannedWorkout;

  if (
    !plannedWorkout ||
    typeof plannedWorkout !== "object" ||
    Array.isArray(plannedWorkout) ||
    plannedWorkout.plannedWorkoutId !== sourceWorkoutId
  ) {
    throw new Error(
      "Comparison evidence payload does not match its source workout and cannot be carried forward.",
    );
  }

  return {
    ...value,
    plannedWorkout: {
      ...plannedWorkout,
      plannedWorkoutId: nextWorkoutId,
    },
  };
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
