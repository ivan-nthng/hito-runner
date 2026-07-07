export {
  collectRunningPlanCompositionGrammarIssues,
  isRunningPlanCompositionDevelopmentTouch,
  resolveRunningPlanCompositionWeek,
  RUNNING_PLAN_COMPOSITION_DEVELOPMENT_TOUCH_VALUES,
  RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
  RUNNING_PLAN_COMPOSITION_LONG_RUN_ROLE_VALUES,
  RUNNING_PLAN_COMPOSITION_SIGNAL_VALUES,
  RUNNING_PLAN_WEEK_ARCHETYPE_VALUES,
  type ResolveRunningPlanCompositionWeekOptions,
  type RunningPlanCompositionDevelopmentTouch,
  type RunningPlanCompositionLoadContext,
  type RunningPlanCompositionLongRunRole,
  type RunningPlanCompositionSignal,
  type RunningPlanCompositionValidationRow,
  type RunningPlanCompositionWeek,
  type RunningPlanWeekArchetype,
  type ValidateRunningPlanCompositionGrammarOptions,
} from "@/lib/plan-creation-engine/composition-grammar";
export {
  resolveRunningPlanCutbackWeeks,
  resolveRunningPlanEndpointWeek,
  resolveRunningPlanHorizonSelection,
  resolveRunningPlanTaperWeek,
  RUNNING_PLAN_HORIZON_POLICY_VERSION,
  type RunningPlanHorizonSelection,
} from "@/lib/plan-creation-engine/horizon-policy";
export {
  resolveRunningPlanPreviewSegments,
  runningPlanPrescriptionIsExact,
  type RunningPlanPrescriptionLoadContext,
} from "@/lib/plan-creation-engine/prescription-resolver";
export {
  collectRunningPlanCanonicalPrescriptionGrammarIssues,
  collectRunningPlanPreviewPrescriptionGrammarIssues,
  RUNNING_PLAN_PRESCRIPTION_GRAMMAR_GATE_VERSION,
  summarizeRunningPlanCanonicalPrescriptionGrammar,
  summarizeRunningPlanPreviewPrescriptionGrammar,
  type RunningPlanPrescriptionGrammarSummary,
} from "@/lib/plan-creation-engine/prescription-quality";
export {
  getRunningPlanWorkoutDayTemplate,
  RUNNING_PLAN_SOURCE_MODEL,
  resolveRunningPlanEndpointTemplate,
} from "@/lib/plan-creation-engine/source-model";
export {
  collectRunnerFacingCanonicalRichnessIssues,
  collectRunnerFacingPreviewRichnessIssues,
  RUNNER_FACING_RICHNESS_GATE_VERSION,
  summarizeRunnerFacingCanonicalRichness,
  summarizeRunnerFacingPreviewRichness,
  type RunnerFacingRichnessCanonicalRow,
  type RunnerFacingRichnessInput,
  type RunnerFacingRichnessPreviewRow,
  type RunnerFacingRichnessSummary,
} from "@/lib/plan-creation-engine/runner-facing-richness";
export {
  collectSelectedDistanceEndpointIssues,
  resolveSelectedDistanceQualityFamily,
  selectedDistanceEndpointMainDistanceMeters,
  SELECTED_DISTANCE_ENDPOINT_IDENTITY,
  SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND,
  type SelectedDistanceEndpointIssue,
  type SelectedDistanceEndpointIssueCode,
  type SelectedDistanceEndpointProof,
  type SelectedDistanceEndpointRow,
} from "@/lib/plan-creation-engine/selected-distance-endpoint";
export {
  applyGeneratedPlanCoachFeasibilityToGoalIntent,
  evaluateGeneratedPlanCoachFeasibility,
  GENERATED_PLAN_COACH_CONTRACT_VERSION,
  type EvaluateGeneratedPlanCoachFeasibilityInput,
  type GeneratedPlanCoachFeasibilitySummary,
} from "@/lib/plan-creation-engine/generated-plan-coach-quality";
export {
  buildStructuredPlanGoalIntentInput,
  distanceFamilyForStructuredGoalType,
  normalizePlanGoalIntent,
  normalizedPlanGoalIntentSchema,
  planGoalIntentInputSchema,
  PLAN_GOAL_INTENT_CONTRACT_VERSION,
  PLAN_GOAL_INTENT_PRESET_DISTANCE_VALUES,
  type NormalizedPlanGoalIntent,
  type PlanGoalIntentInput,
} from "@/lib/plan-creation-engine/plan-goal-intent";
export {
  assertRunningPlanSourceModel,
  collectRunningPlanSourceModelIssues,
  summarizeRunningPlanSourceModel,
  validateRunningPlanSourceModel,
} from "@/lib/plan-creation-engine/invariants";
export type {
  BuildRunningPlanPreviewInput,
  RunningPlanPreviewCalendarRow,
  RunningPlanPreviewCalendarWorkoutDayKind,
  RunningPlanPreviewLoadContext,
  RunningPlanPreviewNormalizedInputSummary,
} from "@/lib/plan-creation-engine/preview-builder-shared";
export * from "@/lib/plan-creation-engine/source-types";
