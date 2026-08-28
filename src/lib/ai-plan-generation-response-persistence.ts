import type { AiPlanGenerationLedgerTrace } from "@/lib/ai-plan-generation-ledger";
import { buildAiAuthoredPlanFirstPrompt } from "@/lib/ai-authored-plan-first-provider-contract";
import { digestSha256Hex, stableJsonStringify } from "@/lib/review-token-signing";
import {
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "@/lib/structured-plan-authoring-schema";
import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type AiPlanGenerationResponseRow =
  Database["public"]["Tables"]["ai_plan_generation_responses"]["Row"];

export const AI_FIRST_PLAN_MATERIAL_REQUEST_IDENTITY_VERSION =
  "ai_first_plan_material_request_identity_v1" as const;
export const AI_FIRST_PLAN_IMMUTABLE_RECOMPILE_KIND =
  "immutable_initial_response_recompile_v1" as const;

export type AiFirstPlanImmutableRecompileProvenance = {
  immutableRecompileKind: typeof AI_FIRST_PLAN_IMMUTABLE_RECOMPILE_KIND;
  retainedResponseOriginalSchemaOutcome: "rejected";
  retainedResponseOriginalCompilerOutcome: "not_run";
  recompiledDiagnosticCode: string;
  recompiledDiagnosticPath: string;
  retainedRequestFingerprintSha256: string;
  retainedVersionFingerprintSha256: string;
  materialRequestIdentityVersion: typeof AI_FIRST_PLAN_MATERIAL_REQUEST_IDENTITY_VERSION;
  materialRequestFingerprintSha256: string;
  aliasNormalizationCount: number;
};

export function isAcceptedOrImmutablyRecompiledAiPlanGenerationResponseForCandidate(
  response: AiPlanGenerationResponseRow,
  candidateProvenance: Json | null,
) {
  const provenance = jsonObject(candidateProvenance);
  const versionContext = jsonObject(response.version_context);
  const attemptResult = jsonObject(response.attempt_result);
  if (response.schema_outcome === "accepted" && response.compiler_outcome === "accepted") {
    return true;
  }
  const immutableInitialRecompile =
    response.schema_outcome === "rejected" &&
    response.compiler_outcome === "not_run" &&
    provenance?.immutableRecompileKind === AI_FIRST_PLAN_IMMUTABLE_RECOMPILE_KIND &&
    provenance.retainedResponseOriginalSchemaOutcome === response.schema_outcome &&
    provenance.retainedResponseOriginalCompilerOutcome === response.compiler_outcome &&
    provenance.recompiledDiagnosticCode === response.diagnostic_code &&
    provenance.recompiledDiagnosticPath === response.diagnostic_path &&
    provenance.retainedRequestFingerprintSha256 === response.request_fingerprint_sha256 &&
    provenance.retainedVersionFingerprintSha256 === response.version_fingerprint_sha256 &&
    provenance.materialRequestIdentityVersion === AI_FIRST_PLAN_MATERIAL_REQUEST_IDENTITY_VERSION &&
    typeof provenance.materialRequestFingerprintSha256 === "string" &&
    /^[0-9a-f]{64}$/.test(provenance.materialRequestFingerprintSha256) &&
    typeof provenance.aliasNormalizationCount === "number" &&
    Number.isInteger(provenance.aliasNormalizationCount) &&
    provenance.aliasNormalizationCount > 0 &&
    provenance.compilerVersion === versionContext?.compilerVersion &&
    attemptResult?.outcome === "technical_rejection" &&
    attemptResult.candidateRecordId === null;
  if (immutableInitialRecompile) return true;

  if (response.schema_outcome !== "accepted") return false;
  return (
    response.compiler_outcome === "rejected" &&
    provenance?.retainedResponseOriginalCompilerOutcome === "rejected" &&
    provenance.recompiledFromCompilerVersion === versionContext?.compilerVersion &&
    typeof provenance.compilerVersion === "string" &&
    /^adaptive_continuation_compiler_v\d+$/.test(provenance.compilerVersion) &&
    provenance.compilerVersion !== provenance.recompiledFromCompilerVersion &&
    provenance.recompiledDiagnosticCode === response.diagnostic_code &&
    attemptResult?.outcome === "technical_rejection" &&
    attemptResult.candidateRecordId === null
  );
}

export function isCurrentAiPlanGenerationResponseLineageForCandidate(
  response: AiPlanGenerationResponseRow,
  candidateProvenance: Json | null,
  candidate: { id: string; sha256: string },
) {
  if (
    !isAcceptedOrImmutablyRecompiledAiPlanGenerationResponseForCandidate(
      response,
      candidateProvenance,
    )
  ) {
    return false;
  }
  const attemptResult = jsonObject(response.attempt_result);
  if (response.schema_outcome === "accepted" && response.compiler_outcome === "accepted") {
    return (
      attemptResult?.outcome === "candidate_ready" &&
      attemptResult.candidateRecordId === candidate.id &&
      attemptResult.candidateSha256 === candidate.sha256
    );
  }
  return (
    attemptResult?.outcome === "technical_rejection" && attemptResult.candidateRecordId === null
  );
}

export type AiPlanGenerationValidationOutcome = "not_run" | "accepted" | "rejected";
export type AiPlanGenerationAttemptResult =
  | {
      outcome: "technical_rejection";
      candidateRecordId: null;
      candidateSha256: null;
      noPrescriptionReason: null;
    }
  | {
      outcome: "candidate_ready";
      candidateRecordId: string;
      candidateSha256: string;
      noPrescriptionReason: null;
    }
  | {
      outcome: "no_prescription";
      candidateRecordId: null;
      candidateSha256: null;
      noPrescriptionReason: string;
    };

export type AiPlanGenerationReviewVerdict = {
  verdict: "approved" | "rejected";
  discriminator: string | null;
  reviewedAt: string;
};

export type AiPlanGenerationAttemptVersionContext = {
  schemaVersion: string;
  promptVersion: string;
  policyVersion: string;
  compilerVersion: string;
  providerSettings: {
    contractMode: string;
    responseSchemaMode: string;
    responseSchemaName: string;
    timeoutMs: number;
    maxOutputTokens: number;
    reasoningEffort: "low" | null;
    textVerbosity: "low";
  };
};

type AiPlanGenerationAttemptLineageInput = {
  requestContext: unknown;
  versionContext: AiPlanGenerationAttemptVersionContext;
  generationTrace: AiPlanGenerationLedgerTrace;
};

export async function getReusableAiPlanGenerationResponseForUser(input: {
  userId: string;
  requestContext: unknown;
  versionContext: AiPlanGenerationAttemptVersionContext;
  providerModel: string;
  prompt: {
    systemPrompt: string;
    userPrompt: string;
    responseSchema: unknown;
  };
}): Promise<AiPlanGenerationResponseRow | null> {
  const identity = await buildRequestIdentity({
    userId: input.userId,
    requestContext: input.requestContext,
    versionContext: input.versionContext,
    providerModel: input.providerModel,
    promptHash: await digestSha256Hex(
      stableJsonStringify({
        systemPrompt: input.prompt.systemPrompt,
        userPrompt: input.prompt.userPrompt,
        responseSchema: input.prompt.responseSchema,
      }),
    ),
  });
  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from("ai_plan_generation_responses")
    .select("*")
    .eq("user_id", input.userId)
    .eq("request_fingerprint_sha256", identity.requestFingerprintSha256)
    .eq("version_fingerprint_sha256", identity.versionFingerprintSha256)
    .eq("provider_model", identity.providerModel)
    .order("created_at", { ascending: true })
    .limit(20);

  if (result.error) {
    throw new Error(result.error.message);
  }

  const exact =
    result.data.find((row) => {
      const providerAttempt = jsonObject(row.provider_attempt);
      return (
        stableJsonStringify(row.request_context) === stableJsonStringify(identity.requestContext) &&
        stableJsonStringify(row.version_context) === stableJsonStringify(identity.versionContext) &&
        providerAttempt?.promptHash === identity.promptHash &&
        isParseableJson(row.response_body)
      );
    }) ?? null;
  if (exact) return exact;

  const materialRequestContext = materialAiFirstPlanRequestContext(input.requestContext);
  if (!materialRequestContext) return null;

  const candidates = await supabase
    .from("ai_plan_generation_responses")
    .select("*")
    .eq("user_id", input.userId)
    .eq("version_fingerprint_sha256", identity.versionFingerprintSha256)
    .eq("provider_model", identity.providerModel)
    .order("created_at", { ascending: true })
    .limit(100);
  if (candidates.error) throw new Error(candidates.error.message);

  for (const row of candidates.data) {
    if (
      isParseableJson(row.response_body) &&
      (await isMateriallyReusableAiFirstPlanResponse({
        row,
        currentRequestContext: input.requestContext,
        currentVersionContext: identity.versionContext,
        currentPrompt: input.prompt,
      }))
    ) {
      return row;
    }
  }
  return null;
}

export function areMateriallyEquivalentAiFirstPlanRequestContexts(left: unknown, right: unknown) {
  const leftMaterial = materialAiFirstPlanRequestContext(left);
  const rightMaterial = materialAiFirstPlanRequestContext(right);
  return (
    leftMaterial !== null &&
    rightMaterial !== null &&
    stableJsonStringify(leftMaterial) === stableJsonStringify(rightMaterial)
  );
}

export async function buildAiFirstPlanMaterialRequestFingerprint(input: unknown) {
  const material = materialAiFirstPlanRequestContext(input);
  if (!material) {
    throw new Error("The AI first-plan material request context is invalid.");
  }
  return digestSha256Hex(stableJsonStringify(material));
}

export async function buildAiFirstPlanImmutableRecompileProvenance(input: {
  response: AiPlanGenerationResponseRow;
  currentRequestContext: StructuredPlanAuthoringInput;
  compilerVersion: string;
  validationIssues: readonly string[];
}): Promise<AiFirstPlanImmutableRecompileProvenance | null> {
  const response = input.response;
  const versionContext = jsonObject(response.version_context);
  const attemptResult = jsonObject(response.attempt_result);
  const aliasIssues = input.validationIssues.filter((issue) =>
    issue.startsWith("ai_authored_blueprint_family_alias_normalized:"),
  );
  if (
    response.schema_outcome !== "rejected" ||
    response.compiler_outcome !== "not_run" ||
    response.diagnostic_code !== "ai_authored_plan_first_provider_schema_invalid" ||
    !response.diagnostic_path ||
    !response.request_fingerprint_sha256 ||
    !response.version_fingerprint_sha256 ||
    versionContext?.compilerVersion !== input.compilerVersion ||
    attemptResult?.outcome !== "technical_rejection" ||
    attemptResult.candidateRecordId !== null ||
    aliasIssues.length === 0 ||
    aliasIssues.length !== input.validationIssues.length ||
    !areMateriallyEquivalentAiFirstPlanRequestContexts(
      response.request_context,
      input.currentRequestContext,
    )
  ) {
    return null;
  }

  return {
    immutableRecompileKind: AI_FIRST_PLAN_IMMUTABLE_RECOMPILE_KIND,
    retainedResponseOriginalSchemaOutcome: "rejected",
    retainedResponseOriginalCompilerOutcome: "not_run",
    recompiledDiagnosticCode: response.diagnostic_code,
    recompiledDiagnosticPath: response.diagnostic_path,
    retainedRequestFingerprintSha256: response.request_fingerprint_sha256,
    retainedVersionFingerprintSha256: response.version_fingerprint_sha256,
    materialRequestIdentityVersion: AI_FIRST_PLAN_MATERIAL_REQUEST_IDENTITY_VERSION,
    materialRequestFingerprintSha256: await buildAiFirstPlanMaterialRequestFingerprint(
      input.currentRequestContext,
    ),
    aliasNormalizationCount: aliasIssues.length,
  };
}

export async function retainCompletedAiPlanGenerationResponseForUser(
  input: {
    userId: string;
    generationId: string;
    providerResponseId: string | null;
    responseBody: string;
  } & AiPlanGenerationAttemptLineageInput,
): Promise<AiPlanGenerationResponseRow> {
  assertResponseIdentity(input.generationId, input.providerResponseId);
  assertParseableJson(input.responseBody);

  const responseSha256 = await digestSha256Hex(input.responseBody);
  const lineage = await buildAttemptLineage(input);
  const supabase = createAdminSupabaseClient();
  const inserted = await supabase
    .from("ai_plan_generation_responses")
    .insert({
      user_id: input.userId,
      generation_id: input.generationId,
      provider_response_id: input.providerResponseId,
      response_body: input.responseBody,
      response_sha256: responseSha256,
      request_context: lineage.requestContext,
      request_fingerprint_sha256: lineage.requestFingerprintSha256,
      version_context: lineage.versionContext,
      version_fingerprint_sha256: lineage.versionFingerprintSha256,
      provider_model: lineage.providerModel,
      provider_attempt: lineage.providerAttempt,
      schema_outcome: "not_run",
      compiler_outcome: "not_run",
      diagnostic_code: null,
      diagnostic_path: null,
    })
    .select("*")
    .single();

  if (!inserted.error) {
    return inserted.data;
  }

  if (inserted.error.code !== "23505") {
    throw new Error(inserted.error.message);
  }

  let existing = await getMatchingRetainedResponse({
    userId: input.userId,
    generationId: input.generationId,
    providerResponseId: input.providerResponseId,
  });
  if (existing && existing.request_context === null) {
    const attached = await supabase
      .from("ai_plan_generation_responses")
      .update({
        request_context: lineage.requestContext,
        request_fingerprint_sha256: lineage.requestFingerprintSha256,
        version_context: lineage.versionContext,
        version_fingerprint_sha256: lineage.versionFingerprintSha256,
        provider_model: lineage.providerModel,
        provider_attempt: lineage.providerAttempt,
      })
      .eq("id", existing.id)
      .eq("user_id", input.userId)
      .is("request_context", null)
      .select("*")
      .maybeSingle();

    if (attached.error) {
      throw new Error(attached.error.message);
    }
    existing = attached.data ?? (await getMatchingRetainedResponse(input));
  }
  if (
    !existing ||
    existing.response_body !== input.responseBody ||
    existing.response_sha256 !== responseSha256 ||
    existing.generation_id !== input.generationId ||
    existing.provider_response_id !== input.providerResponseId ||
    !attemptLineageMatches(existing, lineage)
  ) {
    throw new Error("The retained AI plan response conflicts with an existing owner record.");
  }

  return existing;
}

export async function recordAiPlanGenerationAttemptResultForUser(input: {
  userId: string;
  responseRecordId: string;
  result: AiPlanGenerationAttemptResult;
}): Promise<AiPlanGenerationResponseRow> {
  assertAttemptResult(input.result);
  return updateFinalJsonField({
    userId: input.userId,
    responseRecordId: input.responseRecordId,
    field: "attempt_result",
    value: toJson(input.result),
    notFoundMessage: "The retained AI plan response was not found for its attempt result.",
  });
}

export async function recordAiPlanGenerationReviewVerdictForUser(input: {
  userId: string;
  responseRecordId: string;
  reviewer: "running_coach" | "qa";
  verdict: AiPlanGenerationReviewVerdict;
}): Promise<AiPlanGenerationResponseRow> {
  const verdict = sanitizeReviewVerdict(input.verdict);
  return updateFinalJsonField({
    userId: input.userId,
    responseRecordId: input.responseRecordId,
    field: input.reviewer === "running_coach" ? "running_coach_verdict" : "qa_verdict",
    value: toJson(verdict),
    notFoundMessage: "The retained AI plan response was not found for its review verdict.",
  });
}

export async function recordAiPlanGenerationResponseOutcomeForUser(input: {
  userId: string;
  responseRecordId: string;
  schemaOutcome: AiPlanGenerationValidationOutcome;
  compilerOutcome: AiPlanGenerationValidationOutcome;
  diagnostic: { code: string; path: string } | null;
}): Promise<AiPlanGenerationResponseRow> {
  const diagnostic = sanitizeDiagnostic(input.diagnostic);
  const supabase = createAdminSupabaseClient();
  const updated = await supabase
    .from("ai_plan_generation_responses")
    .update({
      schema_outcome: input.schemaOutcome,
      compiler_outcome: input.compilerOutcome,
      diagnostic_code: diagnostic?.code ?? null,
      diagnostic_path: diagnostic?.path ?? null,
    })
    .eq("id", input.responseRecordId)
    .eq("user_id", input.userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw new Error(updated.error.message);
  }
  if (!updated.data) {
    throw new Error("The retained AI plan response was not found for its owner.");
  }

  return updated.data;
}

export async function getAiPlanGenerationResponseForUser(
  userId: string,
  responseRecordId: string,
): Promise<AiPlanGenerationResponseRow | null> {
  const result = await createAdminSupabaseClient()
    .from("ai_plan_generation_responses")
    .select("*")
    .eq("id", responseRecordId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function getAiPlanGenerationResponseByProviderIdForUser(
  userId: string,
  providerResponseId: string,
): Promise<AiPlanGenerationResponseRow | null> {
  assertResponseIdentity("lookup", providerResponseId);
  const result = await createAdminSupabaseClient()
    .from("ai_plan_generation_responses")
    .select("*")
    .eq("user_id", userId)
    .eq("provider_response_id", providerResponseId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

async function getMatchingRetainedResponse(input: {
  userId: string;
  generationId: string;
  providerResponseId: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const byGeneration = await supabase
    .from("ai_plan_generation_responses")
    .select("*")
    .eq("user_id", input.userId)
    .eq("generation_id", input.generationId)
    .maybeSingle();

  if (byGeneration.error) {
    throw new Error(byGeneration.error.message);
  }
  if (byGeneration.data || !input.providerResponseId) {
    return byGeneration.data;
  }

  const byProvider = await supabase
    .from("ai_plan_generation_responses")
    .select("*")
    .eq("user_id", input.userId)
    .eq("provider_response_id", input.providerResponseId)
    .maybeSingle();

  if (byProvider.error) {
    throw new Error(byProvider.error.message);
  }

  return byProvider.data;
}

async function buildAttemptLineage(
  input: AiPlanGenerationAttemptLineageInput & { userId: string },
) {
  const identity = await buildRequestIdentity({
    userId: input.userId,
    requestContext: input.requestContext,
    versionContext: input.versionContext,
    providerModel: input.generationTrace.provider.model,
    promptHash: input.generationTrace.request.promptHash,
  });
  const providerAttempt = toJsonObject(
    {
      contractMode: input.generationTrace.request.contractMode,
      responseSchemaMode: input.generationTrace.request.responseSchemaMode,
      promptHash: input.generationTrace.request.promptHash,
      systemPromptHash: input.generationTrace.request.systemPromptHash,
      userPromptHash: input.generationTrace.request.userPromptHash,
      responseSchemaHash: input.generationTrace.request.responseSchemaHash,
      timeoutMs: input.generationTrace.request.timeoutMs,
      maxOutputTokens: input.generationTrace.request.maxOutputTokens,
      requestStartedAt: input.generationTrace.timings.requestStartedAt,
      responseReceivedAt: input.generationTrace.timings.responseReceivedAt,
      providerElapsedMs: elapsedMilliseconds(
        input.generationTrace.timings.requestStartedAt,
        input.generationTrace.timings.responseReceivedAt,
      ),
      usage: input.generationTrace.usage,
    },
    "provider attempt",
  );

  return {
    ...identity,
    providerAttempt,
  };
}

async function buildRequestIdentity(input: {
  userId: string;
  requestContext: unknown;
  versionContext: AiPlanGenerationAttemptVersionContext;
  providerModel: string;
  promptHash: string;
}) {
  const requestContext = toJsonObject(input.requestContext, "request context");
  const versionContext = toJsonObject(input.versionContext, "version context");
  const providerModel = input.providerModel.trim();
  if (!providerModel || providerModel.length > 160) {
    throw new Error("The AI plan generation provider model is invalid.");
  }
  if (!/^[0-9a-f]{64}$/.test(input.promptHash)) {
    throw new Error("The AI plan generation prompt fingerprint is invalid.");
  }
  const versionFingerprintSha256 = await digestSha256Hex(stableJsonStringify(versionContext));
  const requestFingerprintSha256 = await digestSha256Hex(
    stableJsonStringify({
      identityVersion: "ai_plan_request_identity_v2",
      ownerUserId: input.userId,
      providerModel,
      promptHash: input.promptHash,
      requestContext,
      versionContext,
    }),
  );
  return {
    requestContext,
    requestFingerprintSha256,
    versionContext,
    versionFingerprintSha256,
    providerModel,
    promptHash: input.promptHash,
  };
}

async function isMateriallyReusableAiFirstPlanResponse(input: {
  row: AiPlanGenerationResponseRow;
  currentRequestContext: unknown;
  currentVersionContext: Json;
  currentPrompt: {
    systemPrompt: string;
    userPrompt: string;
    responseSchema: unknown;
  };
}) {
  const storedAuthoringInput = structuredPlanAuthoringInputSchema.safeParse(
    input.row.request_context,
  );
  const providerAttempt = jsonObject(input.row.provider_attempt);
  const promptHash = providerAttempt?.promptHash;
  const systemPromptHash = providerAttempt?.systemPromptHash;
  const userPromptHash = providerAttempt?.userPromptHash;
  const responseSchemaHash = providerAttempt?.responseSchemaHash;
  if (
    !storedAuthoringInput.success ||
    stableJsonStringify(input.row.version_context) !==
      stableJsonStringify(input.currentVersionContext) ||
    !areMateriallyEquivalentAiFirstPlanRequestContexts(
      storedAuthoringInput.data,
      input.currentRequestContext,
    ) ||
    typeof promptHash !== "string" ||
    typeof systemPromptHash !== "string" ||
    typeof userPromptHash !== "string" ||
    typeof responseSchemaHash !== "string"
  ) {
    return false;
  }

  const today = readPromptToday(input.currentPrompt.userPrompt);
  if (today === null) return false;
  const storedPrompt = buildAiAuthoredPlanFirstPrompt({
    authoringInput: storedAuthoringInput.data,
    today: today ?? undefined,
  });
  const [rebuiltPromptHash, rebuiltSystemPromptHash, rebuiltUserPromptHash, rebuiltSchemaHash] =
    await Promise.all([
      digestSha256Hex(stableJsonStringify(storedPrompt)),
      digestSha256Hex(storedPrompt.systemPrompt),
      digestSha256Hex(storedPrompt.userPrompt),
      digestSha256Hex(stableJsonStringify(storedPrompt.responseSchema)),
    ]);
  const [currentSystemPromptHash, currentResponseSchemaHash] = await Promise.all([
    digestSha256Hex(input.currentPrompt.systemPrompt),
    digestSha256Hex(stableJsonStringify(input.currentPrompt.responseSchema)),
  ]);
  if (
    promptHash !== rebuiltPromptHash ||
    systemPromptHash !== rebuiltSystemPromptHash ||
    userPromptHash !== rebuiltUserPromptHash ||
    responseSchemaHash !== rebuiltSchemaHash ||
    currentSystemPromptHash !== systemPromptHash ||
    currentResponseSchemaHash !== responseSchemaHash
  ) {
    return false;
  }

  const storedIdentity = await buildRequestIdentity({
    userId: input.row.user_id,
    requestContext: storedAuthoringInput.data,
    versionContext: input.row.version_context as AiPlanGenerationAttemptVersionContext,
    providerModel: input.row.provider_model ?? "",
    promptHash,
  });
  return (
    storedIdentity.requestFingerprintSha256 === input.row.request_fingerprint_sha256 &&
    storedIdentity.versionFingerprintSha256 === input.row.version_fingerprint_sha256
  );
}

function materialAiFirstPlanRequestContext(input: unknown): Json | null {
  const parsed = structuredPlanAuthoringInputSchema.safeParse(input);
  if (!parsed.success) return null;
  const material = JSON.parse(stableJsonStringify(parsed.data)) as Record<string, unknown>;
  const capability = material.runnerCapability;
  if (!capability || Array.isArray(capability) || typeof capability !== "object") return null;
  delete (capability as Record<string, unknown>).vectorId;
  const snapshot = (capability as Record<string, unknown>).snapshot;
  if (!snapshot || Array.isArray(snapshot) || typeof snapshot !== "object") return null;
  delete (snapshot as Record<string, unknown>).snapshotId;
  return toJsonObject(material, "material request context");
}

function readPromptToday(userPrompt: string): string | undefined | null {
  try {
    const parsed = JSON.parse(userPrompt) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return null;
    const today = (parsed as Record<string, unknown>).today;
    if (today === null) return undefined;
    return typeof today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : null;
  } catch {
    return null;
  }
}

function attemptLineageMatches(
  row: AiPlanGenerationResponseRow,
  lineage: Awaited<ReturnType<typeof buildAttemptLineage>>,
) {
  return (
    stableJsonStringify(row.request_context) === stableJsonStringify(lineage.requestContext) &&
    row.request_fingerprint_sha256 === lineage.requestFingerprintSha256 &&
    stableJsonStringify(row.version_context) === stableJsonStringify(lineage.versionContext) &&
    row.version_fingerprint_sha256 === lineage.versionFingerprintSha256 &&
    row.provider_model === lineage.providerModel &&
    stableJsonStringify(row.provider_attempt) === stableJsonStringify(lineage.providerAttempt)
  );
}

async function updateFinalJsonField(input: {
  userId: string;
  responseRecordId: string;
  field: "attempt_result" | "running_coach_verdict" | "qa_verdict";
  value: Json;
  notFoundMessage: string;
}) {
  const patch =
    input.field === "attempt_result"
      ? { attempt_result: input.value }
      : input.field === "running_coach_verdict"
        ? { running_coach_verdict: input.value }
        : { qa_verdict: input.value };
  const updated = await createAdminSupabaseClient()
    .from("ai_plan_generation_responses")
    .update(patch)
    .eq("id", input.responseRecordId)
    .eq("user_id", input.userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw new Error(updated.error.message);
  }
  if (!updated.data) {
    throw new Error(input.notFoundMessage);
  }
  return updated.data;
}

function assertAttemptResult(result: AiPlanGenerationAttemptResult) {
  if (result.outcome === "candidate_ready") {
    if (!isUuid(result.candidateRecordId) || !/^[0-9a-f]{64}$/.test(result.candidateSha256)) {
      throw new Error("The AI plan generation candidate result is invalid.");
    }
    return;
  }
  if (result.outcome === "no_prescription") {
    if (!sanitizeDiagnostic({ code: result.noPrescriptionReason, path: "root" })?.code) {
      throw new Error("The AI plan generation no-prescription reason is invalid.");
    }
  }
}

function sanitizeReviewVerdict(verdict: AiPlanGenerationReviewVerdict) {
  const reviewedAt = new Date(verdict.reviewedAt);
  if (Number.isNaN(reviewedAt.valueOf())) {
    throw new Error("The AI plan generation review timestamp is invalid.");
  }
  const discriminator = verdict.discriminator
    ? (sanitizeDiagnostic({ code: verdict.discriminator, path: "root" })?.code ?? null)
    : null;
  return { ...verdict, discriminator, reviewedAt: reviewedAt.toISOString() };
}

function elapsedMilliseconds(startedAt: string | null, completedAt: string | null) {
  if (!startedAt || !completedAt) return null;
  const elapsed = new Date(completedAt).valueOf() - new Date(startedAt).valueOf();
  return Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : null;
}

function toJsonObject(value: unknown, label: string): Json {
  const normalized = JSON.parse(stableJsonStringify(value)) as Json;
  if (!normalized || Array.isArray(normalized) || typeof normalized !== "object") {
    throw new Error(`The AI plan generation ${label} must be a JSON object.`);
  }
  return normalized;
}

function toJson(value: unknown): Json {
  return JSON.parse(stableJsonStringify(value)) as Json;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function assertParseableJson(responseBody: string) {
  if (!responseBody) {
    throw new Error("The completed AI plan response body is empty.");
  }

  try {
    JSON.parse(responseBody);
  } catch {
    throw new Error("The completed AI plan response body is not parseable JSON.");
  }
}

function isParseableJson(responseBody: string) {
  try {
    JSON.parse(responseBody);
    return true;
  } catch {
    return false;
  }
}

function jsonObject(value: Json | null): Record<string, Json | undefined> | null {
  return value && !Array.isArray(value) && typeof value === "object"
    ? (value as Record<string, Json | undefined>)
    : null;
}

function assertResponseIdentity(generationId: string, providerResponseId: string | null) {
  if (!/^[A-Za-z0-9._-]{1,160}$/.test(generationId)) {
    throw new Error("The AI plan generation identifier is invalid.");
  }
  if (providerResponseId && !/^[A-Za-z0-9._-]{1,200}$/.test(providerResponseId)) {
    throw new Error("The provider response identifier is invalid.");
  }
}

function sanitizeDiagnostic(diagnostic: { code: string; path: string } | null) {
  if (!diagnostic) {
    return null;
  }

  const code = diagnostic.code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .slice(0, 120);
  const path = diagnostic.path
    .trim()
    .replace(/[^A-Za-z0-9._[\]-]+/g, "_")
    .slice(0, 240);

  return {
    code: code || "unknown",
    path: path || "root",
  };
}
