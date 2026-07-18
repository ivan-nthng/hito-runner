import type {
  WorkoutAiInsightSummary,
  WorkoutActualMetricsSummary,
  WorkoutComparisonSummary,
  WorkoutFeedbackMarkerSummary,
  WorkoutResultAssetSummary,
  WorkoutResultFeedbackSummary,
} from "@/lib/workout-result-import/types";

interface WorkoutResultEvidenceCandidates {
  latestAsset: WorkoutResultAssetSummary | null;
  latestActualMetrics: WorkoutActualMetricsSummary | null;
  latestComparison: WorkoutComparisonSummary | null;
  latestAiInsight: WorkoutAiInsightSummary | null;
}

export function buildWorkoutResultEvidenceBundle(
  candidates: WorkoutResultEvidenceCandidates,
): WorkoutResultFeedbackSummary {
  const latestAsset = candidates.latestAsset;
  const latestActualMetrics =
    latestAsset?.parseStatus === "parsed" &&
    candidates.latestActualMetrics?.plannedWorkoutId === latestAsset.plannedWorkoutId &&
    candidates.latestActualMetrics.resultAssetId === latestAsset.id
      ? candidates.latestActualMetrics
      : null;
  const latestComparison =
    latestActualMetrics &&
    candidates.latestComparison?.plannedWorkoutId === latestActualMetrics.plannedWorkoutId &&
    candidates.latestComparison.actualMetricsId === latestActualMetrics.id
      ? candidates.latestComparison
      : null;
  const latestAiInsight =
    latestComparison &&
    latestActualMetrics &&
    candidates.latestAiInsight?.comparisonId === latestComparison.id &&
    candidates.latestAiInsight.actualMetricsId === latestActualMetrics.id
      ? candidates.latestAiInsight
      : null;

  return {
    marker: deriveWorkoutFeedbackMarker({
      latestAsset,
      latestActualMetrics,
      latestComparison,
    }),
    latestAsset,
    latestActualMetrics,
    latestComparison,
    latestAiInsight,
  };
}

function deriveWorkoutFeedbackMarker(feedback: {
  latestAsset: WorkoutResultAssetSummary | null;
  latestActualMetrics: WorkoutActualMetricsSummary | null;
  latestComparison: WorkoutComparisonSummary | null;
}): WorkoutFeedbackMarkerSummary | null {
  if (feedback.latestComparison && feedback.latestActualMetrics) {
    return {
      state: "feedback_ready",
      sourceKind: "garmin_feedback",
    };
  }

  if (feedback.latestAsset) {
    return {
      state: "evidence_attached",
      sourceKind: "garmin_feedback",
    };
  }

  return null;
}
