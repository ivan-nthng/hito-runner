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

type ManualWorkoutReadyReview = Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type PersistedRunnerProfileRow = Database["public"]["Tables"]["runner_profiles"]["Row"];
type DisposableTableName =
  | "workout_logs"
  | "planned_workouts"
  | "plan_cycles"
  | "runner_manual_workout_templates"
  | "runner_profiles";
type DisposableTableRow<TableName extends DisposableTableName> =
  Database["public"]["Tables"][TableName]["Row"];
type ManualDisposableCleanupProof = {
  workoutLogsRemaining: 0;
  planCyclesRemaining: 0;
  plannedWorkoutsRemaining: 0;
  savedTemplatesRemaining: 0;
  runnerProfilesRemaining: 0;
  authUserDeleted: true;
  authUserRemaining: false;
};
type ManualDisposableCleanupProofCountKey = Exclude<
  keyof ManualDisposableCleanupProof,
  "authUserDeleted" | "authUserRemaining"
>;
type DisposableCleanupSpec<TableName extends DisposableTableName = DisposableTableName> = {
  table: TableName;
  userColumn: Extract<keyof DisposableTableRow<TableName>, string>;
  countColumn: Extract<keyof DisposableTableRow<TableName>, string>;
  proofKey: ManualDisposableCleanupProofCountKey;
};

export const MANUAL_REQUIRE_PERSISTENCE_FLAG = "--require-persistence";
export const MANUAL_REMOTE_MUTATION_FLAG = "--allow-remote-disposable-supabase-mutation";
export const MANUAL_REMOTE_MUTATION_ENV = "HITO_MANUAL_WORKOUT_CONFIRM_ALLOW_REMOTE_MUTATION";
export const MANUAL_REMOTE_MUTATION_ENV_VALUE =
  "I_UNDERSTAND_THIS_MUTATES_REMOTE_DISPOSABLE_SUPABASE";

const ALLOWED_REMOTE_PROJECT_REF = "dltfjwexyctmihclcjqj";
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const MANUAL_DISPOSABLE_CLEANUP_SPECS = [
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
    table: "runner_manual_workout_templates",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "savedTemplatesRemaining",
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
  DisposableCleanupSpec<"runner_manual_workout_templates">,
  DisposableCleanupSpec<"runner_profiles">,
];

export type ManualPersistenceTarget = {
  url: string;
  hostname: string;
  projectRef: string | null;
  isLoopback: boolean;
};

export type ManualPersistencePreflight =
  | {
      mode: "not_requested";
      shouldRun: false;
      target: ManualPersistenceTarget | null;
      reason: string;
      overrideHint: string;
    }
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
      target: ManualPersistenceTarget;
      reason: string;
      overrideHint: string;
    }
  | {
      mode: "local_disposable_supabase";
      shouldRun: true;
      target: ManualPersistenceTarget;
    }
  | {
      mode: "remote_disposable_supabase_override";
      shouldRun: true;
      target: ManualPersistenceTarget;
    };

export function readManualPersistenceCliOptions(args = process.argv.slice(2)) {
  const flags = new Set(args);

  return {
    requirePersistence: flags.has(MANUAL_REQUIRE_PERSISTENCE_FLAG),
    remoteMutationFlagPresent: flags.has(MANUAL_REMOTE_MUTATION_FLAG),
    remoteMutationEnvConfirmed:
      process.env[MANUAL_REMOTE_MUTATION_ENV] === MANUAL_REMOTE_MUTATION_ENV_VALUE,
  };
}

