import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import loginDesertHorizon from "@/assets/marketing/hero-background/login-desert-horizon.jpg";
import { HitoLogo } from "@/components/ui/hito-logo";
import { Icon } from "@/components/ui/icon";
import { APP_NAME } from "@/lib/app-config";
import {
  buildAdminLoginRouteData,
  sanitizeAdminRedirectPath,
  type AdminLoginFailureReason,
} from "@/lib/admin-auth-actions";

type AdminLoginStatus = AdminLoginFailureReason | undefined;

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: sanitizeAdminRedirectPath(search.next),
    status: parseAdminLoginStatus(search.status),
  }),
  head: () => ({
    meta: [
      { title: `Admin login — ${APP_NAME}` },
      {
        name: "description",
        content: "Sign in to the Hito admin operations surface.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const search = Route.useSearch();
  const { next, formAction } = buildAdminLoginRouteData(search.next);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const statusMessage = adminLoginStatusMessage(search.status);

  return (
    <main className="auth-hero min-h-screen bg-background text-foreground">
      <img src={loginDesertHorizon} alt="" aria-hidden="true" className="auth-hero-image" />
      <div className="hito-auth-photo-overlay" aria-hidden="true" />
      <div className="auth-hero-content mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12 lg:px-10">
        <section className="grid w-full gap-12 lg:grid-cols-[0.9fr_0.85fr]">
          <div className="flex flex-col justify-center gap-8">
            <div className="grid justify-items-start gap-3">
              <HitoLogo className="[--hito-logo-height:2.35rem] lg:[--hito-logo-height:3.25rem]" />
              <p className="hito-label text-muted-foreground">Admin</p>
            </div>
            <div className="space-y-4">
              <p className="max-w-sm text-lg text-foreground/92">
                Sign in to view internal analytics and local test-account tools.
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Admin access is separate from runner login and is limited to the configured owner
                admin account.
              </p>
            </div>
          </div>

          <div className="hito-auth-alpha-surface hito-surface-flat p-5 lg:p-6">
            <div>
              <h1 className="hito-modal-title">Admin sign-in</h1>
              <p className="hito-body mt-3 text-muted-foreground">Open admin analytics</p>
            </div>

            <form method="post" action={formAction} className="mt-6 grid gap-5">
              <input type="hidden" name="next" value={next} />
              <label className="grid gap-2">
                <span className="hito-label">Username or email</span>
                <input
                  type="text"
                  name="identifier"
                  autoComplete="username"
                  required
                  placeholder="admin username or email"
                  className="hito-field hito-field-lg"
                />
              </label>
              <label className="grid gap-2">
                <span className="hito-label">Password</span>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    className="hito-field hito-field-lg pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((current) => !current)}
                    className="hito-button hito-button-ghost absolute inset-y-0 right-0 min-h-0 w-12 rounded-l-none p-0 text-muted-foreground hover:translate-y-0"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    {passwordVisible ? (
                      <Icon name="visibility-off" size="sm" />
                    ) : (
                      <Icon name="visibility" size="sm" />
                    )}
                  </button>
                </div>
              </label>
              <button type="submit" className="hito-button hito-button-primary hito-button-lg">
                Sign in to admin
              </button>
              {statusMessage ? (
                <p className="hito-field-error flex items-start gap-2">
                  <Icon name="warning" size="xs" className="mt-0.5" />
                  {statusMessage}
                </p>
              ) : null}
            </form>

            <div className="mt-6 border-t border-hairline pt-5">
              <Link to="/" className="hito-button hito-button-secondary hito-button-md">
                Back to Hito
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function parseAdminLoginStatus(value: unknown): AdminLoginStatus {
  if (
    value === "invalid_credentials" ||
    value === "admin_required" ||
    value === "local_admin_login_unavailable" ||
    value === "admin_config_invalid"
  ) {
    return value;
  }

  return undefined;
}

function adminLoginStatusMessage(status: AdminLoginStatus) {
  switch (status) {
    case "invalid_credentials":
      return "The admin username or password was not accepted.";
    case "admin_required":
      return "Those credentials are valid for a tester, not for admin access.";
    case "local_admin_login_unavailable":
      return "Admin login is not available in this runtime.";
    case "admin_config_invalid":
      return "Admin login is not configured for this runtime.";
    default:
      return null;
  }
}
