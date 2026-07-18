import type { Database, Json } from "@/lib/supabase/database";
import { workoutDuration, type Step, type WorkoutType } from "@/lib/training";
import {
  readWorkoutDocumentSections,
  workoutDocumentRepeatChildren,
  workoutDocumentRepeatCount,
  type WorkoutDocumentSection,
} from "@/lib/workout-document";
import type {
  WorkoutComparisonCompletionState,
  WorkoutComparisonDifferencePayload,
  WorkoutComparisonFactStatus,
  WorkoutComparisonSignal,
  WorkoutComparisonSignalKey,
  WorkoutComparisonSupportItem,
  WorkoutComparisonStatus,
  WorkoutComparisonSegmentGroup,
  WorkoutComparisonSegmentGroupKey,
  WorkoutComparisonSegmentSummary,
  WorkoutComparisonStepDetail,
  WorkoutComparisonStepSummary,
  WorkoutComparisonSupportMatrix,
  WorkoutComparisonSupportStatus,
} from "@/lib/workout-result-import/types";

type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type PersistedWorkoutActualMetricsRow =
  Database["public"]["Tables"]["workout_actual_metrics"]["Row"];

interface PlannedComparisonStep {
  sequence: number;
  type: string;
  label: string | null;
  durationMin: number | null;
  distanceKm: number | null;
  repeats: number | null;
}

interface ActualComparisonStep {
  sequence: number;
  workoutStepIndex: number;
  durationMin: number | null;
  distanceKm: number | null;
}

export interface DeterministicWorkoutComparisonResult {
  comparisonStatus: WorkoutComparisonStatus;
  completionState: WorkoutComparisonCompletionState;
  comparisonConfidence: number;
  differencePayload: WorkoutComparisonDifferencePayload;
}

