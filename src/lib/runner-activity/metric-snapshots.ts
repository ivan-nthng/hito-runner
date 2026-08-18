import "@tanstack/react-start/server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  buildGate4ObservationDrafts,
  buildGate4SnapshotPayload,
  buildRunnerActivityFitSequence,
  gate4InputFingerprint,
  RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION,
  RUNNER_ACTIVITY_GATE4_FORMULA_VERSIONS,
  type Gate4ActivityInput,
  type Gate4EvidenceInput,
  type Gate4ObservationDraft,
  type Gate4PersistedObservation,
  type RunnerActivityFitEvidenceInput,
} from "@/lib/runner-activity/metric-formulas";
import type {
  RunnerActivityAdvancedMetricsCurrent,
  RunnerActivityFitProgressReadModel,
  RunnerActivityFitSequencePeriodRequest,
  RunnerActivityFitSequenceReadModel,
} from "@/lib/runner-activity/read-model-types";
import { readRunnerActivityRunningContext } from "@/lib/runner-activity/running-context";

export type RunnerActivityMetricCreationCause =
  | "read_reconciliation"
  | "ingestion"
  | "backfill"
  | "source_removal"
  | "activity_delete"
  | "correction"
  | "evidence_mutation"
  | "formula_recalculation";

export class RunnerActivityMetricRecalculationPendingError extends Error {
  constructor() {
    super("Runner activity metric recalculation is pending.");
    this.name = "RunnerActivityMetricRecalculationPendingError";
  }
}

type ActivityRow = {
  id: string;
  current_revision_id: string | null;
  current_revision: ActivityRevisionRow | null;
  started_at: string | null;
  local_date: string | null;
  historical_timezone: string | null;
  elapsed_duration_min: number | null;
  timer_duration_min: number | null;
  distance_km: number | null;
};

type ActivityRevisionRow = {
  id: string;
  activity_id: string;
  source_revision_id: string;
  normalized_summary: Json;
};

type ActivitySourceRow = {
  id: string;
  activity_id: string;
  current_revision_id: string | null;
  source_kind: string;
};

type ActivitySourceRevisionRow = {
  id: string;
  source_id: string;
  raw_asset_kind: string;
  raw_state: string;
  raw_storage_bucket: string | null;
  raw_storage_path: string | null;
};

type EvidenceRow = {
  id: string;
  activity_id: string;
  activity_revision_id: string;
  evidence_kind: string;
  revision_number: number;
  lifecycle_state: string;
  session_rpe: number | null;
  completion_outcome: string | null;
  official_distance_m: number | null;
  official_elapsed_seconds: number | null;
  official_event_date: string | null;
  official_context: string | null;
  origin: string;
};

type MatchRow = {
  activity_id: string;
  planned_workout_id: string | null;
};

type WorkoutLogRow = {
  planned_workout_id: string;
  outcome: string;
  rpe: number | null;
};

type ObservationRow = {
  id: string;
  activity_id: string;
  activity_revision_id: string;
  source_revision_id: string;
  evidence_revision_id: string | null;
  metric_key: string;
  metric_variant: string;
  metric_formula_version: string;
  availability: string;
  value: number | null;
  unit: string;
  analyzed_bounds: Json;
  eligibility: Json;
  exclusions: Json;
  comparability_cohort: string | null;
  confidence: string;
  unavailable_reason: string | null;
  input_fingerprint_sha256: string;
};

const loadMetricSchema = z.object({
  availability: z.enum(["available", "unavailable"]),
  confidence: z.enum(["complete", "partial", "unavailable"]),
  value: z.number().nullable(),
  displayValue: z.number().nullable(),
  unit: z.literal("arbitrary_units"),
  includedObservationCount: z.number().int().nonnegative(),
  unavailableObservationCount: z.number().int().nonnegative(),
  unavailableReasons: z.array(z.string()),
  observationIds: z.array(z.string().uuid()),
});

const loadWindowSchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
  metric: loadMetricSchema,
});

