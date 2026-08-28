import {
  generateAiFirstPlanDraftPreview,
  type GenerateAiFirstPlanDraftPreviewOptions,
  type AiFirstPlanDraftPreviewMetadata,
} from "@/lib/ai-first-plan-draft-service";
import type { RetainedAdaptiveTrainingSourceCandidate } from "@/lib/adaptive-blueprint-persistence";
import {
  AI_AUTHORED_BLUEPRINT_VERSION,
  AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  type AiAuthoredBlueprintReviewConflict,
  type AiAuthoredBlueprintSummary,
} from "@/lib/ai-authored-plan-first-compiler";
import {
  recordAiPlanGenerationPreflightFailure,
  updateAiPlanGenerationLedgerTrace,
  type AiPlanGenerationLedgerTrace,
} from "@/lib/ai-plan-generation-ledger";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  buildProspectiveAiGeneratedRunningPlanQaFixtureAuthoringInput,
  isAiGeneratedRunningPlanDevFixtureEnabled,
  resolveAiGeneratedRunningPlanProviderMode,
} from "@/lib/ai-generated-running-plan-dev-fixture";
import { parseDurationSeconds, parsePaceSecondsPerKm } from "@/lib/first-plan-authoring-utils";
import type { AcceptedRunnerHeartRateProfile } from "@/lib/heart-rate-zones";
import {
  buildImportedPlanSeed,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import {
  normalizePlanGoalIntent,
  type NormalizedPlanGoalIntent,
} from "@/lib/plan-creation-engine/plan-goal-intent";
import { collectSelectedDistanceEndpointIssues } from "@/lib/plan-creation-engine/selected-distance-endpoint";
import type {
  BuildRunningPlanPreviewInput,
  RunningPlanPreviewCalendarRow,
  RunningPlanPreviewNormalizedInputSummary,
  RunningPlanReviewedPreviewInput,
} from "@/lib/plan-creation-engine/preview-builder-shared";
import { RUNNING_PLAN_PREVIEW_REST_DAY_KIND } from "@/lib/plan-creation-engine/preview-builder-shared";
import {
  RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES,
  type RunningPlanBenchmarkPaceTruth,
  type RunningPlanDaysPerWeek,
  type RunningPlanRunnerLevel,
  type RunningPlanSegmentPrescription,
  type RunningPlanWatchExecutableSegmentTemplate,
  type RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import { deriveAvailableTrainingWeekdays } from "@/lib/runner-training-preferences";
import type { RunnerTrainingPreferencesStorage } from "@/lib/runner-training-preferences";
import type { RunnerPlanCapabilityVectorV1 } from "@/lib/runner-activity/plan-capability-contract";
import {
  generatedPlanRunnerCommentInputSchema,
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "@/lib/structured-plan-authoring-schema";
import { todayIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES, uniqueWeekdays, type WeekdayName } from "@/lib/weekday-rest-invariants";
import type { WorkoutDocument } from "@/lib/workout-document";
import {
  reviewWorkoutCommand,
  type ReviewedWorkoutCommandCandidate,
} from "@/lib/workout-authoring-review";

export const AI_GENERATED_RUNNING_PLAN_SOURCE_KIND = AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;
export const AI_GENERATED_RUNNING_PLAN_PREVIEW_VERSION = "ai_generated_running_plan_v1" as const;

type AiGeneratedRunningPlanPreviewSourceKind = typeof AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;

export type AiGeneratedRunningPlanPreviewOutcome =
  | "preview_ready"
  | "invalid_structural_input"
  | "provider_runtime_failure"
  | "provider_incomplete_output"
  | "malformed_provider_output"
  | "compiler_rejection"
  | "review_refusal"
  | "candidate_persistence_failure";

export type AiGeneratedRunningPlanSourceStatus = Extract<
  AiFirstPlanDraftPreviewMetadata["status"],
  "ai_authored"
>;

export interface AiGeneratedRunningPlanPreviewDraft {
  sourceKind: AiGeneratedRunningPlanPreviewSourceKind;
  source_kind: AiGeneratedRunningPlanPreviewSourceKind;
  sourceStatus: AiGeneratedRunningPlanSourceStatus;
  source_status: AiGeneratedRunningPlanSourceStatus;
  persisted: false;
  mutates: false;
  callsOpenAi: boolean;
  planVersion: typeof AI_GENERATED_RUNNING_PLAN_PREVIEW_VERSION;
  previewOutcome: Extract<AiGeneratedRunningPlanPreviewOutcome, "preview_ready">;
  reviewSafety: {
    persisted: false;
    mutates: false;
    confirmPathImplemented: true;
    callsOpenAi: boolean;
    confirmCallsOpenAi: false;
    trustedClientRows: false;
  };
  blueprint: AiAuthoredBlueprintSummary;
  reviewConflicts: readonly AiAuthoredBlueprintReviewConflict[];
  sourceCandidate: RetainedAdaptiveTrainingSourceCandidate | null;
  previewInput: RunningPlanReviewedPreviewInput;
  normalizedInputSummary: RunningPlanPreviewNormalizedInputSummary;
  calendarRows: readonly RunningPlanPreviewCalendarRow[];
  workoutDocuments: readonly WorkoutDocument[];
  candidate: ReviewedWorkoutCommandCandidate;
  endpointProof: {
    finalRowId: string;
    finalDate: string;
    endpointDistanceMeters: number | null;
    endpointMainDistanceMeters: number | null;
    finalRowIsLastNonRest: true;
  };
  validation: {
    ok: true;
    issues: readonly string[];
    forbiddenOutputGateIdsChecked: readonly string[];
  };
  canonicalPlan: TrainingPlanV2;
  aiGeneration: AiFirstPlanDraftPreviewMetadata;
}

export type AiGeneratedRunningPlanPreviewUnavailable = {
  sourceKind: AiGeneratedRunningPlanPreviewSourceKind;
  source_kind: AiGeneratedRunningPlanPreviewSourceKind;
  sourceStatus: "preview_unavailable";
  source_status: "preview_unavailable";
  persisted: false;
  mutates: false;
  callsOpenAi: boolean;
  previewOutcome: Extract<
    AiGeneratedRunningPlanPreviewOutcome,
    | "invalid_structural_input"
    | "provider_runtime_failure"
    | "provider_incomplete_output"
    | "malformed_provider_output"
    | "compiler_rejection"
    | "review_refusal"
    | "candidate_persistence_failure"
  >;
  error: {
    code:
      | "ai_generated_plan_unavailable"
      | "impossible_plan_goal"
      | "invalid_plan_goal_intent"
      | "local_qa_fixture_not_authorized"
      | "structured_input_invalid";
    message: string;
    issues: readonly string[];
    compilerDiagnostic: {
      code: string;
      path: string;
    } | null;
  };
  debug: {
    generationTrace: AiPlanGenerationLedgerTrace | null;
    previewActionTrace: AiGeneratedRunningPlanPreviewActionTrace;
  };
};

export interface AiGeneratedRunningPlanPreviewActionTrace {
  previewInputSummary: {
    runnerLevel: RunningPlanRunnerLevel;
    daysPerWeek: number | null;
    fixedRestDayCount: number | null;
    preferredLongRunDay: WeekdayName | null;
    startDate: string | null;
    benchmarkKind: BuildRunningPlanPreviewInput["benchmark"] extends infer Benchmark
      ? Benchmark extends { kind: infer Kind }
        ? Kind | null
        : string | null
      : string | null;
  };
  planGoalIntentSummary: {
    distanceLabel: string | null;
    distanceMeters: number | null;
    targetDate: string | null;
    targetFinishTime: string | null;
    targetOutcomePace: string | null;
  };
  normalizedBy: string | null;
  localDevFixtureEnabled: boolean;
  provider: {
    kind: AiPlanGenerationLedgerTrace["provider"]["kind"];
    paidProviderCall: boolean;
    responseId: string | null;
    model: string | null;
    tokenUsage: AiPlanGenerationLedgerTrace["usage"];
  } | null;
  liveOpenAiCalled: boolean;
  unavailableReason: string | null;
  diagnosticCodes: readonly string[];
  normalizationDiagnostics: readonly string[];
}

export type AiGeneratedRunningPlanPreviewResult =
  | { ok: true; draft: AiGeneratedRunningPlanPreviewDraft }
  | { ok: false; unavailable: AiGeneratedRunningPlanPreviewUnavailable };

export interface BuildAiGeneratedRunningPlanPreviewOptions {
  aiPreview?: Omit<GenerateAiFirstPlanDraftPreviewOptions, "input">;
  runnerCapability?: RunnerPlanCapabilityVectorV1;
  acceptedHeartRateProfile?: AcceptedRunnerHeartRateProfile;
  qaFixtureAuthorized?: boolean;
}

export async function buildAiGeneratedRunningPlanPreview(
  input: BuildRunningPlanPreviewInput,
  options: BuildAiGeneratedRunningPlanPreviewOptions = {},
): Promise<AiGeneratedRunningPlanPreviewResult> {
  const providerMode = resolveAiGeneratedRunningPlanProviderMode();
  const qaFixtureMode = providerMode === "qa_fixture";

  if (
    qaFixtureMode &&
    (!isAiGeneratedRunningPlanDevFixtureEnabled() || options.qaFixtureAuthorized !== true)
  ) {
    const reason = "local_qa_fixture_not_authorized";
    const generationTrace = await recordAiPlanGenerationPreflightFailure({
      reason,
      options: options.aiPreview?.generationLedger,
    });

    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: reason,
        message:
          "This local QA fixture session is not authorized to prepare a generated-plan preview.",
        issues: ["The local QA fixture refused this account before provider invocation."],
        generationTrace,
        input,
        normalizedInputSummary: null,
        previewOutcome: "provider_runtime_failure",
      }),
    };
  }

  const authoring = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    options.runnerCapability,
    options.acceptedHeartRateProfile,
  );

  if (!authoring.ok) {
    const generationTrace = await recordAiPlanGenerationPreflightFailure({
      reason: authoring.reason,
      options: options.aiPreview?.generationLedger,
    });

    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: authoring.reason,
        message: authoring.message,
        issues: [authoring.message],
        generationTrace,
        input,
        normalizedInputSummary: null,
        previewOutcome: "invalid_structural_input",
      }),
    };
  }

  if (!authoring.planGoalIntent.targetDate) {
    const reason = "invalid_plan_goal_intent";
    const generationTrace = await recordAiPlanGenerationPreflightFailure({
      reason,
      options: options.aiPreview?.generationLedger,
    });

    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: reason,
        message: "Choose a target date before creating a generated plan.",
        issues: ["A generated Blueprint requires a runner-selected target date."],
        generationTrace,
        input,
        normalizedInputSummary: authoring.normalizedInputSummary,
        previewOutcome: "invalid_structural_input",
      }),
    };
  }

  const generationAuthoringInput = qaFixtureMode
    ? buildProspectiveAiGeneratedRunningPlanQaFixtureAuthoringInput(authoring.authoringInput)
    : authoring.authoringInput;
  let aiPreviewOptions = options.aiPreview;
  if (qaFixtureMode) {
    const devFixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      qaFixtureAuthorized: true,
      authoringInput: generationAuthoringInput,
    });
    if (!devFixtureOptions) {
      const reason = "local_qa_fixture_not_authorized";
      const generationTrace = await recordAiPlanGenerationPreflightFailure({
        reason,
        options: options.aiPreview?.generationLedger,
      });

      return {
        ok: false,
        unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
          code: reason,
          message: "This local QA fixture runtime cannot prepare a generated-plan preview safely.",
          issues: ["The local QA fixture transport was unavailable before provider invocation."],
          generationTrace,
          input,
          normalizedInputSummary: authoring.normalizedInputSummary,
          previewOutcome: "provider_runtime_failure",
        }),
      };
    }

    aiPreviewOptions = {
      ...(options.aiPreview ?? {}),
      ...devFixtureOptions,
      signal: options.aiPreview?.signal,
      generationLedger: options.aiPreview?.generationLedger,
    };
  }
  const result = await generateAiFirstPlanDraftPreview({
    input: generationAuthoringInput,
    ...(aiPreviewOptions ?? {}),
  });

  if (!result.ok) {
    const structuredInputInvalid = result.reason === "structured_input_invalid";
    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: structuredInputInvalid ? "structured_input_invalid" : "ai_generated_plan_unavailable",
        message: structuredInputInvalid
          ? "The generated-plan setup could not be normalized. Adjust the goal details."
          : result.message,
        issues: result.issues,
        compilerDiagnostic: structuredInputInvalid ? null : result.metadata.compilerDiagnostic,
        generationTrace: structuredInputInvalid ? null : result.metadata.generationTrace,
        input,
        normalizedInputSummary: authoring.normalizedInputSummary,
        previewOutcome: structuredInputInvalid
          ? "invalid_structural_input"
          : classifyAiFirstPlanDraftFailure(result.metadata.unavailableReason),
      }),
    };
  }

  const canonicalPlan = result.canonicalPlan;
  const normalizedInputSummary = buildAiAuthoredNormalizedInputSummary(
    qaFixtureMode
      ? buildLocalQaFixtureNormalizedInputSummary(
          authoring.normalizedInputSummary,
          generationAuthoringInput,
        )
      : authoring.normalizedInputSummary,
    canonicalPlan,
  );
  let calendarRows: readonly RunningPlanPreviewCalendarRow[];
  let workoutDocuments: readonly WorkoutDocument[];
  let candidate: ReviewedWorkoutCommandCandidate;
  try {
    calendarRows = projectCanonicalPlanToPreviewRows(canonicalPlan);
    workoutDocuments = buildImportedPlanSeed(canonicalPlan).workouts;
    const candidateReview = reviewWorkoutCommand({
      command: {
        operation: "materialize",
        documents: workoutDocuments,
        provenanceReferences: workoutDocuments.map((document) => ({
          sourceKind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
          sourceStatus: result.metadata.status,
          sourceWorkoutId: document.sourceWorkoutId,
          adaptiveTrainingSourceCandidate: result.retainedSourceCandidate,
        })),
      },
    });
    if (!candidateReview.ok || candidateReview.candidate.collisions.length > 0) {
      throw new Error("The AI workout initializer candidate is invalid.");
    }
    candidate = candidateReview.candidate;
  } catch {
    const issueCode = "ai_authored_plan_first_preview_projection_failed";
    const generationTrace = await updateAiPlanGenerationLedgerTrace(
      result.metadata.generationTrace,
      {
        pipeline: {
          normalizationStatus: "finalization_failed",
          issueCodes: [issueCode],
          finalOutcome: "unavailable",
          unavailableReason: issueCode,
        },
      },
      options.aiPreview?.generationLedger,
    );

    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: "ai_generated_plan_unavailable",
        message: "The authored plan could not be finalized for review.",
        issues: ["Canonical workout projection failed before review signing."],
        generationTrace,
        input,
        normalizedInputSummary,
        previewOutcome: "review_refusal",
      }),
    };
  }
  const endpointProof = buildEndpointProof(calendarRows);
  const endpointIssues = collectPreviewEndpointProofIssues({
    rows: calendarRows,
    distanceMeters: generationAuthoringInput.planGoalIntent.distance?.distanceMeters ?? null,
    targetDate: canonicalPlan.target_date ?? null,
    endpointProof,
    targetInDetailedHorizon: result.blueprint.detailedHorizon.targetBoundary,
  });
  const callsOpenAi = Boolean(result.metadata.generationTrace?.provider.paidProviderCall);
  return {
    ok: true,
    draft: {
      sourceKind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
      source_kind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
      sourceStatus: result.metadata.status as AiGeneratedRunningPlanSourceStatus,
      source_status: result.metadata.status as AiGeneratedRunningPlanSourceStatus,
      persisted: false,
      mutates: false,
      callsOpenAi,
      planVersion: AI_GENERATED_RUNNING_PLAN_PREVIEW_VERSION,
      previewOutcome: "preview_ready",
      reviewSafety: {
        persisted: false,
        mutates: false,
        confirmPathImplemented: true,
        callsOpenAi,
        confirmCallsOpenAi: false,
        trustedClientRows: false,
      },
      blueprint: result.blueprint,
      reviewConflicts: result.reviewConflicts,
      sourceCandidate: result.retainedSourceCandidate,
      previewInput: toReviewedPreviewInput(input),
      normalizedInputSummary,
      calendarRows,
      workoutDocuments,
      candidate,
      endpointProof,
      validation: {
        ok: true,
        issues: endpointIssues,
        forbiddenOutputGateIdsChecked: ["ai_authored_plan_first_compiled_to_training_plan_v2"],
      },
      canonicalPlan,
      aiGeneration: result.metadata,
    },
  };
}

