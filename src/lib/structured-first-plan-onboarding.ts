import { z } from "zod";
import {
  FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES,
  FIRST_PLAN_GOAL_DISTANCE_VALUES,
  FIRST_PLAN_GOAL_STYLE_VALUES,
  FIRST_PLAN_TERRAIN_FOCUS_VALUES,
  FIRST_PLAN_WATCH_ACCESS_VALUES,
  formatGoalDistance,
  formatGoalStyle,
  guidancePreferenceToPreferredEffortLanguage,
  isRealIsoDate,
  normalizeFirstPlanExecutionMode,
  parseDurationSeconds,
  parsePaceSecondsPerKm,
  pickEvenly,
  uniqueWeekdays,
} from "@/lib/first-plan-authoring-utils";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import {
  deriveAvailableTrainingWeekdays,
  derivePreferredLongRunDayFallback,
  FITNESS_LEVEL_VALUES,
  mapRunnerTrainingPreferencesProductToStorage,
  normalizeRunnerFitnessBenchmark,
  runnerFitnessBenchmarkInputSchema,
  type RunnerFitnessLevel,
} from "@/lib/runner-training-preferences";
import type { Json } from "@/lib/supabase/database";
import { structuredPlanAuthoringInputSchema } from "@/lib/structured-plan-authoring";
import { diffDaysIso, todayIso } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date in YYYY-MM-DD format.")
  .refine(isRealIsoDate, "Choose a real calendar date.");

const durationTimeSchema = z
  .string()
  .trim()
  .refine((value) => parseDurationSeconds(value) != null, "Use a time like 25:00 or 1:45:00.");

const recent5kTimeSchema = durationTimeSchema.refine((value) => {
  const seconds = parseDurationSeconds(value);

  return seconds != null && seconds >= 10 * 60 && seconds <= 2 * 60 * 60;
}, "Use a realistic recent 5K time.");

const targetTimeSchema = durationTimeSchema.refine((value) => {
  const seconds = parseDurationSeconds(value);

  return seconds != null && seconds >= 10 * 60 && seconds <= 12 * 60 * 60;
}, "Use a realistic target time.");

const recent5kPaceSchema = z
  .string()
  .trim()
  .refine((value) => parsePaceSecondsPerKm(value) != null, "Use a pace like 5:30/km.")
  .refine((value) => {
    const seconds = parsePaceSecondsPerKm(value);

    return seconds != null && seconds >= 2 * 60 && seconds <= 15 * 60;
  }, "Use a realistic recent 5K pace.");

const requiredNumber = (fieldLabel: string) =>
  z.number({
    required_error: `${fieldLabel} is required.`,
    invalid_type_error: `${fieldLabel} is required.`,
  });

const profileSchema = z
  .object({
    age: requiredNumber("Age")
      .int("Age must be a whole number.")
      .min(13, "Age must be between 13 and 100.")
      .max(100, "Age must be between 13 and 100."),
    weightKg: requiredNumber("Weight")
      .min(30, "Weight must be between 30 kg and 250 kg.")
      .max(250, "Weight must be between 30 kg and 250 kg.")
      .refine((value) => Number.isInteger(value * 2), "Weight must use 0.5 kg increments."),
    heightCm: requiredNumber("Height")
      .int("Height must be a whole number.")
      .min(120, "Height must be between 120 cm and 230 cm.")
      .max(230, "Height must be between 120 cm and 230 cm."),
  })
  .strict();

const legacyBenchmarkSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("recent_5k_time"),
      recent5kTime: recent5kTimeSchema,
      recent5kPace: z.null().optional(),
      fitnessLevel: z.literal("custom").optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("recent_5k_pace"),
      recent5kPace: recent5kPaceSchema,
      recent5kTime: z.null().optional(),
      fitnessLevel: z.enum(FITNESS_LEVEL_VALUES).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("unknown"),
      recent5kTime: z.null().optional(),
      recent5kPace: z.null().optional(),
      fitnessLevel: z.enum(FITNESS_LEVEL_VALUES).optional(),
    })
    .strict(),
]);
const benchmarkSchema = z.union([
  legacyBenchmarkSchema,
  runnerFitnessBenchmarkInputSchema.transform((value) => normalizeRunnerFitnessBenchmark(value)),
]);

const weekdaySchema = z.enum(WEEKDAY_NAMES);

