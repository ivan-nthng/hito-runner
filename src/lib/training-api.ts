import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_AUTH_REDIRECT, sanitizeRedirectPath } from "@/lib/auth-redirect";
import { buildImportedPlanSeed, importedPlanSchema } from "@/lib/imported-plan";
import {
  completeLocalAuthOnboarding,
  getLocalAuthSnapshot,
  saveLocalAuthWorkoutLog,
} from "@/lib/local-auth-store";
import { getLocalAuthConfig, isLocalAuthBypassEnabled } from "@/lib/local-auth";
import {
  addDaysIso,
  diffDaysIso,
  deriveWeekStatus,
  findWorkout,
  getPreviewSnapshot,
  inferWorkoutStatus,
  type RunnerProfileSummary,
  type Step,
  type TrainingSnapshot,
  type Workout,
  type WorkoutLog,
} from "@/lib/training";
import type { Database, Json } from "@/lib/supabase/database";
import { getRequestAuthContext, requireAuthenticatedUser } from "@/lib/backend/auth";
import { createAdminSupabaseClient, createRequestSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseBrowserEnv, publicEnv, serverEnv } from "@/lib/supabase/env";

const goalLabels = {
  build_consistency: "Build consistency",
  first_race: "Finish a first race",
  distance_build: "Build distance",
} as const;

const loginInputSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().trim().max(500).optional().nullable(),
});

const onboardingInputSchema = z.object({
  importedPlan: importedPlanSchema,
});

const workoutLogInputSchema = z
  .object({
    plannedWorkoutId: z.string().uuid(),
    outcome: z.enum(["completed", "partial", "skipped"]),
    actualDistanceKm: z.number().min(0).max(200).nullable(),
    actualDurationMin: z.number().int().min(0).max(1440).nullable(),
    rpe: z.number().int().min(1).max(10).nullable(),
    notes: z.string().trim().max(1000).nullable(),
    intervalsCompleted: z.number().int().min(0).max(100).nullable(),
  })
  .transform((value) => {
    if (value.outcome === "skipped") {
      return {
        ...value,
        actualDistanceKm: null,
        actualDurationMin: null,
        rpe: null,
        intervalsCompleted: null,
      };
    }

    return value;
  });

export const getHomeRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return {
    snapshot: await getSnapshotForRequest(),
    localBypassEnabled: isLocalAuthBypassEnabled(),
  };
});

export const getShellRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return {
    snapshot: await getSnapshotForRequest(),
  };
});

export const getLoginRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return {
    snapshot: await getSnapshotForRequest(),
    localBypassEnabled: isLocalAuthBypassEnabled(),
  };
});

export const getWorkoutRouteData = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => z.object({ date: z.string() }).parse(value))
  .handler(async ({ data }) => {
    const snapshot = await getSnapshotForRequest();

    if (snapshot.mode === "onboarding") {
      return {
        snapshot,
        workout: null as Workout | null,
        prev: null as Workout | null,
        next: null as Workout | null,
      };
    }

    const workout = findWorkout(snapshot.workouts, data.date) ?? null;
    const workoutIndex = workout
      ? snapshot.workouts.findIndex((entry) => entry.id === workout.id)
      : -1;

    return {
      snapshot,
      workout,
      prev: workoutIndex > 0 ? snapshot.workouts[workoutIndex - 1] : null,
      next:
        workoutIndex >= 0 && workoutIndex < snapshot.workouts.length - 1
          ? snapshot.workouts[workoutIndex + 1]
          : null,
    };
  });

export const getProgressRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return {
    snapshot: await getSnapshotForRequest(),
  };
});

