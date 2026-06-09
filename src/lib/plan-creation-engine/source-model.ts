import { endpointGates, endpointTemplates } from "@/lib/plan-creation-engine/endpoint-contracts";
import { distanceFamilyContracts } from "@/lib/plan-creation-engine/family-contracts";
import { forbiddenOutputGates } from "@/lib/plan-creation-engine/forbidden-output-gates";
import { builderInputContract, runnerLevels } from "@/lib/plan-creation-engine/input-contract";
import { metricAndHrPolicy } from "@/lib/plan-creation-engine/metric-policy";
import { scenarioRules } from "@/lib/plan-creation-engine/scenario-rules";
import type {
  RunningPlanDistanceFamily,
  RunningPlanEngineSourceModel,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import { RUNNING_PLAN_ENGINE_SOURCE_VERSION } from "@/lib/plan-creation-engine/source-types";
import { workoutDayTemplates } from "@/lib/plan-creation-engine/workout-templates";

export const RUNNING_PLAN_SOURCE_MODEL: RunningPlanEngineSourceModel = {
  sourceVersion: RUNNING_PLAN_ENGINE_SOURCE_VERSION,
  supportedDistanceFamilies: distanceFamilyContracts,
  runnerLevels,
  builderInputContract,
  metricAndHrPolicy,
  workoutDayTemplates,
  endpointTemplates,
  endpointGates,
  scenarioRules,
  forbiddenOutputGates,
} as const;

export function getRunningPlanWorkoutDayTemplate(kind: RunningPlanWorkoutDayKind) {
  if (kind === "final_selected_distance_day" || kind === "marathon_base_endpoint") {
    throw new Error(
      `Endpoint templates are family-specific; use resolveRunningPlanEndpointTemplate(...) for ${kind}.`,
    );
  }

  return RUNNING_PLAN_SOURCE_MODEL.workoutDayTemplates[kind];
}

export function resolveRunningPlanEndpointTemplate(family: RunningPlanDistanceFamily) {
  return RUNNING_PLAN_SOURCE_MODEL.endpointTemplates[family];
}
