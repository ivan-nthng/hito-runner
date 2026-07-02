import assert from "node:assert/strict";

import type { RunningPlanDistanceFamily } from "../../src/lib/plan-creation-engine";
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
type BuildPreviewInputForConfirm = (
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) => RunningPlanPreviewActionInput;

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

type PersistenceTarget = {
  url: string;
  hostname: string;
  projectRef: string | null;
  isLoopback: boolean;
};

export type PersistencePreflight =
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

export function readCliOptions() {
  const args = new Set(process.argv.slice(2));

  return {
    requirePersistence: args.has(REQUIRE_PERSISTENCE_FLAG),
    allowRemoteDisposableSupabaseMutation:
      args.has(REMOTE_MUTATION_FLAG) &&
      process.env[REMOTE_MUTATION_ENV] === REMOTE_MUTATION_ENV_VALUE,
  };
}

export function resolvePersistencePreflight(
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
        previewInput: buildPreviewInputForConfirm(draft),
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
        previewInput: buildPreviewInputForConfirm(draft),
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
