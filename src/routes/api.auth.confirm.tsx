import { createFileRoute } from "@tanstack/react-router";
import { exchangeCodeForSession } from "@/lib/auth-actions";

export const Route = createFileRoute("/api/auth/confirm")({
  server: {
    handlers: {
      GET: ({ request }) => exchangeCodeForSession(request),
    },
  },
  component: () => null,
});
