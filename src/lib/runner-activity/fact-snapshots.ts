import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { addDaysIso, startOfWeekIso } from "@/lib/training";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type {
  RunnerActivityFactMetric,
  RunnerActivityFactSnapshot,
  RunnerActivityProgressFactsReadModel,
} from "@/lib/runner-activity/read-model-types";

export const RUNNER_ACTIVITY_FACTS_FORMULA_VERSION = "runner_activity_facts_v1";

type SnapshotFamily = RunnerActivityFactSnapshot["family"];
type SnapshotCreationCause =
  | "read_reconciliation"
  | "ingestion"
  | "backfill"
  | "source_removal"
  | "activity_delete"
  | "correction";

type ActivityRow = {
  current_revision_id: string | null;
  current_revision: RevisionRow | null;
  id: string;
  local_date: string;
  distance_km: number | null;
  timer_duration_min: number | null;
};

type RevisionRow = {
  activity_id: string;
  field_provenance: Json;
  id: string;
  normalized_summary: Json;
  normalizer_version: string;
};

type SnapshotInput = {
  activityId: string;
  activityRevisionId: string;
  localDate: string;
  timerDurationMin: number | null;
  distanceKm: number | null;
  elevationGainM: number | null;
  normalizerVersion: string;
};

const metricSchema = z.object({
  availability: z.enum(["available", "unavailable"]),
  confidence: z.enum(["complete", "partial", "unavailable"]),
  value: z.number().nullable(),
  unit: z.enum(["sessions", "minutes", "kilometers", "meters"]),
  includedActivityCount: z.number().int().nonnegative(),
  missingActivityCount: z.number().int().nonnegative(),
  missingReasons: z.array(z.string()),
  activityId: z.string().nullable(),
  activityRevisionId: z.string().nullable(),
});

const snapshotPayloadSchema = z.object({
  facts: z.object({
    sessions: metricSchema,
    runningTime: metricSchema,
    distance: metricSchema,
    elevationGain: metricSchema,
    longestDistance: metricSchema,
    longestDuration: metricSchema,
  }),
  evidence: z.object({
    activityRevisionIds: z.array(z.string()),
    normalizerVersions: z.array(z.string()),
    eligibleActivityCount: z.number().int().nonnegative(),
    excludedActivityCount: z.number().int().nonnegative(),
    exclusions: z.array(z.object({ reason: z.string(), count: z.number().int().positive() })),
    missingFieldReasons: z.array(
      z.object({ field: z.string(), reason: z.string(), count: z.number().int().positive() }),
    ),
  }),
});

export async function getRunnerActivityProgressFactsForUser(input: {
  userId: string;
  asOfDate?: string;
  creationCause?: SnapshotCreationCause;
}): Promise<RunnerActivityProgressFactsReadModel> {
  const asOfDate = z
    .string()
    .date()
    .parse(input.asOfDate ?? (await getRunnerCalendarDateForUserId(input.userId)));
  const currentRollingStart = addDaysIso(asOfDate, -27);
  const previousRollingEnd = addDaysIso(currentRollingStart, -1);
  const previousRollingStart = addDaysIso(previousRollingEnd, -27);
  const activities = await loadSnapshotInputs({
    userId: input.userId,
    startDate: previousRollingStart,
    endDate: asOfDate,
  });
  const creationCause = input.creationCause ?? "read_reconciliation";
  const snapshotRequests: Array<Parameters<typeof readOrCreateSnapshot>[0]> = [
    {
      userId: input.userId,
      family: "rolling_28_day",
      startDate: currentRollingStart,
      endDate: asOfDate,
      cutoffDate: asOfDate,
      activities: activities.inputs,
      undatedActivityCount: activities.undatedActivityCount,
      missingRevisionDates: activities.missingRevisionDates,
      creationCause,
    },
    {
      userId: input.userId,
      family: "rolling_28_day",
      startDate: previousRollingStart,
      endDate: previousRollingEnd,
      cutoffDate: previousRollingEnd,
      activities: activities.inputs,
      undatedActivityCount: activities.undatedActivityCount,
      missingRevisionDates: activities.missingRevisionDates,
      creationCause,
    },
  ];

  let weekStart = startOfWeekIso(currentRollingStart);
  const currentWeekStart = startOfWeekIso(asOfDate);
  while (weekStart <= currentWeekStart) {
    const weekEnd = addDaysIso(weekStart, 6);
    snapshotRequests.push({
      userId: input.userId,
      family: "calendar_week",
      startDate: weekStart,
      endDate: weekEnd,
      cutoffDate: weekEnd > asOfDate ? asOfDate : weekEnd,
      activities: activities.inputs,
      undatedActivityCount: activities.undatedActivityCount,
      missingRevisionDates: activities.missingRevisionDates,
      creationCause,
    });
    weekStart = addDaysIso(weekStart, 7);
  }
  const [current, previous, ...calendarWeeks] = await Promise.all(
    snapshotRequests.map(readOrCreateSnapshot),
  );

  return {
    status: "current",
    asOfDate,
    rolling28Day: { current, previous },
    calendarWeeks,
    interpretation: {
      volumeIsFitness: false,
      derivedCoachingMetricsAvailable: false,
      unavailableReason: "later_gate_metric_contract_required",
    },
  };
}

