import { createFileRoute } from "@tanstack/react-router";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { readBoundedMultipartFormData } from "@/lib/bounded-multipart-form-data";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import {
  LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_FIELD,
  LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE,
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
          const formData = await readBoundedMultipartFormData(
            request,
            MAX_WORKOUT_RESULT_MULTIPART_BYTES,
            workoutResultMultipartTooLargeError,
          );
          const plannedWorkoutId =
            typeof formData.get("plannedWorkoutId") === "string"
              ? (formData.get("plannedWorkoutId") as string).trim() || null
              : null;
          const fileEntry = formData.get("file");
          const fixtureEntry = formData.get(LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_FIELD);
          const requestedFixture = typeof fixtureEntry === "string" ? fixtureEntry : null;

          if (
            !(fileEntry instanceof File) &&
            requestedFixture !== LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE
          ) {
            throw new WorkoutResultImportError(
              "invalid_upload",
              "Choose a Garmin .fit file or .zip archive before uploading.",
            );
          }

          const { ingestGarminWorkoutResult, ingestLocalQaFixtureWorkoutResult } =
            await import("@/lib/workout-result-import/ingest-garmin-result");
          const result =
            fileEntry instanceof File
              ? await ingestGarminWorkoutResult({
                  userId,
                  plannedWorkoutId,
                  file: fileEntry,
                })
              : await ingestLocalQaFixtureWorkoutResult({
                  userId,
                  plannedWorkoutId,
                  requestedFixture: LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE,
                  authProvider: getRequestAuthContext().provider,
                  appBaseUrl: getRequestAuthContext().appBaseUrl,
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

function workoutResultMultipartTooLargeError() {
  return new WorkoutResultImportError(
    "file_too_large",
    "The upload is larger than the 25 MB first-release limit.",
    413,
  );
}
