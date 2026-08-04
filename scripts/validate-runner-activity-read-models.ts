import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readLocalAuthAccountsFile } from "../src/lib/local-auth";
import { getRunnerActivityProgressFactsForUser } from "../src/lib/runner-activity/fact-snapshots";
import {
  deleteRunnerActivityFromHistory,
  persistGarminFitActivitySource,
  removeRunnerActivityOriginalFilesForActivity,
} from "../src/lib/runner-activity/garmin-fit-source";
import { listRunnerActivityHistoryForUser } from "../src/lib/runner-activity/history-read-model";
import { createRunnerActivityPlannedWorkoutMatch } from "../src/lib/runner-activity/garmin-fit-source";
import type { ParsedGarminWorkout } from "../src/lib/workout-result-import/types";
import { WORKOUT_RESULT_STORAGE_BUCKET } from "../src/lib/workout-result-import/types";
import { addDaysIso, todayIso, weekdayLong } from "../src/lib/training";
import {
  QA_TESTER_POOL,
  assertQaPoolAuthUser,
  ensureQaPoolAuthUser,
  getQaUserOwnedCounts,
  resetQaPoolUserData,
} from "./lib/qa-test-user-lifecycle.mjs";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
  throw new Error("Local Supabase URL, publishable key, and service role key are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const AS_OF_DATE = todayIso();
const runtimeUrl = process.env.RUNNER_ACTIVITY_RUNTIME_URL?.trim() || null;

async function main() {
  const runtimeSession = runtimeUrl ? await prepareRuntimePoolIdentity(runtimeUrl) : null;
  const owner = await ensurePoolUser("provider-engine");
  const other = await ensurePoolUser("isolation-a");
  await resetQaPoolUserData({ supabase, userId: owner.id });
  await resetQaPoolUserData({ supabase, userId: other.id });

  try {
    const plannedWorkoutId = await createPlannedWorkout(owner.id);
    const activities = {
      currentLongest: await persistSyntheticActivity({
        userId: owner.id,
        key: "current-longest",
        localDate: addDaysIso(AS_OF_DATE, -1),
        timerDurationMin: 60,
        elapsedDurationMin: 65,
        distanceKm: 10,
        elevationGainM: 100,
        averageHeartRate: 142,
      }),
      currentEasy: await persistSyntheticActivity({
        userId: owner.id,
        key: "current-easy",
        localDate: addDaysIso(AS_OF_DATE, -7),
        timerDurationMin: 30,
        elapsedDurationMin: 34,
        distanceKm: 5,
        elevationGainM: null,
        averageHeartRate: null,
      }),
      elapsedOnly: await persistSyntheticActivity({
        userId: owner.id,
        key: "elapsed-only",
        localDate: addDaysIso(AS_OF_DATE, -13),
        timerDurationMin: null,
        elapsedDurationMin: 40,
        distanceKm: 5,
        elevationGainM: 20,
        averageHeartRate: 135,
      }),
      distanceMissing: await persistSyntheticActivity({
        userId: owner.id,
        key: "distance-missing",
        localDate: addDaysIso(AS_OF_DATE, -21),
        timerDurationMin: 20,
        elapsedDurationMin: 22,
        distanceKm: null,
        elevationGainM: null,
        averageHeartRate: null,
      }),
      previousWindow: await persistSyntheticActivity({
        userId: owner.id,
        key: "previous-window",
        localDate: addDaysIso(AS_OF_DATE, -33),
        timerDurationMin: 45,
        elapsedDurationMin: 48,
        distanceKm: 7,
        elevationGainM: null,
        averageHeartRate: 138,
      }),
    };
    await createRunnerActivityPlannedWorkoutMatch({
      userId: owner.id,
      activityId: activities.currentLongest.receipt.activityId,
      sourceRevisionId: activities.currentLongest.receipt.sourceRevisionId,
      plannedWorkoutId,
    });

    await proveHistoryPagination({
      userId: owner.id,
      plannedWorkoutId,
      longestActivityId: activities.currentLongest.receipt.activityId,
      elapsedOnlyActivityId: activities.elapsedOnly.receipt.activityId,
    });
    const firstProgress = await proveFactSnapshots(owner.id);
    await proveSnapshotRls({
      ownerRole: "provider-engine",
      otherRole: "isolation-a",
      snapshotId: firstProgress.rolling28Day.current.id,
    });
    await proveEmptyHistoryAndProgress(other.id);

    const sourceRemoval = await removeRunnerActivityOriginalFilesForActivity({
      userId: owner.id,
      activityId: activities.currentLongest.receipt.activityId,
    });
    assert.equal(sourceRemoval.status, "current");
    if (sourceRemoval.status !== "current") throw new Error("Expected current source readback.");
    assert.equal(
      sourceRemoval.progress.rolling28Day.current.id,
      firstProgress.rolling28Day.current.id,
    );
    assert.equal(
      sourceRemoval.history.items.find(
        (item) => item.id === activities.currentLongest.receipt.activityId,
      )?.source.rawState,
      "removed",
    );

    await removeRunnerActivityOriginalFilesForActivity({
      userId: owner.id,
      activityId: activities.elapsedOnly.receipt.activityId,
    });
    const corrected = await persistSyntheticActivity({
      userId: owner.id,
      key: "elapsed-only",
      localDate: addDaysIso(AS_OF_DATE, -13),
      timerDurationMin: 50,
      elapsedDurationMin: 52,
      distanceKm: 5,
      elevationGainM: 20,
      averageHeartRate: 135,
      storageSuffix: "correction",
    });
    assert.equal(corrected.receipt.activityId, activities.elapsedOnly.receipt.activityId);
    assert.notEqual(
      corrected.receipt.activityRevisionId,
      activities.elapsedOnly.receipt.activityRevisionId,
    );
    const correctedProgress = await getRunnerActivityProgressFactsForUser({
      userId: owner.id,
      asOfDate: AS_OF_DATE,
      creationCause: "correction",
    });
    assert.notEqual(
      correctedProgress.rolling28Day.current.id,
      firstProgress.rolling28Day.current.id,
    );
    assert.equal(correctedProgress.rolling28Day.current.facts.runningTime.value, 160);
    assert.equal(correctedProgress.rolling28Day.current.facts.runningTime.confidence, "complete");

    const deletionReadback = await deleteRunnerActivityFromHistory({
      userId: owner.id,
      activityId: activities.currentEasy.receipt.activityId,
    });
    assert.equal(deletionReadback.status, "current");
    if (deletionReadback.status !== "current") throw new Error("Expected current delete readback.");
    assert.equal(deletionReadback.history.items.length, 4);
    assert.equal(deletionReadback.progress.rolling28Day.current.facts.sessions.value, 3);
    assert.notEqual(
      deletionReadback.progress.rolling28Day.current.id,
      correctedProgress.rolling28Day.current.id,
    );
    const removedSnapshot = await supabase
      .from("runner_activity_fact_snapshots")
      .select("id")
      .eq("id", correctedProgress.rolling28Day.current.id)
      .maybeSingle();
    if (removedSnapshot.error) throw new Error(removedSnapshot.error.message);
    assert.equal(removedSnapshot.data, null);

    if (runtimeUrl) {
      assert.ok(runtimeSession);
      await proveRuntimeRoutes({
        userId: owner.id,
        runtimeUrl,
        cookie: runtimeSession.cookie,
      });
    }
  } finally {
    await resetQaPoolUserData({ supabase, userId: owner.id });
    await resetQaPoolUserData({ supabase, userId: other.id });
  }

  const ownerCounts = await getQaUserOwnedCounts(supabase, owner.id);
  const otherCounts = await getQaUserOwnedCounts(supabase, other.id);
  assert.equal(ownerCounts.runner_activities, 0);
  assert.equal(ownerCounts.runner_activity_fact_snapshots, 0);
  assert.equal(otherCounts.runner_activities, 0);
  assert.equal(otherCounts.runner_activity_fact_snapshots, 0);
  console.log("Runner activity Gate 2 read-model contract passed.");
}

async function proveEmptyHistoryAndProgress(userId: string) {
  const history = await listRunnerActivityHistoryForUser({ userId });
  assert.deepEqual(history, { items: [], nextCursor: null });
  const progress = await getRunnerActivityProgressFactsForUser({ userId, asOfDate: AS_OF_DATE });
  const current = progress.rolling28Day.current;
  assert.equal(current.facts.sessions.availability, "unavailable");
  assert.equal(current.facts.sessions.value, null);
  assert.deepEqual(current.facts.sessions.missingReasons, ["no_recorded_activities"]);
  assert.equal(current.facts.runningTime.value, null);
  assert.equal(current.facts.distance.value, null);
}

async function prepareRuntimePoolIdentity(runtimeUrl: string) {
  const baseUrl = new URL(runtimeUrl);
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(baseUrl.hostname));
  const accountsFile =
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE ?? ".tanstack/hito-running-local-accounts.json";
  const accounts = await readLocalAuthAccountsFile(accountsFile);
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

  const provision = await fetch(new URL("/api/runner-activities", baseUrl), {
    headers: { cookie },
  });
  assert.equal(provision.status, 200);
  return { cookie };
}

