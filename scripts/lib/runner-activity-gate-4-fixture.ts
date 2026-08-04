import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createRunnerActivityPlannedWorkoutMatch,
  persistGarminFitActivitySource,
} from "../../src/lib/runner-activity/garmin-fit-source";
import { addDaysIso, weekdayLong } from "../../src/lib/training";
import type { ParsedGarminWorkout } from "../../src/lib/workout-result-import/types";
import { WORKOUT_RESULT_STORAGE_BUCKET } from "../../src/lib/workout-result-import/types";

export type Gate4SyntheticActivity = Awaited<ReturnType<typeof persistGate4SyntheticActivity>>;

export async function markRunnerActivitySourceRemovalPendingForFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  sourceRevisionId: string;
}) {
  const pending = await input.supabase
    .from("runner_activity_source_revisions")
    .update({ raw_state: "removal_pending" })
    .eq("user_id", input.userId)
    .eq("id", input.sourceRevisionId)
    .eq("raw_state", "available")
    .select("id, raw_state, raw_storage_bucket, raw_storage_path")
    .single();
  if (pending.error) throw new Error(pending.error.message);
  assert.equal(pending.data.raw_state, "removal_pending");
  assert.ok(pending.data.raw_storage_bucket);
  assert.ok(pending.data.raw_storage_path);
  return pending.data;
}

export async function createGate4LifecycleFixtures(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate: string;
}) {
  const planCycleId = await createPlan(input);
  const completed = await createMatchedActivity({
    ...input,
    planCycleId,
    key: "completed-42-rpe-4",
    localDate: addDaysIso(input.asOfDate, -1),
    timerDurationMin: 42,
    elapsedDurationMin: 44,
    distanceKm: 5,
    plannedDurationMin: 42,
    outcome: "completed",
    rpe: 4,
  });
  const partial = await createMatchedActivity({
    ...input,
    planCycleId,
    key: "partial-28-rpe-7",
    localDate: addDaysIso(input.asOfDate, -2),
    timerDurationMin: 28,
    elapsedDurationMin: 31,
    distanceKm: 3,
    plannedDurationMin: 50,
    outcome: "partial",
    rpe: 7,
  });
  const planned60Observed38 = await createMatchedActivity({
    ...input,
    planCycleId,
    key: "planned-60-observed-38-rpe-5",
    localDate: addDaysIso(input.asOfDate, -3),
    timerDurationMin: 38,
    elapsedDurationMin: 41,
    distanceKm: 10,
    plannedDurationMin: 60,
    outcome: "completed",
    rpe: 5,
  });
  const elapsedOnly = await createMatchedActivity({
    ...input,
    planCycleId,
    key: "elapsed-only-rpe-3",
    localDate: addDaysIso(input.asOfDate, -4),
    timerDurationMin: null,
    elapsedDurationMin: 40,
    distanceKm: 4,
    plannedDurationMin: 45,
    outcome: "completed",
    rpe: 3,
  });
  const unplanned = await persistGate4SyntheticActivity({
    ...input,
    key: "direct-rpe-unplanned",
    localDate: addDaysIso(input.asOfDate, -5),
    timerDurationMin: 70,
    elapsedDurationMin: 75,
    distanceKm: 12,
  });
  const half = await persistGate4SyntheticActivity({
    ...input,
    key: "exact-half",
    localDate: addDaysIso(input.asOfDate, -6),
    timerDurationMin: 95,
    elapsedDurationMin: 95,
    distanceKm: 21.0975,
  });
  const exactFive = await persistGate4SyntheticActivity({
    ...input,
    key: "exact-five-delete",
    localDate: addDaysIso(input.asOfDate, -7),
    timerDurationMin: 30,
    elapsedDurationMin: 30,
    distanceKm: 5,
  });
  await createSkippedWorkout({ ...input, planCycleId });
  return {
    planCycleId,
    completed,
    partial,
    planned60Observed38,
    elapsedOnly,
    unplanned,
    half,
    exactFive,
  };
}

export async function persistGate4SyntheticActivity(input: {
  supabase: SupabaseClient;
  userId: string;
  key: string;
  localDate: string;
  timerDurationMin: number | null;
  elapsedDurationMin: number;
  distanceKm: number;
  runningContext?: "road" | "track" | "treadmill" | "trail_mountain" | null;
  storageSuffix?: string;
}) {
  const fileBuffer = Buffer.from(`gate-4-synthetic-fit:${input.key}`, "utf8");
  const storagePath = `${input.userId}/gate-4/${input.key}-${input.storageSuffix ?? "source"}.fit`;
  const stored = await input.supabase.storage
    .from(WORKOUT_RESULT_STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "application/octet-stream",
      upsert: true,
    });
  if (stored.error) throw new Error(stored.error.message);
  const parsed = syntheticParsedWorkout(input);
  const receipt = await persistGarminFitActivitySource({
    userId: input.userId,
    assetKind: "garmin_fit",
    storageBucket: WORKOUT_RESULT_STORAGE_BUCKET,
    storagePath,
    originalFileName: `${input.key}.fit`,
    mimeType: "application/octet-stream",
    fileSizeBytes: fileBuffer.length,
    fileBuffer,
    parsedWorkout: parsed,
  });
  return {
    receipt,
    parsed,
    input: {
      userId: input.userId,
      key: input.key,
      localDate: input.localDate,
      timerDurationMin: input.timerDurationMin,
      elapsedDurationMin: input.elapsedDurationMin,
      distanceKm: input.distanceKm,
      runningContext: input.runningContext ?? null,
    },
    fileBuffer,
  };
}

