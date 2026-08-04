import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { crc32 } from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import { readLocalAuthAccountsFile } from "../src/lib/local-auth";
import { deleteRunnerActivityFromHistory } from "../src/lib/runner-activity/garmin-fit-source";
import { isLoopbackRuntimeUrl } from "../src/lib/supabase/env";
import {
  ingestGarminWorkoutResult,
  removeWorkoutResultEvidence,
  type WorkoutResultProjectionFailurePointForQa,
} from "../src/lib/workout-result-import/ingest-garmin-result";
import { parseGarminFitActivity } from "../src/lib/workout-result-import/parse-garmin-fit";
import { WORKOUT_RESULT_STORAGE_BUCKET } from "../src/lib/workout-result-import/types";
import {
  QA_TESTER_POOL,
  assertQaPoolAuthUser,
  ensureQaPoolAuthUser,
  getQaUserOwnedCounts,
  resetQaPoolUserData,
} from "./lib/qa-test-user-lifecycle.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required for the activity foundation proof.",
  );
}
if (!isLoopbackRuntimeUrl(supabaseUrl)) {
  throw new Error("The activity foundation proof requires a loopback Supabase target.");
}
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error(
    "Local Supabase publishable key is required for the activity foundation RLS proof.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const runtimeUrl = process.argv
  .find((arg) => arg.startsWith("--runtime-url="))
  ?.slice("--runtime-url=".length);

async function main() {
  const plannedUser = await ensurePoolUser("provider-engine");
  const unplannedUser = await ensurePoolUser("baseline-no-plan");
  await resetQaUsers([plannedUser.id, unplannedUser.id]);

  try {
    await proveProjectionRegressionDiscriminators({
      plannedUserId: plannedUser.id,
      unplannedUserId: unplannedUser.id,
    });
    await resetQaUsers([plannedUser.id, unplannedUser.id]);
    await proveUnplannedLifecycle({
      userId: unplannedUser.id,
      otherUserRole: "provider-engine",
    });
    await provePlannedProjectionLifecycle(plannedUser.id);
    if (runtimeUrl) {
      await resetQaPoolUserData({ supabase, userId: plannedUser.id });
      await proveRuntimeUploadProjection({ userId: plannedUser.id, runtimeUrl });
    }
  } finally {
    await resetQaUsers([plannedUser.id, unplannedUser.id]);
  }

  const [plannedCounts, unplannedCounts] = await Promise.all([
    getQaUserOwnedCounts(supabase, plannedUser.id),
    getQaUserOwnedCounts(supabase, unplannedUser.id),
  ]);
  assert.equal(plannedCounts.runner_activities, 0);
  assert.equal(unplannedCounts.runner_activities, 0);
  await assertWorkoutResultStorageEmpty(plannedUser.id);
  await assertWorkoutResultStorageEmpty(unplannedUser.id);
  await assertLegacyBackfillRetirementComplete();
  console.log("Runner activity foundation contract passed.");
}

async function resetQaUsers(userIds: string[]) {
  const results = await Promise.allSettled(
    userIds.map((userId) => resetQaPoolUserData({ supabase, userId })),
  );
  const errors = results.flatMap((result) => (result.status === "rejected" ? [result.reason] : []));
  if (errors.length > 0) {
    throw new AggregateError(errors, "Runner activity foundation cleanup failed.");
  }
}

async function assertLegacyBackfillRetirementComplete() {
  const result = await supabase
    .from("workout_result_assets")
    .select("id", { count: "exact", head: true })
    .eq("parse_status", "parsed")
    .is("activity_source_revision_id", null);
  if (result.error) throw new Error(result.error.message);
  assert.equal(result.count, 0, "Parsed workout-result assets must use canonical activity truth.");
}

async function assertWorkoutResultStorageEmpty(userId: string) {
  const result = await supabase.storage
    .from(WORKOUT_RESULT_STORAGE_BUCKET)
    .list(userId, { limit: 100 });
  if (result.error) throw new Error(result.error.message);
  assert.deepEqual(result.data, []);
}

async function proveRuntimeUploadProjection(input: { userId: string; runtimeUrl: string }) {
  const baseUrl = new URL(input.runtimeUrl);
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(baseUrl.hostname));
  const accounts = await readLocalAuthAccountsFile(
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE ?? ".tanstack/hito-running-local-accounts.json",
  );
  const account = accounts.find((candidate) => candidate.username === "qa-provider-engine");
  assert.ok(account, "The named provider-engine account must exist in the local auth registry.");

  const loginBody = new FormData();
  loginBody.set("identifier", account.username);
  loginBody.set("password", account.password);
  loginBody.set("next", "/");
  const login = await fetch(new URL("/api/auth/local-login", baseUrl), {
    method: "POST",
    body: loginBody,
    redirect: "manual",
  });
  assert.equal(login.status, 302);
  const setCookie = login.headers.get("set-cookie");
  assert.ok(setCookie);
  const cookie = setCookie.split(";", 1)[0];
  const [plannedWorkoutId] = await createProofWorkouts(input.userId);
  const fixture = await readFitFixture();

  const upload = async (name: string) => {
    const body = new FormData();
    body.set("plannedWorkoutId", plannedWorkoutId);
    body.set("file", new File([fixture], name, { type: "application/octet-stream" }));
    const response = await fetch(new URL("/api/workout-result/upload", baseUrl), {
      method: "POST",
      headers: { cookie },
      body,
    });
    assert.equal(response.status, 200);
    return response.json();
  };

  const first = await upload("runtime-projection.fit");
  const retried = await upload("runtime-projection-retry.fit");
  assert.equal(first.ok, true);
  assert.equal(first.activityReadback.status, "current");
  assert.equal(first.latestAsset.id, retried.latestAsset.id);
  assert.equal(first.latestActualMetrics.id, retried.latestActualMetrics.id);
  assert.equal(first.latestComparison.id, retried.latestComparison.id);
  assert.ok(
    first.activityReadback.history.items.some(
      (activity: { id: string }) => activity.id === first.runnerActivity.id,
    ),
  );
  const responseText = JSON.stringify(retried);
  for (const privateField of [
    "storage_bucket",
    "storage_path",
    "raw_storage_bucket",
    "raw_storage_path",
  ]) {
    assert.equal(responseText.includes(privateField), false);
  }
}

