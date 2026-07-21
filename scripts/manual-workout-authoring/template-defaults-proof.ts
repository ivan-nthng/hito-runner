import assert from "node:assert/strict";
import {
  INTERNAL_SUPPORTED_MANUAL_WORKOUT_TEMPLATE_KEYS,
  listManualWorkoutTemplates,
  listSupportedManualWorkoutTemplates,
  listVisibleManualWorkoutStarterTemplates,
  reviewManualWorkoutDraft,
  VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";
import type { ManualWorkoutTemplateKey } from "../../src/lib/manual-workout-authoring/schema";
import {
  buildPlannedWorkoutLanguage,
  RUNNER_FACING_WORKOUT_TYPE_VALUES,
  type PlannedWorkoutLanguageReadModel,
  type RunnerFacingWorkoutType,
} from "../../src/lib/planned-workout-language";
import type { Step } from "../../src/lib/training";

interface ExpectedTemplateSkeleton {
  templateKey: ManualWorkoutTemplateKey;
  runnerFacingWorkoutType: RunnerFacingWorkoutType;
  runnerFacingBlocks: string[];
  repeatChildren?: string[];
  maxTotalDurationMin?: number;
}

const ACCEPTED_RUNNER_FACING_TYPES = new Set<string>(RUNNER_FACING_WORKOUT_TYPE_VALUES);

const EXPECTED_TEMPLATE_SKELETONS: ExpectedTemplateSkeleton[] = [
  {
    templateKey: "rest_day",
    runnerFacingWorkoutType: "rest",
    runnerFacingBlocks: [],
  },
  {
    templateKey: "recovery_jog",
    runnerFacingWorkoutType: "recovery",
    runnerFacingBlocks: ["Warm-up", "Recover", "Cooldown"],
    maxTotalDurationMin: 30,
  },
  {
    templateKey: "easy_aerobic_run",
    runnerFacingWorkoutType: "easy",
    runnerFacingBlocks: ["Warm-up", "Run", "Cooldown"],
  },
  {
    templateKey: "steady_aerobic_run",
    runnerFacingWorkoutType: "steady",
    runnerFacingBlocks: ["Warm-up", "Run", "Cooldown"],
  },
  {
    templateKey: "long_aerobic_run",
    runnerFacingWorkoutType: "long_run",
    runnerFacingBlocks: ["Warm-up", "Run", "Cooldown"],
  },
  {
    templateKey: "progression_run",
    runnerFacingWorkoutType: "progression",
    runnerFacingBlocks: ["Warm-up", "Work", "Cooldown"],
  },
  {
    templateKey: "controlled_tempo_session",
    runnerFacingWorkoutType: "tempo",
    runnerFacingBlocks: ["Warm-up", "Repeat set", "Cooldown"],
    repeatChildren: ["Work", "Recover"],
  },
  {
    templateKey: "time_intervals",
    runnerFacingWorkoutType: "intervals",
    runnerFacingBlocks: ["Warm-up", "Repeat set", "Cooldown"],
    repeatChildren: ["Work", "Recover"],
  },
  {
    templateKey: "uphill_repeats",
    runnerFacingWorkoutType: "hills",
    runnerFacingBlocks: ["Warm-up", "Repeat set", "Cooldown"],
    repeatChildren: ["Work", "Walk"],
  },
  {
    templateKey: "run_walk_adaptation",
    runnerFacingWorkoutType: "run_walk",
    runnerFacingBlocks: ["Repeat set", "Cooldown"],
    repeatChildren: ["Run", "Walk"],
  },
];

export function validateManualTemplateDefaultSkeletons() {
  assertVisibleStarterCatalog();
  assertSupportedRegistryCatalog();
  assertVisibleStarterSkeletons();
}

function assertVisibleStarterCatalog() {
  const visibleTemplates = listVisibleManualWorkoutStarterTemplates();
  const visibleKeys = visibleTemplates.map((template) => template.templateKey);
  const visibleTypes = new Set<RunnerFacingWorkoutType>();

  assert.deepEqual(
    visibleKeys,
    [...VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS],
    "visible manual starter catalog should expose exactly the accepted v1 starter templates",
  );

  assert.equal(
    visibleTemplates.length,
    RUNNER_FACING_WORKOUT_TYPE_VALUES.length,
    "visible manual starter catalog should stay one starter per accepted runner-facing type",
  );

  for (const template of visibleTemplates) {
    const review = assertReadyTemplateReview(template.templateKey);
    const language = languageForReview(review);

    assert.ok(
      ACCEPTED_RUNNER_FACING_TYPES.has(language.runnerFacingWorkoutType),
      `${template.templateKey} should resolve to an accepted runner-facing workout type`,
    );
    assert.equal(
      language.metricTruth.paceTargetsAllowed,
      false,
      `${template.templateKey} default must not allow pace targets`,
    );
    assert.equal(
      language.metricTruth.hrTargetsAllowed,
      false,
      `${template.templateKey} default must not allow HR targets`,
    );
    assertNoFakeMetricTargets(review.draft.steps, template.templateKey);

    if (language.runnerFacingWorkoutType !== "rest") {
      assert.ok(
        review.draft.steps.length > 0,
        `${template.templateKey} should open with an editable executable skeleton`,
      );
    }

    visibleTypes.add(language.runnerFacingWorkoutType);
  }

  assert.deepEqual(
    visibleTypes,
    new Set(RUNNER_FACING_WORKOUT_TYPE_VALUES),
    "visible manual starter catalog should cover every accepted v1 runner-facing workout type",
  );
}

function assertSupportedRegistryCatalog() {
  const supportedTemplates = listSupportedManualWorkoutTemplates();
  const supportedKeys = supportedTemplates.map((template) => template.templateKey);
  const allDeclaredKeys = [
    ...VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS,
    ...INTERNAL_SUPPORTED_MANUAL_WORKOUT_TEMPLATE_KEYS,
  ];

  assert.deepEqual(
    listManualWorkoutTemplates().map((template) => template.templateKey),
    supportedKeys,
    "legacy manual template list should remain full-registry for compatibility paths",
  );
  assert.deepEqual(
    [...supportedKeys].sort(),
    [...allDeclaredKeys].sort(),
    "full supported registry should equal visible starters plus internal-supported variants",
  );

  const visibleKeySet = new Set<ManualWorkoutTemplateKey>(
    VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS,
  );

  for (const key of INTERNAL_SUPPORTED_MANUAL_WORKOUT_TEMPLATE_KEYS) {
    assert.equal(
      visibleKeySet.has(key),
      false,
      `${key} should stay hidden from the primary visible starter catalog`,
    );
  }

  for (const template of supportedTemplates) {
    const review = assertReadyTemplateReview(template.templateKey);
    const language = languageForReview(review);

    assert.ok(
      ACCEPTED_RUNNER_FACING_TYPES.has(language.runnerFacingWorkoutType),
      `${template.templateKey} should still resolve to an accepted runner-facing workout type`,
    );
    assert.equal(
      language.metricTruth.paceTargetsAllowed,
      false,
      `${template.templateKey} default must not allow pace targets`,
    );
    assert.equal(
      language.metricTruth.hrTargetsAllowed,
      false,
      `${template.templateKey} default must not allow HR targets`,
    );
    assertNoFakeMetricTargets(review.draft.steps, template.templateKey);
  }
}

function assertVisibleStarterSkeletons() {
  for (const expected of EXPECTED_TEMPLATE_SKELETONS) {
    assertExpectedTemplateSkeleton(expected);
  }
}

function assertExpectedTemplateSkeleton(expected: ExpectedTemplateSkeleton) {
  const review = assertReadyTemplateReview(expected.templateKey);
  const language = languageForReview(review);

  assert.equal(
    language.runnerFacingWorkoutType,
    expected.runnerFacingWorkoutType,
    `${expected.templateKey} should resolve to ${expected.runnerFacingWorkoutType}`,
  );
  assert.deepEqual(
    language.runnerFacingBlocks.map((block) => block.label),
    expected.runnerFacingBlocks,
    `${expected.templateKey} should expose the expected editable default skeleton`,
  );

  if (expected.repeatChildren) {
    const repeatBlock = language.runnerFacingBlocks.find((block) => block.label === "Repeat set");
    assert.ok(repeatBlock, `${expected.templateKey} should include a repeat set`);
    assert.deepEqual(
      repeatBlock.children.map((block) => block.label),
      expected.repeatChildren,
      `${expected.templateKey} repeat set should keep ordered child anatomy`,
    );
  }

  if (expected.maxTotalDurationMin) {
    assert.ok(
      review.draft.totalDurationMin <= expected.maxTotalDurationMin,
      `${expected.templateKey} should stay short enough for its runner-facing type`,
    );
  }
}

function assertReadyTemplateReview(
  templateKey: ManualWorkoutTemplateKey,
): Extract<ManualWorkoutDraftReviewResult, { ok: true }> {
  const result = reviewManualWorkoutDraft({
    templateKey,
    workoutDate: "2026-07-01",
  });

  assert.equal(result.ok, true, `${templateKey} default template should review cleanly`);

  if (!result.ok) {
    throw new Error(`${templateKey} default template was rejected.`);
  }

  return result;
}

function languageForReview(
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>,
): PlannedWorkoutLanguageReadModel {
  return buildPlannedWorkoutLanguage({
    workoutType: review.draft.workoutType,
    sourceWorkoutType: review.draft.sourceWorkoutType,
    sourceKind: review.draft.sourceKind,
    workoutFamily: review.draft.workoutFamily,
    workoutIdentity: review.draft.workoutIdentity,
    calendarIconKey: review.draft.calendarIconKey,
    metricMode: review.draft.metricMode,
    title: review.draft.title,
    steps: review.draft.steps,
  });
}

function assertNoFakeMetricTargets(steps: Step[], templateKey: ManualWorkoutTemplateKey) {
  const serialized = JSON.stringify(steps);

  assert.doesNotMatch(
    serialized,
    /pace_min_per_km_range|paceMinPerKmRange|hr_bpm_range|hrBpmRange|personal_hr_zone|["']rpe["']/i,
    `${templateKey} default skeleton must not include fake pace, HR, or RPE targets`,
  );
  assert.doesNotMatch(
    serialized,
    /grade_percent|gradePercent|elevation_gain|elevationGain|terrain_precision|terrainPrecision/i,
    `${templateKey} default skeleton must not include fake grade, elevation, or terrain precision`,
  );
}
