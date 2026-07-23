import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { parseBodyNotesValue } from "@/lib/body-notes";
import {
  loadLoginRouteData,
  loginInputSchema,
  requestMagicLinkForCurrentRequest,
} from "@/lib/auth-actions";
import type {
  ActivePlanScheduleEditInput,
  ActivePlanScheduleEditPreview,
  ActivePlanScheduleReflowApplyInput,
  ActivePlanScheduleReflowApplyResult,
} from "@/lib/active-plan-schedule-edit-preview";
import {
  loadHomeRouteData,
  loadProgressRouteData,
  loadShellRouteData,
  loadWorkoutRouteData,
  workoutRouteInputSchema,
} from "@/lib/route-data-actions";
import {
  getActivePlan,
  getResolvedPlanWorkoutsWithLogs,
  type PersistedPlanCycleRow,
} from "@/lib/active-plan-persistence";
import { clearUpcomingScheduleForUser as clearUpcomingScheduleForUserWithSnapshot } from "@/lib/active-plan-lifecycle-actions";
import { loadSettingsRouteData } from "@/lib/user-settings-actions";
import {
  getPersistedUserIdForAuthContext,
  requirePersistedUserIdForCurrentRequest,
} from "@/lib/request-persisted-user";
import {
  resolveActivePlanWorkoutEditability,
  type ActivePlanWorkoutEditOperation,
  type ActivePlanWorkoutEditabilityResult,
} from "@/lib/active-plan-workout-editing/policy";
import { resolveActivePlanWorkoutSourceEditingCapabilities } from "@/lib/active-plan-workout-editing/source-capabilities";
import { findLocalAuthAccountByUserId } from "@/lib/local-auth";
import {
  deriveWeekStatus,
  deriveWorkoutRichModel,
  getPreviewSnapshot,
  inferWorkoutStatus,
  normalizeExecutableStepInstructions,
  todayIso,
  type ActivePlanWorkoutEditingCapabilities,
  type ActivePlanWorkoutEditingCapability,
  type RunnerProfileSummary,
  type PlanSchedulePreferencesSummary,
  type Step,
  type TrainingSnapshot,
  type Workout,
  type WorkoutLog,
} from "@/lib/training";
import { saveWorkoutLogForUser, workoutLogInputSchema } from "@/lib/workout-log-actions";
import type { Database, Json } from "@/lib/supabase/database";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { RUNNER_TRAINING_WEEKDAYS } from "@/lib/runner-training-preferences";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "@/lib/manual-workout-authoring";
import { fetchManualWorkoutEvidenceWorkoutIds } from "@/lib/manual-workout-authoring/active-plan-add";
import { readWorkoutDocumentSections } from "@/lib/workout-document";

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
  .inputValidator((value: unknown) => workoutRouteInputSchema.parse(value))
  .handler(async ({ data }) => {
    return loadWorkoutRouteData(data, {
      loadSnapshot: getSnapshotForRequest,
      loadViewer: getViewerForRequest,
      loadFeedback: getLatestWorkoutResultFeedbackForServer,
    });
  });

export const getProgressRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return loadProgressRouteData({
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
  .inputValidator((value: unknown) => loginInputSchema.parse(value))
  .handler(async ({ data }) => {
    return requestMagicLinkForCurrentRequest(data);
  });

export const clearUpcomingSchedule = createServerFn({ method: "POST" }).handler(async () => {
  return clearUpcomingScheduleForUserWithSnapshot(
    await requirePersistedUserIdForCurrentRequest(),
    getPersistedSnapshot,
  );
});

export const previewActivePlanScheduleEdit = createServerFn({ method: "POST" })
  .inputValidator(parseActivePlanScheduleEditInput)
  .handler(async ({ data }): Promise<ActivePlanScheduleEditPreview> => {
    return previewActivePlanScheduleEditForCurrentRequestServer(data);
  });

export const applyActivePlanScheduleReflowPreview = createServerFn({ method: "POST" })
  .inputValidator(parseActivePlanScheduleReflowApplyInput)
  .handler(async ({ data }): Promise<ActivePlanScheduleReflowApplyResult> => {
    return applyActivePlanScheduleReflowPreviewForCurrentRequestServer(data);
  });

export const saveWorkoutLog = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => workoutLogInputSchema.parse(value))
  .handler(async ({ data }) => {
    return saveWorkoutLogForUser(await requirePersistedUserIdForCurrentRequest(), data);
  });

const previewActivePlanScheduleEditForCurrentRequestServer = createServerOnlyFn(
  async (data: ActivePlanScheduleEditInput): Promise<ActivePlanScheduleEditPreview> => {
    const { previewActivePlanScheduleEditForUser } =
      await import("@/lib/active-plan-schedule-edit-preview");

    return previewActivePlanScheduleEditForUser(
      await requirePersistedUserIdForCurrentRequest(),
      data,
    );
  },
);

const applyActivePlanScheduleReflowPreviewForCurrentRequestServer = createServerOnlyFn(
  async (
    data: ActivePlanScheduleReflowApplyInput,
  ): Promise<ActivePlanScheduleReflowApplyResult> => {
    const { applyActivePlanScheduleReflowPreviewForUser } =
      await import("@/lib/active-plan-schedule-edit-preview");

    return applyActivePlanScheduleReflowPreviewForUser(
      await requirePersistedUserIdForCurrentRequest(),
      data,
    );
  },
);

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

function parseActivePlanScheduleReflowApplyInput(
  value: unknown,
): ActivePlanScheduleReflowApplyInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Schedule apply input must be an object.");
  }

  const record = value as Record<string, unknown>;

  if (typeof record.previewToken !== "string" || !record.previewToken.trim()) {
    throw new Error("Schedule preview token is required.");
  }

  if (
    !record.scheduleEditInput ||
    typeof record.scheduleEditInput !== "object" ||
    Array.isArray(record.scheduleEditInput)
  ) {
    throw new Error("Reviewed schedule input is required.");
  }

  return {
    previewToken: record.previewToken,
    scheduleEditInput:
      record.scheduleEditInput as ActivePlanScheduleReflowApplyInput["scheduleEditInput"],
  };
}

