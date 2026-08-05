import { createFileRoute } from "@tanstack/react-router";
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
              {
                ok: false,
                code: "auth_required",
                message: "Sign in again before removing the original activity file.",
              },
              { status: 401 },
            );
          }
          if (error instanceof Error && error.name === "RunnerActivityNotFoundError") {
            return Response.json(
              {
                ok: false,
                code: "activity_not_found",
                message: "This activity is not available.",
              },
              { status: 404 },
            );
          }
          return Response.json(
            {
              ok: false,
              code: "activity_source_remove_failed",
              message: "We could not remove the original file. Try again shortly.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
