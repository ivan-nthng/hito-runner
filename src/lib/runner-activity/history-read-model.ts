import "@tanstack/react-start/server-only";

import { z } from "zod";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type {
  RunnerActivityDurationBasis,
  RunnerActivityHistoryItem,
  RunnerActivityHistoryPage,
} from "@/lib/runner-activity/read-model-types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const historyCursorSchema = z.object({
  version: z.literal(1),
  sortDate: z.string().date(),
  sortStartedAt: z.string().datetime({ offset: true }),
  activityId: z.string().uuid(),
});

type HistoryCursor = z.infer<typeof historyCursorSchema>;

type ActivityRevisionRow = {
  activity_id: string;
  field_provenance: Json;
  id: string;
  normalized_summary: Json;
  normalizer_version: string;
};

type ActivitySourceRow = {
  activity_id: string;
  current_revision_id: string | null;
  source_kind: string;
};

type SourceRevisionRow = {
  id: string;
  raw_state: string;
};

type PlannedMatchRow = {
  activity_id: string;
  planned_workout_id: string | null;
};

type PlannedWorkoutRow = {
  id: string;
  title: string;
  workout_date: string;
};

export async function listRunnerActivityHistoryForUser(input: {
  userId: string;
  cursor?: string | null;
  pageSize?: number;
}): Promise<RunnerActivityHistoryPage> {
  const pageSize = normalizePageSize(input.pageSize);
  const cursor = decodeHistoryCursor(input.cursor);
  const supabase = createAdminSupabaseClient();
  const page = await supabase.rpc("list_runner_activity_history_page", {
    p_user_id: input.userId,
    p_page_size: pageSize + 1,
    p_cursor_sort_date: cursor?.sortDate,
    p_cursor_sort_started_at: cursor?.sortStartedAt,
    p_cursor_activity_id: cursor?.activityId,
  });
  if (page.error) throw new Error(page.error.message);

  const rows = page.data ?? [];
  const visibleRows = rows.slice(0, pageSize);
  const activityIds = visibleRows.map((row) => row.activity_id);
  if (activityIds.length === 0) return { items: [], nextCursor: null };

  const revisionIds = visibleRows
    .map((row) => row.current_revision_id)
    .filter((id): id is string => Boolean(id));
  const [revisions, sources, matches] = await Promise.all([
    supabase
      .from("runner_activity_revisions")
      .select("id, activity_id, normalized_summary, field_provenance, normalizer_version")
      .eq("user_id", input.userId)
      .in("id", revisionIds),
    supabase
      .from("runner_activity_sources")
      .select("activity_id, current_revision_id, source_kind")
      .eq("user_id", input.userId)
      .in("activity_id", activityIds),
    supabase
      .from("runner_activity_planned_workout_matches")
      .select("activity_id, planned_workout_id")
      .eq("user_id", input.userId)
      .in("activity_id", activityIds),
  ]);
  if (revisions.error) throw new Error(revisions.error.message);
  if (sources.error) throw new Error(sources.error.message);
  if (matches.error) throw new Error(matches.error.message);

  const sourceRevisionIds = (sources.data ?? [])
    .map((row) => row.current_revision_id)
    .filter((id): id is string => Boolean(id));
  const sourceRevisions = await supabase
    .from("runner_activity_source_revisions")
    .select("id, raw_state")
    .eq("user_id", input.userId)
    .in("id", sourceRevisionIds);
  if (sourceRevisions.error) throw new Error(sourceRevisions.error.message);

  const plannedWorkoutIds = (matches.data ?? [])
    .map((row) => row.planned_workout_id)
    .filter((id): id is string => Boolean(id));
  const plannedWorkouts = plannedWorkoutIds.length
    ? await supabase
        .from("planned_workouts")
        .select("id, title, workout_date")
        .eq("user_id", input.userId)
        .in("id", plannedWorkoutIds)
    : { data: [] as PlannedWorkoutRow[], error: null };
  if (plannedWorkouts.error) throw new Error(plannedWorkouts.error.message);

  const revisionById = new Map(
    ((revisions.data ?? []) as ActivityRevisionRow[]).map((row) => [row.id, row]),
  );
  const sourceByActivityId = new Map(
    ((sources.data ?? []) as ActivitySourceRow[]).map((row) => [row.activity_id, row]),
  );
  const sourceRevisionById = new Map(
    ((sourceRevisions.data ?? []) as SourceRevisionRow[]).map((row) => [row.id, row]),
  );
  const matchByActivityId = new Map(
    ((matches.data ?? []) as PlannedMatchRow[]).map((row) => [row.activity_id, row]),
  );
  const plannedWorkoutById = new Map(
    ((plannedWorkouts.data ?? []) as PlannedWorkoutRow[]).map((row) => [row.id, row]),
  );

  const items = visibleRows.map((row) => {
    if (!row.current_revision_id) {
      throw new Error("Canonical runner activity is missing its current revision.");
    }
    const revision = revisionById.get(row.current_revision_id);
    const source = sourceByActivityId.get(row.activity_id);
    const sourceRevision = source?.current_revision_id
      ? sourceRevisionById.get(source.current_revision_id)
      : null;
    if (!revision || source?.source_kind !== "manual_garmin_fit" || !sourceRevision) {
      throw new Error("Canonical runner activity readback is incomplete.");
    }

    const match = matchByActivityId.get(row.activity_id);
    const plannedWorkout = match?.planned_workout_id
      ? plannedWorkoutById.get(match.planned_workout_id)
      : null;
    return buildHistoryItem({
      row,
      revision,
      rawState: parseRawState(sourceRevision.raw_state),
      plannedWorkout: plannedWorkout ?? null,
    });
  });

  const lastVisibleRow = visibleRows.at(-1);
  return {
    items,
    nextCursor:
      rows.length > pageSize && lastVisibleRow
        ? encodeHistoryCursor({
            version: 1,
            sortDate: lastVisibleRow.sort_date,
            sortStartedAt: lastVisibleRow.sort_started_at,
            activityId: lastVisibleRow.activity_id,
          })
        : null,
  };
}

