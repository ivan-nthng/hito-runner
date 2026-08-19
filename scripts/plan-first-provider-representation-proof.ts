import assert from "node:assert/strict";
import { compileAiAuthoredPlanFirstDraft } from "../src/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_HR_ZONE_REFERENCE_VALUES,
  AI_AUTHORED_PLAN_FIRST_PRIMARY_EXECUTION_MODE_VALUES,
  AI_AUTHORED_PLAN_FIRST_REPEAT_SECTION_TYPE_VALUES,
  AI_AUTHORED_PLAN_FIRST_UNIT_SECTION_TYPE_VALUES,
  AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES,
  aiAuthoredPlanFirstCompilerDraftSchema,
  buildAiAuthoredPlanFirstPrompt,
  type AiAuthoredPlanFirstCompilerDraft,
  type AiAuthoredPlanFirstCompilerStep,
  type AiAuthoredPlanFirstCompilerUnit,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import {
  buildAiGeneratedRunningPlanAuthoringInput as buildAiGeneratedRunningPlanAuthoringInputRuntime,
  type AiGeneratedRunningPlanPreviewInput,
} from "../src/lib/ai-generated-running-plan";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  validateImportedPlanJson,
  type TrainingPlanV2,
} from "../src/lib/imported-plan";
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
} from "../src/lib/plan-export";
import { buildPersistedWorkoutInsertRows } from "../src/lib/persisted-plan-replacement";
import type { PersistedPlannedWorkoutRow } from "../src/lib/runner-calendar-persistence";
import {
  buildReviewedAiGeneratedRunningPlanPreview as buildReviewedAiGeneratedRunningPlanPreviewRuntime,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import { PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES } from "../src/lib/planned-workout-block-contract";
import type { Database } from "../src/lib/supabase/database";
import { addDaysIso, weekdayLong } from "../src/lib/training";
import {
  WORKOUT_DOCUMENT_HYDRATION_CUE,
  WORKOUT_DOCUMENT_HYDRATION_LABEL,
  normalizeWorkoutDocumentTarget,
} from "../src/lib/workout-document";
import {
  buildProofPersonalRunnerProfileSnapshot,
  buildProofRunnerProfileSnapshot,
} from "./runner-profile-snapshot-proof-helpers";
import {
  buildPolicyCompliantLongRunSections,
  buildPolicyCompliantProviderSectionsForIdentity,
} from "./long-run-execution-policy-proof";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];

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
const canonicalWireCoverage = {
  unitHeartRate: false,
  repeatChildHeartRate: false,
};

export function buildAiGeneratedRunningPlanAuthoringInput(
  input: RunningPlanPreviewActionInput,
  profileSnapshot = buildProofRunnerProfileSnapshot(input),
) {
  return buildAiGeneratedRunningPlanAuthoringInputRuntime(input, profileSnapshot);
}

function requireAuthoringInput(input: RunningPlanPreviewActionInput) {
  const result = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(result.ok, true, result.ok ? "" : result.message);
  if (!result.ok) throw new Error(result.message);
  return result.authoringInput;
}

export function buildReviewedAiGeneratedRunningPlanPreview(
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

  await assertRunnableSupportHydrationReviewContract(capacityInput, capacityDraft);
  await assertRepeatDurationEditorialDiscretion(capacityInput, capacityDraft);
  await assertWorkoutTitleDurationContract(capacityInput, capacityDraft);
  assertClosedProviderSchema(capacityInput, capacityDraft);
  assertAvailabilityContract(capacityInput, capacityDraft);
  assertProviderEnumClosure(capacityInput, capacityDraft);
  await assertRunnerFacingHeartRateReferenceContract(capacityInput, capacityDraft);
  await assertDirectProviderSchemaRejectionContract(capacityInput, capacityDraft);
  await assertProviderRequestContract(capacityInput, capacityDraft);
  assert.deepEqual(canonicalWireCoverage, {
    unitHeartRate: true,
    repeatChildHeartRate: true,
  });

  return {
    capacityWeeks: 36,
    capacityWorkoutCount: capacityDraft.workouts.length + 1,
    capacityCharacters: serializedCapacityDraft.length,
    conservativeTokenEstimate,
    configuredOutputTokenLimit: 32_000,
  };
}

async function assertRepeatDurationEditorialDiscretion(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstCompilerDraft,
) {
  const authoredDraft = structuredClone(validDraft);
  const workout = authoredDraft.workouts[0];
  assert.ok(workout);
  workout!.workout_identity = "quality_session";
  workout!.title = "AI-authored duration discretion proof";
  workout!.cue = "Execute the authored structure.";
  workout!.sections = [
    {
      kind: "repeat",
      segment_type: "interval_block",
      label: "Unusual authored repeat",
      cue: "Backend preserves the authored duration.",
      rounds: 2,
      children: [
        {
          role: "work",
          label: "Authored work",
          cue: null,
          prescription: { mode: "time", duration_min: 115 },
          target: {
            primary_execution_mode: "pace",
            command: "6:20-6:50/km",
          },
        },
      ],
    },
  ];

  const reviewed = await buildReviewedAiGeneratedRunningPlanPreview(input, {
    runnerProfileSnapshot: buildProofPersonalRunnerProfileSnapshot(input),
    aiPreview: {
      apiKey: "repeat-duration-editorial-discretion-proof",
      model: "repeat-duration-editorial-discretion-proof",
      generationLedger: { disabled: true },
      fetchImpl: providerResponse("resp_repeat_duration_editorial_discretion", authoredDraft),
    },
  });
  assert.equal(
    reviewed.ok,
    true,
    reviewed.ok
      ? ""
      : `Backend must not turn unusual Repeat duration into a coaching veto when no hard contract fails: ${reviewed.unavailable.error.issues.join(", ")}`,
  );
}

