import { createHash } from "node:crypto";
import { addDaysIso, startOfWeekIso } from "@/lib/training";
import type {
  RunnerActivityAdvancedMetricsCurrent,
  RunnerActivityFitChartMetricId,
  RunnerActivityFitChartPeriod,
  RunnerActivityFitChartPoint,
  RunnerActivityFitChartSeries,
  RunnerActivityFitSequenceCoverage,
  RunnerActivityFitSequenceMetricId,
  RunnerActivityFitSequenceObservation,
  RunnerActivityFitSequencePeriod,
  RunnerActivityFitSequencePeriodRequest,
  RunnerActivityFitSequencePoint,
  RunnerActivityFitSequenceReadModel,
  RunnerActivityFitPersonalBestSlot,
  RunnerActivityFitPersonalBestSlotId,
  RunnerActivityFitProgressReadModel,
  RunnerActivityRecordItem,
  RunnerActivitySessionLoadMetric,
  RunnerActivitySessionLoadWindow,
} from "@/lib/runner-activity/read-model-types";

export const RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION =
  "runner_activity_gate4_formula_set_v4" as const;
const PERSONAL_BEST_FORMULA_VERSION = "personal_best_elapsed_v3" as const;
const SESSION_RPE_LOAD_FORMULA_VERSION = "session_rpe_load_v1" as const;
const FIT_PROGRESS_FORMULA_VERSION = "fit_progress_actuals_v1" as const;
export const RUNNER_ACTIVITY_FIT_SEQUENCE_FORMULA_VERSION = "fit_activity_sequence_v1" as const;

export const RUNNER_ACTIVITY_GATE4_FORMULA_VERSIONS = Object.freeze({
  personalBest: PERSONAL_BEST_FORMULA_VERSION,
  sessionRpeLoad: SESSION_RPE_LOAD_FORMULA_VERSION,
  fitProgress: FIT_PROGRESS_FORMULA_VERSION,
});

export type RunnerActivityFitEvidenceInput =
  | { state: "eligible"; reason: null }
  | { state: "updating"; reason: "fit_source_removal_pending" }
  | {
      state: "unavailable";
      reason: "fit_source_removed" | "fit_source_graph_invalid" | "fit_source_revision_not_current";
    };

export type Gate4EvidenceInput = {
  id: string;
  activityRevisionId: string;
  kind: "session_rpe" | "official_result";
  lifecycleState: "asserted" | "withdrawn";
  sessionRpe: number | null;
  completionOutcome: "completed" | "partial" | "skipped" | null;
  officialDistanceM: number | null;
  officialElapsedSeconds: number | null;
  officialEventDate: string | null;
  officialContext: string | null;
  origin: "runner_direct" | "workout_log_backfill";
};

export type Gate4ActivityInput = {
  id: string;
  activityRevisionId: string;
  sourceRevisionId: string;
  localDate: string | null;
  startedAt: string | null;
  historicalTimezone: string | null;
  timerDurationMin: number | null;
  elapsedDurationMin: number | null;
  distanceKm: number | null;
  elevationGainM: number | null;
  fitEvidence: RunnerActivityFitEvidenceInput;
  recordContext: string | null;
  rpeLinkState: "exact" | "missing" | "ambiguous";
  rpeInputPresent: boolean;
  evidence: {
    sessionRpe: Gate4EvidenceInput | null;
    officialResult: Gate4EvidenceInput | null;
  };
};

export type Gate4ObservationDraft = {
  activityId: string;
  activityRevisionId: string;
  sourceRevisionId: string;
  evidenceRevisionId: string | null;
  metricKey: "personal_best_elapsed" | "session_rpe_load";
  metricVariant: string;
  metricFormulaVersion: string;
  availability: "available" | "unavailable";
  value: number | null;
  unit: "seconds" | "arbitrary_units";
  analyzedBounds: Record<string, unknown>;
  eligibility: Record<string, unknown>;
  exclusions: string[];
  comparabilityCohort: string | null;
  confidence: "complete" | "partial" | "unavailable";
  unavailableReason: string | null;
  inputFingerprintSha256: string;
};

export type Gate4PersistedObservation = Gate4ObservationDraft & {
  id: string;
  localDate: string | null;
};

type StandardDistance = {
  key: string;
  meters: number;
};

export const RUNNER_RECORD_STANDARD_DISTANCES: readonly StandardDistance[] = Object.freeze([
  { key: "1_km", meters: 1000 },
  { key: "1_mile", meters: 1609.344 },
  { key: "5_km", meters: 5000 },
  { key: "10_km", meters: 10000 },
  { key: "15_km", meters: 15000 },
  { key: "half_marathon", meters: 21097.5 },
  { key: "marathon", meters: 42195 },
  { key: "50_km", meters: 50000 },
  { key: "50_mile", meters: 80467.2 },
  { key: "100_km", meters: 100000 },
  { key: "100_mile", meters: 160934.4 },
]);

const FIT_PERSONAL_BEST_SLOTS: ReadonlyArray<
  StandardDistance & {
    id: RunnerActivityFitPersonalBestSlotId;
    label: RunnerActivityFitPersonalBestSlot["label"];
  }
> = Object.freeze([
  { id: "1_km", key: "1_km", label: "1 km", meters: 1000 },
  { id: "5_km", key: "5_km", label: "5 km", meters: 5000 },
  { id: "10_km", key: "10_km", label: "10 km", meters: 10000 },
  {
    id: "half_marathon",
    key: "half_marathon",
    label: "Half Marathon · 21.0975 km",
    meters: 21097.5,
  },
  { id: "marathon", key: "marathon", label: "Marathon · 42.195 km", meters: 42195 },
]);

export function buildGate4ObservationDrafts(
  activities: Gate4ActivityInput[],
): Gate4ObservationDraft[] {
  return activities.flatMap((activity) => [
    buildSessionRpeObservation(activity),
    ...buildRecordObservations(activity),
  ]);
}

