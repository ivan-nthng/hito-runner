import assert from "node:assert/strict";

import {
  confirmRunningPlanDraftForUser,
  type RunningPlanPreviewActionInput,
} from "../../src/lib/running-plan-engine-actions";
import type {
  RunningPlanPreviewDraft,
  RunningPlanReviewedPreviewDraft,
} from "../../src/lib/running-plan-engine-review";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import type { Database } from "../../src/lib/supabase/database";
import { validateNoClientRowsTrusted, validateNoFakePaceOrPersonalHr } from "./assertions";
import {
  cleanupDisposableSupabaseUser,
  createDisposableSupabaseUser,
  DISPOSABLE_REMOTE_MUTATION_ENV_VALUE,
  DISPOSABLE_REMOTE_MUTATION_FLAG,
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
type BuildPreviewInputForConfirm = (
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) => RunningPlanPreviewActionInput;

const REQUIRE_PERSISTENCE_FLAG = DISPOSABLE_REQUIRE_PERSISTENCE_FLAG;
const REMOTE_MUTATION_FLAG = DISPOSABLE_REMOTE_MUTATION_FLAG;
const REMOTE_MUTATION_ENV = "HITO_RUNNING_PLAN_CONFIRM_ALLOW_REMOTE_MUTATION";
const REMOTE_MUTATION_ENV_VALUE = DISPOSABLE_REMOTE_MUTATION_ENV_VALUE;
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
  const options = readDisposablePersistenceCliOptions({
    remoteMutationEnv: REMOTE_MUTATION_ENV,
    remoteMutationEnvValue: REMOTE_MUTATION_ENV_VALUE,
  });

  return {
    requirePersistence: options.requirePersistence,
    remoteMutationFlagPresent: options.remoteMutationFlagPresent,
    remoteMutationEnvConfirmed: options.remoteMutationEnvConfirmed,
    allowRemoteDisposableSupabaseMutation:
      options.remoteMutationFlagPresent && options.remoteMutationEnvConfirmed,
  };
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
    remoteBlockedReason:
      "Remote Supabase mutation is blocked by default. This harness only mutates local/disposable targets unless an explicit remote-disposable override is supplied.",
    remoteOverrideHint: `Use a local Supabase URL, or set ${REMOTE_MUTATION_ENV}=${REMOTE_MUTATION_ENV_VALUE} and pass ${REMOTE_MUTATION_FLAG} only for an approved disposable remote validation target.`,
  });
}

export function formatPersistenceBlocker(
  preflight: Extract<PersistencePreflight, { shouldRun: false }>,
) {
  return [
    `Running-plan confirm persistence proof is blocked: ${preflight.reason}`,
    preflight.target
      ? `Target: ${preflight.target.url} (${preflight.target.projectRef ?? preflight.target.hostname}).`
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
  buildPreviewInputForConfirm: BuildPreviewInputForConfirm,
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
      const result = await confirmRunningPlanDraftForUser(userId, {
        previewInput: buildPreviewInputForConfirm(draft),
        sourceKind: draft.sourceKind,
        reviewToken: draft.reviewToken,
        reviewChecksum: draft.reviewChecksum,
      });
      assert.equal(result.ok, true, `${distanceGoal.goalLabel} confirm should persist.`);
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
        previewInput: buildPreviewInputForConfirm(draft),
        sourceKind: draft.sourceKind,
        reviewToken: draft.reviewToken,
        reviewChecksum: draft.reviewChecksum,
      });
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

  return {
    mode: preflight.mode,
    target: preflight.target,
    persistedDistanceGoals,
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
