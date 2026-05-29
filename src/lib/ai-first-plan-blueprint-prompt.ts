import {
  CANONICAL_METRIC_GUIDANCE_VALUES,
  HR_TARGET_SOURCE_VALUES,
} from "@/lib/rich-workout-model";
import {
  buildPromptGoalFamilyIdentityPolicy,
  buildRequiredCadenceSlots,
  resolveAuthoringHorizonWeeks,
  resolveGoalFamilyIdentityPolicy,
  type GoalFamilyCadenceKind,
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
  type AuthoredWorkoutIdentity,
} from "@/lib/ai-first-plan-blueprint-taxonomy";
import { addDaysIso, todayIso, weekdayLong } from "@/lib/training";

export function buildAiFirstPlanBlueprintPrompt({
  authoringInput,
  today = todayIso(),
  referenceExample,
}: AiFirstPlanBlueprintPromptInput) {
  return {
    systemPrompt: buildAiFirstPlanBlueprintSystemPrompt(),
    userPrompt: buildAiFirstPlanBlueprintUserPrompt({ authoringInput, today, referenceExample }),
    responseSchema: buildAiFirstPlanBlueprintOpenAiSchema(
      authoringInput.availability.maxRunningDaysPerWeek,
    ),
  };
}

function buildAiFirstPlanBlueprintSystemPrompt() {
  return [
    "You author a compact Hito Running first-plan coaching blueprint from validated structured setup truth.",
    "Return only the ai-first-plan-blueprint-v1 JSON object requested by the schema.",
    "Your blueprint is not persisted directly. Hito backend expands it into canonical training-plan-v2 workouts and segments.",
    "Use Hito workout taxonomy only: workoutFamily, workoutIdentity, and calendarIconKey must be valid schema values.",
    "Return only authored running workouts in each week. The backend fills fixed rest days and unscheduled days.",
    "Never include rest/rest_and_recovery in plannedWorkouts. Rest days are not authored workouts.",
    "Respect fixed rest days as hard constraints and use the requested running days/week.",
    "Use the preferred long-run day whenever feasible and include exactly one long-run intent per week.",
    "Taper and final weeks still need a reduced long-run intent, usually taper_long_run, cutback_long_run, long_aerobic_run, hike_run_endurance, mountain_long_run_time_on_feet, or ultra_time_on_feet_durability depending on the goal.",
    "Follow the backend goal-family identity policy. Beginner/low-support plans stay mostly easy, recovery, steady, and long; supported performance, marathon, ultra, and mountain/trail plans use the required cadence slots for their specific workout identities.",
    "Do not fill required cadence slots with generic easy, steady, recovery, or long support work unless the slot explicitly asks for a long-run specialty identity.",
    "Keep segmentIntent compact: describe the session shape, not a full segment tree.",
    "Keep metricIntent compact. Do not output numeric HR, pace ranges, personalized zones, or metric targets.",
    "Do not output user ids, plan ids, logs, completion state, provider sync placeholders, AI verdicts, or feedback placeholders.",
    "Do not invent medical, rehab, threshold-HR, lab-tested, exact elevation, or route-matching claims.",
    "Keep review assumptions concise and honest about weak support, target-time uncertainty, conservative load, and default HR guidance.",
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
  return [
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
    "Required authored workout slots:",
    JSON.stringify(buildPromptRequiredWorkoutSlots(authoringInput)),
    "Use every required slot exactly once in the matching week. Do not add extra dates, omit slots, move slots, or place authored workouts on fixed rest days.",
    "Each week has one required long-run slot. That slot must use workoutFamily long, hike_run_endurance, mountain_long_run_time_on_feet, or ultra_time_on_feet_durability.",
    "Required cadence slots are pre-spaced away from the long run when possible. Keep the day after a long run easy or recovery unless the backend explicitly marks that date as a required cadence slot.",
    "If a slot includes requiredIdentityOptions, choose one of those identities for that exact slot. If mustBeQuality=true, use workoutFamily tempo, intervals, progression, or race unless the option itself is a backend long-run specialty.",
    "",
    "Reference-style example guidance:",
    JSON.stringify(buildReferenceStyleSummary(referenceExample)),
  ].join("\n");
}

function buildPromptRequiredWorkoutSlots(authoringInput: StructuredAuthoringInput) {
  const horizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const fixedRestDays: Set<string> = new Set(authoringInput.availability.unavailableDays);
  const runningDays: Set<string> = new Set(
    authoringInput.availability.preferredRunningDays.filter((day) => !fixedRestDays.has(day)),
  );
  const preferredLongRunDay = authoringInput.availability.preferredLongRunDay ?? null;
  const policy = resolveGoalFamilyIdentityPolicy(authoringInput);
  const cadenceSlots = buildRequiredCadenceSlots(authoringInput, policy);

  return Array.from({ length: horizonWeeks }, (_value, weekIndex) => {
    const weekNumber = weekIndex + 1;
    const weekStart = addDaysIso(authoringInput.schedule.startDate, weekIndex * 7);
    const slots = Array.from({ length: 7 }, (_day, dayIndex) => {
      const date = addDaysIso(weekStart, dayIndex);
      const weekday = weekdayLong(date);

      if (!runningDays.has(weekday)) {
        return null;
      }

      return {
        date,
        weekday,
        mustBeLongRun: preferredLongRunDay ? weekday === preferredLongRunDay : false,
        mustBeQuality:
          cadenceSlots.get(weekNumber)?.date === date &&
          cadenceSlots.get(weekNumber)?.kind === "quality",
        ...(cadenceSlots.get(weekNumber)?.date === date
          ? {
              cadenceKind: cadenceSlots.get(weekNumber)!.kind,
              requiredIdentityOptions: cadenceSlots.get(weekNumber)!.identityOptions,
              cadencePurpose: cadenceSlots.get(weekNumber)!.purpose,
            }
          : {}),
      };
    }).filter(
      (
        slot,
      ): slot is {
        date: string;
        weekday: string;
        mustBeLongRun: boolean;
        mustBeQuality: boolean;
        cadenceKind?: GoalFamilyCadenceKind;
        requiredIdentityOptions?: AuthoredWorkoutIdentity[];
        cadencePurpose?: string;
      } => Boolean(slot),
    );

    return {
      weekNumber,
      slots,
    };
  });
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
