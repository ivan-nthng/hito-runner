import type { z } from "zod";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type ImportedPlanSeed,
} from "@/lib/imported-plan";
import {
  buildImportedLogCarryForwardPlan,
  persistedWorkoutRowToImportedSeed as persistedWorkoutRowToImportedSeedBase,
} from "@/lib/persisted-plan-replacement";
import type {
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "@/lib/runner-calendar-persistence";
import { isRealIsoDate } from "@/lib/first-plan-authoring-utils";
import { addDaysIso, diffDaysIso, startOfWeekIso, todayIso, weekdayLong } from "@/lib/training";
import type { Json } from "@/lib/supabase/database";
import {
  assertStartDateAllowedByWeekdayRestInvariant,
  mapImportedSeedAcrossAllowedWeekdays,
  mergeWeekdayRestInvariantIntoPlanPreferences,
  resolveWeekdayRestInvariant,
  type WeekdayName,
  type WeekdayRestInvariant,
} from "@/lib/weekday-rest-invariants";
import {
  normalizeRunnerTrainingPreferencesForSave,
  parseStoredRunnerTrainingPreferences,
  type RunnerTrainingPreferencesStorage,
} from "@/lib/runner-training-preferences";

type ImportedPlanInput = z.infer<typeof importedPlanSchema>;

export type FirstDayResolution = "replace_first_day" | "ignore_first_day";

interface FirstDayConflictResolutionOption {
  resolution: FirstDayResolution;
  status: "available" | "blocked";
  blockedReason: string | null;
}

export interface PlanApplySuccessResult {
  ok: true;
  status: "applied";
  effectiveStartDate: string;
  appliedStartDate: string;
  normalizedFromStartDate: string | null;
  firstDayResolution: FirstDayResolution | null;
  workoutCount: number;
}

export interface ExistingPlanWorkoutsContext {
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
}

export interface PreparedPlanApplySuccess {
  result: PlanApplySuccessResult;
  importedSeed: ReturnType<typeof buildImportedPlanSeed>;
  preservationPlan: {
    ok: true;
    logs: Array<{ log: PersistedWorkoutLogRow; workoutDate: string }>;
  };
}

export interface PreparedSavedPlanFutureApply {
  importedSeed: ImportedPlanSeed;
  currentDate: string;
  resolvedStartDate: string;
  appliedStartDate: string;
  omittedLeadingDayCount: number;
  workoutCount: number;
}

export interface SavedPlanStartScheduleOptions {
  requestedStartDate?: string | null;
  fixedRestDays?: WeekdayName[];
  preferredLongRunDay?: WeekdayName | null;
}

export function prepareSavedPlanFutureApplyPolicy(
  importedPlan: ImportedPlanInput,
  currentDate: string,
  runnerPreferences: unknown,
  options: SavedPlanStartScheduleOptions = {},
): PreparedSavedPlanFutureApply {
  if (!isRealIsoDate(currentDate)) {
    throw new Error("The runner calendar date must be a real YYYY-MM-DD date.");
  }

  const declaredSeed = buildImportedPlanSeed(importedPlan);
  const schedule = resolveSavedPlanSchedulePreferences(importedPlan, runnerPreferences, options);
  validateSavedPlanWeeklyCapacity(declaredSeed, schedule.preferences);
  const aligned = resolveSavedPlanAlignedProjection(
    declaredSeed,
    currentDate,
    options.requestedStartDate ?? null,
    schedule.invariant,
    schedule.preferences.preferred_long_run_day,
  );

  const importedSeed: ImportedPlanSeed = {
    ...aligned.importedSeed,
    planPreferences: buildSavedPlanMaterializationPreferences(
      aligned.importedSeed.planPreferences,
      schedule.preferences,
      schedule.invariant,
    ),
  };

  return {
    importedSeed,
    currentDate,
    resolvedStartDate: aligned.resolvedStartDate,
    appliedStartDate: importedSeed.startDate,
    omittedLeadingDayCount: aligned.omittedLeadingDayCount,
    workoutCount: importedSeed.workouts.filter((workout) => workout.workoutType !== "rest").length,
  };
}

export function prepareImportedPlanApplyPolicy(
  importedPlan: ImportedPlanInput,
  existingWorkouts: ExistingPlanWorkoutsContext,
  firstDayResolution: FirstDayResolution | null,
  requestedStartDate: string | null = null,
  currentDate: string = todayIso(),
  activePlanPreferences: unknown = null,
): PreparedPlanApplySuccess {
  const declaredSeed = buildImportedPlanSeed(importedPlan);
  const effectiveStartDate = deriveEffectiveStartDate(
    declaredSeed.startDate,
    currentDate,
    requestedStartDate,
  );
  const normalizedFromStartDate =
    effectiveStartDate !== declaredSeed.startDate ? declaredSeed.startDate : null;
  const weekdayRestInvariant = resolveWeekdayRestInvariant({
    activePlanPreferences,
    importedPlanPreferences: importedPlan.plan_preferences,
    importedTrainingConstraints: importedPlan.training_constraints,
  });
  assertStartDateAllowedByWeekdayRestInvariant(effectiveStartDate, weekdayRestInvariant);
  const normalizedSeed = mapImportedSeedAcrossAllowedWeekdays(
    declaredSeed,
    effectiveStartDate,
    weekdayRestInvariant,
  );
  const invariantAwareSeed = {
    ...normalizedSeed,
    planPreferences: mergeWeekdayRestInvariantIntoPlanPreferences(
      normalizedSeed.planPreferences,
      weekdayRestInvariant,
    ),
  };
  const hasFirstDayConflict = hasStartDateWorkoutConflict(
    existingWorkouts,
    invariantAwareSeed,
    effectiveStartDate,
  );
  assertReplaceFirstDayAllowed(
    existingWorkouts,
    invariantAwareSeed,
    hasFirstDayConflict,
    firstDayResolution,
  );

  const resolvedSeed = resolveImportedSeedForApply(
    existingWorkouts,
    invariantAwareSeed,
    hasFirstDayConflict,
    firstDayResolution,
  );
  const preservationPlan = buildImportedLogCarryForwardPlan(
    existingWorkouts.workouts,
    existingWorkouts.logsByWorkoutId,
    resolvedSeed.workouts,
  );

  if (!preservationPlan.ok) {
    throw new Error(preservationPlan.message);
  }

  return {
    result: {
      ok: true,
      status: "applied",
      effectiveStartDate,
      appliedStartDate: resolvedSeed.startDate,
      normalizedFromStartDate,
      firstDayResolution:
        hasFirstDayConflict && firstDayResolution === "replace_first_day"
          ? "replace_first_day"
          : null,
      workoutCount: resolvedSeed.workouts.filter((workout) => workout.workoutType !== "rest")
        .length,
    },
    importedSeed: resolvedSeed,
    preservationPlan,
  };
}

export function deriveEffectiveStartDate(
  startDate: string,
  currentDate: string,
  requestedStartDate: string | null = null,
) {
  if (requestedStartDate) {
    if (requestedStartDate < currentDate) {
      throw new Error("Choose today or a future date before applying this plan.");
    }

    return requestedStartDate;
  }

  return startDate > currentDate ? startDate : currentDate;
}

function resolveSavedPlanAlignedProjection(
  importedSeed: ImportedPlanSeed,
  currentDate: string,
  requestedStartDate: string | null,
  invariant: WeekdayRestInvariant,
  preferredLongRunDay: WeekdayName | null,
) {
  if (requestedStartDate && !isRealIsoDate(requestedStartDate)) {
    throw new Error("The requested Start date must be a real YYYY-MM-DD date.");
  }
  if (requestedStartDate && requestedStartDate < currentDate) {
    throw new Error("Choose the runner's current date or a future date before starting this plan.");
  }

  const candidates = requestedStartDate
    ? [requestedStartDate]
    : Array.from({ length: 7 }, (_, offset) => addDaysIso(currentDate, offset));
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      assertStartDateAllowedByWeekdayRestInvariant(candidate, invariant);
      const aligned = alignSavedPlanSeedToStartWindow(importedSeed, candidate);
      return {
        importedSeed: mapImportedSeedAcrossAllowedWeekdays(
          aligned.importedSeed,
          candidate,
          invariant,
          {
            preserveSourceWeeklyCounts: true,
            preferredLongRunDay,
          },
        ),
        resolvedStartDate: candidate,
        omittedLeadingDayCount: aligned.omittedLeadingDayCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Saved-plan alignment failed.");
    }
  }

  throw new Error(
    requestedStartDate
      ? (lastError?.message ?? "The requested Start date is not compatible with this plan.")
      : `No compatible runner-local Start date is available in the next seven days. ${
          lastError?.message ?? ""
        }`.trim(),
  );
}

