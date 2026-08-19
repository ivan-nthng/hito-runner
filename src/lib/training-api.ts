import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { parseBodyNotesValue } from "@/lib/body-notes";
import {
  loadLoginRouteData,
  loginInputSchema,
  requestMagicLinkForCurrentRequest,
} from "@/lib/auth-actions";
import {
  loadHomeRouteData,
  loadShellRouteData,
  loadWorkoutRouteData,
  workoutRouteInputSchema,
} from "@/lib/route-data-actions";
import { getCalendarWorkoutsWithLogsForUser } from "@/lib/runner-calendar-persistence";
import { getSourcePlanProvenancesForUser } from "@/lib/source-plan-provenance-persistence";
import { loadSettingsRouteData } from "@/lib/user-settings-actions";
import {
  getPersistedUserIdForAuthContext,
  requirePersistedUserIdForCurrentRequest,
} from "@/lib/request-persisted-user";
import {
  resolveCalendarWorkoutEditability,
  resolvePlanProvenanceSourceStatus,
  type CalendarWorkoutEditOperation,
  type CalendarWorkoutEditabilityResult,
} from "@/lib/active-plan-workout-editing/policy";
import { resolveCalendarWorkoutSourceEditingCapabilities } from "@/lib/active-plan-workout-editing/source-capabilities";
import { findLocalAuthAccountByUserId } from "@/lib/local-auth";
import {
  deriveWeekStatus,
  deriveWorkoutRichModel,
  getPreviewSnapshot,
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
import { saveWorkoutLogForUser, workoutLogInputSchema } from "@/lib/workout-log-actions";
import type { Database } from "@/lib/supabase/database";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { fetchManualWorkoutEvidenceWorkoutIds } from "@/lib/manual-workout-authoring/active-plan-add";
import { readWorkoutDocumentSections } from "@/lib/workout-document";
import { buildRunnerCalendarContext } from "@/lib/runner-calendar-timezone";

export interface ViewerSummary {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export const getHomeRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return loadHomeRouteData({
    loadSnapshot: getSnapshotForRequest,
    loadViewer: getViewerForRequest,
  });
});

export const getShellRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return loadShellRouteData({
    loadSnapshot: getSnapshotForRequest,
    loadViewer: getViewerForRequest,
  });
});

export const getLoginRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return loadLoginRouteData({
    loadSnapshot: getSnapshotForRequest,
    loadViewer: getViewerForRequest,
  });
});

export const getWorkoutRouteData = createServerFn({ method: "POST" })
  .validator((value: unknown) => workoutRouteInputSchema.parse(value))
  .handler(async ({ data }) => {
    return loadWorkoutRouteData(data, {
      loadSnapshot: getSnapshotForRequest,
      loadViewer: getViewerForRequest,
      loadFeedback: getLatestWorkoutResultFeedbackForServer,
      loadSidebarReadModel: getWorkoutDetailSidebarReadModelForServer,
    });
  });

export const getProgressRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return loadShellRouteData({
    loadSnapshot: getSnapshotForRequest,
    loadViewer: getViewerForRequest,
  });
});

export const getSettingsRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return loadSettingsRouteData({
    loadSnapshot: getSnapshotForRequest,
    loadViewer: getViewerForRequest,
  });
});

export const requestMagicLink = createServerFn({ method: "POST" })
  .validator((value: unknown) => loginInputSchema.parse(value))
  .handler(async ({ data }) => {
    return requestMagicLinkForCurrentRequest(data);
  });

export const saveWorkoutLog = createServerFn({ method: "POST" })
  .validator((value: unknown) => workoutLogInputSchema.parse(value))
  .handler(async ({ data }) => {
    try {
      return await saveWorkoutLogForUser(await requirePersistedUserIdForCurrentRequest(), data);
    } catch (error) {
      throw safeRunnerServerActionError(error, {
        action: "save workout log",
        publicMessage: "The workout result could not be saved. Try again shortly.",
        allowedMessages: [
          "Authentication is required for this action.",
          "Planned workout not found.",
          "Rest days cannot be logged as completed workouts.",
          "A matched Garmin activity cannot be saved as skipped. Delete the recorded activity first.",
        ],
      });
    }
  });

function safeRunnerServerActionError(
  error: unknown,
  options: {
    action: string;
    publicMessage: string;
    allowedMessages: string[];
  },
) {
  if (error instanceof Error && options.allowedMessages.includes(error.message)) {
    return error;
  }

  console.error(`[server-action/${options.action}] unexpected failure`, error);
  return new Error(options.publicMessage);
}