async function loadSnapshotInputs(input: { userId: string; startDate: string; endDate: string }) {
  const supabase = createAdminSupabaseClient();
  const activities: ActivityRow[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const page = await supabase
      .from("runner_activities")
      .select(
        "id, current_revision_id, local_date, timer_duration_min, distance_km, current_revision:runner_activity_revisions!runner_activities_current_revision_id_fkey(id, activity_id, normalized_summary, field_provenance, normalizer_version)",
      )
      .eq("user_id", input.userId)
      .eq("sport", "run")
      .eq("recording_kind", "recorded")
      .eq("quality_state", "accepted")
      .gte("local_date", input.startDate)
      .lte("local_date", input.endDate)
      .order("local_date", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (page.error) throw new Error(page.error.message);
    activities.push(...((page.data ?? []) as ActivityRow[]));
    if ((page.data?.length ?? 0) < pageSize) break;
  }

  const undated = await supabase
    .from("runner_activities")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("sport", "run")
    .eq("recording_kind", "recorded")
    .eq("quality_state", "accepted")
    .is("local_date", null);
  if (undated.error) throw new Error(undated.error.message);

  const inputs = activities.flatMap((activity): SnapshotInput[] => {
    const revision = activity.current_revision;
    if (!revision || revision.id !== activity.current_revision_id) return [];
    return [
      {
        activityId: activity.id,
        activityRevisionId: revision.id,
        localDate: activity.local_date,
        timerDurationMin: activity.timer_duration_min,
        distanceKm: activity.distance_km,
        elevationGainM: observedElevationGain(revision),
        normalizerVersion: revision.normalizer_version,
      },
    ];
  });

  return {
    inputs,
    undatedActivityCount: undated.count ?? 0,
    missingRevisionDates: activities
      .filter(
        (activity) =>
          !activity.current_revision_id ||
          activity.current_revision?.id !== activity.current_revision_id,
      )
      .map((activity) => activity.local_date),
  };
}

async function readOrCreateSnapshot(input: {
  userId: string;
  family: SnapshotFamily;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  activities: SnapshotInput[];
  undatedActivityCount: number;
  missingRevisionDates: string[];
  creationCause: SnapshotCreationCause;
}): Promise<RunnerActivityFactSnapshot> {
  const windowInputs = input.activities.filter(
    (activity) => activity.localDate >= input.startDate && activity.localDate <= input.cutoffDate,
  );
  const inputFingerprint = fingerprintFor({
    inputs: windowInputs,
    undatedActivityCount: input.undatedActivityCount,
    missingRevisionCount: input.missingRevisionDates.filter(
      (date) => date >= input.startDate && date <= input.cutoffDate,
    ).length,
  });
  const supabase = createAdminSupabaseClient();
  const existing = await supabase
    .from("runner_activity_fact_snapshots")
    .select("*")
    .eq("user_id", input.userId)
    .eq("snapshot_family", input.family)
    .eq("window_start", input.startDate)
    .eq("window_end", input.endDate)
    .eq("cutoff_date", input.cutoffDate)
    .eq("formula_version", RUNNER_ACTIVITY_FACTS_FORMULA_VERSION)
    .eq("input_fingerprint_sha256", inputFingerprint)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return snapshotFromRow(existing.data);

  const payload = calculateSnapshotPayload(
    windowInputs,
    input.undatedActivityCount,
    input.missingRevisionDates.filter((date) => date >= input.startDate && date <= input.cutoffDate)
      .length,
  );
  const inserted = await supabase
    .from("runner_activity_fact_snapshots")
    .insert({
      user_id: input.userId,
      snapshot_family: input.family,
      window_start: input.startDate,
      window_end: input.endDate,
      cutoff_date: input.cutoffDate,
      window_timezone_basis: "historical_local_date",
      input_fingerprint_sha256: inputFingerprint,
      formula_version: RUNNER_ACTIVITY_FACTS_FORMULA_VERSION,
      calculation_status: "current",
      facts: payload.facts as unknown as Json,
      input_activity_revisions: windowInputs.map((activity) => ({
        activity_id: activity.activityId,
        activity_revision_id: activity.activityRevisionId,
        normalizer_version: activity.normalizerVersion,
      })) as unknown as Json,
      exclusions: payload.evidence.exclusions as unknown as Json,
      missing_field_reasons: payload.evidence.missingFieldReasons as unknown as Json,
      creation_cause: input.creationCause,
    })
    .select("*")
    .single();
  if (!inserted.error) return snapshotFromRow(inserted.data);
  if (inserted.error.code !== "23505") throw new Error(inserted.error.message);

  const concurrent = await supabase
    .from("runner_activity_fact_snapshots")
    .select("*")
    .eq("user_id", input.userId)
    .eq("snapshot_family", input.family)
    .eq("window_start", input.startDate)
    .eq("window_end", input.endDate)
    .eq("cutoff_date", input.cutoffDate)
    .eq("formula_version", RUNNER_ACTIVITY_FACTS_FORMULA_VERSION)
    .eq("input_fingerprint_sha256", inputFingerprint)
    .single();
  if (concurrent.error) throw new Error(concurrent.error.message);
  return snapshotFromRow(concurrent.data);
}

function calculateSnapshotPayload(
  inputs: SnapshotInput[],
  undatedActivityCount: number,
  missingRevisionCount: number,
) {
  const durationInputs = inputs.filter(
    (activity): activity is SnapshotInput & { timerDurationMin: number } =>
      activity.timerDurationMin != null,
  );
  const distanceInputs = inputs.filter(
    (activity): activity is SnapshotInput & { distanceKm: number } => activity.distanceKm != null,
  );
  const elevationInputs = inputs.filter(
    (activity): activity is SnapshotInput & { elevationGainM: number } =>
      activity.elevationGainM != null,
  );
  const longestDistance = maxBy(distanceInputs, (activity) => activity.distanceKm);
  const longestDuration = maxBy(durationInputs, (activity) => activity.timerDurationMin);
  const noActivities = inputs.length === 0;
  const missingFieldReasons = [
    missingFieldReason("timer_duration", "not_observed", inputs.length - durationInputs.length),
    missingFieldReason("distance", "not_observed", inputs.length - distanceInputs.length),
    missingFieldReason("elevation_gain", "not_observed", inputs.length - elevationInputs.length),
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));
  const exclusions = [
    undatedActivityCount
      ? { reason: "missing_historical_local_date", count: undatedActivityCount }
      : null,
    missingRevisionCount
      ? { reason: "missing_current_activity_revision", count: missingRevisionCount }
      : null,
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));

  return {
    facts: {
      sessions: noActivities
        ? unavailableMetric("sessions", "no_recorded_activities")
        : availableMetric({
            value: inputs.length,
            unit: "sessions",
            includedCount: inputs.length,
            missingCount: 0,
          }),
      runningTime: aggregateMetric({
        values: durationInputs,
        value: durationInputs.reduce((total, activity) => total + activity.timerDurationMin, 0),
        unit: "minutes",
        totalActivities: inputs.length,
        missingReason: "timer_duration_not_observed",
      }),
      distance: aggregateMetric({
        values: distanceInputs,
        value: distanceInputs.reduce((total, activity) => total + activity.distanceKm, 0),
        unit: "kilometers",
        totalActivities: inputs.length,
        missingReason: "distance_not_observed",
      }),
      elevationGain: aggregateMetric({
        values: elevationInputs,
        value: elevationInputs.reduce((total, activity) => total + activity.elevationGainM, 0),
        unit: "meters",
        totalActivities: inputs.length,
        missingReason: "elevation_gain_not_observed",
      }),
      longestDistance: longestMetric({
        activity: longestDistance,
        value: longestDistance?.distanceKm ?? null,
        unit: "kilometers",
        totalActivities: inputs.length,
        observedCount: distanceInputs.length,
        missingReason: "distance_not_observed",
      }),
      longestDuration: longestMetric({
        activity: longestDuration,
        value: longestDuration?.timerDurationMin ?? null,
        unit: "minutes",
        totalActivities: inputs.length,
        observedCount: durationInputs.length,
        missingReason: "timer_duration_not_observed",
      }),
    },
    evidence: {
      activityRevisionIds: inputs.map((activity) => activity.activityRevisionId).sort(),
      normalizerVersions: Array.from(
        new Set(inputs.map((activity) => activity.normalizerVersion)),
      ).sort(),
      eligibleActivityCount: inputs.length,
      excludedActivityCount: undatedActivityCount + missingRevisionCount,
      exclusions,
      missingFieldReasons,
    },
  };
}

