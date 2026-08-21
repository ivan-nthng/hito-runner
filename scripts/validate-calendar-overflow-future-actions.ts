import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  clearCalendarFutureWorkoutsForUser,
  exportFutureCalendarWorkoutsForUser,
} from "../src/lib/calendar-overflow-actions";
import {
  listSavedPlanLibraryForUser,
  retainImportedPlanCandidateForUser,
  retainReviewedPlanCandidateForUser,
} from "../src/lib/active-plan-persistence";
import { getCalendarWorkoutsWithLogsForUser } from "../src/lib/runner-calendar-persistence";
import {
  buildImportedPlanSeed,
  validateImportedPlanJson,
  type TrainingPlanV2,
} from "../src/lib/imported-plan";
import {
  confirmWorkoutCommandForUser,
  createEmptyManualActivePlanForUser,
  initializeWorkoutDocument,
  reviewWorkoutCommandForUser,
} from "../src/lib/manual-workout-authoring";
import { getRunnerCalendarDateForUserId } from "../src/lib/runner-calendar-context";
import { digestSha256Hex, stableJsonStringify } from "../src/lib/review-token-signing";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import { addDaysIso, weekdayLong } from "../src/lib/training";
import { getPersistedSnapshot } from "../src/lib/training-api";
import {
  acquireQaPoolSupabaseUser,
  releaseQaPoolSupabaseUser,
} from "./lib/qa-pool-persistence-proof";

type QaPoolLease = Awaited<ReturnType<typeof acquireQaPoolSupabaseUser>>;

async function main() {
  const supabase = createAdminSupabaseClient();
  const ownerProof = await withDisposableRunner({
    supabase,
    poolRole: "baseline-no-plan",
    creationErrorMessage: "Calendar-overflow owner setup failed.",
    run: (owner) => validateOwnerImportExportAndClear({ supabase, owner }),
  });
  const concurrencyProof = await withDisposableRunner({
    supabase,
    poolRole: "provider-engine",
    creationErrorMessage: "Calendar-overflow concurrency setup failed.",
    run: (lease) => validateConcurrentRunnerClear({ supabase, lease }),
  });
  const mixedOriginProof = await withDisposableRunner({
    supabase,
    poolRole: "baseline-no-plan",
    creationErrorMessage: "Mixed-origin Calendar setup failed.",
    run: (lease) => validateMixedOriginCalendarReadbackAndExport({ supabase, lease }),
  });
  const protectedProof = await withDisposableRunner({
    supabase,
    poolRole: "isolation-a",
    creationErrorMessage: "Calendar-overflow protected-history setup failed.",
    run: (lease) => validateProtectedFutureRejection({ supabase, lease }),
  });

  console.log("Calendar overflow future-workout contract passed.", {
    ownerProof,
    concurrencyProof,
    mixedOriginProof,
    protectedProof,
    callsOpenAi: false,
  });
}

