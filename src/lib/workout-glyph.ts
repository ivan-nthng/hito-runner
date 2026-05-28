import {
  resolveWorkoutVisibleType,
  workoutTypeMeta,
  type VisibleWorkoutType,
  type Workout,
  type WorkoutType,
} from "@/lib/training";

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

const VISIBLE_TYPE_GLYPH: Record<VisibleWorkoutType, WorkoutGlyphKind> = {
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
  >,
): WorkoutGlyphKind {
  if (workout.workoutIdentity === "marathon_steady_specificity") {
    return "steady";
  }

  const visibleType = resolveWorkoutVisibleType(workout);

  if (visibleType) {
    return VISIBLE_TYPE_GLYPH[visibleType];
  }

  const short = workoutTypeMeta(workout).short.toLowerCase();
  if (short === "easy") return "easy";
  if (short === "recovery") return "recovery";
  if (short === "steady") return "steady";
  if (short === "long") return "long";
  if (short === "tempo") return "tempo";
  if (short === "intervals") return "intervals";
  if (short === "progression") return "progression";
  if (short === "race") return "race";
  if (short === "hills") return "hills";
  if (short === "trail") return "trail";
  if (short === "quality") return "quality";
  if (short === "rest") return "rest";

  return "easy";
}

export function workoutTypeToGlyphKind(type: WorkoutType): WorkoutGlyphKind {
  if (type === "rest") return "rest";
  if (type === "long_run") return "long";
  if (type === "quality") return "quality";
  return "easy";
}
