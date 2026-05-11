import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  displayTargetEntries,
  formatDistanceKm,
  TYPE_META,
  WEEK_STATUS_META,
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
import { WorkoutGlyph } from "./WorkoutGlyph";

type View = "month" | "week";

export function Calendar({ snapshot }: { snapshot: TrainingSnapshot }) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date(`${snapshot.currentDate}T00:00:00`));
  const [hovered, setHovered] = useState<string | null>(null);

  const cells = useMemo(() => buildMonth(cursor), [cursor]);
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];

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
  }

  return (
    <div>
      <div className="hito-section-header mb-8">
        <div>
          <p className="hito-label">Training plan</p>
          <h1 className="hito-section-title mt-2 text-4xl lg:text-5xl">{monthLabel}</h1>
          <p className="hito-support-copy mt-3 max-w-xl">
            Open any day to review the plan or update the workout result.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hito-tab-list">
            <button
              onClick={() => setView("month")}
              data-active={view === "month"}
              className={cn(
                "hito-tab px-3 py-1.5 text-xs tracking-wide",
                view !== "month" && "text-muted-foreground",
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              data-active={view === "week"}
              className={cn(
                "hito-tab px-3 py-1.5 text-xs tracking-wide",
                view !== "week" && "text-muted-foreground",
              )}
            >
              Week
            </button>
          </div>
          <button
            onClick={() => shift(-1)}
            className="hito-button hito-button-secondary hito-button-sm aspect-square p-0"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setCursor(new Date(`${snapshot.currentDate}T00:00:00`))}
            className="hito-button hito-button-secondary hito-button-sm tracking-wide"
          >
            Today
          </button>
          <button
            onClick={() => shift(1)}
            className="hito-button hito-button-secondary hito-button-sm aspect-square p-0"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="hito-legend mb-5">
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
        <div className="ml-auto hidden items-center gap-1.5 md:flex">
          <span className="text-muted-foreground">Week status</span>
          <span className="hito-status-pill" data-tone={weekStatusTone(weekStatus.label)}>
            {weekStatus.label}
          </span>
        </div>
      </div>

      {view === "month" ? (
        <div className="border-b border-hairline">
          <div className="grid grid-cols-7 border-b border-hairline">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="px-3 py-2 hito-section-subtitle text-[10px]">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((iso, index) => (
              <DayCell
                key={index}
                iso={iso}
                inMonth={iso ? new Date(`${iso}T00:00:00`).getMonth() === cursor.getMonth() : false}
                onHover={setHovered}
                hovered={hovered}
                snapshot={snapshot}
              />
            ))}
          </div>
        </div>
      ) : (
        <WeekStrip dates={weekCells} snapshot={snapshot} />
      )}
    </div>
  );
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
  onHover,
  hovered,
  snapshot,
}: {
  iso: string | null;
  inMonth: boolean;
  onHover: (value: string | null) => void;
  hovered: string | null;
  snapshot: TrainingSnapshot;
}) {
  if (!iso) return <div className="aspect-[5/4] border-r border-b border-hairline" />;
  const workout = findWorkout(snapshot.workouts, iso);
  const isToday = iso === snapshot.currentDate;
  const status = workout?.status ?? "rest";
  const day = parseInt(iso.split("-")[2], 10);
  const isHover = hovered === iso;
  const meta = workout ? workoutTypeMeta(workout) : null;
  const km = workout ? workoutDistanceKm(workout) : null;
  const duration = workout ? workoutDuration(workout) : 0;
  const isCompleted = status === "completed";
  const isPartial = status === "partial";
  const isSkipped = status === "skipped";

  return (
    <div className="relative">
      <Link
        to="/workout/$date"
        params={{ date: iso }}
        onMouseEnter={() => onHover(iso)}
        onMouseLeave={() => onHover(null)}
        className={cn(
          "block aspect-[5/4] border-r border-b border-hairline p-3 transition-colors group",
          !inMonth && "opacity-30",
          isToday && "relative z-10 outline outline-1 outline-offset-[-1px] outline-signal/60",
          isCompleted && !isToday && "bg-success/[0.04]",
          "hover:bg-accent/40",
        )}
        style={
          isCompleted
            ? {
                boxShadow: "inset 0 -3px 0 0 var(--success)",
              }
            : undefined
        }
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "font-mono-num text-xs",
                isToday ? "text-signal" : "text-muted-foreground",
              )}
            >
              {String(day).padStart(2, "0")}
            </div>
            <StatusMark status={status} />
          </div>
          {workout && workout.type !== "rest" && meta && (
            <span style={{ color: meta.color }}>
              <WorkoutGlyph type={workout.type} />
            </span>
          )}
        </div>

        {workout && workout.type !== "rest" && (
          <div className="mt-3">
            <div
              className={cn(
                "text-[11px] uppercase tracking-wider",
                status === "skipped" && "line-through opacity-50",
              )}
              style={{ color: meta?.color }}
            >
              {meta.short}
            </div>
            <div className="mt-1 text-xs leading-tight text-foreground/85 line-clamp-2">
              {workout.title.replace(/^(Аэробный |Лёгкий )/, "")}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground font-mono-num">
              {km != null && <span>{formatDistanceKm(km)}km</span>}
              {duration > 0 && <span>{duration}′</span>}
            </div>
          </div>
        )}
        {workout && workout.type === "rest" && (
          <div className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            Rest
          </div>
        )}

        {workout && workout.type !== "rest" && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-hairline overflow-hidden">
            <div
              className="h-full"
              style={{
                width: isCompleted ? "100%" : isPartial ? "55%" : isSkipped ? "100%" : "0%",
                background: isCompleted
                  ? "var(--success)"
                  : isPartial
                    ? "var(--warn)"
                    : isSkipped
                      ? "var(--destructive)"
                      : "transparent",
                opacity: isSkipped ? 0.5 : 1,
              }}
            />
          </div>
        )}
      </Link>

      {isHover && workout && workout.type !== "rest" && (
        <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 pointer-events-none">
          <Tooltip workout={workout} />
        </div>
      )}
    </div>
  );
}

