import { z } from "zod";
import type { WeekdayName } from "@/lib/weekday-rest-invariants";

export const RUNNER_TRAINING_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const satisfies readonly WeekdayName[];

const RUNNER_TRAINING_WEEKDAY_ABBREVIATIONS = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
} as const satisfies Record<string, WeekdayName>;

export const FITNESS_LEVEL_VALUES = [
  "new_to_running",
  "beginner",
  "running_regularly",
  "performance_focused",
  "custom",
] as const;

export type RunnerTrainingPreferenceWeekday = (typeof RUNNER_TRAINING_WEEKDAYS)[number];
export type RunnerFitnessLevel = (typeof FITNESS_LEVEL_VALUES)[number];

export interface RunnerTrainingPreferencesStorage {
  blocked_days: WeekdayName[];
  preferred_long_run_day: WeekdayName | null;
  max_running_days_per_week: number | null;
}

export interface RunnerTrainingPreferencesProduct {
  fixedRestDays: WeekdayName[];
  defaultRunningDaysPerWeek: number | null;
  preferredLongRunDay: WeekdayName | null;
  derivedLongRunDay: WeekdayName | null;
}

export interface RunnerFitnessBenchmarkInput {
  fitnessLevel: RunnerFitnessLevel;
  recent5kTime?: string | null;
}

export type RunnerFitnessBenchmarkAuthoringMapping =
  | {
      kind: "recent_5k_time";
      recent5kTime: string;
      recent5kPace: null;
      fitnessLevel: "custom";
    }
  | {
      kind: "unknown";
      recent5kTime: null;
      recent5kPace: null;
      fitnessLevel: Exclude<RunnerFitnessLevel, "custom">;
    };

const runnerFitnessLevelSchema = z.enum(FITNESS_LEVEL_VALUES);

export const runnerFitnessBenchmarkInputSchema = z
  .object({
    fitnessLevel: runnerFitnessLevelSchema,
    recent5kTime: z.string().trim().optional().nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    const trimmedRecent5kTime = value.recent5kTime?.trim() ?? "";

    if (value.fitnessLevel === "custom" && !trimmedRecent5kTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recent5kTime"],
        message: "Recent 5K time is required for a custom fitness level.",
      });
      return;
    }

    if (!trimmedRecent5kTime) {
      return;
    }

    const seconds = parseDurationSeconds(trimmedRecent5kTime);

    if (seconds == null || seconds < 18 * 60 || seconds > 55 * 60) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recent5kTime"],
        message: "Use a recent 5K time between 18:00 and 55:00.",
      });
    }
  });

export const runnerTrainingPreferencesSaveInputSchema = z.unknown().transform((value, context) => {
  try {
    return normalizeRunnerTrainingPreferencesForSave(value);
  } catch (error) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: error instanceof Error ? error.message : "Training preferences could not be saved.",
    });

    return z.NEVER;
  }
});

export function parseStoredRunnerTrainingPreferences(
  value: unknown,
): RunnerTrainingPreferencesStorage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  try {
    return normalizeRunnerTrainingPreferences(value);
  } catch {
    return null;
  }
}

export function normalizeRunnerTrainingPreferencesForSave(
  value: unknown,
): RunnerTrainingPreferencesStorage {
  return normalizeRunnerTrainingPreferences(value);
}

export function mapRunnerTrainingPreferencesProductToStorage(
  value: Partial<RunnerTrainingPreferencesProduct>,
): RunnerTrainingPreferencesStorage {
  return normalizeRunnerTrainingPreferencesForSave({
    fixedRestDays: value.fixedRestDays ?? [],
    defaultRunningDaysPerWeek: value.defaultRunningDaysPerWeek,
    preferredLongRunDay: value.preferredLongRunDay ?? null,
  });
}

export function mapRunnerTrainingPreferencesStorageToProduct(
  value: RunnerTrainingPreferencesStorage | null | undefined,
): RunnerTrainingPreferencesProduct | null {
  if (!value) {
    return null;
  }

  const fixedRestDays = uniqueRunnerWeekdays(value.blocked_days);

  return {
    fixedRestDays,
    defaultRunningDaysPerWeek: value.max_running_days_per_week,
    preferredLongRunDay: value.preferred_long_run_day,
    derivedLongRunDay:
      value.preferred_long_run_day ?? derivePreferredLongRunDayFallback(fixedRestDays),
  };
}

export function deriveAvailableTrainingWeekdays(
  fixedRestDays: readonly WeekdayName[],
): WeekdayName[] {
  const blockedDays = uniqueRunnerWeekdays(fixedRestDays);

  return RUNNER_TRAINING_WEEKDAYS.filter((weekday) => !blockedDays.includes(weekday));
}

