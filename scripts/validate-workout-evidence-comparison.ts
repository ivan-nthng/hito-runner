import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { relinkComparisonPlannedWorkoutIdentity } from "../src/lib/active-plan-replacement-carry-forward";
import { buildDeterministicWorkoutComparison } from "../src/lib/workout-result-import/compare-workout-result";
import {
  readWorkoutComparisonDifferencePayload,
  WORKOUT_COMPARISON_FORMULA_VERSION,
} from "../src/lib/workout-result-import/comparison-payload";
import { buildWorkoutResultEvidenceBundle } from "../src/lib/workout-result-import/evidence-bundle";
import { parseGarminFitActivity } from "../src/lib/workout-result-import/parse-garmin-fit";
import { comparisonRowToSummary } from "../src/lib/workout-result-import/read-workout-result-feedback";
import type { Database, Json } from "../src/lib/supabase/database";
import type {
  WorkoutActualMetricsSummary,
  WorkoutAiInsightSummary,
  WorkoutComparisonDifferencePayload,
  WorkoutComparisonSignal,
  WorkoutComparisonSummary,
  WorkoutResultAssetSummary,
} from "../src/lib/workout-result-import/types";

const WORKOUT_ID = "10000000-0000-4000-8000-000000000001";
const ASSET_ID = "10000000-0000-4000-8000-000000000002";
const METRICS_ID = "10000000-0000-4000-8000-000000000003";
const COMPARISON_ID = "10000000-0000-4000-8000-000000000004";

async function main() {
  await validateFitParserBoundary();
  const indexedComparison = validateStructuredProviderStepBoundary();
  validateActivityTypeBoundary();
  validateEvidenceBundleIdentity(indexedComparison);
  validateCarryForwardIdentity(indexedComparison);
  validatePersistedPayloadBoundary(indexedComparison);
  validatePersistedRowBoundary(indexedComparison);

  console.log("Workout evidence comparison contract passed.");
}

function validatePersistedRowBoundary(
  comparison: ReturnType<typeof buildDeterministicWorkoutComparison>,
) {
  const row = {
    id: COMPARISON_ID,
    user_id: "10000000-0000-4000-8000-000000000005",
    planned_workout_id: WORKOUT_ID,
    actual_metrics_id: METRICS_ID,
    comparison_formula_version: WORKOUT_COMPARISON_FORMULA_VERSION,
    comparison_status: comparison.comparisonStatus,
    completion_state: comparison.completionState,
    difference_payload: comparison.differencePayload as unknown as Json,
    comparison_confidence: comparison.comparisonConfidence,
    created_at: "2026-07-17T08:00:00.000Z",
  } satisfies Database["public"]["Tables"]["workout_comparisons"]["Row"];

  assert.ok(comparisonRowToSummary(row));
  assert.equal(
    comparisonRowToSummary({ ...row, comparison_formula_version: "unsupported_formula" }),
    null,
  );
  assert.equal(comparisonRowToSummary({ ...row, planned_workout_id: crypto.randomUUID() }), null);
  assert.equal(comparisonRowToSummary({ ...row, actual_metrics_id: crypto.randomUUID() }), null);
}

