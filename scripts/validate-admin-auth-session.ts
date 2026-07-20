import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  buildLoopbackAdminCanonicalRedirect,
  isAdminSessionEligibleRequest,
  requireAdminAccessForDependencies,
  resolveAdminAuthSession,
} from "@/lib/admin-access.server";
import {
  ADMIN_SESSION_COOKIE,
  handleAdminLoginRequestForDependencies,
  logoutAdminForRequest,
  type AdminLoginDependencies,
} from "@/lib/admin-auth-actions.server";
import type { RequestAuthContext } from "@/lib/backend/auth";
import { clearLocalAuthSessionCookie } from "@/lib/local-auth";
import type { Database } from "@/lib/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";

const SESSION_SECRET = "validation-admin-session-secret-32chars";
const ADMIN_USER_ID = "11111111-1111-4111-8111-111111111111";
const TESTER_USER_ID = "22222222-2222-4222-8222-222222222222";

process.env.HITO_ADMIN_SESSION_SECRET = SESSION_SECRET;

const localAdminAccount = {
  username: "ivan",
  password: "admin-pass",
  email: "ivan@local.test",
  userId: ADMIN_USER_ID,
  role: "admin" as const,
  displayName: "Ivan Admin",
};

const localTesterAccount = {
  username: "tester",
  password: "tester-pass",
  email: "tester@local.test",
  userId: TESTER_USER_ID,
  role: "tester" as const,
  displayName: "Local Tester",
};

const loginDependencies: AdminLoginDependencies = {
  isLocalRuntime: true,
  accounts: [localAdminAccount, localTesterAccount],
  verifyCredentials: async (identifier, password) => {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const account =
      [localAdminAccount, localTesterAccount].find(
        (candidate) =>
          candidate.username === normalizedIdentifier || candidate.email === normalizedIdentifier,
      ) ?? null;

    if (!account || account.password !== password.trim()) {
      return { ok: false, reason: "invalid" };
    }

    return { ok: true, account };
  },
  deployedAdmin: {
    username: "admin",
    passwordHash: null,
    sessionSecret: SESSION_SECRET,
  },
};

await run();

async function run() {
  const adminCookie = await loginLocalAdminAndExtractCookie();

  await assertSignedCookieAcceptedForDirectAdminRoute(adminCookie);
  await assertSignedCookieAcceptedForAdminServerFn(adminCookie);
  await assertSignedCookieRejectedOutsideAdmin(adminCookie);
  await assertInvalidAndExpiredCookiesRejected(adminCookie);
  await assertLocalTesterDenied();
  assertLoopbackCanonicalization();
  await assertSupabaseCompatibilityUsesAppMetadataOnly();
  await assertAdminLogoutClearsSignedSession(adminCookie);

  console.log(
    [
      "Admin auth/session validation passed:",
      "- signed admin cookie accepted for admin route and admin server function",
      "- mixed runner/admin cookies preserve admin authority only on admin surfaces",
      "- signed admin cookie rejected for non-admin route and non-admin server function",
      "- invalid and expired cookies rejected",
      "- local fixture admin login issues signed admin session only",
      "- local tester credentials denied",
      "- loopback admin requests canonicalize to localhost",
      "- Supabase compatibility accepts app_metadata and rejects user_metadata-only claims",
      "- admin logout clears signed admin session",
    ].join("\n"),
  );
}

async function loginLocalAdminAndExtractCookie() {
  const response = await postAdminLogin({
    identifier: localAdminAccount.username,
    password: localAdminAccount.password,
    next: "/admin/capture",
  });
  const setCookies = getSetCookieHeaders(response.headers);
  const adminCookie = setCookies.find((value) => value.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  const localCookie = setCookies.find((value) => value.startsWith("hito_local_auth_session="));

  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("location")!).pathname, "/admin/capture");
  assert.ok(adminCookie, "local admin login must issue hito_admin_session");
  assert.equal(localCookie, undefined, "admin login must not issue hito_local_auth_session");

  return cookiePair(adminCookie);
}

async function assertSignedCookieAcceptedForDirectAdminRoute(adminCookie: string) {
  const session = await resolveAdminAuthSession(
    request("http://localhost:3000/admin/capture", adminCookie),
    { pathname: "/admin/capture" },
  );

  assert.ok(session, "admin route should accept signed admin cookie");
  assert.equal(session.source, "local_fixture");
  assert.equal(session.userId, ADMIN_USER_ID);

  const access = await requireAdminAccessForDependencies({
    auth: authFromSession(session),
    runtimeUrl: "http://localhost:3000",
    localAuthBypassEnabled: true,
    supabase: null,
  });

  assert.equal(access.ok, true);

  if (access.ok) {
    assert.equal(access.admin.capabilities.adminCapture, true);
    assert.equal(access.admin.capabilities.adminAnalytics, true);
    assert.equal(access.admin.capabilities.localTestAccounts, true);
  }
}

