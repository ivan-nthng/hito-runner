import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../../src/lib/supabase/database";

export const ADAPTIVE_INITIAL_PLAN_QA_FIXTURE_MODEL = "gpt-5.2-adaptive-fixture-proof" as const;
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
  AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
  AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  buildAiGeneratedContinuationDevFixtureOpenAiFetch,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
  buildAiGeneratedRunningPlanQaFixtureAuthoringInput,
} from "../../src/lib/ai-generated-running-plan-dev-fixture";
import { buildAiGeneratedRunningPlanAuthoringInput } from "../../src/lib/ai-generated-running-plan";
import {
  getAdaptiveBlueprintCalendarReadModelForUser,
  getAdaptiveBlueprintContinuationDecisionForUser,
  getAdaptiveBlueprintContinuationFactsForUser,
} from "../../src/lib/adaptive-blueprint-read-model";
import {
  getAdaptiveTrainingDetailedCandidateForUser,
  getAdaptiveTrainingContinuationSourceStateForUser,
  getAdaptiveTrainingOriginalAuthoringInputForUser,
  retainAdaptiveTrainingContinuationInputRevisionForUser,
} from "../../src/lib/adaptive-blueprint-persistence";
import { prepareAdaptiveContinuationCandidateForUser } from "../../src/lib/adaptive-blueprint-actions.server";
import {
  ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
  ADAPTIVE_CONTINUATION_COMPILER_VERSION,
  ADAPTIVE_CONTINUATION_PROMPT_VERSION,
  ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
  ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
} from "../../src/lib/adaptive-continuation-authoring";
import { parseAdaptiveContinuationCandidateContent } from "../../src/lib/adaptive-blueprint-continuation";
import { requestAiPlanStructuredResponse } from "../../src/lib/ai-first-plan-draft-service";
import {
  getAiPlanGenerationResponseForUser,
  recordAiPlanGenerationReviewVerdictForUser,
} from "../../src/lib/ai-plan-generation-response-persistence";
import {
  buildReviewedAiGeneratedRunningPlanPreviewForUser,
  confirmRunningPlanDraftForUser,
  listSavedPlanReviewsForUser,
  restoreSavedPlanReviewForUser,
  type RunningPlanConfirmActionInput,
} from "../../src/lib/running-plan-engine-actions";
import { retainImportedPlanCandidateForUser } from "../../src/lib/active-plan-persistence";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type ImportedPlan,
} from "../../src/lib/imported-plan";
import {
  confirmWorkoutCommandForUser,
  reviewWorkoutCommandForUser,
} from "../../src/lib/manual-workout-authoring/actions";
import { DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE } from "../../src/lib/local-auth-account-registry.server";
import { digestSha256Hex, stableJsonStringify } from "../../src/lib/review-token-signing";
import {
  persistGarminFitActivitySource,
  readRunnerActivityProjection,
  removeRunnerActivityOriginalFilesForActivity,
} from "../../src/lib/runner-activity/garmin-fit-source";
import { recordRunnerActivitySessionRpeForUser } from "../../src/lib/runner-activity/activity-evidence";
import { listRunnerActivityHistoryForUser } from "../../src/lib/runner-activity/history-read-model";
import { getRunnerActivityProgressForUser } from "../../src/lib/runner-activity/read-model";
import type { RunnerFitnessProfileSnapshotV1 } from "../../src/lib/runner-activity/product-contract";
import { getPersistedRunnerCalendarSnapshot } from "../../src/lib/runner-calendar-snapshot";
import {
  addDaysIso,
  diffDaysIso,
  startOfWeekIso,
  todayIso,
  weekdayLong,
} from "../../src/lib/training";
import {
  resolveWeekdayRestInvariant,
  type WeekdayName,
} from "../../src/lib/weekday-rest-invariants";
import { isLoopbackRuntimeUrl } from "../../src/lib/supabase/env";
import { structuredPlanAuthoringInputSchema } from "../../src/lib/structured-plan-authoring-schema";
import {
  buildFirstTimeRunnerBaselineReadback,
  updateUserSettingsForUserId,
} from "../../src/lib/user-settings-actions";
import { parseGarminFitActivity } from "../../src/lib/workout-result-import/parse-garmin-fit";
import { reconcileWorkoutResultProjection } from "../../src/lib/workout-result-import/planned-workout-projection";
import { getFitCompletedPlannedWorkoutIds } from "../../src/lib/workout-result-import/read-workout-result-feedback";
import { WORKOUT_RESULT_STORAGE_BUCKET } from "../../src/lib/workout-result-import/internal-types";
import { saveWorkoutLogForUser } from "../../src/lib/workout-log-actions";
import { markRunnerActivitySourceRemovalPendingForFixture } from "./runner-activity-gate-4-fixture";
import { loginToLoopbackRuntime } from "./runner-activity-proof-runtime";
import { buildProofInitialPlanProfile } from "../runner-fitness-profile-initial-plan-proof-helpers";

export const RUNNER_DESIGN_PROFILE_FIXTURE_VERSION = "runner_design_profile_v1" as const;
export const RUNNER_DESIGN_PROFILE_FIXTURE_ROLE = "saved-plan-readback" as const;
export const ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE = "adaptive-training-quality" as const;
export const ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION =
  "adaptive_blueprint_projection_v1" as const;
export const ADAPTIVE_ENGINE_UI_REPLAY_FIXTURE_VERSION = "adaptive_engine_ui_replay_v1" as const;
export const ADAPTIVE_ENGINE_UI_REPLAY_CHECKPOINTS = [
  "initial_plan_review",
  "continuation_actions",
  "complete_surface",
] as const;
export type AdaptiveEngineUiReplayCheckpoint =
  (typeof ADAPTIVE_ENGINE_UI_REPLAY_CHECKPOINTS)[number];
export const RUNNER_DESIGN_PROFILE_FIXTURE_STORAGE_BUCKET = WORKOUT_RESULT_STORAGE_BUCKET;
export const RUNNER_CORE_FILE_FLOW_FIXTURE_ROLE = "isolation-a" as const;
export const RUNNER_CORE_FILE_FLOW_FIXTURE_TEMPLATE =
  "public/templates/hito-training-plan-v2-template.json" as const;

type FixtureActivitySpec = {
  key: string;
  daysAgo: number;
  title: string;
  timerDurationMin: number | null;
  elapsedDurationMin: number;
  distanceKm: number | null;
  averageHeartRate: number | null;
  elevationGainM: number | null;
  planned: boolean;
  sourceState: "available" | "removal_pending" | "removed";
  sessionRpe: number | null;
  runningContext: "track" | null;
};

type FixturePlannedWorkout = Database["public"]["Tables"]["planned_workouts"]["Row"];

type FixtureSeedReceipt = {
  activityId: string;
  activityRevisionId: string;
  sourceRevisionId: string;
  key: string;
};

const AS_OF_DATE_SCHEMA = z.string().date();
const MIN_MATCHED_ACTIVITY_COUNT = 11;
const ADAPTIVE_BLUEPRINT_PROJECTION_KEYS = [
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
] as const;

export async function seedRunnerCoreFileFlowFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  templatePlan: ImportedPlan;
  asOfDate?: string;
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const baseline = buildFirstTimeRunnerBaselineReadback({
    age: 36,
    weightKg: 72,
    heightCm: 178,
    fitnessLevel: "running_regularly",
  });
  await updateUserSettingsForUserId(input.userId, {
    firstName: "QA",
    lastName: "File Flow",
    displayName: "QA File Flow",
    age: baseline.age,
    weightKg: baseline.weightKg,
    heightCm: baseline.heightCm,
    fitnessLevel: baseline.fitnessLevel!,
    calendarTimezone: "UTC",
    heartRateProfile: {
      zones: baseline.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
    },
  });
  const canonicalPlan = buildRunnerCoreFileFlowPlan(input.templatePlan, asOfDate);
  const sourcePlan = await retainImportedPlanCandidateForUser({
    userId: input.userId,
    canonicalPlan,
    reviewChecksum: await digestSha256Hex(stableJsonStringify(canonicalPlan)),
  });
  const materialized = await materializeSourceWorkoutBatchForFixture({
    userId: input.userId,
    canonicalPlan,
    sourcePlanId: sourcePlan.id,
    calendarInstant: new Date(`${asOfDate}T12:00:00.000Z`),
  });
  assert.equal(materialized.ok, true);

  return readRunnerCoreFileFlowFixture({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate,
  });
}

export async function readRunnerCoreFileFlowFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
  expectedEditingState?: "eligible" | "evidence_backed";
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const plans = await input.supabase
    .from("plan_cycles")
    .select("id, status, source_kind, saved_plan_payload")
    .eq("user_id", input.userId);
  if (plans.error) throw new Error(plans.error.message);
  const sourcePlans = plans.data.filter((plan) => plan.saved_plan_payload !== null);
  assert.equal(sourcePlans.length, 1, "The file-flow fixture requires one immutable source.");
  assert.equal(
    plans.data.filter((plan) => plan.saved_plan_payload === null).length,
    0,
    "The file-flow fixture must not create a materialized plan container.",
  );
  assert.equal(
    plans.data.filter((plan) => plan.status === "active").length,
    0,
    "The file-flow fixture must not create active-plan authority.",
  );
  const sourcePlan = sourcePlans[0]!;
  assert.equal(sourcePlan.status, "archived");
  assert.equal(sourcePlan.source_kind, "training_plan_v2_import");

  const workouts = await input.supabase
    .from("planned_workouts")
    .select(
      "id, user_id, plan_cycle_id, origin_kind, source_workout_id, workout_date, workout_type, title",
    )
    .eq("user_id", input.userId);
  if (workouts.error) throw new Error(workouts.error.message);
  assert.equal(workouts.data.length, 1, "The file-flow fixture requires exactly one workout.");
  const workout = workouts.data[0]!;
  assert.equal(workout.user_id, input.userId);
  assert.equal(workout.plan_cycle_id, sourcePlan.id);
  assert.equal(workout.origin_kind, "file_import");
  assert.ok(workout.source_workout_id, "Imported provenance requires a source workout identity.");
  assert.notEqual(workout.workout_type, "rest");
  assert.ok(workout.workout_date > asOfDate, "The imported workout must remain future-eligible.");

  const snapshot = await getPersistedRunnerCalendarSnapshot(input.userId, {
    currentDate: asOfDate,
  });
  assert.equal(snapshot.mode, "authenticated");
  const snapshotWorkout = snapshot.workouts.find((candidate) => candidate.id === workout.id);
  assert.ok(snapshotWorkout, "The future imported workout must reach the Calendar read model.");
  assert.equal(snapshotWorkout.sourceProvenance?.originKind, "file_import");
  const sourceEditing = snapshotWorkout.sourceEditing;
  assert.ok(sourceEditing, "The future imported workout requires Calendar editing readback.");
  if ((input.expectedEditingState ?? "eligible") === "eligible") {
    assert.equal(sourceEditing.eligibility, "eligible_future_unlogged");
    assert.equal(sourceEditing.canEditContent, true);
    assert.equal(sourceEditing.canDirectMove, true);
    assert.equal(sourceEditing.canDirectCopy, true);
  } else {
    assert.equal(sourceEditing.eligibility, "blocked");
    assert.equal(sourceEditing.reason, "evidence_backed_workout");
    assert.equal(sourceEditing.canEditContent, false);
    assert.equal(sourceEditing.canDirectMove, false);
    assert.equal(sourceEditing.canDirectCopy, true);
  }

  const [assets, metrics, comparisons, matches] = await Promise.all([
    input.supabase
      .from("workout_result_assets")
      .select("id, parse_status")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", workout.id),
    input.supabase
      .from("workout_actual_metrics")
      .select("id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", workout.id),
    input.supabase
      .from("workout_comparisons")
      .select("id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", workout.id),
    input.supabase
      .from("runner_activity_planned_workout_matches")
      .select("activity_id")
      .eq("user_id", input.userId)
      .eq("planned_workout_id", workout.id),
  ]);
  for (const result of [assets, metrics, comparisons, matches]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    role: RUNNER_CORE_FILE_FLOW_FIXTURE_ROLE,
    asOfDate,
    sourcePlan: {
      id: sourcePlan.id,
      status: sourcePlan.status,
      sourceKind: sourcePlan.source_kind,
    },
    workout: {
      id: workout.id,
      date: workout.workout_date,
      type: workout.workout_type,
      title: workout.title,
      originKind: workout.origin_kind,
      sourceWorkoutId: workout.source_workout_id,
      editingEligibility: sourceEditing.eligibility,
      canEditContent: sourceEditing.canEditContent,
      canMove: sourceEditing.canDirectMove,
      canCopy: sourceEditing.canDirectCopy,
    },
    evidence: {
      assetCount: assets.data.length,
      parsedAssetCount: assets.data.filter((asset) => asset.parse_status === "parsed").length,
      metricsCount: metrics.data.length,
      comparisonCount: comparisons.data.length,
      matchCount: matches.data.length,
    },
  };
}

function buildRunnerCoreFileFlowPlan(templatePlan: ImportedPlan, asOfDate: string) {
  const sourceWorkout = templatePlan.planned_workouts.find(
    (workout) => workout.workout_type !== "rest",
  );
  assert.ok(sourceWorkout, "The canonical import template requires one non-Rest workout.");
  const weekdayRestInvariant = resolveWeekdayRestInvariant({
    importedPlanPreferences: templatePlan.plan_preferences,
    importedTrainingConstraints: templatePlan.training_constraints,
  });
  const workoutDate = Array.from({ length: 7 }, (_, offset) =>
    addDaysIso(asOfDate, 2 + offset),
  ).find(
    (date) => !weekdayRestInvariant.blockedWeekdays.includes(weekdayLong(date) as WeekdayName),
  );
  assert.ok(workoutDate, "The canonical import template requires one allowed training weekday.");

  return importedPlanSchema.parse({
    ...templatePlan,
    plan_name: "QA Future Imported Workout",
    generated_for: "QA Runner Core",
    start_date: workoutDate,
    planned_workouts: [
      {
        ...sourceWorkout,
        workout_id: "runner-core-file-flow-imported-workout",
        date: workoutDate,
        weekday: weekdayLong(workoutDate),
        week_number: 1,
        phase: "QA fixture",
      },
    ],
  });
}

async function materializeSourceWorkoutBatchForFixture(input: {
  userId: string;
  canonicalPlan: ImportedPlan;
  sourcePlanId: string;
  calendarInstant: Date;
}) {
  const documents = buildImportedPlanSeed(input.canonicalPlan).workouts;
  const review = await reviewWorkoutCommandForUser(input.userId, {
    operation: "materialize",
    documents,
    provenanceReferences: documents.map((document) => ({
      sourcePlanId: input.sourcePlanId,
      sourceKind: input.canonicalPlan.source_kind,
      sourceWorkoutId: document.sourceWorkoutId,
    })),
  });
  assert.equal(review.ok, true);
  if (!review.ok) throw new Error("Fixture Workout batch review failed.");
  const confirmed = await confirmWorkoutCommandForUser(
    input.userId,
    {
      command: review.candidate.command,
      candidateId: review.candidate.candidateId,
      reviewToken: review.candidate.reviewToken,
      reviewChecksum: review.candidate.reviewChecksum,
    },
    { sourceBatchCalendarInstant: input.calendarInstant },
  );
  assert.equal(confirmed.ok, true, confirmed.ok ? "" : confirmed.message);
  return confirmed;
}

const ACTIVITY_SPECS = Object.freeze<FixtureActivitySpec[]>([
  activity("w8-recovery", 55, "Recovery run", 30, 32, 4.8, 134, 18, true),
  activity("w8-easy", 53, "Easy run", 42, 44, 7, 142, 30, true),
  activity("w8-long", 51, "Long run", 70, 74, 11.2, 140, 55, true),
  activity("w8-unplanned", 49, "Unplanned run", 28, 31, 4.4, null, null, false),
  activity("w7-recovery", 47, "Recovery run", 35, 37, 5.6, 136, 20, true),
  activity("w7-steady", 45, "Steady run", 45, 48, 7.4, 144, 34, true),
  activity("w7-long", 43, "Long run", 75, 79, 12, 141, 62, true, "removed"),
  activity("w7-unplanned", 41, "Unplanned run", 30, 33, 4.7, null, 16, false),
  activity("w6-easy", 39, "Easy run", 38, 40, 6.2, 137, null, true),
  activity("w6-steady", 37, "Steady run", 48, 51, 8, 145, 38, true),
  activity("w6-long", 35, "Long run", 80, 84, 13, 142, 70, true),
  activity(
    "w6-unplanned",
    33,
    "Unplanned run",
    32,
    35,
    5,
    null,
    18,
    false,
    "available",
    null,
    "track",
  ),
  activity("w5-easy", 31, "Easy run", 40, 42, 6.5, 138, 24, true),
  activity("w5-steady", 29, "Steady run", 50, 53, 8.3, 146, 40, true),
  activity("w5-long", 28, "Long run", 85, 89, 13.8, 143, 74, true),
  activity("w4-unplanned", 27, "Unplanned run", 30, 33, 4.8, 135, 18, false),
  activity("w4-easy", 25, "Easy run", 42, 44, 7, 142, 28, true),
  activity("w4-long", 23, "Long run", 88, 92, 14.2, 142, 80, true),
  activity("w4-recovery", 21, "Recovery run", 28, 31, 4.5, null, null, true),
  activity("w3-unplanned", 19, "Unplanned run", 36, 39, 5.8, 137, 22, false),
  activity("w3-steady", 17, "Steady run", 46, 49, 7.6, 145, 36, true),
  activity("w3-long", 15, "Long run", 90, 95, 14.8, 143, 84, true),
  activity("w3-recovery", 13, "Recovery run", 32, 35, 5.1, null, 18, true),
  activity("w2-unplanned", 11, "Unplanned run", null, 40, 6.2, 138, 24, false),
  activity("w2-steady", 9, "Steady run", 50, 53, 8.4, 146, 42, true),
  activity("w2-long", 7, "Long run", 95, 100, 15.5, 144, null, true, "removed"),
  activity("w2-recovery", 5, "Recovery run", 34, 37, 5.4, null, 20, true, "removal_pending"),
  activity("w1-unplanned", 4, "Unplanned run", 40, 43, null, 139, 28, false),
  activity("w1-steady", 2, "Steady run", 52, 55, 8.8, 147, 44, true),
  activity("w1-long", 0, "Long run", 100, 105, 16.2, 145, 96, true, "available", 5),
]);

