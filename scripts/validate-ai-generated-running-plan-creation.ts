import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
  buildAiGeneratedRunningPlanDevFixturePreviewOptions,
  isAiGeneratedRunningPlanDevFixtureEnabled,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  type AiFirstPlanBlueprint,
} from "../src/lib/ai-first-plan-blueprint-schema";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildAiGeneratedRunningPlanAuthoringInput,
  isAiGeneratedRunningPlanPreviewDraft,
} from "../src/lib/ai-generated-running-plan";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import { buildReviewedFirstPlanImportedSeed } from "../src/lib/active-plan-persistence";
import { summarizeRunningPlanCanonicalPrescriptionGrammar } from "../src/lib/plan-creation-engine";
import {
  buildReviewedAiGeneratedRunningPlanPreview,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  addRunningPlanReviewProof,
  buildRunningPlanCanonicalPlan,
  validateRunningPlanReviewExactness,
  validateSelfContainedRunningPlanReviewToken,
} from "../src/lib/running-plan-engine-review";
import {
  assertAiAuthoredStructuredSectionsSurvive,
  assertConservativeEarlyAdaptationTable,
  assertDistanceGoalPersistenceMetadata,
  assertDistanceGoalTruth,
  assertGeneratedPathUsesDatedOpenAiContract,
  assertInternalValidationUnavailable,
  assertLocalDevFixtureAvailabilityGating,
  assertLowSupportTenKDosePolicy,
  assertMarathonCompletionReadinessQuality,
  assertNoFakeMetricTruth,
  assertNoLegacyRepeatFieldsOrParentRepeatTargets,
  assertNoPersistedLegacyRepeatSignals,
  assertNoRunnerFacingFixtureCopy,
  assertNormalPreviewEntrypointUsesAiGeneratedPath,
  assertOpenAiAuthoredDatePlacement,
  assertRepeatRichChildrenWhereSportsSafe,
  assertReviewedGenerationTrace,
  assertRunnerFacingRichnessClean,
  assertWorkoutGoalType,
  blueprintDistanceSection,
  blueprintRepeatDistanceChild,
  blueprintRepeatSection,
  blueprintTimedSection,
  capMarathonPreTaperLongRunsBelowReadinessFloor,
  earlyHardWorkoutMutation,
  forceFirstNonLongWorkoutIdentityInWeek,
  forceNonLongWorkoutIdentitySequenceInWeek,
  jsonStable,
  marathonFixtureWorkoutFromFixture,
  replaceBlueprintWorkoutOnDate,
  restoreEnv,
  slugForProof,
  snapshotEnv,
  stripRunningPlanReviewProofForProof,
  upsertBlueprintWorkoutOnDate,
  validateBadBeginnerTenKOverloadPolicyIsRejected,
  withEarlySpecificityCanonicalPlan,
  type EarlyHardWorkoutKind,
} from "./ai-generated-running-plan-proof-helpers";
import { assertSelectedDistanceEndpointProof } from "./running-plan-engine-confirm/assertions";

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
} satisfies Omit<RunningPlanPreviewActionInput, "distanceFamily">;