function parseActivePlanScheduleEditInput(value: unknown): ActivePlanScheduleEditInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Schedule edit input must be an object.");
  }

  const record = value as Record<string, unknown>;

  return {
    activePlanId:
      typeof record.activePlanId === "string" || record.activePlanId === null
        ? record.activePlanId
        : undefined,
    fixedRestDays: record.fixedRestDays,
    preferredLongRunDay: record.preferredLongRunDay,
    runningDaysPerWeek: record.runningDaysPerWeek,
    runningDays: record.runningDays,
    proposedRunningDays: record.proposedRunningDays,
    saveAsDefaultTrainingPreferences: record.saveAsDefaultTrainingPreferences,
    intent:
      record.intent && typeof record.intent === "object" && !Array.isArray(record.intent)
        ? (record.intent as ActivePlanScheduleEditInput["intent"])
        : null,
  };
}

function buildPlanSchedulePreferencesSummary(
  value: Json | null,
  workouts: readonly Workout[],
): PlanSchedulePreferencesSummary | null {
  const record = asJsonRecord(value);

  if (!record) {
    return null;
  }

  const fixedRestDays = readPlanWeekdays(record.blocked_days);
  const maxRunningDaysPerWeek = readPositiveInteger(record.max_running_days_per_week);
  const runningDaysPerWeek = derivePeakAuthoredRunningDaysPerWeek(workouts);
  const preferredLongRunDay = readPlanWeekday(record.preferred_long_run_day);

  if (
    !fixedRestDays.length &&
    maxRunningDaysPerWeek == null &&
    runningDaysPerWeek == null &&
    !preferredLongRunDay
  ) {
    return null;
  }

  return {
    fixedRestDays,
    maxRunningDaysPerWeek,
    runningDaysPerWeek,
    preferredLongRunDay,
  };
}

function derivePeakAuthoredRunningDaysPerWeek(workouts: readonly Workout[]) {
  const counts = workouts
    .filter((workout) => workout.type !== "rest")
    .reduce((byWeek, workout) => {
      byWeek.set(workout.week, (byWeek.get(workout.week) ?? 0) + 1);
      return byWeek;
    }, new Map<number, number>());

  return counts.size > 0 ? Math.max(...counts.values()) : null;
}

function asJsonRecord(value: Json | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readPlanWeekdays(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const weekdays: string[] = [];

  for (const item of value) {
    const weekday = readPlanWeekday(item);

    if (weekday && !weekdays.includes(weekday)) {
      weekdays.push(weekday);
    }
  }

  return weekdays;
}

function readPlanWeekday(value: unknown): string | null {
  return typeof value === "string" &&
    (RUNNER_TRAINING_WEEKDAYS as readonly string[]).includes(value)
    ? value
    : null;
}

function readPositiveInteger(value: unknown): number | null {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 1) {
    return null;
  }

  return value;
}

