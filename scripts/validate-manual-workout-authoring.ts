import assert from "node:assert/strict";
import {
  MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
  MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  addManualWorkoutToActivePlanForUser,
  buildManualWorkoutUserBuiltTrainingPlan,
  confirmManualWorkoutCopyPasteDraftForUser,
  confirmManualWorkoutDeleteClearForUser,
  confirmManualWorkoutDraftForUser,
  confirmManualWorkoutMoveForUser,
  listManualWorkoutSavedTemplatesForUser,
  reviewManualWorkoutCopyPasteDraftForUser,
  reviewManualWorkoutDeleteClearForUser,
  reviewManualWorkoutMoveForUser,
  reviewManualWorkoutSavedTemplateForUser,
  reviewManualWorkoutDraft,
  saveManualWorkoutSavedTemplateForUser,
  validateManualWorkoutReviewExactness,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutConfirmResult,
  type ManualWorkoutCopyPasteConfirmResult,
  type ManualWorkoutCopyPasteReviewResult,
  type ManualWorkoutDeleteClearConfirmResult,
  type ManualWorkoutDeleteClearReviewResult,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutMoveConfirmResult,
  type ManualWorkoutMoveReviewResult,
  type ManualWorkoutSavedTemplateRepository,
  type ManualWorkoutSavedTemplateSaveResult,
} from "../src/lib/manual-workout-authoring";
import type {
  ExistingPlanContext,
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../src/lib/active-plan-persistence";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type TrainingPlanV2,
} from "../src/lib/imported-plan";
import type { AdditionalPlanPersistenceMetadata } from "../src/lib/plan-authoring-snapshot";
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
  renderPlanExportJson,
  renderPlanExportMarkdown,
} from "../src/lib/plan-export";
import { buildPersistedWorkoutInsertRows } from "../src/lib/persisted-plan-replacement";
import type { Step } from "../src/lib/training";
import { formatReadableDate } from "../src/components/manual-workout/manual-workout-authoring-utils";
import {
  buildSkippedManualPersistenceResult,
  formatManualPersistenceBlocker,
  readManualPersistenceCliOptions,
  resolveManualPersistencePreflight,
  validateManualWorkoutDisposablePersistenceProof,
} from "./manual-workout-authoring/persistence-proof";

async function main() {
  const options = readManualPersistenceCliOptions();
  validateAcceptedFixtures();
  validateRejectedFixtures();
  validateStableReviewExactness();
  validateProtectedConflictShape();
  validateManualDateOnlyLabels();
  await validateManualSavedTemplateContract();
  await validateManualConfirmPersistenceContract();
  await validateManualActivePlanAddWorkoutContract();
  await validateManualCopyPasteContract();
  await validateManualDeleteClearContract();
  await validateManualMoveWorkoutContract();
  validateManualActivePlanExportContract();

  const persistenceInput: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    notes: "Keep it easy.",
  };
  const persistenceReview = assertReady("manual disposable persistence review", persistenceInput);
  const persistencePreflight = resolveManualPersistencePreflight(options);

  if (!persistencePreflight.shouldRun && options.requirePersistence) {
    throw new Error(formatManualPersistenceBlocker(persistencePreflight));
  }

  const persistenceProof = persistencePreflight.shouldRun
    ? await validateManualWorkoutDisposablePersistenceProof({
        input: persistenceInput,
        review: persistenceReview,
        preflight: persistencePreflight,
      })
    : buildSkippedManualPersistenceResult(persistencePreflight);

  console.log("Manual workout authoring review contract invariants passed.", {
    persistence: persistenceProof,
  });
}

function validateManualDateOnlyLabels() {
  assert.equal(
    formatReadableDate("2026-06-14"),
    "Sun, Jun 14",
    "manual date-only labels must not drift through UTC timezone conversion",
  );
}

