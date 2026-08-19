import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type AiPlanGenerationResponseRow =
  Database["public"]["Tables"]["ai_plan_generation_responses"]["Row"];
export type AiPlanGenerationValidationOutcome = "not_run" | "accepted" | "rejected";

export async function retainCompletedAiPlanGenerationResponseForUser(input: {
  userId: string;
  generationId: string;
  providerResponseId: string | null;
  responseBody: string;
}): Promise<AiPlanGenerationResponseRow> {
  assertResponseIdentity(input.generationId, input.providerResponseId);
  assertParseableJson(input.responseBody);

  const responseSha256 = await digestSha256Hex(input.responseBody);
  const supabase = createAdminSupabaseClient();
  const inserted = await supabase
    .from("ai_plan_generation_responses")
    .insert({
      user_id: input.userId,
      generation_id: input.generationId,
      provider_response_id: input.providerResponseId,
      response_body: input.responseBody,
      response_sha256: responseSha256,
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

  const existing = await getMatchingRetainedResponse({
    userId: input.userId,
    generationId: input.generationId,
    providerResponseId: input.providerResponseId,
  });
  if (
    !existing ||
    existing.response_body !== input.responseBody ||
    existing.response_sha256 !== responseSha256 ||
    existing.generation_id !== input.generationId ||
    existing.provider_response_id !== input.providerResponseId
  ) {
    throw new Error("The retained AI plan response conflicts with an existing owner record.");
  }

  return existing;
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

async function digestSha256Hex(payload: string) {
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
