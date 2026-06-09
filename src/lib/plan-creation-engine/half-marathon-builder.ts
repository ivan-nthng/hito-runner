import {
  HALF_MARATHON_CUTBACK_WEEKS,
  HALF_MARATHON_ENDPOINT_DISTANCE_METERS,
  HALF_MARATHON_ENDPOINT_WEEK,
  HALF_MARATHON_PLAN_BUILDER_WEEKS,
  resolveHalfMarathonDevelopmentTouch,
  validateHalfMarathonDiversityPolicy,
} from "@/lib/plan-creation-engine/half-marathon-diversity-policy";
import {
  buildRunningPlanCalendarRows,
  endpointTemplateMainDistanceMeters,
  normalizeRunningPlanPreviewInput,
  validateCommonPreviewRows,
  type BuildRunningPlanPreviewInput,
  type RunningPlanPreviewCalendarRow,
  type RunningPlanPreviewNormalizedInputSummary,
  type RunningPlanPreviewUnavailableCode,
  type RunningPlanPreviewValidationStatus,
} from "@/lib/plan-creation-engine/preview-builder-shared";
import {
  resolveRunningPlanEndpointTemplate,
  RUNNING_PLAN_SOURCE_MODEL,
} from "@/lib/plan-creation-engine/source-model";
import type { RunningPlanWorkoutDayKind } from "@/lib/plan-creation-engine/source-types";

export const HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND =
  "running_plan_engine_half_marathon_builder_v1" as const;

export type BuildHalfMarathonPlanPreviewInput = BuildRunningPlanPreviewInput;
export type HalfMarathonPlanCalendarRow = RunningPlanPreviewCalendarRow;
export type HalfMarathonPlanNormalizedInputSummary = RunningPlanPreviewNormalizedInputSummary;

export interface HalfMarathonPlanEndpointProof {
  endpointTemplateFamily: "Half Marathon";
  endpointGateId: string;
  finalRowId: string;
  finalDate: string;
  finalWorkoutDayKind: "final_selected_distance_day";
  endpointDistanceMeters: 21100;
  endpointMainDistanceMeters: 21100;
  finalRowIsLastNonRest: true;
  rejectedGenericFinalOutputs: readonly string[];
}

export interface HalfMarathonPlanPreviewDraft {
  sourceKind: typeof HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND;
  source_kind: typeof HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND;
  sourceStatus: "preview_ready";
  source_status: "preview_ready";
  persisted: false;
  mutates: false;
  callsOpenAi: false;
  planFamily: "Half Marathon";
  planVersion: typeof HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND;
  sourceModelVersion: typeof RUNNING_PLAN_SOURCE_MODEL.sourceVersion;
  reviewSafety: {
    persisted: false;
    mutates: false;
    confirmPathImplemented: false;
    callsOpenAi: false;
  };
  normalizedInputSummary: HalfMarathonPlanNormalizedInputSummary;
  calendarRows: readonly HalfMarathonPlanCalendarRow[];
  endpointProof: HalfMarathonPlanEndpointProof;
  validation: RunningPlanPreviewValidationStatus & { ok: true };
}

export interface HalfMarathonPlanBuilderUnavailable {
  sourceKind: typeof HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND;
  source_kind: typeof HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND;
  sourceStatus: "preview_unavailable";
  source_status: "preview_unavailable";
  persisted: false;
  mutates: false;
  callsOpenAi: false;
  planFamily: "Half Marathon";
  error: {
    code: RunningPlanPreviewUnavailableCode;
    message: string;
  };
  normalizedInputSummary?: HalfMarathonPlanNormalizedInputSummary;
  validation?: RunningPlanPreviewValidationStatus;
}

export type HalfMarathonPlanBuilderResult =
  | { ok: true; draft: HalfMarathonPlanPreviewDraft }
  | { ok: false; unavailable: HalfMarathonPlanBuilderUnavailable };

export function buildHalfMarathonPlanPreviewDraft(
  input: BuildHalfMarathonPlanPreviewInput,
): HalfMarathonPlanBuilderResult {
  const normalized = normalizeRunningPlanPreviewInput({
    input,
    family: "Half Marathon",
    sourceKind: HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
    allowRunnerLevel: (runnerLevel) => runnerLevel !== "beginner_new_runner",
    blockedRunnerLevelMessage:
      "Half Marathon preview is not available for beginner_new_runner in deterministic v1.",
  });
  if (!normalized.ok) {
    return {
      ok: false,
      unavailable: buildUnavailable(normalized.error.code, normalized.error.message),
    };
  }

  const calendarRows = buildRunningPlanCalendarRows({
    input: normalized.input,
    family: "Half Marathon",
    horizonWeeks: HALF_MARATHON_PLAN_BUILDER_WEEKS,
    rowIdPrefix: "half-marathon",
    recoveryAfterKinds: ["long_run", "cutback_long_run", "threshold", "intervals", "hills"],
    selectWorkoutDayKind: ({
      weekNumber,
      weekday,
      longRunDay,
      nextAfterLongRunDay,
      developmentWeekday,
      runnerLevel,
      loadContext,
    }) => {
      if (weekday === longRunDay) {
        if (weekNumber === HALF_MARATHON_ENDPOINT_WEEK) {
          return "final_selected_distance_day";
        }

        return HALF_MARATHON_CUTBACK_WEEKS.includes(weekNumber as never)
          ? "cutback_long_run"
          : "long_run";
      }

      if (weekday === nextAfterLongRunDay && weekNumber > 1) {
        return "recovery";
      }

      const developmentTouch = resolveHalfMarathonDevelopmentTouch({
        runnerLevel,
        loadContext,
        weekNumber,
      });
      if (
        weekNumber < HALF_MARATHON_ENDPOINT_WEEK &&
        weekday === developmentWeekday &&
        developmentTouch
      ) {
        return developmentTouch;
      }

      return "easy";
    },
  });
  const endpointProof = buildHalfMarathonEndpointProof(calendarRows);
  const validation = validateHalfMarathonPlanPreview({
    calendarRows,
    endpointProof,
    normalizedInputSummary: normalized.input,
  });

  if (!validation.ok || !endpointProof) {
    return {
      ok: false,
      unavailable: buildUnavailable(
        "builder_validation_failed",
        "The Half Marathon preview did not satisfy endpoint or watch-executable gates.",
        normalized.input,
        validation,
      ),
    };
  }

  return {
    ok: true,
    draft: {
      sourceKind: HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
      source_kind: HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
      sourceStatus: "preview_ready",
      source_status: "preview_ready",
      persisted: false,
      mutates: false,
      callsOpenAi: false,
      planFamily: "Half Marathon",
      planVersion: HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
      sourceModelVersion: RUNNING_PLAN_SOURCE_MODEL.sourceVersion,
      reviewSafety: {
        persisted: false,
        mutates: false,
        confirmPathImplemented: false,
        callsOpenAi: false,
      },
      normalizedInputSummary: normalized.input,
      calendarRows,
      endpointProof,
      validation: { ...validation, ok: true },
    },
  };
}