export function buildDeterministicWorkoutComparison(params: {
  plannedWorkout: Pick<
    PersistedPlannedWorkoutRow,
    "id" | "workout_date" | "workout_type" | "source_workout_type" | "title" | "steps"
  >;
  actualMetrics: Pick<
    PersistedWorkoutActualMetricsRow,
    | "id"
    | "source_kind"
    | "activity_local_date"
    | "actual_duration_min"
    | "actual_distance_km"
    | "actual_interval_count"
    | "actual_step_payload"
    | "summary_payload"
  >;
}): DeterministicWorkoutComparisonResult {
  const plannedSteps = normalizePlannedSteps(params.plannedWorkout.steps);
  const actualSteps = normalizeActualSteps(params.actualMetrics.actual_step_payload);
  const activityType = compareActivityType(params.actualMetrics.summary_payload);
  const runningEvidenceEstablished = activityType.status === "matched";
  const plannedDurationMin =
    roundNumber(
      workoutDuration({
        steps: asTrainingSteps(params.plannedWorkout.steps),
        type: params.plannedWorkout.workout_type as WorkoutType,
      }),
      2,
    ) ?? 0;
  const plannedDistanceKm = explicitPlannedDistanceKm(plannedSteps);

  const dateAlignment = compareDateAlignment(
    params.plannedWorkout.workout_date,
    params.actualMetrics.activity_local_date,
  );
  const duration = runningEvidenceEstablished
    ? compareNumericSignal({
        key: "duration",
        label: "Duration",
        unit: "min",
        plannedValue: plannedDurationMin,
        actualValue: params.actualMetrics.actual_duration_min,
        matchedThresholdPct: 0.2,
        partialThresholdPct: 0.4,
      })
    : buildProviderActivityRequiredSignal({
        key: "duration",
        label: "Duration",
        unit: "min",
        plannedValue: plannedDurationMin,
        actualValue: params.actualMetrics.actual_duration_min,
      });
  const distance = !runningEvidenceEstablished
    ? buildProviderActivityRequiredSignal({
        key: "distance",
        label: "Distance",
        unit: "km",
        plannedValue: plannedDistanceKm,
        actualValue: params.actualMetrics.actual_distance_km,
      })
    : plannedDistanceKm == null
      ? buildStaticSignal({
          key: "distance",
          label: "Distance",
          unit: "km",
          status: "not_applicable",
          reason: "The planned workout does not define explicit distance truth.",
          plannedValue: null,
          actualValue: params.actualMetrics.actual_distance_km,
        })
      : compareNumericSignal({
          key: "distance",
          label: "Distance",
          unit: "km",
          plannedValue: plannedDistanceKm,
          actualValue: params.actualMetrics.actual_distance_km,
          matchedThresholdPct: 0.2,
          partialThresholdPct: 0.4,
        });
  const structuredStepCount = runningEvidenceEstablished
    ? compareStructuredStepCount(plannedSteps, params.actualMetrics.actual_interval_count)
    : buildProviderActivityRequiredSignal({
        key: "structured_step_count",
        label: "Structured steps",
        unit: "count",
        plannedValue: meaningfulStructuredStepCount(plannedSteps),
        actualValue: params.actualMetrics.actual_interval_count,
      });
  const stepSummary = buildStepSummary(plannedSteps, actualSteps, runningEvidenceEstablished);
  const segmentSummary = buildSegmentSummary(plannedSteps, actualSteps, stepSummary);

  const signals = [activityType, dateAlignment, duration, distance, structuredStepCount];
  const supportMatrix = buildSupportMatrix({
    signals,
    stepSummary,
    segmentSummary,
  });
  const comparedSignals = signals.filter((signal) => isComparedSignal(signal.status));
  const comparedSignalStatuses = comparedSignals.map((signal) => signal.status);
  const matchedSignals = comparedSignalStatuses.filter((status) => status === "matched").length;
  const partialSignals = comparedSignalStatuses.filter((status) => status === "partial").length;
  const mismatchSignals = comparedSignalStatuses.filter((status) => status === "mismatch").length;
  const missingActualSignals = signals.filter(
    (signal) => signal.status === "missing_actual",
  ).length;
  const notApplicableSignals = signals.filter(
    (signal) => signal.status === "not_applicable",
  ).length;

  const comparisonStatus = deriveComparisonStatus(
    comparedSignals.length,
    runningEvidenceEstablished,
  );
  const completionState = deriveCompletionState({
    activityTypeStatus: activityType.status,
    dateStatus: dateAlignment.status,
    comparedSignalCount: comparedSignals.length,
    matchedSignals,
    partialSignals,
    mismatchSignals,
  });
  const comparisonConfidence = deriveConfidence({
    activityTypeStatus: activityType.status,
    dateStatus: dateAlignment.status,
    durationStatus: duration.status,
    distanceStatus: distance.status,
    structuredStepStatus: structuredStepCount.status,
    completionState,
  });

  const differencePayload = {
    plannedWorkout: {
      plannedWorkoutId: params.plannedWorkout.id,
      title: params.plannedWorkout.title,
      workoutDate: params.plannedWorkout.workout_date,
      workoutType: params.plannedWorkout.workout_type,
      sourceWorkoutType: params.plannedWorkout.source_workout_type,
      plannedDurationMin,
      explicitPlannedDistanceKm: plannedDistanceKm,
    },
    actualMetrics: {
      actualMetricsId: params.actualMetrics.id,
      sourceKind: params.actualMetrics.source_kind,
      activityType: stringOrNull(activityType.actualValue),
      activityLocalDate: params.actualMetrics.activity_local_date,
      actualDurationMin: params.actualMetrics.actual_duration_min,
      actualDistanceKm: params.actualMetrics.actual_distance_km,
      actualStructuredStepCount: params.actualMetrics.actual_interval_count,
    },
    signals,
    facts: {
      activityType,
      dateAlignment,
      duration,
      distance,
      structuredStepCount,
    },
    sessionSummary: {
      dateDeltaDays: numberOrNull(dateAlignment.delta),
      durationDeltaMin: numberOrNull(duration.delta),
      durationDeltaPct: numberOrNull(duration.deltaPct),
      distanceDeltaKm: numberOrNull(distance.delta),
      distanceDeltaPct: numberOrNull(distance.deltaPct),
      plannedStructuredStepCount: numberOrNull(structuredStepCount.plannedValue),
      actualStructuredStepCount: numberOrNull(structuredStepCount.actualValue),
    },
    supportMatrix,
    stepSummary,
    segmentSummary,
    summary: {
      comparedSignalCount: comparedSignals.length,
      visibleSignalCount: signals.length,
      matchedSignals,
      partialSignals,
      mismatchSignals,
      missingActualSignals,
      notApplicableSignals,
      comparedSignalKeys: comparedSignals.map((signal) => signal.key),
    },
  } satisfies WorkoutComparisonDifferencePayload;

  return {
    comparisonStatus,
    completionState,
    comparisonConfidence,
    differencePayload,
  };
}

