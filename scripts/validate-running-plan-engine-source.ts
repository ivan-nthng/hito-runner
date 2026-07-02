import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  RUNNING_PLAN_DISTANCE_FAMILY_VALUES,
  RUNNING_PLAN_RUNNER_LEVEL_VALUES,
  RUNNING_PLAN_SOURCE_MODEL,
  RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
  RUNNING_PLAN_WEEK_ARCHETYPE_VALUES,
  assertRunningPlanSourceModel,
  resolveRunningPlanCompositionWeek,
  type RunningPlanSegmentPrescription,
} from "../src/lib/plan-creation-engine";
import { findForbiddenRunnerFacingLanguageMatches } from "../src/lib/plan-creation-engine/forbidden-runner-facing-language";

function main() {
  const summary = assertRunningPlanSourceModel();

  validateAcceptedFamilyAndRunnerLevelContract();
  validateBuilderInputBoundary();
  validateWatchExecutableTemplates();
  validateEndpointGates();
  validateEndpointTemplates();
  validateMetricAndHrTruthBoundary();
  validateForbiddenOutputGates();
  validateCompositionGrammarContract();
  validateStaleSourceFilesRemainAbsent();

  console.log("Running plan engine source model invariants passed.", summary);
}

function validateAcceptedFamilyAndRunnerLevelContract() {
  assert.deepEqual(
    RUNNING_PLAN_SOURCE_MODEL.supportedDistanceFamilies.map((contract) => contract.family),
    [...RUNNING_PLAN_DISTANCE_FAMILY_VALUES],
    "Supported families must stay exactly 10K, Half Marathon, Marathon Base, and Marathon Completion.",
  );
  assert.deepEqual(
    Object.keys(RUNNING_PLAN_SOURCE_MODEL.runnerLevels),
    [...RUNNING_PLAN_RUNNER_LEVEL_VALUES],
    "Runner levels must stay exactly the accepted R1 ids.",
  );

  const scenarioKeys = new Set(
    RUNNING_PLAN_SOURCE_MODEL.scenarioRules.map((rule) => `${rule.family}:${rule.runnerLevel}`),
  );

  for (const family of RUNNING_PLAN_DISTANCE_FAMILY_VALUES) {
    for (const runnerLevel of RUNNING_PLAN_RUNNER_LEVEL_VALUES) {
      assert.ok(
        scenarioKeys.has(`${family}:${runnerLevel}`),
        `Missing scenario matrix coverage for ${family}:${runnerLevel}.`,
      );
    }
  }
}

function validateBuilderInputBoundary() {
  const contract = RUNNING_PLAN_SOURCE_MODEL.builderInputContract;
  const activeFieldNames = [
    ...contract.requiredFields.map((field) => String(field.field)),
    ...contract.optionalFields.map((field) => String(field.field)),
  ];
  const deliberatelyAbsentFields = contract.deliberatelyAbsentFields.map((field) => field.field);

  assert.ok(activeFieldNames.includes("age"), "Age must be a real builder input.");
  assert.ok(activeFieldNames.includes("heightCm"), "Height must be a real builder input.");
  assert.ok(activeFieldNames.includes("weightKg"), "Weight must be a real builder input.");
  assert.ok(activeFieldNames.includes("runnerLevel"), "Runner level must be a real builder input.");
  assert.ok(
    activeFieldNames.includes("distanceFamily"),
    "Selected distance family must be a real builder input.",
  );
  assert.ok(activeFieldNames.includes("daysPerWeek"), "Days/week must be represented.");
  assert.ok(activeFieldNames.includes("fixedRestDays"), "Fixed rest days must be represented.");
  assert.ok(
    activeFieldNames.includes("preferredLongRunDay"),
    "Preferred long-run day must be represented.",
  );
  assert.ok(
    activeFieldNames.includes("benchmarkPaceTruth"),
    "Optional benchmark-backed pace truth must be represented without being required.",
  );
  assert.ok(
    activeFieldNames.includes("planGoalIntent"),
    "Optional planGoalIntent must be represented without becoming a direct targetTime input.",
  );

  assert.ok(!activeFieldNames.includes("watchAccess"), "Watch access must not be a normal input.");
  assert.ok(
    !activeFieldNames.includes("recent5kBenchmark"),
    "Legacy raw recent5kBenchmark must not be the normal input owner.",
  );
  assert.ok(!activeFieldNames.includes("targetTime"), "Target time must not be a normal input.");
  assert.ok(
    !activeFieldNames.includes("personalHrZones"),
    "Personal HR zones must not be a normal input.",
  );

  assert.ok(
    deliberatelyAbsentFields.includes("watchAccess"),
    "Watch access absence must be explicit.",
  );
  assert.ok(
    deliberatelyAbsentFields.includes("targetTime"),
    "Direct targetTime absence must be explicit.",
  );
  assert.ok(
    deliberatelyAbsentFields.includes("personalHrZones"),
    "Personal HR-zone absence must be explicit.",
  );
}