function snapshotFromRow(row: {
  calculation_status: string;
  cutoff_date: string;
  created_at: string;
  creation_cause: string;
  exclusions: Json;
  facts: Json;
  formula_version: string;
  id: string;
  input_activity_revisions: Json;
  missing_field_reasons: Json;
  snapshot_family: string;
  window_end: string;
  window_start: string;
  window_timezone_basis: string;
}): RunnerActivityFactSnapshot {
  if (
    row.calculation_status !== "current" ||
    (row.snapshot_family !== "calendar_week" && row.snapshot_family !== "rolling_28_day") ||
    row.window_timezone_basis !== "historical_local_date"
  ) {
    throw new Error("Runner activity fact snapshot metadata is invalid.");
  }
  const inputRefs = z
    .array(
      z.object({
        activity_id: z.string(),
        activity_revision_id: z.string(),
        normalizer_version: z.string(),
      }),
    )
    .parse(row.input_activity_revisions);
  const facts = snapshotPayloadSchema.shape.facts.parse(row.facts);
  const exclusions = snapshotPayloadSchema.shape.evidence.shape.exclusions.parse(row.exclusions);
  const missingFieldReasons = snapshotPayloadSchema.shape.evidence.shape.missingFieldReasons.parse(
    row.missing_field_reasons,
  );
  return {
    id: row.id,
    status: "current",
    family: row.snapshot_family,
    window: {
      startDate: row.window_start,
      endDate: row.window_end,
      cutoffDate: row.cutoff_date,
      timezoneBasis: "historical_local_date",
      weekStartsOn: "monday",
    },
    formulaVersion: row.formula_version,
    creationCause: parseCreationCause(row.creation_cause),
    createdAt: row.created_at,
    facts,
    evidence: {
      activityRevisionIds: inputRefs.map((value) => value.activity_revision_id),
      normalizerVersions: Array.from(
        new Set(inputRefs.map((value) => value.normalizer_version)),
      ).sort(),
      eligibleActivityCount: facts.sessions.value ?? 0,
      excludedActivityCount: exclusions.reduce((total, value) => total + value.count, 0),
      exclusions,
      missingFieldReasons,
    },
  };
}

