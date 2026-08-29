import assert from "node:assert/strict";
import { buildReviewedFirstPlanImportedSeed } from "../../src/lib/active-plan-persistence";
import { generateAiFirstPlanDraftPreview } from "../../src/lib/ai-first-plan-draft-service";
import { buildAiGeneratedRunningPlanAuthoringInput as buildAiGeneratedRunningPlanAuthoringInputRuntime } from "../../src/lib/ai-generated-running-plan";
import { AI_AUTHORED_PLAN_FIRST_SOURCE_KIND } from "../../src/lib/ai-authored-plan-first-compiler";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";
import type { BuildRunningPlanPreviewInput } from "../../src/lib/plan-creation-engine";
import { addDaysIso } from "../../src/lib/training";
import { buildProofRunnerCapability } from "../runner-plan-capability-proof-helpers";

function buildAiGeneratedRunningPlanAuthoringInput(input: BuildRunningPlanPreviewInput) {
  const profile = buildProofRunnerCapability(input);
  return buildAiGeneratedRunningPlanAuthoringInputRuntime(
    input,
    profile.runnerCapability,
    profile.acceptedHeartRateProfile,
  );
}

export async function assertFirstPlanReleaseGateContracts() {
  await assertFirstSessionAdaptationContracts();

  const normalized = buildAiGeneratedRunningPlanAuthoringInput({
    age: 34,
    weightKg: 72,
    heightCm: 178,
    runnerLevel: "runs_a_lot",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Sunday"],
    preferredLongRunDay: "Saturday",
    startDate: "2026-07-06",
    benchmark: { kind: "recent_5k_time", recent5kTime: "24:00" },
    planGoalIntent: {
      distance: { kind: "preset", preset: "Half Marathon" },
      targetFinishTime: "2:00:00",
      targetDate: "2026-09-26",
    },
  });
  assert.equal(normalized.ok, true);
  if (!normalized.ok) throw new Error(normalized.message);
  const authoringInput = normalized.authoringInput;
  let providerDispatches = 0;

  const serviceResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    today: authoringInput.schedule.startDate,
    apiKey: "must-not-be-used-for-deterministic-c0",
    model: "must-not-be-used-for-deterministic-c0",
    fetchImpl: async () => {
      providerDispatches += 1;
      throw new Error("Deterministic C0 must not dispatch a provider.");
    },
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
  assert.equal(providerDispatches, 0);
  assert.equal(serviceResult.metadata.status, "ai_authored");
  assert.equal(serviceResult.metadata.source, "hito_c0_deterministic_starter_policy");
  assert.equal(serviceResult.metadata.responseId, null);
  assert.equal(serviceResult.metadata.generationTrace?.provider.kind, "not_started");
  assert.equal(serviceResult.metadata.generationTrace?.provider.paidProviderCall, false);
  assert.equal(serviceResult.metadata.generationTrace?.usage.inputTokens, null);
  assert.equal(serviceResult.metadata.generationTrace?.usage.outputTokens, null);
  assert.equal(serviceResult.metadata.generationTrace?.usage.reasoningTokens, null);
  assert.equal(serviceResult.metadata.generationTrace?.usage.totalTokens, null);
  assert.equal(serviceResult.metadata.debug.contractMode, "adaptive_blueprint_four_week");
  assert.equal(
    serviceResult.metadata.debug.responseSchemaMode,
    "responses_json_schema_adaptive_blueprint_four_week_v1_strict",
  );
  assert.doesNotMatch(
    JSON.stringify(serviceResult),
    /repeat_unit|recovery_unit/,
    "Plan-first service output must not expose deleted generated-plan legacy vocabulary.",
  );

  const importedSeed = buildReviewedFirstPlanImportedSeed(serviceResult.canonicalPlan);
  assert.equal(importedSeed.workouts.length, serviceResult.canonicalPlan.planned_workouts.length);
}

