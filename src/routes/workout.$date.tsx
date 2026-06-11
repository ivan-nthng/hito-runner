import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { IntervalsViz } from "@/components/IntervalsViz";
import { CompletionPanel, WorkoutFeedbackPanel } from "@/components/CompletionPanel";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  displayExecutableTargetEntries,
  displayStepStructureEntries,
  displayTargetSupportEntries,
  displayWorkoutStructureEntries,
  formatDistanceKm,
  formatDate,
  formatDurationMin,
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
  const primaryTargetMetrics = displayExecutableTargetEntries(primaryTarget, workout.metricMode);
  const structureOnly = workout.metricMode.executableMode === "structure_only_executable";
  const primaryStructureMetrics =
    primaryTargetMetrics.length === 0 && structureOnly
      ? displayWorkoutStructureEntries(workout).slice(0, 2)
      : [];
  const targetSupportEntries = displayTargetSupportEntries(primaryTarget);
  const executionSummary = workoutExecutionSummary(workout);
  const identityRows = workoutIdentityRows(workout, meta.label);
  const goalRows = workoutGoalRows(workout);
  const metricRows = workoutMetricRows(workout);
  const phase = `${workout.phase} · week ${workout.week}`;
  const heroMetrics = isRestDay
    ? []
    : [
        km != null ? { label: "Distance", value: formatDistanceKm(km), unit: "km" } : null,
        duration > 0 ? { label: "Duration", value: formatDurationMin(duration) } : null,
        duration > 0 ? { label: "Load", value: loadFor(workout) } : null,
      ].filter((metric): metric is { label: string; value: string; unit?: string } =>
        Boolean(metric),
      );

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="relative max-w-6xl px-6 py-8 lg:px-10">
        <div className="flex items-center gap-3 hito-section-subtitle">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <Icon name="arrow-left" size="xs" /> Calendar
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
              {!isRestDay && workout.notes?.trim() && (
                <p className="hito-support-copy mt-4 max-w-xl">{workout.notes.trim()}</p>
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
                  <span className="hito-tab-badge" data-variant="text">
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
              (tab === "complete" || tab === "preview") && "hito-surface overflow-hidden p-6",
              tab === "feedback" && "p-1",
            )}
          >
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

              {!isRestDay && (
                <SidebarSection title="Workout identity">
                  <div className="space-y-3">
                    {identityRows.map((row) => (
                      <ReadbackRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>
                </SidebarSection>
              )}

              {!isRestDay &&
                (executionSummary ||
                  primaryTargetMetrics.length > 0 ||
                  primaryStructureMetrics.length > 0 ||
                  targetSupportEntries.length > 0) && (
                  <SidebarSection title="Execution" tone="signal" titleVariant="strong">
                    <div className="space-y-3">
                      {executionSummary && <ReadbackRow label="Mode" value={executionSummary} />}

                      {[...primaryTargetMetrics, ...primaryStructureMetrics].map((entry) => (
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

              {!isRestDay && metricRows.length > 0 && (
                <SidebarSection title="Metric mode" muted>
                  <div className="space-y-3">
                    {metricRows.map((row) => (
                      <ReadbackRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>
                </SidebarSection>
              )}

              {!isRestDay && goalRows.length > 0 && (
                <SidebarSection title="Goal context" muted>
                  <div className="space-y-3">
                    {goalRows.map((row) => (
                      <ReadbackRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>
                </SidebarSection>
              )}

              {isRestDay && restAssignment && (
                <SidebarSection title="Assignment" muted>
                  <p className="text-xs leading-relaxed text-foreground/80">{restAssignment}</p>
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
                    className="h-full rounded-full bg-signal"
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
                  <Icon name="calendar-clock" size="xs" className="mt-0.5 text-signal" />
                  <p className="hito-body-small">
                    {snapshot.source === "persisted"
                      ? `${APP_NAME} keeps the same layout here while your plan, results, and week status come from saved data.`
                      : `You're viewing the preview. Results and plan changes are not saved here yet.`}
                  </p>
                </div>
              </SidebarSection>

              {status === "skipped" && (
                <SidebarSection title="Skipped">
                  <div className="flex items-start gap-2">
                    <Icon name="shield-alert" size="xs" className="mt-0.5 text-destructive" />
                    <p className="hito-body-small">
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
  const segmentReadbacks = segmentInstructionReadbacks(workout);

  if (workout.type === "rest") {
    return (
      <section className="flex min-h-[220px] flex-col border-t border-hairline pt-6">
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
            <div className="h-8 w-8 rounded-full border border-hairline bg-background/25" />
            <div className="h-12 w-12 rounded-full border border-hairline bg-background/20" />
            <div className="h-6 w-6 rounded-full border border-hairline bg-background/25" />
          </div>
        </div>

        {restAssignment && (
          <div className="mt-auto border-t border-hairline pt-5">
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
        <h3 className="hito-label">Segment instructions</h3>
        {segmentReadbacks.length > 0 ? (
          <ol className="hito-row-group mt-4">
            {segmentReadbacks.map((segment) => (
              <li key={segment.key} className="hito-list-row items-start gap-4">
                <span className="hito-caption w-6 shrink-0 text-right font-mono-num">
                  {String(segment.index).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="hito-list-row-title">{segment.label}</div>
                  <div className="mt-2 space-y-2">
                    {segment.entries.map((entry) => (
                      <div key={`${segment.key}-${entry.label}`}>
                        <p className="hito-section-subtitle">{entry.label}</p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                          {entry.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="hito-support-copy mt-4 max-w-xl">
            No extra execution notes were provided for this workout. Follow the listed structure and
            any targets shown above.
          </p>
        )}
      </div>
    </div>
  );
}

function PreviewPanel() {
  return (
    <div className="hito-surface-flat border-dashed p-8 text-center">
      <Icon name="plan-note" size="lg" className="mx-auto text-signal" strokeWidth={1.4} />
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

function ReadbackRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="hito-section-subtitle">{label}</span>
      <span className="max-w-[12rem] text-right text-xs leading-relaxed text-foreground/85">
        {value}
      </span>
    </div>
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
              <Icon name="arrow-left" size="xs" />
            </span>
            <span className="hito-nav-card-label">Previous</span>
            <span className="hito-nav-card-date">{formattedDate}</span>
          </>
        ) : (
          <>
            <span className="hito-nav-card-date">{formattedDate}</span>
            <span className="hito-nav-card-label">Next</span>
            <span className="hito-nav-card-arrow">
              <Icon name="chevron-right" size="xs" />
            </span>
          </>
        )}
      </div>
      <div className="hito-nav-card-title">{title}</div>
    </Link>
  );
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

function workoutIdentityRows(
  workout: Workout,
  familyLabel: string,
): Array<{ label: string; value: string }> {
  return [
    { label: "Family", value: familyLabel },
    { label: "Identity", value: humanizeSnakeCase(workout.workoutIdentity) },
    { label: "Calendar icon", value: humanizeSnakeCase(workout.calendarIconKey) },
  ];
}

function workoutGoalRows(workout: Workout): Array<{ label: string; value: string }> {
  const goal = workout.goalContext;

  if (!goal) {
    return [];
  }

  return [
    goal.goalType ? { label: "Goal", value: humanizeSnakeCase(goal.goalType) } : null,
    goal.goalStyle ? { label: "Style", value: humanizeSnakeCase(goal.goalStyle) } : null,
    goal.terrainFocus ? { label: "Terrain", value: humanizeSnakeCase(goal.terrainFocus) } : null,
    goal.targetDate ? { label: "Target date", value: goal.targetDate } : null,
    goal.targetTime ? { label: "Target time", value: goal.targetTime } : null,
  ].filter((row): row is { label: string; value: string } => row != null);
}

function workoutMetricRows(workout: Workout): Array<{ label: string; value: string }> {
  const metricMode = workout.metricMode;

  if (!metricMode) {
    return [];
  }

  return [
    { label: "Executable mode", value: humanizeSnakeCase(metricMode.executableMode) },
    { label: "Guidance", value: humanizeSnakeCase(metricMode.guidance) },
    {
      label: "Pace targets",
      value: metricMode.paceTargetsAllowed ? "Backend supplied" : "Not supplied",
    },
    {
      label: "HR targets",
      value: metricMode.hrTargetsAllowed
        ? "Personal zones supplied"
        : metricMode.hrTargetSource === "default_estimated_hr"
          ? "Advisory only"
          : "Not supplied",
    },
    metricMode.hrTargetLabel ? { label: "HR readback", value: metricMode.hrTargetLabel } : null,
    metricMode.hrTargetSourceNote
      ? { label: "HR note", value: metricMode.hrTargetSourceNote }
      : null,
    metricMode.reason ? { label: "Reason", value: metricMode.reason } : null,
  ].filter((row): row is { label: string; value: string } => row != null);
}

function workoutExecutionSummary(workout: Workout): string | null {
  switch (workout.metricMode.executableMode) {
    case "pace_executable":
      return "Pace executable";
    case "hr_executable":
      return "Personal HR executable";
    case "mixed_metric_executable":
      return "Pace + personal HR executable";
    case "structure_only_executable":
      return "Executable structure";
    case "correction_required":
      return "Correction required";
    case "effort_only":
      return "Readable guidance only";
    case "none":
      return "No execution targets";
    case "unknown":
      return "Unknown";
    default:
      return null;
  }
}

type SegmentInstructionReadback = {
  key: string;
  index: number;
  label: string;
  entries: Array<{ label: string; value: string }>;
};

function segmentInstructionReadbacks(workout: Workout): SegmentInstructionReadback[] {
  const readbacks = workout.steps.flatMap((step, stepIndex) =>
    segmentInstructionReadbacksForStep(step, workout.metricMode, `${stepIndex}`, stepIndex + 1),
  );

  return readbacks.map((readback, index) => ({ ...readback, index: index + 1 }));
}

function segmentInstructionReadbacksForStep(
  step: Workout["steps"][number],
  metricMode: Workout["metricMode"],
  key: string,
  displayIndex: number,
): SegmentInstructionReadback[] {
  if (step.repeats && step.work) {
    const parent = buildSegmentInstructionReadback(step, metricMode, key, displayIndex);
    const children = [
      buildSegmentInstructionReadback(step.work, metricMode, `${key}-work`, displayIndex),
      step.recovery
        ? buildSegmentInstructionReadback(
            step.recovery,
            metricMode,
            `${key}-recovery`,
            displayIndex,
          )
        : null,
    ].filter((item): item is SegmentInstructionReadback => item != null);

    return [parent, ...children].filter((item): item is SegmentInstructionReadback => item != null);
  }

  const readback = buildSegmentInstructionReadback(step, metricMode, key, displayIndex);

  return readback ? [readback] : [];
}

function buildSegmentInstructionReadback(
  step: Workout["steps"][number],
  metricMode: Workout["metricMode"],
  key: string,
  displayIndex: number,
): SegmentInstructionReadback | null {
  const entries = dedupeReadbackEntries(
    [
      ...displayStepStructureEntries(step).map((entry) => ({
        label: entry.label,
        value: entry.value,
      })),
      ...displayExecutableTargetEntries(step.target, metricMode).map((entry) => ({
        label: entry.label,
        value: entry.value,
      })),
      readGuidanceEntry("Guidance", step.guidance),
      ...displayTargetSupportEntries(step.target).map((entry) => ({
        label: entry.label,
        value: entry.value,
      })),
    ].filter((entry): entry is { label: string; value: string } => entry != null),
  );

  if (entries.length === 0) {
    return null;
  }

  return {
    key,
    index: displayIndex,
    label: step.label?.trim() || humanizeSnakeCase(step.segment_type || step.type || "Segment"),
    entries,
  };
}

function dedupeReadbackEntries(entries: Array<{ label: string; value: string }>) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = `${entry.label}:${entry.value}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function readGuidanceEntry(label: string, value: unknown) {
  const normalized = readGuidanceText(value);

  return normalized ? { label, value: normalized } : null;
}

function readGuidanceText(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();

    return normalized || null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const nested = (value as { guidance?: unknown }).guidance;

  return typeof nested === "string" && nested.trim() ? nested.trim() : null;
}

function humanizeSnakeCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
      icon: "check",
      tone: "success" as const,
    };
  }

  if (status === "partial") {
    return {
      label: "Partial",
      icon: "minus",
      tone: "warn" as const,
    };
  }

  if (status === "skipped") {
    return {
      label: "Skipped",
      icon: "close",
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
  return (
    <span
      className="hito-status-pill"
      data-icon="false"
      data-tone={meta.tone === "warn" ? "warning" : meta.tone}
    >
      <span
        className="hito-status-marker"
        data-size="xs"
        data-tone={meta.tone === "warn" ? "warning" : meta.tone}
      >
        <Icon name={meta.icon} size="xs" strokeWidth={2.2} />
      </span>
      {meta.label}
    </span>
  );
}
