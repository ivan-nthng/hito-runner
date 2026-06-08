import type { FirstPlanGoalDistance } from "@/lib/first-plan-authoring-utils";
import { buildProgressiveMetricTruth } from "@/lib/plan-presets/progressive-metric-truth";
import type { PlanPresetCardInput, PlanPresetMetricTruthSummary } from "@/lib/plan-presets/schema";
import {
  deriveAvailableTrainingWeekdays,
  type RunnerFitnessLevel,
} from "@/lib/runner-training-preferences";
import { todayIso } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export type ProgressivePlanPresetContext = {
  startDate: string;
  runningDaysPerWeek: number | null;
  fixedRestDays: WeekdayName[];
  preferredLongRunDay: WeekdayName | null;
  longRunDay: WeekdayName;
  fitnessLevel: RunnerFitnessLevel | null;
  hasBenchmarkTruth: boolean;
  hasMinimumProfile: boolean;
  targetDate: string | null;
  targetTime: string | null;
  goalDistance: FirstPlanGoalDistance | null;
  comment: string;
  metricTruth: PlanPresetMetricTruthSummary;
  availableWeekdayCount: number;
};

export function buildProgressiveContext(input: PlanPresetCardInput): ProgressivePlanPresetContext {
  const fixedRestDays = WEEKDAY_NAMES.filter((weekday) =>
    (input.availability?.fixedRestDays ?? []).includes(weekday),
  );
  const availableWeekdays = deriveAvailableTrainingWeekdays(fixedRestDays);
  const preferredLongRunDay = input.availability?.preferredLongRunDay ?? null;
  const profile = input.profile ?? null;
  const fitnessLevel = input.benchmark?.fitnessLevel ?? null;
  const recent5kTime = input.benchmark?.recent5kTime?.trim() ?? "";
  const hasBenchmarkTruth = recent5kTime.length > 0;
  const hasProfile =
    typeof profile?.age === "number" &&
    typeof profile.weightKg === "number" &&
    typeof profile.heightCm === "number";
  const hasMinimumProfile =
    hasProfile && fitnessLevel != null && (fitnessLevel !== "custom" || hasBenchmarkTruth);

  return {
    startDate: input.schedule?.startDate?.trim() || todayIso(),
    runningDaysPerWeek: input.availability?.runningDaysPerWeek ?? null,
    fixedRestDays,
    preferredLongRunDay,
    longRunDay: chooseProgressiveLongRunDay(availableWeekdays, preferredLongRunDay),
    fitnessLevel,
    hasBenchmarkTruth,
    hasMinimumProfile,
    targetDate: input.schedule?.targetDate?.trim() || input.goal?.targetDate?.trim() || null,
    targetTime: input.goal?.targetTime?.trim() || null,
    goalDistance: input.goal?.goalDistance ?? null,
    comment: input.comment?.trim() ?? "",
    metricTruth: buildProgressiveMetricTruth(input, {
      defaultEstimatedHrAvailable: typeof profile?.age === "number",
      hasBenchmarkTruth,
    }),
    availableWeekdayCount: availableWeekdays.length,
  };
}

function chooseProgressiveLongRunDay(
  availableWeekdays: readonly WeekdayName[],
  preferredLongRunDay: WeekdayName | null,
) {
  if (preferredLongRunDay && availableWeekdays.includes(preferredLongRunDay)) {
    return preferredLongRunDay;
  }

  if (availableWeekdays.includes("Saturday")) {
    return "Saturday";
  }

  if (availableWeekdays.includes("Sunday")) {
    return "Sunday";
  }

  return availableWeekdays.at(-1) ?? "Sunday";
}
