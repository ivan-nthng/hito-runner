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
  clearLocalAuthSessionCookie,
  getLocalAuthAccounts,
  verifyLocalAuthCredentials,
  type LocalAuthAccountConfig,
} from "@/lib/local-auth";
import { ensureLocalAuthSupabaseUserId } from "@/lib/local-auth-supabase";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import { isDevOnlyLocalAuthRuntime } from "@/lib/supabase/env";

export const ADMIN_USERNAME = "admin";
export const ADMIN_SESSION_COOKIE = "hito_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const LOCAL_FIXTURE_ADMIN_SESSION_SECRET = "hito-local-admin-session-dev-only-secret-2026-06-01";
const MIN_PASSWORD_HASH_ITERATIONS = 100_000;
const MAX_PASSWORD_HASH_ITERATIONS = 1_000_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const pbkdf2 = promisify(pbkdf2Callback);

export type AdminSessionSource = "deployed_password" | "local_fixture";
export type AdminRuntimeClass = "deployed" | "loopback";

type AdminLoginVerificationResult =
  | (Extract<AdminLoginResult, { ok: true }> & {
      session:
        | {
            kind: "local_fixture";
            account: LocalAuthAccountConfig;
            persistedUserId: string;
          }
        | {
            kind: "deployed_password";
            username: typeof ADMIN_USERNAME;
            persistedUserId: string;
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
  resolvePersistentAdminUserId: (input: {
    source: AdminSessionSource;
    configuredUserId: string;
    localAccount: LocalAuthAccountConfig | null;
  }) => Promise<string | null>;
  deployedAdmin: DeployedAdminConfig;
}

export interface DeployedAdminConfig {
  username: typeof ADMIN_USERNAME;
  passwordHash: string | null;
  sessionSecret: string | null;
  userId: string | null;
}

type ValidatedDeployedAdminConfig = {
  username: typeof ADMIN_USERNAME;
  passwordHash: string;
  sessionSecret: string;
  userId: string;
};

export interface AdminAuthSession {
  userId: string;
  email: null;
  username: typeof ADMIN_USERNAME;
  label: string;
  source: AdminSessionSource;
  runtimeClass: AdminRuntimeClass;
}

export async function loginAdminForRequest(request: Request): Promise<Response> {
  return handleAdminLoginRequestForDependencies(request, await buildCurrentDependencies(request));
}

export function logoutAdminForRequest(request: Request): Response {
  const url = new URL(request.url);
  const next = sanitizeAdminRedirectPath(url.searchParams.get("next"));
  const responseHeaders = new Headers();
  const loginUrl = new URL(ADMIN_LOGIN_PATH, url.origin);

  loginUrl.searchParams.set("next", next);
  clearAdminAuthSessionCookie(responseHeaders, request);
  clearLocalAuthSessionCookie(responseHeaders, request);
  responseHeaders.set("location", loginUrl.toString());

  return new Response(null, {
    status: 302,
    headers: responseHeaders,
  });
}

export async function handleAdminLoginRequestForDependencies(
  request: Request,
  dependencies: AdminLoginDependencies,
): Promise<Response> {
  const data = await parseAdminLoginRequest(request);
  const result = await verifyAdminLoginForDependencies(data, dependencies);
  const responseHeaders = new Headers();

  if (result.ok) {
    appendAdminAuthSessionCookie(responseHeaders, request, result.session, dependencies);

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

  const persistedUserId = await dependencies
    .resolvePersistentAdminUserId({
      source: "deployed_password",
      configuredUserId: deployedConfig.config.userId,
      localAccount: null,
    })
    .catch(() => null);
  if (!persistedUserId) {
    return failure(
      "admin_config_invalid",
      "Admin login is not configured for this runtime.",
      redirectTo,
    );
  }

  return {
    ok: true,
    redirectTo,
    session: {
      kind: "deployed_password",
      username: ADMIN_USERNAME,
      persistedUserId,
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

  if (!validateAdminSessionSecret(dependencies.deployedAdmin.sessionSecret).ok) {
    return failure(
      "admin_config_invalid",
      "Admin login is not configured for this runtime.",
      redirectTo,
    );
  }

  const persistedUserId = await dependencies
    .resolvePersistentAdminUserId({
      source: "local_fixture",
      configuredUserId: credentials.account.userId,
      localAccount: credentials.account,
    })
    .catch(() => null);
  if (!persistedUserId) {
    return failure(
      "admin_config_invalid",
      "Admin login is not configured for this runtime.",
      redirectTo,
    );
  }

  return {
    ok: true,
    redirectTo,
    session: {
      kind: "local_fixture",
      account: credentials.account,
      persistedUserId,
    },
  };
}

async function buildCurrentDependencies(request: Request): Promise<AdminLoginDependencies> {
  return {
    isLocalRuntime: isDevOnlyLocalAuthRuntime(request.url),
    accounts: await getLocalAuthAccounts(),
    verifyCredentials: (identifier, password) =>
      verifyLocalAuthCredentials(identifier, password, request.url),
    resolvePersistentAdminUserId: resolvePersistentAdminUserId,
    deployedAdmin: readDeployedAdminConfigForRequest(request),
  };
}

export async function resolveAdminAuthSession(request: Request): Promise<AdminAuthSession | null> {
  const config = validateAdminSessionSecret(readAdminSessionSecretForRequest(request));

  if (!config.ok) {
    return null;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie") ?? "");
  const sessionCookie = cookies.find((cookie) => cookie.name === ADMIN_SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  const payload = verifyAdminSessionToken(sessionCookie.value, config.sessionSecret);

  if (!payload || payload.sub !== ADMIN_USERNAME) {
    return null;
  }

  const source = parseAdminSessionSource(payload.source);
  const runtimeClass = parseAdminRuntimeClass(payload.runtimeClass);
  const userId = normalizeAdminSessionUserId(payload.adminUserId);

  if (
    !userId ||
    !source ||
    !runtimeClass ||
    !(
      (source === "local_fixture" && runtimeClass === "loopback") ||
      (source === "deployed_password" && runtimeClass === "deployed")
    )
  ) {
    return null;
  }

  return {
    userId,
    email: null,
    username: ADMIN_USERNAME,
    label: normalizeAdminSessionLabel(payload.label, source),
    source,
    runtimeClass,
  };
}

export function clearAdminAuthSessionCookie(headers: Headers, request: Request) {
  headers.append(
    "set-cookie",
    serializeCookieHeader(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
    }),
  );
}

function appendAdminAuthSessionCookie(
  headers: Headers,
  request: Request,
  session: Extract<AdminLoginVerificationResult, { ok: true }>["session"],
  dependencies: Pick<AdminLoginDependencies, "deployedAdmin">,
) {
  const config = validateAdminSessionSecret(dependencies.deployedAdmin.sessionSecret);

  if (!config.ok) {
    return;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS;
  const isLocalFixture = session.kind === "local_fixture";
  const label = isLocalFixture ? session.account.displayName || session.account.username : "admin";

  headers.append(
    "set-cookie",
    serializeCookieHeader(
      ADMIN_SESSION_COOKIE,
      signAdminSessionToken(
        {
          v: 1,
          sub: ADMIN_USERNAME,
          iat: issuedAt,
          exp: expiresAt,
          source: isLocalFixture ? "local_fixture" : "deployed_password",
          runtimeClass: isLocalFixture ? "loopback" : "deployed",
          adminUserId: session.persistedUserId,
          label,
        },
        config.sessionSecret,
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

function validateAdminSessionSecret(secret: string | null):
  | {
      ok: true;
      sessionSecret: string;
    }
  | {
      ok: false;
    } {
  if (!secret || secret.length < 32) {
    return { ok: false };
  }

  return {
    ok: true,
    sessionSecret: secret,
  };
}

function validateDeployedAdminConfig(config: DeployedAdminConfig):
  | {
      ok: true;
      config: ValidatedDeployedAdminConfig;
    }
  | {
      ok: false;
    } {
  if (
    config.username !== ADMIN_USERNAME ||
    !config.passwordHash ||
    !config.sessionSecret ||
    config.sessionSecret.length < 32 ||
    !isUuid(config.userId) ||
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
      userId: config.userId,
    },
  };
}

function readDeployedAdminConfigForRequest(request: Request): DeployedAdminConfig {
  return {
    username: ADMIN_USERNAME,
    passwordHash: readServerEnv("HITO_ADMIN_PASSWORD_HASH"),
    sessionSecret: readAdminSessionSecretForRequest(request),
    userId: readServerEnv("HITO_ADMIN_USER_ID"),
  };
}

async function resolvePersistentAdminUserId(input: {
  source: AdminSessionSource;
  configuredUserId: string;
  localAccount: LocalAuthAccountConfig | null;
}) {
  const candidateUserId =
    input.source === "local_fixture" && input.localAccount
      ? await ensureLocalAuthSupabaseUserId(input.localAccount)
      : input.configuredUserId;

  return getPersistedUserIdForAuthContext({
    userId: candidateUserId,
    email: input.localAccount?.email ?? null,
    appBaseUrl: null,
    provider: "admin",
    adminSession: {
      label: input.localAccount?.displayName ?? "admin",
      source: input.source,
      runtimeClass: input.source === "local_fixture" ? "loopback" : "deployed",
    },
  });
}

function readAdminSessionSecretForRequest(request: Request): string | null {
  return readServerEnv("HITO_ADMIN_SESSION_SECRET") ?? readLocalFixtureSessionSecret(request);
}

function readLocalFixtureSessionSecret(request: Request) {
  return isDevOnlyLocalAuthRuntime(request.url) ? LOCAL_FIXTURE_ADMIN_SESSION_SECRET : null;
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
  config: ValidatedDeployedAdminConfig,
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
  source?: AdminSessionSource;
  runtimeClass?: AdminRuntimeClass;
  adminUserId?: string;
  label?: string;
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

function parseAdminSessionSource(value: AdminSessionPayload["source"]): AdminSessionSource | null {
  return value === "local_fixture" || value === "deployed_password" ? value : null;
}

function parseAdminRuntimeClass(
  value: AdminSessionPayload["runtimeClass"],
): AdminRuntimeClass | null {
  return value === "loopback" || value === "deployed" ? value : null;
}

function normalizeAdminSessionUserId(value: AdminSessionPayload["adminUserId"]) {
  return isUuid(value) ? value.trim() : null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

function normalizeAdminSessionLabel(
  value: AdminSessionPayload["label"],
  source: AdminSessionSource,
) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return source === "local_fixture" ? "Local admin" : "admin";
}

function signAdminSessionPayload(encodedPayload: string, secret: string) {
  return toBase64Url(createHmac("sha256", secret).update(encodedPayload).digest());
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
