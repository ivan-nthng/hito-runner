import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
  AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  isAiGeneratedRunningPlanDevFixtureEnabled,
  resolveAiGeneratedRunningPlanDevFixtureDelayMs,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import {
  attachOutputToAiPlanGenerationLedgerTrace,
  createAiPlanGenerationLedgerTrace,
  updateAiPlanGenerationLedgerTrace,
} from "../src/lib/ai-plan-generation-ledger";
import { queryLocalRuntimeEvents } from "../src/lib/local-runtime-observability";
import {
  AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  compileAiAuthoredPlanFirstDraft,
} from "../src/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN,
  AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
  buildAiAuthoredPlanFirstOpenAiSchema,
  type AiAuthoredPlanFirstProviderDraft,
  type AiAuthoredPlanFirstProviderUnit,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildAiGeneratedRunningPlanPreview as buildAiGeneratedRunningPlanPreviewRuntime,
  buildAiGeneratedRunningPlanAuthoringInput as buildAiGeneratedRunningPlanAuthoringInputRuntime,
} from "../src/lib/ai-generated-running-plan";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import { buildReviewedFirstPlanImportedSeed } from "../src/lib/active-plan-persistence";
import { buildPersistedWorkoutInsertRows } from "../src/lib/persisted-plan-replacement";
import {
  buildReviewedAiGeneratedRunningPlanPreview as buildReviewedAiGeneratedRunningPlanPreviewRuntime,
  confirmRunningPlanDraftForUser,
  runningPlanPreviewInputSchema,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  buildRunningPlanCanonicalPlan,
  buildRunningPlanPersistenceMetadata,
  validateRunningPlanReviewExactness,
  validateSelfContainedRunningPlanReviewToken,
} from "../src/lib/running-plan-engine-review";
import { selectedDistanceEndpointMainDistanceMeters } from "../src/lib/plan-creation-engine";
import { structuredPlanAuthoringInputSchema } from "../src/lib/structured-plan-authoring-schema";
import { addDaysIso, diffDaysIso, weekdayLong } from "../src/lib/training";
import {
  normalizeWorkoutDocumentTarget,
  readWorkoutDocumentSections,
  workoutDocumentTargetToWire,
} from "../src/lib/workout-document";
import { validatePlanFirstProviderRepresentationContract } from "./plan-first-provider-representation-proof";
import {
  buildProofPersonalRunnerProfileSnapshot,
  buildProofRunnerProfileSnapshot,
} from "./runner-profile-snapshot-proof-helpers";

const baseInput = {
  age: 36,
  heightCm: 178,
  weightKg: 74,
  runnerLevel: "runs_a_lot",
  daysPerWeek: 5,
  fixedRestDays: ["Wednesday", "Saturday"],
  preferredLongRunDay: "Sunday",
  startDate: "2026-06-08",
  benchmark: { kind: "unknown" },
} as const;

const scenarios = [
  {
    name: "10K no benchmark",
    input: {
      ...baseInput,
      runnerLevel: "sometimes_runs",
      planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
    },
    expectedEndpointMeters: 10_000,
  },
  {
    name: "Half Marathon target time",
    input: {
      ...baseInput,
      startDate: "2026-07-02",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2026-11-26",
        targetFinishTime: "2:00:00",
      },
    },
    expectedEndpointMeters: 21_100,
    expectedFinalDate: "2026-11-26",
    expectedNonRepeatTempo: true,
  },
  {
    name: "Marathon target time",
    input: {
      ...baseInput,
      startDate: "2026-07-20",
      fixedRestDays: ["Tuesday", "Saturday"],
      preferredLongRunDay: "Sunday",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Marathon" },
        targetDate: "2026-12-20",
        targetFinishTime: "4:00:00",
      },
    },
    expectedEndpointMeters: 42_195,
    expectedFinalDate: "2026-12-20",
  },
  {
    name: "Custom 15K target time",
    input: {
      ...baseInput,
      startDate: "2026-07-06",
      planGoalIntent: {
        distance: { kind: "custom", distanceKm: 15, label: "15K" },
        targetDate: "2026-10-04",
        targetFinishTime: "1:25:00",
      },
    },
    expectedEndpointMeters: 15_000,
    expectedFinalDate: "2026-10-04",
  },
] satisfies Array<{
  name: string;
  input: RunningPlanPreviewActionInput;
  expectedEndpointMeters: number;
  expectedFinalDate?: string;
  expectedNonRepeatTempo?: boolean;
}>;

function buildAiGeneratedRunningPlanAuthoringInput(
  input: RunningPlanPreviewActionInput,
  profileSnapshot = buildProofRunnerProfileSnapshot(input),
) {
  return buildAiGeneratedRunningPlanAuthoringInputRuntime(input, profileSnapshot);
}

function buildAiGeneratedRunningPlanPreview(
  input: RunningPlanPreviewActionInput,
  options: Parameters<typeof buildAiGeneratedRunningPlanPreviewRuntime>[1] = {},
) {
  return buildAiGeneratedRunningPlanPreviewRuntime(input, {
    ...options,
    runnerProfileSnapshot: options.runnerProfileSnapshot ?? buildProofRunnerProfileSnapshot(input),
  });
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

await validatePlanFirstPreviewScenarios();
await validatePlanFirstAuthoringAuthority();
await validateProviderContractBoundary();
await validateFaithfulPlanFirstAtomization();
validateDistanceFirstInputTruth();
await validateFirstPlanGenerationLifecycle();
await validateTypedPlanFirstFailureOutcomes();
await validateInvalidProviderOutputFailsBeforeReview();
await validatePathologicalProviderNumberFailsBeforeReview();
await validateProviderStructuralBoundsFailBeforeReview();
await validatePlanFirstProviderRepresentationContract();
await validateLocalDevFixtureAvailabilityGating();
await validateLocalGenerationIncidentTrail();
validateNoLegacyGeneratedPlanAuthoringSourceImports();

console.log("AI-generated plan-first creation contract checks passed.", {
  scenarios: scenarios.map((scenario) => scenario.name),
  sourceKind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
  contractMode: "plan_first",
});

async function validatePlanFirstPreviewScenarios() {
  for (const scenario of scenarios) {
    const result = await buildReviewedAiGeneratedRunningPlanPreview(scenario.input, {
      aiPreview: buildScenarioAiPreviewOptions(scenario.input, {
        nonRepeatTempo: "expectedNonRepeatTempo" in scenario,
      }),
    });

    assert.equal(
      result.ok,
      true,
      result.ok
        ? `${scenario.name} must produce reviewed plan-first preview.`
        : `${scenario.name} failed: ${result.unavailable.error.message}`,
    );
    if (!result.ok) throw new Error(result.unavailable.error.message);

    const canonicalPlan = await assertReviewedDraftExactness({
      scenarioName: scenario.name,
      draft: result.draft,
      expectedEndpointMeters: scenario.expectedEndpointMeters,
      expectedFinalDate: scenario.expectedFinalDate,
    });

    assert.equal(result.draft.sourceKind, AI_AUTHORED_PLAN_FIRST_SOURCE_KIND);
    assert.equal(result.draft.aiGeneration.status, "ai_authored");
    assert.equal(result.draft.reviewSafety.confirmCallsOpenAi, false);
    assert.equal(result.draft.reviewSafety.trustedClientRows, false);
    assert.equal(
      result.draft.normalizedInputSummary.planGoalIntent?.distance?.distanceMeters,
      scenario.expectedEndpointMeters,
    );
    assertPlanFirstGuidanceAndRepeatShape({
      scenarioName: scenario.name,
      canonicalPlan,
    });
    assertPreviewTargetTruth({
      scenarioName: scenario.name,
      canonicalPlan,
      calendarRows: result.draft.calendarRows,
    });
    if (scenario.name === "10K no benchmark") {
      const runWalkRow = result.draft.calendarRows.find((row) => row.title === "Run/Walk");
      assert.ok(runWalkRow, "Beginner fixture must expose its authored Run/Walk contact.");
      assert.equal(
        runWalkRow.workoutDayKind,
        "recovery",
        "Run/Walk adaptation must not be reclassified as intervals because it uses Repeat children.",
      );
    }
    assert.deepEqual(
      result.draft.workoutDocuments,
      buildImportedPlanSeed(canonicalPlan).workouts,
      `${scenario.name} reviewed preview must return the canonical backend WorkoutDocument read model.`,
    );
    if ("expectedNonRepeatTempo" in scenario && scenario.expectedNonRepeatTempo) {
      assert.equal(result.draft.aiGeneration.generationTrace?.provider.kind, "local_dev_fixture");
      assert.equal(result.draft.aiGeneration.generationTrace?.provider.paidProviderCall, false);
      assertNonRepeatTempoFixtureReviewTruth({
        scenarioName: scenario.name,
        canonicalPlan,
        calendarRows: result.draft.calendarRows,
      });
    }
    assertNoLegacyOrDebugReadback({
      scenarioName: scenario.name,
      value: {
        draft: result.draft,
        canonicalPlan,
        importedSeed: buildImportedPlanSeed(canonicalPlan),
        reviewedSeed: buildReviewedFirstPlanImportedSeed(canonicalPlan),
      },
    });
  }
}

async function validatePlanFirstAuthoringAuthority() {
  const ambitiousShortHorizonInput = {
    ...baseInput,
    benchmark: { kind: "unknown" as const },
    startDate: "2026-07-06",
    planGoalIntent: {
      distance: { kind: "preset" as const, preset: "Marathon" as const },
      targetDate: "2026-07-12",
      targetFinishTime: "1:30:00",
    },
  };
  const authoring = buildAiGeneratedRunningPlanAuthoringInput(ambitiousShortHorizonInput);
  assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
  if (!authoring.ok) throw new Error(authoring.message);
  assert.equal(authoring.normalizedInputSummary.loadContext, "ai_authored");

  const missingAcceptedBaseline = buildAiGeneratedRunningPlanAuthoringInputRuntime(
    ambitiousShortHorizonInput,
    null,
  );
  assert.deepEqual(missingAcceptedBaseline, {
    ok: false,
    reason: "structured_input_invalid",
    message: "Save and accept the runner baseline before creating a generated plan.",
  });

  const fixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: authoring.authoringInput,
    qaFixtureAuthorized: true,
    today: ambitiousShortHorizonInput.startDate,
    env: {
      LOCAL_AUTH_BYPASS_ENABLED: "true",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]: "true",
      [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "qa_fixture",
    },
  });
  assert.ok(fixtureOptions?.fetchImpl);
  let providerCalls = 0;
  const fixtureFetch = fixtureOptions!.fetchImpl!;
  const reviewed = await buildReviewedAiGeneratedRunningPlanPreview(ambitiousShortHorizonInput, {
    aiPreview: {
      ...fixtureOptions,
      generationLedger: { disabled: true },
      fetchImpl: async (url, init) => {
        providerCalls += 1;
        return fixtureFetch(url, init);
      },
    },
  });
  assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
  assert.equal(providerCalls, 1, "Every structurally valid future goal must reach AI authorship.");

  let invalidProviderCalls = 0;
  const invalid = await buildReviewedAiGeneratedRunningPlanPreview(
    {
      ...ambitiousShortHorizonInput,
      planGoalIntent: {
        ...ambitiousShortHorizonInput.planGoalIntent,
        targetDate: ambitiousShortHorizonInput.startDate,
      },
    },
    {
      aiPreview: {
        apiKey: "must-not-call-provider",
        fetchImpl: async () => {
          invalidProviderCalls += 1;
          throw new Error("Structurally invalid input reached provider.");
        },
      },
    },
  );
  assert.equal(invalid.ok, false);
  if (invalid.ok) throw new Error("Same-day target unexpectedly reached review.");
  assert.equal(invalid.unavailable.previewOutcome, "invalid_structural_input");
  assert.equal(invalid.unavailable.debug.generationTrace?.provider.kind, "not_started");
  assert.equal(invalid.unavailable.debug.generationTrace?.pipeline.finalOutcome, "rejected");
  assert.equal(
    invalid.unavailable.debug.generationTrace?.pipeline.unavailableReason,
    "invalid_plan_goal_intent",
  );
  assert.equal(invalidProviderCalls, 0);

  const missingAvailability = await buildReviewedAiGeneratedRunningPlanPreview(
    {
      ...ambitiousShortHorizonInput,
      daysPerWeek: null,
    },
    {
      aiPreview: {
        apiKey: "must-not-call-provider",
        fetchImpl: async () => {
          invalidProviderCalls += 1;
          throw new Error("Structurally insufficient input reached provider.");
        },
      },
    },
  );
  assert.equal(missingAvailability.ok, false);
  if (missingAvailability.ok) {
    throw new Error("Missing running-day availability unexpectedly reached review.");
  }
  assert.equal(missingAvailability.unavailable.previewOutcome, "invalid_structural_input");
  assert.equal(invalidProviderCalls, 0);
}