async function assertWorkoutTitleDurationContract(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstCompilerDraft,
) {
  const exactDraft = structuredClone(validDraft);
  const exactWorkout = exactDraft.workouts[0];
  assert.ok(exactWorkout);
  exactWorkout!.workout_identity = "easy_aerobic_run";
  exactWorkout!.title = "Easy aerobic run";
  exactWorkout!.cue = "Follow the complete timed structure.";
  exactWorkout!.sections = [
    providerTimeUnit("warmup", 10),
    providerTimeUnit("main", 40),
    providerTimeUnit("recovery", 10),
  ];
  await assertReviewableDraft(input, exactDraft, "timed workout with structure-owned duration");

  const forbiddenProviderDurationTitle = structuredClone(exactDraft);
  forbiddenProviderDurationTitle.workouts[0]!.title = "60 min easy aerobic run";
  assert.equal(
    aiAuthoredPlanFirstCompilerDraftSchema.safeParse(forbiddenProviderDurationTitle).success,
    false,
  );

  const rejectedProviderDurationTitle = await buildReviewedAiGeneratedRunningPlanPreview(input, {
    aiPreview: {
      apiKey: "provider-title-duration-rejection-proof",
      model: "provider-title-duration-rejection-proof",
      generationLedger: { disabled: true },
      fetchImpl: providerResponse(
        "resp_provider_title_duration_rejection",
        forbiddenProviderDurationTitle,
      ),
    },
  });
  assert.equal(rejectedProviderDurationTitle.ok, false);
  if (!rejectedProviderDurationTitle.ok) {
    assert.equal(
      rejectedProviderDurationTitle.unavailable.previewOutcome,
      "malformed_provider_output",
    );
    assert.equal(rejectedProviderDurationTitle.unavailable.persisted, false);
    assert.doesNotMatch(
      JSON.stringify(rejectedProviderDurationTitle),
      /reviewToken|reviewChecksum/,
    );
  }

  const repeatDraft = structuredClone(exactDraft);
  repeatDraft.workouts[0]!.workout_identity = "distance_intervals";
  repeatDraft.workouts[0]!.title = "Interval session";
  repeatDraft.workouts[0]!.sections = [
    {
      kind: "repeat",
      segment_type: "interval_block",
      label: "Timed repeat",
      cue: "Run each complete round.",
      rounds: 3,
      children: [
        {
          role: "work",
          label: "Work",
          cue: "Run smoothly.",
          prescription: { mode: "time", duration_min: 6 },
          target: paceTarget("5:20-5:40/km"),
        },
        {
          role: "recover",
          label: "Recovery",
          cue: "Keep moving.",
          prescription: { mode: "time", duration_min: 4 },
          target: paceTarget("6:45-7:15/km"),
        },
      ],
    },
  ];
  await assertReviewableDraft(
    input,
    repeatDraft,
    "Repeat timed workout with structure-owned duration",
  );

  const exactCompiled = compileAiAuthoredPlanFirstDraft({
    draft: exactDraft,
    authoringInput: requireAuthoringInput(input),
  });
  assert.equal(exactCompiled.ok, true);
  if (!exactCompiled.ok) throw new Error(JSON.stringify(exactCompiled));
  assert.equal(
    validateImportedPlanJson(JSON.stringify(exactCompiled.canonicalPlan))?.success,
    true,
  );
  assert.doesNotThrow(() => buildImportedPlanSeed(exactCompiled.canonicalPlan));
  const exported = exportAndReimportCanonicalPlan(exactCompiled.canonicalPlan);
  assert.equal(validateImportedPlanJson(JSON.stringify(exported))?.success, true);

  const legacyDurationTitlePlan = structuredClone(exactCompiled.canonicalPlan);
  legacyDurationTitlePlan.planned_workouts[0]!.title = "60 min easy aerobic run";
  assert.equal(validateImportedPlanJson(JSON.stringify(legacyDurationTitlePlan))?.success, true);

  const invalidImported = structuredClone(legacyDurationTitlePlan);
  invalidImported.planned_workouts[0]!.segments[1]!.prescription = {
    mode: "time",
    duration_min: 50,
  };
  assert.equal(validateImportedPlanJson(JSON.stringify(invalidImported))?.success, false);
  assert.throws(() => buildImportedPlanSeed(invalidImported));
}

