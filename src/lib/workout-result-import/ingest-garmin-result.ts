import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  deriveWeekStatus,
  inferWorkoutStatus,
  weekOf,
  workoutDistanceKm,
  workoutDuration,
  type Step,
  type Workout,
  type WorkoutLog,
} from "@/lib/training";
import { buildDeterministicWorkoutComparison } from "@/lib/workout-result-import/compare-workout-result";
import {
  extractPrimaryFitFromArchive,
  classifyWorkoutResultUpload,
} from "@/lib/workout-result-import/archive";
import {
  clampWorkoutAiInsight,
  generateWorkoutAiInsight,
  type WorkoutAiPromptInput,
} from "@/lib/workout-result-import/generate-workout-ai-insight";
import { parseGarminFitActivity } from "@/lib/workout-result-import/parse-garmin-fit";
import {
  MAX_WORKOUT_RESULT_UPLOAD_BYTES,
  WorkoutAiInsightSummary,
  WORKOUT_RESULT_STORAGE_BUCKET,
  WorkoutActualMetricsSummary,
  WorkoutComparisonDifferencePayload,
  WorkoutComparisonSummary,
  WorkoutFeedbackMarkerSummary,
  WorkoutResultAssetKind,
  WorkoutResultAssetSummary,
  WorkoutResultFeedbackSummary,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";

type PersistedWorkoutResultAssetRow = Database["public"]["Tables"]["workout_result_assets"]["Row"];
type PersistedWorkoutActualMetricsRow =
  Database["public"]["Tables"]["workout_actual_metrics"]["Row"];
type PersistedWorkoutComparisonRow = Database["public"]["Tables"]["workout_comparisons"]["Row"];
type PersistedWorkoutAiInsightRow = Database["public"]["Tables"]["workout_ai_insights"]["Row"];
type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];
type OwnedPlannedWorkoutRow = Pick<
  Database["public"]["Tables"]["planned_workouts"]["Row"],
  | "id"
  | "plan_cycle_id"
  | "user_id"
  | "workout_date"
  | "weekday"
  | "week_number"
  | "phase"
  | "workout_type"
  | "source_workout_type"
  | "title"
  | "notes"
  | "steps"
  | "display_order"
>;

