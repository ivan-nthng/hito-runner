import { createHash } from "node:crypto";
import {
  getExistingPlanContext,
  type PersistedPlanCycleRow,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import {
  deriveAvailableTrainingWeekdays,
  derivePreferredLongRunDayFallback,
  mapRunnerTrainingPreferencesProductToStorage,
  parseRunnerWeekday,
  uniqueRunnerWeekdays,
} from "@/lib/runner-training-preferences";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { addDaysIso, todayIso, weekdayLong } from "@/lib/training";
import type { Json } from "@/lib/supabase/database";
import type { WeekdayName } from "@/lib/weekday-rest-invariants";

export interface ActivePlanScheduleEditInput {
  activePlanId?: string | null;
  fixedRestDays: unknown;
  preferredLongRunDay?: unknown;
  runningDaysPerWeek: unknown;
  runningDays?: unknown;
  proposedRunningDays?: unknown;
  saveAsDefaultTrainingPreferences?: boolean;
  intent?: {
    source?: string | null;
    note?: string | null;
  } | null;
}

export type ActivePlanScheduleEditPreview =
  | ActivePlanScheduleEditPreviewReflow
  | ActivePlanScheduleEditPreviewRequiresRegeneration
  | ActivePlanScheduleEditPreviewFailure;

export interface ActivePlanScheduleReflowApplyInput {
  previewToken: unknown;
  scheduleEditInput: ActivePlanScheduleEditInput;
}

export type ActivePlanScheduleReflowApplyResult =
  | ActivePlanScheduleReflowApplySuccess
  | ActivePlanScheduleReflowApplyFailure;

export interface ActivePlanScheduleReflowApplySuccess {
  ok: true;
  mode: "schedule_reflow_applied";
  activePlanId: string;
  firstMutableDate: string;
  appliedWorkoutCount: number;
  movedWorkoutCount: number;
  fixedRestDays: WeekdayName[];
  proposedRunningDays: WeekdayName[];
  effectiveLongRunDay: WeekdayName | null;
  updatedPlanPreferences: Json;
  review: ActivePlanScheduleEditReview;
}

export interface ActivePlanScheduleReflowApplyFailure {
  ok: false;
  reason:
    | "invalid_input"
    | "no_active_plan"
    | "no_mutable_workouts"
    | "requires_regeneration"
    | "stale_preview"
    | "protected_history_conflict"
    | "fixed_rest_day_violation"
    | "apply_failed";
  message: string;
  latestPreviewMode?: "schedule_reflow" | "requires_regeneration";
  conflicts?: ActivePlanScheduleEditConflict[];
  blockedDates?: ActivePlanScheduleEditBlockedDate[];
}

export interface ActivePlanScheduleEditPreviewReflow {
  ok: true;
  mode: "schedule_reflow";
  activePlanId: string;
  firstMutableDate: string;
  preservedPastProtectedWorkoutCount: number;
  movableFutureWorkoutCount: number;
  changes: ActivePlanScheduleEditPreviewChanges;
  proposedDateChanges: ActivePlanScheduleEditDateChange[];
  conflicts: ActivePlanScheduleEditConflict[];
  blockedDates: ActivePlanScheduleEditBlockedDate[];
  fixedRestDayProof: ActivePlanScheduleEditFixedRestDayProof;
  longRunDayResult: ActivePlanScheduleEditLongRunDayResult;
  previewWorkouts: ActivePlanScheduleEditWorkoutPreview[];
  warnings: string[];
  review: ActivePlanScheduleEditReview;
  previewToken: string;
}

export interface ActivePlanScheduleEditPreviewRequiresRegeneration {
  ok: true;
  mode: "requires_regeneration";
  activePlanId: string;
  reason: "running_day_count_changed" | "schedule_no_longer_fits";
  message: string;
  suggestedRefreshPrompt: string;
  firstMutableDate: string | null;
  preservedPastProtectedWorkoutCount: number;
  movableFutureWorkoutCount: number;
  changes: ActivePlanScheduleEditPreviewChanges;
  conflicts: ActivePlanScheduleEditConflict[];
  blockedDates: ActivePlanScheduleEditBlockedDate[];
  fixedRestDayProof: ActivePlanScheduleEditFixedRestDayProof;
  longRunDayResult: ActivePlanScheduleEditLongRunDayResult;
  warnings: string[];
  review: ActivePlanScheduleEditReview;
}

export interface ActivePlanScheduleEditPreviewFailure {
  ok: false;
  reason: "invalid_input" | "no_active_plan" | "no_mutable_workouts" | "protected_history_conflict";
  message: string;
  conflicts?: ActivePlanScheduleEditConflict[];
  blockedDates?: ActivePlanScheduleEditBlockedDate[];
}

export interface ActivePlanScheduleEditPreviewChanges {
  affectedDateRange: { startDate: string; endDate: string } | null;
  movedWorkoutCount: number;
  preservedWorkoutCount: number;
  fixedRestDays: WeekdayName[];
  currentRunningDaysPerWeek: number;
  proposedRunningDaysPerWeek: number;
  currentRunningDays: WeekdayName[];
  proposedRunningDays: WeekdayName[];
  preferredLongRunDay: WeekdayName | null;
  derivedLongRunDay: WeekdayName | null;
  effectiveLongRunDay: WeekdayName | null;
  saveAsDefaultTrainingPreferences: boolean;
}

export interface ActivePlanScheduleEditDateChange {
  workoutId: string;
  title: string;
  workoutType: string;
  sourceWorkoutType: string | null;
  workoutFamily: string | null;
  workoutIdentity: string | null;
  calendarIconKey: string | null;
  fromDate: string;
  toDate: string;
  fromWeekday: WeekdayName;
  toWeekday: WeekdayName;
  phase: string;
  weekNumber: number;
  isLongRun: boolean;
  richFieldsPreserved: boolean;
  stepCount: number;
  targetKeys: string[];
}

export interface ActivePlanScheduleEditWorkoutPreview {
  workoutId: string;
  title: string;
  workoutType: string;
  sourceWorkoutType: string | null;
  workoutFamily: string | null;
  workoutIdentity: string | null;
  calendarIconKey: string | null;
  goalContext: Json | null;
  metricMode: Json | null;
  fromDate: string;
  toDate: string;
  weekday: WeekdayName;
  weekNumber: number;
  phase: string;
  protection: "protected" | "movable";
  isLongRun: boolean;
  stepCount: number;
  targetKeys: string[];
}

export interface ActivePlanScheduleEditConflict {
  code:
    | "protected_workout_on_fixed_rest_day"
    | "schedule_no_longer_fits"
    | "long_run_day_unavailable";
  message: string;
  workoutId?: string;
  title?: string;
  date?: string;
  weekday?: WeekdayName;
}

export interface ActivePlanScheduleEditBlockedDate {
  workoutId: string;
  title: string;
  date: string;
  weekday: WeekdayName;
  protection: "protected" | "movable";
}

export interface ActivePlanScheduleEditFixedRestDayProof {
  ok: boolean;
  fixedRestDays: WeekdayName[];
  checkedNonRestWorkoutCount: number;
  blockedDateCount: number;
  blockedDates: ActivePlanScheduleEditBlockedDate[];
}

export interface ActivePlanScheduleEditLongRunDayResult {
  preferredLongRunDay: WeekdayName | null;
  derivedLongRunDay: WeekdayName | null;
  effectiveLongRunDay: WeekdayName | null;
  movedFutureLongRunCount: number;
  preservedProtectedLongRunCount: number;
  warnings: string[];
}

export interface ActivePlanScheduleEditReview {
  summary: string;
  bullets: string[];
}

export interface BuildActivePlanScheduleEditPreviewInput {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  currentDate?: string;
  input: ActivePlanScheduleEditInput;
}

interface NormalizedScheduleEditInput {
  activePlanId: string | null;
  fixedRestDays: WeekdayName[];
  preferredLongRunDay: WeekdayName | null;
  derivedLongRunDay: WeekdayName | null;
  effectiveLongRunDay: WeekdayName | null;
  runningDaysPerWeek: number;
  explicitRunningDays: WeekdayName[] | null;
  saveAsDefaultTrainingPreferences: boolean;
}

interface ReflowAssignment {
  workout: PersistedPlannedWorkoutRow;
  fromDate: string;
  toDate: string;
  toWeekday: WeekdayName;
  protection: "protected" | "movable";
}

interface ScheduleReflowWorkoutUpdate {
  workoutId: string;
  fromDate: string;
  toDate: string;
  weekday: WeekdayName;
  weekNumber: number;
  displayOrder: number;
  previousWeekday: string;
  previousWeekNumber: number;
  previousDisplayOrder: number;
}

type ScheduleReflowApplyRpcResult =
  | {
      ok: true;
      applied_workout_count?: number;
    }
  | {
      ok: false;
      reason?: unknown;
      message?: unknown;
    };

type ActivePlanScheduleReflowApplyPlan =
  | {
      ok: true;
      activePlan: PersistedPlanCycleRow;
      preview: ActivePlanScheduleEditPreviewReflow;
      workoutUpdates: ScheduleReflowWorkoutUpdate[];
      updatedPlanPreferences: Json;
    }
  | ActivePlanScheduleReflowApplyFailure;

export async function previewActivePlanScheduleEditForUser(
  userId: string,
  input: ActivePlanScheduleEditInput,
): Promise<ActivePlanScheduleEditPreview> {
  const planContext = await getExistingPlanContext(userId);

  if (!planContext.activePlan) {
    return {
      ok: false,
      reason: "no_active_plan",
      message: "There is no active plan to edit.",
    };
  }

  const workoutIds = planContext.existingWorkouts.workouts.map((workout) => workout.id);
  const evidenceWorkoutIds = await fetchScheduleEditEvidenceWorkoutIds(userId, workoutIds);

  return buildActivePlanScheduleEditPreview({
    activePlan: planContext.activePlan,
    workouts: planContext.existingWorkouts.workouts,
    logsByWorkoutId: planContext.existingWorkouts.logsByWorkoutId,
    evidenceWorkoutIds,
    input,
  });
}

export function buildActivePlanScheduleEditPreview({
  activePlan,
  workouts,
  logsByWorkoutId = new Map<string, PersistedWorkoutLogRow>(),
  evidenceWorkoutIds = new Set<string>(),
  currentDate = todayIso(),
  input,
}: BuildActivePlanScheduleEditPreviewInput): ActivePlanScheduleEditPreview {
  if (!activePlan) {
    return {
      ok: false,
      reason: "no_active_plan",
      message: "There is no active plan to edit.",
    };
  }

  const normalizedInputResult = normalizeScheduleEditInput(input);

  if (!normalizedInputResult.ok) {
    return normalizedInputResult;
  }

  const normalizedInput = normalizedInputResult.input;

  if (normalizedInput.activePlanId && normalizedInput.activePlanId !== activePlan.id) {
    return {
      ok: false,
      reason: "no_active_plan",
      message: "The active plan changed. Reload the plan and try again.",
    };
  }

  const nonRestWorkouts = workouts.filter((workout) => workout.workout_type !== "rest");
  const protectedWorkouts = nonRestWorkouts.filter((workout) =>
    isProtectedScheduleWorkout(workout, currentDate, logsByWorkoutId, evidenceWorkoutIds),
  );
  const movableWorkouts = nonRestWorkouts.filter(
    (workout) =>
      !isProtectedScheduleWorkout(workout, currentDate, logsByWorkoutId, evidenceWorkoutIds),
  );
  const firstMutableDate = movableWorkouts.at(0)?.workout_date ?? null;
  const currentRunningDays = resolveCurrentRunningWeekdays(activePlan, nonRestWorkouts);
  const currentRunningDaysPerWeek = resolveCurrentRunningDaysPerWeek(activePlan, nonRestWorkouts);
  const proposedRunningDays = deriveProposedRunningWeekdays({
    fixedRestDays: normalizedInput.fixedRestDays,
    runningDaysPerWeek: normalizedInput.runningDaysPerWeek,
    explicitRunningDays: normalizedInput.explicitRunningDays,
    currentRunningDays,
    effectiveLongRunDay: normalizedInput.effectiveLongRunDay,
  });
  const baseChanges = buildPreviewChanges({
    fixedRestDays: normalizedInput.fixedRestDays,
    currentRunningDays,
    proposedRunningDays,
    currentRunningDaysPerWeek,
    normalizedInput,
    affectedDateRange: firstMutableDate
      ? {
          startDate: firstMutableDate,
          endDate: activePlan.end_date,
        }
      : null,
    movedWorkoutCount: 0,
    preservedWorkoutCount: protectedWorkouts.length,
  });
  const baseLongRunResult = buildBaseLongRunResult(normalizedInput, protectedWorkouts);

  if (!firstMutableDate) {
    return {
      ok: false,
      reason: "no_mutable_workouts",
      message: "There are no future workouts that can be moved safely.",
    };
  }

  if (currentRunningDaysPerWeek !== normalizedInput.runningDaysPerWeek) {
    return buildRequiresRegenerationPreview({
      activePlan,
      reason: "running_day_count_changed",
      message:
        "Changing weekly running frequency means Hito needs to regenerate future workouts instead of only moving dates.",
      suggestedRefreshPrompt: buildSuggestedRefreshPrompt(normalizedInput),
      firstMutableDate,
      preservedPastProtectedWorkoutCount: protectedWorkouts.length,
      movableFutureWorkoutCount: movableWorkouts.length,
      changes: baseChanges,
      fixedRestDayProof: buildFixedRestDayProof(
        protectedWorkouts.map((workout) => ({
          workout,
          fromDate: workout.workout_date,
          toDate: workout.workout_date,
          toWeekday: weekdayLong(workout.workout_date) as WeekdayName,
          protection: "protected",
        })),
        normalizedInput.fixedRestDays,
      ),
      longRunDayResult: baseLongRunResult,
      warnings: [],
    });
  }

  const reflow = buildScheduleReflowAssignments({
    activePlan,
    protectedWorkouts,
    movableWorkouts,
    proposedRunningDays,
    effectiveLongRunDay: normalizedInput.effectiveLongRunDay,
    currentDate,
  });
  const assignments = reflow.assignments;
  const fixedRestDayProof = buildFixedRestDayProof(assignments, normalizedInput.fixedRestDays);
  const protectedConflicts = fixedRestDayProof.blockedDates
    .filter((blockedDate) => blockedDate.protection === "protected")
    .map(
      (blockedDate): ActivePlanScheduleEditConflict => ({
        code: "protected_workout_on_fixed_rest_day",
        message: `${blockedDate.title} is protected on ${blockedDate.weekday}, which is now a fixed rest day.`,
        workoutId: blockedDate.workoutId,
        title: blockedDate.title,
        date: blockedDate.date,
        weekday: blockedDate.weekday,
      }),
    );
  const conflicts = [...reflow.conflicts, ...protectedConflicts];

  if (protectedConflicts.length > 0) {
    return {
      ok: false,
      reason: "protected_history_conflict",
      message:
        "A protected workout is already on one of the proposed fixed rest days. Use plan refresh if you need to change protected history.",
      conflicts,
      blockedDates: fixedRestDayProof.blockedDates,
    };
  }

  if (reflow.conflicts.some((conflict) => conflict.code === "schedule_no_longer_fits")) {
    return buildRequiresRegenerationPreview({
      activePlan,
      reason: "schedule_no_longer_fits",
      message:
        "This schedule no longer has enough safe open days for the future workouts, so Hito should regenerate the remaining plan.",
      suggestedRefreshPrompt: buildSuggestedRefreshPrompt(normalizedInput),
      firstMutableDate,
      preservedPastProtectedWorkoutCount: protectedWorkouts.length,
      movableFutureWorkoutCount: movableWorkouts.length,
      changes: baseChanges,
      conflicts,
      fixedRestDayProof,
      longRunDayResult: baseLongRunResult,
      warnings: reflow.warnings,
    });
  }

  const proposedDateChanges = assignments
    .filter(
      (assignment) =>
        assignment.protection === "movable" && assignment.fromDate !== assignment.toDate,
    )
    .map((assignment) => buildDateChange(assignment));
  const longRunDayResult = buildLongRunDayResult(normalizedInput, assignments, reflow.warnings);
  const changes = buildPreviewChanges({
    fixedRestDays: normalizedInput.fixedRestDays,
    currentRunningDays,
    proposedRunningDays,
    currentRunningDaysPerWeek,
    normalizedInput,
    affectedDateRange: {
      startDate: firstMutableDate,
      endDate: activePlan.end_date,
    },
    movedWorkoutCount: proposedDateChanges.length,
    preservedWorkoutCount: protectedWorkouts.length,
  });
  const warnings = [
    ...reflow.warnings,
    "Hito will only move future workouts. Workout content, segments, metric targets, and rich identities stay the same.",
  ];
  const review = buildScheduleReflowReview(changes, proposedDateChanges, longRunDayResult);
  const previewWorkouts = assignments.map(buildWorkoutPreview);

  return {
    ok: true,
    mode: "schedule_reflow",
    activePlanId: activePlan.id,
    firstMutableDate,
    preservedPastProtectedWorkoutCount: protectedWorkouts.length,
    movableFutureWorkoutCount: movableWorkouts.length,
    changes,
    proposedDateChanges,
    conflicts,
    blockedDates: fixedRestDayProof.blockedDates,
    fixedRestDayProof,
    longRunDayResult,
    previewWorkouts,
    warnings,
    review,
    previewToken: buildPreviewToken({
      activePlan,
      currentDate,
      normalizedInput,
      proposedDateChanges,
      previewWorkouts,
      firstMutableDate,
    }),
  };
}

export async function applyActivePlanScheduleReflowPreviewForUser(
  userId: string,
  input: ActivePlanScheduleReflowApplyInput,
): Promise<ActivePlanScheduleReflowApplyResult> {
  const planContext = await getExistingPlanContext(userId);

  if (!planContext.activePlan) {
    return {
      ok: false,
      reason: "no_active_plan",
      message: "There is no active plan to edit.",
    };
  }

  const workoutIds = planContext.existingWorkouts.workouts.map((workout) => workout.id);
  const evidenceWorkoutIds = await fetchScheduleEditEvidenceWorkoutIds(userId, workoutIds);
  const applyPlan = buildActivePlanScheduleReflowApplyPlan({
    activePlan: planContext.activePlan,
    workouts: planContext.existingWorkouts.workouts,
    logsByWorkoutId: planContext.existingWorkouts.logsByWorkoutId,
    evidenceWorkoutIds,
    input,
  });

  if (!applyPlan.ok) {
    return applyPlan;
  }

  const persistResult = await persistScheduleReflowApply(userId, applyPlan);

  if (!persistResult.ok) {
    return persistResult;
  }

  return {
    ok: true,
    mode: "schedule_reflow_applied",
    activePlanId: applyPlan.activePlan.id,
    firstMutableDate: applyPlan.preview.firstMutableDate,
    appliedWorkoutCount: applyPlan.workoutUpdates.length,
    movedWorkoutCount: applyPlan.preview.proposedDateChanges.length,
    fixedRestDays: applyPlan.preview.changes.fixedRestDays,
    proposedRunningDays: applyPlan.preview.changes.proposedRunningDays,
    effectiveLongRunDay: applyPlan.preview.changes.effectiveLongRunDay,
    updatedPlanPreferences: persistResult.updatedPlanPreferences,
    review: {
      summary: `Applied ${applyPlan.preview.proposedDateChanges.length} reviewed schedule moves without changing workout content.`,
      bullets: [
        "Only reviewed future mutable workout dates were updated.",
        "Workout steps, rich identity, metric targets, goal context, and source metadata were preserved.",
        "Runner Settings defaults were not changed.",
      ],
    },
  };
}

export function buildActivePlanScheduleReflowApplyPlan({
  activePlan,
  workouts,
  logsByWorkoutId = new Map<string, PersistedWorkoutLogRow>(),
  evidenceWorkoutIds = new Set<string>(),
  currentDate = todayIso(),
  input,
}: Omit<BuildActivePlanScheduleEditPreviewInput, "input"> & {
  input: ActivePlanScheduleReflowApplyInput;
}): ActivePlanScheduleReflowApplyPlan {
  const previewTokenResult = parsePreviewToken(input.previewToken);

  if (!previewTokenResult.ok) {
    return previewTokenResult;
  }

  const preview = buildActivePlanScheduleEditPreview({
    activePlan,
    workouts,
    logsByWorkoutId,
    evidenceWorkoutIds,
    currentDate,
    input: input.scheduleEditInput,
  });

  if (!preview.ok) {
    return {
      ok: false,
      reason: preview.reason,
      message: preview.message,
      conflicts: preview.conflicts,
      blockedDates: preview.blockedDates,
    };
  }

  if (preview.mode === "requires_regeneration") {
    return {
      ok: false,
      reason: "requires_regeneration",
      message:
        "This reviewed schedule change requires plan regeneration, not schedule reflow apply.",
      latestPreviewMode: preview.mode,
      conflicts: preview.conflicts,
      blockedDates: preview.blockedDates,
    };
  }

  if (preview.previewToken !== previewTokenResult.previewToken) {
    return {
      ok: false,
      reason: "stale_preview",
      message: "The schedule preview is stale. Review the schedule changes again before applying.",
      latestPreviewMode: preview.mode,
      conflicts: preview.conflicts,
      blockedDates: preview.blockedDates,
    };
  }

  if (!preview.fixedRestDayProof.ok) {
    return {
      ok: false,
      reason: "fixed_rest_day_violation",
      message: "The reviewed schedule would place a workout on a fixed rest day.",
      latestPreviewMode: preview.mode,
      blockedDates: preview.fixedRestDayProof.blockedDates,
    };
  }

  const workoutUpdates = buildScheduleReflowWorkoutUpdates(preview, workouts);
  const updatedPlanPreferences = buildScheduleEditPlanPreferences(
    activePlan?.plan_preferences ?? null,
    preview,
  );

  return {
    ok: true,
    activePlan: activePlan!,
    preview,
    workoutUpdates,
    updatedPlanPreferences,
  };
}

async function persistScheduleReflowApply(
  userId: string,
  applyPlan: Extract<ActivePlanScheduleReflowApplyPlan, { ok: true }>,
): Promise<{ ok: true; updatedPlanPreferences: Json } | ActivePlanScheduleReflowApplyFailure> {
  const supabase = createAdminSupabaseClient();
  const appliedAt = new Date().toISOString();
  const updatedPlanPreferences = withScheduleEditAppliedMetadata(
    applyPlan.updatedPlanPreferences,
    applyPlan.preview,
    appliedAt,
  );
  const applyResult = await supabase.rpc("apply_active_plan_schedule_reflow", {
    p_user_id: userId,
    p_plan_id: applyPlan.activePlan.id,
    p_expected_plan_updated_at: applyPlan.activePlan.updated_at,
    p_plan_preferences: updatedPlanPreferences,
    p_applied_at: appliedAt,
    p_updates: applyPlan.workoutUpdates as unknown as Json,
  });

  if (applyResult.error) {
    return {
      ok: false,
      reason: "apply_failed",
      message: "Schedule changes could not be applied. The current plan is unchanged.",
    };
  }

  const rpcResult = parseScheduleReflowApplyRpcResult(applyResult.data);

  if (!rpcResult.ok) {
    return rpcResult;
  }

  if (rpcResult.result.ok !== true) {
    return {
      ok: false,
      reason: readScheduleReflowRpcFailureReason(rpcResult.result.reason),
      message:
        typeof rpcResult.result.message === "string" && rpcResult.result.message.trim()
          ? rpcResult.result.message
          : "Schedule changes could not be applied. Review the schedule again.",
    };
  }

  return {
    ok: true,
    updatedPlanPreferences,
  };
}

function parsePreviewToken(
  value: unknown,
): { ok: true; previewToken: string } | ActivePlanScheduleReflowApplyFailure {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/i.test(value.trim())) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Schedule preview token is invalid.",
    };
  }

  return {
    ok: true,
    previewToken: value.trim().toLowerCase(),
  };
}

