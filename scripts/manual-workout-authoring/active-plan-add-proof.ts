import assert from "node:assert/strict";
import {
  ACTIVE_PLAN_USER_EDIT_MUTATION_KIND,
  ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
} from "../../src/lib/active-plan-workout-editing/policy";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  addManualWorkoutToActivePlanForUser,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutDraftInput,
} from "../../src/lib/manual-workout-authoring";
import { assertManualBlockedResult, formatJsonResult } from "./move-proof-assertions";
import {
  assertReady,
  buildFakeAddDependencies,
  buildFakePlanCycle,
  buildFakePlannedWorkout,
  buildFakeWorkoutLog,
  buildReviewConfirmInput,
} from "./move-proof-fixtures";

export async function validateManualActivePlanAddWorkoutContract() {
  const userId = "00000000-0000-4000-8000-000000000202";
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-17",
    notes: "Second reviewed workout.",
  };
  const reviewed = assertReady("manual active-plan add review", input);
  const activePlan = buildFakePlanCycle({
    userId,
    id: "11111111-1111-4111-8111-111111111111",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-16",
    endDate: "2026-06-16",
  });
  const firstWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "22222222-2222-4222-8222-222222222222",
    date: "2026-06-16",
    displayOrder: 0,
  });
  const persistedAdds: Array<{
    workoutDate: string;
    displayOrder: number;
    reviewChecksum: string;
  }> = [];

  const success = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout],
      onPersist: ({ workoutSeed, reviewMetadata }) => {
        persistedAdds.push({
          workoutDate: workoutSeed.workoutDate,
          displayOrder: workoutSeed.displayOrder,
          reviewChecksum: reviewMetadata.review_checksum,
        });
      },
    }),
  );

  assert.equal(success.ok, true, formatJsonResult(success));
  if (success.ok) {
    assert.equal(success.status, "created");
    assert.equal(success.persisted, true);
    assert.equal(success.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(success.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(success.activePlanId, activePlan.id);
    assert.equal(success.workoutDate, input.workoutDate);
    assert.equal(success.calendarRowCount, 2);
    assert.equal(success.nonRestWorkoutCount, 2);
    assert.equal(success.reviewChecksum, reviewed.reviewChecksum);
    assert.equal(success.sourceMetadata.editSourceKind, ACTIVE_PLAN_USER_EDIT_SOURCE_KIND);
    assert.equal(
      success.sourceMetadata.mutationKind,
      ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.addWorkout,
    );
    assert.equal(success.sourceMetadata.originalPlanSourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(success.sourceMetadata.reviewChecksum, reviewed.reviewChecksum);
    assert.equal(success.sourceMetadata.metricTruthMode, "structure_only");
    assert.equal(success.safety.targetDayKind, "rest_day");
    assert.equal(success.safety.trustedClientRows, false);
    assert.equal(success.safety.serverRebuiltReview, true);
  }

  assert.deepEqual(persistedAdds, [
    {
      workoutDate: input.workoutDate,
      displayOrder: 1,
      reviewChecksum: reviewed.reviewChecksum,
    },
  ]);

  const todayInput: ManualWorkoutDraftInput = {
    ...input,
    workoutDate: "2026-06-10",
    notes: "Same-day manual workout on a Rest day.",
  };
  const todayReview = assertReady("today manual active-plan add review", todayInput);
  const todayActivePlan = buildFakePlanCycle({
    userId,
    id: "11111111-1111-4111-8111-111111111112",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-09",
    endDate: "2026-06-09",
  });
  const todayExistingWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: todayActivePlan.id,
    id: "22222222-2222-4222-8222-222222222223",
    date: "2026-06-09",
    displayOrder: 0,
  });
  const todayPersistedAdds: Array<{
    workoutDate: string;
    displayOrder: number;
    reviewChecksum: string;
  }> = [];
  const todaySuccess = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(todayInput, todayReview),
    buildFakeAddDependencies({
      activePlan: todayActivePlan,
      workouts: [todayExistingWorkout],
      onPersist: ({ workoutSeed, reviewMetadata }) => {
        todayPersistedAdds.push({
          workoutDate: workoutSeed.workoutDate,
          displayOrder: workoutSeed.displayOrder,
          reviewChecksum: reviewMetadata.review_checksum,
        });
      },
    }),
  );

  assert.equal(todaySuccess.ok, true, formatJsonResult(todaySuccess));
  if (todaySuccess.ok) {
    assert.equal(todaySuccess.status, "created");
    assert.equal(todaySuccess.workoutDate, todayInput.workoutDate);
    assert.equal(todaySuccess.calendarRowCount, 2);
    assert.equal(todaySuccess.nonRestWorkoutCount, 2);
    assert.equal(todaySuccess.sourceMetadata.workoutDate, todayInput.workoutDate);
    assert.equal(todaySuccess.safety.targetDayKind, "rest_day");
    assert.equal(todaySuccess.safety.trustedClientRows, false);
    assert.equal(todaySuccess.safety.serverRebuiltReview, true);
  }
  assert.deepEqual(todayPersistedAdds, [
    {
      workoutDate: todayInput.workoutDate,
      displayOrder: 1,
      reviewChecksum: todayReview.reviewChecksum,
    },
  ]);

  const changedDate = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput({ ...input, workoutDate: "2026-06-18" }, reviewed),
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(changedDate, "stale_review", "changed add-workout date");

  const invalidToken = await addManualWorkoutToActivePlanForUser(
    userId,
    {
      ...buildReviewConfirmInput(input, reviewed),
      reviewToken: `${reviewed.reviewToken.slice(0, -1)}${
        reviewed.reviewToken.endsWith("0") ? "1" : "0"
      }`,
    },
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(invalidToken, "invalid_review", "invalid add-workout token");

  const clientRowsAttempt = await addManualWorkoutToActivePlanForUser(
    userId,
    {
      ...buildReviewConfirmInput(input, reviewed),
      plannedWorkout: { workoutDate: "2026-06-19", title: "Trust me" },
    },
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(clientRowsAttempt, "invalid_review", "client-sent add row");

  const noActivePlan = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeAddDependencies({ activePlan: null, workouts: [] }),
  );
  assertAddBlocked(noActivePlan, "no_active_plan", "missing active plan");

  const presetPlan = buildFakePlanCycle({
    userId,
    id: "33333333-3333-4333-8333-333333333333",
    sourceKind: "ai_authored_plan_first_v1",
    startDate: "2026-06-16",
    endDate: "2026-06-16",
  });
  const presetAdd = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeAddDependencies({ activePlan: presetPlan, workouts: [firstWorkout] }),
  );
  assert.equal(presetAdd.ok, true, formatJsonResult(presetAdd));
  if (presetAdd.ok) {
    assert.equal(presetAdd.sourceKind, "ai_authored_plan_first_v1");
    assert.equal(presetAdd.sourceMetadata.editSourceKind, ACTIVE_PLAN_USER_EDIT_SOURCE_KIND);
    assert.equal(presetAdd.sourceMetadata.originalPlanSourceKind, "ai_authored_plan_first_v1");
    assert.equal(
      presetAdd.sourceMetadata.mutationKind,
      ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.addWorkout,
    );
  }

  const unsupportedSource = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan: buildFakePlanCycle({
        userId,
        id: "33333333-3333-4333-8333-333333333334",
        sourceKind: "legacy_unreviewed_plan_v0",
        startDate: "2026-06-16",
        endDate: "2026-06-16",
      }),
      workouts: [firstWorkout],
    }),
  );
  assertAddBlocked(
    unsupportedSource,
    "unsupported_active_plan_source",
    "unsupported active-plan source",
  );

  const occupiedWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "44444444-4444-4444-8444-444444444444",
    date: input.workoutDate,
    displayOrder: 1,
  });
  const occupiedDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout, occupiedWorkout] }),
  );
  assertAddBlocked(occupiedDay, "occupied_day", "occupied add-workout day");

  const protectedLoggedDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout, occupiedWorkout],
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
  assertAddBlocked(protectedLoggedDay, "protected_day", "logged add-workout day");

  const protectedEvidenceDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout, occupiedWorkout],
      evidenceWorkoutIds: new Set([occupiedWorkout.id]),
    }),
  );
  assertAddBlocked(protectedEvidenceDay, "protected_day", "evidence add-workout day");

  const pastDateReview = assertReady("past add-workout review", {
    ...input,
    workoutDate: "2026-06-09",
  });
  const protectedPastDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput({ ...input, workoutDate: "2026-06-09" }, pastDateReview),
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(protectedPastDay, "protected_day", "past add-workout day");

  const activePlanMismatch = await addManualWorkoutToActivePlanForUser(
    userId,
    {
      activePlanId: "55555555-5555-4555-8555-555555555555",
      ...buildReviewConfirmInput(input, reviewed),
    },
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(activePlanMismatch, "stale_review", "active plan mismatch");

  const persistenceFailure = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout],
      persistError: new Error("simulated add failure"),
    }),
  );
  assertAddBlocked(persistenceFailure, "persistence_failed", "add-workout persistence failure");
}

function assertAddBlocked(
  result: ManualWorkoutAddToActivePlanResult,
  reason: Extract<ManualWorkoutAddToActivePlanResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}