export function derivePreferredLongRunDayFallback(
  fixedRestDays: readonly WeekdayName[],
): WeekdayName | null {
  const availableWeekdays = deriveAvailableTrainingWeekdays(fixedRestDays);

  if (!availableWeekdays.length) {
    return null;
  }

  if (availableWeekdays.includes("Sunday")) {
    return "Sunday";
  }

  if (availableWeekdays.includes("Saturday")) {
    return "Saturday";
  }

  return availableWeekdays.at(-1) ?? null;
}

export function uniqueRunnerWeekdays(values: readonly WeekdayName[]) {
  return RUNNER_TRAINING_WEEKDAYS.filter((weekday) => values.includes(weekday));
}

export function runningWeekdaysRequireBackToBackDays(values: readonly WeekdayName[]) {
  const weekdays = new Set(uniqueRunnerWeekdays(values));

  return RUNNER_TRAINING_WEEKDAYS.some(
    (weekday, index) =>
      weekdays.has(weekday) &&
      weekdays.has(RUNNER_TRAINING_WEEKDAYS[(index + 1) % RUNNER_TRAINING_WEEKDAYS.length]!),
  );
}

export function parseRunnerWeekday(value: unknown): WeekdayName {
  if (typeof value !== "string") {
    throw new Error("Training preference weekdays must be weekday names.");
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
  const weekday =
    RUNNER_TRAINING_WEEKDAYS.find((candidate) => candidate.toLowerCase() === normalized) ??
    RUNNER_TRAINING_WEEKDAY_ABBREVIATIONS[
      normalized as keyof typeof RUNNER_TRAINING_WEEKDAY_ABBREVIATIONS
    ];

  if (!weekday) {
    throw new Error("Choose valid weekdays for fixed rest days.");
  }

  return weekday;
}

export function normalizeRunnerFitnessBenchmark(
  value: RunnerFitnessBenchmarkInput,
): RunnerFitnessBenchmarkAuthoringMapping {
  const parsed = runnerFitnessBenchmarkInputSchema.parse(value);

  if (parsed.fitnessLevel === "custom") {
    return {
      kind: "recent_5k_time",
      recent5kTime: parsed.recent5kTime!.trim(),
      recent5kPace: null,
      fitnessLevel: "custom",
    };
  }

  return {
    kind: "unknown",
    recent5kTime: null,
    recent5kPace: null,
    fitnessLevel: parsed.fitnessLevel,
  };
}

function normalizeRunnerTrainingPreferences(value: unknown): RunnerTrainingPreferencesStorage {
  const record = asRecord(value);

  if (!record) {
    throw new Error("Training preferences must be an object.");
  }

  const productShape = isProductPreferenceShape(record);
  const fixedRestDays = productShape
    ? readWeekdayArray(record.fixedRestDays, "Fixed rest days must be a list of weekday names.")
    : readWeekdayArray(record.blocked_days, "Fixed rest days must be a list of weekday names.");
  const blockedDays = uniqueRunnerWeekdays(fixedRestDays);
  const preferredLongRunDay = productShape
    ? parseOptionalWeekday(record.preferredLongRunDay)
    : parseOptionalWeekday(record.preferred_long_run_day);
  const maxRunningDaysPerWeek = productShape
    ? parseOptionalRunningDays(record.defaultRunningDaysPerWeek)
    : parseOptionalRunningDays(record.max_running_days_per_week);
  if (blockedDays.length >= RUNNER_TRAINING_WEEKDAYS.length) {
    throw new Error("Leave at least one weekday available for running.");
  }

  if (preferredLongRunDay && blockedDays.includes(preferredLongRunDay)) {
    throw new Error("Preferred long-run day cannot be one of the fixed rest days.");
  }

  return {
    blocked_days: blockedDays,
    preferred_long_run_day: preferredLongRunDay,
    max_running_days_per_week: maxRunningDaysPerWeek,
  };
}

function readWeekdayArray(value: unknown, message: string): WeekdayName[] {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(message);
  }

  return value.map(parseRunnerWeekday);
}

function parseOptionalWeekday(value: unknown): WeekdayName | null {
  if (value == null || value === "") {
    return null;
  }

  return parseRunnerWeekday(value);
}

function parseOptionalRunningDays(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Default running days per week must be a whole number.");
  }

  if (value < 1) {
    throw new Error("Default running days per week must be at least 1.");
  }

  if (value > RUNNER_TRAINING_WEEKDAYS.length) {
    throw new Error("Default running days per week must be at most 7.");
  }

  return value;
}

function isProductPreferenceShape(record: Record<string, unknown>) {
  return (
    "fixedRestDays" in record ||
    "defaultRunningDaysPerWeek" in record ||
    "preferredLongRunDay" in record
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseDurationSeconds(value: string) {
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
