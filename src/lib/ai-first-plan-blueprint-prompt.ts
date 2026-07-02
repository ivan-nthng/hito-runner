import {
  CANONICAL_METRIC_GUIDANCE_VALUES,
  HR_TARGET_SOURCE_VALUES,
} from "@/lib/rich-workout-model";
import {
  buildPromptGoalFamilyIdentityPolicy,
  resolveAuthoringHorizonWeeks,
} from "@/lib/ai-first-plan-blueprint-policy";
import {
  buildAiFirstPlanBlueprintOpenAiSchema,
  type AiFirstPlanBlueprintPromptInput,
  type StructuredAuthoringInput,
} from "@/lib/ai-first-plan-blueprint-schema";
import {
  authoredCalendarIconKeyValues,
  authoredWorkoutFamilyValues,
  authoredWorkoutIdentityValues,
  metricIntentValues,
  segmentIntentValues,
} from "@/lib/ai-first-plan-blueprint-taxonomy";
import { addDaysIso, todayIso } from "@/lib/training";

export function buildAiFirstPlanBlueprintPrompt({
  authoringInput,
  today = todayIso(),
  referenceExample,
}: AiFirstPlanBlueprintPromptInput) {
  return {
    systemPrompt: buildAiFirstPlanBlueprintSystemPrompt(),
    userPrompt: buildAiFirstPlanBlueprintUserPrompt({
      authoringInput,
      today,
      referenceExample,
    }),
    responseSchema: buildAiFirstPlanBlueprintOpenAiSchema(
      authoringInput.availability.maxRunningDaysPerWeek,
    ),
  };
}

function buildAiFirstPlanBlueprintSystemPrompt() {
  const shared = [
    "You author a compact Hito Running first-plan coaching blueprint from validated structured setup truth.",
    "Return only the ai-first-plan-blueprint-v1 JSON object requested by the schema.",
    "Your blueprint is not persisted directly; the backend expands it into canonical training-plan-v2 workouts and segments after validation.",
    "Use Hito workout taxonomy only: workoutFamily, workoutIdentity, and calendarIconKey must be valid schema values.",
    "Return only authored running workouts in each week. The backend fills rest rows for non-authored calendar days after validation.",
    "Never include rest/rest_and_recovery in plannedWorkouts. Rest days are not authored workouts.",
    "Respect fixed rest days as hard constraints and use the requested running days/week count.",
    "Taper and final weeks still need a reduced long-run intent, usually taper_long_run, cutback_long_run, long_aerobic_run, hike_run_endurance, mountain_long_run_time_on_feet, or ultra_time_on_feet_durability depending on the goal.",
    "Follow the backend goal-family identity policy. Beginner/low-support plans stay mostly easy, recovery, steady, and long; supported performance, marathon, ultra, and mountain/trail plans need week-aware specificity without unsafe density.",
    "Keep segmentIntent compact: describe the session shape, not a full segment tree.",
    "Keep metricIntent compact. Do not output numeric HR, pace ranges, personalized zones, or metric targets.",
    "Do not output user ids, plan ids, logs, completion state, provider sync placeholders, AI verdicts, or feedback placeholders.",
    "Do not invent medical, rehab, threshold-HR, lab-tested, exact elevation, or route-matching claims.",
    "Keep review assumptions concise and honest about weak support, target-time uncertainty, conservative load, and default HR guidance.",
  ];

  return [
    ...shared,
    "You are the source of the dated training plan draft: choose the workout dates, weekly rhythm, progression, cutbacks, taper, and endpoint placement inside the provided constraints.",
    "Every plannedWorkout.date must be an explicit ISO date. Do not return null dates, weekday-only slots, or an abstract weekly template.",
    "If preferredLongRunDay is null, choose a sane long-run day and keep it consistent enough for the runner; if it is present, treat it as a hard preference.",
    "Do not wait for the backend to schedule workouts for you. Backend may validate, canonicalize harmless labels, fill rest rows, or reject unsafe plans, but it must not silently replace your dated calendar.",
  ].join("\n");
}

