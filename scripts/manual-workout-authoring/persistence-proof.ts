import assert from "node:assert/strict";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  addManualWorkoutToActivePlanForUser,
  buildManualWorkoutUserBuiltTrainingPlan,
  confirmManualWorkoutDeleteClearForUser,
  confirmManualWorkoutMoveForUser,
  confirmManualWorkoutPersistedEditForUser,
  createEmptyManualActivePlanForUser,
  reconstructManualWorkoutPersistedEditDraftForUser,
  reviewManualWorkoutDeleteClearForUser,
  reviewManualWorkoutMoveForUser,
  reviewManualWorkoutPersistedEditDraftForUser,
  type ManualEmptyPlanSetupInput,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";
import {
  applyImportedPlanForUser,
  createFirstPlanFromReviewedCanonicalPlanForUser,
  type PersistedPlanCycleRow,
} from "../../src/lib/active-plan-persistence";
import {
  applyAtomicActivePlanWorkoutMutation,
  applyAtomicReviewedImportPersistence,
  applyAtomicReviewedPlanPersistence,
} from "../../src/lib/active-plan-lifecycle-persistence";
import { AI_AUTHORED_PLAN_FIRST_SOURCE_KIND } from "../../src/lib/ai-authored-plan-first-compiler";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
} from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { buildAiGeneratedRunningPlanAuthoringInput } from "../../src/lib/ai-generated-running-plan";
import { buildSourceWorkoutFingerprint } from "../../src/lib/manual-workout-authoring/edit-workout-review-token";
import {
  TRAINING_PLAN_V2_IMPORT_SOURCE_KIND,
  type TrainingPlanV2,
} from "../../src/lib/imported-plan";
import type { Database, Json } from "../../src/lib/supabase/database";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import { addDaysIso, todayIso, weekdayLong } from "../../src/lib/training";
import { buildReviewedAiGeneratedRunningPlanPreview } from "../../src/lib/running-plan-engine-actions";
import { buildRunningPlanCanonicalPlan } from "../../src/lib/running-plan-engine-review";
import {
  AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
  readWorkoutDocumentSections,
} from "../../src/lib/workout-document";
import {
  cleanupDisposableSupabaseUser,
  createDisposableSupabaseUser,
  DISPOSABLE_REQUIRE_PERSISTENCE_FLAG,
  readDisposablePersistenceCliOptions,
  resolveDisposablePersistencePreflight,
  type DisposablePersistencePreflight,
  type DisposableSupabaseCleanupProof,
  type DisposableSupabaseCleanupSpec,
  type DisposableSupabaseTarget,
} from "../lib/disposable-persistence-proof";

type ManualWorkoutReadyReview = Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
type PersistedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type PersistedRunnerProfileRow = Database["public"]["Tables"]["runner_profiles"]["Row"];
type PersistedManualPlanReadback = {
  plan: PersistedPlanCycleRow;
  workouts: PersistedWorkoutRow[];
  profile: PersistedRunnerProfileRow;
};

type ManualDisposableCleanupProofCountKey =
  | "workoutComparisonsRemaining"
  | "workoutMetricsRemaining"
  | "workoutAssetsRemaining"
  | "workoutLogsRemaining"
  | "planCyclesRemaining"
  | "plannedWorkoutsRemaining"
  | "savedTemplatesRemaining"
  | "runnerProfilesRemaining";
type ManualDisposableCleanupProof = DisposableSupabaseCleanupProof<
  ManualDisposableCleanupProofCountKey,
  true
>;

export const MANUAL_REQUIRE_PERSISTENCE_FLAG = DISPOSABLE_REQUIRE_PERSISTENCE_FLAG;
const MANUAL_DISPOSABLE_CLEANUP_SPECS = [
  {
    table: "workout_comparisons",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "workoutComparisonsRemaining",
    zeroMessage: "Disposable manual workout comparisons must be cleaned up.",
  },
  {
    table: "workout_actual_metrics",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "workoutMetricsRemaining",
    zeroMessage: "Disposable manual workout metrics must be cleaned up.",
  },
  {
    table: "workout_result_assets",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "workoutAssetsRemaining",
    zeroMessage: "Disposable manual workout assets must be cleaned up.",
  },
  {
    table: "workout_logs",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "workoutLogsRemaining",
    zeroMessage: "Disposable manual workout logs must be cleaned up.",
  },
  {
    table: "planned_workouts",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "plannedWorkoutsRemaining",
    zeroMessage: "Disposable manual planned workouts must be cleaned up.",
  },
  {
    table: "plan_cycles",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "planCyclesRemaining",
    zeroMessage: "Disposable manual plan cycles must be cleaned up.",
  },
  {
    table: "runner_manual_workout_templates",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "savedTemplatesRemaining",
    zeroMessage: "Disposable manual saved workout templates must be cleaned up.",
  },
  {
    table: "runner_profiles",
    userColumn: "user_id",
    countColumn: "user_id",
    proofKey: "runnerProfilesRemaining",
    zeroMessage: "Disposable manual runner profile must be cleaned up.",
  },
] as const satisfies readonly DisposableSupabaseCleanupSpec<ManualDisposableCleanupProofCountKey>[];

export type ManualPersistenceTarget = DisposableSupabaseTarget;
export type ManualPersistencePreflight = DisposablePersistencePreflight;

export function readManualPersistenceCliOptions(args = process.argv.slice(2)) {
  return readDisposablePersistenceCliOptions(args);
}

export function resolveManualPersistencePreflight(
  options: ReturnType<typeof readManualPersistenceCliOptions>,
): ManualPersistencePreflight {
  return resolveDisposablePersistencePreflight({
    options,
    includeNotRequested: true,
    notRequestedReason:
      "Manual workout persistence proof was not requested; default harness remains non-mutating.",
    notRequestedOverrideHint: `Pass ${MANUAL_REQUIRE_PERSISTENCE_FLAG} with local disposable Supabase env to run persistence proof.`,
    envIncompleteReason:
      "Supabase persistence env is incomplete; manual persistence proof was not attempted.",
    envIncompleteOverrideHint:
      "Start local Supabase and export NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY, then rerun with --require-persistence.",
    invalidUrlReason:
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL; persistence proof was not attempted.",
    invalidUrlOverrideHint:
      "Use a valid local Supabase URL such as http://127.0.0.1:54321 and rerun with --require-persistence.",
    nonLoopbackBlockedReason:
      "Manual workout persistence proof only supports loopback Supabase; remote mutation is not available.",
    nonLoopbackOverrideHint:
      "Start local Supabase and run npm run supabase:local:configure before retrying.",
  });
}

export function formatManualPersistenceBlocker(
  preflight: Extract<ManualPersistencePreflight, { shouldRun: false }>,
) {
  return [
    `Manual workout confirm persistence proof is blocked: ${preflight.reason}`,
    preflight.target
      ? `Target: ${preflight.target.url} (${preflight.target.hostname}).`
      : "Target: none.",
    preflight.overrideHint,
  ].join(" ");
}

export function buildSkippedManualPersistenceResult(
  preflight: Extract<ManualPersistencePreflight, { shouldRun: false }>,
) {
  return {
    mode: preflight.mode,
    target: preflight.target,
    reason: preflight.reason,
    overrideHint: preflight.overrideHint,
  };
}

