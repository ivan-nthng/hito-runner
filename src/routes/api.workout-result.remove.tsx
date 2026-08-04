import { createFileRoute } from "@tanstack/react-router";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import {
  runnerSafeWorkoutResultMessage,
  workoutResultErrorResponseHeaders,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";

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
          const { removeWorkoutResultEvidence } =
            await import("@/lib/workout-result-import/ingest-garmin-result");
          const feedback = await removeWorkoutResultEvidence({
            userId,
            plannedWorkoutId,
          });
          const { findRunnerActivityForPlannedWorkout } =
            await import("@/lib/runner-activity/garmin-fit-source");
          const activityId = await findRunnerActivityForPlannedWorkout({
            userId,
            plannedWorkoutId,
          });
          const activityReadback = activityId
            ? await (
                await import("@/lib/runner-activity/read-model")
              ).readRunnerActivityMutationReadback({
                userId,
                activityId,
                creationCause: "source_removal",
              })
            : null;

          return Response.json(
            {
              ok: true,
              feedback,
              activityReadback,
            },
            { status: 200 },
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
                message: "Sign in again before changing Garmin evidence.",
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
