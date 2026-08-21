import type { Database, Json } from "@/lib/supabase/database";
import { CalendarPersistenceRejection } from "@/lib/runner-calendar-mutations";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type RpcPayload = { [key: string]: Json | undefined };

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
