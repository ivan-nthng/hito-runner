import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import { resolveActivePlanWorkoutEditability } from "@/lib/active-plan-workout-editing/policy";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";
import { persistedManualWorkoutHasUnsafeMetricTruth } from "@/lib/manual-workout-authoring/persisted-workout-safety";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "@/lib/manual-workout-authoring/schema";
import { diffDaysIso } from "@/lib/training";

export const MISSED_UNLOGGED_MOVE_WINDOW_DAYS = 7;

export type ActivePlanWorkoutSourceEditingEligibility =
  | "eligible_future_unlogged"
  | "eligible_missed_unlogged_recent"
  | "blocked";

export type ActivePlanWorkoutSourceEditingReason =
  | "logged_workout"
  | "skipped_logged_workout"
  | "evidence_backed_workout"
  | "protected_history"
  | "unsafe_metric_truth"
  | "unsupported_source_metadata"
  | "unsupported_source_workout"
  | "rest_day"
  | "past_not_missed_unlogged"
  | "missed_window_expired"
  | "unsupported_active_plan_source";

export interface ActivePlanWorkoutSourceEditingCapabilities {
  canDirectCopy: boolean;
  canDirectMove: boolean;
  canDragInitiate: boolean;
  eligibility: ActivePlanWorkoutSourceEditingEligibility;
  reason: ActivePlanWorkoutSourceEditingReason | null;
  message: string | null;
}

export function resolveActivePlanWorkoutSourceEditingCapabilities({
  activePlan,
  currentDate,
  evidenceWorkoutIds,
  log,
  workout,
}: {
  activePlan: PersistedPlanCycleRow | null;
  workout: PersistedPlannedWorkoutRow;
  log: PersistedWorkoutLogRow | null;
  evidenceWorkoutIds: ReadonlySet<string>;
  currentDate: string;
}): ActivePlanWorkoutSourceEditingCapabilities {
  if (!activePlan || activePlan.source_kind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND) {
    return blockedSourceEditing(
      "unsupported_active_plan_source",
      "Direct move, copy, and drag are available only for manual user-built active plans.",
    );
  }

  if (activePlan.status !== "active") {
    return blockedSourceEditing(
      "protected_history",
      "Only active manual plan rows can start direct workout edits.",
    );
  }

  if (workout.user_id !== activePlan.user_id || workout.plan_cycle_id !== activePlan.id) {
    return blockedSourceEditing(
      "unsupported_source_metadata",
      "This workout row is not part of the current active manual plan.",
    );
  }

  const moveEditability = resolveActivePlanWorkoutEditability(activePlan, "move_workout");
  if (!moveEditability.ok) {
    return blockedSourceEditing(
      moveEditability.reason === "unsupported_source_metadata"
        ? "unsupported_source_metadata"
        : "unsupported_active_plan_source",
      "This active plan is not currently editable for direct manual workout interactions.",
    );
  }

  if (workout.workout_type === "rest") {
    return blockedSourceEditing("rest_day", "Rest days cannot start direct workout edits.");
  }

  if (log) {
    return blockedSourceEditing(
      log.outcome === "skipped" ? "skipped_logged_workout" : "logged_workout",
      "Logged workouts cannot be moved, copied, or dragged.",
    );
  }

  if (evidenceWorkoutIds.has(workout.id)) {
    return blockedSourceEditing(
      "evidence_backed_workout",
      "Evidence-backed workouts cannot be moved, copied, or dragged.",
    );
  }

  if (persistedManualWorkoutHasUnsafeMetricTruth(workout)) {
    return blockedSourceEditing(
      "unsafe_metric_truth",
      "This workout has metric targets that cannot be moved or copied safely.",
    );
  }

  const sourceShape = buildManualWorkoutDraftInputFromPersistedWorkout(
    workout,
    workout.workout_date < currentDate ? currentDate : workout.workout_date,
    {
      activePlanId: activePlan.id,
      activePlanSourceKind: activePlan.source_kind,
    },
  );

  if (!sourceShape.ok) {
    return blockedSourceEditing(
      sourceShape.reason === "unsupported_payload"
        ? "unsupported_source_metadata"
        : "unsupported_source_workout",
      sourceShape.message,
    );
  }

  if (workout.workout_date > currentDate) {
    return {
      canDirectCopy: true,
      canDirectMove: true,
      canDragInitiate: true,
      eligibility: "eligible_future_unlogged",
      reason: null,
      message: null,
    };
  }

  const missedAgeDays = diffDaysIso(currentDate, workout.workout_date);
  if (missedAgeDays >= 1 && missedAgeDays <= MISSED_UNLOGGED_MOVE_WINDOW_DAYS) {
    return {
      canDirectCopy: false,
      canDirectMove: true,
      canDragInitiate: true,
      eligibility: "eligible_missed_unlogged_recent",
      reason: null,
      message: null,
    };
  }

  if (missedAgeDays > MISSED_UNLOGGED_MOVE_WINDOW_DAYS) {
    return blockedSourceEditing(
      "missed_window_expired",
      "This missed workout is outside the recent move window.",
    );
  }

  return blockedSourceEditing(
    "past_not_missed_unlogged",
    "Only future workouts or recent missed unlogged workouts can start direct moves.",
  );
}

function blockedSourceEditing(
  reason: ActivePlanWorkoutSourceEditingReason,
  message: string,
): ActivePlanWorkoutSourceEditingCapabilities {
  return {
    canDirectCopy: false,
    canDirectMove: false,
    canDragInitiate: false,
    eligibility: "blocked",
    reason,
    message,
  };
}
