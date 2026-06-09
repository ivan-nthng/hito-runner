import {
  MARATHON_BASE_CUTBACK_WEEKS,
  MARATHON_BASE_ENDPOINT_WEEK,
  MARATHON_BASE_PLAN_BUILDER_WEEKS,
  resolveMarathonBaseDevelopmentTouch,
  validateMarathonBaseDiversityPolicy,
} from "@/lib/plan-creation-engine/marathon-base-diversity-policy";
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

export const MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND =
  "running_plan_engine_marathon_base_builder_v1" as const;

export type BuildMarathonBasePlanPreviewInput = BuildRunningPlanPreviewInput;
export type MarathonBasePlanCalendarRow = RunningPlanPreviewCalendarRow;
export type MarathonBasePlanNormalizedInputSummary = RunningPlanPreviewNormalizedInputSummary;

export interface MarathonBasePlanEndpointProof {
  endpointTemplateFamily: "Marathon Base";
  endpointGateId: string;
  finalRowId: string;
  finalDate: string;
  finalWorkoutDayKind: "marathon_base_endpoint";
  endpointDistanceMeters: null;
  endpointMainDistanceMeters: null;
  finalRowIsLastNonRest: true;
  mustNotClaimFullMarathonReadiness: true;
  rejectedGenericFinalOutputs: readonly string[];
}

export interface MarathonBasePlanPreviewDraft {
  sourceKind: typeof MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND;
  source_kind: typeof MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND;
  sourceStatus: "preview_ready";
  source_status: "preview_ready";
  persisted: false;
  mutates: false;
  callsOpenAi: false;
  planFamily: "Marathon Base";
  planVersion: typeof MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND;
  sourceModelVersion: typeof RUNNING_PLAN_SOURCE_MODEL.sourceVersion;
  reviewSafety: {
    persisted: false;
    mutates: false;
    confirmPathImplemented: false;
    callsOpenAi: false;
  };
  normalizedInputSummary: MarathonBasePlanNormalizedInputSummary;
  calendarRows: readonly MarathonBasePlanCalendarRow[];
  endpointProof: MarathonBasePlanEndpointProof;
  validation: RunningPlanPreviewValidationStatus & { ok: true };
}

export interface MarathonBasePlanBuilderUnavailable {
  sourceKind: typeof MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND;
  source_kind: typeof MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND;
  sourceStatus: "preview_unavailable";
  source_status: "preview_unavailable";
  persisted: false;
  mutates: false;
  callsOpenAi: false;
  planFamily: "Marathon Base";
  error: {
    code: RunningPlanPreviewUnavailableCode;
    message: string;
  };
  normalizedInputSummary?: MarathonBasePlanNormalizedInputSummary;
  validation?: RunningPlanPreviewValidationStatus;
}

export type MarathonBasePlanBuilderResult =
  | { ok: true; draft: MarathonBasePlanPreviewDraft }
  | { ok: false; unavailable: MarathonBasePlanBuilderUnavailable };

