import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  getAdaptiveTrainingInitialReviewRecordForUser,
  getAdaptiveTrainingSourceCandidateForUser,
  listAdaptiveTrainingInitialReviewRecordsForUser,
  type AdaptiveTrainingInitialReviewRecord,
  type RetainedAdaptiveTrainingSourceCandidate,
} from "@/lib/adaptive-blueprint-persistence";
import {
  AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
  AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
} from "@/lib/ai-authored-plan-first-compiler";
import {
  applyAtomicAdaptiveInitialDetailedBlockMaterialization,
  buildCalendarWorkoutMutationEvent,
  CALENDAR_WORKOUT_MUTATION_KIND,
  CalendarPersistenceRejection,
} from "@/lib/runner-calendar-mutations";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { acceptedRunnerHeartRateProfileSchema } from "@/lib/heart-rate-zones";
import { parseDurationSeconds, parsePaceSecondsPerKm } from "@/lib/first-plan-authoring-utils";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildRestoredAiGeneratedRunningPlanPreviewDraft,
  buildAiGeneratedRunningPlanPreviewUnavailable,
  buildAiGeneratedRunningPlanPreview,
  isAiGeneratedRunningPlanPreviewDraft,
  type AiGeneratedRunningPlanPreviewUnavailable,
  type AiGeneratedRunningPlanPreviewDraft,
  type BuildAiGeneratedRunningPlanPreviewOptions,
} from "@/lib/ai-generated-running-plan";
import {
  AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  isAiGeneratedRunningPlanDevFixtureEnabled,
  isAiGeneratedRunningPlanDevFixtureModel,
} from "@/lib/ai-generated-running-plan-dev-fixture";
import {
  markAiPlanGenerationPersistenceFailed,
  markAiPlanGenerationPersisted,
  markAiPlanGenerationReviewRefused,
  markAiPlanGenerationReviewedDraftSigned,
} from "@/lib/ai-plan-generation-ledger";
import { isCurrentAiPlanGenerationResponseLineageForCandidate } from "@/lib/ai-plan-generation-response-persistence";
import {
  planGoalIntentDistanceInputSchema,
  planGoalIntentInputSchema,
} from "@/lib/plan-creation-engine";
import { RUNNING_PLAN_RUNNER_LEVEL_VALUES } from "@/lib/plan-creation-engine/source-types";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import { buildImportedPlanSeed } from "@/lib/imported-plan";
import { reviewWorkoutCommandForUser } from "@/lib/manual-workout-authoring/actions";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import {
  getCalendarWorkoutsWithLogsForUser,
  getContinuationCalendarOutcomePacket,
} from "@/lib/runner-calendar-persistence";
import { projectRunnerFitnessProfileForInitialPlan } from "@/lib/runner-activity/product-contract";
import {
  RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
  addRunningPlanReviewProof,
  validateRunningPlanReviewExactness,
  validateSelfContainedRunningPlanReviewExactness,
  type RunningPlanReviewedPreviewDraft,
} from "@/lib/running-plan-engine-review";
import { digestSha256Hex, stableJsonEqual, stableJsonStringify } from "@/lib/review-token-signing";
import { generatedPlanRunnerCommentInputSchema } from "@/lib/structured-plan-authoring-schema";
import type { Json } from "@/lib/supabase/database";
import { addDaysIso } from "@/lib/training";
import { getUserSettingsForUserId } from "@/lib/user-settings-actions";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";
import { getContinuationEvidencePacket } from "@/lib/workout-result-import/read-workout-result-feedback";
import {
  confirmWorkoutCommand,
  WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
} from "@/lib/workout-authoring-review";

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
const savedPlanReviewSelectionSchema = z
  .object({
    candidateId: z.string().uuid(),
    candidateVersion: z.number().int().positive(),
  })
  .strict();
export const CURRENT_RUNNING_LIMITATION_VALUES = ["no", "yes", "unsure"] as const;

const runningPlanReviewedPreviewInputSchema = runningPlanPreviewInputSchema.omit({
  runnerComment: true,
});

export const runningPlanConfirmInputSchema = z
  .object({
    previewInput: runningPlanReviewedPreviewInputSchema,
    sourceKind: runningPlanSourceKindSchema,
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
    currentRunningLimitation: z.enum(CURRENT_RUNNING_LIMITATION_VALUES).optional(),
  })
  .strict();

