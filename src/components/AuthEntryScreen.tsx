import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import loginDesertHorizon from "@/assets/marketing/hero-background/login-desert-horizon.jpg";
import { Icon } from "@/components/ui/icon";
import { requestMagicLink } from "@/lib/training-api";

type AuthEntryStatus = "error" | "invalid_credentials" | "local_unavailable" | undefined;

function validateEmailInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Enter your email address.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
    return "Enter a valid email address.";
  }

  return null;
}

function magicLinkErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("public app URL")) {
    return "Email sign-in links are available from a public Hito app URL.";
  }

  if (error instanceof Error && error.message.includes("not configured")) {
    return "Email sign-in links are not available in this environment yet.";
  }

  return "Could not send the sign-in link. Try again.";
}

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
  const hasEmailText = email.trim().length > 0;
  const emailValidationMessage = error ?? null;

  return (
    <div className="auth-hero min-h-screen bg-background text-foreground">
      <img src={loginDesertHorizon} alt="" aria-hidden="true" className="auth-hero-image" />
      <div className="auth-hero-overlay" aria-hidden="true" />
      <div className="auth-hero-content mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12 lg:px-10">
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
                Start a plan for your next event, or pick up where you left off.
              </p>
            </div>
          </div>

          <div className="auth-hero-card hito-surface-flat p-5 lg:p-6">
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
                          <Icon name="visibility-off" size="sm" />
                        ) : (
                          <Icon name="visibility" size="sm" />
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
                      Local login is not available in this environment.
                    </p>
                  )}
                </form>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <Icon name="mail" size="xs" className="text-signal" />
                  <span>Continue with email</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {localBypassEnabled
                    ? "Use an email sign-in link from a public Hito app URL."
                    : "Use email to sign in from a public Hito app URL."}
                </p>

                {status === "error" && (
                  <p className="hito-field-error mt-4">
                    The last sign-in link did not work. Request a new one and try again.
                  </p>
                )}

                {magicLinkEnabled ? (
                  <form
                    noValidate
                    className="mt-5 grid gap-5"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const validationMessage = validateEmailInput(email);

                      if (validationMessage) {
                        setPhase("idle");
                        setError(validationMessage);
                        return;
                      }

                      setPhase("sending");
                      setError(null);

                      try {
                        await requestMagicLinkFn({
                          data: {
                            email: email.trim(),
                            next,
                          },
                        });
                        setPhase("sent");
                      } catch (requestError) {
                        setPhase("idle");
                        setError(magicLinkErrorMessage(requestError));
                      }
                    }}
                  >
                    <label className="grid gap-2">
                      <span className="hito-label">Email</span>
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError(null);
                          if (phase === "sent") {
                            setPhase("idle");
                          }
                        }}
                        placeholder="name@example.com"
                        aria-invalid={Boolean(emailValidationMessage)}
                        aria-describedby={
                          emailValidationMessage ? "email-sign-in-error" : undefined
                        }
                        className={`hito-field hito-field-lg ${emailValidationMessage ? "hito-field-feedback-error" : ""}`}
                      />
                      {emailValidationMessage ? (
                        <span id="email-sign-in-error" className="hito-field-error">
                          {emailValidationMessage}
                        </span>
                      ) : null}
                    </label>
                    {hasEmailText ? (
                      <div className="grid gap-3">
                        <button
                          type={phase === "sent" ? "button" : "submit"}
                          disabled={phase === "sending"}
                          data-tone={phase === "sent" ? "success" : undefined}
                          className={
                            phase === "sent"
                              ? "hito-button hito-button-primary hito-button-lg"
                              : "hito-button hito-button-secondary hito-button-lg"
                          }
                        >
                          {phase === "sending" ? (
                            "Sending link..."
                          ) : phase === "sent" ? (
                            <>
                              <Icon name="check" size="sm" />
                              Sent
                            </>
                          ) : (
                            "Send sign-in link"
                          )}
                        </button>
                        {phase === "sent" ? (
                          <p className="hito-field-success">
                            Check your email for the sign-in link.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </form>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {localBypassEnabled
                      ? "Email sign-in links are turned off on this local runtime. Use local login here, or open Hito from a public app URL if you need a sign-in link."
                      : "Email sign-in links are not available from this local runtime. Open Hito from a public app URL to request a sign-in link."}
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
