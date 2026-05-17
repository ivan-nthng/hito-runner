import type { ImportedPlanSeed, ImportedWorkoutSeed } from "@/lib/imported-plan";
import { addDaysIso, diffDaysIso, weekdayLong } from "@/lib/training";
import type { Json } from "@/lib/supabase/database";

export const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type WeekdayName = (typeof WEEKDAY_NAMES)[number];

export type WeekdayRestInvariantSource =
  | "runner_profile"
  | "active_plan"
  | "imported_plan"
  | "none";

export interface WeekdayRestInvariant {
  blockedWeekdays: WeekdayName[];
  source: WeekdayRestInvariantSource;
}

interface ResolveWeekdayRestInvariantInput {
  runnerPreferences?: unknown;
  activePlanPreferences?: unknown;
  importedPlanPreferences?: unknown;
  importedTrainingConstraints?: unknown;
}

const EXPLICIT_BLOCKED_KEYS = [
  "blocked_days",
  "unavailable_days",
  "full_rest_days",
  "fixed_rest_days",
  "weekday_off_days",
  "off_days",
] as const;

const PREFERRED_TRAINING_DAY_KEYS = [
  "preferred_run_days",
  "preferred_running_days",
  "running_days",
] as const;

export const EMPTY_WEEKDAY_REST_INVARIANT: WeekdayRestInvariant = {
  blockedWeekdays: [],
  source: "none",
};

export function resolveWeekdayRestInvariant({
  runnerPreferences,
  activePlanPreferences,
  importedPlanPreferences,
  importedTrainingConstraints,
}: ResolveWeekdayRestInvariantInput): WeekdayRestInvariant {
  const runnerBlocked = extractBlockedWeekdaysFromObject(runnerPreferences);
  if (runnerBlocked.length) {
    return { blockedWeekdays: runnerBlocked, source: "runner_profile" };
  }

  const activePlanBlocked = extractBlockedWeekdaysFromObject(activePlanPreferences);
  if (activePlanBlocked.length) {
    return { blockedWeekdays: activePlanBlocked, source: "active_plan" };
  }

  const importedBlocked = uniqueWeekdays([
    ...extractBlockedWeekdaysFromObject(importedPlanPreferences),
    ...extractBlockedWeekdaysFromObject(importedTrainingConstraints),
  ]);
  if (importedBlocked.length) {
    return { blockedWeekdays: importedBlocked, source: "imported_plan" };
  }

  return EMPTY_WEEKDAY_REST_INVARIANT;
}

export function assertStartDateAllowedByWeekdayRestInvariant(
  startDate: string,
  invariant: WeekdayRestInvariant,
) {
  if (!invariant.blockedWeekdays.length) {
    return;
  }

  const weekday = weekdayLong(startDate) as WeekdayName;

  if (!invariant.blockedWeekdays.includes(weekday)) {
    return;
  }

  throw new Error(
    `Choose a start date that is not on a fixed rest day. ${weekday} is currently blocked.`,
  );
}

export function mapImportedSeedAcrossAllowedWeekdays(
  importedSeed: ImportedPlanSeed,
  startDate: string,
  invariant: WeekdayRestInvariant,
): ImportedPlanSeed {
  if (!invariant.blockedWeekdays.length) {
    return shiftImportedSeedToStartDate(importedSeed, startDate);
  }

  assertStartDateAllowedByWeekdayRestInvariant(startDate, invariant);

  const nonRestWorkouts = importedSeed.workouts.filter((workout) => workout.workoutType !== "rest");

  if (!nonRestWorkouts.length) {
    return shiftImportedSeedToStartDate(importedSeed, startDate);
  }

  const workouts: ImportedWorkoutSeed[] = [];
  let workoutIndex = 0;
  let cursorDate = startDate;
  const sourceTargetOffset = importedSeed.targetDate
    ? diffDaysIso(importedSeed.targetDate, importedSeed.startDate)
    : null;

  while (workoutIndex < nonRestWorkouts.length) {
    const cursorWeekday = weekdayLong(cursorDate) as WeekdayName;

    if (invariant.blockedWeekdays.includes(cursorWeekday)) {
      workouts.push(buildInsertedRestWorkout(importedSeed, startDate, cursorDate, workouts.length));
      cursorDate = addDaysIso(cursorDate, 1);
      continue;
    }

    const sourceWorkout = nonRestWorkouts[workoutIndex]!;
    workouts.push({
      ...sourceWorkout,
      workoutDate: cursorDate,
      weekday: cursorWeekday,
      weekNumber: weekNumberForDate(startDate, cursorDate),
      displayOrder: workouts.length,
    });
    workoutIndex += 1;
    cursorDate = addDaysIso(cursorDate, 1);
  }

  return {
    ...importedSeed,
    startDate,
    endDate: workouts.at(-1)?.workoutDate ?? startDate,
    targetDate: sourceTargetOffset == null ? null : addDaysIso(startDate, sourceTargetOffset),
    workouts,
  };
}

