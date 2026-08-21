import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
  CalendarPersistenceRejection,
  applyAtomicCalendarWorkoutMutation,
  buildCalendarWorkoutMutationEvent,
} from "@/lib/runner-calendar-mutations";
import {
  getCalendarWorkoutMutationContext,
  type CalendarWorkoutContext,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/runner-calendar-persistence";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  type ManualWorkoutActivePlanAddDependencies,
  type ManualWorkoutEvidenceFetcher,
} from "@/lib/manual-workout-authoring/active-plan-add";
import { MANUAL_WORKOUT_AUTHORING_SOURCE_KIND } from "@/lib/manual-workout-authoring/schema";
import { workoutDocumentHasUnsafeMetricTruth } from "@/lib/manual-workout-authoring/persisted-workout-safety";
import { stableJsonEqual } from "@/lib/review-token-signing";
import {
  buildFullCalendarWorkoutFingerprint,
  rejectWorkoutCommandReview,
  reviewWorkoutCommand,
  type ReviewedWorkoutCommandCandidate,
  type WorkoutCommandInput,
  type WorkoutCommandReviewResult,
  WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
} from "@/lib/workout-authoring-review";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import type { Json } from "@/lib/supabase/database";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { normalizePersistedWorkoutDocument, type WorkoutDocument } from "@/lib/workout-document";

type ManualWorkoutDeleteClearFailureReason =
  | "unauthenticated"
  | "invalid_review"
  | "stale_review"
  | "invalid_input"
  | "unsupported_source_metadata"
  | "target_workout_not_found"
  | "target_workout_not_in_active_plan"
  | "target_workout_not_supported"
  | "protected_day"
  | "last_workout_not_deletable"
  | "persistence_failed";

export type ManualWorkoutDeleteClearCommandDependencies = Pick<
  ManualWorkoutActivePlanAddDependencies,
  "getCalendarWorkoutContextForUser" | "currentDate"
> & {
  fetchEvidenceWorkoutIds?: ManualWorkoutEvidenceFetcher;
  persistWorkoutDelete?: typeof persistManualWorkoutDeleteClear;
};

type ManualWorkoutDeleteClearReview = {
  plannedWorkoutId: string;
  workoutDate: string;
  title: string;
  templateKey: string;
  reviewChecksum: string;
};

type ManualWorkoutDeleteClearInput = {
  plannedWorkoutId?: string;
  workoutDate?: string;
};

type ManualWorkoutDeleteClearTarget =
  | {
      ok: true;
      targetWorkout: PersistedPlannedWorkoutRow;
      sourceDocument: WorkoutDocument;
      remainingWorkouts: PersistedPlannedWorkoutRow[];
      review: ManualWorkoutDeleteClearReview;
      currentDate: string;
    }
  | {
      ok: false;
      reason: ManualWorkoutDeleteClearFailureReason;
      message: string;
    };

type PersistManualWorkoutDeleteClearInput = {
  userId: string;
  currentDate: string;
  targetWorkout: PersistedPlannedWorkoutRow;
  remainingWorkouts: readonly PersistedPlannedWorkoutRow[];
  review: ManualWorkoutDeleteClearReview;
};

type CalendarWorkoutDeleteClearCommandInput = Extract<
  WorkoutCommandInput,
  { operation: "delete" | "clear" }
>;

export async function reviewCalendarWorkoutDeleteClearCommandForUser(
  userId: string,
  command: CalendarWorkoutDeleteClearCommandInput,
  dependencies: ManualWorkoutDeleteClearCommandDependencies = {},
): Promise<WorkoutCommandReviewResult> {
  const target = await resolveManualWorkoutDeleteClearTarget(
    userId,
    command.operation === "delete"
      ? { plannedWorkoutId: command.workoutId }
      : { workoutDate: command.workoutDate },
    dependencies,
  );
  if (!target.ok) return rejectDeleteClearCommand(target.reason, target.message);

  const fingerprint = buildFullCalendarWorkoutFingerprint(target.targetWorkout);
  if (
    command.expectedFingerprint !== undefined &&
    !stableJsonEqual(command.expectedFingerprint, fingerprint)
  ) {
    return rejectWorkoutCommandReview(
      "stale_reference",
      "The Calendar workout changed after review. Review this command again.",
      ["command", "expectedFingerprint"],
    );
  }

  return reviewWorkoutCommand({
    command:
      command.operation === "delete"
        ? {
            operation: "delete",
            workoutId: target.targetWorkout.id,
            expectedFingerprint: fingerprint,
          }
        : {
            operation: "clear",
            workoutDate: target.targetWorkout.workout_date,
            expectedFingerprint: fingerprint,
          },
  });
}

