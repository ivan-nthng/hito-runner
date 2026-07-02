import { meters, seconds } from "@/lib/plan-creation-engine/source-shared";
import { MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS } from "@/lib/plan-creation-engine/marathon-completion-policy";
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
  "Marathon Completion": {
    family: "Marathon Completion",
    gateId: "marathon_completion_selected_distance_endpoint",
    requiredEndpointKind: "selected_distance_endpoint",
    requiredFinalWorkoutKinds: ["final_selected_distance_day"],
    endpointDistanceMeters: MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
    mustNameSelectedDistanceInEndpoint: true,
    mustNotClaimFullMarathonReadiness: false,
    rejectedFinalOutputs: [
      "long_aerobic_run",
      "easy_aerobic_run",
      "recovery_jog",
      "rest_and_recovery",
      "race_pace_session",
      "target_time_endpoint",
      "metadata_only_endpoint",
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

const marathonCompletionEndpointTemplate: RunningPlanEndpointTemplate = {
  family: "Marathon Completion",
  endpointGateId: "marathon_completion_selected_distance_endpoint",
  endpointDistanceMeters: MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
  endpointBehavior: "selected_distance_completion_or_checkpoint",
  mustNotClaimFullMarathonReadiness: false,
  kind: "final_selected_distance_day",
  label: "Marathon Completion Day",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only"],
  allowedFamilies: ["Marathon Completion"],
  cueRole: "secondary_only",
  segments: [
    {
      id: "marathon_completion_endpoint_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(8, 10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Start patient; this is a finish-focused endpoint, not a pace test.",
    },
    {
      id: "marathon_completion_endpoint_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "distance",
        distanceMeters: meters(MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS),
        intensityLabel: "marathon_completion_exact_endpoint",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Complete the exact 42195m full-marathon distance without chasing pace.",
    },
    {
      id: "marathon_completion_endpoint_finish",
      order: 3,
      segmentRole: "finish",
      primaryPrescription: {
        mode: "time",
        durationSeconds: seconds(5),
        intensityLabel: "completion_settle",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Downshift and finish composed.",
    },
    {
      id: "marathon_completion_endpoint_cooldown",
      order: 4,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(5, 8),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Walk or jog easy after the completion block.",
    },
  ],
};

export const endpointTemplates: RunningPlanEngineSourceModel["endpointTemplates"] = {
  "10K": tenKEndpointTemplate,
  "Half Marathon": halfMarathonEndpointTemplate,
  "Marathon Completion": marathonCompletionEndpointTemplate,
} as const;

export function resolveRunningPlanEndpointTemplate(family: RunningPlanDistanceFamily) {
  return endpointTemplates[family];
}