export async function createRunnerDesignProfilePlan(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const authoringInput = buildAiGeneratedRunningPlanQaFixtureAuthoringInput(asOfDate);
  const baseline = buildFirstTimeRunnerBaselineReadback({
    age: 36,
    weightKg: 72,
    heightCm: 178,
    fitnessLevel: "running_regularly",
  });
  await updateUserSettingsForUserId(input.userId, {
    firstName: "QA",
    lastName: "Runner",
    displayName: "QA Saved Plan",
    age: baseline.age,
    weightKg: baseline.weightKg,
    heightCm: baseline.heightCm,
    fitnessLevel: baseline.fitnessLevel!,
    calendarTimezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
    heartRateProfile: {
      zones: baseline.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
    },
  });

  let providerDispatchCount = 0;
  const reviewed = await withLocalDesignFixtureEnv(async () =>
    buildReviewedAiGeneratedRunningPlanPreviewForUser(
      input.userId,
      {
        age: 36,
        heightCm: 178,
        weightKg: 72,
        runnerLevel: "runs_a_lot",
        daysPerWeek: 4,
        fixedRestDays: ["Wednesday", "Friday", "Sunday"],
        preferredLongRunDay: "Saturday",
        startDate: authoringInput.schedule.startDate,
        benchmark: { kind: "recent_5k_pace", recent5kPace: "5:30" },
        runnerComment: undefined,
        planGoalIntent: {
          distance: { kind: "preset", preset: "10K" },
          targetDate: authoringInput.planGoalIntent.targetDate!,
        },
      },
      {
        qaFixtureAuthorized: true,
        aiPreview: {
          apiKey: "local-design-profile-provider-tripwire",
          model: "local-design-profile-provider-tripwire",
          fetchImpl: async () => {
            providerDispatchCount += 1;
            throw new Error("Runner design profile reached a paid provider transport.");
          },
          generationLedger: { disabled: true },
        },
      },
    ),
  );
  assert.equal(reviewed.ok, true, reviewed.ok ? "" : reviewed.unavailable.error.message);
  if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
  assert.equal(reviewed.draft.callsOpenAi, false);
  assert.equal(reviewed.draft.aiGeneration.model, AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL);
  assert.equal(
    reviewed.draft.aiGeneration.responseId,
    AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  );
  assert.equal(providerDispatchCount, 0);

  assert.ok(reviewed.savedPlanId, "The fixture candidate must be retained before materialization.");
  const historicalMaterializationInstant = new Date(
    `${reviewed.draft.canonicalPlan.start_date}T12:00:00`,
  );
  const materialized = await materializeSourceWorkoutBatchForFixture({
    userId: input.userId,
    canonicalPlan: reviewed.draft.canonicalPlan,
    sourcePlanId: reviewed.savedPlanId,
    calendarInstant: historicalMaterializationInstant,
  });
  assert.equal(materialized.ok, true);
  assert.equal(providerDispatchCount, 0);

  const sourcePlan = await input.supabase
    .from("plan_cycles")
    .select("id, start_date, end_date, goal_metadata, saved_plan_payload, source_kind")
    .eq("user_id", input.userId)
    .eq("status", "archived")
    .eq("id", reviewed.savedPlanId)
    .not("saved_plan_payload", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (sourcePlan.error) throw new Error(sourcePlan.error.message);
  const workouts = await input.supabase
    .from("planned_workouts")
    .select(
      "id, plan_cycle_id, origin_kind, source_workout_id, workout_date, workout_type, source_workout_type, title, steps",
    )
    .eq("user_id", input.userId)
    .eq("plan_cycle_id", sourcePlan.data.id)
    .order("workout_date", { ascending: true });
  if (workouts.error) throw new Error(workouts.error.message);

  return {
    sourcePlanId: sourcePlan.data.id,
    startDate: sourcePlan.data.start_date,
    endDate: sourcePlan.data.end_date,
    reviewChecksum: reviewed.draft.reviewChecksum,
    canonicalRowCount: reviewed.draft.canonicalRowCount,
    providerDispatchCount,
    workouts: workouts.data,
  };
}

export async function seedAdaptiveBlueprintProjectionFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
  continuationProof?: boolean;
  goalPreset?: "10K" | "Half Marathon";
  targetDate?: string;
  runtimeScope?: "local_proof" | "hosted_ui_replay";
}) {
  const prepared = await prepareAdaptiveInitialPlanReviewFixture(input);
  const { asOfDate, initialStartDate, reviewed } = prepared;

  const confirmed = await confirmRunningPlanDraftForUser(
    input.userId,
    {
      previewInput: reviewed.draft.previewInput,
      sourceKind: reviewed.draft.sourceKind,
      reviewToken: reviewed.draft.reviewToken,
      reviewChecksum: reviewed.draft.reviewChecksum,
    },
    {
      allowLocalQaFixture: true,
      localQaFixtureCurrentDate:
        input.continuationProof && input.goalPreset !== "Half Marathon"
          ? initialStartDate
          : undefined,
    },
  );
  assert.equal(confirmed.ok, true, JSON.stringify(confirmed));
  if (!confirmed.ok) throw new Error(confirmed.message);
  assert.equal(confirmed.blueprintId, reviewed.draft.sourceCandidate.blueprintId);
  assert.equal(confirmed.detailedCandidateId, reviewed.draft.sourceCandidate.candidateId);
  assert.equal(confirmed.calendarRowCount, 28);

  if (input.continuationProof) {
    const evidenceCutoffDate = addDaysIso(initialStartDate, 13);
    const dueWorkouts = await input.supabase
      .from("planned_workouts")
      .select("*")
      .eq("user_id", input.userId)
      .neq("workout_type", "rest")
      .gte("workout_date", initialStartDate)
      .lte("workout_date", evidenceCutoffDate)
      .order("workout_date", { ascending: true });
    if (dueWorkouts.error) throw new Error(dueWorkouts.error.message);
    assert.equal(dueWorkouts.data.length, 8, "The continuation fixture requires eight outcomes.");
    const fitWorkouts = selectCompatibleAdaptiveFitWorkouts(dueWorkouts.data);
    const fitWorkoutIds = new Set(fitWorkouts.map((workout) => workout.id));
    for (const workout of dueWorkouts.data) {
      await saveWorkoutLogForUser(input.userId, {
        plannedWorkoutId: workout.id,
        outcome: "completed",
        actualDistanceKm: null,
        actualDurationMin: null,
        rpe: fitWorkoutIds.has(workout.id) ? 4 : null,
        notes: null,
        intervalsCompleted: null,
        bodyNotes: [],
      });
    }
    await retainAdaptiveContinuationFitEvidence({
      supabase: input.supabase,
      userId: input.userId,
      workouts: fitWorkouts,
    });
  }

  const fixture = await readAdaptiveBlueprintProjectionFixture({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate,
  });
  if (input.continuationProof) {
    assert.equal(fixture.continuation.dataQuality?.dueWorkoutCount, 8);
    assert.equal(fixture.continuation.dataQuality?.resolvedOutcomeCount, 8);
    assert.equal(fixture.continuation.dataQuality?.fitCurrentCount, 2);
    assert.equal(fixture.continuation.dataQuality?.completedWithoutFitCount, 6);
  }
  return fixture;
}

async function prepareAdaptiveInitialPlanReviewFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
  continuationProof?: boolean;
  goalPreset?: "10K" | "Half Marathon";
  targetDate?: string;
  runtimeScope?: "local_proof" | "hosted_ui_replay";
  fixtureScenario?: "camelot";
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const initialStartDate = input.continuationProof ? addDaysIso(asOfDate, -14) : asOfDate;
  const targetDate =
    input.targetDate ?? (input.continuationProof ? addDaysIso(initialStartDate, 69) : undefined);
  const baseline = buildFirstTimeRunnerBaselineReadback({
    age: 36,
    weightKg: 72,
    heightCm: 178,
    fitnessLevel: "running_regularly",
  });
  await updateUserSettingsForUserId(input.userId, {
    firstName: "QA",
    lastName: "Adaptive",
    displayName: "QA Adaptive Blueprint",
    age: baseline.age,
    weightKg: baseline.weightKg,
    heightCm: baseline.heightCm,
    fitnessLevel: baseline.fitnessLevel!,
    calendarTimezone: "UTC",
    heartRateProfile: {
      zones: baseline.heartRateZones.zones.map(({ reference, minBpm, maxBpm }) => ({
        reference,
        minBpm,
        maxBpm,
      })),
    },
  });

  const previewInput = {
    age: 36,
    heightCm: 178,
    weightKg: 72,
    runnerLevel: "runs_a_lot" as const,
    daysPerWeek: 4,
    fixedRestDays: ["Wednesday", "Friday", "Sunday"],
    preferredLongRunDay: "Saturday" as const,
    startDate: initialStartDate,
    benchmark: { kind: "recent_5k_pace" as const, recent5kPace: "5:30" },
    runnerComment: undefined,
    planGoalIntent: {
      distance: {
        kind: "preset" as const,
        preset: input.goalPreset ?? ("10K" as const),
      },
      targetDate,
    },
  };
  const proofProfile = buildProofInitialPlanProfile(previewInput);
  const authoring = buildAiGeneratedRunningPlanAuthoringInput(
    previewInput,
    proofProfile.initialPlanProfile,
    proofProfile.acceptedHeartRateProfile,
  );
  assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
  if (!authoring.ok) throw new Error(authoring.message);

  const reviewed = await withAdaptiveBlueprintFixtureEnv(
    () =>
      buildReviewedAiGeneratedRunningPlanPreviewForUser(input.userId, previewInput, {
        qaFixtureAuthorized: true,
        localQaFixtureCurrentDate: initialStartDate,
        aiPreview: {
          apiKey: "local-adaptive-blueprint-fixture",
          model: ADAPTIVE_INITIAL_PLAN_QA_FIXTURE_MODEL,
          fetchImpl: buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
            authoringInput: authoring.authoringInput,
            today: initialStartDate,
            ...(input.fixtureScenario
              ? {
                  env: {
                    ...process.env,
                    HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
                    HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "qa_fixture",
                    HITO_AI_GENERATED_PLAN_DEV_FIXTURE_SCENARIO: input.fixtureScenario,
                  },
                }
              : {}),
          }),
          generationLedger: { disabled: true },
        },
      }),
    { allowHostedUiReplay: input.runtimeScope === "hosted_ui_replay" },
  );
  assert.equal(reviewed.ok, true, reviewed.ok ? "" : JSON.stringify(reviewed.unavailable.error));
  if (!reviewed.ok) throw new Error(reviewed.unavailable.error.message);
  assert.ok(reviewed.draft.sourceCandidate, "The adaptive fixture candidate must be retained.");
  assert.equal(reviewed.draft.canonicalRowCount, 28);
  assert.equal(reviewed.draft.blueprint.detailedHorizon.calendarWeekCount, 4);
  assert.equal(
    reviewed.draft.aiGeneration.responseId,
    input.goalPreset === "Half Marathon"
      ? "local-dev-ai-plan-first-half-marathon"
      : AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  );
  return { asOfDate, initialStartDate, reviewed };
}

function selectCompatibleAdaptiveFitWorkouts(
  workouts: readonly FixturePlannedWorkout[],
): [FixturePlannedWorkout, FixturePlannedWorkout] {
  const byType = new Map<string, FixturePlannedWorkout[]>();
  for (const workout of workouts) {
    const group = byType.get(workout.workout_type) ?? [];
    group.push(workout);
    byType.set(workout.workout_type, group);
  }
  const compatible = [...byType.values()].find((group) => group.length >= 2);
  assert.ok(compatible, "The continuation fixture requires two comparable workout dates.");
  return [compatible[0]!, compatible[1]!];
}

async function retainAdaptiveContinuationFitEvidence(input: {
  supabase: SupabaseClient;
  userId: string;
  workouts: readonly [FixturePlannedWorkout, FixturePlannedWorkout];
}) {
  for (const [index, workout] of input.workouts.entries()) {
    const spec: FixtureActivitySpec = {
      key: `adaptive-continuation-fit-${index + 1}`,
      daysAgo: 0,
      title: `Adaptive continuation factual run ${index + 1}`,
      timerDurationMin: 42 + index * 3,
      elapsedDurationMin: 43 + index * 3,
      distanceKm: 7 + index * 0.5,
      averageHeartRate: 142 + index,
      elevationGainM: 35 + index * 5,
      planned: true,
      sourceState: "available",
      sessionRpe: 4,
      runningContext: null,
    };
    await persistAdaptiveFixtureActivityEvidence({ ...input, workout, spec });
  }
}

async function persistAdaptiveFixtureActivityEvidence(input: {
  supabase: SupabaseClient;
  userId: string;
  workout: FixturePlannedWorkout;
  spec: FixtureActivitySpec;
}) {
  const fileBuffer = buildFixtureSource(input.spec, input.workout.workout_date);
  const storagePath = `${input.userId}/${ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION}/${input.workout.workout_date}-${input.spec.key}.fit`;
  const assetId = randomUUID();
  const stored = await input.supabase.storage
    .from(WORKOUT_RESULT_STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "application/octet-stream",
      upsert: true,
    });
  if (stored.error) throw new Error(stored.error.message);

  const asset = await input.supabase
    .from("workout_result_assets")
    .insert({
      id: assetId,
      user_id: input.userId,
      planned_workout_id: input.workout.id,
      asset_kind: "garmin_fit",
      storage_bucket: WORKOUT_RESULT_STORAGE_BUCKET,
      storage_path: storagePath,
      original_file_name: `${input.spec.key}.fit`,
      mime_type: "application/octet-stream",
      file_size_bytes: fileBuffer.length,
      parse_status: "uploaded",
    })
    .select("id")
    .single();
  if (asset.error) {
    await input.supabase.storage.from(WORKOUT_RESULT_STORAGE_BUCKET).remove([storagePath]);
    throw new Error(asset.error.message);
  }

  try {
    const parsedWorkout = await parseGarminFitActivity(fileBuffer);
    assertParsedFixtureSource(parsedWorkout, input.spec, input.workout.workout_date);
    const receipt = await persistGarminFitActivitySource({
      userId: input.userId,
      assetKind: "garmin_fit",
      storageBucket: WORKOUT_RESULT_STORAGE_BUCKET,
      storagePath,
      originalFileName: `${input.spec.key}.fit`,
      mimeType: "application/octet-stream",
      fileSizeBytes: fileBuffer.length,
      fileBuffer,
      parsedWorkout,
      sourceCapabilities: {
        fixture_class: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
        generated_local_qa_fit: true,
        reprocessable: true,
        normalized_samples_persisted: false,
      },
    });
    const activityProjection = await readRunnerActivityProjection({
      userId: input.userId,
      activityId: receipt.activityId,
      activityRevisionId: receipt.activityRevisionId,
    });
    await reconcileWorkoutResultProjection({
      userId: input.userId,
      plannedWorkout: input.workout,
      workoutLogId: null,
      activitySource: receipt,
      activityProjection,
      candidateAssetId: assetId,
      candidateStoragePath: storagePath,
      primaryFile: {
        primaryFileKind: "fit",
        primaryFileName: `${input.spec.key}.fit`,
        fileBuffer,
      },
      initialParseStatus: "uploaded",
    });
    return receipt;
  } catch (error) {
    await input.supabase.storage.from(WORKOUT_RESULT_STORAGE_BUCKET).remove([storagePath]);
    throw error;
  }
}

export async function readAdaptiveBlueprintProjectionFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const currentState = await getAdaptiveTrainingContinuationSourceStateForUser(input.userId);
  if (!currentState) {
    throw new Error("The adaptive fixture requires one current confirmed Blueprint lineage.");
  }
  const [blueprints, candidates, confirmations, readModel, repeatedReadModel] = await Promise.all([
    input.supabase
      .from("adaptive_training_blueprint_versions")
      .select("id, version, content_sha256")
      .eq("user_id", input.userId)
      .eq("id", currentState.blueprint.id),
    input.supabase
      .from("adaptive_training_detailed_candidates")
      .select("id, blueprint_id, version, candidate_sha256")
      .eq("user_id", input.userId)
      .eq("blueprint_id", currentState.blueprint.id)
      .order("version", { ascending: true }),
    input.supabase
      .from("adaptive_training_block_confirmations")
      .select(
        "id, blueprint_id, detailed_candidate_id, block_mode, interval_start_date, interval_end_date, calendar_workout_ids",
      )
      .eq("user_id", input.userId)
      .eq("blueprint_id", currentState.blueprint.id)
      .order("interval_start_date", { ascending: true }),
    getAdaptiveBlueprintCalendarReadModelForUser(input.userId, asOfDate),
    getAdaptiveBlueprintCalendarReadModelForUser(input.userId, asOfDate),
  ]);
  if (blueprints.error) throw new Error(blueprints.error.message);
  if (candidates.error) throw new Error(candidates.error.message);
  if (confirmations.error) throw new Error(confirmations.error.message);
  assert.equal(blueprints.data.length, 1, "The adaptive fixture requires one Blueprint version.");
  assert.ok(candidates.data.length >= 1, "The adaptive fixture requires a detailed candidate.");
  assert.ok(confirmations.data.length >= 1, "The adaptive fixture requires a confirmation.");
  assert.deepEqual(
    repeatedReadModel,
    readModel,
    "Adaptive projection readback must preserve stable identities.",
  );

  const blueprint = blueprints.data[0]!;
  const initialConfirmation = confirmations.data[0]!;
  const latestConfirmation = confirmations.data.at(-1)!;
  const initialCandidate = candidates.data.find(
    (candidate) => candidate.id === initialConfirmation.detailed_candidate_id,
  );
  assert.ok(initialCandidate, "The adaptive fixture requires its initial detailed candidate.");
  assert.equal(initialCandidate.blueprint_id, blueprint.id);
  assert.ok(confirmations.data.every((confirmation) => confirmation.blueprint_id === blueprint.id));
  assert.equal(initialConfirmation.block_mode, "initial_four_week");
  assert.equal(initialConfirmation.calendar_workout_ids.length, 28);

  const projectionIds = readModel.projections.map((projection) => projection.projectionId);
  assert.equal(new Set(projectionIds).size, projectionIds.length);
  const projectionStatuses = [
    ...new Set(readModel.projections.map((projection) => projection.status)),
  ];
  for (const projection of readModel.projections) {
    assert.deepEqual(Object.keys(projection).sort(), [...ADAPTIVE_BLUEPRINT_PROJECTION_KEYS]);
    assert.deepEqual(Object.keys(projection.blueprint).sort(), ["id", "sha256", "version"]);
    assert.deepEqual(Object.keys(projection.capabilities).sort(), [
      "canAttachResultOrEvidence",
      "canExpressSchedulingPreference",
      "canMutateWorkout",
      "canOpenWorkout",
    ]);
    assert.equal(projection.blueprint.id, blueprint.id);
    assert.ok(projection.date > latestConfirmation.interval_end_date);
    assert.equal(projection.capabilities.canOpenWorkout, false);
    assert.equal(projection.capabilities.canMutateWorkout, false);
    assert.equal(projection.capabilities.canAttachResultOrEvidence, false);
  }

  const projectionDates = readModel.projections.map((projection) => projection.date);
  let projectionCalendarRows: Array<{ id: string; workout_date: string }> = [];
  if (projectionDates.length > 0) {
    const result = await input.supabase
      .from("planned_workouts")
      .select("id, workout_date")
      .eq("user_id", input.userId)
      .in("workout_date", projectionDates);
    if (result.error) throw new Error(result.error.message);
    projectionCalendarRows = result.data;
  }
  assert.deepEqual(
    projectionCalendarRows,
    [],
    "Future Source projections must not materialize Calendar rows.",
  );
  assert.doesNotMatch(
    JSON.stringify(readModel.projections),
    /calendarWorkoutId|plannedWorkoutId|workoutDocument|prescription|segments|targetKind|mutationToken/i,
  );

  return {
    fixtureVersion: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
    role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
    asOfDate,
    userId: input.userId,
    source: {
      blueprintId: blueprint.id,
      blueprintVersion: blueprint.version,
      blueprintSha256: blueprint.content_sha256,
      detailedCandidateId: initialCandidate.id,
      detailedCandidateVersion: initialCandidate.version,
      detailedCandidateSha256: initialCandidate.candidate_sha256,
      confirmationId: initialConfirmation.id,
      confirmationCount: confirmations.data.length,
      latestConfirmationId: latestConfirmation.id,
      latestBlockMode: latestConfirmation.block_mode,
      confirmedCalendarWorkoutCount: confirmations.data.reduce(
        (count, confirmation) => count + confirmation.calendar_workout_ids.length,
        0,
      ),
      confirmedInterval: {
        startDate: latestConfirmation.interval_start_date,
        endDate: latestConfirmation.interval_end_date,
      },
    },
    projections: {
      count: readModel.projections.length,
      status:
        readModel.projections.length === 0
          ? ("confirmed_horizon_complete" as const)
          : projectionStatuses.length === 1
            ? projectionStatuses[0]!
            : ("mixed" as const),
      statuses: projectionStatuses,
      stableIds: true,
      firstDate: readModel.projections[0]?.date ?? null,
      lastDate: readModel.projections.at(-1)?.date ?? null,
      exactPublicFields: [...ADAPTIVE_BLUEPRINT_PROJECTION_KEYS],
      calendarRowCount: projectionCalendarRows.length,
      executableFieldsExposed: false,
    },
    continuation: {
      status: readModel.continuation.status,
      reasons: [...readModel.continuation.reasons],
      dataQuality: readModel.continuation.context?.dataQuality ?? null,
    },
  };
}

