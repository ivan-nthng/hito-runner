import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  buildManualWorkoutDocumentInitializer,
  initializeWorkoutDocument,
  listSupportedManualWorkoutTemplates,
  manualWorkoutAddToActivePlanInputSchema,
  manualWorkoutReviewActionInputSchema,
  reviewManualWorkoutActionInput,
  reviewManualWorkoutDraft,
  validateManualWorkoutDocumentReviewExactness,
  type ManualWorkoutDraftInput,
} from "../../src/lib/manual-workout-authoring";
import { repeatChildSteps, repeatCountForStep, type Step } from "../../src/lib/training";
import {
  confirmWorkoutCommand,
  reviewWorkoutCommand,
} from "../../src/lib/workout-authoring-review";
import { normalizeWorkoutDocument } from "../../src/lib/workout-document";
import { formatJsonResult } from "./move-proof-assertions";
import { assertReady, buildOrderedRepeatDraftInput } from "./move-proof-fixtures";

export function validateManualConstructorSegmentTargetContract() {
  assertActiveTemplatesDoNotOfferDefaultHrTruth();
  assertCanonicalScratchAndBuiltInInitializers();
  assertScratchCanonicalInitializer();
  assertCanonicalReviewForSupportedTemplates();
  assertCanonicalReviewConfirmationContract();
  assertRepeatDocumentShape();
  assertOrderedRepeatChildrenContract();
  assertRunnerEnteredTargetReadback();
  assertManualMetricTruthRejections();
  assertRepeatSafetyRejections();
}

function assertCanonicalScratchAndBuiltInInitializers() {
  const workoutDate = "2026-07-02";
  const scratch = initializeWorkoutDocument({ origin: "scratch", workoutDate });
  assert.equal(scratch.ok, true, "scratch should expose one server-owned canonical initializer");
  if (!scratch.ok) return;
  assert.equal(scratch.origin, "scratch");
  assert.equal(scratch.document.workoutDate, workoutDate);
  assert.equal(scratch.document.weekday, "Thursday");
  assert.equal(scratch.document.sourceWorkoutType, "easy_aerobic_run");
  assert.equal(scratch.safety.callsOpenAi, false);
  assert.doesNotMatch(
    JSON.stringify(scratch),
    /ManualWorkoutDraftInput|defaultEntries|targetTruthMode|draftInput/,
  );
  assertCanonicalInitializerMaterializeRoundTrip(scratch);

  for (const template of listSupportedManualWorkoutTemplates()) {
    const templateKey = template.templateKey;
    const initializer = initializeWorkoutDocument({
      origin: "built_in",
      templateKey,
      workoutDate,
    });
    assert.equal(initializer.ok, true, `${templateKey} should expose a canonical initializer`);
    if (!initializer.ok) continue;

    assert.equal(initializer.document.title, template.defaultTitle);
    assert.equal(initializer.document.notes, template.defaultNotes);
    assert.equal(initializer.document.workoutIdentity, template.workoutIdentity);
    assert.equal(initializer.document.workoutFamily, template.workoutFamily);
    assert.equal(initializer.document.calendarIconKey, template.calendarIconKey);
    assert.deepEqual(initializer.document.steps, template.defaultSteps);
    assert.deepEqual(initializer.provenanceReference, {
      initializer: "built_in",
      sourceKind: "manual_workout_authoring_v1",
      sourceStatus: "manual_draft_reviewed",
      templateKey,
    });
    assert.doesNotMatch(
      JSON.stringify(initializer),
      /ManualWorkoutDraftInput|defaultEntries|targetTruthMode|draftInput/,
    );
    assertCanonicalInitializerMaterializeRoundTrip(initializer);
  }
}

