import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  listSupportedManualWorkoutTemplates,
  reviewManualWorkoutDraft,
  type ManualWorkoutConstructorContract,
  type ManualWorkoutConstructorRepeatGroup,
  type ManualWorkoutConstructorSegment,
  type ManualWorkoutConstructorTimelineEntry,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";

const ACCEPTED_SEGMENT_ROLES = new Set(["warm_up", "run", "work", "recover", "finish", "cooldown"]);

const ACCEPTED_TARGET_KINDS = new Set(["none", "pace", "heart_rate", "effort_rpe"]);

const LEGACY_PUBLIC_CONSTRUCTOR_TERMS = [
  "targetTruthMode",
  "editable_default_hr",
  "default_estimated_hr",
  "safetyKind",
  "workBlock",
  "recoveryBlock",
  "work_block",
  "recovery_block",
  "structure_only",
  "executableMode",
  "metricMode",
];

export function validateManualConstructorSegmentTargetContract() {
  assertActiveTemplatesDoNotOfferDefaultHrTruth();
  assertCleanConstructorReadbackForSupportedTemplates();
  assertRepeatContractShape();
  assertRunnerEnteredTargetReadback();
  assertManualMetricTruthRejections();
  assertRepeatSafetyRejections();
}

function assertActiveTemplatesDoNotOfferDefaultHrTruth() {
  for (const template of listSupportedManualWorkoutTemplates()) {
    assert.ok(
      !template.allowedTargetTruthModes.includes("editable_default_hr"),
      `${template.templateKey} must not expose editable_default_hr as an active manual target option`,
    );
  }
}

function assertCleanConstructorReadbackForSupportedTemplates() {
  for (const template of listSupportedManualWorkoutTemplates()) {
    const review = assertReady(`${template.templateKey} constructor readback`, {
      templateKey: template.templateKey,
      workoutDate: "2026-07-02",
    });

    assert.equal(
      review.constructorContract.version,
      "manual_workout_constructor_contract_v1",
      `${template.templateKey} should include the v1 constructor contract`,
    );
    assert.equal(
      review.constructorContract.templateKey,
      template.templateKey,
      `${template.templateKey} constructor contract should keep template identity`,
    );
    assertNoLegacyConstructorTerms(review.constructorContract, template.templateKey);
    assertConstructorTimeline(review.constructorContract, template.templateKey);
  }
}