function buildHistoryItem(input: {
  row: {
    activity_id: string;
    created_at: string;
    distance_km: number | null;
    elapsed_duration_min: number | null;
    historical_timezone: string | null;
    local_date: string | null;
    quality_state: string;
    started_at: string | null;
    timer_duration_min: number | null;
  };
  revision: ActivityRevisionRow;
  rawState: RunnerActivityHistoryItem["source"]["rawState"];
  plannedWorkout: PlannedWorkoutRow | null;
}): RunnerActivityHistoryItem {
  if (input.row.quality_state !== "accepted") {
    throw new Error("Unsupported runner activity quality state.");
  }
  const duration = activityDuration(input.row);
  const averageHeartRate = observedAverageHeartRate(input.revision);
  const dateBasis = input.row.local_date
    ? "historical_local"
    : input.row.started_at
      ? "started_at_utc"
      : "recorded_at";

  return {
    id: input.row.activity_id,
    identity: { label: "Run", sport: "run", recordingKind: "recorded" },
    historicalTime: {
      localDate: input.row.local_date,
      startedAt: input.row.started_at,
      timezone: input.row.historical_timezone,
      dateBasis,
    },
    distanceKm: input.row.distance_km,
    duration,
    pace:
      duration && input.row.distance_km && input.row.distance_km > 0
        ? {
            secondsPerKm: Math.round((duration.minutes * 60) / input.row.distance_km),
            basis: duration.basis,
            provenance: "derived_from_observed_distance_and_duration",
          }
        : null,
    observedHeartRate:
      averageHeartRate == null
        ? null
        : { averageBpm: averageHeartRate, provenance: "observed_manual_garmin_fit" },
    plannedWorkout: input.plannedWorkout
      ? {
          id: input.plannedWorkout.id,
          title: input.plannedWorkout.title,
          workoutDate: input.plannedWorkout.workout_date,
        }
      : null,
    calendarState: input.plannedWorkout ? "confirmed" : "saved_unassigned",
    source: {
      kind: "manual_garmin_fit",
      rawState: input.rawState,
      originalRetained: input.rawState === "available",
      reprocessingAvailable: input.rawState === "available",
    },
    quality: { state: "accepted", updating: false },
    capabilities: {
      canRemoveOriginalFile: input.rawState !== "removed",
      canDeleteActivity: true,
      canResume: true,
    },
    provenance: {
      activityRevisionId: input.revision.id,
      normalizerVersion: input.revision.normalizer_version,
    },
  };
}

function activityDuration(input: {
  timer_duration_min: number | null;
  elapsed_duration_min: number | null;
}): { minutes: number; basis: RunnerActivityDurationBasis } | null {
  if (input.timer_duration_min != null) {
    return { minutes: input.timer_duration_min, basis: "timer" };
  }
  if (input.elapsed_duration_min != null) {
    return { minutes: input.elapsed_duration_min, basis: "elapsed" };
  }
  return null;
}

function observedAverageHeartRate(revision: ActivityRevisionRow) {
  const summary = objectValue(revision.normalized_summary);
  const provenance = objectValue(revision.field_provenance);
  const value = summary?.avg_heart_rate;
  return typeof value === "number" && Number.isFinite(value) && provenance?.avg_heart_rate
    ? value
    : null;
}

function objectValue(value: Json): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : null;
}

function normalizePageSize(value: number | undefined) {
  if (value == null) return DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(value) || value < 1 || value > MAX_PAGE_SIZE) {
    throw new Error(`Activity history page size must be between 1 and ${MAX_PAGE_SIZE}.`);
  }
  return value;
}

function encodeHistoryCursor(cursor: HistoryCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeHistoryCursor(value: string | null | undefined): HistoryCursor | null {
  if (!value) return null;
  try {
    return historyCursorSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
  } catch {
    throw new Error("Activity history cursor is invalid or expired.");
  }
}

function parseRawState(value: string): RunnerActivityHistoryItem["source"]["rawState"] {
  if (value === "available" || value === "removal_pending" || value === "removed") return value;
  throw new Error("Canonical runner activity source has an unsupported raw state.");
}
