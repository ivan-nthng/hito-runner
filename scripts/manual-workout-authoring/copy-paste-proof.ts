import assert from "node:assert/strict";
import type { PersistedPlannedWorkoutRow } from "../../src/lib/active-plan-persistence";
import {
  confirmManualWorkoutCopyPasteDraftForUser,
  copyManualWorkoutWithinActivePlanForUser,
  reviewManualWorkoutCopyPasteDraftForUser,
  type ManualWorkoutCopyPasteConfirmResult,
  type ManualWorkoutCopyPasteReviewResult,
  type ManualWorkoutDirectCopyResult,
  type ManualWorkoutDraftInput,
} from "../../src/lib/manual-workout-authoring";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "../../src/lib/manual-workout-authoring/schema";
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
  buildFakeAddDependencies,
  buildFakePlanCycle,
  buildFakePlannedWorkout,
  buildFakePlannedWorkoutFromReview,
  buildFakeWorkoutLog,
} from "./move-proof-fixtures";

export async function validateManualCopyPasteContract() {
  const userId = "00000000-0000-4000-8000-000000000401";
  const activePlan = buildFakePlanCycle({
    userId,
    id: "99999999-9999-4999-8999-000000000401",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-18",
    endDate: "2026-06-18",
  });
  const sourceInput: ManualWorkoutDraftInput = {
    templateKey: "easy_run_with_strides",
    workoutDate: "2026-06-18",
    title: "Reusable strides",
    notes: "Copy this structure later.",
  };
  const sourceReview = assertReady("copy/paste source review", sourceInput);
  const sourceWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000402",
    review: sourceReview,
  });
  assertCanonicalPersistedStridesShape(
    sourceWorkout.steps,
    "copy/paste canonical persisted source",
  );
  const targetDate = "2026-06-19";
  const copyReview = await reviewManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout] }),
  );

  assert.equal(copyReview.ok, true, formatJsonResult(copyReview));
  if (copyReview.ok) {
    assert.equal(copyReview.persisted, false);
    assert.equal(copyReview.activePlanId, activePlan.id);
    assert.equal(copyReview.sourceWorkoutId, sourceWorkout.id);
    assert.equal(copyReview.sourceWorkoutDate, sourceInput.workoutDate);
    assert.equal(copyReview.targetDate, targetDate);
    assert.equal(copyReview.draftInput.workoutDate, targetDate);
    assert.equal(copyReview.draftInput.templateKey, sourceInput.templateKey);
    assert.equal(copyReview.review.draft.workoutDate, targetDate);
    assert.equal(copyReview.review.draft.weekday, "Friday");
    assert.notEqual(copyReview.review.draft.weekday, sourceWorkout.weekday);
    assert.equal(copyReview.review.draft.title, sourceInput.title);
    assert.equal(copyReview.review.draft.workoutIdentity, sourceReview.draft.workoutIdentity);
    assertRepeatWithRecovery(copyReview.review.draft.steps, "copy/paste review");
    assertNoFakePaceOrHr(copyReview.review.draft.steps, "copy/paste review");
    assert.equal(copyReview.safety.reconstructedFromPersistedWorkout, true);
    assert.equal(copyReview.safety.trustedClientRows, false);
    assert.equal(copyReview.safety.targetDateDerivedServerSide, true);
  }

  const sourceDateReview = await reviewManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-22",
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout] }),
  );
  assert.equal(sourceDateReview.ok, true, formatJsonResult(sourceDateReview));

  const persistedPastes: Array<{
    workoutDate: string;
    displayOrder: number;
    reviewChecksum: string;
    workoutIdentity: string;
  }> = [];
  const success = await confirmManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      ...(copyReview.ok
        ? {
            reviewToken: copyReview.review.reviewToken,
            reviewChecksum: copyReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeAddDependencies({
      activePlan,
      workouts: [sourceWorkout],
      onPersist: ({ workoutSeed, reviewMetadata }) => {
        persistedPastes.push({
          workoutDate: workoutSeed.workoutDate,
          displayOrder: workoutSeed.displayOrder,
          reviewChecksum: reviewMetadata.review_checksum,
          workoutIdentity: workoutSeed.workoutIdentity,
        });
      },
    }),
  );

  assert.equal(success.ok, true, formatJsonResult(success));
  if (success.ok) {
    assert.equal(success.persisted, true);
    assert.equal(success.activePlanId, activePlan.id);
    assert.equal(success.sourceWorkoutId, sourceWorkout.id);
    assert.equal(success.sourceWorkoutDate, sourceInput.workoutDate);
    assert.equal(success.targetDate, targetDate);
    assert.equal(success.workoutDate, targetDate);
    assert.equal(success.templateKey, sourceInput.templateKey);
    assert.equal(success.safety.targetDayKind, "rest_day");
    assert.equal(success.safety.trustedClientRows, false);
    assert.equal(success.safety.serverRebuiltReview, true);
    assert.equal(success.safety.sourceWorkoutVerified, true);
    assert.equal(success.safety.reconstructedFromPersistedWorkout, true);
  }

  assert.deepEqual(persistedPastes, [
    {
      workoutDate: targetDate,
      displayOrder: 1,
      reviewChecksum: copyReview.ok ? copyReview.review.reviewChecksum : "",
      workoutIdentity: sourceReview.draft.workoutIdentity,
    },
  ]);

  const changedTarget = await confirmManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate: "2026-06-22",
      ...(copyReview.ok
        ? {
            reviewToken: copyReview.review.reviewToken,
            reviewChecksum: copyReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout] }),
  );
  assertCopyPasteBlocked(changedTarget, "stale_review", "changed copy/paste target date");

  const otherSourceReview = assertReady("copy/paste changed source review", {
    templateKey: "steady_aerobic_run",
    workoutDate: "2026-06-20",
  });
  const otherSourceWorkout = buildFakePlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000403",
    date: "2026-06-20",
    displayOrder: 1,
    review: otherSourceReview,
    weekday: "Saturday",
  });
  const changedSource = await confirmManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: otherSourceWorkout.id,
      targetDate,
      ...(copyReview.ok
        ? {
            reviewToken: copyReview.review.reviewToken,
            reviewChecksum: copyReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout, otherSourceWorkout] }),
  );
  assertCopyPasteBlocked(changedSource, "stale_review", "changed copy/paste source workout");

  const invalidToken = await confirmManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      reviewToken: copyReview.ok
        ? `${copyReview.review.reviewToken.slice(0, -1)}${
            copyReview.review.reviewToken.endsWith("0") ? "1" : "0"
          }`
        : "invalid-token",
      reviewChecksum: copyReview.ok ? copyReview.review.reviewChecksum : "0".repeat(64),
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout] }),
  );
  assertCopyPasteBlocked(invalidToken, "invalid_review", "invalid copy/paste token");

  const staleChecksum = await confirmManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      reviewToken: copyReview.ok ? copyReview.review.reviewToken : "invalid-token",
      reviewChecksum: "0".repeat(64),
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout] }),
  );
  assertCopyPasteBlocked(staleChecksum, "stale_review", "stale copy/paste checksum");

  const occupiedWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000404",
    date: targetDate,
    displayOrder: 2,
  });
  const occupiedTarget = await confirmManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      ...(copyReview.ok
        ? {
            reviewToken: copyReview.review.reviewToken,
            reviewChecksum: copyReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout, occupiedWorkout] }),
  );
  assertCopyPasteBlocked(occupiedTarget, "occupied_day", "occupied copy/paste target");

  const nonManualPlan = await reviewManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
    },
    buildFakeAddDependencies({
      activePlan: buildFakePlanCycle({
        userId,
        id: activePlan.id,
        sourceKind: "ai_first_plan_blueprint_v1",
        startDate: "2026-06-18",
        endDate: "2026-06-18",
      }),
      workouts: [sourceWorkout],
    }),
  );
  assertCopyReviewBlocked(
    nonManualPlan,
    "unsupported_active_plan_source",
    "non-manual copy/paste source plan",
  );

  const foreignSourceWorkout = buildFakePlannedWorkoutFromReview({
    userId: "00000000-0000-4000-8000-000000000499",
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000405",
    date: "2026-06-21",
    displayOrder: 3,
    review: sourceReview,
  });
  const foreignSource = await reviewManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: foreignSourceWorkout.id,
      targetDate,
    },
    buildFakeAddDependencies({ activePlan, workouts: [foreignSourceWorkout] }),
  );
  assertCopyReviewBlocked(
    foreignSource,
    "source_workout_not_in_active_plan",
    "foreign copy/paste source workout",
  );

  const clientRowsAttempt = await confirmManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      targetDate,
      ...(copyReview.ok
        ? {
            reviewToken: copyReview.review.reviewToken,
            reviewChecksum: copyReview.review.reviewChecksum,
          }
        : {}),
      plannedWorkout: { workoutDate: targetDate, steps: [] },
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout] }),
  );
  assertCopyPasteBlocked(clientRowsAttempt, "invalid_review", "client-sent copy/paste row");

  const unsupportedSource = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000406",
    date: "2026-06-23",
    displayOrder: 4,
    sourceWorkoutType: "legacy_easy",
    workoutFamily: "unknown",
    workoutIdentity: "legacy_easy",
    steps: sourceWorkout.steps,
  });
  const unsupported = await reviewManualWorkoutCopyPasteDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: unsupportedSource.id,
      targetDate,
    },
    buildFakeAddDependencies({ activePlan, workouts: [unsupportedSource] }),
  );
  assertCopyReviewBlocked(
    unsupported,
    "source_workout_not_supported",
    "unsupported copy/paste source payload",
  );

  const directPersistedCopies: Array<{
    workoutDate: string;
    mutationKind?: string;
    mutationMode?: string;
    mutationPayloadVersion?: string;
    mutationChecksum?: string;
    sourceWorkoutId?: string;
    sourceWorkoutDate?: string;
    trustedClientRows?: boolean;
  }> = [];
  const directCopy = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-24",
    },
    buildFakeAddDependencies({
      activePlan,
      workouts: [sourceWorkout],
      onPersist: ({ workoutSeed, reviewMetadata }) => {
        directPersistedCopies.push({
          workoutDate: workoutSeed.workoutDate,
          mutationKind: reviewMetadata.user_edit_mutation_kind,
          mutationMode: reviewMetadata.user_edit_mutation_mode,
          mutationPayloadVersion: reviewMetadata.user_edit_mutation_payload_version,
          mutationChecksum: reviewMetadata.user_edit_mutation_checksum,
          sourceWorkoutId: reviewMetadata.user_edit_source_workout_id,
          sourceWorkoutDate: reviewMetadata.user_edit_source_workout_date,
          trustedClientRows: reviewMetadata.user_edit_trusted_client_rows,
        });
      },
    }),
  );

  assert.equal(directCopy.ok, true, formatJsonResult(directCopy));
  if (directCopy.ok) {
    assert.equal(directCopy.status, "copied");
    assert.equal(directCopy.persisted, true);
    assert.equal(directCopy.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(directCopy.activePlanId, activePlan.id);
    assert.equal(directCopy.sourceWorkoutId, sourceWorkout.id);
    assert.equal(directCopy.sourceWorkoutDate, sourceWorkout.workout_date);
    assert.equal(directCopy.targetDate, "2026-06-24");
    assert.equal(directCopy.targetWeekday, "Wednesday");
    assert.equal(directCopy.targetWorkoutId, "66666666-6666-4666-8666-666666666666");
    assert.equal(directCopy.mutationMode, "direct_manual_edit");
    assert.equal(directCopy.mutationPayloadVersion, "manual_workout_direct_copy_v1");
    assert.equal(directCopy.mutationChecksum.length, 64);
    assert.equal(directCopy.sourceMetadata.editSourceKind, "active_plan_user_edit_v1");
    assert.equal(directCopy.sourceMetadata.mutationKind, "user_copied_workout");
    assert.equal(directCopy.sourceMetadata.mutationMode, "direct_manual_edit");
    assert.equal(directCopy.sourceMetadata.sourceWorkoutId, sourceWorkout.id);
    assert.equal(directCopy.sourceMetadata.sourceWorkoutDate, sourceWorkout.workout_date);
    assert.equal(directCopy.sourceMetadata.targetWorkoutId, directCopy.targetWorkoutId);
    assert.equal(directCopy.safety.requiresExplicitConfirm, false);
    assert.equal(directCopy.safety.directMutation, true);
    assert.equal(directCopy.safety.targetDayKind, "rest_day");
    assert.equal(directCopy.safety.trustedClientRows, false);
    assert.equal(directCopy.safety.serverRebuiltReview, true);
  }
  assert.deepEqual(directPersistedCopies, [
    {
      workoutDate: "2026-06-24",
      mutationKind: "user_copied_workout",
      mutationMode: "direct_manual_edit",
      mutationPayloadVersion: "manual_workout_direct_copy_v1",
      mutationChecksum: directCopy.ok ? directCopy.mutationChecksum : "",
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      trustedClientRows: false,
    },
  ]);

  const directChangedSourceDate = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: "2026-06-17",
      targetDate: "2026-06-24",
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout] }),
  );
  assertDirectCopyBlocked(
    directChangedSourceDate,
    "source_date_changed",
    "direct copy stale source date",
  );

  const directClientRowsAttempt = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-24",
      plannedWorkout: { workoutDate: "2026-06-24", steps: [] },
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout] }),
  );
  assertDirectCopyBlocked(
    directClientRowsAttempt,
    "client_payload_rejected",
    "direct copy client payload",
  );

  const directOccupiedTarget = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate,
    },
    buildFakeAddDependencies({ activePlan, workouts: [sourceWorkout, occupiedWorkout] }),
  );
  assertDirectCopyBlocked(directOccupiedTarget, "occupied_day", "direct copy occupied target");

  const directNonManualPlan = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-24",
    },
    buildFakeAddDependencies({
      activePlan: buildFakePlanCycle({
        userId,
        id: activePlan.id,
        sourceKind: "ai_first_plan_blueprint_v1",
        startDate: "2026-06-18",
        endDate: "2026-06-18",
      }),
      workouts: [sourceWorkout],
    }),
  );
  assertDirectCopyBlocked(
    directNonManualPlan,
    "unsupported_active_plan_source",
    "direct copy non-manual plan",
  );

  const directLoggedSource = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-24",
    },
    buildFakeAddDependencies({
      activePlan,
      workouts: [sourceWorkout],
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
  assertDirectCopyBlocked(directLoggedSource, "protected_day", "direct copy logged source");

  const directEvidenceSource = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-24",
    },
    buildFakeAddDependencies({
      activePlan,
      workouts: [sourceWorkout],
      evidenceWorkoutIds: new Set([sourceWorkout.id]),
    }),
  );
  assertDirectCopyBlocked(directEvidenceSource, "protected_day", "direct copy evidence source");

  const unsafeMetricSource = {
    ...sourceWorkout,
    id: "99999999-9999-4999-8999-000000000407",
    workout_date: "2026-06-25",
    steps: [
      {
        label: "Unsafe fake pace",
        target: { pace: "4:30/km" },
      },
    ] as PersistedPlannedWorkoutRow["steps"],
  };
  const directUnsafeMetricSource = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: activePlan.id,
      sourceWorkoutId: unsafeMetricSource.id,
      sourceWorkoutDate: unsafeMetricSource.workout_date,
      targetDate: "2026-06-26",
    },
    buildFakeAddDependencies({ activePlan, workouts: [unsafeMetricSource] }),
  );
  assertDirectCopyBlocked(
    directUnsafeMetricSource,
    "source_workout_not_supported",
    "direct copy unsafe metric source",
  );
}

