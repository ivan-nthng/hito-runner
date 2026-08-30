import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AuthEntryScreen } from "@/components/AuthEntryScreen";
import { OnboardingGate } from "@/components/OnboardingGate";
import { TodayHero } from "@/components/TodayHero";
import { Calendar } from "@/components/Calendar";
import { HitoButton } from "@/components/ui/button";
import { APP_NAME } from "@/lib/app-config";
import { getHomeRouteData, type ViewerSummary } from "@/lib/training-api";
import { Skeleton } from "@/components/ui/skeleton";
import { getHitoProductMessage } from "@/lib/ui-locale-messages";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { createPlan?: true } => ({
    createPlan: search.createPlan === "true" || search.createPlan === true ? true : undefined,
  }),
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
  const {
    snapshot,
    viewer,
    onboardingDefaults,
    settings,
    localActivityFileDesignFixtureEnabled,
    localBypassEnabled,
    magicLinkEnabled,
  } = Route.useLoaderData();
  const runnerViewer = viewer as ViewerSummary | null;
  const search = Route.useSearch();

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
    <AppShell settings={settings} snapshot={snapshot} viewer={runnerViewer}>
      <div
        className={
          snapshot.mode === "onboarding" || search.createPlan
            ? "hito-route-gutter py-8 lg:py-10"
            : "hito-route-gutter py-hito-6 sm:py-8 lg:py-10"
        }
      >
        {snapshot.mode === "onboarding" || search.createPlan ? (
          <OnboardingGate defaults={onboardingDefaults} />
        ) : (
          <div className="hito-route-stack">
            <TodayHero snapshot={snapshot} />
            <Calendar
              snapshot={snapshot}
              runnerScopeKey={runnerViewer?.email ?? null}
              localActivityFileDesignFixtureEnabled={localActivityFileDesignFixtureEnabled}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function HomePendingState() {
  return (
    <AppShell>
      <div className="hito-route-gutter space-y-hito-8 py-hito-6 sm:space-y-12 sm:py-8 lg:py-10">
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
      {(locale) => (
        <div className="hito-route-gutter max-w-2xl py-20">
          <section className="hito-state-surface" data-tone="destructive">
            <p className="hito-label-md text-destructive">
              {getHitoProductMessage(locale, "Home unavailable")}
            </p>
            <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
              {getHitoProductMessage(locale, "We couldn't load this week's plan.")}
            </h1>
            <p className="hito-body-md mt-4 max-w-[40rem] text-text-secondary">
              {getHitoProductMessage(
                locale,
                "Try again to reopen the latest saved or preview state. If setup is still incomplete, returning home will keep you in the onboarding flow.",
              )}
            </p>
            <div className="hito-state-actions">
              <HitoButton
                type="button"
                onClick={() => {
                  reset();
                  window.location.reload();
                }}
                size="lg"
                variant="primary"
              >
                {getHitoProductMessage(locale, "Try again")}
              </HitoButton>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
