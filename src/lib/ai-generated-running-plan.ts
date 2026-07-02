import {
  generateAiFirstPlanDraftPreview,
  type GenerateAiFirstPlanDraftPreviewOptions,
  type AiFirstPlanDraftPreviewMetadata,
} from "@/lib/ai-first-plan-draft-service";
import type { AiPlanGenerationLedgerTrace } from "@/lib/ai-plan-generation-ledger";
import {
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  isAiGeneratedRunningPlanDevFixtureEnabled,
  isAiGeneratedRunningPlanDevFixtureModel,
} from "@/lib/ai-generated-running-plan-dev-fixture";
import {
  parseDurationSeconds,
  parsePaceSecondsPerKm,
  pickEvenly,
  uniqueWeekdays,
} from "@/lib/first-plan-authoring-utils";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import {
  normalizePlanGoalIntent,
  type PlanGoalIntentInput,
  type NormalizedPlanGoalIntent,
} from "@/lib/plan-creation-engine/plan-goal-intent";
import type {
  BuildRunningPlanPreviewInput,
  RunningPlanPreviewCalendarRow,
  RunningPlanPreviewNormalizedInputSummary,
  RunningPlanSegmentPrescription,
  RunningPlanWatchExecutableSegmentTemplate,
} from "@/lib/plan-creation-engine/preview-builder-shared";
import { RUNNING_PLAN_PREVIEW_REST_DAY_KIND } from "@/lib/plan-creation-engine/preview-builder-shared";
import { RUNNING_PLAN_HORIZON_POLICY_VERSION } from "@/lib/plan-creation-engine/horizon-policy";
import { RUNNING_PLAN_SOURCE_MODEL } from "@/lib/plan-creation-engine/source-model";
import {
  RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES,
  type RunningPlanBenchmarkPaceTruth,
  type RunningPlanDistanceFamily,
  type RunningPlanRunnerLevel,
  type RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import { resolveAuthoringHorizonWeeks } from "@/lib/ai-first-plan-blueprint-policy";
import {
  deriveAvailableTrainingWeekdays,
  derivePreferredLongRunDayFallback,
} from "@/lib/runner-training-preferences";
import {
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "@/lib/structured-plan-authoring";
import { todayIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export const AI_GENERATED_RUNNING_PLAN_SOURCE_KIND = "ai_first_plan_blueprint_v1" as const;
export const AI_GENERATED_RUNNING_PLAN_PREVIEW_VERSION = "ai_generated_running_plan_v1" as const;

export type AiGeneratedRunningPlanPreviewOutcome =
  | "preview_ready"
  | "preview_ready_with_warnings"
  | "impossible_goal_with_reason"
  | "ai_unavailable_retryable"
  | "internal_validation_bug";

export type AiGeneratedRunningPlanSourceStatus = Extract<
  AiFirstPlanDraftPreviewMetadata["status"],
  "ai_authored" | "repaired_ai_draft"
>;

export interface AiGeneratedRunningPlanPreviewDraft {
  sourceKind: typeof AI_GENERATED_RUNNING_PLAN_SOURCE_KIND;
  source_kind: typeof AI_GENERATED_RUNNING_PLAN_SOURCE_KIND;
  sourceStatus: AiGeneratedRunningPlanSourceStatus;
  source_status: AiGeneratedRunningPlanSourceStatus;
  persisted: false;
  mutates: false;
  callsOpenAi: true;
  planVersion: typeof AI_GENERATED_RUNNING_PLAN_PREVIEW_VERSION;
  previewOutcome: Extract<
    AiGeneratedRunningPlanPreviewOutcome,
    "preview_ready" | "preview_ready_with_warnings"
  >;
  previewWarnings: readonly string[];
  sourceModelVersion: typeof RUNNING_PLAN_SOURCE_MODEL.sourceVersion;
  reviewSafety: {
    persisted: false;
    mutates: false;
    confirmPathImplemented: true;
    callsOpenAi: true;
    confirmCallsOpenAi: false;
    trustedClientRows: false;
  };
  previewInput: BuildRunningPlanPreviewInput;
  normalizedInputSummary: RunningPlanPreviewNormalizedInputSummary;
  calendarRows: readonly RunningPlanPreviewCalendarRow[];
  endpointProof: {
    finalRowId: string;
    finalDate: string;
    endpointDistanceMeters: number | null;
    endpointMainDistanceMeters: number | null;
    finalRowIsLastNonRest: true;
    rejectedGenericFinalOutputs: readonly string[];
  };
  validation: {
    ok: true;
    issues: readonly string[];
    forbiddenOutputGateIdsChecked: readonly string[];
    rejectedOldBehaviorSignalsChecked: readonly string[];
  };
  canonicalPlan: TrainingPlanV2;
  aiGeneration: AiFirstPlanDraftPreviewMetadata;
}

export type AiGeneratedRunningPlanPreviewUnavailable = {
  sourceKind: typeof AI_GENERATED_RUNNING_PLAN_SOURCE_KIND;
  source_kind: typeof AI_GENERATED_RUNNING_PLAN_SOURCE_KIND;
  sourceStatus: "preview_unavailable";
  source_status: "preview_unavailable";
  persisted: false;
  mutates: false;
  callsOpenAi: true;
  previewOutcome: Extract<
    AiGeneratedRunningPlanPreviewOutcome,
    "impossible_goal_with_reason" | "ai_unavailable_retryable" | "internal_validation_bug"
  >;
  error: {
    code:
      | "ai_generated_plan_unavailable"
      | "impossible_plan_goal"
      | "invalid_plan_goal_intent"
      | "structured_input_invalid";
    message: string;
    issues: readonly string[];
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
    fixedRestDayCount: number;
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
    feasibilityStatus: NormalizedPlanGoalIntent["feasibility"]["status"] | null;
  };
  normalizedBy: string | null;
  localDevFixtureEnabled: boolean;
  provider: {
    kind: AiPlanGenerationLedgerTrace["provider"]["kind"];
    paidProviderCall: boolean;
    responseId: string | null;
    model: string | null;
    tokenUsage: AiPlanGenerationLedgerTrace["provider"]["tokenUsage"];
  } | null;
  liveOpenAiCalled: boolean;
  fallbackReason: string | null;
  validationIssues: readonly string[];
  repairSummary: readonly string[];
}

export type AiGeneratedRunningPlanPreviewResult =
  | { ok: true; draft: AiGeneratedRunningPlanPreviewDraft }
  | { ok: false; unavailable: AiGeneratedRunningPlanPreviewUnavailable };

export interface BuildAiGeneratedRunningPlanPreviewOptions {
  aiPreview?: Omit<GenerateAiFirstPlanDraftPreviewOptions, "input" | "inputKind">;
}

export async function buildAiGeneratedRunningPlanPreview(
  input: BuildRunningPlanPreviewInput,
  options: BuildAiGeneratedRunningPlanPreviewOptions = {},
): Promise<AiGeneratedRunningPlanPreviewResult> {
  const authoring = buildAiGeneratedRunningPlanAuthoringInput(input);

  if (!authoring.ok) {
    return {
      ok: false,
      unavailable: buildUnavailable({
        code: authoring.reason,
        message: authoring.message,
        issues: [authoring.message],
        generationTrace: null,
        input,
        normalizedInputSummary: null,
      }),
    };
  }

  const aiPreviewOptions =
    options.aiPreview ??
    buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      authoringInput: authoring.authoringInput,
      today: input.startDate,
    });
  const result = await generateAiFirstPlanDraftPreview({
    input: authoring.authoringInput,
    inputKind: "structured_authoring",
    contractMode: "blueprint",
    blueprintEnforcePreferredLongRunDay: Boolean(scenarioPreferredLongRunDay(input)),
    ...(aiPreviewOptions ?? {}),
  });

  if (!result.ok) {
    return {
      ok: false,
      unavailable: buildUnavailable({
        code:
          result.reason === "structured_input_invalid"
            ? "structured_input_invalid"
            : "ai_generated_plan_unavailable",
        message:
          result.reason === "structured_input_invalid"
            ? "The generated-plan setup could not be normalized. Adjust the goal details."
            : result.message,
        issues: "issues" in result ? result.issues : [result.message],
        generationTrace:
          "metadata" in result && "generationTrace" in result.metadata
            ? result.metadata.generationTrace
            : null,
        input,
        normalizedInputSummary: authoring.normalizedInputSummary,
      }),
    };
  }

  const canonicalPlan = result.canonicalPlan;
  const calendarRows = projectCanonicalPlanToPreviewRows({
    canonicalPlan,
    planGoalIntent: authoring.planGoalIntent,
  });
  const endpointProof = buildEndpointProof(calendarRows, authoring.planGoalIntent);

  return {
    ok: true,
    draft: {
      sourceKind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
      source_kind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
      sourceStatus: result.metadata.status as AiGeneratedRunningPlanSourceStatus,
      source_status: result.metadata.status as AiGeneratedRunningPlanSourceStatus,
      persisted: false,
      mutates: false,
      callsOpenAi: true,
      planVersion: AI_GENERATED_RUNNING_PLAN_PREVIEW_VERSION,
      previewOutcome:
        authoring.planGoalIntent.feasibility.status === "aggressive_or_short_horizon"
          ? "preview_ready_with_warnings"
          : "preview_ready",
      previewWarnings:
        authoring.planGoalIntent.feasibility.status === "aggressive_or_short_horizon"
          ? authoring.planGoalIntent.assumptions
          : [],
      sourceModelVersion: RUNNING_PLAN_SOURCE_MODEL.sourceVersion,
      reviewSafety: {
        persisted: false,
        mutates: false,
        confirmPathImplemented: true,
        callsOpenAi: true,
        confirmCallsOpenAi: false,
        trustedClientRows: false,
      },
      previewInput: toStablePreviewInput(input),
      normalizedInputSummary: authoring.normalizedInputSummary,
      calendarRows,
      endpointProof,
      validation: {
        ok: true,
        issues: [],
        forbiddenOutputGateIdsChecked: ["ai_generated_plan_validated_by_blueprint_contract"],
        rejectedOldBehaviorSignalsChecked: [
          "deterministic_builder_fallback",
          "fake_pace_from_goal_intent",
          "fake_personal_hr",
          "legacy_pair_repeat_fields",
          "backend_slot_scheduler",
          "backend_horizon_extension",
          ...(isAiGeneratedRunningPlanDevFixtureModel(result.metadata.model)
            ? ["local_dev_fixture_not_production_ai_truth"]
            : []),
        ],
      },
      canonicalPlan,
      aiGeneration: result.metadata,
    },
  };
}

function scenarioPreferredLongRunDay(input: BuildRunningPlanPreviewInput) {
  return input.preferredLongRunDay && WEEKDAY_NAMES.includes(input.preferredLongRunDay)
    ? input.preferredLongRunDay
    : null;
}

export function isAiGeneratedRunningPlanPreviewDraft(
  value: unknown,
): value is AiGeneratedRunningPlanPreviewDraft {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as { sourceKind?: unknown }).sourceKind === AI_GENERATED_RUNNING_PLAN_SOURCE_KIND &&
    (value as { canonicalPlan?: unknown }).canonicalPlan != null
  );
}

