import assert from "node:assert/strict";
import { buildPlanPresetReviewDraftContract } from "../../src/lib/plan-presets/expand";
import {
  assertDraftRejected,
  assertDraftProgramSummary,
  assertHasPaceTargets,
  assertLongRunDayPreserved,
  assertNoForbiddenIdentities,
  assertNoExecutableHrTargets,
  assertNoFakePaceOrHrTargets,
  assertNoFixedRestWorkoutLeaks,
  assertPostLongRunNextRunRecoveryOrEasy,
  assertRichNonRestRows,
  assertStructureOnlyRowsAreExecutable,
  buildTenKInput,
  type PlanPresetDraft,
} from "./helpers";

export function validateTenKFoundationDrafts() {
  validateDraftContractShape();
  validateTenKFoundationNoBenchmarkDraft();
  validateTenKFoundationBenchmarkDraft();
  validateStartDateRecomputesEndDateWithoutRowCountDrift();
  validateTenKFoundationIneligibleDrafts();
}

function validateDraftContractShape() {
  const draftContract = buildPlanPresetReviewDraftContract({
    cardId: "10k",
    input: buildTenKInput({
      benchmark: {
        fitnessLevel: "beginner",
      },
      availability: {
        runningDaysPerWeek: 3,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
      },
      schedule: {
        startDate: "2026-06-08",
        targetDate: null,
      },
      goal: {
        goalDistance: "10k",
        goalStyle: "relaxed",
        terrainFocus: "standard",
      },
    }),
  });

  assert.equal(draftContract.sourceKind, "plan_preset_v1");
  assert.equal(draftContract.source_kind, "plan_preset_v1");
  assert.equal(draftContract.sourceStatus, "preset_recipe_expanded");
  assert.equal(draftContract.presetId, "plan_preset_10k_foundation_v1");
  assert.equal(draftContract.presetVersion, "v1");
  assert.equal(draftContract.persisted, false);
  assert.equal(draftContract.canonicalPlan.source_kind, "plan_preset_v1");
  assert.equal(draftContract.canonicalPlan.planned_workouts.length, 70);
  assert.equal(draftContract.reviewShape.rowCounts.calendarRows, 70);
  assert.equal(draftContract.reviewShape.targetMode, "preset_no_target_date_or_time");
  assertDraftProgramSummary(draftContract, {
    durationWeeks: 10,
    startDate: "2026-06-08",
    estimatedEndDate: "2026-08-16",
    daysPerWeek: 3,
    longRunDay: "Saturday",
    programFamily: "10K Foundation",
  });
  assert.equal(draftContract.safety.doesNotCallOpenAi, true);
  assert.equal(draftContract.safety.doesNotMutatePlan, true);
  assert.equal(draftContract.safety.persistsNothing, true);
  assert.equal(draftContract.safety.confirmPathImplemented, true);
}

function validateTenKFoundationNoBenchmarkDraft() {
  const draft = buildPlanPresetReviewDraftContract({
    cardId: "10k",
    input: buildTenKInput({
      benchmark: {
        fitnessLevel: "beginner",
      },
      availability: {
        runningDaysPerWeek: 3,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
      },
      schedule: {
        startDate: "2026-06-08",
        targetDate: null,
      },
      goal: {
        goalDistance: "10k",
        goalStyle: "relaxed",
        terrainFocus: "standard",
      },
    }),
  });

  assert.equal(draft.persisted, false);
  assert.equal(draft.metricTruth.executableMode, "structure_only_executable");
  assert.equal(draft.metricTruth.paceTargetsAllowed, false);
  assert.equal(draft.metricTruth.hrTargetsAllowed, false);
  assert.equal(draft.reviewShape.rowCounts.weekCount, 10);
  assert.equal(draft.reviewShape.rowCounts.calendarRows, 70);
  assert.equal(draft.reviewShape.rowCounts.nonRestRows, 30);
  assertDraftProgramSummary(draft, {
    durationWeeks: 10,
    startDate: "2026-06-08",
    estimatedEndDate: "2026-08-16",
    daysPerWeek: 3,
    longRunDay: "Saturday",
    programFamily: "10K Foundation",
  });
  assertNoFixedRestWorkoutLeaks(draft, ["Wednesday", "Sunday"]);
  assertLongRunDayPreserved(draft, "Saturday");
  assertPostLongRunNextRunRecoveryOrEasy(draft);
  assertNoForbiddenTenKFoundationIdentities(draft);
  assertNoFakePaceOrHrTargets(draft);
  assertStructureOnlyRowsAreExecutable(draft);
  assertRichNonRestRows(draft);
}

