import { z } from "zod";
import { acceptedRunnerHeartRateProfileSchema } from "@/lib/heart-rate-zones";
import { normalizedPlanGoalIntentSchema } from "@/lib/plan-creation-engine/plan-goal-intent";
import { RUNNING_PLAN_RUNNER_LEVEL_VALUES } from "@/lib/plan-creation-engine/source-types";
import {
  RUNNER_FITNESS_PROFILE_COMPONENT_STATES,
  RUNNER_FITNESS_PROFILE_INITIAL_PLAN_PROJECTION_VERSION,
  RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION,
} from "@/lib/runner-activity/product-contract";
import { FITNESS_LEVEL_VALUES } from "@/lib/runner-training-preferences";
import { diffDaysIso, todayIso } from "@/lib/training";

const weekdayValues = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const weekdaySchema = z.enum(weekdayValues);

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const benchmarkSchema = z
  .object({
    kind: z.literal("recent_5k"),
    source: z.enum(["recent_5k_time", "recent_5k_pace"]),
    paceSecondsPerKm: z.number().int().positive(),
    label: z.string().trim().min(1).max(120),
  })
  .strict()
  .nullable();

const profileCoverageSchema = z
  .object({
    includedCount: z.number().int().nonnegative(),
    candidateCount: z.number().int().nonnegative(),
    missingCount: z.number().int().nonnegative(),
    coveredDates: z.array(isoDateSchema),
  })
  .strict();

const profileComponentFactsSchema = z
  .object({
    state: z.enum(RUNNER_FITNESS_PROFILE_COMPONENT_STATES),
    coverage: profileCoverageSchema,
    reasonCodes: z.array(z.string().trim().min(1)),
  })
  .strict();

const profileFactMetricSchema = z
  .object({
    availability: z.enum(["available", "unavailable"]),
    confidence: z.enum(["complete", "partial", "unavailable"]),
    value: z.number().nullable(),
    unit: z.enum(["sessions", "minutes", "kilometers", "meters"]),
    includedActivityCount: z.number().int().nonnegative(),
    missingActivityCount: z.number().int().nonnegative(),
    missingReasons: z.array(z.string()),
  })
  .strict();

const profileProgressSnapshotSchema = z
  .object({
    window: z
      .object({
        startDate: isoDateSchema,
        endDate: isoDateSchema,
        cutoffDate: isoDateSchema,
        timezoneBasis: z.literal("historical_local_date"),
        weekStartsOn: z.literal("monday"),
      })
      .strict(),
    formulaVersion: z.string().trim().min(1),
    eligibleActivityCount: z.number().int().nonnegative(),
    facts: z
      .object({
        sessions: profileFactMetricSchema,
        runningTime: profileFactMetricSchema,
        distance: profileFactMetricSchema,
        elevationGain: profileFactMetricSchema,
        longestDistance: profileFactMetricSchema,
        longestDuration: profileFactMetricSchema,
      })
      .strict(),
  })
  .strict();

const profileSessionLoadWindowSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    metric: z
      .object({
        availability: z.enum(["available", "unavailable"]),
        confidence: z.enum(["complete", "partial", "unavailable"]),
        value: z.number().nullable(),
        displayValue: z.number().nullable(),
        unit: z.literal("arbitrary_units"),
        includedObservationCount: z.number().int().nonnegative(),
        unavailableObservationCount: z.number().int().nonnegative(),
        unavailableReasons: z.array(z.string()),
      })
      .strict(),
  })
  .strict();

