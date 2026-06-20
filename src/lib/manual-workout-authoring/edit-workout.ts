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
import { buildImportedPlanSeed } from "@/lib/imported-plan";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  isProtectedManualWorkoutTarget,
  type ManualWorkoutActivePlanAddDependencies,
  type ManualWorkoutEvidenceFetcher,
} from "@/lib/manual-workout-authoring/active-plan-add";
import { reviewManualWorkoutDraft } from "@/lib/manual-workout-authoring/actions";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";
import {
  buildExpectedPersistedEditReviewToken,
  buildManualWorkoutEditMetadata,
  buildPersistedEditReview,
  MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
  safeManualWorkoutEditReviewTokenEqual,
  type ManualWorkoutPersistedEditReview,
} from "@/lib/manual-workout-authoring/edit-workout-review-token";
import { persistedManualWorkoutHasUnsafeMetricTruth } from "@/lib/manual-workout-authoring/persisted-workout-safety";
import { buildManualWorkoutUserBuiltTrainingPlan } from "@/lib/manual-workout-authoring/persistence";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/training";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const manualWorkoutPersistedEditSourceInputSchema = z
  .object({
    activePlanId: z.string().uuid().optional(),
    plannedWorkoutId: z.string().uuid(),
    workoutDate: isoDateSchema,
  })
  .strict();

export const manualWorkoutPersistedEditReviewInputSchema =
  manualWorkoutPersistedEditSourceInputSchema
    .extend({
      draftInput: z.unknown(),
    })
    .strict();

export const manualWorkoutPersistedEditConfirmInputSchema =
  manualWorkoutPersistedEditSourceInputSchema
    .extend({
      draftInput: z.unknown(),
      reviewToken: z.string().trim().min(16),
      reviewChecksum: z.string().trim().length(64),
    })
    .strict();

type ManualWorkoutPersistedEditSourceInput = z.output<
  typeof manualWorkoutPersistedEditSourceInputSchema
>;
type ManualWorkoutPersistedEditReviewInput = z.output<
  typeof manualWorkoutPersistedEditReviewInputSchema
>;
type ManualWorkoutPersistedEditConfirmInput = z.output<
  typeof manualWorkoutPersistedEditConfirmInputSchema
>;

export type ManualWorkoutPersistedEditFailureReason =
  | "unauthenticated"
  | "invalid_input"
  | "invalid_review"
  | "stale_review"
  | "no_active_plan"
  | "unsupported_active_plan_source"
  | "unsupported_source_metadata"
  | "source_workout_not_found"
  | "source_workout_not_in_active_plan"
  | "source_workout_not_supported"
  | "source_date_changed"
  | "workout_date_changed"
  | "manual_workout_required"
  | "client_payload_rejected"
  | "protected_day"
  | "persistence_failed";

type ManualWorkoutPersistedEditBlockedResult = {
  ok: false;
  status: "blocked";
  persisted: false;
  reason: ManualWorkoutPersistedEditFailureReason;
  message: string;
  sourceKind: typeof MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
  workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
};

