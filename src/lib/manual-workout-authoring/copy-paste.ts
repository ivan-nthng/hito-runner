import {
  getCalendarWorkoutMutationContext,
  type PersistedPlannedWorkoutRow,
} from "@/lib/runner-calendar-persistence";
import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  CalendarPersistenceRejection,
  applyAtomicCalendarWorkoutMutation,
  buildCalendarWorkoutMutationEvent,
} from "@/lib/runner-calendar-mutations";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  isProtectedManualWorkoutCopySource,
  type ManualWorkoutActivePlanAddDependencies,
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
} from "@/lib/workout-authoring-review";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import type { Json } from "@/lib/supabase/database";
import { weekdayLong } from "@/lib/training";
import {
  normalizePersistedWorkoutDocument,
  normalizeWorkoutDocument,
  type WorkoutDocument,
} from "@/lib/workout-document";

const MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION = "manual_workout_direct_copy_v1" as const;

export interface ManualWorkoutCopyCommandDependencies extends ManualWorkoutActivePlanAddDependencies {
  persistWorkoutCopy?: typeof persistCanonicalCalendarWorkoutCopy;
}

type CalendarWorkoutCopyCommandInput = Extract<WorkoutCommandInput, { operation: "copy" }>;
type RejectedWorkoutCommandReview = Extract<WorkoutCommandReviewResult, { ok: false }>;

type CalendarWorkoutCopyCommandTarget = {
  sourceWorkout: PersistedPlannedWorkoutRow;
  sourceDocument: WorkoutDocument;
  targetDocument: WorkoutDocument;
  currentDate: string;
};

export async function reviewCalendarWorkoutCopyCommandForUser(
  userId: string,
  command: CalendarWorkoutCopyCommandInput,
  dependencies: ManualWorkoutCopyCommandDependencies = {},
): Promise<WorkoutCommandReviewResult> {
  const target = await resolveCalendarWorkoutCopyCommandTarget(userId, command, dependencies);
  if (!target.ok) return target.review;

  return reviewWorkoutCommand({
    command: {
      operation: "copy",
      workoutId: target.target.sourceWorkout.id,
      targetDate: target.target.targetDocument.workoutDate,
      expectedFingerprint: buildFullCalendarWorkoutFingerprint(target.target.sourceWorkout),
    },
  });
}