async function proveRuntimeRoutes(input: { userId: string; runtimeUrl: string; cookie: string }) {
  const baseUrl = new URL(input.runtimeUrl);
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(baseUrl.hostname));

  const unauthorized = await fetch(new URL("/api/runner-activities", baseUrl));
  assert.equal(unauthorized.status, 401);
  assert.equal((await unauthorized.json()).code, "auth_required");

  const headers = { cookie: input.cookie };

  const routeSource = await persistSyntheticActivity({
    userId: input.userId,
    key: "runtime-source-remove",
    localDate: "2026-05-01",
    timerDurationMin: 25,
    elapsedDurationMin: 28,
    distanceKm: 4,
    elevationGainM: 10,
    averageHeartRate: 132,
  });
  const routeDelete = await persistSyntheticActivity({
    userId: input.userId,
    key: "runtime-history-delete",
    localDate: "2026-04-25",
    timerDurationMin: 20,
    elapsedDurationMin: 23,
    distanceKm: 3,
    elevationGainM: null,
    averageHeartRate: null,
  });

  const historyResponse = await fetch(new URL("/api/runner-activities?pageSize=2", baseUrl), {
    headers,
  });
  assert.equal(historyResponse.status, 200);
  const historyBody = await historyResponse.json();
  assert.equal(historyBody.ok, true);
  assert.equal(historyBody.history.items.length, 2);
  assert.ok(historyBody.history.nextCursor);

  const invalidCursor = await fetch(
    new URL("/api/runner-activities?cursor=not-a-cursor", baseUrl),
    { headers },
  );
  assert.equal(invalidCursor.status, 400);
  assert.equal((await invalidCursor.json()).code, "activity_history_request_invalid");

  const progressResponse = await fetch(new URL("/api/runner-activity-progress", baseUrl), {
    headers,
  });
  assert.equal(progressResponse.status, 200);
  const progressBody = await progressResponse.json();
  assert.equal(progressBody.ok, true);
  assert.equal(
    progressBody.progress.rolling28Day.current.formulaVersion,
    "runner_activity_facts_v1",
  );

  const sourceRemoveResponse = await fetch(
    new URL(`/api/runner-activities/${routeSource.receipt.activityId}/source`, baseUrl),
    { method: "DELETE", headers },
  );
  assert.equal(sourceRemoveResponse.status, 200);
  const sourceRemoveBody = await sourceRemoveResponse.json();
  assert.equal(sourceRemoveBody.ok, true);
  assert.equal(sourceRemoveBody.readback.status, "current");
  assert.equal(
    sourceRemoveBody.readback.history.items.find(
      (item: { id: string }) => item.id === routeSource.receipt.activityId,
    )?.source.rawState,
    "removed",
  );

  const deleteResponse = await fetch(
    new URL(`/api/runner-activities/${routeDelete.receipt.activityId}`, baseUrl),
    { method: "DELETE", headers },
  );
  assert.equal(deleteResponse.status, 200);
  const deleteBody = await deleteResponse.json();
  assert.equal(deleteBody.ok, true);
  assert.equal(deleteBody.readback.status, "current");
  assert.equal(
    deleteBody.readback.history.items.some(
      (item: { id: string }) => item.id === routeDelete.receipt.activityId,
    ),
    false,
  );
}

