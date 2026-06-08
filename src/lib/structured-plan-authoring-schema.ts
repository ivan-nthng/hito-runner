import { z } from "zod";
import {
  DEFAULT_FIRST_PLAN_EXECUTION_MODE,
  FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES,
  FIRST_PLAN_GOAL_STYLE_VALUES,
  FIRST_PLAN_WATCH_ACCESS_VALUES,
} from "@/lib/first-plan-authoring-utils";
import type { CanonicalExecutableMode, HrTargetSource } from "@/lib/rich-workout-model";
import { diffDaysIso, todayIso } from "@/lib/training";

export const weekdayValues = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const weekdaySchema = z.enum(weekdayValues);

const watchAccessSchema = z.enum(FIRST_PLAN_WATCH_ACCESS_VALUES);

const guidancePreferenceSchema = z.enum(FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES);

const executionModeSchema = z.preprocess(
  (value) => value ?? DEFAULT_FIRST_PLAN_EXECUTION_MODE,
  z
    .object({
      watchAccess: watchAccessSchema.default(DEFAULT_FIRST_PLAN_EXECUTION_MODE.watchAccess),
      guidancePreference: guidancePreferenceSchema.default(
        DEFAULT_FIRST_PLAN_EXECUTION_MODE.guidancePreference,
      ),
    })
    .strict(),
);

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const recentRaceResultSchema = z.object({
  distance: z.string().trim().min(1),
  resultTime: z.string().trim().min(1),
  resultDate: isoDateSchema.optional().nullable(),
});

export const structuredPlanAuthoringInputSchema = z
  .object({
    goal: z.object({
      goalType: z.enum([
        "build_consistency",
        "distance_build",
        "5k",
        "10k",
        "half_marathon",
        "marathon",
        "ultra_marathon",
        "mountain_running",
      ]),
      goalLabel: z.string().trim().min(1).max(160),
      goalStyle: z.enum(FIRST_PLAN_GOAL_STYLE_VALUES).optional().nullable(),
      targetTime: z.string().trim().min(1).max(32).optional().nullable(),
      targetEventName: z.string().trim().max(160).optional().nullable(),
    }),
    schedule: z.object({
      startDate: isoDateSchema.default(todayIso()),
      targetDate: isoDateSchema.optional().nullable(),
      preparationHorizonWeeks: z.number().int().min(1).max(40).optional().nullable(),
    }),
    runnerProfile: z
      .object({
        experienceLevel: z.enum([
          "new_runner",
          "returning_runner",
          "consistent_runner",
          "experienced_runner",
        ]),
        baselineSessionsPerWeek: z.number().int().min(1).max(7),
        baselineLongRunKm: z.number().positive().max(80).optional().nullable(),
        baselineLongRunDurationMin: z.number().int().min(20).max(300).optional().nullable(),
        age: z.number().int().min(13).max(100).optional().nullable(),
        recentInjuryRecoveryContext: z.string().trim().max(500).optional().nullable(),
        preferredEffortLanguage: z
          .enum(["pace", "heart_rate", "rpe", "mixed"])
          .optional()
          .nullable(),
      })
      .superRefine((value, context) => {
        if (!value.baselineLongRunKm && !value.baselineLongRunDurationMin) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["baselineLongRunKm"],
            message: "Provide baselineLongRunKm or baselineLongRunDurationMin.",
          });
        }
      }),
    currentLevel: z
      .object({
        recentResultSummary: z.string().trim().max(500).optional().nullable(),
        recentRaceResults: z.array(recentRaceResultSchema).max(5).default([]),
        recent5kPaceSecondsPerKm: z
          .number()
          .positive()
          .max(20 * 60)
          .optional()
          .nullable(),
        currentEasyPaceRange: z.string().trim().max(120).optional().nullable(),
        currentTrainingLoadSummary: z.string().trim().max(500).optional().nullable(),
      })
      .default({
        recentRaceResults: [],
      }),
    availability: z
      .object({
        preferredRunningDays: z.array(weekdaySchema).min(1).max(7),
        unavailableDays: z.array(weekdaySchema).max(7).default([]),
        maxRunningDaysPerWeek: z.number().int().min(1).max(7),
        allowBackToBackDays: z.boolean().default(false),
        preferredLongRunDay: weekdaySchema.optional().nullable(),
      })
      .superRefine((value, context) => {
        const overlap = value.preferredRunningDays.filter((day) =>
          value.unavailableDays.includes(day),
        );

        if (overlap.length > 0) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["preferredRunningDays"],
            message: `Preferred and unavailable days overlap: ${overlap.join(", ")}.`,
          });
        }
      }),
    constraints: z
      .object({
        injuryConstraints: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
        hardConstraints: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
      })
      .default({
        injuryConstraints: [],
        hardConstraints: [],
      }),
    preferences: z
      .object({
        preferredWorkoutMix: z
          .enum(["balanced", "easy_heavy", "quality_light", "long_run_focus"])
          .optional()
          .nullable(),
        terrainFocus: z.enum(["standard", "rolling", "mountain"]).default("standard"),
        strengthOrMobilityInterest: z
          .enum(["none", "mobility", "strength", "both"])
          .optional()
          .nullable(),
        indoorTreadmillOk: z.boolean().default(false),
        notes: z.string().trim().max(500).optional().nullable(),
      })
      .default({
        indoorTreadmillOk: false,
      }),
    execution: executionModeSchema,
  })
  .superRefine((value, context) => {
    if (!value.schedule.targetDate && !value.schedule.preparationHorizonWeeks) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["schedule", "targetDate"],
        message: "Provide targetDate or preparationHorizonWeeks.",
      });
    }

    if (value.schedule.targetDate) {
      const diffDays = diffDaysIso(value.schedule.targetDate, value.schedule.startDate);

      if (diffDays < 6) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["schedule", "targetDate"],
          message: "targetDate must be at least 7 days after startDate.",
        });
      }
    }
  });

export type StructuredPlanAuthoringInput = z.infer<typeof structuredPlanAuthoringInputSchema>;

export type StructuredWeekday = (typeof weekdayValues)[number];

export interface NormalizedStructuredInput extends StructuredPlanAuthoringInput {
  schedule: StructuredPlanAuthoringInput["schedule"] & {
    horizonWeeks: number;
    endDate: string;
  };
  availability: StructuredPlanAuthoringInput["availability"] & {
    runningDays: StructuredWeekday[];
    longRunDay: StructuredWeekday;
    qualityDay: StructuredWeekday | null;
    steadyDay: StructuredWeekday | null;
  };
}

export interface StructuredMetricMode {
  executableSurfaceSupported: boolean;
  executableMode: CanonicalExecutableMode;
  paceTargetsAllowed: boolean;
  heartRateTargetsAllowed: boolean;
  heartRateTargetSource: HrTargetSource;
  defaultEstimatedHrAvailable: boolean;
  estimatedMaxHr: number | null;
  recent5kPaceSecondsPerKm: number | null;
}

export type TrainingPhase = "Base" | "Build" | "Specific" | "Taper";

export type EasySupportKind = "easy" | "recovery" | "cutback";

export interface LongRunGoalPolicy {
  floorKm: number;
  peakKm: number;
  ceilingKm: number;
}

export type DefaultEstimatedHrBand = "recovery" | "easy" | "longAerobic" | "steady" | "tempo";