function validateWatchExecutableTemplates() {
  for (const [kind, template] of Object.entries(RUNNING_PLAN_SOURCE_MODEL.workoutDayTemplates)) {
    assert.equal(template.watchExecutable, true, `${kind} must be watch-executable.`);
    assert.equal(
      template.primaryContract,
      "numeric_structure",
      `${kind} must use numeric structure as the primary contract.`,
    );
    assert.equal(template.cueRole, "secondary_only", `${kind} cues must stay secondary.`);
    assert.ok(template.segments.length > 0, `${kind} must define segments.`);

    for (const segment of template.segments) {
      assert.ok(
        segmentPrescriptionIsNumeric(segment.primaryPrescription),
        `${kind}.${segment.id} lacks numeric structure.`,
      );
      assertChildFirstRepeatPrescription(kind, segment.id, segment.primaryPrescription);
    }
  }

  assert.equal(
    "final_selected_distance_day" in RUNNING_PLAN_SOURCE_MODEL.workoutDayTemplates,
    false,
    "final_selected_distance_day must be resolved through family endpointTemplates, not generic workoutDayTemplates.",
  );

  assert.equal(
    "marathon_base_endpoint" in RUNNING_PLAN_SOURCE_MODEL.workoutDayTemplates,
    false,
    "marathon_base_endpoint must be resolved through family endpointTemplates, not generic workoutDayTemplates.",
  );

  const runnerFacingTemplates = {
    workoutDayTemplates: RUNNING_PLAN_SOURCE_MODEL.workoutDayTemplates,
    endpointTemplates: RUNNING_PLAN_SOURCE_MODEL.endpointTemplates,
  };
  assert.deepEqual(findForbiddenRunnerFacingLanguageMatches(runnerFacingTemplates), []);
}

