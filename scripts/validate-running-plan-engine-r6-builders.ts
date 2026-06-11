import assert from "node:assert/strict";
import {
  buildHalfMarathonPlanPreviewDraft,
  buildMarathonBasePlanPreviewDraft,
  buildMarathonCompletionPlanPreviewDraft,
  HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND,
  resolveRunningPlanCutbackWeeks,
  RUNNING_PLAN_HORIZON_POLICY_VERSION,
  runningPlanPrescriptionIsExact,
  type HalfMarathonPlanCalendarRow,
  type HalfMarathonPlanPreviewDraft,
  type MarathonBasePlanCalendarRow,
  type MarathonBasePlanPreviewDraft,
  type MarathonCompletionPlanCalendarRow,
  type MarathonCompletionPlanPreviewDraft,
  type RunningPlanDaysPerWeek,
  type RunningPlanPreviewCalendarWorkoutDayKind,
  type RunningPlanPreviewLoadContext,
} from "../src/lib/plan-creation-engine";
import { findForbiddenRunnerFacingLanguageMatches } from "../src/lib/plan-creation-engine/forbidden-runner-facing-language";
import {
  HALF_MARATHON_ENDPOINT_DISTANCE_METERS,
  resolveHalfMarathonCutbackWeeks,
  validateHalfMarathonDiversityPolicy,
} from "../src/lib/plan-creation-engine/half-marathon-diversity-policy";
import { validateMarathonBaseDiversityPolicy } from "../src/lib/plan-creation-engine/marathon-base-diversity-policy";
import {
  MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
  validateMarathonCompletionDiversityPolicy,
} from "../src/lib/plan-creation-engine/marathon-completion-diversity-policy";
import { resolveMarathonCompletionCutbackWeeks } from "../src/lib/plan-creation-engine/marathon-completion-policy";

type R6CalendarRow =
  | HalfMarathonPlanCalendarRow
  | MarathonBasePlanCalendarRow
  | MarathonCompletionPlanCalendarRow;

function main() {
  const halfSometimes = validateHalfMarathonSometimesRuns();
  const halfHigherSupport = validateHalfMarathonHigherSupport();
  validateHalfMarathonConservativeRichness();
  const beginnerHalf = validateHalfMarathonBeginnerBridge();
  validateHalfMarathonBadGates(halfSometimes, halfHigherSupport);

  const marathonBase = validateMarathonBaseSupported();
  validateMarathonBaseSometimesRuns();
  validateMarathonBaseConservativeRichness();
  validateMarathonBaseBeginnerLongBase();
  validateMarathonBaseBadGates(marathonBase);

  const marathonCompletion = validateMarathonCompletionSupported();
  validateMarathonCompletionSometimesRuns();
  validateMarathonCompletionConservativeRichness();
  validateMarathonCompletionBeginnerAdaptation();
  validateMarathonCompletionBadGates(marathonCompletion);

  console.log("Running plan engine R6 builder checks passed.", {
    half: {
      sourceKind: halfSometimes.sourceKind,
      weeks: maxWeekNumber(halfSometimes.calendarRows),
      calendarRows: halfSometimes.calendarRows.length,
      nonRestRows: halfSometimes.calendarRows.filter((row) => !row.isRestDay).length,
      endpointDistanceMeters: halfSometimes.endpointProof.endpointDistanceMeters,
      finalDate: halfSometimes.endpointProof.finalDate,
    },
    beginnerHalf: {
      sourceKind: beginnerHalf.sourceKind,
      weeks: maxWeekNumber(beginnerHalf.calendarRows),
      calendarRows: beginnerHalf.calendarRows.length,
      nonRestRows: beginnerHalf.calendarRows.filter((row) => !row.isRestDay).length,
      endpointDistanceMeters: beginnerHalf.endpointProof.endpointDistanceMeters,
      finalDate: beginnerHalf.endpointProof.finalDate,
    },
    marathonBase: {
      sourceKind: marathonBase.sourceKind,
      weeks: maxWeekNumber(marathonBase.calendarRows),
      calendarRows: marathonBase.calendarRows.length,
      nonRestRows: marathonBase.calendarRows.filter((row) => !row.isRestDay).length,
      finalWorkoutDayKind: marathonBase.endpointProof.finalWorkoutDayKind,
      finalDate: marathonBase.endpointProof.finalDate,
    },
    marathonCompletion: {
      sourceKind: marathonCompletion.sourceKind,
      weeks: maxWeekNumber(marathonCompletion.calendarRows),
      calendarRows: marathonCompletion.calendarRows.length,
      nonRestRows: marathonCompletion.calendarRows.filter((row) => !row.isRestDay).length,
      endpointDistanceMeters: marathonCompletion.endpointProof.endpointDistanceMeters,
      finalDate: marathonCompletion.endpointProof.finalDate,
    },
  });
}

function validateHalfMarathonSometimesRuns() {
  const draft = buildHalfDraft("sometimes_runs");

  assert.equal(draft.sourceKind, HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.source_kind, HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.sourceStatus, "preview_ready");
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.callsOpenAi, false);
  assert.equal(draft.reviewSafety.confirmPathImplemented, false);
  assert.equal(draft.planFamily, "Half Marathon");
  assert.equal(draft.normalizedInputSummary.distanceFamily, "Half Marathon");
  assert.equal(draft.normalizedInputSummary.preferredLongRunDay, "Sunday");
  assert.deepEqual(draft.normalizedInputSummary.fixedRestDays, ["Wednesday", "Saturday"]);
  assert.deepEqual(draft.normalizedInputSummary.horizonSelection, {
    policyVersion: RUNNING_PLAN_HORIZON_POLICY_VERSION,
    horizonWeeks: 24,
    selectionReason: "standard_preferred_horizon",
  });
  assert.equal(
    draft.calendarRows.length,
    draft.normalizedInputSummary.horizonSelection.horizonWeeks * 7,
  );

  validateHalfEndpointExactness(draft.calendarRows);
  validateFixedRestDays(draft.calendarRows);
  validateLongRunDay(draft.calendarRows, [
    "long_run",
    "cutback_long_run",
    "final_selected_distance_day",
  ]);
  validateRecoveryAfterStressors(draft.calendarRows, ["long_run", "cutback_long_run", "intervals"]);
  validateCutbackWeeks(
    draft.calendarRows,
    resolveHalfMarathonCutbackWeeks({
      runnerLevel: draft.normalizedInputSummary.runnerLevel,
      loadContext: draft.normalizedInputSummary.loadContext,
      daysPerWeek: draft.normalizedInputSummary.daysPerWeek,
      horizonWeeks: maxWeekNumber(draft.calendarRows),
    }),
    "Half Marathon",
  );
  validatePenultimateWeek(
    draft.calendarRows,
    maxWeekNumber(draft.calendarRows) - 1,
    "Half Marathon",
  );
  validateSingleDevelopmentTouchPerWeek(draft.calendarRows, maxWeekNumber(draft.calendarRows));
  validateWatchExecutableSegments(draft.calendarRows);
  validateForbiddenMetricSignals(draft.calendarRows, draft.normalizedInputSummary);

  assertWorkoutKinds(draft.calendarRows, {
    includes: ["strides", "tempo", "intervals", "final_selected_distance_day"],
    excludes: ["threshold", "marathon_base_endpoint"],
    label: "Half Marathon sometimes_runs",
  });
  validateHalfSpecificDurabilitySignal(draft.calendarRows);
  validateLongRunDetailVariety(draft.calendarRows, "Half Marathon sometimes_runs");

  return draft;
}

