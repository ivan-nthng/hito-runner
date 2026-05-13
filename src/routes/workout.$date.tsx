import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  Minus,
  NotebookPen,
  ShieldAlert,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IntervalsViz } from "@/components/IntervalsViz";
import { CompletionPanel, WorkoutFeedbackPanel } from "@/components/CompletionPanel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  displayTargetEntries,
  formatDistanceKm,
  formatDate,
  primaryWorkoutTarget,
  WEEK_STATUS_META,
  type TrainingSnapshot,
  type Workout,
  weekOf,
  workoutTypeMeta,
  workoutDistanceKm,
  workoutDuration,
} from "@/lib/training";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getWorkoutRouteData } from "@/lib/training-api";

export const Route = createFileRoute("/workout/$date")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      search.tab === "complete" ||
      search.tab === "feedback" ||
      search.tab === "preview" ||
      search.tab === "overview"
        ? search.tab
        : "overview",
  }),
  head: () => ({
    meta: [
      { title: `Workout — ${APP_NAME}` },
      {
        name: "description",
        content: "Review the workout and log the result.",
      },
    ],
  }),
  loader: async ({ params }) => {
    return getWorkoutRouteData({ data: { date: params.date } });
  },
  pendingComponent: WorkoutPendingState,
  errorComponent: WorkoutErrorState,
  component: WorkoutPage,
});

