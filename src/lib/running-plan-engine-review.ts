import type { AdditionalPlanPersistenceMetadata } from "@/lib/plan-authoring-snapshot";
import {
  isAiGeneratedRunningPlanPreviewDraft,
  type AiGeneratedRunningPlanPreviewDraft,
} from "@/lib/ai-generated-running-plan";
import {
  collectTenKBeginnerDosePolicyIssues,
  normalizeTenKBeginnerDoseWorkoutDayKind,
  resolveTenKBeginnerDosePolicyRunnerLevel,
} from "@/lib/plan-creation-engine/ten-k-beginner-dose-policy";
import {
  RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
  isRunningPlanCompositionDevelopmentTouch,
  resolveRunningPlanCompositionWeek,
  collectRunnerFacingCanonicalRichnessIssues,
  collectRunningPlanCanonicalPrescriptionGrammarIssues,
  collectSelectedDistanceEndpointIssues,
  resolveSelectedDistanceQualityFamily,
  summarizeRunnerFacingCanonicalRichness,
  summarizeRunningPlanCanonicalPrescriptionGrammar,
  selectedDistanceEndpointMainDistanceMeters,
  type RunningPlanPreviewCalendarRow,
  type RunningPlanRepeatChildUnitPrescription,
  type RunningPlanSegmentPrescription,
} from "@/lib/plan-creation-engine";
import type { RunningPlanDistanceFamily } from "@/lib/plan-creation-engine/source-types";
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
  payload: ReturnType<typeof buildRunningPlanReviewPayload>;
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

  const canonicalPlan = buildRunningPlanCanonicalPlan(input.draft);
  const endpointIssues = collectDistanceGoalEndpointExactnessIssues(input.draft, canonicalPlan);
  if (endpointIssues.length > 0) {
    return {
      ok: false,
      reason: "invalid_review",
      message:
        "This selected-plan review no longer satisfies Hito's selected-distance endpoint contract. Refresh the preview before creating a plan.",
    };
  }

  const richnessIssues = collectRunnerFacingCanonicalRichnessIssues({
    family: resolveDistanceGoalQualityFamily(input.draft),
    runnerLevel: resolveRunnerLevelForCanonicalQualityGates(input.draft),
    loadContext: input.draft.normalizedInputSummary.loadContext,
    rows: canonicalPlan.planned_workouts,
  });

  if (richnessIssues.length > 0) {
    return {
      ok: false,
      reason: "invalid_review",
      message: `This selected-plan review no longer satisfies Hito's runner-facing richness gates: ${richnessIssues[0]} Refresh the preview before creating a plan.`,
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

  if (resolveDistanceGoalQualityFamily(input.draft) === "10K") {
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
    family: resolveDistanceGoalQualityFamily(draft),
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
        goal_model: "distance_goal",
        distance_goal: buildDistanceGoalMetadata(planGoalIntent),
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

function buildDistanceGoalMetadata(
  planGoalIntent: RunningPlanPreviewDraft["normalizedInputSummary"]["planGoalIntent"],
) {
  const distance = planGoalIntent.distance;

  return {
    goal_type: "distance_build",
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

function summarizeRunningPlanCompositionGrammar(draft: RunningPlanPreviewDraft) {
  const rows = draft.calendarRows;
  const horizonWeeks = maxWeekNumber(rows);
  const weekProofs = Array.from({ length: horizonWeeks }, (_, index) => {
    const weekNumber = index + 1;
    const composition = resolveRunningPlanCompositionWeek({
      family: resolveDistanceGoalQualityFamily(draft),
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
  if (resolveDistanceGoalQualityFamily(draft) !== "10K") {
    return draft.normalizedInputSummary.runnerLevel;
  }

  return resolveTenKBeginnerDosePolicyRunnerLevel({
    runnerLevel: draft.normalizedInputSummary.runnerLevel,
    benchmarkPaceTruth: draft.normalizedInputSummary.benchmarkPaceTruth,
  });
}

function resolveDistanceGoalQualityFamily(
  draft: RunningPlanPreviewDraft,
): RunningPlanDistanceFamily {
  const meters =
    draft.normalizedInputSummary.planGoalIntent.distance?.distanceMeters ??
    draft.endpointProof.endpointDistanceMeters ??
    null;

  return resolveSelectedDistanceQualityFamily({
    distanceMeters: meters,
    fallbackFamily: draft.normalizedInputSummary.distanceFamily,
  });
}

export function canonicalWorkoutToTenKDoseValidationRow(
  row: TrainingPlanV2["planned_workouts"][number],
) {
  return {
    rowId: row.workout_id,
    date: row.date,
    weekNumber: row.week_number,
    isRestDay: row.workout_type === "rest",
    workoutDayKind: normalizeTenKBeginnerDoseWorkoutDayKind(
      row.source_workout_type ?? row.workout_identity ?? row.workout_type,
    ),
    endpointDistanceMeters: selectedDistanceEndpointMainDistanceMeters({
      endpointKind: row.source_workout_type,
      segments: row.segments,
    }),
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

function collectDistanceGoalEndpointExactnessIssues(
  draft: RunningPlanPreviewDraft,
  canonicalPlan: TrainingPlanV2,
) {
  const distanceMeters =
    draft.normalizedInputSummary.planGoalIntent.distance?.distanceMeters ??
    draft.endpointProof.endpointDistanceMeters ??
    null;

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
    targetDate: draft.normalizedInputSummary.planGoalIntent.targetDate,
    proof: draft.endpointProof,
  }).map((issue) => issue.code);
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
