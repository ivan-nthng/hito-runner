import "@tanstack/react-start/server-only";

import type { Database, Json } from "@/lib/supabase/database";
import { isLoopbackRuntimeUrl } from "@/lib/supabase/env";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type {
  RunnerActivityProjection,
  RunnerActivitySourceReceipt,
} from "@/lib/runner-activity/canonical-activity-source";
import { findRunnerActivityPlanMatch } from "@/lib/runner-activity/garmin-fit-source";
import { buildDeterministicWorkoutComparison } from "@/lib/workout-result-import/compare-workout-result";
import { WORKOUT_COMPARISON_FORMULA_VERSION } from "@/lib/workout-result-import/comparison-payload";
import {
  getFitCompletedPlannedWorkoutIds,
  getLatestWorkoutResultFeedback,
} from "@/lib/workout-result-import/read-workout-result-feedback";
import {
  type ExtractedGarminFitFile,
  WORKOUT_RESULT_STORAGE_BUCKET,
} from "@/lib/workout-result-import/internal-types";
import {
  type WorkoutResultFeedbackSummary,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";

export type OwnedPlannedWorkoutRow = Pick<
  Database["public"]["Tables"]["planned_workouts"]["Row"],
  "id" | "workout_date" | "workout_type" | "source_workout_type" | "title" | "steps"
>;

export type WorkoutResultProjectionFailurePointForQa =
  | "candidate_cleanup"
  | "asset_link"
  | "match"
  | "metrics"
  | "comparison"
  | "supersession";

export function assertProjectionFailurePointIsLocal(
  failurePoint: WorkoutResultProjectionFailurePointForQa | undefined,
) {
  if (!failurePoint) return;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!isLoopbackRuntimeUrl(supabaseUrl)) {
    throw new Error("Workout-result projection fault injection requires loopback Supabase.");
  }
}

