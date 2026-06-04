import { createFileRoute } from "@tanstack/react-router";
import { logoutAdminForRequest } from "@/lib/admin-auth-actions.server";

export const Route = createFileRoute("/api/admin/auth/logout")({
  server: {
    handlers: {
      GET: ({ request }) => logoutAdminForRequest(request),
    },
  },
  component: () => null,
});
