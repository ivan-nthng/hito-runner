import { RUNNING_PLAN_SOURCE_MODEL } from "@/lib/plan-creation-engine/source-model";
import {
  RUNNING_PLAN_DISTANCE_FAMILY_VALUES,
  RUNNING_PLAN_DAYS_PER_WEEK_VALUES,
  RUNNING_PLAN_ENGINE_SOURCE_VERSION,
  RUNNING_PLAN_NON_ENDPOINT_WORKOUT_DAY_KIND_VALUES,
  RUNNING_PLAN_RUNNER_LEVEL_VALUES,
  type RunningPlanEndpointTemplate,
  type RunningPlanEngineSourceModel,
  type RunningPlanRange,
  type RunningPlanRepeatRecoveryPrescription,
  type RunningPlanRepeatWorkPrescription,
  type RunningPlanSegmentPrescription,
  type RunningPlanWorkoutDayTemplate,
} from "@/lib/plan-creation-engine/source-types";

export interface RunningPlanSourceModelInvariantSummary {
  distanceFamilyCount: number;
  runnerLevelCount: number;
  workoutTemplateCount: number;
  endpointTemplateCount: number;
  scenarioRuleCount: number;
  forbiddenGateCount: number;
}

export function validateRunningPlanSourceModel(
  model: RunningPlanEngineSourceModel = RUNNING_PLAN_SOURCE_MODEL,
) {
  const issues = collectRunningPlanSourceModelIssues(model);

  return {
    ok: issues.length === 0,
    issues,
    summary: summarizeRunningPlanSourceModel(model),
  };
}

export function assertRunningPlanSourceModel(
  model: RunningPlanEngineSourceModel = RUNNING_PLAN_SOURCE_MODEL,
) {
  const result = validateRunningPlanSourceModel(model);

  if (!result.ok) {
    throw new Error(
      `Running plan source model invariants failed:\n- ${result.issues.join("\n- ")}`,
    );
  }

  return result.summary;
}

export function collectRunningPlanSourceModelIssues(
  model: RunningPlanEngineSourceModel = RUNNING_PLAN_SOURCE_MODEL,
) {
  const issues: string[] = [];

  if (model.sourceVersion !== RUNNING_PLAN_ENGINE_SOURCE_VERSION) {
    issues.push(`Expected sourceVersion ${RUNNING_PLAN_ENGINE_SOURCE_VERSION}.`);
  }

  assertExactValues(
    issues,
    "supported distance families",
    model.supportedDistanceFamilies.map((contract) => contract.family),
    RUNNING_PLAN_DISTANCE_FAMILY_VALUES,
  );
  assertExactValues(
    issues,
    "runner levels",
    Object.keys(model.runnerLevels),
    RUNNING_PLAN_RUNNER_LEVEL_VALUES,
  );
  assertExactValues(
    issues,
    "non-endpoint workout day templates",
    Object.keys(model.workoutDayTemplates),
    RUNNING_PLAN_NON_ENDPOINT_WORKOUT_DAY_KIND_VALUES,
  );
  assertExactValues(
    issues,
    "endpoint templates",
    Object.keys(model.endpointTemplates),
    RUNNING_PLAN_DISTANCE_FAMILY_VALUES,
  );

  validateBuilderInputContract(model, issues);
  validateMetricAndHrPolicy(model, issues);
  validateEndpointGates(model, issues);
  validateEndpointTemplates(model, issues);
  validateWorkoutTemplates(model, issues);
  validateScenarioRules(model, issues);
  validateForbiddenOutputGates(model, issues);

  return issues;
}

export function summarizeRunningPlanSourceModel(
  model: RunningPlanEngineSourceModel = RUNNING_PLAN_SOURCE_MODEL,
): RunningPlanSourceModelInvariantSummary {
  return {
    distanceFamilyCount: model.supportedDistanceFamilies.length,
    runnerLevelCount: Object.keys(model.runnerLevels).length,
    workoutTemplateCount: Object.keys(model.workoutDayTemplates).length,
    endpointTemplateCount: Object.keys(model.endpointTemplates).length,
    scenarioRuleCount: model.scenarioRules.length,
    forbiddenGateCount: model.forbiddenOutputGates.length,
  };
}

