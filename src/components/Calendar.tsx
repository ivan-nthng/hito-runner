import {
  type DragEvent,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
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
  buildRestCalendarDayPresentation,
  buildWorkoutCalendarDayPresentation,
} from "@/components/calendar/calendar-day-presentation";
import {
  displayWorkoutTargetReadbackEntries,
  feedbackMarkerMeta,
  formatDistanceKm,
  formatDurationMin,
  workoutDuration,
  workoutDistanceKm,
  workoutTypeMeta,
  findWorkout,
  weekdayShort,
  weekdayLong,
  formatDate,
  type TrainingSnapshot,
  type Workout,
} from "@/lib/training";
import {
  ManualWorkoutAddMenu,
  ManualWorkoutSourceActionMenu,
  type ManualCopiedWorkoutSource,
} from "@/components/manual-workout/ManualWorkoutAuthoringControls";
import {
  ManualWorkoutMoveController,
  type ManualWorkoutMoveRequest,
} from "@/components/manual-workout/ManualWorkoutMoveControls";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "@/lib/manual-workout-authoring/schema";
import type {
  ManualWorkoutDirectMoveResult,
  ManualWorkoutMoveTargetDayKind,
} from "@/lib/manual-workout-authoring";

type View = "month" | "week";
type TooltipAnchor = {
  iso: string;
  rect: Pick<DOMRect, "bottom" | "height" | "left" | "right" | "top" | "width">;
};
type TooltipPosition = {
  left: number;
  top: number;
};
type ManualCalendarActionState = {
  copiedWorkoutSource: ManualCopiedWorkoutSource | null;
  lastMoveUndo: ManualMoveUndoAffordance | null;
  movePending: boolean;
  optimisticMove: ManualOptimisticMoveDisplay | null;
  undoSecondsRemaining: number;
  moveHoverDate: string | null;
  moveWorkoutSource: ManualCopiedWorkoutSource | null;
  onCancelMoveWorkout: () => void;
  onCopyWorkout: (source: ManualCopiedWorkoutSource) => void;
  onMoveDragEnd: () => void;
  onMoveTargetHover: (targetDate: string | null) => void;
  onManualPlanChanged: () => Promise<void>;
  onMoveTargetSelected: (targetDate: string, source?: ManualCopiedWorkoutSource | null) => void;
  onMoveWorkout: (source: ManualCopiedWorkoutSource) => void;
  onUndoLastMove: (undo: ManualMoveUndoAffordance) => void;
};
type ManualWorkoutCalendarActionContext = ManualCopiedWorkoutSource & {
  canDirectCopy: boolean;
  canDirectMove: boolean;
  canDragInitiate: boolean;
  canRequestClearReview: boolean;
};
type ManualWorkoutMoveTargetHint = {
  canAcceptMoveTarget: boolean;
  dayKind: ManualWorkoutMoveTargetDayKind;
};
type ManualOptimisticMoveDisplay = {
  requestId: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetDate: string;
  workout: Workout;
};
type ManualMoveUndoAffordance = {
  activePlanId: string;
  displayDate: string;
  expiresAt: number;
  id: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetDate: string;
  title: string;
};
type ManualWorkoutDirectMoveSuccess = Extract<ManualWorkoutDirectMoveResult, { ok: true }>;
type ManualMoveDateRender = {
  isPendingMoveSource: boolean;
  isPendingMoveTarget: boolean;
  workout: Workout | undefined;
};

const MANUAL_MOVE_UNDO_WINDOW_MS = 7000;
const TOOLTIP_VIEWPORT_MARGIN = 12;
const TOOLTIP_ANCHOR_GAP = 10;

