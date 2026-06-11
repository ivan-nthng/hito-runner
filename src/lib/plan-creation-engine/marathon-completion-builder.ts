import {
  MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
  resolveMarathonCompletionBuilderDevelopmentTouch,
  validateMarathonCompletionDiversityPolicy,
} from "@/lib/plan-creation-engine/marathon-completion-diversity-policy";
import {
  resolveMarathonCompletionCutbackWeeks,
  resolveMarathonCompletionEndpointWeek,
} from "@/lib/plan-creation-engine/marathon-completion-policy";
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

export const MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND =
  "running_plan_engine_marathon_completion_builder_v1" as const;

export type BuildMarathonCompletionPlanPreviewInput = BuildRunningPlanPreviewInput;
export type MarathonCompletionPlanCalendarRow = RunningPlanPreviewCalendarRow;
export type MarathonCompletionPlanNormalizedInputSummary = RunningPlanPreviewNormalizedInputSummary;

export interface MarathonCompletionPlanEndpointProof {
  endpointTemplateFamily: "Marathon Completion";
  endpointGateId: string;
  finalRowId: string;
  finalDate: string;
  finalWorkoutDayKind: "final_selected_distance_day";
  endpointDistanceMeters: 42195;
  endpointMainDistanceMeters: 42195;
  finalRowIsLastNonRest: true;
  mustNotUseMarathonBaseEndpoint: true;
  rejectedGenericFinalOutputs: readonly string[];
}

export interface MarathonCompletionPlanPreviewDraft {
  sourceKind: typeof MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND;
  source_kind: typeof MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND;
  sourceStatus: "preview_ready";
  source_status: "preview_ready";
  persisted: false;
  mutates: false;
  callsOpenAi: false;
  planFamily: "Marathon Completion";
  planVersion: typeof MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND;
  sourceModelVersion: typeof RUNNING_PLAN_SOURCE_MODEL.sourceVersion;
  reviewSafety: {
    persisted: false;
    mutates: false;
    confirmPathImplemented: false;
    callsOpenAi: false;
  };
  normalizedInputSummary: MarathonCompletionPlanNormalizedInputSummary;
  calendarRows: readonly MarathonCompletionPlanCalendarRow[];
  endpointProof: MarathonCompletionPlanEndpointProof;
  validation: RunningPlanPreviewValidationStatus & { ok: true };
}

export interface MarathonCompletionPlanBuilderUnavailable {
  sourceKind: typeof MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND;
  source_kind: typeof MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND;
  sourceStatus: "preview_unavailable";
  source_status: "preview_unavailable";
  persisted: false;
  mutates: false;
  callsOpenAi: false;
  planFamily: "Marathon Completion";
  error: {
    code: RunningPlanPreviewUnavailableCode;
    message: string;
  };
  normalizedInputSummary?: MarathonCompletionPlanNormalizedInputSummary;
  validation?: RunningPlanPreviewValidationStatus;
}

export type MarathonCompletionPlanBuilderResult =
  | { ok: true; draft: MarathonCompletionPlanPreviewDraft }
  | { ok: false; unavailable: MarathonCompletionPlanBuilderUnavailable };

