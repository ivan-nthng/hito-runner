import { createFileRoute } from "@tanstack/react-router";
import { loginLocalAdminForRequest } from "@/lib/admin-auth-actions.server";

export const Route = createFileRoute("/api/admin/auth/login")({
  server: {
    handlers: {
      POST: ({ request }) => loginLocalAdminForRequest(request),
    },
  },
  component: () => null,
});
