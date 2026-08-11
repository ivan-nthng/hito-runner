import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
} from "@/lib/active-plan-persistence";
import { TRAINING_PLAN_V2_IMPORT_SOURCE_KIND } from "@/lib/imported-plan";

export const ACTIVE_PLAN_USER_EDIT_SOURCE_KIND = "active_plan_user_edit_v1" as const;

export const ACTIVE_PLAN_USER_EDIT_MUTATION_KIND = {
  addWorkout: "user_added_workout",
  clearWorkout: "user_cleared_workout",
  moveWorkout: "user_moved_workout",
  copyWorkout: "user_copied_workout",
  editWorkout: "user_edited_workout",
} as const;

export type ActivePlanUserEditMutationKind =
  (typeof ACTIVE_PLAN_USER_EDIT_MUTATION_KIND)[keyof typeof ACTIVE_PLAN_USER_EDIT_MUTATION_KIND];

export type CalendarWorkoutEditOperation =
  | "add_workout"
  | "clear_workout"
  | "move_workout"
  | "copy_workout"
  | "edit_workout";

export type CalendarWorkoutEditabilityResult =
  | {
      ok: true;
      sourceKind: string;
      sourceStatus: string | null;
      operation: CalendarWorkoutEditOperation;
    }
  | {
      ok: false;
      reason: "unsupported_source_metadata";
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
  sourceWorkoutId?: string | null;
  sourceWorkoutDate?: string | null;
  targetWorkoutId?: string | null;
  targetDate?: string | null;
  templateKey?: string | null;
  title?: string | null;
  mutationMode?: "direct_manual_edit" | null;
  mutationPayloadVersion?: string | null;
  mutationChecksum?: string | null;
  trustedClientRows?: boolean | null;
  originalWorkoutSourceId?: string | null;
  originalWorkoutSourceType?: string | null;
  originalWorkoutFamily?: string | null;
  originalWorkoutIdentity?: string | null;
  previousWorkout?: PersistedPlannedWorkoutRow | null;
}

export interface ActivePlanUserEditMetadata {
  mutation_source: typeof ACTIVE_PLAN_USER_EDIT_SOURCE_KIND;
  mutation_kind: ActivePlanUserEditMutationKind;
  original_plan_source_kind: string;
  original_plan_source_status: string | null;
  original_plan_origin_source_kind?: string;
  original_plan_origin_source_status?: string;
  original_workout_source_id?: string | null;
  original_workout_source_type?: string | null;
  original_workout_family?: string | null;
  original_workout_identity?: string | null;
  previous_workout?: PersistedPlannedWorkoutRow;
  workout_authoring_source_kind?: string;
  planned_workout_id?: string;
  previous_workout_date?: string;
  source_workout_id?: string;
  source_workout_date?: string;
  target_workout_id?: string;
  target_date?: string;
  template_key?: string;
  title?: string;
  review_payload_version: string;
  review_checksum: string;
  mutation_mode?: "direct_manual_edit";
  mutation_payload_version?: string;
  mutation_checksum?: string;
  trusted_client_rows?: boolean;
}

export function resolveCalendarWorkoutEditability(
  provenancePlan: PersistedPlanCycleRow | null,
  operation: CalendarWorkoutEditOperation,
): CalendarWorkoutEditabilityResult {
  if (!provenancePlan) {
    return {
      ok: false,
      reason: "unsupported_source_metadata",
      message: "This workout provenance is unavailable.",
    };
  }

  const sourceKind = provenancePlan.source_kind?.trim();
  if (!sourceKind) {
    return {
      ok: false,
      reason: "unsupported_source_metadata",
      message: "This workout provenance is missing source metadata.",
    };
  }

  return {
    ok: true,
    sourceKind,
    sourceStatus: resolvePlanProvenanceSourceStatus(provenancePlan),
    operation,
  };
}

export function isEditableCalendarWorkoutSourceKind(sourceKind: string | null | undefined) {
  return Boolean(sourceKind?.trim());
}

export function isContentCopyableCalendarWorkoutSourceKind(sourceKind: string | null | undefined) {
  return Boolean(sourceKind?.trim());
}

export function resolvePlanProvenanceSourceStatus(provenancePlan: PersistedPlanCycleRow) {
  const root = asRecord(provenancePlan.goal_metadata);
  const directStatus = readString(root.source_status);

  if (directStatus) {
    return directStatus;
  }

  for (const key of ["manual_user_built_plan", "selected_plan_engine", "ai_authored_plan_first"]) {
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
  mutationMode,
  mutationPayloadVersion,
  mutationChecksum,
  plannedWorkoutId,
  previousWorkoutDate,
  reviewChecksum,
  reviewPayloadVersion,
  sourceWorkoutId,
  sourceWorkoutDate,
  targetWorkoutId,
  targetDate,
  templateKey,
  title,
  trustedClientRows,
  workoutAuthoringSourceKind,
  originalWorkoutSourceId,
  originalWorkoutSourceType,
  originalWorkoutFamily,
  originalWorkoutIdentity,
  previousWorkout,
}: ActivePlanUserEditMetadataInput): ActivePlanUserEditMetadata {
  const sourceKind = activePlan.source_kind?.trim();

  if (!sourceKind) {
    throw new Error("Active plan user edit metadata requires an original source kind.");
  }

  const importOrigin = resolveConfirmedImportOrigin(activePlan);

  return omitUndefined({
    mutation_source: ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
    mutation_kind: mutationKind,
    original_plan_source_kind: sourceKind,
    original_plan_source_status: resolvePlanProvenanceSourceStatus(activePlan),
    original_plan_origin_source_kind: importOrigin.sourceKind ?? undefined,
    original_plan_origin_source_status: importOrigin.sourceStatus ?? undefined,
    original_workout_source_id: originalWorkoutSourceId,
    original_workout_source_type: originalWorkoutSourceType,
    original_workout_family: originalWorkoutFamily,
    original_workout_identity: originalWorkoutIdentity,
    previous_workout: previousWorkout ?? undefined,
    workout_authoring_source_kind: workoutAuthoringSourceKind?.trim() || undefined,
    planned_workout_id: plannedWorkoutId?.trim() || undefined,
    previous_workout_date: previousWorkoutDate?.trim() || undefined,
    source_workout_id: sourceWorkoutId?.trim() || undefined,
    source_workout_date: sourceWorkoutDate?.trim() || undefined,
    target_workout_id: targetWorkoutId?.trim() || undefined,
    target_date: targetDate?.trim() || undefined,
    template_key: templateKey?.trim() || undefined,
    title: title?.trim() || undefined,
    review_payload_version: reviewPayloadVersion,
    review_checksum: reviewChecksum,
    mutation_mode: mutationMode ?? undefined,
    mutation_payload_version: mutationPayloadVersion?.trim() || undefined,
    mutation_checksum: mutationChecksum?.trim() || undefined,
    trusted_client_rows: trustedClientRows ?? undefined,
  });
}

function resolveConfirmedImportOrigin(activePlan: PersistedPlanCycleRow) {
  const root = asRecord(activePlan.goal_metadata);
  const provenance = asRecord(root[TRAINING_PLAN_V2_IMPORT_SOURCE_KIND]);

  return {
    sourceKind: readString(provenance.origin_source_kind),
    sourceStatus: readString(provenance.origin_source_status),
  };
}

export function appendActivePlanUserEditMetadataToRecord(
  root: Record<string, unknown>,
  editMetadata: ActivePlanUserEditMetadata,
): Record<string, unknown> {
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