export function buildGate4SnapshotPayload(input: {
  id: string;
  asOfDate: string;
  historical: boolean;
  activities: Gate4ActivityInput[];
  observations: Gate4PersistedObservation[];
  activityRevisionIds: string[];
  evidenceRevisionIds: string[];
}): RunnerActivityAdvancedMetricsCurrent {
  const currentStart = addDaysIso(input.asOfDate, -27);
  const previousEnd = addDaysIso(currentStart, -1);
  const previousStart = addDaysIso(previousEnd, -27);
  const loadObservations = input.observations.filter(
    (observation) => observation.metricKey === "session_rpe_load",
  );
  const recordObservations = input.observations.filter(
    (observation) =>
      observation.metricKey === "personal_best_elapsed" && observation.availability === "available",
  );
  const recordUnavailableReasons = Array.from(
    new Set(
      input.observations.flatMap((observation) =>
        observation.metricKey === "personal_best_elapsed" &&
        observation.availability === "unavailable" &&
        observation.unavailableReason
          ? [observation.unavailableReason]
          : [],
      ),
    ),
  ).sort();
  const records = selectFastestRecords(recordObservations);
  const calendarWeeks: RunnerActivitySessionLoadWindow[] = [];
  let weekStart = startOfWeekIso(currentStart);
  const lastWeekStart = startOfWeekIso(input.asOfDate);
  while (weekStart <= lastWeekStart) {
    const weekEnd = addDaysIso(weekStart, 6);
    calendarWeeks.push(
      loadWindow(loadObservations, weekStart, weekEnd > input.asOfDate ? input.asOfDate : weekEnd),
    );
    weekStart = addDaysIso(weekStart, 7);
  }

  return {
    status: "current",
    snapshotId: input.id,
    historical: input.historical,
    asOfDate: input.asOfDate,
    formulaSetVersion: RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION,
    formulaVersions: RUNNER_ACTIVITY_GATE4_FORMULA_VERSIONS,
    fitProgress: buildFitProgressPayload({
      asOfDate: input.asOfDate,
      activities: input.activities,
      observations: input.observations,
    }),
    sessionRpeLoad: {
      rolling28Day: {
        current: loadWindow(loadObservations, currentStart, input.asOfDate),
        previous: loadWindow(loadObservations, previousStart, previousEnd),
      },
      calendarWeeks,
    },
    records: {
      availability: records.length > 0 ? "available" : "unavailable",
      items: records,
      unavailableReason: records.length > 0 ? null : "normalized_stream_not_persisted",
      unavailableReasons: recordUnavailableReasons,
      calculatedWithinActivity: {
        status: "unavailable",
        reason: "normalized_stream_not_persisted",
      },
      providerAttributed: {
        status: "unavailable",
        reason: "unsupported_record_class",
      },
    },
    streamDependentMetrics: {
      aerobicEfficiency: unavailableStreamMetric("aerobic_efficiency_stream_v1"),
      paceAtComparableHeartRate: unavailableStreamMetric("pace_at_comparable_hr_v1"),
      heartRateAtComparablePace: unavailableStreamMetric("hr_at_comparable_pace_v1"),
      durability: unavailableStreamMetric("aerobic_decoupling_v1"),
      controlledAerobicDuration: unavailableStreamMetric("controlled_aerobic_duration_v1"),
    },
    evidence: {
      activityRevisionIds: [...input.activityRevisionIds].sort(),
      evidenceRevisionIds: [...input.evidenceRevisionIds].sort(),
      observationIds: input.observations.map((observation) => observation.id).sort(),
    },
  };
}

export function gate4InputFingerprint(input: {
  activities: Gate4ActivityInput[];
  formulaSetVersion?: string;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        formulaSetVersion: input.formulaSetVersion ?? RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION,
        activities: input.activities
          .map((activity) => ({
            id: activity.id,
            revisionId: activity.activityRevisionId,
            sourceRevisionId: activity.sourceRevisionId,
            localDate: activity.localDate,
            startedAt: activity.startedAt,
            historicalTimezone: activity.historicalTimezone,
            fitEvidence: activity.fitEvidence,
            recordContext: activity.recordContext,
            rpeLinkState: activity.rpeLinkState,
            rpeInputPresent: activity.rpeInputPresent,
            evidence: [
              activity.evidence.sessionRpe?.id ?? null,
              activity.evidence.officialResult?.id ?? null,
            ],
          }))
          .sort((left, right) => left.id.localeCompare(right.id)),
      }),
    )
    .digest("hex");
}

export function buildRunnerActivityFitSequence(input: {
  asOfDate: string;
  timeZone: string;
  period: RunnerActivityFitSequencePeriodRequest;
  activities: Gate4ActivityInput[];
}): RunnerActivityFitSequenceReadModel {
  const advertisedPeriods = resolveRunnerActivityFitSequenceQuickPeriods(
    input.asOfDate,
    input.timeZone,
  );
  const selectedPeriod = resolveRunnerActivityFitSequencePeriod({
    asOfDate: input.asOfDate,
    timeZone: input.timeZone,
    period: input.period,
  });
  const base = {
    formulaVersion: RUNNER_ACTIVITY_FIT_SEQUENCE_FORMULA_VERSION,
    evidenceLabel: "From FIT file" as const,
    advertisedPeriods,
    selectedPeriod,
  };
  const missingHistoricalDate = input.activities.some(
    (activity) =>
      activity.localDate == null &&
      (activity.fitEvidence.state === "eligible" || activity.fitEvidence.state === "updating"),
  );
  if (missingHistoricalDate) {
    return {
      ...base,
      status: "unavailable",
      reason: "accepted_fit_activity_missing_historical_local_date",
      reasonLabel: "An accepted FIT activity is missing its historical local date.",
      staleValuesReturned: false,
      points: [],
    };
  }

  const periodActivities = input.activities.filter(
    (activity) =>
      activity.localDate != null &&
      activity.localDate >= selectedPeriod.startDate &&
      activity.localDate <= selectedPeriod.endDate,
  );
  if (periodActivities.some((activity) => activity.fitEvidence.state === "updating")) {
    return {
      ...base,
      status: "updating",
      reason: "fit_evidence_updating",
      reasonLabel: "FIT evidence is updating.",
      staleValuesReturned: false,
      points: [],
    };
  }

  const eligibleActivities = periodActivities
    .filter((activity) => activity.fitEvidence.state === "eligible")
    .sort(compareFitSequenceActivities);
  const sameDayCounts = new Map<string, number>();
  const points = eligibleActivities.map((activity, sequenceIndex) => {
    const localDate = activity.localDate;
    if (!localDate) throw new Error("Eligible FIT sequence activity is missing its local date.");
    const sameDayOrder = (sameDayCounts.get(localDate) ?? 0) + 1;
    sameDayCounts.set(localDate, sameDayOrder);
    return buildFitSequencePoint({ activity, sequenceIndex, sameDayOrder });
  });
  if (points.length !== eligibleActivities.length) {
    return {
      ...base,
      status: "unavailable",
      reason: "sequence_incomplete",
      reasonLabel: "The complete FIT activity sequence could not be returned.",
      staleValuesReturned: false,
      points: [],
    };
  }
  return {
    ...base,
    status: points.length === 0 ? "empty" : "ready",
    completeness: {
      state: "complete",
      eligibleActivityCount: eligibleActivities.length,
      returnedPointCount: points.length,
    },
    coverage: fitSequenceCoverage(points),
    points,
  };
}

