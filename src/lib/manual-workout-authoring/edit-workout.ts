import { z } from "zod";
import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
  CalendarPersistenceRejection,
  applyAtomicCalendarWorkoutContentEdit,
  buildCalendarWorkoutMutationEvent,
  resolveCalendarWorkoutEditRootProvenance,
  resolvePlanProvenanceSourceStatus,
  type CalendarWorkoutEditRootProvenance,
} from "@/lib/runner-calendar-mutations";
import {
  getCalendarWorkoutMutationContext,
  type CalendarWorkoutContext,
  type PersistedPlannedWorkoutRow,
} from "@/lib/runner-calendar-persistence";
import type { SourcePlanProvenanceRow } from "@/lib/source-plan-provenance-persistence";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  type ManualWorkoutEvidenceFetcher,
} from "@/lib/manual-workout-authoring/active-plan-add";
import {
  validateWorkoutDocumentTargetEdit,
  workoutDocumentHasUnsafeMetricTruth,
  workoutDocumentValuesHaveUnsafeMetricTruth,
} from "@/lib/manual-workout-authoring/persisted-workout-safety";
import { toJson } from "@/lib/manual-workout-authoring/persistence";
import { inputHasClientPayload } from "@/lib/manual-workout-authoring/schema";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { stableJsonEqual } from "@/lib/review-token-signing";
import {
  backfillWorkoutDocumentNestedSegmentIds,
  normalizeWorkoutDocument,
  normalizePersistedWorkoutDocument,
  type WorkoutDocument,
} from "@/lib/workout-document";
import {
  WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
  buildFullCalendarWorkoutFingerprint,
  confirmWorkoutCommand,
  reviewWorkoutCommand,
  type ReviewedWorkoutCommandCandidate,
  type WorkoutCommandCollision,
} from "@/lib/workout-authoring-review";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const requiredEditPayloadSchema = z
  .unknown()
  .refine((value) => value !== undefined, "Workout edit payload is required.");

const workoutDocumentEditSourceInputSchema = z
  .object({
    provenancePlanId: z.string().uuid().optional(),
    plannedWorkoutId: z.string().uuid(),
    workoutDate: isoDateSchema,
  })
  .strict();
const calendarWorkoutDocumentInitializerInputSchema = z
  .object({ workoutId: z.string().uuid() })
  .strict();

export const workoutDocumentPersistedEditReviewInputSchema = workoutDocumentEditSourceInputSchema
  .extend({ document: requiredEditPayloadSchema })
  .strict();