export function Calendar({ snapshot }: { snapshot: TrainingSnapshot }) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date(`${snapshot.currentDate}T00:00:00`));
  const [tooltipAnchor, setTooltipAnchor] = useState<TooltipAnchor | null>(null);
  const [manualCopySource, setManualCopySource] = useState<ManualCopiedWorkoutSource | null>(null);
  const [manualMoveSource, setManualMoveSource] = useState<ManualCopiedWorkoutSource | null>(null);
  const [manualMoveRequest, setManualMoveRequest] = useState<ManualWorkoutMoveRequest | null>(null);
  const [manualMoveHoverDate, setManualMoveHoverDate] = useState<string | null>(null);
  const [manualOptimisticMove, setManualOptimisticMove] =
    useState<ManualOptimisticMoveDisplay | null>(null);
  const [lastMoveUndo, setLastMoveUndo] = useState<ManualMoveUndoAffordance | null>(null);
  const [lastMoveUndoNow, setLastMoveUndoNow] = useState(() => Date.now());

  const cells = useMemo(() => buildMonth(cursor), [cursor]);
  const mobileMonthDates = useMemo(() => buildMonthDays(cursor), [cursor]);
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const undoSecondsRemaining = lastMoveUndo
    ? Math.max(0, Math.ceil((lastMoveUndo.expiresAt - lastMoveUndoNow) / 1000))
    : 0;
  const tooltipWorkout = tooltipAnchor
    ? (resolveManualMoveDateRender(snapshot.workouts, tooltipAnchor.iso, manualOptimisticMove)
        .workout ?? null)
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

  useEffect(() => {
    if (!manualOptimisticMove) return;
    if (snapshotReflectsManualMove(snapshot.workouts, manualOptimisticMove)) {
      setManualOptimisticMove(null);
    }
  }, [manualOptimisticMove, snapshot.workouts]);

  useEffect(() => {
    if (!lastMoveUndo) return;

    setLastMoveUndoNow(Date.now());
    const timer = window.setInterval(() => setLastMoveUndoNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lastMoveUndo]);

  useEffect(() => {
    if (!lastMoveUndo || lastMoveUndo.expiresAt > lastMoveUndoNow) return;
    setLastMoveUndo(null);
  }, [lastMoveUndo, lastMoveUndoNow]);

  function shift(amount: number) {
    const date = new Date(cursor);
    if (view === "month") date.setMonth(date.getMonth() + amount);
    else date.setDate(date.getDate() + amount * 7);
    setCursor(date);
    setTooltipAnchor(null);
  }

  async function refreshAfterManualPlanChange() {
    setTooltipAnchor(null);
    setManualMoveSource(null);
    setManualMoveRequest(null);
    setManualMoveHoverDate(null);
    setManualOptimisticMove(null);
    setLastMoveUndo(null);
    await router.invalidate();
  }

  async function refreshAfterManualMoveSuccess() {
    setTooltipAnchor(null);
    setManualMoveSource(null);
    setManualMoveRequest(null);
    setManualMoveHoverDate(null);
    await router.invalidate();
  }

  function recordDirectManualMoveUndo(result: ManualWorkoutDirectMoveSuccess) {
    if (result.targetDayKind !== "rest_day") return;

    const now = Date.now();

    setLastMoveUndoNow(now);
    setLastMoveUndo({
      activePlanId: result.activePlanId,
      displayDate: result.sourceWorkoutDate,
      expiresAt: now + MANUAL_MOVE_UNDO_WINDOW_MS,
      id: `${result.plannedWorkoutId}:${result.sourceWorkoutDate}:${result.targetDate}:${now}`,
      sourceWorkoutDate: result.targetDate,
      sourceWorkoutId: result.plannedWorkoutId,
      targetDate: result.sourceWorkoutDate,
      title: result.title,
    });
  }

  function projectManualOptimisticMove({
    requestId,
    sourceWorkoutDate,
    sourceWorkoutId,
    targetDate,
  }: Pick<
    ManualOptimisticMoveDisplay,
    "requestId" | "sourceWorkoutDate" | "sourceWorkoutId" | "targetDate"
  >) {
    const sourceWorkout = snapshot.workouts.find(
      (workout) => workout.id === sourceWorkoutId && workout.date === sourceWorkoutDate,
    );
    if (!sourceWorkout) return;

    setManualOptimisticMove({
      requestId,
      sourceWorkoutDate,
      sourceWorkoutId,
      targetDate,
      workout: sourceWorkout,
    });
  }

  function requestManualWorkoutMove(
    targetDate: string,
    sourceOverride?: ManualCopiedWorkoutSource | null,
  ) {
    const moveSource = sourceOverride ?? manualMoveSource;

    if (!moveSource || manualMoveRequest || manualOptimisticMove) return;

    const sourceWorkout = snapshot.workouts.find(
      (workout) =>
        workout.id === moveSource.sourceWorkoutId && workout.date === moveSource.sourceWorkoutDate,
    );
    if (!sourceWorkout) return;

    const requestId = `${moveSource.sourceWorkoutId}:${targetDate}:${Date.now()}`;
    const targetDayKind = resolveManualMoveTargetDayKind(snapshot.workouts, targetDate, moveSource);

    setLastMoveUndo(null);
    setManualMoveRequest({
      ...moveSource,
      targetDayKind,
      targetDate,
      requestId,
    });
    if (targetDayKind !== "workout_day") {
      projectManualOptimisticMove({
        requestId,
        sourceWorkoutDate: moveSource.sourceWorkoutDate,
        sourceWorkoutId: moveSource.sourceWorkoutId,
        targetDate,
      });
    }
    setManualMoveSource(null);
    setManualMoveHoverDate(null);
  }

  function undoLastManualMove(undo: ManualMoveUndoAffordance) {
    if (manualMoveRequest || manualOptimisticMove) return;

    setLastMoveUndo(null);
    requestManualWorkoutMove(undo.targetDate, {
      activePlanId: undo.activePlanId,
      sourceWorkoutDate: undo.sourceWorkoutDate,
      sourceWorkoutId: undo.sourceWorkoutId,
      title: undo.title,
    });
  }

  const manualCalendarActionState: ManualCalendarActionState = {
    copiedWorkoutSource: manualCopySource,
    lastMoveUndo,
    movePending: Boolean(manualMoveRequest || manualOptimisticMove),
    optimisticMove: manualOptimisticMove,
    undoSecondsRemaining,
    moveHoverDate: manualMoveHoverDate,
    moveWorkoutSource: manualMoveSource,
    onCancelMoveWorkout: () => {
      setManualMoveSource(null);
      setManualMoveHoverDate(null);
    },
    onCopyWorkout: (source) => {
      setLastMoveUndo(null);
      setManualCopySource(source);
    },
    onMoveDragEnd: () => setManualMoveHoverDate(null),
    onMoveTargetHover: setManualMoveHoverDate,
    onManualPlanChanged: refreshAfterManualPlanChange,
    onMoveTargetSelected: requestManualWorkoutMove,
    onMoveWorkout: (source) => {
      if (manualMoveRequest || manualOptimisticMove) return;

      setLastMoveUndo(null);
      setManualMoveSource(source);
      setManualMoveHoverDate(null);
    },
    onUndoLastMove: undoLastManualMove,
  };

  return (
    <div>
      <ManualWorkoutMoveController
        onMoved={refreshAfterManualMoveSuccess}
        onRequestHandled={() => {
          setManualMoveRequest(null);
        }}
        onOptimisticMoveRejected={() => setManualOptimisticMove(null)}
        onDirectMoveSucceeded={recordDirectManualMoveUndo}
        onReplacementConfirming={(review) =>
          projectManualOptimisticMove({
            requestId: `replacement:${review.sourceWorkoutId}:${review.targetDate}:${review.review.reviewChecksum}`,
            sourceWorkoutDate: review.sourceWorkoutDate,
            sourceWorkoutId: review.sourceWorkoutId,
            targetDate: review.targetDate,
          })
        }
        request={manualMoveRequest}
      />

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
  const visibleDates = dates.filter((iso) => !isBeforePlanStart(iso, snapshot));

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
  if (isBeforePlanStart(iso, snapshot)) {
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

type CalendarDaySlotLayout = "mobile" | "month" | "week";

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
  const moveRender = resolveManualMoveDateRender(
    snapshot.workouts,
    iso,
    manualCalendarActionState.optimisticMove,
  );
  const workout = moveRender.workout;
  const feedbackMeta = workout ? feedbackMarkerMeta(workout.feedbackMarker) : null;
  const hasWorkout = Boolean(workout && workout.type !== "rest");
  const presentation = buildWorkoutCalendarDayPresentation(workout, {
    includeRestTitle: layout === "mobile",
  });
  const canExposeManualActions =
    (layout !== "month" || inMonth) && !manualCalendarActionState.movePending;
  const manualAddContext = canExposeManualActions
    ? getManualAddContext(snapshot, iso, workout, manualCalendarActionState.moveWorkoutSource)
    : null;
  const undoMove = resolveManualMoveUndoForDate(snapshot, iso, manualCalendarActionState);

  const pendingMoveTarget = moveRender.isPendingMoveTarget && workout;
  if (pendingMoveTarget || moveRender.isPendingMoveSource) {
    return (
      <div
        className={layout === "month" ? "relative h-full min-w-0" : undefined}
        aria-live="polite"
      >
        <CalendarDaySurface
          iso={iso}
          layout={layout}
          pendingLabel={pendingMoveTarget ? "Saving" : undefined}
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

  if (undoMove) {
    return (
      <CalendarDayButton
        ariaLabel={`Undo move for ${undoMove.title}. ${manualCalendarActionState.undoSecondsRemaining} seconds remaining.`}
        layout={layout}
        onClick={() => manualCalendarActionState.onUndoLastMove(undoMove)}
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

  if (manualAddContext) {
    const canMoveHere =
      manualAddContext.canAcceptMoveTarget &&
      canMoveToManualTarget(manualCalendarActionState, manualAddContext.activePlanId, iso);
    const content = (
      <ManualWorkoutAddMenu
        activePlanId={manualAddContext.activePlanId}
        activePlanSourceKind={manualAddContext.activePlanSourceKind}
        copiedWorkoutSource={manualCalendarActionState.copiedWorkoutSource}
        date={iso}
        moveTargetDayKind={manualAddContext.moveTargetDayKind}
        moveOnly={manualAddContext.moveOnly}
        moveWorkoutSource={canMoveHere ? manualCalendarActionState.moveWorkoutSource : null}
        onAdded={manualCalendarActionState.onManualPlanChanged}
        onMoveCanceled={manualCalendarActionState.onCancelMoveWorkout}
        onMoveTargetSelected={manualCalendarActionState.onMoveTargetSelected}
        showRestDayOption={workout?.type !== "rest"}
      >
        <CalendarDayButton
          ariaLabel={manualTargetButtonAriaLabel(
            iso,
            canMoveHere,
            manualAddContext.moveTargetDayKind,
          )}
          layout={layout}
          onDragEnter={(event) =>
            handleManualMoveDragEnter(event, canMoveHere, iso, manualCalendarActionState)
          }
          onDragLeave={(event) => handleManualMoveDragLeave(event, iso, manualCalendarActionState)}
          onDragOver={(event) => handleManualMoveDragOver(event, canMoveHere)}
          onDrop={(event) =>
            handleManualMoveDrop(event, canMoveHere, iso, manualCalendarActionState)
          }
        >
          <CalendarDaySurface
            action={
              canMoveHere
                ? calendarMoveTargetAction(manualAddContext.moveTargetDayKind)
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

  const manualCopyContext = canExposeManualActions
    ? getManualCopyContext(snapshot, iso, workout)
    : null;
  const canDragMove = Boolean(manualCopyContext?.canDragInitiate);
  const isMoveSource = manualCalendarActionState.moveWorkoutSource?.sourceWorkoutId === workout?.id;
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
      draggable={canDragMove}
      onDragStart={(event) =>
        handleManualMoveDragStart(event, manualCopyContext, manualCalendarActionState)
      }
      onDragEnd={() => handleManualMoveDragEnd(manualCalendarActionState)}
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

      {manualCopyContext ? (
        <ManualWorkoutSourceActionMenu
          activePlanId={manualCopyContext.activePlanId}
          canCopy={manualCopyContext.canDirectCopy}
          canClear={manualCopyContext.canRequestClearReview}
          canMove={manualCopyContext.canDirectMove}
          onCleared={manualCalendarActionState.onManualPlanChanged}
          onCopy={manualCalendarActionState.onCopyWorkout}
          onMove={manualCalendarActionState.onMoveWorkout}
          sourceWorkoutDate={manualCopyContext.sourceWorkoutDate}
          sourceWorkoutId={manualCopyContext.sourceWorkoutId}
          title={manualCopyContext.title}
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
            aria-label={`More activity actions for ${manualCopyContext.title}`}
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

function CalendarDayButton({
  ariaLabel,
  children,
  layout,
  onClick,
  ...dragHandlers
}: {
  ariaLabel: string;
  children: ReactNode;
  layout: CalendarDaySlotLayout;
  onClick?: () => void;
  onDragEnter?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "block w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/25",
        layout !== "mobile" && "group h-full",
      )}
      aria-label={ariaLabel}
      onClick={onClick}
      {...dragHandlers}
    >
      {children}
    </button>
  );
}

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
  presentation: ReturnType<typeof buildWorkoutCalendarDayPresentation>;
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

function resolveManualMoveDateRender(
  workouts: Workout[],
  iso: string,
  optimisticMove: ManualOptimisticMoveDisplay | null,
): ManualMoveDateRender {
  if (!optimisticMove) {
    return {
      isPendingMoveSource: false,
      isPendingMoveTarget: false,
      workout: findWorkout(workouts, iso),
    };
  }

  if (iso === optimisticMove.sourceWorkoutDate) {
    const persistedSource = findWorkout(workouts, iso);

    return {
      isPendingMoveSource: persistedSource?.id === optimisticMove.sourceWorkoutId,
      isPendingMoveTarget: false,
      workout: persistedSource?.id === optimisticMove.sourceWorkoutId ? undefined : persistedSource,
    };
  }

  if (iso === optimisticMove.targetDate) {
    return {
      isPendingMoveSource: false,
      isPendingMoveTarget: true,
      workout: {
        ...optimisticMove.workout,
        date: optimisticMove.targetDate,
        weekday: weekdayLong(optimisticMove.targetDate),
        status: "upcoming",
      },
    };
  }

  return {
    isPendingMoveSource: false,
    isPendingMoveTarget: false,
    workout: findWorkout(workouts, iso),
  };
}

function snapshotReflectsManualMove(
  workouts: Workout[],
  optimisticMove: ManualOptimisticMoveDisplay,
) {
  const sourceStillHasMovedWorkout = workouts.some(
    (workout) =>
      workout.id === optimisticMove.sourceWorkoutId &&
      workout.date === optimisticMove.sourceWorkoutDate,
  );
  const targetHasMovedWorkout = workouts.some(
    (workout) =>
      workout.id === optimisticMove.sourceWorkoutId && workout.date === optimisticMove.targetDate,
  );

  return !sourceStillHasMovedWorkout && targetHasMovedWorkout;
}

function resolveManualMoveUndoForDate(
  snapshot: TrainingSnapshot,
  iso: string,
  manualCalendarActionState: ManualCalendarActionState,
) {
  const undo = manualCalendarActionState.lastMoveUndo;
  if (
    !undo ||
    manualCalendarActionState.movePending ||
    manualCalendarActionState.undoSecondsRemaining <= 0 ||
    undo.displayDate !== iso
  ) {
    return null;
  }

  const movedWorkout = snapshot.workouts.find(
    (workout) => workout.id === undo.sourceWorkoutId && workout.date === undo.sourceWorkoutDate,
  );
  const undoTargetWorkout = findWorkout(snapshot.workouts, undo.targetDate);
  const undoMoveSource = {
    activePlanId: undo.activePlanId,
    sourceWorkoutDate: undo.sourceWorkoutDate,
    sourceWorkoutId: undo.sourceWorkoutId,
    title: undo.title,
  };

  if (!movedWorkout || movedWorkout.type === "rest" || !movedWorkout.sourceEditing?.canDirectMove) {
    return null;
  }
  if (
    undo.targetDate < snapshot.currentDate ||
    (undo.targetDate === snapshot.currentDate &&
      !canExposeTodayAsManualMoveTarget(snapshot, undo.targetDate, undoMoveSource))
  ) {
    return null;
  }
  if (
    undoTargetWorkout &&
    undoTargetWorkout.id !== undo.sourceWorkoutId &&
    undoTargetWorkout.type !== "rest"
  ) {
    return null;
  }

  return undo;
}

function Tooltip({ workout }: { workout: Workout }) {
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);
  const meta = workoutTypeMeta(workout);
  const status = workout.status;
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
        <Stat label="Status" value={status} />
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
        if (isBeforePlanStart(iso, snapshot)) {
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

function getManualAddContext(
  snapshot: TrainingSnapshot,
  iso: string,
  workout: Workout | undefined,
  moveSource: ManualCopiedWorkoutSource | null,
): {
  activePlanId: string;
  activePlanSourceKind: string;
  canAcceptMoveTarget: boolean;
  moveTargetDayKind: ManualWorkoutMoveTargetDayKind;
  moveOnly: boolean;
} | null {
  const planMeta = snapshot.planMeta;

  const addCapability = planMeta?.workoutEditing?.addWorkout;
  const moveCapability = planMeta?.workoutEditing?.moveWorkout;
  const moveTargetHint = resolveManualMoveTargetHint(snapshot, iso, workout, moveSource);
  const canUseAsManualAddTarget = !workout || workout.type === "rest";
  const canAddWorkout =
    Boolean(addCapability?.allowed) &&
    canUseAsManualAddTarget &&
    iso >= snapshot.currentDate &&
    !isBeforePlanStart(iso, snapshot);
  const canAcceptMoveTarget =
    Boolean(moveCapability?.allowed) && moveTargetHint.canAcceptMoveTarget;

  if (!planMeta?.id || (!canAddWorkout && !canAcceptMoveTarget)) {
    return null;
  }

  const activePlanSourceKind =
    addCapability?.allowed === true
      ? addCapability.sourceKind
      : moveCapability?.allowed === true
        ? moveCapability.sourceKind
        : MANUAL_USER_BUILT_PLAN_SOURCE_KIND;

  return {
    activePlanId: planMeta.id,
    activePlanSourceKind,
    canAcceptMoveTarget,
    moveTargetDayKind: moveTargetHint.dayKind,
    moveOnly: !canAddWorkout,
  };
}

function resolveManualMoveTargetHint(
  snapshot: TrainingSnapshot,
  iso: string,
  workout: Workout | undefined,
  moveSource: ManualCopiedWorkoutSource | null,
): ManualWorkoutMoveTargetHint {
  const dayKind = resolveManualMoveTargetDayKindFromWorkout(workout);

  if (!moveSource || isBeforePlanStart(iso, snapshot) || moveSource.sourceWorkoutDate === iso) {
    return { canAcceptMoveTarget: false, dayKind };
  }

  if (!workout) {
    return {
      canAcceptMoveTarget:
        iso > snapshot.currentDate || canExposeTodayAsManualMoveTarget(snapshot, iso, moveSource),
      dayKind,
    };
  }

  if (iso <= snapshot.currentDate) {
    return { canAcceptMoveTarget: false, dayKind };
  }

  if (workout.type === "rest") {
    return { canAcceptMoveTarget: true, dayKind };
  }

  return {
    canAcceptMoveTarget: Boolean(workout.sourceEditing?.canClear),
    dayKind,
  };
}

function resolveManualMoveTargetDayKindFromWorkout(
  workout: Workout | undefined,
): ManualWorkoutMoveTargetDayKind {
  if (!workout || workout.type === "rest") return "rest_day";
  return "workout_day";
}

function resolveManualMoveTargetDayKind(
  workouts: Workout[],
  targetDate: string,
  moveSource: ManualCopiedWorkoutSource,
): ManualWorkoutMoveTargetDayKind {
  return resolveManualMoveTargetDayKindFromWorkout(
    workouts.find(
      (workout) => workout.date === targetDate && workout.id !== moveSource.sourceWorkoutId,
    ),
  );
}

function getManualCopyContext(
  snapshot: TrainingSnapshot,
  iso: string,
  workout: Workout | undefined,
): ManualWorkoutCalendarActionContext | null {
  const planMeta = snapshot.planMeta;

  if (!planMeta?.id || !workout || workout.type === "rest") {
    return null;
  }

  const sourceEditing = workout.sourceEditing;
  const canDirectCopy = Boolean(sourceEditing?.canDirectCopy);
  const canDirectMove = Boolean(sourceEditing?.canDirectMove);
  const canDragInitiate = Boolean(sourceEditing?.canDragInitiate);
  const canRequestClearReview = Boolean(
    planMeta.workoutEditing?.clearWorkout.allowed && (sourceEditing?.canClear ?? canDirectMove),
  );

  if (!canDirectCopy && !canRequestClearReview && !canDirectMove && !canDragInitiate) {
    return null;
  }

  return {
    activePlanId: planMeta.id,
    canDirectCopy,
    canDirectMove,
    canDragInitiate,
    canRequestClearReview,
    sourceWorkoutDate: iso,
    sourceWorkoutId: workout.id,
    title: workout.title || workoutTypeMeta(workout).label,
  };
}

function canExposeTodayAsManualMoveTarget(
  snapshot: TrainingSnapshot,
  targetDate: string,
  moveSource: ManualCopiedWorkoutSource | null,
) {
  if (targetDate !== snapshot.currentDate || !moveSource) return false;

  const sourceWorkout = snapshot.workouts.find(
    (workout) =>
      workout.id === moveSource.sourceWorkoutId && workout.date === moveSource.sourceWorkoutDate,
  );

  const sourceEditing = sourceWorkout?.sourceEditing;

  return Boolean(
    sourceEditing?.canDirectMove && sourceEditing.eligibility === "eligible_past_unlogged",
  );
}

function calendarMoveTargetAction(dayKind: ManualWorkoutMoveTargetDayKind) {
  if (dayKind === "workout_day") {
    return {
      label: "Replace",
      icon: "arrow-right" as const,
      tone: "warning" as const,
      ariaLabel: "Review replacement for selected workout",
    };
  }

  return {
    label: "Move",
    icon: "arrow-right" as const,
    tone: "signal" as const,
    ariaLabel: "Move selected workout to rest day",
  };
}

function calendarMoveUndoAction(secondsRemaining: number) {
  return {
    label: `Undo ${secondsRemaining}`,
    icon: "refresh" as const,
    tone: "signal" as const,
    visual: "button" as const,
    alwaysVisible: true,
    showCompactLabel: true,
    ariaLabel: `Undo move. ${secondsRemaining} seconds remaining.`,
  };
}

function manualTargetButtonAriaLabel(
  iso: string,
  canMoveHere: boolean,
  dayKind: ManualWorkoutMoveTargetDayKind,
) {
  const dateLabel = formatDate(iso, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  if (!canMoveHere) return `${dateLabel}. Add workout.`;
  if (dayKind === "workout_day") {
    return `${dateLabel}. Review replacement for selected workout.`;
  }
  return `${dateLabel}. Move selected workout to rest day.`;
}

function canMoveToManualTarget(
  manualCalendarActionState: ManualCalendarActionState,
  activePlanId: string,
  targetDate: string,
) {
  const source = manualCalendarActionState.moveWorkoutSource;

  return Boolean(
    source && source.activePlanId === activePlanId && source.sourceWorkoutDate !== targetDate,
  );
}

function handleManualMoveDragStart(
  event: DragEvent<HTMLElement>,
  context: ManualWorkoutCalendarActionContext | null,
  manualCalendarActionState: ManualCalendarActionState,
) {
  if (!context?.canDragInitiate) return;

  event.stopPropagation();
  manualCalendarActionState.onMoveWorkout(context);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-hito-manual-workout-move", context.sourceWorkoutId);
  event.dataTransfer.setData("text/plain", context.sourceWorkoutId);
  setManualMoveDragImage(event, context);
}

function handleManualMoveDragEnd(manualCalendarActionState: ManualCalendarActionState) {
  manualCalendarActionState.onMoveDragEnd();
}

function handleManualMoveDragEnter(
  event: DragEvent<HTMLElement>,
  canMoveHere: boolean,
  targetDate: string,
  manualCalendarActionState: ManualCalendarActionState,
) {
  if (!canMoveHere) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  manualCalendarActionState.onMoveTargetHover(targetDate);
}

function handleManualMoveDragLeave(
  event: DragEvent<HTMLElement>,
  targetDate: string,
  manualCalendarActionState: ManualCalendarActionState,
) {
  if (manualCalendarActionState.moveHoverDate !== targetDate) return;

  const currentTarget = event.currentTarget;
  const nextTarget = event.relatedTarget;
  if (nextTarget instanceof Node && currentTarget.contains(nextTarget)) return;

  manualCalendarActionState.onMoveTargetHover(null);
}

function handleManualMoveDragOver(event: DragEvent<HTMLElement>, canMoveHere: boolean) {
  if (!canMoveHere) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleManualMoveDrop(
  event: DragEvent<HTMLElement>,
  canMoveHere: boolean,
  targetDate: string,
  manualCalendarActionState: ManualCalendarActionState,
) {
  if (!canMoveHere) return;

  event.preventDefault();
  event.stopPropagation();
  manualCalendarActionState.onMoveTargetHover(null);
  manualCalendarActionState.onMoveTargetSelected(
    targetDate,
    manualCalendarActionState.moveWorkoutSource,
  );
}

function setManualMoveDragImage(
  event: DragEvent<HTMLElement>,
  context: ManualWorkoutCalendarActionContext,
) {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const dragImage = document.createElement("div");
  dragImage.style.position = "fixed";
  dragImage.style.top = "-1000px";
  dragImage.style.left = "-1000px";
  dragImage.style.zIndex = "2147483647";
  dragImage.style.pointerEvents = "none";
  dragImage.className = "hito-calendar-drag-preview";

  const title = document.createElement("div");
  title.className = "hito-calendar-drag-preview-title";
  title.textContent = context.title;

  const meta = document.createElement("div");
  meta.className = "hito-calendar-drag-preview-meta";
  meta.textContent = "Move workout";

  dragImage.append(title, meta);

  document.body.appendChild(dragImage);
  event.dataTransfer.setDragImage(dragImage, 24, 18);
  window.setTimeout(() => dragImage.remove(), 0);
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

function isBeforePlanStart(iso: string, snapshot: TrainingSnapshot) {
  const planStartDate = snapshot.planMeta?.startDate;
  return Boolean(planStartDate && iso < planStartDate);
}