export async function ingestGarminWorkoutResult(params: {
  userId: string;
  plannedWorkoutId: string;
  file: File;
}) {
  const { userId, plannedWorkoutId, file } = params;
  const originalFileName = file.name.trim();

  if (!originalFileName) {
    throw new WorkoutResultImportError(
      "invalid_upload",
      "Choose a .fit file or Garmin ZIP archive first.",
    );
  }

  if (file.size <= 0) {
    throw new WorkoutResultImportError("invalid_upload", "The uploaded file was empty.");
  }

  if (file.size > MAX_WORKOUT_RESULT_UPLOAD_BYTES) {
    throw new WorkoutResultImportError(
      "file_too_large",
      "The uploaded file is larger than the 25 MB first-release limit.",
      413,
    );
  }

  const assetKind = classifyWorkoutResultUpload(originalFileName);
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const supabase = createAdminSupabaseClient();
  const plannedWorkout = await getOwnedPlannedWorkout(userId, plannedWorkoutId);
  const existingLog = await getExistingWorkoutLog(plannedWorkoutId);
  const assetId = randomUUID();
  const storagePath = buildStoragePath({
    userId,
    plannedWorkoutId,
    assetId,
    originalFileName,
  });

  const uploaded = await supabase.storage
    .from(WORKOUT_RESULT_STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: normalizeMimeType(file.type, assetKind),
      upsert: false,
    });

  if (uploaded.error) {
    throw new WorkoutResultImportError("storage_failed", uploaded.error.message, 500);
  }

  const assetInsert = await supabase
    .from("workout_result_assets")
    .insert({
      id: assetId,
      user_id: userId,
      planned_workout_id: plannedWorkoutId,
      workout_log_id: existingLog?.id ?? null,
      asset_kind: assetKind,
      storage_bucket: WORKOUT_RESULT_STORAGE_BUCKET,
      storage_path: storagePath,
      original_file_name: originalFileName,
      mime_type: normalizeMimeType(file.type, assetKind),
      file_size_bytes: file.size,
      parse_status: "uploaded",
    })
    .select("*")
    .single();

  if (assetInsert.error) {
    await supabase.storage.from(WORKOUT_RESULT_STORAGE_BUCKET).remove([storagePath]);
    throw new WorkoutResultImportError("persistence_failed", assetInsert.error.message, 500);
  }

  let insertedMetricsId: string | null = null;

  try {
    const primaryFile =
      assetKind === "garmin_fit"
        ? {
            primaryFileKind: "fit" as const,
            primaryFileName: originalFileName,
            fileBuffer,
          }
        : await extractPrimaryFitFromArchive(fileBuffer);

    await supabase
      .from("workout_result_assets")
      .update({
        parse_status: assetKind === "garmin_zip" ? "extracted" : "uploaded",
        primary_file_kind: primaryFile.primaryFileKind,
        primary_file_name: primaryFile.primaryFileName,
        parse_error: null,
      })
      .eq("id", assetId);

    const parsedWorkout = await parseGarminFitActivity(primaryFile.fileBuffer);

    const metricsInsert = await supabase
      .from("workout_actual_metrics")
      .insert({
        user_id: userId,
        planned_workout_id: plannedWorkoutId,
        workout_log_id: existingLog?.id ?? null,
        result_asset_id: assetId,
        source_kind: parsedWorkout.sourceKind,
        status: "normalized",
        activity_started_at: parsedWorkout.activityStartAt,
        activity_local_date: parsedWorkout.activityLocalDate,
        actual_duration_min: parsedWorkout.totalDurationMin,
        actual_distance_km: parsedWorkout.totalDistanceKm,
        actual_avg_hr: parsedWorkout.avgHeartRate,
        actual_max_hr: parsedWorkout.maxHeartRate,
        actual_avg_power: parsedWorkout.avgPower,
        actual_max_power: parsedWorkout.maxPower,
        actual_avg_cadence: parsedWorkout.avgCadence,
        actual_calories: parsedWorkout.totalCalories,
        actual_elevation_gain_m: parsedWorkout.totalAscentM,
        actual_elevation_loss_m: parsedWorkout.totalDescentM,
        actual_interval_count: parsedWorkout.actualIntervalCount,
        actual_step_payload: parsedWorkout.actualStepPayload,
        lap_payload: parsedWorkout.lapPayload,
        summary_payload: parsedWorkout.summaryPayload,
      })
      .select("*")
      .single();

    if (metricsInsert.error) {
      throw new WorkoutResultImportError("persistence_failed", metricsInsert.error.message, 500);
    }

    insertedMetricsId = metricsInsert.data.id;

    const comparison = buildDeterministicWorkoutComparison({
      plannedWorkout,
      actualMetrics: metricsInsert.data,
    });
    const comparisonInsert = await supabase
      .from("workout_comparisons")
      .insert({
        user_id: userId,
        planned_workout_id: plannedWorkoutId,
        actual_metrics_id: metricsInsert.data.id,
        comparison_status: comparison.comparisonStatus,
        completion_state: comparison.completionState,
        difference_payload: comparison.differencePayload,
        comparison_confidence: comparison.comparisonConfidence,
      })
      .select("*")
      .single();

    if (comparisonInsert.error) {
      throw new WorkoutResultImportError("persistence_failed", comparisonInsert.error.message, 500);
    }

    const supersedeExisting = await supabase
      .from("workout_actual_metrics")
      .update({ status: "superseded" })
      .eq("planned_workout_id", plannedWorkoutId)
      .neq("id", metricsInsert.data.id)
      .neq("status", "superseded");

    if (supersedeExisting.error) {
      throw new WorkoutResultImportError(
        "persistence_failed",
        supersedeExisting.error.message,
        500,
      );
    }

    const assetUpdate = await supabase
      .from("workout_result_assets")
      .update({
        parse_status: "parsed",
        primary_file_kind: primaryFile.primaryFileKind,
        primary_file_name: primaryFile.primaryFileName,
        parse_error: null,
      })
      .eq("id", assetId)
      .select("*")
      .single();

    if (assetUpdate.error) {
      throw new WorkoutResultImportError("persistence_failed", assetUpdate.error.message, 500);
    }

    const latestAiInsight = await tryPersistWorkoutAiInsight({
      userId,
      plannedWorkout,
      actualMetrics: metricsInsert.data,
      comparison: comparisonInsert.data,
    });
    const latestAsset = resultAssetRowToSummary(assetUpdate.data);
    const latestActualMetrics = actualMetricsRowToSummary(metricsInsert.data);
    const latestComparison = comparisonRowToSummary(comparisonInsert.data);
    const marker = deriveWorkoutFeedbackMarker({
      latestAsset,
      latestActualMetrics,
      latestComparison,
      latestAiInsight,
    });

    return {
      ok: true as const,
      plannedWorkout: {
        id: plannedWorkout.id,
        workoutDate: plannedWorkout.workout_date,
        workoutType: plannedWorkout.workout_type,
      },
      marker,
      latestAsset,
      latestActualMetrics,
      latestComparison,
      latestAiInsight,
    };
  } catch (error) {
    const message =
      error instanceof WorkoutResultImportError
        ? error.message
        : error instanceof Error
          ? error.message
          : "The Garmin result could not be parsed.";

    await supabase
      .from("workout_result_assets")
      .update({
        parse_status: "failed",
        parse_error: message,
      })
      .eq("id", assetId);

    if (insertedMetricsId) {
      await supabase
        .from("workout_comparisons")
        .delete()
        .eq("actual_metrics_id", insertedMetricsId);
      await supabase.from("workout_actual_metrics").delete().eq("id", insertedMetricsId);
    }

    throw error;
  }
}

