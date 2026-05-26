import { createHmac, createHash } from "node:crypto";
import { z } from "zod";
import {
  buildImportedPlanSeed,
  trainingPlanV2Schema,
  type ImportedPlanSeed,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import type {
  ExistingPlanContext,
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
} from "@/lib/active-plan-persistence";
import type { ActivePlanRefreshFingerprint } from "@/lib/plan-refresh-proposal";
import type { RunnerCoachContext } from "@/lib/runner-coach-context";
import { buildLongDistanceHonestyAssumptions } from "@/lib/running-plan-honesty";
import { serverEnv } from "@/lib/supabase/env";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "@/lib/structured-plan-authoring";
import {
  buildRichWorkoutDraftNotRequestedMetadata,
  type RichWorkoutDraftMetadata,
} from "@/lib/rich-workout-draft-authoring";
import { diffDaysIso, weekdayLong, workoutDistanceKm } from "@/lib/training";
import {
  validateWorkoutsAgainstWeekdayRestInvariant,
  WEEKDAY_NAMES,
  type WeekdayName,
  type WeekdayRestInvariant,
} from "@/lib/weekday-rest-invariants";

type StructuredAuthoringInput = z.output<typeof structuredPlanAuthoringInputSchema>;
type StructuredGoalType = StructuredAuthoringInput["goal"]["goalType"];
type StructuredExperienceLevel = StructuredAuthoringInput["runnerProfile"]["experienceLevel"];
type StructuredWorkoutMix = NonNullable<
  StructuredAuthoringInput["preferences"]["preferredWorkoutMix"]
>;
type StructuredTerrainFocus = StructuredAuthoringInput["preferences"]["terrainFocus"];
type StructuredExecution = StructuredAuthoringInput["execution"];

export interface RefreshApplyTimeline {
  startDate: string;
  targetDate: string | null;
  preparationHorizonWeeks: number;
  sourceTargetDate: string | null;
  remainingEndDate: string;
}

export interface RefreshAuthoringSnapshot {
  schemaVersion: "refresh-authoring-snapshot-v1";
  source: "stored_authoring_input" | "reconstructed_active_plan";
  sourceAssumption: string;
  authoringInput: StructuredAuthoringInput;
  metricPolicySummary: string;
  targetTimeHonestyAssumptions: string[];
  longDistanceHonestyAssumptions: string[];
}

export interface ActivePlanRefreshDraft {
  schemaVersion: "active-plan-refresh-draft-v1";
  generatedAt: string;
  checksum: string;
  proposalFingerprint: ActivePlanRefreshFingerprint;
  authoringSnapshot: RefreshAuthoringSnapshot;
  canonicalPlan: TrainingPlanV2;
  richWorkoutDraftMetadata: RichWorkoutDraftMetadata;
  reviewMetadata: {
    affectedDateRange: {
      startDate: string;
      endDate: string;
    };
    preservedWorkoutCount: number;
    regeneratedWorkoutCount: number;
    firstMutableDate: string;
    longRunPeakBeforeKm: number | null;
    longRunPeakAfterKm: number | null;
    longRunDay: WeekdayName | null;
    sourceAssumption: string;
    metricPolicySummary: string;
    targetTimeHonestyAssumptions: string[];
    longDistanceHonestyAssumptions: string[];
  };
  mutableWorkoutGuards: Array<{
    workoutId: string;
    date: string;
    title: string;
    hadLog: false;
    hadEvidence: false;
  }>;
}

export interface RefreshEvidenceSets {
  loggedWorkoutIds: Set<string>;
  evidenceWorkoutIds: Set<string>;
}

export function buildRefreshApplyTimeline(context: RunnerCoachContext): RefreshApplyTimeline {
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
    remainingEndDate,
  };
}

