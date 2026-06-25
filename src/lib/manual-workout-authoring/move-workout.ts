import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  ACTIVE_PLAN_USER_EDIT_MUTATION_KIND,
  ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
  appendActivePlanUserEditMetadataToRecord,
  buildActivePlanUserEditMetadata,
  resolveActivePlanSourceStatus,
  resolveActivePlanWorkoutEditability,
} from "@/lib/active-plan-workout-editing/policy";
import {
  getExistingPlanContext,
  type ExistingPlanContext,
  type PersistedPlanCycleRow,
  type PersistedPlannedWorkoutRow,
} from "@/lib/active-plan-persistence";
import { getRequestAuthContext } from "@/lib/backend/auth";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  isProtectedManualWorkoutTarget,
  type ManualWorkoutActivePlanAddDependencies,
  type ManualWorkoutEvidenceFetcher,
} from "@/lib/manual-workout-authoring/active-plan-add";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";
import { reviewManualWorkoutDraft } from "@/lib/manual-workout-authoring/actions";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "@/lib/manual-workout-authoring/schema";
import { persistedManualWorkoutHasUnsafeMetricTruth } from "@/lib/manual-workout-authoring/persisted-workout-safety";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { diffDaysIso, todayIso, weekdayLong } from "@/lib/training";

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
    activePlanId: z.string().uuid(),
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
  | "no_active_plan"
  | "unsupported_active_plan_source"
  | "unsupported_source_metadata"
  | "source_workout_not_found"
  | "source_workout_not_in_active_plan"
  | "source_workout_not_supported"
  | "source_date_changed"
  | "client_payload_rejected"
  | "target_date_unchanged"
  | "protected_day"
  | "occupied_day"
  | "replacement_requires_review"
  | "unsafe_target_state"
  | "persistence_failed";

export type ManualWorkoutMoveTargetMode = "empty" | "rest_replacement" | "workout_replacement";

export type ManualWorkoutMoveDependencies = Pick<
  ManualWorkoutActivePlanAddDependencies,
  "getExistingPlanContextForUser" | "currentDate"
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
  targetMode: ManualWorkoutMoveTargetMode;
  targetDayWasEmpty: boolean;
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
      activePlanId: string;
      sourceWorkoutId: string;
      sourceWorkoutDate: string;
      targetDate: string;
      targetWeekday: string;
      targetMode: ManualWorkoutMoveTargetMode;
      targetReplacement: ManualWorkoutMoveReplacementTarget | null;
      title: string;
      templateKey: string;
      draftInput: ManualWorkoutDraftInput | null;
      targetReview: Extract<ManualWorkoutDraftReviewResult, { ok: true }> | null;
      review: ManualWorkoutMoveReview;
      safety: {
        requiresExplicitConfirm: true;
        sourceWorkoutVerified: true;
        activePlanSourceVerified: true;
        protectedHistoryChecked: true;
        targetDayWasEmpty: boolean;
        targetRestRowReplaced: boolean;
        targetWorkoutReplaced: boolean;
        targetWeekdayDerivedServerSide: true;
        lastWorkoutMoveAllowedWithinSamePlan: true;
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
      activePlanId: string;
      plannedWorkoutId: string;
      sourceWorkoutDate: string;
      targetDate: string;
      targetWeekday: string;
      targetMode: ManualWorkoutMoveTargetMode;
      targetReplacement: ManualWorkoutMoveReplacementTarget | null;
      title: string;
      templateKey: string;
      reviewChecksum: string;
      exactnessPayloadVersion: typeof MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      safety: {
        requiresExplicitConfirm: true;
        sourceWorkoutVerified: true;
        activePlanSourceVerified: true;
        protectedHistoryChecked: true;
        movedExactlyOneRow: true;
        sourceDateBecameEmpty: true;
        targetDayWasEmpty: boolean;
        targetRestRowReplaced: boolean;
        targetWorkoutReplaced: boolean;
        targetWeekdayDerivedServerSide: true;
        activePlanRemainsActive: true;
        lastWorkoutMoveAllowedWithinSamePlan: true;
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
      activePlanId: string;
      plannedWorkoutId: string;
      sourceWorkoutDate: string;
      targetDate: string;
      targetWeekday: string;
      targetMode: ManualWorkoutMoveTargetMode;
      targetReplacement: ManualWorkoutMoveReplacementTarget | null;
      title: string;
      templateKey: string;
      mutationMode: "direct_manual_edit";
      mutationPayloadVersion: typeof MANUAL_WORKOUT_DIRECT_MOVE_PAYLOAD_VERSION;
      mutationChecksum: string;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      safety: {
        requiresExplicitConfirm: false;
        directMutation: true;
        sourceWorkoutVerified: true;
        activePlanSourceVerified: true;
        protectedHistoryChecked: true;
        movedExactlyOneRow: true;
        sourceDateBecameEmpty: true;
        targetDayWasEmpty: boolean;
        targetRestRowReplaced: boolean;
        targetWorkoutReplaced: boolean;
        targetWeekdayDerivedServerSide: true;
        activePlanRemainsActive: true;
        lastWorkoutMoveAllowedWithinSamePlan: true;
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
      activePlan: PersistedPlanCycleRow;
      sourceWorkout: PersistedPlannedWorkoutRow;
      otherWorkouts: PersistedPlannedWorkoutRow[];
      draftInput?: ManualWorkoutDraftInput;
      targetReview?: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
      review: ManualWorkoutMoveReview;
      targetWeekNumber: number;
      targetMode: ManualWorkoutMoveTargetMode;
      targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
    }
  | {
      ok: false;
      reason: ManualWorkoutMoveFailureReason;
      message: string;
    };

type PersistManualWorkoutMoveInput = {
  userId: string;
  activePlan: PersistedPlanCycleRow;
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
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutMoveReviewResult> => {
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildMoveBlocked({
        reason: "unauthenticated",
        message: "Sign in before moving manual workouts.",
      });
    }

    return reviewManualWorkoutMoveForUser(userId, data);
  });

export const confirmManualWorkoutMove = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutMoveConfirmResult> => {
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildMoveBlocked({
        reason: "unauthenticated",
        message: "Sign in before moving manual workouts.",
      });
    }

    return confirmManualWorkoutMoveForUser(userId, data);
  });