function compareActivityType(summaryPayload: Json) {
  const actualActivityType = readProviderActivityType(summaryPayload);

  if (!actualActivityType) {
    return buildStaticSignal({
      key: "activity_type",
      label: "Activity type",
      unit: "kind",
      status: "missing_actual",
      reason: "The parsed provider activity did not establish its sport type.",
      plannedValue: "running",
      actualValue: null,
    });
  }

  return buildStaticSignal({
    key: "activity_type",
    label: "Activity type",
    unit: "kind",
    status: isRunningActivityType(actualActivityType) ? "matched" : "mismatch",
    reason: isRunningActivityType(actualActivityType)
      ? undefined
      : "The provider activity is not a running activity, so performance metrics are not compared with this running workout.",
    plannedValue: "running",
    actualValue: actualActivityType,
  });
}

function buildProviderActivityRequiredSignal(args: {
  key: Extract<WorkoutComparisonSignalKey, "duration" | "distance" | "structured_step_count">;
  label: string;
  unit: "min" | "km" | "count";
  plannedValue: number | null;
  actualValue: number | null;
}) {
  return buildStaticSignal({
    ...args,
    status: "not_applicable",
    reason:
      "Provider metrics require a normalized running activity type before they can be compared with a running workout.",
  });
}

function compareDateAlignment(plannedDate: string, actualLocalDate: string | null) {
  if (!actualLocalDate) {
    return buildStaticSignal({
      key: "date_alignment",
      label: "Date",
      unit: "date",
      status: "missing_actual",
      reason: "The parsed Garmin activity did not expose a local activity date.",
      plannedValue: plannedDate,
      actualValue: null,
    });
  }

  return buildStaticSignal({
    key: "date_alignment",
    label: "Date",
    unit: "date",
    status: actualLocalDate === plannedDate ? "matched" : "mismatch",
    plannedValue: plannedDate,
    actualValue: actualLocalDate,
    delta: dayDiff(plannedDate, actualLocalDate),
  });
}

function compareNumericSignal(args: {
  key: Extract<WorkoutComparisonSignalKey, "duration" | "distance">;
  label: string;
  unit: "min" | "km";
  plannedValue: number | null;
  actualValue: number | null;
  matchedThresholdPct: number;
  partialThresholdPct: number;
}) {
  const { key, label, unit, plannedValue, actualValue, matchedThresholdPct, partialThresholdPct } =
    args;

  if (plannedValue == null || plannedValue <= 0) {
    return buildStaticSignal({
      key,
      label,
      unit,
      status: "not_applicable",
      reason: "The planned workout does not define deterministic truth for this metric.",
      plannedValue,
      actualValue,
    });
  }

  if (actualValue == null) {
    return buildStaticSignal({
      key,
      label,
      unit,
      status: "missing_actual",
      reason: "The parsed Garmin activity did not produce this actual metric.",
      plannedValue,
      actualValue: null,
      matchedTolerancePct: matchedThresholdPct,
      partialTolerancePct: partialThresholdPct,
    });
  }

  const delta = roundNumber(actualValue - plannedValue, 2);
  const deltaPct = roundNumber(Math.abs(delta ?? 0) / plannedValue, 4) ?? 0;
  const status =
    deltaPct <= matchedThresholdPct
      ? "matched"
      : deltaPct <= partialThresholdPct
        ? "partial"
        : "mismatch";

  return buildStaticSignal({
    key,
    label,
    unit,
    status,
    plannedValue,
    actualValue,
    delta,
    deltaPct,
    matchedTolerancePct: matchedThresholdPct,
    partialTolerancePct: partialThresholdPct,
    magnitude:
      status === "matched"
        ? "within_tolerance"
        : status === "partial"
          ? "slightly_off"
          : "meaningfully_off",
  });
}

