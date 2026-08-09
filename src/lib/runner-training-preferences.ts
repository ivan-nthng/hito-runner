import { z } from "zod";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export const FITNESS_LEVEL_VALUES = [
  "new_to_running",
  "beginner",
  "running_regularly",
  "performance_focused",
  "custom",
] as const;

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
  const record = asRecord(value);

  if (!record || isProductPreferenceShape(record)) return null;

  const blockedDays = record.blocked_days;
  const preferredLongRunDay = record.preferred_long_run_day;
  const maxRunningDaysPerWeek = record.max_running_days_per_week;

  if (
    (Object.hasOwn(record, "blocked_days") &&
      (!Array.isArray(blockedDays) ||
        blockedDays.some(
          (weekday) =>
            typeof weekday !== "string" || !(WEEKDAY_NAMES as readonly string[]).includes(weekday),
        ) ||
        JSON.stringify(blockedDays) !==
          JSON.stringify(uniqueRunnerWeekdays(blockedDays as WeekdayName[])))) ||
    (Object.hasOwn(record, "preferred_long_run_day") &&
      preferredLongRunDay !== null &&
      (typeof preferredLongRunDay !== "string" ||
        !(WEEKDAY_NAMES as readonly string[]).includes(preferredLongRunDay))) ||
    (Object.hasOwn(record, "max_running_days_per_week") &&
      maxRunningDaysPerWeek !== null &&
      (typeof maxRunningDaysPerWeek !== "number" ||
        !Number.isInteger(maxRunningDaysPerWeek) ||
        maxRunningDaysPerWeek < 1 ||
        maxRunningDaysPerWeek > WEEKDAY_NAMES.length))
  ) {
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

export function deriveAvailableTrainingWeekdays(
  fixedRestDays: readonly WeekdayName[],
): WeekdayName[] {
  const blockedDays = uniqueRunnerWeekdays(fixedRestDays);

  return WEEKDAY_NAMES.filter((weekday) => !blockedDays.includes(weekday));
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
  return WEEKDAY_NAMES.filter((weekday) => values.includes(weekday));
}

export function parseRunnerWeekday(value: unknown): WeekdayName {
  if (typeof value !== "string" || !(WEEKDAY_NAMES as readonly string[]).includes(value)) {
    throw new Error("Training preference weekdays must be canonical weekday names.");
  }

  return value as WeekdayName;
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
  if (blockedDays.length >= WEEKDAY_NAMES.length) {
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

  if (value > WEEKDAY_NAMES.length) {
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
