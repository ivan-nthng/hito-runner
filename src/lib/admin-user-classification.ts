export type AdminUserClassification =
  | "real"
  | "local_test"
  | "local_admin"
  | "supabase_test"
  | "supabase_admin"
  | "suspected_test";

export type AdminUserClassificationSource =
  | "none"
  | "local_accounts_file"
  | "supabase_app_metadata"
  | "email_domain"
  | "email_prefix";

export interface AdminUserClassificationInfo {
  classification: AdminUserClassification;
  classificationReason: string;
  classificationSource: AdminUserClassificationSource;
}

export interface AdminUserClassificationInput {
  email: string | null;
  appMetadata?: Record<string, unknown>;
  localAccountRole?: "admin" | "tester" | null;
}

const SUSPECTED_TEST_PREFIXES = ["qa-", "test-", "codex-", "apply-"];

export function classifyAdminAnalyticsUser(
  input: AdminUserClassificationInput,
): AdminUserClassificationInfo {
  if (input.localAccountRole === "admin") {
    return {
      classification: "local_admin",
      classificationReason: "local_account_admin",
      classificationSource: "local_accounts_file",
    };
  }

  if (input.localAccountRole === "tester") {
    return {
      classification: "local_test",
      classificationReason: "local_account_tester",
      classificationSource: "local_accounts_file",
    };
  }

  const appMetadata = input.appMetadata ?? {};
  const localRole = stringMetadata(appMetadata.hito_local_role);
  const hitoRole = stringMetadata(appMetadata.hito_role);

  if (appMetadata.hito_admin === true || hitoRole === "admin" || localRole === "admin") {
    return {
      classification: "supabase_admin",
      classificationReason:
        localRole === "admin" ? "supabase_local_admin" : "supabase_admin_metadata",
      classificationSource: "supabase_app_metadata",
    };
  }

  if (appMetadata.hito_test_user === true || localRole === "tester") {
    return {
      classification: "supabase_test",
      classificationReason:
        localRole === "tester" ? "supabase_local_tester" : "supabase_hito_test_user",
      classificationSource: "supabase_app_metadata",
    };
  }

  const email = input.email?.trim().toLowerCase() ?? null;

  if (email?.endsWith("@local.test")) {
    return {
      classification: "suspected_test",
      classificationReason: "local_test_email_domain",
      classificationSource: "email_domain",
    };
  }

  if (email && SUSPECTED_TEST_PREFIXES.some((prefix) => email.startsWith(prefix))) {
    return {
      classification: "suspected_test",
      classificationReason: "disposable_email_prefix",
      classificationSource: "email_prefix",
    };
  }

  return {
    classification: "real",
    classificationReason: "no_test_signal",
    classificationSource: "none",
  };
}

function stringMetadata(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}