export async function getLatestWorkoutResultFeedback(plannedWorkoutId: string) {
  const supabase = createAdminSupabaseClient();
  const [assetResult, metricsResult] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("*")
      .eq("planned_workout_id", plannedWorkoutId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_actual_metrics")
      .select("*")
      .eq("planned_workout_id", plannedWorkoutId)
      .neq("status", "superseded")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (assetResult.error) {
    throw new Error(assetResult.error.message);
  }

  if (metricsResult.error) {
    throw new Error(metricsResult.error.message);
  }

  const comparisonResult = metricsResult.data
    ? await supabase
        .from("workout_comparisons")
        .select("*")
        .eq("actual_metrics_id", metricsResult.data.id)
        .maybeSingle()
    : null;

  if (comparisonResult?.error) {
    throw new Error(comparisonResult.error.message);
  }

  const aiInsightResult = comparisonResult?.data
    ? await supabase
        .from("workout_ai_insights")
        .select("*")
        .eq("comparison_id", comparisonResult.data.id)
        .eq("status", "final")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : null;

  if (aiInsightResult?.error) {
    throw new Error(aiInsightResult.error.message);
  }

  const latestAsset = assetResult.data ? resultAssetRowToSummary(assetResult.data) : null;
  const latestActualMetrics = metricsResult.data
    ? actualMetricsRowToSummary(metricsResult.data)
    : null;
  const latestComparison = comparisonResult?.data
    ? comparisonRowToSummary(comparisonResult.data)
    : null;
  const latestAiInsight = aiInsightResult?.data
    ? workoutAiInsightRowToSummary(aiInsightResult.data)
    : null;

  return {
    marker: deriveWorkoutFeedbackMarker({
      latestAsset,
      latestActualMetrics,
      latestComparison,
      latestAiInsight,
    }),
    latestAsset,
    latestActualMetrics,
    latestComparison,
    latestAiInsight,
  } satisfies WorkoutResultFeedbackSummary;
}

export async function removeWorkoutResultEvidence(params: {
  userId: string;
  plannedWorkoutId: string;
}) {
  const { userId, plannedWorkoutId } = params;
  await getOwnedPlannedWorkout(userId, plannedWorkoutId);

  const supabase = createAdminSupabaseClient();
  const assetResult = await supabase
    .from("workout_result_assets")
    .select("id, storage_bucket, storage_path")
    .eq("planned_workout_id", plannedWorkoutId)
    .eq("user_id", userId);

  if (assetResult.error) {
    throw new WorkoutResultImportError("persistence_failed", assetResult.error.message, 500);
  }

  const assets = assetResult.data ?? [];

  if (assets.length === 0) {
    return getLatestWorkoutResultFeedback(plannedWorkoutId);
  }

  const storagePaths = assets
    .filter((asset) => asset.storage_bucket === WORKOUT_RESULT_STORAGE_BUCKET)
    .map((asset) => asset.storage_path);

  if (storagePaths.length > 0) {
    const storageRemoval = await supabase.storage
      .from(WORKOUT_RESULT_STORAGE_BUCKET)
      .remove(storagePaths);

    if (storageRemoval.error) {
      throw new WorkoutResultImportError("storage_failed", storageRemoval.error.message, 500);
    }
  }

  const deleteResult = await supabase
    .from("workout_result_assets")
    .delete()
    .eq("planned_workout_id", plannedWorkoutId)
    .eq("user_id", userId);

  if (deleteResult.error) {
    throw new WorkoutResultImportError("persistence_failed", deleteResult.error.message, 500);
  }

  return getLatestWorkoutResultFeedback(plannedWorkoutId);
}

export async function getWorkoutFeedbackMarkerMap(plannedWorkoutIds: string[]) {
  const uniqueWorkoutIds = Array.from(new Set(plannedWorkoutIds.filter(Boolean)));

  if (uniqueWorkoutIds.length === 0) {
    return new Map<string, WorkoutFeedbackMarkerSummary>();
  }

  const supabase = createAdminSupabaseClient();
  const [assetResult, metricsResult] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("*")
      .in("planned_workout_id", uniqueWorkoutIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("workout_actual_metrics")
      .select("*")
      .in("planned_workout_id", uniqueWorkoutIds)
      .neq("status", "superseded")
      .order("created_at", { ascending: false }),
  ]);

  if (assetResult.error) {
    throw new Error(assetResult.error.message);
  }

  if (metricsResult.error) {
    throw new Error(metricsResult.error.message);
  }

  const latestAssetByWorkoutId = newestByPlannedWorkoutId(assetResult.data);
  const latestMetricsByWorkoutId = newestByPlannedWorkoutId(metricsResult.data);
  const comparisonIds = Array.from(new Set(metricsResult.data.map((row) => row.id)));
  const comparisonResult = comparisonIds.length
    ? await supabase
        .from("workout_comparisons")
        .select("*")
        .in("actual_metrics_id", comparisonIds)
        .order("created_at", { ascending: false })
    : { data: [] as PersistedWorkoutComparisonRow[], error: null };

  if (comparisonResult.error) {
    throw new Error(comparisonResult.error.message);
  }

  const latestComparisonByActualMetricsId = newestByActualMetricsId(comparisonResult.data);
  const markerByWorkoutId = new Map<string, WorkoutFeedbackMarkerSummary>();

  for (const plannedWorkoutId of uniqueWorkoutIds) {
    const latestAssetRow = latestAssetByWorkoutId.get(plannedWorkoutId) ?? null;
    const latestMetricsRow = latestMetricsByWorkoutId.get(plannedWorkoutId) ?? null;
    const latestComparisonRow = latestMetricsRow
      ? (latestComparisonByActualMetricsId.get(latestMetricsRow.id) ?? null)
      : null;
    const marker = deriveWorkoutFeedbackMarker({
      latestAsset: latestAssetRow ? resultAssetRowToSummary(latestAssetRow) : null,
      latestActualMetrics: latestMetricsRow ? actualMetricsRowToSummary(latestMetricsRow) : null,
      latestComparison: latestComparisonRow ? comparisonRowToSummary(latestComparisonRow) : null,
      latestAiInsight: null,
    });

    if (marker) {
      markerByWorkoutId.set(plannedWorkoutId, marker);
    }
  }

  return markerByWorkoutId;
}