function buildScheduleReflowWorkoutUpdates(
  preview: ActivePlanScheduleEditPreviewReflow,
  workouts: PersistedPlannedWorkoutRow[],
): ScheduleReflowWorkoutUpdate[] {
  const workoutById = new Map(workouts.map((workout) => [workout.id, workout]));
  const displayOrderByWorkoutId = new Map(
    preview.previewWorkouts
      .slice()
      .sort((left, right) =>
        left.toDate === right.toDate
          ? left.workoutId.localeCompare(right.workoutId)
          : left.toDate.localeCompare(right.toDate),
      )
      .map((workout, index) => [workout.workoutId, index]),
  );

  return preview.proposedDateChanges.map((change) => {
    const sourceWorkout = workoutById.get(change.workoutId);

    if (!sourceWorkout) {
      throw new Error("Reviewed schedule references a workout that no longer exists.");
    }

    return {
      workoutId: change.workoutId,
      fromDate: change.fromDate,
      toDate: change.toDate,
      weekday: change.toWeekday,
      weekNumber: change.weekNumber,
      displayOrder: displayOrderByWorkoutId.get(change.workoutId) ?? sourceWorkout.display_order,
      previousWeekday: sourceWorkout.weekday,
      previousWeekNumber: sourceWorkout.week_number,
      previousDisplayOrder: sourceWorkout.display_order,
    };
  });
}

