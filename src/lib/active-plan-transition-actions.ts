import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getExistingPlanContext,
  transitionActiveManualPlanToReviewedCanonicalPlanForUser,
  type ExistingPlanContext,
} from "@/lib/active-plan-persistence";
import { getRequestAuthContext } from "@/lib/backend/auth";
import type { AdditionalPlanPersistenceMetadata } from "@/lib/plan-authoring-snapshot";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import {
  runningPlanConfirmInputSchema,
  type RunningPlanConfirmActionInput,
} from "@/lib/running-plan-engine-actions";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  isAiGeneratedRunningPlanPreviewDraft,
} from "@/lib/ai-generated-running-plan";
import {
  RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
  buildRunningPlanPersistenceMetadata,
  buildRunningPlanProfilePatch,
  validateSelfContainedRunningPlanReviewToken,
} from "@/lib/running-plan-engine-review";
import type { Json } from "@/lib/supabase/database";
import { serverEnv } from "@/lib/supabase/env";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/training";

export const ACTIVE_PLAN_TRANSITION_REVIEW_CONTRACT_VERSION =
  "active_plan_transition_review_v1" as const;
export const ACTIVE_PLAN_TRANSITION_SOURCE_STATUS = "reviewed_active_plan_transition" as const;

const transitionReviewInputSchema = z
  .object({
    activePlanId: z.string().trim().min(1).optional().nullable(),
    candidate: runningPlanConfirmInputSchema,
  })
  .strict();

const transitionConfirmInputSchema = z
  .object({
    reviewInput: transitionReviewInputSchema,
    transitionReviewToken: z.string().trim().min(16),
    transitionReviewChecksum: z.string().trim().length(64),
  })
  .strict();

export type ActivePlanTransitionReviewInput = z.output<typeof transitionReviewInputSchema>;
export type ActivePlanTransitionConfirmInput = z.output<typeof transitionConfirmInputSchema>;

export type ActivePlanTransitionFailureReason =
  | "unauthenticated"
  | "invalid_review"
  | "stale_review"
  | "input_mismatch"
  | "preview_unavailable"
  | "no_active_plan"
  | "persistence_failed";

export type ActivePlanTransitionReviewResult =
  | {
      ok: true;
      status: "reviewed";
      persisted: false;
      mutates: false;
      callsOpenAi: false;
      reviewContractVersion: typeof ACTIVE_PLAN_TRANSITION_REVIEW_CONTRACT_VERSION;
      transitionReviewToken: string;
      transitionReviewChecksum: string;
      currentPlan: ActivePlanTransitionCurrentPlanSummary;
      candidatePlan: ActivePlanTransitionCandidateSummary;
      affectedManualSchedule: ActivePlanTransitionAffectedManualSchedule;
      preservedHistory: ActivePlanTransitionPreservedHistorySummary;
      manualTemplates: {
        preserved: true;
        statement: string;
      };
      metricHonesty: ActivePlanTransitionMetricHonestySummary;
      safety: {
        requiresExplicitConfirm: true;
        trustedClientRows: false;
        serverRebuiltCandidate: boolean;
        oldPlanWillBeArchived: true;
        upcomingManualWorkoutsMergeIntoCandidate: false;
      };
    }
  | ActivePlanTransitionBlockedResult;

export type ActivePlanTransitionConfirmResult =
  | {
      ok: true;
      status: "transitioned";
      persisted: true;
      archivedPlanId: string;
      activePlanId: string;
      sourceKind: RunningPlanConfirmActionInput["sourceKind"];
      sourceStatus: typeof RUNNING_PLAN_CONFIRMED_SOURCE_STATUS;
      schemaVersion: "training-plan-v2";
      workoutCount: number;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      transitionReviewChecksum: string;
      candidateReviewChecksum: string;
      affectedManualWorkoutCount: number;
      safety: {
        requiresExplicitConfirm: true;
        trustedClientRows: false;
        serverRebuiltCandidate: boolean;
        oldPlanArchived: true;
        upcomingManualWorkoutsMerged: false;
        callsOpenAi: false;
      };
    }
  | ActivePlanTransitionBlockedResult;

