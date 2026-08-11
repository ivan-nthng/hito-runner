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
  deleteManualWorkoutSavedTemplateForUser,
  listManualWorkoutTemplateCatalogForUser,
  reconstructManualWorkoutPersistedEditDraftForUser,
  restoreAllManualWorkoutBuiltInTemplatesForUser,
  reviewManualWorkoutDraft,
  reviewManualWorkoutDeleteClearForUser,
  reviewManualWorkoutMoveForUser,
  reviewManualWorkoutPersistedEditDraftForUser,
  reviewManualWorkoutSavedTemplateForUser,
  saveManualWorkoutSavedTemplateForUser,
  updateManualWorkoutBuiltInVisibilityForUser,
  type ManualEmptyPlanSetupInput,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";
import {
  materializeFirstReviewedPlanForUser,
  type PersistedPlanCycleRow,
} from "../../src/lib/active-plan-persistence";
import { applyAtomicCalendarWorkoutMutation } from "../../src/lib/active-plan-lifecycle-persistence";
import { AI_AUTHORED_PLAN_FIRST_SOURCE_KIND } from "../../src/lib/ai-authored-plan-first-compiler";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
} from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { buildAiGeneratedRunningPlanAuthoringInput } from "../../src/lib/ai-generated-running-plan";
import { buildDeterministicWorkoutComparison } from "../../src/lib/workout-result-import/compare-workout-result";
import { WORKOUT_COMPARISON_FORMULA_VERSION } from "../../src/lib/workout-result-import/comparison-payload";
import { buildHeartRateZonesSummary } from "../../src/lib/heart-rate-zones";
import { buildSourceWorkoutFingerprint } from "../../src/lib/manual-workout-authoring/edit-workout-review-token";
import {
  TRAINING_PLAN_V2_IMPORT_SOURCE_KIND,
  type TrainingPlanV2,
} from "../../src/lib/imported-plan";
import { DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE } from "../../src/lib/local-auth-account-registry.server";
import type { Database, Json } from "../../src/lib/supabase/database";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import { addDaysIso, todayIso, weekdayLong } from "../../src/lib/training";
import { getPersistedSnapshot } from "../../src/lib/training-api";
import { buildReviewedAiGeneratedRunningPlanPreview } from "../../src/lib/running-plan-engine-actions";
import { buildRunningPlanCanonicalPlan } from "../../src/lib/running-plan-engine-review";
import {
  getRunnerPlanAuthoringProfileSnapshotForUserId,
  saveRunnerBaselineForUserId,
  updateRunnerCalendarTimezoneForUserId,
} from "../../src/lib/user-settings-actions";
import {
  AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
  readWorkoutDocumentSections,
} from "../../src/lib/workout-document";
import {
  acquireQaPoolSupabaseUser,
  DISPOSABLE_REQUIRE_PERSISTENCE_FLAG,
  readDisposablePersistenceCliOptions,
  releaseQaPoolSupabaseUser,
  resolveDisposablePersistencePreflight,
  type DisposablePersistencePreflight,
  type QaPoolSupabaseCleanupProof,
} from "../lib/qa-pool-persistence-proof";

type ManualWorkoutReadyReview = Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
type PersistedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type PersistedRunnerProfileRow = Database["public"]["Tables"]["runner_profiles"]["Row"];
type PersistedManualPlanReadback = {
  plan: PersistedPlanCycleRow;
  workouts: PersistedWorkoutRow[];
  profile: PersistedRunnerProfileRow;
};

type ManualDisposableCleanupProof = QaPoolSupabaseCleanupProof;
type QaPoolUserLease = Awaited<ReturnType<typeof acquireQaPoolSupabaseUser>>;

