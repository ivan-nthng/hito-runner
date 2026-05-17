import "@tanstack/react-start/server-only";

import { parseBodyNotesValue } from "@/lib/body-notes";
import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  addDaysIso,
  todayIso,
  workoutDistanceKm,
  workoutDuration,
  type Step,
} from "@/lib/training";
import {
  resolveWeekdayRestInvariant,
  type WeekdayRestInvariant,
} from "@/lib/weekday-rest-invariants";
import type { WorkoutComparisonDifferencePayload } from "@/lib/workout-result-import/types";

type RunnerProfileRow = Database["public"]["Tables"]["runner_profiles"]["Row"];
type PlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type WorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];
type WorkoutActualMetricsRow = Database["public"]["Tables"]["workout_actual_metrics"]["Row"];
type WorkoutComparisonRow = Database["public"]["Tables"]["workout_comparisons"]["Row"];

const RECENT_LOOKBACK_DAYS = 56;
const MAX_RECENT_WORKOUTS = 18;
const MAX_REMAINING_WORKOUTS = 42;
const MAX_COMPARISON_SIGNALS = 8;
const MAX_BODY_NOTE_CONTEXT = 8;

export interface RunnerCoachContext {
  schemaVersion: "runner-coach-context-v1";
  generatedAt: string;
  today: string;
  runner: {
    userId: string;
    displayName: string | null;
    goalType: RunnerProfileRow["goal_type"] | null;
    goalLabel: string | null;
    baselineSessionsPerWeek: number | null;
    baselineLongRunKm: number | null;
    baselineNotes: string | null;
  };
  activePlan: {
    id: string;
    title: string;
    goalSummary: string;
    sourceKind: string | null;
    sourceTemplate: string;
    schemaVersion: string;
    startDate: string;
    endDate: string;
    targetDate: string | null;
    updatedAt: string;
  } | null;
  weekdayRestInvariant: WeekdayRestInvariant;
  refreshBoundary: {
    target: "remaining_active_schedule_only";
    firstMutableDate: string | null;
    lastMutableDate: string | null;
    pastAndLoggedHistoryIsFixed: true;
    requiresExplicitApply: true;
  };
  remainingActiveSchedule: CoachWorkoutSummary[];
  recentWorkoutHistory: CoachWorkoutHistorySummary[];
  recentAdherence: {
    lookbackDays: number;
    plannedNonRestCount: number;
    completedCount: number;
    partialCount: number;
    skippedCount: number;
    unloggedPastNonRestCount: number;
  };
  recentActualLoad: {
    loggedWorkoutCount: number;
    totalDurationMin: number;
    totalDistanceKm: number;
    garminActivityCount: number;
  };
  recentComparisonSignals: CoachComparisonSignalSummary[];
  bodyNoteCautions: CoachBodyNoteCaution[];
}

export interface CoachWorkoutSummary {
  id: string;
  date: string;
  title: string;
  workoutType: PlannedWorkoutRow["workout_type"];
  phase: string;
  weekNumber: number;
  plannedDurationMin: number;
  plannedDistanceKm: number | null;
  stepCount: number;
  notes: string | null;
}

export interface CoachWorkoutHistorySummary extends CoachWorkoutSummary {
  outcome: WorkoutLogRow["outcome"] | "unlogged";
  actualDurationMin: number | null;
  actualDistanceKm: number | null;
  rpe: number | null;
  hasBodyNotes: boolean;
  hasGarminActual: boolean;
  logUpdatedAt: string | null;
}

export interface CoachComparisonSignalSummary {
  workoutId: string;
  date: string;
  title: string;
  completionState: WorkoutComparisonRow["completion_state"];
  comparisonStatus: WorkoutComparisonRow["comparison_status"];
  comparisonConfidence: number;
  comparedSignals: Array<{
    key: string;
    status: string;
    plannedValue: string | number | null;
    actualValue: string | number | null;
    delta: number | null;
  }>;
}

