import "@tanstack/react-start/server-only";

import type { Database } from "@/lib/supabase/database";
import { collectRowsForIdBatches } from "@/lib/supabase/batched-in-filter";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  addDaysIso,
  normalizeExecutableStepInstructions,
  startOfWeekIso,
  stepPlannedDistanceKm,
  workoutDistanceKm,
} from "@/lib/training";
import { readWorkoutDocumentSections } from "@/lib/workout-document";
import {
  getFitCompletedPlannedWorkoutIds,
  getLatestWorkoutResultFeedback,
} from "@/lib/workout-result-import/read-workout-result-feedback";
import type {
  WorkoutAiInsightSummary,
  WorkoutResultFeedbackSummary,
} from "@/lib/workout-result-import/types";

export type WorkoutSidebarPlannedWorkoutRow = Pick<
  Database["public"]["Tables"]["planned_workouts"]["Row"],
  "id" | "user_id" | "workout_date" | "workout_type" | "title" | "steps"
>;

export type WorkoutSidebarLogRow = Pick<
  Database["public"]["Tables"]["workout_logs"]["Row"],
  "planned_workout_id" | "user_id" | "outcome" | "actual_distance_km"
>;

export type WorkoutSidebarActualMetricsRow = Pick<
  Database["public"]["Tables"]["workout_actual_metrics"]["Row"],
  | "id"
  | "planned_workout_id"
  | "user_id"
  | "source_kind"
  | "status"
  | "actual_distance_km"
  | "created_at"
>;

export type WorkoutSidebarInsightCandidateRow = Pick<
  Database["public"]["Tables"]["workout_ai_insights"]["Row"],
  "id" | "user_id" | "planned_workout_id" | "status" | "created_at"
>;

export type WorkoutSidebarInsightWorkoutRow = Pick<
  Database["public"]["Tables"]["planned_workouts"]["Row"],
  "id" | "user_id" | "workout_date" | "title"
>;

export type WorkoutSidebarScheduledDistance =
  | {
      state: "available";
      kilometres: number;
      basis: "explicit_prescriptions" | "includes_duration_estimates";
      estimatedWorkoutCount: number;
    }
  | {
      state: "unavailable";
      kilometres: null;
      reason: "scheduled_distance_missing";
      missingWorkoutCount: number;
    }
  | {
      state: "not_applicable";
      kilometres: null;
      reason: "no_scheduled_non_rest_workouts";
    };

export type WorkoutSidebarRecordedDistance =
  | {
      state: "available";
      kilometres: number;
      basis:
        | "no_recorded_distance_yet"
        | "manual_logs"
        | "fit_actual_metrics"
        | "manual_and_fit_actuals";
      recordedWorkoutCount: number;
    }
  | {
      state: "unavailable";
      kilometres: null;
      reason: "recorded_distance_missing";
      missingWorkoutCount: number;
    }
  | {
      state: "not_applicable";
      kilometres: null;
      reason: "no_scheduled_non_rest_workouts";
    };

export interface WorkoutSidebarWeekSummary {
  weekStartDate: string;
  weekEndDate: string;
  scheduledWorkoutCount: number;
  completedWorkoutCount: number;
  scheduledDistance: WorkoutSidebarScheduledDistance;
  recordedDistance: WorkoutSidebarRecordedDistance;
}

export type WorkoutSidebarLatestInsight =
  | {
      state: "available";
      workout: {
        id: string;
        date: string;
        title: string;
      };
      insight: WorkoutAiInsightSummary;
    }
  | {
      state: "absent";
      reason: "no_eligible_uploaded_workout_insight";
    };

export interface WorkoutDetailSidebarReadModel {
  week: WorkoutSidebarWeekSummary;
  latestInsight: WorkoutSidebarLatestInsight;
}

export interface BuildWorkoutSidebarWeekSummaryInput {
  userId: string;
  currentDate: string;
  plannedWorkouts: readonly WorkoutSidebarPlannedWorkoutRow[];
  logs: readonly WorkoutSidebarLogRow[];
  actualMetrics: readonly WorkoutSidebarActualMetricsRow[];
  fitCompletedWorkoutIds: ReadonlySet<string>;
}

