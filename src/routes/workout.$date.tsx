import { type RefObject, useRef, useState } from "react";
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
import { MANUAL_WORKOUT_TEMPLATE_KEY_VALUES } from "@/lib/manual-workout-authoring/schema";
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
  formatDurationMin,
  type TrainingSnapshot,
  type Workout,
  workoutTypeMeta,
  workoutDistanceKm,
  workoutStructureDuration,
} from "@/lib/training";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getWorkoutRouteData } from "@/lib/training-api";
import type { WorkoutResultFeedbackSummary } from "@/lib/workout-result-import/types";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { formatUiDate, formatUiNumber } from "@/lib/ui-locale";
import { getHitoKnownProductMessage, getHitoProductMessage } from "@/lib/ui-locale-messages";

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
  const { snapshot, viewer, settings } = Route.useLoaderData();

  return (
    <AppShell settings={settings} snapshot={snapshot} viewer={viewer}>
      <WorkoutPageContent />
    </AppShell>
  );
}

function WorkoutPageContent() {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const {
    workout,
    snapshot,
    prev,
    next,
    feedback,
    sidebarReadModel,
    localActivityFileDesignFixtureEnabled,
  } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const [activityFileDialogOpen, setActivityFileDialogOpen] = useState(false);
  const workoutActionsButtonRef = useRef<HTMLButtonElement>(null);
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
      <div className="hito-route-gutter max-w-2xl py-20">
        <section
          className="hito-state-surface"
          data-tone={snapshot.mode === "onboarding" ? "signal" : undefined}
        >
          {snapshot.mode === "onboarding" ? (
            <>
              <p className="hito-label-md text-foreground">{message("Setup required")}</p>
              <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
                {message("Finish setup before opening workouts.")}
              </h1>
              <p className="hito-body-md mt-4 max-w-[40rem] text-secondary">
                {message("Complete your runner setup first, then your workouts will open here.")}
              </p>
            </>
          ) : (
            <>
              <p className="hito-label-md text-foreground">{message("No workout")}</p>
              <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
                {message("Nothing is scheduled for this day.")}
              </h1>
              <p className="hito-body-md mt-4 max-w-[40rem] text-secondary">
                {message(
                  "There is no workout on this date in your Calendar. Go back and choose another day.",
                )}
              </p>
            </>
          )}
          <div className="hito-state-actions">
            <HitoButton asChild size="lg" variant="primary">
              <Link to="/">{message("Back to Calendar")}</Link>
            </HitoButton>
          </div>
        </section>
      </div>
    );
  }

  const meta = workoutTypeMeta(workout);
  const km = workoutDistanceKm(workout);
  const structureDuration = workoutStructureDuration(workout);
  const status = workout.status;
  const isRestDay = workout.type === "rest";
  const restAssignment = restAssignmentFor(workout);
  const resultMeta = resultMetaForStatus(status);
  const phaseLabel = humanizeSnakeCase(workout.phase);
  const weekLabel = message("Week {week}", { week: workout.week });
  const heroMetrics = isRestDay
    ? []
    : [
        km != null
          ? {
              label: message("Distance"),
              value: formatUiNumber(km, locale, { maximumFractionDigits: 2 }),
              unit: "km",
            }
          : null,
        structureDuration > 0
          ? { label: message("Duration"), value: formatDurationMin(structureDuration) }
          : null,
      ].filter((metric): metric is { label: string; value: string; unit?: string } =>
        Boolean(metric),
      );
  const canEditWorkout = Boolean(
    snapshot.source === "persisted" &&
    workout.type !== "rest" &&
    snapshot.calendarContext?.workoutEditing.editWorkout.allowed &&
    workout.sourceEditing?.canEditContent,
  );

  return (
    <div className="hito-route-gutter relative max-w-6xl pb-8 pt-2">
      <WorkoutDetailTopBar
        canEdit={canEditWorkout}
        onCalendarChanged={() => router.invalidate()}
        onOpenActivityFile={
          localActivityFileDesignFixtureEnabled &&
          snapshot.source === "persisted" &&
          workout.type !== "rest"
            ? () => setActivityFileDialogOpen(true)
            : undefined
        }
        workoutActionsButtonRef={workoutActionsButtonRef}
        workout={workout}
      />

      <section className="relative mt-5 overflow-hidden px-1 pb-3 pt-2 lg:pt-3">
        <div className="hito-workout-hero-grid">
          <div>
            <div className="hito-technical-sm text-secondary flex flex-wrap items-center gap-2.5">
              {resultMeta ? (
                <ResultBadge
                  meta={{
                    ...resultMeta,
                    label: getHitoKnownProductMessage(locale, resultMeta.label),
                  }}
                  mode="identity"
                />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
              )}
              <span style={{ color: meta.content }}>
                {getHitoKnownProductMessage(locale, meta.label)}
              </span>
              <span className="opacity-50">·</span>
              <span className="text-muted-foreground">
                {formatUiDate(workout.date, locale, {
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
                <span className="text-signal">· {message("Today")}</span>
              )}
            </div>
            <h1 className="hito-ui-title-lg mt-3 max-w-2xl text-foreground">
              {isRestDay ? message("Rest day") : workout.title}
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
            aria-label={message("Workout detail view")}
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
                {getHitoKnownProductMessage(locale, tabOption.label)}
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
            <SidebarSection title={message("Future insights")}>
              <p className="hito-body-sm text-secondary">
                {message(
                  "There isn't enough data yet to provide these inputs and insights. This is a future feature.",
                )}
              </p>
            </SidebarSection>
            {sidebarReadModel ? (
              <SidebarSection title={message("This week")}>
                <p className="hito-body-sm text-secondary">
                  {message("{completed} of {scheduled} workouts completed", {
                    completed: sidebarReadModel.week.completedWorkoutCount,
                    scheduled: sidebarReadModel.week.scheduledWorkoutCount,
                  })}
                </p>
              </SidebarSection>
            ) : null}
          </SidebarPanel>
        </aside>
      </div>

      <WorkoutActivityFileDialog
        feedback={feedback}
        localActivityFileDesignFixtureEnabled={localActivityFileDesignFixtureEnabled}
        onOpenChange={setActivityFileDialogOpen}
        open={activityFileDialogOpen}
        returnFocusRef={workoutActionsButtonRef}
        snapshot={snapshot}
        workout={workout}
      />

      <div className="mt-12 grid sm:grid-cols-2 gap-3">
        {prev && <NavCard direction="prev" date={prev.date} title={prev.title} />}
        {next && <NavCard direction="next" date={next.date} title={next.title} />}
      </div>
    </div>
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
      {(locale) => (
        <div className="hito-route-gutter max-w-2xl py-20">
          <section className="hito-state-surface" data-tone="destructive">
            <p className="hito-label-md text-destructive">
              {getHitoProductMessage(locale, "Workout unavailable")}
            </p>
            <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
              {getHitoProductMessage(locale, "We couldn't load this workout.")}
            </h1>
            <p className="hito-body-md mt-4 max-w-[40rem] text-text-secondary">
              {getHitoProductMessage(
                locale,
                "Try again. If setup is still incomplete, go back home first.",
              )}
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
              <Link
                to="/"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {getHitoProductMessage(locale, "Back to Calendar")}
              </Link>
            </div>
          </section>
        </div>
      )}
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
  onCalendarChanged,
  onOpenActivityFile,
  workoutActionsButtonRef,
  workout,
}: {
  canEdit: boolean;
  onCalendarChanged: () => Promise<void>;
  onOpenActivityFile?: () => void;
  workoutActionsButtonRef: RefObject<HTMLButtonElement | null>;
  workout: Workout;
}) {
  const message = useHitoProductMessage();
  const [editOpen, setEditOpen] = useState(false);
  const [editPrepareSignal, setEditPrepareSignal] = useState(0);

  const prepareEditDialog = () => {
    if (!canEdit) return;
    setEditPrepareSignal((current) => current + 1);
  };

  const setEditDialogOpen = (nextOpen: boolean) => {
    setEditOpen(nextOpen);

    if (!nextOpen) {
      window.requestAnimationFrame(() => {
        workoutActionsButtonRef.current?.focus({ preventScroll: true });
      });
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <HitoButton asChild className="-ml-2" size="sm" variant="ghost">
        <Link to="/">
          <Icon name="arrow-left" size="xs" />
          {message("Back to Calendar")}
        </Link>
      </HitoButton>

      <DropdownMenu
        onOpenChange={(nextOpen) => {
          if (nextOpen) prepareEditDialog();
        }}
      >
        <DropdownMenuTrigger asChild>
          <HitoButton
            ref={workoutActionsButtonRef}
            type="button"
            aria-label={message("Open workout actions")}
            iconOnly
            size="sm"
            variant="ghost"
          >
            <Icon name="more-horizontal" size="sm" />
          </HitoButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="hito-menu-width-standard">
          <DropdownMenuLabel>{message("Workout actions")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canEdit}
            onFocus={prepareEditDialog}
            onPointerEnter={prepareEditDialog}
            onSelect={() => setEditOpen(true)}
          >
            <Icon name="edit" size="xs" />
            {message("Edit this training")}
          </DropdownMenuItem>
          {onOpenActivityFile ? (
            <DropdownMenuItem onSelect={onOpenActivityFile}>
              <Icon name="file-up" size="xs" />
              {message("Activity file")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canEdit ? (
        <ManualWorkoutPersistedEditDialog
          onEdited={onCalendarChanged}
          onOpenChange={setEditDialogOpen}
          open={editOpen}
          plannedWorkoutId={workout.id}
          prepareSignal={editPrepareSignal}
          provenancePlanId={workout.sourceProvenance?.sourcePlanId}
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
  const message = useHitoProductMessage();
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
            {isToday ? message("Ready when you finish") : message("Not logged yet")}
          </p>
          <p className="hito-body-sm mt-1 text-secondary">
            {isToday
              ? message(
                  "Add a result or activity file after you run it. Both update this Calendar workout.",
                )
              : message("This past workout is treated as unlogged until you add a real result.")}
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
              {message("Add result")}
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
              {message("Add activity file")}
            </HitoButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Overview({ snapshot, workout }: { snapshot: TrainingSnapshot; workout: Workout }) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const restAssignment = restAssignmentFor(workout);
  const timelineItems = workoutStructureTimelineItems(workout);
  const documentNotes = workoutDocumentNotesForSteps(workout.steps, workout.notes);

  if (workout.type === "rest") {
    return (
      <section className="flex min-h-[220px] flex-col border-t border-hairline pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="hito-label-md text-foreground">{message("Recovery day")}</p>
            <h3 className="mt-2 font-sans text-3xl">{message("Keep it light.")}</h3>
            <p className="hito-body-md text-secondary mt-4 max-w-lg">
              {message(
                "No distance, duration, or load is scheduled here. Let the day stay open unless a real recovery assignment is present.",
              )}
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
              <p className="hito-label-md text-foreground">{message("Assignment")}</p>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{restAssignment}</p>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (isManualWorkoutPresentation(workout)) {
    const meta = workoutTypeMeta(workout);

    return (
      <ManualWorkoutDocumentPreview
        dateLabel={formatUiDate(workout.date, locale, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
        iconTone={meta.content}
        notes={documentNotes}
        readbackEntries={workoutDocumentSectionsToManualReadbackEntries(workout.steps, locale)}
        timelineItems={timelineItems}
        timelineSummary={workoutStructureTimelineSummary(timelineItems, locale)}
        title={workout.title}
        typeLabel={getHitoKnownProductMessage(locale, meta.label)}
        workoutType={workout.type}
      />
    );
  }

  return (
    <WorkoutDocumentReadback
      emptyCopy={message("No extra workout structure was provided for this workout.")}
      items={timelineItems}
      notes={documentNotes}
      summary={workoutStructureTimelineSummary(timelineItems, locale)}
    />
  );
}

function isManualWorkoutPresentation(workout: Workout) {
  return Boolean(
    workout.sourceProvenance?.originKind === "manual" &&
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
  return <div className="hito-row-group bg-background">{children}</div>;
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hito-list-row items-start">
      <div className="w-full min-w-0">
        <div className="hito-label-md mb-3 text-foreground">{title}</div>
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
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const formattedDate = formatUiDate(date, locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
            <span className="hito-nav-card-label">{message("Previous")}</span>
            <span className="hito-nav-card-date">{formattedDate}</span>
          </>
        ) : (
          <>
            <span className="hito-nav-card-date">{formattedDate}</span>
            <span className="hito-nav-card-label">{message("Next")}</span>
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

function ResultBadge({
  meta,
  mode,
}: {
  meta: NonNullable<ReturnType<typeof resultMetaForStatus>>;
  mode: "identity" | "sidebar";
}) {
  const locale = useHitoUiLocale();
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
      {getHitoKnownProductMessage(locale, meta.label)}
    </span>
  );
}
