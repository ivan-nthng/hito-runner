import "@tanstack/react-start/server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isAiGeneratedRunningPlanDevFixtureEnabled } from "@/lib/ai-generated-running-plan-dev-fixture";
import { LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE } from "@/lib/local-activity-file-design-fixture";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  findRunnerActivityPlanMatch,
  persistGarminFitActivitySource,
  readRunnerActivityProjection,
  removeRunnerActivityOriginalFilesForWorkout,
} from "@/lib/runner-activity/garmin-fit-source";
import {
  assertProjectionFailurePointIsLocal,
  discardCandidateUpload,
  type OwnedPlannedWorkoutRow,
  reconcileWorkoutResultProjection,
  type WorkoutResultProjectionFailurePointForQa,
} from "@/lib/workout-result-import/planned-workout-projection";
import { getLatestWorkoutResultFeedback } from "@/lib/workout-result-import/read-workout-result-feedback";
import {
  type ExtractedGarminFitFile,
  MAX_WORKOUT_RESULT_UPLOAD_BYTES,
  WORKOUT_RESULT_STORAGE_BUCKET,
} from "@/lib/workout-result-import/internal-types";
import {
  type WorkoutResultAssetKind,
  runnerSafeWorkoutResultMessage,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";
import { isLoopbackRuntimeUrl } from "@/lib/supabase/env";

const LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SHA256 =
  "fb5e9a4b3a0d9ff90e105c174bb728f730de621875b17503db8981cb80c108a2";

export type { WorkoutResultProjectionFailurePointForQa } from "@/lib/workout-result-import/planned-workout-projection";

export async function ingestLocalQaFixtureWorkoutResult(params: {
  userId: string;
  plannedWorkoutId?: string | null;
  requestedFixture: string;
  authProvider: string;
  appBaseUrl: string | null;
}) {
  if (
    params.authProvider !== "local" ||
    !isLoopbackRuntimeUrl(params.appBaseUrl) ||
    !isAiGeneratedRunningPlanDevFixtureEnabled() ||
    params.requestedFixture !== LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE
  ) {
    throw new WorkoutResultImportError(
      "invalid_upload",
      "Choose a Garmin .fit file or .zip archive before uploading.",
    );
  }

  const fileBuffer = await readFile(
    resolve(process.cwd(), LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE),
  );
  const checksum = createHash("sha256").update(fileBuffer).digest("hex");
  if (checksum !== LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SHA256) {
    throw new WorkoutResultImportError(
      "invalid_upload",
      "The approved local FIT fixture does not match its canonical checksum.",
    );
  }

  return ingestGarminWorkoutResult({
    userId: params.userId,
    plannedWorkoutId: params.plannedWorkoutId,
    file: new File([fileBuffer], LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE, {
      type: "application/octet-stream",
    }),
  });
}

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

export async function removeWorkoutResultEvidence(params: {
  userId: string;
  plannedWorkoutId: string;
}) {
  const { userId, plannedWorkoutId } = params;
  await getOwnedPlannedWorkout(userId, plannedWorkoutId);
  await removeRunnerActivityOriginalFilesForWorkout({
    userId,
    plannedWorkoutId,
  });
  return getLatestWorkoutResultFeedback({ userId, plannedWorkoutId });
}

async function getOwnedPlannedWorkout(userId: string, plannedWorkoutId: string) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from("planned_workouts")
    .select("id, workout_date, workout_type, source_workout_type, title, steps")
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

  const yauzlModule = await import("yauzl");
  const yauzl = yauzlModule.default;
  const maxArchiveEntries = 256;
  const entries = await new Promise<Array<{ fileName: string; uncompressedSize: number }>>(
    (resolve, reject) => {
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

        const values: Array<{ fileName: string; uncompressedSize: number }> = [];
        let entryCount = 0;

        zipFile.on("entry", (entry) => {
          entryCount += 1;
          if (!entry.fileName.endsWith("/")) {
            values.push({
              fileName: entry.fileName,
              uncompressedSize: entry.uncompressedSize,
            });
          }
          if (entryCount > maxArchiveEntries) {
            zipFile.close();
            reject(
              new WorkoutResultImportError(
                "invalid_upload",
                "This ZIP contains too many files to process safely.",
                422,
              ),
            );
            return;
          }

          zipFile.readEntry();
        });

        zipFile.once("end", () => {
          zipFile.close();
          resolve(values);
        });
        zipFile.once("error", () => reject(invalidZipArchiveError()));
        zipFile.readEntry();
      });
    },
  );
  const fitEntries = entries.filter((entry) => entry.fileName.toLowerCase().endsWith(".fit"));

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

  const primaryEntry = fitEntries[0]!;
  if (primaryEntry.uncompressedSize > MAX_WORKOUT_RESULT_UPLOAD_BYTES) {
    throw new WorkoutResultImportError(
      "file_too_large",
      "The FIT file inside the ZIP is larger than the 25 MB first-release limit.",
      413,
    );
  }

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
        if (entry.fileName !== primaryEntry.fileName) {
          zipFile.readEntry();
          return;
        }

        zipFile.openReadStream(entry, (streamError, readStream) => {
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
          let extractedBytes = 0;

          readStream.on("data", (chunk) => {
            const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            extractedBytes += value.length;
            if (extractedBytes > MAX_WORKOUT_RESULT_UPLOAD_BYTES) {
              readStream.destroy(
                new WorkoutResultImportError(
                  "file_too_large",
                  "The FIT file inside the ZIP is larger than the 25 MB first-release limit.",
                  413,
                ),
              );
              return;
            }
            chunks.push(value);
          });
          readStream.once("error", (streamError) =>
            reject(
              streamError instanceof WorkoutResultImportError
                ? streamError
                : invalidZipArchiveError(),
            ),
          );
          readStream.once("end", () => {
            resolved = true;
            zipFile.close();
            resolve(Buffer.concat(chunks, extractedBytes));
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
      zipFile.once("error", () => reject(invalidZipArchiveError()));
      zipFile.readEntry();
    });
  });

  return {
    primaryFileKind: "fit",
    primaryFileName: primaryEntry.fileName,
    fileBuffer,
  };
}

function invalidZipArchiveError() {
  return new WorkoutResultImportError(
    "invalid_upload",
    "The uploaded ZIP archive could not be read.",
    422,
  );
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