export type RestoredAiGeneratedRunningPlanPreviewFailureReason =
  | "invalid_content"
  | "invalid_lineage";

export function buildRestoredAiGeneratedRunningPlanPreviewDraft(input: {
  sourceCandidate: RetainedAdaptiveTrainingSourceCandidate;
  blueprint: unknown;
  candidateContent: unknown;
  authoringInput: unknown;
  intervalStartDate: string;
  intervalEndDate: string;
  retainedResponseProvenance?: {
    providerResponseId: string | null;
  };
}):
  | { ok: true; draft: AiGeneratedRunningPlanPreviewDraft }
  | { ok: false; reason: RestoredAiGeneratedRunningPlanPreviewFailureReason } {
  const blueprint = parseRestoredBlueprint(input.blueprint);
  const candidateContent = parseRestoredCandidateContent(input.candidateContent);
  const authoringInput = structuredPlanAuthoringInputSchema.safeParse(input.authoringInput);
  if (!blueprint || !candidateContent || !authoringInput.success) {
    return { ok: false, reason: "invalid_content" };
  }
  if (
    blueprint.startDate !== candidateContent.canonicalPlan.start_date ||
    blueprint.detailedHorizon.startDate !== input.intervalStartDate ||
    blueprint.detailedHorizon.endDate !== input.intervalEndDate
  ) {
    return { ok: false, reason: "invalid_lineage" };
  }

  const canonicalPlan = candidateContent.canonicalPlan;
  const calendarRows = projectCanonicalPlanToPreviewRows(canonicalPlan);
  const workoutDocuments = buildImportedPlanSeed(canonicalPlan).workouts;
  const candidateReview = reviewWorkoutCommand({
    command: {
      operation: "materialize",
      documents: workoutDocuments,
      provenanceReferences: workoutDocuments.map((document) => ({
        sourceKind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
        sourceStatus: "ai_authored" as const,
        sourceWorkoutId: document.sourceWorkoutId,
        adaptiveTrainingSourceCandidate: input.sourceCandidate,
      })),
    },
  });
  if (!candidateReview.ok || candidateReview.candidate.collisions.length > 0) {
    return { ok: false, reason: "invalid_content" };
  }

  const normalizedInputSummary = buildRestoredNormalizedInputSummary(
    authoringInput.data,
    canonicalPlan,
  );
  const endpointProof = buildEndpointProof(calendarRows);
  const endpointIssues = collectPreviewEndpointProofIssues({
    rows: calendarRows,
    distanceMeters: authoringInput.data.planGoalIntent.distance?.distanceMeters ?? null,
    targetDate: canonicalPlan.target_date ?? null,
    endpointProof,
    targetInDetailedHorizon: blueprint.detailedHorizon.targetBoundary,
  });

  return {
    ok: true,
    draft: {
      sourceKind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
      source_kind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
      sourceStatus: "ai_authored",
      source_status: "ai_authored",
      persisted: false,
      mutates: false,
      callsOpenAi: false,
      planVersion: AI_GENERATED_RUNNING_PLAN_PREVIEW_VERSION,
      previewOutcome: "preview_ready",
      reviewSafety: {
        persisted: false,
        mutates: false,
        confirmPathImplemented: true,
        callsOpenAi: false,
        confirmCallsOpenAi: false,
        trustedClientRows: false,
      },
      blueprint,
      reviewConflicts: candidateContent.reviewConflicts,
      sourceCandidate: input.sourceCandidate,
      previewInput: buildRestoredReviewedPreviewInput(authoringInput.data),
      normalizedInputSummary,
      calendarRows,
      workoutDocuments,
      candidate: candidateReview.candidate,
      endpointProof,
      validation: {
        ok: true,
        issues: endpointIssues,
        forbiddenOutputGateIdsChecked: ["ai_authored_plan_first_compiled_to_training_plan_v2"],
      },
      canonicalPlan,
      aiGeneration: restoredSavedPlanReviewMetadata(input.retainedResponseProvenance),
    },
  };
}

