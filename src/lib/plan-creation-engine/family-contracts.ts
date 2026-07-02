import type { RunningPlanEngineSourceModel } from "@/lib/plan-creation-engine/source-types";

export const distanceFamilyContracts: RunningPlanEngineSourceModel["supportedDistanceFamilies"] = [
  {
    family: "10K",
    productMeaning: "Selected-distance completion build with visible 10K-specific development.",
    finalPromise: "Explicit 10K completion, checkpoint, or continuous endpoint behavior.",
    acceptedEndpointBehaviors: [
      "10K completion day",
      "10K checkpoint day",
      "10K continuous endpoint block",
    ],
    rejectedEndpointBehaviors: [
      "final long_aerobic_run",
      "final generic easy day",
      "final recovery day",
      "endpoint hidden only in metadata while rows stay generic",
    ],
    endpointGateId: "ten_k_selected_distance_endpoint",
  },
  {
    family: "Half Marathon",
    productMeaning: "Selected-distance completion build with visible 21.1K-specific development.",
    finalPromise: "Explicit 21.1K completion, checkpoint, or continuous endpoint behavior.",
    acceptedEndpointBehaviors: [
      "21.1K completion day",
      "Half Marathon checkpoint day",
      "21.1K continuous endpoint block",
    ],
    rejectedEndpointBehaviors: [
      "final half_readiness_marker without real selected-distance endpoint behavior",
      "final rest day",
      "final generic easy or long day with no 21.1K behavior",
    ],
    endpointGateId: "half_marathon_selected_distance_endpoint",
  },
  {
    family: "Marathon Completion",
    productMeaning:
      "Finish-focused selected-distance full marathon completion build with a long honest runway.",
    finalPromise: "Exact 42195m full-marathon completion endpoint without target-time claims.",
    acceptedEndpointBehaviors: [
      "42195m completion day",
      "full marathon completion endpoint",
      "finish-focused marathon endpoint",
    ],
    rejectedEndpointBehaviors: [
      "race-pace readiness",
      "target-time implication",
      "endpoint hidden only in metadata while rows stay generic",
    ],
    endpointGateId: "marathon_completion_selected_distance_endpoint",
  },
] as const;