export function buildExactActivePlanRefreshDraft({
  context,
  currentPlan,
  existingWorkouts,
  proposalOutput,
  fingerprint,
  weekdayRestInvariant,
  evidenceSets,
}: {
  context: RunnerCoachContext;
  currentPlan: PersistedPlanCycleRow;
  existingWorkouts: ExistingPlanContext["existingWorkouts"];
  proposalOutput: {
    applyContext: { generatedAt: string };
    review: { summary: string; proposedChanges: string[] };
    recommendedAuthoringPrompt: string;
  };
  fingerprint: ActivePlanRefreshFingerprint;
  weekdayRestInvariant: WeekdayRestInvariant;
  evidenceSets: RefreshEvidenceSets;
}): ActivePlanRefreshDraft {
  const timeline = buildRefreshApplyTimeline(context);
  const authoringSnapshot = resolveRefreshAuthoringSnapshot({
    context,
    currentPlan,
    timeline,
    proposalOutput,
    weekdayRestInvariant,
  });
  const canonicalPlan = buildStructuredAuthoringPlan(authoringSnapshot.authoringInput);
  const generatedSeed = buildImportedPlanSeed(canonicalPlan);
  const refreshedWorkouts = getDraftWorkoutsInMutableWindow(generatedSeed, timeline);

  validateWorkoutsAgainstWeekdayRestInvariant(refreshedWorkouts, weekdayRestInvariant);

  const mutableRows = existingWorkouts.workouts.filter((workout) =>
    workoutIsInsideMutableWindow(workout, timeline),
  );
  const preservedRows = existingWorkouts.workouts.filter(
    (workout) =>
      workout.workout_date < timeline.startDate ||
      evidenceSets.loggedWorkoutIds.has(workout.id) ||
      evidenceSets.evidenceWorkoutIds.has(workout.id),
  );
  const draftWithoutChecksum = {
    schemaVersion: "active-plan-refresh-draft-v1" as const,
    generatedAt: proposalOutput.applyContext.generatedAt,
    checksum: "",
    proposalFingerprint: fingerprint,
    authoringSnapshot,
    canonicalPlan,
    richWorkoutDraftMetadata: buildRichWorkoutDraftNotRequestedMetadata(),
    reviewMetadata: {
      affectedDateRange: {
        startDate: timeline.startDate,
        endDate: timeline.remainingEndDate,
      },
      preservedWorkoutCount: preservedRows.length,
      regeneratedWorkoutCount: refreshedWorkouts.length,
      firstMutableDate: timeline.startDate,
      longRunPeakBeforeKm: peakLongRunKmFromContext(context),
      longRunPeakAfterKm: peakLongRunKmFromSeed(refreshedWorkouts),
      longRunDay: authoringSnapshot.authoringInput.availability.preferredLongRunDay ?? null,
      sourceAssumption: authoringSnapshot.sourceAssumption,
      metricPolicySummary: authoringSnapshot.metricPolicySummary,
      targetTimeHonestyAssumptions: authoringSnapshot.targetTimeHonestyAssumptions,
      longDistanceHonestyAssumptions: authoringSnapshot.longDistanceHonestyAssumptions,
    },
    mutableWorkoutGuards: mutableRows
      .filter(
        (workout) =>
          !evidenceSets.loggedWorkoutIds.has(workout.id) &&
          !evidenceSets.evidenceWorkoutIds.has(workout.id),
      )
      .map((workout) => ({
        workoutId: workout.id,
        date: workout.workout_date,
        title: workout.title,
        hadLog: false as const,
        hadEvidence: false as const,
      })),
  };

  return {
    ...draftWithoutChecksum,
    checksum: signActivePlanRefreshDraft(draftWithoutChecksum),
  };
}

export function rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
  draft,
  canonicalPlan,
  metadata,
}: {
  draft: ActivePlanRefreshDraft;
  canonicalPlan: TrainingPlanV2;
  metadata: RichWorkoutDraftMetadata;
}): ActivePlanRefreshDraft {
  const refreshedDraft = {
    ...draft,
    checksum: "",
    canonicalPlan,
    richWorkoutDraftMetadata: metadata,
  };

  return {
    ...refreshedDraft,
    checksum: signActivePlanRefreshDraft(refreshedDraft),
  };
}

export function parseActivePlanRefreshDraftPayload(
  value: unknown,
): { ok: true; draft: ActivePlanRefreshDraft } | { ok: false } {
  const parsed = activePlanRefreshDraftPayloadSchema.safeParse(value);

  if (!parsed.success) {
    return { ok: false };
  }

  const authoringInput = structuredPlanAuthoringInputSchema.safeParse(
    parsed.data.authoringSnapshot.authoringInput,
  );
  const canonicalPlan = trainingPlanV2Schema.safeParse(parsed.data.canonicalPlan);

  if (!authoringInput.success || !canonicalPlan.success) {
    return { ok: false };
  }

  const draft: ActivePlanRefreshDraft = {
    ...parsed.data,
    authoringSnapshot: {
      ...parsed.data.authoringSnapshot,
      authoringInput: authoringInput.data,
    },
    canonicalPlan: canonicalPlan.data,
  };

  return verifyActivePlanRefreshDraftChecksum(draft) ? { ok: true, draft } : { ok: false };
}

export function verifyActivePlanRefreshDraftChecksum(draft: ActivePlanRefreshDraft): boolean {
  return signActivePlanRefreshDraft({ ...draft, checksum: "" }) === draft.checksum;
}

export function mutableWorkoutGuardsStillOpen(
  draft: ActivePlanRefreshDraft,
  evidenceSets: RefreshEvidenceSets,
) {
  return draft.mutableWorkoutGuards.every(
    (guard) =>
      !evidenceSets.loggedWorkoutIds.has(guard.workoutId) &&
      !evidenceSets.evidenceWorkoutIds.has(guard.workoutId),
  );
}

