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
    family: "Marathon Base",
    productMeaning:
      "Honest marathon durability and base-building block, not full race-peak preparation.",
    finalPromise: "Explicit marathon base endpoint with honest durability language.",
    acceptedEndpointBehaviors: [
      "Marathon Base endpoint",
      "durability endpoint long run",
      "steady durability endpoint with honest base language",
    ],
    rejectedEndpointBehaviors: [
      "false full-marathon race-readiness claim",
      "fake taper-peak language",
      "target-time implication",
    ],
    endpointGateId: "marathon_base_honest_endpoint",
  },
] as const;
