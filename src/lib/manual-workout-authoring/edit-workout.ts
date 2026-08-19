import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
  buildCalendarWorkoutMutationEvent,
  resolveCalendarWorkoutEditRootProvenance,
  resolvePlanProvenanceSourceStatus,
  type CalendarWorkoutEditRootProvenance,
} from "@/lib/active-plan-workout-editing/policy";
import {
  getCalendarWorkoutMutationContext,
  type CalendarWorkoutContext,
  type PersistedPlannedWorkoutRow,
} from "@/lib/runner-calendar-persistence";
import type { SourcePlanProvenanceRow } from "@/lib/source-plan-provenance-persistence";
import {
  CalendarPersistenceRejection,
  applyAtomicCalendarWorkoutContentEdit,
} from "@/lib/active-plan-lifecycle-persistence";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  type ManualWorkoutEvidenceFetcher,
} from "@/lib/manual-workout-authoring/active-plan-add";
import {
  buildPersistedEditReview,
  buildFullSourceWorkoutFingerprint,
  validatePersistedEditReviewProof,
  WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
  type WorkoutDocumentPersistedEditReview,
} from "@/lib/manual-workout-authoring/edit-workout-review-token";
import {
  validateWorkoutDocumentTargetEdit,
  workoutDocumentHasUnsafeMetricTruth,
} from "@/lib/manual-workout-authoring/persisted-workout-safety";
import { toJson } from "@/lib/manual-workout-authoring/persistence";
import { inputHasClientPayload } from "@/lib/manual-workout-authoring/schema";
import { getCurrentManualWorkoutAuthoringUserId } from "@/lib/manual-workout-authoring/request-auth";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import {
  buildEditedWorkoutDocument,
  buildWorkoutDocumentEditProjection,
  normalizePersistedWorkoutDocument,
  type WorkoutDocument,
  type WorkoutDocumentEditProjection,
} from "@/lib/workout-document";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const workoutDocumentEditSourceInputSchema = z
  .object({
    provenancePlanId: z.string().uuid().optional(),
    plannedWorkoutId: z.string().uuid(),
    workoutDate: isoDateSchema,
  })
  .strict();

export const workoutDocumentPersistedEditReviewInputSchema = workoutDocumentEditSourceInputSchema
  .extend({
    editProjection: z.unknown(),
  })
  .strict();

