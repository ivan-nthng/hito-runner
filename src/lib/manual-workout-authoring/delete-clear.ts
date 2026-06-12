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
import {
  buildManualWorkoutDraftInputFromPersistedWorkout,
  type ManualWorkoutCopyPasteFailureReason,
} from "@/lib/manual-workout-authoring/copy-paste-reconstruction";
import { reviewManualWorkoutDraft } from "@/lib/manual-workout-authoring/actions";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_TEMPLATE_KEY_VALUES,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/training";

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
  | "no_active_plan"
  | "unsupported_active_plan_source"
  | "unsupported_source_metadata"
  | "target_workout_not_found"
  | "target_workout_not_in_active_plan"
  | "target_workout_not_supported"
  | "protected_day"
  | "last_workout_not_deletable"
  | "persistence_failed";

export type ManualWorkoutDeleteClearDependencies = Pick<
  ManualWorkoutActivePlanAddDependencies,
  "getExistingPlanContextForUser" | "currentDate"
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
  available: true;
  label: "Restore";
  alternateLabels: ["Put back", "Redo"];
  draftInput: ManualWorkoutDraftInput;
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
  safety: {
    reviewedThroughManualAuthoring: true;
    trustedClientRows: false;
    targetDateDerivedServerSide: true;
  };
};

type ManualWorkoutDeleteClearReview = {
  plannedWorkoutId: string;
  workoutDate: string;
  title: string;
  templateKey: ManualWorkoutTemplateKey;
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
      activePlanId: string;
      plannedWorkoutId: string;
      workoutDate: string;
      title: string;
      templateKey: ManualWorkoutTemplateKey;
      review: ManualWorkoutDeleteClearReview;
      restore: ManualWorkoutDeleteRestoreAffordance;
      safety: {
        requiresExplicitConfirm: true;
        targetWorkoutVerified: true;
        activePlanSourceVerified: true;
        protectedHistoryChecked: true;
        lastWorkoutProtected: true;
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
      activePlanId: string;
      plannedWorkoutId: string;
      workoutDate: string;
      title: string;
      templateKey: ManualWorkoutTemplateKey;
      reviewChecksum: string;
      exactnessPayloadVersion: typeof MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      restore: ManualWorkoutDeleteRestoreAffordance;
      safety: {
        requiresExplicitConfirm: true;
        targetWorkoutVerified: true;
        activePlanSourceVerified: true;
        protectedHistoryChecked: true;
        deletedExactlyOneRow: true;
        activePlanRemainsActive: true;
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
      activePlan: PersistedPlanCycleRow;
      targetWorkout: PersistedPlannedWorkoutRow;
      remainingWorkouts: PersistedPlannedWorkoutRow[];
      restore: ManualWorkoutDeleteRestoreAffordance;
      review: ManualWorkoutDeleteClearReview;
    }
  | {
      ok: false;
      reason: ManualWorkoutDeleteClearFailureReason;
      message: string;
    };

type PersistManualWorkoutDeleteClearInput = {
  userId: string;
  activePlan: PersistedPlanCycleRow;
  targetWorkout: PersistedPlannedWorkoutRow;
  remainingWorkouts: readonly PersistedPlannedWorkoutRow[];
  review: ManualWorkoutDeleteClearReview;
};

export const reviewManualWorkoutDeleteClear = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutDeleteClearReviewResult> => {
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildDeleteClearBlocked({
        reason: "unauthenticated",
        message: "Sign in before deleting manual workouts.",
      });
    }

    return reviewManualWorkoutDeleteClearForUser(userId, data);
  });

