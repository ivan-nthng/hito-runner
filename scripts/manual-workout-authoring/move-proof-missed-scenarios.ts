import assert from "node:assert/strict";
import type { PersistedPlannedWorkoutRow } from "../../src/lib/active-plan-persistence";
import { moveManualWorkoutWithinActivePlanForUser } from "../../src/lib/manual-workout-authoring";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
} from "../../src/lib/manual-workout-authoring/schema";
import {
  assertDirectMoveBlocked,
  assertNoFakePaceOrHr,
  formatDirectMoveResult,
  readStepsForAssertion,
} from "./move-proof-assertions";
import {
  assertReady,
  buildCanonicalPersistedPlannedWorkoutFromReview,
  buildFakeMoveDependencies,
  buildFakePlanCycle,
  buildFakePlannedWorkout,
  buildFakeWorkoutLog,
  type MoveDependencies,
} from "./move-proof-fixtures";

type DirectMovePersistProof = {
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
};

export async function validateMissedUnloggedMoveScenarios({ userId }: { userId: string }) {
  const missedPlan = buildFakePlanCycle({
    userId,
    id: "99999999-9999-4999-8999-000000000731",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-01",
    endDate: "2026-06-14",
  });
  const missedYesterdayReview = assertReady("missed yesterday move source", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-09",
    title: "Missed yesterday easy run",
  });
  const missedYesterdayWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: missedPlan.id,
    id: "99999999-9999-4999-8999-000000000732",
    review: missedYesterdayReview,
  });
  const missedMoveProof: DirectMovePersistProof[] = [];
  const missedYesterdayMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: missedYesterdayWorkout.id,
      sourceWorkoutDate: missedYesterdayWorkout.workout_date,
      targetDate: "2026-06-10",
    },
    buildFakeMoveDependencies({
      activePlan: missedPlan,
      workouts: [missedYesterdayWorkout],
      onPersist: ({ sourceWorkout: persistedSource, otherWorkouts, review, targetWeekNumber }) => {
        missedMoveProof.push(
          buildDirectMovePersistProof({
            sourceWorkout: persistedSource,
            otherWorkouts,
            targetDate: "2026-06-10",
            targetWeekNumber,
            review,
          }),
        );
      },
    }),
  );

  assert.equal(missedYesterdayMove.ok, true, formatDirectMoveResult(missedYesterdayMove));
  if (missedYesterdayMove.ok) {
    assert.equal(missedYesterdayMove.status, "moved");
    assert.equal(missedYesterdayMove.persisted, true);
    assert.equal(missedYesterdayMove.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(missedYesterdayMove.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
    assert.equal(missedYesterdayMove.plannedWorkoutId, missedYesterdayWorkout.id);
    assert.equal(missedYesterdayMove.sourceWorkoutDate, "2026-06-09");
    assert.equal(missedYesterdayMove.targetDate, "2026-06-10");
    assert.equal(missedYesterdayMove.targetWeekday, "Wednesday");
    assert.equal(missedYesterdayMove.title, missedYesterdayReview.draft.title);
    assert.equal(missedYesterdayMove.mutationMode, "direct_manual_edit");
    assert.equal(missedYesterdayMove.mutationPayloadVersion, "manual_workout_direct_move_v1");
    assert.equal(missedYesterdayMove.mutationChecksum.length, 64);
    assert.equal(missedYesterdayMove.calendarRowCount, 1);
    assert.equal(missedYesterdayMove.nonRestWorkoutCount, 1);
    assert.equal(missedYesterdayMove.safety.requiresExplicitConfirm, false);
    assert.equal(missedYesterdayMove.safety.directMutation, true);
    assert.equal(missedYesterdayMove.safety.movedExactlyOneRow, true);
    assert.equal(missedYesterdayMove.safety.sourceDateBecameEmpty, true);
    assert.equal(missedYesterdayMove.safety.targetDayKind, "rest_day");
    assert.equal(missedYesterdayMove.safety.targetWeekdayDerivedServerSide, true);
    assert.equal(missedYesterdayMove.safety.trustedClientRows, false);
  }
  assert.equal(missedMoveProof.length, 1);
  const persistedMissedMove = missedMoveProof[0]!;
  assert.equal(persistedMissedMove.sourceWorkoutId, missedYesterdayWorkout.id);
  assert.equal(persistedMissedMove.sourceDate, "2026-06-09");
  assert.equal(persistedMissedMove.targetDate, "2026-06-10");
  assert.equal(persistedMissedMove.targetWeekday, "Wednesday");
  assert.equal(persistedMissedMove.targetWeekNumber, 2);
  assert.equal(persistedMissedMove.mutationMode, "direct_manual_edit");
  assert.equal(persistedMissedMove.mutationPayloadVersion, "manual_workout_direct_move_v1");
  assert.equal(
    persistedMissedMove.mutationChecksum,
    missedYesterdayMove.ok ? missedYesterdayMove.mutationChecksum : "",
  );
  assert.equal(persistedMissedMove.trustedClientRows, false);
  assert.equal(persistedMissedMove.sourceDateEmpty, true);
  assert.equal(persistedMissedMove.targetContainsMoved, true);
  assert.deepEqual(persistedMissedMove.metricMode, missedYesterdayWorkout.metric_mode);
  assert.deepEqual(persistedMissedMove.steps, missedYesterdayWorkout.steps);
  assertNoFakePaceOrHr(readStepsForAssertion(persistedMissedMove.steps), "missed persisted move");

  const missedYesterdayFutureMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: missedYesterdayWorkout.id,
      sourceWorkoutDate: missedYesterdayWorkout.workout_date,
      targetDate: "2026-06-13",
    },
    buildFakeMoveDependencies({ activePlan: missedPlan, workouts: [missedYesterdayWorkout] }),
  );
  assert.equal(
    missedYesterdayFutureMove.ok,
    true,
    formatDirectMoveResult(missedYesterdayFutureMove),
  );
  if (missedYesterdayFutureMove.ok) {
    assert.equal(missedYesterdayFutureMove.sourceWorkoutDate, "2026-06-09");
    assert.equal(missedYesterdayFutureMove.targetDate, "2026-06-13");
    assert.equal(missedYesterdayFutureMove.targetWeekday, "Saturday");
    assert.equal(missedYesterdayFutureMove.safety.directMutation, true);
    assert.equal(missedYesterdayFutureMove.safety.targetDayKind, "rest_day");
    assert.equal(missedYesterdayFutureMove.safety.trustedClientRows, false);
    assertNoFakePaceOrHr(missedYesterdayReview.draft.steps, "missed future target source");
  }

  const missedSevenDayReview = assertReady("past unlogged move source", {
    templateKey: "steady_aerobic_run",
    workoutDate: "2026-06-03",
    title: "Past unlogged steady run",
  });
  const missedSevenDayWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: missedPlan.id,
    id: "99999999-9999-4999-8999-000000000733",
    review: missedSevenDayReview,
  });
  const missedSevenDayMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: missedSevenDayWorkout.id,
      sourceWorkoutDate: missedSevenDayWorkout.workout_date,
      targetDate: "2026-06-10",
    },
    buildFakeMoveDependencies({ activePlan: missedPlan, workouts: [missedSevenDayWorkout] }),
  );
  assert.equal(missedSevenDayMove.ok, true, formatDirectMoveResult(missedSevenDayMove));
  if (missedSevenDayMove.ok) {
    assert.equal(missedSevenDayMove.sourceWorkoutDate, "2026-06-03");
    assert.equal(missedSevenDayMove.targetDate, "2026-06-10");
    assert.equal(missedSevenDayMove.targetWeekday, "Wednesday");
    assertNoFakePaceOrHr(missedSevenDayReview.draft.steps, "past unlogged source");
  }

  const futureSourceReview = assertReady("future source to today", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-11",
    title: "Future source should not move to today",
  });
  const futureSourceWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: missedPlan.id,
    id: "99999999-9999-4999-8999-000000000734",
    review: futureSourceReview,
  });
  const futureSourceToToday = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: futureSourceWorkout.id,
      sourceWorkoutDate: futureSourceWorkout.workout_date,
      targetDate: "2026-06-10",
    },
    buildFakeMoveDependencies({ activePlan: missedPlan, workouts: [futureSourceWorkout] }),
  );
  assert.equal(futureSourceToToday.ok, true, formatDirectMoveResult(futureSourceToToday));
  if (futureSourceToToday.ok) {
    assert.equal(futureSourceToToday.sourceWorkoutDate, "2026-06-11");
    assert.equal(futureSourceToToday.targetDate, "2026-06-10");
    assert.equal(futureSourceToToday.targetWeekday, "Wednesday");
    assert.equal(futureSourceToToday.safety.directMutation, true);
  }

  const todaySourceReview = assertReady("today source no-op", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-10",
    title: "Today source should not no-op",
  });
  const todaySourceWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: missedPlan.id,
    id: "99999999-9999-4999-8999-000000000735",
    review: todaySourceReview,
  });
  const todaySourceNoop = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: todaySourceWorkout.id,
      sourceWorkoutDate: todaySourceWorkout.workout_date,
      targetDate: "2026-06-10",
    },
    buildFakeMoveDependencies({ activePlan: missedPlan, workouts: [todaySourceWorkout] }),
  );
  assertDirectMoveBlocked(todaySourceNoop, "target_date_unchanged", "direct move source today");

  const todaySourceFutureMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: todaySourceWorkout.id,
      sourceWorkoutDate: todaySourceWorkout.workout_date,
      targetDate: "2026-06-12",
    },
    buildFakeMoveDependencies({ activePlan: missedPlan, workouts: [todaySourceWorkout] }),
  );
  assert.equal(todaySourceFutureMove.ok, true, formatDirectMoveResult(todaySourceFutureMove));
  if (todaySourceFutureMove.ok) {
    assert.equal(todaySourceFutureMove.status, "moved");
    assert.equal(todaySourceFutureMove.sourceWorkoutDate, "2026-06-10");
    assert.equal(todaySourceFutureMove.targetDate, "2026-06-12");
    assert.equal(todaySourceFutureMove.targetWeekday, "Friday");
    assert.equal(todaySourceFutureMove.safety.directMutation, true);
    assert.equal(todaySourceFutureMove.safety.movedExactlyOneRow, true);
  }

  const oldMissedReview = assertReady("older past unlogged move source", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-02",
    title: "Older past unlogged source",
  });
  const oldMissedWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: missedPlan.id,
    id: "99999999-9999-4999-8999-000000000736",
    review: oldMissedReview,
  });
  const oldMissedMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: oldMissedWorkout.id,
      sourceWorkoutDate: oldMissedWorkout.workout_date,
      targetDate: "2026-06-10",
    },
    buildFakeMoveDependencies({ activePlan: missedPlan, workouts: [oldMissedWorkout] }),
  );
  assert.equal(oldMissedMove.ok, true, formatDirectMoveResult(oldMissedMove));
  if (oldMissedMove.ok) {
    assert.equal(oldMissedMove.sourceWorkoutDate, "2026-06-02");
    assert.equal(oldMissedMove.targetDate, "2026-06-10");
    assert.equal(oldMissedMove.targetWeekday, "Wednesday");
    assert.equal(oldMissedMove.safety.directMutation, true);
  }

  const oldMissedFutureMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: oldMissedWorkout.id,
      sourceWorkoutDate: oldMissedWorkout.workout_date,
      targetDate: "2026-06-13",
    },
    buildFakeMoveDependencies({ activePlan: missedPlan, workouts: [oldMissedWorkout] }),
  );
  assert.equal(oldMissedFutureMove.ok, true, formatDirectMoveResult(oldMissedFutureMove));
  if (oldMissedFutureMove.ok) {
    assert.equal(oldMissedFutureMove.sourceWorkoutDate, "2026-06-02");
    assert.equal(oldMissedFutureMove.targetDate, "2026-06-13");
    assert.equal(oldMissedFutureMove.targetWeekday, "Saturday");
    assert.equal(oldMissedFutureMove.safety.directMutation, true);
  }

  const loggedMissedSource = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: missedYesterdayWorkout.id,
      sourceWorkoutDate: missedYesterdayWorkout.workout_date,
      targetDate: "2026-06-10",
    },
    buildFakeMoveDependencies({
      activePlan: missedPlan,
      workouts: [missedYesterdayWorkout],
      logsByWorkoutId: new Map([
        [
          missedYesterdayWorkout.id,
          buildFakeWorkoutLog({
            userId,
            plannedWorkoutId: missedYesterdayWorkout.id,
          }),
        ],
      ]),
    }),
  );
  assertDirectMoveBlocked(loggedMissedSource, "protected_day", "direct move logged missed source");

  const loggedMissedFutureSource = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: missedYesterdayWorkout.id,
      sourceWorkoutDate: missedYesterdayWorkout.workout_date,
      targetDate: "2026-06-13",
    },
    buildFakeMoveDependencies({
      activePlan: missedPlan,
      workouts: [missedYesterdayWorkout],
      logsByWorkoutId: new Map([
        [
          missedYesterdayWorkout.id,
          buildFakeWorkoutLog({
            userId,
            plannedWorkoutId: missedYesterdayWorkout.id,
          }),
        ],
      ]),
    }),
  );
  assertDirectMoveBlocked(
    loggedMissedFutureSource,
    "protected_day",
    "direct move logged missed source to future target",
  );

  const evidenceMissedSource = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: missedYesterdayWorkout.id,
      sourceWorkoutDate: missedYesterdayWorkout.workout_date,
      targetDate: "2026-06-10",
    },
    buildFakeMoveDependencies({
      activePlan: missedPlan,
      workouts: [missedYesterdayWorkout],
      evidenceWorkoutIds: new Set([missedYesterdayWorkout.id]),
    }),
  );
  assertDirectMoveBlocked(
    evidenceMissedSource,
    "protected_day",
    "direct move evidence missed source",
  );

  const occupiedTodayWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: missedPlan.id,
    id: "99999999-9999-4999-8999-000000000737",
    date: "2026-06-10",
    displayOrder: 1,
  });
  const occupiedTodayMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: missedYesterdayWorkout.id,
      sourceWorkoutDate: missedYesterdayWorkout.workout_date,
      targetDate: "2026-06-10",
    },
    buildFakeMoveDependencies({
      activePlan: missedPlan,
      workouts: [missedYesterdayWorkout, occupiedTodayWorkout],
    }),
  );
  assertDirectMoveBlocked(occupiedTodayMove, "protected_day", "direct move occupied today");

  const restTodayWorkout = buildFakeRestWorkout({
    userId,
    planCycleId: missedPlan.id,
    id: "99999999-9999-4999-8999-000000000738",
    date: "2026-06-10",
    title: "Rest day",
  });
  const restTodayMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: missedYesterdayWorkout.id,
      sourceWorkoutDate: missedYesterdayWorkout.workout_date,
      targetDate: "2026-06-10",
    },
    buildFakeMoveDependencies({
      activePlan: missedPlan,
      workouts: [missedYesterdayWorkout, restTodayWorkout],
    }),
  );
  assertDirectMoveBlocked(restTodayMove, "protected_day", "direct move explicit rest today");

  const restFutureWorkout = buildFakeRestWorkout({
    userId,
    planCycleId: missedPlan.id,
    id: "99999999-9999-4999-8999-000000000739",
    date: "2026-06-13",
    title: "Future rest day",
  });
  const restReplacementProof: Array<{
    sourceWorkoutId: string;
    replacedTargetId: string | null;
    sourceDateEmpty: boolean;
    restTargetRemoved: boolean;
    targetContainsMoved: boolean;
    targetDayKind: string;
  }> = [];
  const restFutureMove = await moveManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: missedPlan.id,
      sourceWorkoutId: missedYesterdayWorkout.id,
      sourceWorkoutDate: missedYesterdayWorkout.workout_date,
      targetDate: "2026-06-13",
    },
    buildFakeMoveDependencies({
      activePlan: missedPlan,
      workouts: [missedYesterdayWorkout, restFutureWorkout],
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
        restReplacementProof.push({
          sourceWorkoutId: persistedSource.id,
          replacedTargetId: review.targetReplacement?.plannedWorkoutId ?? null,
          sourceDateEmpty: movedRows.every(
            (workout) => workout.workout_date !== persistedSource.workout_date,
          ),
          restTargetRemoved: movedRows.every((workout) => workout.id !== restFutureWorkout.id),
          targetContainsMoved: movedRows.some(
            (workout) =>
              workout.id === persistedSource.id && workout.workout_date === review.targetDate,
          ),
          targetDayKind: review.targetDayKind,
        });
      },
    }),
  );
  assert.equal(restFutureMove.ok, true, formatDirectMoveResult(restFutureMove));
  if (restFutureMove.ok) {
    assert.equal(restFutureMove.targetDate, "2026-06-13");
    assert.equal(restFutureMove.targetWeekday, "Saturday");
    assert.equal(restFutureMove.targetDayKind, "rest_day");
    assert.equal(restFutureMove.targetReplacement?.plannedWorkoutId, restFutureWorkout.id);
    assert.equal(restFutureMove.calendarRowCount, 1);
    assert.equal(restFutureMove.nonRestWorkoutCount, 1);
    assert.equal(restFutureMove.safety.requiresExplicitConfirm, false);
    assert.equal(restFutureMove.safety.targetDayKind, "rest_day");
    assert.equal(restFutureMove.safety.trustedClientRows, false);
  }
  assert.deepEqual(restReplacementProof, [
    {
      sourceWorkoutId: missedYesterdayWorkout.id,
      replacedTargetId: restFutureWorkout.id,
      sourceDateEmpty: true,
      restTargetRemoved: true,
      targetContainsMoved: true,
      targetDayKind: "rest_day",
    },
  ]);
}

