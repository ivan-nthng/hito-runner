import type { CSSProperties } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TYPE_META, weeklyMileage, statsTotals } from "@/lib/training";
import { APP_NAME } from "@/lib/app-config";
import { getProgressRouteData } from "@/lib/training-api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: `Progress — ${APP_NAME}` },
      {
        name: "description",
        content: "Review your progress.",
      },
    ],
  }),
  loader: () => getProgressRouteData(),
  pendingComponent: ProgressPendingState,
  errorComponent: ProgressErrorState,
  component: Progress,
});

function Progress() {
  const { snapshot, viewer } = Route.useLoaderData();
  const hasPlannedWorkouts = snapshot.workouts.some((workout) => workout.type !== "rest");

  if (snapshot.mode === "onboarding") {
    return (
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="hito-route-gutter max-w-3xl py-20">
          <section className="hito-state-surface" data-tone="signal">
            <p className="hito-label">Setup required</p>
            <h1 className="hito-page-title">Finish setup before reviewing progress.</h1>
            <p className="hito-page-copy">
              Progress becomes meaningful only after your saved runner profile and first plan are
              created on home.
            </p>
            <div className="hito-state-actions">
              <Link to="/" className="hito-button hito-button-primary hito-button-lg">
                Finish setup
              </Link>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  if (!hasPlannedWorkouts) {
    return (
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="hito-route-gutter max-w-3xl py-20">
          <section className="hito-state-surface">
            <p className="hito-label">Progress unavailable</p>
            <h1 className="hito-page-title">There isn&apos;t a visible plan to summarize yet.</h1>
            <p className="hito-page-copy">
              Once you create or import a plan, this page will summarize your volume, completion,
              and week status.
            </p>
            <div className="hito-state-actions">
              <Link to="/" className="hito-button hito-button-primary hito-button-lg">
                Back to weekly plan
              </Link>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  const weeks = weeklyMileage(snapshot);
  const totals = statsTotals(snapshot);
  const maxKm = Math.max(...weeks.map((week) => Math.max(week.km, week.planned)), 1);
  const hasWeeklyVolume = weeks.some((week) => week.km >= 0.5 || week.planned >= 0.5);
  const shouldShowWeeklyVolumeChart =
    hasWeeklyVolume && (snapshot.source === "persisted" || totals.totalKm > 0);
  const recentTypes = snapshot.workouts
    .filter((workout) => workout.date <= snapshot.currentDate && workout.type !== "rest")
    .slice(-12);

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="hito-route-gutter hito-route-stack max-w-5xl py-10">
        <header className="hito-page-header">
          <p className="hito-label">
            {snapshot.source === "persisted" ? "Saved progress" : "Preview"}
          </p>
          <h1 className="hito-page-title">Progress</h1>
          <p className="hito-page-copy">
            {snapshot.source === "persisted"
              ? "A compact summary of saved workouts and plan volume so far."
              : "Preview only. These summaries use sample plan statuses, not saved training history."}
          </p>
        </header>

        <section className="hito-row-group">
          <div className="hito-list-row items-start lg:items-end">
            <div className="max-w-md">
              <h2 className="hito-section-title">Current summary</h2>
              <p className="hito-support-copy mt-2">
                {snapshot.source === "persisted"
                  ? "Built from saved workout logs and the current plan."
                  : "Sample-only progress. Sign in and save workouts for trusted history."}
              </p>
            </div>
            <div className="hito-metric-row w-full lg:max-w-xl">
              <SummaryMetric
                label="Completed"
                value={`${totals.completed}`}
                unit={`of ${totals.total}`}
              />
              <SummaryMetric
                label={snapshot.source === "persisted" ? "Volume" : "Sample volume"}
                value={`${totals.totalKm}`}
                unit="km"
              />
              <SummaryMetric label="Longest" value={`${totals.longestKm}`} unit="km" />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Weekly volume" subtitle="Planned vs actual" />
          <div className="hito-chart-section">
            {shouldShowWeeklyVolumeChart ? (
              <>
                <div className="flex h-36 items-end gap-1.5">
                  {weeks.map((week) => {
                    const isPast = week.weekStart <= snapshot.currentDate;
                    return (
                      <div
                        key={week.weekStart}
                        className="group relative flex flex-1 flex-col items-center justify-end gap-1"
                      >
                        <div className="hito-chart-note hito-chart-hover-note absolute -top-6">
                          {week.km.toFixed(0)}km
                        </div>
                        <div className="flex h-full w-full items-end gap-px">
                          <div
                            className="hito-comparison-bar flex-1"
                            data-tone={isPast ? "actual" : "future"}
                            style={{ height: `${(week.km / maxKm) * 100}%` }}
                            title={`Actual ${week.km.toFixed(1)}km`}
                          />
                          <div
                            className="hito-comparison-bar flex-1"
                            data-tone="planned"
                            style={{
                              height: `${(week.planned / maxKm) * 100}%`,
                            }}
                            title={`Planned ${week.planned.toFixed(1)}km`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="hito-chart-note">Wk 1</span>
                  <div className="hito-legend justify-center">
                    <LegendItem tone="actual" label="Actual" />
                    <LegendItem tone="planned" label="Planned" />
                  </div>
                  <span className="hito-chart-note">Wk {weeks.length}</span>
                </div>
              </>
            ) : (
              <p className="hito-support-copy max-w-xl">
                {snapshot.source === "persisted"
                  ? "No weekly volume is available for this plan window yet."
                  : "No sample weekly volume is available in this preview."}
              </p>
            )}
          </div>
        </section>

        <section>
          <SectionHeader title="Recent consistency" subtitle="Last 12 workouts" />
          <div className="hito-chart-section">
            {recentTypes.length > 0 ? (
              <>
                <div className="flex gap-1.5">
                  {recentTypes.map((workout) => {
                    const meta = TYPE_META[workout.type];
                    return (
                      <div key={workout.date} className="group flex-1">
                        <div
                          className="hito-comparison-bar h-16 origin-bottom"
                          data-interactive="true"
                          data-status={workout.status}
                          style={
                            workout.status === "completed"
                              ? ({
                                  "--hito-comparison-bar-color": meta.color,
                                } as CSSProperties)
                              : undefined
                          }
                        />
                        <div className="hito-chart-note mt-2 text-center">
                          {workout.date.slice(5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="hito-legend mt-5">
                  <LegendItem tone="completed" label="Completed" />
                  <LegendItem tone="partial" label="Partial" />
                  <LegendItem tone="skipped" label="Skipped" />
                </div>
              </>
            ) : (
              <div className="hito-caption">
                No workout results are available for this plan window yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ProgressPendingState() {
  return (
    <AppShell>
      <div className="hito-route-gutter max-w-5xl space-y-10 py-10">
        <div>
          <Skeleton className="h-4 w-28 bg-background/30" />
          <Skeleton className="mt-4 h-14 w-80 bg-background/40" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl bg-background/30" />
        </div>
        <Skeleton className="h-32 rounded-2xl bg-background/20" />
        <Skeleton className="h-48 rounded-2xl bg-background/20" />
      </div>
    </AppShell>
  );
}

function ProgressErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="hito-route-gutter max-w-3xl py-20">
        <section className="hito-state-surface" data-tone="destructive">
          <p className="hito-label text-destructive">Progress unavailable</p>
          <h1 className="hito-page-title">We couldn&apos;t load this progress view.</h1>
          <p className="hito-page-copy text-foreground/85">
            Try again to reopen the latest preview or saved aggregate state.
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
            <Link
              to="/"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to weekly plan
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="hito-section-header">
      <h2 className="hito-section-title">{title}</h2>
      <span className="hito-section-subtitle">{subtitle}</span>
    </div>
  );
}

function SummaryMetric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="hito-metric">
      <div className="flex items-baseline justify-center gap-1.5">
        <span className="hito-analytics-value">{value}</span>
        {unit && <span className="hito-analytics-unit">{unit}</span>}
      </div>
      <div className="hito-metric-label">{label}</div>
    </div>
  );
}

function LegendItem({
  tone,
  label,
}: {
  tone: "actual" | "planned" | "completed" | "partial" | "skipped";
  label: string;
}) {
  return (
    <span className="hito-legend-item">
      <span className="hito-legend-swatch" data-tone={tone} />
      {label}
    </span>
  );
}
