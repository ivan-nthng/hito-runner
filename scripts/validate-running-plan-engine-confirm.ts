import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  confirmActivePlanTransitionForUser,
  reviewActivePlanTransitionForUser,
  type ActivePlanTransitionDependencies,
} from "../src/lib/active-plan-transition-actions";
import { buildActivePlanReplacementCarryForward } from "../src/lib/active-plan-replacement-carry-forward";
import type { ExistingPlanContext } from "../src/lib/active-plan-persistence";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "../src/lib/manual-workout-authoring/schema";
import {
  buildReviewedRunningPlanPreview,
  confirmRunningPlanDraftForUser,
  type RunningPlanConfirmActionInput,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
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
import type { Database, Json } from "../src/lib/supabase/database";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import {
  benchmarkPaceUsefulWorkoutKinds,
  validateRunnerFacingTargetReadbackContract,
} from "./running-plan-engine-target-readback-contract";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type DisposableCleanupProof = {
  workoutLogsRemaining: 0;
  planCyclesRemaining: 0;
  plannedWorkoutsRemaining: 0;
  runnerProfilesRemaining: 0;
  authUserDeleted: true;
};
type DisposableCleanupProofCountKey = Exclude<keyof DisposableCleanupProof, "authUserDeleted">;
type DisposableTableName = "workout_logs" | "planned_workouts" | "plan_cycles" | "runner_profiles";
type DisposableTableRow<TableName extends DisposableTableName> =
  Database["public"]["Tables"][TableName]["Row"];
type DisposableCleanupSpec<TableName extends DisposableTableName = DisposableTableName> = {
  table: TableName;
  userColumn: Extract<keyof DisposableTableRow<TableName>, string>;
  countColumn: Extract<keyof DisposableTableRow<TableName>, string>;
  proofKey: DisposableCleanupProofCountKey;
};

const REQUIRE_PERSISTENCE_FLAG = "--require-persistence";
const REMOTE_MUTATION_FLAG = "--allow-remote-disposable-supabase-mutation";
const REMOTE_MUTATION_ENV = "HITO_RUNNING_PLAN_CONFIRM_ALLOW_REMOTE_MUTATION";
const REMOTE_MUTATION_ENV_VALUE = "I_UNDERSTAND_THIS_MUTATES_REMOTE_DISPOSABLE_SUPABASE";
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const DISPOSABLE_CLEANUP_SPECS = [
  {
    table: "workout_logs",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "workoutLogsRemaining",
  },
  {
    table: "planned_workouts",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "plannedWorkoutsRemaining",
  },
  {
    table: "plan_cycles",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "planCyclesRemaining",
  },
  {
    table: "runner_profiles",
    userColumn: "user_id",
    countColumn: "user_id",
    proofKey: "runnerProfilesRemaining",
  },
] as const satisfies readonly [
  DisposableCleanupSpec<"workout_logs">,
  DisposableCleanupSpec<"planned_workouts">,
  DisposableCleanupSpec<"plan_cycles">,
  DisposableCleanupSpec<"runner_profiles">,
];

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

  const persistenceResults = persistencePreflight.shouldRun
    ? await validatePersistenceContract(reviewedDrafts, persistencePreflight)
    : buildSkippedPersistenceResult(persistencePreflight);

  console.log("Running plan engine confirm contract checks passed.", {
    stableReviewDrafts: reviewedDrafts.map((draft) => ({
      sourceKind: draft.sourceKind,
      planFamily: draft.planFamily,
      rows: draft.canonicalRowCount,
      nonRestRows: draft.canonicalNonRestRowCount,
      reviewContractVersion: draft.reviewContractVersion,
    })),
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

async function validateBenchmarkBackedPaceTruthContract() {
  const targetTimeOnlyResult = await buildReviewedRunningPlanPreview({
    ...buildFixtureInput(supportedFixtures[0]),
    targetTime: "45:00",
  } as unknown as RunningPlanPreviewActionInput);
  assert.equal(
    targetTimeOnlyResult.ok,
    true,
    "Diagnostic target-time-only selected-plan fixture should still build without pace.",
  );
  if (!targetTimeOnlyResult.ok) {
    throw new Error(targetTimeOnlyResult.unavailable.error.message);
  }
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

async function validatePersistenceContract(
  reviewedDrafts: readonly RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>[],
  preflight: Extract<PersistencePreflight, { shouldRun: true }>,
) {
  const supabase = createAdminSupabaseClient();
  const persistedFamilies: Array<{
    family: RunningPlanDistanceFamily;
    rows: number;
    sourceKind: string;
    cleanup: DisposableCleanupProof;
  }> = [];

  for (const draft of reviewedDrafts) {
    const userId = await createDisposableUser(supabase, draft.planFamily);
    let familyProof: Omit<(typeof persistedFamilies)[number], "cleanup"> | null = null;
    let cleanupProof: DisposableCleanupProof | null = null;

    try {
      const result = await confirmRunningPlanDraftForUser(userId, {
        previewInput: buildInputFromDraft(draft),
        planFamily: draft.planFamily,
        sourceKind: draft.sourceKind,
        reviewToken: draft.reviewToken,
        reviewChecksum: draft.reviewChecksum,
      });
      assert.equal(result.ok, true, `${draft.planFamily} confirm should persist.`);
      if (!result.ok) throw new Error(result.message);

      const persisted = await loadPersistedPlanForUser(supabase, userId);
      assert.equal(persisted.plan.source_kind, draft.sourceKind);
      assert.equal(persisted.workouts.length, draft.canonicalRowCount);
      assert.equal(
        persisted.workouts.filter((workout) => workout.workout_type !== "rest").length,
        draft.canonicalNonRestRowCount,
      );
      assert.equal(
        (persisted.plan.goal_metadata as { selected_plan_engine?: { source_status?: string } })
          .selected_plan_engine?.source_status,
        "confirmed_selected_plan",
      );
      assert.equal(
        (persisted.plan.goal_metadata as { selected_plan_engine?: { review_checksum?: string } })
          .selected_plan_engine?.review_checksum,
        draft.reviewChecksum,
      );
      validateNoFakePaceOrPersonalHr(persisted.workouts);
      validateNoClientRowsTrusted(persisted.workouts);

      const duplicate = await confirmRunningPlanDraftForUser(userId, {
        previewInput: buildInputFromDraft(draft),
        planFamily: draft.planFamily,
        sourceKind: draft.sourceKind,
        reviewToken: draft.reviewToken,
        reviewChecksum: draft.reviewChecksum,
      });
      assert.equal(duplicate.ok, false);
      if (!duplicate.ok) {
        assert.equal(duplicate.reason, "active_plan_exists");
      }

      familyProof = {
        family: draft.planFamily,
        rows: persisted.workouts.length,
        sourceKind: draft.sourceKind,
      };
    } finally {
      cleanupProof = await cleanupDisposableUser(supabase, userId);
    }

    if (familyProof && cleanupProof) {
      persistedFamilies.push({
        ...familyProof,
        cleanup: cleanupProof,
      });
    }
  }

  return {
    mode: preflight.mode,
    target: preflight.target,
    persistedFamilies,
  };
}

function readCliOptions() {
  const args = new Set(process.argv.slice(2));

  return {
    requirePersistence: args.has(REQUIRE_PERSISTENCE_FLAG),
    allowRemoteDisposableSupabaseMutation:
      args.has(REMOTE_MUTATION_FLAG) &&
      process.env[REMOTE_MUTATION_ENV] === REMOTE_MUTATION_ENV_VALUE,
  };
}

type PersistenceTarget = {
  url: string;
  hostname: string;
  projectRef: string | null;
  isLoopback: boolean;
};

type PersistencePreflight =
  | {
      mode: "no_supabase_env";
      shouldRun: false;
      target: null;
      reason: string;
      overrideHint: string;
    }
  | {
      mode: "remote_supabase_blocked";
      shouldRun: false;
      target: PersistenceTarget;
      reason: string;
      overrideHint: string;
    }
  | {
      mode: "local_disposable_supabase";
      shouldRun: true;
      target: PersistenceTarget;
    }
  | {
      mode: "remote_disposable_supabase_override";
      shouldRun: true;
      target: PersistenceTarget;
    };

function resolvePersistencePreflight(
  options: ReturnType<typeof readCliOptions>,
): PersistencePreflight {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !publishableKey || !serviceKey) {
    return {
      mode: "no_supabase_env",
      shouldRun: false,
      target: null,
      reason:
        "Supabase persistence env is incomplete; non-mutating review exactness checks ran only.",
      overrideHint:
        "Start local Supabase and export NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY, then rerun with --require-persistence.",
    };
  }

  const target = parsePersistenceTarget(url);
  if (!target) {
    return {
      mode: "no_supabase_env",
      shouldRun: false,
      target: null,
      reason: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL; persistence proof was not attempted.",
      overrideHint:
        "Use a valid local Supabase URL such as http://127.0.0.1:54321 and rerun with --require-persistence.",
    };
  }

  if (target.isLoopback) {
    return {
      mode: "local_disposable_supabase",
      shouldRun: true,
      target,
    };
  }

  if (options.allowRemoteDisposableSupabaseMutation) {
    return {
      mode: "remote_disposable_supabase_override",
      shouldRun: true,
      target,
    };
  }

  return {
    mode: "remote_supabase_blocked",
    shouldRun: false,
    target,
    reason:
      "Remote Supabase mutation is blocked by default. This harness only mutates local/disposable targets unless an explicit remote-disposable override is supplied.",
    overrideHint: `Use a local Supabase URL, or set ${REMOTE_MUTATION_ENV}=${REMOTE_MUTATION_ENV_VALUE} and pass ${REMOTE_MUTATION_FLAG} only for an approved disposable remote validation target.`,
  };
}

function parsePersistenceTarget(url: string): PersistenceTarget | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const projectRef = hostname.endsWith(".supabase.co")
      ? hostname.split(".supabase.co")[0] || null
      : null;

    return {
      url: parsed.origin,
      hostname,
      projectRef,
      isLoopback: LOOPBACK_HOSTNAMES.has(hostname),
    };
  } catch {
    return null;
  }
}

function formatPersistenceBlocker(preflight: Extract<PersistencePreflight, { shouldRun: false }>) {
  return [
    `Running-plan confirm persistence proof is blocked: ${preflight.reason}`,
    preflight.target
      ? `Target: ${preflight.target.url} (${preflight.target.projectRef ?? preflight.target.hostname}).`
      : "Target: none.",
    preflight.overrideHint,
  ].join(" ");
}

function buildSkippedPersistenceResult(
  preflight: Extract<PersistencePreflight, { shouldRun: false }>,
) {
  return {
    mode: preflight.mode,
    target: preflight.target,
    reason: preflight.reason,
    overrideHint: preflight.overrideHint,
  };
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
    previewInput: buildInputFromDraft(draft),
    planFamily: draft.planFamily,
    sourceKind: draft.sourceKind as RunningPlanConfirmActionInput["sourceKind"],
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  };
}