async function assertRunnableSupportHydrationReviewContract(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstCompilerDraft,
) {
  const withoutHydration = structuredClone(validDraft);
  const workout = withoutHydration.workouts[0];
  assert.ok(workout);
  workout!.workout_identity = "long_aerobic_run";
  workout!.title = "Runnable support duration proof";
  workout!.cue = "Execute every timed section.";
  workout!.sections = [
    providerTimeUnit("warmup", 5),
    providerTimeUnit("main", 80),
    providerTimeUnit("recovery", 10),
  ];

  const rejectedBeforeReview = await buildReviewedAiGeneratedRunningPlanPreview(input, {
    aiPreview: {
      apiKey: "runnable-support-hydration-rejection",
      model: "runnable-support-hydration-rejection",
      generationLedger: { disabled: true },
      fetchImpl: providerResponse("resp_runnable_support_hydration_rejection", withoutHydration),
    },
  });
  assert.equal(rejectedBeforeReview.ok, false);
  if (!rejectedBeforeReview.ok) {
    assert.equal(rejectedBeforeReview.unavailable.previewOutcome, "compiler_rejection");
    assert.doesNotMatch(
      JSON.stringify(rejectedBeforeReview),
      /reviewToken|reviewChecksum|canonicalPlan/,
    );
  }

  const withHydration = structuredClone(withoutHydration);
  withHydration.workouts[0]!.sections.splice(2, 0, {
    kind: "hydration",
    label: "Hydration",
    cue: "Take water.",
  });
  await assertReviewableDraft(input, withHydration, "95-minute runnable support with Hydration");
}

function providerTimeUnit(
  segmentType: "warmup" | "main" | "recovery",
  durationMin: number,
): AiAuthoredPlanFirstCompilerStep {
  return {
    kind: "unit",
    segment_type: segmentType,
    label: "Timed runnable section",
    cue: null,
    prescription: { mode: "time", duration_min: durationMin },
    target: {
      primary_execution_mode: "pace",
      command: "6:10-6:30/km",
    },
  };
}

async function assertRunnerFacingHeartRateReferenceContract(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstCompilerDraft,
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

  const z2Command = heartRateCommand(resolved.authoringInput, "Z2");
  section.target = {
    primary_execution_mode: "heart_rate",
    band_reference: "Z2",
    command: z2Command,
  };

  assert.equal(aiAuthoredPlanFirstCompilerDraftSchema.safeParse(draft).success, true);
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
  const fullBandTarget = compiledWorkout.segments[0]?.target;
  assert.equal(fullBandTarget?.extra?.hr_zone_reference, "Z2");
  assert.equal(fullBandTarget?.extra?.hr_band_bpm_min, 121);
  assert.equal(fullBandTarget?.extra?.hr_band_bpm_max, 140);
  assert.equal(fullBandTarget?.extra?.hr_execution_range_kind, "full_band");

  const subrangeDraft = structuredClone(draft);
  const subrangeSection = subrangeDraft.workouts[0]!.sections[0]!;
  assert.equal(subrangeSection.kind, "unit");
  if (subrangeSection.kind !== "unit") throw new Error("Unit section is required.");
  subrangeSection.cue = "Hold the controlled middle of the selected band for this stage.";
  subrangeSection.target = {
    primary_execution_mode: "heart_rate",
    band_reference: "Z2",
    command: "125-135 bpm",
  };
  await assertReviewableDraft(input, subrangeDraft, "contained named-band HR subrange");

  const repeatChildDraft = structuredClone(draft);
  const repeatChild = findTypedRepeatSection(repeatChildDraft).children[0]!;
  repeatChild.target = {
    primary_execution_mode: "heart_rate",
    band_reference: "Z2",
    command: z2Command,
  };
  await assertReviewableDraft(input, repeatChildDraft, "named-band HR Repeat child");

  const underFiveDraft = structuredClone(draft);
  const underFiveSection = underFiveDraft.workouts[0]!.sections[0]!;
  assert.equal(underFiveSection.kind, "unit");
  if (underFiveSection.kind !== "unit") throw new Error("Unit section is required.");
  underFiveSection.target = {
    primary_execution_mode: "heart_rate",
    band_reference: "Z2",
    command: "125-129 bpm",
  };
  const rejectedBeforeReview = await buildReviewedAiGeneratedRunningPlanPreview(input, {
    runnerProfileSnapshot: buildProofPersonalRunnerProfileSnapshot(input),
    aiPreview: {
      apiKey: "named-band-rejection-before-review",
      model: "named-band-rejection-before-review",
      generationLedger: { disabled: true },
      fetchImpl: providerResponse("resp_named_band_rejection_before_review", underFiveDraft),
    },
  });
  assert.equal(rejectedBeforeReview.ok, false);
  if (!rejectedBeforeReview.ok) {
    assert.equal(rejectedBeforeReview.unavailable.previewOutcome, "compiler_rejection");
    assert.equal(rejectedBeforeReview.unavailable.persisted, false);
    assert.doesNotMatch(
      JSON.stringify(rejectedBeforeReview),
      /reviewToken|reviewChecksum|canonicalPlan/,
    );
  }

  for (const [label, cue] of [
    ["single raw reference", "Keep Z2 controlled."],
    ["composite raw reference", "Keep Z1-Z2 controlled."],
  ] as const) {
    const rawReferenceDraft = structuredClone(draft);
    rawReferenceDraft.workouts[0]!.cue = cue;
    const rawReferenceResult = compileAiAuthoredPlanFirstDraft({
      draft: rawReferenceDraft,
      authoringInput: resolved.authoringInput,
    });
    assert.equal(rawReferenceResult.ok, false, `${label} must be rejected.`);
    if (!rawReferenceResult.ok) {
      assert.match(JSON.stringify(rawReferenceResult.issues), /provider_schema_invalid/);
    }
  }
}

