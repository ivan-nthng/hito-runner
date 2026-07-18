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
import { todayIso, weekdayLong } from "@/lib/training";
import type { Database } from "@/lib/supabase/database";
import {
  assertStartDateAllowedByWeekdayRestInvariant,
  mapImportedSeedAcrossAllowedWeekdays,
  mergeWeekdayRestInvariantIntoPlanPreferences,
  resolveWeekdayRestInvariant,
} from "@/lib/weekday-rest-invariants";

type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];
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