const availabilitySchema = z
  .object({
    runningDaysPerWeek: z.number().int().min(1).max(7),
    fixedRestDays: z
      .array(weekdaySchema)
      .max(6, "Leave at least one weekday available for running.")
      .default([]),
    preferredLongRunDay: weekdaySchema.optional().nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    try {
      mapRunnerTrainingPreferencesProductToStorage({
        fixedRestDays: value.fixedRestDays,
        defaultRunningDaysPerWeek: value.runningDaysPerWeek,
        preferredLongRunDay: value.preferredLongRunDay ?? null,
      });
    } catch (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["runningDaysPerWeek"],
        message:
          error instanceof Error ? error.message : "Training preferences could not be validated.",
      });
    }
  });

const goalDistanceSchema = z.enum(FIRST_PLAN_GOAL_DISTANCE_VALUES);
const goalStyleSchema = z.enum(FIRST_PLAN_GOAL_STYLE_VALUES);
const terrainFocusSchema = z.enum(FIRST_PLAN_TERRAIN_FOCUS_VALUES);
const watchAccessSchema = z.enum(FIRST_PLAN_WATCH_ACCESS_VALUES);
const guidancePreferenceSchema = z.enum(FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES);

const executionSchema = z
  .object({
    watchAccess: watchAccessSchema.optional().nullable(),
    guidancePreference: guidancePreferenceSchema.optional().nullable(),
  })
  .strict()
  .optional()
  .nullable();

const goalSchema = z
  .object({
    goalDistance: goalDistanceSchema,
    goalStyle: goalStyleSchema,
    terrainFocus: terrainFocusSchema.optional().nullable(),
    targetTime: targetTimeSchema.optional().nullable(),
    targetDate: isoDateSchema.optional().nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.goalStyle === "target_time" && !value.targetTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetTime"],
        message: "Target time is required when goal style is target time.",
      });
    }

    if (
      value.goalStyle === "target_time" &&
      value.targetDate &&
      diffDaysIso(value.targetDate, todayIso()) < 6
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetDate"],
        message: "Choose a target date at least 7 days from today.",
      });
    }
  });

const strengthSchema = z
  .object({
    preference: z.enum(["none", "mobility", "strength_mobility"]).optional().nullable(),
  })
  .strict()
  .optional()
  .nullable();

export const structuredFirstPlanOnboardingInputSchema = z
  .object({
    profile: profileSchema,
    benchmark: benchmarkSchema,
    availability: availabilitySchema,
    goal: goalSchema,
    strength: strengthSchema,
    execution: executionSchema,
    comment: z.string().trim().max(600).optional().nullable(),
  })
  .strict();

export type StructuredFirstPlanOnboardingInput = z.output<
  typeof structuredFirstPlanOnboardingInputSchema
>;
export type StructuredFirstPlanOnboardingRequestInput = z.input<
  typeof structuredFirstPlanOnboardingInputSchema
>;

export type StructuredFirstPlanAuthoringInput = z.output<typeof structuredPlanAuthoringInputSchema>;

export interface StructuredFirstPlanProfilePatch {
  age: number;
  weightKg: number;
  heightCm: number;
  baselineNotes: string | null;
  trainingPreferences?: Json;
}

export interface StructuredFirstPlanDraftReview {
  runnerUnderstanding: {
    profile: string;
    benchmark: string;
    goal: string;
    availability: string;
    execution: string;
  };
  planShape: {
    durationLabel: string;
    runningDaysPerWeek: number;
    fixedRestDays: WeekdayName[];
    activityMix: string[];
    terrainFocus: "standard" | "rolling" | "mountain";
    workoutCount: number;
    longRunDay: WeekdayName | null;
    qualityRhythm: string;
    metricPolicy: string;
  };
  assumptions: string[];
  safetyNotes: string[];
  nextActions: Array<"ok_create_plan" | "back_and_edit">;
}

export interface StructuredFirstPlanDraftSummary {
  planName: string;
  startDate: string;
  targetDate: string | null;
  workoutCount: number;
  fixedRestDays: WeekdayName[];
  runningDaysPerWeek: number;
}

export function parseStructuredFirstPlanOnboardingInput(value: unknown) {
  const result = structuredFirstPlanOnboardingInputSchema.safeParse(value);

  if (!result.success) {
    throw new Error(formatStructuredFirstPlanOnboardingError(result.error));
  }

  return result.data;
}

