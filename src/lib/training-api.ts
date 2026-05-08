import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_AUTH_REDIRECT, sanitizeRedirectPath } from "@/lib/auth-redirect";
import { buildImportedPlanSeed, importedPlanSchema } from "@/lib/imported-plan";
import { generateCanonicalPlanFromText } from "@/lib/openai-plan-authoring";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "@/lib/structured-plan-authoring";
import {
  buildImportedLogCarryForwardPlan,
  buildPersistedWorkoutInsertRows,
} from "@/lib/persisted-plan-replacement";
import {
  completeLocalAuthOnboarding,
  getLocalAuthSnapshot,
  saveLocalAuthWorkoutLog,
} from "@/lib/local-auth-store";
import {
  findLocalAuthAccountByUserId,
  getLocalAuthAccountSummaries,
  isLocalAuthBypassEnabled,
} from "@/lib/local-auth";
import { ensureLocalAuthSupabaseUserId } from "@/lib/local-auth-supabase";
import {
  addDaysIso,
  diffDaysIso,
  deriveWeekStatus,
  findWorkout,
  getPreviewSnapshot,
  inferWorkoutStatus,
  todayIso,
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

export interface ViewerSummary {
  name: string | null;
  email: string | null;
}

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type PersistedWorkoutLogRow = Database["public"]["Tables"]["workout_logs"]["Row"];

const loginInputSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().trim().max(500).optional().nullable(),
});

const onboardingInputSchema = z.object({
  importedPlan: importedPlanSchema,
});

const structuredOnboardingInputSchema = z.object({
  authoringInput: structuredPlanAuthoringInputSchema,
});

const textAuthoringInputSchema = z.object({
  authoringText: z.string().trim().min(20).max(4000),
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
    viewer: await getViewerForRequest(),
    localBypassEnabled: await isLocalAuthBypassEnabled(),
    localAccounts: await getLocalAuthAccountSummaries(),
    magicLinkEnabled: hasSupabaseBrowserEnv,
  };
});

export const getShellRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return {
    snapshot: await getSnapshotForRequest(),
    viewer: await getViewerForRequest(),
  };
});

export const getLoginRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return {
    snapshot: await getSnapshotForRequest(),
    viewer: await getViewerForRequest(),
    localBypassEnabled: await isLocalAuthBypassEnabled(),
    localAccounts: await getLocalAuthAccountSummaries(),
    magicLinkEnabled: hasSupabaseBrowserEnv,
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
      viewer: await getViewerForRequest(),
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
    viewer: await getViewerForRequest(),
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
    await persistImportedPlanForCurrentRequest(data.importedPlan);
    return {
      ok: true,
    };
  });

export const completeStructuredOnboarding = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => structuredOnboardingInputSchema.parse(value))
  .handler(async ({ data }) => {
    const generatedPlan = buildStructuredAuthoringPlan(data.authoringInput);
    await persistImportedPlanForCurrentRequest(generatedPlan);

    return {
      ok: true,
      schemaVersion: generatedPlan.schema_version,
      sourceKind: generatedPlan.source_kind,
      workoutCount: generatedPlan.planned_workouts.length,
    };
  });

export const completeTextOnboarding = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => textAuthoringInputSchema.parse(value))
  .handler(async ({ data }) => {
    const generatedPlan = await generateCanonicalPlanFromText(data.authoringText);
    await persistImportedPlanForCurrentRequest(generatedPlan.canonicalPlan);

    return {
      ok: true,
      schemaVersion: generatedPlan.canonicalPlan.schema_version,
      sourceKind: generatedPlan.canonicalPlan.source_kind,
      workoutCount: generatedPlan.canonicalPlan.planned_workouts.length,
      model: generatedPlan.model,
      responseId: generatedPlan.responseId,
    };
  });

