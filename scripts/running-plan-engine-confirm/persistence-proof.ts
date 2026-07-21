import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

import {
  buildReviewedAiGeneratedRunningPlanPreviewForUser,
  confirmRunningPlanDraftForUser,
  type RunningPlanConfirmActionInput,
} from "../../src/lib/running-plan-engine-actions";
import type {
  RunningPlanPreviewDraft,
  RunningPlanReviewedPreviewDraft,
} from "../../src/lib/running-plan-engine-review";
import { buildRunningPlanCanonicalPlan } from "../../src/lib/running-plan-engine-review";
import {
  ActivePlanPersistenceRejection,
  applyAtomicReviewedPlanPersistence,
} from "../../src/lib/active-plan-lifecycle-persistence";
import { buildAiGeneratedRunningPlanDevFixturePreviewOptions } from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { buildAiGeneratedRunningPlanAuthoringInput } from "../../src/lib/ai-generated-running-plan";
import { buildAiAuthoredPlanFirstProviderContext } from "../../src/lib/ai-authored-plan-first-provider-contract";
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
  renderPlanExportMarkdown,
} from "../../src/lib/plan-export";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import type { Database, Json } from "../../src/lib/supabase/database";
import {
  buildFirstTimeRunnerBaselineReadback,
  getRunnerPlanAuthoringProfileSnapshotForUserId,
  getUserSettingsForUserId,
  updateUserSettingsForUserId,
} from "../../src/lib/user-settings-actions";
import {
  validateAiAuthoredPrimaryExecutionGuidance,
  validateNoClientRowsTrusted,
} from "./assertions";
import { validateRunnerFacingTargetReadbackContract } from "../running-plan-engine-target-readback-contract";
import {
  cleanupDisposableSupabaseUser,
  createDisposableSupabaseUser,
  DISPOSABLE_REQUIRE_PERSISTENCE_FLAG,
  readDisposablePersistenceCliOptions,
  resolveDisposablePersistencePreflight,
  type DisposablePersistencePreflight,
  type DisposableSupabaseCleanupProof,
  type DisposableSupabaseCleanupSpec,
} from "../lib/disposable-persistence-proof";

type DisposableCleanupProofCountKey =
  | "workoutLogsRemaining"
  | "planCyclesRemaining"
  | "plannedWorkoutsRemaining"
  | "runnerProfilesRemaining";
type DisposableCleanupProof = DisposableSupabaseCleanupProof<DisposableCleanupProofCountKey>;
type BuildConfirmInputForConfirm = (
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) => RunningPlanConfirmActionInput;

const REQUIRE_PERSISTENCE_FLAG = DISPOSABLE_REQUIRE_PERSISTENCE_FLAG;
const DISPOSABLE_TEST_PASSWORD = "Hito-local-proof-2026!";
const PERSONAL_HEART_RATE_ZONES = [
  { reference: "Z1", minBpm: 95, maxBpm: 115 },
  { reference: "Z2", minBpm: 116, maxBpm: 135 },
  { reference: "Z3", minBpm: 136, maxBpm: 150 },
  { reference: "Z4", minBpm: 151, maxBpm: 165 },
  { reference: "Z5", minBpm: 166, maxBpm: 185 },
] as const;
const UPDATED_PERSONAL_HEART_RATE_ZONES = [
  { reference: "Z1", minBpm: 90, maxBpm: 110 },
  { reference: "Z2", minBpm: 111, maxBpm: 130 },
  { reference: "Z3", minBpm: 131, maxBpm: 145 },
  { reference: "Z4", minBpm: 146, maxBpm: 160 },
  { reference: "Z5", minBpm: 161, maxBpm: 180 },
] as const;
const DISPOSABLE_CLEANUP_SPECS = [
  {
    table: "workout_logs",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "workoutLogsRemaining",
    zeroMessage: "Disposable workout logs must be cleaned up.",
  },
  {
    table: "planned_workouts",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "plannedWorkoutsRemaining",
    zeroMessage: "Disposable planned workouts must be cleaned up.",
  },
  {
    table: "plan_cycles",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "planCyclesRemaining",
    zeroMessage: "Disposable plan cycles must be cleaned up.",
  },
  {
    table: "runner_profiles",
    userColumn: "user_id",
    countColumn: "user_id",
    proofKey: "runnerProfilesRemaining",
    zeroMessage: "Disposable runner profile must be cleaned up.",
  },
] as const satisfies readonly DisposableSupabaseCleanupSpec<DisposableCleanupProofCountKey>[];

