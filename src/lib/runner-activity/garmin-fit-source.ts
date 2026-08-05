import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";
import { runningContextFromGarminSummaryPayload } from "@/lib/runner-activity/running-context";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type {
  ParsedGarminWorkout,
  WorkoutResultAssetKind,
} from "@/lib/workout-result-import/types";

export const GARMIN_FIT_ACTIVITY_NORMALIZER_VERSION = "garmin_fit_activity_v1";

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

type SourceRevisionRow = {
  id: string;
  raw_state: RunnerActivitySourceReceipt["rawState"];
  raw_storage_bucket: string | null;
  raw_storage_path: string | null;
};

class RunnerActivityNotFoundError extends Error {
  constructor() {
    super("Runner activity was not found.");
    this.name = "RunnerActivityNotFoundError";
  }
}

/**
 * The adapter writes observed Garmin facts once through the canonical activity
 * graph RPC. Existing workout feedback tables only project this revision.
 */
export async function persistGarminFitActivitySource(input: {
  userId: string;
  assetKind: WorkoutResultAssetKind;
  storageBucket: string;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileBuffer: Buffer;
  parsedWorkout: ParsedGarminWorkout;
  normalizerVersion?: string;
  sourceCapabilities?: Json;
}): Promise<RunnerActivitySourceReceipt> {
  const fingerprint = createHash("sha256").update(input.fileBuffer).digest("hex");
  const sourceRevision = {
    raw_storage_bucket: input.storageBucket,
    raw_storage_path: input.storagePath,
    raw_asset_kind: input.assetKind,
    raw_original_file_name: input.originalFileName,
    raw_mime_type: input.mimeType,
    raw_file_size_bytes: input.fileSizeBytes,
    observed_at: input.parsedWorkout.activityStartAt,
    capabilities: input.sourceCapabilities ?? capabilitiesFor(input.parsedWorkout),
    normalizer_version: input.normalizerVersion ?? GARMIN_FIT_ACTIVITY_NORMALIZER_VERSION,
  } satisfies Json;
  const activityRevision = {
    activity_started_at: input.parsedWorkout.activityStartAt,
    activity_local_date: input.parsedWorkout.activityLocalDate,
    activity_timezone: null,
    total_elapsed_duration_min: input.parsedWorkout.totalElapsedDurationMin,
    total_timer_duration_min: input.parsedWorkout.totalTimerDurationMin,
    total_distance_km: input.parsedWorkout.totalDistanceKm,
    normalized_summary: normalizedSummaryFor(input.parsedWorkout),
    field_provenance: fieldProvenanceFor(input.parsedWorkout),
    normalizer_version: input.normalizerVersion ?? GARMIN_FIT_ACTIVITY_NORMALIZER_VERSION,
  } satisfies Json;
  const result = await createAdminSupabaseClient().rpc("persist_runner_activity_garmin_source", {
    p_user_id: input.userId,
    p_source_fingerprint_sha256: fingerprint,
    p_source_revision: sourceRevision,
    p_activity_revision: activityRevision,
  });

  if (result.error || !result.data?.[0]) {
    throw new Error(result.error?.message ?? "Canonical runner activity source was not created.");
  }

  const row = result.data[0];
  return {
    activityId: row.activity_id,
    activityRevisionId: row.activity_revision_id,
    sourceId: row.source_id,
    sourceRevisionId: row.source_revision_id,
    rawState: row.raw_state as RunnerActivitySourceReceipt["rawState"],
    rawStorageBucket: row.raw_storage_bucket,
    rawStoragePath: row.raw_storage_path,
    reusedExactSource: row.reused_exact_source,
  };
}

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

export async function findRunnerActivityPlanMatch(input: { userId: string; activityId: string }) {
  const result = await createAdminSupabaseClient()
    .from("runner_activity_planned_workout_matches")
    .select("planned_workout_id")
    .eq("user_id", input.userId)
    .eq("activity_id", input.activityId)
    .limit(1)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data?.planned_workout_id ?? null;
}

export async function findRunnerActivityForPlannedWorkout(input: {
  userId: string;
  plannedWorkoutId: string;
}) {
  const result = await createAdminSupabaseClient()
    .from("runner_activity_planned_workout_matches")
    .select("activity_id")
    .eq("user_id", input.userId)
    .eq("planned_workout_id", input.plannedWorkoutId)
    .limit(1)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data?.activity_id ?? null;
}

