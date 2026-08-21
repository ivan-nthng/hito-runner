import assert from "node:assert/strict";
import {
  MANUAL_SAVED_WORKOUT_TEMPLATE_PAYLOAD_VERSION,
  MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
  MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
  deleteManualWorkoutSavedTemplateForUser,
  initializeWorkoutDocumentForUser,
  listManualWorkoutSavedTemplatesForUser,
  reviewManualWorkoutSavedTemplateForUser,
  saveManualWorkoutSavedTemplateForUser,
  type ManualWorkoutDraftInput,
  type ManualWorkoutSavedTemplateRepository,
  type ManualWorkoutSavedTemplateSaveResult,
} from "../../src/lib/manual-workout-authoring";
import {
  confirmWorkoutCommand,
  reviewWorkoutCommand,
} from "../../src/lib/workout-authoring-review";
import type { WorkoutDocument } from "../../src/lib/workout-document";
import type { Step } from "../../src/lib/training";
import {
  assertManualBlockedResult,
  assertNoFakePaceOrHrInSerialized,
  assertRepeatWithRecovery,
  flattenSteps,
  formatJsonResult,
} from "./move-proof-assertions";
import { assertReady, buildReviewConfirmInput } from "./move-proof-fixtures";

type SavedTemplateRow = Awaited<ReturnType<ManualWorkoutSavedTemplateRepository["insertTemplate"]>>;
type SavedTemplateInsert = Parameters<ManualWorkoutSavedTemplateRepository["insertTemplate"]>[0];
type FakeSavedTemplateRepository = ManualWorkoutSavedTemplateRepository & {
  rows: () => SavedTemplateRow[];
  addRawTemplate: (row: SavedTemplateRow) => void;
  payloadReplacementCount: () => number;
};

