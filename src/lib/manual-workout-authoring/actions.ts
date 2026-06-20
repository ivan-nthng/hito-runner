import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isEditableActivePlanSourceKind } from "@/lib/active-plan-workout-editing/policy";
import {
  createEmptyActivePlanForUser,
  createFirstPlanFromReviewedCanonicalPlanForUser,
  getActivePlan,
} from "@/lib/active-plan-persistence";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { type TrainingPlanV2 } from "@/lib/imported-plan";
import {
  buildManualEmptyActivePlanCreationInput,
  buildManualWorkoutPersistenceMetadata,
  buildManualWorkoutUserBuiltTrainingPlan,
  deriveManualTargetTruthMode,
} from "@/lib/manual-workout-authoring/persistence";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import {
  addReviewedManualWorkoutToActivePlanForUser,
  type ManualWorkoutActivePlanAddDependencies,
} from "@/lib/manual-workout-authoring/active-plan-add";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  manualWorkoutDraftInputSchema,
  manualWorkoutConfirmInputSchema,
  manualWorkoutAddToActivePlanInputSchema,
  manualEmptyPlanSetupInputSchema,
  MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
  MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutCanonicalDraft,
  type ManualEmptyPlanCreateFailureReason,
  type ManualEmptyPlanCreateResult,
  type ManualWorkoutConfirmFailureReason,
  type ManualWorkoutConfirmResult,
  type ManualWorkoutDraftConflict,
  type ManualWorkoutDraftIssue,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutTargetTruthMode,
  type ParsedManualWorkoutDraftInput,
} from "@/lib/manual-workout-authoring/schema";
import { normalizeManualWorkoutDraft } from "@/lib/manual-workout-authoring/normalize";
import { validateManualWorkoutDraft } from "@/lib/manual-workout-authoring/validator";
import type { AdditionalPlanPersistenceMetadata } from "@/lib/plan-authoring-snapshot";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import { todayIso } from "@/lib/training";

type ManualWorkoutDraftRejectionReason = Extract<
  ManualWorkoutDraftReviewResult,
  { ok: false }
>["reason"];

const MANUAL_WORKOUT_REVIEW_TOKEN_PREFIX = "manual-workout-review-v1.";

type ManualWorkoutConfirmDependencies = {
  getActivePlanForUser?: typeof getActivePlan;
  createFirstPlanForUser?: typeof createFirstPlanFromReviewedCanonicalPlanForUser;
};

type ManualEmptyPlanCreateDependencies = {
  getActivePlanForUser?: typeof getActivePlan;
  createEmptyPlanForUser?: typeof createEmptyActivePlanForUser;
  currentDate?: string;
};

type ManualWorkoutAddToActivePlanDependencies = ManualWorkoutActivePlanAddDependencies;

type ManualWorkoutReviewExactnessResult =
  | {
      ok: true;
      draft: ManualWorkoutCanonicalDraft;
      canonicalPlan: TrainingPlanV2;
      reviewChecksum: string;
      targetTruthMode: ManualWorkoutTargetTruthMode;
      reviewWarnings: string[];
      persistenceMetadata: AdditionalPlanPersistenceMetadata;
    }
  | {
      ok: false;
      reason: ManualWorkoutConfirmFailureReason;
      message: string;
    };

