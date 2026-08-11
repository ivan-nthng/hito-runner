import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

import {
  buildReviewedAiGeneratedRunningPlanPreviewForUser,
  buildReviewedAiGeneratedRunningPlanPreview,
  confirmRunningPlanDraftForUser,
  type RunningPlanConfirmActionInput,
} from "../../src/lib/running-plan-engine-actions";
import type {
  RunningPlanPreviewDraft,
  RunningPlanReviewedPreviewDraft,
} from "../../src/lib/running-plan-engine-review";
import {
  buildRunningPlanCanonicalPlan,
  buildRunningPlanPersistenceMetadata,
} from "../../src/lib/running-plan-engine-review";
import {
  CalendarPersistenceRejection,
  applyAtomicReviewedPlanPersistence,
} from "../../src/lib/active-plan-lifecycle-persistence";
import {
  applySavedPlanRecordForUser,
  getSavedPlanRecordForUser,
  listSavedPlanLibraryForUser,
  logicallyRemoveSavedPlanRecordForUser,
  readSavedPlanPayload,
  retainReviewedPlanCandidateForUser,
} from "../../src/lib/active-plan-persistence";
import {
  exportSavedPlanForUser,
  savedPlanStartInputSchema,
} from "../../src/lib/active-plan-export-actions";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
  AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
} from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID } from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { buildAiGeneratedRunningPlanAuthoringInput } from "../../src/lib/ai-generated-running-plan";
import { buildImportedPlanSeed, type TrainingPlanV2 } from "../../src/lib/imported-plan";
import { prepareSavedPlanFutureApplyPolicy } from "../../src/lib/plan-apply-policy";
import { DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE } from "../../src/lib/local-auth-account-registry.server";
import { getRunnerCalendarDateForUserId } from "../../src/lib/runner-calendar-context";
import {
  buildAiAuthoredPlanFirstProviderContext,
  type AiAuthoredPlanFirstCompilerDraft,
} from "../../src/lib/ai-authored-plan-first-provider-contract";
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
  renderPlanExportMarkdown,
} from "../../src/lib/plan-export";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import { getPersistedSnapshot } from "../../src/lib/training-api";
import { addDaysIso, startOfWeekIso, weekdayLong } from "../../src/lib/training";
import type { Database, Json } from "../../src/lib/supabase/database";
import {
  buildFirstTimeRunnerBaselineReadback,
  getRunnerPlanAuthoringProfileSnapshotForUserId,
  getUserSettingsForUserId,
  updateUserSettingsForUserId,
} from "../../src/lib/user-settings-actions";
import {
  validateAiAuthoredPrimaryExecutionGuidance,
  validateNoClientRowsTrusted,
} from "./assertions";
import { validateRunnerFacingTargetReadbackContract } from "../running-plan-engine-target-readback-contract";
import {
  acquireQaPoolSupabaseUser,
  DISPOSABLE_REQUIRE_PERSISTENCE_FLAG,
  readDisposablePersistenceCliOptions,
  releaseQaPoolSupabaseUser,
  resolveDisposablePersistencePreflight,
  type DisposablePersistencePreflight,
  type QaPoolSupabaseCleanupProof,
} from "../lib/qa-pool-persistence-proof";
import { buildLargeReadbackProviderFixture } from "../plan-first-provider-representation-proof";
import { buildProofPersonalRunnerProfileSnapshot } from "../runner-profile-snapshot-proof-helpers";

type DisposableCleanupProof = QaPoolSupabaseCleanupProof;
type QaPoolUserLease = Awaited<ReturnType<typeof acquireQaPoolSupabaseUser>>;
type BuildConfirmInputForConfirm = (
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) => RunningPlanConfirmActionInput;

const REQUIRE_PERSISTENCE_FLAG = DISPOSABLE_REQUIRE_PERSISTENCE_FLAG;
const DISPOSABLE_TEST_PASSWORD = "Hito-local-proof-2026!";
const PERSONAL_HEART_RATE_ZONES = [
  { reference: "Z1", minBpm: 95, maxBpm: 120 },
  { reference: "Z2", minBpm: 116, maxBpm: 135 },
  { reference: "Z3", minBpm: 130, maxBpm: 150 },
  { reference: "Z4", minBpm: 145, maxBpm: 165 },
  { reference: "Z5", minBpm: 160, maxBpm: 185 },
] as const;
const UPDATED_PERSONAL_HEART_RATE_ZONES = [
  { reference: "Z1", minBpm: 90, maxBpm: 110 },
  { reference: "Z2", minBpm: 115, maxBpm: 130 },
  { reference: "Z3", minBpm: 135, maxBpm: 145 },
  { reference: "Z4", minBpm: 150, maxBpm: 160 },
  { reference: "Z5", minBpm: 165, maxBpm: 180 },
] as const;
export type PersistencePreflight = DisposablePersistencePreflight;

export function readCliOptions() {
  return readDisposablePersistenceCliOptions();
}

export function resolvePersistencePreflight(
  options: ReturnType<typeof readCliOptions>,
): PersistencePreflight {
  return resolveDisposablePersistencePreflight({
    options,
    includeNotRequested: true,
    notRequestedReason:
      "Running-plan confirm persistence proof was not requested; non-mutating review exactness checks ran only.",
    notRequestedOverrideHint: `Pass ${REQUIRE_PERSISTENCE_FLAG} with local disposable Supabase env to run persistence proof.`,
    envIncompleteReason:
      "Supabase persistence env is incomplete; non-mutating review exactness checks ran only.",
    envIncompleteOverrideHint:
      "Start local Supabase and export NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY, then rerun with --require-persistence.",
    invalidUrlReason:
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL; persistence proof was not attempted.",
    invalidUrlOverrideHint:
      "Use a valid local Supabase URL such as http://127.0.0.1:54321 and rerun with --require-persistence.",
    nonLoopbackBlockedReason:
      "Running-plan persistence proof only supports loopback Supabase; remote mutation is not available.",
    nonLoopbackOverrideHint:
      "Start local Supabase and run npm run supabase:local:configure before retrying.",
  });
}

export async function validatePersistenceContract(
  reviewedDrafts: readonly RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>[],
  preflight: Extract<PersistencePreflight, { shouldRun: true }>,
  buildConfirmInputForConfirm: BuildConfirmInputForConfirm,
) {
  const supabase = createAdminSupabaseClient();
  const largeReadbackDraft = await buildLargeReadbackReviewedDraft();
  const persistedDistanceGoals: Array<{
    goalLabel: string;
    distanceMeters: number | null;
    savedSourceRows: number;
    materializedCalendarRows: number;
    omittedLeadingRows: number;
    runnerCurrentDate: string;
    sourceKind: string;
    availability: {
      fixedRestDays: string[] | null;
      maxRunningDaysPerWeek: number | null;
    };
    cleanup: DisposableCleanupProof;
  }> = [];

  for (const draft of [...reviewedDrafts, largeReadbackDraft]) {
    const distanceGoal = distanceGoalSummary(draft);
    const disposableUser = await acquireQaPoolSupabaseUser({
      supabase,
      poolRole: "provider-engine",
      creationErrorMessage: "Disposable user creation failed.",
    });
    const userId = disposableUser.userId;
    let distanceGoalProof: Omit<(typeof persistedDistanceGoals)[number], "cleanup"> | null = null;
    let cleanupProof: DisposableCleanupProof | null = null;

    try {
      await persistReviewedDraftProfileSnapshot(userId, draft);
      const result = await confirmRunningPlanDraftForUser(
        userId,
        buildConfirmInputForConfirm(draft),
        { allowLocalQaFixture: true },
      );
      assert.equal(
        result.ok,
        true,
        `${distanceGoal.goalLabel} confirm should persist: ${JSON.stringify(result)}`,
      );
      if (!result.ok) throw new Error(result.message);

      const expectedMaterialization = await prepareExpectedSavedPlanMaterialization({
        supabase,
        userId,
        savedPlanId: result.savedPlanId,
      });
      const persisted = await loadPersistedPlanForUser(supabase, userId);
      assert.equal(persisted.plan.source_kind, draft.sourceKind);
      assert.equal(
        expectedMaterialization.savedPlan.planned_workouts.length,
        draft.canonicalRowCount,
      );
      assert.equal(
        expectedMaterialization.savedPlan.planned_workouts.filter(
          (workout) => workout.workout_type !== "rest",
        ).length,
        draft.canonicalNonRestRowCount,
      );
      assert.equal(
        persisted.workouts.length,
        expectedMaterialization.prepared.importedSeed.workouts.length,
      );
      assert.equal(
        persisted.workouts.filter((workout) => workout.workout_type !== "rest").length,
        expectedMaterialization.prepared.workoutCount,
      );
      assert.equal(
        result.calendarRowCount,
        expectedMaterialization.prepared.importedSeed.workouts.length,
      );
      assert.equal(result.appliedStartDate, expectedMaterialization.prepared.appliedStartDate);
      assert.deepEqual(
        persisted.workouts.map((workout) => workout.source_workout_id),
        expectedMaterialization.prepared.importedSeed.workouts.map(
          (workout) => workout.sourceWorkoutId,
        ),
        "Calendar materialization must preserve the retained source-row order after leading omission.",
      );
      assert.equal(
        (persisted.plan.goal_metadata as { selected_plan_engine?: { source_status?: string } })
          .selected_plan_engine?.source_status,
        "confirmed_selected_plan",
      );
      assert.equal(
        (persisted.plan.goal_metadata as { selected_plan_engine?: { review_checksum?: string } })
          .selected_plan_engine?.review_checksum,
        draft.reviewChecksum,
      );
      validateAiAuthoredPrimaryExecutionGuidance(persisted.workouts);
      validateNoClientRowsTrusted(persisted.workouts);

      if (draft.canonicalRowCount >= 210) {
        const snapshot = await getPersistedSnapshot(userId);
        assert.equal(snapshot.workouts.length, persisted.workouts.length);
        assert.equal(snapshot.planMeta?.id, persisted.plan.id);
        assert.deepEqual(
          snapshot.workouts.map((workout) => workout.id),
          persisted.workouts.map((workout) => workout.id),
          "Calendar/detail readback must preserve every persisted workout in order.",
        );
        const exportPayload = buildActivePlanExportPayload({
          planCycle: persisted.plan,
          workouts: persisted.workouts,
          exportedAt: "2026-07-27T12:00:00.000Z",
        });
        const reimported = activePlanExportToTrainingPlanV2(exportPayload);
        assert.equal(reimported.planned_workouts.length, persisted.workouts.length);
        assert.equal(buildImportedPlanSeed(reimported).workouts.length, persisted.workouts.length);
      }
      const persistedPlanPreferences = asJsonRecord(persisted.plan.plan_preferences);
      const expectedFixedRestDays = draft.normalizedInputSummary.fixedRestDays;
      const expectedMaxRunningDaysPerWeek = draft.normalizedInputSummary.daysPerWeek;
      assert.equal(
        Object.hasOwn(persistedPlanPreferences ?? {}, "blocked_days"),
        expectedFixedRestDays != null,
      );
      assert.deepEqual(persistedPlanPreferences?.blocked_days, expectedFixedRestDays ?? undefined);
      assert.equal(
        Object.hasOwn(persistedPlanPreferences ?? {}, "max_running_days_per_week"),
        expectedMaxRunningDaysPerWeek != null,
      );
      assert.equal(
        persistedPlanPreferences?.max_running_days_per_week,
        expectedMaxRunningDaysPerWeek ?? undefined,
      );
      assert.equal(persistedPlanPreferences?.preferred_running_days, undefined);
      assert.equal(
        persistedPlanPreferences?.preferred_long_run_day,
        draft.normalizedInputSummary.preferredLongRunDay ?? undefined,
      );
      assert.deepEqual(expectedMaterialization.savedPlan, draft.canonicalPlan);

      const duplicate = await confirmRunningPlanDraftForUser(
        userId,
        buildConfirmInputForConfirm(draft),
        { allowLocalQaFixture: true },
      );
      assert.equal(duplicate.ok, false);
      if (!duplicate.ok) {
        assert.equal(duplicate.reason, "replacement_required", JSON.stringify(duplicate));
      }

      distanceGoalProof = {
        goalLabel: distanceGoal.goalLabel,
        distanceMeters: distanceGoal.distanceMeters,
        savedSourceRows: expectedMaterialization.savedPlan.planned_workouts.length,
        materializedCalendarRows: persisted.workouts.length,
        omittedLeadingRows: expectedMaterialization.prepared.omittedLeadingDayCount,
        runnerCurrentDate: expectedMaterialization.prepared.currentDate,
        sourceKind: draft.sourceKind,
        availability: {
          fixedRestDays: expectedFixedRestDays,
          maxRunningDaysPerWeek: expectedMaxRunningDaysPerWeek,
        },
      };
    } finally {
      cleanupProof = await cleanupDisposableUser(supabase, disposableUser);
    }

    if (distanceGoalProof && cleanupProof) {
      persistedDistanceGoals.push({
        ...distanceGoalProof,
        cleanup: cleanupProof,
      });
    }
  }
  const creationFailureAtomic = await validateReviewedPlanPersistenceFailureAtomicity(supabase);
  const qaFixtureRuntime = await validateQaFixtureRuntimePersistence({
    supabase,
    preflight,
    previewInput: reviewedDrafts[0]!.previewInput,
    buildConfirmInputForConfirm,
  });
  const personalHeartRateProfile = await validatePersonalHeartRateProfilePersistence({
    supabase,
    preflight,
    previewInput: reviewedDrafts[0]!.previewInput,
    buildConfirmInputForConfirm,
  });
  const savedPlanLibrary = await validateSavedPlanLibraryPersistence({
    supabase,
    preflight,
    reviewedDrafts: [reviewedDrafts[0]!, reviewedDrafts[2]!],
  });

  return {
    mode: preflight.mode,
    target: preflight.target,
    persistedDistanceGoals,
    creationFailureAtomic,
    qaFixtureRuntime,
    personalHeartRateProfile,
    savedPlanLibrary,
  };
}

