import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
  buildCalendarWorkoutMutationEvent,
} from "@/lib/active-plan-workout-editing/policy";
import {
  getCalendarWorkoutMutationContext,
  type CalendarWorkoutContext,
  type PersistedPlannedWorkoutRow,
} from "@/lib/runner-calendar-persistence";
import {
  CalendarPersistenceRejection,
  applyAtomicCalendarWorkoutMutation,
} from "@/lib/active-plan-lifecycle-persistence";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  isProtectedManualWorkoutTarget,
  type ManualWorkoutActivePlanAddDependencies,
  type ManualWorkoutEvidenceFetcher,
} from "@/lib/manual-workout-authoring/active-plan-add";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";
import { reviewManualWorkoutDraft } from "@/lib/manual-workout-authoring/actions";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  inputHasClientPayload,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "@/lib/manual-workout-authoring/schema";
import { persistedManualWorkoutHasUnsafeMetricTruth } from "@/lib/manual-workout-authoring/persisted-workout-safety";
import { buildFullSourceWorkoutFingerprint } from "@/lib/manual-workout-authoring/edit-workout-review-token";
import {
  buildManualWorkoutReviewToken,
  stableManualWorkoutChecksum64Hex,
  validateManualWorkoutReviewProof,
} from "@/lib/manual-workout-authoring/review-exactness";
import { getCurrentManualWorkoutAuthoringUserId } from "@/lib/manual-workout-authoring/request-auth";
import type { Json } from "@/lib/supabase/database";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { weekdayLong } from "@/lib/training";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION = "manual_workout_move_review_payload_v1" as const;
const MANUAL_WORKOUT_DIRECT_MOVE_PAYLOAD_VERSION = "manual_workout_direct_move_v1" as const;
const MANUAL_WORKOUT_MOVE_REVIEW_TOKEN_PREFIX = "manual-workout-move-review-v1.";

const manualWorkoutMoveBaseInputSchema = z
  .object({
    activePlanId: z.string().uuid().optional(),
    sourceWorkoutId: z.string().uuid().optional(),
    sourceWorkoutDate: isoDateSchema.optional(),
    targetDate: isoDateSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.sourceWorkoutId && !value.sourceWorkoutDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide source workout id, source workout date, or a matching source pair.",
        path: ["sourceWorkoutId"],
      });
    }
  });

export const manualWorkoutMoveReviewInputSchema = manualWorkoutMoveBaseInputSchema;

export const manualWorkoutMoveConfirmInputSchema = z
  .object({
    activePlanId: z.string().uuid().optional(),
    sourceWorkoutId: z.string().uuid().optional(),
    sourceWorkoutDate: isoDateSchema.optional(),
    targetDate: isoDateSchema,
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.sourceWorkoutId && !value.sourceWorkoutDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide source workout id, source workout date, or a matching source pair.",
        path: ["sourceWorkoutId"],
      });
    }
  });

export const manualWorkoutDirectMoveInputSchema = z
  .object({
    activePlanId: z.string().uuid().optional(),
    sourceWorkoutId: z.string().uuid(),
    sourceWorkoutDate: isoDateSchema,
    targetDate: isoDateSchema,
  })
  .strict();

export type ManualWorkoutMoveFailureReason =
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

export type ManualWorkoutMoveDependencies = Pick<
  ManualWorkoutActivePlanAddDependencies,
  "getCalendarWorkoutContextForUser" | "currentDate"
> & {
  fetchEvidenceWorkoutIds?: ManualWorkoutEvidenceFetcher;
  persistWorkoutMove?: typeof persistManualWorkoutMove;
};

type ManualWorkoutMoveBlockedResult = {
  ok: false;
  status: "blocked";
  persisted: false;
  reason: ManualWorkoutMoveFailureReason;
  message: string;
  sourceKind: string | null;
  workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
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
  reviewToken: string;
  reviewChecksum: string;
  exactnessPayloadVersion: typeof MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION;
  mutationMode?: "direct_manual_edit";
  mutationPayloadVersion?: typeof MANUAL_WORKOUT_DIRECT_MOVE_PAYLOAD_VERSION;
  mutationChecksum?: string;
  trustedClientRows?: false;
};