function alignSavedPlanSeedToStartWindow(importedSeed: ImportedPlanSeed, startDate: string) {
  const sourceWeekStart = startOfWeekIso(importedSeed.startDate);
  const runnerWeekStart = startOfWeekIso(startDate);
  const calendarOffset = diffDaysIso(runnerWeekStart, sourceWeekStart);
  const shiftedWorkouts = importedSeed.workouts.map((workout) => {
    const workoutDate = addDaysIso(workout.workoutDate, calendarOffset);

    return {
      ...workout,
      workoutDate,
      weekday: weekdayLong(workoutDate),
    };
  });
  const retainedWorkouts = shiftedWorkouts
    .filter((workout) => workout.workoutDate >= startDate)
    .map((workout, displayOrder) => ({ ...workout, displayOrder }));
  const firstWorkout = retainedWorkouts[0];

  if (!firstWorkout) {
    throw new Error("This saved plan has no remaining future days to apply.");
  }

  return {
    importedSeed: {
      ...importedSeed,
      startDate,
      endDate: retainedWorkouts.at(-1)?.workoutDate ?? firstWorkout.workoutDate,
      targetDate: importedSeed.targetDate
        ? addDaysIso(importedSeed.targetDate, calendarOffset)
        : null,
      workouts: retainedWorkouts,
    },
    omittedLeadingDayCount: shiftedWorkouts.length - retainedWorkouts.length,
  };
}