function validateEndpointGates() {
  const tenKGate = RUNNING_PLAN_SOURCE_MODEL.endpointGates["10K"];
  const halfGate = RUNNING_PLAN_SOURCE_MODEL.endpointGates["Half Marathon"];
  const marathonGate = RUNNING_PLAN_SOURCE_MODEL.endpointGates["Marathon Base"];
  const marathonCompletionGate = RUNNING_PLAN_SOURCE_MODEL.endpointGates["Marathon Completion"];

  assert.equal(tenKGate.endpointDistanceMeters, 10_000);
  assert.ok(tenKGate.requiredFinalWorkoutKinds.includes("final_selected_distance_day"));
  assert.ok(tenKGate.rejectedFinalOutputs.includes("long_aerobic_run"));
  assert.ok(tenKGate.rejectedFinalOutputs.includes("rest_and_recovery"));

  assert.equal(halfGate.endpointDistanceMeters, 21_100);
  assert.ok(halfGate.requiredFinalWorkoutKinds.includes("final_selected_distance_day"));
  assert.ok(halfGate.rejectedFinalOutputs.includes("half_readiness_marker"));
  assert.ok(halfGate.rejectedFinalOutputs.includes("rest_and_recovery"));

  assert.equal(marathonGate.requiredEndpointKind, "marathon_base_endpoint");
  assert.ok(marathonGate.requiredFinalWorkoutKinds.includes("marathon_base_endpoint"));
  assert.equal(marathonGate.mustNotClaimFullMarathonReadiness, true);
  assert.ok(marathonGate.rejectedFinalOutputs.includes("target_time_endpoint"));

  assert.equal(marathonCompletionGate.requiredEndpointKind, "selected_distance_endpoint");
  assert.equal(marathonCompletionGate.endpointDistanceMeters, 42_195);
  assert.ok(
    marathonCompletionGate.requiredFinalWorkoutKinds.includes("final_selected_distance_day"),
  );
  assert.ok(marathonCompletionGate.rejectedFinalOutputs.includes("marathon_base_endpoint"));
  assert.ok(marathonCompletionGate.rejectedFinalOutputs.includes("target_time_endpoint"));
}

function validateEndpointTemplates() {
  const tenKTemplate = RUNNING_PLAN_SOURCE_MODEL.endpointTemplates["10K"];
  const halfTemplate = RUNNING_PLAN_SOURCE_MODEL.endpointTemplates["Half Marathon"];
  const marathonBaseTemplate = RUNNING_PLAN_SOURCE_MODEL.endpointTemplates["Marathon Base"];
  const marathonCompletionTemplate =
    RUNNING_PLAN_SOURCE_MODEL.endpointTemplates["Marathon Completion"];

  assert.equal(tenKTemplate.family, "10K");
  assert.equal(tenKTemplate.kind, "final_selected_distance_day");
  assert.equal(tenKTemplate.endpointDistanceMeters, 10_000);
  assert.equal(endpointMainDistanceMeters(tenKTemplate), 10_000);
  assert.deepEqual(tenKTemplate.allowedFamilies, ["10K"]);

  assert.equal(halfTemplate.family, "Half Marathon");
  assert.equal(halfTemplate.kind, "final_selected_distance_day");
  assert.equal(halfTemplate.endpointDistanceMeters, 21_100);
  assert.equal(endpointMainDistanceMeters(halfTemplate), 21_100);
  assert.deepEqual(halfTemplate.allowedFamilies, ["Half Marathon"]);

  assert.equal(marathonBaseTemplate.family, "Marathon Base");
  assert.equal(marathonBaseTemplate.kind, "marathon_base_endpoint");
  assert.equal(marathonBaseTemplate.endpointDistanceMeters, null);
  assert.equal(marathonBaseTemplate.endpointBehavior, "marathon_base_durability_endpoint");
  assert.equal(marathonBaseTemplate.mustNotClaimFullMarathonReadiness, true);
  assert.equal(endpointMainDistanceMeters(marathonBaseTemplate), null);
  assert.deepEqual(marathonBaseTemplate.allowedFamilies, ["Marathon Base"]);

  assert.equal(marathonCompletionTemplate.family, "Marathon Completion");
  assert.equal(marathonCompletionTemplate.kind, "final_selected_distance_day");
  assert.equal(marathonCompletionTemplate.endpointDistanceMeters, 42_195);
  assert.equal(
    marathonCompletionTemplate.endpointBehavior,
    "selected_distance_completion_or_checkpoint",
  );
  assert.equal(marathonCompletionTemplate.mustNotClaimFullMarathonReadiness, false);
  assert.equal(endpointMainDistanceMeters(marathonCompletionTemplate), 42_195);
  assert.deepEqual(marathonCompletionTemplate.allowedFamilies, ["Marathon Completion"]);
}

