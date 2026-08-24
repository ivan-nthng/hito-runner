import {
  AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
  AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  type AiAuthoredBlueprintReviewConflict,
  type AiAuthoredBlueprintSummary,
} from "@/lib/ai-authored-plan-first-compiler";
import type {
  AdaptiveContinuationHorizonCheckIn,
  AdaptiveProjectionSchedulingPreference,
} from "@/lib/adaptive-blueprint-product-contract";
import type { AdaptiveContinuationCandidateDraft } from "@/lib/adaptive-blueprint-continuation";
import type { AiPlanGenerationResponseRow } from "@/lib/ai-plan-generation-response-persistence";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring-schema";

const ADAPTIVE_BLUEPRINT_PERSISTENCE_VERSION = 1;
const ADAPTIVE_DETAILED_CANDIDATE_VERSION = 1;

export type RetainedAdaptiveTrainingSourceCandidate = {
  blueprintId: string;
  blueprintVersion: number;
  blueprintSha256: string;
  candidateId: string;
  candidateVersion: number;
  candidateSha256: string;
  inputFingerprintSha256: string;
};

type AdaptiveTrainingBlueprintVersionRow =
  Database["public"]["Tables"]["adaptive_training_blueprint_versions"]["Row"];
type AdaptiveTrainingDetailedCandidateRow =
  Database["public"]["Tables"]["adaptive_training_detailed_candidates"]["Row"];
type AdaptiveTrainingBlockConfirmationRow =
  Database["public"]["Tables"]["adaptive_training_block_confirmations"]["Row"];
type AdaptiveTrainingContinuationInputRevisionRow =
  Database["public"]["Tables"]["adaptive_training_continuation_input_revisions"]["Row"];

export type AdaptiveTrainingSourceCandidateSnapshot = {
  blueprint: AdaptiveTrainingBlueprintVersionRow;
  candidate: AdaptiveTrainingDetailedCandidateRow;
};

export type AdaptiveTrainingContinuationSourceState = {
  blueprint: AdaptiveTrainingBlueprintVersionRow;
  confirmation: AdaptiveTrainingBlockConfirmationRow;
  confirmedCandidate: AdaptiveTrainingDetailedCandidateRow;
  continuationCandidates: AdaptiveTrainingDetailedCandidateRow[];
  latestInputRevision: AdaptiveTrainingContinuationInputRevisionRow | null;
  bridgeExceptionUsed: boolean;
};

export type RetainedAdaptiveTrainingContinuationInputRevision = {
  id: string;
  revision: number;
  contentSha256: string;
  supersedesRevision: number | null;
};

export type RetainedAdaptiveTrainingContinuationCandidate = {
  candidateId: string;
  candidateVersion: number;
  candidateSha256: string;
  inputFingerprintSha256: string;
};

type FrozenStructuredAuthoringInput = Omit<StructuredPlanAuthoringInput, "requestContext">;