const scenarios = [
  {
    name: "10K preset",
    input: {
      ...baseInput,
      distanceFamily: "10K",
      planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
    },
    expectedEndpointMeters: 10_000,
  },
  {
    name: "Quick setup 10K no benchmark default runner",
    input: {
      age: 34,
      heightCm: 178,
      weightKg: 72,
      runnerLevel: "runs_a_lot",
      distanceFamily: "10K",
      daysPerWeek: null,
      fixedRestDays: [],
      preferredLongRunDay: null,
      startDate: null,
      benchmark: { kind: "unknown" },
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        targetFinishTime: null,
        targetDate: null,
      },
    },
    expectedEndpointMeters: 10_000,
  },
  {
    name: "Browser-serialized Beginner 10K 1:10 no benchmark with five available days",
    input: {
      ...baseInput,
      age: 34,
      heightCm: 178,
      weightKg: 72,
      runnerLevel: "sometimes_runs",
      daysPerWeek: 5,
      distanceFamily: "10K",
      fixedRestDays: [],
      preferredLongRunDay: null,
      startDate: "2026-07-04",
      benchmark: { kind: "unknown" },
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        targetDate: "2026-10-04",
        targetFinishTime: "1:10:00",
      },
    },
    expectedEndpointMeters: 10_000,
    expectedFinalDate: "2026-10-04",
    expectedGentleStrideRichness: true,
    expectedLowSupportTenKDose: true,
    expectedConservativeEarlyAdaptation: true,
  },
  {
    name: "10K preset with benchmark-backed specificity",
    input: {
      ...baseInput,
      distanceFamily: "10K",
      benchmark: { kind: "recent_5k_time", recent5kTime: "25:00" },
      planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
    },
    expectedEndpointMeters: 10_000,
    expectedRepeatRich: true,
  },
  {
    name: "Coach contract beginner 10K 1:10 realistic horizon",
    input: {
      ...baseInput,
      runnerLevel: "beginner_new_runner",
      daysPerWeek: 3,
      distanceFamily: "10K",
      startDate: "2026-07-02",
      benchmark: { kind: "unknown" },
      planGoalIntent: {
        distance: { kind: "preset", preset: "10K" },
        targetDate: "2026-09-24",
        targetFinishTime: "1:10:00",
      },
    },
    expectedEndpointMeters: 10_000,
    expectedFinalDate: "2026-09-24",
    expectedConservativeEarlyAdaptation: true,
  },
  {
    name: "Half Marathon preset",
    input: {
      ...baseInput,
      distanceFamily: "Half Marathon",
      planGoalIntent: { distance: { kind: "preset", preset: "Half Marathon" } },
    },
    expectedEndpointMeters: 21_100,
  },
  {
    name: "Coach contract Half Marathon 2:15 credible 20-week build",
    input: {
      ...baseInput,
      distanceFamily: "Half Marathon",
      startDate: "2026-07-02",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2026-11-19",
        targetFinishTime: "2:15:00",
      },
    },
    expectedEndpointMeters: 21_100,
    expectedFinalDate: "2026-11-19",
    expectedRepeatRich: true,
    expectedConservativeEarlyAdaptation: true,
  },
  {
    name: "Coach contract Half Marathon 1:50 unsupported target-time warning",
    input: {
      ...baseInput,
      distanceFamily: "Half Marathon",
      startDate: "2026-07-02",
      benchmark: { kind: "unknown" },
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2026-11-19",
        targetFinishTime: "1:50:00",
      },
    },
    expectedEndpointMeters: 21_100,
    expectedFinalDate: "2026-11-19",
    expectedRepeatRich: true,
    expectedFeasibility: "aggressive_or_short_horizon",
    expectedPreviewOutcome: "preview_ready_with_warnings",
    expectedConservativeEarlyAdaptation: true,
  },
  {
    name: "Marathon preset target date and finish time",
    input: {
      ...baseInput,
      distanceFamily: "Marathon Completion",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Marathon" },
        targetDate: "2026-11-01",
        targetFinishTime: "4:30:00",
      },
    },
    expectedEndpointMeters: 42_195,
    expectedFinalDate: "2026-11-01",
    expectedRepeatRich: true,
    expectedFeasibility: "aggressive_or_short_horizon",
    expectedPreviewOutcome: "preview_ready_with_warnings",
  },
  {
    name: "Coach contract beginner marathon 4:45 eight-month durability build",
    input: {
      ...baseInput,
      runnerLevel: "beginner_new_runner",
      daysPerWeek: 4,
      distanceFamily: "Marathon Completion",
      startDate: "2026-07-02",
      benchmark: { kind: "unknown" },
      planGoalIntent: {
        distance: { kind: "preset", preset: "Marathon" },
        targetDate: "2027-03-02",
        targetFinishTime: "4:45:00",
      },
    },
    expectedEndpointMeters: 42_195,
    expectedFinalDate: "2027-03-02",
    expectedPreviewOutcome: "preview_ready_with_warnings",
    expectedFeasibility: "aggressive_or_short_horizon",
    expectedConservativeEarlyAdaptation: true,
  },
  {
    name: "Browser QA Marathon 4:45 target-date durability build",
    input: {
      ...baseInput,
      runnerLevel: "beginner_new_runner",
      daysPerWeek: 5,
      fixedRestDays: [],
      preferredLongRunDay: null,
      distanceFamily: "Marathon Completion",
      startDate: "2026-07-04",
      benchmark: { kind: "unknown" },
      planGoalIntent: {
        distance: { kind: "preset", preset: "Marathon" },
        targetDate: "2027-03-21",
        targetFinishTime: "4:45:00",
      },
    },
    expectedEndpointMeters: 42_195,
    expectedFinalDate: "2027-03-21",
    expectedPreviewOutcome: "preview_ready_with_warnings",
    expectedFeasibility: "aggressive_or_short_horizon",
    expectedConservativeEarlyAdaptation: true,
  },
  {
    name: "Coach contract Custom 15K 1:40 realistic five-month build",
    input: {
      ...baseInput,
      distanceFamily: "10K",
      runnerLevel: "sometimes_runs",
      startDate: "2026-07-02",
      planGoalIntent: {
        distance: { kind: "custom", distanceKm: 15, label: "City 15K" },
        targetDate: "2026-12-03",
        targetFinishTime: "1:40:00",
      },
    },
    expectedEndpointMeters: 15_000,
    expectedFinalDate: "2026-12-03",
    expectedCustomDistance: true,
    expectedWorkoutGoalType: "distance_build",
    expectedRepeatRich: true,
    expectedConservativeEarlyAdaptation: true,
  },
  {
    name: "Custom distance",
    input: {
      ...baseInput,
      distanceFamily: "10K",
      planGoalIntent: {
        distance: { kind: "custom", distanceKm: 30, label: "City 30K" },
        targetOutcomePace: "6:15/km",
        targetDate: "2026-10-04",
        targetFinishTime: "3:10:00",
      },
    },
    expectedEndpointMeters: 30_000,
    expectedFinalDate: "2026-10-04",
    expectedCustomDistance: true,
    expectedWorkoutGoalType: "distance_build",
    expectedRepeatRich: true,
    expectedFeasibility: "aggressive_or_short_horizon",
    expectedPreviewOutcome: "preview_ready_with_warnings",
  },
  {
    name: "Awkward late-week start keeps Sunday long-run preference flexible",
    input: {
      ...baseInput,
      distanceFamily: "Half Marathon",
      startDate: "2026-06-11",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2026-09-20",
        targetFinishTime: "2:00:00",
      },
    },
    expectedEndpointMeters: 21_100,
    expectedFinalDate: "2026-09-20",
    expectedRepeatRich: true,
    expectedFeasibility: "aggressive_or_short_horizon",
    expectedPreviewOutcome: "preview_ready_with_warnings",
  },
] as const satisfies readonly Array<{
  name: string;
  input: RunningPlanPreviewActionInput;
  expectedEndpointMeters: number;
  expectedFinalDate?: string;
  expectedFeasibility?: "aggressive_or_short_horizon";
  expectedPreviewOutcome?: "preview_ready" | "preview_ready_with_warnings";
  expectedCustomDistance?: boolean;
  expectedWorkoutGoalType?: string;
  expectedRepeatRich?: boolean;
  expectedGentleStrideRichness?: boolean;
  expectedLowSupportTenKDose?: boolean;
  expectedConservativeEarlyAdaptation?: boolean;
}>;

function scenarioByName(name: (typeof scenarios)[number]["name"]) {
  const scenario = scenarios.find((candidate) => candidate.name === name);

  assert.ok(scenario, `Missing AI-generated running-plan scenario: ${name}`);
  return scenario;
}