function compareStructuredStepCount(
  plannedSteps: PlannedComparisonStep[],
  actualStructuredStepCount: number | null,
) {
  const plannedStructuredStepCount = meaningfulStructuredStepCount(plannedSteps);

  if (plannedStructuredStepCount == null) {
    return buildStaticSignal({
      key: "structured_step_count",
      label: "Structured steps",
      unit: "count",
      status: "not_applicable",
      reason:
        "Structured-step count is ambiguous for this planned workout shape in the current deterministic slice.",
      plannedValue: null,
      actualValue: actualStructuredStepCount,
    });
  }

  if (actualStructuredStepCount == null) {
    return buildStaticSignal({
      key: "structured_step_count",
      label: "Structured steps",
      unit: "count",
      status: "missing_actual",
      reason: "The parsed Garmin activity did not expose a structured-step count.",
      plannedValue: plannedStructuredStepCount,
      actualValue: null,
    });
  }

  const delta = Math.abs(actualStructuredStepCount - plannedStructuredStepCount);
  return buildStaticSignal({
    key: "structured_step_count",
    label: "Structured steps",
    unit: "count",
    status: delta === 0 ? "matched" : delta === 1 ? "partial" : "mismatch",
    plannedValue: plannedStructuredStepCount,
    actualValue: actualStructuredStepCount,
    delta,
    magnitude: delta === 0 ? "within_tolerance" : delta === 1 ? "slightly_off" : "meaningfully_off",
  });
}

function buildStepSummary(
  plannedSteps: PlannedComparisonStep[],
  actualSteps: ActualComparisonStep[],
  runningEvidenceEstablished: boolean,
): WorkoutComparisonStepSummary {
  if (plannedSteps.length === 0) {
    return {
      status: "not_applicable",
      mode: "none",
      reason: "The planned workout has no structured steps to compare.",
      plannedStepCount: 0,
      actualStepCount: actualSteps.length,
      comparedStepCount: 0,
      matchedStepCount: 0,
      partialStepCount: 0,
      mismatchStepCount: 0,
      missingActualStepCount: 0,
      steps: [],
    };
  }

  if (!canCompareOrderedSteps(plannedSteps)) {
    return {
      status: "not_applicable",
      mode: "none",
      reason:
        "Per-step duration comparison is intentionally disabled for repeated or ambiguous workout structures in this slice.",
      plannedStepCount: plannedSteps.length,
      actualStepCount: actualSteps.length,
      comparedStepCount: 0,
      matchedStepCount: 0,
      partialStepCount: 0,
      mismatchStepCount: 0,
      missingActualStepCount: 0,
      steps: [],
    };
  }

  if (!runningEvidenceEstablished) {
    return {
      status: "not_applicable",
      mode: "none",
      reason:
        "Step comparison requires a normalized running activity type before provider steps can be aligned.",
      plannedStepCount: plannedSteps.length,
      actualStepCount: actualSteps.length,
      comparedStepCount: 0,
      matchedStepCount: 0,
      partialStepCount: 0,
      mismatchStepCount: 0,
      missingActualStepCount: 0,
      steps: [],
    };
  }

  if (actualSteps.length === 0) {
    return {
      status: "not_applicable",
      mode: "none",
      reason:
        "The parsed Garmin activity did not produce structured actual steps for step-level compare.",
      plannedStepCount: plannedSteps.length,
      actualStepCount: 0,
      comparedStepCount: 0,
      matchedStepCount: 0,
      partialStepCount: 0,
      mismatchStepCount: 0,
      missingActualStepCount: 0,
      steps: [],
    };
  }

  if (!actualSteps.some((step) => step.durationMin != null)) {
    return {
      status: "not_applicable",
      mode: "none",
      reason:
        "The indexed provider workout steps did not expose duration evidence for step-level compare.",
      plannedStepCount: plannedSteps.length,
      actualStepCount: actualSteps.length,
      comparedStepCount: 0,
      matchedStepCount: 0,
      partialStepCount: 0,
      mismatchStepCount: 0,
      missingActualStepCount: actualSteps.length,
      steps: [],
    };
  }

  const comparedStepCount = Math.min(plannedSteps.length, actualSteps.length);
  const steps: WorkoutComparisonStepDetail[] = [];
  let matchedStepCount = 0;
  let partialStepCount = 0;
  let mismatchStepCount = 0;
  let missingActualStepCount = 0;

  for (let index = 0; index < comparedStepCount; index += 1) {
    const planned = plannedSteps[index];
    const actual = actualSteps[index];
    const signal = compareStepDuration(planned.durationMin, actual?.durationMin ?? null);
    const detail: WorkoutComparisonStepDetail = {
      plannedSequence: planned.sequence,
      actualSequence: actual?.sequence ?? null,
      workoutStepIndex: actual?.workoutStepIndex ?? null,
      type: planned.type,
      label: planned.label,
      status: signal.status,
      plannedDurationMin: numberOrNull(signal.plannedValue),
      actualDurationMin: numberOrNull(signal.actualValue),
      durationDeltaMin: numberOrNull(signal.delta),
      durationDeltaPct: numberOrNull(signal.deltaPct),
    };

    steps.push(detail);

    if (signal.status === "matched") matchedStepCount += 1;
    if (signal.status === "partial") partialStepCount += 1;
    if (signal.status === "mismatch") mismatchStepCount += 1;
    if (signal.status === "missing_actual") missingActualStepCount += 1;
  }

  return {
    status: "available",
    mode: "ordered_simple",
    reason:
      plannedSteps.length === actualSteps.length
        ? null
        : "Only the overlapping ordered steps are compared here because the step counts differ.",
    plannedStepCount: plannedSteps.length,
    actualStepCount: actualSteps.length,
    comparedStepCount,
    matchedStepCount,
    partialStepCount,
    mismatchStepCount,
    missingActualStepCount,
    steps,
  };
}

