import assert from "node:assert/strict";
import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
} from "../../src/lib/runner-calendar-mutations";
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

export async function validateStandaloneManualCalendarAddContract() {
  const userId = "00000000-0000-4000-8000-000000000202";
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-17",
    notes: "Second reviewed workout.",
  };
  const reviewed = assertReady("standalone manual Calendar add review", input);
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
    {
      document: reviewed.document,
      candidateId: reviewed.candidate.candidateId,
      reviewToken: reviewed.reviewToken,
      reviewChecksum: reviewed.reviewChecksum,
    },
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
    assert.equal(success.sourceKind, "manual");
    assert.equal(success.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(success.activePlanId, null);
    assert.equal(success.workoutDate, input.workoutDate);
    assert.equal(success.calendarRowCount, 2);
    assert.equal(success.nonRestWorkoutCount, 2);
    assert.equal(success.reviewChecksum, reviewed.reviewChecksum);
    assert.equal(success.sourceMetadata.editSourceKind, CALENDAR_WORKOUT_MUTATION_SOURCE_KIND);
    assert.equal(success.sourceMetadata.mutationKind, CALENDAR_WORKOUT_MUTATION_KIND.addWorkout);
    assert.equal(success.sourceMetadata.originalPlanSourceKind, "manual");
    assert.equal(success.sourceMetadata.reviewChecksum, reviewed.reviewChecksum);
    assert.equal(success.sourceMetadata.metricTruthMode, "structure_only");
    assert.equal(success.safety.targetDayKind, "empty_day");
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

  const restInput: ManualWorkoutDraftInput = {
    templateKey: "rest_day",
    workoutDate: "2026-06-18",
  };
  const restReview = assertReady("standalone manual Rest add review", restInput);
  const persistedRestAdds: Array<{
    workoutType: string;
    workoutDate: string;
    stepCount: number;
    executableMode: unknown;
  }> = [];
  const restSuccess = await addManualWorkoutToActivePlanForUser(
    userId,
    buildReviewConfirmInput(restInput, restReview),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout],
      plannedWorkoutId: "66666666-6666-4666-8666-666666666667",
      onPersist: ({ workoutSeed }) => {
        persistedRestAdds.push({
          workoutType: workoutSeed.workoutType,
          workoutDate: workoutSeed.workoutDate,
          stepCount: workoutSeed.steps.length,
          executableMode: workoutSeed.metricMode.executable_mode,
        });
      },
    }),
  );

  assert.equal(restSuccess.ok, true, formatJsonResult(restSuccess));
  if (restSuccess.ok) {
    assert.equal(restSuccess.status, "created");
    assert.equal(restSuccess.workoutDate, restInput.workoutDate);
    assert.equal(restSuccess.calendarRowCount, 2);
    assert.equal(restSuccess.nonRestWorkoutCount, 1);
    assert.equal(restSuccess.sourceMetadata.metricTruthMode, "none");
    assert.equal(restSuccess.safety.targetDayKind, "empty_day");
    assert.equal(restSuccess.safety.trustedClientRows, false);
    assert.equal(restSuccess.safety.serverRebuiltReview, true);
  }
  assert.deepEqual(persistedRestAdds, [
    {
      workoutType: "rest",
      workoutDate: restInput.workoutDate,
      stepCount: 0,
      executableMode: "none",
    },
  ]);

  const todayInput: ManualWorkoutDraftInput = {
    ...input,
    workoutDate: "2026-06-10",
    notes: "Same-day manual workout on a Rest day.",
  };
  const todayReview = assertReady("today standalone Calendar add review", todayInput);
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
    assert.equal(todaySuccess.safety.targetDayKind, "empty_day");
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
  assert.equal(noActivePlan.ok, true, "direct manual Add must not require a plan container");
  if (noActivePlan.ok) {
    assert.equal(noActivePlan.activePlanId, null);
    assert.equal(noActivePlan.sourceKind, "manual");
    assert.equal(noActivePlan.calendarRowCount, 1);
  }

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
    assert.equal(presetAdd.sourceKind, "manual");
    assert.equal(presetAdd.sourceMetadata.editSourceKind, CALENDAR_WORKOUT_MUTATION_SOURCE_KIND);
    assert.equal(presetAdd.sourceMetadata.originalPlanSourceKind, "manual");
    assert.equal(presetAdd.sourceMetadata.mutationKind, CALENDAR_WORKOUT_MUTATION_KIND.addWorkout);
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
  assert.equal(
    unsupportedSource.ok,
    true,
    "saved-plan origin must not govern a materialized workout add",
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

  const staleProvenanceHint = await addManualWorkoutToActivePlanForUser(
    userId,
    {
      activePlanId: "55555555-5555-4555-8555-555555555555",
      ...buildReviewConfirmInput(input, reviewed),
    },
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assert.equal(
    staleProvenanceHint.ok,
    true,
    "A client-provided legacy plan id must not govern runner-owned Calendar mutation.",
  );
  if (staleProvenanceHint.ok) {
    assert.equal(staleProvenanceHint.activePlanId, null);
  }

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
