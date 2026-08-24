import { useState } from "react";

import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ReferenceListRow } from "@/components/hito-ds/reference";
import { HitoDsWorkbenchChoiceControl } from "@/components/hito-ds/workbench-settings-controls";
import { HitoButton } from "@/components/ui/button";
import {
  HitoFactualActivityPointSequence,
  type HitoFactualActivityPointSequenceError,
  type HitoFactualActivityPointSequenceModel,
} from "@/components/ui/hito-factual-activity-point-sequence";
import type {
  RunnerActivityFitSequenceMetricId,
  RunnerActivityFitSequenceObservation,
  RunnerActivityFitSequencePeriod,
  RunnerActivityFitSequenceProductModel,
  RunnerActivityFitSequenceProductPoint,
} from "@/lib/runner-activity/product-contract";

const SEQUENCE_STATES = [
  { label: "Ready", value: "ready" },
  { label: "Empty", value: "empty" },
  { label: "Updating", value: "updating" },
  { label: "Incomplete", value: "unavailable" },
  { label: "Error", value: "error" },
  { label: "Future week", value: "future" },
] as const;

const METRIC_OPTIONS = [
  { label: "Distance", value: "distance" },
  { label: "Duration", value: "timer_duration" },
  { label: "Pace", value: "observed_average_pace" },
  { label: "Elevation", value: "elevation_gain" },
  { label: "Load", value: "reported_load" },
] as const;

type SequenceState = (typeof SEQUENCE_STATES)[number]["value"];

const THIS_WEEK_PERIOD = {
  id: "this_week",
  label: "This week",
  startDate: "2026-08-17",
  endDate: "2026-08-23",
  asOfDate: "2026-08-17",
  timezoneBasis: {
    period: "runner_calendar_timezone",
    activities: "historical_local_date",
    timeZone: "America/Sao_Paulo",
  },
  futureInterval: { startDate: "2026-08-18", endDate: "2026-08-23" },
} satisfies RunnerActivityFitSequencePeriod;

const LAST_7_DAYS_PERIOD = {
  id: "last_7_days",
  label: "Last 7 days",
  startDate: "2026-08-10",
  endDate: "2026-08-16",
  asOfDate: "2026-08-16",
  timezoneBasis: {
    period: "runner_calendar_timezone",
    activities: "historical_local_date",
    timeZone: "America/Sao_Paulo",
  },
  futureInterval: null,
} satisfies RunnerActivityFitSequencePeriod;

const LAST_1_MONTH_PERIOD = {
  id: "last_1_month",
  label: "Last 1 month",
  startDate: "2026-07-17",
  endDate: "2026-08-16",
  asOfDate: "2026-08-16",
  timezoneBasis: {
    period: "runner_calendar_timezone",
    activities: "historical_local_date",
    timeZone: "America/Sao_Paulo",
  },
  futureInterval: null,
} satisfies RunnerActivityFitSequencePeriod;

const LAST_6_MONTHS_PERIOD = {
  id: "last_6_months",
  label: "Last 6 months",
  startDate: "2026-02-17",
  endDate: "2026-08-16",
  asOfDate: "2026-08-16",
  timezoneBasis: {
    period: "runner_calendar_timezone",
    activities: "historical_local_date",
    timeZone: "America/Sao_Paulo",
  },
  futureInterval: null,
} satisfies RunnerActivityFitSequencePeriod;

const ADVERTISED_PERIODS = [
  THIS_WEEK_PERIOD,
  LAST_7_DAYS_PERIOD,
  LAST_1_MONTH_PERIOD,
  LAST_6_MONTHS_PERIOD,
] satisfies [
  RunnerActivityFitSequencePeriod,
  RunnerActivityFitSequencePeriod,
  RunnerActivityFitSequencePeriod,
  RunnerActivityFitSequencePeriod,
];

const FORMULA_VERSION = "runner_activity_fit_sequence_v1";

