import "@tanstack/react-start/server-only";

import { digestSha256Hex } from "@/lib/review-token-signing";
import { getSourcePlanProvenancesForUser } from "@/lib/source-plan-provenance-persistence";
import type { SourcePlanProvenanceRow } from "@/lib/source-plan-provenance-persistence";
import { collectRowsForIdBatches } from "@/lib/supabase/batched-in-filter";
import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
export type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];
export type PersistedRunnerProfileRow = Database["public"]["Tables"]["runner_profiles"]["Row"];

export type CalendarWorkoutContext = {
  sourcePlansById: Map<string, SourcePlanProvenanceRow>;
  existingWorkouts: {
    workouts: PersistedPlannedWorkoutRow[];
    logsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  };
};

export interface ContinuationCalendarWorkoutOutcome {
  calendarWorkoutId: string;
  workoutDate: string;
  workoutType: string;
  outcome: "completed" | "partial" | "skipped" | "unresolved";
  outcomeRevision: string;
  sessionRpe: number | null;
  lifecycleState: "scheduled" | "moved" | "edited" | "removed";
  workoutFingerprint: string;
}

export interface ContinuationCalendarOutcomePacket {
  asOf: string;
  cutoffDate: string;
  calendarOutcomeFingerprint: string;
  workouts: ContinuationCalendarWorkoutOutcome[];
}

export interface ContinuationCalendarOccupancyPacket {
  intervalStartDate: string;
  intervalEndDate: string;
  calendarOccupancyFingerprint: string;
  occupiedDates: Array<{
    workoutDate: string;
    workoutFingerprint: string;
  }>;
}

export async function getCalendarWorkoutMutationContext(
  userId: string,
): Promise<CalendarWorkoutContext> {
  const existingWorkouts = await getCalendarWorkoutsWithLogsForUser(userId);

  return {
    sourcePlansById: await getSourcePlanProvenancesForUser(
      userId,
      existingWorkouts.workouts.map((workout) => workout.plan_cycle_id),
    ),
    existingWorkouts,
  };
}

export async function getCalendarWorkoutsWithLogsForUser(
  userId: string,
): Promise<CalendarWorkoutContext["existingWorkouts"]> {
  const supabase = createAdminSupabaseClient();
  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  const workouts = workoutsResult.data as PersistedPlannedWorkoutRow[];
  const workoutIds = workouts.map((workout) => workout.id);
  const logs = await collectRowsForIdBatches<PersistedWorkoutLogRow>(
    workoutIds,
    async (ids) => await supabase.from("workout_logs").select("*").in("planned_workout_id", ids),
  );

  return {
    workouts,
    logsByWorkoutId: new Map(logs.map((log) => [log.planned_workout_id, log])),
  };
}