async function getPersistedSnapshot(userId: string): Promise<TrainingSnapshot> {
  const profileRow = await getRunnerProfileRow(userId);

  if (!profileRow) {
    return {
      mode: "onboarding",
      source: "persisted",
      backend: "supabase",
      currentDate: todayIso(),
      planMeta: null,
      profile: null,
      workouts: [],
      weekStatus: "on_track",
    };
  }

  const profile = profileRowToSummary(profileRow);
  const planCycle = await getActivePlan(userId);

  if (!planCycle) {
    return {
      mode: "onboarding",
      source: "persisted",
      backend: "supabase",
      currentDate: todayIso(),
      planMeta: null,
      profile,
      workouts: [],
      weekStatus: "on_track",
    };
  }

  const { workouts: persistedWorkouts, logsByWorkoutId } = await getResolvedPlanWorkoutsWithLogs(
    userId,
    planCycle,
  );
  const currentDate = todayIso();
  const persistedWorkoutIds = persistedWorkouts.map((workout) => workout.id);
  const feedbackMarkerByWorkoutId = await getWorkoutFeedbackMarkerMapForServer(persistedWorkoutIds);
  const evidenceWorkoutIds = await fetchManualWorkoutEvidenceWorkoutIds(
    userId,
    persistedWorkoutIds,
  );
  const workouts = persistedWorkouts.map((workout) =>
    dbWorkoutToView(
      workout,
      logsByWorkoutId.get(workout.id) ?? null,
      currentDate,
      planCycle.source_kind,
      feedbackMarkerByWorkoutId.get(workout.id) ?? null,
      resolveActivePlanWorkoutSourceEditingCapabilities({
        activePlan: planCycle,
        workout,
        log: logsByWorkoutId.get(workout.id) ?? null,
        evidenceWorkoutIds,
        currentDate,
      }),
    ),
  );

  return {
    mode: "authenticated",
    source: "persisted",
    backend: "supabase",
    currentDate,
    planMeta: {
      id: planCycle.id,
      title: planCycle.title,
      createdFor: "You",
      createdAt: planCycle.created_at,
      startDate: planCycle.start_date,
      raceDate: planCycle.target_date ?? planCycle.end_date,
      goal: planCycle.goal_summary,
      source: "persisted",
      sourceKind: planCycle.source_kind,
      schedulePreferences: buildPlanSchedulePreferencesSummary(
        planCycle.plan_preferences,
        workouts,
      ),
      workoutEditing: buildActivePlanWorkoutEditingCapabilities(planCycle),
    },
    profile,
    workouts,
    weekStatus: deriveWeekStatus(workouts, currentDate),
  };
}

function buildActivePlanWorkoutEditingCapabilities(
  planCycle: PersistedPlanCycleRow,
): ActivePlanWorkoutEditingCapabilities {
  return {
    addWorkout: mapActivePlanWorkoutEditingCapability(
      "add_workout",
      resolveActivePlanWorkoutEditability(planCycle, "add_workout"),
    ),
    clearWorkout: mapActivePlanWorkoutEditingCapability(
      "clear_workout",
      resolveActivePlanWorkoutEditability(planCycle, "clear_workout"),
    ),
    moveWorkout: mapActivePlanWorkoutEditingCapability(
      "move_workout",
      resolveActivePlanWorkoutEditability(planCycle, "move_workout"),
    ),
    editWorkout: mapActivePlanWorkoutEditingCapability(
      "edit_workout",
      resolveActivePlanWorkoutEditability(planCycle, "edit_workout"),
    ),
  };
}

function mapActivePlanWorkoutEditingCapability(
  operation: ActivePlanWorkoutEditOperation,
  editability: ActivePlanWorkoutEditabilityResult,
): ActivePlanWorkoutEditingCapability {
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
    const { getLatestWorkoutResultFeedback } =
      await import("@/lib/workout-result-import/read-workout-result-feedback");

    return getLatestWorkoutResultFeedback(plannedWorkoutId);
  },
);

const getWorkoutFeedbackMarkerMapForServer = createServerOnlyFn(
  async (plannedWorkoutIds: string[]) => {
    const { getWorkoutFeedbackMarkerMap } =
      await import("@/lib/workout-result-import/read-workout-result-feedback");

    return getWorkoutFeedbackMarkerMap(plannedWorkoutIds);
  },
);

function dbWorkoutToView(
  workout: Database["public"]["Tables"]["planned_workouts"]["Row"],
  log: Database["public"]["Tables"]["workout_logs"]["Row"] | null,
  currentDate: string,
  sourceKind: string | null,
  feedbackMarker: Workout["feedbackMarker"],
  sourceEditing: Workout["sourceEditing"],
): Workout {
  const mappedLog = log ? logRowToView(log) : null;
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
    log: mappedLog,
    status: inferWorkoutStatus(workout.workout_type, workout.workout_date, currentDate, mappedLog),
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
): RunnerProfileSummary {
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
