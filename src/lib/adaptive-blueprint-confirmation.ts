import "@tanstack/react-start/server-only";

import {
  parseAdaptiveContinuationCandidateContent,
  type AdaptiveContinuationCandidateDraft,
} from "@/lib/adaptive-blueprint-continuation";
import {
  getAdaptiveBlueprintCalendarReadModelForUser,
  getAdaptiveBlueprintContinuationDecisionForUser,
} from "@/lib/adaptive-blueprint-read-model";
import { getAdaptiveTrainingDetailedCandidateForUser } from "@/lib/adaptive-blueprint-persistence";
import { getAiPlanGenerationResponseForUser } from "@/lib/ai-plan-generation-response-persistence";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import {
  applyAtomicAdaptiveContinuationDetailedBlockMaterialization,
  buildCalendarWorkoutMutationEvent,
  CALENDAR_WORKOUT_MUTATION_KIND,
} from "@/lib/runner-calendar-mutations";
import { stableJsonEqual } from "@/lib/review-token-signing";
import type { Json } from "@/lib/supabase/database";
import {
  reviewWorkoutCommand,
  WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
  type ReviewedWorkoutCommandCandidate,
  type WorkoutCommand,
  type WorkoutCommandInput,
  type WorkoutCommandReviewResult,
} from "@/lib/workout-authoring-review";

const ADAPTIVE_CONTINUATION_SOURCE_KIND = "adaptive_blueprint_continuation_v1" as const;
const ADAPTIVE_CONTINUATION_SOURCE_STATUS = "reviewed_continuation_candidate" as const;
const ADAPTIVE_CONTINUATION_REFERENCE_KIND = "adaptive_continuation_materialization_v1" as const;

type AdaptiveContinuationReviewRequest = {
  operation: "materialize_source_candidate";
  source: {
    kind: "adaptive_continuation_candidate";
    candidateId: string;
  };
};

type AdaptiveContinuationReference = {
  kind: typeof ADAPTIVE_CONTINUATION_REFERENCE_KIND;
  blueprintId: string;
  blueprintVersion: number;
  blueprintSha256: string;
  predecessorConfirmationId: string;
  candidateId: string;
  candidateVersion: number;
  candidateSha256: string;
  inputFingerprintSha256: string;
  blockMode: string;
  intervalStartDate: string;
  intervalEndDate: string;
};

export function isAdaptiveContinuationReviewRequest(
  input: unknown,
): input is AdaptiveContinuationReviewRequest {
  const record = readRecord(input);
  const source = readRecord(record?.source);
  return (
    record?.operation === "materialize_source_candidate" &&
    source?.kind === "adaptive_continuation_candidate" &&
    typeof source.candidateId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      source.candidateId,
    )
  );
}

export async function reviewAdaptiveContinuationCandidateForUser(
  userId: string,
  request: AdaptiveContinuationReviewRequest,
  options: { asOfDate?: string } = {},
): Promise<WorkoutCommandReviewResult> {
  const resolved = await resolveCurrentAdaptiveContinuationCandidate({
    userId,
    candidateId: request.source.candidateId,
    asOfDate: options.asOfDate,
  });
  if (!resolved.ok) return rejectAdaptiveReview(resolved.message);
  return buildAdaptiveContinuationCommandReview(resolved);
}

export function isAdaptiveContinuationMaterializeCommand(
  command: WorkoutCommandInput | WorkoutCommand,
) {
  return readAdaptiveContinuationReference(command) != null;
}

export async function reviewAdaptiveContinuationMaterializeCommandForUser(
  userId: string,
  command: WorkoutCommandInput,
  options: { asOfDate?: string } = {},
): Promise<WorkoutCommandReviewResult> {
  const reference = readAdaptiveContinuationReference(command);
  if (!reference) return rejectAdaptiveReview("The adaptive continuation command is invalid.");
  const resolved = await resolveCurrentAdaptiveContinuationCandidate({
    userId,
    candidateId: reference.candidateId,
    asOfDate: options.asOfDate,
  });
  if (!resolved.ok) return rejectAdaptiveReview(resolved.message);
  const reviewed = buildAdaptiveContinuationCommandReview(resolved);
  if (!reviewed.ok || !stableJsonEqual(reviewed.candidate.command, command)) {
    return rejectAdaptiveReview(
      "The adaptive continuation command no longer matches the current sealed candidate.",
    );
  }
  return reviewed;
}