export async function confirmAdaptiveBlueprintContinuationFixture(input: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const initial = await readAdaptiveBlueprintProjectionFixture(input);
  const storedAuthoringInput = await getAdaptiveTrainingOriginalAuthoringInputForUser({
    userId: input.userId,
    blueprintId: initial.source.blueprintId,
  });
  const parsedAuthoringInput = structuredPlanAuthoringInputSchema.parse(storedAuthoringInput);
  const { requestContext: _requestContext, ...authoringInput } = parsedAuthoringInput;
  const prepareContinuationCandidate = (asOfDate: string) =>
    prepareAdaptiveContinuationCandidateForUser(
      { userId: input.userId, asOfDate },
      {
        requestStructuredResponse: ({ prompt, brief }) => {
          providerDispatchCount += 1;
          return requestAiPlanStructuredResponse({
            apiKey: "local-adaptive-continuation-fixture",
            model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
            prompt,
            responseSchemaName: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
            contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
            responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
            fetchImpl: buildAiGeneratedContinuationDevFixtureOpenAiFetch({
              authoringInput,
              brief,
            }),
            generationLedger: { disabled: true },
          });
        },
      },
    );
  let providerDispatchCount = 0;
  assert.equal(
    initial.source.confirmationCount,
    1,
    "Continuation proof requires one initial block.",
  );
  assert.equal(initial.source.latestBlockMode, "initial_four_week");
  assert.ok(
    initial.projections.count > 0,
    "Continuation proof requires future Source projections.",
  );

  const readinessDate = addDaysIso(initial.source.confirmedInterval.endDate, -13);
  const evidenceCutoffDate = addDaysIso(initial.source.confirmedInterval.startDate, 13);
  const seededDueWorkouts = await input.supabase
    .from("planned_workouts")
    .select("id")
    .eq("user_id", input.userId)
    .neq("workout_type", "rest")
    .lte("workout_date", evidenceCutoffDate);
  if (seededDueWorkouts.error) throw new Error(seededDueWorkouts.error.message);
  if (seededDueWorkouts.data.length > 0) {
    const clearedSeedOutcomes = await input.supabase
      .from("workout_logs")
      .delete()
      .eq("user_id", input.userId)
      .in(
        "planned_workout_id",
        seededDueWorkouts.data.map((workout) => workout.id),
      );
    if (clearedSeedOutcomes.error) throw new Error(clearedSeedOutcomes.error.message);
  }
  const beforeCheckIn = await getAdaptiveBlueprintCalendarReadModelForUser(
    input.userId,
    readinessDate,
  );
  assert.equal(beforeCheckIn.continuation.status, "check_in_needed");
  const noPrescription = await prepareContinuationCandidate(readinessDate);
  assert.equal(noPrescription.ok, false);
  assert.equal(providerDispatchCount, 0, "No-prescription must make zero provider requests.");

  const unresolvedRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
    userId: input.userId,
    blueprint: {
      id: initial.source.blueprintId,
      version: initial.source.blueprintVersion,
      sha256: initial.source.blueprintSha256,
    },
    activeProjectionPreferences: [],
    horizonCheckIn: {
      confirmationId: initial.source.confirmationId,
      goalAssumptionCurrent: true,
      availabilityConfirmed: true,
      manageability: "manageable",
      materialChangeReason: "The disposable fixture proves an unresolved interruption gate.",
      healthLimitation: "no",
      interruptionStatus: "unresolved",
      clinicianGuidance: "not_applicable",
    },
  });
  const unresolved = await getAdaptiveBlueprintCalendarReadModelForUser(
    input.userId,
    readinessDate,
  );
  assert.equal(unresolved.continuation.status, "not_ready");
  assert.ok(unresolved.continuation.reasons.includes("interruption_unresolved"));

  const checkInRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
    userId: input.userId,
    blueprint: {
      id: initial.source.blueprintId,
      version: initial.source.blueprintVersion,
      sha256: initial.source.blueprintSha256,
    },
    activeProjectionPreferences: [],
    horizonCheckIn: {
      confirmationId: initial.source.confirmationId,
      goalAssumptionCurrent: true,
      availabilityConfirmed: true,
      manageability: "manageable",
      materialChangeReason: null,
      healthLimitation: "no",
      interruptionStatus: "none",
      clinicianGuidance: "not_applicable",
    },
  });
  assert.equal(checkInRevision.supersedesRevision, unresolvedRevision.revision);

  const unresolvedOutcomes = await getAdaptiveBlueprintCalendarReadModelForUser(
    input.userId,
    readinessDate,
  );
  assert.equal(unresolvedOutcomes.continuation.status, "not_ready");
  assert.ok(unresolvedOutcomes.continuation.reasons.includes("calendar_outcome_unresolved"));

  const dueWorkouts = await input.supabase
    .from("planned_workouts")
    .select("id, workout_date, workout_type")
    .eq("user_id", input.userId)
    .neq("workout_type", "rest")
    .lte("workout_date", evidenceCutoffDate)
    .order("workout_date", { ascending: true });
  if (dueWorkouts.error) throw new Error(dueWorkouts.error.message);
  assert.ok(dueWorkouts.data.length > 0, "Continuation proof requires due factual outcomes.");
  for (const workout of dueWorkouts.data) {
    await saveWorkoutLogForUser(input.userId, {
      plannedWorkoutId: workout.id,
      outcome: "completed",
      actualDistanceKm: null,
      actualDurationMin: null,
      rpe: null,
      notes: null,
      intervalsCompleted: null,
      bodyNotes: [],
    });
  }

  const bridgeRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
    userId: input.userId,
    blueprint: {
      id: initial.source.blueprintId,
      version: initial.source.blueprintVersion,
      sha256: initial.source.blueprintSha256,
    },
    activeProjectionPreferences: [],
    horizonCheckIn: {
      confirmationId: initial.source.confirmationId,
      goalAssumptionCurrent: true,
      availabilityConfirmed: true,
      manageability: "manageable",
      materialChangeReason: "The disposable fixture proves one resolved interruption bridge.",
      healthLimitation: "no",
      interruptionStatus: "resolved",
      clinicianGuidance: "permits_running",
    },
  });
  const bridgePrepared = await prepareContinuationCandidate(readinessDate);
  assert.equal(bridgePrepared.ok, true, JSON.stringify(bridgePrepared));
  assert.equal(bridgePrepared.state.status, "candidate_ready");
  if (!bridgePrepared.ok || bridgePrepared.state.status !== "candidate_ready") {
    throw new Error("The fixture bridge candidate is unavailable.");
  }
  assert.equal(bridgePrepared.state.window.blockMode, "resolved_interruption_bridge");
  const bridgeReview = await reviewWorkoutCommandForUser(
    input.userId,
    {
      operation: "materialize_source_candidate",
      source: {
        kind: "adaptive_continuation_candidate",
        candidateId: bridgePrepared.state.candidate.id,
      },
    },
    { adaptiveContinuationAsOfDate: readinessDate },
  );
  assert.equal(bridgeReview.ok, true, JSON.stringify(bridgeReview));
  if (!bridgeReview.ok) throw new Error(bridgeReview.issues[0]?.message ?? "Bridge review failed.");

  const currentRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
    userId: input.userId,
    blueprint: {
      id: initial.source.blueprintId,
      version: initial.source.blueprintVersion,
      sha256: initial.source.blueprintSha256,
    },
    activeProjectionPreferences: [],
    horizonCheckIn: {
      confirmationId: initial.source.confirmationId,
      goalAssumptionCurrent: true,
      availabilityConfirmed: true,
      manageability: "manageable",
      materialChangeReason: null,
      healthLimitation: "no",
      interruptionStatus: "none",
      clinicianGuidance: "not_applicable",
    },
  });
  assert.equal(currentRevision.supersedesRevision, bridgeRevision.revision);
  const staleBridge = await confirmWorkoutCommandForUser(
    input.userId,
    {
      command: bridgeReview.candidate.command,
      candidateId: bridgeReview.candidate.candidateId,
      reviewToken: bridgeReview.candidate.reviewToken,
      reviewChecksum: bridgeReview.candidate.reviewChecksum,
    },
    { adaptiveContinuationAsOfDate: readinessDate },
  );
  assert.equal(staleBridge.ok, false);
  if (!staleBridge.ok) assert.equal(staleBridge.reason, "stale_review");

  const prepared = await prepareContinuationCandidate(readinessDate);
  assert.equal(prepared.ok, true, JSON.stringify(prepared));
  assert.equal(prepared.state.status, "candidate_ready");
  if (!prepared.ok || prepared.state.status !== "candidate_ready") {
    throw new Error("The fixture continuation candidate is unavailable.");
  }
  assert.equal(prepared.state.window.blockMode, "normal_four_week");

  const review = await reviewWorkoutCommandForUser(
    input.userId,
    {
      operation: "materialize_source_candidate",
      source: {
        kind: "adaptive_continuation_candidate",
        candidateId: prepared.state.candidate.id,
      },
    },
    { adaptiveContinuationAsOfDate: readinessDate },
  );
  assert.equal(review.ok, true, JSON.stringify(review));
  if (!review.ok) throw new Error(review.issues[0]?.message ?? "Continuation review failed.");

  const confirmed = await confirmWorkoutCommandForUser(
    input.userId,
    {
      command: review.candidate.command,
      candidateId: review.candidate.candidateId,
      reviewToken: review.candidate.reviewToken,
      reviewChecksum: review.candidate.reviewChecksum,
    },
    { adaptiveContinuationAsOfDate: readinessDate },
  );
  assert.equal(confirmed.ok, true, JSON.stringify(confirmed));
  if (!confirmed.ok) throw new Error(confirmed.message);

  const afterNormal = await readAdaptiveBlueprintProjectionFixture({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate: readinessDate,
  });
  assert.equal(afterNormal.source.confirmationCount, 2);
  assert.equal(afterNormal.source.latestBlockMode, "normal_four_week");
  assert.equal(
    afterNormal.projections.count,
    initial.projections.count - review.candidate.command.documents.length,
    "Only projections outside the confirmed normal block may remain Source intent.",
  );
  assert.ok(
    afterNormal.projections.firstDate === null ||
      afterNormal.projections.firstDate > afterNormal.source.confirmedInterval.endDate,
  );

  const targetReadinessDate = addDaysIso(afterNormal.source.confirmedInterval.endDate, -13);
  const targetEvidenceCutoffDate = addDaysIso(afterNormal.source.confirmedInterval.startDate, 13);
  const targetDueWorkouts = await input.supabase
    .from("planned_workouts")
    .select("id, workout_date, workout_type")
    .eq("user_id", input.userId)
    .neq("workout_type", "rest")
    .lte("workout_date", targetEvidenceCutoffDate)
    .order("workout_date", { ascending: true });
  if (targetDueWorkouts.error) throw new Error(targetDueWorkouts.error.message);
  for (const workout of targetDueWorkouts.data) {
    await saveWorkoutLogForUser(input.userId, {
      plannedWorkoutId: workout.id,
      outcome: "completed",
      actualDistanceKm: null,
      actualDurationMin: null,
      rpe: null,
      notes: null,
      intervalsCompleted: null,
      bodyNotes: [],
    });
  }
  await retainAdaptiveTrainingContinuationInputRevisionForUser({
    userId: input.userId,
    blueprint: {
      id: initial.source.blueprintId,
      version: initial.source.blueprintVersion,
      sha256: initial.source.blueprintSha256,
    },
    activeProjectionPreferences: [],
    horizonCheckIn: {
      confirmationId: afterNormal.source.latestConfirmationId,
      goalAssumptionCurrent: true,
      availabilityConfirmed: true,
      manageability: "manageable",
      materialChangeReason: null,
      healthLimitation: "no",
      interruptionStatus: "none",
      clinicianGuidance: "not_applicable",
    },
  });
  const targetPrepared = await prepareContinuationCandidate(targetReadinessDate);
  assert.equal(targetPrepared.ok, true, JSON.stringify(targetPrepared));
  assert.equal(targetPrepared.state.status, "candidate_ready");
  if (!targetPrepared.ok || targetPrepared.state.status !== "candidate_ready") {
    throw new Error("The fixture target/taper discriminator is unavailable.");
  }
  assert.equal(targetPrepared.state.window.blockMode, "target_taper_boundary");

  const reloaded = await readAdaptiveBlueprintProjectionFixture({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate: targetReadinessDate,
  });
  assert.equal(reloaded.source.confirmationCount, 2);
  assert.equal(reloaded.source.latestBlockMode, "normal_four_week");
  assert.equal(reloaded.projections.count, afterNormal.projections.count);

  return {
    fixtureVersion: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
    role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
    readinessDate,
    evidenceCutoffDate,
    discriminators: {
      missingCheckIn: beforeCheckIn.continuation.status,
      unresolvedInterruption: unresolved.continuation.reasons,
      unresolvedOutcomes: unresolvedOutcomes.continuation.reasons,
      preparedMode: prepared.state.window.blockMode,
      bridgeMode: bridgePrepared.state.window.blockMode,
      staleBridgeRejected: !staleBridge.ok,
      targetMode: targetPrepared.state.window.blockMode,
      targetMissingReasons: targetPrepared.state.reasons,
      noPrescriptionProviderDispatchCount: 0,
      injectedStructuredResponseCount: providerDispatchCount,
      externalProviderDispatchCount: 0,
    },
    inputRevisions: {
      unresolved: unresolvedRevision.revision,
      initialCurrent: checkInRevision.revision,
      bridge: bridgeRevision.revision,
      current: currentRevision.revision,
    },
    dueOutcomeCount: dueWorkouts.data.length,
    reviewedCandidateId: prepared.state.candidate.id,
    confirmation: {
      explicit: true,
      confirmationCount: reloaded.source.confirmationCount,
      latestConfirmationId: reloaded.source.latestConfirmationId,
      blockMode: reloaded.source.latestBlockMode,
      calendarWorkoutCount: reloaded.source.confirmedCalendarWorkoutCount,
    },
    projections: reloaded.projections,
  };
}

export async function seedAdaptiveEngineUiReplayFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
  runtimeScope: "local_proof" | "hosted_ui_replay";
  checkpoint?: AdaptiveEngineUiReplayCheckpoint;
  fixtureScenario?: "camelot";
}) {
  const checkpoint = input.checkpoint ?? "complete_surface";
  const provenance = adaptiveEngineUiReplayProvenance(input.runtimeScope, checkpoint);
  if (checkpoint === "initial_plan_review") {
    const prepared = await prepareAdaptiveInitialPlanReviewFixture({
      ...input,
      continuationProof: false,
      goalPreset: "10K",
      targetDate: addDaysIso(normalizeAsOfDate(input.asOfDate), 84),
      fixtureScenario: input.fixtureScenario,
    });
    const sourceCandidate = prepared.reviewed.draft.sourceCandidate;
    assert.ok(sourceCandidate);
    const listed = await listSavedPlanReviewsForUser(input.userId);
    assert.equal(listed.records.length, 1);
    assert.deepEqual(listed.records[0]?.candidate, {
      id: sourceCandidate.candidateId,
      version: sourceCandidate.candidateVersion,
      sha256: sourceCandidate.candidateSha256,
    });
    assert.deepEqual(listed.records[0]?.validity, { state: "current", reason: null });
    const restored = await restoreSavedPlanReviewForUser(input.userId, {
      candidateId: sourceCandidate.candidateId,
      candidateVersion: sourceCandidate.candidateVersion,
    });
    assert.equal(restored.ok, true);
    assert.equal(restored.ok && restored.status, "review_ready");
    assert.equal(
      restored.ok && restored.status === "review_ready" && restored.review.workoutDocuments.length,
      28,
    );
    assert.equal(
      restored.ok &&
        restored.status === "review_ready" &&
        restored.review.savedPlanReviewCandidate?.id,
      sourceCandidate.candidateId,
    );
    if (!restored.ok || restored.status !== "review_ready") {
      throw new Error("The saved generated-plan review is not confirmable.");
    }
    const directConfirmInput: RunningPlanConfirmActionInput = {
      previewInput: restored.review.previewInput,
      sourceKind: restored.review.sourceKind,
      reviewToken: restored.review.reviewToken,
      reviewChecksum: restored.review.reviewChecksum,
    };
    assert.deepEqual(directConfirmInput.previewInput, restored.review.previewInput);
    assert.doesNotMatch(
      JSON.stringify(restored),
      /raw_response|provider_response_id|response_sha256|input_snapshot|input_provenance|request_context|version_context|running_coach_verdict|qa_verdict/i,
    );
    return {
      fixtureVersion: ADAPTIVE_ENGINE_UI_REPLAY_FIXTURE_VERSION,
      checkpoint,
      provenance,
      interactionMatrix: {
        uiState: "initial_review_ready" as const,
        initialCandidatePreseeded: true,
        initialCandidateOwner: "saved_plan_generated_review" as const,
        ordinaryAuthoringCoveredBy: "HITO-271" as const,
        expectedControls: [
          "saved_plan_restore",
          "initial_plan_review",
          "initial_plan_confirm",
        ] as const,
        candidate: listed.records[0]?.candidate,
        validity: listed.records[0]?.validity,
      },
      finalState: {
        confirmationCount: 0,
        calendarWorkoutCount: 0,
        projectionCount: 0,
        projectionCalendarRowCount: 0,
        projectionExecutableFieldsExposed: false,
      },
      invariants: adaptiveEngineUiReplayInvariants(0, false),
    };
  }

  const initial = await seedAdaptiveBlueprintProjectionFixture({
    ...input,
    continuationProof: true,
    goalPreset: "10K",
  });
  assert.equal(initial.source.confirmationCount, 1);
  assert.equal(initial.source.confirmedCalendarWorkoutCount, 28);
  const continuationInteraction = await readAdaptiveEngineUiReplayInteractionCheckpoint({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate: input.asOfDate,
    initial,
  });

  if (checkpoint === "continuation_actions") {
    return {
      fixtureVersion: ADAPTIVE_ENGINE_UI_REPLAY_FIXTURE_VERSION,
      checkpoint,
      provenance,
      interactionMatrix: continuationInteraction,
      stages: {
        initial: {
          confirmationCount: initial.source.confirmationCount,
          calendarWorkoutCount: initial.source.confirmedCalendarWorkoutCount,
        },
      },
      finalState: {
        confirmationCount: initial.source.confirmationCount,
        calendarWorkoutCount: initial.source.confirmedCalendarWorkoutCount,
        latestBlockMode: initial.source.latestBlockMode,
        projectionCount: initial.projections.count,
        projectionCalendarRowCount: initial.projections.calendarRowCount,
        projectionExecutableFieldsExposed: initial.projections.executableFieldsExposed,
      },
      invariants: adaptiveEngineUiReplayInvariants(1, true),
    };
  }

  const firstContinuation = await confirmAdaptiveBlueprintContinuationFixture(input);
  assert.equal(firstContinuation.confirmation.confirmationCount, 2);
  assert.equal(firstContinuation.confirmation.calendarWorkoutCount, 45);
  assert.equal(firstContinuation.discriminators.targetMode, "target_taper_boundary");

  const targetReadinessDate = addDaysIso(firstContinuation.readinessDate, 28);
  const targetReadModel = await getAdaptiveBlueprintCalendarReadModelForUser(
    input.userId,
    targetReadinessDate,
  );
  assert.equal(targetReadModel.continuation.status, "candidate_ready");
  assert.equal(targetReadModel.continuation.candidate?.blockMode, "target_taper_boundary");
  const targetCandidateId = targetReadModel.continuation.candidate?.id;
  assert.ok(targetCandidateId, "The UI replay requires one deterministic target/taper candidate.");

  const secondProfile = await confirmAdaptiveBlueprintContinuationProfileFixture({
    supabase: input.supabase,
    userId: input.userId,
    expectedCandidateId: targetCandidateId,
  });
  const finalState = await readAdaptiveBlueprintProjectionFixture({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate: targetReadinessDate,
  });
  assert.equal(finalState.source.confirmationCount, 3);
  assert.equal(finalState.source.latestBlockMode, "target_taper_boundary");
  assert.equal(finalState.source.confirmedCalendarWorkoutCount, 53);
  assert.equal(finalState.projections.calendarRowCount, 0);

  return {
    fixtureVersion: ADAPTIVE_ENGINE_UI_REPLAY_FIXTURE_VERSION,
    checkpoint,
    provenance,
    stages: {
      initial: {
        confirmationCount: initial.source.confirmationCount,
        calendarWorkoutCount: initial.source.confirmedCalendarWorkoutCount,
      },
      firstContinuation: firstContinuation.confirmation,
      secondProfile: {
        confirmation: secondProfile.confirmation,
        evidence: secondProfile.evidence,
        snapshots: secondProfile.snapshots,
      },
    },
    finalState: {
      confirmationCount: finalState.source.confirmationCount,
      calendarWorkoutCount: finalState.source.confirmedCalendarWorkoutCount,
      latestBlockMode: finalState.source.latestBlockMode,
      projectionCount: finalState.projections.count,
      projectionCalendarRowCount: finalState.projections.calendarRowCount,
      projectionExecutableFieldsExposed: finalState.projections.executableFieldsExposed,
    },
    invariants: adaptiveEngineUiReplayInvariants(
      firstContinuation.discriminators.injectedStructuredResponseCount,
      true,
    ),
  };
}

