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
  type AiFirstPlanBlueprintNormalizationOptions,
  validateBlueprintShell,
  validateNormalizedPlanDoctrine,
} from "@/lib/ai-first-plan-blueprint-validation";
import {
  repairBeginnerRunWalkBlueprintAdaptation,
  repairRecoveryFirstBlueprintSequencing,
  repairSupportedIntensityBlueprintCadence,
} from "@/lib/ai-first-plan-blueprint-repair";
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
  deterministicSupportAuthoringInput,
  normalizationOptions = {},
  useDeterministicSupport = false,
}: {
  blueprint: unknown;
  authoringInput: StructuredAuthoringInput;
  deterministicSupportAuthoringInput?: StructuredAuthoringInput;
  normalizationOptions?: AiFirstPlanBlueprintNormalizationOptions;
  useDeterministicSupport?: boolean;
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
        normalizationOptions,
      }),
    );
  }

  const context = buildNormalizationContext(authoringInput, normalizationOptions);
  const issues: NormalizationIssue[] = [];
  const repairs: string[] = [];

  validateBlueprintShell(parsedBlueprint.data, context, issues);

  if (issues.length > 0) {
    const reason = blueprintShellValidationFailureReason(issues);

    return failedAiBlueprintNormalization(
      reason,
      issues,
      buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: parsedBlueprint.data,
        normalizedWorkouts: null,
        sourceStatus: "blueprint_unavailable",
        sourceKind: "ai_first_plan_blueprint_v1",
        fallbackReason: reason,
        issues,
        repairs,
        normalizationOptions,
      }),
    );
  }

  const deterministicPlan = useDeterministicSupport
    ? buildStructuredAuthoringPlan(deterministicSupportAuthoringInput ?? authoringInput)
    : null;
  const deterministicByDate = new Map(
    deterministicPlan?.planned_workouts.map((workout) => [workout.date, workout]) ?? [],
  );
  const adaptationHorizonWeeks =
    deterministicPlan?.preparation_horizon_weeks ?? context.expectedHorizonWeeks;
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

  repairRecoveryFirstBlueprintSequencing({
    blueprintWorkouts,
    context,
    repairs,
  });
  repairBeginnerRunWalkBlueprintAdaptation({
    blueprintWorkouts,
    context,
    adaptationHorizonWeeks,
    repairs,
  });
  repairSupportedIntensityBlueprintCadence({
    blueprintWorkouts,
    context,
    repairs,
  });
  repairRecoveryFirstBlueprintSequencing({
    blueprintWorkouts,
    context,
    repairs,
  });

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
            adaptationHorizonWeeks,
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
        normalizationOptions,
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
        normalizationOptions,
      }),
    );
  }

  const blueprintTrace = buildAiFirstPlanBlueprintTrace({
    authoringInput,
    blueprint: parsedBlueprint.data,
    normalizedWorkouts: parsedPlan.data.planned_workouts,
    sourceStatus: repairs.length > 0 ? "repaired_ai_draft" : "ai_authored",
    sourceKind: parsedPlan.data.source_kind ?? "ai_first_plan_blueprint_v1",
    fallbackReason: null,
    issues: [],
    repairs,
    normalizationOptions,
  });

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
      blueprintTrace,
      datePlacement: blueprintTrace.datePlacement,
    },
  };
}

function blueprintShellValidationFailureReason(issues: NormalizationIssue[]) {
  return issues.some((issue) => issue.code.startsWith("incomplete_blueprint"))
    ? "ai_first_plan_blueprint_incomplete"
    : "ai_first_plan_blueprint_validation_failed";
}