async function proveHistoryPagination(input: {
  userId: string;
  plannedWorkoutId: string;
  longestActivityId: string;
  elapsedOnlyActivityId: string;
}) {
  const first = await listRunnerActivityHistoryForUser({ userId: input.userId, pageSize: 2 });
  assert.equal(first.items.length, 2);
  assert.ok(first.nextCursor);
  const second = await listRunnerActivityHistoryForUser({
    userId: input.userId,
    cursor: first.nextCursor,
    pageSize: 2,
  });
  assert.equal(second.items.length, 2);
  assert.ok(second.nextCursor);
  const third = await listRunnerActivityHistoryForUser({
    userId: input.userId,
    cursor: second.nextCursor,
    pageSize: 2,
  });
  assert.equal(third.items.length, 1);
  assert.equal(third.nextCursor, null);
  const items = [...first.items, ...second.items, ...third.items];
  assert.equal(new Set(items.map((item) => item.id)).size, 5);
  assert.deepEqual(
    items.map((item) => item.historicalTime.localDate),
    [-1, -7, -13, -21, -33].map((days) => addDaysIso(AS_OF_DATE, days)),
  );
  assert.equal(
    items.every((item) => item.identity.label === "Run"),
    true,
  );
  const longest = items.find((item) => item.id === input.longestActivityId);
  assert.equal(longest?.duration?.basis, "timer");
  assert.equal(longest?.pace?.secondsPerKm, 360);
  assert.equal(longest?.observedHeartRate?.averageBpm, 142);
  assert.equal(longest?.plannedWorkout?.id, input.plannedWorkoutId);
  const elapsedOnly = items.find((item) => item.id === input.elapsedOnlyActivityId);
  assert.equal(elapsedOnly?.duration?.basis, "elapsed");
  assert.equal(elapsedOnly?.pace?.basis, "elapsed");
  const serialized = JSON.stringify(items);
  assert.doesNotMatch(serialized, /storage_path|raw_original_file_name|fingerprint|\.fit/i);
  await assert.rejects(
    listRunnerActivityHistoryForUser({ userId: input.userId, cursor: "not-a-cursor" }),
    /cursor is invalid/i,
  );
}

