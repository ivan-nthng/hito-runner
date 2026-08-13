import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  workoutStructureTimelineItems,
  workoutStructureTimelineSummary,
} from "@/components/workout-structure/workout-structure-timeline-items";
import { CompletionPanel, WorkoutFeedbackPanel } from "@/components/CompletionPanel";
import { WorkoutActivityFileDialog } from "@/components/workout-completion/WorkoutActivityFileDialog";
import { ManualWorkoutPersistedEditDialog } from "@/components/manual-workout/ManualWorkoutPersistedEditControls";
import { ManualWorkoutDocumentPreview } from "@/components/manual-workout/ManualWorkoutDocumentPreview";
import { workoutDocumentSectionsToManualReadbackEntries } from "@/components/manual-workout/ManualWorkoutTrainingBlockGrammar.model";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_WORKOUT_TEMPLATE_KEY_VALUES,
} from "@/lib/manual-workout-authoring/schema";
import { WorkoutDocumentReadback } from "@/components/workout-structure/WorkoutDocumentReadback";
import { workoutDocumentNotesForSteps } from "@/components/workout-structure/workout-document-notes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HitoButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  displayExecutableTargetEntries,
  displayWorkoutStructureEntries,
  formatPlannedWorkoutBlockSummary,
  formatDistanceKm,
  formatDate,
  formatDurationMin,
  primaryWorkoutTarget,
  WEEK_STATUS_META,
  type TrainingSnapshot,
  type Workout,
  weekOf,
  workoutPlannedLanguage,
  workoutTypeMeta,
  workoutDistanceKm,
  workoutStructureDuration,
} from "@/lib/training";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getWorkoutRouteData } from "@/lib/training-api";
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
  const { workout, snapshot, viewer, prev, next, feedback, localActivityFileDesignFixtureEnabled } =
    Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const [activityFileDialogOpen, setActivityFileDialogOpen] = useState(false);
  const tab = search.tab as WorkoutDetailSearchTab;
  const hasFitCompletion = workout?.completionOrigin === "fit_activity";
  const hasReviewFeedback = hasFitCompletion && hasWorkoutReviewReadback(feedback);
  const lifecycle = workout
    ? workoutDetailLifecycleFor(workout, snapshot, hasReviewFeedback)
    : "rest_day";
  const surfaceModel = workoutDetailSurfaceModelFor(lifecycle, tab, hasReviewFeedback);
  const workoutTabs = useHitoTabs({
    items: surfaceModel.tabs.map((item) => ({ value: item.id })),
    value: surfaceModel.activeSurface,
  });

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
                <p className="hito-label-md text-foreground">Setup required</p>
                <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
                  Finish setup before opening workouts.
                </h1>
                <p className="hito-body-md mt-4 max-w-[40rem] text-secondary">
                  Create your plan first, then your workouts will open here.
                </p>
              </>
            ) : (
              <>
                <p className="hito-label-md text-foreground">No workout</p>
                <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
                  Nothing is scheduled for this day.
                </h1>
                <p className="hito-body-md mt-4 max-w-[40rem] text-secondary">
                  There is no workout on this date in the current plan. Go back and choose another
                  day.
                </p>
              </>
            )}
            <div className="hito-state-actions">
              <HitoButton asChild size="lg" variant="primary">
                <Link to="/">Back to weekly plan</Link>
              </HitoButton>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  const meta = workoutTypeMeta(workout);
  const km = workoutDistanceKm(workout);
  const structureDuration = workoutStructureDuration(workout);
  const status = workout.status;
  const isRestDay = workout.type === "rest";
  const restAssignment = restAssignmentFor(workout);
  const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];
  const resultMeta = resultMetaForStatus(status);
  const skippedCopy = skippedExplanationFor(workout, snapshot.source);
  const weekProgress = weekProgressFor(snapshot.workouts, snapshot.currentDate);
  const primaryTarget = primaryWorkoutTarget(workout);
  const primaryTargetMetrics = workoutSidebarTargetRows(workout, primaryTarget);
  const primaryStructureMetrics = isRestDay ? [] : workoutSidebarExecutionRows(workout);
  const identityRows = workoutIdentityRows(workout);
  const phaseLabel = humanizeSnakeCase(workout.phase);
  const weekLabel = `Week ${workout.week}`;
  const heroMetrics = isRestDay
    ? []
    : [
        km != null ? { label: "Distance", value: formatDistanceKm(km), unit: "km" } : null,
        structureDuration > 0
          ? { label: "Duration", value: formatDurationMin(structureDuration) }
          : null,
      ].filter((metric): metric is { label: string; value: string; unit?: string } =>
        Boolean(metric),
      );
  const canEditWorkout = Boolean(
    snapshot.source === "persisted" &&
    workout.type !== "rest" &&
    snapshot.planMeta?.workoutEditing?.editWorkout.allowed &&
    workout.sourceEditing?.canEditContent,
  );

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="hito-route-gutter relative max-w-6xl pb-8 pt-2">
        <WorkoutDetailTopBar
          canEdit={canEditWorkout}
          onPlanChanged={() => router.invalidate()}
          snapshot={snapshot}
          workout={workout}
        />

        <section className="relative mt-5 overflow-hidden px-1 pb-3 pt-2 lg:pt-3">
          <div className="hito-workout-hero-grid">
            <div>
              <div className="hito-technical-sm text-secondary flex flex-wrap items-center gap-2.5">
                {resultMeta ? (
                  <ResultBadge meta={resultMeta} mode="identity" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                )}
                <span style={{ color: meta.content }}>{meta.label}</span>
                <span className="opacity-50">·</span>
                <span className="text-muted-foreground">
                  {formatDate(workout.date, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="opacity-50">·</span>
                <span>{phaseLabel}</span>
                <span className="opacity-50">·</span>
                <span>{weekLabel}</span>
                {workout.date === snapshot.currentDate && (
                  <span className="text-signal">· Today</span>
                )}
              </div>
              <h1 className="hito-ui-title-lg mt-3 max-w-2xl text-foreground">
                {isRestDay ? "Rest day" : workout.title}
              </h1>
              {!isRestDay && workout.notes?.trim() && (
                <p className="hito-body-md text-secondary mt-4 max-w-xl">{workout.notes.trim()}</p>
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

        {surfaceModel.tabs.length > 1 && (
          <div className="mt-10 flex gap-6 border-b border-hairline/80 pb-3">
            <div
              className="hito-tab-list hito-tab-list-open"
              {...workoutTabs.tabListProps}
              aria-label="Workout detail view"
            >
              {surfaceModel.tabs.map((tabOption) => (
                <button
                  key={tabOption.id}
                  type="button"
                  {...workoutTabs.getTabProps(tabOption.id)}
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
              surfaceModel.activeSurface === "complete" && "overflow-hidden p-1",
              surfaceModel.activeSurface === "feedback" && "p-1",
            )}
            {...(surfaceModel.tabs.length > 1
              ? workoutTabs.getPanelProps(surfaceModel.activeSurface)
              : {})}
          >
            {surfaceModel.activeSurface === "overview" && (
              <>
                <Overview snapshot={snapshot} workout={workout} />
                {lifecycle === "today_planned" && (
                  <CompletionActionPanel
                    snapshot={snapshot}
                    workout={workout}
                    variant="today"
                    onOpenActivityFile={() => setActivityFileDialogOpen(true)}
                  />
                )}
                {lifecycle === "past_unlogged" && (
                  <CompletionActionPanel
                    snapshot={snapshot}
                    workout={workout}
                    variant="past"
                    onOpenActivityFile={() => setActivityFileDialogOpen(true)}
                  />
                )}
              </>
            )}
            {surfaceModel.activeSurface === "complete" && (
              <CompletionPanel
                workout={workout}
                snapshot={snapshot}
                feedback={feedback}
                onOpenActivityFile={
                  canOpenGarminFeedback(workout, snapshot)
                    ? () => setActivityFileDialogOpen(true)
                    : undefined
                }
              />
            )}
            {surfaceModel.activeSurface === "feedback" && (
              <WorkoutFeedbackPanel
                workout={workout}
                snapshot={snapshot}
                feedback={feedback}
                localActivityFileDesignFixtureEnabled={localActivityFileDesignFixtureEnabled}
              />
            )}
          </div>

          <aside>
            <SidebarPanel>
              {resultMeta && (
                <SidebarSection
                  title={hasReviewFeedback || hasFitCompletion ? "Result" : "Saved result"}
                >
                  <div className="flex items-center justify-between gap-3">
                    <ResultBadge meta={resultMeta} mode="sidebar" />
                    <span className="text-xs text-muted-foreground">
                      {hasFitCompletion
                        ? "Activity file"
                        : snapshot.source === "persisted"
                          ? "Saved"
                          : "Preview"}
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
                (primaryTargetMetrics.length > 0 || primaryStructureMetrics.length > 0) && (
                  <SidebarSection title="Execution" tone="signal" titleVariant="strong">
                    <div className="space-y-3">
                      {primaryStructureMetrics.map((entry) => (
                        <div
                          key={entry.key}
                          className="flex items-start justify-between gap-3 py-1 last:border-0"
                        >
                          <span className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">
                            {entry.label}
                          </span>
                          <span className="hito-readback-value hito-readback-value-compact">
                            {entry.value}
                          </span>
                        </div>
                      ))}

                      <div className="border-t border-hairline pt-4">
                        {primaryTargetMetrics.length > 0 ? (
                          <div className="space-y-3">
                            {primaryTargetMetrics.map((entry) => (
                              <div
                                key={entry.key}
                                className="flex items-start justify-between gap-3 py-1 last:border-0"
                              >
                                <span className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">
                                  {entry.label}
                                </span>
                                <span className="hito-readback-value hito-readback-value-compact">
                                  {entry.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="hito-body-xs text-tertiary">
                            No reliable pace or heart-rate target is supplied for this workout.
                          </p>
                        )}
                      </div>
                    </div>
                  </SidebarSection>
                )}

              {!isRestDay &&
                primaryStructureMetrics.length === 0 &&
                primaryTargetMetrics.length === 0 && (
                  <SidebarSection title="Execution" tone="signal" titleVariant="strong">
                    <p className="hito-body-xs text-tertiary">
                      No reliable pace or heart-rate target is supplied for this workout.
                    </p>
                  </SidebarSection>
                )}

              {status === "skipped" && (
                <SidebarSection title="Skipped">
                  <div className="flex items-start gap-2">
                    <Icon name="shield-alert" size="xs" className="mt-0.5 text-destructive" />
                    <p className="hito-body-sm text-secondary">
                      {snapshot.source === "persisted"
                        ? skippedCopy
                        : "This sample status comes from preview logic only."}
                    </p>
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
                <div className="mt-3 flex items-center justify-between gap-3 hito-body-xs text-tertiary">
                  <span>{weekStatus.label}</span>
                  <span>{weekProgress.remaining} left</span>
                </div>
              </SidebarSection>
            </SidebarPanel>
          </aside>
        </div>

        <WorkoutActivityFileDialog
          feedback={feedback}
          localActivityFileDesignFixtureEnabled={localActivityFileDesignFixtureEnabled}
          onOpenChange={setActivityFileDialogOpen}
          open={activityFileDialogOpen}
          snapshot={snapshot}
          workout={workout}
        />

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
        <div className="flex items-center gap-3 hito-label-sm uppercase tracking-[0.18em] text-tertiary">
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="hito-workout-hero-grid">
          <div>
            <Skeleton className="h-4 w-64" />
            <Skeleton className="mt-4 h-16 w-full max-w-2xl" />
            <Skeleton className="mt-4 h-5 w-full max-w-xl" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-16 w-24" />
            <Skeleton className="h-16 w-24" />
            <Skeleton className="h-16 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-72" />
        <div className="hito-route-support-grid">
          <Skeleton className="hito-route-panel-skeleton hito-route-panel-skeleton-detail" />
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
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
          <p className="hito-label-md text-destructive">Workout unavailable</p>
          <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
            We couldn&apos;t load this workout.
          </h1>
          <p className="hito-body-md mt-4 max-w-[40rem] text-foreground/85">
            Try again. If your plan is still being set up, go back home first.
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
  hasReviewFeedback: boolean,
): WorkoutDetailLifecycleState {
  if (workout.type === "rest") {
    return "rest_day";
  }

  if (hasReviewFeedback) {
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

function hasWorkoutReviewReadback(feedback: WorkoutResultFeedbackSummary | null): boolean {
  return Boolean(feedback?.latestActualMetrics && feedback?.latestComparison);
}

function workoutDetailSurfaceModelFor(
  lifecycle: WorkoutDetailLifecycleState,
  requestedTab: WorkoutDetailSearchTab,
  hasReviewFeedback: boolean,
): {
  activeSurface: WorkoutDetailSurface;
  tabs: Array<{ id: WorkoutDetailSurface; label: string }>;
} {
  if (lifecycle === "completed_with_evidence" || lifecycle === "completed_with_manual_result") {
    const tabs: Array<{ id: WorkoutDetailSurface; label: string }> = [
      { id: "complete", label: "Result" },
    ];

    if (hasReviewFeedback) {
      tabs.push({ id: "feedback", label: "Feedback" });
    }

    return {
      activeSurface: requestedTab === "feedback" && hasReviewFeedback ? "feedback" : "complete",
      tabs,
    };
  }

  if (lifecycle === "future_planned") {
    return { activeSurface: "overview", tabs: [] };
  }

  if (lifecycle === "today_planned" || lifecycle === "past_unlogged") {
    return {
      activeSurface:
        requestedTab === "feedback" && hasReviewFeedback
          ? "feedback"
          : requestedTab === "complete"
            ? "complete"
            : "overview",
      tabs: [],
    };
  }

  return { activeSurface: "overview", tabs: [] };
}

function canOpenGarminFeedback(workout: Workout, snapshot: TrainingSnapshot): boolean {
  return (
    snapshot.source === "persisted" &&
    workout.type !== "rest" &&
    workout.date <= snapshot.currentDate
  );
}

function WorkoutDetailTopBar({
  canEdit,
  onPlanChanged,
  snapshot,
  workout,
}: {
  canEdit: boolean;
  onPlanChanged: () => Promise<void>;
  snapshot: TrainingSnapshot;
  workout: Workout;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editPrepareSignal, setEditPrepareSignal] = useState(0);

  const prepareEditDialog = () => {
    if (!canEdit) return;
    setEditPrepareSignal((current) => current + 1);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <HitoButton asChild className="-ml-2" size="sm" variant="ghost">
        <Link to="/">
          <Icon name="arrow-left" size="xs" />
          Back to Calendar
        </Link>
      </HitoButton>

      <DropdownMenu
        onOpenChange={(nextOpen) => {
          if (nextOpen) prepareEditDialog();
        }}
      >
        <DropdownMenuTrigger asChild>
          <HitoButton
            type="button"
            aria-label="Open workout actions"
            iconOnly
            size="sm"
            variant="ghost"
          >
            <Icon name="more-horizontal" size="sm" />
          </HitoButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="hito-menu-width-standard">
          <DropdownMenuLabel>Workout actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canEdit}
            onFocus={prepareEditDialog}
            onPointerEnter={prepareEditDialog}
            onSelect={() => setEditOpen(true)}
          >
            <Icon name="edit" size="xs" />
            Edit this training
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {canEdit ? (
        <ManualWorkoutPersistedEditDialog
          activePlanId={snapshot.planMeta?.id}
          onEdited={onPlanChanged}
          onOpenChange={setEditOpen}
          open={editOpen}
          plannedWorkoutId={workout.id}
          prepareSignal={editPrepareSignal}
          title={workout.title}
          workoutDate={workout.date}
        />
      ) : null}
    </div>
  );
}

function CompletionActionPanel({
  snapshot,
  workout,
  variant,
  onOpenActivityFile,
}: {
  snapshot: TrainingSnapshot;
  workout: Workout;
  variant: "today" | "past";
  onOpenActivityFile: () => void;
}) {
  const isToday = variant === "today";
  const canUploadGarmin = canOpenGarminFeedback(workout, snapshot);

  return (
    <section className="hito-row-group mt-8">
      <div className="hito-list-row items-start gap-4">
        <Icon
          name={isToday ? "check-circle" : "calendar-clock"}
          size="sm"
          className={cn("mt-0.5", isToday ? "text-success" : "text-warn")}
        />
        <div className="min-w-0 flex-1">
          <p className="hito-body-md text-foreground">
            {isToday ? "Ready when you finish" : "Not logged yet"}
          </p>
          <p className="hito-body-sm mt-1 text-secondary">
            {isToday
              ? "Add a result or activity file after you run it. Both update this planned workout."
              : "This past workout is treated as unlogged until you add a real result."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HitoButton asChild className="shrink-0" size="md" variant="primary">
            <Link
              to="/workout/$date"
              params={{ date: workout.date }}
              search={{ tab: "complete" } as never}
            >
              <Icon name={isToday ? "check" : "edit"} size="xs" />
              Add result
            </Link>
          </HitoButton>
          {canUploadGarmin ? (
            <HitoButton
              type="button"
              onClick={onOpenActivityFile}
              className="shrink-0"
              size="md"
              variant="secondary"
            >
              <Icon name="file-up" size="xs" />
              Add activity file
            </HitoButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Overview({ snapshot, workout }: { snapshot: TrainingSnapshot; workout: Workout }) {
  const restAssignment = restAssignmentFor(workout);
  const timelineItems = workoutStructureTimelineItems(workout);
  const documentNotes = workoutDocumentNotesForSteps(workout.steps, workout.notes);

  if (workout.type === "rest") {
    return (
      <section className="flex min-h-[220px] flex-col border-t border-hairline pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="hito-label-md text-foreground">Recovery day</p>
            <h3 className="mt-2 font-sans text-3xl">Keep it light.</h3>
            <p className="hito-body-md text-secondary mt-4 max-w-lg">
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
              <p className="hito-label-md text-foreground">Assignment</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">{restAssignment}</p>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (isManualWorkoutPreview(workout, snapshot)) {
    const meta = workoutTypeMeta(workout);

    return (
      <ManualWorkoutDocumentPreview
        dateLabel={formatDate(workout.date, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
        iconTone={meta.content}
        notes={documentNotes}
        readbackEntries={workoutDocumentSectionsToManualReadbackEntries(workout.steps)}
        timelineItems={timelineItems}
        timelineSummary={workoutStructureTimelineSummary(timelineItems)}
        title={workout.title}
        typeLabel={meta.label}
        workoutType={workout.type}
      />
    );
  }

  return (
    <WorkoutDocumentReadback
      emptyCopy="No extra workout structure was provided for this workout."
      items={timelineItems}
      notes={documentNotes}
      summary={workoutStructureTimelineSummary(timelineItems)}
    />
  );
}

function isManualWorkoutPreview(workout: Workout, snapshot: TrainingSnapshot) {
  return Boolean(
    snapshot.planMeta?.sourceKind === MANUAL_USER_BUILT_PLAN_SOURCE_KIND &&
    workout.sourceWorkoutType &&
    (MANUAL_WORKOUT_TEMPLATE_KEY_VALUES as readonly string[]).includes(workout.sourceWorkoutType),
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="hito-metric min-w-16">
      <div className="flex items-baseline justify-center gap-1">
        <span className="hito-metric-value">{value}</span>
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
              : "hito-label-md text-foreground",
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
      <span className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">{label}</span>
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

function workoutIdentityRows(workout: Workout): Array<{ label: string; value: string }> {
  const language = workoutPlannedLanguage(workout);

  return [{ label: "Type", value: language.runnerFacingWorkoutTypeLabel }];
}

function workoutSidebarExecutionRows(workout: Workout) {
  const language = workoutPlannedLanguage(workout);
  const blockSummary = formatPlannedWorkoutBlockSummary(language.runnerFacingBlocks);
  const duration = workoutStructureDuration(workout);
  const distance = workoutDistanceKm(workout);
  const repeatRows = displayWorkoutStructureEntries(workout).filter(
    (entry) => entry.label === "Repeats",
  );

  return [
    duration > 0
      ? { key: "duration", label: "Duration", value: formatDurationMin(duration) }
      : null,
    distance != null
      ? { key: "distance", label: "Distance", value: `${formatDistanceKm(distance)} km` }
      : null,
    ...repeatRows,
    blockSummary ? { key: "blocks", label: "Blocks", value: blockSummary } : null,
  ].filter((row): row is { key: string; label: string; value: string } => row != null);
}

function workoutSidebarTargetRows(
  workout: Workout,
  target: ReturnType<typeof primaryWorkoutTarget>,
) {
  return displayExecutableTargetEntries(target, workout.metricMode)
    .filter((entry) => workout.metricMode.hrTargetsAllowed || !isHrTargetEntryKey(entry.key))
    .slice(0, 2);
}

function isHrTargetEntryKey(key: string) {
  return key.includes("hr") || key.includes("bpm");
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
      label: "Completed",
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
