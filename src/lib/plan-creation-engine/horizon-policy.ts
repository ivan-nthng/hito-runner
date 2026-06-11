import type {
  RunningPlanDaysPerWeek,
  RunningPlanDistanceFamily,
  RunningPlanRunnerLevel,
} from "@/lib/plan-creation-engine/source-types";
import type { RunningPlanPreviewLoadContext } from "@/lib/plan-creation-engine/preview-builder-shared";

export const RUNNING_PLAN_HORIZON_POLICY_VERSION = "running_plan_horizon_policy_v1" as const;

export interface RunningPlanHorizonSelection {
  policyVersion: typeof RUNNING_PLAN_HORIZON_POLICY_VERSION;
  horizonWeeks: number;
  selectionReason:
    | "standard_preferred_horizon"
    | "beginner_auto_extended_horizon"
    | "conservative_auto_extended_horizon";
}

const STANDARD_HORIZON_WEEKS = {
  "10K": { 3: 16, 4: 14, 5: 12 },
  "Half Marathon": { 3: 32, 4: 28, 5: 24 },
  "Marathon Base": { 3: 40, 4: 32, 5: 24 },
} as const satisfies Record<
  Exclude<RunningPlanDistanceFamily, "Marathon Completion">,
  Record<RunningPlanDaysPerWeek, number>
>;

const CONSERVATIVE_HORIZON_WEEKS = {
  "10K": { 3: 20, 4: 18, 5: 16 },
  "Half Marathon": { 3: 36, 4: 32, 5: 28 },
  "Marathon Base": { 3: 52, 4: 40, 5: 32 },
} as const satisfies Record<
  Exclude<RunningPlanDistanceFamily, "Marathon Completion">,
  Record<RunningPlanDaysPerWeek, number>
>;

const MARATHON_COMPLETION_STANDARD_HORIZON_WEEKS = {
  beginner_new_runner: { 3: 80, 4: 64, 5: 56 },
  sometimes_runs: { 3: 60, 4: 48, 5: 40 },
  runs_a_lot: { 3: 48, 4: 36, 5: 28 },
  professional_competitive: { 3: 44, 4: 32, 5: 24 },
} as const satisfies Record<RunningPlanRunnerLevel, Record<RunningPlanDaysPerWeek, number>>;

const MARATHON_COMPLETION_CONSERVATIVE_HORIZON_WEEKS = {
  beginner_new_runner: { 3: 96, 4: 76, 5: 68 },
  sometimes_runs: { 3: 76, 4: 60, 5: 52 },
  runs_a_lot: { 3: 60, 4: 48, 5: 40 },
  professional_competitive: { 3: 56, 4: 44, 5: 36 },
} as const satisfies Record<RunningPlanRunnerLevel, Record<RunningPlanDaysPerWeek, number>>;

export function resolveRunningPlanHorizonSelection({
  family,
  runnerLevel,
  loadContext,
  daysPerWeek,
}: {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
}): RunningPlanHorizonSelection {
  const conservative = loadContext === "conservative";
  const horizonWeeks =
    family === "Marathon Completion"
      ? conservative
        ? MARATHON_COMPLETION_CONSERVATIVE_HORIZON_WEEKS[runnerLevel][daysPerWeek]
        : MARATHON_COMPLETION_STANDARD_HORIZON_WEEKS[runnerLevel][daysPerWeek]
      : conservative
        ? CONSERVATIVE_HORIZON_WEEKS[family][daysPerWeek]
        : STANDARD_HORIZON_WEEKS[family][daysPerWeek];

  return {
    policyVersion: RUNNING_PLAN_HORIZON_POLICY_VERSION,
    horizonWeeks,
    selectionReason: conservative
      ? "conservative_auto_extended_horizon"
      : runnerLevel === "beginner_new_runner"
        ? "beginner_auto_extended_horizon"
        : "standard_preferred_horizon",
  };
}

export function resolveRunningPlanCutbackWeeks(horizonWeeks: number) {
  const cutbackWeeks: number[] = [];

  for (let weekNumber = 4; weekNumber <= horizonWeeks - 2; weekNumber += 4) {
    cutbackWeeks.push(weekNumber);
  }

  return cutbackWeeks;
}

export function resolveRunningPlanTaperWeek(horizonWeeks: number) {
  return Math.max(1, horizonWeeks - 1);
}

export function resolveRunningPlanEndpointWeek(horizonWeeks: number) {
  return horizonWeeks;
}
