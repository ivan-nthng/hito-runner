import type { z } from "zod";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type ImportedPlanSeed,
} from "@/lib/imported-plan";
import {
  prepareImportedPlanApplyPolicy,
  type FirstDayResolution,
  type PlanApplySuccessResult,
  type PlanApplyResult,
  type PreparedPlanApplySuccess,
} from "@/lib/plan-apply-policy";
import {
  mergePlanPersistenceMetadata,
  type AdditionalPlanPersistenceMetadata,
} from "@/lib/plan-authoring-snapshot";
import {
  buildActivePlanReplacementCarryForward,
  copyCarryForwardLogs,
  relinkCarryForwardEvidence,
} from "@/lib/active-plan-replacement-carry-forward";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import type { StructuredFirstPlanProfilePatch } from "@/lib/structured-first-plan-onboarding";
import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { todayIso, type RunnerProfileSummary } from "@/lib/training";
import {
  resolveWeekdayRestInvariant,
  validateWorkoutsAgainstWeekdayRestInvariant,
} from "@/lib/weekday-rest-invariants";

export type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
export type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
export type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];

type ImportedPlanInput = z.infer<typeof importedPlanSchema>;

export interface EmptyActivePlanCreationInput {
  profile: RunnerProfileSummary;
  profilePatch: StructuredFirstPlanProfilePatch | null;
  title: string;
  goalSummary: string;
  sourceTemplate: string;
  schemaVersion: string;
  sourceKind: string;
  startDate: string;
  endDate: string;
  targetDate: string | null;
  goalMetadata: Json | null;
  planPreferences: Json | null;
  planMetadata?: AdditionalPlanPersistenceMetadata | null;
}

export type EmptyActivePlanCreationResult = PlanApplySuccessResult & {
  planCycle: PersistedPlanCycleRow;
  workouts: [];
};

type AssignedPlanCycleSeed = {
  title: string;
  goalSummary: string;
  sourceTemplate: string;
  schemaVersion: string;
  sourceKind: string;
  startDate: string;
  endDate: string;
  targetDate: string | null;
  goalMetadata: Json | null;
  planPreferences: Json | null;
};

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

export function buildReviewedFirstPlanImportedSeed(
  reviewedPlan: ImportedPlanInput,
): ImportedPlanSeed {
  const importedSeed = buildImportedPlanSeed(reviewedPlan);
  const weekdayRestInvariant = resolveWeekdayRestInvariant({
    importedPlanPreferences: reviewedPlan.plan_preferences,
    importedTrainingConstraints: reviewedPlan.training_constraints,
  });

  validateWorkoutsAgainstWeekdayRestInvariant(importedSeed.workouts, weekdayRestInvariant);

  return importedSeed;
}

export async function createFirstPlanFromReviewedCanonicalPlanForUser(
  userId: string,
  reviewedPlan: ImportedPlanInput,
  profilePatch: StructuredFirstPlanProfilePatch | null = null,
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
): Promise<PlanApplySuccessResult> {
  const planContext = await getExistingPlanContext(userId);

  if (planContext.activePlan) {
    throw new Error("A first plan cannot be created while another active plan exists.");
  }

  const importedSeed = buildReviewedFirstPlanImportedSeed(reviewedPlan);

  await upsertRunnerProfile(userId, importedSeed.profile, profilePatch);
  await createAssignedPlanFromImportedSeed(userId, importedSeed, "active", planMetadata);

  return {
    ok: true,
    status: "applied",
    effectiveStartDate: importedSeed.startDate,
    appliedStartDate: importedSeed.startDate,
    normalizedFromStartDate: null,
    firstDayResolution: null,
    workoutCount: importedSeed.workouts.filter((workout) => workout.workoutType !== "rest").length,
  };
}