async function validateSavedPlanLibraryPersistence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  preflight: Extract<PersistencePreflight, { shouldRun: true }>;
  reviewedDrafts: [
    RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
    RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
  ];
}) {
  const owner = await acquireQaPoolSupabaseUser({
    supabase: input.supabase,
    poolRole: "provider-engine",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Saved-plan library owner creation failed.",
  });
  let otherRunner: QaPoolUserLease | null = null;

  try {
    otherRunner = await acquireQaPoolSupabaseUser({
      supabase: input.supabase,
      poolRole: "isolation-a",
      password: DISPOSABLE_TEST_PASSWORD,
      creationErrorMessage: "Saved-plan library RLS runner creation failed.",
    });
    await persistReviewedDraftProfileSnapshot(owner.userId, input.reviewedDrafts[0]);

    const savedRecords = [];
    for (const draft of input.reviewedDrafts) {
      savedRecords.push(
        await retainReviewedPlanCandidateForUser({
          userId: owner.userId,
          canonicalPlan: draft.canonicalPlan,
          reviewChecksum: draft.reviewChecksum,
          planMetadata: buildRunningPlanPersistenceMetadata({
            draft,
            canonicalPlan: draft.canonicalPlan,
            reviewChecksum: draft.reviewChecksum,
          }),
        }),
      );
    }

    assert.notEqual(savedRecords[0]!.id, savedRecords[1]!.id);
    const unappliedWorkoutCount = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId);
    assert.equal(unappliedWorkoutCount.error, null);
    assert.equal(unappliedWorkoutCount.count, 0);

    const availableByCreated = await listSavedPlanLibraryForUser(owner.userId);
    assert.equal(availableByCreated.length, 2);
    assert.ok(
      availableByCreated[0]!.createdAt >= availableByCreated[1]!.createdAt,
      "Default saved-plan ordering must be newest first.",
    );
    const byTitle = await listSavedPlanLibraryForUser(owner.userId, {
      recordState: "all",
      sort: "title",
      direction: "asc",
    });
    assert.deepEqual(
      byTitle.map((record) => record.title),
      byTitle
        .map((record) => record.title)
        .slice()
        .sort((a, b) => a.localeCompare(b)),
    );
    const searched = await listSavedPlanLibraryForUser(owner.userId, {
      search: savedRecords[0]!.goal_summary,
      recordState: "all",
    });
    assert.ok(searched.some((record) => record.id === savedRecords[0]!.id));
    assert.equal(
      (
        await listSavedPlanLibraryForUser(owner.userId, {
          recordState: "all",
          sourceKind: "not_a_saved_plan_source",
        })
      ).length,
      0,
    );

    const exported = await exportSavedPlanForUser(owner.userId, savedRecords[0]!.id, "json");
    const exportedPlan = JSON.parse(exported.body) as {
      plan_name: string;
      planned_workouts: unknown[];
    };
    assert.equal(exportedPlan.plan_name, savedRecords[0]!.title);
    assert.equal(
      exportedPlan.planned_workouts.length,
      input.reviewedDrafts[0].canonicalPlan.planned_workouts.length,
    );
    await assert.rejects(
      exportSavedPlanForUser(otherRunner.userId, savedRecords[0]!.id, "json"),
      /selected saved plan was not found/i,
    );

    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    assert.ok(publishableKey, "Saved-plan library RLS proof requires a publishable key.");
    const ownerClient = createClient<Database>(input.preflight.target.url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const otherClient = createClient<Database>(input.preflight.target.url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    assert.equal(
      (
        await ownerClient.auth.signInWithPassword({
          email: owner.email,
          password: DISPOSABLE_TEST_PASSWORD,
        })
      ).error,
      null,
    );
    assert.equal(
      (
        await otherClient.auth.signInWithPassword({
          email: otherRunner.email,
          password: DISPOSABLE_TEST_PASSWORD,
        })
      ).error,
      null,
    );
    const ownerLibraryRows = await ownerClient
      .from("plan_cycles")
      .select("id")
      .not("saved_plan_payload", "is", null);
    assert.equal(ownerLibraryRows.error, null);
    assert.equal(ownerLibraryRows.data.length, 2);
    const foreignLibraryRows = await otherClient
      .from("plan_cycles")
      .select("id")
      .in(
        "id",
        savedRecords.map((record) => record.id),
      );
    assert.equal(foreignLibraryRows.error, null);
    assert.equal(foreignLibraryRows.data.length, 0);
    const directSavedPlanInsert = {
      id: crypto.randomUUID(),
      user_id: owner.userId,
      status: "archived" as const,
      title: savedRecords[0]!.title,
      goal_summary: savedRecords[0]!.goal_summary,
      source_template: savedRecords[0]!.source_template,
      schema_version: savedRecords[0]!.schema_version,
      source_kind: savedRecords[0]!.source_kind,
      start_date: savedRecords[0]!.start_date,
      end_date: savedRecords[0]!.end_date,
      target_date: savedRecords[0]!.target_date,
      goal_metadata: savedRecords[0]!.goal_metadata,
      plan_preferences: savedRecords[0]!.plan_preferences,
      saved_plan_payload: savedRecords[0]!.saved_plan_payload,
      saved_plan_review_checksum: "1".repeat(64),
      library_removed_at: null,
    };
    const directAuthenticatedSavedInsert = await ownerClient
      .from("plan_cycles")
      .insert(directSavedPlanInsert);
    assert.notEqual(directAuthenticatedSavedInsert.error, null);
    const activeSavedInsert = await input.supabase.from("plan_cycles").insert({
      ...directSavedPlanInsert,
      id: crypto.randomUUID(),
      status: "active",
      saved_plan_review_checksum: "2".repeat(64),
    });
    assert.notEqual(activeSavedInsert.error, null);

    const validStartIntent = savedPlanStartInputSchema.safeParse({
      savedPlanId: savedRecords[0]!.id,
      intent: "replace_future_workouts",
      requestedStartDate: "2026-08-13",
      fixedRestDays: ["Monday", "Wednesday"],
      preferredLongRunDay: "Sunday",
    });
    assert.equal(validStartIntent.success, true);
    assert.equal(
      savedPlanStartInputSchema.safeParse({
        savedPlanId: savedRecords[0]!.id,
        intent: "replace_future_workouts",
        requestedStartDate: "2026-02-30",
      }).success,
      false,
    );
    assert.equal(
      savedPlanStartInputSchema.safeParse({
        savedPlanId: savedRecords[0]!.id,
        intent: "replace_future_workouts",
        fixedRestDays: ["Monday", "Monday"],
      }).success,
      false,
    );
    assert.equal(
      savedPlanStartInputSchema.safeParse({
        savedPlanId: savedRecords[0]!.id,
        intent: "replace_future_workouts",
        fixedRestDays: ["Sunday"],
        preferredLongRunDay: "Sunday",
      }).success,
      false,
    );

    const fiveDayPlan = buildFiveDaySavedPlanFixture(input.reviewedDrafts[0].canonicalPlan);
    assert.deepEqual([...countTrainingPlanNonRestByWeek(fiveDayPlan).values()], Array(8).fill(5));
    const fiveDayAligned = prepareSavedPlanFutureApplyPolicy(
      fiveDayPlan,
      "2026-06-08",
      {
        blocked_days: ["Wednesday", "Saturday"],
        preferred_long_run_day: "Sunday",
        max_running_days_per_week: 5,
      },
      {
        fixedRestDays: ["Monday", "Wednesday"],
        preferredLongRunDay: "Sunday",
      },
    );
    assert.equal(fiveDayAligned.resolvedStartDate, "2026-06-09");
    const alignedFiveDayCounts = countImportedSeedNonRestByWeek(fiveDayAligned.importedSeed);
    assert.equal(alignedFiveDayCounts.values().next().value, 4);
    assert.deepEqual([...alignedFiveDayCounts.values()].slice(1), Array(7).fill(5));
    assert.equal(
      fiveDayAligned.importedSeed.workouts.some(
        (workout) =>
          workout.workoutType !== "rest" &&
          ["Monday", "Wednesday"].includes(weekdayLong(workout.workoutDate)),
      ),
      false,
    );
    assert.equal(
      fiveDayAligned.importedSeed.workouts.every(
        (workout) =>
          workout.workoutType !== "long_run" || weekdayLong(workout.workoutDate) === "Sunday",
      ),
      true,
    );
    const fiveDaySourceOrder = fiveDayPlan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.workout_id);
    const fiveDayProjectedOrder = fiveDayAligned.importedSeed.workouts
      .filter((workout) => workout.workoutType !== "rest")
      .map((workout) => workout.sourceWorkoutId);
    assert.deepEqual(
      fiveDayProjectedOrder,
      fiveDaySourceOrder.slice(fiveDaySourceOrder.indexOf(fiveDayProjectedOrder[0]!)),
    );
    const explicitStartAlignment = prepareSavedPlanFutureApplyPolicy(
      fiveDayPlan,
      "2026-06-08",
      {
        blocked_days: ["Wednesday", "Saturday"],
        preferred_long_run_day: "Sunday",
        max_running_days_per_week: 5,
      },
      {
        requestedStartDate: "2026-06-11",
        fixedRestDays: ["Monday", "Wednesday"],
        preferredLongRunDay: "Sunday",
      },
    );
    assert.equal(explicitStartAlignment.resolvedStartDate, "2026-06-11");
    assert.ok(explicitStartAlignment.omittedLeadingDayCount > 0);
    assert.ok(
      explicitStartAlignment.importedSeed.workouts.every(
        (workout) => workout.workoutDate >= "2026-06-11",
      ),
    );
    assert.throws(
      () =>
        prepareSavedPlanFutureApplyPolicy(fiveDayPlan, "2026-06-08", {
          blocked_days: ["Wednesday", "Saturday"],
          preferred_long_run_day: "Sunday",
          max_running_days_per_week: 4,
        }),
      /more than 4 running days/i,
    );
    assert.throws(
      () =>
        prepareSavedPlanFutureApplyPolicy(
          fiveDayPlan,
          "2026-06-08",
          {
            blocked_days: ["Wednesday", "Saturday"],
            preferred_long_run_day: "Sunday",
            max_running_days_per_week: 5,
          },
          {
            fixedRestDays: ["Monday", "Tuesday", "Wednesday"],
            preferredLongRunDay: "Sunday",
          },
        ),
      /only 4 compatible weekdays/i,
    );

    const deterministicLeadingOmission = prepareSavedPlanFutureApplyPolicy(
      input.reviewedDrafts[0].canonicalPlan,
      "2026-08-12",
      null,
    );
    assert.ok(deterministicLeadingOmission.omittedLeadingDayCount > 0);
    assert.equal(deterministicLeadingOmission.resolvedStartDate, "2026-08-13");
    assert.ok(deterministicLeadingOmission.appliedStartDate >= "2026-08-12");
    const deterministicProjectedWorkouts =
      deterministicLeadingOmission.importedSeed.workouts.filter(
        (workout) => workout.workoutType !== "rest",
      );
    const deterministicSourceOrder = input.reviewedDrafts[0].canonicalPlan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.workout_id);
    assert.deepEqual(
      deterministicProjectedWorkouts.map((workout) => workout.sourceWorkoutId),
      deterministicSourceOrder.slice(
        deterministicSourceOrder.indexOf(deterministicProjectedWorkouts[0]!.sourceWorkoutId),
      ),
    );
    assert.equal(
      deterministicProjectedWorkouts.some((workout) =>
        ["Wednesday", "Saturday"].includes(weekdayLong(workout.workoutDate)),
      ),
      false,
    );
    assert.equal(
      deterministicProjectedWorkouts.every(
        (workout) =>
          workout.workoutType !== "long_run" || weekdayLong(workout.workoutDate) === "Sunday",
      ),
      true,
    );

    const firstRecordBeforeApply = await getSavedPlanRecordForUser(
      owner.userId,
      savedRecords[0]!.id,
    );
    const profilePreferencesBeforeApply = await input.supabase
      .from("runner_profiles")
      .select("training_preferences")
      .eq("user_id", owner.userId)
      .single();
    assert.equal(profilePreferencesBeforeApply.error, null);
    const runnerCurrentDate = await getRunnerCalendarDateForUserId(owner.userId);
    const requestedStartDate = nextDateForWeekday(runnerCurrentDate, "Tuesday");
    const calendarBeforeImpossibleStart = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId);
    assert.equal(calendarBeforeImpossibleStart.error, null);
    await assert.rejects(
      applySavedPlanRecordForUser(owner.userId, savedRecords[0]!.id, "apply_if_future_empty", {
        fixedRestDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        preferredLongRunDay: "Sunday",
      }),
      /Leave at least one weekday available for running/i,
    );
    const calendarAfterImpossibleStart = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId);
    assert.deepEqual(calendarAfterImpossibleStart, calendarBeforeImpossibleStart);
    const emptyFutureApply = await applySavedPlanRecordForUser(
      owner.userId,
      savedRecords[0]!.id,
      "apply_if_future_empty",
      {
        requestedStartDate,
        fixedRestDays: ["Monday", "Wednesday"],
        preferredLongRunDay: "Sunday",
      },
    );
    assert.equal(emptyFutureApply.ok, true);
    if (!emptyFutureApply.ok) {
      throw new Error("Empty-future saved-plan apply unexpectedly required replacement.");
    }
    assert.equal(emptyFutureApply.callsOpenAi, false);
    assert.equal(emptyFutureApply.resolvedStartDate, requestedStartDate);
    const profilePreferencesAfterApply = await input.supabase
      .from("runner_profiles")
      .select("training_preferences")
      .eq("user_id", owner.userId)
      .single();
    assert.deepEqual(profilePreferencesAfterApply, profilePreferencesBeforeApply);
    const activeAfterEmptyApply = await input.supabase
      .from("plan_cycles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId)
      .eq("status", "active");
    assert.equal(activeAfterEmptyApply.error, null);
    assert.equal(activeAfterEmptyApply.count, 0);
    const emptyApplyRows = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId)
      .eq("plan_cycle_id", emptyFutureApply.materializedPlanId);
    assert.equal(emptyApplyRows.error, null);
    assert.equal(emptyApplyRows.count, emptyFutureApply.calendarRowCount);
    const alignedCalendarRows = await input.supabase
      .from("planned_workouts")
      .select("workout_date, workout_type, source_workout_id")
      .eq("user_id", owner.userId)
      .eq("plan_cycle_id", emptyFutureApply.materializedPlanId)
      .order("workout_date")
      .order("display_order");
    assert.equal(alignedCalendarRows.error, null);
    assert.equal(
      alignedCalendarRows.data.some(
        (workout) =>
          workout.workout_type !== "rest" &&
          ["Monday", "Wednesday"].includes(weekdayLong(workout.workout_date)),
      ),
      false,
    );
    assert.equal(
      alignedCalendarRows.data.every(
        (workout) =>
          workout.workout_type !== "long_run" || weekdayLong(workout.workout_date) === "Sunday",
      ),
      true,
    );
    const materializedPlanPreferences = await input.supabase
      .from("plan_cycles")
      .select("plan_preferences")
      .eq("id", emptyFutureApply.materializedPlanId)
      .single();
    assert.equal(materializedPlanPreferences.error, null);
    assert.deepEqual(
      (materializedPlanPreferences.data.plan_preferences as Record<string, Json>).blocked_days,
      ["Monday", "Wednesday"],
    );
    assert.equal(
      (materializedPlanPreferences.data.plan_preferences as Record<string, Json>)
        .preferred_long_run_day,
      "Sunday",
    );
    const directAuthenticatedConversion = await ownerClient
      .from("plan_cycles")
      .update({
        saved_plan_payload: savedRecords[0]!.saved_plan_payload,
        saved_plan_review_checksum: "3".repeat(64),
      })
      .eq("id", emptyFutureApply.materializedPlanId);
    assert.notEqual(directAuthenticatedConversion.error, null);
    const serviceRoleConversion = await input.supabase
      .from("plan_cycles")
      .update({
        saved_plan_payload: savedRecords[0]!.saved_plan_payload,
        saved_plan_review_checksum: "4".repeat(64),
      })
      .eq("id", emptyFutureApply.materializedPlanId);
    assert.notEqual(serviceRoleConversion.error, null);
    assert.deepEqual(
      await getSavedPlanRecordForUser(owner.userId, savedRecords[0]!.id),
      firstRecordBeforeApply,
    );

    const futureBeforeRemoval = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", emptyFutureApply.currentDate)
      .order("id");
    assert.equal(futureBeforeRemoval.error, null);
    const removed = await logicallyRemoveSavedPlanRecordForUser(owner.userId, savedRecords[0]!.id);
    assert.equal(removed.recordState, "removed");
    const futureAfterRemoval = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", emptyFutureApply.currentDate)
      .order("id");
    assert.deepEqual(futureAfterRemoval.data, futureBeforeRemoval.data);
    assert.equal((await listSavedPlanLibraryForUser(owner.userId)).length, 1);
    assert.equal(
      (
        await listSavedPlanLibraryForUser(owner.userId, {
          recordState: "removed",
        })
      )[0]?.id,
      savedRecords[0]!.id,
    );
    const immutableTitleAttempt = await ownerClient
      .from("plan_cycles")
      .update({ title: "Mutated saved plan" })
      .eq("id", savedRecords[0]!.id);
    assert.notEqual(immutableTitleAttempt.error, null);
    const immutableIdAttempt = await input.supabase
      .from("plan_cycles")
      .update({ id: crypto.randomUUID() })
      .eq("id", savedRecords[0]!.id);
    assert.notEqual(immutableIdAttempt.error, null);

    const materializedWorkout = await input.supabase
      .from("planned_workouts")
      .select("*")
      .eq("user_id", owner.userId)
      .eq("plan_cycle_id", emptyFutureApply.materializedPlanId)
      .order("workout_date")
      .limit(1)
      .single();
    assert.equal(materializedWorkout.error, null);
    assert.ok(materializedWorkout.data);
    const protectedWorkoutId = crypto.randomUUID();
    const protectedLogId = crypto.randomUUID();
    const protectedAssetId = crypto.randomUUID();
    const protectedDate = addDaysIso(emptyFutureApply.currentDate, -1);
    const protectedInsert = await input.supabase.from("planned_workouts").insert({
      ...materializedWorkout.data!,
      id: protectedWorkoutId,
      workout_date: protectedDate,
      weekday: weekdayLong(protectedDate),
      source_workout_id: `protected-${protectedWorkoutId}`,
      display_order: materializedWorkout.data!.display_order + 10_000,
      created_at: new Date().toISOString(),
    });
    assert.equal(protectedInsert.error, null);
    const protectedLog = await input.supabase.from("workout_logs").insert({
      id: protectedLogId,
      user_id: owner.userId,
      planned_workout_id: protectedWorkoutId,
      outcome: "completed",
      notes: "Protected saved-plan apply proof",
    });
    assert.equal(protectedLog.error, null);
    const protectedAsset = await input.supabase.from("workout_result_assets").insert({
      id: protectedAssetId,
      user_id: owner.userId,
      planned_workout_id: protectedWorkoutId,
      workout_log_id: protectedLogId,
      asset_kind: "garmin_fit",
      storage_bucket: "workout-result-assets",
      storage_path: `local-proof/${protectedAssetId}.fit`,
      original_file_name: "protected.fit",
      mime_type: "application/octet-stream",
      file_size_bytes: 128,
      parse_status: "parsed",
      primary_file_kind: "fit",
      primary_file_name: "protected.fit",
    });
    assert.equal(protectedAsset.error, null);

    const futureIdsBeforeDecline = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", emptyFutureApply.currentDate)
      .order("id");
    const declined = await applySavedPlanRecordForUser(
      owner.userId,
      savedRecords[1]!.id,
      "keep_future_workouts",
    );
    assert.equal(declined.ok, false);
    assert.equal(declined.status, "not_applied");
    const replacementRequired = await applySavedPlanRecordForUser(
      owner.userId,
      savedRecords[1]!.id,
      "apply_if_future_empty",
    );
    assert.equal(replacementRequired.ok, false);
    assert.equal(replacementRequired.status, "replacement_required");
    const futureIdsAfterDecline = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", emptyFutureApply.currentDate)
      .order("id");
    assert.deepEqual(futureIdsAfterDecline.data, futureIdsBeforeDecline.data);

    const secondRecordBeforeApply = await getSavedPlanRecordForUser(
      owner.userId,
      savedRecords[1]!.id,
    );
    const replaced = await applySavedPlanRecordForUser(
      owner.userId,
      savedRecords[1]!.id,
      "replace_future_workouts",
    );
    assert.equal(replaced.ok, true);
    if (!replaced.ok) {
      throw new Error("Explicit future replacement did not apply the selected saved plan.");
    }
    assert.ok(replaced.replacedFutureWorkoutCount > 0);
    const activeAfterReplacement = await input.supabase
      .from("plan_cycles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId)
      .eq("status", "active");
    assert.equal(activeAfterReplacement.error, null);
    assert.equal(activeAfterReplacement.count, 0);
    const replacementRows = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId)
      .eq("plan_cycle_id", replaced.materializedPlanId);
    assert.equal(replacementRows.error, null);
    assert.equal(replacementRows.count, replaced.calendarRowCount);
    assert.deepEqual(
      await getSavedPlanRecordForUser(owner.userId, savedRecords[1]!.id),
      secondRecordBeforeApply,
    );
    const [protectedWorkoutAfter, protectedLogAfter, protectedAssetAfter] = await Promise.all([
      input.supabase.from("planned_workouts").select("*").eq("id", protectedWorkoutId).single(),
      input.supabase.from("workout_logs").select("*").eq("id", protectedLogId).single(),
      input.supabase.from("workout_result_assets").select("*").eq("id", protectedAssetId).single(),
    ]);
    assert.equal(protectedWorkoutAfter.error, null);
    assert.equal(protectedLogAfter.error, null);
    assert.equal(protectedAssetAfter.error, null);
    assert.equal(protectedLogAfter.data.planned_workout_id, protectedWorkoutId);
    assert.equal(protectedAssetAfter.data.planned_workout_id, protectedWorkoutId);
    assert.equal(protectedAssetAfter.data.workout_log_id, protectedLogId);

    const futureProtectedWorkout = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", replaced.currentDate)
      .order("workout_date")
      .limit(1)
      .single();
    assert.equal(futureProtectedWorkout.error, null);
    assert.ok(futureProtectedWorkout.data);
    const futureProtectedLogId = crypto.randomUUID();
    const futureProtectedLog = await input.supabase.from("workout_logs").insert({
      id: futureProtectedLogId,
      user_id: owner.userId,
      planned_workout_id: futureProtectedWorkout.data!.id,
      outcome: "completed",
      notes: "Protected future saved-plan apply proof",
    });
    assert.equal(futureProtectedLog.error, null);
    const protectedFutureBefore = await Promise.all([
      input.supabase
        .from("planned_workouts")
        .select("id, plan_cycle_id, workout_date")
        .eq("user_id", owner.userId)
        .order("id"),
      input.supabase
        .from("workout_logs")
        .select("id, planned_workout_id")
        .eq("user_id", owner.userId)
        .order("id"),
    ]);
    await assert.rejects(
      applySavedPlanRecordForUser(owner.userId, savedRecords[1]!.id, "replace_future_workouts"),
      (error: unknown) =>
        error instanceof CalendarPersistenceRejection &&
        error.reason === "protected_future_schedule",
    );
    const protectedFutureAfter = await Promise.all([
      input.supabase
        .from("planned_workouts")
        .select("id, plan_cycle_id, workout_date")
        .eq("user_id", owner.userId)
        .order("id"),
      input.supabase
        .from("workout_logs")
        .select("id, planned_workout_id")
        .eq("user_id", owner.userId)
        .order("id"),
    ]);
    assert.deepEqual(protectedFutureAfter, protectedFutureBefore);

    return {
      retainedBeforeApply: 2,
      unappliedCalendarRows: unappliedWorkoutCount.count,
      logicalRemovalPreservedCalendar: true,
      selectedExportIsolated: true,
      rlsIsolation: true,
      directSavedRecordWritesRejected: true,
      savedRecordIdentityImmutable: true,
      startInputStrictlyValidated: true,
      fiveDayWeeklyCountPreserved: true,
      oneTimeSchedulePreferencesPersistedToSettings: false,
      scheduleAlignedRestAndLongRunDays: true,
      impossibleScheduleWasNoOp: true,
      emptyFutureApplied: true,
      declineWasNoOp: true,
      explicitFutureReplacement: true,
      materializedProvenanceNonActive: true,
      protectedFutureReplacementRejected: true,
      leadingDaysOmitted: deterministicLeadingOmission.omittedLeadingDayCount,
      protectedHistoryPreserved: true,
      callsOpenAi: false,
    };
  } finally {
    if (otherRunner) {
      await cleanupDisposableUser(input.supabase, otherRunner);
    }
    await cleanupDisposableUser(input.supabase, owner);
  }
}