async function proveProjectionRegressionDiscriminators(input: {
  plannedUserId: string;
  unplannedUserId: string;
}) {
  const failures: Error[] = [];
  const checks = [
    {
      label: "exact-source retry repairs an incomplete planned projection",
      userId: input.plannedUserId,
      run: () => proveIncompleteExactSourceRetry(input.plannedUserId),
    },
    {
      label: "reused unplanned source retains a valid planned projection asset",
      userId: input.unplannedUserId,
      run: () => proveReusedUnplannedSourceProjection(input.unplannedUserId),
    },
    {
      label: "a newer source supersedes only the older workout projection",
      userId: input.plannedUserId,
      run: () => proveProjectionSupersession(input.plannedUserId),
    },
    {
      label: "ordinary intake leaves unrelated legacy projection data untouched",
      userId: input.unplannedUserId,
      run: () => proveOrdinaryIntakeDoesNotMutateLegacyProjection(input.unplannedUserId),
    },
    {
      label: "projection write failures preserve canonical activity and converge on retry",
      userId: input.plannedUserId,
      run: () => proveProjectionFailureBoundaries(input.plannedUserId),
    },
  ];

  for (const check of checks) {
    try {
      await check.run();
    } catch (error) {
      failures.push(
        new Error(`${check.label}: ${error instanceof Error ? error.message : String(error)}`, {
          cause: error,
        }),
      );
    } finally {
      await resetQaPoolUserData({ supabase, userId: check.userId });
    }
  }

  if (failures.length > 0) {
    throw new AggregateError(failures, "Runner activity projection regression proof failed.");
  }
}