function assertProviderEnumClosure(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstCompilerDraft,
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const assertCompiles = (draft: AiAuthoredPlanFirstCompilerDraft, value: string) => {
    assert.equal(
      aiAuthoredPlanFirstCompilerDraftSchema.safeParse(draft).success,
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
    draft.workouts[0]!.sections = buildPolicyCompliantProviderSectionsForIdentity(
      identity,
      heartRateCommand(resolved.authoringInput, "Z2"),
    );
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
    const target = findTypedHeartRateTarget(draft);
    target.band_reference = hrReference;
    target.command = heartRateCommand(resolved.authoringInput, hrReference);
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
  draft: AiAuthoredPlanFirstCompilerDraft,
  scenarioName: string,
) {
  assert.equal(aiAuthoredPlanFirstCompilerDraftSchema.safeParse(draft).success, true);
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
  validDraft: AiAuthoredPlanFirstCompilerDraft,
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
  assert.doesNotMatch(schemaText, /contract_version/);
  assert.doesNotMatch(
    schemaText,
    /catalog|prescription_ref|target_ref|phase_ref|label_ref|cue_ref/,
  );
  assert.match(schemaText, /"prescription"/);
  assert.match(schemaText, /"target"/);
  assert.match(schemaText, /"primary_execution_mode"/);
  assert.match(schemaText, /"command"/);
  assert.match(schemaText, /"pace"/);
  assert.match(schemaText, /"heart_rate"/);
  assert.match(schemaText, / bpm\$/);
  assert.doesNotMatch(
    schemaText,
    /"heart_rate":\{"type":"object"/,
    "Direct provider targets must keep HR identity and BPM on the local target.",
  );
  assert.match(prompt.systemPrompt, /one leaf never has both pace and BPM/);
  assert.match(prompt.systemPrompt, /suffix exactly as lowercase bpm/i);
  assert.match(prompt.systemPrompt, /benchmark improves precision but is not required/i);
  assert.match(prompt.systemPrompt, /numeric execution subrange/i);
  assert.match(prompt.systemPrompt, /band_reference must identify exactly one complete named/i);
  assert.match(prompt.systemPrompt, /never combine references/i);
  assert.match(prompt.systemPrompt, /kind=hydration/i);
  assert.match(
    prompt.systemPrompt,
    /choose one substantive mode for the whole long-run before authoring its sections/i,
  );
  assert.match(
    prompt.systemPrompt,
    /never place adjacent substantive body sections with the same numeric command/i,
  );
  assert.match(prompt.systemPrompt, /sum participant-executed runnable duration_min/i);
  assert.match(
    prompt.systemPrompt,
    /Every timed kind=unit section counts once, including warmup, cooldown, recovery, and recovery_jog/i,
  );
  assert.match(
    prompt.systemPrompt,
    /Every timed Repeat child counts once per round, including recover and walk children/i,
  );
  assert.match(prompt.systemPrompt, /Only non-runnable kind=hydration steps are excluded/i);
  assert.match(prompt.systemPrompt, /exactly 90 minutes is not above 90/i);
  assert.match(prompt.systemPrompt, /10-minute warmup plus 65-minute main plus 20-minute finish/i);
  assert.match(
    JSON.stringify(prompt.responseSchema),
    /10 \+ 65 \+ 20 = 95 requires Hydration between the 65-minute main and 20-minute finish/,
  );
  assert.match(
    prompt.systemPrompt,
    /mandatory even when warmup, finish, cooldown, or runnable recovery already exists/i,
  );
  assert.match(
    prompt.systemPrompt,
    /mandatory time-based long-run threshold above takes precedence/i,
  );
  assert.match(prompt.systemPrompt, /before returning, audit every long-run workout/i);
  assert.doesNotMatch(
    prompt.systemPrompt,
    /general long aerobic work usually uses BPM while pace-specific portions use pace/i,
  );
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
    /"heart_rate"/,
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
  assert.match(noPaceSchema, /"pace"/);
  assert.match(noPacePrompt.systemPrompt, /goal_informed_ai_estimate/);
  assert.match(noPaceSchema, /"heart_rate"/);
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
    band_reference: "Z2",
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
  assert.equal(aiAuthoredPlanFirstCompilerDraftSchema.safeParse(hydrationOnly).success, true);
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
  validDraft: AiAuthoredPlanFirstCompilerDraft,
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
      3,
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

  const overCeilingInput = { ...input, daysPerWeek: 3 as const };
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

async function assertProviderRequestContract(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstCompilerDraft,
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  let capturedRequestBody: Record<string, unknown> | null = null;
  const strictRequest = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "strict-request-contract-proof",
    model: "gpt-5.2",
    generationLedger: { disabled: true },
    fetchImpl: async (_url, init) => {
      capturedRequestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return providerResponse("resp_strict_request_contract", validDraft)(_url, init);
    },
  });
  assert.equal(strictRequest.ok, true);
  const capturedText = capturedRequestBody?.text as
    | { verbosity?: unknown; format?: { type?: unknown; strict?: unknown } }
    | undefined;
  assert.equal(capturedRequestBody?.model, "gpt-5.2");
  assert.deepEqual(capturedRequestBody?.reasoning, { effort: "low" });
  assert.equal(capturedText?.verbosity, "low");
  assert.deepEqual(capturedText?.format, {
    ...(capturedText?.format ?? {}),
    type: "json_schema",
    strict: true,
  });

  const uppercaseBpmDraft = structuredClone(validDraft);
  const uppercaseBpmTarget = findDirectHeartRateTarget(uppercaseBpmDraft);
  assert.ok(uppercaseBpmTarget);
  uppercaseBpmTarget.command = uppercaseBpmTarget.command.replace(/ bpm$/, " BPM");
  const uppercaseBpm = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "uppercase-bpm-contract-proof",
    model: "gpt-5.2",
    generationLedger: { disabled: true },
    fetchImpl: providerResponse("resp_uppercase_bpm_contract", uppercaseBpmDraft),
  });
  assert.equal(uppercaseBpm.ok, false);
  if (uppercaseBpm.ok || uppercaseBpm.reason === "structured_input_invalid") {
    throw new Error("Non-canonical uppercase BPM unexpectedly reached canonical review.");
  }
  assert.equal(
    uppercaseBpm.metadata.unavailableReason,
    "ai_authored_plan_first_provider_schema_invalid",
  );
}

