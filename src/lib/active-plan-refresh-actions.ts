import { z } from "zod";
import {
  createAssignedPlanFromImportedSeed,
  getExistingPlanContext,
  rollbackInsertedPlan,
  type ExistingPlanContext,
  type PersistedPlanCycleRow,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import {
  capabilityLockedResponse,
  checkRunnerCapability,
} from "@/lib/entitlements/check-runner-capability";
import { recordRunnerCapabilityUsage } from "@/lib/entitlements/record-runner-capability-usage";
import type { CapabilityLockedResponse } from "@/lib/entitlements/types";
import {
  buildImportedPlanSeed,
  type ImportedPlanSeed,
  type ImportedWorkoutSeed,
} from "@/lib/imported-plan";
import {
  generateCanonicalPlanFromText,
  type GeneratedPlanResult,
} from "@/lib/openai-plan-authoring";
import {
  type ActivePlanRefreshFingerprint,
  type ActivePlanRefreshProposal,
} from "@/lib/plan-refresh-proposal";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import type { RunnerCoachContext } from "@/lib/runner-coach-context";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/backend/auth";
import {
  addDaysIso,
  diffDaysIso,
  normalizeExecutableStepInstructions,
  weekdayLong,
  type Step,
  type TrainingSnapshot,
} from "@/lib/training";
import {
  describeWeekdayRestInvariant,
  mergeWeekdayRestInvariantIntoPlanPreferences,
  validateWorkoutsAgainstWeekdayRestInvariant,
  WEEKDAY_NAMES,
  type WeekdayName,
  type WeekdayRestInvariant,
} from "@/lib/weekday-rest-invariants";

type PersistedSnapshotLoader = (userId: string) => Promise<TrainingSnapshot>;

const requestedStartDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date in YYYY-MM-DD format.");

export const activePlanRefreshProposalInputSchema = z.object({
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

export const activePlanRefreshApplyInputSchema = z.object({
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

type ActivePlanRefreshProposalInput = z.output<typeof activePlanRefreshProposalInputSchema>;
export type ActivePlanRefreshApplyPayload = z.output<
  typeof activePlanRefreshApplyInputSchema
>["proposal"];

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

export async function proposeActivePlanRefreshForCurrentRequest(
  data: ActivePlanRefreshProposalInput,
): Promise<ProposeActivePlanRefreshResult> {
  const auth = requireAuthenticatedUser();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  if (!persistedUserId) {
    throw new Error("Authentication is required for this action.");
  }

  return proposeActivePlanRefreshForUser(persistedUserId, data);
}

export async function proposeActivePlanRefreshForUser(
  userId: string,
  data: ActivePlanRefreshProposalInput,
): Promise<ProposeActivePlanRefreshResult> {
  const capabilityCheck = await checkRunnerCapability({
    userId,
    capabilityKey: "ai_plan_update",
  });

  if (!capabilityCheck.allowed) {
    return capabilityLockedResponse(capabilityCheck);
  }

  const { buildRunnerCoachContext } = await import("@/lib/runner-coach-context");
  const { generateActivePlanRefreshProposal } = await import("@/lib/plan-refresh-proposal");
  const context = await buildRunnerCoachContext({ userId });
  const proposal = await generateActivePlanRefreshProposal({
    context,
    runnerPrompt: data.runnerPrompt,
  });

  await recordRunnerCapabilityUsage({
    userId,
    capabilityKey: "ai_plan_update",
  });

  return {
    ok: true,
    proposal,
  };
}

export async function applyActivePlanRefreshProposalForCurrentRequest(
  proposal: ActivePlanRefreshApplyPayload,
  loadSnapshot: PersistedSnapshotLoader,
): Promise<ApplyActivePlanRefreshProposalResult> {
  const auth = requireAuthenticatedUser();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  if (!persistedUserId) {
    throw new Error("Authentication is required for this action.");
  }

  return applyActivePlanRefreshProposalForUser(persistedUserId, proposal, loadSnapshot);
}

export async function applyActivePlanRefreshProposalForUser(
  userId: string,
  proposal: ActivePlanRefreshApplyPayload,
  loadSnapshot: PersistedSnapshotLoader,
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
    snapshot: await loadSnapshot(userId),
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
