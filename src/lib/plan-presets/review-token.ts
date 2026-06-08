import { serverEnv } from "@/lib/supabase/env";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import type {
  PlanPresetCardId,
  PlanPresetEligibilityInput,
  PlanPresetReviewDraftContract,
} from "@/lib/plan-presets/schema";

export interface PlanPresetReviewTokenPayload {
  cardId: PlanPresetCardId;
  input: PlanPresetEligibilityInput;
  draft: PlanPresetReviewDraftContract;
}

export interface PlanPresetReviewSignature {
  reviewToken: string;
  reviewChecksum: string;
}

const PLAN_PRESET_REVIEW_TOKEN_CONTRACT_VERSION = "plan_preset_review_v1";

export async function signPlanPresetReviewDraft(
  payload: PlanPresetReviewTokenPayload,
): Promise<PlanPresetReviewSignature> {
  const stablePayload = stableJsonStringify(buildStablePlanPresetReviewPayload(payload));
  const checksum = `sha256:${await digestSha256Hex(stablePayload)}`;
  const secret = serverEnv.supabaseServiceRoleKey ?? serverEnv.openAiApiKey;

  if (!secret) {
    return {
      reviewToken: checksum,
      reviewChecksum: checksum,
    };
  }

  return {
    reviewToken: `hmac-sha256:${await hmacSha256Hex(secret, stablePayload)}`,
    reviewChecksum: checksum,
  };
}

export async function isPlanPresetReviewDraftSignatureValid(
  payload: PlanPresetReviewTokenPayload,
  signature: PlanPresetReviewSignature,
) {
  const expected = await signPlanPresetReviewDraft(payload);

  return (
    safeTokenEqual(signature.reviewToken, expected.reviewToken) &&
    safeTokenEqual(signature.reviewChecksum, expected.reviewChecksum)
  );
}

function buildStablePlanPresetReviewPayload({
  cardId,
  input,
  draft,
}: PlanPresetReviewTokenPayload) {
  return {
    contractVersion: PLAN_PRESET_REVIEW_TOKEN_CONTRACT_VERSION,
    cardId,
    input,
    draft: {
      sourceKind: draft.sourceKind,
      source_kind: draft.source_kind,
      sourceStatus: draft.sourceStatus,
      presetId: draft.presetId,
      presetVersion: draft.presetVersion,
      persisted: draft.persisted,
      authoringInput: draft.authoringInput,
      canonicalPlan: buildStableCanonicalPlanPayload(draft.canonicalPlan),
      metricTruth: draft.metricTruth,
      reviewShape: draft.reviewShape,
      safety: draft.safety,
    },
  };
}

function buildStableCanonicalPlanPayload(plan: TrainingPlanV2) {
  return {
    plan_id: plan.plan_id,
    schema_version: plan.schema_version,
    plan_name: plan.plan_name,
    source_kind: plan.source_kind,
    generated_for: plan.generated_for,
    goal: plan.goal,
    runner_profile: plan.runner_profile,
    start_date: plan.start_date,
    preparation_horizon_weeks: plan.preparation_horizon_weeks,
    preparation_horizon_months: plan.preparation_horizon_months,
    target_date: plan.target_date,
    plan_preferences: plan.plan_preferences,
    training_constraints: plan.training_constraints,
    planned_workouts: plan.planned_workouts,
  };
}

function safeTokenEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

async function digestSha256Hex(payload: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));

  return bytesToHex(digest);
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));

  return bytesToHex(signature);
}

function bytesToHex(value: ArrayBuffer) {
  return Array.from(new Uint8Array(value))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    );
  }

  return value;
}