export async function validateManualSavedTemplateContract() {
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
  const reviewedNestedSegmentIds = reviewed.document.steps.flatMap(
    (section) => section.prescription?.children?.map((child) => child.segment_id) ?? [],
  );
  assert.ok(
    reviewedNestedSegmentIds.length > 0,
    "saved Repeat template proof requires nested canonical segment identity",
  );
  assert.equal(
    new Set(reviewedNestedSegmentIds).size,
    reviewedNestedSegmentIds.length,
    "saved Repeat template child identity must be unique",
  );
  const saveResult = await saveManualWorkoutSavedTemplateForUser(
    userId,
    {
      displayName: "  My relaxed strides  ",
      iconKey: "easy",
      ...buildReviewConfirmInput(input, reviewed),
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
  assert.equal(
    saveResult.template.draftPayload.version,
    MANUAL_SAVED_WORKOUT_TEMPLATE_PAYLOAD_VERSION,
  );
  assert.deepEqual(
    saveResult.template.draftPayload.document,
    reviewed.draft,
    "new saved-template writes should retain the exact canonical WorkoutDocument initializer",
  );
  assert.equal(
    (repository.rows()[0]?.draft_payload as { version?: unknown }).version,
    MANUAL_SAVED_WORKOUT_TEMPLATE_PAYLOAD_VERSION,
    "new saved-template rows should write only the v2 payload",
  );
  assertNoFakePaceOrHrInSerialized(saveResult.template.draftPayload, "saved template payload");

  const readback = await listManualWorkoutSavedTemplatesForUser(userId, { repository });
  assert.equal(readback.ok, true, JSON.stringify(readback, null, 2));
  if (readback.ok) {
    assert.equal(readback.sourceKind, MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND);
    assert.equal(readback.templates.length, 1);
    assert.equal(readback.templates[0]?.id, saveResult.template.id);
    assert.equal(readback.safety.currentUserScoped, true);
  }

  const legacyInitializer = await initializeWorkoutDocumentForUser(
    userId,
    {
      origin: "saved_template",
      templateId: saveResult.template.id,
      workoutDate: "2026-06-24",
    },
    { savedTemplateRepository: repository },
  );
  assert.equal(legacyInitializer.ok, true, JSON.stringify(legacyInitializer));
  if (legacyInitializer.ok) {
    assert.equal(legacyInitializer.origin, "saved_template");
    assert.equal(legacyInitializer.document.workoutDate, "2026-06-24");
    assert.equal(legacyInitializer.document.weekday, "Wednesday");
    assert.deepEqual(legacyInitializer.document.steps, reviewed.document.steps);
  }

  const canonicalTemplateId = "66666666-6666-4666-8666-666666666666";
  repository.addRawTemplate({
    ...repository.rows()[0]!,
    id: canonicalTemplateId,
    display_name: "Canonical saved source",
    source_review_checksum: "c".repeat(64),
    template_key: reviewed.document.sourceWorkoutType ?? "workout_document",
    source_workout_identity: reviewed.document.workoutIdentity,
    source_workout_family: reviewed.document.workoutFamily,
    target_truth_mode: reviewed.document.workoutType === "rest" ? "none" : "structure_only",
    draft_payload: {
      version: WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
      content: workoutDocumentContent(reviewed.document),
      provenance: { rootSource: "manual", retainedSource: "canonical-template" },
    },
  });
  const canonicalCatalog = await listManualWorkoutSavedTemplatesForUser(userId, { repository });
  assert.equal(canonicalCatalog.ok, true, JSON.stringify(canonicalCatalog, null, 2));
  if (canonicalCatalog.ok) {
    const canonicalCatalogEntry = canonicalCatalog.templates.find(
      (template) => template.id === canonicalTemplateId,
    );
    assert.ok(canonicalCatalogEntry, "the canonical saved template must remain catalog-readable");
    assert.equal(
      canonicalCatalogEntry?.draftPayload.version,
      WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
    );
    assert.deepEqual(
      Object.keys(canonicalCatalogEntry?.draftPayload ?? {}).sort(),
      ["totalDistanceKm", "totalDurationMin", "version"],
      "the catalog may expose only canonical summary facts, never an editable payload",
    );
  }
  const canonicalInitializer = await initializeWorkoutDocumentForUser(
    userId,
    { origin: "saved_template", templateId: canonicalTemplateId, workoutDate: "2026-07-09" },
    { savedTemplateRepository: repository },
  );
  assert.equal(canonicalInitializer.ok, true, JSON.stringify(canonicalInitializer));
  if (canonicalInitializer.ok) {
    assert.equal(canonicalInitializer.document.workoutDate, "2026-07-09");
    assert.equal(canonicalInitializer.document.weekday, "Thursday");
    assert.equal(canonicalInitializer.document.title, reviewed.document.title);
    assert.deepEqual(canonicalInitializer.document.steps, reviewed.document.steps);
    assert.deepEqual(canonicalInitializer.provenanceReference, {
      initializer: "saved_template",
      templateId: canonicalTemplateId,
      sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
      sourceStatus: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
      sourceReviewChecksum: "c".repeat(64),
      payloadVersion: WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
      sourceProvenance: { rootSource: "manual", retainedSource: "canonical-template" },
    });
    const commandReview = reviewWorkoutCommand({
      command: {
        operation: "materialize",
        documents: [canonicalInitializer.document],
        provenanceReferences: [canonicalInitializer.provenanceReference],
      },
    });
    assert.equal(commandReview.ok, true, JSON.stringify(commandReview));
    if (commandReview.ok) {
      const reviewedCommand = structuredClone(commandReview.candidate.command);
      assert.equal(
        await repository.deleteTemplateForUser(userId, canonicalTemplateId),
        true,
        "the source fixture should be removable after initialization",
      );
      const confirmed = confirmWorkoutCommand({
        candidate: commandReview.candidate,
        candidateId: commandReview.candidate.candidateId,
        reviewToken: commandReview.candidate.reviewToken,
        reviewChecksum: commandReview.candidate.reviewChecksum,
      });
      assert.equal(confirmed.ok, true, "source removal must not alter the reviewed command");
      if (confirmed.ok) {
        assert.deepEqual(confirmed.candidate.command, reviewedCommand);
      }
    }
  }

  const missingInitializer = await initializeWorkoutDocumentForUser(
    userId,
    {
      origin: "saved_template",
      templateId: "55555555-5555-4555-8555-555555555555",
      workoutDate: "2026-07-09",
    },
    { savedTemplateRepository: repository },
  );
  assert.equal(missingInitializer.ok, false);
  if (!missingInitializer.ok) assert.equal(missingInitializer.reason, "not_found");

  const otherUserReadback = await listManualWorkoutSavedTemplatesForUser(otherUserId, {
    repository,
  });
  assert.equal(otherUserReadback.ok, true, JSON.stringify(otherUserReadback, null, 2));
  if (otherUserReadback.ok) {
    assert.equal(otherUserReadback.templates.length, 0);
  }
  const foreignInitializer = await initializeWorkoutDocumentForUser(
    otherUserId,
    {
      origin: "saved_template",
      templateId: saveResult.template.id,
      workoutDate: "2026-07-09",
    },
    { savedTemplateRepository: repository },
  );
  assert.equal(foreignInitializer.ok, false);
  if (!foreignInitializer.ok) assert.equal(foreignInitializer.reason, "not_found");

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
    assert.deepEqual(reconstructed.document, reconstructed.review.document);
    assert.deepEqual(reconstructed.candidate, reconstructed.review.candidate);
    assert.equal(reconstructed.candidate.command.operation, "materialize");
    if (reconstructed.candidate.command.operation !== "materialize") return;
    assert.deepEqual(reconstructed.candidate.command.documents, [reconstructed.document]);
    assert.equal(reconstructed.review.draft.workoutDate, "2026-06-25");
    assert.equal(reconstructed.review.draft.title, "My relaxed strides");
    assert.equal(reconstructed.review.reviewMetadata.templateKey, input.templateKey);
    assert.equal(reconstructed.safety.reviewedThroughManualAuthoring, true);
    assert.equal(reconstructed.safety.trustedClientRows, false);
    assertRepeatWithRecovery(reconstructed.review.draft.steps, "saved-template review");
  }

  const v1TemplateId = "77777777-7777-4777-8777-777777777777";
  repository.addRawTemplate({
    ...repository.rows()[0]!,
    id: v1TemplateId,
    draft_payload: {
      version: "manual_saved_workout_template_payload_v1",
      templateKey: saveResult.template.templateKey,
      templateVersion: saveResult.template.templateVersion,
      sourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      sourceReviewPayloadVersion: "manual_workout_review_payload_v1",
      sourceReviewChecksum: saveResult.template.sourceReviewChecksum,
      sourceWorkoutDate: saveResult.template.draftPayload.sourceWorkoutDate,
      sourceTitle: saveResult.template.draftPayload.sourceTitle,
      sourceNotes: saveResult.template.draftPayload.sourceNotes,
      sourceWorkoutIdentity: saveResult.template.sourceWorkoutIdentity,
      sourceWorkoutFamily: saveResult.template.sourceWorkoutFamily,
      sourceCalendarIconKey: saveResult.template.draftPayload.sourceCalendarIconKey,
      targetTruthMode: saveResult.template.targetTruthMode,
      entries: saveResult.template.draftPayload.entries,
      totalDurationMin: saveResult.template.draftPayload.totalDurationMin,
      totalDistanceKm: saveResult.template.draftPayload.totalDistanceKm,
      mappingGaps: saveResult.template.draftPayload.mappingGaps,
    },
  });
  const v1Reconstructed = await reviewManualWorkoutSavedTemplateForUser(
    userId,
    { templateId: v1TemplateId, workoutDate: "2026-06-27" },
    { repository },
  );
  assert.equal(v1Reconstructed.ok, true, JSON.stringify(v1Reconstructed));
  assert.equal(repository.payloadReplacementCount(), 1, "v1 should upgrade exactly once");
  assert.equal(
    (
      repository.rows().find((row) => row.id === v1TemplateId)?.draft_payload as {
        version?: unknown;
      }
    ).version,
    MANUAL_SAVED_WORKOUT_TEMPLATE_PAYLOAD_VERSION,
    "the bounded v1 reader should replace the row with canonical v2",
  );
  const v1SecondRead = await reviewManualWorkoutSavedTemplateForUser(
    userId,
    { templateId: v1TemplateId, workoutDate: "2026-06-28" },
    { repository },
  );
  assert.equal(v1SecondRead.ok, true, JSON.stringify(v1SecondRead));
  assert.equal(
    repository.payloadReplacementCount(),
    1,
    "a second v2 read should not rewrite identity-bearing source data",
  );

  const userEnteredTargetInput: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-18",
    title: "Pace target I chose",
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
  };
  const userEnteredTargetReviewed = assertReady(
    "saved template runner-entered target source review",
    userEnteredTargetInput,
  );
  const userEnteredTargetSave = await saveManualWorkoutSavedTemplateForUser(
    userId,
    {
      displayName: "My pace target",
      iconKey: "easy",
      ...buildReviewConfirmInput(userEnteredTargetInput, userEnteredTargetReviewed),
    },
    { repository },
  );
  assertSavedTemplateSaved(userEnteredTargetSave, "saved runner-entered target template");
  if (userEnteredTargetSave.ok) {
    const targetReconstructed = await reviewManualWorkoutSavedTemplateForUser(
      userId,
      {
        templateId: userEnteredTargetSave.template.id,
        workoutDate: "2026-06-26",
      },
      { repository },
    );

    assert.equal(targetReconstructed.ok, true, JSON.stringify(targetReconstructed, null, 2));
    if (targetReconstructed.ok) {
      assertUserEnteredTargetInSteps(
        targetReconstructed.review.draft.steps,
        "pace_min_per_km_range",
        "saved-template runner-entered pace target",
      );
    }
  }

  for (const targetCase of [
    {
      label: "BPM",
      key: "hr_bpm_range" as const,
      target: {
        targetSource: "user_entered" as const,
        hrTargetSource: "user_entered" as const,
        hrBpmRange: "145-155 bpm",
      },
    },
    {
      label: "RPE",
      key: "rpe" as const,
      target: { targetSource: "user_entered" as const, rpe: 6 },
    },
  ]) {
    const targetInput: ManualWorkoutDraftInput = {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-06-18",
      entries: [
        {
          kind: "block",
          block: {
            blockKey: "easy_run_block",
            durationSeconds: 30 * 60,
            target: targetCase.target,
          },
        },
      ],
    };
    const targetReview = assertReady(`saved template ${targetCase.label} review`, targetInput);
    const targetSave = await saveManualWorkoutSavedTemplateForUser(
      userId,
      {
        displayName: `My ${targetCase.label} target`,
        iconKey: "easy",
        ...buildReviewConfirmInput(targetInput, targetReview),
      },
      { repository },
    );
    assertSavedTemplateSaved(targetSave, `saved runner-entered ${targetCase.label} template`);
    if (targetSave.ok) {
      const targetReconstructed = await reviewManualWorkoutSavedTemplateForUser(
        userId,
        { templateId: targetSave.template.id, workoutDate: "2026-06-26" },
        { repository },
      );
      assert.equal(targetReconstructed.ok, true, JSON.stringify(targetReconstructed));
      if (targetReconstructed.ok) {
        assertUserEnteredTargetInSteps(
          targetReconstructed.review.draft.steps,
          targetCase.key,
          `saved-template runner-entered ${targetCase.label} target`,
        );
      }
    }
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
  const crossUserInitializer = await initializeWorkoutDocumentForUser(
    otherUserId,
    {
      origin: "saved_template",
      templateId: saveResult.template.id,
      workoutDate: "2026-06-25",
    },
    { savedTemplateRepository: repository },
  );
  assert.equal(crossUserInitializer.ok, false);
  if (!crossUserInitializer.ok) assert.equal(crossUserInitializer.reason, "not_found");

  const invalidName = await saveManualWorkoutSavedTemplateForUser(
    userId,
    {
      displayName: "   ",
      iconKey: "easy",
      ...buildReviewConfirmInput(input, reviewed),
    },
    { repository },
  );
  assertSavedTemplateBlocked(invalidName, "invalid_name", "blank saved-template name");

  const invalidIcon = await saveManualWorkoutSavedTemplateForUser(
    userId,
    {
      displayName: "Bad icon",
      iconKey: "rocket",
      ...buildReviewConfirmInput(input, reviewed),
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
              target: { paceTargetSource: "hito_generated", paceMinPerKmRange: "4:55-5:05/km" },
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
  const unsupportedInitializer = await initializeWorkoutDocumentForUser(
    userId,
    {
      origin: "saved_template",
      templateId: "99999999-9999-4999-8999-999999999999",
      workoutDate: "2026-06-25",
    },
    { savedTemplateRepository: repository },
  );
  assert.equal(unsupportedInitializer.ok, false);
  if (!unsupportedInitializer.ok) {
    assert.equal(unsupportedInitializer.reason, "unsupported_payload");
  }
  const unsupportedCatalog = await listManualWorkoutSavedTemplatesForUser(userId, { repository });
  assert.equal(unsupportedCatalog.ok, false);
  if (!unsupportedCatalog.ok) {
    assert.equal(unsupportedCatalog.reason, "unsupported_payload");
  }

  const crossUserDelete = await deleteManualWorkoutSavedTemplateForUser(
    otherUserId,
    { templateId: saveResult.template.id },
    { repository },
  );
  assert.equal(crossUserDelete.ok, false, "another runner must not delete a personal template");
  if (!crossUserDelete.ok) {
    assert.equal(crossUserDelete.reason, "not_found");
  }

  const ownerDelete = await deleteManualWorkoutSavedTemplateForUser(
    userId,
    { templateId: saveResult.template.id },
    { repository },
  );
  assert.equal(ownerDelete.ok, true, JSON.stringify(ownerDelete));
  assert.equal(
    repository.rows().some((row) => row.id === saveResult.template.id),
    false,
    "owner delete should remove exactly the selected personal template",
  );
}

function workoutDocumentContent(document: WorkoutDocument) {
  return {
    workoutType: document.workoutType,
    sourceWorkoutType: document.sourceWorkoutType,
    workoutFamily: document.workoutFamily,
    workoutIdentity: document.workoutIdentity,
    calendarIconKey: document.calendarIconKey,
    metricMode: document.metricMode,
    title: document.title,
    notes: document.notes,
    steps: document.steps,
  };
}

function buildFakeSavedTemplateRepository(): FakeSavedTemplateRepository {
  const rows: SavedTemplateRow[] = [];
  let nextId = 1;
  let replacementCount = 0;

  return {
    rows: () => [...rows],
    payloadReplacementCount: () => replacementCount,
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
    async replaceDraftPayloadForUser(
      userId: string,
      templateId: string,
      sourceReviewChecksum: string,
      draftPayload,
    ) {
      const index = rows.findIndex(
        (row) =>
          row.user_id === userId &&
          row.id === templateId &&
          row.source_review_checksum === sourceReviewChecksum,
      );
      if (index < 0) return null;
      replacementCount += 1;
      rows[index] = { ...rows[index]!, draft_payload: draftPayload };
      return rows[index]!;
    },
    async deleteTemplateForUser(userId: string, templateId: string) {
      const index = rows.findIndex((row) => row.user_id === userId && row.id === templateId);
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

function assertSavedTemplateSaved(result: ManualWorkoutSavedTemplateSaveResult, label: string) {
  assert.equal(result.ok, true, `${label} should save: ${formatJsonResult(result)}`);

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
  assertManualBlockedResult(result, reason, label);
}

function assertUserEnteredTargetInSteps(
  steps: Step[],
  key: "pace_min_per_km_range" | "hr_bpm_range" | "hr_bpm" | "rpe",
  label: string,
) {
  const target = flattenSteps(steps)
    .flatMap((step) => (step.target ? [step.target] : []))
    .find((candidate) => key in candidate);

  assert.ok(target, `${label} should preserve ${key}.`);
  assert.equal(target.target_source, "user_entered", `${label} should preserve source.`);
}