export const MANUAL_REQUIRE_PERSISTENCE_FLAG = DISPOSABLE_REQUIRE_PERSISTENCE_FLAG;

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
  const disposableUser = await acquireQaPoolSupabaseUser({
    supabase,
    poolRole: "provider-engine",
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
    longRunHydrationPersisted: true;
    templateLifecyclePersisted: true;
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
    await updateRunnerCalendarTimezoneForUserId(disposableUser.userId, {
      calendarTimezone: processCalendarTimezone(),
      source: "user",
    });

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
    validateImmutableManualPlanMetadata(persisted.plan);
    validateNoFakePaceOrPersonalHr(persisted.workouts);
    await validateManualTemplatePersistence({
      userId: disposableUser.userId,
      input,
      review,
    });
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
    assertPlanRecordUnchanged(persisted.plan, manualEdit.edited.plan, "manual workout edit");

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
    const longRunHydrationPersisted = await validateLongRunHydrationPersistence({
      supabase,
      userId: disposableUser.userId,
      activePlanId: emptyPlan.activePlanId,
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
      longRunHydrationPersisted,
      templateLifecyclePersisted: true,
    };
  } finally {
    cleanup = await cleanupDisposableManualWorkoutUser(supabase, disposableUser);
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

  return {
    mode: preflight.mode,
    target: preflight.target,
    testerPoolRole: disposableUser.poolRole,
    persisted: proof,
    cleanup,
    importedEdit,
    canonicalOriginEdits,
  };
}

async function validateLongRunHydrationPersistence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  activePlanId: string;
}) {
  const draftInput: ManualWorkoutDraftInput = {
    templateKey: "long_aerobic_run",
    workoutDate: addDaysIso(todayIso(), 10),
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "long_run_body_block",
          durationSeconds: 80 * 60,
        },
      },
      {
        kind: "block",
        block: {
          blockKey: "hydration_block",
        },
      },
      {
        kind: "block",
        block: {
          blockKey: "cooldown_block",
          durationSeconds: 25 * 60,
        },
      },
    ],
  };
  const review = reviewManualWorkoutDraft(draftInput);
  assert.equal(review.ok, true, JSON.stringify(review));
  if (!review.ok) throw new Error(review.message);

  const added = await addManualWorkoutToActivePlanForUser(input.userId, {
    activePlanId: input.activePlanId,
    draftInput,
    reviewToken: review.reviewToken,
    reviewChecksum: review.reviewChecksum,
  });
  assert.equal(added.ok, true, JSON.stringify(added));
  if (!added.ok) throw new Error(added.message);

  const persisted = await loadPersistedManualPlanForUser(input.supabase, input.userId);
  const workout = persisted.workouts.find((candidate) => candidate.id === added.plannedWorkoutId);
  assert.ok(workout, "Persisted long run must be readable.");
  const hydration = readWorkoutDocumentSections(workout?.steps).find(
    (step) => step.segment_type === "fueling",
  );
  assert.equal(hydration?.label, "Hydration");
  assert.equal(hydration?.guidance, "Take water.");
  assert.equal(hydration?.prescription?.mode, "none");
  assert.equal(hydration?.target, undefined);

  const clearReview = await reviewManualWorkoutDeleteClearForUser(input.userId, {
    activePlanId: input.activePlanId,
    plannedWorkoutId: added.plannedWorkoutId,
  });
  assert.equal(clearReview.ok, true, JSON.stringify(clearReview));
  if (!clearReview.ok) throw new Error(clearReview.message);

  const cleared = await confirmManualWorkoutDeleteClearForUser(input.userId, {
    activePlanId: input.activePlanId,
    plannedWorkoutId: added.plannedWorkoutId,
    reviewToken: clearReview.review.reviewToken,
    reviewChecksum: clearReview.review.reviewChecksum,
  });
  assert.equal(cleared.ok, true, JSON.stringify(cleared));
  if (!cleared.ok) throw new Error(cleared.message);

  const afterClear = await loadPersistedManualPlanForUser(input.supabase, input.userId);
  assert.equal(afterClear.workouts.length, 0);
  return true as const;
}

