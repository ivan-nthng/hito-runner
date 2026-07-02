import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  confirmActivePlanTransitionForUser,
  reviewActivePlanTransitionForUser,
  type ActivePlanTransitionDependencies,
} from "../src/lib/active-plan-transition-actions";
import { buildActivePlanReplacementCarryForward } from "../src/lib/active-plan-replacement-carry-forward";
import { buildReviewedFirstPlanImportedSeed } from "../src/lib/active-plan-persistence";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "../src/lib/manual-workout-authoring/schema";
import {
  buildReviewedRunningPlanPreview,
  buildReviewedAiGeneratedRunningPlanPreview,
  confirmRunningPlanDraftForUser,
  type RunningPlanConfirmActionInput,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import { buildAiGeneratedRunningPlanDevFixturePreviewOptions } from "../src/lib/ai-generated-running-plan-dev-fixture";
import {
  buildAiGeneratedRunningPlanAuthoringInput,
  isAiGeneratedRunningPlanPreviewDraft,
} from "../src/lib/ai-generated-running-plan";
import {
  buildRunningPlanCanonicalPlan,
  validateRunningPlanReviewExactness,
  type RunningPlanPreviewDraft,
  type RunningPlanReviewedPreviewDraft,
} from "../src/lib/running-plan-engine-review";
import {
  HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
  TEN_K_PLAN_BUILDER_SOURCE_KIND,
  summarizeRunningPlanCanonicalPrescriptionGrammar,
  summarizeRunnerFacingCanonicalRichness,
} from "../src/lib/plan-creation-engine";
import type { RunningPlanDistanceFamily } from "../src/lib/plan-creation-engine";
import { resolveTenKBeginnerDosePolicyRunnerLevel } from "../src/lib/plan-creation-engine/ten-k-beginner-dose-policy";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import {
  benchmarkPaceUsefulWorkoutKinds,
  validateRunnerFacingTargetReadbackContract,
} from "./running-plan-engine-target-readback-contract";
import {
  rowHasPaceTargets,
  tamperReviewToken,
  validateCanonicalRowsAreNumeric,
  validateNoFakePaceOrPersonalHr,
  validateNoPersonalHrTargets,
} from "./running-plan-engine-confirm/assertions";
import {
  buildManualActivePlanContext,
  buildPersistedWorkoutFromSeed,
  type PersistedWorkoutRow,
} from "./running-plan-engine-confirm/manual-transition-fixtures";
import {
  buildSkippedPersistenceResult,
  formatPersistenceBlocker,
  readCliOptions,
  resolvePersistencePreflight,
  validatePersistenceContract,
} from "./running-plan-engine-confirm/persistence-proof";

const baseInput = {
  age: 36,
  heightCm: 178,
  weightKg: 74,
  daysPerWeek: 5,
  fixedRestDays: ["Wednesday", "Saturday"],
  preferredLongRunDay: "Sunday",
  startDate: "2026-06-08",
} as const;

const RECENT_5K_BENCHMARK = {
  kind: "recent_5k_time",
  recent5kTime: "25:00",
} as const satisfies NonNullable<RunningPlanPreviewActionInput["benchmark"]>;

const browserEquivalentAiQuickSetupTenKInput = {
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
} as const satisfies RunningPlanPreviewActionInput;

const supportedFixtures: readonly Array<{
  family: RunningPlanDistanceFamily;
  sourceKind:
    | typeof TEN_K_PLAN_BUILDER_SOURCE_KIND
    | typeof HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND
    | typeof MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND
    | typeof MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND;
  runnerLevel: RunningPlanPreviewActionInput["runnerLevel"];
  expectedRows: number;
  expectedNonRestRows: number;
  expectedEndpointMeters: number | null;
  expectedFinalSourceWorkoutType: "final_selected_distance_day" | "marathon_base_endpoint";
}> = [
  {
    family: "10K",
    sourceKind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
    runnerLevel: "sometimes_runs",
    expectedRows: 84,
    expectedNonRestRows: 60,
    expectedEndpointMeters: 10_000,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
  },
  {
    family: "Half Marathon",
    sourceKind: HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
    runnerLevel: "runs_a_lot",
    expectedRows: 168,
    expectedNonRestRows: 120,
    expectedEndpointMeters: 21_100,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
  },
  {
    family: "Marathon Base",
    sourceKind: MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
    runnerLevel: "runs_a_lot",
    expectedRows: 168,
    expectedNonRestRows: 120,
    expectedEndpointMeters: null,
    expectedFinalSourceWorkoutType: "marathon_base_endpoint",
  },
  {
    family: "Marathon Completion",
    sourceKind: MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
    runnerLevel: "professional_competitive",
    expectedRows: 168,
    expectedNonRestRows: 120,
    expectedEndpointMeters: 42_195,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
  },
] as const;

async function main() {
  const options = readCliOptions();
  const reviewedDrafts = await validateStableReviewContract();
  const aiGeneratedQuickSetupDraft = await validateAiGeneratedQuickSetupReviewedDraft();
  const simplifiedQuickSetupProof = await validateSimplifiedQuickSetupTenKPreviewContract();
  const benchmarkProof = await validateBenchmarkBackedPaceTruthContract();
  await validateFailureBoundaries(reviewedDrafts[0]);
  const activeManualTransitionProof = await validateActiveManualPlanTransitionContract(
    reviewedDrafts[0],
  );
  validateActivePlanTransitionSourceBoundaries();
  validateLegacyPlanPresetCreateSeamIsRemoved();

  const persistencePreflight = resolvePersistencePreflight(options);

  if (!persistencePreflight.shouldRun && options.requirePersistence) {
    throw new Error(formatPersistenceBlocker(persistencePreflight));
  }

  const persistenceDrafts = [...reviewedDrafts, aiGeneratedQuickSetupDraft];
  const persistenceResults = persistencePreflight.shouldRun
    ? await validatePersistenceContract(
        persistenceDrafts,
        persistencePreflight,
        buildPreviewInputForConfirm,
      )
    : buildSkippedPersistenceResult(persistencePreflight);

  console.log("Running plan engine confirm contract checks passed.", {
    stableReviewDrafts: reviewedDrafts.map((draft) => ({
      sourceKind: draft.sourceKind,
      planFamily: draft.planFamily,
      rows: draft.canonicalRowCount,
      nonRestRows: draft.canonicalNonRestRowCount,
      reviewContractVersion: draft.reviewContractVersion,
    })),
    aiGeneratedQuickSetup: {
      sourceKind: aiGeneratedQuickSetupDraft.sourceKind,
      planFamily: aiGeneratedQuickSetupDraft.planFamily,
      rows: aiGeneratedQuickSetupDraft.canonicalRowCount,
      nonRestRows: aiGeneratedQuickSetupDraft.canonicalNonRestRowCount,
      reviewContractVersion: aiGeneratedQuickSetupDraft.reviewContractVersion,
    },
    simplifiedQuickSetup: simplifiedQuickSetupProof,
    benchmarkPaceTruth: benchmarkProof,
    activeManualTransition: activeManualTransitionProof,
    persistence: persistenceResults,
  });
}

async function validateStableReviewContract() {
  const reviewedDrafts: Array<RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>> = [];

  for (const fixture of supportedFixtures) {
    const result = await buildReviewedRunningPlanPreview(buildFixtureInput(fixture));
    assert.equal(result.ok, true, `${fixture.family} preview must be reviewable.`);
    if (!result.ok) {
      throw new Error(result.unavailable.error.message);
    }

    const draft = result.draft;
    const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
    const importedSeed = buildImportedPlanSeed(canonicalPlan);
    const runnerFacingRichness = summarizeRunnerFacingCanonicalRichness({
      family: draft.planFamily,
      runnerLevel: resolveRunnerLevelForConfirmQualityGates(draft),
      loadContext: draft.normalizedInputSummary.loadContext,
      rows: canonicalPlan.planned_workouts,
    });
    const prescriptionGrammar = summarizeRunningPlanCanonicalPrescriptionGrammar(
      canonicalPlan.planned_workouts,
    );
    const nonRestRows = canonicalPlan.planned_workouts.filter(
      (workout) => workout.workout_type !== "rest",
    );
    const finalNonRestRow = nonRestRows.at(-1);

    assert.equal(draft.sourceKind, fixture.sourceKind);
    assert.equal(draft.source_kind, fixture.sourceKind);
    assert.equal(draft.sourceStatus, "preview_ready");
    assert.equal(draft.persisted, false);
    assert.equal(draft.mutates, false);
    assert.equal(draft.callsOpenAi, false);
    assert.equal(draft.canonicalRowCount, fixture.expectedRows);
    assert.equal(draft.canonicalNonRestRowCount, fixture.expectedNonRestRows);
    assert.equal(canonicalPlan.source_kind, fixture.sourceKind);
    assert.equal(canonicalPlan.planned_workouts.length, fixture.expectedRows);
    assert.equal(nonRestRows.length, fixture.expectedNonRestRows);
    assert.equal(finalNonRestRow?.source_workout_type, fixture.expectedFinalSourceWorkoutType);
    assert.equal(draft.endpointProof.endpointDistanceMeters, fixture.expectedEndpointMeters);
    assert.equal(draft.endpointProof.endpointMainDistanceMeters, fixture.expectedEndpointMeters);
    assert.equal(importedSeed.workouts.length, fixture.expectedRows);
    assert.equal(
      importedSeed.workouts.filter((workout) => workout.workoutType !== "rest").length,
      fixture.expectedNonRestRows,
    );

    validateNoFakePaceOrPersonalHr(canonicalPlan.planned_workouts);
    validateRunnerFacingTargetReadbackContract(canonicalPlan, fixture.family);
    validateCanonicalRowsAreNumeric(canonicalPlan.planned_workouts);
    assert.deepEqual(
      runnerFacingRichness.issues,
      [],
      `${fixture.family} canonical rows must satisfy runner-facing richness gates.`,
    );
    assert.deepEqual(
      prescriptionGrammar.issues,
      [],
      `${fixture.family} canonical rows must satisfy executable prescription grammar gates.`,
    );
    assert.equal(
      runnerFacingRichness.missingSourceWorkoutTypeCount,
      0,
      `${fixture.family} canonical rows must preserve source_workout_type for export/readback.`,
    );

    const exactness = await validateRunningPlanReviewExactness({
      draft,
      reviewToken: draft.reviewToken,
      reviewChecksum: draft.reviewChecksum,
    });
    assert.equal(exactness.ok, true, `${fixture.family} fresh review token must validate.`);

    reviewedDrafts.push(draft);
  }

  return reviewedDrafts;
}

async function validateAiGeneratedQuickSetupReviewedDraft(): Promise<
  RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>
> {
  const authoring = buildAiGeneratedRunningPlanAuthoringInput(
    browserEquivalentAiQuickSetupTenKInput,
  );
  assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
  if (!authoring.ok) {
    throw new Error(authoring.message);
  }

  const fixturePreviewOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: authoring.authoringInput,
    planFamily: authoring.planFamily,
    today:
      browserEquivalentAiQuickSetupTenKInput.startDate ??
      authoring.authoringInput.schedule.startDate,
    env: localAiGeneratedFixtureEnv(),
  });
  assert.notEqual(
    fixturePreviewOptions,
    null,
    "AI-generated Quick setup confirm proof must use the local QA/dev OpenAI-shaped fixture.",
  );

  const result = await buildReviewedAiGeneratedRunningPlanPreview(
    browserEquivalentAiQuickSetupTenKInput,
    {
      aiPreview: fixturePreviewOptions ?? undefined,
    },
  );
  assert.equal(
    result.ok,
    true,
    result.ok
      ? "AI-generated Quick setup 10K no-benchmark preview must be reviewed."
      : result.unavailable.error.message,
  );
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  const draft = result.draft;
  assert.equal(isAiGeneratedRunningPlanPreviewDraft(draft), true);
  assert.equal(draft.planFamily, "10K");
  assert.equal(draft.endpointProof.endpointDistanceMeters, 10_000);
  assert.equal(draft.reviewSafety.confirmCallsOpenAi, false);

  const exactness = await validateRunningPlanReviewExactness({
    draft,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(
    exactness.ok,
    true,
    exactness.ok ? "AI-generated Quick setup review exactness must validate." : exactness.message,
  );
  assert.doesNotThrow(
    () => buildReviewedFirstPlanImportedSeed(buildRunningPlanCanonicalPlan(draft)),
    "AI-generated Quick setup reviewed plan must pass first-plan persistence seed guards.",
  );

  return draft;
}

async function validateSimplifiedQuickSetupTenKPreviewContract() {
  const quickSetupInput = {
    age: 34,
    heightCm: 178,
    weightKg: 72,
    runnerLevel: "runs_a_lot",
    distanceFamily: "10K",
    daysPerWeek: null,
    fixedRestDays: null,
    preferredLongRunDay: null,
    startDate: null,
    benchmark: { kind: "unknown" },
    planGoalIntent: {
      distance: { kind: "preset", preset: "10K" },
      targetFinishTime: null,
      targetDate: null,
    },
  } satisfies RunningPlanPreviewActionInput;
  const result = await buildReviewedRunningPlanPreview(quickSetupInput);

  assert.equal(
    result.ok,
    true,
    "Simplified Quick setup 10K/no-benchmark payload must produce a reviewed preview.",
  );
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  const draft = result.draft;
  const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
  const finalNonRestRow = canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest")
    .at(-1);

  assert.equal(draft.sourceStatus, "preview_ready");
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.callsOpenAi, false);
  assert.equal(draft.planFamily, "10K");
  assert.equal(draft.endpointProof.endpointDistanceMeters, 10_000);
  assert.equal(draft.endpointProof.endpointMainDistanceMeters, 10_000);
  assert.equal(finalNonRestRow?.source_workout_type, "final_selected_distance_day");
  assert.equal(draft.normalizedInputSummary.planGoalIntent.distance?.label, "10K");
  assert.equal(draft.normalizedInputSummary.planGoalIntent.targetOutcomePace, null);
  assert.equal(
    draft.normalizedInputSummary.planGoalIntent.metricTruthPolicy.segmentPaceTargetsAllowedFromGoal,
    false,
  );
  assert.equal(
    draft.normalizedInputSummary.planGoalIntent.metricTruthPolicy.hrTargetsAllowedFromGoal,
    false,
  );

  validateNoFakePaceOrPersonalHr(canonicalPlan.planned_workouts);
  validateRunnerFacingTargetReadbackContract(canonicalPlan, "Simplified Quick setup 10K fixture");
  validateCanonicalRowsAreNumeric(canonicalPlan.planned_workouts);
  assert.deepEqual(
    summarizeRunnerFacingCanonicalRichness({
      family: draft.planFamily,
      runnerLevel: resolveRunnerLevelForConfirmQualityGates(draft),
      loadContext: draft.normalizedInputSummary.loadContext,
      rows: canonicalPlan.planned_workouts,
    }).issues,
    [],
    "Simplified Quick setup 10K canonical rows must satisfy runner-facing richness gates.",
  );
  assert.deepEqual(
    summarizeRunningPlanCanonicalPrescriptionGrammar(canonicalPlan.planned_workouts).issues,
    [],
    "Simplified Quick setup 10K canonical rows must satisfy prescription grammar gates.",
  );

  const exactness = await validateRunningPlanReviewExactness({
    draft,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(exactness.ok, true, "Simplified Quick setup 10K review must be confirm-safe.");

  return {
    sourceKind: draft.sourceKind,
    planFamily: draft.planFamily,
    rows: draft.canonicalRowCount,
    nonRestRows: draft.canonicalNonRestRowCount,
    endpointMeters: draft.endpointProof.endpointDistanceMeters,
    goalPaceUnlocksExecutableTargets: false,
    reviewExactness: "valid",
  };
}

async function validateBenchmarkBackedPaceTruthContract() {
  const targetTimeOnlyResult = await buildReviewedRunningPlanPreview({
    ...buildFixtureInput(supportedFixtures[0]),
    planGoalIntent: {
      targetFinishTime: "45:00",
    },
  } satisfies RunningPlanPreviewActionInput);
  assert.equal(
    targetTimeOnlyResult.ok,
    true,
    "Diagnostic target-time-only selected-plan fixture should still build without pace.",
  );
  if (!targetTimeOnlyResult.ok) {
    throw new Error(targetTimeOnlyResult.unavailable.error.message);
  }
  assert.equal(
    targetTimeOnlyResult.draft.normalizedInputSummary.planGoalIntent.targetFinishTime?.label,
    "45:00",
    "Target finish time should survive as normalized plan goal intent.",
  );
  assert.equal(
    targetTimeOnlyResult.draft.normalizedInputSummary.planGoalIntent.metricTruthPolicy
      .segmentPaceTargetsAllowedFromGoal,
    false,
    "Target finish time must not unlock executable workout pace targets.",
  );
  validateNoFakePaceOrPersonalHr(
    buildRunningPlanCanonicalPlan(targetTimeOnlyResult.draft).planned_workouts,
  );
  validateRunnerFacingTargetReadbackContract(
    buildRunningPlanCanonicalPlan(targetTimeOnlyResult.draft),
    "Target-time-only selected-plan fixture",
  );

  const benchmarkProofs = [];

  for (const fixture of supportedFixtures) {
    const benchmarkInput = {
      ...buildFixtureInput(fixture),
      benchmark: RECENT_5K_BENCHMARK,
    } satisfies RunningPlanPreviewActionInput;
    const result = await buildReviewedRunningPlanPreview(benchmarkInput);
    assert.equal(result.ok, true, `${fixture.family} benchmark-backed preview must build.`);
    if (!result.ok) throw new Error(result.unavailable.error.message);

    const draft = result.draft;
    const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
    const importedSeed = buildImportedPlanSeed(canonicalPlan);
    const paceRows = canonicalPlan.planned_workouts.filter(rowHasPaceTargets);
    const nonPaceRows = canonicalPlan.planned_workouts.filter(
      (row) => row.workout_type !== "rest" && !rowHasPaceTargets(row),
    );
    const importedPaceWorkouts = importedSeed.workouts.filter((workout) =>
      JSON.stringify(workout).includes("pace_min_per_km_range"),
    );
    const benchmarkQualityPaceRows = paceRows.filter((row) =>
      benchmarkPaceUsefulWorkoutKinds(fixture.family).has(String(row.source_workout_type)),
    );

    assert.equal(draft.normalizedInputSummary.benchmarkPaceTruth?.kind, "recent_5k");
    assert.equal(draft.normalizedInputSummary.benchmarkPaceTruth.source, "recent_5k_time");
    assert.ok(
      paceRows.length > 0,
      `${fixture.family} benchmark-backed canonical rows must include pace-capable rows.`,
    );
    assert.ok(
      benchmarkQualityPaceRows.length > 0,
      `${fixture.family} benchmark-backed pace must reach quality/specific workouts, not only easy support rows.`,
    );
    assert.ok(
      importedPaceWorkouts.length > 0,
      `${fixture.family} benchmark-backed pace targets must survive export-shaped readback.`,
    );

    for (const row of paceRows) {
      assert.equal(row.metric_mode?.executable_mode, "pace_executable");
      assert.equal(row.metric_mode?.pace_targets_allowed, true);
      assert.equal(row.metric_mode?.hr_targets_allowed, false);
    }

    for (const row of nonPaceRows) {
      assert.equal(
        row.metric_mode?.pace_targets_allowed,
        false,
        `${row.workout_id} without pace targets must not advertise pace capability.`,
      );
      assert.equal(row.metric_mode?.hr_targets_allowed, false);
    }

    validateNoPersonalHrTargets(canonicalPlan.planned_workouts);
    validateRunnerFacingTargetReadbackContract(
      canonicalPlan,
      `${fixture.family} benchmark-backed selected-plan fixture`,
    );
    validateCanonicalRowsAreNumeric(canonicalPlan.planned_workouts, {
      expectedMode: "mixed",
    });
    assert.deepEqual(
      summarizeRunningPlanCanonicalPrescriptionGrammar(canonicalPlan.planned_workouts).issues,
      [],
      `${fixture.family} benchmark-backed selected-plan rows must still satisfy executable prescription grammar.`,
    );

    const exactness = await validateRunningPlanReviewExactness({
      draft,
      reviewToken: draft.reviewToken,
      reviewChecksum: draft.reviewChecksum,
    });
    assert.equal(
      exactness.ok,
      true,
      `${fixture.family} benchmark-backed review token must validate.`,
    );

    const changedBenchmark = await buildReviewedRunningPlanPreview({
      ...benchmarkInput,
      benchmark: {
        kind: "recent_5k_time",
        recent5kTime: "30:00",
      },
    });
    assert.equal(
      changedBenchmark.ok,
      true,
      `${fixture.family} changed benchmark fixture should build.`,
    );
    if (!changedBenchmark.ok) throw new Error(changedBenchmark.unavailable.error.message);

    const changedBenchmarkExactness = await validateRunningPlanReviewExactness({
      draft: changedBenchmark.draft,
      reviewToken: draft.reviewToken,
      reviewChecksum: draft.reviewChecksum,
    });
    assert.equal(changedBenchmarkExactness.ok, false);
    if (!changedBenchmarkExactness.ok) {
      assert.equal(changedBenchmarkExactness.reason, "stale_review");
    }

    benchmarkProofs.push({
      family: fixture.family,
      sourceKind: draft.sourceKind,
      paceRows: paceRows.length,
      qualityPaceRows: benchmarkQualityPaceRows.length,
      importedPaceWorkouts: importedPaceWorkouts.length,
      hrTargetsAllowed: false,
    });
  }

  return benchmarkProofs;
}

async function validateFailureBoundaries(
  reviewedDraft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  const changedStartResult = await buildReviewedRunningPlanPreview({
    ...buildFixtureInput({
      family: reviewedDraft.planFamily,
      sourceKind: reviewedDraft.sourceKind as (typeof supportedFixtures)[number]["sourceKind"],
      runnerLevel: reviewedDraft.normalizedInputSummary.runnerLevel,
      expectedRows: reviewedDraft.canonicalRowCount,
      expectedNonRestRows: reviewedDraft.canonicalNonRestRowCount,
      expectedEndpointMeters: reviewedDraft.endpointProof.endpointDistanceMeters,
      expectedFinalSourceWorkoutType:
        reviewedDraft.planFamily === "Marathon Base"
          ? "marathon_base_endpoint"
          : "final_selected_distance_day",
    }),
    startDate: "2026-06-15",
  });
  assert.equal(changedStartResult.ok, true, "Changed-start fixture should still build.");
  if (!changedStartResult.ok) throw new Error(changedStartResult.unavailable.error.message);

  const changedStartExactness = await validateRunningPlanReviewExactness({
    draft: changedStartResult.draft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(changedStartExactness.ok, false);
  if (!changedStartExactness.ok) {
    assert.equal(changedStartExactness.reason, "stale_review");
  }

  const changedSetupResult = await buildReviewedRunningPlanPreview({
    ...buildFixtureInput({
      family: reviewedDraft.planFamily,
      sourceKind: reviewedDraft.sourceKind as (typeof supportedFixtures)[number]["sourceKind"],
      runnerLevel: reviewedDraft.normalizedInputSummary.runnerLevel,
      expectedRows: reviewedDraft.canonicalRowCount,
      expectedNonRestRows: reviewedDraft.canonicalNonRestRowCount,
      expectedEndpointMeters: reviewedDraft.endpointProof.endpointDistanceMeters,
      expectedFinalSourceWorkoutType:
        reviewedDraft.planFamily === "Marathon Base"
          ? "marathon_base_endpoint"
          : "final_selected_distance_day",
    }),
    fixedRestDays: ["Tuesday", "Saturday"],
  });
  assert.equal(changedSetupResult.ok, true, "Changed-setup fixture should still build.");
  if (!changedSetupResult.ok) throw new Error(changedSetupResult.unavailable.error.message);

  const changedSetupExactness = await validateRunningPlanReviewExactness({
    draft: changedSetupResult.draft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(changedSetupExactness.ok, false);
  if (!changedSetupExactness.ok) {
    assert.equal(changedSetupExactness.reason, "stale_review");
  }

  const invalidTokenExactness = await validateRunningPlanReviewExactness({
    draft: reviewedDraft,
    reviewToken: tamperReviewToken(reviewedDraft.reviewToken),
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(invalidTokenExactness.ok, false);
  if (!invalidTokenExactness.ok) {
    assert.equal(invalidTokenExactness.reason, "invalid_review");
  }

  const mismatchedChecksumExactness = await validateRunningPlanReviewExactness({
    draft: reviewedDraft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: "0".repeat(64),
  });
  assert.equal(mismatchedChecksumExactness.ok, false);
  if (!mismatchedChecksumExactness.ok) {
    assert.equal(mismatchedChecksumExactness.reason, "stale_review");
  }

  const tamperedRowsDraft = {
    ...reviewedDraft,
    calendarRows: reviewedDraft.calendarRows.map((row, index) =>
      index === 0 ? { ...row, title: `${row.title} tampered` } : row,
    ),
  } satisfies RunningPlanPreviewDraft;
  const tamperedRowsExactness = await validateRunningPlanReviewExactness({
    draft: tamperedRowsDraft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(tamperedRowsExactness.ok, false);
  if (!tamperedRowsExactness.ok) {
    assert.equal(tamperedRowsExactness.reason, "stale_review");
  }

  const cardMismatch = await confirmRunningPlanDraftForUser("dry-run-user", {
    previewInput: buildFixtureInput(supportedFixtures[0]),
    planFamily: "Half Marathon",
    sourceKind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(cardMismatch.ok, false);
  if (!cardMismatch.ok) {
    assert.equal(cardMismatch.reason, "input_mismatch");
  }

  const clientRowsPayload = await confirmRunningPlanDraftForUser("dry-run-user", {
    previewInput: buildFixtureInput(supportedFixtures[0]),
    planFamily: "10K",
    sourceKind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
    calendarRows: reviewedDraft.calendarRows,
  });
  assert.equal(clientRowsPayload.ok, false);
  if (!clientRowsPayload.ok) {
    assert.equal(clientRowsPayload.reason, "invalid_review");
  }

  const invalidBasicsPreview = await buildReviewedRunningPlanPreview({
    ...buildFixtureInput(supportedFixtures[0]),
    age: -1,
  });
  assert.equal(invalidBasicsPreview.ok, false);
  if (!invalidBasicsPreview.ok) {
    assert.equal(invalidBasicsPreview.unavailable.sourceStatus, "preview_unavailable");
    assert.equal(invalidBasicsPreview.unavailable.persisted, false);
  }
}

async function validateActiveManualPlanTransitionContract(
  reviewedDraft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  const userId = "transition-dry-run-user";
  const reviewInput = {
    activePlanId: "manual-plan-1",
    candidate: buildConfirmInputFromDraft(reviewedDraft),
  };
  let context = buildManualActivePlanContext();
  let persistCalls = 0;
  let persistedInput: Parameters<ActivePlanTransitionDependencies["persistTransition"]>[0] | null =
    null;
  let persistedRows: PersistedWorkoutRow[] = [];
  const dependencies: Partial<ActivePlanTransitionDependencies> = {
    today: () => "2026-06-08",
    getPlanContext: async () => context,
    loadEvidenceSummary: async () => ({
      providerEvidenceCount: 1,
      actualMetricCount: 1,
      comparisonCount: 1,
      aiInsightCount: 1,
      evidenceBackedWorkoutIds: ["manual-workout-past"],
    }),
    persistTransition: async (input) => {
      persistCalls += 1;
      persistedInput = input;
      const seed = buildImportedPlanSeed(input.reviewedPlan);
      const carried = await buildActivePlanReplacementCarryForward({
        userId,
        importedSeed: seed,
        existingWorkouts: context.existingWorkouts.workouts,
        logsByWorkoutId: context.existingWorkouts.logsByWorkoutId,
        replacementStartsAt: input.replacementStartsAt,
        evidenceWorkoutIds: new Set(["manual-workout-past"]),
      });
      persistedRows = carried.importedSeed.workouts.map((workout, index) =>
        buildPersistedWorkoutFromSeed(workout, index, "selected-plan-1", userId),
      );

      return {
        archivedPlan: {
          ...input.currentActivePlan,
          status: "archived",
        },
        activePlan: {
          ...input.currentActivePlan,
          id: "selected-plan-1",
          title: input.reviewedPlan.plan_name,
          source_kind: input.reviewedPlan.source_kind,
          source_template: input.reviewedPlan.schema_version,
          schema_version: input.reviewedPlan.schema_version,
          start_date: input.reviewedPlan.start_date,
          end_date:
            input.reviewedPlan.planned_workouts.at(-1)?.date ?? input.reviewedPlan.start_date,
          status: "active",
        },
        workouts: persistedRows,
      };
    },
  };

  const review = await reviewActivePlanTransitionForUser(userId, reviewInput, dependencies);
  assert.equal(review.ok, true, "Active manual transition review must be available.");
  if (!review.ok) throw new Error(review.message);

  assert.equal(review.persisted, false);
  assert.equal(review.mutates, false);
  assert.equal(review.callsOpenAi, false);
  assert.equal(review.currentPlan.id, "manual-plan-1");
  assert.equal(review.currentPlan.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(review.candidatePlan.sourceKind, reviewedDraft.sourceKind);
  assert.equal(review.affectedManualSchedule.upcomingWorkoutCount, 2);
  assert.deepEqual(review.affectedManualSchedule.upcomingWorkoutDates, [
    "2026-06-09",
    "2026-06-12",
  ]);
  assert.equal(review.preservedHistory.loggedWorkoutCount, 1);
  assert.equal(review.preservedHistory.evidenceBackedWorkoutCount, 1);
  assert.equal(review.manualTemplates.preserved, true);
  assert.equal(review.metricHonesty.fakePaceAllowed, false);
  assert.equal(review.metricHonesty.fakePersonalHrAllowed, false);
  assert.equal(review.metricHonesty.hrTargetRowCount, 0);
  assert.equal(review.safety.trustedClientRows, false);
  assert.equal(review.safety.upcomingManualWorkoutsMergeIntoCandidate, false);
  assert.equal(persistCalls, 0, "Transition review must be non-mutating.");

  const clientRowsPayload = await reviewActivePlanTransitionForUser(
    userId,
    {
      ...reviewInput,
      calendarRows: reviewedDraft.calendarRows,
    },
    dependencies,
  );
  assert.equal(clientRowsPayload.ok, false);
  if (!clientRowsPayload.ok) {
    assert.equal(clientRowsPayload.reason, "invalid_review");
  }

  const confirmed = await confirmActivePlanTransitionForUser(
    userId,
    {
      reviewInput,
      transitionReviewToken: review.transitionReviewToken,
      transitionReviewChecksum: review.transitionReviewChecksum,
    },
    dependencies,
  );
  assert.equal(confirmed.ok, true, "Reviewed manual transition confirm must persist.");
  if (!confirmed.ok) throw new Error(confirmed.message);

  assert.equal(persistCalls, 1);
  assert.ok(persistedInput, "Transition confirm must call the canonical persistence owner.");
  assert.equal(persistedInput.currentActivePlan.id, "manual-plan-1");
  assert.equal(persistedInput.currentActivePlan.source_kind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(persistedInput.expectedCurrentActivePlanUpdatedAt, "2026-06-07T10:00:00Z");
  assert.equal(persistedInput.reviewedPlan.source_kind, reviewedDraft.sourceKind);
  assert.equal(
    (persistedInput.planMetadata?.goalMetadata as { active_plan_transition?: unknown })
      .active_plan_transition != null,
    true,
  );
  assert.equal(confirmed.archivedPlanId, "manual-plan-1");
  assert.equal(confirmed.activePlanId, "selected-plan-1");
  assert.equal(confirmed.affectedManualWorkoutCount, 2);
  assert.equal(confirmed.calendarRowCount, reviewedDraft.canonicalRowCount + 1);
  assert.equal(confirmed.safety.oldPlanArchived, true);
  assert.equal(confirmed.safety.upcomingManualWorkoutsMerged, false);
  assert.equal(confirmed.safety.trustedClientRows, false);
  assert.equal(persistedInput.replacementStartsAt, "2026-06-08");
  validateNoFakePaceOrPersonalHr(persistedInput.reviewedPlan.planned_workouts);
  const serializedPersistedRows = JSON.stringify(persistedRows);
  assert.match(
    serializedPersistedRows,
    /manual-workout-past/,
    "Past logged/evidence-backed workout history must carry forward into the new active calendar.",
  );
  assert.doesNotMatch(
    serializedPersistedRows,
    /manual-workout-future/,
    "Future mutable rows from the previous plan must not merge into the selected plan.",
  );

  context = buildManualActivePlanContext({
    plan: { updated_at: "2026-06-07T11:00:00Z" },
  });
  const staleRevision = await confirmActivePlanTransitionForUser(
    userId,
    {
      reviewInput,
      transitionReviewToken: review.transitionReviewToken,
      transitionReviewChecksum: review.transitionReviewChecksum,
    },
    dependencies,
  );
  assert.equal(staleRevision.ok, false);
  if (!staleRevision.ok) {
    assert.equal(staleRevision.reason, "stale_review");
  }

  context = buildManualActivePlanContext();
  const invalidToken = await confirmActivePlanTransitionForUser(
    userId,
    {
      reviewInput,
      transitionReviewToken: tamperReviewToken(review.transitionReviewToken),
      transitionReviewChecksum: review.transitionReviewChecksum,
    },
    dependencies,
  );
  assert.equal(invalidToken.ok, false);
  if (!invalidToken.ok) {
    assert.equal(invalidToken.reason, "invalid_review");
  }

  const changedCandidate = await confirmActivePlanTransitionForUser(
    userId,
    {
      reviewInput: {
        ...reviewInput,
        candidate: {
          ...reviewInput.candidate,
          previewInput: {
            ...reviewInput.candidate.previewInput,
            startDate: "2026-06-15",
          },
        },
      },
      transitionReviewToken: review.transitionReviewToken,
      transitionReviewChecksum: review.transitionReviewChecksum,
    },
    dependencies,
  );
  assert.equal(changedCandidate.ok, false);
  if (!changedCandidate.ok) {
    assert.equal(changedCandidate.reason, "stale_review");
  }

  context = buildManualActivePlanContext({
    plan: { source_kind: reviewedDraft.sourceKind },
  });
  const nonManual = await reviewActivePlanTransitionForUser(userId, reviewInput, dependencies);
  assert.equal(
    nonManual.ok,
    true,
    "Reviewed active-plan replacement must support non-manual sources.",
  );

  context = { activePlan: null, existingWorkouts: { workouts: [], logsByWorkoutId: new Map() } };
  const noActivePlan = await reviewActivePlanTransitionForUser(userId, reviewInput, dependencies);
  assert.equal(noActivePlan.ok, false);
  if (!noActivePlan.ok) {
    assert.equal(noActivePlan.reason, "no_active_plan");
  }

  return {
    sourceKind: reviewedDraft.sourceKind,
    reviewedUpcomingManualWorkouts: review.affectedManualSchedule.upcomingWorkoutCount,
    protectedHistoryLoggedWorkouts: review.preservedHistory.loggedWorkoutCount,
    transitionConfirmRows: confirmed.calendarRowCount,
    activeCalendarPastRowsCarriedForward: 1,
    mutatesOnlyOnConfirm: true,
  };
}

function validateActivePlanTransitionSourceBoundaries() {
  const persistenceSource = readFileSync("src/lib/active-plan-persistence.ts", "utf8");
  const transitionSource = readFileSync("src/lib/active-plan-transition-actions.ts", "utf8");
  const activePlanCreateDialogSource = readFileSync(
    "src/components/plan-management/ActivePlanCreatePlanDialog.tsx",
    "utf8",
  );
  const onboardingGateSource = readFileSync("src/components/OnboardingGate.tsx", "utf8");
  const transitionHelperStart = persistenceSource.indexOf(
    "export async function transitionActiveManualPlanToReviewedCanonicalPlanForUser",
  );
  const nextHelperStart = persistenceSource.indexOf(
    "export async function createEmptyActivePlanForUser",
  );
  const transitionHelperSource = persistenceSource.slice(transitionHelperStart, nextHelperStart);

  assert.ok(transitionHelperStart >= 0, "Transition persistence helper must exist.");
  assert.ok(
    nextHelperStart > transitionHelperStart,
    "Transition persistence helper must be bounded.",
  );
  assert.ok(
    transitionHelperSource.indexOf("currentPlanStillCurrent") <
      transitionHelperSource.indexOf("upsertRunnerProfile"),
    "Transition persistence must verify active-plan revision before profile or plan mutation.",
  );
  assert.doesNotMatch(
    transitionHelperSource,
    /replaceActivePlanWithImportedInput|deletePreviousPlan|\.delete\(\)/,
    "Active manual transition must not use the legacy import replacement path that deletes the old plan.",
  );
  assert.match(
    transitionHelperSource,
    /buildActivePlanReplacementCarryForward/,
    "Active-plan transition persistence must carry forward protected history into the new active calendar.",
  );
  assert.doesNotMatch(
    persistenceSource.slice(
      persistenceSource.indexOf("async function replaceActivePlanWithImportedInput"),
      persistenceSource.indexOf("async function prepareImportedPlanApply"),
    ),
    /deletePreviousPlan|\.from\("plan_cycles"\)\s*\.delete\(\)\s*\.eq\("id", planContext\.activePlan\.id\)/,
    "Imported/text plan replacement must archive the previous plan instead of deleting it.",
  );
  assert.doesNotMatch(
    transitionSource,
    /confirmRunningPlanDraft/,
    "Active manual transition actions must not call the no-active-plan selected confirm seam.",
  );
  assert.doesNotMatch(
    activePlanCreateDialogSource,
    /confirmRunningPlanDraft/,
    "Saved-mode Create a plan dialog must route confirm through active-plan transition actions.",
  );
  assert.doesNotMatch(
    activePlanCreateDialogSource,
    /MANUAL_USER_BUILT_PLAN_SOURCE_KIND|isActiveManualPlan/,
    "Saved-mode Create a plan dialog must not hard-block reviewed replacement to manual active plans.",
  );
  assert.match(
    onboardingGateSource,
    /confirmRunningPlanDraft/,
    "No-active-plan onboarding may still use the selected-plan first-plan confirm seam.",
  );
}

function validateLegacyPlanPresetCreateSeamIsRemoved() {
  const presetActionsSource = readFileSync("src/lib/plan-preset-actions.ts", "utf8");
  const trainingApiSource = readFileSync("src/lib/training-api.ts", "utf8");
  const runningPlanActionsSource = readFileSync("src/lib/running-plan-engine-actions.ts", "utf8");
  const legacyReviewActionName = ["review", "Plan", "Preset", "Draft"].join("");
  const legacyConfirmActionName = ["confirm", "Plan", "Preset", "Draft"].join("");
  const legacyReviewResultName = ["Plan", "Preset", "Review", "Draft", "Action", "Result"].join("");
  const legacyConfirmResultName = ["Plan", "Preset", "Confirm", "Action", "Result"].join("");
  const legacyBlockedReason = ["preview", "only"].join("_");
  const cardDiscoveryActionName = ["get", "Plan", "Preset", "Cards"].join("");
  const cardDiscoveryResultName = ["Plan", "Preset", "Cards", "Action", "Result"].join("");

  assert.match(
    presetActionsSource,
    new RegExp(`export const ${cardDiscoveryActionName}\\b`),
    "Plan Preset card discovery must remain available from the canonical action owner.",
  );
  assert.match(
    presetActionsSource,
    new RegExp(`export type ${cardDiscoveryResultName}\\b`),
    "Plan Preset card discovery result type must remain available from the canonical action owner.",
  );
  assert.doesNotMatch(
    presetActionsSource,
    new RegExp(`\\b${legacyReviewActionName}\\b`),
    "Legacy Plan Preset review action must not remain in runtime source.",
  );
  assert.doesNotMatch(
    presetActionsSource,
    new RegExp(`\\b${legacyConfirmActionName}\\b`),
    "Legacy Plan Preset confirm action must not remain in runtime source.",
  );
  assert.doesNotMatch(
    presetActionsSource,
    new RegExp(`\\b${legacyReviewResultName}\\b`),
    "Legacy Plan Preset review result type must not remain in runtime source.",
  );
  assert.doesNotMatch(
    presetActionsSource,
    new RegExp(`\\b${legacyConfirmResultName}\\b`),
    "Legacy Plan Preset confirm result type must not remain in runtime source.",
  );
  assert.doesNotMatch(
    presetActionsSource,
    new RegExp(`reason:\\s*"${legacyBlockedReason}"`),
    "Runtime Plan Preset actions should not preserve a blocked create seam.",
  );
  assert.doesNotMatch(
    presetActionsSource,
    /active_plan_exists|getActivePlan|getPersistedUserIdForAuthContext|Plan presets can create a new plan only when there is no active plan/,
    "Plan Preset card discovery must stay non-mutating and must not be gated by active-plan existence.",
  );
  assert.doesNotMatch(
    trainingApiSource,
    new RegExp(`\\b${cardDiscoveryActionName}\\b|\\b${cardDiscoveryResultName}\\b`),
    "The route-facing facade must not re-export Plan Preset card discovery.",
  );
  assert.doesNotMatch(
    trainingApiSource,
    new RegExp(`\\b${legacyReviewActionName}\\b|\\b${legacyConfirmActionName}\\b`),
    "The route-facing facade must not re-export legacy Plan Preset create actions.",
  );
  assert.match(
    runningPlanActionsSource,
    /export const confirmRunningPlanDraft/,
    "Selected running-plan confirm remains the current plan creation seam.",
  );
  assert.match(
    runningPlanActionsSource,
    /reason:\s*"active_plan_exists"/,
    "Selected running-plan first-plan confirm must still block direct creation when an active plan exists.",
  );
}

function buildFixtureInput(fixture: {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanPreviewActionInput["runnerLevel"];
}): RunningPlanPreviewActionInput {
  return {
    ...baseInput,
    runnerLevel: fixture.runnerLevel,
    distanceFamily: fixture.family,
  };
}

function buildInputFromDraft(draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>) {
  return {
    age: draft.normalizedInputSummary.age,
    heightCm: draft.normalizedInputSummary.heightCm,
    weightKg: draft.normalizedInputSummary.weightKg,
    runnerLevel: draft.normalizedInputSummary.runnerLevel,
    distanceFamily: draft.normalizedInputSummary.distanceFamily,
    daysPerWeek: draft.normalizedInputSummary.daysPerWeek,
    fixedRestDays: [...draft.normalizedInputSummary.fixedRestDays],
    preferredLongRunDay: draft.normalizedInputSummary.preferredLongRunDay,
    startDate: draft.normalizedInputSummary.startDate,
    ...(draft.normalizedInputSummary.benchmarkPaceTruth
      ? {
          benchmark:
            draft.normalizedInputSummary.benchmarkPaceTruth.source === "recent_5k_time"
              ? {
                  kind: "recent_5k_time",
                  recent5kTime: formatDurationSeconds(
                    draft.normalizedInputSummary.benchmarkPaceTruth.paceSecondsPerKm * 5,
                  ),
                }
              : {
                  kind: "recent_5k_pace",
                  recent5kPace: `${formatDurationSeconds(
                    draft.normalizedInputSummary.benchmarkPaceTruth.paceSecondsPerKm,
                  )}/km`,
                },
        }
      : {}),
  } satisfies RunningPlanPreviewActionInput;
}

function buildConfirmInputFromDraft(
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
): RunningPlanConfirmActionInput {
  return {
    previewInput: buildPreviewInputForConfirm(draft),
    planFamily: draft.planFamily,
    sourceKind: draft.sourceKind as RunningPlanConfirmActionInput["sourceKind"],
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  };
}

function buildPreviewInputForConfirm(
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
): RunningPlanPreviewActionInput {
  if (isAiGeneratedRunningPlanPreviewDraft(draft)) {
    return draft.previewInput;
  }

  return buildInputFromDraft(draft);
}

function localAiGeneratedFixtureEnv() {
  return {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "scripts/fixtures/local-auth-users.json",
  };
}

function formatDurationSeconds(seconds: number) {
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainder = roundedSeconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function resolveRunnerLevelForConfirmQualityGates(
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  if (draft.planFamily !== "10K") {
    return draft.normalizedInputSummary.runnerLevel;
  }

  return resolveTenKBeginnerDosePolicyRunnerLevel({
    runnerLevel: draft.normalizedInputSummary.runnerLevel,
    benchmarkPaceTruth: draft.normalizedInputSummary.benchmarkPaceTruth,
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
