import {
  ACTIVE_PLAN_USER_EDIT_MUTATION_KIND,
  type ActivePlanUserEditMutationKind,
  buildActivePlanUserEditMetadata,
  appendActivePlanUserEditMetadataToRecord,
  resolveActivePlanWorkoutEditability,
} from "@/lib/active-plan-workout-editing/policy";
import {
  getExistingPlanContext,
  type ExistingPlanContext,
  type PersistedPlanCycleRow,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import {
  buildImportedPlanSeed,
  type ImportedPlanSeed,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
  MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
  type ManualWorkoutAddToActivePlanFailureReason,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutCanonicalDraft,
  type ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring/schema";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { diffDaysIso, todayIso } from "@/lib/training";

export type ManualWorkoutEvidenceFetcher = (
  userId: string,
  workoutIds: string[],
) => Promise<Set<string>>;

export interface ReviewedManualWorkoutForActivePlanAdd {
  draft: ManualWorkoutCanonicalDraft;
  canonicalPlan: TrainingPlanV2;
  reviewChecksum: string;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  reviewWarnings: string[];
  activePlanUserEdit?: ManualWorkoutActivePlanUserEditAuditInput;
}

export interface ManualWorkoutActivePlanAddDependencies {
  getExistingPlanContextForUser?: typeof getExistingPlanContext;
  fetchEvidenceWorkoutIds?: ManualWorkoutEvidenceFetcher;
  persistWorkoutAdd?: typeof persistManualWorkoutActivePlanAdd;
  currentDate?: string;
}

interface ManualWorkoutAuthoringReviewMetadata {
  source_kind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
  source_status: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS;
  template_key: string;
  template_version: "manual_workout_template_registry_v1";
  workout_date: string;
  review_payload_version: typeof MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION;
  review_checksum: string;
  metric_truth_mode: ManualWorkoutTargetTruthMode;
  mapping_gaps: string[];
  warnings: string[];
  user_edit_mutation_kind?: ActivePlanUserEditMutationKind;
  user_edit_mutation_mode?: "direct_manual_edit";
  user_edit_mutation_payload_version?: string;
  user_edit_mutation_checksum?: string;
  user_edit_source_workout_id?: string;
  user_edit_source_workout_date?: string;
  user_edit_trusted_client_rows?: boolean;
}

interface ManualWorkoutActivePlanUserEditAuditInput {
  mutationKind?: ActivePlanUserEditMutationKind;
  mutationMode?: "direct_manual_edit";
  mutationPayloadVersion?: string;
  mutationChecksum?: string;
  sourceWorkoutId?: string;
  sourceWorkoutDate?: string;
  trustedClientRows?: boolean;
}

interface PersistManualWorkoutActivePlanAddInput {
  userId: string;
  activePlan: PersistedPlanCycleRow;
  existingWorkouts: readonly PersistedPlannedWorkoutRow[];
  workoutSeed: ImportedPlanSeed["workouts"][number];
  reviewMetadata: ManualWorkoutAuthoringReviewMetadata;
}

export async function addReviewedManualWorkoutToActivePlanForUser(
  userId: string,
  reviewed: ReviewedManualWorkoutForActivePlanAdd,
  dependencies: ManualWorkoutActivePlanAddDependencies = {},
  expectedActivePlanId?: string | null,
): Promise<ManualWorkoutAddToActivePlanResult> {
  const getContext = dependencies.getExistingPlanContextForUser ?? getExistingPlanContext;
  const fetchEvidence =
    dependencies.fetchEvidenceWorkoutIds ?? fetchManualWorkoutEvidenceWorkoutIds;
  const persistAdd = dependencies.persistWorkoutAdd ?? persistManualWorkoutActivePlanAdd;
  const currentDate = dependencies.currentDate ?? todayIso();

  let planContext: ExistingPlanContext;
  try {
    planContext = await getContext(userId);
  } catch {
    return buildManualWorkoutAddFailure({
      reason: "persistence_failed",
      message:
        "The manual plan could not verify the current active-plan state. Try again before adding a workout.",
    });
  }

  const activePlan = planContext.activePlan;
  if (!activePlan) {
    return buildManualWorkoutAddFailure({
      reason: "no_active_plan",
      message: "Create or open an active plan before adding another workout.",
    });
  }

  if (expectedActivePlanId && activePlan.id !== expectedActivePlanId) {
    return buildManualWorkoutAddFailure({
      reason: "stale_review",
      message:
        "The active manual plan changed. Refresh the calendar and review this workout again.",
    });
  }

  const editability = resolveActivePlanWorkoutEditability(activePlan, "add_workout");
  if (!editability.ok) {
    return buildManualWorkoutAddFailure({
      reason:
        editability.reason === "unsupported_source_metadata"
          ? "unsupported_source_metadata"
          : "unsupported_active_plan_source",
      message: editability.message,
    });
  }

  if (reviewed.draft.workoutType === "rest") {
    return buildManualWorkoutAddFailure({
      reason: "manual_workout_required",
      message:
        "This add-workout action saves reviewed workouts only. Rest-day editing is separate.",
    });
  }

  if (reviewed.draft.workoutDate <= currentDate) {
    return buildManualWorkoutAddFailure({
      reason: "protected_day",
      message:
        "Manual workout additions can only target future empty days. Past and current days stay protected.",
    });
  }

  if (reviewed.draft.workoutDate < activePlan.start_date) {
    return buildManualWorkoutAddFailure({
      reason: "protected_day",
      message: "This manual plan cannot add workouts before its current start date in this slice.",
    });
  }

  const targetDateWorkouts = planContext.existingWorkouts.workouts.filter(
    (workout) => workout.workout_date === reviewed.draft.workoutDate,
  );

  if (targetDateWorkouts.length > 0) {
    const evidenceIds = await fetchEvidence(
      userId,
      targetDateWorkouts.map((workout) => workout.id),
    );
    const protectedTarget = targetDateWorkouts.some((workout) =>
      isProtectedManualWorkoutTarget(
        workout,
        currentDate,
        planContext.existingWorkouts.logsByWorkoutId,
        evidenceIds,
      ),
    );

    return buildManualWorkoutAddFailure({
      reason: protectedTarget ? "protected_day" : "occupied_day",
      message: protectedTarget
        ? "This day already has protected workout history or evidence and cannot be changed here."
        : "This day already has a planned workout. Choose an empty day before adding another workout.",
    });
  }

  const reviewMetadata = buildManualWorkoutAuthoringReviewMetadata(reviewed);
  const workoutSeed = buildManualWorkoutSeedForActivePlanAdd({
    activePlan,
    existingWorkouts: planContext.existingWorkouts.workouts,
    reviewed,
  });

  try {
    const persisted = await persistAdd({
      userId,
      activePlan,
      existingWorkouts: planContext.existingWorkouts.workouts,
      workoutSeed,
      reviewMetadata,
    });
    const calendarRowCount = planContext.existingWorkouts.workouts.length + 1;
    const nonRestWorkoutCount =
      planContext.existingWorkouts.workouts.filter((workout) => workout.workout_type !== "rest")
        .length + 1;

    return {
      ok: true,
      status: "created",
      persisted: true,
      sourceKind: editability.sourceKind,
      sourceStatus: editability.sourceStatus,
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      workoutSourceStatus: MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
      activePlanId: activePlan.id,
      plannedWorkoutId: persisted.plannedWorkout.id,
      workoutDate: reviewed.draft.workoutDate,
      templateKey: reviewed.draft.templateKey,
      reviewChecksum: reviewed.reviewChecksum,
      exactnessPayloadVersion: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
      calendarRowCount,
      nonRestWorkoutCount,
      sourceMetadata: {
        editSourceKind: "active_plan_user_edit_v1",
        mutationKind:
          reviewMetadata.user_edit_mutation_kind ?? ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.addWorkout,
        originalPlanSourceKind: editability.sourceKind,
        originalPlanSourceStatus: editability.sourceStatus,
        mutationMode: reviewMetadata.user_edit_mutation_mode,
        mutationPayloadVersion: reviewMetadata.user_edit_mutation_payload_version,
        mutationChecksum:
          reviewMetadata.user_edit_mutation_checksum ?? reviewMetadata.review_checksum,
        sourceWorkoutId: reviewMetadata.user_edit_source_workout_id,
        sourceWorkoutDate: reviewMetadata.user_edit_source_workout_date,
        targetWorkoutId: persisted.plannedWorkout.id,
        templateKey: reviewed.draft.templateKey,
        workoutDate: reviewed.draft.workoutDate,
        reviewChecksum: reviewed.reviewChecksum,
        metricTruthMode: reviewed.targetTruthMode,
        mappingGaps: reviewed.draft.mappingGaps,
        warnings: reviewed.reviewWarnings,
      },
      safety: {
        requiresExplicitConfirm: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        targetDayWasEmpty: true,
        activePlanSourceVerified: true,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildManualWorkoutAddFailure({
      reason: "persistence_failed",
      message: "The workout could not be added. The active manual plan is unchanged.",
    });
  }
}

export async function persistManualWorkoutActivePlanAdd({
  userId,
  activePlan,
  existingWorkouts,
  workoutSeed,
  reviewMetadata,
}: PersistManualWorkoutActivePlanAddInput) {
  const supabase = createAdminSupabaseClient();
  const [insertRow] = buildPersistedWorkoutInsertRows(activePlan.id, userId, [workoutSeed]);

  if (!insertRow) {
    throw new Error("Manual workout add did not prepare a planned workout row.");
  }

  const insert = await supabase.from("planned_workouts").insert(insertRow).select("*").single();

  if (insert.error || !insert.data) {
    throw new Error(insert.error?.message ?? "Manual workout add insert failed.");
  }

  const nextEndDate =
    workoutSeed.workoutDate > activePlan.end_date ? workoutSeed.workoutDate : activePlan.end_date;
  const nextGoalMetadata = buildManualWorkoutAddGoalMetadata({
    activePlan,
    existingGoalMetadata: activePlan.goal_metadata,
    existingWorkouts,
    plannedWorkoutId: insert.data.id,
    reviewMetadata,
    addedWorkoutType: workoutSeed.workoutType,
  });
  const nextPlanPreferences = buildManualWorkoutAddPlanPreferences({
    activePlan,
    existingPlanPreferences: activePlan.plan_preferences,
    plannedWorkoutId: insert.data.id,
    reviewMetadata,
  });

  const update = await supabase
    .from("plan_cycles")
    .update({
      end_date: nextEndDate,
      goal_metadata: nextGoalMetadata,
      plan_preferences: nextPlanPreferences,
    })
    .eq("id", activePlan.id)
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("source_kind", activePlan.source_kind)
    .select("*")
    .single();

  if (update.error || !update.data) {
    await supabase.from("planned_workouts").delete().eq("id", insert.data.id);
    throw new Error(update.error?.message ?? "Manual workout add metadata update failed.");
  }

  return {
    plannedWorkout: insert.data,
    planCycle: update.data,
  };
}

export async function fetchManualWorkoutEvidenceWorkoutIds(userId: string, workoutIds: string[]) {
  if (workoutIds.length === 0) {
    return new Set<string>();
  }

  const supabase = createAdminSupabaseClient();
  const [assetsResult, actualMetricsResult, comparisonsResult, insightsResult] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_actual_metrics")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_comparisons")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_ai_insights")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
  ]);

  if (assetsResult.error) throw new Error(assetsResult.error.message);
  if (actualMetricsResult.error) throw new Error(actualMetricsResult.error.message);
  if (comparisonsResult.error) throw new Error(comparisonsResult.error.message);
  if (insightsResult.error) throw new Error(insightsResult.error.message);

  return new Set([
    ...(assetsResult.data ?? []).map((row) => row.planned_workout_id),
    ...(actualMetricsResult.data ?? []).map((row) => row.planned_workout_id),
    ...(comparisonsResult.data ?? []).map((row) => row.planned_workout_id),
    ...(insightsResult.data ?? []).map((row) => row.planned_workout_id),
  ]);
}

function buildManualWorkoutSeedForActivePlanAdd({
  activePlan,
  existingWorkouts,
  reviewed,
}: {
  activePlan: PersistedPlanCycleRow;
  existingWorkouts: readonly PersistedPlannedWorkoutRow[];
  reviewed: ReviewedManualWorkoutForActivePlanAdd;
}): ImportedPlanSeed["workouts"][number] {
  const [seedWorkout] = buildImportedPlanSeed(reviewed.canonicalPlan).workouts;

  if (!seedWorkout) {
    throw new Error("Manual workout add requires one reviewed workout seed.");
  }

  return {
    ...seedWorkout,
    weekNumber: resolveManualWorkoutWeekNumber(activePlan.start_date, seedWorkout.workoutDate),
    displayOrder: resolveNextDisplayOrder(existingWorkouts),
  };
}

function resolveManualWorkoutWeekNumber(planStartDate: string, workoutDate: string) {
  return Math.floor(diffDaysIso(workoutDate, planStartDate) / 7) + 1;
}

function resolveNextDisplayOrder(existingWorkouts: readonly PersistedPlannedWorkoutRow[]) {
  if (existingWorkouts.length === 0) {
    return 0;
  }

  return Math.max(...existingWorkouts.map((workout) => workout.display_order)) + 1;
}

export function isProtectedManualWorkoutTarget(
  workout: PersistedPlannedWorkoutRow,
  currentDate: string,
  logsByWorkoutId: Map<string, PersistedWorkoutLogRow>,
  evidenceWorkoutIds: Set<string>,
) {
  return (
    workout.workout_date <= currentDate ||
    logsByWorkoutId.has(workout.id) ||
    evidenceWorkoutIds.has(workout.id)
  );
}

function buildManualWorkoutAuthoringReviewMetadata(
  reviewed: ReviewedManualWorkoutForActivePlanAdd,
): ManualWorkoutAuthoringReviewMetadata {
  return {
    source_kind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    source_status: MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
    template_key: reviewed.draft.templateKey,
    template_version: "manual_workout_template_registry_v1",
    workout_date: reviewed.draft.workoutDate,
    review_payload_version: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
    review_checksum: reviewed.reviewChecksum,
    metric_truth_mode: reviewed.targetTruthMode,
    mapping_gaps: reviewed.draft.mappingGaps,
    warnings: reviewed.reviewWarnings,
    user_edit_mutation_kind: reviewed.activePlanUserEdit?.mutationKind,
    user_edit_mutation_mode: reviewed.activePlanUserEdit?.mutationMode,
    user_edit_mutation_payload_version: reviewed.activePlanUserEdit?.mutationPayloadVersion,
    user_edit_mutation_checksum: reviewed.activePlanUserEdit?.mutationChecksum,
    user_edit_source_workout_id: reviewed.activePlanUserEdit?.sourceWorkoutId,
    user_edit_source_workout_date: reviewed.activePlanUserEdit?.sourceWorkoutDate,
    user_edit_trusted_client_rows: reviewed.activePlanUserEdit?.trustedClientRows,
  };
}

function buildManualWorkoutAddGoalMetadata({
  activePlan,
  existingGoalMetadata,
  existingWorkouts,
  plannedWorkoutId,
  reviewMetadata,
  addedWorkoutType,
}: {
  activePlan: PersistedPlanCycleRow;
  existingGoalMetadata: Json | null;
  existingWorkouts: readonly PersistedPlannedWorkoutRow[];
  plannedWorkoutId: string;
  reviewMetadata: ManualWorkoutAuthoringReviewMetadata;
  addedWorkoutType: ImportedPlanSeed["workouts"][number]["workoutType"];
}): Json {
  const editMetadata = buildActivePlanUserEditMetadata({
    activePlan,
    mutationKind:
      reviewMetadata.user_edit_mutation_kind ?? ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.addWorkout,
    mutationMode: reviewMetadata.user_edit_mutation_mode,
    mutationPayloadVersion: reviewMetadata.user_edit_mutation_payload_version,
    mutationChecksum: reviewMetadata.user_edit_mutation_checksum ?? reviewMetadata.review_checksum,
    plannedWorkoutId,
    sourceWorkoutId: reviewMetadata.user_edit_source_workout_id,
    sourceWorkoutDate: reviewMetadata.user_edit_source_workout_date,
    targetWorkoutId: plannedWorkoutId,
    reviewChecksum: reviewMetadata.review_checksum,
    reviewPayloadVersion: reviewMetadata.review_payload_version,
    targetDate: reviewMetadata.workout_date,
    templateKey: reviewMetadata.template_key,
    title: null,
    trustedClientRows: reviewMetadata.user_edit_trusted_client_rows,
    workoutAuthoringSourceKind: reviewMetadata.source_kind,
  });
  const root = appendActivePlanUserEditMetadataToRecord(
    asJsonRecord(existingGoalMetadata),
    editMetadata,
  );
  const manualPlan = asJsonRecord(root.manual_user_built_plan);
  const calendarRowCount = existingWorkouts.length + 1;
  const nonRestRowCount =
    existingWorkouts.filter((workout) => workout.workout_type !== "rest").length +
    (addedWorkoutType === "rest" ? 0 : 1);

  const nextRoot =
    activePlan.source_kind === MANUAL_USER_BUILT_PLAN_SOURCE_KIND
      ? {
          ...root,
          source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
          manual_user_built_plan: {
            ...manualPlan,
            source_kind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
            source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
            workout_authoring_source_kind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
            workout_authoring_source_status: MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
            row_count: calendarRowCount,
            non_rest_row_count: nonRestRowCount,
            latest_review_payload_version: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
            latest_review_checksum: reviewMetadata.review_checksum,
            latest_added_workout: reviewMetadata,
          },
        }
      : root;

  return toJson(nextRoot);
}

function buildManualWorkoutAddPlanPreferences({
  activePlan,
  existingPlanPreferences,
  plannedWorkoutId,
  reviewMetadata,
}: {
  activePlan: PersistedPlanCycleRow;
  existingPlanPreferences: Json | null;
  plannedWorkoutId: string;
  reviewMetadata: ManualWorkoutAuthoringReviewMetadata;
}): Json {
  const editMetadata = buildActivePlanUserEditMetadata({
    activePlan,
    mutationKind:
      reviewMetadata.user_edit_mutation_kind ?? ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.addWorkout,
    mutationMode: reviewMetadata.user_edit_mutation_mode,
    mutationPayloadVersion: reviewMetadata.user_edit_mutation_payload_version,
    mutationChecksum: reviewMetadata.user_edit_mutation_checksum ?? reviewMetadata.review_checksum,
    plannedWorkoutId,
    sourceWorkoutId: reviewMetadata.user_edit_source_workout_id,
    sourceWorkoutDate: reviewMetadata.user_edit_source_workout_date,
    targetWorkoutId: plannedWorkoutId,
    reviewChecksum: reviewMetadata.review_checksum,
    reviewPayloadVersion: reviewMetadata.review_payload_version,
    targetDate: reviewMetadata.workout_date,
    templateKey: reviewMetadata.template_key,
    title: null,
    trustedClientRows: reviewMetadata.user_edit_trusted_client_rows,
    workoutAuthoringSourceKind: reviewMetadata.source_kind,
  });
  const root = appendActivePlanUserEditMetadataToRecord(
    asJsonRecord(existingPlanPreferences),
    editMetadata,
  );
  const reviewHistory = Array.isArray(root.manual_workout_authoring_reviews)
    ? root.manual_workout_authoring_reviews
    : [];

  if (activePlan.source_kind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND) {
    return toJson(root);
  }

  return toJson({
    ...root,
    manual_workout_authoring_review: reviewMetadata,
    manual_workout_authoring_reviews: [...reviewHistory, reviewMetadata],
  });
}

function buildManualWorkoutAddFailure(input: {
  reason: ManualWorkoutAddToActivePlanFailureReason;
  message: string;
}): Extract<ManualWorkoutAddToActivePlanResult, { ok: false }> {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: input.reason,
    message: input.message,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  };
}

function asJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
