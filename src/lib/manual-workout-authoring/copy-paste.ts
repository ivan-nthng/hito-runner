import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getCalendarWorkoutMutationContext,
  type PersistedPlannedWorkoutRow,
} from "@/lib/active-plan-persistence";
import {
  CalendarPersistenceRejection,
  applyAtomicCalendarWorkoutMutation,
} from "@/lib/active-plan-lifecycle-persistence";
import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  buildCalendarWorkoutMutationEvent,
} from "@/lib/active-plan-workout-editing/policy";
import {
  addReviewedManualWorkoutToActivePlanForUser,
  type ManualWorkoutActivePlanAddDependencies,
} from "@/lib/manual-workout-authoring/active-plan-add";
import {
  reviewManualWorkoutDraft,
  validateManualWorkoutReviewExactness,
} from "@/lib/manual-workout-authoring/actions";
import {
  reconstructManualWorkoutCopyDraftForUser,
  type ManualWorkoutCopyPasteFailureReason,
} from "@/lib/manual-workout-authoring/copy-paste-reconstruction";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  inputHasClientPayload,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutReviewExactnessFailureReason,
} from "@/lib/manual-workout-authoring/schema";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import { getCurrentManualWorkoutAuthoringUserId } from "@/lib/manual-workout-authoring/request-auth";
import { buildFullSourceWorkoutFingerprint } from "@/lib/manual-workout-authoring/edit-workout-review-token";
import {
  buildPersistedWorkoutInsertRows,
  persistedWorkoutRowToImportedSeed,
} from "@/lib/persisted-plan-replacement";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import type { Json } from "@/lib/supabase/database";
import { weekdayLong } from "@/lib/training";

export type { ManualWorkoutCopyPasteFailureReason } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION = "manual_workout_direct_copy_v1" as const;

const manualWorkoutCopyPasteBaseInputSchema = z
  .object({
    activePlanId: z.string().uuid().optional(),
    sourceWorkoutId: z.string().uuid().optional(),
    sourceWorkoutDate: isoDateSchema.optional(),
    targetDate: isoDateSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const sourceReferences = [value.sourceWorkoutId, value.sourceWorkoutDate].filter(Boolean);

    if (sourceReferences.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one source workout id or source workout date.",
        path: ["sourceWorkoutId"],
      });
    }
  });

export const manualWorkoutCopyPasteReviewInputSchema = manualWorkoutCopyPasteBaseInputSchema;

export const manualWorkoutCopyPasteConfirmInputSchema = z
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
    const sourceReferences = [value.sourceWorkoutId, value.sourceWorkoutDate].filter(Boolean);

    if (sourceReferences.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one source workout id or source workout date.",
        path: ["sourceWorkoutId"],
      });
    }
  });

export const manualWorkoutDirectCopyInputSchema = z
  .object({
    activePlanId: z.string().uuid().optional(),
    sourceWorkoutId: z.string().uuid(),
    sourceWorkoutDate: isoDateSchema,
    targetDate: isoDateSchema,
  })
  .strict();

type ManualWorkoutCopyPasteBlockedResult = {
  ok: false;
  status: "blocked";
  persisted: false;
  reason: ManualWorkoutCopyPasteFailureReason;
  message: string;
  sourceKind: string | null;
  workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
};