export type ManualWorkoutMoveReplacementTarget = {
  plannedWorkoutId: string;
  workoutDate: string;
  title: string;
  workoutType: string | null;
  sourceWorkoutType: string | null;
  workoutIdentity: string | null;
};

export type ManualWorkoutMoveReviewResult =
  | {
      ok: true;
      status: "review_ready";
      persisted: false;
      sourceKind: string;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string | null;
      sourceWorkoutId: string;
      sourceWorkoutDate: string;
      targetDate: string;
      targetWeekday: string;
      targetDayKind: ManualWorkoutMoveTargetDayKind;
      targetReplacement: ManualWorkoutMoveReplacementTarget | null;
      title: string;
      templateKey: string;
      draftInput: ManualWorkoutDraftInput | null;
      targetReview: Extract<ManualWorkoutDraftReviewResult, { ok: true }> | null;
      review: ManualWorkoutMoveReview;
      safety: {
        requiresExplicitConfirm: true;
        sourceWorkoutVerified: true;
        runnerOwnershipVerified: true;
        protectedHistoryChecked: true;
        targetDayKind: ManualWorkoutMoveTargetDayKind;
        targetWeekdayDerivedServerSide: true;
        sourceProvenanceUnchanged: true;
        trustedClientRows: false;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutMoveBlockedResult;

export type ManualWorkoutMoveConfirmResult =
  | {
      ok: true;
      status: "moved";
      persisted: true;
      sourceKind: string;
      sourceStatus: string | null;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string | null;
      plannedWorkoutId: string;
      sourceWorkoutDate: string;
      targetDate: string;
      targetWeekday: string;
      targetDayKind: ManualWorkoutMoveTargetDayKind;
      targetReplacement: ManualWorkoutMoveReplacementTarget | null;
      title: string;
      templateKey: string;
      reviewChecksum: string;
      exactnessPayloadVersion: typeof MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION;
      undoExpiresAt: string | null;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      safety: {
        requiresExplicitConfirm: true;
        sourceWorkoutVerified: true;
        runnerOwnershipVerified: true;
        protectedHistoryChecked: true;
        movedExactlyOneRow: true;
        sourceDateBecameEmpty: boolean;
        targetDayKind: ManualWorkoutMoveTargetDayKind;
        targetWeekdayDerivedServerSide: true;
        sourceProvenanceUnchanged: true;
        trustedClientRows: false;
        serverRebuiltReview: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutMoveBlockedResult;

export type ManualWorkoutDirectMoveResult =
  | {
      ok: true;
      status: "moved";
      persisted: true;
      sourceKind: string;
      sourceStatus: string | null;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string | null;
      plannedWorkoutId: string;
      sourceWorkoutDate: string;
      targetDate: string;
      targetWeekday: string;
      targetDayKind: ManualWorkoutMoveTargetDayKind;
      targetReplacement: ManualWorkoutMoveReplacementTarget | null;
      title: string;
      templateKey: string;
      mutationMode: "direct_manual_edit";
      mutationPayloadVersion: typeof MANUAL_WORKOUT_DIRECT_MOVE_PAYLOAD_VERSION;
      mutationChecksum: string;
      undoExpiresAt: string | null;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      safety: {
        requiresExplicitConfirm: false;
        directMutation: true;
        sourceWorkoutVerified: true;
        runnerOwnershipVerified: true;
        protectedHistoryChecked: true;
        movedExactlyOneRow: true;
        sourceDateBecameEmpty: boolean;
        targetDayKind: ManualWorkoutMoveTargetDayKind;
        targetWeekdayDerivedServerSide: true;
        sourceProvenanceUnchanged: true;
        trustedClientRows: false;
        serverRebuiltReview: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutMoveBlockedResult;

type ManualWorkoutMoveReviewInput = z.output<typeof manualWorkoutMoveReviewInputSchema>;
type ManualWorkoutMoveConfirmInput = z.output<typeof manualWorkoutMoveConfirmInputSchema>;

type ManualWorkoutMoveTarget =
  | {
      ok: true;
      sourceWorkout: PersistedPlannedWorkoutRow;
      otherWorkouts: PersistedPlannedWorkoutRow[];
      draftInput?: ManualWorkoutDraftInput;
      targetReview?: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
      review: ManualWorkoutMoveReview;
      targetWeekNumber: number;
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
  review: ManualWorkoutMoveReview;
  targetWeekNumber: number;
  targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
};

type ManualWorkoutMoveResolutionOptions = {
  allowRecentMissedUnloggedSource?: boolean;
  requiresManualDraftReview?: boolean;
};

export const reviewManualWorkoutMove = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutMoveReviewResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();

    if (!userId) {
      return buildMoveBlocked({
        reason: "unauthenticated",
        message: "Sign in before moving manual workouts.",
      });
    }

    return reviewManualWorkoutMoveForUser(userId, data);
  });

export const confirmManualWorkoutMove = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutMoveConfirmResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();

    if (!userId) {
      return buildMoveBlocked({
        reason: "unauthenticated",
        message: "Sign in before moving manual workouts.",
      });
    }

    return confirmManualWorkoutMoveForUser(userId, data);
  });

export const moveManualWorkoutWithinActivePlan = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutDirectMoveResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();

    if (!userId) {
      return buildMoveBlocked({
        reason: "unauthenticated",
        message: "Sign in before moving manual workouts.",
      });
    }

    return moveManualWorkoutWithinActivePlanForUser(userId, data);
  });

export async function reviewManualWorkoutMoveForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutMoveDependencies = {},
): Promise<ManualWorkoutMoveReviewResult> {
  const parsed = manualWorkoutMoveReviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildMoveBlocked({
      reason: "invalid_input",
      message: "The manual workout move review payload is invalid.",
    });
  }

  const target = await resolveManualWorkoutMoveTarget(userId, parsed.data, dependencies);

  if (!target.ok) {
    return buildMoveBlocked(target);
  }

  if (
    target.review.targetDayKind !== "workout_day" &&
    (!target.draftInput || !target.targetReview)
  ) {
    return buildMoveBlocked({
      reason: "source_workout_not_supported",
      message: "This planned workout row cannot be safely reviewed through the manual draft flow.",
    });
  }

  return {
    ok: true,
    status: "review_ready",
    persisted: false,
    sourceKind: target.sourceWorkout.origin_kind,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: target.sourceWorkout.plan_cycle_id,
    sourceWorkoutId: target.sourceWorkout.id,
    sourceWorkoutDate: target.sourceWorkout.workout_date,
    targetDate: target.review.targetDate,
    targetWeekday: target.review.targetWeekday,
    targetDayKind: target.review.targetDayKind,
    targetReplacement: target.review.targetReplacement,
    title: target.sourceWorkout.title,
    templateKey: target.review.templateKey,
    draftInput: target.draftInput ?? null,
    targetReview: target.targetReview ?? null,
    review: target.review,
    safety: {
      requiresExplicitConfirm: true,
      sourceWorkoutVerified: true,
      runnerOwnershipVerified: true,
      protectedHistoryChecked: true,
      targetDayKind: target.review.targetDayKind,
      targetWeekdayDerivedServerSide: true,
      sourceProvenanceUnchanged: true,
      trustedClientRows: false,
      callsOpenAi: false,
    },
  };
}

export async function confirmManualWorkoutMoveForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutMoveDependencies = {},
): Promise<ManualWorkoutMoveConfirmResult> {
  const parsed = manualWorkoutMoveConfirmInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildMoveBlocked({
      reason: "invalid_review",
      message: "The manual workout move confirmation payload is invalid. Refresh the review.",
    });
  }

  const target = await resolveManualWorkoutMoveTarget(userId, parsed.data, dependencies);

  if (!target.ok) {
    return buildMoveBlocked(target);
  }

  if (
    target.review.targetDayKind !== "workout_day" &&
    (!target.draftInput || !target.targetReview)
  ) {
    return buildMoveBlocked({
      reason: "source_workout_not_supported",
      message: "This planned workout row cannot be safely reviewed through the manual draft flow.",
    });
  }

  const reviewProof = validateManualWorkoutReviewProof({
    expectedChecksum: target.review.reviewChecksum,
    reviewChecksum: parsed.data.reviewChecksum,
    reviewToken: parsed.data.reviewToken,
    tokenPrefix: MANUAL_WORKOUT_MOVE_REVIEW_TOKEN_PREFIX,
  });

  if (!reviewProof.ok && reviewProof.reason === "stale_review") {
    return buildMoveBlocked({
      reason: "stale_review",
      message: "This workout move review no longer matches the Calendar rows.",
    });
  }

  if (!reviewProof.ok) {
    return buildMoveBlocked({
      reason: "invalid_review",
      message: "This manual workout move review token is invalid. Refresh the review.",
    });
  }

  const persistMove = dependencies.persistWorkoutMove ?? persistManualWorkoutMove;

  try {
    const persisted = await persistMove({
      userId,
      currentDate: target.currentDate,
      sourceWorkout: target.sourceWorkout,
      otherWorkouts: target.otherWorkouts,
      review: target.review,
      targetWeekNumber: target.targetWeekNumber,
      targetReplacementWorkout: target.targetReplacementWorkout,
    });

    const movedWorkouts = buildMovedWorkoutSet({
      sourceWorkout: target.sourceWorkout,
      otherWorkouts: target.otherWorkouts,
      review: target.review,
      restoredWorkout: persisted.restoredWorkout,
    });

    return {
      ok: true,
      status: "moved",
      persisted: true,
      sourceKind: target.sourceWorkout.origin_kind,
      sourceStatus: null,
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      activePlanId: target.sourceWorkout.plan_cycle_id,
      plannedWorkoutId: target.sourceWorkout.id,
      sourceWorkoutDate: target.sourceWorkout.workout_date,
      targetDate: target.review.targetDate,
      targetWeekday: target.review.targetWeekday,
      targetDayKind: target.review.targetDayKind,
      targetReplacement: target.review.targetReplacement,
      title: target.sourceWorkout.title,
      templateKey: target.review.templateKey,
      reviewChecksum: target.review.reviewChecksum,
      exactnessPayloadVersion: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
      undoExpiresAt: persisted.undoExpiresAt,
      calendarRowCount: movedWorkouts.length,
      nonRestWorkoutCount: movedWorkouts.filter((workout) => workout.workout_type !== "rest")
        .length,
      safety: {
        requiresExplicitConfirm: true,
        sourceWorkoutVerified: true,
        runnerOwnershipVerified: true,
        protectedHistoryChecked: true,
        movedExactlyOneRow: true,
        sourceDateBecameEmpty: persisted.restoredWorkout === null,
        targetDayKind: target.review.targetDayKind,
        targetWeekdayDerivedServerSide: true,
        sourceProvenanceUnchanged: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        callsOpenAi: false,
      },
    };
  } catch (error) {
    if (error instanceof CalendarPersistenceRejection) {
      return buildMoveBlocked({
        reason:
          error.reason === "stale_review" || error.reason === "protected_day"
            ? error.reason
            : error.reason === "undo_expired" || error.reason === "unsafe_target_state"
              ? error.reason
              : "persistence_failed",
        message: error.message,
      });
    }

    return buildMoveBlocked({
      reason: "persistence_failed",
      message: "The workout could not be moved. The Calendar is unchanged.",
    });
  }
}

export async function moveManualWorkoutWithinActivePlanForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutMoveDependencies = {},
): Promise<ManualWorkoutDirectMoveResult> {
  const parsed = manualWorkoutDirectMoveInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildMoveBlocked({
      reason: inputHasClientPayload(parsed.error) ? "client_payload_rejected" : "invalid_input",
      message: inputHasClientPayload(parsed.error)
        ? "Manual workout direct move accepts only source and target identifiers."
        : "The manual workout direct move payload is invalid.",
    });
  }

  const target = await resolveManualWorkoutMoveTarget(userId, parsed.data, dependencies, {
    allowRecentMissedUnloggedSource: true,
    requiresManualDraftReview: false,
  });

  if (!target.ok) {
    return buildMoveBlocked(target);
  }

  if (target.review.targetDayKind === "workout_day") {
    return buildMoveBlocked({
      reason: "replacement_requires_review",
      message: "This target day already has a workout. Review and confirm before replacing it.",
    });
  }

  const mutationChecksum = buildDirectMoveMutationChecksum({
    sourcePlanId: target.sourceWorkout.plan_cycle_id,
    sourceWorkoutId: target.sourceWorkout.id,
    sourceWorkoutDate: target.sourceWorkout.workout_date,
    targetDate: target.review.targetDate,
    targetWeekday: target.review.targetWeekday,
    targetDayKind: target.review.targetDayKind,
    targetReplacement: target.review.targetReplacement,
    templateKey: target.review.templateKey,
    reviewChecksum: target.review.reviewChecksum,
  });
  const directReview: ManualWorkoutMoveReview = {
    ...target.review,
    mutationMode: "direct_manual_edit",
    mutationPayloadVersion: MANUAL_WORKOUT_DIRECT_MOVE_PAYLOAD_VERSION,
    mutationChecksum,
    trustedClientRows: false,
  };
  const persistMove = dependencies.persistWorkoutMove ?? persistManualWorkoutMove;

  try {
    const persisted = await persistMove({
      userId,
      currentDate: target.currentDate,
      sourceWorkout: target.sourceWorkout,
      otherWorkouts: target.otherWorkouts,
      review: directReview,
      targetWeekNumber: target.targetWeekNumber,
      targetReplacementWorkout: target.targetReplacementWorkout,
    });

    const movedWorkouts = buildMovedWorkoutSet({
      sourceWorkout: target.sourceWorkout,
      otherWorkouts: target.otherWorkouts,
      review: directReview,
      restoredWorkout: persisted.restoredWorkout,
    });

    return {
      ok: true,
      status: "moved",
      persisted: true,
      sourceKind: target.sourceWorkout.origin_kind,
      sourceStatus: null,
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      activePlanId: target.sourceWorkout.plan_cycle_id,
      plannedWorkoutId: target.sourceWorkout.id,
      sourceWorkoutDate: target.sourceWorkout.workout_date,
      targetDate: directReview.targetDate,
      targetWeekday: directReview.targetWeekday,
      targetDayKind: directReview.targetDayKind,
      targetReplacement: directReview.targetReplacement,
      title: target.sourceWorkout.title,
      templateKey: directReview.templateKey,
      mutationMode: "direct_manual_edit",
      mutationPayloadVersion: MANUAL_WORKOUT_DIRECT_MOVE_PAYLOAD_VERSION,
      mutationChecksum,
      undoExpiresAt: persisted.undoExpiresAt,
      calendarRowCount: movedWorkouts.length,
      nonRestWorkoutCount: movedWorkouts.filter((workout) => workout.workout_type !== "rest")
        .length,
      safety: {
        requiresExplicitConfirm: false,
        directMutation: true,
        sourceWorkoutVerified: true,
        runnerOwnershipVerified: true,
        protectedHistoryChecked: true,
        movedExactlyOneRow: true,
        sourceDateBecameEmpty: persisted.restoredWorkout === null,
        targetDayKind: directReview.targetDayKind,
        targetWeekdayDerivedServerSide: true,
        sourceProvenanceUnchanged: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        callsOpenAi: false,
      },
    };
  } catch (error) {
    if (error instanceof CalendarPersistenceRejection) {
      return buildMoveBlocked({
        reason:
          error.reason === "stale_review" || error.reason === "protected_day"
            ? error.reason
            : error.reason === "undo_expired" || error.reason === "unsafe_target_state"
              ? error.reason
              : "persistence_failed",
        message: error.message,
      });
    }

    return buildMoveBlocked({
      reason: "persistence_failed",
      message: "The workout could not be moved. The Calendar is unchanged.",
    });
  }
}

