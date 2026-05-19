import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_AUTH_REDIRECT, sanitizeRedirectPath } from "@/lib/auth-redirect";
import {
  BODY_NOTE_AREAS,
  BODY_NOTE_SENSATIONS,
  BODY_NOTE_TIMINGS,
  isBodyNoteArea,
  isBodyNoteSensation,
  isBodyNoteTiming,
  parseBodyNotesValue,
  type BodyNote,
} from "@/lib/body-notes";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type ImportedPlanSeed,
  type ImportedWorkoutSeed,
} from "@/lib/imported-plan";
import type { CapabilityLockedResponse } from "@/lib/entitlements/types";
import {
  applyImportedPlanForUser,
  createAssignedPlanFromImportedSeed,
  getActivePlan,
  getExistingPlanContext,
  getResolvedPlanWorkoutsWithLogs,
  rollbackInsertedPlan,
  type PersistedPlanCycleRow,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import {
  archiveActivePlanForUser as archiveActivePlanForUserWithSnapshot,
  clearUpcomingScheduleForUser as clearUpcomingScheduleForUserWithSnapshot,
  createClearUpcomingScheduleAction,
  createDeleteActivePlanAction,
} from "@/lib/active-plan-lifecycle-actions";
import {
  generateCanonicalPlanFromText,
  type GeneratedPlanResult,
} from "@/lib/openai-plan-authoring";
import type {
  ActivePlanRefreshFingerprint,
  ActivePlanRefreshProposal,
} from "@/lib/plan-refresh-proposal";
import type { RunnerCoachContext } from "@/lib/runner-coach-context";
import { type FirstDayResolution, type PlanApplyResult } from "@/lib/plan-apply-policy";
import {
  getPersistedUserIdForAuthContext,
  requirePersistedUserIdForCurrentRequest,
} from "@/lib/request-persisted-user";
import type { WorkoutResultFeedbackSummary } from "@/lib/workout-result-import/types";
import { buildImportedLogCarryForwardPlan } from "@/lib/persisted-plan-replacement";
import { findLocalAuthAccountByUserId, isLocalAuthBypassEnabled } from "@/lib/local-auth";
import {
  addDaysIso,
  diffDaysIso,
  deriveWeekStatus,
  findWorkout,
  getPreviewSnapshot,
  inferWorkoutStatus,
  normalizeExecutableStepInstructions,
  todayIso,
  weekdayLong,
  type RunnerProfileSummary,
  type Step,
  type TrainingSnapshot,
  type Workout,
  type WorkoutLog,
} from "@/lib/training";
import type { Database, Json } from "@/lib/supabase/database";
import { getRequestAuthContext, requireAuthenticatedUser } from "@/lib/backend/auth";
import { createAdminSupabaseClient, createRequestSupabaseClient } from "@/lib/supabase/server";
import {
  hasSupabaseBrowserEnv,
  isDevOnlyLocalAuthRuntime,
  publicEnv,
  resolveMagicLinkAppBaseUrl,
  resolveRuntimeAppBaseUrl,
} from "@/lib/supabase/env";
import {
  describeWeekdayRestInvariant,
  mergeWeekdayRestInvariantIntoPlanPreferences,
  validateWorkoutsAgainstWeekdayRestInvariant,
  WEEKDAY_NAMES,
  type WeekdayName,
  type WeekdayRestInvariant,
} from "@/lib/weekday-rest-invariants";

export {
  completeStructuredFirstPlanOnboarding,
  completeStructuredFirstPlanOnboardingForUser,
  confirmVoiceToPlanDraft,
  generateVoiceToPlanDraft,
  type ConfirmVoiceToPlanDraftResult,
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

export interface ViewerSummary {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface UserSettingsSummary {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
}

type ImportedPlanInput = z.infer<typeof importedPlanSchema>;

const loginInputSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().trim().max(500).optional().nullable(),
});

const firstDayResolutionSchema = z.enum(["replace_first_day", "ignore_first_day"]);
const requestedStartDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date in YYYY-MM-DD format.");
const activePlanRefreshProposalInputSchema = z.object({
  runnerPrompt: z.string().trim().min(8).max(1200),
});
const activePlanRefreshFingerprintSchema = z.object({
  schemaVersion: z.literal("active-plan-refresh-fingerprint-v1"),
  today: requestedStartDateSchema,
  activePlanId: z.string().uuid(),
  activePlanUpdatedAt: z.string().trim().min(1),
  firstMutableDate: requestedStartDateSchema.nullable(),
  lastMutableDate: requestedStartDateSchema.nullable(),
  weekdayRestInvariantSignature: z.string().trim(),
  remainingScheduleSignature: z.array(z.string()).max(80),
  recentHistorySignature: z.array(z.string()).max(80),
});
const activePlanRefreshApplyInputSchema = z.object({
  proposal: z.object({
    model: z.string().trim().min(1),
    responseId: z.string().trim().min(1).nullable(),
    output: z.object({
      proposalStatus: z.literal("proposal_only"),
      applyContext: z.object({
        generatedAt: z.string().trim().min(1),
        fingerprint: activePlanRefreshFingerprintSchema,
      }),
      review: z.object({
        summary: z.string().trim().min(1).max(400),
        proposedChanges: z.array(z.string().trim().min(1).max(220)).min(1).max(8),
      }),
      safety: z.object({
        requiresExplicitApply: z.literal(true),
        preservesPastAndLoggedHistory: z.literal(true),
        doesNotMutatePlan: z.literal(true),
      }),
      recommendedAuthoringPrompt: z.string().trim().min(20).max(1600),
    }),
  }),
});
type ActivePlanRefreshApplyPayload = z.output<typeof activePlanRefreshApplyInputSchema>["proposal"];
const refreshApplyGoalTypes = [
  "build_consistency",
  "distance_build",
  "5k",
  "10k",
  "half_marathon",
  "marathon",
] as const;
type RefreshApplyGoalType = (typeof refreshApplyGoalTypes)[number];
const refreshApplyExperienceLevels = [
  "new_runner",
  "returning_runner",
  "consistent_runner",
  "experienced_runner",
] as const;
type RefreshApplyExperienceLevel = (typeof refreshApplyExperienceLevels)[number];
const refreshApplyEffortLanguages = ["pace", "heart_rate", "rpe", "mixed"] as const;
type RefreshApplyEffortLanguage = (typeof refreshApplyEffortLanguages)[number];

const onboardingInputSchema = z.object({
  importedPlan: importedPlanSchema,
  firstDayResolution: firstDayResolutionSchema.optional().nullable(),
  requestedStartDate: requestedStartDateSchema.optional().nullable(),
});

const emailOtpTypeSchema = z.enum([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

const textAuthoringInputSchema = z.object({
  authoringText: z.string().trim().min(20).max(4000),
  firstDayResolution: firstDayResolutionSchema.optional().nullable(),
});

const bodyNoteSchema = z
  .object({
    area: z.string().trim(),
    severity: z.number().int().min(1).max(5),
    timing: z.string().trim(),
    sensation: z.string().trim().nullable(),
    note: z.string().trim().max(300).nullable(),
  })
  .transform((value): BodyNote => {
    if (!isBodyNoteArea(value.area)) {
      throw new Error("Choose a supported body area.");
    }

    if (!isBodyNoteTiming(value.timing)) {
      throw new Error("Choose when the issue showed up.");
    }

    if (value.sensation && !isBodyNoteSensation(value.sensation)) {
      throw new Error("Choose a supported sensation.");
    }

    const sensation =
      value.sensation && isBodyNoteSensation(value.sensation) ? value.sensation : null;

    return {
      area: value.area,
      severity: value.severity as BodyNote["severity"],
      timing: value.timing,
      sensation,
      note: value.note || null,
    };
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
    bodyNotes: z.array(bodyNoteSchema).max(8),
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

const userSettingsInputSchema = z.object({
  firstName: z.string().trim().max(80).nullable(),
  lastName: z.string().trim().max(80).nullable(),
  displayName: z.string().trim().max(120).nullable(),
  age: z.number().int().min(0).max(120).nullable(),
  weightKg: z.number().min(0).max(500).nullable(),
  heightCm: z.number().min(0).max(300).nullable(),
});

export type ProposeActivePlanRefreshResult =
  | {
      ok: true;
      proposal: ActivePlanRefreshProposal;
    }
  | CapabilityLockedResponse;

export type ApplyActivePlanRefreshProposalResult =
  | {
      ok: true;
      status: "applied";
      archivedPlanId: string;
      activePlanId: string;
      fixedWorkoutCount: number;
      refreshedWorkoutCount: number;
      snapshot: TrainingSnapshot;
    }
  | {
      ok: false;
      status: "stale";
      reason: "stale_proposal";
      message: string;
    }
  | {
      ok: false;
      status: "blocked";
      reason: "invalid_refresh_plan";
      message: string;
    };

export const getHomeRouteData = createServerFn({ method: "GET" }).handler(async () => {
  const auth = getRequestAuthContext();

  return {
    snapshot: await getSnapshotForRequest(),
    viewer: await getViewerForRequest(),
    localBypassEnabled: await isLocalAuthBypassEnabledForCurrentRequest(auth.appBaseUrl),
    magicLinkEnabled: canUseMagicLinkForCurrentRequest(auth.appBaseUrl),
  };
});

export const getShellRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return {
    snapshot: await getSnapshotForRequest(),
    viewer: await getViewerForRequest(),
  };
});

export const getLoginRouteData = createServerFn({ method: "GET" }).handler(async () => {
  const auth = getRequestAuthContext();

  return {
    snapshot: await getSnapshotForRequest(),
    viewer: await getViewerForRequest(),
    localBypassEnabled: await isLocalAuthBypassEnabledForCurrentRequest(auth.appBaseUrl),
    magicLinkEnabled: canUseMagicLinkForCurrentRequest(auth.appBaseUrl),
  };
});

export const getWorkoutRouteData = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => z.object({ date: z.string() }).parse(value))
  .handler(async ({ data }) => {
    const snapshot = await getSnapshotForRequest();

    if (snapshot.mode === "onboarding") {
      return {
        snapshot,
        viewer: await getViewerForRequest(),
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
      snapshot.source === "persisted" && workout
        ? await getLatestWorkoutResultFeedbackForServer(workout.id)
        : null;

    return {
      snapshot,
      viewer: await getViewerForRequest(),
      workout,
      prev: workoutIndex > 0 ? snapshot.workouts[workoutIndex - 1] : null,
      next:
        workoutIndex >= 0 && workoutIndex < snapshot.workouts.length - 1
          ? snapshot.workouts[workoutIndex + 1]
          : null,
      feedback,
    };
  });

export const getProgressRouteData = createServerFn({ method: "GET" }).handler(async () => {
  return {
    snapshot: await getSnapshotForRequest(),
    viewer: await getViewerForRequest(),
  };
});

export const getSettingsRouteData = createServerFn({ method: "GET" }).handler(async () => {
  const auth = getRequestAuthContext();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  return {
    snapshot: await getSnapshotForRequest(),
    viewer: await getViewerForRequest(),
    settings: persistedUserId ? await getUserSettingsForUserId(persistedUserId, auth.email) : null,
  };
});

export const requestMagicLink = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => loginInputSchema.parse(value))
  .handler(async ({ data }) => {
    const auth = getRequestAuthContext();
    const magicLinkAppBaseUrl = getMagicLinkAppBaseUrl(auth.appBaseUrl);

    if (!hasSupabaseBrowserEnv) {
      throw new Error(
        "Magic link sign-in is not configured in this environment yet. Add real Supabase env values to test login.",
      );
    }

    if (!magicLinkAppBaseUrl) {
      throw new Error(
        "Email sign-in links are not available from this local runtime. Use local login here, or open Hito from a public app URL before requesting a sign-in link.",
      );
    }

    const supabase = createClient<Database>(
      publicEnv.supabaseUrl!,
      publicEnv.supabasePublishableKey!,
      {
        auth: {
          autoRefreshToken: false,
          flowType: "pkce",
          persistSession: false,
        },
      },
    );
    const redirectTo = new URL("/api/auth/confirm", magicLinkAppBaseUrl);
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
    return persistImportedPlanForCurrentRequest(
      data.importedPlan,
      data.firstDayResolution ?? null,
      data.requestedStartDate ?? null,
    );
  });

export const deleteActivePlan = createDeleteActivePlanAction(getPersistedSnapshot);

export const clearUpcomingSchedule = createClearUpcomingScheduleAction(getPersistedSnapshot);

export const proposeActivePlanRefresh = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => activePlanRefreshProposalInputSchema.parse(value))
  .handler(async ({ data }): Promise<ProposeActivePlanRefreshResult> => {
    const auth = requireAuthenticatedUser();
    const persistedUserId = await getPersistedUserIdForAuthContext(auth);

    if (!persistedUserId) {
      throw new Error("Authentication is required for this action.");
    }

    const { checkRunnerCapability, capabilityLockedResponse } =
      await import("@/lib/entitlements/check-runner-capability");
    const capabilityCheck = await checkRunnerCapability({
      userId: persistedUserId,
      capabilityKey: "ai_plan_update",
    });

    if (!capabilityCheck.allowed) {
      return capabilityLockedResponse(capabilityCheck);
    }

    const { buildRunnerCoachContext } = await import("@/lib/runner-coach-context");
    const { generateActivePlanRefreshProposal } = await import("@/lib/plan-refresh-proposal");
    const context = await buildRunnerCoachContext({ userId: persistedUserId });
    const proposal = await generateActivePlanRefreshProposal({
      context,
      runnerPrompt: data.runnerPrompt,
    });
    const { recordRunnerCapabilityUsage } =
      await import("@/lib/entitlements/record-runner-capability-usage");
    await recordRunnerCapabilityUsage({
      userId: persistedUserId,
      capabilityKey: "ai_plan_update",
    });

    return {
      ok: true,
      proposal,
    };
  });

export const applyActivePlanRefreshProposal = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => activePlanRefreshApplyInputSchema.parse(value))
  .handler(async ({ data }): Promise<ApplyActivePlanRefreshProposalResult> => {
    const auth = requireAuthenticatedUser();
    const persistedUserId = await getPersistedUserIdForAuthContext(auth);

    if (!persistedUserId) {
      throw new Error("Authentication is required for this action.");
    }

    return applyActivePlanRefreshProposalForUser(persistedUserId, data.proposal);
  });

export const completeTextOnboarding = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => textAuthoringInputSchema.parse(value))
  .handler(async ({ data }) => {
    const generatedPlan = await generateCanonicalPlanFromText(data.authoringText);
    const applyResult = await persistImportedPlanForCurrentRequest(
      generatedPlan.canonicalPlan,
      data.firstDayResolution ?? null,
    );

    return applyResult.ok
      ? {
          ...applyResult,
          schemaVersion: generatedPlan.canonicalPlan.schema_version,
          sourceKind: generatedPlan.canonicalPlan.source_kind,
          workoutCount: generatedPlan.canonicalPlan.planned_workouts.length,
          model: generatedPlan.model,
          responseId: generatedPlan.responseId,
        }
      : {
          ...applyResult,
          schemaVersion: generatedPlan.canonicalPlan.schema_version,
          sourceKind: generatedPlan.canonicalPlan.source_kind,
          workoutCount: generatedPlan.canonicalPlan.planned_workouts.length,
          model: generatedPlan.model,
          responseId: generatedPlan.responseId,
          importedPlan: generatedPlan.canonicalPlan,
        };
  });

