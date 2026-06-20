import type {
  StructuredFirstPlanOnboardingInput,
  StructuredFirstPlanOnboardingRequestInput,
} from "@/lib/structured-first-plan-onboarding";
import { isHitoIsoDate } from "@/components/ui/hito-date-time-utils";
import { parsePaceSecondsPerKm } from "@/lib/first-plan-authoring-utils";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import type { VoiceToPlanSupplement } from "@/lib/voice-to-plan-authoring";

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

export function buildStructuredInput({
  age,
  weightKg,
  heightCm,
  fitnessLevel,
  recent5kTime,
  recent5kPace,
  fixedRestDays,
  restDaysAnswered,
  maxRunningDaysPerWeek,
  preferredLongRunDay,
  goalDistance,
  goalStyle,
  targetTime,
  startDate,
  targetDate,
  terrainFocus,
  guidancePreference,
  strengthPreference,
  comment,
}: StructuredConstructorState):
  | { ok: true; input: StructuredFirstPlanOnboardingRequestInput }
  | {
      ok: false;
      error: string;
    } {
  const runningDaysPerWeek = resolveRunningDaysPerWeek(fixedRestDays, maxRunningDaysPerWeek);
  const profileNumbers = {
    age: requiredNumber(age, "Age", { min: 13, max: 100, integer: true }),
    weightKg: requiredNumber(weightKg, "Weight", { min: 30, max: 250, increment: 0.5 }),
    heightCm: requiredNumber(heightCm, "Height", { min: 120, max: 230, integer: true }),
  };
  const invalidNumber = Object.values(profileNumbers).find((value) => !value.ok);

  if (invalidNumber?.ok === false) {
    return invalidNumber;
  }

  if (fixedRestDays.length >= WEEKDAY_OPTIONS.length) {
    return {
      ok: false,
      error: "Leave at least one weekday available for running.",
    };
  }

  if (!restDaysAnswered) {
    return {
      ok: false,
      error: "Choose fixed rest days or No fixed rest days.",
    };
  }

  if (!maxRunningDaysPerWeek.trim()) {
    return {
      ok: false,
      error: "Choose default running days per week.",
    };
  }

  if (runningDaysPerWeek > WEEKDAY_OPTIONS.length - fixedRestDays.length) {
    return {
      ok: false,
      error: "Running days per week must fit outside the fixed rest days.",
    };
  }

  const trimmed5kTime = recent5kTime.trim();
  const trimmed5kPace = recent5kPace.trim();
  const trimmedTargetTime = targetTime.trim();
  const trimmedStartDate = startDate.trim();
  const trimmedTargetDate = targetDate.trim();
  const trimmedComment = comment.trim();
  const hasRecent5kTime = trimmed5kTime.length > 0;
  const hasRecent5kPace = trimmed5kPace.length > 0;
  const recent5kTimeValid = isRecent5kTimeInAcceptedRange(trimmed5kTime);
  const recent5kPaceValid = isRecent5kPaceInAcceptedRange(trimmed5kPace);

  if (fitnessLevel === "custom") {
    if (hasRecent5kTime && !recent5kTimeValid) {
      return { ok: false, error: "Use a recent 5K time between 18:00 and 55:00." };
    }

    if (hasRecent5kPace && !recent5kPaceValid) {
      return { ok: false, error: "Use a recent 5K pace between 2:00/km and 15:00/km." };
    }

    if (!recent5kTimeValid && !recent5kPaceValid) {
      return {
        ok: false,
        error:
          "Use a recent 5K time between 18:00 and 55:00, or pace between 2:00/km and 15:00/km.",
      };
    }
  }

  if (goalStyle === "target_time" && !trimmedTargetTime) {
    return { ok: false, error: "Target time is required when goal style is target time." };
  }

  if (goalStyle === "target_time") {
    const targetTimeSeconds = parseDurationSeconds(trimmedTargetTime);

    if (targetTimeSeconds == null || targetTimeSeconds < 10 * 60 || targetTimeSeconds > 12 * 3600) {
      return { ok: false, error: "Use a realistic target time like 3:50:00." };
    }
  }

  if (trimmedStartDate && !isHitoIsoDate(trimmedStartDate)) {
    return { ok: false, error: "Use YYYY-MM-DD for the plan start date." };
  }

  if (trimmedTargetDate && !isHitoIsoDate(trimmedTargetDate)) {
    return { ok: false, error: "Use YYYY-MM-DD for the target date." };
  }

  if (
    goalStyle === "target_time" &&
    trimmedStartDate &&
    trimmedTargetDate &&
    diffIsoCalendarDays(trimmedTargetDate, trimmedStartDate) < 6
  ) {
    return {
      ok: false,
      error: "Target date must be at least 7 days after the plan start date.",
    };
  }

  return {
    ok: true,
    input: {
      profile: {
        age: profileNumbers.age.value,
        weightKg: profileNumbers.weightKg.value,
        heightCm: profileNumbers.heightCm.value,
      },
      benchmark:
        fitnessLevel === "custom"
          ? buildStructuredBenchmarkInput(trimmed5kTime, trimmed5kPace)
          : {
              kind: "unknown",
              recent5kTime: null,
              recent5kPace: null,
              fitnessLevel,
            },
      availability: {
        runningDaysPerWeek,
        fixedRestDays,
        preferredLongRunDay: preferredLongRunDay || null,
      },
      goal: {
        goalDistance,
        goalStyle,
        terrainFocus,
        targetTime: goalStyle === "target_time" ? trimmedTargetTime : null,
        targetDate: goalStyle === "target_time" ? trimmedTargetDate || null : null,
      },
      ...(trimmedStartDate || (goalStyle === "target_time" && trimmedTargetDate)
        ? {
            schedule: {
              startDate: trimmedStartDate || null,
              targetDate: goalStyle === "target_time" ? trimmedTargetDate || null : null,
            },
          }
        : {}),
      execution: {
        watchAccess: "watch_or_app",
        guidancePreference,
      },
      strength: {
        preference: strengthPreference,
      },
      comment: trimmedComment || null,
    },
  };
}

