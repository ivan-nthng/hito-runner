import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

import {
  buildReviewedAiGeneratedRunningPlanPreviewForUser,
  buildReviewedAiGeneratedRunningPlanPreview,
  confirmRunningPlanDraftForUser,
  type RunningPlanConfirmActionInput,
} from "../../src/lib/running-plan-engine-actions";
import {
  getAdaptiveBlueprintCalendarReadModelForUser,
  getAdaptiveBlueprintContinuationFactsForUser,
} from "../../src/lib/adaptive-blueprint-read-model";
import {
  getAdaptiveTrainingDetailedCandidateForUser,
  retainAdaptiveTrainingContinuationInputRevisionForUser,
} from "../../src/lib/adaptive-blueprint-persistence";
import {
  prepareAdaptiveContinuationCandidateForUser,
  submitAdaptiveContinuationInputForUser,
} from "../../src/lib/adaptive-blueprint-actions.server";
import {
  ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
  ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
  ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
} from "../../src/lib/adaptive-continuation-authoring";
import type {
  RunningPlanPreviewDraft,
  RunningPlanReviewedPreviewDraft,
} from "../../src/lib/running-plan-engine-review";
import {
  buildRunningPlanCanonicalPlan,
  buildRunningPlanPersistenceMetadata,
} from "../../src/lib/running-plan-engine-review";
import { applyAtomicReviewedPlanPersistence } from "../../src/lib/active-plan-lifecycle-persistence";
import { CalendarPersistenceRejection } from "../../src/lib/runner-calendar-mutations";
import {
  applySavedPlanRecordForUser,
  getSavedPlanRecordForUser,
  listSavedPlanLibraryForUser,
  logicallyRemoveSavedPlanRecordForUser,
  readSavedPlanPayload,
  retainImportedPlanCandidateForUser,
  retainReviewedPlanCandidateForUser,
} from "../../src/lib/active-plan-persistence";
import {
  exportSavedPlanForUser,
  savedPlanStartInputSchema,
} from "../../src/lib/active-plan-export-actions";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
  AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
  buildAiGeneratedContinuationDevFixtureProviderResponse,
  buildAiGeneratedContinuationDevFixtureOpenAiFetch,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
} from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { requestAiPlanStructuredResponse } from "../../src/lib/ai-first-plan-draft-service";
import { AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID } from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { buildAiGeneratedRunningPlanAuthoringInput } from "../../src/lib/ai-generated-running-plan";
import { acceptedRunnerHeartRateProfileSchema } from "../../src/lib/heart-rate-zones";
import { buildImportedPlanSeed, type TrainingPlanV2 } from "../../src/lib/imported-plan";
import {
  confirmWorkoutCommandForUser,
  reviewWorkoutCommandForUser,
} from "../../src/lib/manual-workout-authoring/actions";
import { buildPersistedWorkoutInsertRows } from "../../src/lib/persisted-plan-replacement";
import { prepareSavedPlanFutureApplyPolicy } from "../../src/lib/plan-apply-policy";
import { DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE } from "../../src/lib/local-auth-account-registry.server";
import { getRunnerCalendarDateForUserId } from "../../src/lib/runner-calendar-context";
import {
  buildAiAuthoredPlanFirstProviderContext,
  type AiAuthoredPlanFirstCompilerDraft,
} from "../../src/lib/ai-authored-plan-first-provider-contract";
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
  renderPlanExportMarkdown,
} from "../../src/lib/plan-export";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import { addDaysIso, startOfWeekIso, weekdayLong } from "../../src/lib/training";
import type { Database, Json } from "../../src/lib/supabase/database";
import { projectContinuationEvidenceState } from "../../src/lib/workout-result-import/read-workout-result-feedback";
import {
  buildFirstTimeRunnerBaselineReadback,
  getUserSettingsForUserId,
  updateUserSettingsForUserId,
} from "../../src/lib/user-settings-actions";
import {
  validateAiAuthoredPrimaryExecutionGuidance,
  validateNoClientRowsTrusted,
} from "./assertions";
import { validateRunnerFacingTargetReadbackContract } from "../running-plan-engine-target-readback-contract";
import {
  acquireQaPoolSupabaseUser,
  DISPOSABLE_REQUIRE_PERSISTENCE_FLAG,
  readDisposablePersistenceCliOptions,
  releaseQaPoolSupabaseUser,
  resolveDisposablePersistencePreflight,
  type DisposablePersistencePreflight,
  type QaPoolSupabaseCleanupProof,
} from "../lib/qa-pool-persistence-proof";
import { buildProofInitialPlanProfile } from "../runner-fitness-profile-initial-plan-proof-helpers";

type DisposableCleanupProof = QaPoolSupabaseCleanupProof;
type QaPoolUserLease = Awaited<ReturnType<typeof acquireQaPoolSupabaseUser>>;
type BuildConfirmInputForConfirm = (
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) => RunningPlanConfirmActionInput;

const REQUIRE_PERSISTENCE_FLAG = DISPOSABLE_REQUIRE_PERSISTENCE_FLAG;
const DISPOSABLE_TEST_PASSWORD = "Hito-local-proof-2026!";
const PERSONAL_HEART_RATE_ZONES = [
  { reference: "Z1", minBpm: 95, maxBpm: 120 },
  { reference: "Z2", minBpm: 116, maxBpm: 135 },
  { reference: "Z3", minBpm: 130, maxBpm: 150 },
  { reference: "Z4", minBpm: 145, maxBpm: 165 },
  { reference: "Z5", minBpm: 160, maxBpm: 185 },
] as const;
const UPDATED_PERSONAL_HEART_RATE_ZONES = [
  { reference: "Z1", minBpm: 90, maxBpm: 110 },
  { reference: "Z2", minBpm: 115, maxBpm: 130 },
  { reference: "Z3", minBpm: 135, maxBpm: 145 },
  { reference: "Z4", minBpm: 150, maxBpm: 160 },
  { reference: "Z5", minBpm: 165, maxBpm: 180 },
] as const;
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