async function validateFaithfulPlanFirstAtomization() {
  const paceInput = {
    ...scenarios[0]!.input,
    benchmark: { kind: "recent_5k_pace" as const, recent5kPace: "5:30/km" },
  };
  const personalProfileSnapshot = buildProofPersonalRunnerProfileSnapshot(paceInput);
  assert.equal(personalProfileSnapshot.heartRateProfile.source, "personal");
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(paceInput, personalProfileSnapshot);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const authoringInput = resolved.authoringInput;
  const target = (input: {
    mode: "pace" | "heart_rate" | "effort" | "run_walk";
    pace?: string;
    hrZone?: Extract<
      AiAuthoredPlanFirstProviderUnit["target"],
      { primary_execution_mode: "heart_rate" }
    >["command"];
    effort?: string;
  }): AiAuthoredPlanFirstProviderUnit["target"] => {
    if (input.mode === "pace") {
      return {
        primary_execution_mode: "pace",
        command: input.pace ?? "5:30/km",
      };
    }
    if (input.mode === "heart_rate") {
      return {
        primary_execution_mode: "heart_rate",
        command: input.hrZone ?? "Z2",
      };
    }

    return {
      primary_execution_mode: input.mode,
      command: input.effort ?? "Execute",
    };
  };
  const unit = (input: {
    segmentType: "warmup" | "main" | "tempo_block" | "cooldown";
    label: string;
    durationMin?: number;
    distanceKm?: number;
    target: ReturnType<typeof target>;
  }) => ({
    kind: "unit" as const,
    segment_type: input.segmentType,
    label: input.label,
    cue: null,
    prescription:
      input.distanceKm != null
        ? { mode: "distance" as const, distance_km: input.distanceKm }
        : { mode: "time" as const, duration_min: input.durationMin! },
    target: input.target,
  });
  const draft = {
    workouts: [
      {
        date: "2026-06-08",
        phase: "Specific",
        workout_identity: "race_pace_session",
        title: "Coach-authored race pace",
        cue: "Execute the authored race-pace structure.",
        sections: [
          unit({
            segmentType: "main",
            label: "Race pace",
            durationMin: 15,
            target: target({ mode: "pace", pace: "5:00-5:10/km" }),
          }),
        ],
      },
      {
        date: "2026-06-09",
        phase: "Build",
        workout_identity: "controlled_tempo_session",
        title: "Coach-authored continuous Tempo",
        cue: "Continuous authored tempo.",
        sections: [
          unit({
            segmentType: "tempo_block",
            label: "Tempo",
            durationMin: 20,
            target: target({
              mode: "pace",
              pace: "5:00-5:10/km",
            }),
          }),
        ],
      },
      {
        date: "2026-06-11",
        phase: "Build",
        workout_identity: "distance_intervals",
        title: "Coach-authored mixed intervals",
        cue: "Complete the authored mixed interval sequence.",
        sections: [
          {
            kind: "repeat",
            segment_type: "interval_block",
            label: "Ordered set",
            cue: null,
            rounds: 3,
            children: [
              {
                role: "run",
                label: "Settle",
                cue: null,
                prescription: { mode: "time", duration_min: 1 },
                target: target({ mode: "effort", effort: "Settle into smooth form" }),
              },
              {
                role: "work",
                label: "Work",
                cue: null,
                prescription: { mode: "time", duration_min: 2 },
                target: target({ mode: "pace", pace: "4:50/km" }),
              },
              {
                role: "recover",
                label: "Float",
                cue: null,
                prescription: { mode: "time", duration_min: 1 },
                target: target({ mode: "effort", effort: "Easy float" }),
              },
              {
                role: "finish",
                label: "Finish",
                cue: null,
                prescription: { mode: "time", duration_min: 0.5 },
                target: target({ mode: "effort", effort: "Finish with relaxed form" }),
              },
            ],
          },
          {
            kind: "repeat",
            segment_type: "strides",
            label: "Strides",
            cue: null,
            rounds: 4,
            children: [
              {
                role: "work",
                label: "Stride",
                cue: null,
                prescription: { mode: "time", duration_min: 1 / 3 },
                target: target({ mode: "effort", effort: "Relaxed-fast and smooth" }),
              },
            ],
          },
          {
            kind: "repeat",
            segment_type: "interval_block",
            label: "Two 4km rounds",
            cue: null,
            rounds: 2,
            children: [
              {
                role: "work",
                label: "4km",
                cue: null,
                prescription: { mode: "distance", distance_km: 4 },
                target: target({ mode: "pace", pace: "5:00/km" }),
              },
            ],
          },
          unit({
            segmentType: "main",
            label: "Final one-off 2km",
            distanceKm: 2,
            target: target({ mode: "pace", pace: "4:55/km" }),
          }),
        ],
      },
      {
        date: "2026-06-12",
        phase: "Endurance",
        workout_identity: "long_aerobic_run",
        title: "Coach-authored Long Run",
        cue: "Complete the authored long aerobic duration.",
        sections: [
          unit({
            segmentType: "main",
            label: "Main",
            durationMin: 60,
            target: target({ mode: "heart_rate", hrZone: "Z2" }),
          }),
        ],
      },
      {
        date: "2026-06-14",
        phase: "Terrain",
        workout_identity: "technical_trail_easy",
        title: "Coach-authored trail run",
        cue: "Follow the authored trail structure.",
        sections: [
          unit({
            segmentType: "main",
            label: "Trail",
            durationMin: 40,
            target: target({ mode: "effort", effort: "Controlled trail effort" }),
          }),
        ],
      },
    ],
    endpoint: {
      date: "2026-06-15",
      phase: "Goal",
      workout_identity: "selected_distance_completion_or_checkpoint",
      title: "Coach-authored 10K endpoint",
      cue: "Complete the authored selected-distance endpoint.",
      sections: [
        unit({
          segmentType: "warmup",
          label: "Warmup",
          distanceKm: 0.5,
          target: target({ mode: "effort", effort: "Easy warmup" }),
        }),
        unit({
          segmentType: "main",
          label: "Main",
          distanceKm: 10,
          target: target({ mode: "effort", effort: "Reviewed race effort" }),
        }),
        unit({
          segmentType: "cooldown",
          label: "Cooldown",
          distanceKm: 0.5,
          target: target({ mode: "effort", effort: "Easy cooldown" }),
        }),
      ],
    },
  } satisfies AiAuthoredPlanFirstProviderDraft;

  const compiled = compileAiAuthoredPlanFirstDraft({ draft, authoringInput });
  assert.equal(compiled.ok, true, compiled.ok ? "" : JSON.stringify(compiled.issues));
  if (!compiled.ok) throw new Error(JSON.stringify(compiled.issues));
  assert.doesNotMatch(
    JSON.stringify(compiled.canonicalPlan.goal),
    /authored_outcome_target|authored_horizon|assumptions/,
    "Compiled goal truth must not contain generic plan-level narrative metadata.",
  );
  assert.equal(
    compiled.canonicalPlan.training_constraints?.running_days_per_week,
    5,
    "Compiled plan density must describe AI-authored workout dates.",
  );
  assert.equal(
    compiled.canonicalPlan.plan_preferences?.max_running_days_per_week,
    5,
    "Runner-declared maximum availability must remain a separate constraint.",
  );

  const tempo = compiled.canonicalPlan.planned_workouts.find(
    (workout) => workout.workout_identity === "controlled_tempo_session",
  );
  assert.ok(tempo);
  assert.equal(tempo.segments[0]?.segment_type, "tempo_block");
  assert.equal(tempo.segments[0]?.prescription?.mode, "time");
  assert.equal(tempo.segments[0]?.target?.primary_execution_mode, "pace");
  assert.equal(tempo.segments[0]?.target?.pace, "5:00-5:10/km");
  assert.equal(tempo.segments[0]?.target?.intensity, undefined);
  assert.equal(tempo.segments[0]?.target?.hint, undefined);
  assert.equal(tempo.segments[0]?.target?.extra?.hr_zone, undefined);
  assert.equal(tempo.segments[0]?.target?.hr_bpm_range, undefined);
  assert.equal(tempo.segments[0]?.target?.hr_target_source, "effort_only");
  assert.equal(tempo.segments[0]?.target?.cue, undefined);

  const faithfulReadback = buildImportedPlanSeed(compiled.canonicalPlan);
  const tempoReadback = faithfulReadback.workouts.find(
    (workout) => workout.sourceWorkoutId === tempo.workout_id,
  );
  const tempoReadbackTarget = tempoReadback?.steps[0]?.target;
  assert.equal(tempoReadbackTarget?.primary_execution_mode, "pace");
  assert.equal(tempoReadbackTarget?.pace, "5:00-5:10/km");
  assert.equal(tempoReadbackTarget?.intensity, undefined);
  assert.equal(tempoReadbackTarget?.hint, undefined);
  assert.equal(tempoReadbackTarget?.extra?.hr_zone, undefined);
  assert.equal(tempoReadbackTarget?.hr_bpm_range, undefined);
  const tempoExportTarget = workoutDocumentTargetToWire(tempoReadbackTarget);
  assert.equal(tempoExportTarget?.primary_execution_mode, "pace");
  assert.equal(tempoExportTarget?.pace, "5:00-5:10/km");
  assert.equal(tempoExportTarget?.intensity, undefined);
  assert.equal(tempoExportTarget?.hint, undefined);
  assert.equal(tempoExportTarget?.hr_zone, undefined);
  assert.equal(tempoExportTarget?.hr_bpm_range, undefined);
  const tempoExportRoundTrip = normalizeWorkoutDocumentTarget(tempoExportTarget);
  assert.equal(tempoExportRoundTrip?.primary_execution_mode, "pace");
  assert.equal(tempoExportRoundTrip?.pace, "5:00-5:10/km");
  assert.equal(tempoExportRoundTrip?.intensity, undefined);
  assert.equal(tempoExportRoundTrip?.hint, undefined);
  assert.equal(tempoExportRoundTrip?.extra?.hr_zone, undefined);
  assert.equal(tempoExportRoundTrip?.hr_bpm_range, undefined);

  const persistedTempoRow = buildPersistedWorkoutInsertRows(
    "00000000-0000-4000-8000-000000000801",
    "00000000-0000-4000-8000-000000000802",
    faithfulReadback.workouts,
  ).find((row) => row.source_workout_id === tempo.workout_id);
  const persistedTempoTarget = readWorkoutDocumentSections(persistedTempoRow?.steps)[0]?.target;
  assert.deepEqual(
    persistedTempoTarget,
    tempoReadbackTarget,
    "Canonical persistence row shaping must preserve the AI-authored primary mode and pace command.",
  );

  const intervals = compiled.canonicalPlan.planned_workouts.find(
    (workout) => workout.workout_identity === "distance_intervals",
  );
  assert.ok(intervals);
  assert.equal(intervals.workout_identity, "distance_intervals");
  assert.equal(intervals.phase, "Build");
  assert.equal(intervals.planned_rpe, undefined);
  assert.equal(intervals.estimated_fatigue, undefined);
  assert.equal(intervals.recovery_priority, undefined);
  const orderedRepeat = intervals.segments[0]?.prescription;
  assert.equal(orderedRepeat?.mode, "repeats");
  if (orderedRepeat?.mode !== "repeats") throw new Error("Missing ordered Repeat proof.");
  assert.deepEqual(
    orderedRepeat.children?.map((child) => child.role),
    ["run", "work", "recover", "finish"],
  );
  assert.equal(orderedRepeat.children?.[0]?.target?.primary_execution_mode, "effort");
  assert.equal(orderedRepeat.children?.[1]?.target?.primary_execution_mode, "pace");
  assert.equal(orderedRepeat.children?.[1]?.target?.pace, "4:50/km");
  assert.equal(orderedRepeat.children?.[1]?.target?.hint, undefined);
  assert.equal(orderedRepeat.children?.[1]?.target?.extra?.hr_zone, undefined);
  assert.equal(orderedRepeat.children?.[1]?.target?.hr_bpm_range, undefined);
  assert.equal(intervals.metric_mode?.executable_mode, "pace_executable");
  assert.equal(intervals.metric_mode?.pace_targets_allowed, true);
  assert.equal(intervals.metric_mode?.hr_targets_allowed, false);
  const noRecoveryRepeat = intervals.segments[1]?.prescription;
  assert.equal(noRecoveryRepeat?.mode, "repeats");
  if (noRecoveryRepeat?.mode !== "repeats") throw new Error("Missing one-child Repeat proof.");
  assert.deepEqual(
    noRecoveryRepeat.children?.map((child) => child.role),
    ["work"],
  );
  assert.equal(noRecoveryRepeat.children?.[0]?.target?.primary_execution_mode, "effort");
  const twoByFourKm = intervals.segments[2]?.prescription;
  assert.equal(twoByFourKm?.mode, "repeats");
  assert.equal(twoByFourKm?.repeat_count, 2);
  assert.equal(twoByFourKm?.children?.[0]?.prescription?.distance_km, 4);
  assert.equal(intervals.segments[3]?.prescription?.mode, "distance");
  assert.equal(intervals.segments[3]?.prescription?.distance_km, 2);
  assert.equal(intervals.segments[3]?.target?.pace, "4:55/km");
  const readbackRepeat = buildImportedPlanSeed(compiled.canonicalPlan)
    .workouts.find((workout) => workout.sourceWorkoutId === intervals.workout_id)
    ?.steps.find((step) => step.prescription?.mode === "repeats");
  assert.deepEqual(
    readbackRepeat?.children?.map((child) => child.type),
    ["run", "work", "recovery", "finish"],
    "WorkoutDocument readback must preserve the canonical run child and ordered Repeat roles.",
  );

  const longRun = compiled.canonicalPlan.planned_workouts.find(
    (workout) => workout.workout_identity === "long_aerobic_run",
  );
  assert.equal(longRun?.workout_identity, "long_aerobic_run");
  assert.notEqual(longRun?.workout_identity, "taper_long_run");
  assert.equal(longRun?.segments[0]?.target?.primary_execution_mode, "heart_rate");
  assert.equal(longRun?.segments[0]?.target?.hr_target_source, "personal_hr_zone");
  assert.equal(longRun?.segments[0]?.target?.hr_bpm_range, "121-140 bpm");
  assert.equal(longRun?.segments[0]?.target?.pace, undefined);
  const endpoint = compiled.canonicalPlan.planned_workouts.at(-1);
  assert.equal(
    selectedDistanceEndpointMainDistanceMeters({
      endpointKind: endpoint?.source_workout_type,
      segments: endpoint?.segments ?? [],
    }),
    10_000,
    "Ancillary endpoint distance must not replace or inflate the selected-distance main truth.",
  );

  let previewProviderCalls = 0;
  const reviewedProjection = await buildReviewedAiGeneratedRunningPlanPreview(
    {
      ...scenarios[0]!.input,
      benchmark: { kind: "recent_5k_pace", recent5kPace: "5:30/km" },
    },
    {
      runnerProfileSnapshot: personalProfileSnapshot,
      aiPreview: {
        apiKey: "injected-provider-contract-proof",
        today: scenarios[0]!.input.startDate,
        fetchImpl: async () => {
          previewProviderCalls += 1;
          return openAiPlanFirstResponse("resp-faithful-projection", draft);
        },
      },
    },
  );
  assert.equal(
    reviewedProjection.ok,
    true,
    reviewedProjection.ok ? "" : JSON.stringify(reviewedProjection.unavailable),
  );
  if (!reviewedProjection.ok) {
    throw new Error(reviewedProjection.unavailable.error.message);
  }
  assert.equal(previewProviderCalls, 1);
  assert.ok(
    reviewedProjection.draft.calendarRows.some((row) => row.workoutDayKind === "race"),
    "Canonical race workouts must project without semantic relabeling.",
  );
  assert.ok(
    reviewedProjection.draft.calendarRows.some((row) => row.workoutDayKind === "trail"),
    "Canonical trail workouts must project without semantic relabeling.",
  );
  assert.equal(reviewedProjection.draft.endpointProof.endpointMainDistanceMeters, 10_000);

  const arbitraryTitleDraft = structuredClone(draft);
  arbitraryTitleDraft.workouts[2]!.title = "Coach Surprise Session";
  const arbitraryTitleResult = compileAiAuthoredPlanFirstDraft({
    draft: arbitraryTitleDraft,
    authoringInput,
  });
  assert.equal(
    arbitraryTitleResult.ok,
    true,
    "An authored title must remain independent from canonical workout classification.",
  );
  if (!arbitraryTitleResult.ok) throw new Error(JSON.stringify(arbitraryTitleResult.issues));
  const titledWorkout = arbitraryTitleResult.canonicalPlan.planned_workouts.find(
    (workout) => workout.title === "Coach Surprise Session",
  );
  assert.equal(titledWorkout?.workout_identity, "distance_intervals");
  assert.equal(titledWorkout?.source_workout_type, "distance_intervals");

  const unknownIdentityDraft = structuredClone(draft) as unknown as {
    workouts: Array<{ workout_identity: string }>;
  };
  unknownIdentityDraft.workouts[1]!.workout_identity = "coach_surprise_session";
  const unknownIdentityResult = compileAiAuthoredPlanFirstDraft({
    draft: unknownIdentityDraft,
    authoringInput,
  });
  assert.equal(unknownIdentityResult.ok, false);
  if (unknownIdentityResult.ok) throw new Error("Unknown identity unexpectedly compiled.");
  assert.match(JSON.stringify(unknownIdentityResult.issues), /workout_identity_invalid/);

  const runnerTargetResolved = buildAiGeneratedRunningPlanAuthoringInput(
    {
      ...scenarios[0]!.input,
      benchmark: { kind: "recent_5k_pace", recent5kPace: "5:30/km" },
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        targetFinishTime: "1:10:00",
      },
    },
    personalProfileSnapshot,
  );
  assert.equal(runnerTargetResolved.ok, true);
  if (!runnerTargetResolved.ok) throw new Error(runnerTargetResolved.message);
  const runnerTargetResult = compileAiAuthoredPlanFirstDraft({
    draft,
    authoringInput: runnerTargetResolved.authoringInput,
  });
  assert.equal(runnerTargetResult.ok, true);
  if (!runnerTargetResult.ok) throw new Error(JSON.stringify(runnerTargetResult.issues));
  assert.ok(
    runnerTargetResult.canonicalPlan.planned_workouts.every(
      (workout) => workout.goal_context?.target_time === "1:10:00",
    ),
    "Runner-entered finish time must remain exact canonical goal context without narrative metadata.",
  );
}

