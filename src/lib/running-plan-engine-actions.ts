import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  applySavedPlanRecordForUser,
  retainReviewedPlanCandidateForUser,
} from "@/lib/active-plan-persistence";
import { CalendarPersistenceRejection } from "@/lib/active-plan-lifecycle-persistence";
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
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import {
  RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
  addRunningPlanReviewProof,
  buildRunningPlanPersistenceMetadata,
  validateRunningPlanReviewExactness,
  validateSelfContainedRunningPlanReviewExactness,
  type RunningPlanReviewedPreviewDraft,
} from "@/lib/running-plan-engine-review";
import { stableJsonEqual } from "@/lib/review-token-signing";
import { generatedPlanRunnerCommentInputSchema } from "@/lib/structured-plan-authoring-schema";
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
    runnerComment: generatedPlanRunnerCommentInputSchema,
    planGoalIntent: planGoalIntentInputSchema.extend({
      distance: planGoalIntentDistanceInputSchema,
    }),
  })
  .strict();

const runningPlanSourceKindSchema = z.literal(AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);

const runningPlanReviewedPreviewInputSchema = runningPlanPreviewInputSchema.omit({
  runnerComment: true,
});

export const runningPlanConfirmInputSchema = z
  .object({
    previewInput: runningPlanReviewedPreviewInputSchema,
    sourceKind: runningPlanSourceKindSchema,
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict();

type RunningPlanReviewedPreviewReadyResult = {
  ok: true;
  draft: RunningPlanReviewedPreviewDraft<AiGeneratedRunningPlanPreviewDraft>;
  savedPlanId?: string;
};

type RunningPlanReviewedPreviewResult =
  | RunningPlanReviewedPreviewReadyResult
  | { ok: false; unavailable: AiGeneratedRunningPlanPreviewUnavailable };

type InternalPreviewCalendarRow = AiGeneratedRunningPlanPreviewDraft["calendarRows"][number];

type RunningPlanPreviewProductCalendarRow = {
  rowId: InternalPreviewCalendarRow["rowId"];
  date: InternalPreviewCalendarRow["date"];
  weekNumber: InternalPreviewCalendarRow["weekNumber"];
  weekday: InternalPreviewCalendarRow["weekday"];
  isRestDay: InternalPreviewCalendarRow["isRestDay"];
  title: InternalPreviewCalendarRow["title"];
  endpointDistanceMeters: InternalPreviewCalendarRow["endpointDistanceMeters"];
};

type RunningPlanPreviewProductDraft = {
  sourceKind: AiGeneratedRunningPlanPreviewDraft["sourceKind"];
  previewOutcome: "preview_ready";
  previewInput: AiGeneratedRunningPlanPreviewDraft["previewInput"];
  goal: {
    distanceLabel: string;
    targetDate: string | null;
    targetFinishTime: string | null;
  };
  schedule: {
    startDate: string;
    endDate: string;
  };
  calendarRows: readonly RunningPlanPreviewProductCalendarRow[];
  workoutDocuments: AiGeneratedRunningPlanPreviewDraft["workoutDocuments"];
  savedPlanId: string | null;
  reviewToken: string;
  reviewChecksum: string;
};

type RunningPlanPreviewProductUnavailable = {
  previewOutcome: AiGeneratedRunningPlanPreviewUnavailable["previewOutcome"];
  error: {
    code: AiGeneratedRunningPlanPreviewUnavailable["error"]["code"];
    message: string;
    compilerDiagnostic: AiGeneratedRunningPlanPreviewUnavailable["error"]["compilerDiagnostic"];
  };
};

export type RunningPlanPreviewActionResult =
  | { ok: true; draft: RunningPlanPreviewProductDraft }
  | { ok: false; unavailable: RunningPlanPreviewProductUnavailable };
export type RunningPlanPreviewActionInput = z.output<typeof runningPlanPreviewInputSchema>;
export type RunningPlanConfirmActionInput = z.output<typeof runningPlanConfirmInputSchema>;

type RunningPlanConfirmFailureReason =
  | "unauthenticated"
  | "replacement_required"
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
      savedPlanId: string;
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
  .validator((value: unknown) => runningPlanPreviewInputSchema.parse(value))
  .handler(async ({ data }): Promise<RunningPlanPreviewActionResult> => {
    const auth = getRequestAuthContext();
    let persistedUserId: string | null = null;

    try {
      persistedUserId = auth.userId ? await getPersistedUserIdForAuthContext(auth) : null;
    } catch {
      persistedUserId = null;
    }

    return projectRunningPlanPreviewResultForProduct(
      await buildReviewedAiGeneratedRunningPlanPreviewForUser(persistedUserId, data, {
        aiPreview: { signal: getRequest().signal },
        qaFixtureAuthorized: isLocalQaFixtureSessionAuthorized(auth),
      }),
    );
  });

export const confirmRunningPlanDraft = createServerFn({ method: "POST" })
  .validator((value: unknown) => runningPlanConfirmInputSchema.parse(value))
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
      allowLocalQaFixture: isLocalQaFixtureSessionAuthorized(auth),
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

  if (!stableJsonEqual(request.previewInput, exactness.draft.previewInput)) {
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
    !stableJsonEqual(
      currentProfileSnapshot,
      exactness.draft.normalizedInputSummary.runnerProfileSnapshot,
    )
  ) {
    return buildConfirmFailure({
      reason: "stale_review",
      message: "The runner baseline changed after review. Refresh the plan before confirming.",
      sourceKind: request.sourceKind,
    });
  }

  let savedPlan: Awaited<ReturnType<typeof retainReviewedPlanCandidateForUser>>;
  try {
    savedPlan = await retainReviewedPlanCandidateForUser({
      userId,
      canonicalPlan: exactness.canonicalPlan,
      reviewChecksum: exactness.reviewChecksum,
      planMetadata: buildRunningPlanPersistenceMetadata({
        draft: exactness.draft,
        canonicalPlan: exactness.canonicalPlan,
        reviewChecksum: exactness.reviewChecksum,
      }),
    });
  } catch {
    return buildConfirmFailure({
      reason: "persistence_failed",
      message: "The selected running plan could not verify its private saved record before apply.",
      sourceKind: request.sourceKind,
    });
  }

  if (!savedPlan || !stableJsonEqual(savedPlan.saved_plan_payload, exactness.canonicalPlan)) {
    return buildConfirmFailure({
      reason: "stale_review",
      message: "The reviewed plan no longer matches its private saved record. Refresh the preview.",
      sourceKind: request.sourceKind,
    });
  }

  try {
    const applyResult = await applySavedPlanRecordForUser(
      userId,
      savedPlan.id,
      "apply_if_future_empty",
    );

    if (!applyResult.ok) {
      return buildConfirmFailure({
        reason: "replacement_required",
        message:
          "Future Calendar workouts already exist. Apply this saved plan only after explicitly choosing Replace future workouts.",
        sourceKind: request.sourceKind,
      });
    }

    await markAiPlanGenerationPersisted({
      trace: exactness.draft.aiGeneration.generationTrace,
    });

    return {
      ok: true,
      status: "created",
      persisted: true,
      sourceKind: request.sourceKind,
      sourceStatus: RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
      savedPlanId: savedPlan.id,
      schemaVersion: exactness.canonicalPlan.schema_version,
      effectiveStartDate: applyResult.appliedStartDate,
      appliedStartDate: applyResult.appliedStartDate,
      workoutCount: applyResult.workoutCount,
      calendarRowCount: applyResult.calendarRowCount,
      nonRestWorkoutCount: applyResult.workoutCount,
      reviewChecksum: exactness.reviewChecksum,
      safety: {
        requiresExplicitConfirm: true,
        trustedClientRows: false,
        serverRebuiltPreview: false,
        callsOpenAi: false,
      },
    };
  } catch (error) {
    if (error instanceof CalendarPersistenceRejection && error.reason === "stale_review") {
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
): Promise<RunningPlanReviewedPreviewResult> {
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
  };
}

export async function buildReviewedAiGeneratedRunningPlanPreviewForUser(
  userId: string | null,
  data: RunningPlanPreviewActionInput,
  options: BuildAiGeneratedRunningPlanPreviewOptions = {},
): Promise<RunningPlanReviewedPreviewResult> {
  const calendarDate = userId ? await getRunnerCalendarDateForUserId(userId) : null;
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

  const reviewed = await buildReviewedAiGeneratedRunningPlanPreview(
    calendarDate && !data.startDate?.trim() ? { ...data, startDate: calendarDate } : data,
    {
      ...options,
      aiPreview: {
        ...(options.aiPreview ?? {}),
        candidateOwnerUserId: userId,
      },
      ...(runnerProfileSnapshot ? { runnerProfileSnapshot } : {}),
    },
  );

  if (!userId || !reviewed.ok) {
    return reviewed;
  }

  try {
    const savedPlan = await retainReviewedPlanCandidateForUser({
      userId,
      canonicalPlan: reviewed.draft.canonicalPlan,
      reviewChecksum: reviewed.draft.reviewChecksum,
      planMetadata: buildRunningPlanPersistenceMetadata({
        draft: reviewed.draft,
        canonicalPlan: reviewed.draft.canonicalPlan,
        reviewChecksum: reviewed.draft.reviewChecksum,
      }),
    });

    return { ...reviewed, savedPlanId: savedPlan.id };
  } catch {
    const generationTrace = await markAiPlanGenerationPersistenceFailed({
      trace: reviewed.draft.aiGeneration.generationTrace,
      reason: "saved_plan_candidate_persistence_failed",
      options: options.aiPreview?.generationLedger,
    });

    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: "ai_generated_plan_unavailable",
        message: "The generated plan could not be retained in the private saved-plan library.",
        issues: ["The reviewed candidate was not returned because persistence did not complete."],
        generationTrace,
        input: data,
        normalizedInputSummary: reviewed.draft.normalizedInputSummary,
        previewOutcome: "candidate_persistence_failure",
      }),
    };
  }
}