export function deriveWorkoutFeedbackMarker(feedback: {
  latestAsset: WorkoutResultAssetSummary | null;
  latestActualMetrics: WorkoutActualMetricsSummary | null;
  latestComparison: WorkoutComparisonSummary | null;
  latestAiInsight: WorkoutAiInsightSummary | null;
}): WorkoutFeedbackMarkerSummary | null {
  if (feedback.latestComparison && feedback.latestActualMetrics) {
    return {
      state: "feedback_ready",
      sourceKind: "garmin_feedback",
    };
  }

  if (feedback.latestAsset) {
    return {
      state: "evidence_attached",
      sourceKind: "garmin_feedback",
    };
  }

  return null;
}

export function resultAssetRowToSummary(
  row: PersistedWorkoutResultAssetRow,
): WorkoutResultAssetSummary {
  return {
    id: row.id,
    assetKind: row.asset_kind,
    originalFileName: row.original_file_name,
    parseStatus: row.parse_status,
    primaryFileKind: row.primary_file_kind,
    primaryFileName: row.primary_file_name,
    parseError: row.parse_error,
    createdAt: row.created_at,
  };
}

export function actualMetricsRowToSummary(
  row: PersistedWorkoutActualMetricsRow,
): WorkoutActualMetricsSummary {
  return {
    id: row.id,
    sourceKind: row.source_kind,
    activityStartedAt: row.activity_started_at,
    activityLocalDate: row.activity_local_date,
    actualDurationMin: row.actual_duration_min,
    actualDistanceKm: row.actual_distance_km,
    actualAvgHr: row.actual_avg_hr,
    actualMaxHr: row.actual_max_hr,
    actualAvgPower: row.actual_avg_power,
    actualMaxPower: row.actual_max_power,
    actualAvgCadence: row.actual_avg_cadence,
    actualCalories: row.actual_calories,
    actualElevationGainM: row.actual_elevation_gain_m,
    actualElevationLossM: row.actual_elevation_loss_m,
    actualIntervalCount: row.actual_interval_count,
    createdAt: row.created_at,
  };
}

