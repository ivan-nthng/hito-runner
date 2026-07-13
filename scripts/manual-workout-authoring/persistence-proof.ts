import assert from "node:assert/strict";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  confirmManualWorkoutDraftForUser,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";
import type { Database } from "../../src/lib/supabase/database";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
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
  type DisposableSupabaseTarget,
} from "../lib/disposable-persistence-proof";

type ManualWorkoutReadyReview = Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type PersistedRunnerProfileRow = Database["public"]["Tables"]["runner_profiles"]["Row"];

type ManualDisposableCleanupProofCountKey =
  | "workoutLogsRemaining"
  | "planCyclesRemaining"
  | "plannedWorkoutsRemaining"
  | "savedTemplatesRemaining"
  | "runnerProfilesRemaining";
type ManualDisposableCleanupProof = DisposableSupabaseCleanupProof<
  ManualDisposableCleanupProofCountKey,
  true
>;

export const MANUAL_REQUIRE_PERSISTENCE_FLAG = DISPOSABLE_REQUIRE_PERSISTENCE_FLAG;
export const MANUAL_REMOTE_MUTATION_FLAG = DISPOSABLE_REMOTE_MUTATION_FLAG;
export const MANUAL_REMOTE_MUTATION_ENV = "HITO_MANUAL_WORKOUT_CONFIRM_ALLOW_REMOTE_MUTATION";
export const MANUAL_REMOTE_MUTATION_ENV_VALUE = DISPOSABLE_REMOTE_MUTATION_ENV_VALUE;

const ALLOWED_REMOTE_PROJECT_REF = "dltfjwexyctmihclcjqj";
const MANUAL_DISPOSABLE_CLEANUP_SPECS = [
  {
    table: "workout_logs",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "workoutLogsRemaining",
    zeroMessage: "Disposable manual workout logs must be cleaned up.",
  },
  {
    table: "planned_workouts",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "plannedWorkoutsRemaining",
    zeroMessage: "Disposable manual planned workouts must be cleaned up.",
  },
  {
    table: "plan_cycles",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "planCyclesRemaining",
    zeroMessage: "Disposable manual plan cycles must be cleaned up.",
  },
  {
    table: "runner_manual_workout_templates",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "savedTemplatesRemaining",
    zeroMessage: "Disposable manual saved workout templates must be cleaned up.",
  },
  {
    table: "runner_profiles",
    userColumn: "user_id",
    countColumn: "user_id",
    proofKey: "runnerProfilesRemaining",
    zeroMessage: "Disposable manual runner profile must be cleaned up.",
  },
] as const satisfies readonly DisposableSupabaseCleanupSpec<ManualDisposableCleanupProofCountKey>[];

export type ManualPersistenceTarget = DisposableSupabaseTarget;
export type ManualPersistencePreflight = DisposablePersistencePreflight;

export function readManualPersistenceCliOptions(args = process.argv.slice(2)) {
  return readDisposablePersistenceCliOptions({
    args,
    remoteMutationEnv: MANUAL_REMOTE_MUTATION_ENV,
    remoteMutationEnvValue: MANUAL_REMOTE_MUTATION_ENV_VALUE,
  });
}

export function resolveManualPersistencePreflight(
  options: ReturnType<typeof readManualPersistenceCliOptions>,
): ManualPersistencePreflight {
  return resolveDisposablePersistencePreflight({
    options,
    includeNotRequested: true,
    notRequestedReason:
      "Manual workout persistence proof was not requested; default harness remains non-mutating.",
    notRequestedOverrideHint: `Pass ${MANUAL_REQUIRE_PERSISTENCE_FLAG} with local disposable Supabase env to run persistence proof.`,
    envIncompleteReason:
      "Supabase persistence env is incomplete; manual persistence proof was not attempted.",
    envIncompleteOverrideHint:
      "Start local Supabase and export NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY, then rerun with --require-persistence.",
    invalidUrlReason:
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL; persistence proof was not attempted.",
    invalidUrlOverrideHint:
      "Use a valid local Supabase URL such as http://127.0.0.1:54321 and rerun with --require-persistence.",
    remoteBlockedReason:
      "Remote Supabase mutation is blocked by default for the manual workout confirm harness.",
    remoteOverrideHint: `Use a local Supabase URL, or set ${MANUAL_REMOTE_MUTATION_ENV}=${MANUAL_REMOTE_MUTATION_ENV_VALUE} and pass ${MANUAL_REMOTE_MUTATION_FLAG} only for approved project ${ALLOWED_REMOTE_PROJECT_REF}.`,
    allowedRemoteProjectRef: ALLOWED_REMOTE_PROJECT_REF,
    remoteProjectNotAllowlistedReason: (target) =>
      `Remote Supabase mutation target ${target.projectRef ?? target.hostname} is not allowlisted for this manual workout disposable proof.`,
  });
}

export function formatManualPersistenceBlocker(
  preflight: Extract<ManualPersistencePreflight, { shouldRun: false }>,
) {
  return [
    `Manual workout confirm persistence proof is blocked: ${preflight.reason}`,
    preflight.target
      ? `Target: ${preflight.target.url} (${preflight.target.projectRef ?? preflight.target.hostname}).`
      : "Target: none.",
    preflight.overrideHint,
  ].join(" ");
}

export function buildSkippedManualPersistenceResult(
  preflight: Extract<ManualPersistencePreflight, { shouldRun: false }>,
) {
  return {
    mode: preflight.mode,
    target: preflight.target,
    reason: preflight.reason,
    overrideHint: preflight.overrideHint,
  };
}