export async function retainAdaptiveTrainingSourceCandidateForUser(input: {
  userId: string;
  retainedResponse: AiPlanGenerationResponseRow;
  blueprint: AiAuthoredBlueprintSummary;
  canonicalPlan: TrainingPlanV2;
  reviewConflicts: readonly AiAuthoredBlueprintReviewConflict[];
  authoringInput: FrozenStructuredAuthoringInput;
}): Promise<RetainedAdaptiveTrainingSourceCandidate> {
  if (
    input.retainedResponse.user_id !== input.userId ||
    input.retainedResponse.schema_outcome !== "accepted" ||
    input.retainedResponse.compiler_outcome !== "accepted"
  ) {
    throw new Error("Adaptive Blueprint retention requires an accepted owner response.");
  }

  const candidateContent = {
    canonicalPlan: input.canonicalPlan,
    reviewConflicts: input.reviewConflicts,
  };
  const inputProvenance = {
    kind: "structured_authoring_input",
    retainedResponseId: input.retainedResponse.id,
    retainedResponseSha256: input.retainedResponse.response_sha256,
    sourceContractVersion: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
    compilerVersion: AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
  };
  const factReferences = [
    { kind: "authoring_fact_group", path: "runnerFacts" },
    { kind: "authoring_fact_group", path: "availability" },
    { kind: "authoring_fact_group", path: "planGoalIntent" },
    { kind: "authoring_fact_group", path: "schedule" },
  ];
  const confirmationLineage = {
    kind: "initial_detailed_block_candidate",
    state: "unconfirmed",
    predecessorCandidateId: null,
    predecessorConfirmationId: null,
  };
  const result = await createAdminSupabaseClient().rpc(
    "retain_adaptive_training_source_candidate",
    {
      p_user_id: input.userId,
      p_source_response_id: input.retainedResponse.id,
      p_blueprint_version: ADAPTIVE_BLUEPRINT_PERSISTENCE_VERSION,
      p_source_contract_version: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
      p_compiler_version: AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION,
      p_blueprint_content: toJson(input.blueprint),
      p_candidate_version: ADAPTIVE_DETAILED_CANDIDATE_VERSION,
      p_interval_start_date: input.blueprint.detailedHorizon.startDate,
      p_interval_end_date: input.blueprint.detailedHorizon.endDate,
      p_candidate_content: toJson(candidateContent),
      p_input_snapshot: toJson(input.authoringInput),
      p_input_provenance: toJson(inputProvenance),
      p_fact_references: toJson(factReferences),
      p_confirmation_lineage: toJson(confirmationLineage),
    },
  );

  if (result.error) {
    throw new Error(result.error.message);
  }
  const retained = result.data?.[0];
  if (!retained) {
    throw new Error("Adaptive Blueprint retention returned no owner record.");
  }

  return {
    blueprintId: retained.blueprint_id,
    blueprintVersion: retained.blueprint_version,
    blueprintSha256: retained.blueprint_sha256,
    candidateId: retained.candidate_id,
    candidateVersion: retained.candidate_version,
    candidateSha256: retained.candidate_sha256,
    inputFingerprintSha256: retained.input_fingerprint_sha256,
  };
}

export async function getAdaptiveTrainingSourceCandidateForUser(input: {
  userId: string;
  reference: RetainedAdaptiveTrainingSourceCandidate;
}): Promise<AdaptiveTrainingSourceCandidateSnapshot | null> {
  const supabase = createAdminSupabaseClient();
  const candidateResult = await supabase
    .from("adaptive_training_detailed_candidates")
    .select("*")
    .eq("user_id", input.userId)
    .eq("id", input.reference.candidateId)
    .maybeSingle();

  if (candidateResult.error) {
    throw new Error(candidateResult.error.message);
  }
  const candidate = candidateResult.data;
  if (
    !candidate ||
    candidate.blueprint_id !== input.reference.blueprintId ||
    candidate.version !== input.reference.candidateVersion ||
    candidate.candidate_sha256 !== input.reference.candidateSha256 ||
    candidate.input_fingerprint_sha256 !== input.reference.inputFingerprintSha256
  ) {
    return null;
  }

  const blueprintResult = await supabase
    .from("adaptive_training_blueprint_versions")
    .select("*")
    .eq("user_id", input.userId)
    .eq("id", input.reference.blueprintId)
    .maybeSingle();

  if (blueprintResult.error) {
    throw new Error(blueprintResult.error.message);
  }
  const blueprint = blueprintResult.data;
  if (
    !blueprint ||
    blueprint.version !== input.reference.blueprintVersion ||
    blueprint.content_sha256 !== input.reference.blueprintSha256
  ) {
    return null;
  }

  return { blueprint, candidate };
}