export const FACTUAL_ACTIVITY_SEQUENCE_READY = {
  status: "ready",
  formulaVersion: FORMULA_VERSION,
  evidenceLabel: "From FIT file",
  advertisedPeriods: ADVERTISED_PERIODS,
  selectedPeriod: LAST_7_DAYS_PERIOD,
  completeness: {
    state: "complete",
    eligibleActivityCount: 5,
    returnedPointCount: 5,
  },
  coverage: {
    distance: {
      includedCount: 4,
      eligibleActivityCount: 5,
      missingCount: 1,
      label: "4 of 5 activities include distance",
    },
    timer_duration: {
      includedCount: 5,
      eligibleActivityCount: 5,
      missingCount: 0,
      label: "5 of 5 activities include timer duration",
    },
    observed_average_pace: {
      includedCount: 4,
      eligibleActivityCount: 5,
      missingCount: 1,
      label: "4 of 5 activities include observed average pace",
    },
    elevation_gain: {
      includedCount: 4,
      eligibleActivityCount: 5,
      missingCount: 1,
      label: "4 of 5 activities include elevation gain",
    },
    reported_load: {
      includedCount: 4,
      eligibleActivityCount: 5,
      missingCount: 1,
      label: "4 of 5 activities include reported load",
    },
  },
  points: [
    activityPoint({
      id: "fit-run-1",
      sequenceIndex: 0,
      sameDayOrder: 0,
      localDate: "2026-08-10",
      startedAt: "2026-08-10T09:15:00.000Z",
      context: "Easy run",
      distance: observation("distance", "Distance", 6.4, "6.4 km", "kilometers", "km"),
      duration: observation("timer_duration", "Timer duration", 38, "38 min", "minutes", "min", {
        duration: "timer",
      }),
      pace: observation(
        "observed_average_pace",
        "Observed average pace",
        356,
        "5:56/km",
        "seconds_per_kilometer",
        "/km",
        { duration: "timer", distance: "whole_activity" },
      ),
      elevation: observation("elevation_gain", "Elevation gain", 42, "42 m", "meters", "m"),
      load: observation("reported_load", "Reported load", 105, "105 AU", "arbitrary_units", "AU", {
        effort: "session_rpe",
      }),
    }),
    activityPoint({
      id: "fit-run-2",
      sequenceIndex: 1,
      sameDayOrder: 0,
      localDate: "2026-08-12",
      startedAt: "2026-08-12T20:30:00.000Z",
      context: "Intervals",
      distance: observation(
        "distance",
        "Distance",
        7.2,
        "7.2 km",
        "kilometers",
        "km",
        {},
        {
          state: "partial",
          reason: "fit_distance_partial",
          reasonLabel: "Distance coverage is partial in the accepted FIT activity.",
        },
      ),
      duration: observation("timer_duration", "Timer duration", 52, "52 min", "minutes", "min", {
        duration: "timer",
      }),
      pace: observation(
        "observed_average_pace",
        "Observed average pace",
        322,
        "5:22/km",
        "seconds_per_kilometer",
        "/km",
        { duration: "timer", distance: "whole_activity" },
      ),
      elevation: observation("elevation_gain", "Elevation gain", 65, "65 m", "meters", "m"),
      load: observation("reported_load", "Reported load", 228, "228 AU", "arbitrary_units", "AU", {
        effort: "session_rpe",
      }),
    }),
    activityPoint({
      id: "fit-run-3",
      sequenceIndex: 2,
      sameDayOrder: 0,
      localDate: "2026-08-14",
      startedAt: "2026-08-14T09:00:00.000Z",
      context: "Recovery run",
      distance: observation("distance", "Distance", 4.1, "4.1 km", "kilometers", "km"),
      duration: observation("timer_duration", "Timer duration", 27, "27 min", "minutes", "min", {
        duration: "timer",
      }),
      pace: observation(
        "observed_average_pace",
        "Observed average pace",
        395,
        "6:35/km",
        "seconds_per_kilometer",
        "/km",
        { duration: "timer", distance: "whole_activity" },
      ),
      elevation: observation("elevation_gain", "Elevation gain", 18, "18 m", "meters", "m"),
      load: observation("reported_load", "Reported load", 54, "54 AU", "arbitrary_units", "AU", {
        effort: "session_rpe",
      }),
    }),
    activityPoint({
      id: "fit-run-4",
      sequenceIndex: 3,
      sameDayOrder: 1,
      localDate: "2026-08-14",
      startedAt: "2026-08-14T21:10:00.000Z",
      context: "Steady run",
      distance: observation("distance", "Distance", 9.8, "9.8 km", "kilometers", "km"),
      duration: observation("timer_duration", "Timer duration", 55, "55 min", "minutes", "min", {
        duration: "timer",
      }),
      pace: observation(
        "observed_average_pace",
        "Observed average pace",
        337,
        "5:37/km",
        "seconds_per_kilometer",
        "/km",
        { duration: "timer", distance: "whole_activity" },
      ),
      elevation: observation("elevation_gain", "Elevation gain", 91, "91 m", "meters", "m"),
      load: observation(
        "reported_load",
        "Reported load",
        null,
        null,
        "arbitrary_units",
        "AU",
        {},
        {
          state: "unavailable",
          reason: "session_rpe_missing",
          reasonLabel: "Session RPE was not reported for this run.",
        },
      ),
    }),
    activityPoint({
      id: "fit-run-5",
      sequenceIndex: 4,
      sameDayOrder: 0,
      localDate: "2026-08-16",
      startedAt: "2026-08-16T10:20:00.000Z",
      context: "Long run",
      distance: observation(
        "distance",
        "Distance",
        null,
        null,
        "kilometers",
        "km",
        {},
        {
          state: "unavailable",
          reason: "fit_distance_unavailable",
          reasonLabel: "Distance is unavailable in the accepted FIT activity.",
        },
      ),
      duration: observation("timer_duration", "Timer duration", 82, "82 min", "minutes", "min", {
        duration: "timer",
      }),
      pace: observation(
        "observed_average_pace",
        "Observed average pace",
        null,
        null,
        "seconds_per_kilometer",
        "/km",
        {},
        {
          state: "unavailable",
          reason: "whole_activity_distance_unavailable",
          reasonLabel: "Observed average pace is unavailable without whole-activity distance.",
        },
      ),
      elevation: observation(
        "elevation_gain",
        "Elevation gain",
        null,
        null,
        "meters",
        "m",
        {},
        {
          state: "unavailable",
          reason: "fit_elevation_unavailable",
          reasonLabel: "Elevation gain is unavailable in the accepted FIT activity.",
        },
      ),
      load: observation("reported_load", "Reported load", 310, "310 AU", "arbitrary_units", "AU", {
        effort: "session_rpe",
      }),
    }),
  ],
} satisfies RunnerActivityFitSequenceProductModel;