export function buildVoiceSupplementFromConstructorState({
  age,
  weightKg,
  heightCm,
  fixedRestDays,
  goalDistance,
  goalStyle,
  targetTime,
  targetDate,
  terrainFocus,
  watchAccess,
  guidancePreference,
  strengthPreference,
  recent5kTime,
  recent5kPace,
  comment,
}: StructuredConstructorState): VoiceToPlanSupplement {
  const supplement: VoiceToPlanSupplement = {
    fixedRestDays,
  };
  const validAge = optionalValidNumber(age, { min: 13, max: 100, integer: true });
  const validWeight = optionalValidNumber(weightKg, { min: 30, max: 250, increment: 0.5 });
  const validHeight = optionalValidNumber(heightCm, { min: 120, max: 230, integer: true });
  const trimmedTargetTime = targetTime.trim();
  const trimmedTargetDate = targetDate.trim();
  const trimmed5kTime = recent5kTime.trim();
  const trimmed5kPace = recent5kPace.trim();
  const trimmedComment = comment.trim();

  if (validAge != null) {
    supplement.age = validAge;
  }

  if (validWeight != null) {
    supplement.weightKg = validWeight;
  }

  if (validHeight != null) {
    supplement.heightCm = validHeight;
  }

  if (fixedRestDays.length > 0) {
    supplement.fixedRestDays = fixedRestDays;
  }

  if (goalDistance !== "build_consistency") {
    supplement.goalDistance = goalDistance;
  }

  if (goalStyle !== "balanced" || trimmedTargetTime) {
    supplement.goalStyle = goalStyle;
  }

  if (trimmedTargetTime) {
    supplement.targetTime = trimmedTargetTime;
  }

  if (trimmedTargetDate && goalStyle === "target_time") {
    supplement.targetDate = trimmedTargetDate;
  }

  if (terrainFocus && terrainFocus !== "standard") {
    supplement.terrainFocus = terrainFocus;
  }

  if (watchAccess !== "unknown") {
    supplement.watchAccess = watchAccess;
  }

  if (guidancePreference !== "effort") {
    supplement.guidancePreference = guidancePreference;
  }

  if (strengthPreference !== "none") {
    supplement.strengthPreference = strengthPreference;
  }

  if (trimmed5kTime) {
    supplement.recent5kTime = trimmed5kTime;
  }

  if (trimmed5kPace) {
    supplement.recent5kPace = trimmed5kPace;
  }

  if (trimmedComment) {
    supplement.comment = trimmedComment;
  }

  return supplement;
}

