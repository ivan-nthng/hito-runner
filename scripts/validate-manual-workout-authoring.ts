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
  confirmManualWorkoutDraftForUser,
  listManualWorkoutSavedTemplatesForUser,
  reviewManualWorkoutCopyPasteDraftForUser,
  reviewManualWorkoutSavedTemplateForUser,
  reviewManualWorkoutDraft,
  saveManualWorkoutSavedTemplateForUser,
  validateManualWorkoutReviewExactness,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutConfirmResult,
  type ManualWorkoutCopyPasteConfirmResult,
  type ManualWorkoutCopyPasteReviewResult,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutSavedTemplateRepository,
  type ManualWorkoutSavedTemplateSaveResult,
} from "../src/lib/manual-workout-authoring";
import type {
  ExistingPlanContext,
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../src/lib/active-plan-persistence";
import { buildImportedPlanSeed, type TrainingPlanV2 } from "../src/lib/imported-plan";
import type { AdditionalPlanPersistenceMetadata } from "../src/lib/plan-authoring-snapshot";
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

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
