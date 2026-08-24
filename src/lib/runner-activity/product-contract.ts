import type {
  RunnerActivityAdvancedMetricsReadModel,
  RunnerActivityFactMetric,
  RunnerActivityFactSnapshot,
  RunnerActivityFitSequenceReadModel,
  RunnerActivityHistoryItem,
  RunnerActivityHistoryPage,
  RunnerActivityMutationReadback,
  RunnerActivityProgressReadModel,
  RunnerActivityRecordItem,
  RunnerActivitySessionLoadMetric,
  RunnerActivitySessionLoadWindow,
} from "@/lib/runner-activity/read-model-types";
import type {
  RunnerFitnessLevel,
  RunnerTrainingPreferencesStorage,
} from "@/lib/runner-training-preferences";

export type RunnerActivityHistoryProductItem = {
  id: string;
  identity: {
    label: "Run";
  };
  historicalTime: {
    localDate: string | null;
    startedAt: string | null;
    timezone: string | null;
  };
  distanceKm: number | null;
  duration: {
    minutes: number;
    basis: "timer" | "elapsed";
  } | null;
  pace: {
    secondsPerKm: number;
    basis: "timer" | "elapsed";
  } | null;
  observedHeartRate: {
    averageBpm: number;
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
    updating: boolean;
  };
  capabilities: {
    canRemoveOriginalFile: boolean;
  };
};

export type RunnerActivityHistoryProductPage = {
  items: RunnerActivityHistoryProductItem[];
  nextCursor: string | null;
};

export type RunnerActivityProgressProductFactMetric = {
  availability: "available" | "unavailable";
  confidence: "complete" | "partial" | "unavailable";
  value: number | null;
  unit: "sessions" | "minutes" | "kilometers" | "meters";
  includedActivityCount: number;
  missingActivityCount: number;
  missingReasons: string[];
};

export type RunnerActivityProgressProductSnapshot = {
  window: {
    startDate: string;
    endDate: string;
    cutoffDate: string;
    timezoneBasis: "historical_local_date";
    weekStartsOn: "monday";
  };
  formulaVersion: string;
  eligibleActivityCount: number;
  facts: {
    sessions: RunnerActivityProgressProductFactMetric;
    runningTime: RunnerActivityProgressProductFactMetric;
    distance: RunnerActivityProgressProductFactMetric;
    elevationGain: RunnerActivityProgressProductFactMetric;
    longestDistance: RunnerActivityProgressProductFactMetric;
    longestDuration: RunnerActivityProgressProductFactMetric;
  };
};

export type RunnerActivityProgressProductSessionLoadMetric = {
  availability: "available" | "unavailable";
  confidence: "complete" | "partial" | "unavailable";
  value: number | null;
  displayValue: number | null;
  unit: "arbitrary_units";
  includedObservationCount: number;
  unavailableObservationCount: number;
  unavailableReasons: string[];
};

export type RunnerActivityProgressProductSessionLoadWindow = {
  startDate: string;
  endDate: string;
  metric: RunnerActivityProgressProductSessionLoadMetric;
};

export type RunnerActivityProgressProductRecord = {
  id: string;
  recordClass: "hito_observed_whole_activity" | "runner_confirmed_official_result";
  distanceKey: string;
  distanceMeters: number;
  elapsedSeconds: number;
  eventDate: string | null;
  confidence: "complete" | "partial";
  provenance: "canonical_activity_summary" | "runner_confirmed";
  context: string | null;
};

