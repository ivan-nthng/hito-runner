import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
  type CalendarWorkoutEditRootProvenance,
} from "@/lib/active-plan-workout-editing/policy";
import type { PersistedPlannedWorkoutRow } from "@/lib/active-plan-persistence";
import {
  buildManualWorkoutReviewToken,
  stableManualWorkoutChecksum64Hex,
  validateManualWorkoutReviewProof,
} from "@/lib/manual-workout-authoring/review-exactness";
import type { WorkoutDocument, WorkoutDocumentEditProjection } from "@/lib/workout-document";

export const WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION =
  "workout_document_edit_review_v1" as const;

const WORKOUT_DOCUMENT_EDIT_REVIEW_TOKEN_PREFIX = "workout-document-edit-review-v1.";

export type WorkoutDocumentPersistedEditReview = {
  plannedWorkoutId: string;
  workoutDate: string;
  title: string;
  reviewToken: string;
  reviewChecksum: string;
  exactnessPayloadVersion: typeof WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION;
  mutationPayloadVersion: typeof WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION;
  mutationChecksum: string;
  trustedClientRows: false;
};

export function buildPersistedEditReview(input: {
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  editProjection: WorkoutDocumentEditProjection;
  candidateDocument: WorkoutDocument;
  rootProvenance: CalendarWorkoutEditRootProvenance;
}): WorkoutDocumentPersistedEditReview {
  const payload = buildPersistedEditExactnessPayload(input);
  const reviewChecksum = stableManualWorkoutChecksum64Hex(payload);

  return {
    plannedWorkoutId: input.sourceWorkout.id,
    workoutDate: input.sourceWorkout.workout_date,
    title: input.candidateDocument.title,
    reviewToken: buildExpectedPersistedEditReviewToken(reviewChecksum),
    reviewChecksum,
    exactnessPayloadVersion: WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
    mutationPayloadVersion: WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
    mutationChecksum: reviewChecksum,
    trustedClientRows: false,
  };
}

export function buildExpectedPersistedEditReviewToken(reviewChecksum: string) {
  return buildManualWorkoutReviewToken(WORKOUT_DOCUMENT_EDIT_REVIEW_TOKEN_PREFIX, reviewChecksum);
}

export function validatePersistedEditReviewProof(input: {
  expectedChecksum: string;
  reviewChecksum: string;
  reviewToken: string;
}) {
  return validateManualWorkoutReviewProof({
    ...input,
    tokenPrefix: WORKOUT_DOCUMENT_EDIT_REVIEW_TOKEN_PREFIX,
  });
}

export function buildWorkoutDocumentEditMetadata(review: WorkoutDocumentPersistedEditReview) {
  return {
    planned_workout_id: review.plannedWorkoutId,
    workout_date: review.workoutDate,
    title: review.title,
    review_payload_version: WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
    review_checksum: review.reviewChecksum,
    mutation_mode: "workout_document_edit",
    mutation_payload_version: WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
    mutation_checksum: review.mutationChecksum,
    trusted_client_rows: false,
  };
}

function buildPersistedEditExactnessPayload(input: {
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  editProjection: WorkoutDocumentEditProjection;
  candidateDocument: WorkoutDocument;
  rootProvenance: CalendarWorkoutEditRootProvenance;
}) {
  return {
    version: WORKOUT_DOCUMENT_EDIT_REVIEW_PAYLOAD_VERSION,
    sourceKind: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.editWorkout,
    plannedWorkoutId: input.sourceWorkout.id,
    workoutDate: input.sourceWorkout.workout_date,
    sourceFingerprint: buildFullSourceWorkoutFingerprint(input.sourceWorkout),
    editProjection: input.editProjection,
    candidateDocument: input.candidateDocument,
    rootProvenance: input.rootProvenance,
    otherWorkoutIds: input.otherWorkouts.map((workout) => workout.id).sort(),
    rowCount: input.otherWorkouts.length + 1,
    nonRestRowCount:
      input.otherWorkouts.filter((workout) => workout.workout_type !== "rest").length + 1,
    trustedClientRows: false,
  };
}

export function buildSourceWorkoutFingerprint(workout: PersistedPlannedWorkoutRow) {
  return {
    id: workout.id,
    workoutDate: workout.workout_date,
    weekday: workout.weekday,
    weekNumber: workout.week_number,
    phase: workout.phase,
    workoutType: workout.workout_type,
    sourceWorkoutId: workout.source_workout_id,
    sourceWorkoutType: workout.source_workout_type,
    workoutFamily: workout.workout_family,
    workoutIdentity: workout.workout_identity,
    calendarIconKey: workout.calendar_icon_key,
    goalContext: workout.goal_context,
    metricMode: workout.metric_mode,
    title: workout.title,
    notes: workout.notes,
    plannedRpe: workout.planned_rpe,
    estimatedFatigue: workout.estimated_fatigue,
    recoveryPriority: workout.recovery_priority,
    steps: workout.steps,
  };
}

export function buildFullSourceWorkoutFingerprint(workout: PersistedPlannedWorkoutRow) {
  return { ...workout };
}
