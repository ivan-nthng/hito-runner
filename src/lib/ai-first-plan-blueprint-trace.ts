import type { AiFirstPlanBlueprintTraceMetadata } from "@/lib/ai-first-plan-draft-authoring";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import {
  type AiFirstPlanBlueprint,
  type StructuredAuthoringInput,
} from "@/lib/ai-first-plan-blueprint-schema";
import { buildNormalizationContext } from "@/lib/ai-first-plan-blueprint-validation";
import { addDaysIso, weekdayLong } from "@/lib/training";

export function buildAiFirstPlanBlueprintTrace({
  authoringInput,
  blueprint,
  normalizedWorkouts,
  sourceStatus,
  sourceKind,
  fallbackReason,
  issues,
  repairs,
}: {
  authoringInput: StructuredAuthoringInput;
  blueprint: AiFirstPlanBlueprint | null;
  normalizedWorkouts: TrainingPlanV2["planned_workouts"] | null;
  sourceStatus: AiFirstPlanBlueprintTraceMetadata["sourceStatus"];
  sourceKind: string | null;
  fallbackReason: string | null;
  issues: Array<{ code: string; message: string; path?: string }>;
  repairs: string[];
}): AiFirstPlanBlueprintTraceMetadata {
  const context = buildNormalizationContext(authoringInput);
  const normalizedWeeks = normalizedWorkouts
    ? groupCanonicalIdentityTraceByWeek(normalizedWorkouts)
    : [];

  return {
    sourceKind,
    sourceStatus,
    fallbackReason,
    model: null,
    timeoutMs: null,
    elapsedMs: null,
    requestSummary: {
      goalFamily: context.goalFamilyPolicy.label,
      goalType: authoringInput.goal.goalType,
      goalStyle: authoringInput.goal.goalStyle ?? null,
      goalDistance: authoringInput.goal.goalType,
      targetTimePresent: Boolean(authoringInput.goal.targetTime),
      targetDate: authoringInput.schedule.targetDate ?? null,
      runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
    },
    blueprintCompleteness: blueprint ? buildBlueprintCompleteness(blueprint, context) : undefined,
    requiredCadenceSlots: [...context.requiredCadenceSlots.entries()].map(([weekNumber, slot]) => ({
      weekNumber,
      date: slot.date,
      weekday: slot.weekday,
      kind: slot.kind,
      identityOptions: slot.identityOptions.slice(0, 12),
      purpose: boundedTraceText(slot.purpose),
    })),
    authoredBlueprintWeeks: blueprint ? groupAuthoredBlueprintTraceByWeek(blueprint) : [],
    validationIssueCodes: issues.map((issue) => issue.code).slice(0, 24),
    validationIssueSummary: issues
      .map((issue) => `${issue.code}: ${issue.message}`)
      .map(boundedTraceText)
      .slice(0, 12),
    repairs: repairs.map(boundedTraceText).slice(0, 12),
    normalizedCanonicalWeeks: normalizedWeeks,
    deterministicFallbackBoundary: {
      used: sourceStatus === "deterministic_fallback",
      reason: fallbackReason,
    },
    finalReviewedPlanIdentityCounts: normalizedWorkouts
      ? countCanonicalWorkoutField(normalizedWorkouts, "workout_identity")
      : {},
    finalReviewedPlanFamilyCounts: normalizedWorkouts
      ? countCanonicalWorkoutField(normalizedWorkouts, "workout_family")
      : {},
    finalReviewedPlanIconCounts: normalizedWorkouts
      ? countCanonicalWorkoutField(normalizedWorkouts, "calendar_icon_key")
      : {},
    persistedIdentityCounts: null,
  };
}