async function assertDirectProviderSchemaRejectionContract(
  input: RunningPlanPreviewActionInput,
  validDraft: AiAuthoredPlanFirstCompilerDraft,
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(
    input,
    buildProofPersonalRunnerProfileSnapshot(input),
  );
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const parsedDirectDraft = aiAuthoredPlanFirstCompilerDraftSchema.safeParse(validDraft);
  assert.equal(parsedDirectDraft.success, true);
  assert.deepEqual(Object.keys(validDraft).sort(), ["endpoint", "workouts"]);
  assert.deepEqual(Object.keys(findDirectHeartRateTarget(validDraft)).sort(), [
    "band_reference",
    "command",
    "primary_execution_mode",
  ]);

  const independentDraft = {
    workouts: [
      {
        date: resolved.authoringInput.schedule.startDate,
        phase: "Opening",
        workout_identity: "time_intervals",
        title: "Direct interval proof",
        cue: "Keep every authored stage.",
        sections: [
          {
            kind: "unit",
            segment_type: "warmup",
            label: "Warm-up",
            cue: null,
            prescription: { mode: "time", duration_min: 10 },
            target: { primary_execution_mode: "pace", command: "6:20-6:50/km" },
          },
          {
            kind: "repeat",
            segment_type: "interval_block",
            label: "Two controlled repetitions",
            cue: "Keep the authored order.",
            rounds: 2,
            children: [
              {
                role: "work",
                label: "Work",
                cue: "Controlled pace.",
                prescription: { mode: "time", duration_min: 2 },
                target: { primary_execution_mode: "pace", command: "4:50-5:00/km" },
              },
              {
                role: "recover",
                label: "Recovery",
                cue: null,
                prescription: { mode: "time", duration_min: 1 },
                target: { primary_execution_mode: "pace", command: "7:10-7:40/km" },
              },
            ],
          },
          {
            kind: "hydration",
            label: WORKOUT_DOCUMENT_HYDRATION_LABEL,
            cue: WORKOUT_DOCUMENT_HYDRATION_CUE,
          },
        ],
      },
    ],
    endpoint: {
      date: validDraft.endpoint.date,
      phase: "Endpoint",
      workout_identity: "selected_distance_completion_or_checkpoint",
      title: "10K endpoint",
      cue: "Complete the selected distance.",
      sections: [
        {
          kind: "unit",
          segment_type: "main",
          label: "10K",
          cue: null,
          prescription: { mode: "distance", distance_km: 10 },
          target: { primary_execution_mode: "pace", command: "4:50-5:00/km" },
        },
      ],
    },
  } satisfies AiAuthoredPlanFirstCompilerDraft;
  const independentParsed = aiAuthoredPlanFirstCompilerDraftSchema.safeParse(independentDraft);
  assert.equal(independentParsed.success, true);
  if (!independentParsed.success) throw new Error(independentParsed.error.message);
  assert.deepEqual(independentParsed.data.workouts[0]?.sections, [
    {
      kind: "unit",
      segment_type: "warmup",
      label: "Warm-up",
      cue: null,
      prescription: { mode: "time", duration_min: 10 },
      target: { primary_execution_mode: "pace", command: "6:20-6:50/km" },
    },
    {
      kind: "repeat",
      segment_type: "interval_block",
      label: "Two controlled repetitions",
      cue: "Keep the authored order.",
      rounds: 2,
      children: [
        {
          role: "work",
          label: "Work",
          cue: "Controlled pace.",
          prescription: { mode: "time", duration_min: 2 },
          target: { primary_execution_mode: "pace", command: "4:50-5:00/km" },
        },
        {
          role: "recover",
          label: "Recovery",
          cue: null,
          prescription: { mode: "time", duration_min: 1 },
          target: { primary_execution_mode: "pace", command: "7:10-7:40/km" },
        },
      ],
    },
    {
      kind: "hydration",
      label: WORKOUT_DOCUMENT_HYDRATION_LABEL,
      cue: WORKOUT_DOCUMENT_HYDRATION_CUE,
    },
  ]);

  const missingLocalTarget = structuredClone(validDraft);
  const firstRunnable = findFirstDirectRunnableLeaf(missingLocalTarget) as unknown as Record<
    string,
    unknown
  >;
  delete firstRunnable.target;
  const rejectedLocalTarget = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "direct-local-target-proof",
    model: "direct-local-target-proof",
    generationLedger: { disabled: true },
    fetchImpl: providerResponse("resp_direct_local_target_invalid", missingLocalTarget),
  });
  assert.equal(rejectedLocalTarget.ok, false);
  if (rejectedLocalTarget.ok || rejectedLocalTarget.reason === "structured_input_invalid") {
    throw new Error("Missing direct local target unexpectedly reached canonical review.");
  }
  assert.equal(
    rejectedLocalTarget.metadata.unavailableReason,
    "ai_authored_plan_first_provider_schema_invalid",
  );
  assert.doesNotMatch(
    JSON.stringify(rejectedLocalTarget),
    /reviewToken|reviewChecksum|canonicalPlan/,
  );

  const nestedHeartRateTarget = structuredClone(validDraft);
  const retiredTarget = findDirectHeartRateTarget(nestedHeartRateTarget) as unknown as Record<
    string,
    unknown
  >;
  const bandReference = retiredTarget.band_reference;
  const command = retiredTarget.command;
  delete retiredTarget.primary_execution_mode;
  delete retiredTarget.band_reference;
  delete retiredTarget.command;
  retiredTarget.heart_rate = {
    band_reference: bandReference,
    command,
  };
  const rejectedNestedTarget = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "retired-nested-heart-rate-target-proof",
    model: "retired-nested-heart-rate-target-proof",
    generationLedger: { disabled: true },
    fetchImpl: providerResponse("resp_retired_nested_heart_rate_target", nestedHeartRateTarget),
  });
  assert.equal(rejectedNestedTarget.ok, false);
  if (rejectedNestedTarget.ok || rejectedNestedTarget.reason === "structured_input_invalid") {
    throw new Error("Retired nested HR target unexpectedly remained provider-authorable.");
  }
  assert.equal(
    rejectedNestedTarget.metadata.unavailableReason,
    "ai_authored_plan_first_provider_schema_invalid",
  );

  const retiredWireShape = {
    contract_version: "retired",
    workouts: [],
    endpoint: {},
  };
  const rejectedRetiredShape = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "retired-wire-shape-proof",
    model: "retired-wire-shape-proof",
    generationLedger: { disabled: true },
    fetchImpl: providerResponse("resp_retired_wire_shape_invalid", retiredWireShape),
  });
  assert.equal(rejectedRetiredShape.ok, false);
  if (rejectedRetiredShape.ok || rejectedRetiredShape.reason === "structured_input_invalid") {
    throw new Error("A retired provider wire shape unexpectedly reached canonical review.");
  }
  assert.equal(
    rejectedRetiredShape.metadata.unavailableReason,
    "ai_authored_plan_first_provider_schema_invalid",
  );
}

