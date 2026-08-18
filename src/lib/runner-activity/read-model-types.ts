export type RunnerActivityDurationBasis = "timer" | "elapsed";

export type RunnerActivityHistoryItem = {
  id: string;
  identity: {
    label: "Run";
    sport: "run";
    recordingKind: "recorded";
  };
  historicalTime: {
    localDate: string | null;
    startedAt: string | null;
    timezone: string | null;
    dateBasis: "historical_local" | "started_at_utc" | "recorded_at";
  };
  distanceKm: number | null;
  duration: {
    minutes: number;
    basis: RunnerActivityDurationBasis;
  } | null;
  pace: {
    secondsPerKm: number;
    basis: RunnerActivityDurationBasis;
    provenance: "derived_from_observed_distance_and_duration";
  } | null;
  observedHeartRate: {
    averageBpm: number;
    provenance: "observed_manual_garmin_fit";
  } | null;
  plannedWorkout: {
    id: string;
    title: string;
    workoutDate: string;
  } | null;
  source: {
    kind: "manual_garmin_fit";
    rawState: "available" | "removal_pending" | "removed";
    originalRetained: boolean;
    reprocessingAvailable: boolean;
  };
  quality: {
    state: "accepted";
    updating: boolean;
  };
  capabilities: {
    canRemoveOriginalFile: boolean;
    canDeleteActivity: true;
  };
  provenance: {
    activityRevisionId: string;
    normalizerVersion: string;
  };
};

export type RunnerActivityHistoryPage = {
  items: RunnerActivityHistoryItem[];
  nextCursor: string | null;
};

export type RunnerActivityFactAvailability = "available" | "unavailable";
export type RunnerActivityFactConfidence = "complete" | "partial" | "unavailable";

export type RunnerActivityFactMetric = {
  availability: RunnerActivityFactAvailability;
  confidence: RunnerActivityFactConfidence;
  value: number | null;
  unit: "sessions" | "minutes" | "kilometers" | "meters";
  includedActivityCount: number;
  missingActivityCount: number;
  missingReasons: string[];
  activityId: string | null;
  activityRevisionId: string | null;
};

export type RunnerActivityFactSnapshot = {
  id: string;
  status: "current";
  family: "calendar_week" | "rolling_28_day";
  window: {
    startDate: string;
    endDate: string;
    cutoffDate: string;
    timezoneBasis: "historical_local_date";
    weekStartsOn: "monday";
  };
  formulaVersion: string;
  creationCause:
    | "read_reconciliation"
    | "ingestion"
    | "backfill"
    | "source_removal"
    | "activity_delete"
    | "correction";
  createdAt: string;
  facts: {
    sessions: RunnerActivityFactMetric;
    runningTime: RunnerActivityFactMetric;
    distance: RunnerActivityFactMetric;
    elevationGain: RunnerActivityFactMetric;
    longestDistance: RunnerActivityFactMetric;
    longestDuration: RunnerActivityFactMetric;
  };
  evidence: {
    activityRevisionIds: string[];
    normalizerVersions: string[];
    eligibleActivityCount: number;
    excludedActivityCount: number;
    exclusions: Array<{ reason: string; count: number }>;
    missingFieldReasons: Array<{ field: string; reason: string; count: number }>;
  };
};

export type RunnerActivityProgressFactsReadModel = {
  status: "current";
  asOfDate: string;
  rolling28Day: {
    current: RunnerActivityFactSnapshot;
    previous: RunnerActivityFactSnapshot;
  };
  calendarWeeks: RunnerActivityFactSnapshot[];
  interpretation: {
    volumeIsFitness: false;
    derivedCoachingMetricsAvailable: false;
    unavailableReason: "later_gate_metric_contract_required";
  };
};

export type RunnerActivityAdvancedMetricAvailability = "available" | "unavailable";
export type RunnerActivityAdvancedMetricConfidence = "complete" | "partial" | "unavailable";

export type RunnerActivitySessionLoadMetric = {
  availability: RunnerActivityAdvancedMetricAvailability;
  confidence: RunnerActivityAdvancedMetricConfidence;
  value: number | null;
  displayValue: number | null;
  unit: "arbitrary_units";
  includedObservationCount: number;
  unavailableObservationCount: number;
  unavailableReasons: string[];
  observationIds: string[];
};

export type RunnerActivitySessionLoadWindow = {
  startDate: string;
  endDate: string;
  metric: RunnerActivitySessionLoadMetric;
};

export type RunnerActivityFitChartMetricId =
  | "sessions"
  | "running_time"
  | "distance"
  | "elevation"
  | "reported_load";

export type RunnerActivityFitChartPoint = {
  id: string;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  shortLabel: string;
  accessibleLabel: string;
  completion: "partial_start" | "complete" | "to_date";
  completionLabel: "Partial week" | "Complete week" | "To date";
  state: "available" | "partial" | "unavailable";
  value: number | null;
  displayValue: string | null;
  coverage: {
    includedCount: number;
    candidateCount: number;
    missingCount: number;
    label: string;
  };
  reasons: string[];
  reasonLabels: string[];
};