export interface CoachBodyNoteCaution {
  workoutId: string;
  date: string;
  title: string;
  maxSeverity: number;
  notes: Array<{
    area: string;
    timing: string;
    sensation: string | null;
    severity: number;
    note: string | null;
  }>;
}

export interface BuildRunnerCoachContextOptions {
  userId: string;
  today?: string;
  lookbackDays?: number;
}

export async function buildRunnerCoachContext({
  userId,
  today = todayIso(),
  lookbackDays = RECENT_LOOKBACK_DAYS,
}: BuildRunnerCoachContextOptions): Promise<RunnerCoachContext> {
  const supabase = createAdminSupabaseClient();
  const lookbackStart = addDaysIso(today, -lookbackDays);

  const [profileResult, activePlanResult, recentWorkoutsResult] = await Promise.all([
    supabase.from("runner_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("plan_cycles")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("planned_workouts")
      .select("*")
      .eq("user_id", userId)
      .gte("workout_date", lookbackStart)
      .order("workout_date", { ascending: true })
      .order("display_order", { ascending: true })
      .limit(160),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);
  if (activePlanResult.error) throw new Error(activePlanResult.error.message);
  if (recentWorkoutsResult.error) throw new Error(recentWorkoutsResult.error.message);

  const activePlan = activePlanResult.data;
  const activePlanWorkouts = activePlan
    ? await fetchActivePlanWorkouts(activePlan.id, userId)
    : ([] as PlannedWorkoutRow[]);
  const workoutRows = mergeWorkoutRows(recentWorkoutsResult.data ?? [], activePlanWorkouts);
  const workoutIds = workoutRows.map((workout) => workout.id);
  const [logsByWorkoutId, actualMetricsByWorkoutId, comparisonsByWorkoutId] =
    await fetchWorkoutEvidenceMaps(userId, workoutIds);

  const remainingActiveSchedule = activePlanWorkouts
    .filter((workout) => workout.workout_date >= today)
    .slice(0, MAX_REMAINING_WORKOUTS)
    .map(plannedWorkoutToCoachSummary);
  const recentWorkoutHistory = workoutRows
    .filter((workout) => workout.workout_date >= lookbackStart && workout.workout_date <= today)
    .slice(-MAX_RECENT_WORKOUTS)
    .map((workout) =>
      plannedWorkoutToHistorySummary(
        workout,
        logsByWorkoutId.get(workout.id) ?? null,
        actualMetricsByWorkoutId.get(workout.id) ?? null,
      ),
    );

  return {
    schemaVersion: "runner-coach-context-v1",
    generatedAt: new Date().toISOString(),
    today,
    runner: profileToCoachRunner(userId, profileResult.data ?? null),
    activePlan: activePlan ? activePlanToCoachSummary(activePlan) : null,
    refreshBoundary: {
      target: "remaining_active_schedule_only",
      firstMutableDate: remainingActiveSchedule[0]?.date ?? null,
      lastMutableDate: remainingActiveSchedule.at(-1)?.date ?? null,
      pastAndLoggedHistoryIsFixed: true,
      requiresExplicitApply: true,
    },
    remainingActiveSchedule,
    weekdayRestInvariant: resolveWeekdayRestInvariant({
      runnerPreferences: profileResult.data,
      activePlanPreferences: activePlan?.plan_preferences ?? null,
    }),
    recentWorkoutHistory,
    recentAdherence: buildRecentAdherence(recentWorkoutHistory, today, lookbackDays),
    recentActualLoad: buildRecentActualLoad(recentWorkoutHistory, actualMetricsByWorkoutId),
    recentComparisonSignals: buildRecentComparisonSignals(
      recentWorkoutHistory,
      comparisonsByWorkoutId,
    ),
    bodyNoteCautions: buildBodyNoteCautions(recentWorkoutHistory, logsByWorkoutId),
  };
}

async function fetchActivePlanWorkouts(planCycleId: string, userId: string) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_cycle_id", planCycleId)
    .eq("user_id", userId)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

async function fetchWorkoutEvidenceMaps(userId: string, workoutIds: string[]) {
  if (!workoutIds.length) {
    return [
      new Map<string, WorkoutLogRow>(),
      new Map<string, WorkoutActualMetricsRow>(),
      new Map<string, WorkoutComparisonRow>(),
    ] as const;
  }

  const supabase = createAdminSupabaseClient();
  const [logsResult, actualMetricsResult, comparisonsResult] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_actual_metrics")
      .select("*")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds)
      .neq("status", "superseded")
      .order("created_at", { ascending: false }),
    supabase
      .from("workout_comparisons")
      .select("*")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds)
      .order("created_at", { ascending: false }),
  ]);

  if (logsResult.error) throw new Error(logsResult.error.message);
  if (actualMetricsResult.error) throw new Error(actualMetricsResult.error.message);
  if (comparisonsResult.error) throw new Error(comparisonsResult.error.message);

  return [
    firstByWorkoutId(logsResult.data ?? []),
    firstByWorkoutId(actualMetricsResult.data ?? []),
    firstByWorkoutId(comparisonsResult.data ?? []),
  ] as const;
}