function aggregateMetric(input: {
  values: SnapshotInput[];
  value: number;
  unit: RunnerActivityFactMetric["unit"];
  totalActivities: number;
  missingReason: string;
}): RunnerActivityFactMetric {
  if (input.values.length === 0) return unavailableMetric(input.unit, input.missingReason);
  return availableMetric({
    value: roundMetric(input.value),
    unit: input.unit,
    includedCount: input.values.length,
    missingCount: input.totalActivities - input.values.length,
    missingReason: input.missingReason,
  });
}

function longestMetric(input: {
  activity: SnapshotInput | null;
  value: number | null;
  unit: RunnerActivityFactMetric["unit"];
  totalActivities: number;
  observedCount: number;
  missingReason: string;
}): RunnerActivityFactMetric {
  if (!input.activity || input.value == null) {
    return unavailableMetric(input.unit, input.missingReason);
  }
  return availableMetric({
    value: roundMetric(input.value),
    unit: input.unit,
    includedCount: input.observedCount,
    missingCount: input.totalActivities - input.observedCount,
    missingReason: input.missingReason,
    activity: input.activity,
  });
}

function availableMetric(input: {
  value: number;
  unit: RunnerActivityFactMetric["unit"];
  includedCount: number;
  missingCount: number;
  missingReason?: string;
  activity?: SnapshotInput;
}): RunnerActivityFactMetric {
  return {
    availability: "available",
    confidence: input.missingCount === 0 ? "complete" : "partial",
    value: input.value,
    unit: input.unit,
    includedActivityCount: input.includedCount,
    missingActivityCount: input.missingCount,
    missingReasons: input.missingCount && input.missingReason ? [input.missingReason] : [],
    activityId: input.activity?.activityId ?? null,
    activityRevisionId: input.activity?.activityRevisionId ?? null,
  };
}

