import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  initializeWorkoutDocument,
  initializeWorkoutDocumentForUser,
  listSupportedManualWorkoutTemplates,
  type ManualWorkoutSavedTemplateRepository,
} from "../src/lib/manual-workout-authoring";
import type { Json } from "../src/lib/supabase/database";
import {
  confirmWorkoutCommand,
  reviewWorkoutCommand,
  WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
} from "../src/lib/workout-authoring-review";
import {
  normalizeWorkoutDocument,
  normalizeWorkoutDocumentContent,
  type WorkoutDocument,
} from "../src/lib/workout-document";
import {
  buildSkippedDisposablePersistenceResult,
  formatDisposablePersistenceBlocker,
} from "./lib/qa-pool-persistence-proof";
import {
  readManualPersistenceCliOptions,
  resolveManualPersistencePreflight,
  validateManualWorkoutDisposablePersistenceProof,
} from "./manual-workout-authoring/persistence-proof";

async function main() {
  const options = readManualPersistenceCliOptions();
  validateCanonicalInitializers();
  validateCalendarLifecycleCommandReview();
  await validateCanonicalSavedTemplateInitializer();
  await validateAuthoringDeletionGates();

  const preflight = resolveManualPersistencePreflight(options);
  if (!preflight.shouldRun && options.requirePersistence) {
    throw new Error(
      formatDisposablePersistenceBlocker("Canonical Workout persistence proof", preflight),
    );
  }
  const persistence = preflight.shouldRun
    ? await validateManualWorkoutDisposablePersistenceProof({ preflight })
    : buildSkippedDisposablePersistenceResult(preflight);

  console.log("Canonical Workout authoring contract passed.", {
    initializers: { scratch: 1, builtIns: 18 },
    persistence,
  });
}

function validateCalendarLifecycleCommandReview() {
  const sourceFingerprint: Json = { id: "source", workout_date: "2026-07-02" };
  const targetFingerprint: Json = { id: "target", workout_date: "2026-07-03" };
  const commands = [
    {
      operation: "copy" as const,
      workoutId: "00000000-0000-4000-8000-000000000401",
      targetDate: "2026-07-03",
      expectedFingerprint: sourceFingerprint,
    },
    {
      operation: "move" as const,
      workoutId: "00000000-0000-4000-8000-000000000401",
      targetDate: "2026-07-03",
      targetPolicy: {
        targetDayKind: "workout_day" as const,
        targetReplacementWorkoutId: "00000000-0000-4000-8000-000000000402",
        restDisplacement: "none" as const,
      },
      expectedFingerprints: { source: sourceFingerprint, target: targetFingerprint },
    },
    {
      operation: "delete" as const,
      workoutId: "00000000-0000-4000-8000-000000000401",
      expectedFingerprint: sourceFingerprint,
    },
    {
      operation: "clear" as const,
      workoutDate: "2026-07-02",
      expectedFingerprint: sourceFingerprint,
    },
  ];

  for (const command of commands) {
    const review = reviewWorkoutCommand({ command });
    assert.equal(review.ok, true, JSON.stringify(review));
    if (!review.ok) continue;
    assert.deepEqual(review.candidate.command, command);
    const confirmed = confirmWorkoutCommand({
      candidate: review.candidate,
      candidateId: review.candidate.candidateId,
      reviewToken: review.candidate.reviewToken,
      reviewChecksum: review.candidate.reviewChecksum,
    });
    assert.equal(confirmed.ok, true, JSON.stringify(confirmed));

    const tampered = structuredClone(review.candidate);
    tampered.command =
      tampered.command.operation === "copy"
        ? { ...tampered.command, targetDate: "2026-07-04" }
        : tampered.command;
    if (command.operation === "copy") {
      const rejected = confirmWorkoutCommand({
        candidate: tampered,
        candidateId: review.candidate.candidateId,
        reviewToken: review.candidate.reviewToken,
        reviewChecksum: review.candidate.reviewChecksum,
      });
      assert.equal(rejected.ok, false, "signed lifecycle payload changes must fail closed");
    }
  }

  assert.equal(
    reviewWorkoutCommand({
      command: {
        operation: "move",
        workoutId: "00000000-0000-4000-8000-000000000401",
        targetDate: "2026-07-03",
        targetPolicy: {
          targetDayKind: "rest_day",
          targetReplacementWorkoutId: null,
          restDisplacement: "stored_rest",
        },
        expectedFingerprints: { source: sourceFingerprint, target: null },
      },
    }).ok,
    false,
    "inconsistent Move displacement policy must fail before signing",
  );
}