export async function validateManualWorkoutDisposablePersistenceProof({
  input,
  review,
  preflight,
}: {
  input: ManualWorkoutDraftInput;
  review: ManualWorkoutReadyReview;
  preflight: Extract<ManualPersistencePreflight, { shouldRun: true }>;
}) {
  const supabase = createAdminSupabaseClient();
  const disposableUser = await createDisposableSupabaseUser({
    supabase,
    emailPrefix: "manual-workout-confirm",
    validationKind: "manual_workout_confirm_persistence",
    creationErrorMessage: "Disposable manual workout user creation failed.",
  });
  let proof: {
    rows: number;
    sourceKind: string | null;
    sourceStatus: string | null;
    reviewChecksum: string | null;
    editedWorkoutId: string;
    editedTitle: string;
    originalPlanSourceKind: string;
    mutationFailureAtomic: true;
    moveAndClearPersisted: true;
  } | null = null;
  let cleanup: ManualDisposableCleanupProof | null = null;

  try {
    const setup: ManualEmptyPlanSetupInput = {
      age: 36,
      heightCm: 178,
      weightKg: 74,
      runningLevel: "beginner",
    };
    const emptyPlan = await createEmptyManualActivePlanForUser(disposableUser.userId, setup);
    assert.equal(emptyPlan.ok, true, "Manual empty plan should persist on disposable target.");
    if (!emptyPlan.ok) {
      throw new Error(emptyPlan.message);
    }

    const result = await addManualWorkoutToActivePlanForUser(disposableUser.userId, {
      activePlanId: emptyPlan.activePlanId,
      draftInput: input,
      reviewToken: review.reviewToken,
      reviewChecksum: review.reviewChecksum,
    });
    assert.equal(result.ok, true, "Reviewed manual Add should persist on disposable target.");
    if (!result.ok) {
      throw new Error(result.message);
    }

    const persisted = await loadPersistedManualPlanForUser(supabase, disposableUser.userId);
    assert.equal(persisted.plan.source_kind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(persisted.workouts.length, 1);
    assert.equal(persisted.workouts[0]?.workout_date, input.workoutDate);
    assert.equal(persisted.workouts[0]?.workout_identity, "easy_aerobic_run");
    assert.equal(persisted.profile.user_id, disposableUser.userId);
    validateManualPlanMetadata(persisted.plan, review.reviewChecksum);
    validateNoFakePaceOrPersonalHr(persisted.workouts);
    const manualEdit = await reviewConfirmAndReadPersistedWorkoutEdit({
      supabase,
      userId: disposableUser.userId,
      persisted,
      title: "Runner-owned manual workout edit",
    });
    assert.equal(
      manualEdit.confirm.sourceMetadata.originalPlanSourceKind,
      MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    );
    assert.equal(manualEdit.editedWorkout.id, manualEdit.sourceWorkout.id);
    assert.equal(manualEdit.editedWorkout.title, manualEdit.editedDraftInput.title);
    assert.deepEqual(readLatestUserEditProvenance(manualEdit.edited.plan), {
      originalPlanSourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
      originalPlanOriginSourceKind: null,
      originalPlanOriginSourceStatus: null,
      originalWorkoutSourceId: manualEdit.sourceWorkout.source_workout_id,
      originalWorkoutSourceType: manualEdit.sourceWorkout.source_workout_type,
      originalWorkoutFamily: manualEdit.sourceWorkout.workout_family,
      originalWorkoutIdentity: manualEdit.sourceWorkout.workout_identity,
    });
    assert.deepEqual(
      readLatestUserEditPreviousWorkout(manualEdit.edited.plan),
      manualEdit.sourceWorkout,
      "Manual edit history must retain the complete pre-edit planned workout.",
    );

    const duplicate = await addManualWorkoutToActivePlanForUser(disposableUser.userId, {
      activePlanId: emptyPlan.activePlanId,
      draftInput: input,
      reviewToken: review.reviewToken,
      reviewChecksum: review.reviewChecksum,
    });
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) {
      assert.equal(duplicate.reason, "occupied_day");
    }
    const mutationFailureAtomic = await validateActivePlanWorkoutMutationFailureAtomicity({
      supabase,
      userId: disposableUser.userId,
    });
    const moveAndClearPersisted = await validateMoveAndClearPersistence({
      supabase,
      userId: disposableUser.userId,
    });

    proof = {
      rows: persisted.workouts.length,
      sourceKind: persisted.plan.source_kind,
      sourceStatus: readManualSourceStatus(persisted.plan),
      reviewChecksum: readManualReviewChecksum(persisted.plan),
      editedWorkoutId: manualEdit.editedWorkout.id,
      editedTitle: manualEdit.editedWorkout.title,
      originalPlanSourceKind: manualEdit.confirm.sourceMetadata.originalPlanSourceKind,
      mutationFailureAtomic,
      moveAndClearPersisted,
    };
  } finally {
    cleanup = await cleanupDisposableManualWorkoutUser(supabase, disposableUser.userId);
  }

  assert.ok(proof, "Manual workout persistence proof must complete before cleanup reporting.");
  assert.ok(cleanup, "Manual workout cleanup proof must be captured.");
  const importedEdit = await validateImportedWorkoutEditAtomicPersistence({
    review,
    supabase,
  });
  const canonicalOriginEdits = await validateCanonicalOriginWorkoutEditPersistence({
    review,
    supabase,
  });
  const replacementCarryForward = await validateReplacementCarryForwardPersistence({
    review,
    supabase,
  });
  const clearBeforeImport = await validateClearBeforeImportAtomicPersistence({
    review,
    supabase,
  });

  return {
    mode: preflight.mode,
    target: preflight.target,
    disposableRunId: disposableUser.runId,
    persisted: proof,
    cleanup,
    importedEdit,
    canonicalOriginEdits,
    replacementCarryForward,
    clearBeforeImport,
  };
}

async function validateMoveAndClearPersistence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
}) {
  const beforeMove = await loadPersistedManualPlanForUser(input.supabase, input.userId);
  const sourceWorkout = beforeMove.workouts[0];
  assert.ok(sourceWorkout, "Move/Clear persistence proof requires one workout.");
  const targetDate = addDaysIso(sourceWorkout.workout_date, 1);
  const moveReview = await reviewManualWorkoutMoveForUser(input.userId, {
    activePlanId: beforeMove.plan.id,
    sourceWorkoutId: sourceWorkout.id,
    targetDate,
  });
  assert.equal(moveReview.ok, true, JSON.stringify(moveReview));
  if (!moveReview.ok) throw new Error(moveReview.message);

  const moved = await confirmManualWorkoutMoveForUser(input.userId, {
    activePlanId: beforeMove.plan.id,
    sourceWorkoutId: sourceWorkout.id,
    targetDate,
    reviewToken: moveReview.review.reviewToken,
    reviewChecksum: moveReview.review.reviewChecksum,
  });
  assert.equal(moved.ok, true, JSON.stringify(moved));
  if (!moved.ok) throw new Error(moved.message);

  const afterMove = await loadPersistedManualPlanForUser(input.supabase, input.userId);
  assert.equal(afterMove.workouts.length, 1);
  assert.equal(afterMove.workouts[0]?.id, sourceWorkout.id);
  assert.equal(afterMove.workouts[0]?.workout_date, targetDate);
  const clearReview = await reviewManualWorkoutDeleteClearForUser(input.userId, {
    activePlanId: afterMove.plan.id,
    plannedWorkoutId: sourceWorkout.id,
  });
  assert.equal(clearReview.ok, true, JSON.stringify(clearReview));
  if (!clearReview.ok) throw new Error(clearReview.message);

  const cleared = await confirmManualWorkoutDeleteClearForUser(input.userId, {
    activePlanId: afterMove.plan.id,
    plannedWorkoutId: sourceWorkout.id,
    reviewToken: clearReview.review.reviewToken,
    reviewChecksum: clearReview.review.reviewChecksum,
  });
  assert.equal(cleared.ok, true, JSON.stringify(cleared));
  if (!cleared.ok) throw new Error(cleared.message);

  const afterClear = await loadPersistedManualPlanForUser(input.supabase, input.userId);
  assert.equal(afterClear.workouts.length, 0);
  assert.equal(afterClear.plan.status, "active");

  return true as const;
}

