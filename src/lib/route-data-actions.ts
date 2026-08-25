import { z } from "zod";
import { canUseMagicLinkForRequest, isLocalAuthBypassEnabledForRequest } from "@/lib/auth-actions";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { isLocalActivityFileDesignFixtureEnabledForPersistedUser } from "@/lib/local-activity-file-design-fixture";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import { findWorkout, type TrainingSnapshot, type Workout } from "@/lib/training";
import { getUserSettingsForUserId } from "@/lib/user-settings-actions";
import type { WorkoutResultFeedbackSummary } from "@/lib/workout-result-import/types";
import type { WorkoutDetailSidebarReadModel } from "@/lib/workout-detail-sidebar-contract";

export const workoutRouteInputSchema = z.object({ date: z.string() });

type RouteDataLoaders = {
  loadSnapshot: () => Promise<TrainingSnapshot>;
  loadViewer: () => Promise<unknown>;
};

type WorkoutRouteDataLoaders = RouteDataLoaders & {
  loadFeedback: (plannedWorkoutId: string) => Promise<WorkoutResultFeedbackSummary | null>;
  loadSidebarReadModel: (currentDate: string) => Promise<WorkoutDetailSidebarReadModel>;
};

export async function loadHomeRouteData({ loadSnapshot, loadViewer }: RouteDataLoaders) {
  const auth = getRequestAuthContext();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);
  const settings = persistedUserId
    ? await getUserSettingsForUserId(persistedUserId, auth.email)
    : null;
  const localActivityFileDesignFixtureEnabled =
    await isLocalActivityFileDesignFixtureEnabledForPersistedUser(auth, persistedUserId);

  return {
    snapshot: await loadSnapshot(),
    viewer: await loadViewer(),
    onboardingDefaults: settings,
    settings,
    localActivityFileDesignFixtureEnabled,
    localBypassEnabled: await isLocalAuthBypassEnabledForRequest(auth.appBaseUrl),
    magicLinkEnabled: canUseMagicLinkForRequest(auth.appBaseUrl),
  };
}

export async function loadShellRouteData({ loadSnapshot, loadViewer }: RouteDataLoaders) {
  const auth = getRequestAuthContext();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  return {
    snapshot: await loadSnapshot(),
    viewer: await loadViewer(),
    settings: persistedUserId ? await getUserSettingsForUserId(persistedUserId, auth.email) : null,
  };
}

export async function loadWorkoutRouteData(
  data: z.output<typeof workoutRouteInputSchema>,
  { loadSnapshot, loadViewer, loadFeedback, loadSidebarReadModel }: WorkoutRouteDataLoaders,
) {
  const snapshot = await loadSnapshot();
  const auth = getRequestAuthContext();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);
  const settings = persistedUserId
    ? await getUserSettingsForUserId(persistedUserId, auth.email)
    : null;
  const localActivityFileDesignFixtureEnabled =
    await isLocalActivityFileDesignFixtureEnabledForPersistedUser(auth, persistedUserId);

  if (snapshot.mode === "onboarding") {
    return {
      snapshot,
      viewer: await loadViewer(),
      settings,
      workout: null as Workout | null,
      prev: null as Workout | null,
      next: null as Workout | null,
      feedback: null as WorkoutResultFeedbackSummary | null,
      sidebarReadModel: null as WorkoutDetailSidebarReadModel | null,
      localActivityFileDesignFixtureEnabled,
    };
  }

  const workout = findWorkout(snapshot.workouts, data.date) ?? null;
  const workoutIndex = workout
    ? snapshot.workouts.findIndex((entry) => entry.id === workout.id)
    : -1;
  const feedback =
    snapshot.source === "persisted" && workout ? await loadFeedback(workout.id) : null;
  const sidebarReadModel =
    snapshot.source === "persisted" && workout
      ? await loadSidebarReadModel(snapshot.currentDate)
      : null;

  return {
    snapshot,
    viewer: await loadViewer(),
    settings,
    workout,
    prev: workoutIndex > 0 ? snapshot.workouts[workoutIndex - 1] : null,
    next:
      workoutIndex >= 0 && workoutIndex < snapshot.workouts.length - 1
        ? snapshot.workouts[workoutIndex + 1]
        : null,
    feedback,
    sidebarReadModel,
    localActivityFileDesignFixtureEnabled,
  };
}
