import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Flag, NotebookPen } from "lucide-react";
import {
  formatDate,
  findWorkout,
  WEEK_STATUS_META,
  TYPE_META,
  type TrainingSnapshot,
  workoutDistanceKm,
  workoutDuration,
} from "@/lib/training";

export function TodayHero({ snapshot }: { snapshot: TrainingSnapshot }) {
  const workout = findWorkout(snapshot.workouts, snapshot.currentDate);
  if (!workout) {
    return <TodayFallback snapshot={snapshot} />;
  }
  const meta = TYPE_META[workout.type];
  const isRestDay = workout.type === "rest";
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);
  const target = workout.steps[0]?.target;
  const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];
  const primaryTarget =
    typeof target?.hr_bpm === "string"
      ? target.hr_bpm
      : typeof target?.pace === "string"
        ? target.pace
        : "—";
  const paceHint = typeof target?.pace === "string" ? target.pace : "Keep the effort relaxed";

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
            {isRestDay ? "Rest day" : workout.title}
          </h2>

          <p className="mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
            {isRestDay
              ? "Keep the day light unless a small recovery assignment is actually planned."
              : (workout.notes ?? "Keep the effort smooth and let the session carry the day.")}
          </p>

          {!isRestDay ? (
            <div className="mt-8 flex flex-wrap gap-8">
              <Metric label="Distance" value={km ? `${km}` : "—"} unit="km" />
              <Metric label="Duration" value={duration ? `${duration}` : "—"} unit="min" />
              <Metric label="Target" value={primaryTarget} />
              <Metric label="Pace Hint" value={paceHint} />
            </div>
          ) : (
            <div className="mt-8 max-w-md rounded-xl bg-background/35 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-background/70">
                  <span className="h-4 w-4 rounded-full border border-hairline bg-surface/70" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground/85">
                    No workout metrics are planned today.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Leave room for recovery.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/workout/$date"
              params={{ date: snapshot.currentDate }}
              className="inline-flex items-center gap-2 rounded-md bg-signal text-signal-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {isRestDay ? "Open day" : "Open workout"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            {!isRestDay && (
              <Link
                to="/workout/$date"
                params={{ date: snapshot.currentDate }}
                search={{ tab: "complete" } as never}
                className="inline-flex items-center gap-2 rounded-md border border-hairline px-5 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                Mark complete
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-background/40 p-4 lg:p-5">
          <section>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <NotebookPen className="h-3 w-3 text-signal" />
              Planning Note
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">
              Previous-run insight will appear here once recent completed workouts include notes or
              uploaded results.
            </p>
          </section>

          <div className="my-4 border-t border-hairline" />

          <section>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Flag className="h-3 w-3" />
              Week Status
            </div>
            <div className="mt-2">
              <span className="font-display text-3xl">{weekStatus.label}</span>
              <p className="mt-2 text-xs text-muted-foreground">{weekStatus.helper}</p>
            </div>
          </section>

          {tomorrow && (
            <>
              <div className="my-4 border-t border-hairline" />
              <section>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Tomorrow
                </div>
                <div className="mt-1 text-sm text-foreground/90">
                  {tomorrow.type === "rest" ? "Rest day" : tomorrow.title}
                </div>
                <div className="mt-2 text-[11px] font-mono-num text-muted-foreground">
                  {summarizeUpcomingWorkout(tomorrow)}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function TodayFallback({ snapshot }: { snapshot: TrainingSnapshot }) {
  const planStart = snapshot.workouts[0]?.date ?? null;
  const planEnd = snapshot.workouts.at(-1)?.date ?? null;
  const nextWorkout = snapshot.workouts.find((item) => item.date > snapshot.currentDate);
  const previousWorkout = [...snapshot.workouts]
    .reverse()
    .find((item) => item.date < snapshot.currentDate);

  const closestWorkout =
    planStart && snapshot.currentDate < planStart ? nextWorkout : (previousWorkout ?? nextWorkout);

  const heading =
    planStart && snapshot.currentDate < planStart
      ? "Your plan starts later."
      : planEnd && snapshot.currentDate > planEnd
        ? "This plan has already ended."
        : "Nothing is scheduled for today.";

  const body =
    planStart && snapshot.currentDate < planStart
      ? `Today is ${formatDate(snapshot.currentDate, {
          month: "short",
          day: "numeric",
        })}, while your current plan begins on ${formatDate(planStart, {
          month: "short",
          day: "numeric",
        })}.`
      : planEnd && snapshot.currentDate > planEnd
        ? `Today is ${formatDate(snapshot.currentDate, {
            month: "short",
            day: "numeric",
          })}, but this imported plan currently ends on ${formatDate(planEnd, {
            month: "short",
            day: "numeric",
          })}.`
        : "Open another day from the calendar whenever you want to review the plan.";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent" />

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
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
            <span>No scheduled workout</span>
          </div>

          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-balance lg:text-6xl">
            {heading}
          </h2>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {closestWorkout && (
              <Link
                to="/workout/$date"
                params={{ date: closestWorkout.date }}
                className="inline-flex items-center gap-2 rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
              >
                Open nearest workout
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              to="/progress"
              className="inline-flex items-center gap-2 rounded-md border border-hairline px-5 py-2.5 text-sm transition-colors hover:bg-accent"
            >
              Open progress
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-background/40 p-4 lg:p-5">
          <section>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <NotebookPen className="h-3 w-3 text-signal" />
              Plan Window
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">
              {planStart && planEnd
                ? `${formatDate(planStart, { month: "short", day: "numeric" })} to ${formatDate(planEnd, { month: "short", day: "numeric" })}`
                : "No imported workouts are available yet."}
            </p>
          </section>

          <div className="my-4 border-t border-hairline" />

          <section>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Flag className="h-3 w-3" />
              Week Status
            </div>
            <div className="mt-2">
              <span className="font-display text-3xl">
                {WEEK_STATUS_META[snapshot.weekStatus].label}
              </span>
              <p className="mt-2 text-xs text-muted-foreground">
                {WEEK_STATUS_META[snapshot.weekStatus].helper}
              </p>
            </div>
          </section>

          {closestWorkout && (
            <>
              <div className="my-4 border-t border-hairline" />
              <section>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Nearest Workout
                </div>
                <div className="mt-1 text-sm text-foreground/90">{closestWorkout.title}</div>
                <div className="mt-2 text-[11px] font-mono-num text-muted-foreground">
                  {formatDate(closestWorkout.date, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-3xl leading-none">{value}</span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
    </div>
  );
}

function summarizeUpcomingWorkout(
  workout: Parameters<typeof workoutDistanceKm>[0] & { title: string },
) {
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);

  if (workout.type === "rest") {
    return "Keep it light.";
  }

  if (km && duration > 0) {
    return `${km}km · ${duration}′`;
  }

  if (km) {
    return `${km}km`;
  }

  if (duration > 0) {
    return `${duration}′`;
  }

  const intervalStep = workout.steps.find((step) => step.repeats && step.work);

  if (intervalStep?.repeats && intervalStep.work?.distance_km) {
    const meters = Math.round(intervalStep.work.distance_km * 1000);
    return `${intervalStep.repeats} × ${meters}m`;
  }

  if (intervalStep?.repeats && intervalStep.work?.duration_min) {
    return `${intervalStep.repeats} × ${intervalStep.work.duration_min}′`;
  }

  return TYPE_META[workout.type].label;
}
