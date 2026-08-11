import assert from "node:assert/strict";
import { buildReviewedFirstPlanImportedSeed } from "../src/lib/active-plan-persistence";
import {
  AI_GENERATED_RUNNING_PLAN_SOURCE_KIND,
  isAiGeneratedRunningPlanPreviewDraft,
} from "../src/lib/ai-generated-running-plan";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import {
  confirmRunningPlanDraftForUser,
  runningPlanConfirmInputSchema,
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
import { base64UrlDecodeUtf8 } from "../src/lib/review-token-signing";
import {
  buildEffectiveRunnerHeartRateProfile,
  buildHeartRateZonesSummary,
  normalizeAcceptedHeartRateProfileForStorage,
  personalHeartRateProfileInputSchema,
} from "../src/lib/heart-rate-zones";
import {
  buildRunnerSettingsPersistenceError,
  HEART_RATE_GUIDANCE_SAVE_ERROR,
  RUNNER_SETTINGS_LOAD_ERROR,
  RUNNER_SETTINGS_SAVE_ERROR,
  RUNNER_SETTINGS_STALE_ERROR,
  runnerBaselineSaveInputSchema,
  saveRunnerBaselineForUserId,
} from "../src/lib/user-settings-actions";
import {
  assertSelectedDistanceEndpointProof,
  tamperReviewToken,
  validateAiAuthoredPrimaryExecutionGuidance,
  validateCanonicalRowsAreNumeric,
} from "./running-plan-engine-confirm/assertions";
import {
  readCliOptions as readPersistenceCliOptions,
  resolvePersistencePreflight,
  validatePersistenceContract,
} from "./running-plan-engine-confirm/persistence-proof";
import {
  buildSkippedDisposablePersistenceResult,
  formatDisposablePersistenceBlocker,
} from "./lib/qa-pool-persistence-proof";
import { validateRunnerFacingTargetReadbackContract } from "./running-plan-engine-target-readback-contract";
import { buildReviewedAiFixtureResult } from "./lib/generated-plan-proof-fixture";

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
  validateRunnerBaselineBounds();
  validatePersonalHeartRateGuidanceBandContract();
  await validateRunnerSettingsPersistenceErrorBoundary();

  const reviewedDrafts = [];
  for (const scenario of scenarios) {
    reviewedDrafts.push(await validateAiGeneratedDistanceGoalScenario(scenario));
  }
  const nonTenKDraft = reviewedDrafts.find(
    (draft) => draft.endpointProof.endpointDistanceMeters === 21_100,
  );
  assert.notEqual(
    nonTenKDraft,
    undefined,
    "Confirm validator must include a non-10K draft for endpoint mutation proof.",
  );
  if (!nonTenKDraft) {
    throw new Error("Missing non-10K draft for endpoint mutation proof.");
  }
  await validateFailureBoundaries(reviewedDrafts[0], nonTenKDraft);
  const persistencePreflight = resolvePersistencePreflight(persistenceOptions);

  if (!persistencePreflight.shouldRun && persistenceOptions.requirePersistence) {
    throw new Error(
      formatDisposablePersistenceBlocker(
        "Running-plan confirm persistence proof",
        persistencePreflight,
      ),
    );
  }

  const persistenceAvailabilityDrafts = persistencePreflight.shouldRun
    ? await buildAvailabilityPersistenceDrafts()
    : [];
  const persistenceProof = persistencePreflight.shouldRun
    ? await validatePersistenceContract(
        [...reviewedDrafts, ...persistenceAvailabilityDrafts],
        persistencePreflight,
        buildConfirmInputFromDraft,
      )
    : buildSkippedDisposablePersistenceResult(persistencePreflight);

  console.log("Running plan engine confirm contract checks passed.", {
    scenarios: reviewedDrafts.map((draft) => ({
      sourceKind: draft.sourceKind,
      rows: draft.canonicalRowCount,
      nonRestRows: draft.canonicalNonRestRowCount,
      endpointMeters: draft.endpointProof.endpointDistanceMeters,
    })),
    persistence: persistenceProof,
    availabilityPersistence:
      "persistedDistanceGoals" in persistenceProof
        ? persistenceProof.persistedDistanceGoals.slice(-4).map((proof) => ({
            fixedRestDays: proof.availability.fixedRestDays,
            maxRunningDaysPerWeek: proof.availability.maxRunningDaysPerWeek,
            rows: proof.rows,
            cleanupZero:
              Object.values(proof.cleanup.ownedRows).every((value) => value === 0) &&
              proof.cleanup.authUserPreserved &&
              proof.cleanup.leaseReleased,
          }))
        : [],
  });
}

