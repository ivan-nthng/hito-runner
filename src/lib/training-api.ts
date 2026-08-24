import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
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
import {
  getRunnerProfileRowForUser,
  type PersistedRunnerProfileRow,
} from "@/lib/runner-calendar-persistence";
import { getPersistedRunnerCalendarSnapshot } from "@/lib/runner-calendar-snapshot";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { loadSettingsRouteData } from "@/lib/user-settings-actions";
import {
  getPersistedUserIdForAuthContext,
  requirePersistedUserIdForCurrentRequest,
} from "@/lib/request-persisted-user";
import { findLocalAuthAccountByUserId } from "@/lib/local-auth";
import { getPreviewSnapshot, type TrainingSnapshot } from "@/lib/training";
import { saveWorkoutLogForUser, workoutLogInputSchema } from "@/lib/workout-log-actions";
import { getRequestAuthContext } from "@/lib/backend/auth";

export interface ViewerSummary {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export const getHomeRouteData = createServerFn({ method: "GET" }).handler(async () => {
  const routeData = await loadHomeRouteData({
    loadSnapshot: getSnapshotForRequest,
    loadViewer: getViewerForRequest,
  });

  return {
    ...routeData,
    blueprintCalendarReadModel:
      routeData.snapshot.mode === "authenticated"
        ? await getAdaptiveBlueprintCalendarReadModelForServer()
        : {
            projections: [],
            continuation: {
              status: "no_source",
              window: null,
              reasons: [],
              candidate: null,
              context: null,
            },
          },
  };
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

  const userId = (await getPersistedUserIdForAuthContext(auth)) ?? auth.userId;
  return getPersistedRunnerCalendarSnapshot(userId, {
    currentDate: await getRunnerCalendarDateForUserId(userId),
  });
}

async function getViewerForRequest(): Promise<ViewerSummary | null> {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    return null;
  }

  const persistedUserId = await getPersistedUserIdForAuthContext(auth);
  const profile = persistedUserId ? await getRunnerProfileRowForUser(persistedUserId) : null;
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

const getLatestWorkoutResultFeedbackForServer = createServerOnlyFn(
  async (plannedWorkoutId: string) => {
    const userId = await requirePersistedUserIdForCurrentRequest();
    const { getLatestWorkoutResultFeedback } =
      await import("@/lib/workout-result-import/read-workout-result-feedback");

    return getLatestWorkoutResultFeedback({ userId, plannedWorkoutId });
  },
);

const getAdaptiveBlueprintCalendarReadModelForServer = createServerOnlyFn(async () => {
  const userId = await requirePersistedUserIdForCurrentRequest();
  const asOfDate = await getRunnerCalendarDateForUserId(userId);
  const { getAdaptiveBlueprintCalendarReadModelForUser } =
    await import("@/lib/adaptive-blueprint-read-model");

  return getAdaptiveBlueprintCalendarReadModelForUser(userId, asOfDate);
});

const getWorkoutDetailSidebarReadModelForServer = createServerOnlyFn(
  async (currentDate: string) => {
    const userId = await requirePersistedUserIdForCurrentRequest();
    const { getWorkoutDetailSidebarReadModelForUser } =
      await import("@/lib/workout-detail-sidebar-read-model");

    return getWorkoutDetailSidebarReadModelForUser({ userId, currentDate });
  },
);

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

function buildProfileDisplayName(profile: PersistedRunnerProfileRow | null) {
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