function assertCanonicalInitializerMaterializeRoundTrip(
  initializer: Extract<ReturnType<typeof initializeWorkoutDocument>, { ok: true }>,
) {
  const normalized = normalizeWorkoutDocument(initializer.document);
  assert.equal(normalized.ok, true, "the initializer should pass the strict document parser");
  if (!normalized.ok) return;

  const review = reviewWorkoutCommand({
    command: {
      operation: "materialize",
      documents: [initializer.document],
      provenanceReferences: [initializer.provenanceReference],
    },
  });
  assert.equal(review.ok, true, "the initializer should enter the final materialize review");
  if (!review.ok) return;
  assert.equal(review.candidate.command.operation, "materialize");
  assert.deepEqual(review.candidate.command.documents, [normalized.value]);
  assert.equal(
    confirmWorkoutCommand({
      candidate: review.candidate,
      candidateId: review.candidate.candidateId,
      reviewToken: review.candidate.reviewToken,
      reviewChecksum: review.candidate.reviewChecksum,
    }).ok,
    true,
    "the exact canonical initializer candidate should confirm",
  );
}

function assertScratchCanonicalInitializer() {
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-07-02",
    title: "Scratch aerobic session",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "easy_run_block",
          durationSeconds: 25 * 60,
          target: { targetSource: "user_entered", rpe: 4 },
        },
      },
    ],
  };
  const initializer = buildManualWorkoutDocumentInitializer(input);
  assert.equal(initializer.ok, true, "scratch should produce a canonical initializer");
  if (!initializer.ok) return;
  const normalized = normalizeWorkoutDocument(initializer.document);
  assert.equal(normalized.ok, true, "scratch initializer should pass the strict document parser");
  if (!normalized.ok) return;
  assert.equal(normalized.value.steps[0]?.segment_id, "manual-segment-1");
  assert.equal(normalized.value.steps[0]?.target?.target_source, "user_entered");

  const actionInitializer = reviewManualWorkoutActionInput({
    initializer: {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-07-02",
      title: "Server initialized scratch session",
    },
  });
  assert.equal(actionInitializer.ok, true, "the existing review action should initialize scratch");
  if (!actionInitializer.ok) return;
  assert.equal(actionInitializer.document.title, "Server initialized scratch session");
  assert.equal(
    manualWorkoutReviewActionInputSchema.safeParse({
      initializer: {
        templateKey: "easy_aerobic_run",
        workoutDate: "2026-07-02",
      },
    }).success,
    true,
    "scratch/built-in initialization should be a named canonical action branch",
  );
}

