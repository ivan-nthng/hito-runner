import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
  AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
  AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  buildAiGeneratedRunningPlanQaFixtureAuthoringInput,
} from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { buildReviewedAiGeneratedRunningPlanPreviewForUser } from "../../src/lib/running-plan-engine-actions";
import { materializeFirstReviewedPlanForUser } from "../../src/lib/active-plan-persistence";
import { buildRunningPlanPersistenceMetadata } from "../../src/lib/running-plan-engine-review";
import { DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE } from "../../src/lib/local-auth-account-registry.server";
import {
  persistGarminFitActivitySource,
  readRunnerActivityProjection,
  removeRunnerActivityOriginalFilesForActivity,
} from "../../src/lib/runner-activity/garmin-fit-source";
import { recordRunnerActivitySessionRpeForUser } from "../../src/lib/runner-activity/activity-evidence";
import { listRunnerActivityHistoryForUser } from "../../src/lib/runner-activity/history-read-model";
import { getRunnerActivityProgressForUser } from "../../src/lib/runner-activity/read-model";
import { getPersistedSnapshot } from "../../src/lib/training-api";
import { addDaysIso, diffDaysIso, startOfWeekIso, todayIso } from "../../src/lib/training";
import { isLoopbackRuntimeUrl } from "../../src/lib/supabase/env";
import {
  buildFirstTimeRunnerBaselineReadback,
  updateUserSettingsForUserId,
} from "../../src/lib/user-settings-actions";
import { parseGarminFitActivity } from "../../src/lib/workout-result-import/parse-garmin-fit";
import { reconcileWorkoutResultProjection } from "../../src/lib/workout-result-import/planned-workout-projection";
import { getFitCompletedPlannedWorkoutIds } from "../../src/lib/workout-result-import/read-workout-result-feedback";
import { WORKOUT_RESULT_STORAGE_BUCKET } from "../../src/lib/workout-result-import/types";
import { markRunnerActivitySourceRemovalPendingForFixture } from "./runner-activity-gate-4-fixture";
import { loginToLoopbackRuntime } from "./runner-activity-proof-runtime";

export const RUNNER_DESIGN_PROFILE_FIXTURE_VERSION = "runner_design_profile_v1" as const;
export const RUNNER_DESIGN_PROFILE_FIXTURE_ROLE = "saved-plan-readback" as const;
export const RUNNER_DESIGN_PROFILE_FIXTURE_STORAGE_BUCKET = WORKOUT_RESULT_STORAGE_BUCKET;

type FixtureActivitySpec = {
  key: string;
  daysAgo: number;
  title: string;
  timerDurationMin: number | null;
  elapsedDurationMin: number;
  distanceKm: number | null;
  averageHeartRate: number | null;
  elevationGainM: number | null;
  planned: boolean;
  sourceState: "available" | "removal_pending" | "removed";
  sessionRpe: number | null;
  runningContext: "track" | null;
};

type FixtureSeedReceipt = {
  activityId: string;
  activityRevisionId: string;
  sourceRevisionId: string;
  key: string;
};

const AS_OF_DATE_SCHEMA = z.string().date();
const MIN_MATCHED_ACTIVITY_COUNT = 11;

const ACTIVITY_SPECS = Object.freeze<FixtureActivitySpec[]>([
  activity("w8-recovery", 55, "Recovery run", 30, 32, 4.8, 134, 18, true),
  activity("w8-easy", 53, "Easy run", 42, 44, 7, 142, 30, true),
  activity("w8-long", 51, "Long run", 70, 74, 11.2, 140, 55, true),
  activity("w8-unplanned", 49, "Unplanned run", 28, 31, 4.4, null, null, false),
  activity("w7-recovery", 47, "Recovery run", 35, 37, 5.6, 136, 20, true),
  activity("w7-steady", 45, "Steady run", 45, 48, 7.4, 144, 34, true),
  activity("w7-long", 43, "Long run", 75, 79, 12, 141, 62, true, "removed"),
  activity("w7-unplanned", 41, "Unplanned run", 30, 33, 4.7, null, 16, false),
  activity("w6-easy", 39, "Easy run", 38, 40, 6.2, 137, null, true),
  activity("w6-steady", 37, "Steady run", 48, 51, 8, 145, 38, true),
  activity("w6-long", 35, "Long run", 80, 84, 13, 142, 70, true),
  activity(
    "w6-unplanned",
    33,
    "Unplanned run",
    32,
    35,
    5,
    null,
    18,
    false,
    "available",
    null,
    "track",
  ),
  activity("w5-easy", 31, "Easy run", 40, 42, 6.5, 138, 24, true),
  activity("w5-steady", 29, "Steady run", 50, 53, 8.3, 146, 40, true),
  activity("w5-long", 28, "Long run", 85, 89, 13.8, 143, 74, true),
  activity("w4-unplanned", 27, "Unplanned run", 30, 33, 4.8, 135, 18, false),
  activity("w4-easy", 25, "Easy run", 42, 44, 7, 142, 28, true),
  activity("w4-long", 23, "Long run", 88, 92, 14.2, 142, 80, true),
  activity("w4-recovery", 21, "Recovery run", 28, 31, 4.5, null, null, true),
  activity("w3-unplanned", 19, "Unplanned run", 36, 39, 5.8, 137, 22, false),
  activity("w3-steady", 17, "Steady run", 46, 49, 7.6, 145, 36, true),
  activity("w3-long", 15, "Long run", 90, 95, 14.8, 143, 84, true),
  activity("w3-recovery", 13, "Recovery run", 32, 35, 5.1, null, 18, true),
  activity("w2-unplanned", 11, "Unplanned run", null, 40, 6.2, 138, 24, false),
  activity("w2-steady", 9, "Steady run", 50, 53, 8.4, 146, 42, true),
  activity("w2-long", 7, "Long run", 95, 100, 15.5, 144, null, true, "removed"),
  activity("w2-recovery", 5, "Recovery run", 34, 37, 5.4, null, 20, true, "removal_pending"),
  activity("w1-unplanned", 4, "Unplanned run", 40, 43, null, 139, 28, false),
  activity("w1-steady", 2, "Steady run", 52, 55, 8.8, 147, 44, true),
  activity("w1-long", 0, "Long run", 100, 105, 16.2, 145, 96, true, "available", 5),
]);

