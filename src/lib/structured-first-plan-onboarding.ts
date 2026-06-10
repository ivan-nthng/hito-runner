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
  normalizeSupportedFirstPlanExecutionMode,
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
import { buildLongDistanceHonestyAssumptions } from "@/lib/running-plan-honesty";
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

const scheduleSchema = z
  .object({
    startDate: isoDateSchema.optional().nullable(),
    targetDate: isoDateSchema.optional().nullable(),
  })
  .strict()
  .optional()
  .nullable();

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
    schedule: scheduleSchema,
    strength: strengthSchema,
    execution: executionSchema,
    comment: z.string().trim().max(600).optional().nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.schedule?.startDate &&
      value.schedule.targetDate &&
      diffDaysIso(value.schedule.targetDate, value.schedule.startDate) < 6
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["schedule", "targetDate"],
        message: "Choose a target date at least 7 days after the plan start date.",
      });
    }
  });

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
  displayTitle: string;
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

export function normalizeSupportedStructuredFirstPlanOnboardingInput(
  rawInput: StructuredFirstPlanOnboardingInput | StructuredFirstPlanOnboardingRequestInput,
) {
  const input = structuredFirstPlanOnboardingInputSchema.parse(rawInput);

  return {
    ...input,
    execution: normalizeSupportedFirstPlanExecutionMode(input.execution),
  };
}

