import type { Json } from "@/lib/supabase/database";

export const WORKOUT_RESULT_STORAGE_BUCKET = "workout-result-assets";
export const MAX_WORKOUT_RESULT_UPLOAD_BYTES = 25 * 1024 * 1024;

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

export interface ExtractedGarminFitFile {
  primaryFileKind: "fit";
  primaryFileName: string;
  fileBuffer: Buffer;
}

export interface ParsedActualWorkoutLap {
  sequence: number;
  workoutStepIndex: number | null;
  startedAt: string | null;
  durationMin: number | null;
  distanceKm: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPower: number | null;
  maxPower: number | null;
  avgCadence: number | null;
  calories: number | null;
  elevationGainM: number | null;
  elevationLossM: number | null;
  intensity: string | null;
  lapTrigger: string | null;
}

export interface ParsedActualWorkoutStep {
  sequence: number;
  workoutStepIndex: number | null;
  lapCount: number;
  durationMin: number | null;
  distanceKm: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPower: number | null;
  maxPower: number | null;
  avgCadence: number | null;
  calories: number | null;
  elevationGainM: number | null;
  elevationLossM: number | null;
}

export interface ParsedGarminWorkout {
  sourceKind: "garmin_fit";
  activityStartAt: string | null;
  activityLocalDate: string | null;
  totalDistanceKm: number | null;
  totalDurationMin: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPower: number | null;
  maxPower: number | null;
  totalCalories: number | null;
  totalAscentM: number | null;
  totalDescentM: number | null;
  avgCadence: number | null;
  avgTemperatureC: number | null;
  gpsPointCount: number;
  lapCount: number;
  workoutName: string | null;
  actualIntervalCount: number | null;
  actualStepPayload: Json;
  lapPayload: Json;
  summaryPayload: Json;
}

export interface WorkoutResultAssetSummary {
  id: string;
  plannedWorkoutId: string;
  assetKind: WorkoutResultAssetKind;
  originalFileName: string;
  parseStatus: WorkoutResultParseStatus;
  primaryFileKind: "fit" | null;
  primaryFileName: string | null;
  parseError: string | null;
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
  facts: {
    activityType: WorkoutComparisonSignal;
    dateAlignment: WorkoutComparisonSignal;
    duration: WorkoutComparisonSignal;
    distance: WorkoutComparisonSignal;
    structuredStepCount: WorkoutComparisonSignal;
  };
  sessionSummary: {
    dateDeltaDays: number | null;
    durationDeltaMin: number | null;
    durationDeltaPct: number | null;
    distanceDeltaKm: number | null;
    distanceDeltaPct: number | null;
    plannedStructuredStepCount: number | null;
    actualStructuredStepCount: number | null;
  };
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
  model: string;
  responseId: string | null;
  status: WorkoutAiInsightStatus;
  analysisSummary: string;
  differenceExplanation: string;
  nextWorkoutRecommendation: string;
  recommendationLevel: WorkoutAiRecommendationLevel;
  cautionFlags: string[];
  createdAt: string;
}