export type ManualWorkoutPersistedEditReconstructResult =
  | {
      ok: true;
      status: "draft_reconstructed";
      persisted: false;
      sourceKind: typeof MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string;
      plannedWorkoutId: string;
      workoutDate: string;
      draftInput: ManualWorkoutDraftInput;
      safety: {
        sourceWorkoutVerified: true;
        reconstructedFromPersistedWorkout: true;
        protectedHistoryChecked: true;
        trustedClientRows: false;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutPersistedEditBlockedResult;

export type ManualWorkoutPersistedEditReviewResult =
  | {
      ok: true;
      status: "review_ready";
      persisted: false;
      sourceKind: typeof MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string;
      plannedWorkoutId: string;
      workoutDate: string;
      draftInput: ManualWorkoutDraftInput;
      draftReview: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
      review: ManualWorkoutPersistedEditReview;
      safety: {
        requiresExplicitConfirm: true;
        sourceWorkoutVerified: true;
        reconstructedFromPersistedWorkout: true;
        activePlanSourceVerified: true;
        protectedHistoryChecked: true;
        updatesSamePlannedWorkoutRow: true;
        trustedClientRows: false;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutPersistedEditBlockedResult;

export type ManualWorkoutPersistedEditConfirmResult =
  | {
      ok: true;
      status: "updated";
      persisted: true;
      sourceKind: typeof MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
      sourceStatus: typeof MANUAL_USER_BUILT_PLAN_SOURCE_STATUS;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string;
      plannedWorkoutId: string;
      workoutDate: string;
      title: string;
      templateKey: ManualWorkoutTemplateKey;
      reviewChecksum: string;
      draftReviewChecksum: string;
      exactnessPayloadVersion: typeof MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION;
      mutationChecksum: string;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      sourceMetadata: {
        editSourceKind: typeof ACTIVE_PLAN_USER_EDIT_SOURCE_KIND;
        mutationKind: typeof ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.editWorkout;
        mutationMode: "direct_manual_edit";
        mutationPayloadVersion: typeof MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION;
        mutationChecksum: string;
        plannedWorkoutId: string;
        workoutDate: string;
        templateKey: ManualWorkoutTemplateKey;
        reviewChecksum: string;
        draftReviewChecksum: string;
        trustedClientRows: false;
      };
      safety: {
        requiresExplicitConfirm: true;
        sourceWorkoutVerified: true;
        reconstructedFromPersistedWorkout: true;
        activePlanSourceVerified: true;
        protectedHistoryChecked: true;
        updatedExactlyOneRow: true;
        updatesSamePlannedWorkoutRow: true;
        activePlanRemainsActive: true;
        trustedClientRows: false;
        serverRebuiltReview: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutPersistedEditBlockedResult;

export type ManualWorkoutPersistedEditDependencies = Pick<
  ManualWorkoutActivePlanAddDependencies,
  "getExistingPlanContextForUser" | "currentDate"
> & {
  fetchEvidenceWorkoutIds?: ManualWorkoutEvidenceFetcher;
  persistWorkoutEdit?: typeof persistManualWorkoutPersistedEdit;
};

type ManualWorkoutPersistedEditTarget =
  | {
      ok: true;
      activePlan: PersistedPlanCycleRow;
      sourceWorkout: PersistedPlannedWorkoutRow;
      otherWorkouts: PersistedPlannedWorkoutRow[];
    }
  | {
      ok: false;
      reason: ManualWorkoutPersistedEditFailureReason;
      message: string;
    };

type PersistManualWorkoutEditInput = {
  userId: string;
  activePlan: PersistedPlanCycleRow;
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  draftReview: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
  review: ManualWorkoutPersistedEditReview;
};

export const reconstructManualWorkoutPersistedEditDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutPersistedEditReconstructResult> => {
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildEditBlocked({
        reason: "unauthenticated",
        message: "Sign in before editing manual workouts.",
      });
    }

    return reconstructManualWorkoutPersistedEditDraftForUser(userId, data);
  });

export const reviewManualWorkoutPersistedEditDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutPersistedEditReviewResult> => {
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildEditBlocked({
        reason: "unauthenticated",
        message: "Sign in before reviewing manual workout edits.",
      });
    }

    return reviewManualWorkoutPersistedEditDraftForUser(userId, data);
  });

export const confirmManualWorkoutPersistedEdit = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutPersistedEditConfirmResult> => {
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildEditBlocked({
        reason: "unauthenticated",
        message: "Sign in before saving manual workout edits.",
      });
    }

    return confirmManualWorkoutPersistedEditForUser(userId, data);
  });