export function runnerActivityFitSequencePendingReadback(input: {
  asOfDate: string;
  timeZone: string;
  period: RunnerActivityFitSequencePeriodRequest;
}): RunnerActivityFitSequenceReadModel {
  return {
    formulaVersion: RUNNER_ACTIVITY_FIT_SEQUENCE_FORMULA_VERSION,
    evidenceLabel: "From FIT file",
    advertisedPeriods: resolveRunnerActivityFitSequenceQuickPeriods(input.asOfDate, input.timeZone),
    selectedPeriod: resolveRunnerActivityFitSequencePeriod(input),
    status: "updating",
    reason: "metric_recalculation_pending",
    reasonLabel: "FIT activity facts are updating.",
    staleValuesReturned: false,
    points: [],
  };
}

export function resolveRunnerActivityFitSequencePeriod(input: {
  asOfDate: string;
  timeZone: string;
  period: RunnerActivityFitSequencePeriodRequest;
}): RunnerActivityFitSequencePeriod {
  const common = {
    asOfDate: input.asOfDate,
    timezoneBasis: {
      period: "runner_calendar_timezone" as const,
      activities: "historical_local_date" as const,
      timeZone: input.timeZone,
    },
  };
  if (input.period.kind === "custom") {
    return {
      ...common,
      id: "custom",
      label: "Custom",
      startDate: input.period.startDate,
      endDate: input.period.endDate,
      futureInterval: null,
    };
  }
  if (input.period.kind === "this_week") {
    const startDate = startOfWeekIso(input.asOfDate);
    const endDate = addDaysIso(startDate, 6);
    return {
      ...common,
      id: input.period.kind,
      label: "This week",
      startDate,
      endDate,
      futureInterval:
        input.asOfDate < endDate ? { startDate: addDaysIso(input.asOfDate, 1), endDate } : null,
    };
  }
  const labels = {
    last_7_days: "Last 7 days",
    last_1_month: "Last 1 month",
    last_6_months: "Last 6 months",
  } as const;
  const startDate =
    input.period.kind === "last_7_days"
      ? addDaysIso(input.asOfDate, -6)
      : rollingCalendarMonthStart(input.asOfDate, input.period.kind === "last_1_month" ? 1 : 6);
  return {
    ...common,
    id: input.period.kind,
    label: labels[input.period.kind],
    startDate,
    endDate: input.asOfDate,
    futureInterval: null,
  };
}

function resolveRunnerActivityFitSequenceQuickPeriods(
  asOfDate: string,
  timeZone: string,
): RunnerActivityFitSequenceReadModel["advertisedPeriods"] {
  return (["this_week", "last_7_days", "last_1_month", "last_6_months"] as const).map((kind) =>
    resolveRunnerActivityFitSequencePeriod({ asOfDate, timeZone, period: { kind } }),
  ) as RunnerActivityFitSequenceReadModel["advertisedPeriods"];
}

function rollingCalendarMonthStart(asOfDate: string, months: number) {
  const [year, month, day] = asOfDate.split("-").map(Number);
  const targetMonthIndex = year * 12 + month - 1 - months;
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonth = (targetMonthIndex % 12) + 1;
  const targetDay = Math.min(day, daysInUtcMonth(targetYear, targetMonth));
  return addDaysIso(
    `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`,
    1,
  );
}

function daysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function compareFitSequenceActivities(left: Gate4ActivityInput, right: Gate4ActivityInput) {
  return (
    (left.localDate ?? "").localeCompare(right.localDate ?? "") ||
    compareNullableStartedAt(left.startedAt, right.startedAt) ||
    left.id.localeCompare(right.id)
  );
}

function compareNullableStartedAt(left: string | null, right: string | null) {
  if (left && right) return left.localeCompare(right);
  if (left) return -1;
  if (right) return 1;
  return 0;
}

