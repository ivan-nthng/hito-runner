import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { parseBodyNotesValue } from "@/lib/body-notes";
import {
  loadLoginRouteData,
  loginInputSchema,
  requestMagicLinkForCurrentRequest,
} from "@/lib/auth-actions";
import {
  activePlanRefreshApplyInputSchema,
  activePlanRefreshProposalInputSchema,
  type ActivePlanRefreshApplyPayload,
  type ActivePlanRefreshProposalInput,
  type ApplyActivePlanRefreshProposalResult,
  type ProposeActivePlanRefreshResult,
} from "@/lib/active-plan-refresh-contract";
import {
  loadHomeRouteData,
  loadProgressRouteData,
  loadShellRouteData,
  loadWorkoutRouteData,
  workoutRouteInputSchema,
} from "@/lib/route-data-actions";
import { getActivePlan, getResolvedPlanWorkoutsWithLogs } from "@/lib/active-plan-persistence";
import {
  archiveActivePlanForUser as archiveActivePlanForUserWithSnapshot,
  clearUpcomingScheduleForUser as clearUpcomingScheduleForUserWithSnapshot,
} from "@/lib/active-plan-lifecycle-actions";
import { loadSettingsRouteData } from "@/lib/user-settings-actions";
import {
  getPersistedUserIdForAuthContext,
  requirePersistedUserIdForCurrentRequest,
} from "@/lib/request-persisted-user";
import { findLocalAuthAccountByUserId } from "@/lib/local-auth";
import {
  deriveWeekStatus,
  deriveWorkoutRichModel,
  getPreviewSnapshot,
  inferWorkoutStatus,
  normalizeExecutableStepInstructions,
  todayIso,
  type RunnerProfileSummary,
  type Step,
  type TrainingSnapshot,
  type Workout,
  type WorkoutLog,
} from "@/lib/training";
import { saveWorkoutLogForUser, workoutLogInputSchema } from "@/lib/workout-log-actions";
import type { Database } from "@/lib/supabase/database";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export {
  completeStructuredFirstPlanOnboarding,
  completeStructuredFirstPlanOnboardingForUser,
  confirmStructuredFirstPlanDraft,
  confirmVoiceToPlanDraft,
  generateStructuredFirstPlanDraft,
  generateVoiceToPlanDraft,
  type ConfirmStructuredFirstPlanDraftResult,
  type ConfirmVoiceToPlanDraftResult,
  type StructuredFirstPlanDraftResult,
} from "@/lib/first-plan-actions";
export {
  exportActivePlan,
  exportActivePlanForUser,
  type ExportActivePlanResult,
} from "@/lib/active-plan-export-actions";
export type {
  ClearUpcomingScheduleResult,
  DeleteActivePlanResult,
} from "@/lib/active-plan-lifecycle-actions";
export { saveUserSettings, type UserSettingsSummary } from "@/lib/user-settings-actions";
export { exchangeCodeForSession } from "@/lib/auth-actions";
export {
  completeOnboarding,
  completeTextOnboarding,
  persistImportedPlanForCurrentRequest,
} from "@/lib/plan-replacement-actions";
export type {
  ApplyActivePlanRefreshProposalResult,
  ProposeActivePlanRefreshResult,
} from "@/lib/active-plan-refresh-contract";

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

export const deleteActivePlan = createServerFn({ method: "POST" }).handler(async () => {
  return archiveActivePlanForUserWithSnapshot(
    await requirePersistedUserIdForCurrentRequest(),
    getPersistedSnapshot,
  );
});

export const clearUpcomingSchedule = createServerFn({ method: "POST" }).handler(async () => {
  return clearUpcomingScheduleForUserWithSnapshot(
    await requirePersistedUserIdForCurrentRequest(),
    getPersistedSnapshot,
  );
});

