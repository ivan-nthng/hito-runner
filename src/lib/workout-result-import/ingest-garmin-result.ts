import "@tanstack/react-start/server-only";
import { parseBodyNotesValue } from "@/lib/body-notes";
import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  deriveWeekStatus,
  deriveWorkoutRichModel,
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
  buildWorkoutAiBodyNoteContext,
  clampWorkoutAiInsight,
  generateWorkoutAiInsight,
  type WorkoutAiPromptInput,
} from "@/lib/workout-result-import/generate-workout-ai-insight";
import {
  actualMetricsRowToSummary,
  comparisonRowToSummary,
  deriveWorkoutFeedbackMarker,
  getLatestWorkoutResultFeedback,
  resultAssetRowToSummary,
  workoutAiInsightRowToSummary,
} from "@/lib/workout-result-import/read-workout-result-feedback";
import {
  type ExtractedGarminFitFile,
  MAX_WORKOUT_RESULT_UPLOAD_BYTES,
  WORKOUT_RESULT_STORAGE_BUCKET,
  type WorkoutComparisonDifferencePayload,
  type WorkoutResultAssetKind,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";

type PersistedWorkoutActualMetricsRow =
  Database["public"]["Tables"]["workout_actual_metrics"]["Row"];
type PersistedWorkoutComparisonRow = Database["public"]["Tables"]["workout_comparisons"]["Row"];
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
  plannedWorkoutId: string;
  assetId: string;
  originalFileName: string;
}) {
  const ext = fileExtension(args.originalFileName) || ".bin";
  return `${args.userId}/${args.plannedWorkoutId}/${args.assetId}/original${ext}`;
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
  if (!import.meta.env.SSR) {
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
  if (!import.meta.env.SSR) {
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

async function tryPersistWorkoutAiInsight(args: {
  userId: string;
  plannedWorkout: OwnedPlannedWorkoutRow;
  actualMetrics: PersistedWorkoutActualMetricsRow;
  comparison: PersistedWorkoutComparisonRow;
}) {
  const { userId, plannedWorkout, actualMetrics, comparison } = args;

  try {
    const { checkRunnerCapability } = await import("@/lib/entitlements/check-runner-capability");
    const capabilityCheck = await checkRunnerCapability({
      userId,
      capabilityKey: "garmin_ai_interpretation",
    });

    if (!capabilityCheck.allowed) {
      return null;
    }

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
      "id, plan_cycle_id, user_id, workout_date, weekday, week_number, phase, workout_type, source_workout_type, workout_family, workout_identity, calendar_icon_key, goal_context, metric_mode, title, notes, steps, display_order",
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
  const bodyNoteContext = buildWorkoutAiBodyNoteContext(currentWorkout.log?.bodyNotes ?? []);

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
    ...(bodyNoteContext ? { bodyNoteContext } : {}),
  };
}

function persistedWorkoutRowToView(
  workout: OwnedPlannedWorkoutRow,
  log: PersistedWorkoutLogRow | null,
  currentDate: string,
): Workout {
  const mappedLog = log ? persistedWorkoutLogToView(log) : null;
  const steps = Array.isArray(workout.steps) ? (workout.steps as Step[]) : [];

  return {
    id: workout.id,
    date: workout.workout_date,
    weekday: workout.weekday,
    week: workout.week_number,
    phase: workout.phase,
    type: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    ...deriveWorkoutRichModel({
      type: workout.workout_type,
      sourceWorkoutType: workout.source_workout_type,
      workoutFamily: workout.workout_family,
      workoutIdentity: workout.workout_identity,
      calendarIconKey: workout.calendar_icon_key,
      goalContext: workout.goal_context,
      metricMode: workout.metric_mode,
      title: workout.title,
      steps,
    }),
    title: workout.title,
    notes: workout.notes,
    steps,
    feedbackMarker: null,
    log: mappedLog,
    status: inferWorkoutStatus(workout.workout_type, workout.workout_date, currentDate, mappedLog),
  };
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
    bodyNotes: parseBodyNotesValue(log.body_notes),
    loggedAt: log.logged_at,
  };
}