type ActivePlanTransitionBlockedResult = {
  ok: false;
  status: "blocked";
  persisted: false;
  reason: ActivePlanTransitionFailureReason;
  message: string;
  sourceKind?: RunningPlanConfirmActionInput["sourceKind"];
};

type ActivePlanTransitionCurrentPlanSummary = {
  id: string;
  title: string;
  sourceKind: string | null;
  status: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  workoutCount: number;
  upcomingWorkoutCount: number;
};

type ActivePlanTransitionCandidateSummary = {
  sourceKind: RunningPlanConfirmActionInput["sourceKind"];
  sourceStatus: typeof RUNNING_PLAN_CONFIRMED_SOURCE_STATUS;
  goalLabel: string;
  distanceMeters: number | null;
  targetDate: string | null;
  targetFinishTime: string | null;
  startDate: string;
  endDate: string;
  rowCount: number;
  nonRestRowCount: number;
  reviewChecksum: string;
};

type ActivePlanTransitionAffectedManualSchedule = {
  affectedFromDate: string;
  upcomingWorkoutCount: number;
  upcomingWorkoutDates: string[];
  statement: string;
};

type ActivePlanTransitionPreservedHistorySummary = {
  loggedWorkoutCount: number;
  evidenceBackedWorkoutCount: number;
  providerEvidenceCount: number;
  comparisonCount: number;
  aiInsightCount: number;
  statement: string;
};

type ActivePlanTransitionMetricHonestySummary = {
  paceTargetRowCount: number;
  hrTargetRowCount: number;
  fakePaceAllowed: false;
  fakePersonalHrAllowed: false;
};

export type ActivePlanTransitionEvidenceSummary = {
  providerEvidenceCount: number;
  actualMetricCount: number;
  comparisonCount: number;
  aiInsightCount: number;
  evidenceBackedWorkoutIds: string[];
};

type ActivePlanTransitionReviewPayload = {
  contract_version: typeof ACTIVE_PLAN_TRANSITION_REVIEW_CONTRACT_VERSION;
  transition_kind: "active_plan_to_selected_running_plan";
  user_id: string;
  review_date: string;
  current_plan: {
    id: string;
    source_kind: string | null;
    status: string;
    updated_at: string;
    start_date: string;
    end_date: string;
    workout_ids: string[];
    logged_workout_ids: string[];
  };
  candidate: {
    source_kind: RunningPlanConfirmActionInput["sourceKind"];
    distance_goal: ActivePlanTransitionDistanceGoalSummary;
    selected_plan_review_checksum: string;
    selected_plan_review_payload: unknown;
  };
  affected_manual_schedule: {
    upcoming_workouts: Array<{ id: string; date: string; title: string; type: string }>;
  };
  preserved_history: {
    logged_workout_count: number;
    evidence_backed_workout_ids: string[];
    provider_evidence_count: number;
    actual_metric_count: number;
    comparison_count: number;
    ai_insight_count: number;
  };
  metric_honesty: ActivePlanTransitionMetricHonestySummary;
};

type BuildTransitionReviewOk = Extract<ActivePlanTransitionReviewResult, { ok: true }> & {
  canonicalPlan: Parameters<typeof buildRunningPlanPersistenceMetadata>[0]["canonicalPlan"];
  profilePatch: ReturnType<typeof buildRunningPlanProfilePatch>;
  persistenceMetadata: AdditionalPlanPersistenceMetadata;
  currentPlanContext: ExistingPlanContext;
  payload: ActivePlanTransitionReviewPayload;
};

type ActivePlanTransitionDistanceGoalSummary = {
  label: string;
  distance_meters: number | null;
  target_date: string | null;
  target_finish_time: string | null;
};