export const saveWorkoutLog = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => workoutLogInputSchema.parse(value))
  .handler(async ({ data }) => {
    return savePersistedWorkoutLog(await requirePersistedUserIdForCurrentRequest(), data);
  });

export const saveUserSettings = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => userSettingsInputSchema.parse(value))
  .handler(async ({ data }) => {
    const userId = await requirePersistedUserIdForCurrentRequest();
    const settings = await updateUserSettingsForUserId(userId, data);

    return {
      ok: true,
      settings,
    };
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
        body_notes: data.bodyNotes,
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
  importedPlan: ImportedPlanInput,
  firstDayResolution: FirstDayResolution | null,
  requestedStartDate: string | null = null,
): Promise<PlanApplyResult> {
  const auth = requireAuthenticatedUser();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  if (!persistedUserId) {
    throw new Error("Authentication is required for this action.");
  }

  return applyImportedPlanForUser(
    persistedUserId,
    importedPlan,
    firstDayResolution,
    requestedStartDate,
  );
}

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
  const { buildRunnerCoachContext } = await import("@/lib/runner-coach-context");
  const { buildActivePlanRefreshFingerprint } = await import("@/lib/plan-refresh-proposal");
  const currentContext = await buildRunnerCoachContext({ userId });

  if (!currentContext.activePlan) {
    return staleActivePlanRefreshResult();
  }

  const currentFingerprint = buildActivePlanRefreshFingerprint(currentContext);

  if (
    !sameActivePlanRefreshFingerprint(proposal.output.applyContext.fingerprint, currentFingerprint)
  ) {
    return staleActivePlanRefreshResult();
  }

  let refreshTimeline: RefreshApplyTimeline;

  try {
    refreshTimeline = buildRefreshApplyTimeline(currentContext);
  } catch {
    return blockedActivePlanRefreshApplyResult();
  }

  const generatedPlanResult = await generateRefreshApplyPlan(proposal, {
    context: currentContext,
    timeline: refreshTimeline,
    weekdayRestInvariant: currentContext.weekdayRestInvariant,
  });

  if (!generatedPlanResult.ok) {
    return blockedActivePlanRefreshApplyResult();
  }

  const refreshedSeed = buildImportedPlanSeed(generatedPlanResult.generatedPlan.canonicalPlan);
  const planContext = await getExistingPlanContext(userId);

  if (!planContext.activePlan || planContext.activePlan.id !== currentFingerprint.activePlanId) {
    return staleActivePlanRefreshResult();
  }

  const preparedRefresh = prepareActivePlanRefreshReplacementSafely({
    currentPlan: planContext.activePlan,
    existingWorkouts: planContext.existingWorkouts,
    generatedSeed: refreshedSeed,
    proposal,
    fingerprint: currentFingerprint,
    weekdayRestInvariant: currentContext.weekdayRestInvariant,
  });

  if (!preparedRefresh.ok) {
    return blockedActivePlanRefreshApplyResult();
  }

  const replacement = await replaceActivePlanWithRefreshSeed(
    userId,
    preparedRefresh.value.importedSeed,
    preparedRefresh.value.copiedLogs,
    planContext.activePlan,
  );

  return {
    ok: true,
    status: "applied",
    archivedPlanId: replacement.archivedPlanId,
    activePlanId: replacement.activePlanId,
    fixedWorkoutCount: preparedRefresh.value.fixedWorkoutCount,
    refreshedWorkoutCount: preparedRefresh.value.refreshedWorkoutCount,
    snapshot: await getPersistedSnapshot(userId),
  };
}

