import {
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { HitoButton } from "@/components/ui/button";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { Icon } from "@/components/ui/icon";
import {
  HitoCalendarDayCell,
  HitoWorkoutDayRow,
  type HitoCalendarActionVisual,
} from "@/components/ui/hito-calendar-day";
import {
  buildCalendarDayProjection,
  buildRestCalendarDayPresentation,
  buildWorkoutCalendarDayPresentation,
  blueprintProjectionStatusLabel,
  calendarMoveTargetAction,
  calendarMoveUndoAction,
  resolveCalendarMoveDateRender,
  type CalendarAddActionContext,
  type CalendarDaySurfacePresentation,
  type CalendarDaySlotLayout,
} from "@/components/calendar/calendar-projection";
import type {
  AdaptiveBlueprintCalendarReadModel,
  BlueprintCalendarProjection,
  BlueprintCalendarProjectionStatus,
} from "@/lib/adaptive-blueprint-product-contract";
import {
  manualMoveSourceDragProps,
  manualMoveTargetDragProps,
  useManualCalendarActions,
  type ManualCalendarActionState,
} from "@/components/calendar/manual-calendar-actions";
import {
  addDaysIso,
  displayWorkoutTargetReadbackEntries,
  formatDurationMin,
  startOfWeekIso,
  workoutDuration,
  workoutDistanceKm,
  workoutStatusLabel,
  workoutTypeMeta,
  type TrainingSnapshot,
  type Workout,
} from "@/lib/training";
import {
  ManualWorkoutAddMenu,
  ManualWorkoutSourceActionMenu,
} from "@/components/manual-workout/ManualWorkoutAuthoringControls";
import { ManualWorkoutMoveController } from "@/components/manual-workout/ManualWorkoutMoveControls";
import { CalendarOverflowActions } from "@/components/calendar/CalendarOverflowActions";
import { AdaptiveContinuationPanel } from "@/components/calendar/AdaptiveContinuationPanel";
import {
  UnplannedActivityWorkflow,
  type UnplannedActivityWorkflowEntry,
} from "@/components/runner-activity/UnplannedActivityWorkflow";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { formatUiDate, formatUiNumber } from "@/lib/ui-locale";
import { formatHitoProductMessage, getHitoKnownProductMessage } from "@/lib/ui-locale-messages";

type View = "month" | "week";
type TooltipAnchor = {
  iso: string;
  rect: Pick<DOMRect, "bottom" | "height" | "left" | "right" | "top" | "width">;
};
type TooltipPosition = {
  left: number;
  top: number;
};

const TOOLTIP_VIEWPORT_MARGIN = 12;
const TOOLTIP_ANCHOR_GAP = 10;

export function Calendar({
  blueprintReadModel,
  snapshot,
  runnerScopeKey,
  localActivityFileDesignFixtureEnabled = false,
}: {
  blueprintReadModel: AdaptiveBlueprintCalendarReadModel;
  snapshot: TrainingSnapshot;
  runnerScopeKey: string | null | undefined;
  localActivityFileDesignFixtureEnabled?: boolean;
}) {
  const router = useRouter();
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(snapshot.currentDate);
  const [tooltipAnchor, setTooltipAnchor] = useState<TooltipAnchor | null>(null);
  const [activityWorkflowEntry, setActivityWorkflowEntry] =
    useState<UnplannedActivityWorkflowEntry | null>(null);
  const activityReturnFocusRef = useRef<HTMLElement | null>(null);
  const { manualCalendarActionState, manualMoveControllerProps } = useManualCalendarActions(
    snapshot,
    {
      onCalendarRefresh: () => router.invalidate(),
      onResetTransientUi: () => setTooltipAnchor(null),
      runnerScopeKey,
    },
  );

  const cells = useMemo(() => buildMonth(cursor), [cursor]);
  const mobileMonthDates = useMemo(() => buildMonthDays(cursor), [cursor]);
  const monthLabel = formatUiDate(cursor, locale, { month: "long", year: "numeric" });
  const tooltipWorkout = tooltipAnchor
    ? (resolveCalendarMoveDateRender(
        snapshot.workouts,
        tooltipAnchor.iso,
        manualCalendarActionState.optimisticMove,
      ).workout ?? null)
    : null;

  const weekCells = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDaysIso(startOfWeekIso(cursor), index)),
    [cursor],
  );

  function shift(amount: number) {
    setCursor(view === "month" ? shiftMonth(cursor, amount) : addDaysIso(cursor, amount * 7));
    setTooltipAnchor(null);
  }

  function openUnplannedActivity(clickedDate: string, trigger: HTMLElement) {
    activityReturnFocusRef.current = trigger;
    setActivityWorkflowEntry({ kind: "calendar", clickedDate });
  }

  return (
    <div>
      <ManualWorkoutMoveController {...manualMoveControllerProps} />

      <div className="hito-section-header mb-6">
        <div>
          <h1 id="calendar-title" className="hito-ui-title-lg text-foreground" tabIndex={-1}>
            {monthLabel}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="hito-choice-toggle-group" aria-label={message("Calendar view")}>
            <HitoChoiceToggle
              type="button"
              onClick={() => setView("month")}
              aria-pressed={view === "month"}
              presentation="inline"
              selected={view === "month"}
              size="sm"
            >
              {message("Month")}
            </HitoChoiceToggle>
            <HitoChoiceToggle
              type="button"
              onClick={() => setView("week")}
              aria-pressed={view === "week"}
              presentation="inline"
              selected={view === "week"}
              size="sm"
            >
              {message("Week")}
            </HitoChoiceToggle>
          </div>
          <HitoButton
            type="button"
            onClick={() => shift(-1)}
            aria-label={message("Previous calendar period")}
            iconOnly
            size="sm"
            variant="secondary"
          >
            <Icon name="chevron-left" size="sm" />
          </HitoButton>
          <HitoButton
            type="button"
            onClick={() => {
              setCursor(snapshot.currentDate);
              setTooltipAnchor(null);
            }}
            size="sm"
            variant="secondary"
          >
            {message("Today")}
          </HitoButton>
          <HitoButton
            type="button"
            onClick={() => shift(1)}
            aria-label={message("Next calendar period")}
            iconOnly
            size="sm"
            variant="secondary"
          >
            <Icon name="chevron-right" size="sm" />
          </HitoButton>
          <CalendarOverflowActions
            localActivityFileDesignFixtureEnabled={localActivityFileDesignFixtureEnabled}
            onCalendarRefresh={() => router.invalidate({ sync: true })}
          />
        </div>
      </div>

      <AdaptiveContinuationPanel
        continuation={blueprintReadModel.continuation}
        projections={blueprintReadModel.projections}
        onRefresh={() => router.invalidate({ sync: true })}
      />

      {blueprintReadModel.projections.length > 0 ? (
        <BlueprintProjectionReadback projections={blueprintReadModel.projections} />
      ) : null}

      {view === "month" ? (
        <>
          <div className="hidden border-b border-hairline lg:block">
            <div className="hito-calendar-grid hito-calendar-grid-month">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div
                  key={day}
                  className="hito-calendar-grid-heading hito-label-sm uppercase tracking-[0.18em] text-tertiary"
                >
                  {getHitoKnownProductMessage(locale, day)}
                </div>
              ))}
              {cells.map((iso, index) => (
                <DayCell
                  key={index}
                  iso={iso}
                  inMonth={iso ? iso.slice(0, 7) === cursor.slice(0, 7) : false}
                  manualCalendarActionState={manualCalendarActionState}
                  onAddActivity={openUnplannedActivity}
                  onTooltipChange={setTooltipAnchor}
                  snapshot={snapshot}
                />
              ))}
            </div>
          </div>
          <MobileMonthList
            dates={mobileMonthDates}
            manualCalendarActionState={manualCalendarActionState}
            onAddActivity={openUnplannedActivity}
            snapshot={snapshot}
          />
        </>
      ) : (
        <WeekStrip
          dates={weekCells}
          manualCalendarActionState={manualCalendarActionState}
          onAddActivity={openUnplannedActivity}
          snapshot={snapshot}
        />
      )}

      {tooltipAnchor && tooltipWorkout ? (
        <CalendarTooltipLayer anchor={tooltipAnchor}>
          <Tooltip workout={tooltipWorkout} />
        </CalendarTooltipLayer>
      ) : null}

      <UnplannedActivityWorkflow
        entry={activityWorkflowEntry}
        fallbackFocusId="calendar-title"
        returnFocusRef={activityReturnFocusRef}
        onOpenChange={(open) => {
          if (!open) setActivityWorkflowEntry(null);
        }}
        onConfirmed={async (review) => {
          if (review.calendarState.state === "confirmed") {
            setCursor(review.calendarState.workout.workoutDate);
          }
          await router.invalidate({ sync: true });
        }}
      />
    </div>
  );
}