function validateDistanceFirstInputTruth() {
  const missingDistance = runningPlanPreviewInputSchema.safeParse({
    ...baseInput,
    planGoalIntent: { targetDate: "2026-10-04" },
  });
  assert.equal(
    missingDistance.success,
    false,
    "Generated-plan input must reject a missing planGoalIntent.distance before provider work.",
  );

  const exactDistance = buildAiGeneratedRunningPlanAuthoringInput({
    ...baseInput,
    planGoalIntent: {
      distance: { kind: "custom", distanceKm: 15, label: "Custom 15K" },
    },
  });
  assert.equal(exactDistance.ok, true, exactDistance.ok ? "" : exactDistance.message);
  if (!exactDistance.ok) throw new Error(exactDistance.message);
  assert.equal(exactDistance.planGoalIntent.distance?.distanceMeters, 15_000);
}

async function validateProviderContractBoundary() {
  const scenario = scenarios[1]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  let capturedRequest: { url: string; body: Record<string, unknown> } | null = null;
  const result = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "paid-provider-contract-plan-first-proof",
    model: "gpt-5-provider-contract-plan-first-proof",
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    timeoutMs: 5_000,
    maxOutputTokens: 12_000,
    fetchImpl: async (url, init) => {
      capturedRequest = {
        url: String(url),
        body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
      };

      return fixtureFetch(url, init);
    },
  });

  assert.equal(
    result.ok,
    true,
    result.ok ? "Provider contract proof must compile." : result.message,
  );
  if (!result.ok) throw new Error(result.message);

  assert.notEqual(capturedRequest, null, "Provider request must be captured.");
  if (!capturedRequest) throw new Error("Provider request was not captured.");

  const serializedRequest = JSON.stringify(capturedRequest.body);
  const requestInput = capturedRequest.body.input as Array<{
    role: string;
    content: Array<{ type: string; text: string }>;
  }>;
  const systemPrompt = requestInput.find((message) => message.role === "system")?.content[0]?.text;
  const userPrompt = requestInput.find((message) => message.role === "user")?.content[0]?.text;
  const responseSchema = (
    capturedRequest.body.text as { format?: { schema?: Record<string, unknown> } }
  )?.format?.schema;
  assert.ok(systemPrompt, "Provider request must include a system prompt.");
  assert.ok(userPrompt, "Provider request must include a user prompt.");
  assert.ok(responseSchema, "Provider request must include a strict response schema.");

  const providerFacts = JSON.parse(userPrompt) as {
    runnerFacts: {
      goal: {
        distance_meters: number;
        target_finish_time: string | null;
      };
      calendar: {
        start_date: string;
        latest_date: string;
        eligible_workout_weekdays: string[];
        rest_weekdays: string[];
        max_workouts_per_week: number;
      };
      runner: {
        age: number;
        height_cm: number;
        weight_kg: number;
        selected_fitness_level: string;
        first_session_adaptation: {
          required: boolean;
          opening_calendar_days?: number;
          minimum_adaptation_contacts?: number;
          first_true_long_run_not_before_calendar_day?: number;
        };
        benchmark: unknown;
        heart_rate_profile: {
          source: "estimated" | "personal";
          accepted: true;
          primary_command_eligible: boolean;
          zones: Array<{
            reference: string;
            min_bpm: number;
            max_bpm: number;
          }>;
        };
      };
    };
  };
  const schemaChars = JSON.stringify(responseSchema).length;
  const oldSchemaChars = 19_478;
  assert.match(capturedRequest.url, /\/v1\/responses$/);
  assert.match(serializedRequest, new RegExp(AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME));
  assert.match(systemPrompt, /flat workouts\[\].*endpoint/i);
  assert.match(systemPrompt, /ordered children\[\]/i);
  assert.match(systemPrompt, /rounds is the number of times the complete ordered children/i);
  assert.match(systemPrompt, /one-off ladder or progression/i);
  assert.match(systemPrompt, /2x4km followed by one final 2km/i);
  assert.match(systemPrompt, /coherent weekly training program/i);
  assert.match(systemPrompt, /support long runs and quality sessions/i);
  assert.match(systemPrompt, /final 14 calendar days before endpoint/i);
  assert.match(systemPrompt, /M:SS\/km or M:SS-M:SS\/km/i);
  assert.match(systemPrompt, /target_finish_time alone is not pace truth/i);
  assert.match(systemPrompt, /primary_execution_mode=pace/i);
  assert.match(systemPrompt, /primary_execution_mode=heart_rate/i);
  assert.match(systemPrompt, /Estimated source remains explicitly estimated/i);
  assert.match(systemPrompt, /Use Z1-Z5 references only as target\.command/i);
  assert.match(systemPrompt, /Never put pace and heart rate on the same leaf/i);
  assert.doesNotMatch(systemPrompt, /adaptation bridge|adaptation contacts|Long Run no earlier/i);
  assert.match(systemPrompt, /Author directly from the supplied runner facts/i);
  assert.ok(
    schemaChars < oldSchemaChars * 0.65,
    `Provider schema must stay at least 35% smaller than the retired ${oldSchemaChars}-character contract; received ${schemaChars}.`,
  );
  assert.ok(
    userPrompt.length < 3_000,
    `Provider facts must stay compact; received ${userPrompt.length}.`,
  );
  assert.doesNotMatch(userPrompt, /goalType|distance_build|planGoalIntent|metricTruthPolicy/i);
  assert.doesNotMatch(userPrompt, /allowBackToBackDays|Goal intent is|outcome pace may/i);
  assert.doesNotMatch(
    userPrompt,
    /baseline_|current_sessions|horizon_weeks|workout_mix|terrain|strength_or_mobility|effort_language/i,
  );
  const serializedSchema = JSON.stringify(responseSchema);
  assert.match(serializedSchema, /"number"/);
  assert.match(serializedSchema, /"integer"/);
  assert.match(serializedSchema, /duration_min|distance_km/);
  assert.match(serializedSchema, /"rounds"/);
  assert.match(serializedSchema, /complete ordered children array executes/i);
  assert.doesNotMatch(serializedSchema, /"repeat_count"/);
  assert.doesNotMatch(serializedSchema, /duration_seconds|distance_meters/);
  assert.doesNotMatch(serializedSchema, /metadata|warnings|assumptions|medical|goal/);
  const providerTitlePattern = (
    responseSchema.properties as {
      workouts: {
        items: {
          properties: {
            title: { pattern: string };
          };
        };
      };
    }
  ).workouts.items.properties.title.pattern;
  assert.equal(new RegExp(providerTitlePattern).test("Progression Z2-Z3"), true);
  assert.equal(new RegExp(providerTitlePattern).test("Progression by feel"), true);
  assert.equal(
    providerFacts.runnerFacts.goal.distance_meters,
    resolved.authoringInput.planGoalIntent.distance?.distanceMeters,
  );
  assert.equal(
    providerFacts.runnerFacts.goal.target_finish_time,
    resolved.authoringInput.planGoalIntent.targetFinishTime?.label ?? null,
  );
  assert.deepEqual(Object.keys(providerFacts.runnerFacts.goal).sort(), [
    "distance_meters",
    "target_finish_time",
  ]);
  assert.deepEqual(
    new Set([
      ...providerFacts.runnerFacts.calendar.eligible_workout_weekdays,
      ...providerFacts.runnerFacts.calendar.rest_weekdays,
    ]).size,
    7,
  );
  assert.deepEqual(
    providerFacts.runnerFacts.calendar.eligible_workout_weekdays.filter((day) =>
      providerFacts.runnerFacts.calendar.rest_weekdays.includes(day),
    ),
    [],
  );
  assert.equal(
    providerFacts.runnerFacts.calendar.max_workouts_per_week,
    resolved.authoringInput.availability.maxRunningDaysPerWeek,
  );
  assert.equal(
    providerFacts.runnerFacts.calendar.start_date,
    resolved.authoringInput.schedule.startDate,
  );
  assert.ok(
    providerFacts.runnerFacts.calendar.latest_date > providerFacts.runnerFacts.calendar.start_date,
  );
  const providerDatePattern = (
    responseSchema.properties as {
      workouts: {
        items: {
          properties: {
            date: { pattern: string };
          };
        };
      };
    }
  ).workouts.items.properties.date.pattern;
  assert.equal(
    new RegExp(providerDatePattern).test(resolved.authoringInput.schedule.startDate),
    !resolved.authoringInput.availability.fixedRestDays.includes(
      resolved.authoringInput.schedule.startWeekday,
    ),
  );
  const fixedRestDate = Array.from({ length: 7 }, (_, offset) =>
    addDaysIso(resolved.authoringInput.schedule.startDate, offset),
  ).find((date) => resolved.authoringInput.availability.fixedRestDays.includes(weekdayLong(date)));
  assert.ok(fixedRestDate, "Provider contract proof requires a fixed-rest date.");
  assert.equal(
    new RegExp(providerDatePattern).test(fixedRestDate!),
    false,
    "Strict provider schema must make fixed-rest dates unauthorable.",
  );
  assert.equal(providerFacts.runnerFacts.runner.heart_rate_profile.source, "estimated");
  assert.equal(providerFacts.runnerFacts.runner.heart_rate_profile.accepted, true);
  assert.equal(providerFacts.runnerFacts.runner.heart_rate_profile.primary_command_eligible, true);
  assert.equal(providerFacts.runnerFacts.runner.selected_fitness_level, "running_regularly");
  assert.equal(providerFacts.runnerFacts.runner.first_session_adaptation.required, false);
  assert.deepEqual(
    providerFacts.runnerFacts.runner.heart_rate_profile.zones.map((zone) => zone.reference),
    ["Z1", "Z2", "Z3", "Z4", "Z5"],
  );
  assert.ok(
    providerFacts.runnerFacts.runner.heart_rate_profile.zones.every(
      (zone) => Number.isInteger(zone.min_bpm) && Number.isInteger(zone.max_bpm),
    ),
  );
  assert.equal(
    "allowBackToBackDays" in resolved.authoringInput.availability,
    false,
    "Backend authoring input must not prescribe adjacency as coaching truth.",
  );
  assert.equal(
    structuredPlanAuthoringInputSchema.safeParse({
      ...resolved.authoringInput,
      runnerProfile: {
        experienceLevel: "consistent_runner",
        baselineSessionsPerWeek: 5,
      },
    }).success,
    false,
    "Retired backend coaching context must not be accepted as provider input.",
  );
  assert.deepEqual(Object.keys(providerFacts.runnerFacts.runner).sort(), [
    "age",
    "benchmark",
    "first_session_adaptation",
    "heart_rate_profile",
    "height_cm",
    "selected_fitness_level",
    "weight_kg",
  ]);
  assert.deepEqual(responseSchema, buildAiAuthoredPlanFirstOpenAiSchema(resolved.authoringInput));
  assert.equal(result.metadata.debug.contractMode, "plan_first");
  assert.equal(result.metadata.debug.responseSchemaMode, "responses_json_schema_plan_first_strict");
  assert.equal(result.metadata.generationTrace?.request.contractMode, "plan_first");
  assert.equal(result.canonicalPlan.source_kind, AI_AUTHORED_PLAN_FIRST_SOURCE_KIND);
}

