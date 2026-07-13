import {
  ACTIVE_PLAN_USER_EDIT_MUTATION_KIND,
  ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
} from "@/lib/active-plan-workout-editing/policy";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
} from "@/lib/active-plan-persistence";
import { buildManualWorkoutReviewExactnessPayload } from "@/lib/manual-workout-authoring/actions";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import type {
  ManualWorkoutDraftReviewResult,
  ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";
import { safeTokenEqual } from "@/lib/review-token-signing";

export const MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION =
  "manual_workout_persisted_edit_review_v1" as const;

const MANUAL_WORKOUT_EDIT_REVIEW_TOKEN_PREFIX = "manual-workout-edit-review-v1.";

export type ManualWorkoutPersistedEditReview = {
  plannedWorkoutId: string;
  workoutDate: string;
  title: string;
  templateKey: ManualWorkoutTemplateKey;
  reviewToken: string;
  reviewChecksum: string;
  draftReviewChecksum: string;
  exactnessPayloadVersion: typeof MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION;
  mutationPayloadVersion: typeof MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION;
  mutationChecksum: string;
  trustedClientRows: false;
};

export function buildPersistedEditReview(input: {
  activePlan: PersistedPlanCycleRow;
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  draftInput: unknown;
  draftReview: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
}): ManualWorkoutPersistedEditReview {
  const payload = buildPersistedEditExactnessPayload(input);
  const reviewChecksum = stableManualWorkoutChecksum64Hex(payload);

  return {
    plannedWorkoutId: input.sourceWorkout.id,
    workoutDate: input.sourceWorkout.workout_date,
    title: input.draftReview.draft.title,
    templateKey: input.draftReview.draft.templateKey,
    reviewToken: buildExpectedPersistedEditReviewToken(reviewChecksum),
    reviewChecksum,
    draftReviewChecksum: input.draftReview.reviewChecksum,
    exactnessPayloadVersion: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
    mutationPayloadVersion: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
    mutationChecksum: reviewChecksum,
    trustedClientRows: false,
  };
}

export function buildExpectedPersistedEditReviewToken(reviewChecksum: string) {
  return `${MANUAL_WORKOUT_EDIT_REVIEW_TOKEN_PREFIX}${reviewChecksum}`;
}

export const safeManualWorkoutEditReviewTokenEqual = safeTokenEqual;

export function buildManualWorkoutEditMetadata(review: ManualWorkoutPersistedEditReview) {
  return {
    planned_workout_id: review.plannedWorkoutId,
    workout_date: review.workoutDate,
    title: review.title,
    template_key: review.templateKey,
    review_payload_version: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
    review_checksum: review.reviewChecksum,
    draft_review_checksum: review.draftReviewChecksum,
    mutation_mode: "direct_manual_edit",
    mutation_payload_version: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
    mutation_checksum: review.mutationChecksum,
    trusted_client_rows: false,
  };
}

function buildPersistedEditExactnessPayload(input: {
  activePlan: PersistedPlanCycleRow;
  sourceWorkout: PersistedPlannedWorkoutRow;
  otherWorkouts: readonly PersistedPlannedWorkoutRow[];
  draftInput: unknown;
  draftReview: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
}) {
  return {
    version: MANUAL_WORKOUT_EDIT_REVIEW_PAYLOAD_VERSION,
    sourceKind: ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
    mutationKind: ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.editWorkout,
    activePlanId: input.activePlan.id,
    activePlanSourceKind: input.activePlan.source_kind,
    plannedWorkoutId: input.sourceWorkout.id,
    workoutDate: input.sourceWorkout.workout_date,
    sourceFingerprint: buildSourceWorkoutFingerprint(input.sourceWorkout),
    editedDraftInput: input.draftInput,
    editedDraftExactnessPayload: buildManualWorkoutReviewExactnessPayload(input.draftReview.draft),
    editedDraftReviewChecksum: input.draftReview.reviewChecksum,
    otherWorkoutIds: input.otherWorkouts.map((workout) => workout.id).sort(),
    rowCount: input.otherWorkouts.length + 1,
    nonRestRowCount:
      input.otherWorkouts.filter((workout) => workout.workout_type !== "rest").length + 1,
    trustedClientRows: false,
  };
}

function buildSourceWorkoutFingerprint(workout: PersistedPlannedWorkoutRow) {
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