function buildScheduleEditPlanPreferences(
  existingPreferences: Json | null,
  preview: ActivePlanScheduleEditPreviewReflow,
): Json {
  const base = asRecord(existingPreferences) ?? {};

  return {
    ...base,
    blocked_days: preview.changes.fixedRestDays,
    preferred_run_days: preview.changes.proposedRunningDays,
    max_running_days_per_week: preview.changes.proposedRunningDaysPerWeek,
    preferred_long_run_day: preview.changes.effectiveLongRunDay,
    weekday_rest_invariant_source: "active_plan_schedule_edit",
    active_plan_schedule_edit: {
      ...(asRecord(base.active_plan_schedule_edit) ?? {}),
      mode: "schedule_reflow",
      first_mutable_date: preview.firstMutableDate,
      affected_date_range: preview.changes.affectedDateRange,
      moved_workout_count: preview.proposedDateChanges.length,
      preserved_workout_count: preview.preservedPastProtectedWorkoutCount,
      fixed_rest_days: preview.changes.fixedRestDays,
      preferred_long_run_day: preview.changes.preferredLongRunDay,
      derived_long_run_day: preview.changes.derivedLongRunDay,
      effective_long_run_day: preview.changes.effectiveLongRunDay,
      proposed_running_days: preview.changes.proposedRunningDays,
      save_as_default_training_preferences_requested:
        preview.changes.saveAsDefaultTrainingPreferences,
    },
  } as Json;
}

