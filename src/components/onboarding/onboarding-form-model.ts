import type { StructuredFirstPlanOnboardingInput } from "@/lib/structured-first-plan-onboarding";
import { parseDurationSeconds, parsePaceSecondsPerKm } from "@/lib/first-plan-authoring-utils";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";

export type WeekdayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
export type GoalDistance = StructuredFirstPlanOnboardingInput["goal"]["goalDistance"];
export type GoalStyle = StructuredFirstPlanOnboardingInput["goal"]["goalStyle"];
export type TerrainFocus = StructuredFirstPlanOnboardingInput["goal"]["terrainFocus"];
export type WatchAccess = NonNullable<
  NonNullable<StructuredFirstPlanOnboardingInput["execution"]>["watchAccess"]
>;
export type GuidancePreference = NonNullable<
  NonNullable<StructuredFirstPlanOnboardingInput["execution"]>["guidancePreference"]
>;
export type StrengthPreference = NonNullable<
  NonNullable<StructuredFirstPlanOnboardingInput["strength"]>["preference"]
>;
export type PlanGoalChoice = "" | "10k" | "half_marathon" | "marathon" | "custom";

export interface StructuredConstructorState {
  age: string;
  weightKg: string;
  heightCm: string;
  fitnessLevel: RunnerFitnessLevel;
  recent5kTime: string;
  recent5kPace: string;
  fixedRestDays: WeekdayName[];
  restDaysAnswered: boolean;
  maxRunningDaysPerWeek: string;
  preferredLongRunDay: WeekdayName | "";
  goalDistance: GoalDistance;
  goalStyle: GoalStyle;
  targetTime: string;
  startDate: string;
  targetDate: string;
  planGoalChoice: PlanGoalChoice;
  planGoalCustomDistanceKm: string;
  planGoalCustomDistanceLabel: string;
  planGoalFinishTime: string;
  planGoalTargetDate: string;
  terrainFocus: TerrainFocus;
  watchAccess: WatchAccess;
  guidancePreference: GuidancePreference;
  strengthPreference: StrengthPreference;
  comment: string;
}

export const ONBOARDING_TEXTAREA_CLASS =
  "hito-field hito-field-secondary hito-textarea-md resize-none";

export const WEEKDAY_OPTIONS: { value: WeekdayName; label: string }[] = [
  { value: "Monday", label: "Mon" },
  { value: "Tuesday", label: "Tue" },
  { value: "Wednesday", label: "Wed" },
  { value: "Thursday", label: "Thu" },
  { value: "Friday", label: "Fri" },
  { value: "Saturday", label: "Sat" },
  { value: "Sunday", label: "Sun" },
] as const;

export const FITNESS_LEVEL_OPTIONS: {
  value: RunnerFitnessLevel;
  label: string;
  copy: string;
}[] = [
  {
    value: "new_to_running",
    label: "New to running",
    copy: "Start gently and build the habit first.",
  },
  {
    value: "beginner",
    label: "Beginner",
    copy: "You run sometimes and want a steady base.",
  },
  {
    value: "running_regularly",
    label: "Running regularly",
    copy: "You already run most weeks.",
  },
  {
    value: "performance_focused",
    label: "Performance focused",
    copy: "You can handle more structured quality work.",
  },
  {
    value: "custom",
    label: "I know my recent 5K",
    copy: "Use a recent 5K time or pace when you have one.",
  },
];

export type PresetPrimaryFitnessLevel = Exclude<RunnerFitnessLevel, "custom">;

export const PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS: {
  value: PresetPrimaryFitnessLevel;
  label: string;
  copy: string;
}[] = [
  {
    value: "new_to_running",
    label: "New to running",
    copy: "Start gently and build the habit first.",
  },
  {
    value: "beginner",
    label: "Beginner",
    copy: "You run sometimes and want a steady base.",
  },
  {
    value: "running_regularly",
    label: "Running regularly",
    copy: "You already run most weeks.",
  },
  {
    value: "performance_focused",
    label: "Performance focused",
    copy: "You can handle more structured quality work.",
  },
];

export const GOAL_DISTANCE_OPTIONS: { value: GoalDistance; label: string }[] = [
  { value: "build_consistency", label: "Build consistency" },
  { value: "5k", label: "5K" },
  { value: "10k", label: "10K" },
  { value: "half_marathon", label: "Half marathon" },
  { value: "marathon", label: "Marathon" },
  { value: "ultra_marathon", label: "Ultra marathon" },
  { value: "mountain_running", label: "Mountain running" },
];

