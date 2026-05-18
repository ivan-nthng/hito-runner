import type { StructuredFirstPlanOnboardingInput } from "@/lib/structured-first-plan-onboarding";
import type { VoiceToPlanSupplement } from "@/lib/voice-to-plan-authoring";

export type WeekdayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
export type BenchmarkKind = StructuredFirstPlanOnboardingInput["benchmark"]["kind"];
export type GoalDistance = StructuredFirstPlanOnboardingInput["goal"]["goalDistance"];
export type GoalStyle = StructuredFirstPlanOnboardingInput["goal"]["goalStyle"];
export type TerrainFocus = StructuredFirstPlanOnboardingInput["goal"]["terrainFocus"];
export type StrengthPreference = NonNullable<
  NonNullable<StructuredFirstPlanOnboardingInput["strength"]>["preference"]
>;

export interface StructuredConstructorState {
  age: string;
  weightKg: string;
  heightCm: string;
  benchmarkKind: BenchmarkKind;
  recent5kTime: string;
  recent5kPace: string;
  fixedRestDays: WeekdayName[];
  goalDistance: GoalDistance;
  goalStyle: GoalStyle;
  targetTime: string;
  targetDate: string;
  terrainFocus: TerrainFocus;
  strengthPreference: StrengthPreference;
  comment: string;
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

export const BENCHMARK_OPTIONS: { value: BenchmarkKind; label: string; copy: string }[] = [
  {
    value: "recent_5k_time",
    label: "Recent 5K time",
    copy: "Use a race or hard recent effort.",
  },
  {
    value: "recent_5k_pace",
    label: "Recent 5K pace",
    copy: "Useful if you remember pace, not finish time.",
  },
  {
    value: "unknown",
    label: "I do not know",
    copy: "Hito will start more conservatively.",
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
  benchmarkKind,
  recent5kTime,
  recent5kPace,
  fixedRestDays,
  goalDistance,
  goalStyle,
  targetTime,
  targetDate,
  terrainFocus,
  strengthPreference,
  comment,
}: StructuredConstructorState):
  | { ok: true; input: StructuredFirstPlanOnboardingInput }
  | {
      ok: false;
      error: string;
    } {
  const runningDaysPerWeek = deriveRunningDaysPerWeek(fixedRestDays);
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

  if (runningDaysPerWeek > WEEKDAY_OPTIONS.length - fixedRestDays.length) {
    return {
      ok: false,
      error: "Running days per week must fit outside the fixed rest days.",
    };
  }

  const trimmed5kTime = recent5kTime.trim();
  const trimmed5kPace = recent5kPace.trim();
  const trimmedTargetTime = targetTime.trim();
  const trimmedTargetDate = targetDate.trim();
  const trimmedComment = comment.trim();

  if (benchmarkKind === "recent_5k_time" && !trimmed5kTime) {
    return { ok: false, error: "Add a recent 5K time or choose I do not know." };
  }

  if (benchmarkKind === "recent_5k_pace" && !trimmed5kPace) {
    return { ok: false, error: "Add a recent 5K pace or choose I do not know." };
  }

  if (goalStyle === "target_time" && !trimmedTargetTime) {
    return { ok: false, error: "Target time is required when goal style is target time." };
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
        benchmarkKind === "recent_5k_time"
          ? {
              kind: "recent_5k_time",
              recent5kTime: trimmed5kTime,
              recent5kPace: null,
            }
          : benchmarkKind === "recent_5k_pace"
            ? {
                kind: "recent_5k_pace",
                recent5kPace: trimmed5kPace,
                recent5kTime: null,
              }
            : {
                kind: "unknown",
                recent5kTime: null,
                recent5kPace: null,
              },
      availability: {
        runningDaysPerWeek,
        fixedRestDays,
      },
      goal: {
        goalDistance,
        goalStyle,
        terrainFocus,
        targetTime: goalStyle === "target_time" ? trimmedTargetTime : null,
        targetDate: goalStyle === "target_time" ? trimmedTargetDate || null : null,
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
  benchmarkKind,
  recent5kTime,
  recent5kPace,
  fixedRestDays,
  goalStyle,
  targetTime,
}: Pick<
  StructuredConstructorState,
  | "age"
  | "weightKg"
  | "heightCm"
  | "benchmarkKind"
  | "recent5kTime"
  | "recent5kPace"
  | "fixedRestDays"
  | "goalStyle"
  | "targetTime"
>) {
  const profileComplete =
    requiredNumber(age, "Age", { min: 13, max: 100, integer: true }).ok &&
    requiredNumber(weightKg, "Weight", { min: 30, max: 250, increment: 0.5 }).ok &&
    requiredNumber(heightCm, "Height", { min: 120, max: 230, integer: true }).ok;
  const benchmarkComplete =
    benchmarkKind === "unknown" ||
    (benchmarkKind === "recent_5k_time" && Boolean(recent5kTime.trim())) ||
    (benchmarkKind === "recent_5k_pace" && Boolean(recent5kPace.trim()));
  const hasTrainingDay = fixedRestDays.length < WEEKDAY_OPTIONS.length;
  const targetComplete = goalStyle !== "target_time" || Boolean(targetTime.trim());

  return profileComplete && benchmarkComplete && hasTrainingDay && targetComplete;
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
