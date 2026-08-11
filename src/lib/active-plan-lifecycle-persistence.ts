import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
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
  planId: string;
  expectedPlanUpdatedAt: string;
  currentDate: string;
  mutationKind: CalendarWorkoutMutationKind;
  expectedSourceWorkout: Json;
  expectedTargetWorkout: Json;
  workoutInsert: Json;
  workoutUpdate: Json;
  planUpdate: Json;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_calendar_workout_mutation", {
    p_user_id: input.userId,
    p_plan_id: input.planId,
    p_expected_plan_updated_at: input.expectedPlanUpdatedAt,
    p_current_date: input.currentDate,
    p_mutation_kind: input.mutationKind,
    p_expected_source_workout: input.expectedSourceWorkout,
    p_expected_target_workout: input.expectedTargetWorkout,
    p_workout_insert: input.workoutInsert,
    p_workout_update: input.workoutUpdate,
    p_plan_update: input.planUpdate,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Calendar workout mutation");
  const planCycle = readObjectField(payload, "plan_cycle") as PersistedPlanCycleRow;
  const mutatedWorkout = readOptionalObjectField(
    payload,
    "mutated_workout",
  ) as PersistedPlannedWorkoutRow | null;
  const deletedWorkout = readOptionalObjectField(
    payload,
    "deleted_workout",
  ) as PersistedPlannedWorkoutRow | null;

  return {
    planCycle,
    mutatedWorkout,
    deletedWorkout,
  };
}

export async function applyAtomicReviewedPlanPersistence(input: {
  userId: string;
  profile: Json;
  plan: Json;
  workouts: Json;
  expectedProfileRevision?: number;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_reviewed_plan_persistence", {
    p_user_id: input.userId,
    p_profile: input.profile,
    p_plan: input.plan,
    p_workouts: input.workouts,
    p_expected_profile_revision: input.expectedProfileRevision ?? null,
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
  plan: Json;
  workouts: Json;
  currentDate: string;
  replaceFutureWorkouts: boolean;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_reviewed_future_schedule_persistence", {
    p_user_id: input.userId,
    p_plan: input.plan,
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