async function validateFirstPlanGenerationLifecycle() {
  const scenario = scenarios[0]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const fixtureResponse = await fixtureFetch("https://api.openai.com/v1/responses", {});
  const completedBody = (await fixtureResponse.json()) as Record<string, unknown>;
  const delayedFixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: resolved.authoringInput,
    qaFixtureAuthorized: true,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    env: {
      LOCAL_AUTH_BYPASS_ENABLED: "true",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]: "true",
      [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "qa_fixture",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV]: "120001",
    },
  });
  assert.notEqual(delayedFixtureOptions, null);
  if (!delayedFixtureOptions?.fetchImpl) {
    throw new Error("Delayed local plan-first fixture fetch was not configured.");
  }

  const originalDateNow = Date.now;
  const originalSetTimeout = globalThis.setTimeout;
  let fakeNow = Date.UTC(2026, 6, 16, 12, 0, 0);
  let completeCallCount = 0;
  let scheduledFixtureDelayMs = 0;
  const delayedFixtureFetch = delayedFixtureOptions.fetchImpl;

  Date.now = () => fakeNow;
  globalThis.setTimeout = ((callback: (...args: unknown[]) => void, delay?: number) => {
    scheduledFixtureDelayMs = Number(delay ?? 0);
    fakeNow += scheduledFixtureDelayMs;
    queueMicrotask(callback);
    return 1 as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;
  try {
    const result = await buildReviewedAiGeneratedRunningPlanPreview(scenario.input, {
      aiPreview: {
        ...delayedFixtureOptions,
        generationLedger: { disabled: true },
        fetchImpl: async (url, init) => {
          completeCallCount += 1;
          return delayedFixtureFetch(url, init);
        },
      },
    });

    assert.equal(
      result.ok,
      true,
      "The opted-in local fixture response after 120 seconds must reach ordinary review.",
    );
    if (!result.ok) throw new Error(result.unavailable.error.message);
    assert.equal(scheduledFixtureDelayMs, 120_001);
    assert.equal(completeCallCount, 1, "Late completion must not trigger a second provider call.");
    assert.equal(result.draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.kind, "local_dev_fixture");
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.paidProviderCall, false);
    assert.equal(result.draft.aiGeneration.debug?.timeoutMs, 0);
    assert.ok(result.draft.aiGeneration.elapsedMs >= 120_001);
    assert.ok(result.draft.reviewToken.length >= 16);
    assert.equal(result.draft.reviewChecksum.length, 64);
    assert.equal(result.draft.reviewSafety.confirmPathImplemented, true);
    assert.equal(result.draft.reviewSafety.persisted, false);
  } finally {
    Date.now = originalDateNow;
    globalThis.setTimeout = originalSetTimeout;
  }

  const cancelled = await runCancelledFirstPlanRequest({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  assertUnavailableLifecycleResult(cancelled.result, {
    expectedReason: /cancelled/,
    expectedRequestPhase: "request_cancelled",
  });
  assert.equal(cancelled.callCount, 1);
  assert.equal(cancelled.result.metadata.generationTrace?.pipeline.finalOutcome, "cancelled");

  let providerFailureCallCount = 0;
  const providerFailure = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "provider-failure-plan-first-proof",
    model: "provider-failure-plan-first-proof",
    generationLedger: { disabled: true },
    fetchImpl: async () => {
      providerFailureCallCount += 1;
      return jsonResponse(
        {
          id: "resp_provider_failure_plan_first",
          status: "failed",
          error: { message: "Injected provider failure." },
        },
        503,
      );
    },
  });
  assertUnavailableLifecycleResult(providerFailure, {
    expectedReason: /request_failed/,
    expectedRequestPhase: "request_failed",
  });
  assert.equal(providerFailureCallCount, 1);

  let incompleteCallCount = 0;
  const incomplete = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "incomplete-plan-first-proof",
    model: "incomplete-plan-first-proof",
    generationLedger: { disabled: true },
    fetchImpl: async () => {
      incompleteCallCount += 1;
      return jsonResponse({
        ...completedBody,
        id: "resp_incomplete_plan_first",
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
      });
    },
  });
  assertUnavailableLifecycleResult(incomplete, {
    expectedReason: /incomplete_output/,
    expectedRequestPhase: "response_incomplete",
  });
  assert.equal(incompleteCallCount, 1);
  assert.equal(incomplete.metadata.responseId, "resp_incomplete_plan_first");
  assert.equal(incomplete.metadata.debug.responseIncompleteReason, "max_output_tokens");
}