function validateTenKFoundationBenchmarkDraft() {
  const draft = buildPlanPresetReviewDraftContract({
    cardId: "10k",
    input: buildTenKInput({
      benchmark: {
        fitnessLevel: "custom",
        recent5kTime: "25:00",
      },
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
      },
      schedule: {
        startDate: "2026-06-08",
        targetDate: null,
      },
      goal: {
        goalDistance: "10k",
        goalStyle: "balanced",
        terrainFocus: "standard",
      },
    }),
  });

  assert.equal(draft.metricTruth.executableMode, "pace_executable");
  assert.equal(draft.metricTruth.paceTargetsAllowed, true);
  assert.equal(draft.metricTruth.hrTargetsAllowed, false);
  assert.equal(draft.reviewShape.rowCounts.weekCount, 10);
  assert.equal(draft.reviewShape.rowCounts.calendarRows, 70);
  assert.equal(draft.reviewShape.rowCounts.nonRestRows, 40);
  assertDraftProgramSummary(draft, {
    durationWeeks: 10,
    startDate: "2026-06-08",
    estimatedEndDate: "2026-08-16",
    daysPerWeek: 4,
    longRunDay: "Saturday",
    programFamily: "10K Foundation",
  });
  assertNoFixedRestWorkoutLeaks(draft, ["Wednesday", "Sunday"]);
  assertLongRunDayPreserved(draft, "Saturday");
  assertPostLongRunNextRunRecoveryOrEasy(draft);
  assertNoForbiddenTenKFoundationIdentities(draft);
  assertHasPaceTargets(draft);
  assertNoExecutableHrTargets(draft);
  assertRichNonRestRows(draft);
}

function validateStartDateRecomputesEndDateWithoutRowCountDrift() {
  const firstStart = buildPlanPresetReviewDraftContract({
    cardId: "10k",
    input: buildTenKInput({
      schedule: {
        startDate: "2026-06-08",
        targetDate: null,
      },
    }),
  });
  const changedStart = buildPlanPresetReviewDraftContract({
    cardId: "10k",
    input: buildTenKInput({
      schedule: {
        startDate: "2026-06-15",
        targetDate: null,
      },
    }),
  });

  assert.equal(firstStart.reviewShape.startDate, "2026-06-08");
  assert.equal(firstStart.reviewShape.estimatedEndDate, "2026-08-16");
  assert.equal(changedStart.reviewShape.startDate, "2026-06-15");
  assert.equal(changedStart.reviewShape.estimatedEndDate, "2026-08-23");
  assert.equal(firstStart.reviewShape.rowCounts.calendarRows, 70);
  assert.equal(changedStart.reviewShape.rowCounts.calendarRows, 70);
  assert.equal(
    firstStart.reviewShape.rowCounts.nonRestRows,
    changedStart.reviewShape.rowCounts.nonRestRows,
  );
}

function validateTenKFoundationIneligibleDrafts() {
  assertDraftRejected(
    "10k",
    buildTenKInput({
      schedule: {
        startDate: "2026-06-08",
        targetDate: "2026-09-20",
      },
    }),
    "target-date setup",
  );
  assertDraftRejected(
    "10k",
    buildTenKInput({
      goal: {
        goalDistance: "10k",
        goalStyle: "target_time",
        targetTime: "50:00",
        terrainFocus: "standard",
      },
    }),
    "target-time setup",
  );
  assertDraftRejected(
    "10k",
    buildTenKInput({
      comment: "I need this around travel and uneven shift work.",
    }),
    "material-comment setup",
  );
  assertDraftRejected(
    "10k",
    buildTenKInput({
      goal: {
        goalDistance: "10k",
        goalStyle: "ambitious",
        terrainFocus: "standard",
      },
    }),
    "ambitious setup",
  );
}

function assertNoForbiddenTenKFoundationIdentities(draft: PlanPresetDraft) {
  assertNoForbiddenIdentities(
    draft,
    new Set([
      "race_pace_session",
      "taper_tuneup_run",
      "taper_long_run",
      "5k_sharpening_repeats",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
    ]),
  );
}
