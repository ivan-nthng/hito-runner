import type { z } from "zod";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  normalizeConfirmedExternalImportSeed,
  type ImportedPlanSeed,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import {
  prepareSavedPlanFutureApplyPolicy,
  type PlanApplySuccessResult,
  type SavedPlanStartScheduleOptions,
} from "@/lib/plan-apply-policy";
import {
  mergePlanPersistenceMetadata,
  type AdditionalPlanPersistenceMetadata,
} from "@/lib/plan-authoring-snapshot";
import {
  applyAtomicReviewedFutureSchedulePersistence,
  applyAtomicReviewedPlanPersistence,
} from "@/lib/active-plan-lifecycle-persistence";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import { collectRowsForIdBatches } from "@/lib/supabase/batched-in-filter";
import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { type RunnerProfileSummary } from "@/lib/training";
import {
  resolveWeekdayRestInvariant,
  validateWorkoutsAgainstWeekdayRestInvariant,
} from "@/lib/weekday-rest-invariants";
import { stableJsonEqual } from "@/lib/review-token-signing";

export type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
export type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
export type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];

type ImportedPlanInput = z.infer<typeof importedPlanSchema>;

export type SavedPlanLibraryRecordState = "available" | "removed";
export type SavedPlanLibrarySort = "created_at" | "title";
export type SavedPlanLibrarySortDirection = "asc" | "desc";
export type SavedPlanApplyIntent =
  | "apply_if_future_empty"
  | "replace_future_workouts"
  | "keep_future_workouts";

export interface SavedPlanLibrarySummary {
  id: string;
  title: string;
  goalSummary: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  targetDate: string | null;
  workoutCount: number;
  dayCount: number;
  sourceKind: string | null;
  recordState: SavedPlanLibraryRecordState;
}

export interface SavedPlanLibraryQuery {
  search?: string | null;
  recordState?: SavedPlanLibraryRecordState | "all";
  sourceKind?: string | null;
  sort?: SavedPlanLibrarySort;
  direction?: SavedPlanLibrarySortDirection;
}

export type SavedPlanApplyResult =
  | {
      ok: true;
      status: "applied";
      savedPlanId: string;
      materializedPlanId: string;
      currentDate: string;
      resolvedStartDate: string;
      appliedStartDate: string;
      omittedLeadingDayCount: number;
      replacedFutureWorkoutCount: number;
      calendarRowCount: number;
      workoutCount: number;
      selectedRecordUnchanged: true;
      callsOpenAi: false;
    }
  | {
      ok: false;
      status: "replacement_required" | "not_applied";
      savedPlanId: string;
      futureWorkoutCount: number;
      persisted: false;
      callsOpenAi: false;
    };

