import assert from "node:assert/strict";

import {
  confirmRunningPlanDraftForUser,
  type RunningPlanConfirmActionInput,
} from "../../src/lib/running-plan-engine-actions";
import type {
  RunningPlanPreviewDraft,
  RunningPlanReviewedPreviewDraft,
} from "../../src/lib/running-plan-engine-review";
import { applyAtomicReviewedPlanPersistence } from "../../src/lib/active-plan-lifecycle-persistence";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import type { Database, Json } from "../../src/lib/supabase/database";
import { validateNoClientRowsTrusted, validateNoFakePaceOrPersonalHr } from "./assertions";
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
      const result = await confirmRunningPlanDraftForUser(
        userId,
        buildConfirmInputForConfirm(draft),
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
      validateNoFakePaceOrPersonalHr(persisted.workouts);
      validateNoClientRowsTrusted(persisted.workouts);

      const duplicate = await confirmRunningPlanDraftForUser(
        userId,
        buildConfirmInputForConfirm(draft),
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

  return {
    mode: preflight.mode,
    target: preflight.target,
    persistedDistanceGoals,
    creationFailureAtomic,
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
    assert.equal(profile.count, 0, "Failed plan creation must roll back the profile upsert.");
    assert.equal(plans.count, 0, "Failed plan creation must roll back the plan cycle.");
    assert.equal(workouts.count, 0, "Failed plan creation must roll back every workout row.");
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