async function proveIncompleteExactSourceRetry(userId: string) {
  const fixture = await readFitFixture();
  const [plannedWorkoutId] = await createProofWorkouts(userId);
  const first = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId,
    file: new File([fixture], "incomplete-projection.fit", {
      type: "application/octet-stream",
    }),
  });
  assert.ok(first.latestComparison?.id);

  const comparisonDelete = await supabase
    .from("workout_comparisons")
    .delete()
    .eq("id", first.latestComparison.id);
  if (comparisonDelete.error) throw new Error(comparisonDelete.error.message);

  const retried = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId,
    file: new File([fixture], "incomplete-projection-retry.fit", {
      type: "application/octet-stream",
    }),
  });
  assert.equal(retried.runnerActivity.id, first.runnerActivity.id);
  assert.ok(retried.latestAsset?.id);
  assert.ok(retried.latestActualMetrics?.id);
  assert.ok(retried.latestComparison?.id);
  await assertCompletePlannedProjection({
    userId,
    plannedWorkoutId,
    activityId: retried.runnerActivity.id,
    activityRevisionId: retried.runnerActivity.revisionId,
    sourceRevisionId: retried.runnerActivity.sourceRevisionId,
    assetId: retried.latestAsset.id,
    metricsId: retried.latestActualMetrics.id,
    comparisonId: retried.latestComparison.id,
  });

  const matchDelete = await supabase
    .from("runner_activity_planned_workout_matches")
    .delete()
    .eq("activity_id", retried.runnerActivity.id);
  if (matchDelete.error) throw new Error(matchDelete.error.message);
  const matchRepaired = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId,
    file: new File([fixture], "missing-match-retry.fit", { type: "application/octet-stream" }),
  });
  assert.ok(matchRepaired.latestComparison?.id);

  const metricsDelete = await supabase
    .from("workout_actual_metrics")
    .delete()
    .eq("id", matchRepaired.latestActualMetrics?.id ?? "");
  if (metricsDelete.error) throw new Error(metricsDelete.error.message);
  const metricsRepaired = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId,
    file: new File([fixture], "missing-metrics-retry.fit", { type: "application/octet-stream" }),
  });
  assert.ok(metricsRepaired.latestActualMetrics?.id);
  assert.ok(metricsRepaired.latestComparison?.id);
  await assertCompletePlannedProjection({
    userId,
    plannedWorkoutId,
    activityId: metricsRepaired.runnerActivity.id,
    activityRevisionId: metricsRepaired.runnerActivity.revisionId,
    sourceRevisionId: metricsRepaired.runnerActivity.sourceRevisionId,
    assetId: metricsRepaired.latestAsset?.id ?? "",
    metricsId: metricsRepaired.latestActualMetrics.id,
    comparisonId: metricsRepaired.latestComparison.id,
  });
}

async function proveReusedUnplannedSourceProjection(userId: string) {
  const fixture = await readFitFixture();
  const zipFixture = buildStoredZip(fixture, "activity.fit");
  const [plannedWorkoutId] = await createProofWorkouts(userId);
  const unplanned = await ingestGarminWorkoutResult({
    userId,
    file: new File([zipFixture], "reused-unplanned.zip", { type: "application/zip" }),
  });

  const planned = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId,
    file: new File([zipFixture], "reused-unplanned-planned.zip", { type: "application/zip" }),
  });
  assert.equal(planned.runnerActivity.id, unplanned.runnerActivity.id);
  assert.ok(planned.latestAsset?.id);
  assert.ok(planned.latestActualMetrics?.id);
  assert.ok(planned.latestComparison?.id);
  await assertCompletePlannedProjection({
    userId,
    plannedWorkoutId,
    activityId: planned.runnerActivity.id,
    activityRevisionId: planned.runnerActivity.revisionId,
    sourceRevisionId: planned.runnerActivity.sourceRevisionId,
    assetId: planned.latestAsset.id,
    metricsId: planned.latestActualMetrics.id,
    comparisonId: planned.latestComparison.id,
  });

  const [linkedAsset, sourceRevision] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("id, activity_source_revision_id, storage_bucket, storage_path")
      .eq("id", planned.latestAsset.id)
      .eq("activity_source_revision_id", planned.runnerActivity.sourceRevisionId)
      .single(),
    supabase
      .from("runner_activity_source_revisions")
      .select("raw_storage_bucket, raw_storage_path")
      .eq("id", planned.runnerActivity.sourceRevisionId)
      .single(),
  ]);
  if (linkedAsset.error) throw new Error(linkedAsset.error.message);
  if (sourceRevision.error) throw new Error(sourceRevision.error.message);
  assert.equal(linkedAsset.data.id, planned.latestAsset.id);
  assert.equal(linkedAsset.data.storage_bucket, null);
  assert.equal(linkedAsset.data.storage_path, null);
  assert.ok(sourceRevision.data.raw_storage_bucket);
  assert.ok(sourceRevision.data.raw_storage_path);
}