export interface EmptyCalendarProvenanceCreationInput {
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

type EmptyCalendarProvenanceCreationResult = PlanApplySuccessResult & {
  planCycle: PersistedPlanCycleRow;
  workouts: [];
};

export type CalendarWorkoutContext = {
  provenancePlan: PersistedPlanCycleRow | null;
  existingWorkouts: {
    workouts: PersistedPlannedWorkoutRow[];
    logsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  };
};

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

export async function materializeFirstReviewedPlanForUser(
  userId: string,
  reviewedPlan: ImportedPlanInput,
  planMetadata: AdditionalPlanPersistenceMetadata | null = null,
  options: { expectedProfileRevision?: number; calendarInstant?: Date } = {},
): Promise<PlanApplySuccessResult> {
  const [calendar, currentDate] = await Promise.all([
    getCalendarWorkoutsWithLogsForUser(userId),
    getRunnerCalendarDateForUserId(userId, options.calendarInstant),
  ]);

  if (calendar.workouts.some((workout) => workout.workout_date >= currentDate)) {
    throw new Error(
      "A first plan can be materialized only when the runner has no upcoming Calendar workouts.",
    );
  }

  const importedSeed = buildReviewedFirstPlanImportedSeed(reviewedPlan);

  await persistNewReviewedPlan({
    userId,
    importedSeed,
    planMetadata,
    currentDate,
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

export async function createEmptyCalendarProvenanceForUser(
  userId: string,
  input: EmptyCalendarProvenanceCreationInput,
): Promise<EmptyCalendarProvenanceCreationResult> {
  const [calendar, currentDate] = await Promise.all([
    getCalendarWorkoutsWithLogsForUser(userId),
    getRunnerCalendarDateForUserId(userId),
  ]);

  if (calendar.workouts.some((workout) => workout.workout_date >= currentDate)) {
    throw new Error("Manual Calendar setup requires no upcoming Calendar workouts.");
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
    currentDate,
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

export async function getLatestMaterializedPlanProvenance(userId: string) {
  const supabase = createAdminSupabaseClient();
  const latest = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .is("saved_plan_payload", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest.error) {
    throw new Error(latest.error.message);
  }

  return latest.data;
}

export async function getPlanRecordForUser(userId: string, planId: string) {
  const supabase = createAdminSupabaseClient();
  const plan = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();

  if (plan.error) {
    throw new Error(plan.error.message);
  }

  return plan.data;
}

export async function getMaterializedPlanProvenancesForUser(
  userId: string,
  planIds: readonly string[],
) {
  const uniquePlanIds = [...new Set(planIds)];
  if (uniquePlanIds.length === 0) {
    return new Map<string, PersistedPlanCycleRow>();
  }

  const supabase = createAdminSupabaseClient();
  const plans = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .is("saved_plan_payload", null)
    .in("id", uniquePlanIds);

  if (plans.error) {
    throw new Error(plans.error.message);
  }

  return new Map(plans.data.map((plan) => [plan.id, plan]));
}

export async function retainReviewedPlanCandidateForUser(input: {
  userId: string;
  canonicalPlan: TrainingPlanV2;
  reviewChecksum: string;
  planMetadata: AdditionalPlanPersistenceMetadata | null;
}) {
  const canonicalPlan = importedPlanSchema.parse(input.canonicalPlan);
  const importedSeed = buildImportedPlanSeed(canonicalPlan);

  return persistReviewedPlanCandidateForUser({
    ...input,
    canonicalPlan,
    importedSeed,
  });
}

export async function retainImportedPlanCandidateForUser(input: {
  userId: string;
  canonicalPlan: TrainingPlanV2;
  reviewChecksum: string;
}) {
  const canonicalPlan = importedPlanSchema.parse(input.canonicalPlan);
  const importedSeed = normalizeConfirmedExternalImportSeed(
    canonicalPlan,
    buildImportedPlanSeed(canonicalPlan),
  );

  return persistReviewedPlanCandidateForUser({
    ...input,
    canonicalPlan,
    importedSeed,
    planMetadata: null,
  });
}

async function persistReviewedPlanCandidateForUser(input: {
  userId: string;
  canonicalPlan: TrainingPlanV2;
  importedSeed: ImportedPlanSeed;
  reviewChecksum: string;
  planMetadata: AdditionalPlanPersistenceMetadata | null;
}) {
  const planId = crypto.randomUUID();
  const plan = buildPlanPersistencePayload(planId, input.importedSeed, input.planMetadata);
  const supabase = createAdminSupabaseClient();
  const inserted = await supabase
    .from("plan_cycles")
    .insert({
      id: planId,
      user_id: input.userId,
      status: "archived",
      title: stringField(plan, "title"),
      goal_summary: stringField(plan, "goal_summary"),
      source_template: stringField(plan, "source_template"),
      schema_version: stringField(plan, "schema_version"),
      source_kind: optionalStringField(plan, "source_kind"),
      start_date: stringField(plan, "start_date"),
      end_date: stringField(plan, "end_date"),
      target_date: optionalStringField(plan, "target_date"),
      goal_metadata: jsonField(plan, "goal_metadata"),
      plan_preferences: jsonField(plan, "plan_preferences"),
      saved_plan_payload: input.canonicalPlan as unknown as Json,
      saved_plan_review_checksum: input.reviewChecksum,
      library_removed_at: null,
    })
    .select("*")
    .single();

  if (!inserted.error) {
    return inserted.data;
  }

  if (inserted.error.code !== "23505") {
    throw new Error(inserted.error.message);
  }

  const existing = await getSavedPlanRecordByReviewChecksumForUser(
    input.userId,
    input.reviewChecksum,
  );
  if (!existing || !stableJsonEqual(existing.saved_plan_payload, input.canonicalPlan)) {
    throw new Error("The reviewed saved-plan candidate conflicts with an existing record.");
  }

  return existing;
}

export async function getSavedPlanRecordForUser(userId: string, savedPlanId: string) {
  const supabase = createAdminSupabaseClient();
  const record = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("id", savedPlanId)
    .eq("user_id", userId)
    .not("saved_plan_payload", "is", null)
    .maybeSingle();

  if (record.error) {
    throw new Error(record.error.message);
  }

  return record.data;
}

export async function listSavedPlanLibraryForUser(
  userId: string,
  input: SavedPlanLibraryQuery = {},
): Promise<SavedPlanLibrarySummary[]> {
  const supabase = createAdminSupabaseClient();
  const records = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .not("saved_plan_payload", "is", null);

  if (records.error) {
    throw new Error(records.error.message);
  }

  const search = input.search?.trim().toLocaleLowerCase() ?? "";
  const recordState = input.recordState ?? "available";
  const sourceKind = input.sourceKind?.trim() || null;
  const direction = input.direction ?? (input.sort === "title" ? "asc" : "desc");

  return records.data
    .map(buildSavedPlanLibrarySummary)
    .filter((record) => recordState === "all" || record.recordState === recordState)
    .filter((record) => !sourceKind || record.sourceKind === sourceKind)
    .filter(
      (record) =>
        !search ||
        record.title.toLocaleLowerCase().includes(search) ||
        record.goalSummary.toLocaleLowerCase().includes(search),
    )
    .sort((left, right) => {
      const comparison =
        input.sort === "title"
          ? left.title.localeCompare(right.title) || left.createdAt.localeCompare(right.createdAt)
          : left.createdAt.localeCompare(right.createdAt) || left.title.localeCompare(right.title);
      return direction === "asc" ? comparison : -comparison;
    });
}

export async function logicallyRemoveSavedPlanRecordForUser(userId: string, savedPlanId: string) {
  const supabase = createAdminSupabaseClient();
  const removedAt = new Date().toISOString();
  const removed = await supabase
    .from("plan_cycles")
    .update({ library_removed_at: removedAt })
    .eq("id", savedPlanId)
    .eq("user_id", userId)
    .not("saved_plan_payload", "is", null)
    .is("library_removed_at", null)
    .select("*")
    .maybeSingle();

  if (removed.error) {
    throw new Error(removed.error.message);
  }

  if (removed.data) {
    return buildSavedPlanLibrarySummary(removed.data);
  }

  const existing = await getSavedPlanRecordForUser(userId, savedPlanId);
  if (!existing) {
    throw new Error("The selected saved plan was not found.");
  }

  return buildSavedPlanLibrarySummary(existing);
}

export async function applySavedPlanRecordForUser(
  userId: string,
  savedPlanId: string,
  intent: SavedPlanApplyIntent,
  scheduleOptions: SavedPlanStartScheduleOptions = {},
): Promise<SavedPlanApplyResult> {
  const selectedRecord = await getSavedPlanRecordForUser(userId, savedPlanId);
  if (!selectedRecord) {
    throw new Error("The selected saved plan was not found.");
  }

  const canonicalPlan = readSavedPlanPayload(selectedRecord);
  const currentDate = await getRunnerCalendarDateForUserId(userId);
  const calendar = await getCalendarWorkoutsWithLogsForUser(userId);
  const futureWorkouts = calendar.workouts.filter((workout) => workout.workout_date >= currentDate);

  if (intent === "keep_future_workouts") {
    return {
      ok: false,
      status: "not_applied",
      savedPlanId,
      futureWorkoutCount: futureWorkouts.length,
      persisted: false,
      callsOpenAi: false,
    };
  }

  if (futureWorkouts.length > 0 && intent !== "replace_future_workouts") {
    return {
      ok: false,
      status: "replacement_required",
      savedPlanId,
      futureWorkoutCount: futureWorkouts.length,
      persisted: false,
      callsOpenAi: false,
    };
  }

  const currentProfile = await getCurrentRunnerProfileForPlanApply(userId);
  const prepared = prepareSavedPlanFutureApplyPolicy(
    canonicalPlan,
    currentDate,
    currentProfile.training_preferences,
    scheduleOptions,
  );
  const materializedPlanId = crypto.randomUUID();
  const workoutRows = buildPersistedWorkoutRows(materializedPlanId, userId, prepared.importedSeed);
  const planMetadata: AdditionalPlanPersistenceMetadata = {
    goalMetadata: mergePlanPersistenceMetadata(selectedRecord.goal_metadata, {
      saved_plan_record_id: selectedRecord.id,
      saved_plan_review_checksum: selectedRecord.saved_plan_review_checksum,
    }),
  };
  const persisted = await applyAtomicReviewedFutureSchedulePersistence({
    userId,
    plan: buildPlanPersistencePayload(materializedPlanId, prepared.importedSeed, planMetadata),
    workouts: workoutRows as unknown as Json,
    currentDate,
    replaceFutureWorkouts: intent === "replace_future_workouts",
  });
  const selectedRecordAfterApply = await getSavedPlanRecordForUser(userId, savedPlanId);

  if (!selectedRecordAfterApply || !stableJsonEqual(selectedRecordAfterApply, selectedRecord)) {
    throw new Error("Applying the selected saved plan changed its immutable library record.");
  }

  return {
    ok: true,
    status: "applied",
    savedPlanId,
    materializedPlanId: persisted.planCycle.id,
    currentDate,
    resolvedStartDate: prepared.resolvedStartDate,
    appliedStartDate: prepared.appliedStartDate,
    omittedLeadingDayCount: prepared.omittedLeadingDayCount,
    replacedFutureWorkoutCount: futureWorkouts.length,
    calendarRowCount: prepared.importedSeed.workouts.length,
    workoutCount: prepared.workoutCount,
    selectedRecordUnchanged: true,
    callsOpenAi: false,
  };
}

export async function getCalendarWorkoutMutationContext(
  userId: string,
): Promise<CalendarWorkoutContext> {
  return {
    provenancePlan: await getLatestMaterializedPlanProvenance(userId),
    existingWorkouts: await getCalendarWorkoutsWithLogsForUser(userId),
  };
}

async function persistNewReviewedPlan(input: {
  userId: string;
  importedSeed: ImportedPlanSeed;
  planMetadata: AdditionalPlanPersistenceMetadata | null;
  currentDate: string;
  expectedProfileRevision?: number;
}) {
  const planId = crypto.randomUUID();
  const workoutRows = buildPersistedWorkoutRows(planId, input.userId, input.importedSeed);

  return applyAtomicReviewedPlanPersistence({
    userId: input.userId,
    profile: buildProfilePersistencePayload(input.importedSeed.profile),
    plan: buildPlanPersistencePayload(planId, input.importedSeed, input.planMetadata),
    workouts: workoutRows as unknown as Json,
    currentDate: input.currentDate,
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

export function readSavedPlanPayload(record: PersistedPlanCycleRow): ImportedPlanInput {
  const parsed = importedPlanSchema.safeParse(record.saved_plan_payload);
  if (!parsed.success) {
    throw new Error("The selected saved plan payload is invalid.");
  }

  return parsed.data;
}

function buildSavedPlanLibrarySummary(record: PersistedPlanCycleRow): SavedPlanLibrarySummary {
  const canonicalPlan = readSavedPlanPayload(record);
  const workouts = canonicalPlan.planned_workouts;

  return {
    id: record.id,
    title: record.title,
    goalSummary: record.goal_summary,
    createdAt: record.created_at,
    startDate: record.start_date,
    endDate: record.end_date,
    targetDate: record.target_date,
    workoutCount: workouts.filter((workout) => workout.workout_type !== "rest").length,
    dayCount: workouts.length,
    sourceKind: record.source_kind,
    recordState: record.library_removed_at ? "removed" : "available",
  };
}

export async function getSavedPlanRecordByReviewChecksumForUser(
  userId: string,
  reviewChecksum: string,
) {
  const supabase = createAdminSupabaseClient();
  const record = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("saved_plan_review_checksum", reviewChecksum)
    .maybeSingle();

  if (record.error) {
    throw new Error(record.error.message);
  }

  return record.data;
}

async function getCurrentRunnerProfileForPlanApply(userId: string) {
  const supabase = createAdminSupabaseClient();
  const profile = await supabase
    .from("runner_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile.error) {
    throw new Error(profile.error.message);
  }

  if (!profile.data) {
    throw new Error("Save runner settings before applying a saved plan.");
  }

  return profile.data;
}

function jsonObject(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Plan persistence metadata is invalid.");
  }

  return value;
}

function stringField(value: Json, key: string) {
  const field = jsonObject(value)[key];
  if (typeof field !== "string" || !field) {
    throw new Error(`Plan persistence metadata is missing ${key}.`);
  }

  return field;
}

function optionalStringField(value: Json, key: string) {
  const field = jsonObject(value)[key];
  return typeof field === "string" && field ? field : null;
}

function jsonField(value: Json, key: string): Json | null {
  return jsonObject(value)[key] ?? null;
}

function buildPersistedWorkoutRows(planId: string, userId: string, seed: ImportedPlanSeed) {
  return buildPersistedWorkoutInsertRows(planId, userId, seed.workouts).map((workout) => ({
    ...workout,
    id: crypto.randomUUID(),
  }));
}

export async function getCalendarWorkoutsWithLogsForUser(
  userId: string,
): Promise<CalendarWorkoutContext["existingWorkouts"]> {
  const supabase = createAdminSupabaseClient();
  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  const workouts = workoutsResult.data as PersistedPlannedWorkoutRow[];
  const workoutIds = workouts.map((workout) => workout.id);
  const logs = await collectRowsForIdBatches<PersistedWorkoutLogRow>(
    workoutIds,
    async (ids) => await supabase.from("workout_logs").select("*").in("planned_workout_id", ids),
  );

  return {
    workouts,
    logsByWorkoutId: new Map(logs.map((log) => [log.planned_workout_id, log])),
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
  _planCycle: PersistedPlanCycleRow,
) {
  return getCalendarWorkoutsWithLogsForUser(userId);
}
