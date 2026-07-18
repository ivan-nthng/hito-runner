import assert from "node:assert/strict";
import {
  buildStructuredFirstPlanAuthoringInput,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "../../src/lib/structured-first-plan-onboarding";
import { buildReviewedFirstPlanImportedSeed } from "../../src/lib/active-plan-persistence";
import { generateAiFirstPlanDraftPreview } from "../../src/lib/ai-first-plan-draft-service";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
} from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { AI_AUTHORED_PLAN_FIRST_SOURCE_KIND } from "../../src/lib/ai-authored-plan-first-compiler";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";

export async function assertFirstPlanReleaseGateContracts() {
  const request = buildPlanFirstReleaseGateRequest();
  const parsedInput = parseStructuredFirstPlanOnboardingInput(request);
  const authoringInput = buildStructuredFirstPlanAuthoringInput(parsedInput);
  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput,
    today: authoringInput.schedule.startDate,
  });

  const serviceResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    today: authoringInput.schedule.startDate,
    apiKey: "plan-first-release-gate",
    model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
    fetchImpl: fixtureFetch,
    timeoutMs: 1_000,
    maxOutputTokens: 12_000,
  });

  assert.equal(
    serviceResult.ok,
    true,
    serviceResult.ok
      ? "Plan-first draft service should produce canonical plan output."
      : serviceResult.message,
  );
  if (!serviceResult.ok) throw new Error(serviceResult.message);

  assertPlanFirstCanonicalResult(serviceResult.canonicalPlan, "plan-first draft service");
  assert.equal(serviceResult.metadata.status, "ai_authored");
  assert.equal(serviceResult.metadata.source, "openai_ai_authored_full_plan_draft");
  assert.equal(serviceResult.metadata.debug.contractMode, "plan_first");
  assert.equal(
    serviceResult.metadata.debug.responseSchemaMode,
    "responses_json_schema_plan_first_strict",
  );
  assert.doesNotMatch(
    JSON.stringify(serviceResult),
    /repeat_unit|recovery_unit/,
    "Plan-first service output must not expose deleted generated-plan legacy vocabulary.",
  );

  const importedSeed = buildReviewedFirstPlanImportedSeed(serviceResult.canonicalPlan);
  assert.equal(importedSeed.workouts.length, serviceResult.canonicalPlan.planned_workouts.length);

  const invalidResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    apiKey: "invalid-plan-first-release-gate",
    model: "invalid-plan-first-release-gate",
    today: authoringInput.schedule.startDate,
    fetchImpl: async () =>
      openAiPlanFirstResponse("invalid-plan-first-release-gate", {
        metadata: {
          goal: "Invalid plan-first draft",
          target_date: null,
          target_time: null,
          athlete: null,
          rest_days: [],
          long_run_day: null,
          note: null,
          warnings: [],
          assumptions: [],
        },
        weeks: [],
      }),
    timeoutMs: 1_000,
  });

  assert.equal(invalidResult.ok, false);
  if (invalidResult.ok) {
    throw new Error("Invalid plan-first release-gate payload unexpectedly compiled.");
  }
  assert.equal(invalidResult.reason, "ai_authored_plan_first_unavailable");
  assert.equal(JSON.stringify(invalidResult).includes("draftToken"), false);
}

function buildPlanFirstReleaseGateRequest(): StructuredFirstPlanOnboardingRequestInput {
  return {
    profile: { age: 34, weightKg: 72, heightCm: 178 },
    benchmark: { kind: "recent_5k_time", recent5kTime: "24:00" },
    availability: {
      runningDaysPerWeek: 5,
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
    },
    goal: {
      goalDistance: "half_marathon",
      goalStyle: "target_time",
      terrainFocus: "standard",
      targetTime: "2:00:00",
      targetDate: "2026-09-26",
    },
    strength: { preference: "mobility" },
    execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    comment: null,
  };
}

function assertPlanFirstCanonicalResult(plan: TrainingPlanV2, label: string) {
  assert.equal(plan.schema_version, "training-plan-v2");
  assert.equal(plan.source_kind, AI_AUTHORED_PLAN_FIRST_SOURCE_KIND);
  assert.equal(plan.source_status, "ai_authored");
  assert.equal(plan.goal.goal_type, "distance_goal");
  assert.equal(plan.goal.distance_meters, 21_100);
  assert.ok(plan.planned_workouts.length > 0, `${label} must include calendar rows.`);
  assert.ok(
    plan.planned_workouts.some((workout) =>
      workout.segments.some((segment) => segment.prescription.mode === "repeats"),
    ),
    `${label} must preserve AI-authored repeat structure.`,
  );
}

function openAiPlanFirstResponse(responseId: string, draft: unknown) {
  return new Response(
    JSON.stringify({
      id: responseId,
      status: "completed",
      output_text: JSON.stringify(draft),
      usage: {
        input_tokens: 100,
        output_tokens: 100,
        total_tokens: 200,
      },
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}
