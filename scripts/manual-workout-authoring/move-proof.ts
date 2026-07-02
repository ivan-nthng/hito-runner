import assert from "node:assert/strict";
import type { PersistedPlannedWorkoutRow } from "../../src/lib/active-plan-persistence";
import {
  confirmManualWorkoutMoveForUser,
  moveManualWorkoutWithinActivePlanForUser,
  reviewManualWorkoutMoveForUser,
} from "../../src/lib/manual-workout-authoring";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
} from "../../src/lib/manual-workout-authoring/schema";
import {
  assertDirectMoveBlocked,
  assertMoveConfirmBlocked,
  assertMoveReviewBlocked,
  assertNoFakePaceOrHr,
  assertRepeatWithRecovery,
  formatDirectMoveResult,
  formatMoveConfirmResult,
  formatMoveReviewResult,
  readStepsForAssertion,
} from "./move-proof-assertions";
import {
  assertReady,
  buildCanonicalPersistedPlannedWorkoutFromReview,
  buildFakeMoveDependencies,
  buildFakePlanCycle,
  buildFakePlannedWorkout,
  buildFakeWorkoutLog,
} from "./move-proof-fixtures";
import { validateMissedUnloggedMoveScenarios } from "./move-proof-missed-scenarios";

export async function validateManualMoveWorkoutContract() {
  const userId = "00000000-0000-4000-8000-000000000701";
  const activePlan = buildFakePlanCycle({
    userId,
    id: "99999999-9999-4999-8999-000000000701",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-18",
    endDate: "2026-06-21",
  });
  const sourceInput: ManualWorkoutDraftInput = {
    templateKey: "easy_run_with_strides",
    workoutDate: "2026-06-18",
    title: "Move candidate strides",
    notes: "Move this structure to another Rest day.",
  };
  const sourceReview = assertReady("move source review", sourceInput);
  const sourceWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000702",
    review: sourceReview,
  });
  const keptReview = assertReady("move kept review", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-21",
    title: "Keep this easy run",
  });
  const keptWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000703",
    review: keptReview,
  });
  const targetDate = "2026-06-22";
  const moveReview = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );

  assert.equal(moveReview.ok, true, formatMoveReviewResult(moveReview));
  if (moveReview.ok) {
    assert.equal(moveReview.status, "review_ready");
    assert.equal(moveReview.persisted, false);
    assert.equal(moveReview.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(moveReview.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(moveReview.activePlanId, activePlan.id);
    assert.equal(moveReview.sourceWorkoutId, sourceWorkout.id);
    assert.equal(moveReview.sourceWorkoutDate, sourceInput.workoutDate);
    assert.equal(moveReview.targetDate, targetDate);
    assert.equal(moveReview.targetWeekday, "Monday");
    assert.equal(moveReview.targetDayKind, "rest_day");
    assert.equal(moveReview.targetReplacement, null);
    assert.ok(moveReview.draftInput);
    assert.ok(moveReview.targetReview);
    assert.equal(moveReview.draftInput.workoutDate, targetDate);
    assert.equal(moveReview.targetReview.draft.weekday, "Monday");
    assert.notEqual(moveReview.targetReview.draft.weekday, sourceWorkout.weekday);
    assert.equal(moveReview.title, sourceInput.title);
    assert.equal(moveReview.templateKey, sourceInput.templateKey);
    assert.equal(moveReview.targetReview.draft.workoutIdentity, sourceReview.draft.workoutIdentity);
    assertRepeatWithRecovery(moveReview.targetReview.draft.steps, "move review");
    assertNoFakePaceOrHr(moveReview.targetReview.draft.steps, "move review");
    assert.equal(moveReview.review.reviewToken.startsWith("manual-workout-move-review-v1."), true);
    assert.equal(moveReview.review.reviewChecksum.length, 64);
    assert.equal(moveReview.safety.sourceWorkoutVerified, true);
    assert.equal(moveReview.safety.targetDayKind, "rest_day");
    assert.equal(moveReview.safety.targetWeekdayDerivedServerSide, true);
    assert.equal(moveReview.safety.lastWorkoutMoveAllowedWithinSamePlan, true);
    assert.equal(moveReview.safety.trustedClientRows, false);
  }

  const sourceDateReview = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-23",
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assert.equal(sourceDateReview.ok, true, formatMoveReviewResult(sourceDateReview));

  const sourcePairReview = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-23",
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assert.equal(sourcePairReview.ok, true, formatMoveReviewResult(sourcePairReview));
  if (sourcePairReview.ok) {
    assert.equal(sourcePairReview.sourceWorkoutId, sourceWorkout.id);
    assert.equal(sourcePairReview.sourceWorkoutDate, sourceWorkout.workout_date);
    assert.equal(sourcePairReview.targetDate, "2026-06-23");
    assert.equal(sourcePairReview.targetDayKind, "rest_day");
    assert.equal(sourcePairReview.safety.trustedClientRows, false);
  }

  const mismatchedSourcePairReview = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: "2026-06-17",
      targetDate: "2026-06-23",
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertMoveReviewBlocked(
    mismatchedSourcePairReview,
    "source_date_changed",
    "mismatched move source id/date pair",
  );

  const persistedMoves: Array<{
    sourceWorkoutId: string;
    sourceDate: string;
    targetDate: string;
    targetWeekday: string;
    targetWeekNumber: number;
    sourceDateEmpty: boolean;
    targetContainsMoved: boolean;
    reviewChecksum: string;
    title: string;
    workoutIdentity: string | null;
    metricMode: PersistedPlannedWorkoutRow["metric_mode"];
    steps: PersistedPlannedWorkoutRow["steps"];
  }> = [];
  const success = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      ...(moveReview.ok
        ? {
            reviewToken: moveReview.review.reviewToken,
            reviewChecksum: moveReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      onPersist: ({ sourceWorkout: persistedSource, otherWorkouts, review, targetWeekNumber }) => {
        const movedWorkout = {
          ...persistedSource,
          workout_date: review.targetDate,
          weekday: review.targetWeekday,
          week_number: targetWeekNumber,
        };
        const movedRows = [...otherWorkouts, movedWorkout];
        persistedMoves.push({
          sourceWorkoutId: persistedSource.id,
          sourceDate: persistedSource.workout_date,
          targetDate: review.targetDate,
          targetWeekday: review.targetWeekday,
          targetWeekNumber,
          sourceDateEmpty: movedRows.every(
            (workout) => workout.workout_date !== persistedSource.workout_date,
          ),
          targetContainsMoved: movedRows.some(
            (workout) => workout.id === persistedSource.id && workout.workout_date === targetDate,
          ),
          reviewChecksum: review.reviewChecksum,
          title: movedWorkout.title,
          workoutIdentity: movedWorkout.workout_identity,
          metricMode: movedWorkout.metric_mode,
          steps: movedWorkout.steps,
        });
      },
    }),
  );

  assert.equal(success.ok, true, formatMoveConfirmResult(success));
  if (success.ok) {
    assert.equal(success.status, "moved");
    assert.equal(success.persisted, true);
    assert.equal(success.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(success.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
    assert.equal(success.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(success.activePlanId, activePlan.id);
    assert.equal(success.plannedWorkoutId, sourceWorkout.id);
    assert.equal(success.sourceWorkoutDate, sourceWorkout.workout_date);
    assert.equal(success.targetDate, targetDate);
    assert.equal(success.targetWeekday, "Monday");
    assert.equal(success.targetDayKind, "rest_day");
    assert.equal(success.targetReplacement, null);
    assert.equal(success.title, sourceInput.title);
    assert.equal(success.templateKey, sourceInput.templateKey);
    assert.equal(success.calendarRowCount, 2);
    assert.equal(success.nonRestWorkoutCount, 2);
    assert.equal(success.safety.movedExactlyOneRow, true);
    assert.equal(success.safety.sourceDateBecameEmpty, true);
    assert.equal(success.safety.targetDayKind, "rest_day");
    assert.equal(success.safety.targetWeekdayDerivedServerSide, true);
    assert.equal(success.safety.lastWorkoutMoveAllowedWithinSamePlan, true);
    assert.equal(success.safety.serverRebuiltReview, true);
    assert.equal(success.safety.trustedClientRows, false);
  }

  assert.equal(persistedMoves.length, 1);
  const persistedMove = persistedMoves[0]!;
  assert.deepEqual(
    {
      sourceWorkoutId: persistedMove.sourceWorkoutId,
      sourceDate: persistedMove.sourceDate,
      targetDate: persistedMove.targetDate,
      targetWeekday: persistedMove.targetWeekday,
      targetWeekNumber: persistedMove.targetWeekNumber,
      sourceDateEmpty: persistedMove.sourceDateEmpty,
      targetContainsMoved: persistedMove.targetContainsMoved,
      reviewChecksum: persistedMove.reviewChecksum,
      title: persistedMove.title,
      workoutIdentity: persistedMove.workoutIdentity,
    },
    {
      sourceWorkoutId: sourceWorkout.id,
      sourceDate: sourceInput.workoutDate,
      targetDate,
      targetWeekday: "Monday",
      targetWeekNumber: 1,
      sourceDateEmpty: true,
      targetContainsMoved: true,
      reviewChecksum: moveReview.ok ? moveReview.review.reviewChecksum : "",
      title: sourceInput.title,
      workoutIdentity: sourceReview.draft.workoutIdentity,
    },
  );
  assert.deepEqual(persistedMove.metricMode, sourceWorkout.metric_mode);
  assert.deepEqual(persistedMove.steps, sourceWorkout.steps);
  assertNoFakePaceOrHr(readStepsForAssertion(persistedMove.steps), "persisted move");

  const directPersistedMoves: Array<{
    sourceWorkoutId: string;
    sourceDate: string;
    targetDate: string;
    targetWeekday: string;
    targetWeekNumber: number;
    mutationMode?: string;
    mutationPayloadVersion?: string;
    mutationChecksum?: string;
    trustedClientRows?: boolean;
    sourceDateEmpty: boolean;
    targetContainsMoved: boolean;
    metricMode: PersistedPlannedWorkoutRow["metric_mode"];
    steps: PersistedPlannedWorkoutRow["steps"];
  }> = [];
  const directMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-23",
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      onPersist: ({ sourceWorkout: persistedSource, otherWorkouts, review, targetWeekNumber }) => {
        const movedWorkout = {
          ...persistedSource,
          workout_date: review.targetDate,
          weekday: review.targetWeekday,
          week_number: targetWeekNumber,
        };
        const movedRows = [...otherWorkouts, movedWorkout];
        directPersistedMoves.push({
          sourceWorkoutId: persistedSource.id,
          sourceDate: persistedSource.workout_date,
          targetDate: review.targetDate,
          targetWeekday: review.targetWeekday,
          targetWeekNumber,
          mutationMode: review.mutationMode,
          mutationPayloadVersion: review.mutationPayloadVersion,
          mutationChecksum: review.mutationChecksum,
          trustedClientRows: review.trustedClientRows,
          sourceDateEmpty: movedRows.every(
            (workout) => workout.workout_date !== persistedSource.workout_date,
          ),
          targetContainsMoved: movedRows.some(
            (workout) => workout.id === persistedSource.id && workout.workout_date === "2026-06-23",
          ),
          metricMode: movedWorkout.metric_mode,
          steps: movedWorkout.steps,
        });
      },
    }),
  );

  assert.equal(directMove.ok, true, formatDirectMoveResult(directMove));
  if (directMove.ok) {
    assert.equal(directMove.status, "moved");
    assert.equal(directMove.persisted, true);
    assert.equal(directMove.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(directMove.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
    assert.equal(directMove.activePlanId, activePlan.id);
    assert.equal(directMove.plannedWorkoutId, sourceWorkout.id);
    assert.equal(directMove.sourceWorkoutDate, sourceWorkout.workout_date);
    assert.equal(directMove.targetDate, "2026-06-23");
    assert.equal(directMove.targetWeekday, "Tuesday");
    assert.equal(directMove.targetDayKind, "rest_day");
    assert.equal(directMove.targetReplacement, null);
    assert.equal(directMove.mutationMode, "direct_manual_edit");
    assert.equal(directMove.mutationPayloadVersion, "manual_workout_direct_move_v1");
    assert.equal(directMove.mutationChecksum.length, 64);
    assert.equal(directMove.calendarRowCount, 2);
    assert.equal(directMove.nonRestWorkoutCount, 2);
    assert.equal(directMove.safety.requiresExplicitConfirm, false);
    assert.equal(directMove.safety.directMutation, true);
    assert.equal(directMove.safety.movedExactlyOneRow, true);
    assert.equal(directMove.safety.sourceDateBecameEmpty, true);
    assert.equal(directMove.safety.targetDayKind, "rest_day");
    assert.equal(directMove.safety.trustedClientRows, false);
    assert.equal(directMove.safety.serverRebuiltReview, true);
  }
  assert.equal(directPersistedMoves.length, 1);
  const persistedDirectMove = directPersistedMoves[0]!;
  assert.equal(persistedDirectMove.sourceWorkoutId, sourceWorkout.id);
  assert.equal(persistedDirectMove.sourceDate, sourceWorkout.workout_date);
  assert.equal(persistedDirectMove.targetDate, "2026-06-23");
  assert.equal(persistedDirectMove.targetWeekday, "Tuesday");
  assert.equal(persistedDirectMove.targetWeekNumber, 1);
  assert.equal(persistedDirectMove.mutationMode, "direct_manual_edit");
  assert.equal(persistedDirectMove.mutationPayloadVersion, "manual_workout_direct_move_v1");
  assert.equal(
    persistedDirectMove.mutationChecksum,
    directMove.ok ? directMove.mutationChecksum : "",
  );
  assert.equal(persistedDirectMove.trustedClientRows, false);
  assert.equal(persistedDirectMove.sourceDateEmpty, true);
  assert.equal(persistedDirectMove.targetContainsMoved, true);
  assert.deepEqual(persistedDirectMove.metricMode, sourceWorkout.metric_mode);
  assert.deepEqual(persistedDirectMove.steps, sourceWorkout.steps);
  assertNoFakePaceOrHr(readStepsForAssertion(persistedDirectMove.steps), "direct persisted move");

  await validateMissedUnloggedMoveScenarios({ userId });

  const changedTarget = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate: "2026-06-23",
      ...(moveReview.ok
        ? {
            reviewToken: moveReview.review.reviewToken,
            reviewChecksum: moveReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertMoveConfirmBlocked(changedTarget, "stale_review", "changed move target date");

  const otherSourceReview = assertReady("move changed source review", {
    templateKey: "steady_aerobic_run",
    workoutDate: "2026-06-20",
    title: "Other source",
  });
  const otherSourceWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000704",
    review: otherSourceReview,
  });
  const changedSource = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: otherSourceWorkout.id,
      targetDate,
      ...(moveReview.ok
        ? {
            reviewToken: moveReview.review.reviewToken,
            reviewChecksum: moveReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout, otherSourceWorkout],
    }),
  );
  assertMoveConfirmBlocked(changedSource, "stale_review", "changed move source workout");

  const invalidToken = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      reviewToken: moveReview.ok
        ? `${moveReview.review.reviewToken.slice(0, -1)}${
            moveReview.review.reviewToken.endsWith("0") ? "1" : "0"
          }`
        : "invalid-token",
      reviewChecksum: moveReview.ok ? moveReview.review.reviewChecksum : "0".repeat(64),
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertMoveConfirmBlocked(invalidToken, "invalid_review", "invalid move token");

  const staleChecksum = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      reviewToken: moveReview.ok ? moveReview.review.reviewToken : "invalid-token",
      reviewChecksum: "0".repeat(64),
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertMoveConfirmBlocked(staleChecksum, "stale_review", "stale move checksum");

  const occupiedWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000705",
    date: targetDate,
    displayOrder: 2,
  });
  const occupiedTarget = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      ...(moveReview.ok
        ? {
            reviewToken: moveReview.review.reviewToken,
            reviewChecksum: moveReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout, occupiedWorkout],
    }),
  );
  assertMoveConfirmBlocked(
    occupiedTarget,
    "stale_review",
    "occupied move target with rest-day review",
  );

  const occupiedReplacementReview = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate,
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout, occupiedWorkout],
    }),
  );
  assert.equal(
    occupiedReplacementReview.ok,
    true,
    formatMoveReviewResult(occupiedReplacementReview),
  );
  if (occupiedReplacementReview.ok) {
    assert.equal(occupiedReplacementReview.targetDayKind, "workout_day");
    assert.equal(occupiedReplacementReview.targetReplacement?.plannedWorkoutId, occupiedWorkout.id);
    assert.equal(occupiedReplacementReview.draftInput, null);
    assert.equal(occupiedReplacementReview.targetReview, null);
    assert.equal(occupiedReplacementReview.safety.requiresExplicitConfirm, true);
    assert.equal(occupiedReplacementReview.safety.targetDayKind, "workout_day");
    assert.equal(occupiedReplacementReview.safety.trustedClientRows, false);
  }

  const replacementPersistProof: Array<{
    sourceWorkoutId: string;
    replacedTargetId: string | null;
    sourceDateEmpty: boolean;
    targetContainsMoved: boolean;
    replacedTargetRemoved: boolean;
    targetDayKind: string;
  }> = [];
  const replacementConfirm = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate,
      ...(occupiedReplacementReview.ok
        ? {
            reviewToken: occupiedReplacementReview.review.reviewToken,
            reviewChecksum: occupiedReplacementReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout, occupiedWorkout],
      onPersist: ({ sourceWorkout: persistedSource, otherWorkouts, review }) => {
        const movedWorkout = {
          ...persistedSource,
          workout_date: review.targetDate,
          weekday: review.targetWeekday,
        };
        const movedRows = [
          ...otherWorkouts.filter(
            (workout) => workout.id !== review.targetReplacement?.plannedWorkoutId,
          ),
          movedWorkout,
        ];
        replacementPersistProof.push({
          sourceWorkoutId: persistedSource.id,
          replacedTargetId: review.targetReplacement?.plannedWorkoutId ?? null,
          sourceDateEmpty: movedRows.every(
            (workout) => workout.workout_date !== persistedSource.workout_date,
          ),
          targetContainsMoved: movedRows.some(
            (workout) =>
              workout.id === persistedSource.id && workout.workout_date === review.targetDate,
          ),
          replacedTargetRemoved: movedRows.every((workout) => workout.id !== occupiedWorkout.id),
          targetDayKind: review.targetDayKind,
        });
      },
    }),
  );
  assert.equal(replacementConfirm.ok, true, formatMoveConfirmResult(replacementConfirm));
  if (replacementConfirm.ok) {
    assert.equal(replacementConfirm.targetDayKind, "workout_day");
    assert.equal(replacementConfirm.targetReplacement?.plannedWorkoutId, occupiedWorkout.id);
    assert.equal(replacementConfirm.calendarRowCount, 2);
    assert.equal(replacementConfirm.nonRestWorkoutCount, 2);
    assert.equal(replacementConfirm.safety.requiresExplicitConfirm, true);
    assert.equal(replacementConfirm.safety.movedExactlyOneRow, true);
    assert.equal(replacementConfirm.safety.sourceDateBecameEmpty, true);
    assert.equal(replacementConfirm.safety.targetDayKind, "workout_day");
    assert.equal(replacementConfirm.safety.trustedClientRows, false);
  }
  assert.deepEqual(replacementPersistProof, [
    {
      sourceWorkoutId: sourceWorkout.id,
      replacedTargetId: occupiedWorkout.id,
      sourceDateEmpty: true,
      targetContainsMoved: true,
      replacedTargetRemoved: true,
      targetDayKind: "workout_day",
    },
  ]);

  const missingReplacementAtConfirm = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      ...(occupiedReplacementReview.ok
        ? {
            reviewToken: occupiedReplacementReview.review.reviewToken,
            reviewChecksum: occupiedReplacementReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertMoveConfirmBlocked(
    missingReplacementAtConfirm,
    "stale_review",
    "missing replacement target at confirm",
  );

  const presetPlan = buildFakePlanCycle({
    userId,
    id: activePlan.id,
    sourceKind: "ai_first_plan_blueprint_v1",
    startDate: "2026-06-18",
    endDate: "2026-06-21",
  });
  const presetMoveReview = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
    },
    buildFakeMoveDependencies({ activePlan: presetPlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assert.equal(presetMoveReview.ok, true, formatMoveReviewResult(presetMoveReview));
  if (presetMoveReview.ok) {
    assert.equal(presetMoveReview.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(presetMoveReview.targetWeekday, "Monday");
    assert.equal(presetMoveReview.safety.targetWeekdayDerivedServerSide, true);
  }

  const presetMoveConfirm = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      ...(presetMoveReview.ok
        ? {
            reviewToken: presetMoveReview.review.reviewToken,
            reviewChecksum: presetMoveReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({ activePlan: presetPlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assert.equal(presetMoveConfirm.ok, true, formatMoveConfirmResult(presetMoveConfirm));
  if (presetMoveConfirm.ok) {
    assert.equal(presetMoveConfirm.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(presetMoveConfirm.sourceStatus, null);
    assert.equal(presetMoveConfirm.targetWeekday, "Monday");
    assert.equal(presetMoveConfirm.safety.movedExactlyOneRow, true);
  }

  const selectedPlan = buildFakePlanCycle({
    userId,
    id: activePlan.id,
    sourceKind: "ai_first_plan_blueprint_v1",
    startDate: "2026-06-18",
    endDate: "2026-06-21",
  });
  const selectedGeneratedSource = buildFakePlannedWorkout({
    userId,
    planCycleId: selectedPlan.id,
    id: "99999999-9999-4999-8999-000000000710",
    date: "2026-06-18",
    displayOrder: 0,
    title: "Selected-plan generated easy run",
    sourceWorkoutType: "selected_plan_easy_run",
    workoutFamily: "easy",
    workoutIdentity: "easy_aerobic_run",
    calendarIconKey: "easy",
    metricMode: { mode: "pace_executable" },
    steps: [
      {
        type: "work",
        segment_type: "main",
        duration_min: 30,
        target: {
          effort: "easy",
          pace_min_per_km_range: [5.4, 5.9],
          hr_bpm_range: [150, 164],
        },
      },
    ] as PersistedPlannedWorkoutRow["steps"],
  });
  const selectedDirectMoveProof: Array<{
    plannedWorkoutId: string;
    sourceWorkoutId: string | null;
    sourceWorkoutType: string | null;
    targetDate: string;
    targetWeekday: string;
    targetContainsMoved: boolean;
  }> = [];
  const selectedDirectMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: selectedPlan.id,
      sourceWorkoutId: selectedGeneratedSource.id,
      sourceWorkoutDate: selectedGeneratedSource.workout_date,
      targetDate: "2026-06-24",
    },
    buildFakeMoveDependencies({
      activePlan: selectedPlan,
      workouts: [selectedGeneratedSource, keptWorkout],
      onPersist: ({ sourceWorkout: persistedSource, otherWorkouts, review }) => {
        const movedRows = [
          ...otherWorkouts,
          {
            ...persistedSource,
            workout_date: review.targetDate,
            weekday: review.targetWeekday,
          },
        ];
        selectedDirectMoveProof.push({
          plannedWorkoutId: persistedSource.id,
          sourceWorkoutId: persistedSource.source_workout_id,
          sourceWorkoutType: persistedSource.source_workout_type,
          targetDate: review.targetDate,
          targetWeekday: review.targetWeekday,
          targetContainsMoved: movedRows.some(
            (workout) =>
              workout.id === persistedSource.id && workout.workout_date === review.targetDate,
          ),
        });
      },
    }),
  );
  assert.equal(selectedDirectMove.ok, true, formatDirectMoveResult(selectedDirectMove));
  if (selectedDirectMove.ok) {
    assert.equal(selectedDirectMove.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(selectedDirectMove.sourceStatus, null);
    assert.equal(selectedDirectMove.plannedWorkoutId, selectedGeneratedSource.id);
    assert.equal(selectedDirectMove.targetDate, "2026-06-24");
    assert.equal(selectedDirectMove.targetWeekday, "Wednesday");
    assert.equal(selectedDirectMove.templateKey, "selected_plan_easy_run");
    assert.equal(selectedDirectMove.safety.directMutation, true);
    assert.equal(selectedDirectMove.safety.movedExactlyOneRow, true);
    assert.equal(selectedDirectMove.safety.trustedClientRows, false);
  }
  assert.deepEqual(selectedDirectMoveProof, [
    {
      plannedWorkoutId: selectedGeneratedSource.id,
      sourceWorkoutId: selectedGeneratedSource.source_workout_id,
      sourceWorkoutType: "selected_plan_easy_run",
      targetDate: "2026-06-24",
      targetWeekday: "Wednesday",
      targetContainsMoved: true,
    },
  ]);

  const selectedOccupiedTarget = buildFakePlannedWorkout({
    userId,
    planCycleId: selectedPlan.id,
    id: "99999999-9999-4999-8999-000000000711",
    date: "2026-06-24",
    displayOrder: 1,
    title: "Selected-plan target to replace",
    sourceWorkoutType: "selected_plan_steady_run",
    workoutFamily: "steady",
    workoutIdentity: "steady_aerobic_run",
    calendarIconKey: "steady",
  });
  const selectedReplacementReview = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: selectedPlan.id,
      sourceWorkoutId: selectedGeneratedSource.id,
      sourceWorkoutDate: selectedGeneratedSource.workout_date,
      targetDate: selectedOccupiedTarget.workout_date,
    },
    buildFakeMoveDependencies({
      activePlan: selectedPlan,
      workouts: [selectedGeneratedSource, selectedOccupiedTarget],
    }),
  );
  assert.equal(
    selectedReplacementReview.ok,
    true,
    formatMoveReviewResult(selectedReplacementReview),
  );
  if (selectedReplacementReview.ok) {
    assert.equal(selectedReplacementReview.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(selectedReplacementReview.sourceWorkoutId, selectedGeneratedSource.id);
    assert.equal(selectedReplacementReview.sourceWorkoutDate, selectedGeneratedSource.workout_date);
    assert.equal(selectedReplacementReview.targetDate, selectedOccupiedTarget.workout_date);
    assert.equal(selectedReplacementReview.targetDayKind, "workout_day");
    assert.equal(
      selectedReplacementReview.targetReplacement?.plannedWorkoutId,
      selectedOccupiedTarget.id,
    );
    assert.equal(selectedReplacementReview.templateKey, "selected_plan_easy_run");
    assert.equal(selectedReplacementReview.draftInput, null);
    assert.equal(selectedReplacementReview.targetReview, null);
    assert.equal(selectedReplacementReview.safety.targetDayKind, "workout_day");
    assert.equal(selectedReplacementReview.safety.trustedClientRows, false);
  }

  const selectedReplacementProof: Array<{
    movedPlannedWorkoutId: string;
    replacedTargetId: string | null;
    sourceWorkoutType: string | null;
    targetDate: string;
    targetContainsMoved: boolean;
    replacedTargetRemoved: boolean;
    metricMode: PersistedPlannedWorkoutRow["metric_mode"];
    steps: PersistedPlannedWorkoutRow["steps"];
  }> = [];
  const selectedReplacementConfirm = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: selectedPlan.id,
      sourceWorkoutId: selectedGeneratedSource.id,
      sourceWorkoutDate: selectedGeneratedSource.workout_date,
      targetDate: selectedOccupiedTarget.workout_date,
      ...(selectedReplacementReview.ok
        ? {
            reviewToken: selectedReplacementReview.review.reviewToken,
            reviewChecksum: selectedReplacementReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({
      activePlan: selectedPlan,
      workouts: [selectedGeneratedSource, selectedOccupiedTarget],
      onPersist: ({ sourceWorkout: persistedSource, otherWorkouts, review }) => {
        const movedWorkout = {
          ...persistedSource,
          workout_date: review.targetDate,
          weekday: review.targetWeekday,
        };
        const movedRows = [
          ...otherWorkouts.filter(
            (workout) => workout.id !== review.targetReplacement?.plannedWorkoutId,
          ),
          movedWorkout,
        ];
        selectedReplacementProof.push({
          movedPlannedWorkoutId: persistedSource.id,
          replacedTargetId: review.targetReplacement?.plannedWorkoutId ?? null,
          sourceWorkoutType: persistedSource.source_workout_type,
          targetDate: review.targetDate,
          targetContainsMoved: movedRows.some(
            (workout) =>
              workout.id === persistedSource.id && workout.workout_date === review.targetDate,
          ),
          replacedTargetRemoved: movedRows.every(
            (workout) => workout.id !== selectedOccupiedTarget.id,
          ),
          metricMode: movedWorkout.metric_mode,
          steps: movedWorkout.steps,
        });
      },
    }),
  );
  assert.equal(
    selectedReplacementConfirm.ok,
    true,
    formatMoveConfirmResult(selectedReplacementConfirm),
  );
  if (selectedReplacementConfirm.ok) {
    assert.equal(selectedReplacementConfirm.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(selectedReplacementConfirm.plannedWorkoutId, selectedGeneratedSource.id);
    assert.equal(selectedReplacementConfirm.targetDayKind, "workout_day");
    assert.equal(
      selectedReplacementConfirm.targetReplacement?.plannedWorkoutId,
      selectedOccupiedTarget.id,
    );
    assert.equal(selectedReplacementConfirm.templateKey, "selected_plan_easy_run");
    assert.equal(selectedReplacementConfirm.safety.targetDayKind, "workout_day");
    assert.equal(selectedReplacementConfirm.safety.trustedClientRows, false);
  }
  assert.deepEqual(selectedReplacementProof, [
    {
      movedPlannedWorkoutId: selectedGeneratedSource.id,
      replacedTargetId: selectedOccupiedTarget.id,
      sourceWorkoutType: "selected_plan_easy_run",
      targetDate: selectedOccupiedTarget.workout_date,
      targetContainsMoved: true,
      replacedTargetRemoved: true,
      metricMode: selectedGeneratedSource.metric_mode,
      steps: selectedGeneratedSource.steps,
    },
  ]);

  const aiPlan = buildFakePlanCycle({
    userId,
    id: activePlan.id,
    sourceKind: "ai_first_plan_blueprint_v1",
    startDate: "2026-06-18",
    endDate: "2026-06-21",
  });
  const aiGeneratedSource = buildFakePlannedWorkout({
    userId,
    planCycleId: aiPlan.id,
    id: "99999999-9999-4999-8999-000000000712",
    date: "2026-06-18",
    displayOrder: 0,
    title: "AI first-plan easy run",
    sourceWorkoutType: "ai_first_plan_easy_run",
    workoutFamily: "easy",
    workoutIdentity: "easy_aerobic_run",
    calendarIconKey: "easy",
  });
  const aiOccupiedTarget = buildFakePlannedWorkout({
    userId,
    planCycleId: aiPlan.id,
    id: "99999999-9999-4999-8999-000000000713",
    date: "2026-06-24",
    displayOrder: 1,
    title: "AI target to replace",
    sourceWorkoutType: "ai_first_plan_steady_run",
    workoutFamily: "steady",
    workoutIdentity: "steady_aerobic_run",
    calendarIconKey: "steady",
  });
  const aiReplacementReview = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: aiPlan.id,
      sourceWorkoutId: aiGeneratedSource.id,
      sourceWorkoutDate: aiGeneratedSource.workout_date,
      targetDate: aiOccupiedTarget.workout_date,
    },
    buildFakeMoveDependencies({
      activePlan: aiPlan,
      workouts: [aiGeneratedSource, aiOccupiedTarget],
    }),
  );
  assert.equal(aiReplacementReview.ok, true, formatMoveReviewResult(aiReplacementReview));
  if (aiReplacementReview.ok) {
    assert.equal(aiReplacementReview.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(aiReplacementReview.sourceWorkoutId, aiGeneratedSource.id);
    assert.equal(aiReplacementReview.targetDayKind, "workout_day");
    assert.equal(aiReplacementReview.targetReplacement?.plannedWorkoutId, aiOccupiedTarget.id);
    assert.equal(aiReplacementReview.templateKey, "ai_first_plan_easy_run");
    assert.equal(aiReplacementReview.draftInput, null);
    assert.equal(aiReplacementReview.targetReview, null);
    assert.equal(aiReplacementReview.safety.targetDayKind, "workout_day");
    assert.equal(aiReplacementReview.safety.trustedClientRows, false);
  }

  const aiReplacementProof: Array<{
    movedPlannedWorkoutId: string;
    replacedTargetId: string | null;
    sourceWorkoutType: string | null;
    targetContainsMoved: boolean;
    replacedTargetRemoved: boolean;
  }> = [];
  const aiReplacementConfirm = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: aiPlan.id,
      sourceWorkoutId: aiGeneratedSource.id,
      sourceWorkoutDate: aiGeneratedSource.workout_date,
      targetDate: aiOccupiedTarget.workout_date,
      ...(aiReplacementReview.ok
        ? {
            reviewToken: aiReplacementReview.review.reviewToken,
            reviewChecksum: aiReplacementReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({
      activePlan: aiPlan,
      workouts: [aiGeneratedSource, aiOccupiedTarget],
      onPersist: ({ sourceWorkout: persistedSource, otherWorkouts, review }) => {
        const movedWorkout = {
          ...persistedSource,
          workout_date: review.targetDate,
          weekday: review.targetWeekday,
        };
        const movedRows = [
          ...otherWorkouts.filter(
            (workout) => workout.id !== review.targetReplacement?.plannedWorkoutId,
          ),
          movedWorkout,
        ];
        aiReplacementProof.push({
          movedPlannedWorkoutId: persistedSource.id,
          replacedTargetId: review.targetReplacement?.plannedWorkoutId ?? null,
          sourceWorkoutType: persistedSource.source_workout_type,
          targetContainsMoved: movedRows.some(
            (workout) =>
              workout.id === persistedSource.id && workout.workout_date === review.targetDate,
          ),
          replacedTargetRemoved: movedRows.every((workout) => workout.id !== aiOccupiedTarget.id),
        });
      },
    }),
  );
  assert.equal(aiReplacementConfirm.ok, true, formatMoveConfirmResult(aiReplacementConfirm));
  if (aiReplacementConfirm.ok) {
    assert.equal(aiReplacementConfirm.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(aiReplacementConfirm.plannedWorkoutId, aiGeneratedSource.id);
    assert.equal(aiReplacementConfirm.targetDayKind, "workout_day");
    assert.equal(aiReplacementConfirm.targetReplacement?.plannedWorkoutId, aiOccupiedTarget.id);
    assert.equal(aiReplacementConfirm.templateKey, "ai_first_plan_easy_run");
    assert.equal(aiReplacementConfirm.safety.targetDayKind, "workout_day");
    assert.equal(aiReplacementConfirm.safety.trustedClientRows, false);
  }
  assert.deepEqual(aiReplacementProof, [
    {
      movedPlannedWorkoutId: aiGeneratedSource.id,
      replacedTargetId: aiOccupiedTarget.id,
      sourceWorkoutType: "ai_first_plan_easy_run",
      targetContainsMoved: true,
      replacedTargetRemoved: true,
    },
  ]);

  const unsupportedPlanSource = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
    },
    buildFakeMoveDependencies({
      activePlan: buildFakePlanCycle({
        userId,
        id: activePlan.id,
        sourceKind: "legacy_unreviewed_plan_v0",
        startDate: "2026-06-18",
        endDate: "2026-06-21",
      }),
      workouts: [sourceWorkout, keptWorkout],
    }),
  );
  assertMoveReviewBlocked(
    unsupportedPlanSource,
    "unsupported_active_plan_source",
    "unsupported move plan source",
  );

  const foreignSourceWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId: "00000000-0000-4000-8000-000000000799",
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000706",
    review: sourceReview,
  });
  const foreignSource = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: foreignSourceWorkout.id,
      targetDate,
    },
    buildFakeMoveDependencies({ activePlan, workouts: [foreignSourceWorkout, keptWorkout] }),
  );
  assertMoveReviewBlocked(
    foreignSource,
    "source_workout_not_in_active_plan",
    "foreign move source workout",
  );

  const missingSource = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: "99999999-9999-4999-8999-000000000707",
      targetDate,
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertMoveReviewBlocked(missingSource, "source_workout_not_found", "missing move source workout");

  const clientRowsAttempt = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      ...(moveReview.ok
        ? {
            reviewToken: moveReview.review.reviewToken,
            reviewChecksum: moveReview.review.reviewChecksum,
          }
        : {}),
      plannedWorkout: { workoutDate: targetDate, steps: [] },
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertMoveConfirmBlocked(clientRowsAttempt, "invalid_review", "client-sent move row");

  const directChangedSourceDate = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: "2026-06-17",
      targetDate,
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertDirectMoveBlocked(
    directChangedSourceDate,
    "source_date_changed",
    "direct move stale source date",
  );

  const directClientRowsAttempt = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate,
      plannedWorkout: { workoutDate: targetDate, steps: [] },
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertDirectMoveBlocked(
    directClientRowsAttempt,
    "client_payload_rejected",
    "direct move client payload",
  );

  const directOccupiedTarget = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate,
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout, occupiedWorkout],
    }),
  );
  assertDirectMoveBlocked(
    directOccupiedTarget,
    "replacement_requires_review",
    "direct move occupied target",
  );

  const protectedOccupiedTarget = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout, occupiedWorkout],
      logsByWorkoutId: new Map([
        [
          occupiedWorkout.id,
          buildFakeWorkoutLog({
            userId,
            plannedWorkoutId: occupiedWorkout.id,
          }),
        ],
      ]),
    }),
  );
  assertMoveReviewBlocked(protectedOccupiedTarget, "protected_day", "logged occupied move target");

  const directNonManualPlan = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate,
    },
    buildFakeMoveDependencies({ activePlan: presetPlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assert.equal(directNonManualPlan.ok, true, formatDirectMoveResult(directNonManualPlan));
  if (directNonManualPlan.ok) {
    assert.equal(directNonManualPlan.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(directNonManualPlan.sourceStatus, null);
    assert.equal(directNonManualPlan.safety.directMutation, true);
    assert.equal(directNonManualPlan.safety.movedExactlyOneRow, true);
  }

  const loggedSource = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      logsByWorkoutId: new Map([
        [
          sourceWorkout.id,
          buildFakeWorkoutLog({
            userId,
            plannedWorkoutId: sourceWorkout.id,
          }),
        ],
      ]),
    }),
  );
  assertMoveReviewBlocked(loggedSource, "protected_day", "logged move source");

  const directLoggedSource = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate,
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      logsByWorkoutId: new Map([
        [
          sourceWorkout.id,
          buildFakeWorkoutLog({
            userId,
            plannedWorkoutId: sourceWorkout.id,
          }),
        ],
      ]),
    }),
  );
  assertDirectMoveBlocked(directLoggedSource, "protected_day", "direct move logged source");

  const evidenceSource = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      evidenceWorkoutIds: new Set([sourceWorkout.id]),
    }),
  );
  assertMoveReviewBlocked(evidenceSource, "protected_day", "evidence move source");

  const directEvidenceSource = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate,
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      evidenceWorkoutIds: new Set([sourceWorkout.id]),
    }),
  );
  assertDirectMoveBlocked(directEvidenceSource, "protected_day", "direct move evidence source");

  const protectedPastTarget = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate: "2026-06-09",
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertMoveReviewBlocked(protectedPastTarget, "protected_day", "past move target");

  const sameDate = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate: sourceWorkout.workout_date,
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertMoveReviewBlocked(sameDate, "target_date_unchanged", "same-date move");

  const unsupportedSource = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000708",
    date: "2026-06-24",
    displayOrder: 2,
    sourceWorkoutType: "legacy_easy",
    steps: sourceWorkout.steps,
  });
  const unsupported = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: unsupportedSource.id,
      targetDate,
    },
    buildFakeMoveDependencies({ activePlan, workouts: [unsupportedSource, keptWorkout] }),
  );
  assertMoveReviewBlocked(unsupported, "source_workout_not_supported", "unsupported move source");

  const unsafeMoveSource = {
    ...sourceWorkout,
    id: "99999999-9999-4999-8999-000000000709",
    workout_date: "2026-06-24",
    steps: [
      {
        label: "Unsafe fake HR",
        target: { hr_bpm_range: [170, 180] },
      },
    ] as PersistedPlannedWorkoutRow["steps"],
  };
  const directUnsafeMoveSource = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: unsafeMoveSource.id,
      sourceWorkoutDate: unsafeMoveSource.workout_date,
      targetDate: "2026-06-25",
    },
    buildFakeMoveDependencies({ activePlan, workouts: [unsafeMoveSource, keptWorkout] }),
  );
  assert.equal(directUnsafeMoveSource.ok, true, formatDirectMoveResult(directUnsafeMoveSource));
  if (directUnsafeMoveSource.ok) {
    assert.equal(directUnsafeMoveSource.plannedWorkoutId, unsafeMoveSource.id);
    assert.equal(directUnsafeMoveSource.targetDate, "2026-06-25");
    assert.equal(directUnsafeMoveSource.safety.directMutation, true);
    assert.equal(directUnsafeMoveSource.safety.movedExactlyOneRow, true);
  }

  const lastWorkoutMove = await reviewManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate: "2026-06-23",
    },
    buildFakeMoveDependencies({ activePlan, workouts: [sourceWorkout] }),
  );
  assert.equal(lastWorkoutMove.ok, true, formatMoveReviewResult(lastWorkoutMove));
  if (lastWorkoutMove.ok) {
    assert.equal(lastWorkoutMove.safety.lastWorkoutMoveAllowedWithinSamePlan, true);
  }

  const persistenceFailure = await confirmManualWorkoutMoveForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      ...(moveReview.ok
        ? {
            reviewToken: moveReview.review.reviewToken,
            reviewChecksum: moveReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeMoveDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      persistError: new Error("simulated move failure"),
    }),
  );
  assertMoveConfirmBlocked(persistenceFailure, "persistence_failed", "move persistence failure");
}