const fitChartPointSchema = z.object({
  id: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  cutoffDate: z.string().date(),
  shortLabel: z.string().min(1),
  accessibleLabel: z.string().min(1),
  completion: z.enum(["partial_start", "complete", "to_date"]),
  completionLabel: z.enum(["Partial week", "Complete week", "To date"]),
  state: z.enum(["available", "partial", "unavailable"]),
  value: z.number().nullable(),
  displayValue: z.string().nullable(),
  coverage: z.object({
    includedCount: z.number().int().nonnegative(),
    candidateCount: z.number().int().nonnegative(),
    missingCount: z.number().int().nonnegative(),
    label: z.string().min(1),
  }),
  reasons: z.array(z.string()),
  reasonLabels: z.array(z.string()),
});

const fitChartSeriesIdentitySchema = z.object({
  id: z.enum(["sessions", "running_time", "distance", "elevation", "reported_load"]),
  title: z.string().min(1),
  purpose: z.string().min(1),
  unit: z.enum(["sessions", "minutes", "kilometers", "meters", "arbitrary_units"]),
  unitLabel: z.enum(["sessions", "min", "km", "m", "AU"]),
  display: z.object({
    format: z.enum(["integer", "duration_minutes", "decimal"]),
    maximumFractionDigits: z.number().int().nonnegative(),
  }),
  evidenceLabel: z.literal("From FIT file"),
  formulaVersion: z.string().min(1),
});

const fitChartSeriesSchema = z.union([
  fitChartSeriesIdentitySchema.extend({
    status: z.literal("ready"),
    points: z.array(fitChartPointSchema),
  }),
  fitChartSeriesIdentitySchema.extend({
    status: z.literal("updating"),
    reason: z.literal("fit_evidence_updating"),
    reasonLabel: z.literal("FIT evidence is updating."),
    staleValuesReturned: z.literal(false),
    points: z.tuple([]),
  }),
]);

const fitPersonalBestSlotSchema = z.object({
  id: z.enum(["1_km", "5_km", "10_km", "half_marathon", "marathon"]),
  label: z.enum(["1 km", "5 km", "10 km", "Half Marathon · 21.0975 km", "Marathon · 42.195 km"]),
  distanceMeters: z.number().positive(),
  state: z.enum(["available", "no_verified_time", "unavailable", "updating"]),
  reason: z.string().nullable(),
  reasonLabel: z.string().nullable(),
  result: z
    .object({
      elapsedSeconds: z.number().positive(),
      displayValue: z.string().min(1),
      eventDate: z.string().date().nullable(),
      evidenceLabel: z.literal("From FIT file"),
      source: z.object({
        activityId: z.string().uuid(),
        activityRevisionId: z.string().uuid(),
      }),
    })
    .nullable(),
});

const fitProgressSchema = z.object({
  status: z.literal("current"),
  evidenceLabel: z.literal("From FIT file"),
  chart: z.object({
    advertisedPeriods: z.tuple([
      z.object({
        id: z.literal("28_days"),
        label: z.literal("28 days"),
        startDate: z.string().date(),
        endDate: z.string().date(),
        state: z.literal("to_date"),
        bucketResolution: z.literal("calendar_week"),
        timezoneBasis: z.literal("historical_local_date"),
        weekStartsOn: z.literal("monday"),
        series: z.array(fitChartSeriesSchema),
      }),
    ]),
  }),
  personalBests: z.object({
    formulaVersion: z.string().min(1),
    matchingRule: z.literal("exact_whole_activity_distance_within_0_05_meters"),
    slots: z.array(fitPersonalBestSlotSchema).length(5),
  }),
});

const unavailableStreamMetricSchema = z.object({
  status: z.literal("unavailable"),
  reason: z.literal("normalized_stream_not_persisted"),
  formulaVersion: z.string().min(1),
});