export function buildMarathonBasePlanPreviewDraft(
  input: BuildMarathonBasePlanPreviewInput,
): MarathonBasePlanBuilderResult {
  const normalized = normalizeRunningPlanPreviewInput({
    input,
    family: "Marathon Base",
    sourceKind: MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
    allowRunnerLevel: (runnerLevel) => runnerLevel !== "beginner_new_runner",
    blockedRunnerLevelMessage:
      "Marathon Base preview is not available for beginner_new_runner in deterministic v1.",
  });
  if (!normalized.ok) {
    return {
      ok: false,
      unavailable: buildUnavailable(normalized.error.code, normalized.error.message),
    };
  }

  const calendarRows = buildRunningPlanCalendarRows({
    input: normalized.input,
    family: "Marathon Base",
    horizonWeeks: MARATHON_BASE_PLAN_BUILDER_WEEKS,
    rowIdPrefix: "marathon-base",
    recoveryAfterKinds: ["long_run", "cutback_long_run", "threshold", "hills"],
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
        if (weekNumber === MARATHON_BASE_ENDPOINT_WEEK) {
          return "marathon_base_endpoint";
        }

        return MARATHON_BASE_CUTBACK_WEEKS.includes(weekNumber as never)
          ? "cutback_long_run"
          : "long_run";
      }

      if (weekday === nextAfterLongRunDay && weekNumber > 1) {
        return "recovery";
      }

      const developmentTouch = resolveMarathonBaseDevelopmentTouch({
        runnerLevel,
        loadContext,
        weekNumber,
      });
      if (
        weekNumber < MARATHON_BASE_ENDPOINT_WEEK &&
        weekday === developmentWeekday &&
        developmentTouch
      ) {
        return developmentTouch;
      }

      return "easy";
    },
  });
  const endpointProof = buildMarathonBaseEndpointProof(calendarRows);
  const validation = validateMarathonBasePlanPreview({
    calendarRows,
    endpointProof,
    normalizedInputSummary: normalized.input,
  });

  if (!validation.ok || !endpointProof) {
    return {
      ok: false,
      unavailable: buildUnavailable(
        "builder_validation_failed",
        "The Marathon Base preview did not satisfy endpoint or watch-executable gates.",
        normalized.input,
        validation,
      ),
    };
  }

  return {
    ok: true,
    draft: {
      sourceKind: MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
      source_kind: MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
      sourceStatus: "preview_ready",
      source_status: "preview_ready",
      persisted: false,
      mutates: false,
      callsOpenAi: false,
      planFamily: "Marathon Base",
      planVersion: MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
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

function buildMarathonBaseEndpointProof(
  rows: readonly MarathonBasePlanCalendarRow[],
): MarathonBasePlanEndpointProof | null {
  const finalNonRestRow = rows.filter((row) => !row.isRestDay).at(-1);
  const endpointTemplate = resolveRunningPlanEndpointTemplate("Marathon Base");
  const endpointMainDistanceMeters = endpointTemplateMainDistanceMeters(endpointTemplate);

  if (
    !finalNonRestRow ||
    finalNonRestRow.workoutDayKind !== "marathon_base_endpoint" ||
    endpointTemplate.endpointDistanceMeters !== null ||
    endpointMainDistanceMeters !== null ||
    !endpointTemplate.mustNotClaimFullMarathonReadiness
  ) {
    return null;
  }

  return {
    endpointTemplateFamily: "Marathon Base",
    endpointGateId: endpointTemplate.endpointGateId,
    finalRowId: finalNonRestRow.rowId,
    finalDate: finalNonRestRow.date,
    finalWorkoutDayKind: "marathon_base_endpoint",
    endpointDistanceMeters: null,
    endpointMainDistanceMeters: null,
    finalRowIsLastNonRest: true,
    mustNotClaimFullMarathonReadiness: true,
    rejectedGenericFinalOutputs:
      RUNNING_PLAN_SOURCE_MODEL.endpointGates["Marathon Base"].rejectedFinalOutputs,
  };
}

function validateMarathonBasePlanPreview({
  calendarRows,
  endpointProof,
  normalizedInputSummary,
}: {
  calendarRows: readonly MarathonBasePlanCalendarRow[];
  endpointProof: MarathonBasePlanEndpointProof | null;
  normalizedInputSummary: MarathonBasePlanNormalizedInputSummary;
}): RunningPlanPreviewValidationStatus {
  const issues: string[] = [];

  if (!endpointProof) {
    issues.push("Final Marathon Base endpoint proof is missing.");
  }
  validateCommonPreviewRows({
    rows: calendarRows,
    fixedRestDays: normalizedInputSummary.fixedRestDays,
    expectedFinalWorkoutKind: "marathon_base_endpoint",
    expectedEndpointDistanceMeters: null,
    familyLabel: "Marathon Base",
    issues,
  });
  issues.push(
    ...validateMarathonBaseDiversityPolicy({
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
      "selected_distance_42195_endpoint",
      "full_marathon_race_readiness_claim",
      "marathon_intervals",
      "final_generic_long_run",
      "final_rest_or_recovery",
      "metadata_only_endpoint",
      "fake_precise_pace",
      "fake_personal_hr",
      "user_provided_5k_benchmark_dependency",
      "watch_no_watch_gate",
      "beginner_marathon_base_allowed",
      "support_only_marathon_base_preview",
    ],
  };
}

function buildUnavailable(
  code: RunningPlanPreviewUnavailableCode,
  message: string,
  normalizedInputSummary?: MarathonBasePlanNormalizedInputSummary,
  validation?: RunningPlanPreviewValidationStatus,
): MarathonBasePlanBuilderUnavailable {
  return {
    sourceKind: MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
    source_kind: MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
    sourceStatus: "preview_unavailable",
    source_status: "preview_unavailable",
    persisted: false,
    mutates: false,
    callsOpenAi: false,
    planFamily: "Marathon Base",
    error: { code, message },
    normalizedInputSummary,
    validation,
  };
}