export function comparisonRowToSummary(
  row: PersistedWorkoutComparisonRow,
): WorkoutComparisonSummary {
  return {
    id: row.id,
    comparisonStatus: row.comparison_status,
    completionState: row.completion_state,
    comparisonConfidence: row.comparison_confidence,
    differencePayload: row.difference_payload as unknown as WorkoutComparisonDifferencePayload,
    createdAt: row.created_at,
  };
}

export function workoutAiInsightRowToSummary(
  row: PersistedWorkoutAiInsightRow,
): WorkoutAiInsightSummary {
  return {
    id: row.id,
    comparisonId: row.comparison_id,
    actualMetricsId: row.actual_metrics_id,
    model: row.model,
    responseId: row.response_id,
    status: row.status,
    analysisSummary: row.analysis_summary,
    differenceExplanation: row.difference_explanation,
    nextWorkoutRecommendation: row.next_workout_recommendation,
    recommendationLevel: row.recommendation_level,
    cautionFlags: Array.isArray(row.caution_flags)
      ? row.caution_flags.filter((value): value is string => typeof value === "string")
      : [],
    createdAt: row.created_at,
  };
}

async function getOwnedPlannedWorkout(userId: string, plannedWorkoutId: string) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from("planned_workouts")
    .select(
      "id, plan_cycle_id, user_id, workout_date, weekday, week_number, phase, workout_type, source_workout_type, title, notes, steps, display_order",
    )
    .eq("id", plannedWorkoutId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw new WorkoutResultImportError("persistence_failed", result.error.message, 500);
  }

  if (!result.data) {
    throw new WorkoutResultImportError(
      "planned_workout_not_found",
      "The target workout could not be found for this account.",
      404,
    );
  }

  if (result.data.workout_type === "rest") {
    throw new WorkoutResultImportError(
      "rest_day_not_supported",
      "Garmin result upload is not available for rest days.",
      422,
    );
  }

  return result.data;
}

async function getExistingWorkoutLog(plannedWorkoutId: string) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from("workout_logs")
    .select("id")
    .eq("planned_workout_id", plannedWorkoutId)
    .maybeSingle();

  if (result.error) {
    throw new WorkoutResultImportError("persistence_failed", result.error.message, 500);
  }

  return result.data;
}

function buildStoragePath(args: {
  userId: string;
  plannedWorkoutId: string;
  assetId: string;
  originalFileName: string;
}) {
  const ext = path.extname(args.originalFileName).toLowerCase() || ".bin";
  return `${args.userId}/${args.plannedWorkoutId}/${args.assetId}/original${ext}`;
}

function normalizeMimeType(mimeType: string, assetKind: WorkoutResultAssetKind) {
  const normalized = mimeType.trim().toLowerCase();

  if (normalized) {
    return normalized;
  }

  return assetKind === "garmin_zip" ? "application/zip" : "application/octet-stream";
}

