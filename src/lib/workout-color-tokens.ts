import {
  RUNNER_FACING_BLOCK_TYPE_LABELS,
  RUNNER_FACING_WORKOUT_TYPE_LABELS,
  type RunnerFacingBlockType,
  type RunnerFacingWorkoutType,
} from "@/lib/planned-workout-language";

export const WORKOUT_COLOR_STATE_SLOTS = [
  "base",
  "muted",
  "surface",
  "hover",
  "active",
  "border",
  "ring",
  "foreground",
] as const;

export type WorkoutColorStateSlot = (typeof WORKOUT_COLOR_STATE_SLOTS)[number];

export type WorkoutSectionColorRole = Exclude<RunnerFacingBlockType, "repeat_set">;

const WORKOUT_TYPE_TOKEN_NAMES: Record<RunnerFacingWorkoutType, string> = {
  rest: "rest",
  recovery: "recovery",
  easy: "easy",
  steady: "steady",
  long_run: "long-run",
  progression: "progression",
  tempo: "tempo",
  intervals: "intervals",
  hills: "hills",
  run_walk: "run-walk",
};

const WORKOUT_SECTION_TOKEN_NAMES: Record<WorkoutSectionColorRole, string> = {
  warm_up: "warm-up",
  run: "run",
  walk: "recover",
  work: "work",
  recover: "recover",
  finish: "finish",
  cooldown: "cooldown",
};

export const WORKOUT_TYPE_COLOR_ROLES = (
  Object.keys(WORKOUT_TYPE_TOKEN_NAMES) as RunnerFacingWorkoutType[]
).map((type) => ({
  type,
  label: RUNNER_FACING_WORKOUT_TYPE_LABELS[type],
}));

export const WORKOUT_SECTION_COLOR_ROLES = (
  Object.keys(WORKOUT_SECTION_TOKEN_NAMES) as WorkoutSectionColorRole[]
).map((type) => ({
  type,
  label: RUNNER_FACING_BLOCK_TYPE_LABELS[type],
}));

export function workoutTypeColorToken(
  type: RunnerFacingWorkoutType,
  slot: WorkoutColorStateSlot = "base",
) {
  return `--hito-workout-type-${WORKOUT_TYPE_TOKEN_NAMES[type]}-${slot}`;
}

export function workoutTypeColorVar(
  type: RunnerFacingWorkoutType,
  slot: WorkoutColorStateSlot = "base",
) {
  return `var(${workoutTypeColorToken(type, slot)})`;
}

export function workoutSectionColorToken(
  type: WorkoutSectionColorRole,
  slot: WorkoutColorStateSlot = "base",
) {
  return `--hito-workout-section-${WORKOUT_SECTION_TOKEN_NAMES[type]}-${slot}`;
}

export function workoutSectionColorVar(
  type: WorkoutSectionColorRole,
  slot: WorkoutColorStateSlot = "base",
) {
  return `var(${workoutSectionColorToken(type, slot)})`;
}