export async function executeCalendarWorkoutCopyCommandForUser(
  userId: string,
  candidate: ReviewedWorkoutCommandCandidate,
  dependencies: ManualWorkoutCopyCommandDependencies = {},
): Promise<{ ok: true; result: Json } | { ok: false; reason: string; message: string }> {
  if (candidate.command.operation !== "copy") {
    return { ok: false, reason: "invalid_review", message: "The reviewed command is not Copy." };
  }

  const target = await resolveCalendarWorkoutCopyCommandTarget(
    userId,
    candidate.command,
    dependencies,
  );
  if (!target.ok) {
    return {
      ok: false,
      reason: target.review.issues[0]?.code ?? "invalid_review",
      message: target.review.issues[0]?.message ?? "The Copy command is no longer valid.",
    };
  }

  const persistCopy = dependencies.persistWorkoutCopy ?? persistCanonicalCalendarWorkoutCopy;
  try {
    const persisted = await persistCopy({
      userId,
      currentDate: target.target.currentDate,
      sourceWorkout: target.target.sourceWorkout,
      targetDocument: target.target.targetDocument,
      mutationChecksum: candidate.reviewChecksum,
    });
    return {
      ok: true,
      result: {
        sourceWorkoutId: target.target.sourceWorkout.id,
        targetWorkoutId: persisted.plannedWorkout.id,
        targetDate: target.target.targetDocument.workoutDate,
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
      message: "The copied workout could not be persisted. The Calendar is unchanged.",
    };
  }
}

async function resolveCalendarWorkoutCopyCommandTarget(
  userId: string,
  command: CalendarWorkoutCopyCommandInput,
  dependencies: ManualWorkoutCopyCommandDependencies,
): Promise<
  | { ok: true; target: CalendarWorkoutCopyCommandTarget }
  | { ok: false; review: RejectedWorkoutCommandReview }
> {
  const getContext =
    dependencies.getCalendarWorkoutContextForUser ?? getCalendarWorkoutMutationContext;
  const currentDate = dependencies.currentDate ?? (await getRunnerCalendarDateForUserId(userId));
  let context;
  try {
    context = await getContext(userId);
  } catch {
    return rejectCopyCommand(
      "persistence_failed",
      "The Calendar could not verify the persisted workout copy source.",
    );
  }

  const sourceWorkout = context.existingWorkouts.workouts.find(
    (workout) => workout.id === command.workoutId && workout.user_id === userId,
  );
  if (!sourceWorkout) {
    return rejectCopyCommand("not_found", "The copied source workout is no longer available.");
  }
  if (
    command.expectedFingerprint !== undefined &&
    !stableJsonEqual(
      command.expectedFingerprint,
      buildFullCalendarWorkoutFingerprint(sourceWorkout),
    )
  ) {
    return rejectCopyCommand(
      "stale_reference",
      "The copied source workout changed after review. Review Copy again.",
    );
  }
  if (sourceWorkout.workout_type === "rest") {
    return rejectCopyCommand(
      "protected_operation",
      "Rest rows are not workout prescriptions and cannot be copied.",
    );
  }

  const sourceDocument = normalizePersistedWorkoutDocument(sourceWorkout);
  if (!sourceDocument.ok || workoutDocumentHasUnsafeMetricTruth(sourceDocument.value)) {
    return rejectCopyCommand(
      "protected_operation",
      sourceDocument.ok
        ? "This workout contains target provenance that cannot be copied safely."
        : sourceDocument.message,
    );
  }

  let evidenceIds: Set<string>;
  try {
    evidenceIds = await (
      dependencies.fetchEvidenceWorkoutIds ?? fetchManualWorkoutEvidenceWorkoutIds
    )(userId, [sourceWorkout.id]);
  } catch {
    return rejectCopyCommand(
      "persistence_failed",
      "The Calendar could not verify workout evidence before copying.",
    );
  }
  if (
    isProtectedManualWorkoutCopySource(
      sourceWorkout,
      currentDate,
      context.existingWorkouts.logsByWorkoutId,
      evidenceIds,
    ) ||
    command.targetDate < currentDate
  ) {
    return rejectCopyCommand(
      "protected_operation",
      "Past, logged, or evidence-backed workouts cannot be copied to this date.",
    );
  }
  if (
    context.existingWorkouts.workouts.some((workout) => workout.workout_date === command.targetDate)
  ) {
    return rejectCopyCommand("calendar_collision", "Copy requires a truly empty target date.");
  }

  const targetDocument = normalizeWorkoutDocument({
    ...sourceDocument.value,
    workoutDate: command.targetDate,
    weekday: weekdayLong(command.targetDate),
    displayOrder: resolveNextCalendarDisplayOrder(context.existingWorkouts.workouts),
  });
  if (!targetDocument.ok) {
    return rejectCopyCommand("protected_operation", targetDocument.message);
  }

  return {
    ok: true,
    target: {
      sourceWorkout,
      sourceDocument: sourceDocument.value,
      targetDocument: targetDocument.value,
      currentDate,
    },
  };
}

function rejectCopyCommand(
  code: Parameters<typeof rejectWorkoutCommandReview>[0],
  message: string,
): { ok: false; review: RejectedWorkoutCommandReview } {
  return {
    ok: false,
    review: rejectWorkoutCommandReview(code, message, ["command", "copy"]),
  };
}

async function persistCanonicalCalendarWorkoutCopy(input: {
  userId: string;
  currentDate: string;
  sourceWorkout: PersistedPlannedWorkoutRow;
  targetDocument: WorkoutDocument;
  mutationChecksum: string;
}) {
  const [insertRow] = buildPersistedWorkoutInsertRows(
    input.sourceWorkout.plan_cycle_id,
    input.userId,
    [input.targetDocument],
    input.sourceWorkout.origin_kind,
  );

  if (!insertRow) {
    throw new Error("Calendar workout copy did not prepare an insert row.");
  }

  const targetWorkoutId = crypto.randomUUID();
  const mutationEvent = buildCalendarWorkoutMutationEvent({
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.copyWorkout,
    originKind: input.sourceWorkout.origin_kind,
    reviewPayloadVersion: MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION,
    reviewChecksum: input.mutationChecksum,
    mutationMode: "direct_manual_edit",
    mutationPayloadVersion: MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION,
    mutationChecksum: input.mutationChecksum,
    plannedWorkoutId: targetWorkoutId,
    sourceWorkoutId: input.sourceWorkout.id,
    sourceWorkoutDate: input.sourceWorkout.workout_date,
    targetWorkoutId,
    targetDate: input.targetDocument.workoutDate,
    title: input.sourceWorkout.title,
    trustedClientRows: false,
    originalPlanSourceKind: input.sourceWorkout.origin_kind,
    originalPlanSourceStatus: null,
    originalWorkoutSourceId: input.sourceWorkout.source_workout_id,
    originalWorkoutSourceType: input.sourceWorkout.source_workout_type,
    originalWorkoutFamily: input.sourceWorkout.workout_family,
    originalWorkoutIdentity: input.sourceWorkout.workout_identity,
  });
  const persisted = await applyAtomicCalendarWorkoutMutation({
    userId: input.userId,
    currentDate: input.currentDate,
    mutationKind: "add",
    expectedSourceWorkout: buildFullCalendarWorkoutFingerprint(
      input.sourceWorkout,
    ) as unknown as Json,
    expectedTargetWorkout: null,
    workoutInsert: {
      ...insertRow,
      id: targetWorkoutId,
    } as unknown as Json,
    workoutUpdate: null,
    mutationEvent: mutationEvent as unknown as Json,
  });

  if (!persisted.mutatedWorkout) {
    throw new Error("Calendar workout copy did not return the inserted workout.");
  }

  return { plannedWorkout: persisted.mutatedWorkout };
}

function resolveNextCalendarDisplayOrder(workouts: readonly PersistedPlannedWorkoutRow[]) {
  return workouts.length === 0
    ? 0
    : Math.max(...workouts.map((workout) => workout.display_order)) + 1;
}