export async function validateManualWorkoutDisposablePersistenceProof({
  input,
  review,
  preflight,
}: {
  input: ManualWorkoutDraftInput;
  review: ManualWorkoutReadyReview;
  preflight: Extract<ManualPersistencePreflight, { shouldRun: true }>;
}) {
  const supabase = createAdminSupabaseClient();
  const disposableUser = await createDisposableSupabaseUser({
    supabase,
    emailPrefix: "manual-workout-confirm",
    validationKind: "manual_workout_confirm_persistence",
    creationErrorMessage: "Disposable manual workout user creation failed.",
  });
  let proof: {
    rows: number;
    sourceKind: string | null;
    sourceStatus: string | null;
    reviewChecksum: string | null;
  } | null = null;
  let cleanup: ManualDisposableCleanupProof | null = null;

  try {
    const result = await confirmManualWorkoutDraftForUser(disposableUser.userId, {
      draftInput: input,
      reviewToken: review.reviewToken,
      reviewChecksum: review.reviewChecksum,
    });
    assert.equal(result.ok, true, "Manual workout confirm should persist on disposable target.");
    if (!result.ok) {
      throw new Error(result.message);
    }

    const persisted = await loadPersistedManualPlanForUser(supabase, disposableUser.userId);
    assert.equal(persisted.plan.source_kind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(persisted.workouts.length, 1);
    assert.equal(persisted.workouts[0]?.workout_date, input.workoutDate);
    assert.equal(persisted.workouts[0]?.workout_identity, "easy_aerobic_run");
    assert.equal(persisted.profile.user_id, disposableUser.userId);
    validateManualPlanMetadata(persisted.plan, review.reviewChecksum);
    validateNoFakePaceOrPersonalHr(persisted.workouts);

    const duplicate = await confirmManualWorkoutDraftForUser(disposableUser.userId, {
      draftInput: input,
      reviewToken: review.reviewToken,
      reviewChecksum: review.reviewChecksum,
    });
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) {
      assert.equal(duplicate.reason, "active_plan_exists");
    }

    proof = {
      rows: persisted.workouts.length,
      sourceKind: persisted.plan.source_kind,
      sourceStatus: readManualSourceStatus(persisted.plan),
      reviewChecksum: readManualReviewChecksum(persisted.plan),
    };
  } finally {
    cleanup = await cleanupDisposableManualWorkoutUser(supabase, disposableUser.userId);
  }

  assert.ok(proof, "Manual workout persistence proof must complete before cleanup reporting.");
  assert.ok(cleanup, "Manual workout cleanup proof must be captured.");

  return {
    mode: preflight.mode,
    target: preflight.target,
    disposableRunId: disposableUser.runId,
    persisted: proof,
    cleanup,
  };
}

async function loadPersistedManualPlanForUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<{
  plan: PersistedPlanCycleRow;
  workouts: PersistedWorkoutRow[];
  profile: PersistedRunnerProfileRow;
}> {
  const planResult = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (planResult.error || !planResult.data) {
    throw new Error(planResult.error?.message ?? "Persisted manual active plan was not found.");
  }

  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_cycle_id", planResult.data.id)
    .order("display_order", { ascending: true });

  if (workoutsResult.error || !workoutsResult.data) {
    throw new Error(workoutsResult.error?.message ?? "Persisted manual workout was not found.");
  }

  const profileResult = await supabase
    .from("runner_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileResult.error || !profileResult.data) {
    throw new Error(profileResult.error?.message ?? "Persisted runner profile was not found.");
  }

  return {
    plan: planResult.data,
    workouts: workoutsResult.data,
    profile: profileResult.data,
  };
}

function validateManualPlanMetadata(plan: PersistedPlanCycleRow, reviewChecksum: string) {
  const manualMetadata = (
    plan.goal_metadata as {
      manual_user_built_plan?: {
        source_status?: string;
        review_checksum?: string;
        row_count?: number;
      };
    } | null
  )?.manual_user_built_plan;

  assert.equal(manualMetadata?.source_status, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
  assert.equal(manualMetadata?.review_checksum, reviewChecksum);
  assert.equal(manualMetadata?.row_count, 1);
}

function readManualSourceStatus(plan: PersistedPlanCycleRow) {
  return readManualMetadata(plan)?.source_status ?? null;
}

function readManualReviewChecksum(plan: PersistedPlanCycleRow) {
  return readManualMetadata(plan)?.review_checksum ?? null;
}

function readManualMetadata(plan: PersistedPlanCycleRow) {
  return (
    plan.goal_metadata as {
      manual_user_built_plan?: {
        review_checksum?: string;
        source_status?: string;
      };
    } | null
  )?.manual_user_built_plan;
}

function validateNoFakePaceOrPersonalHr(rows: readonly PersistedWorkoutRow[]) {
  const serialized = JSON.stringify(rows);

  assert.doesNotMatch(serialized, /"pace_min_per_km_range"|"pace_range_min_km"|"pace"/i);
  assert.doesNotMatch(
    serialized,
    /personal_hr|personalized_hr|hr_zone_truth|"hr_targets_allowed":true/i,
  );
}

async function cleanupDisposableManualWorkoutUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<ManualDisposableCleanupProof> {
  return cleanupDisposableSupabaseUser({
    supabase,
    userId,
    cleanupSpecs: MANUAL_DISPOSABLE_CLEANUP_SPECS,
    includeAuthUserRemaining: true,
    authUserAbsentMessage: "Disposable manual workout auth user must be absent after cleanup.",
  });
}
