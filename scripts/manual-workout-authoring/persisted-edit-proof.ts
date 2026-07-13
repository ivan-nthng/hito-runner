import assert from "node:assert/strict";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/active-plan-persistence";
import {
  confirmManualWorkoutPersistedEditForUser,
  reconstructManualWorkoutPersistedEditDraftForUser,
  reviewManualWorkoutPersistedEditDraftForUser,
  type ManualWorkoutDraftInput,
  type ManualWorkoutPersistedEditConfirmResult,
  type ManualWorkoutPersistedEditReconstructResult,
  type ManualWorkoutPersistedEditReviewResult,
} from "../../src/lib/manual-workout-authoring";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
} from "../../src/lib/manual-workout-authoring/schema";
import {
  assertManualBlockedResult,
  assertNoFakePaceOrHr,
  formatJsonResult,
  readStepsForAssertion,
} from "./move-proof-assertions";
import {
  assertReady,
  buildCanonicalPersistedPlannedWorkoutFromReview,
  buildFakeActivePlanMutationDependencyBase,
  buildFakePlanCycle,
  buildFakeWorkoutLog,
} from "./move-proof-fixtures";

export async function validateManualPersistedFutureWorkoutEditContract() {
  const userId = "00000000-0000-4000-8000-000000000801";
  const activePlan = buildFakePlanCycle({
    userId,
    id: "99999999-9999-4999-8999-000000000801",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-18",
    endDate: "2026-06-24",
  });
  const sourceReview = assertReady("persisted edit source review", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-18",
    title: "Original easy run",
    notes: "Original future row.",
  });
  const sourceWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000802",
    review: sourceReview,
  });
  const keptReview = assertReady("persisted edit kept review", {
    templateKey: "easy_run_with_strides",
    workoutDate: "2026-06-24",
    title: "Kept strides",
  });
  const keptWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000803",
    review: keptReview,
  });

  const reconstruct = await reconstructManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
    },
    buildFakeEditDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assert.equal(reconstruct.ok, true, formatJsonResult(reconstruct));
  if (reconstruct.ok) {
    assert.equal(reconstruct.status, "draft_reconstructed");
    assert.equal(reconstruct.persisted, false);
    assert.equal(reconstruct.activePlanId, activePlan.id);
    assert.equal(reconstruct.plannedWorkoutId, sourceWorkout.id);
    assert.equal(reconstruct.workoutDate, sourceWorkout.workout_date);
    assert.equal(reconstruct.draftInput.templateKey, sourceReview.draft.templateKey);
    assert.equal(reconstruct.draftInput.workoutDate, sourceWorkout.workout_date);
    assert.equal(reconstruct.safety.reconstructedFromPersistedWorkout, true);
    assert.equal(reconstruct.safety.trustedClientRows, false);
  }

  const editedDraftInput: ManualWorkoutDraftInput = {
    templateKey: "steady_aerobic_run",
    workoutDate: sourceWorkout.workout_date,
    title: "Edited steady aerobic run",
    notes: "Edited from workout detail.",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "steady_run_block",
          durationSeconds: 35 * 60,
          label: "Edited steady aerobic running",
        },
      },
    ],
    context: {
      mode: "existing_active_plan",
      activePlanId: activePlan.id,
      activePlanSourceKind: activePlan.source_kind ?? undefined,
      targetDateProtection: "none",
    },
  };
  const editReview = await reviewManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
      draftInput: editedDraftInput,
    },
    buildFakeEditDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assert.equal(editReview.ok, true, formatJsonResult(editReview));
  if (editReview.ok) {
    assert.equal(editReview.status, "review_ready");
    assert.equal(editReview.persisted, false);
    assert.equal(editReview.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(editReview.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(editReview.activePlanId, activePlan.id);
    assert.equal(editReview.plannedWorkoutId, sourceWorkout.id);
    assert.equal(editReview.workoutDate, sourceWorkout.workout_date);
    assert.equal(editReview.draftReview.draft.title, "Edited steady aerobic run");
    assert.equal(editReview.draftReview.draft.templateKey, "steady_aerobic_run");
    assert.equal(editReview.draftReview.draft.workoutDate, sourceWorkout.workout_date);
    assert.equal(editReview.draftReview.reviewChecksum.length, 64);
    assert.equal(editReview.review.reviewToken.startsWith("manual-workout-edit-review-v1."), true);
    assert.equal(editReview.review.reviewChecksum.length, 64);
    assert.equal(editReview.review.draftReviewChecksum, editReview.draftReview.reviewChecksum);
    assert.equal(editReview.review.trustedClientRows, false);
    assert.equal(editReview.safety.updatesSamePlannedWorkoutRow, true);
    assert.equal(editReview.safety.trustedClientRows, false);
    assertNoFakePaceOrHr(editReview.draftReview.draft.steps, "persisted edit review");
  }

  const persistedEdits: Array<{
    sourceWorkoutId: string;
    workoutDate: string;
    sourceTitle: string;
    editedTitle: string;
    editedTemplateKey: string;
    reviewChecksum: string;
    mutationChecksum: string;
    trustedClientRows: boolean;
    samePersistedRow: boolean;
    metricMode: PersistedPlannedWorkoutRow["metric_mode"];
    steps: PersistedPlannedWorkoutRow["steps"];
  }> = [];
  const confirm = await confirmManualWorkoutPersistedEditForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
      draftInput: editedDraftInput,
      ...(editReview.ok
        ? {
            reviewToken: editReview.review.reviewToken,
            reviewChecksum: editReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeEditDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      onPersist: ({ sourceWorkout: persistedSource, draftReview, review }) => {
        persistedEdits.push({
          sourceWorkoutId: persistedSource.id,
          workoutDate: persistedSource.workout_date,
          sourceTitle: persistedSource.title,
          editedTitle: draftReview.draft.title,
          editedTemplateKey: draftReview.draft.templateKey,
          reviewChecksum: review.reviewChecksum,
          mutationChecksum: review.mutationChecksum,
          trustedClientRows: review.trustedClientRows,
          samePersistedRow: persistedSource.id === sourceWorkout.id,
          metricMode: draftReview.draft.metricMode as PersistedPlannedWorkoutRow["metric_mode"],
          steps: draftReview.draft.steps as PersistedPlannedWorkoutRow["steps"],
        });
      },
    }),
  );
  assert.equal(confirm.ok, true, formatJsonResult(confirm));
  if (confirm.ok) {
    assert.equal(confirm.status, "updated");
    assert.equal(confirm.persisted, true);
    assert.equal(confirm.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(confirm.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
    assert.equal(confirm.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(confirm.activePlanId, activePlan.id);
    assert.equal(confirm.plannedWorkoutId, sourceWorkout.id);
    assert.equal(confirm.workoutDate, sourceWorkout.workout_date);
    assert.equal(confirm.title, "Edited steady aerobic run");
    assert.equal(confirm.templateKey, "steady_aerobic_run");
    assert.equal(confirm.calendarRowCount, 2);
    assert.equal(confirm.nonRestWorkoutCount, 2);
    assert.equal(confirm.sourceMetadata.editSourceKind, "active_plan_user_edit_v1");
    assert.equal(confirm.sourceMetadata.mutationKind, "user_edited_workout");
    assert.equal(confirm.sourceMetadata.mutationMode, "direct_manual_edit");
    assert.equal(
      confirm.sourceMetadata.mutationPayloadVersion,
      "manual_workout_persisted_edit_review_v1",
    );
    assert.equal(confirm.sourceMetadata.plannedWorkoutId, sourceWorkout.id);
    assert.equal(confirm.sourceMetadata.workoutDate, sourceWorkout.workout_date);
    assert.equal(confirm.sourceMetadata.originalPlanSourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(
      confirm.sourceMetadata.originalPlanSourceStatus,
      MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
    );
    assert.equal(confirm.sourceMetadata.trustedClientRows, false);
    assert.equal(confirm.safety.requiresExplicitConfirm, true);
    assert.equal(confirm.safety.updatedExactlyOneRow, true);
    assert.equal(confirm.safety.updatesSamePlannedWorkoutRow, true);
    assert.equal(confirm.safety.serverRebuiltReview, true);
    assert.equal(confirm.safety.trustedClientRows, false);
  }
  assert.deepEqual(persistedEdits, [
    {
      sourceWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
      sourceTitle: sourceWorkout.title,
      editedTitle: "Edited steady aerobic run",
      editedTemplateKey: "steady_aerobic_run",
      reviewChecksum: editReview.ok ? editReview.review.reviewChecksum : "",
      mutationChecksum: confirm.ok ? confirm.mutationChecksum : "",
      trustedClientRows: false,
      samePersistedRow: true,
      metricMode: confirm.ok ? persistedEdits[0]!.metricMode : null,
      steps: confirm.ok ? persistedEdits[0]!.steps : [],
    },
  ]);
  assertNoFakePaceOrHr(readStepsForAssertion(persistedEdits[0]?.steps ?? []), "persisted edit");

  const changedDraftDate = await reviewManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
      draftInput: { ...editedDraftInput, workoutDate: "2026-06-19" },
    },
    buildFakeEditDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertPersistedEditReviewBlocked(
    changedDraftDate,
    "workout_date_changed",
    "persisted edit changed draft date",
  );

  const changedSourceContent = {
    ...sourceWorkout,
    title: "Source changed before confirm",
  };
  const staleSource = await confirmManualWorkoutPersistedEditForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: changedSourceContent.id,
      workoutDate: changedSourceContent.workout_date,
      draftInput: editedDraftInput,
      ...(editReview.ok
        ? {
            reviewToken: editReview.review.reviewToken,
            reviewChecksum: editReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeEditDependencies({
      activePlan,
      workouts: [changedSourceContent, keptWorkout],
    }),
  );
  assertPersistedEditConfirmBlocked(staleSource, "stale_review", "persisted edit stale source");

  const staleSourceDate = await confirmManualWorkoutPersistedEditForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: "2026-06-19",
      draftInput: editedDraftInput,
      ...(editReview.ok
        ? {
            reviewToken: editReview.review.reviewToken,
            reviewChecksum: editReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeEditDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertPersistedEditConfirmBlocked(
    staleSourceDate,
    "source_date_changed",
    "persisted edit stale source date",
  );

  const invalidToken = await confirmManualWorkoutPersistedEditForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
      draftInput: editedDraftInput,
      reviewToken: editReview.ok
        ? `${editReview.review.reviewToken.slice(0, -1)}${
            editReview.review.reviewToken.endsWith("0") ? "1" : "0"
          }`
        : "invalid-token",
      reviewChecksum: editReview.ok ? editReview.review.reviewChecksum : "0".repeat(64),
    },
    buildFakeEditDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertPersistedEditConfirmBlocked(invalidToken, "invalid_review", "persisted edit invalid token");

  const staleChecksum = await confirmManualWorkoutPersistedEditForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
      draftInput: editedDraftInput,
      reviewToken: editReview.ok ? editReview.review.reviewToken : "invalid-token",
      reviewChecksum: "0".repeat(64),
    },
    buildFakeEditDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertPersistedEditConfirmBlocked(staleChecksum, "stale_review", "persisted edit stale checksum");

  const clientRowsAttempt = await confirmManualWorkoutPersistedEditForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
      draftInput: editedDraftInput,
      ...(editReview.ok
        ? {
            reviewToken: editReview.review.reviewToken,
            reviewChecksum: editReview.review.reviewChecksum,
          }
        : {}),
      plannedWorkout: { id: sourceWorkout.id, title: "Client row should be ignored" },
    },
    buildFakeEditDependencies({ activePlan, workouts: [sourceWorkout, keptWorkout] }),
  );
  assertPersistedEditConfirmBlocked(
    clientRowsAttempt,
    "client_payload_rejected",
    "persisted edit client payload",
  );

  const protectedPastSource = {
    ...sourceWorkout,
    id: "99999999-9999-4999-8999-000000000804",
    workout_date: "2026-06-09",
    weekday: "Tuesday",
  };
  const protectedPast = await reconstructManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: protectedPastSource.id,
      workoutDate: protectedPastSource.workout_date,
    },
    buildFakeEditDependencies({ activePlan, workouts: [protectedPastSource, keptWorkout] }),
  );
  assertPersistedEditReconstructBlocked(
    protectedPast,
    "protected_day",
    "persisted edit protected past source",
  );

  const loggedSource = await reconstructManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
    },
    buildFakeEditDependencies({
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
  assertPersistedEditReconstructBlocked(
    loggedSource,
    "protected_day",
    "persisted edit logged source",
  );

  const evidenceSource = await reconstructManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
    },
    buildFakeEditDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      evidenceWorkoutIds: new Set([sourceWorkout.id]),
    }),
  );
  assertPersistedEditReconstructBlocked(
    evidenceSource,
    "protected_day",
    "persisted edit evidence source",
  );

  const generatedPlan = buildFakePlanCycle({
    userId,
    id: activePlan.id,
    sourceKind: "ai_first_plan_blueprint_v1",
    startDate: "2026-06-18",
    endDate: "2026-06-24",
  });
  const generatedSourceWorkout = {
    ...sourceWorkout,
    source_workout_type: "generated_easy_run",
    workout_identity: "easy_aerobic_run",
  } satisfies PersistedPlannedWorkoutRow;
  const generatedReconstruct = await reconstructManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: generatedPlan.id,
      plannedWorkoutId: generatedSourceWorkout.id,
      workoutDate: generatedSourceWorkout.workout_date,
    },
    buildFakeEditDependencies({
      activePlan: generatedPlan,
      workouts: [generatedSourceWorkout, keptWorkout],
    }),
  );
  assert.equal(generatedReconstruct.ok, true, formatJsonResult(generatedReconstruct));
  if (generatedReconstruct.ok) {
    assert.equal(generatedReconstruct.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(generatedReconstruct.draftInput.templateKey, "easy_aerobic_run");
    assert.equal(generatedReconstruct.safety.reconstructedFromPersistedWorkout, true);
    assert.equal(generatedReconstruct.safety.trustedClientRows, false);
  }

  const generatedReview = await reviewManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: generatedPlan.id,
      plannedWorkoutId: generatedSourceWorkout.id,
      workoutDate: generatedSourceWorkout.workout_date,
      draftInput: editedDraftInput,
    },
    buildFakeEditDependencies({
      activePlan: generatedPlan,
      workouts: [generatedSourceWorkout, keptWorkout],
    }),
  );
  assert.equal(generatedReview.ok, true, formatJsonResult(generatedReview));
  if (generatedReview.ok) {
    assert.equal(generatedReview.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(generatedReview.review.trustedClientRows, false);
    assert.equal(generatedReview.safety.activePlanSourceVerified, true);
    assert.equal(generatedReview.safety.trustedClientRows, false);
  }

  const generatedPersists: Array<{
    sourceKind: string | null;
    sourceWorkoutId: string;
    editedTemplateKey: string;
  }> = [];
  const generatedConfirm = await confirmManualWorkoutPersistedEditForUser(
    userId,
    {
      activePlanId: generatedPlan.id,
      plannedWorkoutId: generatedSourceWorkout.id,
      workoutDate: generatedSourceWorkout.workout_date,
      draftInput: editedDraftInput,
      ...(generatedReview.ok
        ? {
            reviewToken: generatedReview.review.reviewToken,
            reviewChecksum: generatedReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeEditDependencies({
      activePlan: generatedPlan,
      workouts: [generatedSourceWorkout, keptWorkout],
      onPersist: ({ activePlan: persistedPlan, sourceWorkout: persistedSource, draftReview }) => {
        generatedPersists.push({
          sourceKind: persistedPlan.source_kind,
          sourceWorkoutId: persistedSource.id,
          editedTemplateKey: draftReview.draft.templateKey,
        });
      },
    }),
  );
  assert.equal(generatedConfirm.ok, true, formatJsonResult(generatedConfirm));
  if (generatedConfirm.ok) {
    assert.equal(generatedConfirm.sourceKind, "ai_first_plan_blueprint_v1");
    assert.equal(generatedConfirm.sourceStatus, null);
    assert.equal(generatedConfirm.sourceMetadata.editSourceKind, "active_plan_user_edit_v1");
    assert.equal(generatedConfirm.sourceMetadata.mutationKind, "user_edited_workout");
    assert.equal(
      generatedConfirm.sourceMetadata.originalPlanSourceKind,
      "ai_first_plan_blueprint_v1",
    );
    assert.equal(generatedConfirm.sourceMetadata.originalPlanSourceStatus, null);
    assert.equal(generatedConfirm.sourceMetadata.trustedClientRows, false);
    assert.equal(generatedConfirm.safety.updatedExactlyOneRow, true);
    assert.equal(generatedConfirm.safety.serverRebuiltReview, true);
  }
  assert.deepEqual(generatedPersists, [
    {
      sourceKind: "ai_first_plan_blueprint_v1",
      sourceWorkoutId: generatedSourceWorkout.id,
      editedTemplateKey: "steady_aerobic_run",
    },
  ]);

  const unsupportedSource = {
    ...sourceWorkout,
    id: "99999999-9999-4999-8999-000000000805",
    workout_date: "2026-06-20",
    source_workout_type: "generated_easy_run",
    workout_identity: "legacy_generated_freeform",
  };
  const unsupported = await reconstructManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: unsupportedSource.id,
      workoutDate: unsupportedSource.workout_date,
    },
    buildFakeEditDependencies({ activePlan, workouts: [unsupportedSource, keptWorkout] }),
  );
  assertPersistedEditReconstructBlocked(
    unsupported,
    "source_workout_not_supported",
    "persisted edit unsupported source shape",
  );

  const unsafeMetricSource = {
    ...sourceWorkout,
    id: "99999999-9999-4999-8999-000000000806",
    workout_date: "2026-06-20",
    steps: [
      {
        label: "Unsafe fake pace",
        target: { pace: "4:30/km" },
      },
    ] as PersistedPlannedWorkoutRow["steps"],
  };
  const unsafeMetric = await reconstructManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: unsafeMetricSource.id,
      workoutDate: unsafeMetricSource.workout_date,
    },
    buildFakeEditDependencies({ activePlan, workouts: [unsafeMetricSource, keptWorkout] }),
  );
  assertPersistedEditReconstructBlocked(
    unsafeMetric,
    "source_workout_not_supported",
    "persisted edit unsafe metric source",
  );

  const persistenceFailure = await confirmManualWorkoutPersistedEditForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
      draftInput: editedDraftInput,
      ...(editReview.ok
        ? {
            reviewToken: editReview.review.reviewToken,
            reviewChecksum: editReview.review.reviewChecksum,
          }
        : {}),
    },
    buildFakeEditDependencies({
      activePlan,
      workouts: [sourceWorkout, keptWorkout],
      persistError: new Error("simulated edit failure"),
    }),
  );
  assertPersistedEditConfirmBlocked(
    persistenceFailure,
    "persistence_failed",
    "persisted edit persistence failure",
  );
}