export function buildAiGeneratedRunningPlanAuthoringInput(input: BuildRunningPlanPreviewInput):
  | {
      ok: true;
      authoringInput: StructuredPlanAuthoringInput;
      planGoalIntent: NormalizedPlanGoalIntent;
      normalizedInputSummary: RunningPlanPreviewNormalizedInputSummary;
    }
  | {
      ok: false;
      reason: "impossible_plan_goal" | "invalid_plan_goal_intent" | "structured_input_invalid";
      message: string;
    } {
  const startDate = normalizeStartDate(input.startDate);
  const rawGoalIntent = resolveGoalIntentInput(input);
  const horizonWeeks = resolveDefaultHorizonWeeks(rawGoalIntent, input.distanceFamily);
  const intent = normalizePlanGoalIntent({
    rawIntent: rawGoalIntent,
    distanceFamily: null,
    startDate,
    horizonWeeks,
  });

  if (!intent.ok) {
    return {
      ok: false,
      reason: intent.reason,
      message: intent.message,
    };
  }

  if (intent.intent.feasibility.status === "impossible_goal") {
    return {
      ok: false,
      reason: "impossible_plan_goal",
      message:
        intent.intent.feasibility.reasons.find((reason) =>
          /not enough time|after the plan start date/i.test(reason),
        ) ?? "This goal does not leave enough time to prepare safely.",
    };
  }

  const fixedRestDays = uniqueWeekdays(input.fixedRestDays ?? []);
  const availableWeekdays = deriveAvailableTrainingWeekdays(fixedRestDays);
  const preferredLongRunDay =
    input.preferredLongRunDay && availableWeekdays.includes(input.preferredLongRunDay)
      ? input.preferredLongRunDay
      : (derivePreferredLongRunDayFallback(fixedRestDays) ?? availableWeekdays.at(-1) ?? "Sunday");
  const daysPerWeek = clampRunningDays(input.daysPerWeek ?? defaultDaysPerWeek(input.runnerLevel));
  const preferredRunningDays = pickEvenly(
    moveWeekdayToEnd(availableWeekdays, preferredLongRunDay),
    Math.min(daysPerWeek, availableWeekdays.length),
  );
  const benchmarkPaceTruth = normalizeBenchmarkPaceTruth(input.benchmark ?? null);
  const inputDistanceBucket = resolveDistanceGoalInputBucket(input, intent.intent);
  const goalType = resolveAuthoringGoalType(intent.intent);
  const targetFinishTime = intent.intent.targetFinishTime?.label ?? null;
  const authoringInput = structuredPlanAuthoringInputSchema.safeParse({
    goal: {
      goalType,
      goalLabel: buildGoalLabel(intent.intent),
      goalStyle: targetFinishTime ? "target_time" : "balanced",
      targetTime: targetFinishTime,
      targetEventName: intent.intent.distance?.label
        ? `${intent.intent.distance.label} plan`
        : "Distance-goal plan",
    },
    schedule: {
      startDate,
      targetDate: intent.intent.targetDate,
      preparationHorizonWeeks: intent.intent.targetDate ? null : horizonWeeks,
    },
    runnerProfile: {
      experienceLevel: mapRunnerLevelToAuthoring(input.runnerLevel),
      baselineSessionsPerWeek: daysPerWeek,
      baselineLongRunKm: baselineLongRunKm(input.runnerLevel, intent.intent),
      baselineLongRunDurationMin: null,
      age: Math.round(input.age),
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "rpe",
    },
    currentLevel: {
      recentResultSummary: benchmarkPaceTruth?.label ?? null,
      recentRaceResults:
        input.benchmark?.kind === "recent_5k_time"
          ? [{ distance: "5K", resultTime: input.benchmark.recent5kTime, resultDate: null }]
          : [],
      recent5kPaceSecondsPerKm: benchmarkPaceTruth?.paceSecondsPerKm ?? null,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays,
      unavailableDays: fixedRestDays,
      maxRunningDaysPerWeek: daysPerWeek,
      allowBackToBackDays: false,
      preferredLongRunDay,
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
    preferences: {
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "none",
      indoorTreadmillOk: false,
      notes: buildAuthoringNotes(intent.intent),
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "effort",
    },
    planGoalIntent: intent.intent,
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
  const resolvedHorizonWeeks = resolveAuthoringHorizonWeeks(parsedAuthoringInput);
  const loadContext =
    input.runnerLevel === "beginner_new_runner" ||
    intent.intent.feasibility.status === "aggressive_or_short_horizon"
      ? "conservative"
      : "standard";

  return {
    ok: true,
    authoringInput: parsedAuthoringInput,
    planGoalIntent: intent.intent,
    normalizedInputSummary: {
      normalizedBy: "backend_ai_generated_plan_authoring_normalizer_v1",
      sourceModelVersion: RUNNING_PLAN_SOURCE_MODEL.sourceVersion,
      age: input.age,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      runnerLevel: input.runnerLevel,
      distanceFamily: inputDistanceBucket,
      daysPerWeek,
      fixedRestDays,
      preferredLongRunDay,
      startDate,
      benchmarkPaceTruth,
      planGoalIntent: intent.intent,
      longRunDaySource:
        input.preferredLongRunDay && input.preferredLongRunDay === preferredLongRunDay
          ? "runner_preference"
          : "backend_fallback",
      trainingWeekdays: preferredRunningDays,
      loadContext,
      horizonSelection: {
        policyVersion: RUNNING_PLAN_HORIZON_POLICY_VERSION,
        horizonWeeks: resolvedHorizonWeeks,
        selectionReason:
          loadContext === "conservative"
            ? "conservative_auto_extended_horizon"
            : "standard_preferred_horizon",
      },
    },
  };
}

function resolveGoalIntentInput(input: BuildRunningPlanPreviewInput): PlanGoalIntentInput {
  if (input.planGoalIntent?.distance) {
    return input.planGoalIntent;
  }

  return {
    ...(input.planGoalIntent ?? {}),
    distance: distanceInputForFamily(input.distanceFamily),
  };
}

function distanceInputForFamily(
  family: RunningPlanDistanceFamily,
): PlanGoalIntentInput["distance"] {
  switch (family) {
    case "10K":
      return { kind: "preset", preset: "10K" };
    case "Half Marathon":
      return { kind: "preset", preset: "Half Marathon" };
    case "Marathon Completion":
      return { kind: "preset", preset: "Marathon" };
  }
}

function resolveDistanceGoalInputBucket(
  input: Pick<BuildRunningPlanPreviewInput, "distanceFamily">,
  intent?: NormalizedPlanGoalIntent,
): RunningPlanDistanceFamily {
  const meters = intent?.distance?.distanceMeters ?? null;

  if (meters != null) {
    if (meters <= 10_000) return "10K";
    if (meters <= 21_100) return "Half Marathon";
    return "Marathon Completion";
  }

  return input.distanceFamily;
}

function resolveAuthoringGoalType(
  intent: NormalizedPlanGoalIntent,
): "10k" | "half_marathon" | "marathon" | "distance_build" {
  if (intent.distance) {
    return "distance_build";
  }

  return "distance_build";
}

function buildGoalLabel(intent: NormalizedPlanGoalIntent) {
  const distance = intent.distance?.label ?? "Distance goal";
  const targetTime = intent.targetFinishTime?.label;

  return targetTime ? `${distance} in ${targetTime}` : distance;
}

function buildAuthoringNotes(intent: NormalizedPlanGoalIntent) {
  const notes = [
    "Use Hito planned-workout blocks with structural Repeat sets and ordered children[].",
    "Goal pace and finish time are outcome intent only, not executable segment targets.",
    ...intent.assumptions,
  ].join(" ");

  return notes.length > 500 ? `${notes.slice(0, 497)}...` : notes;
}

function resolveDefaultHorizonWeeks(
  rawIntent: PlanGoalIntentInput,
  family: RunningPlanDistanceFamily,
) {
  const distance = rawIntent.distance;
  const distanceKm =
    distance?.kind === "custom"
      ? distance.distanceKm
      : distance?.kind === "preset"
        ? presetDistanceKm(distance.preset)
        : presetDistanceKmFromFamily(family);

  if (distanceKm <= 10) return 12;
  if (distanceKm <= 21.1) return 16;
  if (distanceKm <= 42.195) return 20;
  return 24;
}

function presetDistanceKm(preset: "10K" | "Half Marathon" | "Marathon") {
  switch (preset) {
    case "10K":
      return 10;
    case "Half Marathon":
      return 21.1;
    case "Marathon":
      return 42.195;
  }
}

function presetDistanceKmFromFamily(family: RunningPlanDistanceFamily) {
  switch (family) {
    case "10K":
      return 10;
    case "Half Marathon":
      return 21.1;
    case "Marathon Completion":
      return 42.195;
  }
}

function normalizeStartDate(value: string | null | undefined) {
  return value?.trim() || todayIso();
}

function defaultDaysPerWeek(level: RunningPlanRunnerLevel) {
  switch (level) {
    case "beginner_new_runner":
      return 3;
    case "sometimes_runs":
      return 4;
    case "runs_a_lot":
    case "professional_competitive":
      return 5;
  }
}

function clampRunningDays(value: number): RunningPlanPreviewNormalizedInputSummary["daysPerWeek"] {
  return Math.max(
    3,
    Math.min(5, Math.round(value)),
  ) as RunningPlanPreviewNormalizedInputSummary["daysPerWeek"];
}

function mapRunnerLevelToAuthoring(level: RunningPlanRunnerLevel) {
  switch (level) {
    case "beginner_new_runner":
      return "new_runner" as const;
    case "sometimes_runs":
      return "returning_runner" as const;
    case "runs_a_lot":
      return "consistent_runner" as const;
    case "professional_competitive":
      return "experienced_runner" as const;
  }
}

function baselineLongRunKm(level: RunningPlanRunnerLevel, intent: NormalizedPlanGoalIntent) {
  const distanceKm = intent.distance?.distanceKm ?? 10;
  const supportedSpecificityFloorKm = distanceKm > 21.1 ? 11 : distanceKm > 10 ? 9 : 7;

  switch (level) {
    case "beginner_new_runner":
      return Math.min(6, Math.max(3, distanceKm * 0.2));
    case "sometimes_runs":
      return Math.min(10, Math.max(5, distanceKm * 0.28));
    case "runs_a_lot":
      return Math.min(18, Math.max(supportedSpecificityFloorKm, distanceKm * 0.35));
    case "professional_competitive":
      return Math.min(28, Math.max(supportedSpecificityFloorKm, distanceKm * 0.45));
  }
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

function moveWeekdayToEnd(values: readonly WeekdayName[], target: WeekdayName) {
  const withoutTarget = values.filter((value) => value !== target);
  return values.includes(target) ? [...withoutTarget, target] : [...values];
}

function projectCanonicalPlanToPreviewRows({
  canonicalPlan,
  planGoalIntent,
}: {
  canonicalPlan: TrainingPlanV2;
  planGoalIntent: NormalizedPlanGoalIntent;
}): readonly RunningPlanPreviewCalendarRow[] {
  return canonicalPlan.planned_workouts
    .map((workout, index) => {
      const isRestDay = workout.workout_type === "rest";
      const workoutDayKind = isRestDay
        ? RUNNING_PLAN_PREVIEW_REST_DAY_KIND
        : normalizeWorkoutDayKind(workout.source_workout_type);

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
        segments: workout.segments.map((segment, segmentIndex) =>
          projectCanonicalSegmentToPreviewTemplate(workout.workout_id, segment, segmentIndex),
        ),
        endpointGateId: null,
        endpointDistanceMeters: null,
      };
    })
    .map((row, _index, rows) => {
      const finalNonRest = [...rows].reverse().find((candidate) => !candidate.isRestDay);
      if (!finalNonRest || row.rowId !== finalNonRest.rowId) {
        return row;
      }

      return {
        ...row,
        endpointGateId: "ai_generated_goal_distance_endpoint",
        endpointDistanceMeters: planGoalIntent.distance?.distanceMeters ?? null,
      };
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
  };
}

function projectCanonicalPrescription(
  prescription: TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"],
): RunningPlanSegmentPrescription {
  if (!prescription) {
    return {
      mode: "time",
      durationSeconds: { min: 5 * 60, max: 5 * 60 },
      intensityLabel: "easy",
    };
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
        label: child.label,
        guidance: child.guidance,
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
      })),
    };
  }

  return {
    mode: "time",
    durationSeconds: minutesValueToSecondsRange(prescription.duration_min),
    intensityLabel: "reviewed_time",
  };
}