function buildFiveDaySavedPlanFixture(canonicalPlan: TrainingPlanV2): TrainingPlanV2 {
  const plan = structuredClone(canonicalPlan);
  const workoutsByWeek = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of plan.planned_workouts) {
    const workouts = workoutsByWeek.get(workout.week_number) ?? [];
    workouts.push(workout);
    workoutsByWeek.set(workout.week_number, workouts);
  }

  for (const [weekNumber, workouts] of workoutsByWeek) {
    const currentCount = workouts.filter((workout) => workout.workout_type !== "rest").length;
    assert.equal(
      currentCount,
      4,
      `Five-day proof fixture expected four source runs in week ${weekNumber}.`,
    );
    const sourceWorkout =
      workouts.find((workout) => workout.workout_type === "easy") ??
      workouts.find((workout) => workout.workout_type !== "rest");
    const restWorkout = workouts.find(
      (workout) => workout.workout_type === "rest" && workout.weekday !== "Sunday",
    );

    assert.ok(sourceWorkout, `Five-day proof fixture needs a source run in week ${weekNumber}.`);
    assert.ok(
      restWorkout,
      `Five-day proof fixture needs a replaceable rest in week ${weekNumber}.`,
    );
    const { date, weekday, week_number: retainedWeekNumber } = restWorkout;
    Object.assign(restWorkout, structuredClone(sourceWorkout), {
      workout_id: `${sourceWorkout.workout_id}-fifth-${weekNumber}`,
      date,
      weekday,
      week_number: retainedWeekNumber,
      title: "Fifth Easy Run",
    });
  }

  return plan;
}

