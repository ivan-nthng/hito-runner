import { createMiddleware, createStart } from "@tanstack/react-start";
import {
  buildLoopbackAdminCanonicalRedirect,
  resolveAdminAuthSession,
} from "@/lib/admin-access.server";
import { resolveLocalAuthSession } from "@/lib/local-auth";
import { resolveRuntimeAppBaseUrl } from "@/lib/supabase/env";
import { createRequestSupabaseClient, mergeResponseHeaders } from "@/lib/supabase/server";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import {
  createLocalRuntimeRequestContext,
  recordLocalRuntimeActionFailure,
  recordLocalRuntimeActionOutcome,
  recordLocalRuntimeRequestFailure,
  recordLocalRuntimeRequestOutcome,
} from "@/lib/local-runtime-observability";

const localRuntimeObservabilityMiddleware = createMiddleware().server(
  async ({ next, pathname, request, serverFnMeta }) => {
    const startedAtMs = Date.now();
    const localRuntimeObservability = createLocalRuntimeRequestContext({
      request,
      pathname,
      serverFunctionId: serverFnMeta?.id ?? null,
    });

    try {
      const result = await next({
        context: {
          localRuntimeObservability,
        },
      });
      await recordLocalRuntimeRequestOutcome({
        context: localRuntimeObservability,
        response: result.response,
        startedAtMs,
      }).catch(() => undefined);
      return result;
    } catch (error) {
      await recordLocalRuntimeRequestFailure({
        context: localRuntimeObservability,
        startedAtMs,
        error,
      }).catch(() => undefined);
      throw error;
    }
  },
);

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

const localRuntimeActionObservabilityMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next, method, serverFnMeta }) => {
  const startedAtMs = Date.now();

  try {
    const result = await next();
    await recordLocalRuntimeActionOutcome({
      result: (result as unknown as { result?: unknown }).result,
      method,
      serverFunctionId: serverFnMeta.id,
      startedAtMs,
    }).catch(() => undefined);
    return result;
  } catch (error) {
    await recordLocalRuntimeActionFailure({
      method,
      serverFunctionId: serverFnMeta.id,
      startedAtMs,
      error,
    }).catch(() => undefined);
    throw error;
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [localRuntimeObservabilityMiddleware, authMiddleware],
  functionMiddleware: [localRuntimeActionObservabilityMiddleware],
}));