function validateBuilderInputContract(model: RunningPlanEngineSourceModel, issues: string[]) {
  const activeInputFields = [
    ...model.builderInputContract.requiredFields.map((field) => field.field),
    ...model.builderInputContract.optionalFields.map((field) => field.field),
  ];
  const forbiddenActiveFields = [
    "watchAccess",
    "recent5kBenchmark",
    "targetTime",
    "personalHrZones",
  ];

  for (const forbiddenField of forbiddenActiveFields) {
    if (activeInputFields.includes(forbiddenField as never)) {
      issues.push(`Builder input contract must not include ${forbiddenField}.`);
    }
  }

  const deliberatelyAbsentFields = model.builderInputContract.deliberatelyAbsentFields.map(
    (field) => field.field,
  );
  const requiredAbsentFields = [
    "watchAccess",
    "noWatchOrNoApp",
    "recent5kBenchmark",
    "targetTime",
    "personalHrZones",
  ];

  for (const absentField of requiredAbsentFields) {
    if (!deliberatelyAbsentFields.includes(absentField)) {
      issues.push(`Builder input contract must explicitly mark ${absentField} as absent.`);
    }
  }

  if (model.builderInputContract.backendDefaults.daysPerWeek !== 3) {
    issues.push("Backend default days/week must stay conservative at 3.");
  }

  if (model.builderInputContract.backendDefaults.fixedRestDays.length !== 0) {
    issues.push("Backend default fixed rest days must be empty until the runner chooses them.");
  }
}

function validateMetricAndHrPolicy(model: RunningPlanEngineSourceModel, issues: string[]) {
  const policy = model.metricAndHrPolicy;

  if (!policy.watchAppExecutionAssumed || policy.watchAccessInputRequired) {
    issues.push("Metric policy must assume watch/app execution without requiring watch input.");
  }

  if (policy.noWatchSelectableNormalPath) {
    issues.push("Metric policy must not allow no-watch as a selectable normal path.");
  }

  if (policy.userProvidedBenchmarkRequiredInNormalPath) {
    issues.push("Metric policy must not require a user-provided benchmark in the normal path.");
  }

  if (policy.targetTimeUnlocksPace || policy.precisePaceAllowedInNormalPath) {
    issues.push("Metric policy must not allow target-time or normal-path precise pace truth.");
  }

  if (!policy.personalHrTruthRequiredForPersonalHrTargets) {
    issues.push("Personal HR targets must require personal HR-zone truth.");
  }

  if (policy.defaultHrZones.personalTruth) {
    issues.push("Hito default HR zones must not be personal HR truth.");
  }

  const requiredLabels = [
    "Hito default HR zones",
    "editable default zones",
    "not personal HR-zone truth",
  ];

  for (const label of requiredLabels) {
    if (!policy.defaultHrZones.labels.includes(label as never)) {
      issues.push(`Default HR policy must include label: ${label}.`);
    }
  }
}

function validateEndpointGates(model: RunningPlanEngineSourceModel, issues: string[]) {
  const tenK = model.endpointGates["10K"];
  const half = model.endpointGates["Half Marathon"];
  const marathonBase = model.endpointGates["Marathon Base"];

  if (tenK.endpointDistanceMeters !== 10_000) {
    issues.push("10K endpoint gate must require a 10000m endpoint.");
  }

  if (!tenK.requiredFinalWorkoutKinds.includes("final_selected_distance_day")) {
    issues.push("10K endpoint must require final_selected_distance_day.");
  }

  if (!tenK.rejectedFinalOutputs.includes("long_aerobic_run")) {
    issues.push("10K endpoint gate must reject generic long_aerobic_run final output.");
  }

  if (half.endpointDistanceMeters !== 21_100) {
    issues.push("Half Marathon endpoint gate must require a 21100m endpoint.");
  }

  if (!half.requiredFinalWorkoutKinds.includes("final_selected_distance_day")) {
    issues.push("Half endpoint must require final_selected_distance_day.");
  }

  if (!half.rejectedFinalOutputs.includes("half_readiness_marker")) {
    issues.push("Half endpoint gate must reject readiness-only half_readiness_marker output.");
  }

  if (marathonBase.requiredEndpointKind !== "marathon_base_endpoint") {
    issues.push("Marathon Base endpoint gate must require the marathon base endpoint kind.");
  }

  if (!marathonBase.requiredFinalWorkoutKinds.includes("marathon_base_endpoint")) {
    issues.push("Marathon Base endpoint must require marathon_base_endpoint workout kind.");
  }

  if (!marathonBase.mustNotClaimFullMarathonReadiness) {
    issues.push("Marathon Base endpoint must forbid full-marathon readiness claims.");
  }
}

function validateWorkoutTemplates(model: RunningPlanEngineSourceModel, issues: string[]) {
  for (const [kind, template] of Object.entries(model.workoutDayTemplates)) {
    validateTemplateStructure(kind, template, issues);
  }

  if ("final_selected_distance_day" in model.workoutDayTemplates) {
    issues.push("final_selected_distance_day must not live in generic workoutDayTemplates.");
  }

  if ("marathon_base_endpoint" in model.workoutDayTemplates) {
    issues.push("marathon_base_endpoint must not live in generic workoutDayTemplates.");
  }
}

