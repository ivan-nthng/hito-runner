import { type AiFirstPlanBlueprintTraceMetadata } from "@/lib/ai-first-plan-draft-metadata";
import { buildAiFirstPlanBlueprintPrompt } from "@/lib/ai-first-plan-blueprint-prompt";
import type {
  CanonicalWorkout,
  NormalizationIssue,
  StructuredAuthoringInput,
} from "@/lib/ai-first-plan-blueprint-schema";
import { resolveAuthoringHorizonWeeks } from "@/lib/ai-first-plan-blueprint-policy";
import {
  buildNormalizationContext,
  validateNormalizedPlanDoctrine,
} from "@/lib/ai-first-plan-blueprint-validation";
import { trainingPlanV2Schema, type TrainingPlanV2 } from "@/lib/imported-plan";
import { buildStructuredAuthoringPlan } from "@/lib/structured-plan-authoring";
import { addDaysIso, weekdayLong } from "@/lib/training";

export const AI_FIRST_PLAN_BLUEPRINT_MAX_AUTHORED_HORIZON_WEEKS = 16;

export type AiFirstPlanBlueprintHorizonTraceMetadata = {
  requestedHorizonWeeks: number;
  aiAuthoredHorizonWeeks: number;
  backendExtendedWeeks: number;
  promptRequiredSlotCount: number;
  finalRequiredSlotCount: number;
  promptCharEstimateBefore: number | null;
  promptCharEstimateAfter: number | null;
  finalWorkoutCount: number | null;
};

export type AiFirstPlanBlueprintHorizonStrategy = AiFirstPlanBlueprintHorizonTraceMetadata & {
  openAiAuthoringInput: StructuredAuthoringInput;
};

export function resolveAiFirstPlanBlueprintHorizonStrategy({
  authoringInput,
  today,
  referenceExample,
  maxAuthoredWeeks = AI_FIRST_PLAN_BLUEPRINT_MAX_AUTHORED_HORIZON_WEEKS,
}: {
  authoringInput: StructuredAuthoringInput;
  today?: string;
  referenceExample?: unknown;
  maxAuthoredWeeks?: number;
}): AiFirstPlanBlueprintHorizonStrategy {
  const requestedHorizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const boundedAuthoredWeeks = Math.max(1, Math.min(maxAuthoredWeeks, requestedHorizonWeeks));
  const fullTargetDate = authoringInput.schedule.targetDate ?? null;
  const openAiAuthoringInput =
    boundedAuthoredWeeks === requestedHorizonWeeks
      ? authoringInput
      : {
          ...authoringInput,
          schedule: {
            ...authoringInput.schedule,
            targetDate: null,
            preparationHorizonWeeks: boundedAuthoredWeeks,
          },
          preferences: {
            ...authoringInput.preferences,
            notes: appendBoundedNote(
              authoringInput.preferences.notes,
              fullTargetDate
                ? `Full requested target-date horizon is ${fullTargetDate}; author only the opening ${boundedAuthoredWeeks}-week blueprint window and let backend extend the remaining weeks.`
                : `Author only the opening ${boundedAuthoredWeeks}-week blueprint window and let backend extend the remaining weeks.`,
            ),
          },
        };

  return {
    openAiAuthoringInput,
    requestedHorizonWeeks,
    aiAuthoredHorizonWeeks: boundedAuthoredWeeks,
    backendExtendedWeeks: Math.max(0, requestedHorizonWeeks - boundedAuthoredWeeks),
    promptRequiredSlotCount: countRequiredRunningSlots(openAiAuthoringInput),
    finalRequiredSlotCount: countRequiredRunningSlots(authoringInput),
    promptCharEstimateBefore: estimateBlueprintPromptChars({
      authoringInput,
      today,
      referenceExample,
    }),
    promptCharEstimateAfter: estimateBlueprintPromptChars({
      authoringInput: openAiAuthoringInput,
      today,
      referenceExample,
    }),
    finalWorkoutCount: null,
  };
}

export function buildAiFirstPlanBlueprintHorizonTrace({
  strategy,
  promptCharEstimateAfter,
  finalWorkoutCount,
}: {
  strategy: AiFirstPlanBlueprintHorizonStrategy | null;
  promptCharEstimateAfter?: number | null;
  finalWorkoutCount?: number | null;
}): AiFirstPlanBlueprintHorizonTraceMetadata | undefined {
  if (!strategy) {
    return undefined;
  }

  return {
    requestedHorizonWeeks: strategy.requestedHorizonWeeks,
    aiAuthoredHorizonWeeks: strategy.aiAuthoredHorizonWeeks,
    backendExtendedWeeks: strategy.backendExtendedWeeks,
    promptRequiredSlotCount: strategy.promptRequiredSlotCount,
    finalRequiredSlotCount: strategy.finalRequiredSlotCount,
    promptCharEstimateBefore: strategy.promptCharEstimateBefore,
    promptCharEstimateAfter: promptCharEstimateAfter ?? strategy.promptCharEstimateAfter,
    finalWorkoutCount: finalWorkoutCount ?? strategy.finalWorkoutCount,
  };
}