async function runCancelledFirstPlanRequest(input: {
  authoringInput: Extract<
    ReturnType<typeof buildAiGeneratedRunningPlanAuthoringInput>,
    { ok: true }
  >["authoringInput"];
  today: string;
}) {
  const controller = new AbortController();
  let callCount = 0;
  let markFetchStarted!: () => void;
  const fetchStarted = new Promise<void>((resolve) => {
    markFetchStarted = resolve;
  });
  const resultPromise = generateAiFirstPlanDraftPreview({
    input: input.authoringInput,
    apiKey: "cancelled-plan-first-proof",
    model: "cancelled-plan-first-proof",
    today: input.today,
    signal: controller.signal,
    generationLedger: { disabled: true },
    fetchImpl: async (_url, init) => {
      callCount += 1;
      markFetchStarted();
      const requestSignal = init?.signal;

      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener(
          "abort",
          () => reject(new DOMException("Injected cancellation.", "AbortError")),
          { once: true },
        );
      });
    },
  });

  await fetchStarted;
  controller.abort("runner_cancelled");

  return { result: await resultPromise, callCount };
}

async function validateTypedPlanFirstFailureOutcomes() {
  const scenario = scenarios[0]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const fixtureResponse = await fixtureFetch("https://api.openai.com/v1/responses", {});
  const completedBody = (await fixtureResponse.json()) as { output_text: string };
  const invalidCompilerDraft = JSON.parse(
    completedBody.output_text,
  ) as AiAuthoredPlanFirstProviderDraft;
  const runningDay = invalidCompilerDraft.workouts[0];
  assert.ok(runningDay, "Fixture must expose a running day.");
  runningDay.date = "2026-06-10";
  const originalFixtureFlag = process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
  process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = "0";

  try {
    const notConfigured = await buildAiGeneratedRunningPlanPreview(scenario.input, {
      aiPreview: {
        apiKey: null,
        generationLedger: { disabled: true },
      },
    });
    assert.equal(notConfigured.ok, false);
    if (notConfigured.ok)
      throw new Error("Missing provider credentials unexpectedly produced a draft.");
    assert.equal(notConfigured.unavailable.previewOutcome, "provider_runtime_failure");
    assert.equal(notConfigured.unavailable.debug.generationTrace?.provider.kind, "not_started");
    assert.equal(notConfigured.unavailable.debug.generationTrace?.provider.paidProviderCall, false);

    const cases = [
      {
        expected: "provider_runtime_failure",
        fetchImpl: async () =>
          jsonResponse(
            {
              id: "resp_typed_provider_failure",
              status: "failed",
              error: { message: "Injected provider failure." },
            },
            503,
          ),
      },
      {
        expected: "provider_incomplete_output",
        fetchImpl: async () =>
          jsonResponse({
            ...completedBody,
            id: "resp_typed_incomplete",
            status: "incomplete",
            incomplete_details: { reason: "max_output_tokens" },
          }),
      },
      {
        expected: "malformed_provider_output",
        fetchImpl: async () =>
          jsonResponse({
            id: "resp_typed_malformed",
            status: "completed",
            output_text: "{not-json",
          }),
      },
      {
        expected: "compiler_rejection",
        fetchImpl: async () =>
          openAiPlanFirstResponse("resp_typed_compiler_rejection", invalidCompilerDraft),
      },
    ] as const;

    for (const scenarioCase of cases) {
      const result = await buildAiGeneratedRunningPlanPreview(scenario.input, {
        aiPreview: {
          apiKey: `typed-${scenarioCase.expected}`,
          model: "typed-plan-first-failure-proof",
          generationLedger: { disabled: true },
          fetchImpl: scenarioCase.fetchImpl,
        },
      });
      assert.equal(result.ok, false, `${scenarioCase.expected} unexpectedly produced a draft.`);
      if (result.ok) throw new Error(`${scenarioCase.expected} unexpectedly produced a draft.`);
      assert.equal(result.unavailable.previewOutcome, scenarioCase.expected);
      assert.equal(result.unavailable.persisted, false);
    }
  } finally {
    if (originalFixtureFlag === undefined) {
      delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
    } else {
      process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = originalFixtureFlag;
    }
  }
}