function mergeWorkoutRows(primary: PlannedWorkoutRow[], activePlanWorkouts: PlannedWorkoutRow[]) {
  const byId = new Map<string, PlannedWorkoutRow>();

  for (const workout of [...primary, ...activePlanWorkouts]) {
    byId.set(workout.id, workout);
  }

  return [...byId.values()].sort((a, b) =>
    a.workout_date === b.workout_date
      ? a.display_order - b.display_order
      : a.workout_date.localeCompare(b.workout_date),
  );
}

function firstByWorkoutId<
  Row extends { planned_workout_id: string; created_at?: string; logged_at?: string },
>(rows: Row[]) {
  const byWorkoutId = new Map<string, Row>();

  for (const row of rows) {
    if (!byWorkoutId.has(row.planned_workout_id)) {
      byWorkoutId.set(row.planned_workout_id, row);
    }
  }

  return byWorkoutId;
}

function profileToCoachRunner(userId: string, profile: RunnerProfileRow | null) {
  return {
    userId,
    displayName: profile?.display_name ?? profile?.first_name ?? null,
    goalType: profile?.goal_type ?? null,
    goalLabel: profile?.goal_label ?? null,
    baselineSessionsPerWeek: profile?.baseline_sessions_per_week ?? null,
    baselineLongRunKm: profile?.baseline_long_run_km ?? null,
    baselineNotes: profile?.baseline_notes ?? null,
  };
}

function activePlanToCoachSummary(plan: PlanCycleRow) {
  return {
    id: plan.id,
    title: plan.title,
    goalSummary: plan.goal_summary,
    sourceKind: plan.source_kind,
    sourceTemplate: plan.source_template,
    schemaVersion: plan.schema_version,
    startDate: plan.start_date,
    endDate: plan.end_date,
    targetDate: plan.target_date,
    updatedAt: plan.updated_at,
  };
}

function plannedWorkoutToCoachSummary(workout: PlannedWorkoutRow): CoachWorkoutSummary {
  const steps = parseSteps(workout.steps);

  return {
    id: workout.id,
    date: workout.workout_date,
    title: workout.title,
    workoutType: workout.workout_type,
    phase: workout.phase,
    weekNumber: workout.week_number,
    plannedDurationMin: workoutDuration({ steps, type: workout.workout_type }),
    plannedDistanceKm: workoutDistanceKm({ steps, type: workout.workout_type }),
    stepCount: steps.length,
    notes: workout.notes,
  };
}