export async function createRunnerDesignProfilePlan(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const authoringInput = buildAiGeneratedRunningPlanQaFixtureAuthoringInput(asOfDate);
  const baseline = buildFirstTimeRunnerBaselineReadback({
    age: 36,
    weightKg: 72,
    heightCm: 178,
    fitnessLevel: "running_regularly",
  });
  await updateUserSettingsForUserId(input.userId, {
    firstName: "QA",
    lastName: "Runner",
    displayName: "QA Saved Plan",
    age: baseline.age,
    weightKg: baseline.weightKg,
    heightCm: baseline.heightCm,
    fitnessLevel: baseline.fitnessLevel!,
    calendarTimezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
    heartRateProfile: {
      zones: baseline.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
    },
  });

  let providerDispatchCount = 0;
  const reviewed = await withLocalDesignFixtureEnv(async () =>
    buildReviewedAiGeneratedRunningPlanPreviewForUser(
      input.userId,
      {
        age: 36,
        heightCm: 178,
        weightKg: 72,
        runnerLevel: "runs_a_lot",
        daysPerWeek: 4,
        fixedRestDays: ["Wednesday", "Friday", "Sunday"],
        preferredLongRunDay: "Saturday",
        startDate: authoringInput.schedule.startDate,
        benchmark: { kind: "recent_5k_pace", recent5kPace: "5:30" },
        runnerComment: undefined,
        planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
      },
      {
        qaFixtureAuthorized: true,
        aiPreview: {
          apiKey: "local-design-profile-provider-tripwire",
          model: "local-design-profile-provider-tripwire",
          fetchImpl: async () => {
            providerDispatchCount += 1;
            throw new Error("Runner design profile reached a paid provider transport.");
          },
          generationLedger: { disabled: true },
        },
      },
    ),
  );
  assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
  if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
  assert.equal(reviewed.draft.callsOpenAi, false);
  assert.equal(reviewed.draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
  assert.equal(
    reviewed.draft.aiGeneration.responseId,
    AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  );
  assert.equal(providerDispatchCount, 0);

  assert.ok(reviewed.savedPlanId, "The fixture candidate must be retained before materialization.");
  const historicalMaterializationInstant = new Date(
    `${reviewed.draft.canonicalPlan.start_date}T12:00:00`,
  );
  const materialized = await materializeFirstReviewedPlanForUser(
    input.userId,
    reviewed.draft.canonicalPlan,
    buildRunningPlanPersistenceMetadata({
      draft: reviewed.draft,
      canonicalPlan: reviewed.draft.canonicalPlan,
      reviewChecksum: reviewed.draft.reviewChecksum,
    }),
    { calendarInstant: historicalMaterializationInstant },
  );
  assert.equal(materialized.ok, true);
  assert.equal(providerDispatchCount, 0);

  const materializedPlan = await input.supabase
    .from("plan_cycles")
    .select("id, start_date, end_date, goal_metadata")
    .eq("user_id", input.userId)
    .eq("status", "archived")
    .is("saved_plan_payload", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (materializedPlan.error) throw new Error(materializedPlan.error.message);
  const workouts = await input.supabase
    .from("planned_workouts")
    .select("id, workout_date, workout_type, source_workout_type, title, steps")
    .eq("user_id", input.userId)
    .eq("plan_cycle_id", materializedPlan.data.id)
    .order("workout_date", { ascending: true });
  if (workouts.error) throw new Error(workouts.error.message);

  return {
    planId: materializedPlan.data.id,
    startDate: materializedPlan.data.start_date,
    endDate: materializedPlan.data.end_date,
    reviewChecksum: reviewed.draft.reviewChecksum,
    canonicalRowCount: reviewed.draft.canonicalRowCount,
    providerDispatchCount,
    workouts: workouts.data,
  };
}

export async function seedRunnerDesignProfileFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const planReceipt = await createRunnerDesignProfilePlan({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate,
  });
  const plannedWorkoutByDate = new Map(
    planReceipt.workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => [workout.workout_date, workout]),
  );
  const activityDateByKey = buildFixtureActivityDateByKey({
    asOfDate,
    plannedWorkoutDates: plannedWorkoutByDate.keys(),
  });

  const receipts: FixtureSeedReceipt[] = [];
  for (const spec of ACTIVITY_SPECS) {
    const localDate = requireFixtureActivityDate(activityDateByKey, spec.key);
    const fileBuffer = buildFixtureSource(spec, localDate);
    const storagePath = `${input.userId}/${RUNNER_DESIGN_PROFILE_FIXTURE_VERSION}/${spec.key}.fit`;
    const plannedWorkout = spec.planned ? (plannedWorkoutByDate.get(localDate) ?? null) : null;
    const assetId = randomUUID();
    const stored = await input.supabase.storage
      .from(WORKOUT_RESULT_STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: "application/octet-stream",
        upsert: true,
      });
    if (stored.error) throw new Error(stored.error.message);

    const asset = await input.supabase
      .from("workout_result_assets")
      .insert({
        id: assetId,
        user_id: input.userId,
        planned_workout_id: plannedWorkout?.id ?? null,
        asset_kind: "garmin_fit",
        storage_bucket: WORKOUT_RESULT_STORAGE_BUCKET,
        storage_path: storagePath,
        original_file_name: `${spec.key}.fit`,
        mime_type: "application/octet-stream",
        file_size_bytes: fileBuffer.length,
        parse_status: "uploaded",
      })
      .select("id")
      .single();
    if (asset.error) {
      await input.supabase.storage.from(WORKOUT_RESULT_STORAGE_BUCKET).remove([storagePath]);
      throw new Error(asset.error.message);
    }

    let receipt;
    try {
      const parsedWorkout = await parseGarminFitActivity(fileBuffer);
      assertParsedFixtureSource(parsedWorkout, spec, localDate);
      receipt = await persistGarminFitActivitySource({
        userId: input.userId,
        assetKind: "garmin_fit",
        storageBucket: WORKOUT_RESULT_STORAGE_BUCKET,
        storagePath,
        originalFileName: `${spec.key}.fit`,
        mimeType: "application/octet-stream",
        fileSizeBytes: fileBuffer.length,
        fileBuffer,
        parsedWorkout,
        sourceCapabilities: {
          fixture_class: RUNNER_DESIGN_PROFILE_FIXTURE_VERSION,
          generated_local_qa_fit: true,
          reprocessable: true,
          normalized_samples_persisted: false,
        },
      });
      const activityProjection = await readRunnerActivityProjection({
        userId: input.userId,
        activityId: receipt.activityId,
        activityRevisionId: receipt.activityRevisionId,
      });
      await reconcileWorkoutResultProjection({
        userId: input.userId,
        plannedWorkout,
        workoutLogId: null,
        activitySource: receipt,
        activityProjection,
        candidateAssetId: assetId,
        candidateStoragePath: storagePath,
        primaryFile: {
          primaryFileKind: "fit",
          primaryFileName: `${spec.key}.fit`,
          fileBuffer,
        },
        initialParseStatus: "uploaded",
      });
    } catch (error) {
      await input.supabase.storage.from(WORKOUT_RESULT_STORAGE_BUCKET).remove([storagePath]);
      throw error;
    }
    receipts.push({
      activityId: receipt.activityId,
      activityRevisionId: receipt.activityRevisionId,
      sourceRevisionId: receipt.sourceRevisionId,
      key: spec.key,
    });
  }

  for (const spec of ACTIVITY_SPECS.filter((candidate) => candidate.sessionRpe != null)) {
    const receipt = receipts.find((candidate) => candidate.key === spec.key);
    if (!receipt || spec.sessionRpe == null) {
      throw new Error(`Missing fixture RPE receipt for ${spec.key}.`);
    }
    await recordRunnerActivitySessionRpeForUser(input.userId, {
      activityId: receipt.activityId,
      activityRevisionId: receipt.activityRevisionId,
      rpe: spec.sessionRpe,
      outcome: "completed",
    });
  }

  for (const spec of ACTIVITY_SPECS.filter(
    (candidate) => candidate.sourceState === "removal_pending",
  )) {
    const receipt = receipts.find((candidate) => candidate.key === spec.key);
    if (!receipt) throw new Error(`Missing fixture receipt for ${spec.key}.`);
    await markRunnerActivitySourceRemovalPendingForFixture({
      supabase: input.supabase,
      userId: input.userId,
      sourceRevisionId: receipt.sourceRevisionId,
    });
  }

  for (const spec of ACTIVITY_SPECS.filter((candidate) => candidate.sourceState === "removed")) {
    const receipt = receipts.find((candidate) => candidate.key === spec.key);
    if (!receipt) throw new Error(`Missing fixture receipt for ${spec.key}.`);
    await removeRunnerActivityOriginalFilesForActivity({
      userId: input.userId,
      activityId: receipt.activityId,
    });
  }

  return readRunnerDesignProfileFixture({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate,
  });
}