export type RunnerActivityProgressProductAdvancedMetrics =
  | {
      status: "updating";
      asOfDate: string;
      reason: "metric_recalculation_pending";
      staleValuesReturned: false;
    }
  | {
      status: "current";
      historical: boolean;
      asOfDate: string;
      sessionRpeLoad: {
        formulaVersion: string;
        rolling28Day: {
          current: RunnerActivityProgressProductSessionLoadWindow;
          previous: RunnerActivityProgressProductSessionLoadWindow;
        };
        calendarWeeks: RunnerActivityProgressProductSessionLoadWindow[];
      };
      records: {
        availability: "available" | "unavailable";
        items: RunnerActivityProgressProductRecord[];
        unavailableReasons: string[];
      };
      detailedMetrics: {
        status: "unavailable";
        reason: "normalized_stream_not_persisted";
      };
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

type RunnerActivityFitChartSeriesCore = {
  id: RunnerActivityFitChartMetricId;
  title: string;
  purpose: string;
  unit: "sessions" | "minutes" | "kilometers" | "meters" | "arbitrary_units";
  unitLabel: "sessions" | "min" | "km" | "m" | "AU";
  display: {
    format: "integer" | "duration_minutes" | "decimal";
    maximumFractionDigits: number;
  };
  evidenceLabel: "From FIT file";
  formulaVersion: string;
};

export type RunnerActivityFitChartSeries = RunnerActivityFitChartSeriesCore &
  (
    | {
        status: "ready";
        points: RunnerActivityFitChartPoint[];
      }
    | {
        status: "updating";
        reason: "fit_evidence_updating";
        reasonLabel: "FIT evidence is updating.";
        staleValuesReturned: false;
        points: [];
      }
  );

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

export type RunnerActivityFitPersonalBestProductSlot = {
  id: "1_km" | "5_km" | "10_km" | "half_marathon" | "marathon";
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

export type RunnerActivityFitProgressProductModel =
  | {
      status: "current";
      evidenceLabel: "From FIT file";
      chart: {
        advertisedPeriods: [RunnerActivityFitChartPeriod];
      };
      personalBests: {
        formulaVersion: string;
        matchingRule: "exact_whole_activity_distance_within_0_05_meters";
        slots: RunnerActivityFitPersonalBestProductSlot[];
      };
    }
  | {
      status: "unavailable";
      reason: "historical_formula_version_without_fit_progress";
    }
  | {
      status: "updating";
      reason: "metric_recalculation_pending";
      staleValuesReturned: false;
    };

export type RunnerActivityFitSequenceQuickPeriodId =
  | "this_week"
  | "last_7_days"
  | "last_1_month"
  | "last_6_months";

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

export type RunnerActivityFitSequenceProductPoint = {
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
  };
  observations: Record<RunnerActivityFitSequenceMetricId, RunnerActivityFitSequenceObservation>;
};

type RunnerActivityFitSequenceProductModelBase = {
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

export type RunnerActivityFitSequenceProductModel = RunnerActivityFitSequenceProductModelBase &
  (
    | {
        status: "ready" | "empty";
        completeness: {
          state: "complete";
          eligibleActivityCount: number;
          returnedPointCount: number;
        };
        coverage: Record<
          RunnerActivityFitSequenceMetricId,
          {
            includedCount: number;
            eligibleActivityCount: number;
            missingCount: number;
            label: string;
          }
        >;
        points: RunnerActivityFitSequenceProductPoint[];
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

export type RunnerActivityProgressProductModel = {
  status: "current";
  asOfDate: string;
  rolling28Day: {
    current: RunnerActivityProgressProductSnapshot;
    previous: RunnerActivityProgressProductSnapshot;
  };
  calendarWeeks: RunnerActivityProgressProductSnapshot[];
  fitProgress: RunnerActivityFitProgressProductModel;
  fitActivitySequence: RunnerActivityFitSequenceProductModel;
  advancedMetrics: RunnerActivityProgressProductAdvancedMetrics;
};

export const RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION =
  "runner_fitness_profile_snapshot_v1" as const;
export const RUNNER_FITNESS_PROFILE_FORMULA_VERSION = "runner_fitness_profile_formula_v1" as const;
export const RUNNER_FITNESS_PROFILE_HISTORY_FORMULA_VERSION =
  "runner_fitness_profile_history_v1" as const;

export const RUNNER_FITNESS_PROFILE_COMPONENT_STATES = [
  "available",
  "partial",
  "unavailable",
  "updating",
  "not_applicable",
  "contradictory",
] as const;

export type RunnerFitnessProfileComponentStateV1 =
  (typeof RUNNER_FITNESS_PROFILE_COMPONENT_STATES)[number];

export type RunnerFitnessProfileComponentV1<T> = {
  state: RunnerFitnessProfileComponentStateV1;
  data: T | null;
  coverage: {
    includedCount: number;
    candidateCount: number;
    missingCount: number;
    coveredDates: string[];
  };
  reasonCodes: string[];
};

export type RunnerFitnessProfileConstraintsV1 = {
  fitnessLevel: RunnerFitnessLevel | null;
  trainingPreferences: RunnerTrainingPreferencesStorage | null;
  currentGoal: null;
  preferredUnits: null;
  limitationState: null;
  runnerEnteredFacts: {
    source: "runner_profile";
    revision: number | null;
    lastConfirmedAt: null;
  };
};

export type RunnerFitnessProfileRecent28DayV1 = {
  current: RunnerActivityProgressProductSnapshot;
  previous: RunnerActivityProgressProductSnapshot;
  calendarOutcomes: Array<{
    calendarWorkoutId: string;
    workoutDate: string;
    workoutType: string;
    outcome: "completed" | "partial" | "skipped" | "unresolved";
    sessionRpe: number | null;
    outcomeRevision: string;
  }>;
  evidence: {
    dueWorkoutCount: number;
    resolvedOutcomeCount: number;
    acceptedActualCount: number;
    completionOnlyCount: number;
    missingCount: number;
    updatingCount: number;
    removedCount: number;
    workouts: Array<{
      calendarWorkoutId: string;
      workoutDate: string;
      actualEvidenceState: RunnerFitnessProfileActualEvidenceStateV1;
      acceptedActualMetricsAvailable: boolean;
      missingReasons: string[];
    }>;
  };
  sessionRpeLoad: RunnerActivityProgressProductSessionLoadWindow | null;
};

export type RunnerFitnessProfileActualEvidenceStateV1 =
  | "accepted_actual"
  | "completion_only"
  | "missing"
  | "updating"
  | "removed";

export type RunnerFitnessProfileLatestActivityV1 = {
  activityId: string;
  localDate: string;
  workoutContext: string | null;
  actualEvidenceState: RunnerFitnessProfileActualEvidenceStateV1;
  durationMin: number | null;
  distanceKm: number | null;
  paceSecondsPerKm: number | null;
  averageHeartRate: number | null;
  elevationGainMetres: number | null;
  sessionRpe: number | null;
};

export type RunnerFitnessProfileRollingWeekV1 = {
  startDate: string;
  endDate: string;
  sessionCount: number;
  runningTimeMin: number | null;
  distanceKm: number | null;
  missingDurationCount: number;
  missingDistanceCount: number;
};

export type RunnerFitnessProfileRolling90DayV1 = {
  window: {
    startDate: string;
    endDate: string;
    cutoffDate: string;
    timezoneBasis: "historical_local_date";
    weekStartsOn: "monday";
  };
  acceptedActivityCount: number;
  weeklyDistribution: RunnerFitnessProfileRollingWeekV1[];
  longestDuration: {
    localDate: string;
    minutes: number;
  } | null;
  longestDistance: {
    localDate: string;
    kilometers: number;
  } | null;
  sessionRpeLoad: {
    formulaVersion: string;
    current: RunnerActivityProgressProductSessionLoadWindow;
    previous: RunnerActivityProgressProductSessionLoadWindow;
  } | null;
  records: RunnerActivityProgressProductRecord[];
};

export type RunnerFitnessProfileComparableGroupV1 = {
  contextKey: string;
  acceptedActualDays: string[];
  compatibleRpeDays: string[];
};

export type RunnerFitnessProfileSnapshotV1 = {
  version: typeof RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION;
  snapshotId: string;
  runnerId: string;
  asOf: string;
  cutoffDate: string;
  timeZone: string;
  runnerFactsRevision: string;
  formulaVersions: {
    profile: typeof RUNNER_FITNESS_PROFILE_FORMULA_VERSION;
    runnerActivity: string[];
    sessionRpeLoad: string | null;
  };
  provenance: {
    identityProfile: {
      revision: number | null;
      fingerprint: string;
    };
    calendarOutcomes: {
      fingerprint: string;
    };
    resultEvidence: {
      fingerprint: string;
    };
    runnerActivity: {
      fingerprint: string;
    };
  };
  components: {
    constraints: RunnerFitnessProfileComponentV1<RunnerFitnessProfileConstraintsV1>;
    recent28Day: RunnerFitnessProfileComponentV1<RunnerFitnessProfileRecent28DayV1>;
    latestFive: RunnerFitnessProfileComponentV1<{
      inspectionOnly: true;
      items: RunnerFitnessProfileLatestActivityV1[];
    }>;
    rolling90Day: RunnerFitnessProfileComponentV1<RunnerFitnessProfileRolling90DayV1>;
    comparablePerformance: RunnerFitnessProfileComponentV1<null>;
  };
};

export type RunnerFitnessProfileProgressProjectionV1 = {
  version: "runner_fitness_profile_progress_projection_v1";
  snapshotDefinitionVersion: typeof RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION;
  formulaVersions: RunnerFitnessProfileSnapshotV1["formulaVersions"];
  snapshotId: string;
  runnerFactsRevision: string;
  cutoffDate: string;
  componentStates: Record<
    keyof RunnerFitnessProfileSnapshotV1["components"],
    RunnerFitnessProfileComponentStateV1
  >;
  recent28Day: RunnerFitnessProfileRecent28DayV1 | null;
  latestFive: RunnerFitnessProfileLatestActivityV1[];
  rolling90Day: RunnerFitnessProfileRolling90DayV1 | null;
  comparablePerformance: null;
};

export type RunnerFitnessProfileContinuationProjectionV1 = {
  version: "runner_fitness_profile_continuation_projection_v1";
  snapshotDefinitionVersion: typeof RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION;
  formulaVersions: RunnerFitnessProfileSnapshotV1["formulaVersions"];
  snapshotId: string;
  runnerFactsRevision: string;
  cutoffDate: string;
  profileConstraintsFingerprint: string;
  calendarOutcomeFingerprint: string;
  evidenceRevisionFingerprint: string;
  quality: RunnerFitnessProfileComponentStateV1;
  constraints: RunnerFitnessProfileConstraintsV1 | null;
  comparableGroups: RunnerFitnessProfileComparableGroupV1[];
  missingReasons: string[];
};

export type RunnerFitnessProfileOneOffProjectionV1 = {
  version: "runner_fitness_profile_one_off_projection_v1";
  snapshotDefinitionVersion: typeof RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION;
  formulaVersions: RunnerFitnessProfileSnapshotV1["formulaVersions"];
  snapshotId: string;
  runnerFactsRevision: string;
  cutoffDate: string;
  constraints: RunnerFitnessProfileConstraintsV1 | null;
  current28DayDurationCoverage: {
    includedCount: number;
    missingCount: number;
  };
  rolling90DayLongestDuration: {
    localDate: string;
    minutes: number;
  } | null;
  componentStates: {
    constraints: RunnerFitnessProfileComponentStateV1;
    recent28Day: RunnerFitnessProfileComponentStateV1;
    rolling90Day: RunnerFitnessProfileComponentStateV1;
  };
};

export const RUNNER_FITNESS_PROFILE_INITIAL_PLAN_PROJECTION_VERSION =
  "runner_fitness_profile_initial_plan_projection_v1" as const;

type RunnerFitnessProfileInitialPlanComponentFactsV1 = {
  state: RunnerFitnessProfileComponentStateV1;
  coverage: RunnerFitnessProfileComponentV1<unknown>["coverage"];
  reasonCodes: string[];
};

export type RunnerFitnessProfileInitialPlanProjectionV1 = {
  version: typeof RUNNER_FITNESS_PROFILE_INITIAL_PLAN_PROJECTION_VERSION;
  snapshotDefinitionVersion: typeof RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION;
  snapshotId: string;
  runnerFactsRevision: string;
  asOf: string;
  cutoffDate: string;
  timeZone: string;
  formulaVersions: RunnerFitnessProfileSnapshotV1["formulaVersions"];
  components: {
    constraints: RunnerFitnessProfileInitialPlanComponentFactsV1 & {
      fitnessLevel: RunnerFitnessLevel | null;
      trainingPreferences: RunnerTrainingPreferencesStorage | null;
      source: {
        revision: number | null;
        fingerprint: string;
      };
    };
    recent28Day: RunnerFitnessProfileInitialPlanComponentFactsV1 & {
      current: RunnerActivityProgressProductSnapshot | null;
      previous: RunnerActivityProgressProductSnapshot | null;
      calendarOutcomes: {
        candidateCount: number;
        completedCount: number;
        partialCount: number;
        skippedCount: number;
        unresolvedCount: number;
        sessionRpeCoverage: {
          includedCount: number;
          missingCount: number;
        };
      };
      evidence: {
        dueWorkoutCount: number;
        resolvedOutcomeCount: number;
        acceptedActualCount: number;
        completionOnlyCount: number;
        missingCount: number;
        updatingCount: number;
        removedCount: number;
      };
    };
    latestFive: RunnerFitnessProfileInitialPlanComponentFactsV1 & {
      inspectionOnly: true;
      coveredDates: string[];
    };
    rolling90Day: RunnerFitnessProfileInitialPlanComponentFactsV1 & {
      acceptedActivityCount: number;
      weeklyDistribution: RunnerFitnessProfileRollingWeekV1[];
      longestDuration: RunnerFitnessProfileRolling90DayV1["longestDuration"];
      longestDistance: RunnerFitnessProfileRolling90DayV1["longestDistance"];
      sessionRpeLoad: RunnerFitnessProfileRolling90DayV1["sessionRpeLoad"];
    };
    comparablePerformance: RunnerFitnessProfileInitialPlanComponentFactsV1;
  };
};

export function projectRunnerFitnessProfileForInitialPlan(
  snapshot: RunnerFitnessProfileSnapshotV1,
): RunnerFitnessProfileInitialPlanProjectionV1 {
  const constraints = snapshot.components.constraints;
  const recent = snapshot.components.recent28Day;
  const recentData = recent.data;
  const latest = snapshot.components.latestFive;
  const rolling = snapshot.components.rolling90Day;
  const rollingData = rolling.data;
  const outcomes = recentData?.calendarOutcomes ?? [];

  return {
    version: RUNNER_FITNESS_PROFILE_INITIAL_PLAN_PROJECTION_VERSION,
    snapshotDefinitionVersion: snapshot.version,
    snapshotId: snapshot.snapshotId,
    runnerFactsRevision: snapshot.runnerFactsRevision,
    asOf: snapshot.asOf,
    cutoffDate: snapshot.cutoffDate,
    timeZone: snapshot.timeZone,
    formulaVersions: snapshot.formulaVersions,
    components: {
      constraints: {
        ...projectInitialPlanComponentFacts(constraints),
        fitnessLevel: constraints.data?.fitnessLevel ?? null,
        trainingPreferences: constraints.data?.trainingPreferences ?? null,
        source: {
          revision: snapshot.provenance.identityProfile.revision,
          fingerprint: snapshot.provenance.identityProfile.fingerprint,
        },
      },
      recent28Day: {
        ...projectInitialPlanComponentFacts(recent),
        current: recentData?.current ?? null,
        previous: recentData?.previous ?? null,
        calendarOutcomes: {
          candidateCount: outcomes.length,
          completedCount: outcomes.filter((outcome) => outcome.outcome === "completed").length,
          partialCount: outcomes.filter((outcome) => outcome.outcome === "partial").length,
          skippedCount: outcomes.filter((outcome) => outcome.outcome === "skipped").length,
          unresolvedCount: outcomes.filter((outcome) => outcome.outcome === "unresolved").length,
          sessionRpeCoverage: {
            includedCount: outcomes.filter((outcome) => outcome.sessionRpe != null).length,
            missingCount: outcomes.filter((outcome) => outcome.sessionRpe == null).length,
          },
        },
        evidence: {
          dueWorkoutCount: recentData?.evidence.dueWorkoutCount ?? 0,
          resolvedOutcomeCount: recentData?.evidence.resolvedOutcomeCount ?? 0,
          acceptedActualCount: recentData?.evidence.acceptedActualCount ?? 0,
          completionOnlyCount: recentData?.evidence.completionOnlyCount ?? 0,
          missingCount: recentData?.evidence.missingCount ?? 0,
          updatingCount: recentData?.evidence.updatingCount ?? 0,
          removedCount: recentData?.evidence.removedCount ?? 0,
        },
      },
      latestFive: {
        ...projectInitialPlanComponentFacts(latest),
        inspectionOnly: true,
        coveredDates: [...(latest.data?.items.map((item) => item.localDate) ?? [])].sort(),
      },
      rolling90Day: {
        ...projectInitialPlanComponentFacts(rolling),
        acceptedActivityCount: rollingData?.acceptedActivityCount ?? 0,
        weeklyDistribution: rollingData?.weeklyDistribution ?? [],
        longestDuration: rollingData?.longestDuration ?? null,
        longestDistance: rollingData?.longestDistance ?? null,
        sessionRpeLoad: rollingData?.sessionRpeLoad ?? null,
      },
      comparablePerformance: projectInitialPlanComponentFacts(
        snapshot.components.comparablePerformance,
      ),
    },
  };
}

function projectInitialPlanComponentFacts(
  component: RunnerFitnessProfileComponentV1<unknown>,
): RunnerFitnessProfileInitialPlanComponentFactsV1 {
  return {
    state: component.state,
    coverage: {
      ...component.coverage,
      coveredDates: [...component.coverage.coveredDates].sort(),
    },
    reasonCodes: [...component.reasonCodes].sort(),
  };
}

export function projectRunnerFitnessProfileForProgress(
  snapshot: RunnerFitnessProfileSnapshotV1,
): RunnerFitnessProfileProgressProjectionV1 {
  return {
    version: "runner_fitness_profile_progress_projection_v1",
    snapshotDefinitionVersion: snapshot.version,
    formulaVersions: snapshot.formulaVersions,
    snapshotId: snapshot.snapshotId,
    runnerFactsRevision: snapshot.runnerFactsRevision,
    cutoffDate: snapshot.cutoffDate,
    componentStates: Object.fromEntries(
      Object.entries(snapshot.components).map(([key, component]) => [key, component.state]),
    ) as RunnerFitnessProfileProgressProjectionV1["componentStates"],
    recent28Day: snapshot.components.recent28Day.data,
    latestFive: snapshot.components.latestFive.data?.items ?? [],
    rolling90Day: snapshot.components.rolling90Day.data,
    comparablePerformance: null,
  };
}

export function projectRunnerFitnessProfileForContinuation(
  snapshot: RunnerFitnessProfileSnapshotV1,
): RunnerFitnessProfileContinuationProjectionV1 {
  const recent = snapshot.components.recent28Day;
  const evidenceByWorkoutId = new Map(
    (recent.data?.evidence.workouts ?? []).map((workout) => [workout.calendarWorkoutId, workout]),
  );
  const groups = new Map<string, { accepted: Set<string>; rpe: Set<string> }>();
  for (const workout of recent.data?.calendarOutcomes ?? []) {
    const evidence = evidenceByWorkoutId.get(workout.calendarWorkoutId);
    if (
      evidence?.actualEvidenceState !== "accepted_actual" ||
      (workout.outcome !== "completed" && workout.outcome !== "partial")
    ) {
      continue;
    }
    const group = groups.get(workout.workoutType) ?? {
      accepted: new Set<string>(),
      rpe: new Set<string>(),
    };
    group.accepted.add(workout.workoutDate);
    if (workout.sessionRpe != null) group.rpe.add(workout.workoutDate);
    groups.set(workout.workoutType, group);
  }
  const missingReasons = new Set(snapshot.components.recent28Day.reasonCodes);
  if (evidenceByWorkoutId.size === 0) missingReasons.add("calendar_outcomes_missing");
  return {
    version: "runner_fitness_profile_continuation_projection_v1",
    snapshotDefinitionVersion: snapshot.version,
    formulaVersions: snapshot.formulaVersions,
    snapshotId: snapshot.snapshotId,
    runnerFactsRevision: snapshot.runnerFactsRevision,
    cutoffDate: snapshot.cutoffDate,
    profileConstraintsFingerprint: snapshot.provenance.identityProfile.fingerprint,
    calendarOutcomeFingerprint: snapshot.provenance.calendarOutcomes.fingerprint,
    evidenceRevisionFingerprint: snapshot.provenance.resultEvidence.fingerprint,
    quality: recent.state,
    constraints: snapshot.components.constraints.data,
    comparableGroups: Array.from(groups.entries())
      .map(([contextKey, value]) => ({
        contextKey,
        acceptedActualDays: Array.from(value.accepted).sort(),
        compatibleRpeDays: Array.from(value.rpe).sort(),
      }))
      .sort((left, right) => left.contextKey.localeCompare(right.contextKey)),
    missingReasons: Array.from(missingReasons).sort(),
  };
}

export function projectRunnerFitnessProfileForOneOff(
  snapshot: RunnerFitnessProfileSnapshotV1,
): RunnerFitnessProfileOneOffProjectionV1 {
  const recent = snapshot.components.recent28Day;
  const duration = recent.data?.current.facts.runningTime;
  return {
    version: "runner_fitness_profile_one_off_projection_v1",
    snapshotDefinitionVersion: snapshot.version,
    formulaVersions: snapshot.formulaVersions,
    snapshotId: snapshot.snapshotId,
    runnerFactsRevision: snapshot.runnerFactsRevision,
    cutoffDate: snapshot.cutoffDate,
    constraints: snapshot.components.constraints.data,
    current28DayDurationCoverage: {
      includedCount: duration?.includedActivityCount ?? 0,
      missingCount: duration?.missingActivityCount ?? 0,
    },
    rolling90DayLongestDuration: snapshot.components.rolling90Day.data?.longestDuration ?? null,
    componentStates: {
      constraints: snapshot.components.constraints.state,
      recent28Day: snapshot.components.recent28Day.state,
      rolling90Day: snapshot.components.rolling90Day.state,
    },
  };
}

export type RunnerActivityMutationProductReadback =
  | {
      activityId: string;
      status: "current";
      history: RunnerActivityHistoryProductPage;
      progress: RunnerActivityProgressProductModel;
    }
  | {
      activityId: string;
      status: "updating";
      history: null;
      progress: null;
      reason: "read_model_recalculation_pending";
    };

export function projectRunnerActivityProgressForProduct(
  progress: RunnerActivityProgressReadModel,
): RunnerActivityProgressProductModel {
  return {
    status: progress.status,
    asOfDate: progress.asOfDate,
    rolling28Day: {
      current: projectFactSnapshot(progress.rolling28Day.current),
      previous: projectFactSnapshot(progress.rolling28Day.previous),
    },
    calendarWeeks: progress.calendarWeeks.map(projectFactSnapshot),
    fitProgress: projectFitProgress(progress.advancedMetrics),
    fitActivitySequence: projectFitActivitySequence(progress.fitActivitySequence),
    advancedMetrics: projectAdvancedMetrics(progress.advancedMetrics),
  };
}

export function projectRunnerActivityHistoryForProduct(
  history: RunnerActivityHistoryPage,
): RunnerActivityHistoryProductPage {
  return {
    items: history.items.map(projectHistoryItem),
    nextCursor: history.nextCursor,
  };
}

export function projectRunnerActivityMutationReadbackForProduct(
  readback: RunnerActivityMutationReadback,
): RunnerActivityMutationProductReadback {
  if (readback.status === "updating") {
    return {
      activityId: readback.activityId,
      status: readback.status,
      history: readback.history,
      progress: readback.progress,
      reason: readback.reason,
    };
  }

  return {
    activityId: readback.activityId,
    status: readback.status,
    history: projectRunnerActivityHistoryForProduct(readback.history),
    progress: projectRunnerActivityProgressForProduct(readback.progress),
  };
}

function projectHistoryItem(item: RunnerActivityHistoryItem): RunnerActivityHistoryProductItem {
  return {
    id: item.id,
    identity: {
      label: item.identity.label,
    },
    historicalTime: {
      localDate: item.historicalTime.localDate,
      startedAt: item.historicalTime.startedAt,
      timezone: item.historicalTime.timezone,
    },
    distanceKm: item.distanceKm,
    duration: item.duration
      ? {
          minutes: item.duration.minutes,
          basis: item.duration.basis,
        }
      : null,
    pace: item.pace
      ? {
          secondsPerKm: item.pace.secondsPerKm,
          basis: item.pace.basis,
        }
      : null,
    observedHeartRate: item.observedHeartRate
      ? {
          averageBpm: item.observedHeartRate.averageBpm,
        }
      : null,
    plannedWorkout: item.plannedWorkout
      ? {
          id: item.plannedWorkout.id,
          title: item.plannedWorkout.title,
          workoutDate: item.plannedWorkout.workoutDate,
        }
      : null,
    source: {
      kind: item.source.kind,
      rawState: item.source.rawState,
      originalRetained: item.source.originalRetained,
      reprocessingAvailable: item.source.reprocessingAvailable,
    },
    quality: {
      updating: item.quality.updating,
    },
    capabilities: {
      canRemoveOriginalFile: item.capabilities.canRemoveOriginalFile,
    },
  };
}

function projectFactSnapshot(
  snapshot: RunnerActivityFactSnapshot,
): RunnerActivityProgressProductSnapshot {
  return {
    window: {
      startDate: snapshot.window.startDate,
      endDate: snapshot.window.endDate,
      cutoffDate: snapshot.window.cutoffDate,
      timezoneBasis: snapshot.window.timezoneBasis,
      weekStartsOn: snapshot.window.weekStartsOn,
    },
    formulaVersion: snapshot.formulaVersion,
    eligibleActivityCount: snapshot.evidence.eligibleActivityCount,
    facts: {
      sessions: projectFactMetric(snapshot.facts.sessions),
      runningTime: projectFactMetric(snapshot.facts.runningTime),
      distance: projectFactMetric(snapshot.facts.distance),
      elevationGain: projectFactMetric(snapshot.facts.elevationGain),
      longestDistance: projectFactMetric(snapshot.facts.longestDistance),
      longestDuration: projectFactMetric(snapshot.facts.longestDuration),
    },
  };
}

function projectFactMetric(
  metric: RunnerActivityFactMetric,
): RunnerActivityProgressProductFactMetric {
  return {
    availability: metric.availability,
    confidence: metric.confidence,
    value: metric.value,
    unit: metric.unit,
    includedActivityCount: metric.includedActivityCount,
    missingActivityCount: metric.missingActivityCount,
    missingReasons: metric.missingReasons,
  };
}

function projectAdvancedMetrics(
  metrics: RunnerActivityAdvancedMetricsReadModel,
): RunnerActivityProgressProductAdvancedMetrics {
  if (metrics.status === "updating") {
    return {
      status: metrics.status,
      asOfDate: metrics.asOfDate,
      reason: metrics.reason,
      staleValuesReturned: metrics.staleValuesReturned,
    };
  }

  return {
    status: metrics.status,
    historical: metrics.historical,
    asOfDate: metrics.asOfDate,
    sessionRpeLoad: {
      formulaVersion: metrics.formulaVersions.sessionRpeLoad,
      rolling28Day: {
        current: projectSessionLoadWindow(metrics.sessionRpeLoad.rolling28Day.current),
        previous: projectSessionLoadWindow(metrics.sessionRpeLoad.rolling28Day.previous),
      },
      calendarWeeks: metrics.sessionRpeLoad.calendarWeeks.map(projectSessionLoadWindow),
    },
    records: {
      availability: metrics.records.availability,
      items: metrics.records.items.map(projectRecord),
      unavailableReasons: Array.from(
        new Set(
          [metrics.records.unavailableReason, ...metrics.records.unavailableReasons].filter(
            (reason): reason is string => Boolean(reason),
          ),
        ),
      ),
    },
    detailedMetrics: {
      status: metrics.streamDependentMetrics.aerobicEfficiency.status,
      reason: metrics.streamDependentMetrics.aerobicEfficiency.reason,
    },
  };
}

function projectFitProgress(
  metrics: RunnerActivityAdvancedMetricsReadModel,
): RunnerActivityFitProgressProductModel {
  if (metrics.status === "updating") {
    return {
      status: "updating",
      reason: metrics.reason,
      staleValuesReturned: metrics.staleValuesReturned,
    };
  }
  if (metrics.fitProgress.status === "unavailable") return metrics.fitProgress;
  return {
    status: metrics.fitProgress.status,
    evidenceLabel: metrics.fitProgress.evidenceLabel,
    chart: metrics.fitProgress.chart,
    personalBests: {
      formulaVersion: metrics.fitProgress.personalBests.formulaVersion,
      matchingRule: metrics.fitProgress.personalBests.matchingRule,
      slots: metrics.fitProgress.personalBests.slots.map(
        (slot): RunnerActivityFitPersonalBestProductSlot => {
          if (slot.state !== "available") return slot;
          return {
            ...slot,
            result: {
              elapsedSeconds: slot.result.elapsedSeconds,
              displayValue: slot.result.displayValue,
              eventDate: slot.result.eventDate,
              evidenceLabel: slot.result.evidenceLabel,
              source: { activityId: slot.result.source.activityId },
            },
          };
        },
      ),
    },
  };
}

function projectFitActivitySequence(
  sequence: RunnerActivityFitSequenceReadModel,
): RunnerActivityFitSequenceProductModel {
  if (sequence.status === "updating" || sequence.status === "unavailable") return sequence;
  return {
    ...sequence,
    points: sequence.points.map((point) => ({
      ...point,
      evidence: {
        state: point.evidence.state,
        label: point.evidence.label,
      },
    })),
  };
}

function projectSessionLoadWindow(
  window: RunnerActivitySessionLoadWindow,
): RunnerActivityProgressProductSessionLoadWindow {
  return {
    startDate: window.startDate,
    endDate: window.endDate,
    metric: projectSessionLoadMetric(window.metric),
  };
}

function projectSessionLoadMetric(
  metric: RunnerActivitySessionLoadMetric,
): RunnerActivityProgressProductSessionLoadMetric {
  return {
    availability: metric.availability,
    confidence: metric.confidence,
    value: metric.value,
    displayValue: metric.displayValue,
    unit: metric.unit,
    includedObservationCount: metric.includedObservationCount,
    unavailableObservationCount: metric.unavailableObservationCount,
    unavailableReasons: metric.unavailableReasons,
  };
}

function projectRecord(record: RunnerActivityRecordItem): RunnerActivityProgressProductRecord {
  return {
    id: [record.recordClass, record.distanceKey, record.context ?? "context_unknown"].join(":"),
    recordClass: record.recordClass,
    distanceKey: record.distanceKey,
    distanceMeters: record.distanceMeters,
    elapsedSeconds: record.elapsedSeconds,
    eventDate: record.eventDate,
    confidence: record.confidence,
    provenance: record.provenance,
    context: record.context,
  };
}
