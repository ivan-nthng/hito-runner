import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  RunnerActivityProgressExperience,
  type RunnerProgressTab,
} from "@/components/progress/RunnerActivityProgressExperience";
import { HitoButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/app-config";
import type {
  RunnerActivityFitSequenceMetricId,
  RunnerActivityFitSequenceQuickPeriodId,
} from "@/lib/runner-activity/product-contract";
import { getProgressRouteData } from "@/lib/training-api";
import { getHitoProductMessage } from "@/lib/ui-locale-messages";

const PROGRESS_SEQUENCE_PERIODS = [
  "this_week",
  "last_7_days",
  "last_1_month",
  "last_6_months",
  "custom",
] as const;

const PROGRESS_SEQUENCE_METRICS = [
  "distance",
  "timer_duration",
  "observed_average_pace",
  "elevation_gain",
  "reported_load",
] as const;

type ProgressRouteSearch = {
  tab?: RunnerProgressTab;
  sequencePeriod?: RunnerActivityFitSequenceQuickPeriodId | "custom";
  sequenceMetric?: RunnerActivityFitSequenceMetricId;
  sequenceStartDate?: string;
  sequenceEndDate?: string;
};

export const Route = createFileRoute("/progress")({
  validateSearch: (search: Record<string, unknown>): ProgressRouteSearch => ({
    tab: search.tab === "progress" || search.tab === "plans" ? search.tab : "history",
    sequencePeriod: PROGRESS_SEQUENCE_PERIODS.includes(
      search.sequencePeriod as (typeof PROGRESS_SEQUENCE_PERIODS)[number],
    )
      ? (search.sequencePeriod as ProgressRouteSearch["sequencePeriod"])
      : "this_week",
    sequenceMetric: PROGRESS_SEQUENCE_METRICS.includes(
      search.sequenceMetric as (typeof PROGRESS_SEQUENCE_METRICS)[number],
    )
      ? (search.sequenceMetric as RunnerActivityFitSequenceMetricId)
      : "distance",
    sequenceStartDate:
      typeof search.sequenceStartDate === "string" ? search.sequenceStartDate : undefined,
    sequenceEndDate:
      typeof search.sequenceEndDate === "string" ? search.sequenceEndDate : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Activity history, progress, and plans — ${APP_NAME}` },
      {
        name: "description",
        content: "Review recorded running activities, factual progress, and saved plans.",
      },
    ],
  }),
  loader: () => getProgressRouteData(),
  pendingComponent: ProgressPendingState,
  errorComponent: ProgressErrorState,
  component: ProgressPage,
});

function ProgressPage() {
  const { snapshot, viewer, settings } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <AppShell settings={settings} snapshot={snapshot} viewer={viewer}>
      <RunnerActivityProgressExperience
        activeTab={search.tab ?? "history"}
        sequenceSelection={{
          period: search.sequencePeriod ?? "this_week",
          metric: search.sequenceMetric ?? "distance",
          startDate: search.sequenceStartDate ?? null,
          endDate: search.sequenceEndDate ?? null,
        }}
        onTabChange={(tab) => {
          navigate({ search: (current) => ({ ...current, tab }) });
        }}
        onSequenceSelectionChange={(selection) => {
          navigate({
            search: (current) => ({
              ...current,
              tab: "progress",
              sequencePeriod: selection.period,
              sequenceMetric: selection.metric,
              sequenceStartDate: selection.startDate ?? undefined,
              sequenceEndDate: selection.endDate ?? undefined,
            }),
          });
        }}
      />
    </AppShell>
  );
}

function ProgressPendingState() {
  return (
    <AppShell>
      {(locale) => (
        <div className="hito-route-gutter max-w-5xl space-y-8 py-hito-6 sm:py-10" aria-busy="true">
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
          <span className="sr-only">
            {getHitoProductMessage(locale, "Loading activity history, progress, and saved plans.")}
          </span>
        </div>
      )}
    </AppShell>
  );
}

function ProgressErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      {(locale) => (
        <div className="hito-route-gutter max-w-3xl py-20">
          <section className="hito-state-surface" data-tone="destructive" role="alert">
            <p className="hito-label-md text-destructive">
              {getHitoProductMessage(locale, "Progress unavailable")}
            </p>
            <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
              {getHitoProductMessage(locale, "We couldn't open this runner view.")}
            </h1>
            <p className="hito-body-md mt-4 max-w-[40rem] text-text-secondary">
              {getHitoProductMessage(locale, "Try again to reopen the latest activity truth.")}
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
