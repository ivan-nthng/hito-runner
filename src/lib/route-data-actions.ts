import { z } from "zod";
import { canUseMagicLinkForRequest, isLocalAuthBypassEnabledForRequest } from "@/lib/auth-actions";
import { getRequestAuthContext } from "@/lib/backend/auth";
import { findWorkout, type TrainingSnapshot, type Workout } from "@/lib/training";
import type { WorkoutResultFeedbackSummary } from "@/lib/workout-result-import/types";

export const workoutRouteInputSchema = z.object({ date: z.string() });

type RouteDataLoaders = {
  loadSnapshot: () => Promise<TrainingSnapshot>;
  loadViewer: () => Promise<unknown>;
};

type WorkoutRouteDataLoaders = RouteDataLoaders & {
  loadFeedback: (plannedWorkoutId: string) => Promise<WorkoutResultFeedbackSummary | null>;
};

export async function loadHomeRouteData({ loadSnapshot, loadViewer }: RouteDataLoaders) {
  const auth = getRequestAuthContext();

  return {
    snapshot: await loadSnapshot(),
    viewer: await loadViewer(),
    localBypassEnabled: await isLocalAuthBypassEnabledForRequest(auth.appBaseUrl),
    magicLinkEnabled: canUseMagicLinkForRequest(auth.appBaseUrl),
  };
}

export async function loadShellRouteData({ loadSnapshot, loadViewer }: RouteDataLoaders) {
  return {
    snapshot: await loadSnapshot(),
    viewer: await loadViewer(),
  };
}

export async function loadWorkoutRouteData(
  data: z.output<typeof workoutRouteInputSchema>,
  { loadSnapshot, loadViewer, loadFeedback }: WorkoutRouteDataLoaders,
) {
  const snapshot = await loadSnapshot();

  if (snapshot.mode === "onboarding") {
    return {
      snapshot,
      viewer: await loadViewer(),
      workout: null as Workout | null,
      prev: null as Workout | null,
      next: null as Workout | null,
      feedback: null as WorkoutResultFeedbackSummary | null,
    };
  }

  const workout = findWorkout(snapshot.workouts, data.date) ?? null;
  const workoutIndex = workout
    ? snapshot.workouts.findIndex((entry) => entry.id === workout.id)
    : -1;
  const feedback =
    snapshot.source === "persisted" && workout ? await loadFeedback(workout.id) : null;

  return {
    snapshot,
    viewer: await loadViewer(),
    workout,
    prev: workoutIndex > 0 ? snapshot.workouts[workoutIndex - 1] : null,
    next:
      workoutIndex >= 0 && workoutIndex < snapshot.workouts.length - 1
        ? snapshot.workouts[workoutIndex + 1]
        : null,
    feedback,
  };
}

export async function loadProgressRouteData({ loadSnapshot, loadViewer }: RouteDataLoaders) {
  return {
    snapshot: await loadSnapshot(),
    viewer: await loadViewer(),
  };
}