const advancedSnapshotSchema = z.object({
  status: z.literal("current"),
  snapshotId: z.string().uuid(),
  historical: z.boolean(),
  asOfDate: z.string().date(),
  formulaSetVersion: z.string().min(1),
  formulaVersions: z.object({
    personalBest: z.string().min(1),
    sessionRpeLoad: z.string().min(1),
    fitProgress: z.string().min(1).optional(),
  }),
  fitProgress: fitProgressSchema.optional(),
  sessionRpeLoad: z.object({
    rolling28Day: z.object({ current: loadWindowSchema, previous: loadWindowSchema }),
    calendarWeeks: z.array(loadWindowSchema),
  }),
  records: z.object({
    availability: z.enum(["available", "unavailable"]),
    items: z.array(
      z.object({
        observationId: z.string().uuid(),
        activityId: z.string().uuid(),
        activityRevisionId: z.string().uuid(),
        sourceRevisionId: z.string().uuid(),
        evidenceRevisionId: z.string().uuid().nullable(),
        recordClass: z.enum(["hito_observed_whole_activity", "runner_confirmed_official_result"]),
        distanceKey: z.string().min(1),
        distanceMeters: z.number().positive(),
        elapsedSeconds: z.number().positive(),
        eventDate: z.string().date().nullable(),
        confidence: z.enum(["complete", "partial"]),
        provenance: z.enum(["canonical_activity_summary", "runner_confirmed"]),
        context: z.string().nullable(),
        formulaVersion: z.string().min(1),
      }),
    ),
    unavailableReason: z.string().nullable(),
    unavailableReasons: z.array(z.string()),
    calculatedWithinActivity: z.object({
      status: z.literal("unavailable"),
      reason: z.literal("normalized_stream_not_persisted"),
    }),
    providerAttributed: z.object({
      status: z.literal("unavailable"),
      reason: z.literal("unsupported_record_class"),
    }),
  }),
  streamDependentMetrics: z.object({
    aerobicEfficiency: unavailableStreamMetricSchema,
    paceAtComparableHeartRate: unavailableStreamMetricSchema,
    heartRateAtComparablePace: unavailableStreamMetricSchema,
    durability: unavailableStreamMetricSchema,
    controlledAerobicDuration: unavailableStreamMetricSchema,
  }),
  evidence: z.object({
    activityRevisionIds: z.array(z.string().uuid()),
    evidenceRevisionIds: z.array(z.string().uuid()),
    observationIds: z.array(z.string().uuid()),
  }),
});

export async function getRunnerActivityAdvancedMetricsForUser(input: {
  userId: string;
  asOfDate: string;
  creationCause?: RunnerActivityMetricCreationCause;
}): Promise<RunnerActivityAdvancedMetricsCurrent> {
  const asOfDate = z.string().date().parse(input.asOfDate);
  const activities = await loadGate4Activities(input.userId, asOfDate);
  return reconcileRunnerActivityAdvancedMetrics({ ...input, asOfDate, activities });
}

export async function getRunnerActivityProgressMetricsForUser(input: {
  userId: string;
  asOfDate: string;
  timeZone: string;
  sequencePeriod: RunnerActivityFitSequencePeriodRequest;
  creationCause?: RunnerActivityMetricCreationCause;
}): Promise<{
  advancedMetrics: RunnerActivityAdvancedMetricsCurrent;
  fitActivitySequence: RunnerActivityFitSequenceReadModel;
}> {
  const asOfDate = z.string().date().parse(input.asOfDate);
  const activities = await loadGate4Activities(input.userId, asOfDate);
  const advancedMetrics = await reconcileRunnerActivityAdvancedMetrics({
    ...input,
    asOfDate,
    activities,
  });
  return {
    advancedMetrics,
    fitActivitySequence: buildRunnerActivityFitSequence({
      asOfDate,
      timeZone: input.timeZone,
      period: input.sequencePeriod,
      activities,
    }),
  };
}

