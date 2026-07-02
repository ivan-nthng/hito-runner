import assert from "node:assert/strict";
import {
  buildReviewedRunningPlanPreview,
  runningPlanPreviewInputSchema,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  buildRunningPlanCanonicalPlan,
  buildRunningPlanPersistenceMetadata,
  validateRunningPlanReviewExactness,
} from "../src/lib/running-plan-engine-review";
import {
  PLAN_GOAL_INTENT_CONTRACT_VERSION,
  normalizePlanGoalIntent,
  type NormalizedPlanGoalIntent,
} from "../src/lib/plan-creation-engine/plan-goal-intent";
import type { TrainingPlanV2 } from "../src/lib/imported-plan";

const baseInput = {
  age: 36,
  heightCm: 178,
  weightKg: 74,
  runnerLevel: "sometimes_runs",
  distanceFamily: "10K",
  daysPerWeek: 5,
  fixedRestDays: ["Wednesday", "Saturday"],
  preferredLongRunDay: "Sunday",
  startDate: "2026-06-08",
  benchmark: { kind: "unknown" },
} satisfies RunningPlanPreviewActionInput;

async function main() {
  validateActionSchemaBoundary();
  validatePlanGoalIntentNormalizer();
  await validateSelectedPlanReviewAndReadback();

  console.log("Plan goal intent contract validator passed.");
}

function validateActionSchemaBoundary() {
  assert.doesNotThrow(() =>
    runningPlanPreviewInputSchema.parse({
      ...baseInput,
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        targetFinishTime: "45:00",
        targetDate: "2026-09-13",
      },
    }),
  );

  assert.throws(
    () =>
      runningPlanPreviewInputSchema.parse({
        ...baseInput,
        targetTime: "45:00",
      }),
    /Unrecognized key/,
    "Direct targetTime must remain outside the selected-plan action schema.",
  );
}

function validatePlanGoalIntentNormalizer() {
  const omitted = mustNormalize({
    rawIntent: null,
    distanceFamily: "10K",
    startDate: "2026-07-06",
    horizonWeeks: 10,
  });
  assert.equal(omitted.contractVersion, PLAN_GOAL_INTENT_CONTRACT_VERSION);
  assert.equal(omitted.distance?.label, "10K");
  assert.deepEqual(omitted.supplied, {
    distance: false,
    targetDate: false,
    targetFinishTime: false,
    targetOutcomePace: false,
  });
  assert.equal(omitted.targetOutcomePace, null);
  assert.equal(omitted.metricTruthPolicy.segmentPaceTargetsAllowedFromGoal, false);

  const halfPreset = mustNormalize({
    rawIntent: { distance: { kind: "preset", preset: "Half Marathon" } },
    distanceFamily: "Half Marathon",
    startDate: "2026-07-06",
    horizonWeeks: 16,
  });
  assert.equal(halfPreset.distance?.distanceMeters, 21_100);

  const marathonPreset = mustNormalize({
    rawIntent: { distance: { kind: "preset", preset: "Marathon" } },
    distanceFamily: "Marathon Completion",
    startDate: "2026-07-06",
    horizonWeeks: 20,
  });
  assert.equal(marathonPreset.distance?.distanceMeters, 42_195);

  const customDistance = mustNormalize({
    rawIntent: { distance: { kind: "custom", distanceKm: 12.5, label: "City 12.5K" } },
    distanceFamily: "10K",
    startDate: "2026-07-06",
    horizonWeeks: 10,
  });
  assert.equal(customDistance.distance?.kind, "custom");
  assert.equal(customDistance.distance?.distanceMeters, 12_500);
  assert.equal(customDistance.feasibility.status, "supported_with_assumptions");

  const finishTime = mustNormalize({
    rawIntent: {
      distance: { kind: "preset", preset: "10K" },
      targetFinishTime: "45:00",
    },
    distanceFamily: "10K",
    startDate: "2026-07-06",
    horizonWeeks: 10,
  });
  assert.equal(finishTime.targetFinishTime?.seconds, 2700);
  assert.equal(finishTime.targetOutcomePace?.source, "derived_from_finish_time");
  assert.equal(finishTime.targetOutcomePace?.label, "4:30/km");
  assert.equal(finishTime.metricTruthPolicy.outcomePaceIsExecutableWorkoutTarget, false);

  const runnerOutcomePace = mustNormalize({
    rawIntent: {
      distance: { kind: "preset", preset: "10K" },
      targetOutcomePace: "4:20/km",
    },
    distanceFamily: "10K",
    startDate: "2026-07-06",
    horizonWeeks: 10,
  });
  assert.equal(runnerOutcomePace.targetOutcomePace?.source, "runner_entered_outcome_pace");
  assert.equal(runnerOutcomePace.targetOutcomePace?.secondsPerKm, 260);

  const targetDateOnly = mustNormalize({
    rawIntent: { targetDate: "2026-10-04" },
    distanceFamily: "Half Marathon",
    startDate: "2026-07-06",
    horizonWeeks: 16,
  });
  assert.equal(targetDateOnly.targetDate, "2026-10-04");
  assert.equal(targetDateOnly.supplied.targetDate, true);

  const aggressive = mustNormalize({
    rawIntent: {
      distance: { kind: "preset", preset: "10K" },
      targetFinishTime: "25:00",
    },
    distanceFamily: "10K",
    startDate: "2026-07-06",
    horizonWeeks: 10,
  });
  assert.equal(aggressive.feasibility.status, "aggressive_or_short_horizon");

  const invalid = normalizePlanGoalIntent({
    rawIntent: { targetDate: "2026-02-31" },
    distanceFamily: "10K",
  });
  assert.equal(invalid.ok, false);
}