export const FACTUAL_ACTIVITY_SEQUENCE_DEFAULT_METRIC = "distance" as const;

const EMPTY_SEQUENCE = {
  ...FACTUAL_ACTIVITY_SEQUENCE_READY,
  status: "empty",
  completeness: { state: "complete", eligibleActivityCount: 0, returnedPointCount: 0 },
  coverage: emptyCoverage(),
  points: [],
} satisfies RunnerActivityFitSequenceProductModel;

const UPDATING_SEQUENCE = {
  status: "updating",
  formulaVersion: FORMULA_VERSION,
  evidenceLabel: "From FIT file",
  advertisedPeriods: ADVERTISED_PERIODS,
  selectedPeriod: LAST_7_DAYS_PERIOD,
  reason: "fit_evidence_updating",
  reasonLabel: "FIT evidence is updating. No stale activity points are shown.",
  staleValuesReturned: false,
  points: [],
} satisfies RunnerActivityFitSequenceProductModel;

const UNAVAILABLE_SEQUENCE = {
  status: "unavailable",
  formulaVersion: FORMULA_VERSION,
  evidenceLabel: "From FIT file",
  advertisedPeriods: ADVERTISED_PERIODS,
  selectedPeriod: LAST_7_DAYS_PERIOD,
  reason: "sequence_incomplete",
  reasonLabel: "The complete eligible FIT activity sequence is unavailable.",
  staleValuesReturned: false,
  points: [],
} satisfies RunnerActivityFitSequenceProductModel;

