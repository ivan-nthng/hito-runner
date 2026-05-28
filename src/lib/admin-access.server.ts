import "@tanstack/react-start/server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { RequestAuthContext } from "@/lib/backend/auth";
import type { Database } from "@/lib/supabase/database";
import { isLoopbackRuntimeUrl, serverEnv } from "@/lib/supabase/env";

const DEFAULT_ACCOUNTS_FILE = ".tanstack/hito-running-local-accounts.json";

const localAuthAccountSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  email: z.string().trim().email().optional(),
  userId: z.string().uuid().optional(),
  role: z.enum(["admin", "tester"]).optional(),
  displayName: z.string().trim().min(1).optional(),
});

const localAuthAccountsFileSchema = z.union([
  z.array(localAuthAccountSchema),
  z.object({
    accounts: z.array(localAuthAccountSchema),
  }),
]);

type LocalAuthAccount = z.infer<typeof localAuthAccountSchema>;

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
};

export type AdminAccessFailureReason =
  | "authentication_required"
  | "admin_required"
  | "admin_unavailable";

export interface AdminAccessContext {
  adminUserId: string;
  adminLabel: string;
  provider: "admin" | "local" | "supabase";
}

export type AdminAccessResult =
  | {
      ok: true;
      admin: AdminAccessContext;
    }
  | {
      ok: false;
      reason: AdminAccessFailureReason;
      message: string;
    };

export interface AdminAccessDependencies {
  auth: RequestAuthContext;
  runtimeUrl: string | URL | null;
  localAuthBypassEnabled: boolean;
  accountsFilePath: string;
  supabase: Pick<SupabaseClient<Database>, "auth"> | null;
}

export async function requireAdminAccessForCurrentRequest(
  supabase: Pick<SupabaseClient<Database>, "auth"> | null,
): Promise<AdminAccessResult> {
  const { getRequestAuthContext } = await import("@/lib/backend/auth");
  const auth = getRequestAuthContext();

  return requireAdminAccessForDependencies({
    auth,
    runtimeUrl: auth.appBaseUrl,
    localAuthBypassEnabled: Boolean(
      serverEnv.localAuthBypassEnabled && serverEnv.localAuthBypassAccountsFile,
    ),
    accountsFilePath: path.resolve(
      process.cwd(),
      serverEnv.localAuthBypassAccountsFile ?? DEFAULT_ACCOUNTS_FILE,
    ),
    supabase,
  });
}

export async function requireAdminAccessForDependencies(
  dependencies: AdminAccessDependencies,
): Promise<AdminAccessResult> {
  const { auth } = dependencies;

  if (!auth.userId) {
    return failure("authentication_required", "Sign in as an admin to use this admin tool.");
  }

  if (auth.provider === "admin") {
    return {
      ok: true,
      admin: {
        adminUserId: auth.userId,
        adminLabel: "admin",
        provider: "admin",
      },
    };
  }

  if (auth.provider === "local") {
    return requireLocalAdminAccess(dependencies);
  }

  if (auth.provider === "supabase") {
    return requireSupabaseAdminAccess(dependencies);
  }

  return failure("admin_required", "This admin tool is available only to admin sessions.");
}

async function requireLocalAdminAccess(
  dependencies: AdminAccessDependencies,
): Promise<AdminAccessResult> {
  if (
    !dependencies.localAuthBypassEnabled ||
    !dependencies.runtimeUrl ||
    !isLoopbackRuntimeUrl(dependencies.runtimeUrl)
  ) {
    return failure("admin_unavailable", "Local admin access is unavailable in this runtime.");
  }

  const accounts = await loadLocalAccountsSafe(dependencies.accountsFilePath);
  const adminAccount =
    accounts.find((account) => account.userId === dependencies.auth.userId) ??
    accounts.find((account) => account.email === dependencies.auth.email);

  if (!adminAccount || adminAccount.role !== "admin") {
    return failure("admin_required", "This admin tool is available only to local admin sessions.");
  }

  return {
    ok: true,
    admin: {
      adminUserId: dependencies.auth.userId ?? adminAccount.userId ?? adminAccount.username,
      adminLabel: adminAccount.displayName ?? adminAccount.username,
      provider: "local",
    },
  };
}

async function requireSupabaseAdminAccess(
  dependencies: AdminAccessDependencies,
): Promise<AdminAccessResult> {
  if (!dependencies.supabase) {
    return failure("admin_unavailable", "Admin access could not be verified for this session.");
  }

  const { data, error } = await dependencies.supabase.auth.admin.getUserById(
    dependencies.auth.userId!,
  );

  if (error || !data.user) {
    return failure("admin_unavailable", "Admin access could not be verified for this session.");
  }

  const user = data.user as SupabaseAuthUser;

  if (!isSupabaseAdminUser(user)) {
    return failure("admin_required", "This admin tool is available only to admin sessions.");
  }

  return {
    ok: true,
    admin: {
      adminUserId: user.id,
      adminLabel: user.email ?? dependencies.auth.email ?? "Supabase admin",
      provider: "supabase",
    },
  };
}

function isSupabaseAdminUser(user: SupabaseAuthUser) {
  const appMetadata = user.app_metadata ?? {};

  return (
    appMetadata.hito_admin === true ||
    appMetadata.hito_role === "admin" ||
    appMetadata.hito_local_role === "admin"
  );
}

async function loadLocalAccountsSafe(filePath: string): Promise<LocalAuthAccount[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = localAuthAccountsFileSchema.parse(JSON.parse(raw));

    return Array.isArray(parsed) ? parsed : parsed.accounts;
  } catch {
    return [];
  }
}

function failure(
  reason: AdminAccessFailureReason,
  message: string,
): Extract<AdminAccessResult, { ok: false }> {
  return {
    ok: false,
    reason,
    message,
  };
}