function plannedWorkoutToHistorySummary(
  workout: PlannedWorkoutRow,
  log: WorkoutLogRow | null,
  actualMetrics: WorkoutActualMetricsRow | null,
): CoachWorkoutHistorySummary {
  return {
    ...plannedWorkoutToCoachSummary(workout),
    outcome: log?.outcome ?? "unlogged",
    actualDurationMin: log?.actual_duration_min ?? actualMetrics?.actual_duration_min ?? null,
    actualDistanceKm: log?.actual_distance_km ?? actualMetrics?.actual_distance_km ?? null,
    rpe: log?.rpe ?? null,
    hasBodyNotes: parseBodyNotesValue(log?.body_notes).length > 0,
    hasGarminActual: Boolean(actualMetrics),
    logUpdatedAt: log?.updated_at ?? null,
  };
}

function buildRecentAdherence(
  history: CoachWorkoutHistorySummary[],
  today: string,
  lookbackDays: number,
) {
  const pastNonRest = history.filter(
    (workout) => workout.workoutType !== "rest" && workout.date <= today,
  );

  return {
    lookbackDays,
    plannedNonRestCount: pastNonRest.length,
    completedCount: pastNonRest.filter((workout) => workout.outcome === "completed").length,
    partialCount: pastNonRest.filter((workout) => workout.outcome === "partial").length,
    skippedCount: pastNonRest.filter((workout) => workout.outcome === "skipped").length,
    unloggedPastNonRestCount: pastNonRest.filter((workout) => workout.outcome === "unlogged")
      .length,
  };
}

function buildRecentActualLoad(
  history: CoachWorkoutHistorySummary[],
  actualMetricsByWorkoutId: Map<string, WorkoutActualMetricsRow>,
) {
  return {
    loggedWorkoutCount: history.filter((workout) => workout.outcome !== "unlogged").length,
    totalDurationMin: roundOne(
      history.reduce((total, workout) => total + (workout.actualDurationMin ?? 0), 0),
    ),
    totalDistanceKm: roundOne(
      history.reduce((total, workout) => total + (workout.actualDistanceKm ?? 0), 0),
    ),
    garminActivityCount: [...actualMetricsByWorkoutId.values()].length,
  };
}

function buildRecentComparisonSignals(
  history: CoachWorkoutHistorySummary[],
  comparisonsByWorkoutId: Map<string, WorkoutComparisonRow>,
) {
  return history
    .flatMap((workout) => {
      const comparison = comparisonsByWorkoutId.get(workout.id);
      if (!comparison) return [];

      const differencePayload =
        comparison.difference_payload as unknown as WorkoutComparisonDifferencePayload;

      return [
        {
          workoutId: workout.id,
          date: workout.date,
          title: workout.title,
          completionState: comparison.completion_state,
          comparisonStatus: comparison.comparison_status,
          comparisonConfidence: comparison.comparison_confidence,
          comparedSignals: differencePayload.signals
            .filter((signal) => signal.status !== "not_applicable")
            .slice(0, 4)
            .map((signal) => ({
              key: signal.key,
              status: signal.status,
              plannedValue: signal.plannedValue ?? null,
              actualValue: signal.actualValue ?? null,
              delta: signal.delta ?? null,
            })),
        },
      ];
    })
    .slice(-MAX_COMPARISON_SIGNALS);
}

function buildBodyNoteCautions(
  history: CoachWorkoutHistorySummary[],
  logsByWorkoutId: Map<string, WorkoutLogRow>,
) {
  return history
    .flatMap((workout) => {
      const notes = parseBodyNotesValue(logsByWorkoutId.get(workout.id)?.body_notes);
      if (!notes.length) return [];

      return [
        {
          workoutId: workout.id,
          date: workout.date,
          title: workout.title,
          maxSeverity: Math.max(...notes.map((note) => note.severity)),
          notes: notes.map((note) => ({
            area: note.area,
            timing: note.timing,
            sensation: note.sensation,
            severity: note.severity,
            note: note.note ? trimText(note.note, 180) : null,
          })),
        },
      ];
    })
    .slice(-MAX_BODY_NOTE_CONTEXT);
}

function parseSteps(value: unknown): Step[] {
  return Array.isArray(value) ? (value as Step[]) : [];
}

function trimText(value: string, maxLength: number) {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3).trim()}...`;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}