export async function persistManualWorkoutMove({
  userId,
  currentDate,
  sourceWorkout,
  review,
  targetWeekNumber,
  targetReplacementWorkout,
}: PersistManualWorkoutMoveInput) {
  const mutationEvent = buildCalendarWorkoutMutationEvent({
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.moveWorkout,
    originKind: sourceWorkout.origin_kind,
    reviewPayloadVersion: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
    reviewChecksum: review.reviewChecksum,
    mutationMode: review.mutationMode,
    mutationPayloadVersion: review.mutationPayloadVersion,
    mutationChecksum: review.mutationChecksum ?? review.reviewChecksum,
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
    expectedSourceWorkout: buildFullSourceWorkoutFingerprint(sourceWorkout) as unknown as Json,
    expectedTargetWorkout: targetReplacementWorkout
      ? (buildFullSourceWorkoutFingerprint(targetReplacementWorkout) as unknown as Json)
      : null,
    workoutInsert: null,
    workoutUpdate: {
      workout_date: review.targetDate,
      weekday: review.targetWeekday,
      week_number: targetWeekNumber,
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
    stableManualWorkoutChecksum64Hex(buildFullSourceWorkoutFingerprint(actual)) ===
    stableManualWorkoutChecksum64Hex(buildFullSourceWorkoutFingerprint(expected))
  );
}

async function resolveManualWorkoutMoveTarget(
  userId: string,
  input: ManualWorkoutMoveReviewInput | ManualWorkoutMoveConfirmInput,
  dependencies: ManualWorkoutMoveDependencies,
  options: ManualWorkoutMoveResolutionOptions = {},
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

  const datePolicy = resolveManualWorkoutMoveDatePolicy({
    sourceWorkoutDate: source.workout.workout_date,
    targetDate: input.targetDate,
    currentDate,
    allowRecentMissedUnloggedSource: options.allowRecentMissedUnloggedSource === true,
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

  const requiresManualDraftReview =
    options.requiresManualDraftReview !== false && targetResolution.targetDayKind !== "workout_day";

  if (requiresManualDraftReview && persistedManualWorkoutHasUnsafeMetricTruth(source.workout)) {
    return {
      ok: false,
      reason: "source_workout_not_supported",
      message:
        "This source workout has metric targets that cannot be reviewed through the manual draft flow.",
    };
  }

  let draftInput: ManualWorkoutDraftInput | undefined;
  let targetReview: Extract<ManualWorkoutDraftReviewResult, { ok: true }> | undefined;

  if (requiresManualDraftReview) {
    const draft = buildManualWorkoutDraftInputFromPersistedWorkout(
      source.workout,
      input.targetDate,
    );

    if (!draft.ok) {
      return {
        ok: false,
        reason: mapMoveDraftFailureReason(draft.reason),
        message: draft.message,
      };
    }

    const reviewedTarget = reviewManualWorkoutDraft(draft.draftInput);
    if (!reviewedTarget.ok) {
      return {
        ok: false,
        reason: mapMoveTargetReviewFailureReason(reviewedTarget.reason),
        message: reviewedTarget.message,
      };
    }

    draftInput = draft.draftInput;
    targetReview = reviewedTarget;
  }

  const otherWorkouts = planContext.existingWorkouts.workouts.filter(
    (workout) => workout.id !== source.workout.id,
  );
  const targetWeekNumber = source.workout.week_number;
  const review = buildMoveReview({
    sourceWorkout: source.workout,
    otherWorkouts,
    targetDate: input.targetDate,
    targetWeekday: weekdayLong(input.targetDate),
    targetWeekNumber,
    targetDayKind: targetResolution.targetDayKind,
    targetReplacementWorkout: targetResolution.targetReplacementWorkout,
    templateKey: targetReview?.draft.templateKey ?? resolveWorkoutSourceTemplateKey(source.workout),
    draftInput,
    targetReview,
  });

  return {
    ok: true,
    sourceWorkout: source.workout,
    otherWorkouts,
    draftInput,
    targetReview,
    review,
    targetWeekNumber,
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
  allowRecentMissedUnloggedSource: boolean;
}):
  | { ok: true; recentMissedUnloggedSource: boolean }
  | { ok: false; reason: ManualWorkoutMoveFailureReason; message: string } {
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

  return {
    ok: true,
    recentMissedUnloggedSource: input.sourceWorkoutDate < input.currentDate,
  };
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
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  targetDate: string;
  targetWeekday: string;
  targetWeekNumber: number;
  targetDayKind: ManualWorkoutMoveTargetDayKind;
  targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
  templateKey: string;
  draftInput?: ManualWorkoutDraftInput;
  targetReview?: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
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
    templateKey: input.templateKey,
    reviewToken: buildManualWorkoutReviewToken(
      MANUAL_WORKOUT_MOVE_REVIEW_TOKEN_PREFIX,
      reviewChecksum,
    ),
    reviewChecksum,
    exactnessPayloadVersion: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
  };
}

function buildMoveExactnessPayload(input: {
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  targetDate: string;
  targetWeekday: string;
  targetWeekNumber: number;
  targetDayKind: ManualWorkoutMoveTargetDayKind;
  targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
  templateKey: string;
  draftInput?: ManualWorkoutDraftInput;
  targetReview?: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
}) {
  return {
    version: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
    sourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    originKind: input.sourceWorkout.origin_kind,
    sourcePlanId: input.sourceWorkout.plan_cycle_id,
    sourceWorkoutFingerprint: buildFullSourceWorkoutFingerprint(input.sourceWorkout),
    sourceWorkoutId: input.sourceWorkout.id,
    sourceWorkoutDate: input.sourceWorkout.workout_date,
    targetDate: input.targetDate,
    targetWeekday: input.targetWeekday,
    targetWeekNumber: input.targetWeekNumber,
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
      ? buildFullSourceWorkoutFingerprint(input.targetReplacementWorkout)
      : null,
    title: input.sourceWorkout.title,
    templateKey: input.templateKey,
    sourceWorkoutType: input.sourceWorkout.source_workout_type,
    workoutType: input.sourceWorkout.workout_type,
    workoutFamily: input.sourceWorkout.workout_family,
    workoutIdentity: input.sourceWorkout.workout_identity,
    calendarIconKey: input.sourceWorkout.calendar_icon_key,
    metricMode: input.sourceWorkout.metric_mode,
    steps: input.sourceWorkout.steps,
    targetDraftInput: input.draftInput ?? null,
    targetReviewChecksum: input.targetReview?.reviewChecksum ?? null,
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

function buildMovedWorkoutSet(input: {
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  review: ManualWorkoutMoveReview;
  restoredWorkout?: PersistedPlannedWorkoutRow | null;
}): PersistedPlannedWorkoutRow[] {
  const replacedWorkoutId = input.review.targetReplacement?.plannedWorkoutId ?? null;

  return [
    ...input.otherWorkouts.filter((workout) => workout.id !== replacedWorkoutId),
    {
      ...input.sourceWorkout,
      workout_date: input.review.targetDate,
      weekday: input.review.targetWeekday,
    },
    ...(input.restoredWorkout ? [input.restoredWorkout] : []),
  ];
}

function buildDirectMoveMutationChecksum(input: {
  sourcePlanId: string | null;
  sourceWorkoutId: string;
  sourceWorkoutDate: string;
  targetDate: string;
  targetWeekday: string;
  targetDayKind: ManualWorkoutMoveTargetDayKind;
  targetReplacement: ManualWorkoutMoveReplacementTarget | null;
  templateKey: string;
  reviewChecksum: string;
}) {
  return stableManualWorkoutChecksum64Hex({
    version: MANUAL_WORKOUT_DIRECT_MOVE_PAYLOAD_VERSION,
    sourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.moveWorkout,
    sourcePlanId: input.sourcePlanId,
    sourceWorkoutId: input.sourceWorkoutId,
    sourceWorkoutDate: input.sourceWorkoutDate,
    targetDate: input.targetDate,
    targetWeekday: input.targetWeekday,
    targetDayKind: input.targetDayKind,
    targetReplacement: input.targetReplacement,
    templateKey: input.templateKey,
    reviewChecksum: input.reviewChecksum,
    trustedClientRows: false,
  });
}

function resolveWorkoutSourceTemplateKey(workout: PersistedPlannedWorkoutRow) {
  if (typeof workout.source_workout_type === "string" && workout.source_workout_type.trim()) {
    return workout.source_workout_type.trim();
  }

  return workout.workout_type;
}

function mapMoveDraftFailureReason(reason: string): ManualWorkoutMoveFailureReason {
  switch (reason) {
    case "source_workout_not_found":
      return "source_workout_not_found";
    case "source_workout_not_owned":
      return "source_workout_not_owned";
    case "persistence_failed":
      return "persistence_failed";
    default:
      return "source_workout_not_supported";
  }
}

function mapMoveTargetReviewFailureReason(
  reason: Extract<ManualWorkoutDraftReviewResult, { ok: false }>["reason"],
): ManualWorkoutMoveFailureReason {
  switch (reason) {
    case "active_plan_conflict":
      return "source_workout_not_supported";
    case "protected_date_conflict":
      return "protected_day";
    case "invalid_input":
      return "invalid_input";
    default:
      return "source_workout_not_supported";
  }
}

function buildMoveBlocked(input: {
  reason: ManualWorkoutMoveFailureReason;
  message: string;
}): ManualWorkoutMoveBlockedResult {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: input.reason,
    message: input.message,
    sourceKind: null,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  };
}
