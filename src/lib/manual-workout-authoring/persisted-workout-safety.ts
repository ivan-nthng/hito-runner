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
  const targetSource = record.target_source ?? record.targetSource;
  const hrTargetSource = record.hr_target_source ?? record.hrTargetSource;
  const sourceIsUserEntered = targetSource === "user_entered" || targetSource === "runner_entered";
  const hrSourceIsUserEntered =
    hrTargetSource === undefined ||
    hrTargetSource === "user_entered" ||
    hrTargetSource === "runner_entered";
  const hasPaceTarget =
    "pace" in record || "pace_min_per_km_range" in record || "paceMinPerKmRange" in record;
  const hasHrTarget = "hr_bpm_range" in record || "hrBpmRange" in record || "hr_bpm" in record;

  if (hasPaceTarget && !sourceIsUserEntered) {
    return true;
  }

  if (hasHrTarget && (!sourceIsUserEntered || !hrSourceIsUserEntered)) {
    return true;
  }

  if (
    record.hr_target_source === "personal_hr_zone" ||
    record.hrTargetSource === "personal_hr_zone" ||
    record.hr_target_source === "default_estimated_hr" ||
    record.hrTargetSource === "default_estimated_hr"
  ) {
    return true;
  }

  return Object.values(record).some(hasUnsafeMetricTruth);
}
