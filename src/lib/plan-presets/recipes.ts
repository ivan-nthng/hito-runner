import type { PlanPresetCardId, PlanPresetRecipeSummary } from "@/lib/plan-presets/schema";

export const PLAN_PRESET_RECIPE_VERSION = "v1";

export const PLAN_PRESET_RECIPES = [
  {
    cardId: "10k",
    recipeFamilyId: "10k_foundation",
    recipeId: "plan_preset_10k_foundation_v1",
    presetVersion: PLAN_PRESET_RECIPE_VERSION,
    distanceLabel: "10K",
    familyLabel: "Foundation",
    programFamily: "10K Foundation",
    minRunningDaysPerWeek: 3,
    maxRunningDaysPerWeek: 5,
    defaultHorizonWeeks: 10,
    commitmentSummary: "3-5 runs/week · conservative 10-week foundation",
    fitSummary: "Good for building dependable 10K fitness without target-date pressure.",
    workoutMixSummary:
      "Easy/recovery running, gentle strides, steady support, and a long-run habit.",
    keyWorkoutTypes: [
      "Recovery jogs",
      "Easy aerobic runs",
      "Easy runs with strides",
      "Steady support runs",
      "Long aerobic runs",
    ],
    levelFitSummary: "Best for beginner or recreational runners with 3-5 available run days.",
    avoidsSummary: "Avoids race-pace promises, hard interval loading, and fake pace or HR targets.",
    metricPolicySummary:
      "Uses structure-only executable targets unless a recent 5K plus watch/app support allows broad pace ranges.",
  },
  {
    cardId: "half_marathon",
    recipeFamilyId: "half_marathon_balanced",
    recipeId: "plan_preset_half_marathon_balanced_v1",
    presetVersion: PLAN_PRESET_RECIPE_VERSION,
    distanceLabel: "Half marathon",
    familyLabel: "Balanced",
    programFamily: "Half Marathon Balanced",
    minRunningDaysPerWeek: 4,
    maxRunningDaysPerWeek: 5,
    defaultHorizonWeeks: 12,
    commitmentSummary: "4-5 runs/week · balanced half-marathon base",
    fitSummary: "Best for recreational runners who want durable aerobic progress.",
    workoutMixSummary:
      "Easy volume, progression/tempo support, threshold durability, and long-run finish work.",
    keyWorkoutTypes: [
      "Easy aerobic runs",
      "Progression runs",
      "Controlled tempo sessions",
      "Half-marathon threshold durability",
      "Long runs with steady finish",
    ],
    levelFitSummary:
      "Best for runners with continuous-running support evidence and 4-5 available run days.",
    avoidsSummary: "Avoids unsupported race-pace work and keeps specificity backend-gated.",
    metricPolicySummary:
      "Keeps metric targets backend-owned: pace requires a recent 5K, HR targets require personal zone truth.",
  },
  {
    cardId: "marathon",
    recipeFamilyId: "marathon_base",
    recipeId: "plan_preset_marathon_base_v1",
    presetVersion: PLAN_PRESET_RECIPE_VERSION,
    distanceLabel: "Marathon",
    familyLabel: "Base",
    programFamily: "Marathon Base",
    minRunningDaysPerWeek: 4,
    maxRunningDaysPerWeek: 5,
    defaultHorizonWeeks: 16,
    commitmentSummary: "4-5 runs/week · base, durability, cutback, and taper",
    fitSummary: "For runners with enough weekly availability for a conservative marathon base.",
    workoutMixSummary:
      "Easy volume, marathon-steady durability, cutbacks, taper protection, and long-run specificity.",
    keyWorkoutTypes: [
      "Recovery jogs",
      "Easy aerobic runs",
      "Marathon steady specificity",
      "Cutback long runs",
      "Long runs with steady finish",
    ],
    levelFitSummary:
      "Best for runners with long-run tolerance support evidence and 4-5 available run days.",
    avoidsSummary: "Avoids target-time specificity, two-quality weeks, and unsupported intensity.",
    metricPolicySummary:
      "Uses conservative structure and effort-first guidance unless backend metric truth supports more.",
  },
] as const satisfies readonly PlanPresetRecipeSummary[];

export function getPlanPresetRecipe(cardId: PlanPresetCardId) {
  return PLAN_PRESET_RECIPES.find((recipe) => recipe.cardId === cardId) ?? null;
}
