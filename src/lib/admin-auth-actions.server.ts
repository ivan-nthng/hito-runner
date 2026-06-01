import "@tanstack/react-start/server-only";

import { pbkdf2 as pbkdf2Callback, createHmac, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import {
  ADMIN_LOGIN_PATH,
  adminLoginInputSchema,
  sanitizeAdminRedirectPath,
  type AdminLoginInput,
  type AdminLoginResult,
} from "@/lib/admin-auth-actions";
import {
  appendLocalAuthSessionCookie,
  getLocalAuthAccounts,
  verifyLocalAuthCredentials,
  type LocalAuthAccountConfig,
} from "@/lib/local-auth";
import { isDevOnlyLocalAuthRuntime, serverEnv } from "@/lib/supabase/env";

const ADMIN_USERNAME = "admin";
const ADMIN_SESSION_COOKIE = "hito_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const ADMIN_SESSION_USER_ID = "hito-admin";
const MIN_PASSWORD_HASH_ITERATIONS = 100_000;
const MAX_PASSWORD_HASH_ITERATIONS = 1_000_000;
const pbkdf2 = promisify(pbkdf2Callback);

type AdminLoginVerificationResult =
  | (Extract<AdminLoginResult, { ok: true }> & {
      session:
        | {
            kind: "local";
            account: LocalAuthAccountConfig;
          }
        | {
            kind: "deployed";
            username: typeof ADMIN_USERNAME;
          };
    })
  | Extract<AdminLoginResult, { ok: false }>;

export interface AdminLoginDependencies {
  isLocalRuntime: boolean;
  accounts: LocalAuthAccountConfig[];
  verifyCredentials: (
    identifier: string,
    password: string,
  ) => Promise<
    | {
        ok: true;
        account: LocalAuthAccountConfig;
      }
    | {
        ok: false;
        reason: "unavailable" | "invalid";
      }
  >;
  deployedAdmin: DeployedAdminConfig;
}

export interface DeployedAdminConfig {
  username: typeof ADMIN_USERNAME;
  passwordHash: string | null;
  sessionSecret: string | null;
}

export interface AdminAuthSession {
  userId: string;
  email: null;
  username: typeof ADMIN_USERNAME;
}

interface AdminAuthSessionResolutionOptions {
  pathname?: string | null;
  serverFnMeta?: {
    filename?: string | null;
  } | null;
}

export async function loginAdminForRequest(request: Request): Promise<Response> {
  return handleAdminLoginRequestForDependencies(request, await buildCurrentDependencies(request));
}

export const loginLocalAdminForRequest = loginAdminForRequest;

export async function handleAdminLoginRequestForDependencies(
  request: Request,
  dependencies: AdminLoginDependencies,
): Promise<Response> {
  const data = await parseAdminLoginRequest(request);
  const result = await verifyAdminLoginForDependencies(data, dependencies);
  const responseHeaders = new Headers();

  if (result.ok) {
    if (result.session.kind === "local") {
      await appendLocalAuthSessionCookie(responseHeaders, request, result.session.account);
    } else {
      appendAdminAuthSessionCookie(responseHeaders, request, result.session.username, dependencies);
    }

    responseHeaders.set("location", new URL(result.redirectTo, request.url).toString());

    return new Response(null, {
      status: 302,
      headers: responseHeaders,
    });
  }

  const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
  loginUrl.searchParams.set("status", result.reason);
  loginUrl.searchParams.set("next", result.redirectTo);
  responseHeaders.set("location", loginUrl.toString());

  return new Response(null, {
    status: 302,
    headers: responseHeaders,
  });
}

export async function verifyAdminLoginForCurrentRequest(
  data: AdminLoginInput,
  request: Request,
): Promise<AdminLoginResult> {
  return stripAccount(
    await verifyAdminLoginForDependencies(data, await buildCurrentDependencies(request)),
  );
}

export async function verifyAdminLoginForDependencies(
  data: AdminLoginInput,
  dependencies: AdminLoginDependencies,
): Promise<AdminLoginVerificationResult> {
  const parsed = adminLoginInputSchema.safeParse(data);
  const redirectTo = sanitizeAdminRedirectPath(data.next);

  if (!parsed.success) {
    return failure(
      "invalid_credentials",
      "Enter the admin username or email and password.",
      redirectTo,
    );
  }

  if (dependencies.isLocalRuntime) {
    const localResult = await verifyLocalFixtureAdminLogin(parsed.data, dependencies, redirectTo);

    if (localResult) {
      return localResult;
    }
  }

  const deployedConfig = validateDeployedAdminConfig(dependencies.deployedAdmin);

  if (!deployedConfig.ok) {
    return failure(
      "admin_config_invalid",
      "Admin login is not configured for this runtime.",
      redirectTo,
    );
  }

  const deployedCredentials = await verifyDeployedAdminCredentials(
    parsed.data.identifier,
    parsed.data.password,
    deployedConfig.config,
  );

  if (!deployedCredentials.ok) {
    return failure("invalid_credentials", "The admin credentials were not recognized.", redirectTo);
  }

  return {
    ok: true,
    redirectTo,
    session: {
      kind: "deployed",
      username: ADMIN_USERNAME,
    },
  };
}

async function verifyLocalFixtureAdminLogin(
  data: AdminLoginInput,
  dependencies: AdminLoginDependencies,
  redirectTo: string,
): Promise<AdminLoginVerificationResult | null> {
  const adminAccounts = dependencies.accounts.filter((account) => account.role === "admin");

  if (adminAccounts.length !== 1) {
    return failure(
      "admin_config_invalid",
      "Admin login requires exactly one configured local admin account.",
      redirectTo,
    );
  }

  const credentials = await dependencies.verifyCredentials(data.identifier, data.password);

  if (!credentials.ok) {
    return null;
  }

  if (credentials.account.role !== "admin") {
    return failure(
      "admin_required",
      "Those credentials are valid for a tester, not for admin access.",
      redirectTo,
    );
  }

  return {
    ok: true,
    redirectTo,
    session: {
      kind: "local",
      account: credentials.account,
    },
  };
}

async function buildCurrentDependencies(request: Request): Promise<AdminLoginDependencies> {
  return {
    isLocalRuntime: isDevOnlyLocalAuthRuntime(request.url),
    accounts: await getLocalAuthAccounts(),
    verifyCredentials: (identifier, password) =>
      verifyLocalAuthCredentials(identifier, password, request.url),
    deployedAdmin: readDeployedAdminConfigFromEnv(),
  };
}

export async function resolveAdminAuthSession(
  request: Request,
  options?: AdminAuthSessionResolutionOptions,
): Promise<AdminAuthSession | null> {
  if (!isAdminSessionEligibleRequest(request.url, options)) {
    return null;
  }

  const config = validateDeployedAdminConfig({
    username: ADMIN_USERNAME,
    passwordHash: readServerEnv("HITO_ADMIN_PASSWORD_HASH"),
    sessionSecret: readServerEnv("HITO_ADMIN_SESSION_SECRET"),
  });

  if (!config.ok) {
    return null;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie") ?? "");
  const sessionCookie = cookies.find((cookie) => cookie.name === ADMIN_SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  const payload = verifyAdminSessionToken(sessionCookie.value, config.config.sessionSecret);

  if (!payload || payload.sub !== ADMIN_USERNAME) {
    return null;
  }

  return {
    userId: ADMIN_SESSION_USER_ID,
    email: null,
    username: ADMIN_USERNAME,
  };
}

function appendAdminAuthSessionCookie(
  headers: Headers,
  request: Request,
  username: typeof ADMIN_USERNAME,
  dependencies: Pick<AdminLoginDependencies, "deployedAdmin">,
) {
  const config = validateDeployedAdminConfig(dependencies.deployedAdmin);

  if (!config.ok) {
    return;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS;

  headers.append(
    "set-cookie",
    serializeCookieHeader(
      ADMIN_SESSION_COOKIE,
      signAdminSessionToken(
        {
          v: 1,
          sub: username,
          iat: issuedAt,
          exp: expiresAt,
        },
        config.config.sessionSecret,
      ),
      {
        httpOnly: true,
        maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: new URL(request.url).protocol === "https:",
      },
    ),
  );
}

function validateDeployedAdminConfig(config: DeployedAdminConfig):
  | {
      ok: true;
      config: Required<DeployedAdminConfig>;
    }
  | {
      ok: false;
    } {
  if (
    config.username !== ADMIN_USERNAME ||
    !config.passwordHash ||
    !config.sessionSecret ||
    config.sessionSecret.length < 32 ||
    !isSupportedPasswordHash(config.passwordHash)
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    config: {
      username: ADMIN_USERNAME,
      passwordHash: config.passwordHash,
      sessionSecret: config.sessionSecret,
    },
  };
}

function readDeployedAdminConfigFromEnv(): DeployedAdminConfig {
  return {
    username: ADMIN_USERNAME,
    passwordHash: readServerEnv("HITO_ADMIN_PASSWORD_HASH"),
    sessionSecret: readServerEnv("HITO_ADMIN_SESSION_SECRET"),
  };
}

function readServerEnv(name: string): string | null {
  const value = process.env[name];

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return value.trim();
}

async function verifyDeployedAdminCredentials(
  identifier: string,
  password: string,
  config: Required<DeployedAdminConfig>,
) {
  if (identifier.trim().toLowerCase() !== config.username) {
    return { ok: false as const };
  }

  return {
    ok: await verifyPasswordHash(password, config.passwordHash),
  };
}

function isSupportedPasswordHash(value: string) {
  const parts = value.split("$");

  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") {
    return false;
  }

  const iterations = Number(parts[1]);

  return (
    Number.isInteger(iterations) &&
    iterations >= MIN_PASSWORD_HASH_ITERATIONS &&
    iterations <= MAX_PASSWORD_HASH_ITERATIONS &&
    Boolean(decodeBase64Url(parts[2] ?? "")) &&
    Boolean(decodeBase64Url(parts[3] ?? ""))
  );
}

async function verifyPasswordHash(password: string, encodedHash: string) {
  const parts = encodedHash.split("$");

  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") {
    return false;
  }

  const iterations = Number(parts[1]);
  const salt = decodeBase64Url(parts[2] ?? "");
  const expectedHash = decodeBase64Url(parts[3] ?? "");

  if (
    !Number.isInteger(iterations) ||
    iterations < MIN_PASSWORD_HASH_ITERATIONS ||
    iterations > MAX_PASSWORD_HASH_ITERATIONS ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  const actualHash = await pbkdf2(password, salt, iterations, expectedHash.length, "sha256");

  return safeEqual(actualHash, expectedHash);
}

interface AdminSessionPayload {
  v: 1;
  sub: typeof ADMIN_USERNAME;
  iat: number;
  exp: number;
}

function signAdminSessionToken(payload: AdminSessionPayload, secret: string) {
  const encodedPayload = toBase64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  const signature = signAdminSessionPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

function verifyAdminSessionToken(value: string, secret: string): AdminSessionPayload | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  if (
    !safeEqual(Buffer.from(signature), Buffer.from(signAdminSessionPayload(encodedPayload, secret)))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
      v?: unknown;
      sub?: unknown;
      iat?: unknown;
      exp?: unknown;
    };

    if (
      payload.v !== 1 ||
      payload.sub !== ADMIN_USERNAME ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}

function signAdminSessionPayload(encodedPayload: string, secret: string) {
  return toBase64Url(createHmac("sha256", secret).update(encodedPayload).digest());
}

function isAdminSessionEligibleRequest(
  requestUrl: string,
  options?: AdminAuthSessionResolutionOptions,
) {
  return (
    isAdminRequestPath(requestUrl) ||
    isAdminRequestPath(options?.pathname ?? null) ||
    isAdminServerFunction(options?.serverFnMeta?.filename)
  );
}

function isAdminRequestPath(value: string | null) {
  const pathname = parseRequestPathname(value);

  return Boolean(pathname?.startsWith("/admin/") || pathname?.startsWith("/api/admin/"));
}

function isAdminServerFunction(filename: string | null | undefined) {
  const normalizedFilename = filename?.replaceAll("\\", "/");

  return (
    normalizedFilename === "src/lib/admin-analytics.ts" ||
    normalizedFilename === "src/lib/admin-capture.ts" ||
    normalizedFilename === "src/lib/admin-local-test-accounts.ts"
  );
}

function parseRequestPathname(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, "http://hito.local").pathname;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string) {
  try {
    return Buffer.from(value, "base64url");
  } catch {
    return null;
  }
}

function toBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function safeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  return timingSafeEqual(left, right);
}

async function parseAdminLoginRequest(request: Request): Promise<AdminLoginInput> {
  const url = new URL(request.url);
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const raw = (await request.json().catch(() => ({}))) as {
      identifier?: unknown;
      password?: unknown;
      next?: unknown;
    };

    return {
      identifier: typeof raw.identifier === "string" ? raw.identifier : "",
      password: typeof raw.password === "string" ? raw.password : "",
      next: typeof raw.next === "string" ? raw.next : url.searchParams.get("next"),
    };
  }

  const formData = await request.formData().catch(() => null);

  return {
    identifier: formValue(formData, "identifier"),
    password: formValue(formData, "password"),
    next: formValue(formData, "next") || url.searchParams.get("next"),
  };
}

function formValue(formData: FormData | null, key: string) {
  const value = formData?.get(key);
  return typeof value === "string" ? value : "";
}

function stripAccount(result: AdminLoginVerificationResult): AdminLoginResult {
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    redirectTo: result.redirectTo,
  };
}

function failure(
  reason: Exclude<AdminLoginResult, { ok: true }>["reason"],
  message: string,
  redirectTo: string,
): Extract<AdminLoginResult, { ok: false }> {
  return {
    ok: false,
    reason,
    message,
    redirectTo,
  };
}
