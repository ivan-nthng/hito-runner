import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  createFirstPlanFromReviewedCanonicalPlanForUser,
  getActivePlan,
} from "@/lib/active-plan-persistence";
import { ActivePlanPersistenceRejection } from "@/lib/active-plan-lifecycle-persistence";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { parseDurationSeconds, parsePaceSecondsPerKm } from "@/lib/first-plan-authoring-utils";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildAiGeneratedRunningPlanPreviewUnavailable,
  buildAiGeneratedRunningPlanPreview,
  isAiGeneratedRunningPlanPreviewDraft,
  type AiGeneratedRunningPlanPreviewUnavailable,
  type AiGeneratedRunningPlanPreviewDraft,
  type BuildAiGeneratedRunningPlanPreviewOptions,
} from "@/lib/ai-generated-running-plan";
import {
  isAiGeneratedRunningPlanDevFixtureEnabled,
  isAiGeneratedRunningPlanDevFixtureModel,
} from "@/lib/ai-generated-running-plan-dev-fixture";
import {
  markAiPlanGenerationPersistenceFailed,
  markAiPlanGenerationPersisted,
  markAiPlanGenerationReviewRefused,
  markAiPlanGenerationReviewedDraftSigned,
} from "@/lib/ai-plan-generation-ledger";
import {
  planGoalIntentDistanceInputSchema,
  planGoalIntentInputSchema,
} from "@/lib/plan-creation-engine";
import { RUNNING_PLAN_RUNNER_LEVEL_VALUES } from "@/lib/plan-creation-engine/source-types";
import { findLocalAuthAccountByUserId } from "@/lib/local-auth";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import {
  RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
  addRunningPlanReviewProof,
  buildRunningPlanPersistenceMetadata,
  validateRunningPlanReviewExactness,
  validateSelfContainedRunningPlanReviewExactness,
  type RunningPlanReviewedPreviewDraft,
} from "@/lib/running-plan-engine-review";
import { stableJsonEqual } from "@/lib/review-token-signing";
import { getRunnerPlanAuthoringProfileSnapshotForUserId } from "@/lib/user-settings-actions";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";

const weekdayNameSchema = z.enum(WEEKDAY_NAMES);
const recent5kTimeSchema = z
  .string()
  .trim()
  .refine((value) => {
    const seconds = parseDurationSeconds(value);
    return seconds != null && seconds > 0;
  }, "Use a positive recent 5K duration.");
const recent5kPaceSchema = z
  .string()
  .trim()
  .refine((value) => {
    const seconds = parsePaceSecondsPerKm(value);
    return seconds != null && seconds > 0;
  }, "Use a positive recent 5K pace.");
const runningPlanBenchmarkSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("recent_5k_time"), recent5kTime: recent5kTimeSchema }).strict(),
  z.object({ kind: z.literal("recent_5k_pace"), recent5kPace: recent5kPaceSchema }).strict(),
  z.object({ kind: z.literal("unknown") }).strict(),
]);

export const runningPlanPreviewInputSchema = z
  .object({
    age: z.number().finite().positive(),
    heightCm: z.number().finite().positive(),
    weightKg: z.number().finite().positive(),
    runnerLevel: z.enum(RUNNING_PLAN_RUNNER_LEVEL_VALUES),
    daysPerWeek: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
        z.literal(7),
      ])
      .optional()
      .nullable(),
    fixedRestDays: z.array(weekdayNameSchema).optional().nullable(),
    preferredLongRunDay: weekdayNameSchema.optional().nullable(),
    startDate: z.string().trim().optional().nullable(),
    benchmark: runningPlanBenchmarkSchema.optional().nullable(),
    planGoalIntent: planGoalIntentInputSchema.extend({
      distance: planGoalIntentDistanceInputSchema,
    }),
  })
  .strict();

export const runningPlanSourceKindSchema = z.literal(AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);