function withScheduleEditAppliedMetadata(
  preferences: Json,
  preview: ActivePlanScheduleEditPreviewReflow,
  appliedAt: string,
): Json {
  const base = asRecord(preferences) ?? {};
  const metadata = asRecord(base.active_plan_schedule_edit) ?? {};

  return {
    ...base,
    active_plan_schedule_edit: {
      ...metadata,
      applied_at: appliedAt,
      preview_token: preview.previewToken,
    },
  } as Json;
}

function normalizeScheduleEditInput(
  input: ActivePlanScheduleEditInput,
): { ok: true; input: NormalizedScheduleEditInput } | ActivePlanScheduleEditPreviewFailure {
  try {
    const runningDaysPerWeek = parseRunningDaysPerWeek(input.runningDaysPerWeek);
    const storage = mapRunnerTrainingPreferencesProductToStorage({
      fixedRestDays: parseWeekdayArray(
        input.fixedRestDays,
        "Fixed rest days must be weekday names.",
      ),
      defaultRunningDaysPerWeek: runningDaysPerWeek,
      preferredLongRunDay:
        input.preferredLongRunDay == null || input.preferredLongRunDay === ""
          ? null
          : parseRunnerWeekday(input.preferredLongRunDay),
    });
    const explicitRunningDays = parseOptionalWeekdayArray(
      input.runningDays ?? input.proposedRunningDays,
      "Running days must be weekday names.",
    );

    if (explicitRunningDays && explicitRunningDays.length !== runningDaysPerWeek) {
      throw new Error("Running days must match the selected weekly running-day count.");
    }

    const invalidExplicitRunningDay = explicitRunningDays?.find((weekday) =>
      storage.blocked_days.includes(weekday),
    );

    if (invalidExplicitRunningDay) {
      throw new Error(
        `${invalidExplicitRunningDay} cannot be both a running day and a fixed rest day.`,
      );
    }

    const derivedLongRunDay = derivePreferredLongRunDayFallback(storage.blocked_days);
    const effectiveLongRunDay = storage.preferred_long_run_day ?? derivedLongRunDay;

    if (
      effectiveLongRunDay &&
      explicitRunningDays &&
      !explicitRunningDays.includes(effectiveLongRunDay)
    ) {
      throw new Error("Preferred long-run day must be one of the selected running days.");
    }

    return {
      ok: true,
      input: {
        activePlanId:
          typeof input.activePlanId === "string" && input.activePlanId.trim()
            ? input.activePlanId.trim()
            : null,
        fixedRestDays: storage.blocked_days,
        preferredLongRunDay: storage.preferred_long_run_day,
        derivedLongRunDay,
        effectiveLongRunDay,
        runningDaysPerWeek,
        explicitRunningDays,
        saveAsDefaultTrainingPreferences: Boolean(input.saveAsDefaultTrainingPreferences),
      },
    };
  } catch (error) {
    return {
      ok: false,
      reason: "invalid_input",
      message: error instanceof Error ? error.message : "Schedule edit input is invalid.",
    };
  }
}

