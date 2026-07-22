import type { z } from "zod";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  normalizeConfirmedExternalImportSeed,
  type ImportedPlanSeed,
} from "@/lib/imported-plan";
import {
  prepareImportedPlanApplyPolicy,
  type FirstDayResolution,
  type PlanApplySuccessResult,
  type PreparedPlanApplySuccess,
} from "@/lib/plan-apply-policy";
import {
  mergePlanPersistenceMetadata,
  type AdditionalPlanPersistenceMetadata,
} from "@/lib/plan-authoring-snapshot";
import {
  buildActivePlanReplacementCarryForward,
  prepareActivePlanReplacementPersistence,
  type ActivePlanHistoryDisposition,
} from "@/lib/active-plan-replacement-carry-forward";
import {
  applyAtomicReviewedImportPersistence,
  applyAtomicReviewedPlanPersistence,
} from "@/lib/active-plan-lifecycle-persistence";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
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

export type ImportedPlanApplyIntent = {
  clearBeforeImport: boolean;
};

export async function applyImportedPlanForUser(
  userId: string,
  importedPlan: ImportedPlanInput,
  firstDayResolution: FirstDayResolution | null,
  requestedStartDate: string | null = null,
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
  intent: ImportedPlanApplyIntent = { clearBeforeImport: false },
): Promise<PlanApplySuccessResult> {
  const preparedApply = await prepareImportedPlanApply(
    userId,
    importedPlan,
    firstDayResolution,
    requestedStartDate,
    intent,
  );

  await replaceActivePlanWithImportedInput(
    userId,
    preparedApply,
    preparedApply.planContext,
    planMetadata,
    intent,
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
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
  options: { expectedProfileRevision?: number } = {},
): Promise<PlanApplySuccessResult> {
  const planContext = await getExistingPlanContext(userId);

  if (planContext.activePlan) {
    throw new Error("A first plan cannot be created while another active plan exists.");
  }

  const importedSeed = buildReviewedFirstPlanImportedSeed(reviewedPlan);

  await persistNewReviewedPlan({
    userId,
    importedSeed,
    planMetadata,
    expectedProfileRevision: options.expectedProfileRevision,
  });

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
  expectedProfileRevision: number;
  reviewedPlan: ImportedPlanInput;
  replacementStartsAt: string;
  planMetadata: AdditionalPlanPersistenceMetadata | null;
}) {
  const reviewedSeed = buildReviewedFirstPlanImportedSeed(input.reviewedPlan);
  const existingWorkouts = await getResolvedPlanWorkoutsWithLogs(
    input.userId,
    input.currentActivePlan,
  );

  return replaceActivePlanWithCompiledSeed({
    userId: input.userId,
    currentActivePlan: input.currentActivePlan,
    expectedCurrentActivePlanUpdatedAt: input.expectedCurrentActivePlanUpdatedAt,
    expectedProfileRevision: input.expectedProfileRevision,
    existingWorkouts,
    importedSeed: reviewedSeed,
    replacementStartsAt: input.replacementStartsAt,
    planMetadata: input.planMetadata,
    historyDisposition: "carry_forward",
    buildSupersessionMetadata: ({ insertedPlan, preservedWorkoutCount }) => ({
      active_plan_transition_superseded_by: {
        source_status: "superseded_by_reviewed_active_plan_transition",
        next_plan_id: insertedPlan.id,
        next_plan_source_kind: insertedPlan.source_kind,
        transition_review_contract_version: "active_plan_transition_review_v1",
        replacement_starts_at: input.replacementStartsAt,
        preserved_workout_count: preservedWorkoutCount,
        future_mutable_workouts_replaced: true,
        upcoming_manual_workouts_merged: false,
      },
    }),
  });
}

