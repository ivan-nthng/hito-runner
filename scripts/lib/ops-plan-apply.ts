import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImportedPlanSeed } from "../../src/lib/imported-plan";
import { buildPersistedWorkoutInsertRows } from "../../src/lib/persisted-plan-replacement";
import type { Database, Json } from "../../src/lib/supabase/database";

type OpsSupabaseClient = SupabaseClient<Database>;

type OpsPlanCycleReadback = Record<string, unknown>;
type OpsWorkoutReadback = Record<string, unknown>;

export interface OpsImportedPlanApplyInput {
  supabase: OpsSupabaseClient;
  userId: string;
  importedSeed: ImportedPlanSeed;
  profileBaselineNotes?: string | null;
  planSelect: string;
  workoutSelect: string;
  workoutLimit?: number | null;
}

export interface OpsImportedPlanApplyResult {
  planCycle: OpsPlanCycleReadback;
  workoutCount: number;
  workouts: OpsWorkoutReadback[];
}

export async function applyImportedSeedAsActivePlanForOps(
  input: OpsImportedPlanApplyInput,
): Promise<OpsImportedPlanApplyResult> {
  const { importedSeed, supabase, userId } = input;
  const profileUpsert = await supabase
    .from("runner_profiles")
    .upsert({
      user_id: userId,
      goal_type: importedSeed.profile.goalType,
      goal_label: importedSeed.profile.goalLabel,
      baseline_sessions_per_week: importedSeed.profile.baselineSessionsPerWeek,
      baseline_long_run_km: importedSeed.profile.baselineLongRunKm,
      baseline_notes: input.profileBaselineNotes ?? importedSeed.profile.baselineNotes ?? null,
      setup_state: "completed",
    })
    .select("user_id")
    .single();

  if (profileUpsert.error) {
    throw new Error(profileUpsert.error.message);
  }

  const archived = await supabase
    .from("plan_cycles")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .eq("status", "active");

  if (archived.error) {
    throw new Error(archived.error.message);
  }

  const planInsert = await supabase
    .from("plan_cycles")
    .insert({
      user_id: userId,
      status: "active",
      title: importedSeed.title,
      goal_summary: importedSeed.goalSummary,
      source_template: importedSeed.sourceTemplate,
      schema_version: importedSeed.schemaVersion,
      source_kind: importedSeed.sourceKind,
      start_date: importedSeed.startDate,
      end_date: importedSeed.endDate,
      target_date: importedSeed.targetDate,
      goal_metadata: importedSeed.goalMetadata as Json,
      plan_preferences: importedSeed.planPreferences as Json,
    })
    .select(input.planSelect)
    .single();

  if (planInsert.error) {
    throw new Error(planInsert.error.message);
  }

  const planCycle = planInsert.data as OpsPlanCycleReadback;
  const planCycleId = readStringField(planCycle, "id");
  const workoutInsert = await supabase
    .from("planned_workouts")
    .insert(buildPersistedWorkoutInsertRows(planCycleId, userId, importedSeed.workouts));

  if (workoutInsert.error) {
    throw new Error(workoutInsert.error.message);
  }

  let verifyQuery = supabase
    .from("planned_workouts")
    .select(input.workoutSelect, { count: "exact" })
    .eq("plan_cycle_id", planCycleId)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (input.workoutLimit && input.workoutLimit > 0) {
    verifyQuery = verifyQuery.limit(input.workoutLimit);
  }

  const verifyWorkouts = await verifyQuery;

  if (verifyWorkouts.error) {
    throw new Error(verifyWorkouts.error.message);
  }

  return {
    planCycle,
    workoutCount: verifyWorkouts.count ?? 0,
    workouts: (verifyWorkouts.data ?? []) as OpsWorkoutReadback[],
  };
}

function readStringField(row: OpsPlanCycleReadback, key: string): string {
  const value = row[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Plan apply readback did not include ${key}.`);
  }

  return value;
}
