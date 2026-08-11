import { z } from "zod";

export const DEFAULT_RUNNER_CALENDAR_TIMEZONE = "UTC";

export const RUNNER_CALENDAR_TIMEZONE_SOURCE_VALUES = ["fallback_utc", "browser", "user"] as const;

export type RunnerCalendarTimezoneSource = (typeof RUNNER_CALENDAR_TIMEZONE_SOURCE_VALUES)[number];

export const runnerCalendarTimezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .transform((value, context) => {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: value }).resolvedOptions().timeZone;
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a recognized IANA timezone.",
      });
      return z.NEVER;
    }
  });

export const runnerCalendarTimezoneSourceSchema = z.enum(RUNNER_CALENDAR_TIMEZONE_SOURCE_VALUES);

export interface RunnerCalendarContext {
  timeZone: string;
  source: RunnerCalendarTimezoneSource;
  currentDate: string;
}

export function canonicalizeRunnerCalendarTimezone(value: unknown) {
  return runnerCalendarTimezoneSchema.parse(value);
}

export function dateIsoInRunnerTimezone(timeZone: string, instant: Date = new Date()) {
  const canonicalTimeZone = canonicalizeRunnerCalendarTimezone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: canonicalTimeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("The runner calendar date could not be resolved.");
  }

  return `${year}-${month}-${day}`;
}

export function buildRunnerCalendarContext(input: {
  calendarTimezone: unknown;
  calendarTimezoneSource: unknown;
  instant?: Date;
}): RunnerCalendarContext {
  const timeZone = canonicalizeRunnerCalendarTimezone(
    input.calendarTimezone ?? DEFAULT_RUNNER_CALENDAR_TIMEZONE,
  );
  const sourceResult = runnerCalendarTimezoneSourceSchema.safeParse(input.calendarTimezoneSource);
  const source = sourceResult.success ? sourceResult.data : "fallback_utc";

  return {
    timeZone,
    source,
    currentDate: dateIsoInRunnerTimezone(timeZone, input.instant),
  };
}