export async function readRunnerDesignProfileFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const pages = [];
  let cursor: string | null = null;
  do {
    const page = await listRunnerActivityHistoryForUser({
      userId: input.userId,
      cursor,
    });
    pages.push(page);
    cursor = page.nextCursor;
  } while (cursor);

  const items = pages.flatMap((page) => page.items);
  const progress = await getRunnerActivityProgressForUser({
    userId: input.userId,
    asOfDate,
  });
  const sourceRevisions = await input.supabase
    .from("runner_activity_source_revisions")
    .select("raw_state, raw_storage_bucket, raw_storage_path, normalizer_version, capabilities")
    .eq("user_id", input.userId);
  if (sourceRevisions.error) throw new Error(sourceRevisions.error.message);
  const planCycles = await input.supabase
    .from("plan_cycles")
    .select(
      "id, status, source_template, source_kind, start_date, end_date, goal_metadata, saved_plan_payload",
    )
    .eq("user_id", input.userId);
  if (planCycles.error) throw new Error(planCycles.error.message);
  const materializedPlans = planCycles.data.filter((plan) => plan.saved_plan_payload === null);
  assert.equal(
    materializedPlans.length,
    1,
    "The design profile requires exactly one materialized Calendar provenance record.",
  );
  assert.equal(
    planCycles.data.filter((plan) => plan.status === "active").length,
    0,
    "The design profile must not restore active-plan authority.",
  );
  const materializedPlan = materializedPlans[0]!;
  const plannedWorkouts = await input.supabase
    .from("planned_workouts")
    .select("id, workout_date, workout_type, workout_family, workout_identity, steps")
    .eq("user_id", input.userId)
    .eq("plan_cycle_id", materializedPlan.id)
    .order("workout_date", { ascending: true });
  if (plannedWorkouts.error) throw new Error(plannedWorkouts.error.message);

  const activityDateByKey = buildFixtureActivityDateByKey({
    asOfDate,
    plannedWorkoutDates: plannedWorkouts.data
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.workout_date),
  });
  const expected = expectedFixtureSummary(asOfDate, activityDateByKey);
  const matchedWorkoutIds = new Set(
    items.flatMap((item) => (item.plannedWorkout ? [item.plannedWorkout.id] : [])),
  );
  const fitCompletedWorkoutIds = await getFitCompletedPlannedWorkoutIds({
    userId: input.userId,
    plannedWorkoutIds: plannedWorkouts.data.map((workout) => workout.id),
  });
  const actual = {
    activityCount: items.length,
    pageItemCounts: pages.map((page) => page.items.length),
    uniqueActivityCount: new Set(items.map((item) => item.id)).size,
    firstDate: items.at(-1)?.historicalTime.localDate ?? null,
    lastDate: items.at(0)?.historicalTime.localDate ?? null,
    mondayWeekCount: new Set(
      items.flatMap((item) =>
        item.historicalTime.localDate ? [startOfWeekIso(item.historicalTime.localDate)] : [],
      ),
    ).size,
    plannedCount: items.filter((item) => item.plannedWorkout).length,
    unplannedCount: items.filter((item) => !item.plannedWorkout).length,
    elapsedDurationCount: items.filter((item) => item.duration?.basis === "elapsed").length,
    missingDistanceCount: items.filter((item) => item.distanceKm == null).length,
    missingHeartRateCount: items.filter((item) => item.observedHeartRate == null).length,
    sourceRemovedCount: items.filter((item) => item.source.rawState === "removed").length,
    sourceRemovalPendingCount: items.filter((item) => item.source.rawState === "removal_pending")
      .length,
    sourceAvailableCount: items.filter((item) => item.source.rawState === "available").length,
  };
  assert.deepEqual(actual, expected.history);
  assert.equal(actual.plannedCount, MIN_MATCHED_ACTIVITY_COUNT);
  assert.equal(actual.unplannedCount, ACTIVITY_SPECS.length - MIN_MATCHED_ACTIVITY_COUNT);
  assert.equal(matchedWorkoutIds.size, MIN_MATCHED_ACTIVITY_COUNT);
  assert.equal(plannedWorkouts.data.length, 55);
  assert.deepEqual([...fitCompletedWorkoutIds].sort(), [...matchedWorkoutIds].sort());
  const retryableRemoval = items.find((item) => item.source.rawState === "removal_pending");
  assert.ok(retryableRemoval);
  assert.equal(retryableRemoval.source.originalRetained, false);
  assert.equal(retryableRemoval.source.reprocessingAvailable, false);
  assert.equal(retryableRemoval.quality.updating, false);
  assert.equal(retryableRemoval.capabilities.canRemoveOriginalFile, true);
  assert.equal(materializedPlan.source_kind, "ai_authored_plan_first_v1");
  assert.equal(
    readFixtureResponseId(materializedPlan.goal_metadata),
    AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  );
  assert.ok(materializedPlan.start_date < asOfDate);
  assert.ok(materializedPlan.end_date > asOfDate);
  const workoutTypes = new Set(plannedWorkouts.data.map((workout) => workout.workout_type));
  const workoutFamilies = new Set(
    plannedWorkouts.data.flatMap((workout) =>
      workout.workout_family ? [workout.workout_family] : [],
    ),
  );
  const workoutIdentities = new Set(
    plannedWorkouts.data.flatMap((workout) =>
      workout.workout_identity ? [workout.workout_identity] : [],
    ),
  );
  for (const expectedType of ["rest", "easy", "quality", "long_run"]) {
    assert.ok(
      workoutTypes.has(expectedType),
      `Missing design-profile workout type ${expectedType}.`,
    );
  }
  for (const expectedFamily of [
    "rest",
    "easy",
    "recovery",
    "intervals",
    "tempo",
    "hills",
    "long",
  ]) {
    assert.ok(
      workoutFamilies.has(expectedFamily),
      `Missing design-profile workout family ${expectedFamily}.`,
    );
  }
  for (const expectedIdentity of [
    "easy_run_with_strides",
    "distance_intervals",
    "uphill_repeats",
    "long_aerobic_run",
  ]) {
    assert.ok(
      workoutIdentities.has(expectedIdentity),
      `Missing design-profile workout identity ${expectedIdentity}.`,
    );
  }
  assert.ok(plannedWorkouts.data.some((workout) => workout.workout_date < asOfDate));
  assert.ok(plannedWorkouts.data.some((workout) => workout.workout_date > asOfDate));
  const persistedSnapshot = await getPersistedSnapshot(input.userId);
  assert.equal(persistedSnapshot.planMeta?.id, materializedPlan.id);
  assert.equal(persistedSnapshot.workouts.length, plannedWorkouts.data.length);
  for (const workout of persistedSnapshot.workouts) {
    if (matchedWorkoutIds.has(workout.id)) {
      assert.equal(workout.status, "completed");
      assert.equal(workout.completionOrigin, "fit_activity");
      assert.equal(workout.feedbackMarker?.state, "feedback_ready");
      continue;
    }
    assert.notEqual(workout.completionOrigin, "fit_activity");
    if (workout.date > asOfDate) assert.notEqual(workout.status, "completed");
  }
  assert.equal(
    plannedWorkouts.data
      .filter((workout) => workout.workout_type !== "rest")
      .every((workout) => Array.isArray(workout.steps) && workout.steps.length > 0),
    true,
  );
  assert.equal(sourceRevisions.data.length, ACTIVITY_SPECS.length);
  assert.equal(
    sourceRevisions.data.every(
      (revision) =>
        revision.normalizer_version === "garmin_fit_activity_v1" &&
        isFixtureCapabilities(revision.capabilities),
    ),
    true,
  );
  const retainedSource = sourceRevisions.data.find(
    (revision) =>
      revision.raw_state === "available" &&
      revision.raw_storage_bucket &&
      revision.raw_storage_path,
  );
  assert.ok(retainedSource);
  const retainedRaw = await input.supabase.storage
    .from(retainedSource.raw_storage_bucket)
    .download(retainedSource.raw_storage_path);
  if (retainedRaw.error) throw new Error(retainedRaw.error.message);
  const reparsed = await parseGarminFitActivity(Buffer.from(await retainedRaw.data.arrayBuffer()));
  assert.equal(reparsed.sourceKind, "garmin_fit");
  assert.ok(reparsed.activityLocalDate);
  const pendingSource = sourceRevisions.data.find(
    (revision) =>
      revision.raw_state === "removal_pending" &&
      revision.raw_storage_bucket &&
      revision.raw_storage_path,
  );
  assert.ok(pendingSource);
  const pendingRaw = await input.supabase.storage
    .from(pendingSource.raw_storage_bucket)
    .download(pendingSource.raw_storage_path);
  if (pendingRaw.error) throw new Error(pendingRaw.error.message);

  const current = progress.rolling28Day.current;
  const previous = progress.rolling28Day.previous;
  assert.deepEqual(snapshotValues(current), expected.current28Day);
  assert.deepEqual(snapshotValues(previous), expected.previous28Day);
  assert.equal(progress.interpretation.volumeIsFitness, false);
  assert.equal(progress.interpretation.derivedCoachingMetricsAvailable, false);
  assert.equal(progress.interpretation.unavailableReason, "later_gate_metric_contract_required");
  assert.equal(progress.advancedMetrics.status, "current");
  if (progress.advancedMetrics.status !== "current") {
    throw new Error("Runner design profile expected current advanced metrics.");
  }
  const currentLoad = progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric;
  const previousLoad = progress.advancedMetrics.sessionRpeLoad.rolling28Day.previous.metric;
  const observedTrackRecord = progress.advancedMetrics.records.items.find(
    (record) =>
      record.recordClass === "hito_observed_whole_activity" &&
      record.distanceKey === "5_km" &&
      record.context === "track",
  );
  assert.ok(observedTrackRecord);
  assert.equal(currentLoad.availability, "available");
  assert.equal(currentLoad.value, 500);
  assert.equal(currentLoad.includedObservationCount, 1);
  assert.equal(currentLoad.unavailableObservationCount, 14);
  assert.ok(currentLoad.unavailableReasons.includes("runner_rpe_not_recorded"));
  assert.equal(previousLoad.availability, "unavailable");
  assert.equal(previousLoad.includedObservationCount, 0);
  assert.equal(previousLoad.unavailableObservationCount, 15);
  assert.ok(previousLoad.unavailableReasons.includes("runner_rpe_not_recorded"));
  const repeatedProgress = await getRunnerActivityProgressForUser({
    userId: input.userId,
    asOfDate,
  });
  assert.equal(repeatedProgress.rolling28Day.current.id, current.id);
  assert.equal(repeatedProgress.rolling28Day.previous.id, previous.id);
  await assert.rejects(
    listRunnerActivityHistoryForUser({
      userId: input.userId,
      cursor: "not-a-valid-activity-cursor",
    }),
    /cursor is invalid/i,
  );
  assert.equal(
    JSON.stringify({ items, progress }).match(
      /raw_storage|storage_path|original_file_name|fingerprint|generated_local_qa_fit/gi,
    ),
    null,
  );

  return {
    fixtureVersion: RUNNER_DESIGN_PROFILE_FIXTURE_VERSION,
    asOfDate,
    userId: input.userId,
    role: RUNNER_DESIGN_PROFILE_FIXTURE_ROLE,
    planState: {
      materializedPlanCount: materializedPlans.length,
      savedPlanCount: planCycles.data.filter((plan) => plan.saved_plan_payload !== null).length,
      activeAuthorityCount: planCycles.data.filter((plan) => plan.status === "active").length,
      startDate: materializedPlan.start_date,
      endDate: materializedPlan.end_date,
      workoutCount: plannedWorkouts.data.length,
      workoutTypes: [...workoutTypes].sort(),
      workoutFamilies: [...workoutFamilies].sort(),
      workoutIdentities: [...workoutIdentities].sort(),
    },
    history: actual,
    completionState: {
      matchedWorkoutCount: matchedWorkoutIds.size,
      fitCompletedWorkoutCount: fitCompletedWorkoutIds.size,
      futureFitCompletedWorkoutCount: persistedSnapshot.workouts.filter(
        (workout) => workout.date > asOfDate && workout.completionOrigin === "fit_activity",
      ).length,
    },
    progress: {
      current28Day: snapshotValues(current),
      previous28Day: snapshotValues(previous),
      calendarWeekCount: progress.calendarWeeks.length,
      formulaVersion: current.formulaVersion,
      derivedCoachingMetricsAvailable: progress.interpretation.derivedCoachingMetricsAvailable,
      sessionRpeLoad: {
        currentAvailability: currentLoad.availability,
        currentValue: currentLoad.value,
        currentIncludedObservationCount: currentLoad.includedObservationCount,
        currentUnavailableObservationCount: currentLoad.unavailableObservationCount,
        previousAvailability: previousLoad.availability,
        previousUnavailableObservationCount: previousLoad.unavailableObservationCount,
      },
      observedRecordContexts: progress.advancedMetrics.records.items.map(
        (record) => record.context,
      ),
      retryableSourceRemoval: {
        rawState: retryableRemoval.source.rawState,
        updating: retryableRemoval.quality.updating,
        canRemoveOriginalFile: retryableRemoval.capabilities.canRemoveOriginalFile,
        rawObjectRetained: true,
      },
      retainedRawReprocessable: true,
      immutableSnapshotReadback: true,
    },
  };
}

