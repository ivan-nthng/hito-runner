import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { exportActivePlanForUser } from "@/lib/training-api";

const planExportQuerySchema = z.object({
  format: z.enum(["json", "markdown"]),
});

export const Route = createFileRoute("/api/plan/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const { format } = planExportQuerySchema.parse({
            format: url.searchParams.get("format"),
          });
          const userId = await requirePersistedUserIdForCurrentRequest();
          const document = await exportActivePlanForUser(userId, format);

          return new Response(document.body, {
            status: 200,
            headers: {
              "cache-control": "private, no-store",
              "content-type": document.contentType,
              "content-disposition": buildAttachmentDisposition(document.filename),
            },
          });
        } catch (error) {
          const message =
            error instanceof z.ZodError
              ? "Choose a valid export format."
              : error instanceof Error
                ? error.message
                : "The active plan could not be exported.";
          const status =
            error instanceof z.ZodError
              ? 400
              : error instanceof Error &&
                  error.message === "Authentication is required for this action."
                ? 401
                : error instanceof Error && error.message === "There is no active plan to export."
                  ? 404
                  : 500;

          return new Response(message, {
            status,
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

function buildAttachmentDisposition(filename: string) {
  const fallback = filename.replace(/["\\\r\n]+/g, "-");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