export function isAiGeneratedRunningPlanPreviewDraft(
  value: unknown,
): value is AiGeneratedRunningPlanPreviewDraft {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    isAiGeneratedRunningPlanPreviewSourceKind((value as { sourceKind?: unknown }).sourceKind) &&
    (value as { blueprint?: unknown }).blueprint != null &&
    (value as { canonicalPlan?: unknown }).canonicalPlan != null &&
    Array.isArray((value as { workoutDocuments?: unknown }).workoutDocuments)
  );
}

function isAiGeneratedRunningPlanPreviewSourceKind(
  value: unknown,
): value is AiGeneratedRunningPlanPreviewSourceKind {
  return value === AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;
}

export function buildAiGeneratedRunningPlanAuthoringInput(
  input: BuildRunningPlanPreviewInput,
  runnerCapability?: RunnerPlanCapabilityVectorV1 | null,
  acceptedHeartRateProfile?: AcceptedRunnerHeartRateProfile | null,
):
  | {
      ok: true;
      authoringInput: StructuredPlanAuthoringInput;
      planGoalIntent: NormalizedPlanGoalIntent;
      normalizedInputSummary: RunningPlanPreviewNormalizedInputSummary;
    }
  | {
      ok: false;
      reason: "invalid_plan_goal_intent" | "structured_input_invalid";
      message: string;
    } {
  if (!runnerCapability || !acceptedHeartRateProfile) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      message: "Complete the runner profile facts before creating a generated plan.",
    };
  }

  const runnerCommentResult = generatedPlanRunnerCommentInputSchema.safeParse(input.runnerComment);
  if (!runnerCommentResult.success) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      message:
        runnerCommentResult.error.issues.at(0)?.message ??
        "The plan comment could not be normalized.",
    };
  }
  const runnerComment = runnerCommentResult.data;
  const startDate = normalizeStartDate(input.startDate);
  const normalizedIntent = normalizePlanGoalIntent({
    rawIntent: input.planGoalIntent,
    startDate,
  });

  if (!normalizedIntent.ok) {
    return {
      ok: false,
      reason: normalizedIntent.reason,
      message: normalizedIntent.message,
    };
  }
  if (!normalizedIntent.intent.distance) {
    return {
      ok: false,
      reason: "invalid_plan_goal_intent",
      message: "Choose a training distance before creating a generated plan.",
    };
  }

  const availability = resolveInitialPlanAvailability({
    input,
    persisted: {
      blocked_days: [...runnerCapability.constraints.fixedRestDays] as WeekdayName[],
      preferred_long_run_day: runnerCapability.constraints
        .preferredLongRunDay as WeekdayName | null,
      max_running_days_per_week: runnerCapability.constraints.maximumRunningDaysPerWeek,
    },
  });
  if (
    runnerCapability.evidenceConfidence.recent7 === "updating" ||
    runnerCapability.evidenceConfidence.recent7 === "contradictory"
  ) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      message: "Runner facts are not stable enough to prepare a plan.",
    };
  }
  if (!availability.ok) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      message: availability.message,
    };
  }
  const { fixedRestDays, availableWeekdays, daysPerWeek, preferredLongRunDay } = availability;
  const benchmarkPaceTruth = normalizeBenchmarkPaceTruth(input.benchmark ?? null);
  const planGoalIntent = normalizedIntent.intent;
  const authoringInput = structuredPlanAuthoringInputSchema.safeParse({
    schedule: {
      startDate,
    },
    runnerFacts: {
      age: Math.round(input.age),
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      selfReportedLevel: input.runnerLevel,
      benchmark: benchmarkPaceTruth,
      heartRateProfile: acceptedHeartRateProfile,
    },
    availability: {
      fixedRestDays,
      maxRunningDaysPerWeek: daysPerWeek,
      preferredLongRunDay,
    },
    planGoalIntent,
    ...(runnerComment ? { requestContext: { runnerComment } } : {}),
    runnerCapability,
  });

  if (!authoringInput.success) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      message:
        authoringInput.error.issues.at(0)?.message ??
        "Generated-plan setup could not be normalized.",
    };
  }

  const parsedAuthoringInput = authoringInput.data;

  return {
    ok: true,
    authoringInput: parsedAuthoringInput,
    planGoalIntent,
    normalizedInputSummary: {
      normalizedBy: "backend_ai_generated_plan_authoring_normalizer_v1",
      age: input.age,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      runnerLevel: input.runnerLevel,
      daysPerWeek,
      fixedRestDays,
      preferredLongRunDay,
      startDate,
      benchmarkPaceTruth,
      planGoalIntent,
      longRunDaySource:
        input.preferredLongRunDay && input.preferredLongRunDay === preferredLongRunDay
          ? "runner_preference"
          : "not_supplied",
      trainingWeekdays: availableWeekdays,
      loadContext: "ai_authored",
      heartRateProfile: acceptedHeartRateProfile,
      runnerCapability,
    },
  };
}

