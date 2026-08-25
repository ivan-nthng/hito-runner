import { createFileRoute } from "@tanstack/react-router";
import { buildHitoProductApiFailure } from "@/lib/product-api-error-contract";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

export const Route = createFileRoute("/api/runner-activity-progress")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const search = new URL(request.url).searchParams;
        try {
          const userId = await requirePersistedUserIdForCurrentRequest();
          const { getRunnerActivityProgressForUser, parseRunnerActivityFitSequencePeriodRequest } =
            await import("@/lib/runner-activity/read-model");
          const { projectRunnerActivityProgressForProduct } =
            await import("@/lib/runner-activity/product-contract");
          const period = search.get("period") ?? "this_week";
          const sequencePeriod = parseRunnerActivityFitSequencePeriodRequest(
            period === "custom"
              ? {
                  kind: period,
                  startDate: search.get("startDate"),
                  endDate: search.get("endDate"),
                }
              : { kind: period },
          );
          const progress = projectRunnerActivityProgressForProduct(
            await getRunnerActivityProgressForUser({ userId, sequencePeriod }),
          );
          return Response.json({ ok: true, progress }, { status: 200 });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Authentication is required for this action."
          ) {
            return Response.json(
              buildHitoProductApiFailure("runner_activity_auth_required", {
                operation: "progress_read",
              }),
              { status: 401 },
            );
          }
          if (
            error instanceof Error &&
            error.name === "RunnerActivityFitSequencePeriodInputError"
          ) {
            return Response.json(
              buildHitoProductApiFailure("runner_activity_progress_period_invalid", {
                period: search.get("period") ?? "this_week",
              }),
              { status: 400 },
            );
          }
          return Response.json(
            buildHitoProductApiFailure("runner_activity_progress_unavailable", {}),
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