export async function validatePersistenceContract(
  reviewedDrafts: readonly RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>[],
  preflight: Extract<PersistencePreflight, { shouldRun: true }>,
  buildConfirmInputForConfirm: BuildConfirmInputForConfirm,
) {
  const supabase = createAdminSupabaseClient();
  const sourceDraft = reviewedDrafts.find(
    (draft) =>
      draft.normalizedInputSummary.planGoalIntent.distance?.distanceMeters === 42_195 &&
      draft.normalizedInputSummary.planGoalIntent.targetDate != null,
  );
  assert.ok(
    sourceDraft,
    "Adaptive confirmation proof requires one target-dated Marathon source draft.",
  );
  const owner = await acquireQaPoolSupabaseUser({
    supabase,
    poolRole: "provider-engine",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Adaptive confirmation owner could not be acquired.",
  });
  const otherRunner = await acquireQaPoolSupabaseUser({
    supabase,
    poolRole: "isolation-a",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Adaptive confirmation isolation runner could not be acquired.",
  });
  const priorFixtureFlag = process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
  const priorProviderMode = process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV];
  const priorFixtureScenario = process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
  let ownerCleanup: DisposableCleanupProof | null = null;
  let otherCleanup: DisposableCleanupProof | null = null;

  try {
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "real";
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];

    await persistReviewedDraftProfileSnapshot(owner.userId, sourceDraft);
    await persistReviewedDraftProfileSnapshot(otherRunner.userId, sourceDraft);
    const runnerCurrentDate = await getRunnerCalendarDateForUserId(owner.userId);
    const previewInput = {
      ...sourceDraft.previewInput,
      startDate: runnerCurrentDate,
      runnerComment: null,
    };
    const authoring = buildAiGeneratedRunningPlanAuthoringInput(
      previewInput,
      sourceDraft.normalizedInputSummary.initialPlanProfile,
      sourceDraft.normalizedInputSummary.heartRateProfile,
    );
    assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
    if (!authoring.ok) throw new Error(authoring.message);
    const prepareContinuationCandidate = (asOfDate: string) =>
      prepareAdaptiveContinuationCandidateForUser(
        { userId: owner.userId, asOfDate },
        {
          requestStructuredResponse: ({ prompt, brief }) =>
            requestAiPlanStructuredResponse({
              apiKey: "synthetic-adaptive-continuation-proof",
              model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
              prompt,
              responseSchemaName: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
              contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
              responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
              fetchImpl: buildAiGeneratedContinuationDevFixtureOpenAiFetch({
                authoringInput: authoring.authoringInput,
                brief,
              }),
              generationLedger: { disabled: true },
            }),
        },
      );
    let mismatchedBaselineProviderCalls = 0;
    const mismatchedBaseline = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      owner.userId,
      { ...previewInput, age: previewInput.age + 1 },
      {
        aiPreview: {
          apiKey: "must-not-dispatch-for-mismatched-runner-baseline",
          model: "must-not-dispatch-for-mismatched-runner-baseline",
          fetchImpl: async () => {
            mismatchedBaselineProviderCalls += 1;
            throw new Error("Mismatched runner baseline reached provider dispatch.");
          },
          generationLedger: { disabled: true },
        },
      },
    );
    assert.equal(mismatchedBaseline.ok, false);
    if (mismatchedBaseline.ok) {
      throw new Error("A mismatched persisted runner baseline produced a signed preview.");
    }
    assert.equal(mismatchedBaseline.unavailable.error.code, "structured_input_invalid");
    assert.equal(mismatchedBaseline.unavailable.callsOpenAi, false);
    assert.equal(mismatchedBaselineProviderCalls, 0);
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_detailed_candidates", owner.userId),
      0,
    );
    assert.equal(await countOwnedRows(supabase, "ai_plan_generation_responses", owner.userId), 0);

    const reviewed = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      owner.userId,
      previewInput,
      {
        aiPreview: {
          apiKey: "synthetic-adaptive-confirmation-proof",
          model: "gpt-5.2-adaptive-confirmation-proof",
          fetchImpl: buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
            authoringInput: authoring.authoringInput,
            today: runnerCurrentDate,
          }),
          generationLedger: { disabled: true },
        },
      },
    );
    assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
    if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
    assert.ok(reviewed.draft.sourceCandidate, "Reviewed source candidate must be retained.");
    assert.equal(reviewed.draft.canonicalRowCount, 28);
    assert.equal(reviewed.draft.blueprint.detailedHorizon.calendarWeekCount, 4);

    const confirmInput = buildConfirmInputForConfirm(reviewed.draft);
    for (const limitationInput of [
      { ...confirmInput, currentRunningLimitation: "yes" as const },
      { ...confirmInput, currentRunningLimitation: "unsure" as const },
    ]) {
      const blockedForLimitation = await confirmRunningPlanDraftForUser(
        owner.userId,
        limitationInput,
        { allowLocalQaFixture: true },
      );
      assert.equal(blockedForLimitation.ok, false);
      if (!blockedForLimitation.ok) {
        assert.equal(blockedForLimitation.reason, "invalid_review");
      }
      assert.equal(await countOwnedRows(supabase, "planned_workouts", owner.userId), 0);
      assert.equal(
        await countOwnedRows(supabase, "adaptive_training_block_confirmations", owner.userId),
        0,
      );
    }
    const invalidReview = await confirmRunningPlanDraftForUser(
      owner.userId,
      { ...confirmInput, reviewChecksum: "0".repeat(64) },
      { allowLocalQaFixture: true },
    );
    assert.equal(invalidReview.ok, false);
    assert.equal(await countOwnedRows(supabase, "planned_workouts", owner.userId), 0);

    const foreignConfirmation = await confirmRunningPlanDraftForUser(
      otherRunner.userId,
      confirmInput,
      { allowLocalQaFixture: true },
    );
    assert.equal(foreignConfirmation.ok, false);
    assert.equal(await countOwnedRows(supabase, "planned_workouts", otherRunner.userId), 0);

    const confirmed = await confirmRunningPlanDraftForUser(owner.userId, confirmInput, {
      allowLocalQaFixture: true,
    });
    assert.equal(confirmed.ok, true, JSON.stringify(confirmed));
    if (!confirmed.ok) throw new Error(confirmed.message);
    assert.equal(confirmed.blueprintId, reviewed.draft.sourceCandidate!.blueprintId);
    assert.equal(confirmed.detailedCandidateId, reviewed.draft.sourceCandidate!.candidateId);
    assert.equal(confirmed.calendarRowCount, reviewed.draft.canonicalRowCount);

    const confirmations = await supabase
      .from("adaptive_training_block_confirmations")
      .select("*")
      .eq("user_id", owner.userId)
      .eq("detailed_candidate_id", confirmed.detailedCandidateId);
    if (confirmations.error) throw new Error(confirmations.error.message);
    assert.equal(confirmations.data.length, 1);
    const blockConfirmation = confirmations.data[0]!;
    assert.equal(blockConfirmation.blueprint_id, confirmed.blueprintId);
    assert.equal(blockConfirmation.block_mode, "initial_four_week");
    assert.equal(blockConfirmation.predecessor_confirmation_id, null);
    assert.equal(blockConfirmation.calendar_workout_ids.length, confirmed.calendarRowCount);

    const projections = await getAdaptiveBlueprintCalendarReadModelForUser(
      owner.userId,
      runnerCurrentDate,
    );
    assert.equal(projections.projections.length, reviewed.draft.blueprint.projections.length);
    assert.ok(
      projections.projections.every(
        (projection) =>
          projection.date > blockConfirmation.interval_end_date &&
          projection.status === "planned" &&
          projection.capabilities.canOpenWorkout === false &&
          projection.capabilities.canMutateWorkout === false &&
          projection.capabilities.canAttachResultOrEvidence === false,
      ),
    );
    assert.deepEqual(Object.keys(projections.projections[0] ?? {}).sort(), [
      "activePreferenceIds",
      "blueprint",
      "capabilities",
      "date",
      "goalAssumption",
      "kind",
      "phase",
      "phaseCadence",
      "projectionId",
      "reviewTiming",
      "status",
      "workoutFamily",
    ]);
    assert.deepEqual(
      await getAdaptiveBlueprintCalendarReadModelForUser(owner.userId, runnerCurrentDate),
      projections,
      "Source projection readback must be idempotent and preserve stable identities.",
    );

    const firstProjection = projections.projections[0];
    const secondProjection = projections.projections[1];
    assert.ok(firstProjection && secondProjection);
    const firstRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
      userId: owner.userId,
      blueprint: firstProjection.blueprint,
      activeProjectionPreferences: [
        {
          kind: "avoid_projection_date",
          projectionId: firstProjection.projectionId,
          date: firstProjection.date,
        },
        {
          kind: "swap_projection_slots",
          firstProjectionId: firstProjection.projectionId,
          secondProjectionId: secondProjection.projectionId,
        },
      ],
    });
    const repeatedRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
      userId: owner.userId,
      blueprint: firstProjection.blueprint,
      activeProjectionPreferences: [
        {
          kind: "avoid_projection_date",
          projectionId: firstProjection.projectionId,
          date: firstProjection.date,
        },
        {
          kind: "swap_projection_slots",
          firstProjectionId: firstProjection.projectionId,
          secondProjectionId: secondProjection.projectionId,
        },
      ],
    });
    assert.deepEqual(repeatedRevision, firstRevision);
    const secondRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
      userId: owner.userId,
      blueprint: firstProjection.blueprint,
      activeProjectionPreferences: [
        {
          kind: "avoid_projection_date",
          projectionId: secondProjection.projectionId,
          date: secondProjection.date,
        },
      ],
    });
    assert.equal(secondRevision.revision, firstRevision.revision + 1);
    assert.equal(secondRevision.supersedesRevision, firstRevision.revision);
    const preferredProjectionReadback = await getAdaptiveBlueprintCalendarReadModelForUser(
      owner.userId,
      runnerCurrentDate,
    );
    assert.deepEqual(
      preferredProjectionReadback.projections.find(
        (projection) => projection.projectionId === secondProjection.projectionId,
      )?.activePreferenceIds,
      [`${secondRevision.id}:0`],
    );

    const invalidForeignRevision = await supabase.rpc(
      "retain_adaptive_training_continuation_input_revision",
      {
        p_user_id: otherRunner.userId,
        p_blueprint_id: firstProjection.blueprint.id,
        p_blueprint_version: firstProjection.blueprint.version,
        p_blueprint_sha256: firstProjection.blueprint.sha256,
        p_active_projection_preferences: [],
        p_horizon_check_in: null,
      },
    );
    assert.ok(invalidForeignRevision.error, "Cross-owner continuation input must be rejected.");

    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    assert.ok(publishableKey, "Adaptive Source RLS proof requires a publishable key.");
    const ownerClient = createClient<Database>(preflight.target.url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const otherClient = createClient<Database>(preflight.target.url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    assert.equal(
      (
        await ownerClient.auth.signInWithPassword({
          email: owner.email,
          password: DISPOSABLE_TEST_PASSWORD,
        })
      ).error,
      null,
    );
    assert.equal(
      (
        await otherClient.auth.signInWithPassword({
          email: otherRunner.email,
          password: DISPOSABLE_TEST_PASSWORD,
        })
      ).error,
      null,
    );
    const ownerConfirmationRead = await ownerClient
      .from("adaptive_training_block_confirmations")
      .select("id")
      .eq("id", blockConfirmation.id);
    assert.equal(ownerConfirmationRead.error, null);
    assert.equal(ownerConfirmationRead.data.length, 1);
    const foreignConfirmationRead = await otherClient
      .from("adaptive_training_block_confirmations")
      .select("id")
      .eq("id", blockConfirmation.id);
    assert.equal(foreignConfirmationRead.error, null);
    assert.equal(foreignConfirmationRead.data.length, 0);
    const authenticatedRevisionInsert = await ownerClient
      .from("adaptive_training_continuation_input_revisions")
      .insert({
        user_id: owner.userId,
        blueprint_id: confirmed.blueprintId,
        revision: 999,
        content_sha256: "9".repeat(64),
        active_projection_preferences: [],
      });
    assert.ok(authenticatedRevisionInsert.error, "Authenticated Source writes must be denied.");
    const immutableConfirmation = await supabase
      .from("adaptive_training_block_confirmations")
      .update({ block_mode: "normal_four_week" })
      .eq("id", blockConfirmation.id);
    assert.ok(immutableConfirmation.error, "Block confirmation mutation must be rejected.");
    const immutableRevision = await supabase
      .from("adaptive_training_continuation_input_revisions")
      .update({ active_projection_preferences: [] })
      .eq("id", secondRevision.id);
    assert.ok(immutableRevision.error, "Continuation-input mutation must be rejected.");

    const persistedWorkouts = await supabase
      .from("planned_workouts")
      .select("*")
      .eq("user_id", owner.userId)
      .order("workout_date", { ascending: true });
    if (persistedWorkouts.error) throw new Error(persistedWorkouts.error.message);
    assert.equal(persistedWorkouts.data.length, reviewed.draft.canonicalRowCount);
    assert.deepEqual(
      persistedWorkouts.data.map((workout) => workout.source_workout_id),
      reviewed.draft.workoutDocuments.map((document) => document.sourceWorkoutId),
    );
    assert.ok(
      persistedWorkouts.data.every(
        (workout) => workout.plan_cycle_id === null && workout.origin_kind === "ai",
      ),
    );
    validateAiAuthoredPrimaryExecutionGuidance(persistedWorkouts.data);
    validateNoClientRowsTrusted(persistedWorkouts.data);
    assert.equal(await countOwnedRows(supabase, "plan_cycles", owner.userId), 0);

    const projectionDates = new Set(reviewed.draft.blueprint.projections.map(({ date }) => date));
    assert.equal(
      persistedWorkouts.data.some((workout) => projectionDates.has(workout.workout_date)),
      false,
      "Future Blueprint projections must not become Calendar workouts.",
    );

    const events = await supabase
      .from("calendar_workout_mutation_events")
      .select("event_payload, planned_workout_id, review_checksum")
      .eq("user_id", owner.userId)
      .order("id", { ascending: true });
    if (events.error) throw new Error(events.error.message);
    assert.equal(events.data.length, persistedWorkouts.data.length);
    for (const event of events.data) {
      const payload = asJsonRecord(event.event_payload);
      const lineage = asJsonRecord(payload?.adaptive_training_confirmation);
      assert.equal(lineage?.blueprint_id, confirmed.blueprintId);
      assert.equal(lineage?.detailed_candidate_id, confirmed.detailedCandidateId);
      assert.equal(lineage?.source_preview_review_checksum, reviewed.draft.reviewChecksum);
      assert.equal(lineage?.current_running_limitation, "no");
      assert.match(String(lineage?.source_review_checksum), /^[0-9a-f]{64}$/);
    }

    const historicalWorkoutId = crypto.randomUUID();
    const historicalWorkoutDate = addDaysIso(runnerCurrentDate, -60);
    const historicalWorkout = await supabase.from("planned_workouts").insert({
      id: historicalWorkoutId,
      user_id: otherRunner.userId,
      plan_cycle_id: null,
      origin_kind: "manual",
      phase: "base",
      title: "Historical easy run",
      display_order: 1,
      week_number: 1,
      weekday: weekdayLong(historicalWorkoutDate),
      workout_date: historicalWorkoutDate,
      workout_type: "easy",
      workout_family: "easy",
      workout_identity: "easy_aerobic_run",
      source_workout_id: `historical-body-note-${historicalWorkoutId}`,
      source_workout_type: "easy_aerobic_run",
      steps: [],
    });
    if (historicalWorkout.error) throw new Error(historicalWorkout.error.message);
    const historicalBodyNote = [
      {
        area: "L. Calf",
        severity: 2,
        timing: "after",
        sensation: "Tight",
        note: "Historical body-note confirmation non-authority proof.",
      },
    ];
    const historicalLog = await supabase.from("workout_logs").insert({
      user_id: otherRunner.userId,
      planned_workout_id: historicalWorkoutId,
      outcome: "completed",
      body_notes: historicalBodyNote,
    });
    if (historicalLog.error) throw new Error(historicalLog.error.message);
    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "qa_fixture";
    process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = "true";
    const otherReviewed = await (async () => {
      try {
        return await buildReviewedAiGeneratedRunningPlanPreviewForUser(
          otherRunner.userId,
          previewInput,
          {
            qaFixtureAuthorized: true,
            aiPreview: { generationLedger: { disabled: true } },
          },
        );
      } finally {
        process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "real";
        delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
      }
    })();
    assert.equal(
      otherReviewed.ok,
      true,
      otherReviewed.ok ? "" : otherReviewed.unavailable.error.message,
    );
    if (!otherReviewed.ok) throw new Error(otherReviewed.unavailable.error.message);
    assert.ok(otherReviewed.draft.sourceCandidate);
    const otherFrozenCandidate = await supabase
      .from("adaptive_training_detailed_candidates")
      .select("input_snapshot")
      .eq("user_id", otherRunner.userId)
      .eq("id", otherReviewed.draft.sourceCandidate!.candidateId)
      .single();
    if (otherFrozenCandidate.error) throw new Error(otherFrozenCandidate.error.message);
    const otherFrozenInput = asJsonRecord(otherFrozenCandidate.data.input_snapshot);
    assert.deepEqual(
      otherFrozenInput?.initialPlanProfile,
      otherReviewed.draft.normalizedInputSummary.initialPlanProfile,
      "The real QA fixture path must freeze the accepted server-owned initial-plan profile.",
    );
    assert.deepEqual(otherFrozenInput?.runnerFacts, {
      age: otherReviewed.draft.normalizedInputSummary.age,
      benchmark: otherReviewed.draft.normalizedInputSummary.benchmarkPaceTruth,
      heartRateProfile: otherReviewed.draft.normalizedInputSummary.heartRateProfile,
      heightCm: otherReviewed.draft.normalizedInputSummary.heightCm,
      selfReportedLevel: otherReviewed.draft.normalizedInputSummary.runnerLevel,
      weightKg: otherReviewed.draft.normalizedInputSummary.weightKg,
    });
    const otherConfirmed = await confirmRunningPlanDraftForUser(
      otherRunner.userId,
      {
        ...buildConfirmInputForConfirm(otherReviewed.draft),
        currentRunningLimitation: "no",
      },
      { allowLocalQaFixture: true },
    );
    assert.equal(otherConfirmed.ok, true, JSON.stringify(otherConfirmed));
    const historicalLogReadback = await supabase
      .from("workout_logs")
      .select("body_notes")
      .eq("user_id", otherRunner.userId)
      .eq("planned_workout_id", historicalWorkoutId)
      .single();
    if (historicalLogReadback.error) throw new Error(historicalLogReadback.error.message);
    assert.deepEqual(historicalLogReadback.data.body_notes, historicalBodyNote);

    const evidenceCutoffDate = addDaysIso(blockConfirmation.interval_start_date, 13);
    const readinessDate = addDaysIso(blockConfirmation.interval_end_date, -13);
    const dueWorkouts = persistedWorkouts.data.filter(
      (workout) => workout.workout_type !== "rest" && workout.workout_date <= evidenceCutoffDate,
    );
    const protectedWorkout = dueWorkouts[0];
    assert.ok(protectedWorkout);
    const protectedLog = await supabase.from("workout_logs").insert(
      dueWorkouts.map((workout) => ({
        user_id: owner.userId,
        planned_workout_id: workout.id,
        outcome: "completed" as const,
      })),
    );
    if (protectedLog.error) throw new Error(protectedLog.error.message);
    const continuationFacts = await getAdaptiveBlueprintContinuationFactsForUser({
      userId: owner.userId,
      asOf: readinessDate,
      cutoffDate: evidenceCutoffDate,
    });
    assert.ok(continuationFacts);
    assert.equal(continuationFacts!.calendar.workouts.length, dueWorkouts.length);
    assert.equal(continuationFacts!.evidence.dueWorkoutCount, dueWorkouts.length);
    assert.equal(continuationFacts!.evidence.resolvedOutcomeCount, dueWorkouts.length);
    assert.ok(
      continuationFacts!.evidence.workouts.some(
        (workout) => workout.evidenceState === "completed_without_fit",
      ),
    );
    assert.equal(
      projectContinuationEvidenceState({
        outcome: "unresolved",
        parseStatus: "uploaded",
        rawState: "available",
        hasMetrics: false,
      }),
      "updating",
    );
    assert.equal(
      projectContinuationEvidenceState({
        outcome: "completed",
        parseStatus: "parsed",
        rawState: "removed",
        hasMetrics: true,
      }),
      "removed",
    );

    const missingCheckIn = await prepareContinuationCandidate(readinessDate);
    assert.equal(missingCheckIn.ok, false);
    assert.equal(missingCheckIn.state.status, "check_in_needed");
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_detailed_candidates", owner.userId),
      1,
      "Readiness without a check-in must not retain a candidate.",
    );

    const horizonCheckIn = {
      confirmationId: blockConfirmation.id,
      goalAssumptionCurrent: true,
      availabilityConfirmed: true,
      manageability: "manageable" as const,
      materialChangeReason: null,
      healthLimitation: "no" as const,
      interruptionStatus: "none" as const,
      clinicianGuidance: "not_applicable" as const,
    };
    const staleInputRevision = await submitAdaptiveContinuationInputForUser(owner.userId, {
      expectedBlueprint: { ...firstProjection.blueprint, sha256: "0".repeat(64) },
      expectedConfirmationId: blockConfirmation.id,
      activeProjectionPreferences: [
        {
          kind: "avoid_projection_date",
          projectionId: secondProjection.projectionId,
          date: secondProjection.date,
        },
      ],
      horizonCheckIn,
    });
    assert.deepEqual(staleInputRevision, { ok: false, reason: "source_stale" });
    assert.equal(
      await countOwnedRows(
        supabase,
        "adaptive_training_continuation_input_revisions",
        owner.userId,
      ),
      2,
      "A stale public Source identity must append no continuation input revision.",
    );
    const submittedCheckIn = await submitAdaptiveContinuationInputForUser(owner.userId, {
      expectedBlueprint: firstProjection.blueprint,
      expectedConfirmationId: blockConfirmation.id,
      activeProjectionPreferences: [
        {
          kind: "avoid_projection_date",
          projectionId: secondProjection.projectionId,
          date: secondProjection.date,
        },
      ],
      horizonCheckIn,
    });
    assert.equal(submittedCheckIn.ok, true);
    if (!submittedCheckIn.ok) throw new Error(submittedCheckIn.reason);
    const checkInRevision = submittedCheckIn.retained;
    assert.equal(checkInRevision.revision, secondRevision.revision + 1);

    let rejectedProviderDispatchCount = 0;
    const rejectedProviderModel = `${AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL}-rejection-proof`;
    const requestCompilerRejectedContinuation = ({
      prompt,
      brief,
    }: Parameters<
      NonNullable<
        Parameters<
          typeof prepareAdaptiveContinuationCandidateForUser
        >[1]["requestStructuredResponse"]
      >
    >[0]) => {
      rejectedProviderDispatchCount += 1;
      const rejectedResponse = buildAiGeneratedContinuationDevFixtureProviderResponse({
        authoringInput: authoring.authoringInput,
        brief,
      });
      rejectedResponse.detailed_block.final_workout.phase = "Wrong phase";
      return requestAiPlanStructuredResponse({
        apiKey: "synthetic-adaptive-continuation-rejection-proof",
        model: rejectedProviderModel,
        prompt,
        responseSchemaName: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
        contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
        responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              id: `local-dev-adaptive-continuation-rejected-${crypto.randomUUID()}`,
              status: "completed",
              output_text: JSON.stringify(rejectedResponse),
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        generationLedger: { disabled: true },
      });
    };
    const compilerRejectedCandidate = await prepareAdaptiveContinuationCandidateForUser(
      { userId: owner.userId, asOfDate: readinessDate },
      {
        providerModel: rejectedProviderModel,
        requestStructuredResponse: requestCompilerRejectedContinuation,
      },
    );
    assert.equal(compilerRejectedCandidate.ok, false);
    if (compilerRejectedCandidate.ok) {
      throw new Error("The invalid continuation response was unexpectedly accepted.");
    }
    assert.equal(compilerRejectedCandidate.reason, "compiler_rejection");
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_detailed_candidates", owner.userId),
      1,
      "A compiler-rejected continuation response must retain no review candidate.",
    );
    assert.equal(
      await countOwnedRows(supabase, "planned_workouts", owner.userId),
      persistedWorkouts.data.length,
      "A compiler-rejected continuation response must write no Calendar rows.",
    );
    const rejectedResponseRows = await supabase
      .from("ai_plan_generation_responses")
      .select(
        "schema_outcome, compiler_outcome, diagnostic_code, diagnostic_path, request_context, version_context, request_fingerprint_sha256",
      )
      .eq("user_id", owner.userId)
      .eq("schema_outcome", "accepted")
      .eq("compiler_outcome", "rejected");
    if (rejectedResponseRows.error) throw new Error(rejectedResponseRows.error.message);
    assert.equal(rejectedResponseRows.data.length, 1);
    assert.equal(
      rejectedResponseRows.data[0]?.diagnostic_code,
      "adaptive_continuation_phase_mismatch",
    );
    const retainedRequestContext = asJsonRecord(rejectedResponseRows.data[0]?.request_context);
    assert.deepEqual(Object.keys(retainedRequestContext ?? {}), ["brief"]);
    const compactRetainedRequestJson = JSON.stringify(retainedRequestContext);
    for (const forbidden of [
      "acceptedFitDays",
      "compatibleRpeDays",
      "originalAuthoringInput",
      "planned_workouts",
      "providerHistory",
      "requestContext",
      "response_body",
      "workoutDocuments",
    ]) {
      assert.equal(
        compactRetainedRequestJson.includes(forbidden),
        false,
        `The retained continuation request must exclude ${forbidden}.`,
      );
    }
    const retainedVersionContext = asJsonRecord(rejectedResponseRows.data[0]?.version_context);
    const retainedProviderSettings = asJsonRecord(retainedVersionContext?.providerSettings);
    assert.deepEqual(Object.keys(retainedProviderSettings ?? {}).sort(), [
      "contractMode",
      "maxOutputTokens",
      "reasoningEffort",
      "responseSchemaMode",
      "responseSchemaName",
      "textVerbosity",
      "timeoutMs",
    ]);
    assert.match(rejectedResponseRows.data[0]?.request_fingerprint_sha256 ?? "", /^[0-9a-f]{64}$/);
    const repeatedCompilerRejectedCandidate = await prepareAdaptiveContinuationCandidateForUser(
      { userId: owner.userId, asOfDate: readinessDate },
      {
        providerModel: rejectedProviderModel,
        requestStructuredResponse: requestCompilerRejectedContinuation,
      },
    );
    assert.deepEqual(repeatedCompilerRejectedCandidate, compilerRejectedCandidate);
    assert.equal(
      rejectedProviderDispatchCount,
      1,
      "An exact owner/context/model/prompt/schema/compiler/policy/provider-settings match must reuse the retained response with zero second dispatch.",
    );
    const reusedRejectedResponseRows = await supabase
      .from("ai_plan_generation_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId)
      .eq("schema_outcome", "accepted")
      .eq("compiler_outcome", "rejected");
    if (reusedRejectedResponseRows.error) {
      throw new Error(reusedRejectedResponseRows.error.message);
    }
    assert.equal(reusedRejectedResponseRows.count, 1);

    const preparedCandidate = await prepareContinuationCandidate(readinessDate);
    assert.equal(preparedCandidate.ok, true, JSON.stringify(preparedCandidate));
    assert.equal(preparedCandidate.state.status, "candidate_ready");
    assert.equal(preparedCandidate.retainedCandidate?.candidateVersion, 2);
    if (!preparedCandidate.ok || preparedCandidate.state.status !== "candidate_ready") {
      throw new Error("The continuation candidate was not prepared after the exact check-in.");
    }
    assert.equal(preparedCandidate.state.context.blueprint.id, confirmed.blueprintId);
    assert.equal(preparedCandidate.state.context.confirmation.id, blockConfirmation.id);
    assert.equal(preparedCandidate.state.context.currentInputRevision?.id, checkInRevision.id);
    assert.equal(preparedCandidate.state.context.capabilities.canReviewCandidate, true);
    assert.equal(preparedCandidate.state.context.capabilities.canConfirmCandidate, true);
    assert.equal(preparedCandidate.state.candidate.sourceResponseBound, true);
    assert.equal(preparedCandidate.state.context.dataQuality?.dueWorkoutCount, dueWorkouts.length);
    assert.ok(preparedCandidate.state.candidate.workoutDocuments.length > 0);
    const publicCandidateJson = JSON.stringify(preparedCandidate.state);
    for (const privateField of [
      "sourceResponseId",
      "source_response_id",
      "retainedResponseId",
      "retainedResponseSha256",
      "acceptedActualMetrics",
      "calendarWorkoutId",
      "input_snapshot",
      "inputProvenance",
    ]) {
      assert.equal(
        publicCandidateJson.includes(privateField),
        false,
        `The public continuation DTO must exclude ${privateField}.`,
      );
    }
    const preparedCandidateRow = await getAdaptiveTrainingDetailedCandidateForUser({
      userId: owner.userId,
      candidateId: preparedCandidate.state.candidate.id,
    });
    assert.ok(preparedCandidateRow);
    const preparedContent = asJsonRecord(preparedCandidateRow!.candidate_content);
    const preparedDocuments = preparedContent?.workoutDocuments;
    assert.ok(Array.isArray(preparedDocuments));
    assert.ok(preparedDocuments.length > 0);
    assert.ok(
      preparedDocuments.every((document) => {
        const record = asJsonRecord(document);
        return (
          typeof record?.workoutDate === "string" &&
          record.workoutDate >= preparedCandidate.state.window.startDate &&
          record.workoutDate <= preparedCandidate.state.window.endDate
        );
      }),
    );
    assert.equal(
      await countOwnedRows(supabase, "planned_workouts", owner.userId),
      persistedWorkouts.data.length,
      "Preparing a continuation candidate must create zero Calendar rows.",
    );
    const repeatedCandidate = await prepareContinuationCandidate(readinessDate);
    assert.equal(repeatedCandidate.ok, true);
    assert.equal(repeatedCandidate.state.status, "candidate_ready");
    assert.equal(repeatedCandidate.retained, false);
    assert.deepEqual(repeatedCandidate.state.candidate, preparedCandidate.state.candidate);
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_detailed_candidates", owner.userId),
      2,
      "An identical frozen input must reuse the immutable candidate version.",
    );
    const firstContinuationReview = await reviewWorkoutCommandForUser(
      owner.userId,
      {
        operation: "materialize_source_candidate",
        source: {
          kind: "adaptive_continuation_candidate",
          candidateId: preparedCandidate.state.candidate.id,
        },
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(firstContinuationReview.ok, true, JSON.stringify(firstContinuationReview));
    if (!firstContinuationReview.ok) {
      throw new Error(firstContinuationReview.issues[0]?.message);
    }
    const repeatedContinuationReview = await reviewWorkoutCommandForUser(
      owner.userId,
      {
        operation: "materialize_source_candidate",
        source: {
          kind: "adaptive_continuation_candidate",
          candidateId: preparedCandidate.state.candidate.id,
        },
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.deepEqual(
      repeatedContinuationReview,
      firstContinuationReview,
      "An unchanged sealed continuation candidate must produce one idempotent review payload.",
    );

    const ownerContinuationCandidateRead = await ownerClient
      .from("adaptive_training_detailed_candidates")
      .select("id, candidate_content, input_snapshot")
      .eq("id", preparedCandidate.state.candidate.id);
    assert.equal(ownerContinuationCandidateRead.error, null);
    assert.equal(ownerContinuationCandidateRead.data.length, 1);
    assert.deepEqual(
      ownerContinuationCandidateRead.data[0]?.candidate_content,
      preparedCandidateRow!.candidate_content,
    );
    assert.deepEqual(
      ownerContinuationCandidateRead.data[0]?.input_snapshot,
      preparedCandidateRow!.input_snapshot,
    );
    const foreignContinuationCandidateRead = await otherClient
      .from("adaptive_training_detailed_candidates")
      .select("id")
      .eq("id", preparedCandidate.state.candidate.id);
    assert.equal(foreignContinuationCandidateRead.error, null);
    assert.equal(foreignContinuationCandidateRead.data.length, 0);

    const changedInputRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
      userId: owner.userId,
      blueprint: firstProjection.blueprint,
      activeProjectionPreferences: [
        {
          kind: "avoid_projection_date",
          projectionId: secondProjection.projectionId,
          date: secondProjection.date,
        },
      ],
      horizonCheckIn: {
        ...horizonCheckIn,
        materialChangeReason: "Availability changed after the prior review snapshot.",
      },
    });
    assert.equal(changedInputRevision.revision, checkInRevision.revision + 1);
    const changedInputCandidate = await prepareContinuationCandidate(readinessDate);
    assert.equal(changedInputCandidate.ok, true);
    assert.equal(changedInputCandidate.state.status, "candidate_ready");
    assert.equal(changedInputCandidate.retainedCandidate?.candidateVersion, 3);
    assert.notEqual(
      changedInputCandidate.retainedCandidate?.inputFingerprintSha256,
      preparedCandidate.retainedCandidate?.inputFingerprintSha256,
      "Every frozen continuation-input change must stale the prior candidate.",
    );
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_detailed_candidates", owner.userId),
      3,
    );
    const staleContinuationConfirmation = await confirmWorkoutCommandForUser(
      owner.userId,
      {
        command: firstContinuationReview.candidate.command,
        candidateId: firstContinuationReview.candidate.candidateId,
        reviewToken: firstContinuationReview.candidate.reviewToken,
        reviewChecksum: firstContinuationReview.candidate.reviewChecksum,
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(staleContinuationConfirmation.ok, false);
    if (!staleContinuationConfirmation.ok) {
      assert.equal(staleContinuationConfirmation.reason, "stale_review");
    }
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_block_confirmations", owner.userId),
      1,
      "A stale frozen-input review must create no continuation lineage.",
    );
    assert.equal(
      await countOwnedRows(
        supabase,
        "adaptive_training_continuation_input_revisions",
        owner.userId,
      ),
      4,
      "A stale review must consume no continuation preference or check-in.",
    );
    assert.equal(
      await countOwnedRows(supabase, "planned_workouts", owner.userId),
      persistedWorkouts.data.length,
      "A stale frozen-input review must create no Calendar rows.",
    );

    if (!changedInputCandidate.ok || changedInputCandidate.state.status !== "candidate_ready") {
      throw new Error("The changed-input continuation candidate is unavailable.");
    }
    const changedCandidateRow = await getAdaptiveTrainingDetailedCandidateForUser({
      userId: owner.userId,
      candidateId: changedInputCandidate.state.candidate.id,
    });
    const changedContent = asJsonRecord(changedCandidateRow?.candidate_content);
    const changedDocuments = changedContent?.workoutDocuments;
    assert.ok(Array.isArray(changedDocuments));
    const collisionDocument = changedDocuments[0];
    assert.ok(collisionDocument && typeof collisionDocument === "object");
    const collisionWorkout = {
      ...buildPersistedWorkoutInsertRows(
        null,
        owner.userId,
        [collisionDocument as Parameters<typeof buildPersistedWorkoutInsertRows>[2][number]],
        "manual",
      )[0]!,
      id: crypto.randomUUID(),
    };
    const collisionInsert = await supabase.from("planned_workouts").insert(collisionWorkout);
    if (collisionInsert.error) throw new Error(collisionInsert.error.message);
    const collisionLog = await supabase.from("workout_logs").insert({
      user_id: owner.userId,
      planned_workout_id: collisionWorkout.id,
      outcome: "completed",
    });
    if (collisionLog.error) throw new Error(collisionLog.error.message);

    const collisionCandidate = await prepareContinuationCandidate(readinessDate);
    assert.equal(collisionCandidate.ok, true);
    assert.equal(collisionCandidate.state.status, "candidate_ready");
    assert.equal(collisionCandidate.retainedCandidate?.candidateVersion, 4);
    if (!collisionCandidate.ok || collisionCandidate.state.status !== "candidate_ready") {
      throw new Error("The protected-collision continuation candidate is unavailable.");
    }
    const collisionReview = await reviewWorkoutCommandForUser(
      owner.userId,
      {
        operation: "materialize_source_candidate",
        source: {
          kind: "adaptive_continuation_candidate",
          candidateId: collisionCandidate.state.candidate.id,
        },
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(collisionReview.ok, true, JSON.stringify(collisionReview));
    if (!collisionReview.ok) throw new Error(collisionReview.issues[0]?.message);
    assert.equal(collisionReview.candidate.collisions.length, 1);
    const protectedCollision = await confirmWorkoutCommandForUser(
      owner.userId,
      {
        command: collisionReview.candidate.command,
        candidateId: collisionReview.candidate.candidateId,
        reviewToken: collisionReview.candidate.reviewToken,
        reviewChecksum: collisionReview.candidate.reviewChecksum,
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(protectedCollision.ok, false);
    if (!protectedCollision.ok) assert.equal(protectedCollision.reason, "collision");
    assert.equal(
      await countOwnedRows(supabase, "planned_workouts", owner.userId),
      persistedWorkouts.data.length + 1,
      "A protected occupied date must receive no partial continuation writes.",
    );
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_block_confirmations", owner.userId),
      1,
    );
    assert.equal(
      await countOwnedRows(
        supabase,
        "adaptive_training_continuation_input_revisions",
        owner.userId,
      ),
      4,
      "A protected collision must consume no continuation preference or check-in.",
    );
    const removeCollision = await supabase
      .from("planned_workouts")
      .delete()
      .eq("user_id", owner.userId)
      .eq("id", collisionWorkout.id);
    if (removeCollision.error) throw new Error(removeCollision.error.message);

    const finalContinuationCandidate = await prepareContinuationCandidate(readinessDate);
    assert.equal(finalContinuationCandidate.ok, true);
    assert.equal(finalContinuationCandidate.state.status, "candidate_ready");
    assert.equal(
      finalContinuationCandidate.state.status === "candidate_ready"
        ? finalContinuationCandidate.state.candidate.version
        : null,
      3,
      "Returning to an identical frozen input must reuse its immutable candidate.",
    );
    if (
      !finalContinuationCandidate.ok ||
      finalContinuationCandidate.state.status !== "candidate_ready"
    ) {
      throw new Error("The final collision-free continuation candidate is unavailable.");
    }
    const finalContinuationReview = await reviewWorkoutCommandForUser(
      owner.userId,
      {
        operation: "materialize_source_candidate",
        source: {
          kind: "adaptive_continuation_candidate",
          candidateId: finalContinuationCandidate.state.candidate.id,
        },
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(finalContinuationReview.ok, true, JSON.stringify(finalContinuationReview));
    if (!finalContinuationReview.ok) {
      throw new Error(finalContinuationReview.issues[0]?.message);
    }
    const foreignContinuationReview = await reviewWorkoutCommandForUser(
      otherRunner.userId,
      {
        operation: "materialize_source_candidate",
        source: {
          kind: "adaptive_continuation_candidate",
          candidateId: finalContinuationCandidate.state.candidate.id,
        },
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(foreignContinuationReview.ok, false);
    const continuationConfirmation = await confirmWorkoutCommandForUser(
      owner.userId,
      {
        command: finalContinuationReview.candidate.command,
        candidateId: finalContinuationReview.candidate.candidateId,
        reviewToken: finalContinuationReview.candidate.reviewToken,
        reviewChecksum: finalContinuationReview.candidate.reviewChecksum,
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(continuationConfirmation.ok, true, JSON.stringify(continuationConfirmation));
    if (!continuationConfirmation.ok) throw new Error(continuationConfirmation.message);
    const continuationResult = asJsonRecord(continuationConfirmation.result);
    assert.equal(continuationResult?.predecessorConfirmationId, blockConfirmation.id);
    assert.equal(continuationResult?.consumedPreferenceCount, 1);
    assert.equal(
      continuationResult?.calendarRowCount,
      finalContinuationReview.candidate.command.documents.length,
    );

    const continuationConfirmations = await supabase
      .from("adaptive_training_block_confirmations")
      .select("*")
      .eq("user_id", owner.userId)
      .order("confirmed_at", { ascending: true });
    if (continuationConfirmations.error) {
      throw new Error(continuationConfirmations.error.message);
    }
    assert.equal(continuationConfirmations.data.length, 2);
    const continuationLineage = continuationConfirmations.data.find(
      (confirmation) => confirmation.predecessor_confirmation_id === blockConfirmation.id,
    );
    assert.ok(continuationLineage);
    assert.equal(continuationLineage!.block_mode, "normal_four_week");
    assert.equal(
      continuationLineage!.interval_start_date,
      addDaysIso(blockConfirmation.interval_end_date, 1),
    );
    assert.equal(
      continuationLineage!.interval_end_date,
      addDaysIso(continuationLineage!.interval_start_date, 27),
    );
    const consumedInput = await supabase
      .from("adaptive_training_continuation_input_revisions")
      .select("*")
      .eq("user_id", owner.userId)
      .order("revision", { ascending: false })
      .limit(1)
      .single();
    if (consumedInput.error) throw new Error(consumedInput.error.message);
    assert.deepEqual(consumedInput.data.active_projection_preferences, []);
    assert.equal(consumedInput.data.horizon_check_in, null);
    assert.equal(consumedInput.data.supersedes_revision, changedInputRevision.revision);

    const afterContinuationReadModel = await getAdaptiveBlueprintCalendarReadModelForUser(
      owner.userId,
      readinessDate,
    );
    assert.ok(
      afterContinuationReadModel.projections.every(
        (projection) => projection.date > continuationLineage!.interval_end_date,
      ),
      "Only Source projections after the new confirmed horizon may remain public.",
    );
    const remainingProjectionDates = new Set(
      afterContinuationReadModel.projections.map((projection) => projection.date),
    );
    const futureProjectionCalendarRows = await supabase
      .from("planned_workouts")
      .select("workout_date")
      .eq("user_id", owner.userId)
      .in("workout_date", [...remainingProjectionDates]);
    if (futureProjectionCalendarRows.error) {
      throw new Error(futureProjectionCalendarRows.error.message);
    }
    assert.equal(
      futureProjectionCalendarRows.data.length,
      0,
      "Later Source projections must remain absent from Runner Calendar.",
    );
    const confirmedCalendarCount = await countOwnedRows(supabase, "planned_workouts", owner.userId);
    assert.equal(
      confirmedCalendarCount,
      persistedWorkouts.data.length + continuationLineage!.calendar_workout_ids.length,
    );
    const duplicateContinuation = await confirmWorkoutCommandForUser(
      owner.userId,
      {
        command: finalContinuationReview.candidate.command,
        candidateId: finalContinuationReview.candidate.candidateId,
        reviewToken: finalContinuationReview.candidate.reviewToken,
        reviewChecksum: finalContinuationReview.candidate.reviewChecksum,
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(duplicateContinuation.ok, false);
    assert.equal(
      await countOwnedRows(supabase, "planned_workouts", owner.userId),
      confirmedCalendarCount,
      "A duplicate reviewed continuation must be idempotently rejected.",
    );

    const immutableContinuationCandidate = await supabase
      .from("adaptive_training_detailed_candidates")
      .update({ candidate_content: { tampered: true } })
      .eq("id", preparedCandidate.state.candidate.id);
    assert.ok(
      immutableContinuationCandidate.error,
      "A retained continuation candidate must remain immutable.",
    );

    const preparedReadModel = await getAdaptiveBlueprintCalendarReadModelForUser(
      owner.userId,
      readinessDate,
    );
    assert.ok(
      preparedReadModel.projections.every((projection) => projection.status !== "ready_for_review"),
      "A confirmed candidate must no longer remain reviewable.",
    );

    const duplicate = await confirmRunningPlanDraftForUser(owner.userId, confirmInput, {
      allowLocalQaFixture: true,
    });
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) assert.equal(duplicate.reason, "stale_review");
    assert.equal(
      await countOwnedRows(supabase, "planned_workouts", owner.userId),
      confirmedCalendarCount,
    );
    assert.equal(await countOwnedRows(supabase, "workout_logs", owner.userId), dueWorkouts.length);

    const immutableUpdate = await supabase
      .from("adaptive_training_detailed_candidates")
      .update({ candidate_content: { tampered: true } })
      .eq("user_id", owner.userId)
      .eq("id", confirmed.detailedCandidateId);
    assert.ok(immutableUpdate.error, "Detailed candidate mutation must be rejected.");
    const reloadedWorkouts = await supabase
      .from("planned_workouts")
      .select("id, source_workout_id, steps")
      .eq("user_id", owner.userId)
      .order("workout_date", { ascending: true });
    if (reloadedWorkouts.error) throw new Error(reloadedWorkouts.error.message);
    assert.equal(
      reloadedWorkouts.data.length,
      confirmedCalendarCount,
      "Initial and continuation Calendar rows must reload after confirmation.",
    );
    const confirmedReloadSnapshot = reloadedWorkouts.data;
    const confirmedEventCount = await countOwnedRows(
      supabase,
      "calendar_workout_mutation_events",
      owner.userId,
    );

    const continuationResponseLineage = await supabase
      .from("adaptive_training_detailed_candidates")
      .select("source_response_id, input_provenance, confirmation_lineage")
      .eq("user_id", owner.userId);
    if (continuationResponseLineage.error) {
      throw new Error(continuationResponseLineage.error.message);
    }
    const providerAuthoredCandidates = continuationResponseLineage.data.filter(
      (candidate) =>
        asJsonRecord(candidate.confirmation_lineage)?.kind ===
        "continuation_detailed_block_candidate",
    );
    assert.equal(providerAuthoredCandidates.length, 3);
    const continuationResponseIds = providerAuthoredCandidates.map((candidate) => {
      assert.ok(candidate.source_response_id);
      assert.equal(
        asJsonRecord(candidate.input_provenance)?.retainedResponseId,
        candidate.source_response_id,
      );
      return candidate.source_response_id!;
    });
    assert.equal(new Set(continuationResponseIds).size, continuationResponseIds.length);
    const ownerContinuationResponses = await ownerClient
      .from("ai_plan_generation_responses")
      .select("id, schema_outcome, compiler_outcome")
      .in("id", continuationResponseIds);
    if (ownerContinuationResponses.error) {
      throw new Error(ownerContinuationResponses.error.message);
    }
    assert.equal(ownerContinuationResponses.data.length, continuationResponseIds.length);
    assert.ok(
      ownerContinuationResponses.data.every(
        (response) =>
          response.schema_outcome === "accepted" && response.compiler_outcome === "accepted",
      ),
    );
    const foreignContinuationResponses = await otherClient
      .from("ai_plan_generation_responses")
      .select("id")
      .in("id", continuationResponseIds);
    if (foreignContinuationResponses.error) {
      throw new Error(foreignContinuationResponses.error.message);
    }
    assert.equal(foreignContinuationResponses.data.length, 0);

    const sourceResponse = await supabase
      .from("adaptive_training_blueprint_versions")
      .select("source_response_id")
      .eq("user_id", owner.userId)
      .eq("id", confirmed.blueprintId)
      .single();
    if (sourceResponse.error) throw new Error(sourceResponse.error.message);
    const sourceRemoval = await supabase
      .from("ai_plan_generation_responses")
      .delete()
      .eq("user_id", owner.userId)
      .eq("id", sourceResponse.data.source_response_id);
    if (sourceRemoval.error) throw new Error(sourceRemoval.error.message);
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_blueprint_versions", owner.userId),
      0,
    );
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_detailed_candidates", owner.userId),
      0,
    );
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_block_confirmations", owner.userId),
      0,
    );
    assert.equal(
      await countOwnedRows(
        supabase,
        "adaptive_training_continuation_input_revisions",
        owner.userId,
      ),
      0,
    );
    const removedSourceConfirmation = await confirmRunningPlanDraftForUser(
      owner.userId,
      confirmInput,
      { allowLocalQaFixture: true },
    );
    assert.equal(removedSourceConfirmation.ok, false);
    if (!removedSourceConfirmation.ok) {
      assert.equal(removedSourceConfirmation.reason, "stale_review");
    }
    assert.equal(
      await countOwnedRows(supabase, "planned_workouts", owner.userId),
      confirmedCalendarCount,
      "Removing disposable source intent must not mutate confirmed Calendar rows.",
    );
    const afterSourceRemovalWorkouts = await supabase
      .from("planned_workouts")
      .select("id, source_workout_id, steps")
      .eq("user_id", owner.userId)
      .order("workout_date", { ascending: true });
    if (afterSourceRemovalWorkouts.error) {
      throw new Error(afterSourceRemovalWorkouts.error.message);
    }
    assert.deepEqual(
      afterSourceRemovalWorkouts.data,
      confirmedReloadSnapshot,
      "Removing immutable Source lineage must not alter confirmed Calendar documents.",
    );
    assert.equal(
      await countOwnedRows(supabase, "calendar_workout_mutation_events", owner.userId),
      confirmedEventCount,
      "Removing disposable source intent must not erase confirmation lineage.",
    );

    return {
      mode: preflight.mode,
      target: preflight.target,
      initialDetailedBlock: {
        blueprintId: confirmed.blueprintId,
        detailedCandidateId: confirmed.detailedCandidateId,
        blockConfirmationId: blockConfirmation.id,
        calendarRows: confirmedCalendarCount,
        futureProjectionRows: 0,
        standaloneRows: true,
        ownershipRejected: !foreignConfirmation.ok,
        invalidReviewRejected: !invalidReview.ok,
        protectedCollisionRejected: !duplicate.ok,
        removedSourceRejected: !removedSourceConfirmation.ok,
        sourceImmutable: true,
        immutableBlockConfirmation: true,
        continuationInputRevisions: 5,
        continuationCandidateVersions: 4,
        projectionReadbackStable: true,
        continuationPackets: true,
        continuationConfirmation: true,
        continuationCollisionAtomic: !protectedCollision.ok,
        continuationStaleReviewRejected: !staleContinuationConfirmation.ok,
        continuationDuplicateRejected: !duplicateContinuation.ok,
        continuationOwnershipRejected: !foreignContinuationReview.ok,
        consumedPreferenceCount: continuationResult?.consumedPreferenceCount,
      },
    };
  } finally {
    if (priorFixtureFlag === undefined)
      delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
    else process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = priorFixtureFlag;
    if (priorProviderMode === undefined)
      delete process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV];
    else process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = priorProviderMode;
    if (priorFixtureScenario === undefined)
      delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
    else process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV] = priorFixtureScenario;

    for (const userId of [owner.userId, otherRunner.userId]) {
      const sourceCleanup = await supabase
        .from("ai_plan_generation_responses")
        .delete()
        .eq("user_id", userId);
      if (sourceCleanup.error) throw new Error(sourceCleanup.error.message);
    }
    ownerCleanup = await cleanupDisposableUser(supabase, owner);
    otherCleanup = await cleanupDisposableUser(supabase, otherRunner);
    assert.ok(ownerCleanup && otherCleanup);
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_blueprint_versions", owner.userId),
      0,
    );
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_detailed_candidates", owner.userId),
      0,
    );
    assert.equal(
      await countOwnedRows(supabase, "adaptive_training_block_confirmations", owner.userId),
      0,
    );
    assert.equal(
      await countOwnedRows(
        supabase,
        "adaptive_training_continuation_input_revisions",
        owner.userId,
      ),
      0,
    );
  }
}

async function countOwnedRows(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  table: keyof Database["public"]["Tables"],
  userId: string,
) {
  const result = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
}

async function validateSavedPlanLibraryPersistence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  preflight: Extract<PersistencePreflight, { shouldRun: true }>;
  reviewedDrafts: [
    RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
    RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
  ];
}) {
  const owner = await acquireQaPoolSupabaseUser({
    supabase: input.supabase,
    poolRole: "provider-engine",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Saved-plan library owner creation failed.",
  });
  let otherRunner: QaPoolUserLease | null = null;

  try {
    otherRunner = await acquireQaPoolSupabaseUser({
      supabase: input.supabase,
      poolRole: "isolation-a",
      password: DISPOSABLE_TEST_PASSWORD,
      creationErrorMessage: "Saved-plan library RLS runner creation failed.",
    });
    await persistReviewedDraftProfileSnapshot(owner.userId, input.reviewedDrafts[0]);

    const savedRecords = [];
    for (const draft of input.reviewedDrafts) {
      savedRecords.push(
        await retainReviewedPlanCandidateForUser({
          userId: owner.userId,
          canonicalPlan: draft.canonicalPlan,
          reviewChecksum: draft.reviewChecksum,
          planMetadata: buildRunningPlanPersistenceMetadata({
            draft,
            canonicalPlan: draft.canonicalPlan,
            reviewChecksum: draft.reviewChecksum,
          }),
        }),
      );
    }

    assert.notEqual(savedRecords[0]!.id, savedRecords[1]!.id);
    const unappliedWorkoutCount = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId);
    assert.equal(unappliedWorkoutCount.error, null);
    assert.equal(unappliedWorkoutCount.count, 0);

    const availableByCreated = await listSavedPlanLibraryForUser(owner.userId);
    assert.equal(availableByCreated.length, 2);
    assert.ok(
      availableByCreated[0]!.createdAt >= availableByCreated[1]!.createdAt,
      "Default saved-plan ordering must be newest first.",
    );
    const byTitle = await listSavedPlanLibraryForUser(owner.userId, {
      recordState: "all",
      sort: "title",
      direction: "asc",
    });
    assert.deepEqual(
      byTitle.map((record) => record.title),
      byTitle
        .map((record) => record.title)
        .slice()
        .sort((a, b) => a.localeCompare(b)),
    );
    const searched = await listSavedPlanLibraryForUser(owner.userId, {
      search: savedRecords[0]!.goal_summary,
      recordState: "all",
    });
    assert.ok(searched.some((record) => record.id === savedRecords[0]!.id));
    assert.equal(
      (
        await listSavedPlanLibraryForUser(owner.userId, {
          recordState: "all",
          sourceKind: "not_a_saved_plan_source",
        })
      ).length,
      0,
    );

    const exported = await exportSavedPlanForUser(owner.userId, savedRecords[0]!.id, "json");
    const exportedPlan = JSON.parse(exported.body) as {
      plan_name: string;
      planned_workouts: unknown[];
    };
    assert.equal(exportedPlan.plan_name, savedRecords[0]!.title);
    assert.equal(
      exportedPlan.planned_workouts.length,
      input.reviewedDrafts[0].canonicalPlan.planned_workouts.length,
    );
    await assert.rejects(
      exportSavedPlanForUser(otherRunner.userId, savedRecords[0]!.id, "json"),
      /selected saved plan was not found/i,
    );

    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    assert.ok(publishableKey, "Saved-plan library RLS proof requires a publishable key.");
    const ownerClient = createClient<Database>(input.preflight.target.url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const otherClient = createClient<Database>(input.preflight.target.url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    assert.equal(
      (
        await ownerClient.auth.signInWithPassword({
          email: owner.email,
          password: DISPOSABLE_TEST_PASSWORD,
        })
      ).error,
      null,
    );
    assert.equal(
      (
        await otherClient.auth.signInWithPassword({
          email: otherRunner.email,
          password: DISPOSABLE_TEST_PASSWORD,
        })
      ).error,
      null,
    );
    const ownerLibraryRows = await ownerClient
      .from("plan_cycles")
      .select("id")
      .not("saved_plan_payload", "is", null);
    assert.equal(ownerLibraryRows.error, null);
    assert.equal(ownerLibraryRows.data.length, 2);
    const foreignLibraryRows = await otherClient
      .from("plan_cycles")
      .select("id")
      .in(
        "id",
        savedRecords.map((record) => record.id),
      );
    assert.equal(foreignLibraryRows.error, null);
    assert.equal(foreignLibraryRows.data.length, 0);
    const directSavedPlanInsert = {
      id: crypto.randomUUID(),
      user_id: owner.userId,
      status: "archived" as const,
      title: savedRecords[0]!.title,
      goal_summary: savedRecords[0]!.goal_summary,
      source_template: savedRecords[0]!.source_template,
      schema_version: savedRecords[0]!.schema_version,
      source_kind: savedRecords[0]!.source_kind,
      start_date: savedRecords[0]!.start_date,
      end_date: savedRecords[0]!.end_date,
      target_date: savedRecords[0]!.target_date,
      goal_metadata: savedRecords[0]!.goal_metadata,
      plan_preferences: savedRecords[0]!.plan_preferences,
      saved_plan_payload: savedRecords[0]!.saved_plan_payload,
      saved_plan_review_checksum: "1".repeat(64),
      library_removed_at: null,
    };
    const directAuthenticatedSavedInsert = await ownerClient
      .from("plan_cycles")
      .insert(directSavedPlanInsert);
    assert.notEqual(directAuthenticatedSavedInsert.error, null);
    const activeSavedInsert = await input.supabase.from("plan_cycles").insert({
      ...directSavedPlanInsert,
      id: crypto.randomUUID(),
      status: "active",
      saved_plan_review_checksum: "2".repeat(64),
    });
    assert.notEqual(activeSavedInsert.error, null);

    const validStartIntent = savedPlanStartInputSchema.safeParse({
      savedPlanId: savedRecords[0]!.id,
      intent: "replace_future_workouts",
      requestedStartDate: "2026-08-13",
      fixedRestDays: ["Monday", "Wednesday"],
      preferredLongRunDay: "Sunday",
    });
    assert.equal(validStartIntent.success, true);
    assert.equal(
      savedPlanStartInputSchema.safeParse({
        savedPlanId: savedRecords[0]!.id,
        intent: "replace_future_workouts",
        requestedStartDate: "2026-02-30",
      }).success,
      false,
    );
    assert.equal(
      savedPlanStartInputSchema.safeParse({
        savedPlanId: savedRecords[0]!.id,
        intent: "replace_future_workouts",
        fixedRestDays: ["Monday", "Monday"],
      }).success,
      false,
    );
    assert.equal(
      savedPlanStartInputSchema.safeParse({
        savedPlanId: savedRecords[0]!.id,
        intent: "replace_future_workouts",
        fixedRestDays: ["Sunday"],
        preferredLongRunDay: "Sunday",
      }).success,
      false,
    );

    const fiveDayPlan = buildFiveDaySavedPlanFixture(input.reviewedDrafts[0].canonicalPlan);
    assert.deepEqual([...countTrainingPlanNonRestByWeek(fiveDayPlan).values()], Array(8).fill(5));
    const fiveDayAligned = prepareSavedPlanFutureApplyPolicy(
      fiveDayPlan,
      "2026-06-08",
      {
        blocked_days: ["Wednesday", "Saturday"],
        preferred_long_run_day: "Sunday",
        max_running_days_per_week: 5,
      },
      {
        fixedRestDays: ["Monday", "Wednesday"],
        preferredLongRunDay: "Sunday",
      },
    );
    assert.equal(fiveDayAligned.resolvedStartDate, "2026-06-09");
    const alignedFiveDayCounts = countImportedSeedNonRestByWeek(fiveDayAligned.importedSeed);
    assert.equal(alignedFiveDayCounts.values().next().value, 4);
    assert.deepEqual([...alignedFiveDayCounts.values()].slice(1), Array(7).fill(5));
    assert.equal(
      fiveDayAligned.importedSeed.workouts.some(
        (workout) =>
          workout.workoutType !== "rest" &&
          ["Monday", "Wednesday"].includes(weekdayLong(workout.workoutDate)),
      ),
      false,
    );
    assert.equal(
      fiveDayAligned.importedSeed.workouts.every(
        (workout) =>
          workout.workoutType !== "long_run" || weekdayLong(workout.workoutDate) === "Sunday",
      ),
      true,
    );
    const fiveDaySourceOrder = fiveDayPlan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.workout_id);
    const fiveDayProjectedOrder = fiveDayAligned.importedSeed.workouts
      .filter((workout) => workout.workoutType !== "rest")
      .map((workout) => workout.sourceWorkoutId);
    assert.deepEqual(
      fiveDayProjectedOrder,
      fiveDaySourceOrder.slice(fiveDaySourceOrder.indexOf(fiveDayProjectedOrder[0]!)),
    );
    const explicitStartAlignment = prepareSavedPlanFutureApplyPolicy(
      fiveDayPlan,
      "2026-06-08",
      {
        blocked_days: ["Wednesday", "Saturday"],
        preferred_long_run_day: "Sunday",
        max_running_days_per_week: 5,
      },
      {
        requestedStartDate: "2026-06-11",
        fixedRestDays: ["Monday", "Wednesday"],
        preferredLongRunDay: "Sunday",
      },
    );
    assert.equal(explicitStartAlignment.resolvedStartDate, "2026-06-11");
    assert.ok(explicitStartAlignment.omittedLeadingDayCount > 0);
    assert.ok(
      explicitStartAlignment.importedSeed.workouts.every(
        (workout) => workout.workoutDate >= "2026-06-11",
      ),
    );
    assert.throws(
      () =>
        prepareSavedPlanFutureApplyPolicy(fiveDayPlan, "2026-06-08", {
          blocked_days: ["Wednesday", "Saturday"],
          preferred_long_run_day: "Sunday",
          max_running_days_per_week: 4,
        }),
      /more than 4 running days/i,
    );
    assert.throws(
      () =>
        prepareSavedPlanFutureApplyPolicy(
          fiveDayPlan,
          "2026-06-08",
          {
            blocked_days: ["Wednesday", "Saturday"],
            preferred_long_run_day: "Sunday",
            max_running_days_per_week: 5,
          },
          {
            fixedRestDays: ["Monday", "Tuesday", "Wednesday"],
            preferredLongRunDay: "Sunday",
          },
        ),
      /only 4 compatible weekdays/i,
    );

    const deterministicLeadingOmission = prepareSavedPlanFutureApplyPolicy(
      input.reviewedDrafts[0].canonicalPlan,
      "2026-08-12",
      null,
    );
    assert.ok(deterministicLeadingOmission.omittedLeadingDayCount > 0);
    assert.equal(deterministicLeadingOmission.resolvedStartDate, "2026-08-13");
    assert.ok(deterministicLeadingOmission.appliedStartDate >= "2026-08-12");
    const deterministicProjectedWorkouts =
      deterministicLeadingOmission.importedSeed.workouts.filter(
        (workout) => workout.workoutType !== "rest",
      );
    const deterministicSourceOrder = input.reviewedDrafts[0].canonicalPlan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.workout_id);
    assert.deepEqual(
      deterministicProjectedWorkouts.map((workout) => workout.sourceWorkoutId),
      deterministicSourceOrder.slice(
        deterministicSourceOrder.indexOf(deterministicProjectedWorkouts[0]!.sourceWorkoutId),
      ),
    );
    assert.equal(
      deterministicProjectedWorkouts.some((workout) =>
        ["Wednesday", "Saturday"].includes(weekdayLong(workout.workoutDate)),
      ),
      false,
    );
    assert.equal(
      deterministicProjectedWorkouts.every(
        (workout) =>
          workout.workoutType !== "long_run" || weekdayLong(workout.workoutDate) === "Sunday",
      ),
      true,
    );

    const firstRecordBeforeApply = await getSavedPlanRecordForUser(
      owner.userId,
      savedRecords[0]!.id,
    );
    const profilePreferencesBeforeApply = await input.supabase
      .from("runner_profiles")
      .select("training_preferences")
      .eq("user_id", owner.userId)
      .single();
    assert.equal(profilePreferencesBeforeApply.error, null);
    const runnerCurrentDate = await getRunnerCalendarDateForUserId(owner.userId);
    const requestedStartDate = nextDateForWeekday(runnerCurrentDate, "Tuesday");
    const calendarBeforeImpossibleStart = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId);
    assert.equal(calendarBeforeImpossibleStart.error, null);
    await assert.rejects(
      applySavedPlanRecordForUser(owner.userId, savedRecords[0]!.id, "apply_if_future_empty", {
        fixedRestDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        preferredLongRunDay: "Sunday",
      }),
      /Leave at least one weekday available for running/i,
    );
    const calendarAfterImpossibleStart = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId);
    assert.deepEqual(calendarAfterImpossibleStart, calendarBeforeImpossibleStart);
    const emptyFutureApply = await applySavedPlanRecordForUser(
      owner.userId,
      savedRecords[0]!.id,
      "apply_if_future_empty",
      {
        requestedStartDate,
        fixedRestDays: ["Monday", "Wednesday"],
        preferredLongRunDay: "Sunday",
      },
    );
    assert.equal(emptyFutureApply.ok, true);
    if (!emptyFutureApply.ok) {
      throw new Error("Empty-future saved-plan apply unexpectedly required replacement.");
    }
    assert.equal(emptyFutureApply.callsOpenAi, false);
    assert.equal(emptyFutureApply.resolvedStartDate, requestedStartDate);
    const profilePreferencesAfterApply = await input.supabase
      .from("runner_profiles")
      .select("training_preferences")
      .eq("user_id", owner.userId)
      .single();
    assert.deepEqual(profilePreferencesAfterApply, profilePreferencesBeforeApply);
    const activeAfterEmptyApply = await input.supabase
      .from("plan_cycles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId)
      .eq("status", "active");
    assert.equal(activeAfterEmptyApply.error, null);
    assert.equal(activeAfterEmptyApply.count, 0);
    const emptyApplyRows = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId)
      .eq("plan_cycle_id", emptyFutureApply.materializedPlanId);
    assert.equal(emptyApplyRows.error, null);
    assert.equal(emptyApplyRows.count, emptyFutureApply.calendarRowCount);
    const alignedCalendarRows = await input.supabase
      .from("planned_workouts")
      .select("workout_date, workout_type, source_workout_id")
      .eq("user_id", owner.userId)
      .eq("plan_cycle_id", emptyFutureApply.materializedPlanId)
      .order("workout_date")
      .order("display_order");
    assert.equal(alignedCalendarRows.error, null);
    assert.equal(
      alignedCalendarRows.data.some(
        (workout) =>
          workout.workout_type !== "rest" &&
          ["Monday", "Wednesday"].includes(weekdayLong(workout.workout_date)),
      ),
      false,
    );
    assert.equal(
      alignedCalendarRows.data.every(
        (workout) =>
          workout.workout_type !== "long_run" || weekdayLong(workout.workout_date) === "Sunday",
      ),
      true,
    );
    const directAuthenticatedConversion = await ownerClient
      .from("plan_cycles")
      .update({
        saved_plan_payload: savedRecords[0]!.saved_plan_payload,
        saved_plan_review_checksum: "3".repeat(64),
      })
      .eq("id", emptyFutureApply.materializedPlanId);
    assert.notEqual(directAuthenticatedConversion.error, null);
    const serviceRoleConversion = await input.supabase
      .from("plan_cycles")
      .update({
        saved_plan_payload: savedRecords[0]!.saved_plan_payload,
        saved_plan_review_checksum: "4".repeat(64),
      })
      .eq("id", emptyFutureApply.materializedPlanId);
    assert.notEqual(serviceRoleConversion.error, null);
    assert.deepEqual(
      await getSavedPlanRecordForUser(owner.userId, savedRecords[0]!.id),
      firstRecordBeforeApply,
    );

    const futureBeforeRemoval = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", emptyFutureApply.currentDate)
      .order("id");
    assert.equal(futureBeforeRemoval.error, null);
    const removed = await logicallyRemoveSavedPlanRecordForUser(owner.userId, savedRecords[0]!.id);
    assert.equal(removed.recordState, "removed");
    const futureAfterRemoval = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", emptyFutureApply.currentDate)
      .order("id");
    assert.deepEqual(futureAfterRemoval.data, futureBeforeRemoval.data);
    assert.equal((await listSavedPlanLibraryForUser(owner.userId)).length, 1);
    assert.equal(
      (
        await listSavedPlanLibraryForUser(owner.userId, {
          recordState: "removed",
        })
      )[0]?.id,
      savedRecords[0]!.id,
    );
    const immutableTitleAttempt = await ownerClient
      .from("plan_cycles")
      .update({ title: "Mutated saved plan" })
      .eq("id", savedRecords[0]!.id);
    assert.notEqual(immutableTitleAttempt.error, null);
    const immutableIdAttempt = await input.supabase
      .from("plan_cycles")
      .update({ id: crypto.randomUUID() })
      .eq("id", savedRecords[0]!.id);
    assert.notEqual(immutableIdAttempt.error, null);

    const materializedWorkout = await input.supabase
      .from("planned_workouts")
      .select("*")
      .eq("user_id", owner.userId)
      .eq("plan_cycle_id", emptyFutureApply.materializedPlanId)
      .order("workout_date")
      .limit(1)
      .single();
    assert.equal(materializedWorkout.error, null);
    assert.ok(materializedWorkout.data);
    const protectedWorkoutId = crypto.randomUUID();
    const protectedLogId = crypto.randomUUID();
    const protectedAssetId = crypto.randomUUID();
    const protectedDate = addDaysIso(emptyFutureApply.currentDate, -1);
    const protectedInsert = await input.supabase.from("planned_workouts").insert({
      ...materializedWorkout.data!,
      id: protectedWorkoutId,
      workout_date: protectedDate,
      weekday: weekdayLong(protectedDate),
      source_workout_id: `protected-${protectedWorkoutId}`,
      display_order: materializedWorkout.data!.display_order + 10_000,
      created_at: new Date().toISOString(),
    });
    assert.equal(protectedInsert.error, null);
    const protectedLog = await input.supabase.from("workout_logs").insert({
      id: protectedLogId,
      user_id: owner.userId,
      planned_workout_id: protectedWorkoutId,
      outcome: "completed",
      notes: "Protected saved-plan apply proof",
    });
    assert.equal(protectedLog.error, null);
    const protectedAsset = await input.supabase.from("workout_result_assets").insert({
      id: protectedAssetId,
      user_id: owner.userId,
      planned_workout_id: protectedWorkoutId,
      workout_log_id: protectedLogId,
      asset_kind: "garmin_fit",
      storage_bucket: "workout-result-assets",
      storage_path: `local-proof/${protectedAssetId}.fit`,
      original_file_name: "protected.fit",
      mime_type: "application/octet-stream",
      file_size_bytes: 128,
      parse_status: "parsed",
      primary_file_kind: "fit",
      primary_file_name: "protected.fit",
    });
    assert.equal(protectedAsset.error, null);

    const futureIdsBeforeDecline = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", emptyFutureApply.currentDate)
      .order("id");
    const declined = await applySavedPlanRecordForUser(
      owner.userId,
      savedRecords[1]!.id,
      "keep_future_workouts",
    );
    assert.equal(declined.ok, false);
    assert.equal(declined.status, "not_applied");
    const replacementRequired = await applySavedPlanRecordForUser(
      owner.userId,
      savedRecords[1]!.id,
      "apply_if_future_empty",
    );
    assert.equal(replacementRequired.ok, false);
    assert.equal(replacementRequired.status, "replacement_required");
    const futureIdsAfterDecline = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", emptyFutureApply.currentDate)
      .order("id");
    assert.deepEqual(futureIdsAfterDecline.data, futureIdsBeforeDecline.data);

    const secondRecordBeforeApply = await getSavedPlanRecordForUser(
      owner.userId,
      savedRecords[1]!.id,
    );
    const replaced = await applySavedPlanRecordForUser(
      owner.userId,
      savedRecords[1]!.id,
      "replace_future_workouts",
    );
    assert.equal(replaced.ok, true);
    if (!replaced.ok) {
      throw new Error("Explicit future replacement did not apply the selected saved plan.");
    }
    assert.ok(replaced.replacedFutureWorkoutCount > 0);
    const activeAfterReplacement = await input.supabase
      .from("plan_cycles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId)
      .eq("status", "active");
    assert.equal(activeAfterReplacement.error, null);
    assert.equal(activeAfterReplacement.count, 0);
    const replacementRows = await input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", owner.userId)
      .eq("plan_cycle_id", replaced.materializedPlanId);
    assert.equal(replacementRows.error, null);
    assert.equal(replacementRows.count, replaced.calendarRowCount);
    assert.deepEqual(
      await getSavedPlanRecordForUser(owner.userId, savedRecords[1]!.id),
      secondRecordBeforeApply,
    );
    const [protectedWorkoutAfter, protectedLogAfter, protectedAssetAfter] = await Promise.all([
      input.supabase.from("planned_workouts").select("*").eq("id", protectedWorkoutId).single(),
      input.supabase.from("workout_logs").select("*").eq("id", protectedLogId).single(),
      input.supabase.from("workout_result_assets").select("*").eq("id", protectedAssetId).single(),
    ]);
    assert.equal(protectedWorkoutAfter.error, null);
    assert.equal(protectedLogAfter.error, null);
    assert.equal(protectedAssetAfter.error, null);
    assert.equal(protectedLogAfter.data.planned_workout_id, protectedWorkoutId);
    assert.equal(protectedAssetAfter.data.planned_workout_id, protectedWorkoutId);
    assert.equal(protectedAssetAfter.data.workout_log_id, protectedLogId);

    const futureProtectedWorkout = await input.supabase
      .from("planned_workouts")
      .select("id")
      .eq("user_id", owner.userId)
      .gte("workout_date", replaced.currentDate)
      .order("workout_date")
      .limit(1)
      .single();
    assert.equal(futureProtectedWorkout.error, null);
    assert.ok(futureProtectedWorkout.data);
    const futureProtectedLogId = crypto.randomUUID();
    const futureProtectedLog = await input.supabase.from("workout_logs").insert({
      id: futureProtectedLogId,
      user_id: owner.userId,
      planned_workout_id: futureProtectedWorkout.data!.id,
      outcome: "completed",
      notes: "Protected future saved-plan apply proof",
    });
    assert.equal(futureProtectedLog.error, null);
    const protectedFutureBefore = await Promise.all([
      input.supabase
        .from("planned_workouts")
        .select("id, plan_cycle_id, workout_date")
        .eq("user_id", owner.userId)
        .order("id"),
      input.supabase
        .from("workout_logs")
        .select("id, planned_workout_id")
        .eq("user_id", owner.userId)
        .order("id"),
    ]);
    await assert.rejects(
      applySavedPlanRecordForUser(owner.userId, savedRecords[1]!.id, "replace_future_workouts"),
      (error: unknown) =>
        error instanceof CalendarPersistenceRejection &&
        error.reason === "protected_future_schedule",
    );
    const protectedFutureAfter = await Promise.all([
      input.supabase
        .from("planned_workouts")
        .select("id, plan_cycle_id, workout_date")
        .eq("user_id", owner.userId)
        .order("id"),
      input.supabase
        .from("workout_logs")
        .select("id, planned_workout_id")
        .eq("user_id", owner.userId)
        .order("id"),
    ]);
    assert.deepEqual(protectedFutureAfter, protectedFutureBefore);

    return {
      retainedBeforeApply: 2,
      unappliedCalendarRows: unappliedWorkoutCount.count,
      logicalRemovalPreservedCalendar: true,
      selectedExportIsolated: true,
      rlsIsolation: true,
      directSavedRecordWritesRejected: true,
      savedRecordIdentityImmutable: true,
      startInputStrictlyValidated: true,
      fiveDayWeeklyCountPreserved: true,
      oneTimeSchedulePreferencesPersistedToSettings: false,
      scheduleAlignedRestAndLongRunDays: true,
      impossibleScheduleWasNoOp: true,
      emptyFutureApplied: true,
      declineWasNoOp: true,
      explicitFutureReplacement: true,
      materializedProvenanceNonActive: true,
      protectedFutureReplacementRejected: true,
      leadingDaysOmitted: deterministicLeadingOmission.omittedLeadingDayCount,
      protectedHistoryPreserved: true,
      callsOpenAi: false,
    };
  } finally {
    if (otherRunner) {
      await cleanupDisposableUser(input.supabase, otherRunner);
    }
    await cleanupDisposableUser(input.supabase, owner);
  }
}

