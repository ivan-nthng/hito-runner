import type { z } from "zod";
import { importedPlanSchema, type ImportedPlanSeed } from "@/lib/imported-plan";
import {
  prepareImportedPlanApplyPolicy,
  type FirstDayResolution,
  type PlanApplyResult,
  type PreparedPlanApplySuccess,
} from "@/lib/plan-apply-policy";
import {
  mergePlanPersistenceMetadata,
  type AdditionalPlanPersistenceMetadata,
} from "@/lib/plan-authoring-snapshot";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import type { StructuredFirstPlanProfilePatch } from "@/lib/structured-first-plan-onboarding";
import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { todayIso, type RunnerProfileSummary } from "@/lib/training";

export type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
export type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
export type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];

type ImportedPlanInput = z.infer<typeof importedPlanSchema>;

export type ExistingPlanContext = {
  activePlan: PersistedPlanCycleRow | null;
  existingWorkouts: {
    workouts: PersistedPlannedWorkoutRow[];
    logsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  };
};

type PreparedImportedPlanApply = PreparedPlanApplySuccess & {
  planContext: ExistingPlanContext;
};

export async function applyImportedPlanForUser(
  userId: string,
  importedPlan: ImportedPlanInput,
  firstDayResolution: FirstDayResolution | null,
  requestedStartDate: string | null = null,
  profilePatch: StructuredFirstPlanProfilePatch | null = null,
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
): Promise<PlanApplyResult> {
  const preparedApply = await prepareImportedPlanApply(
    userId,
    importedPlan,
    firstDayResolution,
    requestedStartDate,
  );

  if ("ok" in preparedApply && !preparedApply.ok) {
    return preparedApply;
  }

  await upsertRunnerProfile(userId, preparedApply.importedSeed.profile, profilePatch);
  await replaceActivePlanWithImportedInput(
    userId,
    preparedApply,
    preparedApply.planContext,
    planMetadata,
  );

  return preparedApply.result;
}

export async function getActivePlan(userId: string) {
  const supabase = createAdminSupabaseClient();
  const existing = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  return existing.data;
}

export async function createAssignedPlanFromImportedSeed(
  userId: string,
  importedSeed: ImportedPlanSeed,
  status: PersistedPlanCycleRow["status"] = "active",
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
) {
  const supabase = createAdminSupabaseClient();
  const planInsert = await supabase
    .from("plan_cycles")
    .insert({
      user_id: userId,
      status,
      title: importedSeed.title,
      goal_summary: importedSeed.goalSummary,
      source_template: importedSeed.sourceTemplate,
      schema_version: importedSeed.schemaVersion,
      source_kind: importedSeed.sourceKind,
      start_date: importedSeed.startDate,
      end_date: importedSeed.endDate,
      target_date: importedSeed.targetDate,
      goal_metadata: mergePlanPersistenceMetadata(
        importedSeed.goalMetadata,
        planMetadata?.goalMetadata,
      ),
      plan_preferences: mergePlanPersistenceMetadata(
        importedSeed.planPreferences,
        planMetadata?.planPreferences,
      ),
    })
    .select("*")
    .single();

  if (planInsert.error) {
    throw new Error(planInsert.error.message);
  }

  const workoutInsert = await supabase
    .from("planned_workouts")
    .insert(buildPersistedWorkoutInsertRows(planInsert.data.id, userId, importedSeed.workouts))
    .select("*");

  if (workoutInsert.error) {
    throw new Error(workoutInsert.error.message);
  }

  return {
    planCycle: planInsert.data,
    workouts: workoutInsert.data,
  };
}

