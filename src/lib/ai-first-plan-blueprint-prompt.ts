import {
  CANONICAL_METRIC_GUIDANCE_VALUES,
  HR_TARGET_SOURCE_VALUES,
} from "@/lib/rich-workout-model";
import {
  buildPromptGoalFamilyIdentityPolicy,
  resolveAuthoringHorizonWeeks,
} from "@/lib/ai-first-plan-blueprint-policy";
import { shouldUseConservativeNoBenchmarkLongDistanceAdaptation } from "@/lib/structured-plan-authoring-policy";
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
    "You author a structured Hito Running first-plan coaching blueprint from validated structured setup truth.",
    "Return only the ai-first-plan-blueprint-v2 JSON object requested by the schema.",
    "Your blueprint is not persisted directly; the backend validates and canonicalizes your authored workout sections into training-plan-v2 after safety checks.",
    "Use Hito workout taxonomy only: workoutFamily, workoutIdentity, and calendarIconKey must be valid schema values.",
    "Return only authored running workouts in each week. The backend fills rest rows for non-authored calendar days after validation.",
    "Never include rest/rest_and_recovery in plannedWorkouts. Rest days are not authored workouts.",
    "Respect fixed rest days as hard constraints and use the requested running days/week count.",
    "Taper and final weeks still need a reduced long-run intent, usually taper_long_run, cutback_long_run, long_aerobic_run, hike_run_endurance, mountain_long_run_time_on_feet, or ultra_time_on_feet_durability depending on the goal.",
    "Follow the backend goal-family identity policy. Beginner/low-support plans stay mostly easy, recovery, steady, and long; supported performance, marathon, ultra, and mountain/trail plans need week-aware specificity without unsafe density.",
    "Each plannedWorkout must include explicit sections[]. Sections are the workout structure; do not rely on workoutIdentity alone.",
    "Allowed section kinds are warm_up, run, walk, work, recover, finish, cooldown, and repeat.",
    "Repeat sections are structural only: repeat_count plus ordered child sections. The repeat parent must not carry target guidance; child sections own guidance and effort.",
    "Every non-repeat section and every repeat child must include target guidance with effort/intensity, RPE, cue, or hint. Do not leave section targets null except on the structural repeat parent.",
    "Keep segmentIntent as a compact summary of the authored sections for traceability.",
    "Keep metricIntent compact. Do not output numeric HR, pace ranges, personalized zones, or metric targets.",
    "Section targets may include effort words, cue, hint, or RPE only. Never include pace, HR bpm, personal zones, grade, route, elevation, cadence, or power.",
    "Do not output user ids, plan ids, logs, completion state, provider sync placeholders, AI verdicts, or feedback placeholders.",
    "Do not invent medical, rehab, threshold-HR, lab-tested, exact elevation, or route-matching claims.",
    "Keep review assumptions concise and honest about weak support, target-time uncertainty, conservative load, and default HR guidance.",
  ];

  return [
    ...shared,
    "You are the source of the dated training plan draft: choose the workout dates, weekly rhythm, progression, cutbacks, taper, and endpoint placement inside the provided constraints.",
    "Every plannedWorkout.date must be an explicit ISO date. Do not return null dates, weekday-only slots, or an abstract weekly template.",
    "For 15K, half-marathon, marathon, ultra, or other longer distance goals, long-run durability must build before taper; do not repeat the same long-run load through the whole build and then jump to the endpoint.",
    "If preferredLongRunDay is null, choose a sane long-run day and keep it consistent enough for the runner; if it is present, treat it as a hard preference.",
    "For every distance goal, the final non-rest workout must be the selected-distance endpoint signal: workoutFamily race, workoutIdentity selected_distance_completion_or_checkpoint, calendarIconKey race. If targetDate exists, that endpoint must land exactly on targetDate. Do not use taper_long_run, long_aerobic_run, easy, steady, or rest as the endpoint.",
    "The selected-distance endpoint must include coach-authored nested workout dynamics whose distance prescriptions sum to the exact selected distance. Use warm_up, a structural repeat/main-work section with ordered child distance sections such as controlled opening, settled middle, and protected finish, then cooldown or an equivalent walk-down. Do not return one anonymous giant distance block or arbitrary percentage splits without different coaching purpose, cues, and effort guidance. Never convert finish time into executable pace or HR targets.",
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
    "Allowed structured blueprint taxonomy:",
    JSON.stringify({
      authoredWorkoutFamilies: authoredWorkoutFamilyValues,
      authoredWorkoutIdentities: authoredWorkoutIdentityValues,
      authoredCalendarIconKeys: authoredCalendarIconKeyValues,
      sectionKinds: ["warm_up", "run", "walk", "work", "recover", "finish", "cooldown", "repeat"],
      repeatChildKinds: ["warm_up", "run", "walk", "work", "recover", "finish", "cooldown"],
      prescriptionModes: ["time", "distance", "repeats", "none"],
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
    "Author up to maxRunningDaysPerWeek workouts per week, each with an explicit date. Early adaptation weeks may use fewer workouts when that keeps recovery safer.",
    "Choose dates from allowedWorkoutWeekdays only. Never author workouts on fixedRestDays.",
    "If preferredLongRunDay is null, choose the long-run day yourself and keep the recovery rhythm safe.",
    "For conservative/no-benchmark long-distance runners, Weeks 1-4 are adaptation/base-first: use support-only easy, recovery, aerobic long, cutback, and relaxed-stride work where safe. Do not use tempo, threshold, intervals, hills, marathon-specific steady work, progression workouts, stacked steady work, or long-run steady finishes in Weeks 1-4.",
    "Use the goal-family identity policy as coaching guidance, but do not rely on backend-provided exact cadence slots.",
    "For a distance goal, include one authored selected-distance endpoint using workoutIdentity selected_distance_completion_or_checkpoint; this is the only valid endpoint signal.",
    "If targetDate is supplied for a distance goal, place that selected-distance endpoint exactly on targetDate. If targetDate is not supplied, make it the final non-rest workout.",
    "For every non-rest workout, author sections[] with numeric structure. Substantial workouts should normally include warm_up, a main run/work/repeat section, and cooldown.",
    "For every non-repeat section and repeat child, include target with safe effort/RPE/cue/hint guidance. Use null target only on the structural repeat parent.",
    "For quality workouts, prefer explicit repeat sections when sports-safe, with ordered children such as work + recover or run + walk. Work/Recover is only one possible child sequence.",
    "For the endpoint workout, include warm_up, a structural repeat/main-work section whose ordered child distance sections sum to the exact selected distance, and cooldown or an equivalent walk-down. The endpoint children should express coach-authored opening/body/finish dynamics with distinct effort cues, not flat arithmetic splits, pace, or HR prescriptions.",
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
    earlyAdaptationPolicy: buildPromptEarlyAdaptationPolicy(authoringInput, horizonWeeks),
  };
}

function buildPromptEarlyAdaptationPolicy(
  authoringInput: StructuredAuthoringInput,
  horizonWeeks: number,
) {
  const protectedWeeks = Array.from(
    { length: Math.min(4, Math.max(0, horizonWeeks - 1)) },
    (_, i) => i + 1,
  ).filter((weekNumber) =>
    shouldUseConservativeNoBenchmarkLongDistanceAdaptation(authoringInput, weekNumber),
  );

  if (protectedWeeks.length === 0) {
    return {
      applies: false,
      protectedWeeks: [],
      reason:
        "Current runner support and goal evidence do not require the conservative no-benchmark long-distance adaptation cap.",
    };
  }

  return {
    applies: true,
    protectedWeeks,
    allowedIdentities: [
      "easy_aerobic_run",
      "recovery_jog",
      "cutback_aerobic_run",
      "long_aerobic_run",
      "cutback_long_run",
      "easy_run_with_strides from Week 2 only",
    ],
    forbiddenIdentities: [
      "controlled_tempo_session",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "distance_intervals",
      "time_intervals",
      "progression_run",
      "long_run_with_steady_finish",
      "race_pace_session",
      "hill or threshold variants",
    ],
    reason:
      "No-benchmark long-distance target-time plans need a preparatory adaptation/base phase before any specificity.",
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
      note: "Use varied week-by-week workout identities and clear coaching intent. Author explicit structured sections; backend validates and canonicalizes them.",
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
