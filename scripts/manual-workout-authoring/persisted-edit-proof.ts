import assert from "node:assert/strict";
import type {
  ExistingPlanContext,
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/active-plan-persistence";
import { buildImportedPlanSeed } from "../../src/lib/imported-plan";
import {
  buildManualWorkoutUserBuiltTrainingPlan,
  confirmManualWorkoutPersistedEditForUser,
  reconstructManualWorkoutPersistedEditDraftForUser,
  reviewManualWorkoutDraft,
  reviewManualWorkoutPersistedEditDraftForUser,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutPersistedEditConfirmResult,
  type ManualWorkoutPersistedEditReconstructResult,
  type ManualWorkoutPersistedEditReviewResult,
} from "../../src/lib/manual-workout-authoring";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
} from "../../src/lib/manual-workout-authoring/schema";
import { buildPersistedWorkoutInsertRows } from "../../src/lib/persisted-plan-replacement";
import type { Step } from "../../src/lib/training";

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
  assert.equal(reconstruct.ok, true, formatPersistedEditReconstructResult(reconstruct));
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
  assert.equal(editReview.ok, true, formatPersistedEditReviewResult(editReview));
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
  assert.equal(confirm.ok, true, formatPersistedEditConfirmResult(confirm));
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

  const nonManualPlan = await reconstructManualWorkoutPersistedEditDraftForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: sourceWorkout.id,
      workoutDate: sourceWorkout.workout_date,
    },
    buildFakeEditDependencies({
      activePlan: buildFakePlanCycle({
        userId,
        id: activePlan.id,
        sourceKind: "plan_preset_v1",
        startDate: "2026-06-18",
        endDate: "2026-06-24",
      }),
      workouts: [sourceWorkout, keptWorkout],
    }),
  );
  assertPersistedEditReconstructBlocked(
    nonManualPlan,
    "unsupported_active_plan_source",
    "persisted edit generated/preset source",
  );

  const unsupportedSource = {
    ...sourceWorkout,
    id: "99999999-9999-4999-8999-000000000805",
    workout_date: "2026-06-20",
    source_workout_type: "generated_easy_run",
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

function assertReady(
  label: string,
  input: ManualWorkoutDraftInput,
): Extract<ManualWorkoutDraftReviewResult, { ok: true }> {
  const result = reviewManualWorkoutDraft(input);

  assert.equal(result.ok, true, `${label} should be accepted: ${formatResult(result)}`);
  assert.equal(result.status, "draft_ready");
  assert.equal(result.draft.persisted, false);
  assert.equal(result.reviewToken.startsWith("manual-workout-review-v1."), true);
  assert.equal(result.reviewChecksum.length, 64);

  return result;
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
    currentDate: "2026-06-10",
    getExistingPlanContextForUser: async () =>
      ({
        activePlan: input.activePlan,
        existingWorkouts: {
          workouts: input.workouts,
          logsByWorkoutId: input.logsByWorkoutId ?? new Map(),
        },
      }) satisfies ExistingPlanContext,
    fetchEvidenceWorkoutIds: async () => input.evidenceWorkoutIds ?? new Set(),
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

function buildCanonicalPersistedPlannedWorkoutFromReview({
  userId,
  planCycleId,
  id,
  review,
}: {
  userId: string;
  planCycleId: string;
  id: string;
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
}): PersistedPlannedWorkoutRow {
  const canonicalPlan = buildManualWorkoutUserBuiltTrainingPlan(review.draft);
  const importedSeed = buildImportedPlanSeed(canonicalPlan);
  const [insertRow] = buildPersistedWorkoutInsertRows(planCycleId, userId, importedSeed.workouts);

  assert.ok(insertRow, "canonical persisted workout fixture should produce one insert row");

  return {
    id,
    created_at: "2026-06-10T00:00:00.000Z",
    ...insertRow,
  } satisfies PersistedPlannedWorkoutRow;
}

function buildFakePlanCycle({
  userId,
  id,
  sourceKind,
  startDate,
  endDate,
}: {
  userId: string;
  id: string;
  sourceKind: string | null;
  startDate: string;
  endDate: string;
}): PersistedPlanCycleRow {
  const isManualPlan = sourceKind === MANUAL_USER_BUILT_PLAN_SOURCE_KIND;

  return {
    id,
    user_id: userId,
    status: "active",
    title: "Manual user-built plan",
    goal_summary: "Manual user-built plan",
    source_template: "training-plan-v2",
    schema_version: "training-plan-v2",
    source_kind: sourceKind,
    start_date: startDate,
    end_date: endDate,
    target_date: null,
    goal_metadata: isManualPlan
      ? {
          manual_user_built_plan: {
            source_kind: sourceKind,
            source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
          },
        }
      : {},
    plan_preferences: isManualPlan
      ? {
          manual_workout_authoring_reviews: [],
        }
      : {},
    created_at: "2026-06-10T00:00:00.000Z",
    updated_at: "2026-06-10T00:00:00.000Z",
  };
}

function buildFakeWorkoutLog({
  userId,
  plannedWorkoutId,
}: {
  userId: string;
  plannedWorkoutId: string;
}): PersistedWorkoutLogRow {
  return {
    id: "77777777-7777-4777-8777-777777777777",
    user_id: userId,
    planned_workout_id: plannedWorkoutId,
    outcome: "completed",
    actual_distance_km: 5,
    actual_duration_min: 35,
    rpe: 3,
    notes: null,
    body_notes: null,
    intervals_completed: null,
    logged_at: "2026-06-17T12:00:00.000Z",
    updated_at: "2026-06-17T12:00:00.000Z",
  };
}

function assertPersistedEditReconstructBlocked(
  result: ManualWorkoutPersistedEditReconstructResult,
  reason: Extract<ManualWorkoutPersistedEditReconstructResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(
    result.ok,
    false,
    `${label} should be blocked: ${formatPersistedEditReconstructResult(result)}`,
  );

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertPersistedEditReviewBlocked(
  result: ManualWorkoutPersistedEditReviewResult,
  reason: Extract<ManualWorkoutPersistedEditReviewResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(
    result.ok,
    false,
    `${label} should be blocked: ${formatPersistedEditReviewResult(result)}`,
  );

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertPersistedEditConfirmBlocked(
  result: ManualWorkoutPersistedEditConfirmResult,
  reason: Extract<ManualWorkoutPersistedEditConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(
    result.ok,
    false,
    `${label} should be blocked: ${formatPersistedEditConfirmResult(result)}`,
  );

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertNoFakePaceOrHr(steps: Step[], label: string) {
  const allTargets = flattenSteps(steps).flatMap((step) => (step.target ? [step.target] : []));

  for (const target of allTargets) {
    assert.equal("pace" in target, false, `${label} should not include pace.`);
    assert.equal(
      "pace_min_per_km_range" in target,
      false,
      `${label} should not include pace range.`,
    );
    assert.equal("hr_bpm_range" in target, false, `${label} should not include HR range.`);
    assert.notEqual(
      target.hr_target_source,
      "personal_hr_zone",
      `${label} should not include personal HR-zone truth.`,
    );
  }
}

function flattenSteps(steps: Step[]): Step[] {
  return steps.flatMap((step) => [
    step,
    ...(step.work ? flattenSteps([step.work]) : []),
    ...(step.recovery ? flattenSteps([step.recovery]) : []),
  ]);
}

function readStepsForAssertion(value: PersistedPlannedWorkoutRow["steps"]): Step[] {
  return Array.isArray(value) ? (value as Step[]) : [];
}

function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}

function formatPersistedEditReconstructResult(result: ManualWorkoutPersistedEditReconstructResult) {
  return JSON.stringify(result, null, 2);
}

function formatPersistedEditReviewResult(result: ManualWorkoutPersistedEditReviewResult) {
  return JSON.stringify(result, null, 2);
}

function formatPersistedEditConfirmResult(result: ManualWorkoutPersistedEditConfirmResult) {
  return JSON.stringify(result, null, 2);
}