export async function verifyRunnerDesignProfileFixtureRuntime(input: {
  runtimeUrl: string;
  username: string;
  password: string;
}) {
  if (!isLoopbackRuntimeUrl(input.runtimeUrl)) {
    throw new Error("Activity review runtime verification requires a loopback URL.");
  }
  const baseUrl = new URL(input.runtimeUrl);
  const unauthorizedHistory = await fetch(new URL("/api/runner-activities", baseUrl));
  assert.equal(unauthorizedHistory.status, 401);
  assert.equal((await unauthorizedHistory.json()).code, "auth_required");
  const unauthorizedProgress = await fetch(new URL("/api/runner-activity-progress", baseUrl));
  assert.equal(unauthorizedProgress.status, 401);
  assert.equal((await unauthorizedProgress.json()).code, "auth_required");

  const { cookie } = await loginToLoopbackRuntime({
    runtimeUrl: input.runtimeUrl,
    username: input.username,
    password: input.password,
    next: "/progress",
  });
  const headers = { cookie };

  const firstResponse = await fetch(new URL("/api/runner-activities", baseUrl), { headers });
  assert.equal(firstResponse.status, 200);
  const firstBody = await firstResponse.json();
  assert.equal(firstBody.ok, true);
  assert.equal(firstBody.history.items.length, 20);
  assert.ok(firstBody.history.nextCursor);
  const secondUrl = new URL("/api/runner-activities", baseUrl);
  secondUrl.searchParams.set("cursor", firstBody.history.nextCursor);
  const secondResponse = await fetch(secondUrl, { headers });
  assert.equal(secondResponse.status, 200);
  const secondBody = await secondResponse.json();
  assert.equal(secondBody.ok, true);
  assert.equal(secondBody.history.items.length, 10);
  assert.equal(secondBody.history.nextCursor, null);
  const runtimeItems = [...firstBody.history.items, ...secondBody.history.items];
  const retryableRemoval = runtimeItems.find(
    (item: { source: { rawState: string } }) => item.source.rawState === "removal_pending",
  );
  assert.ok(retryableRemoval);
  assert.equal(retryableRemoval.source.originalRetained, false);
  assert.equal(retryableRemoval.source.reprocessingAvailable, false);
  assert.equal(retryableRemoval.quality.updating, false);
  assert.equal(retryableRemoval.capabilities.canRemoveOriginalFile, true);

  const progressResponse = await fetch(new URL("/api/runner-activity-progress", baseUrl), {
    headers,
  });
  assert.equal(progressResponse.status, 200);
  const progressBody = await progressResponse.json();
  assert.equal(progressBody.ok, true);
  assert.equal(progressBody.progress.rolling28Day.current.facts.sessions.value, 15);
  assert.equal(progressBody.progress.advancedMetrics.status, "current");
  assert.equal(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric.availability,
    "available",
  );
  assert.equal(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric.value,
    500,
  );
  assert.equal(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric
      .includedObservationCount,
    1,
  );
  assert.ok(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric.unavailableReasons.includes(
      "runner_rpe_not_recorded",
    ),
  );
  assert.equal(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.previous.metric.availability,
    "unavailable",
  );
  assert.ok(
    progressBody.progress.advancedMetrics.records.items.some(
      (record: { recordClass: string; distanceKey: string; context: string | null }) =>
        record.recordClass === "hito_observed_whole_activity" &&
        record.distanceKey === "5_km" &&
        record.context === "track",
    ),
  );
  assert.equal(progressBody.progress.advancedMetrics.detailedMetrics.status, "unavailable");
  assert.equal(
    progressBody.progress.advancedMetrics.detailedMetrics.reason,
    "normalized_stream_not_persisted",
  );
  const serialized = JSON.stringify({ firstBody, secondBody, progressBody });
  assert.doesNotMatch(
    serialized,
    /raw_storage|storage_path|original_file_name|fingerprint|generated_local_qa_fit/i,
  );

  return {
    runtimeUrl: baseUrl.origin,
    unauthenticatedStatus: 401,
    authenticatedPageItemCounts: [20, 10],
    current28DaySessions: 15,
    advancedMetricStatus: "current",
    sessionRpeLoadAvailability: "available",
    sessionRpeLoadValue: 500,
    previousSessionRpeLoadAvailability: "unavailable",
    retryableSourceRemoval: {
      rawState: "removal_pending",
      updating: false,
      canRemoveOriginalFile: true,
    },
    gate5UnavailableReason: "normalized_stream_not_persisted",
    rawPrivateFieldsExposed: false,
  };
}