function assertCopyReviewBlocked(
  result: ManualWorkoutCopyPasteReviewResult,
  reason: Extract<ManualWorkoutCopyPasteReviewResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}

function assertCopyPasteBlocked(
  result: ManualWorkoutCopyPasteConfirmResult,
  reason: Extract<ManualWorkoutCopyPasteConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}

function assertDirectCopyBlocked(
  result: ManualWorkoutDirectCopyResult,
  reason: Extract<ManualWorkoutDirectCopyResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}

function assertCanonicalPersistedStridesShape(
  steps: PersistedPlannedWorkoutRow["steps"],
  label: string,
) {
  assert.ok(Array.isArray(steps), `${label} should store persisted executable steps.`);
  const repeatStep = steps.find(
    (step): step is Step =>
      Boolean(step) &&
      typeof step === "object" &&
      "segment_type" in step &&
      step.segment_type === "strides",
  );

  assert.equal(repeatStep?.segment_type, "strides");
  assert.equal(
    repeatStep?.type,
    "intervals",
    `${label} should preserve canonical imported strides repeat type.`,
  );
  const children = repeatStep ? repeatChildrenForProof(repeatStep) : [];
  assert.equal(
    children[0]?.type,
    "work",
    `${label} persisted strides first child should use canonical work type.`,
  );
  assert.equal(
    children[1]?.type,
    "recovery",
    `${label} persisted strides second child should stay canonical recovery.`,
  );
}

function repeatChildrenForProof(step: Step): Step[] {
  if (step.children?.length) {
    return step.children;
  }

  return [];
}
