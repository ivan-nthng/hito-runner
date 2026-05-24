import {
  ADMIN_LOGIN_PATH,
  adminLoginInputSchema,
  sanitizeAdminRedirectPath,
  type AdminLoginInput,
  type AdminLoginResult,
} from "@/lib/admin-auth-actions";
import {
  appendLocalAuthSessionCookie,
  getLocalAuthAccounts,
  verifyLocalAuthCredentials,
  type LocalAuthAccountConfig,
} from "@/lib/local-auth";
import { isDevOnlyLocalAuthRuntime } from "@/lib/supabase/env";

type AdminLoginVerificationResult =
  | (Extract<AdminLoginResult, { ok: true }> & {
      account: LocalAuthAccountConfig;
    })
  | Extract<AdminLoginResult, { ok: false }>;

export interface AdminLoginDependencies {
  isLocalRuntime: boolean;
  accounts: LocalAuthAccountConfig[];
  verifyCredentials: (
    identifier: string,
    password: string,
  ) => Promise<
    | {
        ok: true;
        account: LocalAuthAccountConfig;
      }
    | {
        ok: false;
        reason: "unavailable" | "invalid";
      }
  >;
}

export async function loginLocalAdminForRequest(request: Request): Promise<Response> {
  return handleAdminLoginRequestForDependencies(request, await buildCurrentDependencies(request));
}

export async function handleAdminLoginRequestForDependencies(
  request: Request,
  dependencies: AdminLoginDependencies,
): Promise<Response> {
  const data = await parseAdminLoginRequest(request);
  const result = await verifyAdminLoginForDependencies(data, dependencies);
  const responseHeaders = new Headers();

  if (result.ok) {
    await appendLocalAuthSessionCookie(responseHeaders, request, result.account);
    responseHeaders.set("location", new URL(result.redirectTo, request.url).toString());

    return new Response(null, {
      status: 302,
      headers: responseHeaders,
    });
  }

  const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
  loginUrl.searchParams.set("status", result.reason);
  loginUrl.searchParams.set("next", result.redirectTo);
  responseHeaders.set("location", loginUrl.toString());

  return new Response(null, {
    status: 302,
    headers: responseHeaders,
  });
}

export async function verifyAdminLoginForCurrentRequest(
  data: AdminLoginInput,
  request: Request,
): Promise<AdminLoginResult> {
  return stripAccount(
    await verifyAdminLoginForDependencies(data, await buildCurrentDependencies(request)),
  );
}

export async function verifyAdminLoginForDependencies(
  data: AdminLoginInput,
  dependencies: AdminLoginDependencies,
): Promise<AdminLoginVerificationResult> {
  const parsed = adminLoginInputSchema.safeParse(data);
  const redirectTo = sanitizeAdminRedirectPath(data.next);

  if (!parsed.success) {
    return failure(
      "invalid_credentials",
      "Enter the local admin username or email and password.",
      redirectTo,
    );
  }

  if (!dependencies.isLocalRuntime) {
    return failure(
      "local_admin_login_unavailable",
      "Local admin login is available only in the local auth bypass runtime.",
      redirectTo,
    );
  }

  const adminAccounts = dependencies.accounts.filter((account) => account.role === "admin");

  if (adminAccounts.length !== 1) {
    return failure(
      "admin_config_invalid",
      "Local admin login requires exactly one configured admin account.",
      redirectTo,
    );
  }

  const credentials = await dependencies.verifyCredentials(
    parsed.data.identifier,
    parsed.data.password,
  );

  if (!credentials.ok) {
    return failure(
      credentials.reason === "unavailable"
        ? "local_admin_login_unavailable"
        : "invalid_credentials",
      credentials.reason === "unavailable"
        ? "Local admin login is unavailable in this runtime."
        : "The local admin credentials were not recognized.",
      redirectTo,
    );
  }

  if (credentials.account.role !== "admin") {
    return failure(
      "admin_required",
      "Those credentials are valid for a local tester, not for admin access.",
      redirectTo,
    );
  }

  return {
    ok: true,
    redirectTo,
    account: credentials.account,
  };
}

async function buildCurrentDependencies(request: Request): Promise<AdminLoginDependencies> {
  return {
    isLocalRuntime: isDevOnlyLocalAuthRuntime(request.url),
    accounts: await getLocalAuthAccounts(),
    verifyCredentials: (identifier, password) =>
      verifyLocalAuthCredentials(identifier, password, request.url),
  };
}

async function parseAdminLoginRequest(request: Request): Promise<AdminLoginInput> {
  const url = new URL(request.url);
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const raw = (await request.json().catch(() => ({}))) as {
      identifier?: unknown;
      password?: unknown;
      next?: unknown;
    };

    return {
      identifier: typeof raw.identifier === "string" ? raw.identifier : "",
      password: typeof raw.password === "string" ? raw.password : "",
      next: typeof raw.next === "string" ? raw.next : url.searchParams.get("next"),
    };
  }

  const formData = await request.formData().catch(() => null);

  return {
    identifier: formValue(formData, "identifier"),
    password: formValue(formData, "password"),
    next: formValue(formData, "next") || url.searchParams.get("next"),
  };
}

function formValue(formData: FormData | null, key: string) {
  const value = formData?.get(key);
  return typeof value === "string" ? value : "";
}

function stripAccount(result: AdminLoginVerificationResult): AdminLoginResult {
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    redirectTo: result.redirectTo,
  };
}

function failure(
  reason: Exclude<AdminLoginResult, { ok: true }>["reason"],
  message: string,
  redirectTo: string,
): Extract<AdminLoginResult, { ok: false }> {
  return {
    ok: false,
    reason,
    message,
    redirectTo,
  };
}
