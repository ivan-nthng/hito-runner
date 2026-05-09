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
import { CompletionPanel } from "@/components/CompletionPanel";
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
      search.tab === "complete" || search.tab === "preview" || search.tab === "overview"
        ? search.tab
        : "overview",
  }),
  head: () => ({
    meta: [
      { title: `Workout — ${APP_NAME}` },
      {
        name: "description",
        content: "Review a preserved workout-detail shell and log real or preview workout results.",
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
  const { workout, snapshot, viewer, prev, next } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab = search.tab;

  if (!workout) {
    return (
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="px-6 lg:px-10 py-20 max-w-2xl">
          {snapshot.mode === "onboarding" ? (
            <>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Setup required
              </p>
              <h1 className="mt-3 font-display text-4xl">Finish setup before opening workouts.</h1>
              <p className="mt-4 text-sm text-muted-foreground">
                The saved workout detail route exists only after a persisted runner profile and
                active plan cycle are created.
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                No workout
              </p>
              <h1 className="mt-3 font-display text-4xl">Nothing is scheduled for this day.</h1>
              <p className="mt-4 text-sm text-muted-foreground">
                This date does not have a workout in the current {snapshot.source} plan view. Go
                back to the weekly plan and choose another day.
              </p>
            </>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex text-sm text-signal underline-offset-4 hover:underline"
            >
              Back to weekly plan
            </Link>
          </div>
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
  const phase = `${workout.phase} · week ${workout.week}`;

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="relative max-w-6xl px-6 py-8 lg:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,rgba(209,161,69,0.14),transparent_48%),radial-gradient(circle_at_top_right,rgba(122,162,247,0.12),transparent_44%),radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_62%)]" />
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Calendar
          </Link>
          <span className="opacity-50">/</span>
          <span>{phase}</span>
        </div>

        <section className="relative mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(18,24,31,0.94),rgba(27,34,43,0.78))] px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] lg:px-8 lg:py-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="absolute -right-16 top-0 h-32 w-32 rounded-full bg-signal/10 blur-3xl" />
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
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
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {objectiveFor(workout.type)}
                </p>
              )}
            </div>

            {!isRestDay && (
              <div className="grid grid-cols-3 gap-3 sm:flex sm:gap-6">
                <Stat label="Distance" value={km != null ? formatDistanceKm(km) : "—"} unit="km" />
                <Stat label="Duration" value={duration ? duration.toString() : "—"} unit="min" />
                <Stat label="Load" value={loadFor(workout)} unit="" />
              </div>
            )}
          </div>
        </section>

        <div className="mt-10 border-b border-hairline flex gap-6">
          {(
            [
              { v: "overview", l: "Overview" },
              { v: "complete", l: "Log result" },
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
              className={cn(
                "py-3 text-sm border-b-2 transition-colors -mb-px",
                tab === tabOption.v
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tabOption.l}
              {tabOption.v === "preview" && (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-signal">later</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-10">
          <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(150deg,rgba(16,22,28,0.86),rgba(29,36,46,0.7))] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {tab === "overview" && <Overview workout={workout} />}
            {tab === "complete" && <CompletionPanel workout={workout} snapshot={snapshot} />}
            {tab === "preview" && <PreviewPanel />}
          </div>

          <aside>
            <SidebarPanel>
              {resultMeta && (
                <SidebarSection title="Result state">
                  <div className="flex items-center justify-between gap-3">
                    <ResultBadge meta={resultMeta} mode="sidebar" />
                    <span className="text-xs text-muted-foreground">
                      {snapshot.source === "persisted" ? "Saved truth" : "Preview state"}
                    </span>
                  </div>
                </SidebarSection>
              )}

              {!isRestDay && primaryTarget && (
                <SidebarSection title="Targets" tone="signal">
                  {displayTargetEntries(primaryTarget).map((entry) => (
                    <div key={entry.key} className="flex justify-between gap-3 py-1 last:border-0">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {entry.label}
                      </span>
                      <span className="text-xs text-right text-foreground/85">{entry.value}</span>
                    </div>
                  ))}
                </SidebarSection>
              )}

              {(!isRestDay || restAssignment) && (
                <SidebarSection title={isRestDay ? "Assignment" : "Workout note"} muted>
                  <p className="text-xs leading-relaxed text-foreground/80">
                    {isRestDay ? restAssignment : coachNoteFor(workout.type)}
                  </p>
                </SidebarSection>
              )}

              <SidebarSection title="Week Status">
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
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <span>{weekStatus.label}</span>
                  <span>{weekProgress.remaining} left</span>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">{weekStatus.helper}</p>
              </SidebarSection>

              <SidebarSection title="Preview boundary" tone="signal">
                <div className="flex items-start gap-2">
                  <CalendarClock className="mt-0.5 h-3.5 w-3.5 text-signal" />
                  <p className="text-xs leading-relaxed text-foreground/80">
                    {snapshot.source === "persisted"
                      ? `${APP_NAME} keeps this shell while plan, logs, and week status now come from saved truth.`
                      : `${APP_NAME} keeps this shell in preview mode only. Real logging and plan updates are not wired here yet.`}
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
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
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
        <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 lg:p-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-destructive">
            Workout unavailable
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05]">
            We couldn&apos;t load this workout.
          </h1>
          <p className="mt-4 text-sm text-foreground/85 leading-relaxed">
            Try again to reopen the latest workout detail from preview or saved mode. If the plan is
            still being set up, return home first.
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
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Recovery day
              </p>
              <h3 className="mt-2 font-display text-3xl">Keep it light.</h3>
            </div>
            <div className="flex items-end gap-2 opacity-70">
              <div className="h-8 w-8 rounded-full border border-hairline bg-background/60" />
              <div className="h-12 w-12 rounded-full border border-hairline bg-background/50" />
              <div className="h-6 w-6 rounded-full border border-hairline bg-background/70" />
            </div>
          </div>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            No distance, duration, or load is scheduled here. Let the day stay open unless a real
            recovery assignment is present.
          </p>
        </section>

        {restAssignment && (
          <section className="rounded-xl border border-hairline bg-background/35 p-4">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Assignment
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{restAssignment}</p>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <IntervalsViz workout={workout} />

      <div>
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Execution cues
        </h3>
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
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Fueling & recovery
        </h3>
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
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">{item.t}</div>
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
    <div className="rounded-xl border border-dashed border-hairline p-10 text-center">
      <NotebookPen className="h-6 w-6 mx-auto text-signal" strokeWidth={1.4} />
      <h3 className="mt-4 font-display text-2xl">This panel stays as a preview shell</h3>
      <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
        It preserves the imported tab structure without pretending that analysis, external data
        ingest, or plan rewriting are already live.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="h-1 w-1 rounded-full bg-signal" />
        Later surface · not connected yet
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1 justify-end">
        <span className="font-display text-3xl leading-none">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function SidebarPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(160deg,rgba(16,21,28,0.92),rgba(28,34,42,0.72))] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      {children}
    </div>
  );
}

function SidebarSection({
  title,
  children,
  tone,
  muted,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "signal";
  muted?: boolean;
}) {
  return (
    <section
      className={cn(
        "border-t border-white/8 px-4 py-4 first:border-t-0",
        tone === "signal" && "bg-signal/[0.03]",
        muted && "bg-surface/30",
      )}
    >
      <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </div>
      {children}
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
  return (
    <Link
      to="/workout/$date"
      params={{ date }}
      className={cn(
        "group rounded-xl bg-[linear-gradient(150deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-sm transition-colors hover:bg-[linear-gradient(150deg,rgba(255,255,255,0.18),rgba(255,255,255,0.1))]",
        direction === "next" ? "text-right" : "",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5 justify-between">
        {direction === "prev" ? (
          <>
            <ArrowLeft className="h-3 w-3" /> Previous
          </>
        ) : (
          <>
            Next <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="font-mono-num">
          {formatDate(date, { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="mt-2 text-sm">{title}</div>
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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]",
        meta.tone === "success" && "border-success/30 bg-success/12 text-success",
        meta.tone === "warn" && "border-warn/30 bg-warn/12 text-warn",
        meta.tone === "destructive" && "border-destructive/30 bg-destructive/12 text-destructive",
        mode === "sidebar" && "text-[11px]",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {meta.label}
    </span>
  );
}