function buildManualActivePlanContext(
  overrides: {
    plan?: Partial<PersistedPlanCycleRow>;
    workouts?: PersistedWorkoutRow[];
  } = {},
): ExistingPlanContext {
  const plan: PersistedPlanCycleRow = {
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-07T10:00:00Z",
    end_date: "2026-07-01",
    goal_metadata: {
      source_status: "manual_user_built_plan_created",
    },
    goal_summary: "Manual user-built plan",
    id: "manual-plan-1",
    plan_preferences: null,
    schema_version: "training-plan-v2",
    source_kind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    source_template: "manual_user_built_plan_v1",
    start_date: "2026-06-01",
    status: "active",
    target_date: null,
    title: "Manual Plan",
    user_id: "transition-dry-run-user",
    ...overrides.plan,
  };
  const workouts = overrides.workouts ?? [
    buildManualPersistedWorkout({
      id: "manual-workout-past",
      date: "2026-06-03",
      title: "Logged manual workout",
      workoutType: "easy",
      displayOrder: 0,
    }),
    buildManualPersistedWorkout({
      id: "manual-workout-future-1",
      date: "2026-06-09",
      title: "Future manual workout",
      workoutType: "quality",
      displayOrder: 1,
    }),
    buildManualPersistedWorkout({
      id: "manual-workout-future-2",
      date: "2026-06-12",
      title: "Future manual long run",
      workoutType: "long_run",
      displayOrder: 2,
    }),
  ];

  return {
    activePlan: plan,
    existingWorkouts: {
      workouts,
      logsByWorkoutId: new Map([
        [
          "manual-workout-past",
          {
            actual_distance_km: 6,
            actual_duration_min: 42,
            body_notes: null,
            id: "manual-log-1",
            intervals_completed: null,
            logged_at: "2026-06-03T12:00:00Z",
            notes: "Completed before transition.",
            outcome: "completed",
            planned_workout_id: "manual-workout-past",
            rpe: 4,
            updated_at: "2026-06-03T12:00:00Z",
            user_id: "transition-dry-run-user",
          },
        ],
      ]),
    },
  };
}

