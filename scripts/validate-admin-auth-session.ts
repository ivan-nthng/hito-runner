import assert from "node:assert/strict";
import { createHash, createHmac, pbkdf2Sync } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  buildLoopbackAdminCanonicalRedirect,
  isAdminSessionEligibleRequest,
  requireAdminAccessForDependencies,
  resolveAdminAuthSession,
} from "@/lib/admin-access.server";
import {
  ADMIN_SESSION_COOKIE,
  handleAdminLoginRequestForDependencies,
  loginAdminForRequest,
  logoutAdminForRequest,
  type AdminLoginDependencies,
} from "@/lib/admin-auth-actions.server";
import type { RequestAuthContext } from "@/lib/backend/auth";
import { clearLocalAuthSessionCookie, getLocalAuthAccounts } from "@/lib/local-auth";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  getUserSettingsForUserId,
  updateUserSettingsForUserId,
  type UserSettingsSummary,
} from "@/lib/user-settings-actions";
import type { SupabaseClient, User } from "@supabase/supabase-js";

const SESSION_SECRET = "validation-admin-session-secret-32chars";
const ADMIN_USER_ID = "11111111-1111-4111-8111-111111111111";
const STALE_LOCAL_ADMIN_USER_ID = "33333333-3333-4333-8333-333333333333";
const TESTER_USER_ID = "22222222-2222-4222-8222-222222222222";
const DEPLOYED_ADMIN_PASSWORD = "deployed-admin-password";
const REQUIRE_PERSISTENCE = process.argv.includes("--require-persistence");

process.env.HITO_ADMIN_SESSION_SECRET = SESSION_SECRET;

const localAdminAccount = {
  username: "ivan",
  password: "admin-pass",
  email: "ivan@local.test",
  userId: STALE_LOCAL_ADMIN_USER_ID,
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
  resolvePersistentAdminUserId: async ({ source, configuredUserId, localAccount }) => {
    if (source === "local_fixture") {
      assert.equal(localAccount?.userId, STALE_LOCAL_ADMIN_USER_ID);
      return ADMIN_USER_ID;
    }

    assert.equal(localAccount, null);
    return configuredUserId === ADMIN_USER_ID ? ADMIN_USER_ID : null;
  },
  deployedAdmin: {
    username: "admin",
    passwordHash: buildPasswordHash(DEPLOYED_ADMIN_PASSWORD),
    sessionSecret: SESSION_SECRET,
    userId: ADMIN_USER_ID,
  },
};

await run();

