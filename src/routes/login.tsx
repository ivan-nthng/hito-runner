import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";
import { APP_NAME } from "@/lib/app-config";
import { getLoginRouteData, requestMagicLink } from "@/lib/training-api";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: sanitizeRedirectPath(typeof search.next === "string" ? search.next : null),
    status:
      search.status === "error" ||
      search.status === "invalid_credentials" ||
      search.status === "local_unavailable"
        ? search.status
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Login — ${APP_NAME}` },
      {
        name: "description",
        content: "Sign in with a magic link so Hito Running can save your plan and workout log.",
      },
    ],
  }),
  loader: () => getLoginRouteData(),
  component: LoginPage,
});

function LoginPage() {
  const { snapshot, localBypassEnabled } = Route.useLoaderData();
  const search = Route.useSearch();
  const requestMagicLinkFn = useServerFn(requestMagicLink);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const nextLabel =
    search.next === "/"
      ? "your saved weekly plan"
      : search.next.startsWith("/workout/")
        ? "the workout you opened"
        : search.next === "/progress"
          ? "your progress view"
          : "the page you were trying to open";

  if (snapshot.source === "persisted") {
    return (
      <AppShell snapshot={snapshot}>
        <div className="px-6 lg:px-10 py-10 max-w-3xl">
          <section className="rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {snapshot.mode === "authenticated" ? "Saved mode" : "Setup required"}
            </p>
            <h1 className="mt-3 font-display text-4xl lg:text-5xl leading-[1.05]">
              {snapshot.mode === "authenticated"
                ? "You&apos;re already signed in."
                : "You&apos;re signed in. Finish setup next."}
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
              {snapshot.mode === "authenticated"
                ? "Your profile, plan, and workout logging are already using persisted backend truth."
                : "Your authenticated account is ready. Finish goal and baseline setup on home to create the saved plan and workout surface."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
              >
                {snapshot.mode === "authenticated" ? "Open my plan" : "Finish setup"}
              </Link>
              <Link
                to={search.next}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Return to {nextLabel}
              </Link>
              <a
                href="/api/auth/logout?next=%2F"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Sign out
              </a>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  if (localBypassEnabled) {
    return (
      <AppShell snapshot={snapshot}>
        <div className="px-6 lg:px-10 py-10 max-w-3xl">
          <section className="rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Temporary local login
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Return to {nextLabel}
              </p>
            </div>
            <h1 className="mt-3 font-display text-4xl lg:text-5xl leading-[1.05]">
              Save your running plan
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
              This machine is using a temporary single-user credentials bypass so saved mode can be
              exercised without Magic Link. Preview mode still remains available when you sign out.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-hairline bg-background/35 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  What this unlocks
                </div>
                <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                  Saved profile setup, persisted workout logging, and backend-derived week status.
                </p>
              </div>
              <div className="rounded-xl border border-hairline bg-background/35 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Temporary scope
                </div>
                <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                  Local-only credentials and session cookie. Remove this path once Supabase auth is
                  restored.
                </p>
              </div>
            </div>

            {search.status === "invalid_credentials" && (
              <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-destructive">
                  Login failed
                </div>
                <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                  The local credentials were not accepted. Try the configured username and password
                  again.
                </p>
              </div>
            )}

            {search.status === "local_unavailable" && (
              <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-destructive">
                  Local login unavailable
                </div>
                <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                  This temporary bypass is not configured on the server yet. Add the local-only env
                  values and try again.
                </p>
              </div>
            )}

            <form
              method="post"
              action="/api/auth/local-login"
              className="mt-10 grid gap-5 max-w-lg"
            >
              <input type="hidden" name="next" value={search.next} />
              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Username or email
                </span>
                <input
                  type="text"
                  name="identifier"
                  required
                  placeholder="ivan"
                  className="rounded-lg border border-hairline bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Password
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  className="rounded-lg border border-hairline bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
                >
                  Login
                </button>
                <Link
                  to="/"
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Back to preview
                </Link>
              </div>
            </form>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell snapshot={snapshot}>
      <div className="px-6 lg:px-10 py-10 max-w-3xl">
        <section className="rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Magic link
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Return to {nextLabel}
            </p>
          </div>
          <h1 className="mt-3 font-display text-4xl lg:text-5xl leading-[1.05]">
            Save your running plan
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Preview mode stays available, but trusted profile setup, persisted workouts, and
            backend-derived week status live behind one authenticated account. We will bring you
            back to {nextLabel} after the magic link is confirmed.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-hairline bg-background/35 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                What this unlocks
              </div>
              <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                Saved profile setup, persisted workout logging, and backend-derived week status.
              </p>
            </div>
            <div className="rounded-xl border border-hairline bg-background/35 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                How it works
              </div>
              <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                Enter your email, open the link on this device, and continue in saved mode without a
                password.
              </p>
            </div>
          </div>

          {search.status === "error" && (
            <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-destructive">
                Link expired or invalid
              </div>
              <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                The last magic link could not finish sign-in. Request a fresh link and try again.
              </p>
            </div>
          )}

          {phase === "sent" && (
            <div className="mt-8 rounded-xl border border-success/30 bg-success/10 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-success">
                Check your inbox
              </div>
              <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                We sent a magic link to <span className="font-medium">{email}</span>. Open it on
                this device to continue to {nextLabel}.
              </p>
            </div>
          )}

          <form
            className="mt-10 grid gap-5 max-w-lg"
            onSubmit={async (event) => {
              event.preventDefault();
              setPhase("sending");
              setError(null);

              try {
                await requestMagicLinkFn({ data: { email, next: search.next } });
                setPhase("sent");
              } catch (submitError) {
                setPhase("idle");
                setError(
                  submitError instanceof Error ? submitError.message : "Could not send magic link.",
                );
              }
            }}
          >
            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                placeholder="runner@example.com"
                disabled={phase === "sending"}
                className="rounded-lg border border-hairline bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={phase === "sending"}
                className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {phase === "sending"
                  ? "Sending magic link..."
                  : phase === "sent"
                    ? "Send again"
                    : "Send magic link"}
              </button>
              <Link
                to="/"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Back to preview
              </Link>
            </div>

            {phase === "sending" && (
              <p className="text-sm text-muted-foreground">
                Sending a secure link for {nextLabel}…
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </section>
      </div>
    </AppShell>
  );
}