function resolveInitialPlanAvailability(input: {
  input: BuildRunningPlanPreviewInput;
  persisted: RunnerTrainingPreferencesStorage | null;
}):
  | {
      ok: true;
      fixedRestDays: WeekdayName[] | null;
      availableWeekdays: WeekdayName[];
      daysPerWeek: RunningPlanDaysPerWeek | null;
      preferredLongRunDay: WeekdayName | null;
    }
  | { ok: false; reason: string; message: string } {
  const requestBlocked = uniqueWeekdays(input.input.fixedRestDays ?? []);
  const persistedBlocked = input.persisted?.blocked_days ?? [];
  const blocked = uniqueWeekdays([...requestBlocked, ...persistedBlocked]);
  const availableWeekdays = deriveAvailableTrainingWeekdays(blocked);
  if (availableWeekdays.length === 0) {
    return {
      ok: false,
      reason: "initial_plan_availability_no_training_day",
      message: "Leave at least one weekday available for running.",
    };
  }
  const persistedMaximum = input.persisted?.max_running_days_per_week ?? null;
  if (
    input.input.daysPerWeek != null &&
    persistedMaximum != null &&
    input.input.daysPerWeek > persistedMaximum
  ) {
    return {
      ok: false,
      reason: "initial_plan_running_days_conflict",
      message: "The per-plan running days exceed the saved runner constraint.",
    };
  }
  const daysPerWeek = (input.input.daysPerWeek ??
    persistedMaximum) as RunningPlanDaysPerWeek | null;
  if (daysPerWeek != null && daysPerWeek > availableWeekdays.length) {
    return {
      ok: false,
      reason: "initial_plan_running_days_unavailable",
      message: "The selected running-day count exceeds the available weekdays.",
    };
  }
  const preferredLongRunDay =
    input.input.preferredLongRunDay ?? input.persisted?.preferred_long_run_day ?? null;
  if (preferredLongRunDay && !availableWeekdays.includes(preferredLongRunDay)) {
    return {
      ok: false,
      reason: "initial_plan_long_run_day_conflict",
      message: "The selected long-run day conflicts with a saved rest-day constraint.",
    };
  }
  return {
    ok: true,
    fixedRestDays: blocked.length > 0 ? blocked : null,
    availableWeekdays,
    daysPerWeek,
    preferredLongRunDay,
  };
}

