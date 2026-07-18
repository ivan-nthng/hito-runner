import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  ACTIVE_PLAN_USER_EDIT_MUTATION_KIND,
  ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
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
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutReviewExactnessFailureReason,
} from "@/lib/manual-workout-authoring/schema";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import { getCurrentManualWorkoutAuthoringUserId } from "@/lib/manual-workout-authoring/request-auth";

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
    activePlanId: z.string().uuid(),
    sourceWorkoutId: z.string().uuid(),
    sourceWorkoutDate: isoDateSchema,
    targetDate: isoDateSchema,
  })
  .strict();

type ManualWorkoutCopyPasteReviewInput = z.output<typeof manualWorkoutCopyPasteReviewInputSchema>;
type ManualWorkoutCopyPasteConfirmInput = z.output<typeof manualWorkoutCopyPasteConfirmInputSchema>;

type ManualWorkoutCopyPasteBlockedResult = {
  ok: false;
  status: "blocked";
  persisted: false;
  reason: ManualWorkoutCopyPasteFailureReason;
  message: string;
  sourceKind: typeof MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
  workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
};

export type ManualWorkoutCopyPasteReviewResult =
  | {
      ok: true;
      status: "draft_ready";
      persisted: false;
      sourceKind: typeof MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string;
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
      sourceKind: typeof MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
      sourceStatus: string | null;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string;
      sourceWorkoutId: string;
      sourceWorkoutDate: string;
      targetWorkoutId: string;
      targetDate: string;
      targetWeekday: string;
      title: string;
      templateKey: ManualWorkoutDraftInput["templateKey"];
      mutationMode: "direct_manual_edit";
      mutationPayloadVersion: typeof MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION;
      mutationChecksum: string;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      sourceMetadata: Extract<
        ManualWorkoutAddToActivePlanResult,
        { ok: true }
      >["sourceMetadata"] & {
        mutationKind: typeof ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.copyWorkout;
        mutationMode: "direct_manual_edit";
        mutationPayloadVersion: typeof MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION;
        mutationChecksum: string;
        sourceWorkoutId: string;
        sourceWorkoutDate: string;
        targetWorkoutId: string;
      };
      safety: {
        requiresExplicitConfirm: false;
        directMutation: true;
        sourceWorkoutVerified: true;
        reconstructedFromPersistedWorkout: true;
        reviewedThroughManualAuthoring: true;
        targetDayKind: "rest_day";
        targetDateDerivedServerSide: true;
        trustedClientRows: false;
        serverRebuiltReview: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutCopyPasteBlockedResult;

export type ManualWorkoutCopyPasteDependencies = ManualWorkoutActivePlanAddDependencies;

export const reviewManualWorkoutCopyPasteDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutCopyPasteReviewResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();

    if (!userId) {
      return buildCopyPasteBlocked({
        reason: "unauthenticated",
        message: "Sign in before copying manual workouts.",
      });
    }

    return reviewManualWorkoutCopyPasteDraftForUser(userId, data);
  });

export const confirmManualWorkoutCopyPasteDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutCopyPasteConfirmResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();

    if (!userId) {
      return buildCopyPasteBlocked({
        reason: "unauthenticated",
        message: "Sign in before pasting manual workouts.",
      });
    }

    return confirmManualWorkoutCopyPasteDraftForUser(userId, data);
  });

