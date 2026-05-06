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
          "Sign in first, then open your imported weekly running plan and saved workout status.",
      },
    ],
  }),
  loader: () => getHomeRouteData(),
  pendingComponent: HomePendingState,
  errorComponent: HomeErrorState,
  component: Index,
});

function Index() {
  const { snapshot, localBypassEnabled } = Route.useLoaderData();
  const hasPlannedWorkouts = snapshot.workouts.some((workout) => workout.type !== "rest");

  if (snapshot.mode === "preview") {
    return <AuthEntryScreen localBypassEnabled={localBypassEnabled} next="/" />;
  }

  return (
    <AppShell snapshot={snapshot}>
      <div className="px-6 lg:px-10 py-8 lg:py-10 space-y-12">
        {snapshot.mode === "onboarding" ? (
          <OnboardingGate />
        ) : !hasPlannedWorkouts ? (
          <PlanUnavailableState />
        ) : (
          <>
            <TodayHero snapshot={snapshot} />
            <Calendar snapshot={snapshot} />
          </>
        )}
      </div>
    </AppShell>
  );
}

function PlanUnavailableState() {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Plan not ready
      </p>
      <h1 className="mt-3 font-display text-4xl lg:text-5xl leading-[1.05]">
        Your plan isn&apos;t ready yet.
      </h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
        We could open your saved mode, but no planned workouts are available to render on the
        calendar yet. Return to setup or refresh once the plan has been assigned.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </section>
  );
}

function HomePendingState() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 lg:py-10 space-y-12">
        <section className="rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
          <Skeleton className="h-4 w-40 bg-background/40" />
          <Skeleton className="mt-5 h-16 w-full max-w-2xl bg-background/40" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl bg-background/30" />
          <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_320px]">
            <Skeleton className="h-40 bg-background/30" />
            <Skeleton className="h-40 bg-background/30" />
          </div>
        </section>
        <section className="space-y-5">
          <Skeleton className="h-12 w-56 bg-background/30" />
          <Skeleton className="h-[420px] rounded-2xl bg-background/20" />
        </section>
      </div>
    </AppShell>
  );
}

function HomeErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-20 max-w-2xl">
        <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 lg:p-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-destructive">
            Home unavailable
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05]">
            We couldn&apos;t load this week&apos;s plan.
          </h1>
          <p className="mt-4 text-sm text-foreground/85 leading-relaxed">
            Try again to reopen the latest saved or preview state. If setup is still incomplete,
            returning home will keep you in the onboarding flow.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                reset();
                window.location.reload();
              }}
              className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
