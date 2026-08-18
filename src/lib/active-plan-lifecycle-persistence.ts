import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type CalendarWorkoutMutationEventRow =
  Database["public"]["Tables"]["calendar_workout_mutation_events"]["Row"];
type RpcPayload = { [key: string]: Json | undefined };

type CalendarWorkoutMutationKind = "add" | "clear" | "move";

export class CalendarPersistenceRejection extends Error {
  constructor(
    readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = "CalendarPersistenceRejection";
  }
}

export async function applyAtomicCalendarWorkoutMutation(input: {
  userId: string;
  currentDate: string;
  mutationKind: CalendarWorkoutMutationKind;
  expectedSourceWorkout: Json;
  expectedTargetWorkout: Json;
  workoutInsert: Json;
  workoutUpdate: Json;
  mutationEvent: Json;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_calendar_workout_mutation", {
    p_user_id: input.userId,
    p_current_date: input.currentDate,
    p_mutation_kind: input.mutationKind,
    p_expected_source_workout: input.expectedSourceWorkout,
    p_expected_target_workout: input.expectedTargetWorkout,
    p_workout_insert: input.workoutInsert,
    p_workout_update: input.workoutUpdate,
    p_mutation_event: input.mutationEvent,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Calendar workout mutation");
  const mutatedWorkout = readOptionalObjectField(
    payload,
    "mutated_workout",
  ) as PersistedPlannedWorkoutRow | null;
  const deletedWorkout = readOptionalObjectField(
    payload,
    "deleted_workout",
  ) as PersistedPlannedWorkoutRow | null;
  const restoredWorkout = readOptionalObjectField(
    payload,
    "restored_workout",
  ) as PersistedPlannedWorkoutRow | null;
  const mutationEvent = readObjectField(
    payload,
    "mutation_event",
  ) as CalendarWorkoutMutationEventRow;

  return {
    mutatedWorkout,
    deletedWorkout,
    restoredWorkout,
    mutationEvent,
    undoExpiresAt: readOptionalStringField(payload, "undo_expires_at"),
  };
}

export async function applyAtomicCalendarWorkoutContentEdit(input: {
  userId: string;
  workoutId: string;
  currentDate: string;
  expectedWorkout: Json;
  workoutUpdate: Json;
  mutationEvent: Json;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_calendar_workout_content_edit", {
    p_user_id: input.userId,
    p_workout_id: input.workoutId,
    p_current_date: input.currentDate,
    p_expected_workout: input.expectedWorkout,
    p_workout_update: input.workoutUpdate,
    p_mutation_event: input.mutationEvent,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Calendar workout content edit");

  return {
    editedWorkout: readObjectField(payload, "edited_workout") as PersistedPlannedWorkoutRow,
    mutationEvent: readObjectField(payload, "mutation_event") as CalendarWorkoutMutationEventRow,
  };
}

export async function applyAtomicReviewedPlanPersistence(input: {
  userId: string;
  profile: Json;
  sourcePlanId: string;
  workouts: Json;
  currentDate: string;
  expectedProfileRevision?: number;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_reviewed_plan_persistence", {
    p_user_id: input.userId,
    p_profile: input.profile,
    p_source_plan_id: input.sourcePlanId,
    p_workouts: input.workouts,
    p_current_date: input.currentDate,
    p_expected_profile_revision: input.expectedProfileRevision,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Reviewed plan persistence");
  const planCycle = readObjectField(payload, "plan_cycle") as PersistedPlanCycleRow;
  const workouts = readObjectArrayField(payload, "workouts") as PersistedPlannedWorkoutRow[];

  return {
    planCycle,
    workouts,
  };
}

export async function applyAtomicReviewedFutureSchedulePersistence(input: {
  userId: string;
  sourcePlanId: string;
  workouts: Json;
  currentDate: string;
  replaceFutureWorkouts: boolean;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_reviewed_future_schedule_persistence", {
    p_user_id: input.userId,
    p_source_plan_id: input.sourcePlanId,
    p_workouts: input.workouts,
    p_current_date: input.currentDate,
    p_replace_future_workouts: input.replaceFutureWorkouts,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Reviewed future schedule persistence");
  const planCycle = readObjectField(payload, "plan_cycle") as PersistedPlanCycleRow;
  const workouts = readObjectArrayField(payload, "workouts") as PersistedPlannedWorkoutRow[];

  return {
    planCycle,
    workouts,
  };
}

export async function clearAtomicCalendarFutureWorkouts(input: {
  userId: string;
  currentDate: string;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("clear_calendar_future_workouts", {
    p_user_id: input.userId,
    p_current_date: input.currentDate,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Future Calendar deletion");

  return {
    currentDate: readStringField(payload, "current_date"),
    clearedWorkoutCount: readNonNegativeIntegerField(payload, "cleared_workout_count"),
  };
}

function readRpcPayload(value: Json, operation: string): RpcPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${operation} returned an invalid transaction result.`);
  }

  if (value.ok !== true) {
    throw new CalendarPersistenceRejection(
      typeof value.reason === "string" ? value.reason : "persistence_failed",
      typeof value.message === "string"
        ? value.message
        : `${operation} rejected the prepared mutation.`,
    );
  }

  return value;
}

function readObjectField(value: RpcPayload, key: string) {
  const field = value[key];

  if (!field || typeof field !== "object" || Array.isArray(field)) {
    throw new Error(`Atomic persistence result is missing ${key}.`);
  }

  return field;
}

function readOptionalObjectField(value: RpcPayload, key: string) {
  const field = value[key];

  if (field === null || field === undefined) {
    return null;
  }

  if (typeof field !== "object" || Array.isArray(field)) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
}

function readObjectArrayField(value: RpcPayload, key: string) {
  const field = value[key];

  if (
    !Array.isArray(field) ||
    field.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry))
  ) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
}

function readStringField(value: RpcPayload, key: string) {
  const field = value[key];

  if (typeof field !== "string" || !field) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
}

function readOptionalStringField(value: RpcPayload, key: string) {
  const field = value[key];

  if (field === null || field === undefined) {
    return null;
  }

  if (typeof field !== "string" || !field) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
}

function readNonNegativeIntegerField(value: RpcPayload, key: string) {
  const field = value[key];

  if (typeof field !== "number" || !Number.isSafeInteger(field) || field < 0) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
}