const initialPlanProfileSchema = z
  .object({
    version: z.literal(RUNNER_FITNESS_PROFILE_INITIAL_PLAN_PROJECTION_VERSION),
    snapshotDefinitionVersion: z.literal(RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION),
    snapshotId: z.string().trim().min(1),
    runnerFactsRevision: z.string().trim().min(1),
    asOf: z.string().trim().min(1),
    cutoffDate: isoDateSchema,
    timeZone: z.string().trim().min(1),
    formulaVersions: z
      .object({
        profile: z.string().trim().min(1),
        runnerActivity: z.array(z.string().trim().min(1)),
        sessionRpeLoad: z.string().trim().min(1).nullable(),
      })
      .strict(),
    components: z
      .object({
        constraints: profileComponentFactsSchema.extend({
          fitnessLevel: z.enum(FITNESS_LEVEL_VALUES).nullable(),
          trainingPreferences: z
            .object({
              blocked_days: z.array(weekdaySchema),
              preferred_long_run_day: weekdaySchema.nullable(),
              max_running_days_per_week: z.number().int().min(1).max(7).nullable(),
            })
            .strict()
            .nullable(),
          source: z
            .object({
              revision: z.number().int().nonnegative().nullable(),
              fingerprint: z.string().trim().min(1),
            })
            .strict(),
        }),
        recent28Day: profileComponentFactsSchema.extend({
          current: profileProgressSnapshotSchema.nullable(),
          previous: profileProgressSnapshotSchema.nullable(),
          calendarOutcomes: z
            .object({
              candidateCount: z.number().int().nonnegative(),
              completedCount: z.number().int().nonnegative(),
              partialCount: z.number().int().nonnegative(),
              skippedCount: z.number().int().nonnegative(),
              unresolvedCount: z.number().int().nonnegative(),
              sessionRpeCoverage: z
                .object({
                  includedCount: z.number().int().nonnegative(),
                  missingCount: z.number().int().nonnegative(),
                })
                .strict(),
            })
            .strict(),
          evidence: z
            .object({
              dueWorkoutCount: z.number().int().nonnegative(),
              resolvedOutcomeCount: z.number().int().nonnegative(),
              acceptedActualCount: z.number().int().nonnegative(),
              completionOnlyCount: z.number().int().nonnegative(),
              missingCount: z.number().int().nonnegative(),
              updatingCount: z.number().int().nonnegative(),
              removedCount: z.number().int().nonnegative(),
            })
            .strict(),
        }),
        latestFive: profileComponentFactsSchema.extend({
          inspectionOnly: z.literal(true),
          coveredDates: z.array(isoDateSchema),
        }),
        rolling90Day: profileComponentFactsSchema.extend({
          acceptedActivityCount: z.number().int().nonnegative(),
          weeklyDistribution: z.array(
            z
              .object({
                startDate: isoDateSchema,
                endDate: isoDateSchema,
                sessionCount: z.number().int().nonnegative(),
                runningTimeMin: z.number().nonnegative().nullable(),
                distanceKm: z.number().nonnegative().nullable(),
                missingDurationCount: z.number().int().nonnegative(),
                missingDistanceCount: z.number().int().nonnegative(),
              })
              .strict(),
          ),
          longestDuration: z
            .object({ localDate: isoDateSchema, minutes: z.number().nonnegative() })
            .strict()
            .nullable(),
          longestDistance: z
            .object({ localDate: isoDateSchema, kilometers: z.number().nonnegative() })
            .strict()
            .nullable(),
          sessionRpeLoad: z
            .object({
              formulaVersion: z.string().trim().min(1),
              current: profileSessionLoadWindowSchema,
              previous: profileSessionLoadWindowSchema,
            })
            .strict()
            .nullable(),
        }),
        comparablePerformance: profileComponentFactsSchema,
      })
      .strict(),
  })
  .strict();

export const GENERATED_PLAN_RUNNER_COMMENT_MAX_LENGTH = 500;

const generatedPlanRunnerCommentValueSchema = z
  .string()
  .trim()
  .min(1, "Add a comment or leave this field blank.")
  .max(
    GENERATED_PLAN_RUNNER_COMMENT_MAX_LENGTH,
    `Keep the plan comment to ${GENERATED_PLAN_RUNNER_COMMENT_MAX_LENGTH} characters or fewer.`,
  );

export const generatedPlanRunnerCommentInputSchema = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim().length === 0) ? undefined : value,
  generatedPlanRunnerCommentValueSchema.optional(),
);

export const structuredPlanAuthoringInputSchema = z
  .object({
    schedule: z
      .object({
        startDate: isoDateSchema.default(todayIso()),
      })
      .strict(),
    runnerFacts: z
      .object({
        age: z.number().int().min(13).max(100),
        heightCm: z.number().min(120).max(230),
        weightKg: z.number().min(30).max(250),
        selfReportedLevel: z.enum(RUNNING_PLAN_RUNNER_LEVEL_VALUES),
        benchmark: benchmarkSchema,
        heartRateProfile: acceptedRunnerHeartRateProfileSchema,
      })
      .strict(),
    availability: z
      .object({
        fixedRestDays: z.array(weekdaySchema).max(6).nullable().default(null),
        maxRunningDaysPerWeek: z.number().int().min(1).max(7).nullable().default(null),
        preferredLongRunDay: weekdaySchema.optional().nullable(),
      })
      .superRefine((value, context) => {
        const fixedRestDays = value.fixedRestDays ?? [];

        if (value.preferredLongRunDay && fixedRestDays.includes(value.preferredLongRunDay)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["preferredLongRunDay"],
            message: "Preferred long-run day cannot also be a fixed rest day.",
          });
        }
      }),
    planGoalIntent: normalizedPlanGoalIntentSchema.refine((intent) => intent.distance != null, {
      message: "Choose a training distance before creating a generated plan.",
      path: ["distance"],
    }),
    requestContext: z
      .object({
        runnerComment: generatedPlanRunnerCommentValueSchema,
      })
      .strict()
      .optional(),
    initialPlanProfile: initialPlanProfileSchema,
    initialPlanAdmission: z.enum(["authoring_ready_factual", "authoring_ready_constraint_only"]),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.planGoalIntent.targetDate) {
      const diffDays = diffDaysIso(value.planGoalIntent.targetDate, value.schedule.startDate);

      if (diffDays <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["planGoalIntent", "targetDate"],
          message: "Target date must be after start date.",
        });
      }
    }
  });

export type StructuredPlanAuthoringInput = z.infer<typeof structuredPlanAuthoringInputSchema>;