type RunningPlanReviewedPreviewReadyResult = {
  ok: true;
  draft: RunningPlanReviewedPreviewDraft<AiGeneratedRunningPlanPreviewDraft>;
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

export type SavedPlanReviewCandidateIdentity = {
  id: string;
  version: number;
  sha256: string;
};

export type RunningPlanPreviewProductDraft = {
  sourceKind: AiGeneratedRunningPlanPreviewDraft["sourceKind"];
  previewOutcome: "preview_ready";
  previewInput: z.output<typeof runningPlanReviewedPreviewInputSchema>;
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
  candidate: AiGeneratedRunningPlanPreviewDraft["candidate"];
  savedPlanReviewCandidate: SavedPlanReviewCandidateIdentity | null;
  reviewToken: string;
  reviewChecksum: string;
};

export type SavedPlanReviewValidity =
  | { state: "current"; reason: null }
  | { state: "stale"; reason: "facts_changed" | "invalid_lineage" | "invalid_content" }
  | { state: "expired"; reason: "already_confirmed" };

export type SavedPlanReviewSummary = {
  kind: "generated_review";
  candidate: SavedPlanReviewCandidateIdentity;
  title: string;
  goal: {
    distanceLabel: string;
    targetDate: string | null;
    targetFinishTime: string | null;
  };
  schedule: { startDate: string; endDate: string };
  createdAt: string;
  validity: SavedPlanReviewValidity;
  generationLedgerReference: { generationId: string };
};

export type RestoreSavedPlanReviewResult =
  | {
      ok: true;
      status: "review_ready";
      summary: SavedPlanReviewSummary;
      review: RunningPlanPreviewProductDraft;
    }
  | {
      ok: true;
      status: "read_only";
      summary: SavedPlanReviewSummary;
      review: Omit<RunningPlanPreviewProductDraft, "reviewToken" | "reviewChecksum">;
    }
  | {
      ok: false;
      status: "unavailable";
      reason: "unauthenticated" | "not_found" | "foreign";
      message: string;
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
      blueprintId: string;
      detailedCandidateId: string;
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
        qaFixtureAuthorized: await isLocalQaFixtureSessionAuthorized(auth, persistedUserId),
      }),
    );
  });

export const listSavedPlanReviews = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await resolvePersistedUserIdForSavedPlanReview();
  if (!userId) {
    throw new Error("Sign in before reviewing saved generated plans.");
  }
  return listSavedPlanReviewsForUser(userId);
});

export const restoreSavedPlanReview = createServerFn({ method: "POST" })
  .validator((value: unknown) => savedPlanReviewSelectionSchema.parse(value))
  .handler(async ({ data }): Promise<RestoreSavedPlanReviewResult> => {
    const userId = await resolvePersistedUserIdForSavedPlanReview();
    if (!userId) {
      return savedPlanReviewUnavailable("unauthenticated");
    }
    return restoreSavedPlanReviewForUser(userId, data);
  });

export async function listSavedPlanReviewsForUser(userId: string) {
  const records = await listAdaptiveTrainingInitialReviewRecordsForUser(userId);
  const states = await Promise.all(
    records.map((record) => buildSavedPlanReviewState(userId, record)),
  );
  return {
    ok: true as const,
    records: states.map((state) => state.summary),
  };
}

export async function restoreSavedPlanReviewForUser(
  userId: string,
  input: { candidateId: string; candidateVersion: number },
): Promise<RestoreSavedPlanReviewResult> {
  const data = savedPlanReviewSelectionSchema.parse(input);
  const record = await getAdaptiveTrainingInitialReviewRecordForUser({
    userId,
    candidateId: data.candidateId,
    candidateVersion: data.candidateVersion,
  });
  if (!record) {
    return savedPlanReviewUnavailable("not_found");
  }

  const state = await buildSavedPlanReviewState(userId, record);
  if (!state.draft) {
    return savedPlanReviewUnavailable("not_found");
  }
  if (state.summary.validity.state !== "current") {
    return {
      ok: true,
      status: "read_only",
      summary: state.summary,
      review: projectRunningPlanDraftForProduct(state.draft),
    };
  }

  const confirmableDraft = normalizeRunningPlanReviewDraftForConfirmation(state.draft);
  const reviewed = await addRunningPlanReviewProof(confirmableDraft);
  const exactness = await validateRunningPlanReviewExactness({
    draft: reviewed,
    reviewToken: reviewed.reviewToken,
    reviewChecksum: reviewed.reviewChecksum,
  });
  if (!exactness.ok) {
    return {
      ok: true,
      status: "read_only",
      summary: {
        ...state.summary,
        validity: { state: "stale", reason: "invalid_content" },
      },
      review: projectRunningPlanDraftForProduct(state.draft),
    };
  }

  return {
    ok: true,
    status: "review_ready",
    summary: state.summary,
    review: projectRunningPlanReviewedDraftForProduct(reviewed),
  };
}

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
      allowLocalQaFixture: await isLocalQaFixtureSessionAuthorized(auth, userId),
    });
  });

