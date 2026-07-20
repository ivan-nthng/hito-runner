import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestAuthContext } from "@/lib/backend/auth";
import type { AdminAuthSession, AdminSessionSource } from "@/lib/admin-auth-actions.server";
import { resolveAdminAuthSession as resolveSignedAdminAuthSession } from "@/lib/admin-auth-actions.server";
import type { Database } from "@/lib/supabase/database";
import { isLoopbackRuntimeUrl, serverEnv } from "@/lib/supabase/env";

const ADMIN_SERVER_FUNCTIONS = [
  {
    sourceFile: "src/lib/admin-analytics.ts",
    functionName: "getAdminAnalytics_createServerFn_handler",
  },
  {
    sourceFile: "src/lib/admin-capture.ts",
    functionName: "listAdminCaptureBacklog_createServerFn_handler",
  },
  {
    sourceFile: "src/lib/admin-capture.ts",
    functionName: "createAdminCaptureItem_createServerFn_handler",
  },
  {
    sourceFile: "src/lib/admin-capture.ts",
    functionName: "updateAdminCaptureItemTriage_createServerFn_handler",
  },
  {
    sourceFile: "src/lib/admin-capture.ts",
    functionName: "appendAdminCaptureItemNote_createServerFn_handler",
  },
  {
    sourceFile: "src/lib/admin-capture.ts",
    functionName: "deleteAdminCaptureQuickNote_createServerFn_handler",
  },
  {
    sourceFile: "src/lib/admin-capture.ts",
    functionName: "getAdminCaptureCopyPrompt_createServerFn_handler",
  },
  {
    sourceFile: "src/lib/admin-local-test-accounts.ts",
    functionName: "getAdminLocalTestAccounts_createServerFn_handler",
  },
  {
    sourceFile: "src/lib/admin-local-test-accounts.ts",
    functionName: "deleteAdminLocalTestAccount_createServerFn_handler",
  },
] as const;

export const ADMIN_SERVER_FUNCTION_SOURCE_FILES = [
  ...new Set(ADMIN_SERVER_FUNCTIONS.map((entry) => entry.sourceFile)),
] as Array<(typeof ADMIN_SERVER_FUNCTIONS)[number]["sourceFile"]>;

const ADMIN_SERVER_FUNCTION_IDS = new Set(
  ADMIN_SERVER_FUNCTIONS.map((entry) =>
    createHash("sha256").update(`${entry.sourceFile}--${entry.functionName}`).digest("hex"),
  ),
);

type AdminRuntimeClass = "deployed" | "loopback";

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export interface AdminAccessCapabilities {
  adminAnalytics: true;
  adminCapture: true;
  localTestAccounts: boolean;
}

export type AdminAccessFailureReason =
  | "authentication_required"
  | "admin_required"
  | "admin_unavailable";

export interface AdminAccessContext {
  adminUserId: string;
  adminLabel: string;
  provider: "admin" | "supabase";
  sessionSource: AdminSessionSource | "supabase_app_metadata";
  runtimeClass: AdminRuntimeClass;
  capabilities: AdminAccessCapabilities;
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

export interface AdminAuthSessionResolutionOptions {
  pathname?: string | null;
  serverFnMeta?: {
    id?: string | null;
    filename?: string | null;
  } | null;
}

export interface AdminAccessDependencies {
  auth: RequestAuthContext;
  runtimeUrl: string | URL | null;
  localAuthBypassEnabled?: boolean;
  supabase: Pick<SupabaseClient<Database>, "auth"> | null;
}

export async function resolveAdminAuthSession(
  request: Request,
  options?: AdminAuthSessionResolutionOptions,
): Promise<AdminAuthSession | null> {
  if (!isAdminSessionEligibleRequest(request.url, options)) {
    return null;
  }

  const session = await resolveSignedAdminAuthSession(request);

  if (!session) {
    return null;
  }

  if (session.source === "local_fixture" && !isLoopbackRuntimeUrl(request.url)) {
    return null;
  }

  return session;
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
    return requireSignedAdminAccess(dependencies);
  }

  if (auth.provider === "supabase") {
    return requireSupabaseAdminAccess(dependencies);
  }

  return failure("admin_required", "This admin tool is available only to signed admin sessions.");
}

export function isAdminSessionEligibleRequest(
  requestUrl: string,
  options?: AdminAuthSessionResolutionOptions,
) {
  return (
    isAdminRequestPath(requestUrl) ||
    isAdminServerFunctionPath(requestUrl) ||
    isAdminRequestPath(options?.pathname ?? null) ||
    isAdminServerFunctionPath(options?.pathname ?? null) ||
    isAdminServerFunctionId(options?.serverFnMeta?.id) ||
    isAdminServerFunction(options?.serverFnMeta?.filename)
  );
}