export async function retainAdaptiveTrainingContinuationInputRevisionForUser(input: {
  userId: string;
  blueprint: {
    id: string;
    version: number;
    sha256: string;
  };
  activeProjectionPreferences: readonly AdaptiveProjectionSchedulingPreference[];
  horizonCheckIn?: AdaptiveContinuationHorizonCheckIn | null;
}): Promise<RetainedAdaptiveTrainingContinuationInputRevision> {
  const result = await createAdminSupabaseClient().rpc(
    "retain_adaptive_training_continuation_input_revision",
    {
      p_user_id: input.userId,
      p_blueprint_id: input.blueprint.id,
      p_blueprint_version: input.blueprint.version,
      p_blueprint_sha256: input.blueprint.sha256,
      p_active_projection_preferences: toJson(input.activeProjectionPreferences),
      p_horizon_check_in: input.horizonCheckIn ? toJson(input.horizonCheckIn) : null,
    },
  );

  if (result.error) {
    throw new Error(result.error.message);
  }
  const retained = result.data?.[0];
  if (!retained) {
    throw new Error("Adaptive continuation-input retention returned no owner record.");
  }

  return {
    id: retained.revision_id,
    revision: retained.revision,
    contentSha256: retained.content_sha256,
    supersedesRevision: retained.supersedes_revision,
  };
}

export async function retainAdaptiveTrainingContinuationCandidateForUser(input: {
  userId: string;
  blueprint: { id: string; version: number; sha256: string };
  predecessorConfirmationId: string;
  retainedResponse: AiPlanGenerationResponseRow;
  candidate: AdaptiveContinuationCandidateDraft;
}): Promise<RetainedAdaptiveTrainingContinuationCandidate> {
  if (
    input.retainedResponse.user_id !== input.userId ||
    input.retainedResponse.schema_outcome !== "accepted" ||
    input.retainedResponse.compiler_outcome !== "accepted" ||
    input.candidate.inputProvenance.retainedResponseId !== input.retainedResponse.id ||
    input.candidate.inputProvenance.retainedResponseSha256 !==
      input.retainedResponse.response_sha256
  ) {
    throw new Error("Adaptive continuation retention requires its accepted owner response.");
  }
  const result = await createAdminSupabaseClient().rpc(
    "retain_adaptive_training_continuation_candidate",
    {
      p_user_id: input.userId,
      p_blueprint_id: input.blueprint.id,
      p_blueprint_version: input.blueprint.version,
      p_blueprint_sha256: input.blueprint.sha256,
      p_predecessor_confirmation_id: input.predecessorConfirmationId,
      p_source_response_id: input.retainedResponse.id,
      p_interval_start_date: input.candidate.intervalStartDate,
      p_interval_end_date: input.candidate.intervalEndDate,
      p_candidate_content: toJson(input.candidate.candidateContent),
      p_input_snapshot: toJson(input.candidate.inputSnapshot),
      p_input_provenance: toJson(input.candidate.inputProvenance),
      p_fact_references: toJson(input.candidate.factReferences),
      p_confirmation_lineage: toJson(input.candidate.confirmationLineage),
    },
  );

  if (result.error) {
    throw new Error(result.error.message);
  }
  const retained = result.data?.[0];
  if (!retained) {
    throw new Error("Adaptive continuation-candidate retention returned no owner record.");
  }
  return {
    candidateId: retained.candidate_id,
    candidateVersion: retained.candidate_version,
    candidateSha256: retained.candidate_sha256,
    inputFingerprintSha256: retained.input_fingerprint_sha256,
  };
}

export async function getAdaptiveTrainingOriginalAuthoringInputForUser(input: {
  userId: string;
  blueprintId: string;
}): Promise<Json | null> {
  const result = await createAdminSupabaseClient()
    .from("adaptive_training_detailed_candidates")
    .select("input_snapshot, confirmation_lineage")
    .eq("user_id", input.userId)
    .eq("blueprint_id", input.blueprintId)
    .order("version", { ascending: true });
  if (result.error) throw new Error(result.error.message);
  const initial = result.data.find((candidate) => {
    const lineage = jsonRecord(candidate.confirmation_lineage);
    return lineage?.kind === "initial_detailed_block_candidate";
  });
  return initial?.input_snapshot ?? null;
}

