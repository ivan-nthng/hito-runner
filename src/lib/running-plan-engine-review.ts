import type { AdditionalPlanPersistenceMetadata } from "@/lib/plan-authoring-snapshot";
import {
  isAiGeneratedRunningPlanPreviewDraft,
  type AiGeneratedRunningPlanPreviewDraft,
} from "@/lib/ai-generated-running-plan";
import {
  collectSelectedDistanceEndpointIssues,
  selectedDistanceEndpointMainDistanceMeters,
  type RunningPlanPreviewCalendarRow,
} from "@/lib/plan-creation-engine";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import { trainingPlanV2Schema } from "@/lib/imported-plan";
import {
  base64UrlDecodeUtf8,
  base64UrlEncodeUtf8,
  digestSha256Hex,
  safeTokenEqual,
  signStableJsonPayload,
  stableJsonEqual,
  stableJsonStringify,
} from "@/lib/review-token-signing";
import type { Json } from "@/lib/supabase/database";
import { serverEnv } from "@/lib/supabase/env";

export const RUNNING_PLAN_REVIEW_CONTRACT_VERSION = "running_plan_review_v1" as const;
export const RUNNING_PLAN_CONFIRMED_SOURCE_STATUS = "confirmed_selected_plan" as const;
const SELF_CONTAINED_RUNNING_PLAN_REVIEW_TOKEN_PREFIX = "running-plan-review-v1";

type SelfContainedRunningPlanReviewEnvelope = {
  draft: AiGeneratedRunningPlanPreviewDraft;
  canonicalPlan: TrainingPlanV2;
  reviewPayload: ReturnType<typeof buildRunningPlanReviewPayload>;
  reviewChecksum: string;
};

export type RunningPlanPreviewDraft = AiGeneratedRunningPlanPreviewDraft;

export type RunningPlanReviewProof = {
  reviewToken: string;
  reviewChecksum: string;
  reviewContractVersion: typeof RUNNING_PLAN_REVIEW_CONTRACT_VERSION;
  canonicalRowCount: number;
  canonicalNonRestRowCount: number;
};

export type RunningPlanReviewedPreviewDraft<TDraft extends RunningPlanPreviewDraft> = TDraft &
  RunningPlanReviewProof;

export async function addRunningPlanReviewProof<TDraft extends RunningPlanPreviewDraft>(
  draft: TDraft,
): Promise<RunningPlanReviewedPreviewDraft<TDraft>> {
  const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
  const reviewPayload = buildRunningPlanReviewPayload(draft, canonicalPlan);
  const reviewChecksum = await digestSha256Hex(stableJsonStringify(reviewPayload));
  const reviewToken = await signSelfContainedRunningPlanReviewToken({
    draft,
    canonicalPlan,
    reviewPayload,
    reviewChecksum,
  });

  return {
    ...draft,
    reviewToken,
    reviewChecksum,
    reviewContractVersion: RUNNING_PLAN_REVIEW_CONTRACT_VERSION,
    canonicalRowCount: canonicalPlan.planned_workouts.length,
    canonicalNonRestRowCount: canonicalPlan.planned_workouts.filter(
      (workout) => workout.workout_type !== "rest",
    ).length,
  };
}

export async function validateRunningPlanReviewExactness(input: {
  draft: RunningPlanPreviewDraft;
  reviewToken: string;
  reviewChecksum: string;
}): Promise<
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      reviewPayload: ReturnType<typeof buildRunningPlanReviewPayload>;
      reviewChecksum: string;
    }
  | {
      ok: false;
      reason: "invalid_review" | "stale_review";
      message: string;
    }
> {
  const selfContainedReview = await validateSelfContainedRunningPlanReviewToken({
    reviewToken: input.reviewToken,
    reviewChecksum: input.reviewChecksum,
  });

  if (!selfContainedReview.ok) {
    return selfContainedReview;
  }

  return validateRunningPlanReviewExactnessAgainstVerifiedToken({
    draft: input.draft,
    reviewChecksum: input.reviewChecksum,
    selfContainedReview,
  });
}