function activity(
  key: string,
  daysAgo: number,
  title: string,
  timerDurationMin: number | null,
  elapsedDurationMin: number,
  distanceKm: number | null,
  averageHeartRate: number | null,
  elevationGainM: number | null,
  planned: boolean,
  sourceState: FixtureActivitySpec["sourceState"] = "available",
  sessionRpe: number | null = null,
  runningContext: "track" | null = null,
): FixtureActivitySpec {
  return {
    key,
    daysAgo,
    title,
    timerDurationMin,
    elapsedDurationMin,
    distanceKm,
    averageHeartRate,
    elevationGainM,
    planned,
    sourceState,
    sessionRpe,
    runningContext,
  };
}

function normalizeAsOfDate(value: string | undefined) {
  return AS_OF_DATE_SCHEMA.parse(value ?? todayIso());
}

function buildFixtureActivityDateByKey(input: {
  asOfDate: string;
  plannedWorkoutDates: Iterable<string>;
}) {
  const activityDateByKey = new Map(
    ACTIVITY_SPECS.map((spec) => [spec.key, addDaysIso(input.asOfDate, -spec.daysAgo)]),
  );
  const plannedWorkoutDates = [...new Set(input.plannedWorkoutDates)]
    .filter((date) => date <= input.asOfDate)
    .sort();
  const occupiedActivityDates = new Set(activityDateByKey.values());
  const matchedPlanDates = new Set(
    ACTIVITY_SPECS.flatMap((spec) => {
      if (!spec.planned) return [];
      const date = requireFixtureActivityDate(activityDateByKey, spec.key);
      return plannedWorkoutDates.includes(date) ? [date] : [];
    }),
  );

  for (const spec of ACTIVITY_SPECS) {
    if (matchedPlanDates.size <= MIN_MATCHED_ACTIVITY_COUNT) break;
    if (!spec.planned) continue;
    const currentDate = requireFixtureActivityDate(activityDateByKey, spec.key);
    if (!matchedPlanDates.has(currentDate)) continue;
    const currentWeek = startOfWeekIso(currentDate);
    const unplannedDate = Array.from({ length: 7 }, (_, offset) => addDaysIso(currentWeek, offset))
      .filter(
        (date) =>
          date <= input.asOfDate &&
          !plannedWorkoutDates.includes(date) &&
          !occupiedActivityDates.has(date),
      )
      .sort(
        (left, right) =>
          Math.abs(diffDaysIso(currentDate, left)) - Math.abs(diffDaysIso(currentDate, right)) ||
          left.localeCompare(right),
      )[0];
    if (!unplannedDate) continue;
    occupiedActivityDates.delete(currentDate);
    occupiedActivityDates.add(unplannedDate);
    activityDateByKey.set(spec.key, unplannedDate);
    matchedPlanDates.delete(currentDate);
  }

  for (const spec of ACTIVITY_SPECS) {
    if (matchedPlanDates.size >= MIN_MATCHED_ACTIVITY_COUNT) break;
    if (!spec.planned) continue;
    const currentDate = requireFixtureActivityDate(activityDateByKey, spec.key);
    if (matchedPlanDates.has(currentDate)) continue;
    const currentWeek = startOfWeekIso(currentDate);
    const alignedDate = plannedWorkoutDates
      .filter(
        (date) =>
          startOfWeekIso(date) === currentWeek &&
          !matchedPlanDates.has(date) &&
          !occupiedActivityDates.has(date),
      )
      .sort(
        (left, right) =>
          Math.abs(diffDaysIso(currentDate, left)) - Math.abs(diffDaysIso(currentDate, right)) ||
          left.localeCompare(right),
      )[0];
    if (!alignedDate) continue;
    occupiedActivityDates.delete(currentDate);
    occupiedActivityDates.add(alignedDate);
    activityDateByKey.set(spec.key, alignedDate);
    matchedPlanDates.add(alignedDate);
  }

  assert.equal(
    matchedPlanDates.size,
    MIN_MATCHED_ACTIVITY_COUNT,
    `The design profile aligned ${matchedPlanDates.size} matched activities instead of ${MIN_MATCHED_ACTIVITY_COUNT}.`,
  );
  return activityDateByKey;
}