async function assertSignedCookieAcceptedForAdminServerFn(adminCookie: string) {
  const session = await resolveAdminAuthSession(
    request(`http://localhost:3000${serverFnPath("src/lib/admin-capture.ts")}`, adminCookie),
  );
  const productionSession = await resolveAdminAuthSession(
    request(
      `http://localhost:3000${productionServerFnPath(
        "src/lib/admin-analytics.ts",
        "getAdminAnalytics_createServerFn_handler",
      )}`,
      adminCookie,
    ),
  );
  const productionCaptureSession = await resolveAdminAuthSession(
    request(
      `http://localhost:3000${productionServerFnPath(
        "src/lib/admin-capture.ts",
        "listAdminCaptureBacklog_createServerFn_handler",
      )}`,
      adminCookie,
    ),
  );
  const mixedCookie = `${adminCookie}; hito_local_auth_session=runner-session-placeholder`;
  const mixedProductRouteSession = await resolveAdminAuthSession(
    request("http://localhost:3000/", mixedCookie),
  );
  const mixedCaptureSession = await resolveAdminAuthSession(
    request(
      `http://localhost:3000${productionServerFnPath(
        "src/lib/admin-capture.ts",
        "listAdminCaptureBacklog_createServerFn_handler",
      )}`,
      mixedCookie,
    ),
  );
  const runnerLogoutHeaders = new Headers();

  clearLocalAuthSessionCookie(
    runnerLogoutHeaders,
    request("http://localhost:3000/api/auth/logout", mixedCookie),
  );
  const runnerLogoutAdminClear = getSetCookieHeaders(runnerLogoutHeaders).find((value) =>
    value.startsWith(`${ADMIN_SESSION_COOKIE}=`),
  );

  assert.ok(session, "admin serverFn should accept signed admin cookie");
  assert.ok(
    productionSession,
    "production hashed admin serverFn should accept signed admin cookie",
  );
  assert.ok(
    productionCaptureSession,
    "production hashed admin capture serverFn should accept signed admin cookie",
  );
  assert.equal(mixedProductRouteSession, null);
  assert.ok(
    mixedCaptureSession,
    "admin capture serverFn should keep admin authority in mixed browser",
  );
  assert.equal(
    runnerLogoutAdminClear,
    undefined,
    "runner logout must not own or clear signed admin capability",
  );
}

async function assertSignedCookieRejectedOutsideAdmin(adminCookie: string) {
  assert.equal(await resolveAdminAuthSession(request("http://localhost:3000/", adminCookie)), null);
  assert.equal(
    await resolveAdminAuthSession(
      request(`http://localhost:3000${serverFnPath("src/lib/training-api.ts")}`, adminCookie),
    ),
    null,
  );
  assert.equal(
    await resolveAdminAuthSession(
      request(
        `http://localhost:3000${productionServerFnPath(
          "src/lib/training-api.ts",
          "getHomeRouteData_createServerFn_handler",
        )}`,
        adminCookie,
      ),
    ),
    null,
  );
  assert.equal(isAdminSessionEligibleRequest("/admin/capture"), true);
  assert.equal(isAdminSessionEligibleRequest(serverFnPath("src/lib/admin-capture.ts")), true);
  assert.equal(isAdminSessionEligibleRequest(serverFnPath("src/lib/training-api.ts")), false);
}

async function assertInvalidAndExpiredCookiesRejected(adminCookie: string) {
  assert.equal(
    await resolveAdminAuthSession(
      request("http://localhost:3000/admin/capture", `${ADMIN_SESSION_COOKIE}=invalid`),
    ),
    null,
  );

  const originalDateNow = Date.now;

  try {
    Date.now = () => originalDateNow() + 13 * 60 * 60 * 1000;
    assert.equal(
      await resolveAdminAuthSession(request("http://localhost:3000/admin/capture", adminCookie)),
      null,
    );
  } finally {
    Date.now = originalDateNow;
  }
}

async function assertLocalTesterDenied() {
  const response = await postAdminLogin({
    identifier: localTesterAccount.email,
    password: localTesterAccount.password,
    next: "/admin/capture",
  });
  const location = new URL(response.headers.get("location")!);
  const setCookies = getSetCookieHeaders(response.headers);

  assert.equal(response.status, 302);
  assert.equal(location.pathname, "/admin/login");
  assert.equal(location.searchParams.get("status"), "admin_required");
  assert.equal(
    setCookies.some((value) => value.startsWith(`${ADMIN_SESSION_COOKIE}=`)),
    false,
  );
}