function resolveRefreshAuthoringSnapshot({
  context,
  currentPlan,
  timeline,
  proposalOutput,
  weekdayRestInvariant,
}: {
  context: RunnerCoachContext;
  currentPlan: PersistedPlanCycleRow;
  timeline: RefreshApplyTimeline;
  proposalOutput: {
    review: { summary: string; proposedChanges: string[] };
    recommendedAuthoringPrompt: string;
  };
  weekdayRestInvariant: WeekdayRestInvariant;
}): RefreshAuthoringSnapshot {
  const storedAuthoringInput =
    readStoredAuthoringInput(currentPlan.plan_preferences) ??
    readStoredAuthoringInput(currentPlan.goal_metadata);
  const source = storedAuthoringInput ? "stored_authoring_input" : "reconstructed_active_plan";
  const sourceAssumption =
    source === "stored_authoring_input"
      ? "Used stored structured authoring truth, rebased to the remaining active schedule."
      : "Reconstructed authoring truth from the active plan, saved profile summary, plan preferences, and current refresh context.";
  const authoringInput = normalizeRefreshAuthoringInput({
    base: storedAuthoringInput ?? reconstructAuthoringInputFromActivePlan(currentPlan, context),
    context,
    currentPlan,
    timeline,
    proposalOutput,
    weekdayRestInvariant,
  });
  const targetTimeIntent = refreshImpliesTargetPressure(
    authoringInput,
    proposalOutput,
    currentPlan,
    context,
  );
  const targetTimeHonestyAssumptions = buildTargetTimeHonestyAssumptions(
    authoringInput,
    proposalOutput,
    currentPlan,
    context,
    targetTimeIntent,
  );

  return {
    schemaVersion: "refresh-authoring-snapshot-v1",
    source,
    sourceAssumption,
    authoringInput,
    metricPolicySummary: buildMetricPolicySummary(authoringInput),
    targetTimeHonestyAssumptions,
    longDistanceHonestyAssumptions: buildLongDistanceHonestyAssumptions({
      goalType: authoringInput.goal.goalType,
      runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
      horizonWeeks: authoringInput.schedule.preparationHorizonWeeks,
      hasUsableBenchmark: Boolean(authoringInput.currentLevel.recent5kPaceSecondsPerKm),
      targetTimeIntent,
      baselineLongRunKm: authoringInput.runnerProfile.baselineLongRunKm,
      currentLoadKnown: context.recentActualLoad.loggedWorkoutCount > 0,
      age: authoringInput.runnerProfile.age,
    }),
  };
}

function normalizeRefreshAuthoringInput({
  base,
  context,
  currentPlan,
  timeline,
  proposalOutput,
  weekdayRestInvariant,
}: {
  base: Partial<StructuredAuthoringInput>;
  context: RunnerCoachContext;
  currentPlan: PersistedPlanCycleRow;
  timeline: RefreshApplyTimeline;
  proposalOutput: {
    review: { summary: string; proposedChanges: string[] };
    recommendedAuthoringPrompt: string;
  };
  weekdayRestInvariant: WeekdayRestInvariant;
}) {
  const normalized = {
    goal: normalizeRefreshGoal(base.goal, currentPlan, context),
    schedule: {
      startDate: timeline.startDate,
      targetDate: timeline.targetDate,
      preparationHorizonWeeks: timeline.preparationHorizonWeeks,
    },
    runnerProfile: normalizeRefreshRunnerProfile(base.runnerProfile, context),
    currentLevel: normalizeRefreshCurrentLevel(base.currentLevel, context),
    availability: normalizeRefreshAvailability(
      base.availability,
      currentPlan,
      context,
      weekdayRestInvariant,
    ),
    constraints: {
      injuryConstraints: normalizeStringArray(base.constraints?.injuryConstraints).slice(0, 10),
      hardConstraints: normalizeStringArray([
        ...normalizeStringArray(base.constraints?.hardConstraints),
        ...buildRefreshHardConstraintNotes(proposalOutput),
      ]).slice(0, 10),
    },
    preferences: normalizeRefreshPreferences(
      base.preferences,
      currentPlan,
      context,
      proposalOutput,
    ),
    execution: normalizeRefreshExecution(base.execution),
  };

  return structuredPlanAuthoringInputSchema.parse(normalized);
}

function reconstructAuthoringInputFromActivePlan(
  currentPlan: PersistedPlanCycleRow,
  context: RunnerCoachContext,
): Partial<StructuredAuthoringInput> {
  return {
    goal: {
      goalType: inferRefreshGoalType(
        readJsonString(currentPlan.goal_metadata, "goal_type") ??
          currentPlan.goal_summary ??
          currentPlan.title,
        context,
      ),
      goalLabel:
        readJsonString(currentPlan.goal_metadata, "goal_label") ??
        context.runner.goalLabel ??
        currentPlan.goal_summary ??
        currentPlan.title,
      targetEventName: readTargetEventName(currentPlan.goal_metadata),
    },
    runnerProfile: {
      experienceLevel: inferExperienceLevel(context),
      baselineSessionsPerWeek:
        readPositiveInteger(context.runner.baselineSessionsPerWeek, 1, 7) ??
        deriveRemainingSessionsPerWeek(context),
      baselineLongRunKm:
        readPositiveNumber(context.runner.baselineLongRunKm, 0.1, 80) ??
        peakLongRunKmFromContext(context) ??
        8,
      baselineLongRunDurationMin: null,
      age: null,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "rpe",
    },
    currentLevel: {
      recentResultSummary: null,
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: null,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: buildCurrentTrainingLoadSummary(context),
    },
    preferences: {
      preferredWorkoutMix: inferPreferredWorkoutMix(currentPlan, context),
      terrainFocus: inferTerrainFocus(currentPlan, context),
      strengthOrMobilityInterest: null,
      indoorTreadmillOk: false,
      notes: null,
    },
    execution: {
      watchAccess: "unknown",
      guidancePreference: "effort",
    },
  };
}

