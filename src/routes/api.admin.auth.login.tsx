import { createFileRoute } from "@tanstack/react-router";
import { loginAdminForRequest } from "@/lib/admin-auth-actions.server";

export const Route = createFileRoute("/api/admin/auth/login")({
  server: {
    handlers: {
      POST: ({ request }) => loginAdminForRequest(request),
    },
  },
  component: () => null,
});
