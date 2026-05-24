import { z } from "zod";

export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_LOGIN_ENDPOINT = "/api/admin/auth/login";
export const DEFAULT_ADMIN_REDIRECT = "/admin/analytics";

export const adminLoginInputSchema = z.object({
  identifier: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(500),
  next: z.string().trim().max(500).optional().nullable(),
});

export type AdminLoginInput = z.output<typeof adminLoginInputSchema>;

export type AdminLoginFailureReason =
  | "local_admin_login_unavailable"
  | "admin_config_invalid"
  | "invalid_credentials"
  | "admin_required";

export type AdminLoginResult =
  | {
      ok: true;
      redirectTo: string;
    }
  | {
      ok: false;
      reason: AdminLoginFailureReason;
      message: string;
      redirectTo: string;
    };

export interface AdminLoginRouteData {
  next: string;
  formAction: string;
}

export function buildAdminLoginRouteData(next: unknown): AdminLoginRouteData {
  return {
    next: sanitizeAdminRedirectPath(next),
    formAction: ADMIN_LOGIN_ENDPOINT,
  };
}

export function sanitizeAdminRedirectPath(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_ADMIN_REDIRECT;
  }

  const trimmed = value.trim();

  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//") || hasUrlScheme(trimmed)) {
    return DEFAULT_ADMIN_REDIRECT;
  }

  try {
    const parsed = new URL(trimmed, "http://hito.local");

    if (!parsed.pathname.startsWith("/admin/")) {
      return DEFAULT_ADMIN_REDIRECT;
    }

    if (
      parsed.pathname === ADMIN_LOGIN_PATH ||
      parsed.pathname.startsWith(`${ADMIN_LOGIN_PATH}/`)
    ) {
      return DEFAULT_ADMIN_REDIRECT;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_ADMIN_REDIRECT;
  }
}

function hasUrlScheme(value: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(value);
}