async function validateManualTemplatePersistence(input: {
  userId: string;
  input: ManualWorkoutDraftInput;
  review: ManualWorkoutReadyReview;
}) {
  const saved = await saveManualWorkoutSavedTemplateForUser(input.userId, {
    displayName: "Disposable reviewed easy",
    iconKey: "easy",
    draftInput: input.input,
    reviewToken: input.review.reviewToken,
    reviewChecksum: input.review.reviewChecksum,
  });
  assert.equal(saved.ok, true, JSON.stringify(saved));
  if (!saved.ok) throw new Error(saved.message);

  const catalog = await listManualWorkoutTemplateCatalogForUser(input.userId);
  assert.equal(catalog.ok, true, JSON.stringify(catalog));
  if (!catalog.ok) throw new Error(catalog.message);
  assert.equal(
    catalog.personalTemplates.some((template) => template.id === saved.template.id),
    true,
  );

  const reused = await reviewManualWorkoutSavedTemplateForUser(input.userId, {
    templateId: saved.template.id,
    workoutDate: addDaysIso(input.review.draft.workoutDate, 7),
  });
  assert.equal(reused.ok, true, JSON.stringify(reused));
  if (!reused.ok) throw new Error(reused.message);
  assert.deepEqual(reused.review.draft.steps, input.review.draft.steps);

  const hidden = await updateManualWorkoutBuiltInVisibilityForUser(
    input.userId,
    { templateKey: "easy_aerobic_run" },
    "hide",
  );
  assert.equal(hidden.ok, true, JSON.stringify(hidden));
  const hiddenCatalog = await listManualWorkoutTemplateCatalogForUser(input.userId);
  assert.equal(hiddenCatalog.ok, true, JSON.stringify(hiddenCatalog));
  if (!hiddenCatalog.ok) throw new Error(hiddenCatalog.message);
  assert.equal(
    hiddenCatalog.visibleBuiltInTemplates.some(
      (template) => template.templateKey === "easy_aerobic_run",
    ),
    false,
  );

  const restored = await restoreAllManualWorkoutBuiltInTemplatesForUser(input.userId);
  assert.equal(restored.ok, true, JSON.stringify(restored));
  const deleted = await deleteManualWorkoutSavedTemplateForUser(input.userId, {
    templateId: saved.template.id,
  });
  assert.equal(deleted.ok, true, JSON.stringify(deleted));
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
  assert.equal(afterClear.plan.status, "archived");

  return true as const;
}

