import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring";
import { addDaysIso, diffDaysIso } from "@/lib/training";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";

export const AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION = "ai-authored-plan-first-v1" as const;
export const AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME =
  "hito_ai_authored_full_plan_draft" as const;

export function buildAiAuthoredPlanFirstOpenAiSchema() {
  const nullableString = {
    anyOf: [{ type: "string", minLength: 1, maxLength: 500 }, { type: "null" }],
  } as const;
  const nullableDurationSeconds = {
    type: ["integer", "null"],
    minimum: 5,
    maximum: 43_200,
  } as const;
  const nullableDistanceMeters = {
    type: ["integer", "null"],
    minimum: 10,
    maximum: 500_000,
  } as const;
  const unit = {
    type: "object",
    additionalProperties: false,
    required: ["duration_seconds", "distance_meters", "pace", "hr_zone", "effort", "notes"],
    properties: {
      duration_seconds: nullableDurationSeconds,
      distance_meters: nullableDistanceMeters,
      pace: nullableString,
      hr_zone: nullableString,
      effort: nullableString,
      notes: nullableString,
    },
  } as const;
  const repeatChild = {
    ...unit,
    required: ["role", "label", ...unit.required],
    properties: {
      role: { type: "string", enum: ["work", "recover"] },
      label: { type: "string", minLength: 1, maxLength: 80 },
      ...unit.properties,
    },
  } as const;
  const step = {
    type: "object",
    additionalProperties: false,
    required: ["phase", ...unit.required, "repeat"],
    properties: {
      phase: { type: "string", minLength: 1, maxLength: 120 },
      ...unit.properties,
      repeat: {
        anyOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["count", "children"],
            properties: {
              count: { type: "integer", minimum: 2, maximum: 100 },
              children: {
                type: "array",
                minItems: 1,
                maxItems: 2,
                items: repeatChild,
              },
            },
          },
          { type: "null" },
        ],
      },
    },
  } as const;
  const day = {
    type: "object",
    additionalProperties: false,
    required: ["date", "type", "notes", "steps"],
    properties: {
      date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      type: { type: "string", minLength: 1, maxLength: 160 },
      notes: nullableString,
      steps: { type: "array", minItems: 1, maxItems: 12, items: step },
    },
  } as const;
  const week = {
    type: "object",
    additionalProperties: false,
    required: ["week", "days"],
    properties: {
      week: { type: "integer", minimum: 1, maximum: 52 },
      days: { type: "array", maxItems: 7, items: day },
    },
  } as const;

  return {
    type: "object",
    additionalProperties: false,
    required: ["metadata", "weeks"],
    properties: {
      metadata: {
        type: "object",
        additionalProperties: false,
        required: [
          "goal",
          "target_date",
          "target_time",
          "long_run_day",
          "note",
          "warnings",
          "assumptions",
        ],
        properties: {
          goal: { type: "string", minLength: 1, maxLength: 160 },
          target_date: {
            anyOf: [{ type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, { type: "null" }],
          },
          target_time: {
            anyOf: [{ type: "string", minLength: 1, maxLength: 32 }, { type: "null" }],
          },
          long_run_day: { type: ["string", "null"], enum: [...WEEKDAY_NAMES, null] },
          note: nullableString,
          warnings: {
            type: "array",
            maxItems: 12,
            items: { type: "string", minLength: 1, maxLength: 500 },
          },
          assumptions: {
            type: "array",
            maxItems: 12,
            items: { type: "string", minLength: 1, maxLength: 500 },
          },
        },
      },
      weeks: { type: "array", minItems: 1, maxItems: 52, items: week },
    },
  } as const;
}

export function buildAiAuthoredPlanFirstPrompt({
  authoringInput,
  today,
}: {
  authoringInput: StructuredPlanAuthoringInput;
  today?: string;
}) {
  const systemPrompt = [
    "You are Hito's AI running coach authoring one complete training calendar draft.",
    `Return JSON for the ${AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME} response schema.`,
    "Return the complete coach-authored plan as compact metadata plus weeks[].days[].",
    "Each day is an authored running workout with an explicit date and displayable steps; omit rest-day rows because the backend fills empty calendar dates as rest.",
    "You own the coaching plan: workout mix, progression, long runs, repeats, paces, HR-zone labels, assumptions, and warnings.",
    "Use bounded integer duration_seconds and distance_meters values. Use null when a field does not apply; never emit tiny decimal placeholders.",
    "A Repeat is structural-only: set parent prescription and target fields to null, then put the ordered work child and optional recovery child in repeat.children. Every child needs duration_seconds or distance_meters.",
    "Use pace strings and HR-zone labels only as coach guidance. Do not invent raw BPM targets or medical claims.",
    "When calendar.horizon_weeks is supplied, return exactly that many sequential weeks. Otherwise choose and author one complete 4-52 week horizon. Use only the supplied workout weekdays, respect rest weekdays, and place an exact selected-distance endpoint on target_date when provided.",
  ].join("\n");
  const userPrompt = JSON.stringify({
    today: today ?? null,
    contractVersion: AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION,
    runnerFacts: buildAiAuthoredPlanFirstProviderContext(authoringInput),
    outputRules: {
      shape:
        "metadata plus sequential weeks[].days[] workout objects for the supplied or AI-authored horizon; omitted dates are rest",
      steps: "Use Warm Up, Work, Recovery, Strides, Cool Down, and structural repeats.",
      values: "Use integer seconds and meters, pace/HR-zone guidance strings, or null.",
    },
  });

  return {
    systemPrompt,
    userPrompt,
    responseSchema: buildAiAuthoredPlanFirstOpenAiSchema(),
  };
}