export type RunnerActivityFitChartSeries =
  | {
      id: RunnerActivityFitChartMetricId;
      title: string;
      purpose: string;
      status: "ready";
      unit: "sessions" | "minutes" | "kilometers" | "meters" | "arbitrary_units";
      unitLabel: "sessions" | "min" | "km" | "m" | "AU";
      display: {
        format: "integer" | "duration_minutes" | "decimal";
        maximumFractionDigits: number;
      };
      evidenceLabel: "From FIT file";
      formulaVersion: string;
      points: RunnerActivityFitChartPoint[];
    }
  | {
      id: RunnerActivityFitChartMetricId;
      title: string;
      purpose: string;
      status: "updating";
      unit: "sessions" | "minutes" | "kilometers" | "meters" | "arbitrary_units";
      unitLabel: "sessions" | "min" | "km" | "m" | "AU";
      display: {
        format: "integer" | "duration_minutes" | "decimal";
        maximumFractionDigits: number;
      };
      evidenceLabel: "From FIT file";
      formulaVersion: string;
      reason: "fit_evidence_updating";
      reasonLabel: "FIT evidence is updating.";
      staleValuesReturned: false;
      points: [];
    };

export type RunnerActivityFitChartPeriod = {
  id: "28_days";
  label: "28 days";
  startDate: string;
  endDate: string;
  state: "to_date";
  bucketResolution: "calendar_week";
  timezoneBasis: "historical_local_date";
  weekStartsOn: "monday";
  series: RunnerActivityFitChartSeries[];
};

export type RunnerActivityFitSequenceQuickPeriodId =
  | "this_week"
  | "last_7_days"
  | "last_1_month"
  | "last_6_months";

export type RunnerActivityFitSequencePeriodRequest =
  | { kind: RunnerActivityFitSequenceQuickPeriodId }
  | { kind: "custom"; startDate: string; endDate: string };

export type RunnerActivityFitSequencePeriod = {
  id: RunnerActivityFitSequenceQuickPeriodId | "custom";
  label: "This week" | "Last 7 days" | "Last 1 month" | "Last 6 months" | "Custom";
  startDate: string;
  endDate: string;
  asOfDate: string;
  timezoneBasis: {
    period: "runner_calendar_timezone";
    activities: "historical_local_date";
    timeZone: string;
  };
  futureInterval: { startDate: string; endDate: string } | null;
};

export type RunnerActivityFitSequenceMetricId =
  | "distance"
  | "timer_duration"
  | "observed_average_pace"
  | "elevation_gain"
  | "reported_load";

export type RunnerActivityFitSequenceObservation = {
  id: RunnerActivityFitSequenceMetricId;
  label: string;
  state: "available" | "partial" | "unavailable";
  value: number | null;
  displayValue: string | null;
  unit: "kilometers" | "minutes" | "seconds_per_kilometer" | "meters" | "arbitrary_units";
  unitLabel: "km" | "min" | "/km" | "m" | "AU";
  reason: string | null;
  reasonLabel: string | null;
  coverage: {
    includedCount: 0 | 1;
    candidateCount: 1;
    missingCount: 0 | 1;
  };
  basis: {
    duration: "timer" | "elapsed" | null;
    distance: "whole_activity" | null;
    effort: "session_rpe" | null;
  };
};

export type RunnerActivityFitSequencePoint = {
  id: string;
  sequenceIndex: number;
  sameDayOrder: number;
  label: "Run";
  historicalTime: {
    localDate: string;
    startedAt: string | null;
    timezone: string | null;
  };
  context: {
    state: "available" | "unknown";
    runningContext: string | null;
  };
  evidence: {
    state: "current";
    label: "From FIT file";
    activityRevisionId: string;
    sourceRevisionId: string;
  };
  observations: Record<RunnerActivityFitSequenceMetricId, RunnerActivityFitSequenceObservation>;
};

export type RunnerActivityFitSequenceCoverage = Record<
  RunnerActivityFitSequenceMetricId,
  {
    includedCount: number;
    eligibleActivityCount: number;
    missingCount: number;
    label: string;
  }
>;

type RunnerActivityFitSequenceReadModelBase = {
  formulaVersion: string;
  evidenceLabel: "From FIT file";
  advertisedPeriods: [
    RunnerActivityFitSequencePeriod,
    RunnerActivityFitSequencePeriod,
    RunnerActivityFitSequencePeriod,
    RunnerActivityFitSequencePeriod,
  ];
  selectedPeriod: RunnerActivityFitSequencePeriod;
};

export type RunnerActivityFitSequenceReadModel = RunnerActivityFitSequenceReadModelBase &
  (
    | {
        status: "ready" | "empty";
        completeness: {
          state: "complete";
          eligibleActivityCount: number;
          returnedPointCount: number;
        };
        coverage: RunnerActivityFitSequenceCoverage;
        points: RunnerActivityFitSequencePoint[];
      }
    | {
        status: "updating";
        reason: "fit_evidence_updating" | "metric_recalculation_pending";
        reasonLabel: string;
        staleValuesReturned: false;
        points: [];
      }
    | {
        status: "unavailable";
        reason: "accepted_fit_activity_missing_historical_local_date" | "sequence_incomplete";
        reasonLabel: string;
        staleValuesReturned: false;
        points: [];
      }
  );

