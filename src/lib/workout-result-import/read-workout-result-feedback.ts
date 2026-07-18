import "@tanstack/react-start/server-only";

import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { readWorkoutComparisonDifferencePayload } from "@/lib/workout-result-import/comparison-payload";
import { buildWorkoutResultEvidenceBundle } from "@/lib/workout-result-import/evidence-bundle";
import type {
  WorkoutAiInsightSummary,
  WorkoutActualMetricsSummary,
  WorkoutComparisonSummary,
  WorkoutFeedbackMarkerSummary,
  WorkoutResultAssetSummary,
} from "@/lib/workout-result-import/types";

type PersistedWorkoutResultAssetRow = Database["public"]["Tables"]["workout_result_assets"]["Row"];
type PersistedWorkoutActualMetricsRow =
  Database["public"]["Tables"]["workout_actual_metrics"]["Row"];
type PersistedWorkoutComparisonRow = Database["public"]["Tables"]["workout_comparisons"]["Row"];
type PersistedWorkoutAiInsightRow = Database["public"]["Tables"]["workout_ai_insights"]["Row"];

export async function getLatestWorkoutResultFeedback(plannedWorkoutId: string) {
  const supabase = createAdminSupabaseClient();
  const assetResult = await supabase
    .from("workout_result_assets")
    .select("*")
    .eq("planned_workout_id", plannedWorkoutId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assetResult.error) {
    throw new Error(assetResult.error.message);
  }

  const metricsResult = assetResult.data
    ? await supabase
        .from("workout_actual_metrics")
        .select("*")
        .eq("result_asset_id", assetResult.data.id)
        .neq("status", "superseded")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };

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

  return buildWorkoutResultEvidenceBundle({
    latestAsset,
    latestActualMetrics,
    latestComparison,
    latestAiInsight,
  });
}

export async function getWorkoutFeedbackMarkerMap(plannedWorkoutIds: string[]) {
  const uniqueWorkoutIds = Array.from(new Set(plannedWorkoutIds.filter(Boolean)));

  if (uniqueWorkoutIds.length === 0) {
    return new Map<string, WorkoutFeedbackMarkerSummary>();
  }

  const supabase = createAdminSupabaseClient();
  const assetResult = await supabase
    .from("workout_result_assets")
    .select("*")
    .in("planned_workout_id", uniqueWorkoutIds)
    .order("created_at", { ascending: false });

  if (assetResult.error) {
    throw new Error(assetResult.error.message);
  }

  const latestAssetByWorkoutId = newestByPlannedWorkoutId(assetResult.data);
  const latestAssetIds = Array.from(latestAssetByWorkoutId.values(), (row) => row.id);
  const metricsResult = latestAssetIds.length
    ? await supabase
        .from("workout_actual_metrics")
        .select("*")
        .in("result_asset_id", latestAssetIds)
        .neq("status", "superseded")
        .order("created_at", { ascending: false })
    : { data: [] as PersistedWorkoutActualMetricsRow[], error: null };

  if (metricsResult.error) {
    throw new Error(metricsResult.error.message);
  }

  const latestMetricsByAssetId = newestByResultAssetId(metricsResult.data);
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
    const latestMetricsRow = latestAssetRow
      ? (latestMetricsByAssetId.get(latestAssetRow.id) ?? null)
      : null;
    const latestComparisonRow = latestMetricsRow
      ? (latestComparisonByActualMetricsId.get(latestMetricsRow.id) ?? null)
      : null;
    const feedback = buildWorkoutResultEvidenceBundle({
      latestAsset: latestAssetRow ? resultAssetRowToSummary(latestAssetRow) : null,
      latestActualMetrics: latestMetricsRow ? actualMetricsRowToSummary(latestMetricsRow) : null,
      latestComparison: latestComparisonRow ? comparisonRowToSummary(latestComparisonRow) : null,
      latestAiInsight: null,
    });

    if (feedback.marker) {
      markerByWorkoutId.set(plannedWorkoutId, feedback.marker);
    }
  }

  return markerByWorkoutId;
}

export function resultAssetRowToSummary(
  row: PersistedWorkoutResultAssetRow,
): WorkoutResultAssetSummary {
  if (
    (row.asset_kind !== "garmin_fit" && row.asset_kind !== "garmin_zip") ||
    !["uploaded", "extracted", "parsed", "failed"].includes(row.parse_status) ||
    (row.primary_file_kind !== null && row.primary_file_kind !== "fit")
  ) {
    throw new Error("Persisted workout result asset has an unsupported canonical shape.");
  }

  return {
    id: row.id,
    plannedWorkoutId: row.planned_workout_id,
    assetKind: row.asset_kind as WorkoutResultAssetSummary["assetKind"],
    originalFileName: row.original_file_name,
    parseStatus: row.parse_status as WorkoutResultAssetSummary["parseStatus"],
    primaryFileKind: row.primary_file_kind as WorkoutResultAssetSummary["primaryFileKind"],
    primaryFileName: row.primary_file_name,
    parseError: row.parse_error,
    createdAt: row.created_at,
  };
}

export function actualMetricsRowToSummary(
  row: PersistedWorkoutActualMetricsRow,
): WorkoutActualMetricsSummary {
  if (row.source_kind !== "garmin_fit") {
    throw new Error("Persisted workout actual metrics have an unsupported source kind.");
  }

  return {
    id: row.id,
    plannedWorkoutId: row.planned_workout_id,
    resultAssetId: row.result_asset_id,
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
): WorkoutComparisonSummary | null {
  const differencePayload = readWorkoutComparisonDifferencePayload(row.difference_payload);

  if (
    !differencePayload ||
    !["complete", "partial", "insufficient_data"].includes(row.comparison_status) ||
    !["matched", "partially_matched", "unclear"].includes(row.completion_state)
  ) {
    return null;
  }

  return {
    id: row.id,
    plannedWorkoutId: row.planned_workout_id,
    actualMetricsId: row.actual_metrics_id,
    comparisonStatus: row.comparison_status as WorkoutComparisonSummary["comparisonStatus"],
    completionState: row.completion_state as WorkoutComparisonSummary["completionState"],
    comparisonConfidence: row.comparison_confidence,
    differencePayload,
    createdAt: row.created_at,
  };
}

export function workoutAiInsightRowToSummary(
  row: PersistedWorkoutAiInsightRow,
): WorkoutAiInsightSummary {
  if (
    (row.status !== "final" && row.status !== "superseded") ||
    !["keep", "soft_adjust", "review"].includes(row.recommendation_level)
  ) {
    throw new Error("Persisted workout AI insight has an unsupported canonical shape.");
  }

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
    recommendationLevel: row.recommendation_level as WorkoutAiInsightSummary["recommendationLevel"],
    cautionFlags: Array.isArray(row.caution_flags)
      ? row.caution_flags.filter((value): value is string => typeof value === "string")
      : [],
    createdAt: row.created_at,
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

function newestByResultAssetId<Row extends { result_asset_id: string }>(rows: Row[]) {
  const map = new Map<string, Row>();

  for (const row of rows) {
    if (!map.has(row.result_asset_id)) {
      map.set(row.result_asset_id, row);
    }
  }

  return map;
}
