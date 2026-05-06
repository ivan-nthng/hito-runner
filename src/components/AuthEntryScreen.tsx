import { useState } from "react";
import { Eye, EyeOff, FileJson2, KeyRound, Mail } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { requestMagicLink } from "@/lib/training-api";

type AuthEntryStatus = "error" | "invalid_credentials" | "local_unavailable" | undefined;

interface LocalAccountSummary {
  username: string;
  email: string;
  role: "admin" | "tester";
  displayName: string;
}

export function AuthEntryScreen({
  localBypassEnabled,
  localAccounts,
  magicLinkEnabled,
  next,
  status,
}: {
  localBypassEnabled: boolean;
  localAccounts: LocalAccountSummary[];
  magicLinkEnabled: boolean;
  next: string;
  status?: AuthEntryStatus;
}) {
  const requestMagicLinkFn = useServerFn(requestMagicLink);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const nextLabel =
    next === "/"
      ? "your saved calendar"
      : next.startsWith("/workout/")
        ? "the workout you opened"
        : next === "/progress"
          ? "your progress view"
          : "the page you were trying to open";
  const adminAccount = localAccounts.find((account) => account.role === "admin") ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground canvas-grain">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12 lg:px-10">
        <section className="grid w-full gap-8 rounded-[28px] border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 shadow-[0_20px_80px_rgba(0,0,0,0.08)] lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Login first
              </div>
              <div className="mt-4 font-display text-5xl leading-none tracking-tight lg:text-7xl">
                Hito.
              </div>
              <p className="mt-4 max-w-md text-base text-foreground/90">
                Sign in first, then import one JSON week to create your saved running calendar.
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                We will bring you back to {nextLabel}. The local admin login is the fastest path for
                this machine. Magic Link remains available as a secondary option.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-hairline bg-background/35 p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5 text-signal" />
                  Primary path
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                  {localBypassEnabled
                    ? "Use the temporary local admin login to enter saved mode quickly and keep the JSON-first onboarding flow intact."
                    : "Local admin login is not configured yet. Use the available Magic Link path for now."}
                </p>
              </div>
              <div className="rounded-xl border border-hairline bg-background/35 p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <FileJson2 className="h-3.5 w-3.5 text-signal" />
                  Next step
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                  After login, import one JSON week to create the saved plan. JSON export is still a
                  later capability, not part of this temporary auth slice.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-background/45 p-5 lg:p-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Credentials login
            </div>
            <h1 className="mt-3 font-display text-3xl leading-[1.05]">Enter saved mode</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Username and password are the visible admin path on this device. Magic Link stays
              available below as an alternative.
            </p>

            {adminAccount && (
              <div className="mt-6 rounded-xl border border-hairline bg-background/35 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Admin account
                </div>
                <p className="mt-2 text-sm text-foreground/85">
                  Username:{" "}
                  <span className="font-medium text-foreground">{adminAccount.username}</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  The password stays in local-only config and is never committed into tracked files.
                </p>
              </div>
            )}

            {localAccounts.length > 0 && (
              <div className="mt-4 rounded-xl border border-hairline bg-background/35 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Available local accounts
                </div>
                <div className="mt-3 grid gap-2">
                  {localAccounts.map((account) => (
                    <div
                      key={`${account.role}-${account.username}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-hairline/70 bg-background/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-foreground">{account.displayName}</div>
                        <div className="text-xs text-muted-foreground">@{account.username}</div>
                      </div>
                      <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {account.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status === "invalid_credentials" && (
              <StatusBlock
                tone="error"
                title="Login failed"
                body="The username or password was not accepted. Try the configured local account again."
              />
            )}

            {status === "local_unavailable" && (
              <StatusBlock
                tone="error"
                title="Credentials login unavailable"
                body="The temporary local account list is not configured on the server yet. Add the local-only account config and try again."
              />
            )}

            <form method="post" action="/api/auth/local-login" className="mt-8 grid gap-5">
              <input type="hidden" name="next" value={next} />
              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Username
                </span>
                <input
                  type="text"
                  name="identifier"
                  required
                  placeholder={adminAccount?.username ?? "ivan"}
                  className="rounded-lg border border-hairline bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    name="password"
                    required
                    className="w-full rounded-lg border border-hairline bg-background/50 px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((current) => !current)}
                    className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
              >
                Log in
              </button>
            </form>

            <div className="mt-8 border-t border-hairline pt-6">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-signal" />
                Secondary option
              </div>
              <h2 className="mt-3 font-display text-2xl leading-[1.05]">Magic Link</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Use email sign-in only if you prefer the Supabase path on this device.
              </p>

              {status === "error" && (
                <StatusBlock
                  tone="error"
                  title="Link expired or invalid"
                  body="The last Magic Link could not finish sign-in. Request a fresh link and try again."
                />
              )}

              {phase === "sent" && (
                <StatusBlock
                  tone="success"
                  title="Link sent"
                  body={`Check ${email} and open the new sign-in link on this device. We will return you to ${nextLabel}.`}
                />
              )}

              {error && <StatusBlock tone="error" title="Could not send link" body={error} />}

              {magicLinkEnabled ? (
                <form
                  className="mt-6 grid gap-5"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setPhase("sending");
                    setError(null);

                    try {
                      await requestMagicLinkFn({
                        data: {
                          email,
                          next,
                        },
                      });
                      setPhase("sent");
                    } catch (requestError) {
                      setPhase("idle");
                      setError(
                        requestError instanceof Error
                          ? requestError.message
                          : "Could not send the Magic Link.",
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
                      name="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      className="rounded-lg border border-hairline bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={phase === "sending"}
                    className="rounded-md border border-hairline px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
                  >
                    {phase === "sending" ? "Sending Magic Link..." : "Send Magic Link"}
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-xl border border-hairline bg-background/35 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Magic Link is not configured in this environment yet. Add the Supabase public
                    env values if you want to test the email path locally.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-hairline pt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              After login: import JSON, create calendar, continue in saved mode
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusBlock({
  tone,
  title,
  body,
}: {
  tone: "error" | "success";
  title: string;
  body: string;
}) {
  return (
    <div
      className={`mt-6 rounded-xl border p-4 ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/10"
          : "border-success/30 bg-success/10"
      }`}
    >
      <div
        className={`text-[11px] uppercase tracking-[0.18em] ${
          tone === "error" ? "text-destructive" : "text-success"
        }`}
      >
        {title}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/85">{body}</p>
    </div>
  );
}
