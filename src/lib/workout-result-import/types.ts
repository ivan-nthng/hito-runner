export type WorkoutResultAssetKind = "garmin_fit" | "garmin_zip";
export type WorkoutResultParseStatus = "uploaded" | "extracted" | "parsed" | "failed";
export type WorkoutFeedbackMarkerState = "evidence_attached" | "feedback_ready";
export type WorkoutComparisonStatus = "complete" | "partial" | "insufficient_data";
export type WorkoutComparisonCompletionState = "matched" | "partially_matched" | "unclear";
export type WorkoutAiInsightStatus = "final" | "superseded";
export type WorkoutAiRecommendationLevel = "keep" | "soft_adjust" | "review";
export type WorkoutComparisonFactStatus =
  | "matched"
  | "partial"
  | "mismatch"
  | "missing_actual"
  | "not_applicable";
export type WorkoutComparisonSignalKey =
  | "activity_type"
  | "date_alignment"
  | "duration"
  | "distance"
  | "structured_step_count";
export type WorkoutComparisonSignalUnit = "kind" | "date" | "min" | "km" | "count";
export type WorkoutComparisonSupportStatus =
  | "compared"
  | "missing_actual"
  | "not_applicable"
  | "unsupported";
export type WorkoutComparisonSupportSignalKey =
  | WorkoutComparisonSignalKey
  | "step_duration"
  | "segment_group_duration"
  | "pace"
  | "heart_rate"
  | "rpe";
export type WorkoutComparisonSegmentGroupKey =
  | "warmup"
  | "main"
  | "cooldown"
  | "recovery"
  | "other";

export type ContinuationEvidenceState =
  | "fit_current"
  | "completed_without_fit"
  | "missing"
  | "updating"
  | "removed";

export interface ContinuationAcceptedActualMetrics {
  activityStartedAt: string | null;
  activityLocalDate: string | null;
  durationMin: number | null;
  distanceKm: number | null;
  averageHeartRate: number | null;
  maximumHeartRate: number | null;
  averagePower: number | null;
  maximumPower: number | null;
  averageCadence: number | null;
  calories: number | null;
  elevationGainMetres: number | null;
  elevationLossMetres: number | null;
  intervalCount: number | null;
}

export interface ContinuationEvidencePacket {
  asOf: string;
  cutoffDate: string;
  calendarOutcomeFingerprint: string;
  evidenceRevisionFingerprint: string;
  dueWorkoutCount: number;
  resolvedOutcomeCount: number;
  workouts: Array<{
    calendarWorkoutId: string;
    workoutDate: string;
    outcome: "completed" | "partial" | "skipped" | "unresolved";
    outcomeRevision: string;
    sessionRpe: number | null;
    evidenceState: ContinuationEvidenceState;
    acceptedActualMetrics: ContinuationAcceptedActualMetrics | null;
    comparisonStatus: WorkoutComparisonStatus | null;
    missingReasons: Array<
      | "outcome_missing"
      | "evidence_missing"
      | "evidence_updating"
      | "evidence_removed"
      | "actual_metrics_missing"
    >;
  }>;
}

export class WorkoutResultImportError extends Error {
  code:
    | "auth_required"
    | "invalid_upload"
    | "unsupported_file_type"
    | "file_too_large"
    | "planned_workout_not_found"
    | "rest_day_not_supported"
    | "zip_missing_fit"
    | "zip_multiple_fit"
    | "fit_parse_failed"
    | "activity_already_recorded"
    | "storage_failed"
    | "persistence_failed";
  status: number;

  constructor(code: WorkoutResultImportError["code"], message: string, status = 400) {
    super(message);
    this.name = "WorkoutResultImportError";
    this.code = code;
    this.status = status;
  }
}

/** The only error copy that may leave the workout-result server boundary. */
export function runnerSafeWorkoutResultMessage(error: unknown): string {
  if (!(error instanceof WorkoutResultImportError)) {
    return "The Garmin result could not be processed. Your planned workout is unchanged.";
  }

  const messages: Record<WorkoutResultImportError["code"], string> = {
    auth_required: "Sign in again before changing Garmin evidence.",
    invalid_upload: "Choose a Garmin .fit file or a .zip archive before uploading.",
    unsupported_file_type:
      "Only Garmin .fit files or .zip archives containing one FIT activity are supported.",
    file_too_large: "Choose a Garmin file smaller than 25 MB.",
    planned_workout_not_found: "That planned workout is no longer available for this upload.",
    rest_day_not_supported: "Garmin activity evidence can only be attached to a planned workout.",
    zip_missing_fit: "This ZIP does not contain a usable Garmin FIT activity file.",
    zip_multiple_fit: "This ZIP contains more than one FIT file. Upload one Garmin activity only.",
    fit_parse_failed:
      "We could not read that Garmin activity. Choose the original FIT activity file and try again.",
    activity_already_recorded:
      "This Garmin activity is already attached to another workout. Choose the matching workout instead.",
    storage_failed: "We could not store that Garmin file. Try again shortly.",
    persistence_failed: "The Garmin result could not be saved. Your planned workout is unchanged.",
  };

  return messages[error.code];
}

export interface WorkoutResultAssetSummary {
  id: string;
  plannedWorkoutId: string | null;
  assetKind: WorkoutResultAssetKind;
  originalFileName: string;
  parseStatus: WorkoutResultParseStatus;
  primaryFileKind: "fit" | null;
  primaryFileName: string | null;
  parseError: string | null;
  rawFileAvailable: boolean;
  reprocessingAvailable: boolean;
  createdAt: string;
}