export const copyManualWorkoutWithinActivePlan = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
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
    });
  }

  return {
    ok: true,
    status: "draft_ready",
    persisted: false,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
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
    });
  }

  const addResult = await addReviewedManualWorkoutToActivePlanForUser(
    userId,
    exactness,
    dependencies,
    parsed.data.activePlanId ?? reconstruction.activePlanId,
  );

  if (!addResult.ok) {
    return buildCopyPasteBlocked({
      reason: addResult.reason,
      message: addResult.message,
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
  dependencies: ManualWorkoutCopyPasteDependencies = {},
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
    });
  }

  const exactness = validateManualWorkoutReviewExactness({
    draftInput: reconstruction.draftInput,
    reviewToken: review.reviewToken,
    reviewChecksum: review.reviewChecksum,
  });

  if (!exactness.ok) {
    return buildCopyPasteBlocked({
      reason: mapAddFailureReason(exactness.reason),
      message: exactness.message,
    });
  }

  const mutationChecksum = buildDirectCopyMutationChecksum({
    activePlanId: reconstruction.activePlanId,
    sourceWorkoutId: reconstruction.sourceWorkout.id,
    sourceWorkoutDate: reconstruction.sourceWorkout.workout_date,
    targetDate: parsed.data.targetDate,
    targetWeekday: review.draft.weekday,
    templateKey: review.draft.templateKey,
    reviewChecksum: review.reviewChecksum,
  });

  const addResult = await addReviewedManualWorkoutToActivePlanForUser(
    userId,
    {
      ...exactness,
      activePlanUserEdit: {
        mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.copyWorkout,
        mutationMode: "direct_manual_edit",
        mutationPayloadVersion: MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION,
        mutationChecksum,
        sourceWorkoutId: reconstruction.sourceWorkout.id,
        sourceWorkoutDate: reconstruction.sourceWorkout.workout_date,
        trustedClientRows: false,
      },
    },
    dependencies,
    parsed.data.activePlanId,
  );

  if (!addResult.ok) {
    return buildCopyPasteBlocked({
      reason: addResult.reason,
      message: addResult.message,
    });
  }

  return {
    ok: true,
    status: "copied",
    persisted: true,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    sourceStatus: addResult.sourceStatus,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: addResult.activePlanId,
    sourceWorkoutId: reconstruction.sourceWorkout.id,
    sourceWorkoutDate: reconstruction.sourceWorkout.workout_date,
    targetWorkoutId: addResult.plannedWorkoutId,
    targetDate: parsed.data.targetDate,
    targetWeekday: review.draft.weekday,
    title: review.draft.title,
    templateKey: review.draft.templateKey,
    mutationMode: "direct_manual_edit",
    mutationPayloadVersion: MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION,
    mutationChecksum,
    calendarRowCount: addResult.calendarRowCount,
    nonRestWorkoutCount: addResult.nonRestWorkoutCount,
    sourceMetadata: {
      ...addResult.sourceMetadata,
      mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.copyWorkout,
      mutationMode: "direct_manual_edit",
      mutationPayloadVersion: MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION,
      mutationChecksum,
      sourceWorkoutId: reconstruction.sourceWorkout.id,
      sourceWorkoutDate: reconstruction.sourceWorkout.workout_date,
      targetWorkoutId: addResult.plannedWorkoutId,
    },
    safety: {
      requiresExplicitConfirm: false,
      directMutation: true,
      sourceWorkoutVerified: true,
      reconstructedFromPersistedWorkout: true,
      reviewedThroughManualAuthoring: true,
      targetDayKind: "rest_day",
      targetDateDerivedServerSide: true,
      trustedClientRows: false,
      serverRebuiltReview: true,
      callsOpenAi: false,
    },
  };
}

function buildCopyPasteBlocked(input: {
  reason: ManualWorkoutCopyPasteFailureReason;
  message: string;
}): ManualWorkoutCopyPasteBlockedResult {
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

function mapAddFailureReason(
  reason: ManualWorkoutReviewExactnessFailureReason,
): ManualWorkoutCopyPasteFailureReason {
  return reason;
}

function buildDirectCopyMutationChecksum(input: {
  activePlanId: string;
  sourceWorkoutId: string;
  sourceWorkoutDate: string;
  targetDate: string;
  targetWeekday: string;
  templateKey: ManualWorkoutDraftInput["templateKey"];
  reviewChecksum: string;
}) {
  return stableManualWorkoutChecksum64Hex({
    version: MANUAL_WORKOUT_DIRECT_COPY_PAYLOAD_VERSION,
    sourceKind: ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
    mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.copyWorkout,
    activePlanId: input.activePlanId,
    sourceWorkoutId: input.sourceWorkoutId,
    sourceWorkoutDate: input.sourceWorkoutDate,
    targetDate: input.targetDate,
    targetWeekday: input.targetWeekday,
    templateKey: input.templateKey,
    reviewChecksum: input.reviewChecksum,
    trustedClientRows: false,
  });
}

function inputHasClientPayload(error: z.ZodError) {
  return error.issues.some((issue) => issue.code === "unrecognized_keys");
}