function requireFixtureActivityDate(activityDateByKey: ReadonlyMap<string, string>, key: string) {
  const date = activityDateByKey.get(key);
  if (!date) throw new Error(`Missing design-profile activity date for ${key}.`);
  return date;
}

function buildFixtureSource(spec: FixtureActivitySpec, localDate: string) {
  const startedAtSeconds = fitTimestampSeconds(`${localDate}T07:00:00.000Z`);
  const finishedAtSeconds = startedAtSeconds + Math.round(spec.elapsedDurationMin * 60);
  const fileIdFields = [
    fitField(0, 1, 0x00, 4),
    fitField(1, 2, 0x84, 1),
    fitField(2, 2, 0x84, 0),
    fitField(4, 4, 0x86, startedAtSeconds),
  ];
  const recordFields = [fitField(253, 4, 0x86, startedAtSeconds)];
  const sessionFields = [
    fitField(253, 4, 0x86, finishedAtSeconds),
    fitField(2, 4, 0x86, startedAtSeconds),
    fitField(5, 1, 0x00, 1),
    fitField(6, 1, 0x00, spec.runningContext === "track" ? 4 : 0),
    fitField(7, 4, 0x86, Math.round(spec.elapsedDurationMin * 60 * 1000)),
    ...(spec.timerDurationMin == null
      ? []
      : [fitField(8, 4, 0x86, Math.round(spec.timerDurationMin * 60 * 1000))]),
    ...(spec.distanceKm == null
      ? []
      : [fitField(9, 4, 0x86, Math.round(spec.distanceKm * 1000 * 100))]),
    ...(spec.averageHeartRate == null
      ? []
      : [
          fitField(16, 1, 0x02, spec.averageHeartRate),
          fitField(17, 1, 0x02, spec.averageHeartRate + 12),
        ]),
    ...(spec.elevationGainM == null
      ? []
      : [fitField(22, 2, 0x84, spec.elevationGainM), fitField(23, 2, 0x84, spec.elevationGainM)]),
  ];
  const activityFields = [
    fitField(253, 4, 0x86, finishedAtSeconds),
    fitField(
      0,
      4,
      0x86,
      Math.round((spec.timerDurationMin ?? spec.elapsedDurationMin) * 60 * 1000),
    ),
    fitField(1, 2, 0x84, 1),
    fitField(2, 1, 0x00, 0),
    fitField(5, 4, 0x86, startedAtSeconds),
  ];
  const data = Buffer.concat([
    fitDefinition(0, 0, fileIdFields),
    fitData(0, fileIdFields),
    fitDefinition(1, 20, recordFields),
    fitData(1, recordFields),
    fitData(
      1,
      recordFields.map((field) => ({ ...field, value: finishedAtSeconds })),
    ),
    fitDefinition(2, 18, sessionFields),
    fitData(2, sessionFields),
    fitDefinition(3, 34, activityFields),
    fitData(3, activityFields),
  ]);
  const header = Buffer.alloc(14);
  header.writeUInt8(14, 0);
  header.writeUInt8(0x20, 1);
  header.writeUInt16LE(0x0810, 2);
  header.writeUInt32LE(data.length, 4);
  header.write(".FIT", 8, "ascii");
  header.writeUInt16LE(fitCrc(header, 0, 12), 12);
  const fileCrc = Buffer.alloc(2);
  fileCrc.writeUInt16LE(fitCrc(data, 0, data.length), 0);
  return Buffer.concat([header, data, fileCrc]);
}

