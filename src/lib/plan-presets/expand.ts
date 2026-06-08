import {
  buildPlanPresetAlgorithmicDraft,
  validatePlanPresetAlgorithmicInput,
} from "@/lib/plan-presets/algorithmic-builder";
import { getPlanPresetRecipe } from "@/lib/plan-presets/recipes";
import {
  normalizeScenarioRunnerLevel,
  resolvePlanPresetProgram,
} from "@/lib/plan-presets/program-data";
import {
  planPresetEligibilityInputSchema,
  type PlanPresetCardId,
  type PlanPresetEligibilityInput,
  type PlanPresetReviewDraftContract,
} from "@/lib/plan-presets/schema";
import { resolvePlanPresetCards } from "@/lib/plan-presets/resolver";
import { buildStructuredFirstPlanAuthoringInput } from "@/lib/structured-first-plan-onboarding";
import { countRows, summarizeIdentities } from "@/lib/plan-presets/recipe-expanders/shared";

export function buildPlanPresetReviewDraftContract({
  cardId,
  input,
}: {
  cardId: PlanPresetCardId;
  input: unknown;
}): PlanPresetReviewDraftContract {
  const parsedInput = planPresetEligibilityInputSchema.parse(input);
  const recipe = getPlanPresetRecipe(cardId);

  if (!recipe) {
    throw new Error("Plan preset recipe is not available.");
  }

  validatePlanPresetAlgorithmicInput({ recipe, input: parsedInput });

  const eligibility = resolvePlanPresetCards(parsedInput);
  const selectedCard = eligibility.cards.find((card) => card.cardId === cardId);

  if (
    !selectedCard ||
    selectedCard.recipeId !== recipe.recipeId ||
    (selectedCard.state !== "recommended" && selectedCard.state !== "available")
  ) {
    throw new Error("Plan preset is not eligible for non-mutating draft expansion.");
  }

  const baseAuthoringInput = buildStructuredFirstPlanAuthoringInput(parsedInput);
  const runnerLevel = resolveInputRunnerLevel(parsedInput);
  const program = resolvePlanPresetProgram({
    recipe,
    startDate: baseAuthoringInput.schedule.startDate,
    runnerLevel,
    daysPerWeek: parsedInput.availability.runningDaysPerWeek,
    age: parsedInput.profile.age,
    weightKg: parsedInput.profile.weightKg,
    heightCm: parsedInput.profile.heightCm,
  });
  const { authoringInput, canonicalPlan, diagnostics } = buildPlanPresetAlgorithmicDraft({
    recipe,
    sourceInput: baseAuthoringInput,
    program,
    runnerLevel: normalizeScenarioRunnerLevel(runnerLevel),
  });
  const rowCounts = countRows(canonicalPlan);

  return {
    sourceKind: "plan_preset_v1",
    source_kind: "plan_preset_v1",
    sourceStatus: "preset_recipe_expanded",
    presetId: recipe.recipeId,
    presetVersion: recipe.presetVersion,
    persisted: false,
    authoringInput,
    canonicalPlan,
    metricTruth: eligibility.metricTruth,
    reviewShape: {
      whyThisFit: recipe.fitSummary,
      runningDaysPerWeek: parsedInput.availability.runningDaysPerWeek,
      fixedRestDays: parsedInput.availability.fixedRestDays,
      preferredLongRunDay: parsedInput.availability.preferredLongRunDay ?? null,
      horizonWeeks: selectedCard.durationWeeks,
      targetMode: "preset_no_target_date_or_time",
      metricPolicy: recipe.metricPolicySummary,
      durationWeeks: selectedCard.durationWeeks,
      startDate: authoringInput.schedule.startDate,
      estimatedEndDate: selectedCard.estimatedEndDate,
      daysPerWeek: selectedCard.daysPerWeek,
      longRunDay: authoringInput.availability.preferredLongRunDay,
      programFamily: selectedCard.programFamily,
      workoutMixSummary: selectedCard.workoutMixSummary,
      keyWorkoutTypes: selectedCard.keyWorkoutTypes,
      metricModeSummary: selectedCard.metricModeSummary,
      whyThisFits: selectedCard.whyThisFits,
      levelFitSummary: selectedCard.levelFitSummary,
      disabledReasonSummary: null,
      customReasonSummary: null,
      weeklyRhythmSummary: buildWeeklyRhythmSummary({
        daysPerWeek: selectedCard.daysPerWeek,
        restDays: parsedInput.availability.fixedRestDays,
        longRunDay: authoringInput.availability.preferredLongRunDay,
      }),
      restDays: parsedInput.availability.fixedRestDays,
      safetyAssumptions: [
        "Preset review is non-mutating until explicit confirm.",
        "Backend Plan Preset builder owns eligibility, metric policy, source-of-truth artifacts, and row expansion.",
        `${recipe.programFamily} uses deterministic phase, archetype, identity, and segment-anatomy source-of-truth tables.`,
      ],
      adaptiveProgram: {
        scenarioId: `${program.scenario.familyId}_${program.scenario.runnerLevel}_${program.scenario.daysPerWeek}d`,
        programBias: program.scenario.programBias,
        finalOutcomeRule: program.goalContract.finalOutcomeRequired,
        progressionConservatism: program.progressionConservatism,
        impactLoadAdjustment: program.impactLoadContext,
        longRunRampPolicy: program.longRunRampPolicy,
        cutbackFrequency: program.cutbackFrequency,
        moderateTouchCapPerWeek: program.moderateTouchCapPerWeek,
        delaySharpWork: program.delaySharpWork,
        loadAdjustmentSummary: `${program.loadAdjustmentSummary} Builder artifacts: ${diagnostics.sourceArtifactTables.join(", ")}. Phases: ${diagnostics.phaseNames.join(", ")}.`,
      },
      rowCounts,
      identitySummary: summarizeIdentities(canonicalPlan),
    },
    safety: {
      doesNotCallOpenAi: true,
      doesNotMutatePlan: true,
      persistsNothing: true,
      confirmPathImplemented: true,
    },
  };
}

function resolveInputRunnerLevel(input: PlanPresetEligibilityInput) {
  if ("fitnessLevel" in input.benchmark && input.benchmark.fitnessLevel) {
    return input.benchmark.fitnessLevel;
  }

  return "running_regularly";
}

function buildWeeklyRhythmSummary({
  daysPerWeek,
  restDays,
  longRunDay,
}: {
  daysPerWeek: number;
  restDays: string[];
  longRunDay: string;
}) {
  const restSummary = restDays.length > 0 ? `rest on ${restDays.join(" and ")}` : "flexible rest";

  return `${daysPerWeek} runs/week, ${restSummary}, long run on ${longRunDay}.`;
}
