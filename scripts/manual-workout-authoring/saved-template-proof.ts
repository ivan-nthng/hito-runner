import assert from "node:assert/strict";
import {
  MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
  MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  listManualWorkoutSavedTemplatesForUser,
  reviewManualWorkoutDraft,
  reviewManualWorkoutSavedTemplateForUser,
  saveManualWorkoutSavedTemplateForUser,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutSavedTemplateRepository,
  type ManualWorkoutSavedTemplateSaveResult,
} from "../../src/lib/manual-workout-authoring";
import type { Step } from "../../src/lib/training";

type SavedTemplateRow = Awaited<ReturnType<ManualWorkoutSavedTemplateRepository["insertTemplate"]>>;
type SavedTemplateInsert = Parameters<ManualWorkoutSavedTemplateRepository["insertTemplate"]>[0];
type FakeSavedTemplateRepository = ManualWorkoutSavedTemplateRepository & {
  rows: () => SavedTemplateRow[];
  addRawTemplate: (row: SavedTemplateRow) => void;
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

function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}
