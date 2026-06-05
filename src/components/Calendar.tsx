import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
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
  displayTargetEntries,
  feedbackMarkerMeta,
  formatDistanceKm,
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
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date(`${snapshot.currentDate}T00:00:00`));
  const [tooltipAnchor, setTooltipAnchor] = useState<TooltipAnchor | null>(null);

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

  return (
    <div>
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
                  onTooltipChange={setTooltipAnchor}
                  snapshot={snapshot}
                />
              ))}
            </div>
          </div>
          <MobileMonthList dates={mobileMonthDates} snapshot={snapshot} />
        </>
      ) : (
        <WeekStrip dates={weekCells} snapshot={snapshot} />
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

function MobileMonthList({ dates, snapshot }: { dates: string[]; snapshot: TrainingSnapshot }) {
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

        return (
          <div key={iso} className="relative">
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
  onTooltipChange,
  snapshot,
}: {
  iso: string | null;
  inMonth: boolean;
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

  return (
    <div className="relative h-full min-w-0">
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

  return (
    <div className="hito-tooltip w-72 max-w-72">
      <div className="flex items-center justify-between">
        <span className="hito-micro-label" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="hito-micro-label">
          {formatDate(workout.date, { month: "short", day: "numeric", weekday: "short" })}
        </span>
      </div>
      <div className="hito-tooltip-title mt-2 font-display text-lg">{workout.title}</div>
      <div className="hito-metric-row mt-3 grid-cols-3">
        <Stat label="Distance" value={km != null ? `${formatDistanceKm(km)}km` : "—"} />
        <Stat label="Duration" value={duration ? `${duration}′` : "—"} />
        <Stat label="Status" value={status} />
      </div>
      {target && (
        <div className="hito-caption mt-3 space-y-0.5 border-t border-hairline pt-3">
          {displayTargetEntries(target)
            .slice(0, 2)
            .map((entry) => (
              <div key={entry.key} className="flex justify-between gap-3">
                <span className="hito-micro-label">{entry.label}</span>
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

function WeekStrip({ dates, snapshot }: { dates: string[]; snapshot: TrainingSnapshot }) {
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

        return (
          <div key={iso} className="relative">
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
          </div>
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

function isBeforePlanStart(iso: string, snapshot: TrainingSnapshot) {
  const planStartDate = snapshot.planMeta?.startDate;
  return Boolean(planStartDate && iso < planStartDate);
}

function compactWorkoutSummary(workout: Workout) {
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);

  if (km != null && duration > 0) {
    return `${formatDistanceKm(km)}km · ${duration}′`;
  }

  if (km != null) {
    return `${formatDistanceKm(km)}km`;
  }

  if (duration > 0) {
    return `${duration}′`;
  }

  return workoutTypeMeta(workout).label;
}
