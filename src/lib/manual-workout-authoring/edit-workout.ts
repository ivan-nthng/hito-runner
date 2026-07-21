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
import { buildImportedPlanSeed } from "@/lib/imported-plan";
import type { ManualWorkoutActivePlanAddDependencies } from "@/lib/manual-workout-authoring/active-plan-add";
import { reviewManualWorkoutDraft } from "@/lib/manual-workout-authoring/actions";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";
import {
  buildManualWorkoutEditMetadata,
  buildPersistedEditReview,
  buildSourceWorkoutFingerprint,
  MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
  validatePersistedEditReviewProof,
  type ManualWorkoutPersistedEditReview,
} from "@/lib/manual-workout-authoring/edit-workout-review-token";
import {
  persistedManualWorkoutHasUnsafeMetricTruth,
  validatePreservedAiAuthoredTargetTruth,
} from "@/lib/manual-workout-authoring/persisted-workout-safety";
import { buildManualWorkoutUserBuiltTrainingPlan } from "@/lib/manual-workout-authoring/persistence";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftProcessingOptions,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import { getCurrentManualWorkoutAuthoringUserId } from "@/lib/manual-workout-authoring/request-auth";
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
  sourceKind: string | null;
  workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
};

export type ManualWorkoutPersistedEditReconstructResult =
  | {
      ok: true;
      status: "draft_reconstructed";
      persisted: false;
      sourceKind: string;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      activePlanId: string;
      plannedWorkoutId: string;
      workoutDate: string;
      draftInput: ManualWorkoutDraftInput;
      safety: {
        sourceWorkoutVerified: true;
        reconstructedFromPersistedWorkout: true;
        historyPreservationRequired: true;
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
      sourceKind: string;
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
        historyPreservationRequired: true;
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
      sourceKind: string;
      sourceStatus: string | null;
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
        originalPlanSourceKind: string;
        originalPlanSourceStatus: string | null;
        originalPlanOriginSourceKind: string | null;
        originalPlanOriginSourceStatus: string | null;
        originalWorkoutSourceId: string | null;
        originalWorkoutSourceType: string | null;
        originalWorkoutFamily: string | null;
        originalWorkoutIdentity: string | null;
        trustedClientRows: false;
      };
      safety: {
        requiresExplicitConfirm: true;
        sourceWorkoutVerified: true;
        reconstructedFromPersistedWorkout: true;
        activePlanSourceVerified: true;
        preEditPlannedTruthPreserved: true;
        historicalRecordsPreserved: true;
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
  persistWorkoutEdit?: typeof persistManualWorkoutPersistedEdit;
};

type ManualWorkoutPersistedEditTarget =
  | {
      ok: true;
      activePlan: PersistedPlanCycleRow;
      sourceWorkout: PersistedPlannedWorkoutRow;
      sourceDraftInput: ManualWorkoutDraftInput;
      sourceDraftProcessingOptions: ManualWorkoutDraftProcessingOptions;
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

type PersistManualWorkoutEditResult =
  | {
      ok: true;
      editedWorkout: PersistedPlannedWorkoutRow;
      planCycle: PersistedPlanCycleRow;
    }
  | {
      ok: false;
      reason: "stale_review" | "protected_day";
      message: string;
    };

export const reconstructManualWorkoutPersistedEditDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutPersistedEditReconstructResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();

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
    const userId = await getCurrentManualWorkoutAuthoringUserId();

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
    const userId = await getCurrentManualWorkoutAuthoringUserId();

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

  return {
    ok: true,
    status: "draft_reconstructed",
    persisted: false,
    sourceKind: target.activePlan.source_kind!,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
    activePlanId: target.activePlan.id,
    plannedWorkoutId: target.sourceWorkout.id,
    workoutDate: target.sourceWorkout.workout_date,
    draftInput: target.sourceDraftInput,
    safety: {
      sourceWorkoutVerified: true,
      reconstructedFromPersistedWorkout: true,
      historyPreservationRequired: true,
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

  const targetTruth = validatePreservedAiAuthoredTargetTruth(
    parsed.data.draftInput,
    target.sourceDraftInput,
  );
  if (!targetTruth.ok) {
    return buildEditBlocked({
      reason: "client_payload_rejected",
      message: targetTruth.message,
    });
  }

  const draftReview = reviewManualWorkoutDraft(parsed.data.draftInput, {
    allowPreservedAiAuthoredTargets: true,
    allowPersistedTemplateShape: true,
    ...target.sourceDraftProcessingOptions,
  });
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
    sourceKind: target.activePlan.source_kind!,
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
      historyPreservationRequired: true,
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

  const targetTruth = validatePreservedAiAuthoredTargetTruth(
    parsed.data.draftInput,
    target.sourceDraftInput,
  );
  if (!targetTruth.ok) {
    return buildEditBlocked({
      reason: "client_payload_rejected",
      message: targetTruth.message,
    });
  }

  const draftReview = reviewManualWorkoutDraft(parsed.data.draftInput, {
    allowPreservedAiAuthoredTargets: true,
    allowPersistedTemplateShape: true,
    ...target.sourceDraftProcessingOptions,
  });
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

  const reviewProof = validatePersistedEditReviewProof({
    expectedChecksum: review.reviewChecksum,
    reviewChecksum: parsed.data.reviewChecksum,
    reviewToken: parsed.data.reviewToken,
  });

  if (!reviewProof.ok && reviewProof.reason === "stale_review") {
    return buildEditBlocked({
      reason: "stale_review",
      message: "This manual workout edit review no longer matches the current workout.",
    });
  }

  if (!reviewProof.ok) {
    return buildEditBlocked({
      reason: "invalid_review",
      message: "This manual workout edit review token is invalid. Refresh the review.",
    });
  }

  const persistEdit = dependencies.persistWorkoutEdit ?? persistManualWorkoutPersistedEdit;

  try {
    const persistence = await persistEdit({
      userId,
      activePlan: target.activePlan,
      sourceWorkout: target.sourceWorkout,
      otherWorkouts: target.otherWorkouts,
      draftReview,
      review,
    });

    if (!persistence.ok) {
      return buildEditBlocked(persistence);
    }

    const auditMetadata = buildManualWorkoutActivePlanEditMetadata({
      activePlan: target.activePlan,
      sourceWorkout: target.sourceWorkout,
      review,
    });
    const calendarRowCount = target.otherWorkouts.length + 1;
    const nonRestWorkoutCount =
      target.otherWorkouts.filter((workout) => workout.workout_type !== "rest").length + 1;

    return {
      ok: true,
      status: "updated",
      persisted: true,
      sourceKind: target.activePlan.source_kind!,
      sourceStatus: resolveActivePlanSourceStatus(target.activePlan),
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
        originalPlanSourceKind: target.activePlan.source_kind!,
        originalPlanSourceStatus: resolveActivePlanSourceStatus(target.activePlan),
        originalPlanOriginSourceKind: auditMetadata.original_plan_origin_source_kind ?? null,
        originalPlanOriginSourceStatus: auditMetadata.original_plan_origin_source_status ?? null,
        originalWorkoutSourceId: auditMetadata.original_workout_source_id ?? null,
        originalWorkoutSourceType: auditMetadata.original_workout_source_type ?? null,
        originalWorkoutFamily: auditMetadata.original_workout_family ?? null,
        originalWorkoutIdentity: auditMetadata.original_workout_identity ?? null,
        trustedClientRows: false,
      },
      safety: {
        requiresExplicitConfirm: true,
        sourceWorkoutVerified: true,
        reconstructedFromPersistedWorkout: true,
        activePlanSourceVerified: true,
        preEditPlannedTruthPreserved: true,
        historicalRecordsPreserved: true,
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
}: PersistManualWorkoutEditInput): Promise<PersistManualWorkoutEditResult> {
  const supabase = createAdminSupabaseClient();
  const updateRow = buildPersistedWorkoutEditUpdateRow({
    userId,
    activePlan,
    sourceWorkout,
    draftReview,
  });

  const editedWorkouts = [
    ...otherWorkouts,
    {
      ...sourceWorkout,
      ...updateRow,
    },
  ];
  const mutation = await supabase.rpc("apply_active_plan_workout_content_edit", {
    p_current_date: todayIso(),
    p_expected_plan_updated_at: activePlan.updated_at,
    p_expected_workout: toJson(buildSourceWorkoutFingerprint(sourceWorkout)),
    p_plan_goal_metadata: buildManualWorkoutEditGoalMetadata({
      activePlan,
      sourceWorkout,
      existingGoalMetadata: activePlan.goal_metadata,
      editedWorkouts,
      review,
    }),
    p_plan_id: activePlan.id,
    p_plan_preferences: buildManualWorkoutEditPlanPreferences({
      activePlan,
      sourceWorkout,
      existingPlanPreferences: activePlan.plan_preferences,
      review,
    }),
    p_user_id: userId,
    p_workout_id: sourceWorkout.id,
    p_workout_update: toJson(updateRow),
  });

  if (mutation.error) {
    throw new Error(mutation.error.message);
  }

  const result = asJsonRecord(mutation.data);
  if (result.ok !== true) {
    if (result.reason === "stale_review" || result.reason === "protected_day") {
      return {
        ok: false,
        reason: result.reason,
        message:
          typeof result.message === "string"
            ? result.message
            : "The reviewed workout edit is no longer safe to apply.",
      } satisfies PersistManualWorkoutEditResult;
    }

    throw new Error(
      typeof result.message === "string"
        ? result.message
        : "Manual workout edit transaction was rejected.",
    );
  }

  return {
    ok: true,
    editedWorkout: readPersistedRpcRow<PersistedPlannedWorkoutRow>(
      result.edited_workout,
      sourceWorkout.id,
    ),
    planCycle: readPersistedRpcRow<PersistedPlanCycleRow>(result.plan_cycle, activePlan.id),
  };
}

async function resolveManualWorkoutPersistedEditTarget(
  userId: string,
  input: ManualWorkoutPersistedEditSourceInput,
  dependencies: ManualWorkoutPersistedEditDependencies,
): Promise<ManualWorkoutPersistedEditTarget> {
  const getContext = dependencies.getExistingPlanContextForUser ?? getExistingPlanContext;
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
      message: "Create or open an active plan before editing workouts.",
    };
  }

  if (input.activePlanId && activePlan.id !== input.activePlanId) {
    return {
      ok: false,
      reason: "stale_review",
      message: "The active plan changed. Refresh the workout before editing.",
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
      message: "The planned workout was not found in the current active plan.",
    };
  }

  if (sourceWorkout.user_id !== userId || sourceWorkout.plan_cycle_id !== activePlan.id) {
    return {
      ok: false,
      reason: "source_workout_not_in_active_plan",
      message: "The planned workout is not part of the current runner's active plan.",
    };
  }

  if (sourceWorkout.workout_date !== input.workoutDate) {
    return {
      ok: false,
      reason: "source_date_changed",
      message: "The planned workout is no longer on this date. Refresh the workout.",
    };
  }

  if (sourceWorkout.workout_date < currentDate) {
    return {
      ok: false,
      reason: "protected_day",
      message: "Workout detail editing is not available for past planned workouts.",
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
    sourceDraftInput: reconstructed.draftInput,
    sourceDraftProcessingOptions: reconstructed.processingOptions,
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

function buildManualWorkoutEditGoalMetadata(input: {
  activePlan: PersistedPlanCycleRow;
  sourceWorkout: PersistedPlannedWorkoutRow;
  existingGoalMetadata: Json | null;
  editedWorkouts: readonly PersistedPlannedWorkoutRow[];
  review: ManualWorkoutPersistedEditReview;
}): Json {
  const editMetadata = buildManualWorkoutActivePlanEditMetadata(input);
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
  sourceWorkout: PersistedPlannedWorkoutRow;
  existingPlanPreferences: Json | null;
  review: ManualWorkoutPersistedEditReview;
}): Json {
  const editMetadata = buildManualWorkoutActivePlanEditMetadata(input);
  const root = appendActivePlanUserEditMetadataToRecord(
    asJsonRecord(input.existingPlanPreferences),
    editMetadata,
  );
  const editHistory = Array.isArray(root.manual_workout_authoring_edits)
    ? root.manual_workout_authoring_edits
    : [];
  const editMetadataRecord = buildManualWorkoutEditMetadata(input.review);

  if (input.activePlan.source_kind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND) {
    return toJson(root);
  }

  return toJson({
    ...root,
    manual_workout_authoring_edit: editMetadataRecord,
    manual_workout_authoring_edits: [...editHistory, editMetadataRecord],
  });
}

function buildManualWorkoutActivePlanEditMetadata(input: {
  activePlan: PersistedPlanCycleRow;
  sourceWorkout: PersistedPlannedWorkoutRow;
  review: ManualWorkoutPersistedEditReview;
}) {
  return buildActivePlanUserEditMetadata({
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
    originalWorkoutSourceId: input.sourceWorkout.source_workout_id,
    originalWorkoutSourceType: input.sourceWorkout.source_workout_type,
    originalWorkoutFamily: input.sourceWorkout.workout_family,
    originalWorkoutIdentity: input.sourceWorkout.workout_identity,
    previousWorkout: input.sourceWorkout,
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
    sourceKind: null,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  };
}

function inputHasClientPayload(error: z.ZodError) {
  return error.issues.some((issue) => issue.code === "unrecognized_keys");
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

function readPersistedRpcRow<T extends { id: string }>(value: unknown, expectedId: string): T {
  const row = asJsonRecord(value);

  if (row.id !== expectedId) {
    throw new Error("Manual workout edit transaction returned an unexpected persisted row.");
  }

  return row as T;
}
