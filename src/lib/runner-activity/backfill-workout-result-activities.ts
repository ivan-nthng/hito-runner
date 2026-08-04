import "@tanstack/react-start/server-only";

import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  createRunnerActivityPlannedWorkoutMatch,
  findRunnerActivityPlanMatch,
  linkWorkoutResultAssetToRunnerActivity,
  persistGarminFitActivitySource,
} from "@/lib/runner-activity/garmin-fit-source";
import type { ParsedGarminWorkout } from "@/lib/workout-result-import/types";

export const LEGACY_WORKOUT_RESULT_BACKFILL_NORMALIZER_VERSION = "legacy_projection_backfill_v1";

export type RunnerActivityBackfillResult = {
  linkedAssetIds: string[];
  skippedAssetIds: string[];
};

/**
 * Converts only retained, parsed legacy evidence into the canonical graph.
 * Missing raw files remain skipped rather than being recreated from guesses.
 */
export async function backfillWorkoutResultActivities(
  input: {
    userId?: string;
  } = {},
): Promise<RunnerActivityBackfillResult> {
  const supabase = createAdminSupabaseClient();
  let assetsQuery = supabase
    .from("workout_result_assets")
    .select("*")
    .eq("parse_status", "parsed")
    .is("activity_source_revision_id", null)
    .not("storage_bucket", "is", null)
    .not("storage_path", "is", null)
    .order("created_at", { ascending: true });
  if (input.userId) assetsQuery = assetsQuery.eq("user_id", input.userId);
  const assets = await assetsQuery;
  if (assets.error) throw new Error(assets.error.message);

  const linkedAssetIds: string[] = [];
  const skippedAssetIds: string[] = [];
  for (const asset of assets.data ?? []) {
    if (!asset.storage_bucket || !asset.storage_path) {
      skippedAssetIds.push(asset.id);
      continue;
    }
    const metrics = await supabase
      .from("workout_actual_metrics")
      .select("*")
      .eq("result_asset_id", asset.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (metrics.error) throw new Error(metrics.error.message);
    if (!metrics.data) {
      skippedAssetIds.push(asset.id);
      continue;
    }
    const file = await supabase.storage.from(asset.storage_bucket).download(asset.storage_path);
    if (file.error || !file.data) {
      skippedAssetIds.push(asset.id);
      continue;
    }
    const fileBuffer = Buffer.from(await file.data.arrayBuffer());
    const parsed = legacyMetricsToParsedWorkout(metrics.data);
    const receipt = await persistGarminFitActivitySource({
      userId: asset.user_id,
      assetKind: asset.asset_kind as "garmin_fit" | "garmin_zip",
      storageBucket: asset.storage_bucket,
      storagePath: asset.storage_path,
      originalFileName: asset.original_file_name,
      mimeType: asset.mime_type,
      fileSizeBytes: asset.file_size_bytes,
      fileBuffer,
      parsedWorkout: parsed,
      normalizerVersion: LEGACY_WORKOUT_RESULT_BACKFILL_NORMALIZER_VERSION,
      sourceCapabilities: {
        summary: true,
        laps: Array.isArray(metrics.data.lap_payload),
        workout_steps: metrics.data.actual_interval_count != null,
        records_available: "unknown",
        normalized_samples_persisted: false,
      },
    });
    const existingPlanMatch = await findRunnerActivityPlanMatch({
      userId: asset.user_id,
      activityId: receipt.activityId,
    });
    if (existingPlanMatch && existingPlanMatch !== asset.planned_workout_id) {
      skippedAssetIds.push(asset.id);
      continue;
    }
    await linkWorkoutResultAssetToRunnerActivity({
      userId: asset.user_id,
      assetId: asset.id,
      sourceRevisionId: receipt.sourceRevisionId,
    });
    const metricLink = await supabase
      .from("workout_actual_metrics")
      .update({ activity_id: receipt.activityId, activity_revision_id: receipt.activityRevisionId })
      .eq("id", metrics.data.id)
      .eq("user_id", asset.user_id);
    if (metricLink.error) throw new Error(metricLink.error.message);
    if (asset.planned_workout_id) {
      await createRunnerActivityPlannedWorkoutMatch({
        userId: asset.user_id,
        activityId: receipt.activityId,
        sourceRevisionId: receipt.sourceRevisionId,
        plannedWorkoutId: asset.planned_workout_id,
      });
    }
    linkedAssetIds.push(asset.id);
  }

  return { linkedAssetIds, skippedAssetIds };
}

function legacyMetricsToParsedWorkout(metrics: {
  activity_started_at: string | null;
  activity_local_date: string | null;
  actual_avg_cadence: number | null;
  actual_avg_hr: number | null;
  actual_avg_power: number | null;
  actual_calories: number | null;
  actual_distance_km: number | null;
  actual_duration_min: number | null;
  actual_elevation_gain_m: number | null;
  actual_elevation_loss_m: number | null;
  actual_interval_count: number | null;
  actual_max_hr: number | null;
  actual_max_power: number | null;
  actual_step_payload: Json;
  lap_payload: Json;
  summary_payload: Json;
}): ParsedGarminWorkout {
  return {
    sourceKind: "garmin_fit",
    activityStartAt: metrics.activity_started_at,
    activityLocalDate: metrics.activity_local_date,
    totalDistanceKm: metrics.actual_distance_km,
    // The legacy projection selected timer-or-elapsed without retaining its basis.
    totalTimerDurationMin: null,
    totalElapsedDurationMin: null,
    totalDurationMin: metrics.actual_duration_min,
    avgHeartRate: metrics.actual_avg_hr,
    maxHeartRate: metrics.actual_max_hr,
    avgPower: metrics.actual_avg_power,
    maxPower: metrics.actual_max_power,
    totalCalories: metrics.actual_calories,
    totalAscentM: metrics.actual_elevation_gain_m,
    totalDescentM: metrics.actual_elevation_loss_m,
    avgCadence: metrics.actual_avg_cadence,
    avgTemperatureC: null,
    gpsPointCount: 0,
    lapCount: Array.isArray(metrics.lap_payload) ? metrics.lap_payload.length : 0,
    workoutName: null,
    actualIntervalCount: metrics.actual_interval_count,
    actualStepPayload: metrics.actual_step_payload,
    lapPayload: metrics.lap_payload,
    summaryPayload: metrics.summary_payload,
  };
}