function assertCanonicalReviewConfirmationContract() {
  const review = assertReady("canonical operation review", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-07-02",
  });
  const confirmed = confirmWorkoutCommand({
    candidate: review.candidate,
    candidateId: review.candidate.candidateId,
    reviewToken: review.reviewToken,
    reviewChecksum: review.reviewChecksum,
  });
  assert.equal(confirmed.ok, true, "the exact reviewed candidate should confirm");

  const canonicalReview = reviewManualWorkoutActionInput({
    document: {
      ...review.document,
      title: "Canonical action input",
    },
  });
  assert.equal(canonicalReview.ok, true, "the review action seam should accept WorkoutDocument");
  if (!canonicalReview.ok) return;
  assert.equal(canonicalReview.candidate.command.operation, "materialize");
  if (canonicalReview.candidate.command.operation !== "materialize") return;
  assert.deepEqual(canonicalReview.candidate.command.documents, [canonicalReview.document]);

  const canonicalConfirmation = validateManualWorkoutDocumentReviewExactness({
    document: canonicalReview.document,
    candidateId: canonicalReview.candidate.candidateId,
    reviewToken: canonicalReview.reviewToken,
    reviewChecksum: canonicalReview.reviewChecksum,
  });
  assert.equal(canonicalConfirmation.ok, true, "canonical create confirmation should rebuild");
  assert.equal(
    manualWorkoutAddToActivePlanInputSchema.safeParse({
      document: canonicalReview.document,
      candidateId: canonicalReview.candidate.candidateId,
      reviewToken: canonicalReview.reviewToken,
      reviewChecksum: canonicalReview.reviewChecksum,
    }).success,
    true,
    "create confirmation should expose the canonical document branch",
  );

  const changedIdentity = reviewManualWorkoutActionInput({
    document: {
      ...canonicalReview.document,
      sourceWorkoutId: "client-owned-root",
    },
  });
  assert.equal(changedIdentity.ok, false, "server-owned initializer identity must reject");

  const staleIdentity = confirmWorkoutCommand({
    candidate: review.candidate,
    candidateId: `${review.candidate.candidateId}-stale`,
    reviewToken: review.reviewToken,
    reviewChecksum: review.reviewChecksum,
  });
  assert.deepEqual(staleIdentity, {
    ok: false,
    reason: "stale_review",
    message: "The Workout command no longer matches the server review.",
  });

  const invalidDocument = reviewWorkoutCommand({
    command: {
      operation: "materialize",
      documents: [{ ...review.draft, title: "" }],
      provenanceReferences: [null],
    },
  });
  assert.equal(invalidDocument.ok, false, "invalid canonical documents must fail review");

  const replaceReview = reviewWorkoutCommand({
    command: {
      operation: "replace_document",
      workoutId: "11111111-1111-4111-8111-111111111111",
      document: canonicalReview.document,
      expectedFingerprint: { id: "11111111-1111-4111-8111-111111111111", revision: 3 },
      provenanceReference: { rootSource: "manual" },
    },
  });
  assert.equal(replaceReview.ok, true, "replace-document command should normalize");
  if (!replaceReview.ok) return;
  assert.equal(replaceReview.candidate.command.operation, "replace_document");

  const saveReview = reviewWorkoutCommand({
    command: {
      operation: "save_template",
      document: canonicalReview.document,
      displayName: "  Canonical session  ",
      iconKey: "easy",
      provenanceReference: { rootSource: "manual" },
    },
  });
  assert.equal(saveReview.ok, true, "save-template command should normalize");
  if (!saveReview.ok) return;
  assert.equal(saveReview.candidate.command.operation, "save_template");
  if (saveReview.candidate.command.operation !== "save_template") return;
  assert.equal(saveReview.candidate.command.displayName, "Canonical session");

  const tampered = structuredClone(saveReview.candidate);
  if (tampered.command.operation !== "save_template") return;
  tampered.command.document.title = "Changed after signed review";
  assert.deepEqual(
    confirmWorkoutCommand({
      candidate: tampered,
      candidateId: tampered.candidateId,
      reviewToken: tampered.reviewToken,
      reviewChecksum: tampered.reviewChecksum,
    }),
    {
      ok: false,
      reason: "stale_review",
      message: "The Workout command no longer matches the server review.",
    },
    "the signed payload must include every operation field",
  );

  assert.equal(
    reviewWorkoutCommand({
      command: {
        operation: "materialize",
        documents: [review.draft],
        provenanceReferences: [],
      },
    }).ok,
    false,
    "materialize review must require one provenance reference per document",
  );

  const collided = reviewWorkoutCommand({
    command: {
      operation: "materialize",
      documents: [review.draft, review.draft],
      provenanceReferences: [null, null],
    },
  });
  assert.equal(collided.ok, true);
  if (!collided.ok) return;
  assert.deepEqual(collided.candidate.collisions, [
    { code: "duplicate_candidate_date", workoutDate: review.draft.workoutDate },
  ]);
  assert.equal(
    confirmWorkoutCommand({
      candidate: collided.candidate,
      candidateId: collided.candidate.candidateId,
      reviewToken: collided.candidate.reviewToken,
      reviewChecksum: collided.candidate.reviewChecksum,
    }).ok,
    false,
    "a collided candidate must never confirm",
  );
}

function assertActiveTemplatesDoNotOfferDefaultHrTruth() {
  for (const template of listSupportedManualWorkoutTemplates()) {
    assert.ok(
      !template.allowedTargetTruthModes.includes("editable_default_hr"),
      `${template.templateKey} must not expose editable_default_hr as an active manual target option`,
    );
  }
}