export function deriveRunningDaysPerWeek(fixedRestDays: WeekdayName[]) {
  const allowedDayCount = WEEKDAY_OPTIONS.length - fixedRestDays.length;

  return Math.min(4, Math.max(1, allowedDayCount));
}

export function resolveRunningDaysPerWeek(fixedRestDays: WeekdayName[], requestedValue: string) {
  const parsed = Number.parseInt(requestedValue.trim(), 10);

  if (!Number.isFinite(parsed)) {
    return deriveRunningDaysPerWeek(fixedRestDays);
  }

  return parsed;
}

export function resolveTerrainFocus(goalDistance: GoalDistance, terrainFocus: TerrainFocus) {
  if (goalDistance === "mountain_running") {
    return "mountain";
  }

  if (goalDistance === "marathon" || goalDistance === "ultra_marathon") {
    return terrainFocus ?? "standard";
  }

  return "standard";
}

export function isStructuredConstructorReady({
  age,
  weightKg,
  heightCm,
  fitnessLevel,
  recent5kTime,
  recent5kPace,
  fixedRestDays,
  restDaysAnswered,
  maxRunningDaysPerWeek,
  goalStyle,
  targetTime,
}: Pick<
  StructuredConstructorState,
  | "age"
  | "weightKg"
  | "heightCm"
  | "fitnessLevel"
  | "recent5kTime"
  | "recent5kPace"
  | "fixedRestDays"
  | "restDaysAnswered"
  | "maxRunningDaysPerWeek"
  | "goalStyle"
  | "targetTime"
>) {
  const profileComplete =
    requiredNumber(age, "Age", { min: 13, max: 100, integer: true }).ok &&
    requiredNumber(weightKg, "Weight", { min: 30, max: 250, increment: 0.5 }).ok &&
    requiredNumber(heightCm, "Height", { min: 120, max: 230, integer: true }).ok;
  const benchmarkComplete =
    fitnessLevel !== "custom" ||
    isRecent5kTimeInAcceptedRange(recent5kTime.trim()) ||
    isRecent5kPaceInAcceptedRange(recent5kPace.trim());
  const hasTrainingDay = fixedRestDays.length < WEEKDAY_OPTIONS.length;
  const runningDaysPerWeek = resolveRunningDaysPerWeek(fixedRestDays, maxRunningDaysPerWeek);
  const runningDaysAnswered = maxRunningDaysPerWeek.trim().length > 0;
  const runningDayCountValid =
    restDaysAnswered &&
    runningDaysAnswered &&
    Number.isInteger(runningDaysPerWeek) &&
    runningDaysPerWeek >= 1 &&
    runningDaysPerWeek <= WEEKDAY_OPTIONS.length - fixedRestDays.length;
  const targetComplete = goalStyle !== "target_time" || Boolean(targetTime.trim());

  return (
    profileComplete && benchmarkComplete && hasTrainingDay && runningDayCountValid && targetComplete
  );
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

export function isRecent5kTimeInAcceptedRange(value: string) {
  const seconds = parseDurationSeconds(value);

  return seconds != null && seconds >= 18 * 60 && seconds <= 55 * 60;
}

export function isRecent5kPaceInAcceptedRange(value: string) {
  const seconds = parsePaceSecondsPerKm(value);

  return seconds != null && seconds >= 2 * 60 && seconds <= 15 * 60;
}

function buildStructuredBenchmarkInput(recent5kTime: string, recent5kPace: string) {
  if (isRecent5kTimeInAcceptedRange(recent5kTime)) {
    return {
      kind: "recent_5k_time" as const,
      recent5kTime,
      recent5kPace: null,
      fitnessLevel: "custom" as const,
    };
  }

  return {
    kind: "recent_5k_pace" as const,
    recent5kTime: null,
    recent5kPace,
    fitnessLevel: "custom" as const,
  };
}

function parseDurationSeconds(value: string) {
  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  if (parts.some((part) => !Number.isInteger(part) || part < 0)) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;

    if (minutes == null || seconds == null || seconds >= 60) {
      return null;
    }

    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;

  if (hours == null || minutes == null || seconds == null || minutes >= 60 || seconds >= 60) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function diffIsoCalendarDays(a: string, b: string) {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);
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

export function voiceResultMessage(result: { message?: string; reason?: string }) {
  if (result.message) {
    return result.message;
  }

  if (result.reason === "capability_locked") {
    return "Dictate-to-plan is not available for this account.";
  }

  return "Could not complete the dictated plan step yet.";
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