async function validateSelectedPlanReviewAndReadback() {
  const withoutIntent = await buildReviewedRunningPlanPreview(baseInput);
  assert.equal(withoutIntent.ok, true);
  if (!withoutIntent.ok) throw new Error(withoutIntent.unavailable.error.message);

  const withIntent = await buildReviewedRunningPlanPreview({
    ...baseInput,
    planGoalIntent: {
      targetFinishTime: "45:00",
      targetOutcomePace: "4:25/km",
      targetDate: "2026-09-13",
    },
  });
  assert.equal(withIntent.ok, true);
  if (!withIntent.ok) throw new Error(withIntent.unavailable.error.message);

  assert.notEqual(
    withIntent.draft.reviewChecksum,
    withoutIntent.draft.reviewChecksum,
    "Changing planGoalIntent must change the review checksum.",
  );

  const staleExactness = await validateRunningPlanReviewExactness({
    draft: withIntent.draft,
    reviewToken: withoutIntent.draft.reviewToken,
    reviewChecksum: withoutIntent.draft.reviewChecksum,
  });
  assert.equal(staleExactness.ok, false, "Stale review exactness must reject changed intent.");

  const canonicalPlan = buildRunningPlanCanonicalPlan(withIntent.draft);
  assertSelectedPlanGoalIntentReadback(canonicalPlan);

  const metadata = buildRunningPlanPersistenceMetadata({
    draft: withIntent.draft,
    canonicalPlan,
    reviewChecksum: withIntent.draft.reviewChecksum,
  });
  assert.match(JSON.stringify(metadata.goalMetadata), /plan_goal_intent/);
  assert.match(JSON.stringify(metadata.planPreferences), /plan_goal_intent/);
  assertNoExecutablePaceOrPersonalHr(canonicalPlan);
}

function mustNormalize(
  input: Parameters<typeof normalizePlanGoalIntent>[0],
): NormalizedPlanGoalIntent {
  const result = normalizePlanGoalIntent(input);
  assert.equal(result.ok, true, result.ok ? "" : result.message);

  return result.intent;
}

function assertSelectedPlanGoalIntentReadback(plan: TrainingPlanV2) {
  assert.equal(
    plan.planned_workouts.some((workout) => workout.goal_context?.target_time),
    true,
  );
  assert.equal(
    plan.planned_workouts.every((workout) => workout.goal_context?.target_date === "2026-09-13"),
    true,
  );
}

function assertNoExecutablePaceOrPersonalHr(plan: TrainingPlanV2) {
  const text = JSON.stringify(plan.planned_workouts);

  assert.doesNotMatch(text, /pace_min_per_km_range|pace_range_min_km|pace_seconds_per_km/);
  assert.doesNotMatch(text, /personal_hr|personal_hr_zone|measured_threshold/i);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