function assertUnavailableLifecycleResult(
  result: Awaited<ReturnType<typeof generateAiFirstPlanDraftPreview>>,
  expected: {
    expectedReason: RegExp;
    expectedRequestPhase: string;
  },
) {
  assert.equal(result.ok, false, "Failure lifecycle must not create canonical review truth.");
  if (result.ok || result.reason === "structured_input_invalid") {
    throw new Error("Failure lifecycle unexpectedly produced or skipped provider truth.");
  }
  assert.match(result.metadata.unavailableReason, expected.expectedReason);
  assert.equal(result.metadata.debug.requestPhase, expected.expectedRequestPhase);
  assert.doesNotMatch(JSON.stringify(result), /reviewToken|reviewChecksum|persisted_plan_created/);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function validateLocalGenerationIncidentTrail() {
  const artifactRoot = await mkdtemp(join(tmpdir(), "hito-ai-plan-incidents-"));
  const runnerCanary = "RUNNER_FREE_TEXT_CANARY_DO_NOT_STORE";
  const providerCanary = "PROVIDER_OUTPUT_CANARY_DO_NOT_STORE";
  const secretCanary = "sk-secret-canary-do-not-store";

  try {
    let trace = await createAiPlanGenerationLedgerTrace({
      providerKind: "local_dev_fixture",
      model: "local-fixture-model",
      contractMode: "plan_first",
      responseSchemaMode: "responses_json_schema_plan_first_strict",
      systemPrompt: `system ${secretCanary}`,
      userPrompt: `runner ${runnerCanary}`,
      responseSchema: { type: "object", properties: { secret: { type: "string" } } },
      timeoutMs: 0,
      maxOutputTokens: 4_000,
    });
    trace =
      (await attachOutputToAiPlanGenerationLedgerTrace({
        trace,
        rawOutput: JSON.stringify({
          workouts: [{ title: providerCanary }],
          providerControlledKey: providerCanary,
        }),
        parsedOutput: {
          workouts: [{ title: providerCanary }],
          providerControlledKey: providerCanary,
        },
        options: {
          forceArtifactWrite: true,
          artifactRoot,
          runtimeUrl: "http://127.0.0.1:3000",
        },
      })) ?? trace;
    trace =
      (await updateAiPlanGenerationLedgerTrace(
        trace,
        {
          pipeline: {
            ...trace.pipeline,
            issueCodes: ["ai_authored_plan_first_provider_schema_invalid"],
            finalOutcome: "rejected",
            unavailableReason: "ai_authored_plan_first_provider_schema_invalid",
          },
        },
        {
          forceArtifactWrite: true,
          artifactRoot,
          runtimeUrl: "http://127.0.0.1:3000",
        },
      )) ?? trace;

    assert.equal(trace.artifacts.written, true);
    assert.ok(trace.artifacts.path);
    assert.ok(trace.artifacts.expiresAt);
    assert.equal(trace.artifacts.path!.startsWith("/"), false);
    const artifactPath = join(artifactRoot, trace.artifacts.path!);
    const artifact = await readFile(artifactPath, "utf8");
    assert.doesNotMatch(artifact, new RegExp(runnerCanary));
    assert.doesNotMatch(artifact, new RegExp(providerCanary));
    assert.doesNotMatch(artifact, new RegExp(secretCanary));
    assert.match(artifact, /ai_authored_plan_first_provider_schema_invalid/);
    assert.equal((await stat(artifactPath)).mode & 0o777, 0o600);
    const events = await queryLocalRuntimeEvents({
      root: artifactRoot,
      generationId: trace.generationId,
      outcomeCode: "ai_authored_plan_first_provider_schema_invalid",
    });
    assert.equal(events.length, 1);

    const blockedRoot = join(artifactRoot, "non-loopback");
    const blockedTrace = await updateAiPlanGenerationLedgerTrace(
      trace,
      {},
      {
        forceArtifactWrite: true,
        artifactRoot: blockedRoot,
        runtimeUrl: "https://hosted.example.test",
      },
    );
    assert.equal(blockedTrace?.artifacts.path, trace.artifacts.path);
    await assert.rejects(stat(blockedRoot), /ENOENT/);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
}

async function validatePathologicalProviderNumberFailsBeforeReview() {
  const scenario = scenarios[0]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const fixtureResponse = await fixtureFetch("https://api.openai.com/v1/responses", {});
  const fixtureBody = (await fixtureResponse.json()) as { output_text: string };
  const pathologicalDraft = JSON.parse(fixtureBody.output_text) as AiAuthoredPlanFirstProviderDraft;
  const firstStep = pathologicalDraft.workouts
    .flatMap((workout) => workout.sections)
    .find((section) => section.kind === "unit");
  assert.ok(firstStep, "Fixture must expose a provider step for pathological-number proof.");
  if (!firstStep || firstStep.kind !== "unit") throw new Error("Missing provider unit section.");
  firstStep.prescription = { mode: "time", duration_min: Number.MIN_VALUE };

  const result = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "pathological-number-plan-first-proof",
    model: "pathological-number-plan-first-proof",
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    fetchImpl: async () =>
      openAiPlanFirstResponse("resp_pathological_plan_first", pathologicalDraft),
  });

  assert.equal(result.ok, false, "Pathological provider numbers must fail before review.");
  if (result.ok) throw new Error("Pathological provider number unexpectedly reached review.");
  assert.match(result.issues.join("\n"), /greater than or equal to 0\.01|schema/i);
  assert.equal(JSON.stringify(result).includes("reviewToken"), false);
}

async function validateProviderStructuralBoundsFailBeforeReview() {
  const scenario = scenarios[0]!;
  const paceTruthInput = {
    ...scenario.input,
    benchmark: { kind: "recent_5k_pace" as const, recent5kPace: "5:30/km" },
  };
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(paceTruthInput);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: paceTruthInput.startDate ?? resolved.authoringInput.schedule.startDate,
  });
  const fixtureResponse = await fixtureFetch("https://api.openai.com/v1/responses", {});
  const fixtureBody = (await fixtureResponse.json()) as { output_text: string };
  const providerDraft = JSON.parse(fixtureBody.output_text) as AiAuthoredPlanFirstProviderDraft;
  const repeatStep = findProviderRepeatStep(providerDraft);
  assert.ok(repeatStep, "Fixture must expose a Repeat for structural-bound proof.");

  const cases: Array<{
    name: string;
    mutate: (draft: AiAuthoredPlanFirstProviderDraft) => void;
    expectedIssue: RegExp;
  }> = [
    {
      name: "invalid calendar date",
      mutate: (draft) => {
        draft.workouts[0]!.date = "2026-02-30";
      },
      expectedIssue: /invalid_calendar_date|schema/i,
    },
    {
      name: "empty Repeat child",
      mutate: (draft) => {
        const step = findProviderRepeatStep(draft);
        step.children[0]!.prescription = {
          mode: "time",
        } as (typeof step.children)[number]["prescription"];
      },
      expectedIssue: /repeat_structure_invalid|duration_min|schema/i,
    },
    {
      name: "round count outside wire bound",
      mutate: (draft) => {
        const step = findProviderRepeatStep(draft);
        step.rounds = 101;
      },
      expectedIssue: /repeat_structure_invalid|less than or equal to 100/i,
    },
    {
      name: "retired repeat count field",
      mutate: (draft) => {
        const step = findProviderRepeatStep(draft) as unknown as Record<string, unknown>;
        step.repeat_count = step.rounds;
        delete step.rounds;
      },
      expectedIssue: /repeat_structure_invalid|provider_schema_invalid|rounds/i,
    },
    {
      name: "incomplete trailing horizon",
      mutate: (draft) => {
        draft.workouts = draft.workouts.filter(
          (workout) => diffDaysIso(draft.endpoint.date, workout.date) > 14,
        );
      },
      expectedIssue: /incomplete_horizon|final 14 calendar days/i,
    },
    {
      name: "qualitative pace in executable pace field",
      mutate: (draft) => {
        findProviderPaceTarget(draft).command = "comfortably hard";
      },
      expectedIssue: /provider_schema_invalid/i,
    },
    {
      name: "zone label in executable pace field",
      mutate: (draft) => {
        findProviderPaceTarget(draft).command = "Z3";
      },
      expectedIssue: /provider_schema_invalid/i,
    },
    {
      name: "invalid pace seconds",
      mutate: (draft) => {
        findProviderPaceTarget(draft).command = "4:75/km";
      },
      expectedIssue: /provider_schema_invalid/i,
    },
    {
      name: "pace without unit",
      mutate: (draft) => {
        findProviderPaceTarget(draft).command = "4:50-5:00";
      },
      expectedIssue: /provider_schema_invalid/i,
    },
  ];

  for (const scenarioCase of cases) {
    const invalidDraft = structuredClone(providerDraft);
    scenarioCase.mutate(invalidDraft);
    const result = await generateAiFirstPlanDraftPreview({
      input: resolved.authoringInput,
      apiKey: `provider-structural-${scenarioCase.name}`,
      model: "provider-structural-bound-proof",
      today: paceTruthInput.startDate ?? resolved.authoringInput.schedule.startDate,
      fetchImpl: async () =>
        openAiPlanFirstResponse(`resp_provider_structural_${scenarioCase.name}`, invalidDraft),
    });

    assert.equal(result.ok, false, `${scenarioCase.name} must fail before review.`);
    if (result.ok) throw new Error(`${scenarioCase.name} unexpectedly reached review.`);
    assert.match(result.issues.join("\n"), scenarioCase.expectedIssue);
    assert.equal(JSON.stringify(result).includes("reviewToken"), false);
  }
}

function findProviderRepeatStep(draft: AiAuthoredPlanFirstProviderDraft) {
  const step = draft.workouts
    .flatMap((workout) => workout.sections)
    .find((candidate) => candidate.kind === "repeat");
  assert.ok(step?.kind === "repeat", "Fixture must expose a Repeat step.");
  if (!step || step.kind !== "repeat") throw new Error("Fixture Repeat is missing.");
  return step;
}

function findProviderPaceTarget(draft: AiAuthoredPlanFirstProviderDraft) {
  for (const section of draft.workouts.flatMap((workout) => workout.sections)) {
    const targets =
      section.kind === "unit" ? [section.target] : section.children.map((child) => child.target);
    const authoredTarget = targets.find(
      (candidate) => candidate?.primary_execution_mode === "pace",
    );
    if (authoredTarget) return authoredTarget;
  }
  throw new Error("Fixture must expose an AI-authored numeric pace target.");
}

async function validateInvalidProviderOutputFailsBeforeReview() {
  const scenario = scenarios[0]!;
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const invalid = await generateAiFirstPlanDraftPreview({
    input: resolved.authoringInput,
    apiKey: "invalid-plan-first-proof",
    model: "invalid-plan-first-proof",
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    fetchImpl: async () =>
      openAiPlanFirstResponse("resp_invalid_plan_first", {
        workouts: [],
        endpoint: null,
      }),
  });

  assert.equal(invalid.ok, false, "Invalid plan-first provider output must be unavailable.");
  if (invalid.ok) {
    throw new Error("Invalid plan-first output unexpectedly produced canonical review data.");
  }
  assert.equal(invalid.reason, "ai_authored_plan_first_unavailable");
  assert.match(
    invalid.issues.join("\n"),
    /workouts|endpoint|schema|invalid/i,
    "Invalid plan-first output must expose bounded compiler diagnostics before review.",
  );
  assert.equal(JSON.stringify(invalid).includes("reviewToken"), false);
}