function buildFiveDaySavedPlanFixture(canonicalPlan: TrainingPlanV2): TrainingPlanV2 {
  const plan = structuredClone(canonicalPlan);
  const workoutsByWeek = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of plan.planned_workouts) {
    const workouts = workoutsByWeek.get(workout.week_number) ?? [];
    workouts.push(workout);
    workoutsByWeek.set(workout.week_number, workouts);
  }

  for (const [weekNumber, workouts] of workoutsByWeek) {
    const currentCount = workouts.filter((workout) => workout.workout_type !== "rest").length;
    assert.equal(
      currentCount,
      4,
      `Five-day proof fixture expected four source runs in week ${weekNumber}.`,
    );
    const sourceWorkout =
      workouts.find((workout) => workout.workout_type === "easy") ??
      workouts.find((workout) => workout.workout_type !== "rest");
    const restWorkout = workouts.find(
      (workout) => workout.workout_type === "rest" && workout.weekday !== "Sunday",
    );

    assert.ok(sourceWorkout, `Five-day proof fixture needs a source run in week ${weekNumber}.`);
    assert.ok(
      restWorkout,
      `Five-day proof fixture needs a replaceable rest in week ${weekNumber}.`,
    );
    const { date, weekday, week_number: retainedWeekNumber } = restWorkout;
    Object.assign(restWorkout, structuredClone(sourceWorkout), {
      workout_id: `${sourceWorkout.workout_id}-fifth-${weekNumber}`,
      date,
      weekday,
      week_number: retainedWeekNumber,
      title: "Fifth Easy Run",
    });
  }

  return plan;
}