async function createMatchedActivity(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate: string;
  planCycleId: string;
  key: string;
  localDate: string;
  timerDurationMin: number | null;
  elapsedDurationMin: number;
  distanceKm: number;
  plannedDurationMin: number;
  outcome: "completed" | "partial";
  rpe: number;
}) {
  const activity = await persistGate4SyntheticActivity(input);
  const plannedWorkoutId = await createPlannedWorkout(input);
  await createRunnerActivityPlannedWorkoutMatch({
    userId: input.userId,
    activityId: activity.receipt.activityId,
    sourceRevisionId: activity.receipt.sourceRevisionId,
    plannedWorkoutId,
  });
  const log = await input.supabase.from("workout_logs").insert({
    user_id: input.userId,
    planned_workout_id: plannedWorkoutId,
    outcome: input.outcome,
    rpe: input.rpe,
    actual_duration_min: input.plannedDurationMin,
  });
  if (log.error) throw new Error(log.error.message);
  return { ...activity, plannedWorkoutId };
}

async function createSkippedWorkout(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate: string;
  planCycleId: string;
}) {
  const plannedWorkoutId = await createPlannedWorkout({
    ...input,
    localDate: input.asOfDate,
    key: "skipped-no-activity",
    plannedDurationMin: 30,
  });
  const log = await input.supabase.from("workout_logs").insert({
    user_id: input.userId,
    planned_workout_id: plannedWorkoutId,
    outcome: "skipped",
    rpe: null,
    actual_duration_min: null,
  });
  if (log.error) throw new Error(log.error.message);
  const activities = await input.supabase
    .from("runner_activity_planned_workout_matches")
    .select("id")
    .eq("user_id", input.userId)
    .eq("planned_workout_id", plannedWorkoutId);
  if (activities.error) throw new Error(activities.error.message);
  assert.deepEqual(activities.data, []);
}

async function createPlan(input: { supabase: SupabaseClient; userId: string; asOfDate: string }) {
  const id = randomUUID();
  const result = await input.supabase.from("plan_cycles").insert({
    id,
    user_id: input.userId,
    status: "active",
    title: "Runner activity Gate 4 proof",
    goal_summary: "Local immutable metric evidence proof",
    source_template: "qa_activity_gate_4",
    start_date: addDaysIso(input.asOfDate, -14),
    end_date: input.asOfDate,
  });
  if (result.error) throw new Error(result.error.message);
  return id;
}

async function createPlannedWorkout(input: {
  supabase: SupabaseClient;
  userId: string;
  planCycleId: string;
  localDate: string;
  key: string;
  plannedDurationMin: number;
}) {
  const id = randomUUID();
  const result = await input.supabase.from("planned_workouts").insert({
    id,
    user_id: input.userId,
    plan_cycle_id: input.planCycleId,
    workout_date: input.localDate,
    weekday: weekdayLong(input.localDate),
    week_number: 1,
    phase: "Gate 4 proof",
    workout_type: "easy",
    title: input.key,
    steps: [],
    display_order: 0,
  });
  if (result.error) throw new Error(result.error.message);
  return id;
}

function syntheticParsedWorkout(input: {
  localDate: string;
  timerDurationMin: number | null;
  elapsedDurationMin: number;
  distanceKm: number;
  runningContext?: "road" | "track" | "treadmill" | "trail_mountain" | null;
}): ParsedGarminWorkout {
  return {
    sourceKind: "garmin_fit",
    activityStartAt: `${input.localDate}T08:00:00Z`,
    activityLocalDate: input.localDate,
    totalDistanceKm: input.distanceKm,
    totalTimerDurationMin: input.timerDurationMin,
    totalElapsedDurationMin: input.elapsedDurationMin,
    totalDurationMin: input.timerDurationMin ?? input.elapsedDurationMin,
    avgHeartRate: null,
    maxHeartRate: null,
    avgPower: null,
    maxPower: null,
    totalCalories: null,
    totalAscentM: null,
    totalDescentM: null,
    avgCadence: null,
    avgTemperatureC: null,
    gpsPointCount: 0,
    lapCount: 0,
    workoutName: null,
    actualIntervalCount: null,
    actualStepPayload: [],
    lapPayload: [],
    summaryPayload: {
      fixture_class: "sanitized_gate_4",
      session: { subSport: garminSubSportForContext(input.runningContext ?? null) },
    },
  };
}

function garminSubSportForContext(
  context: "road" | "track" | "treadmill" | "trail_mountain" | null,
) {
  switch (context) {
    case "road":
      return "street";
    case "track":
      return "track";
    case "treadmill":
      return "treadmill";
    case "trail_mountain":
      return "trail";
    default:
      return "generic";
  }
}