export function validateWorkoutsAgainstWeekdayRestInvariant(
  workouts: ImportedWorkoutSeed[],
  invariant: WeekdayRestInvariant,
) {
  if (!invariant.blockedWeekdays.length) {
    return;
  }

  const violatingWorkout = workouts.find((workout) => {
    if (workout.workoutType === "rest") {
      return false;
    }

    return invariant.blockedWeekdays.includes(weekdayLong(workout.workoutDate) as WeekdayName);
  });

  if (!violatingWorkout) {
    return;
  }

  throw new Error(
    `Fixed rest-day constraints would be violated: ${violatingWorkout.title} is scheduled on ${weekdayLong(
      violatingWorkout.workoutDate,
    )}, which is blocked.`,
  );
}

export function mergeWeekdayRestInvariantIntoPlanPreferences(
  planPreferences: Json | null,
  invariant: WeekdayRestInvariant,
): Json | null {
  if (!invariant.blockedWeekdays.length) {
    return planPreferences;
  }

  const base = asRecord(planPreferences) ?? {};

  return {
    ...base,
    blocked_days: invariant.blockedWeekdays,
    weekday_rest_invariant_source: invariant.source,
  } as Json;
}

export function weekdayRestInvariantToSignature(invariant: WeekdayRestInvariant) {
  return `${invariant.source}:${invariant.blockedWeekdays.join(",")}`;
}

export function describeWeekdayRestInvariant(invariant: WeekdayRestInvariant) {
  if (!invariant.blockedWeekdays.length) {
    return "No fixed weekday rest-day constraint is currently resolved.";
  }

  return `Fixed rest days: ${formatWeekdayList(invariant.blockedWeekdays)}.`;
}

export function formatWeekdayList(weekdays: WeekdayName[]) {
  return weekdays.join(", ");
}

function shiftImportedSeedToStartDate(importedSeed: ImportedPlanSeed, startDate: string) {
  const dayOffset = diffDaysIso(startDate, importedSeed.startDate);

  if (dayOffset === 0) {
    return importedSeed;
  }

  const workouts = importedSeed.workouts.map((workout) => {
    const workoutDate = addDaysIso(workout.workoutDate, dayOffset);

    return {
      ...workout,
      workoutDate,
      weekday: weekdayLong(workoutDate),
    };
  });

  return {
    ...importedSeed,
    startDate,
    endDate: workouts.at(-1)?.workoutDate ?? startDate,
    targetDate: importedSeed.targetDate ? addDaysIso(importedSeed.targetDate, dayOffset) : null,
    workouts,
  };
}

function buildInsertedRestWorkout(
  importedSeed: ImportedPlanSeed,
  startDate: string,
  workoutDate: string,
  displayOrder: number,
): ImportedWorkoutSeed {
  const weekday = weekdayLong(workoutDate);
  const sourceWorkout = importedSeed.workouts[displayOrder] ?? importedSeed.workouts[0];

  return {
    workoutDate,
    weekday,
    weekNumber: weekNumberForDate(startDate, workoutDate),
    phase: sourceWorkout?.phase ?? "Base",
    workoutType: "rest",
    sourceWorkoutId: `fixed-rest-${workoutDate}`,
    sourceWorkoutType: "rest",
    title: "Rest day",
    notes: "Fixed weekday rest day.",
    plannedRpe: null,
    estimatedFatigue: null,
    recoveryPriority: "high",
    steps: [
      {
        type: "rest",
        segment_id: `fixed-rest-${workoutDate}-seg-1`,
        segment_type: "rest",
        label: "Rest",
        sequence: 1,
        guidance: "No running scheduled because this weekday is reserved as rest.",
      },
    ],
    displayOrder,
  };
}

function weekNumberForDate(startDate: string, workoutDate: string) {
  return Math.floor(diffDaysIso(workoutDate, startDate) / 7) + 1;
}

function extractBlockedWeekdaysFromObject(value: unknown) {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  const explicitBlocked = uniqueWeekdays(
    EXPLICIT_BLOCKED_KEYS.flatMap((key) => readWeekdayArray(record[key])),
  );

  if (explicitBlocked.length) {
    return explicitBlocked;
  }

  const preferredTrainingDays = uniqueWeekdays(
    PREFERRED_TRAINING_DAY_KEYS.flatMap((key) => readWeekdayArray(record[key])),
  );

  if (!preferredTrainingDays.length || preferredTrainingDays.length >= WEEKDAY_NAMES.length) {
    return [];
  }

  return WEEKDAY_NAMES.filter((weekday) => !preferredTrainingDays.includes(weekday));
}

function readWeekdayArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeWeekday(entry))
    .filter((weekday): weekday is WeekdayName => Boolean(weekday));
}

function normalizeWeekday(value: unknown): WeekdayName | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");

  return (
    WEEKDAY_NAMES.find((weekday) => weekday.toLowerCase() === normalized) ??
    WEEKDAY_NAMES.find((weekday) => weekday.slice(0, 3).toLowerCase() === normalized.slice(0, 3)) ??
    null
  );
}

function uniqueWeekdays(values: WeekdayName[]) {
  return WEEKDAY_NAMES.filter((weekday) => values.includes(weekday));
}

function asRecord(value: unknown): Record<string, Json | unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | unknown>;
}