function buildManualPersistedWorkout(input: {
  id: string;
  date: string;
  title: string;
  workoutType: PersistedWorkoutRow["workout_type"];
  displayOrder: number;
}): PersistedWorkoutRow {
  return {
    calendar_icon_key: "run",
    created_at: "2026-06-01T10:00:00Z",
    display_order: input.displayOrder,
    estimated_fatigue: null,
    goal_context: {
      manual_user_built_plan: true,
    },
    id: input.id,
    metric_mode: {
      executable_mode: "structure_only_executable",
      pace_targets_allowed: false,
      hr_targets_allowed: false,
    },
    notes: null,
    phase: "Manual",
    plan_cycle_id: "manual-plan-1",
    planned_rpe: null,
    recovery_priority: null,
    source_workout_id: input.id,
    source_workout_type: "manual_workout",
    steps: [],
    title: input.title,
    user_id: "transition-dry-run-user",
    week_number: 1,
    weekday: "Tuesday",
    workout_date: input.date,
    workout_family: "easy_run",
    workout_identity: input.id,
    workout_type: input.workoutType,
  };
}

function buildPersistedWorkoutFromSeed(
  workout: ReturnType<typeof buildImportedPlanSeed>["workouts"][number],
  index: number,
  planCycleId: string,
  userId: string,
): PersistedWorkoutRow {
  return {
    calendar_icon_key: workout.calendarIconKey,
    created_at: "2026-06-08T10:00:00Z",
    display_order: index,
    estimated_fatigue: workout.estimatedFatigue,
    goal_context: workout.goalContext,
    id: `selected-workout-${index + 1}`,
    metric_mode: workout.metricMode,
    notes: workout.notes,
    phase: workout.phase,
    plan_cycle_id: planCycleId,
    planned_rpe: workout.plannedRpe,
    recovery_priority: workout.recoveryPriority,
    source_workout_id: workout.sourceWorkoutId,
    source_workout_type: workout.sourceWorkoutType,
    steps: workout.steps,
    title: workout.title,
    user_id: userId,
    week_number: workout.weekNumber,
    weekday: workout.weekday,
    workout_date: workout.workoutDate,
    workout_family: workout.workoutFamily,
    workout_identity: workout.workoutIdentity,
    workout_type: workout.workoutType,
  };
}