async function validateFitParserBoundary() {
  const fitFile = await readFile(new URL("../sample-fit-from-zip.fit", import.meta.url));
  const parsed = await parseGarminFitActivity(fitFile);
  const summary = parsed.summaryPayload as {
    session?: { sport?: unknown; localDateSource?: unknown };
  };

  assert.equal(parsed.sourceKind, "garmin_fit");
  assert.equal(summary.session?.sport, "running");
  assert.equal(summary.session?.localDateSource, "provider_local_timestamp");
  assert.match(parsed.activityLocalDate ?? "", /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(parsed.actualIntervalCount > 0);

  await assert.rejects(
    () => parseGarminFitActivity(Buffer.from("not-a-fit-file")),
    /FIT|activity session|parsed/i,
    "malformed provider evidence must fail before normalized actual truth exists",
  );
}

function validateStructuredProviderStepBoundary() {
  const unstructured = compare({
    actual_interval_count: null,
    actual_step_payload: [
      { sequence: 1, workoutStepIndex: null, durationMin: 10, distanceKm: 1.5 },
      { sequence: 2, workoutStepIndex: null, durationMin: 20, distanceKm: 3.5 },
      { sequence: 3, workoutStepIndex: null, durationMin: 10, distanceKm: 1.5 },
    ],
  });

  assert.equal(
    unstructured.differencePayload.stepSummary.status,
    "not_applicable",
    "ordinary provider laps must not become ordered workout-step evidence",
  );
  assert.equal(unstructured.differencePayload.segmentSummary.status, "not_applicable");

  const indexed = compare({
    actual_interval_count: 3,
    actual_step_payload: [
      { sequence: 1, workoutStepIndex: 0, durationMin: 10, distanceKm: 1.5 },
      { sequence: 2, workoutStepIndex: 1, durationMin: 20, distanceKm: 3.5 },
      { sequence: 3, workoutStepIndex: 2, durationMin: 10, distanceKm: 1.5 },
    ],
  });

  assert.equal(indexed.differencePayload.stepSummary.status, "available");
  assert.deepEqual(
    indexed.differencePayload.stepSummary.steps.map((step) => step.workoutStepIndex),
    [0, 1, 2],
    "only explicit provider workout-step indexes may drive ordered comparison",
  );
  assert.equal(
    indexed.differencePayload.supportMatrix.signals.find((signal) => signal.key === "rpe")?.status,
    "unsupported",
    "provider evidence must not claim subjective RPE truth",
  );

  const missingStepDurations = compare({
    actual_interval_count: 3,
    actual_step_payload: [
      { sequence: 1, workoutStepIndex: 0, durationMin: null, distanceKm: 1.5 },
      { sequence: 2, workoutStepIndex: 1, durationMin: null, distanceKm: 3.5 },
      { sequence: 3, workoutStepIndex: 2, durationMin: null, distanceKm: 1.5 },
    ],
  });
  assert.equal(missingStepDurations.differencePayload.stepSummary.status, "not_applicable");
  assert.equal(
    missingStepDurations.differencePayload.supportMatrix.signals.find(
      (signal) => signal.key === "step_duration",
    )?.status,
    "not_applicable",
  );

  return indexed;
}

function validateActivityTypeBoundary() {
  const cycling = compare({
    summary_payload: { session: { sport: "cycling" } },
  });

  assert.equal(cycling.comparisonStatus, "insufficient_data");
  assert.equal(cycling.completionState, "unclear");
  assert.equal(signalByKey(cycling.differencePayload, "activity_type").status, "mismatch");
  assert.equal(signalByKey(cycling.differencePayload, "duration").status, "not_applicable");
  assert.equal(signalByKey(cycling.differencePayload, "distance").status, "not_applicable");
  assert.equal(
    signalByKey(cycling.differencePayload, "structured_step_count").status,
    "not_applicable",
  );

  const missingSport = compare({ summary_payload: { session: {} } });
  assert.equal(
    signalByKey(missingSport.differencePayload, "activity_type").status,
    "missing_actual",
  );
  assert.equal(missingSport.comparisonStatus, "insufficient_data");
}

function validateEvidenceBundleIdentity(
  comparisonResult: ReturnType<typeof buildDeterministicWorkoutComparison>,
) {
  const asset = buildAssetSummary();
  const actualMetrics = buildActualMetricsSummary();
  const comparison = buildComparisonSummary(comparisonResult);
  const aiInsight = buildAiInsightSummary();
  const linked = buildWorkoutResultEvidenceBundle({
    latestAsset: asset,
    latestActualMetrics: actualMetrics,
    latestComparison: comparison,
    latestAiInsight: aiInsight,
  });

  assert.equal(linked.marker?.state, "feedback_ready");
  assert.equal(linked.latestActualMetrics?.resultAssetId, asset.id);
  assert.equal(linked.latestComparison?.actualMetricsId, actualMetrics.id);
  assert.equal(linked.latestAiInsight?.comparisonId, comparison.id);

  const rawRemoved = buildWorkoutResultEvidenceBundle({
    latestAsset: { ...asset, rawFileAvailable: false, reprocessingAvailable: false },
    latestActualMetrics: actualMetrics,
    latestComparison: comparison,
    latestAiInsight: null,
  });
  assert.equal(rawRemoved.marker?.state, "feedback_ready");
  assert.equal(rawRemoved.latestActualMetrics?.id, actualMetrics.id);

  const mismatched = buildWorkoutResultEvidenceBundle({
    latestAsset: { ...asset, id: "10000000-0000-4000-8000-000000000099" },
    latestActualMetrics: actualMetrics,
    latestComparison: comparison,
    latestAiInsight: null,
  });

  assert.equal(mismatched.marker?.state, "evidence_attached");
  assert.equal(mismatched.latestActualMetrics, null);
  assert.equal(mismatched.latestComparison, null);

  const failedAttempt = buildWorkoutResultEvidenceBundle({
    latestAsset: { ...asset, parseStatus: "failed" },
    latestActualMetrics: actualMetrics,
    latestComparison: comparison,
    latestAiInsight: null,
  });

  assert.equal(failedAttempt.marker?.state, "evidence_attached");
  assert.equal(failedAttempt.latestActualMetrics, null);
  assert.equal(failedAttempt.latestComparison, null);
}

function buildAiInsightSummary(): WorkoutAiInsightSummary {
  return {
    id: "10000000-0000-4000-8000-000000000006",
    comparisonId: COMPARISON_ID,
    actualMetricsId: METRICS_ID,
    status: "final",
    analysisSummary: "Sanitized historical insight",
    differenceExplanation: "Sanitized deterministic association proof",
    nextWorkoutRecommendation: "Keep the reviewed plan unchanged",
    recommendationLevel: "keep",
    cautionFlags: [],
    createdAt: "2026-07-17T08:01:00.000Z",
  };
}

function validateCarryForwardIdentity(
  comparisonResult: ReturnType<typeof buildDeterministicWorkoutComparison>,
) {
  const nextWorkoutId = "10000000-0000-4000-8000-000000000005";
  const relinked = relinkComparisonPlannedWorkoutIdentity(
    comparisonResult.differencePayload,
    WORKOUT_ID,
    nextWorkoutId,
  );

  assert.equal(
    (relinked.plannedWorkout as { plannedWorkoutId?: unknown }).plannedWorkoutId,
    nextWorkoutId,
  );
  const historicalRelinked = relinkComparisonPlannedWorkoutIdentity(
    buildHistoricalDualPayload(comparisonResult.differencePayload) as unknown as Json,
    WORKOUT_ID,
    nextWorkoutId,
  ) as Record<string, Json | undefined>;
  assert.equal("facts" in historicalRelinked, false);
  assert.equal(
    (historicalRelinked.plannedWorkout as { plannedWorkoutId?: unknown }).plannedWorkoutId,
    nextWorkoutId,
  );
  assert.throws(
    () =>
      relinkComparisonPlannedWorkoutIdentity(
        comparisonResult.differencePayload,
        "10000000-0000-4000-8000-000000000098",
        nextWorkoutId,
      ),
    /does not match its source workout/,
  );
}

function validatePersistedPayloadBoundary(
  comparison: ReturnType<typeof buildDeterministicWorkoutComparison>,
) {
  assert.deepEqual(
    readWorkoutComparisonDifferencePayload(comparison.differencePayload),
    comparison.differencePayload,
  );
  assert.equal(readWorkoutComparisonDifferencePayload({ broken: true }), null);

  const historicalDual = buildHistoricalDualPayload(comparison.differencePayload);
  assert.deepEqual(
    readWorkoutComparisonDifferencePayload(historicalDual as unknown as Json),
    comparison.differencePayload,
    "An exact historical dual row must normalize to the canonical signals-only Product truth.",
  );

  const factsOnly = structuredClone(historicalDual) as unknown as Record<string, Json | undefined>;
  delete factsOnly.signals;
  assert.equal(
    readWorkoutComparisonDifferencePayload(factsOnly),
    null,
    "Historical facts-only rows have no accepted canonical comparison truth.",
  );

  const contradictory = structuredClone(historicalDual);
  contradictory.facts.duration = {
    ...contradictory.facts.duration,
    status: contradictory.facts.duration.status === "matched" ? "mismatch" : "matched",
  };
  assert.equal(
    readWorkoutComparisonDifferencePayload(contradictory as unknown as Json),
    null,
    "Contradictory signals/facts metadata must reject instead of silently preferring one wire form.",
  );

  const extraHistoricalFact = structuredClone(historicalDual) as typeof historicalDual & {
    facts: HistoricalComparisonFacts & { extra: Json };
  };
  extraHistoricalFact.facts.extra = { status: "matched" };
  assert.equal(
    readWorkoutComparisonDifferencePayload(extraHistoricalFact as unknown as Json),
    null,
    "Historical dual metadata must have the exact canonical facts keyset.",
  );

  const duplicateSignal = structuredClone(comparison.differencePayload);
  duplicateSignal.signals = [duplicateSignal.signals[0], ...duplicateSignal.signals];
  assert.equal(
    readWorkoutComparisonDifferencePayload(duplicateSignal),
    null,
    "Duplicate or additional signals must not create another accepted comparison truth.",
  );
}

type HistoricalComparisonFacts = {
  activityType: WorkoutComparisonSignal;
  dateAlignment: WorkoutComparisonSignal;
  duration: WorkoutComparisonSignal;
  distance: WorkoutComparisonSignal;
  structuredStepCount: WorkoutComparisonSignal;
};

function buildHistoricalDualPayload(
  payload: WorkoutComparisonDifferencePayload,
): WorkoutComparisonDifferencePayload & { facts: HistoricalComparisonFacts } {
  return {
    ...structuredClone(payload),
    facts: {
      activityType: signalByKey(payload, "activity_type"),
      dateAlignment: signalByKey(payload, "date_alignment"),
      duration: signalByKey(payload, "duration"),
      distance: signalByKey(payload, "distance"),
      structuredStepCount: signalByKey(payload, "structured_step_count"),
    },
  };
}

function signalByKey(
  payload: WorkoutComparisonDifferencePayload,
  key: WorkoutComparisonSignal["key"],
) {
  const signal = payload.signals.find((candidate) => candidate.key === key);
  assert.ok(signal, `Expected canonical ${key} comparison signal.`);
  return signal;
}

function compare(
  overrides: Partial<{
    actual_interval_count: number | null;
    actual_step_payload: unknown;
    summary_payload: unknown;
  }> = {},
) {
  return buildDeterministicWorkoutComparison({
    plannedWorkout: {
      id: WORKOUT_ID,
      workout_date: "2026-07-17",
      workout_type: "easy",
      source_workout_type: "easy_aerobic_run",
      title: "Easy aerobic run",
      steps: [
        { sequence: 1, type: "warmup", label: "Warm-up", duration_min: 10 },
        { sequence: 2, type: "main", label: "Easy running", duration_min: 20 },
        { sequence: 3, type: "cooldown", label: "Cool-down", duration_min: 10 },
      ],
    },
    actualMetrics: {
      id: METRICS_ID,
      source_kind: "garmin_fit",
      activity_local_date: "2026-07-17",
      actual_duration_min: 40,
      actual_distance_km: 6.5,
      actual_interval_count: overrides.actual_interval_count ?? 3,
      actual_step_payload: overrides.actual_step_payload ?? [
        { sequence: 1, workoutStepIndex: 0, durationMin: 10, distanceKm: 1.5 },
        { sequence: 2, workoutStepIndex: 1, durationMin: 20, distanceKm: 3.5 },
        { sequence: 3, workoutStepIndex: 2, durationMin: 10, distanceKm: 1.5 },
      ],
      summary_payload: overrides.summary_payload ?? { session: { sport: "running" } },
    },
  });
}

function buildAssetSummary(): WorkoutResultAssetSummary {
  return {
    id: ASSET_ID,
    plannedWorkoutId: WORKOUT_ID,
    assetKind: "garmin_fit",
    originalFileName: "run.fit",
    parseStatus: "parsed",
    primaryFileKind: "fit",
    primaryFileName: "run.fit",
    parseError: null,
    rawFileAvailable: true,
    reprocessingAvailable: true,
    createdAt: "2026-07-17T12:00:00.000Z",
  };
}

function buildActualMetricsSummary(): WorkoutActualMetricsSummary {
  return {
    id: METRICS_ID,
    plannedWorkoutId: WORKOUT_ID,
    resultAssetId: ASSET_ID,
    sourceKind: "garmin_fit",
    activityStartedAt: "2026-07-17T12:00:00.000Z",
    activityLocalDate: "2026-07-17",
    actualDurationMin: 40,
    actualDistanceKm: 6.5,
    actualAvgHr: 145,
    actualMaxHr: 165,
    actualAvgPower: null,
    actualMaxPower: null,
    actualAvgCadence: 172,
    actualCalories: null,
    actualElevationGainM: null,
    actualElevationLossM: null,
    actualIntervalCount: 3,
    createdAt: "2026-07-17T12:01:00.000Z",
  };
}

function buildComparisonSummary(
  comparison: ReturnType<typeof buildDeterministicWorkoutComparison>,
): WorkoutComparisonSummary {
  return {
    id: COMPARISON_ID,
    plannedWorkoutId: WORKOUT_ID,
    actualMetricsId: METRICS_ID,
    comparisonStatus: comparison.comparisonStatus,
    completionState: comparison.completionState,
    comparisonConfidence: comparison.comparisonConfidence,
    differencePayload: comparison.differencePayload,
    createdAt: "2026-07-17T12:02:00.000Z",
  };
}

await main();
