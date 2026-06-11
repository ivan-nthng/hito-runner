import type { WeekdayName } from "@/lib/weekday-rest-invariants";

export const RUNNING_PLAN_ENGINE_SOURCE_VERSION = "running_plan_engine_source_v1" as const;

export const RUNNING_PLAN_DISTANCE_FAMILY_VALUES = [
  "10K",
  "Half Marathon",
  "Marathon Base",
  "Marathon Completion",
] as const;

export type RunningPlanDistanceFamily = (typeof RUNNING_PLAN_DISTANCE_FAMILY_VALUES)[number];

export const RUNNING_PLAN_RUNNER_LEVEL_VALUES = [
  "beginner_new_runner",
  "sometimes_runs",
  "runs_a_lot",
  "professional_competitive",
] as const;

export type RunningPlanRunnerLevel = (typeof RUNNING_PLAN_RUNNER_LEVEL_VALUES)[number];

export const RUNNING_PLAN_DAYS_PER_WEEK_VALUES = [3, 4, 5] as const;

export type RunningPlanDaysPerWeek = (typeof RUNNING_PLAN_DAYS_PER_WEEK_VALUES)[number];

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
  "final_selected_distance_day",
  "marathon_base_endpoint",
] as const;

export type RunningPlanWorkoutDayKind = (typeof RUNNING_PLAN_WORKOUT_DAY_KIND_VALUES)[number];

export const RUNNING_PLAN_NON_ENDPOINT_WORKOUT_DAY_KIND_VALUES = [
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
] as const;

export type RunningPlanNonEndpointWorkoutDayKind =
  (typeof RUNNING_PLAN_NON_ENDPOINT_WORKOUT_DAY_KIND_VALUES)[number];

export const RUNNING_PLAN_ENDPOINT_WORKOUT_DAY_KIND_VALUES = [
  "final_selected_distance_day",
  "marathon_base_endpoint",
] as const;

export type RunningPlanEndpointWorkoutDayKind =
  (typeof RUNNING_PLAN_ENDPOINT_WORKOUT_DAY_KIND_VALUES)[number];

export const RUNNING_PLAN_SEGMENT_MODE_VALUES = [
  "time",
  "distance",
  "time_with_default_hr_cap",
  "distance_with_default_hr_cap",
  "repeat",
  "recovery_time",
  "recovery_distance",
  "open_warmup",
  "open_cooldown",
  "free_run_with_cap",
] as const;

export type RunningPlanSegmentMode = (typeof RUNNING_PLAN_SEGMENT_MODE_VALUES)[number];

export const RUNNING_PLAN_TARGET_TRUTH_MODE_VALUES = [
  "structure_only",
  "editable_default_hr",
] as const;

export type RunningPlanTargetTruthMode = (typeof RUNNING_PLAN_TARGET_TRUTH_MODE_VALUES)[number];

export interface RunningPlanRange {
  min: number;
  max: number;
}

export interface RunningPlanBuilderInput {
  age: number;
  heightCm: number;
  weightKg: number;
  runnerLevel: RunningPlanRunnerLevel;
  distanceFamily: RunningPlanDistanceFamily;
  daysPerWeek: RunningPlanDaysPerWeek;
  fixedRestDays: WeekdayName[];
  preferredLongRunDay: WeekdayName | null;
  startDate: string;
}

export interface RunningPlanBuilderInputField {
  field: keyof RunningPlanBuilderInput;
  required: boolean;
  source: "runner_input" | "backend_default";
  purpose: string;
}

export interface RunningPlanBuilderInputContract {
  requiredFields: readonly RunningPlanBuilderInputField[];
  optionalFields: readonly RunningPlanBuilderInputField[];
  backendDefaults: {
    daysPerWeek: RunningPlanDaysPerWeek;
    fixedRestDays: readonly WeekdayName[];
    preferredLongRunDayFallback: WeekdayName;
  };
  deliberatelyAbsentFields: readonly {
    field: string;
    reason: string;
  }[];
}

export type RunningPlanSegmentPrescription =
  | {
      mode: Extract<RunningPlanSegmentMode, "time" | "open_warmup" | "open_cooldown">;
      durationSeconds: RunningPlanRange;
      intensityLabel: string;
    }
  | {
      mode: Extract<RunningPlanSegmentMode, "distance">;
      distanceMeters: RunningPlanRange;
      intensityLabel: string;
    }
  | {
      mode: Extract<RunningPlanSegmentMode, "time_with_default_hr_cap">;
      durationSeconds: RunningPlanRange;
      defaultHrZoneLabelOrCap: string;
      intensityLabel: string;
    }
  | {
      mode: Extract<RunningPlanSegmentMode, "distance_with_default_hr_cap">;
      distanceMeters: RunningPlanRange;
      defaultHrZoneLabelOrCap: string;
      intensityLabel: string;
    }
  | {
      mode: Extract<RunningPlanSegmentMode, "repeat">;
      repeatCount: RunningPlanRange;
      work: RunningPlanRepeatWorkPrescription;
      recovery: RunningPlanRepeatRecoveryPrescription;
    }
  | {
      mode: Extract<RunningPlanSegmentMode, "recovery_time">;
      recoveryDurationSeconds: RunningPlanRange;
      intensityLabel: string;
    }
  | {
      mode: Extract<RunningPlanSegmentMode, "recovery_distance">;
      recoveryDistanceMeters: RunningPlanRange;
      intensityLabel: string;
    }
  | {
      mode: Extract<RunningPlanSegmentMode, "free_run_with_cap">;
      durationSecondsOrDistanceMeters: RunningPlanRange;
      explicitCap: string;
      intensityLabel: string;
    };