function validateCanonicalInitializers() {
  const workoutDate = "2026-07-02";
  const templates = listSupportedManualWorkoutTemplates();
  assert.equal(templates.length, 18, "the accepted built-in catalog must retain all 18 templates");
  assert.equal(new Set(templates.map((template) => template.templateKey)).size, 18);

  const inputs = [
    { origin: "scratch" as const, workoutDate },
    ...templates.map((template) => ({
      origin: "built_in" as const,
      templateKey: template.templateKey,
      workoutDate,
    })),
  ];

  for (const input of inputs) {
    const initialized = initializeWorkoutDocument(input);
    assert.equal(initialized.ok, true, JSON.stringify({ input, initialized }));
    if (!initialized.ok) continue;
    const normalized = normalizeWorkoutDocument(initialized.document);
    assert.equal(normalized.ok, true, JSON.stringify(normalized));
    if (!normalized.ok) continue;
    assert.deepEqual(normalized.value, initialized.document);
    assert.equal(initialized.document.workoutDate, workoutDate);
    assert.equal(initialized.safety.serverOwned, true);
    assert.equal(initialized.safety.callsOpenAi, false);
    assert.equal(
      new Set(allSegmentIds(initialized.document)).size,
      allSegmentIds(initialized.document).length,
      `${initialized.document.sourceWorkoutType} segment identities must be globally unique`,
    );

    const review = reviewWorkoutCommand({
      command: {
        operation: "materialize",
        documents: [initialized.document],
        provenanceReferences: [initialized.provenanceReference],
      },
    });
    assert.equal(review.ok, true, JSON.stringify(review));
    if (!review.ok) continue;
    const confirmed = confirmWorkoutCommand({
      candidate: review.candidate,
      candidateId: review.candidate.candidateId,
      reviewToken: review.candidate.reviewToken,
      reviewChecksum: review.candidate.reviewChecksum,
    });
    assert.equal(confirmed.ok, true, JSON.stringify(confirmed));
  }

  const unsupported = initializeWorkoutDocument({
    origin: "built_in",
    templateKey: "not_a_template",
    workoutDate,
  });
  assert.equal(unsupported.ok, false, "unknown built-in keys must fail closed");

  const easy = initializeWorkoutDocument({
    origin: "built_in",
    templateKey: "easy_aerobic_run",
    workoutDate,
  });
  assert.equal(easy.ok, true);
  if (!easy.ok) return;
  const malformed = structuredClone(easy.document);
  const first = malformed.steps[0];
  assert.ok(first, "Easy initializer must contain one executable section");
  if (!first) return;
  first.target = {
    ...(first.target ?? {}),
    primary_execution_mode: "pace",
    target_source: "user_entered",
    pace: "5:00/km",
    rpe: 5,
  };
  assert.equal(
    normalizeWorkoutDocument(malformed).ok,
    false,
    "conflicting target kinds must fail strict server validation",
  );

  const unknownTarget = structuredClone(easy.document);
  const unknownFirst = unknownTarget.steps[0];
  assert.ok(unknownFirst);
  if (!unknownFirst) return;
  unknownFirst.target = {
    ...(unknownFirst.target ?? {}),
    unsupported_target_field: "unsafe",
  } as typeof unknownFirst.target;
  assert.equal(
    normalizeWorkoutDocument(unknownTarget).ok,
    false,
    "unknown target fields must fail strict server validation",
  );
}