async function buildAvailabilityPersistenceDrafts() {
  const availabilityStates = [
    {
      name: "Availability both",
      input: {
        ...baseInput,
        daysPerWeek: 6 as const,
        fixedRestDays: ["Tuesday", "Saturday"],
        preferredLongRunDay: null,
      },
    },
    {
      name: "Availability ceiling only",
      input: { ...baseInput, fixedRestDays: null, preferredLongRunDay: null },
    },
    {
      name: "Availability fixed rest only",
      input: { ...baseInput, daysPerWeek: null, preferredLongRunDay: null },
    },
    {
      name: "Availability flexible",
      input: {
        ...baseInput,
        daysPerWeek: null,
        fixedRestDays: null,
        preferredLongRunDay: null,
      },
    },
  ] as const;

  return Promise.all(
    availabilityStates.map((state) =>
      validateAiGeneratedDistanceGoalScenario({
        name: state.name,
        input: {
          ...state.input,
          planGoalIntent: { distance: { kind: "preset", preset: "10K" } },
        },
        expectedEndpointMeters: 10_000,
      }),
    ),
  );
}

function validateRunnerBaselineBounds() {
  const middleBaseline = {
    age: 36,
    weightKg: 74,
    heightCm: 178,
    fitnessLevel: "running_regularly" as const,
  };

  for (const validBaseline of [
    middleBaseline,
    { ...middleBaseline, age: 13, weightKg: 30, heightCm: 120 },
    { ...middleBaseline, age: 100, weightKg: 250, heightCm: 230 },
  ]) {
    assert.equal(
      runnerBaselineSaveInputSchema.safeParse(validBaseline).success,
      true,
      `Runner baseline bounds must accept ${JSON.stringify(validBaseline)}.`,
    );
  }

  for (const invalidBaseline of [
    { ...middleBaseline, age: 12 },
    { ...middleBaseline, age: 101 },
    { ...middleBaseline, age: 36.5 },
    { ...middleBaseline, weightKg: 29.5 },
    { ...middleBaseline, weightKg: 250.5 },
    { ...middleBaseline, heightCm: 119 },
    { ...middleBaseline, heightCm: 231 },
    { ...middleBaseline, heightCm: 178.5 },
  ]) {
    assert.equal(
      runnerBaselineSaveInputSchema.safeParse(invalidBaseline).success,
      false,
      `Runner baseline bounds must reject ${JSON.stringify(invalidBaseline)}.`,
    );
  }
}