export function buildStructuredFirstPlanAuthoringInput(
  rawInput: StructuredFirstPlanOnboardingInput | StructuredFirstPlanOnboardingRequestInput,
) {
  const input = normalizeSupportedStructuredFirstPlanOnboardingInput(rawInput);
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
  const startDate =
    input.schedule?.startDate ?? deriveStartDateForTrainingWeekdays(preferredRunningDays);
  const terrainFocus = normalizeTerrainFocus(input.goal);
  const execution = normalizeSupportedFirstPlanExecutionMode(input.execution);
  const targetDate =
    input.goal.goalStyle === "target_time"
      ? (input.schedule?.targetDate ?? input.goal.targetDate ?? null)
      : null;
  const authoringInput = {
    goal: {
      goalType: input.goal.goalDistance,
      goalLabel: buildGoalLabel(input.goal),
      goalStyle: input.goal.goalStyle,
      targetTime: input.goal.goalStyle === "target_time" ? (input.goal.targetTime ?? null) : null,
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
  const normalizedInput = normalizeSupportedStructuredFirstPlanOnboardingInput(input);

  return {
    benchmarkKind: normalizedInput.benchmark.kind,
    hasComment: Boolean(normalizedInput.comment?.trim()),
    terrainFocus: normalizeTerrainFocus(normalizedInput.goal),
    execution: normalizedInput.execution,
    fixedRestDays: uniqueWeekdays(normalizedInput.availability.fixedRestDays),
    runningDaysPerWeek: normalizedInput.availability.runningDaysPerWeek,
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
  const reviewInput = normalizeSupportedStructuredFirstPlanOnboardingInput(input);
  const fixedRestDays = uniqueWeekdays(authoringInput.availability.unavailableDays);
  const horizonWeeks =
    authoringInput.schedule.preparationHorizonWeeks ??
    (canonicalPlan.preparation_horizon_weeks || null);
  const terrainFocus = authoringInput.preferences.terrainFocus ?? "standard";

  return {
    displayTitle: buildStructuredReviewDisplayTitle(reviewInput, canonicalPlan, authoringInput),
    runnerUnderstanding: {
      profile: `${reviewInput.profile.age} years old, ${reviewInput.profile.weightKg} kg, ${reviewInput.profile.heightCm} cm.`,
      benchmark: formatBenchmarkReview(reviewInput.benchmark),
      goal: authoringInput.goal.goalLabel,
      availability: `${authoringInput.availability.maxRunningDaysPerWeek} running day(s) per week${
        fixedRestDays.length ? `, fixed rest on ${fixedRestDays.join(", ")}` : ""
      }.`,
      execution: formatExecutionReview(reviewInput),
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
      qualityRhythm: buildQualityRhythm(canonicalPlan, authoringInput),
      metricPolicy: buildMetricPolicyReview(reviewInput),
    },
    assumptions: buildStructuredReviewAssumptions(reviewInput, authoringInput),
    safetyNotes: [
      "Nothing has been created yet.",
      "Creating the plan requires explicit confirmation.",
      "Profile basics are saved only after confirmation.",
      "The optional comment is generation context, not permanent profile truth.",
    ],
    nextActions: ["ok_create_plan", "back_and_edit"],
  };
}

function buildStructuredReviewDisplayTitle(
  input: StructuredFirstPlanOnboardingInput,
  canonicalPlan: TrainingPlanV2,
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  const goalLabel = formatGoalDistance(input.goal.goalDistance);
  const goalFocusLabel = buildStructuredReviewGoalFocusLabel(input);
  const targetDate = authoringInput.schedule.targetDate ?? canonicalPlan.target_date ?? null;

  if (targetDate) {
    return `${goalLabel} ${goalFocusLabel} plan through ${targetDate}`;
  }

  const horizonWeeks =
    authoringInput.schedule.preparationHorizonWeeks ??
    canonicalPlan.preparation_horizon_weeks ??
    null;

  if (horizonWeeks) {
    return `${horizonWeeks}-week ${goalLabel} ${goalFocusLabel} plan`;
  }

  return `${goalLabel} ${goalFocusLabel} plan`;
}

function buildStructuredReviewGoalFocusLabel(input: StructuredFirstPlanOnboardingInput) {
  if (input.goal.goalStyle === "target_time" && input.goal.targetTime) {
    return `${input.goal.targetTime} target`;
  }

  return formatGoalStyle(input.goal.goalStyle);
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
  const execution = normalizeSupportedFirstPlanExecutionMode(input.execution);

  return `${formatGuidancePreference(
    execution.guidancePreference,
  )} guidance with watch/app execution assumed.`;
}

function formatGuidancePreference(
  preference: NonNullable<
    ReturnType<typeof normalizeSupportedFirstPlanExecutionMode>["guidancePreference"]
  >,
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
    sourceTypes.has("time_intervals") ||
    sourceTypes.has("5k_sharpening_repeats") ||
    sourceTypes.has("10k_rhythm_intervals") ||
    sourceTypes.has("half_marathon_threshold_durability") ||
    sourceTypes.has("marathon_steady_specificity")
  ) {
    mix.push("controlled quality work");
  }

  if (sourceTypes.has("aerobic_strides") || sourceTypes.has("5k_sharpening_repeats")) {
    mix.push("safe short-rep sharpening");
  }

  if (sourceTypes.has("10k_rhythm_intervals")) {
    mix.push("10K rhythm and sustained quality");
  }

  if (sourceTypes.has("half_marathon_threshold_durability")) {
    mix.push("half-marathon threshold durability");
  }

  if (sourceTypes.has("marathon_steady_specificity")) {
    mix.push("marathon steady-specificity");
  }

  if (sourceTypes.has("ultra_time_on_feet_durability")) {
    mix.push("ultra time-on-feet durability");
  }

  if (
    sourceTypes.has("rolling_hills_session") ||
    sourceTypes.has("uphill_repeats") ||
    sourceTypes.has("climbing_steady_run") ||
    sourceTypes.has("controlled_downhill_durability") ||
    sourceTypes.has("technical_trail_easy")
  ) {
    mix.push("hill-oriented preparation");
  }

  if (
    sourceTypes.has("controlled_downhill_durability") ||
    sourceTypes.has("hike_run_endurance") ||
    sourceTypes.has("mountain_long_run_time_on_feet")
  ) {
    mix.push("mountain-specific time-on-feet and controlled terrain skills");
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

function buildQualityRhythm(
  canonicalPlan: TrainingPlanV2,
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  if (shouldReviewAvoidRegularQuality(authoringInput)) {
    return "No regular quality day; runs stay mostly easy.";
  }

  const qualityDays = deriveReviewedQualityWeekdays(canonicalPlan);

  if (qualityDays.length === 0 || authoringInput.availability.maxRunningDaysPerWeek < 3) {
    return "No regular quality day; runs stay mostly easy.";
  }

  return `Quality work is planned around ${formatWeekdayList(qualityDays)}, with cutback weeks simplified.`;
}

function deriveReviewedQualityWeekdays(canonicalPlan: TrainingPlanV2) {
  const weekdayCounts = new Map<string, number>();

  canonicalPlan.planned_workouts.forEach((workout) => {
    if (!isReviewedQualityWorkout(workout)) {
      return;
    }

    weekdayCounts.set(workout.weekday, (weekdayCounts.get(workout.weekday) ?? 0) + 1);
  });

  return [...weekdayCounts.entries()]
    .sort((left, right) => right[1] - left[1] || weekdayOrder(left[0]) - weekdayOrder(right[0]))
    .map(([weekday]) => weekday);
}

function isReviewedQualityWorkout(workout: TrainingPlanV2["planned_workouts"][number]) {
  if (workout.workout_type === "rest" || workout.workout_type === "long_run") {
    return false;
  }

  const identity = workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type;

  if (
    [
      "controlled_tempo_session",
      "distance_intervals",
      "time_intervals",
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "race_pace_session",
      "progression_run",
      "rolling_hills_session",
      "hill_repeats",
      "uphill_repeats",
    ].includes(identity)
  ) {
    return true;
  }

  return ["quality", "tempo", "intervals", "progression", "race"].includes(workout.workout_type);
}

function formatWeekdayList(weekdays: string[]) {
  if (weekdays.length <= 1) {
    return weekdays[0] ?? "the reviewed plan";
  }

  if (weekdays.length === 2) {
    return `${weekdays[0]} and ${weekdays[1]}`;
  }

  return `${weekdays.slice(0, -1).join(", ")}, and ${weekdays.at(-1)}`;
}

function weekdayOrder(weekday: string) {
  const index = WEEKDAY_NAMES.indexOf(weekday as WeekdayName);

  return index === -1 ? WEEKDAY_NAMES.length : index;
}

function shouldReviewAvoidRegularQuality(authoringInput: StructuredFirstPlanAuthoringInput) {
  if (authoringInput.availability.maxRunningDaysPerWeek < 3) {
    return true;
  }

  if (shouldUseConservativeConsistencyReview(authoringInput)) {
    return true;
  }

  if (
    authoringInput.runnerProfile.experienceLevel === "new_runner" &&
    !hasReviewUsableBenchmark(authoringInput)
  ) {
    return true;
  }

  if (
    authoringInput.runnerProfile.age &&
    authoringInput.runnerProfile.age >= 65 &&
    !hasReviewUsableBenchmark(authoringInput)
  ) {
    return true;
  }

  return [
    ...authoringInput.constraints.injuryConstraints,
    ...authoringInput.constraints.hardConstraints,
  ].some((constraint) =>
    /avoid speed|no speed|avoid intensity|no intensity|injury/i.test(constraint),
  );
}

function shouldUseConservativeConsistencyReview(authoringInput: StructuredFirstPlanAuthoringInput) {
  if (authoringInput.goal.goalType !== "build_consistency") {
    return false;
  }

  if (authoringInput.runnerProfile.experienceLevel === "new_runner") {
    return true;
  }

  if (authoringInput.availability.maxRunningDaysPerWeek <= 3) {
    return true;
  }

  return !hasReviewUsableBenchmark(authoringInput) && !hasReviewTargetTimePressure(authoringInput);
}

function hasReviewUsableBenchmark(authoringInput: StructuredFirstPlanAuthoringInput) {
  if (authoringInput.currentLevel.recent5kPaceSecondsPerKm) {
    return true;
  }

  return authoringInput.currentLevel.recentRaceResults.some((result) => {
    if (!/^5\s*k(m)?$/i.test(result.distance.trim())) {
      return false;
    }

    return parseDurationSeconds(result.resultTime) != null;
  });
}

function hasReviewTargetTimePressure(authoringInput: StructuredFirstPlanAuthoringInput) {
  return authoringInput.constraints.hardConstraints.some((constraint) =>
    /target time/i.test(constraint),
  );
}

function buildMetricPolicyReview(input: StructuredFirstPlanOnboardingInput) {
  const execution = normalizeSupportedFirstPlanExecutionMode(input.execution);
  const hasBenchmark = input.benchmark.kind !== "unknown";
  const hasAge = typeof input.profile.age === "number";
  const hasWatchExecution = execution.watchAccess === "watch_or_app";

  if (
    hasWatchExecution &&
    (execution.guidancePreference === "pace" || execution.guidancePreference === "mixed") &&
    hasBenchmark
  ) {
    return hasAge
      ? "Broad pace targets may appear where the recent 5K benchmark supports them; HR guidance, when shown, is an age-estimated default and not personalized zones."
      : "Broad pace targets may appear where the recent 5K benchmark supports them.";
  }

  if (hasWatchExecution) {
    return hasAge
      ? "Workout structure can use executable duration, distance, repeat, work, and recovery targets; age-estimated HR, if shown, is advisory readback only."
      : "Workout structure can use executable duration, distance, repeat, work, and recovery targets; pace or HR targets require backend-supported metric truth.";
  }

  if (execution.guidancePreference === "heart_rate") {
    return hasAge
      ? "Heart-rate guidance may use broad age-estimated defaults; those ranges are not personalized HR zones."
      : "Heart-rate preference is noted, but numeric HR targets are omitted until profile age or personal HR-zone truth exists.";
  }

  return hasAge
    ? "Readable guidance remains non-executable until watch/app support and backend-supported metric truth are available; broad default HR guidance may appear from age as advisory readback only."
    : "Readable guidance remains non-executable until watch/app support and backend-supported metric truth are available.";
}

function buildStructuredReviewAssumptions(
  input: StructuredFirstPlanOnboardingInput,
  authoringInput: StructuredFirstPlanAuthoringInput,
) {
  const assumptions = [];
  const execution = normalizeSupportedFirstPlanExecutionMode(input.execution);

  if (input.benchmark.kind === "unknown") {
    assumptions.push(
      typeof input.profile.age === "number"
        ? "No recent 5K benchmark was supplied, so Hito omits pace targets; any HR range shown is broad age-estimated advisory readback."
        : "No recent 5K benchmark was supplied, so Hito omits pace targets unless backend-supported metric truth is available.",
    );
  }

  if (execution.guidancePreference === "heart_rate") {
    if (typeof input.profile.age === "number") {
      assumptions.push(
        "Heart-rate guidance uses broad age-estimated defaults where appropriate; those ranges are not personalized HR zones.",
      );
    } else {
      assumptions.push(
        "Heart-rate guidance was requested, but this draft does not use numeric HR targets because profile age and personal HR-zone truth are missing.",
      );
    }
  } else if (typeof input.profile.age === "number") {
    assumptions.push(
      "Any HR range shown is default guidance estimated from age, not personalized HR-zone truth.",
    );
  }

  const targetTimeHonesty = buildTargetTimeHonestyAssumption(input);

  if (targetTimeHonesty) {
    assumptions.push(targetTimeHonesty);
  }

  assumptions.push(
    ...buildLongDistanceHonestyAssumptions({
      goalType: authoringInput.goal.goalType,
      runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
      horizonWeeks: deriveStructuredReviewHorizonWeeks(authoringInput),
      hasUsableBenchmark: input.benchmark.kind !== "unknown",
      targetTimeIntent: input.goal.goalStyle === "target_time",
      baselineLongRunKm: authoringInput.runnerProfile.baselineLongRunKm,
      currentLoadKnown: input.benchmark.kind !== "unknown",
      age: authoringInput.runnerProfile.age,
    }),
  );

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

function deriveStructuredReviewHorizonWeeks(authoringInput: StructuredFirstPlanAuthoringInput) {
  if (authoringInput.schedule.preparationHorizonWeeks) {
    return authoringInput.schedule.preparationHorizonWeeks;
  }

  if (!authoringInput.schedule.targetDate) {
    return null;
  }

  return Math.max(
    1,
    Math.ceil(
      (diffDaysIso(authoringInput.schedule.targetDate, authoringInput.schedule.startDate) + 1) / 7,
    ),
  );
}

function buildTargetTimeHonestyAssumption(input: StructuredFirstPlanOnboardingInput) {
  if (input.goal.goalStyle !== "target_time" || !input.goal.targetTime) {
    return null;
  }

  if (input.benchmark.kind === "unknown") {
    return "Target-time intent is noted, but without a recent 5K benchmark this draft stays effort-based and does not promise target-specific paces.";
  }

  const targetSeconds = parseDurationSeconds(input.goal.targetTime);
  const goalDistanceKm = goalDistanceKmForTargetTime(input.goal.goalDistance);
  const benchmarkPaceSeconds = benchmarkPaceSecondsPerKm(input.benchmark);

  if (!targetSeconds || !goalDistanceKm || !benchmarkPaceSeconds) {
    return null;
  }

  const targetPaceSecondsPerKm = targetSeconds / goalDistanceKm;
  const minimumSupportBuffer = minimumTargetSupportBufferSeconds(input.goal.goalDistance);

  if (targetPaceSecondsPerKm < benchmarkPaceSeconds + minimumSupportBuffer) {
    return "The target time looks aggressive against the supplied 5K benchmark, so Hito keeps the plan conservative and treats the target as motivation rather than a guarantee.";
  }

  return null;
}

function benchmarkPaceSecondsPerKm(benchmark: StructuredFirstPlanOnboardingInput["benchmark"]) {
  if (benchmark.kind === "recent_5k_time") {
    const seconds = parseDurationSeconds(benchmark.recent5kTime);

    return seconds ? seconds / 5 : null;
  }

  if (benchmark.kind === "recent_5k_pace") {
    return parsePaceSecondsPerKm(benchmark.recent5kPace);
  }

  return null;
}

function goalDistanceKmForTargetTime(
  goalDistance: StructuredFirstPlanOnboardingInput["goal"]["goalDistance"],
) {
  switch (goalDistance) {
    case "5k":
      return 5;
    case "10k":
      return 10;
    case "half_marathon":
      return 21.1;
    case "marathon":
      return 42.2;
    case "ultra_marathon":
      return 50;
    case "build_consistency":
    case "mountain_running":
      return null;
  }
}

function minimumTargetSupportBufferSeconds(
  goalDistance: StructuredFirstPlanOnboardingInput["goal"]["goalDistance"],
) {
  switch (goalDistance) {
    case "10k":
      return 10;
    case "half_marathon":
      return 25;
    case "marathon":
      return 45;
    case "ultra_marathon":
      return 60;
    case "5k":
    case "build_consistency":
    case "mountain_running":
      return 0;
  }
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
        return "new_runner";
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
      "Goal context: mountain running. Treat mountain terrain as required generation context with controlled descents, hike/run allowance, time-on-feet framing, and technical-terrain caution while avoiding route matching or exact elevation targets.",
    );
  }

  if (terrainFocus === "rolling") {
    notes.push(
      "Terrain focus: rolling. Occasional mild hill-oriented work is appropriate; avoid exact elevation targets.",
    );
  }

  if (terrainFocus === "mountain") {
    notes.push(
      "Terrain focus: mountain. Include progressive hill exposure, controlled descending, climbing-focused steady work, and hilly long-run guidance without exact elevation targets.",
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
