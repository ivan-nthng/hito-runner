import type { AdditionalPlanPersistenceMetadata } from "@/lib/plan-authoring-snapshot";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  isAiGeneratedRunningPlanPreviewDraft,
  type AiGeneratedRunningPlanPreviewDraft,
} from "@/lib/ai-generated-running-plan";
import {
  DEFAULT_ESTIMATED_HR_SOURCE_NOTE,
  buildDefaultEstimatedHrBandReadback,
  type DefaultEstimatedHrBandKey,
} from "@/lib/heart-rate-zones";
import {
  buildSelectedPlanSegmentPaceTarget,
  selectedPlanSegmentsContainPaceTargets,
} from "@/lib/plan-creation-engine/benchmark-pace-truth";
import {
  collectTenKBeginnerDosePolicyIssues,
  resolveTenKBeginnerDosePolicyRunnerLevel,
} from "@/lib/plan-creation-engine/ten-k-beginner-dose-policy";
import {
  RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
  isRunningPlanCompositionDevelopmentTouch,
  resolveRunningPlanCompositionWeek,
  collectRunnerFacingCanonicalRichnessIssues,
  collectRunningPlanCanonicalPrescriptionGrammarIssues,
  summarizeRunnerFacingCanonicalRichness,
  summarizeRunningPlanCanonicalPrescriptionGrammar,
  type HalfMarathonPlanPreviewDraft,
  type MarathonBasePlanPreviewDraft,
  type MarathonCompletionPlanPreviewDraft,
  type RunningPlanPreviewCalendarRow,
  type RunningPlanRepeatChildPrescription,
  type RunningPlanRepeatChildUnitPrescription,
  type RunningPlanSegmentPrescription,
  type RunningPlanWatchExecutableSegmentTemplate,
  type TenKPlanPreviewDraft,
} from "@/lib/plan-creation-engine";
import type { RunningPlanDistanceFamily } from "@/lib/plan-creation-engine";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import { plannedWorkoutRepeatChildLabel } from "@/lib/planned-workout-block-contract";
import { trainingPlanV2Schema } from "@/lib/imported-plan";
import type {
  CalendarIconKey,
  CanonicalMetricModeJson,
  CanonicalWorkoutFamily,
  CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
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
  payload: ReturnType<typeof buildRunningPlanReviewPayload>;
  reviewChecksum: string;
};

export type RunningPlanPreviewDraft =
  | TenKPlanPreviewDraft
  | HalfMarathonPlanPreviewDraft
  | MarathonBasePlanPreviewDraft
  | MarathonCompletionPlanPreviewDraft
  | AiGeneratedRunningPlanPreviewDraft;

export type RunningPlanReviewProof = {
  reviewToken: string;
  reviewChecksum: string;
  reviewContractVersion: typeof RUNNING_PLAN_REVIEW_CONTRACT_VERSION;
  canonicalRowCount: number;
  canonicalNonRestRowCount: number;
};

export type RunningPlanReviewedPreviewDraft<TDraft extends RunningPlanPreviewDraft> = TDraft &
  RunningPlanReviewProof;

type RunningPlanWorkoutMapping = {
  workoutType: TrainingPlanV2["planned_workouts"][number]["workout_type"];
  workoutFamily: CanonicalWorkoutFamily;
  workoutIdentity: CanonicalWorkoutIdentity;
  calendarIconKey: CalendarIconKey;
};