export type PersistencePreflight = DisposablePersistencePreflight;

export function readCliOptions() {
  return readDisposablePersistenceCliOptions();
}

export function resolvePersistencePreflight(
  options: ReturnType<typeof readCliOptions>,
): PersistencePreflight {
  return resolveDisposablePersistencePreflight({
    options,
    includeNotRequested: true,
    notRequestedReason:
      "Running-plan confirm persistence proof was not requested; non-mutating review exactness checks ran only.",
    notRequestedOverrideHint: `Pass ${REQUIRE_PERSISTENCE_FLAG} with local disposable Supabase env to run persistence proof.`,
    envIncompleteReason:
      "Supabase persistence env is incomplete; non-mutating review exactness checks ran only.",
    envIncompleteOverrideHint:
      "Start local Supabase and export NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY, then rerun with --require-persistence.",
    invalidUrlReason:
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL; persistence proof was not attempted.",
    invalidUrlOverrideHint:
      "Use a valid local Supabase URL such as http://127.0.0.1:54321 and rerun with --require-persistence.",
    nonLoopbackBlockedReason:
      "Running-plan persistence proof only supports loopback Supabase; remote mutation is not available.",
    nonLoopbackOverrideHint:
      "Start local Supabase and run npm run supabase:local:configure before retrying.",
  });
}

export function formatPersistenceBlocker(
  preflight: Extract<PersistencePreflight, { shouldRun: false }>,
) {
  return [
    `Running-plan confirm persistence proof is blocked: ${preflight.reason}`,
    preflight.target
      ? `Target: ${preflight.target.url} (${preflight.target.hostname}).`
      : "Target: none.",
    preflight.overrideHint,
  ].join(" ");
}

export function buildSkippedPersistenceResult(
  preflight: Extract<PersistencePreflight, { shouldRun: false }>,
) {
  return {
    mode: preflight.mode,
    target: preflight.target,
    reason: preflight.reason,
    overrideHint: preflight.overrideHint,
  };
}

export async function validatePersistenceContract(
  reviewedDrafts: readonly RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>[],
  preflight: Extract<PersistencePreflight, { shouldRun: true }>,
  buildConfirmInputForConfirm: BuildConfirmInputForConfirm,
) {
  const supabase = createAdminSupabaseClient();
  const persistedDistanceGoals: Array<{
    goalLabel: string;
    distanceMeters: number | null;
    rows: number;
    sourceKind: string;
    cleanup: DisposableCleanupProof;
  }> = [];

  for (const draft of reviewedDrafts) {
    const distanceGoal = distanceGoalSummary(draft);
    const disposableUser = await createDisposableSupabaseUser({
      supabase,
      emailPrefix: "running-plan-confirm",
      label: distanceGoal.goalLabel,
      creationErrorMessage: "Disposable user creation failed.",
    });
    const userId = disposableUser.userId;
    let distanceGoalProof: Omit<(typeof persistedDistanceGoals)[number], "cleanup"> | null = null;
    let cleanupProof: DisposableCleanupProof | null = null;

    try {
      await persistReviewedDraftProfileSnapshot(userId, draft);
      const result = await confirmRunningPlanDraftForUser(
        userId,
        buildConfirmInputForConfirm(draft),
        { allowLocalQaFixture: true },
      );
      assert.equal(
        result.ok,
        true,
        `${distanceGoal.goalLabel} confirm should persist: ${JSON.stringify(result)}`,
      );
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
      validateAiAuthoredPrimaryExecutionGuidance(persisted.workouts);
      validateNoClientRowsTrusted(persisted.workouts);

      const duplicate = await confirmRunningPlanDraftForUser(
        userId,
        buildConfirmInputForConfirm(draft),
        { allowLocalQaFixture: true },
      );
      assert.equal(duplicate.ok, false);
      if (!duplicate.ok) {
        assert.equal(duplicate.reason, "active_plan_exists");
      }

      distanceGoalProof = {
        goalLabel: distanceGoal.goalLabel,
        distanceMeters: distanceGoal.distanceMeters,
        rows: persisted.workouts.length,
        sourceKind: draft.sourceKind,
      };
    } finally {
      cleanupProof = await cleanupDisposableUser(supabase, userId);
    }

    if (distanceGoalProof && cleanupProof) {
      persistedDistanceGoals.push({
        ...distanceGoalProof,
        cleanup: cleanupProof,
      });
    }
  }
  const creationFailureAtomic = await validateReviewedPlanCreationFailureAtomicity(supabase);
  const personalHeartRateProfile = await validatePersonalHeartRateProfilePersistence({
    supabase,
    preflight,
    previewInput: reviewedDrafts[0]!.previewInput,
    buildConfirmInputForConfirm,
  });

  return {
    mode: preflight.mode,
    target: preflight.target,
    persistedDistanceGoals,
    creationFailureAtomic,
    personalHeartRateProfile,
  };
}

