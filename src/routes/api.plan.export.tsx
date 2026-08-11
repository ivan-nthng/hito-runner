import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  CalendarFutureWorkoutsExportUnavailableError,
  exportFutureCalendarWorkoutsForUser,
} from "@/lib/calendar-overflow-actions";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { exportSavedPlanForUser } from "@/lib/active-plan-export-actions";

const planExportQuerySchema = z.union([
  z
    .object({
      format: z.enum(["json", "markdown"]),
      savedPlanId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      format: z.literal("json"),
      scope: z.literal("future-calendar"),
    })
    .strict(),
]);

export const Route = createFileRoute("/api/plan/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const scope = url.searchParams.get("scope");
          const query = planExportQuerySchema.parse(
            scope === null
              ? {
                  format: url.searchParams.get("format"),
                  savedPlanId: url.searchParams.get("savedPlanId"),
                }
              : {
                  format: url.searchParams.get("format"),
                  scope,
                },
          );
          const userId = await requirePersistedUserIdForCurrentRequest();
          const document =
            "scope" in query
              ? await exportFutureCalendarWorkoutsForUser(userId)
              : await exportSavedPlanForUser(userId, query.savedPlanId, query.format);

          return new Response(document.body, {
            status: 200,
            headers: {
              "cache-control": "private, no-store",
              "content-type": document.contentType,
              "content-disposition": buildAttachmentDisposition(document.filename),
            },
          });
        } catch (error) {
          const failure = getPlanExportPublicFailure(error);
          if (failure.report) {
            console.error("[api/plan/export] unexpected plan export failure", error);
          }

          return new Response(failure.message, {
            status: failure.status,
            headers: {
              "cache-control": "private, no-store",
              "content-type": "text/plain; charset=utf-8",
            },
          });
        }
      },
    },
  },
  component: () => null,
});

type PlanExportPublicFailure = {
  status: 400 | 401 | 404 | 500;
  message: string;
  report: boolean;
};

function getPlanExportPublicFailure(error: unknown): PlanExportPublicFailure {
  if (error instanceof z.ZodError) {
    return { status: 400, message: "Choose a valid export format.", report: false };
  }

  if (error instanceof Error && error.message === "Authentication is required for this action.") {
    return { status: 401, message: error.message, report: false };
  }

  if (error instanceof Error && error.message === "The selected saved plan was not found.") {
    return { status: 404, message: error.message, report: false };
  }

  if (error instanceof CalendarFutureWorkoutsExportUnavailableError) {
    return { status: 404, message: error.message, report: false };
  }

  return { status: 500, message: "The selected plan could not be exported.", report: true };
}

function buildAttachmentDisposition(filename: string) {
  const fallback = filename.replace(/["\\\r\n]+/g, "-");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