export async function createEmptyActivePlanForUser(
  userId: string,
  input: EmptyActivePlanCreationInput,
): Promise<EmptyActivePlanCreationResult> {
  const planContext = await getExistingPlanContext(userId);

  if (planContext.activePlan) {
    throw new Error("An empty active plan cannot be created while another active plan exists.");
  }

  const persisted = await persistNewReviewedPlan({
    userId,
    importedSeed: {
      profile: input.profile,
      title: input.title,
      goalSummary: input.goalSummary,
      sourceTemplate: input.sourceTemplate,
      schemaVersion: input.schemaVersion,
      sourceKind: input.sourceKind,
      startDate: input.startDate,
      endDate: input.endDate,
      targetDate: input.targetDate,
      goalMetadata: input.goalMetadata,
      planPreferences: input.planPreferences,
      workouts: [],
    },
    planMetadata: input.planMetadata ?? null,
  });

  return {
    ok: true,
    status: "applied",
    effectiveStartDate: input.startDate,
    appliedStartDate: input.startDate,
    normalizedFromStartDate: null,
    firstDayResolution: null,
    workoutCount: 0,
    planCycle: persisted.planCycle,
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

async function replaceActivePlanWithImportedInput(
  userId: string,
  preparedApply: PreparedPlanApplySuccess,
  planContext: ExistingPlanContext,
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
  intent: ImportedPlanApplyIntent,
) {
  if (!planContext.activePlan) {
    const insertedPlan = await persistNewReviewedPlan({
      userId,
      importedSeed: preparedApply.importedSeed,
      planMetadata,
    });

    return insertedPlan.planCycle;
  }

  const replacement = await replaceActivePlanWithCompiledSeed({
    userId,
    currentActivePlan: planContext.activePlan,
    expectedCurrentActivePlanUpdatedAt: planContext.activePlan.updated_at,
    existingWorkouts: planContext.existingWorkouts,
    importedSeed: preparedApply.importedSeed,
    replacementStartsAt: preparedApply.result.effectiveStartDate,
    planMetadata,
    historyDisposition: intent.clearBeforeImport ? "archive_only" : "carry_forward",
    buildSupersessionMetadata: ({ insertedPlan, preservedWorkoutCount }) => ({
      active_plan_replacement_superseded_by: {
        source_status: "superseded_by_reviewed_plan_replacement",
        next_plan_id: insertedPlan.id,
        next_plan_source_kind: insertedPlan.source_kind,
        replacement_starts_at: preparedApply.result.effectiveStartDate,
        preserved_workout_count: preservedWorkoutCount,
        future_mutable_workouts_replaced: true,
      },
    }),
  });

  return replacement.activePlan;
}

async function replaceActivePlanWithCompiledSeed(input: {
  userId: string;
  currentActivePlan: PersistedPlanCycleRow;
  expectedCurrentActivePlanUpdatedAt: string | null;
  expectedProfileRevision?: number;
  existingWorkouts: ExistingPlanContext["existingWorkouts"];
  importedSeed: ImportedPlanSeed;
  replacementStartsAt: string;
  planMetadata: AdditionalPlanPersistenceMetadata | null;
  historyDisposition: ActivePlanHistoryDisposition;
  buildSupersessionMetadata: (context: {
    insertedPlan: Pick<PersistedPlanCycleRow, "id" | "source_kind">;
    preservedWorkoutCount: number;
  }) => Record<string, Json>;
}) {
  const supabase = createAdminSupabaseClient();
  const carryForward =
    input.historyDisposition === "carry_forward"
      ? await buildActivePlanReplacementCarryForward({
          userId: input.userId,
          importedSeed: input.importedSeed,
          existingWorkouts: input.existingWorkouts.workouts,
          logsByWorkoutId: input.existingWorkouts.logsByWorkoutId,
          replacementStartsAt: input.replacementStartsAt,
        })
      : {
          importedSeed: input.importedSeed,
          preservedWorkouts: [],
        };
  const planId = crypto.randomUUID();
  const workoutRows = buildPersistedWorkoutRows(planId, input.userId, carryForward.importedSeed);
  const carryForwardPersistence = await prepareActivePlanReplacementPersistence({
    supabase,
    userId: input.userId,
    insertedWorkouts: workoutRows,
    currentWorkoutIds: input.existingWorkouts.workouts.map((workout) => workout.id),
    sourceLogsByWorkoutId: input.existingWorkouts.logsByWorkoutId,
    preservedWorkouts: carryForward.preservedWorkouts,
    historyDisposition: input.historyDisposition,
  });
  const planPayload = buildPlanPersistencePayload(
    planId,
    carryForward.importedSeed,
    input.planMetadata,
  );
  const archiveGoalMetadata =
    input.historyDisposition === "archive_only"
      ? input.currentActivePlan.goal_metadata
      : mergePlanPersistenceMetadata(
          input.currentActivePlan.goal_metadata,
          input.buildSupersessionMetadata({
            insertedPlan: {
              id: planId,
              source_kind: carryForward.importedSeed.sourceKind,
            },
            preservedWorkoutCount: carryForward.preservedWorkouts.length,
          }),
        );
  const persistenceInput = {
    userId: input.userId,
    profile: buildProfilePersistencePayload(carryForward.importedSeed.profile),
    plan: planPayload,
    workouts: workoutRows as unknown as Json,
    expectedActivePlanId: input.currentActivePlan.id,
    expectedActivePlanUpdatedAt:
      input.expectedCurrentActivePlanUpdatedAt ?? input.currentActivePlan.updated_at,
    expectedHistory: carryForwardPersistence.expectedHistory,
    archiveGoalMetadata,
    logs: carryForwardPersistence.logRows,
    evidenceRelinks: carryForwardPersistence.evidenceRelinks,
  };
  const persisted =
    input.historyDisposition === "archive_only"
      ? await applyAtomicReviewedImportPersistence({
          ...persistenceInput,
          expectedActivePlanId: input.currentActivePlan.id,
          expectedActivePlanUpdatedAt:
            input.expectedCurrentActivePlanUpdatedAt ?? input.currentActivePlan.updated_at,
          clearBeforeImport: true,
        })
      : await applyAtomicReviewedPlanPersistence({
          ...persistenceInput,
          expectedProfileRevision: input.expectedProfileRevision,
        });

  if (!persisted.archivedPlan) {
    throw new Error("Atomic plan replacement did not return the archived plan.");
  }

  return {
    archivedPlan: persisted.archivedPlan,
    activePlan: persisted.planCycle,
    workouts: persisted.workouts,
  };
}

async function prepareImportedPlanApply(
  userId: string,
  importedPlan: ImportedPlanInput,
  firstDayResolution: FirstDayResolution | null,
  requestedStartDate: string | null,
  intent: ImportedPlanApplyIntent,
): Promise<PreparedImportedPlanApply> {
  const planContext = await getExistingPlanContext(userId);
  if (intent.clearBeforeImport && !planContext.activePlan) {
    throw new Error("The current schedule changed before clear-before-import could be applied.");
  }
  const policyWorkouts = intent.clearBeforeImport
    ? {
        workouts: [] as PersistedPlannedWorkoutRow[],
        logsByWorkoutId: new Map<string, PersistedWorkoutLogRow>(),
      }
    : planContext.existingWorkouts;
  const policyResult = prepareImportedPlanApplyPolicy(
    importedPlan,
    policyWorkouts,
    firstDayResolution,
    requestedStartDate,
    todayIso(),
    intent.clearBeforeImport ? null : (planContext.activePlan?.plan_preferences ?? null),
  );

  return {
    result: policyResult.result,
    importedSeed: normalizeConfirmedExternalImportSeed(importedPlan, policyResult.importedSeed),
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

async function persistNewReviewedPlan(input: {
  userId: string;
  importedSeed: ImportedPlanSeed;
  planMetadata: AdditionalPlanPersistenceMetadata | null;
  expectedProfileRevision?: number;
}) {
  const planId = crypto.randomUUID();
  const workoutRows = buildPersistedWorkoutRows(planId, input.userId, input.importedSeed);

  return applyAtomicReviewedPlanPersistence({
    userId: input.userId,
    profile: buildProfilePersistencePayload(input.importedSeed.profile),
    plan: buildPlanPersistencePayload(planId, input.importedSeed, input.planMetadata),
    workouts: workoutRows as unknown as Json,
    expectedActivePlanId: null,
    expectedActivePlanUpdatedAt: null,
    expectedHistory: {
      workout_ids: [],
      log_ids: [],
      asset_ids: [],
      metric_ids: [],
      comparison_ids: [],
      insight_ids: [],
    },
    archiveGoalMetadata: null,
    logs: [],
    evidenceRelinks: [],
    ...(input.expectedProfileRevision == null
      ? {}
      : { expectedProfileRevision: input.expectedProfileRevision }),
  });
}

function buildProfilePersistencePayload(profile: RunnerProfileSummary): Json {
  return {
    goal_type: profile.goalType,
    goal_label: profile.goalLabel,
    baseline_sessions_per_week: profile.baselineSessionsPerWeek,
    baseline_long_run_km: profile.baselineLongRunKm,
    baseline_notes: profile.baselineNotes ?? null,
  };
}

function buildPlanPersistencePayload(
  planId: string,
  seed: ImportedPlanSeed,
  planMetadata: AdditionalPlanPersistenceMetadata | null,
): Json {
  return {
    id: planId,
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
  };
}

function buildPersistedWorkoutRows(planId: string, userId: string, seed: ImportedPlanSeed) {
  return buildPersistedWorkoutInsertRows(planId, userId, seed.workouts).map((workout) => ({
    ...workout,
    id: crypto.randomUUID(),
  }));
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
