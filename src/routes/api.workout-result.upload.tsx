import { createFileRoute } from "@tanstack/react-router";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { readBoundedMultipartFormData } from "@/lib/bounded-multipart-form-data";
import {
  LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_FIELD,
  LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE,
} from "@/lib/local-activity-file-design-fixture";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { buildHitoProductApiFailure } from "@/lib/product-api-error-contract";
import {
  MAX_WORKOUT_RESULT_UPLOAD_BYTES,
  MAX_WORKOUT_RESULT_MULTIPART_BYTES,
  workoutResultErrorResponseHeaders,
} from "@/lib/workout-result-import/internal-types";
import {
  buildWorkoutResultProductApiFailure,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";

export const Route = createFileRoute("/api/workout-result/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = getRequestAuthContext();
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

          const {
            ingestGarminWorkoutResult,
            ingestLocalQaFixtureWorkoutResult,
            interceptCamelotSelectedActivityFile,
          } = await import("@/lib/workout-result-import/ingest-garmin-result");
          const camelotUpload =
            fileEntry instanceof File
              ? await interceptCamelotSelectedActivityFile({
                  auth,
                  persistedUserId: userId,
                  plannedWorkoutId,
                  selectedFile: fileEntry,
                })
              : null;
          const result = camelotUpload
            ? camelotUpload.result
            : fileEntry instanceof File
              ? await ingestGarminWorkoutResult({
                  userId,
                  plannedWorkoutId,
                  file: fileEntry,
                })
              : await ingestLocalQaFixtureWorkoutResult({
                  userId,
                  plannedWorkoutId,
                  requestedFixture: LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE,
                  authProvider: auth.provider,
                  appBaseUrl: auth.appBaseUrl,
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
              fixtureOutcome: camelotUpload?.outcome ?? null,
            },
            {
              status: 200,
            },
          );
        } catch (error) {
          if (error instanceof WorkoutResultImportError) {
            return Response.json(
              buildWorkoutResultProductApiFailure({
                error,
                operation: "upload",
                maxUploadBytes: MAX_WORKOUT_RESULT_UPLOAD_BYTES,
              }),
              { status: error.status, headers: workoutResultErrorResponseHeaders(error.code) },
            );
          }

          if (
            error instanceof Error &&
            error.message === "Authentication is required for this action."
          ) {
            return Response.json(
              buildHitoProductApiFailure("workout_result_auth_required", {
                operation: "upload",
              }),
              { status: 401, headers: workoutResultErrorResponseHeaders("auth_required") },
            );
          }

          return Response.json(
            buildWorkoutResultProductApiFailure({
              error,
              operation: "upload",
              maxUploadBytes: MAX_WORKOUT_RESULT_UPLOAD_BYTES,
            }),
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
