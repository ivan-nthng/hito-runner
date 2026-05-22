import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { WorkoutGlyph } from "@/components/WorkoutGlyph";
import { workoutGlyphKind, type WorkoutGlyphKind } from "@/lib/workout-glyph";
import {
  displayTargetEntries,
  feedbackMarkerMeta,
  formatDistanceKm,
  TYPE_META,
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
type CalendarWorkoutIdentity = {
  label: string;
  color: string;
  glyph: WorkoutGlyphKind;
};
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
          <div className="hito-tab-list">
            <button
              onClick={() => setView("month")}
              data-active={view === "month"}
              className={cn("hito-tab", view !== "month" && "text-muted-foreground")}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              data-active={view === "week"}
              className={cn("hito-tab", view !== "week" && "text-muted-foreground")}
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

      <div className="hito-legend mb-4">
        {(["easy", "long_run", "quality", "rest"] as const).map((type) => (
          <div key={type} className="hito-legend-item">
            <span
              className="hito-legend-swatch rounded-full"
              style={{
                background: `var(--${type === "long_run" ? "long" : type === "quality" ? "quality" : type === "rest" ? "rest" : "easy"})`,
              }}
            />
            <span>{TYPE_META[type].short}</span>
          </div>
        ))}
      </div>

      {view === "month" ? (
        <>
          <div className="hidden border-b border-hairline md:block">
            <div className="grid grid-cols-7 border-b border-hairline">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="hito-micro-label px-3 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
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
  return (
    <div className="hito-calendar-mobile-list md:hidden">
      {dates.map((iso) => {
        const workout = findWorkout(snapshot.workouts, iso);
        const isToday = iso === snapshot.currentDate;
        const status = workout?.status ?? "rest";
        const feedbackMeta = workout ? feedbackMarkerMeta(workout.feedbackMarker) : null;
        const hasWorkout = workout && workout.type !== "rest";
        const isCompleted = status === "completed";
        const identity = workout ? calendarWorkoutIdentity(workout) : null;

        return (
          <div key={iso} className="relative">
            <Link
              to="/workout/$date"
              params={{ date: iso }}
              search={{} as never}
              className={cn(
                "hito-calendar-mobile-row group",
                isToday && "hito-calendar-mobile-row-today",
                isCompleted && !isToday && "hito-calendar-mobile-row-completed",
              )}
            >
              <div className="hito-calendar-mobile-date">
                <span>{weekdayShort(iso)}</span>
                <strong>{iso.slice(8)}</strong>
              </div>

              <div className="min-w-0 flex-1">
                {identity ? (
                  <div
                    className="hito-micro-label inline-flex max-w-full min-w-0 items-center gap-1.5"
                    style={{ color: identity.color }}
                  >
                    <WorkoutGlyph kind={identity.glyph} className="hito-calendar-type-glyph" />
                    <span className="truncate">{identity.label}</span>
                    {hasWorkout && <StatusMark status={status} compact />}
                  </div>
                ) : (
                  <div className="hito-micro-label">Rest</div>
                )}

                <div
                  className={cn(
                    "hito-body-small mt-1 min-w-0 truncate text-foreground/85",
                    status === "skipped" && "line-through opacity-50",
                  )}
                >
                  {workout?.title.replace(/^(Аэробный |Лёгкий )/, "") ?? "Rest day"}
                </div>

                {hasWorkout ? (
                  <div className="hito-technical-mono mt-2 text-muted-foreground">
                    {compactWorkoutSummary(workout)}
                  </div>
                ) : null}
              </div>
            </Link>

            {hasWorkout && feedbackMeta && (
              <Link
                to="/workout/$date"
                params={{ date: iso }}
                search={{ tab: "feedback" } as never}
                className="hito-feedback-marker hito-calendar-mobile-feedback-marker"
                data-state={feedbackMeta.state}
                aria-label={`${feedbackMeta.label}. Open workout feedback.`}
              >
                <span className="hito-feedback-marker-dot" />
                <span>{feedbackMeta.shortLabel}</span>
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
  if (!iso) return <div className="aspect-[5/4] border-r border-b border-hairline" />;
  const workout = findWorkout(snapshot.workouts, iso);
  const isToday = iso === snapshot.currentDate;
  const status = workout?.status ?? "rest";
  const day = parseInt(iso.split("-")[2], 10);
  const feedbackMeta = workout ? feedbackMarkerMeta(workout.feedbackMarker) : null;
  const hasWorkout = workout && workout.type !== "rest";
  const isCompleted = status === "completed";
  const isSkipped = hasWorkout && status === "skipped";
  const identity = workout ? calendarWorkoutIdentity(workout) : null;

  return (
    <div className="relative">
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
        className={cn(
          "block aspect-[5/4] border-r border-b border-hairline p-3 transition-colors group",
          !inMonth && "opacity-30",
          isToday && "relative z-10 outline outline-1 outline-offset-[-1px] outline-signal/60",
          isCompleted && !isToday && "bg-success/[0.04]",
          "hover:bg-accent/40",
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "hito-technical-mono",
                isToday ? "text-signal" : "text-muted-foreground",
              )}
            >
              {String(day).padStart(2, "0")}
            </div>
            {hasWorkout && <StatusMark status={status} />}
          </div>
        </div>

        {hasWorkout && (
          <div className="mt-3">
            <div
              className={cn(
                "hito-micro-label inline-flex max-w-full min-w-0 items-center gap-1.5",
                status === "skipped" && "line-through opacity-50",
              )}
              style={{ color: identity?.color }}
            >
              {identity && (
                <WorkoutGlyph kind={identity.glyph} className="hito-calendar-type-glyph" />
              )}
              <span className="truncate">{identity?.label}</span>
            </div>
            <div
              className={cn(
                "hito-body-small mt-1.5 line-clamp-2 overflow-hidden text-foreground/85",
                feedbackMeta && "pr-7",
              )}
            >
              {workout.title.replace(/^(Аэробный |Лёгкий )/, "")}
            </div>
          </div>
        )}
        {workout && workout.type === "rest" && identity && (
          <div className="mt-3">
            <div
              className="hito-micro-label inline-flex max-w-full min-w-0 items-center gap-1.5"
              style={{ color: identity.color }}
            >
              <WorkoutGlyph kind={identity.glyph} className="hito-calendar-type-glyph" />
              <span className="truncate">{identity.label}</span>
            </div>
          </div>
        )}
      </Link>

      {hasWorkout && feedbackMeta && (
        <Link
          to="/workout/$date"
          params={{ date: iso }}
          search={{ tab: "feedback" } as never}
          className="hito-feedback-marker hito-calendar-feedback-marker absolute bottom-2.5 right-2.5 z-20"
          data-state={feedbackMeta.state}
          aria-label={`${feedbackMeta.label}. Open workout feedback.`}
        >
          <span className="hito-feedback-marker-dot" />
        </Link>
      )}
    </div>
  );
}

function calendarWorkoutIdentity(workout: Workout): CalendarWorkoutIdentity {
  const meta = workoutTypeMeta(workout);
  const label = meta.short === "Steady" ? "Easy" : meta.short;

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

function StatusMark({ status, compact = false }: { status: Status; compact?: boolean }) {
  if (status === "completed") {
    return (
      <span
        className={cn("hito-status-marker", compact && "ml-auto")}
        data-size="xs"
        data-tone="success"
      >
        <Icon name="check" size="xs" strokeWidth={2.4} />
      </span>
    );
  }

  if (status === "skipped") {
    return (
      <span
        className={cn("hito-status-marker", compact && "ml-auto")}
        data-size="xs"
        data-tone="destructive"
      >
        <Icon name="close" size="xs" strokeWidth={2.3} />
      </span>
    );
  }

  return (
    <span
      className={cn("hito-status-marker", compact && "ml-auto")}
      data-size="xs"
      data-tone="muted"
    >
      <Icon name="minus" size="xs" strokeWidth={2.2} />
    </span>
  );
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
    <div className="grid grid-cols-1 border-b border-hairline md:grid-cols-7">
      {dates.map((iso) => {
        const workout = findWorkout(snapshot.workouts, iso);
        const isToday = iso === snapshot.currentDate;
        const meta = workout ? workoutTypeMeta(workout) : null;
        const feedbackMeta = workout ? feedbackMarkerMeta(workout.feedbackMarker) : null;
        const status = workout?.status ?? "rest";
        const hasWorkout = workout && workout.type !== "rest";
        const isCompleted = status === "completed";
        return (
          <div key={iso} className="relative">
            <Link
              to="/workout/$date"
              params={{ date: iso }}
              search={{} as never}
              className={cn(
                "flex min-h-[170px] flex-col border-b border-hairline p-4 transition-colors hover:bg-accent/30 md:border-r md:border-b-0",
                isToday &&
                  "relative z-10 outline outline-1 outline-offset-[-1px] outline-signal/60",
                isCompleted && !isToday && "bg-success/[0.04]",
              )}
            >
              <div className="hito-micro-label flex items-center justify-between">
                <span>{weekdayShort(iso)}</span>
                <div className="flex items-center gap-1.5">
                  {hasWorkout && <StatusMark status={status} />}
                  <span className="hito-technical-mono">{iso.slice(8)}</span>
                </div>
              </div>
              {hasWorkout && meta ? (
                <>
                  <div className="hito-micro-label mt-3" style={{ color: meta.color }}>
                    {meta.short}
                  </div>
                  <div className={cn("mt-1 text-sm leading-snug", feedbackMeta && "pr-16")}>
                    {workout.title}
                  </div>
                  <div className="hito-technical-mono mt-auto pt-3 text-muted-foreground">
                    {compactWorkoutSummary(workout)}
                  </div>
                </>
              ) : (
                <div className="hito-micro-label mt-auto">Rest</div>
              )}
            </Link>

            {hasWorkout && feedbackMeta && (
              <Link
                to="/workout/$date"
                params={{ date: iso }}
                search={{ tab: "feedback" } as never}
                className="absolute bottom-4 right-4 z-20 hito-feedback-marker"
                data-state={feedbackMeta.state}
                aria-label={`${feedbackMeta.label}. Open workout feedback.`}
              >
                <span className="hito-feedback-marker-dot" />
                <span>{feedbackMeta.shortLabel}</span>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
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
