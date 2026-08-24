import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildPlanRunDifferenceRows,
  DeterministicComparisonReadback,
  getComparisonCoverageMeta,
  RunCapturedReadback,
} from "../src/components/workout-completion/WorkoutComparisonReadback";
import { feedbackMarkerMeta } from "../src/components/workout-feedback-marker-presentation";
import type {
  WorkoutActualMetricsSummary,
  WorkoutComparisonSignal,
  WorkoutComparisonSummary,
} from "../src/lib/workout-result-import/types";

const COMPLETION_ID = "10000000-0000-4000-8000-000000000001";

assert.equal(feedbackMarkerMeta(null), null);
assert.deepEqual(
  feedbackMarkerMeta({ state: "evidence_attached", sourceKind: "garmin_feedback" }),
  {
    state: "evidence_attached",
    label: "Evidence attached",
    shortLabel: "Evidence",
  },
);
assert.deepEqual(feedbackMarkerMeta({ state: "feedback_ready", sourceKind: "garmin_feedback" }), {
  state: "feedback_ready",
  label: "Feedback ready",
  shortLabel: "Feedback",
});

const complete = comparison({
  comparisonStatus: "complete",
  signals: [
    signal("activity_type", "matched", "running", "running"),
    signal("date_alignment", "matched", "2026-07-29", "2026-07-29", 0),
    signal("duration", "matched", 45, 48, 3),
    signal("distance", "matched", 7, 7, 0),
    signal("structured_step_count", "matched", 3, 3, 0),
  ],
});

const partial = comparison({
  comparisonStatus: "partial",
  signals: [
    signal("duration", "partial", 45, 48, 3),
    signal("distance", "not_applicable", null, 7.4),
  ],
});

const limited = comparison({
  comparisonStatus: "insufficient_data",
  signals: [
    signal("activity_type", "mismatch", "running", "cycling"),
    signal("duration", "missing_actual", 45, null),
    signal("distance", "not_applicable", null, 7.4),
  ],
});

assert.deepEqual(getComparisonCoverageMeta(complete), {
  label: "Complete comparison",
  tone: "signal",
});
assert.deepEqual(getComparisonCoverageMeta(partial), {
  label: "Partial comparison",
  tone: "warning",
});
assert.deepEqual(getComparisonCoverageMeta(limited), {
  label: "Limited comparison",
  tone: "muted",
});

const completeRows = buildPlanRunDifferenceRows(complete);
assert.equal(completeRows.length, 5, "each canonical primary fact renders once");
assert.equal(findRow(completeRows, "duration").difference, "+3.0 min · Within plan");
assert.equal(findRow(completeRows, "date_alignment").difference, "Same day");
assert.equal(findRow(completeRows, "structured_step_count").difference, "Matched structure");

const partialRows = buildPlanRunDifferenceRows(partial);
assert.equal(findRow(partialRows, "duration").difference, "+3.0 min · Above plan");
assert.equal(findRow(partialRows, "distance").plan, "No target");
assert.equal(findRow(partialRows, "distance").difference, "Not compared");

const limitedRows = buildPlanRunDifferenceRows(limited);
assert.equal(findRow(limitedRows, "activity_type").difference, "Different activity");
assert.equal(findRow(limitedRows, "duration").difference, "Run data unavailable");
assert.equal(findRow(limitedRows, "distance").run, "7.40 km");

const completeMarkup = renderToStaticMarkup(
  <DeterministicComparisonReadback comparison={complete} />,
);
assert.match(completeMarkup, /Plan/);
assert.match(completeMarkup, /Run/);
assert.match(completeMarkup, /Difference/);
assert.match(completeMarkup, /Activity, Plan: /);
assert.match(completeMarkup, /Activity, Run: /);
assert.match(completeMarkup, /Activity, Difference: /);
assert.match(completeMarkup, /aria-hidden="true"/);
assert.doesNotMatch(completeMarkup, /hito-status-pill/);
assert.doesNotMatch(completeMarkup, /Run summary|What this review checked|Matched plan/);

const limitedMarkup = renderToStaticMarkup(
  <DeterministicComparisonReadback comparison={limited} />,
);
assert.match(limitedMarkup, /Not comparable in this upload: Pace, heart rate, and RPE/);
assert.match(limitedMarkup, /Comparison details/);