async function validateMixedOriginCalendarReadbackAndExport(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  lease: QaPoolLease;
}) {
  const currentDate = await getRunnerCalendarDateForUserId(input.lease.userId);
  const setup = await createEmptyManualActivePlanForUser(input.lease.userId, {
    age: 34,
    heightCm: 178,
    weightKg: 72,
    runningLevel: "running_regularly",
  });
  assert.equal(setup.ok, true);
  if (!setup.ok) throw new Error(setup.message);
  assert.equal(setup.activePlanId, null);
  const importedPlan = await buildFixturePlan(currentDate, "Imported source history", {
    sourceKind: "training_plan_v2_import",
    dayOffsets: [-3, -2, -1],
  });
  const importedSource = await retainAndMaterializeFixturePlan(input.lease.userId, importedPlan, {
    calendarInstant: new Date(`${addDaysIso(currentDate, -7)}T12:00:00.000Z`),
  });
  const aiPlan = await buildFixturePlan(currentDate, "AI source future", {
    sourceKind: "ai_authored_plan_first_v1",
    dayOffsets: [0, 1, 2],
  });
  const aiSource = await retainAndMaterializeFixturePlan(input.lease.userId, aiPlan);
  const manualDate = addDaysIso(currentDate, 4);
  const manualInitializer = initializeWorkoutDocument({
    origin: "built_in",
    templateKey: "easy_aerobic_run",
    workoutDate: manualDate,
  });
  assert.equal(manualInitializer.ok, true);
  if (!manualInitializer.ok) throw new Error(manualInitializer.message);
  const manualCommand = {
    operation: "materialize" as const,
    documents: [
      {
        ...manualInitializer.document,
        notes: "Mixed-origin direct manual workout.",
      },
    ],
    provenanceReferences: [manualInitializer.provenanceReference],
  };
  const manualReview = await reviewWorkoutCommandForUser(input.lease.userId, manualCommand);
  assert.equal(manualReview.ok, true);
  if (!manualReview.ok) throw new Error("Mixed-origin manual review failed.");
  const manualAdd = await confirmWorkoutCommandForUser(input.lease.userId, {
    command: manualReview.candidate.command,
    candidateId: manualReview.candidate.candidateId,
    reviewToken: manualReview.candidate.reviewToken,
    reviewChecksum: manualReview.candidate.reviewChecksum,
  });
  assert.equal(manualAdd.ok, true);
  if (!manualAdd.ok) throw new Error(manualAdd.message);

  const beforeCopy = await getCalendarWorkoutsWithLogsForUser(input.lease.userId);
  const copySourceWorkout = beforeCopy.workouts.find(
    (workout) =>
      workout.origin_kind === "ai" &&
      workout.plan_cycle_id === aiSource.id &&
      workout.workout_date >= currentDate,
  );
  assert.ok(copySourceWorkout, "Mixed-origin proof requires one eligible future source workout.");
  const copiedDate = addDaysIso(currentDate, 5);
  const copyReview = await reviewWorkoutCommandForUser(input.lease.userId, {
    operation: "copy",
    workoutId: copySourceWorkout.id,
    targetDate: copiedDate,
  });
  assert.equal(copyReview.ok, true);
  if (!copyReview.ok) throw new Error("Mixed-origin Copy review failed.");
  const copied = await confirmWorkoutCommandForUser(input.lease.userId, {
    command: copyReview.candidate.command,
    candidateId: copyReview.candidate.candidateId,
    reviewToken: copyReview.candidate.reviewToken,
    reviewChecksum: copyReview.candidate.reviewChecksum,
  });
  assert.equal(copied.ok, true);
  if (!copied.ok) throw new Error(copied.message);

  const snapshot = await getPersistedSnapshot(input.lease.userId);
  assert.equal(snapshot.mode, "authenticated");
  assert.equal(snapshot.planMeta, null);
  assert.equal(snapshot.calendarContext?.workoutEditing.addWorkout.allowed, true);
  const futureSnapshotWorkouts = snapshot.workouts.filter((workout) => workout.date >= currentDate);
  assert.deepEqual(
    futureSnapshotWorkouts.reduce(
      (counts, workout) => {
        const origin = workout.sourceProvenance?.originKind;
        if (origin) counts[origin] += 1;
        return counts;
      },
      { manual: 0, ai: 0, file_import: 0 },
    ),
    { manual: 1, ai: 4, file_import: 0 },
  );
  assert.ok(
    futureSnapshotWorkouts
      .filter((workout) => workout.sourceProvenance?.originKind === "ai")
      .every((workout) => workout.sourceProvenance?.sourcePlanId === aiSource.id),
  );
  assert.equal(
    futureSnapshotWorkouts.find((workout) => workout.sourceProvenance?.originKind === "manual")
      ?.sourceProvenance?.sourcePlanId,
    null,
  );
  assert.equal(
    snapshot.workouts.find((workout) => workout.sourceProvenance?.originKind === "file_import")
      ?.sourceProvenance?.sourcePlanId,
    importedSource.id,
  );

  const exported = await exportFutureCalendarWorkoutsForUser(input.lease.userId);
  const exportedPlan = JSON.parse(exported.body) as TrainingPlanV2;
  assert.equal(exportedPlan.source_kind, "hito_calendar_future_export");
  assert.equal(
    exportedPlan.export_metadata?.export_format_version,
    "hito_calendar_workout_export_v1",
  );
  assert.equal(exportedPlan.planned_workouts.length, 5);
  assert.doesNotMatch(exported.body, new RegExp(importedSource.id, "u"));
  assert.doesNotMatch(exported.body, new RegExp(aiSource.id, "u"));

  const sources = await input.supabase
    .from("plan_cycles")
    .select("id, status, saved_plan_payload")
    .eq("user_id", input.lease.userId);
  if (sources.error) throw new Error(sources.error.message);
  assert.equal(sources.data.length, 2);
  assert.ok(sources.data.every((source) => source.status === "archived"));
  assert.ok(sources.data.every((source) => source.saved_plan_payload !== null));

  return {
    calendarRows: snapshot.workouts.length,
    futureRowsExported: exportedPlan.planned_workouts.length,
    origins: { manual: 1, ai: 4, fileImport: 0 },
    immutableSourceRows: sources.data.length,
    activeAuthorityRows: 0,
  };
}

