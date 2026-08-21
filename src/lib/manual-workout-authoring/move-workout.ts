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
} from "@/lib/runner-calendar-persistence";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  isProtectedManualWorkoutTarget,
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
  type WorkoutCommandMoveTargetPolicy,
  type WorkoutCommandReviewResult,
  WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
} from "@/lib/workout-authoring-review";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import type { Json } from "@/lib/supabase/database";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { weekdayLong } from "@/lib/training";
import {
  normalizePersistedWorkoutDocument,
  normalizeWorkoutDocument,
  type WorkoutDocument,
} from "@/lib/workout-document";

type ManualWorkoutMoveFailureReason =
  | "unauthenticated"
  | "invalid_review"
  | "stale_review"
  | "invalid_input"
  | "unsupported_source_metadata"
  | "source_workout_not_found"
  | "source_workout_not_owned"
  | "source_workout_not_supported"
  | "source_date_changed"
  | "client_payload_rejected"
  | "target_date_unchanged"
  | "protected_day"
  | "occupied_day"
  | "replacement_requires_review"
  | "unsafe_target_state"
  | "undo_expired"
  | "persistence_failed";

export type ManualWorkoutMoveTargetDayKind = "rest_day" | "workout_day";

export type ManualWorkoutMoveCommandDependencies = Pick<
  ManualWorkoutActivePlanAddDependencies,
  "getCalendarWorkoutContextForUser" | "currentDate"
> & {
  fetchEvidenceWorkoutIds?: ManualWorkoutEvidenceFetcher;
  persistWorkoutMove?: typeof persistManualWorkoutMove;
};

type ManualWorkoutMoveReview = {
  sourceWorkoutId: string;
  sourceWorkoutDate: string;
  targetDate: string;
  targetWeekday: string;
  targetDayKind: ManualWorkoutMoveTargetDayKind;
  targetReplacement: ManualWorkoutMoveReplacementTarget | null;
  title: string;
  templateKey: string;
  reviewChecksum: string;
  trustedClientRows?: false;
};

type ManualWorkoutMoveReplacementTarget = {
  plannedWorkoutId: string;
  workoutDate: string;
  title: string;
  workoutType: string | null;
  sourceWorkoutType: string | null;
  workoutIdentity: string | null;
};

type ManualWorkoutMoveInput = {
  sourceWorkoutId: string;
  sourceWorkoutDate?: string;
  targetDate: string;
};

type ManualWorkoutMoveTarget =
  | {
      ok: true;
      sourceWorkout: PersistedPlannedWorkoutRow;
      otherWorkouts: PersistedPlannedWorkoutRow[];
      sourceDocument: WorkoutDocument;
      targetDocument: WorkoutDocument;
      review: ManualWorkoutMoveReview;
      targetDayKind: ManualWorkoutMoveTargetDayKind;
      targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
      currentDate: string;
    }
  | {
      ok: false;
      reason: ManualWorkoutMoveFailureReason;
      message: string;
    };

type PersistManualWorkoutMoveInput = {
  userId: string;
  currentDate: string;
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  targetDocument: WorkoutDocument;
  review: ManualWorkoutMoveReview;
  targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
};

type CalendarWorkoutMoveCommandInput = Extract<WorkoutCommandInput, { operation: "move" }>;
type RejectedWorkoutCommandReview = Extract<WorkoutCommandReviewResult, { ok: false }>;

export async function reviewCalendarWorkoutMoveCommandForUser(
  userId: string,
  command: CalendarWorkoutMoveCommandInput,
  dependencies: ManualWorkoutMoveCommandDependencies = {},
): Promise<WorkoutCommandReviewResult> {
  const target = await resolveManualWorkoutMoveTarget(
    userId,
    { sourceWorkoutId: command.workoutId, targetDate: command.targetDate },
    dependencies,
  );
  if (!target.ok) return rejectMoveCommand(target.reason, target.message);

  const resolvedCommand = buildAuthoritativeMoveCommand(command, target);
  if (!resolvedCommand.ok) return resolvedCommand.review;
  return reviewWorkoutCommand({ command: resolvedCommand.command });
}