export async function addRunningPlanReviewProof<TDraft extends RunningPlanPreviewDraft>(
  draft: TDraft,
): Promise<RunningPlanReviewedPreviewDraft<TDraft>> {
  const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
  const reviewPayload = buildRunningPlanReviewPayload(draft, canonicalPlan);
  const reviewChecksum = await digestSha256Hex(stableJsonStringify(reviewPayload));
  const reviewToken = isAiGeneratedRunningPlanPreviewDraft(draft)
    ? await signSelfContainedRunningPlanReviewToken({
        draft,
        canonicalPlan,
        reviewPayload,
        reviewChecksum,
      })
    : await signRunningPlanReviewPayload(reviewPayload);

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
  const selfContainedReview = isAiGeneratedRunningPlanPreviewDraft(input.draft)
    ? await validateSelfContainedRunningPlanReviewToken({
        reviewToken: input.reviewToken,
        reviewChecksum: input.reviewChecksum,
      })
    : null;

  if (selfContainedReview && !selfContainedReview.ok) {
    return selfContainedReview;
  }

  if (isAiGeneratedRunningPlanPreviewDraft(input.draft)) {
    if (!selfContainedReview || !selfContainedReview.ok) {
      return {
        ok: false,
        reason: "invalid_review",
        message:
          "This AI-authored generated-plan review token is invalid. Refresh the preview before creating a plan.",
      };
    }

    if (
      !sameJson(
        stripRunningPlanReviewProof(selfContainedReview.draft),
        stripRunningPlanReviewProof(input.draft),
      )
    ) {
      return {
        ok: false,
        reason: "stale_review",
        message:
          "This AI-authored generated-plan review no longer matches the reviewed preview. Refresh before creating a plan.",
      };
    }
  }

  const canonicalPlan = buildRunningPlanCanonicalPlan(input.draft);
  const richnessIssues = collectRunnerFacingCanonicalRichnessIssues({
    family: input.draft.planFamily,
    runnerLevel: resolveRunnerLevelForCanonicalQualityGates(input.draft),
    loadContext: input.draft.normalizedInputSummary.loadContext,
    rows: canonicalPlan.planned_workouts,
  });

  if (richnessIssues.length > 0) {
    return {
      ok: false,
      reason: "invalid_review",
      message:
        "This selected-plan review no longer satisfies Hito's runner-facing richness gates. Refresh the preview before creating a plan.",
    };
  }

  const prescriptionGrammarIssues = collectRunningPlanCanonicalPrescriptionGrammarIssues(
    canonicalPlan.planned_workouts,
  );
  if (prescriptionGrammarIssues.length > 0) {
    return {
      ok: false,
      reason: "invalid_review",
      message:
        "This selected-plan review no longer satisfies Hito's executable workout prescription grammar. Refresh the preview before creating a plan.",
    };
  }

  const beginnerDoseIssues = collectTenKBeginnerDosePolicyIssues({
    runnerLevel: input.draft.normalizedInputSummary.runnerLevel,
    benchmarkPaceTruth: input.draft.normalizedInputSummary.benchmarkPaceTruth,
    rows: canonicalPlan.planned_workouts.map(canonicalWorkoutToTenKDoseValidationRow),
  });
  if (beginnerDoseIssues.length > 0) {
    return {
      ok: false,
      reason: "invalid_review",
      message:
        "This selected-plan review no longer satisfies Hito's beginner 10K dose policy. Refresh the preview before creating a plan.",
    };
  }

  const reviewPayload = buildRunningPlanReviewPayload(input.draft, canonicalPlan);
  const expectedChecksum = await digestSha256Hex(stableJsonStringify(reviewPayload));

  if (input.reviewChecksum !== expectedChecksum) {
    return {
      ok: false,
      reason: "stale_review",
      message:
        "This selected-plan review no longer matches the setup answers. Refresh the preview before creating a plan.",
    };
  }

  if (selfContainedReview && selfContainedReview.ok) {
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

  const expectedToken = await signRunningPlanReviewPayload(reviewPayload);
  if (!safeTokenEqual(input.reviewToken, expectedToken)) {
    return {
      ok: false,
      reason: "invalid_review",
      message:
        "This selected-plan review token is invalid. Refresh the preview before creating a plan.",
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
  if (isAiGeneratedRunningPlanPreviewDraft(draft)) {
    return trainingPlanV2Schema.parse(draft.canonicalPlan);
  }

  const normalizedInput = draft.normalizedInputSummary;
  const endDate = draft.calendarRows.at(-1)?.date ?? normalizedInput.startDate;
  const endpointDate = draft.endpointProof.finalDate;
  const selectedDistanceTargetDate =
    draft.planFamily === "Marathon Base" ? undefined : endpointDate;
  const planName = runningPlanName(draft.planFamily);
  const goalType = runningPlanGoalType(draft.planFamily);
  const goalLabel = runningPlanGoalLabel(draft.planFamily);

  return trainingPlanV2Schema.parse({
    schema_version: "training-plan-v2",
    plan_name: planName,
    source_kind: draft.sourceKind,
    generated_for: "Hito selected-plan runner",
    goal: {
      goal_type: goalType,
      goal_label: goalLabel,
      ...(selectedDistanceTargetDate
        ? {
            target_event: {
              label: `${draft.planFamily} endpoint`,
              date: selectedDistanceTargetDate,
            },
          }
        : {}),
    },
    runner_profile: {
      experience_level: normalizedInput.runnerLevel,
      baseline_sessions_per_week: normalizedInput.daysPerWeek,
      age: normalizedInput.age,
      height_cm: normalizedInput.heightCm,
      weight_kg: normalizedInput.weightKg,
      primary_goal: goalLabel,
      risk_policy:
        "Backend-selected running-plan preview. Exact watch-executable structure; no fake pace or unverified HR-zone truth.",
      preferred_effort_language: "Use exact structure first; keep effort cues secondary.",
    },
    start_date: normalizedInput.startDate,
    preparation_horizon_weeks: maxWeekNumber(draft.calendarRows),
    ...(selectedDistanceTargetDate ? { target_date: selectedDistanceTargetDate } : {}),
    plan_preferences: {
      preferred_running_days: [...normalizedInput.trainingWeekdays],
      blocked_days: [...normalizedInput.fixedRestDays],
      max_running_days_per_week: normalizedInput.daysPerWeek,
      preferred_long_run_day: normalizedInput.preferredLongRunDay,
      no_double_days: true,
      allow_back_to_back_days: false,
      preferred_workout_mix: `${draft.planFamily} selected-plan engine v1`,
      notes: `Selected-plan preview confirmed through ${RUNNING_PLAN_REVIEW_CONTRACT_VERSION}; end date ${endDate}.`,
    },
    training_constraints: {
      running_days_per_week: normalizedInput.daysPerWeek,
      full_rest_days: [...normalizedInput.fixedRestDays],
      long_run_day: normalizedInput.preferredLongRunDay,
      intensity_distribution: "Backend-selected one-development-touch maximum where supported.",
      progression_policy:
        draft.planFamily === "Marathon Base"
          ? "Base-building endpoint; no marathon race-readiness or target-time claim."
          : "Selected-distance endpoint with exact numeric structure and no target-time pace claim.",
    },
    planned_workouts: draft.calendarRows.map((row, index) =>
      buildCanonicalWorkout({ row, draft, displayIndex: index }),
    ),
  } satisfies TrainingPlanV2);
}

export function buildRunningPlanProfilePatch(draft: RunningPlanPreviewDraft): {
  age: number;
  weightKg: number;
  heightCm: number;
  baselineNotes: string | null;
  trainingPreferences: Json;
} {
  const input = draft.normalizedInputSummary;

  return {
    age: input.age,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    baselineNotes: null,
    trainingPreferences: toJson({
      blocked_days: [...input.fixedRestDays],
      max_running_days_per_week: input.daysPerWeek,
      preferred_long_run_day: input.preferredLongRunDay,
    }),
  };
}

export function buildRunningPlanPersistenceMetadata(input: {
  draft: RunningPlanPreviewDraft;
  canonicalPlan: TrainingPlanV2;
  reviewChecksum: string;
}): AdditionalPlanPersistenceMetadata {
  const { draft, canonicalPlan, reviewChecksum } = input;
  const nonRestRows = draft.calendarRows.filter((row) => !row.isRestDay);
  const compositionGrammar = summarizeRunningPlanCompositionGrammar(draft);
  const runnerFacingRichness = summarizeRunnerFacingCanonicalRichness({
    family: draft.planFamily,
    runnerLevel: resolveRunnerLevelForCanonicalQualityGates(draft),
    loadContext: draft.normalizedInputSummary.loadContext,
    rows: canonicalPlan.planned_workouts,
  });
  const prescriptionGrammar = summarizeRunningPlanCanonicalPrescriptionGrammar(
    canonicalPlan.planned_workouts,
  );
  const metricPolicy = summarizeMetricPolicy(draft.calendarRows);
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
        family: draft.planFamily,
        runner_level: draft.normalizedInputSummary.runnerLevel,
        load_context: draft.normalizedInputSummary.loadContext,
        start_date: canonicalPlan.start_date,
        end_date: canonicalPlan.planned_workouts.at(-1)?.date ?? canonicalPlan.start_date,
        row_count: canonicalPlan.planned_workouts.length,
        non_rest_row_count: nonRestRows.length,
        endpoint_proof: draft.endpointProof,
        plan_goal_intent: planGoalIntent,
        ai_generation: summarizeAiGenerationForPersistence(draft),
        runner_facing_richness: runnerFacingRichness,
        prescription_grammar: prescriptionGrammar,
        metric_policy: metricPolicy,
      },
    }),
    planPreferences: toJson({
      running_plan_engine_review: {
        review_contract_version: RUNNING_PLAN_REVIEW_CONTRACT_VERSION,
        review_checksum: reviewChecksum,
        normalized_input: draft.normalizedInputSummary,
        plan_goal_intent: planGoalIntent,
        validation: draft.validation,
        composition_grammar: compositionGrammar,
      },
    }),
  };
}

