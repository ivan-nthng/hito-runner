import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestAuthContext } from "@/lib/backend/auth";
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
  type ManualWorkoutConfirmFailureReason,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "@/lib/manual-workout-authoring/schema";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";

export type { ManualWorkoutCopyPasteFailureReason } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

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

export type ManualWorkoutCopyPasteDependencies = ManualWorkoutActivePlanAddDependencies;

export const reviewManualWorkoutCopyPasteDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutCopyPasteReviewResult> => {
    const userId = await getCurrentPersistedUserId();

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
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildCopyPasteBlocked({
        reason: "unauthenticated",
        message: "Sign in before pasting manual workouts.",
      });
    }

    return confirmManualWorkoutCopyPasteDraftForUser(userId, data);
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
  reason: ManualWorkoutConfirmFailureReason,
): ManualWorkoutCopyPasteFailureReason {
  return reason === "active_plan_exists" ? "active_plan_conflict" : reason;
}

async function getCurrentPersistedUserId() {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    return null;
  }

  try {
    return await getPersistedUserIdForAuthContext(auth);
  } catch {
    return null;
  }
}