export async function executeCalendarWorkoutMoveCommandForUser(
  userId: string,
  candidate: ReviewedWorkoutCommandCandidate,
  dependencies: ManualWorkoutMoveCommandDependencies = {},
): Promise<{ ok: true; result: Json } | { ok: false; reason: string; message: string }> {
  if (candidate.command.operation !== "move") {
    return { ok: false, reason: "invalid_review", message: "The reviewed command is not Move." };
  }

  const target = await resolveManualWorkoutMoveTarget(
    userId,
    {
      sourceWorkoutId: candidate.command.workoutId,
      targetDate: candidate.command.targetDate,
    },
    dependencies,
  );
  if (!target.ok) return { ok: false, reason: target.reason, message: target.message };

  const resolvedCommand = buildAuthoritativeMoveCommand(candidate.command, target);
  if (!resolvedCommand.ok) {
    return {
      ok: false,
      reason: resolvedCommand.review.issues[0]?.code ?? "stale_review",
      message: resolvedCommand.review.issues[0]?.message ?? "The Move command is stale.",
    };
  }

  const persistMove = dependencies.persistWorkoutMove ?? persistManualWorkoutMove;
  try {
    const persisted = await persistMove({
      userId,
      currentDate: target.currentDate,
      sourceWorkout: target.sourceWorkout,
      otherWorkouts: target.otherWorkouts,
      targetDocument: target.targetDocument,
      review: { ...target.review, reviewChecksum: candidate.reviewChecksum },
      targetReplacementWorkout: target.targetReplacementWorkout,
    });
    return {
      ok: true,
      result: {
        plannedWorkoutId: persisted.movedWorkout.id,
        sourceWorkoutDate: target.sourceWorkout.workout_date,
        targetDate: target.targetDocument.workoutDate,
        targetDayKind: target.targetDayKind,
        displacedWorkoutId: target.targetReplacementWorkout?.id ?? null,
        restoredWorkoutId: persisted.restoredWorkout?.id ?? null,
        undoExpiresAt: persisted.undoExpiresAt,
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
      message: "The workout could not be moved. The Calendar is unchanged.",
    };
  }
}

function buildAuthoritativeMoveCommand(
  input: CalendarWorkoutMoveCommandInput,
  target: Extract<ManualWorkoutMoveTarget, { ok: true }>,
):
  | { ok: true; command: Extract<WorkoutCommandInput, { operation: "move" }> }
  | { ok: false; review: RejectedWorkoutCommandReview } {
  const targetPolicy: WorkoutCommandMoveTargetPolicy = {
    targetDayKind: target.targetDayKind,
    targetReplacementWorkoutId: target.targetReplacementWorkout?.id ?? null,
    restDisplacement:
      target.targetDayKind === "rest_day" && target.targetReplacementWorkout
        ? "stored_rest"
        : "none",
  };
  const expectedFingerprints = {
    source: buildFullCalendarWorkoutFingerprint(target.sourceWorkout),
    target: target.targetReplacementWorkout
      ? buildFullCalendarWorkoutFingerprint(target.targetReplacementWorkout)
      : null,
  };
  if (
    (input.targetPolicy !== undefined && !stableJsonEqual(input.targetPolicy, targetPolicy)) ||
    (input.expectedFingerprints !== undefined &&
      !stableJsonEqual(input.expectedFingerprints, expectedFingerprints))
  ) {
    return {
      ok: false,
      review: rejectWorkoutCommandReview(
        "stale_reference",
        "The Move source or target changed after review. Review Move again.",
        ["command", "expectedFingerprints"],
      ),
    };
  }

  return {
    ok: true,
    command: {
      operation: "move",
      workoutId: target.sourceWorkout.id,
      targetDate: target.targetDocument.workoutDate,
      targetPolicy,
      expectedFingerprints,
    },
  };
}

function rejectMoveCommand(
  reason: ManualWorkoutMoveFailureReason,
  message: string,
): WorkoutCommandReviewResult {
  const code =
    reason === "source_workout_not_found" || reason === "source_workout_not_owned"
      ? "not_found"
      : reason === "protected_day" ||
          reason === "source_workout_not_supported" ||
          reason === "unsafe_target_state"
        ? "protected_operation"
        : reason === "occupied_day"
          ? "calendar_collision"
          : reason === "persistence_failed"
            ? "persistence_failed"
            : "invalid_operation";
  return rejectWorkoutCommandReview(code, message, ["command", "move"]);
}

export async function persistManualWorkoutMove({
  userId,
  currentDate,
  sourceWorkout,
  targetDocument,
  review,
  targetReplacementWorkout,
}: PersistManualWorkoutMoveInput) {
  const mutationEvent = buildCalendarWorkoutMutationEvent({
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.moveWorkout,
    originKind: sourceWorkout.origin_kind,
    reviewPayloadVersion: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
    reviewChecksum: review.reviewChecksum,
    mutationMode: "direct_manual_edit",
    mutationPayloadVersion: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
    mutationChecksum: review.reviewChecksum,
    plannedWorkoutId: sourceWorkout.id,
    previousWorkoutDate: sourceWorkout.workout_date,
    sourceWorkoutId: sourceWorkout.id,
    sourceWorkoutDate: sourceWorkout.workout_date,
    targetWorkoutId: targetReplacementWorkout?.id ?? sourceWorkout.id,
    targetDate: review.targetDate,
    templateKey: review.templateKey,
    title: review.title,
    trustedClientRows: review.trustedClientRows ?? false,
    workoutAuthoringSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    originalPlanSourceKind: sourceWorkout.origin_kind,
    originalPlanSourceStatus: null,
    originalWorkoutSourceId: sourceWorkout.source_workout_id,
    originalWorkoutSourceType: sourceWorkout.source_workout_type,
    originalWorkoutFamily: sourceWorkout.workout_family,
    originalWorkoutIdentity: sourceWorkout.workout_identity,
  });
  const persisted = await applyAtomicCalendarWorkoutMutation({
    userId,
    currentDate,
    mutationKind: "move",
    expectedSourceWorkout: buildFullCalendarWorkoutFingerprint(sourceWorkout) as unknown as Json,
    expectedTargetWorkout: targetReplacementWorkout
      ? (buildFullCalendarWorkoutFingerprint(targetReplacementWorkout) as unknown as Json)
      : null,
    workoutInsert: null,
    workoutUpdate: {
      workout_date: targetDocument.workoutDate,
      weekday: targetDocument.weekday,
      week_number: targetDocument.weekNumber,
    },
    mutationEvent: mutationEvent as unknown as Json,
  });

  if (!persisted.mutatedWorkout) {
    throw new Error("Atomic manual workout move did not return the moved workout.");
  }

  const expectedDeletedWorkout = targetReplacementWorkout;
  if (!persistedWorkoutRowsEqual(persisted.deletedWorkout, expectedDeletedWorkout)) {
    throw new Error("Atomic manual workout move returned an incomplete replacement receipt.");
  }

  return {
    movedWorkout: persisted.mutatedWorkout,
    restoredWorkout: persisted.restoredWorkout,
    mutationEvent: persisted.mutationEvent,
    undoExpiresAt: persisted.undoExpiresAt,
  };
}

function persistedWorkoutRowsEqual(
  actual: PersistedPlannedWorkoutRow | null,
  expected: PersistedPlannedWorkoutRow | null,
) {
  if (!actual || !expected) {
    return actual === expected;
  }

  return (
    stableManualWorkoutChecksum64Hex(buildFullCalendarWorkoutFingerprint(actual)) ===
    stableManualWorkoutChecksum64Hex(buildFullCalendarWorkoutFingerprint(expected))
  );
}

async function resolveManualWorkoutMoveTarget(
  userId: string,
  input: ManualWorkoutMoveInput,
  dependencies: ManualWorkoutMoveCommandDependencies,
): Promise<ManualWorkoutMoveTarget> {
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

  const source = resolveMoveSourceWorkout({
    userId,
    workouts: planContext.existingWorkouts.workouts,
    sourceWorkoutId: input.sourceWorkoutId,
    sourceWorkoutDate: input.sourceWorkoutDate,
  });

  if (!source.ok) {
    return source;
  }

  if (source.workout.workout_type === "rest") {
    return {
      ok: false,
      reason: "source_workout_not_supported",
      message: "Rest days cannot be moved through this workout flow.",
    };
  }

  const sourceDocument = normalizePersistedWorkoutDocument(source.workout);
  if (!sourceDocument.ok || workoutDocumentHasUnsafeMetricTruth(sourceDocument.value)) {
    return {
      ok: false,
      reason: "source_workout_not_supported",
      message: sourceDocument.ok
        ? "This workout contains target provenance that cannot be moved safely."
        : sourceDocument.message,
    };
  }

  const datePolicy = resolveManualWorkoutMoveDatePolicy({
    sourceWorkoutDate: source.workout.workout_date,
    targetDate: input.targetDate,
    currentDate,
  });

  if (!datePolicy.ok) {
    return datePolicy;
  }

  const sourceEvidenceIds = await fetchEvidence(userId, [source.workout.id]);
  const sourceHasLoggedOrEvidenceHistory =
    planContext.existingWorkouts.logsByWorkoutId.has(source.workout.id) ||
    sourceEvidenceIds.has(source.workout.id);
  const sourceIsProtected = sourceHasLoggedOrEvidenceHistory;

  if (sourceIsProtected) {
    return {
      ok: false,
      reason: "protected_day",
      message: "This workout has protected history or evidence and cannot be moved here.",
    };
  }

  const targetDateWorkouts = planContext.existingWorkouts.workouts.filter(
    (workout) => workout.workout_date === input.targetDate && workout.id !== source.workout.id,
  );
  const targetResolution = await resolveMoveTargetDay({
    currentDate,
    fetchEvidence,
    logsByWorkoutId: planContext.existingWorkouts.logsByWorkoutId,
    targetDateWorkouts,
    userId,
  });

  if (!targetResolution.ok) {
    return targetResolution;
  }

  const otherWorkouts = planContext.existingWorkouts.workouts.filter(
    (workout) => workout.id !== source.workout.id,
  );
  const targetDocument = normalizeWorkoutDocument({
    ...sourceDocument.value,
    workoutDate: input.targetDate,
    weekday: weekdayLong(input.targetDate),
  });
  if (!targetDocument.ok) {
    return {
      ok: false,
      reason: "source_workout_not_supported",
      message: targetDocument.message,
    };
  }
  const review = buildMoveReview({
    sourceWorkout: source.workout,
    sourceDocument: sourceDocument.value,
    targetDocument: targetDocument.value,
    otherWorkouts,
    targetDate: input.targetDate,
    targetWeekday: weekdayLong(input.targetDate),
    targetDayKind: targetResolution.targetDayKind,
    targetReplacementWorkout: targetResolution.targetReplacementWorkout,
  });

  return {
    ok: true,
    sourceWorkout: source.workout,
    sourceDocument: sourceDocument.value,
    targetDocument: targetDocument.value,
    otherWorkouts,
    review,
    targetDayKind: targetResolution.targetDayKind,
    targetReplacementWorkout: targetResolution.targetReplacementWorkout,
    currentDate,
  };
}

async function resolveMoveTargetDay(input: {
  userId: string;
  currentDate: string;
  targetDateWorkouts: readonly PersistedPlannedWorkoutRow[];
  logsByWorkoutId: CalendarWorkoutContext["existingWorkouts"]["logsByWorkoutId"];
  fetchEvidence: ManualWorkoutEvidenceFetcher;
}): Promise<
  | {
      ok: true;
      targetDayKind: ManualWorkoutMoveTargetDayKind;
      targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
    }
  | { ok: false; reason: ManualWorkoutMoveFailureReason; message: string }
> {
  if (input.targetDateWorkouts.length === 0) {
    return {
      ok: true,
      targetDayKind: "rest_day",
      targetReplacementWorkout: null,
    };
  }

  const targetEvidenceIds = await input.fetchEvidence(
    input.userId,
    input.targetDateWorkouts.map((workout) => workout.id),
  );
  const protectedTarget = input.targetDateWorkouts.some((workout) =>
    isProtectedManualWorkoutTarget(
      workout,
      input.currentDate,
      input.logsByWorkoutId,
      targetEvidenceIds,
    ),
  );

  if (protectedTarget) {
    return {
      ok: false,
      reason: "protected_day",
      message: "The target date already has protected workout history or evidence.",
    };
  }

  if (input.targetDateWorkouts.length !== 1) {
    return {
      ok: false,
      reason: "unsafe_target_state",
      message: "The target date has multiple unprotected rows. Refresh the calendar before moving.",
    };
  }

  const [targetWorkout] = input.targetDateWorkouts;

  if (!targetWorkout) {
    return {
      ok: false,
      reason: "unsafe_target_state",
      message: "The target date could not be verified. Refresh the calendar before moving.",
    };
  }

  const targetDocument = normalizePersistedWorkoutDocument(targetWorkout);
  if (!targetDocument.ok || workoutDocumentHasUnsafeMetricTruth(targetDocument.value)) {
    return {
      ok: false,
      reason: "unsafe_target_state",
      message: targetDocument.ok
        ? "The target workout contains provenance that cannot be replaced safely."
        : targetDocument.message,
    };
  }

  return {
    ok: true,
    targetDayKind: targetWorkout.workout_type === "rest" ? "rest_day" : "workout_day",
    targetReplacementWorkout: targetWorkout,
  };
}

function resolveManualWorkoutMoveDatePolicy(input: {
  sourceWorkoutDate: string;
  targetDate: string;
  currentDate: string;
}): { ok: true } | { ok: false; reason: ManualWorkoutMoveFailureReason; message: string } {
  if (input.sourceWorkoutDate === input.targetDate) {
    return {
      ok: false,
      reason: "target_date_unchanged",
      message: "Choose a different target date before moving this workout.",
    };
  }

  if (input.targetDate < input.currentDate) {
    return {
      ok: false,
      reason: "protected_day",
      message: "Workout moves can only target today or future supported Calendar days.",
    };
  }

  if (input.sourceWorkoutDate < input.currentDate) {
    return {
      ok: false,
      reason: "protected_day",
      message: "Past workouts cannot be moved.",
    };
  }

  return { ok: true };
}

function resolveMoveSourceWorkout(input: {
  userId: string;
  workouts: readonly PersistedPlannedWorkoutRow[];
  sourceWorkoutId?: string;
  sourceWorkoutDate?: string;
}):
  | { ok: true; workout: PersistedPlannedWorkoutRow }
  | { ok: false; reason: ManualWorkoutMoveFailureReason; message: string } {
  const matches = input.workouts.filter((workout) => {
    if (input.sourceWorkoutId) {
      return workout.id === input.sourceWorkoutId;
    }

    return workout.workout_date === input.sourceWorkoutDate;
  });

  if (matches.length !== 1) {
    return {
      ok: false,
      reason: "source_workout_not_found",
      message: "The source workout was not found in the runner Calendar.",
    };
  }

  const workout = matches[0]!;
  if (workout.user_id !== input.userId) {
    return {
      ok: false,
      reason: "source_workout_not_owned",
      message: "The source workout does not belong to the current runner.",
    };
  }

  if (input.sourceWorkoutDate && workout.workout_date !== input.sourceWorkoutDate) {
    return {
      ok: false,
      reason: "source_date_changed",
      message: "The source workout is no longer on the moved date. Refresh the calendar.",
    };
  }

  return { ok: true, workout };
}

function buildMoveReview(input: {
  sourceWorkout: PersistedPlannedWorkoutRow;
  sourceDocument: WorkoutDocument;
  targetDocument: WorkoutDocument;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  targetDate: string;
  targetWeekday: string;
  targetDayKind: ManualWorkoutMoveTargetDayKind;
  targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
}): ManualWorkoutMoveReview {
  const payload = buildMoveExactnessPayload(input);
  const reviewChecksum = stableManualWorkoutChecksum64Hex(payload);

  return {
    sourceWorkoutId: input.sourceWorkout.id,
    sourceWorkoutDate: input.sourceWorkout.workout_date,
    targetDate: input.targetDate,
    targetWeekday: input.targetWeekday,
    targetDayKind: input.targetDayKind,
    targetReplacement: input.targetReplacementWorkout
      ? buildMoveReplacementTarget(input.targetReplacementWorkout)
      : null,
    title: input.sourceWorkout.title,
    templateKey: input.sourceDocument.workoutIdentity,
    reviewChecksum,
  };
}

function buildMoveExactnessPayload(input: {
  sourceWorkout: PersistedPlannedWorkoutRow;
  sourceDocument: WorkoutDocument;
  targetDocument: WorkoutDocument;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  targetDate: string;
  targetWeekday: string;
  targetDayKind: ManualWorkoutMoveTargetDayKind;
  targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
}) {
  return {
    version: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
    sourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    originKind: input.sourceWorkout.origin_kind,
    sourcePlanId: input.sourceWorkout.plan_cycle_id,
    sourceWorkoutFingerprint: buildFullCalendarWorkoutFingerprint(input.sourceWorkout),
    sourceWorkoutId: input.sourceWorkout.id,
    sourceWorkoutDate: input.sourceWorkout.workout_date,
    targetDate: input.targetDate,
    targetWeekday: input.targetWeekday,
    targetWeekNumber: input.targetDocument.weekNumber,
    targetDayKind: input.targetDayKind,
    targetHadNoPersistedWorkoutRow: input.targetReplacementWorkout === null,
    targetReplacement: input.targetReplacementWorkout
      ? {
          ...buildMoveReplacementTarget(input.targetReplacementWorkout),
          sourceWorkoutId: input.targetReplacementWorkout.source_workout_id,
          metricMode: input.targetReplacementWorkout.metric_mode,
          steps: input.targetReplacementWorkout.steps,
        }
      : null,
    targetWorkoutFingerprint: input.targetReplacementWorkout
      ? buildFullCalendarWorkoutFingerprint(input.targetReplacementWorkout)
      : null,
    title: input.sourceWorkout.title,
    templateKey: input.sourceDocument.workoutIdentity,
    sourceDocument: input.sourceDocument,
    targetDocument: input.targetDocument,
    otherWorkoutIds: input.otherWorkouts.map((workout) => workout.id).sort(),
    preMoveRowCount: input.otherWorkouts.length + 1,
    postMoveRowCount: input.otherWorkouts.length + 1 - (input.targetReplacementWorkout ? 1 : 0),
    preMoveNonRestRowCount:
      input.otherWorkouts.filter((workout) => workout.workout_type !== "rest").length + 1,
    postMoveNonRestRowCount:
      input.otherWorkouts.filter(
        (workout) =>
          workout.workout_type !== "rest" && workout.id !== input.targetReplacementWorkout?.id,
      ).length + 1,
  };
}

function buildMoveReplacementTarget(
  workout: PersistedPlannedWorkoutRow,
): ManualWorkoutMoveReplacementTarget {
  return {
    plannedWorkoutId: workout.id,
    workoutDate: workout.workout_date,
    title: workout.title,
    workoutType: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    workoutIdentity: workout.workout_identity,
  };
}