function assertProviderFieldParity(draft: AiAuthoredPlanFirstCompilerDraft, plan: TrainingPlanV2) {
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
  const exported = activePlanExportToTrainingPlanV2(payload);
  assertCanonicalTargetWire(exported);
  assertHistoricalNestedTargetCompatibility(exported);
  assertContradictoryTargetMetadataRejected(exported);

  return importedPlanSchema.parse(exported);
}

function assertTargetParity(
  authored: AiAuthoredPlanFirstCompilerUnit["target"],
  compiled: TrainingPlanV2["planned_workouts"][number]["segments"][number]["target"],
) {
  const canonicalTarget = normalizeWorkoutDocumentTarget(compiled);
  assert.equal(canonicalTarget?.primary_execution_mode, authored.primary_execution_mode);
  assert.equal(
    canonicalTarget?.pace,
    authored.primary_execution_mode === "pace" ? authored.command : undefined,
  );
  assert.equal(canonicalTarget?.intensity, undefined);
  if (authored.primary_execution_mode === "heart_rate") {
    assert.equal(canonicalTarget?.hr_bpm_range, authored.command);
    assert.equal(canonicalTarget?.hr_target_source, "personal_hr_zone");
    const bandReference = targetMetadata(canonicalTarget, "hr_zone_reference");
    const bandMin = targetMetadata(canonicalTarget, "hr_band_bpm_min");
    const bandMax = targetMetadata(canonicalTarget, "hr_band_bpm_max");
    assert.equal(bandReference, authored.band_reference);
    assert.equal(typeof bandMin, "number");
    assert.equal(typeof bandMax, "number");
    const fullBandCommand = `${bandMin}-${bandMax} bpm`;
    assert.equal(
      targetMetadata(canonicalTarget, "hr_execution_range_kind"),
      authored.command === fullBandCommand ? "full_band" : "ai_selected_subrange",
    );
  } else {
    assert.equal(canonicalTarget?.extra?.pace_provenance, "benchmark_backed");
  }
}

