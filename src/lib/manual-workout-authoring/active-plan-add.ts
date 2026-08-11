import {
  ACTIVE_PLAN_USER_EDIT_MUTATION_KIND,
  type ActivePlanUserEditMutationKind,
  resolveCalendarWorkoutEditability,
} from "@/lib/active-plan-workout-editing/policy";
import {
  getCalendarWorkoutMutationContext,
  type CalendarWorkoutContext,
  type PersistedPlanCycleRow,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import {
  CalendarPersistenceRejection,
  applyAtomicCalendarWorkoutMutation,
} from "@/lib/active-plan-lifecycle-persistence";
import {
  buildImportedPlanSeed,
  type ImportedPlanSeed,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
  MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
  type ManualWorkoutAddToActivePlanFailureReason,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutCanonicalDraft,
  type ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring/schema";
import { buildSourceWorkoutFingerprint } from "@/lib/manual-workout-authoring/edit-workout-review-token";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import { collectRowsForIdBatches } from "@/lib/supabase/batched-in-filter";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { diffDaysIso } from "@/lib/training";

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
  getCalendarWorkoutContextForUser?: typeof getCalendarWorkoutMutationContext;
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
  user_edit_mutation_kind?: Extract<
    ActivePlanUserEditMutationKind,
    "user_added_workout" | "user_copied_workout"
  >;
  user_edit_mutation_mode?: "direct_manual_edit";
  user_edit_mutation_payload_version?: string;
  user_edit_mutation_checksum?: string;
  user_edit_source_workout_id?: string;
  user_edit_source_workout_date?: string;
  user_edit_trusted_client_rows?: boolean;
}

interface ManualWorkoutActivePlanUserEditAuditInput {
  mutationKind?: Extract<
    ActivePlanUserEditMutationKind,
    "user_added_workout" | "user_copied_workout"
  >;
  mutationMode?: "direct_manual_edit";
  mutationPayloadVersion?: string;
  mutationChecksum?: string;
  sourceWorkoutId?: string;
  sourceWorkoutDate?: string;
  trustedClientRows?: boolean;
}

interface PersistManualWorkoutActivePlanAddInput {
  userId: string;
  currentDate: string;
  activePlan: PersistedPlanCycleRow;
  existingWorkouts: readonly PersistedPlannedWorkoutRow[];
  workoutSeed: ImportedPlanSeed["workouts"][number];
  reviewMetadata: ManualWorkoutAuthoringReviewMetadata;
  copySourceWorkout: PersistedPlannedWorkoutRow | null;
}

export async function addReviewedManualWorkoutToActivePlanForUser(
  userId: string,
  reviewed: ReviewedManualWorkoutForActivePlanAdd,
  dependencies: ManualWorkoutActivePlanAddDependencies = {},
): Promise<ManualWorkoutAddToActivePlanResult> {
  const getContext =
    dependencies.getCalendarWorkoutContextForUser ?? getCalendarWorkoutMutationContext;
  const fetchEvidence =
    dependencies.fetchEvidenceWorkoutIds ?? fetchManualWorkoutEvidenceWorkoutIds;
  const persistAdd = dependencies.persistWorkoutAdd ?? persistManualWorkoutActivePlanAdd;
  const currentDate = dependencies.currentDate ?? (await getRunnerCalendarDateForUserId(userId));

  let planContext: CalendarWorkoutContext;
  try {
    planContext = await getContext(userId);
  } catch {
    return buildManualWorkoutAddFailure({
      reason: "persistence_failed",
      message: "The Calendar could not verify its persisted workout context.",
    });
  }

  const activePlan = planContext.provenancePlan;
  if (!activePlan) {
    return buildManualWorkoutAddFailure({
      reason: "no_active_plan",
      message: "Create the runner Calendar before adding another workout.",
    });
  }

  const editability = resolveCalendarWorkoutEditability(activePlan, "add_workout");
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

  if (reviewed.draft.workoutDate < currentDate) {
    return buildManualWorkoutAddFailure({
      reason: "protected_day",
      message:
        "Manual workout additions can target today or future available Rest days. Past days stay protected.",
    });
  }

  const targetDateWorkouts = planContext.existingWorkouts.workouts.filter(
    (workout) => workout.workout_date === reviewed.draft.workoutDate,
  );
  const isCopyMutation =
    reviewed.activePlanUserEdit?.mutationKind === ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.copyWorkout;
  const copySourceWorkout = isCopyMutation
    ? (planContext.existingWorkouts.workouts.find(
        (workout) =>
          workout.id === reviewed.activePlanUserEdit?.sourceWorkoutId &&
          workout.workout_date === reviewed.activePlanUserEdit?.sourceWorkoutDate,
      ) ?? null)
    : null;

  if (isCopyMutation && !copySourceWorkout) {
    return buildManualWorkoutAddFailure({
      reason: "stale_review",
      message: "The copied source workout changed. Refresh the calendar and copy it again.",
    });
  }

  const guardedWorkoutIds = targetDateWorkouts.map((workout) => workout.id);
  const evidenceIds =
    guardedWorkoutIds.length > 0
      ? await fetchEvidence(userId, guardedWorkoutIds)
      : new Set<string>();

  if (targetDateWorkouts.length > 0) {
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
        : "This day already has a planned workout. Choose a truly empty date.",
    });
  }

  const retainedExistingWorkouts = planContext.existingWorkouts.workouts;

  const reviewMetadata = buildManualWorkoutAuthoringReviewMetadata(reviewed);
  const workoutSeed = buildManualWorkoutSeedForActivePlanAdd({
    activePlan,
    existingWorkouts: retainedExistingWorkouts,
    reviewed,
  });

  try {
    const persisted = await persistAdd({
      userId,
      currentDate,
      activePlan,
      existingWorkouts: planContext.existingWorkouts.workouts,
      workoutSeed,
      reviewMetadata,
      copySourceWorkout,
    });
    const calendarRowCount = retainedExistingWorkouts.length + 1;
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
        targetDayKind: "empty_day",
        activePlanSourceVerified: true,
        callsOpenAi: false,
      },
    };
  } catch (error) {
    if (error instanceof CalendarPersistenceRejection) {
      return buildManualWorkoutAddFailure({
        reason:
          error.reason === "stale_review" || error.reason === "protected_day"
            ? error.reason
            : "persistence_failed",
        message: error.message,
      });
    }

    return buildManualWorkoutAddFailure({
      reason: "persistence_failed",
      message: "The workout could not be added. The active manual plan is unchanged.",
    });
  }
}