const ERROR_SEQUENCE = {
  status: "error",
  formulaVersion: FORMULA_VERSION,
  evidenceLabel: "From FIT file",
  advertisedPeriods: ADVERTISED_PERIODS,
  selectedPeriod: LAST_7_DAYS_PERIOD,
  reasonLabel: "FIT activity evidence could not be loaded. Try again.",
  staleValuesReturned: false,
  points: [],
} satisfies HitoFactualActivityPointSequenceError;

const FUTURE_WEEK_SEQUENCE = {
  ...FACTUAL_ACTIVITY_SEQUENCE_READY,
  selectedPeriod: THIS_WEEK_PERIOD,
  completeness: { state: "complete", eligibleActivityCount: 1, returnedPointCount: 1 },
  coverage: singlePointCoverage(),
  points: [
    activityPoint({
      id: "fit-run-this-week",
      sequenceIndex: 0,
      sameDayOrder: 0,
      localDate: "2026-08-17",
      startedAt: "2026-08-17T09:30:00.000Z",
      context: "Easy run",
      distance: observation("distance", "Distance", 5.3, "5.3 km", "kilometers", "km"),
      duration: observation("timer_duration", "Timer duration", 32, "32 min", "minutes", "min", {
        duration: "timer",
      }),
      pace: observation(
        "observed_average_pace",
        "Observed average pace",
        362,
        "6:02/km",
        "seconds_per_kilometer",
        "/km",
        { duration: "timer", distance: "whole_activity" },
      ),
      elevation: observation("elevation_gain", "Elevation gain", 31, "31 m", "meters", "m"),
      load: observation("reported_load", "Reported load", 92, "92 AU", "arbitrary_units", "AU", {
        effort: "session_rpe",
      }),
    }),
  ],
} satisfies RunnerActivityFitSequenceProductModel;

const SEQUENCE_BY_STATE: Record<SequenceState, HitoFactualActivityPointSequenceModel> = {
  ready: FACTUAL_ACTIVITY_SEQUENCE_READY,
  empty: EMPTY_SEQUENCE,
  updating: UPDATING_SEQUENCE,
  unavailable: UNAVAILABLE_SEQUENCE,
  error: ERROR_SEQUENCE,
  future: FUTURE_WEEK_SEQUENCE,
};

export function FactualActivityPointSequencePlayground() {
  const [sequenceState, setSequenceState] = useState<SequenceState>("ready");
  const [metricId, setMetricId] = useState<RunnerActivityFitSequenceMetricId>(
    FACTUAL_ACTIVITY_SEQUENCE_DEFAULT_METRIC,
  );

  return (
    <HitoDsPlayground
      id="factual-activity-point-sequence"
      label="Factual Activity Point Sequence"
      status="Shared component"
      statusTone="signal"
      description={{
        purpose:
          "Render every Backend-supplied FIT activity at its historical date and time for one selected factual metric.",
        useWhen:
          "The server supplies the exact period, complete chronological membership, per-activity observations, coverage, context, and state.",
        avoidWhen:
          "The client would need to aggregate, sample, cap members, derive dates or metrics, connect unrelated workouts, or claim a performance direction.",
        accessibility:
          "The plot has one page tab stop, Arrow and Home/End navigation, Enter/Space pinning, Escape dismissal, identical pointer/focus/tap facts, and a visible all-member native table.",
      }}
      usedIn={
        <span className="hito-technical-sm text-secondary">
          Runner Progress · Product adoption pending
        </span>
      }
      preview={
        <div className="w-full min-w-0" data-hito-ds-factual-activity-point-sequence>
          <HitoFactualActivityPointSequence
            key={`${sequenceState}:${metricId}`}
            controls={{
              ariaLabel: "Factual activity sequence reference controls",
              content: (
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <HitoDsWorkbenchChoiceControl
                    label="Metric"
                    value={metricId}
                    options={METRIC_OPTIONS}
                    onChange={setMetricId}
                  />
                  <HitoDsWorkbenchChoiceControl
                    label="Reference state"
                    value={sequenceState}
                    options={SEQUENCE_STATES}
                    onChange={setSequenceState}
                  />
                </div>
              ),
            }}
            metricId={metricId}
            sequence={SEQUENCE_BY_STATE[sequenceState]}
            stateAction={
              sequenceState === "error" ? (
                <HitoButton size="sm" variant="secondary" onClick={() => setSequenceState("ready")}>
                  Try again
                </HitoButton>
              ) : undefined
            }
          />
        </div>
      }
      controls={
        <div className="hito-row-group border-0">
          <ReferenceListRow
            label="Input boundary"
            title="One supplied activity sequence"
            body="The primitive receives one selected metric over exact server-owned dates, membership, observations, coverage, context, future interval, and state. It calculates presentation geometry only."
          />
        </div>
      }
    />
  );
}