function normalizeRefreshGoal(
  value: Partial<StructuredAuthoringInput["goal"]> | undefined,
  currentPlan: PersistedPlanCycleRow,
  context: RunnerCoachContext,
): StructuredAuthoringInput["goal"] {
  return {
    goalType: inferRefreshGoalType(value?.goalType ?? currentPlan.goal_summary, context),
    goalLabel:
      sanitizeString(value?.goalLabel, 160) ??
      readJsonString(currentPlan.goal_metadata, "goal_label") ??
      context.runner.goalLabel ??
      currentPlan.goal_summary ??
      currentPlan.title,
    goalStyle:
      normalizeGoalStyle(value?.goalStyle) ??
      normalizeGoalStyle(readJsonString(currentPlan.goal_metadata, "goal_style")),
    targetTime:
      sanitizeString(value?.targetTime, 32) ??
      readJsonString(currentPlan.goal_metadata, "target_time"),
    targetEventName:
      sanitizeString(value?.targetEventName, 160) ?? readTargetEventName(currentPlan.goal_metadata),
  };
}

function normalizeRefreshRunnerProfile(
  value: Partial<StructuredAuthoringInput["runnerProfile"]> | undefined,
  context: RunnerCoachContext,
): StructuredAuthoringInput["runnerProfile"] {
  const baselineDuration = readPositiveInteger(value?.baselineLongRunDurationMin, 20, 300);
  const baselineLongRunKm =
    readPositiveNumber(value?.baselineLongRunKm, 0.1, 80) ??
    (baselineDuration ? null : readPositiveNumber(context.runner.baselineLongRunKm, 0.1, 80)) ??
    (baselineDuration ? null : peakLongRunKmFromContext(context)) ??
    (baselineDuration ? null : 8);

  return {
    experienceLevel:
      normalizeExperienceLevel(value?.experienceLevel) ?? inferExperienceLevel(context),
    baselineSessionsPerWeek:
      readPositiveInteger(value?.baselineSessionsPerWeek, 1, 7) ??
      readPositiveInteger(context.runner.baselineSessionsPerWeek, 1, 7) ??
      deriveRemainingSessionsPerWeek(context),
    baselineLongRunKm,
    baselineLongRunDurationMin: baselineDuration,
    age: readPositiveInteger(value?.age, 13, 100),
    recentInjuryRecoveryContext: sanitizeString(value?.recentInjuryRecoveryContext, 500),
    preferredEffortLanguage: normalizePreferredEffortLanguage(value?.preferredEffortLanguage),
  };
}

function normalizeRefreshCurrentLevel(
  value: Partial<StructuredAuthoringInput["currentLevel"]> | undefined,
  context: RunnerCoachContext,
): StructuredAuthoringInput["currentLevel"] {
  return {
    recentResultSummary: sanitizeString(value?.recentResultSummary, 500),
    recentRaceResults: Array.isArray(value?.recentRaceResults) ? value.recentRaceResults : [],
    recent5kPaceSecondsPerKm: readPositiveNumber(value?.recent5kPaceSecondsPerKm, 1, 20 * 60),
    currentEasyPaceRange: sanitizeString(value?.currentEasyPaceRange, 120),
    currentTrainingLoadSummary:
      sanitizeString(value?.currentTrainingLoadSummary, 500) ??
      buildCurrentTrainingLoadSummary(context),
  };
}