function staleActivePlanRefreshResult(): ApplyActivePlanRefreshProposalResult {
  return {
    ok: false,
    status: "stale",
    reason: "stale_proposal",
    message: "This proposal is no longer current. Review a fresh update before applying changes.",
  };
}

function blockedActivePlanRefreshApplyResult(): ApplyActivePlanRefreshProposalResult {
  return {
    ok: false,
    status: "blocked",
    reason: "invalid_refresh_plan",
    message:
      "This proposal no longer fits the remaining schedule safely. Generate a fresh proposal before applying changes.",
  };
}

function sameActivePlanRefreshFingerprint(
  expected: ActivePlanRefreshFingerprint,
  current: ActivePlanRefreshFingerprint,
) {
  return stableJsonStringify(expected) === stableJsonStringify(current);
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    );
  }

  return value;
}

interface RefreshApplyTimeline {
  startDate: string;
  targetDate: string | null;
  preparationHorizonWeeks: number;
  sourceTargetDate: string | null;
}

function buildRefreshApplyTimeline(context: RunnerCoachContext): RefreshApplyTimeline {
  const startDate = context.refreshBoundary.firstMutableDate;

  if (!startDate) {
    throw new Error("There is no remaining active schedule to update.");
  }

  const remainingEndDate = context.refreshBoundary.lastMutableDate ?? startDate;
  const sourceTargetDate = context.activePlan?.targetDate ?? null;
  const targetDate =
    sourceTargetDate && diffDaysIso(sourceTargetDate, startDate) >= 6 ? sourceTargetDate : null;
  const horizonEndDate = targetDate ?? remainingEndDate;
  const preparationHorizonWeeks = Math.max(
    1,
    Math.ceil((diffDaysIso(horizonEndDate, startDate) + 1) / 7),
  );

  return {
    startDate,
    targetDate,
    preparationHorizonWeeks,
    sourceTargetDate,
  };
}

