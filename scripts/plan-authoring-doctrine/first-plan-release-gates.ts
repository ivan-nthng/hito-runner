import assert from "node:assert/strict";
import { buildReviewedFirstPlanImportedSeed } from "../../src/lib/active-plan-persistence";
import { generateAiFirstPlanDraftPreview } from "../../src/lib/ai-first-plan-draft-service";
import { buildAiGeneratedRunningPlanAuthoringInput } from "../../src/lib/ai-generated-running-plan";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
} from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { AI_AUTHORED_PLAN_FIRST_SOURCE_KIND } from "../../src/lib/ai-authored-plan-first-compiler";
import {
  buildAiAuthoredFirstSessionAdaptationContext,
  buildAiAuthoredPlanFirstPrompt,
  type AiAuthoredPlanFirstProviderDraft,
} from "../../src/lib/ai-authored-plan-first-provider-contract";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";
import { addDaysIso, diffDaysIso } from "../../src/lib/training";

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
  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput,
    today: authoringInput.schedule.startDate,
  });

  const serviceResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
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
    apiKey: "invalid-plan-first-release-gate",
    model: "invalid-plan-first-release-gate",
    today: authoringInput.schedule.startDate,
    fetchImpl: async () =>
      openAiPlanFirstResponse("invalid-plan-first-release-gate", {
        workouts: [],
        endpoint: null,
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

async function assertFirstSessionAdaptationContracts() {
  for (const scenario of [
    {
      name: "new_to_running",
      expectedLevel: "new_to_running",
      runnerLevel: "beginner_new_runner" as const,
      targetDate: "2026-07-12",
      startDate: "2026-07-06",
      fixedRestDays: ["Tuesday", "Saturday"] as const,
      benchmark: { kind: "unknown" } as const,
    },
    {
      name: "beginner",
      expectedLevel: "beginner",
      runnerLevel: "sometimes_runs" as const,
      targetDate: null,
      startDate: "2026-07-06",
      fixedRestDays: ["Tuesday", "Saturday"] as const,
      benchmark: { kind: "unknown" } as const,
    },
    {
      name: "beginner_with_benchmark_and_awkward_availability",
      expectedLevel: "beginner",
      runnerLevel: "sometimes_runs" as const,
      targetDate: null,
      startDate: "2026-07-08",
      fixedRestDays: ["Tuesday", "Thursday", "Saturday", "Sunday"] as const,
      benchmark: { kind: "recent_5k_time", recent5kTime: "30:00" } as const,
    },
  ]) {
    const normalized = buildAiGeneratedRunningPlanAuthoringInput({
      age: 34,
      weightKg: 72,
      heightCm: 178,
      runnerLevel: scenario.runnerLevel,
      daysPerWeek: 3,
      fixedRestDays: [...scenario.fixedRestDays],
      preferredLongRunDay: "Sunday",
      startDate: scenario.startDate,
      benchmark: scenario.benchmark,
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        ...(scenario.targetDate ? { targetDate: scenario.targetDate } : {}),
      },
    });
    assert.equal(normalized.ok, true, normalized.ok ? "" : normalized.message);
    if (!normalized.ok) throw new Error(normalized.message);

    const adaptationContext = buildAiAuthoredFirstSessionAdaptationContext(
      normalized.authoringInput,
    );
    assert.equal(adaptationContext.selectedFitnessLevel, scenario.expectedLevel);
    assert.equal(adaptationContext.adaptation.required, true);

    const prompt = buildAiAuthoredPlanFirstPrompt({
      authoringInput: normalized.authoringInput,
      today: normalized.authoringInput.schedule.startDate,
    });
    assert.match(prompt.systemPrompt, /at least four adaptation contacts/i);
    assert.match(prompt.systemPrompt, /first true Long Run no earlier than calendar day 15/i);
    assert.match(prompt.systemPrompt, /gradual bridge/i);
    assert.match(prompt.systemPrompt, /extend the authored horizon/i);

    const providerDraft = await readFixtureDraft(normalized.authoringInput);
    const serviceResult = await generateAiFirstPlanDraftPreview({
      input: normalized.authoringInput,
      today: normalized.authoringInput.schedule.startDate,
      apiKey: `${scenario.name}-adaptation-proof`,
      model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
      fetchImpl: buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
        authoringInput: normalized.authoringInput,
        today: normalized.authoringInput.schedule.startDate,
      }),
      timeoutMs: 1_000,
      maxOutputTokens: 12_000,
    });
    assert.equal(serviceResult.ok, true, serviceResult.ok ? "" : serviceResult.message);
    if (!serviceResult.ok) throw new Error(serviceResult.message);

    assertAdaptationOpening({
      startDate: normalized.authoringInput.schedule.startDate,
      providerDraft,
      canonicalPlan: serviceResult.canonicalPlan,
    });
    assert.equal(serviceResult.metadata.status, "ai_authored");
    assert.equal(serviceResult.metadata.source, "openai_ai_authored_full_plan_draft");
    if (scenario.targetDate) {
      assert.ok(
        (serviceResult.canonicalPlan.target_date ?? "") > scenario.targetDate,
        "AI-authored adaptation bridge must be able to extend beyond a compressed requested date.",
      );
      assert.equal(
        serviceResult.canonicalPlan.target_date,
        providerDraft.endpoint.date,
        "Compiler must preserve the AI-authored extended endpoint date.",
      );
      assert.doesNotMatch(
        JSON.stringify(serviceResult.canonicalPlan.goal),
        /authored_horizon|assumptions/,
        "AI-authored endpoint dates must remain date truth without generic plan-level narrative.",
      );
    }
  }

  for (const scenario of [
    {
      expectedLevel: "running_regularly",
      runnerLevel: "runs_a_lot" as const,
    },
    {
      expectedLevel: "performance_focused",
      runnerLevel: "professional_competitive" as const,
    },
  ]) {
    const normalized = buildAiGeneratedRunningPlanAuthoringInput({
      age: 34,
      weightKg: 72,
      heightCm: 178,
      runnerLevel: scenario.runnerLevel,
      daysPerWeek: 5,
      fixedRestDays: ["Wednesday", "Saturday"],
      preferredLongRunDay: "Sunday",
      startDate: "2026-07-06",
      benchmark: { kind: "unknown" },
      planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
    });
    assert.equal(normalized.ok, true, normalized.ok ? "" : normalized.message);
    if (!normalized.ok) throw new Error(normalized.message);

    const context = buildAiAuthoredFirstSessionAdaptationContext(normalized.authoringInput);
    assert.equal(context.selectedFitnessLevel, scenario.expectedLevel);
    assert.equal(context.adaptation.required, false);
    const prompt = buildAiAuthoredPlanFirstPrompt({
      authoringInput: normalized.authoringInput,
      today: normalized.authoringInput.schedule.startDate,
    });
    assert.doesNotMatch(
      prompt.systemPrompt,
      /adaptation bridge|adaptation contacts|Long Run no earlier/i,
      `${scenario.expectedLevel} provider instructions must not impose beginner adaptation.`,
    );
    assert.match(prompt.systemPrompt, /Author directly from the supplied runner facts/i);
    const providerDraft = await readFixtureDraft(normalized.authoringInput);
    const firstFourteenTypes = providerDraft.workouts
      .filter((day) => day.date <= addDaysIso(normalized.authoringInput.schedule.startDate, 13))
      .map((day) => day.title);
    assert.ok(
      firstFourteenTypes.includes("Tempo") && firstFourteenTypes.includes("Long Run"),
      `${scenario.expectedLevel} must remain directly AI-authored without a beginner downgrade.`,
    );
  }
}