export function resolveManualPersistencePreflight(
  options: ReturnType<typeof readManualPersistenceCliOptions>,
): ManualPersistencePreflight {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const target = url ? parseManualPersistenceTarget(url) : null;

  if (!options.requirePersistence) {
    return {
      mode: "not_requested",
      shouldRun: false,
      target,
      reason:
        "Manual workout persistence proof was not requested; default harness remains non-mutating.",
      overrideHint: `Pass ${MANUAL_REQUIRE_PERSISTENCE_FLAG} with local disposable Supabase env to run persistence proof.`,
    };
  }

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !publishableKey || !serviceKey) {
    return {
      mode: "no_supabase_env",
      shouldRun: false,
      target: null,
      reason: "Supabase persistence env is incomplete; manual persistence proof was not attempted.",
      overrideHint:
        "Start local Supabase and export NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY, then rerun with --require-persistence.",
    };
  }

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

  const remoteOverrideRequested =
    options.remoteMutationFlagPresent && options.remoteMutationEnvConfirmed;
  if (remoteOverrideRequested && target.projectRef === ALLOWED_REMOTE_PROJECT_REF) {
    return {
      mode: "remote_disposable_supabase_override",
      shouldRun: true,
      target,
    };
  }

  const remoteReason =
    remoteOverrideRequested && target.projectRef !== ALLOWED_REMOTE_PROJECT_REF
      ? `Remote Supabase mutation target ${target.projectRef ?? target.hostname} is not allowlisted for this manual workout disposable proof.`
      : "Remote Supabase mutation is blocked by default for the manual workout confirm harness.";

  return {
    mode: "remote_supabase_blocked",
    shouldRun: false,
    target,
    reason: remoteReason,
    overrideHint: `Use a local Supabase URL, or set ${MANUAL_REMOTE_MUTATION_ENV}=${MANUAL_REMOTE_MUTATION_ENV_VALUE} and pass ${MANUAL_REMOTE_MUTATION_FLAG} only for approved project ${ALLOWED_REMOTE_PROJECT_REF}.`,
  };
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
  const disposableUser = await createDisposableManualWorkoutUser(supabase);
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

function parseManualPersistenceTarget(url: string): ManualPersistenceTarget | null {
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

async function createDisposableManualWorkoutUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
) {
  const runId = `manual-workout-confirm-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `${runId}@example.test`;
  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: {
      hito_validation_kind: "manual_workout_confirm_persistence",
      hito_disposable: true,
      hito_disposable_run_id: runId,
    },
    user_metadata: {
      hito_validation_kind: "manual_workout_confirm_persistence",
      hito_disposable: true,
      hito_disposable_run_id: runId,
    },
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Disposable manual workout user creation failed.");
  }

  return {
    userId: created.data.user.id,
    email,
    runId,
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
  for (const spec of MANUAL_DISPOSABLE_CLEANUP_SPECS) {
    await deleteRows(supabase.from(spec.table).delete().eq(spec.userColumn, userId));
  }

  const deleted = await supabase.auth.admin.deleteUser(userId);
  if (deleted.error) {
    throw new Error(deleted.error.message);
  }

  const remainingCounts = new Map<ManualDisposableCleanupProofCountKey, number>(
    await Promise.all(
      MANUAL_DISPOSABLE_CLEANUP_SPECS.map(async (spec) => [
        spec.proofKey,
        await countRowsForUser(supabase, spec, userId),
      ]),
    ),
  );
  const remainingAuthUser = await supabase.auth.admin.getUserById(userId);

  assert.equal(
    remainingAuthUser.data.user,
    null,
    "Disposable manual workout auth user must be absent after cleanup.",
  );

  return {
    workoutLogsRemaining: assertZeroCleanupCount(
      remainingCounts,
      "workoutLogsRemaining",
      "Disposable manual workout logs must be cleaned up.",
    ),
    planCyclesRemaining: assertZeroCleanupCount(
      remainingCounts,
      "planCyclesRemaining",
      "Disposable manual plan cycles must be cleaned up.",
    ),
    plannedWorkoutsRemaining: assertZeroCleanupCount(
      remainingCounts,
      "plannedWorkoutsRemaining",
      "Disposable manual planned workouts must be cleaned up.",
    ),
    savedTemplatesRemaining: assertZeroCleanupCount(
      remainingCounts,
      "savedTemplatesRemaining",
      "Disposable manual saved workout templates must be cleaned up.",
    ),
    runnerProfilesRemaining: assertZeroCleanupCount(
      remainingCounts,
      "runnerProfilesRemaining",
      "Disposable manual runner profile must be cleaned up.",
    ),
    authUserDeleted: true,
    authUserRemaining: false,
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
  counts: ReadonlyMap<ManualDisposableCleanupProofCountKey, number>,
  proofKey: ManualDisposableCleanupProofCountKey,
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