function validatePersonalHeartRateGuidanceBandContract() {
  const overlapZones = [
    { reference: "Z1", minBpm: 95, maxBpm: 120 },
    { reference: "Z2", minBpm: 116, maxBpm: 135 },
    { reference: "Z3", minBpm: 130, maxBpm: 150 },
    { reference: "Z4", minBpm: 145, maxBpm: 165 },
    { reference: "Z5", minBpm: 160, maxBpm: 185 },
  ] as const;
  const gappedZones = [
    { reference: "Z1", minBpm: 90, maxBpm: 110 },
    { reference: "Z2", minBpm: 115, maxBpm: 130 },
    { reference: "Z3", minBpm: 135, maxBpm: 145 },
    { reference: "Z4", minBpm: 150, maxBpm: 160 },
    { reference: "Z5", minBpm: 165, maxBpm: 180 },
  ] as const;
  const coincidentZones = [
    { reference: "Z1", minBpm: 100, maxBpm: 120 },
    { reference: "Z2", minBpm: 100, maxBpm: 120 },
    { reference: "Z3", minBpm: 100, maxBpm: 120 },
    { reference: "Z4", minBpm: 100, maxBpm: 120 },
    { reference: "Z5", minBpm: 100, maxBpm: 120 },
  ] as const;
  const boundaryZones = [
    { reference: "Z1", minBpm: 60, maxBpm: 60 },
    { reference: "Z2", minBpm: 60, maxBpm: 100 },
    { reference: "Z3", minBpm: 100, maxBpm: 150 },
    { reference: "Z4", minBpm: 150, maxBpm: 200 },
    { reference: "Z5", minBpm: 200, maxBpm: 200 },
  ] as const;

  for (const [label, zones] of [
    ["overlapping", overlapZones],
    ["gapped", gappedZones],
    ["coincident", coincidentZones],
    ["60-200 boundaries", boundaryZones],
  ] as const) {
    assert.equal(
      personalHeartRateProfileInputSchema.safeParse({ zones }).success,
      true,
      `${label} ordered guidance bands must be valid input.`,
    );
    assert.equal(
      normalizeAcceptedHeartRateProfileForStorage({ age: 36, value: { zones } }).source,
      "personal",
      `${label} changed guidance must persist as personal truth.`,
    );
  }

  const estimated = buildHeartRateZonesSummary(36);
  assert.equal(estimated.source, "estimated");
  const acceptedEstimate = normalizeAcceptedHeartRateProfileForStorage({
    age: 36,
    value: {
      zones: estimated.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
    },
  });
  assert.deepEqual(acceptedEstimate, {
    version: "runner_hr_profile_v2",
    source: "estimated",
  });

  const invalidCases = [
    {
      label: "reversed range",
      zones: overlapZones.map((zone, index) =>
        index === 0 ? { ...zone, minBpm: 121, maxBpm: 120 } : zone,
      ),
      message: /minimum must not exceed/i,
    },
    {
      label: "incomplete set",
      zones: overlapZones.slice(0, 4),
      message: /all five guidance bands/i,
    },
    {
      label: "below product envelope",
      zones: overlapZones.map((zone, index) => (index === 0 ? { ...zone, minBpm: 59 } : zone)),
      message: /at least 60 BPM/i,
    },
    {
      label: "above product envelope",
      zones: overlapZones.map((zone, index) => (index === 4 ? { ...zone, maxBpm: 201 } : zone)),
      message: /at most 200 BPM/i,
    },
    {
      label: "decreasing lower bounds",
      zones: overlapZones.map((zone, index) => (index === 2 ? { ...zone, minBpm: 115 } : zone)),
      message: /lower bounds must be non-decreasing/i,
    },
    {
      label: "decreasing upper bounds",
      zones: overlapZones.map((zone, index) => (index === 2 ? { ...zone, maxBpm: 130 } : zone)),
      message: /upper bounds must be non-decreasing/i,
    },
  ] as const;

  for (const invalidCase of invalidCases) {
    const result = personalHeartRateProfileInputSchema.safeParse({ zones: invalidCase.zones });
    assert.equal(result.success, false, `${invalidCase.label} must be rejected.`);
    if (!result.success) {
      assert.match(
        result.error.issues.map((issue) => issue.message).join(" | "),
        invalidCase.message,
        `${invalidCase.label} must return actionable validation.`,
      );
    }
  }

  const historicalProfile = {
    version: "runner_hr_profile_v2",
    source: "personal",
    zones: [
      { reference: "Z1", minBpm: 40, maxBpm: 75 },
      { reference: "Z2", minBpm: 75, maxBpm: 110 },
      { reference: "Z3", minBpm: 110, maxBpm: 145 },
      { reference: "Z4", minBpm: 145, maxBpm: 175 },
      { reference: "Z5", minBpm: 175, maxBpm: 220 },
    ],
  } as const;
  assert.equal(
    personalHeartRateProfileInputSchema.safeParse({ zones: historicalProfile.zones }).success,
    false,
    "Historical out-of-envelope values must not be accepted as new personal input.",
  );
  const historicalEffective = buildEffectiveRunnerHeartRateProfile({
    age: 36,
    storedProfile: historicalProfile,
  });
  assert.equal(historicalEffective?.source, "personal");
  assert.deepEqual(
    historicalEffective?.zones.map(({ reference, minBpm, maxBpm }) => ({
      reference,
      minBpm,
      maxBpm,
    })),
    historicalProfile.zones,
    "Historical personal guidance must remain readable without clamp or rewrite.",
  );
}