export async function getRunnerProfileRowForUser(userId: string) {
  const profileResult = await createAdminSupabaseClient()
    .from("runner_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  return profileResult.data as PersistedRunnerProfileRow | null;
}

export async function getContinuationCalendarOutcomePacket(input: {
  userId: string;
  calendarWorkoutIds: readonly string[];
  asOf: string;
  cutoffDate: string;
}): Promise<ContinuationCalendarOutcomePacket> {
  const ids = Array.from(new Set(input.calendarWorkoutIds.filter(Boolean)));
  const supabase = createAdminSupabaseClient();
  const [workouts, logs, mutationEvents] = await Promise.all([
    collectRowsForIdBatches<PersistedPlannedWorkoutRow>(ids, async (batch) =>
      supabase.from("planned_workouts").select("*").eq("user_id", input.userId).in("id", batch),
    ),
    collectRowsForIdBatches<PersistedWorkoutLogRow>(ids, async (batch) =>
      supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", input.userId)
        .in("planned_workout_id", batch),
    ),
    collectRowsForIdBatches<
      Database["public"]["Tables"]["calendar_workout_mutation_events"]["Row"]
    >(ids, async (batch) =>
      supabase
        .from("calendar_workout_mutation_events")
        .select("*")
        .eq("user_id", input.userId)
        .in("planned_workout_id", batch)
        .order("id", { ascending: true }),
    ),
  ]);

  const workoutById = new Map(workouts.map((workout) => [workout.id, workout]));
  const logByWorkoutId = new Map(logs.map((log) => [log.planned_workout_id, log]));
  const eventsByWorkoutId = new Map<string, typeof mutationEvents>();
  for (const event of mutationEvents) {
    const existing = eventsByWorkoutId.get(event.planned_workout_id) ?? [];
    existing.push(event);
    eventsByWorkoutId.set(event.planned_workout_id, existing);
  }

  const packetWorkouts = await Promise.all(
    ids.map(async (calendarWorkoutId) => {
      const workout = workoutById.get(calendarWorkoutId) ?? null;
      const log = logByWorkoutId.get(calendarWorkoutId) ?? null;
      const events = eventsByWorkoutId.get(calendarWorkoutId) ?? [];
      const firstEvent = events.at(0) ?? null;
      const latestEvent = events.at(-1) ?? null;
      const workoutDate =
        workout?.workout_date ??
        latestEvent?.target_date ??
        latestEvent?.source_workout_date ??
        firstEvent?.target_date;
      if (!workoutDate) {
        throw new Error("A confirmed Calendar workout is missing its factual date lineage.");
      }
      const workoutType =
        workout?.workout_type ??
        readJsonString(latestEvent?.before_workout, "workout_type") ??
        readJsonString(firstEvent?.after_workout, "workout_type");
      if (!workoutType) {
        throw new Error("A confirmed Calendar workout is missing its factual workout type.");
      }
      const lifecycleState = !workout
        ? "removed"
        : events.some((event) => event.mutation_kind.includes("move"))
          ? "moved"
          : events.some((event) => event.mutation_kind.includes("edit"))
            ? "edited"
            : "scheduled";
      const outcome =
        log?.outcome === "completed" || log?.outcome === "partial" || log?.outcome === "skipped"
          ? log.outcome
          : "unresolved";
      const outcomeRevision = await stableSha256({
        outcome,
        rpe: log?.rpe ?? null,
        updatedAt: log?.updated_at ?? null,
      });
      return {
        calendarWorkoutId,
        workoutDate,
        workoutType,
        outcome,
        outcomeRevision,
        sessionRpe: log?.rpe ?? null,
        lifecycleState,
        workoutFingerprint: await stableSha256({
          workout,
          latestEventId: latestEvent?.id ?? null,
          latestMutationChecksum: latestEvent?.mutation_checksum ?? null,
        }),
      } satisfies ContinuationCalendarWorkoutOutcome;
    }),
  );

  const dueWorkouts = packetWorkouts.filter(
    (workout) => workout.workoutType !== "rest" && workout.workoutDate <= input.cutoffDate,
  );

  return {
    asOf: input.asOf,
    cutoffDate: input.cutoffDate,
    calendarOutcomeFingerprint: await stableSha256(dueWorkouts),
    workouts: dueWorkouts,
  };
}

export async function getContinuationCalendarOccupancyPacket(input: {
  userId: string;
  intervalStartDate: string;
  intervalEndDate: string;
}): Promise<ContinuationCalendarOccupancyPacket> {
  const result = await createAdminSupabaseClient()
    .from("planned_workouts")
    .select(
      "workout_date, steps, title, source_workout_id, workout_type, workout_family, workout_identity, created_at",
    )
    .eq("user_id", input.userId)
    .gte("workout_date", input.intervalStartDate)
    .lte("workout_date", input.intervalEndDate)
    .order("workout_date", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const occupiedDates = await Promise.all(
    result.data.map(async (workout) => ({
      workoutDate: workout.workout_date,
      workoutFingerprint: await stableSha256(workout),
    })),
  );
  return {
    intervalStartDate: input.intervalStartDate,
    intervalEndDate: input.intervalEndDate,
    calendarOccupancyFingerprint: await stableSha256(occupiedDates),
    occupiedDates,
  };
}

function stableSha256(value: unknown) {
  return digestSha256Hex(JSON.stringify(value));
}

function readJsonString(
  value:
    | Database["public"]["Tables"]["calendar_workout_mutation_events"]["Row"]["before_workout"]
    | undefined,
  key: string,
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const field = value[key];
  return typeof field === "string" ? field : null;
}