async function validateActivePlanWorkoutMutationFailureAtomicity(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
}) {
  const initial = await loadPersistedManualPlanForUser(input.supabase, input.userId);
  const sourceWorkout = initial.workouts[0];
  assert.ok(sourceWorkout, "Atomic mutation proof requires one source workout.");
  const invalidPlanUpdate = {
    end_date: "not-an-iso-date",
    goal_metadata: initial.plan.goal_metadata,
    plan_preferences: initial.plan.plan_preferences,
  };
  const addDate = addDaysIso(sourceWorkout.workout_date, 7);
  const addWorkoutId = crypto.randomUUID();

  await assert.rejects(
    applyAtomicActivePlanWorkoutMutation({
      userId: input.userId,
      planId: initial.plan.id,
      expectedPlanUpdatedAt: initial.plan.updated_at,
      currentDate: todayIso(),
      mutationKind: "add",
      expectedSourceWorkout: null,
      expectedTargetWorkout: null,
      workoutInsert: {
        ...sourceWorkout,
        id: addWorkoutId,
        workout_date: addDate,
        weekday: weekdayLong(addDate),
        display_order: sourceWorkout.display_order + 1,
      } as unknown as Json,
      workoutUpdate: null,
      planUpdate: invalidPlanUpdate,
    }),
  );
  assert.deepEqual(
    await loadPersistedManualPlanForUser(input.supabase, input.userId),
    initial,
    "Failed Add must roll back the inserted workout and plan metadata together.",
  );

  const targetDate = addDaysIso(sourceWorkout.workout_date, 14);
  const targetWorkoutId = crypto.randomUUID();
  const targetInsert = await input.supabase
    .from("planned_workouts")
    .insert({
      ...sourceWorkout,
      id: targetWorkoutId,
      workout_date: targetDate,
      weekday: weekdayLong(targetDate),
      display_order: sourceWorkout.display_order + 1,
    })
    .select("*")
    .single();
  if (targetInsert.error || !targetInsert.data) {
    throw new Error(targetInsert.error?.message ?? "Atomic move target setup failed.");
  }

  const withTarget = await loadPersistedManualPlanForUser(input.supabase, input.userId);
  const targetWorkout = withTarget.workouts.find((workout) => workout.id === targetWorkoutId);
  assert.ok(targetWorkout, "Atomic move target must be visible before failure injection.");

  await assert.rejects(
    applyAtomicActivePlanWorkoutMutation({
      userId: input.userId,
      planId: withTarget.plan.id,
      expectedPlanUpdatedAt: withTarget.plan.updated_at,
      currentDate: todayIso(),
      mutationKind: "clear",
      expectedSourceWorkout: buildSourceWorkoutFingerprint(sourceWorkout) as Json,
      expectedTargetWorkout: null,
      workoutInsert: null,
      workoutUpdate: null,
      planUpdate: invalidPlanUpdate,
    }),
  );
  assert.deepEqual(
    await loadPersistedManualPlanForUser(input.supabase, input.userId),
    withTarget,
    "Failed Clear must restore neither row nor metadata because the transaction never commits.",
  );

  await assert.rejects(
    applyAtomicActivePlanWorkoutMutation({
      userId: input.userId,
      planId: withTarget.plan.id,
      expectedPlanUpdatedAt: withTarget.plan.updated_at,
      currentDate: todayIso(),
      mutationKind: "move",
      expectedSourceWorkout: buildSourceWorkoutFingerprint(sourceWorkout) as Json,
      expectedTargetWorkout: buildSourceWorkoutFingerprint(targetWorkout) as Json,
      workoutInsert: null,
      workoutUpdate: {
        workout_date: targetDate,
        weekday: weekdayLong(targetDate),
        week_number: targetWorkout.week_number,
      },
      planUpdate: invalidPlanUpdate,
    }),
  );
  assert.deepEqual(
    await loadPersistedManualPlanForUser(input.supabase, input.userId),
    withTarget,
    "Failed Move must roll back target deletion, source movement, and plan metadata together.",
  );

  const cleanupTarget = await input.supabase
    .from("planned_workouts")
    .delete()
    .eq("id", targetWorkoutId)
    .eq("user_id", input.userId);
  if (cleanupTarget.error) {
    throw new Error(cleanupTarget.error.message);
  }

  return true as const;
}