function countTrainingPlanNonRestByWeek(plan: TrainingPlanV2) {
  const countByWeek = new Map<string, number>();
  for (const workout of plan.planned_workouts) {
    if (workout.workout_type === "rest") {
      continue;
    }

    const week = startOfWeekIso(workout.date);
    countByWeek.set(week, (countByWeek.get(week) ?? 0) + 1);
  }
  return countByWeek;
}

function countImportedSeedNonRestByWeek(seed: ReturnType<typeof buildImportedPlanSeed>) {
  const countByWeek = new Map<string, number>();
  for (const workout of seed.workouts) {
    if (workout.workoutType === "rest") {
      continue;
    }

    const week = startOfWeekIso(workout.workoutDate);
    countByWeek.set(week, (countByWeek.get(week) ?? 0) + 1);
  }
  return countByWeek;
}

function nextDateForWeekday(currentDate: string, expectedWeekday: string) {
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDaysIso(currentDate, offset);
    if (weekdayLong(candidate) === expectedWeekday) {
      return candidate;
    }
  }

  throw new Error(`Could not resolve the next ${expectedWeekday} from ${currentDate}.`);
}

async function buildLargeReadbackReviewedDraft() {
  const fixture = buildLargeReadbackProviderFixture();
  const reviewed = await buildReviewedAiGeneratedRunningPlanPreview(fixture.input, {
    runnerProfileSnapshot: buildProofPersonalRunnerProfileSnapshot(fixture.input),
    aiPreview: {
      apiKey: "large-readback-capacity-proof",
      model: "large-readback-capacity-proof",
      generationLedger: { disabled: true },
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            id: "resp_large_readback_capacity",
            status: "completed",
            output_text: JSON.stringify(fixture.draft),
            usage: { input_tokens: 100, output_tokens: 100, total_tokens: 200 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    },
  });
  assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
  if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
  assert.equal(reviewed.draft.canonicalNonRestRowCount, 211);
  assert.ok(
    reviewed.draft.canonicalRowCount >= 210,
    "Large readback proof must retain at least the reported 210 persisted calendar rows.",
  );
  return reviewed.draft;
}

async function validateQaFixtureRuntimePersistence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  preflight: Extract<PersistencePreflight, { shouldRun: true }>;
  previewInput: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>["previewInput"];
  buildConfirmInputForConfirm: BuildConfirmInputForConfirm;
}) {
  const disposableUser = await acquireQaPoolSupabaseUser({
    supabase: input.supabase,
    poolRole: "provider-engine",
    creationErrorMessage: "Disposable QA fixture user creation failed.",
  });
  const envKeys = [
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
    AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
    "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
    "LOCAL_AUTH_BYPASS_ENABLED",
    "NEXT_PUBLIC_SUPABASE_URL",
  ] as const;
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  let proof: {
    providerCalls: number;
    savedSourceRows: number;
    materializedCalendarRows: number;
    omittedLeadingRows: number;
    runnerCurrentDate: string;
    sourceKind: string;
    responseId: string;
    reviewChecksum: string;
    persistedResponseId: string;
    transientContextAbsent: true;
  } | null = null;
  let cleanup: DisposableCleanupProof | null = null;
  let providerCalls = 0;
  const transientContextCanary = `private-plan-context-${crypto.randomUUID()}`;

  try {
    process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = "true";
    process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV] = "non_repeat_tempo";
    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "qa_fixture";
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE;
    process.env.LOCAL_AUTH_BYPASS_ENABLED = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = input.preflight.target.url;

    const firstTimeReadback = buildFirstTimeRunnerBaselineReadback({
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    await updateUserSettingsForUserId(
      disposableUser.userId,
      {
        firstName: "QA",
        lastName: "Fixture",
        displayName: "QA Fixture",
        age: input.previewInput.age,
        weightKg: input.previewInput.weightKg,
        heightCm: input.previewInput.heightCm,
        fitnessLevel: "running_regularly",
        heartRateProfile: {
          zones: firstTimeReadback.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
            reference,
            minBpm,
            maxBpm,
          })),
        },
      },
      disposableUser.email,
    );

    const reviewed = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      disposableUser.userId,
      {
        ...input.previewInput,
        runnerComment: transientContextCanary,
      },
      {
        qaFixtureAuthorized: true,
        aiPreview: {
          apiKey: "must-not-reach-provider",
          model: "must-not-reach-provider",
          fetchImpl: async () => {
            providerCalls += 1;
            throw new Error("QA fixture runtime reached the provider transport.");
          },
          generationLedger: { disabled: true },
        },
      },
    );
    assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
    if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
    assert.equal(reviewed.draft.callsOpenAi, false);
    assert.equal(reviewed.draft.aiGeneration.generationTrace?.provider.kind, "local_dev_fixture");
    assert.equal(
      reviewed.draft.aiGeneration.responseId,
      AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
    );
    assert.equal(JSON.stringify(reviewed.draft).includes(transientContextCanary), false);

    const confirmed = await confirmRunningPlanDraftForUser(
      disposableUser.userId,
      input.buildConfirmInputForConfirm(reviewed.draft),
      { allowLocalQaFixture: true },
    );
    assert.equal(confirmed.ok, true, JSON.stringify(confirmed));
    if (!confirmed.ok) throw new Error(confirmed.message);
    assert.equal(providerCalls, 0);

    const expectedMaterialization = await prepareExpectedSavedPlanMaterialization({
      supabase: input.supabase,
      userId: disposableUser.userId,
      savedPlanId: confirmed.savedPlanId,
    });
    const persisted = await loadPersistedPlanForUser(input.supabase, disposableUser.userId);
    assert.equal(
      expectedMaterialization.savedPlan.planned_workouts.length,
      reviewed.draft.canonicalRowCount,
    );
    assert.equal(
      persisted.workouts.length,
      expectedMaterialization.prepared.importedSeed.workouts.length,
    );
    assert.equal(confirmed.calendarRowCount, persisted.workouts.length);
    assert.equal(persisted.plan.source_kind, reviewed.draft.sourceKind);
    const persistedJson = JSON.stringify(persisted);
    assert.equal(persistedJson.includes(transientContextCanary), false);
    assert.doesNotMatch(persistedJson, /"runnerComment"|"requestContext"|"plan_request_comment"/);
    validateAiAuthoredPrimaryExecutionGuidance(persisted.workouts);
    validateNoClientRowsTrusted(persisted.workouts);
    const persistedEngineMetadata = (
      persisted.plan.goal_metadata as {
        selected_plan_engine?: {
          review_checksum?: string;
          ai_generation?: {
            response_id?: string;
          };
        };
      }
    ).selected_plan_engine;
    assert.equal(persistedEngineMetadata?.review_checksum, reviewed.draft.reviewChecksum);
    assert.equal(
      persistedEngineMetadata?.ai_generation?.response_id,
      AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
    );
    const exportPayload = buildActivePlanExportPayload({
      planCycle: persisted.plan,
      workouts: persisted.workouts,
      exportedAt: "2026-07-26T12:00:00.000Z",
    });
    assert.equal(JSON.stringify(exportPayload).includes(transientContextCanary), false);
    assert.equal(
      JSON.stringify(activePlanExportToTrainingPlanV2(exportPayload)).includes(
        transientContextCanary,
      ),
      false,
    );

    proof = {
      providerCalls,
      savedSourceRows: expectedMaterialization.savedPlan.planned_workouts.length,
      materializedCalendarRows: persisted.workouts.length,
      omittedLeadingRows: expectedMaterialization.prepared.omittedLeadingDayCount,
      runnerCurrentDate: expectedMaterialization.prepared.currentDate,
      sourceKind: persisted.plan.source_kind,
      responseId: AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
      reviewChecksum: reviewed.draft.reviewChecksum,
      persistedResponseId: AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
      transientContextAbsent: true,
    };
  } finally {
    cleanup = await cleanupDisposableUser(input.supabase, disposableUser);
    for (const key of envKeys) {
      const value = previousEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    assert.ok(cleanup);
  }

  if (!proof || !cleanup) {
    throw new Error("QA fixture runtime persistence proof did not complete.");
  }

  return {
    ...proof,
    cleanup,
  };
}

