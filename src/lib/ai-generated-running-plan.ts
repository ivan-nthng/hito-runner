import {
  generateAiFirstPlanDraftPreview,
  type GenerateAiFirstPlanDraftPreviewOptions,
  type AiFirstPlanDraftPreviewMetadata,
} from "@/lib/ai-first-plan-draft-service";
import { AI_AUTHORED_PLAN_FIRST_SOURCE_KIND } from "@/lib/ai-authored-plan-first-compiler";
import type { AiPlanGenerationLedgerTrace } from "@/lib/ai-plan-generation-ledger";
import {
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  isAiGeneratedRunningPlanDevFixtureEnabled,
} from "@/lib/ai-generated-running-plan-dev-fixture";
import {
  parseDurationSeconds,
  parsePaceSecondsPerKm,
  pickEvenly,
  uniqueWeekdays,
} from "@/lib/first-plan-authoring-utils";
import {
  collectRunnerFacingCanonicalRichnessIssues,
  isHardRunnerFacingRichnessIssue,
} from "@/lib/plan-creation-engine";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import {
  normalizePlanGoalIntent,
  type PlanGoalIntentInput,
  type NormalizedPlanGoalIntent,
} from "@/lib/plan-creation-engine/plan-goal-intent";
import {
  collectSelectedDistanceEndpointIssues,
  resolveSelectedDistanceQualityFamily,
} from "@/lib/plan-creation-engine/selected-distance-endpoint";
import type {
  BuildRunningPlanPreviewInput,
  RunningPlanPreviewCalendarRow,
  RunningPlanPreviewNormalizedInputSummary,
} from "@/lib/plan-creation-engine/preview-builder-shared";
import { RUNNING_PLAN_PREVIEW_REST_DAY_KIND } from "@/lib/plan-creation-engine/preview-builder-shared";
import {
  RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES,
  type RunningPlanBenchmarkPaceTruth,
  type RunningPlanDistanceFamily,
  type RunningPlanRunnerLevel,
  type RunningPlanSegmentPrescription,
  type RunningPlanWatchExecutableSegmentTemplate,
  type RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import {
  deriveAvailableTrainingWeekdays,
  derivePreferredLongRunDayFallback,
  runningWeekdaysRequireBackToBackDays,
} from "@/lib/runner-training-preferences";
import {
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "@/lib/structured-plan-authoring";
import { todayIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export const AI_GENERATED_RUNNING_PLAN_SOURCE_KIND = AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;
export const AI_GENERATED_RUNNING_PLAN_PREVIEW_VERSION = "ai_generated_running_plan_v1" as const;

type AiGeneratedRunningPlanPreviewSourceKind = typeof AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;

export type AiGeneratedRunningPlanPreviewOutcome =
  | "preview_ready"
  | "preview_ready_with_warnings"
  | "impossible_goal_with_reason"
  | "ai_unavailable_retryable"
  | "internal_validation_bug";

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
  callsOpenAi: true;
  planVersion: typeof AI_GENERATED_RUNNING_PLAN_PREVIEW_VERSION;
  previewOutcome: Extract<
    AiGeneratedRunningPlanPreviewOutcome,
    "preview_ready" | "preview_ready_with_warnings"
  >;
  previewWarnings: readonly string[];
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
    tokenUsage: AiPlanGenerationLedgerTrace["usage"];
  } | null;
  liveOpenAiCalled: boolean;
  unavailableReason: string | null;
  validationIssues: readonly string[];
  normalizationDiagnostics: readonly string[];
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
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: authoring.reason,
        message: authoring.message,
        issues: [authoring.message],
        generationTrace: null,
        input,
        normalizedInputSummary: null,
      }),
    };
  }

  const devFixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: authoring.authoringInput,
    today: input.startDate,
  });
  const aiPreviewOptions =
    devFixtureOptions != null
      ? {
          ...(options.aiPreview ?? {}),
          ...devFixtureOptions,
          signal: options.aiPreview?.signal,
          generationLedger: options.aiPreview?.generationLedger,
        }
      : options.aiPreview;
  const result = await generateAiFirstPlanDraftPreview({
    input: authoring.authoringInput,
    inputKind: "structured_authoring",
    ...(aiPreviewOptions ?? {}),
  });

  if (!result.ok) {
    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
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
  const endpointIssues = collectPreviewEndpointProofIssues({
    rows: calendarRows,
    intent: authoring.planGoalIntent,
    endpointProof,
  });
  const runnerFacingRichnessIssues =
    canonicalPlan.source_kind === AI_AUTHORED_PLAN_FIRST_SOURCE_KIND
      ? collectRunnerFacingCanonicalRichnessIssues({
          distanceMeters: authoring.planGoalIntent.distance?.distanceMeters ?? null,
          rows: canonicalPlan.planned_workouts,
        })
      : [];
  const hardRunnerFacingRichnessIssues = runnerFacingRichnessIssues.filter(
    isHardRunnerFacingRichnessIssue,
  );
  const runnerFacingRichnessWarnings = runnerFacingRichnessIssues
    .filter((issue) => !isHardRunnerFacingRichnessIssue(issue))
    .map((issue) => `Coach-quality note: ${issue}`);
  const previewWarnings = [
    ...(authoring.planGoalIntent.feasibility.status === "aggressive_or_short_horizon"
      ? authoring.planGoalIntent.assumptions
      : []),
    ...runnerFacingRichnessWarnings,
  ];

  if (hardRunnerFacingRichnessIssues.length > 0) {
    return {
      ok: false,
      unavailable: buildAiGeneratedRunningPlanPreviewUnavailable({
        code: "ai_generated_plan_unavailable",
        message:
          "The AI-authored distance-goal plan failed Hito's hard runner-facing safety gates.",
        issues: hardRunnerFacingRichnessIssues,
        generationTrace: result.metadata.generationTrace,
        input,
        normalizedInputSummary: authoring.normalizedInputSummary,
      }),
    };
  }

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
      previewOutcome: previewWarnings.length > 0 ? "preview_ready_with_warnings" : "preview_ready",
      previewWarnings,
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
        issues: endpointIssues,
        forbiddenOutputGateIdsChecked: ["ai_authored_plan_first_compiled_to_training_plan_v2"],
      },
      canonicalPlan,
      aiGeneration: result.metadata,
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
    (value as { canonicalPlan?: unknown }).canonicalPlan != null
  );
}