function buildStoredZip(content: Buffer, fileName: string) {
  const name = Buffer.from(fileName, "utf8");
  const checksum = crc32(content) >>> 0;
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(content.length, 18);
  local.writeUInt32LE(content.length, 22);
  local.writeUInt16LE(name.length, 26);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(content.length, 20);
  central.writeUInt32LE(content.length, 24);
  central.writeUInt16LE(name.length, 28);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + name.length, 12);
  end.writeUInt32LE(local.length + name.length + content.length, 16);
  return Buffer.concat([local, name, content, central, name, end]);
}

async function proveProjectionSupersession(userId: string) {
  const fixture = await readFitFixture();
  const [plannedWorkoutId] = await createProofWorkouts(userId);
  const first = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId,
    file: new File([fixture], "superseded-first.fit", { type: "application/octet-stream" }),
  });
  const secondFixture = Buffer.concat([fixture, Buffer.from([0])]);
  const second = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId,
    file: new File([secondFixture], "superseding-second.fit", {
      type: "application/octet-stream",
    }),
  });
  assert.notEqual(second.runnerActivity.id, first.runnerActivity.id);

  const metrics = await supabase
    .from("workout_actual_metrics")
    .select("id, status")
    .eq("user_id", userId)
    .eq("planned_workout_id", plannedWorkoutId)
    .order("created_at", { ascending: true });
  if (metrics.error) throw new Error(metrics.error.message);
  assert.equal(metrics.data.length, 2);
  assert.deepEqual(
    metrics.data.map((row) => row.status),
    ["superseded", "normalized"],
  );
  assert.equal(metrics.data[1]?.id, second.latestActualMetrics?.id);

  const firstActivity = await supabase
    .from("runner_activities")
    .select("id")
    .eq("user_id", userId)
    .eq("id", first.runnerActivity.id)
    .maybeSingle();
  if (firstActivity.error) throw new Error(firstActivity.error.message);
  assert.equal(firstActivity.data?.id, first.runnerActivity.id);

  const retriedFirst = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId,
    file: new File([fixture], "superseded-first-retry.fit", {
      type: "application/octet-stream",
    }),
  });
  assert.equal(retriedFirst.latestAsset?.id, second.latestAsset?.id);
  assert.equal(retriedFirst.latestActualMetrics?.id, second.latestActualMetrics?.id);
  assert.equal(retriedFirst.latestComparison?.id, second.latestComparison?.id);

  const afterOlderRetry = await supabase
    .from("workout_actual_metrics")
    .select("id, status")
    .eq("user_id", userId)
    .eq("planned_workout_id", plannedWorkoutId)
    .order("created_at", { ascending: true });
  if (afterOlderRetry.error) throw new Error(afterOlderRetry.error.message);
  assert.deepEqual(afterOlderRetry.data, metrics.data);
}