function buildEndpointProof(
  rows: readonly RunningPlanPreviewCalendarRow[],
  intent: NormalizedPlanGoalIntent,
) {
  const finalNonRest = [...rows].reverse().find((row) => !row.isRestDay) ?? rows.at(-1);
  const endpointDistanceMeters = intent.distance?.distanceMeters ?? null;

  return {
    finalRowId: finalNonRest?.rowId ?? "ai-generated-plan-endpoint-unavailable",
    finalDate: finalNonRest?.date ?? todayIso(),
    endpointDistanceMeters,
    endpointMainDistanceMeters: endpointDistanceMeters,
    finalRowIsLastNonRest: true as const,
    rejectedGenericFinalOutputs: ["deterministic_builder_fallback", "metadata_only_endpoint"],
  };
}

function normalizeWorkoutDayKind(value: string | null | undefined): RunningPlanWorkoutDayKind {
  if (
    typeof value === "string" &&
    RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES.includes(value as RunningPlanWorkoutDayKind)
  ) {
    return value as RunningPlanWorkoutDayKind;
  }

  return "easy";
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
    case "work":
      return "work";
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

  return weekdayLong(date);
}

function buildUnavailable(input: {
  code: AiGeneratedRunningPlanPreviewUnavailable["error"]["code"];
  message: string;
  issues: readonly string[];
  generationTrace: AiPlanGenerationLedgerTrace | null;
  input: BuildRunningPlanPreviewInput;
  normalizedInputSummary: RunningPlanPreviewNormalizedInputSummary | null;
}): AiGeneratedRunningPlanPreviewUnavailable {
  return {
    sourceKind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
    source_kind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
    sourceStatus: "preview_unavailable",
    source_status: "preview_unavailable",
    persisted: false,
    mutates: false,
    callsOpenAi: true,
    previewOutcome: classifyUnavailablePreviewOutcome(input),
    error: {
      code: input.code,
      message: input.message,
      issues: input.issues,
    },
    debug: {
      generationTrace: input.generationTrace,
      previewActionTrace: buildPreviewActionTrace(input),
    },
  };
}

