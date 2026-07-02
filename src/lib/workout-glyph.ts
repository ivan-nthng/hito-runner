import { workoutPlannedLanguage, type Workout, type WorkoutType } from "@/lib/training";
import type { CalendarIconKey } from "@/lib/rich-workout-model";

export type WorkoutGlyphKind =
  | "easy"
  | "recovery"
  | "steady"
  | "long"
  | "tempo"
  | "intervals"
  | "progression"
  | "race"
  | "hills"
  | "trail"
  | "quality"
  | "rest";

const CALENDAR_ICON_GLYPH: Record<CalendarIconKey, WorkoutGlyphKind> = {
  easy: "easy",
  recovery: "recovery",
  steady: "steady",
  long: "long",
  tempo: "tempo",
  intervals: "intervals",
  progression: "progression",
  race: "race",
  hills: "hills",
  trail: "trail",
  quality: "quality",
  rest: "rest",
};

export function workoutGlyphFromCalendarIconKey(iconKey: CalendarIconKey): WorkoutGlyphKind {
  return CALENDAR_ICON_GLYPH[iconKey];
}

export function workoutGlyphKind(
  workout: Pick<
    Workout,
    | "type"
    | "title"
    | "steps"
    | "sourceWorkoutType"
    | "workoutFamily"
    | "workoutIdentity"
    | "calendarIconKey"
    | "metricMode"
    | "plannedWorkoutLanguage"
  >,
): WorkoutGlyphKind {
  return workoutGlyphFromCalendarIconKey(workoutPlannedLanguage(workout).canonical.calendarIconKey);
}

export function workoutTypeToGlyphKind(type: WorkoutType): WorkoutGlyphKind {
  if (type === "rest") return "rest";
  if (type === "long_run") return "long";
  if (type === "quality") return "quality";
  return "easy";
}