async function proveProjectionFailureBoundaries(userId: string) {
  await proveProjectionFailureInjectionIsLoopbackOnly(userId);
  const fixture = await readFitFixture();
  const failurePoints: WorkoutResultProjectionFailurePointForQa[] = [
    "candidate_cleanup",
    "asset_link",
    "match",
    "metrics",
    "comparison",
    "supersession",
  ];

  for (const [index, failurePoint] of failurePoints.entries()) {
    await resetQaPoolUserData({ supabase, userId });
    const [plannedWorkoutId] = await createProofWorkouts(userId);
    const sourceFixture = Buffer.concat([fixture, Buffer.from([index + 11])]);

    if (failurePoint === "candidate_cleanup") {
      const complete = await ingestGarminWorkoutResult({
        userId,
        plannedWorkoutId,
        file: new File([sourceFixture], "candidate-cleanup-complete.fit", {
          type: "application/octet-stream",
        }),
      });
      assert.ok(complete.latestAsset?.id);
      await assert.rejects(
        ingestGarminWorkoutResult({
          userId,
          plannedWorkoutId,
          file: new File([sourceFixture], "candidate-cleanup-failure.fit", {
            type: "application/octet-stream",
          }),
          projectionFailurePointForQa: failurePoint,
        }),
      );
      const preservedAsset = await supabase
        .from("workout_result_assets")
        .select("parse_status")
        .eq("id", complete.latestAsset.id)
        .single();
      if (preservedAsset.error) throw new Error(preservedAsset.error.message);
      assert.equal(preservedAsset.data.parse_status, "parsed");
    } else if (failurePoint === "supersession") {
      await ingestGarminWorkoutResult({
        userId,
        plannedWorkoutId,
        file: new File([fixture], "supersession-boundary-first.fit", {
          type: "application/octet-stream",
        }),
      });
      await assert.rejects(
        ingestGarminWorkoutResult({
          userId,
          plannedWorkoutId,
          file: new File([sourceFixture], "supersession-boundary-second.fit", {
            type: "application/octet-stream",
          }),
          projectionFailurePointForQa: failurePoint,
        }),
      );
    } else {
      await assert.rejects(
        ingestGarminWorkoutResult({
          userId,
          plannedWorkoutId,
          file: new File([sourceFixture], `${failurePoint}-boundary.fit`, {
            type: "application/octet-stream",
          }),
          projectionFailurePointForQa: failurePoint,
        }),
      );
    }

    const canonicalActivity = await supabase
      .from("runner_activities")
      .select("id")
      .eq("user_id", userId);
    if (canonicalActivity.error) throw new Error(canonicalActivity.error.message);
    assert.ok(canonicalActivity.data.length >= 1);

    const repaired = await ingestGarminWorkoutResult({
      userId,
      plannedWorkoutId,
      file: new File([sourceFixture], `${failurePoint}-retry.fit`, {
        type: "application/octet-stream",
      }),
    });
    assert.ok(repaired.latestAsset?.id);
    assert.ok(repaired.latestActualMetrics?.id);
    assert.ok(repaired.latestComparison?.id);
    await assertCompletePlannedProjection({
      userId,
      plannedWorkoutId,
      activityId: repaired.runnerActivity.id,
      activityRevisionId: repaired.runnerActivity.revisionId,
      sourceRevisionId: repaired.runnerActivity.sourceRevisionId,
      assetId: repaired.latestAsset.id,
      metricsId: repaired.latestActualMetrics.id,
      comparisonId: repaired.latestComparison.id,
    });
  }
}

async function proveProjectionFailureInjectionIsLoopbackOnly(userId: string) {
  const keys = ["NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL", "SUPABASE_URL"] as const;
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.VITE_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.SUPABASE_URL = "http://127.0.0.1:54321";
    await assert.rejects(
      ingestGarminWorkoutResult({
        userId,
        file: new File([Buffer.from([0])], "deployed-fault-injection.fit"),
        projectionFailurePointForQa: "asset_link",
      }),
      /requires loopback Supabase/,
    );

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await assert.rejects(
      ingestGarminWorkoutResult({
        userId,
        file: new File([Buffer.from([0])], "legacy-env-fault-injection.fit"),
        projectionFailurePointForQa: "asset_link",
      }),
      /requires loopback Supabase/,
    );
  } finally {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
}

async function proveOrdinaryIntakeDoesNotMutateLegacyProjection(userId: string) {
  const fixture = await readFitFixture();
  const parsed = await parseGarminFitActivity(fixture);
  const [plannedWorkoutId, legacyWorkoutId] = await createProofWorkouts(userId);
  const legacyAssetId = await insertLegacyProjectionAsset({
    userId,
    plannedWorkoutId: legacyWorkoutId,
    fixture,
    parsed,
  });

  const result = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId,
    file: new File([fixture], "ordinary-intake.fit", { type: "application/octet-stream" }),
  });
  assert.ok(result.latestComparison?.id);

  const legacyAsset = await supabase
    .from("workout_result_assets")
    .select("activity_source_revision_id, storage_bucket, storage_path")
    .eq("id", legacyAssetId)
    .single();
  if (legacyAsset.error) throw new Error(legacyAsset.error.message);
  assert.equal(legacyAsset.data.activity_source_revision_id, null);
  assert.equal(legacyAsset.data.storage_bucket, WORKOUT_RESULT_STORAGE_BUCKET);
  assert.ok(legacyAsset.data.storage_path);
}

