import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export const FIRST_PLAN_GOAL_DISTANCE_VALUES = [
  "build_consistency",
  "5k",
  "10k",
  "half_marathon",
  "marathon",
  "ultra_marathon",
  "mountain_running",
] as const;

export const FIRST_PLAN_GOAL_STYLE_VALUES = [
  "relaxed",
  "balanced",
  "ambitious",
  "target_time",
] as const;

export const FIRST_PLAN_TERRAIN_FOCUS_VALUES = ["standard", "rolling", "mountain"] as const;

export const FIRST_PLAN_WATCH_ACCESS_VALUES = ["none", "watch_or_app", "unknown"] as const;

export const FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES = [
  "effort",
  "pace",
  "heart_rate",
  "mixed",
] as const;

export function uniqueWeekdays(values: readonly WeekdayName[]) {
  return WEEKDAY_NAMES.filter((weekday) => values.includes(weekday));
}

export function isRealIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseDurationSeconds(value: string) {
  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.length !== 2 && parts.length !== 3) return null;
  if (parts.some((part) => !Number.isInteger(part) || part < 0)) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;

    if (seconds == null || seconds >= 60) return null;
    return minutes! * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;

  if (minutes == null || seconds == null || minutes >= 60 || seconds >= 60) return null;
  return hours! * 3600 + minutes * 60 + seconds;
}

export function parsePaceSecondsPerKm(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
  const pace = normalized.replace(/\/?km$/, "");

  return parseDurationSeconds(pace);
}