function assertRepeatContractShape() {
  const review = assertReady("interval repeat constructor contract", {
    templateKey: "time_intervals",
    workoutDate: "2026-07-02",
  });
  const repeat = review.constructorContract.timeline.find(isRepeatGroup);

  assert.ok(repeat, "time_intervals should expose one structural repeat container");
  assert.equal(repeat.repeatCount, 6, "time interval repeat count should be preserved");
  assert.deepEqual(
    repeat.children.map((child) => child.role),
    ["work", "recover"],
    "repeat children should be ordered work then recover",
  );
  assert.match(
    repeat.label,
    /^6x \[Work 2 min \+ Recover 1 min\]$/,
    "repeat label should be compact structural copy, not legacy group vocabulary",
  );
  assertNoLegacyConstructorTerms(repeat, "time_intervals repeat contract");
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

function assertRunnerEnteredTargetReadback() {
  const pace = assertReady("constructor runner-entered pace", {
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
  const paceSegment = firstConstructorSegment(pace.constructorContract);
  assert.equal(paceSegment.target.kind, "pace");
  if (paceSegment.target.kind === "pace") {
    assert.equal(paceSegment.target.source, "user_entered");
    assert.equal(paceSegment.target.paceMinPerKmRange, "5:10/km-5:25/km");
    assert.deepEqual(paceSegment.target.paceRangeSecondsPerKm, { min: 310, max: 325 });
  }

  const hr = assertReady("constructor runner-entered HR cap", {
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
  const hrSegment = firstConstructorSegment(hr.constructorContract);
  assert.equal(hrSegment.target.kind, "heart_rate");
  if (hrSegment.target.kind === "heart_rate") {
    assert.equal(hrSegment.target.source, "user_entered");
    assert.equal(hrSegment.target.hrBpmCap, 155);
  }

  const rpe = assertReady("constructor runner-entered RPE", {
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
  const rpeSegment = firstConstructorSegment(rpe.constructorContract);
  assert.equal(rpeSegment.target.kind, "effort_rpe");
  if (rpeSegment.target.kind === "effort_rpe") {
    assert.equal(rpeSegment.target.source, "user_entered");
    assert.equal(rpeSegment.target.rpe, 0);
  }
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

function assertConstructorTimeline(contract: ManualWorkoutConstructorContract, label: string) {
  for (const entryValue of contract.timeline) {
    if (entryValue.kind === "segment") {
      assertConstructorSegment(entryValue, label);
      continue;
    }

    assert.ok(entryValue.repeatCount >= 2, `${label} repeat groups should keep repeatCount >= 2`);
    assert.ok(
      entryValue.children.length > 0,
      `${label} repeat groups should expose child segments`,
    );
    assertNoLegacyConstructorTerms(entryValue, `${label} repeat entry`);

    for (const child of entryValue.children) {
      assertConstructorSegment(child, `${label} repeat child`);
    }
  }

  for (const note of contract.metadataNotes) {
    assert.ok(note.text.length > 0, `${label} metadata notes should preserve note text`);
    assertNoLegacyConstructorTerms(note, `${label} metadata note`);
  }
}

function assertConstructorSegment(segment: ManualWorkoutConstructorSegment, label: string) {
  assert.ok(
    ACCEPTED_SEGMENT_ROLES.has(segment.role),
    `${label} segment role ${segment.role} should be in the accepted v1 role set`,
  );
  assert.ok(
    ACCEPTED_TARGET_KINDS.has(segment.target.kind),
    `${label} segment target ${segment.target.kind} should be in the accepted v1 target set`,
  );
  assert.notEqual(segment.structure.kind, "none", `${label} segment should be executable`);
  assertNoLegacyConstructorTerms(segment, `${label} segment`);
}

function assertNoLegacyConstructorTerms(value: unknown, label: string) {
  const serialized = JSON.stringify(value);

  for (const term of LEGACY_PUBLIC_CONSTRUCTOR_TERMS) {
    assert.doesNotMatch(
      serialized,
      new RegExp(term, "i"),
      `${label} constructor readback must not expose legacy ${term} vocabulary`,
    );
  }
}

function assertReady(
  label: string,
  input: ManualWorkoutDraftInput,
): Extract<ManualWorkoutDraftReviewResult, { ok: true }> {
  const result = reviewManualWorkoutDraft(input);

  assert.equal(result.ok, true, `${label} should review cleanly`);

  if (!result.ok) {
    throw new Error(`${label} was rejected: ${formatResult(result)}`);
  }

  return result;
}

function assertRejected(label: string, input: unknown, expectedIssueCode: string) {
  const result = reviewManualWorkoutDraft(input);

  assert.equal(result.ok, false, `${label} should be rejected`);

  if (result.ok) {
    throw new Error(`${label} unexpectedly reviewed cleanly.`);
  }

  assert.ok(
    result.issues.some((issue) => issue.code === expectedIssueCode),
    `${label} should include ${expectedIssueCode}: ${formatResult(result)}`,
  );
}

function isRepeatGroup(
  entryValue: ManualWorkoutConstructorTimelineEntry,
): entryValue is ManualWorkoutConstructorRepeatGroup {
  return entryValue.kind === "repeat";
}

function firstConstructorSegment(contract: ManualWorkoutConstructorContract) {
  const segment = contract.timeline.find(
    (entryValue): entryValue is ManualWorkoutConstructorSegment => entryValue.kind === "segment",
  );

  assert.ok(segment, "constructor contract should include a segment");
  return segment;
}

function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  validateManualConstructorSegmentTargetContract();
  console.log("Manual constructor segment target contract passed.");
}