function buildHalfMarathonEndpointProof(
  rows: readonly HalfMarathonPlanCalendarRow[],
): HalfMarathonPlanEndpointProof | null {
  const finalNonRestRow = rows.filter((row) => !row.isRestDay).at(-1);
  const endpointTemplate = resolveRunningPlanEndpointTemplate("Half Marathon");
  const endpointMainDistanceMeters = endpointTemplateMainDistanceMeters(endpointTemplate);

  if (
    !finalNonRestRow ||
    finalNonRestRow.workoutDayKind !== "final_selected_distance_day" ||
    endpointTemplate.endpointDistanceMeters !== HALF_MARATHON_ENDPOINT_DISTANCE_METERS ||
    endpointMainDistanceMeters !== HALF_MARATHON_ENDPOINT_DISTANCE_METERS
  ) {
    return null;
  }

  return {
    endpointTemplateFamily: "Half Marathon",
    endpointGateId: endpointTemplate.endpointGateId,
    finalRowId: finalNonRestRow.rowId,
    finalDate: finalNonRestRow.date,
    finalWorkoutDayKind: "final_selected_distance_day",
    endpointDistanceMeters: HALF_MARATHON_ENDPOINT_DISTANCE_METERS,
    endpointMainDistanceMeters: HALF_MARATHON_ENDPOINT_DISTANCE_METERS,
    finalRowIsLastNonRest: true,
    rejectedGenericFinalOutputs:
      RUNNING_PLAN_SOURCE_MODEL.endpointGates["Half Marathon"].rejectedFinalOutputs,
  };
}

function validateHalfMarathonPlanPreview({
  calendarRows,
  endpointProof,
  normalizedInputSummary,
}: {
  calendarRows: readonly HalfMarathonPlanCalendarRow[];
  endpointProof: HalfMarathonPlanEndpointProof | null;
  normalizedInputSummary: HalfMarathonPlanNormalizedInputSummary;
}): RunningPlanPreviewValidationStatus {
  const issues: string[] = [];

  if (!endpointProof) {
    issues.push("Final Half Marathon endpoint proof is missing.");
  }
  validateCommonPreviewRows({
    rows: calendarRows,
    fixedRestDays: normalizedInputSummary.fixedRestDays,
    expectedFinalWorkoutKind: "final_selected_distance_day",
    expectedEndpointDistanceMeters: HALF_MARATHON_ENDPOINT_DISTANCE_METERS,
    familyLabel: "Half Marathon",
    issues,
  });
  issues.push(
    ...validateHalfMarathonDiversityPolicy({
      runnerLevel: normalizedInputSummary.runnerLevel,
      loadContext: normalizedInputSummary.loadContext,
      rows: calendarRows,
    }),
  );

  return {
    ok: issues.length === 0,
    issues,
    forbiddenOutputGateIdsChecked: RUNNING_PLAN_SOURCE_MODEL.forbiddenOutputGates.map(
      (gate) => gate.gateId,
    ),
    rejectedOldBehaviorSignalsChecked: [
      "final_generic_long_run",
      "final_readiness_marker",
      "metadata_only_endpoint",
      "fake_precise_pace",
      "fake_personal_hr",
      "user_provided_5k_benchmark_dependency",
      "watch_no_watch_gate",
      "beginner_half_allowed",
      "sometimes_runs_threshold",
      "higher_support_no_threshold",
      "support_only_half_preview",
    ],
  };
}

function buildUnavailable(
  code: RunningPlanPreviewUnavailableCode,
  message: string,
  normalizedInputSummary?: HalfMarathonPlanNormalizedInputSummary,
  validation?: RunningPlanPreviewValidationStatus,
): HalfMarathonPlanBuilderUnavailable {
  return {
    sourceKind: HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
    source_kind: HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
    sourceStatus: "preview_unavailable",
    source_status: "preview_unavailable",
    persisted: false,
    mutates: false,
    callsOpenAi: false,
    planFamily: "Half Marathon",
    error: { code, message },
    normalizedInputSummary,
    validation,
  };
}