async function validateImportedWorkoutEditAtomicPersistence(input: {
  review: ManualWorkoutReadyReview;
  supabase: ReturnType<typeof createAdminSupabaseClient>;
}) {
  const disposableUser = await createDisposableSupabaseUser({
    supabase: input.supabase,
    emailPrefix: "imported-workout-edit",
    validationKind: "imported_workout_edit_atomic_persistence",
    creationErrorMessage: "Disposable imported workout edit user creation failed.",
  });
  let proof: {
    planSourceKind: string;
    originSourceKind: string;
    originSourceStatus: string;
    plannedWorkoutId: string;
    originalWorkoutSourceId: string | null;
    originalWorkoutSourceType: string | null;
    originalWorkoutFamily: string | null;
    originalWorkoutIdentity: string | null;
    failureAtomic: true;
    replacementFailureAtomic: true;
    todayUnloggedEditable: true;
    todayHistoryBackedEditable: true;
    historyPreserved: true;
  } | null = null;
  let cleanup: ManualDisposableCleanupProof | null = null;

  try {
    const authoredPlan = buildManualWorkoutUserBuiltTrainingPlan(input.review.draft);
    const externalPlan = {
      ...authoredPlan,
      plan_name: "Imported runner-owned edit proof",
      source_kind: "external_coach_export_v7",
      source_status: "confirmed_external_plan",
    } satisfies TrainingPlanV2;

    await applyImportedPlanForUser(disposableUser.userId, externalPlan, null);

    const imported = await loadPersistedManualPlanForUser(input.supabase, disposableUser.userId);
    const importedSourceWorkout = imported.workouts[0];
    assert.ok(importedSourceWorkout, "Imported edit proof requires one persisted workout.");
    assert.equal(imported.plan.source_kind, TRAINING_PLAN_V2_IMPORT_SOURCE_KIND);
    assert.deepEqual(readImportOrigin(imported.plan), {
      sourceKind: "external_coach_export_v7",
      sourceStatus: "confirmed_external_plan",
    });

    const today = todayIso();
    const dateUpdate = await input.supabase
      .from("planned_workouts")
      .update({
        workout_date: today,
        weekday: weekdayLong(today),
      })
      .eq("id", importedSourceWorkout.id)
      .eq("user_id", disposableUser.userId);
    if (dateUpdate.error) throw new Error(dateUpdate.error.message);
    const importedToday = await loadPersistedManualPlanForUser(
      input.supabase,
      disposableUser.userId,
    );
    const sourceWorkout = importedToday.workouts.find(
      (workout) => workout.id === importedSourceWorkout.id,
    );
    assert.ok(sourceWorkout, "Today import edit proof requires the persisted source workout.");

    const todayUnloggedEdit = await reviewConfirmAndReadPersistedWorkoutEdit({
      supabase: input.supabase,
      userId: disposableUser.userId,
      persisted: importedToday,
      title: "Runner-owned imported workout edit today",
    });
    assert.deepEqual(
      readLatestUserEditPreviousWorkout(todayUnloggedEdit.edited.plan),
      sourceWorkout,
      "Today edit must retain the complete pre-edit planned workout.",
    );

    const logId = crypto.randomUUID();
    const log = await input.supabase
      .from("workout_logs")
      .insert({
        id: logId,
        planned_workout_id: todayUnloggedEdit.editedWorkout.id,
        user_id: disposableUser.userId,
        outcome: "completed",
        actual_distance_km: 5,
        actual_duration_min: 35,
        rpe: 5,
        notes: "History-backed edit proof",
        intervals_completed: null,
        body_notes: [],
      })
      .select("*")
      .single();
    if (log.error || !log.data) {
      throw new Error(log.error?.message ?? "History-backed edit log setup failed.");
    }
    const assetId = crypto.randomUUID();
    const asset = await input.supabase
      .from("workout_result_assets")
      .insert({
        id: assetId,
        user_id: disposableUser.userId,
        planned_workout_id: todayUnloggedEdit.editedWorkout.id,
        workout_log_id: logId,
        asset_kind: "garmin_fit",
        storage_bucket: "workout-result-assets",
        storage_path: `history-backed-edit/${assetId}.fit`,
        original_file_name: "history-backed-edit.fit",
        mime_type: "application/octet-stream",
        file_size_bytes: 1,
        parse_status: "uploaded",
        primary_file_kind: "fit",
        primary_file_name: "history-backed-edit.fit",
      })
      .select("*")
      .single();
    if (asset.error || !asset.data) {
      throw new Error(asset.error?.message ?? "History-backed edit asset setup failed.");
    }

    const edit = await reviewConfirmAndReadPersistedWorkoutEdit({
      supabase: input.supabase,
      userId: disposableUser.userId,
      persisted: todayUnloggedEdit.edited,
      title: "Runner-owned imported workout edit with history",
    });
    const { confirm, edited, editedDraftInput, editedWorkout } = edit;

    assert.equal(
      confirm.sourceMetadata.originalPlanSourceKind,
      TRAINING_PLAN_V2_IMPORT_SOURCE_KIND,
    );
    assert.equal(confirm.sourceMetadata.originalPlanOriginSourceKind, "external_coach_export_v7");
    assert.equal(confirm.sourceMetadata.originalPlanOriginSourceStatus, "confirmed_external_plan");
    assert.equal(
      confirm.sourceMetadata.originalWorkoutSourceId,
      todayUnloggedEdit.editedWorkout.source_workout_id,
    );
    assert.equal(
      confirm.sourceMetadata.originalWorkoutSourceType,
      todayUnloggedEdit.editedWorkout.source_workout_type,
    );
    assert.equal(
      confirm.sourceMetadata.originalWorkoutFamily,
      todayUnloggedEdit.editedWorkout.workout_family,
    );
    assert.equal(
      confirm.sourceMetadata.originalWorkoutIdentity,
      todayUnloggedEdit.editedWorkout.workout_identity,
    );

    assert.equal(editedWorkout.id, sourceWorkout.id);
    assert.equal(editedWorkout.title, editedDraftInput.title);
    assert.deepEqual(readImportOrigin(edited.plan), {
      sourceKind: "external_coach_export_v7",
      sourceStatus: "confirmed_external_plan",
    });
    assert.deepEqual(readLatestUserEditProvenance(edited.plan), {
      originalPlanSourceKind: TRAINING_PLAN_V2_IMPORT_SOURCE_KIND,
      originalPlanOriginSourceKind: "external_coach_export_v7",
      originalPlanOriginSourceStatus: "confirmed_external_plan",
      originalWorkoutSourceId: todayUnloggedEdit.editedWorkout.source_workout_id,
      originalWorkoutSourceType: todayUnloggedEdit.editedWorkout.source_workout_type,
      originalWorkoutFamily: todayUnloggedEdit.editedWorkout.workout_family,
      originalWorkoutIdentity: todayUnloggedEdit.editedWorkout.workout_identity,
    });
    assert.deepEqual(
      readLatestUserEditPreviousWorkout(edited.plan),
      todayUnloggedEdit.editedWorkout,
      "History-backed edit must retain the immediately preceding planned workout truth.",
    );
    assert.equal(
      readUserEditHistory(edited.plan).length,
      2,
      "Repeated edits must append rather than replace prior planned truth.",
    );
    const persistedLog = await input.supabase
      .from("workout_logs")
      .select("*")
      .eq("id", logId)
      .single();
    const persistedAsset = await input.supabase
      .from("workout_result_assets")
      .select("*")
      .eq("id", assetId)
      .single();
    assert.equal(persistedLog.error, null);
    assert.equal(persistedAsset.error, null);
    assert.deepEqual(persistedLog.data, log.data);
    assert.deepEqual(persistedAsset.data, asset.data);

    const forcedFailure = await input.supabase.rpc("apply_active_plan_workout_content_edit", {
      p_current_date: todayIso(),
      p_expected_plan_updated_at: edited.plan.updated_at,
      p_expected_workout: buildSourceWorkoutFingerprint(editedWorkout) as Json,
      p_plan_goal_metadata: {
        ...asJsonObject(edited.plan.goal_metadata),
        atomicity_probe: "must_rollback",
      },
      p_plan_id: edited.plan.id,
      p_plan_preferences: asJsonObject(edited.plan.plan_preferences),
      p_user_id: disposableUser.userId,
      p_workout_id: editedWorkout.id,
      p_workout_update: {
        phase: editedWorkout.phase,
        workout_type: editedWorkout.workout_type,
        source_workout_id: editedWorkout.source_workout_id,
        source_workout_type: editedWorkout.source_workout_type,
        workout_family: editedWorkout.workout_family,
        workout_identity: editedWorkout.workout_identity,
        calendar_icon_key: editedWorkout.calendar_icon_key,
        goal_context: editedWorkout.goal_context,
        metric_mode: editedWorkout.metric_mode,
        title: "This write must roll back",
        notes: editedWorkout.notes,
        planned_rpe: editedWorkout.planned_rpe,
        estimated_fatigue: editedWorkout.estimated_fatigue,
        recovery_priority: editedWorkout.recovery_priority,
        steps: { invalid: "planned_workouts.steps must remain an array" },
        display_order: editedWorkout.display_order,
      },
    });
    assert.ok(forcedFailure.error, "Invalid second write must fail the database transaction.");

    const afterFailure = await loadPersistedManualPlanForUser(
      input.supabase,
      disposableUser.userId,
    );
    assert.deepEqual(afterFailure.plan, edited.plan);
    assert.deepEqual(afterFailure.workouts, edited.workouts);
    const afterFailureLog = await input.supabase
      .from("workout_logs")
      .select("*")
      .eq("id", logId)
      .single();
    const afterFailureAsset = await input.supabase
      .from("workout_result_assets")
      .select("*")
      .eq("id", assetId)
      .single();
    assert.equal(afterFailureLog.error, null);
    assert.equal(afterFailureAsset.error, null);
    assert.deepEqual(afterFailureLog.data, log.data);
    assert.deepEqual(afterFailureAsset.data, asset.data);
    const replacementFailureAtomic = await validatePlanReplacementFailureAtomicity({
      supabase: input.supabase,
      userId: disposableUser.userId,
      persisted: edited,
    });

    proof = {
      planSourceKind: imported.plan.source_kind!,
      originSourceKind: "external_coach_export_v7",
      originSourceStatus: "confirmed_external_plan",
      plannedWorkoutId: sourceWorkout.id,
      originalWorkoutSourceId: todayUnloggedEdit.editedWorkout.source_workout_id,
      originalWorkoutSourceType: todayUnloggedEdit.editedWorkout.source_workout_type,
      originalWorkoutFamily: todayUnloggedEdit.editedWorkout.workout_family,
      originalWorkoutIdentity: todayUnloggedEdit.editedWorkout.workout_identity,
      failureAtomic: true,
      replacementFailureAtomic,
      todayUnloggedEditable: true,
      todayHistoryBackedEditable: true,
      historyPreserved: true,
    };
  } finally {
    cleanup = await cleanupDisposableManualWorkoutUser(input.supabase, disposableUser.userId);
  }

  assert.ok(proof, "Imported workout edit persistence proof must complete.");
  assert.ok(cleanup, "Imported workout edit cleanup proof must be captured.");

  return {
    persisted: proof,
    cleanup,
  };
}

