import "@tanstack/react-start/server-only";
import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  createRunnerActivityPlannedWorkoutMatch,
  findRunnerActivityPlanMatch,
  linkWorkoutResultAssetToRunnerActivity,
  persistGarminFitActivitySource,
  readRunnerActivityProjection,
  removeRunnerActivityOriginalFilesForWorkout,
} from "@/lib/runner-activity/garmin-fit-source";
import { backfillWorkoutResultActivities } from "@/lib/runner-activity/backfill-workout-result-activities";
import { buildDeterministicWorkoutComparison } from "@/lib/workout-result-import/compare-workout-result";
import { buildWorkoutResultEvidenceBundle } from "@/lib/workout-result-import/evidence-bundle";
import {
  actualMetricsRowToSummary,
  comparisonRowToSummary,
  getLatestWorkoutResultFeedback,
  resultAssetRowToSummary,
} from "@/lib/workout-result-import/read-workout-result-feedback";
import {
  type ExtractedGarminFitFile,
  MAX_WORKOUT_RESULT_UPLOAD_BYTES,
  WORKOUT_RESULT_STORAGE_BUCKET,
  type WorkoutResultAssetKind,
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

export async function ingestGarminWorkoutResult(params: {
  userId: string;
  plannedWorkoutId?: string | null;
  file: File;
}) {
  const { userId, file } = params;
  const plannedWorkoutId = params.plannedWorkoutId?.trim() || null;
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
  const plannedWorkout = plannedWorkoutId
    ? await getOwnedPlannedWorkout(userId, plannedWorkoutId)
    : null;
  const existingLog = plannedWorkoutId ? await getExistingWorkoutLog(plannedWorkoutId) : null;
  await backfillWorkoutResultActivities({ userId });
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

  let insertedMetricsId: string | null = null;
  let candidateAssetDiscarded = false;

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

    if (activitySource.reusedExactSource && existingPlanMatch === plannedWorkoutId) {
      candidateAssetDiscarded = true;
      await discardCandidateUpload({ userId, assetId, storagePath });

      return {
        ok: true as const,
        runnerActivity: runnerActivityReceipt(activitySource),
        ...(plannedWorkout
          ? {
              plannedWorkout: plannedWorkoutReceipt(plannedWorkout),
              ...(await getLatestWorkoutResultFeedback(plannedWorkout.id)),
            }
          : {}),
      };
    }

    if (
      activitySource.reusedExactSource &&
      existingPlanMatch &&
      existingPlanMatch !== plannedWorkoutId
    ) {
      candidateAssetDiscarded = true;
      await discardCandidateUpload({ userId, assetId, storagePath });
      throw new WorkoutResultImportError(
        "activity_already_recorded",
        "That Garmin activity is already attached to another workout.",
        409,
      );
    }

    if (activitySource.reusedExactSource) {
      candidateAssetDiscarded = true;
      await discardCandidateUpload({ userId, assetId, storagePath });
    }

    const activityProjection = await readRunnerActivityProjection({
      userId,
      activityId: activitySource.activityId,
      activityRevisionId: activitySource.activityRevisionId,
    });

    if (!plannedWorkout) {
      await linkWorkoutResultAssetToRunnerActivity({
        userId,
        assetId,
        sourceRevisionId: activitySource.sourceRevisionId,
      });
      const assetUpdate = await supabase
        .from("workout_result_assets")
        .update({
          parse_status: "parsed",
          storage_bucket: activitySource.rawStorageBucket,
          storage_path: activitySource.rawStoragePath,
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
      return { ok: true as const, runnerActivity: runnerActivityReceipt(activitySource) };
    }

    await createRunnerActivityPlannedWorkoutMatch({
      userId,
      activityId: activitySource.activityId,
      sourceRevisionId: activitySource.sourceRevisionId,
      plannedWorkoutId: plannedWorkout.id,
    });

    const metricsInsert = await supabase
      .from("workout_actual_metrics")
      .insert({
        activity_id: activitySource.activityId,
        activity_revision_id: activitySource.activityRevisionId,
        user_id: userId,
        planned_workout_id: plannedWorkout.id,
        workout_log_id: existingLog?.id ?? null,
        result_asset_id: assetId,
        source_kind: "garmin_fit",
        status: "normalized",
        activity_started_at: activityProjection.activityStartedAt,
        activity_local_date: activityProjection.activityLocalDate,
        actual_duration_min: activityProjection.totalDurationMin,
        actual_distance_km: activityProjection.totalDistanceKm,
        actual_avg_hr: activityProjection.avgHeartRate,
        actual_max_hr: activityProjection.maxHeartRate,
        actual_avg_power: activityProjection.avgPower,
        actual_max_power: activityProjection.maxPower,
        actual_avg_cadence: activityProjection.avgCadence,
        actual_calories: activityProjection.totalCalories,
        actual_elevation_gain_m: activityProjection.totalAscentM,
        actual_elevation_loss_m: activityProjection.totalDescentM,
        actual_interval_count: activityProjection.actualIntervalCount,
        actual_step_payload: activityProjection.actualStepPayload,
        lap_payload: activityProjection.lapPayload,
        summary_payload: activityProjection.summaryPayload,
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
        planned_workout_id: plannedWorkout.id,
        actual_metrics_id: metricsInsert.data.id,
        comparison_formula_version: "deterministic_workout_comparison_v1",
        comparison_status: comparison.comparisonStatus,
        completion_state: comparison.completionState,
        difference_payload: comparison.differencePayload as unknown as Json,
        comparison_confidence: comparison.comparisonConfidence,
      })
      .select("*")
      .single();

    if (comparisonInsert.error) {
      throw new WorkoutResultImportError("persistence_failed", comparisonInsert.error.message, 500);
    }

    const latestComparison = comparisonRowToSummary(comparisonInsert.data);

    if (!latestComparison) {
      throw new WorkoutResultImportError(
        "persistence_failed",
        "The generated comparison payload failed canonical readback validation.",
        500,
      );
    }

    const assetUpdate = await supabase
      .from("workout_result_assets")
      .update({
        parse_status: "parsed",
        storage_bucket: activitySource.rawStorageBucket,
        storage_path: activitySource.rawStoragePath,
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

    await linkWorkoutResultAssetToRunnerActivity({
      userId,
      assetId,
      sourceRevisionId: activitySource.sourceRevisionId,
    });

    const supersedeExisting = await supabase
      .from("workout_actual_metrics")
      .update({ status: "superseded" })
      .eq("planned_workout_id", plannedWorkout.id)
      .neq("id", metricsInsert.data.id)
      .neq("status", "superseded");

    if (supersedeExisting.error) {
      throw new WorkoutResultImportError(
        "persistence_failed",
        supersedeExisting.error.message,
        500,
      );
    }

    const latestAsset = resultAssetRowToSummary(assetUpdate.data);
    const latestActualMetrics = actualMetricsRowToSummary(metricsInsert.data);
    const feedback = buildWorkoutResultEvidenceBundle({
      latestAsset,
      latestActualMetrics,
      latestComparison,
      latestAiInsight: null,
    });

    return {
      ok: true as const,
      plannedWorkout: plannedWorkoutReceipt(plannedWorkout),
      runnerActivity: runnerActivityReceipt(activitySource),
      ...feedback,
    };
  } catch (error) {
    const message = runnerSafeWorkoutResultMessage(error);

    if (!candidateAssetDiscarded) {
      await supabase
        .from("workout_result_assets")
        .update({
          parse_status: "failed",
          parse_error: message,
        })
        .eq("id", assetId);
    }

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

async function discardCandidateUpload(input: {
  userId: string;
  assetId: string;
  storagePath: string;
}) {
  const supabase = createAdminSupabaseClient();
  const assetDelete = await supabase
    .from("workout_result_assets")
    .delete()
    .eq("id", input.assetId)
    .eq("user_id", input.userId);
  if (assetDelete.error) {
    throw new WorkoutResultImportError("persistence_failed", assetDelete.error.message, 500);
  }

  const storageRemoval = await supabase.storage
    .from(WORKOUT_RESULT_STORAGE_BUCKET)
    .remove([input.storagePath]);
  if (storageRemoval.error) {
    throw new WorkoutResultImportError("storage_failed", storageRemoval.error.message, 500);
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
