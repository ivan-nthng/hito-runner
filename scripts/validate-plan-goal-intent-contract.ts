import assert from "node:assert/strict";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import { buildAiGeneratedRunningPlanAuthoringInput } from "../src/lib/ai-generated-running-plan";
import {
  buildReviewedAiGeneratedRunningPlanPreview,
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
import {
  addDaysIso,
  diffDaysIso,
  formatDate,
  startOfWeekIso,
  weekdayLong,
  weekdayShort,
} from "../src/lib/training";
import type { TrainingPlanV2 } from "../src/lib/imported-plan";
import { buildProofRunnerProfileSnapshot } from "./runner-profile-snapshot-proof-helpers";

const baseInput = {
  age: 36,
  heightCm: 178,
  weightKg: 74,
  runnerLevel: "runs_a_lot",
  daysPerWeek: 5,
  fixedRestDays: ["Wednesday", "Saturday"],
  preferredLongRunDay: "Sunday",
  startDate: "2026-06-08",
  benchmark: { kind: "unknown" },
  planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
} satisfies RunningPlanPreviewActionInput;

async function main() {
  validateDateOnlyContract();
  validateActionSchemaBoundary();
  validatePlanGoalIntentNormalizer();
  await validateSelectedPlanReviewAndReadback();

  console.log("Plan goal intent contract validator passed.");
}

function validateDateOnlyContract() {
  assert.equal(addDaysIso("2026-08-01", 1), "2026-08-02");
  assert.equal(addDaysIso("2026-08-01", -1), "2026-07-31");
  assert.equal(addDaysIso("2026-03-29", 1), "2026-03-30", "DST must not alter day arithmetic.");
  assert.equal(addDaysIso("2026-01-31", 1), "2026-02-01", "Month rollover must be exact.");
  assert.equal(
    addDaysIso("2026-03-01", -1),
    "2026-02-28",
    "Negative month rollover must be exact.",
  );
  assert.equal(addDaysIso("2024-02-28", 1), "2024-02-29", "Leap-day arithmetic must be exact.");
  assert.equal(addDaysIso("2024-02-29", 1), "2024-03-01");
  assert.equal(addDaysIso("2026-12-31", 1), "2027-01-01");
  assert.equal(diffDaysIso("2026-08-02", "2026-08-01"), 1);
  assert.equal(diffDaysIso("2026-03-30", "2026-03-29"), 1, "DST must not change day difference.");
  assert.equal(weekdayLong("2026-08-01"), "Saturday");
  assert.equal(weekdayShort("2026-08-01"), "Sat");
  assert.equal(startOfWeekIso("2026-08-01"), "2026-07-27");
  assert.equal(formatDate("2026-08-01"), "Aug 1");
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
    startDate: "2026-07-06",
  });
  assert.equal(omitted.contractVersion, PLAN_GOAL_INTENT_CONTRACT_VERSION);
  assert.equal(omitted.distance, null);
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
    startDate: "2026-07-06",
  });
  assert.equal(halfPreset.distance?.distanceMeters, 21_100);

  const marathonPreset = mustNormalize({
    rawIntent: { distance: { kind: "preset", preset: "Marathon" } },
    startDate: "2026-07-06",
  });
  assert.equal(marathonPreset.distance?.distanceMeters, 42_195);

  const customDistance = mustNormalize({
    rawIntent: { distance: { kind: "custom", distanceKm: 12.5, label: "City 12.5K" } },
    startDate: "2026-07-06",
  });
  assert.equal(customDistance.distance?.kind, "custom");
  assert.equal(customDistance.distance?.distanceMeters, 12_500);

  const finishTime = mustNormalize({
    rawIntent: {
      distance: { kind: "preset", preset: "10K" },
      targetFinishTime: "45:00",
    },
    startDate: "2026-07-06",
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
    startDate: "2026-07-06",
  });
  assert.equal(runnerOutcomePace.targetOutcomePace?.source, "runner_entered_outcome_pace");
  assert.equal(runnerOutcomePace.targetOutcomePace?.secondsPerKm, 260);

  const targetDateOnly = mustNormalize({
    rawIntent: { targetDate: "2026-10-04" },
    startDate: "2026-07-06",
  });
  assert.equal(targetDateOnly.targetDate, "2026-10-04");
  assert.equal(targetDateOnly.supplied.targetDate, true);

  const ambitious = mustNormalize({
    rawIntent: {
      distance: { kind: "preset", preset: "10K" },
      targetFinishTime: "25:00",
      targetOutcomePace: "1:45/km",
    },
    startDate: "2026-07-06",
  });
  assert.equal(ambitious.targetOutcomePace?.secondsPerKm, 105);

  const shortHorizonMarathon = mustNormalize({
    rawIntent: {
      distance: { kind: "preset", preset: "Marathon" },
      targetDate: "2026-07-12",
    },
    startDate: "2026-07-06",
  });
  assert.equal(shortHorizonMarathon.targetDate, "2026-07-12");

  const invalid = normalizePlanGoalIntent({
    rawIntent: { targetDate: "2026-02-31" },
  });
  assert.equal(invalid.ok, false);

  const nonFuture = normalizePlanGoalIntent({
    rawIntent: { targetDate: "2026-07-06" },
    startDate: "2026-07-06",
  });
  assert.equal(nonFuture.ok, false);
  if (!nonFuture.ok) {
    assert.match(nonFuture.message, /after the plan start date/i);
  }
}

async function validateSelectedPlanReviewAndReadback() {
  const withoutIntent = await buildReviewedAiFixture(baseInput);
  assert.equal(withoutIntent.ok, true);
  if (!withoutIntent.ok) throw new Error(withoutIntent.unavailable.error.message);

  const withIntent = await buildReviewedAiFixture({
    ...baseInput,
    planGoalIntent: {
      ...baseInput.planGoalIntent,
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

  assert.doesNotMatch(text, /pace_seconds_per_km|pace_min_seconds_per_km|pace_max_seconds_per_km/);
  assert.doesNotMatch(text, /personal_hr|personal_hr_zone|measured_threshold/i);
  assertAiAuthoredPaceProvenance(plan.planned_workouts);
}

function assertAiAuthoredPaceProvenance(value: unknown) {
  if (Array.isArray(value)) {
    value.forEach(assertAiAuthoredPaceProvenance);
    return;
  }
  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  if (typeof record.pace === "string") {
    assert.equal(record.target_source, "ai_authored_plan_guidance");
  }
  Object.values(record).forEach(assertAiAuthoredPaceProvenance);
}

async function buildReviewedAiFixture(input: RunningPlanPreviewActionInput) {
  const runnerProfileSnapshot = buildProofRunnerProfileSnapshot(input);
  const authoring = buildAiGeneratedRunningPlanAuthoringInput(input, runnerProfileSnapshot);
  assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
  if (!authoring.ok) {
    throw new Error(authoring.message);
  }

  const today = input.startDate ?? authoring.authoringInput.schedule.startDate;
  const fetchImpl = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: authoring.authoringInput,
    today,
    env: localAiGeneratedFixtureEnv(),
  });

  return buildReviewedAiGeneratedRunningPlanPreview(input, {
    aiPreview: {
      apiKey: "local-qa-dev-ai-generated-plan-fixture",
      model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
      today,
      fetchImpl,
    },
    runnerProfileSnapshot,
  });
}

function localAiGeneratedFixtureEnv() {
  return {
    OPENAI_API_KEY: "local-qa-dev-ai-generated-plan-fixture",
    OPENAI_MODEL: "hito-local-qa-dev-ai-generated-plan-fixture",
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
    HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "qa_fixture",
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