async function validatePlanReplacementFailureAtomicity(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  persisted: PersistedManualPlanReadback;
}) {
  const sourceWorkout = input.persisted.workouts[0];
  assert.ok(sourceWorkout, "Atomic replacement proof requires a source workout.");
  const assetId = crypto.randomUUID();
  const asset = await input.supabase
    .from("workout_result_assets")
    .insert({
      id: assetId,
      user_id: input.userId,
      planned_workout_id: sourceWorkout.id,
      workout_log_id: null,
      asset_kind: "garmin_fit",
      storage_bucket: "workout-result-assets",
      storage_path: `atomic-replacement-failure/${assetId}.fit`,
      original_file_name: "atomic-replacement-failure.fit",
      mime_type: "application/octet-stream",
      file_size_bytes: 1,
      parse_status: "uploaded",
      primary_file_kind: "fit",
      primary_file_name: "atomic-replacement-failure.fit",
    })
    .select("*")
    .single();
  if (asset.error || !asset.data) {
    throw new Error(asset.error?.message ?? "Atomic replacement asset setup failed.");
  }

  const beforePlans = await input.supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: true });
  if (beforePlans.error || !beforePlans.data) {
    throw new Error(beforePlans.error?.message ?? "Atomic replacement snapshot failed.");
  }

  const nextPlanId = crypto.randomUUID();
  const nextWorkoutId = crypto.randomUUID();
  await assert.rejects(
    applyAtomicReviewedPlanPersistence({
      userId: input.userId,
      profile: {
        goal_type: input.persisted.profile.goal_type,
        goal_label: input.persisted.profile.goal_label,
        baseline_sessions_per_week: input.persisted.profile.baseline_sessions_per_week,
        baseline_long_run_km: input.persisted.profile.baseline_long_run_km,
        baseline_notes: input.persisted.profile.baseline_notes,
      },
      plan: {
        id: nextPlanId,
        title: "Atomic replacement failure proof",
        goal_summary: input.persisted.plan.goal_summary,
        source_template: "atomic_replacement_failure_proof",
        schema_version: input.persisted.plan.schema_version,
        source_kind: TRAINING_PLAN_V2_IMPORT_SOURCE_KIND,
        start_date: input.persisted.plan.start_date,
        end_date: input.persisted.plan.end_date,
        target_date: input.persisted.plan.target_date,
        goal_metadata: input.persisted.plan.goal_metadata,
        plan_preferences: input.persisted.plan.plan_preferences,
      },
      workouts: [
        {
          ...sourceWorkout,
          id: nextWorkoutId,
          plan_cycle_id: nextPlanId,
        },
      ] as unknown as Json,
      expectedActivePlanId: input.persisted.plan.id,
      expectedActivePlanUpdatedAt: input.persisted.plan.updated_at,
      expectedHistory: {
        workout_ids: input.persisted.workouts.map((workout) => workout.id).sort(),
        log_ids: [],
        asset_ids: [assetId],
        metric_ids: [],
        comparison_ids: [],
        insight_ids: [],
      },
      archiveGoalMetadata: input.persisted.plan.goal_metadata,
      logs: [],
      evidenceRelinks: [
        {
          table: "workout_result_assets",
          id: assetId,
          source_workout_id: crypto.randomUUID(),
          target_workout_id: nextWorkoutId,
          source_workout_log_id: null,
          target_workout_log_id: null,
        },
      ],
    }),
  );

  assert.deepEqual(
    await loadPersistedManualPlanForUser(input.supabase, input.userId),
    input.persisted,
    "Failed replacement must preserve the prior active plan, profile, and workouts.",
  );
  const afterPlans = await input.supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: true });
  assert.equal(afterPlans.error, null);
  assert.deepEqual(
    afterPlans.data,
    beforePlans.data,
    "Failed replacement must not leave an archived replacement cycle behind.",
  );
  const afterAsset = await input.supabase
    .from("workout_result_assets")
    .select("*")
    .eq("id", assetId)
    .single();
  assert.equal(afterAsset.error, null);
  assert.deepEqual(
    afterAsset.data,
    asset.data,
    "Failed replacement must leave existing evidence attached to the prior workout.",
  );

  return true as const;
}

async function validateReplacementCarryForwardPersistence(input: {
  review: ManualWorkoutReadyReview;
  supabase: ReturnType<typeof createAdminSupabaseClient>;
}) {
  const disposableUser = await createDisposableSupabaseUser({
    supabase: input.supabase,
    emailPrefix: "plan-replacement-carry-forward",
    validationKind: "plan_replacement_atomic_carry_forward",
    creationErrorMessage: "Disposable plan replacement user creation failed.",
  });
  let cleanup: ManualDisposableCleanupProof | null = null;

  try {
    const authoredPlan = buildManualWorkoutUserBuiltTrainingPlan(input.review.draft);
    const firstPlan = {
      ...authoredPlan,
      plan_name: "Atomic carry-forward source",
      source_kind: "external_coach_export_v7",
      source_status: "confirmed_external_plan",
    } satisfies TrainingPlanV2;
    await applyImportedPlanForUser(disposableUser.userId, firstPlan, null);
    const before = await loadPersistedManualPlanForUser(input.supabase, disposableUser.userId);
    const sourceWorkout = before.workouts[0];
    assert.ok(sourceWorkout, "Replacement carry-forward proof requires one source workout.");

    const logId = crypto.randomUUID();
    const log = await input.supabase
      .from("workout_logs")
      .insert({
        id: logId,
        planned_workout_id: sourceWorkout.id,
        user_id: disposableUser.userId,
        outcome: "completed",
        actual_distance_km: 5,
        actual_duration_min: 35,
        rpe: 4,
        notes: "Atomic carry-forward proof",
        intervals_completed: null,
        body_notes: [],
      })
      .select("*")
      .single();
    if (log.error || !log.data) {
      throw new Error(log.error?.message ?? "Replacement carry-forward log setup failed.");
    }

    const assetId = crypto.randomUUID();
    const asset = await input.supabase.from("workout_result_assets").insert({
      id: assetId,
      user_id: disposableUser.userId,
      planned_workout_id: sourceWorkout.id,
      workout_log_id: logId,
      asset_kind: "garmin_fit",
      storage_bucket: "workout-result-assets",
      storage_path: `atomic-proof/${disposableUser.userId}/${assetId}.fit`,
      original_file_name: "atomic-proof.fit",
      mime_type: "application/octet-stream",
      file_size_bytes: 128,
      parse_status: "parsed",
      primary_file_kind: "fit",
      primary_file_name: "atomic-proof.fit",
    });
    if (asset.error) throw new Error(asset.error.message);

    const metricsId = crypto.randomUUID();
    const metrics = await input.supabase.from("workout_actual_metrics").insert({
      id: metricsId,
      user_id: disposableUser.userId,
      planned_workout_id: sourceWorkout.id,
      workout_log_id: logId,
      result_asset_id: assetId,
      source_kind: "garmin_fit",
      status: "reviewed",
      actual_distance_km: 5,
      actual_duration_min: 35,
      summary_payload: { source: "atomic-proof" },
    });
    if (metrics.error) throw new Error(metrics.error.message);

    const comparisonId = crypto.randomUUID();
    const comparison = await input.supabase.from("workout_comparisons").insert({
      id: comparisonId,
      user_id: disposableUser.userId,
      planned_workout_id: sourceWorkout.id,
      actual_metrics_id: metricsId,
      comparison_status: "complete",
      completion_state: "matched",
      comparison_confidence: 1,
      difference_payload: {
        plannedWorkout: {
          plannedWorkoutId: sourceWorkout.id,
        },
      },
    });
    if (comparison.error) throw new Error(comparison.error.message);

    const insightId = crypto.randomUUID();
    const insight = await input.supabase.from("workout_ai_insights").insert({
      id: insightId,
      user_id: disposableUser.userId,
      planned_workout_id: sourceWorkout.id,
      actual_metrics_id: metricsId,
      comparison_id: comparisonId,
      model: "atomic-proof",
      status: "final",
      analysis_summary: "Atomic proof",
      difference_explanation: "Atomic proof",
      next_workout_recommendation: "Keep",
      recommendation_level: "keep",
      caution_flags: [],
    });
    if (insight.error) throw new Error(insight.error.message);

    const secondWorkoutDate = addDaysIso(input.review.draft.workoutDate, 7);
    const secondWorkoutPlan = buildManualWorkoutUserBuiltTrainingPlan({
      ...input.review.draft,
      workoutDate: secondWorkoutDate,
      weekday: weekdayLong(secondWorkoutDate),
      title: "Atomic replacement future workout",
    });
    const replacementPlan = {
      ...firstPlan,
      plan_name: "Atomic carry-forward replacement",
      preparation_horizon_weeks: 2,
      planned_workouts: [
        ...firstPlan.planned_workouts,
        ...secondWorkoutPlan.planned_workouts.map((workout) => ({
          ...workout,
          week_number: 2,
        })),
      ],
    } satisfies TrainingPlanV2;
    await applyImportedPlanForUser(disposableUser.userId, replacementPlan, null);

    const after = await loadPersistedManualPlanForUser(input.supabase, disposableUser.userId);
    const carriedWorkout = after.workouts.find(
      (workout) => workout.workout_date === sourceWorkout.workout_date,
    );
    assert.ok(carriedWorkout, "Replacement must retain the protected workout date.");
    assert.notEqual(carriedWorkout.id, sourceWorkout.id);
    const [logs, assets, actualMetrics, comparisons, insights, plans] = await Promise.all([
      input.supabase.from("workout_logs").select("*").eq("user_id", disposableUser.userId),
      input.supabase.from("workout_result_assets").select("*").eq("user_id", disposableUser.userId),
      input.supabase
        .from("workout_actual_metrics")
        .select("*")
        .eq("user_id", disposableUser.userId),
      input.supabase.from("workout_comparisons").select("*").eq("user_id", disposableUser.userId),
      input.supabase.from("workout_ai_insights").select("*").eq("user_id", disposableUser.userId),
      input.supabase.from("plan_cycles").select("*").eq("user_id", disposableUser.userId),
    ]);
    for (const result of [logs, assets, actualMetrics, comparisons, insights, plans]) {
      assert.equal(result.error, null);
    }
    const carriedLog = logs.data?.find((row) => row.planned_workout_id === carriedWorkout.id);
    assert.ok(carriedLog, "Replacement must copy the protected workout log.");
    assert.notEqual(carriedLog.id, logId);
    assert.equal(assets.data?.[0]?.planned_workout_id, carriedWorkout.id);
    assert.equal(assets.data?.[0]?.workout_log_id, carriedLog.id);
    assert.equal(actualMetrics.data?.[0]?.planned_workout_id, carriedWorkout.id);
    assert.equal(actualMetrics.data?.[0]?.workout_log_id, carriedLog.id);
    assert.equal(comparisons.data?.[0]?.planned_workout_id, carriedWorkout.id);
    assert.equal(
      asJsonObject(asJsonObject(comparisons.data?.[0]?.difference_payload).plannedWorkout)
        .plannedWorkoutId,
      carriedWorkout.id,
    );
    assert.equal(insights.data?.[0]?.planned_workout_id, carriedWorkout.id);
    assert.equal(plans.data?.filter((plan) => plan.status === "active").length, 1);
    assert.equal(plans.data?.filter((plan) => plan.status === "archived").length, 1);

    return {
      activePlanId: after.plan.id,
      archivedPlanId: before.plan.id,
      carriedWorkoutId: carriedWorkout.id,
      carriedLogId: carriedLog.id,
      evidenceRelinked: true as const,
    };
  } finally {
    cleanup = await cleanupDisposableManualWorkoutUser(input.supabase, disposableUser.userId);
    assert.ok(cleanup, "Replacement carry-forward cleanup proof must be captured.");
  }
}