function validateHalfMarathonHigherSupport() {
  const draft = buildHalfDraft("runs_a_lot");
  const professionalDraft = buildHalfDraft("professional_competitive");

  assertWorkoutKinds(draft.calendarRows, {
    includes: ["strides", "tempo", "threshold", "final_selected_distance_day"],
    excludes: ["marathon_base_endpoint"],
    label: "Half Marathon runs_a_lot",
  });
  assertWorkoutKinds(professionalDraft.calendarRows, {
    includes: ["strides", "tempo", "threshold", "intervals", "final_selected_distance_day"],
    excludes: ["marathon_base_endpoint"],
    label: "Half Marathon professional_competitive",
  });
  assert.notDeepEqual(
    developmentSequence(professionalDraft.calendarRows),
    developmentSequence(draft.calendarRows),
    "professional_competitive Half Marathon must be visibly distinct from runs_a_lot.",
  );
  validateRecoveryAfterStressors(draft.calendarRows, ["long_run", "cutback_long_run", "threshold"]);
  validateRecoveryAfterStressors(professionalDraft.calendarRows, [
    "long_run",
    "cutback_long_run",
    "threshold",
    "intervals",
  ]);
  validateLongRunDetailVariety(draft.calendarRows, "Half Marathon runs_a_lot");
  validateLongRunDetailVariety(
    professionalDraft.calendarRows,
    "Half Marathon professional_competitive",
  );
  validateHalfEndpointExactness(draft.calendarRows);
  validateHalfEndpointExactness(professionalDraft.calendarRows);

  return draft;
}

function validateHalfMarathonConservativeRichness() {
  const draft = buildConservativeHalfDraft("runs_a_lot");

  assert.equal(draft.normalizedInputSummary.loadContext, "conservative");
  assertWorkoutKinds(draft.calendarRows, {
    includes: ["strides", "tempo", "long_run", "cutback_long_run", "final_selected_distance_day"],
    excludes: ["threshold", "intervals", "marathon_base_endpoint"],
    label: "Conservative Half Marathon runs_a_lot",
  });
  validateHalfSpecificDurabilitySignal(draft.calendarRows);
  validateSegmentTextIncludes(
    draft.calendarRows,
    /half_marathon_durability_tempo|half_marathon_aerobic_durability|controlled_steady_finish/,
    "Conservative Half Marathon must preserve half-specific durability through soft segment anatomy.",
  );
}

function validateHalfMarathonBeginnerBridge() {
  const standardFiveDay = buildBeginnerHalfDraft({ daysPerWeek: 5, load: "standard" });
  const standardFourDay = buildBeginnerHalfDraft({ daysPerWeek: 4, load: "standard" });
  const standardThreeDay = buildBeginnerHalfDraft({ daysPerWeek: 3, load: "standard" });
  const conservativeFiveDay = buildBeginnerHalfDraft({ daysPerWeek: 5, load: "conservative" });
  const conservativeFourDay = buildBeginnerHalfDraft({ daysPerWeek: 4, load: "conservative" });
  const conservativeThreeDay = buildBeginnerHalfDraft({ daysPerWeek: 3, load: "conservative" });

  validateBeginnerHalfBridgeDraft(standardFiveDay, {
    daysPerWeek: 5,
    expectedWeeks: 24,
    expectedTempoLikeMinimum: 2,
    expectedStrideMinimum: 3,
    expectedCutbackMinimum: 4,
    label: "Beginner Half 5d standard",
  });
  validateBeginnerHalfBridgeDraft(standardFourDay, {
    daysPerWeek: 4,
    expectedWeeks: 28,
    expectedTempoLikeMinimum: 2,
    expectedStrideMinimum: 2,
    expectedCutbackMinimum: 4,
    label: "Beginner Half 4d standard",
  });
  validateBeginnerHalfBridgeDraft(standardThreeDay, {
    daysPerWeek: 3,
    expectedWeeks: 32,
    expectedTempoLikeMinimum: 1,
    expectedStrideMinimum: 2,
    expectedCutbackMinimum: 4,
    label: "Beginner Half 3d standard",
  });
  validateBeginnerHalfBridgeDraft(conservativeFiveDay, {
    daysPerWeek: 5,
    expectedWeeks: 28,
    expectedTempoLikeMinimum: 1,
    expectedStrideMinimum: 2,
    expectedCutbackMinimum: 4,
    label: "Beginner Half 5d conservative",
  });
  validateBeginnerHalfBridgeDraft(conservativeFourDay, {
    daysPerWeek: 4,
    expectedWeeks: 32,
    expectedTempoLikeMinimum: 1,
    expectedStrideMinimum: 2,
    expectedCutbackMinimum: 4,
    label: "Beginner Half 4d conservative",
  });
  validateBeginnerHalfBridgeDraft(conservativeThreeDay, {
    daysPerWeek: 3,
    expectedWeeks: 36,
    expectedTempoLikeMinimum: 0,
    expectedStrideMinimum: 2,
    expectedCutbackMinimum: 5,
    label: "Beginner Half 3d conservative",
  });

  const blockedLongRun = buildHalfMarathonPlanPreviewDraft({
    age: 32,
    heightCm: 170,
    weightKg: 68,
    runnerLevel: "beginner_new_runner",
    distanceFamily: "Half Marathon",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday", "Sunday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });
  assert.equal(blockedLongRun.ok, false, "Blocked long-run day must stay unavailable.");
  if (!blockedLongRun.ok) {
    assert.equal(blockedLongRun.unavailable.error.code, "long_run_day_blocked");
  }

  return standardFiveDay;
}

function validateHalfMarathonBadGates(
  sometimesDraft: HalfMarathonPlanPreviewDraft,
  higherSupportDraft: HalfMarathonPlanPreviewDraft,
) {
  const sometimesThresholdRows = replaceFirstWorkoutKind(
    sometimesDraft.calendarRows,
    "tempo",
    "threshold",
  );
  const sometimesThresholdIssues = validateHalfMarathonDiversityPolicy({
    runnerLevel: "sometimes_runs",
    loadContext: "standard",
    daysPerWeek: 5,
    rows: sometimesThresholdRows,
  });
  assertIssueIncludes(sometimesThresholdIssues, "must not include threshold");

  const higherSupportNoThresholdRows = replaceWorkoutKind(
    higherSupportDraft.calendarRows,
    "threshold",
    "tempo",
  );
  const higherSupportNoThresholdIssues = validateHalfMarathonDiversityPolicy({
    runnerLevel: "runs_a_lot",
    loadContext: "standard",
    daysPerWeek: 5,
    rows: higherSupportNoThresholdRows,
  });
  assertIssueIncludes(higherSupportNoThresholdIssues, "must include threshold");
}