export async function readAdaptiveEngineUiReplayInteractionCheckpoint(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
  initial: Awaited<ReturnType<typeof readAdaptiveBlueprintProjectionFixture>>;
}) {
  assert.equal(input.initial.continuation.status, "check_in_needed");
  assert.ok(input.initial.projections.count > 0);
  const evidenceCutoffDate = addDaysIso(input.initial.source.confirmedInterval.startDate, 13);
  const [workouts, logs] = await Promise.all([
    input.supabase
      .from("planned_workouts")
      .select("id, workout_date, workout_type, title")
      .eq("user_id", input.userId)
      .neq("workout_type", "rest")
      .lte("workout_date", evidenceCutoffDate)
      .order("workout_date", { ascending: true }),
    input.supabase
      .from("workout_logs")
      .select("planned_workout_id, outcome, rpe")
      .eq("user_id", input.userId)
      .eq("outcome", "completed"),
  ]);
  if (workouts.error) throw new Error(workouts.error.message);
  if (logs.error) throw new Error(logs.error.message);
  const fitWorkoutIds = await getFitCompletedPlannedWorkoutIds({
    userId: input.userId,
    plannedWorkoutIds: workouts.data.map((workout) => workout.id),
  });
  const completedLogs = new Map(logs.data.map((log) => [log.planned_workout_id, log]));
  const fitRpeTarget = workouts.data.find((workout) => {
    const log = completedLogs.get(workout.id);
    return log?.outcome === "completed" && log.rpe === null && !fitWorkoutIds.has(workout.id);
  });
  assert.ok(
    fitRpeTarget,
    "The interaction checkpoint requires one completed workout without FIT/RPE.",
  );

  return {
    uiState: "check_in_needed" as const,
    asOfDate: normalizeAsOfDate(input.asOfDate),
    expectedControls: [
      "continuation_check_in",
      "continuation_prepare",
      "continuation_review",
      "continuation_confirm",
      "fit_upload",
      "rpe_entry",
      "calendar_workout_open",
      "calendar_return",
      "inert_projection",
    ] as const,
    fitRpeTarget: {
      workoutId: fitRpeTarget.id,
      workoutDate: fitRpeTarget.workout_date,
      workoutType: fitRpeTarget.workout_type,
      title: fitRpeTarget.title,
      currentEvidenceState: "completed_without_fit_or_rpe" as const,
    },
    continuation: {
      confirmationId: input.initial.source.latestConfirmationId,
      status: input.initial.continuation.status,
      projectionCount: input.initial.projections.count,
      projectionStableIds: input.initial.projections.stableIds,
      projectionCalendarRowCount: input.initial.projections.calendarRowCount,
      projectionExecutableFieldsExposed: input.initial.projections.executableFieldsExposed,
    },
  };
}

function adaptiveEngineUiReplayProvenance(
  runtimeScope: "local_proof" | "hosted_ui_replay",
  checkpoint: AdaptiveEngineUiReplayCheckpoint,
) {
  return {
    kind: "deterministic_server_owned_ui_replay" as const,
    sourceFixtureVersion: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
    runtimeScope,
    checkpoint,
    historicalAcceptanceClaimed: false,
    hito271SealedLineageRestored: false,
    rawProviderContentIncluded: false,
    credentialsIncluded: false,
    actionLinksIncluded: false,
    personalDataIncluded: false,
  };
}

function adaptiveEngineUiReplayInvariants(
  injectedStructuredResponseCount: number,
  canonicalReviewConfirmUsed: boolean,
) {
  return {
    injectedStructuredResponseCount,
    externalProviderDispatchCount: 0,
    canonicalReviewConfirmUsed,
    canonicalFitImporterUsed: canonicalReviewConfirmUsed,
    canonicalRunnerOwnedCalendarUsed: canonicalReviewConfirmUsed,
    ownerBound: true,
  };
}

export async function prepareAdaptiveBlueprintContinuationCandidateFixture(input: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const initial = await readAdaptiveBlueprintProjectionFixture(input);
  assert.equal(
    initial.source.confirmationCount,
    1,
    "Coach preparation requires exactly one confirmed initial block.",
  );
  assert.equal(initial.source.latestBlockMode, "initial_four_week");
  assert.equal(initial.source.confirmedCalendarWorkoutCount, 28);
  assert.ok(initial.projections.count > 0, "Coach preparation requires future projections.");

  const readinessDate = addDaysIso(initial.source.confirmedInterval.endDate, -13);
  const checkInRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
    userId: input.userId,
    blueprint: {
      id: initial.source.blueprintId,
      version: initial.source.blueprintVersion,
      sha256: initial.source.blueprintSha256,
    },
    activeProjectionPreferences: [],
    horizonCheckIn: {
      confirmationId: initial.source.confirmationId,
      goalAssumptionCurrent: true,
      availabilityConfirmed: true,
      manageability: "manageable",
      materialChangeReason: null,
      healthLimitation: "no",
      interruptionStatus: "none",
      clinicianGuidance: "not_applicable",
    },
  });
  const storedAuthoringInput = await getAdaptiveTrainingOriginalAuthoringInputForUser({
    userId: input.userId,
    blueprintId: initial.source.blueprintId,
  });
  const parsedAuthoringInput = structuredPlanAuthoringInputSchema.parse(storedAuthoringInput);
  const { requestContext: _requestContext, ...authoringInput } = parsedAuthoringInput;
  let injectedResponseCount = 0;
  const prepareCandidate = () =>
    prepareAdaptiveContinuationCandidateForUser(
      { userId: input.userId, asOfDate: readinessDate },
      {
        requestStructuredResponse: ({ prompt, brief }) => {
          injectedResponseCount += 1;
          return requestAiPlanStructuredResponse({
            apiKey: "local-adaptive-continuation-fixture",
            model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
            prompt,
            responseSchemaName: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
            contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
            responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
            fetchImpl: buildAiGeneratedContinuationDevFixtureOpenAiFetch({
              authoringInput,
              brief,
            }),
            generationLedger: { disabled: true },
          });
        },
      },
    );

  const prepared = await prepareCandidate();
  assert.equal(prepared.ok, true, JSON.stringify(prepared));
  assert.equal(prepared.state.status, "candidate_ready");
  if (!prepared.ok || prepared.state.status !== "candidate_ready") {
    throw new Error("The deterministic continuation candidate is unavailable.");
  }
  assert.equal(prepared.state.window.blockMode, "normal_four_week");
  assert.equal(
    injectedResponseCount,
    prepared.retained ? 1 : 0,
    "A newly retained candidate uses one injected response; exact retained replay uses none.",
  );

  const replayed = await prepareCandidate();
  assert.equal(replayed.ok, true, JSON.stringify(replayed));
  assert.equal(replayed.state.status, "candidate_ready");
  if (!replayed.ok || replayed.state.status !== "candidate_ready") {
    throw new Error("The deterministic continuation candidate did not survive exact replay.");
  }
  assert.equal(replayed.state.candidate.id, prepared.state.candidate.id);
  assert.equal(replayed.state.candidate.sha256, prepared.state.candidate.sha256);
  assert.equal(
    injectedResponseCount,
    prepared.retained ? 1 : 0,
    "Exact candidate replay must not request another response.",
  );

  const storedCandidate = await getAdaptiveTrainingDetailedCandidateForUser({
    userId: input.userId,
    candidateId: prepared.state.candidate.id,
  });
  assert.ok(storedCandidate, "The prepared continuation candidate must be retained.");
  assert.equal(storedCandidate.user_id, input.userId);
  assert.equal(storedCandidate.blueprint_id, initial.source.blueprintId);
  assert.equal(storedCandidate.candidate_sha256, prepared.state.candidate.sha256);
  assert.ok(storedCandidate.source_response_id, "The candidate requires a retained response.");
  const retainedResponse = await getAiPlanGenerationResponseForUser(
    input.userId,
    storedCandidate.source_response_id!,
  );
  assert.ok(retainedResponse, "The candidate owner must be able to read its retained response.");
  assert.equal(retainedResponse.user_id, input.userId);
  assert.equal(retainedResponse.schema_outcome, "accepted");
  assert.equal(retainedResponse.compiler_outcome, "accepted");
  const inputProvenance = storedCandidate.input_provenance as Record<string, unknown>;
  assert.equal(inputProvenance.retainedResponseId, retainedResponse.id);
  assert.equal(inputProvenance.retainedResponseSha256, retainedResponse.response_sha256);

  const review = await reviewWorkoutCommandForUser(
    input.userId,
    {
      operation: "materialize_source_candidate",
      source: {
        kind: "adaptive_continuation_candidate",
        candidateId: prepared.state.candidate.id,
      },
    },
    { adaptiveContinuationAsOfDate: readinessDate },
  );
  assert.equal(review.ok, true, JSON.stringify(review));
  if (!review.ok) throw new Error(review.issues[0]?.message ?? "Continuation review failed.");
  assert.equal(review.candidate.command.operation, "materialize");
  assert.ok(
    review.candidate.command.documents.length > 0,
    "The reviewed continuation must contain its exact executable workout set.",
  );
  assert.equal(
    diffDaysIso(
      prepared.state.candidate.interval.endDate,
      prepared.state.candidate.interval.startDate,
    ),
    27,
    "A normal continuation must span exactly four inclusive calendar weeks.",
  );
  assert.deepEqual(prepared.state.candidate.performanceAdaptation.comparableContextKeys, ["easy"]);
  const commandSignature = (document: (typeof prepared.state.candidate.workoutDocuments)[number]) =>
    stableJsonStringify(
      document.steps.map((step) => {
        const normalized = structuredClone(step) as Record<string, unknown>;
        delete normalized.segment_id;
        return normalized;
      }),
    );
  const easySignatures = new Set(
    prepared.state.candidate.workoutDocuments
      .filter((document) => document.workoutFamily === "easy")
      .map(commandSignature),
  );
  const steadyDocuments = prepared.state.candidate.workoutDocuments.filter(
    (document) => document.sourceWorkoutType === "steady_aerobic_run",
  );
  assert.ok(steadyDocuments.length > 0, "The Coach candidate requires steady aerobic slots.");
  assert.ok(
    steadyDocuments.every((document) => !easySignatures.has(commandSignature(document))),
    "Every steady aerobic command must remain distinct from every easy command.",
  );

  const [confirmations, calendarRows, projectionRows] = await Promise.all([
    input.supabase
      .from("adaptive_training_block_confirmations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .eq("blueprint_id", initial.source.blueprintId),
    input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId),
    input.supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .in(
        "workout_date",
        initial.projections.count > 0
          ? (
              await getAdaptiveBlueprintCalendarReadModelForUser(input.userId, readinessDate)
            ).projections.map((projection) => projection.date)
          : [],
      ),
  ]);
  if (confirmations.error) throw new Error(confirmations.error.message);
  if (calendarRows.error) throw new Error(calendarRows.error.message);
  if (projectionRows.error) throw new Error(projectionRows.error.message);
  assert.equal(confirmations.count, 1, "Candidate preparation must not confirm a block.");
  assert.equal(calendarRows.count, 28, "Candidate preparation must not create Calendar rows.");
  assert.equal(
    projectionRows.count,
    0,
    "Future projections must remain non-Calendar Source intent.",
  );

  const versionContext = retainedResponse.version_context as Record<string, unknown>;
  return {
    artifactVersion: "hito_266_coach_candidate_v1" as const,
    createdAt: new Date().toISOString(),
    fixture: {
      version: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      readinessDate,
      ownerBound: true,
    },
    source: {
      blueprint: {
        id: initial.source.blueprintId,
        version: initial.source.blueprintVersion,
        sha256: initial.source.blueprintSha256,
      },
      predecessorConfirmationId: initial.source.confirmationId,
      continuationInputRevision: {
        id: checkInRevision.id,
        revision: checkInRevision.revision,
        sha256: checkInRevision.contentSha256,
      },
      response: {
        recordId: retainedResponse.id,
        providerResponseId: retainedResponse.provider_response_id,
        responseSha256: retainedResponse.response_sha256,
        requestFingerprintSha256: retainedResponse.request_fingerprint_sha256,
        versionFingerprintSha256: retainedResponse.version_fingerprint_sha256,
        providerModel: retainedResponse.provider_model,
        schemaVersion: versionContext.schemaVersion ?? null,
        promptVersion: versionContext.promptVersion ?? null,
        policyVersion: versionContext.policyVersion ?? null,
        compilerVersion: versionContext.compilerVersion ?? null,
        schemaOutcome: retainedResponse.schema_outcome,
        compilerOutcome: retainedResponse.compiler_outcome,
      },
    },
    candidate: {
      id: prepared.state.candidate.id,
      version: prepared.state.candidate.version,
      sha256: prepared.state.candidate.sha256,
      inputFingerprintSha256: storedCandidate.input_fingerprint_sha256,
      blockMode: prepared.state.candidate.blockMode,
      interval: prepared.state.candidate.interval,
      workoutDocuments: prepared.state.candidate.workoutDocuments,
      factsUsed: prepared.state.candidate.factsUsed,
      factsMissing: prepared.state.candidate.factsMissing,
      conflicts: prepared.state.candidate.conflicts,
      preferenceApplications: prepared.state.candidate.preferenceApplications,
      performanceAdaptation: prepared.state.candidate.performanceAdaptation,
    },
    review: {
      candidateId: review.candidate.candidateId,
      reviewChecksum: review.candidate.reviewChecksum,
      reviewTokenSha256: await digestSha256Hex(review.candidate.reviewToken),
      sealed: true,
    },
    invariants: {
      injectedResponseCount,
      candidateRetainedThisRun: prepared.retained,
      externalProviderDispatchCount: 0,
      exactReplayReusedCandidate: true,
      confirmationCount: confirmations.count,
      calendarWorkoutCount: calendarRows.count,
      futureProjectionCalendarRowCount: projectionRows.count,
      steadyCommandsDistinctFromEasy: true,
      performanceShapingComparableContextKeys: ["easy"],
      rawResponseIncluded: false,
      rawPromptIncluded: false,
      reviewTokenIncluded: false,
    },
  };
}