export async function executeCalendarWorkoutDeleteClearCommandForUser(
  userId: string,
  candidate: ReviewedWorkoutCommandCandidate,
  dependencies: ManualWorkoutDeleteClearCommandDependencies = {},
): Promise<{ ok: true; result: Json } | { ok: false; reason: string; message: string }> {
  const command = candidate.command;
  if (command.operation !== "delete" && command.operation !== "clear") {
    return {
      ok: false,
      reason: "invalid_review",
      message: "The reviewed command is not Delete or Clear.",
    };
  }

  const target = await resolveManualWorkoutDeleteClearTarget(
    userId,
    command.operation === "delete"
      ? { plannedWorkoutId: command.workoutId }
      : { workoutDate: command.workoutDate },
    dependencies,
  );
  if (!target.ok) return { ok: false, reason: target.reason, message: target.message };
  if (
    !stableJsonEqual(
      command.expectedFingerprint,
      buildFullCalendarWorkoutFingerprint(target.targetWorkout),
    )
  ) {
    return {
      ok: false,
      reason: "stale_review",
      message: "The Calendar workout changed after review. Review this command again.",
    };
  }

  const persistDelete = dependencies.persistWorkoutDelete ?? persistManualWorkoutDeleteClear;
  try {
    const persisted = await persistDelete({
      userId,
      currentDate: target.currentDate,
      targetWorkout: target.targetWorkout,
      remainingWorkouts: target.remainingWorkouts,
      review: { ...target.review, reviewChecksum: candidate.reviewChecksum },
    });
    return {
      ok: true,
      result: {
        operation: command.operation,
        plannedWorkoutId: persisted.deletedWorkout.id,
        workoutDate: persisted.deletedWorkout.workout_date,
        sourceProvenanceUnchanged: true,
        explicitConfirm: true,
      },
    };
  } catch (error) {
    if (error instanceof CalendarPersistenceRejection) {
      return { ok: false, reason: error.reason, message: error.message };
    }
    return {
      ok: false,
      reason: "persistence_failed",
      message: "The workout could not be deleted. The Calendar is unchanged.",
    };
  }
}

function rejectDeleteClearCommand(
  reason: ManualWorkoutDeleteClearFailureReason,
  message: string,
): WorkoutCommandReviewResult {
  const code =
    reason === "target_workout_not_found" || reason === "target_workout_not_in_active_plan"
      ? "not_found"
      : reason === "protected_day" || reason === "target_workout_not_supported"
        ? "protected_operation"
        : reason === "persistence_failed"
          ? "persistence_failed"
          : "invalid_operation";
  return rejectWorkoutCommandReview(code, message, ["command", "delete"]);
}

export async function persistManualWorkoutDeleteClear({
  userId,
  currentDate,
  targetWorkout,
  review,
}: PersistManualWorkoutDeleteClearInput) {
  const mutationEvent = buildCalendarWorkoutMutationEvent({
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.clearWorkout,
    originKind: targetWorkout.origin_kind,
    reviewPayloadVersion: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
    reviewChecksum: review.reviewChecksum,
    workoutAuthoringSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    plannedWorkoutId: targetWorkout.id,
    previousWorkoutDate: targetWorkout.workout_date,
    targetWorkoutId: targetWorkout.id,
    targetDate: targetWorkout.workout_date,
    templateKey: review.templateKey,
    title: review.title,
    originalPlanSourceKind: targetWorkout.origin_kind,
    originalPlanSourceStatus: null,
    originalWorkoutSourceId: targetWorkout.source_workout_id,
    originalWorkoutSourceType: targetWorkout.source_workout_type,
    originalWorkoutFamily: targetWorkout.workout_family,
    originalWorkoutIdentity: targetWorkout.workout_identity,
    trustedClientRows: false,
  });
  const persisted = await applyAtomicCalendarWorkoutMutation({
    userId,
    currentDate,
    mutationKind: "clear",
    expectedSourceWorkout: buildFullCalendarWorkoutFingerprint(targetWorkout) as unknown as Json,
    expectedTargetWorkout: null,
    workoutInsert: null,
    workoutUpdate: null,
    mutationEvent: mutationEvent as unknown as Json,
  });

  if (!persisted.deletedWorkout) {
    throw new Error("Atomic manual workout delete did not return the deleted workout.");
  }

  return {
    deletedWorkout: persisted.deletedWorkout,
    mutationEvent: persisted.mutationEvent,
  };
}

