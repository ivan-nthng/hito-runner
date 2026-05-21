import { Link, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AuthEntryScreen } from "@/components/AuthEntryScreen";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";
import { APP_NAME } from "@/lib/app-config";
import { getLoginRouteData } from "@/lib/training-api";

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
        content: "Sign in first, then describe your running goal to create your saved Hito plan.",
      },
    ],
  }),
  loader: () => getLoginRouteData(),
  component: LoginPage,
});

function LoginPage() {
  const { snapshot, viewer, localBypassEnabled, magicLinkEnabled } = Route.useLoaderData();
  const search = Route.useSearch();
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
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="px-6 py-10 lg:px-10">
          <section className="hito-surface max-w-3xl p-6 lg:p-10">
            <p className="hito-micro-label">
              {snapshot.mode === "authenticated" ? "Saved mode" : "Setup required"}
            </p>
            <h1 className="hito-modal-title mt-3">
              {snapshot.mode === "authenticated"
                ? "You’re already signed in."
                : "You’re signed in. Create your plan next."}
            </h1>
            <p className="hito-body mt-4 max-w-xl text-muted-foreground">
              {snapshot.mode === "authenticated"
                ? "Your profile, plan, and workout results are already saved."
                : "Your account is ready. Go home and describe your goal to create your plan."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/" className="hito-button hito-button-primary hito-button-md">
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

  return (
    <AuthEntryScreen
      localBypassEnabled={localBypassEnabled}
      magicLinkEnabled={magicLinkEnabled}
      next={search.next}
      status={search.status}
    />
  );
}
