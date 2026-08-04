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
  };
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