export function runningPlanSourceKindMatchesFamily(input: {
  family: RunningPlanDistanceFamily;
  sourceKind: string;
}) {
  if (input.sourceKind === AI_GENERATED_RUNNING_PLAN_SOURCE_KIND) {
    return true;
  }

  return input.sourceKind === runningPlanSourceKindForFamily(input.family);
}

export function runningPlanSourceKindForFamily(family: RunningPlanDistanceFamily) {
  switch (family) {
    case "10K":
      return "running_plan_engine_10k_builder_v1";
    case "Half Marathon":
      return "running_plan_engine_half_marathon_builder_v1";
    case "Marathon Base":
      return "running_plan_engine_marathon_base_builder_v1";
    case "Marathon Completion":
      return "running_plan_engine_marathon_completion_builder_v1";
  }
}

function buildRunningPlanReviewPayload(
  draft: RunningPlanPreviewDraft,
  canonicalPlan: TrainingPlanV2,
) {
  return {
    contractVersion: RUNNING_PLAN_REVIEW_CONTRACT_VERSION,
    sourceKind: draft.sourceKind,
    sourceStatus: draft.sourceStatus,
    planFamily: draft.planFamily,
    normalizedInputSummary: draft.normalizedInputSummary,
    endpointProof: draft.endpointProof,
    validation: draft.validation,
    canonicalPlan: canonicalPlanStablePayload(canonicalPlan),
  };
}

function summarizeAiGenerationForPersistence(draft: RunningPlanPreviewDraft) {
  if (!isAiGeneratedRunningPlanPreviewDraft(draft)) {
    return null;
  }

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

  if (isAiGeneratedRunningPlanPreviewDraft(unreviewedDraft)) {
    return {
      ...unreviewedDraft,
      aiGeneration: {
        ...unreviewedDraft.aiGeneration,
        generationTrace: null,
      },
    };
  }

  return unreviewedDraft as RunningPlanPreviewDraft;
}

