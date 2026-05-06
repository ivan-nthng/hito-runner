import { parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { serverEnv } from "@/lib/supabase/env";

const LOCAL_AUTH_COOKIE = "hito_local_auth_session";
const DEFAULT_LOCAL_AUTH_EMAIL = "ivan@local.test";
const DEFAULT_LOCAL_AUTH_USER_ID = "11111111-1111-4111-8111-111111111111";
const DEFAULT_LOCAL_AUTH_STATE_PATH = ".tanstack/hito-running-local-auth.json";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface LocalAuthConfig {
  identifier: string;
  password: string;
  email: string;
  userId: string;
  statePath: string;
}

export interface LocalAuthSession {
  userId: string;
  email: string;
}

export function getLocalAuthConfig(): LocalAuthConfig | null {
  if (
    !serverEnv.localAuthBypassEnabled ||
    !serverEnv.localAuthBypassIdentifier ||
    !serverEnv.localAuthBypassPassword
  ) {
    return null;
  }

  return {
    identifier: serverEnv.localAuthBypassIdentifier,
    password: serverEnv.localAuthBypassPassword,
    email: serverEnv.localAuthBypassEmail ?? DEFAULT_LOCAL_AUTH_EMAIL,
    userId: serverEnv.localAuthBypassUserId ?? DEFAULT_LOCAL_AUTH_USER_ID,
    statePath: serverEnv.localAuthBypassStatePath ?? DEFAULT_LOCAL_AUTH_STATE_PATH,
  };
}

export function isLocalAuthBypassEnabled() {
  return Boolean(getLocalAuthConfig());
}

export async function resolveLocalAuthSession(request: Request): Promise<LocalAuthSession | null> {
  const config = getLocalAuthConfig();

  if (!config) {
    return null;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie") ?? "");
  const sessionCookie = cookies.find((cookie) => cookie.name === LOCAL_AUTH_COOKIE);

  if (!sessionCookie) {
    return null;
  }

  const expectedToken = await buildLocalAuthSessionToken(config);

  if (sessionCookie.value !== expectedToken) {
    return null;
  }

  return {
    userId: config.userId,
    email: config.email,
  };
}

export async function verifyLocalAuthCredentials(identifier: string, password: string) {
  const config = getLocalAuthConfig();

  if (!config) {
    return { ok: false as const, reason: "unavailable" as const };
  }

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const acceptedIdentifiers = [config.identifier, config.email]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (
    !acceptedIdentifiers.includes(normalizedIdentifier) ||
    normalizedPassword !== config.password.trim()
  ) {
    return { ok: false as const, reason: "invalid" as const };
  }

  return {
    ok: true as const,
    config,
  };
}

export async function appendLocalAuthSessionCookie(
  headers: Headers,
  request: Request,
  config: LocalAuthConfig,
) {
  headers.append(
    "set-cookie",
    serializeCookieHeader(LOCAL_AUTH_COOKIE, await buildLocalAuthSessionToken(config), {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
    }),
  );
}

export function clearLocalAuthSessionCookie(headers: Headers, request: Request) {
  headers.append(
    "set-cookie",
    serializeCookieHeader(LOCAL_AUTH_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
    }),
  );
}

async function buildLocalAuthSessionToken(config: LocalAuthConfig) {
  const input = `${config.identifier}:${config.password}:${config.userId}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return toBase64Url(new Uint8Array(digest));
}

function toBase64Url(bytes: Uint8Array) {
  let output = "";

  for (const byte of bytes) {
    output += String.fromCharCode(byte);
  }

  return btoa(output).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