function normalizeRefreshAvailability(
  value: Partial<StructuredAuthoringInput["availability"]> | undefined,
  currentPlan: PersistedPlanCycleRow,
  context: RunnerCoachContext,
  weekdayRestInvariant: WeekdayRestInvariant,
): StructuredAuthoringInput["availability"] {
  const blockedWeekdays = uniqueWeekdays([
    ...normalizeWeekdays(value?.unavailableDays),
    ...weekdayRestInvariant.blockedWeekdays,
    ...normalizeWeekdays(readJsonArray(currentPlan.plan_preferences, "blocked_days")),
  ]);
  const allowedWeekdays = WEEKDAY_NAMES.filter((weekday) => !blockedWeekdays.includes(weekday));

  if (!allowedWeekdays.length) {
    throw new Error("Refresh authoring needs at least one available running day.");
  }

  const explicitPreferredDays = normalizeWeekdays(value?.preferredRunningDays).filter((weekday) =>
    allowedWeekdays.includes(weekday),
  );
  const storedPreferredDays = normalizeWeekdays(
    readJsonArray(currentPlan.plan_preferences, "preferred_run_days"),
  ).filter((weekday) => allowedWeekdays.includes(weekday));
  const contextPreferredDays = uniqueWeekdays(
    context.remainingActiveSchedule
      .filter((workout) => workout.workoutType !== "rest")
      .map((workout) => weekdayLong(workout.date)),
  ).filter((weekday) => allowedWeekdays.includes(weekday));
  const requestedMax =
    readPositiveInteger(value?.maxRunningDaysPerWeek, 1, 7) ??
    readPositiveInteger(
      readJsonNumber(currentPlan.plan_preferences, "max_running_days_per_week"),
      1,
      7,
    ) ??
    (explicitPreferredDays.length ||
      storedPreferredDays.length ||
      contextPreferredDays.length ||
      3);
  const maxRunningDaysPerWeek = Math.min(requestedMax, allowedWeekdays.length);
  const preferredRunningDays = (
    explicitPreferredDays.length
      ? explicitPreferredDays
      : storedPreferredDays.length
        ? storedPreferredDays
        : contextPreferredDays.length
          ? contextPreferredDays
          : allowedWeekdays
  ).slice(0, maxRunningDaysPerWeek);
  const longRunDay =
    normalizeWeekday(value?.preferredLongRunDay) ??
    normalizeWeekday(readJsonString(currentPlan.plan_preferences, "preferred_long_run_day"));
  const preferredLongRunDay =
    longRunDay && preferredRunningDays.includes(longRunDay)
      ? longRunDay
      : (preferredRunningDays.at(-1) ?? null);

  return {
    preferredRunningDays,
    unavailableDays: blockedWeekdays,
    maxRunningDaysPerWeek: preferredRunningDays.length,
    allowBackToBackDays: Boolean(value?.allowBackToBackDays),
    preferredLongRunDay,
  };
}

function normalizeRefreshPreferences(
  value: Partial<StructuredAuthoringInput["preferences"]> | undefined,
  currentPlan: PersistedPlanCycleRow,
  context: RunnerCoachContext,
  proposalOutput: {
    review: { summary: string; proposedChanges: string[] };
    recommendedAuthoringPrompt: string;
  },
): StructuredAuthoringInput["preferences"] {
  return {
    preferredWorkoutMix:
      normalizeWorkoutMix(value?.preferredWorkoutMix) ??
      inferPreferredWorkoutMix(currentPlan, context),
    terrainFocus:
      normalizeTerrainFocus(value?.terrainFocus) ??
      normalizeTerrainFocus(readJsonString(currentPlan.plan_preferences, "terrain_focus")) ??
      inferTerrainFocus(currentPlan, context),
    strengthOrMobilityInterest: normalizeStrengthPreference(value?.strengthOrMobilityInterest),
    indoorTreadmillOk: Boolean(value?.indoorTreadmillOk),
    notes: sanitizeString(
      [
        value?.notes,
        `Refresh request: ${proposalOutput.review.summary}`,
        proposalOutput.recommendedAuthoringPrompt,
      ]
        .filter(Boolean)
        .join(" "),
      500,
    ),
  };
}

function normalizeRefreshExecution(
  value: Partial<StructuredExecution> | undefined,
): StructuredExecution {
  const watchAccess = value?.watchAccess;
  const guidancePreference = value?.guidancePreference;

  return {
    watchAccess:
      watchAccess === "none" || watchAccess === "watch_or_app" || watchAccess === "unknown"
        ? watchAccess
        : "unknown",
    guidancePreference:
      guidancePreference === "effort" ||
      guidancePreference === "pace" ||
      guidancePreference === "heart_rate" ||
      guidancePreference === "mixed"
        ? guidancePreference
        : "effort",
  };
}

function readStoredAuthoringInput(value: unknown): StructuredAuthoringInput | null {
  const record = asRecord(value);
  const candidates = [
    record?.authoring_input,
    record?.structured_authoring_input,
    record?.source_authoring_input,
    asRecord(record?.structured_authoring_snapshot)?.authoring_input,
    asRecord(record?.plan_scoped_authoring_snapshot)?.authoring_input,
    asRecord(record?.active_plan_refresh)?.authoring_input,
  ];

  for (const candidate of candidates) {
    const parsed = structuredPlanAuthoringInputSchema.safeParse(candidate);

    if (parsed.success) {
      return parsed.data;
    }
  }

  return null;
}

function getDraftWorkoutsInMutableWindow(
  generatedSeed: ImportedPlanSeed,
  timeline: RefreshApplyTimeline,
) {
  return generatedSeed.workouts.filter(
    (workout) =>
      workout.workoutDate >= timeline.startDate && workout.workoutDate <= timeline.remainingEndDate,
  );
}

function workoutIsInsideMutableWindow(
  workout: PersistedPlannedWorkoutRow,
  timeline: RefreshApplyTimeline,
) {
  return (
    workout.workout_date >= timeline.startDate && workout.workout_date <= timeline.remainingEndDate
  );
}