async function withDisposableRunner<T>(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  poolRole: "baseline-no-plan" | "provider-engine" | "isolation-a";
  creationErrorMessage: string;
  run: (lease: QaPoolLease) => Promise<T>;
}) {
  const lease = await acquireQaPoolSupabaseUser({
    supabase: input.supabase,
    poolRole: input.poolRole,
    creationErrorMessage: input.creationErrorMessage,
  });

  try {
    return await input.run(lease);
  } finally {
    const cleanup = await releaseQaPoolSupabaseUser({
      supabase: input.supabase,
      userId: lease.userId,
      poolRole: lease.poolRole,
      leaseToken: lease.leaseToken,
    });
    assert.equal(cleanup.authUserPreserved, true);
    assert.equal(cleanup.leaseReleased, true);
    assert.ok(
      Object.values(cleanup.ownedRows).every((count) => count === 0),
      "Calendar-overflow proof cleanup must remove every owned row.",
    );
  }
}

async function validateOwnerImportExportAndClear(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  owner: QaPoolLease;
}) {
  const currentDate = await getRunnerCalendarDateForUserId(input.owner.userId);
  const validPlan = await buildFixturePlan(currentDate, "Calendar overflow uploaded library plan");
  const invalidPlan = validateImportedPlanJson("{not-json");
  assert.equal(invalidPlan, null, "Invalid JSON must not reach saved-plan retention.");

  const saved = await retainImportedPlanCandidateForUser({
    userId: input.owner.userId,
    canonicalPlan: validPlan,
    reviewChecksum: await digestSha256Hex(stableJsonStringify(validPlan)),
  });
  const library = await listSavedPlanLibraryForUser(input.owner.userId, {
    recordState: "all",
  });
  assert.equal(library.length, 1, "Valid upload must retain exactly one saved plan record.");
  assert.equal(library[0]?.id, saved.id);
  assert.equal(
    (await getCalendarWorkoutsWithLogsForUser(input.owner.userId)).workouts.length,
    0,
    "Upload must not materialize Calendar workouts.",
  );

  const materializedPlan = await buildFixturePlan(
    currentDate,
    "Calendar truth should win over saved payload",
  );
  await retainAndMaterializeFixturePlan(input.owner.userId, materializedPlan);
  const materializedCalendar = await getCalendarWorkoutsWithLogsForUser(input.owner.userId);
  assert.equal(materializedCalendar.workouts.length, 3);
  const currentWorkout = materializedCalendar.workouts.find(
    (workout) => workout.workout_date === currentDate,
  );
  assert.ok(currentWorkout, "Fixture needs one current-date workout.");
  const pastWorkoutId = crypto.randomUUID();
  const pastDate = addDaysIso(currentDate, -1);
  const pastInsert = await input.supabase.from("planned_workouts").insert({
    ...currentWorkout,
    id: pastWorkoutId,
    workout_date: pastDate,
    weekday: weekdayLong(pastDate),
    source_workout_id: `calendar-overflow-history-${pastWorkoutId}`,
    display_order: currentWorkout.display_order + 10_000,
    created_at: new Date().toISOString(),
  });
  if (pastInsert.error) throw new Error(pastInsert.error.message);
  const initialCalendar = await getCalendarWorkoutsWithLogsForUser(input.owner.userId);
  const pastWorkout = initialCalendar.workouts.find((workout) => workout.id === pastWorkoutId);
  assert.ok(pastWorkout, "Fixture needs one protected past workout.");

  const localCalendarTitle = "Calendar-local export fact";
  const update = await input.supabase
    .from("planned_workouts")
    .update({ title: localCalendarTitle })
    .eq("id", currentWorkout.id)
    .eq("user_id", input.owner.userId);
  if (update.error) throw new Error(update.error.message);

  const historicalEvidence = await attachPastFitEvidence({
    supabase: input.supabase,
    userId: input.owner.userId,
    plannedWorkoutId: pastWorkout.id,
  });
  const exported = await exportFutureCalendarWorkoutsForUser(input.owner.userId);
  const exportedPlan = JSON.parse(exported.body) as TrainingPlanV2;
  assert.equal(validateImportedPlanJson(exported.body)?.success, true);
  assert.equal(exportedPlan.plan_name, "Future Calendar workouts");
  assert.deepEqual(
    exportedPlan.planned_workouts.map((workout) => workout.date),
    initialCalendar.workouts
      .filter((workout) => workout.workout_date >= currentDate)
      .map((workout) => workout.workout_date)
      .sort(),
  );
  assert.ok(
    exportedPlan.planned_workouts.some((workout) => workout.title === localCalendarTitle),
    "Future export must represent the current Calendar row rather than the original saved payload.",
  );
  assert.doesNotMatch(
    exported.body,
    new RegExp(historicalEvidence.asset.storage_path, "u"),
    "Future export must omit raw FIT evidence.",
  );

  const clear = await clearCalendarFutureWorkoutsForUser(input.owner.userId, false);
  assert.equal(clear.ok, true);
  if (!clear.ok) throw new Error(clear.message);
  assert.equal(clear.clearedWorkoutCount, 3);
  assert.equal(clear.opensPlanCreation, false);

  const remaining = await getCalendarWorkoutsWithLogsForUser(input.owner.userId);
  assert.deepEqual(
    remaining.workouts.map((workout) => workout.id),
    [pastWorkout.id],
  );
  await assertPastEvidenceUnchanged({
    supabase: input.supabase,
    userId: input.owner.userId,
    logId: historicalEvidence.log.id,
    assetId: historicalEvidence.asset.id,
  });

  const repeatedClear = await clearCalendarFutureWorkoutsForUser(input.owner.userId, false);
  assert.equal(repeatedClear.ok, true);
  if (!repeatedClear.ok) throw new Error(repeatedClear.message);
  assert.equal(repeatedClear.clearedWorkoutCount, 0, "Repeat clear must be exactly-once.");

  const manualCreation = await createEmptyManualActivePlanForUser(input.owner.userId, {
    age: 34,
    heightCm: 178,
    weightKg: 72,
    runningLevel: "running_regularly",
  });
  assert.equal(manualCreation.ok, true);
  assert.equal(
    (await getCalendarWorkoutsWithLogsForUser(input.owner.userId)).workouts.length,
    1,
    "Build myself must preserve past history and create no fake Calendar workout.",
  );

  await retainAndMaterializeFixturePlan(
    input.owner.userId,
    await buildFixturePlan(currentDate, "New plan after future Calendar clear"),
  );
  const afterPlanEntry = await getCalendarWorkoutsWithLogsForUser(input.owner.userId);
  assert.equal(afterPlanEntry.workouts.length, 4);
  assert.ok(
    afterPlanEntry.workouts.some((workout) => workout.id === pastWorkout.id),
    "Starting a new plan must retain past Calendar history.",
  );

  const activePlans = await input.supabase
    .from("plan_cycles")
    .select("id")
    .eq("user_id", input.owner.userId)
    .eq("status", "active");
  if (activePlans.error) throw new Error(activePlans.error.message);
  assert.deepEqual(
    activePlans.data,
    [],
    "Overflow actions must not restore active-plan authority.",
  );

  return {
    uploadedLibraryRecords: library.length,
    futureRowsExported: exportedPlan.planned_workouts.length,
    calendarRowsCleared: clear.clearedWorkoutCount,
    protectedPastFitPreserved: true,
    buildMyselfAllowedWithPastHistory: manualCreation.ok,
    planEntryAllowedWithPastHistory: true,
    activePlanRows: activePlans.data.length,
  };
}