function observation(
  id: RunnerActivityFitSequenceMetricId,
  label: string,
  value: number | null,
  displayValue: string | null,
  unit: RunnerActivityFitSequenceObservation["unit"],
  unitLabel: RunnerActivityFitSequenceObservation["unitLabel"],
  basis: Partial<RunnerActivityFitSequenceObservation["basis"]> = {},
  state: {
    reason?: string;
    reasonLabel?: string;
    state?: RunnerActivityFitSequenceObservation["state"];
  } = {},
): RunnerActivityFitSequenceObservation {
  const observationState = state.state ?? "available";
  return {
    id,
    label,
    state: observationState,
    value,
    displayValue,
    unit,
    unitLabel,
    reason: state.reason ?? null,
    reasonLabel: state.reasonLabel ?? null,
    coverage: {
      includedCount: observationState === "unavailable" ? 0 : 1,
      candidateCount: 1,
      missingCount: observationState === "unavailable" ? 1 : 0,
    },
    basis: {
      duration: basis.duration ?? null,
      distance: basis.distance ?? null,
      effort: basis.effort ?? null,
    },
  };
}

function activityPoint({
  context,
  distance,
  duration,
  elevation,
  id,
  load,
  localDate,
  pace,
  sameDayOrder,
  sequenceIndex,
  startedAt,
}: {
  context: string;
  distance: RunnerActivityFitSequenceObservation;
  duration: RunnerActivityFitSequenceObservation;
  elevation: RunnerActivityFitSequenceObservation;
  id: string;
  load: RunnerActivityFitSequenceObservation;
  localDate: string;
  pace: RunnerActivityFitSequenceObservation;
  sameDayOrder: number;
  sequenceIndex: number;
  startedAt: string;
}): RunnerActivityFitSequenceProductPoint {
  return {
    id,
    sequenceIndex,
    sameDayOrder,
    label: "Run",
    historicalTime: {
      localDate,
      startedAt,
      timezone: "America/Sao_Paulo",
    },
    context: {
      state: "available",
      runningContext: context,
    },
    evidence: {
      state: "current",
      label: "From FIT file",
    },
    observations: {
      distance,
      timer_duration: duration,
      observed_average_pace: pace,
      elevation_gain: elevation,
      reported_load: load,
    },
  };
}

function emptyCoverage() {
  return {
    distance: coverage(0, 0),
    timer_duration: coverage(0, 0),
    observed_average_pace: coverage(0, 0),
    elevation_gain: coverage(0, 0),
    reported_load: coverage(0, 0),
  };
}

function singlePointCoverage() {
  return {
    distance: coverage(1, 1),
    timer_duration: coverage(1, 1),
    observed_average_pace: coverage(1, 1),
    elevation_gain: coverage(1, 1),
    reported_load: coverage(1, 1),
  };
}

function coverage(includedCount: number, eligibleActivityCount: number) {
  return {
    includedCount,
    eligibleActivityCount,
    missingCount: eligibleActivityCount - includedCount,
    label: `${includedCount} of ${eligibleActivityCount} activities included`,
  };
}