function validateSavedPlanWeeklyCapacity(
  importedSeed: ImportedPlanSeed,
  preferences: RunnerTrainingPreferencesStorage,
) {
  const maximum = preferences.max_running_days_per_week;

  if (maximum == null) {
    return;
  }

  const countByWeek = new Map<string, number>();
  for (const workout of importedSeed.workouts) {
    if (workout.workoutType === "rest") {
      continue;
    }

    const week = startOfWeekIso(workout.workoutDate);
    const count = (countByWeek.get(week) ?? 0) + 1;
    if (count > maximum) {
      throw new Error(
        `This saved plan schedules more than ${maximum} running days in the week of ${week}.`,
      );
    }
    countByWeek.set(week, count);
  }
}

function resolveSavedPlanSchedulePreferences(
  importedPlan: ImportedPlanInput,
  runnerPreferences: unknown,
  options: SavedPlanStartScheduleOptions,
) {
  if (
    options.fixedRestDays &&
    new Set(options.fixedRestDays).size !== options.fixedRestDays.length
  ) {
    throw new Error("One-time fixed rest days must not contain duplicates.");
  }

  const persisted = parseStoredRunnerTrainingPreferences(runnerPreferences);
  const imported = parseStoredRunnerTrainingPreferences(importedPlan.plan_preferences);
  const fallback = persisted ??
    imported ?? {
      blocked_days: [],
      preferred_long_run_day: null,
      max_running_days_per_week: null,
    };
  const preferences = normalizeRunnerTrainingPreferencesForSave({
    blocked_days: options.fixedRestDays ?? fallback.blocked_days,
    preferred_long_run_day:
      options.preferredLongRunDay === undefined
        ? fallback.preferred_long_run_day
        : options.preferredLongRunDay,
    max_running_days_per_week: persisted
      ? persisted.max_running_days_per_week
      : (imported?.max_running_days_per_week ?? null),
  });
  const source =
    persisted || options.fixedRestDays !== undefined || options.preferredLongRunDay !== undefined
      ? "runner_profile"
      : imported
        ? "imported_plan"
        : "none";

  return {
    preferences,
    invariant: {
      blockedWeekdays: preferences.blocked_days,
      source,
    } satisfies WeekdayRestInvariant,
  };
}

function buildSavedPlanMaterializationPreferences(
  value: Json | null,
  preferences: RunnerTrainingPreferencesStorage,
  invariant: WeekdayRestInvariant,
): Json {
  const base =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, Json>)
      : {};
  const includesBlockedDays =
    Object.hasOwn(base, "blocked_days") || preferences.blocked_days.length > 0;
  const includesPreferredLongRunDay =
    Object.hasOwn(base, "preferred_long_run_day") || preferences.preferred_long_run_day !== null;
  const includesMaximum =
    Object.hasOwn(base, "max_running_days_per_week") ||
    preferences.max_running_days_per_week !== null;
  const includesScheduleTruth =
    includesBlockedDays || includesPreferredLongRunDay || includesMaximum;

  return {
    ...base,
    ...(includesBlockedDays ? { blocked_days: preferences.blocked_days } : {}),
    ...(includesPreferredLongRunDay
      ? { preferred_long_run_day: preferences.preferred_long_run_day }
      : {}),
    ...(includesMaximum
      ? { max_running_days_per_week: preferences.max_running_days_per_week }
      : {}),
    ...(includesScheduleTruth ? { weekday_rest_invariant_source: invariant.source } : {}),
  };
}

function dropFirstDayFromImportedSeed(importedSeed: ReturnType<typeof buildImportedPlanSeed>) {
  const firstWorkoutDate = importedSeed.workouts[0]?.workoutDate;

  if (!firstWorkoutDate) {
    throw new Error("This plan does not have a first scheduled day to ignore.");
  }

  const workouts = importedSeed.workouts
    .filter((workout) => workout.workoutDate !== firstWorkoutDate)
    .map((workout, index) => ({
      ...workout,
      displayOrder: index,
    }));

  if (workouts.length === 0) {
    throw new Error("Ignoring the first day would leave the applied plan empty.");
  }

  return {
    ...importedSeed,
    startDate: workouts[0]!.workoutDate,
    endDate: workouts.at(-1)?.workoutDate ?? workouts[0]!.workoutDate,
    workouts,
  };
}