function buildCanonicalWorkout({
  displayIndex,
  draft,
  row,
}: {
  row: RunningPlanPreviewCalendarRow;
  draft: RunningPlanPreviewDraft;
  displayIndex: number;
}): TrainingPlanV2["planned_workouts"][number] {
  const mapping = resolveWorkoutMapping(row, draft.planFamily);
  const segments = row.isRestDay
    ? [buildRestSegment(row)]
    : row.segments.map((segment) => buildCanonicalSegment({ draft, row, segment }));
  const metricMode = buildMetricMode({ row, segments });
  const planGoalIntent = draft.normalizedInputSummary.planGoalIntent;

  return {
    workout_id: row.rowId,
    date: row.date,
    weekday: row.weekday,
    week_number: row.weekNumber,
    phase: resolveRunningPlanPhase(row.weekNumber, maxWeekNumber(draft.calendarRows)),
    segments,
    workout_type: mapping.workoutType,
    source_workout_type: row.workoutDayKind,
    workout_family: mapping.workoutFamily,
    workout_identity: mapping.workoutIdentity,
    calendar_icon_key: mapping.calendarIconKey,
    goal_context: {
      goal_type: runningPlanGoalType(draft.planFamily),
      goal_style: "balanced",
      terrain_focus: "standard",
      target_date:
        planGoalIntent.targetDate ??
        (draft.planFamily === "Marathon Base" ? null : draft.endpointProof.finalDate),
      target_time: planGoalIntent.targetFinishTime?.label ?? null,
    },
    metric_mode: metricMode,
    title: row.title,
    summary: buildWorkoutSummary(row, draft.planFamily, displayIndex),
  };
}

function buildRestSegment(
  row: RunningPlanPreviewCalendarRow,
): TrainingPlanV2["planned_workouts"][number]["segments"][number] {
  return {
    segment_id: `${row.rowId}-rest`,
    segment_type: "rest",
    label: "Rest",
    sequence: 1,
    guidance: "Protected rest day.",
    prescription: {
      mode: "none",
    },
    target: {
      cue: "Rest and recover.",
    },
  };
}

function buildCanonicalSegment({
  draft,
  row,
  segment,
}: {
  draft: RunningPlanPreviewDraft;
  row: RunningPlanPreviewCalendarRow;
  segment: RunningPlanWatchExecutableSegmentTemplate;
}): TrainingPlanV2["planned_workouts"][number]["segments"][number] {
  if (row.workoutDayKind === "rest") {
    throw new Error("Rest rows cannot be converted into running-plan workout segments.");
  }

  const prescription = buildCanonicalPrescription(segment.primaryPrescription);
  const paceTarget = buildSelectedPlanSegmentPaceTarget({
    workoutDayKind: row.workoutDayKind,
    segment,
    benchmarkPaceTruth: draft.normalizedInputSummary.benchmarkPaceTruth,
  });
  const segmentTarget = buildSegmentTarget({
    row,
    segment,
    prescription: segment.primaryPrescription,
    targetTruthMode: segment.targetTruthMode,
    paceTarget,
    runnerAge: draft.normalizedInputSummary.age,
  });
  const canonicalPrescription =
    prescription.mode === "repeats" && prescription.children?.length
      ? {
          ...prescription,
          children: prescription.children.map((child) => ({
            ...child,
            target:
              child.role === "recover" || child.role === "walk"
                ? {
                    intensity: "easy recovery",
                    rpe: 2,
                    cue: "Recover easily enough that the next repeat stays smooth.",
                  }
                : segmentTarget,
          })),
        }
      : prescription;

  return {
    segment_id: segment.id,
    segment_type: resolveSegmentType(segment),
    label: formatSegmentLabel(segment),
    sequence: segment.order,
    guidance: segment.secondaryCue,
    prescription: canonicalPrescription,
    ...(canonicalPrescription.mode === "repeats" ? {} : { target: segmentTarget }),
  };
}

function buildCanonicalPrescription(
  prescription: RunningPlanSegmentPrescription,
): NonNullable<TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"]> {
  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return {
        mode: "time",
        duration_min: secondsRangeToMinutes(prescription.durationSeconds),
      };
    case "distance":
    case "distance_with_default_hr_cap":
      return {
        mode: "distance",
        distance_km: metersRangeToKm(prescription.distanceMeters),
      };
    case "recovery_time":
      return {
        mode: "time",
        duration_min: secondsRangeToMinutes(prescription.recoveryDurationSeconds),
      };
    case "recovery_distance":
      return {
        mode: "distance",
        distance_km: metersRangeToKm(prescription.recoveryDistanceMeters),
      };
    case "repeat":
      return {
        mode: "repeats",
        repeat_count: exactRangeNumber(prescription.repeatCount),
        children: prescription.children.map((child, index) => ({
          role: child.role,
          label: child.label ?? plannedWorkoutRepeatChildLabel(child.role),
          sequence: index + 1,
          ...(child.guidance ? { guidance: child.guidance } : {}),
          prescription: buildRepeatChildUnitPrescription(child.prescription),
        })),
      };
    case "free_run_with_cap":
      return {
        mode: "time",
        duration_min: secondsRangeToMinutes(prescription.durationSecondsOrDistanceMeters),
      };
  }
}

