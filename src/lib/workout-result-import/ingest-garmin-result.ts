import "@tanstack/react-start/server-only";
import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isLoopbackRuntimeUrl } from "@/lib/supabase/env";
import {
  createRunnerActivityPlannedWorkoutMatch,
  findRunnerActivityPlanMatch,
  persistGarminFitActivitySource,
  readRunnerActivityProjection,
  removeRunnerActivityOriginalFilesForWorkout,
  type RunnerActivityProjection,
  type RunnerActivitySourceReceipt,
} from "@/lib/runner-activity/garmin-fit-source";
import { buildDeterministicWorkoutComparison } from "@/lib/workout-result-import/compare-workout-result";
import { getLatestWorkoutResultFeedback } from "@/lib/workout-result-import/read-workout-result-feedback";
import {
  type ExtractedGarminFitFile,
  MAX_WORKOUT_RESULT_UPLOAD_BYTES,
  WORKOUT_RESULT_STORAGE_BUCKET,
  type WorkoutResultAssetKind,
  type WorkoutResultFeedbackSummary,
  runnerSafeWorkoutResultMessage,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";

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
  | "workout_family"
  | "workout_identity"
  | "calendar_icon_key"
  | "goal_context"
  | "metric_mode"
  | "title"
  | "notes"
  | "steps"
  | "display_order"
>;

export type WorkoutResultProjectionFailurePointForQa =
  | "candidate_cleanup"
  | "asset_link"
  | "match"
  | "metrics"
  | "comparison"
  | "supersession";

export async function ingestGarminWorkoutResult(params: {
  userId: string;
  plannedWorkoutId?: string | null;
  file: File;
  /** Strictly loopback-only fault injection for the maintained projection validator. */
  projectionFailurePointForQa?: WorkoutResultProjectionFailurePointForQa;
}) {
  const { userId, file } = params;
  const plannedWorkoutId = params.plannedWorkoutId?.trim() || null;
  const originalFileName = file.name.trim();

  assertProjectionFailurePointIsLocal(params.projectionFailurePointForQa);

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
  const plannedWorkout = plannedWorkoutId
    ? await getOwnedPlannedWorkout(userId, plannedWorkoutId)
    : null;
  const existingLog = plannedWorkoutId ? await getExistingWorkoutLog(plannedWorkoutId) : null;
  const assetId = generateAssetId();
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

  try {
    const primaryFile =
      assetKind === "garmin_fit"
        ? {
            primaryFileKind: "fit" as const,
            primaryFileName: originalFileName,
            fileBuffer,
          }
        : await extractPrimaryFitFromArchiveForServer(fileBuffer);

    await supabase
      .from("workout_result_assets")
      .update({
        parse_status: assetKind === "garmin_zip" ? "extracted" : "uploaded",
        primary_file_kind: primaryFile.primaryFileKind,
        primary_file_name: primaryFile.primaryFileName,
        parse_error: null,
      })
      .eq("id", assetId);

    const parsedWorkout = await parseGarminFitActivityForServer(primaryFile.fileBuffer);
    const activitySource = await persistGarminFitActivitySource({
      userId,
      assetKind,
      storageBucket: WORKOUT_RESULT_STORAGE_BUCKET,
      storagePath,
      originalFileName,
      mimeType: normalizeMimeType(file.type, assetKind),
      fileSizeBytes: file.size,
      fileBuffer,
      parsedWorkout,
    });
    const existingPlanMatch = await findRunnerActivityPlanMatch({
      userId,
      activityId: activitySource.activityId,
    });

    if (
      activitySource.reusedExactSource &&
      existingPlanMatch &&
      existingPlanMatch !== plannedWorkoutId
    ) {
      await discardCandidateUpload({ userId, assetId, storagePath });
      throw new WorkoutResultImportError(
        "activity_already_recorded",
        "That Garmin activity is already attached to another workout.",
        409,
      );
    }

    const activityProjection = await readRunnerActivityProjection({
      userId,
      activityId: activitySource.activityId,
      activityRevisionId: activitySource.activityRevisionId,
    });

    const feedback = await reconcileWorkoutResultProjection({
      userId,
      plannedWorkout,
      workoutLogId: existingLog?.id ?? null,
      activitySource,
      activityProjection,
      candidateAssetId: assetId,
      candidateStoragePath: storagePath,
      primaryFile,
      initialParseStatus: assetKind === "garmin_zip" ? "extracted" : "uploaded",
      failurePointForQa: params.projectionFailurePointForQa,
    });

    return {
      ok: true as const,
      runnerActivity: runnerActivityReceipt(activitySource),
      ...(plannedWorkout
        ? {
            plannedWorkout: plannedWorkoutReceipt(plannedWorkout),
            ...feedback,
          }
        : {}),
    };
  } catch (error) {
    const message = runnerSafeWorkoutResultMessage(error);

    await supabase
      .from("workout_result_assets")
      .update({
        parse_status: "failed",
        parse_error: message,
      })
      .eq("id", assetId);

    throw error;
  }
}

async function reconcileWorkoutResultProjection(input: {
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
        const currentReadback = await getLatestWorkoutResultFeedback(input.plannedWorkout.id);
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

    if (existingTargetAsset) {
      injectProjectionFailure(input.failurePointForQa, "candidate_cleanup");
      await discardCandidateUpload({
        userId: input.userId,
        assetId: input.candidateAssetId,
        storagePath: input.candidateStoragePath,
      });
      failureAssetId = null;
      projectionAssetId = existingTargetAsset.id;
    }

    const assetUpdate = await supabase
      .from("workout_result_assets")
      .update({
        planned_workout_id: plannedWorkoutId,
        workout_log_id: input.workoutLogId,
        activity_source_revision_id: input.activitySource.sourceRevisionId,
        parse_status: input.initialParseStatus,
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

    await createRunnerActivityPlannedWorkoutMatch({
      userId: input.userId,
      activityId: input.activitySource.activityId,
      sourceRevisionId: input.activitySource.sourceRevisionId,
      plannedWorkoutId: input.plannedWorkout.id,
    });
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
    const comparison = await reconcileWorkoutComparison({
      userId: input.userId,
      plannedWorkout: input.plannedWorkout,
      metrics,
    });
    injectProjectionFailure(input.failurePointForQa, "comparison");

    const supersedeExisting = await supabase
      .from("workout_actual_metrics")
      .update({ status: "superseded" })
      .eq("user_id", input.userId)
      .eq("planned_workout_id", input.plannedWorkout.id)
      .neq("id", metrics.id)
      .neq("status", "superseded");
    if (supersedeExisting.error) {
      throw new WorkoutResultImportError(
        "persistence_failed",
        supersedeExisting.error.message,
        500,
      );
    }
    injectProjectionFailure(input.failurePointForQa, "supersession");

    const parsedAsset = await markProjectionAssetParsed({
      userId: input.userId,
      assetId: projectionAsset.id,
    });
    const persistedReadback = await getLatestWorkoutResultFeedback(input.plannedWorkout.id);
    const persistedMatch = await findRunnerActivityPlanMatch({
      userId: input.userId,
      activityId: input.activitySource.activityId,
    });

    if (
      parsedAsset.activity_source_revision_id !== input.activitySource.sourceRevisionId ||
      persistedReadback.marker?.state !== "feedback_ready" ||
      persistedReadback.latestAsset?.id !== projectionAsset.id ||
      persistedReadback.latestActualMetrics?.id !== metrics.id ||
      persistedReadback.latestComparison?.id !== comparison.id ||
      persistedMatch !== input.plannedWorkout.id
    ) {
      throw incompleteProjectionError();
    }

    return persistedReadback;
  } catch (error) {
    if (failureAssetId) {
      await supabase
        .from("workout_result_assets")
        .update({
          ...(failureAssetIsCandidate
            ? {
                planned_workout_id: null,
                workout_log_id: null,
                activity_source_revision_id: null,
              }
            : {}),
          parse_status: "failed",
          parse_error: "Workout result projection is incomplete and can be retried.",
        })
        .eq("id", failureAssetId)
        .eq("user_id", input.userId);
    }
    throw error;
  }
}

function assertProjectionFailurePointIsLocal(
  failurePoint: WorkoutResultProjectionFailurePointForQa | undefined,
) {
  if (!failurePoint) return;
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL;
  if (!isLoopbackRuntimeUrl(supabaseUrl)) {
    throw new Error("Workout-result projection fault injection requires loopback Supabase.");
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

  const values = {
    activity_id: input.activitySource.activityId,
    activity_revision_id: input.activitySource.activityRevisionId,
    user_id: input.userId,
    planned_workout_id: input.plannedWorkoutId,
    workout_log_id: input.workoutLogId,
    result_asset_id: input.assetId,
    source_kind: "garmin_fit",
    status: "normalized",
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
  const existing = existingByRevision.data ?? existingByAsset?.data ?? null;
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
    comparison_formula_version: "deterministic_workout_comparison_v1",
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

async function discardCandidateUpload(input: {
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

export async function removeWorkoutResultEvidence(params: {
  userId: string;
  plannedWorkoutId: string;
}) {
  const { userId, plannedWorkoutId } = params;
  await getOwnedPlannedWorkout(userId, plannedWorkoutId);

  const supabase = createAdminSupabaseClient();
  const removedCanonicalSources = await removeRunnerActivityOriginalFilesForWorkout({
    userId,
    plannedWorkoutId,
  });

  // Gate 1 sources own valid raw evidence. Removing an original file never erases
  // its normalized activity, feedback projection, or comparison.
  if (removedCanonicalSources.removedSourceRevisionIds.length > 0) {
    return getLatestWorkoutResultFeedback(plannedWorkoutId);
  }

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
    .filter(
      (asset): asset is typeof asset & { storage_path: string } =>
        asset.storage_bucket === WORKOUT_RESULT_STORAGE_BUCKET && Boolean(asset.storage_path),
    )
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

async function getOwnedPlannedWorkout(userId: string, plannedWorkoutId: string) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from("planned_workouts")
    .select(
      "id, plan_cycle_id, user_id, workout_date, weekday, week_number, phase, workout_type, source_workout_type, workout_family, workout_identity, calendar_icon_key, goal_context, metric_mode, title, notes, steps, display_order",
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
  plannedWorkoutId: string | null;
  assetId: string;
  originalFileName: string;
}) {
  const ext = fileExtension(args.originalFileName) || ".bin";
  return `${args.userId}/${args.plannedWorkoutId ?? "unmatched"}/${args.assetId}/original${ext}`;
}

function plannedWorkoutReceipt(plannedWorkout: OwnedPlannedWorkoutRow) {
  return {
    id: plannedWorkout.id,
    workoutDate: plannedWorkout.workout_date,
    workoutType: plannedWorkout.workout_type,
  };
}

function runnerActivityReceipt(activity: {
  activityId: string;
  activityRevisionId: string;
  sourceId: string;
  sourceRevisionId: string;
  rawState: "available" | "removal_pending" | "removed";
}) {
  return {
    id: activity.activityId,
    revisionId: activity.activityRevisionId,
    sourceId: activity.sourceId,
    sourceRevisionId: activity.sourceRevisionId,
    rawFileAvailable: activity.rawState === "available",
    reprocessingAvailable: activity.rawState === "available",
  };
}

function classifyWorkoutResultUpload(fileName: string): WorkoutResultAssetKind {
  const lowerName = fileName.trim().toLowerCase();

  if (lowerName.endsWith(".fit")) {
    return "garmin_fit";
  }

  if (lowerName.endsWith(".zip")) {
    return "garmin_zip";
  }

  throw new WorkoutResultImportError(
    "unsupported_file_type",
    "Only Garmin .fit files or .zip archives that contain one FIT activity are supported in this release.",
    415,
  );
}

async function extractPrimaryFitFromArchiveForServer(
  zipBuffer: Buffer,
): Promise<ExtractedGarminFitFile> {
  if (typeof window !== "undefined") {
    throw new WorkoutResultImportError(
      "invalid_upload",
      "Garmin ZIP parsing is available only on the server.",
      500,
    );
  }

  const [{ mkdtemp, mkdir, open, readFile, rm }, pathModule, osModule, yauzlModule] =
    await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
      import("node:os"),
      import("yauzl"),
    ]);
  const path = pathModule.default;
  const yauzl = yauzlModule.default;
  const workspace = await mkdtemp(path.join(osModule.tmpdir(), "hito-fit-upload-"));

  try {
    const entries = await new Promise<string[]>((resolve, reject) => {
      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (error, zipFile) => {
        if (error || !zipFile) {
          reject(
            new WorkoutResultImportError(
              "invalid_upload",
              "The uploaded ZIP archive could not be read.",
              422,
            ),
          );
          return;
        }

        const names: string[] = [];

        zipFile.on("entry", (entry) => {
          if (!entry.fileName.endsWith("/")) {
            names.push(entry.fileName);
          }

          zipFile.readEntry();
        });

        zipFile.once("end", () => {
          zipFile.close();
          resolve(names);
        });
        zipFile.once("error", reject);
        zipFile.readEntry();
      });
    });
    const fitEntries = entries.filter((entry) => entry.toLowerCase().endsWith(".fit"));

    if (fitEntries.length === 0) {
      throw new WorkoutResultImportError(
        "zip_missing_fit",
        "This ZIP does not contain a usable .fit activity file.",
        422,
      );
    }

    if (fitEntries.length > 1) {
      throw new WorkoutResultImportError(
        "zip_multiple_fit",
        "This ZIP contains more than one .fit file. Upload a ZIP with one Garmin activity FIT file only.",
        422,
      );
    }

    const primaryFileName = fitEntries[0]!;
    const extractedPath = path.join(workspace, path.basename(primaryFileName));
    await mkdir(path.dirname(extractedPath), { recursive: true });
    const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (error, zipFile) => {
        if (error || !zipFile) {
          reject(
            new WorkoutResultImportError(
              "invalid_upload",
              "The uploaded ZIP archive could not be read.",
              422,
            ),
          );
          return;
        }

        let resolved = false;

        zipFile.on("entry", (entry) => {
          if (entry.fileName !== primaryFileName) {
            zipFile.readEntry();
            return;
          }

          zipFile.openReadStream(entry, async (streamError, readStream) => {
            if (streamError || !readStream) {
              reject(
                new WorkoutResultImportError(
                  "invalid_upload",
                  "The FIT file inside the ZIP archive could not be read.",
                  422,
                ),
              );
              return;
            }

            const chunks: Buffer[] = [];

            readStream.on("data", (chunk) => {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            readStream.once("error", reject);
            readStream.once("end", async () => {
              try {
                const extractedBuffer = Buffer.concat(chunks);
                const fileHandle = await open(extractedPath, "w");
                await fileHandle.writeFile(extractedBuffer);
                await fileHandle.close();
                resolved = true;
                zipFile.close();
                resolve(await readFile(extractedPath));
              } catch (writeError) {
                reject(writeError);
              }
            });
          });
        });

        zipFile.once("end", () => {
          if (!resolved) {
            reject(
              new WorkoutResultImportError(
                "zip_missing_fit",
                "This ZIP does not contain a usable .fit activity file.",
                422,
              ),
            );
          }
        });
        zipFile.once("error", reject);
        zipFile.readEntry();
      });
    });

    return {
      primaryFileKind: "fit",
      primaryFileName,
      fileBuffer,
    };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

async function parseGarminFitActivityForServer(fileBuffer: Buffer) {
  if (typeof window !== "undefined") {
    throw new WorkoutResultImportError(
      "fit_parse_failed",
      "Garmin FIT parsing is available only on the server.",
      500,
    );
  }

  const { parseGarminFitActivity } = await import("@/lib/workout-result-import/parse-garmin-fit");
  return parseGarminFitActivity(fileBuffer);
}

function generateAssetId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fileExtension(fileName: string) {
  const baseName = fileName.trim().split(/[\\/]/).pop() ?? "";
  const dotIndex = baseName.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === baseName.length - 1) {
    return "";
  }

  return baseName.slice(dotIndex).toLowerCase();
}

function normalizeMimeType(mimeType: string, assetKind: WorkoutResultAssetKind) {
  const normalized = mimeType.trim().toLowerCase();

  if (normalized) {
    return normalized;
  }

  return assetKind === "garmin_zip" ? "application/zip" : "application/octet-stream";
}
