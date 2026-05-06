import { parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { z } from "zod";
import { serverEnv } from "@/lib/supabase/env";

const LOCAL_AUTH_COOKIE = "hito_local_auth_session";
const DEFAULT_LEGACY_EMAIL = "ivan@local.test";
const DEFAULT_LEGACY_USER_ID = "11111111-1111-4111-8111-111111111111";
const DEFAULT_LEGACY_STATE_PATH = ".tanstack/hito-running-local-auth.json";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const localAuthAccountSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  email: z.string().trim().email().optional(),
  userId: z.string().uuid().optional(),
  role: z.enum(["admin", "tester"]).optional(),
  displayName: z.string().trim().min(1).optional(),
  statePath: z.string().trim().min(1).optional(),
});

const localAuthAccountsSchema = z.union([
  z.array(localAuthAccountSchema).min(1),
  z.object({
    accounts: z.array(localAuthAccountSchema).min(1),
  }),
]);

export interface LocalAuthAccountConfig {
  username: string;
  password: string;
  email: string;
  userId: string;
  role: "admin" | "tester";
  displayName: string;
  statePath: string;
}

export interface LocalAuthSession {
  userId: string;
  email: string;
}

export interface LocalAuthAccountSummary {
  username: string;
  email: string;
  role: "admin" | "tester";
  displayName: string;
}

export async function getLocalAuthAccounts(): Promise<LocalAuthAccountConfig[]> {
  if (!serverEnv.localAuthBypassEnabled) {
    return [];
  }

  if (serverEnv.localAuthBypassAccountsFile) {
    try {
      return await readAccountsFile(serverEnv.localAuthBypassAccountsFile);
    } catch {
      return [];
    }
  }

  const legacyAccount = await buildLegacyAccount();
  return legacyAccount ? [legacyAccount] : [];
}

export async function getLocalAuthAccountSummaries(): Promise<LocalAuthAccountSummary[]> {
  const accounts = await getLocalAuthAccounts();

  return accounts.map((account) => ({
    username: account.username,
    email: account.email,
    role: account.role,
    displayName: account.displayName,
  }));
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

export async function verifyLocalAuthCredentials(identifier: string, password: string) {
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

async function buildLegacyAccount(): Promise<LocalAuthAccountConfig | null> {
  if (!serverEnv.localAuthBypassIdentifier || !serverEnv.localAuthBypassPassword) {
    return null;
  }

  const username = normalizeUsername(serverEnv.localAuthBypassIdentifier);

  return {
    username,
    password: serverEnv.localAuthBypassPassword,
    email: serverEnv.localAuthBypassEmail ?? DEFAULT_LEGACY_EMAIL,
    userId: serverEnv.localAuthBypassUserId ?? DEFAULT_LEGACY_USER_ID,
    role: "admin",
    displayName: humanizeUsername(username),
    statePath: serverEnv.localAuthBypassStatePath ?? DEFAULT_LEGACY_STATE_PATH,
  };
}

async function readAccountsFile(filePath: string) {
  const { readFile } = await import("node:fs/promises");
  const fileContents = await readFile(filePath, "utf8");
  const parsed = localAuthAccountsSchema.parse(JSON.parse(fileContents));
  const rawAccounts = Array.isArray(parsed) ? parsed : parsed.accounts;

  return await Promise.all(
    rawAccounts.map(async (account) => normalizeAccount(account, { source: "file" })),
  );
}

async function normalizeAccount(
  account: z.infer<typeof localAuthAccountSchema>,
  options: { source: "file" | "legacy" },
): Promise<LocalAuthAccountConfig> {
  const username = normalizeUsername(account.username);
  const email = account.email?.trim().toLowerCase() ?? `${username}@local.test`;

  return {
    username,
    password: account.password,
    email,
    userId: account.userId ?? (await deriveUserId(username)),
    role: account.role ?? (username === "ivan" ? "admin" : "tester"),
    displayName: account.displayName?.trim() ?? humanizeUsername(username),
    statePath:
      account.statePath?.trim() ??
      (options.source === "legacy"
        ? DEFAULT_LEGACY_STATE_PATH
        : `.tanstack/hito-running-local-auth-${slugify(username)}.json`),
  };
}

async function buildLocalAuthSessionToken(account: LocalAuthAccountConfig) {
  const input = `${account.username}:${account.password}:${account.userId}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return toBase64Url(new Uint8Array(digest));
}

async function deriveUserId(username: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(username));
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(
    17,
    20,
  )}-${hex.slice(20, 32)}`;
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return value.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "user";
}

function humanizeUsername(username: string) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function toBase64Url(bytes: Uint8Array) {
  let output = "";

  for (const byte of bytes) {
    output += String.fromCharCode(byte);
  }

  return btoa(output).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