async function getSnapshotForRequest() {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    return getPreviewSnapshot();
  }

  return getPersistedSnapshot((await getPersistedUserIdForAuthContext(auth)) ?? auth.userId);
}

async function getViewerForRequest(): Promise<ViewerSummary | null> {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    return null;
  }

  const persistedUserId = await getPersistedUserIdForAuthContext(auth);
  const profile = persistedUserId ? await getRunnerProfileRow(persistedUserId) : null;
  const profileName = buildProfileDisplayName(profile);
  const avatarUrl = profile?.avatar_url ?? null;

  if (auth.provider === "local") {
    const account = await findLocalAuthAccountByUserId(auth.userId);
    return {
      name: profileName ?? account?.displayName ?? inferViewerName(auth.email),
      email: account?.email ?? auth.email,
      avatarUrl,
    };
  }

  return {
    name: profileName ?? inferViewerName(auth.email),
    email: auth.email,
    avatarUrl,
  };
}

export async function getPersistedSnapshot(
  userId: string,
  options: { currentDate?: string; instant?: Date } = {},
): Promise<TrainingSnapshot> {
  const profileRow = await getRunnerProfileRow(userId);
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
      planMeta: null,
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
    return dbWorkoutToView(
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
    planMeta: null,
    calendarContext: {
      workoutEditing: buildCalendarWorkoutEditingCapabilities(),
    },
    profile,
    workouts,
    weekStatus: deriveWeekStatus(workouts, currentDate),
  };
}

function runnerProfileHasRequiredSetup(
  profile: Database["public"]["Tables"]["runner_profiles"]["Row"],
) {
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

async function getRunnerProfileRow(userId: string) {
  const supabase = createAdminSupabaseClient();
  const profileResult = await supabase
    .from("runner_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  return profileResult.data;
}

const getLatestWorkoutResultFeedbackForServer = createServerOnlyFn(
  async (plannedWorkoutId: string) => {
    const userId = await requirePersistedUserIdForCurrentRequest();
    const { getLatestWorkoutResultFeedback } =
      await import("@/lib/workout-result-import/read-workout-result-feedback");

    return getLatestWorkoutResultFeedback({ userId, plannedWorkoutId });
  },
);

const getWorkoutDetailSidebarReadModelForServer = createServerOnlyFn(
  async (currentDate: string) => {
    const userId = await requirePersistedUserIdForCurrentRequest();
    const { getWorkoutDetailSidebarReadModelForUser } =
      await import("@/lib/workout-detail-sidebar-read-model");

    return getWorkoutDetailSidebarReadModelForUser({ userId, currentDate });
  },
);

async function getWorkoutResultReadbackForUser(userId: string, plannedWorkoutIds: string[]) {
  const { getFitCompletedPlannedWorkoutIds, getWorkoutFeedbackMarkerMap } =
    await import("@/lib/workout-result-import/read-workout-result-feedback");

  const [feedbackMarkerByWorkoutId, fitCompletedWorkoutIds] = await Promise.all([
    getWorkoutFeedbackMarkerMap({ userId, plannedWorkoutIds }),
    getFitCompletedPlannedWorkoutIds({ userId, plannedWorkoutIds }),
  ]);
  return { feedbackMarkerByWorkoutId, fitCompletedWorkoutIds };
}

function dbWorkoutToView(
  workout: Database["public"]["Tables"]["planned_workouts"]["Row"],
  log: Database["public"]["Tables"]["workout_logs"]["Row"] | null,
  currentDate: string,
  sourceKind: string | null,
  sourceProvenance: Workout["sourceProvenance"],
  feedbackMarker: Workout["feedbackMarker"],
  hasFitCompletion: boolean,
  sourceEditing: Workout["sourceEditing"],
): Workout {
  const mappedLog = projectWorkoutCompletionLog(log ? logRowToView(log) : null, hasFitCompletion);
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

function logRowToView(log: Database["public"]["Tables"]["workout_logs"]["Row"]): WorkoutLog {
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

function profileRowToSummary(
  profile: Database["public"]["Tables"]["runner_profiles"]["Row"],
): PersistedRunnerProfileSummary {
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

function inferViewerName(email: string | null) {
  if (!email) {
    return null;
  }

  const localPart = email.split("@")[0] ?? "";

  if (!localPart) {
    return null;
  }

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildProfileDisplayName(
  profile: Database["public"]["Tables"]["runner_profiles"]["Row"] | null,
) {
  if (!profile) {
    return null;
  }

  const displayName = profile.display_name?.trim() ?? "";

  if (displayName) {
    return displayName;
  }

  const firstName = profile.first_name?.trim() ?? "";
  const lastName = profile.last_name?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return fullName || null;
}