export const moveManualWorkoutWithinActivePlan = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutDirectMoveResult> => {
    const userId = await getCurrentPersistedUserId();

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
    target.review.targetMode !== "workout_replacement" &&
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
    sourceKind: target.activePlan.source_kind ?? ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: target.activePlan.id,
    sourceWorkoutId: target.sourceWorkout.id,
    sourceWorkoutDate: target.sourceWorkout.workout_date,
    targetDate: target.review.targetDate,
    targetWeekday: target.review.targetWeekday,
    targetMode: target.review.targetMode,
    targetReplacement: target.review.targetReplacement,
    title: target.sourceWorkout.title,
    templateKey: target.review.templateKey,
    draftInput: target.draftInput ?? null,
    targetReview: target.targetReview ?? null,
    review: target.review,
    safety: {
      requiresExplicitConfirm: true,
      sourceWorkoutVerified: true,
      activePlanSourceVerified: true,
      protectedHistoryChecked: true,
      targetDayWasEmpty: target.review.targetDayWasEmpty,
      targetRestRowReplaced: target.review.targetMode === "rest_replacement",
      targetWorkoutReplaced: target.review.targetMode === "workout_replacement",
      targetWeekdayDerivedServerSide: true,
      lastWorkoutMoveAllowedWithinSamePlan: true,
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
    target.review.targetMode !== "workout_replacement" &&
    (!target.draftInput || !target.targetReview)
  ) {
    return buildMoveBlocked({
      reason: "source_workout_not_supported",
      message: "This planned workout row cannot be safely reviewed through the manual draft flow.",
    });
  }

  if (parsed.data.reviewChecksum !== target.review.reviewChecksum) {
    return buildMoveBlocked({
      reason: "stale_review",
      message: "This manual workout move review no longer matches the active plan.",
    });
  }

  const expectedToken = `${MANUAL_WORKOUT_MOVE_REVIEW_TOKEN_PREFIX}${target.review.reviewChecksum}`;
  if (!safeTokenEqual(parsed.data.reviewToken, expectedToken)) {
    return buildMoveBlocked({
      reason: "invalid_review",
      message: "This manual workout move review token is invalid. Refresh the review.",
    });
  }

  const persistMove = dependencies.persistWorkoutMove ?? persistManualWorkoutMove;

  try {
    await persistMove({
      userId,
      activePlan: target.activePlan,
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
    });

    return {
      ok: true,
      status: "moved",
      persisted: true,
      sourceKind: target.activePlan.source_kind ?? ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
      sourceStatus: resolveActivePlanSourceStatus(target.activePlan),
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      activePlanId: target.activePlan.id,
      plannedWorkoutId: target.sourceWorkout.id,
      sourceWorkoutDate: target.sourceWorkout.workout_date,
      targetDate: target.review.targetDate,
      targetWeekday: target.review.targetWeekday,
      targetMode: target.review.targetMode,
      targetReplacement: target.review.targetReplacement,
      title: target.sourceWorkout.title,
      templateKey: target.review.templateKey,
      reviewChecksum: target.review.reviewChecksum,
      exactnessPayloadVersion: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
      calendarRowCount: movedWorkouts.length,
      nonRestWorkoutCount: movedWorkouts.filter((workout) => workout.workout_type !== "rest")
        .length,
      safety: {
        requiresExplicitConfirm: true,
        sourceWorkoutVerified: true,
        activePlanSourceVerified: true,
        protectedHistoryChecked: true,
        movedExactlyOneRow: true,
        sourceDateBecameEmpty: true,
        targetDayWasEmpty: target.review.targetDayWasEmpty,
        targetRestRowReplaced: target.review.targetMode === "rest_replacement",
        targetWorkoutReplaced: target.review.targetMode === "workout_replacement",
        targetWeekdayDerivedServerSide: true,
        activePlanRemainsActive: true,
        lastWorkoutMoveAllowedWithinSamePlan: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildMoveBlocked({
      reason: "persistence_failed",
      message: "The manual workout could not be moved. The active plan is unchanged.",
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

  if (target.review.targetMode === "workout_replacement") {
    return buildMoveBlocked({
      reason: "replacement_requires_review",
      message: "This target day already has a workout. Review and confirm before replacing it.",
    });
  }

  const mutationChecksum = buildDirectMoveMutationChecksum({
    activePlanId: target.activePlan.id,
    sourceWorkoutId: target.sourceWorkout.id,
    sourceWorkoutDate: target.sourceWorkout.workout_date,
    targetDate: target.review.targetDate,
    targetWeekday: target.review.targetWeekday,
    targetMode: target.review.targetMode,
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
    await persistMove({
      userId,
      activePlan: target.activePlan,
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
    });

    return {
      ok: true,
      status: "moved",
      persisted: true,
      sourceKind: target.activePlan.source_kind ?? ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
      sourceStatus: resolveActivePlanSourceStatus(target.activePlan),
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      activePlanId: target.activePlan.id,
      plannedWorkoutId: target.sourceWorkout.id,
      sourceWorkoutDate: target.sourceWorkout.workout_date,
      targetDate: directReview.targetDate,
      targetWeekday: directReview.targetWeekday,
      targetMode: directReview.targetMode,
      targetReplacement: directReview.targetReplacement,
      title: target.sourceWorkout.title,
      templateKey: directReview.templateKey,
      mutationMode: "direct_manual_edit",
      mutationPayloadVersion: MANUAL_WORKOUT_DIRECT_MOVE_PAYLOAD_VERSION,
      mutationChecksum,
      calendarRowCount: movedWorkouts.length,
      nonRestWorkoutCount: movedWorkouts.filter((workout) => workout.workout_type !== "rest")
        .length,
      safety: {
        requiresExplicitConfirm: false,
        directMutation: true,
        sourceWorkoutVerified: true,
        activePlanSourceVerified: true,
        protectedHistoryChecked: true,
        movedExactlyOneRow: true,
        sourceDateBecameEmpty: true,
        targetDayWasEmpty: directReview.targetDayWasEmpty,
        targetRestRowReplaced: directReview.targetMode === "rest_replacement",
        targetWorkoutReplaced: directReview.targetMode === "workout_replacement",
        targetWeekdayDerivedServerSide: true,
        activePlanRemainsActive: true,
        lastWorkoutMoveAllowedWithinSamePlan: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildMoveBlocked({
      reason: "persistence_failed",
      message: "The manual workout could not be moved. The active plan is unchanged.",
    });
  }
}

export async function persistManualWorkoutMove({
  userId,
  activePlan,
  sourceWorkout,
  otherWorkouts,
  review,
  targetWeekNumber,
  targetReplacementWorkout,
}: PersistManualWorkoutMoveInput) {
  const supabase = createAdminSupabaseClient();
  let removedReplacementTarget: PersistedPlannedWorkoutRow | null = null;

  if (targetReplacementWorkout) {
    const removed = await supabase
      .from("planned_workouts")
      .delete()
      .eq("id", targetReplacementWorkout.id)
      .eq("user_id", userId)
      .eq("plan_cycle_id", activePlan.id)
      .eq("workout_date", targetReplacementWorkout.workout_date)
      .select("*")
      .single();

    if (removed.error || !removed.data) {
      throw new Error(removed.error?.message ?? "Manual workout replacement target delete failed.");
    }

    removedReplacementTarget = removed.data;
  }

  const updated = await supabase
    .from("planned_workouts")
    .update({
      workout_date: review.targetDate,
      weekday: review.targetWeekday,
      week_number: targetWeekNumber,
    })
    .eq("id", sourceWorkout.id)
    .eq("user_id", userId)
    .eq("plan_cycle_id", activePlan.id)
    .select("*")
    .single();

  if (updated.error || !updated.data) {
    if (removedReplacementTarget) {
      await supabase.from("planned_workouts").insert(removedReplacementTarget);
    }
    throw new Error(updated.error?.message ?? "Manual workout move update failed.");
  }

  const movedWorkouts = buildMovedWorkoutSet({ sourceWorkout, otherWorkouts, review });
  const update = await supabase
    .from("plan_cycles")
    .update({
      end_date: resolveManualPlanEndDateAfterMove(activePlan, movedWorkouts),
      goal_metadata: buildManualWorkoutMoveGoalMetadata({
        activePlan,
        existingGoalMetadata: activePlan.goal_metadata,
        movedWorkouts,
        review,
      }),
      plan_preferences: buildManualWorkoutMovePlanPreferences({
        activePlan,
        existingPlanPreferences: activePlan.plan_preferences,
        review,
      }),
    })
    .eq("id", activePlan.id)
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("source_kind", activePlan.source_kind)
    .select("*")
    .single();

  if (update.error || !update.data) {
    await rollbackMovedSourceWorkout({
      activePlan,
      sourceWorkout,
      supabase,
      userId,
    });
    if (removedReplacementTarget) {
      await supabase.from("planned_workouts").insert(removedReplacementTarget);
    }
    throw new Error(update.error?.message ?? "Manual workout move metadata update failed.");
  }

  return {
    movedWorkout: updated.data,
    planCycle: update.data,
  };
}

async function rollbackMovedSourceWorkout({
  activePlan,
  sourceWorkout,
  supabase,
  userId,
}: {
  activePlan: PersistedPlanCycleRow;
  sourceWorkout: PersistedPlannedWorkoutRow;
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
}) {
  await supabase
    .from("planned_workouts")
    .update({
      workout_date: sourceWorkout.workout_date,
      weekday: sourceWorkout.weekday,
      week_number: sourceWorkout.week_number,
      source_workout_id: sourceWorkout.source_workout_id,
    })
    .eq("id", sourceWorkout.id)
    .eq("user_id", userId)
    .eq("plan_cycle_id", activePlan.id);
}

async function resolveManualWorkoutMoveTarget(
  userId: string,
  input: ManualWorkoutMoveReviewInput | ManualWorkoutMoveConfirmInput,
  dependencies: ManualWorkoutMoveDependencies,
  options: ManualWorkoutMoveResolutionOptions = {},
): Promise<ManualWorkoutMoveTarget> {
  const getContext = dependencies.getExistingPlanContextForUser ?? getExistingPlanContext;
  const fetchEvidence =
    dependencies.fetchEvidenceWorkoutIds ?? fetchManualWorkoutEvidenceWorkoutIds;
  const currentDate = dependencies.currentDate ?? todayIso();

  let planContext: ExistingPlanContext;
  try {
    planContext = await getContext(userId);
  } catch {
    return {
      ok: false,
      reason: "persistence_failed",
      message: "The manual plan could not verify the current active-plan state.",
    };
  }

  const activePlan = planContext.activePlan;
  if (!activePlan) {
    return {
      ok: false,
      reason: "no_active_plan",
      message: "Create or open an active plan before moving workouts.",
    };
  }

  if (input.activePlanId && activePlan.id !== input.activePlanId) {
    return {
      ok: false,
      reason: "stale_review",
      message: "The active manual plan changed. Refresh the calendar and review this move again.",
    };
  }

  const editability = resolveActivePlanWorkoutEditability(activePlan, "move_workout");
  if (!editability.ok) {
    return {
      ok: false,
      reason:
        editability.reason === "unsupported_source_metadata"
          ? "unsupported_source_metadata"
          : "unsupported_active_plan_source",
      message: editability.message,
    };
  }

  const source = resolveMoveSourceWorkout({
    userId,
    activePlanId: activePlan.id,
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
    activePlanStartDate: activePlan.start_date,
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
  const targetResolution = await resolveMoveTargetMode({
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
    options.requiresManualDraftReview !== false &&
    targetResolution.targetMode !== "workout_replacement";

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
      {
        activePlanId: activePlan.id,
        activePlanSourceKind: activePlan.source_kind,
      },
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
  const targetWeekNumber = resolveManualWorkoutWeekNumber(activePlan.start_date, input.targetDate);
  const review = buildMoveReview({
    activePlan,
    sourceWorkout: source.workout,
    otherWorkouts,
    targetDate: input.targetDate,
    targetWeekday: weekdayLong(input.targetDate),
    targetWeekNumber,
    targetMode: targetResolution.targetMode,
    targetReplacementWorkout: targetResolution.targetReplacementWorkout,
    templateKey: targetReview?.draft.templateKey ?? resolveWorkoutSourceTemplateKey(source.workout),
    draftInput,
    targetReview,
  });

  return {
    ok: true,
    activePlan,
    sourceWorkout: source.workout,
    otherWorkouts,
    draftInput,
    targetReview,
    review,
    targetWeekNumber,
    targetMode: targetResolution.targetMode,
    targetReplacementWorkout: targetResolution.targetReplacementWorkout,
  };
}

async function resolveMoveTargetMode(input: {
  userId: string;
  currentDate: string;
  targetDateWorkouts: readonly PersistedPlannedWorkoutRow[];
  logsByWorkoutId: ExistingPlanContext["existingWorkouts"]["logsByWorkoutId"];
  fetchEvidence: ManualWorkoutEvidenceFetcher;
}):
  | {
      ok: true;
      targetMode: ManualWorkoutMoveTargetMode;
      targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
    }
  | { ok: false; reason: ManualWorkoutMoveFailureReason; message: string } {
  if (input.targetDateWorkouts.length === 0) {
    return {
      ok: true,
      targetMode: "empty",
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
    targetMode: targetWorkout.workout_type === "rest" ? "rest_replacement" : "workout_replacement",
    targetReplacementWorkout: targetWorkout,
  };
}

function resolveManualWorkoutMoveDatePolicy(input: {
  sourceWorkoutDate: string;
  targetDate: string;
  currentDate: string;
  activePlanStartDate: string;
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

  if (input.targetDate < input.currentDate || input.targetDate < input.activePlanStartDate) {
    return {
      ok: false,
      reason: "protected_day",
      message:
        "Workout moves can only target today or future supported days inside the current active plan.",
    };
  }

  return {
    ok: true,
    recentMissedUnloggedSource: input.sourceWorkoutDate < input.currentDate,
  };
}

function resolveMoveSourceWorkout(input: {
  userId: string;
  activePlanId: string;
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
      message: "The source workout was not found in the current active plan.",
    };
  }

  const workout = matches[0]!;
  if (workout.user_id !== input.userId || workout.plan_cycle_id !== input.activePlanId) {
    return {
      ok: false,
      reason: "source_workout_not_in_active_plan",
      message: "The source workout is not part of the current runner's active plan.",
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
  activePlan: PersistedPlanCycleRow;
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  targetDate: string;
  targetWeekday: string;
  targetWeekNumber: number;
  targetMode: ManualWorkoutMoveTargetMode;
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
    targetMode: input.targetMode,
    targetDayWasEmpty: input.targetMode === "empty",
    targetReplacement: input.targetReplacementWorkout
      ? buildMoveReplacementTarget(input.targetReplacementWorkout)
      : null,
    title: input.sourceWorkout.title,
    templateKey: input.templateKey,
    reviewToken: `${MANUAL_WORKOUT_MOVE_REVIEW_TOKEN_PREFIX}${reviewChecksum}`,
    reviewChecksum,
    exactnessPayloadVersion: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
  };
}

function buildMoveExactnessPayload(input: {
  activePlan: PersistedPlanCycleRow;
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  targetDate: string;
  targetWeekday: string;
  targetWeekNumber: number;
  targetMode: ManualWorkoutMoveTargetMode;
  targetReplacementWorkout: PersistedPlannedWorkoutRow | null;
  templateKey: string;
  draftInput?: ManualWorkoutDraftInput;
  targetReview?: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
}) {
  return {
    version: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
    sourceKind: ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
    activePlanId: input.activePlan.id,
    activePlanSourceKind: input.activePlan.source_kind,
    sourceWorkoutId: input.sourceWorkout.id,
    sourceWorkoutDate: input.sourceWorkout.workout_date,
    targetDate: input.targetDate,
    targetWeekday: input.targetWeekday,
    targetWeekNumber: input.targetWeekNumber,
    targetMode: input.targetMode,
    targetDayWasEmpty: input.targetMode === "empty",
    targetReplacement: input.targetReplacementWorkout
      ? {
          ...buildMoveReplacementTarget(input.targetReplacementWorkout),
          sourceWorkoutId: input.targetReplacementWorkout.source_workout_id,
          metricMode: input.targetReplacementWorkout.metric_mode,
          steps: input.targetReplacementWorkout.steps,
        }
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
}): PersistedPlannedWorkoutRow[] {
  const replacedWorkoutId = input.review.targetReplacement?.plannedWorkoutId ?? null;

  return [
    ...input.otherWorkouts.filter((workout) => workout.id !== replacedWorkoutId),
    {
      ...input.sourceWorkout,
      workout_date: input.review.targetDate,
      weekday: input.review.targetWeekday,
    },
  ];
}

function buildManualWorkoutMoveGoalMetadata(input: {
  existingGoalMetadata: Json | null;
  movedWorkouts: readonly PersistedPlannedWorkoutRow[];
  review: ManualWorkoutMoveReview;
  activePlan: PersistedPlanCycleRow;
}): Json {
  const editMetadata = buildActivePlanUserEditMetadata({
    activePlan: input.activePlan,
    mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.moveWorkout,
    mutationMode: input.review.mutationMode,
    mutationPayloadVersion: input.review.mutationPayloadVersion,
    mutationChecksum: input.review.mutationChecksum ?? input.review.reviewChecksum,
    plannedWorkoutId: input.review.sourceWorkoutId,
    previousWorkoutDate: input.review.sourceWorkoutDate,
    sourceWorkoutId: input.review.sourceWorkoutId,
    sourceWorkoutDate: input.review.sourceWorkoutDate,
    targetWorkoutId: input.review.sourceWorkoutId,
    reviewChecksum: input.review.reviewChecksum,
    reviewPayloadVersion: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
    targetDate: input.review.targetDate,
    templateKey: input.review.templateKey,
    title: input.review.title,
    trustedClientRows: input.review.trustedClientRows,
    workoutAuthoringSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  });
  const root = appendActivePlanUserEditMetadataToRecord(
    asJsonRecord(input.existingGoalMetadata),
    editMetadata,
  );
  const manualPlan = asJsonRecord(root.manual_user_built_plan);

  if (input.activePlan.source_kind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND) {
    return toJson(root);
  }

  return toJson({
    ...root,
    source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
    manual_user_built_plan: {
      ...manualPlan,
      source_kind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
      source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
      row_count: input.movedWorkouts.length,
      non_rest_row_count: input.movedWorkouts.filter((workout) => workout.workout_type !== "rest")
        .length,
      latest_move_review_payload_version: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
      latest_move_review_checksum: input.review.reviewChecksum,
      latest_moved_workout: {
        planned_workout_id: input.review.sourceWorkoutId,
        source_workout_date: input.review.sourceWorkoutDate,
        target_date: input.review.targetDate,
        target_weekday: input.review.targetWeekday,
        target_mode: input.review.targetMode,
        target_day_was_empty: input.review.targetDayWasEmpty,
        target_replacement: input.review.targetReplacement,
        title: input.review.title,
        template_key: input.review.templateKey,
        review_checksum: input.review.reviewChecksum,
        mutation_mode: input.review.mutationMode,
        mutation_payload_version: input.review.mutationPayloadVersion,
        mutation_checksum: input.review.mutationChecksum,
        trusted_client_rows: input.review.trustedClientRows,
      },
    },
  });
}

function buildManualWorkoutMovePlanPreferences(input: {
  existingPlanPreferences: Json | null;
  review: ManualWorkoutMoveReview;
  activePlan: PersistedPlanCycleRow;
}): Json {
  const editMetadata = buildActivePlanUserEditMetadata({
    activePlan: input.activePlan,
    mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.moveWorkout,
    mutationMode: input.review.mutationMode,
    mutationPayloadVersion: input.review.mutationPayloadVersion,
    mutationChecksum: input.review.mutationChecksum ?? input.review.reviewChecksum,
    plannedWorkoutId: input.review.sourceWorkoutId,
    previousWorkoutDate: input.review.sourceWorkoutDate,
    sourceWorkoutId: input.review.sourceWorkoutId,
    sourceWorkoutDate: input.review.sourceWorkoutDate,
    targetWorkoutId: input.review.sourceWorkoutId,
    reviewChecksum: input.review.reviewChecksum,
    reviewPayloadVersion: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
    targetDate: input.review.targetDate,
    templateKey: input.review.templateKey,
    title: input.review.title,
    trustedClientRows: input.review.trustedClientRows,
    workoutAuthoringSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  });
  const root = appendActivePlanUserEditMetadataToRecord(
    asJsonRecord(input.existingPlanPreferences),
    editMetadata,
  );
  const moveHistory = Array.isArray(root.manual_workout_authoring_moves)
    ? root.manual_workout_authoring_moves
    : [];
  const moveMetadata = {
    planned_workout_id: input.review.sourceWorkoutId,
    source_workout_date: input.review.sourceWorkoutDate,
    target_date: input.review.targetDate,
    target_weekday: input.review.targetWeekday,
    target_mode: input.review.targetMode,
    target_day_was_empty: input.review.targetDayWasEmpty,
    target_replacement: input.review.targetReplacement,
    title: input.review.title,
    template_key: input.review.templateKey,
    review_payload_version: MANUAL_WORKOUT_MOVE_REVIEW_PAYLOAD_VERSION,
    review_checksum: input.review.reviewChecksum,
    mutation_mode: input.review.mutationMode,
    mutation_payload_version: input.review.mutationPayloadVersion,
    mutation_checksum: input.review.mutationChecksum,
    trusted_client_rows: input.review.trustedClientRows,
  };

  if (input.activePlan.source_kind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND) {
    return toJson(root);
  }

  return toJson({
    ...root,
    manual_workout_authoring_move: moveMetadata,
    manual_workout_authoring_moves: [...moveHistory, moveMetadata],
  });
}

function resolveManualPlanEndDateAfterMove(
  activePlan: PersistedPlanCycleRow,
  movedWorkouts: readonly PersistedPlannedWorkoutRow[],
) {
  const movedEndDate = movedWorkouts
    .map((workout) => workout.workout_date)
    .sort()
    .at(-1);

  return movedEndDate ?? activePlan.end_date;
}

function resolveManualWorkoutWeekNumber(planStartDate: string, workoutDate: string) {
  return Math.floor(diffDaysIso(workoutDate, planStartDate) / 7) + 1;
}

function buildDirectMoveMutationChecksum(input: {
  activePlanId: string;
  sourceWorkoutId: string;
  sourceWorkoutDate: string;
  targetDate: string;
  targetWeekday: string;
  targetMode: ManualWorkoutMoveTargetMode;
  targetReplacement: ManualWorkoutMoveReplacementTarget | null;
  templateKey: string;
  reviewChecksum: string;
}) {
  return stableManualWorkoutChecksum64Hex({
    version: MANUAL_WORKOUT_DIRECT_MOVE_PAYLOAD_VERSION,
    sourceKind: ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
    mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.moveWorkout,
    activePlanId: input.activePlanId,
    sourceWorkoutId: input.sourceWorkoutId,
    sourceWorkoutDate: input.sourceWorkoutDate,
    targetDate: input.targetDate,
    targetWeekday: input.targetWeekday,
    targetMode: input.targetMode,
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

function inputHasClientPayload(error: z.ZodError) {
  return error.issues.some((issue) => issue.code === "unrecognized_keys");
}

function mapMoveDraftFailureReason(reason: string): ManualWorkoutMoveFailureReason {
  switch (reason) {
    case "source_workout_not_found":
      return "source_workout_not_found";
    case "source_workout_not_in_active_plan":
      return "source_workout_not_in_active_plan";
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
      return "unsupported_active_plan_source";
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

function safeTokenEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

function asJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