function buildAiFirstPlanBlueprintUserPrompt({
  authoringInput,
  today,
  referenceExample,
}: {
  authoringInput: StructuredAuthoringInput;
  today: string;
  referenceExample: unknown;
}) {
  const promptParts = [
    `Today is ${today}.`,
    "Validated structured setup truth:",
    JSON.stringify(buildPromptAuthoringSummary(authoringInput)),
    "",
    "Allowed compact blueprint taxonomy:",
    JSON.stringify({
      authoredWorkoutFamilies: authoredWorkoutFamilyValues,
      authoredWorkoutIdentities: authoredWorkoutIdentityValues,
      authoredCalendarIconKeys: authoredCalendarIconKeyValues,
      segmentIntents: segmentIntentValues,
      metricIntents: metricIntentValues,
      metricGuidance: CANONICAL_METRIC_GUIDANCE_VALUES,
      hrTargetSources: HR_TARGET_SOURCE_VALUES,
    }),
    "",
    "Metric policy:",
    JSON.stringify(buildPromptMetricPolicy(authoringInput)),
    "",
    "Goal-family identity policy:",
    JSON.stringify(buildPromptGoalFamilyIdentityPolicy(authoringInput)),
    "",
  ];

  promptParts.push(
    "OpenAI-authored dated plan constraints:",
    JSON.stringify(buildPromptDatedPlanConstraints(authoringInput)),
    "Author exactly maxRunningDaysPerWeek workouts per week, each with an explicit date.",
    "Choose dates from allowedWorkoutWeekdays only. Never author workouts on fixedRestDays.",
    "If preferredLongRunDay is null, choose the long-run day yourself and keep the recovery rhythm safe.",
    "Use the goal-family identity policy as coaching guidance, but do not rely on backend-provided exact cadence slots.",
    "The final relevant workout must align with the goal distance and target/race date when targetDate is supplied.",
  );

  promptParts.push(
    "",
    "Reference-style example guidance:",
    JSON.stringify(buildReferenceStyleSummary(referenceExample)),
  );

  return promptParts.join("\n");
}

function buildPromptDatedPlanConstraints(authoringInput: StructuredAuthoringInput) {
  const horizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const startDate = authoringInput.schedule.startDate;
  const endDate = addDaysIso(startDate, horizonWeeks * 7 - 1);
  const fixedRestDays: Set<string> = new Set(authoringInput.availability.unavailableDays);
  const allowedWorkoutWeekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].filter((weekday) => !fixedRestDays.has(weekday));

  return {
    startDate,
    endDate,
    targetDate: authoringInput.schedule.targetDate ?? null,
    preparationHorizonWeeks: horizonWeeks,
    maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    fixedRestDays: [...authoringInput.availability.unavailableDays],
    allowedWorkoutWeekdays,
    preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
    planGoalIntent: authoringInput.planGoalIntent ?? null,
  };
}

function buildPromptAuthoringSummary(authoringInput: StructuredAuthoringInput) {
  return {
    goal: authoringInput.goal,
    schedule: authoringInput.schedule,
    runnerProfile: authoringInput.runnerProfile,
    currentLevel: authoringInput.currentLevel,
    availability: authoringInput.availability,
    preferences: authoringInput.preferences,
    execution: authoringInput.execution,
    planGoalIntent: authoringInput.planGoalIntent ?? null,
  };
}

function buildPromptMetricPolicy(authoringInput: StructuredAuthoringInput) {
  return {
    pace:
      authoringInput.execution.watchAccess === "watch_or_app" &&
      (authoringInput.execution.guidancePreference === "pace" ||
        authoringInput.execution.guidancePreference === "mixed") &&
      authoringInput.currentLevel.recent5kPaceSecondsPerKm
        ? "AI may mark metricIntent as pace_if_allowed or mixed_if_allowed. Backend will decide final pace targets."
        : "Use effort_only metricIntent; backend will not include numeric pace targets.",
    heartRate:
      typeof authoringInput.runnerProfile.age === "number"
        ? "AI must not include numeric HR. Backend may add labelled Default HR guidance from age after validation."
        : "AI must not include numeric HR; age and personal HR zones are absent.",
  };
}

function buildReferenceStyleSummary(referenceExample: unknown) {
  if (!referenceExample || typeof referenceExample !== "object") {
    return {
      note: "Use varied week-by-week workout identities and clear coaching intent. Do not author full segments; backend expands them.",
    };
  }

  const record = referenceExample as Record<string, unknown>;
  const workouts = Array.isArray(record.planned_workouts) ? record.planned_workouts : [];

  return {
    note: "Reference is for richness and weekly rhythm only; do not copy runtime placeholders, completion state, provider sync, feedback, or unsupported metrics.",
    sampleWorkouts: workouts.slice(0, 3).map((workout) => {
      const workoutRecord = workout as Record<string, unknown>;

      return {
        title: workoutRecord.title,
        summary: workoutRecord.summary,
        workoutType: workoutRecord.workout_type,
        phase: workoutRecord.phase,
      };
    }),
  };
}