export async function transitionActiveManualPlanToReviewedCanonicalPlanForUser(input: {
  userId: string;
  currentActivePlan: PersistedPlanCycleRow;
  expectedCurrentActivePlanUpdatedAt: string;
  reviewedPlan: ImportedPlanInput;
  replacementStartsAt: string;
  profilePatch: StructuredFirstPlanProfilePatch | null;
  planMetadata: AdditionalPlanPersistenceMetadata | null;
}) {
  const supabase = createAdminSupabaseClient();
  const reviewedSeed = buildReviewedFirstPlanImportedSeed(input.reviewedPlan);
  const currentPlanStillCurrent = await supabase
    .from("plan_cycles")
    .select("id")
    .eq("id", input.currentActivePlan.id)
    .eq("user_id", input.userId)
    .eq("status", "active")
    .eq("updated_at", input.expectedCurrentActivePlanUpdatedAt)
    .maybeSingle();

  if (currentPlanStillCurrent.error) {
    throw new Error(currentPlanStillCurrent.error.message);
  }

  if (!currentPlanStillCurrent.data) {
    throw new Error("The active plan changed before transition persistence started.");
  }

  const existingWorkouts = await getResolvedPlanWorkoutsWithLogs(
    input.userId,
    input.currentActivePlan,
  );
  const carryForward = await buildActivePlanReplacementCarryForward({
    userId: input.userId,
    importedSeed: reviewedSeed,
    existingWorkouts: existingWorkouts.workouts,
    logsByWorkoutId: existingWorkouts.logsByWorkoutId,
    replacementStartsAt: input.replacementStartsAt,
  });

  await upsertRunnerProfile(input.userId, carryForward.importedSeed.profile, input.profilePatch);
  const insertedPlan = await createAssignedPlanFromImportedSeed(
    input.userId,
    carryForward.importedSeed,
    "archived",
    input.planMetadata,
  );
  let carryForwardAttachmentMap: Awaited<ReturnType<typeof copyCarryForwardLogs>>;

  try {
    carryForwardAttachmentMap = await copyCarryForwardLogs({
      supabase,
      userId: input.userId,
      insertedWorkouts: insertedPlan.workouts,
      sourceLogsByWorkoutId: existingWorkouts.logsByWorkoutId,
      preservedWorkouts: carryForward.preservedWorkouts,
    });
  } catch (error) {
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw error;
  }

  const archiveExisting = await supabase
    .from("plan_cycles")
    .update({
      status: "archived",
      goal_metadata: mergePlanPersistenceMetadata(input.currentActivePlan.goal_metadata, {
        active_plan_transition_superseded_by: {
          source_status: "superseded_by_reviewed_active_plan_transition",
          next_plan_id: insertedPlan.planCycle.id,
          next_plan_source_kind: insertedPlan.planCycle.source_kind,
          transition_review_contract_version: "active_plan_transition_review_v1",
          replacement_starts_at: input.replacementStartsAt,
          preserved_workout_count: carryForward.preservedWorkouts.length,
          future_mutable_workouts_replaced: true,
          upcoming_manual_workouts_merged: false,
        },
      }),
    })
    .eq("id", input.currentActivePlan.id)
    .eq("user_id", input.userId)
    .eq("status", "active")
    .eq("updated_at", input.expectedCurrentActivePlanUpdatedAt)
    .select("*")
    .single();

  if (archiveExisting.error) {
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw new Error(archiveExisting.error.message);
  }

  let rollbackRelinkedEvidence: (() => Promise<void>) | null = null;

  try {
    rollbackRelinkedEvidence = await relinkCarryForwardEvidence({
      supabase,
      userId: input.userId,
      sourceWorkoutIds: carryForward.preservedWorkouts.map((workout) => workout.sourceWorkoutId),
      nextWorkoutIdBySourceWorkoutId: carryForwardAttachmentMap.nextWorkoutIdBySourceWorkoutId,
      nextLogIdBySourceLogId: carryForwardAttachmentMap.nextLogIdBySourceLogId,
    });

    const activateInserted = await supabase
      .from("plan_cycles")
      .update({ status: "active" })
      .eq("id", insertedPlan.planCycle.id)
      .eq("user_id", input.userId)
      .eq("status", "archived")
      .select("*")
      .single();

    if (activateInserted.error) {
      throw new Error(activateInserted.error.message);
    }

    return {
      archivedPlan: archiveExisting.data,
      activePlan: activateInserted.data,
      workouts: insertedPlan.workouts,
    };
  } catch (error) {
    let relinkRollbackError: unknown = null;

    if (rollbackRelinkedEvidence) {
      try {
        await rollbackRelinkedEvidence();
      } catch (rollbackError) {
        relinkRollbackError = rollbackError;
      }
    }

    await supabase
      .from("plan_cycles")
      .update({ status: "active" })
      .eq("id", input.currentActivePlan.id)
      .eq("user_id", input.userId);

    if (!relinkRollbackError) {
      await rollbackInsertedPlan(insertedPlan.planCycle.id);
    }

    throw relinkRollbackError ?? error;
  }
}

export async function createEmptyActivePlanForUser(
  userId: string,
  input: EmptyActivePlanCreationInput,
): Promise<EmptyActivePlanCreationResult> {
  const planContext = await getExistingPlanContext(userId);

  if (planContext.activePlan) {
    throw new Error("An empty active plan cannot be created while another active plan exists.");
  }

  await upsertRunnerProfile(userId, input.profile, input.profilePatch);
  const planCycle = await createAssignedPlanCycle(
    userId,
    input,
    "active",
    input.planMetadata ?? null,
  );

  return {
    ok: true,
    status: "applied",
    effectiveStartDate: input.startDate,
    appliedStartDate: input.startDate,
    normalizedFromStartDate: null,
    firstDayResolution: null,
    workoutCount: 0,
    planCycle,
    workouts: [],
  };
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
  const planCycle = await createAssignedPlanCycle(userId, importedSeed, status, planMetadata);

  const workoutInsert = await supabase
    .from("planned_workouts")
    .insert(buildPersistedWorkoutInsertRows(planCycle.id, userId, importedSeed.workouts))
    .select("*");

  if (workoutInsert.error) {
    await rollbackInsertedPlan(planCycle.id);
    throw new Error(workoutInsert.error.message);
  }

  if (!workoutInsert.data || workoutInsert.data.length !== importedSeed.workouts.length) {
    await rollbackInsertedPlan(planCycle.id);
    throw new Error("Planned workout persistence did not match the reviewed plan row count.");
  }

  return {
    planCycle,
    workouts: workoutInsert.data,
  };
}

