import type { PersistedPlannedWorkoutRow } from "@/lib/active-plan-persistence";

export function persistedManualWorkoutHasUnsafeMetricTruth(workout: PersistedPlannedWorkoutRow) {
  return hasUnsafeMetricTruth(workout.metric_mode) || hasUnsafeMetricTruth(workout.steps);
}

function hasUnsafeMetricTruth(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasUnsafeMetricTruth);
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (
    "pace" in record ||
    "pace_min_per_km_range" in record ||
    "paceMinPerKmRange" in record ||
    "hr_bpm_range" in record ||
    "hrBpmRange" in record ||
    record.hr_target_source === "personal_hr_zone" ||
    record.hrTargetSource === "personal_hr_zone"
  ) {
    return true;
  }

  return Object.values(record).some(hasUnsafeMetricTruth);
}
