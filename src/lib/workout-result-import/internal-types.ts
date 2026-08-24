import type { Json } from "@/lib/supabase/database";
import type { WorkoutResultImportError } from "@/lib/workout-result-import/types";

export const WORKOUT_RESULT_STORAGE_BUCKET = "workout-result-assets";
export const MAX_WORKOUT_RESULT_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_WORKOUT_RESULT_MULTIPART_BYTES = MAX_WORKOUT_RESULT_UPLOAD_BYTES + 1024 * 1024;

/** Safe metadata for loopback request attribution; never includes parser or database details. */
export const WORKOUT_RESULT_OBSERVABILITY_OUTCOME_HEADER = "x-hito-workout-result-outcome";

export function workoutResultErrorResponseHeaders(code: WorkoutResultImportError["code"]) {
  return { [WORKOUT_RESULT_OBSERVABILITY_OUTCOME_HEADER]: code };
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
  totalTimerDurationMin: number | null;
  totalElapsedDurationMin: number | null;
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