export function projectRunningPlanPreviewResultForProduct(
  result: RunningPlanReviewedPreviewResult,
): RunningPlanPreviewActionResult {
  if (!result.ok) {
    if (result.unavailable.previewOutcome === "compiler_rejection") {
      console.error(
        "[generated-plan/preview] compiler_rejection",
        JSON.stringify({
          code: result.unavailable.error.code,
          compilerDiagnostic: result.unavailable.error.compilerDiagnostic,
        }),
      );
    }

    return {
      ok: false,
      unavailable: {
        previewOutcome: result.unavailable.previewOutcome,
        error: {
          code: result.unavailable.error.code,
          message: result.unavailable.error.message,
          compilerDiagnostic: result.unavailable.error.compilerDiagnostic,
        },
      },
    };
  }

  const draft = result.draft;
  const goalIntent = draft.normalizedInputSummary.planGoalIntent;
  const startDate = draft.canonicalPlan.start_date;

  return {
    ok: true,
    draft: {
      sourceKind: draft.sourceKind,
      previewOutcome: draft.previewOutcome,
      previewInput: draft.previewInput,
      goal: {
        distanceLabel: goalIntent.distance?.label ?? "Distance unavailable",
        targetDate: goalIntent.targetDate,
        targetFinishTime: goalIntent.targetFinishTime?.label ?? null,
      },
      schedule: {
        startDate,
        endDate: draft.canonicalPlan.planned_workouts.at(-1)?.date ?? startDate,
      },
      calendarRows: draft.calendarRows.map((row) => ({
        rowId: row.rowId,
        date: row.date,
        weekNumber: row.weekNumber,
        weekday: row.weekday,
        isRestDay: row.isRestDay,
        title: row.title,
        endpointDistanceMeters: row.endpointDistanceMeters,
      })),
      workoutDocuments: draft.workoutDocuments,
      savedPlanId: result.savedPlanId ?? null,
      reviewToken: draft.reviewToken,
      reviewChecksum: draft.reviewChecksum,
    },
  };
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

function isLocalQaFixtureSessionAuthorized(auth: ReturnType<typeof getRequestAuthContext>) {
  return (
    auth.provider === "local" && Boolean(auth.userId) && isAiGeneratedRunningPlanDevFixtureEnabled()
  );
}

function isLocalQaFixtureReviewedDraft(draft: AiGeneratedRunningPlanPreviewDraft) {
  return (
    draft.aiGeneration.generationTrace?.provider.kind === "local_dev_fixture" ||
    isAiGeneratedRunningPlanDevFixtureModel(draft.aiGeneration.model)
  );
}