function buildAiAuthoredNormalizedInputSummary(
  summary: RunningPlanPreviewNormalizedInputSummary,
  canonicalPlan: TrainingPlanV2,
): RunningPlanPreviewNormalizedInputSummary {
  const trainingWeekdays = uniqueWeekdays(
    canonicalPlan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.weekday as WeekdayName),
  );
  const authoredLongRunDay = canonicalPlan.plan_preferences?.preferred_long_run_day;
  const preferredLongRunDay =
    typeof authoredLongRunDay === "string" &&
    WEEKDAY_NAMES.includes(authoredLongRunDay as WeekdayName)
      ? (authoredLongRunDay as WeekdayName)
      : summary.preferredLongRunDay;

  return {
    ...summary,
    preferredLongRunDay,
    longRunDaySource:
      preferredLongRunDay == null
        ? "not_supplied"
        : preferredLongRunDay === summary.preferredLongRunDay &&
            summary.longRunDaySource === "runner_preference"
          ? "runner_preference"
          : "ai_authored",
    trainingWeekdays,
    loadContext: "ai_authored",
  };
}

function buildLocalQaFixtureNormalizedInputSummary(
  runnerSummary: RunningPlanPreviewNormalizedInputSummary,
  fixtureInput: StructuredPlanAuthoringInput,
): RunningPlanPreviewNormalizedInputSummary {
  return {
    ...runnerSummary,
    normalizedBy: "backend_local_qa_fixture_input_v1",
    startDate: fixtureInput.schedule.startDate,
  };
}

function buildRestoredNormalizedInputSummary(
  input: StructuredPlanAuthoringInput,
  canonicalPlan: TrainingPlanV2,
): RunningPlanPreviewNormalizedInputSummary {
  const trainingWeekdays = uniqueWeekdays(
    canonicalPlan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.weekday as WeekdayName),
  );
  const authoredLongRunDay = canonicalPlan.plan_preferences?.preferred_long_run_day;
  const preferredLongRunDay =
    typeof authoredLongRunDay === "string" &&
    WEEKDAY_NAMES.includes(authoredLongRunDay as WeekdayName)
      ? (authoredLongRunDay as WeekdayName)
      : (input.availability.preferredLongRunDay ?? null);
  const requestedLongRunDay = input.availability.preferredLongRunDay ?? null;

  return {
    normalizedBy: "backend_saved_plan_review_restore_v1",
    age: input.runnerFacts.age,
    heightCm: input.runnerFacts.heightCm,
    weightKg: input.runnerFacts.weightKg,
    runnerLevel: input.runnerFacts.selfReportedLevel,
    daysPerWeek:
      (input.availability.maxRunningDaysPerWeek as RunningPlanDaysPerWeek | null) ?? null,
    fixedRestDays: input.availability.fixedRestDays,
    preferredLongRunDay,
    startDate: input.schedule.startDate,
    benchmarkPaceTruth: input.runnerFacts.benchmark,
    planGoalIntent: input.planGoalIntent,
    longRunDaySource:
      preferredLongRunDay == null
        ? "not_supplied"
        : preferredLongRunDay === requestedLongRunDay
          ? "runner_preference"
          : "ai_authored",
    trainingWeekdays,
    loadContext: "ai_authored",
    heartRateProfile: input.runnerFacts.heartRateProfile,
    runnerCapability: input.runnerCapability,
  };
}

function buildRestoredReviewedPreviewInput(
  input: StructuredPlanAuthoringInput,
): RunningPlanReviewedPreviewInput {
  const distance = input.planGoalIntent.distance;
  if (!distance) {
    throw new Error("A restored generated review requires its selected distance.");
  }

  return {
    age: input.runnerFacts.age,
    heightCm: input.runnerFacts.heightCm,
    weightKg: input.runnerFacts.weightKg,
    runnerLevel: input.runnerFacts.selfReportedLevel,
    daysPerWeek:
      (input.availability.maxRunningDaysPerWeek as RunningPlanDaysPerWeek | null) ?? null,
    fixedRestDays: input.availability.fixedRestDays,
    preferredLongRunDay: input.availability.preferredLongRunDay ?? null,
    startDate: input.schedule.startDate,
    benchmark: restoreReviewedBenchmark(input.runnerFacts.benchmark),
    planGoalIntent: {
      distance:
        distance.kind === "preset" && distance.preset
          ? { kind: "preset", preset: distance.preset }
          : {
              kind: "custom",
              distanceKm: distance.distanceKm,
              label: distance.label,
            },
      targetDate: input.planGoalIntent.targetDate,
      targetFinishTime: input.planGoalIntent.targetFinishTime?.label ?? null,
      targetOutcomePace: input.planGoalIntent.supplied.targetOutcomePace
        ? (input.planGoalIntent.targetOutcomePace?.label ?? null)
        : null,
    },
  };
}

function restoreReviewedBenchmark(
  benchmark: StructuredPlanAuthoringInput["runnerFacts"]["benchmark"],
): BuildRunningPlanPreviewInput["benchmark"] {
  if (!benchmark) return { kind: "unknown" };
  if (benchmark.source === "recent_5k_time") {
    return {
      kind: "recent_5k_time",
      recent5kTime: benchmark.label.startsWith("Recent 5K ")
        ? benchmark.label.slice("Recent 5K ".length)
        : formatRestoredDuration(benchmark.paceSecondsPerKm * 5),
    };
  }
  return {
    kind: "recent_5k_pace",
    recent5kPace: benchmark.label.startsWith("Recent 5K pace ")
      ? benchmark.label.slice("Recent 5K pace ".length)
      : `${formatRestoredDuration(benchmark.paceSecondsPerKm)}/km`,
  };
}

function parseRestoredCandidateContent(value: unknown): {
  canonicalPlan: TrainingPlanV2;
  reviewConflicts: AiAuthoredBlueprintReviewConflict[];
} | null {
  const record = unknownRecord(value);
  const canonicalPlan = trainingPlanV2Schema.safeParse(record?.canonicalPlan);
  if (!record || !canonicalPlan.success || !Array.isArray(record.reviewConflicts)) return null;
  const reviewConflicts = record.reviewConflicts.filter(isRestoredReviewConflict);
  return reviewConflicts.length === record.reviewConflicts.length
    ? { canonicalPlan: canonicalPlan.data, reviewConflicts }
    : null;
}

