import { z } from "zod";
import { acceptedRunnerHeartRateProfileSchema } from "@/lib/heart-rate-zones";
import { normalizedPlanGoalIntentSchema } from "@/lib/plan-creation-engine/plan-goal-intent";
import { RUNNING_PLAN_RUNNER_LEVEL_VALUES } from "@/lib/plan-creation-engine/source-types";
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