function formatDurationSeconds(seconds: number) {
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainder = roundedSeconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function validateCanonicalRowsAreNumeric(
  rows: readonly ReturnType<typeof buildRunningPlanCanonicalPlan>["planned_workouts"][number][],
  options: { expectedMode: "structure_only" | "mixed" } = { expectedMode: "structure_only" },
) {
  for (const row of rows) {
    if (row.workout_type === "rest") continue;

    assert.ok(row.segments.length > 0, `${row.workout_id} must have segments.`);
    assert.ok(row.metric_mode, `${row.workout_id} must have metric mode.`);
    if (options.expectedMode === "structure_only" || !rowHasPaceTargets(row)) {
      assert.equal(row.metric_mode?.executable_mode, "structure_only_executable");
      assert.equal(row.metric_mode?.pace_targets_allowed, false);
    }
    assert.equal(row.metric_mode?.hr_targets_allowed, false);

    for (const segment of row.segments) {
      assert.ok(segment.prescription, `${row.workout_id}.${segment.segment_type} lacks structure.`);
      assert.notEqual(
        segment.prescription?.mode,
        "none",
        `${row.workout_id}.${segment.segment_type} must not be vague/none.`,
      );
    }
  }
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

function validateNoFakePaceOrPersonalHr(rows: readonly unknown[]) {
  const serialized = JSON.stringify(rows);

  assert.doesNotMatch(serialized, /"pace_min_per_km_range"|"pace_range_min_km"|"pace"/i);
  assert.doesNotMatch(serialized, /race_pace_session/i);
  validateNoPersonalHrTargets(rows);
}

function tamperReviewToken(token: string) {
  const replacement = token.endsWith("0") ? "1" : "0";

  return `${token.slice(0, -1)}${replacement}`;
}

function validateNoPersonalHrTargets(rows: readonly unknown[]) {
  const serialized = JSON.stringify(rows);

  assert.doesNotMatch(
    serialized,
    /personal_hr|personalized_hr|hr_zone_truth|"hr_targets_allowed":true/i,
  );
}

function rowHasPaceTargets(
  row: ReturnType<typeof buildRunningPlanCanonicalPlan>["planned_workouts"][number],
) {
  return JSON.stringify(row.segments).includes("pace_min_per_km_range");
}

function validateNoClientRowsTrusted(rows: readonly PersistedWorkoutRow[]) {
  for (const row of rows) {
    assert.notEqual(row.title, "client tampered row");
  }
}

async function createDisposableUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  family: RunningPlanDistanceFamily,
) {
  const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const email = `running-plan-confirm-${slug}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}@example.test`;
  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Disposable user creation failed.");
  }

  return created.data.user.id;
}