export type ActivePlanTransitionDependencies = {
  getPlanContext: (userId: string) => Promise<ExistingPlanContext>;
  loadEvidenceSummary: (
    userId: string,
    workoutIds: readonly string[],
  ) => Promise<ActivePlanTransitionEvidenceSummary>;
  persistTransition: typeof transitionActiveManualPlanToReviewedCanonicalPlanForUser;
  today: () => string;
};

const defaultDependencies: ActivePlanTransitionDependencies = {
  getPlanContext: getExistingPlanContext,
  loadEvidenceSummary: loadTransitionEvidenceSummary,
  persistTransition: transitionActiveManualPlanToReviewedCanonicalPlanForUser,
  today: todayIso,
};

export const reviewActivePlanTransition = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => transitionReviewInputSchema.parse(value))
  .handler(async ({ data }): Promise<ActivePlanTransitionReviewResult> => {
    const userId = await getCurrentPersistedUserId();
    if (!userId) {
      return buildTransitionFailure({
        reason: "unauthenticated",
        message: "Sign in before reviewing an active-plan transition.",
        input: data.candidate,
      });
    }

    return reviewActivePlanTransitionForUser(userId, data);
  });

export const confirmActivePlanTransition = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => transitionConfirmInputSchema.parse(value))
  .handler(async ({ data }): Promise<ActivePlanTransitionConfirmResult> => {
    const userId = await getCurrentPersistedUserId();
    if (!userId) {
      return buildTransitionFailure({
        reason: "unauthenticated",
        message: "Sign in before confirming an active-plan transition.",
        input: data.reviewInput.candidate,
      });
    }

    return confirmActivePlanTransitionForUser(userId, data);
  });

export async function reviewActivePlanTransitionForUser(
  userId: string,
  input: unknown,
  dependencies: Partial<ActivePlanTransitionDependencies> = {},
): Promise<ActivePlanTransitionReviewResult> {
  const built = await buildActivePlanTransitionReview(userId, input, {
    ...defaultDependencies,
    ...dependencies,
  });

  if (!built.ok) {
    return built;
  }

  const {
    canonicalPlan: _canonicalPlan,
    profilePatch: _profilePatch,
    persistenceMetadata: _persistenceMetadata,
    currentPlanContext: _context,
    payload: _payload,
    ...review
  } = built;

  return {
    ...review,
  };
}