function resolveImportedSeedForApply(
  existingWorkouts: ExistingPlanWorkoutsContext,
  normalizedSeed: ImportedPlanSeed,
  hasFirstDayConflict: boolean,
  firstDayResolution: FirstDayResolution | null,
) {
  if (!hasFirstDayConflict) {
    return normalizedSeed;
  }

  if (firstDayResolution === "replace_first_day") {
    return normalizedSeed;
  }

  return preserveExistingStartDateAndIgnoreIncomingFirstDay(existingWorkouts, normalizedSeed);
}

function preserveExistingStartDateAndIgnoreIncomingFirstDay(
  existingWorkouts: ExistingPlanWorkoutsContext,
  importedSeed: ImportedPlanSeed,
) {
  const droppedSeed = dropFirstDayFromImportedSeed(importedSeed);
  const preservedStartDateWorkout = existingWorkouts.workouts.find(
    (workout) => workout.workout_date === importedSeed.startDate,
  );

  if (!preservedStartDateWorkout) {
    throw new Error(
      "The current plan does not have a workout on the chosen start date to preserve.",
    );
  }

  const workouts = [
    persistedWorkoutRowToPreservedImportedSeed(preservedStartDateWorkout, 0),
    ...droppedSeed.workouts.map((workout, index) => ({
      ...workout,
      displayOrder: index + 1,
    })),
  ];

  return {
    ...droppedSeed,
    startDate: preservedStartDateWorkout.workout_date,
    endDate: workouts.at(-1)?.workoutDate ?? preservedStartDateWorkout.workout_date,
    workouts,
  };
}

function persistedWorkoutRowToPreservedImportedSeed(
  workout: PersistedPlannedWorkoutRow,
  displayOrder: number,
) {
  return persistedWorkoutRowToImportedSeedBase(workout, {
    displayOrder,
    fallbackSourceWorkoutIdPrefix: "preserved",
    normalizeSteps: false,
  });
}

function hasStartDateWorkoutConflict(
  existingWorkouts: ExistingPlanWorkoutsContext,
  normalizedSeed: ReturnType<typeof buildImportedPlanSeed>,
  startDate: string,
) {
  const existingStartDateWorkout = existingWorkouts.workouts.find(
    (workout) => workout.workout_date === startDate && workout.workout_type !== "rest",
  );
  const incomingFirstDay = normalizedSeed.workouts[0] ?? null;

  if (
    !existingStartDateWorkout ||
    !incomingFirstDay ||
    incomingFirstDay.workoutDate !== startDate
  ) {
    return false;
  }

  if (incomingFirstDay.workoutType === "rest") {
    return false;
  }

  return true;
}

function buildFirstDayConflictResolutionOption(
  existingWorkouts: ExistingPlanWorkoutsContext,
  normalizedSeed: ReturnType<typeof buildImportedPlanSeed>,
  resolution: FirstDayResolution,
): FirstDayConflictResolutionOption {
  try {
    const candidateSeed = resolveImportedSeedForApply(
      existingWorkouts,
      normalizedSeed,
      true,
      resolution,
    );
    const preservationPlan = buildImportedLogCarryForwardPlan(
      existingWorkouts.workouts,
      existingWorkouts.logsByWorkoutId,
      candidateSeed.workouts,
    );

    if (!preservationPlan.ok) {
      return {
        resolution,
        status: "blocked",
        blockedReason: preservationPlan.message,
      };
    }

    return {
      resolution,
      status: "available",
      blockedReason: null,
    };
  } catch (error) {
    return {
      resolution,
      status: "blocked",
      blockedReason: error instanceof Error ? error.message : "This resolution is unavailable.",
    };
  }
}

function assertReplaceFirstDayAllowed(
  existingWorkouts: ExistingPlanWorkoutsContext,
  normalizedSeed: ImportedPlanSeed,
  hasFirstDayConflict: boolean,
  firstDayResolution: FirstDayResolution | null,
) {
  if (!hasFirstDayConflict || firstDayResolution !== "replace_first_day") {
    return;
  }

  const replaceOption = buildFirstDayConflictResolutionOption(
    existingWorkouts,
    normalizedSeed,
    "replace_first_day",
  );

  if (replaceOption.status === "blocked") {
    throw new Error(
      replaceOption.blockedReason ??
        "Replacing the chosen start date with the new first workout would detach saved workout history.",
    );
  }
}