export async function confirmAdaptiveBlueprintContinuationProfileFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  expectedCandidateId: string;
}) {
  const initial = await readAdaptiveBlueprintProjectionFixture(input);
  assert.ok(
    initial.source.confirmationCount >= 1 && initial.source.confirmationCount <= 3,
    "The profile proof requires the Coach-approved candidate before or immediately after confirmation.",
  );
  const storedCandidate = await getAdaptiveTrainingDetailedCandidateForUser({
    userId: input.userId,
    candidateId: input.expectedCandidateId,
  });
  assert.ok(storedCandidate, "The Coach-approved continuation candidate is unavailable.");
  const candidateContent = parseAdaptiveContinuationCandidateContent(
    storedCandidate.candidate_content,
  );
  assert.ok(candidateContent, "The Coach-approved continuation candidate is malformed.");
  const candidate = {
    id: storedCandidate.id,
    sha256: storedCandidate.candidate_sha256,
    workoutDocuments: candidateContent.workoutDocuments,
  };
  const frozenProfile = readFrozenContinuationProfile(storedCandidate.input_snapshot);
  const existingCandidateConfirmation = await input.supabase
    .from("adaptive_training_block_confirmations")
    .select("id")
    .eq("user_id", input.userId)
    .eq("detailed_candidate_id", candidate.id)
    .maybeSingle();
  if (existingCandidateConfirmation.error) {
    throw new Error(existingCandidateConfirmation.error.message);
  }
  const confirmationCountBefore = initial.source.confirmationCount;
  const requiresConfirmation = !existingCandidateConfirmation.data;
  const readinessDate = addDaysIso(candidateContent.factsUsed.evidenceCutoffDate, 1);

  const compatibleDocument = candidate.workoutDocuments.find(
    (document) => document.workoutIdentity === "easy_aerobic_run",
  );
  const incompleteDocument = candidate.workoutDocuments.find(
    (document) => document.workoutIdentity === "steady_aerobic_run",
  );
  assert.ok(compatibleDocument, "The profile proof requires one canonical easy workout.");
  assert.ok(incompleteDocument, "The profile proof requires one canonical steady workout.");

  let confirmationReview:
    | { reviewChecksum: string; reviewTokenSha256: string; resumed: false }
    | { reviewChecksum: null; reviewTokenSha256: null; resumed: true };
  if (requiresConfirmation) {
    const current = await getAdaptiveBlueprintCalendarReadModelForUser(input.userId, readinessDate);
    assert.equal(current.continuation.status, "candidate_ready");
    assert.equal(current.continuation.candidate?.id, candidate.id);
    const review = await reviewWorkoutCommandForUser(
      input.userId,
      {
        operation: "materialize_source_candidate",
        source: {
          kind: "adaptive_continuation_candidate",
          candidateId: candidate.id,
        },
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(review.ok, true, JSON.stringify(review));
    if (!review.ok) throw new Error(review.issues[0]?.message ?? "Continuation review failed.");
    assert.equal(review.candidate.command.operation, "materialize");
    assert.equal(review.candidate.command.documents.length, candidate.workoutDocuments.length);
    const confirmed = await confirmWorkoutCommandForUser(
      input.userId,
      {
        command: review.candidate.command,
        candidateId: review.candidate.candidateId,
        reviewToken: review.candidate.reviewToken,
        reviewChecksum: review.candidate.reviewChecksum,
      },
      { adaptiveContinuationAsOfDate: readinessDate },
    );
    assert.equal(confirmed.ok, true, JSON.stringify(confirmed));
    if (!confirmed.ok) throw new Error(confirmed.message);
    confirmationReview = {
      reviewChecksum: review.candidate.reviewChecksum,
      reviewTokenSha256: await digestSha256Hex(review.candidate.reviewToken),
      resumed: false,
    };
  } else {
    confirmationReview = { reviewChecksum: null, reviewTokenSha256: null, resumed: true };
  }

  const afterConfirmation = await readAdaptiveBlueprintProjectionFixture({
    ...input,
    asOfDate: readinessDate,
  });
  assert.equal(
    afterConfirmation.source.confirmationCount,
    confirmationCountBefore + (requiresConfirmation ? 1 : 0),
  );
  assert.equal(afterConfirmation.source.latestBlockMode, candidateContent.blockMode);
  const latestConfirmation = await input.supabase
    .from("adaptive_training_block_confirmations")
    .select("id, detailed_candidate_id, candidate_sha256, calendar_workout_ids")
    .eq("user_id", input.userId)
    .eq("id", afterConfirmation.source.latestConfirmationId)
    .single();
  if (latestConfirmation.error) throw new Error(latestConfirmation.error.message);
  assert.equal(latestConfirmation.data.detailed_candidate_id, candidate.id);
  assert.equal(latestConfirmation.data.candidate_sha256, candidate.sha256);
  assert.equal(
    latestConfirmation.data.calendar_workout_ids.length,
    candidate.workoutDocuments.length,
  );
  assert.equal(afterConfirmation.projections.calendarRowCount, 0);

  const evidenceDates = [compatibleDocument.workoutDate, incompleteDocument.workoutDate].sort();
  const cutoffDate = evidenceDates.at(-1)!;
  const asOf = `${cutoffDate}T12:00:00.000Z`;
  const planned = await input.supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", input.userId)
    .in("workout_date", evidenceDates)
    .neq("workout_type", "rest");
  if (planned.error) throw new Error(planned.error.message);
  const plannedByDate = new Map(planned.data.map((workout) => [workout.workout_date, workout]));
  const compatibleWorkout = plannedByDate.get(compatibleDocument.workoutDate);
  const incompleteWorkout = plannedByDate.get(incompleteDocument.workoutDate);
  assert.ok(compatibleWorkout, "The confirmed easy workout was not materialized.");
  assert.ok(incompleteWorkout, "The confirmed steady workout was not materialized.");

  const factsBeforeEvidence = await getAdaptiveBlueprintContinuationFactsForUser({
    userId: input.userId,
    asOf,
    cutoffDate,
  });
  assert.ok(factsBeforeEvidence, "The pre-evidence fitness facts are unavailable.");
  const calendarBefore = new Map(
    factsBeforeEvidence.calendar.workouts.map((workout) => [workout.calendarWorkoutId, workout]),
  );
  const evidenceBefore = new Map(
    factsBeforeEvidence.evidence.workouts.map((workout) => [workout.calendarWorkoutId, workout]),
  );
  if (calendarBefore.get(compatibleWorkout.id)?.outcome === "unresolved") {
    await saveWorkoutLogForUser(input.userId, {
      plannedWorkoutId: compatibleWorkout.id,
      outcome: "completed",
      actualDistanceKm: null,
      actualDurationMin: null,
      rpe: 4,
      notes: null,
      intervalsCompleted: null,
      bodyNotes: [],
    });
  }
  if (calendarBefore.get(incompleteWorkout.id)?.outcome === "unresolved") {
    await saveWorkoutLogForUser(input.userId, {
      plannedWorkoutId: incompleteWorkout.id,
      outcome: "completed",
      actualDistanceKm: null,
      actualDurationMin: null,
      rpe: null,
      notes: null,
      intervalsCompleted: null,
      bodyNotes: [],
    });
  }
  if (evidenceBefore.get(compatibleWorkout.id)?.evidenceState !== "fit_current") {
    const evidenceKey =
      confirmationCountBefore === 1 ? "hito-266-compatible" : "hito-264-second-compatible";
    await persistAdaptiveFixtureActivityEvidence({
      supabase: input.supabase,
      userId: input.userId,
      workout: compatibleWorkout,
      spec: activity(
        evidenceKey,
        0,
        "HITO-266 compatible factual run",
        35,
        36,
        5.8,
        128,
        20,
        true,
        "available",
        4,
      ),
    });
  }
  if (evidenceBefore.get(incompleteWorkout.id)?.evidenceState !== "fit_current") {
    const evidenceKey =
      confirmationCountBefore === 1 ? "hito-266-incomplete" : "hito-264-second-incomplete";
    await persistAdaptiveFixtureActivityEvidence({
      supabase: input.supabase,
      userId: input.userId,
      workout: incompleteWorkout,
      spec: activity(
        evidenceKey,
        0,
        "HITO-266 incomplete factual run",
        null,
        40,
        null,
        null,
        null,
        true,
      ),
    });
  }
  const afterFacts = await getAdaptiveBlueprintContinuationFactsForUser({
    userId: input.userId,
    asOf,
    cutoffDate,
  });
  assert.ok(afterFacts, "The post-evidence fitness facts are unavailable.");
  const after = afterFacts.fitnessProfileSnapshot;
  const reloadedFacts = await getAdaptiveBlueprintContinuationFactsForUser({
    userId: input.userId,
    asOf,
    cutoffDate,
  });
  assert.ok(reloadedFacts, "The reloaded fitness facts are unavailable.");
  const reloaded = reloadedFacts.fitnessProfileSnapshot;

  assert.notEqual(after.snapshotId, frozenProfile.snapshotId);
  assert.notEqual(after.runnerFactsRevision, frozenProfile.runnerFactsRevision);
  assert.deepEqual(after.formulaVersions, frozenProfile.formulaVersions);
  assert.equal(
    afterFacts.fitnessProfileProjection.profileConstraintsFingerprint,
    frozenProfile.profileConstraintsFingerprint,
  );
  assert.deepEqual(afterFacts.fitnessProfileProjection.constraints, frozenProfile.constraints);
  assert.equal(reloaded.snapshotId, after.snapshotId);
  assert.equal(reloaded.runnerFactsRevision, after.runnerFactsRevision);

  const compatibleEvidence = afterFacts.evidence.workouts.find(
    (workout) => workout.calendarWorkoutId === compatibleWorkout.id,
  );
  const incompleteEvidence = afterFacts.evidence.workouts.find(
    (workout) => workout.calendarWorkoutId === incompleteWorkout.id,
  );
  assert.equal(compatibleEvidence?.evidenceState, "fit_current");
  assert.equal(compatibleEvidence?.sessionRpe, 4);
  assert.ok(compatibleEvidence.acceptedActualMetrics?.durationMin != null);
  assert.ok(compatibleEvidence.acceptedActualMetrics?.distanceKm != null);
  assert.equal(incompleteEvidence?.evidenceState, "fit_current");
  assert.equal(incompleteEvidence?.sessionRpe, null);
  assert.equal(incompleteEvidence.acceptedActualMetrics?.durationMin, 40);
  assert.equal(incompleteEvidence.acceptedActualMetrics?.distanceKm, null);
  assert.equal(incompleteEvidence.acceptedActualMetrics?.averageHeartRate, null);
  assert.equal(after.components.latestFive.state, "partial");

  const assets = await input.supabase
    .from("workout_result_assets")
    .select("id, planned_workout_id, activity_source_revision_id")
    .eq("user_id", input.userId)
    .in("planned_workout_id", [compatibleWorkout.id, incompleteWorkout.id])
    .order("created_at", { ascending: false });
  if (assets.error) throw new Error(assets.error.message);
  const assetByWorkout = new Map(
    assets.data.map((asset) => [asset.planned_workout_id, asset] as const),
  );
  const compatibleAsset = assetByWorkout.get(compatibleWorkout.id);
  const incompleteAsset = assetByWorkout.get(incompleteWorkout.id);
  assert.ok(compatibleAsset?.activity_source_revision_id);
  assert.ok(incompleteAsset?.activity_source_revision_id);

  assert.ok(storedCandidate?.source_response_id);
  const retainedResponse = await getAiPlanGenerationResponseForUser(
    input.userId,
    storedCandidate.source_response_id,
  );
  assert.ok(retainedResponse);

  return {
    artifactVersion:
      confirmationCountBefore === 1
        ? ("hito_266_profile_update_proof_v1" as const)
        : ("hito_264_second_profile_update_proof_v1" as const),
    createdAt: new Date().toISOString(),
    fixture: {
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      version: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
      ownerBound: true,
    },
    candidate: {
      id: candidate.id,
      sha256: candidate.sha256,
      confirmationReview,
      sourceResponseId: retainedResponse.id,
      sourceResponseSha256: retainedResponse.response_sha256,
    },
    confirmation: {
      explicit: true,
      count: afterConfirmation.source.confirmationCount,
      id: afterConfirmation.source.latestConfirmationId,
      blockMode: afterConfirmation.source.latestBlockMode,
      calendarWorkoutCount: afterConfirmation.source.confirmedCalendarWorkoutCount,
      remainingProjectionCount: afterConfirmation.projections.count,
      futureProjectionCalendarRowCount: afterConfirmation.projections.calendarRowCount,
    },
    evidence: {
      cutoffDate,
      compatible: {
        workoutDate: compatibleWorkout.workout_date,
        resultAssetId: compatibleAsset.id,
        activitySourceRevisionId: compatibleAsset.activity_source_revision_id,
        evidenceState: compatibleEvidence.evidenceState,
        sessionRpe: compatibleEvidence.sessionRpe,
        durationAvailable: compatibleEvidence.acceptedActualMetrics?.durationMin != null,
        distanceAvailable: compatibleEvidence.acceptedActualMetrics?.distanceKm != null,
      },
      incomplete: {
        workoutDate: incompleteWorkout.workout_date,
        resultAssetId: incompleteAsset.id,
        activitySourceRevisionId: incompleteAsset.activity_source_revision_id,
        evidenceState: incompleteEvidence.evidenceState,
        sessionRpe: incompleteEvidence.sessionRpe,
        durationAvailable: incompleteEvidence.acceptedActualMetrics?.durationMin != null,
        distanceAvailable: incompleteEvidence.acceptedActualMetrics?.distanceKm != null,
      },
    },
    snapshots: {
      before: {
        source: "immutable_candidate_frozen_continuation_projection" as const,
        snapshotId: frozenProfile.snapshotId,
        runnerFactsRevision: frozenProfile.runnerFactsRevision,
        cutoffDate: frozenProfile.cutoffDate,
        formulaVersions: frozenProfile.formulaVersions,
        quality: frozenProfile.quality,
        profileConstraintsFingerprint: frozenProfile.profileConstraintsFingerprint,
        calendarOutcomeFingerprint: frozenProfile.calendarOutcomeFingerprint,
        evidenceRevisionFingerprint: frozenProfile.evidenceRevisionFingerprint,
      },
      after: snapshotEvidence(after),
      immutableReadback: reloaded.snapshotId === after.snapshotId,
      formulaVersionsPreserved: true,
      constraintsPreserved: true,
      missingnessPreserved: after.components.latestFive.state === "partial",
    },
    omissions: {
      providerDispatchCount: 0,
      rawResponseIncluded: false,
      rawPromptIncluded: false,
      reviewTokenIncluded: false,
      personalIdentityUsed: false,
      hostedAction: false,
    },
    cleanup: {
      deferredToIndependentQa: true,
      command: "npm run local:adaptive-blueprint:reset",
    },
  };
}

export async function preflightAdaptiveBlueprintSecondContinuationFixture(input: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const current = await readAdaptiveBlueprintProjectionFixture(input);
  assert.equal(current.source.confirmationCount, 2);
  assert.equal(current.source.latestBlockMode, "normal_four_week");
  assert.equal(current.source.confirmedCalendarWorkoutCount, 44);
  assert.equal(current.projections.calendarRowCount, 0);

  const readinessDate = addDaysIso(current.source.confirmedInterval.endDate, -13);
  const before = await getAdaptiveBlueprintContinuationDecisionForUser({
    userId: input.userId,
    asOfDate: readinessDate,
  });
  assert.ok(before?.window, "The second continuation readiness window is unavailable.");
  assert.ok(before.facts, "The second continuation factual packet is unavailable.");

  const outcomes = new Map(
    before.facts.calendar.workouts.map((workout) => [workout.calendarWorkoutId, workout.outcome]),
  );
  const dueRows = await input.supabase
    .from("planned_workouts")
    .select("id, workout_date, workout_type")
    .eq("user_id", input.userId)
    .neq("workout_type", "rest")
    .gte("workout_date", current.source.confirmedInterval.startDate)
    .lte("workout_date", before.window.evidenceCutoffDate)
    .order("workout_date", { ascending: true });
  if (dueRows.error) throw new Error(dueRows.error.message);
  const unresolved = dueRows.data.filter((workout) => outcomes.get(workout.id) === "unresolved");
  for (const workout of unresolved) {
    await saveWorkoutLogForUser(input.userId, {
      plannedWorkoutId: workout.id,
      outcome: "completed",
      actualDistanceKm: null,
      actualDurationMin: null,
      rpe: null,
      notes: null,
      intervalsCompleted: null,
      bodyNotes: [],
    });
  }

  const checkInRevision = await retainAdaptiveTrainingContinuationInputRevisionForUser({
    userId: input.userId,
    blueprint: {
      id: current.source.blueprintId,
      version: current.source.blueprintVersion,
      sha256: current.source.blueprintSha256,
    },
    activeProjectionPreferences: [],
    horizonCheckIn: {
      confirmationId: current.source.latestConfirmationId,
      goalAssumptionCurrent: true,
      availabilityConfirmed: true,
      manageability: "manageable",
      materialChangeReason: null,
      healthLimitation: "no",
      interruptionStatus: "none",
      clinicianGuidance: "not_applicable",
    },
  });
  const decision = await getAdaptiveBlueprintContinuationDecisionForUser({
    userId: input.userId,
    asOfDate: readinessDate,
  });
  assert.ok(decision?.decision, "The second continuation decision is unavailable.");
  assert.equal(decision.decision.status, "authoring_ready");
  assert.ok(decision.facts?.fitnessProfileSnapshot);
  assert.ok(decision.facts.targetIntervalOccupancy);

  const providerModel = process.env.OPENAI_PLAN_MODEL?.trim() || "gpt-5.2";
  const providerDispatchRequired = new Error("hito_264_paid_dispatch_required");
  let captured: {
    prompt: Parameters<
      NonNullable<
        Parameters<typeof prepareAdaptiveContinuationCandidateForUser>[1]
      >["requestStructuredResponse"]
    >[0]["prompt"];
    brief: Parameters<
      NonNullable<
        Parameters<typeof prepareAdaptiveContinuationCandidateForUser>[1]
      >["requestStructuredResponse"]
    >[0]["brief"];
  } | null = null;
  const beforeCounts = await readSecondContinuationRetentionCounts(input);
  let prepared: Awaited<ReturnType<typeof prepareAdaptiveContinuationCandidateForUser>> | null =
    null;
  try {
    prepared = await prepareAdaptiveContinuationCandidateForUser(
      { userId: input.userId, asOfDate: readinessDate },
      {
        providerModel,
        requestStructuredResponse: async ({ prompt, brief }) => {
          captured = { prompt, brief };
          throw providerDispatchRequired;
        },
      },
    );
  } catch (error) {
    if (error !== providerDispatchRequired) throw error;
  }
  const afterCounts = await readSecondContinuationRetentionCounts(input);
  const exactReuseApplied = prepared?.ok === true && prepared.state.status === "candidate_ready";
  assert.equal(Boolean(captured), !exactReuseApplied);
  if (!exactReuseApplied) {
    assert.deepEqual(
      afterCounts,
      beforeCounts,
      "A cache-miss preflight must not retain a provider response or candidate.",
    );
  }
  const promptFingerprint = captured
    ? await digestSha256Hex(
        stableJsonStringify({
          systemPrompt: captured.prompt.systemPrompt,
          userPrompt: captured.prompt.userPrompt,
          responseSchema: captured.prompt.responseSchema,
        }),
      )
    : null;
  const requestFingerprint = await digestSha256Hex(
    stableJsonStringify({
      ownerUserId: input.userId,
      providerModel,
      decision: decision.decision,
      promptFingerprint,
      schemaVersion: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
      promptVersion: ADAPTIVE_CONTINUATION_PROMPT_VERSION,
      policyVersion: decision.decision.policyVersion,
      compilerVersion: ADAPTIVE_CONTINUATION_COMPILER_VERSION,
      contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
      responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
    }),
  );

  return {
    artifactVersion: "hito_264_second_continuation_preflight_v1" as const,
    createdAt: new Date().toISOString(),
    fixture: {
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      version: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
      ownerBound: true,
      readinessDate,
    },
    source: {
      blueprint: {
        id: current.source.blueprintId,
        version: current.source.blueprintVersion,
        sha256: current.source.blueprintSha256,
      },
      predecessorConfirmationId: current.source.latestConfirmationId,
      continuationInputRevision: {
        id: checkInRevision.id,
        revision: checkInRevision.revision,
        sha256: checkInRevision.contentSha256,
      },
    },
    facts: {
      resolvedCompletionOnlyCount: unresolved.length,
      dueOutcomeCount: decision.facts.calendar.workouts.length,
      unresolvedOutcomeCount: decision.facts.calendar.workouts.filter(
        (workout) => workout.outcome === "unresolved",
      ).length,
      snapshotId: decision.facts.fitnessProfileSnapshot.snapshotId,
      runnerFactsRevision: decision.facts.fitnessProfileSnapshot.runnerFactsRevision,
      cutoffDate: decision.facts.fitnessProfileSnapshot.cutoffDate,
      formulaVersions: decision.facts.fitnessProfileSnapshot.formulaVersions,
      profileState: decision.decision.fitnessProfile.quality,
      missingReasons: decision.decision.fitnessProfile.missingReasons,
      comparableContextKeys: decision.decision.comparableContextKeys,
      calendarOutcomeFingerprint: decision.facts.calendar.calendarOutcomeFingerprint,
      evidenceRevisionFingerprint: decision.facts.evidence.evidenceRevisionFingerprint,
      targetIntervalOccupancyFingerprint:
        decision.facts.targetIntervalOccupancy.calendarOccupancyFingerprint,
    },
    decision: {
      version: decision.decision.version,
      policyVersion: decision.decision.policyVersion,
      status: decision.decision.status,
      authoringMode: decision.decision.authoringMode,
      interval: decision.decision.interval,
      projectionIds: decision.decision.projectionIds,
    },
    request: {
      providerModel,
      requestFingerprint,
      promptFingerprint,
      schemaVersion: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
      promptVersion: ADAPTIVE_CONTINUATION_PROMPT_VERSION,
      policyVersion: decision.decision.policyVersion,
      compilerVersion: ADAPTIVE_CONTINUATION_COMPILER_VERSION,
      contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
      responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
      exactReuseApplied,
      paidDispatchRequired: !exactReuseApplied,
      externalProviderDispatchCount: 0,
    },
    candidate: exactReuseApplied
      ? {
          id: prepared.state.candidate.id,
          sha256: prepared.state.candidate.sha256,
          blockMode: prepared.state.candidate.blockMode,
          interval: prepared.state.candidate.interval,
        }
      : null,
    invariants: {
      confirmationCount: current.source.confirmationCount,
      calendarWorkoutCount: current.source.confirmedCalendarWorkoutCount,
      futureProjectionCalendarRowCount: current.projections.calendarRowCount,
      rawResponseIncluded: false,
      rawPromptIncluded: false,
      personalIdentityUsed: false,
      hostedAction: false,
    },
  };
}

export async function authorAdaptiveBlueprintSecondContinuationFixture(input: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const current = await readAdaptiveBlueprintProjectionFixture(input);
  assert.equal(current.source.confirmationCount, 2);
  assert.equal(current.source.latestBlockMode, "normal_four_week");
  assert.equal(current.source.confirmedCalendarWorkoutCount, 44);
  const readinessDate = addDaysIso(current.source.confirmedInterval.endDate, -13);
  const beforeCounts = await readSecondContinuationRetentionCounts(input);
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const providerModel = process.env.OPENAI_PLAN_MODEL?.trim() || "gpt-5.2";
  const prepared = await withAdaptiveBlueprintFixtureEnv(() =>
    prepareAdaptiveContinuationCandidateForUser(
      { userId: input.userId, asOfDate: readinessDate },
      { providerModel },
    ),
  );
  const finishedAt = new Date().toISOString();
  const endToEndElapsedMs = Date.now() - startedMs;
  assert.equal(prepared.ok, true, JSON.stringify(prepared));
  assert.equal(prepared.state.status, "candidate_ready");
  if (!prepared.ok || prepared.state.status !== "candidate_ready") {
    throw new Error(
      "The paid second-continuation response did not produce a reviewable candidate.",
    );
  }
  const afterCounts = await readSecondContinuationRetentionCounts(input);
  assert.equal(
    afterCounts.responses - beforeCounts.responses,
    1,
    "The admitted paid authoring edge must retain exactly one new provider response.",
  );
  assert.equal(
    afterCounts.candidates - beforeCounts.candidates,
    1,
    "The admitted paid authoring edge must retain exactly one new candidate.",
  );

  const storedCandidate = await getAdaptiveTrainingDetailedCandidateForUser({
    userId: input.userId,
    candidateId: prepared.state.candidate.id,
  });
  assert.ok(storedCandidate?.source_response_id);
  const retainedResponse = await getAiPlanGenerationResponseForUser(
    input.userId,
    storedCandidate.source_response_id,
  );
  assert.ok(retainedResponse);
  assert.equal(retainedResponse.user_id, input.userId);
  assert.equal(retainedResponse.provider_model, providerModel);
  assert.equal(retainedResponse.schema_outcome, "accepted");
  assert.equal(retainedResponse.compiler_outcome, "accepted");
  assert.equal(retainedResponse.running_coach_verdict, null);
  const providerAttempt = requireRecord(retainedResponse.provider_attempt, "provider attempt");
  const usage = requireRecord(providerAttempt.usage, "provider usage");
  const inputTokens = nullableInteger(usage.inputTokens);
  const outputTokens = nullableInteger(usage.outputTokens);
  const reasoningTokens = nullableInteger(usage.reasoningTokens);
  const totalTokens = nullableInteger(usage.totalTokens);
  const providerElapsedMs = nullableInteger(providerAttempt.providerElapsedMs);
  const versionContext = requireRecord(retainedResponse.version_context, "version context");
  const review = await reviewWorkoutCommandForUser(
    input.userId,
    {
      operation: "materialize_source_candidate",
      source: {
        kind: "adaptive_continuation_candidate",
        candidateId: prepared.state.candidate.id,
      },
    },
    { adaptiveContinuationAsOfDate: readinessDate },
  );
  assert.equal(review.ok, true, JSON.stringify(review));
  if (!review.ok) throw new Error(review.issues[0]?.message ?? "Continuation review failed.");
  const postReview = await readAdaptiveBlueprintProjectionFixture({
    ...input,
    asOfDate: readinessDate,
  });
  assert.equal(postReview.source.confirmationCount, 2);
  assert.equal(postReview.source.confirmedCalendarWorkoutCount, 44);
  assert.equal(postReview.projections.calendarRowCount, 0);

  const derivedRateCardUsd =
    providerModel === "gpt-5.2" && inputTokens !== null && outputTokens !== null
      ? (inputTokens * 1.75 + outputTokens * 14) / 1_000_000
      : null;

  return {
    artifactVersion: "hito_264_second_continuation_candidate_v1" as const,
    createdAt: finishedAt,
    fixture: {
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      version: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
      ownerBound: true,
      readinessDate,
    },
    source: {
      blueprint: {
        id: current.source.blueprintId,
        version: current.source.blueprintVersion,
        sha256: current.source.blueprintSha256,
      },
      predecessorConfirmationId: current.source.latestConfirmationId,
      response: {
        recordId: retainedResponse.id,
        providerResponseId: retainedResponse.provider_response_id,
        responseSha256: retainedResponse.response_sha256,
        requestFingerprintSha256: retainedResponse.request_fingerprint_sha256,
        versionFingerprintSha256: retainedResponse.version_fingerprint_sha256,
        providerModel: retainedResponse.provider_model,
        schemaVersion: versionContext.schemaVersion ?? null,
        promptVersion: versionContext.promptVersion ?? null,
        policyVersion: versionContext.policyVersion ?? null,
        compilerVersion: versionContext.compilerVersion ?? null,
        schemaOutcome: retainedResponse.schema_outcome,
        compilerOutcome: retainedResponse.compiler_outcome,
      },
    },
    attempt: {
      startedAt,
      finishedAt,
      providerElapsedMs,
      endToEndElapsedMs,
      usage: {
        inputTokens,
        outputTokens,
        reasoningTokens,
        totalTokens,
      },
      cost:
        derivedRateCardUsd === null
          ? {
              classification: "unavailable" as const,
              currency: "USD" as const,
              amount: null,
              reason: "No authoritative rate-card estimate is registered for this provider model.",
            }
          : {
              classification: "derived_rate_card" as const,
              currency: "USD" as const,
              amount: Number(derivedRateCardUsd.toFixed(8)),
              actualSpend: false,
              source: "HITO-249 accepted 2026-08-22 standard gpt-5.2 rate card",
              formula: "(inputTokens * 1.75 + outputTokens * 14) / 1000000",
              reasoningTokensCountedSeparately: false,
            },
    },
    candidate: {
      id: prepared.state.candidate.id,
      version: prepared.state.candidate.version,
      sha256: prepared.state.candidate.sha256,
      inputFingerprintSha256: storedCandidate.input_fingerprint_sha256,
      blockMode: prepared.state.candidate.blockMode,
      interval: prepared.state.candidate.interval,
      workoutDocuments: prepared.state.candidate.workoutDocuments,
      factsUsed: prepared.state.candidate.factsUsed,
      factsMissing: prepared.state.candidate.factsMissing,
      conflicts: prepared.state.candidate.conflicts,
      preferenceApplications: prepared.state.candidate.preferenceApplications,
      performanceAdaptation: prepared.state.candidate.performanceAdaptation,
    },
    review: {
      candidateId: review.candidate.candidateId,
      reviewChecksum: review.candidate.reviewChecksum,
      reviewTokenSha256: await digestSha256Hex(review.candidate.reviewToken),
      sealed: true,
    },
    invariants: {
      paidProviderDispatchCount: 1,
      exactRetainedResponseReused: false,
      confirmationCount: postReview.source.confirmationCount,
      calendarWorkoutCount: postReview.source.confirmedCalendarWorkoutCount,
      futureProjectionCalendarRowCount: postReview.projections.calendarRowCount,
      rawResponseIncluded: false,
      rawPromptIncluded: false,
      reviewTokenIncluded: false,
      personalIdentityUsed: false,
      hostedAction: false,
    },
  };
}

export async function recompileAdaptiveBlueprintSecondContinuationFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  responseRecordId: string;
  rejectedCandidateId: string;
  rejectedCandidateSha256: string;
  rejectedReviewChecksum: string;
  rejectedCandidateCompilerVersion: `adaptive_continuation_compiler_v${number}`;
  coachReviewedAt: string;
  coachDiscriminator: string;
}) {
  const current = await readAdaptiveBlueprintProjectionFixture(input);
  assert.equal(current.source.confirmationCount, 2);
  assert.equal(current.source.confirmedCalendarWorkoutCount, 44);
  assert.equal(current.projections.calendarRowCount, 0);
  const readinessDate = addDaysIso(current.source.confirmedInterval.endDate, -13);
  const rejectedCandidate = await getAdaptiveTrainingDetailedCandidateForUser({
    userId: input.userId,
    candidateId: input.rejectedCandidateId,
  });
  assert.ok(rejectedCandidate);
  assert.equal(rejectedCandidate.candidate_sha256, input.rejectedCandidateSha256);

  const existingResponse = await getAiPlanGenerationResponseForUser(
    input.userId,
    input.responseRecordId,
  );
  assert.ok(existingResponse);
  const verdict = existingResponse.running_coach_verdict
    ? existingResponse
    : await recordAiPlanGenerationReviewVerdictForUser({
        userId: input.userId,
        responseRecordId: input.responseRecordId,
        reviewer: "running_coach",
        verdict: {
          verdict: "rejected",
          discriminator: "target_endpoint_unproven_performance_precision",
          reviewedAt: input.coachReviewedAt,
        },
      });
  assert.equal(verdict.user_id, input.userId);
  assert.equal(verdict.id, input.responseRecordId);
  const beforeCounts = await readSecondContinuationRetentionCounts(input);
  const dependencies = {
    providerModel: verdict.provider_model ?? "gpt-5.2",
    explicitRetainedResponseRecompile: {
      responseRecordId: input.responseRecordId,
      rejectedCandidateId: input.rejectedCandidateId,
      expectedRejectedCandidateCompilerVersion: input.rejectedCandidateCompilerVersion,
      expectedPromptVersion: "adaptive_continuation_prompt_v5" as const,
      expectedCompilerVersion: "adaptive_continuation_compiler_v3" as const,
    },
  };
  const prepared = await prepareAdaptiveContinuationCandidateForUser(
    { userId: input.userId, asOfDate: readinessDate },
    dependencies,
  );
  assert.equal(prepared.ok, true, JSON.stringify(prepared));
  assert.equal(prepared.state.status, "candidate_ready");
  if (!prepared.ok || prepared.state.status !== "candidate_ready") {
    throw new Error("The retained-response recompile did not produce a current candidate.");
  }
  assert.equal(prepared.recompiledFromRetainedResponse, true);
  assert.equal(prepared.providerDispatchCount, 0);
  assert.notEqual(prepared.state.candidate.id, input.rejectedCandidateId);

  const afterFirstCounts = await readSecondContinuationRetentionCounts(input);
  assert.equal(afterFirstCounts.responses, beforeCounts.responses);
  const candidateCountDelta = afterFirstCounts.candidates - beforeCounts.candidates;
  assert.ok(
    candidateCountDelta === 0 || candidateCountDelta === 1,
    "A retained-response recompile may create at most one candidate.",
  );
  const replayed = await prepareAdaptiveContinuationCandidateForUser(
    { userId: input.userId, asOfDate: readinessDate },
    dependencies,
  );
  assert.equal(replayed.ok, true, JSON.stringify(replayed));
  assert.equal(replayed.state.status, "candidate_ready");
  if (!replayed.ok || replayed.state.status !== "candidate_ready") {
    throw new Error("The retained-response recompile replay did not remain current.");
  }
  assert.equal(replayed.state.candidate.id, prepared.state.candidate.id);
  assert.equal(replayed.state.candidate.sha256, prepared.state.candidate.sha256);
  assert.deepEqual(await readSecondContinuationRetentionCounts(input), afterFirstCounts);

  const storedCandidate = await getAdaptiveTrainingDetailedCandidateForUser({
    userId: input.userId,
    candidateId: prepared.state.candidate.id,
  });
  assert.ok(storedCandidate);
  assert.equal(storedCandidate.source_response_id, input.responseRecordId);
  const inputProvenance = requireRecord(storedCandidate.input_provenance, "input provenance");
  assert.equal(inputProvenance.compilerVersion, ADAPTIVE_CONTINUATION_COMPILER_VERSION);
  const lineageCandidates = await input.supabase
    .from("adaptive_training_detailed_candidates")
    .select("id, input_provenance")
    .eq("user_id", input.userId)
    .eq("source_response_id", input.responseRecordId);
  if (lineageCandidates.error) throw new Error(lineageCandidates.error.message);
  const currentCompilerCandidates = lineageCandidates.data.filter(
    (candidate) =>
      requireRecord(candidate.input_provenance, "candidate input provenance").compilerVersion ===
      ADAPTIVE_CONTINUATION_COMPILER_VERSION,
  );
  assert.deepEqual(
    currentCompilerCandidates.map((candidate) => candidate.id),
    [prepared.state.candidate.id],
  );
  const endpoint = prepared.state.candidate.workoutDocuments.find(
    (document) => document.workoutIdentity === "selected_distance_completion_or_checkpoint",
  );
  assert.ok(endpoint, "The target-boundary candidate has no completion/checkpoint endpoint.");
  const endpointPaces = endpoint.steps
    .filter((step) => step.type === "run" && step.segment_type === "main")
    .map((step) => step.target?.pace)
    .filter((pace): pace is string => Boolean(pace));
  assert.deepEqual(endpointPaces, ["5:30-5:45/km"]);
  const review = await reviewWorkoutCommandForUser(
    input.userId,
    {
      operation: "materialize_source_candidate",
      source: {
        kind: "adaptive_continuation_candidate",
        candidateId: prepared.state.candidate.id,
      },
    },
    { adaptiveContinuationAsOfDate: readinessDate },
  );
  assert.equal(review.ok, true, JSON.stringify(review));
  if (!review.ok) throw new Error(review.issues[0]?.message);
  const postReview = await readAdaptiveBlueprintProjectionFixture({
    ...input,
    asOfDate: readinessDate,
  });
  assert.equal(postReview.source.confirmationCount, 2);
  assert.equal(postReview.source.confirmedCalendarWorkoutCount, 44);
  assert.equal(postReview.projections.calendarRowCount, 0);

  return {
    artifactVersion: "hito_264_second_continuation_candidate_v3" as const,
    createdAt: new Date().toISOString(),
    fixture: {
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      version: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
      ownerBound: true,
      readinessDate,
    },
    retainedLineage: {
      responseRecordId: input.responseRecordId,
      responseSha256: verdict.response_sha256,
      priorCandidateId: input.rejectedCandidateId,
      priorCandidateSha256: input.rejectedCandidateSha256,
      priorReviewChecksum: input.rejectedReviewChecksum,
      priorCandidateCompilerVersion: input.rejectedCandidateCompilerVersion,
      priorCoachVerdict: "rejected" as const,
      priorCoachDiscriminator: input.coachDiscriminator,
      originalPromptVersion: "adaptive_continuation_prompt_v5" as const,
      originalCompilerVersion: "adaptive_continuation_compiler_v3" as const,
      recompilePromptVersion: ADAPTIVE_CONTINUATION_PROMPT_VERSION,
      recompileCompilerVersion: ADAPTIVE_CONTINUATION_COMPILER_VERSION,
    },
    candidate: {
      id: prepared.state.candidate.id,
      version: prepared.state.candidate.version,
      sha256: prepared.state.candidate.sha256,
      inputFingerprintSha256: storedCandidate.input_fingerprint_sha256,
      blockMode: prepared.state.candidate.blockMode,
      interval: prepared.state.candidate.interval,
      workoutDocuments: prepared.state.candidate.workoutDocuments,
      factsUsed: prepared.state.candidate.factsUsed,
      factsMissing: prepared.state.candidate.factsMissing,
      performanceAdaptation: prepared.state.candidate.performanceAdaptation,
      endpoint: {
        workoutDate: endpoint.workoutDate,
        workoutIdentity: endpoint.workoutIdentity,
        mainPaceRanges: endpointPaces,
        completionFirst: true,
      },
    },
    review: {
      candidateId: review.candidate.candidateId,
      reviewChecksum: review.candidate.reviewChecksum,
      reviewTokenSha256: await digestSha256Hex(review.candidate.reviewToken),
      sealed: true,
    },
    invariants: {
      providerDispatchCount: 0,
      responseCountDelta: 0,
      candidateCountDeltaDuringThisRun: candidateCountDelta,
      currentCompilerCandidateCount: currentCompilerCandidates.length,
      idempotentReplayStable: true,
      confirmationCount: postReview.source.confirmationCount,
      calendarWorkoutCount: postReview.source.confirmedCalendarWorkoutCount,
      futureProjectionCalendarRowCount: postReview.projections.calendarRowCount,
      rawResponseIncluded: false,
      rawPromptIncluded: false,
      reviewTokenIncluded: false,
      personalIdentityUsed: false,
      hostedAction: false,
    },
  };
}