function targetMetadata(target: ReturnType<typeof normalizeWorkoutDocumentTarget>, key: string) {
  return target?.extra?.[key];
}

const HR_TARGET_METADATA_KEYS = [
  "hr_zone_reference",
  "hr_profile_source",
  "hr_band_bpm_min",
  "hr_band_bpm_max",
  "hr_execution_range_kind",
] as const;

function assertCanonicalTargetWire(plan: TrainingPlanV2) {
  let targetCount = 0;
  for (const workout of plan.planned_workouts) {
    for (const segment of workout.segments) {
      if (segment.target) {
        targetCount += 1;
        assertCanonicalWireTarget(segment.target as unknown as Record<string, unknown>, "unit");
      }
      for (const child of segment.prescription?.children ?? []) {
        if (child.target) {
          targetCount += 1;
          assertCanonicalWireTarget(
            child.target as unknown as Record<string, unknown>,
            "repeat_child",
          );
        }
      }
    }
  }
  assert.ok(targetCount > 0, "Export proof requires executable targets.");
}

function assertCanonicalWireTarget(
  target: Record<string, unknown>,
  location: "unit" | "repeat_child",
) {
  assert.equal(
    "extra" in target,
    false,
    "New TrainingPlanV2 exports must use one flat target metadata representation.",
  );
  if (target.primary_execution_mode !== "heart_rate") return;
  for (const key of HR_TARGET_METADATA_KEYS) {
    assert.ok(
      typeof target[key] === "string" || typeof target[key] === "number",
      `Exported HR target requires flat ${key}.`,
    );
  }
  if (location === "unit") canonicalWireCoverage.unitHeartRate = true;
  if (location === "repeat_child") canonicalWireCoverage.repeatChildHeartRate = true;
}

function assertHistoricalNestedTargetCompatibility(plan: TrainingPlanV2) {
  const historical = structuredClone(plan);
  const target = firstWireHeartRateTarget(historical);
  const nested: Record<string, string | number> = {};
  for (const key of HR_TARGET_METADATA_KEYS) {
    const value = target[key];
    assert.ok(typeof value === "string" || typeof value === "number");
    nested[key] = value;
    delete target[key];
  }
  target.extra = nested;
  assert.equal(
    importedPlanSchema.safeParse(historical).success,
    true,
    "Historical nested target metadata must remain readable.",
  );

  const identicalDual = structuredClone(plan);
  const identicalTarget = firstWireHeartRateTarget(identicalDual);
  identicalTarget.extra = Object.fromEntries(
    HR_TARGET_METADATA_KEYS.map((key) => [key, identicalTarget[key] as string | number]),
  );
  assert.equal(
    importedPlanSchema.safeParse(identicalDual).success,
    true,
    "Identical flat and nested historical metadata must remain readable.",
  );
}

function assertContradictoryTargetMetadataRejected(plan: TrainingPlanV2) {
  for (const key of HR_TARGET_METADATA_KEYS) {
    const contradictory = structuredClone(plan);
    const target = firstWireHeartRateTarget(contradictory);
    const flatValue = target[key];
    assert.ok(typeof flatValue === "string" || typeof flatValue === "number");
    target.extra = {
      [key]: typeof flatValue === "number" ? flatValue + 1 : `${flatValue}-conflict`,
    };
    const result = importedPlanSchema.safeParse(contradictory);
    assert.equal(result.success, false, `Contradictory ${key} metadata must be rejected.`);
    if (!result.success) {
      assert.match(
        JSON.stringify(result.error.issues),
        new RegExp(`conflicts with target\\.extra\\.${key}`),
      );
    }
  }
}

function firstWireHeartRateTarget(plan: TrainingPlanV2) {
  const target = collectWireTargets(plan).find(
    (candidate) => candidate.primary_execution_mode === "heart_rate",
  );
  assert.ok(target, "Export proof requires a heart-rate target.");
  return target;
}

