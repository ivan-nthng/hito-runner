import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";
import { verifyLocalAuthCredentials } from "@/lib/local-auth";
import type { Database } from "@/lib/supabase/database";
import { mergeResponseHeaders, resolveRequestSupabaseAuth } from "@/lib/supabase/server";
import { loginQaPoolToLoopbackRuntime } from "./lib/runner-activity-proof-runtime";

type AuthResult = {
  data: { user: { id: string; email: string | null } | null };
  error: unknown;
};

await run();

async function run() {
  assertRedirectSanitization();

  await assertAuthCase({
    name: "transient Auth failure",
    result: { data: { user: null }, error: { status: 503, code: "temporarily_unavailable" } },
    expectedSignOuts: 0,
    expectedCookie: false,
  });
  await assertAuthCase({
    name: "network failure",
    result: { data: { user: null }, error: { status: 0 } },
    expectedSignOuts: 0,
    expectedCookie: false,
  });
  await assertAuthCase({
    name: "transport rejection",
    result: { data: { user: null }, error: null },
    throws: new Error("network unavailable"),
    expectedSignOuts: 0,
    expectedCookie: false,
  });
  await assertAuthCase({
    name: "no session",
    result: { data: { user: null }, error: null },
    expectedSignOuts: 0,
    expectedCookie: false,
  });
  await assertAuthCase({
    name: "invalid JWT",
    result: { data: { user: null }, error: { status: 400, code: "invalid_jwt" } },
    expectedSignOuts: 1,
    expectedCookie: true,
  });
  await assertAuthCase({
    name: "Auth access denied",
    result: { data: { user: null }, error: { status: 403, code: "session_revoked" } },
    expectedSignOuts: 1,
    expectedCookie: true,
  });
  await assertAuthCase({
    name: "revoked or expired session",
    result: { data: { user: null }, error: { status: 401, code: "session_not_found" } },
    expectedSignOuts: 1,
    expectedCookie: true,
  });
  await assertAuthCase({
    name: "valid session",
    result: {
      data: { user: { id: "11111111-1111-4111-8111-111111111111", email: "runner@test.local" } },
      error: null,
    },
    expectedSignOuts: 0,
    expectedCookie: false,
    expectedUserId: "11111111-1111-4111-8111-111111111111",
  });
  await assertAuthCase({
    name: "valid session refresh",
    result: {
      data: { user: { id: "11111111-1111-4111-8111-111111111111", email: "runner@test.local" } },
      error: null,
    },
    responseCookie: "sb-test-auth-token=refreshed; Path=/",
    expectedSignOuts: 0,
    expectedCookie: true,
    expectedUserId: "11111111-1111-4111-8111-111111111111",
  });

  const nonLoopbackLocalLogin = await verifyLocalAuthCredentials(
    "qa-provider-engine",
    "not-used",
    "https://example.com",
  );
  assert.deepEqual(nonLoopbackLocalLogin, { ok: false, reason: "unavailable" });

  const runtimeUrl = process.argv
    .find((argument) => argument.startsWith("--runtime-url="))
    ?.slice("--runtime-url=".length);
  if (runtimeUrl) {
    await assertLoopbackLocalAuthLifecycle(runtimeUrl);
    await assertProductApiRequestBoundary(runtimeUrl);
  }

  await assertPublicApiErrorRedaction();

  console.log("Runner request-auth session validation passed.");
}

function assertRedirectSanitization() {
  assert.equal(sanitizeRedirectPath("/safe/path?tab=history"), "/safe/path?tab=history");
  assert.equal(sanitizeRedirectPath("//evil.example/path"), "/");
  assert.equal(sanitizeRedirectPath("/\\evil.example/path"), "/");

  const encodedBackslash = new URL(
    "https://hito.run/login?next=/%5Cevil.example/path",
  ).searchParams.get("next");
  assert.equal(sanitizeRedirectPath(encodedBackslash), "/");
}