async function validateActivePlanWorkoutMutationFailureAtomicity(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
}) {
  const initial = await loadPersistedManualPlanForUser(input.supabase, input.userId);
  const sourceWorkout = initial.workouts[0];
  assert.ok(sourceWorkout, "Atomic mutation proof requires one source workout.");
  const immutablePlanUpdate = {
    end_date: initial.plan.end_date,
    goal_metadata: initial.plan.goal_metadata,
    plan_preferences: initial.plan.plan_preferences,
  };
  const addDate = addDaysIso(sourceWorkout.workout_date, 7);
  const addWorkoutId = crypto.randomUUID();

  await assert.rejects(
    applyAtomicCalendarWorkoutMutation({
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
        steps: { invalid: "planned_workouts.steps must remain an array" },
      } as unknown as Json,
      workoutUpdate: null,
      planUpdate: immutablePlanUpdate,
    }),
  );
  assert.deepEqual(
    await loadPersistedManualPlanForUser(input.supabase, input.userId),
    initial,
    "Failed Add must leave the independent workout set and immutable plan unchanged.",
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
    applyAtomicCalendarWorkoutMutation({
      userId: input.userId,
      planId: withTarget.plan.id,
      expectedPlanUpdatedAt: withTarget.plan.updated_at,
      currentDate: todayIso(),
      mutationKind: "clear",
      expectedSourceWorkout: {
        ...buildSourceWorkoutFingerprint(sourceWorkout),
        title: "stale clear fingerprint",
      } as Json,
      expectedTargetWorkout: null,
      workoutInsert: null,
      workoutUpdate: null,
      planUpdate: immutablePlanUpdate,
    }),
  );
  assert.deepEqual(
    await loadPersistedManualPlanForUser(input.supabase, input.userId),
    withTarget,
    "A stale Clear must not mutate the independent workout or its saved provenance.",
  );

  await assert.rejects(
    applyAtomicCalendarWorkoutMutation({
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
        week_number: "not-an-integer",
      },
      planUpdate: immutablePlanUpdate,
    }),
  );
  assert.deepEqual(
    await loadPersistedManualPlanForUser(input.supabase, input.userId),
    withTarget,
    "Failed Move must roll back target deletion and source movement without touching provenance.",
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
  const disposableUser = await acquireQaPoolSupabaseUser({
    supabase: input.supabase,
    poolRole: "provider-engine",
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
    await ensureProcessCalendarProfile(disposableUser.userId);
    const authoredPlan = buildManualWorkoutUserBuiltTrainingPlan(input.review.draft);
    const externalPlan = {
      ...authoredPlan,
      plan_name: "Imported runner-owned edit proof",
      source_kind: "external_coach_export_v7",
      source_status: "confirmed_external_plan",
    } satisfies TrainingPlanV2;

    await materializeFirstReviewedPlanForUser(disposableUser.userId, externalPlan);

    const imported = await loadPersistedManualPlanForUser(input.supabase, disposableUser.userId);
    const importedSourceWorkout = imported.workouts[0];
    assert.ok(importedSourceWorkout, "Imported edit proof requires one persisted workout.");
    assert.equal(imported.plan.source_kind, "external_coach_export_v7");
    assert.deepEqual(readImportOrigin(imported.plan), {
      sourceKind: null,
      sourceStatus: null,
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
    assertPlanRecordUnchanged(
      importedToday.plan,
      todayUnloggedEdit.edited.plan,
      "today imported workout edit",
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

    assert.equal(confirm.sourceMetadata.originalPlanSourceKind, "external_coach_export_v7");
    assert.equal(confirm.sourceMetadata.originalPlanOriginSourceKind, null);
    assert.equal(confirm.sourceMetadata.originalPlanOriginSourceStatus, null);
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
      sourceKind: null,
      sourceStatus: null,
    });
    assertPlanRecordUnchanged(
      todayUnloggedEdit.edited.plan,
      edited.plan,
      "history-backed workout edit",
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

    const forcedFailure = await input.supabase.rpc("apply_calendar_workout_content_edit", {
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
      todayUnloggedEditable: true,
      todayHistoryBackedEditable: true,
      historyPreserved: true,
    };
  } finally {
    cleanup = await cleanupDisposableManualWorkoutUser(input.supabase, disposableUser);
  }

  assert.ok(proof, "Imported workout edit persistence proof must complete.");
  assert.ok(cleanup, "Imported workout edit cleanup proof must be captured.");

  return {
    persisted: proof,
    cleanup,
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
    const disposableUser = await acquireQaPoolSupabaseUser({
      supabase: input.supabase,
      poolRole: "provider-engine",
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
        benchmark: { kind: "recent_5k_pace" as const, recent5kPace: "5:30/km" },
        planGoalIntent: {
          distance: { kind: "preset" as const, preset: "10K" as const },
        },
      };
      await saveRunnerBaselineForUserId(disposableUser.userId, {
        age: previewInput.age,
        heightCm: previewInput.heightCm,
        weightKg: previewInput.weightKg,
        fitnessLevel: "beginner",
        heartRateProfile: {
          zones: buildHeartRateZonesSummary(previewInput.age).zones.map(
            ({ reference, minBpm, maxBpm }) => ({ reference, minBpm, maxBpm }),
          ),
        },
      });
      await updateRunnerCalendarTimezoneForUserId(disposableUser.userId, {
        calendarTimezone: processCalendarTimezone(),
        source: "user",
      });
      const runnerProfileSnapshot = await getRunnerPlanAuthoringProfileSnapshotForUserId(
        disposableUser.userId,
      );
      const authoring = buildAiGeneratedRunningPlanAuthoringInput(
        previewInput,
        runnerProfileSnapshot,
      );
      assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
      if (!authoring.ok) throw new Error(authoring.message);
      const fixtureEnv = {
        LOCAL_AUTH_BYPASS_ENABLED: "true",
        LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
        HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "qa_fixture",
        [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV]: "non_repeat_tempo",
      };
      const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
        authoringInput: authoring.authoringInput,
        today: previewInput.startDate,
        env: fixtureEnv,
      });
      const reviewed = await buildReviewedAiGeneratedRunningPlanPreview(previewInput, {
        runnerProfileSnapshot,
        aiPreview: {
          apiKey: "local-qa-dev-ai-generated-plan-fixture",
          model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
          today: previewInput.startDate,
          fetchImpl: fixtureFetch,
          generationLedger: { disabled: true },
        },
      });
      assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
      if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
      const reviewedPlan = {
        ...buildRunningPlanCanonicalPlan(reviewed.draft),
        plan_name: `${origin.label} runner-owned edit proof`,
        source_kind: origin.sourceKind,
        source_status: origin.sourceStatus,
      } satisfies TrainingPlanV2;

      await materializeFirstReviewedPlanForUser(disposableUser.userId, reviewedPlan);

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
        findAiAuthoredPaceTarget(edit.editedWorkout.steps, "4:50-5:00/km"),
        findAiAuthoredPaceTarget(edit.sourceWorkout.steps, "4:50-5:00/km"),
      );
      assert.equal(
        findAiAuthoredPaceTarget(edit.editedWorkout.steps, "4:50-5:00/km")?.pace,
        "4:50-5:00/km",
      );
      assertPlanRecordUnchanged(persisted.plan, edit.edited.plan, `${origin.label} workout edit`);

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
      cleanup = await cleanupDisposableManualWorkoutUser(input.supabase, disposableUser);
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

async function ensureProcessCalendarProfile(userId: string) {
  await saveRunnerBaselineForUserId(userId, {
    age: 36,
    heightCm: 178,
    weightKg: 74,
    fitnessLevel: "beginner",
  });
  await updateRunnerCalendarTimezoneForUserId(userId, {
    calendarTimezone: processCalendarTimezone(),
    source: "user",
  });
}

function processCalendarTimezone() {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
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
      (!input.workoutPace ||
        findAiAuthoredPaceTarget(workout.steps, input.workoutPace)?.pace === input.workoutPace),
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

function findAiAuthoredPaceTarget(value: unknown, expectedPace?: string) {
  for (const section of readWorkoutDocumentSections(value)) {
    if (
      section.target?.target_source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE &&
      section.target.pace &&
      (!expectedPace || section.target.pace === expectedPace)
    ) {
      return section.target;
    }

    for (const child of section.prescription?.children ?? []) {
      if (
        child.target?.target_source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE &&
        child.target.pace &&
        (!expectedPace || child.target.pace === expectedPace)
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
    .eq("status", "archived")
    .is("saved_plan_payload", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (planResult.error || !planResult.data) {
    throw new Error(planResult.error?.message ?? "Persisted Calendar provenance was not found.");
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

function asJsonObject(value: unknown): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}

function validateImmutableManualPlanMetadata(plan: PersistedPlanCycleRow) {
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
  assert.equal(manualMetadata?.latest_review_checksum, undefined);
  assert.equal(manualMetadata?.row_count, 0);
}

function assertPlanRecordUnchanged(
  before: PersistedPlanCycleRow,
  after: PersistedPlanCycleRow,
  label: string,
) {
  assert.equal(after.id, before.id, `${label}: plan identity stays provenance-only`);
  assert.equal(after.updated_at, before.updated_at, `${label}: plan timestamp must not change`);
  assert.equal(after.end_date, before.end_date, `${label}: plan schedule bounds are immutable`);
  assert.deepEqual(
    after.goal_metadata,
    before.goal_metadata,
    `${label}: plan metadata is immutable`,
  );
  assert.deepEqual(
    after.plan_preferences,
    before.plan_preferences,
    `${label}: plan preferences are immutable`,
  );
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
  lease: QaPoolUserLease,
): Promise<ManualDisposableCleanupProof> {
  return releaseQaPoolSupabaseUser({
    supabase,
    userId: lease.userId,
    poolRole: lease.poolRole,
    leaseToken: lease.leaseToken,
  });
}