function buildSegmentTarget({
  row,
  segment,
  prescription,
  targetTruthMode,
  paceTarget,
  runnerAge,
}: {
  row: RunningPlanPreviewCalendarRow;
  segment: RunningPlanWatchExecutableSegmentTemplate;
  prescription: RunningPlanSegmentPrescription;
  targetTruthMode: RunningPlanWatchExecutableSegmentTemplate["targetTruthMode"];
  paceTarget: string | null;
  runnerAge: number;
}) {
  const effortTarget = resolveEffortTarget(prescriptionIntensityLabel(prescription));
  const defaultHrTarget = paceTarget
    ? null
    : buildAllowedDefaultEstimatedHrTarget({
        row,
        segment,
        prescription,
        runnerAge,
        targetTruthMode,
      });
  const paceTargetFields = paceTarget
    ? {
        intensity: effortTarget.intensity,
        label: "Benchmark-backed pace target",
        pace_min_per_km_range: paceTarget,
      }
    : {};
  const effortGuidanceFields = {
    intensity: effortTarget.intensity,
  };

  if (defaultHrTarget) {
    return {
      ...effortGuidanceFields,
      label: `${defaultHrTarget.label} estimated HR guidance`,
      hr_bpm_range: defaultHrTarget.rangeBpm,
      hr_target_source: "default_estimated_hr",
      source_note: DEFAULT_ESTIMATED_HR_SOURCE_NOTE,
    };
  }

  return {
    ...paceTargetFields,
    source_note: paceTarget
      ? "Broad pace range comes from a recent 5K benchmark; HR-zone targets require measured zone data."
      : "No pace target is inferred; HR-zone targets require measured zone data.",
  };
}

function resolveDefaultEstimatedHrBand(
  prescription: RunningPlanSegmentPrescription,
): DefaultEstimatedHrBandKey {
  const label = prescriptionIntensityLabel(prescription).toLowerCase();

  if (/threshold|tempo|fast|stride|quick|turnover/.test(label)) {
    return "tempo";
  }

  if (/hill|uphill|progression|steady|durable|completion|checkpoint/.test(label)) {
    return "steady";
  }

  if (/long|endurance/.test(label)) {
    return "longAerobic";
  }

  if (/recovery|walk|jog|settle|cool|warm|adaptation/.test(label)) {
    return "recovery";
  }

  return "easy";
}

function buildAllowedDefaultEstimatedHrTarget({
  prescription,
  row,
  runnerAge,
  segment,
  targetTruthMode,
}: {
  row: RunningPlanPreviewCalendarRow;
  segment: RunningPlanWatchExecutableSegmentTemplate;
  prescription: RunningPlanSegmentPrescription;
  runnerAge: number;
  targetTruthMode: RunningPlanWatchExecutableSegmentTemplate["targetTruthMode"];
}) {
  if (targetTruthMode !== "editable_default_hr") {
    return null;
  }

  if (!defaultEstimatedHrIsAllowedForWorkout(row.workoutDayKind, segment.segmentRole)) {
    return null;
  }

  return buildDefaultEstimatedHrBandReadback(
    runnerAge,
    resolveDefaultEstimatedHrBand(prescription),
  );
}

function defaultEstimatedHrIsAllowedForWorkout(
  workoutDayKind: RunningPlanPreviewCalendarRow["workoutDayKind"],
  segmentRole: RunningPlanWatchExecutableSegmentTemplate["segmentRole"],
) {
  if (segmentRole !== "main") {
    return false;
  }

  return (
    workoutDayKind === "recovery" ||
    workoutDayKind === "easy" ||
    workoutDayKind === "long_run" ||
    workoutDayKind === "cutback_long_run"
  );
}

function resolveEffortTarget(intensityLabel: string): { intensity: string } {
  const normalized = intensityLabel.toLowerCase();

  if (/stride|quick|turnover|fast/.test(normalized)) {
    return { intensity: "Quick but relaxed" };
  }

  if (/threshold/.test(normalized)) {
    return { intensity: "Strong controlled" };
  }

  if (/tempo/.test(normalized)) {
    return { intensity: "Controlled tempo" };
  }

  if (/hill|uphill/.test(normalized)) {
    return { intensity: "Controlled hill effort" };
  }

  if (/progression|steady|durable|completion|checkpoint/.test(normalized)) {
    return { intensity: "Steady controlled" };
  }

  if (/recovery|walk|jog|settle|cool|finish|easy|adaptation/.test(normalized)) {
    return { intensity: "Easy" };
  }

  return { intensity: "Comfortably controlled" };
}

function resolveSegmentType(
  segment: RunningPlanWatchExecutableSegmentTemplate,
): TrainingPlanV2["planned_workouts"][number]["segments"][number]["segment_type"] {
  if (segment.primaryPrescription.mode === "repeat") {
    if (segment.id.includes("stride")) return "strides";
    if (segment.id.includes("tempo") || segment.id.includes("threshold")) return "tempo_block";
    return "interval_block";
  }

  if (segment.segmentRole === "warmup" || segment.segmentRole === "opener") return "warmup";
  if (segment.segmentRole === "cooldown") return "cooldown";
  if (segment.segmentRole === "recovery") return "recovery";

  return "main";
}

