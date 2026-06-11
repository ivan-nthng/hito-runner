import type {
  RunningPlanDistanceFamily,
  RunningPlanRange,
} from "@/lib/plan-creation-engine/source-types";

export const seconds = (minMinutes: number, maxMinutes = minMinutes): RunningPlanRange => ({
  min: minMinutes * 60,
  max: maxMinutes * 60,
});

export const meters = (min: number, max = min): RunningPlanRange => ({ min, max });

export const ALL_SUPPORTED_RUNNING_PLAN_FAMILIES: readonly RunningPlanDistanceFamily[] = [
  "10K",
  "Half Marathon",
  "Marathon Base",
  "Marathon Completion",
] as const;