async function replaceActivePlanWithImportedInput(
  userId: string,
  preparedApply: PreparedPlanApplySuccess,
  planContext: ExistingPlanContext,
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
) {
  const supabase = createAdminSupabaseClient();
  const { importedSeed, preservationPlan } = preparedApply;
  const insertedPlan = await createAssignedPlanFromImportedSeed(
    userId,
    importedSeed,
    planContext.activePlan ? "archived" : "active",
    planMetadata,
  );
  const insertedWorkoutsByDate = new Map(
    insertedPlan.workouts.map((workout) => [workout.workout_date, workout]),
  );

  if (preservationPlan.logs.length > 0) {
    const copiedLogs = preservationPlan.logs.map(({ log, workoutDate }) => {
      const nextWorkout = insertedWorkoutsByDate.get(workoutDate);

      if (!nextWorkout) {
        throw new Error(
          `Imported plan replacement lost the inserted workout for ${workoutDate}. Current plan is unchanged.`,
        );
      }

      return {
        planned_workout_id: nextWorkout.id,
        user_id: userId,
        outcome: log.outcome,
        actual_distance_km: log.actual_distance_km,
        actual_duration_min: log.actual_duration_min,
        rpe: log.rpe,
        notes: log.notes,
        intervals_completed: log.intervals_completed,
        logged_at: log.logged_at,
        updated_at: log.updated_at,
      };
    });

    const logInsert = await supabase.from("workout_logs").insert(copiedLogs);

    if (logInsert.error) {
      await rollbackInsertedPlan(insertedPlan.planCycle.id);
      throw new Error(logInsert.error.message);
    }
  }

  if (!planContext.activePlan) {
    return insertedPlan.planCycle;
  }

  const archiveExisting = await supabase
    .from("plan_cycles")
    .update({ status: "archived" })
    .eq("id", planContext.activePlan.id)
    .eq("status", "active");

  if (archiveExisting.error) {
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw new Error(archiveExisting.error.message);
  }

  const activateInserted = await supabase
    .from("plan_cycles")
    .update({ status: "active" })
    .eq("id", insertedPlan.planCycle.id)
    .eq("status", "archived")
    .select("*")
    .single();

  if (activateInserted.error) {
    await supabase
      .from("plan_cycles")
      .update({ status: "active" })
      .eq("id", planContext.activePlan.id);
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw new Error(activateInserted.error.message);
  }

  const deletePreviousPlan = await supabase
    .from("plan_cycles")
    .delete()
    .eq("id", planContext.activePlan.id);

  if (deletePreviousPlan.error) {
    throw new Error(deletePreviousPlan.error.message);
  }

  return activateInserted.data;
}

async function prepareImportedPlanApply(
  userId: string,
  importedPlan: ImportedPlanInput,
  firstDayResolution: FirstDayResolution | null,
  requestedStartDate: string | null,
): Promise<PreparedImportedPlanApply> {
  const planContext = await getExistingPlanContext(userId);
  const policyResult = prepareImportedPlanApplyPolicy(
    importedPlan,
    planContext.existingWorkouts,
    firstDayResolution,
    requestedStartDate,
    todayIso(),
    planContext.activePlan?.plan_preferences ?? null,
  );

  return {
    result: policyResult.result,
    importedSeed: policyResult.importedSeed,
    planContext,
    preservationPlan: policyResult.preservationPlan,
  };
}

export async function getExistingPlanContext(userId: string): Promise<ExistingPlanContext> {
  const activePlan = await getActivePlan(userId);

  return {
    activePlan,
    existingWorkouts: activePlan
      ? await getResolvedPlanWorkoutsWithLogs(userId, activePlan)
      : {
          workouts: [] as PersistedPlannedWorkoutRow[],
          logsByWorkoutId: new Map<string, PersistedWorkoutLogRow>(),
        },
  };
}

async function upsertRunnerProfile(
  userId: string,
  profile: RunnerProfileSummary,
  profilePatch: StructuredFirstPlanProfilePatch | null = null,
) {
  const supabase = createAdminSupabaseClient();
  const baselineNotes = profilePatch ? profilePatch.baselineNotes : (profile.baselineNotes ?? null);
  const profileUpsert = await supabase
    .from("runner_profiles")
    .upsert({
      user_id: userId,
      goal_type: profile.goalType,
      goal_label: profile.goalLabel,
      baseline_sessions_per_week: profile.baselineSessionsPerWeek,
      baseline_long_run_km: profile.baselineLongRunKm,
      baseline_notes: baselineNotes,
      ...(profilePatch
        ? {
            age: profilePatch.age,
            weight_kg: profilePatch.weightKg,
            height_cm: profilePatch.heightCm,
            ...(profilePatch.trainingPreferences !== undefined
              ? { training_preferences: profilePatch.trainingPreferences as Json }
              : {}),
          }
        : {}),
      setup_state: "completed",
    })
    .select("user_id")
    .single();

  if (profileUpsert.error) {
    throw new Error(profileUpsert.error.message);
  }
}

export async function getPlanWorkoutsWithLogs(planCycleId: string) {
  const workouts = await getPlanWorkouts(planCycleId);
  const supabase = createAdminSupabaseClient();
  const workoutIds = workouts.map((workout) => workout.id);
  const logsResult = workoutIds.length
    ? await supabase.from("workout_logs").select("*").in("planned_workout_id", workoutIds)
    : { data: [], error: null };

  if (logsResult.error) {
    throw new Error(logsResult.error.message);
  }

  return {
    workouts,
    logsByWorkoutId: new Map(logsResult.data.map((log) => [log.planned_workout_id, log])),
  };
}

export async function getPlanWorkouts(planCycleId: string) {
  const supabase = createAdminSupabaseClient();
  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_cycle_id", planCycleId)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  return workoutsResult.data;
}