function buildRefreshHardConstraintNotes(proposalOutput: {
  review: { proposedChanges: string[] };
  recommendedAuthoringPrompt: string;
}) {
  return [
    ...proposalOutput.review.proposedChanges.map((change) => `Refresh review: ${change}`),
    `Authoring note: ${proposalOutput.recommendedAuthoringPrompt}`,
  ].map((value) => value.slice(0, 200));
}

function buildMetricPolicySummary(input: StructuredAuthoringInput) {
  const execution = input.execution;
  const hasRecent5k = typeof input.currentLevel.recent5kPaceSecondsPerKm === "number";
  const hasAge = typeof input.runnerProfile.age === "number";

  if (execution.guidancePreference === "heart_rate") {
    return hasAge
      ? "Heart-rate guidance may use broad age-estimated defaults; those ranges are not personalized HR zones."
      : "Effort-based targets are used because Hito does not have age or verified heart-rate zone truth for this runner.";
  }

  if (
    execution.watchAccess === "watch_or_app" &&
    hasRecent5k &&
    (execution.guidancePreference === "pace" || execution.guidancePreference === "mixed")
  ) {
    return hasAge
      ? "Broad pace targets are allowed from watch/app access plus recent 5K benchmark truth; HR guidance, when shown, is age-estimated default guidance rather than personalized zones."
      : "Broad pace targets are allowed from watch/app access plus recent 5K benchmark truth; heart-rate targets stay effort-only without age or zone truth.";
  }

  if (execution.watchAccess !== "watch_or_app") {
    return hasAge
      ? "Pace targets stay effort-based because watch/app pace execution is not confirmed; broad HR guidance may appear from age-estimated defaults."
      : "Effort-based targets are used because watch/app pace execution is not confirmed.";
  }

  if (!hasRecent5k) {
    return hasAge
      ? "Pace targets stay effort-based because no usable recent 5K benchmark is available; broad HR guidance may appear from age-estimated defaults."
      : "Effort-based targets are used because no usable recent 5K benchmark is available.";
  }

  return hasAge
    ? "Refresh targets stay effort-led, with broad default HR guidance where age supports it and no personalized zone claims."
    : "Effort-based targets are used for this refresh; numeric heart-rate targets are not emitted without age or zone truth.";
}

function buildTargetTimeHonestyAssumptions(
  input: StructuredAuthoringInput,
  proposalOutput: { recommendedAuthoringPrompt: string; review: { summary: string } },
  currentPlan: PersistedPlanCycleRow,
  context: RunnerCoachContext,
  targetTimeIntent = refreshImpliesTargetPressure(input, proposalOutput, currentPlan, context),
) {
  if (!targetTimeIntent) {
    return [];
  }

  if (!input.currentLevel.recent5kPaceSecondsPerKm) {
    return [
      "Target-time specificity is limited because no usable recent 5K benchmark is available; this refresh keeps guidance conservative and effort-based.",
    ];
  }

  return [
    "Target-time work is treated as directional coaching, not a guarantee; benchmark-derived pace remains broad and conservative.",
  ];
}

function refreshImpliesTargetPressure(
  input: StructuredAuthoringInput,
  proposalOutput: { recommendedAuthoringPrompt: string; review: { summary: string } },
  currentPlan: PersistedPlanCycleRow,
  context: RunnerCoachContext,
) {
  if (input.goal.goalStyle === "target_time" || input.goal.targetTime) {
    return true;
  }

  const text = [
    input.goal.goalLabel,
    input.goal.targetEventName,
    currentPlan.goal_summary,
    currentPlan.title,
    context.runner.goalLabel,
    proposalOutput.review.summary,
    proposalOutput.recommendedAuthoringPrompt,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /\btarget(?:\s|-)?time\b|\bsub\s*\d|\b\d:\d{2}(?::\d{2})?\b|\bambitious\b/.test(text);
}

function inferRefreshGoalType(value: unknown, context: RunnerCoachContext): StructuredGoalType {
  const candidates = [
    normalizeGoalTypeText(value),
    normalizeGoalTypeText(context.runner.goalLabel),
    normalizeGoalTypeText(context.activePlan?.goalSummary),
    normalizeGoalTypeText(context.activePlan?.title),
    normalizeGoalTypeText(context.runner.goalType),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate === "ultra_marathon") return "ultra_marathon";
    if (candidate === "mountain_running") return "mountain_running";
    if (candidate === "half_marathon") return "half_marathon";
    if (candidate === "marathon") return "marathon";
    if (candidate === "10k") return "10k";
    if (candidate === "5k") return "5k";
    if (candidate === "build_consistency") return "build_consistency";
    if (candidate === "distance_build") return "distance_build";
  }

  if (context.runner.goalType === "build_consistency") {
    return "build_consistency";
  }

  return "distance_build";
}