function requireRecord(value: unknown, label: string) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} is absent.`);
  return value as Record<string, unknown>;
}

function nullableInteger(value: unknown) {
  assert.ok(value === null || (Number.isInteger(value) && Number(value) >= 0));
  return value === null ? null : Number(value);
}

async function readSecondContinuationRetentionCounts(input: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const [responses, candidates] = await Promise.all([
    input.supabase
      .from("ai_plan_generation_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId),
    input.supabase
      .from("adaptive_training_detailed_candidates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId),
  ]);
  if (responses.error) throw new Error(responses.error.message);
  if (candidates.error) throw new Error(candidates.error.message);
  return { responses: responses.count ?? 0, candidates: candidates.count ?? 0 };
}

export async function seedRunnerDesignProfileFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const planReceipt = await createRunnerDesignProfilePlan({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate,
  });
  const plannedWorkoutByDate = new Map(
    planReceipt.workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => [workout.workout_date, workout]),
  );
  const activityDateByKey = buildFixtureActivityDateByKey({
    asOfDate,
    plannedWorkoutDates: plannedWorkoutByDate.keys(),
  });

  const receipts: FixtureSeedReceipt[] = [];
  for (const spec of ACTIVITY_SPECS) {
    const localDate = requireFixtureActivityDate(activityDateByKey, spec.key);
    const fileBuffer = buildFixtureSource(spec, localDate);
    const storagePath = `${input.userId}/${RUNNER_DESIGN_PROFILE_FIXTURE_VERSION}/${spec.key}.fit`;
    const plannedWorkout = spec.planned ? (plannedWorkoutByDate.get(localDate) ?? null) : null;
    const assetId = randomUUID();
    const stored = await input.supabase.storage
      .from(WORKOUT_RESULT_STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: "application/octet-stream",
        upsert: true,
      });
    if (stored.error) throw new Error(stored.error.message);

    const asset = await input.supabase
      .from("workout_result_assets")
      .insert({
        id: assetId,
        user_id: input.userId,
        planned_workout_id: plannedWorkout?.id ?? null,
        asset_kind: "garmin_fit",
        storage_bucket: WORKOUT_RESULT_STORAGE_BUCKET,
        storage_path: storagePath,
        original_file_name: `${spec.key}.fit`,
        mime_type: "application/octet-stream",
        file_size_bytes: fileBuffer.length,
        parse_status: "uploaded",
      })
      .select("id")
      .single();
    if (asset.error) {
      await input.supabase.storage.from(WORKOUT_RESULT_STORAGE_BUCKET).remove([storagePath]);
      throw new Error(asset.error.message);
    }

    let receipt;
    try {
      const parsedWorkout = await parseGarminFitActivity(fileBuffer);
      assertParsedFixtureSource(parsedWorkout, spec, localDate);
      receipt = await persistGarminFitActivitySource({
        userId: input.userId,
        assetKind: "garmin_fit",
        storageBucket: WORKOUT_RESULT_STORAGE_BUCKET,
        storagePath,
        originalFileName: `${spec.key}.fit`,
        mimeType: "application/octet-stream",
        fileSizeBytes: fileBuffer.length,
        fileBuffer,
        parsedWorkout,
        sourceCapabilities: {
          fixture_class: RUNNER_DESIGN_PROFILE_FIXTURE_VERSION,
          generated_local_qa_fit: true,
          reprocessable: true,
          normalized_samples_persisted: false,
        },
      });
      const activityProjection = await readRunnerActivityProjection({
        userId: input.userId,
        activityId: receipt.activityId,
        activityRevisionId: receipt.activityRevisionId,
      });
      await reconcileWorkoutResultProjection({
        userId: input.userId,
        plannedWorkout,
        workoutLogId: null,
        activitySource: receipt,
        activityProjection,
        candidateAssetId: assetId,
        candidateStoragePath: storagePath,
        primaryFile: {
          primaryFileKind: "fit",
          primaryFileName: `${spec.key}.fit`,
          fileBuffer,
        },
        initialParseStatus: "uploaded",
      });
    } catch (error) {
      await input.supabase.storage.from(WORKOUT_RESULT_STORAGE_BUCKET).remove([storagePath]);
      throw error;
    }
    receipts.push({
      activityId: receipt.activityId,
      activityRevisionId: receipt.activityRevisionId,
      sourceRevisionId: receipt.sourceRevisionId,
      key: spec.key,
    });
  }

  for (const spec of ACTIVITY_SPECS.filter((candidate) => candidate.sessionRpe != null)) {
    const receipt = receipts.find((candidate) => candidate.key === spec.key);
    if (!receipt || spec.sessionRpe == null) {
      throw new Error(`Missing fixture RPE receipt for ${spec.key}.`);
    }
    await recordRunnerActivitySessionRpeForUser(input.userId, {
      activityId: receipt.activityId,
      activityRevisionId: receipt.activityRevisionId,
      rpe: spec.sessionRpe,
      outcome: "completed",
    });
  }

  for (const spec of ACTIVITY_SPECS.filter(
    (candidate) => candidate.sourceState === "removal_pending",
  )) {
    const receipt = receipts.find((candidate) => candidate.key === spec.key);
    if (!receipt) throw new Error(`Missing fixture receipt for ${spec.key}.`);
    await markRunnerActivitySourceRemovalPendingForFixture({
      supabase: input.supabase,
      userId: input.userId,
      sourceRevisionId: receipt.sourceRevisionId,
    });
  }

  for (const spec of ACTIVITY_SPECS.filter((candidate) => candidate.sourceState === "removed")) {
    const receipt = receipts.find((candidate) => candidate.key === spec.key);
    if (!receipt) throw new Error(`Missing fixture receipt for ${spec.key}.`);
    await removeRunnerActivityOriginalFilesForActivity({
      userId: input.userId,
      activityId: receipt.activityId,
    });
  }

  return readRunnerDesignProfileFixture({
    supabase: input.supabase,
    userId: input.userId,
    asOfDate,
  });
}

export async function readRunnerDesignProfileFixture(input: {
  supabase: SupabaseClient;
  userId: string;
  asOfDate?: string;
}) {
  const asOfDate = normalizeAsOfDate(input.asOfDate);
  const pages = [];
  let cursor: string | null = null;
  do {
    const page = await listRunnerActivityHistoryForUser({
      userId: input.userId,
      cursor,
    });
    pages.push(page);
    cursor = page.nextCursor;
  } while (cursor);

  const items = pages.flatMap((page) => page.items);
  const progress = await getRunnerActivityProgressForUser({
    userId: input.userId,
    asOfDate,
  });
  const sourceRevisions = await input.supabase
    .from("runner_activity_source_revisions")
    .select("raw_state, raw_storage_bucket, raw_storage_path, normalizer_version, capabilities")
    .eq("user_id", input.userId);
  if (sourceRevisions.error) throw new Error(sourceRevisions.error.message);
  const planCycles = await input.supabase
    .from("plan_cycles")
    .select(
      "id, status, source_template, source_kind, start_date, end_date, goal_metadata, saved_plan_payload",
    )
    .eq("user_id", input.userId);
  if (planCycles.error) throw new Error(planCycles.error.message);
  const materializedPlans = planCycles.data.filter((plan) => plan.saved_plan_payload === null);
  const sourcePlans = planCycles.data.filter((plan) => plan.saved_plan_payload !== null);
  assert.equal(
    materializedPlans.length,
    0,
    "The design profile must not create a duplicate materialized plan record.",
  );
  assert.equal(sourcePlans.length, 1, "The design profile requires exactly one immutable source.");
  assert.equal(
    planCycles.data.filter((plan) => plan.status === "active").length,
    0,
    "The design profile must not restore active-plan authority.",
  );
  const sourcePlan = sourcePlans[0]!;
  const plannedWorkouts = await input.supabase
    .from("planned_workouts")
    .select(
      "id, plan_cycle_id, origin_kind, source_workout_id, workout_date, workout_type, workout_family, workout_identity, steps",
    )
    .eq("user_id", input.userId)
    .eq("plan_cycle_id", sourcePlan.id)
    .order("workout_date", { ascending: true });
  if (plannedWorkouts.error) throw new Error(plannedWorkouts.error.message);

  const activityDateByKey = buildFixtureActivityDateByKey({
    asOfDate,
    plannedWorkoutDates: plannedWorkouts.data
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.workout_date),
  });
  const expected = expectedFixtureSummary(asOfDate, activityDateByKey);
  const matchedWorkoutIds = new Set(
    items.flatMap((item) => (item.plannedWorkout ? [item.plannedWorkout.id] : [])),
  );
  const fitCompletedWorkoutIds = await getFitCompletedPlannedWorkoutIds({
    userId: input.userId,
    plannedWorkoutIds: plannedWorkouts.data.map((workout) => workout.id),
  });
  const actual = {
    activityCount: items.length,
    pageItemCounts: pages.map((page) => page.items.length),
    uniqueActivityCount: new Set(items.map((item) => item.id)).size,
    firstDate: items.at(-1)?.historicalTime.localDate ?? null,
    lastDate: items.at(0)?.historicalTime.localDate ?? null,
    mondayWeekCount: new Set(
      items.flatMap((item) =>
        item.historicalTime.localDate ? [startOfWeekIso(item.historicalTime.localDate)] : [],
      ),
    ).size,
    plannedCount: items.filter((item) => item.plannedWorkout).length,
    unplannedCount: items.filter((item) => !item.plannedWorkout).length,
    elapsedDurationCount: items.filter((item) => item.duration?.basis === "elapsed").length,
    missingDistanceCount: items.filter((item) => item.distanceKm == null).length,
    missingHeartRateCount: items.filter((item) => item.observedHeartRate == null).length,
    sourceRemovedCount: items.filter((item) => item.source.rawState === "removed").length,
    sourceRemovalPendingCount: items.filter((item) => item.source.rawState === "removal_pending")
      .length,
    sourceAvailableCount: items.filter((item) => item.source.rawState === "available").length,
  };
  assert.deepEqual(actual, expected.history);
  assert.equal(actual.plannedCount, MIN_MATCHED_ACTIVITY_COUNT);
  assert.equal(actual.unplannedCount, ACTIVITY_SPECS.length - MIN_MATCHED_ACTIVITY_COUNT);
  assert.equal(matchedWorkoutIds.size, MIN_MATCHED_ACTIVITY_COUNT);
  assert.equal(plannedWorkouts.data.length, 55);
  assert.deepEqual([...fitCompletedWorkoutIds].sort(), [...matchedWorkoutIds].sort());
  const retryableRemoval = items.find((item) => item.source.rawState === "removal_pending");
  assert.ok(retryableRemoval);
  assert.equal(retryableRemoval.source.originalRetained, false);
  assert.equal(retryableRemoval.source.reprocessingAvailable, false);
  assert.equal(retryableRemoval.quality.updating, false);
  assert.equal(retryableRemoval.capabilities.canRemoveOriginalFile, true);
  assert.equal(sourcePlan.source_kind, "ai_authored_plan_first_v1");
  assert.equal(
    readFixtureResponseId(sourcePlan.goal_metadata),
    AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID,
  );
  assert.ok(sourcePlan.start_date < asOfDate);
  assert.ok(sourcePlan.end_date > asOfDate);
  assert.equal(
    plannedWorkouts.data.every(
      (workout) =>
        workout.plan_cycle_id === sourcePlan.id &&
        workout.origin_kind === "ai" &&
        Boolean(workout.source_workout_id),
    ),
    true,
  );
  const workoutTypes = new Set(plannedWorkouts.data.map((workout) => workout.workout_type));
  const workoutFamilies = new Set(
    plannedWorkouts.data.flatMap((workout) =>
      workout.workout_family ? [workout.workout_family] : [],
    ),
  );
  const workoutIdentities = new Set(
    plannedWorkouts.data.flatMap((workout) =>
      workout.workout_identity ? [workout.workout_identity] : [],
    ),
  );
  for (const expectedType of ["rest", "easy", "quality", "long_run"]) {
    assert.ok(
      workoutTypes.has(expectedType),
      `Missing design-profile workout type ${expectedType}.`,
    );
  }
  for (const expectedFamily of [
    "rest",
    "easy",
    "recovery",
    "intervals",
    "tempo",
    "hills",
    "long",
  ]) {
    assert.ok(
      workoutFamilies.has(expectedFamily),
      `Missing design-profile workout family ${expectedFamily}.`,
    );
  }
  for (const expectedIdentity of [
    "easy_run_with_strides",
    "distance_intervals",
    "uphill_repeats",
    "long_aerobic_run",
  ]) {
    assert.ok(
      workoutIdentities.has(expectedIdentity),
      `Missing design-profile workout identity ${expectedIdentity}.`,
    );
  }
  assert.ok(plannedWorkouts.data.some((workout) => workout.workout_date < asOfDate));
  assert.ok(plannedWorkouts.data.some((workout) => workout.workout_date > asOfDate));
  const futureFitCompletedWorkoutCount = plannedWorkouts.data.filter(
    (workout) => workout.workout_date > asOfDate && fitCompletedWorkoutIds.has(workout.id),
  ).length;
  assert.equal(futureFitCompletedWorkoutCount, 0);
  assert.equal(
    plannedWorkouts.data
      .filter((workout) => workout.workout_type !== "rest")
      .every((workout) => Array.isArray(workout.steps) && workout.steps.length > 0),
    true,
  );
  assert.equal(sourceRevisions.data.length, ACTIVITY_SPECS.length);
  assert.equal(
    sourceRevisions.data.every(
      (revision) =>
        revision.normalizer_version === "garmin_fit_activity_v1" &&
        isFixtureCapabilities(revision.capabilities),
    ),
    true,
  );
  const retainedSource = sourceRevisions.data.find(
    (revision) =>
      revision.raw_state === "available" &&
      revision.raw_storage_bucket &&
      revision.raw_storage_path,
  );
  assert.ok(retainedSource);
  const retainedRaw = await input.supabase.storage
    .from(retainedSource.raw_storage_bucket)
    .download(retainedSource.raw_storage_path);
  if (retainedRaw.error) throw new Error(retainedRaw.error.message);
  const reparsed = await parseGarminFitActivity(Buffer.from(await retainedRaw.data.arrayBuffer()));
  assert.equal(reparsed.sourceKind, "garmin_fit");
  assert.ok(reparsed.activityLocalDate);
  const pendingSource = sourceRevisions.data.find(
    (revision) =>
      revision.raw_state === "removal_pending" &&
      revision.raw_storage_bucket &&
      revision.raw_storage_path,
  );
  assert.ok(pendingSource);
  const pendingRaw = await input.supabase.storage
    .from(pendingSource.raw_storage_bucket)
    .download(pendingSource.raw_storage_path);
  if (pendingRaw.error) throw new Error(pendingRaw.error.message);

  const current = progress.rolling28Day.current;
  const previous = progress.rolling28Day.previous;
  assert.deepEqual(snapshotValues(current), expected.current28Day);
  assert.deepEqual(snapshotValues(previous), expected.previous28Day);
  assert.equal(progress.interpretation.volumeIsFitness, false);
  assert.equal(progress.interpretation.derivedCoachingMetricsAvailable, false);
  assert.equal(progress.interpretation.unavailableReason, "later_gate_metric_contract_required");
  assert.equal(progress.advancedMetrics.status, "current");
  if (progress.advancedMetrics.status !== "current") {
    throw new Error("Runner design profile expected current advanced metrics.");
  }
  const currentLoad = progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric;
  const previousLoad = progress.advancedMetrics.sessionRpeLoad.rolling28Day.previous.metric;
  const observedTrackRecord = progress.advancedMetrics.records.items.find(
    (record) =>
      record.recordClass === "hito_observed_whole_activity" &&
      record.distanceKey === "5_km" &&
      record.context === "track",
  );
  assert.ok(observedTrackRecord);
  assert.equal(currentLoad.availability, "available");
  assert.equal(currentLoad.value, 500);
  assert.equal(currentLoad.includedObservationCount, 1);
  assert.equal(currentLoad.unavailableObservationCount, 14);
  assert.ok(currentLoad.unavailableReasons.includes("runner_rpe_not_recorded"));
  assert.equal(previousLoad.availability, "unavailable");
  assert.equal(previousLoad.includedObservationCount, 0);
  assert.equal(previousLoad.unavailableObservationCount, 15);
  assert.ok(previousLoad.unavailableReasons.includes("runner_rpe_not_recorded"));
  const repeatedProgress = await getRunnerActivityProgressForUser({
    userId: input.userId,
    asOfDate,
  });
  assert.equal(repeatedProgress.rolling28Day.current.id, current.id);
  assert.equal(repeatedProgress.rolling28Day.previous.id, previous.id);
  await assert.rejects(
    listRunnerActivityHistoryForUser({
      userId: input.userId,
      cursor: "not-a-valid-activity-cursor",
    }),
    /cursor is invalid/i,
  );
  assert.equal(
    JSON.stringify({ items, progress }).match(
      /raw_storage|storage_path|original_file_name|fingerprint|generated_local_qa_fit/gi,
    ),
    null,
  );

  return {
    fixtureVersion: RUNNER_DESIGN_PROFILE_FIXTURE_VERSION,
    asOfDate,
    userId: input.userId,
    role: RUNNER_DESIGN_PROFILE_FIXTURE_ROLE,
    planState: {
      materializedPlanCount: materializedPlans.length,
      savedPlanCount: sourcePlans.length,
      activeAuthorityCount: planCycles.data.filter((plan) => plan.status === "active").length,
      sourcePlanId: sourcePlan.id,
      startDate: sourcePlan.start_date,
      endDate: sourcePlan.end_date,
      workoutCount: plannedWorkouts.data.length,
      workoutTypes: [...workoutTypes].sort(),
      workoutFamilies: [...workoutFamilies].sort(),
      workoutIdentities: [...workoutIdentities].sort(),
    },
    history: actual,
    completionState: {
      matchedWorkoutCount: matchedWorkoutIds.size,
      fitCompletedWorkoutCount: fitCompletedWorkoutIds.size,
      futureFitCompletedWorkoutCount,
    },
    progress: {
      current28Day: snapshotValues(current),
      previous28Day: snapshotValues(previous),
      calendarWeekCount: progress.calendarWeeks.length,
      formulaVersion: current.formulaVersion,
      derivedCoachingMetricsAvailable: progress.interpretation.derivedCoachingMetricsAvailable,
      sessionRpeLoad: {
        currentAvailability: currentLoad.availability,
        currentValue: currentLoad.value,
        currentIncludedObservationCount: currentLoad.includedObservationCount,
        currentUnavailableObservationCount: currentLoad.unavailableObservationCount,
        previousAvailability: previousLoad.availability,
        previousUnavailableObservationCount: previousLoad.unavailableObservationCount,
      },
      observedRecordContexts: progress.advancedMetrics.records.items.map(
        (record) => record.context,
      ),
      retryableSourceRemoval: {
        rawState: retryableRemoval.source.rawState,
        updating: retryableRemoval.quality.updating,
        canRemoveOriginalFile: retryableRemoval.capabilities.canRemoveOriginalFile,
        rawObjectRetained: true,
      },
      retainedRawReprocessable: true,
      immutableSnapshotReadback: true,
    },
  };
}

export async function verifyRunnerDesignProfileFixtureRuntime(input: {
  runtimeUrl: string;
  username: string;
  password: string;
}) {
  if (!isLoopbackRuntimeUrl(input.runtimeUrl)) {
    throw new Error("Activity review runtime verification requires a loopback URL.");
  }
  const baseUrl = new URL(input.runtimeUrl);
  const unauthorizedHistory = await fetch(new URL("/api/runner-activities", baseUrl));
  assert.equal(unauthorizedHistory.status, 401);
  assert.equal((await unauthorizedHistory.json()).code, "auth_required");
  const unauthorizedProgress = await fetch(new URL("/api/runner-activity-progress", baseUrl));
  assert.equal(unauthorizedProgress.status, 401);
  assert.equal((await unauthorizedProgress.json()).code, "auth_required");

  const { cookie } = await loginToLoopbackRuntime({
    runtimeUrl: input.runtimeUrl,
    username: input.username,
    password: input.password,
    next: "/progress",
  });
  const headers = { cookie };

  const firstResponse = await fetch(new URL("/api/runner-activities", baseUrl), { headers });
  assert.equal(firstResponse.status, 200);
  const firstBody = await firstResponse.json();
  assert.equal(firstBody.ok, true);
  assert.equal(firstBody.history.items.length, 20);
  assert.ok(firstBody.history.nextCursor);
  const secondUrl = new URL("/api/runner-activities", baseUrl);
  secondUrl.searchParams.set("cursor", firstBody.history.nextCursor);
  const secondResponse = await fetch(secondUrl, { headers });
  assert.equal(secondResponse.status, 200);
  const secondBody = await secondResponse.json();
  assert.equal(secondBody.ok, true);
  assert.equal(secondBody.history.items.length, 10);
  assert.equal(secondBody.history.nextCursor, null);
  const runtimeItems = [...firstBody.history.items, ...secondBody.history.items];
  const retryableRemoval = runtimeItems.find(
    (item: { source: { rawState: string } }) => item.source.rawState === "removal_pending",
  );
  assert.ok(retryableRemoval);
  assert.equal(retryableRemoval.source.originalRetained, false);
  assert.equal(retryableRemoval.source.reprocessingAvailable, false);
  assert.equal(retryableRemoval.quality.updating, false);
  assert.equal(retryableRemoval.capabilities.canRemoveOriginalFile, true);

  const progressResponse = await fetch(new URL("/api/runner-activity-progress", baseUrl), {
    headers,
  });
  assert.equal(progressResponse.status, 200);
  const progressBody = await progressResponse.json();
  assert.equal(progressBody.ok, true);
  assert.equal(progressBody.progress.rolling28Day.current.facts.sessions.value, 15);
  assert.equal(progressBody.progress.advancedMetrics.status, "current");
  assert.equal(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric.availability,
    "available",
  );
  assert.equal(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric.value,
    500,
  );
  assert.equal(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric
      .includedObservationCount,
    1,
  );
  assert.ok(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.current.metric.unavailableReasons.includes(
      "runner_rpe_not_recorded",
    ),
  );
  assert.equal(
    progressBody.progress.advancedMetrics.sessionRpeLoad.rolling28Day.previous.metric.availability,
    "unavailable",
  );
  assert.ok(
    progressBody.progress.advancedMetrics.records.items.some(
      (record: { recordClass: string; distanceKey: string; context: string | null }) =>
        record.recordClass === "hito_observed_whole_activity" &&
        record.distanceKey === "5_km" &&
        record.context === "track",
    ),
  );
  assert.equal(progressBody.progress.advancedMetrics.detailedMetrics.status, "unavailable");
  assert.equal(
    progressBody.progress.advancedMetrics.detailedMetrics.reason,
    "normalized_stream_not_persisted",
  );
  const serialized = JSON.stringify({ firstBody, secondBody, progressBody });
  assert.doesNotMatch(
    serialized,
    /raw_storage|storage_path|original_file_name|fingerprint|generated_local_qa_fit/i,
  );

  return {
    runtimeUrl: baseUrl.origin,
    unauthenticatedStatus: 401,
    authenticatedPageItemCounts: [20, 10],
    current28DaySessions: 15,
    advancedMetricStatus: "current",
    sessionRpeLoadAvailability: "available",
    sessionRpeLoadValue: 500,
    previousSessionRpeLoadAvailability: "unavailable",
    retryableSourceRemoval: {
      rawState: "removal_pending",
      updating: false,
      canRemoveOriginalFile: true,
    },
    gate5UnavailableReason: "normalized_stream_not_persisted",
    rawPrivateFieldsExposed: false,
  };
}

function activity(
  key: string,
  daysAgo: number,
  title: string,
  timerDurationMin: number | null,
  elapsedDurationMin: number,
  distanceKm: number | null,
  averageHeartRate: number | null,
  elevationGainM: number | null,
  planned: boolean,
  sourceState: FixtureActivitySpec["sourceState"] = "available",
  sessionRpe: number | null = null,
  runningContext: "track" | null = null,
): FixtureActivitySpec {
  return {
    key,
    daysAgo,
    title,
    timerDurationMin,
    elapsedDurationMin,
    distanceKm,
    averageHeartRate,
    elevationGainM,
    planned,
    sourceState,
    sessionRpe,
    runningContext,
  };
}

function snapshotEvidence(snapshot: RunnerFitnessProfileSnapshotV1) {
  return {
    version: snapshot.version,
    snapshotId: snapshot.snapshotId,
    runnerFactsRevision: snapshot.runnerFactsRevision,
    cutoffDate: snapshot.cutoffDate,
    formulaVersions: snapshot.formulaVersions,
    componentStates: Object.fromEntries(
      Object.entries(snapshot.components).map(([key, component]) => [key, component.state]),
    ),
    provenance: snapshot.provenance,
  };
}

function readFrozenContinuationProfile(
  value: Database["public"]["Tables"]["adaptive_training_detailed_candidates"]["Row"]["input_snapshot"],
) {
  return z
    .object({
      decision: z
        .object({
          fitnessProfile: z
            .object({
              snapshotId: z.string().min(1),
              runnerFactsRevision: z.string().min(1),
              cutoffDate: z.string().date(),
              formulaVersions: z.object({
                profile: z.string().min(1),
                runnerActivity: z.array(z.string().min(1)),
                sessionRpeLoad: z.string().min(1).nullable(),
              }),
              quality: z.enum([
                "available",
                "partial",
                "unavailable",
                "updating",
                "not_applicable",
                "contradictory",
              ]),
              constraints: z.unknown().nullable(),
              profileConstraintsFingerprint: z.string().min(1),
              calendarOutcomeFingerprint: z.string().min(1),
              evidenceRevisionFingerprint: z.string().min(1),
            })
            .passthrough(),
        })
        .passthrough(),
    })
    .passthrough()
    .parse(value).decision.fitnessProfile;
}

function normalizeAsOfDate(value: string | undefined) {
  return AS_OF_DATE_SCHEMA.parse(value ?? todayIso());
}

function buildFixtureActivityDateByKey(input: {
  asOfDate: string;
  plannedWorkoutDates: Iterable<string>;
}) {
  const activityDateByKey = new Map(
    ACTIVITY_SPECS.map((spec) => [spec.key, addDaysIso(input.asOfDate, -spec.daysAgo)]),
  );
  const plannedWorkoutDates = [...new Set(input.plannedWorkoutDates)]
    .filter((date) => date <= input.asOfDate)
    .sort();
  const occupiedActivityDates = new Set(activityDateByKey.values());
  const matchedPlanDates = new Set(
    ACTIVITY_SPECS.flatMap((spec) => {
      if (!spec.planned) return [];
      const date = requireFixtureActivityDate(activityDateByKey, spec.key);
      return plannedWorkoutDates.includes(date) ? [date] : [];
    }),
  );

  for (const spec of ACTIVITY_SPECS) {
    if (matchedPlanDates.size <= MIN_MATCHED_ACTIVITY_COUNT) break;
    if (!spec.planned) continue;
    const currentDate = requireFixtureActivityDate(activityDateByKey, spec.key);
    if (!matchedPlanDates.has(currentDate)) continue;
    const currentWeek = startOfWeekIso(currentDate);
    const unplannedDate = Array.from({ length: 7 }, (_, offset) => addDaysIso(currentWeek, offset))
      .filter(
        (date) =>
          date <= input.asOfDate &&
          !plannedWorkoutDates.includes(date) &&
          !occupiedActivityDates.has(date),
      )
      .sort(
        (left, right) =>
          Math.abs(diffDaysIso(currentDate, left)) - Math.abs(diffDaysIso(currentDate, right)) ||
          left.localeCompare(right),
      )[0];
    if (!unplannedDate) continue;
    occupiedActivityDates.delete(currentDate);
    occupiedActivityDates.add(unplannedDate);
    activityDateByKey.set(spec.key, unplannedDate);
    matchedPlanDates.delete(currentDate);
  }

  for (const spec of ACTIVITY_SPECS) {
    if (matchedPlanDates.size >= MIN_MATCHED_ACTIVITY_COUNT) break;
    if (!spec.planned) continue;
    const currentDate = requireFixtureActivityDate(activityDateByKey, spec.key);
    if (matchedPlanDates.has(currentDate)) continue;
    const currentWeek = startOfWeekIso(currentDate);
    const alignedDate = plannedWorkoutDates
      .filter(
        (date) =>
          startOfWeekIso(date) === currentWeek &&
          !matchedPlanDates.has(date) &&
          !occupiedActivityDates.has(date),
      )
      .sort(
        (left, right) =>
          Math.abs(diffDaysIso(currentDate, left)) - Math.abs(diffDaysIso(currentDate, right)) ||
          left.localeCompare(right),
      )[0];
    if (!alignedDate) continue;
    occupiedActivityDates.delete(currentDate);
    occupiedActivityDates.add(alignedDate);
    activityDateByKey.set(spec.key, alignedDate);
    matchedPlanDates.add(alignedDate);
  }

  assert.equal(
    matchedPlanDates.size,
    MIN_MATCHED_ACTIVITY_COUNT,
    `The design profile aligned ${matchedPlanDates.size} matched activities instead of ${MIN_MATCHED_ACTIVITY_COUNT}.`,
  );
  return activityDateByKey;
}

function requireFixtureActivityDate(activityDateByKey: ReadonlyMap<string, string>, key: string) {
  const date = activityDateByKey.get(key);
  if (!date) throw new Error(`Missing design-profile activity date for ${key}.`);
  return date;
}

function buildFixtureSource(spec: FixtureActivitySpec, localDate: string) {
  const startedAtSeconds = fitTimestampSeconds(`${localDate}T07:00:00.000Z`);
  const finishedAtSeconds = startedAtSeconds + Math.round(spec.elapsedDurationMin * 60);
  const fileIdFields = [
    fitField(0, 1, 0x00, 4),
    fitField(1, 2, 0x84, 1),
    fitField(2, 2, 0x84, 0),
    fitField(4, 4, 0x86, startedAtSeconds),
  ];
  const recordFields = [fitField(253, 4, 0x86, startedAtSeconds)];
  const sessionFields = [
    fitField(253, 4, 0x86, finishedAtSeconds),
    fitField(2, 4, 0x86, startedAtSeconds),
    fitField(5, 1, 0x00, 1),
    fitField(6, 1, 0x00, spec.runningContext === "track" ? 4 : 0),
    fitField(7, 4, 0x86, Math.round(spec.elapsedDurationMin * 60 * 1000)),
    ...(spec.timerDurationMin == null
      ? []
      : [fitField(8, 4, 0x86, Math.round(spec.timerDurationMin * 60 * 1000))]),
    ...(spec.distanceKm == null
      ? []
      : [fitField(9, 4, 0x86, Math.round(spec.distanceKm * 1000 * 100))]),
    ...(spec.averageHeartRate == null
      ? []
      : [
          fitField(16, 1, 0x02, spec.averageHeartRate),
          fitField(17, 1, 0x02, spec.averageHeartRate + 12),
        ]),
    ...(spec.elevationGainM == null
      ? []
      : [fitField(22, 2, 0x84, spec.elevationGainM), fitField(23, 2, 0x84, spec.elevationGainM)]),
  ];
  const activityFields = [
    fitField(253, 4, 0x86, finishedAtSeconds),
    fitField(
      0,
      4,
      0x86,
      Math.round((spec.timerDurationMin ?? spec.elapsedDurationMin) * 60 * 1000),
    ),
    fitField(1, 2, 0x84, 1),
    fitField(2, 1, 0x00, 0),
    fitField(5, 4, 0x86, startedAtSeconds),
  ];
  const data = Buffer.concat([
    fitDefinition(0, 0, fileIdFields),
    fitData(0, fileIdFields),
    fitDefinition(1, 20, recordFields),
    fitData(1, recordFields),
    fitData(
      1,
      recordFields.map((field) => ({ ...field, value: finishedAtSeconds })),
    ),
    fitDefinition(2, 18, sessionFields),
    fitData(2, sessionFields),
    fitDefinition(3, 34, activityFields),
    fitData(3, activityFields),
  ]);
  const header = Buffer.alloc(14);
  header.writeUInt8(14, 0);
  header.writeUInt8(0x20, 1);
  header.writeUInt16LE(0x0810, 2);
  header.writeUInt32LE(data.length, 4);
  header.write(".FIT", 8, "ascii");
  header.writeUInt16LE(fitCrc(header, 0, 12), 12);
  const fileCrc = Buffer.alloc(2);
  fileCrc.writeUInt16LE(fitCrc(data, 0, data.length), 0);
  return Buffer.concat([header, data, fileCrc]);
}

export function buildAdaptiveTrainingQualityFitFile(input: {
  localDate: string;
  evidenceKind: "compatible" | "incomplete";
}) {
  const localDate = AS_OF_DATE_SCHEMA.parse(input.localDate);
  const compatible = input.evidenceKind === "compatible";
  return buildFixtureSource(
    {
      key: `hosted-${input.evidenceKind}`,
      daysAgo: 0,
      title: compatible ? "Hosted adaptive factual run" : "Hosted adaptive incomplete factual run",
      timerDurationMin: compatible ? 42 : 38,
      elapsedDurationMin: compatible ? 43 : 40,
      distanceKm: compatible ? 7.2 : null,
      averageHeartRate: compatible ? 142 : null,
      elevationGainM: compatible ? 35 : null,
      planned: true,
      sourceState: "available",
      sessionRpe: null,
      runningContext: null,
    },
    localDate,
  );
}

function assertParsedFixtureSource(
  parsed: Awaited<ReturnType<typeof parseGarminFitActivity>>,
  spec: FixtureActivitySpec,
  localDate: string,
) {
  assert.equal(parsed.activityLocalDate, localDate);
  assert.equal(parsed.totalTimerDurationMin, spec.timerDurationMin);
  assert.equal(parsed.totalElapsedDurationMin, spec.elapsedDurationMin);
  assert.equal(parsed.totalDistanceKm, spec.distanceKm);
  assert.equal(parsed.avgHeartRate, spec.averageHeartRate);
  assert.equal(parsed.totalAscentM, spec.elevationGainM);
  assert.ok(parsed.gpsPointCount > 0);
  const summary = parsed.summaryPayload as {
    session?: { subSport?: string | null };
  };
  assert.equal(summary.session?.subSport ?? null, spec.runningContext ?? "generic");
}

function expectedFixtureSummary(asOfDate: string, activityDateByKey: ReadonlyMap<string, string>) {
  const currentStartDate = addDaysIso(asOfDate, -27);
  const previousEndDate = addDaysIso(currentStartDate, -1);
  const previousStartDate = addDaysIso(previousEndDate, -27);
  const activityDates = ACTIVITY_SPECS.map((spec) =>
    requireFixtureActivityDate(activityDateByKey, spec.key),
  ).sort();
  return {
    history: {
      activityCount: ACTIVITY_SPECS.length,
      pageItemCounts: [20, 10],
      uniqueActivityCount: ACTIVITY_SPECS.length,
      firstDate: activityDates[0],
      lastDate: activityDates.at(-1),
      mondayWeekCount: new Set(activityDates.map((date) => startOfWeekIso(date))).size,
      plannedCount: MIN_MATCHED_ACTIVITY_COUNT,
      unplannedCount: ACTIVITY_SPECS.length - MIN_MATCHED_ACTIVITY_COUNT,
      elapsedDurationCount: ACTIVITY_SPECS.filter((spec) => spec.timerDurationMin == null).length,
      missingDistanceCount: ACTIVITY_SPECS.filter((spec) => spec.distanceKm == null).length,
      missingHeartRateCount: ACTIVITY_SPECS.filter((spec) => spec.averageHeartRate == null).length,
      sourceRemovedCount: ACTIVITY_SPECS.filter((spec) => spec.sourceState === "removed").length,
      sourceRemovalPendingCount: ACTIVITY_SPECS.filter(
        (spec) => spec.sourceState === "removal_pending",
      ).length,
      sourceAvailableCount: ACTIVITY_SPECS.filter((spec) => spec.sourceState === "available")
        .length,
    },
    current28Day: expectedWindowSummary(currentStartDate, asOfDate, activityDateByKey),
    previous28Day: expectedWindowSummary(previousStartDate, previousEndDate, activityDateByKey),
  };
}

function expectedWindowSummary(
  startDate: string,
  endDate: string,
  activityDateByKey: ReadonlyMap<string, string>,
) {
  const specs = ACTIVITY_SPECS.filter((spec) => {
    const date = requireFixtureActivityDate(activityDateByKey, spec.key);
    return date >= startDate && date <= endDate;
  });
  const timerSpecs = specs.filter((spec) => spec.timerDurationMin != null);
  const distanceSpecs = specs.filter((spec) => spec.distanceKm != null);
  const elevationSpecs = specs.filter((spec) => spec.elevationGainM != null);
  return {
    sessions: specs.length,
    runningTimeMin: sum(timerSpecs.map((spec) => spec.timerDurationMin ?? 0)),
    runningTimeConfidence: timerSpecs.length === specs.length ? "complete" : "partial",
    runningTimeMissingCount: specs.length - timerSpecs.length,
    distanceKm: sum(distanceSpecs.map((spec) => spec.distanceKm ?? 0)),
    distanceConfidence: distanceSpecs.length === specs.length ? "complete" : "partial",
    distanceMissingCount: specs.length - distanceSpecs.length,
    elevationGainM: sum(elevationSpecs.map((spec) => spec.elevationGainM ?? 0)),
    elevationConfidence: elevationSpecs.length === specs.length ? "complete" : "partial",
    elevationMissingCount: specs.length - elevationSpecs.length,
    longestDistanceKm: Math.max(...distanceSpecs.map((spec) => spec.distanceKm ?? 0)),
    longestDurationMin: Math.max(...timerSpecs.map((spec) => spec.timerDurationMin ?? 0)),
  };
}

function snapshotValues(
  snapshot: Awaited<ReturnType<typeof getRunnerActivityProgressForUser>>["rolling28Day"]["current"],
) {
  return {
    sessions: snapshot.facts.sessions.value,
    runningTimeMin: snapshot.facts.runningTime.value,
    runningTimeConfidence: snapshot.facts.runningTime.confidence,
    runningTimeMissingCount: snapshot.facts.runningTime.missingActivityCount,
    distanceKm: snapshot.facts.distance.value,
    distanceConfidence: snapshot.facts.distance.confidence,
    distanceMissingCount: snapshot.facts.distance.missingActivityCount,
    elevationGainM: snapshot.facts.elevationGain.value,
    elevationConfidence: snapshot.facts.elevationGain.confidence,
    elevationMissingCount: snapshot.facts.elevationGain.missingActivityCount,
    longestDistanceKm: snapshot.facts.longestDistance.value,
    longestDurationMin: snapshot.facts.longestDuration.value,
  };
}

function isFixtureCapabilities(value: unknown) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).fixture_class === RUNNER_DESIGN_PROFILE_FIXTURE_VERSION &&
    (value as Record<string, unknown>).generated_local_qa_fit === true &&
    (value as Record<string, unknown>).reprocessable === true,
  );
}

function readFixtureResponseId(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const engine = (value as Record<string, unknown>).selected_plan_engine;
  if (!engine || typeof engine !== "object" || Array.isArray(engine)) return null;
  const generation = (engine as Record<string, unknown>).ai_generation;
  if (!generation || typeof generation !== "object" || Array.isArray(generation)) return null;
  const responseId = (generation as Record<string, unknown>).response_id;
  return typeof responseId === "string" ? responseId : null;
}

export async function withLocalDesignFixtureEnv<T>(run: () => Promise<T>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !isLoopbackRuntimeUrl(supabaseUrl)) {
    throw new Error("Runner design profile fixture requires loopback Supabase.");
  }
  const envKeys = [
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV,
    AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV,
    AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV,
    "LOCAL_AUTH_BYPASS_ENABLED",
    "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
    "NEXT_PUBLIC_SUPABASE_URL",
    "VERCEL",
    "CI",
  ] as const;
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  try {
    process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV] = "true";
    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "qa_fixture";
    process.env.LOCAL_AUTH_BYPASS_ENABLED = "true";
    process.env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE = DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE;
    process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV];
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
    delete process.env.VERCEL;
    delete process.env.CI;
    return await run();
  } finally {
    for (const key of envKeys) {
      const value = previous[key];
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

async function withAdaptiveBlueprintFixtureEnv<T>(
  run: () => Promise<T>,
  options: { allowHostedUiReplay?: boolean } = {},
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (
    !supabaseUrl ||
    (!isLoopbackRuntimeUrl(supabaseUrl) && options.allowHostedUiReplay !== true)
  ) {
    throw new Error(
      "Adaptive Blueprint fixture requires loopback Supabase or explicit hosted UI-replay admission.",
    );
  }
  const priorFixtureFlag = process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
  const priorProviderMode = process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV];
  const priorFixtureScenario = process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
  const priorFixtureDelay = process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV];
  try {
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV];
    process.env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV] = "real";
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV];
    delete process.env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV];
    return await run();
  } finally {
    restoreEnvValue(AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV, priorFixtureFlag);
    restoreEnvValue(AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV, priorProviderMode);
    restoreEnvValue(AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV, priorFixtureScenario);
    restoreEnvValue(AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV, priorFixtureDelay);
  }
}

function restoreEnvValue(key: string, value: string | undefined) {
  if (value == null) delete process.env[key];
  else process.env[key] = value;
}

type FitField = {
  number: number;
  size: 1 | 2 | 4;
  baseType: number;
  value: number;
};

function fitField(
  number: number,
  size: FitField["size"],
  baseType: number,
  value: number,
): FitField {
  return { number, size, baseType, value };
}

function fitDefinition(localMessage: number, globalMessage: number, fields: FitField[]) {
  const definition = Buffer.alloc(6 + fields.length * 3);
  definition.writeUInt8(0x40 | localMessage, 0);
  definition.writeUInt8(0, 1);
  definition.writeUInt8(0, 2);
  definition.writeUInt16LE(globalMessage, 3);
  definition.writeUInt8(fields.length, 5);
  fields.forEach((field, index) => {
    const offset = 6 + index * 3;
    definition.writeUInt8(field.number, offset);
    definition.writeUInt8(field.size, offset + 1);
    definition.writeUInt8(field.baseType, offset + 2);
  });
  return definition;
}

function fitData(localMessage: number, fields: FitField[]) {
  const data = Buffer.alloc(1 + sum(fields.map((field) => field.size)));
  data.writeUInt8(localMessage, 0);
  let offset = 1;
  for (const field of fields) {
    if (field.size === 1) data.writeUInt8(field.value, offset);
    else if (field.size === 2) data.writeUInt16LE(field.value, offset);
    else data.writeUInt32LE(field.value, offset);
    offset += field.size;
  }
  return data;
}

function fitTimestampSeconds(iso: string) {
  const fitEpochMs = Date.UTC(1989, 11, 31);
  return Math.round((new Date(iso).getTime() - fitEpochMs) / 1000);
}

function fitCrc(buffer: Buffer, start: number, end: number) {
  const table = [
    0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401, 0xa001, 0x6c00, 0x7800, 0xb401,
    0x5000, 0x9c01, 0x8801, 0x4400,
  ];
  let crc = 0;
  for (let index = start; index < end; index += 1) {
    const value = buffer[index];
    let next = table[crc & 0xf];
    crc = ((crc >> 4) & 0x0fff) ^ next ^ table[value & 0xf];
    next = table[crc & 0xf];
    crc = ((crc >> 4) & 0x0fff) ^ next ^ table[(value >> 4) & 0xf];
  }
  return crc;
}

function sum(values: number[]) {
  return Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;
}
