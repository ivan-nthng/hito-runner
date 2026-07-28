import assert from "node:assert/strict";

import type { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import {
  acquireQaPoolLease,
  assertQaPoolAuthUser,
  ensureQaPoolAuthUser,
  releaseQaPoolLease,
  resetQaPoolUserData,
} from "./qa-test-user-lifecycle.mjs";

// Persistence validators lease stable identities instead of minting per-run Auth users.
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

export type QaPoolSupabaseCleanupProof = {
  ownedRows: Record<string, 0>;
  authUserPreserved: true;
  leaseReleased: true;
};

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

export async function acquireQaPoolSupabaseUser(input: {
  supabase: SupabaseAdminLike;
  poolRole:
    | "baseline-no-plan"
    | "saved-plan-readback"
    | "provider-engine"
    | "isolation-a"
    | "isolation-b";
  password?: string;
  creationErrorMessage: string;
}) {
  const lease = await acquireQaPoolLease({ role: input.poolRole });

  try {
    const user = await ensureQaPoolAuthUser({
      supabase: input.supabase,
      role: input.poolRole,
      password: input.password,
    });
    await resetQaPoolUserData({ supabase: input.supabase, userId: user.id });

    return {
      userId: user.id,
      email: user.email ?? "",
      poolRole: input.poolRole,
      leaseToken: lease.token,
    };
  } catch (error) {
    await releaseQaPoolLease({
      role: input.poolRole,
      token: lease.token,
    });
    throw new Error(error instanceof Error ? error.message : input.creationErrorMessage);
  }
}

export async function releaseQaPoolSupabaseUser(input: {
  supabase: SupabaseAdminLike;
  userId: string;
  poolRole:
    | "baseline-no-plan"
    | "saved-plan-readback"
    | "provider-engine"
    | "isolation-a"
    | "isolation-b";
  leaseToken: string;
}): Promise<QaPoolSupabaseCleanupProof> {
  await assertQaPoolAuthUser({
    supabase: input.supabase,
    role: input.poolRole,
    userId: input.userId,
  });
  const remainingCounts = await resetQaPoolUserData({
    supabase: input.supabase,
    userId: input.userId,
  });
  for (const [table, count] of Object.entries(remainingCounts)) {
    assert.equal(count, 0, `QA pool cleanup must remove every test-owned ${table} row.`);
  }
  const remainingAuthUser = await input.supabase.auth.admin.getUserById(input.userId);
  assert.ok(remainingAuthUser.data.user, "QA pool auth user must remain after cleanup.");
  await releaseQaPoolLease({
    role: input.poolRole,
    token: input.leaseToken,
  });

  return {
    ownedRows: Object.fromEntries(
      Object.keys(remainingCounts).map((table) => [table, 0]),
    ) as Record<string, 0>,
    authUserPreserved: true,
    leaseReleased: true,
  };
}