export const workoutDocumentPersistedEditConfirmInputSchema = workoutDocumentEditSourceInputSchema
  .extend({
    editProjection: z.unknown(),
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict();

export const manualWorkoutPersistedEditReviewInputSchema =
  workoutDocumentPersistedEditReviewInputSchema;
export const manualWorkoutPersistedEditConfirmInputSchema =
  workoutDocumentPersistedEditConfirmInputSchema;

type WorkoutDocumentEditSourceInput = z.output<typeof workoutDocumentEditSourceInputSchema>;

export type WorkoutDocumentPersistedEditFailureReason =
  | "unauthenticated"
  | "invalid_input"
  | "invalid_review"
  | "stale_review"
  | "unsupported_source_metadata"
  | "source_workout_not_found"
  | "source_workout_not_owned"
  | "source_date_changed"
  | "source_workout_not_supported"
  | "workout_type_changed_to_rest"
  | "client_payload_rejected"
  | "logged_workout"
  | "evidence_backed_workout"
  | "protected_day"
  | "persistence_failed";

type WorkoutDocumentPersistedEditBlockedResult = {
  ok: false;
  status: "blocked";
  persisted: false;
  reason: WorkoutDocumentPersistedEditFailureReason;
  message: string;
  sourceKind: string | null;
  workoutEditSourceKind: typeof CALENDAR_WORKOUT_MUTATION_SOURCE_KIND;
};

export type WorkoutDocumentPersistedEditReconstructResult =
  | {
      ok: true;
      status: "document_ready";
      persisted: false;
      sourceKind: string;
      workoutEditSourceKind: typeof CALENDAR_WORKOUT_MUTATION_SOURCE_KIND;
      provenancePlanId: string | null;
      plannedWorkoutId: string;
      workoutDate: string;
      document: WorkoutDocument;
      editProjection: WorkoutDocumentEditProjection;
      safety: {
        sourceWorkoutVerified: true;
        strictDocumentVerified: true;
        originNeutral: true;
        trustedClientRows: false;
        callsOpenAi: false;
      };
    }
  | WorkoutDocumentPersistedEditBlockedResult;

export type WorkoutDocumentPersistedEditReviewResult =
  | {
      ok: true;
      status: "review_ready";
      persisted: false;
      sourceKind: string;
      workoutEditSourceKind: typeof CALENDAR_WORKOUT_MUTATION_SOURCE_KIND;
      provenancePlanId: string | null;
      plannedWorkoutId: string;
      workoutDate: string;
      editProjection: WorkoutDocumentEditProjection;
      candidateDocument: WorkoutDocument;
      review: WorkoutDocumentPersistedEditReview;
      safety: {
        requiresExplicitConfirm: true;
        sourceWorkoutVerified: true;
        strictDocumentVerified: true;
        sourceFingerprintSigned: true;
        originNeutral: true;
        updatesSamePlannedWorkoutRow: true;
        trustedClientRows: false;
        callsOpenAi: false;
      };
    }
  | WorkoutDocumentPersistedEditBlockedResult;

export type WorkoutDocumentPersistedEditConfirmResult =
  | {
      ok: true;
      status: "updated";
      persisted: true;
      sourceKind: string;
      sourceStatus: string | null;
      workoutEditSourceKind: typeof CALENDAR_WORKOUT_MUTATION_SOURCE_KIND;
      provenancePlanId: string | null;
      plannedWorkoutId: string;
      workoutDate: string;
      title: string;
      reviewChecksum: string;
      exactnessPayloadVersion: typeof WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION;
      mutationChecksum: string;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      sourceMetadata: {
        editSourceKind: typeof CALENDAR_WORKOUT_MUTATION_SOURCE_KIND;
        mutationKind: typeof CALENDAR_WORKOUT_MUTATION_KIND.editWorkout;
        mutationMode: "workout_document_edit";
        mutationPayloadVersion: typeof WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION;
        mutationChecksum: string;
        plannedWorkoutId: string;
        workoutDate: string;
        reviewChecksum: string;
        originalPlanSourceKind: string;
        originalPlanSourceStatus: string | null;
        originalPlanOriginSourceKind: string | null;
        originalPlanOriginSourceStatus: string | null;
        originalWorkoutSourceId: string | null;
        originalWorkoutSourceType: string | null;
        originalWorkoutFamily: string | null;
        originalWorkoutIdentity: string | null;
        trustedClientRows: false;
      };
      safety: {
        requiresExplicitConfirm: true;
        sourceWorkoutVerified: true;
        strictDocumentVerified: true;
        sourceFingerprintSigned: true;
        preEditPlannedTruthPreserved: true;
        historicalRecordsPreserved: true;
        updatedExactlyOneRow: true;
        updatesSamePlannedWorkoutRow: true;
        sourceProvenanceUnchanged: true;
        trustedClientRows: false;
        serverRebuiltReview: true;
        callsOpenAi: false;
      };
    }
  | WorkoutDocumentPersistedEditBlockedResult;

export interface WorkoutDocumentPersistedEditDependencies {
  getCalendarWorkoutContextForUser?: typeof getCalendarWorkoutMutationContext;
  getEarliestMutationEventForWorkout?: typeof getEarliestMutationEventForWorkout;
  fetchEvidenceWorkoutIds?: ManualWorkoutEvidenceFetcher;
  persistWorkoutEdit?: typeof persistWorkoutDocumentEdit;
  currentDate?: string;
}

type WorkoutDocumentPersistedEditTarget =
  | {
      ok: true;
      provenancePlan: SourcePlanProvenanceRow | null;
      sourceWorkout: PersistedPlannedWorkoutRow;
      sourceDocument: WorkoutDocument;
      rootProvenance: CalendarWorkoutEditRootProvenance;
      otherWorkouts: PersistedPlannedWorkoutRow[];
      currentDate: string;
    }
  | {
      ok: false;
      reason: WorkoutDocumentPersistedEditFailureReason;
      message: string;
    };

type PersistWorkoutDocumentEditInput = {
  userId: string;
  currentDate: string;
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  candidateDocument: WorkoutDocument;
  rootProvenance: CalendarWorkoutEditRootProvenance;
  review: WorkoutDocumentPersistedEditReview;
};

type PersistWorkoutDocumentEditResult =
  | {
      ok: true;
      editedWorkout: PersistedPlannedWorkoutRow;
      mutationEventId: number;
    }
  | {
      ok: false;
      reason: "stale_review" | "protected_day";
      message: string;
    };

export const reconstructManualWorkoutPersistedEditDraft = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<WorkoutDocumentPersistedEditReconstructResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();
    return userId
      ? reconstructWorkoutDocumentPersistedEditForUser(userId, data)
      : buildEditBlocked("unauthenticated", "Sign in before editing workouts.");
  });