async function run() {
  const adminCookie = await loginLocalAdminAndExtractCookie();

  await assertSignedCookieAcceptedForDirectAdminRoute(adminCookie);
  await assertSignedCookieAcceptedForAdminServerFn(adminCookie);
  await assertSignedCookieRejectedOutsideAdmin(adminCookie);
  await assertInvalidAndExpiredCookiesRejected(adminCookie);
  await assertDeployedPasswordSessionUsesPersistedIdentity();
  await assertDeployedPasswordSessionFailsClosedWithoutVerifiedIdentity();
  await assertPersistedAdminIdentityUsesAppMetadataOnly(adminCookie);
  await assertLocalTesterDenied();
  assertLoopbackCanonicalization();
  await assertSupabaseCompatibilityUsesAppMetadataOnly();
  await assertAdminLogoutClearsSignedSession(adminCookie);
  assertSyntheticAdminIdentityRemoved();
  if (REQUIRE_PERSISTENCE) {
    await assertCurrentLocalFixturePersistentIdentityAndSettings();
  }

  console.log(
    [
      "Admin auth/session validation passed:",
      "- signed admin cookie accepted for admin route and admin server function",
      "- exact existing saveUserSettings server function accepts signed admin identity",
      "- mixed runner/admin cookies preserve admin authority only on admin surfaces",
      "- signed admin cookie rejected for non-admin route and non-admin server function",
      "- invalid and expired cookies rejected",
      "- local fixture admin login replaces stale registry UUID with verified persisted UUID",
      "- deployed password login requires explicit verified persisted UUID",
      "- persisted Admin identity accepts app_metadata only and rejects unrelated Runner UUIDs",
      "- local tester credentials denied",
      "- loopback admin requests canonicalize to localhost",
      "- Supabase compatibility accepts app_metadata and rejects user_metadata-only claims",
      "- admin logout clears signed admin session",
      "- synthetic hito-admin and malformed/legacy session fallbacks are absent",
      ...(REQUIRE_PERSISTENCE
        ? [
            "- current local Admin fixture resolves its Auth UUID and locale save/reset preserves unrelated profile fields",
          ]
        : []),
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
  const settingsFunctionId = serverFnId(
    "src/lib/user-settings-actions.ts",
    "saveUserSettings_createServerFn_handler",
  );
  const settingsSession = await resolveAdminAuthSession(
    request(`http://localhost:3000/_serverFn/${settingsFunctionId}`, adminCookie),
  );
  const settingsMetaSession = await resolveAdminAuthSession(
    request("http://localhost:3000/_serverFn/runtime-metadata", adminCookie),
    { serverFnMeta: { id: settingsFunctionId, filename: "src/lib/user-settings-actions.ts" } },
  );
  const broadSettingsFileSession = await resolveAdminAuthSession(
    request(
      `http://localhost:3000${serverFnPath("src/lib/user-settings-actions.ts")}`,
      adminCookie,
    ),
  );
  const baselineSession = await resolveAdminAuthSession(
    request(
      `http://localhost:3000${productionServerFnPath(
        "src/lib/user-settings-actions.ts",
        "saveRunnerBaseline_createServerFn_handler",
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
  assert.ok(settingsSession, "exact saveUserSettings serverFn should accept signed admin cookie");
  assert.ok(
    settingsMetaSession,
    "saveUserSettings runtime metadata should accept signed admin cookie",
  );
  assert.equal(
    broadSettingsFileSession,
    null,
    "user-settings file metadata must not grant every settings server action",
  );
  assert.equal(baselineSession, null, "runner baseline action must remain outside Admin admission");
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
  assert.equal(
    isAdminSessionEligibleRequest(
      productionServerFnPath(
        "src/lib/user-settings-actions.ts",
        "saveUserSettings_createServerFn_handler",
      ),
    ),
    true,
  );
  assert.equal(
    isAdminSessionEligibleRequest(serverFnPath("src/lib/user-settings-actions.ts")),
    false,
  );
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

  const legacyCookie = signedAdminCookie({
    v: 1,
    sub: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
    source: "deployed_password",
    runtimeClass: "deployed",
  });
  assert.equal(
    await resolveAdminAuthSession(request("https://hito.example/admin/capture", legacyCookie)),
    null,
    "signed legacy sessions without a persisted UUID must fail closed",
  );

  const issuedAt = Math.floor(Date.now() / 1000);
  const validPayload = {
    v: 1,
    sub: "admin",
    iat: issuedAt,
    exp: issuedAt + 60,
    adminUserId: ADMIN_USER_ID,
  };
  const malformedProvenancePayloads = [
    { ...validPayload, runtimeClass: "deployed" },
    { ...validPayload, source: "unknown", runtimeClass: "deployed" },
    { ...validPayload, source: "deployed_password" },
    { ...validPayload, source: "deployed_password", runtimeClass: "unknown" },
    { ...validPayload, source: "local_fixture", runtimeClass: "deployed" },
    { ...validPayload, source: "deployed_password", runtimeClass: "loopback" },
  ];

  for (const payload of malformedProvenancePayloads) {
    assert.equal(
      await resolveAdminAuthSession(
        request("https://hito.example/admin/capture", signedAdminCookie(payload)),
      ),
      null,
      "signed sessions with missing, unknown, or mixed provenance must fail closed",
    );
  }
}

function signedAdminCookie(payload: Record<string, unknown>) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");

  return `${ADMIN_SESSION_COOKIE}=${encodedPayload}.${signature}`;
}

async function assertDeployedPasswordSessionUsesPersistedIdentity() {
  const response = await postAdminLogin(
    {
      identifier: "admin",
      password: DEPLOYED_ADMIN_PASSWORD,
      next: "/admin/analytics",
    },
    { ...loginDependencies, isLocalRuntime: false },
    "https://hito.example/api/admin/auth/login",
  );
  const adminCookie = getSetCookieHeaders(response.headers).find((value) =>
    value.startsWith(`${ADMIN_SESSION_COOKIE}=`),
  );

  assert.equal(response.status, 302);
  assert.ok(adminCookie);
  const session = await resolveAdminAuthSession(
    request("https://hito.example/admin/analytics", cookiePair(adminCookie)),
  );
  assert.ok(session);
  assert.equal(session.source, "deployed_password");
  assert.equal(session.runtimeClass, "deployed");
  assert.equal(session.userId, ADMIN_USER_ID);
}

async function assertDeployedPasswordSessionFailsClosedWithoutVerifiedIdentity() {
  const invalidConfigs = [
    {
      deployedAdmin: { ...loginDependencies.deployedAdmin, userId: null },
      resolvePersistentAdminUserId: loginDependencies.resolvePersistentAdminUserId,
    },
    {
      deployedAdmin: {
        ...loginDependencies.deployedAdmin,
        userId: "44444444-4444-4444-8444-444444444444",
      },
      resolvePersistentAdminUserId: async () => null,
    },
  ];

  for (const config of invalidConfigs) {
    const response = await postAdminLogin(
      {
        identifier: "admin",
        password: DEPLOYED_ADMIN_PASSWORD,
        next: "/admin/capture",
      },
      {
        ...loginDependencies,
        isLocalRuntime: false,
        deployedAdmin: config.deployedAdmin,
        resolvePersistentAdminUserId: config.resolvePersistentAdminUserId,
      },
      "https://hito.example/api/admin/auth/login",
    );
    const location = new URL(response.headers.get("location")!);

    assert.equal(location.pathname, "/admin/login");
    assert.equal(location.searchParams.get("status"), "admin_config_invalid");
    assert.equal(
      getSetCookieHeaders(response.headers).some((value) =>
        value.startsWith(`${ADMIN_SESSION_COOKIE}=`),
      ),
      false,
    );
  }
}

async function assertPersistedAdminIdentityUsesAppMetadataOnly(adminCookie: string) {
  const session = await resolveAdminAuthSession(
    request("http://localhost:3000/admin/capture", adminCookie),
  );
  assert.ok(session);
  const auth = authFromSession(session);
  const verified = await getPersistedUserIdForAuthContext(auth, {
    resolveVerifiedAdminUserId: async (userId) => (userId === ADMIN_USER_ID ? userId : null),
  });
  const unrelatedRunner = await getPersistedUserIdForAuthContext(
    { ...auth, userId: TESTER_USER_ID },
    { resolveVerifiedAdminUserId: async () => null },
  );

  assert.equal(verified, ADMIN_USER_ID);
  assert.equal(unrelatedRunner, null);
}

async function assertCurrentLocalFixturePersistentIdentityAndSettings() {
  const accounts = await getLocalAuthAccounts();
  const adminAccounts = accounts.filter((account) => account.role === "admin");
  assert.equal(adminAccounts.length, 1);
  const account = adminAccounts[0]!;
  const body = new URLSearchParams({
    identifier: account.username,
    password: account.password,
    next: "/admin/capture",
  });
  const response = await loginAdminForRequest(
    new Request("http://localhost:3000/api/admin/auth/login", { method: "POST", body }),
  );
  const adminCookie = getSetCookieHeaders(response.headers).find((value) =>
    value.startsWith(`${ADMIN_SESSION_COOKIE}=`),
  );
  assert.ok(adminCookie);
  const session = await resolveAdminAuthSession(
    request(
      `http://localhost:3000${productionServerFnPath(
        "src/lib/user-settings-actions.ts",
        "saveUserSettings_createServerFn_handler",
      )}`,
      cookiePair(adminCookie),
    ),
  );
  assert.ok(session);

  const supabase = createAdminSupabaseClient();
  const authUser = await findAuthUserByEmail(supabase, account.email);
  assert.ok(authUser);
  assert.equal(session.userId, authUser.id);
  assert.notEqual(
    session.userId,
    account.userId,
    "current local fixture must resolve the durable Auth UUID instead of the stale registry UUID",
  );
  assert.equal(await getPersistedUserIdForAuthContext(authFromSession(session)), authUser.id);

  const rawBeforeResult = await supabase
    .from("runner_profiles")
    .select("*")
    .eq("user_id", authUser.id)
    .maybeSingle();
  assert.ifError(rawBeforeResult.error);
  const rawBefore = rawBeforeResult.data;
  const settingsBefore = await getUserSettingsForUserId(authUser.id, authUser.email ?? null);
  const originalPreference = settingsBefore?.uiLocalePreference ?? "system";
  assert.ok(
    originalPreference === "system" ||
      originalPreference === "en" ||
      originalPreference === "pt-BR",
  );
  const alternatePreference = originalPreference === "pt-BR" ? "en" : "pt-BR";

  try {
    const changed = await updateUserSettingsForUserId(
      authUser.id,
      settingsBefore
        ? settingsInput(settingsBefore, alternatePreference)
        : preferenceOnlySettingsInput(alternatePreference),
      authUser.email ?? null,
    );
    assert.equal(changed.uiLocalePreference, alternatePreference);
    assert.equal(changed.profileRevision, settingsBefore?.profileRevision ?? 1);

    const readback = await getUserSettingsForUserId(authUser.id, authUser.email ?? null);
    assert.equal(readback?.uiLocalePreference, alternatePreference);
  } finally {
    if (rawBefore && settingsBefore) {
      await updateUserSettingsForUserId(
        authUser.id,
        settingsInput(settingsBefore, originalPreference),
        authUser.email ?? null,
      );
      const rawAfterResult = await supabase
        .from("runner_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .single();
      assert.ifError(rawAfterResult.error);
      assert.deepEqual(stableProfileFields(rawAfterResult.data), stableProfileFields(rawBefore));
    } else {
      const deleted = await supabase.from("runner_profiles").delete().eq("user_id", authUser.id);
      assert.ifError(deleted.error);
      assert.equal(await getUserSettingsForUserId(authUser.id, authUser.email ?? null), null);
    }
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

async function postAdminLogin(
  input: { identifier: string; password: string; next: string },
  dependencies: AdminLoginDependencies = loginDependencies,
  requestUrl = "http://localhost:3000/api/admin/auth/login",
) {
  const body = new URLSearchParams();

  body.set("identifier", input.identifier);
  body.set("password", input.password);
  body.set("next", input.next);

  return handleAdminLoginRequestForDependencies(
    new Request(requestUrl, {
      method: "POST",
      body,
    }),
    dependencies,
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
  return `/_serverFn/${serverFnId(file, functionName)}`;
}

function serverFnId(file: string, functionName: string) {
  return createHash("sha256").update(`${file}--${functionName}`).digest("hex");
}

function buildPasswordHash(password: string) {
  const iterations = 100_000;
  const salt = Buffer.from("admin-auth-validation-salt", "utf8");
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  return `pbkdf2_sha256$${iterations}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

async function findAuthUserByEmail(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
): Promise<User | null> {
  let page = 1;

  while (true) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    assert.ifError(result.error);
    const matched =
      result.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
    if (matched || result.data.users.length < 200) {
      return matched;
    }
    page += 1;
  }
}

function settingsInput(
  settings: UserSettingsSummary,
  uiLocalePreference: "system" | "en" | "pt-BR",
) {
  return {
    firstName: settings.firstName,
    lastName: settings.lastName,
    displayName: settings.displayName,
    age: settings.age,
    weightKg: settings.weightKg,
    heightCm: settings.heightCm,
    fitnessLevel: settings.fitnessLevel ?? undefined,
    uiLocalePreference,
  };
}

function preferenceOnlySettingsInput(uiLocalePreference: "system" | "en" | "pt-BR") {
  return {
    firstName: null,
    lastName: null,
    displayName: null,
    age: null,
    weightKg: null,
    heightCm: null,
    uiLocalePreference,
  };
}

function stableProfileFields(profile: Database["public"]["Tables"]["runner_profiles"]["Row"]) {
  const copy = { ...profile };
  delete (copy as Partial<typeof copy>).updated_at;
  return copy;
}

function assertSyntheticAdminIdentityRemoved() {
  const source = readFileSync("src/lib/admin-auth-actions.server.ts", "utf8");

  assert.doesNotMatch(source, /ADMIN_SESSION_USER_ID|"hito-admin"|"hito-local-admin"/);
  assert.doesNotMatch(source, /normalizeAdminSessionSource|normalizeAdminRuntimeClass/);
  assert.match(source, /readServerEnv\("HITO_ADMIN_USER_ID"\)/);
  assert.match(source, /const source = parseAdminSessionSource\(payload\.source\)/);
  assert.match(source, /source === "local_fixture" && runtimeClass === "loopback"/);
  assert.match(source, /source === "deployed_password" && runtimeClass === "deployed"/);
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
