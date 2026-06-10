import type { AdditionalPlanPersistenceMetadata } from "@/lib/plan-authoring-snapshot";
import {
  RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
  isRunningPlanCompositionDevelopmentTouch,
  resolveRunningPlanCompositionWeek,
  type HalfMarathonPlanPreviewDraft,
  type MarathonBasePlanPreviewDraft,
  type RunningPlanPreviewCalendarRow,
  type RunningPlanSegmentPrescription,
  type RunningPlanWatchExecutableSegmentTemplate,
  type TenKPlanPreviewDraft,
} from "@/lib/plan-creation-engine";
import type { RunningPlanDistanceFamily } from "@/lib/plan-creation-engine";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import { trainingPlanV2Schema } from "@/lib/imported-plan";
import type {
  CalendarIconKey,
  CanonicalMetricModeJson,
  CanonicalWorkoutFamily,
  CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import type { Json } from "@/lib/supabase/database";
import { serverEnv } from "@/lib/supabase/env";

export const RUNNING_PLAN_REVIEW_CONTRACT_VERSION = "running_plan_review_v1" as const;
export const RUNNING_PLAN_CONFIRMED_SOURCE_STATUS = "confirmed_selected_plan" as const;

export type RunningPlanPreviewDraft =
  | TenKPlanPreviewDraft
  | HalfMarathonPlanPreviewDraft
  | MarathonBasePlanPreviewDraft;

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
  const reviewToken = await signRunningPlanReviewPayload(reviewPayload);

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
  const canonicalPlan = buildRunningPlanCanonicalPlan(input.draft);
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
        "Backend-selected running-plan preview. Exact watch-executable structure; no fake pace or personal HR truth.",
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
  const metricPolicy = summarizeMetricPolicy(draft.calendarRows);

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
        metric_policy: metricPolicy,
      },
    }),
    planPreferences: toJson({
      running_plan_engine_review: {
        review_contract_version: RUNNING_PLAN_REVIEW_CONTRACT_VERSION,
        review_checksum: reviewChecksum,
        normalized_input: draft.normalizedInputSummary,
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

function canonicalPlanStablePayload(plan: TrainingPlanV2) {
  const { created_at: _createdAt, ...stablePlan } = plan;

  return stablePlan;
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
  const metricMode = buildMetricMode(row);

  return {
    workout_id: row.rowId,
    date: row.date,
    weekday: row.weekday,
    week_number: row.weekNumber,
    phase: resolveRunningPlanPhase(row.weekNumber, maxWeekNumber(draft.calendarRows)),
    segments: row.isRestDay ? [buildRestSegment(row)] : row.segments.map(buildCanonicalSegment),
    workout_type: mapping.workoutType,
    source_workout_type: row.workoutDayKind,
    workout_family: mapping.workoutFamily,
    workout_identity: mapping.workoutIdentity,
    calendar_icon_key: mapping.calendarIconKey,
    goal_context: {
      goal_type: runningPlanGoalType(draft.planFamily),
      goal_style: "balanced",
      terrain_focus: "standard",
      target_date: draft.planFamily === "Marathon Base" ? null : draft.endpointProof.finalDate,
      target_time: null,
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

function buildCanonicalSegment(
  segment: RunningPlanWatchExecutableSegmentTemplate,
): TrainingPlanV2["planned_workouts"][number]["segments"][number] {
  const prescription = buildCanonicalPrescription(segment.primaryPrescription);

  return {
    segment_id: segment.id,
    segment_type: resolveSegmentType(segment),
    label: formatSegmentLabel(segment),
    sequence: segment.order,
    guidance: segment.secondaryCue,
    prescription,
    target: buildSegmentTarget(segment.primaryPrescription, segment.targetTruthMode),
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
        repeat_unit: buildRepeatUnitPrescription(prescription.work),
        recovery_unit: buildRepeatRecoveryUnitPrescription(prescription.recovery),
      };
    case "free_run_with_cap":
      return {
        mode: "time",
        duration_min: secondsRangeToMinutes(prescription.durationSecondsOrDistanceMeters),
      };
  }
}

function buildSegmentTarget(
  prescription: RunningPlanSegmentPrescription,
  targetTruthMode: RunningPlanWatchExecutableSegmentTemplate["targetTruthMode"],
) {
  const intensity = prescriptionIntensityLabel(prescription);

  if (targetTruthMode === "editable_default_hr") {
    return {
      intensity,
      label: "Editable Hito default HR guidance",
      hr_target_source: "default_estimated_hr",
      source_note: "Default estimate only; not personal HR-zone truth.",
    };
  }

  return {
    intensity,
    label: "Structure-only executable target",
    source_note: "No pace or personal HR target is inferred.",
  };
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
      return family === "10K"
        ? {
            workoutType: "race",
            workoutFamily: "race",
            workoutIdentity: "tenk_completion_or_checkpoint",
            calendarIconKey: "race",
          }
        : {
            workoutType: "race",
            workoutFamily: "race",
            workoutIdentity: "race_pace_session",
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

function buildMetricMode(row: RunningPlanPreviewCalendarRow): CanonicalMetricModeJson {
  const hasEditableDefaultHr = row.targetTruthModes.includes("editable_default_hr");

  return {
    guidance: hasEditableDefaultHr ? "mixed" : "effort",
    executable_mode: "structure_only_executable",
    pace_targets_allowed: false,
    hr_targets_allowed: false,
    ...(hasEditableDefaultHr
      ? {
          hr_target_source: "default_estimated_hr",
          hr_target_label: "Editable Hito default HR guidance",
          hr_target_source_note: "Default estimate only; not personal HR-zone truth.",
        }
      : {}),
    reason:
      "Selected running-plan engine emits exact numeric structure without pace truth or personal HR-zone truth.",
  };
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

function buildRepeatUnitPrescription(
  prescription:
    | {
        mode: "time";
        durationSeconds: { min: number; max: number };
      }
    | {
        mode: "distance";
        distanceMeters: { min: number; max: number };
      },
) {
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

function buildRepeatRecoveryUnitPrescription(
  prescription:
    | {
        mode: "recovery_time";
        recoveryDurationSeconds: { min: number; max: number };
      }
    | {
        mode: "recovery_distance";
        recoveryDistanceMeters: { min: number; max: number };
      },
) {
  if (prescription.mode === "recovery_time") {
    return {
      mode: "time" as const,
      duration_min: secondsRangeToMinutes(prescription.recoveryDurationSeconds),
    };
  }

  return {
    mode: "distance" as const,
    distance_km: metersRangeToKm(prescription.recoveryDistanceMeters),
  };
}

function prescriptionIntensityLabel(prescription: RunningPlanSegmentPrescription): string {
  switch (prescription.mode) {
    case "repeat":
      return prescription.work.intensityLabel;
    case "recovery_time":
    case "recovery_distance":
      return prescription.intensityLabel;
    case "free_run_with_cap":
      return prescription.intensityLabel;
    default:
      return prescription.intensityLabel;
  }
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

function maxWeekNumber(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return Math.max(...rows.map((row) => row.weekNumber));
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values));
}

async function signRunningPlanReviewPayload(
  payload: ReturnType<typeof buildRunningPlanReviewPayload>,
) {
  const serializedPayload = stableJsonStringify(payload);
  const secret = serverEnv.supabaseServiceRoleKey;

  if (!secret) {
    return `sha256:${await digestSha256Hex(serializedPayload)}`;
  }

  return `hmac-sha256:${await hmacSha256Hex(secret, serializedPayload)}`;
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

async function digestSha256Hex(payload: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));

  return bytesToHex(digest);
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

  return bytesToHex(signature);
}

function bytesToHex(value: ArrayBuffer) {
  return Array.from(new Uint8Array(value))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    );
  }

  return value;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
