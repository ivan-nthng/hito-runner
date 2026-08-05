import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminLocalTestAccountView,
  AdminLocalTestAccountsFailureReason,
  AdminLocalTestAccountsResult,
  DeleteAdminLocalTestAccountInput,
  DeleteAdminLocalTestAccountResult,
} from "@/lib/admin-local-test-accounts";
import { classifyAdminAnalyticsUser } from "@/lib/admin-user-classification";
import { requireAdminAccessForDependencies } from "@/lib/admin-access.server";
import type { RequestAuthContext } from "@/lib/backend/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database";
import {
  DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
  readLocalAuthAccountRegistry,
  writeLocalAuthAccountRegistry,
  type NormalizedLocalAuthAccount,
} from "@/lib/local-auth-account-registry.server";
import {
  hasSupabaseServerEnv,
  isLoopbackRuntimeUrl,
  publicEnv,
  serverEnv,
} from "@/lib/supabase/env";

const PAGE_SIZE = 200;

interface SupabaseAuthUserSummary {
  id: string;
  email: string | null;
  appMetadata: Record<string, unknown>;
}

export interface SupabaseAdminPort {
  findAuthUserByEmail(email: string): Promise<SupabaseAuthUserSummary | null>;
  deleteAuthUser(userId: string): Promise<void>;
}

export interface AdminLocalTestAccountDependencies {
  auth: RequestAuthContext;
  runtimeUrl: string | URL | null;
  localAuthBypassEnabled: boolean;
  accountsFilePath: string;
  supabaseAdmin: SupabaseAdminPort | null;
}

export async function getAdminLocalTestAccountsForCurrentRequest(): Promise<AdminLocalTestAccountsResult> {
  return getAdminLocalTestAccountsForDependencies(await buildCurrentDependencies());
}

export async function deleteAdminLocalTestAccountForCurrentRequest(
  data: DeleteAdminLocalTestAccountInput,
): Promise<DeleteAdminLocalTestAccountResult> {
  return deleteAdminLocalTestAccountForDependencies(data, await buildCurrentDependencies());
}

export async function getAdminLocalTestAccountsForDependencies(
  dependencies: AdminLocalTestAccountDependencies,
): Promise<AdminLocalTestAccountsResult> {
  const localAccess = await requireLocalAdminAccess(dependencies);

  if (!localAccess.ok) {
    return localAccess;
  }

  const loaded = await loadLocalAccountsSafe(dependencies.accountsFilePath);

  if (!loaded.ok) {
    return loaded;
  }

  const accounts = await Promise.all(
    loaded.accounts.map((account) => buildAccountView(account, dependencies.supabaseAdmin)),
  );

  return {
    ok: true,
    accounts,
    accountsFilePath: dependencies.accountsFilePath,
  };
}

export async function deleteAdminLocalTestAccountForDependencies(
  data: DeleteAdminLocalTestAccountInput,
  dependencies: AdminLocalTestAccountDependencies,
): Promise<DeleteAdminLocalTestAccountResult> {
  const localAccess = await requireLocalAdminAccess(dependencies);

  if (!localAccess.ok) {
    return localAccess;
  }

  const email = normalizeEmail(data.email);
  const confirmation = normalizeEmail(data.confirmEmail);

  if (email !== confirmation) {
    return failure(
      "invalid_delete_confirmation",
      "Confirm the same tester email before deleting the account.",
    );
  }

  if (!dependencies.supabaseAdmin) {
    return failure(
      "supabase_admin_unavailable",
      "Supabase admin access is required before deleting a local tester.",
    );
  }

  const loaded = await loadLocalAccountsSafe(dependencies.accountsFilePath);

  if (!loaded.ok) {
    return loaded;
  }

  const localAccount = loaded.accounts.find((account) => account.email === email) ?? null;

  if (!localAccount) {
    return failure("account_not_found", "No local tester account was found for that email.");
  }

  if (localAccount.role === "admin") {
    return failure("protected_account", "Protected admin accounts cannot be deleted here.");
  }

  try {
    const authUser = await dependencies.supabaseAdmin.findAuthUserByEmail(email);

    if (authUser) {
      const classification = classifyAdminAnalyticsUser({
        email: authUser.email,
        appMetadata: authUser.appMetadata,
        localAccountRole: localAccount.role,
      });
      if (
        classification.classification === "local_admin" ||
        classification.classification === "supabase_admin" ||
        authUser.appMetadata.hito_qa_pool_version
      ) {
        return failure(
          "protected_account",
          "Protected admin and reusable QA pool accounts cannot be deleted here.",
        );
      }

      await dependencies.supabaseAdmin.deleteAuthUser(authUser.id);
    }

    const nextAccounts = loaded.accounts.filter((account) => account.email !== email);
    await saveLocalAccounts(dependencies.accountsFilePath, nextAccounts);

    return {
      ok: true,
      deleted: {
        username: localAccount.username,
        email: localAccount.email,
        userId: localAccount.userId,
        removedLocalAccount: true,
        removedSupabaseAuthUser: Boolean(authUser),
        supabaseAuthUserId: authUser?.id ?? null,
      },
      accountsFilePath: dependencies.accountsFilePath,
    };
  } catch {
    return failure(
      "delete_failed",
      "The local tester could not be deleted. Check the local account file and Supabase admin access.",
    );
  }
}