export const runningPlanConfirmInputSchema = z
  .object({
    previewInput: runningPlanPreviewInputSchema,
    sourceKind: runningPlanSourceKindSchema,
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict();

type RunningPlanPreviewActionReadyResult = {
  ok: true;
  draft: RunningPlanReviewedPreviewDraft<AiGeneratedRunningPlanPreviewDraft>;
};

export type RunningPlanPreviewActionResult =
  | RunningPlanPreviewActionReadyResult
  | { ok: false; unavailable: AiGeneratedRunningPlanPreviewUnavailable };
export type RunningPlanPreviewActionInput = z.output<typeof runningPlanPreviewInputSchema>;
export type RunningPlanConfirmActionInput = z.output<typeof runningPlanConfirmInputSchema>;

export type RunningPlanConfirmFailureReason =
  | "unauthenticated"
  | "active_plan_exists"
  | "fixture_not_authorized"
  | "preview_unavailable"
  | "stale_review"
  | "invalid_review"
  | "input_mismatch"
  | "persistence_failed";

export type RunningPlanConfirmActionResult =
  | {
      ok: true;
      status: "created";
      persisted: true;
      sourceKind: RunningPlanConfirmActionInput["sourceKind"];
      sourceStatus: typeof RUNNING_PLAN_CONFIRMED_SOURCE_STATUS;
      schemaVersion: "training-plan-v2";
      effectiveStartDate: string;
      appliedStartDate: string;
      workoutCount: number;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      reviewChecksum: string;
      safety: {
        requiresExplicitConfirm: true;
        trustedClientRows: false;
        serverRebuiltPreview: boolean;
        callsOpenAi: false;
      };
    }
  | {
      ok: false;
      status: "blocked";
      persisted: false;
      reason: RunningPlanConfirmFailureReason;
      message: string;
      sourceKind?: RunningPlanConfirmActionInput["sourceKind"];
    };

export const previewRunningPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => runningPlanPreviewInputSchema.parse(value))
  .handler(async ({ data }): Promise<RunningPlanPreviewActionResult> => {
    const auth = getRequestAuthContext();
    let persistedUserId: string | null = null;

    try {
      persistedUserId = auth.userId ? await getPersistedUserIdForAuthContext(auth) : null;
    } catch {
      persistedUserId = null;
    }

    return buildReviewedAiGeneratedRunningPlanPreviewForUser(persistedUserId, data, {
      aiPreview: { signal: getRequest().signal },
      qaFixtureAuthorized: await isLocalQaFixtureAuthorized(auth),
    });
  });

export const confirmRunningPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => runningPlanConfirmInputSchema.parse(value))
  .handler(async ({ data }): Promise<RunningPlanConfirmActionResult> => {
    const auth = getRequestAuthContext();
    if (!auth.userId) {
      return buildConfirmFailure({
        reason: "unauthenticated",
        message: "Sign in before creating a selected running plan.",
        sourceKind: data.sourceKind,
      });
    }

    let userId: string | null = null;
    try {
      userId = await getPersistedUserIdForAuthContext(auth);
    } catch {
      return buildConfirmFailure({
        reason: "unauthenticated",
        message: "This session cannot create a persisted running plan yet.",
        sourceKind: data.sourceKind,
      });
    }

    if (!userId) {
      return buildConfirmFailure({
        reason: "unauthenticated",
        message: "This session cannot create a persisted running plan yet.",
        sourceKind: data.sourceKind,
      });
    }

    return confirmRunningPlanDraftForUser(userId, data, {
      allowLocalQaFixture: await isLocalQaFixtureAuthorized(auth),
    });
  });

export async function confirmRunningPlanDraftForUser(
  userId: string,
  input: unknown,
  options: { allowLocalQaFixture?: boolean } = {},
): Promise<RunningPlanConfirmActionResult> {
  const parsed = runningPlanConfirmInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildConfirmFailure({
      reason: "invalid_review",
      message: "The selected-plan confirmation payload is invalid. Refresh the preview.",
    });
  }

  const request = parsed.data;

  return confirmReviewedAiGeneratedRunningPlanDraftForUser(userId, request, options);
}