export async function getAdaptiveTrainingDetailedCandidateForUser(input: {
  userId: string;
  candidateId: string;
}): Promise<AdaptiveTrainingDetailedCandidateRow | null> {
  const result = await createAdminSupabaseClient()
    .from("adaptive_training_detailed_candidates")
    .select("*")
    .eq("user_id", input.userId)
    .eq("id", input.candidateId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return (result.data as AdaptiveTrainingDetailedCandidateRow | null) ?? null;
}

export async function getAdaptiveTrainingContinuationSourceStateForUser(
  userId: string,
): Promise<AdaptiveTrainingContinuationSourceState | null> {
  const supabase = createAdminSupabaseClient();
  const confirmationsResult = await supabase
    .from("adaptive_training_block_confirmations")
    .select("*")
    .eq("user_id", userId)
    .order("confirmed_at", { ascending: true })
    .order("id", { ascending: true });

  if (confirmationsResult.error) {
    throw new Error(confirmationsResult.error.message);
  }
  const confirmations = confirmationsResult.data as AdaptiveTrainingBlockConfirmationRow[];
  if (confirmations.length === 0) return null;

  const predecessorIds = new Set(
    confirmations.flatMap((confirmation) =>
      confirmation.predecessor_confirmation_id ? [confirmation.predecessor_confirmation_id] : [],
    ),
  );
  const leaves = confirmations.filter((confirmation) => !predecessorIds.has(confirmation.id));
  if (leaves.length !== 1) {
    throw new Error("Adaptive continuation lineage requires exactly one owner-bound leaf.");
  }
  const confirmation = leaves[0];

  const [blueprintResult, inputRevisionResult, candidateResult, continuationCandidatesResult] =
    await Promise.all([
      supabase
        .from("adaptive_training_blueprint_versions")
        .select("*")
        .eq("user_id", userId)
        .eq("id", confirmation.blueprint_id)
        .maybeSingle(),
      supabase
        .from("adaptive_training_continuation_input_revisions")
        .select("*")
        .eq("user_id", userId)
        .eq("blueprint_id", confirmation.blueprint_id)
        .order("revision", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("adaptive_training_detailed_candidates")
        .select("*")
        .eq("user_id", userId)
        .eq("id", confirmation.detailed_candidate_id)
        .maybeSingle(),
      supabase
        .from("adaptive_training_detailed_candidates")
        .select("*")
        .eq("user_id", userId)
        .eq("blueprint_id", confirmation.blueprint_id)
        .order("version", { ascending: false }),
    ]);

  if (blueprintResult.error) throw new Error(blueprintResult.error.message);
  if (inputRevisionResult.error) throw new Error(inputRevisionResult.error.message);
  if (candidateResult.error) throw new Error(candidateResult.error.message);
  if (continuationCandidatesResult.error) {
    throw new Error(continuationCandidatesResult.error.message);
  }
  if (!blueprintResult.data) {
    throw new Error("Adaptive continuation lineage is missing its immutable Blueprint.");
  }
  if (
    blueprintResult.data.version !== confirmation.blueprint_version ||
    blueprintResult.data.content_sha256 !== confirmation.blueprint_sha256
  ) {
    throw new Error("Adaptive continuation lineage does not match its immutable Blueprint.");
  }
  if (!candidateResult.data) {
    throw new Error("Adaptive continuation lineage is missing its immutable detailed candidate.");
  }

  const continuationCandidates = (
    continuationCandidatesResult.data as AdaptiveTrainingDetailedCandidateRow[]
  ).filter((candidate) => {
    const lineage = jsonRecord(candidate.confirmation_lineage);
    return (
      lineage?.kind === "continuation_detailed_block_candidate" &&
      lineage.predecessorConfirmationId === confirmation.id
    );
  });

  return {
    blueprint: blueprintResult.data as AdaptiveTrainingBlueprintVersionRow,
    confirmation,
    confirmedCandidate: candidateResult.data as AdaptiveTrainingDetailedCandidateRow,
    continuationCandidates,
    latestInputRevision:
      (inputRevisionResult.data as AdaptiveTrainingContinuationInputRevisionRow | null) ?? null,
    bridgeExceptionUsed: confirmations.some(
      (candidate) => candidate.block_mode === "resolved_interruption_bridge",
    ),
  };
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function jsonRecord(value: Json): Record<string, Json> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : null;
}