export const workoutDocumentPersistedEditConfirmInputSchema = workoutDocumentEditSourceInputSchema
  .extend({
    document: requiredEditPayloadSchema,
    candidateId: z.string().trim().min(16),
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict();

type WorkoutDocumentEditSourceInput = z.output<typeof workoutDocumentEditSourceInputSchema>;
type WorkoutDocumentEditTargetInput = Pick<WorkoutDocumentEditSourceInput, "plannedWorkoutId"> & {
  workoutDate?: string;
};

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
      document: WorkoutDocument;
      candidate: ReviewedWorkoutCommandCandidate;
      candidateDocument: WorkoutDocument;
      review: ReviewedWorkoutCommandCandidate;
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
      exactnessPayloadVersion: typeof WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION;
      mutationChecksum: string;
      calendarRowCount: number;
      nonRestWorkoutCount: number;
      sourceMetadata: {
        editSourceKind: typeof CALENDAR_WORKOUT_MUTATION_SOURCE_KIND;
        mutationKind: typeof CALENDAR_WORKOUT_MUTATION_KIND.editWorkout;
        mutationMode: "workout_document_edit";
        mutationPayloadVersion: typeof WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION;
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
  createNestedSegmentId?: () => string;
  persistNestedSegmentIdentityBackfill?: typeof persistWorkoutDocumentNestedSegmentIdentityBackfill;
  persistWorkoutEdit?: typeof persistWorkoutDocumentEdit;
  currentDate?: string;
}

export type CalendarWorkoutDocumentInitializerResult =
  | {
      ok: true;
      document: WorkoutDocument;
      expectedFingerprint: Json;
      provenanceReference: Json;
      safety: {
        sourceWorkoutVerified: true;
        strictDocumentVerified: true;
        rootProvenanceVerified: true;
        editProtectionVerified: true;
        originNeutral: true;
        trustedClientRows: false;
        callsOpenAi: false;
      };
    }
  | WorkoutDocumentPersistedEditBlockedResult;

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
  review: ReviewedWorkoutCommandCandidate;
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

type PersistWorkoutDocumentNestedSegmentIdentityBackfillInput = {
  userId: string;
  currentDate: string;
  sourceWorkout: PersistedPlannedWorkoutRow;
  upgradedSteps: unknown[];
  rootProvenance: CalendarWorkoutEditRootProvenance;
};

export async function initializeCalendarWorkoutDocumentForUser(
  userId: string,
  input: unknown,
  dependencies: WorkoutDocumentPersistedEditDependencies = {},
): Promise<CalendarWorkoutDocumentInitializerResult> {
  const parsed = calendarWorkoutDocumentInitializerInputSchema.safeParse(input);
  if (!parsed.success) {
    return buildEditBlocked("invalid_input", "Choose one valid Calendar workout to edit.");
  }

  const target = await resolveWorkoutDocumentPersistedEditTarget(
    userId,
    { plannedWorkoutId: parsed.data.workoutId },
    dependencies,
  );
  if (!target.ok) return buildEditBlocked(target.reason, target.message);

  return {
    ok: true,
    document: target.sourceDocument,
    expectedFingerprint: toJson(buildFullCalendarWorkoutFingerprint(target.sourceWorkout)),
    provenanceReference: buildWorkoutDocumentEditProvenanceReference(target),
    safety: {
      sourceWorkoutVerified: true,
      strictDocumentVerified: true,
      rootProvenanceVerified: true,
      editProtectionVerified: true,
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
      "Workout edit review accepts source identifiers and one canonical document.",
    );
  }

  const target = await resolveWorkoutDocumentPersistedEditTarget(userId, parsed.data, dependencies);
  if (!target.ok) return buildEditBlocked(target.reason, target.message);

  const candidate = buildValidatedCandidate(target, parsed.data.document);
  if (!candidate.ok) return buildEditBlocked(candidate.reason, candidate.message);

  const reviewed = buildWorkoutDocumentEditReviewCandidate({
    sourceWorkout: target.sourceWorkout,
    otherWorkouts: target.otherWorkouts,
    candidateDocument: candidate.document,
    rootProvenance: target.rootProvenance,
  });
  if (!reviewed.ok) return buildEditBlocked(reviewed.reason, reviewed.message);

  return {
    ok: true,
    status: "review_ready",
    persisted: false,
    sourceKind: target.sourceWorkout.origin_kind,
    workoutEditSourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    provenancePlanId: target.sourceWorkout.plan_cycle_id,
    plannedWorkoutId: target.sourceWorkout.id,
    workoutDate: target.sourceWorkout.workout_date,
    document: candidate.document,
    candidate: reviewed.candidate,
    candidateDocument: candidate.document,
    review: reviewed.candidate,
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

  const candidate = buildValidatedCandidate(target, parsed.data.document);
  if (!candidate.ok) return buildEditBlocked(candidate.reason, candidate.message);

  const reviewed = buildWorkoutDocumentEditReviewCandidate({
    sourceWorkout: target.sourceWorkout,
    otherWorkouts: target.otherWorkouts,
    candidateDocument: candidate.document,
    rootProvenance: target.rootProvenance,
  });
  if (!reviewed.ok) return buildEditBlocked(reviewed.reason, reviewed.message);

  const reviewProof = confirmWorkoutCommand({
    candidate: reviewed.candidate,
    candidateId: parsed.data.candidateId,
    reviewChecksum: parsed.data.reviewChecksum,
    reviewToken: parsed.data.reviewToken,
  });
  if (!reviewProof.ok) {
    return buildEditBlocked(
      reviewProof.reason === "collision" ? "stale_review" : reviewProof.reason,
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
      review: reviewed.candidate,
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
      reviewChecksum: reviewed.candidate.reviewChecksum,
      exactnessPayloadVersion: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
      mutationChecksum: reviewed.candidate.reviewChecksum,
      calendarRowCount: target.otherWorkouts.length + 1,
      nonRestWorkoutCount:
        target.otherWorkouts.filter((workout) => workout.workout_type !== "rest").length + 1,
      sourceMetadata: {
        editSourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
        mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.editWorkout,
        mutationMode: "workout_document_edit",
        mutationPayloadVersion: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
        mutationChecksum: reviewed.candidate.reviewChecksum,
        plannedWorkoutId: target.sourceWorkout.id,
        workoutDate: target.sourceWorkout.workout_date,
        reviewChecksum: reviewed.candidate.reviewChecksum,
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
      expectedWorkout: toJson(buildFullCalendarWorkoutFingerprint(sourceWorkout)),
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

export async function persistWorkoutDocumentNestedSegmentIdentityBackfill({
  userId,
  currentDate,
  sourceWorkout,
  upgradedSteps,
  rootProvenance,
}: PersistWorkoutDocumentNestedSegmentIdentityBackfillInput): Promise<PersistWorkoutDocumentEditResult> {
  const mutationChecksum = stableManualWorkoutChecksum64Hex({
    workoutId: sourceWorkout.id,
    expectedWorkout: buildFullCalendarWorkoutFingerprint(sourceWorkout),
    upgradedSteps,
  });
  const mutationEvent = buildCalendarWorkoutMutationEvent({
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.editWorkout,
    originKind: sourceWorkout.origin_kind,
    mutationMode: "workout_document_nested_segment_identity_backfill",
    mutationPayloadVersion: "workout_document_nested_segment_identity_backfill_v1",
    mutationChecksum,
    reviewPayloadVersion: "workout_document_nested_segment_identity_backfill_v1",
    reviewChecksum: mutationChecksum,
    plannedWorkoutId: sourceWorkout.id,
    previousWorkoutDate: sourceWorkout.workout_date,
    targetWorkoutId: sourceWorkout.id,
    targetDate: sourceWorkout.workout_date,
    title: sourceWorkout.title,
    trustedClientRows: false,
    originalPlanSourceKind: rootProvenance.originalPlanSourceKind,
    originalPlanSourceStatus: rootProvenance.originalPlanSourceStatus,
    originalPlanOriginSourceKind: rootProvenance.originalPlanOriginSourceKind,
    originalPlanOriginSourceStatus: rootProvenance.originalPlanOriginSourceStatus,
    originalWorkoutSourceId: rootProvenance.originalWorkoutSourceId,
    originalWorkoutSourceType: rootProvenance.originalWorkoutSourceType,
    originalWorkoutFamily: rootProvenance.originalWorkoutFamily,
    originalWorkoutIdentity: rootProvenance.originalWorkoutIdentity,
    previousWorkout: sourceWorkout,
  });

  try {
    const mutation = await applyAtomicCalendarWorkoutContentEdit({
      userId,
      workoutId: sourceWorkout.id,
      currentDate,
      expectedWorkout: toJson(buildFullCalendarWorkoutFingerprint(sourceWorkout)),
      workoutUpdate: toJson({
        workout_type: sourceWorkout.workout_type,
        workout_family: sourceWorkout.workout_family,
        workout_identity: sourceWorkout.workout_identity,
        calendar_icon_key: sourceWorkout.calendar_icon_key,
        metric_mode: sourceWorkout.metric_mode,
        title: sourceWorkout.title,
        notes: sourceWorkout.notes,
        steps: upgradedSteps,
      }),
      mutationEvent: toJson(mutationEvent),
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
      return { ok: false, reason: error.reason, message: error.message };
    }
    throw error;
  }
}

async function resolveWorkoutDocumentPersistedEditTarget(
  userId: string,
  input: WorkoutDocumentEditTargetInput,
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
  if (input.workoutDate && sourceWorkout.workout_date !== input.workoutDate) {
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
  if (sourceWorkout.workout_type === "rest") {
    return targetBlocked("source_workout_not_supported", "Rest days cannot be content-edited.");
  }
  if (workoutDocumentValuesHaveUnsafeMetricTruth(sourceWorkout.metric_mode, sourceWorkout.steps)) {
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

  let editableSourceWorkout = sourceWorkout;
  const identityBackfill = backfillWorkoutDocumentNestedSegmentIds(
    sourceWorkout.steps,
    dependencies.createNestedSegmentId,
  );
  if (!identityBackfill.ok) {
    return targetBlocked("source_workout_not_supported", identityBackfill.message);
  }
  const validatedBackfillDocument = normalizePersistedWorkoutDocument({
    ...sourceWorkout,
    steps: toJson(identityBackfill.value),
  });
  if (!validatedBackfillDocument.ok) {
    return targetBlocked("source_workout_not_supported", validatedBackfillDocument.message);
  }
  if (workoutDocumentHasUnsafeMetricTruth(validatedBackfillDocument.value)) {
    return targetBlocked(
      "source_workout_not_supported",
      "This workout contains target provenance that cannot be edited safely.",
    );
  }
  if (identityBackfill.changed) {
    const persistBackfill =
      dependencies.persistNestedSegmentIdentityBackfill ??
      persistWorkoutDocumentNestedSegmentIdentityBackfill;
    try {
      const persisted = await persistBackfill({
        userId,
        currentDate,
        sourceWorkout,
        upgradedSteps: identityBackfill.value,
        rootProvenance,
      });
      if (!persisted.ok) {
        return targetBlocked(persisted.reason, persisted.message);
      }
      editableSourceWorkout = persisted.editedWorkout;
    } catch {
      return targetBlocked(
        "persistence_failed",
        "Nested workout identity could not be retained. The workout is unchanged.",
      );
    }
  }

  const document = normalizePersistedWorkoutDocument(editableSourceWorkout);
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

  return {
    ok: true,
    provenancePlan,
    sourceWorkout: editableSourceWorkout,
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
  input: unknown,
):
  | { ok: true; document: WorkoutDocument }
  | { ok: false; reason: WorkoutDocumentPersistedEditFailureReason; message: string } {
  const canonicalDocument = normalizeWorkoutDocument(input);
  if (!canonicalDocument.ok) {
    return targetBlocked("invalid_input", canonicalDocument.message);
  }

  if (
    !stableJsonEqual(
      workoutDocumentRootIdentity(target.sourceDocument),
      workoutDocumentRootIdentity(canonicalDocument.value),
    )
  ) {
    return targetBlocked(
      "client_payload_rejected",
      "The workout document changed server-owned Calendar identity or provenance.",
    );
  }
  if (canonicalDocument.value.workoutType === "rest") {
    return targetBlocked(
      "workout_type_changed_to_rest",
      "Content editing cannot convert a workout into a Rest day.",
    );
  }

  const targetTruth = validateWorkoutDocumentTargetEdit(
    target.sourceDocument,
    canonicalDocument.value,
  );
  if (!targetTruth.ok) {
    return targetBlocked("client_payload_rejected", targetTruth.message);
  }

  return { ok: true, document: canonicalDocument.value };
}

function workoutDocumentRootIdentity(document: WorkoutDocument) {
  return {
    workoutDate: document.workoutDate,
    weekday: document.weekday,
    weekNumber: document.weekNumber,
    phase: document.phase,
    sourceWorkoutId: document.sourceWorkoutId,
    sourceWorkoutType: document.sourceWorkoutType,
    goalContext: document.goalContext,
    plannedRpe: document.plannedRpe,
    estimatedFatigue: document.estimatedFatigue,
    recoveryPriority: document.recoveryPriority,
    displayOrder: document.displayOrder,
  };
}

function buildWorkoutDocumentEditReviewCandidate(input: {
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  candidateDocument: WorkoutDocument;
  rootProvenance: CalendarWorkoutEditRootProvenance;
}):
  | { ok: true; candidate: ReviewedWorkoutCommandCandidate }
  | { ok: false; reason: WorkoutDocumentPersistedEditFailureReason; message: string } {
  const collisions: WorkoutCommandCollision[] = input.otherWorkouts
    .filter((workout) => workout.workout_date === input.sourceWorkout.workout_date)
    .map((workout) => ({
      code: "occupied_date",
      workoutDate: workout.workout_date,
    }));
  const reviewed = reviewWorkoutCommand({
    command: {
      operation: "replace_document",
      workoutId: input.sourceWorkout.id,
      document: input.candidateDocument,
      expectedFingerprint: buildFullCalendarWorkoutFingerprint(input.sourceWorkout),
      provenanceReference: buildWorkoutDocumentEditProvenanceReference({
        rootProvenance: input.rootProvenance,
        otherWorkouts: [...input.otherWorkouts],
      }),
    },
    collisions,
  });

  if (!reviewed.ok) {
    return targetBlocked(
      "invalid_input",
      reviewed.issues[0]?.message ?? "The workout edit document is invalid.",
    );
  }
  if (reviewed.candidate.collisions.length > 0) {
    return targetBlocked(
      "stale_review",
      "The Calendar contains another workout on this date. Refresh before editing.",
    );
  }

  return reviewed;
}

function buildWorkoutDocumentEditProvenanceReference(input: {
  rootProvenance: CalendarWorkoutEditRootProvenance;
  otherWorkouts: PersistedPlannedWorkoutRow[];
}): Json {
  return toJson({
    rootProvenance: input.rootProvenance,
    otherWorkoutIds: input.otherWorkouts.map((workout) => workout.id).sort(),
    rowCount: input.otherWorkouts.length + 1,
    nonRestRowCount:
      input.otherWorkouts.filter((workout) => workout.workout_type !== "rest").length + 1,
  });
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
  review: ReviewedWorkoutCommandCandidate;
}) {
  if (input.review.command.operation !== "replace_document") {
    throw new Error("Workout edit review is missing its canonical document.");
  }
  const document = input.review.command.document;

  return buildCalendarWorkoutMutationEvent({
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.editWorkout,
    originKind: input.sourceWorkout.origin_kind,
    mutationMode: "workout_document_edit",
    mutationPayloadVersion: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
    mutationChecksum: input.review.reviewChecksum,
    plannedWorkoutId: input.sourceWorkout.id,
    previousWorkoutDate: input.sourceWorkout.workout_date,
    targetWorkoutId: input.sourceWorkout.id,
    targetDate: input.sourceWorkout.workout_date,
    title: document.title,
    reviewChecksum: input.review.reviewChecksum,
    reviewPayloadVersion: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
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