async function validateClearBeforeImportAtomicPersistence(input: {
  review: ManualWorkoutReadyReview;
  supabase: ReturnType<typeof createAdminSupabaseClient>;
}) {
  const disposableUser = await createDisposableSupabaseUser({
    supabase: input.supabase,
    emailPrefix: "clear-before-import",
    validationKind: "clear_before_import_atomic_persistence",
    creationErrorMessage: "Disposable clear-before-import user creation failed.",
  });
  let cleanup: ManualDisposableCleanupProof | null = null;

  try {
    const firstPlan = buildManualWorkoutUserBuiltTrainingPlan(input.review.draft);
    const extraWorkoutDate = addDaysIso(input.review.draft.workoutDate, 7);
    const extraWorkoutPlan = buildManualWorkoutUserBuiltTrainingPlan({
      ...input.review.draft,
      workoutDate: extraWorkoutDate,
      weekday: weekdayLong(extraWorkoutDate),
      title: "Unprotected upcoming workout",
    });
    const sourcePlan = {
      ...firstPlan,
      plan_name: "Clear-before-import source",
      preparation_horizon_weeks: 2,
      source_kind: "external_coach_export_v7",
      source_status: "confirmed_external_plan",
      planned_workouts: [
        ...firstPlan.planned_workouts,
        ...extraWorkoutPlan.planned_workouts.map((workout) => ({
          ...workout,
          week_number: 2,
        })),
      ],
    } satisfies TrainingPlanV2;
    await applyImportedPlanForUser(disposableUser.userId, sourcePlan, null);

    const source = await loadPersistedManualPlanForUser(input.supabase, disposableUser.userId);
    const protectedWorkout = source.workouts[0];
    const unprotectedWorkout = source.workouts[1];
    assert.ok(protectedWorkout, "Clear-before-import proof requires a protected workout.");
    assert.ok(unprotectedWorkout, "Clear-before-import proof requires an unprotected workout.");

    const logId = crypto.randomUUID();
    const log = await input.supabase
      .from("workout_logs")
      .insert({
        id: logId,
        planned_workout_id: protectedWorkout.id,
        user_id: disposableUser.userId,
        outcome: "completed",
        actual_distance_km: 5,
        actual_duration_min: 35,
        rpe: 4,
        notes: "Clear-before-import history",
        intervals_completed: null,
        body_notes: [],
      })
      .select("*")
      .single();
    if (log.error || !log.data) {
      throw new Error(log.error?.message ?? "Clear-before-import log setup failed.");
    }

    const assetId = crypto.randomUUID();
    const asset = await input.supabase
      .from("workout_result_assets")
      .insert({
        id: assetId,
        user_id: disposableUser.userId,
        planned_workout_id: protectedWorkout.id,
        workout_log_id: logId,
        asset_kind: "garmin_fit",
        storage_bucket: "workout-result-assets",
        storage_path: `clear-before-import/${assetId}.fit`,
        original_file_name: "clear-before-import.fit",
        mime_type: "application/octet-stream",
        file_size_bytes: 1,
        parse_status: "uploaded",
        primary_file_kind: "fit",
        primary_file_name: "clear-before-import.fit",
      })
      .select("*")
      .single();
    if (asset.error || !asset.data) {
      throw new Error(asset.error?.message ?? "Clear-before-import asset setup failed.");
    }

    const beforeFailure = await loadImportLifecycleState(input.supabase, disposableUser.userId);
    const invalidPlanId = crypto.randomUUID();
    const invalidWorkoutId = crypto.randomUUID();
    await assert.rejects(
      applyAtomicReviewedImportPersistence({
        userId: disposableUser.userId,
        profile: {
          goal_type: source.profile.goal_type,
          goal_label: source.profile.goal_label,
          baseline_sessions_per_week: source.profile.baseline_sessions_per_week,
          baseline_long_run_km: source.profile.baseline_long_run_km,
          baseline_notes: source.profile.baseline_notes,
        },
        plan: {
          id: invalidPlanId,
          title: "Clear-before-import forced failure",
          goal_summary: source.plan.goal_summary,
          source_template: "clear_before_import_failure_proof",
          schema_version: source.plan.schema_version,
          source_kind: TRAINING_PLAN_V2_IMPORT_SOURCE_KIND,
          start_date: unprotectedWorkout.workout_date,
          end_date: unprotectedWorkout.workout_date,
          target_date: null,
          goal_metadata: null,
          plan_preferences: null,
        },
        workouts: [
          {
            ...unprotectedWorkout,
            id: invalidWorkoutId,
            plan_cycle_id: invalidPlanId,
            workout_type: "invalid_after_archive",
            display_order: 0,
          },
        ] as unknown as Json,
        expectedActivePlanId: source.plan.id,
        expectedActivePlanUpdatedAt: source.plan.updated_at,
        expectedHistory: {
          workout_ids: source.workouts.map((workout) => workout.id).sort(),
          log_ids: [logId],
          asset_ids: [assetId],
          metric_ids: [],
          comparison_ids: [],
          insight_ids: [],
        },
        archiveGoalMetadata: source.plan.goal_metadata,
        logs: [],
        evidenceRelinks: [],
        clearBeforeImport: true,
      }),
    );
    assert.deepEqual(
      await loadImportLifecycleState(input.supabase, disposableUser.userId),
      beforeFailure,
      "A late import failure must roll back the preliminary archive and every new row.",
    );

    const replacementWorkoutDate = addDaysIso(input.review.draft.workoutDate, 14);
    const replacementPlan = {
      ...buildManualWorkoutUserBuiltTrainingPlan({
        ...input.review.draft,
        workoutDate: replacementWorkoutDate,
        weekday: weekdayLong(replacementWorkoutDate),
        title: "Imported replacement workout",
      }),
      plan_name: "Clear-before-import replacement",
      source_kind: "external_coach_export_v8",
      source_status: "confirmed_external_plan",
    } satisfies TrainingPlanV2;
    const applied = await applyImportedPlanForUser(
      disposableUser.userId,
      replacementPlan,
      null,
      null,
      null,
      null,
      { clearBeforeImport: true },
    );
    assert.equal(applied.ok, true);

    const afterSuccess = await loadImportLifecycleState(input.supabase, disposableUser.userId);
    const activePlan = afterSuccess.plans.find((plan) => plan.status === "active");
    const archivedPlan = afterSuccess.plans.find((plan) => plan.id === source.plan.id);
    assert.ok(activePlan, "Clear-before-import must activate the imported plan.");
    assert.equal(archivedPlan?.status, "archived");
    assert.deepEqual(archivedPlan?.goal_metadata, source.plan.goal_metadata);
    const activeWorkouts = afterSuccess.workouts.filter(
      (workout) => workout.plan_cycle_id === activePlan.id,
    );
    const archivedWorkouts = afterSuccess.workouts.filter(
      (workout) => workout.plan_cycle_id === source.plan.id,
    );
    assert.equal(activeWorkouts.length, 1);
    assert.equal(activeWorkouts[0]?.workout_date, replacementWorkoutDate);
    assert.equal(
      activeWorkouts.some((workout) => workout.id === unprotectedWorkout.id),
      false,
      "The prior unprotected upcoming row must not remain in the active schedule.",
    );
    assert.deepEqual(archivedWorkouts, beforeFailure.workouts);
    assert.deepEqual(afterSuccess.logs, beforeFailure.logs);
    assert.deepEqual(afterSuccess.assets, beforeFailure.assets);
    assert.deepEqual(afterSuccess.metrics, beforeFailure.metrics);
    assert.deepEqual(afterSuccess.comparisons, beforeFailure.comparisons);
    assert.deepEqual(afterSuccess.insights, beforeFailure.insights);

    return {
      archivedPlanId: source.plan.id,
      activePlanId: activePlan.id,
      priorWorkoutRowsPreserved: archivedWorkouts.length,
      priorLogRowsPreserved: afterSuccess.logs.length,
      priorEvidenceRowsPreserved: afterSuccess.assets.length,
      unprotectedUpcomingRemovedFromActive: true as const,
      lateFailureAtomic: true as const,
    };
  } finally {
    cleanup = await cleanupDisposableManualWorkoutUser(input.supabase, disposableUser.userId);
    assert.ok(cleanup, "Clear-before-import cleanup proof must be captured.");
  }
}

