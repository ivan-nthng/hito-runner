import assert from "node:assert/strict";
import { buildPlanPresetReviewDraftContract } from "../../src/lib/plan-presets/expand";
import {
  assertAtMostOneSpecificTouchPerWeek,
  assertDraftRejected,
  assertDraftProgramSummary,
  assertHasPaceTargets,
  assertLongRunDayPreserved,
  assertNoForbiddenIdentities,
  assertNoExecutableHrTargets,
  assertNoFakePaceOrHrTargets,
  assertNoFixedRestWorkoutLeaks,
  assertNoSingleSegmentNonRestRows,
  assertPostLongRunNextRunRecoveryOrEasy,
  assertRichNonRestRows,
  assertStructureOnlyRowsAreExecutable,
  buildMarathonInput,
  type PlanPresetDraft,
} from "./helpers";

export function validateMarathonBaseDrafts() {
  validateMarathonBaseNoBenchmarkDraft();
  validateMarathonBaseBenchmarkDraft();
  validateMarathonBaseIneligibleDrafts();
}

function validateMarathonBaseNoBenchmarkDraft() {
  const draft = buildPlanPresetReviewDraftContract({
    cardId: "marathon",
    input: buildMarathonInput({
      benchmark: {
        fitnessLevel: "performance_focused",
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
        goalDistance: "marathon",
        goalStyle: "balanced",
        terrainFocus: "standard",
      },
    }),
  });

  assert.equal(draft.sourceKind, "plan_preset_v1");
  assert.equal(draft.source_kind, "plan_preset_v1");
  assert.equal(draft.sourceStatus, "preset_recipe_expanded");
  assert.equal(draft.presetId, "plan_preset_marathon_base_v1");
  assert.equal(draft.persisted, false);
  assert.equal(draft.canonicalPlan.source_kind, "plan_preset_v1");
  assert.equal(draft.metricTruth.executableMode, "structure_only_executable");
  assert.equal(draft.metricTruth.paceTargetsAllowed, false);
  assert.equal(draft.metricTruth.hrTargetsAllowed, false);
  assert.equal(draft.reviewShape.rowCounts.weekCount, 16);
  assert.equal(draft.reviewShape.rowCounts.calendarRows, 112);
  assert.equal(draft.reviewShape.rowCounts.nonRestRows, 64);
  assertDraftProgramSummary(draft, {
    durationWeeks: 16,
    startDate: "2026-06-08",
    estimatedEndDate: "2026-09-27",
    daysPerWeek: 4,
    longRunDay: "Saturday",
    programFamily: "Marathon Base",
  });
  assertNoFixedRestWorkoutLeaks(draft, ["Wednesday", "Sunday"]);
  assertLongRunDayPreserved(draft, "Saturday");
  assertPostLongRunNextRunRecoveryOrEasy(draft);
  assertNoForbiddenMarathonBaseIdentities(draft);
  assertMarathonSpecificPatternDensity(draft);
  assertNoTwoMarathonSpecificTouchWeeks(draft);
  assertNoFakePaceOrHrTargets(draft);
  assertStructureOnlyRowsAreExecutable(draft);
  assertRichNonRestRows(draft);
  assertNoSingleSegmentNonRestRows(draft);
}