function countTrainingPlanNonRestByWeek(plan: TrainingPlanV2) {
  const countByWeek = new Map<string, number>();
  for (const workout of plan.planned_workouts) {
    if (workout.workout_type === "rest") {
      continue;
    }

    const week = startOfWeekIso(workout.date);
    countByWeek.set(week, (countByWeek.get(week) ?? 0) + 1);
  }
  return countByWeek;
}

function countImportedSeedNonRestByWeek(seed: ReturnType<typeof buildImportedPlanSeed>) {
  const countByWeek = new Map<string, number>();
  for (const workout of seed.workouts) {
    if (workout.workoutType === "rest") {
      continue;
    }

    const week = startOfWeekIso(workout.workoutDate);
    countByWeek.set(week, (countByWeek.get(week) ?? 0) + 1);
  }
  return countByWeek;
}

function nextDateForWeekday(currentDate: string, expectedWeekday: string) {
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDaysIso(currentDate, offset);
    if (weekdayLong(candidate) === expectedWeekday) {
      return candidate;
    }
  }

  throw new Error(`Could not resolve the next ${expectedWeekday} from ${currentDate}.`);
}

async function validateQaFixtureRuntimePersistence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  preflight: Extract<PersistencePreflight, { shouldRun: true }>;
  previewInput: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>["previewInput"];
  buildConfirmInputForConfirm: BuildConfirmInputForConfirm;
}) {
  const disposableUser = await acquireQaPoolSupabaseUser({
    supabase: input.supabase,
    poolRole: "provider-engine",
    creationErrorMessage: "Disposable QA fixture user creation failed.",
  });
  const envKeys = [
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
    AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
    "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
    "LOCAL_AUTH_BYPASS_ENABLED",
    "NEXT_PUBLIC_SUPABASE_URL",
  ] as const;
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  let proof: {
    providerCalls: number;
    savedSourceRows: number;
    materializedCalendarRows: number;
    omittedLeadingRows: number;
    runnerCurrentDate: string;
    sourceKind: string;
    responseId: string;
    reviewChecksum: string;
    persistedResponseId: string;
    transientContextAbsent: true;
  } | null = null;
  let cleanup: DisposableCleanupProof | null = null;
  let providerCalls = 0;
  const transientContextCanary = `private-plan-context-${crypto.randomUUID()}`;

  try {
    process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = "true";
    process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV] = "non_repeat_tempo";
    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "qa_fixture";
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE;
    process.env.LOCAL_AUTH_BYPASS_ENABLED = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = input.preflight.target.url;

    const firstTimeReadback = buildFirstTimeRunnerBaselineReadback({
      age: input.previewInput.age,
      weightKg: input.previewInput.weightKg,
      heightCm: input.previewInput.heightCm,
      fitnessLevel: "running_regularly",
    });
    await updateUserSettingsForUserId(
      disposableUser.userId,
      {
        firstName: "QA",
        lastName: "Fixture",
        displayName: "QA Fixture",
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
      disposableUser.email,
    );

    const reviewed = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      disposableUser.userId,
      {
        ...input.previewInput,
        runnerComment: transientContextCanary,
      },
      {
        qaFixtureAuthorized: true,
        aiPreview: {
          apiKey: "must-not-reach-provider",
          model: "must-not-reach-provider",
          fetchImpl: async () => {
            providerCalls += 1;
            throw new Error("QA fixture runtime reached the provider transport.");
          },
          generationLedger: { disabled: true },
        },
      },
    );
    assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
    if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
    assert.equal(reviewed.draft.callsOpenAi, false);
    assert.equal(reviewed.draft.aiGeneration.generationTrace?.provider.kind, "local_dev_fixture");
    assert.equal(
      reviewed.draft.aiGeneration.responseId,
      AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
    );
    assert.equal(JSON.stringify(reviewed.draft).includes(transientContextCanary), false);

    const confirmed = await confirmRunningPlanDraftForUser(
      disposableUser.userId,
      input.buildConfirmInputForConfirm(reviewed.draft),
      { allowLocalQaFixture: true },
    );
    assert.equal(confirmed.ok, true, JSON.stringify(confirmed));
    if (!confirmed.ok) throw new Error(confirmed.message);
    assert.equal(providerCalls, 0);

    const expectedMaterialization = await prepareExpectedSavedPlanMaterialization({
      supabase: input.supabase,
      userId: disposableUser.userId,
      savedPlanId: confirmed.savedPlanId,
    });
    const persisted = await loadPersistedPlanForUser(
      input.supabase,
      disposableUser.userId,
      confirmed.savedPlanId,
    );
    assert.equal(
      expectedMaterialization.savedPlan.planned_workouts.length,
      reviewed.draft.canonicalRowCount,
    );
    assert.equal(
      persisted.workouts.length,
      expectedMaterialization.prepared.importedSeed.workouts.length,
    );
    assert.equal(confirmed.calendarRowCount, persisted.workouts.length);
    assert.equal(persisted.plan.source_kind, reviewed.draft.sourceKind);
    const persistedJson = JSON.stringify(persisted);
    assert.equal(persistedJson.includes(transientContextCanary), false);
    assert.doesNotMatch(persistedJson, /"runnerComment"|"requestContext"|"plan_request_comment"/);
    validateAiAuthoredPrimaryExecutionGuidance(persisted.workouts);
    validateNoClientRowsTrusted(persisted.workouts);
    const persistedEngineMetadata = (
      persisted.plan.goal_metadata as {
        selected_plan_engine?: {
          review_checksum?: string;
          ai_generation?: {
            response_id?: string;
          };
        };
      }
    ).selected_plan_engine;
    assert.equal(persistedEngineMetadata?.review_checksum, reviewed.draft.reviewChecksum);
    assert.equal(
      persistedEngineMetadata?.ai_generation?.response_id,
      AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
    );
    const exportPayload = buildActivePlanExportPayload({
      planCycle: persisted.plan,
      workouts: persisted.workouts,
      exportedAt: "2026-07-26T12:00:00.000Z",
    });
    assert.equal(JSON.stringify(exportPayload).includes(transientContextCanary), false);
    assert.equal(
      JSON.stringify(activePlanExportToTrainingPlanV2(exportPayload)).includes(
        transientContextCanary,
      ),
      false,
    );

    proof = {
      providerCalls,
      savedSourceRows: expectedMaterialization.savedPlan.planned_workouts.length,
      materializedCalendarRows: persisted.workouts.length,
      omittedLeadingRows: expectedMaterialization.prepared.omittedLeadingDayCount,
      runnerCurrentDate: expectedMaterialization.prepared.currentDate,
      sourceKind: persisted.plan.source_kind,
      responseId: AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
      reviewChecksum: reviewed.draft.reviewChecksum,
      persistedResponseId: AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
      transientContextAbsent: true,
    };
  } finally {
    cleanup = await cleanupDisposableUser(input.supabase, disposableUser);
    for (const key of envKeys) {
      const value = previousEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    assert.ok(cleanup);
  }

  if (!proof || !cleanup) {
    throw new Error("QA fixture runtime persistence proof did not complete.");
  }

  return {
    ...proof,
    cleanup,
  };
}

