import { createFileRoute } from "@tanstack/react-router";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import {
  MAX_WORKOUT_RESULT_MULTIPART_BYTES,
  runnerSafeWorkoutResultMessage,
  workoutResultErrorResponseHeaders,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";

export const Route = createFileRoute("/api/workout-result/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = await requirePersistedUserIdForCurrentRequest();
          const formData = await readBoundedWorkoutResultFormData(request);
          const plannedWorkoutId =
            typeof formData.get("plannedWorkoutId") === "string"
              ? (formData.get("plannedWorkoutId") as string).trim() || null
              : null;
          const fileEntry = formData.get("file");

          if (!(fileEntry instanceof File)) {
            throw new WorkoutResultImportError(
              "invalid_upload",
              "Choose a Garmin .fit file or .zip archive before uploading.",
            );
          }

          const { ingestGarminWorkoutResult } =
            await import("@/lib/workout-result-import/ingest-garmin-result");
          const result = await ingestGarminWorkoutResult({
            userId,
            plannedWorkoutId,
            file: fileEntry,
          });
          const feedback = "plannedWorkout" in result ? result : null;

          return Response.json(
            {
              ok: true,
              marker: feedback?.marker ?? null,
              latestAsset: feedback?.latestAsset ?? null,
              latestActualMetrics: feedback?.latestActualMetrics ?? null,
              latestComparison: feedback?.latestComparison ?? null,
              latestAiInsight: feedback?.latestAiInsight ?? null,
            },
            {
              status: 200,
            },
          );
        } catch (error) {
          if (error instanceof WorkoutResultImportError) {
            return Response.json(
              {
                ok: false,
                code: error.code,
                message: runnerSafeWorkoutResultMessage(error),
              },
              { status: error.status, headers: workoutResultErrorResponseHeaders(error.code) },
            );
          }

          if (
            error instanceof Error &&
            error.message === "Authentication is required for this action."
          ) {
            return Response.json(
              {
                ok: false,
                code: "auth_required",
                message: "Sign in again before uploading a Garmin result file.",
              },
              { status: 401, headers: workoutResultErrorResponseHeaders("auth_required") },
            );
          }

          return Response.json(
            {
              ok: false,
              code: "persistence_failed",
              message: runnerSafeWorkoutResultMessage(error),
            },
            {
              status: 500,
              headers: workoutResultErrorResponseHeaders("persistence_failed"),
            },
          );
        }
      },
    },
  },
  component: () => null,
});

async function readBoundedWorkoutResultFormData(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_WORKOUT_RESULT_MULTIPART_BYTES) {
    throw workoutResultMultipartTooLargeError();
  }

  if (!request.body) {
    return request.formData();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const result = await reader.read();
    if (result.done) break;
    totalBytes += result.value.byteLength;
    if (totalBytes > MAX_WORKOUT_RESULT_MULTIPART_BYTES) {
      await reader.cancel();
      throw workoutResultMultipartTooLargeError();
    }
    chunks.push(result.value);
  }

  const boundedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: new Blob(chunks),
  });
  return boundedRequest.formData();
}

function workoutResultMultipartTooLargeError() {
  return new WorkoutResultImportError(
    "file_too_large",
    "The upload is larger than the 25 MB first-release limit.",
    413,
  );
}
