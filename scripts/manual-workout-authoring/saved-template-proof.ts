import assert from "node:assert/strict";
import {
  MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
  MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  deleteManualWorkoutSavedTemplateForUser,
  listManualWorkoutSavedTemplatesForUser,
  reviewManualWorkoutSavedTemplateForUser,
  saveManualWorkoutSavedTemplateForUser,
  type ManualWorkoutDraftInput,
  type ManualWorkoutSavedTemplateRepository,
  type ManualWorkoutSavedTemplateSaveResult,
} from "../../src/lib/manual-workout-authoring";
import type { Step } from "../../src/lib/training";
import {
  assertManualBlockedResult,
  assertNoFakePaceOrHrInSerialized,
  assertRepeatWithRecovery,
  formatJsonResult,
} from "./move-proof-assertions";
import { assertReady, buildReviewConfirmInput } from "./move-proof-fixtures";

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

function flattenSteps(steps: Step[]): Step[] {
  return steps.flatMap((step) => [step, ...(step.children ? flattenSteps(step.children) : [])]);
}
