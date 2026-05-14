import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, NotebookPen, X } from "lucide-react";
import {
  feedbackMarkerMeta,
  formatDistanceKm,
  formatDate,
  findWorkout,
  primaryWorkoutTarget,
  type TrainingSnapshot,
  workoutTypeMeta,
  workoutDistanceKm,
  workoutDuration,
} from "@/lib/training";

export function TodayHero({ snapshot }: { snapshot: TrainingSnapshot }) {
  const workout = findWorkout(snapshot.workouts, snapshot.currentDate);
  if (!workout) {
    return <TodayFallback snapshot={snapshot} />;
  }
  const feedbackMeta = feedbackMarkerMeta(workout.feedbackMarker);
  const meta = workoutTypeMeta(workout);
  const isRestDay = workout.type === "rest";
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);
  const target = primaryWorkoutTarget(workout);
  const primaryTarget =
    typeof target?.hr_bpm_range === "string"
      ? target.hr_bpm_range
      : typeof target?.hr_bpm === "string"
        ? target.hr_bpm
        : typeof target?.pace_min_per_km_range === "string"
          ? target.pace_min_per_km_range
          : typeof target?.pace_range_min_km === "string"
            ? target.pace_range_min_km
            : typeof target?.pace === "string"
              ? target.pace
              : typeof target?.intensity === "string"
                ? target.intensity
                : null;
  const paceValue =
    typeof target?.pace_min_per_km_range === "string"
      ? target.pace_min_per_km_range
      : typeof target?.pace_range_min_km === "string"
        ? target.pace_range_min_km
        : typeof target?.pace === "string"
          ? target.pace
          : null;
  const paceHint =
    typeof target?.hint === "string"
      ? target.hint
      : typeof target?.cue === "string"
        ? target.cue
        : paceValue
          ? null
          : "Keep the effort relaxed";
  const workoutSupportText = isRestDay
    ? "Keep the day light unless a small recovery assignment is actually planned."
    : [workout.notes ?? "Keep the effort smooth and let the session carry the day.", paceHint]
        .filter(Boolean)
        .join(" · ");

  const tomorrowDate = new Date(`${snapshot.currentDate}T00:00:00`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = findWorkout(snapshot.workouts, tomorrowDate.toISOString().slice(0, 10));

  return (
    <section className="pt-2 lg:pt-4">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        <div>
          <div className="flex items-center gap-3 hito-section-subtitle">
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

          <p className="hito-support-copy mt-4 max-w-md">{workoutSupportText}</p>

          {!isRestDay ? (
            <>
              <div className="hito-metric-row mt-8 max-w-3xl">
                {km != null && <Metric label="Distance" value={formatDistanceKm(km)} unit="km" />}
                {duration > 0 && <Metric label="Duration" value={`${duration}`} unit="min" />}
                {primaryTarget && <Metric label="Target" value={primaryTarget} />}
                {paceValue && <Metric label="Pace" value={paceValue} />}
              </div>
            </>
          ) : (
            <div className="mt-8 max-w-md border-y border-hairline py-4">
              <div className="flex items-center gap-4">
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
              className="hito-button hito-button-primary hito-button-lg"
            >
              {isRestDay ? "Open day" : "Open workout"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            {!isRestDay && (
              <Link
                to="/workout/$date"
                params={{ date: snapshot.currentDate }}
                search={{ tab: "complete" } as never}
                className="hito-button hito-button-secondary hito-button-lg"
              >
                Mark complete
              </Link>
            )}
          </div>

          {!isRestDay && feedbackMeta && (
            <div className="mt-4">
              <Link
                to="/workout/$date"
                params={{ date: snapshot.currentDate }}
                search={{ tab: "feedback" } as never}
                className="hito-feedback-marker"
                data-state={feedbackMeta.state}
              >
                <span className="hito-feedback-marker-dot" />
                <span>{feedbackMeta.label}</span>
              </Link>
            </div>
          )}
        </div>

        <div className="lg:pt-10">
          {tomorrow && (
            <section className="border-t border-hairline py-4">
              <div>
                <div className="hito-section-subtitle">Tomorrow</div>
                <div className="mt-1 text-sm text-foreground/90">
                  {tomorrow.type === "rest" ? "Rest day" : tomorrow.title}
                </div>
                <div className="hito-caption mt-2 font-mono-num">
                  {summarizeUpcomingWorkout(tomorrow)}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      <div className="mt-8 border-b border-hairline" />
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
          })}, but this plan ends on ${formatDate(planEnd, {
            month: "short",
            day: "numeric",
          })}.`
        : "Open another day from the calendar whenever you want to review the plan.";

  return (
    <section className="pt-2 lg:pt-4">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center gap-3 hito-section-subtitle">
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

          <p className="hito-support-copy mt-4 max-w-md">{body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {closestWorkout && (
              <Link
                to="/workout/$date"
                params={{ date: closestWorkout.date }}
                className="hito-button hito-button-primary hito-button-lg"
              >
                Open nearest workout
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
            <Link to="/progress" className="hito-button hito-button-secondary hito-button-lg">
              Open progress
            </Link>
          </div>
        </div>

        <div>
          <DismissibleSupportNote
            title="Plan Window"
            icon={<NotebookPen className="h-3 w-3 text-signal" />}
          >
            {planStart && planEnd
              ? `${formatDate(planStart, { month: "short", day: "numeric" })} to ${formatDate(planEnd, { month: "short", day: "numeric" })}`
              : "No imported workouts are available yet."}
          </DismissibleSupportNote>

          {closestWorkout && (
            <section className="py-4">
              <div>
                <div className="hito-section-subtitle">Nearest Workout</div>
                <div className="mt-1 text-sm text-foreground/90">{closestWorkout.title}</div>
                <div className="hito-caption mt-2 font-mono-num">
                  {formatDate(closestWorkout.date, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      <div className="mt-8 border-b border-hairline" />
    </section>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="hito-metric">
      <div className="flex items-baseline justify-center gap-1">
        <span className="hito-metric-value text-xl">{value}</span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      <div className="hito-metric-label">{label}</div>
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
    return `${formatDistanceKm(km)}km · ${duration}′`;
  }

  if (km) {
    return `${formatDistanceKm(km)}km`;
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

  return workoutTypeMeta(workout).label;
}

function DismissibleSupportNote({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <section className="pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 hito-section-subtitle">
            {icon}
            {title}
          </div>
          <p className="hito-list-row-copy">{children}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="hito-button hito-button-ghost hito-button-xs aspect-square shrink-0 p-0 text-muted-foreground hover:text-foreground"
          aria-label={`Dismiss ${title}`}
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}