function resolveWorkoutMapping(
  row: RunningPlanPreviewCalendarRow,
  family: RunningPlanDistanceFamily,
): RunningPlanWorkoutMapping {
  if (row.isRestDay) {
    return {
      workoutType: "rest",
      workoutFamily: "rest",
      workoutIdentity: "rest_and_recovery",
      calendarIconKey: "rest",
    };
  }

  switch (row.workoutDayKind) {
    case "recovery":
      return {
        workoutType: "recovery",
        workoutFamily: "recovery",
        workoutIdentity: "recovery_jog",
        calendarIconKey: "recovery",
      };
    case "easy":
      return {
        workoutType: "easy",
        workoutFamily: "easy",
        workoutIdentity: "easy_aerobic_run",
        calendarIconKey: "easy",
      };
    case "long_run":
      return {
        workoutType: "long_run",
        workoutFamily: "long",
        workoutIdentity: "long_aerobic_run",
        calendarIconKey: "long",
      };
    case "cutback_long_run":
      return {
        workoutType: "long_run",
        workoutFamily: "long",
        workoutIdentity: "cutback_long_run",
        calendarIconKey: "long",
      };
    case "strides":
      return {
        workoutType: "easy",
        workoutFamily: "easy",
        workoutIdentity: "easy_run_with_strides",
        calendarIconKey: "easy",
      };
    case "steady_aerobic_run":
      return {
        workoutType: "steady_or_easy",
        workoutFamily: "steady",
        workoutIdentity: "steady_aerobic_run",
        calendarIconKey: "steady",
      };
    case "progression":
      return {
        workoutType: "progression",
        workoutFamily: "progression",
        workoutIdentity: "progression_run",
        calendarIconKey: "progression",
      };
    case "tempo":
      return {
        workoutType: "tempo",
        workoutFamily: "tempo",
        workoutIdentity: "controlled_tempo_session",
        calendarIconKey: "tempo",
      };
    case "threshold":
      return {
        workoutType: "tempo",
        workoutFamily: "tempo",
        workoutIdentity: "half_marathon_threshold_durability",
        calendarIconKey: "tempo",
      };
    case "intervals":
      return {
        workoutType: "intervals",
        workoutFamily: "intervals",
        workoutIdentity: family === "10K" ? "10k_rhythm_intervals" : "distance_intervals",
        calendarIconKey: "intervals",
      };
    case "hills":
      return {
        workoutType: "quality",
        workoutFamily: "hills",
        workoutIdentity: "rolling_hills_session",
        calendarIconKey: "hills",
      };
    case "final_selected_distance_day":
      return {
        workoutType: "race",
        workoutFamily: "race",
        workoutIdentity:
          family === "10K"
            ? "tenk_completion_or_checkpoint"
            : "selected_distance_completion_or_checkpoint",
        calendarIconKey: "race",
      };
    case "marathon_base_endpoint":
      return {
        workoutType: "long_run",
        workoutFamily: "long",
        workoutIdentity: "base_endpoint_marker",
        calendarIconKey: "long",
      };
  }
}

function buildMetricMode({
  row,
  segments,
}: {
  row: RunningPlanPreviewCalendarRow;
  segments: TrainingPlanV2["planned_workouts"][number]["segments"];
}): CanonicalMetricModeJson {
  const hasPaceTargets = selectedPlanSegmentsContainPaceTargets(segments);
  const hasDefaultEstimatedHrTargets =
    selectedPlanSegmentsContainDefaultEstimatedHrTargets(segments);

  if (hasPaceTargets) {
    return {
      guidance: "pace",
      executable_mode: "pace_executable",
      pace_targets_allowed: true,
      hr_targets_allowed: false,
      hr_target_source: hasDefaultEstimatedHrTargets ? "default_estimated_hr" : "effort_only",
      ...(hasDefaultEstimatedHrTargets
        ? {
            hr_target_label: "Editable estimated HR guidance",
            hr_target_source_note: "Default estimate only; not measured HR-zone data.",
          }
        : {}),
      reason:
        "Recent 5K benchmark truth allows broad selected-plan pace targets; HR targets remain blocked.",
    };
  }

  return {
    guidance: hasDefaultEstimatedHrTargets ? "heart_rate" : "effort",
    executable_mode: "structure_only_executable",
    pace_targets_allowed: false,
    hr_targets_allowed: false,
    ...(hasDefaultEstimatedHrTargets
      ? {
          hr_target_source: "default_estimated_hr",
          hr_target_label: "Editable Hito default HR guidance",
          hr_target_source_note: DEFAULT_ESTIMATED_HR_SOURCE_NOTE,
        }
      : {}),
    reason: hasDefaultEstimatedHrTargets
      ? "Selected running-plan engine emits exact numeric structure with editable default estimated HR guidance; measured HR-zone targets remain blocked."
      : "Selected running-plan engine emits exact numeric structure without pace truth or measured HR-zone data.",
  };
}

function selectedPlanSegmentsContainDefaultEstimatedHrTargets(
  segments: TrainingPlanV2["planned_workouts"][number]["segments"],
) {
  return segments.some((segment) =>
    collectSegmentTargets(segment).some((target) => {
      return (
        target?.hr_target_source === "default_estimated_hr" &&
        typeof target.hr_bpm_range === "string" &&
        target.hr_bpm_range.trim().length > 0
      );
    }),
  );
}