async function loadPersistedPlanForUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const planResult = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (planResult.error || !planResult.data) {
    throw new Error(planResult.error?.message ?? "Persisted active plan was not found.");
  }

  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_cycle_id", planResult.data.id)
    .order("display_order", { ascending: true });

  if (workoutsResult.error || !workoutsResult.data) {
    throw new Error(workoutsResult.error?.message ?? "Persisted workouts were not found.");
  }

  return {
    plan: planResult.data,
    workouts: workoutsResult.data,
  };
}

async function cleanupDisposableUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<DisposableCleanupProof> {
  for (const spec of DISPOSABLE_CLEANUP_SPECS) {
    await deleteRows(supabase.from(spec.table).delete().eq(spec.userColumn, userId));
  }

  const deleted = await supabase.auth.admin.deleteUser(userId);
  if (deleted.error) {
    throw new Error(deleted.error.message);
  }

  const remainingCounts = new Map<DisposableCleanupProofCountKey, number>(
    await Promise.all(
      DISPOSABLE_CLEANUP_SPECS.map(async (spec) => [
        spec.proofKey,
        await countRowsForUser(supabase, spec, userId),
      ]),
    ),
  );

  return {
    workoutLogsRemaining: assertZeroCleanupCount(
      remainingCounts,
      "workoutLogsRemaining",
      "Disposable workout logs must be cleaned up.",
    ),
    planCyclesRemaining: assertZeroCleanupCount(
      remainingCounts,
      "planCyclesRemaining",
      "Disposable plan cycles must be cleaned up.",
    ),
    plannedWorkoutsRemaining: assertZeroCleanupCount(
      remainingCounts,
      "plannedWorkoutsRemaining",
      "Disposable planned workouts must be cleaned up.",
    ),
    runnerProfilesRemaining: assertZeroCleanupCount(
      remainingCounts,
      "runnerProfilesRemaining",
      "Disposable runner profile must be cleaned up.",
    ),
    authUserDeleted: true,
  };
}

async function countRowsForUser<TableName extends DisposableTableName>(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  spec: DisposableCleanupSpec<TableName>,
  userId: string,
) {
  const result = await supabase
    .from(spec.table)
    .select(spec.countColumn, { count: "exact", head: true })
    .eq(spec.userColumn, userId);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

function assertZeroCleanupCount(
  counts: ReadonlyMap<DisposableCleanupProofCountKey, number>,
  proofKey: DisposableCleanupProofCountKey,
  message: string,
): 0 {
  const count = counts.get(proofKey) ?? 0;

  assert.equal(count, 0, message);

  return 0;
}

async function deleteRows(
  query: PromiseLike<{
    error: { message: string } | null;
  }>,
) {
  const result = await query;

  if (result.error) {
    throw new Error(result.error.message);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