function buildFitSequencePoint(input: {
  activity: Gate4ActivityInput;
  sequenceIndex: number;
  sameDayOrder: number;
}): RunnerActivityFitSequencePoint {
  const load = buildSessionRpeObservation(input.activity);
  const duration = input.activity.timerDurationMin ?? input.activity.elapsedDurationMin;
  const durationBasis = input.activity.timerDurationMin != null ? "timer" : "elapsed";
  const paceSecondsPerKm =
    duration != null && input.activity.distanceKm != null && input.activity.distanceKm > 0
      ? roundMetric((duration * 60) / input.activity.distanceKm)
      : null;
  return {
    id: input.activity.id,
    sequenceIndex: input.sequenceIndex,
    sameDayOrder: input.sameDayOrder,
    label: "Run",
    historicalTime: {
      localDate: input.activity.localDate!,
      startedAt: input.activity.startedAt,
      timezone: input.activity.historicalTimezone,
    },
    context: {
      state: input.activity.recordContext ? "available" : "unknown",
      runningContext: input.activity.recordContext,
    },
    evidence: {
      state: "current",
      label: "From FIT file",
      activityRevisionId: input.activity.activityRevisionId,
      sourceRevisionId: input.activity.sourceRevisionId,
    },
    observations: {
      distance: fitSequenceObservation({
        id: "distance",
        label: "Distance",
        value: input.activity.distanceKm,
        displayValue:
          input.activity.distanceKm == null
            ? null
            : `${formatDecimal(input.activity.distanceKm, 2)} km`,
        unit: "kilometers",
        unitLabel: "km",
        reason: "fit_distance_not_observed",
        basis: { duration: null, distance: "whole_activity", effort: null },
      }),
      timer_duration: fitSequenceObservation({
        id: "timer_duration",
        label: "Timer duration",
        value: input.activity.timerDurationMin,
        displayValue:
          input.activity.timerDurationMin == null
            ? null
            : `${formatDecimal(input.activity.timerDurationMin, 1)} min`,
        unit: "minutes",
        unitLabel: "min",
        reason: "fit_timer_duration_not_observed",
        basis: { duration: "timer", distance: null, effort: null },
      }),
      observed_average_pace: fitSequenceObservation({
        id: "observed_average_pace",
        label: "Observed average pace",
        value: paceSecondsPerKm,
        displayValue:
          paceSecondsPerKm == null ? null : `${formatElapsedSeconds(paceSecondsPerKm)}/km`,
        unit: "seconds_per_kilometer",
        unitLabel: "/km",
        reason: "fit_observed_pace_prerequisite_missing",
        basis: {
          duration: paceSecondsPerKm == null ? null : durationBasis,
          distance: paceSecondsPerKm == null ? null : "whole_activity",
          effort: null,
        },
      }),
      elevation_gain: fitSequenceObservation({
        id: "elevation_gain",
        label: "Elevation gain",
        value: input.activity.elevationGainM,
        displayValue:
          input.activity.elevationGainM == null
            ? null
            : `${formatDecimal(input.activity.elevationGainM, 1)} m`,
        unit: "meters",
        unitLabel: "m",
        reason: "fit_elevation_not_observed",
        basis: { duration: null, distance: "whole_activity", effort: null },
      }),
      reported_load: fitSequenceObservation({
        id: "reported_load",
        label: "Reported load",
        value: load.value,
        displayValue: load.value == null ? null : `${formatDecimal(load.value, 1)} AU`,
        unit: "arbitrary_units",
        unitLabel: "AU",
        reason: load.unavailableReason ?? "reported_load_unavailable",
        partial: load.availability === "available" && load.confidence === "partial",
        basis: {
          duration: load.value == null ? null : durationBasis,
          distance: null,
          effort: load.value == null ? null : "session_rpe",
        },
      }),
    },
  };
}

function fitSequenceObservation(input: {
  id: RunnerActivityFitSequenceMetricId;
  label: string;
  value: number | null;
  displayValue: string | null;
  unit: RunnerActivityFitSequenceObservation["unit"];
  unitLabel: RunnerActivityFitSequenceObservation["unitLabel"];
  reason: string;
  partial?: boolean;
  basis: RunnerActivityFitSequenceObservation["basis"];
}): RunnerActivityFitSequenceObservation {
  const available = input.value != null;
  return {
    id: input.id,
    label: input.label,
    state: available ? (input.partial ? "partial" : "available") : "unavailable",
    value: input.value,
    displayValue: input.displayValue,
    unit: input.unit,
    unitLabel: input.unitLabel,
    reason: available ? null : input.reason,
    reasonLabel: available ? null : fitProgressReasonLabel(input.reason),
    coverage: {
      includedCount: available ? 1 : 0,
      candidateCount: 1,
      missingCount: available ? 0 : 1,
    },
    basis: input.basis,
  };
}

function fitSequenceCoverage(
  points: RunnerActivityFitSequencePoint[],
): RunnerActivityFitSequenceCoverage {
  return Object.fromEntries(
    (
      [
        "distance",
        "timer_duration",
        "observed_average_pace",
        "elevation_gain",
        "reported_load",
      ] as const
    ).map((metricId) => {
      const includedCount = points.filter(
        (point) => point.observations[metricId].state !== "unavailable",
      ).length;
      return [
        metricId,
        {
          includedCount,
          eligibleActivityCount: points.length,
          missingCount: points.length - includedCount,
          label: `${includedCount} of ${points.length} FIT-recorded runs`,
        },
      ];
    }),
  ) as RunnerActivityFitSequenceCoverage;
}

function buildSessionRpeObservation(activity: Gate4ActivityInput): Gate4ObservationDraft {
  const evidence = activity.evidence.sessionRpe;
  const common = {
    activityId: activity.id,
    activityRevisionId: activity.activityRevisionId,
    sourceRevisionId: activity.sourceRevisionId,
    evidenceRevisionId: evidence?.id ?? null,
    metricKey: "session_rpe_load" as const,
    metricVariant: "whole_session",
    metricFormulaVersion: SESSION_RPE_LOAD_FORMULA_VERSION,
    unit: "arbitrary_units" as const,
    analyzedBounds: {
      durationBasis: activity.timerDurationMin != null ? "timer" : "elapsed",
      durationMinutes: activity.timerDurationMin ?? activity.elapsedDurationMin,
    },
    eligibility: {
      activityRevisionCurrent: evidence?.activityRevisionId === activity.activityRevisionId,
      rpeLinkState: activity.rpeLinkState,
      outcome: evidence?.completionOutcome ?? null,
    },
    comparabilityCohort: "runner_whole_session",
  };

  const unavailableReason = sessionRpeUnavailableReason(activity, evidence);
  if (unavailableReason) {
    return withObservationFingerprint({
      ...common,
      availability: "unavailable",
      value: null,
      exclusions: [unavailableReason],
      confidence: "unavailable",
      unavailableReason,
    });
  }

  const duration = activity.timerDurationMin ?? activity.elapsedDurationMin;
  if (duration == null || !evidence?.sessionRpe) {
    throw new Error("Session-RPE eligibility did not resolve its required evidence.");
  }
  return withObservationFingerprint({
    ...common,
    availability: "available",
    value: roundMetric(duration * evidence.sessionRpe),
    exclusions: [],
    confidence: activity.timerDurationMin != null ? "complete" : "partial",
    unavailableReason: null,
  });
}

