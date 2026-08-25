import { createFileRoute } from "@tanstack/react-router";
import { buildHitoProductApiFailure } from "@/lib/product-api-error-contract";
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
          const { projectRunnerActivityHistoryForProduct } =
            await import("@/lib/runner-activity/product-contract");
          return Response.json(
            { ok: true, history: projectRunnerActivityHistoryForProduct(history) },
            { status: 200 },
          );
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Authentication is required for this action."
          ) {
            return Response.json(
              buildHitoProductApiFailure("runner_activity_auth_required", {
                operation: "history_read",
              }),
              { status: 401 },
            );
          }
          if (error instanceof Error && /page size|cursor/i.test(error.message)) {
            return Response.json(
              buildHitoProductApiFailure("runner_activity_history_request_invalid", {}),
              { status: 400 },
            );
          }
          return Response.json(
            buildHitoProductApiFailure("runner_activity_history_unavailable", {}),
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