export async function confirmRunningPlanDraftForUser(
  userId: string,
  input: unknown,
  options: {
    allowLocalQaFixture?: boolean;
    localQaFixtureCurrentDate?: string;
  } = {},
): Promise<RunningPlanConfirmActionResult> {
  const parsed = runningPlanConfirmInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildConfirmFailure({
      reason: "invalid_review",
      message: "The selected-plan confirmation payload is invalid. Refresh the preview.",
    });
  }

  const request = parsed.data;

  if (request.currentRunningLimitation === "yes" || request.currentRunningLimitation === "unsure") {
    return buildConfirmFailure({
      reason: "invalid_review",
      message:
        "This plan cannot be confirmed while a current running limitation needs review. No workouts were added.",
      sourceKind: request.sourceKind,
    });
  }

  return confirmReviewedAiGeneratedRunningPlanDraftForUser(
    userId,
    {
      ...request,
      currentRunningLimitation: request.currentRunningLimitation ?? "no",
    },
    options,
  );
}

async function confirmReviewedAiGeneratedRunningPlanDraftForUser(
  userId: string,
  request: RunningPlanConfirmActionInput & { currentRunningLimitation: "no" },
  options: {
    allowLocalQaFixture?: boolean;
    localQaFixtureCurrentDate?: string;
  },
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

  const signedLocalQaFixtureCurrentDate =
    options.allowLocalQaFixture === true &&
    isLocalQaFixtureReviewedDraft(exactness.draft) &&
    exactness.draft.aiGeneration.responseId === AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID
      ? exactness.canonicalPlan.start_date
      : undefined;
  const localQaFixtureCurrentDate =
    options.localQaFixtureCurrentDate ?? signedLocalQaFixtureCurrentDate;
  if (
    localQaFixtureCurrentDate !== undefined &&
    (options.allowLocalQaFixture !== true ||
      exactness.draft.aiGeneration.responseId !==
        AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID ||
      !z.string().date().safeParse(localQaFixtureCurrentDate).success)
  ) {
    return buildConfirmFailure({
      reason: "fixture_not_authorized",
      message: "The local QA fixture confirmation date is unavailable for this reviewed plan.",
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

  let currentProfileFacts: Awaited<ReturnType<typeof getInitialPlanAuthoringFactsForUser>>;
  try {
    const frozenProfile = exactness.draft.normalizedInputSummary.initialPlanProfile;
    currentProfileFacts = await getInitialPlanAuthoringFactsForUser({
      userId,
      asOf: frozenProfile.asOf,
      cutoffDate: frozenProfile.cutoffDate,
    });
  } catch {
    return buildConfirmFailure({
      reason: "persistence_failed",
      message: "The runner fitness profile could not be verified before confirmation.",
      sourceKind: request.sourceKind,
    });
  }

  if (
    !currentProfileFacts ||
    !stableJsonEqual(
      currentProfileFacts.initialPlanProfile,
      exactness.draft.normalizedInputSummary.initialPlanProfile,
    ) ||
    !stableJsonEqual(
      currentProfileFacts.acceptedHeartRateProfile,
      exactness.draft.normalizedInputSummary.heartRateProfile,
    ) ||
    currentProfileFacts.settings.age !== exactness.draft.normalizedInputSummary.age ||
    currentProfileFacts.settings.heightCm !== exactness.draft.normalizedInputSummary.heightCm ||
    currentProfileFacts.settings.weightKg !== exactness.draft.normalizedInputSummary.weightKg
  ) {
    return buildConfirmFailure({
      reason: "stale_review",
      message: "The runner fitness facts changed after review. Refresh the plan before confirming.",
      sourceKind: request.sourceKind,
    });
  }

  const sourceReference = exactness.draft.sourceCandidate;
  if (!sourceReference) {
    return buildConfirmFailure({
      reason: "invalid_review",
      message: "The reviewed adaptive source candidate is unavailable. Refresh the preview.",
      sourceKind: request.sourceKind,
    });
  }

  try {
    const sourceSnapshot = await getAdaptiveTrainingSourceCandidateForUser({
      userId,
      reference: sourceReference,
    });
    const expectedCandidateContent = {
      canonicalPlan: exactness.canonicalPlan,
      reviewConflicts: exactness.draft.reviewConflicts,
    };
    if (
      !sourceSnapshot ||
      !stableJsonEqual(sourceSnapshot.blueprint.blueprint_content, exactness.draft.blueprint) ||
      !stableJsonEqual(sourceSnapshot.candidate.candidate_content, expectedCandidateContent)
    ) {
      return buildConfirmFailure({
        reason: "stale_review",
        message: "The reviewed adaptive source no longer matches its immutable candidate.",
        sourceKind: request.sourceKind,
      });
    }

    const seed = buildImportedPlanSeed(exactness.canonicalPlan);
    const documents = seed.workouts;
    if (!stableJsonEqual(documents, exactness.draft.workoutDocuments)) {
      return buildConfirmFailure({
        reason: "stale_review",
        message: "The reviewed detailed workouts no longer match the canonical candidate.",
        sourceKind: request.sourceKind,
      });
    }

    const signedCommand = exactness.draft.candidate.command;
    const expectedProvenanceReferences = documents.map((document) => ({
      sourceKind: request.sourceKind,
      sourceStatus: exactness.draft.sourceStatus,
      sourceWorkoutId: document.sourceWorkoutId,
      adaptiveTrainingSourceCandidate: sourceReference,
    }));
    if (
      signedCommand.operation !== "materialize" ||
      !stableJsonEqual(signedCommand.documents, documents) ||
      !stableJsonEqual(signedCommand.provenanceReferences, expectedProvenanceReferences)
    ) {
      return buildConfirmFailure({
        reason: "invalid_review",
        message: "The signed detailed-block command is invalid. Refresh the preview.",
        sourceKind: request.sourceKind,
      });
    }

    const commandReview = await reviewWorkoutCommandForUser(userId, signedCommand);
    if (!commandReview.ok) {
      return buildConfirmFailure({
        reason: commandReview.issues.some((issue) => issue.code === "calendar_collision")
          ? "replacement_required"
          : "stale_review",
        message: commandReview.issues[0]?.message ?? "The reviewed workouts could not be verified.",
        sourceKind: request.sourceKind,
      });
    }
    const commandProof = confirmWorkoutCommand({
      candidate: commandReview.candidate,
      candidateId: exactness.draft.candidate.candidateId,
      reviewToken: exactness.draft.candidate.reviewToken,
      reviewChecksum: exactness.draft.candidate.reviewChecksum,
    });
    if (!commandProof.ok) {
      return buildConfirmFailure({
        reason: commandProof.reason === "collision" ? "replacement_required" : commandProof.reason,
        message: commandProof.message,
        sourceKind: request.sourceKind,
      });
    }

    const confirmationReviewChecksum = await digestSha256Hex(
      stableJsonStringify({
        version: "adaptive_initial_confirmation_review_v2",
        sourcePreviewReviewChecksum: exactness.reviewChecksum,
        currentRunningLimitation: request.currentRunningLimitation,
      }),
    );

    const currentDate = localQaFixtureCurrentDate ?? (await getRunnerCalendarDateForUserId(userId));
    const workoutInserts = buildPersistedWorkoutInsertRows(null, userId, seed.workouts, "ai").map(
      (row) => ({ ...row, id: crypto.randomUUID() }),
    );
    const mutationEvents = workoutInserts.map((row) => ({
      ...buildCalendarWorkoutMutationEvent({
        mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.addWorkout,
        originKind: "ai",
        reviewPayloadVersion: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
        reviewChecksum: commandProof.candidate.reviewChecksum,
        workoutAuthoringSourceKind: request.sourceKind,
        plannedWorkoutId: row.id,
        targetWorkoutId: row.id,
        targetDate: row.workout_date,
        title: row.title,
        mutationPayloadVersion: "adaptive_initial_detailed_block_materialization_v1",
        mutationChecksum: exactness.reviewChecksum,
        trustedClientRows: false,
        originalPlanSourceKind: request.sourceKind,
        originalPlanSourceStatus: RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
        originalWorkoutSourceId: row.source_workout_id,
        originalWorkoutSourceType: row.source_workout_type,
        originalWorkoutFamily: row.workout_family,
        originalWorkoutIdentity: row.workout_identity,
      }),
      adaptive_training_confirmation: {
        contract_version: "adaptive_initial_detailed_block_confirmation_v2",
        blueprint_id: sourceReference.blueprintId,
        blueprint_version: sourceReference.blueprintVersion,
        blueprint_sha256: sourceReference.blueprintSha256,
        detailed_candidate_id: sourceReference.candidateId,
        detailed_candidate_version: sourceReference.candidateVersion,
        detailed_candidate_sha256: sourceReference.candidateSha256,
        input_fingerprint_sha256: sourceReference.inputFingerprintSha256,
        source_preview_review_checksum: exactness.reviewChecksum,
        source_review_checksum: confirmationReviewChecksum,
        current_running_limitation: request.currentRunningLimitation,
        workout_review_checksum: commandProof.candidate.reviewChecksum,
        source_workout_id: row.source_workout_id,
      },
    }));
    const materialized = await applyAtomicAdaptiveInitialDetailedBlockMaterialization({
      userId,
      currentDate,
      blueprintId: sourceReference.blueprintId,
      blueprintVersion: sourceReference.blueprintVersion,
      blueprintSha256: sourceReference.blueprintSha256,
      candidateId: sourceReference.candidateId,
      candidateVersion: sourceReference.candidateVersion,
      candidateSha256: sourceReference.candidateSha256,
      inputFingerprintSha256: sourceReference.inputFingerprintSha256,
      expectedBlueprintContent: sourceSnapshot.blueprint.blueprint_content,
      expectedCandidateContent: sourceSnapshot.candidate.candidate_content,
      expectedInputSnapshot: sourceSnapshot.candidate.input_snapshot,
      sourceReviewChecksum: confirmationReviewChecksum,
      workoutReviewChecksum: commandProof.candidate.reviewChecksum,
      workoutInserts: workoutInserts as unknown as Json[],
      mutationEvents: mutationEvents as unknown as Json[],
    });
    const workoutCount = documents.filter((document) => document.workoutType !== "rest").length;

    await markAiPlanGenerationPersisted({
      trace: exactness.draft.aiGeneration.generationTrace,
    });

    return {
      ok: true,
      status: "created",
      persisted: true,
      sourceKind: request.sourceKind,
      sourceStatus: RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
      blueprintId: materialized.blueprintId,
      detailedCandidateId: materialized.detailedCandidateId,
      schemaVersion: exactness.canonicalPlan.schema_version,
      effectiveStartDate: exactness.canonicalPlan.start_date,
      appliedStartDate: exactness.canonicalPlan.start_date,
      workoutCount,
      calendarRowCount: materialized.calendarRowCount,
      nonRestWorkoutCount: workoutCount,
      reviewChecksum: exactness.reviewChecksum,
      safety: {
        requiresExplicitConfirm: true,
        trustedClientRows: false,
        serverRebuiltPreview: false,
        callsOpenAi: false,
      },
    };
  } catch (error) {
    if (error instanceof CalendarPersistenceRejection) {
      await markAiPlanGenerationPersistenceFailed({
        trace: exactness.draft.aiGeneration.generationTrace,
        reason: error.reason,
      });
      return buildConfirmFailure({
        reason:
          error.reason === "calendar_collision"
            ? "replacement_required"
            : error.reason === "invalid_candidate"
              ? "invalid_review"
              : "stale_review",
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
  options: BuildAiGeneratedRunningPlanPreviewOptions & {
    localQaFixtureCurrentDate?: string;
  } = {},
): Promise<RunningPlanReviewedPreviewResult> {
  if (
    options.localQaFixtureCurrentDate &&
    (options.qaFixtureAuthorized !== true ||
      !z.string().date().safeParse(options.localQaFixtureCurrentDate).success)
  ) {
    throw new Error("A local QA fixture date requires explicit fixture authorization.");
  }
  const { localQaFixtureCurrentDate, ...previewOptions } = options;
  const calendarDate = userId
    ? (localQaFixtureCurrentDate ?? (await getRunnerCalendarDateForUserId(userId)))
    : null;
  const authoringInstant = localQaFixtureCurrentDate
    ? `${localQaFixtureCurrentDate}T12:00:00.000Z`
    : new Date().toISOString();
  let initialPlanFacts: Awaited<ReturnType<typeof getInitialPlanAuthoringFactsForUser>> = null;
  try {
    initialPlanFacts =
      userId && calendarDate
        ? await getInitialPlanAuthoringFactsForUser({
            userId,
            asOf: authoringInstant,
            cutoffDate: calendarDate,
          })
        : null;
  } catch {
    initialPlanFacts = null;
  }

  const acceptedRequestFactsMatch = Boolean(
    initialPlanFacts &&
    initialPlanFacts.settings.age === data.age &&
    initialPlanFacts.settings.heightCm === data.heightCm &&
    initialPlanFacts.settings.weightKg === data.weightKg,
  );

  if (userId && (!initialPlanFacts || !acceptedRequestFactsMatch)) {
    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: "structured_input_invalid",
        message:
          "The saved runner baseline no longer matches these plan answers. Refresh the setup before creating a preview.",
        issues: [
          "Authenticated initial-plan preview requires the current persisted runner baseline before provider dispatch.",
        ],
        generationTrace: null,
        input: data,
        normalizedInputSummary: null,
        previewOutcome: "invalid_structural_input",
      }),
    };
  }

  const reviewed = await buildReviewedAiGeneratedRunningPlanPreview(
    calendarDate && !data.startDate?.trim() ? { ...data, startDate: calendarDate } : data,
    {
      ...previewOptions,
      aiPreview: {
        ...(previewOptions.aiPreview ?? {}),
        candidateOwnerUserId: userId,
      },
      ...(initialPlanFacts && acceptedRequestFactsMatch
        ? {
            initialPlanProfile: initialPlanFacts.initialPlanProfile,
            acceptedHeartRateProfile: initialPlanFacts.acceptedHeartRateProfile,
          }
        : {}),
    },
  );

  return reviewed;
}

async function getInitialPlanAuthoringFactsForUser(input: {
  userId: string;
  asOf: string;
  cutoffDate: string;
}) {
  const settings = await getUserSettingsForUserId(input.userId, null);
  if (!settings) return null;
  const acceptedHeartRateProfile = acceptedRunnerHeartRateProfileSchema.safeParse({
    source: settings.heartRateZones.source,
    accepted: settings.heartRateZones.accepted,
    sourceNote: settings.heartRateZones.sourceNote,
    zones: settings.heartRateZones.zones.map((zone) => ({
      reference: zone.reference,
      label: zone.label,
      minBpm: zone.minBpm,
      maxBpm: zone.maxBpm,
    })),
  });
  if (!acceptedHeartRateProfile.success) return null;
  const existing = await getCalendarWorkoutsWithLogsForUser(input.userId);
  const recentWindowStart = addDaysIso(input.cutoffDate, -27);
  const calendar = await getContinuationCalendarOutcomePacket({
    userId: input.userId,
    calendarWorkoutIds: existing.workouts
      .filter(
        (workout) =>
          workout.workout_date >= recentWindowStart && workout.workout_date <= input.cutoffDate,
      )
      .map((workout) => workout.id),
    asOf: input.asOf,
    cutoffDate: input.cutoffDate,
  });
  const evidence = await getContinuationEvidencePacket({
    userId: input.userId,
    asOf: input.asOf,
    cutoffDate: input.cutoffDate,
    calendarOutcomeFingerprint: calendar.calendarOutcomeFingerprint,
    workouts: calendar.workouts,
  });
  const snapshot = await createServerOnlyFn(async () => {
    const { getRunnerFitnessProfileSnapshotForUser } =
      await import("@/lib/runner-activity/read-model");

    return getRunnerFitnessProfileSnapshotForUser({
      userId: input.userId,
      asOf: input.asOf,
      cutoffDate: input.cutoffDate,
      settings,
      calendar,
      evidence,
    });
  })();
  return {
    settings,
    acceptedHeartRateProfile: acceptedHeartRateProfile.data,
    initialPlanProfile: projectRunnerFitnessProfileForInitialPlan(snapshot),
  };
}

async function buildSavedPlanReviewState(
  userId: string,
  record: AdaptiveTrainingInitialReviewRecord,
) {
  const sourceReference = buildSavedPlanReviewSourceReference(record);
  const lineageIsCurrent = savedPlanReviewLineageIsCurrent(userId, record, sourceReference);
  const restored =
    sourceReference && record.blueprint
      ? buildRestoredAiGeneratedRunningPlanPreviewDraft({
          sourceCandidate: sourceReference,
          blueprint: record.blueprint.blueprint_content,
          candidateContent: record.candidate.candidate_content,
          authoringInput: record.candidate.input_snapshot,
          intervalStartDate: record.candidate.interval_start_date,
          intervalEndDate: record.candidate.interval_end_date,
          retainedResponseProvenance: record.response
            ? {
                providerResponseId: record.response.provider_response_id,
              }
            : undefined,
        })
      : ({ ok: false, reason: "invalid_lineage" } as const);
  const draft = restored.ok ? restored.draft : null;
  let validity: SavedPlanReviewValidity;
  if (!lineageIsCurrent) {
    validity = { state: "stale", reason: "invalid_lineage" };
  } else if (!draft) {
    validity = { state: "stale", reason: "invalid_content" };
  } else if (record.confirmation) {
    validity = { state: "expired", reason: "already_confirmed" };
  } else {
    const frozenProfile = draft.normalizedInputSummary.initialPlanProfile;
    let currentFacts: Awaited<ReturnType<typeof getInitialPlanAuthoringFactsForUser>> = null;
    try {
      currentFacts = await getInitialPlanAuthoringFactsForUser({
        userId,
        asOf: frozenProfile.asOf,
        cutoffDate: frozenProfile.cutoffDate,
      });
    } catch {
      currentFacts = null;
    }
    validity = savedPlanReviewFactsMatch(currentFacts, draft)
      ? { state: "current", reason: null }
      : { state: "stale", reason: "facts_changed" };
  }

  return {
    draft,
    summary: buildSavedPlanReviewSummary(record, draft, validity),
  };
}

function buildSavedPlanReviewSourceReference(
  record: AdaptiveTrainingInitialReviewRecord,
): RetainedAdaptiveTrainingSourceCandidate | null {
  if (!record.blueprint) return null;
  return {
    blueprintId: record.blueprint.id,
    blueprintVersion: record.blueprint.version,
    blueprintSha256: record.blueprint.content_sha256,
    candidateId: record.candidate.id,
    candidateVersion: record.candidate.version,
    candidateSha256: record.candidate.candidate_sha256,
    inputFingerprintSha256: record.candidate.input_fingerprint_sha256,
  };
}

function savedPlanReviewLineageIsCurrent(
  userId: string,
  record: AdaptiveTrainingInitialReviewRecord,
  sourceReference: RetainedAdaptiveTrainingSourceCandidate | null,
) {
  const provenance = jsonObject(record.candidate.input_provenance);
  const lineage = jsonObject(record.candidate.confirmation_lineage);
  const sourceResponseAdmitted = Boolean(
    record.response &&
    isCurrentAiPlanGenerationResponseLineageForCandidate(
      record.response,
      record.candidate.input_provenance,
      {
        id: record.candidate.id,
        sha256: record.candidate.candidate_sha256,
      },
    ),
  );
  return Boolean(
    sourceReference &&
    record.blueprint &&
    record.response &&
    record.candidate.user_id === userId &&
    record.blueprint.user_id === userId &&
    record.response.user_id === userId &&
    record.candidate.blueprint_id === record.blueprint.id &&
    (record.candidate.source_response_id === null ||
      record.candidate.source_response_id === record.response.id) &&
    record.blueprint.source_response_id === record.response.id &&
    record.blueprint.source_contract_version === AI_AUTHORED_PLAN_FIRST_SOURCE_KIND &&
    record.blueprint.compiler_version === AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION &&
    sourceResponseAdmitted &&
    provenance?.kind === "structured_authoring_input" &&
    provenance.retainedResponseId === record.response.id &&
    provenance.retainedResponseSha256 === record.response.response_sha256 &&
    provenance.sourceContractVersion === AI_AUTHORED_PLAN_FIRST_SOURCE_KIND &&
    provenance.compilerVersion === AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION &&
    lineage?.kind === "initial_detailed_block_candidate" &&
    lineage.state === "unconfirmed" &&
    lineage.predecessorCandidateId === null &&
    lineage.predecessorConfirmationId === null,
  );
}

function savedPlanReviewFactsMatch(
  currentFacts: Awaited<ReturnType<typeof getInitialPlanAuthoringFactsForUser>>,
  draft: AiGeneratedRunningPlanPreviewDraft,
) {
  return Boolean(
    currentFacts &&
    stableJsonEqual(
      currentFacts.initialPlanProfile,
      draft.normalizedInputSummary.initialPlanProfile,
    ) &&
    stableJsonEqual(
      currentFacts.acceptedHeartRateProfile,
      draft.normalizedInputSummary.heartRateProfile,
    ) &&
    currentFacts.settings.age === draft.normalizedInputSummary.age &&
    currentFacts.settings.heightCm === draft.normalizedInputSummary.heightCm &&
    currentFacts.settings.weightKg === draft.normalizedInputSummary.weightKg,
  );
}

function buildSavedPlanReviewSummary(
  record: AdaptiveTrainingInitialReviewRecord,
  draft: AiGeneratedRunningPlanPreviewDraft | null,
  validity: SavedPlanReviewValidity,
): SavedPlanReviewSummary {
  const plan = draft?.canonicalPlan;
  const goal = draft?.normalizedInputSummary.planGoalIntent;
  return {
    kind: "generated_review",
    candidate: {
      id: record.candidate.id,
      version: record.candidate.version,
      sha256: record.candidate.candidate_sha256,
    },
    title: plan?.plan_name ?? "Generated running plan",
    goal: {
      distanceLabel: goal?.distance?.label ?? "Generated distance plan",
      targetDate: goal?.targetDate ?? null,
      targetFinishTime: goal?.targetFinishTime?.label ?? null,
    },
    schedule: {
      startDate: plan?.start_date ?? record.candidate.interval_start_date,
      endDate: plan?.planned_workouts.at(-1)?.date ?? record.candidate.interval_end_date,
    },
    createdAt: record.candidate.created_at,
    validity,
    generationLedgerReference: {
      generationId: record.response?.generation_id ?? "unavailable",
    },
  };
}

async function resolvePersistedUserIdForSavedPlanReview() {
  const auth = getRequestAuthContext();
  if (!auth.userId) return null;
  try {
    return await getPersistedUserIdForAuthContext(auth);
  } catch {
    return null;
  }
}

function savedPlanReviewUnavailable(
  reason: Extract<RestoreSavedPlanReviewResult, { ok: false }>["reason"],
): Extract<RestoreSavedPlanReviewResult, { ok: false }> {
  return {
    ok: false,
    status: "unavailable",
    reason,
    message:
      reason === "unauthenticated"
        ? "Sign in before restoring a saved generated-plan review."
        : "The saved generated-plan review is unavailable.",
  };
}

function jsonObject(value: Json | null): Record<string, Json> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : null;
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

  return {
    ok: true,
    draft: projectRunningPlanReviewedDraftForProduct(result.draft),
  };
}

function projectRunningPlanDraftForProduct(
  draft: AiGeneratedRunningPlanPreviewDraft,
): Omit<RunningPlanPreviewProductDraft, "reviewToken" | "reviewChecksum"> {
  const goalIntent = draft.normalizedInputSummary.planGoalIntent;
  const startDate = draft.canonicalPlan.start_date;

  return {
    sourceKind: draft.sourceKind,
    previewOutcome: draft.previewOutcome,
    previewInput: runningPlanReviewedPreviewInputSchema.parse(draft.previewInput),
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
    candidate: draft.candidate,
    savedPlanReviewCandidate: draft.sourceCandidate
      ? {
          id: draft.sourceCandidate.candidateId,
          version: draft.sourceCandidate.candidateVersion,
          sha256: draft.sourceCandidate.candidateSha256,
        }
      : null,
  };
}

function normalizeRunningPlanReviewDraftForConfirmation(
  draft: AiGeneratedRunningPlanPreviewDraft,
): AiGeneratedRunningPlanPreviewDraft {
  return {
    ...draft,
    previewInput: runningPlanReviewedPreviewInputSchema.parse(draft.previewInput),
  };
}

function projectRunningPlanReviewedDraftForProduct(
  draft: RunningPlanReviewedPreviewDraft<AiGeneratedRunningPlanPreviewDraft>,
): RunningPlanPreviewProductDraft {
  return {
    ...projectRunningPlanDraftForProduct(draft),
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
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

async function isLocalQaFixtureSessionAuthorized(
  auth: ReturnType<typeof getRequestAuthContext>,
  persistedUserId: string | null,
) {
  const authorized =
    auth.provider === "local" &&
    Boolean(auth.userId) &&
    isAiGeneratedRunningPlanDevFixtureEnabled();
  if (!authorized) return false;
  const { isCamelotInteractiveQaProfileSelected } =
    await import("@/lib/camelot-interactive-qa-fixture");
  if (!isCamelotInteractiveQaProfileSelected()) return true;
  const { isCamelotFixtureSessionAuthorized } =
    await import("@/lib/camelot-interactive-qa-fixture.server");
  return isCamelotFixtureSessionAuthorized({ auth, persistedUserId });
}

function isLocalQaFixtureReviewedDraft(draft: AiGeneratedRunningPlanPreviewDraft) {
  return (
    draft.aiGeneration.generationTrace?.provider.kind === "local_dev_fixture" ||
    isAiGeneratedRunningPlanDevFixtureModel(draft.aiGeneration.model)
  );
}