async function assertFirstSessionAdaptationContracts() {
  for (const scenario of [
    {
      name: "new_to_running",
      expectedLevel: "new_to_running",
      runnerLevel: "beginner_new_runner" as const,
      targetDate: "2026-08-30",
      startDate: "2026-07-06",
      fixedRestDays: ["Tuesday", "Saturday"] as const,
      preferredLongRunDay: "Sunday" as const,
      benchmark: { kind: "unknown" } as const,
    },
    {
      name: "beginner",
      expectedLevel: "beginner",
      runnerLevel: "sometimes_runs" as const,
      targetDate: "2026-08-30",
      startDate: "2026-07-06",
      fixedRestDays: ["Tuesday", "Saturday"] as const,
      preferredLongRunDay: "Sunday" as const,
      benchmark: { kind: "unknown" } as const,
    },
    {
      name: "beginner_with_benchmark_and_awkward_availability",
      expectedLevel: "beginner",
      runnerLevel: "sometimes_runs" as const,
      targetDate: "2026-09-02",
      startDate: "2026-07-08",
      fixedRestDays: ["Tuesday", "Thursday", "Saturday", "Sunday"] as const,
      preferredLongRunDay: "Friday" as const,
      benchmark: { kind: "recent_5k_time", recent5kTime: "24:00" } as const,
    },
    {
      name: "running_regularly",
      expectedLevel: "running_regularly",
      runnerLevel: "runs_a_lot" as const,
      targetDate: "2026-08-30",
      startDate: "2026-07-06",
      fixedRestDays: ["Wednesday", "Saturday"] as const,
      preferredLongRunDay: "Sunday" as const,
      benchmark: { kind: "unknown" } as const,
    },
    {
      name: "performance_focused",
      expectedLevel: "performance_focused",
      runnerLevel: "professional_competitive" as const,
      targetDate: "2026-08-30",
      startDate: "2026-07-06",
      fixedRestDays: ["Wednesday", "Saturday"] as const,
      preferredLongRunDay: "Sunday" as const,
      benchmark: { kind: "unknown" } as const,
    },
  ]) {
    const normalized = buildAiGeneratedRunningPlanAuthoringInput({
      age: 34,
      weightKg: 72,
      heightCm: 178,
      runnerLevel: scenario.runnerLevel,
      daysPerWeek: scenario.runnerLevel === "runs_a_lot" ? 5 : 3,
      fixedRestDays: [...scenario.fixedRestDays],
      preferredLongRunDay: scenario.preferredLongRunDay,
      startDate: scenario.startDate,
      benchmark: scenario.benchmark,
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        ...(scenario.targetDate ? { targetDate: scenario.targetDate } : {}),
      },
    });
    assert.equal(normalized.ok, true, normalized.ok ? "" : normalized.message);
    if (!normalized.ok) throw new Error(normalized.message);

    let providerDispatches = 0;
    const serviceResult = await generateAiFirstPlanDraftPreview({
      input: normalized.authoringInput,
      today: normalized.authoringInput.schedule.startDate,
      apiKey: "must-not-be-used-for-deterministic-c0",
      model: "must-not-be-used-for-deterministic-c0",
      fetchImpl: async () => {
        providerDispatches += 1;
        throw new Error("Deterministic C0 must not dispatch a provider.");
      },
      timeoutMs: 1_000,
      maxOutputTokens: 12_000,
    });
    assert.equal(serviceResult.ok, true, serviceResult.ok ? "" : serviceResult.message);
    if (!serviceResult.ok) throw new Error(serviceResult.message);

    assertDeterministicC0Opening({
      startDate: normalized.authoringInput.schedule.startDate,
      canonicalPlan: serviceResult.canonicalPlan,
      expectedFirstFourteenContacts: scenario.runnerLevel === "runs_a_lot" ? 8 : 6,
    });
    assert.equal(providerDispatches, 0);
    assert.equal(serviceResult.metadata.status, "ai_authored");
    assert.equal(serviceResult.metadata.source, "hito_c0_deterministic_starter_policy");
    assert.equal(serviceResult.metadata.responseId, null);
    assert.equal(serviceResult.metadata.generationTrace?.provider.kind, "not_started");
    assert.equal(serviceResult.metadata.generationTrace?.provider.paidProviderCall, false);
    assert.equal(serviceResult.metadata.generationTrace?.usage.inputTokens, null);
    assert.equal(serviceResult.metadata.generationTrace?.usage.outputTokens, null);
    assert.equal(serviceResult.metadata.generationTrace?.usage.reasoningTokens, null);
    assert.equal(serviceResult.metadata.generationTrace?.usage.totalTokens, null);
    if (scenario.targetDate) {
      assert.equal(
        serviceResult.canonicalPlan.target_date,
        scenario.targetDate,
        "The immutable Blueprint must preserve the selected target-date assumption.",
      );
      assert.doesNotMatch(
        JSON.stringify(serviceResult.canonicalPlan.goal),
        /authored_horizon|assumptions/,
        "AI-authored endpoint dates must remain date truth without generic plan-level narrative.",
      );
    }
  }
}

function assertDeterministicC0Opening(input: {
  startDate: string;
  canonicalPlan: TrainingPlanV2;
  expectedFirstFourteenContacts: number;
}) {
  const authoredDays = input.canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest")
    .sort((left, right) => left.date.localeCompare(right.date));
  const firstFourteenDays = authoredDays.filter(
    (day) => day.date <= addDaysIso(input.startDate, 13),
  );
  assert.equal(firstFourteenDays.length, input.expectedFirstFourteenContacts);
  assert.doesNotMatch(
    JSON.stringify(firstFourteenDays),
    /"pace":"[^"]+"|"speed":"[^"]+"/,
    "Deterministic C0 contacts must not invent pace or speed targets.",
  );
  const firstLongRun = authoredDays.find((day) => day.workout_identity === "long_aerobic_run");
  assert.ok(firstLongRun, "Deterministic C0 must include its policy-authored first-week long run.");
  assert.ok(
    firstLongRun!.date <= addDaysIso(input.startDate, 6),
    "Deterministic C0 must place the policy-authored long run in week one.",
  );
}

function assertPlanFirstCanonicalResult(plan: TrainingPlanV2, label: string) {
  assert.equal(plan.schema_version, "training-plan-v2");
  assert.equal(plan.source_kind, AI_AUTHORED_PLAN_FIRST_SOURCE_KIND);
  assert.equal(plan.source_status, "ai_authored");
  assert.equal(plan.goal.goal_type, "distance_goal");
  assert.equal(plan.goal.distance_meters, 21_100);
  assert.ok(plan.planned_workouts.length > 0, `${label} must include calendar rows.`);
}