function parseRunningDaysPerWeek(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Running days per week must be a whole number.");
  }

  return value;
}

function parseWeekdayArray(value: unknown, message: string): WeekdayName[] {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }

  return uniqueRunnerWeekdays(value.map(parseRunnerWeekday));
}

function parseOptionalWeekdayArray(value: unknown, message: string): WeekdayName[] | null {
  if (value == null) {
    return null;
  }

  return parseWeekdayArray(value, message);
}

function resolveCurrentRunningDaysPerWeek(
  activePlan: PersistedPlanCycleRow,
  nonRestWorkouts: PersistedPlannedWorkoutRow[],
) {
  const preferences = asRecord(activePlan.plan_preferences);
  const storedMax = readPositiveInteger(preferences?.max_running_days_per_week);

  if (storedMax) {
    return storedMax;
  }

  const preferredRunDays = readWeekdayArray(preferences?.preferred_run_days);

  if (preferredRunDays.length) {
    return preferredRunDays.length;
  }

  const countsByWeek = new Map<number, Set<string>>();

  for (const workout of nonRestWorkouts) {
    const week = countsByWeek.get(workout.week_number) ?? new Set<string>();
    week.add(workout.workout_date);
    countsByWeek.set(workout.week_number, week);
  }

  return Math.max(1, ...Array.from(countsByWeek.values()).map((week) => week.size));
}

function resolveCurrentRunningWeekdays(
  activePlan: PersistedPlanCycleRow,
  nonRestWorkouts: PersistedPlannedWorkoutRow[],
) {
  const preferences = asRecord(activePlan.plan_preferences);
  const preferredRunDays = readWeekdayArray(preferences?.preferred_run_days);

  if (preferredRunDays.length) {
    return preferredRunDays;
  }

  return uniqueRunnerWeekdays(
    nonRestWorkouts.map((workout) => weekdayLong(workout.workout_date) as WeekdayName),
  );
}

function deriveProposedRunningWeekdays({
  fixedRestDays,
  runningDaysPerWeek,
  explicitRunningDays,
  currentRunningDays,
  effectiveLongRunDay,
}: {
  fixedRestDays: WeekdayName[];
  runningDaysPerWeek: number;
  explicitRunningDays: WeekdayName[] | null;
  currentRunningDays: WeekdayName[];
  effectiveLongRunDay: WeekdayName | null;
}) {
  if (explicitRunningDays) {
    return explicitRunningDays;
  }

  const availableWeekdays = deriveAvailableTrainingWeekdays(fixedRestDays);

  if (runningDaysPerWeek >= availableWeekdays.length) {
    return availableWeekdays;
  }

  const selected = uniqueRunnerWeekdays(
    currentRunningDays.filter((weekday) => availableWeekdays.includes(weekday)),
  ).slice(0, runningDaysPerWeek);

  if (effectiveLongRunDay && !selected.includes(effectiveLongRunDay)) {
    selected.pop();
    selected.push(effectiveLongRunDay);
  }

  for (const weekday of availableWeekdays) {
    if (selected.length >= runningDaysPerWeek) {
      break;
    }

    if (!selected.includes(weekday)) {
      selected.push(weekday);
    }
  }

  return uniqueRunnerWeekdays(selected).slice(0, runningDaysPerWeek);
}