async function generateRefreshApplyPlan(
  proposal: ActivePlanRefreshApplyPayload,
  {
    context,
    timeline,
    weekdayRestInvariant,
  }: {
    context: RunnerCoachContext;
    timeline: RefreshApplyTimeline;
    weekdayRestInvariant: WeekdayRestInvariant;
  },
): Promise<{ ok: true; generatedPlan: GeneratedPlanResult } | { ok: false }> {
  try {
    const generatedPlan = await generateCanonicalPlanFromText(
      buildRefreshApplyAuthoringPrompt(proposal, weekdayRestInvariant, timeline),
      {
        repairAuthoringInput: (value) =>
          repairRefreshApplyAuthoringInput(value, {
            context,
            timeline,
            weekdayRestInvariant,
          }),
        validationErrorPrefix: "Refresh apply authoring input failed validation",
      },
    );

    return { ok: true, generatedPlan };
  } catch {
    return { ok: false };
  }
}

function repairRefreshApplyAuthoringInput(
  value: unknown,
  {
    context,
    timeline,
    weekdayRestInvariant,
  }: {
    context: RunnerCoachContext;
    timeline: RefreshApplyTimeline;
    weekdayRestInvariant: WeekdayRestInvariant;
  },
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  const schedule =
    record.schedule && typeof record.schedule === "object" && !Array.isArray(record.schedule)
      ? (record.schedule as Record<string, unknown>)
      : {};

  return {
    ...record,
    goal: repairRefreshApplyGoal(record.goal, context),
    schedule: {
      ...schedule,
      startDate: timeline.startDate,
      targetDate: timeline.targetDate,
      preparationHorizonWeeks: timeline.preparationHorizonWeeks,
    },
    runnerProfile: repairRefreshApplyRunnerProfile(record.runnerProfile, context),
    availability: repairRefreshApplyAvailability(
      record.availability,
      weekdayRestInvariant,
      context,
    ),
  };
}

