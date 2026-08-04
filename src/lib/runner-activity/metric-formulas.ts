import { createHash } from "node:crypto";
import { addDaysIso, startOfWeekIso } from "@/lib/training";
import type {
  RunnerActivityAdvancedMetricsCurrent,
  RunnerActivityRecordItem,
  RunnerActivitySessionLoadMetric,
  RunnerActivitySessionLoadWindow,
} from "@/lib/runner-activity/read-model-types";

export const RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION =
  "runner_activity_gate4_formula_set_v3" as const;
export const PERSONAL_BEST_FORMULA_VERSION = "personal_best_elapsed_v3" as const;
export const SESSION_RPE_LOAD_FORMULA_VERSION = "session_rpe_load_v1" as const;

export const RUNNER_ACTIVITY_GATE4_FORMULA_VERSIONS = Object.freeze({
  personalBest: PERSONAL_BEST_FORMULA_VERSION,
  sessionRpeLoad: SESSION_RPE_LOAD_FORMULA_VERSION,
});

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
  timerDurationMin: number | null;
  elapsedDurationMin: number | null;
  distanceKm: number | null;
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