function asJsonRecord(value: Json | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

async function persistReviewedDraftProfileSnapshot(
  userId: string,
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  const snapshot = draft.normalizedInputSummary.runnerProfileSnapshot;

  await updateUserSettingsForUserId(userId, {
    firstName: null,
    lastName: null,
    displayName: null,
    age: snapshot.age,
    weightKg: snapshot.weightKg,
    heightCm: snapshot.heightCm,
    fitnessLevel: snapshot.fitnessLevel,
    heartRateProfile: {
      zones: snapshot.heartRateProfile.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
    },
  });
}

async function validatePersonalHeartRateProfilePersistence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  preflight: Extract<PersistencePreflight, { shouldRun: true }>;
  previewInput: RunningPlanPreviewDraft["previewInput"];
  buildConfirmInputForConfirm: BuildConfirmInputForConfirm;
}) {
  const owner = await acquireQaPoolSupabaseUser({
    supabase: input.supabase,
    poolRole: "isolation-a",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Disposable personal-HR owner creation failed.",
  });
  let otherRunner: QaPoolUserLease | null = null;

  try {
    otherRunner = await acquireQaPoolSupabaseUser({
      supabase: input.supabase,
      poolRole: "isolation-b",
      password: DISPOSABLE_TEST_PASSWORD,
      creationErrorMessage: "Disposable personal-HR RLS runner creation failed.",
    });
    const firstTimeReadback = buildFirstTimeRunnerBaselineReadback({
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    assert.equal(firstTimeReadback.heartRateZones.source, "estimated");
    assert.equal(firstTimeReadback.heartRateZones.accepted, false);

    const acceptedEstimated = await updateUserSettingsForUserId(
      owner.userId,
      {
        firstName: "Local",
        lastName: "Runner",
        displayName: "Local Runner",
        age: input.previewInput.age,
        weightKg: input.previewInput.weightKg,
        heightCm: input.previewInput.heightCm,
        fitnessLevel: "running_regularly",
        heartRateProfile: {
          zones: firstTimeReadback.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
            reference,
            minBpm,
            maxBpm,
          })),
        },
      },
      owner.email,
    );
    await updateUserSettingsForUserId(otherRunner.userId, {
      firstName: null,
      lastName: null,
      displayName: null,
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
      heartRateProfile: { zones: [...PERSONAL_HEART_RATE_ZONES] },
    });

    const baselineRows = await loadBaselineOnlyCounts(input.supabase, owner.userId);
    assert.deepEqual(baselineRows, { profiles: 1, plans: 0, workouts: 0 });

    const settingsBeforeInvalidBaseline = await getUserSettingsForUserId(owner.userId, owner.email);
    await assert.rejects(
      updateUserSettingsForUserId(
        owner.userId,
        {
          firstName: "Local",
          lastName: "Runner",
          displayName: "Local Runner",
          age: input.previewInput.age,
          weightKg: input.previewInput.weightKg,
          heightCm: 50,
          fitnessLevel: "running_regularly",
        },
        owner.email,
      ),
    );
    assert.deepEqual(
      await getUserSettingsForUserId(owner.userId, owner.email),
      settingsBeforeInvalidBaseline,
      "Invalid Settings baseline values must be rejected before profile persistence.",
    );

    const unavailablePreview = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      owner.userId,
      input.previewInput,
      {
        aiPreview: {
          apiKey: "local-provider-unavailable-proof",
          generationLedger: { disabled: true },
          fetchImpl: async () =>
            new Response(JSON.stringify({ error: { type: "provider_unavailable" } }), {
              status: 503,
              headers: { "content-type": "application/json" },
            }),
        },
      },
    );
    assert.equal(unavailablePreview.ok, false);
    assert.deepEqual(await loadBaselineOnlyCounts(input.supabase, owner.userId), baselineRows);

    const defaultSettings = await getUserSettingsForUserId(owner.userId, owner.email);
    assert.equal(defaultSettings?.heartRateZones.source, "estimated");
    assert.equal(defaultSettings?.heartRateZones.accepted, true);
    assert.equal(defaultSettings?.fitnessLevel, "running_regularly");
    assert.equal(defaultSettings?.heartRateZones.zones.length, 5);
    assert.equal(defaultSettings?.heartRateZones.zones[3]?.reference, "Z4");
    assert.equal(acceptedEstimated.profileRevision, defaultSettings?.profileRevision);
    const estimatedRanges = defaultSettings!.heartRateZones.zones.map(
      ({ reference, minBpm, maxBpm }) => ({ reference, minBpm, maxBpm }),
    );

    const nonAgeUpdate = await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg + 1,
      heightCm: input.previewInput.heightCm + 1,
      fitnessLevel: "performance_focused",
    });
    assert.deepEqual(
      nonAgeUpdate.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      estimatedRanges,
      "Only age may change estimated BPM ranges.",
    );
    const changedAgeEstimate = await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age + 5,
      weightKg: input.previewInput.weightKg + 1,
      heightCm: input.previewInput.heightCm + 1,
      fitnessLevel: "performance_focused",
    });
    assert.equal(changedAgeEstimate.heartRateZones.source, "estimated");
    assert.notDeepEqual(
      changedAgeEstimate.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      estimatedRanges,
    );

    const persistedSettings = await updateUserSettingsForUserId(
      owner.userId,
      {
        firstName: "Local",
        lastName: "Runner",
        displayName: "Local Runner",
        age: input.previewInput.age,
        weightKg: input.previewInput.weightKg,
        heightCm: input.previewInput.heightCm,
        fitnessLevel: "running_regularly",
        heartRateProfile: { zones: [...PERSONAL_HEART_RATE_ZONES] },
      },
      owner.email,
    );
    assert.equal(persistedSettings.heartRateZones.source, "personal");
    assert.deepEqual(
      persistedSettings.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      PERSONAL_HEART_RATE_ZONES,
    );
    const personalAfterAgeChange = await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age + 1,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    assert.equal(personalAfterAgeChange.heartRateZones.source, "personal");
    assert.deepEqual(
      personalAfterAgeChange.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      PERSONAL_HEART_RATE_ZONES,
      "Age changes must not overwrite saved personal BPM ranges.",
    );
    await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });

    const profileSnapshot = await getRunnerPlanAuthoringProfileSnapshotForUserId(owner.userId);
    assert.equal(profileSnapshot?.heartRateProfile.source, "personal");
    assert.deepEqual(
      profileSnapshot?.heartRateProfile.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      PERSONAL_HEART_RATE_ZONES,
    );

    const watchCanaryInput = {
      ...input.previewInput,
      benchmark: { kind: "recent_5k_pace" as const, recent5kPace: "5:30/km" },
    };
    const authoring = buildAiGeneratedRunningPlanAuthoringInput(watchCanaryInput, profileSnapshot);
    assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
    if (!authoring.ok) {
      throw new Error(authoring.message);
    }

    const providerContext = buildAiAuthoredPlanFirstProviderContext(authoring.authoringInput);
    assert.equal(providerContext.runner.heart_rate_profile?.source, "personal");
    assert.deepEqual(
      providerContext.runner.heart_rate_profile?.zones.map(({ reference, min_bpm, max_bpm }) => ({
        reference,
        minBpm: min_bpm,
        maxBpm: max_bpm,
      })),
      PERSONAL_HEART_RATE_ZONES,
    );

    const fixtureFetch = buildPersonalHeartRateSubrangeFixtureFetch(
      buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
        authoringInput: authoring.authoringInput,
        today: watchCanaryInput.startDate,
        env: localFixtureEnv(input.preflight.target.url),
      }),
    );
    const fixtureOptions = {
      apiKey: "local-qa-dev-ai-generated-plan-fixture",
      model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
      today: watchCanaryInput.startDate,
      fetchImpl: fixtureFetch,
    };

    let reviewed = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      owner.userId,
      watchCanaryInput,
      { aiPreview: fixtureOptions },
    );
    assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
    if (!reviewed.ok) {
      throw new Error(reviewed.unavailable.error.message);
    }

    await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg + 0.5,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    const staleConfirmation = await confirmRunningPlanDraftForUser(
      owner.userId,
      input.buildConfirmInputForConfirm(reviewed.draft),
      { allowLocalQaFixture: true },
    );
    assert.equal(staleConfirmation.ok, false);
    if (!staleConfirmation.ok) {
      assert.equal(staleConfirmation.reason, "stale_review");
    }
    assert.deepEqual(await loadBaselineOnlyCounts(input.supabase, owner.userId), {
      profiles: 1,
      plans: 1,
      workouts: 0,
    });

    await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    reviewed = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      owner.userId,
      watchCanaryInput,
      { aiPreview: fixtureOptions },
    );
    assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
    if (!reviewed.ok) {
      throw new Error(reviewed.unavailable.error.message);
    }

    const canonicalPlan = buildRunningPlanCanonicalPlan(reviewed.draft);
    const reviewedTargets = collectTargetRecords(canonicalPlan.planned_workouts);
    assert.ok(
      reviewedTargets.some(
        (target) =>
          target.primary_execution_mode === "heart_rate" &&
          target.target_source === "ai_authored_plan_guidance" &&
          target.hr_bpm_range === "116-135 bpm" &&
          target.hr_bpm_min === 116 &&
          target.hr_bpm_max === 135 &&
          target.hr_target_source === "personal_hr_zone" &&
          target.label === "Personal HR" &&
          target.source_note === "Saved by the runner as personal heart-rate truth." &&
          target.extra?.hr_zone_reference === "Z2" &&
          target.extra.hr_profile_source === "personal" &&
          target.extra.hr_band_bpm_min === 116 &&
          target.extra.hr_band_bpm_max === 135 &&
          target.extra.hr_execution_range_kind === "full_band",
      ),
      "Reviewed plan must preserve authored Z2 identity and its full personal band snapshot.",
    );
    assert.ok(
      reviewedTargets.some(
        (target) =>
          target.primary_execution_mode === "heart_rate" &&
          target.target_source === "ai_authored_plan_guidance" &&
          target.hr_bpm_range === "121-130 bpm" &&
          target.hr_bpm_min === 121 &&
          target.hr_bpm_max === 130 &&
          target.hr_target_source === "personal_hr_zone" &&
          target.label === "Personal HR" &&
          target.source_note === "Saved by the runner as personal heart-rate truth." &&
          target.extra?.hr_zone_reference === "Z2" &&
          target.extra.hr_profile_source === "personal" &&
          target.extra.hr_band_bpm_min === 116 &&
          target.extra.hr_band_bpm_max === 135 &&
          target.extra.hr_execution_range_kind === "ai_selected_subrange",
      ),
      "Reviewed plan must preserve the AI-selected execution subrange inside its full Z2 snapshot.",
    );
    assert.ok(
      reviewedTargets.some(
        (target) =>
          typeof target.pace === "string" || typeof target.pace_min_per_km_range === "string",
      ),
      "Personal HR resolution must preserve AI-authored numeric pace.",
    );
    assert.match(
      JSON.stringify(reviewed.draft.workoutDocuments),
      /116-135 bpm/,
      "Reviewed read model must expose the resolved personal BPM guidance.",
    );
    validateRunnerFacingTargetReadbackContract(canonicalPlan, "Personal HR persisted profile");

    const confirmed = await confirmRunningPlanDraftForUser(
      owner.userId,
      input.buildConfirmInputForConfirm(reviewed.draft),
      { allowLocalQaFixture: true },
    );
    assert.equal(confirmed.ok, true, JSON.stringify(confirmed));

    const persistedBeforeSettingsChange = await loadPersistedPlanForUser(
      input.supabase,
      owner.userId,
    );
    const originalPersistedSteps = persistedBeforeSettingsChange.workouts.map(
      (workout) => workout.steps,
    );
    const exportPayload = buildActivePlanExportPayload({
      planCycle: persistedBeforeSettingsChange.plan,
      workouts: persistedBeforeSettingsChange.workouts,
      exportedAt: "2026-07-19T12:00:00.000Z",
    });
    const exportPlan = activePlanExportToTrainingPlanV2(exportPayload);
    const exportTargets = collectTargetRecords(exportPlan.planned_workouts);
    const selectedSavedPlanExport = await exportSavedPlanForUser(
      owner.userId,
      confirmed.savedPlanId,
      "json",
    );
    const selectedSavedPlanTargets = collectTargetRecords(
      (JSON.parse(selectedSavedPlanExport.body) as TrainingPlanV2).planned_workouts,
    );
    assert.ok(
      exportTargets.some(
        (target) =>
          target.primary_execution_mode === "heart_rate" &&
          target.target_source === "ai_authored_plan_guidance" &&
          target.hr_bpm_range === "116-135 bpm" &&
          target.hr_bpm_min === 116 &&
          target.hr_bpm_max === 135 &&
          target.hr_target_source === "personal_hr_zone" &&
          target.label === "Personal HR" &&
          target.source_note === "Saved by the runner as personal heart-rate truth." &&
          target.hr_zone_reference === "Z2" &&
          target.hr_profile_source === "personal" &&
          target.hr_band_bpm_min === 116 &&
          target.hr_band_bpm_max === 135 &&
          target.hr_execution_range_kind === "full_band" &&
          target.extra === undefined,
      ),
      "Export must preserve reviewed BPM guidance, named identity, parent snapshot, and provenance.",
    );
    assert.ok(
      selectedSavedPlanTargets.some(
        (target) =>
          target.primary_execution_mode === "heart_rate" &&
          target.target_source === "ai_authored_plan_guidance" &&
          target.hr_bpm_range === "121-130 bpm" &&
          target.hr_bpm_min === 121 &&
          target.hr_bpm_max === 130 &&
          target.hr_target_source === "personal_hr_zone" &&
          target.label === "Personal HR" &&
          target.source_note === "Saved by the runner as personal heart-rate truth." &&
          target.hr_zone_reference === "Z2" &&
          target.hr_profile_source === "personal" &&
          target.hr_band_bpm_min === 116 &&
          target.hr_band_bpm_max === 135 &&
          target.hr_execution_range_kind === "ai_selected_subrange" &&
          target.extra === undefined,
      ),
      "Selected saved-plan export must preserve the source execution subrange independently of its parent band.",
    );
    assert.match(renderPlanExportMarkdown(exportPayload), /116-135 bpm/);
    assert.doesNotMatch(renderPlanExportMarkdown(exportPayload), /\bZ[1-5](?:-Z[1-5])?\b/);

    await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
      heartRateProfile: { zones: [...UPDATED_PERSONAL_HEART_RATE_ZONES] },
    });
    const persistedAfterSettingsChange = await loadPersistedPlanForUser(
      input.supabase,
      owner.userId,
    );
    assert.deepEqual(
      persistedAfterSettingsChange.workouts.map((workout) => workout.steps),
      originalPersistedSteps,
      "Changing current personal HR settings must not rewrite confirmed historical plan targets.",
    );

    await validateRunnerProfileRls({
      preflight: input.preflight,
      owner,
      otherRunner,
      supabase: input.supabase,
    });

    return {
      defaultSource: defaultSettings?.heartRateZones.source,
      savedSource: persistedSettings.heartRateZones.source,
      providerContextSource: providerContext.runner.heart_rate_profile?.source,
      reviewedBpm: "116-135 bpm",
      reviewedSubrangeBpm: "121-130 bpm",
      overlappingPersonalPersisted: true,
      gappedPersonalPersisted: true,
      invalidSettingsBaselineRejected: true,
      historicalSnapshotPreserved: true,
      rlsIsolation: true,
    };
  } finally {
    if (otherRunner) {
      await cleanupDisposableUser(input.supabase, otherRunner);
    }
    await cleanupDisposableUser(input.supabase, owner);
  }
}

