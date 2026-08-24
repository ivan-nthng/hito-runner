import "@tanstack/react-start/server-only";

import { parseBodyNotesValue } from "@/lib/body-notes";
import { fetchManualWorkoutEvidenceWorkoutIds } from "@/lib/manual-workout-authoring/active-plan-add";
import {
  getCalendarWorkoutsWithLogsForUser,
  getRunnerProfileRowForUser,
  type PersistedPlannedWorkoutRow,
  type PersistedRunnerProfileRow,
  type PersistedWorkoutLogRow,
} from "@/lib/runner-calendar-persistence";
import {
  resolveCalendarWorkoutEditability,
  resolveCalendarWorkoutSourceEditingCapabilities,
  resolvePlanProvenanceSourceStatus,
  type CalendarWorkoutEditOperation,
  type CalendarWorkoutEditabilityResult,
} from "@/lib/runner-calendar-mutations";
import { buildRunnerCalendarContext } from "@/lib/runner-calendar-timezone";
import { getSourcePlanProvenancesForUser } from "@/lib/source-plan-provenance-persistence";
import {
  deriveWeekStatus,
  deriveWorkoutRichModel,
  inferWorkoutStatus,
  normalizeExecutableStepInstructions,
  projectWorkoutCompletionLog,
  type CalendarWorkoutEditingCapabilities,
  type CalendarWorkoutEditingCapability,
  type PersistedRunnerProfileSummary,
  type TrainingSnapshot,
  type Workout,
  type WorkoutLog,
} from "@/lib/training";
import { readWorkoutDocumentSections } from "@/lib/workout-document";

export async function getPersistedRunnerCalendarSnapshot(
  userId: string,
  options: { currentDate?: string; instant?: Date } = {},
): Promise<TrainingSnapshot> {
  const profileRow = await getRunnerProfileRowForUser(userId);
  const calendarContext = buildRunnerCalendarContext({
    calendarTimezone: profileRow?.calendar_timezone,
    calendarTimezoneSource: profileRow?.calendar_timezone_source,
    instant: options.instant,
  });
  const currentDate = options.currentDate ?? calendarContext.currentDate;

  if (!profileRow || !runnerProfileHasRequiredSetup(profileRow)) {
    return {
      mode: "onboarding",
      source: "persisted",
      backend: "supabase",
      currentDate,
      calendarContext: null,
      profile: profileRow ? profileRowToSummary(profileRow) : null,
      workouts: [],
      weekStatus: "on_track",
    };
  }

  const profile = profileRowToSummary(profileRow);
  const { workouts: persistedWorkouts, logsByWorkoutId } =
    await getCalendarWorkoutsWithLogsForUser(userId);
  const provenanceById = await getSourcePlanProvenancesForUser(
    userId,
    persistedWorkouts.map((workout) => workout.plan_cycle_id),
  );
  const persistedWorkoutIds = persistedWorkouts.map((workout) => workout.id);
  const { feedbackMarkerByWorkoutId, fitCompletedWorkoutIds } =
    await getWorkoutResultReadbackForUser(userId, persistedWorkoutIds);
  const evidenceWorkoutIds = await fetchManualWorkoutEvidenceWorkoutIds(
    userId,
    persistedWorkoutIds,
  );
  const workouts = persistedWorkouts.map((workout) => {
    const provenancePlan = workout.plan_cycle_id
      ? (provenanceById.get(workout.plan_cycle_id) ?? null)
      : null;
    const originKind = workout.origin_kind as NonNullable<
      Workout["sourceProvenance"]
    >["originKind"];
    const sourceProvenance: Workout["sourceProvenance"] = provenancePlan
      ? {
          originKind,
          sourcePlanId: provenancePlan.id,
          sourceKind: provenancePlan.source_kind,
          sourceStatus: resolvePlanProvenanceSourceStatus(provenancePlan),
        }
      : {
          originKind,
          sourcePlanId: null,
          sourceKind: null,
          sourceStatus: null,
        };

    return persistedWorkoutRowToView(
      workout,
      logsByWorkoutId.get(workout.id) ?? null,
      currentDate,
      provenancePlan?.source_kind ?? workout.origin_kind,
      sourceProvenance,
      feedbackMarkerByWorkoutId.get(workout.id) ?? null,
      fitCompletedWorkoutIds.has(workout.id),
      resolveCalendarWorkoutSourceEditingCapabilities({
        provenancePlan,
        workout,
        log: logsByWorkoutId.get(workout.id) ?? null,
        evidenceWorkoutIds,
        currentDate,
      }),
    );
  });

  return {
    mode: "authenticated",
    source: "persisted",
    backend: "supabase",
    currentDate,
    calendarContext: {
      workoutEditing: buildCalendarWorkoutEditingCapabilities(),
    },
    profile,
    workouts,
    weekStatus: deriveWeekStatus(workouts, currentDate),
  };
}

function runnerProfileHasRequiredSetup(profile: PersistedRunnerProfileRow) {
  return (
    profile.setup_state === "completed" &&
    profile.age != null &&
    profile.weight_kg != null &&
    profile.height_cm != null &&
    Boolean(profile.fitness_level?.trim())
  );
}

