import { parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createServerOnlyFn } from "@tanstack/react-start";
import { isDevOnlyLocalAuthRuntime, serverEnv } from "@/lib/supabase/env";
import type { LocalAuthAccountConfig } from "@/lib/local-auth-account-registry.server";

export type { LocalAuthAccountConfig } from "@/lib/local-auth-account-registry.server";

const LOCAL_AUTH_COOKIE = "hito_local_auth_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface LocalAuthSession {
  userId: string;
  email: string;
}

export async function getLocalAuthAccounts(): Promise<LocalAuthAccountConfig[]> {
  if (!serverEnv.localAuthBypassEnabled || !serverEnv.localAuthBypassAccountsFile) {
    return [];
  }

  try {
    return await readAccountsFile(serverEnv.localAuthBypassAccountsFile);
  } catch {
    return [];
  }
}

export async function readLocalAuthAccountsFile(
  filePath: string,
): Promise<LocalAuthAccountConfig[]> {
  return readAccountsFile(filePath);
}

export async function isLocalAuthBypassEnabled() {
  const accounts = await getLocalAuthAccounts();
  return accounts.length > 0;
}

export async function findLocalAuthAccountByUserId(userId: string) {
  const accounts = await getLocalAuthAccounts();
  return accounts.find((account) => account.userId === userId) ?? null;
}

export async function resolveLocalAuthSession(request: Request): Promise<LocalAuthSession | null> {
  if (!isDevOnlyLocalAuthRuntime(request.url)) {
    return null;
  }

  const accounts = await getLocalAuthAccounts();

  if (accounts.length === 0) {
    return null;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie") ?? "");
  const sessionCookie = cookies.find((cookie) => cookie.name === LOCAL_AUTH_COOKIE);

  if (!sessionCookie) {
    return null;
  }

  for (const account of accounts) {
    const expectedToken = await buildLocalAuthSessionToken(account);

    if (sessionCookie.value === expectedToken) {
      return {
        userId: account.userId,
        email: account.email,
      };
    }
  }

  return null;
}

export async function verifyLocalAuthCredentials(
  identifier: string,
  password: string,
  requestUrl: string | URL,
) {
  if (!isDevOnlyLocalAuthRuntime(requestUrl)) {
    return { ok: false as const, reason: "unavailable" as const };
  }

  const accounts = await getLocalAuthAccounts();

  if (accounts.length === 0) {
    return { ok: false as const, reason: "unavailable" as const };
  }

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const normalizedPassword = password.trim();

  for (const account of accounts) {
    const acceptedIdentifiers = [account.username, account.email]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (
      acceptedIdentifiers.includes(normalizedIdentifier) &&
      normalizedPassword === account.password.trim()
    ) {
      return {
        ok: true as const,
        account,
      };
    }
  }

  return { ok: false as const, reason: "invalid" as const };
}

export async function appendLocalAuthSessionCookie(
  headers: Headers,
  request: Request,
  account: LocalAuthAccountConfig,
) {
  headers.append(
    "set-cookie",
    serializeCookieHeader(LOCAL_AUTH_COOKIE, await buildLocalAuthSessionToken(account), {
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

const readAccountsFile = createServerOnlyFn(async (filePath: string) => {
  const { readLocalAuthAccountRegistry } = await import("@/lib/local-auth-account-registry.server");
  return readLocalAuthAccountRegistry(filePath);
});

async function buildLocalAuthSessionToken(account: LocalAuthAccountConfig) {
  const input = `${account.username}:${account.password}:${account.userId}`;
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