async function persistReviewedDraftProfileSnapshot(
  userId: string,
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  const snapshot = draft.normalizedInputSummary.runnerProfileSnapshot;

  await updateUserSettingsForUserId(userId, {
    firstName: null,
    lastName: null,
    displayName: null,
    age: snapshot.age,
    weightKg: snapshot.weightKg,
    heightCm: snapshot.heightCm,
    fitnessLevel: snapshot.fitnessLevel,
    heartRateProfile: {
      zones: snapshot.heartRateProfile.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
    },
  });
}

async function validatePersonalHeartRateProfilePersistence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  preflight: Extract<PersistencePreflight, { shouldRun: true }>;
  previewInput: RunningPlanPreviewDraft["previewInput"];
  buildConfirmInputForConfirm: BuildConfirmInputForConfirm;
}) {
  const owner = await createDisposableSupabaseUser({
    supabase: input.supabase,
    emailPrefix: "personal-hr-owner",
    validationKind: "personal_hr_profile",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Disposable personal-HR owner creation failed.",
  });
  const otherRunner = await createDisposableSupabaseUser({
    supabase: input.supabase,
    emailPrefix: "personal-hr-other",
    validationKind: "personal_hr_profile_rls",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Disposable personal-HR RLS runner creation failed.",
  });

  try {
    const firstTimeReadback = buildFirstTimeRunnerBaselineReadback({
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    assert.equal(firstTimeReadback.heartRateZones.source, "estimated");
    assert.equal(firstTimeReadback.heartRateZones.accepted, false);

    const acceptedEstimated = await updateUserSettingsForUserId(
      owner.userId,
      {
        firstName: "Local",
        lastName: "Runner",
        displayName: "Local Runner",
        age: input.previewInput.age,
        weightKg: input.previewInput.weightKg,
        heightCm: input.previewInput.heightCm,
        fitnessLevel: "running_regularly",
        heartRateProfile: {
          zones: firstTimeReadback.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
            reference,
            minBpm,
            maxBpm,
          })),
        },
      },
      owner.email,
    );
    await updateUserSettingsForUserId(otherRunner.userId, {
      firstName: null,
      lastName: null,
      displayName: null,
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
      heartRateProfile: { zones: [...PERSONAL_HEART_RATE_ZONES] },
    });

    const baselineRows = await loadBaselineOnlyCounts(input.supabase, owner.userId);
    assert.deepEqual(baselineRows, { profiles: 1, plans: 0, workouts: 0 });

    const unavailablePreview = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      owner.userId,
      input.previewInput,
      {
        aiPreview: {
          apiKey: "local-provider-unavailable-proof",
          generationLedger: { disabled: true },
          fetchImpl: async () =>
            new Response(JSON.stringify({ error: { type: "provider_unavailable" } }), {
              status: 503,
              headers: { "content-type": "application/json" },
            }),
        },
      },
    );
    assert.equal(unavailablePreview.ok, false);
    assert.deepEqual(await loadBaselineOnlyCounts(input.supabase, owner.userId), baselineRows);

    const defaultSettings = await getUserSettingsForUserId(owner.userId, owner.email);
    assert.equal(defaultSettings?.heartRateZones.source, "estimated");
    assert.equal(defaultSettings?.heartRateZones.accepted, true);
    assert.equal(defaultSettings?.fitnessLevel, "running_regularly");
    assert.equal(defaultSettings?.heartRateZones.zones.length, 5);
    assert.equal(defaultSettings?.heartRateZones.zones[3]?.reference, "Z4");
    assert.equal(acceptedEstimated.profileRevision, defaultSettings?.profileRevision);
    const estimatedRanges = defaultSettings!.heartRateZones.zones.map(
      ({ reference, minBpm, maxBpm }) => ({ reference, minBpm, maxBpm }),
    );

    const nonAgeUpdate = await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg + 1,
      heightCm: input.previewInput.heightCm + 1,
      fitnessLevel: "performance_focused",
    });
    assert.deepEqual(
      nonAgeUpdate.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      estimatedRanges,
      "Only age may change estimated BPM ranges.",
    );
    const changedAgeEstimate = await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age + 5,
      weightKg: input.previewInput.weightKg + 1,
      heightCm: input.previewInput.heightCm + 1,
      fitnessLevel: "performance_focused",
    });
    assert.equal(changedAgeEstimate.heartRateZones.source, "estimated");
    assert.notDeepEqual(
      changedAgeEstimate.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      estimatedRanges,
    );

    const persistedSettings = await updateUserSettingsForUserId(
      owner.userId,
      {
        firstName: "Local",
        lastName: "Runner",
        displayName: "Local Runner",
        age: input.previewInput.age,
        weightKg: input.previewInput.weightKg,
        heightCm: input.previewInput.heightCm,
        fitnessLevel: "running_regularly",
        heartRateProfile: { zones: [...PERSONAL_HEART_RATE_ZONES] },
      },
      owner.email,
    );
    assert.equal(persistedSettings.heartRateZones.source, "personal");
    assert.deepEqual(
      persistedSettings.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      PERSONAL_HEART_RATE_ZONES,
    );
    const personalAfterAgeChange = await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age + 1,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    assert.equal(personalAfterAgeChange.heartRateZones.source, "personal");
    assert.deepEqual(
      personalAfterAgeChange.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      PERSONAL_HEART_RATE_ZONES,
      "Age changes must not overwrite saved personal BPM ranges.",
    );
    await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });

    const profileSnapshot = await getRunnerPlanAuthoringProfileSnapshotForUserId(owner.userId);
    assert.equal(profileSnapshot?.heartRateProfile.source, "personal");
    assert.deepEqual(
      profileSnapshot?.heartRateProfile.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
      PERSONAL_HEART_RATE_ZONES,
    );

    const watchCanaryInput = {
      ...input.previewInput,
      benchmark: { kind: "recent_5k_pace" as const, recent5kPace: "5:30/km" },
    };
    const authoring = buildAiGeneratedRunningPlanAuthoringInput(watchCanaryInput, profileSnapshot);
    assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
    if (!authoring.ok) {
      throw new Error(authoring.message);
    }

    const providerContext = buildAiAuthoredPlanFirstProviderContext(authoring.authoringInput);
    assert.equal(providerContext.runner.heart_rate_profile?.source, "personal");
    assert.deepEqual(
      providerContext.runner.heart_rate_profile?.zones.map(({ reference, min_bpm, max_bpm }) => ({
        reference,
        minBpm: min_bpm,
        maxBpm: max_bpm,
      })),
      PERSONAL_HEART_RATE_ZONES,
    );

    const fixtureOptions = buildAiGeneratedRunningPlanDevFixturePreviewOptions({
      authoringInput: authoring.authoringInput,
      qaFixtureAuthorized: true,
      today: watchCanaryInput.startDate,
      env: localFixtureEnv(input.preflight.target.url),
    });
    assert.notEqual(fixtureOptions, null);

    let reviewed = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      owner.userId,
      watchCanaryInput,
      { aiPreview: fixtureOptions ?? undefined },
    );
    assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
    if (!reviewed.ok) {
      throw new Error(reviewed.unavailable.error.message);
    }

    await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg + 0.5,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    const staleConfirmation = await confirmRunningPlanDraftForUser(
      owner.userId,
      input.buildConfirmInputForConfirm(reviewed.draft),
      { allowLocalQaFixture: true },
    );
    assert.equal(staleConfirmation.ok, false);
    if (!staleConfirmation.ok) {
      assert.equal(staleConfirmation.reason, "stale_review");
    }
    assert.deepEqual(await loadBaselineOnlyCounts(input.supabase, owner.userId), {
      profiles: 1,
      plans: 0,
      workouts: 0,
    });

    await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    reviewed = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      owner.userId,
      watchCanaryInput,
      { aiPreview: fixtureOptions ?? undefined },
    );
    assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
    if (!reviewed.ok) {
      throw new Error(reviewed.unavailable.error.message);
    }

    const canonicalPlan = buildRunningPlanCanonicalPlan(reviewed.draft);
    const reviewedTargets = collectTargetRecords(canonicalPlan.planned_workouts);
    assert.ok(
      reviewedTargets.some(
        (target) =>
          target.hr_bpm_range === "116-135 bpm" &&
          target.hr_target_source === "personal_hr_zone" &&
          target.extra?.hr_zone_reference === "Z2",
      ),
      "Reviewed plan must resolve authored aerobic Z2 to the saved personal BPM range.",
    );
    assert.ok(
      reviewedTargets.some(
        (target) =>
          typeof target.pace === "string" || typeof target.pace_min_per_km_range === "string",
      ),
      "Personal HR resolution must preserve AI-authored numeric pace.",
    );
    assert.match(
      JSON.stringify(reviewed.draft.workoutDocuments),
      /116-135 bpm/,
      "Reviewed read model must expose the resolved personal BPM guidance.",
    );
    validateRunnerFacingTargetReadbackContract(canonicalPlan, "Personal HR persisted profile");

    const confirmed = await confirmRunningPlanDraftForUser(
      owner.userId,
      input.buildConfirmInputForConfirm(reviewed.draft),
      { allowLocalQaFixture: true },
    );
    assert.equal(confirmed.ok, true, JSON.stringify(confirmed));

    const persistedBeforeSettingsChange = await loadPersistedPlanForUser(
      input.supabase,
      owner.userId,
    );
    const originalPersistedSteps = persistedBeforeSettingsChange.workouts.map(
      (workout) => workout.steps,
    );
    const exportPayload = buildActivePlanExportPayload({
      planCycle: persistedBeforeSettingsChange.plan,
      workouts: persistedBeforeSettingsChange.workouts,
      exportedAt: "2026-07-19T12:00:00.000Z",
    });
    const exportPlan = activePlanExportToTrainingPlanV2(exportPayload);
    const exportTargets = collectTargetRecords(exportPlan.planned_workouts);
    assert.ok(
      exportTargets.some(
        (target) =>
          target.hr_bpm_range === "116-135 bpm" &&
          target.hr_target_source === "personal_hr_zone" &&
          target.hr_zone_reference === "Z2",
      ),
      "Export must preserve reviewed BPM guidance and its profile-resolution provenance.",
    );
    assert.match(renderPlanExportMarkdown(exportPayload), /116-135 bpm/);
    assert.doesNotMatch(renderPlanExportMarkdown(exportPayload), /\bZ[1-5](?:-Z[1-5])?\b/);

    await updateUserSettingsForUserId(owner.userId, {
      firstName: "Local",
      lastName: "Runner",
      displayName: "Local Runner",
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
      heartRateProfile: { zones: [...UPDATED_PERSONAL_HEART_RATE_ZONES] },
    });
    const persistedAfterSettingsChange = await loadPersistedPlanForUser(
      input.supabase,
      owner.userId,
    );
    assert.deepEqual(
      persistedAfterSettingsChange.workouts.map((workout) => workout.steps),
      originalPersistedSteps,
      "Changing current personal HR settings must not rewrite confirmed historical plan targets.",
    );

    await validateRunnerProfileRls({
      preflight: input.preflight,
      owner,
      otherRunner,
      supabase: input.supabase,
    });

    return {
      defaultSource: defaultSettings?.heartRateZones.source,
      savedSource: persistedSettings.heartRateZones.source,
      providerContextSource: providerContext.runner.heart_rate_profile?.source,
      reviewedBpm: "116-135 bpm",
      historicalSnapshotPreserved: true,
      rlsIsolation: true,
    };
  } finally {
    await cleanupDisposableUser(input.supabase, owner.userId);
    await cleanupDisposableUser(input.supabase, otherRunner.userId);
  }
}