function assertParsedFixtureSource(
  parsed: Awaited<ReturnType<typeof parseGarminFitActivity>>,
  spec: FixtureActivitySpec,
  localDate: string,
) {
  assert.equal(parsed.activityLocalDate, localDate);
  assert.equal(parsed.totalTimerDurationMin, spec.timerDurationMin);
  assert.equal(parsed.totalElapsedDurationMin, spec.elapsedDurationMin);
  assert.equal(parsed.totalDistanceKm, spec.distanceKm);
  assert.equal(parsed.avgHeartRate, spec.averageHeartRate);
  assert.equal(parsed.totalAscentM, spec.elevationGainM);
  assert.ok(parsed.gpsPointCount > 0);
  const summary = parsed.summaryPayload as {
    session?: { subSport?: string | null };
  };
  assert.equal(summary.session?.subSport ?? null, spec.runningContext ?? "generic");
}

function expectedFixtureSummary(asOfDate: string, activityDateByKey: ReadonlyMap<string, string>) {
  const currentStartDate = addDaysIso(asOfDate, -27);
  const previousEndDate = addDaysIso(currentStartDate, -1);
  const previousStartDate = addDaysIso(previousEndDate, -27);
  const activityDates = ACTIVITY_SPECS.map((spec) =>
    requireFixtureActivityDate(activityDateByKey, spec.key),
  ).sort();
  return {
    history: {
      activityCount: ACTIVITY_SPECS.length,
      pageItemCounts: [20, 10],
      uniqueActivityCount: ACTIVITY_SPECS.length,
      firstDate: activityDates[0],
      lastDate: activityDates.at(-1),
      mondayWeekCount: new Set(activityDates.map((date) => startOfWeekIso(date))).size,
      plannedCount: MIN_MATCHED_ACTIVITY_COUNT,
      unplannedCount: ACTIVITY_SPECS.length - MIN_MATCHED_ACTIVITY_COUNT,
      elapsedDurationCount: ACTIVITY_SPECS.filter((spec) => spec.timerDurationMin == null).length,
      missingDistanceCount: ACTIVITY_SPECS.filter((spec) => spec.distanceKm == null).length,
      missingHeartRateCount: ACTIVITY_SPECS.filter((spec) => spec.averageHeartRate == null).length,
      sourceRemovedCount: ACTIVITY_SPECS.filter((spec) => spec.sourceState === "removed").length,
      sourceRemovalPendingCount: ACTIVITY_SPECS.filter(
        (spec) => spec.sourceState === "removal_pending",
      ).length,
      sourceAvailableCount: ACTIVITY_SPECS.filter((spec) => spec.sourceState === "available")
        .length,
    },
    current28Day: expectedWindowSummary(currentStartDate, asOfDate, activityDateByKey),
    previous28Day: expectedWindowSummary(previousStartDate, previousEndDate, activityDateByKey),
  };
}