function validateMarathonBaseSupported() {
  const draft = buildMarathonBaseDraft("runs_a_lot");
  const professionalDraft = buildMarathonBaseDraft("professional_competitive");

  assert.equal(draft.sourceKind, MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.source_kind, MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.sourceStatus, "preview_ready");
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.callsOpenAi, false);
  assert.equal(draft.reviewSafety.confirmPathImplemented, false);
  assert.equal(draft.planFamily, "Marathon Base");
  assert.equal(draft.normalizedInputSummary.distanceFamily, "Marathon Base");
  assert.deepEqual(draft.normalizedInputSummary.horizonSelection, {
    policyVersion: RUNNING_PLAN_HORIZON_POLICY_VERSION,
    horizonWeeks: 24,
    selectionReason: "standard_preferred_horizon",
  });
  assert.equal(
    draft.calendarRows.length,
    draft.normalizedInputSummary.horizonSelection.horizonWeeks * 7,
  );

  validateMarathonBaseEndpoint(draft.calendarRows);
  validateFixedRestDays(draft.calendarRows);
  validateLongRunDay(draft.calendarRows, [
    "long_run",
    "cutback_long_run",
    "marathon_base_endpoint",
  ]);
  validateRecoveryAfterStressors(draft.calendarRows, [
    "long_run",
    "cutback_long_run",
    "threshold",
    "hills",
  ]);
  validateCutbackWeeks(
    draft.calendarRows,
    resolveRunningPlanCutbackWeeks(maxWeekNumber(draft.calendarRows)),
    "Marathon Base",
  );
  validatePenultimateWeek(
    draft.calendarRows,
    maxWeekNumber(draft.calendarRows) - 1,
    "Marathon Base",
  );
  validateSingleDevelopmentTouchPerWeek(draft.calendarRows, maxWeekNumber(draft.calendarRows));
  validateWatchExecutableSegments(draft.calendarRows);
  validateForbiddenMetricSignals(draft.calendarRows, draft.normalizedInputSummary);
  validateNoMarathonOverclaim(draft.calendarRows);
  validateLongRunDetailVariety(draft.calendarRows, "Marathon Base runs_a_lot");

  assertWorkoutKinds(draft.calendarRows, {
    includes: [
      "strides",
      "tempo",
      "threshold",
      "long_run",
      "cutback_long_run",
      "marathon_base_endpoint",
    ],
    excludes: ["intervals", "final_selected_distance_day"],
    label: "Marathon Base runs_a_lot",
  });
  assertWorkoutKinds(professionalDraft.calendarRows, {
    includes: [
      "strides",
      "tempo",
      "threshold",
      "hills",
      "long_run",
      "cutback_long_run",
      "marathon_base_endpoint",
    ],
    excludes: ["intervals", "final_selected_distance_day"],
    label: "Marathon Base professional_competitive",
  });
  assert.notDeepEqual(
    developmentSequence(professionalDraft.calendarRows),
    developmentSequence(draft.calendarRows),
    "professional_competitive Marathon Base must be visibly distinct from runs_a_lot.",
  );
  validateNoMarathonOverclaim(professionalDraft.calendarRows);
  validateLongRunDetailVariety(
    professionalDraft.calendarRows,
    "Marathon Base professional_competitive",
  );

  return draft;
}

function validateMarathonBaseSometimesRuns() {
  const draft = buildMarathonBaseDraft("sometimes_runs");

  assertWorkoutKinds(draft.calendarRows, {
    includes: ["strides", "tempo", "long_run", "cutback_long_run", "marathon_base_endpoint"],
    excludes: ["threshold", "intervals", "final_selected_distance_day"],
    label: "Marathon Base sometimes_runs",
  });
  validateNoMarathonOverclaim(draft.calendarRows);
  validateLongRunDetailVariety(draft.calendarRows, "Marathon Base sometimes_runs");
}

function validateMarathonBaseConservativeRichness() {
  const draft = buildConservativeMarathonBaseDraft("runs_a_lot");

  assert.equal(draft.normalizedInputSummary.loadContext, "conservative");
  assertWorkoutKinds(draft.calendarRows, {
    includes: ["strides", "tempo", "long_run", "cutback_long_run", "marathon_base_endpoint"],
    excludes: ["threshold", "intervals", "final_selected_distance_day"],
    label: "Conservative Marathon Base runs_a_lot",
  });
  validateSegmentTextIncludes(
    draft.calendarRows,
    /marathon_base_time_on_feet|durability_steady_finish/,
    "Conservative Marathon Base must preserve time-on-feet or steady-finish long-run identity.",
  );
}

function validateMarathonBaseBeginnerLongBase() {
  const standardDraft = buildMarathonBaseDraft("beginner_new_runner");
  const conservativeDraft = buildConservativeMarathonBaseDraft("beginner_new_runner");

  validateBeginnerMarathonBaseDraft(standardDraft, {
    expectedWeeks: 24,
    selectionReason: "beginner_auto_extended_horizon",
    label: "Beginner Marathon Base standard",
  });
  validateBeginnerMarathonBaseDraft(conservativeDraft, {
    expectedWeeks: 32,
    selectionReason: "conservative_auto_extended_horizon",
    label: "Beginner Marathon Base conservative",
  });
}

function validateMarathonBaseBadGates(draft: MarathonBasePlanPreviewDraft) {
  const intervalRows = replaceFirstWorkoutKind(draft.calendarRows, "tempo", "intervals");
  const intervalIssues = validateMarathonBaseDiversityPolicy({
    runnerLevel: "runs_a_lot",
    loadContext: "standard",
    rows: intervalRows,
  });
  assertIssueIncludes(intervalIssues, "must not include intervals");

  const selectedEndpointRows = replaceFirstWorkoutKind(
    draft.calendarRows,
    "marathon_base_endpoint",
    "final_selected_distance_day",
  );
  const selectedEndpointIssues = validateMarathonBaseDiversityPolicy({
    runnerLevel: "runs_a_lot",
    loadContext: "standard",
    rows: selectedEndpointRows,
  });
  assertIssueIncludes(selectedEndpointIssues, "must not use final_selected_distance_day");
}