function buildSegmentSummary(
  plannedSteps: PlannedComparisonStep[],
  actualSteps: ActualComparisonStep[],
  stepSummary: WorkoutComparisonStepSummary,
): WorkoutComparisonSegmentSummary {
  if (stepSummary.status !== "available") {
    return {
      status: "not_applicable",
      mode: "none",
      reason:
        stepSummary.reason ??
        "Segment grouping requires ordered per-step comparison to be available first.",
      groups: [],
    };
  }

  const groups = orderedSegmentGroups(plannedSteps, actualSteps);

  if (groups.length === 0) {
    return {
      status: "not_applicable",
      mode: "none",
      reason: "No deterministic segment groups were found for this planned workout.",
      groups: [],
    };
  }

  return {
    status: "available",
    mode: "ordered_simple_groups",
    reason:
      plannedSteps.length === actualSteps.length
        ? null
        : "Segment groups use only the ordered actual steps that overlap with the planned steps.",
    groups,
  };
}

function orderedSegmentGroups(
  plannedSteps: PlannedComparisonStep[],
  actualSteps: ActualComparisonStep[],
): WorkoutComparisonSegmentGroup[] {
  const grouped = new Map<WorkoutComparisonSegmentGroupKey, MutableSegmentGroup>();
  const comparedStepCount = Math.min(plannedSteps.length, actualSteps.length);

  for (let index = 0; index < plannedSteps.length; index += 1) {
    const planned = plannedSteps[index];
    const actual = index < comparedStepCount ? actualSteps[index] : null;
    const key = segmentGroupForStep(planned);
    const current = grouped.get(key) ?? emptyMutableSegmentGroup(key);

    current.plannedStepCount += 1;
    current.actualStepCount += actual ? 1 : 0;
    current.plannedDurationMin = addNullable(current.plannedDurationMin, planned.durationMin);
    current.actualDurationMin = addNullable(current.actualDurationMin, actual?.durationMin ?? null);
    current.plannedDistanceKm = addNullable(current.plannedDistanceKm, planned.distanceKm);
    current.actualDistanceKm = addNullable(current.actualDistanceKm, actual?.distanceKm ?? null);
    grouped.set(key, current);
  }

  return [...grouped.values()].map((group) => finalizeSegmentGroup(group));
}

interface MutableSegmentGroup {
  key: WorkoutComparisonSegmentGroupKey;
  plannedStepCount: number;
  actualStepCount: number;
  plannedDurationMin: number | null;
  actualDurationMin: number | null;
  plannedDistanceKm: number | null;
  actualDistanceKm: number | null;
}

function emptyMutableSegmentGroup(key: WorkoutComparisonSegmentGroupKey): MutableSegmentGroup {
  return {
    key,
    plannedStepCount: 0,
    actualStepCount: 0,
    plannedDurationMin: null,
    actualDurationMin: null,
    plannedDistanceKm: null,
    actualDistanceKm: null,
  };
}

