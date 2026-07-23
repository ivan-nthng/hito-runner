import assert from "node:assert/strict";
import { compileAiAuthoredPlanFirstDraft } from "../src/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_HR_ZONE_REFERENCE_VALUES,
  AI_AUTHORED_PLAN_FIRST_PRIMARY_EXECUTION_MODE_VALUES,
  AI_AUTHORED_PLAN_FIRST_REPEAT_SECTION_TYPE_VALUES,
  AI_AUTHORED_PLAN_FIRST_UNIT_SECTION_TYPE_VALUES,
  AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES,
  aiAuthoredPlanFirstProviderDraftSchema,
  buildAiAuthoredPlanFirstPrompt,
  type AiAuthoredPlanFirstProviderDraft,
  type AiAuthoredPlanFirstProviderUnit,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import {
  buildAiGeneratedRunningPlanAuthoringInput as buildAiGeneratedRunningPlanAuthoringInputRuntime,
  type AiGeneratedRunningPlanPreviewInput,
} from "../src/lib/ai-generated-running-plan";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type TrainingPlanV2,
} from "../src/lib/imported-plan";
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
} from "../src/lib/plan-export";
import { buildPersistedWorkoutInsertRows } from "../src/lib/persisted-plan-replacement";
import {
  buildReviewedAiGeneratedRunningPlanPreview as buildReviewedAiGeneratedRunningPlanPreviewRuntime,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import { PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES } from "../src/lib/planned-workout-block-contract";
import type { Database } from "../src/lib/supabase/database";
import { addDaysIso, weekdayLong } from "../src/lib/training";
import {
  buildProofPersonalRunnerProfileSnapshot,
  buildProofRunnerProfileSnapshot,
} from "./runner-profile-snapshot-proof-helpers";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];

type Scenario = {
  name: string;
  distance: RunningPlanPreviewActionInput["planGoalIntent"]["distance"];
  weeks: number;
};

const scenarios: Scenario[] = [
  { name: "10K", distance: { kind: "preset", preset: "10K" }, weeks: 4 },
  {
    name: "Half Marathon",
    distance: { kind: "preset", preset: "Half Marathon" },
    weeks: 8,
  },
  { name: "Marathon", distance: { kind: "preset", preset: "Marathon" }, weeks: 12 },
  {
    name: "Custom 15K",
    distance: { kind: "custom", distanceKm: 15, label: "15K" },
    weeks: 10,
  },
];

function buildAiGeneratedRunningPlanAuthoringInput(
  input: RunningPlanPreviewActionInput,
  profileSnapshot = buildProofRunnerProfileSnapshot(input),
) {
  return buildAiGeneratedRunningPlanAuthoringInputRuntime(input, profileSnapshot);
}

function buildReviewedAiGeneratedRunningPlanPreview(
  input: RunningPlanPreviewActionInput,
  options: Parameters<typeof buildReviewedAiGeneratedRunningPlanPreviewRuntime>[1] = {},
) {
  return buildReviewedAiGeneratedRunningPlanPreviewRuntime(input, {
    ...options,
    runnerProfileSnapshot: options.runnerProfileSnapshot ?? buildProofRunnerProfileSnapshot(input),
  });
}

export async function validatePlanFirstProviderRepresentationContract() {
  for (const scenario of scenarios) {
    await assertReviewableScenario(scenario);
  }

  const capacityInput = buildScenarioInput({
    name: "36-week capacity",
    distance: { kind: "preset", preset: "Marathon" },
    weeks: 36,
  });
  const capacityDraft = buildProviderDraft(capacityInput, 36);
  const serializedCapacityDraft = JSON.stringify(capacityDraft);
  const conservativeTokenEstimate = Math.ceil(serializedCapacityDraft.length / 3);
  assert.ok(
    conservativeTokenEstimate < 32_000,
    `36-week provider draft must fit 32k output tokens; estimated ${conservativeTokenEstimate}.`,
  );
  await assertReviewableDraft(capacityInput, capacityDraft, "36-week capacity");

  assertClosedProviderSchema(capacityInput, capacityDraft);
  assertAvailabilityContract(capacityInput, capacityDraft);
  assertProviderEnumClosure(capacityInput, capacityDraft);
  assertRunnerFacingHeartRateReferenceResolution(capacityInput, capacityDraft);
  await assertTransportFailures(capacityInput, capacityDraft);

  return {
    capacityWeeks: 36,
    capacityWorkoutCount: capacityDraft.workouts.length + 1,
    capacityCharacters: serializedCapacityDraft.length,
    conservativeTokenEstimate,
    configuredOutputTokenLimit: 32_000,
  };
}

function assertRunnerFacingHeartRateReferenceResolution(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstProviderDraft,
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const draft = structuredClone(validDraft);
  const workout = draft.workouts[0];
  const section = workout?.sections[0];
  assert.ok(workout && section?.kind === "unit");

  workout.cue = "Keep Z2 controlled.";
  section.cue = "Stay smooth in Z2.";
  const z2Command = heartRateCommand(resolved.authoringInput, "Z2");
  section.target = {
    primary_execution_mode: "heart_rate",
    command: z2Command,
  };

  assert.equal(aiAuthoredPlanFirstProviderDraftSchema.safeParse(draft).success, true);
  const compiled = compileAiAuthoredPlanFirstDraft({
    draft,
    authoringInput: resolved.authoringInput,
  });
  assert.equal(compiled.ok, true, compiled.ok ? "" : JSON.stringify(compiled));
  if (!compiled.ok) return;

  const compiledWorkout = compiled.canonicalPlan.planned_workouts.find(
    (candidate) => candidate.date === workout.date,
  );
  assert.ok(compiledWorkout);
  assert.doesNotMatch(compiledWorkout.summary, /\bZ[1-5](?:-Z[1-5])?\b/);
  assert.match(compiledWorkout.summary, /\b\d{2,3}-\d{2,3} bpm\b/);
  assert.doesNotMatch(compiledWorkout.segments[0]?.guidance ?? "", /\bZ[1-5](?:-Z[1-5])?\b/);
  assert.match(compiledWorkout.segments[0]?.guidance ?? "", /\b\d{2,3}-\d{2,3} bpm\b/);
  assert.equal(compiledWorkout.segments[0]?.target?.extra?.hr_zone, "Z2");
}