export const GOAL_STYLE_OPTIONS: { value: GoalStyle; label: string }[] = [
  { value: "relaxed", label: "Relaxed" },
  { value: "balanced", label: "Balanced" },
  { value: "ambitious", label: "Ambitious" },
  { value: "target_time", label: "Target time" },
];

export const TERRAIN_OPTIONS: { value: TerrainFocus; label: string; copy: string }[] = [
  { value: "standard", label: "Standard", copy: "Roads, paths, or usual mixed terrain." },
  { value: "rolling", label: "Rolling", copy: "Some hills are welcome." },
  { value: "mountain", label: "Mountain", copy: "Prepare for sustained climbs or descents." },
];

export const GUIDANCE_PREFERENCE_OPTIONS: {
  value: GuidancePreference;
  label: string;
  copy: string;
}[] = [
  { value: "effort", label: "Effort", copy: "Use RPE and simple running cues." },
  {
    value: "pace",
    label: "Pace",
    copy: "Use broad pace targets when benchmark truth supports it.",
  },
  { value: "heart_rate", label: "Heart rate", copy: "Use effort for now unless HR zones exist." },
  { value: "mixed", label: "Mixed", copy: "Blend cues with safe numeric targets when available." },
];

export const STRENGTH_OPTIONS: { value: StrengthPreference; label: string; copy: string }[] = [
  { value: "none", label: "None", copy: "Keep the plan running-only." },
  { value: "mobility", label: "Mobility", copy: "Add light mobility support where useful." },
  {
    value: "strength_mobility",
    label: "Strength / mobility support",
    copy: "Simple support only, not a detailed gym program.",
  },
];

export function resolveTerrainFocus(goalDistance: GoalDistance, terrainFocus: TerrainFocus) {
  if (goalDistance === "mountain_running") {
    return "mountain";
  }

  if (goalDistance === "marathon" || goalDistance === "ultra_marathon") {
    return terrainFocus ?? "standard";
  }

  return "standard";
}

export function normalizePresetPrimaryFitnessLevel(
  value: RunnerFitnessLevel,
): PresetPrimaryFitnessLevel {
  return value === "custom" ? "running_regularly" : value;
}

export function isPresetPrimarySetupReady({
  age,
  weightKg,
  heightCm,
}: Pick<StructuredConstructorState, "age" | "weightKg" | "heightCm">) {
  return (
    requiredNumber(age, "Age", { min: 13, max: 100, integer: true }).ok &&
    requiredNumber(weightKg, "Weight", { min: 30, max: 250, increment: 0.5 }).ok &&
    requiredNumber(heightCm, "Height", { min: 120, max: 230, integer: true }).ok
  );
}

export function isPositiveRecent5kTime(value: string) {
  const seconds = parseDurationSeconds(value);

  return seconds != null && seconds > 0;
}

export function isPositiveRecent5kPace(value: string) {
  const seconds = parsePaceSecondsPerKm(value);

  return seconds != null && seconds > 0;
}

export function formatTerrainFocus(terrainFocus: NonNullable<TerrainFocus>) {
  switch (terrainFocus) {
    case "standard":
      return "Standard";
    case "rolling":
      return "Rolling";
    case "mountain":
      return "Mountain";
  }
}

function requiredNumber(
  value: string,
  label: string,
  options: {
    min: number;
    max: number;
    integer?: boolean;
    increment?: number;
  },
):
  | { ok: true; value: number }
  | {
      ok: false;
      error: string;
    } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, error: `${label} is required.` };
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `${label} should be a number.` };
  }

  if (options.integer && !Number.isInteger(parsed)) {
    return { ok: false, error: `${label} must be a whole number.` };
  }

  if (parsed < options.min || parsed > options.max) {
    return { ok: false, error: `${label} must be between ${options.min} and ${options.max}.` };
  }

  if (options.increment && !Number.isInteger(parsed / options.increment)) {
    return { ok: false, error: `${label} must use ${options.increment} increments.` };
  }

  return { ok: true, value: parsed };
}

function optionalValidNumber(
  value: string,
  options: {
    min: number;
    max: number;
    integer?: boolean;
    increment?: number;
  },
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (options.integer && !Number.isInteger(parsed)) {
    return null;
  }

  if (parsed < options.min || parsed > options.max) {
    return null;
  }

  if (options.increment && !Number.isInteger(parsed / options.increment)) {
    return null;
  }

  return parsed;
}