async function createAssignedPlanCycle(
  userId: string,
  seed: AssignedPlanCycleSeed,
  status: PersistedPlanCycleRow["status"] = "active",
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
) {
  const supabase = createAdminSupabaseClient();
  const planInsert = await supabase
    .from("plan_cycles")
    .insert({
      user_id: userId,
      status,
      title: seed.title,
      goal_summary: seed.goalSummary,
      source_template: seed.sourceTemplate,
      schema_version: seed.schemaVersion,
      source_kind: seed.sourceKind,
      start_date: seed.startDate,
      end_date: seed.endDate,
      target_date: seed.targetDate,
      goal_metadata: mergePlanPersistenceMetadata(seed.goalMetadata, planMetadata?.goalMetadata),
      plan_preferences: mergePlanPersistenceMetadata(
        seed.planPreferences,
        planMetadata?.planPreferences,
      ),
    })
    .select("*")
    .single();

  if (planInsert.error) {
    throw new Error(planInsert.error.message);
  }

  return planInsert.data;
}

async function replaceActivePlanWithImportedInput(
  userId: string,
  preparedApply: PreparedPlanApplySuccess,
  planContext: ExistingPlanContext,
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
) {
  const supabase = createAdminSupabaseClient();
  const carryForward = planContext.activePlan
    ? await buildActivePlanReplacementCarryForward({
        userId,
        importedSeed: preparedApply.importedSeed,
        existingWorkouts: planContext.existingWorkouts.workouts,
        logsByWorkoutId: planContext.existingWorkouts.logsByWorkoutId,
        replacementStartsAt: preparedApply.result.effectiveStartDate,
      })
    : {
        importedSeed: preparedApply.importedSeed,
        preservedWorkouts: [],
      };
  const insertedPlan = await createAssignedPlanFromImportedSeed(
    userId,
    carryForward.importedSeed,
    planContext.activePlan ? "archived" : "active",
    planMetadata,
  );
  let carryForwardAttachmentMap: Awaited<ReturnType<typeof copyCarryForwardLogs>> = {
    nextWorkoutIdBySourceWorkoutId: new Map(),
    nextLogIdBySourceLogId: new Map(),
  };

  if (planContext.activePlan) {
    try {
      carryForwardAttachmentMap = await copyCarryForwardLogs({
        supabase,
        userId,
        insertedWorkouts: insertedPlan.workouts,
        sourceLogsByWorkoutId: planContext.existingWorkouts.logsByWorkoutId,
        preservedWorkouts: carryForward.preservedWorkouts,
      });
    } catch (error) {
      await rollbackInsertedPlan(insertedPlan.planCycle.id);
      throw error;
    }
  }

  if (!planContext.activePlan) {
    return insertedPlan.planCycle;
  }

  const archiveExisting = await supabase
    .from("plan_cycles")
    .update({
      status: "archived",
      goal_metadata: mergePlanPersistenceMetadata(planContext.activePlan.goal_metadata, {
        active_plan_replacement_superseded_by: {
          source_status: "superseded_by_reviewed_plan_replacement",
          next_plan_id: insertedPlan.planCycle.id,
          next_plan_source_kind: insertedPlan.planCycle.source_kind,
          replacement_starts_at: preparedApply.result.effectiveStartDate,
          preserved_workout_count: carryForward.preservedWorkouts.length,
          future_mutable_workouts_replaced: true,
        },
      }),
    })
    .eq("id", planContext.activePlan.id)
    .eq("status", "active");

  if (archiveExisting.error) {
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw new Error(archiveExisting.error.message);
  }

  let rollbackRelinkedEvidence: (() => Promise<void>) | null = null;

  try {
    rollbackRelinkedEvidence = await relinkCarryForwardEvidence({
      supabase,
      userId,
      sourceWorkoutIds: carryForward.preservedWorkouts.map((workout) => workout.sourceWorkoutId),
      nextWorkoutIdBySourceWorkoutId: carryForwardAttachmentMap.nextWorkoutIdBySourceWorkoutId,
      nextLogIdBySourceLogId: carryForwardAttachmentMap.nextLogIdBySourceLogId,
    });

    const activateInserted = await supabase
      .from("plan_cycles")
      .update({ status: "active" })
      .eq("id", insertedPlan.planCycle.id)
      .eq("status", "archived")
      .select("*")
      .single();

    if (activateInserted.error) {
      throw new Error(activateInserted.error.message);
    }

    return activateInserted.data;
  } catch (error) {
    let relinkRollbackError: unknown = null;

    if (rollbackRelinkedEvidence) {
      try {
        await rollbackRelinkedEvidence();
      } catch (rollbackError) {
        relinkRollbackError = rollbackError;
      }
    }

    await supabase
      .from("plan_cycles")
      .update({ status: "active" })
      .eq("id", planContext.activePlan.id);

    if (!relinkRollbackError) {
      await rollbackInsertedPlan(insertedPlan.planCycle.id);
    }

    throw relinkRollbackError ?? error;
  }
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