export async function getWorkoutDetailSidebarReadModelForUser(input: {
  userId: string;
  currentDate: string;
}): Promise<WorkoutDetailSidebarReadModel> {
  const [week, latestInsight] = await Promise.all([
    readWorkoutSidebarWeekSummary(input),
    readLatestEligibleWorkoutInsight(input.userId),
  ]);

  return { week, latestInsight };
}

export function buildWorkoutSidebarWeekSummary(
  input: BuildWorkoutSidebarWeekSummaryInput,
): WorkoutSidebarWeekSummary {
  const weekStartDate = startOfWeekIso(input.currentDate);
  const weekEndDate = addDaysIso(weekStartDate, 6);
  const scheduledWorkouts = input.plannedWorkouts.filter(
    (workout) =>
      workout.user_id === input.userId &&
      workout.workout_type !== "rest" &&
      workout.workout_date >= weekStartDate &&
      workout.workout_date <= weekEndDate,
  );
  const scheduledWorkoutIds = new Set(scheduledWorkouts.map((workout) => workout.id));
  const logsByWorkoutId = new Map(
    input.logs
      .filter(
        (log) => log.user_id === input.userId && scheduledWorkoutIds.has(log.planned_workout_id),
      )
      .map((log) => [log.planned_workout_id, log]),
  );
  const latestFitMetricsByWorkoutId = newestFitMetricsByWorkoutId(
    input.actualMetrics.filter(
      (metrics) =>
        metrics.user_id === input.userId &&
        metrics.source_kind === "garmin_fit" &&
        metrics.status !== "superseded" &&
        metrics.planned_workout_id != null &&
        scheduledWorkoutIds.has(metrics.planned_workout_id),
    ),
  );
  const scheduledDistance = buildScheduledDistance(scheduledWorkouts);
  const recordedSources = new Set<"manual" | "fit">();
  let completedWorkoutCount = 0;
  let recordedKilometres = 0;
  let recordedWorkoutCount = 0;
  let missingRecordedWorkoutCount = 0;

  for (const workout of scheduledWorkouts) {
    const log = logsByWorkoutId.get(workout.id) ?? null;
    const fitCompleted = input.fitCompletedWorkoutIds.has(workout.id);
    const completed = fitCompleted ? log?.outcome !== "partial" : log?.outcome === "completed";

    if (completed) {
      completedWorkoutCount += 1;
    }

    const hasRecordedResult =
      fitCompleted || log?.outcome === "completed" || log?.outcome === "partial";
    if (!hasRecordedResult) {
      continue;
    }

    const distance = fitCompleted
      ? (latestFitMetricsByWorkoutId.get(workout.id)?.actual_distance_km ?? null)
      : (log?.actual_distance_km ?? null);

    if (!isRecordedDistance(distance)) {
      missingRecordedWorkoutCount += 1;
      continue;
    }

    recordedSources.add(fitCompleted ? "fit" : "manual");
    recordedKilometres += distance;
    recordedWorkoutCount += 1;
  }

  return {
    weekStartDate,
    weekEndDate,
    scheduledWorkoutCount: scheduledWorkouts.length,
    completedWorkoutCount,
    scheduledDistance,
    recordedDistance:
      scheduledWorkouts.length === 0
        ? {
            state: "not_applicable",
            kilometres: null,
            reason: "no_scheduled_non_rest_workouts",
          }
        : missingRecordedWorkoutCount > 0
          ? {
              state: "unavailable",
              kilometres: null,
              reason: "recorded_distance_missing",
              missingWorkoutCount: missingRecordedWorkoutCount,
            }
          : {
              state: "available",
              kilometres: roundKilometres(recordedKilometres),
              basis: recordedDistanceBasis(recordedSources),
              recordedWorkoutCount,
            },
  };
}

