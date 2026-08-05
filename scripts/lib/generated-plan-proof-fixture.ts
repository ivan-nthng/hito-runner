import assert from "node:assert/strict";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
} from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { buildAiGeneratedRunningPlanAuthoringInput } from "../../src/lib/ai-generated-running-plan";
import {
  buildReviewedAiGeneratedRunningPlanPreview,
  type RunningPlanPreviewActionInput,
} from "../../src/lib/running-plan-engine-actions";
import { DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE } from "../../src/lib/local-auth-account-registry.server";
import { buildProofRunnerProfileSnapshot } from "../runner-profile-snapshot-proof-helpers";

export async function buildReviewedAiFixtureResult(input: RunningPlanPreviewActionInput) {
  const runnerProfileSnapshot = buildProofRunnerProfileSnapshot(input);
  const authoring = buildAiGeneratedRunningPlanAuthoringInput(input, runnerProfileSnapshot);
  assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
  if (!authoring.ok) throw new Error(authoring.message);

  const today = input.startDate ?? authoring.authoringInput.schedule.startDate;
  const fetchImpl = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: authoring.authoringInput,
    today,
    env: localAiGeneratedFixtureEnv,
  });

  return buildReviewedAiGeneratedRunningPlanPreview(input, {
    aiPreview: {
      apiKey: "local-qa-dev-ai-generated-plan-fixture",
      model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
      today,
      fetchImpl,
    },
    runnerProfileSnapshot,
  });
}

const localAiGeneratedFixtureEnv = {
  OPENAI_API_KEY: "local-qa-dev-ai-generated-plan-fixture",
  OPENAI_MODEL: "hito-local-qa-dev-ai-generated-plan-fixture",
  LOCAL_AUTH_BYPASS_ENABLED: "true",
  LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
  HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "qa_fixture",
};