function validateMarathonCompletionSupported() {
  const draft = buildMarathonCompletionDraft("runs_a_lot");
  const professionalDraft = buildMarathonCompletionDraft("professional_competitive");

  assert.equal(draft.sourceKind, MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.source_kind, MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.sourceStatus, "preview_ready");
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.callsOpenAi, false);
  assert.equal(draft.reviewSafety.confirmPathImplemented, false);
  assert.equal(draft.planFamily, "Marathon Completion");
  assert.equal(draft.normalizedInputSummary.distanceFamily, "Marathon Completion");
  assert.deepEqual(draft.normalizedInputSummary.horizonSelection, {
    policyVersion: RUNNING_PLAN_HORIZON_POLICY_VERSION,
    horizonWeeks: 28,
    selectionReason: "standard_preferred_horizon",
  });
  assert.equal(
    draft.calendarRows.length,
    draft.normalizedInputSummary.horizonSelection.horizonWeeks * 7,
  );

  validateMarathonCompletionEndpoint(draft.calendarRows);
  validateFixedRestDays(draft.calendarRows);
  validateLongRunDay(draft.calendarRows, [
    "long_run",
    "cutback_long_run",
    "final_selected_distance_day",
  ]);
  validateRecoveryAfterStressors(draft.calendarRows, [
    "long_run",
    "cutback_long_run",
    "progression",
    "tempo",
  ]);
  validateCutbackWeeks(
    draft.calendarRows,
    resolveMarathonCompletionCutbackWeeks(maxWeekNumber(draft.calendarRows)),
    "Marathon Completion",
  );
  validatePenultimateWeek(
    draft.calendarRows,
    maxWeekNumber(draft.calendarRows) - 1,
    "Marathon Completion",
  );
  validateSingleDevelopmentTouchPerWeek(draft.calendarRows, maxWeekNumber(draft.calendarRows));
  validateWatchExecutableSegments(draft.calendarRows);
  validateForbiddenMetricSignals(draft.calendarRows, draft.normalizedInputSummary);
  validateNoMarathonCompletionRaceOverclaim(draft.calendarRows);
  validateLongRunDetailVariety(draft.calendarRows, "Marathon Completion runs_a_lot");

  assertWorkoutKinds(draft.calendarRows, {
    includes: [
      "strides",
      "steady_aerobic_run",
      "progression",
      "long_run",
      "cutback_long_run",
      "final_selected_distance_day",
    ],
    excludes: ["threshold", "intervals", "hills", "marathon_base_endpoint"],
    label: "Marathon Completion runs_a_lot",
  });
  assertWorkoutKinds(professionalDraft.calendarRows, {
    includes: [
      "strides",
      "steady_aerobic_run",
      "progression",
      "long_run",
      "cutback_long_run",
      "final_selected_distance_day",
    ],
    excludes: ["threshold", "intervals", "hills", "marathon_base_endpoint"],
    label: "Marathon Completion professional_competitive",
  });
  assert.notDeepEqual(
    developmentSequence(professionalDraft.calendarRows),
    developmentSequence(draft.calendarRows),
    "professional_competitive Marathon Completion must be visibly distinct from runs_a_lot.",
  );
  validateNoMarathonCompletionRaceOverclaim(professionalDraft.calendarRows);
  validateLongRunDetailVariety(
    professionalDraft.calendarRows,
    "Marathon Completion professional_competitive",
  );

  return draft;
}

function validateMarathonCompletionSometimesRuns() {
  const draft = buildMarathonCompletionDraft("sometimes_runs");

  assertWorkoutKinds(draft.calendarRows, {
    includes: [
      "strides",
      "steady_aerobic_run",
      "progression",
      "long_run",
      "cutback_long_run",
      "final_selected_distance_day",
    ],
    excludes: ["threshold", "intervals", "hills", "marathon_base_endpoint"],
    label: "Marathon Completion sometimes_runs",
  });
  validateMarathonCompletionEndpoint(draft.calendarRows);
  validateNoMarathonCompletionRaceOverclaim(draft.calendarRows);
  validateLongRunDetailVariety(draft.calendarRows, "Marathon Completion sometimes_runs");
  validateSegmentTextIncludes(
    draft.calendarRows,
    /marathon_completion_time_on_feet|marathon_completion_long_run_durability/,
    "Marathon Completion sometimes_runs must preserve completion durability anatomy.",
  );
}

function validateMarathonCompletionConservativeRichness() {
  const draft = buildConservativeMarathonCompletionDraft("runs_a_lot");

  assert.equal(draft.normalizedInputSummary.loadContext, "conservative");
  assertWorkoutKinds(draft.calendarRows, {
    includes: [
      "strides",
      "steady_aerobic_run",
      "progression",
      "long_run",
      "cutback_long_run",
      "final_selected_distance_day",
    ],
    excludes: ["threshold", "intervals", "hills", "marathon_base_endpoint"],
    label: "Conservative Marathon Completion runs_a_lot",
  });
  validateMarathonCompletionEndpoint(draft.calendarRows);
  validateNoMarathonCompletionRaceOverclaim(draft.calendarRows);
  validateSegmentTextIncludes(
    draft.calendarRows,
    /marathon_completion_time_on_feet|marathon_completion_long_run_durability|marathon_completion_steady_finish/,
    "Conservative Marathon Completion must preserve completion durability without hard intensity.",
  );
}

function validateMarathonCompletionBeginnerAdaptation() {
  const standardDraft = buildMarathonCompletionDraft("beginner_new_runner");
  const conservativeDraft = buildConservativeMarathonCompletionDraft("beginner_new_runner");

  validateBeginnerMarathonCompletionDraft(standardDraft, {
    expectedWeeks: 56,
    selectionReason: "beginner_auto_extended_horizon",
    label: "Beginner Marathon Completion standard",
  });
  validateBeginnerMarathonCompletionDraft(conservativeDraft, {
    expectedWeeks: 68,
    selectionReason: "conservative_auto_extended_horizon",
    label: "Beginner Marathon Completion conservative",
  });
}

function validateMarathonCompletionBadGates(draft: MarathonCompletionPlanPreviewDraft) {
  const intervalRows = replaceFirstWorkoutKind(draft.calendarRows, "progression", "intervals");
  const intervalIssues = validateMarathonCompletionDiversityPolicy({
    runnerLevel: "runs_a_lot",
    loadContext: "standard",
    daysPerWeek: 5,
    rows: intervalRows,
  });
  assertIssueIncludes(intervalIssues, "must not include intervals");

  const baseEndpointRows = replaceFirstWorkoutKind(
    draft.calendarRows,
    "final_selected_distance_day",
    "marathon_base_endpoint",
  );
  const baseEndpointIssues = validateMarathonCompletionDiversityPolicy({
    runnerLevel: "runs_a_lot",
    loadContext: "standard",
    daysPerWeek: 5,
    rows: baseEndpointRows,
  });
  assertIssueIncludes(baseEndpointIssues, "must not include marathon_base_endpoint");

  const beginnerTempoRows = replaceFirstWorkoutKind(
    buildMarathonCompletionDraft("beginner_new_runner").calendarRows,
    "strides",
    "tempo",
  );
  const beginnerTempoIssues = validateMarathonCompletionDiversityPolicy({
    runnerLevel: "beginner_new_runner",
    loadContext: "standard",
    daysPerWeek: 5,
    rows: beginnerTempoRows,
  });
  assertIssueIncludes(
    beginnerTempoIssues,
    "Beginner Marathon Completion preview must not include tempo",
  );
}