export function buildMarathonCompletionPlanPreviewDraft(
  input: BuildMarathonCompletionPlanPreviewInput,
): MarathonCompletionPlanBuilderResult {
  const normalized = normalizeRunningPlanPreviewInput({
    input,
    family: "Marathon Completion",
    sourceKind: MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
  });
  if (!normalized.ok) {
    return {
      ok: false,
      unavailable: buildUnavailable(normalized.error.code, normalized.error.message),
    };
  }

  const horizonWeeks = normalized.input.horizonSelection.horizonWeeks;
  const cutbackWeeks = resolveMarathonCompletionCutbackWeeks(horizonWeeks);
  const endpointWeek = resolveMarathonCompletionEndpointWeek(horizonWeeks);
  const calendarRows = buildRunningPlanCalendarRows({
    input: normalized.input,
    family: "Marathon Completion",
    horizonWeeks,
    rowIdPrefix: "marathon-completion",
    recoveryAfterKinds: ["long_run", "cutback_long_run", "progression", "tempo"],
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
        if (weekNumber === endpointWeek) {
          return "final_selected_distance_day";
        }

        return cutbackWeeks.includes(weekNumber) ? "cutback_long_run" : "long_run";
      }

      if (weekday === nextAfterLongRunDay && weekNumber > 1) {
        return "recovery";
      }

      const developmentTouch = resolveMarathonCompletionBuilderDevelopmentTouch({
        runnerLevel,
        loadContext,
        weekNumber,
        horizonWeeks,
      });
      if (weekNumber < endpointWeek && weekday === developmentWeekday && developmentTouch) {
        return developmentTouch;
      }

      return "easy";
    },
  });
  const endpointProof = buildMarathonCompletionEndpointProof(calendarRows);
  const validation = validateMarathonCompletionPlanPreview({
    calendarRows,
    endpointProof,
    normalizedInputSummary: normalized.input,
  });

  if (!validation.ok || !endpointProof) {
    return {
      ok: false,
      unavailable: buildUnavailable(
        "builder_validation_failed",
        "The Marathon Completion preview did not satisfy endpoint or watch-executable gates.",
        normalized.input,
        validation,
      ),
    };
  }

  return {
    ok: true,
    draft: {
      sourceKind: MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
      source_kind: MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
      sourceStatus: "preview_ready",
      source_status: "preview_ready",
      persisted: false,
      mutates: false,
      callsOpenAi: false,
      planFamily: "Marathon Completion",
      planVersion: MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
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

function buildMarathonCompletionEndpointProof(
  rows: readonly MarathonCompletionPlanCalendarRow[],
): MarathonCompletionPlanEndpointProof | null {
  const finalNonRestRow = rows.filter((row) => !row.isRestDay).at(-1);
  const endpointTemplate = resolveRunningPlanEndpointTemplate("Marathon Completion");
  const endpointMainDistanceMeters = endpointTemplateMainDistanceMeters(endpointTemplate);

  if (
    !finalNonRestRow ||
    finalNonRestRow.workoutDayKind !== "final_selected_distance_day" ||
    endpointTemplate.endpointDistanceMeters !== MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS ||
    endpointMainDistanceMeters !== MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS
  ) {
    return null;
  }

  return {
    endpointTemplateFamily: "Marathon Completion",
    endpointGateId: endpointTemplate.endpointGateId,
    finalRowId: finalNonRestRow.rowId,
    finalDate: finalNonRestRow.date,
    finalWorkoutDayKind: "final_selected_distance_day",
    endpointDistanceMeters: MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
    endpointMainDistanceMeters: MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
    finalRowIsLastNonRest: true,
    mustNotUseMarathonBaseEndpoint: true,
    rejectedGenericFinalOutputs:
      RUNNING_PLAN_SOURCE_MODEL.endpointGates["Marathon Completion"].rejectedFinalOutputs,
  };
}

function validateMarathonCompletionPlanPreview({
  calendarRows,
  endpointProof,
  normalizedInputSummary,
}: {
  calendarRows: readonly MarathonCompletionPlanCalendarRow[];
  endpointProof: MarathonCompletionPlanEndpointProof | null;
  normalizedInputSummary: MarathonCompletionPlanNormalizedInputSummary;
}): RunningPlanPreviewValidationStatus {
  const issues: string[] = [];

  if (!endpointProof) {
    issues.push("Final Marathon Completion endpoint proof is missing.");
  }
  validateCommonPreviewRows({
    rows: calendarRows,
    fixedRestDays: normalizedInputSummary.fixedRestDays,
    expectedFinalWorkoutKind: "final_selected_distance_day",
    expectedEndpointDistanceMeters: MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
    familyLabel: "Marathon Completion",
    issues,
  });
  issues.push(
    ...validateMarathonCompletionDiversityPolicy({
      runnerLevel: normalizedInputSummary.runnerLevel,
      loadContext: normalizedInputSummary.loadContext,
      daysPerWeek: normalizedInputSummary.daysPerWeek,
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
      "marathon_base_endpoint_substitution",
      "marathon_base_plan_relabel",
      "missing_exact_42195_endpoint",
      "full_marathon_target_time_claim",
      "race_pace_session",
      "threshold_or_intervals",
      "final_generic_long_run",
      "final_rest_or_recovery",
      "metadata_only_endpoint",
      "fake_precise_pace",
      "fake_personal_hr",
      "user_provided_5k_benchmark_dependency",
      "watch_no_watch_gate",
      "unresolved_executable_ranges",
    ],
  };
}

function buildUnavailable(
  code: RunningPlanPreviewUnavailableCode,
  message: string,
  normalizedInputSummary?: MarathonCompletionPlanNormalizedInputSummary,
  validation?: RunningPlanPreviewValidationStatus,
): MarathonCompletionPlanBuilderUnavailable {
  return {
    sourceKind: MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
    source_kind: MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
    sourceStatus: "preview_unavailable",
    source_status: "preview_unavailable",
    persisted: false,
    mutates: false,
    callsOpenAi: false,
    planFamily: "Marathon Completion",
    error: { code, message },
    normalizedInputSummary,
    validation,
  };
}
