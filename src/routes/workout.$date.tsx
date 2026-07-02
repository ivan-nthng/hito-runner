import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { IntervalsViz } from "@/components/IntervalsViz";
import { CompletionPanel, WorkoutFeedbackPanel } from "@/components/CompletionPanel";
import { ManualWorkoutPersistedEditDialog } from "@/components/manual-workout/ManualWorkoutPersistedEditControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  displayExecutableTargetEntries,
  displayStepTargetReadbackEntries,
  displayTargetSupportEntries,
  displayWorkoutStructureEntries,
  formatPlannedWorkoutBlockSummary,
  formatDistanceKm,
  formatDate,
  formatDurationMin,
  primaryWorkoutTarget,
  repeatChildSteps,
  repeatCountForStep,
  WEEK_STATUS_META,
  type TrainingSnapshot,
  type Workout,
  weekOf,
  workoutPlannedLanguage,
  workoutTypeMeta,
  workoutDistanceKm,
  workoutDuration,
} from "@/lib/training";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getWorkoutRouteData } from "@/lib/training-api";
import type { PlannedWorkoutLanguageBlock } from "@/lib/planned-workout-language";
import type { WorkoutResultFeedbackSummary } from "@/lib/workout-result-import/types";

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
  const router = useRouter();
  const tab = search.tab;

  if (!workout) {
    return (
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="hito-route-gutter max-w-2xl py-20">
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
  const primaryStructureMetrics = isRestDay
    ? []
    : displayWorkoutStructureEntries(workout).slice(0, 2);
  const targetSupportEntries = displayTargetSupportEntries(primaryTarget);
  const executionSummary = workoutExecutionSummary(workout);
  const identityRows = workoutIdentityRows(workout);
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
  const lifecycle = workoutDetailLifecycleFor(workout, snapshot, feedback);
  const surfaceModel = workoutDetailSurfaceModelFor(lifecycle, tab);

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="hito-route-gutter relative max-w-6xl py-8">
        <div className="flex items-center gap-3 hito-section-subtitle">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <Icon name="arrow-left" size="xs" /> Calendar
          </Link>
          <span className="opacity-50">/</span>
          <span>{phase}</span>
        </div>

        <section className="relative mt-5 overflow-hidden border-t border-hairline/80 px-1 pb-3 pt-6 lg:pt-7">
          <div className="hito-workout-hero-grid">
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

        {lifecycle === "future_planned" && (
          <FutureWorkoutActions
            onPlanChanged={() => router.invalidate()}
            snapshot={snapshot}
            workout={workout}
          />
        )}

        {surfaceModel.tabs.length > 1 && (
          <div className="mt-10 flex gap-6 border-b border-hairline/80 pb-3">
            <div className="hito-tab-list hito-tab-list-open">
              {surfaceModel.tabs.map((tabOption) => (
                <button
                  key={tabOption.id}
                  type="button"
                  onClick={() =>
                    navigate({
                      search: (current) => ({
                        ...current,
                        tab: tabOption.id,
                      }),
                      replace: true,
                    })
                  }
                  data-active={surfaceModel.activeSurface === tabOption.id}
                  aria-current={surfaceModel.activeSurface === tabOption.id ? "page" : undefined}
                  className="hito-tab"
                >
                  {tabOption.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="hito-route-support-grid mt-8">
          <div
            className={cn(
              "relative",
              surfaceModel.activeSurface === "complete" && "hito-surface overflow-hidden p-6",
              surfaceModel.activeSurface === "feedback" && "p-1",
            )}
          >
            {surfaceModel.activeSurface === "overview" && (
              <>
                <Overview workout={workout} />
                {lifecycle === "today_planned" && (
                  <CompletionActionPanel workout={workout} variant="today" />
                )}
                {lifecycle === "past_unlogged" && (
                  <CompletionActionPanel workout={workout} variant="past" />
                )}
              </>
            )}
            {surfaceModel.activeSurface === "complete" && (
              <CompletionPanel workout={workout} snapshot={snapshot} feedback={feedback} />
            )}
            {surfaceModel.activeSurface === "feedback" && (
              <WorkoutFeedbackPanel workout={workout} snapshot={snapshot} feedback={feedback} />
            )}
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
                <SidebarSection title="Workout type">
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
                          <span className="hito-readback-value hito-readback-value-compact">
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
      <div className="hito-route-gutter max-w-6xl space-y-8 py-8">
        <div className="flex items-center gap-3 hito-section-subtitle">
          <Skeleton className="h-3 w-32 bg-background/30" />
        </div>
        <div className="hito-workout-hero-grid">
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
        <div className="hito-route-support-grid">
          <Skeleton className="hito-route-panel-skeleton hito-route-panel-skeleton-detail" />
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
      <div className="hito-route-gutter max-w-2xl py-20">
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

type WorkoutDetailLifecycleState =
  | "future_planned"
  | "today_planned"
  | "completed_with_manual_result"
  | "completed_with_evidence"
  | "past_unlogged"
  | "rest_day";

type WorkoutDetailSurface = "overview" | "complete" | "feedback";

type WorkoutDetailSearchTab = "overview" | "complete" | "feedback" | "preview";

function workoutDetailLifecycleFor(
  workout: Workout,
  snapshot: TrainingSnapshot,
  feedback: WorkoutResultFeedbackSummary | null,
): WorkoutDetailLifecycleState {
  if (workout.type === "rest") {
    return "rest_day";
  }

  if (hasWorkoutEvidence(workout, feedback)) {
    return "completed_with_evidence";
  }

  if (
    workout.log ||
    workout.status === "completed" ||
    workout.status === "partial" ||
    (workout.status === "skipped" && Boolean(workout.log))
  ) {
    return "completed_with_manual_result";
  }

  if (workout.status === "today" || workout.date === snapshot.currentDate) {
    return "today_planned";
  }

  if (workout.status === "upcoming" || workout.date > snapshot.currentDate) {
    return "future_planned";
  }

  return "past_unlogged";
}

function hasWorkoutEvidence(
  workout: Workout,
  feedback: WorkoutResultFeedbackSummary | null,
): boolean {
  const markerState = feedback?.marker?.state ?? workout.feedbackMarker?.state ?? null;

  return Boolean(
    markerState === "evidence_attached" ||
    markerState === "feedback_ready" ||
    feedback?.latestAsset ||
    feedback?.latestActualMetrics ||
    feedback?.latestComparison ||
    feedback?.latestAiInsight,
  );
}

function workoutDetailSurfaceModelFor(
  lifecycle: WorkoutDetailLifecycleState,
  requestedTab: WorkoutDetailSearchTab,
): {
  activeSurface: WorkoutDetailSurface;
  tabs: Array<{ id: WorkoutDetailSurface; label: string }>;
} {
  if (lifecycle === "completed_with_evidence") {
    const tabs = [
      { id: "complete", label: "Result" },
      { id: "feedback", label: "Feedback" },
    ] satisfies Array<{ id: WorkoutDetailSurface; label: string }>;

    return {
      activeSurface: requestedTab === "feedback" ? "feedback" : "complete",
      tabs,
    };
  }

  if (lifecycle === "future_planned") {
    return { activeSurface: "overview", tabs: [] };
  }

  if (lifecycle === "completed_with_manual_result") {
    return { activeSurface: "complete", tabs: [] };
  }

  if (lifecycle === "today_planned" || lifecycle === "past_unlogged") {
    return {
      activeSurface: requestedTab === "complete" ? "complete" : "overview",
      tabs: [],
    };
  }

  return { activeSurface: "overview", tabs: [] };
}

function FutureWorkoutActions({
  onPlanChanged,
  snapshot,
  workout,
}: {
  onPlanChanged: () => Promise<void>;
  snapshot: TrainingSnapshot;
  workout: Workout;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const canEdit = canEditWorkoutFromDetail(workout, snapshot);

  if (!canEdit) {
    return null;
  }

  return (
    <section className="mt-6 border-y border-hairline py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="hito-label">Future actions</p>
          <p className="hito-body-small mt-1 text-muted-foreground">
            Edit training uses the backend-reviewed manual constructor. Move stays on the calendar.
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-md"
            onClick={() => setEditOpen(true)}
          >
            <Icon name="edit" size="xs" />
            Edit training
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-md aspect-square p-0 sm:hidden"
              aria-label="Open workout actions"
            >
              <Icon name="more-horizontal" size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="hito-menu-width-standard">
            <DropdownMenuLabel>Workout actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Icon name="edit" size="xs" />
              Edit training
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ManualWorkoutPersistedEditDialog
        activePlanId={snapshot.planMeta?.id}
        onEdited={onPlanChanged}
        onOpenChange={setEditOpen}
        open={editOpen}
        plannedWorkoutId={workout.id}
        title={workout.title}
        workoutDate={workout.date}
      />
    </section>
  );
}

function canEditWorkoutFromDetail(workout: Workout, snapshot: TrainingSnapshot) {
  return Boolean(
    snapshot.source === "persisted" &&
    snapshot.planMeta?.workoutEditing?.editWorkout.allowed &&
    workout.sourceEditing?.eligibility === "eligible_future_unlogged" &&
    workout.type !== "rest" &&
    !workout.log,
  );
}

function CompletionActionPanel({
  workout,
  variant,
}: {
  workout: Workout;
  variant: "today" | "past";
}) {
  const isToday = variant === "today";

  return (
    <section className="hito-row-group mt-8">
      <div className="hito-list-row items-start gap-4">
        <Icon
          name={isToday ? "check-circle" : "calendar-clock"}
          size="sm"
          className={cn("mt-0.5", isToday ? "text-success" : "text-warn")}
        />
        <div className="min-w-0 flex-1">
          <p className="hito-list-row-title">
            {isToday ? "Ready when you finish" : "Not logged yet"}
          </p>
          <p className="hito-list-row-copy">
            {isToday
              ? "Log this workout after you run it. Feedback unlocks after a real result or Garmin evidence exists."
              : "This past workout is treated as unlogged until you add a real result."}
          </p>
        </div>
        <Link
          to="/workout/$date"
          params={{ date: workout.date }}
          search={{ tab: "complete" } as never}
          className="hito-button hito-button-primary hito-button-md shrink-0"
        >
          <Icon name={isToday ? "check" : "edit"} size="xs" />
          {isToday ? "Mark as done" : "Add result"}
        </Link>
      </div>
    </section>
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
        tone === "signal" && "hito-list-row-signal",
        muted && "hito-list-row-muted",
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
      <span className="hito-readback-value">{value}</span>
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

function workoutIdentityRows(workout: Workout): Array<{ label: string; value: string }> {
  const language = workoutPlannedLanguage(workout);
  const blockSummary = formatPlannedWorkoutBlockSummary(language.runnerFacingBlocks);

  return [
    { label: "Type", value: language.runnerFacingWorkoutTypeLabel },
    blockSummary ? { label: "Blocks", value: blockSummary } : null,
  ].filter((row): row is { label: string; value: string } => row != null);
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
  const languageBlocks = workoutPlannedLanguage(workout).runnerFacingBlocks;
  const readbacks = workout.steps.flatMap((step, stepIndex) =>
    segmentInstructionReadbacksForStep(
      step,
      workout.metricMode,
      `${stepIndex}`,
      stepIndex + 1,
      languageBlocks[stepIndex],
    ),
  );

  return readbacks.map((readback, index) => ({ ...readback, index: index + 1 }));
}

function segmentInstructionReadbacksForStep(
  step: Workout["steps"][number],
  metricMode: Workout["metricMode"],
  key: string,
  displayIndex: number,
  languageBlock?: PlannedWorkoutLanguageBlock,
): SegmentInstructionReadback[] {
  const repeatCount = repeatCountForStep(step);
  const repeatChildren = repeatChildSteps(step);

  if (repeatCount && repeatChildren.length > 0) {
    const parent = buildSegmentInstructionReadback(
      step,
      metricMode,
      key,
      displayIndex,
      languageBlock,
    );
    const children = repeatChildren
      .map((child, index) =>
        buildSegmentInstructionReadback(
          child,
          metricMode,
          `${key}-child-${index + 1}`,
          displayIndex,
          repeatChildLanguage(languageBlock, index),
        ),
      )
      .filter((item): item is SegmentInstructionReadback => item != null);

    return [parent, ...children].filter((item): item is SegmentInstructionReadback => item != null);
  }

  const readback = buildSegmentInstructionReadback(
    step,
    metricMode,
    key,
    displayIndex,
    languageBlock,
  );

  return readback ? [readback] : [];
}

function buildSegmentInstructionReadback(
  step: Workout["steps"][number],
  metricMode: Workout["metricMode"],
  key: string,
  displayIndex: number,
  languageBlock?: PlannedWorkoutLanguageBlock | null,
): SegmentInstructionReadback | null {
  const entries = dedupeReadbackEntries(
    [
      ...displayStepTargetReadbackEntries(step, metricMode, {
        includeStructureWithTargets: true,
      }).map((entry) => ({
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
    label:
      languageBlock?.label ||
      step.label?.trim() ||
      humanizeSnakeCase(step.segment_type || step.type || "Segment"),
    entries,
  };
}

function repeatChildLanguage(block: PlannedWorkoutLanguageBlock | undefined, index: number) {
  if (!block?.children.length) {
    return null;
  }

  return block.children[index] ?? null;
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