export const requestMagicLink = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => loginInputSchema.parse(value))
  .handler(async ({ data }) => {
    if (!hasSupabaseBrowserEnv) {
      throw new Error(
        "Magic link sign-in is not configured in this environment yet. Add real Supabase env values to test login.",
      );
    }

    const supabase = createClient<Database>(
      publicEnv.supabaseUrl!,
      publicEnv.supabasePublishableKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    const redirectTo = new URL("/api/auth/confirm", getRuntimeAppBaseUrl());
    const next = sanitizeRedirectPath(data.next);
    redirectTo.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: redirectTo.toString(),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      ok: true,
    };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => onboardingInputSchema.parse(value))
  .handler(async ({ data }) => {
    const auth = requireAuthenticatedUser();
    const importedSeed = buildImportedPlanSeed(data.importedPlan);

    if (auth.provider === "local") {
      const localConfig = getRequiredLocalAuthConfig();

      await completeLocalAuthOnboarding(localConfig, data.importedPlan);

      return {
        ok: true,
      };
    }

    const { userId } = auth;
    const supabase = createAdminSupabaseClient();

    const profileUpsert = await supabase
      .from("runner_profiles")
      .upsert({
        user_id: userId,
        goal_type: importedSeed.profile.goalType,
        goal_label: importedSeed.profile.goalLabel,
        baseline_sessions_per_week: importedSeed.profile.baselineSessionsPerWeek,
        baseline_long_run_km: importedSeed.profile.baselineLongRunKm,
        baseline_notes: importedSeed.profile.baselineNotes ?? null,
        setup_state: "completed",
      })
      .select("*")
      .single();

    if (profileUpsert.error) {
      throw new Error(profileUpsert.error.message);
    }

    const existingPlan = await supabase
      .from("plan_cycles")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (existingPlan.error) {
      throw new Error(existingPlan.error.message);
    }

    if (!existingPlan.data) {
      await createAssignedPlanFromImportedInput(userId, data.importedPlan);
    }

    return {
      ok: true,
    };
  });

export const saveWorkoutLog = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => workoutLogInputSchema.parse(value))
  .handler(async ({ data }) => {
    const auth = requireAuthenticatedUser();

    if (auth.provider === "local") {
      const localConfig = getRequiredLocalAuthConfig();
      const result = await saveLocalAuthWorkoutLog(localConfig, {
        plannedWorkoutId: data.plannedWorkoutId,
        outcome: data.outcome,
        actualDistanceKm: data.actualDistanceKm,
        actualDurationMin: data.actualDurationMin,
        rpe: data.rpe,
        notes: data.notes,
        intervalsCompleted: data.intervalsCompleted,
      });

      return {
        ok: true,
        id: result.id,
      };
    }

    const { userId } = auth;
    const supabase = createAdminSupabaseClient();

    const plannedWorkout = await supabase
      .from("planned_workouts")
      .select("id, user_id, workout_type")
      .eq("id", data.plannedWorkoutId)
      .eq("user_id", userId)
      .maybeSingle();

    if (plannedWorkout.error) {
      throw new Error(plannedWorkout.error.message);
    }

    if (!plannedWorkout.data) {
      throw new Error("Planned workout not found.");
    }

    if (plannedWorkout.data.workout_type === "rest") {
      throw new Error("Rest days cannot be logged as completed workouts.");
    }

    const upsertResult = await supabase
      .from("workout_logs")
      .upsert({
        planned_workout_id: data.plannedWorkoutId,
        user_id: userId,
        outcome: data.outcome,
        actual_distance_km: data.actualDistanceKm,
        actual_duration_min: data.actualDurationMin,
        rpe: data.rpe,
        notes: data.notes,
        intervals_completed: data.intervalsCompleted,
      })
      .select("id")
      .single();

    if (upsertResult.error) {
      throw new Error(upsertResult.error.message);
    }

    return {
      ok: true,
      id: upsertResult.data.id,
    };
  });

export async function exchangeCodeForSession(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const appBaseUrl = getRuntimeAppBaseUrl(request);
  const next = sanitizeRedirectPath(url.searchParams.get("next"));
  const responseHeaders = new Headers();

  if (!hasSupabaseBrowserEnv) {
    return redirectResponse(
      buildLoginRedirect("error", next, appBaseUrl).toString(),
      responseHeaders,
    );
  }

  const supabase = createRequestSupabaseClient(request, responseHeaders);

  if (!code) {
    return redirectResponse(
      buildLoginRedirect("error", next, appBaseUrl).toString(),
      responseHeaders,
    );
  }

  const exchangeResult = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeResult.error) {
    return redirectResponse(
      buildLoginRedirect("error", next, appBaseUrl).toString(),
      responseHeaders,
    );
  }

  return redirectResponse(new URL(next, appBaseUrl).toString(), responseHeaders);
}

async function getSnapshotForRequest() {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    return getPreviewSnapshot();
  }

  if (auth.provider === "local") {
    return getLocalAuthSnapshot(getRequiredLocalAuthConfig());
  }

  return getPersistedSnapshot(auth.userId);
}

async function getPersistedSnapshot(userId: string): Promise<TrainingSnapshot> {
  const supabase = createAdminSupabaseClient();
  const profileResult = await supabase
    .from("runner_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (!profileResult.data) {
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

  const profile = profileRowToSummary(profileResult.data);
  const planCycle = await ensureActivePlan(userId, profile);
  const plannedWorkoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_cycle_id", planCycle.id)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (plannedWorkoutsResult.error) {
    throw new Error(plannedWorkoutsResult.error.message);
  }

  const workoutIds = plannedWorkoutsResult.data.map((workout) => workout.id);
  const logsResult = workoutIds.length
    ? await supabase.from("workout_logs").select("*").in("planned_workout_id", workoutIds)
    : { data: [], error: null };

  if (logsResult.error) {
    throw new Error(logsResult.error.message);
  }

  const logsByWorkoutId = new Map(logsResult.data.map((log) => [log.planned_workout_id, log]));
  const currentDate = todayIso();
  const workouts = plannedWorkoutsResult.data.map((workout) =>
    dbWorkoutToView(workout, logsByWorkoutId.get(workout.id) ?? null, currentDate),
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
      raceDate: planCycle.end_date,
      goal: planCycle.goal_summary,
      source: "persisted",
    },
    profile,
    workouts,
    weekStatus: deriveWeekStatus(workouts, currentDate),
  };
}