export function attachBlueprintHorizonTrace({
  trace,
  strategy,
  promptCharEstimateAfter,
  finalWorkoutCount,
}: {
  trace: AiFirstPlanBlueprintTraceMetadata | null | undefined;
  strategy: AiFirstPlanBlueprintHorizonStrategy | null;
  promptCharEstimateAfter?: number | null;
  finalWorkoutCount?: number | null;
}) {
  if (!trace || !strategy) {
    return trace ?? null;
  }

  return {
    ...trace,
    blueprintHorizonStrategy: buildAiFirstPlanBlueprintHorizonTrace({
      strategy,
      promptCharEstimateAfter,
      finalWorkoutCount,
    }),
  };
}

export function extendAiFirstPlanBlueprintPlanToRequestedHorizon({
  canonicalPlan,
  fullAuthoringInput,
  strategy,
}: {
  canonicalPlan: TrainingPlanV2;
  fullAuthoringInput: StructuredAuthoringInput;
  strategy: AiFirstPlanBlueprintHorizonStrategy;
}):
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      repairs: string[];
    }
  | {
      ok: false;
      reason: string;
      issues: NormalizationIssue[];
    } {
  if (strategy.backendExtendedWeeks <= 0) {
    return {
      ok: true,
      canonicalPlan,
      repairs: [],
    };
  }

  const fullContext = buildNormalizationContext(fullAuthoringInput);
  const scaffoldPlan = buildStructuredAuthoringPlan(fullAuthoringInput);
  const scaffoldWorkouts = ensureFullHorizonScaffoldWorkouts({
    scaffoldWorkouts: scaffoldPlan.planned_workouts,
    context: fullContext,
  });
  const scaffoldByDate = new Map(scaffoldWorkouts.map((workout) => [workout.date, workout]));
  const alignmentRepairs: string[] = [];
  const aiAuthoredWorkouts = canonicalPlan.planned_workouts
    .filter((workout) => workout.week_number <= strategy.aiAuthoredHorizonWeeks)
    .map((workout) =>
      alignAiAuthoredWorkoutToFullHorizonScaffold(workout, scaffoldByDate, alignmentRepairs),
    );
  const extendedWorkouts = scaffoldWorkouts
    .filter((workout) => workout.week_number > strategy.aiAuthoredHorizonWeeks)
    .map(toBackendExtendedBlueprintWorkout);
  const plannedWorkouts = [...aiAuthoredWorkouts, ...extendedWorkouts].sort((left, right) =>
    left.date === right.date
      ? left.workout_id.localeCompare(right.workout_id)
      : left.date.localeCompare(right.date),
  );
  const candidatePlan = {
    ...scaffoldPlan,
    plan_id: canonicalPlan.plan_id ?? scaffoldPlan.plan_id,
    plan_name: canonicalPlan.plan_name,
    source_kind: "ai_first_plan_blueprint_v1",
    created_at: canonicalPlan.created_at ?? scaffoldPlan.created_at,
    generated_for: canonicalPlan.generated_for,
    start_date: fullAuthoringInput.schedule.startDate,
    preparation_horizon_weeks: strategy.requestedHorizonWeeks,
    target_date: fullAuthoringInput.schedule.targetDate ?? canonicalPlan.target_date,
    planned_workouts: plannedWorkouts,
  };
  const issues: NormalizationIssue[] = [];

  validateFullHorizonWorkoutCoverage(plannedWorkouts, fullContext, issues);
  validateNormalizedPlanDoctrine(plannedWorkouts, fullContext, issues);

  const parsedPlan = trainingPlanV2Schema.safeParse(candidatePlan);

  if (!parsedPlan.success) {
    issues.push(
      ...parsedPlan.error.issues.slice(0, 12).map((issue) => ({
        code: "training_plan_v2_invalid",
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    );
  }

  if (issues.length > 0 || !parsedPlan.success) {
    return {
      ok: false,
      reason: "ai_first_plan_blueprint_extension_failed",
      issues: issues.slice(0, 24),
    };
  }

  return {
    ok: true,
    canonicalPlan: parsedPlan.data,
    repairs: [
      ...alignmentRepairs,
      `Backend extended weeks ${strategy.aiAuthoredHorizonWeeks + 1}-${strategy.requestedHorizonWeeks} from the validated AI-authored opening horizon using Hito-safe progression rules.`,
    ],
  };
}

function estimateBlueprintPromptChars({
  authoringInput,
  today,
  referenceExample,
}: {
  authoringInput: StructuredAuthoringInput;
  today?: string;
  referenceExample?: unknown;
}) {
  const prompt = buildAiFirstPlanBlueprintPrompt({
    authoringInput,
    today,
    referenceExample,
  });

  return (
    prompt.systemPrompt.length +
    prompt.userPrompt.length +
    JSON.stringify(prompt.responseSchema).length
  );
}

function countRequiredRunningSlots(authoringInput: StructuredAuthoringInput) {
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const runningDayCount = authoringInput.availability.preferredRunningDays.filter(
    (weekday) => !fixedRestDays.has(weekday),
  ).length;

  return runningDayCount * resolveAuthoringHorizonWeeks(authoringInput);
}

function appendBoundedNote(existingNote: string | null | undefined, addition: string) {
  const combined = [existingNote?.trim(), addition].filter(Boolean).join(" ");

  return combined.length > 600 ? `${combined.slice(0, 597)}...` : combined;
}

function validateFullHorizonWorkoutCoverage(
  workouts: CanonicalWorkout[],
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  const workoutsByDate = new Map<string, CanonicalWorkout[]>();

  for (const workout of workouts) {
    workoutsByDate.set(workout.date, [...(workoutsByDate.get(workout.date) ?? []), workout]);
  }

  let nonRestRunningSlotCount = 0;

  for (let offset = 0; offset < context.expectedHorizonWeeks * 7; offset += 1) {
    const date = addDaysIso(context.authoringInput.schedule.startDate, offset);
    const weekNumber = Math.floor(offset / 7) + 1;
    const weekday = weekdayLong(date);
    const dateWorkouts = workoutsByDate.get(date) ?? [];

    if (dateWorkouts.length !== 1) {
      issues.push({
        code: dateWorkouts.length === 0 ? "missing_calendar_date" : "duplicate_calendar_date",
        path: `${date}.planned_workouts`,
        message: `${date} must have exactly one reviewed calendar row before first-plan review.`,
      });
      continue;
    }

    const workout = dateWorkouts[0]!;
    const rest = isRestWorkout(workout);

    if (workout.week_number !== weekNumber) {
      issues.push({
        code: "week_number_mismatch",
        path: `${date}.week_number`,
        message: `${date} must remain in week ${weekNumber}.`,
      });
    }

    if (workout.weekday !== weekday) {
      issues.push({
        code: "weekday_mismatch",
        path: `${date}.weekday`,
        message: `${date} must keep weekday ${weekday}.`,
      });
    }

    if (context.fixedRestDays.has(weekday) && !rest) {
      issues.push({
        code: "fixed_rest_day_violation",
        path: `${date}.workout_family`,
        message: `${date} is a fixed rest day and cannot contain a non-rest workout.`,
      });
    }

    if (context.runningDays.has(weekday)) {
      if (rest) {
        issues.push({
          code: "missing_required_running_slot",
          path: `${date}.workout_family`,
          message: `${date} is a required running slot and must have a reviewed workout.`,
        });
      } else {
        nonRestRunningSlotCount += 1;
      }
    }
  }

  if (nonRestRunningSlotCount !== countRequiredRunningSlots(context.authoringInput)) {
    issues.push({
      code: "required_running_slot_count_mismatch",
      path: "planned_workouts",
      message: `Reviewed plan has ${nonRestRunningSlotCount} required running workouts; expected ${countRequiredRunningSlots(
        context.authoringInput,
      )}.`,
    });
  }

  validatePreferredLongRunCoverage(workouts, context, issues);
}

function ensureFullHorizonScaffoldWorkouts({
  scaffoldWorkouts,
  context,
}: {
  scaffoldWorkouts: CanonicalWorkout[];
  context: ReturnType<typeof buildNormalizationContext>;
}) {
  const scaffoldByDate = new Map(scaffoldWorkouts.map((workout) => [workout.date, workout]));

  return Array.from({ length: context.expectedHorizonWeeks * 7 }, (_value, offset) => {
    const date = addDaysIso(context.authoringInput.schedule.startDate, offset);
    const existingWorkout = scaffoldByDate.get(date);

    if (existingWorkout) {
      return existingWorkout;
    }

    return buildTailScaffoldWorkout({
      date,
      weekNumber: Math.floor(offset / 7) + 1,
      weekday: weekdayLong(date),
      scaffoldWorkouts,
    });
  });
}

function buildTailScaffoldWorkout({
  date,
  weekNumber,
  weekday,
  scaffoldWorkouts,
}: {
  date: string;
  weekNumber: number;
  weekday: string;
  scaffoldWorkouts: CanonicalWorkout[];
}): CanonicalWorkout {
  const template =
    [...scaffoldWorkouts]
      .reverse()
      .find((workout) => workout.weekday === weekday && !isRestWorkout(workout)) ??
    [...scaffoldWorkouts].reverse().find((workout) => workout.weekday === weekday) ??
    scaffoldWorkouts.at(-1);

  if (!template) {
    throw new Error("Cannot extend AI first-plan blueprint without a scaffold workout template.");
  }

  const identity =
    template.workout_identity ?? template.source_workout_type ?? template.workout_type;

  return {
    ...template,
    workout_id: `ai-blueprint-scaffold-tail-${slugify(identity)}-${date}`,
    date,
    weekday,
    week_number: weekNumber,
    segments: template.segments.map((segment, index) => ({
      ...segment,
      segment_id: segment.segment_id
        ? `${segment.segment_id}-${date}`
        : `ai-blueprint-scaffold-tail-${date}-${index + 1}`,
    })),
  };
}

function alignAiAuthoredWorkoutToFullHorizonScaffold(
  workout: CanonicalWorkout,
  scaffoldByDate: Map<string, CanonicalWorkout>,
  repairs: string[],
): CanonicalWorkout {
  const scaffoldWorkout = scaffoldByDate.get(workout.date);

  if (!scaffoldWorkout) {
    return workout;
  }

  if (isPrematureBoundedWindowTaper(workout, scaffoldWorkout)) {
    repairs.push(
      `${workout.date}: aligned capped-window taper long run to full-horizon ${scaffoldWorkout.workout_identity ?? scaffoldWorkout.source_workout_type ?? scaffoldWorkout.workout_type}.`,
    );

    return {
      ...scaffoldWorkout,
      workout_id: workout.workout_id,
    };
  }

  return {
    ...workout,
    week_number: scaffoldWorkout.week_number,
    weekday: scaffoldWorkout.weekday,
    phase: scaffoldWorkout.phase,
  };
}

function isPrematureBoundedWindowTaper(
  workout: CanonicalWorkout,
  scaffoldWorkout: CanonicalWorkout,
) {
  if (/taper/i.test(scaffoldWorkout.phase)) {
    return false;
  }

  return (
    (/taper/i.test(workout.phase) && workout.workout_family === "long") ||
    workout.workout_identity === "taper_long_run" ||
    workout.source_workout_type === "taper_long_run"
  );
}

function validatePreferredLongRunCoverage(
  workouts: CanonicalWorkout[],
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  const preferredLongRunDay = context.authoringInput.availability.preferredLongRunDay;

  if (!preferredLongRunDay) {
    return;
  }

  for (let weekNumber = 1; weekNumber <= context.expectedHorizonWeeks; weekNumber += 1) {
    const weekWorkouts = workouts.filter((workout) => workout.week_number === weekNumber);
    const longRun = weekWorkouts.find((workout) => isLongRunWorkout(workout));

    if (!longRun) {
      issues.push({
        code: "missing_weekly_long_run",
        path: `weeks.${weekNumber}.planned_workouts`,
        message: `Week ${weekNumber} must preserve one long-run workout.`,
      });
      continue;
    }

    if (longRun.weekday !== preferredLongRunDay) {
      issues.push({
        code: "preferred_long_run_day_violation",
        path: `${longRun.date}.weekday`,
        message: `Week ${weekNumber} long run should land on ${preferredLongRunDay}.`,
      });
    }
  }
}

function toBackendExtendedBlueprintWorkout(workout: CanonicalWorkout): CanonicalWorkout {
  const identity = workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type;

  return {
    ...workout,
    workout_id: `ai-blueprint-extended-${slugify(identity)}-${workout.date}`,
  };
}

function isRestWorkout(workout: CanonicalWorkout) {
  return workout.workout_family === "rest" || workout.workout_type === "rest";
}

function isLongRunWorkout(workout: CanonicalWorkout) {
  return workout.workout_family === "long" || workout.workout_type === "long_run";
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "workout";
}