export async function reconstructManualWorkoutPersistedEditDraftForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutPersistedEditDependencies = {},
): Promise<ManualWorkoutPersistedEditReconstructResult> {
  const parsed = manualWorkoutPersistedEditSourceInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildEditBlocked({
      reason: inputHasClientPayload(parsed.error) ? "client_payload_rejected" : "invalid_input",
      message: inputHasClientPayload(parsed.error)
        ? "Manual workout edit reconstruction accepts only source workout identifiers."
        : "The manual workout edit reconstruction payload is invalid.",
    });
  }

  const target = await resolveManualWorkoutPersistedEditTarget(userId, parsed.data, dependencies);

  if (!target.ok) {
    return buildEditBlocked(target);
  }

  const reconstructed = buildManualWorkoutDraftInputFromPersistedWorkout(
    target.sourceWorkout,
    target.sourceWorkout.workout_date,
    {
      activePlanId: target.activePlan.id,
      activePlanSourceKind: target.activePlan.source_kind,
    },
  );

  if (!reconstructed.ok) {
    return buildEditBlocked({
      reason: mapDraftFailureReason(reconstructed.reason),
      message: reconstructed.message,
    });
  }

  return {
    ok: true,
    status: "draft_reconstructed",
    persisted: false,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: target.activePlan.id,
    plannedWorkoutId: target.sourceWorkout.id,
    workoutDate: target.sourceWorkout.workout_date,
    draftInput: reconstructed.draftInput,
    safety: {
      sourceWorkoutVerified: true,
      reconstructedFromPersistedWorkout: true,
      protectedHistoryChecked: true,
      trustedClientRows: false,
      callsOpenAi: false,
    },
  };
}

export async function reviewManualWorkoutPersistedEditDraftForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutPersistedEditDependencies = {},
): Promise<ManualWorkoutPersistedEditReviewResult> {
  const parsed = manualWorkoutPersistedEditReviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildEditBlocked({
      reason: inputHasClientPayload(parsed.error) ? "client_payload_rejected" : "invalid_input",
      message: inputHasClientPayload(parsed.error)
        ? "Manual workout edit review accepts only source identifiers and edited draft input."
        : "The manual workout edit review payload is invalid.",
    });
  }

  const target = await resolveManualWorkoutPersistedEditTarget(userId, parsed.data, dependencies);

  if (!target.ok) {
    return buildEditBlocked(target);
  }

  const draftReview = reviewManualWorkoutDraft(parsed.data.draftInput);
  if (!draftReview.ok) {
    return buildEditBlocked({
      reason: mapDraftReviewFailureReason(draftReview.reason),
      message: draftReview.message,
    });
  }

  if (draftReview.draft.workoutType === "rest") {
    return buildEditBlocked({
      reason: "manual_workout_required",
      message:
        "Workout detail editing updates planned workouts only. Use Clear for rest-day changes.",
    });
  }

  if (draftReview.draft.workoutDate !== target.sourceWorkout.workout_date) {
    return buildEditBlocked({
      reason: "workout_date_changed",
      message: "Workout detail editing cannot move workouts. Use the calendar move action.",
    });
  }

  const review = buildPersistedEditReview({
    activePlan: target.activePlan,
    sourceWorkout: target.sourceWorkout,
    otherWorkouts: target.otherWorkouts,
    draftInput: parsed.data.draftInput,
    draftReview,
  });

  return {
    ok: true,
    status: "review_ready",
    persisted: false,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: target.activePlan.id,
    plannedWorkoutId: target.sourceWorkout.id,
    workoutDate: target.sourceWorkout.workout_date,
    draftInput: parsed.data.draftInput as ManualWorkoutDraftInput,
    draftReview,
    review,
    safety: {
      requiresExplicitConfirm: true,
      sourceWorkoutVerified: true,
      reconstructedFromPersistedWorkout: true,
      activePlanSourceVerified: true,
      protectedHistoryChecked: true,
      updatesSamePlannedWorkoutRow: true,
      trustedClientRows: false,
      callsOpenAi: false,
    },
  };
}

export async function confirmManualWorkoutPersistedEditForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutPersistedEditDependencies = {},
): Promise<ManualWorkoutPersistedEditConfirmResult> {
  const parsed = manualWorkoutPersistedEditConfirmInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildEditBlocked({
      reason: inputHasClientPayload(parsed.error) ? "client_payload_rejected" : "invalid_review",
      message: inputHasClientPayload(parsed.error)
        ? "Manual workout edit confirm accepts only source identifiers, edited draft input, and review proof."
        : "The manual workout edit confirmation payload is invalid. Refresh the review.",
    });
  }

  const target = await resolveManualWorkoutPersistedEditTarget(userId, parsed.data, dependencies);

  if (!target.ok) {
    return buildEditBlocked(target);
  }

  const draftReview = reviewManualWorkoutDraft(parsed.data.draftInput);
  if (!draftReview.ok) {
    return buildEditBlocked({
      reason: mapDraftReviewFailureReason(draftReview.reason),
      message: draftReview.message,
    });
  }

  if (draftReview.draft.workoutType === "rest") {
    return buildEditBlocked({
      reason: "manual_workout_required",
      message:
        "Workout detail editing updates planned workouts only. Use Clear for rest-day changes.",
    });
  }

  if (draftReview.draft.workoutDate !== target.sourceWorkout.workout_date) {
    return buildEditBlocked({
      reason: "workout_date_changed",
      message: "Workout detail editing cannot move workouts. Use the calendar move action.",
    });
  }

  const review = buildPersistedEditReview({
    activePlan: target.activePlan,
    sourceWorkout: target.sourceWorkout,
    otherWorkouts: target.otherWorkouts,
    draftInput: parsed.data.draftInput,
    draftReview,
  });

  if (parsed.data.reviewChecksum !== review.reviewChecksum) {
    return buildEditBlocked({
      reason: "stale_review",
      message: "This manual workout edit review no longer matches the current workout.",
    });
  }

  const expectedToken = buildExpectedPersistedEditReviewToken(review.reviewChecksum);
  if (!safeManualWorkoutEditReviewTokenEqual(parsed.data.reviewToken, expectedToken)) {
    return buildEditBlocked({
      reason: "invalid_review",
      message: "This manual workout edit review token is invalid. Refresh the review.",
    });
  }

  const persistEdit = dependencies.persistWorkoutEdit ?? persistManualWorkoutPersistedEdit;

  try {
    await persistEdit({
      userId,
      activePlan: target.activePlan,
      sourceWorkout: target.sourceWorkout,
      otherWorkouts: target.otherWorkouts,
      draftReview,
      review,
    });

    const calendarRowCount = target.otherWorkouts.length + 1;
    const nonRestWorkoutCount =
      target.otherWorkouts.filter((workout) => workout.workout_type !== "rest").length + 1;

    return {
      ok: true,
      status: "updated",
      persisted: true,
      sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
      sourceStatus: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      activePlanId: target.activePlan.id,
      plannedWorkoutId: target.sourceWorkout.id,
      workoutDate: target.sourceWorkout.workout_date,
      title: draftReview.draft.title,
      templateKey: draftReview.draft.templateKey,
      reviewChecksum: review.reviewChecksum,
      draftReviewChecksum: draftReview.reviewChecksum,
      exactnessPayloadVersion: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
      mutationChecksum: review.mutationChecksum,
      calendarRowCount,
      nonRestWorkoutCount,
      sourceMetadata: {
        editSourceKind: ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
        mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.editWorkout,
        mutationMode: "direct_manual_edit",
        mutationPayloadVersion: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
        mutationChecksum: review.mutationChecksum,
        plannedWorkoutId: target.sourceWorkout.id,
        workoutDate: target.sourceWorkout.workout_date,
        templateKey: draftReview.draft.templateKey,
        reviewChecksum: review.reviewChecksum,
        draftReviewChecksum: draftReview.reviewChecksum,
        trustedClientRows: false,
      },
      safety: {
        requiresExplicitConfirm: true,
        sourceWorkoutVerified: true,
        reconstructedFromPersistedWorkout: true,
        activePlanSourceVerified: true,
        protectedHistoryChecked: true,
        updatedExactlyOneRow: true,
        updatesSamePlannedWorkoutRow: true,
        activePlanRemainsActive: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildEditBlocked({
      reason: "persistence_failed",
      message: "The manual workout edit could not be saved. The workout is unchanged.",
    });
  }
}

export async function persistManualWorkoutPersistedEdit({
  userId,
  activePlan,
  sourceWorkout,
  otherWorkouts,
  draftReview,
  review,
}: PersistManualWorkoutEditInput) {
  const supabase = createAdminSupabaseClient();
  const updateRow = buildPersistedWorkoutEditUpdateRow({
    userId,
    activePlan,
    sourceWorkout,
    draftReview,
  });

  const updated = await supabase
    .from("planned_workouts")
    .update(updateRow)
    .eq("id", sourceWorkout.id)
    .eq("user_id", userId)
    .eq("plan_cycle_id", activePlan.id)
    .select("*")
    .single();

  if (updated.error || !updated.data) {
    throw new Error(updated.error?.message ?? "Manual workout edit update failed.");
  }

  const editedWorkouts = [
    ...otherWorkouts,
    {
      ...sourceWorkout,
      ...updateRow,
    },
  ];
  const planUpdate = await supabase
    .from("plan_cycles")
    .update({
      goal_metadata: buildManualWorkoutEditGoalMetadata({
        activePlan,
        existingGoalMetadata: activePlan.goal_metadata,
        editedWorkouts,
        review,
      }),
      plan_preferences: buildManualWorkoutEditPlanPreferences({
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

  if (planUpdate.error || !planUpdate.data) {
    await supabase
      .from("planned_workouts")
      .update(buildPersistedWorkoutRollbackRow(sourceWorkout))
      .eq("id", sourceWorkout.id)
      .eq("user_id", userId)
      .eq("plan_cycle_id", activePlan.id);
    throw new Error(planUpdate.error?.message ?? "Manual workout edit metadata update failed.");
  }

  return {
    editedWorkout: updated.data,
    planCycle: planUpdate.data,
  };
}

async function resolveManualWorkoutPersistedEditTarget(
  userId: string,
  input: ManualWorkoutPersistedEditSourceInput,
  dependencies: ManualWorkoutPersistedEditDependencies,
): Promise<ManualWorkoutPersistedEditTarget> {
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
      message: "Create or open a manual active plan before editing workouts.",
    };
  }

  if (input.activePlanId && activePlan.id !== input.activePlanId) {
    return {
      ok: false,
      reason: "stale_review",
      message: "The active manual plan changed. Refresh the workout before editing.",
    };
  }

  if (activePlan.source_kind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND) {
    return {
      ok: false,
      reason: "unsupported_active_plan_source",
      message: "Workout detail editing is available only for manual user-built active plans.",
    };
  }

  const editability = resolveActivePlanWorkoutEditability(activePlan, "edit_workout");
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

  const sourceWorkout = planContext.existingWorkouts.workouts.find(
    (workout) => workout.id === input.plannedWorkoutId,
  );

  if (!sourceWorkout) {
    return {
      ok: false,
      reason: "source_workout_not_found",
      message: "The planned workout was not found in the current manual plan.",
    };
  }

  if (sourceWorkout.user_id !== userId || sourceWorkout.plan_cycle_id !== activePlan.id) {
    return {
      ok: false,
      reason: "source_workout_not_in_active_plan",
      message: "The planned workout is not part of the current runner's active manual plan.",
    };
  }

  if (sourceWorkout.workout_date !== input.workoutDate) {
    return {
      ok: false,
      reason: "source_date_changed",
      message: "The planned workout is no longer on this date. Refresh the workout.",
    };
  }

  if (sourceWorkout.workout_date <= currentDate) {
    return {
      ok: false,
      reason: "protected_day",
      message: "Workout detail editing is available only for future planned workouts.",
    };
  }

  const evidenceWorkoutIds = await fetchEvidence(userId, [sourceWorkout.id]);
  if (
    isProtectedManualWorkoutTarget(
      sourceWorkout,
      currentDate,
      planContext.existingWorkouts.logsByWorkoutId,
      evidenceWorkoutIds,
    )
  ) {
    return {
      ok: false,
      reason: "protected_day",
      message: "This workout has protected history or evidence and cannot be edited here.",
    };
  }

  if (persistedManualWorkoutHasUnsafeMetricTruth(sourceWorkout)) {
    return {
      ok: false,
      reason: "source_workout_not_supported",
      message: "This workout has metric targets that cannot be edited safely.",
    };
  }

  const reconstructed = buildManualWorkoutDraftInputFromPersistedWorkout(
    sourceWorkout,
    sourceWorkout.workout_date,
    {
      activePlanId: activePlan.id,
      activePlanSourceKind: activePlan.source_kind,
    },
  );

  if (!reconstructed.ok) {
    return {
      ok: false,
      reason: mapDraftFailureReason(reconstructed.reason),
      message: reconstructed.message,
    };
  }

  return {
    ok: true,
    activePlan,
    sourceWorkout,
    otherWorkouts: planContext.existingWorkouts.workouts.filter(
      (workout) => workout.id !== sourceWorkout.id,
    ),
  };
}

function buildPersistedWorkoutEditUpdateRow(input: {
  userId: string;
  activePlan: PersistedPlanCycleRow;
  sourceWorkout: PersistedPlannedWorkoutRow;
  draftReview: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
}) {
  const canonicalPlan = buildManualWorkoutUserBuiltTrainingPlan(input.draftReview.draft);
  const importedSeed = buildImportedPlanSeed(canonicalPlan);
  const [insertRow] = buildPersistedWorkoutInsertRows(
    input.activePlan.id,
    input.userId,
    importedSeed.workouts,
  );

  if (!insertRow) {
    throw new Error("Manual workout edit did not prepare a planned workout update row.");
  }

  return {
    phase: insertRow.phase,
    workout_type: insertRow.workout_type,
    source_workout_id: insertRow.source_workout_id,
    source_workout_type: insertRow.source_workout_type,
    workout_family: insertRow.workout_family,
    workout_identity: insertRow.workout_identity,
    calendar_icon_key: insertRow.calendar_icon_key,
    goal_context: insertRow.goal_context,
    metric_mode: insertRow.metric_mode,
    title: insertRow.title,
    notes: insertRow.notes,
    planned_rpe: insertRow.planned_rpe,
    estimated_fatigue: insertRow.estimated_fatigue,
    recovery_priority: insertRow.recovery_priority,
    steps: insertRow.steps,
    display_order: input.sourceWorkout.display_order,
  };
}

function buildPersistedWorkoutRollbackRow(sourceWorkout: PersistedPlannedWorkoutRow) {
  return {
    phase: sourceWorkout.phase,
    workout_type: sourceWorkout.workout_type,
    source_workout_id: sourceWorkout.source_workout_id,
    source_workout_type: sourceWorkout.source_workout_type,
    workout_family: sourceWorkout.workout_family,
    workout_identity: sourceWorkout.workout_identity,
    calendar_icon_key: sourceWorkout.calendar_icon_key,
    goal_context: sourceWorkout.goal_context,
    metric_mode: sourceWorkout.metric_mode,
    title: sourceWorkout.title,
    notes: sourceWorkout.notes,
    planned_rpe: sourceWorkout.planned_rpe,
    estimated_fatigue: sourceWorkout.estimated_fatigue,
    recovery_priority: sourceWorkout.recovery_priority,
    steps: sourceWorkout.steps,
    display_order: sourceWorkout.display_order,
  };
}

function buildManualWorkoutEditGoalMetadata(input: {
  activePlan: PersistedPlanCycleRow;
  existingGoalMetadata: Json | null;
  editedWorkouts: readonly PersistedPlannedWorkoutRow[];
  review: ManualWorkoutPersistedEditReview;
}): Json {
  const editMetadata = buildActivePlanUserEditMetadata({
    activePlan: input.activePlan,
    mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.editWorkout,
    mutationMode: "direct_manual_edit",
    mutationPayloadVersion: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
    mutationChecksum: input.review.mutationChecksum,
    plannedWorkoutId: input.review.plannedWorkoutId,
    previousWorkoutDate: input.review.workoutDate,
    targetWorkoutId: input.review.plannedWorkoutId,
    reviewChecksum: input.review.reviewChecksum,
    reviewPayloadVersion: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
    targetDate: input.review.workoutDate,
    templateKey: input.review.templateKey,
    title: input.review.title,
    trustedClientRows: false,
    workoutAuthoringSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  });
  const root = appendActivePlanUserEditMetadataToRecord(
    asJsonRecord(input.existingGoalMetadata),
    editMetadata,
  );
  const manualPlan = asJsonRecord(root.manual_user_built_plan);

  return toJson({
    ...root,
    source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
    manual_user_built_plan: {
      ...manualPlan,
      source_kind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
      source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
      row_count: input.editedWorkouts.length,
      non_rest_row_count: input.editedWorkouts.filter((workout) => workout.workout_type !== "rest")
        .length,
      latest_edit_review_payload_version: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
      latest_edit_review_checksum: input.review.reviewChecksum,
      latest_edited_workout: buildManualWorkoutEditMetadata(input.review),
    },
  });
}

function buildManualWorkoutEditPlanPreferences(input: {
  activePlan: PersistedPlanCycleRow;
  existingPlanPreferences: Json | null;
  review: ManualWorkoutPersistedEditReview;
}): Json {
  const editMetadata = buildActivePlanUserEditMetadata({
    activePlan: input.activePlan,
    mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.editWorkout,
    mutationMode: "direct_manual_edit",
    mutationPayloadVersion: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
    mutationChecksum: input.review.mutationChecksum,
    plannedWorkoutId: input.review.plannedWorkoutId,
    previousWorkoutDate: input.review.workoutDate,
    targetWorkoutId: input.review.plannedWorkoutId,
    reviewChecksum: input.review.reviewChecksum,
    reviewPayloadVersion: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
    targetDate: input.review.workoutDate,
    templateKey: input.review.templateKey,
    title: input.review.title,
    trustedClientRows: false,
    workoutAuthoringSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  });
  const root = appendActivePlanUserEditMetadataToRecord(
    asJsonRecord(input.existingPlanPreferences),
    editMetadata,
  );
  const editHistory = Array.isArray(root.manual_workout_authoring_edits)
    ? root.manual_workout_authoring_edits
    : [];
  const editMetadataRecord = buildManualWorkoutEditMetadata(input.review);

  return toJson({
    ...root,
    manual_workout_authoring_edit: editMetadataRecord,
    manual_workout_authoring_edits: [...editHistory, editMetadataRecord],
  });
}

function mapDraftFailureReason(reason: string): ManualWorkoutPersistedEditFailureReason {
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

function mapDraftReviewFailureReason(
  reason: Extract<ManualWorkoutDraftReviewResult, { ok: false }>["reason"],
): ManualWorkoutPersistedEditFailureReason {
  switch (reason) {
    case "active_plan_conflict":
      return "unsupported_active_plan_source";
    case "protected_date_conflict":
      return "protected_day";
    case "invalid_input":
      return "invalid_input";
    case "unsafe_metric_truth":
      return "source_workout_not_supported";
    default:
      return "source_workout_not_supported";
  }
}

function buildEditBlocked(input: {
  reason: ManualWorkoutPersistedEditFailureReason;
  message: string;
}): ManualWorkoutPersistedEditBlockedResult {
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

function inputHasClientPayload(error: z.ZodError) {
  return error.issues.some((issue) => issue.code === "unrecognized_keys");
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

function asJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