async function buildCurrentDependencies(): Promise<AdminLocalTestAccountDependencies> {
  const { getRequestAuthContext } = await import("@/lib/backend/auth");
  const auth = getRequestAuthContext();
  const accountsFilePath = path.resolve(
    process.cwd(),
    serverEnv.localAuthBypassAccountsFile ?? DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
  );

  return {
    auth,
    runtimeUrl: auth.appBaseUrl,
    localAuthBypassEnabled: Boolean(
      serverEnv.localAuthBypassEnabled && serverEnv.localAuthBypassAccountsFile,
    ),
    accountsFilePath,
    supabaseAdmin:
      hasSupabaseServerEnv && isLoopbackRuntimeUrl(publicEnv.supabaseUrl)
        ? createSupabaseAdminPort(createAdminSupabaseClient())
        : null,
  };
}

async function requireLocalAdminAccess(
  dependencies: AdminLocalTestAccountDependencies,
): Promise<{ ok: true } | Extract<AdminLocalTestAccountsResult, { ok: false }>> {
  const adminAccess = await requireAdminAccessForDependencies({
    auth: dependencies.auth,
    runtimeUrl: dependencies.runtimeUrl,
    localAuthBypassEnabled: dependencies.localAuthBypassEnabled,
    supabase: null,
  });

  if (!adminAccess.ok) {
    if (
      adminAccess.reason === "authentication_required" ||
      adminAccess.reason === "admin_required"
    ) {
      return failure(adminAccess.reason, adminAccess.message);
    }

    return failure(
      "local_test_accounts_unavailable",
      "Local test accounts are available only in the local auth bypass runtime.",
    );
  }

  if (!adminAccess.admin.capabilities.localTestAccounts) {
    return failure(
      "local_test_accounts_unavailable",
      "Local test accounts are available only to the local admin fixture.",
    );
  }

  return { ok: true };
}

async function buildAccountView(
  account: NormalizedLocalAuthAccount,
  supabaseAdmin: SupabaseAdminPort | null,
): Promise<AdminLocalTestAccountView> {
  const linked = await resolveLinkedSupabaseUser(account.email, supabaseAdmin);
  const protectedFromDeletion =
    account.role === "admin" ||
    linked.authUser?.appMetadata.hito_admin === true ||
    linked.authUser?.appMetadata.hito_role === "admin" ||
    linked.authUser?.appMetadata.hito_local_role === "admin" ||
    Boolean(linked.authUser?.appMetadata.hito_qa_pool_version);
  const classification = classifyAdminAnalyticsUser({
    email: account.email,
    appMetadata: linked.authUser?.appMetadata,
    localAccountRole: account.role,
  });

  return {
    username: account.username,
    email: account.email,
    password: account.password,
    role: account.role,
    displayName: account.displayName,
    userId: account.userId,
    userIdSource: account.userIdSource,
    protectedFromDeletion,
    deletable: !protectedFromDeletion,
    linkedSupabaseUser: linked.view,
    classification: classification.classification === "local_admin" ? "local_admin" : "local_test",
    classificationReason: classification.classificationReason,
    classificationSource: classification.classificationSource,
  };
}

async function resolveLinkedSupabaseUser(
  email: string,
  supabaseAdmin: SupabaseAdminPort | null,
): Promise<{
  view: AdminLocalTestAccountView["linkedSupabaseUser"];
  authUser: SupabaseAuthUserSummary | null;
}> {
  if (!supabaseAdmin) {
    return {
      view: {
        status: "not_configured",
        userId: null,
      },
      authUser: null,
    };
  }

  try {
    const authUser = await supabaseAdmin.findAuthUserByEmail(email);

    return {
      view: {
        status: authUser ? "linked" : "missing",
        userId: authUser?.id ?? null,
      },
      authUser,
    };
  } catch {
    return {
      view: {
        status: "lookup_failed",
        userId: null,
      },
      authUser: null,
    };
  }
}

async function loadLocalAccountsSafe(
  accountsFilePath: string,
): Promise<
  | { ok: true; accounts: NormalizedLocalAuthAccount[] }
  | Extract<AdminLocalTestAccountsResult, { ok: false }>
> {
  try {
    return {
      ok: true,
      accounts: await readLocalAuthAccountRegistry(accountsFilePath, { allowMissing: true }),
    };
  } catch {
    return failure(
      "accounts_file_invalid",
      "The local test-account file could not be read safely.",
    );
  }
}

async function saveLocalAccounts(accountsFilePath: string, accounts: NormalizedLocalAuthAccount[]) {
  await writeLocalAuthAccountRegistry(accountsFilePath, accounts);
}

function createSupabaseAdminPort(supabase: SupabaseClient<Database>): SupabaseAdminPort {
  return {
    async findAuthUserByEmail(email) {
      let page = 1;

      while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({
          page,
          perPage: PAGE_SIZE,
        });

        if (error) {
          throw new Error(error.message);
        }

        const matchedUser =
          data.users.find(
            (user) => user.email && normalizeEmail(user.email) === normalizeEmail(email),
          ) ?? null;

        if (matchedUser) {
          return {
            id: matchedUser.id,
            email: matchedUser.email ?? null,
            appMetadata: matchedUser.app_metadata ?? {},
          };
        }

        if (data.users.length < PAGE_SIZE) {
          return null;
        }

        page += 1;
      }
    },
    async deleteAuthUser(userId) {
      const { error } = await supabase.auth.admin.deleteUser(userId, false);

      if (error) {
        throw new Error(error.message);
      }
    },
  };
}

function failure<TReason extends AdminLocalTestAccountsFailureReason>(
  reason: TReason,
  message: string,
): Extract<AdminLocalTestAccountsResult, { ok: false }> {
  return {
    ok: false,
    reason,
    message,
  };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