function unavailableMetric(
  unit: RunnerActivityFactMetric["unit"],
  reason: string,
): RunnerActivityFactMetric {
  return {
    availability: "unavailable",
    confidence: "unavailable",
    value: null,
    unit,
    includedActivityCount: 0,
    missingActivityCount: 0,
    missingReasons: [reason],
    activityId: null,
    activityRevisionId: null,
  };
}

function observedElevationGain(revision: RevisionRow) {
  const summary = objectValue(revision.normalized_summary);
  const provenance = objectValue(revision.field_provenance);
  const value = summary?.total_ascent_m;
  return typeof value === "number" && Number.isFinite(value) && provenance?.total_ascent_m
    ? value
    : null;
}

function objectValue(value: Json): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : null;
}

function fingerprintFor(input: {
  inputs: SnapshotInput[];
  undatedActivityCount: number;
  missingRevisionCount: number;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        revisions: input.inputs
          .map((activity) => [activity.activityId, activity.activityRevisionId])
          .sort(([left], [right]) => left.localeCompare(right)),
        undatedActivityCount: input.undatedActivityCount,
        missingRevisionCount: input.missingRevisionCount,
      }),
    )
    .digest("hex");
}

function missingFieldReason(field: string, reason: string, count: number) {
  return count > 0 ? { field, reason, count } : null;
}

function maxBy<T>(values: T[], readValue: (value: T) => number): T | null {
  return values.reduce<T | null>(
    (current, value) => (!current || readValue(value) > readValue(current) ? value : current),
    null,
  );
}

function roundMetric(value: number) {
  return Math.round(value * 1000) / 1000;
}

function parseCreationCause(value: string): SnapshotCreationCause {
  if (
    value === "read_reconciliation" ||
    value === "ingestion" ||
    value === "backfill" ||
    value === "source_removal" ||
    value === "activity_delete" ||
    value === "correction"
  ) {
    return value;
  }
  throw new Error("Runner activity fact snapshot has an invalid creation cause.");
}
