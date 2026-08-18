import { createFileRoute } from "@tanstack/react-router";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

export const Route = createFileRoute("/api/runner-activity-progress")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const userId = await requirePersistedUserIdForCurrentRequest();
          const { getRunnerActivityProgressForUser, parseRunnerActivityFitSequencePeriodRequest } =
            await import("@/lib/runner-activity/read-model");
          const { projectRunnerActivityProgressForProduct } =
            await import("@/lib/runner-activity/product-contract");
          const search = new URL(request.url).searchParams;
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
              {
                ok: false,
                code: "auth_required",
                message: "Sign in again before opening running progress.",
              },
              { status: 401 },
            );
          }
          if (
            error instanceof Error &&
            error.name === "RunnerActivityFitSequencePeriodInputError"
          ) {
            return Response.json(
              {
                ok: false,
                code: "invalid_activity_sequence_period",
                message: error.message,
              },
              { status: 400 },
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