function buildCalendarWorkoutEditingCapabilities(): CalendarWorkoutEditingCapabilities {
  return {
    addWorkout: mapCalendarWorkoutEditingCapability(
      "add_workout",
      resolveCalendarWorkoutEditability(null, "add_workout"),
    ),
    clearWorkout: mapCalendarWorkoutEditingCapability(
      "clear_workout",
      resolveCalendarWorkoutEditability(null, "clear_workout"),
    ),
    moveWorkout: mapCalendarWorkoutEditingCapability(
      "move_workout",
      resolveCalendarWorkoutEditability(null, "move_workout"),
    ),
    editWorkout: mapCalendarWorkoutEditingCapability(
      "edit_workout",
      resolveCalendarWorkoutEditability(null, "edit_workout"),
    ),
  };
}

function mapCalendarWorkoutEditingCapability(
  operation: Exclude<CalendarWorkoutEditOperation, "copy_workout">,
  editability: CalendarWorkoutEditabilityResult,
): CalendarWorkoutEditingCapability {
  if (!editability.ok) {
    return {
      allowed: false,
      operation,
      reason: editability.reason,
      message: editability.message,
    };
  }

  return {
    allowed: true,
    operation,
    sourceKind: editability.sourceKind,
    sourceStatus: editability.sourceStatus,
  };
}

async function getWorkoutResultReadbackForUser(userId: string, plannedWorkoutIds: string[]) {
  const { getFitCompletedPlannedWorkoutIds, getWorkoutFeedbackMarkerMap } =
    await import("@/lib/workout-result-import/read-workout-result-feedback");

  const [feedbackMarkerByWorkoutId, fitCompletedWorkoutIds] = await Promise.all([
    getWorkoutFeedbackMarkerMap({ userId, plannedWorkoutIds }),
    getFitCompletedPlannedWorkoutIds({ userId, plannedWorkoutIds }),
  ]);
  return { feedbackMarkerByWorkoutId, fitCompletedWorkoutIds };
}

function persistedWorkoutRowToView(
  workout: PersistedPlannedWorkoutRow,
  log: PersistedWorkoutLogRow | null,
  currentDate: string,
  sourceKind: string | null,
  sourceProvenance: Workout["sourceProvenance"],
  feedbackMarker: Workout["feedbackMarker"],
  hasFitCompletion: boolean,
  sourceEditing: Workout["sourceEditing"],
): Workout {
  const mappedLog = projectWorkoutCompletionLog(
    log ? persistedWorkoutLogRowToView(log) : null,
    hasFitCompletion,
  );
  const steps = normalizeExecutableStepInstructions(readWorkoutDocumentSections(workout.steps));

  return {
    id: workout.id,
    date: workout.workout_date,
    weekday: workout.weekday,
    week: workout.week_number,
    phase: workout.phase,
    type: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    ...deriveWorkoutRichModel({
      type: workout.workout_type,
      sourceWorkoutType: workout.source_workout_type,
      sourceKind,
      workoutFamily: workout.workout_family,
      workoutIdentity: workout.workout_identity,
      calendarIconKey: workout.calendar_icon_key,
      goalContext: workout.goal_context,
      metricMode: workout.metric_mode,
      title: workout.title,
      steps,
    }),
    title: workout.title,
    notes: workout.notes,
    steps,
    feedbackMarker,
    sourceEditing,
    sourceProvenance,
    completionOrigin: hasFitCompletion ? "fit_activity" : undefined,
    log: mappedLog,
    status: inferWorkoutStatus(
      workout.workout_type,
      workout.workout_date,
      currentDate,
      mappedLog,
      hasFitCompletion,
    ),
  };
}

function persistedWorkoutLogRowToView(log: PersistedWorkoutLogRow): WorkoutLog {
  return {
    id: log.id,
    outcome: log.outcome,
    actualDistanceKm: log.actual_distance_km,
    actualDurationMin: log.actual_duration_min,
    rpe: log.rpe,
    notes: log.notes,
    intervalsCompleted: log.intervals_completed,
    bodyNotes: parseBodyNotesValue(log.body_notes),
    loggedAt: log.logged_at,
  };
}

function profileRowToSummary(profile: PersistedRunnerProfileRow): PersistedRunnerProfileSummary {
  return {
    goalType: profile.goal_type,
    goalLabel: profile.goal_label,
    baselineSessionsPerWeek: profile.baseline_sessions_per_week,
    baselineLongRunKm: profile.baseline_long_run_km,
    baselineNotes: profile.baseline_notes,
    firstName: profile.first_name,
    lastName: profile.last_name,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    avatarStoragePath: profile.avatar_storage_path,
    age: profile.age,
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    calendarTimezone: profile.calendar_timezone,
    calendarTimezoneSource:
      profile.calendar_timezone_source === "browser" || profile.calendar_timezone_source === "user"
        ? profile.calendar_timezone_source
        : "fallback_utc",
  };
}