export function buildLoopbackAdminCanonicalRedirect(
  request: Request,
  options?: AdminAuthSessionResolutionOptions,
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return null;
  }

  if (url.hostname === "localhost" || !isLoopbackRuntimeUrl(url)) {
    return null;
  }

  if (!isAdminSessionEligibleRequest(request.url, options)) {
    return null;
  }

  url.hostname = "localhost";

  return new Response(null, {
    status: 307,
    headers: {
      location: url.toString(),
    },
  });
}

function requireSignedAdminAccess(dependencies: AdminAccessDependencies): AdminAccessResult {
  const session = dependencies.auth.adminSession;
  const sessionSource = session?.source ?? "deployed_password";
  const runtimeClass = session?.runtimeClass ?? "deployed";

  if (sessionSource === "local_fixture") {
    if (
      !dependencies.localAuthBypassEnabled ||
      !dependencies.runtimeUrl ||
      !isLoopbackRuntimeUrl(dependencies.runtimeUrl)
    ) {
      return failure("admin_unavailable", "Local admin access is unavailable in this runtime.");
    }
  }

  return {
    ok: true,
    admin: {
      adminUserId: dependencies.auth.userId!,
      adminLabel: session?.label ?? "admin",
      provider: "admin",
      sessionSource,
      runtimeClass,
      capabilities: buildCapabilities({
        sessionSource,
        runtimeUrl: dependencies.runtimeUrl,
        localAuthBypassEnabled: Boolean(dependencies.localAuthBypassEnabled),
      }),
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

  if (!isSupabaseAppMetadataAdminUser(user)) {
    return failure("admin_required", "This admin tool is available only to admin sessions.");
  }

  return {
    ok: true,
    admin: {
      adminUserId: user.id,
      adminLabel: user.email ?? dependencies.auth.email ?? "Supabase admin",
      provider: "supabase",
      sessionSource: "supabase_app_metadata",
      runtimeClass: "deployed",
      capabilities: buildCapabilities({
        sessionSource: "supabase_app_metadata",
        runtimeUrl: dependencies.runtimeUrl,
        localAuthBypassEnabled: Boolean(dependencies.localAuthBypassEnabled),
      }),
    },
  };
}

function buildCapabilities(input: {
  sessionSource: AdminAccessContext["sessionSource"];
  runtimeUrl: string | URL | null;
  localAuthBypassEnabled: boolean;
}): AdminAccessCapabilities {
  return {
    adminAnalytics: true,
    adminCapture: true,
    localTestAccounts:
      input.sessionSource === "local_fixture" &&
      input.localAuthBypassEnabled &&
      Boolean(input.runtimeUrl && isLoopbackRuntimeUrl(input.runtimeUrl)),
  };
}

function isSupabaseAppMetadataAdminUser(user: SupabaseAuthUser) {
  const appMetadata = user.app_metadata ?? {};

  return (
    appMetadata.hito_admin === true ||
    appMetadata.hito_role === "admin" ||
    appMetadata.hito_local_role === "admin"
  );
}

function isAdminRequestPath(value: string | null) {
  const pathname = parseRequestPathname(value);

  return Boolean(pathname?.startsWith("/admin/") || pathname?.startsWith("/api/admin/"));
}

function isAdminServerFunction(filename: string | null | undefined) {
  const normalizedFilename = filename?.replaceAll("\\", "/").split(/[?#]/, 1)[0];

  return ADMIN_SERVER_FUNCTION_SOURCE_FILES.some(
    (sourceFile) =>
      normalizedFilename === sourceFile || normalizedFilename?.endsWith(`/${sourceFile}`),
  );
}

function isAdminServerFunctionPath(value: string | null) {
  const pathname = parseRequestPathname(value);
  const encodedMetadata = pathname?.match(/^\/_serverFn\/([^/]+)/)?.[1];

  if (!encodedMetadata) {
    return false;
  }

  if (isAdminServerFunctionId(encodedMetadata)) {
    return true;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedMetadata, "base64url").toString("utf8")) as {
      file?: unknown;
    };

    return typeof parsed.file === "string" && isAdminServerFunction(parsed.file);
  } catch {
    return false;
  }
}

function isAdminServerFunctionId(value: string | null | undefined) {
  return typeof value === "string" && ADMIN_SERVER_FUNCTION_IDS.has(value);
}

function parseRequestPathname(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, "http://hito.local").pathname;
  } catch {
    return null;
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
