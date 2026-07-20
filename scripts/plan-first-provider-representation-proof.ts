import assert from "node:assert/strict";
import { compileAiAuthoredPlanFirstDraft } from "../src/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_HR_ZONE_REFERENCE_VALUES,
  AI_AUTHORED_PLAN_FIRST_REPEAT_SECTION_TYPE_VALUES,
  AI_AUTHORED_PLAN_FIRST_UNIT_SECTION_TYPE_VALUES,
  AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES,
  aiAuthoredPlanFirstProviderDraftSchema,
  buildAiAuthoredPlanFirstPrompt,
  type AiAuthoredPlanFirstProviderDraft,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import {
  buildAiGeneratedRunningPlanAuthoringInput,
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
  buildReviewedAiGeneratedRunningPlanPreview,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import { PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES } from "../src/lib/planned-workout-block-contract";
import type { Database } from "../src/lib/supabase/database";
import { addDaysIso } from "../src/lib/training";

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
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const draft = structuredClone(validDraft);
  const workout = draft.workouts[0];
  const section = workout?.sections[0];
  assert.ok(workout && section?.kind === "unit");

  workout.cue = "Keep Z2 controlled.";
  section.cue = "Stay smooth in Z2.";
  section.target = { pace: null, hr_zone: "Z2", effort: null };

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
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input);
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
    findTypedTarget(draft).hr_zone = hrReference;
    assertCompiles(draft, `hr:${hrReference}`);
  }
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
    reviewed.ok ? "" : `${scenarioName}: ${reviewed.unavailable.error.message}`,
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
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const prompt = buildAiAuthoredPlanFirstPrompt({
    authoringInput: resolved.authoringInput,
    today: input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const schemaText = JSON.stringify(prompt.responseSchema);
  assert.doesNotMatch(schemaText, /warnings|assumptions|metadata|week_number|weeks/);
  assert.doesNotMatch(
    prompt.userPrompt,
    /goalType|distance_build|"label":"(?:10K|Half Marathon|Marathon|15K)"/,
  );
  assert.match(prompt.userPrompt, /"distance_meters":42195|"distance_meters":10000/);

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
        repeat.target = { pace: "4:30/km", hr_zone: null, effort: null };
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
      name: "reversed HR zone range",
      mutate: (draft) => {
        findTarget(draft).hr_zone = "Z5-Z1";
      },
      expectedIssue: /provider_schema_invalid/,
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
}

async function assertTransportFailures(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstProviderDraft,
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input);
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
  authored: { pace: string | null; hr_zone: string | null; effort: string | null } | null,
  compiled: TrainingPlanV2["planned_workouts"][number]["segments"][number]["target"],
) {
  if (!authored || (!authored.pace && !authored.hr_zone && !authored.effort)) {
    assert.equal(compiled, undefined);
    return;
  }

  assert.equal(compiled?.pace, authored.pace ?? undefined);
  assert.equal(compiled?.intensity, authored.effort ?? undefined);
  const exportedHrZone = (compiled as Record<string, unknown> | undefined)?.hr_zone;
  assert.equal(compiled?.extra?.hr_zone ?? exportedHrZone, authored.hr_zone ?? undefined);
  if (authored.hr_zone) {
    assert.match(compiled?.hr_bpm_range ?? "", /^\d{2,3}-\d{2,3} bpm$/);
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
    benchmark: { kind: "unknown" },
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
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);
  const distance = resolved.authoringInput.planGoalIntent.distance;
  if (!distance) throw new Error("Distance is required.");
  const startDate = resolved.authoringInput.schedule.startDate;
  const endpointDate = addDaysIso(startDate, weeks * 7 - 1);
  const workouts: AiAuthoredPlanFirstProviderDraft["workouts"] = [];

  for (let week = 0; week < weeks; week += 1) {
    const offsets = [0, 2, 3, 4, 6];
    for (const [contact, dayOffset] of offsets.entries()) {
      const date = addDaysIso(startDate, week * 7 + dayOffset);
      if (date >= endpointDate) continue;
      workouts.push(buildAuthoredWorkout(date, week, contact));
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
            pace: "5:40-5:50/km",
            hr_zone: "Z3-Z4",
            effort: "Controlled selected-distance effort",
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
): AiAuthoredPlanFirstProviderDraft["workouts"][number] {
  if (contact === 1) {
    return {
      date,
      phase: `Build ${week + 1}`,
      workout_identity: "distance_intervals",
      title: "Ordered interval session",
      cue: "Keep every repetition controlled.",
      sections: [
        unitSection("warmup", "Warm up", 10, null),
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
              target: null,
            },
            {
              role: "work",
              label: "Work",
              cue: "Run smoothly.",
              prescription: { mode: "time", duration_min: 3 },
              target: {
                pace: "5:00-5:10/km",
                hr_zone: "Z4",
                effort: "Controlled hard",
              },
            },
            {
              role: "recover",
              label: "Recover",
              cue: "Stay relaxed.",
              prescription: { mode: "time", duration_min: 2 },
              target: { pace: null, hr_zone: "Z1-Z2", effort: "Easy" },
            },
          ],
        },
        unitSection("cooldown", "Cool down", 10, null),
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
          pace: "6:15-6:30/km",
          hr_zone: "Z2",
          effort: "Easy aerobic",
        }),
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
      unitSection(contact === 2 ? "tempo_block" : "main", "Main", contact === 2 ? 25 : 40, {
        pace: contact === 2 ? "5:20-5:30/km" : "6:20-6:40/km",
        hr_zone: contact === 2 ? "Z3" : "Z2",
        effort: contact === 2 ? "Comfortably controlled" : "Easy",
      }),
    ],
  };
}

function unitSection(
  segmentType: "warmup" | "main" | "cooldown" | "tempo_block",
  label: string,
  durationMin: number,
  target: { pace: string | null; hr_zone: string | null; effort: string | null } | null,
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

function findTypedTarget(draft: AiAuthoredPlanFirstProviderDraft) {
  for (const section of draft.workouts.flatMap((workout) => workout.sections)) {
    if (section.kind === "unit" && section.target) return section.target;
    if (section.kind === "repeat") {
      const target = section.children.find((child) => child.target)?.target;
      if (target) return target;
    }
  }
  throw new Error("Target is required.");
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