async function tryPersistWorkoutAiInsight(args: {
  userId: string;
  plannedWorkout: OwnedPlannedWorkoutRow;
  actualMetrics: PersistedWorkoutActualMetricsRow;
  comparison: PersistedWorkoutComparisonRow;
}) {
  const { userId, plannedWorkout, actualMetrics, comparison } = args;

  try {
    const promptInput = await buildWorkoutAiPromptInput(args);
    const generated = await generateWorkoutAiInsight(promptInput);
    const boundedOutput = clampWorkoutAiInsight(promptInput, generated.output);
    const supabase = createAdminSupabaseClient();
    const insertResult = await supabase
      .from("workout_ai_insights")
      .insert({
        user_id: userId,
        planned_workout_id: plannedWorkout.id,
        actual_metrics_id: actualMetrics.id,
        comparison_id: comparison.id,
        model: generated.model,
        response_id: generated.responseId,
        status: "final",
        analysis_summary: boundedOutput.analysisSummary,
        difference_explanation: boundedOutput.differenceExplanation,
        next_workout_recommendation: boundedOutput.nextWorkoutRecommendation,
        recommendation_level: boundedOutput.recommendationLevel,
        caution_flags: boundedOutput.cautionFlags,
      })
      .select("*")
      .single();

    if (insertResult.error) {
      throw new Error(insertResult.error.message);
    }

    const supersedeResult = await supabase
      .from("workout_ai_insights")
      .update({ status: "superseded" })
      .eq("planned_workout_id", plannedWorkout.id)
      .eq("status", "final")
      .neq("id", insertResult.data.id);

    if (supersedeResult.error) {
      console.error("Failed to supersede prior workout AI insights", supersedeResult.error);
    }

    return workoutAiInsightRowToSummary(insertResult.data);
  } catch (error) {
    console.error("Workout AI insight generation failed", {
      plannedWorkoutId: plannedWorkout.id,
      actualMetricsId: actualMetrics.id,
      comparisonId: comparison.id,
      error,
    });
    return null;
  }
}

async function buildWorkoutAiPromptInput(args: {
  userId: string;
  plannedWorkout: OwnedPlannedWorkoutRow;
  actualMetrics: PersistedWorkoutActualMetricsRow;
  comparison: PersistedWorkoutComparisonRow;
}): Promise<WorkoutAiPromptInput> {
  const { userId, plannedWorkout, actualMetrics, comparison } = args;
  const supabase = createAdminSupabaseClient();
  const workoutsResult = await supabase
    .from("planned_workouts")
    .select(
      "id, plan_cycle_id, user_id, workout_date, weekday, week_number, phase, workout_type, source_workout_type, title, notes, steps, display_order",
    )
    .eq("plan_cycle_id", plannedWorkout.plan_cycle_id)
    .eq("user_id", userId)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  const workoutIds = workoutsResult.data.map((row) => row.id);
  const logsResult = workoutIds.length
    ? await supabase.from("workout_logs").select("*").in("planned_workout_id", workoutIds)
    : { data: [] as PersistedWorkoutLogRow[], error: null };

  if (logsResult.error) {
    throw new Error(logsResult.error.message);
  }

  const logsByWorkoutId = new Map(logsResult.data.map((log) => [log.planned_workout_id, log]));
  const contextDate = plannedWorkout.workout_date;
  const workouts = workoutsResult.data.map((row) =>
    persistedWorkoutRowToView(row, logsByWorkoutId.get(row.id) ?? null, contextDate),
  );
  const currentWorkout =
    workouts.find((workout) => workout.id === plannedWorkout.id) ??
    persistedWorkoutRowToView(
      plannedWorkout,
      logsByWorkoutId.get(plannedWorkout.id) ?? null,
      contextDate,
    );

  const weekWorkouts = weekOf(workouts, plannedWorkout.workout_date).filter(
    (workout) => workout.type !== "rest",
  );
  const nextWorkout = workouts.find(
    (workout) =>
      workout.type !== "rest" &&
      (workout.date > plannedWorkout.workout_date ||
        (workout.date === plannedWorkout.workout_date && workout.id !== plannedWorkout.id)),
  );
  const comparisonPayload =
    comparison.difference_payload as WorkoutComparisonDifferencePayload | null;

  return {
    plannedWorkout: {
      id: currentWorkout.id,
      date: currentWorkout.date,
      weekday: currentWorkout.weekday,
      phase: currentWorkout.phase,
      weekNumber: currentWorkout.week,
      title: currentWorkout.title,
      workoutType: currentWorkout.type,
      sourceWorkoutType: currentWorkout.sourceWorkoutType ?? null,
      notes: currentWorkout.notes,
      plannedDurationMin:
        comparisonPayload?.plannedWorkout.plannedDurationMin ?? workoutDuration(currentWorkout),
      plannedDistanceKm: comparisonPayload?.plannedWorkout.explicitPlannedDistanceKm ?? null,
      stepOutline: currentWorkout.steps.map((step, index) => ({
        sequence: step.sequence ?? index + 1,
        type: step.type,
        label: step.label ?? null,
        durationMin: step.duration_min ?? null,
        distanceKm: step.distance_km ?? null,
        repeats: step.repeats ?? null,
      })),
    },
    actualMetrics: {
      id: actualMetrics.id,
      activityLocalDate: actualMetrics.activity_local_date,
      actualDurationMin: actualMetrics.actual_duration_min,
      actualDistanceKm: actualMetrics.actual_distance_km,
      actualAvgHr: actualMetrics.actual_avg_hr,
      actualMaxHr: actualMetrics.actual_max_hr,
      actualAvgPower: actualMetrics.actual_avg_power,
      actualAvgCadence: actualMetrics.actual_avg_cadence,
      actualIntervalCount: actualMetrics.actual_interval_count,
    },
    comparison: {
      comparisonStatus: comparison.comparison_status,
      completionState: comparison.completion_state,
      comparisonConfidence: comparison.comparison_confidence,
      differencePayload:
        comparison.difference_payload as unknown as WorkoutComparisonDifferencePayload,
    },
    currentWeekContext: {
      weekNumber: currentWorkout.week,
      weekStatus: deriveWeekStatus(workouts, plannedWorkout.workout_date),
      plannedNonRestWorkoutCount: weekWorkouts.length,
      completedWorkoutCount: weekWorkouts.filter((workout) => workout.status === "completed")
        .length,
      partialWorkoutCount: weekWorkouts.filter((workout) => workout.status === "partial").length,
      skippedWorkoutCount: weekWorkouts.filter((workout) => workout.status === "skipped").length,
      pendingWorkoutCount: weekWorkouts.filter(
        (workout) => workout.status === "today" || workout.status === "upcoming",
      ).length,
    },
    nextWorkout: nextWorkout
      ? {
          date: nextWorkout.date,
          title: nextWorkout.title,
          workoutType: nextWorkout.type,
          sourceWorkoutType: nextWorkout.sourceWorkoutType ?? null,
          plannedDurationMin: workoutDuration(nextWorkout),
          plannedDistanceKm: workoutDistanceKm(nextWorkout),
          notes: nextWorkout.notes,
        }
      : null,
  };
}

