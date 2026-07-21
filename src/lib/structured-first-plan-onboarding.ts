import { z } from "zod";
import {
  FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES,
  FIRST_PLAN_GOAL_DISTANCE_VALUES,
  FIRST_PLAN_GOAL_STYLE_VALUES,
  FIRST_PLAN_TERRAIN_FOCUS_VALUES,
  FIRST_PLAN_WATCH_ACCESS_VALUES,
  isRealIsoDate,
  parseDurationSeconds,
  parsePaceSecondsPerKm,
} from "@/lib/first-plan-authoring-utils";
import {
  FITNESS_LEVEL_VALUES,
  mapRunnerTrainingPreferencesProductToStorage,
  normalizeRunnerFitnessBenchmark,
  runnerFitnessBenchmarkInputSchema,
} from "@/lib/runner-training-preferences";
import { diffDaysIso, todayIso } from "@/lib/training";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date in YYYY-MM-DD format.")
  .refine(isRealIsoDate, "Choose a real calendar date.");

const durationTimeSchema = z
  .string()
  .trim()
  .refine((value) => parseDurationSeconds(value) != null, "Use a time like 25:00 or 1:45:00.");

const recent5kTimeSchema = durationTimeSchema;
const targetTimeSchema = durationTimeSchema;
const recent5kPaceSchema = z
  .string()
  .trim()
  .refine((value) => parsePaceSecondsPerKm(value) != null, "Use a pace like 5:30/km.");

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
      diffDaysIso(value.targetDate, todayIso()) <= 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetDate"],
        message: "Choose a future target date.",
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

const structuredFirstPlanOnboardingInputSchema = z
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
      diffDaysIso(value.schedule.targetDate, value.schedule.startDate) <= 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["schedule", "targetDate"],
        message: "Choose a target date after the plan start date.",
      });
    }
  });

export type StructuredFirstPlanOnboardingInput = z.output<
  typeof structuredFirstPlanOnboardingInputSchema
>;