async function loadImportLifecycleState(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const [profiles, plans, workouts, logs, assets, metrics, comparisons, insights] =
    await Promise.all([
      supabase.from("runner_profiles").select("*").eq("user_id", userId).order("user_id"),
      supabase.from("plan_cycles").select("*").eq("user_id", userId).order("id"),
      supabase.from("planned_workouts").select("*").eq("user_id", userId).order("id"),
      supabase.from("workout_logs").select("*").eq("user_id", userId).order("id"),
      supabase.from("workout_result_assets").select("*").eq("user_id", userId).order("id"),
      supabase.from("workout_actual_metrics").select("*").eq("user_id", userId).order("id"),
      supabase.from("workout_comparisons").select("*").eq("user_id", userId).order("id"),
      supabase.from("workout_ai_insights").select("*").eq("user_id", userId).order("id"),
    ]);

  for (const result of [profiles, plans, workouts, logs, assets, metrics, comparisons, insights]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    profiles: profiles.data ?? [],
    plans: plans.data ?? [],
    workouts: workouts.data ?? [],
    logs: logs.data ?? [],
    assets: assets.data ?? [],
    metrics: metrics.data ?? [],
    comparisons: comparisons.data ?? [],
    insights: insights.data ?? [],
  };
}

async function validateCanonicalOriginWorkoutEditPersistence(input: {
  review: ManualWorkoutReadyReview;
  supabase: ReturnType<typeof createAdminSupabaseClient>;
}) {
  const origins = [
    {
      label: "generated",
      sourceKind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
      sourceStatus: "confirmed_ai_authored_plan",
    },
  ] as const;
  type CanonicalOriginEditProof = {
    label: (typeof origins)[number]["label"];
    sourceKind: (typeof origins)[number]["sourceKind"];
    plannedWorkoutId: string;
    originalWorkoutSourceId: string | null;
    originalWorkoutSourceType: string | null;
    originalWorkoutFamily: string | null;
    originalWorkoutIdentity: string | null;
    cleanup: ManualDisposableCleanupProof;
  };
  const proofs: CanonicalOriginEditProof[] = [];

  for (const origin of origins) {
    const disposableUser = await createDisposableSupabaseUser({
      supabase: input.supabase,
      emailPrefix: `${origin.label}-workout-edit`,
      validationKind: `${origin.label}_workout_edit_atomic_persistence`,
      creationErrorMessage: `Disposable ${origin.label} workout edit user creation failed.`,
    });
    let proof: Omit<CanonicalOriginEditProof, "cleanup"> | null = null;
    let cleanup: ManualDisposableCleanupProof | null = null;

    try {
      const previewInput = {
        age: 36,
        heightCm: 178,
        weightKg: 74,
        runnerLevel: "sometimes_runs" as const,
        daysPerWeek: 4,
        fixedRestDays: ["Tuesday", "Saturday"] as const,
        preferredLongRunDay: "Sunday" as const,
        startDate: addDaysIso(todayIso(), 1),
        benchmark: { kind: "unknown" as const },
        planGoalIntent: {
          distance: { kind: "preset" as const, preset: "10K" as const },
        },
      };
      const authoring = buildAiGeneratedRunningPlanAuthoringInput(previewInput);
      assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
      if (!authoring.ok) throw new Error(authoring.message);
      const fixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
        authoringInput: authoring.authoringInput,
        qaFixtureAuthorized: true,
        today: previewInput.startDate,
        env: {
          LOCAL_AUTH_BYPASS_ENABLED: "true",
          LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
          NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
          HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
          HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "qa_fixture",
          [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV]: "non_repeat_tempo",
        },
      });
      assert.ok(fixtureOptions, "Local AI plan fixture must be available for persistence proof.");
      const previousFixtureScenario =
        process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
      process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV] = "non_repeat_tempo";
      let reviewed: Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>;
      try {
        reviewed = await buildReviewedAiGeneratedRunningPlanPreview(previewInput, {
          aiPreview: {
            ...fixtureOptions,
            generationLedger: { disabled: true },
          },
        });
      } finally {
        if (previousFixtureScenario === undefined) {
          delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
        } else {
          process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV] = previousFixtureScenario;
        }
      }
      assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
      if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
      const reviewedPlan = {
        ...buildRunningPlanCanonicalPlan(reviewed.draft),
        plan_name: `${origin.label} runner-owned edit proof`,
        source_kind: origin.sourceKind,
        source_status: origin.sourceStatus,
      } satisfies TrainingPlanV2;

      await createFirstPlanFromReviewedCanonicalPlanForUser(disposableUser.userId, reviewedPlan);

      const persisted = await loadPersistedManualPlanForUser(input.supabase, disposableUser.userId);
      assert.equal(persisted.plan.source_kind, origin.sourceKind);
      const edit = await reviewConfirmAndReadPersistedWorkoutEdit({
        supabase: input.supabase,
        userId: disposableUser.userId,
        persisted,
        title: `Runner-owned ${origin.label} workout edit`,
        workoutIdentity: "controlled_tempo_session",
        workoutPace: "4:50-5:00/km",
      });

      assert.equal(edit.confirm.sourceMetadata.originalPlanSourceKind, origin.sourceKind);
      assert.equal(edit.confirm.sourceMetadata.originalPlanOriginSourceKind, null);
      assert.equal(edit.confirm.sourceMetadata.originalPlanOriginSourceStatus, null);
      assert.equal(edit.editedWorkout.id, edit.sourceWorkout.id);
      assert.equal(edit.editedWorkout.title, edit.editedDraftInput.title);
      assert.deepEqual(
        findAiAuthoredPaceTarget(edit.editedWorkout.steps),
        findAiAuthoredPaceTarget(edit.sourceWorkout.steps),
      );
      assert.equal(findAiAuthoredPaceTarget(edit.editedWorkout.steps)?.pace, "4:50-5:00/km");
      assert.deepEqual(readLatestUserEditProvenance(edit.edited.plan), {
        originalPlanSourceKind: origin.sourceKind,
        originalPlanOriginSourceKind: null,
        originalPlanOriginSourceStatus: null,
        originalWorkoutSourceId: edit.sourceWorkout.source_workout_id,
        originalWorkoutSourceType: edit.sourceWorkout.source_workout_type,
        originalWorkoutFamily: edit.sourceWorkout.workout_family,
        originalWorkoutIdentity: edit.sourceWorkout.workout_identity,
      });
      assert.deepEqual(
        readLatestUserEditPreviousWorkout(edit.edited.plan),
        edit.sourceWorkout,
        `${origin.label} edit history must retain complete pre-edit planned truth.`,
      );

      proof = {
        label: origin.label,
        sourceKind: origin.sourceKind,
        plannedWorkoutId: edit.editedWorkout.id,
        originalWorkoutSourceId: edit.sourceWorkout.source_workout_id,
        originalWorkoutSourceType: edit.sourceWorkout.source_workout_type,
        originalWorkoutFamily: edit.sourceWorkout.workout_family,
        originalWorkoutIdentity: edit.sourceWorkout.workout_identity,
      };
    } finally {
      cleanup = await cleanupDisposableManualWorkoutUser(input.supabase, disposableUser.userId);
    }

    assert.ok(proof, `${origin.label} workout edit persistence proof must complete.`);
    assert.ok(cleanup, `${origin.label} workout edit cleanup proof must be captured.`);
    proofs.push({
      ...proof,
      cleanup,
    });
  }

  return proofs;
}

