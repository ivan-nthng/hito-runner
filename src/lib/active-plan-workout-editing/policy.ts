import type { PersistedPlanCycleRow } from "@/lib/active-plan-persistence";

export const ACTIVE_PLAN_USER_EDIT_SOURCE_KIND = "active_plan_user_edit_v1" as const;

export const ACTIVE_PLAN_USER_EDIT_MUTATION_KIND = {
  addWorkout: "user_added_workout",
  clearWorkout: "user_cleared_workout",
  moveWorkout: "user_moved_workout",
} as const;

export type ActivePlanUserEditMutationKind =
  (typeof ACTIVE_PLAN_USER_EDIT_MUTATION_KIND)[keyof typeof ACTIVE_PLAN_USER_EDIT_MUTATION_KIND];

export type ActivePlanWorkoutEditOperation = "add_workout" | "clear_workout" | "move_workout";

export type ActivePlanWorkoutEditabilityResult =
  | {
      ok: true;
      sourceKind: string;
      sourceStatus: string | null;
      operation: ActivePlanWorkoutEditOperation;
    }
  | {
      ok: false;
      reason: "no_active_plan" | "unsupported_active_plan_source" | "unsupported_source_metadata";
      message: string;
    };

export interface ActivePlanUserEditMetadataInput {
  activePlan: PersistedPlanCycleRow;
  mutationKind: ActivePlanUserEditMutationKind;
  reviewPayloadVersion: string;
  reviewChecksum: string;
  workoutAuthoringSourceKind?: string | null;
  plannedWorkoutId?: string | null;
  previousWorkoutDate?: string | null;
  targetDate?: string | null;
  templateKey?: string | null;
  title?: string | null;
}

export interface ActivePlanUserEditMetadata {
  mutation_source: typeof ACTIVE_PLAN_USER_EDIT_SOURCE_KIND;
  mutation_kind: ActivePlanUserEditMutationKind;
  original_plan_source_kind: string;
  original_plan_source_status: string | null;
  workout_authoring_source_kind?: string;
  planned_workout_id?: string;
  previous_workout_date?: string;
  target_date?: string;
  template_key?: string;
  title?: string;
  review_payload_version: string;
  review_checksum: string;
}

const EXPLICIT_EDITABLE_ACTIVE_PLAN_SOURCE_KINDS = new Set([
  "manual_user_built_plan_v1",
  "structured_authoring_v1",
  "ai_first_plan_blueprint_v1",
  "ai_first_plan_envelope_v1",
  "running_plan_engine_10k_builder_v1",
  "running_plan_engine_half_marathon_builder_v1",
  "running_plan_engine_marathon_base_builder_v1",
  "running_plan_engine_marathon_completion_builder_v1",
  "plan_preset_v1",
  "training_plan_v2_import",
  "active_plan_refresh_v1",
]);

export function resolveActivePlanWorkoutEditability(
  activePlan: PersistedPlanCycleRow | null,
  operation: ActivePlanWorkoutEditOperation,
): ActivePlanWorkoutEditabilityResult {
  if (!activePlan) {
    return {
      ok: false,
      reason: "no_active_plan",
      message: "There is no active plan to edit.",
    };
  }

  if (activePlan.status !== "active") {
    return {
      ok: false,
      reason: "unsupported_active_plan_source",
      message: "Only active plans can be edited.",
    };
  }

  const sourceKind = activePlan.source_kind?.trim();
  if (!sourceKind) {
    return {
      ok: false,
      reason: "unsupported_source_metadata",
      message: "This active plan is missing editable source metadata.",
    };
  }

  if (!isEditableActivePlanSourceKind(sourceKind, activePlan)) {
    return {
      ok: false,
      reason: "unsupported_active_plan_source",
      message: "This active plan source is not supported for workout editing yet.",
    };
  }

  return {
    ok: true,
    sourceKind,
    sourceStatus: resolveActivePlanSourceStatus(activePlan),
    operation,
  };
}

export function isEditableActivePlanSourceKind(
  sourceKind: string | null | undefined,
  activePlan?: PersistedPlanCycleRow | null,
) {
  const normalizedSourceKind = sourceKind?.trim();

  if (!normalizedSourceKind) {
    return false;
  }

  if (EXPLICIT_EDITABLE_ACTIVE_PLAN_SOURCE_KINDS.has(normalizedSourceKind)) {
    return true;
  }

  return (
    normalizedSourceKind.endsWith("_import") &&
    activePlan?.schema_version === "training-plan-v2" &&
    activePlan.source_template === "training-plan-v2"
  );
}

export function resolveActivePlanSourceStatus(activePlan: PersistedPlanCycleRow) {
  const root = asRecord(activePlan.goal_metadata);
  const directStatus = readString(root.source_status);

  if (directStatus) {
    return directStatus;
  }

  for (const key of [
    "manual_user_built_plan",
    "selected_plan_engine",
    "plan_preset",
    "active_plan_refresh",
    "ai_first_plan_blueprint",
    "ai_first_plan_envelope",
  ]) {
    const nestedStatus = readString(asRecord(root[key]).source_status);

    if (nestedStatus) {
      return nestedStatus;
    }
  }

  return null;
}

export function buildActivePlanUserEditMetadata({
  activePlan,
  mutationKind,
  plannedWorkoutId,
  previousWorkoutDate,
  reviewChecksum,
  reviewPayloadVersion,
  targetDate,
  templateKey,
  title,
  workoutAuthoringSourceKind,
}: ActivePlanUserEditMetadataInput): ActivePlanUserEditMetadata {
  const sourceKind = activePlan.source_kind?.trim();

  if (!sourceKind) {
    throw new Error("Active plan user edit metadata requires an original source kind.");
  }

  return omitUndefined({
    mutation_source: ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
    mutation_kind: mutationKind,
    original_plan_source_kind: sourceKind,
    original_plan_source_status: resolveActivePlanSourceStatus(activePlan),
    workout_authoring_source_kind: workoutAuthoringSourceKind?.trim() || undefined,
    planned_workout_id: plannedWorkoutId?.trim() || undefined,
    previous_workout_date: previousWorkoutDate?.trim() || undefined,
    target_date: targetDate?.trim() || undefined,
    template_key: templateKey?.trim() || undefined,
    title: title?.trim() || undefined,
    review_payload_version: reviewPayloadVersion,
    review_checksum: reviewChecksum,
  });
}

export function appendActivePlanUserEditMetadataToRecord(
  root: Record<string, unknown>,
  editMetadata: ActivePlanUserEditMetadata,
) {
  const history = Array.isArray(root.active_plan_user_edits) ? root.active_plan_user_edits : [];

  return {
    ...root,
    active_plan_user_edit: editMetadata,
    active_plan_user_edits: [...history, editMetadata],
  };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function omitUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}
