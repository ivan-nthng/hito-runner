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
  type PersistedWorkoutLogRow,
} from "@/lib/runner-calendar-persistence";
import {
  CalendarPersistenceRejection,
  applyAtomicCalendarWorkoutMutation,
} from "@/lib/active-plan-lifecycle-persistence";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  type ManualWorkoutActivePlanAddDependencies,
  type ManualWorkoutEvidenceFetcher,
} from "@/lib/manual-workout-authoring/active-plan-add";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";
import { reviewManualWorkoutDraft } from "@/lib/manual-workout-authoring/actions";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
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

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION =
  "manual_workout_delete_review_payload_v1" as const;
const MANUAL_WORKOUT_DELETE_REVIEW_TOKEN_PREFIX = "manual-workout-delete-review-v1.";

const manualWorkoutDeleteClearBaseInputSchema = z
  .object({
    activePlanId: z.string().uuid().optional(),
    plannedWorkoutId: z.string().uuid().optional(),
    workoutDate: isoDateSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const targetReferences = [value.plannedWorkoutId, value.workoutDate].filter(Boolean);

    if (targetReferences.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one planned workout id or workout date.",
        path: ["plannedWorkoutId"],
      });
    }
  });

export const manualWorkoutDeleteClearReviewInputSchema = manualWorkoutDeleteClearBaseInputSchema;

export const manualWorkoutDeleteClearConfirmInputSchema = z
  .object({
    activePlanId: z.string().uuid().optional(),
    plannedWorkoutId: z.string().uuid().optional(),
    workoutDate: isoDateSchema.optional(),
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict()
  .superRefine((value, context) => {
    const targetReferences = [value.plannedWorkoutId, value.workoutDate].filter(Boolean);

    if (targetReferences.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one planned workout id or workout date.",
        path: ["plannedWorkoutId"],
      });
    }
  });

export type ManualWorkoutDeleteClearFailureReason =
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

export type ManualWorkoutDeleteClearDependencies = Pick<
  ManualWorkoutActivePlanAddDependencies,
  "getCalendarWorkoutContextForUser" | "currentDate"
> & {
  fetchEvidenceWorkoutIds?: ManualWorkoutEvidenceFetcher;
  persistWorkoutDelete?: typeof persistManualWorkoutDeleteClear;
};

type ManualWorkoutDeleteClearBlockedResult = {
  ok: false;
  status: "blocked";
  persisted: false;
  reason: ManualWorkoutDeleteClearFailureReason;
  message: string;
  sourceKind: string | null;
  workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
};

type ManualWorkoutDeleteRestoreAffordance = {
  label: "Restore";
  alternateLabels: ["Put back", "Redo"];
} & (
  | {
      available: true;
      draftInput: ManualWorkoutDraftInput;
      review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
      safety: {
        reviewedThroughManualAuthoring: true;
        trustedClientRows: false;
        targetDateDerivedServerSide: true;
      };
    }
  | {
      available: false;
      reason: "restore_requires_editor_support";
      message: string;
      safety: {
        reviewedThroughManualAuthoring: false;
        trustedClientRows: false;
        targetDateDerivedServerSide: true;
      };
    }
);

type ManualWorkoutDeleteClearReview = {
  plannedWorkoutId: string;
  workoutDate: string;
  title: string;
  templateKey: string;
  reviewToken: string;
  reviewChecksum: string;
  exactnessPayloadVersion: typeof MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION;
};