export const reviewManualWorkoutPersistedEditDraft = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<WorkoutDocumentPersistedEditReviewResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();
    return userId
      ? reviewWorkoutDocumentPersistedEditForUser(userId, data)
      : buildEditBlocked("unauthenticated", "Sign in before reviewing workout edits.");
  });

export const confirmManualWorkoutPersistedEdit = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<WorkoutDocumentPersistedEditConfirmResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();
    return userId
      ? confirmWorkoutDocumentPersistedEditForUser(userId, data)
      : buildEditBlocked("unauthenticated", "Sign in before saving workout edits.");
  });

export async function reconstructWorkoutDocumentPersistedEditForUser(
  userId: string,
  input: unknown,
  dependencies: WorkoutDocumentPersistedEditDependencies = {},
): Promise<WorkoutDocumentPersistedEditReconstructResult> {
  const parsed = workoutDocumentEditSourceInputSchema.safeParse(input);
  if (!parsed.success) {
    return buildEditBlocked(
      inputHasClientPayload(parsed.error) ? "client_payload_rejected" : "invalid_input",
      inputHasClientPayload(parsed.error)
        ? "Workout edit reconstruction accepts only persisted source identifiers."
        : "The workout edit reconstruction payload is invalid.",
    );
  }

  const target = await resolveWorkoutDocumentPersistedEditTarget(userId, parsed.data, dependencies);
  if (!target.ok) return buildEditBlocked(target.reason, target.message);

  return {
    ok: true,
    status: "document_ready",
    persisted: false,
    sourceKind: target.sourceWorkout.origin_kind,
    workoutEditSourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    provenancePlanId: target.sourceWorkout.plan_cycle_id,
    plannedWorkoutId: target.sourceWorkout.id,
    workoutDate: target.sourceWorkout.workout_date,
    document: target.sourceDocument,
    editProjection: buildWorkoutDocumentEditProjection(target.sourceDocument),
    safety: {
      sourceWorkoutVerified: true,
      strictDocumentVerified: true,
      originNeutral: true,
      trustedClientRows: false,
      callsOpenAi: false,
    },
  };
}

