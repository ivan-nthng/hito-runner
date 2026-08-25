import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { HitoButton } from "@/components/ui/button";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { Icon } from "@/components/ui/icon";
import { feedbackMarkerMeta } from "@/components/workout-feedback-marker-presentation";
import {
  displayExecutableTargetEntries,
  displayWorkoutStructureEntries,
  formatDurationMin,
  findWorkout,
  primaryWorkoutTarget,
  type TrainingSnapshot,
  workoutTypeMeta,
  workoutDistanceKm,
  workoutDuration,
  weekOf,
} from "@/lib/training";
import { formatUiDate, formatUiNumber } from "@/lib/ui-locale";
import { getHitoKnownProductMessage, type HitoProductMessageKey } from "@/lib/ui-locale-messages";

const WORKOUT_TYPE_MESSAGE_KEYS = {
  easy: "Easy run",
  steady_or_easy: "Steady",
  long_run: "Long run",
  quality: "Quality / Intervals",
  rest: "Rest",
} as const satisfies Record<TrainingSnapshot["workouts"][number]["type"], HitoProductMessageKey>;

export function TodayHero({ snapshot }: { snapshot: TrainingSnapshot }) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const scheduledWorkout = findWorkout(snapshot.workouts, snapshot.currentDate);
  const nextWorkout = snapshot.workouts.find(
    (item) => item.date > snapshot.currentDate && item.type !== "rest",
  );

  if (!scheduledWorkout && nextWorkout) {
    return <NextWorkoutLaterHero snapshot={snapshot} nextWorkout={nextWorkout} />;
  }

  const workout =
    scheduledWorkout ??
    findWorkout(weekOf(snapshot.workouts, snapshot.currentDate), snapshot.currentDate);
  if (!workout) return null;

  const feedbackMeta =
    workout.completionOrigin === "fit_activity" &&
    workout.feedbackMarker?.state === "feedback_ready"
      ? feedbackMarkerMeta(workout.feedbackMarker)
      : null;
  const meta = workoutTypeMeta(workout);
  const isRestDay = workout.type === "rest";
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);
  const target = primaryWorkoutTarget(workout);
  const targetEntries = displayExecutableTargetEntries(target, workout.metricMode);
  const primaryTarget = targetEntries[0] ?? null;
  const structureOnly = workout.metricMode.executableMode === "structure_only_executable";
  const primaryStructureEntry =
    !primaryTarget && structureOnly ? (displayWorkoutStructureEntries(workout)[0] ?? null) : null;
  const paceTarget = targetEntries.find(
    (entry) => entry.key === "pace_min_per_km_range" || entry.key === "pace",
  );
  const heroMetrics = isRestDay
    ? []
    : [
        km != null
          ? {
              label: message("Distance"),
              value: formatUiNumber(km, locale, { maximumFractionDigits: 2 }),
              unit: "km",
            }
          : null,
        duration > 0 ? { label: message("Duration"), value: formatDurationMin(duration) } : null,
        primaryTarget
          ? {
              label: getHitoKnownProductMessage(locale, primaryTarget.label),
              value: primaryTarget.value,
            }
          : null,
        primaryStructureEntry
          ? {
              label: getHitoKnownProductMessage(locale, primaryStructureEntry.label),
              value: primaryStructureEntry.value,
            }
          : null,
        paceTarget && paceTarget.key !== primaryTarget?.key
          ? { label: message("Pace"), value: paceTarget.value }
          : null,
      ].filter(
        (metric): metric is { label: string; value: string; unit?: string } => metric != null,
      );
  const workoutSupportText = isRestDay
    ? message("Keep the day light unless a small recovery assignment is actually planned.")
    : (workout.notes?.trim() ?? message("Open the workout for segment-by-segment instructions."));
  const hasResult =
    workout.status === "completed" || workout.status === "partial" || Boolean(workout.log);
  const resultActionLabel = hasResult ? message("View result") : message("Mark complete");

  return (
    <section className="pt-1 lg:pt-2">
      <div className="hito-workout-hero-grid">
        <div>
          <div className="hito-technical-sm text-secondary flex flex-wrap items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
            <span style={{ color: meta.content }}>
              {message(WORKOUT_TYPE_MESSAGE_KEYS[workout.type])}
            </span>
            <span className="opacity-50">·</span>
            <span className="text-muted-foreground">
              {formatUiDate(snapshot.currentDate, locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="text-signal">· {message("Today")}</span>
          </div>

          <h2 className="hito-ui-title-lg mt-3 max-w-2xl text-foreground">
            {isRestDay ? message("Rest day") : workout.title}
          </h2>

          <p className="hito-body-md text-secondary mt-4 max-w-xl">{workoutSupportText}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <HitoButton asChild size="sm" variant="primary">
              <Link to="/workout/$date" params={{ date: snapshot.currentDate }}>
                {isRestDay ? message("Open day") : message("Open workout")}
                <Icon name="arrow-up-right" size="xs" />
              </Link>
            </HitoButton>
            {!isRestDay && (
              <HitoButton asChild size="sm" tone="success" variant="ghost">
                <Link
                  to="/workout/$date"
                  params={{ date: snapshot.currentDate }}
                  search={{ tab: "complete" } as never}
                >
                  <Icon name={hasResult ? "check-circle" : "check"} size="xs" />
                  {resultActionLabel}
                </Link>
              </HitoButton>
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

        {heroMetrics.length > 0 ? (
          <div className="flex flex-wrap justify-start gap-5 sm:justify-end sm:gap-6">
            {heroMetrics.map((metric) => (
              <Metric
                key={`${metric.label}-${metric.value}`}
                label={metric.label}
                value={metric.value}
                unit={metric.unit}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-sm border-y border-hairline py-4">
            <div className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-background/70">
                <span className="h-4 w-4 rounded-full border border-hairline bg-surface/70" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-secondary">
                  {message("No workout metrics are planned today.")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {message("Leave room for recovery.")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 border-b border-hairline" />
    </section>
  );
}

function NextWorkoutLaterHero({
  snapshot,
  nextWorkout,
}: {
  snapshot: TrainingSnapshot;
  nextWorkout: TrainingSnapshot["workouts"][number];
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const todayLabel = formatUiDate(snapshot.currentDate, locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const todayShort = formatUiDate(snapshot.currentDate, locale, {
    month: "short",
    day: "numeric",
  });
  const nextShort = formatUiDate(nextWorkout.date, locale, {
    month: "short",
    day: "numeric",
  });

  return (
    <section className="pt-1 lg:pt-2">
      <div className="hito-workout-hero-grid">
        <div>
          <div className="hito-technical-sm text-secondary flex flex-wrap items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
            <span className="text-signal">{message("Today · {date}", { date: todayLabel })}</span>
            <span className="opacity-50">·</span>
            <span>{message("No scheduled workout")}</span>
          </div>

          <h2 className="hito-ui-title-lg mt-3 max-w-2xl text-foreground">
            {message("Your next workout is scheduled later.")}
          </h2>

          <p className="hito-body-md text-secondary mt-4 max-w-xl">
            {message("Today is {today}, while your next Calendar workout is on {nextDate}.", {
              today: todayShort,
              nextDate: nextShort,
            })}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <HitoButton asChild size="sm" variant="primary">
              <Link to="/workout/$date" params={{ date: nextWorkout.date }}>
                {message("Open nearest workout")}
                <Icon name="arrow-up-right" size="xs" />
              </Link>
            </HitoButton>
            <HitoButton asChild size="sm" variant="secondary">
              <Link to="/progress">{message("Open progress")}</Link>
            </HitoButton>
          </div>
        </div>

        <div>
          <DismissibleSupportNote
            title={message("Calendar")}
            icon={<Icon name="plan-note" size="xs" className="text-signal" />}
          >
            {message("Next workout {date}", { date: nextShort })}
          </DismissibleSupportNote>

          <section className="py-4">
            <div>
              <div className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">
                {message("Next Workout")}
              </div>
              <div className="mt-1 text-sm text-foreground">{nextWorkout.title}</div>
              <div className="hito-technical-sm text-tertiary mt-2">
                {formatUiDate(nextWorkout.date, locale, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="mt-6 border-b border-hairline" />
    </section>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="hito-metric">
      <div className="flex items-baseline justify-center gap-1">
        <span className="hito-metric-value">{value}</span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      <div className="hito-metric-label">{label}</div>
    </div>
  );
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
  const message = useHitoProductMessage();

  if (!isVisible) {
    return null;
  }

  return (
    <section className="pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 hito-label-sm uppercase tracking-[0.18em] text-tertiary">
            {icon}
            {title}
          </div>
          <p className="hito-body-sm mt-1 text-secondary">{children}</p>
        </div>
        <HitoButton
          type="button"
          onClick={() => setIsVisible(false)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          iconOnly
          size="xs"
          variant="ghost"
          aria-label={message("Dismiss {title}", { title })}
        >
          <Icon name="close" size="xs" />
        </HitoButton>
      </div>
    </section>
  );
}