function parseRestoredBlueprint(value: unknown): AiAuthoredBlueprintSummary | null {
  const record = unknownRecord(value);
  const detailedHorizon = unknownRecord(record?.detailedHorizon);
  if (
    !record ||
    record.version !== AI_AUTHORED_BLUEPRINT_VERSION ||
    typeof record.startDate !== "string" ||
    typeof record.selectedTargetDate !== "string" ||
    typeof record.targetAssumption !== "string" ||
    !Array.isArray(record.phases) ||
    !Array.isArray(record.projections) ||
    !detailedHorizon ||
    typeof detailedHorizon.startDate !== "string" ||
    typeof detailedHorizon.endDate !== "string" ||
    typeof detailedHorizon.calendarWeekCount !== "number" ||
    typeof detailedHorizon.targetBoundary !== "boolean"
  ) {
    return null;
  }
  return value as AiAuthoredBlueprintSummary;
}

function isRestoredReviewConflict(value: unknown): value is AiAuthoredBlueprintReviewConflict {
  const record = unknownRecord(value);
  return Boolean(
    record &&
    (record.code === "fixed_rest_day_preference_conflict" ||
      record.code === "preferred_long_run_day_conflict") &&
    typeof record.date === "string" &&
    typeof record.message === "string",
  );
}

function restoredSavedPlanReviewMetadata(
  retainedResponseProvenance:
    | {
        providerResponseId: string | null;
      }
    | undefined,
): AiFirstPlanDraftPreviewMetadata {
  const isExactLocalQaFixture =
    retainedResponseProvenance?.providerResponseId ===
    AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID;
  return {
    status: "ai_authored",
    source: "openai_adaptive_blueprint_four_week_draft",
    validationIssues: [],
    model: isExactLocalQaFixture
      ? AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL
      : "saved-plan-review-restore-v1",
    responseId: isExactLocalQaFixture ? AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID : null,
    elapsedMs: 0,
    validationIssueCount: 0,
    generationTrace: null,
    debug: {
      timeoutMs: 0,
      maxOutputTokens: 0,
      contractMode: "adaptive_blueprint_four_week",
      responseSchemaMode: "responses_json_schema_adaptive_blueprint_four_week_v1_strict",
      requestPhase: "normalized",
      abortReason: null,
      abortFired: false,
      transportMode: "not_started",
      transportHeadersTimeoutMs: null,
      transportBodyTimeoutMs: null,
      transportFailureCode: null,
      openAiElapsedMs: null,
      promptCharEstimate: null,
      systemPromptChars: null,
      userPromptChars: null,
      responseSchemaChars: null,
      responseStatus: null,
      responseIncompleteReason: null,
      inputTokens: null,
      outputTokens: null,
      reasoningTokens: null,
      totalTokens: null,
      outputTextChars: null,
      reasoningEffortSent: false,
    },
  };
}

function unknownRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function formatRestoredDuration(seconds: number) {
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainder = rounded % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`
    : `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function normalizeStartDate(value: string | null | undefined) {
  return value?.trim() || todayIso();
}

function normalizeBenchmarkPaceTruth(
  benchmark: BuildRunningPlanPreviewInput["benchmark"] | null,
): RunningPlanBenchmarkPaceTruth | null {
  if (!benchmark || benchmark.kind === "unknown") {
    return null;
  }

  if (benchmark.kind === "recent_5k_time") {
    const seconds = parseDurationSeconds(benchmark.recent5kTime);
    if (seconds == null) return null;

    return {
      kind: "recent_5k",
      source: "recent_5k_time",
      paceSecondsPerKm: Math.round(seconds / 5),
      label: `Recent 5K ${benchmark.recent5kTime}`,
    };
  }

  const paceSeconds = parsePaceSecondsPerKm(benchmark.recent5kPace);
  if (paceSeconds == null) return null;

  return {
    kind: "recent_5k",
    source: "recent_5k_pace",
    paceSecondsPerKm: paceSeconds,
    label: `Recent 5K pace ${benchmark.recent5kPace}`,
  };
}

function projectCanonicalPlanToPreviewRows(
  canonicalPlan: TrainingPlanV2,
): readonly RunningPlanPreviewCalendarRow[] {
  const rows = canonicalPlan.planned_workouts.map((workout, index) => {
    const isRestDay = workout.workout_type === "rest";
    const workoutDayKind = isRestDay
      ? RUNNING_PLAN_PREVIEW_REST_DAY_KIND
      : normalizeWorkoutDayKind({
          sourceWorkoutType: workout.source_workout_type,
          workoutFamily: workout.workout_family,
          workoutIdentity: workout.workout_identity,
          segments: workout.segments,
        });

    return {
      rowId: workout.workout_id,
      date: workout.date,
      weekNumber: workout.week_number,
      dayNumber: index + 1,
      weekday: normalizeWeekday(workout.weekday, workout.date),
      isRestDay,
      workoutDayKind,
      title: workout.title ?? (isRestDay ? "Rest" : "AI-authored workout"),
      watchExecutable: true,
      primaryContract: isRestDay ? null : "numeric_structure",
      targetTruthModes: workoutTargetsIncludeDefaultHr(workout)
        ? ["structure_only", "editable_default_hr"]
        : ["structure_only"],
      cueRole: isRestDay ? null : "secondary_only",
      segments: isRestDay
        ? []
        : workout.segments.map((segment, segmentIndex) =>
            projectCanonicalSegmentToPreviewTemplate(workout.workout_id, segment, segmentIndex),
          ),
      endpointGateId: null,
      endpointIdentity: workout.workout_identity ?? null,
      endpointDistanceMeters: null,
    } satisfies RunningPlanPreviewCalendarRow;
  });

  return rows.map((row) => {
    const finalNonRest = [...rows].reverse().find((candidate) => !candidate.isRestDay);
    if (
      !finalNonRest ||
      row.rowId !== finalNonRest.rowId ||
      row.workoutDayKind !== "final_selected_distance_day"
    ) {
      return row;
    }

    return {
      ...row,
      endpointGateId: "ai_generated_goal_distance_endpoint",
      endpointDistanceMeters: previewRowMainDistanceMeters(row),
    } satisfies RunningPlanPreviewCalendarRow;
  });
}

function projectCanonicalSegmentToPreviewTemplate(
  workoutId: string,
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
  index: number,
): RunningPlanWatchExecutableSegmentTemplate {
  return {
    id: segment.segment_id ?? `${workoutId}-segment-${index + 1}`,
    order: segment.sequence ?? index + 1,
    segmentRole: normalizeSegmentRole(segment.segment_type),
    primaryPrescription: projectCanonicalPrescription(segment.prescription),
    targetTruthMode: segmentTargetIncludesDefaultHr(segment)
      ? "editable_default_hr"
      : "structure_only",
    secondaryCue: segment.guidance ?? segment.target?.cue ?? "Follow the reviewed plan structure.",
    ...(segment.target ? { target: cloneStepTarget(segment.target) } : {}),
  };
}

function projectCanonicalPrescription(
  prescription: TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"],
): RunningPlanSegmentPrescription {
  if (!prescription || prescription.mode === "none") {
    return { mode: "none" };
  }

  if (prescription.mode === "distance") {
    return {
      mode: "distance",
      distanceMeters: kmValueToMetersRange(prescription.distance_km),
      intensityLabel: "reviewed_distance",
    };
  }

  if (prescription.mode === "repeats") {
    return {
      mode: "repeat",
      repeatCount: {
        min: prescription.repeat_count ?? 1,
        max: prescription.repeat_count ?? 1,
      },
      children: (prescription.children ?? []).map((child) => ({
        role: child.role,
        ...(child.label ? { label: child.label } : {}),
        ...(child.guidance ? { guidance: child.guidance } : {}),
        prescription:
          child.prescription.mode === "distance"
            ? {
                mode: "distance",
                distanceMeters: kmValueToMetersRange(child.prescription.distance_km),
              }
            : {
                mode: "time",
                durationSeconds: minutesValueToSecondsRange(child.prescription.duration_min),
              },
        intensityLabel: child.target?.intensity ?? "reviewed_repeat_child",
        ...(child.target ? { target: cloneStepTarget(child.target) } : {}),
      })),
    };
  }

  return {
    mode: "time",
    durationSeconds: minutesValueToSecondsRange(prescription.duration_min),
    intensityLabel: "reviewed_time",
  };
}

function buildEndpointProof(rows: readonly RunningPlanPreviewCalendarRow[]) {
  const finalNonRest = [...rows].reverse().find((row) => !row.isRestDay) ?? rows.at(-1);
  const endpointDistanceMeters =
    finalNonRest?.workoutDayKind === "final_selected_distance_day"
      ? (finalNonRest.endpointDistanceMeters ?? null)
      : null;
  const endpointMainDistanceMeters =
    finalNonRest?.workoutDayKind === "final_selected_distance_day"
      ? previewRowMainDistanceMeters(finalNonRest)
      : null;

  return {
    finalRowId: finalNonRest?.rowId ?? "ai-generated-plan-endpoint-unavailable",
    finalDate: finalNonRest?.date ?? todayIso(),
    endpointDistanceMeters,
    endpointMainDistanceMeters,
    finalRowIsLastNonRest: true as const,
  };
}

function collectPreviewEndpointProofIssues(input: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  distanceMeters: number | null;
  targetDate: string | null;
  endpointProof: AiGeneratedRunningPlanPreviewDraft["endpointProof"];
  targetInDetailedHorizon: boolean;
}) {
  if (!input.targetInDetailedHorizon) return [];

  return collectSelectedDistanceEndpointIssues({
    rows: input.rows.map((row) => ({
      id: row.rowId,
      date: row.date,
      isRest: row.isRestDay,
      endpointKind: row.workoutDayKind,
      endpointIdentity: row.endpointIdentity,
      endpointDistanceMeters: previewRowMainDistanceMeters(row),
      isSelectedEndpointSignal: row.workoutDayKind === "final_selected_distance_day",
    })),
    expectedDistanceMeters: input.distanceMeters,
    targetDate: input.targetDate,
    proof: input.endpointProof,
    useFinalNonRestWhenTargetDateMissing: true,
    requireEndpointIdentity: true,
  }).map((issue) => `${issue.code}: ${issue.message}`);
}

