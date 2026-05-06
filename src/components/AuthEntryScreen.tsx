import { useState } from "react";
import { Eye, EyeOff, FileJson2, KeyRound } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { requestMagicLink } from "@/lib/training-api";

type AuthEntryStatus = "error" | "invalid_credentials" | "local_unavailable" | undefined;

export function AuthEntryScreen({
  localBypassEnabled,
  next,
  status,
}: {
  localBypassEnabled: boolean;
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
                Создавай свои тренировочные процессы быстро.
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Start with login, then import one JSON file to create your saved calendar and open
                the existing weekly plan flow. We will bring you back to {nextLabel}.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-hairline bg-background/35 p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5 text-signal" />
                  Current entry
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                  {localBypassEnabled
                    ? "This machine uses one temporary local single-user login so saved mode can be exercised honestly."
                    : "Use the configured magic link path to enter saved mode on this device."}
                </p>
              </div>
              <div className="rounded-xl border border-hairline bg-background/35 p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <FileJson2 className="h-3.5 w-3.5 text-signal" />
                  Next step
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                  First-time setup now starts from JSON import. JSON export of saved trainings is a
                  later capability, not live in this slice yet.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-background/45 p-5 lg:p-6">
            {localBypassEnabled ? (
              <>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Temporary local login
                </div>
                <h1 className="mt-3 font-display text-3xl leading-[1.05]">Enter saved mode</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Honest local-only credentials path for one configured user. After login you can
                  import your JSON template and create the calendar.
                </p>

                {status === "invalid_credentials" && (
                  <StatusBlock
                    tone="error"
                    title="Login failed"
                    body="The local credentials were not accepted. Try the configured username and password again."
                  />
                )}

                {status === "local_unavailable" && (
                  <StatusBlock
                    tone="error"
                    title="Local login unavailable"
                    body="This temporary bypass is not configured on the server yet. Add the local-only env values and try again."
                  />
                )}

                <form method="post" action="/api/auth/local-login" className="mt-8 grid gap-5">
                  <input type="hidden" name="next" value={next} />
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
                    <div className="relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        name="password"
                        required
                        className="w-full rounded-lg border border-hairline bg-background/50 px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible((current) => !current)}
                        className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={passwordVisible ? "Hide password" : "Show password"}
                      >
                        {passwordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>
                  <button
                    type="submit"
                    className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
                  >
                    Login
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Magic link
                </div>
                <h1 className="mt-3 font-display text-3xl leading-[1.05]">Enter saved mode</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Request a magic link, open it on this device, and continue into the JSON-first
                  onboarding flow.
                </p>

                {status === "error" && (
                  <StatusBlock
                    tone="error"
                    title="Link expired or invalid"
                    body="The last magic link could not finish sign-in. Request a fresh link and try again."
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

                <form
                  className="mt-8 grid gap-5"
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
                          : "Could not send the magic link.",
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
                      className="rounded-lg border border-hairline bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={phase === "sending"}
                    className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {phase === "sending" ? "Sending link..." : "Send magic link"}
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 border-t border-hairline pt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              After login: upload JSON, create calendar, continue in saved mode
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
