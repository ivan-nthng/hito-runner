import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type {
  AdminLocalTestAccountView,
  AdminLocalTestAccountsFailureReason,
  AdminLocalTestAccountsResult,
  DeleteAdminLocalTestAccountInput,
  DeleteAdminLocalTestAccountResult,
} from "@/lib/admin-local-test-accounts";
import { classifyAdminAnalyticsUser } from "@/lib/admin-user-classification";
import type { RequestAuthContext } from "@/lib/backend/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database";
import { hasSupabaseServerEnv, isLoopbackRuntimeUrl, serverEnv } from "@/lib/supabase/env";

const DEFAULT_ACCOUNTS_FILE = ".tanstack/hito-running-local-accounts.json";
const PAGE_SIZE = 200;

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

type RawLocalAuthAccount = z.infer<typeof localAuthAccountSchema>;

interface NormalizedLocalAuthAccount {
  username: string;
  password: string;
  email: string;
  userId: string;
  userIdSource: "provided" | "derived";
  role: "admin" | "tester";
  displayName: string;
}

interface SupabaseAuthUserSummary {
  id: string;
  email: string | null;
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
    const nextAccounts = loaded.accounts.filter((account) => account.email !== email);
    await saveLocalAccounts(dependencies.accountsFilePath, nextAccounts);

    if (authUser) {
      await dependencies.supabaseAdmin.deleteAuthUser(authUser.id);
    }

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
    serverEnv.localAuthBypassAccountsFile ?? DEFAULT_ACCOUNTS_FILE,
  );

  return {
    auth,
    runtimeUrl: auth.appBaseUrl,
    localAuthBypassEnabled: Boolean(
      serverEnv.localAuthBypassEnabled && serverEnv.localAuthBypassAccountsFile,
    ),
    accountsFilePath,
    supabaseAdmin: hasSupabaseServerEnv
      ? createSupabaseAdminPort(createAdminSupabaseClient())
      : null,
  };
}

async function requireLocalAdminAccess(
  dependencies: AdminLocalTestAccountDependencies,
): Promise<{ ok: true } | Extract<AdminLocalTestAccountsResult, { ok: false }>> {
  if (
    !dependencies.localAuthBypassEnabled ||
    !dependencies.runtimeUrl ||
    !isLoopbackRuntimeUrl(dependencies.runtimeUrl)
  ) {
    return failure(
      "local_test_accounts_unavailable",
      "Local test accounts are available only in the local auth bypass runtime.",
    );
  }

  if (!dependencies.auth.userId || dependencies.auth.provider !== "local") {
    return failure(
      "authentication_required",
      "Sign in as the local admin to manage test accounts.",
    );
  }

  const loaded = await loadLocalAccountsSafe(dependencies.accountsFilePath);

  if (!loaded.ok) {
    return loaded;
  }

  const adminAccount =
    loaded.accounts.find((account) => account.userId === dependencies.auth.userId) ??
    loaded.accounts.find((account) => account.email === dependencies.auth.email);

  if (!adminAccount || adminAccount.role !== "admin") {
    return failure("admin_required", "Only the protected local admin can manage test accounts.");
  }

  return { ok: true };
}

async function buildAccountView(
  account: NormalizedLocalAuthAccount,
  supabaseAdmin: SupabaseAdminPort | null,
): Promise<AdminLocalTestAccountView> {
  const linkedSupabaseUser = await resolveLinkedSupabaseUser(account.email, supabaseAdmin);
  const protectedFromDeletion = account.role === "admin";
  const classification = classifyAdminAnalyticsUser({
    email: account.email,
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
    linkedSupabaseUser,
    classification: classification.classification === "local_admin" ? "local_admin" : "local_test",
    classificationReason: classification.classificationReason,
    classificationSource: classification.classificationSource,
  };
}

async function resolveLinkedSupabaseUser(
  email: string,
  supabaseAdmin: SupabaseAdminPort | null,
): Promise<AdminLocalTestAccountView["linkedSupabaseUser"]> {
  if (!supabaseAdmin) {
    return {
      status: "not_configured",
      userId: null,
    };
  }

  try {
    const authUser = await supabaseAdmin.findAuthUserByEmail(email);

    return {
      status: authUser ? "linked" : "missing",
      userId: authUser?.id ?? null,
    };
  } catch {
    return {
      status: "lookup_failed",
      userId: null,
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
      accounts: await loadLocalAccounts(accountsFilePath),
    };
  } catch {
    return failure(
      "accounts_file_invalid",
      "The local test-account file could not be read safely.",
    );
  }
}

async function loadLocalAccounts(accountsFilePath: string): Promise<NormalizedLocalAuthAccount[]> {
  try {
    const raw = await readFile(accountsFilePath, "utf8");
    const parsed = localAuthAccountsFileSchema.parse(JSON.parse(raw));
    const rawAccounts = Array.isArray(parsed) ? parsed : parsed.accounts;
    return rawAccounts.map(normalizeAccount);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function saveLocalAccounts(accountsFilePath: string, accounts: NormalizedLocalAuthAccount[]) {
  await mkdir(path.dirname(accountsFilePath), { recursive: true });
  await writeFile(accountsFilePath, `${JSON.stringify({ accounts }, null, 2)}\n`, "utf8");
}

function normalizeAccount(account: RawLocalAuthAccount): NormalizedLocalAuthAccount {
  const username = normalizeUsername(account.username);
  const email = normalizeEmail(account.email ?? `${username}@local.test`);
  const hasProvidedUserId = typeof account.userId === "string" && account.userId.trim().length > 0;

  return {
    username,
    password: String(account.password),
    email,
    userId: hasProvidedUserId ? account.userId! : deriveUserId(username),
    userIdSource: hasProvidedUserId ? "provided" : "derived",
    role: account.role === "admin" ? "admin" : "tester",
    displayName: account.displayName?.trim() || humanizeUsername(username),
  };
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

function deriveUserId(username: string) {
  const hash = createHash("sha256").update(username).digest("hex");

  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(
    17,
    20,
  )}-${hash.slice(20, 32)}`;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function humanizeUsername(username: string) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error && typeof error === "object" && "code" in error);
}
