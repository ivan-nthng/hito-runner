import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createFirstPlanFromReviewedCanonicalPlanForUser,
  getActivePlan,
} from "@/lib/active-plan-persistence";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { parseDurationSeconds, parsePaceSecondsPerKm } from "@/lib/first-plan-authoring-utils";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildAiGeneratedRunningPlanPreview,
  isAiGeneratedRunningPlanPreviewDraft,
  type AiGeneratedRunningPlanPreviewUnavailable,
  type AiGeneratedRunningPlanPreviewDraft,
  type BuildAiGeneratedRunningPlanPreviewOptions,
} from "@/lib/ai-generated-running-plan";
import {
  markAiPlanGenerationPersisted,
  markAiPlanGenerationReviewedDraftSigned,
} from "@/lib/ai-plan-generation-ledger";
import {
  buildHalfMarathonPlanPreviewDraft,
  buildMarathonBasePlanPreviewDraft,
  buildMarathonCompletionPlanPreviewDraft,
  buildTenKPlanPreviewDraft,
  HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
  TEN_K_PLAN_BUILDER_SOURCE_KIND,
  planGoalIntentInputSchema,
  type BuildRunningPlanPreviewInput,
  type HalfMarathonPlanBuilderResult,
  type HalfMarathonPlanPreviewDraft,
  type MarathonBasePlanBuilderResult,
  type MarathonBasePlanPreviewDraft,
  type MarathonCompletionPlanBuilderResult,
  type MarathonCompletionPlanPreviewDraft,
  type TenKPlanBuilderResult,
  type TenKPlanPreviewDraft,
} from "@/lib/plan-creation-engine";
import {
  RUNNING_PLAN_DISTANCE_FAMILY_VALUES,
  RUNNING_PLAN_RUNNER_LEVEL_VALUES,
} from "@/lib/plan-creation-engine/source-types";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import {
  RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
  addRunningPlanReviewProof,
  buildRunningPlanPersistenceMetadata,
  buildRunningPlanProfilePatch,
  runningPlanSourceKindMatchesFamily,
  validateSelfContainedRunningPlanReviewToken,
  validateRunningPlanReviewExactness,
  type RunningPlanReviewedPreviewDraft,
} from "@/lib/running-plan-engine-review";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";

const weekdayNameSchema = z.enum(WEEKDAY_NAMES);
const recent5kTimeSchema = z
  .string()
  .trim()
  .refine((value) => {
    const seconds = parseDurationSeconds(value);
    return seconds != null && seconds >= 10 * 60 && seconds <= 2 * 60 * 60;
  }, "Use a recent 5K time between 10:00 and 2:00:00.");
const recent5kPaceSchema = z
  .string()
  .trim()
  .refine((value) => {
    const seconds = parsePaceSecondsPerKm(value);
    return seconds != null && seconds >= 2 * 60 && seconds <= 15 * 60;
  }, "Use a recent 5K pace between 2:00/km and 15:00/km.");
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
    distanceFamily: z.enum(RUNNING_PLAN_DISTANCE_FAMILY_VALUES),
    daysPerWeek: z.number().int().min(1).max(7).optional().nullable(),
    fixedRestDays: z.array(weekdayNameSchema).optional().nullable(),
    preferredLongRunDay: weekdayNameSchema.optional().nullable(),
    startDate: z.string().trim().optional().nullable(),
    benchmark: runningPlanBenchmarkSchema.optional().nullable(),
    planGoalIntent: planGoalIntentInputSchema.optional().nullable(),
  })
  .strict();

export const runningPlanSourceKindSchema = z.enum([
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  TEN_K_PLAN_BUILDER_SOURCE_KIND,
  HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
]);

