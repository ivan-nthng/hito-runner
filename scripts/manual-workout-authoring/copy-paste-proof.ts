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
  confirmManualWorkoutCopyPasteDraftForUser,
  copyManualWorkoutWithinActivePlanForUser,
  reviewManualWorkoutCopyPasteDraftForUser,
  reviewManualWorkoutDraft,
  type ManualWorkoutCopyPasteConfirmResult,
  type ManualWorkoutCopyPasteReviewResult,
  type ManualWorkoutDirectCopyResult,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
} from "../../src/lib/manual-workout-authoring/schema";
import { buildPersistedWorkoutInsertRows } from "../../src/lib/persisted-plan-replacement";
import type { Step } from "../../src/lib/training";

type AddDependencies = NonNullable<Parameters<typeof reviewManualWorkoutCopyPasteDraftForUser>[2]>;

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

  assert.equal(copyReview.ok, true, formatCopyPasteReviewResult(copyReview));
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
  assert.equal(sourceDateReview.ok, true, formatCopyPasteReviewResult(sourceDateReview));

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

  assert.equal(success.ok, true, formatCopyPasteConfirmResult(success));
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
        sourceKind: "plan_preset_v1",
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

  assert.equal(directCopy.ok, true, formatDirectCopyResult(directCopy));
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
        sourceKind: "plan_preset_v1",
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

function buildFakeAddDependencies(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  persistError?: Error;
  onPersist?: (record: {
    workoutSeed: Parameters<NonNullable<AddDependencies["persistWorkoutAdd"]>>[0]["workoutSeed"];
    reviewMetadata: Parameters<
      NonNullable<AddDependencies["persistWorkoutAdd"]>
    >[0]["reviewMetadata"];
  }) => void;
}): AddDependencies {
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
    persistWorkoutAdd: async (record) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.({
        workoutSeed: record.workoutSeed,
        reviewMetadata: record.reviewMetadata,
      });

      return {
        plannedWorkout: buildFakePlannedWorkout({
          userId: record.userId,
          planCycleId: record.activePlan.id,
          id: "66666666-6666-4666-8666-666666666666",
          date: record.workoutSeed.workoutDate,
          displayOrder: record.workoutSeed.displayOrder,
          title: record.workoutSeed.title,
          workoutIdentity: record.workoutSeed.workoutIdentity,
        }),
        planCycle: {
          ...record.activePlan,
          end_date:
            record.workoutSeed.workoutDate > record.activePlan.end_date
              ? record.workoutSeed.workoutDate
              : record.activePlan.end_date,
        },
      };
    },
  };
}

