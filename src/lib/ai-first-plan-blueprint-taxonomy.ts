export const weekdayValues = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const phaseValues = ["Base", "Build", "Specific", "Taper"] as const;
export const estimatedFatigueValues = ["very_low", "low", "medium", "medium_high", "high"] as const;
export const recoveryPriorityValues = ["low", "medium", "high"] as const;
export const segmentIntentValues = [
  "recovery",
  "easy_aerobic",
  "steady_aerobic",
  "long_durability",
  "tempo_sustained",
  "interval_repeats",
  "hill_strength",
  "trail_terrain",
  "progression",
  "race_tuneup",
  "rest",
] as const;
export const metricIntentValues = [
  "effort_only",
  "pace_if_allowed",
  "default_hr_if_allowed",
  "mixed_if_allowed",
] as const;
export const authoredWorkoutFamilyValues = [
  "recovery",
  "easy",
  "steady",
  "long",
  "tempo",
  "intervals",
  "progression",
  "race",
  "hills",
  "trail",
] as const;
export const authoredWorkoutIdentityValues = [
  "easy_aerobic_run",
  "recovery_jog",
  "steady_aerobic_run",
  "cutback_aerobic_run",
  "easy_run_with_strides",
  "long_aerobic_run",
  "long_run_with_steady_finish",
  "cutback_long_run",
  "taper_long_run",
  "controlled_tempo_session",
  "half_marathon_threshold_durability",
  "marathon_steady_specificity",
  "distance_intervals",
  "time_intervals",
  "5k_sharpening_repeats",
  "10k_rhythm_intervals",
  "progression_run",
  "race_pace_session",
  "taper_tuneup_run",
  "uphill_repeats",
  "rolling_hills_session",
  "technical_trail_easy",
  "controlled_downhill_durability",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
  "ultra_time_on_feet_durability",
  "climbing_steady_run",
  "quality_session",
] as const;
export const authoredCalendarIconKeyValues = authoredWorkoutFamilyValues;

export const hardWorkoutFamilies = new Set(["tempo", "intervals", "hills", "race"]);
export const mainLikeSegmentTypes = new Set(["main", "tempo_block", "interval_block", "strides"]);

export type AuthoredWorkoutIdentity = (typeof authoredWorkoutIdentityValues)[number];
export type AuthoredWorkoutFamily = (typeof authoredWorkoutFamilyValues)[number];

export function weekdayIndex(weekday: string) {
  return weekdayValues.indexOf(weekday as (typeof weekdayValues)[number]);
}