function StatusMark({ status, compact = false }: { status: Status; compact?: boolean }) {
  if (status === "completed") {
    return (
      <span
        className={cn("hito-status-marker", compact && "ml-auto")}
        data-size="xs"
        data-tone="success"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
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
        <X className="h-3.5 w-3.5" strokeWidth={2.3} />
      </span>
    );
  }

  return (
    <span
      className={cn("hito-status-marker", compact && "ml-auto")}
      data-size="xs"
      data-tone="muted"
    >
      <Minus className="h-3.5 w-3.5" strokeWidth={2.2} />
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
        <span className="hito-label text-[10px]" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="hito-tooltip-meta uppercase tracking-wider">
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
                <span className="hito-label text-[10px]">{entry.label}</span>
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
      <div className="hito-metric-value text-xs capitalize">{value}</div>
      <div className="hito-metric-label text-[9px]">{label}</div>
    </div>
  );
}

function weekStatusTone(label: string) {
  if (/reset|missed|off/i.test(label)) {
    return "warning";
  }

  return "success";
}

function WeekStrip({ dates, snapshot }: { dates: string[]; snapshot: TrainingSnapshot }) {
  return (
    <div className="grid grid-cols-1 border-b border-hairline md:grid-cols-7">
      {dates.map((iso) => {
        const workout = findWorkout(snapshot.workouts, iso);
        const isToday = iso === snapshot.currentDate;
        const meta = workout ? workoutTypeMeta(workout) : null;
        const status = workout?.status ?? "rest";
        const km = workout ? workoutDistanceKm(workout) : null;
        const duration = workout ? workoutDuration(workout) : 0;
        const isCompleted = status === "completed";
        return (
          <Link
            key={iso}
            to="/workout/$date"
            params={{ date: iso }}
            className={cn(
              "flex min-h-[170px] flex-col border-b border-hairline p-4 transition-colors hover:bg-accent/30 md:border-r md:border-b-0",
              isToday && "relative z-10 outline outline-1 outline-offset-[-1px] outline-signal/60",
              isCompleted && !isToday && "bg-success/[0.04]",
            )}
            style={
              isCompleted
                ? {
                    boxShadow: "inset 0 -3px 0 0 var(--success)",
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between hito-section-subtitle text-[10px]">
              <span>{weekdayShort(iso)}</span>
              <div className="flex items-center gap-1.5">
                <StatusMark status={status} />
                <span className="font-mono-num">{iso.slice(8)}</span>
              </div>
            </div>
            {workout && workout.type !== "rest" && meta ? (
              <>
                <div
                  className="mt-3 text-[11px] uppercase tracking-wider"
                  style={{ color: meta.color }}
                >
                  {meta.short}
                </div>
                <div className="mt-1 text-sm leading-snug">{workout.title}</div>
                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 font-mono-num text-[11px] text-muted-foreground">
                  {km != null && <span>{formatDistanceKm(km)}km</span>}
                  {duration > 0 && <span>{duration}′</span>}
                </div>
              </>
            ) : (
              <div className="mt-auto text-xs uppercase tracking-wider text-muted-foreground">
                Rest
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