export type ManualWorkoutCopyPasteReviewResult =
  | {
      ok: true;
      status: "draft_ready";
      persisted: false;
      sourceKind: string;
      sourceStatus: string | null;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string | null;
      sourceWorkoutId: string;
      sourceWorkoutDate: string;
      targetDate: string;
      draftInput: ManualWorkoutDraftInput;
      review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
      safety: {
        sourceWorkoutVerified: true;
        reconstructedFromPersistedWorkout: true;
        reviewedThroughManualAuthoring: true;
        trustedClientRows: false;
        targetDateDerivedServerSide: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutCopyPasteBlockedResult;

export type ManualWorkoutCopyPasteConfirmResult =
  | (Extract<ManualWorkoutAddToActivePlanResult, { ok: true }> & {
      sourceWorkoutId: string;
      sourceWorkoutDate: string;
      targetDate: string;
      safety: Extract<ManualWorkoutAddToActivePlanResult, { ok: true }>["safety"] & {
        sourceWorkoutVerified: true;
        reconstructedFromPersistedWorkout: true;
      };
    })
  | ManualWorkoutCopyPasteBlockedResult;

export type ManualWorkoutDirectCopyResult =
  | {
      ok: true;
      status: "copied";
      persisted: true;
      sourceKind: string;
      sourceStatus: string | null;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string | null;
      sourceWorkoutId: string;
      sourceWorkoutDate: string;
      targetWorkoutId: string;
      targetDate: string;
      targetWeekday: string;
      title: string;
      templateKey: ManualWorkoutDraftInput["templateKey"] | null;
      mutationMode: "direct_manual_edit";
      mutationPayloadVersion: typeof MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION;
      mutationChecksum: string;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      sourceMetadata: {
        mutationKind: typeof CALENDAR_WORKOUT_MUTATION_KIND.copyWorkout;
        mutationMode: "direct_manual_edit";
        mutationPayloadVersion: typeof MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION;
        mutationChecksum: string;
        sourceWorkoutId: string;
        sourceWorkoutDate: string;
        targetWorkoutId: string;
        targetDate: string;
        prescriptionSource: "persisted_planned_workout";
      };
      safety: {
        requiresExplicitConfirm: false;
        directMutation: true;
        sourceWorkoutVerified: true;
        reconstructedFromPersistedWorkout: false;
        reviewedThroughManualAuthoring: false;
        prescriptionCopiedFromPersistedWorkout: true;
        targetDayKind: "empty_day";
        targetDateDerivedServerSide: true;
        trustedClientRows: false;
        serverRebuiltReview: false;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutCopyPasteBlockedResult;

export type ManualWorkoutCopyPasteDependencies = ManualWorkoutActivePlanAddDependencies;

export interface ManualWorkoutDirectCopyDependencies extends ManualWorkoutCopyPasteDependencies {
  persistWorkoutCopy?: typeof persistCanonicalCalendarWorkoutCopy;
}

export const copyManualWorkoutWithinActivePlan = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutDirectCopyResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();

    if (!userId) {
      return buildCopyPasteBlocked({
        reason: "unauthenticated",
        message: "Sign in before pasting manual workouts.",
      });
    }

    return copyManualWorkoutWithinActivePlanForUser(userId, data);
  });

export async function reviewManualWorkoutCopyPasteDraftForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutCopyPasteDependencies = {},
): Promise<ManualWorkoutCopyPasteReviewResult> {
  const parsed = manualWorkoutCopyPasteReviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildCopyPasteBlocked({
      reason: "invalid_input",
      message: "The manual workout copy review payload is invalid.",
    });
  }

  const reconstruction = await reconstructManualWorkoutCopyDraftForUser(
    userId,
    parsed.data,
    dependencies,
  );

  if (!reconstruction.ok) {
    return buildCopyPasteBlocked(reconstruction);
  }

  const review = reviewManualWorkoutDraft(reconstruction.draftInput);

  if (!review.ok) {
    return buildCopyPasteBlocked({
      reason: review.reason,
      message: review.message,
      sourceKind: reconstruction.sourceKind,
    });
  }

  return {
    ok: true,
    status: "draft_ready",
    persisted: false,
    sourceKind: reconstruction.sourceKind,
    sourceStatus: reconstruction.sourceStatus,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: reconstruction.activePlanId,
    sourceWorkoutId: reconstruction.sourceWorkout.id,
    sourceWorkoutDate: reconstruction.sourceWorkout.workout_date,
    targetDate: parsed.data.targetDate,
    draftInput: reconstruction.draftInput,
    review,
    safety: {
      sourceWorkoutVerified: true,
      reconstructedFromPersistedWorkout: true,
      reviewedThroughManualAuthoring: true,
      trustedClientRows: false,
      targetDateDerivedServerSide: true,
      callsOpenAi: false,
    },
  };
}