function finalizeSegmentGroup(group: MutableSegmentGroup): WorkoutComparisonSegmentGroup {
  const durationSignal = compareStepDuration(group.plannedDurationMin, group.actualDurationMin);
  const plannedDistanceKm = group.plannedDistanceKm
    ? roundNumber(group.plannedDistanceKm, 2)
    : null;
  const actualDistanceKm = group.actualDistanceKm ? roundNumber(group.actualDistanceKm, 2) : null;

  return {
    key: group.key,
    label: labelForSegmentGroup(group.key),
    status: durationSignal.status,
    reason:
      durationSignal.status === "matched" || durationSignal.status === "partial"
        ? null
        : (durationSignal.reason ?? null),
    plannedStepCount: group.plannedStepCount,
    actualStepCount: group.actualStepCount,
    plannedDurationMin: numberOrNull(durationSignal.plannedValue),
    actualDurationMin: numberOrNull(durationSignal.actualValue),
    durationDeltaMin: numberOrNull(durationSignal.delta),
    durationDeltaPct: numberOrNull(durationSignal.deltaPct),
    plannedDistanceKm,
    actualDistanceKm,
    distanceDeltaKm:
      plannedDistanceKm != null && actualDistanceKm != null
        ? roundNumber(actualDistanceKm - plannedDistanceKm, 2)
        : null,
  };
}

function buildSupportMatrix(args: {
  signals: WorkoutComparisonSignal[];
  stepSummary: WorkoutComparisonStepSummary;
  segmentSummary: WorkoutComparisonSegmentSummary;
}): WorkoutComparisonSupportMatrix {
  const signalItems = args.signals.map((signal): WorkoutComparisonSupportItem => {
    return {
      key: signal.key,
      label: signal.label,
      status: supportStatusForFact(signal.status),
      reason: signal.reason ?? null,
    };
  });

  const signals: WorkoutComparisonSupportItem[] = [
    ...signalItems,
    {
      key: "step_duration",
      label: "Step duration",
      status: args.stepSummary.status === "available" ? "compared" : "not_applicable",
      reason: args.stepSummary.reason,
    },
    {
      key: "segment_group_duration",
      label: "Segment-group duration",
      status: args.segmentSummary.status === "available" ? "compared" : "not_applicable",
      reason: args.segmentSummary.reason,
    },
    {
      key: "pace",
      label: "Pace",
      status: "unsupported",
      reason:
        "Pace comparison is intentionally not part of the deterministic contract until planned pace targets and Garmin pace metrics are normalized into one comparable unit.",
    },
    {
      key: "heart_rate",
      label: "Heart rate",
      status: "unsupported",
      reason:
        "Heart-rate comparison is intentionally not part of the deterministic contract until planned HR targets can be parsed as numeric ranges.",
    },
    {
      key: "rpe",
      label: "RPE",
      status: "unsupported",
      reason:
        "Provider activity evidence does not establish the runner's subjective RPE; manual workout logs remain separate evidence.",
    },
  ];

  return { signals };
}

function supportStatusForFact(status: WorkoutComparisonFactStatus): WorkoutComparisonSupportStatus {
  if (status === "missing_actual") {
    return "missing_actual";
  }

  if (status === "not_applicable") {
    return "not_applicable";
  }

  return "compared";
}

function compareStepDuration(plannedValue: number | null, actualValue: number | null) {
  if (plannedValue == null || plannedValue <= 0) {
    return buildStaticSignal({
      key: "duration",
      label: "Step duration",
      unit: "min",
      status: "not_applicable",
      reason: "This planned step does not define deterministic duration truth.",
      plannedValue,
      actualValue,
    });
  }

  if (actualValue == null) {
    return buildStaticSignal({
      key: "duration",
      label: "Step duration",
      unit: "min",
      status: "missing_actual",
      reason: "The parsed Garmin step did not expose a duration.",
      plannedValue,
      actualValue,
      matchedTolerancePct: 0.2,
      partialTolerancePct: 0.4,
    });
  }

  return compareNumericSignal({
    key: "duration",
    label: "Step duration",
    unit: "min",
    plannedValue,
    actualValue,
    matchedThresholdPct: 0.2,
    partialThresholdPct: 0.4,
  });
}

function deriveComparisonStatus(
  comparedSignalCount: number,
  runningEvidenceEstablished: boolean,
): WorkoutComparisonStatus {
  if (!runningEvidenceEstablished) {
    return "insufficient_data";
  }

  if (comparedSignalCount >= 2) {
    return "complete";
  }

  if (comparedSignalCount >= 1) {
    return "partial";
  }

  return "insufficient_data";
}

