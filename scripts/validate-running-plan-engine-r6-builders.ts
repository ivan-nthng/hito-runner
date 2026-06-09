import assert from "node:assert/strict";
import {
  buildHalfMarathonPlanPreviewDraft,
  buildMarathonBasePlanPreviewDraft,
  HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
  type HalfMarathonPlanCalendarRow,
  type HalfMarathonPlanPreviewDraft,
  type MarathonBasePlanCalendarRow,
  type MarathonBasePlanPreviewDraft,
  type RunningPlanPreviewCalendarWorkoutDayKind,
  type RunningPlanSegmentPrescription,
} from "../src/lib/plan-creation-engine";
import {
  HALF_MARATHON_ENDPOINT_DISTANCE_METERS,
  HALF_MARATHON_PLAN_BUILDER_WEEKS,
  validateHalfMarathonDiversityPolicy,
} from "../src/lib/plan-creation-engine/half-marathon-diversity-policy";
import {
  MARATHON_BASE_PLAN_BUILDER_WEEKS,
  validateMarathonBaseDiversityPolicy,
} from "../src/lib/plan-creation-engine/marathon-base-diversity-policy";

function main() {
  const halfSometimes = validateHalfMarathonSometimesRuns();
  const halfHigherSupport = validateHalfMarathonHigherSupport();
  validateHalfMarathonBeginnerBlocked();
  validateHalfMarathonBadGates(halfSometimes, halfHigherSupport);

  const marathonBase = validateMarathonBaseSupported();
  validateMarathonBaseSometimesRuns();
  validateMarathonBaseBeginnerBlocked();
  validateMarathonBaseBadGates(marathonBase);

  console.log("Running plan engine R6 builder checks passed.", {
    half: {
      sourceKind: halfSometimes.sourceKind,
      weeks: HALF_MARATHON_PLAN_BUILDER_WEEKS,
      calendarRows: halfSometimes.calendarRows.length,
      nonRestRows: halfSometimes.calendarRows.filter((row) => !row.isRestDay).length,
      endpointDistanceMeters: halfSometimes.endpointProof.endpointDistanceMeters,
      finalDate: halfSometimes.endpointProof.finalDate,
    },
    marathonBase: {
      sourceKind: marathonBase.sourceKind,
      weeks: MARATHON_BASE_PLAN_BUILDER_WEEKS,
      calendarRows: marathonBase.calendarRows.length,
      nonRestRows: marathonBase.calendarRows.filter((row) => !row.isRestDay).length,
      finalWorkoutDayKind: marathonBase.endpointProof.finalWorkoutDayKind,
      finalDate: marathonBase.endpointProof.finalDate,
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
  assert.equal(draft.calendarRows.length, HALF_MARATHON_PLAN_BUILDER_WEEKS * 7);
  assert.equal(draft.normalizedInputSummary.distanceFamily, "Half Marathon");
  assert.equal(draft.normalizedInputSummary.preferredLongRunDay, "Sunday");
  assert.deepEqual(draft.normalizedInputSummary.fixedRestDays, ["Wednesday", "Saturday"]);

  validateHalfEndpointExactness(draft.calendarRows);
  validateFixedRestDays(draft.calendarRows);
  validateLongRunDay(draft.calendarRows, [
    "long_run",
    "cutback_long_run",
    "final_selected_distance_day",
  ]);
  validateRecoveryAfterStressors(draft.calendarRows, ["long_run", "cutback_long_run", "intervals"]);
  validateCutbackWeeks(draft.calendarRows, [4, 8, 12], "Half Marathon");
  validatePenultimateWeek(draft.calendarRows, 13, "Half Marathon");
  validateSingleDevelopmentTouchPerWeek(draft.calendarRows, HALF_MARATHON_PLAN_BUILDER_WEEKS);
  validateWatchExecutableSegments(draft.calendarRows);
  validateForbiddenMetricSignals(draft.calendarRows, draft.normalizedInputSummary);

  assertWorkoutKinds(draft.calendarRows, {
    includes: ["strides", "tempo", "intervals", "final_selected_distance_day"],
    excludes: ["threshold", "marathon_base_endpoint"],
    label: "Half Marathon sometimes_runs",
  });

  return draft;
}

function validateHalfMarathonHigherSupport() {
  const draft = buildHalfDraft("runs_a_lot");

  assertWorkoutKinds(draft.calendarRows, {
    includes: ["strides", "tempo", "threshold", "final_selected_distance_day"],
    excludes: ["marathon_base_endpoint"],
    label: "Half Marathon runs_a_lot",
  });
  validateRecoveryAfterStressors(draft.calendarRows, ["long_run", "cutback_long_run", "threshold"]);
  validateHalfEndpointExactness(draft.calendarRows);

  return draft;
}

function validateHalfMarathonBeginnerBlocked() {
  const result = buildHalfMarathonPlanPreviewDraft({
    age: 32,
    heightCm: 170,
    weightKg: 68,
    runnerLevel: "beginner_new_runner",
    distanceFamily: "Half Marathon",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, false, "Half Marathon must block beginner_new_runner.");
  if (result.ok) {
    throw new Error("Unexpected Half Marathon beginner success.");
  }
  assert.equal(result.unavailable.sourceStatus, "preview_unavailable");
  assert.equal(result.unavailable.persisted, false);
  assert.equal(result.unavailable.error.code, "unsupported_runner_level_for_family");
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
    rows: higherSupportNoThresholdRows,
  });
  assertIssueIncludes(higherSupportNoThresholdIssues, "must include threshold");
}

function validateMarathonBaseSupported() {
  const draft = buildMarathonBaseDraft("runs_a_lot");

  assert.equal(draft.sourceKind, MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.source_kind, MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.sourceStatus, "preview_ready");
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.callsOpenAi, false);
  assert.equal(draft.reviewSafety.confirmPathImplemented, false);
  assert.equal(draft.planFamily, "Marathon Base");
  assert.equal(draft.calendarRows.length, MARATHON_BASE_PLAN_BUILDER_WEEKS * 7);
  assert.equal(draft.normalizedInputSummary.distanceFamily, "Marathon Base");

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
  validateCutbackWeeks(draft.calendarRows, [4, 8, 12], "Marathon Base");
  validatePenultimateWeek(draft.calendarRows, 15, "Marathon Base");
  validateSingleDevelopmentTouchPerWeek(draft.calendarRows, MARATHON_BASE_PLAN_BUILDER_WEEKS);
  validateWatchExecutableSegments(draft.calendarRows);
  validateForbiddenMetricSignals(draft.calendarRows, draft.normalizedInputSummary);
  validateNoMarathonOverclaim(draft.calendarRows);

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
}

function validateMarathonBaseBeginnerBlocked() {
  const result = buildMarathonBasePlanPreviewDraft({
    age: 32,
    heightCm: 170,
    weightKg: 68,
    runnerLevel: "beginner_new_runner",
    distanceFamily: "Marathon Base",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, false, "Marathon Base must block beginner_new_runner.");
  if (result.ok) {
    throw new Error("Unexpected Marathon Base beginner success.");
  }
  assert.equal(result.unavailable.sourceStatus, "preview_unavailable");
  assert.equal(result.unavailable.persisted, false);
  assert.equal(result.unavailable.error.code, "unsupported_runner_level_for_family");
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

function buildMarathonBaseDraft(
  runnerLevel: "sometimes_runs" | "runs_a_lot" | "professional_competitive",
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

function validateFixedRestDays(
  rows: readonly (HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow)[],
) {
  const violations = rows.filter(
    (row) => !row.isRestDay && (row.weekday === "Wednesday" || row.weekday === "Saturday"),
  );
  assert.deepEqual(violations, [], "Fixed rest day workouts must not leak.");
}

function validateLongRunDay(
  rows: readonly (HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow)[],
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
  rows: readonly (HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow)[],
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
  rows: readonly (HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow)[],
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
  rows: readonly (HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow)[],
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
  rows: readonly (HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow)[],
  horizonWeeks: number,
) {
  for (let weekNumber = 1; weekNumber <= horizonWeeks; weekNumber += 1) {
    const developmentCount = rows.filter(
      (row) => row.weekNumber === weekNumber && isDevelopmentTouch(row.workoutDayKind),
    ).length;
    assert.ok(developmentCount <= 1, `Week ${weekNumber} has ${developmentCount} touches.`);
  }
}

function validateWatchExecutableSegments(
  rows: readonly (HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow)[],
) {
  const nonRestRows = rows.filter((row) => !row.isRestDay);

  assert.ok(nonRestRows.length > 0, "Preview must include non-rest workout rows.");

  for (const row of nonRestRows) {
    assert.equal(row.watchExecutable, true, `${row.rowId} must be watch-executable.`);
    assert.equal(row.primaryContract, "numeric_structure", `${row.rowId} must be numeric.`);
    assert.equal(row.cueRole, "secondary_only", `${row.rowId} must keep cues secondary.`);
    assert.ok(row.segments.length > 0, `${row.rowId} must include segments.`);

    for (const segment of row.segments) {
      assert.ok(
        segmentPrescriptionIsNumeric(segment.primaryPrescription),
        `${row.rowId}.${segment.id} must have numeric structure.`,
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

  assert.doesNotMatch(text, /pace_min|pace_target|pace_range|race_pace/i);
  assert.doesNotMatch(text, /personal_hr|personal HR/i);
  assert.doesNotMatch(text, /effort_only/i);
  assert.doesNotMatch(text, /recent5k|recent_5k|5k_benchmark/i);
  assert.doesNotMatch(text, /watchAccess|no_watch|noWatch/i);
  assert.equal(Object.hasOwn(inputSummary, "watchAccess"), false);
  assert.equal(Object.hasOwn(inputSummary, "recent5kBenchmark"), false);
  assert.equal(Object.hasOwn(inputSummary, "targetTime"), false);
  assert.equal(Object.hasOwn(inputSummary, "personalHrZones"), false);
}

function validateNoMarathonOverclaim(rows: readonly MarathonBasePlanCalendarRow[]) {
  const text = JSON.stringify(rows);

  assert.doesNotMatch(text, /42195|42\.195|full_marathon|race_readiness|race_peak|race_pace/i);
}

function assertWorkoutKinds(
  rows: readonly (HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow)[],
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

function replaceWorkoutKind<T extends HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow>(
  rows: readonly T[],
  from: RunningPlanPreviewCalendarWorkoutDayKind,
  to: RunningPlanPreviewCalendarWorkoutDayKind,
): T[] {
  return rows.map((row) =>
    row.workoutDayKind === from ? ({ ...row, workoutDayKind: to } as T) : row,
  );
}

function replaceFirstWorkoutKind<
  T extends HalfMarathonPlanCalendarRow | MarathonBasePlanCalendarRow,
>(
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
  return ["strides", "tempo", "threshold", "intervals", "hills"].includes(kind);
}

function segmentPrescriptionIsNumeric(prescription: RunningPlanSegmentPrescription) {
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
        segmentPrescriptionIsNumeric(prescription.work) &&
        segmentPrescriptionIsNumeric(prescription.recovery)
      );
  }
}

function rangeIsPositive(range: { min: number; max: number }) {
  return (
    Number.isFinite(range.min) &&
    Number.isFinite(range.max) &&
    range.min > 0 &&
    range.max >= range.min
  );
}

main();