export const saveWorkoutLog = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => workoutLogInputSchema.parse(value))
  .handler(async ({ data }) => {
    const auth = requireAuthenticatedUser();

    if (auth.provider === "local") {
      const localConfig = await getRequiredLocalAuthConfig(auth.userId);

      if (canUseSupabasePlanStorage()) {
        return savePersistedWorkoutLog(await ensureLocalAuthSupabaseUserId(localConfig), data);
      }

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

    return savePersistedWorkoutLog(auth.userId, data);
  });

async function savePersistedWorkoutLog(
  userId: string,
  data: z.output<typeof workoutLogInputSchema>,
) {
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
    .upsert(
      {
        planned_workout_id: data.plannedWorkoutId,
        user_id: userId,
        outcome: data.outcome,
        actual_distance_km: data.actualDistanceKm,
        actual_duration_min: data.actualDurationMin,
        rpe: data.rpe,
        notes: data.notes,
        intervals_completed: data.intervalsCompleted,
      },
      { onConflict: "planned_workout_id" },
    )
    .select("id")
    .single();

  if (upsertResult.error) {
    throw new Error(upsertResult.error.message);
  }

  return {
    ok: true,
    id: upsertResult.data.id,
  };
}

async function persistImportedPlanForCurrentRequest(
  importedPlan: z.infer<typeof importedPlanSchema>,
) {
  const auth = requireAuthenticatedUser();
  const importedSeed = buildImportedPlanSeed(importedPlan);

  if (auth.provider === "local") {
    const localConfig = await getRequiredLocalAuthConfig(auth.userId);

    if (canUseSupabasePlanStorage()) {
      const linkedUserId = await ensureLocalAuthSupabaseUserId(localConfig);
      await upsertRunnerProfile(linkedUserId, importedSeed.profile);
      await replaceActivePlanWithImportedInput(linkedUserId, importedPlan);
      return;
    }

    await completeLocalAuthOnboarding(localConfig, importedPlan);
    return;
  }

  await upsertRunnerProfile(auth.userId, importedSeed.profile);
  await replaceActivePlanWithImportedInput(auth.userId, importedPlan);
}

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
    const localConfig = await getRequiredLocalAuthConfig(auth.userId);

    if (canUseSupabasePlanStorage()) {
      return getPersistedSnapshot(await ensureLocalAuthSupabaseUserId(localConfig));
    }

    return getLocalAuthSnapshot(localConfig);
  }

  return getPersistedSnapshot(auth.userId);
}