const structureMarkup = renderToStaticMarkup(
  <DeterministicComparisonReadback comparison={comparisonWithStructure()} />,
);
assert.match(structureMarkup, /Canonical main block/);
assert.doesNotMatch(structureMarkup, /Main work/);

const actualOnlyMarkup = renderToStaticMarkup(
  <RunCapturedReadback
    actual={
      {
        id: "10000000-0000-4000-8000-000000000002",
        plannedWorkoutId: COMPLETION_ID,
        resultAssetId: "10000000-0000-4000-8000-000000000003",
        sourceKind: "garmin_fit",
        activityStartedAt: null,
        activityLocalDate: "2026-07-30",
        actualDurationMin: 42,
        actualDistanceKm: 6.8,
        actualAvgHr: 134,
        actualMaxHr: 145,
        actualAvgPower: 262,
        actualMaxPower: 371,
        actualAvgCadence: 69,
        actualCalories: 454,
        actualElevationGainM: 25,
        actualElevationLossM: 33,
        actualIntervalCount: 3,
        createdAt: "2026-07-30T07:30:00.000Z",
      } satisfies WorkoutActualMetricsSummary
    }
  />,
);
assert.match(actualOnlyMarkup, /Observed run/);
assert.match(actualOnlyMarkup, /Comparison unavailable/);
assert.match(actualOnlyMarkup, /Workout day/);
assert.match(actualOnlyMarkup, /Duration/);
assert.match(actualOnlyMarkup, /Distance/);
assert.match(actualOnlyMarkup, /Elevation gain/);
assert.match(actualOnlyMarkup, /25 m/);
assert.match(actualOnlyMarkup, /Elevation loss/);
assert.match(actualOnlyMarkup, /33 m/);
assert.match(actualOnlyMarkup, /Average heart rate/);
assert.match(actualOnlyMarkup, /134 bpm/);
assert.match(actualOnlyMarkup, /Maximum heart rate/);
assert.match(actualOnlyMarkup, /145 bpm/);
assert.match(actualOnlyMarkup, /Average power/);
assert.match(actualOnlyMarkup, /262 W/);
assert.match(actualOnlyMarkup, /Maximum power/);
assert.match(actualOnlyMarkup, /371 W/);
assert.match(actualOnlyMarkup, /Average cadence/);
assert.match(actualOnlyMarkup, /69 spm/);
assert.match(actualOnlyMarkup, /Calories/);
assert.match(actualOnlyMarkup, /454 kcal/);
assert.match(actualOnlyMarkup, /Structured intervals/);
assert.match(actualOnlyMarkup, /3 intervals/);

const observedWithComparisonMarkup = renderToStaticMarkup(
  <RunCapturedReadback
    actual={{
      id: "10000000-0000-4000-8000-000000000002",
      plannedWorkoutId: COMPLETION_ID,
      resultAssetId: "10000000-0000-4000-8000-000000000003",
      sourceKind: "garmin_fit",
      activityStartedAt: null,
      activityLocalDate: "2026-07-30",
      actualDurationMin: 42,
      actualDistanceKm: 6.8,
      actualAvgHr: null,
      actualMaxHr: null,
      actualAvgPower: null,
      actualMaxPower: null,
      actualAvgCadence: null,
      actualCalories: null,
      actualElevationGainM: null,
      actualElevationLossM: null,
      actualIntervalCount: null,
      createdAt: "2026-07-30T07:30:00.000Z",
    }}
    comparisonAvailable
  />,
);
assert.match(observedWithComparisonMarkup, /Observed run/);
assert.doesNotMatch(observedWithComparisonMarkup, /Comparison unavailable/);

console.log("Workout comparison readback contract passed.");

