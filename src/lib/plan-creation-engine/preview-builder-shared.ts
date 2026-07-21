import type {
  NormalizedPlanGoalIntent,
  PlanGoalIntentInput,
} from "@/lib/plan-creation-engine/plan-goal-intent";
import type {
  RunningPlanBenchmarkInput,
  RunningPlanBenchmarkPaceTruth,
  RunningPlanDaysPerWeek,
  RunningPlanRunnerLevel,
  RunningPlanTargetTruthMode,
  RunningPlanWatchExecutableSegmentTemplate,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import type { WeekdayName } from "@/lib/weekday-rest-invariants";
import type { RunnerPlanAuthoringProfileSnapshot } from "@/lib/user-settings-actions";

export const RUNNING_PLAN_PREVIEW_REST_DAY_KIND = "rest" as const;

export type RunningPlanPreviewLoadContext = "ai_authored";
export type RunningPlanPreviewCalendarWorkoutDayKind =
  | RunningPlanWorkoutDayKind
  | typeof RUNNING_PLAN_PREVIEW_REST_DAY_KIND;

export interface BuildRunningPlanPreviewInput {
  age: number;
  heightCm: number;
  weightKg: number;
  runnerLevel: RunningPlanRunnerLevel;
  daysPerWeek?: RunningPlanDaysPerWeek | null;
  fixedRestDays?: readonly WeekdayName[] | null;
  preferredLongRunDay?: WeekdayName | null;
  startDate?: string | null;
  benchmark?: RunningPlanBenchmarkInput | null;
  planGoalIntent: PlanGoalIntentInput & {
    distance: NonNullable<PlanGoalIntentInput["distance"]>;
  };
}

export interface RunningPlanPreviewCalendarRow {
  rowId: string;
  date: string;
  weekNumber: number;
  dayNumber: number;
  weekday: WeekdayName;
  isRestDay: boolean;
  workoutDayKind: RunningPlanPreviewCalendarWorkoutDayKind;
  title: string;
  watchExecutable: boolean;
  primaryContract: "numeric_structure" | null;
  targetTruthModes: readonly RunningPlanTargetTruthMode[];
  cueRole: "secondary_only" | null;
  segments: readonly RunningPlanWatchExecutableSegmentTemplate[];
  endpointGateId: string | null;
  endpointIdentity?: string | null;
  endpointDistanceMeters: number | null;
}

export interface RunningPlanPreviewNormalizedInputSummary {
  normalizedBy: string;
  age: number;
  heightCm: number;
  weightKg: number;
  runnerLevel: RunningPlanRunnerLevel;
  daysPerWeek: RunningPlanDaysPerWeek;
  fixedRestDays: WeekdayName[];
  preferredLongRunDay: WeekdayName | null;
  startDate: string;
  benchmarkPaceTruth: RunningPlanBenchmarkPaceTruth | null;
  planGoalIntent: NormalizedPlanGoalIntent;
  longRunDaySource: "runner_preference" | "ai_authored" | "not_supplied";
  trainingWeekdays: readonly WeekdayName[];
  loadContext: RunningPlanPreviewLoadContext;
  runnerProfileSnapshot: RunnerPlanAuthoringProfileSnapshot;
}