export async function reconcileWorkoutResultProjection(input: {
  userId: string;
  plannedWorkout: OwnedPlannedWorkoutRow | null;
  workoutLogId: string | null;
  activitySource: RunnerActivitySourceReceipt;
  activityProjection: RunnerActivityProjection;
  candidateAssetId: string;
  candidateStoragePath: string;
  primaryFile: ExtractedGarminFitFile;
  initialParseStatus: "uploaded" | "extracted";
  failurePointForQa?: WorkoutResultProjectionFailurePointForQa;
  /** The Activity match and retained asset already committed in the Calendar transaction. */
  confirmedCanonicalMatch?: boolean;
}): Promise<WorkoutResultFeedbackSummary | null> {
  const supabase = createAdminSupabaseClient();
  let failureAssetId: string | null = input.candidateAssetId;
  let failureAssetIsCandidate = true;

  try {
    const linkedAssets = await supabase
      .from("workout_result_assets")
      .select("*")
      .eq("user_id", input.userId)
      .eq("activity_source_revision_id", input.activitySource.sourceRevisionId)
      .order("created_at", { ascending: false });
    if (linkedAssets.error) {
      throw new WorkoutResultImportError("persistence_failed", linkedAssets.error.message, 500);
    }

    const plannedWorkoutId = input.plannedWorkout?.id ?? null;
    const existingTargetAsset = (linkedAssets.data ?? []).find(
      (asset) => asset.planned_workout_id === plannedWorkoutId,
    );
    const reuseExistingTargetAsset =
      input.activitySource.reusedExactSource && existingTargetAsset ? existingTargetAsset : null;

    if (input.activitySource.reusedExactSource && input.plannedWorkout && existingTargetAsset) {
      const activeMetrics = await supabase
        .from("workout_actual_metrics")
        .select("id, activity_revision_id")
        .eq("user_id", input.userId)
        .eq("planned_workout_id", input.plannedWorkout.id)
        .neq("status", "superseded")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeMetrics.error) {
        throw new WorkoutResultImportError("persistence_failed", activeMetrics.error.message, 500);
      }

      if (
        activeMetrics.data &&
        activeMetrics.data.activity_revision_id !== input.activitySource.activityRevisionId
      ) {
        injectProjectionFailure(input.failurePointForQa, "candidate_cleanup");
        await discardCandidateUpload({
          userId: input.userId,
          assetId: input.candidateAssetId,
          storagePath: input.candidateStoragePath,
        });
        failureAssetId = null;
        const currentReadback = await getLatestWorkoutResultFeedback({
          userId: input.userId,
          plannedWorkoutId: input.plannedWorkout.id,
        });
        if (
          currentReadback.marker?.state !== "feedback_ready" ||
          currentReadback.latestActualMetrics?.id !== activeMetrics.data.id ||
          !currentReadback.latestComparison
        ) {
          throw incompleteProjectionError();
        }
        return currentReadback;
      }
    }

    let projectionAssetId = input.candidateAssetId;

    if (reuseExistingTargetAsset && reuseExistingTargetAsset.id !== input.candidateAssetId) {
      injectProjectionFailure(input.failurePointForQa, "candidate_cleanup");
      await discardCandidateUpload({
        userId: input.userId,
        assetId: input.candidateAssetId,
        storagePath: input.candidateStoragePath,
      });
      failureAssetId = null;
      projectionAssetId = reuseExistingTargetAsset.id;
    }

    const assetUpdate = await supabase
      .from("workout_result_assets")
      .update({
        planned_workout_id: plannedWorkoutId,
        workout_log_id: input.workoutLogId,
        activity_source_revision_id: input.activitySource.sourceRevisionId,
        parse_status:
          reuseExistingTargetAsset?.parse_status === "parsed" ? "parsed" : input.initialParseStatus,
        primary_file_kind: input.primaryFile.primaryFileKind,
        primary_file_name: input.primaryFile.primaryFileName,
        parse_error: null,
      })
      .eq("id", projectionAssetId)
      .eq("user_id", input.userId)
      .select("*")
      .single();
    if (assetUpdate.error) {
      throw new WorkoutResultImportError("persistence_failed", assetUpdate.error.message, 500);
    }
    failureAssetId = projectionAssetId;
    failureAssetIsCandidate = projectionAssetId === input.candidateAssetId;
    injectProjectionFailure(input.failurePointForQa, "asset_link");

    let projectionAsset = assetUpdate.data;
    if (
      input.activitySource.reusedExactSource &&
      projectionAsset.storage_path &&
      projectionAsset.storage_path !== input.activitySource.rawStoragePath
    ) {
      const duplicateRemoval = await supabase.storage
        .from(WORKOUT_RESULT_STORAGE_BUCKET)
        .remove([projectionAsset.storage_path]);
      if (duplicateRemoval.error) {
        throw new WorkoutResultImportError("storage_failed", duplicateRemoval.error.message, 500);
      }
      const storageClear = await supabase
        .from("workout_result_assets")
        .update({ storage_bucket: null, storage_path: null })
        .eq("id", projectionAsset.id)
        .eq("user_id", input.userId)
        .select("*")
        .single();
      if (storageClear.error) {
        throw new WorkoutResultImportError("persistence_failed", storageClear.error.message, 500);
      }
      projectionAsset = storageClear.data;
    }

    if (!input.plannedWorkout) {
      const parsedAsset = await markProjectionAssetParsed({
        userId: input.userId,
        assetId: projectionAsset.id,
      });
      if (parsedAsset.activity_source_revision_id !== input.activitySource.sourceRevisionId) {
        throw incompleteProjectionError();
      }
      return null;
    }

    injectProjectionFailure(input.failurePointForQa, "match");

    const metrics = await reconcileWorkoutActualMetrics({
      userId: input.userId,
      plannedWorkoutId: input.plannedWorkout.id,
      workoutLogId: input.workoutLogId,
      assetId: projectionAsset.id,
      activitySource: input.activitySource,
      activityProjection: input.activityProjection,
    });
    injectProjectionFailure(input.failurePointForQa, "metrics");
    const comparison =
      input.plannedWorkout.workout_type === "recorded_run"
        ? null
        : await reconcileWorkoutComparison({
            userId: input.userId,
            plannedWorkout: input.plannedWorkout,
            metrics,
          });
    injectProjectionFailure(input.failurePointForQa, "comparison");

    injectProjectionFailure(input.failurePointForQa, "supersession");

    await finalizeWorkoutResultProjection({
      userId: input.userId,
      plannedWorkoutId: input.plannedWorkout.id,
      activitySource: input.activitySource,
      assetId: projectionAsset.id,
      metricsId: metrics.id,
      comparisonId: comparison?.id ?? null,
    });
    const [persistedReadback, persistedMatch, fitCompletedWorkoutIds] = await Promise.all([
      getLatestWorkoutResultFeedback({
        userId: input.userId,
        plannedWorkoutId: input.plannedWorkout.id,
      }),
      findRunnerActivityPlanMatch({
        userId: input.userId,
        activityId: input.activitySource.activityId,
      }),
      getFitCompletedPlannedWorkoutIds({
        userId: input.userId,
        plannedWorkoutIds: [input.plannedWorkout.id],
      }),
    ]);

    if (
      (input.plannedWorkout.workout_type === "recorded_run"
        ? persistedReadback.marker?.state !== "evidence_attached"
        : persistedReadback.marker?.state !== "feedback_ready") ||
      persistedReadback.latestAsset?.id !== projectionAsset.id ||
      persistedReadback.latestActualMetrics?.id !== metrics.id ||
      (comparison
        ? persistedReadback.latestComparison?.id !== comparison.id
        : persistedReadback.latestComparison !== null) ||
      persistedMatch !== input.plannedWorkout.id ||
      !fitCompletedWorkoutIds.has(input.plannedWorkout.id)
    ) {
      throw incompleteProjectionError();
    }

    return persistedReadback;
  } catch (error) {
    if (failureAssetId && failureAssetIsCandidate && !input.confirmedCanonicalMatch) {
      await supabase
        .from("workout_result_assets")
        .update({
          planned_workout_id: null,
          workout_log_id: null,
          activity_source_revision_id: null,
          parse_status: "failed",
          parse_error: "Workout result projection is incomplete and can be retried.",
        })
        .eq("id", failureAssetId)
        .eq("user_id", input.userId);
    }
    throw error;
  }
}