export function reviewManualWorkoutDraft(input: unknown): ManualWorkoutDraftReviewResult {
  const parsed = manualWorkoutDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return rejectManualWorkoutDraft({
      reason: "invalid_input",
      message: "Manual workout draft input is invalid.",
      issues: parsed.error.issues.map(zodIssueToManualIssue),
      conflicts: [],
    });
  }

  const lifecycleConflict = buildLifecycleConflict(parsed.data);

  if (lifecycleConflict) {
    return rejectManualWorkoutDraft({
      reason:
        lifecycleConflict.code === "existing_active_plan_not_supported"
          ? "active_plan_conflict"
          : "protected_date_conflict",
      message: lifecycleConflict.message,
      issues: [
        {
          code:
            lifecycleConflict.code === "existing_active_plan_not_supported"
              ? "active_plan_conflict"
              : "protected_date_conflict",
          message: lifecycleConflict.message,
          path: ["context"],
        },
      ],
      conflicts: [lifecycleConflict],
    });
  }

  const validation = validateManualWorkoutDraft(parsed.data);

  if (!validation.ok) {
    return rejectManualWorkoutDraft({
      reason: deriveRejectionReason(validation.issues),
      message: validation.issues[0]?.message ?? "Manual workout draft was rejected.",
      issues: validation.issues,
      conflicts: [],
    });
  }

  const normalized = normalizeManualWorkoutDraft({
    parsedInput: parsed.data,
    template: validation.template,
    targetTruthMode: validation.targetTruthMode,
    entries: validation.entries,
  });
  const exactnessPayload = buildManualWorkoutReviewExactnessPayload(normalized.draft);
  const reviewChecksum = stableManualWorkoutChecksum64Hex(exactnessPayload);

  return {
    ok: true,
    status: "draft_ready",
    draft: normalized.draft,
    review: {
      headline: `${normalized.draft.title} is ready for review.`,
      bullets: [
        `Template: ${normalized.draft.templateKey}.`,
        normalized.draft.workoutType === "rest"
          ? "Rest day has no executable run targets."
          : `Executable structure: ${normalized.draft.steps.length} segment${normalized.draft.steps.length === 1 ? "" : "s"}, ${normalized.draft.totalDurationMin} min planned duration.`,
        "No Supabase write happens in this review step.",
      ],
      warnings: normalized.reviewWarnings,
    },
    reviewToken: `${MANUAL_WORKOUT_REVIEW_TOKEN_PREFIX}${reviewChecksum}`,
    reviewChecksum,
    exactnessPayloadVersion: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
    conflicts: [],
  };
}

export const confirmManualWorkoutDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutConfirmResult> => {
    const auth = getRequestAuthContext();

    if (!auth.userId) {
      return buildManualWorkoutConfirmFailure({
        reason: "unauthenticated",
        message: "Sign in before creating a manual user-built plan.",
      });
    }

    let userId: string | null = null;
    try {
      userId = await getPersistedUserIdForAuthContext(auth);
    } catch {
      return buildManualWorkoutConfirmFailure({
        reason: "unauthenticated",
        message: "This session cannot create a persisted manual plan yet.",
      });
    }

    if (!userId) {
      return buildManualWorkoutConfirmFailure({
        reason: "unauthenticated",
        message: "This session cannot create a persisted manual plan yet.",
      });
    }

    return confirmManualWorkoutDraftForUser(userId, data);
  });

export const createEmptyManualActivePlan = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualEmptyPlanCreateResult> => {
    const auth = getRequestAuthContext();

    if (!auth.userId) {
      return buildManualEmptyPlanCreateFailure({
        reason: "unauthenticated",
        message: "Sign in before creating a manual user-built plan.",
      });
    }

    let userId: string | null = null;
    try {
      userId = await getPersistedUserIdForAuthContext(auth);
    } catch {
      return buildManualEmptyPlanCreateFailure({
        reason: "unauthenticated",
        message: "This session cannot create a persisted manual plan yet.",
      });
    }

    if (!userId) {
      return buildManualEmptyPlanCreateFailure({
        reason: "unauthenticated",
        message: "This session cannot create a persisted manual plan yet.",
      });
    }

    return createEmptyManualActivePlanForUser(userId, data);
  });

export const addManualWorkoutToActivePlan = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutAddToActivePlanResult> => {
    const auth = getRequestAuthContext();

    if (!auth.userId) {
      return buildManualWorkoutAddToActivePlanFailure({
        reason: "unauthenticated",
        message: "Sign in before adding workouts to a manual user-built plan.",
      });
    }

    let userId: string | null = null;
    try {
      userId = await getPersistedUserIdForAuthContext(auth);
    } catch {
      return buildManualWorkoutAddToActivePlanFailure({
        reason: "unauthenticated",
        message: "This session cannot update a persisted manual plan yet.",
      });
    }

    if (!userId) {
      return buildManualWorkoutAddToActivePlanFailure({
        reason: "unauthenticated",
        message: "This session cannot update a persisted manual plan yet.",
      });
    }

    return addManualWorkoutToActivePlanForUser(userId, data);
  });

export async function confirmManualWorkoutDraftForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutConfirmDependencies = {},
): Promise<ManualWorkoutConfirmResult> {
  const parsed = manualWorkoutConfirmInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildManualWorkoutConfirmFailure({
      reason: "invalid_review",
      message: "The manual workout confirmation payload is invalid. Refresh the review.",
    });
  }

  const request = parsed.data;
  const getActivePlanForUser = dependencies.getActivePlanForUser ?? getActivePlan;
  const createFirstPlanForUser =
    dependencies.createFirstPlanForUser ?? createFirstPlanFromReviewedCanonicalPlanForUser;

  let activePlan: Awaited<ReturnType<typeof getActivePlan>> | null = null;
  try {
    activePlan = await getActivePlanForUser(userId);
  } catch {
    return buildManualWorkoutConfirmFailure({
      reason: "persistence_failed",
      message:
        "The manual plan could not verify the current active-plan state. Try again before creating a plan.",
    });
  }

  if (activePlan) {
    return buildManualWorkoutConfirmFailure({
      reason: "active_plan_exists",
      message:
        "Manual user-built plans can be created only when there is no active plan. Use Open plan to update or replace an existing plan.",
    });
  }

  const exactness = validateManualWorkoutReviewExactness({
    draftInput: request.draftInput,
    reviewToken: request.reviewToken,
    reviewChecksum: request.reviewChecksum,
  });

  if (!exactness.ok) {
    return buildManualWorkoutConfirmFailure({
      reason: exactness.reason,
      message: exactness.message,
    });
  }

  try {
    const applyResult = await createFirstPlanForUser(
      userId,
      exactness.canonicalPlan,
      null,
      exactness.persistenceMetadata,
    );

    return {
      ok: true,
      status: "created",
      persisted: true,
      sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
      sourceStatus: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      workoutSourceStatus: MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
      schemaVersion: exactness.canonicalPlan.schema_version,
      effectiveStartDate: applyResult.effectiveStartDate,
      appliedStartDate: applyResult.appliedStartDate,
      workoutCount: applyResult.workoutCount,
      calendarRowCount: exactness.canonicalPlan.planned_workouts.length,
      nonRestWorkoutCount: exactness.canonicalPlan.planned_workouts.filter(
        (workout) => workout.workout_type !== "rest",
      ).length,
      workoutDate: exactness.draft.workoutDate,
      templateKey: exactness.draft.templateKey,
      reviewChecksum: exactness.reviewChecksum,
      exactnessPayloadVersion: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
      sourceMetadata: {
        templateKey: exactness.draft.templateKey,
        workoutDate: exactness.draft.workoutDate,
        rowCount: exactness.canonicalPlan.planned_workouts.length,
        reviewChecksum: exactness.reviewChecksum,
        metricTruthMode: exactness.targetTruthMode,
        mappingGaps: exactness.draft.mappingGaps,
      },
      safety: {
        requiresExplicitConfirm: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        callsOpenAi: false,
      },
    };
  } catch (error) {
    if (error instanceof Error && /active plan/i.test(error.message)) {
      return buildManualWorkoutConfirmFailure({
        reason: "active_plan_exists",
        message:
          "Manual user-built plans can be created only when there is no active plan. Use Open plan to update or replace an existing plan.",
      });
    }

    return buildManualWorkoutConfirmFailure({
      reason: "persistence_failed",
      message: "The manual user-built plan could not be created. The current plan is unchanged.",
    });
  }
}