function repairRefreshApplyGoal(value: unknown, context: RunnerCoachContext) {
  const goal = readObjectRecord(value);

  if (!goal) {
    return value;
  }

  return {
    ...goal,
    goalType: normalizeRefreshApplyGoalType(goal.goalType, context),
    goalLabel:
      readTrimmedString(goal.goalLabel) ??
      context.runner.goalLabel ??
      context.activePlan?.goalSummary ??
      context.activePlan?.title ??
      "Updated running plan",
    targetEventName: readNullableTrimmedString(goal.targetEventName),
  };
}

function normalizeRefreshApplyGoalType(
  value: unknown,
  context: RunnerCoachContext,
): RefreshApplyGoalType {
  const directGoalType = normalizeGoalTypeCandidate(readTrimmedString(value));

  if (isRefreshApplyGoalType(directGoalType)) {
    return directGoalType;
  }

  for (const candidate of [
    context.activePlan?.goalSummary,
    context.runner.goalLabel,
    context.activePlan?.title,
    context.runner.goalType,
  ]) {
    const inferredGoalType = inferRefreshApplyGoalType(candidate);

    if (inferredGoalType) {
      return inferredGoalType;
    }
  }

  return context.runner.goalType === "build_consistency" ? "build_consistency" : "distance_build";
}

function inferRefreshApplyGoalType(value: unknown): RefreshApplyGoalType | null {
  const text = readTrimmedString(value)?.toLowerCase() ?? "";

  if (!text) return null;
  if (/\bhalf[\s_-]*marathon\b/.test(text)) return "half_marathon";
  if (/\bmarathon\b/.test(text)) return "marathon";
  if (/\b10[\s_-]*k\b/.test(text)) return "10k";
  if (/\b5[\s_-]*k\b/.test(text)) return "5k";
  if (/consistency|consistent/.test(text)) return "build_consistency";
  if (/distance|base|build/.test(text)) return "distance_build";

  return null;
}

function normalizeGoalTypeCandidate(value: string | null): string | null {
  return value?.toLowerCase().replace(/[\s-]+/g, "_") ?? null;
}

function repairRefreshApplyRunnerProfile(value: unknown, context: RunnerCoachContext) {
  const runnerProfile = readObjectRecord(value);

  if (!runnerProfile) {
    return value;
  }

  const modelBaselineDurationMin = readIntegerInRange(
    runnerProfile.baselineLongRunDurationMin,
    20,
    300,
  );
  const fallbackBaselineLongRunKm =
    readNumberInRange(context.runner.baselineLongRunKm, 0.1, 80) ??
    deriveRefreshApplyBaselineLongRunKm(context);
  const modelBaselineLongRunKm = readNumberInRange(runnerProfile.baselineLongRunKm, 0.1, 80);

  return {
    ...runnerProfile,
    experienceLevel: readRefreshApplyExperienceLevel(runnerProfile.experienceLevel),
    baselineSessionsPerWeek:
      readIntegerInRange(runnerProfile.baselineSessionsPerWeek, 1, 7) ??
      readIntegerInRange(context.runner.baselineSessionsPerWeek, 1, 7) ??
      3,
    baselineLongRunKm:
      modelBaselineLongRunKm ??
      (modelBaselineDurationMin == null ? fallbackBaselineLongRunKm : null),
    baselineLongRunDurationMin: modelBaselineDurationMin,
    age: readIntegerInRange(runnerProfile.age, 13, 100),
    recentInjuryRecoveryContext: readNullableTrimmedString(
      runnerProfile.recentInjuryRecoveryContext,
    ),
    preferredEffortLanguage: readRefreshApplyEffortLanguage(runnerProfile.preferredEffortLanguage),
  };
}

function deriveRefreshApplyBaselineLongRunKm(context: RunnerCoachContext) {
  const plannedDistances = context.remainingActiveSchedule
    .map((workout) => workout.plannedDistanceKm)
    .filter((value): value is number => typeof value === "number" && value > 0);

  if (plannedDistances.length > 0) {
    return Math.min(80, Math.max(...plannedDistances));
  }

  return 8;
}

function repairRefreshApplyAvailability(
  value: unknown,
  weekdayRestInvariant: WeekdayRestInvariant,
  context: RunnerCoachContext,
) {
  const availability = readObjectRecord(value);

  if (!availability) {
    return value;
  }

  const blockedWeekdays = uniqueWeekdayNames(weekdayRestInvariant.blockedWeekdays);
  const modelUnavailableDays = readWeekdayNames(availability.unavailableDays);
  const unavailableDays = uniqueWeekdayNames([...modelUnavailableDays, ...blockedWeekdays]);
  const allowedWeekdays = WEEKDAY_NAMES.filter((weekday) => !unavailableDays.includes(weekday));

  if (!allowedWeekdays.length) return value;

  const requestedMaxRunningDays =
    typeof availability.maxRunningDaysPerWeek === "number" &&
    Number.isInteger(availability.maxRunningDaysPerWeek)
      ? availability.maxRunningDaysPerWeek
      : allowedWeekdays.length;
  const maxRunningDaysPerWeek = Math.min(
    Math.max(1, requestedMaxRunningDays),
    allowedWeekdays.length,
  );
  const modelPreferredDays = readWeekdayNames(availability.preferredRunningDays).filter((weekday) =>
    allowedWeekdays.includes(weekday),
  );
  const contextPreferredDays = deriveRefreshApplyPreferredWeekdays(context, allowedWeekdays);
  const preferredRunningDays = (
    modelPreferredDays.length
      ? modelPreferredDays
      : contextPreferredDays.length
        ? contextPreferredDays
        : allowedWeekdays
  ).slice(0, maxRunningDaysPerWeek);
  const modelLongRunDay = readWeekdayName(availability.preferredLongRunDay);
  const preferredLongRunDay =
    modelLongRunDay && preferredRunningDays.includes(modelLongRunDay)
      ? modelLongRunDay
      : (preferredRunningDays.at(-1) ?? null);

  return {
    ...availability,
    preferredRunningDays,
    unavailableDays,
    maxRunningDaysPerWeek: preferredRunningDays.length,
    allowBackToBackDays:
      typeof availability.allowBackToBackDays === "boolean"
        ? availability.allowBackToBackDays
        : false,
    preferredLongRunDay,
  };
}

