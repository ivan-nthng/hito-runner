import { addDaysIso } from "@/lib/training";
import type {
  PlanPresetProgramSummaryFields,
  PlanPresetReason,
  PlanPresetRecipeSummary,
} from "@/lib/plan-presets/schema";
import type { WeekdayName } from "@/lib/weekday-rest-invariants";

export type PlanPresetProgramSummaryContext = {
  startDate: string;
  durationWeeks?: number;
  daysPerWeek: number;
  longRunDay: WeekdayName;
};

export function buildPlanPresetProgramSummaryFields({
  recipe,
  programSummaryContext,
  metricModeSummary,
  disabledReason,
  customRoutingReason,
}: {
  recipe: PlanPresetRecipeSummary;
  programSummaryContext: PlanPresetProgramSummaryContext;
  metricModeSummary: string;
  disabledReason: PlanPresetReason | null;
  customRoutingReason: PlanPresetReason | null;
}): PlanPresetProgramSummaryFields {
  const durationWeeks = programSummaryContext.durationWeeks ?? recipe.defaultHorizonWeeks;

  return {
    durationWeeks,
    startDate: programSummaryContext.startDate,
    estimatedEndDate: addDaysIso(programSummaryContext.startDate, durationWeeks * 7 - 1),
    daysPerWeek: programSummaryContext.daysPerWeek,
    longRunDay: programSummaryContext.longRunDay,
    programFamily: recipe.programFamily,
    workoutMixSummary: recipe.workoutMixSummary,
    keyWorkoutTypes: [...recipe.keyWorkoutTypes],
    metricModeSummary,
    whyThisFits: recipe.fitSummary,
    levelFitSummary: recipe.levelFitSummary,
    disabledReasonSummary: disabledReason?.message ?? null,
    customReasonSummary: customRoutingReason?.message ?? null,
  };
}