export async function executeAdaptiveContinuationMaterializeCommandForUser(
  userId: string,
  candidate: ReviewedWorkoutCommandCandidate,
  options: { asOfDate?: string } = {},
) {
  if (candidate.command.operation !== "materialize") {
    throw new Error("The adaptive continuation executor requires a materialize command.");
  }
  const reference = readAdaptiveContinuationReference(candidate.command);
  if (!reference) {
    throw new Error("The adaptive continuation command has no immutable source reference.");
  }
  const resolved = await resolveCurrentAdaptiveContinuationCandidate({
    userId,
    candidateId: reference.candidateId,
    asOfDate: options.asOfDate,
  });
  if (!resolved.ok) throw new Error(resolved.message);
  const reviewed = buildAdaptiveContinuationCommandReview(resolved);
  if (!reviewed.ok || !stableJsonEqual(reviewed.candidate.command, candidate.command)) {
    throw new Error("The adaptive continuation command became stale before confirmation.");
  }

  const currentDate = options.asOfDate ?? (await getRunnerCalendarDateForUserId(userId));
  const documents = candidate.command.documents;
  const workoutInserts = buildPersistedWorkoutInsertRows(null, userId, documents, "ai").map(
    (row) => ({ ...row, id: crypto.randomUUID() }),
  );
  const mutationEvents = workoutInserts.map((row) => ({
    ...buildCalendarWorkoutMutationEvent({
      mutationKind: CALENDAR_WORKOUT_MUTATION_KIND.addWorkout,
      originKind: "ai",
      reviewPayloadVersion: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
      reviewChecksum: candidate.reviewChecksum,
      workoutAuthoringSourceKind: ADAPTIVE_CONTINUATION_SOURCE_KIND,
      plannedWorkoutId: row.id,
      targetWorkoutId: row.id,
      targetDate: row.workout_date,
      title: row.title,
      mutationPayloadVersion: "adaptive_continuation_block_materialization_v1",
      mutationChecksum: candidate.reviewChecksum,
      trustedClientRows: false,
      originalPlanSourceKind: ADAPTIVE_CONTINUATION_SOURCE_KIND,
      originalPlanSourceStatus: ADAPTIVE_CONTINUATION_SOURCE_STATUS,
      originalWorkoutSourceId: row.source_workout_id,
      originalWorkoutSourceType: row.source_workout_type,
      originalWorkoutFamily: row.workout_family,
      originalWorkoutIdentity: row.workout_identity,
    }),
    adaptive_training_confirmation: {
      contract_version: "adaptive_continuation_block_confirmation_v1",
      blueprint_id: reference.blueprintId,
      blueprint_version: reference.blueprintVersion,
      blueprint_sha256: reference.blueprintSha256,
      predecessor_confirmation_id: reference.predecessorConfirmationId,
      detailed_candidate_id: reference.candidateId,
      detailed_candidate_version: reference.candidateVersion,
      detailed_candidate_sha256: reference.candidateSha256,
      input_fingerprint_sha256: reference.inputFingerprintSha256,
      block_mode: reference.blockMode,
      source_review_checksum: candidate.reviewChecksum,
      source_workout_id: row.source_workout_id,
    },
  }));

  return applyAtomicAdaptiveContinuationDetailedBlockMaterialization({
    userId,
    currentDate,
    blueprintId: reference.blueprintId,
    blueprintVersion: reference.blueprintVersion,
    blueprintSha256: reference.blueprintSha256,
    predecessorConfirmationId: reference.predecessorConfirmationId,
    candidateId: reference.candidateId,
    candidateVersion: reference.candidateVersion,
    candidateSha256: reference.candidateSha256,
    inputFingerprintSha256: reference.inputFingerprintSha256,
    expectedCandidateContent: resolved.candidateContent,
    expectedInputSnapshot: resolved.inputSnapshot,
    reviewSealSha256: candidate.reviewChecksum,
    workoutInserts: workoutInserts as unknown as Json[],
    mutationEvents: mutationEvents as unknown as Json[],
  });
}