async function loadBaselineOnlyCounts(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const [profiles, plans, workouts] = await Promise.all([
    supabase
      .from("runner_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("plan_cycles").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  assert.equal(profiles.error, null);
  assert.equal(plans.error, null);
  assert.equal(workouts.error, null);

  return {
    profiles: profiles.count ?? 0,
    plans: plans.count ?? 0,
    workouts: workouts.count ?? 0,
  };
}

async function validateRunnerProfileRls(input: {
  preflight: Extract<PersistencePreflight, { shouldRun: true }>;
  owner: { userId: string; email: string };
  otherRunner: { userId: string; email: string };
  supabase: ReturnType<typeof createAdminSupabaseClient>;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.ok(publishableKey, "Local RLS proof requires a publishable key.");
  const ownerClient = createClient<Database>(input.preflight.target.url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signedIn = await ownerClient.auth.signInWithPassword({
    email: input.owner.email,
    password: DISPOSABLE_TEST_PASSWORD,
  });
  assert.equal(signedIn.error, null);

  const ownProfile = await ownerClient
    .from("runner_profiles")
    .select("user_id, heart_rate_profile")
    .eq("user_id", input.owner.userId)
    .single();
  assert.equal(ownProfile.error, null);
  assert.equal(ownProfile.data?.user_id, input.owner.userId);
  const persistedPersonalProfile = ownProfile.data?.heart_rate_profile;

  const malformedProfiles: Array<{ label: string; value: Json }> = [
    {
      label: "estimated profile carrying stored zones",
      value: {
        version: "runner_hr_profile_v2",
        source: "estimated",
        zones: [...UPDATED_PERSONAL_HEART_RATE_ZONES],
      },
    },
    {
      label: "unknown profile provenance",
      value: {
        version: "runner_hr_profile_v2",
        source: "imported",
      },
    },
    {
      label: "missing profile version",
      value: {
        source: "personal",
        zones: [...UPDATED_PERSONAL_HEART_RATE_ZONES],
      },
    },
    {
      label: "missing zone reference",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [{ minBpm: 90, maxBpm: 110 }, ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(1)],
      },
    },
    {
      label: "duplicate zone reference",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 90, maxBpm: 110 },
          { reference: "Z2", minBpm: 111, maxBpm: 130 },
          { reference: "Z3", minBpm: 131, maxBpm: 145 },
          { reference: "Z4", minBpm: 146, maxBpm: 160 },
          { reference: "Z4", minBpm: 161, maxBpm: 180 },
        ],
      },
    },
    {
      label: "reversed BPM range",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 110, maxBpm: 90 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(1),
        ],
      },
    },
    {
      label: "non-integer BPM value",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 90.5, maxBpm: 110 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(1),
        ],
      },
    },
    {
      label: "overlapping BPM ranges",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 90, maxBpm: 115 },
          { reference: "Z2", minBpm: 110, maxBpm: 130 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(2),
        ],
      },
    },
  ];

  for (const malformedProfile of malformedProfiles) {
    const rejectedUpdate = await ownerClient
      .from("runner_profiles")
      .update({ heart_rate_profile: malformedProfile.value })
      .eq("user_id", input.owner.userId);
    assert.equal(
      rejectedUpdate.error?.code,
      "23514",
      `Database must reject ${malformedProfile.label} before it becomes profile truth.`,
    );
  }

  const ownProfileAfterRejectedUpdates = await ownerClient
    .from("runner_profiles")
    .select("heart_rate_profile")
    .eq("user_id", input.owner.userId)
    .single();
  assert.equal(ownProfileAfterRejectedUpdates.error, null);
  assert.deepEqual(
    ownProfileAfterRejectedUpdates.data?.heart_rate_profile,
    persistedPersonalProfile,
  );

  const otherProfile = await ownerClient
    .from("runner_profiles")
    .select("user_id")
    .eq("user_id", input.otherRunner.userId);
  assert.equal(otherProfile.error, null);
  assert.deepEqual(otherProfile.data, []);

  const unauthorizedUpdate = await ownerClient
    .from("runner_profiles")
    .update({ heart_rate_profile: null })
    .eq("user_id", input.otherRunner.userId)
    .select("user_id");
  assert.equal(unauthorizedUpdate.error, null);
  assert.deepEqual(unauthorizedUpdate.data, []);

  const otherProfileAfter = await input.supabase
    .from("runner_profiles")
    .select("heart_rate_profile")
    .eq("user_id", input.otherRunner.userId)
    .single();
  assert.equal(otherProfileAfter.error, null);
  assert.deepEqual(otherProfileAfter.data?.heart_rate_profile, {
    version: "runner_hr_profile_v2",
    source: "personal",
    zones: [...PERSONAL_HEART_RATE_ZONES],
  });
}