export async function discardCandidateUpload(input: {
  userId: string;
  assetId: string;
  storagePath: string;
}) {
  const supabase = createAdminSupabaseClient();
  const storageRemoval = await supabase.storage
    .from(WORKOUT_RESULT_STORAGE_BUCKET)
    .remove([input.storagePath]);
  if (storageRemoval.error) {
    throw new WorkoutResultImportError("storage_failed", storageRemoval.error.message, 500);
  }

  const assetDelete = await supabase
    .from("workout_result_assets")
    .delete()
    .eq("id", input.assetId)
    .eq("user_id", input.userId);
  if (assetDelete.error) {
    throw new WorkoutResultImportError("persistence_failed", assetDelete.error.message, 500);
  }
}

function injectProjectionFailure(
  configured: WorkoutResultProjectionFailurePointForQa | undefined,
  current: WorkoutResultProjectionFailurePointForQa,
) {
  if (configured === current) {
    throw new WorkoutResultImportError(
      "persistence_failed",
      `Local QA injected the ${current} projection failure boundary.`,
      500,
    );
  }
}

async function reconcileWorkoutActualMetrics(input: {
  userId: string;
  plannedWorkoutId: string;
  workoutLogId: string | null;
  assetId: string;
  activitySource: RunnerActivitySourceReceipt;
  activityProjection: RunnerActivityProjection;
}) {
  const supabase = createAdminSupabaseClient();
  const existingByRevision = await supabase
    .from("workout_actual_metrics")
    .select("*")
    .eq("user_id", input.userId)
    .eq("activity_revision_id", input.activitySource.activityRevisionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingByRevision.error) {
    throw new WorkoutResultImportError("persistence_failed", existingByRevision.error.message, 500);
  }

  const existingByAsset = existingByRevision.data
    ? null
    : await supabase
        .from("workout_actual_metrics")
        .select("*")
        .eq("user_id", input.userId)
        .eq("result_asset_id", input.assetId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
  if (existingByAsset?.error) {
    throw new WorkoutResultImportError("persistence_failed", existingByAsset.error.message, 500);
  }

  const existing = existingByRevision.data ?? existingByAsset?.data ?? null;
  const values = {
    activity_id: input.activitySource.activityId,
    activity_revision_id: input.activitySource.activityRevisionId,
    user_id: input.userId,
    planned_workout_id: input.plannedWorkoutId,
    workout_log_id: input.workoutLogId,
    result_asset_id: input.assetId,
    source_kind: "garmin_fit",
    status: existing && existing.status !== "superseded" ? existing.status : "superseded",
    activity_started_at: input.activityProjection.activityStartedAt,
    activity_local_date: input.activityProjection.activityLocalDate,
    actual_duration_min: input.activityProjection.totalDurationMin,
    actual_distance_km: input.activityProjection.totalDistanceKm,
    actual_avg_hr: input.activityProjection.avgHeartRate,
    actual_max_hr: input.activityProjection.maxHeartRate,
    actual_avg_power: input.activityProjection.avgPower,
    actual_max_power: input.activityProjection.maxPower,
    actual_avg_cadence: input.activityProjection.avgCadence,
    actual_calories: input.activityProjection.totalCalories,
    actual_elevation_gain_m: input.activityProjection.totalAscentM,
    actual_elevation_loss_m: input.activityProjection.totalDescentM,
    actual_interval_count: input.activityProjection.actualIntervalCount,
    actual_step_payload: input.activityProjection.actualStepPayload,
    lap_payload: input.activityProjection.lapPayload,
    summary_payload: input.activityProjection.summaryPayload,
  };
  const result = existing
    ? await supabase
        .from("workout_actual_metrics")
        .update(values)
        .eq("id", existing.id)
        .eq("user_id", input.userId)
        .select("*")
        .single()
    : await supabase.from("workout_actual_metrics").insert(values).select("*").single();
  if (result.error) {
    throw new WorkoutResultImportError("persistence_failed", result.error.message, 500);
  }
  return result.data;
}

async function finalizeWorkoutResultProjection(input: {
  userId: string;
  plannedWorkoutId: string;
  activitySource: RunnerActivitySourceReceipt;
  assetId: string;
  metricsId: string;
  comparisonId: string | null;
}) {
  const result = await createAdminSupabaseClient().rpc(
    "finalize_runner_activity_planned_workout_projection",
    {
      p_user_id: input.userId,
      p_planned_workout_id: input.plannedWorkoutId,
      p_activity_id: input.activitySource.activityId,
      p_activity_revision_id: input.activitySource.activityRevisionId,
      p_source_revision_id: input.activitySource.sourceRevisionId,
      p_asset_id: input.assetId,
      p_metrics_id: input.metricsId,
      p_comparison_id: input.comparisonId as unknown as string,
    },
  );
  if (result.error) {
    throw new WorkoutResultImportError("persistence_failed", result.error.message, 500);
  }
}

async function reconcileWorkoutComparison(input: {
  userId: string;
  plannedWorkout: OwnedPlannedWorkoutRow;
  metrics: Database["public"]["Tables"]["workout_actual_metrics"]["Row"];
}) {
  const supabase = createAdminSupabaseClient();
  const comparison = buildDeterministicWorkoutComparison({
    plannedWorkout: input.plannedWorkout,
    actualMetrics: input.metrics,
  });
  const values = {
    user_id: input.userId,
    planned_workout_id: input.plannedWorkout.id,
    actual_metrics_id: input.metrics.id,
    comparison_formula_version: WORKOUT_COMPARISON_FORMULA_VERSION,
    comparison_status: comparison.comparisonStatus,
    completion_state: comparison.completionState,
    difference_payload: comparison.differencePayload as unknown as Json,
    comparison_confidence: comparison.comparisonConfidence,
  };
  const existing = await supabase
    .from("workout_comparisons")
    .select("id")
    .eq("actual_metrics_id", input.metrics.id)
    .maybeSingle();
  if (existing.error) {
    throw new WorkoutResultImportError("persistence_failed", existing.error.message, 500);
  }
  const result = existing.data
    ? await supabase
        .from("workout_comparisons")
        .update(values)
        .eq("id", existing.data.id)
        .eq("user_id", input.userId)
        .select("*")
        .single()
    : await supabase.from("workout_comparisons").insert(values).select("*").single();
  if (result.error) {
    throw new WorkoutResultImportError("persistence_failed", result.error.message, 500);
  }
  return result.data;
}

async function markProjectionAssetParsed(input: { userId: string; assetId: string }) {
  const result = await createAdminSupabaseClient()
    .from("workout_result_assets")
    .update({ parse_status: "parsed", parse_error: null })
    .eq("id", input.assetId)
    .eq("user_id", input.userId)
    .select("*")
    .single();
  if (result.error) {
    throw new WorkoutResultImportError("persistence_failed", result.error.message, 500);
  }
  return result.data;
}

function incompleteProjectionError() {
  return new WorkoutResultImportError(
    "persistence_failed",
    "The workout result projection is incomplete and can be retried.",
    500,
  );
}