async function validateRunnerSettingsPersistenceErrorBoundary() {
  const rawDatabaseMessage =
    'new row for relation "runner_profiles" violates check constraint "runner_profiles_heart_rate_profile_object_check"';
  const cases = [
    {
      error: { code: "23514", message: rawDatabaseMessage },
      operation: "write" as const,
      expected: RUNNER_SETTINGS_SAVE_ERROR,
    },
    {
      error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" },
      operation: "write" as const,
      expected: RUNNER_SETTINGS_STALE_ERROR,
    },
    {
      error: { code: "42501", message: "permission denied for table runner_profiles" },
      operation: "write" as const,
      expected: RUNNER_SETTINGS_SAVE_ERROR,
    },
    {
      error: { code: "42P01", message: 'relation "runner_profiles" does not exist' },
      operation: "read" as const,
      expected: RUNNER_SETTINGS_LOAD_ERROR,
    },
  ];

  for (const testCase of cases) {
    const result = buildRunnerSettingsPersistenceError(testCase.error, testCase.operation);
    assert.equal(result.message, testCase.expected);
    assert.doesNotMatch(result.message, /runner_profiles|constraint|relation|PostgREST|PGRST|SQL/i);
  }

  await assert.rejects(
    () =>
      saveRunnerBaselineForUserId("validation-stops-before-database", {
        age: 36,
        weightKg: 74,
        heightCm: 178,
        fitnessLevel: "running_regularly",
        heartRateProfile: {
          zones: [
            { reference: "Z1", minBpm: 59, maxBpm: 110 },
            { reference: "Z2", minBpm: 115, maxBpm: 130 },
            { reference: "Z3", minBpm: 135, maxBpm: 145 },
            { reference: "Z4", minBpm: 150, maxBpm: 160 },
            { reference: "Z5", minBpm: 165, maxBpm: 180 },
          ],
        },
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === HEART_RATE_GUIDANCE_SAVE_ERROR &&
      !/runner_profiles|constraint|relation|PostgREST|PGRST|SQL/i.test(error.message),
  );
}

async function validateAiGeneratedDistanceGoalScenario(scenario: {
  name: string;
  input: RunningPlanPreviewActionInput;
  expectedEndpointMeters: number;
}) {
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
  validateAiAuthoredPrimaryExecutionGuidance(canonicalPlan.planned_workouts);
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
  const result = await buildReviewedAiFixtureResult(input);
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

  for (const changedAvailabilityDraft of [
    await buildReviewedAiFixture({
      ...reviewedDraft.previewInput,
      daysPerWeek: null,
    }),
    await buildReviewedAiFixture({
      ...reviewedDraft.previewInput,
      fixedRestDays: null,
    }),
  ]) {
    const changedAvailabilityExactness = await validateRunningPlanReviewExactness({
      draft: changedAvailabilityDraft,
      reviewToken: reviewedDraft.reviewToken,
      reviewChecksum: reviewedDraft.reviewChecksum,
    });
    assert.equal(changedAvailabilityExactness.ok, false);
    if (!changedAvailabilityExactness.ok) {
      assert.equal(changedAvailabilityExactness.reason, "stale_review");
    }
  }

  const transientCommentCanary = `private-plan-context-${crypto.randomUUID()}`;
  const commentedDraft = await buildReviewedAiFixture({
    ...reviewedDraft.previewInput,
    runnerComment: transientCommentCanary,
  });
  assert.equal("runnerComment" in commentedDraft.previewInput, false);
  assert.equal("runnerComment" in commentedDraft.normalizedInputSummary, false);
  assert.equal(commentedDraft.reviewChecksum, reviewedDraft.reviewChecksum);
  assert.equal(JSON.stringify(commentedDraft).includes(transientCommentCanary), false);
  const encodedCommentedEnvelope = commentedDraft.reviewToken.split(".")[1];
  assert.ok(encodedCommentedEnvelope);
  const decodedCommentedEnvelope = base64UrlDecodeUtf8(encodedCommentedEnvelope!);
  assert.equal(decodedCommentedEnvelope.includes(transientCommentCanary), false);
  assert.doesNotMatch(
    decodedCommentedEnvelope,
    /"runnerComment"|"requestContext"|"plan_request_comment"/,
  );
  const commentedExactness = await validateRunningPlanReviewExactness({
    draft: commentedDraft,
    reviewToken: commentedDraft.reviewToken,
    reviewChecksum: commentedDraft.reviewChecksum,
  });
  assert.equal(commentedExactness.ok, true);
  const legacyCommentBearingDraft = {
    ...commentedDraft,
    previewInput: {
      ...commentedDraft.previewInput,
      runnerComment: transientCommentCanary,
    },
  } as unknown as RunningPlanPreviewDraft;
  const legacyCommentBearingReview = await addRunningPlanReviewProof(legacyCommentBearingDraft);
  const legacyCommentBearingExactness = await validateRunningPlanReviewExactness({
    draft: legacyCommentBearingDraft,
    reviewToken: legacyCommentBearingReview.reviewToken,
    reviewChecksum: legacyCommentBearingReview.reviewChecksum,
  });
  assert.equal(legacyCommentBearingExactness.ok, false);
  if (!legacyCommentBearingExactness.ok) {
    assert.equal(legacyCommentBearingExactness.reason, "invalid_review");
  }
  assert.equal(
    runningPlanConfirmInputSchema.safeParse({
      previewInput: {
        ...commentedDraft.previewInput,
        runnerComment: transientCommentCanary,
      },
      sourceKind: commentedDraft.sourceKind,
      reviewToken: commentedDraft.reviewToken,
      reviewChecksum: commentedDraft.reviewChecksum,
    }).success,
    false,
  );

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
            segments: workout.segments.map((segment) =>
              segment.segment_type === "fueling"
                ? segment
                : {
                    ...segment,
                    prescription: {
                      mode: "time" as const,
                      duration_min:
                        Math.round((75 / Math.max(1, workout.segments.length)) * 10) / 10,
                    },
                  },
            ),
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
