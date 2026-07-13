import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import { resolveActivePlanWorkoutEditability } from "@/lib/active-plan-workout-editing/policy";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";
import { persistedManualWorkoutHasUnsafeMetricTruth } from "@/lib/manual-workout-authoring/persisted-workout-safety";

export type ActivePlanWorkoutSourceEditingEligibility =
  | "eligible_past_unlogged"
  | "eligible_current_unlogged"
  | "eligible_future_unlogged"
  | "blocked";

export type ActivePlanWorkoutSourceEditingReason =
  | "logged_workout"
  | "skipped_logged_workout"
  | "evidence_backed_workout"
  | "protected_history"
  | "unsupported_source_metadata"
  | "unsupported_source_workout"
  | "rest_day"
  | "unsupported_active_plan_source"
  | "copy_requires_editor_support"
  | "edit_content_requires_editor_support";

export interface ActivePlanWorkoutSourceEditingCapabilities {
  canMove: boolean;
  canClear: boolean;
  canCopy: boolean;
  canEditContent: boolean;
  canDirectCopy: boolean;
  canDirectMove: boolean;
  canDragInitiate: boolean;
  eligibility: ActivePlanWorkoutSourceEditingEligibility;
  reason: ActivePlanWorkoutSourceEditingReason | null;
  copyReason: ActivePlanWorkoutSourceEditingReason | null;
  editContentReason: ActivePlanWorkoutSourceEditingReason | null;
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
  if (!activePlan) {
    return blockedSourceEditing(
      "unsupported_active_plan_source",
      "There is no active plan for direct workout actions.",
    );
  }

  if (workout.user_id !== activePlan.user_id || workout.plan_cycle_id !== activePlan.id) {
    return blockedSourceEditing(
      "unsupported_source_metadata",
      "This workout row is not part of the current active plan.",
    );
  }

  const moveEditability = resolveActivePlanWorkoutEditability(activePlan, "move_workout");
  if (!moveEditability.ok) {
    return blockedSourceEditing(
      moveEditability.reason === "unsupported_source_metadata"
        ? "unsupported_source_metadata"
        : "unsupported_active_plan_source",
      moveEditability.message,
    );
  }

  if (workout.workout_type === "rest") {
    return blockedSourceEditing("rest_day", "Rest days cannot start direct workout actions.");
  }

  if (log) {
    return blockedSourceEditing(
      log.outcome === "skipped" ? "skipped_logged_workout" : "logged_workout",
      "Logged workouts cannot be moved, cleared, copied, or dragged.",
    );
  }

  if (evidenceWorkoutIds.has(workout.id)) {
    return blockedSourceEditing(
      "evidence_backed_workout",
      "Evidence-backed workouts cannot be moved, cleared, copied, or dragged.",
    );
  }

  const copyEditability = resolveActivePlanWorkoutEditability(activePlan, "copy_workout");
  const contentEditability = resolveActivePlanWorkoutEditability(activePlan, "edit_workout");
  const supportsManualDraftReconstruction = !persistedManualWorkoutHasUnsafeMetricTruth(workout);
  const canAttemptManualContentReconstruction = copyEditability.ok || contentEditability.ok;
  const reconstructableManualDraft = canAttemptManualContentReconstruction
    ? buildManualWorkoutDraftInputFromPersistedWorkout(
        workout,
        workout.workout_date < currentDate ? currentDate : workout.workout_date,
        {
          activePlanId: activePlan.id,
          activePlanSourceKind: activePlan.source_kind,
        },
      ).ok
    : false;
  const canCopy =
    copyEditability.ok && supportsManualDraftReconstruction && reconstructableManualDraft;
  const canEditContent =
    contentEditability.ok &&
    supportsManualDraftReconstruction &&
    reconstructableManualDraft &&
    workout.workout_date > currentDate;

  if (workout.workout_date >= currentDate) {
    return allowedSourceEditing({
      eligibility:
        workout.workout_date === currentDate
          ? "eligible_current_unlogged"
          : "eligible_future_unlogged",
      canCopy,
      canEditContent,
    });
  }

  return allowedSourceEditing({
    eligibility: "eligible_past_unlogged",
    canCopy: false,
    canEditContent: false,
  });
}

function allowedSourceEditing({
  eligibility,
  canCopy,
  canEditContent,
}: {
  eligibility: Exclude<ActivePlanWorkoutSourceEditingEligibility, "blocked">;
  canCopy: boolean;
  canEditContent: boolean;
}): ActivePlanWorkoutSourceEditingCapabilities {
  return {
    canMove: true,
    canClear: true,
    canCopy,
    canEditContent,
    canDirectCopy: canCopy,
    canDirectMove: true,
    canDragInitiate: true,
    eligibility,
    reason: null,
    copyReason: canCopy ? null : "copy_requires_editor_support",
    editContentReason: canEditContent ? null : "edit_content_requires_editor_support",
    message: null,
  };
}

function blockedSourceEditing(
  reason: ActivePlanWorkoutSourceEditingReason,
  message: string,
): ActivePlanWorkoutSourceEditingCapabilities {
  return {
    canMove: false,
    canClear: false,
    canCopy: false,
    canEditContent: false,
    canDirectCopy: false,
    canDirectMove: false,
    canDragInitiate: false,
    eligibility: "blocked",
    reason,
    copyReason: reason,
    editContentReason: reason,
    message,
  };
}