async function validateCanonicalSavedTemplateInitializer() {
  const userId = "00000000-0000-4000-8000-000000000301";
  const otherUserId = "00000000-0000-4000-8000-000000000302";
  const source = initializeWorkoutDocument({
    origin: "built_in",
    templateKey: "time_intervals",
    workoutDate: "2026-07-02",
  });
  assert.equal(source.ok, true);
  if (!source.ok) return;
  const content = workoutDocumentContent(source.document);
  const row = canonicalTemplateRow({
    id: "66666666-6666-4666-8666-666666666666",
    userId,
    document: source.document,
    content,
  });
  const malformed = {
    ...row,
    id: "77777777-7777-4777-8777-777777777777",
    draft_payload: {
      version: WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
      content: { malformed: true },
      provenance: null,
    } as Json,
  };
  const repository = fakeSavedTemplateRepository([row, malformed]);

  const initialized = await initializeWorkoutDocumentForUser(
    userId,
    {
      origin: "saved_template",
      templateId: row.id,
      workoutDate: "2026-07-16",
    },
    { savedTemplateRepository: repository },
  );
  assert.equal(initialized.ok, true, JSON.stringify(initialized));
  if (initialized.ok) {
    assert.equal(initialized.document.workoutDate, "2026-07-16");
    assert.deepEqual(initialized.document.steps, source.document.steps);
    assert.equal(initialized.safety.canonicalDocumentOnly, true);
  }

  const foreign = await initializeWorkoutDocumentForUser(
    otherUserId,
    {
      origin: "saved_template",
      templateId: row.id,
      workoutDate: "2026-07-16",
    },
    { savedTemplateRepository: repository },
  );
  assert.equal(foreign.ok, false);
  if (!foreign.ok) assert.equal(foreign.reason, "not_found");

  const invalid = await initializeWorkoutDocumentForUser(
    userId,
    {
      origin: "saved_template",
      templateId: malformed.id,
      workoutDate: "2026-07-16",
    },
    { savedTemplateRepository: repository },
  );
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.reason, "unsupported_payload");
}

async function validateAuthoringDeletionGates() {
  const files = await Promise.all(
    [
      "../src/lib/manual-workout-authoring/actions.ts",
      "../src/lib/manual-workout-authoring/edit-workout.ts",
      "../src/lib/manual-workout-authoring/index.ts",
      "../src/lib/manual-workout-authoring/saved-templates.ts",
      "../src/lib/manual-workout-authoring/schema.ts",
      "../src/lib/manual-workout-authoring/copy-paste.ts",
      "../src/lib/manual-workout-authoring/move-workout.ts",
      "../src/lib/manual-workout-authoring/delete-clear.ts",
      "../src/lib/active-plan-persistence.ts",
      "../src/lib/running-plan-engine-actions.ts",
      "../src/lib/workout-document.ts",
    ].map(
      async (relative) =>
        [relative, await readFile(new URL(relative, import.meta.url), "utf8")] as const,
    ),
  );
  const joined = files.map(([path, source]) => `\n// ${path}\n${source}`).join("\n");
  for (const obsolete of [
    "ManualWorkoutDraftInput",
    "ManualWorkoutConstructorEntryInput",
    "manualWorkoutDraftInputSchema",
    "reviewManualWorkoutDraftAction",
    "addManualWorkoutToActivePlan",
    "reviewManualWorkoutSavedTemplate",
    "saveManualWorkoutSavedTemplate",
    "legacyEditorProjection",
    "draftInput",
    "editProjection",
    "WorkoutDocumentEditProjection",
    "buildWorkoutDocumentEditProjection",
    "reconstructManualWorkoutPersistedEditDraft",
    "reviewManualWorkoutPersistedEditDraft",
    "confirmManualWorkoutPersistedEdit",
    "manual_saved_workout_template_payload_v1",
    "manual_saved_workout_template_payload_v2",
    "copyManualWorkoutWithinActivePlan",
    "moveManualWorkoutWithinActivePlan",
    "reviewManualWorkoutMove",
    "confirmManualWorkoutMove",
    "reviewManualWorkoutDeleteClear",
    "confirmManualWorkoutDeleteClear",
    "ManualWorkoutDirectCopyResult",
    "ManualWorkoutDirectMoveResult",
    "ManualWorkoutMoveReviewResult",
    "ManualWorkoutMoveConfirmResult",
    "ManualWorkoutDeleteClearReviewResult",
    "ManualWorkoutDeleteClearConfirmResult",
    "manualWorkoutDirectCopyInputSchema",
    "manualWorkoutMoveReviewInputSchema",
    "manualWorkoutMoveConfirmInputSchema",
    "manualWorkoutDirectMoveInputSchema",
    "manualWorkoutDeleteClearReviewInputSchema",
    "manualWorkoutDeleteClearConfirmInputSchema",
    "manual-workout-move-review-v1",
    "manual-workout-delete-review-v1",
    "materializeFirstReviewedPlanForUser",
  ]) {
    assert.doesNotMatch(joined, new RegExp(obsolete), `${obsolete} must be absent after Batch A`);
  }
  assert.match(joined, /WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION/);
  assert.match(joined, /executeReviewedSourceWorkoutBatchMaterializationForUser/);
}

