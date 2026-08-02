import { isAiGeneratedRunningPlanDevFixtureEnabled } from "@/lib/ai-generated-running-plan-dev-fixture";
import { buildDeterministicWorkoutComparison } from "@/lib/workout-result-import/compare-workout-result";
import { buildWorkoutResultEvidenceBundle } from "@/lib/workout-result-import/evidence-bundle";
import type { WorkoutResultFeedbackSummary } from "@/lib/workout-result-import/types";
import { workoutDistanceKm, workoutDuration, type Workout } from "@/lib/training";

const FIXTURE_CREATED_AT = "2026-07-31T12:00:00.000Z";
const FIXTURE_ASSET_ID_SUFFIX = "local-activity-file-design-asset";
const FIXTURE_METRICS_ID_SUFFIX = "local-activity-file-design-metrics";
const FIXTURE_COMPARISON_ID_SUFFIX = "local-activity-file-design-comparison";

type FixtureWorkout = Pick<
  Workout,
  "id" | "date" | "title" | "type" | "sourceWorkoutType" | "steps"
>;

/** This shares the existing local qa_fixture authorization gate with plan-preview QA. */
export function isLocalActivityFileDesignFixtureEnabled() {
  return isAiGeneratedRunningPlanDevFixtureEnabled();
}

export function buildLocalActivityFileDesignFixture(
  workout: FixtureWorkout,
  selectedFileName: string,
): WorkoutResultFeedbackSummary {
  const assetId = `${workout.id}-${FIXTURE_ASSET_ID_SUFFIX}`;
  const metricsId = `${workout.id}-${FIXTURE_METRICS_ID_SUFFIX}`;
  const plannedDurationMin = Math.max(workoutDuration(workout), 1);
  const plannedDistanceKm = workoutDistanceKm(workout);
  const actualDurationMin = roundToOneDecimal(plannedDurationMin * 1.04);
  const actualDistanceKm =
    plannedDistanceKm == null ? 6.4 : roundToTwoDecimals(plannedDistanceKm * 1.02);
  const assetKind = selectedFileName.toLowerCase().endsWith(".zip") ? "garmin_zip" : "garmin_fit";

  const latestAsset = {
    id: assetId,
    plannedWorkoutId: workout.id,
    assetKind,
    originalFileName: selectedFileName,
    parseStatus: "parsed" as const,
    primaryFileKind: "fit" as const,
    primaryFileName: selectedFileName,
    parseError: null,
    createdAt: FIXTURE_CREATED_AT,
  };
  const latestActualMetrics = {
    id: metricsId,
    plannedWorkoutId: workout.id,
    resultAssetId: assetId,
    sourceKind: "garmin_fit" as const,
    activityStartedAt: `${workout.date}T07:30:00.000Z`,
    activityLocalDate: workout.date,
    actualDurationMin,
    actualDistanceKm,
    actualAvgHr: 146,
    actualMaxHr: 163,
    actualAvgPower: null,
    actualMaxPower: null,
    actualAvgCadence: 172,
    actualCalories: 438,
    actualElevationGainM: 42,
    actualElevationLossM: 42,
    actualIntervalCount: null,
    createdAt: FIXTURE_CREATED_AT,
  };
  const deterministicComparison = buildDeterministicWorkoutComparison({
    plannedWorkout: {
      id: workout.id,
      workout_date: workout.date,
      workout_type: workout.type,
      source_workout_type: workout.sourceWorkoutType,
      title: workout.title,
      steps: workout.steps,
    } as Parameters<typeof buildDeterministicWorkoutComparison>[0]["plannedWorkout"],
    actualMetrics: {
      id: metricsId,
      source_kind: "garmin_fit",
      activity_local_date: workout.date,
      actual_duration_min: actualDurationMin,
      actual_distance_km: actualDistanceKm,
      actual_interval_count: null,
      actual_step_payload: [],
      summary_payload: { session: { sport: "running" } },
    } as Parameters<typeof buildDeterministicWorkoutComparison>[0]["actualMetrics"],
  });

  return buildWorkoutResultEvidenceBundle({
    latestAsset,
    latestActualMetrics,
    latestComparison: {
      id: `${workout.id}-${FIXTURE_COMPARISON_ID_SUFFIX}`,
      plannedWorkoutId: workout.id,
      actualMetricsId: metricsId,
      comparisonStatus: deterministicComparison.comparisonStatus,
      completionState: deterministicComparison.completionState,
      comparisonConfidence: deterministicComparison.comparisonConfidence,
      differencePayload: deterministicComparison.differencePayload,
      createdAt: FIXTURE_CREATED_AT,
    },
    latestAiInsight: null,
  });
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}
