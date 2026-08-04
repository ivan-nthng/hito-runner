import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { backfillWorkoutResultActivities } from "../src/lib/runner-activity/backfill-workout-result-activities";
import { deleteRunnerActivityFromHistory } from "../src/lib/runner-activity/garmin-fit-source";
import {
  ingestGarminWorkoutResult,
  removeWorkoutResultEvidence,
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

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Local Supabase URL and service role key are required for the activity foundation proof.",
  );
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

async function main() {
  const plannedUser = await ensurePoolUser("provider-engine");
  const unplannedUser = await ensurePoolUser("baseline-no-plan");
  await resetQaPoolUserData({ supabase, userId: plannedUser.id });
  await resetQaPoolUserData({ supabase, userId: unplannedUser.id });

  try {
    await proveUnplannedLifecycle({
      userId: unplannedUser.id,
      otherUserRole: "provider-engine",
    });
    await provePlannedProjectionAndBackfill(plannedUser.id);
  } finally {
    await resetQaPoolUserData({ supabase, userId: plannedUser.id });
    await resetQaPoolUserData({ supabase, userId: unplannedUser.id });
  }

  const [plannedCounts, unplannedCounts] = await Promise.all([
    getQaUserOwnedCounts(supabase, plannedUser.id),
    getQaUserOwnedCounts(supabase, unplannedUser.id),
  ]);
  assert.equal(plannedCounts.runner_activities, 0);
  assert.equal(unplannedCounts.runner_activities, 0);
  const globalBackfill = await backfillWorkoutResultActivities();
  assert.deepEqual(globalBackfill.linkedAssetIds, []);
  console.log("Runner activity foundation contract passed.");
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

async function provePlannedProjectionAndBackfill(userId: string) {
  const fixture = await readFitFixture();
  const [firstWorkoutId, secondWorkoutId, thirdWorkoutId] = await createProofWorkouts(userId);
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

  const parsed = await parseGarminFitActivity(fixture);
  const legacyAssetId = await insertLegacyAsset({
    userId,
    plannedWorkoutId: secondWorkoutId,
    fixture,
    parsed,
  });

  const firstBackfill = await backfillWorkoutResultActivities({ userId });
  assert.deepEqual(firstBackfill.linkedAssetIds, [legacyAssetId]);
  const secondBackfill = await backfillWorkoutResultActivities({ userId });
  assert.deepEqual(secondBackfill.linkedAssetIds, []);

  const conflictingAssetId = await insertLegacyAsset({
    userId,
    plannedWorkoutId: thirdWorkoutId,
    fixture,
    parsed,
  });
  const conflictingBackfill = await backfillWorkoutResultActivities({ userId });
  assert.deepEqual(conflictingBackfill.linkedAssetIds, []);
  assert.deepEqual(conflictingBackfill.skippedAssetIds, [conflictingAssetId]);

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
  assert.equal(sourceRevisionIds.length, 2);

  await removeWorkoutResultEvidence({ userId, plannedWorkoutId: secondWorkoutId });
  const rawStates = await supabase
    .from("runner_activity_source_revisions")
    .select("raw_state")
    .eq("user_id", userId)
    .in("id", sourceRevisionIds);
  if (rawStates.error) throw new Error(rawStates.error.message);
  assert.deepEqual(rawStates.data?.map((row) => row.raw_state).sort(), ["removed", "removed"]);
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

async function insertLegacyAsset(input: {
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