async function reconcileRunnerActivityAdvancedMetrics(input: {
  userId: string;
  asOfDate: string;
  activities: Gate4ActivityInput[];
  creationCause?: RunnerActivityMetricCreationCause;
}) {
  const { activities, asOfDate } = input;
  const inputFingerprint = gate4InputFingerprint({ activities });
  const supabase = createAdminSupabaseClient();
  const existing = await supabase
    .from("runner_activity_metric_snapshots")
    .select("id, metric_payload")
    .eq("user_id", input.userId)
    .eq("as_of_date", asOfDate)
    .eq("formula_set_version", RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION)
    .eq("input_fingerprint_sha256", inputFingerprint)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return parseSnapshot(existing.data.metric_payload, false);

  const observations = await persistObservations({
    userId: input.userId,
    activities,
    drafts: buildGate4ObservationDrafts(activities),
  });
  const snapshotId = randomUUID();
  const evidenceRevisionIds = Array.from(
    new Set(
      activities.flatMap((activity) => [
        activity.evidence.sessionRpe?.id,
        activity.evidence.officialResult?.id,
      ]),
    ),
  ).filter((value): value is string => Boolean(value));
  const payload = buildGate4SnapshotPayload({
    id: snapshotId,
    asOfDate,
    historical: false,
    activities,
    observations,
    activityRevisionIds: activities.map((activity) => activity.activityRevisionId),
    evidenceRevisionIds,
  });
  const inserted = await supabase
    .from("runner_activity_metric_snapshots")
    .insert({
      id: snapshotId,
      user_id: input.userId,
      as_of_date: asOfDate,
      formula_set_version: RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION,
      formula_versions: RUNNER_ACTIVITY_GATE4_FORMULA_VERSIONS as unknown as Json,
      input_fingerprint_sha256: inputFingerprint,
      calculation_status: "current",
      metric_payload: payload as unknown as Json,
      observation_ids: observations.map((observation) => observation.id) as unknown as Json,
      input_activity_revisions: activities.map((activity) => ({
        activity_id: activity.id,
        activity_revision_id: activity.activityRevisionId,
        source_revision_id: activity.sourceRevisionId,
      })) as unknown as Json,
      input_evidence_revisions: evidenceRevisionIds as unknown as Json,
      creation_cause: input.creationCause ?? "read_reconciliation",
    })
    .select("metric_payload")
    .single();
  if (!inserted.error) return parseSnapshot(inserted.data.metric_payload, false);
  if (inserted.error.code !== "23505") throw new Error(inserted.error.message);

  const concurrent = await supabase
    .from("runner_activity_metric_snapshots")
    .select("metric_payload")
    .eq("user_id", input.userId)
    .eq("as_of_date", asOfDate)
    .eq("formula_set_version", RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION)
    .eq("input_fingerprint_sha256", inputFingerprint)
    .single();
  if (concurrent.error?.code === "PGRST116") {
    throw new RunnerActivityMetricRecalculationPendingError();
  }
  if (concurrent.error) throw new Error(concurrent.error.message);
  return parseSnapshot(concurrent.data.metric_payload, false);
}

export function metricRecalculationPendingReadback(error: unknown, asOfDate: string) {
  if (!(error instanceof RunnerActivityMetricRecalculationPendingError)) throw error;
  return {
    status: "updating" as const,
    asOfDate,
    reason: "metric_recalculation_pending" as const,
    staleValuesReturned: false as const,
  };
}

