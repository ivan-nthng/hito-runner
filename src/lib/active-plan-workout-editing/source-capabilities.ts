import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import { resolveCalendarWorkoutEditability } from "@/lib/active-plan-workout-editing/policy";
import { workoutDocumentHasUnsafeMetricTruth } from "@/lib/manual-workout-authoring/persisted-workout-safety";
import { normalizePersistedWorkoutDocument } from "@/lib/workout-document";

export type CalendarWorkoutSourceEditingEligibility =
  | "eligible_past_unlogged"
  | "eligible_current_unlogged"
  | "eligible_future_unlogged"
  | "blocked";

export type CalendarWorkoutSourceEditingReason =
  | "logged_workout"
  | "skipped_logged_workout"
  | "evidence_backed_workout"
  | "protected_history"
  | "unsupported_source_metadata"
  | "unsupported_source_workout"
  | "rest_day"
  | "copy_requires_editor_support"
  | "edit_content_requires_editor_support";

export interface CalendarWorkoutSourceEditingCapabilities {
  canMove: boolean;
  canClear: boolean;
  canCopy: boolean;
  canEditContent: boolean;
  canDirectCopy: boolean;
  canDirectMove: boolean;
  canDragInitiate: boolean;
  eligibility: CalendarWorkoutSourceEditingEligibility;
  reason: CalendarWorkoutSourceEditingReason | null;
  copyReason: CalendarWorkoutSourceEditingReason | null;
  editContentReason: CalendarWorkoutSourceEditingReason | null;
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
}): CalendarWorkoutSourceEditingCapabilities {
  if (workout.workout_type === "rest") {
    return blockedSourceEditing("rest_day", "Rest days cannot start direct workout actions.");
  }

  const moveEditability = resolveCalendarWorkoutEditability(provenancePlan, "move_workout");
  const contentEditability = resolveCalendarWorkoutEditability(provenancePlan, "edit_workout");
  const document = normalizePersistedWorkoutDocument(workout);
  const validEditableDocument = document.ok && !workoutDocumentHasUnsafeMetricTruth(document.value);
  const canCopy = true;
  const canEditContent =
    contentEditability.ok && validEditableDocument && workout.workout_date >= currentDate;

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
      false,
    );
  }

  if (evidenceWorkoutIds.has(workout.id)) {
    return blockedSourceEditing(
      "evidence_backed_workout",
      "Evidence-backed workouts cannot be moved, cleared, or dragged; their prescription can still be copied.",
      canCopy,
      false,
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
      editContentReason: canEditContent ? null : "unsupported_source_workout",
    });
  }

  return allowedSourceEditing({
    eligibility: "eligible_past_unlogged",
    canCopy,
    canEditContent: false,
    editContentReason: "protected_history",
  });
}

function allowedSourceEditing({
  eligibility,
  canCopy,
  canEditContent,
  editContentReason,
}: {
  eligibility: Exclude<CalendarWorkoutSourceEditingEligibility, "blocked">;
  canCopy: boolean;
  canEditContent: boolean;
  editContentReason?: CalendarWorkoutSourceEditingReason | null;
}): CalendarWorkoutSourceEditingCapabilities {
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
    editContentReason: canEditContent
      ? null
      : (editContentReason ?? "edit_content_requires_editor_support"),
    message: null,
  };
}

function blockedSourceEditing(
  reason: CalendarWorkoutSourceEditingReason,
  message: string,
  canCopy = false,
  canEditContent = false,
): CalendarWorkoutSourceEditingCapabilities {
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