export function buildStructuredFirstPlanAuthoringInput(input: StructuredFirstPlanOnboardingInput) {
  const fixedRestDays = uniqueWeekdays(input.availability.fixedRestDays);
  const allowedWeekdays = deriveAvailableTrainingWeekdays(fixedRestDays);
  const preferredLongRunDay =
    input.availability.preferredLongRunDay &&
    allowedWeekdays.includes(input.availability.preferredLongRunDay)
      ? input.availability.preferredLongRunDay
      : (derivePreferredLongRunDayFallback(fixedRestDays) ?? allowedWeekdays[0]!);
  const preferredRunningDays = choosePreferredRunningDays(
    allowedWeekdays,
    preferredLongRunDay,
    input.availability.runningDaysPerWeek,
  );
  const startDate = deriveStartDateForTrainingWeekdays(preferredRunningDays);
  const terrainFocus = normalizeTerrainFocus(input.goal);
  const execution = normalizeFirstPlanExecutionMode(input.execution);
  const targetDate =
    input.goal.goalStyle === "target_time" ? (input.goal.targetDate ?? null) : null;
  const authoringInput = {
    goal: {
      goalType: input.goal.goalDistance,
      goalLabel: buildGoalLabel(input.goal),
      targetEventName:
        input.goal.goalDistance === "build_consistency"
          ? null
          : `${formatGoalDistance(input.goal.goalDistance)} plan`,
    },
    schedule: {
      startDate,
      targetDate,
      preparationHorizonWeeks: targetDate ? null : defaultHorizonWeeks(input.goal.goalDistance),
    },
    runnerProfile: {
      experienceLevel: inferExperienceLevel(input),
      baselineSessionsPerWeek: input.availability.runningDaysPerWeek,
      baselineLongRunKm: deriveBaselineLongRunKm(input),
      baselineLongRunDurationMin: null,
      age: input.profile.age,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: guidancePreferenceToPreferredEffortLanguage(
        execution.guidancePreference,
      ),
    },
    currentLevel: buildCurrentLevel(input.benchmark),
    availability: {
      preferredRunningDays,
      unavailableDays: fixedRestDays,
      maxRunningDaysPerWeek: input.availability.runningDaysPerWeek,
      allowBackToBackDays: false,
      preferredLongRunDay,
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: buildHardConstraints(input),
    },
    preferences: {
      preferredWorkoutMix: goalStyleToWorkoutMix(input.goal.goalStyle),
      terrainFocus,
      strengthOrMobilityInterest: strengthPreferenceToAuthoring(input.strength?.preference),
      indoorTreadmillOk: false,
      notes: buildPlanNotes(input),
    },
    execution,
  } satisfies z.input<typeof structuredPlanAuthoringInputSchema>;

  return structuredPlanAuthoringInputSchema.parse(authoringInput);
}

export function buildStructuredFirstPlanProfilePatch(
  input: StructuredFirstPlanOnboardingInput,
): StructuredFirstPlanProfilePatch {
  const fixedRestDays = uniqueWeekdays(input.availability.fixedRestDays);
  const trainingPreferences = mapRunnerTrainingPreferencesProductToStorage({
    fixedRestDays,
    defaultRunningDaysPerWeek: input.availability.runningDaysPerWeek,
    preferredLongRunDay: input.availability.preferredLongRunDay ?? null,
  });

  return {
    age: input.profile.age,
    weightKg: input.profile.weightKg,
    heightCm: input.profile.heightCm,
    baselineNotes: null,
    trainingPreferences: trainingPreferences as unknown as Json,
  };
}

export function buildStructuredFirstPlanResultContext(input: StructuredFirstPlanOnboardingInput) {
  return {
    benchmarkKind: input.benchmark.kind,
    hasComment: Boolean(input.comment?.trim()),
    terrainFocus: normalizeTerrainFocus(input.goal),
    execution: normalizeFirstPlanExecutionMode(input.execution),
    fixedRestDays: uniqueWeekdays(input.availability.fixedRestDays),
    runningDaysPerWeek: input.availability.runningDaysPerWeek,
  };
}