export const runningPlanConfirmInputSchema = z
  .object({
    previewInput: runningPlanPreviewInputSchema,
    planFamily: z.enum(RUNNING_PLAN_DISTANCE_FAMILY_VALUES),
    sourceKind: runningPlanSourceKindSchema,
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict();

type RunningPlanPreviewActionReadyResult =
  | {
      ok: true;
      draft: RunningPlanReviewedPreviewDraft<TenKPlanPreviewDraft>;
    }
  | {
      ok: true;
      draft: RunningPlanReviewedPreviewDraft<HalfMarathonPlanPreviewDraft>;
    }
  | {
      ok: true;
      draft: RunningPlanReviewedPreviewDraft<MarathonBasePlanPreviewDraft>;
    }
  | {
      ok: true;
      draft: RunningPlanReviewedPreviewDraft<MarathonCompletionPlanPreviewDraft>;
    }
  | {
      ok: true;
      draft: RunningPlanReviewedPreviewDraft<AiGeneratedRunningPlanPreviewDraft>;
    };

export type RunningPlanPreviewActionResult =
  | RunningPlanPreviewActionReadyResult
  | { ok: false; unavailable: AiGeneratedRunningPlanPreviewUnavailable }
  | Extract<TenKPlanBuilderResult, { ok: false }>
  | Extract<HalfMarathonPlanBuilderResult, { ok: false }>
  | Extract<MarathonBasePlanBuilderResult, { ok: false }>
  | Extract<MarathonCompletionPlanBuilderResult, { ok: false }>;
export type RunningPlanPreviewActionInput = z.output<typeof runningPlanPreviewInputSchema>;
export type RunningPlanConfirmActionInput = z.output<typeof runningPlanConfirmInputSchema>;

export type RunningPlanConfirmFailureReason =
  | "unauthenticated"
  | "active_plan_exists"
  | "unsupported_family"
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
      planFamily: RunningPlanConfirmActionInput["planFamily"];
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
      planFamily?: RunningPlanConfirmActionInput["planFamily"];
    };

export const previewRunningPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => runningPlanPreviewInputSchema.parse(value))
  .handler(async ({ data }): Promise<RunningPlanPreviewActionResult> => {
    return buildReviewedAiGeneratedRunningPlanPreview(data);
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
        planFamily: data.planFamily,
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
        planFamily: data.planFamily,
      });
    }

    if (!userId) {
      return buildConfirmFailure({
        reason: "unauthenticated",
        message: "This session cannot create a persisted running plan yet.",
        sourceKind: data.sourceKind,
        planFamily: data.planFamily,
      });
    }

    return confirmRunningPlanDraftForUser(userId, data);
  });

export async function confirmRunningPlanDraftForUser(
  userId: string,
  input: unknown,
): Promise<RunningPlanConfirmActionResult> {
  const parsed = runningPlanConfirmInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildConfirmFailure({
      reason: "invalid_review",
      message: "The selected-plan confirmation payload is invalid. Refresh the preview.",
    });
  }

  const request = parsed.data;

  if (
    request.sourceKind !== AI_GENERATED_RUNNING_PLAN_SOURCE_KIND &&
    (request.previewInput.distanceFamily !== request.planFamily ||
      !runningPlanSourceKindMatchesFamily({
        family: request.planFamily,
        sourceKind: request.sourceKind,
      }))
  ) {
    return buildConfirmFailure({
      reason: "input_mismatch",
      message:
        "The selected family or source kind no longer matches the reviewed preview. Refresh the preview.",
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
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
      planFamily: request.planFamily,
    });
  }

  if (activePlan) {
    return buildConfirmFailure({
      reason: "active_plan_exists",
      message:
        "Selected plans can create a new plan only when there is no active plan. Use Add plan from the calendar to start a reviewed plan change.",
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
    });
  }

  if (request.sourceKind === AI_GENERATED_RUNNING_PLAN_SOURCE_KIND) {
    return confirmReviewedAiGeneratedRunningPlanDraftForUser(userId, request);
  }

  const preview = buildRunningPlanPreview(request.previewInput);
  if (!preview.ok) {
    return buildConfirmFailure({
      reason: "preview_unavailable",
      message: preview.unavailable.error.message,
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
    });
  }

  if (
    preview.draft.sourceKind !== request.sourceKind ||
    preview.draft.planFamily !== request.planFamily
  ) {
    return buildConfirmFailure({
      reason: "input_mismatch",
      message:
        "The selected-plan preview rebuilt to a different source or family. Refresh the preview.",
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
    });
  }

  const exactness = await validateRunningPlanReviewExactness({
    draft: preview.draft,
    reviewToken: request.reviewToken,
    reviewChecksum: request.reviewChecksum,
  });

  if (!exactness.ok) {
    return buildConfirmFailure({
      reason: exactness.reason,
      message: exactness.message,
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
    });
  }

  try {
    const applyResult = await createFirstPlanFromReviewedCanonicalPlanForUser(
      userId,
      exactness.canonicalPlan,
      buildRunningPlanProfilePatch(preview.draft),
      buildRunningPlanPersistenceMetadata({
        draft: preview.draft,
        canonicalPlan: exactness.canonicalPlan,
        reviewChecksum: exactness.reviewChecksum,
      }),
    );

    return {
      ok: true,
      status: "created",
      persisted: true,
      sourceKind: request.sourceKind,
      sourceStatus: RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
      planFamily: request.planFamily,
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
        serverRebuiltPreview: true,
        callsOpenAi: false,
      },
    };
  } catch (error) {
    if (error instanceof Error && /active plan/i.test(error.message)) {
      return buildConfirmFailure({
        reason: "active_plan_exists",
        message:
          "Selected plans can create a new plan only when there is no active plan. Use Add plan from the calendar to start a reviewed plan change.",
        sourceKind: request.sourceKind,
        planFamily: request.planFamily,
      });
    }

    return buildConfirmFailure({
      reason: "persistence_failed",
      message: "The selected running plan could not be created. The current plan is unchanged.",
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
    });
  }
}