export async function reviewWorkoutDocumentPersistedEditForUser(
  userId: string,
  input: unknown,
  dependencies: WorkoutDocumentPersistedEditDependencies = {},
): Promise<WorkoutDocumentPersistedEditReviewResult> {
  const parsed = workoutDocumentPersistedEditReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return buildEditBlocked(
      inputHasClientPayload(parsed.error) ? "client_payload_rejected" : "invalid_input",
      "Workout edit review accepts source identifiers and one document edit projection.",
    );
  }

  const target = await resolveWorkoutDocumentPersistedEditTarget(userId, parsed.data, dependencies);
  if (!target.ok) return buildEditBlocked(target.reason, target.message);

  const candidate = buildValidatedCandidate(target, parsed.data.editProjection);
  if (!candidate.ok) return buildEditBlocked(candidate.reason, candidate.message);

  const editProjection = buildWorkoutDocumentEditProjection(candidate.document);
  const review = buildPersistedEditReview({
    sourceWorkout: target.sourceWorkout,
    otherWorkouts: target.otherWorkouts,
    editProjection,
    candidateDocument: candidate.document,
    rootProvenance: target.rootProvenance,
  });

  return {
    ok: true,
    status: "review_ready",
    persisted: false,
    sourceKind: target.sourceWorkout.origin_kind,
    workoutEditSourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    provenancePlanId: target.sourceWorkout.plan_cycle_id,
    plannedWorkoutId: target.sourceWorkout.id,
    workoutDate: target.sourceWorkout.workout_date,
    editProjection,
    candidateDocument: candidate.document,
    review,
    safety: {
      requiresExplicitConfirm: true,
      sourceWorkoutVerified: true,
      strictDocumentVerified: true,
      sourceFingerprintSigned: true,
      originNeutral: true,
      updatesSamePlannedWorkoutRow: true,
      trustedClientRows: false,
      callsOpenAi: false,
    },
  };
}

