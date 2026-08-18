import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

import {
  CalendarPersistenceRejection,
  applyAtomicCalendarWorkoutMutation,
} from "../../src/lib/active-plan-lifecycle-persistence";
import type { PersistedPlannedWorkoutRow } from "../../src/lib/active-plan-persistence";
import {
  addManualWorkoutToActivePlanForUser,
  confirmManualWorkoutDeleteClearForUser,
  confirmManualWorkoutMoveForUser,
  confirmManualWorkoutPersistedEditForUser,
  createEmptyManualActivePlanForUser,
  moveManualWorkoutWithinActivePlanForUser,
  reconstructManualWorkoutPersistedEditDraftForUser,
  reviewManualWorkoutDeleteClearForUser,
  reviewManualWorkoutDraft,
  reviewManualWorkoutMoveForUser,
  reviewManualWorkoutPersistedEditDraftForUser,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";
import { copyManualWorkoutWithinActivePlanForUser } from "../../src/lib/manual-workout-authoring/copy-paste";
import { persistManualWorkoutDeleteClear } from "../../src/lib/manual-workout-authoring/delete-clear";
import { buildFullSourceWorkoutFingerprint } from "../../src/lib/manual-workout-authoring/edit-workout-review-token";
import { persistManualWorkoutMove } from "../../src/lib/manual-workout-authoring/move-workout";
import type { Database, Json } from "../../src/lib/supabase/database";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import { addDaysIso, todayIso } from "../../src/lib/training";
import { updateRunnerCalendarTimezoneForUserId } from "../../src/lib/user-settings-actions";
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
type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;
type QaPoolUserLease = Awaited<ReturnType<typeof acquireQaPoolSupabaseUser>>;

const DISPOSABLE_TEST_PASSWORD = "Standalone-Calendar-Local-Aa1!";
const MOVE_UNDO_EXPIRY_PROOF_WAIT_MS = 46_000;

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
  const owner = await acquireQaPoolSupabaseUser({
    supabase,
    poolRole: "provider-engine",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Disposable standalone Calendar user acquisition failed.",
  });
  let isolationUser: QaPoolUserLease | null = null;
  let proof: Record<string, unknown> | null = null;
  let cleanup: QaPoolSupabaseCleanupProof | null = null;
  let isolationCleanup: QaPoolSupabaseCleanupProof | null = null;

  try {
    const setup = await createEmptyManualActivePlanForUser(owner.userId, {
      age: 36,
      heightCm: 178,
      weightKg: 74,
      runningLevel: "beginner",
    });
    assert.equal(setup.ok, true, JSON.stringify(setup));
    if (!setup.ok) throw new Error(setup.message);
    assert.equal(setup.activePlanId, null);
    assert.equal(setup.calendarRowCount, 0);

    await updateRunnerCalendarTimezoneForUserId(owner.userId, {
      calendarTimezone: processCalendarTimezone(),
      source: "user",
    });

    assert.equal(await countPlanRows(supabase, owner.userId), 0);
    assert.equal((await loadCalendarRows(supabase, owner.userId)).length, 0);

    const added = await addManualWorkoutToActivePlanForUser(owner.userId, {
      draftInput: input,
      reviewToken: review.reviewToken,
      reviewChecksum: review.reviewChecksum,
    });
    assert.equal(added.ok, true, JSON.stringify(added));
    if (!added.ok) throw new Error(added.message);
    assert.equal(added.activePlanId, null);
    assert.equal(added.sourceKind, "manual");

    const afterAdd = await loadCalendarRows(supabase, owner.userId);
    assert.equal(afterAdd.length, 1);
    const original = requiredWorkout(afterAdd, added.plannedWorkoutId, "direct manual Add");
    assert.equal(original.plan_cycle_id, null);
    assert.equal(original.origin_kind, "manual");
    assert.equal(await countPlanRows(supabase, owner.userId), 0);

    const reconstructed = await reconstructManualWorkoutPersistedEditDraftForUser(owner.userId, {
      plannedWorkoutId: original.id,
      workoutDate: original.workout_date,
    });
    assert.equal(reconstructed.ok, true, JSON.stringify(reconstructed));
    if (!reconstructed.ok) throw new Error(reconstructed.message);
    const editProjection = {
      ...reconstructed.editProjection,
      title: "Runner-owned standalone Calendar workout",
    };
    const editReview = await reviewManualWorkoutPersistedEditDraftForUser(owner.userId, {
      plannedWorkoutId: original.id,
      workoutDate: original.workout_date,
      editProjection,
    });
    assert.equal(editReview.ok, true, JSON.stringify(editReview));
    if (!editReview.ok) throw new Error(editReview.message);
    const edited = await confirmManualWorkoutPersistedEditForUser(owner.userId, {
      plannedWorkoutId: original.id,
      workoutDate: original.workout_date,
      editProjection,
      reviewToken: editReview.review.reviewToken,
      reviewChecksum: editReview.review.reviewChecksum,
    });
    assert.equal(edited.ok, true, JSON.stringify(edited));
    if (!edited.ok) throw new Error(edited.message);
    assert.equal(edited.provenancePlanId, null);

    const editedRow = requiredWorkout(
      await loadCalendarRows(supabase, owner.userId),
      original.id,
      "content edit",
    );
    assert.equal(editedRow.id, original.id);
    assert.equal(editedRow.title, editProjection.title);
    assert.equal(editedRow.plan_cycle_id, null);
    assert.equal(editedRow.origin_kind, "manual");

    const copyDate = addDaysIso(input.workoutDate, 4);
    const copied = await copyManualWorkoutWithinActivePlanForUser(owner.userId, {
      sourceWorkoutId: editedRow.id,
      sourceWorkoutDate: editedRow.workout_date,
      targetDate: copyDate,
    });
    assert.equal(copied.ok, true, JSON.stringify(copied));
    if (!copied.ok) throw new Error(copied.message);
    const copiedRow = requiredWorkout(
      await loadCalendarRows(supabase, owner.userId),
      copied.targetWorkoutId,
      "prescription-only copy",
    );
    assert.equal(copiedRow.plan_cycle_id, null);
    assert.equal(copiedRow.origin_kind, editedRow.origin_kind);
    assert.deepEqual(copiedRow.steps, editedRow.steps);

    const copyClearReview = await reviewManualWorkoutDeleteClearForUser(owner.userId, {
      plannedWorkoutId: copiedRow.id,
    });
    assert.equal(copyClearReview.ok, true, JSON.stringify(copyClearReview));
    if (!copyClearReview.ok) throw new Error(copyClearReview.message);
    const clearedCopy = await confirmManualWorkoutDeleteClearForUser(owner.userId, {
      plannedWorkoutId: copiedRow.id,
      reviewToken: copyClearReview.review.reviewToken,
      reviewChecksum: copyClearReview.review.reviewChecksum,
    });
    assert.equal(clearedCopy.ok, true, JSON.stringify(clearedCopy));

    const emptyTargetDate = addDaysIso(input.workoutDate, 1);
    const emptyMoveReview = await reviewManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: editedRow.id,
      sourceWorkoutDate: editedRow.workout_date,
      targetDate: emptyTargetDate,
    });
    assert.equal(emptyMoveReview.ok, true, JSON.stringify(emptyMoveReview));
    if (!emptyMoveReview.ok) throw new Error(emptyMoveReview.message);
    const emptyMoved = await confirmManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: editedRow.id,
      sourceWorkoutDate: editedRow.workout_date,
      targetDate: emptyTargetDate,
      reviewToken: emptyMoveReview.review.reviewToken,
      reviewChecksum: emptyMoveReview.review.reviewChecksum,
    });
    assert.equal(emptyMoved.ok, true, JSON.stringify(emptyMoved));
    if (!emptyMoved.ok) throw new Error(emptyMoved.message);

    const restTargetDate = addDaysIso(input.workoutDate, 2);
    const restDraft = { templateKey: "rest_day", workoutDate: restTargetDate } as const;
    const restReview = reviewManualWorkoutDraft(restDraft);
    assert.equal(restReview.ok, true, JSON.stringify(restReview));
    if (!restReview.ok) throw new Error(restReview.message);
    const restAdded = await addManualWorkoutToActivePlanForUser(owner.userId, {
      draftInput: restDraft,
      reviewToken: restReview.reviewToken,
      reviewChecksum: restReview.reviewChecksum,
    });
    assert.equal(restAdded.ok, true, JSON.stringify(restAdded));
    if (!restAdded.ok) throw new Error(restAdded.message);

    const beforeStoredRestMove = await loadCalendarRows(supabase, owner.userId);
    const sourceBeforeStoredRest = requiredWorkout(
      beforeStoredRestMove,
      editedRow.id,
      "stored-Rest source",
    );
    const originalRest = requiredWorkout(
      beforeStoredRestMove,
      restAdded.plannedWorkoutId,
      "stored-Rest target",
    );
    assert.equal(originalRest.workout_type, "rest");

    const storedRestReview = await reviewManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeStoredRest.id,
      sourceWorkoutDate: emptyTargetDate,
      targetDate: restTargetDate,
    });
    assert.equal(storedRestReview.ok, true, JSON.stringify(storedRestReview));
    if (!storedRestReview.ok) throw new Error(storedRestReview.message);
    const storedRestMoved = await confirmManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeStoredRest.id,
      sourceWorkoutDate: emptyTargetDate,
      targetDate: restTargetDate,
      reviewToken: storedRestReview.review.reviewToken,
      reviewChecksum: storedRestReview.review.reviewChecksum,
    });
    assert.equal(storedRestMoved.ok, true, JSON.stringify(storedRestMoved));
    if (!storedRestMoved.ok) throw new Error(storedRestMoved.message);

    const undone = await moveManualWorkoutWithinActivePlanForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeStoredRest.id,
      sourceWorkoutDate: restTargetDate,
      targetDate: emptyTargetDate,
    });
    assert.equal(undone.ok, true, JSON.stringify(undone));
    if (!undone.ok) throw new Error(undone.message);
    assert.equal(undone.safety.sourceDateBecameEmpty, false);

    const reloadOne = await loadCalendarRows(supabase, owner.userId);
    const reloadTwo = await loadCalendarRows(supabase, owner.userId);
    assert.deepEqual(
      requiredWorkout(reloadOne, sourceBeforeStoredRest.id, "Undo reload one source"),
      sourceBeforeStoredRest,
    );
    assert.deepEqual(
      requiredWorkout(reloadTwo, sourceBeforeStoredRest.id, "Undo reload two source"),
      sourceBeforeStoredRest,
    );
    assert.deepEqual(
      requiredWorkout(reloadOne, originalRest.id, "Undo reload one Rest"),
      originalRest,
    );
    assert.deepEqual(
      requiredWorkout(reloadTwo, originalRest.id, "Undo reload two Rest"),
      originalRest,
    );

    const occupiedTargetDate = copyDate;
    const occupiedDraft = {
      templateKey: "easy_aerobic_run",
      workoutDate: occupiedTargetDate,
      title: "Occupied workout before durable Undo",
      notes: "This complete row must survive replacement and authoritative restoration.",
    } as const;
    const occupiedReview = reviewManualWorkoutDraft(occupiedDraft);
    assert.equal(occupiedReview.ok, true, JSON.stringify(occupiedReview));
    if (!occupiedReview.ok) throw new Error(occupiedReview.message);
    const occupiedAdd = await addManualWorkoutToActivePlanForUser(owner.userId, {
      draftInput: occupiedDraft,
      reviewToken: occupiedReview.reviewToken,
      reviewChecksum: occupiedReview.reviewChecksum,
    });
    assert.equal(occupiedAdd.ok, true, JSON.stringify(occupiedAdd));
    if (!occupiedAdd.ok) throw new Error(occupiedAdd.message);

    const beforeOccupiedReview = await loadCalendarRows(supabase, owner.userId);
    const sourceBeforeOccupiedMove = requiredWorkout(
      beforeOccupiedReview,
      sourceBeforeStoredRest.id,
      "occupied replacement source",
    );
    const occupiedTargetBeforeEdit = requiredWorkout(
      beforeOccupiedReview,
      occupiedAdd.plannedWorkoutId,
      "occupied replacement target",
    );
    const cancelledOccupiedReview = await reviewManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: sourceBeforeOccupiedMove.workout_date,
      targetDate: occupiedTargetDate,
    });
    assert.equal(cancelledOccupiedReview.ok, true, JSON.stringify(cancelledOccupiedReview));
    if (!cancelledOccupiedReview.ok) throw new Error(cancelledOccupiedReview.message);
    assert.equal(cancelledOccupiedReview.targetDayKind, "workout_day");
    assert.equal(
      cancelledOccupiedReview.targetReplacement?.plannedWorkoutId,
      occupiedTargetBeforeEdit.id,
    );
    assert.deepEqual(
      await loadCalendarRows(supabase, owner.userId),
      beforeOccupiedReview,
      "Review cancellation must not mutate either occupied replacement row.",
    );

    const occupiedEditDraft = await reconstructManualWorkoutPersistedEditDraftForUser(
      owner.userId,
      {
        plannedWorkoutId: occupiedTargetBeforeEdit.id,
        workoutDate: occupiedTargetBeforeEdit.workout_date,
      },
    );
    assert.equal(occupiedEditDraft.ok, true, JSON.stringify(occupiedEditDraft));
    if (!occupiedEditDraft.ok) throw new Error(occupiedEditDraft.message);
    const occupiedEditProjection = {
      ...occupiedEditDraft.editProjection,
      title: "Occupied workout after concurrent edit",
    };
    const occupiedEditReview = await reviewManualWorkoutPersistedEditDraftForUser(owner.userId, {
      plannedWorkoutId: occupiedTargetBeforeEdit.id,
      workoutDate: occupiedTargetBeforeEdit.workout_date,
      editProjection: occupiedEditProjection,
    });
    assert.equal(occupiedEditReview.ok, true, JSON.stringify(occupiedEditReview));
    if (!occupiedEditReview.ok) throw new Error(occupiedEditReview.message);
    const occupiedEdited = await confirmManualWorkoutPersistedEditForUser(owner.userId, {
      plannedWorkoutId: occupiedTargetBeforeEdit.id,
      workoutDate: occupiedTargetBeforeEdit.workout_date,
      editProjection: occupiedEditProjection,
      reviewToken: occupiedEditReview.review.reviewToken,
      reviewChecksum: occupiedEditReview.review.reviewChecksum,
    });
    assert.equal(occupiedEdited.ok, true, JSON.stringify(occupiedEdited));
    if (!occupiedEdited.ok) throw new Error(occupiedEdited.message);

    const staleOccupiedConfirm = await confirmManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: sourceBeforeOccupiedMove.workout_date,
      targetDate: occupiedTargetDate,
      reviewToken: cancelledOccupiedReview.review.reviewToken,
      reviewChecksum: cancelledOccupiedReview.review.reviewChecksum,
    });
    assert.equal(staleOccupiedConfirm.ok, false);
    if (!staleOccupiedConfirm.ok) assert.equal(staleOccupiedConfirm.reason, "stale_review");

    const occupiedTarget = requiredWorkout(
      await loadCalendarRows(supabase, owner.userId),
      occupiedTargetBeforeEdit.id,
      "concurrently edited occupied target",
    );
    const occupiedMoveReview = await reviewManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: sourceBeforeOccupiedMove.workout_date,
      targetDate: occupiedTargetDate,
    });
    assert.equal(occupiedMoveReview.ok, true, JSON.stringify(occupiedMoveReview));
    if (!occupiedMoveReview.ok) throw new Error(occupiedMoveReview.message);
    const occupiedMoved = await confirmManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: sourceBeforeOccupiedMove.workout_date,
      targetDate: occupiedTargetDate,
      reviewToken: occupiedMoveReview.review.reviewToken,
      reviewChecksum: occupiedMoveReview.review.reviewChecksum,
    });
    assert.equal(occupiedMoved.ok, true, JSON.stringify(occupiedMoved));
    if (!occupiedMoved.ok) throw new Error(occupiedMoved.message);

    const afterOccupiedMove = await loadCalendarRows(supabase, owner.userId);
    assert.equal(
      afterOccupiedMove.some((workout) => workout.id === occupiedTarget.id),
      false,
      "Confirmed occupied replacement must remove only the reviewed target row.",
    );
    assert.equal(
      afterOccupiedMove.some(
        (workout) => workout.workout_date === sourceBeforeOccupiedMove.workout_date,
      ),
      false,
      "Confirmed occupied replacement must leave the source date empty until Undo.",
    );
    const movedOntoOccupiedDate = requiredWorkout(
      afterOccupiedMove,
      sourceBeforeOccupiedMove.id,
      "occupied replacement moved workout",
    );
    assert.equal(movedOntoOccupiedDate.workout_date, occupiedTargetDate);
    assert.equal(movedOntoOccupiedDate.plan_cycle_id, sourceBeforeOccupiedMove.plan_cycle_id);
    assert.equal(movedOntoOccupiedDate.origin_kind, sourceBeforeOccupiedMove.origin_kind);

    const occupiedMoveEvents = await loadMutationEvents(supabase, owner.userId);
    const occupiedMoveEvent = occupiedMoveEvents
      .slice()
      .reverse()
      .find(
        (event) =>
          event.mutation_kind === "user_moved_workout" &&
          event.planned_workout_id === sourceBeforeOccupiedMove.id &&
          event.target_date === occupiedTargetDate &&
          event.displaced_workout !== null,
      );
    assert.ok(occupiedMoveEvent, "Occupied replacement must retain its displaced workout audit.");
    assert.deepEqual(occupiedMoveEvent.displaced_workout, occupiedTarget);
    assert.ok(occupiedMoveEvent.undo_expires_at, "Occupied replacement must receive a DB expiry.");
    assert.equal(occupiedMoveEvent.undo_of_event_id, null);

    const occupiedUndone = await moveManualWorkoutWithinActivePlanForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: occupiedTargetDate,
      targetDate: sourceBeforeOccupiedMove.workout_date,
    });
    assert.equal(occupiedUndone.ok, true, JSON.stringify(occupiedUndone));
    if (!occupiedUndone.ok) throw new Error(occupiedUndone.message);
    assert.equal(occupiedUndone.safety.sourceDateBecameEmpty, false);

    const occupiedReloadOne = await loadCalendarRows(supabase, owner.userId);
    const occupiedReloadTwo = await loadCalendarRows(supabase, owner.userId);
    assert.deepEqual(
      requiredWorkout(
        occupiedReloadOne,
        sourceBeforeOccupiedMove.id,
        "occupied Undo reload one source",
      ),
      sourceBeforeOccupiedMove,
    );
    assert.deepEqual(
      requiredWorkout(
        occupiedReloadTwo,
        sourceBeforeOccupiedMove.id,
        "occupied Undo reload two source",
      ),
      sourceBeforeOccupiedMove,
    );
    assert.deepEqual(
      requiredWorkout(occupiedReloadOne, occupiedTarget.id, "occupied Undo reload one target"),
      occupiedTarget,
    );
    assert.deepEqual(
      requiredWorkout(occupiedReloadTwo, occupiedTarget.id, "occupied Undo reload two target"),
      occupiedTarget,
    );
    const occupiedUndoEvent = (await loadMutationEvents(supabase, owner.userId))
      .slice()
      .reverse()
      .find((event) => event.undo_of_event_id === occupiedMoveEvent.id);
    assert.ok(occupiedUndoEvent, "Occupied Undo must link exactly once to its replacement event.");
    assert.equal(occupiedUndoEvent.displaced_workout, null);

    const beforeDuplicateUndo = await loadCalendarRows(supabase, owner.userId);
    const duplicateOccupiedUndo = await moveManualWorkoutWithinActivePlanForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: occupiedTargetDate,
      targetDate: sourceBeforeOccupiedMove.workout_date,
    });
    assert.equal(duplicateOccupiedUndo.ok, false);
    if (!duplicateOccupiedUndo.ok) {
      assert.equal(duplicateOccupiedUndo.reason, "source_date_changed");
    }
    assert.deepEqual(await loadCalendarRows(supabase, owner.userId), beforeDuplicateUndo);

    const restClear = await reviewManualWorkoutDeleteClearForUser(owner.userId, {
      plannedWorkoutId: originalRest.id,
    });
    assert.equal(restClear.ok, false);
    if (!restClear.ok) assert.equal(restClear.reason, "target_workout_not_supported");

    const protectedDate = addDaysIso(input.workoutDate, 3);
    const protectedDraft = {
      templateKey: "easy_aerobic_run",
      workoutDate: protectedDate,
      title: "Evidence protection proof",
    } as const;
    const protectedReview = reviewManualWorkoutDraft(protectedDraft);
    assert.equal(protectedReview.ok, true, JSON.stringify(protectedReview));
    if (!protectedReview.ok) throw new Error(protectedReview.message);
    const protectedAdd = await addManualWorkoutToActivePlanForUser(owner.userId, {
      draftInput: protectedDraft,
      reviewToken: protectedReview.reviewToken,
      reviewChecksum: protectedReview.reviewChecksum,
    });
    assert.equal(protectedAdd.ok, true, JSON.stringify(protectedAdd));
    if (!protectedAdd.ok) throw new Error(protectedAdd.message);
    const protectedWorkout = requiredWorkout(
      await loadCalendarRows(supabase, owner.userId),
      protectedAdd.plannedWorkoutId,
      "protected workout",
    );

    const beforeEvidenceReview = await reviewManualWorkoutDeleteClearForUser(owner.userId, {
      plannedWorkoutId: protectedWorkout.id,
    });
    assert.equal(beforeEvidenceReview.ok, true, JSON.stringify(beforeEvidenceReview));
    if (!beforeEvidenceReview.ok) throw new Error(beforeEvidenceReview.message);
    const beforeEvidenceMoveReview = await reviewManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: sourceBeforeOccupiedMove.workout_date,
      targetDate: protectedWorkout.workout_date,
    });
    assert.equal(beforeEvidenceMoveReview.ok, true, JSON.stringify(beforeEvidenceMoveReview));
    if (!beforeEvidenceMoveReview.ok) throw new Error(beforeEvidenceMoveReview.message);

    const evidence = await insertProtectedWorkoutEvidence(supabase, owner.userId, protectedWorkout);
    const beforeProtectedMoveConfirm = await loadCalendarRows(supabase, owner.userId);
    const protectedMove = await confirmManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: sourceBeforeOccupiedMove.workout_date,
      targetDate: protectedWorkout.workout_date,
      reviewToken: beforeEvidenceMoveReview.review.reviewToken,
      reviewChecksum: beforeEvidenceMoveReview.review.reviewChecksum,
    });
    assert.equal(protectedMove.ok, false);
    if (!protectedMove.ok) assert.equal(protectedMove.reason, "protected_day");
    assert.deepEqual(
      await loadCalendarRows(supabase, owner.userId),
      beforeProtectedMoveConfirm,
      "Evidence added after review must reject occupied Move without a partial write.",
    );
    await assert.rejects(
      persistManualWorkoutMove({
        userId: owner.userId,
        currentDate: todayIso(),
        sourceWorkout: sourceBeforeOccupiedMove,
        otherWorkouts: beforeProtectedMoveConfirm.filter(
          (workout) => workout.id !== sourceBeforeOccupiedMove.id,
        ),
        review: beforeEvidenceMoveReview.review,
        targetWeekNumber: sourceBeforeOccupiedMove.week_number,
        targetReplacementWorkout: protectedWorkout,
      }),
      (error: unknown) =>
        error instanceof CalendarPersistenceRejection && error.reason === "protected_day",
      "The transaction must reject target evidence added after Move review without deleting either row.",
    );
    assert.deepEqual(
      await loadCalendarRows(supabase, owner.userId),
      beforeProtectedMoveConfirm,
      "Atomic occupied Move refusal must preserve source and target rows byte-for-byte.",
    );
    const afterEvidence = await confirmManualWorkoutDeleteClearForUser(owner.userId, {
      plannedWorkoutId: protectedWorkout.id,
      reviewToken: beforeEvidenceReview.review.reviewToken,
      reviewChecksum: beforeEvidenceReview.review.reviewChecksum,
    });
    assert.equal(afterEvidence.ok, false);
    if (!afterEvidence.ok) assert.equal(afterEvidence.reason, "protected_day");

    await assert.rejects(
      persistManualWorkoutDeleteClear({
        userId: owner.userId,
        currentDate: todayIso(),
        targetWorkout: protectedWorkout,
        review: beforeEvidenceReview.review,
      }),
      (error: unknown) =>
        error instanceof CalendarPersistenceRejection && error.reason === "protected_day",
      "The transaction must reject evidence added after review without deleting the workout.",
    );
    assert.deepEqual(
      requiredWorkout(
        await loadCalendarRows(supabase, owner.userId),
        protectedWorkout.id,
        "protected workout after atomic refusal",
      ),
      protectedWorkout,
    );
    await assertEvidenceStillPresent(supabase, evidence);

    isolationUser = await acquireQaPoolSupabaseUser({
      supabase,
      poolRole: "isolation-b",
      password: DISPOSABLE_TEST_PASSWORD,
      creationErrorMessage: "Disposable isolation user acquisition failed.",
    });
    const rls = await validateAuthenticatedIsolation({
      preflight,
      owner,
      isolationUser,
      sourceWorkout: sourceBeforeStoredRest,
    });

    const expiringOccupiedReview = await reviewManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: sourceBeforeOccupiedMove.workout_date,
      targetDate: occupiedTargetDate,
    });
    assert.equal(expiringOccupiedReview.ok, true, JSON.stringify(expiringOccupiedReview));
    if (!expiringOccupiedReview.ok) throw new Error(expiringOccupiedReview.message);
    const expiringOccupiedMove = await confirmManualWorkoutMoveForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: sourceBeforeOccupiedMove.workout_date,
      targetDate: occupiedTargetDate,
      reviewToken: expiringOccupiedReview.review.reviewToken,
      reviewChecksum: expiringOccupiedReview.review.reviewChecksum,
    });
    assert.equal(expiringOccupiedMove.ok, true, JSON.stringify(expiringOccupiedMove));
    if (!expiringOccupiedMove.ok) throw new Error(expiringOccupiedMove.message);
    const beforeExpiredUndo = await loadCalendarRows(supabase, owner.userId);
    await new Promise((resolve) => setTimeout(resolve, MOVE_UNDO_EXPIRY_PROOF_WAIT_MS));
    const expiredOccupiedUndo = await moveManualWorkoutWithinActivePlanForUser(owner.userId, {
      sourceWorkoutId: sourceBeforeOccupiedMove.id,
      sourceWorkoutDate: occupiedTargetDate,
      targetDate: sourceBeforeOccupiedMove.workout_date,
    });
    assert.equal(expiredOccupiedUndo.ok, false);
    if (!expiredOccupiedUndo.ok) assert.equal(expiredOccupiedUndo.reason, "undo_expired");
    assert.deepEqual(
      await loadCalendarRows(supabase, owner.userId),
      beforeExpiredUndo,
      "Expired occupied Undo must leave the replacement state unchanged.",
    );

    const mutationEvents = await loadMutationEvents(supabase, owner.userId);
    assert.ok(mutationEvents.length >= 8);
    assert.ok(mutationEvents.some((event) => event.mutation_kind === "user_edited_workout"));
    assert.ok(mutationEvents.some((event) => event.mutation_kind === "user_copied_workout"));
    assert.ok(
      mutationEvents.some(
        (event) => event.mutation_kind === "user_moved_workout" && event.displaced_workout,
      ),
    );
    assert.equal(await countPlanRows(supabase, owner.userId), 0);

    proof = {
      directManualAdd: {
        workoutId: original.id,
        planRowsCreated: 0,
        planCycleId: null,
        originKind: "manual",
      },
      sameRowContentEdit: true,
      prescriptionOnlyCopy: true,
      independentClear: true,
      emptyTargetMove: true,
      storedRestMoveUndoTwoReloads: true,
      occupiedMoveCancelNoOp: true,
      occupiedMoveStaleReviewRejected: true,
      occupiedMoveUndoTwoReloads: true,
      occupiedMoveUndoExactOnce: true,
      occupiedMoveExpiredUndoNoOp: true,
      evidenceRaceRejectedAtomically: true,
      retainedEvidence: evidence,
      mutationEventCount: mutationEvents.length,
      authenticatedIsolation: rls,
    };
  } finally {
    if (isolationUser) {
      isolationCleanup = await releaseQaPoolSupabaseUser({
        supabase,
        userId: isolationUser.userId,
        poolRole: isolationUser.poolRole,
        leaseToken: isolationUser.leaseToken,
      });
    }
    cleanup = await releaseQaPoolSupabaseUser({
      supabase,
      userId: owner.userId,
      poolRole: owner.poolRole,
      leaseToken: owner.leaseToken,
    });
  }

  assert.ok(proof, "Standalone Calendar persistence proof must complete.");
  assert.ok(cleanup, "Owner cleanup proof must be captured.");
  assert.ok(isolationCleanup, "Isolation cleanup proof must be captured.");

  return {
    mode: preflight.mode,
    target: preflight.target,
    testerPoolRole: owner.poolRole,
    persisted: proof,
    cleanup,
    isolationCleanup,
  };
}

