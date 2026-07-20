import assert from "node:assert/strict";

import type { createAdminSupabaseClient } from "../../src/lib/supabase/server";

export const DISPOSABLE_REQUIRE_PERSISTENCE_FLAG = "--require-persistence";

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
type SupabaseAdminLike = ReturnType<typeof createAdminSupabaseClient>;

export type DisposableSupabaseTarget = {
  url: string;
  hostname: string;
  isLoopback: boolean;
};

export type DisposablePersistenceCliOptions = {
  requirePersistence: boolean;
};

export type DisposablePersistencePreflight =
  | {
      mode: "not_requested";
      shouldRun: false;
      target: DisposableSupabaseTarget | null;
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
      mode: "non_loopback_supabase_blocked";
      shouldRun: false;
      target: DisposableSupabaseTarget;
      reason: string;
      overrideHint: string;
    }
  | {
      mode: "local_disposable_supabase";
      shouldRun: true;
      target: DisposableSupabaseTarget;
    };

export type DisposableSupabaseCleanupSpec<ProofKey extends string = string> = {
  table: string;
  userColumn: string;
  countColumn: string;
  proofKey: ProofKey;
  zeroMessage: string;
};

export type DisposableSupabaseCleanupProof<
  ProofKey extends string,
  IncludeAuthUserRemaining extends boolean = false,
> = Record<ProofKey, 0> & { authUserDeleted: true } & (IncludeAuthUserRemaining extends true
    ? { authUserRemaining: false }
    : Record<never, never>);

export function readDisposablePersistenceCliOptions(
  args: readonly string[] = process.argv.slice(2),
): DisposablePersistenceCliOptions {
  const flags = new Set(args);

  return {
    requirePersistence: flags.has(DISPOSABLE_REQUIRE_PERSISTENCE_FLAG),
  };
}

export function resolveDisposablePersistencePreflight(input: {
  options: DisposablePersistenceCliOptions;
  includeNotRequested: boolean;
  notRequestedReason?: string;
  notRequestedOverrideHint?: string;
  envIncompleteReason: string;
  envIncompleteOverrideHint: string;
  invalidUrlReason: string;
  invalidUrlOverrideHint: string;
  nonLoopbackBlockedReason: string;
  nonLoopbackOverrideHint: string;
}): DisposablePersistencePreflight {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const target = url ? parseDisposableSupabaseTarget(url) : null;

  if (input.includeNotRequested && !input.options.requirePersistence) {
    return {
      mode: "not_requested",
      shouldRun: false,
      target,
      reason: input.notRequestedReason ?? "Persistence proof was not requested.",
      overrideHint:
        input.notRequestedOverrideHint ??
        `Pass ${DISPOSABLE_REQUIRE_PERSISTENCE_FLAG} with local disposable Supabase env to run persistence proof.`,
    };
  }

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !publishableKey || !serviceKey) {
    return {
      mode: "no_supabase_env",
      shouldRun: false,
      target: null,
      reason: input.envIncompleteReason,
      overrideHint: input.envIncompleteOverrideHint,
    };
  }

  if (!target) {
    return {
      mode: "no_supabase_env",
      shouldRun: false,
      target: null,
      reason: input.invalidUrlReason,
      overrideHint: input.invalidUrlOverrideHint,
    };
  }

  if (target.isLoopback) {
    return {
      mode: "local_disposable_supabase",
      shouldRun: true,
      target,
    };
  }

  return {
    mode: "non_loopback_supabase_blocked",
    shouldRun: false,
    target,
    reason: input.nonLoopbackBlockedReason,
    overrideHint: input.nonLoopbackOverrideHint,
  };
}

export function parseDisposableSupabaseTarget(url: string): DisposableSupabaseTarget | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    return {
      url: parsed.origin,
      hostname,
      isLoopback: LOOPBACK_HOSTNAMES.has(hostname),
    };
  } catch {
    return null;
  }
}

export async function createDisposableSupabaseUser(input: {
  supabase: SupabaseAdminLike;
  emailPrefix: string;
  label?: string;
  validationKind?: string;
  password?: string;
  creationErrorMessage: string;
}) {
  const runId = [
    input.emailPrefix,
    input.label ? slugifyDisposableLabel(input.label) : null,
    Date.now(),
    Math.random().toString(16).slice(2),
  ]
    .filter(Boolean)
    .join("-");
  const email = `${runId}@example.test`;
  const metadata = input.validationKind
    ? {
        hito_validation_kind: input.validationKind,
        hito_disposable: true,
        hito_disposable_run_id: runId,
      }
    : undefined;

  const created = await input.supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    ...(input.password ? { password: input.password } : {}),
    app_metadata: metadata,
    user_metadata: metadata,
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? input.creationErrorMessage);
  }

  return {
    userId: created.data.user.id,
    email,
    runId,
  };
}

export async function cleanupDisposableSupabaseUser<
  ProofKey extends string,
  IncludeAuthUserRemaining extends boolean = false,
>(input: {
  supabase: SupabaseAdminLike;
  userId: string;
  cleanupSpecs: readonly DisposableSupabaseCleanupSpec<ProofKey>[];
  includeAuthUserRemaining?: IncludeAuthUserRemaining;
  authUserAbsentMessage?: string;
}): Promise<DisposableSupabaseCleanupProof<ProofKey, IncludeAuthUserRemaining>> {
  for (const spec of input.cleanupSpecs) {
    await deleteRows(input.supabase.from(spec.table).delete().eq(spec.userColumn, input.userId));
  }

  const deleted = await input.supabase.auth.admin.deleteUser(input.userId);
  if (deleted.error) {
    throw new Error(deleted.error.message);
  }

  const remainingCounts = new Map<ProofKey, number>(
    await Promise.all(
      input.cleanupSpecs.map(async (spec) => [
        spec.proofKey,
        await countRowsForUser(input.supabase, spec, input.userId),
      ]),
    ),
  );
  const proof = Object.fromEntries(
    input.cleanupSpecs.map((spec) => [
      spec.proofKey,
      assertZeroCleanupCount(remainingCounts, spec.proofKey, spec.zeroMessage),
    ]),
  ) as Record<ProofKey, 0>;

  if (input.includeAuthUserRemaining) {
    const remainingAuthUser = await input.supabase.auth.admin.getUserById(input.userId);

    assert.equal(
      remainingAuthUser.data.user,
      null,
      input.authUserAbsentMessage ?? "Disposable auth user must be absent after cleanup.",
    );

    return {
      ...proof,
      authUserDeleted: true,
      authUserRemaining: false,
    } as DisposableSupabaseCleanupProof<ProofKey, IncludeAuthUserRemaining>;
  }

  return {
    ...proof,
    authUserDeleted: true,
  } as DisposableSupabaseCleanupProof<ProofKey, IncludeAuthUserRemaining>;
}

async function countRowsForUser<ProofKey extends string>(
  supabase: SupabaseAdminLike,
  spec: DisposableSupabaseCleanupSpec<ProofKey>,
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

function assertZeroCleanupCount<ProofKey extends string>(
  counts: ReadonlyMap<ProofKey, number>,
  proofKey: ProofKey,
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

function slugifyDisposableLabel(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "proof"
  );
}