async function ensureActivePlan(userId: string, profile: RunnerProfileSummary) {
  const supabase = createAdminSupabaseClient();
  const existing = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data) {
    return existing.data;
  }

  return createAssignedPlan(userId, profile);
}

async function createAssignedPlan(userId: string, profile: RunnerProfileSummary) {
  const supabase = createAdminSupabaseClient();
  const preview = getPreviewSnapshot();
  const startDate = todayIso();
  const templateStart = preview.planMeta?.startDate ?? startDate;
  const endDate = addDaysIso(
    startDate,
    diffDaysIso(preview.workouts.at(-1)?.date ?? startDate, templateStart),
  );
  const title = `${goalLabels[profile.goalType]} plan`;
  const planInsert = await supabase
    .from("plan_cycles")
    .insert({
      user_id: userId,
      status: "active",
      title,
      goal_summary: `${goalLabels[profile.goalType]} with ${profile.baselineSessionsPerWeek} running day${profile.baselineSessionsPerWeek === 1 ? "" : "s"} per week.`,
      source_template: "baseline-import-v1",
      start_date: startDate,
      end_date: endDate,
    })
    .select("*")
    .single();

  if (planInsert.error) {
    throw new Error(planInsert.error.message);
  }

  const workouts = preview.workouts.map((workout, index) => {
    const shiftedDate = addDaysIso(startDate, diffDaysIso(workout.date, templateStart));

    return {
      plan_cycle_id: planInsert.data.id,
      user_id: userId,
      workout_date: shiftedDate,
      weekday: new Date(`${shiftedDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
      }),
      week_number: workout.week,
      phase: workout.phase,
      workout_type: workout.type,
      title: workout.title,
      notes: workout.notes,
      steps: workout.steps as Json,
      display_order: index,
    };
  });

  const workoutInsert = await supabase.from("planned_workouts").insert(workouts);

  if (workoutInsert.error) {
    throw new Error(workoutInsert.error.message);
  }

  return planInsert.data;
}

async function createAssignedPlanFromImportedInput(
  userId: string,
  importedPlan: z.infer<typeof importedPlanSchema>,
) {
  const supabase = createAdminSupabaseClient();
  const importedSeed = buildImportedPlanSeed(importedPlan);
  const planInsert = await supabase
    .from("plan_cycles")
    .insert({
      user_id: userId,
      status: "active",
      title: importedSeed.title,
      goal_summary: importedSeed.goalSummary,
      source_template: importedSeed.sourceTemplate,
      start_date: importedSeed.startDate,
      end_date: importedSeed.endDate,
    })
    .select("*")
    .single();

  if (planInsert.error) {
    throw new Error(planInsert.error.message);
  }

  const workouts = importedSeed.workouts.map((workout) => ({
    plan_cycle_id: planInsert.data.id,
    user_id: userId,
    workout_date: workout.workoutDate,
    weekday: workout.weekday,
    week_number: workout.weekNumber,
    phase: workout.phase,
    workout_type: workout.workoutType,
    title: workout.title,
    notes: workout.notes,
    steps: workout.steps as Json,
    display_order: workout.displayOrder,
  }));

  const workoutInsert = await supabase.from("planned_workouts").insert(workouts);

  if (workoutInsert.error) {
    throw new Error(workoutInsert.error.message);
  }

  return planInsert.data;
}

function dbWorkoutToView(
  workout: Database["public"]["Tables"]["planned_workouts"]["Row"],
  log: Database["public"]["Tables"]["workout_logs"]["Row"] | null,
  currentDate: string,
): Workout {
  const mappedLog = log ? logRowToView(log) : null;

  return {
    id: workout.id,
    date: workout.workout_date,
    weekday: workout.weekday,
    week: workout.week_number,
    phase: workout.phase,
    type: workout.workout_type,
    title: workout.title,
    notes: workout.notes,
    steps: (workout.steps as Step[]) ?? [],
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
  };
}

function redirectResponse(url: string, headers: Headers) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("location", url);
  return new Response(null, {
    status: 302,
    headers: responseHeaders,
  });
}

function getRuntimeAppBaseUrl(request?: Request) {
  if (serverEnv.appBaseUrl) {
    return new URL(serverEnv.appBaseUrl).origin;
  }

  if (request) {
    return new URL(request.url).origin;
  }

  const { appBaseUrl } = getRequestAuthContext();

  if (!appBaseUrl) {
    throw new Error(
      "Could not resolve the app base URL for this request. Set APP_BASE_URL or retry through the app runtime.",
    );
  }

  return appBaseUrl;
}

function getRequiredLocalAuthConfig() {
  const config = getLocalAuthConfig();

  if (!config) {
    throw new Error("Temporary local auth bypass is not configured in this environment.");
  }

  return config;
}

function buildLoginRedirect(status: "error", next: string, appBaseUrl: string) {
  const url = new URL("/login", appBaseUrl);
  url.searchParams.set("status", status);

  if (next !== DEFAULT_AUTH_REDIRECT) {
    url.searchParams.set("next", next);
  }

  return url;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
