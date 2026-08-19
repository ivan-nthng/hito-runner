import type { PersistedPlannedWorkoutRow } from "@/lib/runner-calendar-persistence";
import { TRAINING_PLAN_V2_IMPORT_SOURCE_KIND } from "@/lib/imported-plan";
import type { SourcePlanProvenanceRow } from "@/lib/source-plan-provenance-persistence";

export const CALENDAR_WORKOUT_MUTATION_SOURCE_KIND = "calendar_workout_mutation_v1" as const;

export const CALENDAR_WORKOUT_MUTATION_KIND = {
  addWorkout: "user_added_workout",
  clearWorkout: "user_cleared_workout",
  moveWorkout: "user_moved_workout",
  copyWorkout: "user_copied_workout",
  editWorkout: "user_edited_workout",
} as const;

export type CalendarWorkoutMutationKind =
  (typeof CALENDAR_WORKOUT_MUTATION_KIND)[keyof typeof CALENDAR_WORKOUT_MUTATION_KIND];

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

export interface CalendarWorkoutMutationEventInput {
  mutationKind: CalendarWorkoutMutationKind;
  originKind: PersistedPlannedWorkoutRow["origin_kind"];
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
  mutationMode?: "direct_manual_edit" | "workout_document_edit" | null;
  mutationPayloadVersion?: string | null;
  mutationChecksum?: string | null;
  trustedClientRows?: boolean | null;
  originalWorkoutSourceId?: string | null;
  originalWorkoutSourceType?: string | null;
  originalWorkoutFamily?: string | null;
  originalWorkoutIdentity?: string | null;
  originalPlanSourceKind?: string | null;
  originalPlanSourceStatus?: string | null;
  originalPlanOriginSourceKind?: string | null;
  originalPlanOriginSourceStatus?: string | null;
  previousWorkout?: PersistedPlannedWorkoutRow | null;
}

export interface CalendarWorkoutMutationEventPayload {
  mutation_source: typeof CALENDAR_WORKOUT_MUTATION_SOURCE_KIND;
  mutation_kind: CalendarWorkoutMutationKind;
  origin_kind: PersistedPlannedWorkoutRow["origin_kind"];
  original_plan_source_kind?: string;
  original_plan_source_status?: string | null;
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
  mutation_mode?: "direct_manual_edit" | "workout_document_edit";
  mutation_payload_version?: string;
  mutation_checksum?: string;
  trusted_client_rows?: boolean;
}

export function resolveCalendarWorkoutEditability(
  provenancePlan: SourcePlanProvenanceRow | null,
  operation: CalendarWorkoutEditOperation,
): CalendarWorkoutEditabilityResult {
  const sourceKind = provenancePlan?.source_kind?.trim() || "runner_owned_calendar_workout";

  return {
    ok: true,
    sourceKind,
    sourceStatus: provenancePlan ? resolvePlanProvenanceSourceStatus(provenancePlan) : null,
    operation,
  };
}

export function isEditableCalendarWorkoutSourceKind(sourceKind: string | null | undefined) {
  return Boolean(sourceKind?.trim());
}

export function isContentCopyableCalendarWorkoutSourceKind(sourceKind: string | null | undefined) {
  return Boolean(sourceKind?.trim());
}

export function resolvePlanProvenanceSourceStatus(provenancePlan: SourcePlanProvenanceRow) {
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

export function buildCalendarWorkoutMutationEvent({
  mutationKind,
  originKind,
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
  originalPlanSourceKind,
  originalPlanSourceStatus,
  originalPlanOriginSourceKind,
  originalPlanOriginSourceStatus,
  previousWorkout,
}: CalendarWorkoutMutationEventInput): CalendarWorkoutMutationEventPayload {
  return omitUndefined({
    mutation_source: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    mutation_kind: mutationKind,
    origin_kind: originKind,
    original_plan_source_kind: originalPlanSourceKind?.trim() || undefined,
    original_plan_source_status: originalPlanSourceStatus,
    original_plan_origin_source_kind: originalPlanOriginSourceKind ?? undefined,
    original_plan_origin_source_status: originalPlanOriginSourceStatus ?? undefined,
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

export interface CalendarWorkoutEditRootProvenance {
  originalPlanSourceKind: string;
  originalPlanSourceStatus: string | null;
  originalPlanOriginSourceKind: string | null;
  originalPlanOriginSourceStatus: string | null;
  originalWorkoutSourceId: string | null;
  originalWorkoutSourceType: string | null;
  originalWorkoutFamily: string | null;
  originalWorkoutIdentity: string | null;
}

export function resolveCalendarWorkoutEditRootProvenance(
  provenancePlan: SourcePlanProvenanceRow | null,
  workout: PersistedPlannedWorkoutRow,
  earliestEditPayload: unknown = null,
): CalendarWorkoutEditRootProvenance {
  const earliestEdit = asRecord(earliestEditPayload);

  if (Object.keys(earliestEdit).length > 0) {
    const rootSourceKind = readString(earliestEdit.original_plan_source_kind);
    if (rootSourceKind) {
      return {
        originalPlanSourceKind: rootSourceKind,
        originalPlanSourceStatus: readNullableString(earliestEdit.original_plan_source_status),
        originalPlanOriginSourceKind: readNullableString(
          earliestEdit.original_plan_origin_source_kind,
        ),
        originalPlanOriginSourceStatus: readNullableString(
          earliestEdit.original_plan_origin_source_status,
        ),
        originalWorkoutSourceId: readNullableString(earliestEdit.original_workout_source_id),
        originalWorkoutSourceType: readNullableString(earliestEdit.original_workout_source_type),
        originalWorkoutFamily: readNullableString(earliestEdit.original_workout_family),
        originalWorkoutIdentity: readNullableString(earliestEdit.original_workout_identity),
      };
    }
  }

  const sourceKind =
    provenancePlan?.source_kind?.trim() || workout.origin_kind || "runner_owned_calendar_workout";
  const importOrigin = provenancePlan
    ? resolveConfirmedImportOrigin(provenancePlan)
    : { sourceKind: null, sourceStatus: null };

  return {
    originalPlanSourceKind: sourceKind,
    originalPlanSourceStatus: provenancePlan
      ? resolvePlanProvenanceSourceStatus(provenancePlan)
      : null,
    originalPlanOriginSourceKind: importOrigin.sourceKind,
    originalPlanOriginSourceStatus: importOrigin.sourceStatus,
    originalWorkoutSourceId: workout.source_workout_id,
    originalWorkoutSourceType: workout.source_workout_type,
    originalWorkoutFamily: workout.workout_family,
    originalWorkoutIdentity: workout.workout_identity,
  };
}

function resolveConfirmedImportOrigin(activePlan: SourcePlanProvenanceRow) {
  const root = asRecord(activePlan.goal_metadata);
  const provenance = asRecord(root[TRAINING_PLAN_V2_IMPORT_SOURCE_KIND]);

  return {
    sourceKind: readString(provenance.origin_source_kind),
    sourceStatus: readString(provenance.origin_source_status),
  };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNullableString(value: unknown) {
  return value == null ? null : readString(value);
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
