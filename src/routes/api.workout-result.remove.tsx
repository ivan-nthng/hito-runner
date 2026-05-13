import { createFileRoute } from "@tanstack/react-router";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { removeWorkoutResultEvidence } from "@/lib/workout-result-import/ingest-garmin-result";
import { WorkoutResultImportError } from "@/lib/workout-result-import/types";

export const Route = createFileRoute("/api/workout-result/remove")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { plannedWorkoutId?: unknown };
          const plannedWorkoutId =
            typeof body?.plannedWorkoutId === "string" ? body.plannedWorkoutId : "";

          if (!plannedWorkoutId) {
            throw new WorkoutResultImportError(
              "invalid_upload",
              "The target workout for evidence removal was missing.",
            );
          }

          const userId = await requirePersistedUserIdForCurrentRequest();
          const feedback = await removeWorkoutResultEvidence({
            userId,
            plannedWorkoutId,
          });

          return Response.json(
            {
              ok: true,
              feedback,
            },
            { status: 200 },
          );
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
                message: "Sign in again before changing Garmin evidence.",
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
                  : "The Garmin evidence could not be changed in this environment.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