async function validateConcurrentRunnerClear(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  lease: QaPoolLease;
}) {
  const currentDate = await getRunnerCalendarDateForUserId(input.lease.userId);
  await retainAndMaterializeFixturePlan(
    input.lease.userId,
    await buildFixturePlan(currentDate, "Calendar overflow concurrency plan"),
  );
  const initial = await getCalendarWorkoutsWithLogsForUser(input.lease.userId);
  assert.equal(initial.workouts.length, 3);

  const [first, second] = await Promise.all([
    clearCalendarFutureWorkoutsForUser(input.lease.userId, true),
    clearCalendarFutureWorkoutsForUser(input.lease.userId, true),
  ]);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) throw new Error("Concurrent future clear should succeed.");
  assert.equal(first.clearedWorkoutCount + second.clearedWorkoutCount, 3);
  assert.equal(first.opensPlanCreation, true);
  assert.equal(second.opensPlanCreation, true);
  assert.equal((await getCalendarWorkoutsWithLogsForUser(input.lease.userId)).workouts.length, 0);

  return {
    concurrentlyClearedRows: first.clearedWorkoutCount + second.clearedWorkoutCount,
    finalCalendarRows: 0,
  };
}

async function validateProtectedFutureRejection(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  lease: QaPoolLease;
}) {
  const currentDate = await getRunnerCalendarDateForUserId(input.lease.userId);
  await retainAndMaterializeFixturePlan(
    input.lease.userId,
    await buildFixturePlan(currentDate, "Calendar overflow protected future plan"),
  );
  const initial = await getCalendarWorkoutsWithLogsForUser(input.lease.userId);
  const protectedWorkout = initial.workouts.find((workout) => workout.workout_date === currentDate);
  assert.ok(protectedWorkout, "Protected fixture needs a current-date workout.");
  const evidence = await attachPastFitEvidence({
    supabase: input.supabase,
    userId: input.lease.userId,
    plannedWorkoutId: protectedWorkout.id,
  });

  const clear = await clearCalendarFutureWorkoutsForUser(input.lease.userId, false);
  assert.deepEqual(clear, {
    ok: false,
    status: "blocked",
    reason: "protected_future_schedule",
    message: "Future Calendar deletion cannot remove logged or evidence-backed workouts.",
    opensPlanCreation: false,
  });
  const afterRejectedClear = await getCalendarWorkoutsWithLogsForUser(input.lease.userId);
  assert.deepEqual(
    afterRejectedClear.workouts.map((workout) => workout.id).sort(),
    initial.workouts.map((workout) => workout.id).sort(),
    "Protected future rejection must be atomic.",
  );
  await assertPastEvidenceUnchanged({
    supabase: input.supabase,
    userId: input.lease.userId,
    logId: evidence.log.id,
    assetId: evidence.asset.id,
  });

  return {
    protectedFutureRejected: true,
    unchangedCalendarRows: afterRejectedClear.workouts.length,
  };
}