export type RunningPlanRepeatWorkPrescription =
  | {
      mode: "time";
      durationSeconds: RunningPlanRange;
      intensityLabel: string;
    }
  | {
      mode: "distance";
      distanceMeters: RunningPlanRange;
      intensityLabel: string;
    };

export type RunningPlanRepeatRecoveryPrescription =
  | {
      mode: "recovery_time";
      recoveryDurationSeconds: RunningPlanRange;
      intensityLabel: string;
    }
  | {
      mode: "recovery_distance";
      recoveryDistanceMeters: RunningPlanRange;
      intensityLabel: string;
    };

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
}

export interface RunningPlanWorkoutDayTemplate {
  kind: RunningPlanWorkoutDayKind;
  label: string;
  watchExecutable: true;
  primaryContract: "numeric_structure";
  targetTruthModes: readonly RunningPlanTargetTruthMode[];
  allowedFamilies: readonly RunningPlanDistanceFamily[];
  segments: readonly RunningPlanWatchExecutableSegmentTemplate[];
  cueRole: "secondary_only";
}

export interface RunningPlanEndpointTemplate extends RunningPlanWorkoutDayTemplate {
  family: RunningPlanDistanceFamily;
  endpointGateId: string;
  endpointDistanceMeters: number | null;
  endpointBehavior:
    | "selected_distance_completion_or_checkpoint"
    | "marathon_base_durability_endpoint";
  mustNotClaimFullMarathonReadiness: boolean;
}

export interface RunningPlanDistanceFamilyContract {
  family: RunningPlanDistanceFamily;
  productMeaning: string;
  finalPromise: string;
  acceptedEndpointBehaviors: readonly string[];
  rejectedEndpointBehaviors: readonly string[];
  endpointGateId: string;
}

export interface RunningPlanScenarioRule {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  daysPerWeek: readonly RunningPlanDaysPerWeek[];
  goalPromise: string;
  weeklyRhythm: string;
  longRunShape: string;
  endpointRule: string;
  metricModeBias: "structure_first_editable_default_hr_optional";
  qualityGateFocus: string;
}

export interface RunningPlanMetricAndHrPolicy {
  watchAppExecutionAssumed: true;
  watchAccessInputRequired: false;
  noWatchSelectableNormalPath: false;
  userProvidedBenchmarkRequiredInNormalPath: false;
  targetTimeUnlocksPace: false;
  precisePaceAllowedInNormalPath: false;
  personalHrTruthRequiredForPersonalHrTargets: true;
  defaultHrZones: {
    mode: "editable_hito_default_hr_zones";
    labels: readonly [
      "Hito default HR zones",
      "editable default zones",
      "not personal HR-zone truth",
    ];
    personalTruth: false;
    allowedUses: readonly string[];
    forbiddenClaims: readonly string[];
  };
}

export interface RunningPlanEndpointGate {
  family: RunningPlanDistanceFamily;
  gateId: string;
  requiredEndpointKind: "selected_distance_endpoint" | "marathon_base_endpoint";
  requiredFinalWorkoutKinds: readonly RunningPlanWorkoutDayKind[];
  endpointDistanceMeters: number | null;
  mustNameSelectedDistanceInEndpoint: boolean;
  mustNotClaimFullMarathonReadiness: boolean;
  rejectedFinalOutputs: readonly string[];
}

export interface RunningPlanForbiddenOutputGate {
  gateId: string;
  description: string;
  rejectedSignals: readonly string[];
  failureAction: "reject_before_review" | "route_to_custom";
}

export interface RunningPlanEngineSourceModel {
  sourceVersion: typeof RUNNING_PLAN_ENGINE_SOURCE_VERSION;
  supportedDistanceFamilies: readonly RunningPlanDistanceFamilyContract[];
  runnerLevels: Readonly<Record<RunningPlanRunnerLevel, string>>;
  builderInputContract: RunningPlanBuilderInputContract;
  metricAndHrPolicy: RunningPlanMetricAndHrPolicy;
  workoutDayTemplates: Readonly<
    Record<RunningPlanNonEndpointWorkoutDayKind, RunningPlanWorkoutDayTemplate>
  >;
  endpointTemplates: Readonly<Record<RunningPlanDistanceFamily, RunningPlanEndpointTemplate>>;
  endpointGates: Readonly<Record<RunningPlanDistanceFamily, RunningPlanEndpointGate>>;
  scenarioRules: readonly RunningPlanScenarioRule[];
  forbiddenOutputGates: readonly RunningPlanForbiddenOutputGate[];
}
