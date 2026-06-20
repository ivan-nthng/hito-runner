import { assertAiFirstPlanBlueprintContracts } from "./ai-first-plan-blueprint-proof";
import { assertAiFirstPlanEnvelopeContracts } from "./ai-first-plan-envelope-proof";
import {
  withAiFirstPlanBlueprintEnvelopeDependencies,
  type AiFirstPlanBlueprintEnvelopeDependencies,
} from "./ai-first-plan-proof-shared";

export type { AiFirstPlanBlueprintEnvelopeDependencies } from "./ai-first-plan-proof-shared";
export { buildAiFirstPlanBlueprintFixture } from "./ai-first-plan-blueprint-proof";
export { buildBalancedHalfEnvelopeAuthoringInput } from "./ai-first-plan-envelope-proof";
export {
  buildAiFirstPlanAuthoringInput,
  buildLongHorizonMarathonAiFirstPlanAuthoringInput,
  countNonRestWorkouts,
  readAiFirstPlanReferenceFixture,
} from "./ai-first-plan-proof-shared";

export function assertAiFirstPlanBlueprintEnvelopeContracts(
  deps: AiFirstPlanBlueprintEnvelopeDependencies,
) {
  withAiFirstPlanBlueprintEnvelopeDependencies(deps, () => {
    assertAiFirstPlanBlueprintContracts();
    assertAiFirstPlanEnvelopeContracts();
  });
}
