import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AuthEntryScreen } from "@/components/AuthEntryScreen";
import { OnboardingGate } from "@/components/OnboardingGate";
import { TodayHero } from "@/components/TodayHero";
import { Calendar } from "@/components/Calendar";
import { APP_NAME } from "@/lib/app-config";
import { getHomeRouteData } from "@/lib/training-api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${APP_NAME} — Weekly plan` },
      {
        name: "description",
        content:
          "Sign in first, describe your running goal, and open the saved weekly plan once the first plan is built.",
      },
    ],
  }),
  loader: () => getHomeRouteData(),
  pendingComponent: HomePendingState,
  errorComponent: HomeErrorState,
  component: Index,
});

function Index() {
  const { snapshot, viewer, onboardingDefaults, localBypassEnabled, magicLinkEnabled } =
    Route.useLoaderData();

  if (snapshot.mode === "preview") {
    return (
      <AuthEntryScreen
        localBypassEnabled={localBypassEnabled}
        magicLinkEnabled={magicLinkEnabled}
        next="/"
      />
    );
  }

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="hito-route-gutter py-8 lg:py-10">
        {snapshot.mode === "onboarding" ? (
          <OnboardingGate defaults={onboardingDefaults} />
        ) : (
          <div className="hito-route-stack">
            <TodayHero snapshot={snapshot} />
            <Calendar snapshot={snapshot} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function HomePendingState() {
  return (
    <AppShell>
      <div className="hito-route-gutter space-y-12 py-8 lg:py-10">
        <section className="pt-1 lg:pt-2">
          <div className="hito-workout-hero-grid">
            <div>
              <Skeleton className="h-4 w-64" />
              <Skeleton className="mt-4 h-16 w-full max-w-2xl" />
              <Skeleton className="mt-4 h-5 w-full max-w-xl" />
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
            <div className="flex flex-wrap justify-start gap-5 sm:justify-end sm:gap-6">
              <Skeleton className="h-16 w-20" />
              <Skeleton className="h-16 w-20" />
              <Skeleton className="h-16 w-20" />
            </div>
          </div>
        </section>
        <section className="space-y-5">
          <Skeleton className="h-12 w-56" />
          <Skeleton className="hito-route-panel-skeleton hito-route-panel-skeleton-calendar" />
        </section>
      </div>
    </AppShell>
  );
}

function HomeErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="hito-route-gutter max-w-2xl py-20">
        <section className="hito-state-surface" data-tone="destructive">
          <p className="hito-label text-destructive">Home unavailable</p>
          <h1 className="hito-page-title">We couldn&apos;t load this week&apos;s plan.</h1>
          <p className="hito-page-copy text-foreground/85">
            Try again to reopen the latest saved or preview state. If setup is still incomplete,
            returning home will keep you in the onboarding flow.
          </p>
          <div className="hito-state-actions">
            <button
              type="button"
              onClick={() => {
                reset();
                window.location.reload();
              }}
              className="hito-button hito-button-primary hito-button-lg"
            >
              Try again
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