async function resolveManualWorkoutDeleteClearTarget(
  userId: string,
  input: ManualWorkoutDeleteClearInput,
  dependencies: ManualWorkoutDeleteClearCommandDependencies,
): Promise<ManualWorkoutDeleteClearTarget> {
  const getContext =
    dependencies.getCalendarWorkoutContextForUser ?? getCalendarWorkoutMutationContext;
  const fetchEvidence =
    dependencies.fetchEvidenceWorkoutIds ?? fetchManualWorkoutEvidenceWorkoutIds;
  const currentDate = dependencies.currentDate ?? (await getRunnerCalendarDateForUserId(userId));

  let planContext: CalendarWorkoutContext;
  try {
    planContext = await getContext(userId);
  } catch {
    return {
      ok: false,
      reason: "persistence_failed",
      message: "The Calendar could not verify the current runner-owned workout state.",
    };
  }

  const target = resolveDeleteTargetWorkout({
    userId,
    workouts: planContext.existingWorkouts.workouts,
    plannedWorkoutId: input.plannedWorkoutId,
    workoutDate: input.workoutDate,
  });

  if (!target.ok) {
    return target;
  }

  if (target.workout.workout_type === "rest") {
    return {
      ok: false,
      reason: "target_workout_not_supported",
      message: "Rest days cannot be cleared through this workout flow.",
    };
  }

  if (target.workout.workout_date < currentDate) {
    return {
      ok: false,
      reason: "protected_day",
      message: "Past workouts cannot be cleared.",
    };
  }

  const sourceDocument = normalizePersistedWorkoutDocument(target.workout);
  if (!sourceDocument.ok || workoutDocumentHasUnsafeMetricTruth(sourceDocument.value)) {
    return {
      ok: false,
      reason: "target_workout_not_supported",
      message: sourceDocument.ok
        ? "This workout contains target provenance that cannot be cleared safely."
        : sourceDocument.message,
    };
  }

  const evidenceIds = await fetchEvidence(userId, [target.workout.id]);
  if (
    isProtectedWorkoutRowForClear(
      target.workout,
      planContext.existingWorkouts.logsByWorkoutId,
      evidenceIds,
    )
  ) {
    return {
      ok: false,
      reason: "protected_day",
      message: "This workout has protected history or evidence and cannot be deleted here.",
    };
  }

  const remainingWorkouts = planContext.existingWorkouts.workouts.filter(
    (workout) => workout.id !== target.workout.id,
  );
  const review = buildDeleteClearReview({
    targetWorkout: target.workout,
    sourceDocument: sourceDocument.value,
    remainingWorkouts,
    templateKey: sourceDocument.value.workoutIdentity,
  });

  return {
    ok: true,
    targetWorkout: target.workout,
    sourceDocument: sourceDocument.value,
    remainingWorkouts,
    review,
    currentDate,
  };
}

function resolveDeleteTargetWorkout(input: {
  userId: string;
  workouts: readonly PersistedPlannedWorkoutRow[];
  plannedWorkoutId?: string;
  workoutDate?: string;
}):
  | { ok: true; workout: PersistedPlannedWorkoutRow }
  | { ok: false; reason: ManualWorkoutDeleteClearFailureReason; message: string } {
  const matches = input.workouts.filter((workout) => {
    if (input.plannedWorkoutId) {
      return workout.id === input.plannedWorkoutId;
    }

    return workout.workout_date === input.workoutDate;
  });

  if (matches.length !== 1) {
    return {
      ok: false,
      reason: "target_workout_not_found",
      message: "The planned workout was not found in the runner Calendar.",
    };
  }

  const workout = matches[0]!;
  if (workout.user_id !== input.userId) {
    return {
      ok: false,
      reason: "target_workout_not_in_active_plan",
      message: "The planned workout is not part of the current runner's active plan.",
    };
  }

  return { ok: true, workout };
}

function isProtectedWorkoutRowForClear(
  workout: PersistedPlannedWorkoutRow,
  logsByWorkoutId: Map<string, PersistedWorkoutLogRow>,
  evidenceWorkoutIds: Set<string>,
) {
  return logsByWorkoutId.has(workout.id) || evidenceWorkoutIds.has(workout.id);
}

function buildDeleteClearReview(input: {
  targetWorkout: PersistedPlannedWorkoutRow;
  sourceDocument: WorkoutDocument;
  remainingWorkouts: readonly PersistedPlannedWorkoutRow[];
  templateKey: string;
}): ManualWorkoutDeleteClearReview {
  const payload = buildDeleteClearExactnessPayload(input);
  const reviewChecksum = stableManualWorkoutChecksum64Hex(payload);

  return {
    plannedWorkoutId: input.targetWorkout.id,
    workoutDate: input.targetWorkout.workout_date,
    title: input.targetWorkout.title,
    templateKey: input.templateKey,
    reviewChecksum,
  };
}

function buildDeleteClearExactnessPayload(input: {
  targetWorkout: PersistedPlannedWorkoutRow;
  sourceDocument: WorkoutDocument;
  remainingWorkouts: readonly PersistedPlannedWorkoutRow[];
  templateKey: string;
}) {
  return {
    version: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
    sourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    originKind: input.targetWorkout.origin_kind,
    sourcePlanId: input.targetWorkout.plan_cycle_id,
    plannedWorkoutId: input.targetWorkout.id,
    workoutDate: input.targetWorkout.workout_date,
    title: input.targetWorkout.title,
    templateKey: input.templateKey,
    sourceDocument: input.sourceDocument,
    sourceFingerprint: buildFullCalendarWorkoutFingerprint(input.targetWorkout),
    remainingWorkoutIds: input.remainingWorkouts.map((workout) => workout.id).sort(),
    remainingRowCount: input.remainingWorkouts.length,
    remainingNonRestRowCount: input.remainingWorkouts.filter(
      (workout) => workout.workout_type !== "rest",
    ).length,
  };
}