async function loadBaselineOnlyCounts(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const [profiles, plans, workouts] = await Promise.all([
    supabase
      .from("runner_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("plan_cycles").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  assert.equal(profiles.error, null);
  assert.equal(plans.error, null);
  assert.equal(workouts.error, null);

  return {
    profiles: profiles.count ?? 0,
    plans: plans.count ?? 0,
    workouts: workouts.count ?? 0,
  };
}

async function validateRunnerProfileRls(input: {
  preflight: Extract<PersistencePreflight, { shouldRun: true }>;
  owner: { userId: string; email: string };
  otherRunner: { userId: string; email: string };
  supabase: ReturnType<typeof createAdminSupabaseClient>;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.ok(publishableKey, "Local RLS proof requires a publishable key.");
  const ownerClient = createClient<Database>(input.preflight.target.url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signedIn = await ownerClient.auth.signInWithPassword({
    email: input.owner.email,
    password: DISPOSABLE_TEST_PASSWORD,
  });
  assert.equal(signedIn.error, null);

  const ownProfile = await ownerClient
    .from("runner_profiles")
    .select("user_id, heart_rate_profile")
    .eq("user_id", input.owner.userId)
    .single();
  assert.equal(ownProfile.error, null);
  assert.equal(ownProfile.data?.user_id, input.owner.userId);
  const persistedPersonalProfile = ownProfile.data?.heart_rate_profile;

  const malformedProfiles: Array<{ label: string; value: Json }> = [
    {
      label: "estimated profile carrying stored zones",
      value: {
        version: "runner_hr_profile_v2",
        source: "estimated",
        zones: [...UPDATED_PERSONAL_HEART_RATE_ZONES],
      },
    },
    {
      label: "unknown profile provenance",
      value: {
        version: "runner_hr_profile_v2",
        source: "imported",
      },
    },
    {
      label: "missing profile version",
      value: {
        source: "personal",
        zones: [...UPDATED_PERSONAL_HEART_RATE_ZONES],
      },
    },
    {
      label: "missing zone reference",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [{ minBpm: 90, maxBpm: 110 }, ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(1)],
      },
    },
    {
      label: "duplicate zone reference",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 90, maxBpm: 110 },
          { reference: "Z2", minBpm: 111, maxBpm: 130 },
          { reference: "Z3", minBpm: 131, maxBpm: 145 },
          { reference: "Z4", minBpm: 146, maxBpm: 160 },
          { reference: "Z4", minBpm: 161, maxBpm: 180 },
        ],
      },
    },
    {
      label: "incomplete guidance band set",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(0, 4)],
      },
    },
    {
      label: "reversed BPM range",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 110, maxBpm: 90 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(1),
        ],
      },
    },
    {
      label: "non-integer BPM value",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 90.5, maxBpm: 110 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(1),
        ],
      },
    },
    {
      label: "BPM below the product envelope",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 59, maxBpm: 110 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(1),
        ],
      },
    },
    {
      label: "BPM above the product envelope",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(0, 4),
          { reference: "Z5", minBpm: 165, maxBpm: 201 },
        ],
      },
    },
    {
      label: "decreasing lower guidance bounds",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 100, maxBpm: 110 },
          { reference: "Z2", minBpm: 99, maxBpm: 130 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(2),
        ],
      },
    },
    {
      label: "decreasing upper guidance bounds",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 90, maxBpm: 120 },
          { reference: "Z2", minBpm: 115, maxBpm: 119 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(2),
        ],
      },
    },
  ];

  for (const malformedProfile of malformedProfiles) {
    const rejectedUpdate = await ownerClient
      .from("runner_profiles")
      .update({ heart_rate_profile: malformedProfile.value })
      .eq("user_id", input.owner.userId);
    assert.equal(
      rejectedUpdate.error?.code,
      "23514",
      `Database must reject ${malformedProfile.label} before it becomes profile truth.`,
    );
  }

  const ownProfileAfterRejectedUpdates = await ownerClient
    .from("runner_profiles")
    .select("heart_rate_profile")
    .eq("user_id", input.owner.userId)
    .single();
  assert.equal(ownProfileAfterRejectedUpdates.error, null);
  assert.deepEqual(
    ownProfileAfterRejectedUpdates.data?.heart_rate_profile,
    persistedPersonalProfile,
  );

  const otherProfile = await ownerClient
    .from("runner_profiles")
    .select("user_id")
    .eq("user_id", input.otherRunner.userId);
  assert.equal(otherProfile.error, null);
  assert.deepEqual(otherProfile.data, []);

  const unauthorizedUpdate = await ownerClient
    .from("runner_profiles")
    .update({ heart_rate_profile: null })
    .eq("user_id", input.otherRunner.userId)
    .select("user_id");
  assert.equal(unauthorizedUpdate.error, null);
  assert.deepEqual(unauthorizedUpdate.data, []);

  const otherProfileAfter = await input.supabase
    .from("runner_profiles")
    .select("heart_rate_profile")
    .eq("user_id", input.otherRunner.userId)
    .single();
  assert.equal(otherProfileAfter.error, null);
  assert.deepEqual(otherProfileAfter.data?.heart_rate_profile, {
    version: "runner_hr_profile_v2",
    source: "personal",
    zones: [...PERSONAL_HEART_RATE_ZONES],
  });
}

