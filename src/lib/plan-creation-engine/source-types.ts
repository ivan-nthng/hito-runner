import type { PlannedWorkoutRepeatChildRole } from "@/lib/planned-workout-block-contract";
import type { StepTarget } from "@/lib/training";

export const RUNNING_PLAN_RUNNER_LEVEL_VALUES = [
  "beginner_new_runner",
  "sometimes_runs",
  "runs_a_lot",
  "professional_competitive",
] as const;

export type RunningPlanRunnerLevel = (typeof RUNNING_PLAN_RUNNER_LEVEL_VALUES)[number];
export type RunningPlanDaysPerWeek = 3 | 4 | 5;

export const RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES = [
  "recovery",
  "easy",
  "long_run",
  "cutback_long_run",
  "strides",
  "steady_aerobic_run",
  "progression",
  "tempo",
  "threshold",
  "intervals",
  "hills",
  "trail",
  "race",
  "final_selected_distance_day",
] as const;

export type RunningPlanWorkoutDayKind = (typeof RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES)[number];
export type RunningPlanTargetTruthMode = "structure_only" | "editable_default_hr";

export interface RunningPlanRange {
  min: number;
  max: number;
}

export type RunningPlanBenchmarkInput =
  | {
      kind: "recent_5k_time";
      recent5kTime: string;
    }
  | {
      kind: "recent_5k_pace";
      recent5kPace: string;
    }
  | {
      kind: "unknown";
    };

export interface RunningPlanBenchmarkPaceTruth {
  kind: "recent_5k";
  source: "recent_5k_time" | "recent_5k_pace";
  paceSecondsPerKm: number;
  label: string;
}

export type RunningPlanSegmentPrescription =
  | {
      mode: "time";
      durationSeconds: RunningPlanRange;
      intensityLabel: string;
    }
  | {
      mode: "distance";
      distanceMeters: RunningPlanRange;
      intensityLabel: string;
    }
  | {
      mode: "repeat";
      repeatCount: RunningPlanRange;
      children: readonly RunningPlanRepeatChildPrescription[];
    };

export type RunningPlanRepeatChildUnitPrescription =
  | {
      mode: "time";
      durationSeconds: RunningPlanRange;
    }
  | {
      mode: "distance";
      distanceMeters: RunningPlanRange;
    };

export interface RunningPlanRepeatChildPrescription {
  role: PlannedWorkoutRepeatChildRole;
  label?: string;
  guidance?: string;
  prescription: RunningPlanRepeatChildUnitPrescription;
  intensityLabel: string;
  target?: StepTarget;
}

export interface RunningPlanWatchExecutableSegmentTemplate {
  id: string;
  order: number;
  segmentRole:
    | "warmup"
    | "opener"
    | "main"
    | "checkpoint"
    | "work"
    | "recovery"
    | "finish"
    | "cooldown";
  primaryPrescription: RunningPlanSegmentPrescription;
  targetTruthMode: RunningPlanTargetTruthMode;
  secondaryCue: string;
  target?: StepTarget;
}