function BlueprintProjectionReadback({
  projections,
}: {
  projections: BlueprintCalendarProjection[];
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  return (
    <section className="mb-6 min-w-0" aria-labelledby="future-blueprint-title">
      <div className="mb-4">
        <h2 id="future-blueprint-title" className="hito-ui-title-md text-foreground">
          {message("Future training blueprint")}
        </h2>
        <p className="hito-body-sm mt-1 max-w-2xl text-text-secondary">
          {message(
            "These are provisional intentions, not confirmed Calendar workouts. Details will be reviewed closer to the date.",
          )}
        </p>
      </div>

      <ul className="hito-row-group" aria-label={message("Future Blueprint projections")}>
        {projections.map((projection) => {
          const statusLabel = getHitoKnownProductMessage(
            locale,
            blueprintProjectionStatusLabel(projection.status),
          );

          return (
            <li
              key={`${projection.blueprint.id}:${projection.projectionId}`}
              className="hito-list-row min-w-0 items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              tabIndex={0}
              data-blueprint-projection=""
              data-blueprint-projection-status={projection.status}
              aria-label={`${formatUiDate(projection.date, locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}. ${formatBlueprintLabel(projection.workoutFamily)}. ${statusLabel}.`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="hito-list-row-title min-w-0">
                    {formatBlueprintLabel(projection.workoutFamily)}
                  </p>
                  <span
                    className="hito-status-pill shrink-0"
                    data-tone={blueprintProjectionStatusTone(projection.status)}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className="hito-list-row-copy mt-1">
                  {formatUiDate(projection.date, locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {formatBlueprintLabel(projection.phase)}
                  {" · "}
                  {message("{count} sessions per week", { count: projection.phaseCadence })}
                </p>
                <p className="hito-list-row-copy mt-1">{projection.goalAssumption}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function blueprintProjectionStatusTone(status: BlueprintCalendarProjectionStatus) {
  switch (status) {
    case "planned":
      return "muted" as const;
    case "check_in_needed":
    case "evidence_incomplete":
      return "warning" as const;
    case "ready_for_review":
      return "signal" as const;
    case "awaiting_runner_confirmation":
      return "rollout" as const;
  }
}

function formatBlueprintLabel(value: string) {
  const normalized = value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : value;
}

function CalendarTooltipLayer({
  anchor,
  children,
}: {
  anchor: TooltipAnchor;
  children: ReactNode;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  useEffect(() => {
    function updatePosition() {
      if (typeof window === "undefined") return;

      const tooltip = tooltipRef.current;
      const tooltipWidth = tooltip?.offsetWidth ?? 288;
      const tooltipHeight = tooltip?.offsetHeight ?? 190;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredLeft = anchor.rect.left + anchor.rect.width / 2 - tooltipWidth / 2;
      const left = clamp(
        preferredLeft,
        TOOLTIP_VIEWPORT_MARGIN,
        Math.max(TOOLTIP_VIEWPORT_MARGIN, viewportWidth - tooltipWidth - TOOLTIP_VIEWPORT_MARGIN),
      );
      const belowTop = anchor.rect.bottom + TOOLTIP_ANCHOR_GAP;
      const aboveTop = anchor.rect.top - tooltipHeight - TOOLTIP_ANCHOR_GAP;
      const hasRoomBelow = belowTop + tooltipHeight <= viewportHeight - TOOLTIP_VIEWPORT_MARGIN;
      const hasRoomAbove = aboveTop >= TOOLTIP_VIEWPORT_MARGIN;
      const preferredTop =
        hasRoomBelow || !hasRoomAbove
          ? Math.min(belowTop, viewportHeight - tooltipHeight - TOOLTIP_VIEWPORT_MARGIN)
          : aboveTop;
      const top = clamp(
        preferredTop,
        TOOLTIP_VIEWPORT_MARGIN,
        Math.max(TOOLTIP_VIEWPORT_MARGIN, viewportHeight - tooltipHeight - TOOLTIP_VIEWPORT_MARGIN),
      );

      setPosition({ left, top });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchor]);

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left: position?.left ?? -9999,
        top: position?.top ?? -9999,
        opacity: position ? 1 : 0,
      }}
    >
      <div ref={tooltipRef}>{children}</div>
    </div>
  );
}

function MobileMonthList({
  dates,
  manualCalendarActionState,
  onAddActivity,
  snapshot,
}: {
  dates: string[];
  manualCalendarActionState: ManualCalendarActionState;
  onAddActivity: (date: string, trigger: HTMLElement) => void;
  snapshot: TrainingSnapshot;
}) {
  return (
    <div className="hito-calendar-mobile-list lg:hidden">
      {dates.map((iso) => (
        <CalendarDaySlot
          key={iso}
          iso={iso}
          layout="mobile"
          manualCalendarActionState={manualCalendarActionState}
          onAddActivity={onAddActivity}
          snapshot={snapshot}
        />
      ))}
    </div>
  );
}

function buildMonthDays(cursor: string): string[] {
  const month = cursor.slice(0, 7);
  const dates: string[] = [];

  for (let date = `${month}-01`; date.slice(0, 7) === month; date = addDaysIso(date, 1)) {
    dates.push(date);
  }

  return dates;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function tooltipAnchorFromElement(iso: string, element: HTMLElement): TooltipAnchor {
  const rect = element.getBoundingClientRect();
  return {
    iso,
    rect: {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width,
    },
  };
}

function buildMonth(cursor: string): string[] {
  const month = cursor.slice(0, 7);
  const cells: string[] = [];
  let date = startOfWeekIso(`${month}-01`);

  do {
    cells.push(date);
    date = addDaysIso(date, 1);
  } while (date.slice(0, 7) === month || cells.length % 7 !== 0);

  return cells;
}

function shiftMonth(cursor: string, amount: number): string {
  const dayIndex = Number(cursor.slice(8, 10)) - 1;
  let monthStart = `${cursor.slice(0, 7)}-01`;

  for (let index = 0; index < Math.abs(amount); index += 1) {
    monthStart =
      amount > 0
        ? `${addDaysIso(monthStart, 31).slice(0, 7)}-01`
        : `${addDaysIso(monthStart, -1).slice(0, 7)}-01`;
  }

  return addDaysIso(monthStart, dayIndex);
}

function DayCell({
  iso,
  inMonth,
  manualCalendarActionState,
  onAddActivity,
  onTooltipChange,
  snapshot,
}: {
  iso: string | null;
  inMonth: boolean;
  manualCalendarActionState: ManualCalendarActionState;
  onAddActivity: (date: string, trigger: HTMLElement) => void;
  onTooltipChange: (value: TooltipAnchor | null) => void;
  snapshot: TrainingSnapshot;
}) {
  if (!iso) {
    return <CalendarSlotPlaceholder />;
  }
  return (
    <CalendarDaySlot
      inMonth={inMonth}
      iso={iso}
      layout="month"
      manualCalendarActionState={manualCalendarActionState}
      onAddActivity={onAddActivity}
      onTooltipChange={onTooltipChange}
      snapshot={snapshot}
    />
  );
}

function CalendarDaySlot({
  inMonth = true,
  iso,
  layout,
  manualCalendarActionState,
  onAddActivity,
  onTooltipChange,
  snapshot,
}: {
  inMonth?: boolean;
  iso: string;
  layout: CalendarDaySlotLayout;
  manualCalendarActionState: ManualCalendarActionState;
  onAddActivity: (date: string, trigger: HTMLElement) => void;
  onTooltipChange?: (value: TooltipAnchor | null) => void;
  snapshot: TrainingSnapshot;
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const projection = buildCalendarDayProjection({
    inMonth,
    interaction: manualCalendarActionState,
    iso,
    layout,
    snapshot,
  });
  const {
    addAction,
    canMoveHere,
    feedback: feedbackMeta,
    hasWorkout,
    isMoveSource,
    pendingMoveSource,
    pendingMoveTarget,
    presentation,
    sourceAction,
    undoAction,
    workout,
  } = projection;
  if (pendingMoveTarget || pendingMoveSource) {
    return (
      <div
        className={layout === "month" ? "relative h-full min-w-0" : undefined}
        aria-live="polite"
      >
        <CalendarDaySurface
          iso={iso}
          layout={layout}
          pendingLabel={pendingMoveTarget ? message("Moving") : undefined}
          presentation={
            pendingMoveTarget
              ? presentation
              : buildRestCalendarDayPresentation({ stateLabel: message("Rest") })
          }
          selected={Boolean(pendingMoveTarget)}
          today={iso === snapshot.currentDate}
        />
      </div>
    );
  }

  if (undoAction) {
    return (
      <CalendarDayButton
        ariaLabel={message("Undo move for {title}. {seconds} seconds remaining.", {
          title: undoAction.title,
          seconds: manualCalendarActionState.undoSecondsRemaining,
        })}
        layout={layout}
        onClick={() => manualCalendarActionState.onUndoLastMove(undoAction)}
      >
        <CalendarDaySurface
          action={localizeCalendarAction(
            calendarMoveUndoAction(manualCalendarActionState.undoSecondsRemaining),
            locale,
          )}
          interactive
          iso={iso}
          layout={layout}
          presentation={buildRestCalendarDayPresentation({ stateLabel: message("Rest") })}
          today={iso === snapshot.currentDate}
        />
      </CalendarDayButton>
    );
  }

  if (addAction && canMoveHere) {
    const content = (
      <ManualWorkoutAddMenu
        copiedWorkoutSource={manualCalendarActionState.copiedWorkoutSource}
        date={iso}
        moveTargetDayKind={addAction.moveTargetDayKind}
        moveOnly={addAction.moveOnly}
        moveWorkoutSource={canMoveHere ? manualCalendarActionState.moveWorkoutSource : null}
        onAdded={manualCalendarActionState.onCalendarChanged}
        onMoveCanceled={manualCalendarActionState.onCancelMoveWorkout}
        onMoveTargetSelected={manualCalendarActionState.onMoveTargetSelected}
        pasteTargetIsEmpty={!workout}
      >
        <CalendarDayButton
          ariaLabel={localizedCalendarMoveTargetButtonAriaLabel(
            iso,
            addAction.moveTargetDayKind,
            locale,
          )}
          layout={layout}
          {...manualMoveTargetDragProps(canMoveHere, iso, manualCalendarActionState)}
        >
          <CalendarDaySurface
            action={localizeCalendarAction(
              calendarMoveTargetAction(addAction.moveTargetDayKind),
              locale,
            )}
            className={
              manualCalendarActionState.moveHoverDate === iso
                ? "hito-calendar-move-target"
                : undefined
            }
            interactive
            iso={iso}
            layout={layout}
            presentation={
              workout
                ? buildWorkoutCalendarDayPresentation(workout, { includeRestTitle: true })
                : buildRestCalendarDayPresentation()
            }
            today={iso === snapshot.currentDate}
          />
        </CalendarDayButton>
      </ManualWorkoutAddMenu>
    );

    return layout === "month" ? <div className="relative h-full min-w-0">{content}</div> : content;
  }

  const canDragMove = Boolean(sourceAction?.canDragInitiate);
  const sourceActionMobile = layout === "mobile";
  const hasCalendarAddMenu = Boolean(
    addAction && (addAction.canAddActivity || addAction.canAddWorkout),
  );
  const tooltipHandlers =
    layout === "month" && onTooltipChange && hasWorkout
      ? {
          onBlur: () => onTooltipChange(null),
          onFocus: (event: FocusEvent<HTMLAnchorElement>) =>
            onTooltipChange(tooltipAnchorFromElement(iso, event.currentTarget)),
          onMouseEnter: (event: MouseEvent<HTMLAnchorElement>) =>
            onTooltipChange(tooltipAnchorFromElement(iso, event.currentTarget)),
          onMouseLeave: () => onTooltipChange(null),
        }
      : {};

  return (
    <div
      className={cn(
        "group/manual-day relative",
        layout === "month" && "h-full min-w-0",
        canDragMove && "cursor-grab active:cursor-grabbing",
      )}
      data-calendar-date={iso}
      {...manualMoveSourceDragProps(
        sourceAction,
        manualCalendarActionState,
        message("Move workout"),
      )}
    >
      <Link
        to="/workout/$date"
        params={{ date: iso }}
        search={{} as never}
        className={cn("group block", layout === "month" && "h-full")}
        draggable={false}
        {...tooltipHandlers}
      >
        <CalendarDaySurface
          className={isMoveSource ? "hito-calendar-move-source" : undefined}
          interactive
          iso={iso}
          layout={layout}
          muted={layout === "month" && !inMonth}
          presentation={presentation}
          slotAction={
            canDragMove
              ? {
                  label: message("Move"),
                  icon: "arrow-right" as const,
                  tone: "signal" as const,
                  ariaLabel: message("Drag to move selected workout"),
                }
              : null
          }
          today={iso === snapshot.currentDate}
        />
      </Link>

      {hasWorkout && feedbackMeta ? (
        <Link
          to="/workout/$date"
          params={{ date: iso }}
          search={{ tab: "feedback" } as never}
          draggable={false}
          className={
            layout === "mobile"
              ? "hito-calendar-mobile-feedback-marker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              : cn(
                  "absolute z-20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  layout === "week" ? "bottom-4 right-4" : "bottom-2.5 right-2.5",
                )
          }
          aria-label={message("{label}. Open workout feedback.", {
            label: getHitoKnownProductMessage(locale, feedbackMeta.label),
          })}
        >
          <CalendarFeedbackMarker calendar={layout === "month"} state={feedbackMeta.state} />
        </Link>
      ) : null}

      {hasCalendarAddMenu && addAction ? (
        <CalendarAddMenu
          action={addAction}
          date={iso}
          layout={layout}
          manualCalendarActionState={manualCalendarActionState}
          onAddActivity={onAddActivity}
        />
      ) : null}

      {sourceAction && workout ? (
        <ManualWorkoutSourceActionMenu
          provenancePlanId={sourceAction.provenancePlanId}
          canAddActivity={sourceAction.canAddActivity}
          canCopy={sourceAction.canDirectCopy}
          canClear={sourceAction.canRequestClearReview}
          canMove={sourceAction.canDirectMove}
          onCleared={manualCalendarActionState.onCalendarChanged}
          onAddActivity={(trigger) => onAddActivity(iso, trigger)}
          onCopy={manualCalendarActionState.onCopyWorkout}
          onMove={manualCalendarActionState.onMoveWorkout}
          sourceWorkoutDate={sourceAction.sourceWorkoutDate}
          sourceWorkoutId={sourceAction.sourceWorkoutId}
          title={sourceAction.title}
          workout={workout}
        >
          <button
            type="button"
            className={cn(
              "hito-button hito-button-ghost hito-button-xs absolute z-30 aspect-square p-0",
              sourceActionMobile
                ? "right-3 top-3"
                : "opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 group-hover/manual-day:opacity-100 focus-visible:opacity-100",
              layout === "month" && "right-2 top-2",
              layout === "week" && "right-3 top-3",
            )}
            aria-label={message("More activity actions for {title}", {
              title: sourceAction.title,
            })}
            draggable={false}
            onDragStart={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <Icon name="more-horizontal" size="xs" />
          </button>
        </ManualWorkoutSourceActionMenu>
      ) : null}
    </div>
  );
}

type CalendarDayButtonProps = Omit<ComponentPropsWithoutRef<"button">, "aria-label"> & {
  ariaLabel: string;
  children: ReactNode;
  layout: CalendarDaySlotLayout;
};

const CalendarDayButton = forwardRef<HTMLButtonElement, CalendarDayButtonProps>(
  ({ ariaLabel, children, className, layout, ...buttonProps }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "block w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          layout !== "mobile" && "group h-full",
          className,
        )}
        aria-label={ariaLabel}
        {...buttonProps}
      >
        {children}
      </button>
    );
  },
);

CalendarDayButton.displayName = "CalendarDayButton";

function CalendarDaySurface({
  action,
  className,
  interactive = false,
  iso,
  layout,
  muted = false,
  pendingLabel,
  presentation,
  selected = false,
  slotAction,
  today,
}: {
  action?: Parameters<typeof HitoCalendarDayCell>[0]["action"];
  className?: string;
  interactive?: boolean;
  iso: string;
  layout: CalendarDaySlotLayout;
  muted?: boolean;
  pendingLabel?: string;
  presentation: CalendarDaySurfacePresentation;
  selected?: boolean;
  slotAction?: Parameters<typeof HitoCalendarDayCell>[0]["slotAction"];
  today: boolean;
}) {
  const locale = useHitoUiLocale();
  const localizedPresentation = localizeCalendarPresentation(presentation, locale);
  if (layout === "mobile") {
    return (
      <HitoWorkoutDayRow
        {...localizedPresentation}
        action={action}
        className={className}
        date={{
          eyebrow: formatUiDate(iso, locale, { weekday: "short" }),
          day: iso.slice(8),
        }}
        interactive={interactive}
        pendingLabel={pendingLabel}
        selected={selected}
        slotAction={slotAction}
        today={today}
      />
    );
  }

  return (
    <HitoCalendarDayCell
      {...localizedPresentation}
      action={action}
      className={cn("h-full", className)}
      day={iso.slice(8)}
      interactive={interactive}
      layout={layout === "week" ? "week" : "month"}
      muted={muted}
      pendingLabel={pendingLabel}
      selected={selected}
      slotAction={slotAction}
      today={today}
      weekday={layout === "week" ? formatUiDate(iso, locale, { weekday: "short" }) : undefined}
    />
  );
}

function localizeCalendarPresentation(
  presentation: CalendarDaySurfacePresentation,
  locale: ReturnType<typeof useHitoUiLocale>,
): CalendarDaySurfacePresentation {
  return {
    ...presentation,
    feedbackLabel:
      presentation.feedback === "none"
        ? undefined
        : getHitoKnownProductMessage(
            locale,
            presentation.feedback === "evidence_attached" ? "Evidence" : "Feedback",
          ),
    resultLabel:
      presentation.result === "none"
        ? undefined
        : getHitoKnownProductMessage(
            locale,
            presentation.result === "completed"
              ? "Completed"
              : presentation.result === "partial"
                ? "Partial"
                : presentation.result === "skipped"
                  ? "Skipped"
                  : "Planned",
          ),
    stateLabel: presentation.stateLabel
      ? getHitoKnownProductMessage(locale, presentation.stateLabel)
      : presentation.stateLabel,
    title:
      presentation.state === "rest" && presentation.title
        ? getHitoKnownProductMessage(locale, presentation.title)
        : presentation.title,
    workout: presentation.workout
      ? {
          ...presentation.workout,
          label: getHitoKnownProductMessage(locale, presentation.workout.label),
          short: presentation.workout.short
            ? getHitoKnownProductMessage(locale, presentation.workout.short)
            : presentation.workout.short,
        }
      : presentation.workout,
  };
}

function localizeCalendarAction(
  action: HitoCalendarActionVisual,
  locale: ReturnType<typeof useHitoUiLocale>,
): HitoCalendarActionVisual {
  const undoSeconds = action.label.match(/^Undo (\d+)$/)?.[1];
  const ariaUndoSeconds = action.ariaLabel?.match(/^Undo move\. (\d+) seconds remaining\.$/)?.[1];

  return {
    ...action,
    label: undoSeconds
      ? formatHitoProductMessage(locale, "Undo {seconds}", { seconds: undoSeconds })
      : getHitoKnownProductMessage(locale, action.label),
    ariaLabel: ariaUndoSeconds
      ? formatHitoProductMessage(locale, "Undo move. {seconds} seconds remaining.", {
          seconds: ariaUndoSeconds,
        })
      : action.ariaLabel
        ? getHitoKnownProductMessage(locale, action.ariaLabel)
        : action.ariaLabel,
  };
}

function localizedCalendarMoveTargetButtonAriaLabel(
  iso: string,
  dayKind: Parameters<typeof calendarMoveTargetAction>[0],
  locale: ReturnType<typeof useHitoUiLocale>,
) {
  const date = formatUiDate(iso, locale, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  return formatHitoProductMessage(
    locale,
    dayKind === "workout_day"
      ? "{date}. Review replacement for selected workout."
      : "{date}. Move selected workout to rest day.",
    { date },
  );
}

function CalendarSlotPlaceholder() {
  return <div aria-hidden="true" className="hito-calendar-slot-placeholder" />;
}

function Tooltip({ workout }: { workout: Workout }) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);
  const meta = workoutTypeMeta(workout);
  const readbackEntries = displayWorkoutTargetReadbackEntries(workout, {
    limit: 2,
    omitStructureLabels: ["distance", "duration"],
  });

  return (
    <div className="hito-tooltip hito-tooltip-width-lg">
      <div className="flex items-center justify-between">
        <span className="hito-label-md text-foreground" style={{ color: meta.content }}>
          {getHitoKnownProductMessage(locale, meta.label)}
        </span>
        <span className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">
          {formatUiDate(workout.date, locale, {
            month: "short",
            day: "numeric",
            weekday: "short",
          })}
        </span>
      </div>
      <div className="hito-tooltip-title mt-2 font-sans text-lg">{workout.title}</div>
      <div className="hito-metric-row mt-3 grid-cols-3">
        <Stat
          label={message("Distance")}
          value={
            km != null ? `${formatUiNumber(km, locale, { maximumFractionDigits: 2 })} km` : "—"
          }
        />
        <Stat label={message("Duration")} value={duration ? formatDurationMin(duration) : "—"} />
        <Stat
          label={message("Status")}
          value={getHitoKnownProductMessage(locale, workoutStatusLabel(workout.status))}
        />
      </div>
      {readbackEntries.length > 0 && (
        <div className="hito-body-xs text-tertiary mt-3 space-y-0.5 border-t border-hairline pt-3">
          {readbackEntries.map((entry) => (
            <div key={entry.key} className="flex justify-between gap-3">
              <span className="hito-metric-label">
                {getHitoKnownProductMessage(locale, entry.label)}
              </span>
              <span className="text-text-secondary truncate">{entry.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hito-metric">
      <div className="hito-technical-sm text-secondary capitalize">{value}</div>
      <div className="hito-metric-label">{label}</div>
    </div>
  );
}

function WeekStrip({
  dates,
  manualCalendarActionState,
  onAddActivity,
  snapshot,
}: {
  dates: string[];
  manualCalendarActionState: ManualCalendarActionState;
  onAddActivity: (date: string, trigger: HTMLElement) => void;
  snapshot: TrainingSnapshot;
}) {
  return (
    <div className="hito-calendar-grid-month grid grid-cols-1 border-b border-hairline lg:grid-cols-7">
      {dates.map((iso) => {
        return (
          <CalendarDaySlot
            key={iso}
            iso={iso}
            layout="week"
            manualCalendarActionState={manualCalendarActionState}
            onAddActivity={onAddActivity}
            snapshot={snapshot}
          />
        );
      })}
    </div>
  );
}

function CalendarAddMenu({
  action,
  date,
  layout,
  manualCalendarActionState,
  onAddActivity,
}: {
  action: CalendarAddActionContext;
  date: string;
  layout: CalendarDaySlotLayout;
  manualCalendarActionState: ManualCalendarActionState;
  onAddActivity: (date: string, trigger: HTMLElement) => void;
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const fullDate = formatUiDate(date, locale, { dateStyle: "long" });

  return (
    <ManualWorkoutAddMenu
      copiedWorkoutSource={manualCalendarActionState.copiedWorkoutSource}
      date={date}
      onAddActivity={action.canAddActivity ? (trigger) => onAddActivity(date, trigger) : undefined}
      onAdded={manualCalendarActionState.onCalendarChanged}
      pasteTargetIsEmpty={action.canAddWorkout}
      showWorkoutOptions={action.canAddWorkout}
    >
      <HitoButton
        type="button"
        aria-label={message("Add actions for {date}", { date: fullDate })}
        className={cn(
          "absolute z-30 aspect-square p-0 transition-opacity",
          layout === "mobile"
            ? "right-3 top-3 h-11 w-11"
            : cn(
                "opacity-100 [@media(hover:hover)]:opacity-0 group-hover/manual-day:opacity-100 group-focus-within/manual-day:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
                layout === "month" ? "right-2 top-2" : "right-3 top-3",
              ),
        )}
        iconOnly
        size={layout === "mobile" ? "sm" : "xs"}
        variant="ghost"
      >
        <Icon name="plus" size="sm" decorative />
      </HitoButton>
    </ManualWorkoutAddMenu>
  );
}

function CalendarFeedbackMarker({
  calendar = false,
  state,
}: {
  calendar?: boolean;
  state: "evidence_attached" | "feedback_ready";
}) {
  const locale = useHitoUiLocale();
  const label = state === "evidence_attached" ? "Evidence" : "Feedback";

  return (
    <span
      className={cn("hito-feedback-marker", calendar && "hito-calendar-feedback-marker")}
      data-state={state}
    >
      <span className="hito-feedback-marker-dot" />
      {!calendar ? <span>{getHitoKnownProductMessage(locale, label)}</span> : null}
    </span>
  );
}