function validateEndpointTemplates(model: RunningPlanEngineSourceModel, issues: string[]) {
  for (const [family, template] of Object.entries(model.endpointTemplates)) {
    validateTemplateStructure(`${family} endpoint`, template, issues);

    if (template.family !== family) {
      issues.push(`${family} endpoint template must declare matching family.`);
    }

    if (!template.allowedFamilies.includes(template.family)) {
      issues.push(`${family} endpoint template must allow only its owning family.`);
    }

    const gate = model.endpointGates[template.family];
    if (template.endpointGateId !== gate.gateId) {
      issues.push(`${family} endpoint template must bind to its endpoint gate.`);
    }

    if (!gate.requiredFinalWorkoutKinds.includes(template.kind)) {
      issues.push(`${family} endpoint template kind must match endpoint gate requirements.`);
    }
  }

  const tenK = model.endpointTemplates["10K"];
  const half = model.endpointTemplates["Half Marathon"];
  const marathonBase = model.endpointTemplates["Marathon Base"];

  if (tenK.kind !== "final_selected_distance_day") {
    issues.push("10K endpoint template must use final_selected_distance_day kind.");
  }
  if (tenK.endpointDistanceMeters !== 10_000) {
    issues.push("10K endpoint template must resolve endpointDistanceMeters to exactly 10000.");
  }
  if (!templateMainDistanceIsExactly(tenK, 10_000)) {
    issues.push("10K endpoint template main segment must be exactly 10000m.");
  }

  if (half.kind !== "final_selected_distance_day") {
    issues.push("Half endpoint template must use final_selected_distance_day kind.");
  }
  if (half.endpointDistanceMeters !== 21_100) {
    issues.push("Half endpoint template must resolve endpointDistanceMeters to exactly 21100.");
  }
  if (!templateMainDistanceIsExactly(half, 21_100)) {
    issues.push("Half endpoint template main segment must be exactly 21100m.");
  }

  if (marathonBase.kind !== "marathon_base_endpoint") {
    issues.push("Marathon Base endpoint template must use marathon_base_endpoint kind.");
  }
  if (marathonBase.endpointDistanceMeters !== null) {
    issues.push("Marathon Base endpoint template must not declare selected-distance meters.");
  }
  if (marathonBase.endpointBehavior !== "marathon_base_durability_endpoint") {
    issues.push("Marathon Base endpoint template must remain a durability/base endpoint.");
  }
  if (!marathonBase.mustNotClaimFullMarathonReadiness) {
    issues.push("Marathon Base endpoint template must forbid full-marathon readiness claims.");
  }
  if (templateHasDistanceMainSegment(marathonBase)) {
    issues.push("Marathon Base endpoint template must not use selected-distance race behavior.");
  }
}

function validateScenarioRules(model: RunningPlanEngineSourceModel, issues: string[]) {
  const scenarioKeys = new Set(
    model.scenarioRules.map((rule) => `${rule.family}:${rule.runnerLevel}`),
  );

  for (const family of RUNNING_PLAN_DISTANCE_FAMILY_VALUES) {
    for (const runnerLevel of RUNNING_PLAN_RUNNER_LEVEL_VALUES) {
      const key = `${family}:${runnerLevel}`;
      if (!scenarioKeys.has(key)) {
        issues.push(`Missing scenario rule for ${key}.`);
      }
    }
  }

  for (const rule of model.scenarioRules) {
    if (!RUNNING_PLAN_DISTANCE_FAMILY_VALUES.includes(rule.family)) {
      issues.push(`Scenario rule has unsupported family ${rule.family}.`);
    }

    if (!RUNNING_PLAN_RUNNER_LEVEL_VALUES.includes(rule.runnerLevel)) {
      issues.push(`Scenario rule has unsupported runner level ${rule.runnerLevel}.`);
    }

    for (const dayCount of rule.daysPerWeek) {
      if (!RUNNING_PLAN_DAYS_PER_WEEK_VALUES.includes(dayCount)) {
        issues.push(`Scenario rule ${rule.family}:${rule.runnerLevel} has unsupported days/week.`);
      }
    }

    if (rule.metricModeBias !== "structure_first_editable_default_hr_optional") {
      issues.push(`Scenario rule ${rule.family}:${rule.runnerLevel} must stay structure-first.`);
    }
  }
}

