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
import { Icon } from "@/components/ui/icon";
import { HitoCalendarDayCell, HitoWorkoutDayRow } from "@/components/ui/hito-calendar-day";
import {
  buildCalendarDayProjection,
  buildRestCalendarDayPresentation,
  buildWorkoutCalendarDayPresentation,
  calendarDateIsBeforePlanStart,
  calendarMoveTargetAction,
  calendarMoveUndoAction,
  calendarTargetButtonAriaLabel,
  resolveCalendarMoveDateRender,
  type CalendarDaySurfacePresentation,
  type CalendarDaySlotLayout,
} from "@/components/calendar/calendar-projection";
import {
  manualMoveSourceDragProps,
  manualMoveTargetDragProps,
  useManualCalendarActions,
  type ManualCalendarActionState,
} from "@/components/calendar/manual-calendar-actions";
import {
  displayWorkoutTargetReadbackEntries,
  formatDistanceKm,
  formatDurationMin,
  workoutDuration,
  workoutDistanceKm,
  workoutStatusLabel,
  workoutTypeMeta,
  weekdayShort,
  formatDate,
  type TrainingSnapshot,
  type Workout,
} from "@/lib/training";
import {
  ManualWorkoutAddMenu,
  ManualWorkoutSourceActionMenu,
} from "@/components/manual-workout/ManualWorkoutAuthoringControls";
import { ManualWorkoutMoveController } from "@/components/manual-workout/ManualWorkoutMoveControls";

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

export function Calendar({ snapshot }: { snapshot: TrainingSnapshot }) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date(`${snapshot.currentDate}T00:00:00`));
  const [tooltipAnchor, setTooltipAnchor] = useState<TooltipAnchor | null>(null);
  const { manualCalendarActionState, manualMoveControllerProps } = useManualCalendarActions(
    snapshot,
    {
      onCalendarRefresh: () => router.invalidate(),
      onResetTransientUi: () => setTooltipAnchor(null),
    },
  );

  const cells = useMemo(() => buildMonth(cursor), [cursor]);
  const mobileMonthDates = useMemo(() => buildMonthDays(cursor), [cursor]);
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const tooltipWorkout = tooltipAnchor
    ? (resolveCalendarMoveDateRender(
        snapshot.workouts,
        tooltipAnchor.iso,
        manualCalendarActionState.optimisticMove,
      ).workout ?? null)
    : null;

  const weekCells = useMemo(() => {
    const date = new Date(cursor);
    const day = (date.getDay() + 6) % 7;
    const monday = new Date(date);
    monday.setDate(date.getDate() - day);
    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(monday);
      current.setDate(monday.getDate() + index);
      return current.toISOString().slice(0, 10);
    });
  }, [cursor]);

  function shift(amount: number) {
    const date = new Date(cursor);
    if (view === "month") date.setMonth(date.getMonth() + amount);
    else date.setDate(date.getDate() + amount * 7);
    setCursor(date);
    setTooltipAnchor(null);
  }

  return (
    <div>
      <ManualWorkoutMoveController {...manualMoveControllerProps} />

      <div className="hito-section-header mb-6">
        <div>
          <h1 className="hito-section-title text-4xl lg:text-5xl">{monthLabel}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="hito-choice-toggle-group" aria-label="Calendar view">
            <button
              type="button"
              onClick={() => setView("month")}
              data-selected={view === "month"}
              aria-pressed={view === "month"}
              className="hito-choice-toggle hito-choice-toggle-sm"
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              data-selected={view === "week"}
              aria-pressed={view === "week"}
              className="hito-choice-toggle hito-choice-toggle-sm"
            >
              Week
            </button>
          </div>
          <button
            onClick={() => shift(-1)}
            className="hito-button hito-button-secondary hito-button-sm aspect-square p-0"
          >
            <Icon name="chevron-left" size="sm" />
          </button>
          <button
            onClick={() => {
              setCursor(new Date(`${snapshot.currentDate}T00:00:00`));
              setTooltipAnchor(null);
            }}
            className="hito-button hito-button-secondary hito-button-sm"
          >
            Today
          </button>
          <button
            onClick={() => shift(1)}
            className="hito-button hito-button-secondary hito-button-sm aspect-square p-0"
          >
            <Icon name="chevron-right" size="sm" />
          </button>
        </div>
      </div>

      {view === "month" ? (
        <>
          <div className="hidden border-b border-hairline lg:block">
            <div className="hito-calendar-grid hito-calendar-grid-month">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="hito-calendar-grid-heading hito-micro-label">
                  {day}
                </div>
              ))}
              {cells.map((iso, index) => (
                <DayCell
                  key={index}
                  iso={iso}
                  inMonth={
                    iso ? new Date(`${iso}T00:00:00`).getMonth() === cursor.getMonth() : false
                  }
                  manualCalendarActionState={manualCalendarActionState}
                  onTooltipChange={setTooltipAnchor}
                  snapshot={snapshot}
                />
              ))}
            </div>
          </div>
          <MobileMonthList
            dates={mobileMonthDates}
            manualCalendarActionState={manualCalendarActionState}
            snapshot={snapshot}
          />
        </>
      ) : (
        <WeekStrip
          dates={weekCells}
          manualCalendarActionState={manualCalendarActionState}
          snapshot={snapshot}
        />
      )}

      {tooltipAnchor && tooltipWorkout ? (
        <CalendarTooltipLayer anchor={tooltipAnchor}>
          <Tooltip workout={tooltipWorkout} />
        </CalendarTooltipLayer>
      ) : null}
    </div>
  );
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
  snapshot,
}: {
  dates: string[];
  manualCalendarActionState: ManualCalendarActionState;
  snapshot: TrainingSnapshot;
}) {
  const visibleDates = dates.filter((iso) => !calendarDateIsBeforePlanStart(iso, snapshot));

  return (
    <div className="hito-calendar-mobile-list lg:hidden">
      {visibleDates.map((iso) => (
        <CalendarDaySlot
          key={iso}
          iso={iso}
          layout="mobile"
          manualCalendarActionState={manualCalendarActionState}
          snapshot={snapshot}
        />
      ))}
    </div>
  );
}

