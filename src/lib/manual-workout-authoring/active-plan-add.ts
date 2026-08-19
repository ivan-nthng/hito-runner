import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  buildCalendarWorkoutMutationEvent,
  type CalendarWorkoutMutationKind,
} from "@/lib/active-plan-workout-editing/policy";
import {
  getCalendarWorkoutMutationContext,
  type CalendarWorkoutContext,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/runner-calendar-persistence";
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
import { buildFullSourceWorkoutFingerprint } from "@/lib/manual-workout-authoring/edit-workout-review-token";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import { collectRowsForIdBatches } from "@/lib/supabase/batched-in-filter";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";

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
    CalendarWorkoutMutationKind,
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
  mutationKind?: Extract<CalendarWorkoutMutationKind, "user_added_workout" | "user_copied_workout">;
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
    reviewed.activePlanUserEdit?.mutationKind === CALENDAR_WORKOUT_MUTATION_KIND.copyWorkout;
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
    existingWorkouts: retainedExistingWorkouts,
    reviewed,
  });

  try {
    const persisted = await persistAdd({
      userId,
      currentDate,
      workoutSeed,
      reviewMetadata,
      copySourceWorkout,
    });
    const calendarRowCount = retainedExistingWorkouts.length + 1;
    const nonRestWorkoutCount =
      planContext.existingWorkouts.workouts.filter((workout) => workout.workout_type !== "rest")
        .length + (reviewed.draft.workoutType === "rest" ? 0 : 1);

    return {
      ok: true,
      status: "created",
      persisted: true,
      sourceKind: copySourceWorkout?.origin_kind ?? "manual",
      sourceStatus: null,
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      workoutSourceStatus: MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
      activePlanId: copySourceWorkout?.plan_cycle_id ?? null,
      plannedWorkoutId: persisted.plannedWorkout.id,
      workoutDate: reviewed.draft.workoutDate,
      templateKey: reviewed.draft.templateKey,
      reviewChecksum: reviewed.reviewChecksum,
      exactnessPayloadVersion: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
      calendarRowCount,
      nonRestWorkoutCount,
      sourceMetadata: {
        editSourceKind: "calendar_workout_mutation_v1",
        mutationKind:
          reviewMetadata.user_edit_mutation_kind ?? CALENDAR_WORKOUT_MUTATION_KIND.addWorkout,
        originalPlanSourceKind: copySourceWorkout?.origin_kind ?? "manual",
        originalPlanSourceStatus: null,
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
        runnerOwnershipVerified: true,
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
  workoutSeed,
  reviewMetadata,
  copySourceWorkout,
}: PersistManualWorkoutActivePlanAddInput) {
  const sourcePlanId = copySourceWorkout?.plan_cycle_id ?? null;
  const originKind = copySourceWorkout?.origin_kind ?? "manual";
  const [insertRow] = buildPersistedWorkoutInsertRows(
    sourcePlanId,
    userId,
    [workoutSeed],
    originKind,
  );

  if (!insertRow) {
    throw new Error("Manual workout add did not prepare a planned workout row.");
  }

  const plannedWorkoutId = crypto.randomUUID();
  const workoutInsert = {
    ...insertRow,
    id: plannedWorkoutId,
  };

  const mutationEvent = buildCalendarWorkoutMutationEvent({
    mutationKind:
      reviewMetadata.user_edit_mutation_kind ?? CALENDAR_WORKOUT_MUTATION_KIND.addWorkout,
    originKind,
    reviewPayloadVersion: reviewMetadata.review_payload_version,
    reviewChecksum: reviewMetadata.review_checksum,
    workoutAuthoringSourceKind: reviewMetadata.source_kind,
    plannedWorkoutId,
    sourceWorkoutId: reviewMetadata.user_edit_source_workout_id,
    sourceWorkoutDate: reviewMetadata.user_edit_source_workout_date,
    targetWorkoutId: plannedWorkoutId,
    targetDate: workoutSeed.workoutDate,
    templateKey: reviewMetadata.template_key,
    title: workoutSeed.title,
    mutationMode: reviewMetadata.user_edit_mutation_mode,
    mutationPayloadVersion: reviewMetadata.user_edit_mutation_payload_version,
    mutationChecksum: reviewMetadata.user_edit_mutation_checksum ?? reviewMetadata.review_checksum,
    trustedClientRows: false,
    originalPlanSourceKind: copySourceWorkout?.origin_kind ?? "manual",
    originalPlanSourceStatus: null,
    originalWorkoutSourceId: copySourceWorkout?.source_workout_id,
    originalWorkoutSourceType: copySourceWorkout?.source_workout_type,
    originalWorkoutFamily: copySourceWorkout?.workout_family,
    originalWorkoutIdentity: copySourceWorkout?.workout_identity,
  });
  const persisted = await applyAtomicCalendarWorkoutMutation({
    userId,
    currentDate,
    mutationKind: "add",
    expectedSourceWorkout: copySourceWorkout
      ? (buildFullSourceWorkoutFingerprint(copySourceWorkout) as unknown as Json)
      : null,
    expectedTargetWorkout: null,
    workoutInsert: workoutInsert as unknown as Json,
    workoutUpdate: null,
    mutationEvent: mutationEvent as unknown as Json,
  });

  if (!persisted.mutatedWorkout) {
    throw new Error("Atomic manual workout add did not return the inserted workout.");
  }

  return {
    plannedWorkout: persisted.mutatedWorkout,
    mutationEvent: persisted.mutationEvent,
  };
}

export async function fetchManualWorkoutEvidenceWorkoutIds(userId: string, workoutIds: string[]) {
  if (workoutIds.length === 0) {
    return new Set<string>();
  }

  const supabase = createAdminSupabaseClient();
  const assets = await collectRowsForIdBatches<{ planned_workout_id: string | null }>(
    workoutIds,
    async (ids) =>
      await supabase
        .from("workout_result_assets")
        .select("planned_workout_id")
        .eq("user_id", userId)
        .in("planned_workout_id", ids),
  );

  // Metrics, comparisons, and insights all cascade from this canonical evidence root.
  return new Set(
    assets
      .map((row) => row.planned_workout_id)
      .filter((plannedWorkoutId): plannedWorkoutId is string => Boolean(plannedWorkoutId)),
  );
}

function buildManualWorkoutSeedForActivePlanAdd({
  existingWorkouts,
  reviewed,
}: {
  existingWorkouts: readonly PersistedPlannedWorkoutRow[];
  reviewed: ReviewedManualWorkoutForActivePlanAdd;
}): ImportedPlanSeed["workouts"][number] {
  const [seedWorkout] = buildImportedPlanSeed(reviewed.canonicalPlan).workouts;

  if (!seedWorkout) {
    throw new Error("Manual workout add requires one reviewed workout seed.");
  }

  return {
    ...seedWorkout,
    displayOrder: resolveNextDisplayOrder(existingWorkouts),
  };
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
