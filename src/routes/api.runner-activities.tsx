import { createFileRoute } from "@tanstack/react-router";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

export const Route = createFileRoute("/api/runner-activities")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const cursor = url.searchParams.get("cursor");
          const pageSizeValue = url.searchParams.get("pageSize");
          const pageSize = pageSizeValue == null ? undefined : Number(pageSizeValue);
          const userId = await requirePersistedUserIdForCurrentRequest();
          const { listRunnerActivityHistoryForUser } =
            await import("@/lib/runner-activity/history-read-model");
          const history = await listRunnerActivityHistoryForUser({ userId, cursor, pageSize });
          return Response.json({ ok: true, history }, { status: 200 });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Authentication is required for this action."
          ) {
            return Response.json(
              {
                ok: false,
                code: "auth_required",
                message: "Sign in again before opening activity history.",
              },
              { status: 401 },
            );
          }
          if (error instanceof Error && /page size|cursor/i.test(error.message)) {
            return Response.json(
              {
                ok: false,
                code: "activity_history_request_invalid",
                message: "Refresh activity history and try again.",
              },
              { status: 400 },
            );
          }
          return Response.json(
            {
              ok: false,
              code: "activity_history_unavailable",
              message: "We could not load activity history. Try again shortly.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