async function main() {
  assertNormalPreviewEntrypointUsesAiGeneratedPath();
  assertGeneratedPathUsesDatedOpenAiContract();
  assertLocalDevFixtureAvailabilityGating(
    isAiGeneratedRunningPlanDevFixtureEnabled,
    localDevFixtureEnv,
  );

  const proofs = [];
  for (const scenario of scenarios) {
    const proof = await validateAiGeneratedScenario(scenario);
    proofs.push(proof);
  }

  await validateGenericTargetDateEndpointIsRejected();
  await validateCoachPoorEndpointDynamicsAreRejected();
  await validateRunnerFacingRichnessFailuresAreUnavailable();
  await validateEarlyPhaseRiskyBlueprintsAreRejected();
  validateBadBeginnerTenKOverloadPolicyIsRejected();
  await validateUnavailableDoesNotFallbackToDeterministicBuilder();
  await validateImpossibleGoalReturnsTypedReason();
  await validateBenchmarkUnsupportedTargetTimeReturnsTypedReason();
  await validateDefaultLocalFixturePreviewPath();

  console.log("AI-generated running-plan creation contract checks passed.", {
    scenarios: proofs,
    deterministicBuilders: "removed",
  });
}

async function validateAiGeneratedScenario(scenario: (typeof scenarios)[number]) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(scenario.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) {
    throw new Error(resolved.message);
  }

  const fixturePreviewOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: resolved.authoringInput,
    today: scenario.input.startDate ?? resolved.authoringInput.schedule.startDate,
    env: localDevFixtureEnv(),
  });
  assert.notEqual(
    fixturePreviewOptions,
    null,
    "Local QA/dev fixture must be available in local-auth non-deployed validation env.",
  );
  const ledgerArtifactRoot = mkdtempSync(join(tmpdir(), "hito-ai-plan-ledger-success-"));

  const result = await buildReviewedAiGeneratedRunningPlanPreview(scenario.input, {
    aiPreview:
      fixturePreviewOptions == null
        ? undefined
        : {
            ...fixturePreviewOptions,
            generationLedger: {
              forceArtifactWrite: true,
              artifactRoot: ledgerArtifactRoot,
            },
          },
  });

  if (!result.ok) {
    rmSync(ledgerArtifactRoot, { recursive: true, force: true });
    throw new Error(
      `${scenario.name} must produce a reviewed AI-authored preview: ${result.unavailable.error.message} ${JSON.stringify(
        result.unavailable.error.issues,
      )}`,
    );
  }

  const draft = result.draft;
  const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
  const importedSeed = buildImportedPlanSeed(canonicalPlan);
  const finalNonRest = canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest")
    .at(-1);

  assert.equal(draft.sourceKind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(draft.source_kind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(isAiGeneratedRunningPlanPreviewDraft(draft), true);
  assert.equal(draft.callsOpenAi, true);
  assert.equal(draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
  assert.match(
    draft.aiGeneration.responseId ?? "",
    /local-dev-ai-generated-/,
    `${scenario.name} must be clearly marked as local QA/dev fixture output.`,
  );
  assertReviewedGenerationTrace({
    scenarioName: scenario.name,
    trace: draft.aiGeneration.generationTrace,
    expectedResponseId: draft.aiGeneration.responseId,
    expectedProviderKind: "local_dev_fixture",
    expectedPaidProviderCall: false,
    expectedArtifactRoot: ledgerArtifactRoot,
    expectedCanonicalRowCount: canonicalPlan.planned_workouts.length,
    expectedRunningWorkoutCount: canonicalPlan.planned_workouts.filter(
      (workout) => workout.workout_type !== "rest",
    ).length,
  });
  rmSync(ledgerArtifactRoot, { recursive: true, force: true });
  assert.equal(draft.reviewSafety.confirmCallsOpenAi, false);
  assert.equal(
    draft.previewOutcome,
    scenario.expectedPreviewOutcome ??
      (scenario.expectedFeasibility === "aggressive_or_short_horizon"
        ? "preview_ready_with_warnings"
        : "preview_ready"),
    `${scenario.name} must expose the expected typed preview outcome.`,
  );
  if (draft.previewOutcome === "preview_ready_with_warnings") {
    assert.ok(
      draft.previewWarnings.length > 0,
      `${scenario.name} warning outcome must include backend-authored warning assumptions.`,
    );
  } else {
    assert.deepEqual(draft.previewWarnings, []);
  }
  assert.equal(draft.endpointProof.endpointDistanceMeters, scenario.expectedEndpointMeters);
  if (scenario.expectedCustomDistance) {
    assert.equal(
      draft.normalizedInputSummary.planGoalIntent.distance?.kind,
      "custom",
      `${scenario.name} must preserve runner custom goal intent.`,
    );
    assert.notEqual(
      draft.endpointProof.endpointDistanceMeters,
      21_100,
      `${scenario.name} must not collapse the endpoint to half-marathon distance.`,
    );
  }
  assertDistanceGoalTruth({
    scenarioName: scenario.name,
    canonicalPlan,
    draft,
    expectedEndpointMeters: scenario.expectedEndpointMeters,
  });
  assertSelectedDistanceEndpointProof({
    scenarioName: scenario.name,
    canonicalPlan,
    draft,
    expectedEndpointMeters: scenario.expectedEndpointMeters,
    expectedFinalDate: scenario.expectedFinalDate,
  });
  if (scenario.expectedWorkoutGoalType) {
    assertWorkoutGoalType(canonicalPlan, scenario.name, scenario.expectedWorkoutGoalType);
  }
  if (scenario.expectedFinalDate) {
    assert.equal(
      draft.endpointProof.finalDate,
      scenario.expectedFinalDate,
      `${scenario.name} endpoint workout must land on the authored target date.`,
    );
  }
  assert.equal(canonicalPlan.source_kind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.doesNotThrow(
    () => buildReviewedFirstPlanImportedSeed(canonicalPlan),
    `${scenario.name} reviewed canonical plan must pass first-plan persistence seed guards.`,
  );
  assertOpenAiAuthoredDatePlacement({
    scenarioName: scenario.name,
    canonicalPlan,
    metadata: draft.aiGeneration,
    fixedRestDays: draft.normalizedInputSummary.fixedRestDays,
  });
  assert.equal(importedSeed.workouts.length, canonicalPlan.planned_workouts.length);
  assertAiAuthoredStructuredSectionsSurvive({
    scenarioName: scenario.name,
    canonicalPlan,
    importedSeed,
    expectedEndpointMeters: scenario.expectedEndpointMeters,
  });
  if (scenario.expectedGentleStrideRichness) {
    const identities = canonicalPlan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.workout_identity);

    assert.ok(
      identities.includes("easy_run_with_strides"),
      `${scenario.name} must preserve safe gentle stride richness through blueprint repair.`,
    );
    assert.equal(
      identities.includes("10k_rhythm_intervals"),
      false,
      `${scenario.name} must not keep hard 10K rhythm intervals for no-benchmark beginner support.`,
    );
    assert.equal(
      identities.includes("controlled_tempo_session"),
      false,
      `${scenario.name} must not keep tempo identity for no-benchmark beginner support.`,
    );
  }
  if (scenario.expectedLowSupportTenKDose) {
    assertLowSupportTenKDosePolicy({
      scenarioName: scenario.name,
      draft,
      canonicalPlan,
    });
  }
  assertRunnerFacingRichnessClean({
    scenarioName: scenario.name,
    draft,
    canonicalPlan,
    expectedEndpointMeters: scenario.expectedEndpointMeters,
  });
  const earlyAdaptationEvidence = scenario.expectedConservativeEarlyAdaptation
    ? assertConservativeEarlyAdaptationTable({
        scenarioName: scenario.name,
        canonicalPlan,
      })
    : null;
  if (scenario.expectedEndpointMeters === 42_195) {
    assertMarathonCompletionReadinessQuality({
      scenarioName: scenario.name,
      canonicalPlan,
    });
  }
  const prescriptionGrammar = summarizeRunningPlanCanonicalPrescriptionGrammar(
    canonicalPlan.planned_workouts,
  );
  assert.deepEqual(
    prescriptionGrammar.issues,
    [],
    `${scenario.name} prescription grammar issues: ${JSON.stringify(prescriptionGrammar.issues)}`,
  );
  assert.equal(
    draft.normalizedInputSummary.planGoalIntent.metricTruthPolicy.segmentPaceTargetsAllowedFromGoal,
    false,
  );
  assert.equal(
    draft.normalizedInputSummary.planGoalIntent.metricTruthPolicy.hrTargetsAllowedFromGoal,
    false,
  );

  if (scenario.expectedFeasibility) {
    assert.equal(
      draft.normalizedInputSummary.planGoalIntent.feasibility.status,
      scenario.expectedFeasibility,
      `${scenario.name} must warn without blocking reviewed AI plan creation.`,
    );
    assert.match(
      JSON.stringify(draft.normalizedInputSummary.planGoalIntent.assumptions),
      /not promiseable|short horizon|aggressive|conservative durability|target-time/i,
    );
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
      ? `${scenario.name} review token must validate.`
      : `${scenario.name} review token must validate: ${exactness.reason} ${exactness.message}`,
  );
  assertDistanceGoalPersistenceMetadata({
    scenarioName: scenario.name,
    draft,
    canonicalPlan,
    expectedEndpointMeters: scenario.expectedEndpointMeters,
  });

  const decoded = await validateSelfContainedRunningPlanReviewToken({
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(decoded.ok, true, `${scenario.name} self-contained review token must decode.`);
  if (!decoded.ok) throw new Error(decoded.message);
  assert.deepEqual(jsonStable(decoded.canonicalPlan), jsonStable(canonicalPlan));
  assert.deepEqual(decoded.draft.previewInput, draft.previewInput);
  assertNoRunnerFacingFixtureCopy({
    scenarioName: scenario.name,
    canonicalPlan,
    importedSeed,
    previewRows: draft.calendarRows,
    decodedCanonicalPlan: decoded.canonicalPlan,
  });
  assertNoPersistedLegacyRepeatSignals({
    scenarioName: scenario.name,
    draft,
    decodedDraft: decoded.draft,
  });

  const staleSetup = await validateRunningPlanReviewExactness({
    draft: {
      ...draft,
      previewInput: {
        ...draft.previewInput,
        startDate: "2026-06-15",
      },
    },
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(staleSetup.ok, false, `${scenario.name} stale reviewed setup must reject.`);

  assertNoFakeMetricTruth(canonicalPlan);
  assertNoLegacyRepeatFieldsOrParentRepeatTargets(canonicalPlan);
  if (scenario.expectedRepeatRich) {
    assertRepeatRichChildrenWhereSportsSafe(canonicalPlan, scenario.name);
  }

  return {
    name: scenario.name,
    sourceKind: draft.sourceKind,
    endpointMeters: draft.endpointProof.endpointDistanceMeters,
    reviewTokenBytes: draft.reviewToken.length,
    feasibility: draft.normalizedInputSummary.planGoalIntent.feasibility.status,
    earlyAdaptationEvidence,
  };
}

async function validateGenericTargetDateEndpointIsRejected() {
  const { input, blueprint, targetWorkout } = await buildHalfTargetDateEndpointFixture();

  targetWorkout.workoutFamily = "long";
  targetWorkout.workoutIdentity = "taper_long_run";
  targetWorkout.calendarIconKey = "long";
  targetWorkout.title = "Taper long run";
  targetWorkout.summary = "A short taper long run before the goal.";
  targetWorkout.plannedRpe = 4;
  targetWorkout.estimatedFatigue = "low";
  targetWorkout.recoveryPriority = "medium";
  targetWorkout.segmentIntent = "long_durability";
  targetWorkout.metricIntent = "effort_only";

  const result = await expectBlueprintRejected({
    input,
    blueprint,
    responseId: "resp_bad_generic_selected_distance_endpoint",
    model: "bad-generic-selected-distance-endpoint",
  });

  assertInternalValidationUnavailable(
    result,
    "Generic taper/long-run target-date output must not receive a reviewed plan token.",
    /selected_distance_endpoint|selected-distance endpoint|missing_selected_distance_endpoint_signal/i,
  );
}

async function validateCoachPoorEndpointDynamicsAreRejected() {
  const variants = [
    {
      name: "one giant selected-distance block",
      sections: [
        blueprintTimedSection("warm_up", "Easy warm-up", 10, "Start easy.", 3),
        blueprintDistanceSection(
          "run",
          "Selected distance",
          21.1,
          "Complete the selected distance.",
          6,
        ),
        blueprintTimedSection("cooldown", "Easy cooldown", 6, "Walk down.", 2),
      ],
      match: /selected_distance_endpoint_not_nested_dynamic|anonymous giant/i,
    },
    {
      name: "nested 20/60/20 arithmetic split",
      sections: [
        blueprintTimedSection("warm_up", "Easy warm-up", 10, "Start easy.", 3),
        blueprintRepeatSection([
          blueprintRepeatDistanceChild("run", "Opening fifth", 4.22, "Open controlled.", 5),
          blueprintRepeatDistanceChild("run", "Middle three fifths", 12.66, "Hold steady.", 6),
          blueprintRepeatDistanceChild("finish", "Final fifth", 4.22, "Finish controlled.", 7),
        ]),
        blueprintTimedSection("cooldown", "Easy cooldown", 6, "Walk down.", 2),
      ],
      match: /selected_distance_endpoint_formulaic_split|20\/60\/20/i,
    },
    {
      name: "nested identical endpoint cues",
      sections: [
        blueprintTimedSection("warm_up", "Easy warm-up", 10, "Start easy.", 3),
        blueprintRepeatSection([
          blueprintRepeatDistanceChild("run", "Opening", 3, "Keep controlled.", 5),
          blueprintRepeatDistanceChild("run", "Middle", 13, "Keep controlled.", 5),
          blueprintRepeatDistanceChild("finish", "Finish", 5.1, "Keep controlled.", 5),
        ]),
        blueprintTimedSection("cooldown", "Easy cooldown", 6, "Walk down.", 2),
      ],
      match: /selected_distance_endpoint_flat_target_guidance|vary coaching cues/i,
    },
  ];

  for (const variant of variants) {
    const { input, blueprint, targetWorkout } = await buildHalfTargetDateEndpointFixture();
    targetWorkout.sections = variant.sections;

    const result = await expectBlueprintRejected({
      input,
      blueprint,
      responseId: `resp_bad_${variant.name.replaceAll(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
      model: `bad-${variant.name.replaceAll(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
    });

    assertInternalValidationUnavailable(
      result,
      `${variant.name} must not receive a reviewed plan token.`,
      variant.match,
      `${variant.name} must expose the endpoint dynamics validation issue.`,
    );
  }
}

async function buildHalfTargetDateEndpointFixture() {
  const input = {
    ...baseInput,
    distanceFamily: "Half Marathon",
    startDate: "2026-07-02",
    planGoalIntent: {
      distance: { kind: "preset", preset: "Half Marathon" },
      targetDate: "2026-11-20",
      targetFinishTime: "1:50:00",
    },
  } satisfies RunningPlanPreviewActionInput;
  const blueprint = await buildScenarioBlueprintFixture({
    input,
    today: "2026-07-02",
  });
  const targetWorkout = blueprint.weeks
    .flatMap((week) => week.plannedWorkouts)
    .find((workout) => workout.date === "2026-11-20");

  assert.notEqual(targetWorkout, undefined, "Fixture must author a target-date workout.");
  if (!targetWorkout) {
    throw new Error("Missing target-date workout in local fixture blueprint.");
  }

  return { input, blueprint, targetWorkout };
}

async function expectBlueprintRejected(input: {
  input: RunningPlanPreviewActionInput;
  blueprint: AiFirstPlanBlueprint;
  responseId: string;
  model: string;
}) {
  return buildReviewedPreviewFromBlueprint({
    input: input.input,
    blueprint: input.blueprint,
    responseId: input.responseId,
    model: input.model,
    today: "2026-07-02",
    apiKey: input.model,
  });
}

async function buildScenarioBlueprintFixture(input: {
  input: RunningPlanPreviewActionInput;
  today: string;
}) {
  const resolved = buildAiGeneratedRunningPlanAuthoringInput(input.input);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.message);
  if (!resolved.ok) {
    throw new Error(resolved.message);
  }

  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: resolved.authoringInput,
    today: input.today,
  });
  const fixtureResponse = await fixtureFetch("http://local-fixture.test");
  const fixturePayload = (await fixtureResponse.json()) as { output_text: string };

  return JSON.parse(fixturePayload.output_text) as AiFirstPlanBlueprint;
}

async function buildReviewedPreviewFromBlueprint(input: {
  input: RunningPlanPreviewActionInput;
  blueprint: AiFirstPlanBlueprint;
  responseId: string;
  model: string;
  today: string;
  apiKey?: string;
}) {
  return buildReviewedAiGeneratedRunningPlanPreview(input.input, {
    aiPreview: {
      apiKey: input.apiKey ?? `local-${input.model}`,
      model: input.model,
      today: input.today,
      fetchImpl: async () => openAiBlueprintResponse(input.responseId, input.blueprint),
    },
  });
}

function openAiBlueprintResponse(responseId: string, blueprint: AiFirstPlanBlueprint) {
  return new Response(
    JSON.stringify({
      id: responseId,
      status: "completed",
      output_text: JSON.stringify(blueprint),
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

async function validateRunnerFacingRichnessFailuresAreUnavailable() {
  await validateNoRepeatRichQualityIsRejected({
    name: "10K no repeat-rich quality",
    input: scenarioByName("10K preset").input,
    today: "2026-06-08",
  });
  await validateNoRepeatRichQualityIsRejected({
    name: "Custom 15K no repeat-rich quality",
    input: scenarioByName("Coach contract Custom 15K 1:40 realistic five-month build").input,
    today: "2026-06-08",
  });
  await validateBadMarathonReadinessQualityIsRejected();
  await validateBadMarathonRaceWeekTotalLoadIsRejected();
}

async function validateEarlyPhaseRiskyBlueprintsAreRejected() {
  await validateEarlyPhaseRiskyBlueprintIsRejected({
    name: "Half 2:15 W1-W2 threshold without benchmark",
    scenarioName: "Coach contract Half Marathon 2:15 credible 20-week build",
    today: "2026-07-02",
    mutate: (blueprint) => {
      forceFirstNonLongWorkoutIdentityInWeek(
        earlyHardWorkoutMutation(blueprint, 1, "half_threshold"),
      );
      forceFirstNonLongWorkoutIdentityInWeek(
        earlyHardWorkoutMutation(blueprint, 2, "half_threshold"),
      );
    },
  });

  await validateEarlyPhaseRiskyBlueprintIsRejected({
    name: "Half 1:50 early threshold and intervals without benchmark",
    scenarioName: "Coach contract Half Marathon 1:50 unsupported target-time warning",
    today: "2026-07-02",
    mutate: (blueprint) => {
      forceFirstNonLongWorkoutIdentityInWeek(
        earlyHardWorkoutMutation(blueprint, 1, "half_threshold"),
      );
      forceFirstNonLongWorkoutIdentityInWeek(
        earlyHardWorkoutMutation(blueprint, 4, "time_intervals"),
      );
    },
  });

  await validateEarlyPhaseRiskyBlueprintIsRejected({
    name: "Custom 15K W1-W4 threshold tempo intervals without benchmark",
    scenarioName: "Coach contract Custom 15K 1:40 realistic five-month build",
    today: "2026-07-02",
    mutate: (blueprint) => {
      forceFirstNonLongWorkoutIdentityInWeek(
        earlyHardWorkoutMutation(blueprint, 1, "half_threshold"),
      );
      forceFirstNonLongWorkoutIdentityInWeek(
        earlyHardWorkoutMutation(blueprint, 2, "half_threshold"),
      );
      forceFirstNonLongWorkoutIdentityInWeek(earlyHardWorkoutMutation(blueprint, 3, "tempo"));
      forceFirstNonLongWorkoutIdentityInWeek(
        earlyHardWorkoutMutation(blueprint, 4, "time_intervals"),
      );
    },
  });

  await validateEarlyPhaseRiskyBlueprintIsRejected({
    name: "Marathon W1-W2 specific steady without support",
    scenarioName: "Coach contract beginner marathon 4:45 eight-month durability build",
    today: "2026-07-04",
    mutate: (blueprint) => {
      forceFirstNonLongWorkoutIdentityInWeek(
        earlyHardWorkoutMutation(blueprint, 1, "marathon_specific"),
      );
      forceFirstNonLongWorkoutIdentityInWeek(
        earlyHardWorkoutMutation(blueprint, 2, "marathon_specific"),
      );
    },
  });

  await validateEarlyPhaseRiskyBlueprintIsRejected({
    name: "Marathon W3 stacked steady specific steady without support",
    scenarioName: "Coach contract beginner marathon 4:45 eight-month durability build",
    today: "2026-07-04",
    mutate: (blueprint) => {
      forceNonLongWorkoutIdentitySequenceInWeek({
        blueprint,
        weekNumber: 3,
        sequence: ["steady", "marathon_specific", "steady"],
      });
    },
  });

  await validateSignedEarlySpecificityReviewExactnessIsRejected();
}

async function validateEarlyPhaseRiskyBlueprintIsRejected(input: {
  name: string;
  scenarioName: string;
  today: string;
  mutate: (blueprint: AiFirstPlanBlueprint) => void;
}) {
  const scenario = scenarioByName(input.scenarioName);
  const blueprint = await buildScenarioBlueprintFixture({
    input: scenario.input,
    today: input.today,
  });
  input.mutate(blueprint);

  const result = await buildReviewedPreviewFromBlueprint({
    input: scenario.input,
    blueprint,
    responseId: `resp_early_risk_${slugForProof(input.name)}`,
    model: `early-risk-${slugForProof(input.name)}`,
    today: input.today,
    apiKey: `local-${input.name}`,
  });

  assertInternalValidationUnavailable(
    result,
    `${input.name} must not receive a reviewed token when OpenAI authors W1-W4 specificity.`,
    /conservative_no_benchmark_early_specificity|early_phase_load_density|supported_specificity|runner[-_ ]facing|richness/i,
    `${input.name} must expose the early-phase adaptation violation.`,
  );
}

async function validateNoRepeatRichQualityIsRejected(input: {
  name: string;
  input: RunningPlanPreviewActionInput;
  today: string;
}) {
  const blueprint = await buildScenarioBlueprintFixture(input);

  for (const week of blueprint.weeks) {
    for (const workout of week.plannedWorkouts) {
      if (workout.workoutIdentity === "selected_distance_completion_or_checkpoint") {
        continue;
      }

      if (workout.workoutFamily === "long") {
        workout.workoutIdentity = "long_aerobic_run";
        workout.calendarIconKey = "long";
        workout.title = "Long aerobic run";
        workout.segmentIntent = "long_durability";
        continue;
      }

      workout.workoutFamily = "steady";
      workout.workoutIdentity = "steady_aerobic_run";
      workout.calendarIconKey = "steady";
      workout.title = "Steady aerobic run";
      workout.segmentIntent = "steady_aerobic";
    }
  }

  const result = await buildReviewedPreviewFromBlueprint({
    input: input.input,
    blueprint,
    responseId: `resp_bad_richness_${slugForProof(input.name)}`,
    model: `bad-richness-${input.name}`,
    today: input.today,
    apiKey: `local-${input.name}`,
  });

  assertInternalValidationUnavailable(
    result,
    `${input.name} must not receive a reviewed token when goal-family quality collapses.`,
    /conservative_no_benchmark_early_specificity|early_phase_load_density|goal_family|runner[-_ ]facing|richness|quality/i,
  );
}

async function validateBadMarathonReadinessQualityIsRejected() {
  const scenario = scenarioByName("Browser QA Marathon 4:45 target-date durability build");
  const blueprint = await buildScenarioBlueprintFixture({
    input: scenario.input,
    today: "2026-07-04",
  });

  capMarathonPreTaperLongRunsBelowReadinessFloor(blueprint);
  replaceBlueprintWorkoutOnDate({
    blueprint,
    date: "2027-03-16",
    weekday: "Tuesday",
    workout: marathonFixtureWorkoutFromFixture(blueprint, "progression_run"),
  });
  replaceBlueprintWorkoutOnDate({
    blueprint,
    date: "2027-03-20",
    weekday: "Saturday",
    workout: marathonFixtureWorkoutFromFixture(blueprint, "steady_aerobic_run"),
  });

  const result = await buildReviewedPreviewFromBlueprint({
    input: scenario.input,
    blueprint,
    responseId: "resp_bad_marathon_readiness_quality",
    model: "bad-marathon-readiness-quality",
    today: "2026-07-04",
    apiKey: "local-bad-marathon-readiness-quality",
  });

  assertInternalValidationUnavailable(
    result,
    "A marathon draft with underbuilt long-run peak and unsafe race week must not receive a reviewed token.",
    /marathon_long_run_floor|marathon_race_week_taper|runner[-_ ]facing|richness/i,
  );
}

async function validateBadMarathonRaceWeekTotalLoadIsRejected() {
  const scenario = scenarioByName("Browser QA Marathon 4:45 target-date durability build");
  const blueprint = await buildScenarioBlueprintFixture({
    input: scenario.input,
    today: "2026-07-04",
  });

  for (const [date, weekday] of [
    ["2027-03-15", "Monday"],
    ["2027-03-17", "Wednesday"],
    ["2027-03-18", "Thursday"],
    ["2027-03-20", "Saturday"],
  ] as const) {
    upsertBlueprintWorkoutOnDate({
      blueprint,
      date,
      weekday,
      workout: marathonFixtureWorkoutFromFixture(blueprint, "recovery_jog"),
    });
  }

  const result = await buildReviewedPreviewFromBlueprint({
    input: scenario.input,
    blueprint,
    responseId: "resp_bad_marathon_race_week_load",
    model: "bad-marathon-race-week-load",
    today: "2026-07-04",
    apiKey: "local-bad-marathon-race-week-load",
  });

  assertInternalValidationUnavailable(
    result,
    "A marathon draft with 88 min pre-endpoint race-week load must not receive a reviewed token.",
    /marathon_race_week_load|88 min|pre-endpoint race-week load|runner[-_ ]facing|richness/i,
  );
}

async function validateUnavailableDoesNotFallbackToDeterministicBuilder() {
  const unavailable = await buildReviewedAiGeneratedRunningPlanPreview(
    scenarioByName("10K preset").input,
    {
      aiPreview: {
        apiKey: null,
        model: "mock-ai-generated-plan",
        today: "2026-06-08",
      },
    },
  );

  assert.equal(unavailable.ok, false, "AI unavailable must not use deterministic fallback.");
  if (unavailable.ok) {
    throw new Error("AI unavailable unexpectedly returned a reviewed draft.");
  }

  assert.equal(unavailable.unavailable.sourceKind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(unavailable.unavailable.persisted, false);
  assert.equal(unavailable.unavailable.callsOpenAi, true);
  assert.equal(unavailable.unavailable.previewOutcome, "ai_unavailable_retryable");
  assert.match(unavailable.unavailable.error.message, /OpenAI|AI|unavailable/i);

  const ledgerArtifactRoot = mkdtempSync(join(tmpdir(), "hito-ai-plan-ledger-failure-"));
  try {
    const invalid = await buildReviewedAiGeneratedRunningPlanPreview(scenarios[0].input, {
      aiPreview: {
        apiKey: "paid-openai-ledger-validation-key",
        model: "gpt-5-ledger-validation",
        today: "2026-06-08",
        generationLedger: {
          forceArtifactWrite: true,
          artifactRoot: ledgerArtifactRoot,
        },
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              id: "resp_invalid_ai_generation_ledger_validation",
              status: "completed",
              output_text: JSON.stringify({
                schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
                weeks: [],
              }),
              usage: {
                input_tokens: 321,
                output_tokens: 654,
                total_tokens: 975,
              },
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          ),
      },
    });

    assert.equal(invalid.ok, false, "Invalid AI blueprint must return unavailable.");
    if (invalid.ok) {
      throw new Error("Invalid AI blueprint unexpectedly produced reviewed preview.");
    }

    const trace = invalid.unavailable.debug.generationTrace;
    assert.notEqual(trace, null, "Invalid AI blueprint must still return generation trace.");
    if (!trace) throw new Error("Missing invalid AI blueprint generation trace.");
    assert.equal(trace.provider.responseId, "resp_invalid_ai_generation_ledger_validation");
    assert.equal(invalid.unavailable.previewOutcome, "internal_validation_bug");
    assert.equal(trace.provider.kind, "openai_responses_api");
    assert.equal(trace.provider.paidProviderCall, true);
    assert.equal(trace.usage.inputTokens, 321);
    assert.equal(trace.usage.outputTokens, 654);
    assert.equal(trace.usage.totalTokens, 975);
    assert.equal(trace.pipeline.parseStatus, "parsed_json");
    assert.equal(trace.pipeline.normalizationStatus, "failed");
    assert.equal(trace.pipeline.finalOutcome, "unavailable");
    assert.match(trace.pipeline.unavailableReason ?? "", /blueprint/i);
    assert.equal(
      invalid.unavailable.debug.previewActionTrace.provider?.responseId,
      "resp_invalid_ai_generation_ledger_validation",
    );
    assert.equal(invalid.unavailable.debug.previewActionTrace.liveOpenAiCalled, true);
    assert.match(
      JSON.stringify(invalid.unavailable.debug.previewActionTrace.validationIssues),
      /schema_invalid|week/i,
    );
    assert.equal(trace.artifacts.written, true);
    assert.ok(trace.artifacts.path?.startsWith(ledgerArtifactRoot));
    assert.ok(trace.artifacts.path && existsSync(trace.artifacts.path));
    const artifact = JSON.parse(readFileSync(trace.artifacts.path, "utf8")) as {
      provider?: { responseId?: string | null };
      usage?: { totalTokens?: number | null };
      pipeline?: { finalOutcome?: string | null };
    };
    assert.equal(artifact.provider?.responseId, trace.provider.responseId);
    assert.equal(artifact.usage?.totalTokens, trace.usage.totalTokens);
    assert.equal(artifact.pipeline?.finalOutcome, trace.pipeline.finalOutcome);
  } finally {
    rmSync(ledgerArtifactRoot, { recursive: true, force: true });
  }
}

async function validateImpossibleGoalReturnsTypedReason() {
  const impossible = await buildReviewedAiGeneratedRunningPlanPreview({
    ...baseInput,
    runnerLevel: "beginner_new_runner",
    distanceFamily: "Marathon Completion",
    planGoalIntent: {
      distance: { kind: "preset", preset: "Marathon" },
      targetDate: "2026-06-14",
      targetFinishTime: "3:30:00",
    },
  });

  assert.equal(impossible.ok, false, "Marathon in one week must not produce a reviewed draft.");
  if (impossible.ok) {
    throw new Error("Impossible marathon unexpectedly returned a reviewed draft.");
  }

  assert.equal(impossible.unavailable.previewOutcome, "impossible_goal_with_reason");
  assert.equal(impossible.unavailable.error.code, "impossible_plan_goal");
  assert.match(impossible.unavailable.error.message, /marathon|fake readiness|compressed/i);
  assert.equal(impossible.unavailable.debug.previewActionTrace.liveOpenAiCalled, false);
}

async function validateBenchmarkUnsupportedTargetTimeReturnsTypedReason() {
  const result = await buildReviewedAiGeneratedRunningPlanPreview({
    ...baseInput,
    distanceFamily: "10K",
    startDate: "2026-07-02",
    benchmark: { kind: "recent_5k_time", recent5kTime: "36:00" },
    planGoalIntent: {
      distance: { kind: "preset", preset: "10K" },
      targetDate: "2026-09-14",
      targetFinishTime: "45:00",
    },
  });

  assert.equal(
    result.ok,
    false,
    "10K 45:00 from a 36:00 5K in about 74 days must not produce a reviewed draft.",
  );
  if (result.ok) {
    throw new Error("Benchmark-unsupported 10K target unexpectedly returned reviewed draft.");
  }

  assert.equal(result.unavailable.previewOutcome, "impossible_goal_with_reason");
  assert.equal(result.unavailable.error.code, "impossible_plan_goal");
  assert.match(result.unavailable.error.message, /finish time|fitness evidence|longer runway/i);
  assert.equal(result.unavailable.debug.previewActionTrace.liveOpenAiCalled, false);
}

async function validateDefaultLocalFixturePreviewPath() {
  const previousEnv = snapshotEnv([
    "HITO_AI_GENERATED_PLAN_DEV_FIXTURE",
    "LOCAL_AUTH_BYPASS_ENABLED",
    "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
    "VERCEL",
    "CI",
  ]);

  try {
    process.env.LOCAL_AUTH_BYPASS_ENABLED = "true";
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = "scripts/fixtures/local-auth-users.json";
    delete process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE;
    delete process.env.VERCEL;
    delete process.env.CI;

    const result = await buildReviewedAiGeneratedRunningPlanPreview(
      scenarioByName("Coach contract Half Marathon 2:15 credible 20-week build").input,
    );
    assert.equal(
      result.ok,
      true,
      result.ok
        ? "Default local fixture preview path must return a reviewed draft."
        : result.unavailable.error.message,
    );
    if (!result.ok) {
      throw new Error(result.unavailable.error.message);
    }

    assert.equal(result.draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
    assert.equal(
      result.draft.aiGeneration.generationTrace?.provider.kind,
      "local_dev_fixture",
      "Server-action default options should use the same local fixture in local-auth QA/dev runtime.",
    );
  } finally {
    restoreEnv(previousEnv);
  }
}

function localDevFixtureEnv() {
  return {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "scripts/fixtures/local-auth-users.json",
  };
}

async function validateSignedEarlySpecificityReviewExactnessIsRejected() {
  await validateSignedEarlySpecificityScenarioIsRejected(
    "Coach contract Half Marathon 1:50 unsupported target-time warning",
    "half_threshold",
  );
  await validateSignedEarlySpecificityScenarioIsRejected(
    "Coach contract beginner marathon 4:45 eight-month durability build",
    "marathon_specific",
  );
}

async function validateSignedEarlySpecificityScenarioIsRejected(
  scenarioName: (typeof scenarios)[number]["name"],
  kind: EarlyHardWorkoutKind,
) {
  const scenario = scenarioByName(scenarioName);
  const blueprint = await buildScenarioBlueprintFixture({
    input: scenario.input,
    today: scenario.input.startDate ?? "2026-07-02",
  });
  const result = await buildReviewedPreviewFromBlueprint({
    input: scenario.input,
    blueprint,
    responseId: `resp_signed_early_specificity_${slugForProof(scenarioName)}`,
    model: `signed-early-specificity-${slugForProof(scenarioName)}`,
    today: scenario.input.startDate ?? "2026-07-02",
  });
  assert.equal(result.ok, true, result.ok ? "" : result.unavailable.error.message);
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  const badCanonicalPlan = withEarlySpecificityCanonicalPlan(
    buildRunningPlanCanonicalPlan(result.draft),
    kind,
  );
  const badDraft = await addRunningPlanReviewProof({
    ...stripRunningPlanReviewProofForProof(result.draft),
    canonicalPlan: badCanonicalPlan,
  });
  const exactness = await validateRunningPlanReviewExactness({
    draft: badDraft,
    reviewToken: badDraft.reviewToken,
    reviewChecksum: badDraft.reviewChecksum,
  });

  assert.equal(
    exactness.ok,
    false,
    `${scenarioName} signed early specificity mutation must not pass confirm exactness.`,
  );
  if (!exactness.ok) {
    assert.equal(exactness.reason, "invalid_review");
    assert.match(exactness.message, /early_phase_load_density|runner-facing richness/i);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
