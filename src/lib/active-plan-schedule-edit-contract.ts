import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
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
