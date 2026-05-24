import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  AdminUserClassification,
  AdminUserClassificationSource,
} from "@/lib/admin-user-classification";

export type AdminLocalTestAccountRole = "admin" | "tester";

export type AdminLocalTestAccountLinkStatus =
  | "linked"
  | "missing"
  | "not_configured"
  | "lookup_failed";

export interface AdminLocalTestAccountView {
  username: string;
  email: string;
  password: string;
  role: AdminLocalTestAccountRole;
  displayName: string;
  userId: string;
  userIdSource: "provided" | "derived";
  protectedFromDeletion: boolean;
  deletable: boolean;
  linkedSupabaseUser: {
    status: AdminLocalTestAccountLinkStatus;
    userId: string | null;
  };
  classification: Extract<AdminUserClassification, "local_test" | "local_admin">;
  classificationReason: string;
  classificationSource: AdminUserClassificationSource;
}

export type AdminLocalTestAccountsFailureReason =
  | "local_test_accounts_unavailable"
  | "authentication_required"
  | "admin_required"
  | "accounts_file_invalid"
  | "invalid_delete_confirmation"
  | "account_not_found"
  | "protected_account"
  | "supabase_admin_unavailable"
  | "delete_failed";

export type AdminLocalTestAccountsResult =
  | {
      ok: true;
      accounts: AdminLocalTestAccountView[];
      accountsFilePath: string;
    }
  | {
      ok: false;
      reason: AdminLocalTestAccountsFailureReason;
      message: string;
    };

export type DeleteAdminLocalTestAccountResult =
  | {
      ok: true;
      deleted: {
        username: string;
        email: string;
        userId: string;
        removedLocalAccount: true;
        removedSupabaseAuthUser: boolean;
        supabaseAuthUserId: string | null;
      };
      accountsFilePath: string;
    }
  | {
      ok: false;
      reason: AdminLocalTestAccountsFailureReason;
      message: string;
    };

export const deleteAdminLocalTestAccountInputSchema = z.object({
  email: z.string().trim().email(),
  confirmEmail: z.string().trim().email(),
});

export type DeleteAdminLocalTestAccountInput = z.output<
  typeof deleteAdminLocalTestAccountInputSchema
>;

export const getAdminLocalTestAccounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminLocalTestAccountsResult> => {
    return getAdminLocalTestAccountsServer();
  },
);

export const deleteAdminLocalTestAccount = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => deleteAdminLocalTestAccountInputSchema.parse(value))
  .handler(async ({ data }): Promise<DeleteAdminLocalTestAccountResult> => {
    return deleteAdminLocalTestAccountServer(data);
  });

const getAdminLocalTestAccountsServer = createServerOnlyFn(
  async (): Promise<AdminLocalTestAccountsResult> => {
    const { getAdminLocalTestAccountsForCurrentRequest } =
      await import("@/lib/admin-local-test-accounts.server");

    return getAdminLocalTestAccountsForCurrentRequest();
  },
);

const deleteAdminLocalTestAccountServer = createServerOnlyFn(
  async (data: DeleteAdminLocalTestAccountInput): Promise<DeleteAdminLocalTestAccountResult> => {
    const { deleteAdminLocalTestAccountForCurrentRequest } =
      await import("@/lib/admin-local-test-accounts.server");

    return deleteAdminLocalTestAccountForCurrentRequest(data);
  },
);