export interface WorkoutActualMetricsSummary {
  id: string;
  plannedWorkoutId: string;
  resultAssetId: string;
  sourceKind: "garmin_fit";
  activityStartedAt: string | null;
  activityLocalDate: string | null;
  actualDurationMin: number | null;
  actualDistanceKm: number | null;
  actualAvgHr: number | null;
  actualMaxHr: number | null;
  actualAvgPower: number | null;
  actualMaxPower: number | null;
  actualAvgCadence: number | null;
  actualCalories: number | null;
  actualElevationGainM: number | null;
  actualElevationLossM: number | null;
  actualIntervalCount: number | null;
  createdAt: string;
}

export interface WorkoutComparisonSummary {
  id: string;
  plannedWorkoutId: string;
  actualMetricsId: string;
  comparisonStatus: WorkoutComparisonStatus;
  completionState: WorkoutComparisonCompletionState;
  comparisonConfidence: number;
  differencePayload: WorkoutComparisonDifferencePayload;
  createdAt: string;
}

export interface WorkoutFeedbackMarkerSummary {
  state: WorkoutFeedbackMarkerState;
  sourceKind: "garmin_feedback";
}

export interface WorkoutResultFeedbackSummary {
  marker: WorkoutFeedbackMarkerSummary | null;
  latestAsset: WorkoutResultAssetSummary | null;
  latestActualMetrics: WorkoutActualMetricsSummary | null;
  latestComparison: WorkoutComparisonSummary | null;
  latestAiInsight: WorkoutAiInsightSummary | null;
}

export interface WorkoutComparisonSignal {
  key: WorkoutComparisonSignalKey;
  label: string;
  unit: WorkoutComparisonSignalUnit;
  status: WorkoutComparisonFactStatus;
  reason?: string;
  plannedValue?: string | number | null;
  actualValue?: string | number | null;
  delta?: number | null;
  deltaPct?: number | null;
  matchedTolerancePct?: number | null;
  partialTolerancePct?: number | null;
  magnitude?: "within_tolerance" | "slightly_off" | "meaningfully_off" | null;
}

export interface WorkoutComparisonStepDetail {
  plannedSequence: number;
  actualSequence: number | null;
  workoutStepIndex: number | null;
  type: string;
  label: string | null;
  status: WorkoutComparisonFactStatus;
  plannedDurationMin: number | null;
  actualDurationMin: number | null;
  durationDeltaMin: number | null;
  durationDeltaPct: number | null;
}

export interface WorkoutComparisonStepSummary {
  status: "available" | "not_applicable";
  mode: "ordered_simple" | "count_only" | "none";
  reason: string | null;
  plannedStepCount: number | null;
  actualStepCount: number | null;
  comparedStepCount: number;
  matchedStepCount: number;
  partialStepCount: number;
  mismatchStepCount: number;
  missingActualStepCount: number;
  steps: WorkoutComparisonStepDetail[];
}

export interface WorkoutComparisonSegmentGroup {
  key: WorkoutComparisonSegmentGroupKey;
  label: string;
  status: WorkoutComparisonFactStatus;
  reason: string | null;
  plannedStepCount: number;
  actualStepCount: number;
  plannedDurationMin: number | null;
  actualDurationMin: number | null;
  durationDeltaMin: number | null;
  durationDeltaPct: number | null;
  plannedDistanceKm: number | null;
  actualDistanceKm: number | null;
  distanceDeltaKm: number | null;
}

export interface WorkoutComparisonSegmentSummary {
  status: "available" | "not_applicable";
  mode: "ordered_simple_groups" | "none";
  reason: string | null;
  groups: WorkoutComparisonSegmentGroup[];
}

export interface WorkoutComparisonSupportItem {
  key: WorkoutComparisonSupportSignalKey;
  label: string;
  status: WorkoutComparisonSupportStatus;
  reason: string | null;
}

export interface WorkoutComparisonSupportMatrix {
  signals: WorkoutComparisonSupportItem[];
}

export interface WorkoutComparisonDifferencePayload {
  plannedWorkout: {
    plannedWorkoutId: string;
    title: string;
    workoutDate: string;
    workoutType: string;
    sourceWorkoutType: string | null;
    plannedDurationMin: number;
    explicitPlannedDistanceKm: number | null;
  };
  actualMetrics: {
    actualMetricsId: string;
    sourceKind: string;
    activityType: string | null;
    activityLocalDate: string | null;
    actualDurationMin: number | null;
    actualDistanceKm: number | null;
    actualStructuredStepCount: number | null;
  };
  signals: WorkoutComparisonSignal[];
  supportMatrix: WorkoutComparisonSupportMatrix;
  stepSummary: WorkoutComparisonStepSummary;
  segmentSummary: WorkoutComparisonSegmentSummary;
  summary: {
    comparedSignalCount: number;
    visibleSignalCount: number;
    matchedSignals: number;
    partialSignals: number;
    mismatchSignals: number;
    missingActualSignals: number;
    notApplicableSignals: number;
    comparedSignalKeys: WorkoutComparisonSignalKey[];
  };
}

export interface WorkoutAiInsightSummary {
  id: string;
  comparisonId: string;
  actualMetricsId: string;
  status: WorkoutAiInsightStatus;
  analysisSummary: string;
  differenceExplanation: string;
  nextWorkoutRecommendation: string;
  recommendationLevel: WorkoutAiRecommendationLevel;
  cautionFlags: string[];
  createdAt: string;
}