function sessionRpeUnavailableReason(
  activity: Gate4ActivityInput,
  evidence: Gate4EvidenceInput | null,
) {
  if (!evidence) {
    if (activity.rpeInputPresent && activity.rpeLinkState === "ambiguous") {
      return "activity_rpe_link_ambiguous";
    }
    if (activity.rpeInputPresent && activity.rpeLinkState === "missing") {
      return "activity_rpe_link_missing";
    }
    return "runner_rpe_not_recorded";
  }
  if (evidence.activityRevisionId !== activity.activityRevisionId) {
    return "activity_revision_invalidated";
  }
  if (evidence.origin === "workout_log_backfill" && activity.rpeLinkState === "ambiguous") {
    return "activity_rpe_link_ambiguous";
  }
  if (evidence.origin === "workout_log_backfill" && activity.rpeLinkState === "missing") {
    return "activity_rpe_link_missing";
  }
  if (evidence.lifecycleState === "withdrawn") {
    return evidence.completionOutcome === "skipped"
      ? "skipped_has_no_session_load"
      : "runner_rpe_not_recorded";
  }
  if (evidence.completionOutcome !== "completed" && evidence.completionOutcome !== "partial") {
    return "outcome_ineligible";
  }
  if (!evidence.sessionRpe || evidence.sessionRpe < 1 || evidence.sessionRpe > 10) {
    return "rpe_out_of_range";
  }
  if (activity.timerDurationMin == null && activity.elapsedDurationMin == null) {
    return "actual_duration_not_observed";
  }
  return null;
}

function buildRecordObservations(activity: Gate4ActivityInput): Gate4ObservationDraft[] {
  const observations: Gate4ObservationDraft[] = [];
  const exactDistance = standardDistanceForKm(activity.distanceKm);
  if (exactDistance && activity.elapsedDurationMin != null) {
    observations.push(
      availableRecordObservation({
        activity,
        evidence: null,
        recordClass: "hito_observed_whole_activity",
        distance: exactDistance,
        elapsedSeconds: roundMetric(activity.elapsedDurationMin * 60),
        eventDate: activity.localDate,
        context: activity.recordContext,
        confidence: "complete",
        provenance: "canonical_activity_summary",
      }),
    );
  }

  const official = activity.evidence.officialResult;
  if (official?.lifecycleState === "asserted") {
    if (official.activityRevisionId !== activity.activityRevisionId) {
      observations.push(
        unavailableOfficialRecordObservation(activity, official, "activity_revision_invalidated"),
      );
    } else {
      const distance = standardDistanceForMeters(official.officialDistanceM);
      if (distance && official.officialElapsedSeconds) {
        observations.push(
          availableRecordObservation({
            activity,
            evidence: official,
            recordClass: "runner_confirmed_official_result",
            distance,
            elapsedSeconds: official.officialElapsedSeconds,
            eventDate: official.officialEventDate,
            context: official.officialContext,
            confidence: "partial",
            provenance: "runner_confirmed",
          }),
        );
      }
    }
  } else if (official?.lifecycleState === "withdrawn") {
    observations.push(
      unavailableOfficialRecordObservation(activity, official, "official_result_not_confirmed"),
    );
  }
  return observations;
}

function availableRecordObservation(input: {
  activity: Gate4ActivityInput;
  evidence: Gate4EvidenceInput | null;
  recordClass: RunnerActivityRecordItem["recordClass"];
  distance: StandardDistance;
  elapsedSeconds: number;
  eventDate: string | null;
  context: string | null;
  confidence: "complete" | "partial";
  provenance: RunnerActivityRecordItem["provenance"];
}): Gate4ObservationDraft {
  const contextIdentity = input.context ?? "context_unknown";
  return withObservationFingerprint({
    activityId: input.activity.id,
    activityRevisionId: input.activity.activityRevisionId,
    sourceRevisionId: input.activity.sourceRevisionId,
    evidenceRevisionId: input.evidence?.id ?? null,
    metricKey: "personal_best_elapsed",
    metricVariant: `${input.recordClass}:${input.distance.key}:${contextIdentity}`,
    metricFormulaVersion: PERSONAL_BEST_FORMULA_VERSION,
    availability: "available",
    value: roundMetric(input.elapsedSeconds),
    unit: "seconds",
    analyzedBounds: {
      recordClass: input.recordClass,
      distanceKey: input.distance.key,
      distanceMeters: input.distance.meters,
      elapsedSeconds: roundMetric(input.elapsedSeconds),
      eventDate: input.eventDate,
      context: input.context,
      provenance: input.provenance,
    },
    eligibility: { wholeActivityExactDistance: true },
    exclusions: [],
    comparabilityCohort: contextIdentity,
    confidence: input.confidence,
    unavailableReason: null,
  });
}

function unavailableOfficialRecordObservation(
  activity: Gate4ActivityInput,
  evidence: Gate4EvidenceInput,
  reason: "activity_revision_invalidated" | "official_result_not_confirmed",
) {
  return withObservationFingerprint({
    activityId: activity.id,
    activityRevisionId: activity.activityRevisionId,
    sourceRevisionId: activity.sourceRevisionId,
    evidenceRevisionId: evidence.id,
    metricKey: "personal_best_elapsed",
    metricVariant: "runner_confirmed_official_result:unavailable",
    metricFormulaVersion: PERSONAL_BEST_FORMULA_VERSION,
    availability: "unavailable",
    value: null,
    unit: "seconds",
    analyzedBounds: {},
    eligibility: {
      activityRevisionCurrent: evidence.activityRevisionId === activity.activityRevisionId,
    },
    exclusions: [reason],
    comparabilityCohort: null,
    confidence: "unavailable",
    unavailableReason: reason,
  });
}

function withObservationFingerprint(
  observation: Omit<Gate4ObservationDraft, "inputFingerprintSha256">,
): Gate4ObservationDraft {
  return {
    ...observation,
    inputFingerprintSha256: createHash("sha256").update(JSON.stringify(observation)).digest("hex"),
  };
}

type FitChartMetricDefinition = {
  id: RunnerActivityFitChartMetricId;
  title: string;
  purpose: string;
  unit: Extract<RunnerActivityFitChartSeries, { status: "ready" }>["unit"];
  unitLabel: Extract<RunnerActivityFitChartSeries, { status: "ready" }>["unitLabel"];
  display: Extract<RunnerActivityFitChartSeries, { status: "ready" }>["display"];
};

type FitChartBucket = {
  id: string;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  shortLabel: string;
  accessibleLabel: string;
  completion: RunnerActivityFitChartPoint["completion"];
  completionLabel: RunnerActivityFitChartPoint["completionLabel"];
};