async function buildFixturePlan(
  currentDate: string,
  title: string,
  options: {
    sourceKind?: "training_plan_v2_import" | "ai_authored_plan_first_v1";
    dayOffsets?: [number, number, number];
  } = {},
): Promise<TrainingPlanV2> {
  const templatePath = fileURLToPath(
    new URL("../public/templates/hito-training-plan-v2-template.json", import.meta.url),
  );
  const template = JSON.parse(await readFile(templatePath, "utf8")) as TrainingPlanV2;
  const dayOffsets = options.dayOffsets ?? [0, 1, 2];
  const dates = dayOffsets.map((offset) => addDaysIso(currentDate, offset));

  const plan = {
    ...template,
    plan_id: crypto.randomUUID(),
    plan_name: title,
    source_kind: options.sourceKind ?? "training_plan_v2_import",
    generated_for: "Local QA runner",
    start_date: dates[0]!,
    target_date: addDaysIso(currentDate, 56),
    training_constraints: { running_days_per_week: 7 },
    goal: {
      goal_type: "calendar_overflow_fixture",
      goal_label: "Calendar overflow fixture",
    },
    planned_workouts: template.planned_workouts.slice(0, 3).map((workout, index) => ({
      ...workout,
      workout_id: `${crypto.randomUUID()}-${index}`,
      date: dates[index]!,
      weekday: weekdayLong(dates[index]!),
      title: `${title} ${index + 1}`,
    })),
  } satisfies TrainingPlanV2;

  return plan;
}

