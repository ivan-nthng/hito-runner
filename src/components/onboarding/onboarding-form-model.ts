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
  startDate: string;
  targetDate: string;
  planGoalChoice: PlanGoalChoice;
  planGoalCustomDistanceKm: string;
  planGoalCustomDistanceLabel: string;
  planGoalFinishTime: string;
  planGoalTargetDate: string;
}

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