function buildBlueprintCompleteness(
  blueprint: AiFirstPlanBlueprint,
  context: ReturnType<typeof buildNormalizationContext>,
) {
  const expectedRequiredDates = buildExpectedAuthoredWorkoutDates(context);
  const authoredDates = new Set<string>();

  for (const week of blueprint.weeks) {
    for (const workout of week.plannedWorkouts) {
      const date =
        workout.date ?? resolveWorkoutDateFromWeekday(workout.weekday, week.weekNumber, context);

      if (date) {
        authoredDates.add(date);
      }
    }
  }

  const actualWeekNumbers = new Set(blueprint.weeks.map((week) => week.weekNumber));
  const missingWeekNumbers = Array.from(
    { length: context.expectedHorizonWeeks },
    (_value, index) => index + 1,
  ).filter((weekNumber) => !actualWeekNumbers.has(weekNumber));
  const firstMissingRequiredDates = expectedRequiredDates.filter(
    (date) => !authoredDates.has(date),
  );

  return {
    expectedWeekCount: context.expectedHorizonWeeks,
    actualWeekCount: blueprint.weeks.length,
    expectedRequiredSlotCount: expectedRequiredDates.length,
    actualAuthoredWorkoutCount: blueprint.weeks.reduce(
      (count, week) => count + week.plannedWorkouts.length,
      0,
    ),
    missingWeekNumbers: missingWeekNumbers.slice(0, 24),
    firstMissingRequiredDates: firstMissingRequiredDates.slice(0, 12),
  };
}

function buildExpectedAuthoredWorkoutDates(context: ReturnType<typeof buildNormalizationContext>) {
  return Array.from({ length: context.expectedHorizonWeeks * 7 }, (_value, offset) =>
    addDaysIso(context.authoringInput.schedule.startDate, offset),
  ).filter((date) => context.runningDays.has(weekdayLong(date)));
}

function resolveWorkoutDateFromWeekday(
  weekday: string,
  weekNumber: number,
  context: ReturnType<typeof buildNormalizationContext>,
) {
  const weekStart = addDaysIso(context.authoringInput.schedule.startDate, (weekNumber - 1) * 7);

  return Array.from({ length: 7 }, (_value, offset) => addDaysIso(weekStart, offset)).find(
    (date) => weekdayLong(date) === weekday,
  );
}

function groupAuthoredBlueprintTraceByWeek(blueprint: AiFirstPlanBlueprint) {
  return blueprint.weeks.slice(0, 52).map((week) => ({
    weekNumber: week.weekNumber,
    phase: week.phase,
    theme: boundedTraceText(week.theme),
    identities: week.plannedWorkouts.map((workout) => workout.workoutIdentity).slice(0, 7),
    families: week.plannedWorkouts.map((workout) => workout.workoutFamily).slice(0, 7),
    icons: week.plannedWorkouts.map((workout) => workout.calendarIconKey).slice(0, 7),
    dates: week.plannedWorkouts
      .map((workout) => workout.date ?? workout.weekday)
      .filter(Boolean)
      .slice(0, 7),
  }));
}

function groupCanonicalIdentityTraceByWeek(workouts: TrainingPlanV2["planned_workouts"]) {
  const byWeek = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of workouts) {
    byWeek.set(workout.week_number, [...(byWeek.get(workout.week_number) ?? []), workout]);
  }

  return [...byWeek.entries()]
    .sort(([left], [right]) => left - right)
    .slice(0, 52)
    .map(([weekNumber, weekWorkouts]) => ({
      weekNumber,
      identities: weekWorkouts.map((workout) => workout.workout_identity ?? "unknown").slice(0, 7),
      families: weekWorkouts.map((workout) => workout.workout_family ?? "unknown").slice(0, 7),
      icons: weekWorkouts.map((workout) => workout.calendar_icon_key ?? "unknown").slice(0, 7),
    }));
}

function countCanonicalWorkoutField(
  workouts: TrainingPlanV2["planned_workouts"],
  field: "workout_identity" | "workout_family" | "calendar_icon_key",
) {
  return workouts.reduce<Record<string, number>>((counts, workout) => {
    const value = workout[field] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function boundedTraceText(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}