export async function validateSelfContainedRunningPlanReviewExactness(input: {
  reviewToken: string;
  reviewChecksum: string;
}) {
  const selfContainedReview = await validateSelfContainedRunningPlanReviewToken(input);

  if (!selfContainedReview.ok) {
    return selfContainedReview;
  }

  const exactness = await validateRunningPlanReviewExactnessAgainstVerifiedToken({
    draft: selfContainedReview.draft,
    reviewChecksum: input.reviewChecksum,
    selfContainedReview,
  });

  return exactness.ok
    ? {
        ...exactness,
        draft: selfContainedReview.draft,
      }
    : exactness;
}

async function validateRunningPlanReviewExactnessAgainstVerifiedToken(input: {
  draft: RunningPlanPreviewDraft;
  reviewChecksum: string;
  selfContainedReview: {
    draft: AiGeneratedRunningPlanPreviewDraft;
    canonicalPlan: TrainingPlanV2;
    reviewPayload: ReturnType<typeof buildRunningPlanReviewPayload>;
  };
}): Promise<
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      reviewPayload: ReturnType<typeof buildRunningPlanReviewPayload>;
      reviewChecksum: string;
    }
  | {
      ok: false;
      reason: "invalid_review" | "stale_review";
      message: string;
    }
> {
  const { draft, reviewChecksum, selfContainedReview } = input;

  if (
    !sameJson(
      stripRunningPlanReviewProof(selfContainedReview.draft),
      stripRunningPlanReviewProof(draft),
    )
  ) {
    return {
      ok: false,
      reason: "stale_review",
      message:
        "This AI-authored generated-plan review no longer matches the reviewed preview. Refresh before creating a plan.",
    };
  }

  const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
  const distanceMeters =
    draft.normalizedInputSummary.planGoalIntent.distance?.distanceMeters ?? null;
  if (distanceMeters == null) {
    return {
      ok: false,
      reason: "invalid_review",
      message:
        "This selected-plan review no longer contains the reviewed distance goal. Refresh the preview before creating a plan.",
    };
  }
  const endpointIssues = collectDistanceGoalEndpointExactnessIssues(draft, canonicalPlan);
  if (endpointIssues.length > 0) {
    return {
      ok: false,
      reason: "invalid_review",
      message:
        "This selected-plan review no longer satisfies Hito's selected-distance endpoint contract. Refresh the preview before creating a plan.",
    };
  }

  const reviewPayload = buildRunningPlanReviewPayload(draft, canonicalPlan);
  const expectedChecksum = await digestSha256Hex(stableJsonStringify(reviewPayload));

  if (reviewChecksum !== expectedChecksum) {
    return {
      ok: false,
      reason: "stale_review",
      message:
        "This selected-plan review no longer matches the setup answers. Refresh the preview before creating a plan.",
    };
  }

  if (
    !sameJson(selfContainedReview.canonicalPlan, canonicalPlan) ||
    !sameJson(selfContainedReview.reviewPayload, reviewPayload)
  ) {
    return {
      ok: false,
      reason: "stale_review",
      message:
        "This AI-authored generated-plan review no longer matches the canonical plan. Refresh before creating a plan.",
    };
  }

  return {
    ok: true,
    canonicalPlan,
    reviewPayload,
    reviewChecksum: expectedChecksum,
  };
}

export function buildRunningPlanCanonicalPlan(draft: RunningPlanPreviewDraft): TrainingPlanV2 {
  return trainingPlanV2Schema.parse(draft.canonicalPlan);
}