function deriveRefreshApplyPreferredWeekdays(
  context: RunnerCoachContext,
  allowedWeekdays: WeekdayName[],
) {
  return uniqueWeekdayNames(
    context.remainingActiveSchedule
      .filter((workout) => workout.workoutType !== "rest")
      .map((workout) => weekdayLong(workout.date)),
  ).filter((weekday) => allowedWeekdays.includes(weekday));
}

function readWeekdayNames(value: unknown): WeekdayName[] {
  return uniqueWeekdayNames(Array.isArray(value) ? value : []);
}

function readWeekdayName(value: unknown): WeekdayName | null {
  return typeof value === "string" && isWeekdayName(value) ? value : null;
}

function uniqueWeekdayNames(values: readonly unknown[]): WeekdayName[] {
  const weekdays = values.filter(isWeekdayName);

  return WEEKDAY_NAMES.filter((weekday) => weekdays.includes(weekday));
}

function isWeekdayName(value: unknown): value is WeekdayName {
  return typeof value === "string" && WEEKDAY_NAMES.includes(value as WeekdayName);
}

function readObjectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNullableTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumberInRange(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value
    : null;
}

function readIntegerInRange(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;
}

function readRefreshApplyExperienceLevel(value: unknown): RefreshApplyExperienceLevel {
  return typeof value === "string" &&
    refreshApplyExperienceLevels.includes(value as RefreshApplyExperienceLevel)
    ? (value as RefreshApplyExperienceLevel)
    : "consistent_runner";
}

function readRefreshApplyEffortLanguage(value: unknown): RefreshApplyEffortLanguage | null {
  return typeof value === "string" &&
    refreshApplyEffortLanguages.includes(value as RefreshApplyEffortLanguage)
    ? (value as RefreshApplyEffortLanguage)
    : "rpe";
}

function isRefreshApplyGoalType(value: unknown): value is RefreshApplyGoalType {
  return typeof value === "string" && refreshApplyGoalTypes.includes(value as RefreshApplyGoalType);
}

function prepareActivePlanRefreshReplacementSafely(
  input: Parameters<typeof prepareActivePlanRefreshReplacement>[0],
) {
  try {
    return { ok: true as const, value: prepareActivePlanRefreshReplacement(input) };
  } catch {
    return { ok: false as const };
  }
}

function buildRefreshApplyAuthoringPrompt(
  proposal: ActivePlanRefreshApplyPayload,
  weekdayRestInvariant: WeekdayRestInvariant,
  timeline: RefreshApplyTimeline,
) {
  return [
    "Apply the approved Hito Running active-plan refresh proposal.",
    "Generate a canonical replacement plan for the remaining active schedule only.",
    "Past workouts and logged history are fixed and must not be rewritten.",
    "Keep the same runner goal unless the proposal explicitly says otherwise.",
    `Use schedule.startDate exactly ${timeline.startDate}.`,
    timeline.targetDate
      ? `Use schedule.targetDate exactly ${timeline.targetDate}.`
      : `Set schedule.targetDate to null because the original target date ${timeline.sourceTargetDate ?? "is unavailable"} is not valid for this refresh start.`,
    `Use schedule.preparationHorizonWeeks exactly ${timeline.preparationHorizonWeeks}.`,
    describeWeekdayRestInvariant(weekdayRestInvariant),
    weekdayRestInvariant.blockedWeekdays.length
      ? "Set availability.unavailableDays to the fixed rest days and do not include those days in availability.preferredRunningDays or availability.preferredLongRunDay."
      : "No fixed weekday rest-day constraint is currently available.",
    "Approved runner-facing summary:",
    proposal.output.review.summary,
    "Approved runner-facing changes:",
    ...proposal.output.review.proposedChanges.map((change) => `- ${change}`),
    "Bounded authoring instruction:",
    proposal.output.recommendedAuthoringPrompt,
  ].join("\n");
}

