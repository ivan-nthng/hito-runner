import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_AUTH_REDIRECT, sanitizeRedirectPath } from "@/lib/auth-redirect";
import { getRequestAuthContext } from "@/lib/backend/auth";
import type { Database } from "@/lib/supabase/database";
import {
  hasSupabaseBrowserEnv,
  isDevOnlyLocalAuthRuntime,
  publicEnv,
  resolveMagicLinkAppBaseUrl,
  resolveRuntimeAppBaseUrl,
} from "@/lib/supabase/env";
import { createRequestSupabaseClient } from "@/lib/supabase/server";
import { isLocalAuthBypassEnabled } from "@/lib/local-auth";

export const loginInputSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().trim().max(500).optional().nullable(),
});

type LoginInput = z.output<typeof loginInputSchema>;

type LoginRouteDataLoaders<TSnapshot, TViewer> = {
  loadSnapshot: () => Promise<TSnapshot>;
  loadViewer: () => Promise<TViewer>;
};

const emailOtpTypeSchema = z.enum([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function loadLoginRouteData<TSnapshot, TViewer>({
  loadSnapshot,
  loadViewer,
}: LoginRouteDataLoaders<TSnapshot, TViewer>) {
  const auth = getRequestAuthContext();

  return {
    snapshot: await loadSnapshot(),
    viewer: await loadViewer(),
    localBypassEnabled: await isLocalAuthBypassEnabledForRequest(auth.appBaseUrl),
    magicLinkEnabled: canUseMagicLinkForRequest(auth.appBaseUrl),
  };
}

export async function requestMagicLinkForCurrentRequest(data: LoginInput) {
  const auth = getRequestAuthContext();
  const magicLinkAppBaseUrl = getMagicLinkAppBaseUrl(auth.appBaseUrl);

  if (!hasSupabaseBrowserEnv) {
    throw new Error(
      "Magic link sign-in is not configured in this environment yet. Add real Supabase env values to test login.",
    );
  }

  if (!magicLinkAppBaseUrl) {
    throw new Error(
      "Email sign-in links are not available from this local runtime. Use local login here, or open Hito from a public app URL before requesting a sign-in link.",
    );
  }

  const supabase = createClient<Database>(
    publicEnv.supabaseUrl!,
    publicEnv.supabasePublishableKey!,
    {
      auth: {
        autoRefreshToken: false,
        flowType: "pkce",
        persistSession: false,
      },
    },
  );
  const redirectTo = new URL("/api/auth/confirm", magicLinkAppBaseUrl);
  const next = sanitizeRedirectPath(data.next);
  redirectTo.searchParams.set("next", next);

  const { error } = await supabase.auth.signInWithOtp({
    email: data.email,
    options: {
      emailRedirectTo: redirectTo.toString(),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    ok: true,
  };
}

export async function exchangeCodeForSession(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = parseEmailOtpType(url.searchParams.get("type"));
  const appBaseUrl = getRuntimeAppBaseUrl(request);
  const next = sanitizeRedirectPath(url.searchParams.get("next"));
  const responseHeaders = new Headers();

  if (!hasSupabaseBrowserEnv) {
    return redirectResponse(
      buildLoginRedirect("error", next, appBaseUrl).toString(),
      responseHeaders,
    );
  }

  const supabase = createRequestSupabaseClient(request, responseHeaders);

  if (!code && !(tokenHash && otpType)) {
    return redirectResponse(
      buildLoginRedirect("error", next, appBaseUrl).toString(),
      responseHeaders,
    );
  }

  const authResult = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: otpType!,
      });

  if (authResult.error) {
    return redirectResponse(
      buildLoginRedirect("error", next, appBaseUrl).toString(),
      responseHeaders,
    );
  }

  return redirectResponse(new URL(next, appBaseUrl).toString(), responseHeaders);
}

export function canUseMagicLinkForRequest(appBaseUrl: string | null) {
  return hasSupabaseBrowserEnv && Boolean(getMagicLinkAppBaseUrl(appBaseUrl));
}

export async function isLocalAuthBypassEnabledForRequest(appBaseUrl: string | null) {
  if (!isDevOnlyLocalAuthRuntime(appBaseUrl)) {
    return false;
  }

  return isLocalAuthBypassEnabled();
}

function getRuntimeAppBaseUrl(request?: Request) {
  const { appBaseUrl } = getRequestAuthContext();
  const resolved = resolveRuntimeAppBaseUrl({
    requestUrl: request?.url,
    contextAppBaseUrl: appBaseUrl,
  });

  if (!resolved) {
    throw new Error(
      "Could not resolve the app base URL for this request. Use a real app origin or set APP_BASE_URL to a non-loopback public URL.",
    );
  }

  return resolved;
}

function getMagicLinkAppBaseUrl(appBaseUrl: string | null) {
  return resolveMagicLinkAppBaseUrl({
    contextAppBaseUrl: appBaseUrl,
  });
}

function redirectResponse(url: string, headers: Headers) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("location", url);
  return new Response(null, {
    status: 302,
    headers: responseHeaders,
  });
}

function buildLoginRedirect(status: "error", next: string, appBaseUrl: string) {
  const url = new URL("/login", appBaseUrl);
  url.searchParams.set("status", status);

  if (next !== DEFAULT_AUTH_REDIRECT) {
    url.searchParams.set("next", next);
  }

  return url;
}

function parseEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) {
    return null;
  }

  const parsed = emailOtpTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