function persistedWorkoutRowToView(
  workout: OwnedPlannedWorkoutRow,
  log: PersistedWorkoutLogRow | null,
  currentDate: string,
): Workout {
  const mappedLog = log ? persistedWorkoutLogToView(log) : null;

  return {
    id: workout.id,
    date: workout.workout_date,
    weekday: workout.weekday,
    week: workout.week_number,
    phase: workout.phase,
    type: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    title: workout.title,
    notes: workout.notes,
    steps: Array.isArray(workout.steps) ? (workout.steps as Step[]) : [],
    feedbackMarker: null,
    log: mappedLog,
    status: inferWorkoutStatus(workout.workout_type, workout.workout_date, currentDate, mappedLog),
  };
}

function newestByPlannedWorkoutId<Row extends { planned_workout_id: string }>(rows: Row[]) {
  const map = new Map<string, Row>();

  for (const row of rows) {
    if (!map.has(row.planned_workout_id)) {
      map.set(row.planned_workout_id, row);
    }
  }

  return map;
}

function newestByActualMetricsId<Row extends { actual_metrics_id: string }>(rows: Row[]) {
  const map = new Map<string, Row>();

  for (const row of rows) {
    if (!map.has(row.actual_metrics_id)) {
      map.set(row.actual_metrics_id, row);
    }
  }

  return map;
}

function persistedWorkoutLogToView(log: PersistedWorkoutLogRow): WorkoutLog {
  return {
    id: log.id,
    outcome: log.outcome,
    actualDistanceKm: log.actual_distance_km,
    actualDurationMin: log.actual_duration_min,
    rpe: log.rpe,
    notes: log.notes,
    intervalsCompleted: log.intervals_completed,
    loggedAt: log.logged_at,
  };
}
