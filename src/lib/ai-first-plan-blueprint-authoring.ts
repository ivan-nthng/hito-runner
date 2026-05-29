import { trainingPlanV2Schema } from "@/lib/imported-plan";
import {
  aiFirstPlanBlueprintSchema,
  type AiBlueprintWeek,
  type AiBlueprintWorkout,
  type AiFirstPlanBlueprint,
  type AiFirstPlanBlueprintNormalizationResult,
  type CanonicalWorkout,
  type NormalizationIssue,
  type StructuredAuthoringInput,
} from "@/lib/ai-first-plan-blueprint-schema";
import { buildWorkoutSegments } from "@/lib/ai-first-plan-blueprint-expansion";
import {
  buildAiFirstPlanBlueprintCandidatePlan,
  buildRestWorkout,
  normalizeBlueprintWorkout,
  phaseForWeek,
} from "@/lib/ai-first-plan-blueprint-normalize";
import { buildAiFirstPlanBlueprintTrace } from "@/lib/ai-first-plan-blueprint-trace";
import {
  buildNormalizationContext,
  failedAiBlueprintNormalization,
  resolveBlueprintWorkoutDate,
  validateBlueprintShell,
  validateNormalizedPlanDoctrine,
} from "@/lib/ai-first-plan-blueprint-validation";
import { buildStructuredAuthoringPlan } from "@/lib/structured-plan-authoring";
import { addDaysIso, weekdayLong } from "@/lib/training";

export {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  aiFirstPlanBlueprintOpenAiSchema,
  aiFirstPlanBlueprintSchema,
  buildAiFirstPlanBlueprintOpenAiSchema,
  type AiFirstPlanBlueprint,
  type AiFirstPlanBlueprintNormalizationResult,
  type AiFirstPlanBlueprintPromptInput,
} from "@/lib/ai-first-plan-blueprint-schema";
export { buildAiFirstPlanBlueprintPrompt } from "@/lib/ai-first-plan-blueprint-prompt";
export { buildAiFirstPlanBlueprintTrace } from "@/lib/ai-first-plan-blueprint-trace";

export function normalizeAiFirstPlanBlueprintToTrainingPlan({
  blueprint,
  authoringInput,
}: {
  blueprint: unknown;
  authoringInput: StructuredAuthoringInput;
}): AiFirstPlanBlueprintNormalizationResult {
  const parsedBlueprint = aiFirstPlanBlueprintSchema.safeParse(blueprint);

  if (!parsedBlueprint.success) {
    const issues = parsedBlueprint.error.issues.slice(0, 12).map((issue) => ({
      code: "schema_invalid",
      path: issue.path.join(".") || "root",
      message: issue.message,
    }));

    return failedAiBlueprintNormalization(
      "ai_first_plan_blueprint_schema_invalid",
      issues,
      buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: null,
        normalizedWorkouts: null,
        sourceStatus: "blueprint_unavailable",
        sourceKind: "ai_first_plan_blueprint_v1",
        fallbackReason: "ai_first_plan_blueprint_schema_invalid",
        issues,
        repairs: [],
      }),
    );
  }

  const context = buildNormalizationContext(authoringInput);
  const issues: NormalizationIssue[] = [];
  const repairs: string[] = [];

  validateBlueprintShell(parsedBlueprint.data, context, issues);

  if (issues.length > 0) {
    return failedAiBlueprintNormalization(
      "ai_first_plan_blueprint_validation_failed",
      issues,
      buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: parsedBlueprint.data,
        normalizedWorkouts: null,
        sourceStatus: "blueprint_unavailable",
        sourceKind: "ai_first_plan_blueprint_v1",
        fallbackReason: "ai_first_plan_blueprint_validation_failed",
        issues,
        repairs,
      }),
    );
  }

  const deterministicPlan = buildStructuredAuthoringPlan(authoringInput);
  const deterministicByDate = new Map(
    deterministicPlan.planned_workouts.map((workout) => [workout.date, workout]),
  );
  const blueprintWorkouts = new Map<
    string,
    { week: AiBlueprintWeek; workout: AiBlueprintWorkout }
  >();

  for (const week of parsedBlueprint.data.weeks) {
    for (const workout of week.plannedWorkouts) {
      const date = resolveBlueprintWorkoutDate(workout, week, context);

      if (date) {
        blueprintWorkouts.set(date, { week, workout });
      }
    }
  }

  const normalizedWorkouts: CanonicalWorkout[] = [];
  const totalDays = context.expectedHorizonWeeks * 7;

  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = addDaysIso(context.authoringInput.schedule.startDate, offset);
    const weekNumber = Math.floor(offset / 7) + 1;
    const weekday = weekdayLong(date);
    const blueprintWorkout = blueprintWorkouts.get(date);
    const deterministicWorkout = deterministicByDate.get(date) ?? null;

    normalizedWorkouts.push(
      blueprintWorkout
        ? normalizeBlueprintWorkout({
            blueprint: parsedBlueprint.data,
            week: blueprintWorkout.week,
            workout: blueprintWorkout.workout,
            date,
            context,
            deterministicWorkout,
            repairs,
            issues,
            buildWorkoutSegments,
          })
        : buildRestWorkout({
            date,
            weekday,
            weekNumber,
            phase: phaseForWeek(parsedBlueprint.data, weekNumber),
            context,
          }),
    );
  }

  validateNormalizedPlanDoctrine(normalizedWorkouts, context, issues);

  if (issues.length > 0) {
    return failedAiBlueprintNormalization(
      "ai_first_plan_blueprint_validation_failed",
      issues,
      buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: parsedBlueprint.data,
        normalizedWorkouts,
        sourceStatus: "blueprint_unavailable",
        sourceKind: "ai_first_plan_blueprint_v1",
        fallbackReason: "ai_first_plan_blueprint_validation_failed",
        issues,
        repairs,
      }),
    );
  }

  const candidatePlan = buildAiFirstPlanBlueprintCandidatePlan({
    blueprint: parsedBlueprint.data,
    authoringInput,
    normalizedWorkouts,
  });

  const parsedPlan = trainingPlanV2Schema.safeParse(candidatePlan);

  if (!parsedPlan.success) {
    const issues = parsedPlan.error.issues.slice(0, 12).map((issue) => ({
      code: "training_plan_v2_invalid",
      path: issue.path.join(".") || "root",
      message: issue.message,
    }));

    return failedAiBlueprintNormalization(
      "ai_first_plan_blueprint_training_plan_v2_invalid",
      issues,
      buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: parsedBlueprint.data,
        normalizedWorkouts,
        sourceStatus: "blueprint_unavailable",
        sourceKind: "ai_first_plan_blueprint_v1",
        fallbackReason: "ai_first_plan_blueprint_training_plan_v2_invalid",
        issues,
        repairs,
      }),
    );
  }

  return {
    ok: true,
    canonicalPlan: parsedPlan.data,
    metadata: {
      status: repairs.length > 0 ? "repaired_ai_draft" : "ai_authored",
      source: "openai_ai_first_plan_blueprint",
      validationIssues: [],
      repairs,
      reviewAssumptions: parsedBlueprint.data.reviewAssumptions,
      metricPolicySummary: parsedBlueprint.data.metricPolicySummary,
      blueprintTrace: buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: parsedBlueprint.data,
        normalizedWorkouts: parsedPlan.data.planned_workouts,
        sourceStatus: repairs.length > 0 ? "repaired_ai_draft" : "ai_authored",
        sourceKind: parsedPlan.data.source_kind ?? "ai_first_plan_blueprint_v1",
        fallbackReason: null,
        issues: [],
        repairs,
      }),
    },
  };
}