export async function confirmWorkoutDocumentPersistedEditForUser(
  userId: string,
  input: unknown,
  dependencies: WorkoutDocumentPersistedEditDependencies = {},
): Promise<WorkoutDocumentPersistedEditConfirmResult> {
  const parsed = workoutDocumentPersistedEditConfirmInputSchema.safeParse(input);
  if (!parsed.success) {
    return buildEditBlocked(
      inputHasClientPayload(parsed.error) ? "client_payload_rejected" : "invalid_review",
      "The workout edit confirmation payload is invalid. Refresh the review.",
    );
  }

  const target = await resolveWorkoutDocumentPersistedEditTarget(userId, parsed.data, dependencies);
  if (!target.ok) return buildEditBlocked(target.reason, target.message);

  const candidate = buildValidatedCandidate(target, parsed.data.editProjection);
  if (!candidate.ok) return buildEditBlocked(candidate.reason, candidate.message);

  const editProjection = buildWorkoutDocumentEditProjection(candidate.document);
  const review = buildPersistedEditReview({
    sourceWorkout: target.sourceWorkout,
    otherWorkouts: target.otherWorkouts,
    editProjection,
    candidateDocument: candidate.document,
    rootProvenance: target.rootProvenance,
  });
  const reviewProof = validatePersistedEditReviewProof({
    expectedChecksum: review.reviewChecksum,
    reviewChecksum: parsed.data.reviewChecksum,
    reviewToken: parsed.data.reviewToken,
  });
  if (!reviewProof.ok) {
    return buildEditBlocked(
      reviewProof.reason,
      reviewProof.reason === "stale_review"
        ? "This workout edit review no longer matches authoritative workout truth."
        : "This workout edit review token is invalid. Refresh the review.",
    );
  }

  const persistEdit = dependencies.persistWorkoutEdit ?? persistWorkoutDocumentEdit;
  try {
    const persistence = await persistEdit({
      userId,
      currentDate: target.currentDate,
      sourceWorkout: target.sourceWorkout,
      otherWorkouts: target.otherWorkouts,
      candidateDocument: candidate.document,
      rootProvenance: target.rootProvenance,
      review,
    });
    if (!persistence.ok) return buildEditBlocked(persistence.reason, persistence.message);

    return {
      ok: true,
      status: "updated",
      persisted: true,
      sourceKind: target.sourceWorkout.origin_kind,
      sourceStatus: target.provenancePlan
        ? resolvePlanProvenanceSourceStatus(target.provenancePlan)
        : null,
      workoutEditSourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
      provenancePlanId: target.sourceWorkout.plan_cycle_id,
      plannedWorkoutId: target.sourceWorkout.id,
      workoutDate: target.sourceWorkout.workout_date,
      title: candidate.document.title,
      reviewChecksum: review.reviewChecksum,
      exactnessPayloadVersion: WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
      mutationChecksum: review.mutationChecksum,
      calendarRowCount: target.otherWorkouts.length + 1,
      nonRestWorkoutCount:
        target.otherWorkouts.filter((workout) => workout.workout_type !== "rest").length + 1,
      sourceMetadata: {
        editSourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
        mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.editWorkout,
        mutationMode: "workout_document_edit",
        mutationPayloadVersion: WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
        mutationChecksum: review.mutationChecksum,
        plannedWorkoutId: target.sourceWorkout.id,
        workoutDate: target.sourceWorkout.workout_date,
        reviewChecksum: review.reviewChecksum,
        originalPlanSourceKind: target.rootProvenance.originalPlanSourceKind,
        originalPlanSourceStatus: target.rootProvenance.originalPlanSourceStatus,
        originalPlanOriginSourceKind: target.rootProvenance.originalPlanOriginSourceKind,
        originalPlanOriginSourceStatus: target.rootProvenance.originalPlanOriginSourceStatus,
        originalWorkoutSourceId: target.rootProvenance.originalWorkoutSourceId,
        originalWorkoutSourceType: target.rootProvenance.originalWorkoutSourceType,
        originalWorkoutFamily: target.rootProvenance.originalWorkoutFamily,
        originalWorkoutIdentity: target.rootProvenance.originalWorkoutIdentity,
        trustedClientRows: false,
      },
      safety: {
        requiresExplicitConfirm: true,
        sourceWorkoutVerified: true,
        strictDocumentVerified: true,
        sourceFingerprintSigned: true,
        preEditPlannedTruthPreserved: true,
        historicalRecordsPreserved: true,
        updatedExactlyOneRow: true,
        updatesSamePlannedWorkoutRow: true,
        sourceProvenanceUnchanged: true,
        trustedClientRows: false,
        serverRebuiltReview: true,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildEditBlocked(
      "persistence_failed",
      "The workout edit could not be saved. The workout is unchanged.",
    );
  }
}

export async function persistWorkoutDocumentEdit({
  userId,
  currentDate,
  sourceWorkout,
  candidateDocument,
  rootProvenance,
  review,
}: PersistWorkoutDocumentEditInput): Promise<PersistWorkoutDocumentEditResult> {
  const metadata = buildWorkoutDocumentEditAuditMetadata({
    sourceWorkout,
    rootProvenance,
    review,
  });
  try {
    const mutation = await applyAtomicCalendarWorkoutContentEdit({
      userId,
      workoutId: sourceWorkout.id,
      currentDate,
      expectedWorkout: toJson(buildFullSourceWorkoutFingerprint(sourceWorkout)),
      workoutUpdate: toJson(buildWorkoutDocumentUpdate(candidateDocument)),
      mutationEvent: toJson(metadata),
    });

    return {
      ok: true,
      editedWorkout: mutation.editedWorkout,
      mutationEventId: mutation.mutationEvent.id,
    };
  } catch (error) {
    if (
      error instanceof CalendarPersistenceRejection &&
      (error.reason === "stale_review" || error.reason === "protected_day")
    ) {
      return {
        ok: false,
        reason: error.reason,
        message: error.message,
      };
    }

    throw error;
  }
}

// Preserve the established server-action owner names while their contract is now origin-neutral.
export const reconstructManualWorkoutPersistedEditDraftForUser =
  reconstructWorkoutDocumentPersistedEditForUser;
export const reviewManualWorkoutPersistedEditDraftForUser =
  reviewWorkoutDocumentPersistedEditForUser;
export const confirmManualWorkoutPersistedEditForUser = confirmWorkoutDocumentPersistedEditForUser;
export const persistManualWorkoutPersistedEdit = persistWorkoutDocumentEdit;
export type ManualWorkoutPersistedEditFailureReason = WorkoutDocumentPersistedEditFailureReason;
export type ManualWorkoutPersistedEditReconstructResult =
  WorkoutDocumentPersistedEditReconstructResult;
export type ManualWorkoutPersistedEditReviewResult = WorkoutDocumentPersistedEditReviewResult;
export type ManualWorkoutPersistedEditConfirmResult = WorkoutDocumentPersistedEditConfirmResult;
export type ManualWorkoutPersistedEditDependencies = WorkoutDocumentPersistedEditDependencies;

async function resolveWorkoutDocumentPersistedEditTarget(
  userId: string,
  input: WorkoutDocumentEditSourceInput,
  dependencies: WorkoutDocumentPersistedEditDependencies,
): Promise<WorkoutDocumentPersistedEditTarget> {
  const getContext =
    dependencies.getCalendarWorkoutContextForUser ?? getCalendarWorkoutMutationContext;
  const fetchEvidence =
    dependencies.fetchEvidenceWorkoutIds ?? fetchManualWorkoutEvidenceWorkoutIds;
  const getEarliestEvent =
    dependencies.getEarliestMutationEventForWorkout ?? getEarliestMutationEventForWorkout;
  const currentDate = dependencies.currentDate ?? (await getRunnerCalendarDateForUserId(userId));

  let context: CalendarWorkoutContext;
  try {
    context = await getContext(userId);
  } catch {
    return targetBlocked("persistence_failed", "The Calendar workout state could not be verified.");
  }

  const sourceWorkout = context.existingWorkouts.workouts.find(
    (workout) => workout.id === input.plannedWorkoutId,
  );
  if (!sourceWorkout) {
    return targetBlocked("source_workout_not_found", "The planned workout was not found.");
  }

  const provenancePlan = sourceWorkout.plan_cycle_id
    ? (context.sourcePlansById.get(sourceWorkout.plan_cycle_id) ?? null)
    : null;
  if (sourceWorkout.user_id !== userId) {
    return targetBlocked("source_workout_not_owned", "The workout does not belong to this runner.");
  }
  if (sourceWorkout.workout_date !== input.workoutDate) {
    return targetBlocked(
      "source_date_changed",
      "The workout is no longer on this date. Refresh the workout.",
    );
  }
  if (sourceWorkout.workout_date < currentDate) {
    return targetBlocked("protected_day", "Past planned workouts cannot be edited.");
  }
  if (context.existingWorkouts.logsByWorkoutId.has(sourceWorkout.id)) {
    return targetBlocked("logged_workout", "Logged or skipped workouts cannot be edited.");
  }

  let evidenceWorkoutIds: Set<string>;
  try {
    evidenceWorkoutIds = await fetchEvidence(userId, [sourceWorkout.id]);
  } catch {
    return targetBlocked("persistence_failed", "Workout evidence could not be verified.");
  }
  if (evidenceWorkoutIds.has(sourceWorkout.id)) {
    return targetBlocked("evidence_backed_workout", "Evidence-backed workouts cannot be edited.");
  }

  const document = normalizePersistedWorkoutDocument(sourceWorkout);
  if (!document.ok) {
    return targetBlocked("source_workout_not_supported", document.message);
  }
  if (document.value.workoutType === "rest") {
    return targetBlocked("source_workout_not_supported", "Rest days cannot be content-edited.");
  }
  if (workoutDocumentHasUnsafeMetricTruth(document.value)) {
    return targetBlocked(
      "source_workout_not_supported",
      "This workout contains target provenance that cannot be edited safely.",
    );
  }

  let rootProvenance: CalendarWorkoutEditRootProvenance;
  try {
    const earliestEvent = await getEarliestEvent(userId, sourceWorkout.id);
    rootProvenance = resolveCalendarWorkoutEditRootProvenance(
      provenancePlan,
      sourceWorkout,
      earliestEvent?.event_payload,
    );
  } catch {
    return targetBlocked(
      "unsupported_source_metadata",
      "The workout root provenance could not be verified.",
    );
  }

  return {
    ok: true,
    provenancePlan,
    sourceWorkout,
    sourceDocument: document.value,
    rootProvenance,
    currentDate,
    otherWorkouts: context.existingWorkouts.workouts.filter(
      (workout) => workout.id !== sourceWorkout.id,
    ),
  };
}

function buildValidatedCandidate(
  target: Extract<WorkoutDocumentPersistedEditTarget, { ok: true }>,
  editProjection: unknown,
):
  | { ok: true; document: WorkoutDocument }
  | { ok: false; reason: WorkoutDocumentPersistedEditFailureReason; message: string } {
  const candidate = buildEditedWorkoutDocument(target.sourceDocument, editProjection);
  if (!candidate.ok) {
    return targetBlocked("invalid_input", candidate.message);
  }
  if (candidate.value.workoutType === "rest") {
    return targetBlocked(
      "workout_type_changed_to_rest",
      "Content editing cannot convert a workout into a Rest day.",
    );
  }

  const targetTruth = validateWorkoutDocumentTargetEdit(target.sourceDocument, candidate.value);
  if (!targetTruth.ok) {
    return targetBlocked("client_payload_rejected", targetTruth.message);
  }

  return { ok: true, document: candidate.value };
}

function buildWorkoutDocumentUpdate(document: WorkoutDocument) {
  return {
    workout_type: document.workoutType,
    workout_family: document.workoutFamily,
    workout_identity: document.workoutIdentity,
    calendar_icon_key: document.calendarIconKey,
    metric_mode: document.metricMode,
    title: document.title,
    notes: document.notes,
    steps: document.steps,
  };
}

function buildWorkoutDocumentEditAuditMetadata(input: {
  sourceWorkout: PersistedPlannedWorkoutRow;
  rootProvenance: CalendarWorkoutEditRootProvenance;
  review: WorkoutDocumentPersistedEditReview;
}) {
  return buildCalendarWorkoutMutationEvent({
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.editWorkout,
    originKind: input.sourceWorkout.origin_kind,
    mutationMode: "workout_document_edit",
    mutationPayloadVersion: WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
    mutationChecksum: input.review.mutationChecksum,
    plannedWorkoutId: input.sourceWorkout.id,
    previousWorkoutDate: input.sourceWorkout.workout_date,
    targetWorkoutId: input.sourceWorkout.id,
    targetDate: input.sourceWorkout.workout_date,
    title: input.review.title,
    reviewChecksum: input.review.reviewChecksum,
    reviewPayloadVersion: WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
    trustedClientRows: false,
    originalPlanSourceKind: input.rootProvenance.originalPlanSourceKind,
    originalPlanSourceStatus: input.rootProvenance.originalPlanSourceStatus,
    originalPlanOriginSourceKind: input.rootProvenance.originalPlanOriginSourceKind,
    originalPlanOriginSourceStatus: input.rootProvenance.originalPlanOriginSourceStatus,
    originalWorkoutSourceId: input.rootProvenance.originalWorkoutSourceId,
    originalWorkoutSourceType: input.rootProvenance.originalWorkoutSourceType,
    originalWorkoutFamily: input.rootProvenance.originalWorkoutFamily,
    originalWorkoutIdentity: input.rootProvenance.originalWorkoutIdentity,
    previousWorkout: input.sourceWorkout,
  });
}

function buildEditBlocked(
  reason: WorkoutDocumentPersistedEditFailureReason,
  message: string,
): WorkoutDocumentPersistedEditBlockedResult {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason,
    message,
    sourceKind: null,
    workoutEditSourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
  };
}

function targetBlocked(
  reason: WorkoutDocumentPersistedEditFailureReason,
  message: string,
): Extract<WorkoutDocumentPersistedEditTarget, { ok: false }> {
  return { ok: false, reason, message };
}

export async function getEarliestMutationEventForWorkout(userId: string, workoutId: string) {
  const supabase = createAdminSupabaseClient();
  const event = await supabase
    .from("calendar_workout_mutation_events")
    .select("event_payload")
    .eq("user_id", userId)
    .eq("planned_workout_id", workoutId)
    .eq("mutation_kind", CALENDAR_WORKOUT_MUTATION_KIND.editWorkout)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (event.error) {
    throw new Error(event.error.message);
  }

  return event.data;
}