async function resolveCurrentAdaptiveContinuationCandidate(input: {
  userId: string;
  candidateId: string;
  asOfDate?: string;
}) {
  const asOfDate = input.asOfDate ?? (await getRunnerCalendarDateForUserId(input.userId));
  const [publicRead, current] = await Promise.all([
    getAdaptiveBlueprintCalendarReadModelForUser(input.userId, asOfDate),
    getAdaptiveBlueprintContinuationDecisionForUser({
      userId: input.userId,
      asOfDate,
    }),
  ]);
  if (
    !current ||
    current.decision?.status !== "authoring_ready" ||
    publicRead.continuation.status !== "candidate_ready" ||
    publicRead.continuation.candidate.id !== input.candidateId
  ) {
    return {
      ok: false as const,
      message: "The adaptive continuation candidate is not currently ready for review.",
    };
  }
  const stored = await getAdaptiveTrainingDetailedCandidateForUser({
    userId: input.userId,
    candidateId: input.candidateId,
  });
  if (!stored || stored.id !== input.candidateId) {
    return {
      ok: false as const,
      message: "The adaptive continuation candidate is stale. Prepare a fresh review candidate.",
    };
  }
  if (!stored.source_response_id) {
    return {
      ok: false as const,
      message: "The adaptive continuation candidate has no accepted private source response.",
    };
  }
  const retainedResponse = await getAiPlanGenerationResponseForUser(
    input.userId,
    stored.source_response_id,
  );
  if (
    !retainedResponse ||
    retainedResponse.schema_outcome !== "accepted" ||
    retainedResponse.compiler_outcome !== "accepted"
  ) {
    return {
      ok: false as const,
      message: "The adaptive continuation candidate has no accepted private source response.",
    };
  }
  const candidateContent = parseAdaptiveContinuationCandidateContent(stored.candidate_content);
  if (!candidateContent) {
    return {
      ok: false as const,
      message: "The adaptive continuation candidate is malformed.",
    };
  }
  const provenance = readRecord(stored.input_provenance);
  if (
    provenance?.retainedResponseId !== retainedResponse.id ||
    provenance.retainedResponseSha256 !== retainedResponse.response_sha256
  ) {
    return {
      ok: false as const,
      message: "The adaptive continuation candidate source lineage is invalid.",
    };
  }
  return {
    ok: true as const,
    candidate: candidateContent,
    candidateContent: stored.candidate_content,
    inputSnapshot: stored.input_snapshot,
    reference: {
      kind: ADAPTIVE_CONTINUATION_REFERENCE_KIND,
      blueprintId: current.state.blueprint.id,
      blueprintVersion: current.state.blueprint.version,
      blueprintSha256: current.state.blueprint.content_sha256,
      predecessorConfirmationId: current.state.confirmation.id,
      candidateId: stored.id,
      candidateVersion: stored.version,
      candidateSha256: stored.candidate_sha256,
      inputFingerprintSha256: stored.input_fingerprint_sha256,
      blockMode: candidateContent.blockMode,
      intervalStartDate: stored.interval_start_date,
      intervalEndDate: stored.interval_end_date,
    } satisfies AdaptiveContinuationReference,
  };
}

function buildAdaptiveContinuationCommandReview(
  resolved: Extract<
    Awaited<ReturnType<typeof resolveCurrentAdaptiveContinuationCandidate>>,
    { ok: true }
  >,
): WorkoutCommandReviewResult {
  const documents = resolved.candidate.workoutDocuments;
  const provenanceReferences = documents.map(
    (document) =>
      ({
        sourceKind: ADAPTIVE_CONTINUATION_SOURCE_KIND,
        sourceStatus: ADAPTIVE_CONTINUATION_SOURCE_STATUS,
        sourceWorkoutId: document.sourceWorkoutId,
        adaptiveTrainingContinuation: resolved.reference,
      }) satisfies Json,
  );
  const collisions = resolved.candidate.conflicts.flatMap((conflict) =>
    conflict.code === "target_date_occupied"
      ? [{ code: "occupied_date" as const, workoutDate: conflict.date }]
      : [],
  );
  const warnings = resolved.candidate.conflicts
    .filter((conflict) => conflict.code !== "target_date_occupied")
    .map((conflict) => conflict.message);

  return reviewWorkoutCommand({
    command: { operation: "materialize", documents, provenanceReferences },
    collisions,
    warnings,
  });
}

function readAdaptiveContinuationReference(
  command: WorkoutCommandInput | WorkoutCommand,
): AdaptiveContinuationReference | null {
  if (command.operation !== "materialize" || command.provenanceReferences.length === 0) {
    return null;
  }
  const references = command.provenanceReferences.map((value, index) => {
    const record = readRecord(value);
    const reference = readRecord(record?.adaptiveTrainingContinuation);
    const document = command.documents[index];
    if (
      record?.sourceKind !== ADAPTIVE_CONTINUATION_SOURCE_KIND ||
      record.sourceStatus !== ADAPTIVE_CONTINUATION_SOURCE_STATUS ||
      typeof record.sourceWorkoutId !== "string" ||
      !document ||
      typeof document !== "object" ||
      !("sourceWorkoutId" in document) ||
      record.sourceWorkoutId !== document.sourceWorkoutId ||
      !isAdaptiveContinuationReference(reference)
    ) {
      return null;
    }
    return reference as AdaptiveContinuationReference;
  });
  const first = references[0];
  if (!first || references.some((reference) => !reference || !stableJsonEqual(reference, first))) {
    return null;
  }
  return first;
}

function isAdaptiveContinuationReference(
  value: Record<string, unknown> | null,
): value is AdaptiveContinuationReference {
  return (
    value?.kind === ADAPTIVE_CONTINUATION_REFERENCE_KIND &&
    typeof value.blueprintId === "string" &&
    Number.isSafeInteger(value.blueprintVersion) &&
    typeof value.blueprintSha256 === "string" &&
    typeof value.predecessorConfirmationId === "string" &&
    typeof value.candidateId === "string" &&
    Number.isSafeInteger(value.candidateVersion) &&
    typeof value.candidateSha256 === "string" &&
    typeof value.inputFingerprintSha256 === "string" &&
    typeof value.blockMode === "string" &&
    typeof value.intervalStartDate === "string" &&
    typeof value.intervalEndDate === "string"
  );
}

function rejectAdaptiveReview(message: string): WorkoutCommandReviewResult {
  return {
    ok: false,
    issues: [{ code: "stale_reference", message, path: ["command", "source"] }],
  };
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
