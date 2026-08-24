import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fromCrossJSON, toJSONAsync } from "seroval";
import {
  DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
  readLocalAuthAccountRegistry,
} from "../src/lib/local-auth-account-registry.server";
import {
  restoreSavedPlanReviewForUser,
  runningPlanConfirmInputSchema,
} from "../src/lib/running-plan-engine-actions";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import { loginQaPoolToLoopbackRuntime } from "./lib/runner-activity-proof-runtime";
import { acquireQaPoolLease, releaseQaPoolLease } from "./lib/qa-test-user-lifecycle.mjs";

const RUNTIME_URL = "http://127.0.0.1:3000";
const ROLE = "adaptive-training-quality" as const;
const SERVER_FN_FILE = "src/lib/running-plan-engine-actions.ts";

const lease = await acquireQaPoolLease({ role: ROLE });

try {
  const accounts = await readLocalAuthAccountRegistry(
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE ?? DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
  );
  const account = accounts.find((candidate) => candidate.username === "qa-adaptive-quality");
  assert.ok(account, "The canonical adaptive-training-quality account must exist.");

  const { cookie } = await loginQaPoolToLoopbackRuntime({ runtimeUrl: RUNTIME_URL, role: ROLE });
  const callServerFn = buildServerFnCaller(cookie);
  const listed = await callServerFn<{
    ok: true;
    records: Array<{
      candidate: { id: string; version: number };
      validity: { state: string };
    }>;
  }>("listSavedPlanReviews", "GET");
  const current = listed.records.find((record) => record.validity.state === "current");
  assert.ok(current, "The initial_plan_review checkpoint must expose one current saved plan.");

  const restored = await callServerFn<{
    ok: true;
    status: "review_ready";
    review: {
      previewInput: unknown;
      sourceKind: unknown;
      reviewToken: string;
      reviewChecksum: string;
    };
  }>("restoreSavedPlanReview", "POST", {
    candidateId: current.candidate.id,
    candidateVersion: current.candidate.version,
  });
  assert.equal(restored.ok, true);
  assert.equal(restored.status, "review_ready");

  // This is the unchanged public projection consumed by SavedPlanLibraryPanel.
  const publicReview = structuredClone(restored.review);
  const confirmInput = runningPlanConfirmInputSchema.parse({
    previewInput: publicReview.previewInput,
    sourceKind: publicReview.sourceKind,
    reviewToken: publicReview.reviewToken,
    reviewChecksum: publicReview.reviewChecksum,
  });
  assert.equal(confirmInput.reviewToken, restored.review.reviewToken);
  assert.equal(confirmInput.reviewChecksum, restored.review.reviewChecksum);

  const confirmed = await callServerFn<{
    ok: boolean;
    status: string;
    reason?: string;
  }>("confirmRunningPlanDraft", "POST", confirmInput);
  assert.equal(confirmed.ok, true, confirmed.ok ? "" : confirmed.reason);
  assert.equal(confirmed.status, "created");

  const supabase = createAdminSupabaseClient();
  const [calendar, confirmations] = await Promise.all([
    supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", account.userId),
    supabase
      .from("adaptive_training_block_confirmations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", account.userId),
  ]);
  if (calendar.error) throw new Error(calendar.error.message);
  if (confirmations.error) throw new Error(confirmations.error.message);
  assert.equal(calendar.count, 28);
  assert.equal(confirmations.count, 1);

  const duplicate = await callServerFn<{ ok: boolean; status: string }>(
    "confirmRunningPlanDraft",
    "POST",
    confirmInput,
  );
  assert.equal(duplicate.ok, false);

  const [calendarAfterDuplicate, confirmationsAfterDuplicate] = await Promise.all([
    supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", account.userId),
    supabase
      .from("adaptive_training_block_confirmations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", account.userId),
  ]);
  assert.equal(calendarAfterDuplicate.count, 28);
  assert.equal(confirmationsAfterDuplicate.count, 1);

  const expired = await callServerFn<{
    ok: true;
    status: "read_only";
    summary: { validity: { state: string; reason: string | null } };
  }>("restoreSavedPlanReview", "POST", {
    candidateId: current.candidate.id,
    candidateVersion: current.candidate.version,
  });
  assert.equal(expired.status, "read_only");
  assert.deepEqual(expired.summary.validity, {
    state: "expired",
    reason: "already_confirmed",
  });

  const missing = await callServerFn<{ ok: false; status: "unavailable"; reason: string }>(
    "restoreSavedPlanReview",
    "POST",
    {
      candidateId: "00000000-0000-4000-8000-000000000001",
      candidateVersion: 1,
    },
  );
  assert.equal(missing.status, "unavailable");
  assert.equal(missing.reason, "not_found");

  const foreignRestore = await restoreSavedPlanReviewForUser(
    "00000000-0000-4000-8000-000000000002",
    {
      candidateId: current.candidate.id,
      candidateVersion: current.candidate.version,
    },
  );
  assert.equal(foreignRestore.status, "unavailable");
  assert.equal(foreignRestore.reason, "not_found");

  console.log(
    JSON.stringify({
      ok: true,
      boundary: "public_restore_to_server_fn_confirm",
      restoreStatus: restored.status,
      confirmationStatus: confirmed.status,
      confirmationCount: confirmations.count,
      calendarRowCount: calendar.count,
      duplicateMaterializationRejected: true,
      expiredRestoreReadOnly: true,
      missingRestoreRejected: true,
      foreignRestoreRejected: true,
    }),
  );
} finally {
  await releaseQaPoolLease(lease);
}

function buildServerFnCaller(cookie: string) {
  return async function callServerFn<T>(
    functionName: string,
    method: "GET" | "POST",
    data?: unknown,
  ): Promise<T> {
    const headers = new Headers({
      accept: "application/json",
      cookie,
      "x-tsr-serverFn": "true",
    });
    const init: RequestInit = { method, headers };
    if (method === "POST") {
      headers.set("content-type", "application/json");
      init.body = JSON.stringify(await toJSONAsync({ data }));
    }

    const response = await fetch(
      new URL(`/_serverFn/${serverFnId(functionName)}`, RUNTIME_URL),
      init,
    );
    assert.equal(response.ok, true, `${functionName} returned HTTP ${response.status}.`);
    const decoded = fromCrossJSON((await response.json()) as never, {}) as {
      result: T;
      error?: unknown;
    };
    if (decoded.error) throw decoded.error;
    return decoded.result;
  };
}

function serverFnId(functionName: string) {
  return createHash("sha256")
    .update(`${SERVER_FN_FILE}--${functionName}_createServerFn_handler`)
    .digest("hex");
}