export type ManualWorkoutDeleteClearReviewResult =
  | {
      ok: true;
      status: "review_ready";
      persisted: false;
      sourceKind: string;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string | null;
      plannedWorkoutId: string;
      workoutDate: string;
      title: string;
      templateKey: string;
      review: ManualWorkoutDeleteClearReview;
      restore: ManualWorkoutDeleteRestoreAffordance;
      safety: {
        requiresExplicitConfirm: true;
        targetWorkoutVerified: true;
        runnerOwnershipVerified: true;
        protectedHistoryChecked: true;
        lastWorkoutDeleteAllowed: true;
        trustedClientRows: false;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutDeleteClearBlockedResult;

export type ManualWorkoutDeleteClearConfirmResult =
  | {
      ok: true;
      status: "deleted";
      persisted: true;
      sourceKind: string;
      sourceStatus: string | null;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string | null;
      plannedWorkoutId: string;
      workoutDate: string;
      title: string;
      templateKey: string;
      reviewChecksum: string;
      exactnessPayloadVersion: typeof MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      restore: ManualWorkoutDeleteRestoreAffordance;
      safety: {
        requiresExplicitConfirm: true;
        targetWorkoutVerified: true;
        runnerOwnershipVerified: true;
        protectedHistoryChecked: true;
        deletedExactlyOneRow: true;
        sourceProvenanceUnchanged: true;
        trustedClientRows: false;
        serverRebuiltReview: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutDeleteClearBlockedResult;

type ManualWorkoutDeleteClearReviewInput = z.output<
  typeof manualWorkoutDeleteClearReviewInputSchema
>;
type ManualWorkoutDeleteClearConfirmInput = z.output<
  typeof manualWorkoutDeleteClearConfirmInputSchema
>;

type ManualWorkoutDeleteClearTarget =
  | {
      ok: true;
      targetWorkout: PersistedPlannedWorkoutRow;
      remainingWorkouts: PersistedPlannedWorkoutRow[];
      restore: ManualWorkoutDeleteRestoreAffordance;
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

export const reviewManualWorkoutDeleteClear = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutDeleteClearReviewResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();

    if (!userId) {
      return buildDeleteClearBlocked({
        reason: "unauthenticated",
        message: "Sign in before deleting manual workouts.",
      });
    }

    return reviewManualWorkoutDeleteClearForUser(userId, data);
  });

export const confirmManualWorkoutDeleteClear = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutDeleteClearConfirmResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();

    if (!userId) {
      return buildDeleteClearBlocked({
        reason: "unauthenticated",
        message: "Sign in before deleting manual workouts.",
      });
    }

    return confirmManualWorkoutDeleteClearForUser(userId, data);
  });

export async function reviewManualWorkoutDeleteClearForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutDeleteClearDependencies = {},
): Promise<ManualWorkoutDeleteClearReviewResult> {
  const parsed = manualWorkoutDeleteClearReviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildDeleteClearBlocked({
      reason: "invalid_input",
      message: "The manual workout delete review payload is invalid.",
    });
  }

  const target = await resolveManualWorkoutDeleteClearTarget(userId, parsed.data, dependencies);

  if (!target.ok) {
    return buildDeleteClearBlocked(target);
  }

  return {
    ok: true,
    status: "review_ready",
    persisted: false,
    sourceKind: target.targetWorkout.origin_kind,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: target.targetWorkout.plan_cycle_id,
    plannedWorkoutId: target.targetWorkout.id,
    workoutDate: target.targetWorkout.workout_date,
    title: target.targetWorkout.title,
    templateKey: target.review.templateKey,
    review: target.review,
    restore: target.restore,
    safety: {
      requiresExplicitConfirm: true,
      targetWorkoutVerified: true,
      runnerOwnershipVerified: true,
      protectedHistoryChecked: true,
      lastWorkoutDeleteAllowed: true,
      trustedClientRows: false,
      callsOpenAi: false,
    },
  };
}

export async function confirmManualWorkoutDeleteClearForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutDeleteClearDependencies = {},
): Promise<ManualWorkoutDeleteClearConfirmResult> {
  const parsed = manualWorkoutDeleteClearConfirmInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildDeleteClearBlocked({
      reason: "invalid_review",
      message: "The manual workout delete confirmation payload is invalid. Refresh the review.",
    });
  }

  const target = await resolveManualWorkoutDeleteClearTarget(userId, parsed.data, dependencies);

  if (!target.ok) {
    return buildDeleteClearBlocked(target);
  }

  const reviewProof = validateManualWorkoutReviewProof({
    expectedChecksum: target.review.reviewChecksum,
    reviewChecksum: parsed.data.reviewChecksum,
    reviewToken: parsed.data.reviewToken,
    tokenPrefix: MANUAL_WORKOUT_DELETE_REVIEW_TOKEN_PREFIX,
  });

  if (!reviewProof.ok && reviewProof.reason === "stale_review") {
    return buildDeleteClearBlocked({
      reason: "stale_review",
      message: "This workout delete review no longer matches the Calendar row.",
    });
  }

  if (!reviewProof.ok) {
    return buildDeleteClearBlocked({
      reason: "invalid_review",
      message: "This manual workout delete review token is invalid. Refresh the review.",
    });
  }

  const persistDelete = dependencies.persistWorkoutDelete ?? persistManualWorkoutDeleteClear;

  try {
    const persisted = await persistDelete({
      userId,
      currentDate: target.currentDate,
      targetWorkout: target.targetWorkout,
      remainingWorkouts: target.remainingWorkouts,
      review: target.review,
    });

    return {
      ok: true,
      status: "deleted",
      persisted: true,
      sourceKind: target.targetWorkout.origin_kind,
      sourceStatus: null,
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      activePlanId: target.targetWorkout.plan_cycle_id,
      plannedWorkoutId: target.targetWorkout.id,
      workoutDate: target.targetWorkout.workout_date,
      title: target.targetWorkout.title,
      templateKey: target.review.templateKey,
      reviewChecksum: target.review.reviewChecksum,
      exactnessPayloadVersion: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
      calendarRowCount: target.remainingWorkouts.length,
      nonRestWorkoutCount: target.remainingWorkouts.filter(
        (workout) => workout.workout_type !== "rest",
      ).length,
      restore: target.restore,
      safety: {
        requiresExplicitConfirm: true,
        targetWorkoutVerified: true,
        runnerOwnershipVerified: true,
        protectedHistoryChecked: true,
        deletedExactlyOneRow: true,
        sourceProvenanceUnchanged: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        callsOpenAi: false,
      },
    };
  } catch (error) {
    if (error instanceof CalendarPersistenceRejection) {
      return buildDeleteClearBlocked({
        reason:
          error.reason === "stale_review" || error.reason === "protected_day"
            ? error.reason
            : "persistence_failed",
        message: error.message,
      });
    }

    return buildDeleteClearBlocked({
      reason: "persistence_failed",
      message: "The workout could not be deleted. The Calendar is unchanged.",
    });
  }
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
    reviewPayloadVersion: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
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
    expectedSourceWorkout: buildFullSourceWorkoutFingerprint(targetWorkout) as unknown as Json,
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
  input: ManualWorkoutDeleteClearReviewInput | ManualWorkoutDeleteClearConfirmInput,
  dependencies: ManualWorkoutDeleteClearDependencies,
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

  const restore = buildRestoreAffordance(target.workout);
  if (!restore.ok) {
    return restore;
  }

  const remainingWorkouts = planContext.existingWorkouts.workouts.filter(
    (workout) => workout.id !== target.workout.id,
  );
  const review = buildDeleteClearReview({
    targetWorkout: target.workout,
    remainingWorkouts,
    templateKey: resolveWorkoutSourceTemplateKey(target.workout, restore.restore),
  });

  return {
    ok: true,
    targetWorkout: target.workout,
    remainingWorkouts,
    restore: restore.restore,
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

function buildRestoreAffordance(
  workout: PersistedPlannedWorkoutRow,
):
  | { ok: true; restore: ManualWorkoutDeleteRestoreAffordance }
  | { ok: false; reason: ManualWorkoutDeleteClearFailureReason; message: string } {
  if (persistedManualWorkoutHasUnsafeMetricTruth(workout)) {
    return {
      ok: true,
      restore: unavailableRestoreAffordance(
        "This workout can be cleared, but restoring metric targets requires a supported workout editor.",
      ),
    };
  }

  const draft = buildManualWorkoutDraftInputFromPersistedWorkout(workout, workout.workout_date);

  if (!draft.ok) {
    return {
      ok: true,
      restore: unavailableRestoreAffordance(draft.message),
    };
  }

  const review = reviewManualWorkoutDraft(draft.draftInput);
  if (!review.ok) {
    return {
      ok: true,
      restore: unavailableRestoreAffordance(review.message),
    };
  }

  return {
    ok: true,
    restore: {
      available: true,
      label: "Restore",
      alternateLabels: ["Put back", "Redo"],
      draftInput: draft.draftInput,
      review,
      safety: {
        reviewedThroughManualAuthoring: true,
        trustedClientRows: false,
        targetDateDerivedServerSide: true,
      },
    },
  };
}

function unavailableRestoreAffordance(message: string): ManualWorkoutDeleteRestoreAffordance {
  return {
    available: false,
    label: "Restore",
    alternateLabels: ["Put back", "Redo"],
    reason: "restore_requires_editor_support",
    message:
      message ||
      "This workout can be cleared, but restoring it requires a supported workout editor.",
    safety: {
      reviewedThroughManualAuthoring: false,
      trustedClientRows: false,
      targetDateDerivedServerSide: true,
    },
  };
}

function resolveWorkoutSourceTemplateKey(
  workout: PersistedPlannedWorkoutRow,
  restore: ManualWorkoutDeleteRestoreAffordance,
) {
  if (restore.available) {
    return restore.draftInput.templateKey;
  }

  if (typeof workout.source_workout_type === "string" && workout.source_workout_type.trim()) {
    return workout.source_workout_type.trim();
  }

  return workout.workout_type;
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
    reviewToken: buildManualWorkoutReviewToken(
      MANUAL_WORKOUT_DELETE_REVIEW_TOKEN_PREFIX,
      reviewChecksum,
    ),
    reviewChecksum,
    exactnessPayloadVersion: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
  };
}

function buildDeleteClearExactnessPayload(input: {
  targetWorkout: PersistedPlannedWorkoutRow;
  remainingWorkouts: readonly PersistedPlannedWorkoutRow[];
  templateKey: string;
}) {
  return {
    version: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
    sourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    originKind: input.targetWorkout.origin_kind,
    sourcePlanId: input.targetWorkout.plan_cycle_id,
    plannedWorkoutId: input.targetWorkout.id,
    workoutDate: input.targetWorkout.workout_date,
    title: input.targetWorkout.title,
    templateKey: input.templateKey,
    sourceWorkoutType: input.targetWorkout.source_workout_type,
    workoutType: input.targetWorkout.workout_type,
    workoutFamily: input.targetWorkout.workout_family,
    workoutIdentity: input.targetWorkout.workout_identity,
    sourceFingerprint: buildFullSourceWorkoutFingerprint(input.targetWorkout),
    remainingWorkoutIds: input.remainingWorkouts.map((workout) => workout.id).sort(),
    remainingRowCount: input.remainingWorkouts.length,
    remainingNonRestRowCount: input.remainingWorkouts.filter(
      (workout) => workout.workout_type !== "rest",
    ).length,
  };
}

function buildDeleteClearBlocked(input: {
  reason: ManualWorkoutDeleteClearFailureReason;
  message: string;
}): ManualWorkoutDeleteClearBlockedResult {
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