function validateMetricAndHrTruthBoundary() {
  const policy = RUNNING_PLAN_SOURCE_MODEL.metricAndHrPolicy;

  assert.equal(policy.watchAppExecutionAssumed, true);
  assert.equal(policy.watchAccessInputRequired, false);
  assert.equal(policy.noWatchSelectableNormalPath, false);
  assert.equal(policy.userProvidedBenchmarkRequiredInNormalPath, false);
  assert.equal(policy.targetTimeUnlocksPace, false);
  assert.equal(policy.precisePaceAllowedInNormalPath, false);
  assert.equal(policy.personalHrTruthRequiredForPersonalHrTargets, true);
  assert.equal(policy.defaultHrZones.personalTruth, false);
  assert.deepEqual(policy.defaultHrZones.labels, [
    "Hito default HR zones",
    "editable default zones",
    "not personal HR-zone truth",
  ]);
}

function validateForbiddenOutputGates() {
  const gates = RUNNING_PLAN_SOURCE_MODEL.forbiddenOutputGates;
  const gateIds = gates.map((gate) => gate.gateId);

  assert.ok(gateIds.includes("no_generic_selected_distance_endpoint"));
  assert.ok(gateIds.includes("no_readiness_only_half_endpoint"));
  assert.ok(gateIds.includes("no_rest_endpoint"));
  assert.ok(gateIds.includes("no_vague_effort_only_primary_prescription"));
  assert.ok(gateIds.includes("no_fake_precise_pace"));
  assert.ok(gateIds.includes("no_fake_personal_hr"));
  assert.ok(gateIds.includes("no_old_runner_level_labels"));
  assert.ok(gateIds.includes("no_5k_benchmark_normal_path_dependency"));
  assert.ok(gateIds.includes("no_watch_choice_gate"));
  assert.ok(gateIds.includes("no_goal_intent_as_executable_target"));
}

