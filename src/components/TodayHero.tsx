import { Link } from "@tanstack/react-router";
import { ArrowUpRight, NotebookPen, Flag } from "lucide-react";
import {
  findWorkout,
  TYPE_META,
  workoutDistanceKm,
  workoutDuration,
  formatDate,
  WEEK_STATUS_META,
  type TrainingSnapshot,
} from "@/lib/training";

export function TodayHero({ snapshot }: { snapshot: TrainingSnapshot }) {
  const workout = findWorkout(snapshot.workouts, snapshot.currentDate);
  if (!workout) return null;
  const meta = TYPE_META[workout.type];
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);
  const target = workout.steps[0]?.target;
  const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];

  const tomorrowDate = new Date(`${snapshot.currentDate}T00:00:00`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = findWorkout(snapshot.workouts, tomorrowDate.toISOString().slice(0, 10));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent" />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
        <div>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
            <span className="text-signal">
              Today ·{" "}
              {formatDate(snapshot.currentDate, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="opacity-50">·</span>
            <span style={{ color: meta.color }}>{meta.label}</span>
          </div>

          <h2 className="font-display text-4xl lg:text-6xl mt-4 leading-[1.05] text-balance">
            {workout.title}
          </h2>

          <p className="mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
            Today&apos;s workout stays front and center so the preserved baseline still answers the
            main question quickly: what should I do next?
            {workout.status === "today" &&
              (snapshot.source === "persisted"
                ? " This now reads from the persisted plan and workout log contract."
                : " This preview is still powered by the imported sample plan.")}
          </p>

          <div className="mt-8 flex flex-wrap gap-8">
            <Metric label="Distance" value={km ? `${km}` : "—"} unit="km" />
            <Metric label="Duration" value={duration ? `${duration}` : "—"} unit="min" />
            <Metric
              label="Target HR"
              value={(target?.hr_bpm as string)?.split("-")[0] ?? "—"}
              unit={`–${(target?.hr_bpm as string)?.split("-")[1] ?? ""} bpm`}
            />
            <Metric label="Pace hint" value="6:40" unit="–7:40 /km" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/workout/$date"
              params={{ date: snapshot.currentDate }}
              className="inline-flex items-center gap-2 rounded-md bg-signal text-signal-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Open workout
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/workout/$date"
              params={{ date: snapshot.currentDate }}
              search={{ tab: "complete" } as never}
              className="inline-flex items-center gap-2 rounded-md border border-hairline px-5 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              Mark complete
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-hairline bg-background/40 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <NotebookPen className="h-3 w-3 text-signal" />
              Planning note · {snapshot.source === "persisted" ? "saved" : "preview"}
            </div>
            <p className="mt-2 text-sm leading-relaxed">
              {snapshot.source === "persisted"
                ? "This hero keeps the imported visual structure intact while the plan, profile, and workout logging now come from one persisted backend contract."
                : "This imported hero keeps the current visual structure intact, but real plan generation, persistence, and adaptation are not wired in yet."}
            </p>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>Data source</span>
              <div className="flex-1 h-1 rounded-full bg-hairline overflow-hidden">
                <div className="h-full bg-signal" style={{ width: "100%" }} />
              </div>
              <span className="font-mono-num text-foreground/80">
                {snapshot.source === "persisted" ? "saved" : "mock"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-hairline bg-background/40 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Flag className="h-3 w-3" />
              Week status · {snapshot.source === "persisted" ? "backend" : "preview"}
            </div>
            <div className="mt-2">
              <span className="font-display text-3xl">{weekStatus.label}</span>
              <p className="mt-2 text-xs text-muted-foreground">{weekStatus.helper}</p>
            </div>
          </div>

          {tomorrow && tomorrow.type !== "rest" && (
            <div className="rounded-lg border border-hairline bg-background/40 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Tomorrow
              </div>
              <div className="mt-1 text-sm">{tomorrow.title}</div>
              <div className="mt-2 text-[11px] font-mono-num text-muted-foreground">
                {workoutDistanceKm(tomorrow)}km · {workoutDuration(tomorrow)}′
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-hairline flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>
          Surface · {snapshot.source === "persisted" ? "weekly plan" : "weekly plan preview"}
        </span>
        <span className="opacity-50">·</span>
        <span>
          Source ·{" "}
          {snapshot.source === "persisted"
            ? "persisted runner state"
            : "imported baseline mock data"}
        </span>
        <span className="opacity-50">·</span>
        <span>JSON export comes later</span>
      </div>
    </section>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-3xl leading-none">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
