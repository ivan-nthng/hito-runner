import { createMiddleware, createStart } from "@tanstack/react-start";
import {
  buildLoopbackAdminCanonicalRedirect,
  resolveAdminAuthSession,
} from "@/lib/admin-access.server";
import { resolveLocalAuthSession } from "@/lib/local-auth";
import { resolveRuntimeAppBaseUrl } from "@/lib/supabase/env";
import { createRequestSupabaseClient, mergeResponseHeaders } from "@/lib/supabase/server";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";

const authMiddleware = createMiddleware().server(
  async ({ next, pathname, request, serverFnMeta }) => {
    const loopbackAdminRedirect = buildLoopbackAdminCanonicalRedirect(request, {
      pathname,
      serverFnMeta,
    });

    if (loopbackAdminRedirect) {
      return loopbackAdminRedirect;
    }

    const appBaseUrl = resolveRuntimeAppBaseUrl({ requestUrl: request.url });
    const adminSession = await resolveAdminAuthSession(request, { pathname, serverFnMeta });

    if (adminSession) {
      return next({
        context: {
          auth: {
            userId: adminSession.userId,
            email: adminSession.email,
            appBaseUrl,
            provider: "admin",
            adminSession: {
              label: adminSession.label,
              source: adminSession.source,
              runtimeClass: adminSession.runtimeClass,
            },
          },
        },
      });
    }

    const localSession = await resolveLocalAuthSession(request);

    if (localSession) {
      return next({
        context: {
          auth: {
            userId: localSession.userId,
            email: localSession.email,
            appBaseUrl,
            provider: "local",
          },
        },
      });
    }

    if (!hasSupabaseBrowserEnv) {
      return next({
        context: {
          auth: {
            userId: null,
            email: null,
            appBaseUrl,
            provider: "preview",
          },
        },
      });
    }

    const responseHeaders = new Headers();
    const supabase = createRequestSupabaseClient(request, responseHeaders);

    let userId: string | null = null;
    let email: string | null = null;

    const userResult = await supabase.auth.getUser();

    if (userResult.error) {
      await supabase.auth.signOut();
    } else {
      const user = userResult.data.user;
      userId = user?.id ?? null;
      email = user?.email ?? null;
    }

    const result = await next({
      context: {
        auth: {
          userId,
          email,
          appBaseUrl,
          provider: userId ? "supabase" : "preview",
        },
      },
    });

    return mergeResponseHeaders(result.response, responseHeaders);
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [authMiddleware],
}));
