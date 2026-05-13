import type { z } from "zod";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type ImportedPlanSeed,
  type ImportedWorkoutSeed,
} from "@/lib/imported-plan";
import { buildImportedLogCarryForwardPlan } from "@/lib/persisted-plan-replacement";
import { addDaysIso, diffDaysIso, todayIso, weekdayLong, type WorkoutType } from "@/lib/training";
import type { Database } from "@/lib/supabase/database";

type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];
type ImportedPlanInput = z.infer<typeof importedPlanSchema>;

export type FirstDayResolution = "replace_first_day" | "ignore_first_day";

interface PlanApplyWorkoutSummary {
  date: string;
  title: string;
  workoutType: WorkoutType;
}

interface FirstDayConflictResolutionOption {
  resolution: FirstDayResolution;
  status: "available" | "blocked";
  blockedReason: string | null;
}

export interface PlanApplyFirstDayConflict {
  code: "first_day_conflict";
  effectiveStartDate: string;
  existingTodayWorkout: PlanApplyWorkoutSummary;
  incomingFirstDay: PlanApplyWorkoutSummary & {
    declaredDate: string;
    effectiveDate: string;
  };
  resolutions: FirstDayConflictResolutionOption[];
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

export interface PlanApplyDecisionRequiredResult {
  ok: false;
  status: "decision_required";
  reason: "first_day_conflict";
  effectiveStartDate: string;
  appliedStartDate: null;
  normalizedFromStartDate: string | null;
  conflict: PlanApplyFirstDayConflict;
  importedPlan: ImportedPlanInput;
}

export type PlanApplyResult = PlanApplySuccessResult | PlanApplyDecisionRequiredResult;

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
  currentDate: string = todayIso(),
): PreparedPlanApplySuccess {
  const declaredSeed = buildImportedPlanSeed(importedPlan);
  const effectiveStartDate = deriveEffectiveStartDate(declaredSeed.startDate, currentDate);
  const normalizedFromStartDate =
    effectiveStartDate !== declaredSeed.startDate ? declaredSeed.startDate : null;
  const normalizedSeed = shiftImportedSeedToStartDate(declaredSeed, effectiveStartDate);
  const hasFirstDayConflict = hasTodayWorkoutConflict(
    existingWorkouts,
    normalizedSeed,
    currentDate,
  );
  assertReplaceFirstDayAllowed(
    existingWorkouts,
    normalizedSeed,
    hasFirstDayConflict,
    firstDayResolution,
  );

  const resolvedSeed = resolveImportedSeedForApply(
    existingWorkouts,
    normalizedSeed,
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

export function deriveEffectiveStartDate(startDate: string, currentDate: string) {
  return startDate > currentDate ? startDate : currentDate;
}

function shiftImportedSeedToStartDate(
  importedSeed: ReturnType<typeof buildImportedPlanSeed>,
  startDate: string,
): ReturnType<typeof buildImportedPlanSeed> {
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

  return preserveExistingTodayAndIgnoreIncomingFirstDay(existingWorkouts, normalizedSeed);
}

function preserveExistingTodayAndIgnoreIncomingFirstDay(
  existingWorkouts: ExistingPlanWorkoutsContext,
  importedSeed: ImportedPlanSeed,
) {
  const droppedSeed = dropFirstDayFromImportedSeed(importedSeed);
  const preservedTodayWorkout = existingWorkouts.workouts.find(
    (workout) => workout.workout_date === importedSeed.startDate,
  );

  if (!preservedTodayWorkout) {
    throw new Error("The current plan does not have today’s workout available to preserve.");
  }

  const workouts = [
    persistedWorkoutRowToImportedSeed(preservedTodayWorkout, 0),
    ...droppedSeed.workouts.map((workout, index) => ({
      ...workout,
      displayOrder: index + 1,
    })),
  ];

  return {
    ...droppedSeed,
    startDate: preservedTodayWorkout.workout_date,
    endDate: workouts.at(-1)?.workoutDate ?? preservedTodayWorkout.workout_date,
    workouts,
  };
}

function persistedWorkoutRowToImportedSeed(
  workout: PersistedPlannedWorkoutRow,
  displayOrder: number,
): ImportedWorkoutSeed {
  return {
    workoutDate: workout.workout_date,
    weekday: workout.weekday,
    weekNumber: workout.week_number,
    phase: workout.phase,
    workoutType: workout.workout_type,
    sourceWorkoutId: workout.source_workout_id ?? `preserved-${workout.id}`,
    sourceWorkoutType: workout.source_workout_type ?? workout.workout_type,
    title: workout.title,
    notes: workout.notes ?? null,
    plannedRpe: workout.planned_rpe ?? null,
    estimatedFatigue: workout.estimated_fatigue ?? null,
    recoveryPriority: workout.recovery_priority ?? null,
    steps: ((workout.steps as ImportedWorkoutSeed["steps"] | null) ?? []).map((step) => ({
      ...step,
    })),
    displayOrder,
  };
}

function hasTodayWorkoutConflict(
  existingWorkouts: ExistingPlanWorkoutsContext,
  normalizedSeed: ReturnType<typeof buildImportedPlanSeed>,
  today: string,
) {
  const existingTodayWorkout = existingWorkouts.workouts.find(
    (workout) => workout.workout_date === today && workout.workout_type !== "rest",
  );
  const incomingFirstDay = normalizedSeed.workouts[0] ?? null;

  if (!existingTodayWorkout || !incomingFirstDay || incomingFirstDay.workoutDate !== today) {
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
        "Replacing today with the new first workout would detach saved workout history.",
    );
  }
}