function assertLoopbackCanonicalization() {
  const directRedirect = buildLoopbackAdminCanonicalRedirect(
    new Request("http://127.0.0.1:3000/admin/capture"),
  );
  const serverFnRedirect = buildLoopbackAdminCanonicalRedirect(
    new Request(`http://127.0.0.1:3000${serverFnPath("src/lib/admin-capture.ts")}`),
  );
  const productRedirect = buildLoopbackAdminCanonicalRedirect(
    new Request("http://127.0.0.1:3000/"),
  );

  assert.equal(directRedirect?.status, 307);
  assert.equal(new URL(directRedirect.headers.get("location")!).hostname, "localhost");
  assert.equal(serverFnRedirect?.status, 307);
  assert.equal(new URL(serverFnRedirect.headers.get("location")!).hostname, "localhost");
  assert.equal(productRedirect, null);
}

async function assertSupabaseCompatibilityUsesAppMetadataOnly() {
  const appMetadataAccess = await requireAdminAccessForDependencies({
    auth: supabaseAuthContext("supabase-admin"),
    runtimeUrl: "https://hito.example",
    supabase: mockSupabaseAuthUser({
      id: "supabase-admin",
      email: "admin@example.test",
      app_metadata: { hito_admin: true },
      user_metadata: { hito_admin: false },
    }),
  });
  const userMetadataAccess = await requireAdminAccessForDependencies({
    auth: supabaseAuthContext("user-metadata-admin"),
    runtimeUrl: "https://hito.example",
    supabase: mockSupabaseAuthUser({
      id: "user-metadata-admin",
      email: "claimed-admin@example.test",
      app_metadata: {},
      user_metadata: { hito_admin: true, hito_role: "admin" },
    }),
  });

  assert.equal(appMetadataAccess.ok, true);
  assert.equal(userMetadataAccess.ok, false);

  if (!userMetadataAccess.ok) {
    assert.equal(userMetadataAccess.reason, "admin_required");
  }
}

async function assertAdminLogoutClearsSignedSession(adminCookie: string) {
  const response = logoutAdminForRequest(
    request("http://localhost:3000/api/admin/auth/logout?next=/admin/capture", adminCookie),
  );
  const setCookies = getSetCookieHeaders(response.headers);
  const adminClear = setCookies.find((value) => value.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("location")!).pathname, "/admin/login");
  assert.equal(
    new URL(response.headers.get("location")!).searchParams.get("next"),
    "/admin/capture",
  );
  assert.ok(adminClear?.includes("Max-Age=0"), "admin logout should clear signed admin cookie");
  assert.equal(
    await resolveAdminAuthSession(request("http://localhost:3000/admin/capture")),
    null,
    "post-logout request without admin cookie must reject admin route access",
  );
}

async function postAdminLogin(input: { identifier: string; password: string; next: string }) {
  const body = new URLSearchParams();

  body.set("identifier", input.identifier);
  body.set("password", input.password);
  body.set("next", input.next);

  return handleAdminLoginRequestForDependencies(
    new Request("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      body,
    }),
    loginDependencies,
  );
}

function request(url: string, cookie?: string) {
  return new Request(url, {
    headers: cookie ? { cookie } : undefined,
  });
}

function authFromSession(
  session: NonNullable<Awaited<ReturnType<typeof resolveAdminAuthSession>>>,
): RequestAuthContext {
  return {
    userId: session.userId,
    email: session.email,
    appBaseUrl: "http://localhost:3000",
    provider: "admin",
    adminSession: {
      label: session.label,
      source: session.source,
      runtimeClass: session.runtimeClass,
    },
  };
}

function supabaseAuthContext(userId: string): RequestAuthContext {
  return {
    userId,
    email: `${userId}@example.test`,
    appBaseUrl: "https://hito.example",
    provider: "supabase",
  };
}

function mockSupabaseAuthUser(user: {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}) {
  return {
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user },
          error: null,
        }),
      },
    },
  } as unknown as Pick<SupabaseClient<Database>, "auth">;
}

function serverFnPath(file: string) {
  return `/_serverFn/${Buffer.from(JSON.stringify({ file }), "utf8").toString("base64url")}`;
}

function productionServerFnPath(file: string, functionName: string) {
  return `/_serverFn/${createHash("sha256").update(`${file}--${functionName}`).digest("hex")}`;
}

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;

  if (typeof getSetCookie === "function") {
    return getSetCookie.call(headers);
  }

  const value = headers.get("set-cookie");
  return value ? [value] : [];
}

function cookiePair(setCookieHeader: string) {
  return setCookieHeader.split(";", 1)[0]!;
}