function assertAdaptationOpening(input: {
  startDate: string;
  providerDraft: AiAuthoredPlanFirstProviderDraft;
  canonicalPlan: TrainingPlanV2;
}) {
  const authoredDays = input.providerDraft.workouts.sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const firstFourteenDays = authoredDays.filter(
    (day) => day.date <= addDaysIso(input.startDate, 13),
  );
  assert.equal(firstFourteenDays.length, 4);
  assert.ok(
    firstFourteenDays.every((day) => ["Run/Walk", "Easy", "Recovery"].includes(day.title)),
    "The first 14 days must contain only runner-facing adaptation identities.",
  );
  assert.doesNotMatch(
    JSON.stringify(firstFourteenDays),
    /"pace":"[^"]+"|"hr_zone":"[^"]+"/,
    "Adaptation contacts must not invent pace or personal HR targets.",
  );
  for (let index = 1; index < firstFourteenDays.length; index += 1) {
    assert.ok(
      diffDaysIso(firstFourteenDays[index]!.date, firstFourteenDays[index - 1]!.date) >= 2,
      "Adaptation contacts must retain at least one recovery/rest day between them.",
    );
  }

  const firstLongRun = authoredDays.find((day) => day.workout_identity === "long_aerobic_run");
  assert.ok(firstLongRun, "AI-authored adaptation bridge must include a later true long run.");
  assert.ok(
    diffDaysIso(firstLongRun!.date, input.startDate) >= 14,
    "The first true long run must not appear before calendar day 15.",
  );
  const compiledRunWalk = input.canonicalPlan.planned_workouts.find(
    (workout) => workout.title === "Run/Walk",
  );
  assert.equal(compiledRunWalk?.workout_identity, "recovery_jog");
  assert.equal(compiledRunWalk?.workout_family, "recovery");

  const providerRows = [...authoredDays, input.providerDraft.endpoint]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((day) => ({ date: day.date, title: day.title }));
  const compiledRows = input.canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest")
    .map((workout) => ({ date: workout.date, title: workout.title }));
  assert.deepEqual(
    compiledRows,
    providerRows,
    "Compiler must preserve every AI/local-fixture-authored workout without substitution.",
  );
}

async function readFixtureDraft(
  authoringInput: Parameters<
    typeof buildAiGeneratedRunningPlanDevFixtureOpenAiFetch
  >[0]["authoringInput"],
) {
  const response = await buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput,
    today: authoringInput.schedule.startDate,
  })("https://api.openai.com/v1/responses", {});
  const body = (await response.json()) as { output_text: string };
  return JSON.parse(body.output_text) as AiAuthoredPlanFirstProviderDraft;
}

function assertPlanFirstCanonicalResult(plan: TrainingPlanV2, label: string) {
  assert.equal(plan.schema_version, "training-plan-v2");
  assert.equal(plan.source_kind, AI_AUTHORED_PLAN_FIRST_SOURCE_KIND);
  assert.equal(plan.source_status, "ai_authored");
  assert.equal(plan.goal.goal_type, "distance_goal");
  assert.equal(plan.goal.distance_meters, 21_100);
  assert.ok(plan.planned_workouts.length > 0, `${label} must include calendar rows.`);
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