async function proveFactSnapshots(userId: string) {
  const first = await getRunnerActivityProgressFactsForUser({ userId, asOfDate: AS_OF_DATE });
  const current = first.rolling28Day.current;
  assert.deepEqual(current.window, {
    startDate: addDaysIso(AS_OF_DATE, -27),
    endDate: AS_OF_DATE,
    cutoffDate: AS_OF_DATE,
    timezoneBasis: "historical_local_date",
    weekStartsOn: "monday",
  });
  assert.equal(current.facts.sessions.value, 4);
  assert.equal(current.facts.runningTime.value, 110);
  assert.equal(current.facts.runningTime.confidence, "partial");
  assert.equal(current.facts.runningTime.missingActivityCount, 1);
  assert.equal(current.facts.distance.value, 20);
  assert.equal(current.facts.distance.confidence, "partial");
  assert.equal(current.facts.elevationGain.value, 120);
  assert.equal(current.facts.elevationGain.confidence, "partial");
  assert.equal(current.facts.longestDistance.value, 10);
  assert.equal(current.facts.longestDuration.value, 60);
  assert.equal(first.rolling28Day.previous.facts.sessions.value, 1);
  assert.equal(first.interpretation.volumeIsFitness, false);
  assert.equal(first.interpretation.derivedCoachingMetricsAvailable, false);
  assert.equal(first.calendarWeeks.at(-1)?.window.cutoffDate, AS_OF_DATE);

  const repeated = await getRunnerActivityProgressFactsForUser({ userId, asOfDate: AS_OF_DATE });
  assert.equal(repeated.rolling28Day.current.id, current.id);
  assert.deepEqual(
    repeated.calendarWeeks.map((snapshot) => snapshot.id),
    first.calendarWeeks.map((snapshot) => snapshot.id),
  );
  return first;
}

async function proveSnapshotRls(input: {
  ownerRole: keyof typeof QA_TESTER_POOL;
  otherRole: keyof typeof QA_TESTER_POOL;
  snapshotId: string;
}) {
  const ownerClient = await signedInClient(input.ownerRole);
  const ownRead = await ownerClient
    .from("runner_activity_fact_snapshots")
    .select("id")
    .eq("id", input.snapshotId);
  if (ownRead.error) throw new Error(ownRead.error.message);
  assert.equal(ownRead.data.length, 1);
  await ownerClient.auth.signOut();

  const otherClient = await signedInClient(input.otherRole);
  const crossRead = await otherClient
    .from("runner_activity_fact_snapshots")
    .select("id")
    .eq("id", input.snapshotId);
  if (crossRead.error) throw new Error(crossRead.error.message);
  assert.deepEqual(crossRead.data, []);
  const forbiddenRpc = await otherClient.rpc("list_runner_activity_history_page", {
    p_user_id: (await otherClient.auth.getUser()).data.user?.id ?? "",
    p_page_size: 10,
  });
  assert.ok(forbiddenRpc.error);
  await otherClient.auth.signOut();
}

