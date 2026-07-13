import assert from "node:assert/strict";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/active-plan-persistence";
import {
  confirmManualWorkoutDeleteClearForUser,
  reviewManualWorkoutDeleteClearForUser,
  type ManualWorkoutDeleteClearConfirmResult,
  type ManualWorkoutDeleteClearReviewResult,
  type ManualWorkoutDraftInput,
} from "../../src/lib/manual-workout-authoring";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
} from "../../src/lib/manual-workout-authoring/schema";
import type { Step } from "../../src/lib/training";
import {
  assertManualBlockedResult,
  assertNoFakePaceOrHr,
  assertRepeatWithRecovery,
  formatJsonResult,
} from "./move-proof-assertions";
import {
  assertReady,
  buildCanonicalPersistedPlannedWorkoutFromReview,
  buildFakeActivePlanMutationDependencyBase,
  buildFakePlanCycle,
  buildFakePlannedWorkout,
  buildFakeWorkoutLog,
  cloneJson,
} from "./move-proof-fixtures";

type DeleteDependencies = NonNullable<Parameters<typeof reviewManualWorkoutDeleteClearForUser>[2]>;

export async function validateManualDeleteClearContract() {
  const userId = "00000000-0000-4000-8000-000000000501";
  const activePlan = buildFakePlanCycle({
    userId,
    id: "99999999-9999-4999-8999-000000000501",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-18",
    endDate: "2026-06-21",
  });
  const targetInput: ManualWorkoutDraftInput = {
    templateKey: "easy_run_with_strides",
    workoutDate: "2026-06-18",
    title: "Delete candidate strides",
    notes: "This is safe to remove and restore.",
  };
  const targetReview = assertReady("delete/clear target review", targetInput);
  const targetWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000502",
    review: targetReview,
  });
  const keptReview = assertReady("delete/clear kept review", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-21",
    title: "Keep this easy run",
  });
  const keptWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000503",
    review: keptReview,
  });
  const review = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [targetWorkout, keptWorkout] }),
  );

  assert.equal(review.ok, true, formatJsonResult(review));
  if (review.ok) {
    assert.equal(review.status, "review_ready");
    assert.equal(review.persisted, false);
    assert.equal(review.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(review.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(review.activePlanId, activePlan.id);
    assert.equal(review.plannedWorkoutId, targetWorkout.id);
    assert.equal(review.workoutDate, targetInput.workoutDate);
    assert.equal(review.templateKey, targetInput.templateKey);
    assert.equal(review.review.reviewToken.startsWith("manual-workout-delete-review-v1."), true);
    assert.equal(review.review.reviewChecksum.length, 64);
    assert.equal(review.restore.available, true);
    assert.equal(review.restore.label, "Restore");
    assert.deepEqual(review.restore.alternateLabels, ["Put back", "Redo"]);
    assert.equal(review.restore.draftInput.workoutDate, targetWorkout.workout_date);
    assert.equal(review.restore.draftInput.title, targetInput.title);
    assert.equal(review.restore.review.draft.workoutDate, targetWorkout.workout_date);
    assert.equal(review.restore.review.draft.title, targetInput.title);
    assert.equal(review.restore.safety.reviewedThroughManualAuthoring, true);
    assert.equal(review.restore.safety.trustedClientRows, false);
    assert.equal(review.restore.safety.targetDateDerivedServerSide, true);
    assertRepeatWithRecovery(review.restore.review.draft.steps, "delete restore review");
    assertNoFakePaceOrHr(review.restore.review.draft.steps, "delete restore review");
    assert.equal(review.safety.trustedClientRows, false);
    assert.equal(review.safety.lastWorkoutDeleteAllowed, true);
  }

  const overlongPersistedGuidance = "Stay steady and controlled without chasing pace. ".repeat(15);
  const overlongPersistedHint = "Use the numeric duration as the target. ".repeat(8);
  const boundedRestoreReview = assertReady("delete/clear bounded restore source review", {
    templateKey: "steady_aerobic_run",
    workoutDate: "2026-06-20",
    title: "QA export steady structure",
  });
  const boundedRestoreTarget = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000508",
    review: boundedRestoreReview,
  });
  const boundedRestoreSteps = (cloneJson(boundedRestoreTarget.steps) as Step[]).map((step) =>
    step.segment_type === "main"
      ? {
          ...step,
          guidance: overlongPersistedGuidance,
          target: {
            ...(step.target ?? {}),
            hint: overlongPersistedHint,
          },
        }
      : step,
  );
  const boundedRestoreTargetWithRichCopy: PersistedPlannedWorkoutRow = {
    ...boundedRestoreTarget,
    steps: boundedRestoreSteps as PersistedPlannedWorkoutRow["steps"],
  };
  const boundedRestore = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: boundedRestoreTargetWithRichCopy.id,
    },
    buildFakeDeleteDependencies({
      activePlan,
      workouts: [boundedRestoreTargetWithRichCopy, keptWorkout],
    }),
  );

  assert.equal(boundedRestore.ok, true, formatJsonResult(boundedRestore));
  if (boundedRestore.ok) {
    const steadyEntry = boundedRestore.restore.draftInput.entries?.find(
      (entry) => entry.kind === "block" && entry.block.blockKey === "steady_run_block",
    );

    assert.equal(steadyEntry?.kind, "block");
    if (steadyEntry?.kind === "block") {
      assert.equal(steadyEntry.block.noteText?.length, 500);
      assert.equal(steadyEntry.block.target?.hint?.length, 200);
    }

    assert.equal(boundedRestore.restore.review.status, "draft_ready");
    assert.equal(boundedRestore.restore.review.draft.title, "QA export steady structure");
    assertNoFakePaceOrHr(boundedRestore.restore.review.draft.steps, "bounded delete restore");
  }

  const persistedDeletes: Array<{
    targetWorkoutId: string;
    remainingWorkoutIds: string[];
    reviewChecksum: string;
  }> = [];
  const success = await confirmManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
      ...(review.ok
        ? {
            reviewToken: review.review.reviewToken,
            reviewChecksum: review.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeDeleteDependencies({
      activePlan,
      workouts: [targetWorkout, keptWorkout],
      onPersist: ({
        targetWorkout: persistedTarget,
        remainingWorkouts,
        review: persistedReview,
      }) => {
        persistedDeletes.push({
          targetWorkoutId: persistedTarget.id,
          remainingWorkoutIds: remainingWorkouts.map((workout) => workout.id),
          reviewChecksum: persistedReview.reviewChecksum,
        });
      },
    }),
  );

  assert.equal(success.ok, true, formatJsonResult(success));
  if (success.ok) {
    assert.equal(success.status, "deleted");
    assert.equal(success.persisted, true);
    assert.equal(success.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(success.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
    assert.equal(success.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(success.activePlanId, activePlan.id);
    assert.equal(success.plannedWorkoutId, targetWorkout.id);
    assert.equal(success.workoutDate, targetWorkout.workout_date);
    assert.equal(success.calendarRowCount, 1);
    assert.equal(success.nonRestWorkoutCount, 1);
    assert.equal(success.restore.label, "Restore");
    assert.equal(success.restore.available, true);
    if (success.restore.available) {
      assert.equal(success.restore.review.draft.workoutDate, targetWorkout.workout_date);
    }
    assert.equal(success.safety.deletedExactlyOneRow, true);
    assert.equal(success.safety.activePlanRemainsActive, true);
    assert.equal(success.safety.serverRebuiltReview, true);
    assert.equal(success.safety.trustedClientRows, false);
  }

  assert.deepEqual(persistedDeletes, [
    {
      targetWorkoutId: targetWorkout.id,
      remainingWorkoutIds: [keptWorkout.id],
      reviewChecksum: review.ok ? review.review.reviewChecksum : "",
    },
  ]);

  const changedTarget = await confirmManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: keptWorkout.id,
      ...(review.ok
        ? {
            reviewToken: review.review.reviewToken,
            reviewChecksum: review.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [targetWorkout, keptWorkout] }),
  );
  assertDeleteConfirmBlocked(changedTarget, "stale_review", "changed delete target workout");

  const invalidToken = await confirmManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
      reviewToken: review.ok
        ? `${review.review.reviewToken.slice(0, -1)}${
            review.review.reviewToken.endsWith("0") ? "1" : "0"
          }`
        : "invalid-token",
      reviewChecksum: review.ok ? review.review.reviewChecksum : "0".repeat(64),
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [targetWorkout, keptWorkout] }),
  );
  assertDeleteConfirmBlocked(invalidToken, "invalid_review", "invalid delete token");

  const staleChecksum = await confirmManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
      reviewToken: review.ok ? review.review.reviewToken : "invalid-token",
      reviewChecksum: "0".repeat(64),
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [targetWorkout, keptWorkout] }),
  );
  assertDeleteConfirmBlocked(staleChecksum, "stale_review", "stale delete checksum");

  const clientRowsAttempt = await confirmManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
      ...(review.ok
        ? {
            reviewToken: review.review.reviewToken,
            reviewChecksum: review.review.reviewChecksum,
          }
        : {}),
      plannedWorkout: { workoutDate: targetWorkout.workout_date, steps: [] },
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [targetWorkout, keptWorkout] }),
  );
  assertDeleteConfirmBlocked(clientRowsAttempt, "invalid_review", "client-sent delete row");

  const presetPlan = buildFakePlanCycle({
    userId,
    id: activePlan.id,
    sourceKind: "ai_first_plan_blueprint_v1",
    startDate: "2026-06-18",
    endDate: "2026-06-21",
  });
  const presetReview = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
    },
    buildFakeDeleteDependencies({ activePlan: presetPlan, workouts: [targetWorkout, keptWorkout] }),
  );
  assert.equal(presetReview.ok, true, formatJsonResult(presetReview));
  if (presetReview.ok) {
    assert.equal(presetReview.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(presetReview.restore.available, true);
    assert.deepEqual(presetReview.restore.alternateLabels, ["Put back", "Redo"]);
  }

  const presetConfirm = await confirmManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
      ...(presetReview.ok
        ? {
            reviewToken: presetReview.review.reviewToken,
            reviewChecksum: presetReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeDeleteDependencies({ activePlan: presetPlan, workouts: [targetWorkout, keptWorkout] }),
  );
  assert.equal(presetConfirm.ok, true, formatJsonResult(presetConfirm));
  if (presetConfirm.ok) {
    assert.equal(presetConfirm.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(presetConfirm.sourceStatus, null);
    assert.equal(presetConfirm.safety.deletedExactlyOneRow, true);
  }

  const selectedPlan = buildFakePlanCycle({
    userId,
    id: activePlan.id,
    sourceKind: "ai_first_plan_blueprint_v1",
    startDate: "2026-06-18",
    endDate: "2026-06-21",
  });
  const selectedGeneratedTarget = buildFakePlannedWorkout({
    userId,
    planCycleId: selectedPlan.id,
    id: "99999999-9999-4999-8999-000000000509",
    date: "2026-06-24",
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
  const selectedReview = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: selectedPlan.id,
      plannedWorkoutId: selectedGeneratedTarget.id,
    },
    buildFakeDeleteDependencies({
      activePlan: selectedPlan,
      workouts: [selectedGeneratedTarget, keptWorkout],
    }),
  );
  assert.equal(selectedReview.ok, true, formatJsonResult(selectedReview));
  if (selectedReview.ok) {
    assert.equal(selectedReview.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(selectedReview.templateKey, "selected_plan_easy_run");
    assert.equal(selectedReview.restore.available, false);
    assert.equal(selectedReview.restore.reason, "restore_requires_editor_support");
  }

  const selectedDeletes: Array<{ targetWorkoutId: string; remainingWorkoutIds: string[] }> = [];
  const selectedConfirm = await confirmManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: selectedPlan.id,
      plannedWorkoutId: selectedGeneratedTarget.id,
      ...(selectedReview.ok
        ? {
            reviewToken: selectedReview.review.reviewToken,
            reviewChecksum: selectedReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeDeleteDependencies({
      activePlan: selectedPlan,
      workouts: [selectedGeneratedTarget, keptWorkout],
      onPersist: ({ targetWorkout: persistedTarget, remainingWorkouts }) => {
        selectedDeletes.push({
          targetWorkoutId: persistedTarget.id,
          remainingWorkoutIds: remainingWorkouts.map((workout) => workout.id),
        });
      },
    }),
  );
  assert.equal(selectedConfirm.ok, true, formatJsonResult(selectedConfirm));
  if (selectedConfirm.ok) {
    assert.equal(selectedConfirm.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(selectedConfirm.safety.deletedExactlyOneRow, true);
    assert.equal(selectedConfirm.restore.available, false);
  }
  assert.deepEqual(selectedDeletes, [
    {
      targetWorkoutId: selectedGeneratedTarget.id,
      remainingWorkoutIds: [keptWorkout.id],
    },
  ]);

  const unsupportedSource = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
    },
    buildFakeDeleteDependencies({
      activePlan: buildFakePlanCycle({
        userId,
        id: activePlan.id,
        sourceKind: "legacy_unreviewed_plan_v0",
        startDate: "2026-06-18",
        endDate: "2026-06-21",
      }),
      workouts: [targetWorkout, keptWorkout],
    }),
  );
  assertDeleteReviewBlocked(
    unsupportedSource,
    "unsupported_active_plan_source",
    "unsupported delete plan source",
  );

  const foreignWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId: "00000000-0000-4000-8000-000000000599",
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000504",
    review: targetReview,
  });
  const foreignTarget = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: foreignWorkout.id,
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [foreignWorkout, keptWorkout] }),
  );
  assertDeleteReviewBlocked(
    foreignTarget,
    "target_workout_not_in_active_plan",
    "foreign delete target workout",
  );

  const missingTarget = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: "99999999-9999-4999-8999-000000000505",
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [targetWorkout, keptWorkout] }),
  );
  assertDeleteReviewBlocked(
    missingTarget,
    "target_workout_not_found",
    "missing delete target workout",
  );

  const unsupportedTarget = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000506",
    date: "2026-06-24",
    displayOrder: 2,
    sourceWorkoutType: "legacy_easy",
    steps: targetWorkout.steps,
  });
  const unsupported = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: unsupportedTarget.id,
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [unsupportedTarget, keptWorkout] }),
  );
  assert.equal(unsupported.ok, true, formatJsonResult(unsupported));
  if (unsupported.ok) {
    assert.equal(unsupported.templateKey, "legacy_easy");
    assert.equal(unsupported.restore.available, false);
    assert.equal(unsupported.restore.reason, "restore_requires_editor_support");
  }

  const loggedTarget = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
    },
    buildFakeDeleteDependencies({
      activePlan,
      workouts: [targetWorkout, keptWorkout],
      logsByWorkoutId: new Map([
        [
          targetWorkout.id,
          buildFakeWorkoutLog({
            userId,
            plannedWorkoutId: targetWorkout.id,
          }),
        ],
      ]),
    }),
  );
  assertDeleteReviewBlocked(loggedTarget, "protected_day", "logged delete target");

  const evidenceTarget = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
    },
    buildFakeDeleteDependencies({
      activePlan,
      workouts: [targetWorkout, keptWorkout],
      evidenceWorkoutIds: new Set([targetWorkout.id]),
    }),
  );
  assertDeleteReviewBlocked(evidenceTarget, "protected_day", "evidence delete target");

  const pastReview = assertReady("past delete target review", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-09",
    title: "Past easy run",
  });
  const pastTarget = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000507",
    review: pastReview,
  });
  const pastDeleteReview = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: pastTarget.id,
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [pastTarget, keptWorkout] }),
  );
  assert.equal(pastDeleteReview.ok, true, formatJsonResult(pastDeleteReview));
  if (pastDeleteReview.ok) {
    assert.equal(pastDeleteReview.workoutDate, "2026-06-09");
    assert.equal(pastDeleteReview.restore.available, true);
  }

  const todayReview = assertReady("today delete target review", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-10",
    title: "Today easy run",
  });
  const todayTarget = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000510",
    review: todayReview,
  });
  const todayDeleteReview = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: todayTarget.id,
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [todayTarget, keptWorkout] }),
  );
  assert.equal(todayDeleteReview.ok, true, formatJsonResult(todayDeleteReview));
  if (todayDeleteReview.ok) {
    assert.equal(todayDeleteReview.workoutDate, "2026-06-10");
    assert.equal(todayDeleteReview.restore.available, true);
  }

  const lastWorkout = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [targetWorkout] }),
  );
  assert.equal(lastWorkout.ok, true, formatJsonResult(lastWorkout));
  if (lastWorkout.ok) {
    assert.equal(lastWorkout.plannedWorkoutId, targetWorkout.id);
    assert.equal(lastWorkout.workoutDate, targetWorkout.workout_date);
    assert.equal(lastWorkout.restore.available, true);
  }

  const persistenceFailure = await confirmManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
      ...(review.ok
        ? {
            reviewToken: review.review.reviewToken,
            reviewChecksum: review.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeDeleteDependencies({
      activePlan,
      workouts: [targetWorkout, keptWorkout],
      persistError: new Error("simulated delete failure"),
    }),
  );
  assertDeleteConfirmBlocked(
    persistenceFailure,
    "persistence_failed",
    "delete persistence failure",
  );
}

function buildFakeDeleteDependencies(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  persistError?: Error;
  onPersist?: (
    record: Parameters<NonNullable<DeleteDependencies["persistWorkoutDelete"]>>[0],
  ) => void;
}): DeleteDependencies {
  return {
    ...buildFakeActivePlanMutationDependencyBase(input),
    persistWorkoutDelete: async (record) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.(record);

      return {
        deletedWorkout: record.targetWorkout,
        planCycle: {
          ...record.activePlan,
          end_date:
            record.remainingWorkouts
              .map((workout) => workout.workout_date)
              .sort()
              .at(-1) ?? record.activePlan.start_date,
        },
      };
    },
  };
}

function assertDeleteReviewBlocked(
  result: ManualWorkoutDeleteClearReviewResult,
  reason: Extract<ManualWorkoutDeleteClearReviewResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}

function assertDeleteConfirmBlocked(
  result: ManualWorkoutDeleteClearConfirmResult,
  reason: Extract<ManualWorkoutDeleteClearConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}