function buildDirectMovePersistProof({
  sourceWorkout,
  otherWorkouts,
  targetDate,
  targetWeekNumber,
  review,
}: {
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: PersistedPlannedWorkoutRow[];
  targetDate: string;
  targetWeekNumber: number;
  review: Parameters<NonNullable<MoveDependencies["persistWorkoutMove"]>>[0]["review"];
}): DirectMovePersistProof {
  const movedWorkout = {
    ...sourceWorkout,
    workout_date: review.targetDate,
    weekday: review.targetWeekday,
    week_number: targetWeekNumber,
  };
  const movedRows = [...otherWorkouts, movedWorkout];

  return {
    sourceWorkoutId: sourceWorkout.id,
    sourceDate: sourceWorkout.workout_date,
    targetDate: review.targetDate,
    targetWeekday: review.targetWeekday,
    targetWeekNumber,
    mutationMode: review.mutationMode,
    mutationPayloadVersion: review.mutationPayloadVersion,
    mutationChecksum: review.mutationChecksum,
    trustedClientRows: review.trustedClientRows,
    sourceDateEmpty: movedRows.every(
      (workout) => workout.workout_date !== sourceWorkout.workout_date,
    ),
    targetContainsMoved: movedRows.some(
      (workout) => workout.id === sourceWorkout.id && workout.workout_date === targetDate,
    ),
    metricMode: movedWorkout.metric_mode,
    steps: movedWorkout.steps,
  };
}

function buildFakeRestWorkout({
  userId,
  planCycleId,
  id,
  date,
  title,
}: {
  userId: string;
  planCycleId: string;
  id: string;
  date: string;
  title: string;
}) {
  return buildFakePlannedWorkout({
    userId,
    planCycleId,
    id,
    date,
    displayOrder: 1,
    title,
    workoutType: "rest",
    sourceWorkoutType: "rest",
    workoutFamily: "rest",
    workoutIdentity: "rest_day",
    calendarIconKey: "rest",
  });
}
