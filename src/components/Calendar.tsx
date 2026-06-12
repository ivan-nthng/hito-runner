import { type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import {
  HitoCalendarDayCell,
  HitoWorkoutDayRow,
  type HitoCalendarDayBaseState,
  type HitoCalendarDayResultState,
  type HitoCalendarWorkoutIdentity,
} from "@/components/ui/hito-calendar-day";
import { workoutGlyphKind } from "@/lib/workout-glyph";
import {
  displayExecutableTargetEntries,
  displayWorkoutStructureEntries,
  feedbackMarkerMeta,
  formatDistanceKm,
  formatDurationMin,
  workoutDuration,
  workoutDistanceKm,
  workoutTypeMeta,
  primaryWorkoutTarget,
  findWorkout,
  weekdayShort,
  formatDate,
  type Status,
  type TrainingSnapshot,
  type Workout,
} from "@/lib/training";
import {
  ManualWorkoutAddMenu,
  ManualWorkoutCopyMenu,
  type ManualCopiedWorkoutSource,
} from "@/components/manual-workout/ManualWorkoutAuthoringControls";
import {
  ManualWorkoutMoveController,
  type ManualWorkoutMoveRequest,
} from "@/components/manual-workout/ManualWorkoutMoveControls";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "@/lib/manual-workout-authoring/schema";

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
  moveWorkoutSource: ManualCopiedWorkoutSource | null;
  onCancelMoveWorkout: () => void;
  onCopyWorkout: (source: ManualCopiedWorkoutSource) => void;
  onManualPlanChanged: () => Promise<void>;
  onMoveTargetSelected: (targetDate: string) => void;
  onMoveWorkout: (source: ManualCopiedWorkoutSource) => void;
};
type ManualWorkoutCalendarActionContext = ManualCopiedWorkoutSource & {
  canRequestClearReview: boolean;
  canRequestMoveReview: boolean;
};

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

  const cells = useMemo(() => buildMonth(cursor), [cursor]);
  const mobileMonthDates = useMemo(() => buildMonthDays(cursor), [cursor]);
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const tooltipWorkout = tooltipAnchor
    ? (findWorkout(snapshot.workouts, tooltipAnchor.iso) ?? null)
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

  async function refreshAfterManualPlanChange() {
    setTooltipAnchor(null);
    setManualMoveSource(null);
    setManualMoveRequest(null);
    await router.invalidate();
  }

  function requestManualWorkoutMove(targetDate: string) {
    if (!manualMoveSource) return;

    setManualMoveRequest({
      ...manualMoveSource,
      targetDate,
      requestId: `${manualMoveSource.sourceWorkoutId}:${targetDate}:${Date.now()}`,
    });
  }

  const manualCalendarActionState: ManualCalendarActionState = {
    copiedWorkoutSource: manualCopySource,
    moveWorkoutSource: manualMoveSource,
    onCancelMoveWorkout: () => setManualMoveSource(null),
    onCopyWorkout: setManualCopySource,
    onManualPlanChanged: refreshAfterManualPlanChange,
    onMoveTargetSelected: requestManualWorkoutMove,
    onMoveWorkout: setManualMoveSource,
  };

  return (
    <div>
      <ManualWorkoutMoveController
        onMoved={refreshAfterManualPlanChange}
        onRequestHandled={() => setManualMoveRequest(null)}
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
      {visibleDates.map((iso) => {
        const workout = findWorkout(snapshot.workouts, iso);
        const isToday = iso === snapshot.currentDate;
        const status = workout?.status ?? "rest";
        const feedbackMeta = workout ? feedbackMarkerMeta(workout.feedbackMarker) : null;
        const hasWorkout = workout && workout.type !== "rest";
        const identity = workout ? calendarWorkoutIdentity(workout) : null;
        const baseState = calendarBaseState(workout);
        const manualAddContext = getManualAddContext(snapshot, iso, workout);

        if (manualAddContext) {
          const canMoveHere = canMoveToManualTarget(
            manualCalendarActionState,
            manualAddContext.activePlanId,
            iso,
          );

          return (
            <ManualWorkoutAddMenu
              key={iso}
              activePlanId={manualAddContext.activePlanId}
              activePlanSourceKind={manualAddContext.activePlanSourceKind}
              copiedWorkoutSource={manualCalendarActionState.copiedWorkoutSource}
              date={iso}
              moveWorkoutSource={manualCalendarActionState.moveWorkoutSource}
              onAdded={manualCalendarActionState.onManualPlanChanged}
              onMoveCanceled={manualCalendarActionState.onCancelMoveWorkout}
              onMoveTargetSelected={manualCalendarActionState.onMoveTargetSelected}
            >
              <button
                type="button"
                className="block w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/25"
                aria-label={`${weekdayShort(iso)} ${iso.slice(8)}. Add activity.`}
                onDragOver={(event) => handleManualMoveDragOver(event, canMoveHere)}
                onDrop={(event) =>
                  handleManualMoveDrop(event, canMoveHere, iso, manualCalendarActionState)
                }
              >
                <HitoWorkoutDayRow
                  action={canMoveHere ? calendarMoveTargetAction() : calendarAddAction()}
                  date={{ eyebrow: weekdayShort(iso), day: iso.slice(8) }}
                  interactive
                  state="empty"
                  supportingText={canMoveHere ? "Move target" : "Manual user-built plan"}
                  title="No workout planned"
                  today={isToday}
                />
              </button>
            </ManualWorkoutAddMenu>
          );
        }

        const manualCopyContext = getManualCopyContext(snapshot, iso, workout);
        const canDragMove = Boolean(manualCopyContext?.canRequestMoveReview);

        return (
          <div
            key={iso}
            className="group/manual-day relative"
            draggable={canDragMove}
            onDragStart={(event) =>
              handleManualMoveDragStart(event, manualCopyContext, manualCalendarActionState)
            }
          >
            <Link
              to="/workout/$date"
              params={{ date: iso }}
              search={{} as never}
              className="group block"
            >
              <HitoWorkoutDayRow
                date={{ eyebrow: weekdayShort(iso), day: iso.slice(8) }}
                interactive
                state={baseState}
                result={calendarResultState(status, Boolean(hasWorkout))}
                supportingText={hasWorkout ? compactWorkoutSummary(workout) : null}
                title={workout?.title.replace(/^(Аэробный |Лёгкий )/, "") ?? "Rest day"}
                today={isToday}
                workout={identity}
              />
            </Link>

            {hasWorkout && feedbackMeta && (
              <Link
                to="/workout/$date"
                params={{ date: iso }}
                search={{ tab: "feedback" } as never}
                className="hito-calendar-mobile-feedback-marker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/20"
                aria-label={`${feedbackMeta.label}. Open workout feedback.`}
              >
                <CalendarFeedbackMarker state={feedbackMeta.state} />
              </Link>
            )}

            {manualCopyContext ? (
              <ManualWorkoutCopyAction
                context={manualCopyContext}
                layout="row"
                onCleared={manualCalendarActionState.onManualPlanChanged}
                onCopyWorkout={manualCalendarActionState.onCopyWorkout}
                onMoveWorkout={manualCalendarActionState.onMoveWorkout}
              />
            ) : null}
          </div>
        );
      })}
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

  const workout = findWorkout(snapshot.workouts, iso);
  const isToday = iso === snapshot.currentDate;
  const status = workout?.status ?? "rest";
  const day = parseInt(iso.split("-")[2], 10);
  const feedbackMeta = workout ? feedbackMarkerMeta(workout.feedbackMarker) : null;
  const hasWorkout = workout && workout.type !== "rest";
  const identity = workout ? calendarWorkoutIdentity(workout) : null;
  const baseState = calendarBaseState(workout);
  const manualAddContext = inMonth ? getManualAddContext(snapshot, iso, workout) : null;

  if (manualAddContext) {
    const canMoveHere = canMoveToManualTarget(
      manualCalendarActionState,
      manualAddContext.activePlanId,
      iso,
    );

    return (
      <div className="relative h-full min-w-0">
        <ManualWorkoutAddMenu
          activePlanId={manualAddContext.activePlanId}
          activePlanSourceKind={manualAddContext.activePlanSourceKind}
          copiedWorkoutSource={manualCalendarActionState.copiedWorkoutSource}
          date={iso}
          moveWorkoutSource={manualCalendarActionState.moveWorkoutSource}
          onAdded={manualCalendarActionState.onManualPlanChanged}
          onMoveCanceled={manualCalendarActionState.onCancelMoveWorkout}
          onMoveTargetSelected={manualCalendarActionState.onMoveTargetSelected}
        >
          <button
            type="button"
            className="group block h-full w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/25"
            aria-label={`${formatDate(iso, {
              month: "short",
              day: "numeric",
              weekday: "short",
            })}. Add activity.`}
            onDragOver={(event) => handleManualMoveDragOver(event, canMoveHere)}
            onDrop={(event) =>
              handleManualMoveDrop(event, canMoveHere, iso, manualCalendarActionState)
            }
          >
            <HitoCalendarDayCell
              action={canMoveHere ? calendarMoveTargetAction() : calendarAddAction()}
              day={String(day).padStart(2, "0")}
              className={cn("h-full", canMoveHere && "ring-2 ring-signal/25")}
              interactive
              state="empty"
              supportingText={canMoveHere ? "Move target" : "Manual plan"}
              today={isToday}
            />
          </button>
        </ManualWorkoutAddMenu>
      </div>
    );
  }

  const manualCopyContext = inMonth ? getManualCopyContext(snapshot, iso, workout) : null;
  const canDragMove = Boolean(manualCopyContext?.canRequestMoveReview);

  return (
    <div
      className="group/manual-day relative h-full min-w-0"
      draggable={canDragMove}
      onDragStart={(event) =>
        handleManualMoveDragStart(event, manualCopyContext, manualCalendarActionState)
      }
    >
      <Link
        to="/workout/$date"
        params={{ date: iso }}
        search={{} as never}
        onMouseEnter={(event) => {
          if (hasWorkout) onTooltipChange(tooltipAnchorFromElement(iso, event.currentTarget));
        }}
        onMouseLeave={() => onTooltipChange(null)}
        onFocus={(event) => {
          if (hasWorkout) onTooltipChange(tooltipAnchorFromElement(iso, event.currentTarget));
        }}
        onBlur={() => onTooltipChange(null)}
        className="group block h-full"
      >
        <HitoCalendarDayCell
          day={String(day).padStart(2, "0")}
          className="h-full"
          interactive
          muted={!inMonth}
          result={calendarResultState(status, Boolean(hasWorkout))}
          state={baseState}
          title={workout?.title.replace(/^(Аэробный |Лёгкий )/, "")}
          today={isToday}
          workout={identity}
        />
      </Link>

      {hasWorkout && feedbackMeta && (
        <Link
          to="/workout/$date"
          params={{ date: iso }}
          search={{ tab: "feedback" } as never}
          className="absolute bottom-2.5 right-2.5 z-20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/20"
          aria-label={`${feedbackMeta.label}. Open workout feedback.`}
        >
          <CalendarFeedbackMarker calendar state={feedbackMeta.state} />
        </Link>
      )}

      {manualCopyContext ? (
        <ManualWorkoutCopyAction
          context={manualCopyContext}
          layout="cell"
          onCleared={manualCalendarActionState.onManualPlanChanged}
          onCopyWorkout={manualCalendarActionState.onCopyWorkout}
          onMoveWorkout={manualCalendarActionState.onMoveWorkout}
        />
      ) : null}
    </div>
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

function calendarBaseState(workout: Workout | undefined): HitoCalendarDayBaseState {
  if (!workout) return "rest";
  if (workout.type === "rest") return "rest";

  return "workout";
}

function calendarResultState(status: Status, hasWorkout: boolean): HitoCalendarDayResultState {
  if (!hasWorkout) return "none";
  if (status === "completed" || status === "partial" || status === "skipped") return status;

  return "planned";
}

function calendarWorkoutIdentity(workout: Workout): HitoCalendarWorkoutIdentity {
  const meta = workoutTypeMeta(workout);
  const label = meta.short;

  if (workout.type === "rest") {
    return {
      label: "Rest",
      color: "var(--rest)",
      glyph: "rest",
    };
  }

  if (workout.type === "long_run") {
    return {
      label: "Long",
      color: meta.color,
      glyph: workoutGlyphKind(workout),
    };
  }

  if (workout.type === "quality") {
    return {
      label,
      color: meta.color,
      glyph: workoutGlyphKind(workout),
    };
  }

  return {
    label,
    color: meta.color,
    glyph: workoutGlyphKind(workout),
  };
}

function Tooltip({ workout }: { workout: Workout }) {
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);
  const meta = workoutTypeMeta(workout);
  const status = workout.status;
  const target = primaryWorkoutTarget(workout);
  const targetEntries = displayExecutableTargetEntries(target, workout.metricMode).slice(0, 2);
  const showStructureOnly =
    targetEntries.length === 0 && workout.metricMode.executableMode === "structure_only_executable";
  const structureEntries = showStructureOnly
    ? displayWorkoutStructureEntries(workout).slice(0, 2)
    : [];
  const readbackEntries = targetEntries.length > 0 ? targetEntries : structureEntries;

  return (
    <div className="hito-tooltip w-72 max-w-72">
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

        const workout = findWorkout(snapshot.workouts, iso);
        const isToday = iso === snapshot.currentDate;
        const feedbackMeta = workout ? feedbackMarkerMeta(workout.feedbackMarker) : null;
        const status = workout?.status ?? "rest";
        const hasWorkout = workout && workout.type !== "rest";
        const identity = workout ? calendarWorkoutIdentity(workout) : null;
        const baseState = calendarBaseState(workout);
        const manualAddContext = getManualAddContext(snapshot, iso, workout);

        if (manualAddContext) {
          const canMoveHere = canMoveToManualTarget(
            manualCalendarActionState,
            manualAddContext.activePlanId,
            iso,
          );

          return (
            <ManualWorkoutAddMenu
              key={iso}
              activePlanId={manualAddContext.activePlanId}
              activePlanSourceKind={manualAddContext.activePlanSourceKind}
              copiedWorkoutSource={manualCalendarActionState.copiedWorkoutSource}
              date={iso}
              moveWorkoutSource={manualCalendarActionState.moveWorkoutSource}
              onAdded={manualCalendarActionState.onManualPlanChanged}
              onMoveCanceled={manualCalendarActionState.onCancelMoveWorkout}
              onMoveTargetSelected={manualCalendarActionState.onMoveTargetSelected}
            >
              <button
                type="button"
                className="group block h-full w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/25"
                aria-label={`${formatDate(iso, {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })}. Add activity.`}
                onDragOver={(event) => handleManualMoveDragOver(event, canMoveHere)}
                onDrop={(event) =>
                  handleManualMoveDrop(event, canMoveHere, iso, manualCalendarActionState)
                }
              >
                <HitoCalendarDayCell
                  action={canMoveHere ? calendarMoveTargetAction() : calendarAddAction()}
                  day={iso.slice(8)}
                  className={cn("h-full", canMoveHere && "ring-2 ring-signal/25")}
                  interactive
                  layout="week"
                  state="empty"
                  supportingText={canMoveHere ? "Move target" : "Manual user-built plan"}
                  today={isToday}
                  weekday={weekdayShort(iso)}
                />
              </button>
            </ManualWorkoutAddMenu>
          );
        }

        const manualCopyContext = getManualCopyContext(snapshot, iso, workout);

        return (
          <div key={iso} className="group/manual-day relative">
            <Link
              to="/workout/$date"
              params={{ date: iso }}
              search={{} as never}
              className="group block"
            >
              <HitoCalendarDayCell
                day={iso.slice(8)}
                className="h-full"
                interactive
                layout="week"
                result={calendarResultState(status, Boolean(hasWorkout))}
                state={baseState}
                supportingText={hasWorkout ? compactWorkoutSummary(workout) : null}
                title={workout?.title}
                today={isToday}
                weekday={weekdayShort(iso)}
                workout={identity}
              />
            </Link>

            {hasWorkout && feedbackMeta && (
              <Link
                to="/workout/$date"
                params={{ date: iso }}
                search={{ tab: "feedback" } as never}
                className="absolute bottom-4 right-4 z-20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/20"
                aria-label={`${feedbackMeta.label}. Open workout feedback.`}
              >
                <CalendarFeedbackMarker state={feedbackMeta.state} />
              </Link>
            )}

            {manualCopyContext ? (
              <ManualWorkoutCopyAction
                context={manualCopyContext}
                layout="week"
                onCleared={manualCalendarActionState.onManualPlanChanged}
                onCopyWorkout={manualCalendarActionState.onCopyWorkout}
                onMoveWorkout={manualCalendarActionState.onMoveWorkout}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function getManualAddContext(
  snapshot: TrainingSnapshot,
  iso: string,
  workout: Workout | undefined,
): { activePlanId: string; activePlanSourceKind: string } | null {
  const planMeta = snapshot.planMeta;

  if (
    !planMeta?.id ||
    planMeta.sourceKind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND ||
    workout ||
    iso <= snapshot.currentDate ||
    isBeforePlanStart(iso, snapshot)
  ) {
    return null;
  }

  return {
    activePlanId: planMeta.id,
    activePlanSourceKind: planMeta.sourceKind,
  };
}

function getManualCopyContext(
  snapshot: TrainingSnapshot,
  iso: string,
  workout: Workout | undefined,
): ManualWorkoutCalendarActionContext | null {
  const planMeta = snapshot.planMeta;

  if (
    !planMeta?.id ||
    planMeta.sourceKind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND ||
    !workout ||
    workout.type === "rest"
  ) {
    return null;
  }

  return {
    activePlanId: planMeta.id,
    canRequestClearReview: iso > snapshot.currentDate && !isBeforePlanStart(iso, snapshot),
    canRequestMoveReview: iso > snapshot.currentDate && !isBeforePlanStart(iso, snapshot),
    sourceWorkoutDate: iso,
    sourceWorkoutId: workout.id,
    title: workout.title || workoutTypeMeta(workout).label,
  };
}

function ManualWorkoutCopyAction({
  context,
  layout,
  onCleared,
  onCopyWorkout,
  onMoveWorkout,
}: {
  context: ManualWorkoutCalendarActionContext;
  layout: "cell" | "row" | "week";
  onCleared: () => Promise<void>;
  onCopyWorkout: (source: ManualCopiedWorkoutSource) => void;
  onMoveWorkout: (source: ManualCopiedWorkoutSource) => void;
}) {
  const mobile = layout === "row";

  return (
    <ManualWorkoutCopyMenu
      activePlanId={context.activePlanId}
      canClear={context.canRequestClearReview}
      canMove={context.canRequestMoveReview}
      onCleared={onCleared}
      onCopy={onCopyWorkout}
      onMove={onMoveWorkout}
      sourceWorkoutDate={context.sourceWorkoutDate}
      sourceWorkoutId={context.sourceWorkoutId}
      title={context.title}
    >
      <button
        type="button"
        className={cn(
          "hito-button hito-button-ghost hito-button-xs absolute z-30 aspect-square p-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/25",
          mobile
            ? "right-3 top-3"
            : "opacity-0 transition-opacity group-hover/manual-day:opacity-100 focus-visible:opacity-100",
          layout === "cell" && "right-2 top-2",
          layout === "week" && "right-3 top-3",
        )}
        aria-label={`More activity actions for ${context.title}`}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Icon name="more-horizontal" size="xs" />
      </button>
    </ManualWorkoutCopyMenu>
  );
}

function calendarAddAction() {
  return {
    label: "Add",
    icon: "plus" as const,
    tone: "muted" as const,
    ariaLabel: "Add activity",
  };
}

function calendarMoveTargetAction() {
  return {
    label: "Move",
    icon: "arrow-right" as const,
    tone: "signal" as const,
    ariaLabel: "Move selected workout here",
  };
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
  if (!context?.canRequestMoveReview) return;

  manualCalendarActionState.onMoveWorkout(context);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", context.sourceWorkoutId);
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
  manualCalendarActionState.onMoveTargetSelected(targetDate);
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

function compactWorkoutSummary(workout: Workout) {
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);

  if (km != null && duration > 0) {
    return `${formatDistanceKm(km)} km · ${formatDurationMin(duration)}`;
  }

  if (km != null) {
    return `${formatDistanceKm(km)} km`;
  }

  if (duration > 0) {
    return formatDurationMin(duration);
  }

  return workoutTypeMeta(workout).label;
}