function asJsonRecord(value: Json | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

async function persistReviewedDraftProfileSnapshot(
  userId: string,
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  const profile = draft.normalizedInputSummary.initialPlanProfile;
  const fitnessLevel = profile.components.constraints.fitnessLevel;
  if (!fitnessLevel) throw new Error("Reviewed initial-plan profile is missing fitness level.");

  await updateUserSettingsForUserId(userId, {
    firstName: null,
    lastName: null,
    displayName: null,
    age: draft.normalizedInputSummary.age,
    weightKg: draft.normalizedInputSummary.weightKg,
    heightCm: draft.normalizedInputSummary.heightCm,
    fitnessLevel,
    trainingPreferences: profile.components.constraints.trainingPreferences,
    heartRateProfile: {
      zones: draft.normalizedInputSummary.heartRateProfile.zones.map(
        ({ reference, minBpm, maxBpm }) => ({
          reference,
          minBpm,
          maxBpm,
        }),
      ),
    },
  });
}

async function validatePersonalHeartRateProfilePersistence(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  preflight: Extract<PersistencePreflight, { shouldRun: true }>;
  previewInput: RunningPlanPreviewDraft["previewInput"];
  buildConfirmInputForConfirm: BuildConfirmInputForConfirm;
}) {
  const owner = await acquireQaPoolSupabaseUser({
    supabase: input.supabase,
    poolRole: "isolation-a",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Disposable personal-HR owner creation failed.",
  });
  let otherRunner: QaPoolUserLease | null = null;

  try {
    otherRunner = await acquireQaPoolSupabaseUser({
      supabase: input.supabase,
      poolRole: "isolation-b",
      password: DISPOSABLE_TEST_PASSWORD,
      creationErrorMessage: "Disposable personal-HR RLS runner creation failed.",
    });
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

    const settingsBeforeInvalidBaseline = await getUserSettingsForUserId(owner.userId, owner.email);
    await assert.rejects(
      updateUserSettingsForUserId(
        owner.userId,
        {
          firstName: "Local",
          lastName: "Runner",
          displayName: "Local Runner",
          age: input.previewInput.age,
          weightKg: input.previewInput.weightKg,
          heightCm: 50,
          fitnessLevel: "running_regularly",
        },
        owner.email,
      ),
    );
    assert.deepEqual(
      await getUserSettingsForUserId(owner.userId, owner.email),
      settingsBeforeInvalidBaseline,
      "Invalid Settings baseline values must be rejected before profile persistence.",
    );

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

    const reloadedSettings = await getUserSettingsForUserId(owner.userId, null);
    assert.equal(reloadedSettings?.heartRateZones.source, "personal");
    assert.deepEqual(
      reloadedSettings?.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
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
    const acceptedHeartRateProfile = acceptedRunnerHeartRateProfileSchema.parse({
      source: reloadedSettings?.heartRateZones.source,
      accepted: reloadedSettings?.heartRateZones.accepted,
      sourceNote: reloadedSettings?.heartRateZones.sourceNote,
      zones: reloadedSettings?.heartRateZones.zones.map((zone) => ({
        reference: zone.reference,
        label: zone.label,
        minBpm: zone.minBpm,
        maxBpm: zone.maxBpm,
      })),
    });
    const proofProfile = buildProofInitialPlanProfile(watchCanaryInput, {
      personalZones: PERSONAL_HEART_RATE_ZONES,
    });
    const authoring = buildAiGeneratedRunningPlanAuthoringInput(
      watchCanaryInput,
      proofProfile.initialPlanProfile,
      acceptedHeartRateProfile,
    );
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

    const fixtureFetch = buildPersonalHeartRateSubrangeFixtureFetch(
      buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
        authoringInput: authoring.authoringInput,
        today: watchCanaryInput.startDate,
        env: localFixtureEnv(input.preflight.target.url),
      }),
    );
    const fixtureOptions = {
      apiKey: "local-qa-dev-ai-generated-plan-fixture",
      model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
      today: watchCanaryInput.startDate,
      fetchImpl: fixtureFetch,
    };

    let reviewed = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
      owner.userId,
      watchCanaryInput,
      { aiPreview: fixtureOptions },
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
      plans: 1,
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
      { aiPreview: fixtureOptions },
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
          target.primary_execution_mode === "heart_rate" &&
          target.target_source === "ai_authored_plan_guidance" &&
          target.hr_bpm_range === "116-135 bpm" &&
          target.hr_bpm_min === 116 &&
          target.hr_bpm_max === 135 &&
          target.hr_target_source === "personal_hr_zone" &&
          target.label === "Personal HR" &&
          target.source_note === "Saved by the runner as personal heart-rate truth." &&
          target.extra?.hr_zone_reference === "Z2" &&
          target.extra.hr_profile_source === "personal" &&
          target.extra.hr_band_bpm_min === 116 &&
          target.extra.hr_band_bpm_max === 135 &&
          target.extra.hr_execution_range_kind === "full_band",
      ),
      "Reviewed plan must preserve authored Z2 identity and its full personal band snapshot.",
    );
    assert.ok(
      reviewedTargets.some(
        (target) =>
          target.primary_execution_mode === "heart_rate" &&
          target.target_source === "ai_authored_plan_guidance" &&
          target.hr_bpm_range === "121-130 bpm" &&
          target.hr_bpm_min === 121 &&
          target.hr_bpm_max === 130 &&
          target.hr_target_source === "personal_hr_zone" &&
          target.label === "Personal HR" &&
          target.source_note === "Saved by the runner as personal heart-rate truth." &&
          target.extra?.hr_zone_reference === "Z2" &&
          target.extra.hr_profile_source === "personal" &&
          target.extra.hr_band_bpm_min === 116 &&
          target.extra.hr_band_bpm_max === 135 &&
          target.extra.hr_execution_range_kind === "ai_selected_subrange",
      ),
      "Reviewed plan must preserve the AI-selected execution subrange inside its full Z2 snapshot.",
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
      confirmed.savedPlanId,
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
    const selectedSavedPlanExport = await exportSavedPlanForUser(
      owner.userId,
      confirmed.savedPlanId,
      "json",
    );
    const selectedSavedPlanTargets = collectTargetRecords(
      (JSON.parse(selectedSavedPlanExport.body) as TrainingPlanV2).planned_workouts,
    );
    assert.ok(
      exportTargets.some(
        (target) =>
          target.primary_execution_mode === "heart_rate" &&
          target.target_source === "ai_authored_plan_guidance" &&
          target.hr_bpm_range === "116-135 bpm" &&
          target.hr_bpm_min === 116 &&
          target.hr_bpm_max === 135 &&
          target.hr_target_source === "personal_hr_zone" &&
          target.label === "Personal HR" &&
          target.source_note === "Saved by the runner as personal heart-rate truth." &&
          target.hr_zone_reference === "Z2" &&
          target.hr_profile_source === "personal" &&
          target.hr_band_bpm_min === 116 &&
          target.hr_band_bpm_max === 135 &&
          target.hr_execution_range_kind === "full_band" &&
          target.extra === undefined,
      ),
      "Export must preserve reviewed BPM guidance, named identity, parent snapshot, and provenance.",
    );
    assert.ok(
      selectedSavedPlanTargets.some(
        (target) =>
          target.primary_execution_mode === "heart_rate" &&
          target.target_source === "ai_authored_plan_guidance" &&
          target.hr_bpm_range === "121-130 bpm" &&
          target.hr_bpm_min === 121 &&
          target.hr_bpm_max === 130 &&
          target.hr_target_source === "personal_hr_zone" &&
          target.label === "Personal HR" &&
          target.source_note === "Saved by the runner as personal heart-rate truth." &&
          target.hr_zone_reference === "Z2" &&
          target.hr_profile_source === "personal" &&
          target.hr_band_bpm_min === 116 &&
          target.hr_band_bpm_max === 135 &&
          target.hr_execution_range_kind === "ai_selected_subrange" &&
          target.extra === undefined,
      ),
      "Selected saved-plan export must preserve the source execution subrange independently of its parent band.",
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
      confirmed.savedPlanId,
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
      reviewedSubrangeBpm: "121-130 bpm",
      overlappingPersonalPersisted: true,
      gappedPersonalPersisted: true,
      invalidSettingsBaselineRejected: true,
      historicalSnapshotPreserved: true,
      rlsIsolation: true,
    };
  } finally {
    if (otherRunner) {
      await cleanupDisposableUser(input.supabase, otherRunner);
    }
    await cleanupDisposableUser(input.supabase, owner);
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
      label: "incomplete guidance band set",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(0, 4)],
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
      label: "BPM below the product envelope",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 59, maxBpm: 110 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(1),
        ],
      },
    },
    {
      label: "BPM above the product envelope",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(0, 4),
          { reference: "Z5", minBpm: 165, maxBpm: 201 },
        ],
      },
    },
    {
      label: "decreasing lower guidance bounds",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 100, maxBpm: 110 },
          { reference: "Z2", minBpm: 99, maxBpm: 130 },
          ...UPDATED_PERSONAL_HEART_RATE_ZONES.slice(2),
        ],
      },
    },
    {
      label: "decreasing upper guidance bounds",
      value: {
        version: "runner_hr_profile_v2",
        source: "personal",
        zones: [
          { reference: "Z1", minBpm: 90, maxBpm: 120 },
          { reference: "Z2", minBpm: 115, maxBpm: 119 },
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
  hr_band_bpm_max?: number;
  hr_band_bpm_min?: number;
  hr_bpm_max?: number;
  hr_bpm_min?: number;
  hr_bpm_range?: string;
  hr_execution_range_kind?: string;
  hr_profile_source?: string;
  hr_target_source?: string;
  label?: string;
  pace?: string;
  pace_min_per_km_range?: string;
  primary_execution_mode?: string;
  source_note?: string;
  target_source?: string;
  hr_zone_reference?: string;
  extra?: {
    hr_band_bpm_max?: number;
    hr_band_bpm_min?: number;
    hr_execution_range_kind?: string;
    hr_profile_source?: string;
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

function buildPersonalHeartRateSubrangeFixtureFetch(fetchImpl: typeof fetch): typeof fetch {
  return async (input, init) => {
    const response = await fetchImpl(input, init);
    const providerResponse = (await response.json()) as {
      output_text?: string;
      [key: string]: unknown;
    };
    assert.equal(typeof providerResponse.output_text, "string");
    const draft = JSON.parse(providerResponse.output_text) as AiAuthoredPlanFirstCompilerDraft;
    let authoredSubrange = false;

    for (const workout of [...draft.detailed_block.workouts, draft.detailed_block.final_workout]) {
      for (const section of workout.sections) {
        if (section.kind !== "unit") continue;
        const target = section.target;
        if (
          target.primary_execution_mode === "heart_rate" &&
          target.band_reference === "Z2" &&
          target.command === "116-135 bpm"
        ) {
          section.target = {
            ...target,
            command: "121-130 bpm",
          };
          section.cue = "Use the narrower aerobic range for this controlled stage.";
          authoredSubrange = true;
          break;
        }
      }
      if (authoredSubrange) break;
    }

    assert.equal(authoredSubrange, true, "The persistence fixture must author one Z2 subrange.");
    return new Response(
      JSON.stringify({
        ...providerResponse,
        output_text: JSON.stringify(draft),
      }),
      {
        status: response.status,
        headers: { "content-type": "application/json" },
      },
    );
  };
}

function localFixtureEnv(loopbackSupabaseUrl: string) {
  return {
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
    NEXT_PUBLIC_SUPABASE_URL: loopbackSupabaseUrl,
    HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
    HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "qa_fixture",
  };
}

async function validateReviewedPlanPersistenceFailureAtomicity(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
) {
  const disposableUser = await acquireQaPoolSupabaseUser({
    supabase,
    poolRole: "provider-engine",
    creationErrorMessage: "Disposable atomic plan-creation user creation failed.",
  });
  const firstWorkoutId = crypto.randomUUID();
  const profilePayload = {
    goal_type: "distance_build",
    goal_label: "Atomic 10K proof",
    baseline_sessions_per_week: 3,
    baseline_long_run_km: 6,
    baseline_notes: null,
  };
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

    const sourcePlan = await retainImportedPlanCandidateForUser({
      userId: disposableUser.userId,
      canonicalPlan: buildAtomicSourcePlan(),
      reviewChecksum: "a".repeat(64),
    });
    const sourcePlanBefore = structuredClone(sourcePlan);

    const historicalWorkoutId = crypto.randomUUID();
    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: profilePayload,
        sourcePlanId: sourcePlan.id,
        workouts: [
          {
            ...buildAtomicCreationWorkout(
              historicalWorkoutId,
              sourcePlan.id,
              disposableUser.userId,
              "easy",
              "atomic-source-easy",
            ),
            workout_date: "2026-07-19",
            weekday: "Sunday",
          },
        ] as unknown as Json,
        currentDate: "2026-07-20",
        expectedProfileRevision: savedBaseline.profileRevision,
      }),
      (error) => error instanceof CalendarPersistenceRejection && error.reason === "invalid_input",
    );

    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: profilePayload,
        sourcePlanId: sourcePlan.id,
        workouts: [
          buildAtomicCreationWorkout(
            firstWorkoutId,
            sourcePlan.id,
            disposableUser.userId,
            "easy",
            "atomic-source-easy",
          ),
        ] as unknown as Json,
        currentDate: "2026-07-20",
        expectedProfileRevision: savedBaseline.profileRevision + 1,
      }),
      (error) => error instanceof CalendarPersistenceRejection && error.reason === "stale_review",
    );

    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: profilePayload,
        sourcePlanId: sourcePlan.id,
        workouts: [
          buildAtomicCreationWorkout(
            firstWorkoutId,
            sourcePlan.id,
            disposableUser.userId,
            "easy",
            "atomic-source-easy",
          ),
          buildAtomicCreationWorkout(
            crypto.randomUUID(),
            sourcePlan.id,
            disposableUser.userId,
            "invalid_workout_type",
            "atomic-source-quality",
          ),
        ] as unknown as Json,
        currentDate: "2026-07-20",
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
    assert.equal(plans.count, 1, "Failed materialization must preserve only its immutable source.");
    assert.equal(workouts.count, 0, "Failed plan creation must roll back every workout row.");
    const baselineAfter = await supabase
      .from("runner_profiles")
      .select("*")
      .eq("user_id", disposableUser.userId)
      .single();
    assert.equal(baselineAfter.error, null);
    assert.deepEqual(baselineAfter.data, baselineBefore.data);

    const materializedWorkoutId = crypto.randomUUID();
    const created = await applyAtomicReviewedPlanPersistence({
      userId: disposableUser.userId,
      profile: profilePayload,
      sourcePlanId: sourcePlan.id,
      workouts: [
        buildAtomicCreationWorkout(
          materializedWorkoutId,
          sourcePlan.id,
          disposableUser.userId,
          "easy",
          "atomic-source-easy",
        ),
      ] as unknown as Json,
      currentDate: "2026-07-20",
      expectedProfileRevision: savedBaseline.profileRevision,
    });
    assert.equal(created.planCycle.id, sourcePlan.id);
    assert.equal(created.planCycle.status, "archived");
    assert.deepEqual(created.planCycle, sourcePlanBefore);

    const changedBaseline = await updateUserSettingsForUserId(disposableUser.userId, {
      firstName: null,
      lastName: null,
      displayName: null,
      age: baseline.age,
      weightKg: baseline.weightKg,
      heightCm: baseline.heightCm,
      fitnessLevel: baseline.fitnessLevel!,
      heartRateProfile: { zones: [...PERSONAL_HEART_RATE_ZONES] },
    });
    assert.equal(changedBaseline.profileRevision, savedBaseline.profileRevision + 1);

    await assert.rejects(
      applyAtomicReviewedPlanPersistence({
        userId: disposableUser.userId,
        profile: profilePayload,
        sourcePlanId: sourcePlan.id,
        workouts: [
          buildAtomicCreationWorkout(
            crypto.randomUUID(),
            sourcePlan.id,
            disposableUser.userId,
            "quality",
            "atomic-source-quality",
          ),
        ] as unknown as Json,
        currentDate: "2026-07-20",
        expectedProfileRevision: savedBaseline.profileRevision,
      }),
      (error) => error instanceof CalendarPersistenceRejection && error.reason === "stale_review",
    );

    const [plansAfterRace, workoutsAfterRace, profileAfterRace] = await Promise.all([
      supabase.from("plan_cycles").select("id,status").eq("user_id", disposableUser.userId),
      supabase
        .from("planned_workouts")
        .select("id,plan_cycle_id")
        .eq("user_id", disposableUser.userId),
      supabase
        .from("runner_profiles")
        .select("baseline_revision")
        .eq("user_id", disposableUser.userId)
        .single(),
    ]);
    assert.equal(plansAfterRace.error, null);
    assert.equal(workoutsAfterRace.error, null);
    assert.equal(profileAfterRace.error, null);
    assert.deepEqual(plansAfterRace.data, [{ id: sourcePlan.id, status: "archived" }]);
    assert.deepEqual(workoutsAfterRace.data, [
      { id: materializedWorkoutId, plan_cycle_id: sourcePlan.id },
    ]);
    assert.deepEqual(
      await getSavedPlanRecordForUser(disposableUser.userId, sourcePlan.id),
      sourcePlanBefore,
    );
    assert.equal(profileAfterRace.data?.baseline_revision, changedBaseline.profileRevision);
  } finally {
    await cleanupDisposableUser(supabase, disposableUser);
  }

  return {
    creationRollback: true,
    historicalRowsRejected: true,
    staleProfileRaceRejected: true,
  } as const;
}

