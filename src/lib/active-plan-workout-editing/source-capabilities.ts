import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import { resolveCalendarWorkoutEditability } from "@/lib/active-plan-workout-editing/policy";
import { reviewManualWorkoutDraft } from "@/lib/manual-workout-authoring/actions";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "@/lib/manual-workout-authoring/copy-paste-reconstruction";

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

export function resolveCalendarWorkoutSourceEditingCapabilities({
  provenancePlan,
  currentDate,
  evidenceWorkoutIds,
  log,
  workout,
}: {
  provenancePlan: PersistedPlanCycleRow | null;
  workout: PersistedPlannedWorkoutRow;
  log: PersistedWorkoutLogRow | null;
  evidenceWorkoutIds: ReadonlySet<string>;
  currentDate: string;
}): ActivePlanWorkoutSourceEditingCapabilities {
  if (!provenancePlan) {
    return blockedSourceEditing(
      "unsupported_source_metadata",
      "This workout provenance is unavailable for direct workout actions.",
    );
  }

  if (workout.user_id !== provenancePlan.user_id) {
    return blockedSourceEditing(
      "unsupported_source_metadata",
      "This workout row does not belong to the current runner.",
    );
  }

  if (workout.workout_type === "rest") {
    return blockedSourceEditing("rest_day", "Rest days cannot start direct workout actions.");
  }

  const moveEditability = resolveCalendarWorkoutEditability(provenancePlan, "move_workout");
  const contentEditability = resolveCalendarWorkoutEditability(provenancePlan, "edit_workout");
  const reconstructedManualDraft = contentEditability.ok
    ? buildManualWorkoutDraftInputFromPersistedWorkout(
        workout,
        workout.workout_date < currentDate ? currentDate : workout.workout_date,
        {
          activePlanId: provenancePlan.id,
          activePlanSourceKind: provenancePlan.source_kind,
        },
      )
    : null;
  const reconstructableManualDraft = Boolean(
    reconstructedManualDraft?.ok &&
    reviewManualWorkoutDraft(reconstructedManualDraft.draftInput).ok,
  );
  const canCopy = true;
  const canEditContent =
    contentEditability.ok && reconstructableManualDraft && workout.workout_date >= currentDate;

  if (!moveEditability.ok) {
    return blockedSourceEditing(
      "unsupported_source_metadata",
      moveEditability.message,
      canCopy,
      canEditContent,
    );
  }

  if (log) {
    return blockedSourceEditing(
      log.outcome === "skipped" ? "skipped_logged_workout" : "logged_workout",
      "Logged workouts cannot be moved, cleared, or dragged; their prescription can still be copied.",
      canCopy,
      canEditContent,
    );
  }

  if (evidenceWorkoutIds.has(workout.id)) {
    return blockedSourceEditing(
      "evidence_backed_workout",
      "Evidence-backed workouts cannot be moved, cleared, or dragged; their prescription can still be copied.",
      canCopy,
      canEditContent,
    );
  }

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
    canCopy,
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
  canCopy = false,
  canEditContent = false,
): ActivePlanWorkoutSourceEditingCapabilities {
  return {
    canMove: false,
    canClear: false,
    canCopy,
    canEditContent,
    canDirectCopy: canCopy,
    canDirectMove: false,
    canDragInitiate: false,
    eligibility: "blocked",
    reason,
    copyReason: canCopy ? null : reason,
    editContentReason: canEditContent ? null : reason,
    message,
  };
}