type EditDependencies = NonNullable<
  Parameters<typeof reviewManualWorkoutPersistedEditDraftForUser>[2]
>;

function buildFakeEditDependencies(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  persistError?: Error;
  onPersist?: (record: Parameters<NonNullable<EditDependencies["persistWorkoutEdit"]>>[0]) => void;
}): EditDependencies {
  return {
    ...buildFakeActivePlanMutationDependencyBase(input),
    persistWorkoutEdit: async (record) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.(record);

      return {
        editedWorkout: {
          ...record.sourceWorkout,
          title: record.draftReview.draft.title,
          notes: record.draftReview.draft.notes,
          workout_type: record.draftReview.draft.workoutType,
          source_workout_type: record.draftReview.draft.sourceWorkoutType,
          workout_family: record.draftReview.draft.workoutFamily,
          workout_identity: record.draftReview.draft.workoutIdentity,
          calendar_icon_key: record.draftReview.draft.calendarIconKey,
          metric_mode: record.draftReview.draft.metricMode,
          steps: record.draftReview.draft.steps as PersistedPlannedWorkoutRow["steps"],
        },
        planCycle: record.activePlan,
      };
    },
  };
}

function assertPersistedEditReconstructBlocked(
  result: ManualWorkoutPersistedEditReconstructResult,
  reason: Extract<ManualWorkoutPersistedEditReconstructResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}

function assertPersistedEditReviewBlocked(
  result: ManualWorkoutPersistedEditReviewResult,
  reason: Extract<ManualWorkoutPersistedEditReviewResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}

function assertPersistedEditConfirmBlocked(
  result: ManualWorkoutPersistedEditConfirmResult,
  reason: Extract<ManualWorkoutPersistedEditConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}