function buildMonthDays(cursor: Date): string[] {
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), index + 1);
    return date.toISOString().slice(0, 10);
  });
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

function buildMonth(cursor: Date): (string | null)[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [];

  for (let index = startOffset; index > 0; index -= 1) {
    const date = new Date(first);
    date.setDate(first.getDate() - index);
    cells.push(date.toISOString().slice(0, 10));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    cells.push(date.toISOString().slice(0, 10));
  }

  while (cells.length % 7 !== 0) {
    const last = new Date(`${cells[cells.length - 1]}T00:00:00`);
    last.setDate(last.getDate() + 1);
    cells.push(last.toISOString().slice(0, 10));
  }

  return cells;
}

function DayCell({
  iso,
  inMonth,
  manualCalendarActionState,
  onTooltipChange,
  snapshot,
}: {
  iso: string | null;
  inMonth: boolean;
  manualCalendarActionState: ManualCalendarActionState;
  onTooltipChange: (value: TooltipAnchor | null) => void;
  snapshot: TrainingSnapshot;
}) {
  if (!iso) {
    return <CalendarSlotPlaceholder />;
  }
  if (calendarDateIsBeforePlanStart(iso, snapshot)) {
    return <CalendarSlotPlaceholder />;
  }

  return (
    <CalendarDaySlot
      inMonth={inMonth}
      iso={iso}
      layout="month"
      manualCalendarActionState={manualCalendarActionState}
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
  onTooltipChange,
  snapshot,
}: {
  inMonth?: boolean;
  iso: string;
  layout: CalendarDaySlotLayout;
  manualCalendarActionState: ManualCalendarActionState;
  onTooltipChange?: (value: TooltipAnchor | null) => void;
  snapshot: TrainingSnapshot;
}) {
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
          pendingLabel={pendingMoveTarget ? "Moving" : undefined}
          presentation={
            pendingMoveTarget
              ? presentation
              : buildRestCalendarDayPresentation({ stateLabel: "Rest" })
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
        ariaLabel={`Undo move for ${undoAction.title}. ${manualCalendarActionState.undoSecondsRemaining} seconds remaining.`}
        layout={layout}
        onClick={() => manualCalendarActionState.onUndoLastMove(undoAction)}
      >
        <CalendarDaySurface
          action={calendarMoveUndoAction(manualCalendarActionState.undoSecondsRemaining)}
          interactive
          iso={iso}
          layout={layout}
          presentation={buildRestCalendarDayPresentation({ stateLabel: "Rest" })}
          today={iso === snapshot.currentDate}
        />
      </CalendarDayButton>
    );
  }

  if (addAction) {
    const content = (
      <ManualWorkoutAddMenu
        activePlanId={addAction.activePlanId}
        activePlanSourceKind={addAction.activePlanSourceKind}
        copiedWorkoutSource={manualCalendarActionState.copiedWorkoutSource}
        date={iso}
        moveTargetDayKind={addAction.moveTargetDayKind}
        moveOnly={addAction.moveOnly}
        moveWorkoutSource={canMoveHere ? manualCalendarActionState.moveWorkoutSource : null}
        onAdded={manualCalendarActionState.onManualPlanChanged}
        onMoveCanceled={manualCalendarActionState.onCancelMoveWorkout}
        onMoveTargetSelected={manualCalendarActionState.onMoveTargetSelected}
        showRestDayOption={workout?.type !== "rest"}
      >
        <CalendarDayButton
          ariaLabel={calendarTargetButtonAriaLabel(iso, canMoveHere, addAction.moveTargetDayKind)}
          layout={layout}
          {...manualMoveTargetDragProps(canMoveHere, iso, manualCalendarActionState)}
        >
          <CalendarDaySurface
            action={
              canMoveHere
                ? calendarMoveTargetAction(addAction.moveTargetDayKind)
                : {
                    label: "Add workout",
                    icon: "plus" as const,
                    trailingIcon: "chevron-down" as const,
                    tone: "muted" as const,
                    visual: "button" as const,
                    ariaLabel: "Add workout",
                  }
            }
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
      {...manualMoveSourceDragProps(sourceAction, manualCalendarActionState)}
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
                  label: "Move",
                  icon: "arrow-right" as const,
                  tone: "signal" as const,
                  ariaLabel: "Drag to move selected workout",
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
              ? "hito-calendar-mobile-feedback-marker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/20"
              : cn(
                  "absolute z-20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/20",
                  layout === "week" ? "bottom-4 right-4" : "bottom-2.5 right-2.5",
                )
          }
          aria-label={`${feedbackMeta.label}. Open workout feedback.`}
        >
          <CalendarFeedbackMarker calendar={layout === "month"} state={feedbackMeta.state} />
        </Link>
      ) : null}

      {sourceAction ? (
        <ManualWorkoutSourceActionMenu
          activePlanId={sourceAction.activePlanId}
          canCopy={sourceAction.canDirectCopy}
          canClear={sourceAction.canRequestClearReview}
          canMove={sourceAction.canDirectMove}
          onCleared={manualCalendarActionState.onManualPlanChanged}
          onCopy={manualCalendarActionState.onCopyWorkout}
          onMove={manualCalendarActionState.onMoveWorkout}
          sourceWorkoutDate={sourceAction.sourceWorkoutDate}
          sourceWorkoutId={sourceAction.sourceWorkoutId}
          title={sourceAction.title}
        >
          <button
            type="button"
            className={cn(
              "hito-button hito-button-ghost hito-button-xs absolute z-30 aspect-square p-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/25",
              sourceActionMobile
                ? "right-3 top-3"
                : "opacity-0 transition-opacity group-hover/manual-day:opacity-100 focus-visible:opacity-100",
              layout === "month" && "right-2 top-2",
              layout === "week" && "right-3 top-3",
            )}
            aria-label={`More activity actions for ${sourceAction.title}`}
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
          "block w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/25",
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
  if (layout === "mobile") {
    return (
      <HitoWorkoutDayRow
        {...presentation}
        action={action}
        className={className}
        date={{ eyebrow: weekdayShort(iso), day: iso.slice(8) }}
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
      {...presentation}
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
      weekday={layout === "week" ? weekdayShort(iso) : undefined}
    />
  );
}

function CalendarSlotPlaceholder({ week = false }: { week?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "hito-calendar-slot-placeholder",
        week && "hito-calendar-slot-placeholder-week",
      )}
    />
  );
}