function expectedWindowSummary(
  startDate: string,
  endDate: string,
  activityDateByKey: ReadonlyMap<string, string>,
) {
  const specs = ACTIVITY_SPECS.filter((spec) => {
    const date = requireFixtureActivityDate(activityDateByKey, spec.key);
    return date >= startDate && date <= endDate;
  });
  const timerSpecs = specs.filter((spec) => spec.timerDurationMin != null);
  const distanceSpecs = specs.filter((spec) => spec.distanceKm != null);
  const elevationSpecs = specs.filter((spec) => spec.elevationGainM != null);
  return {
    sessions: specs.length,
    runningTimeMin: sum(timerSpecs.map((spec) => spec.timerDurationMin ?? 0)),
    runningTimeConfidence: timerSpecs.length === specs.length ? "complete" : "partial",
    runningTimeMissingCount: specs.length - timerSpecs.length,
    distanceKm: sum(distanceSpecs.map((spec) => spec.distanceKm ?? 0)),
    distanceConfidence: distanceSpecs.length === specs.length ? "complete" : "partial",
    distanceMissingCount: specs.length - distanceSpecs.length,
    elevationGainM: sum(elevationSpecs.map((spec) => spec.elevationGainM ?? 0)),
    elevationConfidence: elevationSpecs.length === specs.length ? "complete" : "partial",
    elevationMissingCount: specs.length - elevationSpecs.length,
    longestDistanceKm: Math.max(...distanceSpecs.map((spec) => spec.distanceKm ?? 0)),
    longestDurationMin: Math.max(...timerSpecs.map((spec) => spec.timerDurationMin ?? 0)),
  };
}

function snapshotValues(
  snapshot: Awaited<ReturnType<typeof getRunnerActivityProgressForUser>>["rolling28Day"]["current"],
) {
  return {
    sessions: snapshot.facts.sessions.value,
    runningTimeMin: snapshot.facts.runningTime.value,
    runningTimeConfidence: snapshot.facts.runningTime.confidence,
    runningTimeMissingCount: snapshot.facts.runningTime.missingActivityCount,
    distanceKm: snapshot.facts.distance.value,
    distanceConfidence: snapshot.facts.distance.confidence,
    distanceMissingCount: snapshot.facts.distance.missingActivityCount,
    elevationGainM: snapshot.facts.elevationGain.value,
    elevationConfidence: snapshot.facts.elevationGain.confidence,
    elevationMissingCount: snapshot.facts.elevationGain.missingActivityCount,
    longestDistanceKm: snapshot.facts.longestDistance.value,
    longestDurationMin: snapshot.facts.longestDuration.value,
  };
}

function isFixtureCapabilities(value: unknown) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).fixture_class === RUNNER_DESIGN_PROFILE_FIXTURE_VERSION &&
    (value as Record<string, unknown>).generated_local_qa_fit === true &&
    (value as Record<string, unknown>).reprocessable === true,
  );
}

function readFixtureResponseId(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const engine = (value as Record<string, unknown>).selected_plan_engine;
  if (!engine || typeof engine !== "object" || Array.isArray(engine)) return null;
  const generation = (engine as Record<string, unknown>).ai_generation;
  if (!generation || typeof generation !== "object" || Array.isArray(generation)) return null;
  const responseId = (generation as Record<string, unknown>).response_id;
  return typeof responseId === "string" ? responseId : null;
}

async function withLocalDesignFixtureEnv<T>(run: () => Promise<T>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !isLoopbackRuntimeUrl(supabaseUrl)) {
    throw new Error("Runner design profile fixture requires loopback Supabase.");
  }
  const envKeys = [
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
    AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
    "LOCAL_AUTH_BYPASS_ENABLED",
    "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
    "NEXT_PUBLIC_SUPABASE_URL",
    "VERCEL",
    "CI",
  ] as const;
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  try {
    process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = "true";
    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "qa_fixture";
    process.env.LOCAL_AUTH_BYPASS_ENABLED = "true";
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE;
    process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV];
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
    delete process.env.VERCEL;
    delete process.env.CI;
    return await run();
  } finally {
    for (const key of envKeys) {
      const value = previous[key];
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

type FitField = {
  number: number;
  size: 1 | 2 | 4;
  baseType: number;
  value: number;
};

function fitField(
  number: number,
  size: FitField["size"],
  baseType: number,
  value: number,
): FitField {
  return { number, size, baseType, value };
}

function fitDefinition(localMessage: number, globalMessage: number, fields: FitField[]) {
  const definition = Buffer.alloc(6 + fields.length * 3);
  definition.writeUInt8(0x40 | localMessage, 0);
  definition.writeUInt8(0, 1);
  definition.writeUInt8(0, 2);
  definition.writeUInt16LE(globalMessage, 3);
  definition.writeUInt8(fields.length, 5);
  fields.forEach((field, index) => {
    const offset = 6 + index * 3;
    definition.writeUInt8(field.number, offset);
    definition.writeUInt8(field.size, offset + 1);
    definition.writeUInt8(field.baseType, offset + 2);
  });
  return definition;
}

function fitData(localMessage: number, fields: FitField[]) {
  const data = Buffer.alloc(1 + sum(fields.map((field) => field.size)));
  data.writeUInt8(localMessage, 0);
  let offset = 1;
  for (const field of fields) {
    if (field.size === 1) data.writeUInt8(field.value, offset);
    else if (field.size === 2) data.writeUInt16LE(field.value, offset);
    else data.writeUInt32LE(field.value, offset);
    offset += field.size;
  }
  return data;
}

function fitTimestampSeconds(iso: string) {
  const fitEpochMs = Date.UTC(1989, 11, 31);
  return Math.round((new Date(iso).getTime() - fitEpochMs) / 1000);
}

function fitCrc(buffer: Buffer, start: number, end: number) {
  const table = [
    0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401, 0xa001, 0x6c00, 0x7800, 0xb401,
    0x5000, 0x9c01, 0x8801, 0x4400,
  ];
  let crc = 0;
  for (let index = start; index < end; index += 1) {
    const value = buffer[index];
    let next = table[crc & 0xf];
    crc = ((crc >> 4) & 0x0fff) ^ next ^ table[value & 0xf];
    next = table[crc & 0xf];
    crc = ((crc >> 4) & 0x0fff) ^ next ^ table[(value >> 4) & 0xf];
  }
  return crc;
}

function sum(values: number[]) {
  return Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;
}