async function validateManualSavedTemplateContract() {
  const userId = "00000000-0000-4000-8000-000000000301";
  const otherUserId = "00000000-0000-4000-8000-000000000302";
  const repository = buildFakeSavedTemplateRepository();
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_run_with_strides",
    workoutDate: "2026-06-18",
    title: "Track-friendly strides",
    notes: "Keep the strides relaxed.",
  };
  const reviewed = assertReady("saved template source review", input);
  const saveResult = await saveManualWorkoutSavedTemplateForUser(
    userId,
    {
      displayName: "  My relaxed strides  ",
      iconKey: "easy",
      ...buildConfirmInput(input, reviewed),
    },
    { repository },
  );

  assertSavedTemplateSaved(saveResult, "saved personal template");
  if (!saveResult.ok) {
    return;
  }

  assert.equal(saveResult.sourceKind, MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND);
  assert.equal(saveResult.sourceStatus, MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS);
  assert.equal(saveResult.template.displayName, "My relaxed strides");
  assert.equal(saveResult.template.iconKey, "easy");
  assert.equal(saveResult.template.templateKey, input.templateKey);
  assert.equal(saveResult.template.sourceReviewChecksum, reviewed.reviewChecksum);
  assert.equal(saveResult.template.targetTruthMode, "structure_only");
  assert.equal(saveResult.safety.serverRebuiltReview, true);
  assert.equal(saveResult.safety.trustedClientRows, false);
  assertNoFakePaceOrHrInSerialized(saveResult.template.draftPayload, "saved template payload");

  const readback = await listManualWorkoutSavedTemplatesForUser(userId, { repository });
  assert.equal(readback.ok, true, JSON.stringify(readback, null, 2));
  if (readback.ok) {
    assert.equal(readback.sourceKind, MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND);
    assert.equal(readback.templates.length, 1);
    assert.equal(readback.templates[0]?.id, saveResult.template.id);
    assert.equal(readback.safety.currentUserScoped, true);
  }

  const otherUserReadback = await listManualWorkoutSavedTemplatesForUser(otherUserId, {
    repository,
  });
  assert.equal(otherUserReadback.ok, true, JSON.stringify(otherUserReadback, null, 2));
  if (otherUserReadback.ok) {
    assert.equal(otherUserReadback.templates.length, 0);
  }

  const reconstructed = await reviewManualWorkoutSavedTemplateForUser(
    userId,
    {
      templateId: saveResult.template.id,
      workoutDate: "2026-06-25",
      context: {
        mode: "existing_active_plan",
        activePlanSourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
        targetDateProtection: "none",
      },
    },
    { repository },
  );

  assert.equal(reconstructed.ok, true, JSON.stringify(reconstructed, null, 2));
  if (reconstructed.ok) {
    assert.equal(reconstructed.persisted, false);
    assert.equal(reconstructed.draftInput.workoutDate, "2026-06-25");
    assert.equal(reconstructed.draftInput.title, "My relaxed strides");
    assert.equal(reconstructed.review.draft.workoutDate, "2026-06-25");
    assert.equal(reconstructed.review.draft.title, "My relaxed strides");
    assert.equal(reconstructed.review.draft.templateKey, input.templateKey);
    assert.equal(reconstructed.safety.reviewedThroughManualAuthoring, true);
    assert.equal(reconstructed.safety.trustedClientRows, false);
    assertRepeatWithRecovery(reconstructed.review.draft.steps, "saved-template review");
  }

  const crossUser = await reviewManualWorkoutSavedTemplateForUser(
    otherUserId,
    {
      templateId: saveResult.template.id,
      workoutDate: "2026-06-25",
    },
    { repository },
  );
  assert.equal(crossUser.ok, false, "cross-user saved template lookup should be rejected");
  if (!crossUser.ok) {
    assert.equal(crossUser.reason, "not_found");
  }

  const invalidName = await saveManualWorkoutSavedTemplateForUser(
    userId,
    {
      displayName: "   ",
      iconKey: "easy",
      ...buildConfirmInput(input, reviewed),
    },
    { repository },
  );
  assertSavedTemplateBlocked(invalidName, "invalid_name", "blank saved-template name");

  const invalidIcon = await saveManualWorkoutSavedTemplateForUser(
    userId,
    {
      displayName: "Bad icon",
      iconKey: "rocket",
      ...buildConfirmInput(input, reviewed),
    },
    { repository },
  );
  assertSavedTemplateBlocked(invalidIcon, "invalid_icon", "unsupported saved-template icon");

  const fakePace = await saveManualWorkoutSavedTemplateForUser(
    userId,
    {
      displayName: "Fake pace",
      iconKey: "easy",
      draftInput: {
        templateKey: "easy_aerobic_run",
        workoutDate: "2026-06-18",
        entries: [
          {
            kind: "block",
            block: {
              blockKey: "easy_run_block",
              durationSeconds: 30 * 60,
              target: { paceMinPerKmRange: "4:55-5:05/km" },
            },
          },
        ],
      },
      reviewToken: reviewed.reviewToken,
      reviewChecksum: reviewed.reviewChecksum,
    },
    { repository },
  );
  assertSavedTemplateBlocked(fakePace, "unsafe_metric_truth", "fake saved-template pace");

  const fakeHr = await saveManualWorkoutSavedTemplateForUser(
    userId,
    {
      displayName: "Fake HR",
      iconKey: "easy",
      draftInput: {
        templateKey: "easy_aerobic_run",
        workoutDate: "2026-06-18",
        entries: [
          {
            kind: "block",
            block: {
              blockKey: "easy_run_block",
              durationSeconds: 30 * 60,
              target: { hrTargetSource: "personal_hr_zone", hrBpmRange: "145-155" },
            },
          },
        ],
      },
      reviewToken: reviewed.reviewToken,
      reviewChecksum: reviewed.reviewChecksum,
    },
    { repository },
  );
  assertSavedTemplateBlocked(fakeHr, "unsafe_metric_truth", "fake saved-template HR");

  repository.addRawTemplate({
    ...repository.rows()[0]!,
    id: "99999999-9999-4999-8999-999999999999",
    draft_payload: { unsupported: true },
  });
  const unsupportedPayload = await reviewManualWorkoutSavedTemplateForUser(
    userId,
    {
      templateId: "99999999-9999-4999-8999-999999999999",
      workoutDate: "2026-06-25",
    },
    { repository },
  );
  assert.equal(unsupportedPayload.ok, false);
  if (!unsupportedPayload.ok) {
    assert.equal(unsupportedPayload.reason, "unsupported_payload");
  }
}