async function assertCompletePlannedProjection(input: {
  userId: string;
  plannedWorkoutId: string;
  activityId: string;
  activityRevisionId: string;
  sourceRevisionId: string;
  assetId: string;
  metricsId: string;
  comparisonId: string;
}) {
  const [asset, activeMetrics, comparison, match] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("id, planned_workout_id, activity_source_revision_id, parse_status")
      .eq("id", input.assetId)
      .eq("user_id", input.userId)
      .single(),
    supabase
      .from("workout_actual_metrics")
      .select("id, result_asset_id, activity_revision_id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", input.plannedWorkoutId)
      .neq("status", "superseded"),
    supabase
      .from("workout_comparisons")
      .select("id, planned_workout_id, actual_metrics_id")
      .eq("id", input.comparisonId)
      .eq("user_id", input.userId)
      .single(),
    supabase
      .from("runner_activity_planned_workout_matches")
      .select("planned_workout_id")
      .eq("activity_id", input.activityId)
      .eq("user_id", input.userId)
      .single(),
  ]);
  for (const result of [asset, activeMetrics, comparison, match]) {
    if (result.error) throw new Error(result.error.message);
  }
  assert.equal(asset.data.id, input.assetId);
  assert.equal(asset.data.planned_workout_id, input.plannedWorkoutId);
  assert.equal(asset.data.activity_source_revision_id, input.sourceRevisionId);
  assert.equal(asset.data.parse_status, "parsed");
  assert.deepEqual(activeMetrics.data, [
    {
      id: input.metricsId,
      result_asset_id: input.assetId,
      activity_revision_id: input.activityRevisionId,
    },
  ]);
  assert.equal(comparison.data.planned_workout_id, input.plannedWorkoutId);
  assert.equal(comparison.data.actual_metrics_id, input.metricsId);
  assert.equal(match.data.planned_workout_id, input.plannedWorkoutId);
}

async function proveUnplannedLifecycle(input: {
  userId: string;
  otherUserRole: keyof typeof QA_TESTER_POOL;
}) {
  const { userId } = input;
  const fixture = await readFitFixture();
  const first = await ingestGarminWorkoutResult({
    userId,
    file: new File([fixture], "unplanned.fit", { type: "application/octet-stream" }),
  });
  assert.equal(first.ok, true);
  assert.equal(first.runnerActivity.rawFileAvailable, true);
  assert.equal("rawStoragePath" in first.runnerActivity, false);
  assert.equal("storagePath" in first.runnerActivity, false);

  const duplicate = await ingestGarminWorkoutResult({
    userId,
    file: new File([fixture], "unplanned.fit", { type: "application/octet-stream" }),
  });
  assert.equal(duplicate.runnerActivity.id, first.runnerActivity.id);
  const beforeDelete = await getQaUserOwnedCounts(supabase, userId);
  assert.equal(beforeDelete.runner_activities, 1);
  assert.equal(beforeDelete.runner_activity_source_revisions, 1);
  const linkedAsset = await supabase
    .from("workout_result_assets")
    .select("activity_source_revision_id")
    .eq("user_id", userId)
    .eq("activity_source_revision_id", first.runnerActivity.sourceRevisionId)
    .maybeSingle();
  if (linkedAsset.error) throw new Error(linkedAsset.error.message);
  assert.equal(
    linkedAsset.data?.activity_source_revision_id,
    first.runnerActivity.sourceRevisionId,
  );
  await proveCrossRunnerReadDenied({
    activityId: first.runnerActivity.id,
    role: input.otherUserRole,
  });

  await deleteRunnerActivityFromHistory({ userId, activityId: first.runnerActivity.id });
  const afterDelete = await getQaUserOwnedCounts(supabase, userId);
  assert.equal(afterDelete.runner_activities, 0);
  assert.equal(afterDelete.runner_activity_sources, 0);
  assert.equal(afterDelete.runner_activity_source_revisions, 0);
  assert.equal(afterDelete.runner_activity_revisions, 0);
  assert.equal(afterDelete.workout_result_assets, 0);
}

async function proveCrossRunnerReadDenied(input: {
  activityId: string;
  role: keyof typeof QA_TESTER_POOL;
}) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({
    email: QA_TESTER_POOL[input.role].email,
    password: `gate1-${input.role}-local-password`,
  });
  if (signIn.error) throw new Error(signIn.error.message);
  const read = await client.from("runner_activities").select("id").eq("id", input.activityId);
  await client.auth.signOut();
  if (read.error) throw new Error(read.error.message);
  assert.deepEqual(read.data, []);
}