function normalizeGoalTypeText(value: unknown): StructuredGoalType | string | null {
  const text =
    typeof value === "string"
      ? value
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_")
      : "";

  if (!text) return null;
  if (/\bultra(?:_)?marathon\b|\bultra\b/.test(text)) return "ultra_marathon";
  if (/\bmountain(?:_)?running\b|\bmountain\b|\btrail\b/.test(text)) return "mountain_running";
  if (/\bhalf_?marathon\b/.test(text)) return "half_marathon";
  if (/\bmarathon\b/.test(text)) return "marathon";
  if (/\b10_?k\b/.test(text)) return "10k";
  if (/\b5_?k\b/.test(text)) return "5k";
  if (/consistency|consistent/.test(text)) return "build_consistency";
  if (/distance|base|build/.test(text)) return "distance_build";

  return text;
}

function inferExperienceLevel(context: RunnerCoachContext): StructuredExperienceLevel {
  const sessions = readPositiveInteger(context.runner.baselineSessionsPerWeek, 1, 7) ?? 3;
  const longRunKm = readPositiveNumber(context.runner.baselineLongRunKm, 0.1, 80) ?? 8;

  if (sessions >= 5 && longRunKm >= 18) return "experienced_runner";
  if (sessions >= 3 && longRunKm >= 8) return "consistent_runner";
  if (sessions >= 2) return "returning_runner";
  return "new_runner";
}

function normalizeExperienceLevel(value: unknown): StructuredExperienceLevel | null {
  return value === "new_runner" ||
    value === "returning_runner" ||
    value === "consistent_runner" ||
    value === "experienced_runner"
    ? value
    : null;
}

function normalizePreferredEffortLanguage(value: unknown) {
  return value === "pace" || value === "heart_rate" || value === "rpe" || value === "mixed"
    ? value
    : "rpe";
}

function inferPreferredWorkoutMix(
  currentPlan: PersistedPlanCycleRow,
  context: RunnerCoachContext,
): StructuredWorkoutMix {
  const text = [
    readJsonString(currentPlan.plan_preferences, "preferred_workout_mix"),
    currentPlan.goal_summary,
    currentPlan.title,
    context.runner.goalLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/long|marathon|ultra/.test(text)) return "long_run_focus";
  if (/easy|relaxed|recover|heavy|fatigue/.test(text)) return "easy_heavy";
  if (/quality_light|cautious/.test(text)) return "quality_light";
  return "balanced";
}

function normalizeWorkoutMix(value: unknown): StructuredWorkoutMix | null {
  return value === "balanced" ||
    value === "easy_heavy" ||
    value === "quality_light" ||
    value === "long_run_focus"
    ? value
    : null;
}

function inferTerrainFocus(
  currentPlan: PersistedPlanCycleRow,
  context: RunnerCoachContext,
): StructuredTerrainFocus {
  const text = [
    readJsonString(currentPlan.plan_preferences, "terrain_focus"),
    currentPlan.goal_summary,
    currentPlan.title,
    context.runner.goalLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/mountain|trail|climb/.test(text)) return "mountain";
  if (/rolling|hill/.test(text)) return "rolling";
  return "standard";
}

function normalizeTerrainFocus(value: unknown): StructuredTerrainFocus | null {
  return value === "standard" || value === "rolling" || value === "mountain" ? value : null;
}

function normalizeStrengthPreference(value: unknown) {
  return value === "none" || value === "mobility" || value === "strength" || value === "both"
    ? value
    : null;
}

function normalizeGoalStyle(value: unknown) {
  return value === "relaxed" ||
    value === "balanced" ||
    value === "ambitious" ||
    value === "target_time"
    ? value
    : null;
}

function deriveRemainingSessionsPerWeek(context: RunnerCoachContext) {
  const counts = new Map<number, number>();

  for (const workout of context.remainingActiveSchedule) {
    if (workout.workoutType === "rest") continue;
    counts.set(workout.weekNumber, (counts.get(workout.weekNumber) ?? 0) + 1);
  }

  return Math.min(7, Math.max(1, ...counts.values(), 3));
}

function buildCurrentTrainingLoadSummary(context: RunnerCoachContext) {
  return `${context.recentActualLoad.loggedWorkoutCount} logged workouts, ${context.recentActualLoad.totalDistanceKm} km, and ${context.recentActualLoad.totalDurationMin} minutes in the recent context window.`;
}

function peakLongRunKmFromContext(context: RunnerCoachContext) {
  return roundOneOrNull(
    Math.max(
      ...context.remainingActiveSchedule
        .filter((workout) => workout.workoutType === "long_run")
        .map((workout) => workout.plannedDistanceKm ?? 0),
      0,
    ),
  );
}

function peakLongRunKmFromSeed(workouts: ImportedPlanSeed["workouts"]) {
  return roundOneOrNull(
    Math.max(
      ...workouts
        .filter((workout) => workout.workoutType === "long_run")
        .map(
          (workout) => workoutDistanceKm({ steps: workout.steps, type: workout.workoutType }) ?? 0,
        ),
      0,
    ),
  );
}

function roundOneOrNull(value: number) {
  return value > 0 ? Math.round(value * 10) / 10 : null;
}