export async function confirmActivePlanTransitionForUser(
  userId: string,
  input: unknown,
  dependencies: Partial<ActivePlanTransitionDependencies> = {},
): Promise<ActivePlanTransitionConfirmResult> {
  const parsed = transitionConfirmInputSchema.safeParse(input);
  if (!parsed.success) {
    return buildTransitionFailure({
      reason: "invalid_review",
      message: "The active-plan transition confirmation payload is invalid. Refresh the review.",
    });
  }

  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const review = await buildActivePlanTransitionReview(
    userId,
    parsed.data.reviewInput,
    resolvedDependencies,
  );

  if (!review.ok) {
    return review;
  }

  if (review.transitionReviewChecksum !== parsed.data.transitionReviewChecksum) {
    return buildTransitionFailure({
      reason: "stale_review",
      message:
        "This active-plan transition no longer matches the current plan or selected candidate. Refresh the review.",
      input: parsed.data.reviewInput.candidate,
    });
  }

  const expectedToken = await signTransitionReviewPayload(review.payload);
  if (!safeTokenEqual(parsed.data.transitionReviewToken, expectedToken)) {
    return buildTransitionFailure({
      reason: "invalid_review",
      message: "This active-plan transition review token is invalid. Refresh the review.",
      input: parsed.data.reviewInput.candidate,
    });
  }

  try {
    const result = await resolvedDependencies.persistTransition({
      userId,
      currentActivePlan: review.currentPlanContext.activePlan!,
      expectedCurrentActivePlanUpdatedAt: review.currentPlan.updatedAt,
      reviewedPlan: review.canonicalPlan,
      replacementStartsAt: review.affectedManualSchedule.affectedFromDate,
      profilePatch: review.profilePatch,
      planMetadata: mergeTransitionPersistenceMetadata(review.persistenceMetadata, {
        transitionReviewChecksum: review.transitionReviewChecksum,
        archivedPlanId: review.currentPlan.id,
        affectedManualWorkoutCount: review.affectedManualSchedule.upcomingWorkoutCount,
        previousPlanSourceKind: review.currentPlan.sourceKind,
      }),
    });

    return {
      ok: true,
      status: "transitioned",
      persisted: true,
      archivedPlanId: result.archivedPlan.id,
      activePlanId: result.activePlan.id,
      sourceKind: review.candidatePlan.sourceKind,
      sourceStatus: RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
      schemaVersion: review.canonicalPlan.schema_version,
      workoutCount: result.workouts.filter((workout) => workout.workout_type !== "rest").length,
      calendarRowCount: result.workouts.length,
      nonRestWorkoutCount: result.workouts.filter((workout) => workout.workout_type !== "rest")
        .length,
      transitionReviewChecksum: review.transitionReviewChecksum,
      candidateReviewChecksum: review.candidatePlan.reviewChecksum,
      affectedManualWorkoutCount: review.affectedManualSchedule.upcomingWorkoutCount,
      safety: {
        requiresExplicitConfirm: true,
        trustedClientRows: false,
        serverRebuiltCandidate: false,
        oldPlanArchived: true,
        upcomingManualWorkoutsMerged: false,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildTransitionFailure({
      reason: "persistence_failed",
      message:
        "The selected plan could not replace the current plan. The current plan is unchanged.",
      input: parsed.data.reviewInput.candidate,
    });
  }
}

async function buildActivePlanTransitionReview(
  userId: string,
  input: unknown,
  dependencies: ActivePlanTransitionDependencies,
): Promise<BuildTransitionReviewOk | ActivePlanTransitionBlockedResult> {
  const parsed = transitionReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return buildTransitionFailure({
      reason: "invalid_review",
      message: "The active-plan transition review payload is invalid. Refresh the candidate.",
    });
  }

  const request = parsed.data;
  const candidate = request.candidate;

  const context = await dependencies.getPlanContext(userId);
  const activePlan = context.activePlan;

  if (!activePlan) {
    return buildTransitionFailure({
      reason: "no_active_plan",
      message: "There is no active plan to replace.",
      input: candidate,
    });
  }

  if (request.activePlanId && request.activePlanId !== activePlan.id) {
    return buildTransitionFailure({
      reason: "stale_review",
      message: "The active plan changed. Refresh the transition review.",
      input: candidate,
    });
  }

  if (candidate.sourceKind !== AI_GENERATED_RUNNING_PLAN_SOURCE_KIND) {
    return buildTransitionFailure({
      reason: "input_mismatch",
      message:
        "Active-plan transitions now require a reviewed AI-authored distance-goal candidate. Refresh the plan preview.",
      input: candidate,
    });
  }

  const candidateReview = await resolveAiGeneratedTransitionCandidate(candidate);

  if (!candidateReview.ok) {
    return buildTransitionFailure({
      reason: candidateReview.reason,
      message: candidateReview.message,
      input: candidate,
    });
  }

  const { draft, exactness } = candidateReview;
  const distanceGoal = buildTransitionDistanceGoalSummary(draft);

  const reviewDate = dependencies.today();
  const workouts = context.existingWorkouts.workouts.filter(
    (workout) => workout.plan_cycle_id === activePlan.id,
  );
  const upcomingWorkouts = workouts
    .filter((workout) => workout.workout_date >= reviewDate)
    .sort((left, right) => left.workout_date.localeCompare(right.workout_date));
  const workoutIds = workouts.map((workout) => workout.id);
  const loggedWorkoutIds = Array.from(context.existingWorkouts.logsByWorkoutId.keys()).sort();
  const evidence = await dependencies.loadEvidenceSummary(userId, workoutIds);
  const evidenceWorkoutIds = new Set(evidence.evidenceBackedWorkoutIds);
  const futureMutableWorkouts = upcomingWorkouts.filter(
    (workout) =>
      !context.existingWorkouts.logsByWorkoutId.has(workout.id) &&
      !evidenceWorkoutIds.has(workout.id),
  );
  const candidateRows = exactness.canonicalPlan.planned_workouts;
  const nonRestRows = candidateRows.filter((workout) => workout.workout_type !== "rest");
  const metricHonesty = summarizeMetricHonesty(candidateRows);
  const payload: ActivePlanTransitionReviewPayload = {
    contract_version: ACTIVE_PLAN_TRANSITION_REVIEW_CONTRACT_VERSION,
    transition_kind: "active_plan_to_selected_running_plan",
    user_id: userId,
    review_date: reviewDate,
    current_plan: {
      id: activePlan.id,
      source_kind: activePlan.source_kind,
      status: activePlan.status,
      updated_at: activePlan.updated_at,
      start_date: activePlan.start_date,
      end_date: activePlan.end_date,
      workout_ids: workoutIds.sort(),
      logged_workout_ids: loggedWorkoutIds,
    },
    candidate: {
      source_kind: candidate.sourceKind,
      distance_goal: distanceGoal,
      selected_plan_review_checksum: exactness.reviewChecksum,
      selected_plan_review_payload: exactness.reviewPayload,
    },
    affected_manual_schedule: {
      upcoming_workouts: futureMutableWorkouts.map((workout) => ({
        id: workout.id,
        date: workout.workout_date,
        title: workout.title,
        type: workout.workout_type,
      })),
    },
    preserved_history: {
      logged_workout_count: loggedWorkoutIds.length,
      evidence_backed_workout_ids: evidence.evidenceBackedWorkoutIds,
      provider_evidence_count: evidence.providerEvidenceCount,
      actual_metric_count: evidence.actualMetricCount,
      comparison_count: evidence.comparisonCount,
      ai_insight_count: evidence.aiInsightCount,
    },
    metric_honesty: metricHonesty,
  };
  const transitionReviewChecksum = await digestSha256Hex(stableJsonStringify(payload));
  const transitionReviewToken = await signTransitionReviewPayload(payload);

  return {
    ok: true,
    status: "reviewed",
    persisted: false,
    mutates: false,
    callsOpenAi: false,
    reviewContractVersion: ACTIVE_PLAN_TRANSITION_REVIEW_CONTRACT_VERSION,
    transitionReviewToken,
    transitionReviewChecksum,
    currentPlan: {
      id: activePlan.id,
      title: activePlan.title,
      sourceKind: activePlan.source_kind,
      status: activePlan.status,
      startDate: activePlan.start_date,
      endDate: activePlan.end_date,
      updatedAt: activePlan.updated_at,
      workoutCount: workouts.length,
      upcomingWorkoutCount: upcomingWorkouts.length,
    },
    candidatePlan: {
      sourceKind: candidate.sourceKind,
      sourceStatus: RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
      goalLabel: distanceGoal.label,
      distanceMeters: distanceGoal.distance_meters,
      targetDate: distanceGoal.target_date,
      targetFinishTime: distanceGoal.target_finish_time,
      startDate: exactness.canonicalPlan.start_date,
      endDate:
        exactness.canonicalPlan.planned_workouts.at(-1)?.date ?? exactness.canonicalPlan.start_date,
      rowCount: candidateRows.length,
      nonRestRowCount: nonRestRows.length,
      reviewChecksum: exactness.reviewChecksum,
    },
    affectedManualSchedule: {
      affectedFromDate: reviewDate,
      upcomingWorkoutCount: futureMutableWorkouts.length,
      upcomingWorkoutDates: futureMutableWorkouts.map((workout) => workout.workout_date),
      statement:
        "Past, logged, and evidence-backed rows stay visible in the runner calendar; only future mutable rows from this date are replaced by the reviewed plan.",
    },
    preservedHistory: {
      loggedWorkoutCount: loggedWorkoutIds.length,
      evidenceBackedWorkoutCount: evidence.evidenceBackedWorkoutIds.length,
      providerEvidenceCount: evidence.providerEvidenceCount,
      comparisonCount: evidence.comparisonCount,
      aiInsightCount: evidence.aiInsightCount,
      statement:
        "Logged workouts, provider evidence, comparisons, and protected history are carried forward into the active calendar and remain recoverable from runner history.",
    },
    manualTemplates: {
      preserved: true,
      statement:
        "Personal manual workout templates are user-library records and are not changed by this transition.",
    },
    metricHonesty,
    safety: {
      requiresExplicitConfirm: true,
      trustedClientRows: false,
      serverRebuiltCandidate: false,
      oldPlanWillBeArchived: true,
      upcomingManualWorkoutsMergeIntoCandidate: false,
    },
    canonicalPlan: exactness.canonicalPlan,
    profilePatch: buildRunningPlanProfilePatch(draft),
    persistenceMetadata: buildRunningPlanPersistenceMetadata({
      draft,
      canonicalPlan: exactness.canonicalPlan,
      reviewChecksum: exactness.reviewChecksum,
    }),
    currentPlanContext: context,
    payload,
  };
}

async function resolveAiGeneratedTransitionCandidate(candidate: RunningPlanConfirmActionInput) {
  const exactness = await validateSelfContainedRunningPlanReviewToken({
    reviewToken: candidate.reviewToken,
    reviewChecksum: candidate.reviewChecksum,
  });

  if (!exactness.ok) {
    return {
      ok: false as const,
      reason: exactness.reason,
      message: exactness.message,
    };
  }

  if (
    !isAiGeneratedRunningPlanPreviewDraft(exactness.draft) ||
    exactness.draft.sourceKind !== candidate.sourceKind
  ) {
    return {
      ok: false as const,
      reason: "input_mismatch" as const,
      message:
        "The AI-authored generated-plan candidate no longer matches the reviewed source. Refresh the review.",
    };
  }

  if (!sameJson(candidate.previewInput, exactness.draft.previewInput)) {
    return {
      ok: false as const,
      reason: "stale_review" as const,
      message:
        "The AI-authored generated-plan setup answers no longer match the reviewed candidate. Refresh the review.",
    };
  }

  return {
    ok: true as const,
    draft: exactness.draft,
    exactness,
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

function buildTransitionFailure(input: {
  reason: ActivePlanTransitionFailureReason;
  message: string;
  input?: RunningPlanConfirmActionInput;
}): ActivePlanTransitionBlockedResult {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: input.reason,
    message: input.message,
    sourceKind: input.input?.sourceKind,
  };
}

function buildTransitionDistanceGoalSummary(
  draft: Parameters<typeof buildRunningPlanPersistenceMetadata>[0]["draft"],
): ActivePlanTransitionDistanceGoalSummary {
  const intent = draft.normalizedInputSummary.planGoalIntent;

  return {
    label: intent.distance?.label ?? "Distance goal",
    distance_meters: intent.distance?.distanceMeters ?? null,
    target_date: intent.targetDate ?? null,
    target_finish_time: intent.targetFinishTime?.label ?? null,
  };
}

function mergeTransitionPersistenceMetadata(
  metadata: AdditionalPlanPersistenceMetadata,
  transition: {
    transitionReviewChecksum: string;
    archivedPlanId: string;
    affectedManualWorkoutCount: number;
    previousPlanSourceKind: string | null;
  },
): AdditionalPlanPersistenceMetadata {
  return {
    goalMetadata: mergeJsonRecord(metadata.goalMetadata, {
      active_plan_transition: {
        review_contract_version: ACTIVE_PLAN_TRANSITION_REVIEW_CONTRACT_VERSION,
        review_checksum: transition.transitionReviewChecksum,
        source_status: ACTIVE_PLAN_TRANSITION_SOURCE_STATUS,
        archived_plan_id: transition.archivedPlanId,
        previous_plan_source_kind: transition.previousPlanSourceKind,
        affected_manual_workout_count: transition.affectedManualWorkoutCount,
        future_mutable_workouts_replaced: true,
        protected_history_carried_forward: true,
        upcoming_manual_workouts_merged: false,
      },
    }),
    planPreferences: metadata.planPreferences,
  };
}

function mergeJsonRecord(value: Json | null | undefined, addition: Record<string, Json>): Json {
  return {
    ...(isRecord(value) ? value : {}),
    ...addition,
  };
}

function summarizeMetricHonesty(
  rows: readonly Parameters<
    typeof buildRunningPlanPersistenceMetadata
  >[0]["canonicalPlan"]["planned_workouts"][number][],
): ActivePlanTransitionMetricHonestySummary {
  return {
    paceTargetRowCount: rows.filter((row) =>
      JSON.stringify(row.segments).includes("pace_min_per_km_range"),
    ).length,
    hrTargetRowCount: rows.filter((row) => row.metric_mode?.hr_targets_allowed === true).length,
    fakePaceAllowed: false,
    fakePersonalHrAllowed: false,
  };
}

async function loadTransitionEvidenceSummary(
  userId: string,
  workoutIds: readonly string[],
): Promise<ActivePlanTransitionEvidenceSummary> {
  if (workoutIds.length === 0) {
    return {
      providerEvidenceCount: 0,
      actualMetricCount: 0,
      comparisonCount: 0,
      aiInsightCount: 0,
      evidenceBackedWorkoutIds: [],
    };
  }

  const supabase = createAdminSupabaseClient();
  const [assets, actualMetrics, comparisons, insights] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("id, planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", [...workoutIds]),
    supabase
      .from("workout_actual_metrics")
      .select("id, planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", [...workoutIds]),
    supabase
      .from("workout_comparisons")
      .select("id, planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", [...workoutIds]),
    supabase
      .from("workout_ai_insights")
      .select("id, planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", [...workoutIds]),
  ]);

  for (const result of [assets, actualMetrics, comparisons, insights]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const evidenceBackedWorkoutIds = new Set<string>();
  for (const row of [
    ...(assets.data ?? []),
    ...(actualMetrics.data ?? []),
    ...(comparisons.data ?? []),
    ...(insights.data ?? []),
  ]) {
    if (row.planned_workout_id) {
      evidenceBackedWorkoutIds.add(row.planned_workout_id);
    }
  }

  return {
    providerEvidenceCount: assets.data?.length ?? 0,
    actualMetricCount: actualMetrics.data?.length ?? 0,
    comparisonCount: comparisons.data?.length ?? 0,
    aiInsightCount: insights.data?.length ?? 0,
    evidenceBackedWorkoutIds: Array.from(evidenceBackedWorkoutIds).sort(),
  };
}

async function signTransitionReviewPayload(payload: ActivePlanTransitionReviewPayload) {
  const serializedPayload = stableJsonStringify(payload);
  const secret = serverEnv.supabaseServiceRoleKey;

  if (!secret) {
    return `sha256:${await digestSha256Hex(serializedPayload)}`;
  }

  return `hmac-sha256:${await hmacSha256Hex(secret, serializedPayload)}`;
}

function safeTokenEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

async function digestSha256Hex(payload: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sameJson(left: unknown, right: unknown) {
  return stableJsonStringify(left) === stableJsonStringify(right);
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, entry]) => [key, sortJsonValue(entry)]),
    );
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, Json> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