function validateCompositionGrammarContract() {
  assert.equal(RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION, "running_plan_composition_grammar_v1");
  assert.ok(RUNNING_PLAN_WEEK_ARCHETYPE_VALUES.includes("easy_support_week"));
  assert.ok(RUNNING_PLAN_WEEK_ARCHETYPE_VALUES.includes("long_run_durability_week"));
  assert.ok(RUNNING_PLAN_WEEK_ARCHETYPE_VALUES.includes("endpoint_week"));

  const supportedTenK = resolveRunningPlanCompositionWeek({
    family: "10K",
    runnerLevel: "sometimes_runs",
    loadContext: "standard",
    weekNumber: 5,
    horizonWeeks: 10,
  });
  assert.equal(supportedTenK.developmentTouch, "intervals");
  assert.equal(supportedTenK.archetype, "interval_week");
  assert.ok(supportedTenK.familySignals.includes("ten_k_repeatability"));

  const supportedHalf = resolveRunningPlanCompositionWeek({
    family: "Half Marathon",
    runnerLevel: "sometimes_runs",
    loadContext: "standard",
    weekNumber: 11,
    horizonWeeks: 14,
  });
  assert.equal(supportedHalf.developmentTouch, "progression");
  assert.ok(supportedHalf.familySignals.includes("half_sustained_support"));

  const conservativeHalfProgression = resolveRunningPlanCompositionWeek({
    family: "Half Marathon",
    runnerLevel: "runs_a_lot",
    loadContext: "conservative",
    weekNumber: 11,
    horizonWeeks: 14,
  });
  assert.equal(conservativeHalfProgression.developmentTouch, "progression");
  assert.ok(conservativeHalfProgression.familySignals.includes("half_sustained_support"));

  const conservativeHalfLongRun = resolveRunningPlanCompositionWeek({
    family: "Half Marathon",
    runnerLevel: "runs_a_lot",
    loadContext: "conservative",
    weekNumber: 22,
    horizonWeeks: 28,
  });
  assert.equal(conservativeHalfLongRun.longRunRole, "steady_finish");
  assert.ok(conservativeHalfLongRun.familySignals.includes("half_long_run_steady_finish"));

  const supportedMarathonBase = resolveRunningPlanCompositionWeek({
    family: "Marathon Base",
    runnerLevel: "professional_competitive",
    loadContext: "standard",
    weekNumber: 13,
    horizonWeeks: 24,
  });
  assert.equal(supportedMarathonBase.developmentTouch, "hills");
  assert.ok(supportedMarathonBase.familySignals.includes("marathon_base_hill_strength"));

  const supportedMarathonBaseSteadyFinish = resolveRunningPlanCompositionWeek({
    family: "Marathon Base",
    runnerLevel: "professional_competitive",
    loadContext: "standard",
    weekNumber: 17,
    horizonWeeks: 24,
  });
  assert.equal(supportedMarathonBaseSteadyFinish.longRunRole, "steady_finish");
  assert.ok(
    supportedMarathonBaseSteadyFinish.familySignals.includes("marathon_base_steady_finish"),
  );

  const conservativeMarathonBase = resolveRunningPlanCompositionWeek({
    family: "Marathon Base",
    runnerLevel: "runs_a_lot",
    loadContext: "conservative",
    weekNumber: 22,
    horizonWeeks: 32,
  });
  assert.equal(conservativeMarathonBase.developmentTouch, "steady_aerobic_run");
  assert.equal(conservativeMarathonBase.longRunRole, "support");
  assert.ok(conservativeMarathonBase.familySignals.includes("marathon_base_steady_support"));

  const beginnerMarathonBaseBridge = resolveRunningPlanCompositionWeek({
    family: "Marathon Base",
    runnerLevel: "beginner_new_runner",
    loadContext: "standard",
    weekNumber: 25,
    horizonWeeks: 40,
  });
  assert.equal(beginnerMarathonBaseBridge.developmentTouch, "steady_aerobic_run");
  assert.equal(beginnerMarathonBaseBridge.archetype, "steady_support_week");
  assert.ok(beginnerMarathonBaseBridge.familySignals.includes("marathon_base_steady_support"));

  const beginnerMarathonCompletionAdaptation = resolveRunningPlanCompositionWeek({
    family: "Marathon Completion",
    runnerLevel: "beginner_new_runner",
    loadContext: "standard",
    weekNumber: 2,
    horizonWeeks: 56,
  });
  assert.equal(beginnerMarathonCompletionAdaptation.developmentTouch, null);
  assert.equal(beginnerMarathonCompletionAdaptation.archetype, "adaptation_run_walk_week");

  const beginnerMarathonCompletionDurability = resolveRunningPlanCompositionWeek({
    family: "Marathon Completion",
    runnerLevel: "beginner_new_runner",
    loadContext: "standard",
    weekNumber: 31,
    horizonWeeks: 56,
  });
  assert.ok(
    beginnerMarathonCompletionDurability.familySignals.includes("marathon_completion_time_on_feet"),
  );
  assert.ok(
    beginnerMarathonCompletionDurability.familySignals.includes(
      "marathon_completion_long_run_durability",
    ),
  );

  const beginnerMarathonCompletionEndpoint = resolveRunningPlanCompositionWeek({
    family: "Marathon Completion",
    runnerLevel: "beginner_new_runner",
    loadContext: "standard",
    weekNumber: 56,
    horizonWeeks: 56,
  });
  assert.ok(
    beginnerMarathonCompletionEndpoint.familySignals.includes("marathon_completion_exact_endpoint"),
  );

  const supportedMarathonCompletionProgression = resolveRunningPlanCompositionWeek({
    family: "Marathon Completion",
    runnerLevel: "runs_a_lot",
    loadContext: "standard",
    weekNumber: 17,
    horizonWeeks: 28,
  });
  assert.equal(supportedMarathonCompletionProgression.developmentTouch, "progression");
  assert.equal(supportedMarathonCompletionProgression.archetype, "progression_support_week");
  assert.ok(
    supportedMarathonCompletionProgression.familySignals.includes(
      "marathon_completion_progression_support",
    ),
  );

  const conservativeTenKLateReminder = resolveRunningPlanCompositionWeek({
    family: "10K",
    runnerLevel: "sometimes_runs",
    loadContext: "conservative",
    weekNumber: 13,
    horizonWeeks: 20,
  });
  assert.equal(conservativeTenKLateReminder.developmentTouch, "tempo");
  assert.ok(conservativeTenKLateReminder.familySignals.includes("ten_k_tempo_support"));
}