const FIT_CHART_METRICS: readonly FitChartMetricDefinition[] = Object.freeze([
  {
    id: "sessions",
    title: "Sessions",
    purpose: "Recorded running sessions",
    unit: "sessions",
    unitLabel: "sessions",
    display: { format: "integer", maximumFractionDigits: 0 },
  },
  {
    id: "running_time",
    title: "Running time",
    purpose: "Recorded timer duration",
    unit: "minutes",
    unitLabel: "min",
    display: { format: "duration_minutes", maximumFractionDigits: 1 },
  },
  {
    id: "distance",
    title: "Distance",
    purpose: "Recorded whole-activity distance",
    unit: "kilometers",
    unitLabel: "km",
    display: { format: "decimal", maximumFractionDigits: 2 },
  },
  {
    id: "elevation",
    title: "Elevation gain",
    purpose: "Recorded whole-activity elevation gain",
    unit: "meters",
    unitLabel: "m",
    display: { format: "integer", maximumFractionDigits: 0 },
  },
  {
    id: "reported_load",
    title: "Reported load",
    purpose: "Recorded duration multiplied by runner-reported effort",
    unit: "arbitrary_units",
    unitLabel: "AU",
    display: { format: "integer", maximumFractionDigits: 0 },
  },
]);

function buildFitProgressPayload(input: {
  asOfDate: string;
  activities: Gate4ActivityInput[];
  observations: Gate4PersistedObservation[];
}): RunnerActivityFitProgressReadModel {
  const period = buildExact28DayPeriod(input.asOfDate);
  const { buckets, ...periodContract } = period;
  const loadObservationByActivityId = new Map(
    input.observations
      .filter((observation) => observation.metricKey === "session_rpe_load")
      .map((observation) => [observation.activityId, observation]),
  );
  const chartActivities = input.activities.filter(
    (activity) =>
      activity.localDate != null &&
      activity.localDate >= period.startDate &&
      activity.localDate <= period.endDate,
  );
  return {
    status: "current",
    evidenceLabel: "From FIT file",
    chart: {
      advertisedPeriods: [
        {
          ...periodContract,
          series: FIT_CHART_METRICS.map((metric) =>
            buildFitChartSeries({
              metric,
              buckets,
              activities: chartActivities,
              loadObservationByActivityId,
            }),
          ),
        },
      ],
    },
    personalBests: {
      formulaVersion: FIT_PROGRESS_FORMULA_VERSION,
      matchingRule: "exact_whole_activity_distance_within_0_05_meters",
      slots: FIT_PERSONAL_BEST_SLOTS.map((slot) =>
        buildFitPersonalBestSlot(slot, input.activities),
      ),
    },
  };
}

function buildExact28DayPeriod(asOfDate: string): Omit<RunnerActivityFitChartPeriod, "series"> & {
  buckets: FitChartBucket[];
} {
  const startDate = addDaysIso(asOfDate, -27);
  const buckets: FitChartBucket[] = [];
  let weekStart = startOfWeekIso(startDate);
  while (weekStart <= asOfDate) {
    const nominalEnd = addDaysIso(weekStart, 6);
    const bucketStart = weekStart < startDate ? startDate : weekStart;
    const bucketEnd = nominalEnd > asOfDate ? asOfDate : nominalEnd;
    const completion: FitChartBucket["completion"] =
      bucketStart > weekStart ? "partial_start" : bucketEnd < nominalEnd ? "to_date" : "complete";
    buckets.push({
      id: `${bucketStart}_${bucketEnd}`,
      startDate: bucketStart,
      endDate: bucketEnd,
      cutoffDate: bucketEnd,
      shortLabel: `${bucketStart.slice(5)}–${bucketEnd.slice(5)}`,
      accessibleLabel: `${bucketStart} through ${bucketEnd}`,
      completion,
      completionLabel:
        completion === "partial_start"
          ? "Partial week"
          : completion === "to_date"
            ? "To date"
            : "Complete week",
    });
    weekStart = addDaysIso(weekStart, 7);
  }
  return {
    id: "28_days",
    label: "28 days",
    startDate,
    endDate: asOfDate,
    state: "to_date",
    bucketResolution: "calendar_week",
    timezoneBasis: "historical_local_date",
    weekStartsOn: "monday",
    buckets,
  };
}

function buildFitChartSeries(input: {
  metric: FitChartMetricDefinition;
  buckets: FitChartBucket[];
  activities: Gate4ActivityInput[];
  loadObservationByActivityId: Map<string, Gate4PersistedObservation>;
}): RunnerActivityFitChartSeries {
  const identity = {
    id: input.metric.id,
    title: input.metric.title,
    purpose: input.metric.purpose,
    unit: input.metric.unit,
    unitLabel: input.metric.unitLabel,
    display: input.metric.display,
    evidenceLabel: "From FIT file" as const,
    formulaVersion: FIT_PROGRESS_FORMULA_VERSION,
  };
  if (input.activities.some((activity) => activity.fitEvidence.state === "updating")) {
    return {
      ...identity,
      status: "updating",
      reason: "fit_evidence_updating",
      reasonLabel: "FIT evidence is updating.",
      staleValuesReturned: false,
      points: [],
    };
  }
  return {
    ...identity,
    status: "ready",
    points: input.buckets.map((bucket) =>
      buildFitChartPoint({
        metric: input.metric,
        bucket,
        activities: input.activities.filter(
          (activity) =>
            activity.localDate != null &&
            activity.localDate >= bucket.startDate &&
            activity.localDate <= bucket.endDate,
        ),
        loadObservationByActivityId: input.loadObservationByActivityId,
      }),
    ),
  };
}