function buildHalfDraft(
  runnerLevel: "sometimes_runs" | "runs_a_lot" | "professional_competitive",
): HalfMarathonPlanPreviewDraft {
  const result = buildHalfMarathonPlanPreviewDraft({
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel,
    distanceFamily: "Half Marathon",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, true, `${runnerLevel} Half Marathon fixture must build.`);
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  return result.draft;
}

function buildConservativeHalfDraft(
  runnerLevel: "sometimes_runs" | "runs_a_lot" | "professional_competitive",
): HalfMarathonPlanPreviewDraft {
  const result = buildHalfMarathonPlanPreviewDraft({
    age: 58,
    heightCm: 176,
    weightKg: 96,
    runnerLevel,
    distanceFamily: "Half Marathon",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, true, `${runnerLevel} conservative Half Marathon fixture must build.`);
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  return result.draft;
}

function buildBeginnerHalfDraft({
  daysPerWeek,
  load,
}: {
  daysPerWeek: RunningPlanDaysPerWeek;
  load: RunningPlanPreviewLoadContext;
}): HalfMarathonPlanPreviewDraft {
  const result = buildHalfMarathonPlanPreviewDraft({
    age: load === "conservative" ? 58 : 32,
    heightCm: load === "conservative" ? 176 : 170,
    weightKg: load === "conservative" ? 96 : 68,
    runnerLevel: "beginner_new_runner",
    distanceFamily: "Half Marathon",
    daysPerWeek,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(
    result.ok,
    true,
    `beginner_new_runner ${daysPerWeek}d ${load} Half Marathon fixture must build.`,
  );
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  return result.draft;
}

function buildMarathonBaseDraft(
  runnerLevel: "beginner_new_runner" | "sometimes_runs" | "runs_a_lot" | "professional_competitive",
): MarathonBasePlanPreviewDraft {
  const result = buildMarathonBasePlanPreviewDraft({
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel,
    distanceFamily: "Marathon Base",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, true, `${runnerLevel} Marathon Base fixture must build.`);
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  return result.draft;
}

function buildConservativeMarathonBaseDraft(
  runnerLevel: "beginner_new_runner" | "sometimes_runs" | "runs_a_lot" | "professional_competitive",
): MarathonBasePlanPreviewDraft {
  const result = buildMarathonBasePlanPreviewDraft({
    age: 58,
    heightCm: 176,
    weightKg: 96,
    runnerLevel,
    distanceFamily: "Marathon Base",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, true, `${runnerLevel} conservative Marathon Base fixture must build.`);
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  return result.draft;
}

function buildMarathonCompletionDraft(
  runnerLevel: "beginner_new_runner" | "sometimes_runs" | "runs_a_lot" | "professional_competitive",
): MarathonCompletionPlanPreviewDraft {
  const result = buildMarathonCompletionPlanPreviewDraft({
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel,
    distanceFamily: "Marathon Completion",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, true, `${runnerLevel} Marathon Completion fixture must build.`);
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  return result.draft;
}

function buildConservativeMarathonCompletionDraft(
  runnerLevel: "beginner_new_runner" | "sometimes_runs" | "runs_a_lot" | "professional_competitive",
): MarathonCompletionPlanPreviewDraft {
  const result = buildMarathonCompletionPlanPreviewDraft({
    age: 58,
    heightCm: 176,
    weightKg: 96,
    runnerLevel,
    distanceFamily: "Marathon Completion",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(
    result.ok,
    true,
    `${runnerLevel} conservative Marathon Completion fixture must build.`,
  );
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  return result.draft;
}

function validateBeginnerMarathonBaseDraft(
  draft: MarathonBasePlanPreviewDraft,
  {
    expectedWeeks,
    selectionReason,
    label,
  }: {
    expectedWeeks: number;
    selectionReason: "beginner_auto_extended_horizon" | "conservative_auto_extended_horizon";
    label: string;
  },
) {
  const rows = draft.calendarRows;
  const nonRestRows = rows.filter((row) => !row.isRestDay);

  assert.equal(draft.sourceKind, MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.sourceStatus, "preview_ready");
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.callsOpenAi, false);
  assert.equal(draft.normalizedInputSummary.runnerLevel, "beginner_new_runner");
  assert.equal(draft.normalizedInputSummary.horizonSelection.horizonWeeks, expectedWeeks);
  assert.equal(
    draft.normalizedInputSummary.horizonSelection.policyVersion,
    RUNNING_PLAN_HORIZON_POLICY_VERSION,
  );
  assert.equal(draft.normalizedInputSummary.horizonSelection.selectionReason, selectionReason);
  assert.equal(rows.length, expectedWeeks * 7, `${label} calendar row count mismatch.`);
  assert.equal(
    nonRestRows.length,
    expectedWeeks * draft.normalizedInputSummary.daysPerWeek,
    `${label} non-rest row count mismatch.`,
  );

  validateMarathonBaseEndpoint(rows);
  validateFixedRestDays(rows);
  validateLongRunDay(rows, ["long_run", "cutback_long_run", "marathon_base_endpoint"]);
  validateRecoveryAfterStressors(rows, ["long_run", "cutback_long_run"]);
  validateCutbackWeeks(rows, resolveRunningPlanCutbackWeeks(expectedWeeks), label);
  validatePenultimateWeek(rows, expectedWeeks - 1, label);
  validateSingleDevelopmentTouchPerWeek(rows, expectedWeeks);
  validateWatchExecutableSegments(rows);
  validateForbiddenMetricSignals(rows, draft.normalizedInputSummary);
  validateNoMarathonOverclaim(rows);
  validateLongRunDetailVariety(rows, label);
  validateSegmentTextIncludes(
    rows,
    /marathon_base_time_on_feet|marathon_base_steady_finish|marathon_base_honest_endpoint/,
    `${label} must preserve marathon-base durability without full-marathon promise.`,
  );
  assertWorkoutKinds(rows, {
    includes: ["long_run", "cutback_long_run", "marathon_base_endpoint"],
    excludes: ["tempo", "threshold", "intervals", "hills", "final_selected_distance_day"],
    label,
  });
}

function validateBeginnerMarathonCompletionDraft(
  draft: MarathonCompletionPlanPreviewDraft,
  {
    expectedWeeks,
    selectionReason,
    label,
  }: {
    expectedWeeks: number;
    selectionReason: "beginner_auto_extended_horizon" | "conservative_auto_extended_horizon";
    label: string;
  },
) {
  const rows = draft.calendarRows;
  const nonRestRows = rows.filter((row) => !row.isRestDay);

  assert.equal(draft.sourceKind, MARATHON_COMPLETION_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.sourceStatus, "preview_ready");
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.callsOpenAi, false);
  assert.equal(draft.normalizedInputSummary.runnerLevel, "beginner_new_runner");
  assert.equal(draft.normalizedInputSummary.horizonSelection.horizonWeeks, expectedWeeks);
  assert.equal(
    draft.normalizedInputSummary.horizonSelection.policyVersion,
    RUNNING_PLAN_HORIZON_POLICY_VERSION,
  );
  assert.equal(draft.normalizedInputSummary.horizonSelection.selectionReason, selectionReason);
  assert.equal(rows.length, expectedWeeks * 7, `${label} calendar row count mismatch.`);
  assert.equal(
    nonRestRows.length,
    expectedWeeks * draft.normalizedInputSummary.daysPerWeek,
    `${label} non-rest row count mismatch.`,
  );

  validateMarathonCompletionEndpoint(rows);
  validateFixedRestDays(rows);
  validateLongRunDay(rows, ["long_run", "cutback_long_run", "final_selected_distance_day"]);
  validateRecoveryAfterStressors(rows, ["long_run", "cutback_long_run"]);
  validateCutbackWeeks(rows, resolveMarathonCompletionCutbackWeeks(expectedWeeks), label);
  validatePenultimateWeek(rows, expectedWeeks - 1, label);
  validateSingleDevelopmentTouchPerWeek(rows, expectedWeeks);
  validateWatchExecutableSegments(rows);
  validateForbiddenMetricSignals(rows, draft.normalizedInputSummary);
  validateNoMarathonCompletionRaceOverclaim(rows);
  validateLongRunDetailVariety(rows, label);
  validateSegmentTextIncludes(
    rows,
    /marathon_completion_run_walk_adaptation|run\/walk/i,
    `${label} must include Marathon Completion run-walk adaptation evidence.`,
  );
  validateSegmentTextIncludes(
    rows,
    /marathon_completion_time_on_feet|marathon_completion_long_run_durability|marathon_completion_exact_endpoint/,
    `${label} must include completion-specific durability and exact endpoint anatomy.`,
  );
  assertWorkoutKinds(rows, {
    includes: [
      "long_run",
      "cutback_long_run",
      "strides",
      "steady_aerobic_run",
      "final_selected_distance_day",
    ],
    excludes: ["progression", "tempo", "threshold", "intervals", "hills", "marathon_base_endpoint"],
    label,
  });
}

function validateBeginnerHalfBridgeDraft(
  draft: HalfMarathonPlanPreviewDraft,
  {
    daysPerWeek,
    expectedWeeks,
    expectedTempoLikeMinimum,
    expectedStrideMinimum,
    expectedCutbackMinimum,
    label,
  }: {
    daysPerWeek: RunningPlanDaysPerWeek;
    expectedWeeks: number;
    expectedTempoLikeMinimum: number;
    expectedStrideMinimum: number;
    expectedCutbackMinimum: number;
    label: string;
  },
) {
  const rows = draft.calendarRows;
  const nonRestRows = rows.filter((row) => !row.isRestDay);

  assert.equal(draft.sourceKind, HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.sourceStatus, "preview_ready");
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.callsOpenAi, false);
  assert.equal(draft.normalizedInputSummary.runnerLevel, "beginner_new_runner");
  assert.equal(draft.normalizedInputSummary.daysPerWeek, daysPerWeek);
  assert.equal(maxWeekNumber(rows), expectedWeeks, `${label} week count mismatch.`);
  assert.equal(rows.length, expectedWeeks * 7, `${label} calendar row count mismatch.`);
  assert.equal(
    nonRestRows.length,
    expectedWeeks * daysPerWeek,
    `${label} non-rest row count mismatch.`,
  );

  validateHalfEndpointExactness(rows);
  validateFixedRestDays(rows);
  validateLongRunDay(rows, ["long_run", "cutback_long_run", "final_selected_distance_day"]);
  validateRecoveryAfterStressors(rows, ["long_run", "cutback_long_run"]);
  validateCutbackWeeks(
    rows,
    resolveHalfMarathonCutbackWeeks({
      runnerLevel: "beginner_new_runner",
      loadContext: draft.normalizedInputSummary.loadContext,
      daysPerWeek,
      horizonWeeks: expectedWeeks,
    }),
    label,
  );
  validatePenultimateWeek(rows, expectedWeeks - 1, label);
  validateSingleDevelopmentTouchPerWeek(rows, expectedWeeks);
  validateWatchExecutableSegments(rows);
  validateForbiddenMetricSignals(rows, draft.normalizedInputSummary);
  validateLongRunDetailVariety(rows, label);
  validateSegmentTextIncludes(
    rows,
    /beginner_run_walk_adaptation|run-walk/i,
    `${label} must include run-walk adaptation evidence.`,
  );
  validateSegmentTextIncludes(
    rows,
    /half_marathon_aerobic_durability|half_marathon_endurance_base/,
    `${label} must include half-marathon durability long-run anatomy.`,
  );

  assertWorkoutKinds(rows, {
    includes: ["long_run", "cutback_long_run", "strides", "final_selected_distance_day"],
    excludes: ["threshold", "intervals", "hills", "marathon_base_endpoint"],
    label,
  });
  assert.ok(
    rows.filter((row) => row.workoutDayKind === "strides").length >= expectedStrideMinimum,
    `${label} must include at least ${expectedStrideMinimum} strides weeks.`,
  );
  assert.ok(
    rows.filter((row) => row.workoutDayKind === "tempo").length >= expectedTempoLikeMinimum,
    `${label} must include at least ${expectedTempoLikeMinimum} tempo-like durability weeks.`,
  );
  assert.ok(
    rows.filter((row) => row.workoutDayKind === "cutback_long_run").length >=
      expectedCutbackMinimum,
    `${label} must include at least ${expectedCutbackMinimum} cutback long runs.`,
  );
}

function validateHalfEndpointExactness(rows: readonly HalfMarathonPlanCalendarRow[]) {
  const finalNonRestRow = rows.filter((row) => !row.isRestDay).at(-1);
  assert.ok(finalNonRestRow, "Half preview must include non-rest rows.");
  assert.equal(finalNonRestRow.workoutDayKind, "final_selected_distance_day");
  assert.equal(finalNonRestRow.endpointDistanceMeters, HALF_MARATHON_ENDPOINT_DISTANCE_METERS);

  const mainSegment = finalNonRestRow.segments.find((segment) => segment.segmentRole === "main");
  assert.ok(mainSegment, "Half endpoint row must include a main segment.");
  assert.equal(mainSegment.primaryPrescription.mode, "distance");
  if (mainSegment.primaryPrescription.mode !== "distance") {
    throw new Error("Half endpoint main segment must be distance-based.");
  }
  assert.equal(
    mainSegment.primaryPrescription.distanceMeters.min,
    HALF_MARATHON_ENDPOINT_DISTANCE_METERS,
  );
  assert.equal(
    mainSegment.primaryPrescription.distanceMeters.max,
    HALF_MARATHON_ENDPOINT_DISTANCE_METERS,
  );
}

function validateMarathonBaseEndpoint(rows: readonly MarathonBasePlanCalendarRow[]) {
  const finalNonRestRow = rows.filter((row) => !row.isRestDay).at(-1);
  assert.ok(finalNonRestRow, "Marathon Base preview must include non-rest rows.");
  assert.equal(finalNonRestRow.workoutDayKind, "marathon_base_endpoint");
  assert.equal(finalNonRestRow.endpointDistanceMeters, null);

  const mainSegment = finalNonRestRow.segments.find((segment) => segment.segmentRole === "main");
  assert.ok(mainSegment, "Marathon Base endpoint row must include a main segment.");
  assert.notEqual(mainSegment.primaryPrescription.mode, "distance");
}

function validateMarathonCompletionEndpoint(rows: readonly MarathonCompletionPlanCalendarRow[]) {
  const finalNonRestRow = rows.filter((row) => !row.isRestDay).at(-1);
  assert.ok(finalNonRestRow, "Marathon Completion preview must include non-rest rows.");
  assert.equal(finalNonRestRow.workoutDayKind, "final_selected_distance_day");
  assert.equal(
    finalNonRestRow.endpointDistanceMeters,
    MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
  );

  const mainSegment = finalNonRestRow.segments.find((segment) => segment.segmentRole === "main");
  assert.ok(mainSegment, "Marathon Completion endpoint row must include a main segment.");
  assert.equal(mainSegment.primaryPrescription.mode, "distance");
  if (mainSegment.primaryPrescription.mode !== "distance") {
    throw new Error("Marathon Completion endpoint main segment must be distance-based.");
  }
  assert.equal(
    mainSegment.primaryPrescription.distanceMeters.min,
    MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
  );
  assert.equal(
    mainSegment.primaryPrescription.distanceMeters.max,
    MARATHON_COMPLETION_ENDPOINT_DISTANCE_METERS,
  );
}

function validateFixedRestDays(rows: readonly R6CalendarRow[]) {
  const violations = rows.filter(
    (row) => !row.isRestDay && (row.weekday === "Wednesday" || row.weekday === "Saturday"),
  );
  assert.deepEqual(violations, [], "Fixed rest day workouts must not leak.");
}

function validateLongRunDay(
  rows: readonly R6CalendarRow[],
  longRunKinds: readonly RunningPlanPreviewCalendarWorkoutDayKind[],
) {
  const longRows = rows.filter((row) => longRunKinds.includes(row.workoutDayKind));

  assert.ok(longRows.length > 0, "Preview must include long-run/final endpoint rows.");
  assert.deepEqual(
    [...new Set(longRows.map((row) => row.weekday))],
    ["Sunday"],
    "Long run and endpoint rows must stay on preferred long-run day.",
  );
}

function validateRecoveryAfterStressors(
  rows: readonly R6CalendarRow[],
  stressKinds: readonly RunningPlanPreviewCalendarWorkoutDayKind[],
) {
  const stressRows = rows.filter((row) => stressKinds.includes(row.workoutDayKind));

  assert.ok(stressRows.length > 0, "Preview must include stress rows for recovery proof.");

  for (const stressRow of stressRows) {
    const nextRunningRow = rows.find(
      (row) => row.dayNumber > stressRow.dayNumber && !row.isRestDay,
    );
    assert.ok(nextRunningRow, `Expected next running row after ${stressRow.rowId}.`);
    assert.ok(
      nextRunningRow.workoutDayKind === "recovery" || nextRunningRow.workoutDayKind === "easy",
      `Next running row after ${stressRow.rowId} must be recovery/easy, got ${nextRunningRow.workoutDayKind}.`,
    );
  }
}

function validateCutbackWeeks(
  rows: readonly R6CalendarRow[],
  cutbackWeeks: readonly number[],
  label: string,
) {
  for (const weekNumber of cutbackWeeks) {
    const weekRows = rows.filter((row) => row.weekNumber === weekNumber);
    assert.ok(
      weekRows.some((row) => row.workoutDayKind === "cutback_long_run"),
      `${label} week ${weekNumber} must include cutback_long_run.`,
    );
    assert.equal(
      weekRows.some((row) => ["intervals", "hills", "threshold"].includes(row.workoutDayKind)),
      false,
      `${label} week ${weekNumber} must not include intervals, hills, or threshold.`,
    );
  }
}

function validatePenultimateWeek(
  rows: readonly R6CalendarRow[],
  weekNumber: number,
  label: string,
) {
  const weekRows = rows.filter((row) => row.weekNumber === weekNumber);

  assert.ok(weekRows.some((row) => row.workoutDayKind === "strides"));
  assert.equal(
    weekRows.some((row) =>
      ["tempo", "intervals", "hills", "threshold"].includes(row.workoutDayKind),
    ),
    false,
    `${label} penultimate week must include strides without harder development.`,
  );
}

function validateSingleDevelopmentTouchPerWeek(
  rows: readonly R6CalendarRow[],
  horizonWeeks: number,
) {
  for (let weekNumber = 1; weekNumber <= horizonWeeks; weekNumber += 1) {
    const developmentCount = rows.filter(
      (row) => row.weekNumber === weekNumber && isDevelopmentTouch(row.workoutDayKind),
    ).length;
    assert.ok(developmentCount <= 1, `Week ${weekNumber} has ${developmentCount} touches.`);
  }
}

function validateWatchExecutableSegments(rows: readonly R6CalendarRow[]) {
  const nonRestRows = rows.filter((row) => !row.isRestDay);

  assert.ok(nonRestRows.length > 0, "Preview must include non-rest workout rows.");

  for (const row of nonRestRows) {
    assert.equal(row.watchExecutable, true, `${row.rowId} must be watch-executable.`);
    assert.equal(row.primaryContract, "numeric_structure", `${row.rowId} must be numeric.`);
    assert.equal(row.cueRole, "secondary_only", `${row.rowId} must keep cues secondary.`);
    assert.ok(row.segments.length > 0, `${row.rowId} must include segments.`);

    for (const segment of row.segments) {
      assert.ok(
        runningPlanPrescriptionIsExact(segment.primaryPrescription),
        `${row.rowId}.${segment.id} must have exact numeric structure.`,
      );

      if (segment.targetTruthMode === "editable_default_hr") {
        const segmentText = JSON.stringify(segment);
        assert.match(segmentText, /editable default/i);
        assert.doesNotMatch(segmentText, /personal/i);
      }
    }
  }
}

function validateForbiddenMetricSignals(rows: readonly object[], inputSummary: object) {
  const text = JSON.stringify({ rows, inputSummary });

  assert.deepEqual(findForbiddenRunnerFacingLanguageMatches(rows), []);
  assert.doesNotMatch(text, /recent5k|recent_5k|5k_benchmark/i);
  assert.doesNotMatch(text, /watchAccess|no_watch|noWatch/i);
  assert.equal(Object.hasOwn(inputSummary, "watchAccess"), false);
  assert.equal(Object.hasOwn(inputSummary, "recent5kBenchmark"), false);
  assert.equal(Object.hasOwn(inputSummary, "targetTime"), false);
  assert.equal(Object.hasOwn(inputSummary, "personalHrZones"), false);
}

function validateSegmentTextIncludes(
  rows: readonly R6CalendarRow[],
  expected: RegExp,
  message: string,
) {
  assert.match(JSON.stringify(rows.filter((row) => !row.isRestDay)), expected, message);
}

function validateNoMarathonOverclaim(rows: readonly MarathonBasePlanCalendarRow[]) {
  const text = JSON.stringify(rows);

  assert.doesNotMatch(text, /42195|42\.195|full[\s_-]*marathon/i);
  assert.deepEqual(findForbiddenRunnerFacingLanguageMatches(rows), []);
}

function validateNoMarathonCompletionRaceOverclaim(
  rows: readonly MarathonCompletionPlanCalendarRow[],
) {
  const text = JSON.stringify(rows);

  assert.doesNotMatch(text, /marathon_base_endpoint|sub-|boston/i);
  assert.deepEqual(findForbiddenRunnerFacingLanguageMatches(rows), []);
}

function validateHalfSpecificDurabilitySignal(rows: readonly HalfMarathonPlanCalendarRow[]) {
  const durabilityRows = rows.filter((row) => {
    if (row.isRestDay) {
      return false;
    }

    return /half_marathon_durability|half_marathon_aerobic_durability|controlled_steady_finish/.test(
      JSON.stringify(row.segments),
    );
  });

  assert.ok(
    durabilityRows.some(
      (row) =>
        row.weekNumber >= 10 &&
        (row.workoutDayKind === "tempo" || row.workoutDayKind === "long_run"),
    ),
    "Half Marathon must include a mid/late half-specific durability signal.",
  );
}

function validateLongRunDetailVariety(rows: readonly R6CalendarRow[], label: string) {
  const substantialLongRuns = rows.filter(
    (row) =>
      row.workoutDayKind === "long_run" &&
      mainSegmentDurationSeconds(row) !== null &&
      mainSegmentDurationSeconds(row)! > 90 * 60,
  );

  assert.ok(
    substantialLongRuns.length >= 2,
    `${label} must include multiple long runs over 90 minutes for variety proof.`,
  );

  const checkpointLabels = new Set(
    substantialLongRuns
      .map((row) => segmentIntensityLabel(row, "checkpoint"))
      .filter((value): value is string => Boolean(value)),
  );
  const finishLabels = new Set(
    substantialLongRuns
      .map((row) => segmentIntensityLabel(row, "finish"))
      .filter((value): value is string => Boolean(value)),
  );
  const cueTexts = new Set(
    substantialLongRuns.flatMap((row) =>
      row.segments
        .filter(
          (segment) => segment.segmentRole === "checkpoint" || segment.segmentRole === "finish",
        )
        .map((segment) => segment.secondaryCue),
    ),
  );

  assert.ok(
    checkpointLabels.size >= 2,
    `${label} long runs over 90 minutes must vary checkpoint intent.`,
  );
  assert.ok(finishLabels.size >= 2, `${label} long runs over 90 minutes must vary finish intent.`);
  assert.ok(cueTexts.size >= 4, `${label} long runs over 90 minutes must vary detail cues.`);
}

function mainSegmentDurationSeconds(row: R6CalendarRow) {
  const mainSegment = row.segments.find((segment) => segment.segmentRole === "main");
  if (!mainSegment || !("durationSeconds" in mainSegment.primaryPrescription)) {
    return null;
  }

  return mainSegment.primaryPrescription.durationSeconds.min;
}

function segmentIntensityLabel(row: R6CalendarRow, segmentRole: "checkpoint" | "finish") {
  const segment = row.segments.find((candidate) => candidate.segmentRole === segmentRole);
  if (!segment || !("intensityLabel" in segment.primaryPrescription)) {
    return null;
  }

  return segment.primaryPrescription.intensityLabel;
}

function assertWorkoutKinds(
  rows: readonly R6CalendarRow[],
  {
    includes,
    excludes,
    label,
  }: {
    includes: readonly RunningPlanPreviewCalendarWorkoutDayKind[];
    excludes: readonly RunningPlanPreviewCalendarWorkoutDayKind[];
    label: string;
  },
) {
  const kinds = new Set(rows.filter((row) => !row.isRestDay).map((row) => row.workoutDayKind));
  for (const included of includes) {
    assert.ok(kinds.has(included), `${label} must include ${included}.`);
  }
  for (const excluded of excludes) {
    assert.equal(kinds.has(excluded), false, `${label} must not include ${excluded}.`);
  }
}

function developmentSequence(rows: readonly R6CalendarRow[]) {
  return rows
    .filter((row) => !row.isRestDay && isDevelopmentTouch(row.workoutDayKind))
    .map((row) => `${row.weekNumber}:${row.workoutDayKind}`);
}

function maxWeekNumber(rows: readonly R6CalendarRow[]) {
  return Math.max(...rows.map((row) => row.weekNumber));
}

function replaceWorkoutKind<T extends R6CalendarRow>(
  rows: readonly T[],
  from: RunningPlanPreviewCalendarWorkoutDayKind,
  to: RunningPlanPreviewCalendarWorkoutDayKind,
): T[] {
  return rows.map((row) =>
    row.workoutDayKind === from ? ({ ...row, workoutDayKind: to } as T) : row,
  );
}

function replaceFirstWorkoutKind<T extends R6CalendarRow>(
  rows: readonly T[],
  from: RunningPlanPreviewCalendarWorkoutDayKind,
  to: RunningPlanPreviewCalendarWorkoutDayKind,
): T[] {
  let replaced = false;
  return rows.map((row) => {
    if (!replaced && row.workoutDayKind === from) {
      replaced = true;
      return { ...row, workoutDayKind: to } as T;
    }

    return row;
  });
}

function assertIssueIncludes(issues: readonly string[], expectedFragment: string) {
  assert.ok(
    issues.some((issue) => issue.includes(expectedFragment)),
    `Expected issue containing "${expectedFragment}", got: ${issues.join(" | ")}`,
  );
}

function isDevelopmentTouch(kind: RunningPlanPreviewCalendarWorkoutDayKind) {
  return [
    "strides",
    "steady_aerobic_run",
    "progression",
    "tempo",
    "threshold",
    "intervals",
    "hills",
  ].includes(kind);
}

main();