async function assertLoopbackLocalAuthLifecycle(runtimeUrl: string) {
  const { baseUrl, cookie } = await loginQaPoolToLoopbackRuntime({
    runtimeUrl,
    role: "provider-engine",
  });

  for (let requestIndex = 0; requestIndex < 2; requestIndex += 1) {
    const authenticated = await fetch(new URL("/api/runner-activities", baseUrl), {
      headers: { cookie },
    });
    assert.equal(authenticated.status, 200, "local runner session survives repeat navigation");
  }

  const logout = await fetch(new URL("/api/auth/logout?next=/login", baseUrl), {
    headers: { cookie },
    redirect: "manual",
  });
  assert.equal(logout.status, 302);
  assert.equal(new URL(logout.headers.get("location") ?? "", baseUrl).pathname, "/login");
  const clearedSetCookie = logout.headers.get("set-cookie") ?? "";
  assert.match(clearedSetCookie, /hito_local_auth_session=;/);
  assert.match(clearedSetCookie.toLowerCase(), /max-age=0/);

  const clearedCookie = clearedSetCookie.split(";", 1)[0];
  const afterLogout = await fetch(new URL("/api/runner-activities", baseUrl), {
    headers: { cookie: clearedCookie },
  });
  assert.equal(afterLogout.status, 401, "explicit logout leaves the browser signed out");
}

async function assertProductApiRequestBoundary(runtimeUrl: string) {
  const { baseUrl, cookie } = await loginQaPoolToLoopbackRuntime({
    runtimeUrl,
    role: "provider-engine",
  });

  const unauthenticatedMultipart = new FormData();
  unauthenticatedMultipart.set("probe", "unauthenticated");
  const unauthenticatedAvatar = await fetch(new URL("/api/profile-avatar/upload", baseUrl), {
    method: "POST",
    body: unauthenticatedMultipart,
  });
  assert.equal(unauthenticatedAvatar.status, 401);
  assert.deepEqual(await unauthenticatedAvatar.json(), {
    ok: false,
    code: "avatar_auth_required",
    params: {},
  });

  const oversizedAvatar = new FormData();
  oversizedAvatar.set(
    "file",
    new File([Buffer.alloc(5 * 1024 * 1024 + 1)], "oversized.jpg", { type: "image/jpeg" }),
  );
  const unauthenticatedOversizedAvatar = await fetch(
    new URL("/api/profile-avatar/upload", baseUrl),
    {
      method: "POST",
      body: oversizedAvatar,
    },
  );
  assert.equal(unauthenticatedOversizedAvatar.status, 401);

  const authenticatedOversizedAvatar = await fetch(new URL("/api/profile-avatar/upload", baseUrl), {
    method: "POST",
    headers: { cookie },
    body: oversizedAvatar,
  });
  assert.equal(authenticatedOversizedAvatar.status, 413);
  assert.deepEqual(await authenticatedOversizedAvatar.json(), {
    ok: false,
    code: "avatar_file_too_large",
    params: { maxBytes: 5 * 1024 * 1024 },
  });

  const authenticatedMalformedAvatar = await fetch(new URL("/api/profile-avatar/upload", baseUrl), {
    method: "POST",
    headers: { cookie },
    body: "not multipart",
  });
  assert.equal(authenticatedMalformedAvatar.status, 500);
  const malformedAvatarPayload = await authenticatedMalformedAvatar.json();
  assert.deepEqual(malformedAvatarPayload, {
    ok: false,
    code: "avatar_upload_failed",
    params: {},
  });
  assert.doesNotMatch(JSON.stringify(malformedAvatarPayload), /formdata|content-type|parse/i);

  const invalidExport = await fetch(new URL("/api/plan/export?format=csv", baseUrl));
  assert.equal(invalidExport.status, 400);
  assert.equal(await invalidExport.text(), "Choose a valid export format.");

  const missingSelectedPlanExport = await fetch(
    new URL(
      "/api/plan/export?format=json&savedPlanId=00000000-0000-4000-8000-000000000099",
      baseUrl,
    ),
    { headers: { cookie } },
  );
  assert.equal(missingSelectedPlanExport.status, 404);
  assert.equal(await missingSelectedPlanExport.text(), "The selected saved plan was not found.");

  const unauthenticatedExport = await fetch(
    new URL(
      "/api/plan/export?format=json&savedPlanId=00000000-0000-4000-8000-000000000099",
      baseUrl,
    ),
  );
  assert.equal(unauthenticatedExport.status, 401);
  assert.equal(await unauthenticatedExport.text(), "Authentication is required for this action.");
}