async function confirmReviewedAiGeneratedRunningPlanDraftForUser(
  userId: string,
  request: RunningPlanConfirmActionInput,
  options: { allowLocalQaFixture?: boolean },
): Promise<RunningPlanConfirmActionResult> {
  const exactness = await validateSelfContainedRunningPlanReviewExactness({
    reviewToken: request.reviewToken,
    reviewChecksum: request.reviewChecksum,
  });

  if (!exactness.ok) {
    return buildConfirmFailure({
      reason: exactness.reason,
      message: exactness.message,
      sourceKind: request.sourceKind,
    });
  }

  if (
    !isAiGeneratedRunningPlanPreviewDraft(exactness.draft) ||
    exactness.draft.sourceKind !== request.sourceKind
  ) {
    return buildConfirmFailure({
      reason: "input_mismatch",
      message:
        "The AI-authored generated-plan preview no longer matches the reviewed source. Refresh the preview.",
      sourceKind: request.sourceKind,
    });
  }

  if (isLocalQaFixtureReviewedDraft(exactness.draft) && options.allowLocalQaFixture !== true) {
    await markAiPlanGenerationPersistenceFailed({
      trace: exactness.draft.aiGeneration.generationTrace,
      reason: "local_qa_fixture_not_authorized",
    });
    return buildConfirmFailure({
      reason: "fixture_not_authorized",
      message:
        "This reviewed plan belongs to an isolated QA fixture session and cannot be persisted for this account.",
      sourceKind: request.sourceKind,
    });
  }

  if (!sameJson(request.previewInput, exactness.draft.previewInput)) {
    return buildConfirmFailure({
      reason: "stale_review",
      message:
        "The AI-authored generated-plan setup answers no longer match the reviewed preview. Refresh before creating a plan.",
      sourceKind: request.sourceKind,
    });
  }

  let currentProfileSnapshot: Awaited<
    ReturnType<typeof getRunnerPlanAuthoringProfileSnapshotForUserId>
  >;
  try {
    currentProfileSnapshot = await getRunnerPlanAuthoringProfileSnapshotForUserId(userId);
  } catch {
    return buildConfirmFailure({
      reason: "persistence_failed",
      message: "The runner baseline could not be verified before confirmation.",
      sourceKind: request.sourceKind,
    });
  }

  if (
    !currentProfileSnapshot ||
    !sameJson(currentProfileSnapshot, exactness.draft.normalizedInputSummary.runnerProfileSnapshot)
  ) {
    return buildConfirmFailure({
      reason: "stale_review",
      message: "The runner baseline changed after review. Refresh the plan before confirming.",
      sourceKind: request.sourceKind,
    });
  }

  let activePlan: Awaited<ReturnType<typeof getActivePlan>> | null = null;
  try {
    activePlan = await getActivePlan(userId);
  } catch {
    return buildConfirmFailure({
      reason: "persistence_failed",
      message:
        "The selected running plan could not verify the current active-plan state. Try again before creating a plan.",
      sourceKind: request.sourceKind,
    });
  }

  if (activePlan) {
    return buildConfirmFailure({
      reason: "active_plan_exists",
      message:
        "Selected plans can create a new plan only when there is no active plan. Use Add plan from the calendar to start a reviewed plan change.",
      sourceKind: request.sourceKind,
    });
  }

  try {
    const applyResult = await createFirstPlanFromReviewedCanonicalPlanForUser(
      userId,
      exactness.canonicalPlan,
      buildRunningPlanPersistenceMetadata({
        draft: exactness.draft,
        canonicalPlan: exactness.canonicalPlan,
        reviewChecksum: exactness.reviewChecksum,
      }),
      { expectedProfileRevision: currentProfileSnapshot.profileRevision },
    );
    await markAiPlanGenerationPersisted({
      trace: exactness.draft.aiGeneration.generationTrace,
    });

    return {
      ok: true,
      status: "created",
      persisted: true,
      sourceKind: request.sourceKind,
      sourceStatus: RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
      schemaVersion: exactness.canonicalPlan.schema_version,
      effectiveStartDate: applyResult.effectiveStartDate,
      appliedStartDate: applyResult.appliedStartDate,
      workoutCount: applyResult.workoutCount,
      calendarRowCount: exactness.canonicalPlan.planned_workouts.length,
      nonRestWorkoutCount: exactness.canonicalPlan.planned_workouts.filter(
        (workout) => workout.workout_type !== "rest",
      ).length,
      reviewChecksum: exactness.reviewChecksum,
      safety: {
        requiresExplicitConfirm: true,
        trustedClientRows: false,
        serverRebuiltPreview: false,
        callsOpenAi: false,
      },
    };
  } catch (error) {
    if (error instanceof ActivePlanPersistenceRejection && error.reason === "stale_review") {
      await markAiPlanGenerationPersistenceFailed({
        trace: exactness.draft.aiGeneration.generationTrace,
        reason: "stale_review",
      });
      return buildConfirmFailure({
        reason: "stale_review",
        message: error.message,
        sourceKind: request.sourceKind,
      });
    }

    if (error instanceof Error && /active plan/i.test(error.message)) {
      await markAiPlanGenerationPersistenceFailed({
        trace: exactness.draft.aiGeneration.generationTrace,
        reason: "active_plan_exists",
      });
      return buildConfirmFailure({
        reason: "active_plan_exists",
        message:
          "Generated plans can create a new plan only when there is no active plan. Use Add plan from the calendar to start a reviewed plan change.",
        sourceKind: request.sourceKind,
      });
    }

    await markAiPlanGenerationPersistenceFailed({
      trace: exactness.draft.aiGeneration.generationTrace,
      reason: "persistence_failed",
    });
    return buildConfirmFailure({
      reason: "persistence_failed",
      message: "The generated running plan could not be created. The current plan is unchanged.",
      sourceKind: request.sourceKind,
    });
  }
}