export function buildStructuredFirstPlanDraftSummary(
  canonicalPlan: TrainingPlanV2,
  authoringInput: StructuredFirstPlanAuthoringInput,
): StructuredFirstPlanDraftSummary {
  return {
    planName: canonicalPlan.plan_name,
    startDate: canonicalPlan.start_date,
    targetDate: canonicalPlan.target_date ?? null,
    workoutCount: canonicalPlan.planned_workouts.length,
    fixedRestDays: uniqueWeekdays(authoringInput.availability.unavailableDays),
    runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
  };
}

export function buildStructuredFirstPlanDraftReview(
  input: StructuredFirstPlanOnboardingInput,
  canonicalPlan: TrainingPlanV2,
  authoringInput: StructuredFirstPlanAuthoringInput,
): StructuredFirstPlanDraftReview {
  const fixedRestDays = uniqueWeekdays(authoringInput.availability.unavailableDays);
  const horizonWeeks =
    authoringInput.schedule.preparationHorizonWeeks ??
    (canonicalPlan.preparation_horizon_weeks || null);
  const terrainFocus = authoringInput.preferences.terrainFocus ?? "standard";

  return {
    runnerUnderstanding: {
      profile: `${input.profile.age} years old, ${input.profile.weightKg} kg, ${input.profile.heightCm} cm.`,
      benchmark: formatBenchmarkReview(input.benchmark),
      goal: authoringInput.goal.goalLabel,
      availability: `${authoringInput.availability.maxRunningDaysPerWeek} running day(s) per week${
        fixedRestDays.length ? `, fixed rest on ${fixedRestDays.join(", ")}` : ""
      }.`,
      execution: formatExecutionReview(input),
    },
    planShape: {
      durationLabel: authoringInput.schedule.targetDate
        ? `${canonicalPlan.start_date} to ${authoringInput.schedule.targetDate}`
        : horizonWeeks
          ? `${horizonWeeks} weeks`
          : "Flexible horizon",
      runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
      fixedRestDays,
      activityMix: buildStructuredActivityMix(canonicalPlan, authoringInput),
      terrainFocus,
      workoutCount: canonicalPlan.planned_workouts.length,
      longRunDay: authoringInput.availability.preferredLongRunDay ?? null,
      qualityRhythm: buildQualityRhythm(authoringInput),
      metricPolicy: buildMetricPolicyReview(input),
    },
    assumptions: buildStructuredReviewAssumptions(input, authoringInput),
    safetyNotes: [
      "Nothing has been created yet.",
      "Creating the plan requires explicit confirmation.",
      "Profile basics are saved only after confirmation.",
      "The optional comment is generation context, not permanent profile truth.",
    ],
    nextActions: ["ok_create_plan", "back_and_edit"],
  };
}

function formatBenchmarkReview(benchmark: StructuredFirstPlanOnboardingInput["benchmark"]) {
  if ("fitnessLevel" in benchmark && benchmark.fitnessLevel !== "custom") {
    return `Fitness level: ${formatFitnessLevel(benchmark.fitnessLevel)}. No recent 5K benchmark supplied.`;
  }

  switch (benchmark.kind) {
    case "recent_5k_time":
      return `Recent 5K time: ${benchmark.recent5kTime}.`;
    case "recent_5k_pace":
      return `Recent 5K pace: ${benchmark.recent5kPace}.`;
    case "unknown":
      return "No recent 5K benchmark supplied.";
  }
}

function formatExecutionReview(input: StructuredFirstPlanOnboardingInput) {
  const execution = normalizeFirstPlanExecutionMode(input.execution);
  const watchLabel =
    execution.watchAccess === "watch_or_app"
      ? "watch or app available"
      : execution.watchAccess === "none"
        ? "no watch or app targets"
        : "watch/app access unknown";

  return `${formatGuidancePreference(execution.guidancePreference)} guidance with ${watchLabel}.`;
}

function formatGuidancePreference(
  preference: NonNullable<ReturnType<typeof normalizeFirstPlanExecutionMode>["guidancePreference"]>,
) {
  switch (preference) {
    case "pace":
      return "pace";
    case "heart_rate":
      return "heart-rate";
    case "mixed":
      return "mixed";
    case "effort":
      return "effort";
  }
}

