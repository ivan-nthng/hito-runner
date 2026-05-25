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
  | "long"
  | "tempo"
  | "intervals"
  | "progression"
  | "race"
  | "quality"
  | "rest";

const VISIBLE_TYPE_GLYPH: Record<VisibleWorkoutType, WorkoutGlyphKind> = {
  easy: "easy",
  recovery: "recovery",
  long: "long",
  tempo: "tempo",
  intervals: "intervals",
  progression: "progression",
  race: "race",
  quality: "quality",
  rest: "rest",
};

export function workoutGlyphKind(
  workout: Pick<Workout, "type" | "title" | "steps" | "sourceWorkoutType">,
): WorkoutGlyphKind {
  const visibleType = resolveWorkoutVisibleType(workout);

  if (visibleType) {
    return VISIBLE_TYPE_GLYPH[visibleType];
  }

  const short = workoutTypeMeta(workout).short.toLowerCase();
  if (short === "easy") return "easy";
  if (short === "recovery") return "recovery";
  if (short === "long") return "long";
  if (short === "tempo") return "tempo";
  if (short === "intervals") return "intervals";
  if (short === "progression") return "progression";
  if (short === "race") return "race";
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
