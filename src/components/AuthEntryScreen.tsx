import { useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
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
              <div className="hito-surface-flat flex h-12 w-12 items-center justify-center">
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

          <div className="hito-surface-flat p-5 lg:p-6">
            {localBypassEnabled ? (
              <div className="hito-tab-list">
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
                    data-active={activeTab === tab.key}
                    className="hito-tab"
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
                    <span className="hito-label">Username or email</span>
                    <input
                      type="text"
                      name="identifier"
                      required
                      placeholder="username or email"
                      className="hito-field hito-field-lg"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="hito-label">Password</span>
                    <div className="relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        name="password"
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
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>
                  <button type="submit" className="hito-button hito-button-primary hito-button-lg">
                    Log in
                  </button>
                  {status === "invalid_credentials" && (
                    <p className="hito-field-error">
                      The username or password was not accepted. Try again.
                    </p>
                  )}
                  {status === "local_unavailable" && (
                    <p className="hito-field-error">
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
                  <p className="hito-field-error mt-4">
                    The last Magic Link could not finish sign-in. Request a fresh link and try
                    again.
                  </p>
                )}

                {phase === "sent" && (
                  <p className="hito-field-success mt-4">
                    Check {email} and open the new sign-in link on this device.
                  </p>
                )}

                {error && <p className="hito-field-error mt-4">{error}</p>}

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
                      <span className="hito-label">Email</span>
                      <input
                        type="email"
                        name="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@example.com"
                        className="hito-field hito-field-lg"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={phase === "sending"}
                      className="hito-button hito-button-secondary hito-button-lg"
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