export type RunnerActivityFitPersonalBestSlotId =
  | "1_km"
  | "5_km"
  | "10_km"
  | "half_marathon"
  | "marathon";

export type RunnerActivityFitPersonalBestSlot = {
  id: RunnerActivityFitPersonalBestSlotId;
  label: "1 km" | "5 km" | "10 km" | "Half Marathon · 21.0975 km" | "Marathon · 42.195 km";
  distanceMeters: number;
} & (
  | {
      state: "available";
      reason: null;
      reasonLabel: null;
      result: {
        elapsedSeconds: number;
        displayValue: string;
        eventDate: string | null;
        evidenceLabel: "From FIT file";
        source: {
          activityId: string;
          activityRevisionId: string;
        };
      };
    }
  | {
      state: "no_verified_time";
      reason: "no_verified_fit_time";
      reasonLabel: "No verified FIT time yet.";
      result: null;
    }
  | {
      state: "unavailable";
      reason: string;
      reasonLabel: string;
      result: null;
    }
  | {
      state: "updating";
      reason: "fit_evidence_updating";
      reasonLabel: "FIT evidence is updating.";
      result: null;
    }
);

export type RunnerActivityFitProgressReadModel =
  | {
      status: "current";
      evidenceLabel: "From FIT file";
      chart: {
        advertisedPeriods: [RunnerActivityFitChartPeriod];
      };
      personalBests: {
        formulaVersion: string;
        matchingRule: "exact_whole_activity_distance_within_0_05_meters";
        slots: RunnerActivityFitPersonalBestSlot[];
      };
    }
  | {
      status: "unavailable";
      reason: "historical_formula_version_without_fit_progress";
    };

export type RunnerActivityRecordItem = {
  observationId: string;
  activityId: string;
  activityRevisionId: string;
  sourceRevisionId: string;
  evidenceRevisionId: string | null;
  recordClass: "hito_observed_whole_activity" | "runner_confirmed_official_result";
  distanceKey: string;
  distanceMeters: number;
  elapsedSeconds: number;
  eventDate: string | null;
  confidence: "complete" | "partial";
  provenance: "canonical_activity_summary" | "runner_confirmed";
  context: string | null;
  formulaVersion: string;
};

export type RunnerActivityGate5UnavailableMetric = {
  status: "unavailable";
  reason: "normalized_stream_not_persisted";
  formulaVersion: string;
};

export type RunnerActivityAdvancedMetricsCurrent = {
  status: "current";
  snapshotId: string;
  historical: boolean;
  asOfDate: string;
  formulaSetVersion: string;
  formulaVersions: {
    personalBest: string;
    sessionRpeLoad: string;
    fitProgress?: string;
  };
  fitProgress: RunnerActivityFitProgressReadModel;
  sessionRpeLoad: {
    rolling28Day: {
      current: RunnerActivitySessionLoadWindow;
      previous: RunnerActivitySessionLoadWindow;
    };
    calendarWeeks: RunnerActivitySessionLoadWindow[];
  };
  records: {
    availability: RunnerActivityAdvancedMetricAvailability;
    items: RunnerActivityRecordItem[];
    unavailableReason: string | null;
    unavailableReasons: string[];
    calculatedWithinActivity: {
      status: "unavailable";
      reason: "normalized_stream_not_persisted";
    };
    providerAttributed: {
      status: "unavailable";
      reason: "unsupported_record_class";
    };
  };
  streamDependentMetrics: {
    aerobicEfficiency: RunnerActivityGate5UnavailableMetric;
    paceAtComparableHeartRate: RunnerActivityGate5UnavailableMetric;
    heartRateAtComparablePace: RunnerActivityGate5UnavailableMetric;
    durability: RunnerActivityGate5UnavailableMetric;
    controlledAerobicDuration: RunnerActivityGate5UnavailableMetric;
  };
  evidence: {
    activityRevisionIds: string[];
    evidenceRevisionIds: string[];
    observationIds: string[];
  };
};

export type RunnerActivityAdvancedMetricsReadModel =
  | RunnerActivityAdvancedMetricsCurrent
  | {
      status: "updating";
      asOfDate: string;
      reason: "metric_recalculation_pending";
      staleValuesReturned: false;
    };

export type RunnerActivityProgressReadModel = RunnerActivityProgressFactsReadModel & {
  fitActivitySequence: RunnerActivityFitSequenceReadModel;
  advancedMetrics: RunnerActivityAdvancedMetricsReadModel;
};

export type RunnerActivityMutationReadback =
  | {
      activityId: string;
      status: "current";
      history: RunnerActivityHistoryPage;
      progress: RunnerActivityProgressReadModel;
    }
  | {
      activityId: string;
      status: "updating";
      history: null;
      progress: null;
      reason: "read_model_recalculation_pending";
    };