async function validateLocalDevFixtureAvailabilityGating() {
  const boundaryArtifactRoot = await mkdtemp(join(tmpdir(), "hito-provider-boundary-"));
  const localDevFixtureEnv = {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]: "true",
    [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "qa_fixture",
  };

  assert.equal(isAiGeneratedRunningPlanDevFixtureEnabled(localDevFixtureEnv), true);
  assert.equal(resolveAiGeneratedRunningPlanDevFixtureDelayMs(localDevFixtureEnv), 0);
  assert.equal(
    resolveAiGeneratedRunningPlanDevFixtureDelayMs({
      ...localDevFixtureEnv,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV]: "120001",
    }),
    120_001,
  );
  assert.throws(
    () =>
      resolveAiGeneratedRunningPlanDevFixtureDelayMs({
        ...localDevFixtureEnv,
        NEXT_PUBLIC_SUPABASE_URL: "https://hosted.example.supabase.co",
        [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV]: "120001",
      }),
    /requires the local plan-first fixture to be enabled/,
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      ...localDevFixtureEnv,
      HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "false",
    }),
    false,
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      ...localDevFixtureEnv,
      [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "real",
    }),
    false,
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      ...localDevFixtureEnv,
      VERCEL: "1",
    }),
    false,
  );
  assert.equal(
    buildScenarioAiPreviewOptions(scenarios[0]!.input).model,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  );
  const nonRepeatTempoInput = buildAiGeneratedRunningPlanAuthoringInput(scenarios[1]!.input);
  assert.equal(
    nonRepeatTempoInput.ok,
    true,
    nonRepeatTempoInput.ok ? "" : nonRepeatTempoInput.message,
  );
  if (!nonRepeatTempoInput.ok) throw new Error(nonRepeatTempoInput.message);
  assert.equal(
    buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      authoringInput: nonRepeatTempoInput.authoringInput,
      qaFixtureAuthorized: false,
      env: localDevFixtureEnv,
    }),
    null,
    "Fixture environment residue must not authorize an ordinary local account.",
  );
  assert.equal(
    buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      authoringInput: nonRepeatTempoInput.authoringInput,
      qaFixtureAuthorized: true,
      env: {
        ...localDevFixtureEnv,
        NEXT_PUBLIC_SUPABASE_URL: "https://hosted.example.supabase.co",
        [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV]: "non_repeat_tempo",
      },
    }),
    null,
  );

  const envKeys = [
    "LOCAL_AUTH_BYPASS_ENABLED",
    "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
    "HITO_AI_GENERATED_PLAN_DEV_FIXTURE",
    AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
    "HITO_LOCAL_RUNTIME_OBSERVABILITY",
    "HITO_LOCAL_RUNTIME_OBSERVABILITY_ROOT",
    "HITO_LOCAL_RUNTIME_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "VERCEL",
    "CI",
  ] as const;
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  try {
    process.env.LOCAL_AUTH_BYPASS_ENABLED = "true";
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = "/tmp/hito-local-auth.json";
    process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE = "true";
    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "qa_fixture";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.HITO_LOCAL_RUNTIME_OBSERVABILITY = "1";
    process.env.HITO_LOCAL_RUNTIME_OBSERVABILITY_ROOT = boundaryArtifactRoot;
    process.env.HITO_LOCAL_RUNTIME_URL = "http://127.0.0.1:3000";
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV];
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
    delete process.env.VERCEL;
    delete process.env.CI;

    let providerOverrideCallCount = 0;
    const result = await buildReviewedAiGeneratedRunningPlanPreview(scenarios[0]!.input, {
      qaFixtureAuthorized: true,
      aiPreview: {
        apiKey: "must-not-replace-local-fixture",
        model: "must-not-replace-local-fixture",
        signal: new AbortController().signal,
        fetchImpl: async () => {
          providerOverrideCallCount += 1;
          throw new Error("Local fixture provider transport was replaced.");
        },
        generationLedger: {
          forceArtifactWrite: true,
          artifactRoot: boundaryArtifactRoot,
          runtimeUrl: "http://127.0.0.1:3000",
        },
      },
    });
    assert.equal(result.ok, true, "Request cancellation plumbing must preserve the local fixture.");
    if (!result.ok) throw new Error(result.unavailable.error.message);
    assert.equal(providerOverrideCallCount, 0);
    assert.equal(result.draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.kind, "local_dev_fixture");
    assert.equal(result.draft.aiGeneration.generationTrace?.provider.paidProviderCall, false);
    const fixtureGenerationId = result.draft.aiGeneration.generationTrace?.generationId;
    assert.ok(fixtureGenerationId);
    assert.equal(
      (
        await queryLocalRuntimeEvents({
          root: boundaryArtifactRoot,
          generationId: fixtureGenerationId,
          outcomeCode: "reviewed_draft_signed",
        })
      ).length,
      1,
    );

    const unauthorizedConfirm = await confirmRunningPlanDraftForUser("ordinary-local-runner", {
      previewInput: result.draft.previewInput,
      sourceKind: result.draft.sourceKind,
      reviewToken: result.draft.reviewToken,
      reviewChecksum: result.draft.reviewChecksum,
    });
    assert.equal(unauthorizedConfirm.ok, false);
    if (!unauthorizedConfirm.ok) {
      assert.equal(unauthorizedConfirm.reason, "fixture_not_authorized");
      assert.equal(unauthorizedConfirm.persisted, false);
    }
    const unauthorizedEvents = await queryLocalRuntimeEvents({
      root: boundaryArtifactRoot,
      generationId: fixtureGenerationId,
      outcomeCode: "local_qa_fixture_not_authorized",
    });
    assert.equal(unauthorizedEvents.length, 1);
    assert.equal(unauthorizedEvents[0]?.providerKind, "local_dev_fixture");
    assert.doesNotMatch(
      JSON.stringify(unauthorizedEvents),
      /ordinary-local-runner|reviewToken|prompt|cookie/i,
    );

    const ordinaryUnavailable = await buildReviewedAiGeneratedRunningPlanPreview(
      scenarios[0]!.input,
      {
        qaFixtureAuthorized: false,
        aiPreview: {
          apiKey: null,
          generationLedger: {
            forceArtifactWrite: true,
            artifactRoot: boundaryArtifactRoot,
            runtimeUrl: "http://127.0.0.1:3000",
          },
        },
      },
    );
    assert.equal(ordinaryUnavailable.ok, false);
    if (!ordinaryUnavailable.ok) {
      assert.equal(ordinaryUnavailable.unavailable.persisted, false);
      assert.notEqual(
        ordinaryUnavailable.unavailable.debug.generationTrace?.provider.kind,
        "local_dev_fixture",
      );
      const ordinaryGenerationId =
        ordinaryUnavailable.unavailable.debug.generationTrace?.generationId;
      assert.ok(ordinaryGenerationId);
      const ordinaryEvents = await queryLocalRuntimeEvents({
        root: boundaryArtifactRoot,
        generationId: ordinaryGenerationId,
      });
      assert.ok(
        ordinaryEvents.some(
          (event) =>
            event.providerKind === "not_started" && event.outcomeCode === "openai_not_configured",
        ),
      );
      assert.doesNotMatch(JSON.stringify(ordinaryEvents), /runner|prompt|authorization|cookie/i);
    }
  } finally {
    for (const key of envKeys) {
      const value = previousEnv[key];
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    await rm(boundaryArtifactRoot, { recursive: true, force: true });
  }
}

function validateNoLegacyGeneratedPlanAuthoringSourceImports() {
  const checkedFiles = [
    "src/lib/ai-first-plan-draft-service.ts",
    "src/lib/ai-generated-running-plan.ts",
    "src/lib/ai-generated-running-plan-dev-fixture.ts",
    "scripts/author-ai-first-plan-draft.ts",
  ];

  for (const file of checkedFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /repeat_unit|recovery_unit/,
      `${file} must not import or expose deleted generated-plan legacy authoring paths.`,
    );
  }
}

function buildScenarioAiPreviewOptions(
  input: RunningPlanPreviewActionInput,
  config: { nonRepeatTempo?: boolean } = {},
) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) throw new Error(resolved.message);

  const options = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: resolved.authoringInput,
    qaFixtureAuthorized: true,
    today: input.startDate ?? resolved.authoringInput.schedule.startDate,
    env: {
      LOCAL_AUTH_BYPASS_ENABLED: "true",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "/tmp/hito-local-auth.json",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]: "true",
      [AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]: "qa_fixture",
      ...(config.nonRepeatTempo
        ? {
            NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
            [AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV]: "non_repeat_tempo",
          }
        : {}),
    },
  });

  assert.notEqual(options, null, "Local plan-first fixture options must be available.");
  if (!options) throw new Error("Missing local plan-first fixture options.");

  return options;
}

