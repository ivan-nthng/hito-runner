import "@tanstack/react-start/server-only";

import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type RunnerActivitySourceReceipt = {
  activityId: string;
  activityRevisionId: string;
  sourceId: string;
  sourceRevisionId: string;
  rawState: "available" | "removal_pending" | "removed";
  rawStorageBucket: string | null;
  rawStoragePath: string | null;
  reusedExactSource: boolean;
};

export type RunnerActivityProjection = {
  activityId: string;
  activityRevisionId: string;
  activityStartedAt: string | null;
  activityLocalDate: string | null;
  totalDurationMin: number | null;
  totalDistanceKm: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPower: number | null;
  maxPower: number | null;
  avgCadence: number | null;
  totalCalories: number | null;
  totalAscentM: number | null;
  totalDescentM: number | null;
  actualIntervalCount: number | null;
  actualStepPayload: Json;
  lapPayload: Json;
  summaryPayload: Json;
};

/** Reads canonical Activity facts without coupling consumers to the source adapter. */
export async function readRunnerActivityProjection(input: {
  userId: string;
  activityId: string;
  activityRevisionId: string;
}): Promise<RunnerActivityProjection> {
  const result = await createAdminSupabaseClient()
    .from("runner_activity_revisions")
    .select(
      "activity_id, id, activity_started_at, activity_local_date, total_elapsed_duration_min, total_timer_duration_min, total_distance_km, normalized_summary",
    )
    .eq("user_id", input.userId)
    .eq("activity_id", input.activityId)
    .eq("id", input.activityRevisionId)
    .maybeSingle();
  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Canonical runner activity revision was not found.");
  }

  const summary = readNormalizedSummary(result.data.normalized_summary);
  return {
    activityId: result.data.activity_id,
    activityRevisionId: result.data.id,
    activityStartedAt: result.data.activity_started_at,
    activityLocalDate: result.data.activity_local_date,
    totalDurationMin:
      result.data.total_timer_duration_min ?? result.data.total_elapsed_duration_min,
    totalDistanceKm: result.data.total_distance_km,
    ...summary,
  };
}

function readNormalizedSummary(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Canonical runner activity revision has an invalid normalized summary.");
  }
  const summary = value as Record<string, Json | undefined>;
  return {
    avgHeartRate: numberOrNull(summary.avg_heart_rate),
    maxHeartRate: numberOrNull(summary.max_heart_rate),
    avgPower: numberOrNull(summary.avg_power),
    maxPower: numberOrNull(summary.max_power),
    avgCadence: numberOrNull(summary.avg_cadence),
    totalCalories: numberOrNull(summary.total_calories),
    totalAscentM: numberOrNull(summary.total_ascent_m),
    totalDescentM: numberOrNull(summary.total_descent_m),
    actualIntervalCount: numberOrNull(summary.actual_interval_count),
    actualStepPayload: summary.actual_step_payload ?? [],
    lapPayload: summary.lap_payload ?? [],
    summaryPayload: summary.summary_payload ?? {},
  };
}

function numberOrNull(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