function previewRowMainDistanceMeters(row: RunningPlanPreviewCalendarRow) {
  const totalMeters = row.segments
    .filter((segment) => segment.segmentRole === "main")
    .reduce(
      (total, segment) => total + previewPrescriptionDistanceMeters(segment.primaryPrescription),
      0,
    );

  return totalMeters > 0 ? totalMeters : null;
}

function previewPrescriptionDistanceMeters(
  prescription: RunningPlanPreviewCalendarRow["segments"][number]["primaryPrescription"],
) {
  if (prescription.mode === "distance") {
    if (
      !prescription.distanceMeters ||
      prescription.distanceMeters.min !== prescription.distanceMeters.max
    ) {
      return 0;
    }

    return prescription.distanceMeters.min;
  }

  if (prescription.mode !== "repeat") {
    return 0;
  }

  const childDistanceMeters = (prescription.children ?? []).reduce((total, child) => {
    const childPrescription = child.prescription;

    if (
      childPrescription.mode !== "distance" ||
      !childPrescription.distanceMeters ||
      childPrescription.distanceMeters.min !== childPrescription.distanceMeters.max
    ) {
      return total;
    }

    return total + childPrescription.distanceMeters.min;
  }, 0);

  if (childDistanceMeters <= 0) {
    return 0;
  }

  return childDistanceMeters * (prescription.repeatCount?.min ?? 1);
}

function normalizeWorkoutDayKind({
  sourceWorkoutType,
  workoutFamily,
  workoutIdentity,
  segments,
}: {
  sourceWorkoutType: string | null | undefined;
  workoutFamily: string | null | undefined;
  workoutIdentity: string | null | undefined;
  segments: TrainingPlanV2["planned_workouts"][number]["segments"];
}): RunningPlanWorkoutDayKind {
  if (
    typeof sourceWorkoutType === "string" &&
    RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES.includes(sourceWorkoutType as RunningPlanWorkoutDayKind)
  ) {
    return sourceWorkoutType as RunningPlanWorkoutDayKind;
  }

  if (workoutIdentity === "easy_run_with_strides") return "strides";
  if (workoutIdentity === "cutback_long_run") return "cutback_long_run";
  if (workoutIdentity === "recovery_jog") return "recovery";
  if (segments.some((segment) => segment.segment_type === "strides")) return "strides";
  if (segments.some((segment) => segment.segment_type === "tempo_block")) return "tempo";
  if (segments.some((segment) => segment.segment_type === "interval_block")) return "intervals";

  switch (workoutFamily) {
    case "recovery":
      return "recovery";
    case "fueling":
      return "hydration";
    case "easy":
      return "easy";
    case "steady":
      return "steady_aerobic_run";
    case "long":
      return "long_run";
    case "tempo":
      return "tempo";
    case "intervals":
      return "intervals";
    case "progression":
      return "progression";
    case "hills":
      return "hills";
    case "trail":
      return "trail";
    case "race":
      return "race";
  }

  throw new Error(
    `AI-authored workout identity could not be projected without semantic substitution: ${
      workoutIdentity ?? sourceWorkoutType ?? workoutFamily ?? "unknown"
    }.`,
  );
}

function cloneStepTarget(
  target: NonNullable<TrainingPlanV2["planned_workouts"][number]["segments"][number]["target"]>,
) {
  return {
    ...target,
    ...(target.extra ? { extra: { ...target.extra } } : {}),
  };
}