function validateMarathonBaseBenchmarkDraft() {
  const draft = buildPlanPresetReviewDraftContract({
    cardId: "marathon",
    input: buildMarathonInput({
      benchmark: {
        fitnessLevel: "custom",
        recent5kTime: "25:00",
      },
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
      },
      schedule: {
        startDate: "2026-06-08",
        targetDate: null,
      },
      goal: {
        goalDistance: "marathon",
        goalStyle: "balanced",
        terrainFocus: "standard",
      },
    }),
  });

  assert.equal(draft.metricTruth.executableMode, "pace_executable");
  assert.equal(draft.metricTruth.paceTargetsAllowed, true);
  assert.equal(draft.metricTruth.hrTargetsAllowed, false);
  assert.equal(draft.reviewShape.rowCounts.weekCount, 16);
  assert.equal(draft.reviewShape.rowCounts.calendarRows, 112);
  assert.equal(draft.reviewShape.rowCounts.nonRestRows, 80);
  assertDraftProgramSummary(draft, {
    durationWeeks: 16,
    startDate: "2026-06-08",
    estimatedEndDate: "2026-09-27",
    daysPerWeek: 5,
    longRunDay: "Saturday",
    programFamily: "Marathon Base",
  });
  assertNoFixedRestWorkoutLeaks(draft, ["Wednesday", "Sunday"]);
  assertLongRunDayPreserved(draft, "Saturday");
  assertPostLongRunNextRunRecoveryOrEasy(draft);
  assertNoForbiddenMarathonBaseIdentities(draft);
  assertMarathonSpecificPatternDensity(draft);
  assertNoTwoMarathonSpecificTouchWeeks(draft);
  assertHasPaceTargets(draft);
  assertNoExecutableHrTargets(draft);
  assertRichNonRestRows(draft);
  assertNoSingleSegmentNonRestRows(draft);
}

function validateMarathonBaseIneligibleDrafts() {
  assertDraftRejected(
    "marathon",
    buildMarathonInput({
      schedule: {
        startDate: "2026-06-08",
        targetDate: "2026-12-06",
      },
    }),
    "marathon target-date setup",
  );
  assertDraftRejected(
    "marathon",
    buildMarathonInput({
      goal: {
        goalDistance: "marathon",
        goalStyle: "target_time",
        targetTime: "3:50:00",
        terrainFocus: "standard",
      },
    }),
    "marathon target-time setup",
  );
  assertDraftRejected(
    "marathon",
    buildMarathonInput({
      comment: "I need this around a heavy travel month and inconsistent weekly availability.",
    }),
    "marathon material-comment setup",
  );
  assertDraftRejected(
    "marathon",
    buildMarathonInput({
      benchmark: {
        fitnessLevel: "beginner",
      },
    }),
    "marathon insufficient long-run tolerance setup",
  );
  assertDraftRejected(
    "marathon",
    buildMarathonInput({
      benchmark: {
        fitnessLevel: "running_regularly",
      },
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
      },
    }),
    "marathon insufficient no-benchmark support setup",
  );
  assertDraftRejected(
    "marathon",
    buildMarathonInput({
      availability: {
        runningDaysPerWeek: 3,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
      },
    }),
    "marathon insufficient-availability setup",
  );
}

function assertNoForbiddenMarathonBaseIdentities(draft: PlanPresetDraft) {
  assertNoForbiddenIdentities(
    draft,
    new Set([
      "race_pace_session",
      "taper_tuneup_run",
      "taper_long_run",
      "distance_intervals",
      "time_intervals",
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "controlled_tempo_session",
      "progression_run",
    ]),
  );
}

function assertMarathonSpecificPatternDensity(draft: PlanPresetDraft) {
  const marathonSteadyWorkouts = draft.canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_identity === "marathon_steady_specificity",
  );
  const steadyFinishLongRuns = draft.canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_identity === "long_run_with_steady_finish",
  );
  const cutbackLongRuns = draft.canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_identity === "cutback_long_run",
  );

  assert.ok(marathonSteadyWorkouts.length >= 2, "Expected recurring marathon-steady durability.");
  assert.ok(
    marathonSteadyWorkouts.some((workout) => workout.phase === "Build"),
    "Expected Build-phase marathon steady durability.",
  );
  assert.ok(steadyFinishLongRuns.length >= 1, "Expected safe long-run steady-finish specificity.");
  assert.ok(cutbackLongRuns.length >= 2, "Expected cutback long-run protection.");
}

function assertNoTwoMarathonSpecificTouchWeeks(draft: PlanPresetDraft) {
  assertAtMostOneSpecificTouchPerWeek(draft, isMarathonSpecificTouch, "marathon-specific");
}

function isMarathonSpecificTouch(identity: string | null) {
  return identity === "marathon_steady_specificity" || identity === "long_run_with_steady_finish";
}