async function reviewConfirmAndReadPersistedWorkoutEdit(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  persisted: PersistedManualPlanReadback;
  title: string;
  workoutIdentity?: string;
  workoutPace?: string;
}) {
  const sourceWorkout = input.persisted.workouts.find(
    (workout) =>
      (!input.workoutIdentity || workout.workout_identity === input.workoutIdentity) &&
      (!input.workoutPace || findAiAuthoredPaceTarget(workout.steps)?.pace === input.workoutPace),
  );
  assert.ok(sourceWorkout, "Persisted edit proof requires one planned workout.");

  const reconstructed = await reconstructManualWorkoutPersistedEditDraftForUser(input.userId, {
    activePlanId: input.persisted.plan.id,
    plannedWorkoutId: sourceWorkout.id,
    workoutDate: sourceWorkout.workout_date,
  });
  assert.equal(reconstructed.ok, true, JSON.stringify(reconstructed));
  if (!reconstructed.ok) {
    throw new Error(reconstructed.message);
  }

  const editedDraftInput: ManualWorkoutDraftInput = {
    ...reconstructed.draftInput,
    title: input.title,
    notes: "Reviewed runner edit with atomic provenance.",
  };
  const review = await reviewManualWorkoutPersistedEditDraftForUser(input.userId, {
    activePlanId: input.persisted.plan.id,
    plannedWorkoutId: sourceWorkout.id,
    workoutDate: sourceWorkout.workout_date,
    draftInput: editedDraftInput,
  });
  assert.equal(review.ok, true, JSON.stringify(review));
  if (!review.ok) {
    throw new Error(review.message);
  }

  const confirm = await confirmManualWorkoutPersistedEditForUser(input.userId, {
    activePlanId: input.persisted.plan.id,
    plannedWorkoutId: sourceWorkout.id,
    workoutDate: sourceWorkout.workout_date,
    draftInput: editedDraftInput,
    reviewToken: review.review.reviewToken,
    reviewChecksum: review.review.reviewChecksum,
  });
  assert.equal(confirm.ok, true, JSON.stringify(confirm));
  if (!confirm.ok) {
    throw new Error(confirm.message);
  }

  const edited = await loadPersistedManualPlanForUser(input.supabase, input.userId);
  const editedWorkout = edited.workouts.find((workout) => workout.id === sourceWorkout.id);
  assert.ok(editedWorkout, "Persisted edit must retain the original workout row.");

  return {
    sourceWorkout,
    editedDraftInput,
    confirm,
    edited,
    editedWorkout,
  };
}

function findAiAuthoredPaceTarget(value: unknown) {
  for (const section of readWorkoutDocumentSections(value)) {
    if (
      section.target?.target_source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE &&
      section.target.pace
    ) {
      return section.target;
    }

    for (const child of section.prescription?.children ?? []) {
      if (
        child.target?.target_source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE &&
        child.target.pace
      ) {
        return child.target;
      }
    }
  }

  return null;
}

async function loadPersistedManualPlanForUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<PersistedManualPlanReadback> {
  const planResult = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (planResult.error || !planResult.data) {
    throw new Error(planResult.error?.message ?? "Persisted manual active plan was not found.");
  }

  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_cycle_id", planResult.data.id)
    .order("display_order", { ascending: true });

  if (workoutsResult.error || !workoutsResult.data) {
    throw new Error(workoutsResult.error?.message ?? "Persisted manual workout was not found.");
  }

  const profileResult = await supabase
    .from("runner_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileResult.error || !profileResult.data) {
    throw new Error(profileResult.error?.message ?? "Persisted runner profile was not found.");
  }

  return {
    plan: planResult.data,
    workouts: workoutsResult.data,
    profile: profileResult.data,
  };
}

function readImportOrigin(plan: PersistedPlanCycleRow) {
  const provenance = asJsonObject(
    asJsonObject(plan.goal_metadata)[TRAINING_PLAN_V2_IMPORT_SOURCE_KIND],
  );

  return {
    sourceKind: provenance.origin_source_kind ?? null,
    sourceStatus: provenance.origin_source_status ?? null,
  };
}

function readLatestUserEditProvenance(plan: PersistedPlanCycleRow) {
  const edit = asJsonObject(asJsonObject(plan.goal_metadata).active_plan_user_edit);

  return {
    originalPlanSourceKind: edit.original_plan_source_kind ?? null,
    originalPlanOriginSourceKind: edit.original_plan_origin_source_kind ?? null,
    originalPlanOriginSourceStatus: edit.original_plan_origin_source_status ?? null,
    originalWorkoutSourceId: edit.original_workout_source_id ?? null,
    originalWorkoutSourceType: edit.original_workout_source_type ?? null,
    originalWorkoutFamily: edit.original_workout_family ?? null,
    originalWorkoutIdentity: edit.original_workout_identity ?? null,
  };
}

function readLatestUserEditPreviousWorkout(plan: PersistedPlanCycleRow) {
  const edit = asJsonObject(asJsonObject(plan.goal_metadata).active_plan_user_edit);
  return asJsonObject(edit.previous_workout);
}

function readUserEditHistory(plan: PersistedPlanCycleRow) {
  const history = asJsonObject(plan.goal_metadata).active_plan_user_edits;
  return Array.isArray(history) ? history : [];
}

function asJsonObject(value: unknown): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}

function validateManualPlanMetadata(plan: PersistedPlanCycleRow, reviewChecksum: string) {
  const manualMetadata = (
    plan.goal_metadata as {
      manual_user_built_plan?: {
        source_status?: string;
        latest_review_checksum?: string;
        row_count?: number;
      };
    } | null
  )?.manual_user_built_plan;

  assert.equal(manualMetadata?.source_status, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
  assert.equal(manualMetadata?.latest_review_checksum, reviewChecksum);
  assert.equal(manualMetadata?.row_count, 1);
}

function readManualSourceStatus(plan: PersistedPlanCycleRow) {
  return readManualMetadata(plan)?.source_status ?? null;
}

function readManualReviewChecksum(plan: PersistedPlanCycleRow) {
  return readManualMetadata(plan)?.latest_review_checksum ?? null;
}

function readManualMetadata(plan: PersistedPlanCycleRow) {
  return (
    plan.goal_metadata as {
      manual_user_built_plan?: {
        latest_review_checksum?: string;
        source_status?: string;
      };
    } | null
  )?.manual_user_built_plan;
}

function validateNoFakePaceOrPersonalHr(rows: readonly PersistedWorkoutRow[]) {
  const serialized = JSON.stringify(rows);

  assert.doesNotMatch(serialized, /"pace_min_per_km_range"|"pace_range_min_km"|"pace"/i);
  assert.doesNotMatch(
    serialized,
    /personal_hr|personalized_hr|hr_zone_truth|"hr_targets_allowed":true/i,
  );
}

async function cleanupDisposableManualWorkoutUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<ManualDisposableCleanupProof> {
  return cleanupDisposableSupabaseUser({
    supabase,
    userId,
    cleanupSpecs: MANUAL_DISPOSABLE_CLEANUP_SPECS,
    includeAuthUserRemaining: true,
    authUserAbsentMessage: "Disposable manual workout auth user must be absent after cleanup.",
  });
}