export async function persistManualWorkoutActivePlanAdd({
  userId,
  currentDate,
  activePlan,
  workoutSeed,
  copySourceWorkout,
}: PersistManualWorkoutActivePlanAddInput) {
  const [insertRow] = buildPersistedWorkoutInsertRows(activePlan.id, userId, [workoutSeed]);

  if (!insertRow) {
    throw new Error("Manual workout add did not prepare a planned workout row.");
  }

  const plannedWorkoutId = crypto.randomUUID();
  const workoutInsert = {
    ...insertRow,
    id: plannedWorkoutId,
  };

  const planUpdate = {
    end_date: activePlan.end_date,
    goal_metadata: activePlan.goal_metadata,
    plan_preferences: activePlan.plan_preferences,
  };
  const persisted = await applyAtomicCalendarWorkoutMutation({
    userId,
    planId: activePlan.id,
    expectedPlanUpdatedAt: activePlan.updated_at,
    currentDate,
    mutationKind: "add",
    expectedSourceWorkout: copySourceWorkout
      ? (buildSourceWorkoutFingerprint(copySourceWorkout) as unknown as Json)
      : null,
    expectedTargetWorkout: null,
    workoutInsert: workoutInsert as unknown as Json,
    workoutUpdate: null,
    planUpdate,
  });

  if (!persisted.mutatedWorkout) {
    throw new Error("Atomic manual workout add did not return the inserted workout.");
  }

  return {
    plannedWorkout: persisted.mutatedWorkout,
    planCycle: persisted.planCycle,
  };
}

export async function fetchManualWorkoutEvidenceWorkoutIds(userId: string, workoutIds: string[]) {
  if (workoutIds.length === 0) {
    return new Set<string>();
  }

  const supabase = createAdminSupabaseClient();
  const assets = await collectRowsForIdBatches<{ planned_workout_id: string }>(
    workoutIds,
    async (ids) =>
      await supabase
        .from("workout_result_assets")
        .select("planned_workout_id")
        .eq("user_id", userId)
        .in("planned_workout_id", ids),
  );

  // Metrics, comparisons, and insights all cascade from this canonical evidence root.
  return new Set(assets.map((row) => row.planned_workout_id));
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

export function isProtectedManualWorkoutCopySource(
  workout: PersistedPlannedWorkoutRow,
  currentDate: string,
  logsByWorkoutId: Map<string, PersistedWorkoutLogRow>,
  evidenceWorkoutIds: Set<string>,
) {
  return (
    workout.workout_type === "rest" ||
    workout.workout_date < currentDate ||
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