function comparison({
  comparisonStatus,
  signals,
}: {
  comparisonStatus: WorkoutComparisonSummary["comparisonStatus"];
  signals: WorkoutComparisonSignal[];
}): WorkoutComparisonSummary {
  return {
    id: COMPLETION_ID,
    plannedWorkoutId: COMPLETION_ID,
    actualMetricsId: "10000000-0000-4000-8000-000000000002",
    comparisonStatus,
    completionState: comparisonStatus === "complete" ? "matched" : "unclear",
    comparisonConfidence: comparisonStatus === "complete" ? 1 : 0.5,
    differencePayload: {
      plannedWorkout: {
        plannedWorkoutId: COMPLETION_ID,
        title: "Easy run",
        workoutDate: "2026-07-29",
        workoutType: "easy",
        sourceWorkoutType: "easy_aerobic_run",
        plannedDurationMin: 45,
        explicitPlannedDistanceKm: 7,
      },
      actualMetrics: {
        actualMetricsId: "10000000-0000-4000-8000-000000000002",
        sourceKind: "garmin_fit",
        activityType: "running",
        activityLocalDate: "2026-07-29",
        actualDurationMin: 48,
        actualDistanceKm: 7.4,
        actualStructuredStepCount: 3,
      },
      signals,
      supportMatrix: {
        signals: [
          { key: "pace", label: "Pace", status: "unsupported", reason: null },
          { key: "heart_rate", label: "Heart rate", status: "unsupported", reason: null },
          { key: "rpe", label: "RPE", status: "unsupported", reason: null },
        ],
      },
      stepSummary: {
        status: "not_applicable",
        mode: "none",
        reason: null,
        plannedStepCount: null,
        actualStepCount: null,
        comparedStepCount: 0,
        matchedStepCount: 0,
        partialStepCount: 0,
        mismatchStepCount: 0,
        missingActualStepCount: 0,
        steps: [],
      },
      segmentSummary: {
        status: "not_applicable",
        mode: "none",
        reason: null,
        groups: [],
      },
      summary: {
        comparedSignalCount: signals.filter(
          (entry) =>
            entry.status === "matched" || entry.status === "partial" || entry.status === "mismatch",
        ).length,
        visibleSignalCount: signals.length,
        matchedSignals: signals.filter((entry) => entry.status === "matched").length,
        partialSignals: signals.filter((entry) => entry.status === "partial").length,
        mismatchSignals: signals.filter((entry) => entry.status === "mismatch").length,
        missingActualSignals: signals.filter((entry) => entry.status === "missing_actual").length,
        notApplicableSignals: signals.filter((entry) => entry.status === "not_applicable").length,
        comparedSignalKeys: signals
          .filter((entry) => entry.status !== "missing_actual" && entry.status !== "not_applicable")
          .map((entry) => entry.key),
      },
    },
    createdAt: "2026-07-30T07:30:00.000Z",
  };
}

function signal(
  key: WorkoutComparisonSignal["key"],
  status: WorkoutComparisonSignal["status"],
  plannedValue: WorkoutComparisonSignal["plannedValue"],
  actualValue: WorkoutComparisonSignal["actualValue"],
  delta: number | null = null,
): WorkoutComparisonSignal {
  const unit =
    key === "duration"
      ? "min"
      : key === "distance"
        ? "km"
        : key === "date_alignment"
          ? "date"
          : key === "structured_step_count"
            ? "count"
            : "kind";

  return {
    key,
    label: key.replace(/_/g, " "),
    unit,
    status,
    plannedValue,
    actualValue,
    delta,
    deltaPct: null,
    matchedTolerancePct: key === "duration" ? 0.2 : null,
    partialTolerancePct: key === "duration" ? 0.4 : null,
  };
}

function comparisonWithStructure(): WorkoutComparisonSummary {
  const comparisonSummary = comparison({
    comparisonStatus: "partial",
    signals: [signal("structured_step_count", "partial", 3, 2, -1)],
  });

  return {
    ...comparisonSummary,
    differencePayload: {
      ...comparisonSummary.differencePayload,
      segmentSummary: {
        status: "available",
        mode: "aligned",
        reason: null,
        groups: [
          {
            key: "main",
            label: "Canonical main block",
            status: "partial",
            plannedStepCount: 3,
            actualStepCount: 2,
            plannedDurationMin: 30,
            actualDurationMin: 28,
            durationDeltaMin: -2,
          },
        ],
      },
    },
  };
}

function findRow(
  rows: ReturnType<typeof buildPlanRunDifferenceRows>,
  key: WorkoutComparisonSignal["key"],
) {
  const row = rows.find((entry) => entry.key === key);
  assert.ok(row, `Expected ${key} primary row.`);
  return row;
}