export function projectEligibleWorkoutInsight(input: {
  userId: string;
  candidate: WorkoutSidebarInsightCandidateRow;
  workout: WorkoutSidebarInsightWorkoutRow | null;
  feedback: WorkoutResultFeedbackSummary | null;
}): WorkoutSidebarLatestInsight {
  const insight = input.feedback?.latestAiInsight ?? null;
  const actualMetrics = input.feedback?.latestActualMetrics ?? null;
  const comparison = input.feedback?.latestComparison ?? null;
  const asset = input.feedback?.latestAsset ?? null;

  if (!insight || !actualMetrics || !comparison || !asset) {
    return noEligibleInsight();
  }

  if (
    input.candidate.user_id !== input.userId ||
    input.candidate.status !== "final" ||
    !input.candidate.planned_workout_id ||
    !input.workout ||
    input.workout.user_id !== input.userId ||
    input.workout.id !== input.candidate.planned_workout_id ||
    asset?.plannedWorkoutId !== input.candidate.planned_workout_id ||
    actualMetrics?.plannedWorkoutId !== input.candidate.planned_workout_id ||
    comparison?.plannedWorkoutId !== input.candidate.planned_workout_id ||
    insight?.id !== input.candidate.id ||
    insight.status !== "final" ||
    insight.actualMetricsId !== actualMetrics.id ||
    insight.comparisonId !== comparison.id
  ) {
    return noEligibleInsight();
  }

  return {
    state: "available",
    workout: {
      id: input.workout.id,
      date: input.workout.workout_date,
      title: input.workout.title,
    },
    insight,
  };
}

async function readWorkoutSidebarWeekSummary(input: { userId: string; currentDate: string }) {
  const supabase = createAdminSupabaseClient();
  const weekStartDate = startOfWeekIso(input.currentDate);
  const weekEndDate = addDaysIso(weekStartDate, 6);
  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("id, user_id, workout_date, workout_type, title, steps")
    .eq("user_id", input.userId)
    .neq("workout_type", "rest")
    .gte("workout_date", weekStartDate)
    .lte("workout_date", weekEndDate)
    .order("workout_date", { ascending: true })
    .order("id", { ascending: true });

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  const plannedWorkouts = workoutsResult.data ?? [];
  const plannedWorkoutIds = plannedWorkouts.map((workout) => workout.id);
  const [logs, actualMetrics, fitCompletedWorkoutIds] = await Promise.all([
    collectRowsForIdBatches<WorkoutSidebarLogRow>(
      plannedWorkoutIds,
      async (ids) =>
        await supabase
          .from("workout_logs")
          .select("planned_workout_id, user_id, outcome, actual_distance_km")
          .eq("user_id", input.userId)
          .in("planned_workout_id", ids),
    ),
    collectRowsForIdBatches<WorkoutSidebarActualMetricsRow>(
      plannedWorkoutIds,
      async (ids) =>
        await supabase
          .from("workout_actual_metrics")
          .select(
            "id, planned_workout_id, user_id, source_kind, status, actual_distance_km, created_at",
          )
          .eq("user_id", input.userId)
          .eq("source_kind", "garmin_fit")
          .neq("status", "superseded")
          .in("planned_workout_id", ids)
          .order("created_at", { ascending: false }),
    ),
    getFitCompletedPlannedWorkoutIds({ userId: input.userId, plannedWorkoutIds }),
  ]);

  return buildWorkoutSidebarWeekSummary({
    userId: input.userId,
    currentDate: input.currentDate,
    plannedWorkouts,
    logs,
    actualMetrics,
    fitCompletedWorkoutIds,
  });
}

