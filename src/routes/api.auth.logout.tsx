import { createFileRoute } from "@tanstack/react-router";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";
import { clearLocalAuthSessionCookie } from "@/lib/local-auth";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { createRequestSupabaseClient } from "@/lib/supabase/server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const next = sanitizeRedirectPath(url.searchParams.get("next"));
        const responseHeaders = new Headers();

        clearLocalAuthSessionCookie(responseHeaders, request);

        if (hasSupabaseBrowserEnv) {
          const supabase = createRequestSupabaseClient(request, responseHeaders);
          await supabase.auth.signOut();
        }

        responseHeaders.set("location", new URL(next, url.origin).toString());

        return new Response(null, {
          status: 302,
          headers: responseHeaders,
        });
      },
    },
  },
  component: () => null,
});