export function buildAiAuthoredPlanFirstProviderContext(
  authoringInput: StructuredPlanAuthoringInput,
) {
  const distance = authoringInput.planGoalIntent?.distance ?? null;
  const horizonWeeks = resolveAiAuthoredPlanFirstProviderHorizonWeeks(authoringInput);
  const workoutWeekdays = WEEKDAY_NAMES.filter((day) =>
    authoringInput.availability.preferredRunningDays.includes(day),
  );
  const restWeekdays = WEEKDAY_NAMES.filter((day) => !workoutWeekdays.includes(day));

  return {
    goal: {
      label: authoringInput.goal.goalLabel,
      distance_meters: distance?.distanceMeters ?? null,
      target_date: authoringInput.schedule.targetDate ?? null,
      target_finish_time:
        authoringInput.planGoalIntent?.targetFinishTime?.label ??
        authoringInput.goal.targetTime ??
        null,
    },
    calendar: {
      start_date: authoringInput.schedule.startDate,
      end_date:
        authoringInput.schedule.targetDate ??
        (horizonWeeks ? addDaysIso(authoringInput.schedule.startDate, horizonWeeks * 7 - 1) : null),
      horizon_weeks: horizonWeeks,
      week_starts_on: "Monday",
      workout_weekdays: workoutWeekdays,
      rest_weekdays: restWeekdays,
      preferred_long_run_day: authoringInput.availability.preferredLongRunDay ?? null,
    },
    runner: {
      experience: authoringInput.runnerProfile.experienceLevel,
      age: authoringInput.runnerProfile.age ?? null,
      current_sessions_per_week: authoringInput.runnerProfile.baselineSessionsPerWeek,
      baseline_long_run_km: authoringInput.runnerProfile.baselineLongRunKm ?? null,
      baseline_long_run_minutes: authoringInput.runnerProfile.baselineLongRunDurationMin ?? null,
      recent_result: authoringInput.currentLevel.recentResultSummary ?? null,
      recent_5k_pace_seconds_per_km: authoringInput.currentLevel.recent5kPaceSecondsPerKm ?? null,
      current_easy_pace_range: authoringInput.currentLevel.currentEasyPaceRange ?? null,
      effort_language: authoringInput.runnerProfile.preferredEffortLanguage ?? "rpe",
    },
    constraints: {
      injury: authoringInput.constraints.injuryConstraints,
      hard: authoringInput.constraints.hardConstraints,
    },
    preferences: {
      workout_mix: authoringInput.preferences.preferredWorkoutMix ?? "balanced",
      terrain: authoringInput.preferences.terrainFocus,
      strength_or_mobility: authoringInput.preferences.strengthOrMobilityInterest ?? "none",
      treadmill_ok: authoringInput.preferences.indoorTreadmillOk,
      watch_access: authoringInput.execution.watchAccess,
      guidance: authoringInput.execution.guidancePreference,
    },
  };
}

export function resolveAiAuthoredPlanFirstProviderHorizonWeeks(
  authoringInput: StructuredPlanAuthoringInput,
) {
  const normalizedWeeks = (
    authoringInput.schedule as StructuredPlanAuthoringInput["schedule"] & {
      horizonWeeks?: number;
    }
  ).horizonWeeks;
  if (normalizedWeeks) return normalizedWeeks;
  if (authoringInput.schedule.preparationHorizonWeeks) {
    return authoringInput.schedule.preparationHorizonWeeks;
  }
  if (authoringInput.schedule.targetDate) {
    return Math.max(
      1,
      Math.ceil(
        (diffDaysIso(authoringInput.schedule.targetDate, authoringInput.schedule.startDate) + 1) /
          7,
      ),
    );
  }
  return null;
}