type ProofTargetRecord = Record<string, unknown> & {
  hr_band_bpm_max?: number;
  hr_band_bpm_min?: number;
  hr_bpm_max?: number;
  hr_bpm_min?: number;
  hr_bpm_range?: string;
  hr_execution_range_kind?: string;
  hr_profile_source?: string;
  hr_target_source?: string;
  label?: string;
  pace?: string;
  pace_min_per_km_range?: string;
  primary_execution_mode?: string;
  source_note?: string;
  target_source?: string;
  hr_zone_reference?: string;
  extra?: {
    hr_band_bpm_max?: number;
    hr_band_bpm_min?: number;
    hr_execution_range_kind?: string;
    hr_profile_source?: string;
    hr_zone_reference?: string;
  };
};

function collectTargetRecords(value: unknown): ProofTargetRecord[] {
  const targets: ProofTargetRecord[] = [];

  const visit = (candidate: unknown) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!candidate || typeof candidate !== "object") {
      return;
    }

    const record = candidate as Record<string, unknown>;
    if (
      typeof record.hr_bpm_range === "string" ||
      typeof record.pace === "string" ||
      typeof record.pace_min_per_km_range === "string"
    ) {
      targets.push(record as ProofTargetRecord);
    }
    Object.values(record).forEach(visit);
  };

  visit(value);
  return targets;
}

function buildPersonalHeartRateSubrangeFixtureFetch(fetchImpl: typeof fetch): typeof fetch {
  return async (input, init) => {
    const response = await fetchImpl(input, init);
    const providerResponse = (await response.json()) as {
      output_text?: string;
      [key: string]: unknown;
    };
    assert.equal(typeof providerResponse.output_text, "string");
    const draft = JSON.parse(providerResponse.output_text) as AiAuthoredPlanFirstCompilerDraft;
    let authoredSubrange = false;

    for (const workout of draft.workouts) {
      for (const section of workout.sections) {
        if (section.kind !== "unit") continue;
        const target = section.target;
        if (
          target.primary_execution_mode === "heart_rate" &&
          target.band_reference === "Z2" &&
          target.command === "116-135 bpm"
        ) {
          section.target = {
            ...target,
            command: "121-130 bpm",
          };
          section.cue = "Use the narrower aerobic range for this controlled stage.";
          authoredSubrange = true;
          break;
        }
      }
      if (authoredSubrange) break;
    }

    assert.equal(authoredSubrange, true, "The persistence fixture must author one Z2 subrange.");
    return new Response(
      JSON.stringify({
        ...providerResponse,
        output_text: JSON.stringify(draft),
      }),
      {
        status: response.status,
        headers: { "content-type": "application/json" },
      },
    );
  };
}

function localFixtureEnv(loopbackSupabaseUrl: string) {
  return {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
    NEXT_PUBLIC_SUPABASE_URL: loopbackSupabaseUrl,
    HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
    HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "qa_fixture",
  };
}