async function readLatestEligibleWorkoutInsight(userId: string) {
  const supabase = createAdminSupabaseClient();
  const feedbackByWorkoutId = new Map<string, Promise<WorkoutResultFeedbackSummary | null>>();
  const pageSize = 40;

  for (let offset = 0; ; offset += pageSize) {
    const candidatesResult = await supabase
      .from("workout_ai_insights")
      .select("id, user_id, planned_workout_id, status, created_at")
      .eq("user_id", userId)
      .eq("status", "final")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (candidatesResult.error) {
      throw new Error(candidatesResult.error.message);
    }

    const candidates = candidatesResult.data ?? [];

    for (const candidate of candidates) {
      if (candidate.user_id !== userId || !candidate.planned_workout_id) {
        continue;
      }

      const feedbackPromise =
        feedbackByWorkoutId.get(candidate.planned_workout_id) ??
        getLatestWorkoutResultFeedback({ userId, plannedWorkoutId: candidate.planned_workout_id });
      feedbackByWorkoutId.set(candidate.planned_workout_id, feedbackPromise);
      const feedback = await feedbackPromise;

      if (!feedback || feedback.latestAiInsight?.id !== candidate.id) {
        continue;
      }

      const workoutResult = await supabase
        .from("planned_workouts")
        .select("id, user_id, workout_date, title")
        .eq("user_id", userId)
        .eq("id", candidate.planned_workout_id)
        .maybeSingle();

      if (workoutResult.error) {
        throw new Error(workoutResult.error.message);
      }

      const projected = projectEligibleWorkoutInsight({
        userId,
        candidate,
        workout: workoutResult.data,
        feedback,
      });

      if (projected.state === "available") {
        return projected;
      }
    }

    if (candidates.length < pageSize) {
      return noEligibleInsight();
    }
  }
}

function buildScheduledDistance(
  workouts: readonly WorkoutSidebarPlannedWorkoutRow[],
): WorkoutSidebarScheduledDistance {
  if (workouts.length === 0) {
    return {
      state: "not_applicable",
      kilometres: null,
      reason: "no_scheduled_non_rest_workouts",
    };
  }

  let totalKilometres = 0;
  let estimatedWorkoutCount = 0;
  let missingWorkoutCount = 0;

  for (const workout of workouts) {
    const steps = normalizeExecutableStepInstructions(readWorkoutDocumentSections(workout.steps));
    const kilometres = workoutDistanceKm({ steps, type: workout.workout_type });

    if (kilometres == null) {
      missingWorkoutCount += 1;
      continue;
    }

    const explicitKilometres = steps.reduce((sum, step) => sum + stepPlannedDistanceKm(step), 0);
    if (explicitKilometres <= 0) {
      estimatedWorkoutCount += 1;
    }
    totalKilometres += kilometres;
  }

  if (missingWorkoutCount > 0) {
    return {
      state: "unavailable",
      kilometres: null,
      reason: "scheduled_distance_missing",
      missingWorkoutCount,
    };
  }

  return {
    state: "available",
    kilometres: roundKilometres(totalKilometres),
    basis: estimatedWorkoutCount > 0 ? "includes_duration_estimates" : "explicit_prescriptions",
    estimatedWorkoutCount,
  };
}

function newestFitMetricsByWorkoutId(rows: readonly WorkoutSidebarActualMetricsRow[]) {
  const newest = new Map<string, WorkoutSidebarActualMetricsRow>();

  for (const row of [...rows].sort((left, right) => {
    const createdOrder = right.created_at.localeCompare(left.created_at);
    return createdOrder !== 0 ? createdOrder : right.id.localeCompare(left.id);
  })) {
    if (!row.planned_workout_id) {
      continue;
    }

    if (!newest.has(row.planned_workout_id)) {
      newest.set(row.planned_workout_id, row);
    }
  }

  return newest;
}

function recordedDistanceBasis(sources: ReadonlySet<"manual" | "fit">) {
  if (sources.size === 0) return "no_recorded_distance_yet" as const;
  if (sources.size === 2) return "manual_and_fit_actuals" as const;
  return sources.has("fit") ? ("fit_actual_metrics" as const) : ("manual_logs" as const);
}

function isRecordedDistance(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value >= 0;
}

function roundKilometres(value: number) {
  return Math.round(value * 100) / 100;
}

function noEligibleInsight(): WorkoutSidebarLatestInsight {
  return {
    state: "absent",
    reason: "no_eligible_uploaded_workout_insight",
  };
}
