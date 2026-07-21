import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type RpcPayload = { [key: string]: Json | undefined };

export type ActivePlanWorkoutMutationKind = "add" | "clear" | "move";

export class ActivePlanPersistenceRejection extends Error {
  constructor(
    readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = "ActivePlanPersistenceRejection";
  }
}

export async function applyAtomicActivePlanWorkoutMutation(input: {
  userId: string;
  planId: string;
  expectedPlanUpdatedAt: string;
  currentDate: string;
  mutationKind: ActivePlanWorkoutMutationKind;
  expectedSourceWorkout: Json;
  expectedTargetWorkout: Json;
  workoutInsert: Json;
  workoutUpdate: Json;
  planUpdate: Json;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_active_plan_workout_mutation", {
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

  const payload = readRpcPayload(result.data, "Active-plan workout mutation");
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
  expectedActivePlanId: string | null;
  expectedActivePlanUpdatedAt: string | null;
  expectedHistory: Json;
  archiveGoalMetadata: Json;
  logs: Json;
  evidenceRelinks: Json;
  expectedProfileRevision?: number;
}) {
  const supabase = createAdminSupabaseClient();
  const rpcPayload = {
    p_user_id: input.userId,
    p_profile: input.profile,
    p_plan: input.plan,
    p_workouts: input.workouts,
    p_expected_active_plan_id: input.expectedActivePlanId,
    p_expected_active_plan_updated_at: input.expectedActivePlanUpdatedAt,
    p_expected_history: input.expectedHistory,
    p_archive_goal_metadata: input.archiveGoalMetadata,
    p_logs: input.logs,
    p_evidence_relinks: input.evidenceRelinks,
  };
  const result =
    input.expectedProfileRevision == null
      ? await supabase.rpc("apply_reviewed_plan_persistence", rpcPayload)
      : await supabase.rpc("apply_reviewed_plan_persistence_with_profile_revision", {
          ...rpcPayload,
          p_expected_profile_revision: input.expectedProfileRevision,
        });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Reviewed plan persistence");
  const planCycle = readObjectField(payload, "plan_cycle") as PersistedPlanCycleRow;
  const archivedPlan = readOptionalObjectField(
    payload,
    "archived_plan",
  ) as PersistedPlanCycleRow | null;
  const workouts = readObjectArrayField(payload, "workouts") as PersistedPlannedWorkoutRow[];

  return {
    planCycle,
    archivedPlan,
    workouts,
  };
}

export async function applyAtomicReviewedImportPersistence(input: {
  userId: string;
  profile: Json;
  plan: Json;
  workouts: Json;
  expectedActivePlanId: string;
  expectedActivePlanUpdatedAt: string;
  expectedHistory: Json;
  archiveGoalMetadata: Json;
  logs: Json;
  evidenceRelinks: Json;
  clearBeforeImport: true;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_reviewed_import_persistence", {
    p_user_id: input.userId,
    p_profile: input.profile,
    p_plan: input.plan,
    p_workouts: input.workouts,
    p_expected_active_plan_id: input.expectedActivePlanId,
    p_expected_active_plan_updated_at: input.expectedActivePlanUpdatedAt,
    p_expected_history: input.expectedHistory,
    p_archive_goal_metadata: input.archiveGoalMetadata,
    p_logs: input.logs,
    p_evidence_relinks: input.evidenceRelinks,
    p_clear_before_import: input.clearBeforeImport,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Reviewed import persistence");
  const planCycle = readObjectField(payload, "plan_cycle") as PersistedPlanCycleRow;
  const archivedPlan = readObjectField(payload, "archived_plan") as PersistedPlanCycleRow;
  const workouts = readObjectArrayField(payload, "workouts") as PersistedPlannedWorkoutRow[];

  return {
    planCycle,
    archivedPlan,
    workouts,
  };
}

function readRpcPayload(value: Json, operation: string): RpcPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${operation} returned an invalid transaction result.`);
  }

  if (value.ok !== true) {
    throw new ActivePlanPersistenceRejection(
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