async function confirmReviewedAiGeneratedRunningPlanDraftForUser(
  userId: string,
  request: RunningPlanConfirmActionInput,
): Promise<RunningPlanConfirmActionResult> {
  const exactness = await validateSelfContainedRunningPlanReviewToken({
    reviewToken: request.reviewToken,
    reviewChecksum: request.reviewChecksum,
  });

  if (!exactness.ok) {
    return buildConfirmFailure({
      reason: exactness.reason,
      message: exactness.message,
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
    });
  }

  if (
    !isAiGeneratedRunningPlanPreviewDraft(exactness.draft) ||
    exactness.draft.sourceKind !== request.sourceKind ||
    exactness.draft.planFamily !== request.planFamily
  ) {
    return buildConfirmFailure({
      reason: "input_mismatch",
      message:
        "The AI-authored generated-plan preview no longer matches the selected family or source. Refresh the preview.",
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
    });
  }

  if (!sameJson(request.previewInput, exactness.draft.previewInput)) {
    return buildConfirmFailure({
      reason: "stale_review",
      message:
        "The AI-authored generated-plan setup answers no longer match the reviewed preview. Refresh before creating a plan.",
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
    });
  }

  try {
    const applyResult = await createFirstPlanFromReviewedCanonicalPlanForUser(
      userId,
      exactness.canonicalPlan,
      buildRunningPlanProfilePatch(exactness.draft),
      buildRunningPlanPersistenceMetadata({
        draft: exactness.draft,
        canonicalPlan: exactness.canonicalPlan,
        reviewChecksum: exactness.reviewChecksum,
      }),
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
      planFamily: request.planFamily,
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
    if (error instanceof Error && /active plan/i.test(error.message)) {
      return buildConfirmFailure({
        reason: "active_plan_exists",
        message:
          "Generated plans can create a new plan only when there is no active plan. Use Add plan from the calendar to start a reviewed plan change.",
        sourceKind: request.sourceKind,
        planFamily: request.planFamily,
      });
    }

    return buildConfirmFailure({
      reason: "persistence_failed",
      message: "The generated running plan could not be created. The current plan is unchanged.",
      sourceKind: request.sourceKind,
      planFamily: request.planFamily,
    });
  }
}

export async function buildReviewedRunningPlanPreview(
  data: RunningPlanPreviewActionInput,
): Promise<RunningPlanPreviewActionResult> {
  const result = buildRunningPlanPreview(data);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    draft: await addRunningPlanReviewProof(result.draft),
  } as RunningPlanPreviewActionResult;
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

export function buildRunningPlanPreview(
  data: RunningPlanPreviewActionInput,
):
  | TenKPlanBuilderResult
  | HalfMarathonPlanBuilderResult
  | MarathonBasePlanBuilderResult
  | MarathonCompletionPlanBuilderResult {
  const input: BuildRunningPlanPreviewInput = {
    ...data,
    daysPerWeek: data.daysPerWeek as BuildRunningPlanPreviewInput["daysPerWeek"],
  };

  switch (data.distanceFamily) {
    case "10K":
      return buildTenKPlanPreviewDraft(input);
    case "Half Marathon":
      return buildHalfMarathonPlanPreviewDraft(input);
    case "Marathon Base":
      return buildMarathonBasePlanPreviewDraft(input);
    case "Marathon Completion":
      return buildMarathonCompletionPlanPreviewDraft(input);
  }
}

function buildConfirmFailure(input: {
  reason: RunningPlanConfirmFailureReason;
  message: string;
  sourceKind?: RunningPlanConfirmActionInput["sourceKind"];
  planFamily?: RunningPlanConfirmActionInput["planFamily"];
}): Extract<RunningPlanConfirmActionResult, { ok: false }> {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: input.reason,
    message: input.message,
    ...(input.sourceKind ? { sourceKind: input.sourceKind } : {}),
    ...(input.planFamily ? { planFamily: input.planFamily } : {}),
  };
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(sortJsonValue(left)) === JSON.stringify(sortJsonValue(right));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    );
  }

  return value;
}