function deriveCompletionState(args: {
  activityTypeStatus: WorkoutComparisonFactStatus;
  dateStatus: WorkoutComparisonFactStatus;
  comparedSignalCount: number;
  matchedSignals: number;
  partialSignals: number;
  mismatchSignals: number;
}): WorkoutComparisonCompletionState {
  if (
    args.activityTypeStatus !== "matched" ||
    args.dateStatus === "mismatch" ||
    args.comparedSignalCount === 0
  ) {
    return "unclear";
  }

  if (args.mismatchSignals === 0 && args.partialSignals === 0 && args.matchedSignals > 0) {
    return "matched";
  }

  if (args.matchedSignals > 0 || args.partialSignals > 0 || args.mismatchSignals > 0) {
    return "partially_matched";
  }

  return "unclear";
}

function deriveConfidence(args: {
  activityTypeStatus: WorkoutComparisonFactStatus;
  dateStatus: WorkoutComparisonFactStatus;
  durationStatus: WorkoutComparisonFactStatus;
  distanceStatus: WorkoutComparisonFactStatus;
  structuredStepStatus: WorkoutComparisonFactStatus;
  completionState: WorkoutComparisonCompletionState;
}) {
  let score = 0;

  if (args.activityTypeStatus !== "matched") {
    return 0;
  }

  score += weightForDate(args.dateStatus);
  score += weightForSignal(args.durationStatus, 0.35, 0.22, 0.1);
  score += weightForSignal(args.distanceStatus, 0.25, 0.16, 0.07);
  score += weightForSignal(args.structuredStepStatus, 0.2, 0.12, 0.05);

  if (args.completionState === "unclear") {
    score = Math.min(score, 0.49);
  }

  return roundNumber(Math.max(0, Math.min(score, 0.95)), 4) ?? 0;
}

function weightForDate(status: WorkoutComparisonFactStatus) {
  if (status === "matched") return 0.2;
  if (status === "mismatch") return 0.03;
  return 0;
}

function weightForSignal(
  status: WorkoutComparisonFactStatus,
  matchedWeight: number,
  partialWeight: number,
  mismatchWeight: number,
) {
  if (status === "matched") return matchedWeight;
  if (status === "partial") return partialWeight;
  if (status === "mismatch") return mismatchWeight;
  return 0;
}

function normalizePlannedSteps(steps: Json): PlannedComparisonStep[] {
  return readWorkoutDocumentSections(steps).map((step, index) =>
    asPlannedComparisonStep(step, index),
  );
}

function normalizeActualSteps(payload: Json): ActualComparisonStep[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((step) => asActualComparisonStep(step))
    .filter((step): step is ActualComparisonStep => step != null);
}

function asTrainingSteps(steps: Json): Step[] {
  return readWorkoutDocumentSections(steps);
}

function asPlannedComparisonStep(
  section: WorkoutDocumentSection,
  index: number,
): PlannedComparisonStep {
  const repeats = workoutDocumentRepeatCount(section);
  let durationMin = section.duration_min ?? null;
  let distanceKm = section.distance_km ?? null;
  const repeatChildren = workoutDocumentRepeatChildren(section);

  if (repeats && repeatChildren.length > 0) {
    durationMin =
      (durationMin ?? 0) +
      repeats * repeatChildren.reduce((sum, child) => sum + childDurationMin(child), 0);
    distanceKm =
      (distanceKm ?? 0) +
      repeats * repeatChildren.reduce((sum, child) => sum + childDistanceKm(child), 0);
  }

  return {
    sequence: section.sequence ?? index + 1,
    type: section.type,
    label: section.label?.trim() || null,
    durationMin: durationMin != null ? roundNumber(durationMin, 2) : null,
    distanceKm: distanceKm != null && distanceKm > 0 ? roundNumber(distanceKm, 2) : null,
    repeats,
  };
}

function childDurationMin(child: WorkoutDocumentSection) {
  return child.prescription?.duration_min ?? child.duration_min ?? 0;
}

function childDistanceKm(child: WorkoutDocumentSection) {
  return child.prescription?.distance_km ?? child.distance_km ?? 0;
}