async function provePlannedProjectionLifecycle(userId: string) {
  const fixture = await readFitFixture();
  const [firstWorkoutId, secondWorkoutId] = await createProofWorkouts(userId);
  const first = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId: firstWorkoutId,
    file: new File([fixture], "planned.fit", { type: "application/octet-stream" }),
  });
  assert.equal(first.ok, true);
  assert.equal(first.latestActualMetrics?.actualDistanceKm != null, true);
  assert.equal(first.latestAsset?.rawFileAvailable, true);
  assert.equal("storagePath" in (first.latestAsset ?? {}), false);

  const duplicate = await ingestGarminWorkoutResult({
    userId,
    plannedWorkoutId: firstWorkoutId,
    file: new File([fixture], "planned.fit", { type: "application/octet-stream" }),
  });
  assert.equal(duplicate.runnerActivity.id, first.runnerActivity.id);
  const countsAfterDuplicate = await getQaUserOwnedCounts(supabase, userId);
  assert.equal(countsAfterDuplicate.runner_activities, 1);
  assert.equal(countsAfterDuplicate.workout_actual_metrics, 1);

  await assert.rejects(
    ingestGarminWorkoutResult({
      userId,
      plannedWorkoutId: secondWorkoutId,
      file: new File([fixture], "cross-plan-duplicate.fit", { type: "application/octet-stream" }),
    }),
    (error: unknown) =>
      error instanceof Error && "code" in error && error.code === "activity_already_recorded",
  );
  const countsAfterCrossPlanRefusal = await getQaUserOwnedCounts(supabase, userId);
  assert.equal(countsAfterCrossPlanRefusal.workout_result_assets, 1);
  assert.equal(countsAfterCrossPlanRefusal.workout_actual_metrics, 1);

  const removed = await removeWorkoutResultEvidence({ userId, plannedWorkoutId: firstWorkoutId });
  assert.equal(removed.latestAsset?.rawFileAvailable, false);
  assert.equal(removed.latestAsset?.reprocessingAvailable, false);
  assert.equal(removed.latestActualMetrics?.id, first.latestActualMetrics?.id);
  assert.equal(removed.latestComparison?.id, first.latestComparison?.id);
  const comparisonVersion = await supabase
    .from("workout_comparisons")
    .select("comparison_formula_version")
    .eq("id", first.latestComparison?.id ?? "")
    .single();
  if (comparisonVersion.error) throw new Error(comparisonVersion.error.message);
  assert.equal(
    comparisonVersion.data.comparison_formula_version,
    "deterministic_workout_comparison_v1",
  );

  const replacement = await supabase
    .from("workout_result_assets")
    .update({ planned_workout_id: secondWorkoutId })
    .eq("id", first.latestAsset?.id ?? "");
  if (replacement.error) throw new Error(replacement.error.message);
  const match = await supabase
    .from("runner_activity_planned_workout_matches")
    .select("planned_workout_id")
    .eq("activity_id", first.runnerActivity.id)
    .maybeSingle();
  if (match.error) throw new Error(match.error.message);
  assert.equal(match.data?.planned_workout_id, secondWorkoutId);

  const sourceLinks = await supabase
    .from("workout_result_assets")
    .select("activity_source_revision_id")
    .eq("user_id", userId)
    .eq("planned_workout_id", secondWorkoutId)
    .not("activity_source_revision_id", "is", null);
  if (sourceLinks.error) throw new Error(sourceLinks.error.message);
  const sourceRevisionIds = (sourceLinks.data ?? [])
    .map((row) => row.activity_source_revision_id)
    .filter((id): id is string => Boolean(id));
  assert.equal(sourceRevisionIds.length, 1);

  await removeWorkoutResultEvidence({ userId, plannedWorkoutId: secondWorkoutId });
  const rawStates = await supabase
    .from("runner_activity_source_revisions")
    .select("raw_state")
    .eq("user_id", userId)
    .in("id", sourceRevisionIds);
  if (rawStates.error) throw new Error(rawStates.error.message);
  assert.deepEqual(
    rawStates.data?.map((row) => row.raw_state),
    ["removed"],
  );
}

async function ensurePoolUser(role: keyof typeof QA_TESTER_POOL) {
  const user = await ensureQaPoolAuthUser({
    supabase,
    role,
    password: `gate1-${role}-local-password`,
  });
  await assertQaPoolAuthUser({ supabase, role, userId: user.id });
  return user;
}