async function persistSyntheticActivity(input: {
  userId: string;
  key: string;
  localDate: string;
  timerDurationMin: number | null;
  elapsedDurationMin: number | null;
  distanceKm: number | null;
  elevationGainM: number | null;
  averageHeartRate: number | null;
  storageSuffix?: string;
}) {
  const fileBuffer = Buffer.from(`gate-2-synthetic-fit:${input.key}`, "utf8");
  const storagePath = `${input.userId}/gate-2/${input.key}-${input.storageSuffix ?? "source"}.fit`;
  const storage = await supabase.storage
    .from(WORKOUT_RESULT_STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, { contentType: "application/octet-stream", upsert: false });
  if (storage.error) throw new Error(storage.error.message);
  const parsedWorkout = syntheticParsedWorkout(input);
  const receipt = await persistGarminFitActivitySource({
    userId: input.userId,
    assetKind: "garmin_fit",
    storageBucket: WORKOUT_RESULT_STORAGE_BUCKET,
    storagePath,
    originalFileName: `${input.key}.fit`,
    mimeType: "application/octet-stream",
    fileSizeBytes: fileBuffer.length,
    fileBuffer,
    parsedWorkout,
  });
  return { receipt, fileBuffer };
}

function syntheticParsedWorkout(input: {
  localDate: string;
  timerDurationMin: number | null;
  elapsedDurationMin: number | null;
  distanceKm: number | null;
  elevationGainM: number | null;
  averageHeartRate: number | null;
}): ParsedGarminWorkout {
  return {
    sourceKind: "garmin_fit",
    activityStartAt: `${input.localDate}T08:00:00Z`,
    activityLocalDate: input.localDate,
    totalDistanceKm: input.distanceKm,
    totalTimerDurationMin: input.timerDurationMin,
    totalElapsedDurationMin: input.elapsedDurationMin,
    totalDurationMin: input.timerDurationMin ?? input.elapsedDurationMin,
    avgHeartRate: input.averageHeartRate,
    maxHeartRate: input.averageHeartRate == null ? null : input.averageHeartRate + 12,
    avgPower: null,
    maxPower: null,
    totalCalories: null,
    totalAscentM: input.elevationGainM,
    totalDescentM: null,
    avgCadence: null,
    avgTemperatureC: null,
    gpsPointCount: 0,
    lapCount: 0,
    workoutName: null,
    actualIntervalCount: null,
    actualStepPayload: [],
    lapPayload: [],
    summaryPayload: { fixture_class: "sanitized_gate_2" },
  };
}

async function createPlannedWorkout(userId: string) {
  const planCycleId = randomUUID();
  const plannedWorkoutId = randomUUID();
  const plan = await supabase.from("plan_cycles").insert({
    id: planCycleId,
    user_id: userId,
    status: "active",
    title: "Gate 2 read model proof",
    goal_summary: "Local factual read model proof",
    source_template: "qa_activity_gate_2",
    start_date: addDaysIso(AS_OF_DATE, -1),
    end_date: AS_OF_DATE,
  });
  if (plan.error) throw new Error(plan.error.message);
  const workout = await supabase.from("planned_workouts").insert({
    id: plannedWorkoutId,
    user_id: userId,
    plan_cycle_id: planCycleId,
    workout_date: addDaysIso(AS_OF_DATE, -1),
    weekday: weekdayLong(addDaysIso(AS_OF_DATE, -1)),
    week_number: 1,
    phase: "Proof",
    workout_type: "easy",
    title: "Planned easy run",
    steps: [],
    display_order: 0,
  });
  if (workout.error) throw new Error(workout.error.message);
  return plannedWorkoutId;
}

async function ensurePoolUser(role: keyof typeof QA_TESTER_POOL) {
  const password = `gate2-${role}-local-password`;
  const user = await ensureQaPoolAuthUser({ supabase, role, password });
  await assertQaPoolAuthUser({ supabase, role, userId: user.id });
  return user;
}

async function signedInClient(role: keyof typeof QA_TESTER_POOL) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({
    email: QA_TESTER_POOL[role].email,
    password: `gate2-${role}-local-password`,
  });
  if (signIn.error) throw new Error(signIn.error.message);
  return client;
}

await main();
