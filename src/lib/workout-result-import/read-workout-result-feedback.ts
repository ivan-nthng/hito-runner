import "@tanstack/react-start/server-only";

import { digestSha256Hex } from "@/lib/review-token-signing";
import type { Database } from "@/lib/supabase/database";
import { collectRowsForIdBatches } from "@/lib/supabase/batched-in-filter";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  readWorkoutComparisonDifferencePayload,
  WORKOUT_COMPARISON_FORMULA_VERSION,
} from "@/lib/workout-result-import/comparison-payload";
import { buildWorkoutResultEvidenceBundle } from "@/lib/workout-result-import/evidence-bundle";
import type {
  ContinuationEvidencePacket,
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
type PersistedRunnerActivitySourceRevisionRow =
  Database["public"]["Tables"]["runner_activity_source_revisions"]["Row"];

export async function getLatestWorkoutResultFeedback(input: {
  userId: string;
  plannedWorkoutId: string;
}) {
  const supabase = createAdminSupabaseClient();
  const assetResult = await supabase
    .from("workout_result_assets")
    .select("*")
    .eq("user_id", input.userId)
    .eq("planned_workout_id", input.plannedWorkoutId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assetResult.error) {
    throw new Error(assetResult.error.message);
  }

  const sourceRevisionResult = assetResult.data?.activity_source_revision_id
    ? await supabase
        .from("runner_activity_source_revisions")
        .select("raw_state")
        .eq("user_id", input.userId)
        .eq("id", assetResult.data.activity_source_revision_id)
        .maybeSingle()
    : { data: null, error: null };

  if (sourceRevisionResult.error) {
    throw new Error(sourceRevisionResult.error.message);
  }

  const metricsResult = assetResult.data
    ? await supabase
        .from("workout_actual_metrics")
        .select("*")
        .eq("user_id", input.userId)
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
        .eq("user_id", input.userId)
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
        .eq("user_id", input.userId)
        .eq("comparison_id", comparisonResult.data.id)
        .eq("status", "final")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : null;

  if (aiInsightResult?.error) {
    throw new Error(aiInsightResult.error.message);
  }

  const latestAsset = assetResult.data
    ? resultAssetRowToSummary(
        assetResult.data,
        rawStateFromDatabase(sourceRevisionResult.data?.raw_state),
      )
    : null;
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

function rawStateFromDatabase(value: string | undefined) {
  return value === "available" || value === "removal_pending" || value === "removed" ? value : null;
}

export async function getFitCompletedPlannedWorkoutIds(input: {
  userId: string;
  plannedWorkoutIds: string[];
}) {
  const uniqueWorkoutIds = Array.from(new Set(input.plannedWorkoutIds.filter(Boolean)));
  if (uniqueWorkoutIds.length === 0) return new Set<string>();

  const result = await createAdminSupabaseClient().rpc(
    "list_runner_fit_completed_planned_workouts",
    {
      p_user_id: input.userId,
      p_planned_workout_ids: uniqueWorkoutIds,
    },
  );
  if (result.error) throw new Error(result.error.message);

  return new Set((result.data ?? []).map((row) => row.planned_workout_id));
}

export async function getWorkoutFeedbackMarkerMap(input: {
  userId: string;
  plannedWorkoutIds: string[];
}) {
  const uniqueWorkoutIds = Array.from(new Set(input.plannedWorkoutIds.filter(Boolean)));

  if (uniqueWorkoutIds.length === 0) {
    return new Map<string, WorkoutFeedbackMarkerSummary>();
  }

  const supabase = createAdminSupabaseClient();
  const assetRows = await collectRowsForIdBatches<PersistedWorkoutResultAssetRow>(
    uniqueWorkoutIds,
    async (ids) =>
      await supabase
        .from("workout_result_assets")
        .select("*")
        .eq("user_id", input.userId)
        .in("planned_workout_id", ids)
        .order("created_at", { ascending: false }),
  );

  const latestAssetByWorkoutId = newestByPlannedWorkoutId(
    assetRows.filter((row): row is typeof row & { planned_workout_id: string } =>
      Boolean(row.planned_workout_id),
    ),
  );
  const latestAssetIds = Array.from(latestAssetByWorkoutId.values(), (row) => row.id);
  const metricRows = await collectRowsForIdBatches<PersistedWorkoutActualMetricsRow>(
    latestAssetIds,
    async (ids) =>
      await supabase
        .from("workout_actual_metrics")
        .select("*")
        .eq("user_id", input.userId)
        .in("result_asset_id", ids)
        .neq("status", "superseded")
        .order("created_at", { ascending: false }),
  );

  const latestMetricsByAssetId = newestByResultAssetId(metricRows);
  const comparisonIds = Array.from(new Set(metricRows.map((row) => row.id)));
  const comparisonRows = await collectRowsForIdBatches<PersistedWorkoutComparisonRow>(
    comparisonIds,
    async (ids) =>
      await supabase
        .from("workout_comparisons")
        .select("*")
        .eq("user_id", input.userId)
        .in("actual_metrics_id", ids)
        .order("created_at", { ascending: false }),
  );

  const latestComparisonByActualMetricsId = newestByActualMetricsId(comparisonRows);
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

export async function getContinuationEvidencePacket(input: {
  userId: string;
  asOf: string;
  cutoffDate: string;
  calendarOutcomeFingerprint: string;
  workouts: Array<{
    calendarWorkoutId: string;
    workoutDate: string;
    workoutType: string;
    outcome: "completed" | "partial" | "skipped" | "unresolved";
    outcomeRevision: string;
    sessionRpe: number | null;
  }>;
}): Promise<ContinuationEvidencePacket> {
  const dueWorkouts = input.workouts.filter(
    (workout) => workout.workoutType !== "rest" && workout.workoutDate <= input.cutoffDate,
  );
  const workoutIds = dueWorkouts.map((workout) => workout.calendarWorkoutId);
  const supabase = createAdminSupabaseClient();
  const assetRows = await collectRowsForIdBatches<PersistedWorkoutResultAssetRow>(
    workoutIds,
    async (ids) =>
      await supabase
        .from("workout_result_assets")
        .select("*")
        .eq("user_id", input.userId)
        .in("planned_workout_id", ids)
        .order("created_at", { ascending: false }),
  );
  const latestAssetByWorkoutId = newestByPlannedWorkoutId(
    assetRows.filter((row): row is typeof row & { planned_workout_id: string } =>
      Boolean(row.planned_workout_id),
    ),
  );
  const assetIds = Array.from(latestAssetByWorkoutId.values(), (asset) => asset.id);
  const sourceRevisionIds = Array.from(
    new Set(
      Array.from(latestAssetByWorkoutId.values()).flatMap((asset) =>
        asset.activity_source_revision_id ? [asset.activity_source_revision_id] : [],
      ),
    ),
  );
  const [metricRows, sourceRevisionRows] = await Promise.all([
    collectRowsForIdBatches<PersistedWorkoutActualMetricsRow>(
      assetIds,
      async (ids) =>
        await supabase
          .from("workout_actual_metrics")
          .select("*")
          .eq("user_id", input.userId)
          .in("result_asset_id", ids)
          .neq("status", "superseded")
          .order("created_at", { ascending: false }),
    ),
    collectRowsForIdBatches<PersistedRunnerActivitySourceRevisionRow>(
      sourceRevisionIds,
      async (ids) =>
        await supabase
          .from("runner_activity_source_revisions")
          .select("*")
          .eq("user_id", input.userId)
          .in("id", ids),
    ),
  ]);
  const latestMetricsByAssetId = newestByResultAssetId(metricRows);
  const metricIds = Array.from(latestMetricsByAssetId.values(), (metrics) => metrics.id);
  const comparisonRows = await collectRowsForIdBatches<PersistedWorkoutComparisonRow>(
    metricIds,
    async (ids) =>
      await supabase
        .from("workout_comparisons")
        .select("*")
        .eq("user_id", input.userId)
        .in("actual_metrics_id", ids)
        .order("created_at", { ascending: false }),
  );
  const latestComparisonByActualMetricsId = newestByActualMetricsId(comparisonRows);
  const sourceRevisionById = new Map(sourceRevisionRows.map((row) => [row.id, row]));

  const workouts: ContinuationEvidencePacket["workouts"] = dueWorkouts.map((workout) => {
    const asset = latestAssetByWorkoutId.get(workout.calendarWorkoutId) ?? null;
    const sourceRevision = asset?.activity_source_revision_id
      ? (sourceRevisionById.get(asset.activity_source_revision_id) ?? null)
      : null;
    const metrics = asset ? (latestMetricsByAssetId.get(asset.id) ?? null) : null;
    const comparison = metrics ? (latestComparisonByActualMetricsId.get(metrics.id) ?? null) : null;
    const evidenceState = projectContinuationEvidenceState({
      outcome: workout.outcome,
      parseStatus: asset?.parse_status ?? null,
      rawState: sourceRevision?.raw_state ?? null,
      hasMetrics: Boolean(metrics),
    });
    const missingReasons: ContinuationEvidencePacket["workouts"][number]["missingReasons"] = [];
    if (workout.outcome === "unresolved") missingReasons.push("outcome_missing");
    if (evidenceState === "missing") missingReasons.push("evidence_missing");
    if (evidenceState === "updating") missingReasons.push("evidence_updating");
    if (evidenceState === "removed") missingReasons.push("evidence_removed");
    if (asset && !metrics && evidenceState !== "updating" && evidenceState !== "removed") {
      missingReasons.push("actual_metrics_missing");
    }

    return {
      calendarWorkoutId: workout.calendarWorkoutId,
      workoutDate: workout.workoutDate,
      outcome: workout.outcome,
      outcomeRevision: workout.outcomeRevision,
      sessionRpe: workout.sessionRpe,
      evidenceState,
      acceptedActualMetrics: metrics
        ? {
            activityStartedAt: metrics.activity_started_at,
            activityLocalDate: metrics.activity_local_date,
            durationMin: metrics.actual_duration_min,
            distanceKm: metrics.actual_distance_km,
            averageHeartRate: metrics.actual_avg_hr,
            maximumHeartRate: metrics.actual_max_hr,
            averagePower: metrics.actual_avg_power,
            maximumPower: metrics.actual_max_power,
            averageCadence: metrics.actual_avg_cadence,
            calories: metrics.actual_calories,
            elevationGainMetres: metrics.actual_elevation_gain_m,
            elevationLossMetres: metrics.actual_elevation_loss_m,
            intervalCount: metrics.actual_interval_count,
          }
        : null,
      comparisonStatus:
        comparison?.comparison_status === "complete" ||
        comparison?.comparison_status === "partial" ||
        comparison?.comparison_status === "insufficient_data"
          ? comparison.comparison_status
          : null,
      missingReasons,
    };
  });

  return {
    asOf: input.asOf,
    cutoffDate: input.cutoffDate,
    calendarOutcomeFingerprint: input.calendarOutcomeFingerprint,
    evidenceRevisionFingerprint: await stableEvidenceSha256(workouts),
    dueWorkoutCount: workouts.length,
    resolvedOutcomeCount: workouts.filter((workout) => workout.outcome !== "unresolved").length,
    workouts,
  };
}

export function projectContinuationEvidenceState(input: {
  outcome: "completed" | "partial" | "skipped" | "unresolved";
  parseStatus: string | null;
  rawState: string | null;
  hasMetrics: boolean;
}): ContinuationEvidencePacket["workouts"][number]["evidenceState"] {
  if (input.rawState === "removed") return "removed";
  if (
    input.rawState === "removal_pending" ||
    input.parseStatus === "uploaded" ||
    input.parseStatus === "extracted"
  ) {
    return "updating";
  }
  if (input.hasMetrics) return "fit_current";
  if (input.outcome === "completed" || input.outcome === "partial") {
    return "completed_without_fit";
  }
  return "missing";
}

function stableEvidenceSha256(value: unknown) {
  return digestSha256Hex(JSON.stringify(value));
}

export function resultAssetRowToSummary(
  row: PersistedWorkoutResultAssetRow,
  rawState: "available" | "removal_pending" | "removed" | null = null,
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
    // Older failed rows may contain parser internals; never return those to the runner.
    parseError:
      row.parse_status === "failed"
        ? "We could not read that Garmin activity. Remove it and choose another FIT file."
        : null,
    rawFileAvailable: rawState ? rawState === "available" : Boolean(row.storage_path),
    reprocessingAvailable: rawState ? rawState === "available" : Boolean(row.storage_path),
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
    row.comparison_formula_version !== WORKOUT_COMPARISON_FORMULA_VERSION ||
    differencePayload.plannedWorkout.plannedWorkoutId !== row.planned_workout_id ||
    differencePayload.actualMetrics.actualMetricsId !== row.actual_metrics_id ||
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
