import {
  RUNNER_FACING_BLOCK_TYPE_LABELS,
  RUNNER_FACING_WORKOUT_TYPE_LABELS,
  type RunnerFacingBlockType,
  type RunnerFacingWorkoutType,
} from "@/lib/planned-workout-language";

export const WORKOUT_COLOR_SHADE_STEPS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

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

export type WorkoutColorShadeStep = (typeof WORKOUT_COLOR_SHADE_STEPS)[number];
export type WorkoutColorStateSlot = (typeof WORKOUT_COLOR_STATE_SLOTS)[number];

export type WorkoutPrimitivePaletteId =
  | "slate"
  | "ice-blue"
  | "maya-blue"
  | "azure"
  | "deep-indigo"
  | "orchid"
  | "tiger-flame"
  | "coral"
  | "burnt-orange"
  | "sunflower-gold"
  | "mint"
  | "lavender";

export type WorkoutSectionColorRole = Exclude<RunnerFacingBlockType, "repeat_set">;

export const WORKOUT_PRIMITIVE_PALETTE_FAMILIES: ReadonlyArray<{
  id: WorkoutPrimitivePaletteId;
  label: string;
  base: string;
  tokenPrefix: `--hito-workout-${WorkoutPrimitivePaletteId}`;
}> = [
  { id: "slate", label: "Slate", base: "#6B7280", tokenPrefix: "--hito-workout-slate" },
  { id: "ice-blue", label: "Ice Blue", base: "#BEE9FF", tokenPrefix: "--hito-workout-ice-blue" },
  { id: "maya-blue", label: "Maya Blue", base: "#7CC3FF", tokenPrefix: "--hito-workout-maya-blue" },
  { id: "azure", label: "Azure", base: "#5C95FF", tokenPrefix: "--hito-workout-azure" },
  {
    id: "deep-indigo",
    label: "Deep Indigo",
    base: "#4164FF",
    tokenPrefix: "--hito-workout-deep-indigo",
  },
  { id: "orchid", label: "Orchid", base: "#7B61FF", tokenPrefix: "--hito-workout-orchid" },
  {
    id: "tiger-flame",
    label: "Tiger Flame",
    base: "#FE6237",
    tokenPrefix: "--hito-workout-tiger-flame",
  },
  { id: "coral", label: "Coral", base: "#FF5A3D", tokenPrefix: "--hito-workout-coral" },
  {
    id: "burnt-orange",
    label: "Burnt Orange",
    base: "#FF8A2C",
    tokenPrefix: "--hito-workout-burnt-orange",
  },
  {
    id: "sunflower-gold",
    label: "Sunflower Gold",
    base: "#FFB62E",
    tokenPrefix: "--hito-workout-sunflower-gold",
  },
  { id: "mint", label: "Mint", base: "#68D391", tokenPrefix: "--hito-workout-mint" },
  { id: "lavender", label: "Lavender", base: "#B39DFF", tokenPrefix: "--hito-workout-lavender" },
] as const;

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

const WORKOUT_TYPE_PRIMITIVES: Record<RunnerFacingWorkoutType, WorkoutPrimitivePaletteId> = {
  rest: "slate",
  recovery: "ice-blue",
  easy: "maya-blue",
  steady: "azure",
  long_run: "deep-indigo",
  progression: "orchid",
  tempo: "tiger-flame",
  intervals: "coral",
  hills: "burnt-orange",
  run_walk: "sunflower-gold",
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

const WORKOUT_SECTION_PRIMITIVES: Record<WorkoutSectionColorRole, WorkoutPrimitivePaletteId> = {
  warm_up: "maya-blue",
  run: "deep-indigo",
  walk: "mint",
  work: "tiger-flame",
  recover: "mint",
  finish: "sunflower-gold",
  cooldown: "lavender",
};

export const WORKOUT_TYPE_COLOR_ROLES = (
  Object.keys(WORKOUT_TYPE_TOKEN_NAMES) as RunnerFacingWorkoutType[]
).map((type) => ({
  type,
  label: RUNNER_FACING_WORKOUT_TYPE_LABELS[type],
  primitive: WORKOUT_TYPE_PRIMITIVES[type],
}));

export const WORKOUT_SECTION_COLOR_ROLES = (
  Object.keys(WORKOUT_SECTION_TOKEN_NAMES) as WorkoutSectionColorRole[]
).map((type) => ({
  type,
  label: RUNNER_FACING_BLOCK_TYPE_LABELS[type],
  primitive: WORKOUT_SECTION_PRIMITIVES[type],
}));

export function workoutPrimitiveColorToken(
  palette: WorkoutPrimitivePaletteId,
  step: WorkoutColorShadeStep,
) {
  return `--hito-workout-${palette}-${step}`;
}

export function workoutPrimitiveColorVar(
  palette: WorkoutPrimitivePaletteId,
  step: WorkoutColorShadeStep,
) {
  return `var(${workoutPrimitiveColorToken(palette, step)})`;
}

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
