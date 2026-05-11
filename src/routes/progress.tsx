import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TYPE_META, weeklyMileage, statsTotals } from "@/lib/training";
import { TrendingUp, Activity, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getProgressRouteData } from "@/lib/training-api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: `Progress — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Progress surfaces backed by the preview seam or the persisted plan and workout log.",
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
        <div className="px-6 lg:px-10 py-20 max-w-3xl">
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
        <div className="px-6 lg:px-10 py-20 max-w-3xl">
          <section className="hito-state-surface">
            <p className="hito-label">Progress unavailable</p>
            <h1 className="hito-page-title">There isn&apos;t a visible plan to summarize yet.</h1>
            <p className="hito-page-copy">
              Once you create or import a saved plan, this preserved surface will reuse the same
              backend truth for volume, completion, and week status context.
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
  const recentTypes = snapshot.workouts
    .filter((workout) => workout.date <= snapshot.currentDate && workout.type !== "rest")
    .slice(-12);

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="hito-route-stack px-6 py-10 lg:px-10 max-w-6xl">
        <header className="hito-page-header">
          <p className="hito-label">
            {snapshot.source === "persisted" ? "Saved mode shell" : "Preview surface"}
          </p>
          <h1 className="hito-page-title">Progress, kept honest.</h1>
          <p className="hito-page-copy">
            {snapshot.source === "persisted"
              ? "This route stays preserved to keep the imported navigation and layout intact while the aggregates now read from persisted plan and workout-log state."
              : "This route is preserved to keep the imported navigation and layout intact. The charts below still read from deterministic sample data rather than saved runner history."}
          </p>
        </header>

        <div className="hito-analytics-grid">
          <BigStat
            icon={Activity}
            label="Completed sessions"
            value={`${totals.completed}`}
            hint={`${totals.total} planned in the visible block`}
          />
          <BigStat
            icon={TrendingUp}
            label={snapshot.source === "persisted" ? "Total volume" : "Sample volume"}
            value={`${totals.totalKm}`}
            unit="km"
            hint={
              snapshot.source === "persisted"
                ? "derived from saved workout outcomes"
                : "derived from preview statuses"
            }
          />
          <BigStat
            icon={Clock}
            label="Longest run"
            value={`${totals.longestKm}`}
            unit="km"
            hint="current block view"
          />
          <BigStat
            icon={Flag}
            label="Surface state"
            value={snapshot.source === "persisted" ? "Saved" : "Preview"}
            hint={snapshot.source === "persisted" ? "saved logs are live" : "preview only"}
            statusTone={snapshot.source === "persisted" ? "success" : undefined}
            tone="warn"
          />
        </div>

        <section>
          <SectionHeader title="Weekly mileage" subtitle="Planned vs actual" />
          <div className="hito-surface-flat p-5">
            <div className="flex items-end gap-1.5 h-48">
              {weeks.map((week) => {
                const isPast = week.weekStart <= snapshot.currentDate;
                return (
                  <div
                    key={week.weekStart}
                    className="group flex-1 flex flex-col justify-end items-center gap-1 relative"
                  >
                    <div className="hito-caption absolute -top-7 font-mono-num opacity-0 transition-opacity group-hover:opacity-100">
                      {week.km.toFixed(0)}km
                    </div>
                    <div className="w-full flex items-end gap-px h-full">
                      <div
                        className={cn(
                          "flex-1 rounded-sm transition-all",
                          isPast ? "bg-signal/80" : "bg-foreground/10",
                        )}
                        style={{ height: `${(week.km / maxKm) * 100}%` }}
                        title={`Actual ${week.km.toFixed(1)}km`}
                      />
                      <div
                        className="flex-1 rounded-sm bg-foreground/15"
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
              <span className="hito-caption font-mono-num">Wk 1</span>
              <div className="hito-legend justify-center">
                <LegendItem tone="actual" label="Actual" />
                <LegendItem tone="planned" label="Planned" />
              </div>
              <span className="hito-caption font-mono-num">Wk {weeks.length}</span>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Activity trend" subtitle="14-day sample pattern" />
          <div className="hito-surface-flat p-5">
            <FatigueChart />
          </div>
        </section>

        <section>
          <SectionHeader title="Consistency" subtitle="Last 12 quality sessions" />
          <div className="hito-surface-flat p-5">
            <div className="flex gap-1.5">
              {recentTypes.map((workout) => {
                const meta = TYPE_META[workout.type];
                return (
                  <div key={workout.date} className="flex-1 group">
                    <div
                      className="h-16 rounded-md transition-transform group-hover:scale-y-105 origin-bottom"
                      style={{
                        background:
                          workout.status === "completed"
                            ? meta.color
                            : workout.status === "partial"
                              ? "color-mix(in oklch, var(--warn) 60%, transparent)"
                              : workout.status === "skipped"
                                ? "color-mix(in oklch, var(--destructive) 30%, transparent)"
                                : "var(--hairline)",
                        opacity: workout.status === "skipped" ? 0.5 : 1,
                      }}
                    />
                    <div className="hito-caption mt-2 text-center font-mono-num">
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
          </div>
        </section>

        <section>
          <SectionHeader title="Why this page stays" subtitle="Preserved shell" />
          <div className="hito-row-group">
            <div className="hito-list-row items-end">
              <div className="max-w-xl">
                <p className="hito-label">Preview contract</p>
                <div className="mt-3 font-display text-5xl leading-none">Later, not live.</div>
                <p className="hito-support-copy mt-3">
                  This is where richer trend interpretation can live later, once workout logs, week
                  status, and any derived summaries are backed by real persisted data.
                </p>
              </div>
              <div className="grid min-w-[220px] gap-3">
                {[
                  {
                    k: "Status",
                    v: snapshot.source === "persisted" ? "Saved" : "Preview",
                  },
                  {
                    k: "Logging",
                    v: snapshot.source === "persisted" ? "Persisted" : "Local only",
                  },
                  {
                    k: "Truth",
                    v: snapshot.source === "persisted" ? "Saved logs" : "Preview",
                  },
                ].map((metric) => (
                  <div key={metric.k} className="flex items-baseline justify-between gap-4">
                    <span className="hito-label">{metric.k}</span>
                    <span className="font-mono-num text-sm">{metric.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ProgressPendingState() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-10 max-w-6xl space-y-10">
        <div>
          <Skeleton className="h-4 w-28 bg-background/30" />
          <Skeleton className="mt-4 h-14 w-80 bg-background/40" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl bg-background/30" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl bg-background/20" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl bg-background/20" />
        <Skeleton className="h-56 rounded-2xl bg-background/20" />
      </div>
    </AppShell>
  );
}

function ProgressErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-20 max-w-3xl">
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

function BigStat({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  statusTone,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  statusTone?: "success" | "warning" | "destructive" | "signal";
  tone?: "warn";
}) {
  return (
    <div className="hito-analytics-stat">
      <div className="hito-analytics-stat-head">
        <span className="hito-label">{label}</span>
        <span className="hito-analytics-stat-icon" data-tone={tone}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
        </span>
      </div>
      <div className="hito-analytics-stat-body">
        {statusTone ? (
          <span className="hito-status-pill" data-tone={statusTone}>
            {value}
          </span>
        ) : (
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="hito-analytics-value">{value}</span>
            {unit && <span className="hito-analytics-unit">{unit}</span>}
          </div>
        )}
        {hint && <div className="hito-caption">{hint}</div>}
      </div>
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

function FatigueChart() {
  const points = [42, 48, 55, 50, 58, 65, 60, 68, 72, 70, 65, 68, 62, 68];
  const max = 100;
  const width = 600;
  const height = 140;
  const pad = 8;
  const stepX = (width - pad * 2) / (points.length - 1);
  const path = points
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"} ${pad + index * stepX} ${height - pad - (value / max) * (height - pad * 2)}`,
    )
    .join(" ");
  const area = `${path} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--signal)" stopOpacity="0.25" />
            <stop offset="1" stopColor="var(--signal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((y) => (
          <line
            key={y}
            x1={pad}
            y1={height - pad - y * (height - pad * 2)}
            x2={width - pad}
            y2={height - pad - y * (height - pad * 2)}
            stroke="var(--hairline)"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="url(#g)" />
        <path d={path} fill="none" stroke="var(--signal)" strokeWidth="2.2" />
      </svg>
      <div className="hito-caption mt-3">
        Static placeholder chart. No readiness model, OCR import, or adaptive coaching logic is
        inferred from this line.
      </div>
    </div>
  );
}
