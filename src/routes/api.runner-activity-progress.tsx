import { createFileRoute } from "@tanstack/react-router";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

export const Route = createFileRoute("/api/runner-activity-progress")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const userId = await requirePersistedUserIdForCurrentRequest();
          const { getRunnerActivityProgressForUser } =
            await import("@/lib/runner-activity/read-model");
          const progress = await getRunnerActivityProgressForUser({ userId });
          return Response.json({ ok: true, progress }, { status: 200 });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Authentication is required for this action."
          ) {
            return Response.json(
              {
                ok: false,
                code: "auth_required",
                message: "Sign in again before opening running progress.",
              },
              { status: 401 },
            );
          }
          return Response.json(
            {
              ok: false,
              code: "activity_progress_unavailable",
              message: "We could not load running progress. Try again shortly.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