type ProofTargetRecord = Record<string, unknown> & {
  hr_bpm_range?: string;
  hr_target_source?: string;
  pace?: string;
  pace_min_per_km_range?: string;
  hr_zone_reference?: string;
  extra?: {
    hr_zone_reference?: string;
  };
};

function collectTargetRecords(value: unknown): ProofTargetRecord[] {
  const targets: ProofTargetRecord[] = [];

  const visit = (candidate: unknown) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!candidate || typeof candidate !== "object") {
      return;
    }

    const record = candidate as Record<string, unknown>;
    if (
      typeof record.hr_bpm_range === "string" ||
      typeof record.pace === "string" ||
      typeof record.pace_min_per_km_range === "string"
    ) {
      targets.push(record as ProofTargetRecord);
    }
    Object.values(record).forEach(visit);
  };

  visit(value);
  return targets;
}

function localFixtureEnv(loopbackSupabaseUrl: string) {
  return {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "scripts/fixtures/local-auth-users.json",
    NEXT_PUBLIC_SUPABASE_URL: loopbackSupabaseUrl,
    HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
    HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "qa_fixture",
  };
}

async function validateReviewedPlanCreationFailureAtomicity(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
) {
  const disposableUser = await createDisposableSupabaseUser({
    supabase,
    emailPrefix: "running-plan-atomic-create",
    label: "forced-failure",
    creationErrorMessage: "Disposable atomic plan-creation user creation failed.",
  });
  const planId = crypto.randomUUID();
  const firstWorkoutId = crypto.randomUUID();

  try {
    const baseline = buildFirstTimeRunnerBaselineReadback({
      age: 36,
      weightKg: 74,
      heightCm: 178,
      fitnessLevel: "running_regularly",
    });
    const savedBaseline = await updateUserSettingsForUserId(disposableUser.userId, {
      firstName: null,
      lastName: null,
      displayName: null,
      age: baseline.age,
      weightKg: baseline.weightKg,
      heightCm: baseline.heightCm,
      fitnessLevel: baseline.fitnessLevel!,
      heartRateProfile: {
        zones: baseline.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
          reference,
          minBpm,
          maxBpm,
        })),
      },
    });
    const baselineBefore = await supabase
      .from("runner_profiles")
      .select("*")
      .eq("user_id", disposableUser.userId)
      .single();
    assert.equal(baselineBefore.error, null);

    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: {
          goal_type: "distance_build",
          goal_label: "Stale profile revision proof",
          baseline_sessions_per_week: 3,
          baseline_long_run_km: 6,
          baseline_notes: null,
        },
        plan: {
          id: planId,
          title: "Stale profile revision proof",
          goal_summary: "10K",
          source_template: "stale_profile_revision_proof",
          schema_version: "training-plan-v2",
          source_kind: "ai_authored_plan_first_v1",
          start_date: "2026-07-20",
          end_date: "2026-07-27",
          target_date: null,
          goal_metadata: {},
          plan_preferences: {},
        },
        workouts: [
          buildAtomicCreationWorkout(firstWorkoutId, planId, disposableUser.userId, "easy"),
        ] as unknown as Json,
        expectedActivePlanId: null,
        expectedActivePlanUpdatedAt: null,
        expectedHistory: {
          workout_ids: [],
          log_ids: [],
          asset_ids: [],
          metric_ids: [],
          comparison_ids: [],
          insight_ids: [],
        },
        archiveGoalMetadata: null,
        logs: [],
        evidenceRelinks: [],
        expectedProfileRevision: savedBaseline.profileRevision + 1,
      }),
      (error) => error instanceof ActivePlanPersistenceRejection && error.reason === "stale_review",
    );

    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: {
          goal_type: "distance_build",
          goal_label: "Atomic 10K proof",
          baseline_sessions_per_week: 3,
          baseline_long_run_km: 6,
          baseline_notes: null,
        },
        plan: {
          id: planId,
          title: "Atomic creation failure proof",
          goal_summary: "10K",
          source_template: "atomic_creation_failure_proof",
          schema_version: "training-plan-v2",
          source_kind: "ai_authored_plan_first_v1",
          start_date: "2026-07-20",
          end_date: "2026-07-27",
          target_date: null,
          goal_metadata: {},
          plan_preferences: {},
        },
        workouts: [
          buildAtomicCreationWorkout(firstWorkoutId, planId, disposableUser.userId, "easy"),
          buildAtomicCreationWorkout(
            crypto.randomUUID(),
            planId,
            disposableUser.userId,
            "invalid_workout_type",
          ),
        ] as unknown as Json,
        expectedActivePlanId: null,
        expectedActivePlanUpdatedAt: null,
        expectedHistory: {
          workout_ids: [],
          log_ids: [],
          asset_ids: [],
          metric_ids: [],
          comparison_ids: [],
          insight_ids: [],
        },
        archiveGoalMetadata: null,
        logs: [],
        evidenceRelinks: [],
        expectedProfileRevision: savedBaseline.profileRevision,
      }),
    );

    const [profile, plans, workouts] = await Promise.all([
      supabase
        .from("runner_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", disposableUser.userId),
      supabase
        .from("plan_cycles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", disposableUser.userId),
      supabase
        .from("planned_workouts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", disposableUser.userId),
    ]);
    assert.equal(profile.error, null);
    assert.equal(plans.error, null);
    assert.equal(workouts.error, null);
    assert.equal(profile.count, 1, "Failed plan creation must preserve the saved baseline.");
    assert.equal(plans.count, 0, "Failed plan creation must roll back the plan cycle.");
    assert.equal(workouts.count, 0, "Failed plan creation must roll back every workout row.");
    const baselineAfter = await supabase
      .from("runner_profiles")
      .select("*")
      .eq("user_id", disposableUser.userId)
      .single();
    assert.equal(baselineAfter.error, null);
    assert.deepEqual(baselineAfter.data, baselineBefore.data);
  } finally {
    await cleanupDisposableUser(supabase, disposableUser.userId);
  }

  return true as const;
}

function buildAtomicCreationWorkout(
  id: string,
  planId: string,
  userId: string,
  workoutType: string,
) {
  return {
    id,
    plan_cycle_id: planId,
    user_id: userId,
    workout_date: "2026-07-20",
    weekday: "Monday",
    week_number: 1,
    phase: "Base",
    workout_type: workoutType,
    source_workout_id: `atomic-${id}`,
    source_workout_type: "Easy",
    workout_family: "easy",
    workout_identity: "easy_aerobic_run",
    calendar_icon_key: "easy",
    goal_context: {},
    metric_mode: {},
    title: "Atomic proof workout",
    notes: null,
    planned_rpe: 3,
    estimated_fatigue: "low",
    recovery_priority: "normal",
    steps: [],
    display_order: 0,
  };
}

function distanceGoalSummary(draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>) {
  const distance = draft.normalizedInputSummary.planGoalIntent.distance;

  return {
    goalLabel: distance?.label ?? "Distance goal",
    distanceMeters: distance?.distanceMeters ?? null,
  };
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
  return cleanupDisposableSupabaseUser({
    supabase,
    userId,
    cleanupSpecs: DISPOSABLE_CLEANUP_SPECS,
  });
}