function collectSegmentTargets(
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
) {
  const parentTarget = segment.target as Record<string, unknown> | undefined;
  const childTargets =
    segment.prescription?.mode === "repeats" && segment.prescription.children?.length
      ? segment.prescription.children
          .map((child) => child.target as Record<string, unknown> | undefined)
          .filter((target): target is Record<string, unknown> => Boolean(target))
      : [];

  return [parentTarget, ...childTargets].filter((target): target is Record<string, unknown> =>
    Boolean(target),
  );
}

function buildWorkoutSummary(
  row: RunningPlanPreviewCalendarRow,
  family: RunningPlanDistanceFamily,
  displayIndex: number,
) {
  if (row.isRestDay) {
    return `Rest day ${displayIndex + 1}; no workout is scheduled.`;
  }

  if (row.workoutDayKind === "marathon_base_endpoint") {
    return "Controlled marathon-base endpoint. This is not a marathon race-readiness claim.";
  }

  if (row.workoutDayKind === "final_selected_distance_day") {
    return `${family} selected-distance endpoint with exact structure and no target-time pace claim.`;
  }

  return `${row.title} with exact watch-executable structure; cues remain secondary.`;
}

function formatSegmentLabel(segment: RunningPlanWatchExecutableSegmentTemplate) {
  const role = segment.segmentRole.replaceAll("_", " ");
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function exactRangeNumber(range: { min: number; max: number }) {
  if (range.min !== range.max) {
    throw new Error("Running-plan canonical mapping requires exact resolved prescriptions.");
  }

  return range.min;
}

function secondsRangeToMinutes(range: { min: number; max: number }) {
  return Number((exactRangeNumber(range) / 60).toFixed(2));
}

function metersRangeToKm(range: { min: number; max: number }) {
  return Number((exactRangeNumber(range) / 1000).toFixed(3));
}

function buildRepeatChildUnitPrescription(prescription: RunningPlanRepeatChildUnitPrescription) {
  if (prescription.mode === "time") {
    return {
      mode: "time" as const,
      duration_min: secondsRangeToMinutes(prescription.durationSeconds),
    };
  }

  return {
    mode: "distance" as const,
    distance_km: metersRangeToKm(prescription.distanceMeters),
  };
}

function prescriptionIntensityLabel(prescription: RunningPlanSegmentPrescription): string {
  switch (prescription.mode) {
    case "repeat":
      return primaryRepeatChild(prescription.children)?.intensityLabel ?? "controlled_repeat";
    case "recovery_time":
    case "recovery_distance":
      return prescription.intensityLabel;
    case "free_run_with_cap":
      return prescription.intensityLabel;
    default:
      return prescription.intensityLabel;
  }
}

function primaryRepeatChild(
  children: readonly RunningPlanRepeatChildPrescription[],
): RunningPlanRepeatChildPrescription | null {
  return (
    children.find((child) => child.role === "work" || child.role === "run") ?? children[0] ?? null
  );
}

function resolveRunningPlanPhase(weekNumber: number, horizonWeeks: number) {
  if (weekNumber === horizonWeeks) return "Endpoint";
  if (weekNumber >= horizonWeeks - 1) return "Taper";
  if (weekNumber <= Math.max(3, Math.floor(horizonWeeks * 0.35))) return "Base";
  if (weekNumber <= Math.max(5, Math.floor(horizonWeeks * 0.75))) return "Build";
  return "Specific";
}

function runningPlanName(family: RunningPlanDistanceFamily) {
  switch (family) {
    case "10K":
      return "10K Foundation";
    case "Half Marathon":
      return "Half Marathon Balanced";
    case "Marathon Base":
      return "Marathon Base";
    case "Marathon Completion":
      return "Marathon Completion";
  }
}

function runningPlanGoalType(family: RunningPlanDistanceFamily) {
  switch (family) {
    case "10K":
      return "10k";
    case "Half Marathon":
      return "half_marathon";
    case "Marathon Base":
      return "distance_build";
    case "Marathon Completion":
      return "marathon";
  }
}

function runningPlanGoalLabel(family: RunningPlanDistanceFamily) {
  switch (family) {
    case "10K":
      return "Complete a 10K checkpoint";
    case "Half Marathon":
      return "Complete a Half Marathon checkpoint";
    case "Marathon Base":
      return "Build marathon-base durability";
    case "Marathon Completion":
      return "Complete a marathon";
  }
}

function summarizeRunningPlanCompositionGrammar(draft: RunningPlanPreviewDraft) {
  const rows = draft.calendarRows;
  const horizonWeeks = maxWeekNumber(rows);
  const weekProofs = Array.from({ length: horizonWeeks }, (_, index) => {
    const weekNumber = index + 1;
    const composition = resolveRunningPlanCompositionWeek({
      family: draft.planFamily,
      runnerLevel: draft.normalizedInputSummary.runnerLevel,
      loadContext: draft.normalizedInputSummary.loadContext,
      weekNumber,
      horizonWeeks,
    });
    const weekRows = rows.filter((row) => row.weekNumber === weekNumber);
    const actualDevelopmentTouches = weekRows
      .filter(
        (row) => !row.isRestDay && isRunningPlanCompositionDevelopmentTouch(row.workoutDayKind),
      )
      .map((row) => row.workoutDayKind);

    return {
      weekNumber,
      archetype: composition.archetype,
      plannedDevelopmentTouch: composition.developmentTouch,
      actualDevelopmentTouches,
      longRunRole: composition.longRunRole,
      familySignals: composition.familySignals,
    };
  });

  return {
    version: RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
    weekArchetypeSequence: weekProofs.map((week) => `${week.weekNumber}:${week.archetype}`),
    plannedDevelopmentSequence: weekProofs
      .filter((week) => week.plannedDevelopmentTouch)
      .map((week) => `${week.weekNumber}:${week.plannedDevelopmentTouch}`),
    actualDevelopmentSequence: weekProofs.flatMap((week) =>
      week.actualDevelopmentTouches.map((touch) => `${week.weekNumber}:${touch}`),
    ),
    developmentTouchCountsByWeek: Object.fromEntries(
      weekProofs.map((week) => [week.weekNumber, week.actualDevelopmentTouches.length]),
    ),
    familySignals: uniqueStrings(weekProofs.flatMap((week) => week.familySignals)),
    longRunRoleSequence: weekProofs.map((week) => `${week.weekNumber}:${week.longRunRole}`),
  };
}

function summarizeMetricPolicy(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return {
    executableMode: "structure_only_executable",
    paceTargetsAllowed: false,
    personalHrTargetsAllowed: false,
    defaultHrGuidanceRows: rows.filter((row) =>
      row.targetTruthModes.includes("editable_default_hr"),
    ).length,
    fakePaceOrPersonalHrOutput: /pace_min|pace_target|personal_hr|race_pace/i.test(
      JSON.stringify(rows),
    ),
  };
}

function resolveRunnerLevelForCanonicalQualityGates(draft: RunningPlanPreviewDraft) {
  if (draft.planFamily !== "10K") {
    return draft.normalizedInputSummary.runnerLevel;
  }

  return resolveTenKBeginnerDosePolicyRunnerLevel({
    runnerLevel: draft.normalizedInputSummary.runnerLevel,
    benchmarkPaceTruth: draft.normalizedInputSummary.benchmarkPaceTruth,
  });
}

function canonicalWorkoutToTenKDoseValidationRow(row: TrainingPlanV2["planned_workouts"][number]) {
  return {
    rowId: row.workout_id,
    weekNumber: row.week_number,
    isRestDay: row.workout_type === "rest",
    workoutDayKind: (row.source_workout_type ??
      "rest") as RunningPlanPreviewCalendarRow["workoutDayKind"],
    endpointDistanceMeters: canonicalEndpointDistanceMeters(row),
    segments: row.segments.map((segment) => ({
      primaryPrescription: canonicalPrescriptionToDosePrescription(segment.prescription),
    })),
  };
}

function canonicalPrescriptionToDosePrescription(
  prescription: TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"],
): RunningPlanSegmentPrescription {
  if (!prescription || prescription.mode === "none") {
    return {
      mode: "time",
      durationSeconds: { min: 0, max: 0 },
      intensityLabel: "none",
    };
  }

  if (prescription.mode === "distance") {
    const distanceMeters = Math.round((prescription.distance_km ?? 0) * 1000);
    return {
      mode: "distance",
      distanceMeters: { min: distanceMeters, max: distanceMeters },
      intensityLabel: "canonical_distance",
    };
  }

  if (prescription.mode === "repeats") {
    const repeatCount = prescription.repeat_count ?? 0;
    return {
      mode: "repeat",
      repeatCount: { min: repeatCount, max: repeatCount },
      children: (prescription.children ?? []).map((child, index) => ({
        role: child.role,
        ...(child.label ? { label: child.label } : {}),
        ...(child.guidance ? { guidance: child.guidance } : {}),
        prescription: canonicalRepeatChildUnitToDoseUnit(child.prescription),
        intensityLabel: `canonical_repeat_${child.role}_${index + 1}`,
      })),
    };
  }

  const durationSeconds = Math.round((prescription.duration_min ?? 0) * 60);
  return {
    mode: "time",
    durationSeconds: { min: durationSeconds, max: durationSeconds },
    intensityLabel: "canonical_time",
  };
}

function canonicalRepeatChildUnitToDoseUnit(
  unit:
    | NonNullable<
        Extract<
          NonNullable<
            TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"]
          >,
          { mode: "repeats" }
        >["children"]
      >[number]["prescription"]
    | undefined,
): RunningPlanRepeatChildUnitPrescription {
  if (unit?.mode === "distance") {
    const distanceMeters = Math.round((unit.distance_km ?? 0) * 1000);
    return {
      mode: "distance",
      distanceMeters: { min: distanceMeters, max: distanceMeters },
    };
  }

  const durationSeconds = Math.round((unit?.duration_min ?? 0) * 60);
  return {
    mode: "time",
    durationSeconds: { min: durationSeconds, max: durationSeconds },
  };
}

function canonicalEndpointDistanceMeters(row: TrainingPlanV2["planned_workouts"][number]) {
  if (row.source_workout_type !== "final_selected_distance_day") {
    return null;
  }

  const mainDistanceKm = row.segments
    .map((segment) => segment.prescription)
    .find((prescription) => prescription?.mode === "distance")?.distance_km;

  return typeof mainDistanceKm === "number" ? Math.round(mainDistanceKm * 1000) : null;
}

function maxWeekNumber(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return Math.max(...rows.map((row) => row.weekNumber));
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values));
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