export function buildRunningPlanPersistenceMetadata(input: {
  draft: RunningPlanPreviewDraft;
  canonicalPlan: TrainingPlanV2;
  reviewChecksum: string;
}): AdditionalPlanPersistenceMetadata {
  const { draft, canonicalPlan, reviewChecksum } = input;
  const nonRestRows = draft.calendarRows.filter((row) => !row.isRestDay);
  const metricPolicy = summarizeMetricPolicy(canonicalPlan);
  const planGoalIntent = draft.normalizedInputSummary.planGoalIntent;

  return {
    goalMetadata: toJson({
      source_status: RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
      selected_plan_engine: {
        review_contract_version: RUNNING_PLAN_REVIEW_CONTRACT_VERSION,
        review_checksum: reviewChecksum,
        source_kind: draft.sourceKind,
        source_status: RUNNING_PLAN_CONFIRMED_SOURCE_STATUS,
        preview_source_status: draft.sourceStatus,
        goal_model: "distance_goal",
        distance_goal: buildDistanceGoalMetadata(planGoalIntent),
        runner_level: draft.normalizedInputSummary.runnerLevel,
        start_date: canonicalPlan.start_date,
        end_date: canonicalPlan.planned_workouts.at(-1)?.date ?? canonicalPlan.start_date,
        row_count: canonicalPlan.planned_workouts.length,
        non_rest_row_count: nonRestRows.length,
        endpoint_proof: draft.endpointProof,
        plan_goal_intent: planGoalIntent,
        ai_generation: summarizeAiGenerationForPersistence(draft),
        metric_policy: metricPolicy,
      },
    }),
    planPreferences: toJson({
      running_plan_engine_review: {
        review_contract_version: RUNNING_PLAN_REVIEW_CONTRACT_VERSION,
        review_checksum: reviewChecksum,
        normalized_input: buildDistanceFirstNormalizedInputMetadata(draft),
        plan_goal_intent: planGoalIntent,
        validation: draft.validation,
      },
    }),
  };
}

function buildDistanceGoalMetadata(
  planGoalIntent: RunningPlanPreviewDraft["normalizedInputSummary"]["planGoalIntent"],
) {
  const distance = planGoalIntent.distance;

  return {
    ...(distance
      ? {
          kind: distance.kind,
          label: distance.label,
          distance_km: distance.distanceKm,
          distance_meters: distance.distanceMeters,
          preset: distance.preset,
          source: distance.source,
        }
      : {}),
    target_date: planGoalIntent.targetDate,
    target_finish_time: planGoalIntent.targetFinishTime?.label ?? null,
    target_outcome_pace: planGoalIntent.targetOutcomePace?.label ?? null,
    outcome_pace_source: planGoalIntent.targetOutcomePace?.source ?? null,
  };
}

function buildDistanceFirstNormalizedInputMetadata(draft: RunningPlanPreviewDraft) {
  const normalizedInput = draft.normalizedInputSummary;
  const intent = normalizedInput.planGoalIntent;

  return {
    normalizedBy: normalizedInput.normalizedBy,
    age: normalizedInput.age,
    heightCm: normalizedInput.heightCm,
    weightKg: normalizedInput.weightKg,
    runnerLevel: normalizedInput.runnerLevel,
    daysPerWeek: normalizedInput.daysPerWeek,
    fixedRestDays: normalizedInput.fixedRestDays,
    preferredLongRunDay: normalizedInput.preferredLongRunDay,
    longRunDaySource: normalizedInput.longRunDaySource,
    trainingWeekdays: normalizedInput.trainingWeekdays,
    startDate: normalizedInput.startDate,
    benchmarkPaceTruth: normalizedInput.benchmarkPaceTruth,
    runnerProfileSnapshot: normalizedInput.runnerProfileSnapshot,
    distanceGoal: buildDistanceGoalMetadata(intent),
    planGoalIntent: intent,
  };
}

function buildRunningPlanReviewPayload(
  draft: RunningPlanPreviewDraft,
  canonicalPlan: TrainingPlanV2,
) {
  return {
    contractVersion: RUNNING_PLAN_REVIEW_CONTRACT_VERSION,
    sourceKind: draft.sourceKind,
    sourceStatus: draft.sourceStatus,
    normalizedInputSummary: draft.normalizedInputSummary,
    endpointProof: draft.endpointProof,
    validation: draft.validation,
    workoutDocuments: draft.workoutDocuments,
    canonicalPlan: canonicalPlanStablePayload(canonicalPlan),
  };
}