async function retainAndMaterializeFixturePlan(
  userId: string,
  plan: TrainingPlanV2,
  options: { calendarInstant?: Date } = {},
) {
  const reviewChecksum = await digestSha256Hex(stableJsonStringify(plan));
  const sourcePlan =
    plan.source_kind === "ai_authored_plan_first_v1"
      ? await retainReviewedPlanCandidateForUser({
          userId,
          canonicalPlan: plan,
          reviewChecksum,
          planMetadata: null,
        })
      : await retainImportedPlanCandidateForUser({
          userId,
          canonicalPlan: plan,
          reviewChecksum,
        });

  const documents = buildImportedPlanSeed(plan).workouts;
  const review = await reviewWorkoutCommandForUser(userId, {
    operation: "materialize",
    documents,
    provenanceReferences: documents.map((document) => ({
      sourcePlanId: sourcePlan.id,
      sourceKind: plan.source_kind,
      sourceWorkoutId: document.sourceWorkoutId,
    })),
  });
  assert.equal(review.ok, true);
  if (!review.ok) throw new Error("Source Workout batch review failed.");
  const confirmed = await confirmWorkoutCommandForUser(
    userId,
    {
      command: review.candidate.command,
      candidateId: review.candidate.candidateId,
      reviewToken: review.candidate.reviewToken,
      reviewChecksum: review.candidate.reviewChecksum,
    },
    options.calendarInstant ? { sourceBatchCalendarInstant: options.calendarInstant } : {},
  );
  assert.equal(confirmed.ok, true, JSON.stringify(confirmed));
  if (!confirmed.ok) throw new Error(confirmed.message);

  return sourcePlan;
}

async function attachPastFitEvidence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  plannedWorkoutId: string;
}) {
  const logId = crypto.randomUUID();
  const assetId = crypto.randomUUID();
  const log = await input.supabase
    .from("workout_logs")
    .insert({
      id: logId,
      planned_workout_id: input.plannedWorkoutId,
      user_id: input.userId,
      outcome: "completed",
      actual_distance_km: 5,
      actual_duration_min: 30,
      rpe: 4,
      notes: "Protected local FIT fixture",
      intervals_completed: null,
      body_notes: [],
    })
    .select("*")
    .single();
  if (log.error || !log.data) throw new Error(log.error?.message ?? "Log fixture failed.");

  const asset = await input.supabase
    .from("workout_result_assets")
    .insert({
      id: assetId,
      user_id: input.userId,
      planned_workout_id: input.plannedWorkoutId,
      workout_log_id: logId,
      asset_kind: "garmin_fit",
      storage_bucket: "workout-result-assets",
      storage_path: `calendar-overflow-proof/${assetId}.fit`,
      original_file_name: "retained-evidence.fit",
      mime_type: "application/octet-stream",
      file_size_bytes: 1,
      parse_status: "uploaded",
      primary_file_kind: "fit",
      primary_file_name: "retained-evidence.fit",
    })
    .select("*")
    .single();
  if (asset.error || !asset.data) throw new Error(asset.error?.message ?? "FIT fixture failed.");

  return { log: log.data, asset: asset.data };
}

async function assertPastEvidenceUnchanged(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  logId: string;
  assetId: string;
}) {
  const [log, asset] = await Promise.all([
    input.supabase.from("workout_logs").select("*").eq("id", input.logId).single(),
    input.supabase
      .from("workout_result_assets")
      .select("*")
      .eq("id", input.assetId)
      .eq("user_id", input.userId)
      .single(),
  ]);
  if (log.error || !log.data) throw new Error(log.error?.message ?? "Expected log disappeared.");
  if (asset.error || !asset.data)
    throw new Error(asset.error?.message ?? "Expected FIT disappeared.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