function buildAtomicCreationWorkout(
  id: string,
  planId: string,
  userId: string,
  workoutType: string,
  sourceWorkoutId: string,
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
    origin_kind: "file_import",
    source_workout_id: sourceWorkoutId,
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

function buildAtomicSourcePlan(): TrainingPlanV2 {
  return {
    schema_version: "training-plan-v2",
    plan_name: "Atomic reviewed materialization source",
    source_kind: "training_plan_v2_import",
    generated_for: "Disposable local persistence proof",
    goal: {
      goal_type: "distance_build",
      goal_label: "10K",
    },
    start_date: "2026-07-20",
    preparation_horizon_weeks: 1,
    planned_workouts: [
      buildAtomicSourceWorkout("atomic-source-easy", "2026-07-20", "Monday", "easy"),
      buildAtomicSourceWorkout("atomic-source-quality", "2026-07-21", "Tuesday", "quality"),
    ],
  };
}

function buildAtomicSourceWorkout(
  workoutId: string,
  date: string,
  weekday: string,
  workoutType: "easy" | "quality",
): TrainingPlanV2["planned_workouts"][number] {
  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: 1,
    phase: "Base",
    segments: [
      {
        segment_id: `${workoutId}-segment`,
        segment_type: "main",
        label: "Easy running",
        sequence: 1,
        guidance: "Run easily.",
        prescription: { mode: "time", duration_min: 30 },
        target: { cue: "Conversational effort." },
      },
    ],
    workout_type: workoutType,
    source_workout_type: workoutType === "easy" ? "Easy" : "Tempo",
    workout_family: workoutType === "easy" ? "easy" : "tempo",
    workout_identity: workoutType === "easy" ? "easy_aerobic_run" : "controlled_tempo_session",
    calendar_icon_key: workoutType === "easy" ? "easy" : "tempo",
    goal_context: {
      goal_type: "distance_build",
      goal_style: "atomic_persistence_proof",
      terrain_focus: "standard",
      target_date: null,
      target_time: null,
    },
    metric_mode: {
      guidance: "effort",
      executable_mode: "structure_only_executable",
      pace_targets_allowed: false,
      hr_targets_allowed: false,
      hr_target_source: "effort_only",
      reason: "Atomic persistence proof uses effort-only guidance.",
    },
    title: workoutType === "easy" ? "Easy run" : "Quality run",
    summary: "Atomic persistence proof workout.",
    planned_rpe: workoutType === "easy" ? 3 : 6,
    estimated_fatigue: workoutType === "easy" ? "low" : "moderate",
    recovery_priority: "normal",
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
  sourcePlanId: string,
) {
  const planResult = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("id", sourcePlanId)
    .eq("user_id", userId)
    .not("saved_plan_payload", "is", null)
    .single();

  if (planResult.error || !planResult.data) {
    throw new Error(planResult.error?.message ?? "Immutable source-plan provenance was not found.");
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

async function prepareExpectedSavedPlanMaterialization(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  savedPlanId: string;
}) {
  const [savedPlanRecord, runnerCurrentDate, profile] = await Promise.all([
    getSavedPlanRecordForUser(input.userId, input.savedPlanId),
    getRunnerCalendarDateForUserId(input.userId),
    input.supabase
      .from("runner_profiles")
      .select("training_preferences")
      .eq("user_id", input.userId)
      .single(),
  ]);
  assert.ok(savedPlanRecord, "The confirmed saved-plan source record was not found.");
  assert.equal(profile.error, null);
  const savedPlan = readSavedPlanPayload(savedPlanRecord);

  return {
    savedPlan,
    prepared: prepareSavedPlanFutureApplyPolicy(
      savedPlan,
      runnerCurrentDate,
      profile.data?.training_preferences ?? null,
    ),
  };
}

async function cleanupDisposableUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  lease: QaPoolUserLease,
): Promise<DisposableCleanupProof> {
  return releaseQaPoolSupabaseUser({
    supabase,
    userId: lease.userId,
    poolRole: lease.poolRole,
    leaseToken: lease.leaseToken,
  });
}