function Tooltip({ workout }: { workout: Workout }) {
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
        <span className="hito-label" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="hito-micro-label">
          {formatDate(workout.date, { month: "short", day: "numeric", weekday: "short" })}
        </span>
      </div>
      <div className="hito-tooltip-title mt-2 font-display text-lg">{workout.title}</div>
      <div className="hito-metric-row mt-3 grid-cols-3">
        <Stat label="Distance" value={km != null ? `${formatDistanceKm(km)} km` : "—"} />
        <Stat label="Duration" value={duration ? formatDurationMin(duration) : "—"} />
        <Stat label="Status" value={workoutStatusLabel(workout.status)} />
      </div>
      {readbackEntries.length > 0 && (
        <div className="hito-caption mt-3 space-y-0.5 border-t border-hairline pt-3">
          {readbackEntries.map((entry) => (
            <div key={entry.key} className="flex justify-between gap-3">
              <span className="hito-metric-label">{entry.label}</span>
              <span className="text-foreground/80 truncate">{entry.value}</span>
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
      <div className="hito-technical-mono capitalize">{value}</div>
      <div className="hito-metric-label">{label}</div>
    </div>
  );
}

function WeekStrip({
  dates,
  manualCalendarActionState,
  snapshot,
}: {
  dates: string[];
  manualCalendarActionState: ManualCalendarActionState;
  snapshot: TrainingSnapshot;
}) {
  return (
    <div className="hito-calendar-grid-month grid grid-cols-1 border-b border-hairline lg:grid-cols-7">
      {dates.map((iso) => {
        if (calendarDateIsBeforePlanStart(iso, snapshot)) {
          return <CalendarSlotPlaceholder key={iso} week />;
        }

        return (
          <CalendarDaySlot
            key={iso}
            iso={iso}
            layout="week"
            manualCalendarActionState={manualCalendarActionState}
            snapshot={snapshot}
          />
        );
      })}
    </div>
  );
}

function CalendarFeedbackMarker({
  calendar = false,
  state,
}: {
  calendar?: boolean;
  state: "evidence_attached" | "feedback_ready";
}) {
  const label = state === "evidence_attached" ? "Evidence" : "Feedback";

  return (
    <span
      className={cn("hito-feedback-marker", calendar && "hito-calendar-feedback-marker")}
      data-state={state}
    >
      <span className="hito-feedback-marker-dot" />
      {!calendar ? <span>{label}</span> : null}
    </span>
  );
}