function prepareActivePlanRefreshReplacement({
  currentPlan,
  existingWorkouts,
  generatedSeed,
  proposal,
  fingerprint,
  weekdayRestInvariant,
}: {
  currentPlan: PersistedPlanCycleRow;
  existingWorkouts: ExistingPlanContext["existingWorkouts"];
  generatedSeed: ImportedPlanSeed;
  proposal: ActivePlanRefreshApplyPayload;
  fingerprint: ActivePlanRefreshFingerprint;
  weekdayRestInvariant: WeekdayRestInvariant;
}) {
  const firstMutableDate = fingerprint.firstMutableDate;

  if (!firstMutableDate) {
    throw new Error("There is no remaining active schedule to update.");
  }

  const fixedRows = existingWorkouts.workouts.filter(
    (workout) =>
      workout.workout_date < firstMutableDate || existingWorkouts.logsByWorkoutId.has(workout.id),
  );
  const fixedDates = new Set(fixedRows.map((workout) => workout.workout_date));
  const shiftedGeneratedSeed = shiftImportedSeedToStartDate(generatedSeed, firstMutableDate);
  const refreshedWorkouts = shiftedGeneratedSeed.workouts.filter(
    (workout) =>
      workout.workoutDate >= firstMutableDate &&
      (!fingerprint.lastMutableDate || workout.workoutDate <= fingerprint.lastMutableDate) &&
      !fixedDates.has(workout.workoutDate),
  );
  validateWorkoutsAgainstWeekdayRestInvariant(refreshedWorkouts, weekdayRestInvariant);
  const combinedWorkouts = normalizeRefreshReplacementWorkouts([
    ...fixedRows.map((workout) => persistedWorkoutRowToRefreshSeed(workout)),
    ...refreshedWorkouts,
  ]);

  if (!refreshedWorkouts.length) {
    throw new Error("The approved refresh did not produce any remaining schedule workouts.");
  }

  if (!combinedWorkouts.length) {
    throw new Error("The approved refresh did not produce a usable replacement plan.");
  }

  const copiedLogs = fixedRows.flatMap((workout) => {
    const log = existingWorkouts.logsByWorkoutId.get(workout.id);

    return log ? [{ log, workoutDate: workout.workout_date }] : [];
  });

  return {
    importedSeed: {
      ...generatedSeed,
      title: currentPlan.title,
      goalSummary: currentPlan.goal_summary,
      sourceKind: "active_plan_refresh_v1",
      startDate: combinedWorkouts[0]!.workoutDate,
      endDate: combinedWorkouts.at(-1)!.workoutDate,
      targetDate: currentPlan.target_date,
      goalMetadata: currentPlan.goal_metadata,
      planPreferences: buildRefreshPlanPreferences(
        generatedSeed.planPreferences,
        proposal,
        fingerprint,
        weekdayRestInvariant,
      ),
      workouts: combinedWorkouts,
    },
    copiedLogs,
    fixedWorkoutCount: fixedRows.length,
    refreshedWorkoutCount: refreshedWorkouts.length,
  };
}

function shiftImportedSeedToStartDate(importedSeed: ImportedPlanSeed, startDate: string) {
  const dayOffset = diffDaysIso(startDate, importedSeed.startDate);

  if (dayOffset === 0) {
    return importedSeed;
  }

  const workouts = importedSeed.workouts.map((workout) => {
    const workoutDate = addDaysIso(workout.workoutDate, dayOffset);

    return {
      ...workout,
      workoutDate,
      weekday: weekdayLong(workoutDate),
    };
  });

  return {
    ...importedSeed,
    startDate,
    endDate: workouts.at(-1)?.workoutDate ?? startDate,
    targetDate: importedSeed.targetDate ? addDaysIso(importedSeed.targetDate, dayOffset) : null,
    workouts,
  };
}

function normalizeRefreshReplacementWorkouts(workouts: ImportedWorkoutSeed[]) {
  const sorted = workouts
    .slice()
    .sort((left, right) =>
      left.workoutDate === right.workoutDate
        ? left.displayOrder - right.displayOrder
        : left.workoutDate.localeCompare(right.workoutDate),
    );
  const startDate = sorted[0]?.workoutDate ?? null;

  return sorted.map((workout, index) => ({
    ...workout,
    weekday: weekdayLong(workout.workoutDate),
    weekNumber: startDate ? Math.floor(diffDaysIso(workout.workoutDate, startDate) / 7) + 1 : 1,
    displayOrder: index,
  }));
}

function persistedWorkoutRowToRefreshSeed(
  workout: PersistedPlannedWorkoutRow,
): ImportedWorkoutSeed {
  return {
    workoutDate: workout.workout_date,
    weekday: workout.weekday,
    weekNumber: workout.week_number,
    phase: workout.phase,
    workoutType: workout.workout_type,
    sourceWorkoutId: workout.source_workout_id ?? `fixed-${workout.id}`,
    sourceWorkoutType: workout.source_workout_type ?? workout.workout_type,
    title: workout.title,
    notes: workout.notes ?? null,
    plannedRpe: workout.planned_rpe ?? null,
    estimatedFatigue: workout.estimated_fatigue ?? null,
    recoveryPriority: workout.recovery_priority ?? null,
    steps: normalizeExecutableStepInstructions((workout.steps as Step[] | null) ?? []),
    displayOrder: workout.display_order,
  };
}

function buildRefreshPlanPreferences(
  planPreferences: Json | null,
  proposal: ActivePlanRefreshApplyPayload,
  fingerprint: ActivePlanRefreshFingerprint,
  weekdayRestInvariant: WeekdayRestInvariant,
): Json {
  const invariantAwarePreferences = mergeWeekdayRestInvariantIntoPlanPreferences(
    planPreferences,
    weekdayRestInvariant,
  );
  const base =
    invariantAwarePreferences &&
    typeof invariantAwarePreferences === "object" &&
    !Array.isArray(invariantAwarePreferences)
      ? invariantAwarePreferences
      : {};

  return {
    ...base,
    active_plan_refresh: {
      applied_at: new Date().toISOString(),
      proposal_generated_at: proposal.output.applyContext.generatedAt,
      proposal_model: proposal.model,
      proposal_response_id: proposal.responseId,
      source_active_plan_id: fingerprint.activePlanId,
      source_active_plan_updated_at: fingerprint.activePlanUpdatedAt,
      first_mutable_date: fingerprint.firstMutableDate,
      last_mutable_date: fingerprint.lastMutableDate,
      review_summary: proposal.output.review.summary,
      proposed_changes: proposal.output.review.proposedChanges,
    },
  } as Json;
}