function normalizeSegmentRole(
  value: TrainingPlanV2["planned_workouts"][number]["segments"][number]["segment_type"],
): RunningPlanWatchExecutableSegmentTemplate["segmentRole"] {
  switch (value) {
    case "warmup":
      return "warmup";
    case "cooldown":
      return "cooldown";
    case "recovery":
      return "recovery";
    case "tempo_block":
      return "work";
    case "finish":
      return "finish";
    case "fueling":
      return "checkpoint";
    default:
      return "main";
  }
}

function kmValueToMetersRange(value: number | { min?: number; max?: number } | undefined) {
  if (typeof value === "number") {
    const meters = Math.round(value * 1000);
    return { min: meters, max: meters };
  }

  return {
    min: Math.round((value?.min ?? 0.1) * 1000),
    max: Math.round((value?.max ?? value?.min ?? 0.1) * 1000),
  };
}

function minutesValueToSecondsRange(value: number | { min?: number; max?: number } | undefined) {
  if (typeof value === "number") {
    const seconds = Math.round(value * 60);
    return { min: seconds, max: seconds };
  }

  return {
    min: Math.round((value?.min ?? 5) * 60),
    max: Math.round((value?.max ?? value?.min ?? 5) * 60),
  };
}

function workoutTargetsIncludeDefaultHr(workout: TrainingPlanV2["planned_workouts"][number]) {
  return workout.segments.some(segmentTargetIncludesDefaultHr);
}

function segmentTargetIncludesDefaultHr(
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
) {
  return /default_estimated_hr/i.test(JSON.stringify(segment.target ?? segment.prescription ?? {}));
}

function normalizeWeekday(value: string, date: string): WeekdayName {
  if (WEEKDAY_NAMES.includes(value as WeekdayName)) {
    return value as WeekdayName;
  }

  const derived = weekdayLong(date);
  if (WEEKDAY_NAMES.includes(derived as WeekdayName)) {
    return derived as WeekdayName;
  }

  throw new Error(`Could not derive a canonical weekday for ${date}.`);
}

export function buildAiGeneratedRunningPlanPreviewUnavailable(input: {
  code: AiGeneratedRunningPlanPreviewUnavailable["error"]["code"];
  message: string;
  issues: readonly string[];
  generationTrace: AiPlanGenerationLedgerTrace | null;
  input: BuildRunningPlanPreviewInput;
  normalizedInputSummary: RunningPlanPreviewNormalizedInputSummary | null;
  previewOutcome: AiGeneratedRunningPlanPreviewUnavailable["previewOutcome"];
  compilerDiagnostic?: AiGeneratedRunningPlanPreviewUnavailable["error"]["compilerDiagnostic"];
}): AiGeneratedRunningPlanPreviewUnavailable {
  return {
    sourceKind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
    source_kind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
    sourceStatus: "preview_unavailable",
    source_status: "preview_unavailable",
    persisted: false,
    mutates: false,
    callsOpenAi: Boolean(input.generationTrace?.provider.paidProviderCall),
    previewOutcome: input.previewOutcome,
    error: {
      code: input.code,
      message: input.message,
      issues: input.issues,
      compilerDiagnostic: input.compilerDiagnostic ?? null,
    },
    debug: {
      generationTrace: input.generationTrace,
      previewActionTrace: buildPreviewActionTrace(input),
    },
  };
}

function classifyAiFirstPlanDraftFailure(
  unavailableReason: string,
): AiGeneratedRunningPlanPreviewUnavailable["previewOutcome"] {
  if (
    unavailableReason === "ai_authored_plan_first_incomplete_output" ||
    unavailableReason === "ai_authored_plan_first_provider_not_completed" ||
    unavailableReason === "ai_first_plan_draft_empty_output"
  ) {
    return "provider_incomplete_output";
  }

  if (
    unavailableReason === "ai_first_plan_draft_non_json_output" ||
    unavailableReason === "ai_authored_plan_first_provider_schema_invalid" ||
    unavailableReason === "ai_authored_plan_first_runner_context_echoed"
  ) {
    return "malformed_provider_output";
  }

  if (unavailableReason === "ai_authored_plan_first_rejected_before_review") {
    return "compiler_rejection";
  }

  return "provider_runtime_failure";
}

function toReviewedPreviewInput(
  input: BuildRunningPlanPreviewInput,
): RunningPlanReviewedPreviewInput {
  const { runnerComment: _runnerComment, ...reviewedInput } = input;

  return JSON.parse(JSON.stringify(reviewedInput)) as RunningPlanReviewedPreviewInput;
}

function buildPreviewActionTrace(input: {
  input: BuildRunningPlanPreviewInput;
  normalizedInputSummary: RunningPlanPreviewNormalizedInputSummary | null;
  generationTrace: AiPlanGenerationLedgerTrace | null;
}): AiGeneratedRunningPlanPreviewActionTrace {
  const trace = input.generationTrace;
  const normalizedIntent = input.normalizedInputSummary?.planGoalIntent ?? null;
  const rawIntent = input.input.planGoalIntent ?? null;

  return {
    previewInputSummary: {
      runnerLevel: input.input.runnerLevel,
      daysPerWeek: input.input.daysPerWeek ?? null,
      fixedRestDayCount:
        input.input.fixedRestDays && input.input.fixedRestDays.length > 0
          ? input.input.fixedRestDays.length
          : null,
      preferredLongRunDay: input.input.preferredLongRunDay ?? null,
      startDate: input.input.startDate ?? null,
      benchmarkKind: input.input.benchmark?.kind ?? null,
    },
    planGoalIntentSummary: {
      distanceLabel:
        normalizedIntent?.distance?.label ??
        (rawIntent?.distance?.kind === "preset" ? rawIntent.distance.preset : null),
      distanceMeters: normalizedIntent?.distance?.distanceMeters ?? null,
      targetDate: normalizedIntent?.targetDate ?? rawIntent?.targetDate ?? null,
      targetFinishTime:
        normalizedIntent?.targetFinishTime?.label ?? rawIntent?.targetFinishTime ?? null,
      targetOutcomePace:
        normalizedIntent?.targetOutcomePace?.label ?? rawIntent?.targetOutcomePace ?? null,
    },
    normalizedBy: input.normalizedInputSummary?.normalizedBy ?? null,
    localDevFixtureEnabled:
      isAiGeneratedRunningPlanDevFixtureEnabled() || trace?.provider.kind === "local_dev_fixture",
    provider: trace
      ? {
          kind: trace.provider.kind,
          paidProviderCall: trace.provider.paidProviderCall,
          responseId: trace.provider.responseId,
          model: trace.provider.model,
          tokenUsage: trace.usage,
        }
      : null,
    liveOpenAiCalled: Boolean(trace?.provider.paidProviderCall),
    unavailableReason: trace?.pipeline.unavailableReason ?? null,
    diagnosticCodes: trace?.pipeline.issueCodes ?? [],
    normalizationDiagnostics: [],
  };
}
