import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  RunnerActivityProgressExperience,
  type RunnerProgressTab,
} from "@/components/progress/RunnerActivityProgressExperience";
import { HitoButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/app-config";
import { getProgressRouteData } from "@/lib/training-api";

export const Route = createFileRoute("/progress")({
  validateSearch: (search: Record<string, unknown>): { tab: RunnerProgressTab } => ({
    tab: search.tab === "progress" ? "progress" : "history",
  }),
  head: () => ({
    meta: [
      { title: `Activity history and progress — ${APP_NAME}` },
      {
        name: "description",
        content: "Review recorded running activities and factual progress.",
      },
    ],
  }),
  loader: () => getProgressRouteData(),
  pendingComponent: ProgressPendingState,
  errorComponent: ProgressErrorState,
  component: ProgressPage,
});

function ProgressPage() {
  const { snapshot, viewer } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <RunnerActivityProgressExperience
        activeTab={search.tab}
        onTabChange={(tab) => {
          navigate({ search: { tab } });
        }}
      />
    </AppShell>
  );
}

function ProgressPendingState() {
  return (
    <AppShell>
      <div className="hito-route-gutter max-w-5xl space-y-8 py-10" aria-busy="true">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-14 w-80 max-w-full" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <span className="sr-only">Loading activity history and progress.</span>
      </div>
    </AppShell>
  );
}

function ProgressErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="hito-route-gutter max-w-3xl py-20">
        <section className="hito-state-surface" data-tone="destructive" role="alert">
          <p className="hito-label text-destructive">Progress unavailable</p>
          <h1 className="hito-page-title">We couldn&apos;t open this runner view.</h1>
          <p className="hito-page-copy text-foreground/85">
            Try again to reopen the latest activity truth.
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
              Try again
            </HitoButton>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
