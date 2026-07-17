import type {
  NormalizedPlanGoalIntent,
  PlanGoalIntentInput,
} from "@/lib/plan-creation-engine/plan-goal-intent";
import type {
  RunningPlanBenchmarkInput,
  RunningPlanBenchmarkPaceTruth,
  RunningPlanDaysPerWeek,
  RunningPlanDistanceFamily,
  RunningPlanRunnerLevel,
  RunningPlanTargetTruthMode,
  RunningPlanWatchExecutableSegmentTemplate,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import type { WeekdayName } from "@/lib/weekday-rest-invariants";

export const RUNNING_PLAN_PREVIEW_REST_DAY_KIND = "rest" as const;

export type RunningPlanPreviewLoadContext = "standard" | "conservative";
export type RunningPlanPreviewCalendarWorkoutDayKind =
  | RunningPlanWorkoutDayKind
  | typeof RUNNING_PLAN_PREVIEW_REST_DAY_KIND;

export interface BuildRunningPlanPreviewInput {
  age: number;
  heightCm: number;
  weightKg: number;
  runnerLevel: RunningPlanRunnerLevel;
  distanceFamily?: RunningPlanDistanceFamily | null;
  daysPerWeek?: RunningPlanDaysPerWeek | null;
  fixedRestDays?: readonly WeekdayName[] | null;
  preferredLongRunDay?: WeekdayName | null;
  startDate?: string | null;
  benchmark?: RunningPlanBenchmarkInput | null;
  planGoalIntent?: PlanGoalIntentInput | null;
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
  distanceFamily: RunningPlanDistanceFamily;
  daysPerWeek: RunningPlanDaysPerWeek;
  fixedRestDays: WeekdayName[];
  preferredLongRunDay: WeekdayName | null;
  startDate: string;
  benchmarkPaceTruth: RunningPlanBenchmarkPaceTruth | null;
  planGoalIntent: NormalizedPlanGoalIntent;
  longRunDaySource: "runner_preference" | "backend_default";
  trainingWeekdays: readonly WeekdayName[];
  loadContext: RunningPlanPreviewLoadContext;
}