function signActivePlanRefreshDraft(
  draftWithoutChecksum: Omit<ActivePlanRefreshDraft, "checksum"> & { checksum: string },
) {
  const payload = stableJsonStringify({ ...draftWithoutChecksum, checksum: "" });
  const secret = serverEnv.supabaseServiceRoleKey ?? serverEnv.openAiApiKey;

  if (!secret) {
    return `sha256:${createHash("sha256").update(payload).digest("hex")}`;
  }

  return `hmac-sha256:${createHmac("sha256", secret).update(payload).digest("hex")}`;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readJsonString(value: unknown, key: string) {
  const nested = asRecord(value)?.[key];
  return sanitizeString(nested, 200);
}

function readJsonNumber(value: unknown, key: string) {
  const nested = asRecord(value)?.[key];
  return typeof nested === "number" ? nested : null;
}

function readJsonArray(value: unknown, key: string) {
  const nested = asRecord(value)?.[key];
  return Array.isArray(nested) ? nested : [];
}

function readTargetEventName(value: unknown) {
  const targetEvent = asRecord(asRecord(value)?.target_event);
  return sanitizeString(targetEvent?.event_name, 160) ?? sanitizeString(targetEvent?.label, 160);
}

function sanitizeString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength).trim() : null;
}

function normalizeStringArray(value: unknown) {
  return (Array.isArray(value) ? value : [value])
    .map((entry) => sanitizeString(entry, 200))
    .filter((entry): entry is string => Boolean(entry));
}

function readPositiveNumber(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value
    : null;
}

function readPositiveInteger(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;
}

function normalizeWeekdays(value: unknown): WeekdayName[] {
  return uniqueWeekdays(Array.isArray(value) ? value : []);
}

function normalizeWeekday(value: unknown): WeekdayName | null {
  return typeof value === "string" && WEEKDAY_NAMES.includes(value as WeekdayName)
    ? (value as WeekdayName)
    : null;
}

function uniqueWeekdays(values: readonly unknown[]): WeekdayName[] {
  const weekdays = values.filter(
    (value): value is WeekdayName =>
      typeof value === "string" && WEEKDAY_NAMES.includes(value as WeekdayName),
  );

  return WEEKDAY_NAMES.filter((weekday) => weekdays.includes(weekday));
}

const activePlanRefreshDraftPayloadSchema = z.object({
  schemaVersion: z.literal("active-plan-refresh-draft-v1"),
  generatedAt: z.string().trim().min(1),
  checksum: z.string().trim().min(16),
  proposalFingerprint: z.object({
    schemaVersion: z.literal("active-plan-refresh-fingerprint-v1"),
    today: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/),
    activePlanId: z.string().uuid(),
    activePlanUpdatedAt: z.string().trim().min(1),
    firstMutableDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    lastMutableDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    weekdayRestInvariantSignature: z.string().trim(),
    remainingScheduleSignature: z.array(z.string()).max(80),
    recentHistorySignature: z.array(z.string()).max(80),
  }),
  authoringSnapshot: z.object({
    schemaVersion: z.literal("refresh-authoring-snapshot-v1"),
    source: z.enum(["stored_authoring_input", "reconstructed_active_plan"]),
    sourceAssumption: z.string().trim().min(1).max(400),
    authoringInput: z.unknown(),
    metricPolicySummary: z.string().trim().min(1).max(400),
    targetTimeHonestyAssumptions: z.array(z.string().trim().min(1).max(400)).max(4),
    longDistanceHonestyAssumptions: z.array(z.string().trim().min(1).max(400)).max(4),
  }),
  canonicalPlan: z.unknown(),
  richWorkoutDraftMetadata: z
    .object({
      status: z.enum(["not_requested", "rich_draft_applied", "deterministic_fallback"]),
      source: z.enum(["openai_rich_workout_draft", "deterministic_structured_generator"]),
      fallbackReason: z.string().trim().min(1).max(120).nullable(),
      reviewAssumptions: z.array(z.string().trim().min(1).max(280)).max(8),
    })
    .default(buildRichWorkoutDraftNotRequestedMetadata()),
  reviewMetadata: z.object({
    affectedDateRange: z.object({
      startDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    preservedWorkoutCount: z.number().int().min(0),
    regeneratedWorkoutCount: z.number().int().min(0),
    firstMutableDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/),
    longRunPeakBeforeKm: z.number().nullable(),
    longRunPeakAfterKm: z.number().nullable(),
    longRunDay: z.enum(WEEKDAY_NAMES).nullable(),
    sourceAssumption: z.string().trim().min(1).max(400),
    metricPolicySummary: z.string().trim().min(1).max(400),
    targetTimeHonestyAssumptions: z.array(z.string().trim().min(1).max(400)).max(4),
    longDistanceHonestyAssumptions: z.array(z.string().trim().min(1).max(400)).max(4),
  }),
  mutableWorkoutGuards: z
    .array(
      z.object({
        workoutId: z.string().uuid(),
        date: z
          .string()
          .trim()
          .regex(/^\d{4}-\d{2}-\d{2}$/),
        title: z.string().trim().min(1).max(200),
        hadLog: z.literal(false),
        hadEvidence: z.literal(false),
      }),
    )
    .max(120),
});