export async function buildReviewedAiGeneratedRunningPlanPreview(
  data: RunningPlanPreviewActionInput,
  options: BuildAiGeneratedRunningPlanPreviewOptions = {},
): Promise<RunningPlanPreviewActionResult> {
  const result = await buildAiGeneratedRunningPlanPreview(data, options);

  if (!result.ok) {
    return result;
  }

  const reviewedDraft = await addRunningPlanReviewProof(result.draft);
  const exactness = await validateRunningPlanReviewExactness({
    draft: reviewedDraft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });

  if (!exactness.ok) {
    const generationTrace = await markAiPlanGenerationReviewRefused({
      trace: reviewedDraft.aiGeneration.generationTrace,
      options: options.aiPreview?.generationLedger,
    });

    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: "ai_generated_plan_unavailable",
        message: exactness.message,
        issues: [exactness.message],
        generationTrace,
        input: data,
        normalizedInputSummary: reviewedDraft.normalizedInputSummary,
        previewOutcome: "review_refusal",
      }),
    };
  }

  const generationTrace = await markAiPlanGenerationReviewedDraftSigned({
    trace: reviewedDraft.aiGeneration.generationTrace,
    options: options.aiPreview?.generationLedger,
  });

  return {
    ok: true,
    draft: {
      ...reviewedDraft,
      aiGeneration: {
        ...reviewedDraft.aiGeneration,
        generationTrace,
      },
    },
  } as RunningPlanPreviewActionResult;
}

export async function buildReviewedAiGeneratedRunningPlanPreviewForUser(
  userId: string | null,
  data: RunningPlanPreviewActionInput,
  options: BuildAiGeneratedRunningPlanPreviewOptions = {},
): Promise<RunningPlanPreviewActionResult> {
  let runnerProfileSnapshot: Awaited<
    ReturnType<typeof getRunnerPlanAuthoringProfileSnapshotForUserId>
  > = null;
  try {
    runnerProfileSnapshot = userId
      ? await getRunnerPlanAuthoringProfileSnapshotForUserId(userId)
      : null;
  } catch {
    runnerProfileSnapshot = null;
  }

  return buildReviewedAiGeneratedRunningPlanPreview(data, {
    ...options,
    ...(runnerProfileSnapshot ? { runnerProfileSnapshot } : {}),
  });
}

function buildConfirmFailure(input: {
  reason: RunningPlanConfirmFailureReason;
  message: string;
  sourceKind?: RunningPlanConfirmActionInput["sourceKind"];
}): Extract<RunningPlanConfirmActionResult, { ok: false }> {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: input.reason,
    message: input.message,
    ...(input.sourceKind ? { sourceKind: input.sourceKind } : {}),
  };
}

async function isLocalQaFixtureAuthorized(auth: ReturnType<typeof getRequestAuthContext>) {
  if (auth.provider !== "local" || !auth.userId || !isAiGeneratedRunningPlanDevFixtureEnabled()) {
    return false;
  }

  const account = await findLocalAuthAccountByUserId(auth.userId);
  return account?.role === "tester" && account.qaFixtureAccess === true;
}

function isLocalQaFixtureReviewedDraft(draft: AiGeneratedRunningPlanPreviewDraft) {
  return (
    draft.aiGeneration.generationTrace?.provider.kind === "local_dev_fixture" ||
    isAiGeneratedRunningPlanDevFixtureModel(draft.aiGeneration.model)
  );
}

const sameJson = stableJsonEqual;