function buildFitChartPoint(input: {
  metric: FitChartMetricDefinition;
  bucket: FitChartBucket;
  activities: Gate4ActivityInput[];
  loadObservationByActivityId: Map<string, Gate4PersistedObservation>;
}): RunnerActivityFitChartPoint {
  const values: number[] = [];
  const missingReasons: string[] = [];
  for (const activity of input.activities) {
    if (activity.fitEvidence.state !== "eligible") {
      missingReasons.push(activity.fitEvidence.reason);
      continue;
    }
    const metricValue = fitChartMetricValue(
      input.metric.id,
      activity,
      input.loadObservationByActivityId.get(activity.id) ?? null,
    );
    if (metricValue.value == null) {
      missingReasons.push(metricValue.reason);
    } else {
      values.push(metricValue.value);
    }
  }

  const candidateCount = input.activities.length;
  const missingCount = candidateCount - values.length;
  const reasons = Array.from(new Set(missingReasons)).sort(compareUnavailableReasons);
  const state: RunnerActivityFitChartPoint["state"] =
    missingCount === 0 ? "available" : values.length > 0 ? "partial" : "unavailable";
  const value =
    state === "unavailable" ? null : roundMetric(values.reduce((sum, item) => sum + item, 0));
  return {
    ...input.bucket,
    state,
    value,
    displayValue: value == null ? null : formatFitChartValue(input.metric.id, value),
    coverage: {
      includedCount: values.length,
      candidateCount,
      missingCount,
      label: `${values.length} of ${candidateCount} accepted activities`,
    },
    reasons,
    reasonLabels: reasons.map(fitProgressReasonLabel),
  };
}

function fitChartMetricValue(
  metricId: RunnerActivityFitChartMetricId,
  activity: Gate4ActivityInput,
  loadObservation: Gate4PersistedObservation | null,
): { value: number | null; reason: string } {
  switch (metricId) {
    case "sessions":
      return { value: 1, reason: "fit_activity_not_eligible" };
    case "running_time":
      return {
        value: activity.timerDurationMin,
        reason: "fit_timer_duration_not_observed",
      };
    case "distance":
      return { value: activity.distanceKm, reason: "fit_distance_not_observed" };
    case "elevation":
      return { value: activity.elevationGainM, reason: "fit_elevation_not_observed" };
    case "reported_load":
      return loadObservation?.availability === "available" && loadObservation.value != null
        ? { value: loadObservation.value, reason: "reported_load_unavailable" }
        : {
            value: null,
            reason: loadObservation?.unavailableReason ?? "runner_rpe_not_recorded",
          };
  }
}

function buildFitPersonalBestSlot(
  slot: (typeof FIT_PERSONAL_BEST_SLOTS)[number],
  activities: Gate4ActivityInput[],
): RunnerActivityFitPersonalBestSlot {
  const identity = { id: slot.id, label: slot.label, distanceMeters: slot.meters };
  const candidates = activities.filter(
    (activity) =>
      activity.distanceKm != null && Math.abs(activity.distanceKm * 1000 - slot.meters) <= 0.05,
  );
  if (candidates.some((activity) => activity.fitEvidence.state === "updating")) {
    return {
      ...identity,
      state: "updating",
      reason: "fit_evidence_updating",
      reasonLabel: "FIT evidence is updating.",
      result: null,
    };
  }
  const available = candidates.filter(
    (activity) => activity.fitEvidence.state === "eligible" && activity.elapsedDurationMin != null,
  );
  const fastest = available.reduce<Gate4ActivityInput | null>(
    (current, activity) =>
      !current ||
      (activity.elapsedDurationMin ?? Number.POSITIVE_INFINITY) <
        (current.elapsedDurationMin ?? Number.POSITIVE_INFINITY) ||
      ((activity.elapsedDurationMin ?? Number.POSITIVE_INFINITY) ===
        (current.elapsedDurationMin ?? Number.POSITIVE_INFINITY) &&
        activity.id.localeCompare(current.id) < 0)
        ? activity
        : current,
    null,
  );
  if (fastest?.elapsedDurationMin != null) {
    const elapsedSeconds = roundMetric(fastest.elapsedDurationMin * 60);
    return {
      ...identity,
      state: "available",
      reason: null,
      reasonLabel: null,
      result: {
        elapsedSeconds,
        displayValue: formatElapsedSeconds(elapsedSeconds),
        eventDate: fastest.localDate,
        evidenceLabel: "From FIT file",
        source: {
          activityId: fastest.id,
          activityRevisionId: fastest.activityRevisionId,
        },
      },
    };
  }
  if (candidates.length === 0) {
    return {
      ...identity,
      state: "no_verified_time",
      reason: "no_verified_fit_time",
      reasonLabel: "No verified FIT time yet.",
      result: null,
    };
  }
  const reason =
    candidates.find((activity) => activity.fitEvidence.state === "unavailable")?.fitEvidence
      .reason ?? "fit_elapsed_time_not_observed";
  return {
    ...identity,
    state: "unavailable",
    reason,
    reasonLabel: fitProgressReasonLabel(reason),
    result: null,
  };
}

function formatFitChartValue(metricId: RunnerActivityFitChartMetricId, value: number) {
  switch (metricId) {
    case "sessions":
      return `${Math.round(value)} sessions`;
    case "running_time":
      return `${formatDecimal(value, 1)} min`;
    case "distance":
      return `${formatDecimal(value, 2)} km`;
    case "elevation":
      return `${Math.round(value)} m`;
    case "reported_load":
      return `${Math.round(value)} AU`;
  }
}

