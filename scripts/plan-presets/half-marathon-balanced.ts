import assert from "node:assert/strict";
import { buildPlanPresetReviewDraftContract } from "../../src/lib/plan-presets/expand";
import {
  assertAtMostOneSpecificTouchPerWeek,
  assertAdaptiveProgramMetadata,
  assertDraftRejected,
  assertDraftProgramSummary,
  assertFinalWeekIdentity,
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
  buildHalfMarathonInput,
  type PlanPresetDraft,
} from "./helpers";

export function validateHalfMarathonBalancedDrafts() {
  validateHalfMarathonBalancedNoBenchmarkDraft();
  validateHalfMarathonBalancedBenchmarkDraft();
  validateHalfMarathonBalancedIneligibleDrafts();
}

function validateHalfMarathonBalancedNoBenchmarkDraft() {
  const draft = buildPlanPresetReviewDraftContract({
    cardId: "half_marathon",
    input: buildHalfMarathonInput({
      benchmark: {
        fitnessLevel: "running_regularly",
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
        goalDistance: "half_marathon",
        goalStyle: "balanced",
        terrainFocus: "standard",
      },
    }),
  });

  assert.equal(draft.sourceKind, "plan_preset_v1");
  assert.equal(draft.source_kind, "plan_preset_v1");
  assert.equal(draft.sourceStatus, "preset_recipe_expanded");
  assert.equal(draft.presetId, "plan_preset_half_marathon_balanced_v1");
  assert.equal(draft.persisted, false);
  assert.equal(draft.canonicalPlan.source_kind, "plan_preset_v1");
  assert.equal(draft.metricTruth.executableMode, "structure_only_executable");
  assert.equal(draft.metricTruth.paceTargetsAllowed, false);
  assert.equal(draft.metricTruth.hrTargetsAllowed, false);
  assertDraftProgramSummary(draft, {
    startDate: "2026-06-08",
    daysPerWeek: 4,
    longRunDay: "Saturday",
    programFamily: "Half Marathon Balanced",
  });
  assertAdaptiveProgramMetadata(draft);
  assert.equal(draft.reviewShape.adaptiveProgram.finalOutcomeRule.includes("half-readiness"), true);
  assertFinalWeekIdentity(draft, "half_readiness_marker");
  assertNoFixedRestWorkoutLeaks(draft, ["Wednesday", "Sunday"]);
  assertLongRunDayPreserved(draft, "Saturday");
  assertPostLongRunNextRunRecoveryOrEasy(draft);
  assertNoForbiddenHalfMarathonBalancedIdentities(draft);
  assertHalfSpecificPatternDensity(draft);
  assertNoTwoSpecificTouchWeeks(draft);
  assertNoFakePaceOrHrTargets(draft);
  assertStructureOnlyRowsAreExecutable(draft);
  assertRichNonRestRows(draft);
  assertNoSingleSegmentNonRestRows(draft);
}

function validateHalfMarathonBalancedBenchmarkDraft() {
  const draft = buildPlanPresetReviewDraftContract({
    cardId: "half_marathon",
    input: buildHalfMarathonInput({
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
        goalDistance: "half_marathon",
        goalStyle: "balanced",
        terrainFocus: "standard",
      },
    }),
  });

  assert.equal(draft.metricTruth.executableMode, "pace_executable");
  assert.equal(draft.metricTruth.paceTargetsAllowed, true);
  assert.equal(draft.metricTruth.hrTargetsAllowed, false);
  assertDraftProgramSummary(draft, {
    startDate: "2026-06-08",
    daysPerWeek: 5,
    longRunDay: "Saturday",
    programFamily: "Half Marathon Balanced",
  });
  assertAdaptiveProgramMetadata(draft);
  assertFinalWeekIdentity(draft, "half_readiness_marker");
  assertNoFixedRestWorkoutLeaks(draft, ["Wednesday", "Sunday"]);
  assertLongRunDayPreserved(draft, "Saturday");
  assertPostLongRunNextRunRecoveryOrEasy(draft);
  assertNoForbiddenHalfMarathonBalancedIdentities(draft);
  assertHalfSpecificPatternDensity(draft);
  assertNoTwoSpecificTouchWeeks(draft);
  assertHasPaceTargets(draft);
  assertNoExecutableHrTargets(draft);
  assertRichNonRestRows(draft);
  assertNoSingleSegmentNonRestRows(draft);
}

function validateHalfMarathonBalancedIneligibleDrafts() {
  assertDraftRejected(
    "half_marathon",
    buildHalfMarathonInput({
      schedule: {
        startDate: "2026-06-08",
        targetDate: "2026-09-20",
      },
    }),
    "half target-date setup",
  );
  assertDraftRejected(
    "half_marathon",
    buildHalfMarathonInput({
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        targetTime: "1:55:00",
        terrainFocus: "standard",
      },
    }),
    "half target-time setup",
  );
  assertDraftRejected(
    "half_marathon",
    buildHalfMarathonInput({
      comment: "I need this around travel and uneven shift work.",
    }),
    "half material-comment setup",
  );
  assertDraftRejected(
    "half_marathon",
    buildHalfMarathonInput({
      benchmark: {
        fitnessLevel: "beginner",
      },
      availability: {
        runningDaysPerWeek: 2,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
      },
    }),
    "half insufficient-availability setup",
  );
}

function assertNoForbiddenHalfMarathonBalancedIdentities(draft: PlanPresetDraft) {
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
      "marathon_steady_specificity",
    ]),
  );
}

function assertHalfSpecificPatternDensity(draft: PlanPresetDraft) {
  const specificWorkouts = draft.canonicalPlan.planned_workouts.filter((workout) =>
    isHalfSpecificTouch(workout.workout_identity ?? workout.source_workout_type ?? null),
  );
  const specificWeeks = new Set(specificWorkouts.map((workout) => workout.week_number));

  assert.ok(
    draft.canonicalPlan.planned_workouts.some(
      (workout) =>
        workout.phase === "Build" && workout.workout_identity === "controlled_tempo_session",
    ),
    "Expected a Build-phase controlled tempo signal.",
  );
  assert.ok(
    draft.canonicalPlan.planned_workouts.some(
      (workout) =>
        workout.phase === "Specific" &&
        workout.workout_identity === "half_marathon_threshold_durability",
    ),
    "Expected a later Specific-phase threshold durability signal.",
  );
  assert.ok(
    draft.canonicalPlan.planned_workouts.some(
      (workout) => workout.workout_identity === "long_run_with_steady_finish",
    ),
    "Expected long-run steady-finish variation.",
  );
  assert.ok(specificWeeks.size >= 3, "Expected more than one late half-specific exception.");
}

function assertNoTwoSpecificTouchWeeks(draft: PlanPresetDraft) {
  assertAtMostOneSpecificTouchPerWeek(draft, isHalfSpecificTouch, "half-specific");
}

function isHalfSpecificTouch(identity: string | null) {
  return (
    identity === "controlled_tempo_session" ||
    identity === "progression_run" ||
    identity === "half_marathon_threshold_durability" ||
    identity === "half_readiness_marker" ||
    identity === "long_run_with_steady_finish"
  );
}