async function assertPublicApiErrorRedaction() {
  const [
    productApiErrorContract,
    avatarRoute,
    activityHistoryRoute,
    activityProgressRoute,
    activityDeleteRoute,
    activitySourceRoute,
    workoutResultUploadRoute,
    workoutResultRemoveRoute,
    planExportRoute,
    trainingApi,
  ] = await Promise.all([
    readFile(new URL("../src/lib/product-api-error-contract.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/api.profile-avatar.upload.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/api.runner-activities.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/api.runner-activity-progress.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/routes/api.runner-activities.$activityId.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/routes/api.runner-activities.$activityId.source.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/routes/api.workout-result.upload.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/api.workout-result.remove.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/api.plan.export.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/training-api.ts", import.meta.url), "utf8"),
  ]);

  const productApiRoutes = [
    avatarRoute,
    activityHistoryRoute,
    activityProgressRoute,
    activityDeleteRoute,
    activitySourceRoute,
    workoutResultUploadRoute,
    workoutResultRemoveRoute,
  ];
  assert.doesNotMatch(productApiErrorContract, /\bmessage\s*:/);
  for (const routeSource of productApiRoutes) {
    assert.match(routeSource, /build(?:Hito|WorkoutResult)ProductApiFailure/);
    assert.doesNotMatch(routeSource, /\bmessage\s*:/);
  }

  assert.ok(
    avatarRoute.indexOf("const userId = await requirePersistedUserIdForCurrentRequest();") <
      avatarRoute.indexOf("const formData = await readBoundedMultipartFormData("),
    "Avatar authentication must resolve before multipart parsing.",
  );
  assert.match(avatarRoute, /buildHitoProductApiFailure\("avatar_upload_failed", \{\}\)/);
  assert.doesNotMatch(
    avatarRoute.slice(
      avatarRoute.indexOf("} catch (error) {"),
      avatarRoute.indexOf("function getAvatarUploadPublicFailure"),
    ),
    /message:\s*error\.message/,
  );
  assert.match(planExportRoute, /The selected plan could not be exported\./);
  assert.doesNotMatch(
    planExportRoute.slice(
      planExportRoute.indexOf("} catch (error) {"),
      planExportRoute.indexOf("function getPlanExportPublicFailure"),
    ),
    /return new Response\(error\.message/,
  );
  assert.equal(
    trainingApi.match(/safeRunnerServerActionError\(error, \{/g)?.length,
    1,
    "All runner mutation server functions with persistence owners must map unknown errors safely.",
  );
  assert.match(trainingApi, /The workout result could not be saved\. Try again shortly\./);
  assert.doesNotMatch(trainingApi, /clearUpcomingSchedule|previewActivePlan|ScheduleReflow/);
}

async function assertAuthCase(options: {
  name: string;
  result: AuthResult;
  expectedSignOuts: number;
  expectedCookie: boolean;
  expectedUserId?: string;
  throws?: Error;
  responseCookie?: string;
}) {
  const responseHeaders = new Headers();

  if (options.responseCookie) {
    responseHeaders.append("set-cookie", options.responseCookie);
  }

  let signOuts = 0;
  const supabase = {
    auth: {
      getUser: async () => {
        if (options.throws) {
          throw options.throws;
        }

        return options.result;
      },
      signOut: async () => {
        signOuts += 1;
        responseHeaders.append("set-cookie", "sb-test-auth-token=; Max-Age=0; Path=/");
        return { error: null };
      },
    },
  } as unknown as Pick<SupabaseClient<Database>, "auth">;

  const auth = await resolveRequestSupabaseAuth(supabase);
  const response = mergeResponseHeaders(new Response(null, { status: 200 }), responseHeaders);

  assert.equal(signOuts, options.expectedSignOuts, `${options.name}: sign-out count`);
  assert.equal(auth.userId, options.expectedUserId ?? null, `${options.name}: auth user`);
  assert.equal(
    response.headers.has("set-cookie"),
    options.expectedCookie,
    `${options.name}: clearing cookie`,
  );
}