function validateStaleSourceFilesRemainAbsent() {
  const staleSourceFiles = [
    "src/lib/plan-creation-engine/watch-executable-workout-doctrine.md",
    "src/lib/plan-creation-engine/watch-segment-prescription-model.csv",
    "src/lib/plan-creation-engine/coach-workout-day-examples.csv",
  ];

  for (const filePath of staleSourceFiles) {
    assert.equal(
      existsSync(resolve(process.cwd(), filePath)),
      false,
      `Stale unaccepted source file must remain absent: ${filePath}.`,
    );
  }
}

function segmentPrescriptionIsNumeric(prescription: RunningPlanSegmentPrescription) {
  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return rangeIsUsable(prescription.durationSeconds);
    case "distance":
    case "distance_with_default_hr_cap":
      return rangeIsUsable(prescription.distanceMeters);
    case "recovery_time":
      return rangeIsUsable(prescription.recoveryDurationSeconds);
    case "recovery_distance":
      return rangeIsUsable(prescription.recoveryDistanceMeters);
    case "free_run_with_cap":
      return (
        rangeIsUsable(prescription.durationSecondsOrDistanceMeters) &&
        Boolean(prescription.explicitCap)
      );
    case "repeat":
      return (
        rangeIsUsable(prescription.repeatCount) &&
        prescription.children.length > 0 &&
        prescription.children.every((child) =>
          child.prescription.mode === "time"
            ? rangeIsUsable(child.prescription.durationSeconds)
            : rangeIsUsable(child.prescription.distanceMeters),
        )
      );
  }
}

function assertChildFirstRepeatPrescription(
  kind: string,
  segmentId: string,
  prescription: RunningPlanSegmentPrescription,
) {
  if (prescription.mode !== "repeat") {
    return;
  }

  const record = prescription as Record<string, unknown>;
  assert.equal(
    "work" in record,
    false,
    `${kind}.${segmentId} must not use private repeat.work; use children[].`,
  );
  assert.equal(
    "recovery" in record,
    false,
    `${kind}.${segmentId} must not use private repeat.recovery; use children[].`,
  );
  assert.ok(prescription.children.length >= 2, `${kind}.${segmentId} repeat needs child blocks.`);
  for (const [index, child] of prescription.children.entries()) {
    assert.ok(child.role, `${kind}.${segmentId}.children[${index}] must keep a role.`);
    assert.ok(
      child.intensityLabel,
      `${kind}.${segmentId}.children[${index}] must keep child intensity semantics.`,
    );
  }
}

function endpointMainDistanceMeters(template: {
  segments: (typeof RUNNING_PLAN_SOURCE_MODEL.endpointTemplates)[keyof typeof RUNNING_PLAN_SOURCE_MODEL.endpointTemplates]["segments"];
}) {
  const mainSegment = template.segments.find((segment) => segment.segmentRole === "main");

  if (!mainSegment || mainSegment.primaryPrescription.mode !== "distance") {
    return null;
  }

  const distance = mainSegment.primaryPrescription.distanceMeters;

  return distance.min === distance.max ? distance.min : null;
}

function rangeIsUsable(range: { min: number; max: number }) {
  return (
    Number.isFinite(range.min) &&
    Number.isFinite(range.max) &&
    range.min > 0 &&
    range.max >= range.min
  );
}

main();