async function createProofWorkouts(userId: string): Promise<[string, string, string]> {
  const planCycleId = randomUUID();
  const firstWorkoutId = randomUUID();
  const secondWorkoutId = randomUUID();
  const thirdWorkoutId = randomUUID();
  const plan = await supabase.from("plan_cycles").insert({
    id: planCycleId,
    user_id: userId,
    status: "active",
    title: "Gate 1 proof plan",
    goal_summary: "Local activity proof",
    source_template: "qa_activity_foundation",
    start_date: "2026-08-01",
    end_date: "2026-08-02",
  });
  if (plan.error) throw new Error(plan.error.message);
  const workouts = await supabase
    .from("planned_workouts")
    .insert([
      proofWorkoutRow(firstWorkoutId, planCycleId, userId, "2026-08-01", 0),
      proofWorkoutRow(secondWorkoutId, planCycleId, userId, "2026-08-02", 1),
      proofWorkoutRow(thirdWorkoutId, planCycleId, userId, "2026-08-03", 2),
    ]);
  if (workouts.error) throw new Error(workouts.error.message);
  return [firstWorkoutId, secondWorkoutId, thirdWorkoutId];
}

async function insertLegacyProjectionAsset(input: {
  userId: string;
  plannedWorkoutId: string;
  fixture: Buffer;
  parsed: Awaited<ReturnType<typeof parseGarminFitActivity>>;
}) {
  const assetId = randomUUID();
  const storagePath = `${input.userId}/legacy/${assetId}/original.fit`;
  const storage = await supabase.storage
    .from(WORKOUT_RESULT_STORAGE_BUCKET)
    .upload(storagePath, input.fixture, { contentType: "application/octet-stream" });
  if (storage.error) throw new Error(storage.error.message);

  const asset = await supabase
    .from("workout_result_assets")
    .insert({
      id: assetId,
      user_id: input.userId,
      planned_workout_id: input.plannedWorkoutId,
      asset_kind: "garmin_fit",
      storage_bucket: WORKOUT_RESULT_STORAGE_BUCKET,
      storage_path: storagePath,
      original_file_name: "legacy.fit",
      mime_type: "application/octet-stream",
      file_size_bytes: input.fixture.length,
      parse_status: "parsed",
      primary_file_kind: "fit",
      primary_file_name: "legacy.fit",
    })
    .select("id")
    .single();
  if (asset.error) throw new Error(asset.error.message);

  const metrics = await supabase.from("workout_actual_metrics").insert({
    user_id: input.userId,
    planned_workout_id: input.plannedWorkoutId,
    result_asset_id: asset.data.id,
    source_kind: input.parsed.sourceKind,
    status: "normalized",
    activity_started_at: input.parsed.activityStartAt,
    activity_local_date: input.parsed.activityLocalDate,
    actual_duration_min: input.parsed.totalDurationMin,
    actual_distance_km: input.parsed.totalDistanceKm,
    actual_avg_hr: input.parsed.avgHeartRate,
    actual_max_hr: input.parsed.maxHeartRate,
    actual_avg_power: input.parsed.avgPower,
    actual_max_power: input.parsed.maxPower,
    actual_avg_cadence: input.parsed.avgCadence,
    actual_calories: input.parsed.totalCalories,
    actual_elevation_gain_m: input.parsed.totalAscentM,
    actual_elevation_loss_m: input.parsed.totalDescentM,
    actual_interval_count: input.parsed.actualIntervalCount,
    actual_step_payload: input.parsed.actualStepPayload,
    lap_payload: input.parsed.lapPayload,
    summary_payload: input.parsed.summaryPayload,
  });
  if (metrics.error) throw new Error(metrics.error.message);
  return assetId;
}

function proofWorkoutRow(
  id: string,
  planCycleId: string,
  userId: string,
  workoutDate: string,
  displayOrder: number,
) {
  return {
    id,
    plan_cycle_id: planCycleId,
    user_id: userId,
    workout_date: workoutDate,
    weekday: displayOrder === 0 ? "Saturday" : "Sunday",
    week_number: 1,
    phase: "base",
    workout_type: "easy" as const,
    title: "Easy Run",
    notes: null,
    steps: [],
    display_order: displayOrder,
  };
}

async function readFitFixture() {
  return readFile(new URL("../sample-fit-from-zip.fit", import.meta.url));
}

await main();
