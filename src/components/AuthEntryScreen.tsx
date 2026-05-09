import { useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { requestMagicLink } from "@/lib/training-api";

type AuthEntryStatus = "error" | "invalid_credentials" | "local_unavailable" | undefined;

export function AuthEntryScreen({
  localBypassEnabled,
  magicLinkEnabled,
  next,
  status,
}: {
  localBypassEnabled: boolean;
  magicLinkEnabled: boolean;
  next: string;
  status?: AuthEntryStatus;
}) {
  const requestMagicLinkFn = useServerFn(requestMagicLink);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    localBypassEnabled ? "login" : "signup",
  );

  return (
    <div className="min-h-screen bg-background text-foreground canvas-grain">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12 lg:px-10">
        <section className="grid w-full gap-12 lg:grid-cols-[0.9fr_0.85fr]">
          <div className="flex flex-col justify-center gap-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-hairline bg-surface-elevated/50">
                <div className="h-3.5 w-3.5 rounded-full bg-signal shadow-[0_0_20px_rgba(243,167,74,0.35)]" />
              </div>
              <div className="font-display text-5xl leading-none tracking-tight lg:text-7xl">
                Hito.
              </div>
            </div>
            <div className="space-y-4">
              <p className="max-w-sm text-lg text-foreground/92">Your running plan, kept simple.</p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Create a new program for your next event, or come back to your plan and progress.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-background/30 p-5 lg:p-6">
            {localBypassEnabled ? (
              <div className="inline-flex rounded-lg border border-hairline bg-background/35 p-1">
                {(
                  [
                    { key: "login", label: "Log in" },
                    { key: "signup", label: "Sign up" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setPhase("idle");
                      setError(null);
                    }}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm transition-colors",
                      activeTab === tab.key
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}

            {localBypassEnabled && activeTab === "login" ? (
              <div className="mt-6">
                <form method="post" action="/api/auth/local-login" className="grid gap-5">
                  <input type="hidden" name="next" value={next} />
                  <label className="grid gap-2">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Username or email
                    </span>
                    <input
                      type="text"
                      name="identifier"
                      required
                      placeholder="username or email"
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
                    Log in
                  </button>
                  {status === "invalid_credentials" && (
                    <p className="text-sm text-destructive">
                      The username or password was not accepted. Try again.
                    </p>
                  )}
                  {status === "local_unavailable" && (
                    <p className="text-sm text-destructive">
                      Local development login is not available on this runtime.
                    </p>
                  )}
                </form>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-signal" />
                  <span>Continue with email</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {localBypassEnabled
                    ? "Use an email link to continue."
                    : "Use the real email sign-in path for this environment."}
                </p>

                {status === "error" && (
                  <p className="mt-4 text-sm text-destructive">
                    The last Magic Link could not finish sign-in. Request a fresh link and try
                    again.
                  </p>
                )}

                {phase === "sent" && (
                  <p className="mt-4 text-sm text-success">
                    Check {email} and open the new sign-in link on this device.
                  </p>
                )}

                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

                {magicLinkEnabled ? (
                  <form
                    className="mt-5 grid gap-5"
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
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Magic Link is not configured in this environment yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