async function getViewerForRequest(): Promise<ViewerSummary | null> {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    return null;
  }

  if (auth.provider === "local") {
    const account = await findLocalAuthAccountByUserId(auth.userId);
    return {
      name: account?.displayName ?? inferViewerName(auth.email),
      email: account?.email ?? auth.email,
    };
  }

  return {
    name: inferViewerName(auth.email),
    email: auth.email,
  };
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
  const { workouts: persistedWorkouts, logsByWorkoutId } = await getResolvedPlanWorkoutsWithLogs(
    userId,
    planCycle,
  );
  const currentDate = todayIso();
  const workouts = persistedWorkouts.map((workout) =>
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
  status: PersistedPlanCycleRow["status"] = "active",
) {
  const supabase = createAdminSupabaseClient();
  const importedSeed = buildImportedPlanSeed(importedPlan);
  const planInsert = await supabase
    .from("plan_cycles")
    .insert({
      user_id: userId,
      status,
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

  const workoutInsert = await supabase
    .from("planned_workouts")
    .insert(buildPersistedWorkoutInsertRows(planInsert.data.id, userId, importedSeed.workouts))
    .select("*");

  if (workoutInsert.error) {
    throw new Error(workoutInsert.error.message);
  }

  return {
    planCycle: planInsert.data,
    workouts: workoutInsert.data,
  };
}

async function replaceActivePlanWithImportedInput(
  userId: string,
  importedPlan: z.infer<typeof importedPlanSchema>,
) {
  const supabase = createAdminSupabaseClient();
  const importedSeed = buildImportedPlanSeed(importedPlan);
  const activePlanResult = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activePlanResult.error) {
    throw new Error(activePlanResult.error.message);
  }

  const activePlan = activePlanResult.data;

  const existingWorkouts = activePlan
    ? await getResolvedPlanWorkoutsWithLogs(userId, activePlan)
    : {
        workouts: [] as PersistedPlannedWorkoutRow[],
        logsByWorkoutId: new Map<string, PersistedWorkoutLogRow>(),
      };
  const preservationPlan = buildImportedLogCarryForwardPlan(
    existingWorkouts.workouts,
    existingWorkouts.logsByWorkoutId,
    importedSeed.workouts,
  );

  if (!preservationPlan.ok) {
    throw new Error(preservationPlan.message);
  }

  const insertedPlan = await createAssignedPlanFromImportedInput(
    userId,
    importedPlan,
    activePlan ? "archived" : "active",
  );
  const insertedWorkoutsByDate = new Map(
    insertedPlan.workouts.map((workout) => [workout.workout_date, workout]),
  );

  if (preservationPlan.logs.length > 0) {
    const copiedLogs = preservationPlan.logs.map(({ log, workoutDate }) => {
      const nextWorkout = insertedWorkoutsByDate.get(workoutDate);

      if (!nextWorkout) {
        throw new Error(
          `Imported plan replacement lost the inserted workout for ${workoutDate}. Current plan is unchanged.`,
        );
      }

      return {
        planned_workout_id: nextWorkout.id,
        user_id: userId,
        outcome: log.outcome,
        actual_distance_km: log.actual_distance_km,
        actual_duration_min: log.actual_duration_min,
        rpe: log.rpe,
        notes: log.notes,
        intervals_completed: log.intervals_completed,
        logged_at: log.logged_at,
        updated_at: log.updated_at,
      };
    });

    const logInsert = await supabase.from("workout_logs").insert(copiedLogs);

    if (logInsert.error) {
      await rollbackInsertedPlan(insertedPlan.planCycle.id);
      throw new Error(logInsert.error.message);
    }
  }

  if (!activePlan) {
    return insertedPlan.planCycle;
  }

  const archiveExisting = await supabase
    .from("plan_cycles")
    .update({ status: "archived" })
    .eq("id", activePlan.id)
    .eq("status", "active");

  if (archiveExisting.error) {
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw new Error(archiveExisting.error.message);
  }

  const activateInserted = await supabase
    .from("plan_cycles")
    .update({ status: "active" })
    .eq("id", insertedPlan.planCycle.id)
    .eq("status", "archived")
    .select("*")
    .single();

  if (activateInserted.error) {
    await supabase.from("plan_cycles").update({ status: "active" }).eq("id", activePlan.id);
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw new Error(activateInserted.error.message);
  }

  const deletePreviousPlan = await supabase.from("plan_cycles").delete().eq("id", activePlan.id);

  if (deletePreviousPlan.error) {
    throw new Error(deletePreviousPlan.error.message);
  }

  return activateInserted.data;
}

async function upsertRunnerProfile(userId: string, profile: RunnerProfileSummary) {
  const supabase = createAdminSupabaseClient();
  const profileUpsert = await supabase
    .from("runner_profiles")
    .upsert({
      user_id: userId,
      goal_type: profile.goalType,
      goal_label: profile.goalLabel,
      baseline_sessions_per_week: profile.baselineSessionsPerWeek,
      baseline_long_run_km: profile.baselineLongRunKm,
      baseline_notes: profile.baselineNotes ?? null,
      setup_state: "completed",
    })
    .select("user_id")
    .single();

  if (profileUpsert.error) {
    throw new Error(profileUpsert.error.message);
  }
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

async function getRequiredLocalAuthConfig(userId: string | null) {
  if (!userId) {
    throw new Error("Temporary local auth bypass could not resolve the current account.");
  }

  const config = await findLocalAuthAccountByUserId(userId);

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

function canUseSupabasePlanStorage() {
  return hasSupabaseBrowserEnv && Boolean(serverEnv.supabaseServiceRoleKey);
}

async function getPlanWorkoutsWithLogs(planCycleId: string) {
  const supabase = createAdminSupabaseClient();
  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_cycle_id", planCycleId)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  const workoutIds = workoutsResult.data.map((workout) => workout.id);
  const logsResult = workoutIds.length
    ? await supabase.from("workout_logs").select("*").in("planned_workout_id", workoutIds)
    : { data: [], error: null };

  if (logsResult.error) {
    throw new Error(logsResult.error.message);
  }

  return {
    workouts: workoutsResult.data,
    logsByWorkoutId: new Map(logsResult.data.map((log) => [log.planned_workout_id, log])),
  };
}

async function getResolvedPlanWorkoutsWithLogs(userId: string, planCycle: PersistedPlanCycleRow) {
  const direct = await getPlanWorkoutsWithLogs(planCycle.id);
  const recovered = await recoverArchivedLogsOntoActivePlan(userId, planCycle, direct);

  if (!recovered) {
    return direct;
  }

  return getPlanWorkoutsWithLogs(planCycle.id);
}

async function recoverArchivedLogsOntoActivePlan(
  userId: string,
  activePlan: PersistedPlanCycleRow,
  direct: {
    workouts: PersistedPlannedWorkoutRow[];
    logsByWorkoutId: Map<string, PersistedWorkoutLogRow>;
  },
) {
  const unresolvedDates = direct.workouts
    .filter((workout) => workout.workout_type !== "rest" && !direct.logsByWorkoutId.has(workout.id))
    .map((workout) => workout.workout_date);

  if (unresolvedDates.length === 0) {
    return false;
  }

  const supabase = createAdminSupabaseClient();
  const archivedPlansResult = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "archived")
    .eq("title", activePlan.title)
    .eq("start_date", activePlan.start_date)
    .eq("end_date", activePlan.end_date)
    .eq("source_template", activePlan.source_template)
    .order("created_at", { ascending: false });

  if (archivedPlansResult.error) {
    throw new Error(archivedPlansResult.error.message);
  }

  if (archivedPlansResult.data.length === 0) {
    return false;
  }

  const planOrder = new Map(archivedPlansResult.data.map((plan, index) => [plan.id, index]));
  const archivedPlanIds = archivedPlansResult.data.map((plan) => plan.id);
  const archivedWorkoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .in("plan_cycle_id", archivedPlanIds)
    .in("workout_date", unresolvedDates)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (archivedWorkoutsResult.error) {
    throw new Error(archivedWorkoutsResult.error.message);
  }

  const archivedWorkoutIds = archivedWorkoutsResult.data.map((workout) => workout.id);
  const archivedLogsResult = archivedWorkoutIds.length
    ? await supabase.from("workout_logs").select("*").in("planned_workout_id", archivedWorkoutIds)
    : { data: [], error: null };

  if (archivedLogsResult.error) {
    throw new Error(archivedLogsResult.error.message);
  }

  const archivedLogsByWorkoutId = new Map(
    archivedLogsResult.data.map((log) => [log.planned_workout_id, log]),
  );
  const archivedCandidatesByDate = new Map<
    string,
    Array<{
      planOrder: number;
      workout: PersistedPlannedWorkoutRow;
      log: PersistedWorkoutLogRow;
    }>
  >();

  for (const workout of archivedWorkoutsResult.data) {
    const log = archivedLogsByWorkoutId.get(workout.id);

    if (!log) {
      continue;
    }

    const entries = archivedCandidatesByDate.get(workout.workout_date) ?? [];
    entries.push({
      planOrder: planOrder.get(workout.plan_cycle_id) ?? Number.MAX_SAFE_INTEGER,
      workout,
      log,
    });
    archivedCandidatesByDate.set(workout.workout_date, entries);
  }

  const recoveredLogs = direct.workouts.flatMap((activeWorkout) => {
    if (activeWorkout.workout_type === "rest" || direct.logsByWorkoutId.has(activeWorkout.id)) {
      return [];
    }

    const candidates = archivedCandidatesByDate.get(activeWorkout.workout_date) ?? [];
    const matched = candidates
      .slice()
      .sort((left, right) => left.planOrder - right.planOrder)
      .find((candidate) => candidate.workout.workout_date === activeWorkout.workout_date);

    if (!matched) {
      return [];
    }

    return [
      {
        planned_workout_id: activeWorkout.id,
        user_id: userId,
        outcome: matched.log.outcome,
        actual_distance_km: matched.log.actual_distance_km,
        actual_duration_min: matched.log.actual_duration_min,
        rpe: matched.log.rpe,
        notes: matched.log.notes,
        intervals_completed: matched.log.intervals_completed,
        logged_at: matched.log.logged_at,
        updated_at: matched.log.updated_at,
      },
    ];
  });

  if (recoveredLogs.length === 0) {
    return false;
  }

  const recoveredInsert = await supabase.from("workout_logs").upsert(recoveredLogs, {
    onConflict: "planned_workout_id",
  });

  if (recoveredInsert.error) {
    throw new Error(recoveredInsert.error.message);
  }

  return true;
}

async function rollbackInsertedPlan(planCycleId: string) {
  const supabase = createAdminSupabaseClient();
  await supabase.from("plan_cycles").delete().eq("id", planCycleId);
}