function assertCanonicalReviewForSupportedTemplates() {
  for (const template of listSupportedManualWorkoutTemplates()) {
    const review = assertReady(`${template.templateKey} canonical review`, {
      templateKey: template.templateKey,
      workoutDate: "2026-07-02",
    });
    const initializer = buildManualWorkoutDocumentInitializer({
      templateKey: template.templateKey,
      workoutDate: "2026-07-02",
    });
    assert.equal(initializer.ok, true, `${template.templateKey} should build an initializer`);
    if (!initializer.ok) continue;
    const normalized = normalizeWorkoutDocument(initializer.document);
    assert.equal(normalized.ok, true, `${template.templateKey} should normalize canonically`);
    if (!normalized.ok) continue;
    assert.deepEqual(
      normalized.value,
      review.draft,
      `${template.templateKey} initializer and review should share one canonical document`,
    );

    assert.equal(review.reviewMetadata.templateKey, template.templateKey);

    if (review.draft.workoutType === "rest") {
      assert.deepEqual(review.draft.steps, []);
      continue;
    }

    assert.ok(review.draft.steps.length > 0, `${template.templateKey} should include sections`);
    for (const step of review.draft.steps) {
      assertExecutableStep(step, template.templateKey);
    }
  }
}

function assertRepeatDocumentShape() {
  const review = assertReady("interval repeat canonical review", {
    templateKey: "time_intervals",
    workoutDate: "2026-07-02",
  });
  const repeat = firstRepeatStep(review.draft.steps, "time_intervals");
  const children = repeatChildSteps(repeat);

  assert.equal(repeatCountForStep(repeat), 6);
  assert.deepEqual(
    children.map(canonicalStepRole),
    ["work", "recover"],
    "repeat children should preserve ordered work then recover roles",
  );
  assert.deepEqual(
    children.map((child) => child.label),
    ["Work", "Easy jog recovery"],
    "repeat children should preserve canonical labels",
  );
}

function assertOrderedRepeatChildrenContract() {
  const review = assertReady(
    "ordered repeat children canonical review",
    buildOrderedRepeatDraftInput("2026-07-02"),
  );
  const repeat = firstRepeatStep(review.draft.steps, "ordered repeat");
  const children = repeatChildSteps(repeat);

  assert.equal(repeatCountForStep(repeat), 4);
  assert.deepEqual(children.map(canonicalStepRole), ["run", "work", "recover"]);
  assert.deepEqual(
    children.map((child) => child.label),
    ["Settle", "Tempo press", "Float"],
  );
  assert.equal(children[1]?.target?.rpe, 7);
  assert.equal(children[1]?.target?.cue, "Controlled, not all-out.");
  assert.equal(repeat.prescription?.children?.length, 3);
}

function assertRunnerEnteredTargetReadback() {
  const pace = assertReady("canonical runner-entered pace", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-07-02",
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
  });
  const paceTarget = firstTarget(pace.draft.steps, "pace_min_per_km_range");
  assert.equal(paceTarget.target_source, "user_entered");
  assert.equal(paceTarget.pace_min_per_km_range, "5:10/km-5:25/km");
  assert.equal(paceTarget.pace_min_seconds_per_km, 310);
  assert.equal(paceTarget.pace_max_seconds_per_km, 325);

  const hr = assertReady("canonical runner-entered HR cap", {
    templateKey: "steady_aerobic_run",
    workoutDate: "2026-07-02",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "steady_run_block",
          durationSeconds: 35 * 60,
          target: { hrBpmCap: 155 },
        },
      },
    ],
  });
  const hrTarget = firstTarget(hr.draft.steps, "hr_bpm_cap");
  assert.equal(hrTarget.target_source, "user_entered");
  assert.equal(hrTarget.hr_target_source, "user_entered");
  assert.equal(hrTarget.hr_bpm_cap, 155);

  const rpe = assertReady("canonical runner-entered RPE", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-07-02",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "easy_run_block",
          durationSeconds: 20 * 60,
          target: { rpe: 0, cue: "Keep this easy." },
        },
      },
    ],
  });
  const rpeTarget = firstTarget(rpe.draft.steps, "rpe");
  assert.equal(rpeTarget.target_source, "user_entered");
  assert.equal(rpeTarget.rpe, 0);
  assert.equal(rpeTarget.cue, "Keep this easy.");
}