function formatElapsedSeconds(value: number) {
  const totalSeconds = Math.round(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDecimal(value: number, maximumFractionDigits: number) {
  return value.toFixed(maximumFractionDigits).replace(/\.?0+$/, "");
}

function fitProgressReasonLabel(reason: string) {
  switch (reason) {
    case "fit_source_removal_pending":
    case "fit_evidence_updating":
      return "FIT evidence is updating.";
    case "fit_source_removed":
      return "The original FIT file is no longer available.";
    case "fit_source_revision_not_current":
    case "fit_source_graph_invalid":
      return "FIT evidence cannot be verified.";
    case "fit_timer_duration_not_observed":
      return "Timer duration was not available in the FIT file.";
    case "fit_distance_not_observed":
      return "Distance was not available in the FIT file.";
    case "fit_elevation_not_observed":
      return "Elevation gain was not available in the FIT file.";
    case "fit_elapsed_time_not_observed":
      return "Elapsed time was not available in the FIT file.";
    case "fit_observed_pace_prerequisite_missing":
      return "Observed distance or duration was not available for pace.";
    case "runner_rpe_not_recorded":
      return "Runner-reported effort is missing.";
    case "activity_rpe_link_ambiguous":
    case "activity_rpe_link_missing":
      return "Reported effort cannot be matched to this activity.";
    case "activity_revision_invalidated":
      return "Reported effort belongs to an older activity revision.";
    case "skipped_has_no_session_load":
    case "outcome_ineligible":
      return "This activity has no eligible reported load.";
    case "actual_duration_not_observed":
      return "Actual duration is missing for reported load.";
    case "rpe_out_of_range":
      return "Runner-reported effort is invalid.";
    case "reported_load_unavailable":
      return "Reported load is unavailable.";
    default:
      return "FIT evidence is unavailable.";
  }
}

function loadWindow(
  observations: Gate4PersistedObservation[],
  startDate: string,
  endDate: string,
): RunnerActivitySessionLoadWindow {
  const windowObservations = observations.filter(
    (observation) =>
      observation.localDate != null &&
      observation.localDate >= startDate &&
      observation.localDate <= endDate,
  );
  return {
    startDate,
    endDate,
    metric: aggregateSessionLoad(windowObservations),
  };
}

function aggregateSessionLoad(
  observations: Gate4PersistedObservation[],
): RunnerActivitySessionLoadMetric {
  const available = observations.filter(
    (observation) => observation.availability === "available" && observation.value != null,
  );
  const unavailable = observations.filter(
    (observation) => observation.availability === "unavailable",
  );
  const unavailableReasons = Array.from(
    new Set(unavailable.flatMap((observation) => observation.unavailableReason ?? [])),
  ).sort(compareUnavailableReasons);
  if (available.length === 0) {
    return {
      availability: "unavailable",
      confidence: "unavailable",
      value: null,
      displayValue: null,
      unit: "arbitrary_units",
      includedObservationCount: 0,
      unavailableObservationCount: unavailable.length,
      unavailableReasons:
        unavailableReasons.length > 0 ? unavailableReasons : ["runner_rpe_not_recorded"],
      observationIds: observations.map((observation) => observation.id).sort(),
    };
  }
  const value = roundMetric(
    available.reduce((total, observation) => total + (observation.value ?? 0), 0),
  );
  return {
    availability: "available",
    confidence:
      unavailable.length === 0 && available.every((value) => value.confidence === "complete")
        ? "complete"
        : "partial",
    value,
    displayValue: Math.round(value),
    unit: "arbitrary_units",
    includedObservationCount: available.length,
    unavailableObservationCount: unavailable.length,
    unavailableReasons,
    observationIds: observations.map((observation) => observation.id).sort(),
  };
}

function selectFastestRecords(
  observations: Gate4PersistedObservation[],
): RunnerActivityRecordItem[] {
  const selected = new Map<string, Gate4PersistedObservation>();
  for (const observation of observations) {
    const current = selected.get(observation.metricVariant);
    if (
      !current ||
      (observation.value ?? Number.POSITIVE_INFINITY) < (current.value ?? Number.POSITIVE_INFINITY)
    ) {
      selected.set(observation.metricVariant, observation);
    }
  }
  return Array.from(selected.values())
    .map(recordItemFromObservation)
    .sort(
      (left, right) =>
        left.distanceMeters - right.distanceMeters ||
        left.recordClass.localeCompare(right.recordClass) ||
        (left.context ?? "context_unknown").localeCompare(right.context ?? "context_unknown"),
    );
}

function recordItemFromObservation(
  observation: Gate4PersistedObservation,
): RunnerActivityRecordItem {
  const bounds = observation.analyzedBounds;
  const recordClass = bounds.recordClass;
  const provenance = bounds.provenance;
  if (
    (recordClass !== "hito_observed_whole_activity" &&
      recordClass !== "runner_confirmed_official_result") ||
    (provenance !== "canonical_activity_summary" && provenance !== "runner_confirmed") ||
    typeof bounds.distanceKey !== "string" ||
    typeof bounds.distanceMeters !== "number" ||
    typeof bounds.elapsedSeconds !== "number"
  ) {
    throw new Error("Gate 4 record observation bounds are invalid.");
  }
  return {
    observationId: observation.id,
    activityId: observation.activityId,
    activityRevisionId: observation.activityRevisionId,
    sourceRevisionId: observation.sourceRevisionId,
    evidenceRevisionId: observation.evidenceRevisionId,
    recordClass,
    distanceKey: bounds.distanceKey,
    distanceMeters: bounds.distanceMeters,
    elapsedSeconds: bounds.elapsedSeconds,
    eventDate: typeof bounds.eventDate === "string" ? bounds.eventDate : null,
    confidence: observation.confidence === "complete" ? "complete" : "partial",
    provenance,
    context: typeof bounds.context === "string" ? bounds.context : null,
    formulaVersion: PERSONAL_BEST_FORMULA_VERSION,
  };
}

function standardDistanceForKm(distanceKm: number | null) {
  return distanceKm == null ? null : standardDistanceForMeters(distanceKm * 1000);
}

function standardDistanceForMeters(distanceMeters: number | null) {
  if (distanceMeters == null) return null;
  return (
    RUNNER_RECORD_STANDARD_DISTANCES.find(
      (distance) => Math.abs(distance.meters - distanceMeters) <= 0.05,
    ) ?? null
  );
}

function unavailableStreamMetric(formulaVersion: string) {
  return {
    status: "unavailable" as const,
    reason: "normalized_stream_not_persisted" as const,
    formulaVersion,
  };
}

const UNAVAILABLE_REASON_PRIORITY = [
  "activity_rpe_link_ambiguous",
  "activity_rpe_link_missing",
  "activity_revision_invalidated",
  "skipped_has_no_session_load",
  "actual_duration_not_observed",
  "runner_rpe_not_recorded",
];

function compareUnavailableReasons(left: string, right: string) {
  const leftIndex = UNAVAILABLE_REASON_PRIORITY.indexOf(left);
  const rightIndex = UNAVAILABLE_REASON_PRIORITY.indexOf(right);
  return (
    (leftIndex < 0 ? Number.POSITIVE_INFINITY : leftIndex) -
      (rightIndex < 0 ? Number.POSITIVE_INFINITY : rightIndex) || left.localeCompare(right)
  );
}

function roundMetric(value: number) {
  return Math.round(value * 1000) / 1000;
}