async function validateManualActivePlanAddWorkoutContract() {
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
    buildConfirmInput(input, reviewed),
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

  assert.equal(success.ok, true, formatAddResult(success));
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
    assert.equal(success.sourceMetadata.reviewChecksum, reviewed.reviewChecksum);
    assert.equal(success.sourceMetadata.metricTruthMode, "structure_only");
    assert.equal(success.safety.targetDayWasEmpty, true);
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

  const changedDate = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput({ ...input, workoutDate: "2026-06-18" }, reviewed),
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(changedDate, "stale_review", "changed add-workout date");

  const invalidToken = await addManualWorkoutToActivePlanForUser(
    userId,
    {
      ...buildConfirmInput(input, reviewed),
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
      ...buildConfirmInput(input, reviewed),
      plannedWorkout: { workoutDate: "2026-06-19", title: "Trust me" },
    },
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(clientRowsAttempt, "invalid_review", "client-sent add row");

  const noActivePlan = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({ activePlan: null, workouts: [] }),
  );
  assertAddBlocked(noActivePlan, "no_active_plan", "missing active plan");

  const unsupportedSources = [
    "ai_first_plan_blueprint_v1",
    "plan_preset_v1",
    "running_plan_engine_v1",
    "training_plan_v2_import",
  ];
  for (const sourceKind of unsupportedSources) {
    const result = await addManualWorkoutToActivePlanForUser(
      userId,
      buildConfirmInput(input, reviewed),
      buildFakeAddDependencies({
        activePlan: buildFakePlanCycle({
          userId,
          id: "33333333-3333-4333-8333-333333333333",
          sourceKind,
          startDate: "2026-06-16",
          endDate: "2026-06-16",
        }),
        workouts: [firstWorkout],
      }),
    );
    assertAddBlocked(result, "unsupported_active_plan_source", `unsupported source ${sourceKind}`);
  }

  const occupiedWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "44444444-4444-4444-8444-444444444444",
    date: input.workoutDate,
    displayOrder: 1,
  });
  const occupiedDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout, occupiedWorkout] }),
  );
  assertAddBlocked(occupiedDay, "occupied_day", "occupied add-workout day");

  const protectedLoggedDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
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
    buildConfirmInput(input, reviewed),
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
    buildConfirmInput({ ...input, workoutDate: "2026-06-09" }, pastDateReview),
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(protectedPastDay, "protected_day", "past add-workout day");

  const activePlanMismatch = await addManualWorkoutToActivePlanForUser(
    userId,
    {
      activePlanId: "55555555-5555-4555-8555-555555555555",
      ...buildConfirmInput(input, reviewed),
    },
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(activePlanMismatch, "stale_review", "active plan mismatch");

  const persistenceFailure = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout],
      persistError: new Error("simulated add failure"),
    }),
  );
  assertAddBlocked(persistenceFailure, "persistence_failed", "add-workout persistence failure");
}

async function validateManualCopyPasteContract() {
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
}

async function validateManualDeleteClearContract() {
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

  assert.equal(review.ok, true, formatDeleteReviewResult(review));
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
    assert.equal(review.safety.lastWorkoutProtected, true);
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

  assert.equal(success.ok, true, formatDeleteConfirmResult(success));
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
    assert.equal(success.restore.review.draft.workoutDate, targetWorkout.workout_date);
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

  const nonManualPlan = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
    },
    buildFakeDeleteDependencies({
      activePlan: buildFakePlanCycle({
        userId,
        id: activePlan.id,
        sourceKind: "plan_preset_v1",
        startDate: "2026-06-18",
        endDate: "2026-06-21",
      }),
      workouts: [targetWorkout, keptWorkout],
    }),
  );
  assertDeleteReviewBlocked(
    nonManualPlan,
    "unsupported_active_plan_source",
    "non-manual delete plan",
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
  assertDeleteReviewBlocked(
    unsupported,
    "target_workout_not_supported",
    "unsupported delete target payload",
  );

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
  const protectedPast = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: pastTarget.id,
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [pastTarget, keptWorkout] }),
  );
  assertDeleteReviewBlocked(protectedPast, "protected_day", "past delete target");

  const lastWorkout = await reviewManualWorkoutDeleteClearForUser(
    userId,
    {
      activePlanId: activePlan.id,
      plannedWorkoutId: targetWorkout.id,
    },
    buildFakeDeleteDependencies({ activePlan, workouts: [targetWorkout] }),
  );
  assertDeleteReviewBlocked(
    lastWorkout,
    "last_workout_not_deletable",
    "last manual workout delete",
  );

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

async function validateManualMoveWorkoutContract() {
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
    notes: "Move this structure to another empty day.",
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
    assert.equal(moveReview.safety.targetDayWasEmpty, true);
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
    assert.equal(success.title, sourceInput.title);
    assert.equal(success.templateKey, sourceInput.templateKey);
    assert.equal(success.calendarRowCount, 2);
    assert.equal(success.nonRestWorkoutCount, 2);
    assert.equal(success.safety.movedExactlyOneRow, true);
    assert.equal(success.safety.sourceDateBecameEmpty, true);
    assert.equal(success.safety.targetDayWasEmpty, true);
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
  assertMoveConfirmBlocked(occupiedTarget, "occupied_day", "occupied move target");

  const nonManualPlan = await reviewManualWorkoutMoveForUser(
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
        sourceKind: "plan_preset_v1",
        startDate: "2026-06-18",
        endDate: "2026-06-21",
      }),
      workouts: [sourceWorkout, keptWorkout],
    }),
  );
  assertMoveReviewBlocked(nonManualPlan, "unsupported_active_plan_source", "non-manual move plan");

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