async function replaceActivePlanWithRefreshSeed(
  userId: string,
  importedSeed: ImportedPlanSeed,
  copiedLogs: Array<{ log: PersistedWorkoutLogRow; workoutDate: string }>,
  activePlan: PersistedPlanCycleRow,
) {
  const supabase = createAdminSupabaseClient();
  const insertedPlan = await createAssignedPlanFromImportedSeed(userId, importedSeed, "archived");
  const insertedWorkoutsByDate = new Map(
    insertedPlan.workouts.map((workout) => [workout.workout_date, workout]),
  );

  if (copiedLogs.length > 0) {
    const copiedLogRows = copiedLogs.map(({ log, workoutDate }) => {
      const nextWorkout = insertedWorkoutsByDate.get(workoutDate);

      if (!nextWorkout) {
        throw new Error(
          `Plan refresh lost the inserted fixed-history workout for ${workoutDate}. Current plan is unchanged.`,
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
        body_notes: log.body_notes,
        logged_at: log.logged_at,
        updated_at: log.updated_at,
      };
    });

    const logInsert = await supabase.from("workout_logs").insert(copiedLogRows);

    if (logInsert.error) {
      await rollbackInsertedPlan(insertedPlan.planCycle.id);
      throw new Error(logInsert.error.message);
    }
  }

  const archiveExisting = await supabase
    .from("plan_cycles")
    .update({ status: "archived" })
    .eq("id", activePlan.id)
    .eq("user_id", userId)
    .eq("status", "active")
    .select("id")
    .single();

  if (archiveExisting.error) {
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw new Error(archiveExisting.error.message);
  }

  const activateInserted = await supabase
    .from("plan_cycles")
    .update({ status: "active" })
    .eq("id", insertedPlan.planCycle.id)
    .eq("status", "archived")
    .select("id")
    .single();

  if (activateInserted.error) {
    await supabase.from("plan_cycles").update({ status: "active" }).eq("id", activePlan.id);
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw new Error(activateInserted.error.message);
  }

  return {
    archivedPlanId: archiveExisting.data.id,
    activePlanId: activateInserted.data.id,
  };
}

export async function exchangeCodeForSession(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = parseEmailOtpType(url.searchParams.get("type"));
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

  if (!code && !(tokenHash && otpType)) {
    return redirectResponse(
      buildLoginRedirect("error", next, appBaseUrl).toString(),
      responseHeaders,
    );
  }

  const authResult = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: otpType!,
      });

  if (authResult.error) {
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

async function getUserSettingsForUserId(
  userId: string,
  email: string | null,
): Promise<UserSettingsSummary | null> {
  const profile = await getRunnerProfileRow(userId);

  if (!profile) {
    return null;
  }

  return {
    firstName: profile.first_name,
    lastName: profile.last_name,
    displayName: profile.display_name,
    email,
    avatarUrl: profile.avatar_url,
    age: profile.age,
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
  };
}

async function updateUserSettingsForUserId(
  userId: string,
  data: z.output<typeof userSettingsInputSchema>,
): Promise<UserSettingsSummary> {
  const supabase = createAdminSupabaseClient();
  const currentProfile = await getRunnerProfileRow(userId);

  if (!currentProfile) {
    throw new Error("Finish setup before editing user settings.");
  }

  const updatedProfile = await supabase
    .from("runner_profiles")
    .update({
      first_name: data.firstName || null,
      last_name: data.lastName || null,
      display_name: data.displayName || null,
      age: data.age,
      weight_kg: data.weightKg,
      height_cm: data.heightCm,
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updatedProfile.error) {
    throw new Error(updatedProfile.error.message);
  }

  const auth = getRequestAuthContext();

  return {
    firstName: updatedProfile.data.first_name,
    lastName: updatedProfile.data.last_name,
    displayName: updatedProfile.data.display_name,
    email: auth.email,
    avatarUrl: updatedProfile.data.avatar_url,
    age: updatedProfile.data.age,
    weightKg: updatedProfile.data.weight_kg,
    heightCm: updatedProfile.data.height_cm,
  };
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

  return {
    id: workout.id,
    date: workout.workout_date,
    weekday: workout.weekday,
    week: workout.week_number,
    phase: workout.phase,
    type: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    title: workout.title,
    notes: workout.notes,
    steps: normalizeExecutableStepInstructions((workout.steps as Step[] | null) ?? []),
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

function getRuntimeAppBaseUrl(request?: Request) {
  const { appBaseUrl } = getRequestAuthContext();
  const resolved = resolveRuntimeAppBaseUrl({
    requestUrl: request?.url,
    contextAppBaseUrl: appBaseUrl,
  });

  if (!resolved) {
    throw new Error(
      "Could not resolve the app base URL for this request. Use a real app origin or set APP_BASE_URL to a non-loopback public URL.",
    );
  }

  return resolved;
}

function getMagicLinkAppBaseUrl(appBaseUrl: string | null) {
  return resolveMagicLinkAppBaseUrl({
    contextAppBaseUrl: appBaseUrl,
  });
}

function canUseMagicLinkForCurrentRequest(appBaseUrl: string | null) {
  return hasSupabaseBrowserEnv && Boolean(getMagicLinkAppBaseUrl(appBaseUrl));
}

async function isLocalAuthBypassEnabledForCurrentRequest(appBaseUrl: string | null) {
  if (!isDevOnlyLocalAuthRuntime(appBaseUrl)) {
    return false;
  }

  return isLocalAuthBypassEnabled();
}

function buildLoginRedirect(status: "error", next: string, appBaseUrl: string) {
  const url = new URL("/login", appBaseUrl);
  url.searchParams.set("status", status);

  if (next !== DEFAULT_AUTH_REDIRECT) {
    url.searchParams.set("next", next);
  }

  return url;
}

function parseEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) {
    return null;
  }

  const parsed = emailOtpTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
