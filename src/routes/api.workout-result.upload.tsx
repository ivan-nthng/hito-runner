import { createFileRoute } from "@tanstack/react-router";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { WorkoutResultImportError } from "@/lib/workout-result-import/types";

export const Route = createFileRoute("/api/workout-result/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.formData();
          const plannedWorkoutId =
            typeof formData.get("plannedWorkoutId") === "string"
              ? (formData.get("plannedWorkoutId") as string)
              : "";
          const fileEntry = formData.get("file");

          if (!(fileEntry instanceof File)) {
            throw new WorkoutResultImportError(
              "invalid_upload",
              "Choose a Garmin .fit file or .zip archive before uploading.",
            );
          }

          const userId = await requirePersistedUserIdForCurrentRequest();
          const { ingestGarminWorkoutResult } =
            await import("@/lib/workout-result-import/ingest-garmin-result");
          const result = await ingestGarminWorkoutResult({
            userId,
            plannedWorkoutId,
            file: fileEntry,
          });

          return Response.json(result, {
            status: 200,
          });
        } catch (error) {
          if (error instanceof WorkoutResultImportError) {
            return Response.json(
              {
                ok: false,
                code: error.code,
                message: error.message,
              },
              { status: error.status },
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
              { status: 401 },
            );
          }

          return Response.json(
            {
              ok: false,
              code: "persistence_failed",
              message:
                error instanceof Error
                  ? error.message
                  : "The Garmin result could not be uploaded in this environment.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
