import { meters, seconds } from "@/lib/plan-creation-engine/source-shared";
import type {
  RunningPlanDistanceFamily,
  RunningPlanEndpointTemplate,
  RunningPlanEngineSourceModel,
} from "@/lib/plan-creation-engine/source-types";

export const endpointGates: RunningPlanEngineSourceModel["endpointGates"] = {
  "10K": {
    family: "10K",
    gateId: "ten_k_selected_distance_endpoint",
    requiredEndpointKind: "selected_distance_endpoint",
    requiredFinalWorkoutKinds: ["final_selected_distance_day"],
    endpointDistanceMeters: 10_000,
    mustNameSelectedDistanceInEndpoint: true,
    mustNotClaimFullMarathonReadiness: false,
    rejectedFinalOutputs: [
      "long_aerobic_run",
      "easy_aerobic_run",
      "recovery_jog",
      "rest_and_recovery",
      "generic_support_only_final_week",
      "metadata_only_endpoint",
    ],
  },
  "Half Marathon": {
    family: "Half Marathon",
    gateId: "half_marathon_selected_distance_endpoint",
    requiredEndpointKind: "selected_distance_endpoint",
    requiredFinalWorkoutKinds: ["final_selected_distance_day"],
    endpointDistanceMeters: 21_100,
    mustNameSelectedDistanceInEndpoint: true,
    mustNotClaimFullMarathonReadiness: false,
    rejectedFinalOutputs: [
      "half_readiness_marker",
      "long_aerobic_run",
      "easy_aerobic_run",
      "recovery_jog",
      "rest_and_recovery",
      "generic_support_only_final_week",
      "metadata_only_endpoint",
    ],
  },
  "Marathon Base": {
    family: "Marathon Base",
    gateId: "marathon_base_honest_endpoint",
    requiredEndpointKind: "marathon_base_endpoint",
    requiredFinalWorkoutKinds: ["marathon_base_endpoint"],
    endpointDistanceMeters: null,
    mustNameSelectedDistanceInEndpoint: false,
    mustNotClaimFullMarathonReadiness: true,
    rejectedFinalOutputs: [
      "full_marathon_race_readiness",
      "marathon_race_peak",
      "target_time_endpoint",
      "race_pace_session",
      "rest_and_recovery",
      "generic_support_only_final_week",
    ],
  },
} as const;

const tenKEndpointTemplate: RunningPlanEndpointTemplate = {
  family: "10K",
  endpointGateId: "ten_k_selected_distance_endpoint",
  endpointDistanceMeters: 10_000,
  endpointBehavior: "selected_distance_completion_or_checkpoint",
  mustNotClaimFullMarathonReadiness: false,
  kind: "final_selected_distance_day",
  label: "Final 10K Day",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only"],
  allowedFamilies: ["10K"],
  cueRole: "secondary_only",
  segments: [
    {
      id: "ten_k_endpoint_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(10, 12),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Start calm.",
    },
    {
      id: "ten_k_endpoint_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "distance",
        distanceMeters: meters(10_000),
        intensityLabel: "10k_completion_block",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Complete the full 10K honestly.",
    },
    {
      id: "ten_k_endpoint_finish",
      order: 3,
      segmentRole: "finish",
      primaryPrescription: {
        mode: "time",
        durationSeconds: seconds(3),
        intensityLabel: "easy_settle",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Downshift before stopping.",
    },
    {
      id: "ten_k_endpoint_cooldown",
      order: 4,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(5, 8),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish confident.",
    },
  ],
};

const halfMarathonEndpointTemplate: RunningPlanEndpointTemplate = {
  family: "Half Marathon",
  endpointGateId: "half_marathon_selected_distance_endpoint",
  endpointDistanceMeters: 21_100,
  endpointBehavior: "selected_distance_completion_or_checkpoint",
  mustNotClaimFullMarathonReadiness: false,
  kind: "final_selected_distance_day",
  label: "Final Half Marathon Day",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only"],
  allowedFamilies: ["Half Marathon"],
  cueRole: "secondary_only",
  segments: [
    {
      id: "half_endpoint_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(10, 12),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Start patient.",
    },
    {
      id: "half_endpoint_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "distance",
        distanceMeters: meters(21_100),
        intensityLabel: "21_1k_completion_block",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Complete the full 21.1K honestly.",
    },
    {
      id: "half_endpoint_finish",
      order: 3,
      segmentRole: "finish",
      primaryPrescription: {
        mode: "time",
        durationSeconds: seconds(3),
        intensityLabel: "easy_settle",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Regain calm control.",
    },
    {
      id: "half_endpoint_cooldown",
      order: 4,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(5, 8),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish confident.",
    },
  ],
};

const marathonBaseEndpointTemplate: RunningPlanEndpointTemplate = {
  family: "Marathon Base",
  endpointGateId: "marathon_base_honest_endpoint",
  endpointDistanceMeters: null,
  endpointBehavior: "marathon_base_durability_endpoint",
  mustNotClaimFullMarathonReadiness: true,
  kind: "marathon_base_endpoint",
  label: "Marathon Base Endpoint",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ["Marathon Base"],
  cueRole: "secondary_only",
  segments: [
    {
      id: "marathon_base_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Start patient.",
    },
    {
      id: "marathon_base_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "time_with_default_hr_cap",
        durationSeconds: seconds(40, 60),
        defaultHrZoneLabelOrCap: "editable default HR guidance",
        intensityLabel: "durable_steady",
      },
      targetTruthMode: "editable_default_hr",
      secondaryCue: "Calm durable composure.",
    },
    {
      id: "marathon_base_finish",
      order: 3,
      segmentRole: "finish",
      primaryPrescription: {
        mode: "time",
        durationSeconds: seconds(5),
        intensityLabel: "easy_settle",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Let the effort come down.",
    },
    {
      id: "marathon_base_cooldown",
      order: 4,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(5, 10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish durable, not depleted.",
    },
  ],
};

export const endpointTemplates: RunningPlanEngineSourceModel["endpointTemplates"] = {
  "10K": tenKEndpointTemplate,
  "Half Marathon": halfMarathonEndpointTemplate,
  "Marathon Base": marathonBaseEndpointTemplate,
} as const;

export function resolveRunningPlanEndpointTemplate(family: RunningPlanDistanceFamily) {
  return endpointTemplates[family];
}