function assertProviderEnumClosure(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstProviderDraft,
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const assertCompiles = (draft: AiAuthoredPlanFirstProviderDraft, value: string) => {
    assert.equal(
      aiAuthoredPlanFirstProviderDraftSchema.safeParse(draft).success,
      true,
      `${value} must be provider-valid.`,
    );
    const compiled = compileAiAuthoredPlanFirstDraft({
      draft,
      authoringInput: resolved.authoringInput,
    });
    assert.equal(compiled.ok, true, compiled.ok ? "" : `${value}: ${JSON.stringify(compiled)}`);
  };

  for (const identity of AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES) {
    const draft = structuredClone(validDraft);
    draft.workouts[0]!.workout_identity = identity;
    assertCompiles(draft, identity);
  }

  for (const segmentType of AI_AUTHORED_PLAN_FIRST_UNIT_SECTION_TYPE_VALUES) {
    const draft = structuredClone(validDraft);
    const unit = findUnitSection(draft);
    unit.segment_type = segmentType;
    assertCompiles(draft, `unit:${segmentType}`);
  }

  for (const segmentType of AI_AUTHORED_PLAN_FIRST_REPEAT_SECTION_TYPE_VALUES) {
    const draft = structuredClone(validDraft);
    const repeat = findTypedRepeatSection(draft);
    repeat.segment_type = segmentType;
    assertCompiles(draft, `repeat:${segmentType}`);
  }

  for (const role of PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES) {
    const draft = structuredClone(validDraft);
    findTypedRepeatSection(draft).children[0]!.role = role;
    assertCompiles(draft, `repeat-child:${role}`);
  }

  for (const hrReference of AI_AUTHORED_PLAN_FIRST_HR_ZONE_REFERENCE_VALUES) {
    const draft = structuredClone(validDraft);
    findTypedHeartRateTarget(draft).command = heartRateCommand(
      resolved.authoringInput,
      hrReference,
    );
    assertCompiles(draft, `hr:${hrReference}`);
  }

  assert.deepEqual(
    new Set(
      validDraft.workouts
        .flatMap((workout) => workout.sections)
        .flatMap((section) =>
          section.kind === "unit"
            ? [section.target]
            : section.kind === "repeat"
              ? section.children.map((child) => child.target)
              : [],
        )
        .map((target) => target.primary_execution_mode),
    ),
    new Set(AI_AUTHORED_PLAN_FIRST_PRIMARY_EXECUTION_MODE_VALUES),
  );
}

async function assertReviewableScenario(scenario: Scenario) {
  const input = buildScenarioInput(scenario);
  const draft = buildProviderDraft(input, scenario.weeks);
  await assertReviewableDraft(input, draft, scenario.name);
}

async function assertReviewableDraft(
  input: RunningPlanPreviewActionInput,
  draft: AiAuthoredPlanFirstProviderDraft,
  scenarioName: string,
) {
  assert.equal(aiAuthoredPlanFirstProviderDraftSchema.safeParse(draft).success, true);
  const reviewed = await buildReviewedAiGeneratedRunningPlanPreview(input, {
    runnerProfileSnapshot: buildProofPersonalRunnerProfileSnapshot(input),
    aiPreview: {
      apiKey: `closed-provider-contract-${scenarioName}`,
      model: "closed-provider-contract-proof",
      generationLedger: { disabled: true },
      fetchImpl: providerResponse(`resp_${slugify(scenarioName)}`, draft),
    },
  });

  assert.equal(
    reviewed.ok,
    true,
    reviewed.ok ? "" : `${scenarioName}: ${JSON.stringify(reviewed.unavailable)}`,
  );
  if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);

  assert.match(reviewed.draft.reviewToken, /^running-plan-review-v1\./);
  assert.match(reviewed.draft.reviewChecksum, /^[a-f0-9]{64}$/);
  assert.equal(reviewed.draft.reviewSafety.persisted, false);
  assert.equal(reviewed.draft.reviewSafety.confirmCallsOpenAi, false);
  assert.equal("previewWarnings" in reviewed.draft, false);
  assert.doesNotMatch(
    JSON.stringify(reviewed.draft.canonicalPlan.goal),
    /authored_outcome_target|authored_horizon|assumptions|warnings/,
  );
  assert.doesNotMatch(
    JSON.stringify(reviewed.draft.aiGeneration),
    /reviewAssumptions|metricPolicySummary/,
  );
  assert.equal(reviewed.draft.canonicalPlan.target_date, draft.endpoint.date);
  assert.deepEqual(
    reviewed.draft.workoutDocuments,
    buildImportedPlanSeed(reviewed.draft.canonicalPlan).workouts,
  );

  assertProviderFieldParity(draft, reviewed.draft.canonicalPlan);
  assertSinglePrimaryExecutionCommand(reviewed.draft.canonicalPlan, scenarioName);
  const reimported = exportAndReimportCanonicalPlan(reviewed.draft.canonicalPlan);
  assertProviderFieldParity(draft, reimported);
  assert.deepEqual(
    buildImportedPlanSeed(reimported).workouts,
    reviewed.draft.workoutDocuments,
    `${scenarioName} active-plan export and re-import must preserve WorkoutDocument truth.`,
  );
}