function buildScheduleReflowAssignments({
  activePlan,
  protectedWorkouts,
  movableWorkouts,
  proposedRunningDays,
  effectiveLongRunDay,
  currentDate,
}: {
  activePlan: PersistedPlanCycleRow;
  protectedWorkouts: PersistedPlannedWorkoutRow[];
  movableWorkouts: PersistedPlannedWorkoutRow[];
  proposedRunningDays: WeekdayName[];
  effectiveLongRunDay: WeekdayName | null;
  currentDate: string;
}) {
  const assignments: ReflowAssignment[] = protectedWorkouts.map((workout) => ({
    workout,
    fromDate: workout.workout_date,
    toDate: workout.workout_date,
    toWeekday: weekdayLong(workout.workout_date) as WeekdayName,
    protection: "protected",
  }));
  const conflicts: ActivePlanScheduleEditConflict[] = [];
  const warnings: string[] = [];
  const movableByWeek = groupWorkoutsByWeek(movableWorkouts);
  const protectedByWeek = groupWorkoutsByWeek(protectedWorkouts);

  for (const [weekNumber, weekWorkouts] of movableByWeek.entries()) {
    const weekStartDate = addDaysIso(activePlan.start_date, (weekNumber - 1) * 7);
    const protectedWeekdays = new Set(
      (protectedByWeek.get(weekNumber) ?? []).map(
        (workout) => weekdayLong(workout.workout_date) as WeekdayName,
      ),
    );
    const openSlots = proposedRunningDays
      .map((weekday) => ({
        weekday,
        date: dateForWeekdayInPlanWeek(weekStartDate, weekday),
      }))
      .filter((slot) => !protectedWeekdays.has(slot.weekday))
      .filter((slot) => slot.date > currentDate);
    const sortedWeekWorkouts = weekWorkouts
      .slice()
      .sort((left, right) =>
        left.workout_date === right.workout_date
          ? left.display_order - right.display_order
          : left.workout_date.localeCompare(right.workout_date),
      );

    if (sortedWeekWorkouts.length > openSlots.length) {
      conflicts.push({
        code: "schedule_no_longer_fits",
        message: `Week ${weekNumber} has ${sortedWeekWorkouts.length} movable workouts but only ${openSlots.length} open future running days.`,
      });
      continue;
    }

    const assignedWorkoutIds = new Set<string>();
    const availableSlots = [...openSlots];
    const longRun = effectiveLongRunDay
      ? sortedWeekWorkouts.find((workout) => isLongRunWorkout(workout))
      : null;

    if (longRun && effectiveLongRunDay) {
      const longRunSlotIndex = availableSlots.findIndex(
        (slot) => slot.weekday === effectiveLongRunDay,
      );

      if (longRunSlotIndex >= 0) {
        const [longRunSlot] = availableSlots.splice(longRunSlotIndex, 1);
        assignments.push(buildMovableAssignment(longRun, longRunSlot!));
        assignedWorkoutIds.add(longRun.id);
      } else if (dateForWeekdayInPlanWeek(weekStartDate, effectiveLongRunDay) <= currentDate) {
        warnings.push(
          `Week ${weekNumber}'s long-run day is already protected by the calendar, so that long run stays on the nearest open future training day.`,
        );
      } else {
        conflicts.push({
          code: "long_run_day_unavailable",
          message: `Week ${weekNumber}'s long-run day is occupied by protected history.`,
          workoutId: longRun.id,
          title: longRun.title,
          date: longRun.workout_date,
          weekday: weekdayLong(longRun.workout_date) as WeekdayName,
        });
      }
    }

    for (const workout of sortedWeekWorkouts) {
      if (assignedWorkoutIds.has(workout.id)) {
        continue;
      }

      const currentWeekday = weekdayLong(workout.workout_date) as WeekdayName;
      const currentSlotIndex = availableSlots.findIndex((slot) => slot.weekday === currentWeekday);
      const slotIndex = currentSlotIndex >= 0 ? currentSlotIndex : 0;
      const [slot] = availableSlots.splice(slotIndex, 1);

      if (!slot) {
        conflicts.push({
          code: "schedule_no_longer_fits",
          message: `Week ${weekNumber} no longer has an open slot for ${workout.title}.`,
          workoutId: workout.id,
          title: workout.title,
          date: workout.workout_date,
          weekday: currentWeekday,
        });
        continue;
      }

      assignments.push(buildMovableAssignment(workout, slot));
    }
  }

  return {
    assignments: assignments.sort((left, right) =>
      left.toDate === right.toDate
        ? left.workout.display_order - right.workout.display_order
        : left.toDate.localeCompare(right.toDate),
    ),
    conflicts,
    warnings,
  };
}

function buildMovableAssignment(
  workout: PersistedPlannedWorkoutRow,
  slot: { weekday: WeekdayName; date: string },
): ReflowAssignment {
  return {
    workout,
    fromDate: workout.workout_date,
    toDate: slot.date,
    toWeekday: slot.weekday,
    protection: "movable",
  };
}

function buildFixedRestDayProof(
  assignments: ReflowAssignment[],
  fixedRestDays: WeekdayName[],
): ActivePlanScheduleEditFixedRestDayProof {
  const blockedDates = assignments
    .filter((assignment) => fixedRestDays.includes(assignment.toWeekday))
    .map(
      (assignment): ActivePlanScheduleEditBlockedDate => ({
        workoutId: assignment.workout.id,
        title: assignment.workout.title,
        date: assignment.toDate,
        weekday: assignment.toWeekday,
        protection: assignment.protection,
      }),
    );

  return {
    ok: blockedDates.length === 0,
    fixedRestDays,
    checkedNonRestWorkoutCount: assignments.length,
    blockedDateCount: blockedDates.length,
    blockedDates,
  };
}