function allSegmentIds(document: WorkoutDocument): string[] {
  return document.steps.flatMap((section) => [
    section.segment_id,
    ...(section.prescription?.children?.map((child) => child.segment_id) ?? []),
  ]);
}

function workoutDocumentContent(document: WorkoutDocument) {
  const content = normalizeWorkoutDocumentContent({
    workoutType: document.workoutType,
    sourceWorkoutType: document.sourceWorkoutType,
    workoutFamily: document.workoutFamily,
    workoutIdentity: document.workoutIdentity,
    calendarIconKey: document.calendarIconKey,
    metricMode: document.metricMode,
    title: document.title,
    notes: document.notes,
    steps: document.steps,
  });
  assert.equal(content.ok, true, JSON.stringify(content));
  if (!content.ok) throw new Error(content.message);
  return content.value;
}

function canonicalTemplateRow(input: {
  id: string;
  userId: string;
  document: WorkoutDocument;
  content: ReturnType<typeof workoutDocumentContent>;
}) {
  return {
    id: input.id,
    user_id: input.userId,
    display_name: input.document.title,
    icon_key: input.document.calendarIconKey,
    template_key: input.document.sourceWorkoutType ?? "workout_document",
    template_version: "manual_workout_template_registry_v1",
    source_kind: "manual_saved_workout_template_v1",
    source_status: "saved_from_reviewed_manual_workout",
    workout_source_kind: "manual_workout_authoring_v1",
    review_payload_version: "manual_workout_review_payload_v1",
    source_review_checksum: "c".repeat(64),
    source_workout_identity: input.document.workoutIdentity,
    source_workout_family: input.document.workoutFamily,
    target_truth_mode: input.document.workoutType === "rest" ? "none" : "structure_only",
    draft_payload: {
      version: WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
      content: input.content,
      provenance: { initializer: "built_in" },
    } as Json,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  };
}

function fakeSavedTemplateRepository(
  initialRows: ReturnType<typeof canonicalTemplateRow>[],
): ManualWorkoutSavedTemplateRepository {
  const rows = [...initialRows];
  return {
    async insertTemplate(insert) {
      const row = {
        ...insert,
        id: insert.id ?? crypto.randomUUID(),
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
      };
      rows.push(row as ReturnType<typeof canonicalTemplateRow>);
      return row as ReturnType<typeof canonicalTemplateRow>;
    },
    async listTemplatesForUser(userId) {
      return rows.filter((row) => row.user_id === userId);
    },
    async getTemplateForUser(userId, templateId) {
      return rows.find((row) => row.user_id === userId && row.id === templateId) ?? null;
    },
    async deleteTemplateForUser(userId, templateId) {
      const index = rows.findIndex((row) => row.user_id === userId && row.id === templateId);
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