export async function getHistoricalRunnerActivityMetricSnapshotForUser(input: {
  userId: string;
  snapshotId: string;
}) {
  const snapshotId = z.string().uuid().parse(input.snapshotId);
  const result = await createAdminSupabaseClient()
    .from("runner_activity_metric_snapshots")
    .select("metric_payload")
    .eq("user_id", input.userId)
    .eq("id", snapshotId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error("Runner activity metric snapshot was not found.");
  return parseSnapshot(result.data.metric_payload, true);
}

async function loadGate4Activities(
  userId: string,
  asOfDate: string,
): Promise<Gate4ActivityInput[]> {
  const supabase = createAdminSupabaseClient();
  const activities = await loadPaged<ActivityRow>(async (from, to) =>
    supabase
      .from("runner_activities")
      .select(
        "id, current_revision_id, started_at, local_date, historical_timezone, elapsed_duration_min, timer_duration_min, distance_km, current_revision:runner_activity_revisions!runner_activities_current_revision_id_fkey(id, activity_id, source_revision_id, normalized_summary)",
      )
      .eq("user_id", userId)
      .eq("sport", "run")
      .eq("recording_kind", "recorded")
      .eq("quality_state", "accepted")
      .or(`local_date.lte.${asOfDate},local_date.is.null`)
      .order("id", { ascending: true })
      .range(from, to),
  );
  const [activitySources, sourceRevisions] = await Promise.all([
    loadPaged<ActivitySourceRow>(async (from, to) =>
      supabase
        .from("runner_activity_sources")
        .select("id, activity_id, current_revision_id, source_kind")
        .eq("user_id", userId)
        .order("id", { ascending: true })
        .range(from, to),
    ),
    loadPaged<ActivitySourceRevisionRow>(async (from, to) =>
      supabase
        .from("runner_activity_source_revisions")
        .select("id, source_id, raw_asset_kind, raw_state, raw_storage_bucket, raw_storage_path")
        .eq("user_id", userId)
        .order("id", { ascending: true })
        .range(from, to),
    ),
  ]);
  const evidenceRows = await loadPaged<EvidenceRow>(async (from, to) =>
    supabase
      .from("runner_activity_evidence_revisions")
      .select(
        "id, activity_id, activity_revision_id, evidence_kind, revision_number, lifecycle_state, session_rpe, completion_outcome, official_distance_m, official_elapsed_seconds, official_event_date, official_context, origin",
      )
      .eq("user_id", userId)
      .order("revision_number", { ascending: false })
      .range(from, to),
  );
  const latestEvidence = new Map<string, Gate4EvidenceInput>();
  for (const row of evidenceRows) {
    const key = `${row.activity_id}:${row.evidence_kind}`;
    if (!latestEvidence.has(key)) latestEvidence.set(key, evidenceInputFromRow(row));
  }

  const matches = await loadPaged<MatchRow>(async (from, to) =>
    supabase
      .from("runner_activity_planned_workout_matches")
      .select("activity_id, planned_workout_id")
      .eq("user_id", userId)
      .range(from, to),
  );
  const matchByActivity = new Map(matches.map((match) => [match.activity_id, match]));
  const matchCountByWorkout = countBy(
    matches.flatMap((match) => (match.planned_workout_id ? [match.planned_workout_id] : [])),
  );
  const plannedWorkoutIds = Array.from(matchCountByWorkout.keys());
  const logs = await loadRowsByValues<WorkoutLogRow>({
    table: "workout_logs",
    columns: "planned_workout_id, outcome, rpe",
    userId,
    field: "planned_workout_id",
    values: plannedWorkoutIds,
  });
  const logByWorkout = new Map(logs.map((log) => [log.planned_workout_id, log]));
  const sourceById = new Map(activitySources.map((source) => [source.id, source]));
  const sourceRevisionById = new Map(
    sourceRevisions.map((sourceRevision) => [sourceRevision.id, sourceRevision]),
  );

  return activities.map((activity) => {
    const revision = activity.current_revision;
    if (
      !revision ||
      revision.id !== activity.current_revision_id ||
      revision.activity_id !== activity.id
    ) {
      throw new Error("Canonical runner activity revision graph is inconsistent.");
    }
    const match = matchByActivity.get(activity.id);
    const plannedWorkoutId = match?.planned_workout_id ?? null;
    const matchCount = plannedWorkoutId ? (matchCountByWorkout.get(plannedWorkoutId) ?? 0) : 0;
    return {
      id: activity.id,
      activityRevisionId: revision.id,
      sourceRevisionId: revision.source_revision_id,
      localDate: activity.local_date,
      startedAt: activity.started_at,
      historicalTimezone: activity.historical_timezone,
      timerDurationMin: activity.timer_duration_min,
      elapsedDurationMin: activity.elapsed_duration_min,
      distanceKm: activity.distance_km,
      elevationGainM: observedElevationGain(revision.normalized_summary),
      fitEvidence: fitEvidenceForActivity({
        activityId: activity.id,
        sourceRevisionId: revision.source_revision_id,
        sourceRevisionById,
        sourceById,
      }),
      recordContext: readRunnerActivityRunningContext(revision.normalized_summary),
      rpeLinkState: !plannedWorkoutId ? "missing" : matchCount === 1 ? "exact" : "ambiguous",
      rpeInputPresent: plannedWorkoutId
        ? Boolean(logByWorkout.get(plannedWorkoutId)?.rpe) ||
          logByWorkout.get(plannedWorkoutId)?.outcome === "skipped"
        : false,
      evidence: {
        sessionRpe: latestEvidence.get(`${activity.id}:session_rpe`) ?? null,
        officialResult: latestEvidence.get(`${activity.id}:official_result`) ?? null,
      },
    };
  });
}

function fitEvidenceForActivity(input: {
  activityId: string;
  sourceRevisionId: string;
  sourceRevisionById: Map<string, ActivitySourceRevisionRow>;
  sourceById: Map<string, ActivitySourceRow>;
}): RunnerActivityFitEvidenceInput {
  // The canonical Garmin adapter creates the normalized activity revision only after a successful
  // parse, in the same transaction that installs this source revision as current.
  const sourceRevision = input.sourceRevisionById.get(input.sourceRevisionId);
  const source = sourceRevision ? input.sourceById.get(sourceRevision.source_id) : null;
  if (
    !sourceRevision ||
    !source ||
    source.activity_id !== input.activityId ||
    source.source_kind !== "manual_garmin_fit" ||
    (sourceRevision.raw_asset_kind !== "garmin_fit" &&
      sourceRevision.raw_asset_kind !== "garmin_zip")
  ) {
    return { state: "unavailable", reason: "fit_source_graph_invalid" };
  }
  if (source.current_revision_id !== sourceRevision.id) {
    return { state: "unavailable", reason: "fit_source_revision_not_current" };
  }
  if (sourceRevision.raw_state === "removal_pending") {
    return { state: "updating", reason: "fit_source_removal_pending" };
  }
  if (sourceRevision.raw_state === "removed") {
    return { state: "unavailable", reason: "fit_source_removed" };
  }
  if (
    sourceRevision.raw_state !== "available" ||
    !sourceRevision.raw_storage_bucket ||
    !sourceRevision.raw_storage_path
  ) {
    return { state: "unavailable", reason: "fit_source_graph_invalid" };
  }
  return { state: "eligible", reason: null };
}

function observedElevationGain(value: Json) {
  const elevation = objectValue(value).total_ascent_m;
  return typeof elevation === "number" && Number.isFinite(elevation) ? elevation : null;
}

async function persistObservations(input: {
  userId: string;
  activities: Gate4ActivityInput[];
  drafts: Gate4ObservationDraft[];
}): Promise<Gate4PersistedObservation[]> {
  if (input.drafts.length === 0) return [];
  const supabase = createAdminSupabaseClient();
  const currentFormulaVersions = Array.from(
    new Set(input.drafts.map((draft) => draft.metricFormulaVersion)),
  );
  for (const values of chunks(input.drafts, 100)) {
    const inserted = await supabase.from("runner_activity_metric_observations").upsert(
      values.map((draft) => ({
        user_id: input.userId,
        activity_id: draft.activityId,
        activity_revision_id: draft.activityRevisionId,
        source_revision_id: draft.sourceRevisionId,
        evidence_revision_id: draft.evidenceRevisionId,
        metric_key: draft.metricKey,
        metric_variant: draft.metricVariant,
        metric_formula_version: draft.metricFormulaVersion,
        availability: draft.availability,
        value: draft.value,
        unit: draft.unit,
        analyzed_bounds: draft.analyzedBounds as unknown as Json,
        eligibility: draft.eligibility as unknown as Json,
        exclusions: draft.exclusions as unknown as Json,
        comparability_cohort: draft.comparabilityCohort,
        confidence: draft.confidence,
        unavailable_reason: draft.unavailableReason,
        input_fingerprint_sha256: draft.inputFingerprintSha256,
      })),
      {
        onConflict: "user_id,metric_key,metric_formula_version,input_fingerprint_sha256",
        ignoreDuplicates: true,
      },
    );
    if (inserted.error) throw new Error(inserted.error.message);
  }

  const rows: ObservationRow[] = [];
  for (const fingerprints of chunks(
    input.drafts.map((draft) => draft.inputFingerprintSha256),
    100,
  )) {
    const result = await supabase
      .from("runner_activity_metric_observations")
      .select("*")
      .eq("user_id", input.userId)
      .in("metric_formula_version", currentFormulaVersions)
      .in("input_fingerprint_sha256", fingerprints);
    if (result.error) throw new Error(result.error.message);
    rows.push(...((result.data ?? []) as ObservationRow[]));
  }
  const localDateByActivity = new Map(
    input.activities.map((activity) => [activity.id, activity.localDate]),
  );
  return rows.map((row) => persistedObservationFromRow(row, localDateByActivity));
}

function persistedObservationFromRow(
  row: ObservationRow,
  localDateByActivity: Map<string, string | null>,
): Gate4PersistedObservation {
  if (
    (row.metric_key !== "personal_best_elapsed" && row.metric_key !== "session_rpe_load") ||
    (row.availability !== "available" && row.availability !== "unavailable") ||
    (row.unit !== "seconds" && row.unit !== "arbitrary_units") ||
    (row.confidence !== "complete" &&
      row.confidence !== "partial" &&
      row.confidence !== "unavailable")
  ) {
    throw new Error("Runner activity metric observation metadata is invalid.");
  }
  return {
    id: row.id,
    activityId: row.activity_id,
    activityRevisionId: row.activity_revision_id,
    sourceRevisionId: row.source_revision_id,
    evidenceRevisionId: row.evidence_revision_id,
    metricKey: row.metric_key,
    metricVariant: row.metric_variant,
    metricFormulaVersion: row.metric_formula_version,
    availability: row.availability,
    value: row.value,
    unit: row.unit,
    analyzedBounds: objectValue(row.analyzed_bounds),
    eligibility: objectValue(row.eligibility),
    exclusions: z.array(z.string()).parse(row.exclusions),
    comparabilityCohort: row.comparability_cohort,
    confidence: row.confidence,
    unavailableReason: row.unavailable_reason,
    inputFingerprintSha256: row.input_fingerprint_sha256,
    localDate: localDateByActivity.get(row.activity_id) ?? null,
  };
}

function evidenceInputFromRow(row: EvidenceRow): Gate4EvidenceInput {
  if (
    (row.evidence_kind !== "session_rpe" && row.evidence_kind !== "official_result") ||
    (row.lifecycle_state !== "asserted" && row.lifecycle_state !== "withdrawn") ||
    (row.completion_outcome !== null &&
      row.completion_outcome !== "completed" &&
      row.completion_outcome !== "partial" &&
      row.completion_outcome !== "skipped") ||
    (row.origin !== "runner_direct" && row.origin !== "workout_log_backfill")
  ) {
    throw new Error("Runner activity evidence revision metadata is invalid.");
  }
  return {
    id: row.id,
    activityRevisionId: row.activity_revision_id,
    kind: row.evidence_kind,
    lifecycleState: row.lifecycle_state,
    sessionRpe: row.session_rpe,
    completionOutcome: row.completion_outcome,
    officialDistanceM: row.official_distance_m,
    officialElapsedSeconds: row.official_elapsed_seconds,
    officialEventDate: row.official_event_date,
    officialContext: row.official_context,
    origin: row.origin,
  };
}

function parseSnapshot(value: Json, historical: boolean): RunnerActivityAdvancedMetricsCurrent {
  const parsed = advancedSnapshotSchema.parse({ ...objectValue(value), historical });
  let fitProgress: RunnerActivityFitProgressReadModel;
  if (parsed.formulaSetVersion === RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION) {
    if (
      !parsed.fitProgress ||
      parsed.formulaVersions.fitProgress !== RUNNER_ACTIVITY_GATE4_FORMULA_VERSIONS.fitProgress ||
      parsed.fitProgress.personalBests.formulaVersion !==
        RUNNER_ACTIVITY_GATE4_FORMULA_VERSIONS.fitProgress ||
      parsed.fitProgress.chart.advertisedPeriods[0].series.some(
        (series) => series.formulaVersion !== RUNNER_ACTIVITY_GATE4_FORMULA_VERSIONS.fitProgress,
      )
    ) {
      throw new Error("Current runner activity metric snapshot is missing FIT Progress truth.");
    }
    fitProgress = parsed.fitProgress as RunnerActivityFitProgressReadModel;
  } else {
    fitProgress = {
      status: "unavailable",
      reason: "historical_formula_version_without_fit_progress",
    };
  }
  return { ...parsed, fitProgress } as RunnerActivityAdvancedMetricsCurrent;
}

function objectValue(value: Json): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Runner activity metric payload is invalid.");
  }
  return value as Record<string, unknown>;
}

async function loadPaged<T>(
  readPage: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>,
) {
  const values: T[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const result = await readPage(offset, offset + pageSize - 1);
    if (result.error) throw new Error(result.error.message);
    values.push(...((result.data ?? []) as T[]));
    if ((result.data?.length ?? 0) < pageSize) return values;
  }
}

async function loadRowsByValues<T>(input: {
  table: "workout_logs";
  columns: string;
  userId: string;
  field: string;
  values: string[];
}) {
  const rows: T[] = [];
  const supabase = createAdminSupabaseClient();
  for (const values of chunks(input.values, 100)) {
    if (values.length === 0) continue;
    const result = await supabase
      .from(input.table)
      .select(input.columns)
      .eq("user_id", input.userId)
      .in(input.field, values);
    if (result.error) throw new Error(result.error.message);
    rows.push(...((result.data ?? []) as T[]));
  }
  return rows;
}

function countBy(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}