function assertClosedProviderSchema(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstProviderDraft,
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const prompt = buildAiAuthoredPlanFirstPrompt({
    authoringInput: resolved.authoringInput,
    today: input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const schemaText = JSON.stringify(prompt.responseSchema);
  assert.doesNotMatch(schemaText, /warnings|assumptions|metadata|week_number|weeks/);
  assert.match(schemaText, /primary_execution_mode/);
  assert.match(schemaText, /"const":"pace"/);
  assert.match(schemaText, /"const":"heart_rate"/);
  assert.match(prompt.systemPrompt, /one leaf never has both pace and BPM/);
  assert.match(prompt.systemPrompt, /benchmark improves precision but is not required/i);
  assert.match(prompt.systemPrompt, /one exact numeric BPM range/i);
  assert.match(prompt.systemPrompt, /kind=hydration/i);
  assert.doesNotMatch(prompt.systemPrompt, /primary_execution_mode=effort|run_walk/i);
  assert.doesNotMatch(
    prompt.userPrompt,
    /goalType|distance_build|"label":"(?:10K|Half Marathon|Marathon|15K)"/,
  );
  assert.match(prompt.userPrompt, /"distance_meters":42195|"distance_meters":10000/);

  const estimatedResolved = buildAiGeneratedRunningPlanAuthoringInput(input);
  assert.equal(estimatedResolved.ok, true, estimatedResolved.ok ? "" : estimatedResolved.message);
  if (!estimatedResolved.ok) throw new Error(estimatedResolved.message);
  const estimatedPrompt = buildAiAuthoredPlanFirstPrompt({
    authoringInput: estimatedResolved.authoringInput,
    today: input.startDate ?? estimatedResolved.authoringInput.schedule.startDate,
  });
  const estimatedSchemaText = JSON.stringify(estimatedPrompt.responseSchema);
  assert.match(
    estimatedSchemaText,
    /"const":"heart_rate"/,
    "An explicitly accepted estimated profile must remain provider-authorable as a primary command.",
  );
  assert.match(estimatedPrompt.systemPrompt, /source remains estimated or personal/i);

  const noPaceTruthInput = {
    ...input,
    benchmark: { kind: "unknown" as const },
    planGoalIntent: {
      ...input.planGoalIntent,
      targetFinishTime: "1:45:00",
    },
  };
  const noPaceTruth = buildAiGeneratedRunningPlanAuthoringInput(noPaceTruthInput);
  assert.equal(noPaceTruth.ok, true, noPaceTruth.ok ? "" : noPaceTruth.message);
  if (!noPaceTruth.ok) throw new Error(noPaceTruth.message);
  const noPacePrompt = buildAiAuthoredPlanFirstPrompt({
    authoringInput: noPaceTruth.authoringInput,
    today: noPaceTruthInput.startDate ?? noPaceTruth.authoringInput.schedule.startDate,
  });
  const noPaceSchema = JSON.stringify(noPacePrompt.responseSchema);
  assert.match(noPaceSchema, /"const":"pace"/);
  assert.match(noPacePrompt.systemPrompt, /goal_informed_ai_estimate/);
  assert.match(noPaceSchema, /"const":"heart_rate"/);
  const goalInformedDraft = structuredClone(validDraft);
  rewriteHeartRateTargets(goalInformedDraft, {
    primary_execution_mode: "pace",
    command: "6:20-6:50/km",
  });
  const goalInformedCompiled = compileAiAuthoredPlanFirstDraft({
    draft: goalInformedDraft,
    authoringInput: noPaceTruth.authoringInput,
  });
  assert.equal(
    goalInformedCompiled.ok,
    true,
    goalInformedCompiled.ok ? "" : JSON.stringify(goalInformedCompiled.issues),
  );
  if (goalInformedCompiled.ok) {
    assert.equal(
      firstCompiledTarget(goalInformedCompiled.canonicalPlan, "pace")?.extra?.pace_provenance,
      "goal_informed_ai_estimate",
    );
  }

  const noBenchmarkInput = {
    ...noPaceTruthInput,
    planGoalIntent: {
      ...noPaceTruthInput.planGoalIntent,
      targetFinishTime: null,
    },
  };
  const noBenchmark = buildAiGeneratedRunningPlanAuthoringInput(noBenchmarkInput);
  assert.equal(noBenchmark.ok, true, noBenchmark.ok ? "" : noBenchmark.message);
  if (!noBenchmark.ok) throw new Error(noBenchmark.message);
  const noBenchmarkDraft = structuredClone(validDraft);
  rewriteHeartRateTargets(noBenchmarkDraft, {
    primary_execution_mode: "pace",
    command: "6:20-6:50/km",
  });
  const noBenchmarkCompiled = compileAiAuthoredPlanFirstDraft({
    draft: noBenchmarkDraft,
    authoringInput: noBenchmark.authoringInput,
  });
  assert.equal(
    noBenchmarkCompiled.ok,
    true,
    noBenchmarkCompiled.ok ? "" : JSON.stringify(noBenchmarkCompiled.issues),
  );
  if (noBenchmarkCompiled.ok) {
    assert.equal(
      firstCompiledTarget(noBenchmarkCompiled.canonicalPlan, "pace")?.extra?.pace_provenance,
      "no_benchmark_ai_estimate",
    );
  }

  const estimatedHeartRateDraft = structuredClone(validDraft);
  rewriteHeartRateTargets(estimatedHeartRateDraft, {
    primary_execution_mode: "heart_rate",
    command: heartRateCommand(estimatedResolved.authoringInput, "Z2"),
  });
  const estimatedHeartRateCompiled = compileAiAuthoredPlanFirstDraft({
    draft: estimatedHeartRateDraft,
    authoringInput: estimatedResolved.authoringInput,
  });
  assert.equal(
    estimatedHeartRateCompiled.ok,
    true,
    estimatedHeartRateCompiled.ok ? "" : JSON.stringify(estimatedHeartRateCompiled.issues),
  );
  if (estimatedHeartRateCompiled.ok) {
    assert.equal(
      firstCompiledTarget(estimatedHeartRateCompiled.canonicalPlan, "heart_rate")?.hr_target_source,
      "default_estimated_hr",
    );
  }

  const cases: Array<{
    name: string;
    mutate: (draft: Record<string, unknown>) => void;
    expectedIssue: RegExp;
  }> = [
    {
      name: "unknown identity",
      mutate: (draft) => {
        const workouts = draft.workouts as Array<Record<string, unknown>>;
        workouts[0]!.workout_identity = "provider_invented_identity";
      },
      expectedIssue: /workout_identity_invalid/,
    },
    {
      name: "rest identity in non-rest workouts",
      mutate: (draft) => {
        const workouts = draft.workouts as Array<Record<string, unknown>>;
        workouts[0]!.workout_identity = "rest_and_recovery";
      },
      expectedIssue: /workout_identity_invalid/,
    },
    {
      name: "Repeat parent executable truth",
      mutate: (draft) => {
        const repeat = findRepeatSection(draft);
        repeat.target = {
          primary_execution_mode: "pace",
          command: "4:30/km",
        };
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "competing pace and HR commands",
      mutate: (draft) => {
        const target = findTarget(draft);
        target.primary_execution_mode = "pace";
        target.hr_zone = "Z3";
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "missing primary execution mode",
      mutate: (draft) => {
        delete findTarget(draft).primary_execution_mode;
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "generic narrative medical field",
      mutate: (draft) => {
        draft.metadata = { note: "medical advice" };
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "conflicting goal presentation",
      mutate: (draft) => {
        draft.goal = { label: "Marathon", distance_meters: 21_100 };
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "non-profile BPM range",
      mutate: (draft) => {
        findTypedHeartRateTarget(draft).command = "1-300 bpm";
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "prose-only effort primary command",
      mutate: (draft) => {
        const target = findTarget(draft);
        target.primary_execution_mode = "effort";
        target.command = "Fast but controlled";
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "targeted Hydration",
      mutate: (draft) => {
        findHydrationSection(draft).target = {
          primary_execution_mode: "pace",
          command: "6:30/km",
        };
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "timed Hydration",
      mutate: (draft) => {
        findHydrationSection(draft).prescription = { mode: "time", duration_min: 1 };
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "Hydration dosing narrative",
      mutate: (draft) => {
        findHydrationSection(draft).cue = "Drink 500 ml every 20 minutes.";
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "nested Hydration",
      mutate: (draft) => {
        const repeat = findRepeatSection(draft);
        const children = repeat.children as Array<Record<string, unknown>>;
        children[0] = { kind: "hydration", label: "Hydration", cue: "Take water." };
      },
      expectedIssue: /ai_authored_plan_first_repeat_structure_invalid/,
    },
    {
      name: "whitespace-only display truth",
      mutate: (draft) => {
        const workouts = draft.workouts as Array<Record<string, unknown>>;
        workouts[0]!.title = " ";
      },
      expectedIssue: /provider_schema_invalid/,
    },
    {
      name: "display truth requiring trimming",
      mutate: (draft) => {
        const workouts = draft.workouts as Array<Record<string, unknown>>;
        workouts[0]!.cue = " runner cue ";
      },
      expectedIssue: /provider_schema_invalid/,
    },
  ];

  for (const scenario of cases) {
    const draft = structuredClone(validDraft) as unknown as Record<string, unknown>;
    scenario.mutate(draft);
    const result = compileAiAuthoredPlanFirstDraft({
      draft,
      authoringInput: resolved.authoringInput,
    });
    assert.equal(result.ok, false, `${scenario.name} must be outside the provider-valid grammar.`);
    if (result.ok) throw new Error(`${scenario.name} unexpectedly compiled.`);
    assert.match(JSON.stringify(result.issues), scenario.expectedIssue);
  }

  const hydrationOnly = structuredClone(validDraft);
  const hydrationWorkout = hydrationOnly.workouts.find((workout) =>
    workout.sections.some((section) => section.kind === "hydration"),
  );
  assert.ok(hydrationWorkout);
  if (hydrationWorkout) {
    hydrationWorkout.sections = [{ kind: "hydration", label: "Hydration", cue: "Take water." }];
  }
  assert.equal(aiAuthoredPlanFirstProviderDraftSchema.safeParse(hydrationOnly).success, true);
  const hydrationOnlyResult = compileAiAuthoredPlanFirstDraft({
    draft: hydrationOnly,
    authoringInput: resolved.authoringInput,
  });
  assert.equal(hydrationOnlyResult.ok, false);
  if (!hydrationOnlyResult.ok) {
    assert.match(
      JSON.stringify(hydrationOnlyResult.issues),
      /ai_authored_plan_first_hydration_without_runnable_step/,
    );
  }
}

function assertAvailabilityContract(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstProviderDraft,
) {
  const underCeiling = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(underCeiling.ok, true, underCeiling.ok ? "" : underCeiling.message);
  if (!underCeiling.ok) return;
  const underCeilingDraft = structuredClone(validDraft);
  underCeilingDraft.workouts = underCeilingDraft.workouts.filter(
    (workout) =>
      workout.date === validDraft.workouts.at(-1)?.date || weekdayLong(workout.date) !== "Monday",
  );
  const compiledUnderCeiling = compileAiAuthoredPlanFirstDraft({
    draft: underCeilingDraft,
    authoringInput: underCeiling.authoringInput,
  });
  assert.equal(
    compiledUnderCeiling.ok,
    true,
    compiledUnderCeiling.ok ? "" : JSON.stringify(compiledUnderCeiling),
  );
  if (compiledUnderCeiling.ok) {
    const authoredPeak = Math.max(
      ...Array.from(
        compiledUnderCeiling.canonicalPlan.planned_workouts
          .filter((workout) => workout.workout_type !== "rest")
          .reduce((counts, workout) => {
            counts.set(workout.week_number, (counts.get(workout.week_number) ?? 0) + 1);
            return counts;
          }, new Map<number, number>())
          .values(),
      ),
    );
    assert.equal(
      authoredPeak,
      4,
      "AI-selected density may remain below the runner's availability ceiling.",
    );
    assert.equal(
      compiledUnderCeiling.canonicalPlan.plan_preferences?.max_running_days_per_week,
      input.daysPerWeek,
    );
    assert.equal(
      compiledUnderCeiling.canonicalPlan.plan_preferences?.preferred_running_days,
      undefined,
      "AI-selected weekdays must not become runner availability preferences.",
    );
  }

  const overCeilingInput = { ...input, daysPerWeek: 4 as const };
  const overCeiling = buildAiGeneratedRunningPlanAuthoringInput(
    overCeilingInput,
    buildProofPersonalRunnerProfileSnapshot(overCeilingInput),
  );
  assert.equal(overCeiling.ok, true, overCeiling.ok ? "" : overCeiling.message);
  if (!overCeiling.ok) return;
  const rejected = compileAiAuthoredPlanFirstDraft({
    draft: validDraft,
    authoringInput: overCeiling.authoringInput,
  });
  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.ok(
      rejected.issues.some(
        (issue) => issue.code === "ai_authored_plan_first_availability_ceiling_exceeded",
      ),
    );
  }

  const fixedRestViolation = structuredClone(validDraft);
  if (fixedRestViolation.workouts[0]) {
    fixedRestViolation.workouts[0].date = addDaysIso(input.startDate ?? "2026-08-03", 1);
  }
  const fixedRestRejected = compileAiAuthoredPlanFirstDraft({
    draft: fixedRestViolation,
    authoringInput: underCeiling.authoringInput,
  });
  assert.equal(fixedRestRejected.ok, false);
  if (!fixedRestRejected.ok) {
    assert.ok(
      fixedRestRejected.issues.some(
        (issue) => issue.code === "ai_authored_plan_first_fixed_rest_day_violation",
      ),
    );
  }

  const availabilityStates = [
    {
      name: "both",
      input: { ...input, preferredLongRunDay: null },
      expectedFixedRestDays: input.fixedRestDays,
      expectedCeiling: input.daysPerWeek,
    },
    {
      name: "ceiling_only",
      input: { ...input, fixedRestDays: null, preferredLongRunDay: null },
      expectedFixedRestDays: null,
      expectedCeiling: input.daysPerWeek,
    },
    {
      name: "fixed_rest_only",
      input: { ...input, daysPerWeek: null, preferredLongRunDay: null },
      expectedFixedRestDays: input.fixedRestDays,
      expectedCeiling: null,
    },
    {
      name: "neither",
      input: { ...input, daysPerWeek: null, fixedRestDays: null, preferredLongRunDay: null },
      expectedFixedRestDays: null,
      expectedCeiling: null,
    },
  ] as const;

  for (const state of availabilityStates) {
    const resolved = buildAiGeneratedRunningPlanAuthoringInput(
      state.input,
      buildProofPersonalRunnerProfileSnapshot(state.input),
    );
    assert.equal(resolved.ok, true, resolved.ok ? "" : `${state.name}: ${resolved.message}`);
    if (!resolved.ok) continue;

    assert.deepEqual(
      resolved.authoringInput.availability.fixedRestDays,
      state.expectedFixedRestDays,
    );
    assert.equal(resolved.authoringInput.availability.maxRunningDaysPerWeek, state.expectedCeiling);

    const prompt = buildAiAuthoredPlanFirstPrompt({
      authoringInput: resolved.authoringInput,
      today: state.input.startDate ?? undefined,
    });
    const providerContext = JSON.parse(prompt.userPrompt) as {
      runnerFacts: {
        calendar: {
          eligible_workout_weekdays: string[] | null;
          fixed_rest_weekdays: string[] | null;
          max_workouts_per_week: number | null;
        };
      };
    };
    assert.deepEqual(
      providerContext.runnerFacts.calendar.fixed_rest_weekdays,
      state.expectedFixedRestDays,
    );
    assert.equal(
      providerContext.runnerFacts.calendar.eligible_workout_weekdays == null,
      state.expectedFixedRestDays == null,
    );
    assert.equal(providerContext.runnerFacts.calendar.max_workouts_per_week, state.expectedCeiling);

    const compiled = compileAiAuthoredPlanFirstDraft({
      draft: validDraft,
      authoringInput: resolved.authoringInput,
    });
    assert.equal(
      compiled.ok,
      true,
      compiled.ok ? "" : `${state.name}: ${JSON.stringify(compiled)}`,
    );
    if (!compiled.ok) continue;

    assert.equal(
      compiled.canonicalPlan.plan_preferences?.max_running_days_per_week,
      state.expectedCeiling ?? undefined,
    );
    assert.deepEqual(
      compiled.canonicalPlan.plan_preferences?.blocked_days,
      state.expectedFixedRestDays ?? undefined,
    );
    assert.equal(compiled.canonicalPlan.plan_preferences?.preferred_running_days, undefined);
    assert.equal(compiled.canonicalPlan.plan_preferences?.preferred_long_run_day, undefined);
    assert.equal(compiled.canonicalPlan.training_constraints?.running_days_per_week, undefined);
    const importedSeed = buildImportedPlanSeed(compiled.canonicalPlan);
    const persistedPreferences = importedSeed.planPreferences as Record<string, unknown> | null;
    assert.equal(
      persistedPreferences?.max_running_days_per_week,
      state.expectedCeiling ?? undefined,
    );
    assert.deepEqual(persistedPreferences?.blocked_days, state.expectedFixedRestDays ?? undefined);
    const exported = exportAndReimportCanonicalPlan(compiled.canonicalPlan);
    assert.equal(
      exported.plan_preferences?.max_running_days_per_week,
      state.expectedCeiling ?? undefined,
    );
    assert.deepEqual(
      exported.plan_preferences?.blocked_days,
      state.expectedFixedRestDays ?? undefined,
    );
  }

  const independentConstraintsInput = {
    ...input,
    daysPerWeek: 6 as const,
    fixedRestDays: ["Tuesday", "Saturday"] as const,
    preferredLongRunDay: null,
  };
  const independent = buildAiGeneratedRunningPlanAuthoringInput(
    independentConstraintsInput,
    buildProofPersonalRunnerProfileSnapshot(independentConstraintsInput),
  );
  assert.equal(independent.ok, true, independent.ok ? "" : independent.message);
  if (independent.ok) {
    const compiled = compileAiAuthoredPlanFirstDraft({
      draft: validDraft,
      authoringInput: independent.authoringInput,
    });
    assert.equal(
      compiled.ok,
      true,
      compiled.ok ? "" : "An independent ceiling must not be rejected against fixed-rest capacity.",
    );
  }
}

async function assertTransportFailures(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstProviderDraft,
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const incomplete = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "incomplete-closed-contract-proof",
    model: "closed-contract-proof",
    generationLedger: { disabled: true },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          id: "resp_incomplete_closed_contract",
          status: "incomplete",
          incomplete_details: { reason: "max_output_tokens" },
          output_text: JSON.stringify(validDraft).slice(0, 500),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });
  assert.equal(incomplete.ok, false);
  if (incomplete.ok || incomplete.reason === "structured_input_invalid") {
    throw new Error("Incomplete provider output unexpectedly reached canonical review.");
  }
  assert.equal(incomplete.metadata.unavailableReason, "ai_authored_plan_first_incomplete_output");
  assert.doesNotMatch(JSON.stringify(incomplete), /reviewToken|reviewChecksum|canonicalPlan/);

  const malformed = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "malformed-closed-contract-proof",
    model: "closed-contract-proof",
    generationLedger: { disabled: true },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          id: "resp_malformed_closed_contract",
          status: "completed",
          output_text: '{"workouts":[',
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });
  assert.equal(malformed.ok, false);
  if (malformed.ok || malformed.reason === "structured_input_invalid") {
    throw new Error("Malformed provider output unexpectedly reached canonical review.");
  }
  assert.equal(malformed.metadata.unavailableReason, "ai_first_plan_draft_non_json_output");

  const pathologicalNumber = "0." + "0".repeat(96) + "1";
  const pathologicalOutput = JSON.stringify(validDraft).replace(
    /"duration_min":\d+(?:\.\d+)?/,
    `"duration_min":${pathologicalNumber}`,
  );
  const pathological = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "pathological-number-contract-proof",
    model: "closed-contract-proof",
    generationLedger: { disabled: true },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          id: "resp_pathological_number",
          status: "completed",
          output_text: pathologicalOutput,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });
  assert.equal(pathological.ok, false);
  if (pathological.ok || pathological.reason === "structured_input_invalid") {
    throw new Error("Pathological numeric output unexpectedly reached canonical review.");
  }
  assert.equal(pathological.metadata.unavailableReason, "ai_first_plan_draft_non_json_output");
}

function assertProviderFieldParity(draft: AiAuthoredPlanFirstProviderDraft, plan: TrainingPlanV2) {
  for (const authored of [...draft.workouts, draft.endpoint]) {
    const compiled = plan.planned_workouts.find((workout) => workout.date === authored.date);
    assert.ok(compiled, `Missing compiled workout for ${authored.date}.`);
    if (!compiled) continue;

    assert.equal(compiled.title, authored.title);
    assert.equal(compiled.phase, authored.phase);
    assert.equal(compiled.workout_identity, authored.workout_identity);
    assert.equal(compiled.summary, authored.cue);
    assert.equal(compiled.segments.length, authored.sections.length);

    authored.sections.forEach((section, index) => {
      const compiledSection = compiled.segments[index];
      assert.ok(compiledSection);
      if (!compiledSection) return;
      if (section.kind === "hydration") {
        assert.equal(compiledSection.segment_type, "fueling");
        assert.equal(compiledSection.label, section.label);
        assert.equal(compiledSection.guidance, section.cue);
        assert.equal(compiledSection.prescription?.mode, "none");
        assert.equal(compiledSection.target, undefined);
        return;
      }
      assert.equal(compiledSection.segment_type, section.segment_type);
      assert.equal(compiledSection.label, section.label);
      assert.equal(compiledSection.guidance, section.cue ?? undefined);

      if (section.kind === "unit") {
        assert.deepEqual(compiledSection.prescription, section.prescription);
        assertTargetParity(section.target, compiledSection.target);
        return;
      }

      assert.equal(compiledSection.prescription?.mode, "repeats");
      assert.equal(compiledSection.prescription?.repeat_count, section.rounds);
      assert.equal(compiledSection.target, undefined);
      assert.deepEqual(
        compiledSection.prescription?.children?.map((child) => child.role),
        section.children.map((child) => child.role),
      );
      section.children.forEach((child, childIndex) => {
        const compiledChild = compiledSection.prescription?.children?.[childIndex];
        assert.ok(compiledChild);
        assert.equal(compiledChild?.label, child.label);
        assert.equal(compiledChild?.guidance, child.cue ?? undefined);
        assert.deepEqual(compiledChild?.prescription, child.prescription);
        assertTargetParity(child.target, compiledChild?.target);
      });
    });
  }
}

function exportAndReimportCanonicalPlan(plan: TrainingPlanV2) {
  const seed = buildImportedPlanSeed(plan);
  const userId = "00000000-0000-4000-8000-000000000901";
  const planCycleId = "99999999-9999-4999-8999-000000000901";
  const timestamp = "2026-08-01T00:00:00.000Z";
  const planCycle: PersistedPlanCycleRow = {
    id: planCycleId,
    user_id: userId,
    title: seed.title,
    goal_summary: seed.goalSummary,
    start_date: seed.startDate,
    end_date: seed.endDate,
    target_date: seed.targetDate,
    status: "active",
    source_kind: plan.source_kind ?? "ai_authored_plan_first_v1",
    source_template: "ai_authored_plan_first_v1",
    schema_version: "training-plan-v2",
    goal_metadata: seed.goalMetadata,
    plan_preferences: seed.planPreferences,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const rows: PersistedPlannedWorkoutRow[] = buildPersistedWorkoutInsertRows(
    planCycleId,
    userId,
    seed.workouts,
  ).map((row, index) => ({
    id: `99999999-9999-4999-8999-${String(index + 1).padStart(12, "0")}`,
    created_at: timestamp,
    ...row,
  }));
  const payload = buildActivePlanExportPayload({
    planCycle,
    workouts: rows,
    exportedAt: timestamp,
  });

  return importedPlanSchema.parse(activePlanExportToTrainingPlanV2(payload));
}

function assertTargetParity(
  authored: AiAuthoredPlanFirstProviderUnit["target"],
  compiled: TrainingPlanV2["planned_workouts"][number]["segments"][number]["target"],
) {
  assert.equal(compiled?.primary_execution_mode, authored.primary_execution_mode);
  assert.equal(
    compiled?.pace,
    authored.primary_execution_mode === "pace" ? authored.command : undefined,
  );
  assert.equal(compiled?.intensity, undefined);
  if (authored.primary_execution_mode === "heart_rate") {
    assert.equal(compiled?.hr_bpm_range, authored.command);
    assert.equal(compiled?.hr_target_source, "personal_hr_zone");
  } else {
    assert.equal(
      compiled?.extra?.pace_provenance ??
        (compiled as Record<string, unknown> | undefined)?.pace_provenance,
      "benchmark_backed",
    );
  }
}

function assertSinglePrimaryExecutionCommand(plan: TrainingPlanV2, scenarioName: string) {
  for (const workout of plan.planned_workouts) {
    if (workout.workout_type === "rest") continue;
    for (const segment of workout.segments) {
      const isRepeat = segment.prescription?.mode === "repeats";
      if (isRepeat) {
        assert.equal(
          segment.target,
          undefined,
          `${scenarioName}: Repeat parents must remain structural-only.`,
        );
      }
      const leaves = isRepeat
        ? (segment.prescription?.children ?? [])
        : segment.segment_type === "fueling"
          ? []
          : [segment];

      for (const leaf of leaves) {
        const target = leaf.target;
        assert.ok(target?.primary_execution_mode, `${scenarioName}: runnable leaf needs one mode.`);
        const hasPace = Boolean(target?.pace ?? target?.pace_min_per_km_range);
        const hasHeartRate = Boolean(target?.hr_bpm_range ?? target?.hr_bpm);

        assert.equal(
          hasPace && hasHeartRate,
          false,
          `${scenarioName}: one leaf cannot command pace and heart rate together.`,
        );
        if (target?.primary_execution_mode === "pace") assert.equal(hasPace, true);
        if (target?.primary_execution_mode === "heart_rate") assert.equal(hasHeartRate, true);
        assert.ok(
          target?.primary_execution_mode === "pace" ||
            target?.primary_execution_mode === "heart_rate",
          `${scenarioName}: generated leaves support only numeric pace or BPM commands.`,
        );
      }
    }
  }
}

function buildScenarioInput(scenario: Scenario): RunningPlanPreviewActionInput {
  const startDate = "2026-08-03";
  return {
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel: "runs_a_lot",
    daysPerWeek: 5,
    fixedRestDays: ["Tuesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate,
    benchmark: { kind: "recent_5k_pace", recent5kPace: "5:30/km" },
    planGoalIntent: {
      distance: scenario.distance,
      targetDate: addDaysIso(startDate, scenario.weeks * 7 - 1),
    },
  };
}

function buildProviderDraft(
  input: AiGeneratedRunningPlanPreviewInput,
  weeks: number,
): AiAuthoredPlanFirstProviderDraft {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);
  const distance = resolved.authoringInput.planGoalIntent.distance;
  if (!distance) throw new Error("Distance is required.");
  const startDate = resolved.authoringInput.schedule.startDate;
  const endpointDate = addDaysIso(startDate, weeks * 7 - 1);
  const workouts: AiAuthoredPlanFirstProviderDraft["workouts"] = [];
  const targetContext = {
    z2Command: heartRateCommand(resolved.authoringInput, "Z2"),
  };

  for (let week = 0; week < weeks; week += 1) {
    const offsets = [0, 2, 3, 4, 6];
    for (const [contact, dayOffset] of offsets.entries()) {
      const date = addDaysIso(startDate, week * 7 + dayOffset);
      if (date >= endpointDate) continue;
      workouts.push(buildAuthoredWorkout(date, week, contact, targetContext));
    }
  }

  return {
    workouts,
    endpoint: {
      date: endpointDate,
      phase: "Goal",
      workout_identity: "selected_distance_completion_or_checkpoint",
      title: "Selected-distance endpoint",
      cue: "Execute the authored selected-distance plan.",
      sections: [
        {
          kind: "unit",
          segment_type: "main",
          label: "Selected distance",
          cue: "Complete the selected distance.",
          prescription: { mode: "distance", distance_km: distance.distanceKm },
          target: {
            primary_execution_mode: "pace",
            command: "5:20-5:30/km",
          },
        },
      ],
    },
  };
}

function buildAuthoredWorkout(
  date: string,
  week: number,
  contact: number,
  targetContext: { z2Command: string },
): AiAuthoredPlanFirstProviderDraft["workouts"][number] {
  if (contact === 1) {
    return {
      date,
      phase: `Build ${week + 1}`,
      workout_identity: "distance_intervals",
      title: "Ordered interval session",
      cue: "Keep every repetition controlled.",
      sections: [
        unitSection("warmup", "Warm up", 10, paceTarget("6:45-7:15/km")),
        {
          kind: "repeat",
          segment_type: "interval_block",
          label: "Main set",
          cue: "Keep the sequence exact.",
          rounds: 4,
          children: [
            {
              role: "run",
              label: "Settle",
              cue: "Settle into form.",
              prescription: { mode: "time", duration_min: 1 },
              target: paceTarget("5:45-6:00/km"),
            },
            {
              role: "work",
              label: "Work",
              cue: "Run smoothly.",
              prescription: { mode: "time", duration_min: 3 },
              target: {
                primary_execution_mode: "pace",
                command: "5:00-5:10/km",
              },
            },
            {
              role: "recover",
              label: "Recover",
              cue: "Stay relaxed.",
              prescription: { mode: "time", duration_min: 2 },
              target: paceTarget("6:45-7:15/km"),
            },
          ],
        },
        unitSection("cooldown", "Cool down", 10, paceTarget("7:00-7:30/km")),
      ],
    };
  }

  if (contact === 3) {
    return {
      date,
      phase: `Build ${week + 1}`,
      workout_identity: "long_aerobic_run",
      title: "Long aerobic run",
      cue: "Run the full authored duration.",
      sections: [
        unitSection("main", "Long run", 60 + week, {
          primary_execution_mode: "heart_rate",
          command: targetContext.z2Command,
        }),
        ...(week === 1
          ? ([
              {
                kind: "hydration",
                label: "Hydration",
                cue: "Take water.",
              },
            ] as const)
          : []),
      ],
    };
  }

  return {
    date,
    phase: `Build ${week + 1}`,
    workout_identity: contact === 2 ? "controlled_tempo_session" : "easy_aerobic_run",
    title: contact === 2 ? "Continuous tempo" : "Easy aerobic run",
    cue: contact === 2 ? "Hold one continuous effort." : "Keep this comfortable.",
    sections: [
      unitSection(
        contact === 2 ? "tempo_block" : "main",
        "Main",
        contact === 2 ? 25 : 40,
        contact === 2
          ? paceTarget("5:20-5:30/km")
          : {
              primary_execution_mode: "heart_rate",
              command: targetContext.z2Command,
            },
      ),
    ],
  };
}

function unitSection(
  segmentType: "warmup" | "main" | "cooldown" | "tempo_block",
  label: string,
  durationMin: number,
  target: AiAuthoredPlanFirstProviderUnit["target"],
) {
  return {
    kind: "unit" as const,
    segment_type: segmentType,
    label,
    cue: null,
    prescription: { mode: "time" as const, duration_min: durationMin },
    target,
  };
}

function findRepeatSection(draft: Record<string, unknown>) {
  const workouts = draft.workouts as Array<{ sections: Array<Record<string, unknown>> }>;
  const repeat = workouts
    .flatMap((workout) => workout.sections)
    .find((section) => section.kind === "repeat");
  assert.ok(repeat, "Proof draft must contain a Repeat.");
  return repeat!;
}

function findHydrationSection(draft: Record<string, unknown>) {
  const workouts = draft.workouts as Array<{ sections: Array<Record<string, unknown>> }>;
  const hydration = workouts
    .flatMap((workout) => workout.sections)
    .find((section) => section.kind === "hydration");
  assert.ok(hydration, "Proof draft must contain Hydration.");
  return hydration!;
}

function findTypedRepeatSection(draft: AiAuthoredPlanFirstProviderDraft) {
  const repeat = draft.workouts
    .flatMap((workout) => workout.sections)
    .find((section) => section.kind === "repeat");
  assert.ok(repeat?.kind === "repeat");
  if (!repeat || repeat.kind !== "repeat") throw new Error("Repeat section is required.");
  return repeat;
}

function findUnitSection(draft: AiAuthoredPlanFirstProviderDraft) {
  const unit = draft.workouts
    .flatMap((workout) => workout.sections)
    .find((section) => section.kind === "unit");
  assert.ok(unit?.kind === "unit");
  if (!unit || unit.kind !== "unit") throw new Error("Unit section is required.");
  return unit;
}

function findTypedHeartRateTarget(draft: AiAuthoredPlanFirstProviderDraft) {
  for (const section of draft.workouts.flatMap((workout) => workout.sections)) {
    if (section.kind === "unit" && section.target.primary_execution_mode === "heart_rate") {
      return section.target;
    }
    if (section.kind === "repeat") {
      const target = section.children.find(
        (child) => child.target.primary_execution_mode === "heart_rate",
      )?.target;
      if (target) return target;
    }
  }
  throw new Error("Target is required.");
}

function firstCompiledTarget(plan: TrainingPlanV2, mode: "pace" | "heart_rate") {
  for (const workout of plan.planned_workouts) {
    for (const segment of workout.segments) {
      const targets =
        segment.prescription?.mode === "repeats"
          ? (segment.prescription.children ?? []).map((child) => child.target)
          : [segment.target];
      const target = targets.find((candidate) => candidate?.primary_execution_mode === mode);
      if (target) return target;
    }
  }
  return undefined;
}

function rewriteHeartRateTargets(
  draft: AiAuthoredPlanFirstProviderDraft,
  replacement: AiAuthoredPlanFirstProviderUnit["target"],
) {
  for (const section of draft.workouts.flatMap((workout) => workout.sections)) {
    if (section.kind === "unit" && section.target.primary_execution_mode === "heart_rate") {
      section.target = replacement;
    }
    if (section.kind === "repeat") {
      for (const child of section.children) {
        if (child.target.primary_execution_mode === "heart_rate") {
          child.target = replacement;
        }
      }
    }
  }
}

function paceTarget(pace: string): AiAuthoredPlanFirstProviderUnit["target"] {
  return {
    primary_execution_mode: "pace",
    command: pace,
  };
}

function heartRateCommand(
  authoringInput: Extract<
    ReturnType<typeof buildAiGeneratedRunningPlanAuthoringInput>,
    { ok: true }
  >["authoringInput"],
  reference: (typeof AI_AUTHORED_PLAN_FIRST_HR_ZONE_REFERENCE_VALUES)[number],
) {
  const profile = authoringInput.runnerFacts.heartRateProfile;
  const [startReference, endReference = startReference] = reference.split("-");
  const start = profile.zones.find((zone) => zone.reference === startReference);
  const end = profile.zones.find((zone) => zone.reference === endReference);
  assert.ok(start && end);
  return `${start.minBpm}-${end.maxBpm} bpm`;
}

function findTarget(draft: Record<string, unknown>) {
  const workouts = draft.workouts as Array<{ sections: Array<Record<string, unknown>> }>;
  for (const section of workouts.flatMap((workout) => workout.sections)) {
    const target = section.target;
    if (target && typeof target === "object") return target as Record<string, unknown>;
    const children = section.children;
    if (!Array.isArray(children)) continue;
    const child = children.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        "target" in candidate &&
        (candidate as { target?: unknown }).target != null,
    ) as { target: Record<string, unknown> } | undefined;
    if (child) return child.target;
  }
  throw new Error("Target is required.");
}

function providerResponse(responseId: string, draft: unknown): typeof fetch {
  return async () =>
    new Response(
      JSON.stringify({
        id: responseId,
        status: "completed",
        output_text: JSON.stringify(draft),
        usage: { input_tokens: 100, output_tokens: 100, total_tokens: 200 },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}