function classifyUnavailablePreviewOutcome(input: {
  code: AiGeneratedRunningPlanPreviewUnavailable["error"]["code"];
  message: string;
  issues: readonly string[];
  generationTrace: AiPlanGenerationLedgerTrace | null;
}): AiGeneratedRunningPlanPreviewUnavailable["previewOutcome"] {
  if (input.code === "impossible_plan_goal") {
    return "impossible_goal_with_reason";
  }

  const trace = input.generationTrace;
  const serialized = `${input.message}\n${input.issues.join("\n")}`.toLowerCase();

  if (
    trace?.pipeline.normalizationStatus === "failed" ||
    trace?.pipeline.normalizationStatus === "finalization_failed" ||
    trace?.pipeline.validationIssues.length ||
    /schema|validation|target_date_overrun|running_day_count|goal_family|repeat|canonical/i.test(
      serialized,
    )
  ) {
    return "internal_validation_bug";
  }

  return "ai_unavailable_retryable";
}

function toStablePreviewInput(input: BuildRunningPlanPreviewInput): BuildRunningPlanPreviewInput {
  return JSON.parse(JSON.stringify(input)) as BuildRunningPlanPreviewInput;
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
      fixedRestDayCount: input.input.fixedRestDays?.length ?? 0,
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
      feasibilityStatus: normalizedIntent?.feasibility.status ?? null,
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
          tokenUsage: trace.provider.tokenUsage,
        }
      : null,
    liveOpenAiCalled: Boolean(trace?.provider.paidProviderCall),
    fallbackReason: trace?.pipeline.unavailableReason ?? null,
    validationIssues: trace?.pipeline.validationIssues ?? [],
    repairSummary: trace?.pipeline.repairs ?? [],
  };
}