async function validateReviewedPlanPersistenceFailureAtomicity(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
) {
  const disposableUser = await acquireQaPoolSupabaseUser({
    supabase,
    poolRole: "provider-engine",
    creationErrorMessage: "Disposable atomic plan-creation user creation failed.",
  });
  const planId = crypto.randomUUID();
  const firstWorkoutId = crypto.randomUUID();
  const profilePayload = {
    goal_type: "distance_build",
    goal_label: "Atomic 10K proof",
    baseline_sessions_per_week: 3,
    baseline_long_run_km: 6,
    baseline_notes: null,
  };
  const buildPlanPayload = (id: string, title: string, sourceTemplate: string) => ({
    id,
    title,
    goal_summary: "10K",
    source_template: sourceTemplate,
    schema_version: "training-plan-v2",
    source_kind: "ai_authored_plan_first_v1",
    start_date: "2026-07-20",
    end_date: "2026-07-27",
    target_date: null,
    goal_metadata: {},
    plan_preferences: {},
  });
  const buildExpectedHistory = (workoutIds: string[] = []) => ({
    workout_ids: workoutIds,
    log_ids: [],
    asset_ids: [],
    metric_ids: [],
    comparison_ids: [],
    insight_ids: [],
  });

  try {
    const baseline = buildFirstTimeRunnerBaselineReadback({
      age: 36,
      weightKg: 74,
      heightCm: 178,
      fitnessLevel: "running_regularly",
    });
    const savedBaseline = await updateUserSettingsForUserId(disposableUser.userId, {
      firstName: null,
      lastName: null,
      displayName: null,
      age: baseline.age,
      weightKg: baseline.weightKg,
      heightCm: baseline.heightCm,
      fitnessLevel: baseline.fitnessLevel!,
      heartRateProfile: {
        zones: baseline.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
          reference,
          minBpm,
          maxBpm,
        })),
      },
    });
    const baselineBefore = await supabase
      .from("runner_profiles")
      .select("*")
      .eq("user_id", disposableUser.userId)
      .single();
    assert.equal(baselineBefore.error, null);

    const historicalPlanId = crypto.randomUUID();
    const historicalWorkoutId = crypto.randomUUID();
    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: profilePayload,
        plan: buildPlanPayload(
          historicalPlanId,
          "Historical row rejection proof",
          "historical_row_rejection",
        ),
        workouts: [
          {
            ...buildAtomicCreationWorkout(
              historicalWorkoutId,
              historicalPlanId,
              disposableUser.userId,
              "easy",
            ),
            workout_date: "2026-07-19",
            weekday: "Sunday",
          },
        ] as unknown as Json,
        currentDate: "2026-07-20",
        expectedProfileRevision: savedBaseline.profileRevision,
      }),
      (error) => error instanceof CalendarPersistenceRejection && error.reason === "invalid_input",
    );

    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: profilePayload,
        plan: buildPlanPayload(planId, "Stale profile revision proof", "stale_profile_revision"),
        workouts: [
          buildAtomicCreationWorkout(firstWorkoutId, planId, disposableUser.userId, "easy"),
        ] as unknown as Json,
        currentDate: "2026-07-20",
        expectedProfileRevision: savedBaseline.profileRevision + 1,
      }),
      (error) => error instanceof CalendarPersistenceRejection && error.reason === "stale_review",
    );

    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: profilePayload,
        plan: buildPlanPayload(planId, "Atomic creation failure proof", "atomic_creation_failure"),
        workouts: [
          buildAtomicCreationWorkout(firstWorkoutId, planId, disposableUser.userId, "easy"),
          buildAtomicCreationWorkout(
            crypto.randomUUID(),
            planId,
            disposableUser.userId,
            "invalid_workout_type",
          ),
        ] as unknown as Json,
        currentDate: "2026-07-20",
        expectedProfileRevision: savedBaseline.profileRevision,
      }),
    );

    const [profile, plans, workouts] = await Promise.all([
      supabase
        .from("runner_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", disposableUser.userId),
      supabase
        .from("plan_cycles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", disposableUser.userId),
      supabase
        .from("planned_workouts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", disposableUser.userId),
    ]);
    assert.equal(profile.error, null);
    assert.equal(plans.error, null);
    assert.equal(workouts.error, null);
    assert.equal(profile.count, 1, "Failed plan creation must preserve the saved baseline.");
    assert.equal(plans.count, 0, "Failed plan creation must roll back the plan cycle.");
    assert.equal(workouts.count, 0, "Failed plan creation must roll back every workout row.");
    const baselineAfter = await supabase
      .from("runner_profiles")
      .select("*")
      .eq("user_id", disposableUser.userId)
      .single();
    assert.equal(baselineAfter.error, null);
    assert.deepEqual(baselineAfter.data, baselineBefore.data);

    const materializedPlanId = crypto.randomUUID();
    const materializedWorkoutId = crypto.randomUUID();
    const created = await applyAtomicReviewedPlanPersistence({
      userId: disposableUser.userId,
      profile: profilePayload,
      plan: buildPlanPayload(
        materializedPlanId,
        "Atomic materialization proof",
        "atomic_materialization_proof",
      ),
      workouts: [
        buildAtomicCreationWorkout(
          materializedWorkoutId,
          materializedPlanId,
          disposableUser.userId,
          "easy",
        ),
      ] as unknown as Json,
      currentDate: "2026-07-20",
      expectedProfileRevision: savedBaseline.profileRevision,
    });
    assert.equal(created.planCycle.id, materializedPlanId);
    assert.equal(created.planCycle.status, "archived");

    const changedBaseline = await updateUserSettingsForUserId(disposableUser.userId, {
      firstName: null,
      lastName: null,
      displayName: null,
      age: baseline.age,
      weightKg: baseline.weightKg,
      heightCm: baseline.heightCm,
      fitnessLevel: baseline.fitnessLevel!,
      heartRateProfile: { zones: [...PERSONAL_HEART_RATE_ZONES] },
    });
    assert.equal(changedBaseline.profileRevision, savedBaseline.profileRevision + 1);

    const secondPlanId = crypto.randomUUID();
    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: profilePayload,
        plan: buildPlanPayload(
          secondPlanId,
          "Atomic stale baseline proof",
          "atomic_stale_baseline_proof",
        ),
        workouts: [
          buildAtomicCreationWorkout(
            crypto.randomUUID(),
            secondPlanId,
            disposableUser.userId,
            "quality",
          ),
        ] as unknown as Json,
        currentDate: "2026-07-20",
        expectedProfileRevision: savedBaseline.profileRevision,
      }),
      (error) => error instanceof CalendarPersistenceRejection && error.reason === "stale_review",
    );

    const [plansAfterRace, workoutsAfterRace, profileAfterRace] = await Promise.all([
      supabase.from("plan_cycles").select("id,status").eq("user_id", disposableUser.userId),
      supabase
        .from("planned_workouts")
        .select("id,plan_cycle_id")
        .eq("user_id", disposableUser.userId),
      supabase
        .from("runner_profiles")
        .select("baseline_revision")
        .eq("user_id", disposableUser.userId)
        .single(),
    ]);
    assert.equal(plansAfterRace.error, null);
    assert.equal(workoutsAfterRace.error, null);
    assert.equal(profileAfterRace.error, null);
    assert.deepEqual(plansAfterRace.data, [{ id: materializedPlanId, status: "archived" }]);
    assert.deepEqual(workoutsAfterRace.data, [
      { id: materializedWorkoutId, plan_cycle_id: materializedPlanId },
    ]);
    assert.equal(profileAfterRace.data?.baseline_revision, changedBaseline.profileRevision);
  } finally {
    await cleanupDisposableUser(supabase, disposableUser);
  }

  return {
    creationRollback: true,
    historicalRowsRejected: true,
    staleProfileRaceRejected: true,
  } as const;
}

function buildAtomicCreationWorkout(
  id: string,
  planId: string,
  userId: string,
  workoutType: string,
) {
  return {
    id,
    plan_cycle_id: planId,
    user_id: userId,
    workout_date: "2026-07-20",
    weekday: "Monday",
    week_number: 1,
    phase: "Base",
    workout_type: workoutType,
    source_workout_id: `atomic-${id}`,
    source_workout_type: "Easy",
    workout_family: "easy",
    workout_identity: "easy_aerobic_run",
    calendar_icon_key: "easy",
    goal_context: {},
    metric_mode: {},
    title: "Atomic proof workout",
    notes: null,
    planned_rpe: 3,
    estimated_fatigue: "low",
    recovery_priority: "normal",
    steps: [],
    display_order: 0,
  };
}

function distanceGoalSummary(draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>) {
  const distance = draft.normalizedInputSummary.planGoalIntent.distance;

  return {
    goalLabel: distance?.label ?? "Distance goal",
    distanceMeters: distance?.distanceMeters ?? null,
  };
}

async function loadPersistedPlanForUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const planResult = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .is("saved_plan_payload", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (planResult.error || !planResult.data) {
    throw new Error(planResult.error?.message ?? "Materialized plan provenance was not found.");
  }

  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_cycle_id", planResult.data.id)
    .order("display_order", { ascending: true });

  if (workoutsResult.error || !workoutsResult.data) {
    throw new Error(workoutsResult.error?.message ?? "Persisted workouts were not found.");
  }

  return {
    plan: planResult.data,
    workouts: workoutsResult.data,
  };
}

async function prepareExpectedSavedPlanMaterialization(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  savedPlanId: string;
}) {
  const [savedPlanRecord, runnerCurrentDate, profile] = await Promise.all([
    getSavedPlanRecordForUser(input.userId, input.savedPlanId),
    getRunnerCalendarDateForUserId(input.userId),
    input.supabase
      .from("runner_profiles")
      .select("training_preferences")
      .eq("user_id", input.userId)
      .single(),
  ]);
  assert.ok(savedPlanRecord, "The confirmed saved-plan source record was not found.");
  assert.equal(profile.error, null);
  const savedPlan = readSavedPlanPayload(savedPlanRecord);

  return {
    savedPlan,
    prepared: prepareSavedPlanFutureApplyPolicy(
      savedPlan,
      runnerCurrentDate,
      profile.data?.training_preferences ?? null,
    ),
  };
}

async function cleanupDisposableUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  lease: QaPoolUserLease,
): Promise<DisposableCleanupProof> {
  return releaseQaPoolSupabaseUser({
    supabase,
    userId: lease.userId,
    poolRole: lease.poolRole,
    leaseToken: lease.leaseToken,
  });
}
