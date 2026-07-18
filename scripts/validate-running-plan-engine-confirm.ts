import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  confirmActivePlanTransitionForUser,
  reviewActivePlanTransitionForUser,
  type ActivePlanTransitionDependencies,
} from "../src/lib/active-plan-transition-actions";
import { buildActivePlanReplacementCarryForward } from "../src/lib/active-plan-replacement-carry-forward";
import { buildReviewedFirstPlanImportedSeed } from "../src/lib/active-plan-persistence";
import { buildAiGeneratedRunningPlanDevFixturePreviewOptions } from "../src/lib/ai-generated-running-plan-dev-fixture";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  buildAiGeneratedRunningPlanAuthoringInput,
  isAiGeneratedRunningPlanPreviewDraft,
} from "../src/lib/ai-generated-running-plan";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import {
  buildReviewedAiGeneratedRunningPlanPreview,
  confirmRunningPlanDraftForUser,
  type RunningPlanConfirmActionInput,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  addRunningPlanReviewProof,
  buildRunningPlanCanonicalPlan,
  validateRunningPlanReviewExactness,
  type RunningPlanPreviewDraft,
  type RunningPlanReviewedPreviewDraft,
} from "../src/lib/running-plan-engine-review";
import { startOfWeekIso } from "../src/lib/training";
import {
  assertSelectedDistanceEndpointProof,
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
  readCliOptions as readPersistenceCliOptions,
  resolvePersistencePreflight,
  validatePersistenceContract,
} from "./running-plan-engine-confirm/persistence-proof";
import { validateRunnerFacingTargetReadbackContract } from "./running-plan-engine-target-readback-contract";

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
    name: "10K distance goal",
    input: {
      ...baseInput,
      planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
    },
    expectedEndpointMeters: 10_000,
  },
  {
    name: "Browser-serialized Beginner 10K distance goal",
    input: {
      ...baseInput,
      age: 34,
      heightCm: 178,
      weightKg: 72,
      runnerLevel: "sometimes_runs",
      daysPerWeek: 5,
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
  },
  {
    name: "21.1K distance goal",
    input: {
      ...baseInput,
      planGoalIntent: { distance: { kind: "preset", preset: "Half Marathon" } },
    },
    expectedEndpointMeters: 21_100,
  },
  {
    name: "42.195K distance goal",
    input: {
      ...baseInput,
      planGoalIntent: {
        distance: { kind: "preset", preset: "Marathon" },
        targetDate: "2026-11-01",
        targetFinishTime: "4:30:00",
      },
    },
    expectedEndpointMeters: 42_195,
  },
  {
    name: "Custom 15K distance goal",
    input: {
      ...baseInput,
      planGoalIntent: {
        distance: { kind: "custom", distanceKm: 15, label: "City 15K" },
        targetDate: "2026-09-13",
        targetFinishTime: "1:25:00",
      },
    },
    expectedEndpointMeters: 15_000,
  },
] as const satisfies readonly Array<{
  name: string;
  input: RunningPlanPreviewActionInput;
  expectedEndpointMeters: number;
}>;

