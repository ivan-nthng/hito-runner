import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildHalfMarathonPlanPreviewDraft,
  buildMarathonBasePlanPreviewDraft,
  buildTenKPlanPreviewDraft,
  type BuildRunningPlanPreviewInput,
  type HalfMarathonPlanBuilderResult,
  type MarathonBasePlanBuilderResult,
  type TenKPlanBuilderResult,
} from "@/lib/plan-creation-engine";
import {
  RUNNING_PLAN_DISTANCE_FAMILY_VALUES,
  RUNNING_PLAN_RUNNER_LEVEL_VALUES,
} from "@/lib/plan-creation-engine/source-types";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";

const weekdayNameSchema = z.enum(WEEKDAY_NAMES);

const runningPlanPreviewInputSchema = z
  .object({
    age: z.number().finite().positive(),
    heightCm: z.number().finite().positive(),
    weightKg: z.number().finite().positive(),
    runnerLevel: z.enum(RUNNING_PLAN_RUNNER_LEVEL_VALUES),
    distanceFamily: z.enum(RUNNING_PLAN_DISTANCE_FAMILY_VALUES),
    daysPerWeek: z.number().int().min(1).max(7).optional().nullable(),
    fixedRestDays: z.array(weekdayNameSchema).optional().nullable(),
    preferredLongRunDay: weekdayNameSchema.optional().nullable(),
    startDate: z.string().trim().optional().nullable(),
  })
  .strict();

export type RunningPlanPreviewActionResult =
  | TenKPlanBuilderResult
  | HalfMarathonPlanBuilderResult
  | MarathonBasePlanBuilderResult;
export type RunningPlanPreviewActionInput = z.output<typeof runningPlanPreviewInputSchema>;

export const previewRunningPlanDraft = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => runningPlanPreviewInputSchema.parse(value))
  .handler(async ({ data }): Promise<RunningPlanPreviewActionResult> => {
    const input: BuildRunningPlanPreviewInput = {
      ...data,
      daysPerWeek: data.daysPerWeek as BuildRunningPlanPreviewInput["daysPerWeek"],
    };

    switch (data.distanceFamily) {
      case "10K":
        return buildTenKPlanPreviewDraft(input);
      case "Half Marathon":
        return buildHalfMarathonPlanPreviewDraft(input);
      case "Marathon Base":
        return buildMarathonBasePlanPreviewDraft(input);
    }
  });