export const confirmManualWorkoutDeleteClear = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutDeleteClearConfirmResult> => {
    const userId = await getCurrentPersistedUserId();

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
    sourceKind: target.activePlan.source_kind ?? ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: target.activePlan.id,
    plannedWorkoutId: target.targetWorkout.id,
    workoutDate: target.targetWorkout.workout_date,
    title: target.targetWorkout.title,
    templateKey: target.review.templateKey,
    review: target.review,
    restore: target.restore,
    safety: {
      requiresExplicitConfirm: true,
      targetWorkoutVerified: true,
      activePlanSourceVerified: true,
      protectedHistoryChecked: true,
      lastWorkoutProtected: true,
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

  if (parsed.data.reviewChecksum !== target.review.reviewChecksum) {
    return buildDeleteClearBlocked({
      reason: "stale_review",
      message: "This manual workout delete review no longer matches the active plan.",
    });
  }

  const expectedToken = `${MANUAL_WORKOUT_DELETE_REVIEW_TOKEN_PREFIX}${target.review.reviewChecksum}`;
  if (!safeTokenEqual(parsed.data.reviewToken, expectedToken)) {
    return buildDeleteClearBlocked({
      reason: "invalid_review",
      message: "This manual workout delete review token is invalid. Refresh the review.",
    });
  }

  const persistDelete = dependencies.persistWorkoutDelete ?? persistManualWorkoutDeleteClear;

  try {
    const persisted = await persistDelete({
      userId,
      activePlan: target.activePlan,
      targetWorkout: target.targetWorkout,
      remainingWorkouts: target.remainingWorkouts,
      review: target.review,
    });

    return {
      ok: true,
      status: "deleted",
      persisted: true,
      sourceKind: target.activePlan.source_kind ?? ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
      sourceStatus: resolveActivePlanSourceStatus(target.activePlan),
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      activePlanId: persisted.planCycle.id,
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
        activePlanSourceVerified: true,
        protectedHistoryChecked: true,
        deletedExactlyOneRow: true,
        activePlanRemainsActive: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildDeleteClearBlocked({
      reason: "persistence_failed",
      message: "The manual workout could not be deleted. The active plan is unchanged.",
    });
  }
}

export async function persistManualWorkoutDeleteClear({
  userId,
  activePlan,
  targetWorkout,
  remainingWorkouts,
  review,
}: PersistManualWorkoutDeleteClearInput) {
  const supabase = createAdminSupabaseClient();
  const deleted = await supabase
    .from("planned_workouts")
    .delete()
    .eq("id", targetWorkout.id)
    .eq("user_id", userId)
    .eq("plan_cycle_id", activePlan.id)
    .select("*")
    .single();

  if (deleted.error || !deleted.data) {
    throw new Error(deleted.error?.message ?? "Manual workout delete failed.");
  }

  const update = await supabase
    .from("plan_cycles")
    .update({
      end_date: resolveManualPlanEndDateAfterDelete(activePlan, remainingWorkouts),
      goal_metadata: buildManualWorkoutDeleteGoalMetadata({
        activePlan,
        existingGoalMetadata: activePlan.goal_metadata,
        remainingWorkouts,
        review,
      }),
      plan_preferences: buildManualWorkoutDeletePlanPreferences({
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
    await supabase.from("planned_workouts").insert(deleted.data);
    throw new Error(update.error?.message ?? "Manual workout delete metadata update failed.");
  }

  return {
    deletedWorkout: deleted.data,
    planCycle: update.data,
  };
}

async function resolveManualWorkoutDeleteClearTarget(
  userId: string,
  input: ManualWorkoutDeleteClearReviewInput | ManualWorkoutDeleteClearConfirmInput,
  dependencies: ManualWorkoutDeleteClearDependencies,
): Promise<ManualWorkoutDeleteClearTarget> {
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
      message: "Create or open an active plan before deleting workouts.",
    };
  }

  if (input.activePlanId && activePlan.id !== input.activePlanId) {
    return {
      ok: false,
      reason: "stale_review",
      message: "The active manual plan changed. Refresh the calendar and review this delete again.",
    };
  }

  const editability = resolveActivePlanWorkoutEditability(activePlan, "clear_workout");
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

  const target = resolveDeleteTargetWorkout({
    userId,
    activePlanId: activePlan.id,
    workouts: planContext.existingWorkouts.workouts,
    plannedWorkoutId: input.plannedWorkoutId,
    workoutDate: input.workoutDate,
  });

  if (!target.ok) {
    return target;
  }

  if (!isManualWorkoutDeleteSupported(target.workout)) {
    return {
      ok: false,
      reason: "target_workout_not_supported",
      message: "This planned workout row cannot be safely cleared through this flow.",
    };
  }

  const nonRestWorkouts = planContext.existingWorkouts.workouts.filter(
    (workout) => workout.workout_type !== "rest",
  );
  if (nonRestWorkouts.length <= 1) {
    return {
      ok: false,
      reason: "last_workout_not_deletable",
      message: "Manual user-built plans must keep at least one workout in this slice.",
    };
  }

  const evidenceIds = await fetchEvidence(userId, [target.workout.id]);
  if (
    isProtectedManualWorkoutTarget(
      target.workout,
      currentDate,
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

  const restore = buildRestoreAffordance(target.workout, activePlan);
  if (!restore.ok) {
    return restore;
  }

  const remainingWorkouts = planContext.existingWorkouts.workouts.filter(
    (workout) => workout.id !== target.workout.id,
  );
  const review = buildDeleteClearReview({
    activePlan,
    targetWorkout: target.workout,
    remainingWorkouts,
    templateKey: restore.restore.draftInput.templateKey,
  });

  return {
    ok: true,
    activePlan,
    targetWorkout: target.workout,
    remainingWorkouts,
    restore: restore.restore,
    review,
  };
}

function resolveDeleteTargetWorkout(input: {
  userId: string;
  activePlanId: string;
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
      message: "The planned workout was not found in the current manual plan.",
    };
  }

  const workout = matches[0]!;
  if (workout.user_id !== input.userId || workout.plan_cycle_id !== input.activePlanId) {
    return {
      ok: false,
      reason: "target_workout_not_in_active_plan",
      message: "The planned workout is not part of the current runner's active manual plan.",
    };
  }

  return { ok: true, workout };
}

function isManualWorkoutDeleteSupported(workout: PersistedPlannedWorkoutRow) {
  return (
    workout.workout_type !== "rest" &&
    typeof workout.source_workout_type === "string" &&
    (MANUAL_WORKOUT_TEMPLATE_KEY_VALUES as readonly string[]).includes(workout.source_workout_type)
  );
}

function buildRestoreAffordance(
  workout: PersistedPlannedWorkoutRow,
  activePlan: PersistedPlanCycleRow,
):
  | { ok: true; restore: ManualWorkoutDeleteRestoreAffordance }
  | { ok: false; reason: ManualWorkoutDeleteClearFailureReason; message: string } {
  const draft = buildManualWorkoutDraftInputFromPersistedWorkout(workout, workout.workout_date, {
    activePlanId: activePlan.id,
    activePlanSourceKind: activePlan.source_kind,
  });

  if (!draft.ok) {
    return {
      ok: false,
      reason: mapRestoreFailureReason(draft.reason),
      message: draft.message,
    };
  }

  const review = reviewManualWorkoutDraft(draft.draftInput);
  if (!review.ok) {
    return {
      ok: false,
      reason: mapRestoreReviewFailureReason(review.reason),
      message: review.message,
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

function buildDeleteClearReview(input: {
  activePlan: PersistedPlanCycleRow;
  targetWorkout: PersistedPlannedWorkoutRow;
  remainingWorkouts: readonly PersistedPlannedWorkoutRow[];
  templateKey: ManualWorkoutTemplateKey;
}): ManualWorkoutDeleteClearReview {
  const payload = buildDeleteClearExactnessPayload(input);
  const reviewChecksum = stableManualWorkoutChecksum64Hex(payload);

  return {
    plannedWorkoutId: input.targetWorkout.id,
    workoutDate: input.targetWorkout.workout_date,
    title: input.targetWorkout.title,
    templateKey: input.templateKey,
    reviewToken: `${MANUAL_WORKOUT_DELETE_REVIEW_TOKEN_PREFIX}${reviewChecksum}`,
    reviewChecksum,
    exactnessPayloadVersion: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
  };
}

function buildDeleteClearExactnessPayload(input: {
  activePlan: PersistedPlanCycleRow;
  targetWorkout: PersistedPlannedWorkoutRow;
  remainingWorkouts: readonly PersistedPlannedWorkoutRow[];
  templateKey: ManualWorkoutTemplateKey;
}) {
  return {
    version: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
    sourceKind: ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
    activePlanId: input.activePlan.id,
    activePlanSourceKind: input.activePlan.source_kind,
    plannedWorkoutId: input.targetWorkout.id,
    workoutDate: input.targetWorkout.workout_date,
    title: input.targetWorkout.title,
    templateKey: input.templateKey,
    sourceWorkoutType: input.targetWorkout.source_workout_type,
    workoutType: input.targetWorkout.workout_type,
    workoutFamily: input.targetWorkout.workout_family,
    workoutIdentity: input.targetWorkout.workout_identity,
    steps: input.targetWorkout.steps,
    remainingWorkoutIds: input.remainingWorkouts.map((workout) => workout.id).sort(),
    remainingRowCount: input.remainingWorkouts.length,
    remainingNonRestRowCount: input.remainingWorkouts.filter(
      (workout) => workout.workout_type !== "rest",
    ).length,
  };
}

function buildManualWorkoutDeleteGoalMetadata(input: {
  existingGoalMetadata: Json | null;
  remainingWorkouts: readonly PersistedPlannedWorkoutRow[];
  review: ManualWorkoutDeleteClearReview;
  activePlan: PersistedPlanCycleRow;
}): Json {
  const editMetadata = buildActivePlanUserEditMetadata({
    activePlan: input.activePlan,
    mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.clearWorkout,
    plannedWorkoutId: input.review.plannedWorkoutId,
    previousWorkoutDate: input.review.workoutDate,
    reviewChecksum: input.review.reviewChecksum,
    reviewPayloadVersion: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
    templateKey: input.review.templateKey,
    title: input.review.title,
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
      row_count: input.remainingWorkouts.length,
      non_rest_row_count: input.remainingWorkouts.filter(
        (workout) => workout.workout_type !== "rest",
      ).length,
      latest_delete_review_payload_version: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
      latest_delete_review_checksum: input.review.reviewChecksum,
      latest_deleted_workout: {
        planned_workout_id: input.review.plannedWorkoutId,
        workout_date: input.review.workoutDate,
        title: input.review.title,
        template_key: input.review.templateKey,
        review_checksum: input.review.reviewChecksum,
      },
    },
  });
}

function buildManualWorkoutDeletePlanPreferences(input: {
  existingPlanPreferences: Json | null;
  review: ManualWorkoutDeleteClearReview;
  activePlan: PersistedPlanCycleRow;
}): Json {
  const editMetadata = buildActivePlanUserEditMetadata({
    activePlan: input.activePlan,
    mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.clearWorkout,
    plannedWorkoutId: input.review.plannedWorkoutId,
    previousWorkoutDate: input.review.workoutDate,
    reviewChecksum: input.review.reviewChecksum,
    reviewPayloadVersion: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
    templateKey: input.review.templateKey,
    title: input.review.title,
    workoutAuthoringSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  });
  const root = appendActivePlanUserEditMetadataToRecord(
    asJsonRecord(input.existingPlanPreferences),
    editMetadata,
  );
  const deleteHistory = Array.isArray(root.manual_workout_authoring_deletions)
    ? root.manual_workout_authoring_deletions
    : [];
  const deleteMetadata = {
    planned_workout_id: input.review.plannedWorkoutId,
    workout_date: input.review.workoutDate,
    title: input.review.title,
    template_key: input.review.templateKey,
    review_payload_version: MANUAL_WORKOUT_DELETE_REVIEW_PAYLOAD_VERSION,
    review_checksum: input.review.reviewChecksum,
  };

  if (input.activePlan.source_kind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND) {
    return toJson(root);
  }

  return toJson({
    ...root,
    manual_workout_authoring_delete: deleteMetadata,
    manual_workout_authoring_deletions: [...deleteHistory, deleteMetadata],
  });
}

function resolveManualPlanEndDateAfterDelete(
  activePlan: PersistedPlanCycleRow,
  remainingWorkouts: readonly PersistedPlannedWorkoutRow[],
) {
  const remainingEndDate = remainingWorkouts
    .map((workout) => workout.workout_date)
    .sort()
    .at(-1);

  return remainingEndDate ?? activePlan.start_date;
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
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
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

function mapRestoreFailureReason(
  reason: ManualWorkoutCopyPasteFailureReason,
): ManualWorkoutDeleteClearFailureReason {
  switch (reason) {
    case "source_workout_not_found":
      return "target_workout_not_found";
    case "source_workout_not_in_active_plan":
      return "target_workout_not_in_active_plan";
    case "source_workout_not_supported":
    case "unsupported_payload":
      return "target_workout_not_supported";
    case "active_plan_conflict":
    case "occupied_day":
    case "manual_workout_required":
    case "unsupported_template":
    case "unsupported_mapping":
    case "unsafe_block_structure":
    case "unsafe_metric_truth":
    case "protected_date_conflict":
      return "target_workout_not_supported";
    default:
      return reason;
  }
}

function mapRestoreReviewFailureReason(
  reason: Extract<ManualWorkoutDraftReviewResult, { ok: false }>["reason"],
): ManualWorkoutDeleteClearFailureReason {
  switch (reason) {
    case "active_plan_conflict":
      return "unsupported_active_plan_source";
    case "protected_date_conflict":
      return "protected_day";
    case "invalid_input":
      return "invalid_input";
    default:
      return "target_workout_not_supported";
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
