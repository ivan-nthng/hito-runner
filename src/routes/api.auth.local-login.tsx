import { createFileRoute } from "@tanstack/react-router";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";
import { appendLocalAuthSessionCookie, verifyLocalAuthCredentials } from "@/lib/local-auth";

export const Route = createFileRoute("/api/auth/local-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const formData = await request.formData();
        const appBaseUrl = url.origin;
        const next = sanitizeRedirectPath(
          typeof formData.get("next") === "string"
            ? (formData.get("next") as string)
            : url.searchParams.get("next"),
        );
        const identifier =
          typeof formData.get("identifier") === "string"
            ? (formData.get("identifier") as string)
            : "";
        const password =
          typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
        const authResult = await verifyLocalAuthCredentials(identifier, password);
        const responseHeaders = new Headers();

        if (!authResult.ok) {
          const redirectUrl = new URL("/login", appBaseUrl);
          redirectUrl.searchParams.set(
            "status",
            authResult.reason === "unavailable" ? "local_unavailable" : "invalid_credentials",
          );
          redirectUrl.searchParams.set("next", next);
          responseHeaders.set("location", redirectUrl.toString());

          return new Response(null, {
            status: 302,
            headers: responseHeaders,
          });
        }

        await appendLocalAuthSessionCookie(responseHeaders, request, authResult.account);
        responseHeaders.set("location", new URL(next, appBaseUrl).toString());

        return new Response(null, {
          status: 302,
          headers: responseHeaders,
        });
      },
    },
  },
  component: () => null,
});