function isAiGeneratedRunningPlanPreviewSourceKind(
  value: unknown,
): value is AiGeneratedRunningPlanPreviewSourceKind {
  return value === AI_AUTHORED_PLAN_FIRST_SOURCE_KIND;
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
  const normalizedIntent = normalizePlanGoalIntent({
    rawIntent: rawGoalIntent,
    distanceFamily: null,
    startDate,
    horizonWeeks: null,
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

  const fixedRestDays = uniqueWeekdays(input.fixedRestDays ?? []);
  const availableWeekdays = deriveAvailableTrainingWeekdays(fixedRestDays);
  const preferredLongRunDay =
    input.preferredLongRunDay && availableWeekdays.includes(input.preferredLongRunDay)
      ? input.preferredLongRunDay
      : (derivePreferredLongRunDayFallback(fixedRestDays) ?? availableWeekdays.at(-1) ?? "Sunday");
  const daysPerWeek = clampRunningDays(input.daysPerWeek ?? defaultDaysPerWeek(input.runnerLevel));
  const benchmarkPaceTruth = normalizeBenchmarkPaceTruth(input.benchmark ?? null);
  const planGoalIntent = normalizedIntent.intent;

  if (planGoalIntent.feasibility.status === "impossible_goal") {
    return {
      ok: false,
      reason: "impossible_plan_goal",
      message:
        planGoalIntent.feasibility.reasons.at(0) ??
        "This goal is too compressed for Hito to create an honest training plan.",
    };
  }

  const preferredRunningDays = pickEvenly(
    moveWeekdayToEnd(availableWeekdays, preferredLongRunDay),
    Math.min(daysPerWeek, availableWeekdays.length),
  );
  const allowBackToBackDays = runningWeekdaysRequireBackToBackDays(preferredRunningDays);
  const legacyStructuredGoalType = "distance_build";
  const targetFinishTime = planGoalIntent.targetFinishTime?.label ?? null;
  const authoringInput = structuredPlanAuthoringInputSchema.safeParse({
    goal: {
      // Structured authoring still requires a legacy goalType adapter. Generated-plan truth is planGoalIntent.distance.
      goalType: legacyStructuredGoalType,
      goalLabel: buildGoalLabel(planGoalIntent),
      goalStyle: targetFinishTime ? "target_time" : "balanced",
      targetTime: targetFinishTime,
      targetEventName: planGoalIntent.distance?.label
        ? `${planGoalIntent.distance.label} plan`
        : "Distance-goal plan",
    },
    schedule: {
      startDate,
      targetDate: planGoalIntent.targetDate,
      preparationHorizonWeeks: null,
    },
    runnerProfile: {
      experienceLevel: mapRunnerLevelToAuthoring(input.runnerLevel),
      baselineSessionsPerWeek: daysPerWeek,
      baselineLongRunKm: null,
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
      allowBackToBackDays,
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
      notes: buildAuthoringNotes(planGoalIntent),
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "effort",
    },
    planGoalIntent,
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
  const noBenchmarkLongDistanceTargetIntent = Boolean(
    benchmarkPaceTruth === null &&
    (planGoalIntent.distance?.distanceMeters ?? 0) > 10_000 &&
    (planGoalIntent.targetFinishTime || planGoalIntent.targetOutcomePace),
  );
  const loadContext =
    input.runnerLevel === "beginner_new_runner" ||
    planGoalIntent.feasibility.status === "aggressive_or_short_horizon" ||
    noBenchmarkLongDistanceTargetIntent ||
    (benchmarkPaceTruth === null && input.runnerLevel === "sometimes_runs")
      ? "conservative"
      : "standard";

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
      distanceFamily: resolveSelectedDistanceQualityFamily({
        distanceMeters: planGoalIntent.distance.distanceMeters,
        fallbackFamily: input.distanceFamily ?? null,
      }),
      daysPerWeek,
      fixedRestDays,
      preferredLongRunDay,
      startDate,
      benchmarkPaceTruth,
      planGoalIntent,
      longRunDaySource:
        input.preferredLongRunDay && input.preferredLongRunDay === preferredLongRunDay
          ? "runner_preference"
          : "backend_default",
      trainingWeekdays: preferredRunningDays,
      loadContext,
    },
  };
}

function resolveGoalIntentInput(input: BuildRunningPlanPreviewInput): PlanGoalIntentInput {
  if (input.planGoalIntent?.distance) {
    return input.planGoalIntent;
  }

  return {
    ...(input.planGoalIntent ?? {}),
    distance: distanceInputForFamily(input.distanceFamily ?? null),
  };
}

function distanceInputForFamily(
  family: RunningPlanDistanceFamily | null,
): PlanGoalIntentInput["distance"] {
  if (!family) {
    return null;
  }

  switch (family) {
    case "10K":
      return { kind: "preset", preset: "10K" };
    case "Half Marathon":
      return { kind: "preset", preset: "Half Marathon" };
    case "Marathon Completion":
      return { kind: "preset", preset: "Marathon" };
  }
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
        : normalizeWorkoutDayKind({
            sourceWorkoutType: workout.source_workout_type,
            workoutFamily: workout.workout_family,
            workoutIdentity: workout.workout_identity,
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
      };
    })
    .map((row, _index, rows) => {
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
  if (!prescription || prescription.mode === "none") {
    throw new Error(
      "AI-authored canonical workout reached preview projection without displayable prescription structure.",
    );
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
  intent: NormalizedPlanGoalIntent;
  endpointProof: AiGeneratedRunningPlanPreviewDraft["endpointProof"];
}) {
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
    expectedDistanceMeters: input.intent.distance?.distanceMeters ?? null,
    targetDate: input.intent.targetDate,
    proof: input.endpointProof,
    useFinalNonRestWhenTargetDateMissing: true,
    requireEndpointIdentity: true,
  }).map((issue) => `${issue.code}: ${issue.message}`);
}

function previewRowMainDistanceMeters(row: RunningPlanPreviewCalendarRow) {
  const totalMeters = row.segments.reduce(
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
}: {
  sourceWorkoutType: string | null | undefined;
  workoutFamily: string | null | undefined;
  workoutIdentity: string | null | undefined;
}): RunningPlanWorkoutDayKind {
  if (
    typeof sourceWorkoutType === "string" &&
    RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES.includes(sourceWorkoutType as RunningPlanWorkoutDayKind)
  ) {
    return sourceWorkoutType as RunningPlanWorkoutDayKind;
  }

  if (workoutIdentity === "easy_run_with_strides") return "strides";
  if (workoutIdentity === "cutback_long_run") return "cutback_long_run";

  switch (workoutFamily) {
    case "recovery":
      return "recovery";
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
      return /long|endurance|time_on_feet/.test(workoutIdentity ?? "") ? "long_run" : "hills";
  }

  throw new Error(
    `AI-authored canonical workout reached preview projection with unsupported workout model: ${String(sourceWorkoutType)} / ${String(workoutFamily)} / ${String(workoutIdentity)}.`,
  );
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

export function buildAiGeneratedRunningPlanPreviewUnavailable(input: {
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
    /schema|validation|target_date_overrun|running_day_count|goal_family|runner[-_ ]facing|richness|coach|quality[-_ ]gate|prescription|dose|repeat|canonical|selected[-_]distance|endpoint/i.test(
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
          tokenUsage: trace.usage,
        }
      : null,
    liveOpenAiCalled: Boolean(trace?.provider.paidProviderCall),
    unavailableReason: trace?.pipeline.unavailableReason ?? null,
    validationIssues: trace?.pipeline.validationIssues ?? [],
    normalizationDiagnostics: [],
  };
}
