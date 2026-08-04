import { createFileRoute } from "@tanstack/react-router";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

export const Route = createFileRoute("/api/runner-activities/$activityId")({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        try {
          const userId = await requirePersistedUserIdForCurrentRequest();
          const { deleteRunnerActivityFromHistory } =
            await import("@/lib/runner-activity/garmin-fit-source");
          const readback = await deleteRunnerActivityFromHistory({
            userId,
            activityId: params.activityId,
          });
          return Response.json({ ok: true, readback }, { status: 200 });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Authentication is required for this action."
          ) {
            return Response.json(
              {
                ok: false,
                code: "auth_required",
                message: "Sign in again before deleting activity history.",
              },
              { status: 401 },
            );
          }

          return Response.json(
            {
              ok: false,
              code: "activity_delete_failed",
              message: "We could not delete this activity history. Try again shortly.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