export async function createEmptyManualActivePlanForUser(
  userId: string,
  input: unknown,
  dependencies: ManualEmptyPlanCreateDependencies = {},
): Promise<ManualEmptyPlanCreateResult> {
  const parsed = manualEmptyPlanSetupInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildManualEmptyPlanCreateFailure({
      reason: "invalid_input",
      message: "Manual setup input is invalid.",
    });
  }

  const getActivePlanForUser = dependencies.getActivePlanForUser ?? getActivePlan;
  const createEmptyPlanForUser =
    dependencies.createEmptyPlanForUser ?? createEmptyActivePlanForUser;
  const currentDate = dependencies.currentDate ?? todayIso();

  let activePlan: Awaited<ReturnType<typeof getActivePlan>> | null = null;
  try {
    activePlan = await getActivePlanForUser(userId);
  } catch {
    return buildManualEmptyPlanCreateFailure({
      reason: "persistence_failed",
      message:
        "The manual plan could not verify the current active-plan state. Try again before creating a plan.",
    });
  }

  if (activePlan) {
    return buildManualEmptyPlanCreateFailure({
      reason: "active_plan_exists",
      message:
        "Manual user-built plans can be created only when there is no active plan. Open the existing plan to add workouts.",
    });
  }

  const creationInput = buildManualEmptyActivePlanCreationInput({
    setup: parsed.data,
    currentDate,
  });

  try {
    const applyResult = await createEmptyPlanForUser(userId, creationInput);

    return {
      ok: true,
      status: "created",
      persisted: true,
      sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
      sourceStatus: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
      schemaVersion: "training-plan-v2",
      activePlanId: applyResult.planCycle.id,
      effectiveStartDate: applyResult.effectiveStartDate,
      appliedStartDate: applyResult.appliedStartDate,
      workoutCount: 0,
      calendarRowCount: 0,
      nonRestWorkoutCount: 0,
      setup: parsed.data,
      sourceMetadata: {
        creationMode: "empty_manual_setup",
        setupPayloadVersion: MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
        rowCount: 0,
        nonRestRowCount: 0,
        runningLevel: parsed.data.runningLevel,
      },
      safety: {
        createsFakeWorkout: false,
        trustedClientRows: false,
        callsOpenAi: false,
        readyForManualAdd: true,
      },
    };
  } catch (error) {
    if (error instanceof Error && /active plan/i.test(error.message)) {
      return buildManualEmptyPlanCreateFailure({
        reason: "active_plan_exists",
        message:
          "Manual user-built plans can be created only when there is no active plan. Open the existing plan to add workouts.",
      });
    }

    return buildManualEmptyPlanCreateFailure({
      reason: "persistence_failed",
      message: "The empty manual user-built plan could not be created. No plan was changed.",
    });
  }
}

export async function addManualWorkoutToActivePlanForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutAddToActivePlanDependencies = {},
): Promise<ManualWorkoutAddToActivePlanResult> {
  const parsed = manualWorkoutAddToActivePlanInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildManualWorkoutAddToActivePlanFailure({
      reason: "invalid_review",
      message: "The manual workout add payload is invalid. Refresh the review.",
    });
  }

  const request = parsed.data;
  const exactness = validateManualWorkoutReviewExactness({
    draftInput: request.draftInput,
    reviewToken: request.reviewToken,
    reviewChecksum: request.reviewChecksum,
  });

  if (!exactness.ok) {
    return buildManualWorkoutAddToActivePlanFailure({
      reason: mapExactnessFailureToAddWorkoutFailure(exactness.reason),
      message: exactness.message,
    });
  }

  return addReviewedManualWorkoutToActivePlanForUser(
    userId,
    exactness,
    dependencies,
    request.activePlanId,
  );
}

export function validateManualWorkoutReviewExactness(input: {
  draftInput: unknown;
  reviewToken: string;
  reviewChecksum: string;
}): ManualWorkoutReviewExactnessResult {
  const review = reviewManualWorkoutDraft(input.draftInput);

  if (!review.ok) {
    return {
      ok: false,
      reason: review.reason,
      message: review.message,
    };
  }

  if (review.draft.workoutType === "rest") {
    return {
      ok: false,
      reason: "manual_workout_required",
      message:
        "Create at least one reviewed workout before starting a manual user-built active plan.",
    };
  }

  if (input.reviewChecksum !== review.reviewChecksum) {
    return {
      ok: false,
      reason: "stale_review",
      message:
        "This manual workout review no longer matches the current draft. Refresh the review before creating a plan.",
    };
  }

  const expectedToken = `${MANUAL_WORKOUT_REVIEW_TOKEN_PREFIX}${review.reviewChecksum}`;
  if (!safeTokenEqual(input.reviewToken, expectedToken)) {
    return {
      ok: false,
      reason: "invalid_review",
      message:
        "This manual workout review token is invalid. Refresh the review before creating a plan.",
    };
  }

  const canonicalPlan = buildManualWorkoutUserBuiltTrainingPlan(review.draft);

  return {
    ok: true,
    draft: review.draft,
    canonicalPlan,
    reviewChecksum: review.reviewChecksum,
    targetTruthMode: deriveManualTargetTruthMode(review.draft),
    reviewWarnings: review.review.warnings,
    persistenceMetadata: buildManualWorkoutPersistenceMetadata({
      draft: review.draft,
      canonicalPlan,
      reviewChecksum: review.reviewChecksum,
      warnings: review.review.warnings,
    }),
  };
}

