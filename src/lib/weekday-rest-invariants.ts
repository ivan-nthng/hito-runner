import type { ImportedPlanSeed, ImportedWorkoutSeed } from "@/lib/imported-plan";
import { resolveCanonicalWorkoutModel, toCanonicalMetricModeJson } from "@/lib/rich-workout-model";
import { addDaysIso, diffDaysIso, startOfWeekIso, weekdayLong } from "@/lib/training";
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
  const runnerBlocked = extractBlockedWeekdaysFromRunnerPreferences(runnerPreferences);
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
  options: {
    preserveSourceWeeklyCounts?: boolean;
    preferredLongRunDay?: WeekdayName | null;
  } = {},
): ImportedPlanSeed {
  if (options.preserveSourceWeeklyCounts) {
    return mapImportedSeedBySourceWeek(
      importedSeed,
      startDate,
      invariant,
      options.preferredLongRunDay ?? null,
    );
  }

  if (!invariant.blockedWeekdays.length) {
    return shiftImportedSeedToStartDate(importedSeed, startDate);
  }

  assertStartDateAllowedByWeekdayRestInvariant(startDate, invariant);

  const nonRestWorkouts = importedSeed.workouts.filter((workout) => workout.workoutType !== "rest");

  if (!nonRestWorkouts.length) {
    return shiftImportedSeedToStartDate(importedSeed, startDate);
  }

  const allowedTrainingWeekdays = resolveAllowedTrainingWeekdays(importedSeed, invariant);
  const startWeekday = weekdayLong(startDate) as WeekdayName;

  if (!allowedTrainingWeekdays.includes(startWeekday)) {
    throw new Error(
      `Choose a start date that is on an allowed training day. ${startWeekday} is not in the resolved training weekdays.`,
    );
  }

  const workouts: ImportedWorkoutSeed[] = [];
  let workoutIndex = 0;
  let cursorDate = startDate;
  const sourceTargetOffset = importedSeed.targetDate
    ? diffDaysIso(importedSeed.targetDate, importedSeed.startDate)
    : null;

  while (workoutIndex < nonRestWorkouts.length) {
    const cursorWeekday = weekdayLong(cursorDate) as WeekdayName;

    if (!allowedTrainingWeekdays.includes(cursorWeekday)) {
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

function mapImportedSeedBySourceWeek(
  importedSeed: ImportedPlanSeed,
  startDate: string,
  invariant: WeekdayRestInvariant,
  preferredLongRunDay: WeekdayName | null,
): ImportedPlanSeed {
  assertStartDateAllowedByWeekdayRestInvariant(startDate, invariant);

  const sourceRowsByWeek = new Map<string, ImportedWorkoutSeed[]>();
  for (const workout of importedSeed.workouts) {
    const weekStart = startOfWeekIso(workout.workoutDate);
    const workouts = sourceRowsByWeek.get(weekStart) ?? [];
    workouts.push(workout);
    sourceRowsByWeek.set(weekStart, workouts);
  }

  if (!sourceRowsByWeek.size) {
    return shiftImportedSeedToStartDate(importedSeed, startDate);
  }

  const workouts: ImportedWorkoutSeed[] = [];
  for (const [weekStart, sourceRows] of sourceRowsByWeek) {
    const sourceWorkouts = sourceRows.filter((workout) => workout.workoutType !== "rest");
    const sourceWeekStartDate = sourceRows[0]?.workoutDate;
    const sourceWeekEndDate = sourceRows.at(-1)?.workoutDate;

    if (!sourceWeekStartDate || !sourceWeekEndDate) {
      continue;
    }

    const requestedWeekBoundary = weekStart === startOfWeekIso(startDate) ? startDate : weekStart;
    const weekBoundary =
      sourceWeekStartDate > requestedWeekBoundary ? sourceWeekStartDate : requestedWeekBoundary;

    const allowedDates = WEEKDAY_NAMES.map((_, index) => addDaysIso(weekStart, index)).filter(
      (date) =>
        date >= weekBoundary &&
        !invariant.blockedWeekdays.includes(weekdayLong(date) as WeekdayName),
    );

    if (sourceWorkouts.length > allowedDates.length) {
      throw new Error(
        `This saved plan has ${sourceWorkouts.length} running workouts in the week of ${weekStart}, but only ${allowedDates.length} compatible weekdays are available.`,
      );
    }

    const assignedDates = assignSourceWeekWorkoutDates(
      sourceWorkouts,
      allowedDates,
      weekStart,
      preferredLongRunDay,
    );
    const assignmentByDate = new Map(
      assignedDates.map((date, index) => [date, sourceWorkouts[index]!] as const),
    );
    const lastAssignedDate = assignedDates.at(-1);

    const materializedWeekEndDate =
      lastAssignedDate && lastAssignedDate > sourceWeekEndDate
        ? lastAssignedDate
        : sourceWeekEndDate;

    for (
      let cursorDate = weekBoundary;
      cursorDate <= materializedWeekEndDate;
      cursorDate = addDaysIso(cursorDate, 1)
    ) {
      const sourceWorkout = assignmentByDate.get(cursorDate);
      if (sourceWorkout) {
        workouts.push({
          ...sourceWorkout,
          workoutDate: cursorDate,
          weekday: weekdayLong(cursorDate),
          displayOrder: workouts.length,
        });
        continue;
      }

      workouts.push(
        buildInsertedRestWorkout(importedSeed, startDate, cursorDate, workouts.length, {
          fixedRestDay: invariant.blockedWeekdays.includes(weekdayLong(cursorDate) as WeekdayName),
        }),
      );
    }
  }

  const firstWorkout = workouts[0];
  if (!firstWorkout) {
    throw new Error("This saved plan has no remaining future workouts to apply.");
  }

  return {
    ...importedSeed,
    startDate: firstWorkout.workoutDate,
    endDate: workouts.at(-1)?.workoutDate ?? firstWorkout.workoutDate,
    workouts,
  };
}

function assignSourceWeekWorkoutDates(
  sourceWorkouts: ImportedWorkoutSeed[],
  allowedDates: string[],
  weekStart: string,
  preferredLongRunDay: WeekdayName | null,
) {
  if (!preferredLongRunDay) {
    return allowedDates.slice(0, sourceWorkouts.length);
  }

  const longRunIndexes = sourceWorkouts.flatMap((workout, index) =>
    workout.workoutType === "long_run" ? [index] : [],
  );
  if (longRunIndexes.length === 0) {
    return allowedDates.slice(0, sourceWorkouts.length);
  }
  if (longRunIndexes.length > 1) {
    throw new Error(
      `This saved plan has more than one long run in the week of ${weekStart}; a single preferred long-run day cannot preserve their order.`,
    );
  }

  const longRunIndex = longRunIndexes[0]!;
  const preferredDate = addDaysIso(weekStart, WEEKDAY_NAMES.indexOf(preferredLongRunDay));
  const earlierDates = allowedDates.filter((date) => date < preferredDate);
  const laterDates = allowedDates.filter((date) => date > preferredDate);
  const laterWorkoutCount = sourceWorkouts.length - longRunIndex - 1;

  if (
    !allowedDates.includes(preferredDate) ||
    earlierDates.length < longRunIndex ||
    laterDates.length < laterWorkoutCount
  ) {
    throw new Error(
      `This saved plan cannot preserve workout order and place its long run on ${preferredLongRunDay} in the week of ${weekStart}.`,
    );
  }

  return [
    ...earlierDates.slice(0, longRunIndex),
    preferredDate,
    ...laterDates.slice(0, laterWorkoutCount),
  ];
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

function resolveAllowedTrainingWeekdays(
  importedSeed: ImportedPlanSeed,
  invariant: WeekdayRestInvariant,
) {
  const preferredTrainingDays = uniqueWeekdays(
    PREFERRED_TRAINING_DAY_KEYS.flatMap((key) =>
      readWeekdayArray(asRecord(importedSeed.planPreferences)?.[key]),
    ),
  ).filter((weekday) => !invariant.blockedWeekdays.includes(weekday));

  if (preferredTrainingDays.length) {
    return preferredTrainingDays;
  }

  return WEEKDAY_NAMES.filter((weekday) => !invariant.blockedWeekdays.includes(weekday));
}

function buildInsertedRestWorkout(
  importedSeed: ImportedPlanSeed,
  startDate: string,
  workoutDate: string,
  displayOrder: number,
  options: { fixedRestDay?: boolean } = {},
): ImportedWorkoutSeed {
  const weekday = weekdayLong(workoutDate);
  const sourceWorkout = importedSeed.workouts[displayOrder] ?? importedSeed.workouts[0];
  const richWorkout = resolveCanonicalWorkoutModel({
    workoutType: "rest",
    sourceWorkoutType: "rest_and_recovery",
    title: "Rest day",
    steps: [],
  });

  return {
    workoutDate,
    weekday,
    weekNumber: weekNumberForDate(startDate, workoutDate),
    phase: sourceWorkout?.phase ?? "Base",
    workoutType: "rest",
    sourceWorkoutId: `fixed-rest-${workoutDate}`,
    sourceWorkoutType: "rest",
    workoutFamily: richWorkout.workoutFamily,
    workoutIdentity: richWorkout.workoutIdentity,
    calendarIconKey: richWorkout.calendarIconKey,
    goalContext: sourceWorkout?.goalContext ?? null,
    metricMode: toCanonicalMetricModeJson(richWorkout.metricMode),
    title: "Rest day",
    notes: options.fixedRestDay ? "Fixed weekday rest day." : "Schedule-aligned rest day.",
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
        guidance: options.fixedRestDay
          ? "No running scheduled because this weekday is reserved as rest."
          : "No running is scheduled on this materialized plan day.",
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

  return uniqueWeekdays(EXPLICIT_BLOCKED_KEYS.flatMap((key) => readWeekdayArray(record[key])));
}

function extractBlockedWeekdaysFromRunnerPreferences(value: unknown) {
  const directBlocked = extractBlockedWeekdaysFromObject(value);
  if (directBlocked.length) {
    return directBlocked;
  }

  return extractBlockedWeekdaysFromObject(asRecord(value)?.training_preferences);
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

export function uniqueWeekdays(values: readonly WeekdayName[]) {
  return WEEKDAY_NAMES.filter((weekday) => values.includes(weekday));
}

function asRecord(value: unknown): Record<string, Json | unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | unknown>;
}
