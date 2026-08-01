import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import {
  hasSupabaseBrowserEnv,
  hasSupabaseServerEnv,
  publicEnv,
  serverEnv,
} from "@/lib/supabase/env";

export function createRequestSupabaseClient(request: Request, responseHeaders: Headers) {
  if (!hasSupabaseBrowserEnv) {
    throw new Error("Supabase auth is not configured in this environment.");
  }

  return createServerClient<Database>(publicEnv.supabaseUrl!, publicEnv.supabasePublishableKey!, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie") ?? "");
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          responseHeaders.append("set-cookie", serializeCookieHeader(name, value, options));
        }

        for (const [key, value] of Object.entries(headers)) {
          responseHeaders.set(key, value);
        }
      },
    },
  });
}

export function createAdminSupabaseClient(): SupabaseClient<Database> {
  if (!hasSupabaseServerEnv) {
    throw new Error("Persisted Supabase access is not configured in this environment.");
  }

  return createClient<Database>(publicEnv.supabaseUrl!, serverEnv.supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function resolveRequestSupabaseAuth(supabase: Pick<SupabaseClient<Database>, "auth">) {
  let userResult: Awaited<ReturnType<SupabaseClient<Database>["auth"]["getUser"]>>;

  try {
    userResult = await supabase.auth.getUser();
  } catch {
    // A transport failure cannot authenticate this request, but must not destroy a valid cookie.
    return { userId: null, email: null };
  }

  if (userResult.error) {
    // @supabase/ssr already clears a missing session through its cookie storage.
    // Only clear cookies here when Auth has conclusively rejected their contents.
    if (shouldClearRejectedSupabaseSession(userResult.error)) {
      await supabase.auth.signOut();
    }

    return { userId: null, email: null };
  }

  return {
    userId: userResult.data.user?.id ?? null,
    email: userResult.data.user?.email ?? null,
  };
}

export function shouldClearRejectedSupabaseSession(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as { code?: unknown; status?: unknown };

  return authError.code === "invalid_jwt" || authError.status === 401 || authError.status === 403;
}

export function mergeResponseHeaders(baseResponse: Response, extraHeaders: Headers) {
  const merged = new Headers(baseResponse.headers);

  extraHeaders.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      merged.append(key, value);
      return;
    }

    merged.set(key, value);
  });

  return new Response(baseResponse.body, {
    status: baseResponse.status,
    statusText: baseResponse.statusText,
    headers: merged,
  });
}