export async function confirmManualWorkoutCopyPasteDraftForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutCopyPasteDependencies = {},
): Promise<ManualWorkoutCopyPasteConfirmResult> {
  const parsed = manualWorkoutCopyPasteConfirmInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildCopyPasteBlocked({
      reason: "invalid_review",
      message: "The manual workout paste confirmation payload is invalid. Refresh the review.",
    });
  }

  const reconstruction = await reconstructManualWorkoutCopyDraftForUser(
    userId,
    parsed.data,
    dependencies,
  );

  if (!reconstruction.ok) {
    return buildCopyPasteBlocked(reconstruction);
  }

  const exactness = validateManualWorkoutReviewExactness({
    draftInput: reconstruction.draftInput,
    reviewToken: parsed.data.reviewToken,
    reviewChecksum: parsed.data.reviewChecksum,
  });

  if (!exactness.ok) {
    return buildCopyPasteBlocked({
      reason: mapAddFailureReason(exactness.reason),
      message: exactness.message,
      sourceKind: reconstruction.sourceKind,
    });
  }

  const addResult = await addReviewedManualWorkoutToActivePlanForUser(
    userId,
    {
      ...exactness,
      activePlanUserEdit: {
        mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.copyWorkout,
        mutationChecksum: exactness.reviewChecksum,
        sourceWorkoutId: reconstruction.sourceWorkout.id,
        sourceWorkoutDate: reconstruction.sourceWorkout.workout_date,
        trustedClientRows: false,
      },
    },
    dependencies,
  );

  if (!addResult.ok) {
    return buildCopyPasteBlocked({
      reason: addResult.reason,
      message: addResult.message,
      sourceKind: reconstruction.sourceKind,
    });
  }

  return {
    ...addResult,
    sourceWorkoutId: reconstruction.sourceWorkout.id,
    sourceWorkoutDate: reconstruction.sourceWorkout.workout_date,
    targetDate: parsed.data.targetDate,
    safety: {
      ...addResult.safety,
      sourceWorkoutVerified: true,
      reconstructedFromPersistedWorkout: true,
    },
  };
}

export async function copyManualWorkoutWithinActivePlanForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutDirectCopyDependencies = {},
): Promise<ManualWorkoutDirectCopyResult> {
  const parsed = manualWorkoutDirectCopyInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildCopyPasteBlocked({
      reason: inputHasClientPayload(parsed.error) ? "client_payload_rejected" : "invalid_input",
      message: inputHasClientPayload(parsed.error)
        ? "Manual workout direct copy accepts only source and target identifiers."
        : "The manual workout direct copy payload is invalid.",
    });
  }

  const getContext =
    dependencies.getCalendarWorkoutContextForUser ?? getCalendarWorkoutMutationContext;
  const currentDate = dependencies.currentDate ?? (await getRunnerCalendarDateForUserId(userId));
  let planContext;

  try {
    planContext = await getContext(userId);
  } catch {
    return buildCopyPasteBlocked({
      reason: "persistence_failed",
      message: "The calendar could not verify the persisted workout copy source.",
    });
  }

  const sourceWorkout = planContext.existingWorkouts.workouts.find(
    (workout) => workout.id === parsed.data.sourceWorkoutId,
  );

  if (!sourceWorkout || sourceWorkout.user_id !== userId) {
    return buildCopyPasteBlocked({
      reason: "source_workout_not_found",
      message: "The copied source workout is no longer available.",
    });
  }

  if (sourceWorkout.workout_date !== parsed.data.sourceWorkoutDate) {
    return buildCopyPasteBlocked({
      reason: "source_date_changed",
      message: "The copied source workout moved. Copy it again from Calendar.",
    });
  }

  if (sourceWorkout.workout_type === "rest") {
    return buildCopyPasteBlocked({
      reason: "source_workout_not_supported",
      message: "Rest rows are not workout prescriptions and cannot be copied.",
    });
  }

  if (parsed.data.targetDate < currentDate) {
    return buildCopyPasteBlocked({
      reason: "protected_day",
      message: "Copied workouts can only be pasted on today or a future empty date.",
    });
  }

  if (
    planContext.existingWorkouts.workouts.some(
      (workout) => workout.workout_date === parsed.data.targetDate,
    )
  ) {
    return buildCopyPasteBlocked({
      reason: "occupied_day",
      message: "Paste requires a truly empty date; existing workouts and Rest rows stay unchanged.",
    });
  }

  const targetWeekday = weekdayLong(parsed.data.targetDate);
  const sourceKind = sourceWorkout.origin_kind;
  const mutationChecksum = stableManualWorkoutChecksum64Hex({
    version: MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION,
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.copyWorkout,
    sourceWorkoutId: sourceWorkout.id,
    sourceWorkoutDate: sourceWorkout.workout_date,
    targetDate: parsed.data.targetDate,
  });
  const workoutSeed = {
    ...persistedWorkoutRowToImportedSeed(sourceWorkout, {
      displayOrder: resolveNextCalendarDisplayOrder(planContext.existingWorkouts.workouts),
      normalizeSteps: false,
    }),
    workoutDate: parsed.data.targetDate,
    weekday: targetWeekday,
    weekNumber: sourceWorkout.week_number,
  };
  const persistCopy = dependencies.persistWorkoutCopy ?? persistCanonicalCalendarWorkoutCopy;
  let persisted;

  try {
    persisted = await persistCopy({
      userId,
      currentDate,
      sourceWorkout,
      workoutSeed,
      mutationChecksum,
    });
  } catch (error) {
    if (error instanceof CalendarPersistenceRejection) {
      return buildCopyPasteBlocked({
        reason:
          error.reason === "stale_review" || error.reason === "protected_day"
            ? error.reason
            : "persistence_failed",
        message: error.message,
        sourceKind,
      });
    }

    return buildCopyPasteBlocked({
      reason: "persistence_failed",
      message: "The copied workout could not be persisted. The calendar is unchanged.",
      sourceKind,
    });
  }

  return {
    ok: true,
    status: "copied",
    persisted: true,
    sourceKind,
    sourceStatus: null,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: sourceWorkout.plan_cycle_id,
    sourceWorkoutId: sourceWorkout.id,
    sourceWorkoutDate: sourceWorkout.workout_date,
    targetWorkoutId: persisted.plannedWorkout.id,
    targetDate: parsed.data.targetDate,
    targetWeekday,
    title: sourceWorkout.title,
    templateKey: null,
    mutationMode: "direct_manual_edit",
    mutationPayloadVersion: MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION,
    mutationChecksum,
    calendarRowCount: planContext.existingWorkouts.workouts.length + 1,
    nonRestWorkoutCount:
      planContext.existingWorkouts.workouts.filter((workout) => workout.workout_type !== "rest")
        .length + 1,
    sourceMetadata: {
      mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.copyWorkout,
      mutationMode: "direct_manual_edit",
      mutationPayloadVersion: MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION,
      mutationChecksum,
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetWorkoutId: persisted.plannedWorkout.id,
      targetDate: parsed.data.targetDate,
      prescriptionSource: "persisted_planned_workout",
    },
    safety: {
      requiresExplicitConfirm: false,
      directMutation: true,
      sourceWorkoutVerified: true,
      reconstructedFromPersistedWorkout: false,
      reviewedThroughManualAuthoring: false,
      prescriptionCopiedFromPersistedWorkout: true,
      targetDayKind: "empty_day",
      targetDateDerivedServerSide: true,
      trustedClientRows: false,
      serverRebuiltReview: false,
      callsOpenAi: false,
    },
  };
}

async function persistCanonicalCalendarWorkoutCopy(input: {
  userId: string;
  currentDate: string;
  sourceWorkout: PersistedPlannedWorkoutRow;
  workoutSeed: ReturnType<typeof persistedWorkoutRowToImportedSeed>;
  mutationChecksum: string;
}) {
  const [insertRow] = buildPersistedWorkoutInsertRows(
    input.sourceWorkout.plan_cycle_id,
    input.userId,
    [input.workoutSeed],
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
    targetDate: input.workoutSeed.workoutDate,
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
    expectedSourceWorkout: buildFullSourceWorkoutFingerprint(
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

function buildCopyPasteBlocked(input: {
  reason: ManualWorkoutCopyPasteFailureReason;
  message: string;
  sourceKind?: string | null;
}): ManualWorkoutCopyPasteBlockedResult {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: input.reason,
    message: input.message,
    sourceKind: input.sourceKind ?? null,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  };
}

function mapAddFailureReason(
  reason: ManualWorkoutReviewExactnessFailureReason,
): ManualWorkoutCopyPasteFailureReason {
  return reason;
}