function summarizeAiGenerationForPersistence(draft: RunningPlanPreviewDraft) {
  const trace = draft.aiGeneration.generationTrace;

  return {
    generation_id: trace?.generationId ?? null,
    response_id: draft.aiGeneration.responseId ?? trace?.provider.responseId ?? null,
    model: draft.aiGeneration.model,
    provider_kind: trace?.provider.kind ?? null,
    paid_provider_call: trace?.provider.paidProviderCall ?? null,
    final_outcome: trace?.pipeline.finalOutcome ?? null,
    parse_status: trace?.pipeline.parseStatus ?? null,
    normalization_status: trace?.pipeline.normalizationStatus ?? null,
    input_tokens: draft.aiGeneration.debug.inputTokens ?? trace?.usage.inputTokens ?? null,
    output_tokens: draft.aiGeneration.debug.outputTokens ?? trace?.usage.outputTokens ?? null,
    total_tokens: draft.aiGeneration.debug.totalTokens ?? trace?.usage.totalTokens ?? null,
    prompt_hash: trace?.request.promptHash ?? null,
    raw_output_hash: trace?.output.rawOutputHash ?? null,
    sanitized_summary_hash: trace?.output.sanitizedSummaryHash ?? null,
    artifact_path: trace?.artifacts.path ?? null,
  };
}

async function signSelfContainedRunningPlanReviewToken(
  envelope: SelfContainedRunningPlanReviewEnvelope,
) {
  const encodedEnvelope = base64UrlEncodeUtf8(stableJsonStringify(envelope));
  const signature = await signRunningPlanReviewPayload(envelope);

  return `${SELF_CONTAINED_RUNNING_PLAN_REVIEW_TOKEN_PREFIX}.${encodedEnvelope}.${signature}`;
}

export async function validateSelfContainedRunningPlanReviewToken(input: {
  reviewToken: string;
  reviewChecksum: string;
}): Promise<
  | {
      ok: true;
      draft: AiGeneratedRunningPlanPreviewDraft;
      canonicalPlan: TrainingPlanV2;
      reviewPayload: ReturnType<typeof buildRunningPlanReviewPayload>;
      reviewChecksum: string;
    }
  | {
      ok: false;
      reason: "invalid_review" | "stale_review";
      message: string;
    }
> {
  const parsed = parseSelfContainedRunningPlanReviewToken(input.reviewToken);

  if (!parsed.ok) {
    return {
      ok: false,
      reason: "invalid_review",
      message: parsed.message,
    };
  }

  const expectedSignature = await signRunningPlanReviewPayload(parsed.envelope);
  if (!safeTokenEqual(parsed.signature, expectedSignature)) {
    return {
      ok: false,
      reason: "invalid_review",
      message:
        "This AI-authored generated-plan review token is invalid. Refresh the preview before creating a plan.",
    };
  }

  if (parsed.envelope.reviewChecksum !== input.reviewChecksum) {
    return {
      ok: false,
      reason: "stale_review",
      message:
        "This AI-authored generated-plan review checksum no longer matches the reviewed preview. Refresh before creating a plan.",
    };
  }

  const canonicalPlan = trainingPlanV2Schema.parse(parsed.envelope.canonicalPlan);
  const reviewPayload = buildRunningPlanReviewPayload(parsed.envelope.draft, canonicalPlan);
  const expectedChecksum = await digestSha256Hex(stableJsonStringify(reviewPayload));

  if (expectedChecksum !== input.reviewChecksum) {
    return {
      ok: false,
      reason: "stale_review",
      message:
        "This AI-authored generated-plan review no longer matches the canonical plan. Refresh before creating a plan.",
    };
  }

  return {
    ok: true,
    draft: parsed.envelope.draft,
    canonicalPlan,
    reviewPayload,
    reviewChecksum: expectedChecksum,
  };
}

