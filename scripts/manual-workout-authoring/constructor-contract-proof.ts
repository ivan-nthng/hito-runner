import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  listSupportedManualWorkoutTemplates,
  reviewManualWorkoutDraft,
  type ManualWorkoutDraftInput,
} from "../../src/lib/manual-workout-authoring";
import { repeatChildSteps, repeatCountForStep, type Step } from "../../src/lib/training";
import { formatJsonResult } from "./move-proof-assertions";
import { assertReady } from "./move-proof-fixtures";

export function validateManualConstructorSegmentTargetContract() {
  assertActiveTemplatesDoNotOfferDefaultHrTruth();
  assertCanonicalReviewForSupportedTemplates();
  assertRepeatDocumentShape();
  assertOrderedRepeatChildrenContract();
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

function assertCanonicalReviewForSupportedTemplates() {
  for (const template of listSupportedManualWorkoutTemplates()) {
    const review = assertReady(`${template.templateKey} canonical review`, {
      templateKey: template.templateKey,
      workoutDate: "2026-07-02",
    });

    assert.equal(review.draft.templateKey, template.templateKey);

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
  const review = assertReady("ordered repeat children canonical review", {
    templateKey: "controlled_tempo_session",
    workoutDate: "2026-07-02",
    entries: [
      {
        kind: "block",
        block: { blockKey: "warmup_block", durationSeconds: 12 * 60 },
      },
      {
        kind: "repeat_group",
        group: {
          repeatCount: 4,
          safetyKind: "tempo_repeats",
          groupLabel: "Tempo ladder",
          children: [
            { blockKey: "easy_run_block", durationSeconds: 3 * 60, label: "Settle" },
            {
              blockKey: "tempo_block",
              durationSeconds: 2 * 60,
              label: "Tempo press",
              target: { rpe: 7, cue: "Controlled, not all-out." },
            },
            { blockKey: "interval_recovery_block", durationSeconds: 60, label: "Float" },
          ],
        },
      },
      {
        kind: "block",
        block: { blockKey: "cooldown_block", durationSeconds: 10 * 60 },
      },
    ],
  });
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