async function main() {
  const persistenceOptions = readPersistenceCliOptions();
  assertRemovedDeterministicPreviewEntrypoints();

  const reviewedDrafts = [];
  for (const scenario of scenarios) {
    reviewedDrafts.push(await validateAiGeneratedDistanceGoalScenario(scenario));
  }

  const longRunRichnessDraft = reviewedDrafts.find(
    (draft) => draft.endpointProof.endpointDistanceMeters === 21_100,
  );
  const marathonDraft = reviewedDrafts.find(
    (draft) => draft.endpointProof.endpointDistanceMeters === 42_195,
  );
  assert.notEqual(
    longRunRichnessDraft,
    undefined,
    "Confirm validator must include a non-10K draft for runner-facing richness mutation proof.",
  );
  if (!longRunRichnessDraft) {
    throw new Error("Missing non-10K draft for runner-facing richness mutation proof.");
  }
  assert.notEqual(
    marathonDraft,
    undefined,
    "Confirm validator must include a marathon draft for race-week load mutation proof.",
  );
  if (!marathonDraft) {
    throw new Error("Missing marathon draft for race-week load mutation proof.");
  }

  await validateFailureBoundaries(reviewedDrafts[0], longRunRichnessDraft, marathonDraft);
  const activeManualTransitionProof = await validateActiveManualPlanTransitionContract(
    reviewedDrafts[0],
  );
  const persistencePreflight = resolvePersistencePreflight(persistenceOptions);

  if (!persistencePreflight.shouldRun && persistenceOptions.requirePersistence) {
    throw new Error(formatPersistenceBlocker(persistencePreflight));
  }

  const persistenceProof = persistencePreflight.shouldRun
    ? await validatePersistenceContract(
        reviewedDrafts,
        persistencePreflight,
        buildConfirmInputFromDraft,
      )
    : buildSkippedPersistenceResult(persistencePreflight);

  console.log("Running plan engine confirm contract checks passed.", {
    scenarios: reviewedDrafts.map((draft) => ({
      sourceKind: draft.sourceKind,
      rows: draft.canonicalRowCount,
      nonRestRows: draft.canonicalNonRestRowCount,
      endpointMeters: draft.endpointProof.endpointDistanceMeters,
    })),
    activeManualTransition: activeManualTransitionProof,
    deterministicPreviewBuilders: "removed",
    persistence: persistenceProof,
  });
}

async function validateAiGeneratedDistanceGoalScenario(scenario: (typeof scenarios)[number]) {
  const draft = await buildReviewedAiFixture(scenario.input);
  const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
  const importedSeed = buildImportedPlanSeed(canonicalPlan);

  assert.equal(draft.sourceKind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(draft.source_kind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.reviewSafety.confirmCallsOpenAi, false);
  assert.equal(draft.endpointProof.endpointDistanceMeters, scenario.expectedEndpointMeters);
  assertSelectedDistanceEndpointProof({
    scenarioName: scenario.name,
    canonicalPlan,
    draft,
    expectedEndpointMeters: scenario.expectedEndpointMeters,
  });
  assert.equal(canonicalPlan.source_kind, AI_GENERATED_RUNNING_PLAN_SOURCE_KIND);
  assert.equal(importedSeed.workouts.length, canonicalPlan.planned_workouts.length);
  assert.doesNotMatch(JSON.stringify(canonicalPlan), /repeat_unit|recovery_unit/);
  assert.doesNotThrow(() => buildReviewedFirstPlanImportedSeed(canonicalPlan));
  validateNoFakePaceOrPersonalHr(canonicalPlan.planned_workouts);
  validateNoPersonalHrTargets(canonicalPlan.planned_workouts);
  validateCanonicalRowsAreNumeric(canonicalPlan.planned_workouts, { expectedMode: "mixed" });
  validateRunnerFacingTargetReadbackContract(canonicalPlan, scenario.name);

  const exactness = await validateRunningPlanReviewExactness({
    draft,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  });
  assert.equal(exactness.ok, true, `${scenario.name} fresh review token must validate.`);

  return draft;
}

async function buildReviewedAiFixture(input: RunningPlanPreviewActionInput) {
  const authoring = buildAiGeneratedRunningPlanAuthoringInput(input);
  assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
  if (!authoring.ok) {
    throw new Error(authoring.message);
  }

  const fixturePreviewOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
    authoringInput: authoring.authoringInput,
    today: input.startDate ?? authoring.authoringInput.schedule.startDate,
    env: localAiGeneratedFixtureEnv(),
  });
  assert.notEqual(fixturePreviewOptions, null, "AI confirm proof must use the local fixture.");

  const result = await buildReviewedAiGeneratedRunningPlanPreview(input, {
    aiPreview: fixturePreviewOptions ?? undefined,
  });
  assert.equal(result.ok, true, result.ok ? "" : result.unavailable.error.message);
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }
  assert.equal(isAiGeneratedRunningPlanPreviewDraft(result.draft), true);

  return result.draft;
}