export function buildManualWorkoutReviewExactnessPayload(draft: ManualWorkoutCanonicalDraft) {
  return {
    version: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
    sourceKind: draft.sourceKind,
    sourceStatus: draft.sourceStatus,
    persisted: draft.persisted,
    templateKey: draft.templateKey,
    workoutDate: draft.workoutDate,
    weekday: draft.weekday,
    title: draft.title,
    notes: draft.notes,
    workoutType: draft.workoutType,
    sourceWorkoutType: draft.sourceWorkoutType,
    workoutFamily: draft.workoutFamily,
    workoutIdentity: draft.workoutIdentity,
    calendarIconKey: draft.calendarIconKey,
    metricMode: draft.metricMode,
    steps: draft.steps,
    plannedRpe: draft.plannedRpe,
    estimatedFatigue: draft.estimatedFatigue,
    recoveryPriority: draft.recoveryPriority,
    totalDurationMin: draft.totalDurationMin,
    totalDistanceKm: draft.totalDistanceKm,
  };
}

function buildManualWorkoutConfirmFailure(input: {
  reason: ManualWorkoutConfirmFailureReason;
  message: string;
}): Extract<ManualWorkoutConfirmResult, { ok: false }> {
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

function buildManualWorkoutAddToActivePlanFailure(input: {
  reason: Extract<ManualWorkoutAddToActivePlanResult, { ok: false }>["reason"];
  message: string;
}): Extract<ManualWorkoutAddToActivePlanResult, { ok: false }> {
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

function buildManualEmptyPlanCreateFailure(input: {
  reason: ManualEmptyPlanCreateFailureReason;
  message: string;
}): Extract<ManualEmptyPlanCreateResult, { ok: false }> {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: input.reason,
    message: input.message,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  };
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

function buildLifecycleConflict(
  input: ParsedManualWorkoutDraftInput,
): ManualWorkoutDraftConflict | null {
  const context = input.context ?? {
    mode: "no_active_plan_draft" as const,
    targetDateProtection: "none" as const,
  };

  if (
    context.mode === "existing_active_plan" &&
    !isEditableActivePlanSourceKind(context.activePlanSourceKind)
  ) {
    return {
      code: "existing_active_plan_not_supported",
      message: "This active plan source is not supported for manual workout authoring yet.",
      workoutDate: input.workoutDate,
      activePlanId: context.activePlanId ?? null,
    };
  }

  if (context.targetDateProtection === "none") {
    return null;
  }

  return {
    code:
      context.targetDateProtection === "provider_evidence" ||
      context.targetDateProtection === "actual_metrics" ||
      context.targetDateProtection === "comparison_or_ai_insight"
        ? "protected_provider_or_analysis"
        : "protected_past_or_history",
    message: `Manual workout authoring is blocked for ${context.targetDateProtection} on ${input.workoutDate}.`,
    workoutDate: input.workoutDate,
    activePlanId: context.activePlanId ?? null,
  };
}

function mapExactnessFailureToAddWorkoutFailure(
  reason: ManualWorkoutConfirmFailureReason,
): Extract<ManualWorkoutAddToActivePlanResult, { ok: false }>["reason"] {
  switch (reason) {
    case "active_plan_exists":
      return "active_plan_conflict";
    default:
      return reason;
  }
}

function rejectManualWorkoutDraft(input: {
  reason: ManualWorkoutDraftRejectionReason;
  message: string;
  issues: ManualWorkoutDraftIssue[];
  conflicts: ManualWorkoutDraftConflict[];
}): ManualWorkoutDraftReviewResult {
  return {
    ok: false,
    status: "draft_rejected",
    reason: input.reason,
    message: input.message,
    issues: input.issues,
    conflicts: input.conflicts,
    persisted: false,
  };
}

function deriveRejectionReason(
  issues: ManualWorkoutDraftIssue[],
): ManualWorkoutDraftRejectionReason {
  if (issues.some((issue) => issue.code === "unsupported_mapping")) {
    return "unsupported_mapping";
  }

  if (issues.some((issue) => issue.code === "unsupported_template")) {
    return "unsupported_template";
  }

  if (issues.some((issue) => issue.code === "unsafe_metric_truth")) {
    return "unsafe_metric_truth";
  }

  return "unsafe_block_structure";
}

function zodIssueToManualIssue(issue: z.ZodIssue): ManualWorkoutDraftIssue {
  return {
    code: "invalid_input",
    message: issue.message,
    path: issue.path,
  };
}