export const proposeActivePlanRefresh = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => activePlanRefreshProposalInputSchema.parse(value))
  .handler(async ({ data }): Promise<ProposeActivePlanRefreshResult> => {
    return proposeActivePlanRefreshForCurrentRequestServer(data);
  });

export const applyActivePlanRefreshProposal = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => activePlanRefreshApplyInputSchema.parse(value))
  .handler(async ({ data }): Promise<ApplyActivePlanRefreshProposalResult> => {
    return applyActivePlanRefreshProposalForCurrentRequestServer(data.proposal);
  });

export const saveWorkoutLog = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => workoutLogInputSchema.parse(value))
  .handler(async ({ data }) => {
    return saveWorkoutLogForUser(await requirePersistedUserIdForCurrentRequest(), data);
  });

export function archiveActivePlanForUser(userId: string) {
  return archiveActivePlanForUserWithSnapshot(userId, getPersistedSnapshot);
}

export function clearUpcomingScheduleForUser(userId: string, clearedFromDate: string = todayIso()) {
  return clearUpcomingScheduleForUserWithSnapshot(userId, getPersistedSnapshot, clearedFromDate);
}

export async function applyActivePlanRefreshProposalForUser(
  userId: string,
  proposal: ActivePlanRefreshApplyPayload,
): Promise<ApplyActivePlanRefreshProposalResult> {
  return applyActivePlanRefreshProposalForUserServer({ userId, proposal });
}

const proposeActivePlanRefreshForCurrentRequestServer = createServerOnlyFn(
  async (data: ActivePlanRefreshProposalInput): Promise<ProposeActivePlanRefreshResult> => {
    const { proposeActivePlanRefreshForCurrentRequest } =
      await import("@/lib/active-plan-refresh-actions");

    return proposeActivePlanRefreshForCurrentRequest(data);
  },
);

const applyActivePlanRefreshProposalForCurrentRequestServer = createServerOnlyFn(
  async (
    proposal: ActivePlanRefreshApplyPayload,
  ): Promise<ApplyActivePlanRefreshProposalResult> => {
    const { applyActivePlanRefreshProposalForCurrentRequest } =
      await import("@/lib/active-plan-refresh-actions");

    return applyActivePlanRefreshProposalForCurrentRequest(proposal, getPersistedSnapshot);
  },
);

const applyActivePlanRefreshProposalForUserServer = createServerOnlyFn(
  async ({
    userId,
    proposal,
  }: {
    userId: string;
    proposal: ActivePlanRefreshApplyPayload;
  }): Promise<ApplyActivePlanRefreshProposalResult> => {
    const { applyActivePlanRefreshProposalForUser: applyWithSnapshot } =
      await import("@/lib/active-plan-refresh-actions");

    return applyWithSnapshot(userId, proposal, getPersistedSnapshot);
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
  const feedbackMarkerByWorkoutId = await getWorkoutFeedbackMarkerMapForServer(
    persistedWorkouts.map((workout) => workout.id),
  );
  const workouts = persistedWorkouts.map((workout) =>
    dbWorkoutToView(
      workout,
      logsByWorkoutId.get(workout.id) ?? null,
      currentDate,
      feedbackMarkerByWorkoutId.get(workout.id) ?? null,
    ),
  );

  return {
    mode: "authenticated",
    source: "persisted",
    backend: "supabase",
    currentDate,
    planMeta: {
      title: planCycle.title,
      createdFor: "You",
      createdAt: planCycle.created_at,
      startDate: planCycle.start_date,
      raceDate: planCycle.target_date ?? planCycle.end_date,
      goal: planCycle.goal_summary,
      source: "persisted",
    },
    profile,
    workouts,
    weekStatus: deriveWeekStatus(workouts, currentDate),
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
  feedbackMarker: Workout["feedbackMarker"],
): Workout {
  const mappedLog = log ? logRowToView(log) : null;
  const steps = normalizeExecutableStepInstructions((workout.steps as Step[] | null) ?? []);

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
