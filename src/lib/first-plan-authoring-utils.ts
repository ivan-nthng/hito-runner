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

export type FirstPlanGoalDistance = (typeof FIRST_PLAN_GOAL_DISTANCE_VALUES)[number];
export type FirstPlanGoalStyle = (typeof FIRST_PLAN_GOAL_STYLE_VALUES)[number];
export type FirstPlanTerrainFocus = (typeof FIRST_PLAN_TERRAIN_FOCUS_VALUES)[number];
export type FirstPlanWatchAccess = (typeof FIRST_PLAN_WATCH_ACCESS_VALUES)[number];
export type FirstPlanGuidancePreference = (typeof FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES)[number];
export type FirstPlanPreferredEffortLanguage = "pace" | "heart_rate" | "rpe" | "mixed";

export interface FirstPlanExecutionMode {
  watchAccess: FirstPlanWatchAccess;
  guidancePreference: FirstPlanGuidancePreference;
}

export const DEFAULT_FIRST_PLAN_EXECUTION_MODE: FirstPlanExecutionMode = {
  watchAccess: "unknown",
  guidancePreference: "effort",
};

export const DEFAULT_SUPPORTED_FIRST_PLAN_EXECUTION_MODE: FirstPlanExecutionMode = {
  watchAccess: "watch_or_app",
  guidancePreference: "effort",
};

export function normalizeFirstPlanExecutionMode(
  value:
    | Partial<{
        watchAccess: FirstPlanWatchAccess | null;
        guidancePreference: FirstPlanGuidancePreference | null;
      }>
    | null
    | undefined,
): FirstPlanExecutionMode {
  return {
    watchAccess: value?.watchAccess ?? DEFAULT_FIRST_PLAN_EXECUTION_MODE.watchAccess,
    guidancePreference:
      value?.guidancePreference ?? DEFAULT_FIRST_PLAN_EXECUTION_MODE.guidancePreference,
  };
}

export function normalizeSupportedFirstPlanExecutionMode(
  value:
    | Partial<{
        watchAccess: FirstPlanWatchAccess | null;
        guidancePreference: FirstPlanGuidancePreference | null;
      }>
    | null
    | undefined,
): FirstPlanExecutionMode {
  return {
    watchAccess: DEFAULT_SUPPORTED_FIRST_PLAN_EXECUTION_MODE.watchAccess,
    guidancePreference:
      value?.guidancePreference ?? DEFAULT_SUPPORTED_FIRST_PLAN_EXECUTION_MODE.guidancePreference,
  };
}

export function guidancePreferenceToPreferredEffortLanguage(
  guidancePreference: FirstPlanGuidancePreference,
): FirstPlanPreferredEffortLanguage {
  switch (guidancePreference) {
    case "pace":
      return "pace";
    case "heart_rate":
      return "heart_rate";
    case "mixed":
      return "mixed";
    case "effort":
      return "rpe";
  }
}

export function uniqueWeekdays(values: readonly WeekdayName[]) {
  return WEEKDAY_NAMES.filter((weekday) => values.includes(weekday));
}

export function isWeekdayName(value: unknown): value is WeekdayName {
  return typeof value === "string" && WEEKDAY_NAMES.includes(value as WeekdayName);
}

export function chooseLongRunDay(weekdays: readonly WeekdayName[]) {
  if (weekdays.includes("Sunday")) {
    return "Sunday";
  }

  if (weekdays.includes("Saturday")) {
    return "Saturday";
  }

  return weekdays.at(-1) ?? "Sunday";
}

export function pickEvenly<T>(values: readonly T[], count: number) {
  if (count <= 0 || values.length === 0) return [];
  if (count >= values.length) return [...values];
  if (count === 1) return [values[Math.floor(values.length / 2)]!];

  const selected: T[] = [];

  for (let index = 0; index < count; index += 1) {
    const sourceIndex = Math.round((index * (values.length - 1)) / (count - 1));
    const value = values[sourceIndex]!;

    if (!selected.includes(value)) {
      selected.push(value);
    }
  }

  for (const value of values) {
    if (selected.length >= count) break;
    if (!selected.includes(value)) {
      selected.push(value);
    }
  }

  return selected;
}

export function formatGoalDistance(goalDistance: FirstPlanGoalDistance) {
  switch (goalDistance) {
    case "build_consistency":
      return "Build consistency";
    case "5k":
      return "5K";
    case "10k":
      return "10K";
    case "half_marathon":
      return "Half marathon";
    case "marathon":
      return "Marathon";
    case "ultra_marathon":
      return "Ultra marathon";
    case "mountain_running":
      return "Mountain running";
  }
}

export function formatGoalStyle(
  goalStyle: FirstPlanGoalStyle,
  letterCase: "sentence" | "title" = "sentence",
) {
  const label = (() => {
    switch (goalStyle) {
      case "relaxed":
        return "relaxed";
      case "balanced":
        return "balanced";
      case "ambitious":
        return "ambitious";
      case "target_time":
        return "target time";
    }
  })();

  return letterCase === "title" ? label.charAt(0).toUpperCase() + label.slice(1) : label;
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