function asActualComparisonStep(value: Json): ActualComparisonStep | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, Json | undefined>;
  const workoutStepIndex = numberOrNull(record.workoutStepIndex);

  if (workoutStepIndex == null || !Number.isInteger(workoutStepIndex) || workoutStepIndex < 0) {
    return null;
  }

  return {
    sequence: numberOrNull(record.sequence) ?? 0,
    workoutStepIndex,
    durationMin: numberOrNull(record.durationMin),
    distanceKm: numberOrNull(record.distanceKm),
  };
}

function readProviderActivityType(summaryPayload: Json) {
  if (!summaryPayload || typeof summaryPayload !== "object" || Array.isArray(summaryPayload)) {
    return null;
  }

  const session = (summaryPayload as Record<string, Json | undefined>).session;

  if (!session || typeof session !== "object" || Array.isArray(session)) {
    return null;
  }

  return stringOrNull((session as Record<string, Json | undefined>).sport);
}

function isRunningActivityType(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return normalized === "run" || normalized === "running";
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function canCompareOrderedSteps(steps: PlannedComparisonStep[]) {
  const ambiguousTypes = new Set(["mobility", "activation", "drills", "strides", "fueling"]);
  return steps.every((step) => (step.repeats ?? 0) === 0 && !ambiguousTypes.has(step.type));
}

function segmentGroupForStep(step: PlannedComparisonStep): WorkoutComparisonSegmentGroupKey {
  const normalizedType = step.type.toLowerCase();
  const normalizedLabel = step.label?.toLowerCase() ?? "";

  if (normalizedType.includes("warm") || normalizedLabel.includes("warm")) {
    return "warmup";
  }

  if (normalizedType.includes("cool") || normalizedLabel.includes("cool")) {
    return "cooldown";
  }

  if (normalizedType.includes("recovery") || normalizedLabel.includes("recover")) {
    return "recovery";
  }

  if (
    normalizedType.includes("main") ||
    normalizedType.includes("tempo") ||
    normalizedType.includes("interval") ||
    normalizedType.includes("easy") ||
    normalizedType.includes("steady") ||
    normalizedType.includes("long") ||
    normalizedType.includes("run")
  ) {
    return "main";
  }

  return "other";
}

function labelForSegmentGroup(key: WorkoutComparisonSegmentGroupKey) {
  switch (key) {
    case "warmup":
      return "Warm-up";
    case "main":
      return "Main work";
    case "cooldown":
      return "Cooldown";
    case "recovery":
      return "Recovery";
    default:
      return "Other";
  }
}

function meaningfulStructuredStepCount(steps: PlannedComparisonStep[]) {
  if (steps.length === 0) {
    return null;
  }

  const ambiguousTypes = new Set(["mobility", "activation", "drills", "strides", "fueling"]);

  if (steps.some((step) => (step.repeats ?? 0) > 0 || ambiguousTypes.has(step.type))) {
    return null;
  }

  const countable = steps.filter(
    (step) => (step.durationMin ?? 0) > 0 || (step.distanceKm ?? 0) > 0,
  );
  return countable.length > 0 ? countable.length : null;
}

function explicitPlannedDistanceKm(steps: PlannedComparisonStep[]) {
  const values = steps
    .map((step) => step.distanceKm)
    .filter((value): value is number => value != null);
  if (values.length === 0) {
    return null;
  }

  return roundNumber(
    values.reduce((sum, value) => sum + value, 0),
    2,
  );
}

function buildStaticSignal(signal: WorkoutComparisonSignal): WorkoutComparisonSignal {
  return signal;
}

function isComparedSignal(status: WorkoutComparisonFactStatus) {
  return status !== "not_applicable" && status !== "missing_actual";
}

function numberOrNull(value: Json | undefined | string | number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundNumber(value: number | null, digits: number) {
  if (value == null) {
    return null;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function addNullable(left: number | null, right: number | null) {
  if (right == null) {
    return left;
  }

  return roundNumber((left ?? 0) + right, 2);
}

function dayDiff(left: string, right: string) {
  const leftDate = Date.parse(`${left}T00:00:00Z`);
  const rightDate = Date.parse(`${right}T00:00:00Z`);

  if (Number.isNaN(leftDate) || Number.isNaN(rightDate)) {
    return null;
  }

  return Math.round((rightDate - leftDate) / (24 * 60 * 60 * 1000));
}