function buildFakePlannedWorkoutFromReview({
  userId,
  planCycleId,
  id,
  date,
  displayOrder,
  review,
  weekday,
}: {
  userId: string;
  planCycleId: string;
  id: string;
  date: string;
  displayOrder: number;
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
  weekday?: string;
}): PersistedPlannedWorkoutRow {
  return buildFakePlannedWorkout({
    userId,
    planCycleId,
    id,
    date,
    displayOrder,
    title: review.draft.title,
    notes: review.draft.notes,
    weekday: weekday ?? review.draft.weekday,
    workoutType: review.draft.workoutType,
    sourceWorkoutType: review.draft.sourceWorkoutType,
    workoutFamily: review.draft.workoutFamily,
    workoutIdentity: review.draft.workoutIdentity,
    calendarIconKey: review.draft.calendarIconKey,
    metricMode: cloneJson(review.draft.metricMode) as PersistedPlannedWorkoutRow["metric_mode"],
    steps: cloneJson(review.draft.steps) as PersistedPlannedWorkoutRow["steps"],
  });
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

function buildFakePlannedWorkout({
  userId,
  planCycleId,
  id,
  date,
  displayOrder,
  title = "Easy aerobic run",
  notes = null,
  weekday = "Tuesday",
  workoutType = "easy",
  sourceWorkoutType = "easy",
  workoutFamily = "easy",
  workoutIdentity = "easy_aerobic_run",
  calendarIconKey = "easy",
  metricMode = null,
  steps = [],
}: {
  userId: string;
  planCycleId: string;
  id: string;
  date: string;
  displayOrder: number;
  title?: string;
  notes?: string | null;
  weekday?: string;
  workoutType?: PersistedPlannedWorkoutRow["workout_type"];
  sourceWorkoutType?: string | null;
  workoutFamily?: string | null;
  workoutIdentity?: string | null;
  calendarIconKey?: string | null;
  metricMode?: PersistedPlannedWorkoutRow["metric_mode"];
  steps?: PersistedPlannedWorkoutRow["steps"];
}): PersistedPlannedWorkoutRow {
  return {
    id,
    user_id: userId,
    plan_cycle_id: planCycleId,
    workout_date: date,
    weekday,
    week_number: 1,
    phase: "Manual build",
    workout_type: workoutType,
    source_workout_id: `manual-${date}-easy_aerobic_run`,
    source_workout_type: sourceWorkoutType,
    workout_family: workoutFamily,
    workout_identity: workoutIdentity,
    calendar_icon_key: calendarIconKey,
    goal_context: null,
    metric_mode: metricMode,
    title,
    notes,
    planned_rpe: null,
    estimated_fatigue: null,
    recovery_priority: null,
    steps,
    display_order: displayOrder,
    created_at: "2026-06-10T00:00:00.000Z",
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

function assertCopyReviewBlocked(
  result: ManualWorkoutCopyPasteReviewResult,
  reason: Extract<ManualWorkoutCopyPasteReviewResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(
    result.ok,
    false,
    `${label} should be blocked: ${formatCopyPasteReviewResult(result)}`,
  );

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertCopyPasteBlocked(
  result: ManualWorkoutCopyPasteConfirmResult,
  reason: Extract<ManualWorkoutCopyPasteConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(
    result.ok,
    false,
    `${label} should be blocked: ${formatCopyPasteConfirmResult(result)}`,
  );

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertDirectCopyBlocked(
  result: ManualWorkoutDirectCopyResult,
  reason: Extract<ManualWorkoutDirectCopyResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatDirectCopyResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertRepeatWithRecovery(steps: Step[], label: string) {
  const repeatStep = steps.find((step) => step.repeats);

  assert.ok(repeatStep, `${label} should include a repeat step.`);
  assert.ok(repeatStep.repeats && repeatStep.repeats >= 2);
  assert.equal(Object.hasOwn(repeatStep, "work"), false, `${label} must not persist work.`);
  assert.equal(Object.hasOwn(repeatStep, "recovery"), false, `${label} must not persist recovery.`);
  const children = repeatChildrenForProof(repeatStep);
  assert.ok(children.length >= 2, `${label} repeat should include ordered children.`);
  assert.ok(hasExecutableStructure(children[0]), `${label} repeat first child should be numeric.`);
  assert.ok(hasExecutableStructure(children[1]), `${label} repeat second child should be numeric.`);
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

function hasExecutableStructure(step: Step) {
  if (step.duration_min || step.distance_km) {
    return true;
  }

  if (step.repeats && step.children?.length) {
    return step.children.every((child) => hasExecutableStructure(child));
  }

  return false;
}

function flattenSteps(steps: Step[]): Step[] {
  return steps.flatMap((step) => [step, ...(step.children ? flattenSteps(step.children) : [])]);
}

function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}

function formatCopyPasteReviewResult(result: ManualWorkoutCopyPasteReviewResult) {
  return JSON.stringify(result, null, 2);
}

function formatCopyPasteConfirmResult(result: ManualWorkoutCopyPasteConfirmResult) {
  return JSON.stringify(result, null, 2);
}

function formatDirectCopyResult(result: ManualWorkoutDirectCopyResult) {
  return JSON.stringify(result, null, 2);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