function buildStructuredActivityMix(
  canonicalPlan: TrainingPlanV2,
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  const sourceTypes = new Set(
    canonicalPlan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.source_workout_type ?? workout.workout_type),
  );
  const mix = ["easy aerobic running", "long-run progression"];

  if (
    sourceTypes.has("controlled_tempo_session") ||
    sourceTypes.has("distance_intervals") ||
    sourceTypes.has("time_intervals")
  ) {
    mix.push("controlled quality work");
  }

  if (
    sourceTypes.has("rolling_hills_session") ||
    sourceTypes.has("uphill_repeats") ||
    sourceTypes.has("climbing_steady_run")
  ) {
    mix.push("hill-oriented preparation");
  }

  if (sourceTypes.has("cutback_aerobic_run") || sourceTypes.has("cutback_long_run")) {
    mix.push("cutback weeks for recovery");
  }

  if (sourceTypes.has("long_run_with_steady_finish")) {
    mix.push("later long runs with steady finish");
  }

  if (
    authoringInput.preferences.strengthOrMobilityInterest &&
    authoringInput.preferences.strengthOrMobilityInterest !== "none"
  ) {
    mix.push("simple strength or mobility support");
  }

  return mix;
}

function buildQualityRhythm(authoringInput: StructuredFirstPlanAuthoringInput) {
  const nonLongRunDays = authoringInput.availability.preferredRunningDays.filter(
    (weekday) => weekday !== authoringInput.availability.preferredLongRunDay,
  );
  const qualityDay = nonLongRunDays[0] ?? null;

  if (!qualityDay || authoringInput.availability.maxRunningDaysPerWeek < 3) {
    return "No regular quality day; runs stay mostly easy.";
  }

  return `Quality work is planned around ${qualityDay}, with cutback weeks simplified.`;
}

function buildMetricPolicyReview(input: StructuredFirstPlanOnboardingInput) {
  const execution = normalizeFirstPlanExecutionMode(input.execution);
  const hasBenchmark = input.benchmark.kind !== "unknown";

  if (
    execution.watchAccess === "watch_or_app" &&
    (execution.guidancePreference === "pace" || execution.guidancePreference === "mixed") &&
    hasBenchmark
  ) {
    return "Broad pace targets may appear where the recent 5K benchmark supports them.";
  }

  if (execution.guidancePreference === "heart_rate") {
    return "Heart-rate preference is noted, but numeric HR targets are omitted until real HR-zone truth exists.";
  }

  return "Targets stay effort/cue based unless watch/app access and benchmark-supported pace guidance are available.";
}

function buildStructuredReviewAssumptions(
  input: StructuredFirstPlanOnboardingInput,
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  const assumptions = [];
  const execution = normalizeFirstPlanExecutionMode(input.execution);

  if (input.benchmark.kind === "unknown") {
    assumptions.push("No recent 5K benchmark was supplied, so Hito keeps targets effort-based.");
  }

  if (execution.guidancePreference === "heart_rate") {
    assumptions.push(
      "Heart-rate guidance was requested, but this draft does not use numeric HR targets because no HR-zone truth exists yet.",
    );
  }

  if (!input.goal.targetDate && !authoringInput.schedule.targetDate) {
    assumptions.push("Timeline uses Hito's default horizon for this goal instead of a race date.");
  }

  if (normalizeTerrainFocus(input.goal) === "standard" && !input.goal.terrainFocus) {
    assumptions.push(
      "Terrain is treated as standard because no hill or mountain focus was supplied.",
    );
  }

  if (!input.strength?.preference || input.strength.preference === "none") {
    assumptions.push("Strength and mobility support stays minimal.");
  }

  return assumptions;
}

function formatStructuredFirstPlanOnboardingError(error: z.ZodError) {
  const issue = error.issues[0];
  const message = issue?.message ?? "Check the setup answers and try again.";
  const path = issue?.path.join(".");

  return path ? `${path}: ${message}` : message;
}

function buildGoalLabel(goal: StructuredFirstPlanOnboardingInput["goal"]) {
  const parts = [formatGoalDistance(goal.goalDistance), formatGoalStyle(goal.goalStyle, "title")];

  if (goal.goalStyle === "target_time" && goal.targetTime) {
    parts.push(goal.targetTime);
  }

  return parts.join(" · ");
}