function assertManualMetricTruthRejections() {
  assertRejected(
    "legacy editable default HR truth mode",
    {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-07-02",
      targetTruthMode: "editable_default_hr",
    },
    "unsafe_metric_truth",
  );

  assertRejected(
    "default estimated HR target source",
    {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-07-02",
      entries: [
        {
          kind: "block",
          block: {
            blockKey: "easy_run_block",
            durationSeconds: 30 * 60,
            target: { hrTargetSource: "default_estimated_hr" },
          },
        },
      ],
    },
    "unsafe_metric_truth",
  );
}

function assertRepeatSafetyRejections() {
  assertRejected(
    "repeat count one",
    {
      templateKey: "time_intervals",
      workoutDate: "2026-07-02",
      entries: [
        {
          kind: "repeat_group",
          group: {
            repeatCount: 1,
            safetyKind: "intervals",
            workBlock: { blockKey: "interval_work_block", durationSeconds: 60 },
            recoveryBlock: { blockKey: "interval_recovery_block", durationSeconds: 60 },
          },
        },
      ],
    },
    "invalid_input",
  );

  assertRejected(
    "hard repeat without recovery",
    {
      templateKey: "time_intervals",
      workoutDate: "2026-07-02",
      entries: [
        {
          kind: "block",
          block: { blockKey: "warmup_block", durationSeconds: 15 * 60 },
        },
        {
          kind: "repeat_group",
          group: {
            repeatCount: 4,
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
}

function firstRepeatStep(steps: Step[], label: string) {
  const repeat = steps.find((step) => repeatCountForStep(step) != null);
  assert.ok(repeat, `${label} should include a canonical repeat section`);
  return repeat;
}

function firstTarget(steps: Step[], field: string) {
  const target = flattenSteps(steps)
    .map((step) => step.target)
    .find((candidate) => candidate && field in candidate);

  assert.ok(target, `canonical review should include target field ${field}`);
  return target;
}

function flattenSteps(steps: Step[]): Step[] {
  return steps.flatMap((step) => [step, ...flattenSteps(repeatChildSteps(step))]);
}

function canonicalStepRole(step: Step) {
  return step.segment_type ?? step.type;
}

function assertExecutableStep(step: Step, label: string) {
  const children = repeatChildSteps(step);

  if (repeatCountForStep(step) != null) {
    assert.ok(children.length > 0, `${label} repeat should include ordered children`);
    for (const child of children) {
      assertExecutableStep(child, `${label} repeat child`);
    }
    return;
  }

  assert.ok(
    step.duration_min != null ||
      step.distance_km != null ||
      step.prescription?.duration_min != null ||
      step.prescription?.distance_km != null,
    `${label} step ${step.label ?? step.type} should be executable`,
  );
}

function assertRejected(label: string, input: unknown, expectedIssueCode: string) {
  const result = reviewManualWorkoutDraft(input);

  assert.equal(result.ok, false, `${label} should be rejected`);

  if (result.ok) {
    throw new Error(`${label} unexpectedly reviewed cleanly.`);
  }

  assert.ok(
    result.issues.some((issue) => issue.code === expectedIssueCode),
    `${label} should include ${expectedIssueCode}: ${formatJsonResult(result)}`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  validateManualConstructorSegmentTargetContract();
  console.log("Manual canonical WorkoutDocument review contract passed.");
}