function buildDateChange(assignment: ReflowAssignment): ActivePlanScheduleEditDateChange {
  const workout = assignment.workout;

  return {
    workoutId: workout.id,
    title: workout.title,
    workoutType: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    workoutFamily: workout.workout_family,
    workoutIdentity: workout.workout_identity,
    calendarIconKey: workout.calendar_icon_key,
    fromDate: assignment.fromDate,
    toDate: assignment.toDate,
    fromWeekday: weekdayLong(assignment.fromDate) as WeekdayName,
    toWeekday: assignment.toWeekday,
    phase: workout.phase,
    weekNumber: workout.week_number,
    isLongRun: isLongRunWorkout(workout),
    richFieldsPreserved: true,
    stepCount: countSteps(workout.steps),
    targetKeys: collectStepTargetKeys(workout.steps),
  };
}

function buildWorkoutPreview(assignment: ReflowAssignment): ActivePlanScheduleEditWorkoutPreview {
  const workout = assignment.workout;

  return {
    workoutId: workout.id,
    title: workout.title,
    workoutType: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    workoutFamily: workout.workout_family,
    workoutIdentity: workout.workout_identity,
    calendarIconKey: workout.calendar_icon_key,
    goalContext: workout.goal_context,
    metricMode: workout.metric_mode,
    fromDate: assignment.fromDate,
    toDate: assignment.toDate,
    weekday: assignment.toWeekday,
    weekNumber: workout.week_number,
    phase: workout.phase,
    protection: assignment.protection,
    isLongRun: isLongRunWorkout(workout),
    stepCount: countSteps(workout.steps),
    targetKeys: collectStepTargetKeys(workout.steps),
  };
}

function buildPreviewChanges({
  fixedRestDays,
  currentRunningDays,
  proposedRunningDays,
  currentRunningDaysPerWeek,
  normalizedInput,
  affectedDateRange,
  movedWorkoutCount,
  preservedWorkoutCount,
}: {
  fixedRestDays: WeekdayName[];
  currentRunningDays: WeekdayName[];
  proposedRunningDays: WeekdayName[];
  currentRunningDaysPerWeek: number;
  normalizedInput: NormalizedScheduleEditInput;
  affectedDateRange: { startDate: string; endDate: string } | null;
  movedWorkoutCount: number;
  preservedWorkoutCount: number;
}): ActivePlanScheduleEditPreviewChanges {
  return {
    affectedDateRange,
    movedWorkoutCount,
    preservedWorkoutCount,
    fixedRestDays,
    currentRunningDaysPerWeek,
    proposedRunningDaysPerWeek: normalizedInput.runningDaysPerWeek,
    currentRunningDays,
    proposedRunningDays,
    preferredLongRunDay: normalizedInput.preferredLongRunDay,
    derivedLongRunDay: normalizedInput.derivedLongRunDay,
    effectiveLongRunDay: normalizedInput.effectiveLongRunDay,
    saveAsDefaultTrainingPreferences: normalizedInput.saveAsDefaultTrainingPreferences,
  };
}

function buildBaseLongRunResult(
  normalizedInput: NormalizedScheduleEditInput,
  protectedWorkouts: PersistedPlannedWorkoutRow[],
): ActivePlanScheduleEditLongRunDayResult {
  return {
    preferredLongRunDay: normalizedInput.preferredLongRunDay,
    derivedLongRunDay: normalizedInput.derivedLongRunDay,
    effectiveLongRunDay: normalizedInput.effectiveLongRunDay,
    movedFutureLongRunCount: 0,
    preservedProtectedLongRunCount: protectedWorkouts.filter(isLongRunWorkout).length,
    warnings: [],
  };
}

function buildLongRunDayResult(
  normalizedInput: NormalizedScheduleEditInput,
  assignments: ReflowAssignment[],
  warnings: string[],
): ActivePlanScheduleEditLongRunDayResult {
  return {
    preferredLongRunDay: normalizedInput.preferredLongRunDay,
    derivedLongRunDay: normalizedInput.derivedLongRunDay,
    effectiveLongRunDay: normalizedInput.effectiveLongRunDay,
    movedFutureLongRunCount: assignments.filter(
      (assignment) =>
        assignment.protection === "movable" &&
        isLongRunWorkout(assignment.workout) &&
        assignment.fromDate !== assignment.toDate,
    ).length,
    preservedProtectedLongRunCount: assignments.filter(
      (assignment) => assignment.protection === "protected" && isLongRunWorkout(assignment.workout),
    ).length,
    warnings,
  };
}

function buildRequiresRegenerationPreview({
  activePlan,
  reason,
  message,
  suggestedRefreshPrompt,
  firstMutableDate,
  preservedPastProtectedWorkoutCount,
  movableFutureWorkoutCount,
  changes,
  conflicts = [],
  fixedRestDayProof,
  longRunDayResult,
  warnings,
}: {
  activePlan: PersistedPlanCycleRow;
  reason: ActivePlanScheduleEditPreviewRequiresRegeneration["reason"];
  message: string;
  suggestedRefreshPrompt: string;
  firstMutableDate: string | null;
  preservedPastProtectedWorkoutCount: number;
  movableFutureWorkoutCount: number;
  changes: ActivePlanScheduleEditPreviewChanges;
  conflicts?: ActivePlanScheduleEditConflict[];
  fixedRestDayProof: ActivePlanScheduleEditFixedRestDayProof;
  longRunDayResult: ActivePlanScheduleEditLongRunDayResult;
  warnings: string[];
}): ActivePlanScheduleEditPreviewRequiresRegeneration {
  return {
    ok: true,
    mode: "requires_regeneration",
    activePlanId: activePlan.id,
    reason,
    message,
    suggestedRefreshPrompt,
    firstMutableDate,
    preservedPastProtectedWorkoutCount,
    movableFutureWorkoutCount,
    changes,
    conflicts,
    blockedDates: fixedRestDayProof.blockedDates,
    fixedRestDayProof,
    longRunDayResult,
    warnings,
    review: {
      summary: message,
      bullets: [
        "Completed, logged, and evidence-backed workouts stay protected.",
        "Use the existing Update plan review before applying any regenerated schedule.",
      ],
    },
  };
}

function buildScheduleReflowReview(
  changes: ActivePlanScheduleEditPreviewChanges,
  proposedDateChanges: ActivePlanScheduleEditDateChange[],
  longRunDayResult: ActivePlanScheduleEditLongRunDayResult,
): ActivePlanScheduleEditReview {
  const fixedRestText = changes.fixedRestDays.length
    ? changes.fixedRestDays.join(", ")
    : "no fixed weekday rest days";
  const moveText =
    proposedDateChanges.length === 1
      ? "1 future workout"
      : `${proposedDateChanges.length} future workouts`;

  return {
    summary: `Hito can move ${moveText} without changing workout content. Fixed rest days: ${fixedRestText}.`,
    bullets: [
      "Only future movable workouts are included in this preview.",
      "Workout steps, rich workout identity, metric targets, and source metadata are preserved.",
      longRunDayResult.effectiveLongRunDay
        ? `Future mutable long runs prefer ${longRunDayResult.effectiveLongRunDay}.`
        : "No long-run weekday is available from this schedule.",
    ],
  };
}