function validateForbiddenOutputGates(model: RunningPlanEngineSourceModel, issues: string[]) {
  const gateIds = model.forbiddenOutputGates.map((gate) => gate.gateId);
  const requiredGateIds = [
    "no_generic_selected_distance_endpoint",
    "no_readiness_only_half_endpoint",
    "no_rest_endpoint",
    "no_vague_effort_only_primary_prescription",
    "no_fake_precise_pace",
    "no_fake_personal_hr",
    "no_old_runner_level_labels",
    "no_5k_benchmark_normal_path_dependency",
    "no_watch_choice_gate",
    "no_target_time_normal_path",
  ];

  for (const gateId of requiredGateIds) {
    if (!gateIds.includes(gateId)) {
      issues.push(`Missing forbidden output gate ${gateId}.`);
    }
  }

  const endpointGate = model.forbiddenOutputGates.find(
    (gate) => gate.gateId === "no_generic_selected_distance_endpoint",
  );
  if (!endpointGate?.rejectedSignals.includes("final long_aerobic_run")) {
    issues.push("Forbidden gates must reject final generic long-run endpoints.");
  }

  const effortGate = model.forbiddenOutputGates.find(
    (gate) => gate.gateId === "no_vague_effort_only_primary_prescription",
  );
  if (!effortGate?.rejectedSignals.includes("Effort: threshold steady")) {
    issues.push("Forbidden gates must reject effort-primary workout output.");
  }
}

function validateTemplateStructure(
  kind: string,
  template: RunningPlanWorkoutDayTemplate | RunningPlanEndpointTemplate,
  issues: string[],
) {
  if (!template.watchExecutable || template.primaryContract !== "numeric_structure") {
    issues.push(`${kind} template must be watch-executable numeric structure.`);
  }

  if (template.cueRole !== "secondary_only") {
    issues.push(`${kind} template must keep cues secondary.`);
  }

  if (template.segments.length === 0) {
    issues.push(`${kind} template must define at least one segment.`);
  }

  for (const segment of template.segments) {
    if (!segmentHasNumericStructure(segment.primaryPrescription)) {
      issues.push(
        `${kind}.${segment.id} must carry numeric duration, distance, or repeat structure.`,
      );
    }

    if (
      segment.targetTruthMode !== "structure_only" &&
      segment.targetTruthMode !== "editable_default_hr"
    ) {
      issues.push(`${kind}.${segment.id} uses unsupported target truth mode.`);
    }
  }
}

function templateMainDistanceIsExactly(
  template: RunningPlanEndpointTemplate,
  distanceMeters: number,
) {
  const mainSegment = template.segments.find((segment) => segment.segmentRole === "main");

  if (!mainSegment || mainSegment.primaryPrescription.mode !== "distance") {
    return false;
  }

  return (
    mainSegment.primaryPrescription.distanceMeters.min === distanceMeters &&
    mainSegment.primaryPrescription.distanceMeters.max === distanceMeters
  );
}

function templateHasDistanceMainSegment(template: RunningPlanEndpointTemplate) {
  return template.segments.some(
    (segment) => segment.segmentRole === "main" && segment.primaryPrescription.mode === "distance",
  );
}

function segmentHasNumericStructure(prescription: RunningPlanSegmentPrescription) {
  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return rangeIsPositive(prescription.durationSeconds);
    case "distance":
    case "distance_with_default_hr_cap":
      return rangeIsPositive(prescription.distanceMeters);
    case "recovery_time":
      return rangeIsPositive(prescription.recoveryDurationSeconds);
    case "recovery_distance":
      return rangeIsPositive(prescription.recoveryDistanceMeters);
    case "free_run_with_cap":
      return (
        rangeIsPositive(prescription.durationSecondsOrDistanceMeters) &&
        prescription.explicitCap.length > 0
      );
    case "repeat":
      return (
        rangeIsPositive(prescription.repeatCount) &&
        repeatWorkHasNumericStructure(prescription.work) &&
        repeatRecoveryHasNumericStructure(prescription.recovery)
      );
  }
}

function repeatWorkHasNumericStructure(work: RunningPlanRepeatWorkPrescription) {
  if (work.mode === "time") {
    return rangeIsPositive(work.durationSeconds);
  }

  return rangeIsPositive(work.distanceMeters);
}

function repeatRecoveryHasNumericStructure(recovery: RunningPlanRepeatRecoveryPrescription) {
  if (recovery.mode === "recovery_time") {
    return rangeIsPositive(recovery.recoveryDurationSeconds);
  }

  return rangeIsPositive(recovery.recoveryDistanceMeters);
}

function rangeIsPositive(range: RunningPlanRange) {
  return (
    Number.isFinite(range.min) &&
    Number.isFinite(range.max) &&
    range.min > 0 &&
    range.max >= range.min
  );
}

function assertExactValues(
  issues: string[],
  label: string,
  actualValues: readonly string[],
  expectedValues: readonly string[],
) {
  const actual = [...actualValues].sort();
  const expected = [...expectedValues].sort();

  if (actual.length !== expected.length) {
    issues.push(`Expected ${expected.length} ${label}, got ${actual.length}.`);
    return;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      issues.push(`Expected ${label} [${expected.join(", ")}], got [${actual.join(", ")}].`);
      return;
    }
  }
}