function defaultHorizonWeeks(
  goalDistance: StructuredFirstPlanOnboardingInput["goal"]["goalDistance"],
) {
  switch (goalDistance) {
    case "marathon":
      return 16;
    case "ultra_marathon":
      return 20;
    case "mountain_running":
      return 12;
    case "half_marathon":
      return 12;
    case "10k":
      return 10;
    case "5k":
    case "build_consistency":
      return 8;
  }
}

function inferExperienceLevel(input: StructuredFirstPlanOnboardingInput) {
  if (input.benchmark.kind !== "unknown") {
    return input.availability.runningDaysPerWeek >= 5 ? "experienced_runner" : "consistent_runner";
  }

  if ("fitnessLevel" in input.benchmark) {
    switch (input.benchmark.fitnessLevel) {
      case "new_to_running":
        return "new_runner";
      case "beginner":
        return "returning_runner";
      case "running_regularly":
        return "consistent_runner";
      case "performance_focused":
        return "experienced_runner";
      case "custom":
        break;
    }
  }

  return input.availability.runningDaysPerWeek <= 2 ? "new_runner" : "returning_runner";
}

function deriveBaselineLongRunKm(input: StructuredFirstPlanOnboardingInput) {
  const sessions = input.availability.runningDaysPerWeek;
  const distanceBase =
    input.goal.goalDistance === "ultra_marathon"
      ? 12
      : input.goal.goalDistance === "marathon" || input.goal.goalDistance === "mountain_running"
        ? 10
        : 8;

  if (sessions <= 1) return 5;
  if (sessions === 2) return 6;
  if (sessions >= 5) return Math.max(distanceBase, 10);

  return distanceBase;
}

function buildCurrentLevel(benchmark: StructuredFirstPlanOnboardingInput["benchmark"]) {
  if (benchmark.kind === "recent_5k_time") {
    const recent5kPaceSecondsPerKm = parseDurationSeconds(benchmark.recent5kTime)! / 5;

    return {
      recentResultSummary: `Recent 5K time: ${benchmark.recent5kTime}.`,
      recentRaceResults: [
        {
          distance: "5K",
          resultTime: benchmark.recent5kTime,
          resultDate: null,
        },
      ],
      recent5kPaceSecondsPerKm,
      currentEasyPaceRange: buildEasyPaceRange(recent5kPaceSecondsPerKm),
      currentTrainingLoadSummary: null,
    };
  }

  if (benchmark.kind === "recent_5k_pace") {
    const recent5kPaceSecondsPerKm = parsePaceSecondsPerKm(benchmark.recent5kPace)!;

    return {
      recentResultSummary: `Recent 5K pace: ${benchmark.recent5kPace}.`,
      recentRaceResults: [],
      recent5kPaceSecondsPerKm,
      currentEasyPaceRange: buildEasyPaceRange(recent5kPaceSecondsPerKm),
      currentTrainingLoadSummary: null,
    };
  }

  return {
    recentResultSummary: null,
    recentRaceResults: [],
    recent5kPaceSecondsPerKm: null,
    currentEasyPaceRange: null,
    currentTrainingLoadSummary: null,
  };
}

function buildHardConstraints(input: StructuredFirstPlanOnboardingInput) {
  const constraints = [];

  if (input.goal.goalStyle === "target_time" && input.goal.targetTime) {
    constraints.push(`Target time context: ${input.goal.targetTime}.`);
  }

  const boundedCommentConstraint = buildBoundedCommentConstraint(input.comment);

  if (boundedCommentConstraint) {
    constraints.push(boundedCommentConstraint);
  }

  return constraints;
}

function goalStyleToWorkoutMix(goalStyle: StructuredFirstPlanOnboardingInput["goal"]["goalStyle"]) {
  switch (goalStyle) {
    case "relaxed":
      return "easy_heavy";
    case "ambitious":
    case "target_time":
      return "long_run_focus";
    case "balanced":
      return "balanced";
  }
}

function normalizeTerrainFocus(goal: StructuredFirstPlanOnboardingInput["goal"]) {
  if (goal.goalDistance === "mountain_running") {
    return "mountain";
  }

  if (goal.goalDistance === "marathon" || goal.goalDistance === "ultra_marathon") {
    return goal.terrainFocus ?? "standard";
  }

  return "standard";
}

function strengthPreferenceToAuthoring(
  preference: "none" | "mobility" | "strength_mobility" | null | undefined,
) {
  switch (preference) {
    case "none":
      return "none";
    case "mobility":
      return "mobility";
    case "strength_mobility":
      return "both";
    default:
      return null;
  }
}

