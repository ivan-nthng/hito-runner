import { workoutTypeMeta, type Workout, type WorkoutType } from "@/lib/training";

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

export function workoutGlyphKind(
  workout: Pick<Workout, "type" | "title" | "steps" | "sourceWorkoutType">,
): WorkoutGlyphKind {
  if (workout.type === "rest") return "rest";
  if (workout.type === "long_run") return "long";

  const short = workoutTypeMeta(workout).short.toLowerCase();

  if (short === "recovery") return "recovery";
  if (short === "tempo") return "tempo";
  if (short === "intervals") return "intervals";
  if (short === "progression") return "progression";
  if (short === "race") return "race";
  if (workout.type === "quality") return "quality";

  return "easy";
}

export function workoutTypeToGlyphKind(type: WorkoutType): WorkoutGlyphKind {
  if (type === "rest") return "rest";
  if (type === "long_run") return "long";
  if (type === "quality") return "quality";
  return "easy";
}
