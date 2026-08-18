import type {
  RunnerActivityAdvancedMetricsReadModel,
  RunnerActivityDurationBasis,
  RunnerActivityFactMetric,
  RunnerActivityFactSnapshot,
  RunnerActivityFitChartPeriod,
  RunnerActivityFitSequencePoint,
  RunnerActivityFitSequenceReadModel,
  RunnerActivityFitPersonalBestSlot,
  RunnerActivityHistoryItem,
  RunnerActivityHistoryPage,
  RunnerActivityMutationReadback,
  RunnerActivityProgressReadModel,
  RunnerActivityRecordItem,
  RunnerActivitySessionLoadMetric,
  RunnerActivitySessionLoadWindow,
} from "@/lib/runner-activity/read-model-types";

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
    basis: RunnerActivityDurationBasis;
  } | null;
  pace: {
    secondsPerKm: number;
    basis: RunnerActivityDurationBasis;
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
    rawState: RunnerActivityHistoryItem["source"]["rawState"];
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
  availability: RunnerActivityFactMetric["availability"];
  confidence: RunnerActivityFactMetric["confidence"];
  value: number | null;
  unit: RunnerActivityFactMetric["unit"];
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
  availability: RunnerActivitySessionLoadMetric["availability"];
  confidence: RunnerActivitySessionLoadMetric["confidence"];
  value: number | null;
  displayValue: number | null;
  unit: RunnerActivitySessionLoadMetric["unit"];
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
  recordClass: RunnerActivityRecordItem["recordClass"];
  distanceKey: string;
  distanceMeters: number;
  elapsedSeconds: number;
  eventDate: string | null;
  confidence: RunnerActivityRecordItem["confidence"];
  provenance: RunnerActivityRecordItem["provenance"];
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

export type RunnerActivityFitPersonalBestProductSlot = Omit<
  RunnerActivityFitPersonalBestSlot,
  "result"
> & {
  result: null | {
    elapsedSeconds: number;
    displayValue: string;
    eventDate: string | null;
    evidenceLabel: "From FIT file";
    source: {
      activityId: string;
    };
  };
};

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

export type RunnerActivityFitSequenceProductPoint = Omit<
  RunnerActivityFitSequencePoint,
  "evidence"
> & {
  evidence: {
    state: "current";
    label: "From FIT file";
  };
};

export type RunnerActivityFitSequenceProductModel =
  | (Omit<Extract<RunnerActivityFitSequenceReadModel, { status: "ready" | "empty" }>, "points"> & {
      points: RunnerActivityFitSequenceProductPoint[];
    })
  | Extract<RunnerActivityFitSequenceReadModel, { status: "updating" | "unavailable" }>;

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
      slots: metrics.fitProgress.personalBests.slots.map((slot) => ({
        ...slot,
        result: slot.result
          ? {
              elapsedSeconds: slot.result.elapsedSeconds,
              displayValue: slot.result.displayValue,
              eventDate: slot.result.eventDate,
              evidenceLabel: slot.result.evidenceLabel,
              source: { activityId: slot.result.source.activityId },
            }
          : null,
      })),
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