async function loadCalendarRows(supabase: AdminSupabaseClient, userId: string) {
  const rows = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });
  if (rows.error) throw new Error(rows.error.message);
  return rows.data;
}

async function loadMutationEvents(supabase: AdminSupabaseClient, userId: string) {
  const rows = await supabase
    .from("calendar_workout_mutation_events")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: true });
  if (rows.error) throw new Error(rows.error.message);
  return rows.data;
}

async function countPlanRows(supabase: AdminSupabaseClient, userId: string) {
  const result = await supabase
    .from("plan_cycles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
}

function requiredWorkout(
  rows: readonly PersistedPlannedWorkoutRow[],
  workoutId: string,
  label: string,
) {
  const workout = rows.find((row) => row.id === workoutId);
  assert.ok(workout, `${label} requires workout ${workoutId}.`);
  return workout;
}

async function insertProtectedWorkoutEvidence(
  supabase: AdminSupabaseClient,
  userId: string,
  workout: PersistedPlannedWorkoutRow,
) {
  const workoutLogId = crypto.randomUUID();
  const workoutLog = await supabase
    .from("workout_logs")
    .insert({
      id: workoutLogId,
      user_id: userId,
      planned_workout_id: workout.id,
      outcome: "completed",
      actual_distance_km: 5,
      actual_duration_min: 35,
      rpe: 5,
      notes: "Atomic protection proof",
      intervals_completed: null,
      body_notes: [],
    })
    .select("id")
    .single();
  if (workoutLog.error) throw new Error(workoutLog.error.message);

  const resultAssetId = crypto.randomUUID();
  const resultAsset = await supabase
    .from("workout_result_assets")
    .insert({
      id: resultAssetId,
      user_id: userId,
      planned_workout_id: workout.id,
      workout_log_id: workoutLogId,
      asset_kind: "garmin_fit",
      storage_bucket: "workout-result-assets",
      storage_path: `standalone-calendar-proof/${resultAssetId}.fit`,
      original_file_name: "standalone-calendar-proof.fit",
      mime_type: "application/octet-stream",
      file_size_bytes: 1,
      parse_status: "uploaded",
      primary_file_kind: "fit",
      primary_file_name: "standalone-calendar-proof.fit",
    })
    .select("id")
    .single();
  if (resultAsset.error) throw new Error(resultAsset.error.message);

  return { workoutLogId, resultAssetId };
}

async function assertEvidenceStillPresent(
  supabase: AdminSupabaseClient,
  evidence: { workoutLogId: string; resultAssetId: string },
) {
  const [log, asset] = await Promise.all([
    supabase.from("workout_logs").select("id").eq("id", evidence.workoutLogId).single(),
    supabase.from("workout_result_assets").select("id").eq("id", evidence.resultAssetId).single(),
  ]);
  assert.equal(log.error, null);
  assert.equal(asset.error, null);
}

async function validateAuthenticatedIsolation(input: {
  preflight: Extract<ManualPersistencePreflight, { shouldRun: true }>;
  owner: QaPoolUserLease;
  isolationUser: QaPoolUserLease;
  sourceWorkout: PersistedPlannedWorkoutRow;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  assert.ok(publishableKey, "Authenticated RLS proof requires the local publishable key.");
  const ownerClient = createClient<Database>(input.preflight.target.url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const isolationClient = createClient<Database>(input.preflight.target.url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [ownerSignIn, isolationSignIn] = await Promise.all([
    ownerClient.auth.signInWithPassword({
      email: input.owner.email,
      password: DISPOSABLE_TEST_PASSWORD,
    }),
    isolationClient.auth.signInWithPassword({
      email: input.isolationUser.email,
      password: DISPOSABLE_TEST_PASSWORD,
    }),
  ]);
  assert.equal(ownerSignIn.error, null);
  assert.equal(isolationSignIn.error, null);

  const ownerRead = await ownerClient
    .from("planned_workouts")
    .select("id")
    .eq("id", input.sourceWorkout.id);
  assert.equal(ownerRead.error, null);
  assert.equal(ownerRead.data?.length, 1);

  const crossUserRead = await isolationClient
    .from("planned_workouts")
    .select("id")
    .eq("id", input.sourceWorkout.id);
  assert.equal(crossUserRead.error, null);
  assert.deepEqual(crossUserRead.data, []);

  const directUpdate = await ownerClient
    .from("planned_workouts")
    .update({ title: "Direct authenticated writes must stay blocked" })
    .eq("id", input.sourceWorkout.id);
  assert.ok(directUpdate.error, "Authenticated direct workout updates must be revoked.");

  const directInsert = await ownerClient.from("planned_workouts").insert({
    ...input.sourceWorkout,
    id: crypto.randomUUID(),
    workout_date: addDaysIso(input.sourceWorkout.workout_date, 20),
  });
  assert.ok(directInsert.error, "Authenticated direct workout inserts must be revoked.");

  const directRpc = await ownerClient.rpc("apply_calendar_workout_mutation", {
    p_user_id: input.owner.userId,
    p_current_date: todayIso(),
    p_mutation_kind: "clear",
    p_expected_source_workout: buildFullSourceWorkoutFingerprint(
      input.sourceWorkout,
    ) as unknown as Json,
    p_expected_target_workout: null,
    p_workout_insert: null,
    p_workout_update: null,
    p_mutation_event: {
      mutation_source: "calendar_workout_mutation_v1",
      mutation_kind: "user_cleared_workout",
      origin_kind: input.sourceWorkout.origin_kind,
      planned_workout_id: input.sourceWorkout.id,
      review_payload_version: "unauthorized_direct_rpc_probe_v1",
      review_checksum: "0".repeat(64),
    },
  });
  assert.ok(directRpc.error, "Authenticated callers must not execute mutation RPCs directly.");

  await Promise.all([ownerClient.auth.signOut(), isolationClient.auth.signOut()]);
  return {
    ownerRead: true,
    crossUserReadHidden: true,
    directInsertRevoked: true,
    directUpdateRevoked: true,
    directRpcRevoked: true,
  } as const;
}

function processCalendarTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