function collectWireTargets(plan: TrainingPlanV2) {
  const targets: Array<Record<string, string | number | Record<string, string | number>>> = [];
  for (const workout of plan.planned_workouts) {
    for (const segment of workout.segments) {
      if (segment.target) {
        targets.push(segment.target as (typeof targets)[number]);
      }
      for (const child of segment.prescription?.children ?? []) {
        if (child.target) {
          targets.push(child.target as (typeof targets)[number]);
        }
      }
    }
  }
  return targets;
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

export function buildLargeReadbackProviderFixture() {
  const input: RunningPlanPreviewActionInput = {
    ...buildScenarioInput({
      name: "52-week readback capacity",
      distance: { kind: "preset", preset: "Marathon" },
      weeks: 52,
    }),
    fixedRestDays: null,
    preferredLongRunDay: null,
  };
  const authoringInput = requireAuthoringInput(input);
  const startDate = authoringInput.schedule.startDate;
  const endpointDate = authoringInput.planGoalIntent.targetDate;
  const distance = authoringInput.planGoalIntent.distance;
  if (!endpointDate || !distance) {
    throw new Error("Large readback fixture requires a selected distance and target date.");
  }

  const workouts: AiAuthoredPlanFirstCompilerDraft["workouts"] = [];
  const targetContext = { z2Command: heartRateCommand(authoringInput, "Z2") };

  for (
    let date = startDate;
    date < endpointDate && workouts.length < 210;
    date = addDaysIso(date, 1)
  ) {
    const weekday = weekdayLong(date);
    if (weekday === "Saturday" || weekday === "Sunday") continue;
    workouts.push(buildAuthoredWorkout(date, Math.floor(workouts.length / 5), 0, targetContext));
  }

  assert.equal(
    workouts.length,
    210,
    "Large readback fixture must contain 210 pre-endpoint workouts.",
  );

  return {
    input,
    draft: {
      workouts,
      endpoint: {
        date: endpointDate,
        phase: "Goal",
        workout_identity: "selected_distance_completion_or_checkpoint",
        title: "Selected-distance endpoint",
        cue: "Execute the authored selected-distance plan.",
        sections: [
          {
            kind: "unit" as const,
            segment_type: "main" as const,
            label: "Selected distance",
            cue: "Complete the selected distance.",
            prescription: { mode: "distance" as const, distance_km: distance.distanceKm },
            target: paceTarget("5:20-5:30/km"),
          },
        ],
      },
    } satisfies AiAuthoredPlanFirstCompilerDraft,
  };
}

function buildProviderDraft(
  input: AiGeneratedRunningPlanPreviewInput,
  weeks: number,
): AiAuthoredPlanFirstCompilerDraft {
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
  const workouts: AiAuthoredPlanFirstCompilerDraft["workouts"] = [];
  const targetContext = {
    z2Command: heartRateCommand(resolved.authoringInput, "Z2"),
  };

  for (let week = 0; week < weeks; week += 1) {
    const offsets = [0, 2, 4, 6];
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
): AiAuthoredPlanFirstCompilerDraft["workouts"][number] {
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
      sections: buildPolicyCompliantLongRunSections(60 + week, targetContext.z2Command),
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
              band_reference: "Z2",
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
  target: AiAuthoredPlanFirstCompilerUnit["target"],
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

function findTypedRepeatSection(draft: AiAuthoredPlanFirstCompilerDraft) {
  const repeat = draft.workouts
    .flatMap((workout) => workout.sections)
    .find((section) => section.kind === "repeat");
  assert.ok(repeat?.kind === "repeat");
  if (!repeat || repeat.kind !== "repeat") throw new Error("Repeat section is required.");
  return repeat;
}

function findUnitSection(draft: AiAuthoredPlanFirstCompilerDraft) {
  const unit = draft.workouts
    .flatMap((workout) => workout.sections)
    .find((section) => section.kind === "unit");
  assert.ok(unit?.kind === "unit");
  if (!unit || unit.kind !== "unit") throw new Error("Unit section is required.");
  return unit;
}

function findTypedHeartRateTarget(draft: AiAuthoredPlanFirstCompilerDraft) {
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
  draft: AiAuthoredPlanFirstCompilerDraft,
  replacement: AiAuthoredPlanFirstCompilerUnit["target"],
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

function paceTarget(pace: string): AiAuthoredPlanFirstCompilerUnit["target"] {
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
  const zone = profile.zones.find((candidate) => candidate.reference === reference);
  assert.ok(zone);
  return `${zone.minBpm}-${zone.maxBpm} bpm`;
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

function findFirstDirectRunnableLeaf(draft: AiAuthoredPlanFirstCompilerDraft) {
  for (const section of draft.workouts.flatMap((workout) => workout.sections)) {
    if (section.kind === "unit") return section;
    if (section.kind === "repeat" && section.children[0]) return section.children[0];
  }
  for (const section of draft.endpoint.sections) {
    if (section.kind === "unit") return section;
    if (section.kind === "repeat" && section.children[0]) return section.children[0];
  }
  throw new Error("Direct provider draft requires one runnable leaf.");
}

function findDirectHeartRateTarget(draft: AiAuthoredPlanFirstCompilerDraft) {
  for (const workout of [...draft.workouts, draft.endpoint]) {
    for (const section of workout.sections) {
      if (section.kind === "unit" && section.target.primary_execution_mode === "heart_rate") {
        return section.target;
      }
      if (section.kind !== "repeat") continue;
      for (const child of section.children) {
        if (child.target.primary_execution_mode === "heart_rate") return child.target;
      }
    }
  }
  throw new Error("Expected a direct heart-rate target.");
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