function buildSuggestedRefreshPrompt(input: NormalizedScheduleEditInput) {
  const fixedRestText = input.fixedRestDays.length ? input.fixedRestDays.join(", ") : "none";
  const longRunText = input.effectiveLongRunDay
    ? `prefer ${input.effectiveLongRunDay} for the long run`
    : "choose the safest available long-run day";

  return `Change my active plan to ${input.runningDaysPerWeek} running days per week, keep fixed rest days on ${fixedRestText}, and ${longRunText}. Regenerate only future workouts and preserve completed, logged, and evidence-backed history.`;
}

function buildPreviewToken(value: {
  activePlan: PersistedPlanCycleRow;
  currentDate: string;
  normalizedInput: NormalizedScheduleEditInput;
  proposedDateChanges: ActivePlanScheduleEditDateChange[];
  previewWorkouts: ActivePlanScheduleEditWorkoutPreview[];
  firstMutableDate: string;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        activePlanId: value.activePlan.id,
        activePlanUpdatedAt: value.activePlan.updated_at,
        currentDate: value.currentDate,
        firstMutableDate: value.firstMutableDate,
        input: value.normalizedInput,
        proposedDateChanges: value.proposedDateChanges.map((change) => ({
          workoutId: change.workoutId,
          fromDate: change.fromDate,
          toDate: change.toDate,
        })),
        previewWorkouts: value.previewWorkouts.map((workout) => ({
          workoutId: workout.workoutId,
          fromDate: workout.fromDate,
          toDate: workout.toDate,
          protection: workout.protection,
          workoutType: workout.workoutType,
          sourceWorkoutType: workout.sourceWorkoutType,
          workoutFamily: workout.workoutFamily,
          workoutIdentity: workout.workoutIdentity,
          calendarIconKey: workout.calendarIconKey,
          targetKeys: workout.targetKeys,
        })),
      }),
    )
    .digest("hex");
}

function parseScheduleReflowApplyRpcResult(
  value: unknown,
): { ok: true; result: ScheduleReflowApplyRpcResult } | ActivePlanScheduleReflowApplyFailure {
  const result = asRecord(value);

  if (!result || typeof result.ok !== "boolean") {
    return {
      ok: false,
      reason: "apply_failed",
      message: "Schedule changes could not be applied. The current plan is unchanged.",
    };
  }

  if (result.ok) {
    return {
      ok: true,
      result: {
        ok: true,
        applied_workout_count:
          typeof result.applied_workout_count === "number"
            ? result.applied_workout_count
            : undefined,
      },
    };
  }

  return {
    ok: true,
    result: {
      ok: false,
      reason: result.reason,
      message: result.message,
    },
  };
}

function readScheduleReflowRpcFailureReason(
  value: unknown,
): ActivePlanScheduleReflowApplyFailure["reason"] {
  if (
    value === "stale_preview" ||
    value === "protected_history_conflict" ||
    value === "fixed_rest_day_violation" ||
    value === "apply_failed"
  ) {
    return value;
  }

  return "apply_failed";
}

function groupWorkoutsByWeek(workouts: PersistedPlannedWorkoutRow[]) {
  const grouped = new Map<number, PersistedPlannedWorkoutRow[]>();

  for (const workout of workouts) {
    const weekWorkouts = grouped.get(workout.week_number) ?? [];
    weekWorkouts.push(workout);
    grouped.set(workout.week_number, weekWorkouts);
  }

  return grouped;
}

function dateForWeekdayInPlanWeek(weekStartDate: string, weekday: WeekdayName) {
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = addDaysIso(weekStartDate, dayOffset);

    if (weekdayLong(date) === weekday) {
      return date;
    }
  }

  return weekStartDate;
}

function isProtectedScheduleWorkout(
  workout: PersistedPlannedWorkoutRow,
  currentDate: string,
  logsByWorkoutId: Map<string, PersistedWorkoutLogRow>,
  evidenceWorkoutIds: Set<string>,
) {
  return (
    workout.workout_date <= currentDate ||
    logsByWorkoutId.has(workout.id) ||
    evidenceWorkoutIds.has(workout.id)
  );
}

function isLongRunWorkout(workout: PersistedPlannedWorkoutRow) {
  const identity = `${workout.source_workout_type ?? ""} ${workout.workout_identity ?? ""} ${
    workout.title
  }`.toLowerCase();

  return workout.workout_type === "long_run" || identity.includes("long");
}

function countSteps(value: Json | null) {
  return Array.isArray(value) ? value.length : 0;
}

function collectStepTargetKeys(value: Json | null) {
  if (!Array.isArray(value)) {
    return [];
  }

  const keys = new Set<string>();

  for (const entry of value) {
    const target = asRecord(entry)?.target;

    if (target && typeof target === "object" && !Array.isArray(target)) {
      for (const key of Object.keys(target)) {
        keys.add(key);
      }
    }
  }

  return Array.from(keys).sort();
}

function readWeekdayArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  try {
    return uniqueRunnerWeekdays(value.map(parseRunnerWeekday));
  } catch {
    return [];
  }
}

function readPositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

async function fetchScheduleEditEvidenceWorkoutIds(userId: string, workoutIds: string[]) {
  if (!workoutIds.length) {
    return new Set<string>();
  }

  const supabase = createAdminSupabaseClient();
  const [assetsResult, actualMetricsResult, comparisonsResult, insightsResult] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_actual_metrics")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_comparisons")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_ai_insights")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
  ]);

  if (assetsResult.error) throw new Error(assetsResult.error.message);
  if (actualMetricsResult.error) throw new Error(actualMetricsResult.error.message);
  if (comparisonsResult.error) throw new Error(comparisonsResult.error.message);
  if (insightsResult.error) throw new Error(insightsResult.error.message);

  return new Set([
    ...(assetsResult.data ?? []).map((row) => row.planned_workout_id),
    ...(actualMetricsResult.data ?? []).map((row) => row.planned_workout_id),
    ...(comparisonsResult.data ?? []).map((row) => row.planned_workout_id),
    ...(insightsResult.data ?? []).map((row) => row.planned_workout_id),
  ]);
}
