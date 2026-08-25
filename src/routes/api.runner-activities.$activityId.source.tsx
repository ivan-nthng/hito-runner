import { createFileRoute } from "@tanstack/react-router";
import { buildHitoProductApiFailure } from "@/lib/product-api-error-contract";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

export const Route = createFileRoute("/api/runner-activities/$activityId/source")({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        try {
          const userId = await requirePersistedUserIdForCurrentRequest();
          const { removeRunnerActivityOriginalFilesForActivity } =
            await import("@/lib/runner-activity/garmin-fit-source");
          const readback = await removeRunnerActivityOriginalFilesForActivity({
            userId,
            activityId: params.activityId,
          });
          const { projectRunnerActivityMutationReadbackForProduct } =
            await import("@/lib/runner-activity/product-contract");
          return Response.json(
            { ok: true, readback: projectRunnerActivityMutationReadbackForProduct(readback) },
            { status: 200 },
          );
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Authentication is required for this action."
          ) {
            return Response.json(
              buildHitoProductApiFailure("runner_activity_auth_required", {
                operation: "source_remove",
              }),
              { status: 401 },
            );
          }
          if (error instanceof Error && error.name === "RunnerActivityNotFoundError") {
            return Response.json(
              buildHitoProductApiFailure("runner_activity_not_found", {
                operation: "source_remove",
              }),
              { status: 404 },
            );
          }
          return Response.json(
            buildHitoProductApiFailure("runner_activity_source_remove_failed", {}),
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