function WorkoutPage() {
  const { workout, snapshot, viewer, prev, next, feedback } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab = search.tab;

  if (!workout) {
    return (
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="px-6 lg:px-10 py-20 max-w-2xl">
          <section
            className="hito-state-surface"
            data-tone={snapshot.mode === "onboarding" ? "signal" : undefined}
          >
            {snapshot.mode === "onboarding" ? (
              <>
                <p className="hito-label">Setup required</p>
                <h1 className="hito-page-title">Finish setup before opening workouts.</h1>
                <p className="hito-page-copy">
                  Create your plan first, then your workouts will open here.
                </p>
              </>
            ) : (
              <>
                <p className="hito-label">No workout</p>
                <h1 className="hito-page-title">Nothing is scheduled for this day.</h1>
                <p className="hito-page-copy">
                  There is no workout on this date in the current plan. Go back and choose another
                  day.
                </p>
              </>
            )}
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

  const meta = workoutTypeMeta(workout);
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);
  const status = workout.status;
  const isRestDay = workout.type === "rest";
  const restAssignment = restAssignmentFor(workout);
  const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];
  const resultMeta = resultMetaForStatus(status);
  const skippedCopy = skippedExplanationFor(workout, snapshot.source);
  const weekProgress = weekProgressFor(snapshot.workouts, snapshot.currentDate);
  const primaryTarget = primaryWorkoutTarget(workout);
  const targetEntries = displayTargetEntries(primaryTarget);
  const targetMetricKeys = new Set(["intensity", "hr_bpm_range", "pace_min_per_km_range", "pace"]);
  const primaryTargetMetrics = targetEntries.filter((entry) => targetMetricKeys.has(entry.key));
  const targetSupportEntries = targetEntries.filter((entry) => !targetMetricKeys.has(entry.key));
  const phase = `${workout.phase} · week ${workout.week}`;
  const heroMetrics = isRestDay
    ? []
    : [
        km != null ? { label: "Distance", value: formatDistanceKm(km), unit: "km" } : null,
        duration > 0 ? { label: "Duration", value: duration.toString(), unit: "min" } : null,
        duration > 0 ? { label: "Load", value: loadFor(workout) } : null,
      ].filter((metric): metric is { label: string; value: string; unit?: string } =>
        Boolean(metric),
      );

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="relative max-w-6xl px-6 py-8 lg:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,rgba(209,161,69,0.14),transparent_48%),radial-gradient(circle_at_top_right,rgba(122,162,247,0.12),transparent_44%),radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_62%)]" />
        <div className="flex items-center gap-3 hito-section-subtitle">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Calendar
          </Link>
          <span className="opacity-50">/</span>
          <span>{phase}</span>
        </div>

        <section className="relative mt-5 overflow-hidden border-t border-hairline/80 px-1 pb-3 pt-6 lg:pt-7">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-3 hito-section-subtitle">
                {resultMeta ? (
                  <ResultBadge meta={resultMeta} mode="identity" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                )}
                <span style={{ color: meta.color }}>{meta.label}</span>
                <span className="opacity-50">·</span>
                <span className="text-muted-foreground">
                  {formatDate(workout.date, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {workout.date === snapshot.currentDate && (
                  <span className="text-signal">· Today</span>
                )}
              </div>
              <h1 className="mt-3 max-w-2xl text-balance font-display text-4xl leading-[1.05] lg:text-5xl">
                {isRestDay ? "Rest day" : workout.title}
              </h1>
              {objectiveFor(workout.type) && (
                <p className="hito-support-copy mt-4 max-w-xl">{objectiveFor(workout.type)}</p>
              )}
            </div>

            {heroMetrics.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 sm:justify-end sm:gap-8">
                {heroMetrics.map((metric) => (
                  <Stat
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    unit={metric.unit}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-10 flex gap-6 border-b border-hairline/80 pb-3">
          <div className="hito-tab-list hito-tab-list-open">
            {(
              [
                { v: "overview", l: "Overview" },
                { v: "complete", l: "Log result" },
                { v: "feedback", l: "Feedback" },
                { v: "preview", l: "Preview state" },
              ] as const
            ).map((tabOption) => (
              <button
                key={tabOption.v}
                onClick={() =>
                  navigate({
                    search: (current) => ({
                      ...current,
                      tab: tabOption.v,
                    }),
                    replace: true,
                  })
                }
                data-active={tab === tabOption.v}
                className="hito-tab"
              >
                {tabOption.l}
                {tabOption.v === "preview" && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-signal">
                    later
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-10">
          <div
            className={cn(
              "relative",
              (tab === "complete" || tab === "preview") &&
                "overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(150deg,rgba(16,22,28,0.86),rgba(29,36,46,0.7))] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.18)]",
              tab === "feedback" && "p-1",
            )}
          >
            {(tab === "complete" || tab === "preview") && (
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
            {tab === "overview" && <Overview workout={workout} />}
            {tab === "complete" && (
              <CompletionPanel workout={workout} snapshot={snapshot} feedback={feedback} />
            )}
            {tab === "feedback" && (
              <WorkoutFeedbackPanel workout={workout} snapshot={snapshot} feedback={feedback} />
            )}
            {tab === "preview" && <PreviewPanel />}
          </div>

          <aside>
            <SidebarPanel>
              {resultMeta && (
                <SidebarSection title="Saved result">
                  <div className="flex items-center justify-between gap-3">
                    <ResultBadge meta={resultMeta} mode="sidebar" />
                    <span className="text-xs text-muted-foreground">
                      {snapshot.source === "persisted" ? "Saved" : "Preview"}
                    </span>
                  </div>
                </SidebarSection>
              )}

              {!isRestDay && primaryTarget && (
                <SidebarSection title="Workout targets" tone="signal" titleVariant="strong">
                  <div className="space-y-3">
                    {primaryTargetMetrics.map((entry) => (
                      <div
                        key={entry.key}
                        className="flex items-start justify-between gap-3 py-1 last:border-0"
                      >
                        <span className="hito-section-subtitle">{entry.label}</span>
                        <span className="max-w-[11rem] text-xs text-right text-foreground/85">
                          {entry.value}
                        </span>
                      </div>
                    ))}

                    {targetSupportEntries.length > 0 ? (
                      <div className="border-t border-hairline pt-4 space-y-4">
                        {targetSupportEntries.map((entry) => (
                          <div key={entry.key}>
                            <p className="hito-section-subtitle">{entry.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-foreground/82">
                              {entry.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </SidebarSection>
              )}

              {(!isRestDay || restAssignment) && (
                <SidebarSection title={isRestDay ? "Assignment" : "Workout note"} muted>
                  <p className="text-xs leading-relaxed text-foreground/80">
                    {isRestDay ? restAssignment : coachNoteFor(workout.type)}
                  </p>
                </SidebarSection>
              )}

              <SidebarSection title="This week">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-foreground/85">
                    {weekProgress.completed} of {weekProgress.total} workouts completed
                  </span>
                  <span className="font-mono-num text-muted-foreground">
                    {weekProgress.percent}%
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full overflow-hidden bg-hairline/80">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(122,162,247,0.95),rgba(209,161,69,0.92))]"
                    style={{ width: `${weekProgress.percent}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 hito-caption">
                  <span>{weekStatus.label}</span>
                  <span>{weekProgress.remaining} left</span>
                </div>
                <p className="hito-caption mt-3">{weekStatus.helper}</p>
              </SidebarSection>

              <SidebarSection title="About this page" tone="signal">
                <div className="flex items-start gap-2">
                  <CalendarClock className="mt-0.5 h-3.5 w-3.5 text-signal" />
                  <p className="text-xs leading-relaxed text-foreground/80">
                    {snapshot.source === "persisted"
                      ? `${APP_NAME} keeps the same layout here while your plan, results, and week status come from saved data.`
                      : `You're viewing the preview. Results and plan changes are not saved here yet.`}
                  </p>
                </div>
              </SidebarSection>

              {status === "skipped" && (
                <SidebarSection title="Skipped">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 text-destructive" />
                    <p className="text-xs text-foreground/80">
                      {snapshot.source === "persisted"
                        ? skippedCopy
                        : "This sample status comes from preview logic only."}
                    </p>
                  </div>
                </SidebarSection>
              )}
            </SidebarPanel>
          </aside>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 gap-3">
          {prev && <NavCard direction="prev" date={prev.date} title={prev.title} />}
          {next && <NavCard direction="next" date={next.date} title={next.title} />}
        </div>
      </div>
    </AppShell>
  );
}

function WorkoutPendingState() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-6xl space-y-8">
        <div className="flex items-center gap-3 hito-section-subtitle">
          <Skeleton className="h-3 w-32 bg-background/30" />
        </div>
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <Skeleton className="h-4 w-64 bg-background/30" />
            <Skeleton className="mt-4 h-16 w-full max-w-2xl bg-background/40" />
            <Skeleton className="mt-4 h-5 w-full max-w-xl bg-background/30" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-16 w-24 bg-background/30" />
            <Skeleton className="h-16 w-24 bg-background/30" />
            <Skeleton className="h-16 w-24 bg-background/30" />
          </div>
        </div>
        <Skeleton className="h-10 w-72 bg-background/30" />
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          <Skeleton className="h-[460px] rounded-2xl bg-background/20" />
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl bg-background/20" />
            <Skeleton className="h-32 rounded-2xl bg-background/20" />
            <Skeleton className="h-32 rounded-2xl bg-background/20" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function WorkoutErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-20 max-w-2xl">
        <section className="hito-state-surface" data-tone="destructive">
          <p className="hito-label text-destructive">Workout unavailable</p>
          <h1 className="hito-page-title">We couldn&apos;t load this workout.</h1>
          <p className="hito-page-copy text-foreground/85">
            Try again. If your plan is still being set up, go back home first.
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

function Overview({ workout }: { workout: Workout }) {
  const restAssignment = restAssignmentFor(workout);

  if (workout.type === "rest") {
    return (
      <section className="flex min-h-[220px] flex-col border-t border-white/8 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="hito-label">Recovery day</p>
            <h3 className="mt-2 font-display text-3xl">Keep it light.</h3>
            <p className="hito-support-copy mt-4 max-w-lg">
              No distance, duration, or load is scheduled here. Let the day stay open unless a real
              recovery assignment is present.
            </p>
          </div>
          <div className="hidden items-end gap-2 opacity-50 sm:flex">
            <div className="h-8 w-8 rounded-full border border-white/8 bg-background/25" />
            <div className="h-12 w-12 rounded-full border border-white/8 bg-background/20" />
            <div className="h-6 w-6 rounded-full border border-white/8 bg-background/25" />
          </div>
        </div>

        {restAssignment && (
          <div className="mt-auto border-t border-white/8 pt-5">
            <div>
              <p className="hito-label">Assignment</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">{restAssignment}</p>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <IntervalsViz workout={workout} />

      <div>
        <h3 className="hito-label">Execution cues</h3>
        <ul className="mt-4 space-y-2 text-sm text-foreground/85">
          <li className="flex gap-3">
            <span className="text-muted-foreground">·</span> Start the first 10 minutes deliberately
            easy. Allow heart rate to rise gradually.
          </li>
          <li className="flex gap-3">
            <span className="text-muted-foreground">·</span> If HR drifts above zone, slow down or
            take a walk break.
          </li>
          <li className="flex gap-3">
            <span className="text-muted-foreground">·</span> Aim for relaxed shoulders, light
            landing, cadence ~175.
          </li>
          <li className="flex gap-3">
            <span className="text-muted-foreground">·</span> Hydrate every 25 min if temperature
            exceeds 20°C.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="hito-label">Fueling & recovery</h3>
        <div className="relative mt-4 overflow-hidden rounded-2xl bg-[linear-gradient(145deg,rgba(15,19,24,0.92),rgba(21,26,32,0.82))] shadow-[0_14px_35px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.04)] sm:grid sm:grid-cols-3">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {[
            { t: "Pre", v: "Light carb 60 min prior" },
            {
              t: "During",
              v: workout.type === "long_run" ? "Gel at 45 min" : "Water only",
            },
            { t: "After", v: "Protein + carb within 45 min" },
          ].map((item) => (
            <div
              key={item.t}
              className="border-t border-white/8 px-4 py-4 text-foreground first:border-t-0 sm:border-t-0 sm:border-l sm:border-white/8 sm:first:border-l-0"
            >
              <div className="hito-section-subtitle text-[10px] text-white/50">{item.t}</div>
              <div className="mt-1 text-sm text-white/92">{item.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewPanel() {
  return (
    <div className="hito-surface-flat border-dashed p-8 text-center">
      <NotebookPen className="h-6 w-6 mx-auto text-signal" strokeWidth={1.4} />
      <h3 className="mt-4 font-display text-2xl">This tab is not in use yet</h3>
      <p className="hito-support-copy mx-auto mt-3 max-w-md">
        It stays here to hold the tab layout until extra analysis or plan tools are ready.
      </p>
      <div className="mt-6">
        <span className="hito-status-pill" data-tone="signal">
          Later
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="hito-metric min-w-16">
      <div className="flex items-baseline justify-center gap-1">
        <span className="hito-metric-value text-2xl">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <div className="hito-metric-label">{label}</div>
    </div>
  );
}

function SidebarPanel({ children }: { children: React.ReactNode }) {
  return <div className="hito-row-group">{children}</div>;
}

function SidebarSection({
  title,
  children,
  tone,
  muted,
  titleVariant,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "signal";
  muted?: boolean;
  titleVariant?: "default" | "strong";
}) {
  return (
    <section
      className={cn(
        "hito-list-row items-start",
        tone === "signal" && "bg-signal/[0.03]",
        muted && "bg-surface/30",
      )}
    >
      <div className="w-full min-w-0">
        <div
          className={cn(
            "mb-3",
            titleVariant === "strong"
              ? "text-sm font-medium tracking-[0.01em] text-foreground/92"
              : "hito-label",
          )}
        >
          {title}
        </div>
        {children}
      </div>
    </section>
  );
}

function NavCard({
  direction,
  date,
  title,
}: {
  direction: "prev" | "next";
  date: string;
  title: string;
}) {
  const formattedDate = formatDate(date, { weekday: "short", month: "short", day: "numeric" });

  return (
    <Link
      to="/workout/$date"
      params={{ date }}
      data-direction={direction === "next" ? "next" : "previous"}
      className="hito-nav-card"
    >
      <div className="hito-nav-card-top">
        {direction === "prev" ? (
          <>
            <span className="hito-nav-card-arrow">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            <span className="hito-nav-card-label">Previous</span>
            <span className="hito-nav-card-date">{formattedDate}</span>
          </>
        ) : (
          <>
            <span className="hito-nav-card-date">{formattedDate}</span>
            <span className="hito-nav-card-label">Next</span>
            <span className="hito-nav-card-arrow">
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </>
        )}
      </div>
      <div className="hito-nav-card-title">{title}</div>
    </Link>
  );
}

function objectiveFor(type: string) {
  switch (type) {
    case "easy":
    case "steady_or_easy":
      return "Easy aerobic work. Keep it conversational and steady.";
    case "long_run":
      return "Long aerobic work. Start easy and let the run settle.";
    case "quality":
      return "Controlled quality work. Keep form ahead of pace.";
    case "rest":
      return "";
    default:
      return "";
  }
}

function coachNoteFor(type: string) {
  if (type === "long_run")
    return "Treat the first third as warmup. If the wind picks up, shelter on the return leg. Stop at 20 min for a sip of water.";
  if (type === "quality")
    return "Warmup until breathing is open. Each rep should feel slightly faster than threshold. Walk the recoveries if needed.";
  return "Eyes soft, jaw loose. Cadence ~175. If anything sharp shows up, end the run early — no quality lost.";
}

function loadFor(workout: Workout) {
  const duration = workoutDuration(workout);
  const multiplier: Record<string, number> = {
    easy: 1.0,
    steady_or_easy: 1.1,
    long_run: 1.4,
    quality: 1.8,
    rest: 0,
  };
  return Math.min(95, Math.round(duration * (multiplier[workout.type] ?? 1) * 0.6)).toString();
}

function restAssignmentFor(workout: Workout) {
  if (workout.type !== "rest") {
    return null;
  }

  const note = workout.notes?.trim() ?? "";

  if (!note || /^(recovery|rest|rest day)$/i.test(note)) {
    return null;
  }

  return note;
}

function weekProgressFor(workouts: Workout[], currentDate: string) {
  const currentWeek = weekOf(workouts, currentDate).filter((workout) => workout.type !== "rest");
  const total = currentWeek.length;
  const completed = currentWeek.filter((workout) => workout.status === "completed").length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    remaining: Math.max(total - completed, 0),
    percent,
  };
}

function resultMetaForStatus(status: Workout["status"]) {
  if (status === "completed") {
    return {
      label: "Completed well",
      icon: Check,
      tone: "success" as const,
    };
  }

  if (status === "partial") {
    return {
      label: "Partial",
      icon: Minus,
      tone: "warn" as const,
    };
  }

  if (status === "skipped") {
    return {
      label: "Skipped",
      icon: X,
      tone: "destructive" as const,
    };
  }

  return null;
}

function skippedExplanationFor(workout: Workout, source: TrainingSnapshot["source"]) {
  if (source !== "persisted") {
    return "This sample status comes from preview logic only.";
  }

  if (workout.log?.outcome === "skipped") {
    return "This skipped result was saved manually and is reflected in the current workout log.";
  }

  return "Past-due workouts without a saved log are treated as skipped until you overwrite them with a real result.";
}

function ResultBadge({
  meta,
  mode,
}: {
  meta: NonNullable<ReturnType<typeof resultMetaForStatus>>;
  mode: "identity" | "sidebar";
}) {
  const Icon = meta.icon;

  return (
    <span
      className={cn("hito-status-pill", mode === "sidebar" && "text-[11px]")}
      data-icon="false"
      data-tone={meta.tone === "warn" ? "warning" : meta.tone}
    >
      <span
        className="hito-status-marker"
        data-size="xs"
        data-tone={meta.tone === "warn" ? "warning" : meta.tone}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      {meta.label}
    </span>
  );
}