function buildPlanNotes(input: StructuredFirstPlanOnboardingInput) {
  const notes = [];
  const terrainFocus = normalizeTerrainFocus(input.goal);

  if (input.goal.goalDistance === "ultra_marathon") {
    notes.push(
      "Goal context: ultra marathon. Emphasize durable endurance and long-run progression without adding exact elevation targets or unsupported race-specific complexity.",
    );
  }

  if (input.goal.goalDistance === "mountain_running") {
    notes.push(
      "Goal context: mountain running. Treat mountain terrain as required generation context while avoiding route matching or exact elevation targets.",
    );
  }

  if (terrainFocus === "rolling") {
    notes.push(
      "Terrain focus: rolling. Occasional mild hill-oriented work is appropriate; avoid exact elevation targets.",
    );
  }

  if (terrainFocus === "mountain") {
    notes.push(
      "Terrain focus: mountain. Include intentional hill preparation such as uphill intervals, hill repeats, climbing-focused steady work, or hilly long-run guidance without exact elevation targets.",
    );
  }

  if (input.strength?.preference === "mobility") {
    notes.push("Include only simple mobility support where useful; no detailed gym programming.");
  }

  if (input.strength?.preference === "strength_mobility") {
    notes.push(
      "Include only simple strength or mobility support placeholders where useful; no detailed gym programming.",
    );
  }

  return notes.join(" ") || null;
}

function buildBoundedCommentConstraint(comment: string | null | undefined) {
  const normalized = comment?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (
    /\b(injury|injured|pain|ache|sore|soreness|tight|tender|niggle|recovering|rehab)\b/.test(
      normalized,
    )
  ) {
    return "Runner provided a caution note; keep progression conservative and avoid diagnostic or medical assumptions.";
  }

  if (/\b(travel|shift|work|sleep|stress|busy)\b/.test(normalized)) {
    return "Runner provided a scheduling or recovery note; keep workload conservative when in doubt.";
  }

  return "Runner provided optional context; treat it as secondary nuance only.";
}

function deriveStartDateForTrainingWeekdays(trainingWeekdays: WeekdayName[]) {
  let candidate = todayIso();

  for (let offset = 0; offset < 7; offset += 1) {
    const weekday = new Date(`${candidate}T00:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }) as WeekdayName;

    if (trainingWeekdays.includes(weekday)) {
      return candidate;
    }

    const date = new Date(`${candidate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    candidate = date.toISOString().slice(0, 10);
  }

  return todayIso();
}

function choosePreferredRunningDays(
  allowedWeekdays: WeekdayName[],
  longRunDay: WeekdayName,
  runningDaysPerWeek: number,
) {
  if (runningDaysPerWeek <= 1) {
    return [longRunDay];
  }

  const nonLongRunDays = allowedWeekdays.filter((weekday) => weekday !== longRunDay);
  const selected = uniqueWeekdays([
    ...pickEvenly(nonLongRunDays, runningDaysPerWeek - 1),
    longRunDay,
  ]);

  if (selected.length === runningDaysPerWeek) {
    return selected;
  }

  const filled = uniqueWeekdays([...selected, ...allowedWeekdays]).slice(0, runningDaysPerWeek);

  return filled;
}

function buildEasyPaceRange(recent5kPaceSecondsPerKm: number) {
  return formatPaceRange(recent5kPaceSecondsPerKm + 90, recent5kPaceSecondsPerKm + 150);
}

function formatPaceRange(fastSecondsPerKm: number, slowSecondsPerKm: number) {
  return `${formatPaceSecondsPerKm(fastSecondsPerKm)}-${formatPaceSecondsPerKm(
    slowSecondsPerKm,
  )}/km`;
}

function formatPaceSecondsPerKm(secondsPerKm: number) {
  const roundedSeconds = Math.round(secondsPerKm / 5) * 5;
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatFitnessLevel(fitnessLevel: Exclude<RunnerFitnessLevel, "custom">) {
  switch (fitnessLevel) {
    case "new_to_running":
      return "new to running";
    case "beginner":
      return "beginner";
    case "running_regularly":
      return "running regularly";
    case "performance_focused":
      return "performance focused";
  }
}