async function assertReviewedDraftExactness({
  scenarioName,
  draft,
  expectedEndpointMeters,
  expectedGoalMeters,
  expectedFinalDate,
}: {
  scenarioName: string;
  draft: Extract<
    Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>,
    { ok: true }
  >["draft"];
  expectedGoalMeters?: number;
  expectedEndpointMeters?: number;
  expectedFinalDate?: string;
}) {
  const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
  assert.equal(canonicalPlan.source_kind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(canonicalPlan.goal.goal_type, "distance_goal");
  const resolvedExpectedGoalMeters = expectedGoalMeters ?? expectedEndpointMeters;
  if (resolvedExpectedGoalMeters != null) {
    assert.equal(canonicalPlan.goal.distance_meters, resolvedExpectedGoalMeters);
  }

  const endpointWorkout =
    expectedEndpointMeters == null
      ? null
      : ((expectedFinalDate
          ? canonicalPlan.planned_workouts.find(
              (workout) =>
                workout.date === expectedFinalDate &&
                plannedWorkoutEndpointDistanceMeters(workout) === expectedEndpointMeters,
            )
          : null) ??
        canonicalPlan.planned_workouts.find(
          (workout) =>
            workout.source_workout_type === "final_selected_distance_day" &&
            plannedWorkoutEndpointDistanceMeters(workout) === expectedEndpointMeters,
        ));
  if (expectedEndpointMeters != null) {
    assert.notEqual(
      endpointWorkout,
      undefined,
      `${scenarioName} must include selected-distance endpoint.`,
    );
    if (!endpointWorkout) throw new Error(`${scenarioName} missing selected-distance endpoint.`);
    assert.equal(
      plannedWorkoutEndpointDistanceMeters(endpointWorkout),
      expectedEndpointMeters,
      `${scenarioName} endpoint must preserve exact selected distance.`,
    );
    if (expectedFinalDate) {
      assert.equal(endpointWorkout.date, expectedFinalDate);
    }
  }

  const exactness = await validateRunningPlanReviewExactness({
    draft,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(
    exactness.ok,
    true,
    exactness.ok
      ? `${scenarioName} review token must validate.`
      : `${scenarioName} review token failed: ${exactness.message}`,
  );

  const persistenceMetadata = buildRunningPlanPersistenceMetadata({
    draft,
    canonicalPlan,
    reviewChecksum: draft.reviewChecksum,
  });
  const metricPolicy = (
    persistenceMetadata.goalMetadata as {
      selected_plan_engine?: {
        metric_policy?: {
          paceTargetsAllowed?: boolean;
          heartRateTargetsAllowed?: boolean;
        };
      };
    }
  ).selected_plan_engine?.metric_policy;
  const serializedCanonicalPlan = JSON.stringify(canonicalPlan);
  const hasPaceCommand =
    /"primary_execution_mode":"pace"/.test(serializedCanonicalPlan) &&
    /"pace":"\d{1,2}:[0-5]\d/.test(serializedCanonicalPlan);
  const hasAcceptedHeartRateCommand =
    /"primary_execution_mode":"heart_rate"/.test(serializedCanonicalPlan) &&
    /"hr_target_source":"(?:personal_hr_zone|default_estimated_hr)"/.test(serializedCanonicalPlan);
  assert.equal(
    metricPolicy?.paceTargetsAllowed,
    hasPaceCommand,
    `${scenarioName} persistence metadata must match reviewed pace-primary truth.`,
  );
  assert.equal(
    metricPolicy?.heartRateTargetsAllowed,
    hasAcceptedHeartRateCommand,
    `${scenarioName} persistence metadata must match reviewed accepted-HR-primary truth.`,
  );

  const decoded = await validateSelfContainedRunningPlanReviewToken({
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(
    decoded.ok,
    true,
    decoded.ok
      ? `${scenarioName} self-contained review token must validate.`
      : `${scenarioName} self-contained review token failed: ${decoded.message}`,
  );
  if (!decoded.ok) throw new Error(`${scenarioName} decoded token failed.`);
  assert.deepEqual(decoded.draft.calendarRows, draft.calendarRows);
  assert.deepEqual(decoded.draft.workoutDocuments, draft.workoutDocuments);

  const tamperedReadModelDraft = {
    ...draft,
    workoutDocuments: draft.workoutDocuments.map((document, index) =>
      index === 0
        ? {
            ...document,
            title: `${document.title} (tampered)`,
          }
        : document,
    ),
  };
  const tamperedReadModelExactness = await validateRunningPlanReviewExactness({
    draft: tamperedReadModelDraft,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(
    tamperedReadModelExactness.ok,
    false,
    `${scenarioName} must reject a WorkoutDocument-only review payload substitution.`,
  );
  if (tamperedReadModelExactness.ok) {
    throw new Error(`${scenarioName} accepted a tampered WorkoutDocument read model.`);
  }
  assert.equal(tamperedReadModelExactness.reason, "stale_review");

  const tamperedTargetDraft = structuredClone(draft);
  const tamperedTarget = findRecordWithStringKey(
    tamperedTargetDraft.workoutDocuments,
    "primary_execution_mode",
  );
  assert.ok(tamperedTarget, `${scenarioName} must expose a signed primary execution mode.`);
  if (tamperedTarget && typeof tamperedTarget.intensity === "string") {
    tamperedTarget.intensity = `${tamperedTarget.intensity} (tampered)`;
  } else if (tamperedTarget) {
    tamperedTarget.primary_execution_mode = "run_walk";
  }
  const tamperedTargetExactness = await validateRunningPlanReviewExactness({
    draft: tamperedTargetDraft,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(
    tamperedTargetExactness.ok,
    false,
    `${scenarioName} must reject an AI-authored primary-command substitution after review.`,
  );

  return canonicalPlan;
}

function plannedWorkoutEndpointDistanceMeters(
  workout: ReturnType<typeof buildRunningPlanCanonicalPlan>["planned_workouts"][number],
) {
  return selectedDistanceEndpointMainDistanceMeters({
    endpointKind: workout.source_workout_type,
    segments: workout.segments,
  });
}

function assertPlanFirstGuidanceAndRepeatShape({
  scenarioName,
  canonicalPlan,
}: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
}) {
  const serialized = JSON.stringify(canonicalPlan);
  const repeatSegments = canonicalPlan.planned_workouts.flatMap((workout) =>
    workout.segments.filter((segment) => segment.prescription?.mode === "repeats"),
  );
  for (const segment of repeatSegments) {
    assert.ok(
      segment.prescription?.mode === "repeats" && (segment.prescription.children ?? []).length >= 1,
      `${scenarioName} must preserve every AI-authored Repeat child.`,
    );
    assert.equal(
      Boolean(segment.target),
      false,
      `${scenarioName} repeat parents must stay structural-only.`,
    );
  }
  let runnableLeafCount = 0;
  for (const workout of canonicalPlan.planned_workouts) {
    if (workout.workout_type === "rest") continue;
    for (const segment of workout.segments) {
      const leaves =
        segment.prescription?.mode === "repeats"
          ? (segment.prescription.children ?? [])
          : [segment];
      for (const leaf of leaves) {
        runnableLeafCount += 1;
        const target = leaf.target;
        assert.ok(
          target?.primary_execution_mode,
          `${scenarioName} runnable leaves must author one primary execution mode.`,
        );
        const hasPace = Boolean(target?.pace ?? target?.pace_min_per_km_range);
        const hasHeartRate = Boolean(target?.hr_bpm_range ?? target?.hr_bpm);
        assert.equal(
          hasPace && hasHeartRate,
          false,
          `${scenarioName} one leaf cannot command pace and heart rate together.`,
        );
        if (target?.primary_execution_mode === "pace") {
          assert.match(
            target.pace ?? target.pace_min_per_km_range ?? "",
            new RegExp(AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN),
          );
        }
        if (target?.primary_execution_mode === "heart_rate") {
          assert.ok(
            target.hr_target_source === "personal_hr_zone" ||
              target.hr_target_source === "default_estimated_hr",
            `${scenarioName} HR-primary leaves must retain accepted profile provenance.`,
          );
          assert.equal(hasHeartRate, true);
        }
        if (
          target?.primary_execution_mode === "effort" ||
          target?.primary_execution_mode === "run_walk"
        ) {
          assert.equal(hasPace || hasHeartRate, false);
          assert.ok(target.intensity);
        }
      }
    }
  }
  assert.ok(runnableLeafCount > 0);
  assert.doesNotMatch(serialized, /repeat_unit|recovery_unit/);
  assert.doesNotMatch(
    serialized,
    /"hr_target_source":"effort_only"[^}]*"hr_bpm_range"/,
    `${scenarioName} BPM guidance must retain effective profile provenance.`,
  );
  assert.doesNotMatch(serialized, /Mock AI|Local QA\/dev AI fixture/i);
  assert.match(
    serialized,
    /ai_authored_effort_guidance|ai_authored_plan_guidance|AI-authored coaching guidance/i,
    `${scenarioName} must preserve AI-authored plan guidance as compiled target/readback metadata.`,
  );
}

function assertPreviewTargetTruth({
  scenarioName,
  canonicalPlan,
  calendarRows,
}: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
  calendarRows: Extract<
    Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>,
    { ok: true }
  >["draft"]["calendarRows"];
}) {
  let targetCount = 0;

  for (const workout of canonicalPlan.planned_workouts) {
    const row = calendarRows.find((candidate) => candidate.rowId === workout.workout_id);
    assert.ok(row, `${scenarioName} review rows must include ${workout.workout_id}.`);
    if (!row) continue;
    if (row.isRestDay) continue;

    workout.segments.forEach((segment, segmentIndex) => {
      const previewSegment = row.segments[segmentIndex];
      assert.ok(previewSegment, `${scenarioName} review must preserve segment order.`);
      if (!previewSegment) return;

      if (segment.target) {
        targetCount += 1;
        assert.deepEqual(previewSegment.target, segment.target);
      }

      if (segment.prescription?.mode !== "repeats") return;
      const previewPrescription = previewSegment.primaryPrescription;
      assert.equal(previewPrescription.mode, "repeat");
      if (previewPrescription.mode !== "repeat") return;
      (segment.prescription.children ?? []).forEach((child, childIndex) => {
        if (!child.target) return;
        targetCount += 1;
        assert.deepEqual(previewPrescription.children[childIndex]?.target, child.target);
      });
    });
  }

  assert.ok(targetCount > 0, `${scenarioName} must prove runner-visible target truth.`);
}

function assertNonRepeatTempoFixtureReviewTruth({
  scenarioName,
  canonicalPlan,
  calendarRows,
}: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
  calendarRows: Extract<
    Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>,
    { ok: true }
  >["draft"]["calendarRows"];
}) {
  const tempo = canonicalPlan.planned_workouts.find(
    (workout) =>
      workout.workout_identity === "controlled_tempo_session" &&
      workout.segments.some(
        (segment) =>
          segment.label === "Work" &&
          segment.segment_type === "tempo_block" &&
          segment.prescription?.mode === "time",
      ),
  );
  assert.ok(tempo, `${scenarioName} fixture must author a continuous Tempo workout.`);
  if (!tempo) return;
  assert.equal(
    tempo.segments.some((segment) => segment.prescription?.mode === "repeats"),
    false,
    `${scenarioName} continuous Tempo must not contain a Repeat block.`,
  );

  const work = tempo.segments.find((segment) => segment.label === "Work");
  assert.ok(work, `${scenarioName} continuous Tempo must include an authored Work segment.`);
  if (!work) return;
  assert.equal(work.prescription?.mode, "time");
  assert.equal(work.target?.primary_execution_mode, "effort");
  assert.equal(work.target?.pace, undefined);
  assert.equal(work.target?.intensity, "Controlled tempo effort");
  assert.equal(work.target?.hint, undefined);
  assert.equal(work.target?.extra?.hr_zone, undefined);
  assert.equal(work.target?.hr_bpm_range, undefined);

  const reviewRow = calendarRows.find((row) => row.rowId === tempo.workout_id);
  const reviewWork = reviewRow?.segments.find((segment) => segment.id === work.segment_id);
  assert.ok(reviewWork, `${scenarioName} signed review must retain the Tempo Work segment.`);
  assert.equal(
    reviewWork?.segmentRole,
    "work",
    `${scenarioName} review projection must preserve the canonical Tempo Work role.`,
  );
  assert.equal(reviewWork?.primaryPrescription.mode, "time");
  assert.deepEqual(reviewWork?.target, work.target);
}

function collectStringValuesForKey(value: unknown, key: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStringValuesForKey(entry, key));
  }
  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  return [
    ...(typeof record[key] === "string" ? [record[key]] : []),
    ...Object.entries(record)
      .filter(([entryKey]) => entryKey !== key)
      .flatMap(([, entryValue]) => collectStringValuesForKey(entryValue, key)),
  ];
}

function findRecordWithStringKey(value: unknown, key: string): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = findRecordWithStringKey(entry, key);
      if (match) return match;
    }
    return null;
  }
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record[key] === "string") {
    return record;
  }
  for (const entry of Object.values(record)) {
    const match = findRecordWithStringKey(entry, key);
    if (match) return match;
  }
  return null;
}

function assertNoLegacyOrDebugReadback({
  scenarioName,
  value,
}: {
  scenarioName: string;
  value: unknown;
}) {
  assert.doesNotMatch(
    JSON.stringify(value),
    /repeat_unit|recovery_unit/,
    `${scenarioName} readback must not preserve deleted generated-plan legacy vocabulary.`,
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