async function validateFailureBoundaries(
  reviewedDraft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
  longRunRichnessDraft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
  marathonDraft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  const changedStartDraft = await buildReviewedAiFixture({
    ...reviewedDraft.previewInput,
    startDate: "2026-06-15",
  });
  const changedStartExactness = await validateRunningPlanReviewExactness({
    draft: changedStartDraft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(changedStartExactness.ok, false);
  if (!changedStartExactness.ok) {
    assert.equal(changedStartExactness.reason, "stale_review");
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

  const staleChecksumExactness = await validateRunningPlanReviewExactness({
    draft: reviewedDraft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: tamperReviewToken(reviewedDraft.reviewChecksum),
  });
  assert.equal(staleChecksumExactness.ok, false);
  if (!staleChecksumExactness.ok) {
    assert.equal(staleChecksumExactness.reason, "stale_review");
  }

  await validateFlatLongRunProgressionReviewDoesNotInvalidatePlanFirst(longRunRichnessDraft);
  await validateMarathonRaceWeekLoadReviewIsRejected(marathonDraft);

  const legacySourceKindPayload = await confirmRunningPlanDraftForUser("dry-run-user", {
    previewInput: reviewedDraft.previewInput,
    sourceKind: "unsupported_legacy_source_kind",
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(legacySourceKindPayload.ok, false);
  if (!legacySourceKindPayload.ok) {
    assert.equal(legacySourceKindPayload.reason, "invalid_review");
  }

  const clientRowsPayload = await confirmRunningPlanDraftForUser("dry-run-user", {
    previewInput: reviewedDraft.previewInput,
    sourceKind: reviewedDraft.sourceKind,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
    calendarRows: reviewedDraft.calendarRows,
  });
  assert.equal(clientRowsPayload.ok, false);
  if (!clientRowsPayload.ok) {
    assert.equal(clientRowsPayload.reason, "invalid_review");
  }
}

async function validateMarathonRaceWeekLoadReviewIsRejected(
  reviewedDraft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  const canonicalPlan = buildRunningPlanCanonicalPlan(reviewedDraft);
  const endpoint = canonicalPlan.planned_workouts.find(
    (workout) => workout.source_workout_type === "final_selected_distance_day",
  );
  assert.notEqual(endpoint, undefined, "Marathon exactness proof must include endpoint row.");
  if (!endpoint) {
    throw new Error("Missing marathon endpoint row.");
  }

  const raceWeekStart = startOfWeekIso(endpoint.date);
  const raceWeekRows = canonicalPlan.planned_workouts
    .filter(
      (workout) =>
        workout !== endpoint && workout.date >= raceWeekStart && workout.date < endpoint.date,
    )
    .slice(0, 3);
  assert.ok(
    raceWeekRows.length >= 3,
    "Marathon race-week load exactness proof needs enough pre-endpoint calendar rows to overload.",
  );

  const overloadedPlan = {
    ...canonicalPlan,
    planned_workouts: canonicalPlan.planned_workouts.map((workout) =>
      raceWeekRows.includes(workout)
        ? {
            ...workout,
            workout_type: "easy" as const,
            source_workout_type: "steady_aerobic_run",
            title: "Injected race-week overload run",
            summary: "Validation-only overload row for confirm hard-safety proof.",
            segments: [
              {
                segment_id: `${workout.workout_id}-race-week-overload`,
                segment_type: "main" as const,
                label: "Race-week overload",
                sequence: 1,
                prescription: {
                  mode: "time" as const,
                  duration_min: 22,
                },
              },
            ],
          }
        : workout,
    ),
  };
  const overloadedDraft = await addRunningPlanReviewProof({
    ...stripReviewProof(reviewedDraft),
    canonicalPlan: overloadedPlan,
  });
  const exactness = await validateRunningPlanReviewExactness({
    draft: overloadedDraft,
    reviewToken: overloadedDraft.reviewToken,
    reviewChecksum: overloadedDraft.reviewChecksum,
  });

  assert.equal(
    exactness.ok,
    false,
    "A signed generated-plan review with overloaded marathon race week must not validate.",
  );
  if (!exactness.ok) {
    assert.equal(exactness.reason, "invalid_review");
    assert.match(exactness.message, /marathon_race_week_load|runner-facing richness/i);
  }
}

async function validateFlatLongRunProgressionReviewDoesNotInvalidatePlanFirst(
  reviewedDraft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  const canonicalPlan = buildRunningPlanCanonicalPlan(reviewedDraft);
  const flatLongRunPlan = {
    ...canonicalPlan,
    planned_workouts: canonicalPlan.planned_workouts.map((workout) =>
      isPreEndpointBuildLongRun(workout)
        ? {
            ...workout,
            segments: workout.segments.map((segment) => ({
              ...segment,
              prescription: {
                mode: "time" as const,
                duration_min: Math.round((75 / Math.max(1, workout.segments.length)) * 10) / 10,
              },
            })),
          }
        : workout,
    ),
  };
  const flatDraft = await addRunningPlanReviewProof({
    ...stripReviewProof(reviewedDraft),
    canonicalPlan: flatLongRunPlan,
  });
  const exactness = await validateRunningPlanReviewExactness({
    draft: flatDraft,
    reviewToken: flatDraft.reviewToken,
    reviewChecksum: flatDraft.reviewChecksum,
  });

  assert.equal(
    exactness.ok,
    true,
    "A signed plan-first review with flat pre-endpoint long-run progression should remain review-exact; plan-first treats this as coaching caveat rather than persistence hard-stop.",
  );
}

function isPreEndpointBuildLongRun(
  workout: ReturnType<typeof buildRunningPlanCanonicalPlan>["planned_workouts"][number],
) {
  return (
    workout.workout_type === "long_run" &&
    workout.source_workout_type !== "final_selected_distance_day" &&
    workout.source_workout_type !== "taper_long_run"
  );
}

function stripReviewProof(
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
): RunningPlanPreviewDraft {
  const {
    canonicalNonRestRowCount: _canonicalNonRestRowCount,
    canonicalRowCount: _canonicalRowCount,
    reviewChecksum: _reviewChecksum,
    reviewContractVersion: _reviewContractVersion,
    reviewToken: _reviewToken,
    ...unreviewedDraft
  } = draft;

  return unreviewedDraft;
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
  assert.equal(review.safety.serverRebuiltCandidate, false);
  assert.equal(review.metricHonesty.fakePaceAllowed, false);
  assert.equal(review.metricHonesty.fakePersonalHrAllowed, false);

  const endpointInvalidPlan = buildRunningPlanCanonicalPlan(reviewedDraft);
  const endpointInvalidDraft = await addRunningPlanReviewProof({
    ...stripReviewProof(reviewedDraft),
    canonicalPlan: {
      ...endpointInvalidPlan,
      planned_workouts: endpointInvalidPlan.planned_workouts.map((workout) =>
        workout.source_workout_type === "final_selected_distance_day"
          ? {
              ...workout,
              segments: workout.segments.map((segment) => ({
                ...segment,
                prescription: {
                  mode: "time" as const,
                  duration_min: 5,
                },
              })),
            }
          : workout,
      ),
    },
  });
  const endpointInvalidTransitionReview = await reviewActivePlanTransitionForUser(
    userId,
    {
      ...reviewInput,
      candidate: buildConfirmInputFromDraft(endpointInvalidDraft),
    },
    dependencies,
  );
  assert.equal(
    endpointInvalidTransitionReview.ok,
    false,
    "Transition must apply the same endpoint exactness gate as first-plan confirm.",
  );
  if (!endpointInvalidTransitionReview.ok) {
    assert.equal(endpointInvalidTransitionReview.reason, "invalid_review");
  }
  assert.equal(persistCalls, 0, "Endpoint-invalid transition candidate must not persist.");

  const invalidTokenConfirm = await confirmActivePlanTransitionForUser(
    userId,
    {
      reviewInput,
      transitionReviewToken: tamperReviewToken(review.transitionReviewToken),
      transitionReviewChecksum: review.transitionReviewChecksum,
    },
    dependencies,
  );
  assert.equal(invalidTokenConfirm.ok, false);
  if (!invalidTokenConfirm.ok) {
    assert.equal(invalidTokenConfirm.reason, "invalid_review");
  }
  assert.equal(persistCalls, 0, "Invalid transition token must not persist.");

  const staleChecksumConfirm = await confirmActivePlanTransitionForUser(
    userId,
    {
      reviewInput,
      transitionReviewToken: review.transitionReviewToken,
      transitionReviewChecksum: tamperReviewToken(review.transitionReviewChecksum),
    },
    dependencies,
  );
  assert.equal(staleChecksumConfirm.ok, false);
  if (!staleChecksumConfirm.ok) {
    assert.equal(staleChecksumConfirm.reason, "stale_review");
  }
  assert.equal(persistCalls, 0, "Stale transition checksum must not persist.");

  context = buildManualActivePlanContext({
    plan: { updated_at: "2026-06-07T10:01:00Z" },
  });
  const staleActivePlanConfirm = await confirmActivePlanTransitionForUser(
    userId,
    {
      reviewInput,
      transitionReviewToken: review.transitionReviewToken,
      transitionReviewChecksum: review.transitionReviewChecksum,
    },
    dependencies,
  );
  assert.equal(staleActivePlanConfirm.ok, false);
  if (!staleActivePlanConfirm.ok) {
    assert.equal(staleActivePlanConfirm.reason, "stale_review");
  }
  assert.equal(persistCalls, 0, "Changed active-plan revision must not persist.");

  context = buildManualActivePlanContext();
  const confirm = await confirmActivePlanTransitionForUser(
    userId,
    {
      reviewInput,
      transitionReviewToken: review.transitionReviewToken,
      transitionReviewChecksum: review.transitionReviewChecksum,
    },
    dependencies,
  );
  assert.equal(confirm.ok, true, "Active manual transition confirm must persist through deps.");
  if (!confirm.ok) throw new Error(confirm.message);
  assert.equal(confirm.safety.serverRebuiltCandidate, false);
  assert.equal(confirm.safety.upcomingManualWorkoutsMerged, false);
  assert.equal(persistCalls, 1);
  assert.ok(persistedRows.length > 0);

  const carriedPastManual = persistedRows.find(
    (workout) => workout.source_workout_id === "manual-workout-past",
  );
  assert.equal(carriedPastManual?.source_workout_type, "manual_workout");
  assert.doesNotMatch(
    JSON.stringify(persistedRows),
    /pace_min_per_km_range|pace_range_min_km|pace_seconds_per_km/i,
    "No generated fixture should introduce fake executable pace targets.",
  );

  return {
    reviewed: true,
    confirmed: true,
    oldPlanArchived: confirm.safety.oldPlanArchived,
    serverRebuiltCandidate: false,
    carriedRows: persistedRows.length,
  };
}

function buildConfirmInputFromDraft(
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
): RunningPlanConfirmActionInput {
  return {
    previewInput: draft.previewInput,
    sourceKind: draft.sourceKind,
    reviewToken: draft.reviewToken,
    reviewChecksum: draft.reviewChecksum,
  };
}

function assertRemovedDeterministicPreviewEntrypoints() {
  const actions = readFileSync("src/lib/running-plan-engine-actions.ts", "utf8");
  const review = readFileSync("src/lib/running-plan-engine-review.ts", "utf8");
  const barrel = readFileSync("src/lib/plan-creation-engine/index.ts", "utf8");

  assert.doesNotMatch(actions, /buildReviewedRunningPlanPreview|buildRunningPlanPreview/);
  assert.doesNotMatch(actions, /builder_v1/);
  assert.doesNotMatch(review, /legacy_family_bucket|runningPlanSourceKindForFamily/);
  assert.doesNotMatch(review, /function buildCanonicalWorkout/);
  assert.doesNotMatch(barrel, /build.*PlanPreviewDraft/);
}

function localAiGeneratedFixtureEnv() {
  return {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "scripts/fixtures/local-auth-users.json",
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