export async function createRunnerActivityPlannedWorkoutMatch(input: {
  userId: string;
  activityId: string;
  sourceRevisionId: string;
  plannedWorkoutId: string;
}) {
  const supabase = createAdminSupabaseClient();
  const existing = await supabase
    .from("runner_activity_planned_workout_matches")
    .select("id, planned_workout_id")
    .eq("user_id", input.userId)
    .eq("activity_id", input.activityId)
    .limit(1)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.planned_workout_id === input.plannedWorkoutId) return;
  if (existing.data?.planned_workout_id) {
    throw new Error("A runner activity cannot be attached to more than one planned workout.");
  }

  const values = {
    user_id: input.userId,
    activity_id: input.activityId,
    source_revision_id: input.sourceRevisionId,
    planned_workout_id: input.plannedWorkoutId,
    match_method: "runner_selected" as const,
  };
  const result = existing.data
    ? await supabase
        .from("runner_activity_planned_workout_matches")
        .update(values)
        .eq("id", existing.data.id)
        .eq("user_id", input.userId)
    : await supabase.from("runner_activity_planned_workout_matches").insert(values);
  if (result.error) throw new Error(result.error.message);
}

export async function removeRunnerActivityOriginalFilesForWorkout(input: {
  userId: string;
  plannedWorkoutId: string;
}) {
  const assets = await createAdminSupabaseClient()
    .from("workout_result_assets")
    .select("activity_source_revision_id")
    .eq("user_id", input.userId)
    .eq("planned_workout_id", input.plannedWorkoutId)
    .not("activity_source_revision_id", "is", null);
  if (assets.error) throw new Error(assets.error.message);
  const revisionIds = Array.from(
    new Set(
      (assets.data ?? [])
        .map((row) => row.activity_source_revision_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  await removeRunnerActivityOriginalFiles({ userId: input.userId, sourceRevisionIds: revisionIds });
}

export async function removeRunnerActivityOriginalFilesForActivity(input: {
  userId: string;
  activityId: string;
}) {
  await assertOwnedRunnerActivity(input);
  const sourceRevisionIds = await findRunnerActivitySourceRevisionIds(input);
  await removeRunnerActivityOriginalFiles({ userId: input.userId, sourceRevisionIds });
  const { readRunnerActivityMutationReadback } = await import("@/lib/runner-activity/read-model");
  return readRunnerActivityMutationReadback({
    userId: input.userId,
    activityId: input.activityId,
    creationCause: "source_removal",
  });
}

export async function removeRunnerActivityOriginalFiles(
  input: {
    userId: string;
    sourceRevisionIds: string[];
  },
  removeStoredObject: (revision: SourceRevisionRow) => Promise<void> = deleteStoredRawObject,
) {
  if (input.sourceRevisionIds.length === 0) return;
  const supabase = createAdminSupabaseClient();
  const selected = await supabase
    .from("runner_activity_source_revisions")
    .select("id, raw_state, raw_storage_bucket, raw_storage_path")
    .eq("user_id", input.userId)
    .in("id", input.sourceRevisionIds);
  if (selected.error) throw new Error(selected.error.message);
  const revisionById = new Map(
    ((selected.data ?? []) as SourceRevisionRow[]).map((revision) => [revision.id, revision]),
  );
  const revisions = input.sourceRevisionIds.flatMap((id) => {
    const revision = revisionById.get(id);
    return revision ? [revision] : [];
  });
  const pendingIds = revisions
    .filter((row) => row.raw_state === "available" || row.raw_state === "removal_pending")
    .map((row) => row.id);
  if (pendingIds.length === 0) return;

  const marked = await supabase
    .from("runner_activity_source_revisions")
    .update({ raw_state: "removal_pending" })
    .eq("user_id", input.userId)
    .in("id", pendingIds)
    .in("raw_state", ["available", "removal_pending"]);
  if (marked.error) throw new Error(marked.error.message);

  const attemptedIds = new Set<string>();
  try {
    for (const revision of revisions) {
      if (!pendingIds.includes(revision.id)) continue;
      attemptedIds.add(revision.id);

      try {
        await removeStoredObject(revision);
      } catch (error) {
        const reverted = await supabase
          .from("runner_activity_source_revisions")
          .update({ raw_state: "available" })
          .eq("user_id", input.userId)
          .eq("id", revision.id)
          .eq("raw_state", "removal_pending");
        if (reverted.error) {
          throw new AggregateError([error, reverted.error], "Raw source removal failed.");
        }
        throw error;
      }

      const assetUpdate = await supabase
        .from("workout_result_assets")
        .update({ storage_bucket: null, storage_path: null })
        .eq("user_id", input.userId)
        .eq("activity_source_revision_id", revision.id);
      if (assetUpdate.error) throw new Error(assetUpdate.error.message);

      const finished = await supabase
        .from("runner_activity_source_revisions")
        .update({ raw_state: "removed", raw_storage_bucket: null, raw_storage_path: null })
        .eq("user_id", input.userId)
        .eq("id", revision.id)
        .eq("raw_state", "removal_pending");
      if (finished.error) throw new Error(finished.error.message);
    }
  } catch (error) {
    const untouchedIds = pendingIds.filter((id) => !attemptedIds.has(id));
    if (untouchedIds.length > 0) {
      const reverted = await supabase
        .from("runner_activity_source_revisions")
        .update({ raw_state: "available" })
        .eq("user_id", input.userId)
        .in("id", untouchedIds)
        .eq("raw_state", "removal_pending");
      if (reverted.error)
        throw new AggregateError([error, reverted.error], "Raw source removal failed.");
    }
    throw error;
  }
}

async function deleteStoredRawObject(revision: SourceRevisionRow) {
  if (!revision.raw_storage_bucket || !revision.raw_storage_path) return;
  const removed = await createAdminSupabaseClient()
    .storage.from(revision.raw_storage_bucket)
    .remove([revision.raw_storage_path]);
  if (removed.error) throw new Error(removed.error.message);
}

export async function deleteRunnerActivityFromHistory(input: {
  userId: string;
  activityId: string;
}) {
  const supabase = createAdminSupabaseClient();
  await assertOwnedRunnerActivity(input);
  const sourceRevisionIds = await findRunnerActivitySourceRevisionIds(input);
  await removeRunnerActivityOriginalFiles({
    userId: input.userId,
    sourceRevisionIds,
  });
  const deleted = await supabase.rpc("delete_runner_activity_from_history", {
    p_user_id: input.userId,
    p_activity_id: input.activityId,
  });
  if (deleted.error) throw new Error(deleted.error.message);
  const { readRunnerActivityMutationReadback } = await import("@/lib/runner-activity/read-model");
  return readRunnerActivityMutationReadback({
    userId: input.userId,
    activityId: input.activityId,
    creationCause: "activity_delete",
  });
}

async function assertOwnedRunnerActivity(input: { userId: string; activityId: string }) {
  const result = await createAdminSupabaseClient()
    .from("runner_activities")
    .select("id")
    .eq("id", input.activityId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new RunnerActivityNotFoundError();
}

async function findRunnerActivitySourceRevisionIds(input: { userId: string; activityId: string }) {
  const supabase = createAdminSupabaseClient();
  const sources = await supabase
    .from("runner_activity_sources")
    .select("id")
    .eq("user_id", input.userId)
    .eq("activity_id", input.activityId);
  if (sources.error) throw new Error(sources.error.message);
  const sourceIds = (sources.data ?? []).map((row) => row.id);
  if (sourceIds.length === 0) return [];
  const revisions = await supabase
    .from("runner_activity_source_revisions")
    .select("id")
    .eq("user_id", input.userId)
    .in("source_id", sourceIds);
  if (revisions.error) throw new Error(revisions.error.message);
  return (revisions.data ?? []).map((row) => row.id);
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

function normalizedSummaryFor(parsed: ParsedGarminWorkout) {
  return {
    source_kind: parsed.sourceKind,
    activity_started_at: parsed.activityStartAt,
    activity_local_date: parsed.activityLocalDate,
    total_duration_min: parsed.totalDurationMin,
    total_timer_duration_min: parsed.totalTimerDurationMin,
    total_elapsed_duration_min: parsed.totalElapsedDurationMin,
    total_distance_km: parsed.totalDistanceKm,
    avg_heart_rate: parsed.avgHeartRate,
    max_heart_rate: parsed.maxHeartRate,
    avg_power: parsed.avgPower,
    max_power: parsed.maxPower,
    avg_cadence: parsed.avgCadence,
    total_calories: parsed.totalCalories,
    total_ascent_m: parsed.totalAscentM,
    total_descent_m: parsed.totalDescentM,
    running_context: runningContextFromGarminSummaryPayload(parsed.summaryPayload),
    actual_interval_count: parsed.actualIntervalCount,
    actual_step_payload: parsed.actualStepPayload,
    lap_payload: parsed.lapPayload,
    summary_payload: parsed.summaryPayload,
  };
}

function jsonRecord(value: Json | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : null;
}

function fieldProvenanceFor(parsed: ParsedGarminWorkout) {
  const observed = "observed:manual_garmin_fit";
  return Object.fromEntries(
    Object.entries(normalizedSummaryFor(parsed))
      .filter(([, value]) => value != null)
      .map(([field]) => [field, observed]),
  );
}

function capabilitiesFor(parsed: ParsedGarminWorkout) {
  return {
    summary: true,
    laps: parsed.lapCount > 0,
    workout_steps: parsed.actualIntervalCount != null,
    records_available: parsed.gpsPointCount > 0,
    normalized_samples_persisted: false,
  };
}
