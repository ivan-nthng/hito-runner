import { workoutDocumentHasUnsafeMetricTruth } from "@/lib/manual-workout-authoring/persisted-workout-safety";
import type {
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "@/lib/runner-calendar-persistence";
import type { SourcePlanProvenanceRow } from "@/lib/source-plan-provenance-persistence";
import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { normalizePersistedWorkoutDocument } from "@/lib/workout-document";

type CalendarWorkoutMutationEventRow =
  Database["public"]["Tables"]["calendar_workout_mutation_events"]["Row"];
type RpcPayload = { [key: string]: Json | undefined };
type AtomicCalendarWorkoutMutationKind = "add" | "clear" | "move";

export class CalendarPersistenceRejection extends Error {
  constructor(
    readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = "CalendarPersistenceRejection";
  }
}

export async function applyAtomicCalendarWorkoutMutation(input: {
  userId: string;
  currentDate: string;
  mutationKind: AtomicCalendarWorkoutMutationKind;
  expectedSourceWorkout: Json;
  expectedTargetWorkout: Json;
  workoutInsert: Json;
  workoutUpdate: Json;
  mutationEvent: Json;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_calendar_workout_mutation", {
    p_user_id: input.userId,
    p_current_date: input.currentDate,
    p_mutation_kind: input.mutationKind,
    p_expected_source_workout: input.expectedSourceWorkout,
    p_expected_target_workout: input.expectedTargetWorkout,
    p_workout_insert: input.workoutInsert,
    p_workout_update: input.workoutUpdate,
    p_mutation_event: input.mutationEvent,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Calendar workout mutation");
  const mutatedWorkout = readOptionalObjectField(
    payload,
    "mutated_workout",
  ) as PersistedPlannedWorkoutRow | null;
  const deletedWorkout = readOptionalObjectField(
    payload,
    "deleted_workout",
  ) as PersistedPlannedWorkoutRow | null;
  const restoredWorkout = readOptionalObjectField(
    payload,
    "restored_workout",
  ) as PersistedPlannedWorkoutRow | null;
  const mutationEvent = readObjectField(
    payload,
    "mutation_event",
  ) as CalendarWorkoutMutationEventRow;

  return {
    mutatedWorkout,
    deletedWorkout,
    restoredWorkout,
    mutationEvent,
    undoExpiresAt: readOptionalStringField(payload, "undo_expires_at"),
  };
}

export async function applyAtomicAdaptiveInitialDetailedBlockMaterialization(input: {
  userId: string;
  currentDate: string;
  blueprintId: string;
  blueprintVersion: number;
  blueprintSha256: string;
  candidateId: string;
  candidateVersion: number;
  candidateSha256: string;
  inputFingerprintSha256: string;
  expectedBlueprintContent: Json;
  expectedCandidateContent: Json;
  expectedInputSnapshot: Json;
  sourceReviewChecksum: string;
  workoutReviewChecksum: string;
  workoutInserts: Json[];
  mutationEvents: Json[];
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_adaptive_initial_detailed_block_materialization", {
    p_user_id: input.userId,
    p_current_date: input.currentDate,
    p_blueprint_id: input.blueprintId,
    p_blueprint_version: input.blueprintVersion,
    p_blueprint_sha256: input.blueprintSha256,
    p_candidate_id: input.candidateId,
    p_candidate_version: input.candidateVersion,
    p_candidate_sha256: input.candidateSha256,
    p_input_fingerprint_sha256: input.inputFingerprintSha256,
    p_expected_blueprint_content: input.expectedBlueprintContent,
    p_expected_candidate_content: input.expectedCandidateContent,
    p_expected_input_snapshot: input.expectedInputSnapshot,
    p_source_review_checksum: input.sourceReviewChecksum,
    p_workout_review_checksum: input.workoutReviewChecksum,
    p_workout_inserts: input.workoutInserts,
    p_mutation_events: input.mutationEvents,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Adaptive detailed-block materialisation");
  const insertedWorkouts = readObjectArrayField(
    payload,
    "inserted_workouts",
  ) as PersistedPlannedWorkoutRow[];
  const mutationEvents = readObjectArrayField(
    payload,
    "mutation_events",
  ) as CalendarWorkoutMutationEventRow[];

  return {
    blueprintId: readStringField(payload, "blueprint_id"),
    detailedCandidateId: readStringField(payload, "detailed_candidate_id"),
    blockConfirmationId: readStringField(payload, "block_confirmation_id"),
    calendarRowCount: readNonNegativeIntegerField(payload, "calendar_row_count"),
    insertedWorkouts,
    mutationEvents,
  };
}

export async function applyAtomicAdaptiveContinuationDetailedBlockMaterialization(input: {
  userId: string;
  currentDate: string;
  blueprintId: string;
  blueprintVersion: number;
  blueprintSha256: string;
  predecessorConfirmationId: string;
  candidateId: string;
  candidateVersion: number;
  candidateSha256: string;
  inputFingerprintSha256: string;
  expectedCandidateContent: Json;
  expectedInputSnapshot: Json;
  reviewSealSha256: string;
  workoutInserts: Json[];
  mutationEvents: Json[];
}) {
  const result = await createAdminSupabaseClient().rpc(
    "apply_adaptive_continuation_detailed_block_materialization",
    {
      p_user_id: input.userId,
      p_current_date: input.currentDate,
      p_blueprint_id: input.blueprintId,
      p_blueprint_version: input.blueprintVersion,
      p_blueprint_sha256: input.blueprintSha256,
      p_predecessor_confirmation_id: input.predecessorConfirmationId,
      p_candidate_id: input.candidateId,
      p_candidate_version: input.candidateVersion,
      p_candidate_sha256: input.candidateSha256,
      p_input_fingerprint_sha256: input.inputFingerprintSha256,
      p_expected_candidate_content: input.expectedCandidateContent,
      p_expected_input_snapshot: input.expectedInputSnapshot,
      p_review_seal_sha256: input.reviewSealSha256,
      p_workout_inserts: input.workoutInserts,
      p_mutation_events: input.mutationEvents,
    },
  );

  if (result.error) throw new Error(result.error.message);
  const payload = readRpcPayload(result.data, "Adaptive continuation materialisation");
  return {
    blueprintId: readStringField(payload, "blueprint_id"),
    detailedCandidateId: readStringField(payload, "detailed_candidate_id"),
    blockConfirmationId: readStringField(payload, "block_confirmation_id"),
    predecessorConfirmationId: readStringField(payload, "predecessor_confirmation_id"),
    continuationInputRevisionId: readStringField(payload, "continuation_input_revision_id"),
    calendarRowCount: readNonNegativeIntegerField(payload, "calendar_row_count"),
    consumedPreferenceCount: readNonNegativeIntegerField(payload, "consumed_preference_count"),
    insertedWorkouts: readObjectArrayField(
      payload,
      "inserted_workouts",
    ) as PersistedPlannedWorkoutRow[],
    mutationEvents: readObjectArrayField(
      payload,
      "mutation_events",
    ) as CalendarWorkoutMutationEventRow[],
  };
}

export async function applyAtomicCalendarWorkoutContentEdit(input: {
  userId: string;
  workoutId: string;
  currentDate: string;
  expectedWorkout: Json;
  workoutUpdate: Json;
  mutationEvent: Json;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("apply_calendar_workout_content_edit", {
    p_user_id: input.userId,
    p_workout_id: input.workoutId,
    p_current_date: input.currentDate,
    p_expected_workout: input.expectedWorkout,
    p_workout_update: input.workoutUpdate,
    p_mutation_event: input.mutationEvent,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Calendar workout content edit");

  return {
    editedWorkout: readObjectField(payload, "edited_workout") as PersistedPlannedWorkoutRow,
    mutationEvent: readObjectField(payload, "mutation_event") as CalendarWorkoutMutationEventRow,
  };
}

export async function clearAtomicCalendarFutureWorkouts(input: {
  userId: string;
  currentDate: string;
}) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.rpc("clear_calendar_future_workouts", {
    p_user_id: input.userId,
    p_current_date: input.currentDate,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const payload = readRpcPayload(result.data, "Future Calendar deletion");

  return {
    currentDate: readStringField(payload, "current_date"),
    clearedWorkoutCount: readNonNegativeIntegerField(payload, "cleared_workout_count"),
  };
}

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
  mutationMode?:
    | "direct_manual_edit"
    | "workout_document_edit"
    | "workout_document_nested_segment_identity_backfill"
    | null;
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
  mutation_mode?:
    | "direct_manual_edit"
    | "workout_document_edit"
    | "workout_document_nested_segment_identity_backfill";
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
  provenancePlan: SourcePlanProvenanceRow | null;
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
  if (!document.ok || workoutDocumentHasUnsafeMetricTruth(document.value)) {
    return blockedSourceEditing(
      "unsupported_source_workout",
      document.ok
        ? "This workout contains target provenance that cannot be changed safely."
        : document.message,
    );
  }

  const canCopy = true;
  const canEditContent = contentEditability.ok && workout.workout_date >= currentDate;

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
      "Logged workouts cannot be copied, moved, cleared, edited, or dragged.",
    );
  }

  if (evidenceWorkoutIds.has(workout.id)) {
    return blockedSourceEditing(
      "evidence_backed_workout",
      "Evidence-backed workouts cannot be copied, moved, cleared, edited, or dragged.",
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

  return blockedSourceEditing(
    "protected_history",
    "Past workouts cannot be copied, moved, cleared, edited, or dragged.",
  );
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

function resolveConfirmedImportOrigin(provenancePlan: SourcePlanProvenanceRow) {
  const root = asRecord(provenancePlan.goal_metadata);
  const sourceKind = provenancePlan.source_kind?.trim();
  const provenance = sourceKind ? asRecord(root[sourceKind]) : {};

  return {
    sourceKind: readString(provenance.origin_source_kind),
    sourceStatus: readString(provenance.origin_source_status),
  };
}

function readRpcPayload(value: Json, operation: string): RpcPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${operation} returned an invalid transaction result.`);
  }

  if (value.ok !== true) {
    throw new CalendarPersistenceRejection(
      typeof value.reason === "string" ? value.reason : "persistence_failed",
      typeof value.message === "string"
        ? value.message
        : `${operation} rejected the prepared mutation.`,
    );
  }

  return value;
}

function readObjectField(value: RpcPayload, key: string) {
  const field = value[key];

  if (!field || typeof field !== "object" || Array.isArray(field)) {
    throw new Error(`Atomic persistence result is missing ${key}.`);
  }

  return field;
}

function readOptionalObjectField(value: RpcPayload, key: string) {
  const field = value[key];

  if (field === null || field === undefined) {
    return null;
  }

  if (typeof field !== "object" || Array.isArray(field)) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
}

function readObjectArrayField(value: RpcPayload, key: string) {
  const field = value[key];

  if (
    !Array.isArray(field) ||
    field.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry))
  ) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
}

function readStringField(value: RpcPayload, key: string) {
  const field = value[key];

  if (typeof field !== "string" || !field) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
}

function readOptionalStringField(value: RpcPayload, key: string) {
  const field = value[key];

  if (field === null || field === undefined) {
    return null;
  }

  if (typeof field !== "string" || !field) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
}

function readNonNegativeIntegerField(value: RpcPayload, key: string) {
  const field = value[key];

  if (typeof field !== "number" || !Number.isSafeInteger(field) || field < 0) {
    throw new Error(`Atomic persistence result has an invalid ${key}.`);
  }

  return field;
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