export async function getResolvedPlanWorkoutsWithLogs(
  userId: string,
  planCycle: PersistedPlanCycleRow,
) {
  const direct = await getPlanWorkoutsWithLogs(planCycle.id);
  const recovered = await recoverArchivedLogsOntoActivePlan(userId, planCycle, direct);

  if (!recovered) {
    return direct;
  }

  return getPlanWorkoutsWithLogs(planCycle.id);
}

async function recoverArchivedLogsOntoActivePlan(
  userId: string,
  activePlan: PersistedPlanCycleRow,
  direct: {
    workouts: PersistedPlannedWorkoutRow[];
    logsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  },
) {
  const unresolvedDates = direct.workouts
    .filter((workout) => workout.workout_type !== "rest" && !direct.logsByWorkoutId.has(workout.id))
    .map((workout) => workout.workout_date);

  if (unresolvedDates.length === 0) {
    return false;
  }

  const supabase = createAdminSupabaseClient();
  const archivedPlansResult = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "archived")
    .eq("title", activePlan.title)
    .eq("start_date", activePlan.start_date)
    .eq("end_date", activePlan.end_date)
    .eq("source_template", activePlan.source_template)
    .order("created_at", { ascending: false });

  if (archivedPlansResult.error) {
    throw new Error(archivedPlansResult.error.message);
  }

  if (archivedPlansResult.data.length === 0) {
    return false;
  }

  const planOrder = new Map(archivedPlansResult.data.map((plan, index) => [plan.id, index]));
  const archivedPlanIds = archivedPlansResult.data.map((plan) => plan.id);
  const archivedWorkoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .in("plan_cycle_id", archivedPlanIds)
    .in("workout_date", unresolvedDates)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (archivedWorkoutsResult.error) {
    throw new Error(archivedWorkoutsResult.error.message);
  }

  const archivedWorkoutIds = archivedWorkoutsResult.data.map((workout) => workout.id);
  const archivedLogsResult = archivedWorkoutIds.length
    ? await supabase.from("workout_logs").select("*").in("planned_workout_id", archivedWorkoutIds)
    : { data: [], error: null };

  if (archivedLogsResult.error) {
    throw new Error(archivedLogsResult.error.message);
  }

  const archivedLogsByWorkoutId = new Map(
    archivedLogsResult.data.map((log) => [log.planned_workout_id, log]),
  );
  const archivedCandidatesByDate = new Map<
    string,
    Array<{
      planOrder: number;
      workout: PersistedPlannedWorkoutRow;
      log: PersistedWorkoutLogRow;
    }>
  >();

  for (const workout of archivedWorkoutsResult.data) {
    const log = archivedLogsByWorkoutId.get(workout.id);

    if (!log) {
      continue;
    }

    const entries = archivedCandidatesByDate.get(workout.workout_date) ?? [];
    entries.push({
      planOrder: planOrder.get(workout.plan_cycle_id) ?? Number.MAX_SAFE_INTEGER,
      workout,
      log,
    });
    archivedCandidatesByDate.set(workout.workout_date, entries);
  }

  const recoveredLogs = direct.workouts.flatMap((activeWorkout) => {
    if (activeWorkout.workout_type === "rest" || direct.logsByWorkoutId.has(activeWorkout.id)) {
      return [];
    }

    const candidates = archivedCandidatesByDate.get(activeWorkout.workout_date) ?? [];
    const matched = candidates
      .slice()
      .sort((left, right) => left.planOrder - right.planOrder)
      .find((candidate) => candidate.workout.workout_date === activeWorkout.workout_date);

    if (!matched) {
      return [];
    }

    return [
      {
        planned_workout_id: activeWorkout.id,
        user_id: userId,
        outcome: matched.log.outcome,
        actual_distance_km: matched.log.actual_distance_km,
        actual_duration_min: matched.log.actual_duration_min,
        rpe: matched.log.rpe,
        notes: matched.log.notes,
        intervals_completed: matched.log.intervals_completed,
        logged_at: matched.log.logged_at,
        updated_at: matched.log.updated_at,
      },
    ];
  });

  if (recoveredLogs.length === 0) {
    return false;
  }

  const recoveredInsert = await supabase.from("workout_logs").upsert(recoveredLogs, {
    onConflict: "planned_workout_id",
  });

  if (recoveredInsert.error) {
    throw new Error(recoveredInsert.error.message);
  }

  return true;
}

export async function rollbackInsertedPlan(planCycleId: string) {
  const supabase = createAdminSupabaseClient();
  await supabase.from("plan_cycles").delete().eq("id", planCycleId);
}
