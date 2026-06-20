import type {
  HitoCalendarDayBaseState,
  HitoCalendarDayResultState,
  HitoCalendarFeedbackState,
  HitoCalendarWorkoutIdentity,
} from "@/components/ui/hito-calendar-day";
import {
  formatDistanceKm,
  formatDurationMin,
  workoutDistanceKm,
  workoutDuration,
  workoutTypeMeta,
  type Status,
  type Workout,
} from "@/lib/training";
import { workoutGlyphKind } from "@/lib/workout-glyph";

export type CalendarDaySurfacePresentation = {
  feedback: HitoCalendarFeedbackState;
  result: HitoCalendarDayResultState;
  state: HitoCalendarDayBaseState;
  stateLabel?: string | null;
  supportingText?: string | null;
  title?: string;
  workout?: HitoCalendarWorkoutIdentity | null;
};

export const HITO_CALENDAR_REST_IDENTITY = {
  label: "Rest",
  color: "var(--rest)",
  glyph: "rest",
} satisfies HitoCalendarWorkoutIdentity;

export function buildWorkoutCalendarDayPresentation(
  workout: Workout | undefined,
  options: {
    feedback?: HitoCalendarFeedbackState;
    includeRestTitle?: boolean;
    stateLabel?: string | null;
    stripLocalizedPrefix?: boolean;
    supportingText?: string | null;
    title?: string | null;
  } = {},
): CalendarDaySurfacePresentation {
  if (!workout) {
    return buildRestCalendarDayPresentation({
      feedback: options.feedback,
      stateLabel: options.stateLabel,
      supportingText: options.supportingText,
      title:
        options.includeRestTitle && options.title !== null
          ? (options.title ?? "Rest day")
          : undefined,
    });
  }

  const state = calendarDayBaseState(workout);
  const hasWorkout = workout.type !== "rest";
  const title =
    options.title === undefined
      ? stripCalendarWorkoutTitle(workout.title, Boolean(options.stripLocalizedPrefix))
      : (options.title ?? undefined);

  return {
    feedback: options.feedback ?? "none",
    result: calendarDayResultState(workout.status, hasWorkout),
    state,
    stateLabel: options.stateLabel,
    supportingText:
      options.supportingText === undefined
        ? hasWorkout
          ? compactCalendarWorkoutSummary(workout)
          : null
        : options.supportingText,
    title: hasWorkout || options.includeRestTitle ? title : undefined,
    workout: calendarWorkoutIdentity(workout),
  };
}

export function buildRestCalendarDayPresentation(
  options: {
    feedback?: HitoCalendarFeedbackState;
    stateLabel?: string | null;
    supportingText?: string | null;
    title?: string;
  } = {},
): CalendarDaySurfacePresentation {
  return {
    feedback: options.feedback ?? "none",
    result: "none",
    state: "rest",
    stateLabel: options.stateLabel,
    supportingText: options.supportingText,
    title: options.title,
    workout: null,
  };
}

export function buildStaticCalendarDayPresentation({
  feedback = "none",
  kind,
  result = "none",
  stateLabel,
  supportingText,
  title,
  workout,
}: {
  feedback?: HitoCalendarFeedbackState;
  kind: "workout" | "rest";
  result?: HitoCalendarDayResultState;
  stateLabel?: string | null;
  supportingText?: string | null;
  title?: string;
  workout?: HitoCalendarWorkoutIdentity | null;
}): CalendarDaySurfacePresentation {
  if (kind === "rest") {
    return {
      ...buildRestCalendarDayPresentation({ feedback, stateLabel, supportingText }),
      workout: workout ?? HITO_CALENDAR_REST_IDENTITY,
    };
  }

  return {
    feedback,
    result,
    state: "workout",
    stateLabel,
    supportingText,
    title,
    workout,
  };
}

export function calendarDayBaseState(workout: Workout | undefined): HitoCalendarDayBaseState {
  if (!workout) return "rest";
  if (workout.type === "rest") return "rest";

  return "workout";
}

export function calendarDayResultState(
  status: Status,
  hasWorkout: boolean,
): HitoCalendarDayResultState {
  if (!hasWorkout) return "none";
  if (status === "completed" || status === "partial" || status === "skipped") return status;

  return "planned";
}

export function calendarWorkoutIdentity(workout: Workout): HitoCalendarWorkoutIdentity {
  const meta = workoutTypeMeta(workout);
  const label = meta.short;

  if (workout.type === "rest") {
    return HITO_CALENDAR_REST_IDENTITY;
  }

  if (workout.type === "long_run") {
    return {
      label: "Long",
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

export function compactCalendarWorkoutSummary(workout: Workout) {
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

function stripCalendarWorkoutTitle(title: string, stripLocalizedPrefix: boolean) {
  if (!stripLocalizedPrefix) return title;
  return title.replace(/^(Аэробный |Лёгкий )/, "");
}