function validateManualActivePlanExportContract() {
  const userId = "00000000-0000-4000-8000-000000000601";
  const activePlan = buildFakePlanCycle({
    userId,
    id: "99999999-9999-4999-8999-000000000601",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-18",
    endDate: "2026-06-22",
  });
  const firstReview = assertReady("manual export first workout", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-18",
    title: "First manual easy run",
  });
  const savedTemplateReview = assertReady("manual export saved-template workout", {
    templateKey: "steady_aerobic_run",
    workoutDate: "2026-06-20",
    title: "Saved steady template",
  });
  const copiedReview = assertReady("manual export copied workout", {
    templateKey: "easy_run_with_strides",
    workoutDate: "2026-06-22",
    title: "Copied strides workout",
  });
  const deletedReview = assertReady("manual export deleted workout", {
    templateKey: "long_aerobic_run",
    workoutDate: "2026-06-19",
    title: "Deleted long run",
  });
  const exportedWorkouts = [
    buildCanonicalPersistedPlannedWorkoutFromReview({
      userId,
      planCycleId: activePlan.id,
      id: "99999999-9999-4999-8999-000000000602",
      review: firstReview,
    }),
    buildCanonicalPersistedPlannedWorkoutFromReview({
      userId,
      planCycleId: activePlan.id,
      id: "99999999-9999-4999-8999-000000000603",
      review: savedTemplateReview,
    }),
    buildCanonicalPersistedPlannedWorkoutFromReview({
      userId,
      planCycleId: activePlan.id,
      id: "99999999-9999-4999-8999-000000000604",
      review: copiedReview,
    }),
  ];
  const deletedWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000605",
    review: deletedReview,
  });
  const payload = buildActivePlanExportPayload({
    planCycle: activePlan,
    workouts: exportedWorkouts,
    exportedAt: "2026-06-12T12:00:00.000Z",
  });

  assert.equal(payload.plan.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(payload.plan.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
  assert.notEqual(payload.plan.planId, activePlan.id);
  assertNoUuid(payload.plan.planId, "manual export safe plan id");
  assert.equal(payload.summary.dayCount, 3);
  assert.equal(payload.summary.workoutCount, 3);
  assert.equal(payload.summary.weeksCount, 1);
  assert.deepEqual(
    payload.workouts.map((workout) => workout.date),
    ["2026-06-18", "2026-06-20", "2026-06-22"],
  );
  assert.equal(
    payload.workouts.some((workout) => workout.date === deletedWorkout.workout_date),
    false,
    "manual export should omit deleted/cleared workouts because it uses persisted active rows",
  );

  const exportedPlan = activePlanExportToTrainingPlanV2(payload);
  const parsedExport = importedPlanSchema.parse(exportedPlan);

  assert.equal(parsedExport.schema_version, "training-plan-v2");
  assert.equal(parsedExport.source_kind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(parsedExport.source_status, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
  assert.equal(parsedExport.export_metadata?.export_format_version, "hito_active_plan_export_v1");
  assert.equal(parsedExport.export_metadata?.row_counts?.day_count, 3);
  assert.equal(parsedExport.export_metadata?.row_counts?.workout_count, 3);
  assert.equal(parsedExport.export_metadata?.privacy?.internal_database_ids_omitted, true);
  assert.equal(parsedExport.planned_workouts.length, 3);
  assert.equal(
    parsedExport.planned_workouts.some((workout) => workout.date === deletedWorkout.workout_date),
    false,
    "manual JSON export should not resurrect a deleted workout",
  );

  for (const workout of parsedExport.planned_workouts) {
    assert.ok(workout.workout_id.startsWith("manual-"), "manual workout ids should be source ids.");
    assert.ok(workout.weekday, `${workout.workout_id} should preserve weekday truth.`);
    assert.ok(workout.workout_identity, `${workout.workout_id} should preserve identity.`);
    assert.equal(workout.metric_mode?.executable_mode, "structure_only_executable");
    assert.ok(workout.segments.length > 0, `${workout.workout_id} should export segments.`);

    for (const segment of workout.segments) {
      assert.ok(segment.prescription, `${workout.workout_id} segment should have prescription.`);
      assert.notEqual(
        segment.prescription?.mode,
        "none",
        `${workout.workout_id} non-rest segment should remain executable.`,
      );
    }
  }

  const json = renderPlanExportJson(payload);
  const markdown = renderPlanExportMarkdown(payload);

  assert.doesNotThrow(() => importedPlanSchema.parse(JSON.parse(json)));
  assertNoPrivateManualExportData(json, userId, activePlan, exportedWorkouts, "manual JSON export");
  assertNoFakePaceOrHrInSerialized(json, "manual JSON export");
  assert.match(json, /"source_status": "manual_user_built_plan_created"/);
  assert.match(json, /"export_format_version": "hito_active_plan_export_v1"/);

  assert.match(markdown, /First manual easy run/);
  assert.match(markdown, /Saved steady template/);
  assert.match(markdown, /Copied strides workout/);
  assert.doesNotMatch(markdown, /Deleted long run/);
  assert.match(
    markdown,
    /Executable duration, distance, repeat, work, or recovery structure; no pace or personal HR target\./,
  );
  assert.doesNotMatch(markdown, /manual_user_built_plan_v1|manual_workout_authoring_v1/);
  assertNoPrivateManualExportData(
    markdown,
    userId,
    activePlan,
    exportedWorkouts,
    "manual Markdown export",
  );
}

function validateAcceptedFixtures() {
  const rest = assertReady("rest day", {
    templateKey: "rest_day",
    workoutDate: "2026-06-15",
  });
  assert.equal(rest.draft.workoutIdentity, "rest_and_recovery");
  assert.equal(rest.draft.steps.length, 0);
  assert.equal(rest.draft.metricMode.executable_mode, "none");

  const easy = assertReady("easy aerobic", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
  });
  assert.equal(easy.draft.workoutIdentity, "easy_aerobic_run");
  assert.equal(easy.draft.metricMode.executable_mode, "structure_only_executable");
  assertNumericStructure(easy.draft.steps, "easy aerobic");
  assertNoFakePaceOrHr(easy.draft.steps, "easy aerobic");

  const longRun = assertReady("long run multi-block", {
    templateKey: "long_aerobic_run",
    workoutDate: "2026-06-21",
    entries: [
      {
        kind: "block",
        block: { blockKey: "warmup_block", durationSeconds: 10 * 60, label: "Opener" },
      },
      {
        kind: "block",
        block: { blockKey: "long_run_body_block", durationSeconds: 75 * 60 },
      },
      {
        kind: "block",
        block: { blockKey: "cooldown_block", durationSeconds: 5 * 60 },
      },
    ],
  });
  assert.equal(longRun.draft.workoutIdentity, "long_aerobic_run");
  assert.equal(longRun.draft.steps.length, 3);
  assert.ok(longRun.draft.totalDurationMin > 60);
  assertNumericStructure(longRun.draft.steps, "long run");

  const intervals = assertReady("interval repeat with recovery", {
    templateKey: "time_intervals",
    workoutDate: "2026-06-18",
  });
  assert.equal(intervals.draft.workoutIdentity, "time_intervals");
  assertRepeatWithRecovery(intervals.draft.steps, "time intervals");

  const hills = assertReady("hill repeat with recovery", {
    templateKey: "uphill_repeats",
    workoutDate: "2026-06-19",
  });
  assert.equal(hills.draft.workoutIdentity, "uphill_repeats");
  assertRepeatWithRecovery(hills.draft.steps, "uphill repeats");

  const runWalk = assertReady("run-walk repeat", {
    templateKey: "run_walk_adaptation",
    workoutDate: "2026-06-17",
  });
  assert.equal(runWalk.draft.workoutIdentity, "recovery_jog");
  assert.ok(
    runWalk.draft.mappingGaps.some((gap) => gap.includes("run_walk_adaptation")),
    "Run-walk accepted fixture should report the canonical identity mapping gap.",
  );
  assertRepeatWithRecovery(runWalk.draft.steps, "run-walk");
}

function validateRejectedFixtures() {
  assertRejected(
    "nested repeat",
    {
      templateKey: "time_intervals",
      workoutDate: "2026-06-18",
      entries: [
        {
          kind: "repeat_group",
          group: {
            repeatCount: 4,
            safetyKind: "intervals",
            workBlock: { blockKey: "interval_work_block", durationSeconds: 60 },
            recoveryBlock: { blockKey: "interval_recovery_block", durationSeconds: 60 },
            nestedRepeatGroup: { repeatCount: 2 },
          },
        },
      ],
    },
    "nested_repeat_not_supported",
  );

  assertRejected(
    "repeated intensity without recovery",
    {
      templateKey: "time_intervals",
      workoutDate: "2026-06-18",
      entries: [
        {
          kind: "block",
          block: { blockKey: "warmup_block", durationSeconds: 15 * 60 },
        },
        {
          kind: "repeat_group",
          group: {
            repeatCount: 6,
            safetyKind: "intervals",
            workBlock: { blockKey: "interval_work_block", durationSeconds: 2 * 60 },
          },
        },
        {
          kind: "block",
          block: { blockKey: "cooldown_block", durationSeconds: 10 * 60 },
        },
      ],
    },
    "missing_recovery",
  );

  assertRejected(
    "fake precise pace",
    {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-06-16",
      entries: [
        {
          kind: "block",
          block: {
            blockKey: "easy_run_block",
            durationSeconds: 30 * 60,
            target: { paceMinPerKmRange: "5:10-5:25/km" },
          },
        },
      ],
    },
    "unsafe_metric_truth",
  );

  assertRejected(
    "fake personal HR",
    {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-06-16",
      entries: [
        {
          kind: "block",
          block: {
            blockKey: "easy_run_block",
            durationSeconds: 30 * 60,
            target: { hrTargetSource: "personal_hr_zone", hrBpmRange: "145-155" },
          },
        },
      ],
    },
    "unsafe_metric_truth",
  );

  assertRejected(
    "unknown manual-only identity",
    {
      templateKey: "manual_only_magic_session",
      workoutDate: "2026-06-16",
    },
    "invalid_input",
  );
}

function validateStableReviewExactness() {
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    notes: "Keep it easy.",
  };
  const first = assertReady("stable review first", input);
  const second = assertReady("stable review second", input);
  const changedDate = assertReady("stable review changed date", {
    ...input,
    workoutDate: "2026-06-17",
  });

  assert.equal(first.reviewChecksum, second.reviewChecksum);
  assert.equal(first.reviewToken, second.reviewToken);
  assert.notEqual(first.reviewChecksum, changedDate.reviewChecksum);
  assert.equal(first.draft.sourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
  assert.equal(first.draft.source_kind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
  assert.equal(first.draft.persisted, false);
}

function validateProtectedConflictShape() {
  const result = reviewManualWorkoutDraft({
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    context: {
      mode: "user_built_plan_draft",
      targetDateProtection: "logged_workout",
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "draft_rejected");
  assert.equal(result.reason, "protected_date_conflict");
  assert.equal(result.persisted, false);
  assert.equal(result.conflicts.length, 1);
}

async function validateManualConfirmPersistenceContract() {
  const userId = "00000000-0000-4000-8000-000000000101";
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    notes: "Keep it easy.",
  };
  const reviewed = assertReady("manual confirm review", input);
  const persisted: Array<{
    userId: string;
    canonicalPlan: TrainingPlanV2;
    metadata: AdditionalPlanPersistenceMetadata | null;
  }> = [];

  const success = await confirmManualWorkoutDraftForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeConfirmDependencies({
      onPersist: (record) => persisted.push(record),
    }),
  );

  assert.equal(success.ok, true, formatConfirmResult(success));
  if (success.ok) {
    assert.equal(success.persisted, true);
    assert.equal(success.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(success.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
    assert.equal(success.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(success.calendarRowCount, 1);
    assert.equal(success.nonRestWorkoutCount, 1);
    assert.equal(success.safety.trustedClientRows, false);
    assert.equal(success.safety.serverRebuiltReview, true);
    assert.equal(success.safety.callsOpenAi, false);
    assert.equal(success.sourceMetadata.reviewChecksum, reviewed.reviewChecksum);
    assert.equal(success.sourceMetadata.metricTruthMode, "structure_only");
  }

  assert.equal(persisted.length, 1);
  const persistedRecord = persisted[0]!;
  assert.equal(persistedRecord.userId, userId);
  assert.equal(persistedRecord.canonicalPlan.source_kind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(persistedRecord.canonicalPlan.planned_workouts.length, 1);
  assert.equal(persistedRecord.canonicalPlan.planned_workouts[0]!.date, input.workoutDate);
  assert.equal(
    persistedRecord.canonicalPlan.planned_workouts[0]!.workout_identity,
    "easy_aerobic_run",
  );
  assertNumericV2Segments(persistedRecord.canonicalPlan, "persisted manual plan");
  assertManualPersistenceMetadata(
    persistedRecord.metadata,
    reviewed.reviewChecksum,
    input.workoutDate,
  );

  const changedDate = await confirmManualWorkoutDraftForUser(
    userId,
    buildConfirmInput({ ...input, workoutDate: "2026-06-17" }, reviewed),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(changedDate, "stale_review", "changed date");

  const changedTemplate = await confirmManualWorkoutDraftForUser(
    userId,
    buildConfirmInput({ ...input, templateKey: "steady_aerobic_run" }, reviewed),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(changedTemplate, "stale_review", "changed template");

  const changedEntries = await confirmManualWorkoutDraftForUser(
    userId,
    buildConfirmInput(
      {
        ...input,
        entries: [
          {
            kind: "block",
            block: { blockKey: "easy_run_block", durationSeconds: 25 * 60 },
          },
        ],
      },
      reviewed,
    ),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(changedEntries, "stale_review", "changed entries");

  const invalidToken = await confirmManualWorkoutDraftForUser(
    userId,
    {
      ...buildConfirmInput(input, reviewed),
      reviewToken: `${reviewed.reviewToken.slice(0, -1)}${
        reviewed.reviewToken.endsWith("0") ? "1" : "0"
      }`,
    },
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(invalidToken, "invalid_review", "invalid token");

  const staleChecksum = await confirmManualWorkoutDraftForUser(
    userId,
    {
      ...buildConfirmInput(input, reviewed),
      reviewChecksum: "0".repeat(64),
    },
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(staleChecksum, "stale_review", "stale checksum");

  const protectedDate = await confirmManualWorkoutDraftForUser(
    userId,
    buildConfirmInput(
      {
        ...input,
        context: {
          mode: "user_built_plan_draft",
          targetDateProtection: "logged_workout",
        },
      },
      reviewed,
    ),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(protectedDate, "protected_date_conflict", "protected date");

  const activePlanConflict = await confirmManualWorkoutDraftForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeConfirmDependencies({
      activePlan: { id: "active-plan-id" },
    }),
  );
  assertConfirmBlocked(activePlanConflict, "active_plan_exists", "active plan conflict");

  const restReview = assertReady("rest confirm review", {
    templateKey: "rest_day",
    workoutDate: "2026-06-15",
  });
  const restOnly = await confirmManualWorkoutDraftForUser(
    userId,
    buildConfirmInput({ templateKey: "rest_day", workoutDate: "2026-06-15" }, restReview),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(restOnly, "manual_workout_required", "rest-only first plan");

  const clientRowsAttempt = await confirmManualWorkoutDraftForUser(
    userId,
    {
      ...buildConfirmInput(input, reviewed),
      canonicalPlan: persistedRecord.canonicalPlan,
    },
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(clientRowsAttempt, "invalid_review", "client-sent row payload");

  const persistenceFailure = await confirmManualWorkoutDraftForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeConfirmDependencies({ persistError: new Error("simulated insert failure") }),
  );
  assertConfirmBlocked(persistenceFailure, "persistence_failed", "persistence failure");

  const exactness = validateManualWorkoutReviewExactness(buildConfirmInput(input, reviewed));
  assert.equal(exactness.ok, true);
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

function assertRejected(
  label: string,
  input: unknown,
  expectedIssueCode: string,
): Extract<ManualWorkoutDraftReviewResult, { ok: false }> {
  const result = reviewManualWorkoutDraft(input);

  assert.equal(result.ok, false, `${label} should be rejected.`);
  assert.equal(result.status, "draft_rejected");
  assert.equal(result.persisted, false);
  assert.ok(
    result.issues.some((issue) => issue.code === expectedIssueCode),
    `${label} should include ${expectedIssueCode}; got ${formatResult(result)}`,
  );

  return result;
}

type ConfirmDependencies = NonNullable<Parameters<typeof confirmManualWorkoutDraftForUser>[2]>;
type AddDependencies = NonNullable<Parameters<typeof addManualWorkoutToActivePlanForUser>[2]>;
type DeleteDependencies = NonNullable<Parameters<typeof reviewManualWorkoutDeleteClearForUser>[2]>;
type MoveDependencies = NonNullable<Parameters<typeof reviewManualWorkoutMoveForUser>[2]>;
type SavedTemplateRow = Awaited<ReturnType<ManualWorkoutSavedTemplateRepository["insertTemplate"]>>;
type SavedTemplateInsert = Parameters<ManualWorkoutSavedTemplateRepository["insertTemplate"]>[0];
type FakeSavedTemplateRepository = ManualWorkoutSavedTemplateRepository & {
  rows: () => SavedTemplateRow[];
  addRawTemplate: (row: SavedTemplateRow) => void;
};

function buildConfirmInput(
  draftInput: unknown,
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>,
) {
  return {
    draftInput,
    reviewToken: review.reviewToken,
    reviewChecksum: review.reviewChecksum,
  };
}

function buildFakeSavedTemplateRepository(): FakeSavedTemplateRepository {
  const rows: SavedTemplateRow[] = [];
  let nextId = 1;

  return {
    rows: () => [...rows],
    addRawTemplate: (row) => {
      rows.push(row);
    },
    async insertTemplate(row: SavedTemplateInsert): Promise<SavedTemplateRow> {
      const now = `2026-06-10T00:00:0${nextId}.000Z`;
      const saved: SavedTemplateRow = {
        id: `88888888-8888-4888-8888-${String(nextId).padStart(12, "0")}`,
        created_at: row.created_at ?? now,
        updated_at: row.updated_at ?? now,
        display_name: row.display_name,
        draft_payload: row.draft_payload,
        icon_key: row.icon_key,
        review_payload_version: row.review_payload_version ?? "manual_workout_review_payload_v1",
        source_kind: row.source_kind ?? MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
        source_review_checksum: row.source_review_checksum,
        source_status: row.source_status ?? MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
        source_workout_family: row.source_workout_family,
        source_workout_identity: row.source_workout_identity,
        target_truth_mode: row.target_truth_mode,
        template_key: row.template_key,
        template_version: row.template_version ?? "manual_workout_template_registry_v1",
        user_id: row.user_id,
        workout_source_kind: row.workout_source_kind ?? MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      };

      nextId += 1;
      rows.push(saved);

      return saved;
    },
    async listTemplatesForUser(userId: string) {
      return rows.filter((row) => row.user_id === userId);
    },
    async getTemplateForUser(userId: string, templateId: string) {
      return rows.find((row) => row.user_id === userId && row.id === templateId) ?? null;
    },
  };
}

function buildFakeConfirmDependencies(
  input: {
    activePlan?: unknown;
    persistError?: Error;
    onPersist?: (record: {
      userId: string;
      canonicalPlan: TrainingPlanV2;
      metadata: AdditionalPlanPersistenceMetadata | null;
    }) => void;
  } = {},
): ConfirmDependencies {
  return {
    getActivePlanForUser: async () => input.activePlan as never,
    createFirstPlanForUser: async (userId, canonicalPlan, _profilePatch, metadata) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.({ userId, canonicalPlan, metadata });

      return {
        ok: true,
        status: "applied",
        effectiveStartDate: canonicalPlan.start_date,
        appliedStartDate: canonicalPlan.start_date,
        normalizedFromStartDate: null,
        firstDayResolution: null,
        workoutCount: canonicalPlan.planned_workouts.filter(
          (workout) => workout.workout_type !== "rest",
        ).length,
      };
    },
  };
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

function buildFakeMoveDependencies(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  persistError?: Error;
  onPersist?: (record: Parameters<NonNullable<MoveDependencies["persistWorkoutMove"]>>[0]) => void;
}): MoveDependencies {
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
    persistWorkoutMove: async (record) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.(record);

      return {
        movedWorkout: {
          ...record.sourceWorkout,
          workout_date: record.review.targetDate,
          weekday: record.review.targetWeekday,
          week_number: record.targetWeekNumber,
        },
        planCycle: {
          ...record.activePlan,
          end_date: [...record.otherWorkouts, record.sourceWorkout]
            .map((workout) =>
              workout.id === record.sourceWorkout.id
                ? record.review.targetDate
                : workout.workout_date,
            )
            .sort()
            .at(-1)!,
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
    goal_metadata: {
      manual_user_built_plan: {
        source_kind: sourceKind,
        source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
      },
    },
    plan_preferences: {
      manual_workout_authoring_reviews: [],
    },
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

function assertConfirmBlocked(
  result: ManualWorkoutConfirmResult,
  reason: Extract<ManualWorkoutConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatConfirmResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertAddBlocked(
  result: ManualWorkoutAddToActivePlanResult,
  reason: Extract<ManualWorkoutAddToActivePlanResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatAddResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertSavedTemplateSaved(result: ManualWorkoutSavedTemplateSaveResult, label: string) {
  assert.equal(result.ok, true, `${label} should save: ${JSON.stringify(result, null, 2)}`);

  if (result.ok) {
    assert.equal(result.status, "saved");
    assert.equal(result.persisted, true);
  }
}

function assertSavedTemplateBlocked(
  result: ManualWorkoutSavedTemplateSaveResult,
  reason: Extract<ManualWorkoutSavedTemplateSaveResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${JSON.stringify(result, null, 2)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
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

function assertDeleteReviewBlocked(
  result: ManualWorkoutDeleteClearReviewResult,
  reason: Extract<ManualWorkoutDeleteClearReviewResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatDeleteReviewResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertDeleteConfirmBlocked(
  result: ManualWorkoutDeleteClearConfirmResult,
  reason: Extract<ManualWorkoutDeleteClearConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(
    result.ok,
    false,
    `${label} should be blocked: ${formatDeleteConfirmResult(result)}`,
  );

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertMoveReviewBlocked(
  result: ManualWorkoutMoveReviewResult,
  reason: Extract<ManualWorkoutMoveReviewResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatMoveReviewResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertMoveConfirmBlocked(
  result: ManualWorkoutMoveConfirmResult,
  reason: Extract<ManualWorkoutMoveConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatMoveConfirmResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function assertNumericV2Segments(plan: TrainingPlanV2, label: string) {
  for (const workout of plan.planned_workouts) {
    if (workout.workout_type === "rest") {
      continue;
    }

    assert.ok(workout.segments.length > 0, `${label} should have rich segments.`);

    for (const segment of workout.segments) {
      assert.ok(segment.prescription, `${label} segment should have a prescription.`);
      assert.notEqual(
        segment.prescription.mode,
        "none",
        `${label} non-rest segment should be executable.`,
      );
    }
  }
}

function assertManualPersistenceMetadata(
  metadata: AdditionalPlanPersistenceMetadata | null,
  reviewChecksum: string,
  workoutDate: string,
) {
  assert.ok(metadata?.goalMetadata, "manual confirm should persist goal metadata.");
  assert.ok(metadata?.planPreferences, "manual confirm should persist plan preference metadata.");

  const goalMetadata = metadata.goalMetadata as {
    manual_user_built_plan?: {
      source_kind?: string;
      source_status?: string;
      workout_authoring_source_kind?: string;
      template_key?: string;
      workout_date?: string;
      row_count?: number;
      review_payload_version?: string;
      review_checksum?: string;
      metric_truth_mode?: string;
    };
  };
  const manualMetadata = goalMetadata.manual_user_built_plan;

  assert.equal(manualMetadata?.source_kind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(manualMetadata?.source_status, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
  assert.equal(manualMetadata?.workout_authoring_source_kind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
  assert.equal(manualMetadata?.template_key, "easy_aerobic_run");
  assert.equal(manualMetadata?.workout_date, workoutDate);
  assert.equal(manualMetadata?.row_count, 1);
  assert.equal(manualMetadata?.review_checksum, reviewChecksum);
  assert.equal(manualMetadata?.metric_truth_mode, "structure_only");
}

function assertNumericStructure(steps: Step[], label: string) {
  assert.ok(steps.length > 0, `${label} should have steps.`);

  for (const step of steps) {
    assert.ok(
      hasExecutableStructure(step),
      `${label} step ${step.label ?? step.type} should have numeric executable structure.`,
    );
  }
}

function assertRepeatWithRecovery(steps: Step[], label: string) {
  const repeatStep = steps.find((step) => step.repeats);

  assert.ok(repeatStep, `${label} should include a repeat step.`);
  assert.ok(repeatStep.repeats && repeatStep.repeats >= 2);
  assert.ok(repeatStep.work, `${label} repeat should include work.`);
  assert.ok(repeatStep.recovery, `${label} repeat should include recovery.`);
  assert.ok(hasExecutableStructure(repeatStep.work), `${label} repeat work should be numeric.`);
  assert.ok(
    hasExecutableStructure(repeatStep.recovery),
    `${label} repeat recovery should be numeric.`,
  );
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
  assert.equal(
    repeatStep?.work?.type,
    "work",
    `${label} persisted strides work block should use canonical nested work type.`,
  );
  assert.equal(
    repeatStep?.work?.segment_type,
    undefined,
    `${label} should prove copy reconstruction does not rely on nested stride labels.`,
  );
  assert.equal(
    repeatStep?.recovery?.type,
    "recovery",
    `${label} persisted strides recovery block should stay canonical.`,
  );
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

function assertNoFakePaceOrHrInSerialized(value: unknown, label: string) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(
    serialized,
    /paceMinPerKmRange|pace_min_per_km_range|"pace"/i,
    `${label} should not include fake pace truth.`,
  );
  assert.doesNotMatch(
    serialized,
    /personal_hr_zone|hrBpmRange|hr_bpm_range/i,
    `${label} should not include fake personal HR truth.`,
  );
}

function assertNoPrivateManualExportData(
  serialized: string,
  userId: string,
  activePlan: PersistedPlanCycleRow,
  exportedWorkouts: PersistedPlannedWorkoutRow[],
  label: string,
) {
  assert.doesNotMatch(serialized, new RegExp(escapeRegExp(userId)), `${label} leaked user id.`);
  assert.doesNotMatch(
    serialized,
    new RegExp(escapeRegExp(activePlan.id)),
    `${label} leaked internal plan id.`,
  );

  for (const workout of exportedWorkouts) {
    assert.doesNotMatch(
      serialized,
      new RegExp(escapeRegExp(workout.id)),
      `${label} leaked internal workout id ${workout.id}.`,
    );
  }

  assert.doesNotMatch(serialized, /supabase\.co|service_role|anon[_-]?key|access_token/i);
}

function assertNoUuid(value: string, label: string) {
  assert.doesNotMatch(
    value,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
    `${label} should not expose a raw UUID.`,
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasExecutableStructure(step: Step) {
  if (step.duration_min || step.distance_km) {
    return true;
  }

  if (step.repeats && step.work && step.recovery) {
    return hasExecutableStructure(step.work) && hasExecutableStructure(step.recovery);
  }

  return false;
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

function formatConfirmResult(result: ManualWorkoutConfirmResult) {
  return JSON.stringify(result, null, 2);
}

function formatAddResult(result: ManualWorkoutAddToActivePlanResult) {
  return JSON.stringify(result, null, 2);
}

function formatCopyPasteReviewResult(result: ManualWorkoutCopyPasteReviewResult) {
  return JSON.stringify(result, null, 2);
}

function formatCopyPasteConfirmResult(result: ManualWorkoutCopyPasteConfirmResult) {
  return JSON.stringify(result, null, 2);
}

function formatDeleteReviewResult(result: ManualWorkoutDeleteClearReviewResult) {
  return JSON.stringify(result, null, 2);
}

function formatDeleteConfirmResult(result: ManualWorkoutDeleteClearConfirmResult) {
  return JSON.stringify(result, null, 2);
}

function formatMoveReviewResult(result: ManualWorkoutMoveReviewResult) {
  return JSON.stringify(result, null, 2);
}

function formatMoveConfirmResult(result: ManualWorkoutMoveConfirmResult) {
  return JSON.stringify(result, null, 2);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
