import {
  generateAiFirstPlanDraftPreview,
  type GenerateAiFirstPlanDraftPreviewOptions,
  type AiFirstPlanDraftPreviewMetadata,
} from "@/lib/ai-first-plan-draft-service";
import { AI_AUTHORED_PLAN_FIRST_SOURCE_KIND } from "@/lib/ai-authored-plan-first-compiler";
import {
  recordAiPlanGenerationPreflightFailure,
  updateAiPlanGenerationLedgerTrace,
  type AiPlanGenerationLedgerTrace,
} from "@/lib/ai-plan-generation-ledger";
import {
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  isAiGeneratedRunningPlanDevFixtureEnabled,
} from "@/lib/ai-generated-running-plan-dev-fixture";
import {
  parseDurationSeconds,
  parsePaceSecondsPerKm,
  uniqueWeekdays,
} from "@/lib/first-plan-authoring-utils";
import { buildImportedPlanSeed, type TrainingPlanV2 } from "@/lib/imported-plan";
import {
  normalizePlanGoalIntent,
  type NormalizedPlanGoalIntent,
} from "@/lib/plan-creation-engine/plan-goal-intent";
import { collectSelectedDistanceEndpointIssues } from "@/lib/plan-creation-engine/selected-distance-endpoint";
import type {
  BuildRunningPlanPreviewInput,
  RunningPlanPreviewCalendarRow,
  RunningPlanPreviewNormalizedInputSummary,
} from "@/lib/plan-creation-engine/preview-builder-shared";
import { RUNNING_PLAN_PREVIEW_REST_DAY_KIND } from "@/lib/plan-creation-engine/preview-builder-shared";
import {
  RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES,
  type RunningPlanBenchmarkPaceTruth,
  type RunningPlanRunnerLevel,
  type RunningPlanSegmentPrescription,
  type RunningPlanWatchExecutableSegmentTemplate,
  type RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import { deriveAvailableTrainingWeekdays } from "@/lib/runner-training-preferences";
import {
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "@/lib/structured-plan-authoring-schema";
import { todayIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";
import type { WorkoutDocument } from "@/lib/workout-document";
import type { RunnerPlanAuthoringProfileSnapshot } from "@/lib/user-settings-actions";

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
  | "review_refusal";

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
  previewOutcome: Extract<AiGeneratedRunningPlanPreviewOutcome, "preview_ready">;
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
  workoutDocuments: readonly WorkoutDocument[];
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
    | "invalid_structural_input"
    | "provider_runtime_failure"
    | "provider_incomplete_output"
    | "malformed_provider_output"
    | "compiler_rejection"
    | "review_refusal"
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
  runnerProfileSnapshot?: RunnerPlanAuthoringProfileSnapshot;
  qaFixtureAuthorized?: boolean;
}

export async function buildAiGeneratedRunningPlanPreview(
  input: BuildRunningPlanPreviewInput,
  options: BuildAiGeneratedRunningPlanPreviewOptions = {},
): Promise<AiGeneratedRunningPlanPreviewResult> {
  const authoring = buildAiGeneratedRunningPlanAuthoringInput(input, options.runnerProfileSnapshot);

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

  const devFixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: authoring.authoringInput,
    qaFixtureAuthorized: options.qaFixtureAuthorized === true,
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
    authoring.normalizedInputSummary,
    canonicalPlan,
  );
  let calendarRows: readonly RunningPlanPreviewCalendarRow[];
  let workoutDocuments: readonly WorkoutDocument[];
  try {
    calendarRows = projectCanonicalPlanToPreviewRows(canonicalPlan);
    workoutDocuments = buildImportedPlanSeed(canonicalPlan).workouts;
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
    distanceMeters: authoring.planGoalIntent.distance?.distanceMeters ?? null,
    targetDate: canonicalPlan.target_date ?? null,
    endpointProof,
  });
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
      previewOutcome: "preview_ready",
      reviewSafety: {
        persisted: false,
        mutates: false,
        confirmPathImplemented: true,
        callsOpenAi: true,
        confirmCallsOpenAi: false,
        trustedClientRows: false,
      },
      previewInput: toStablePreviewInput(input),
      normalizedInputSummary,
      calendarRows,
      workoutDocuments,
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
  runnerProfileSnapshot?: RunnerPlanAuthoringProfileSnapshot | null,
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
  if (!runnerProfileSnapshot) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      message: "Save and accept the runner baseline before creating a generated plan.",
    };
  }

  if (!matchesRunnerProfileSnapshot(input, runnerProfileSnapshot)) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      message: "The runner baseline changed. Save it before creating a generated plan.",
    };
  }

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

  const fixedRestDays = uniqueWeekdays(input.fixedRestDays ?? []);
  const availableWeekdays = deriveAvailableTrainingWeekdays(fixedRestDays);
  const daysPerWeek = input.daysPerWeek;
  if (daysPerWeek == null) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      message: "Choose the maximum running days per week before creating a generated plan.",
    };
  }
  if (availableWeekdays.length === 0 || daysPerWeek > availableWeekdays.length) {
    return {
      ok: false,
      reason: "structured_input_invalid",
      message: "Running days per week must fit the weekdays that are not fixed rest days.",
    };
  }
  const preferredLongRunDay =
    input.preferredLongRunDay && availableWeekdays.includes(input.preferredLongRunDay)
      ? input.preferredLongRunDay
      : null;
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
      heartRateProfile: runnerProfileSnapshot.heartRateProfile,
    },
    availability: {
      fixedRestDays,
      maxRunningDaysPerWeek: daysPerWeek,
      preferredLongRunDay,
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
      runnerProfileSnapshot,
    },
  };
}

function matchesRunnerProfileSnapshot(
  input: BuildRunningPlanPreviewInput,
  snapshot: RunnerPlanAuthoringProfileSnapshot,
) {
  return (
    input.age === snapshot.age &&
    input.weightKg === snapshot.weightKg &&
    input.heightCm === snapshot.heightCm &&
    input.runnerLevel === planRunnerLevelForFitness(snapshot.fitnessLevel)
  );
}

function planRunnerLevelForFitness(
  fitnessLevel: RunnerPlanAuthoringProfileSnapshot["fitnessLevel"],
): RunningPlanRunnerLevel {
  switch (fitnessLevel) {
    case "new_to_running":
      return "beginner_new_runner";
    case "beginner":
    case "custom":
      return "sometimes_runs";
    case "running_regularly":
      return "runs_a_lot";
    case "performance_focused":
      return "professional_competitive";
  }
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
}): AiGeneratedRunningPlanPreviewUnavailable {
  return {
    sourceKind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
    source_kind: AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
    sourceStatus: "preview_unavailable",
    source_status: "preview_unavailable",
    persisted: false,
    mutates: false,
    callsOpenAi: true,
    previewOutcome: input.previewOutcome,
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
    unavailableReason === "ai_authored_plan_first_provider_schema_invalid"
  ) {
    return "malformed_provider_output";
  }

  if (unavailableReason === "ai_authored_plan_first_rejected_before_review") {
    return "compiler_rejection";
  }

  return "provider_runtime_failure";
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