function parseSelfContainedRunningPlanReviewToken(token: string):
  | {
      ok: true;
      envelope: SelfContainedRunningPlanReviewEnvelope;
      signature: string;
    }
  | {
      ok: false;
      message: string;
    } {
  const [prefix, encodedEnvelope, signature, ...extra] = token.split(".");

  if (
    prefix !== SELF_CONTAINED_RUNNING_PLAN_REVIEW_TOKEN_PREFIX ||
    !encodedEnvelope ||
    !signature ||
    extra.length > 0
  ) {
    return {
      ok: false,
      message:
        "This AI-authored generated-plan review token is malformed. Refresh the preview before creating a plan.",
    };
  }

  try {
    const envelope = JSON.parse(
      base64UrlDecodeUtf8(encodedEnvelope),
    ) as SelfContainedRunningPlanReviewEnvelope;

    if (!isAiGeneratedRunningPlanPreviewDraft(envelope.draft)) {
      return {
        ok: false,
        message:
          "This AI-authored generated-plan review token is missing its reviewed draft. Refresh the preview before creating a plan.",
      };
    }

    if (typeof envelope.reviewChecksum !== "string" || envelope.reviewChecksum.length !== 64) {
      return {
        ok: false,
        message:
          "This AI-authored generated-plan review token is missing its checksum. Refresh the preview before creating a plan.",
      };
    }

    trainingPlanV2Schema.parse(envelope.canonicalPlan);

    return {
      ok: true,
      envelope,
      signature,
    };
  } catch {
    return {
      ok: false,
      message:
        "This AI-authored generated-plan review token could not be decoded. Refresh the preview before creating a plan.",
    };
  }
}

function canonicalPlanStablePayload(plan: TrainingPlanV2) {
  const { created_at: _createdAt, ...stablePlan } = plan;

  return stablePlan;
}

function stripRunningPlanReviewProof(draft: RunningPlanPreviewDraft): RunningPlanPreviewDraft {
  const {
    canonicalNonRestRowCount: _canonicalNonRestRowCount,
    canonicalRowCount: _canonicalRowCount,
    reviewChecksum: _reviewChecksum,
    reviewContractVersion: _reviewContractVersion,
    reviewToken: _reviewToken,
    ...unreviewedDraft
  } = draft as RunningPlanPreviewDraft & Partial<RunningPlanReviewProof>;

  return {
    ...unreviewedDraft,
    aiGeneration: {
      ...unreviewedDraft.aiGeneration,
      generationTrace: null,
    },
  };
}

function summarizeMetricPolicy(canonicalPlan: TrainingPlanV2) {
  const metricModes = canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest")
    .map((workout) => workout.metric_mode)
    .filter((mode): mode is NonNullable<typeof mode> => mode != null);
  const paceTargetsAllowed = metricModes.some((mode) => mode.pace_targets_allowed === true);
  const heartRateTargetsAllowed = metricModes.some((mode) => mode.hr_targets_allowed === true);

  return {
    executableMode:
      paceTargetsAllowed && heartRateTargetsAllowed
        ? "mixed_metric_executable"
        : paceTargetsAllowed
          ? "pace_executable"
          : heartRateTargetsAllowed
            ? "hr_executable"
            : "structure_only_executable",
    paceTargetsAllowed,
    heartRateTargetsAllowed,
    defaultHrGuidanceRows: metricModes.filter(
      (mode) => mode.hr_target_source === "default_estimated_hr",
    ).length,
  };
}

function collectDistanceGoalEndpointExactnessIssues(
  draft: RunningPlanPreviewDraft,
  canonicalPlan: TrainingPlanV2,
) {
  const distanceMeters =
    draft.normalizedInputSummary.planGoalIntent.distance?.distanceMeters ?? null;

  return collectSelectedDistanceEndpointIssues({
    rows: canonicalPlan.planned_workouts.map((workout) => ({
      id: workout.workout_id,
      date: workout.date,
      isRest: workout.workout_type === "rest",
      endpointKind: workout.source_workout_type,
      endpointIdentity: workout.workout_identity,
      endpointDistanceMeters: selectedDistanceEndpointMainDistanceMeters({
        endpointKind: workout.source_workout_type,
        segments: workout.segments,
      }),
    })),
    expectedDistanceMeters: distanceMeters,
    targetDate: canonicalPlan.target_date ?? null,
    proof: draft.endpointProof,
  }).map((issue) => issue.code);
}

async function signRunningPlanReviewPayload(payload: unknown) {
  return signStableJsonPayload(payload, serverEnv.supabaseServiceRoleKey);
}

function sameJson(left: unknown, right: unknown) {
  return stableJsonEqual(left, right);
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
