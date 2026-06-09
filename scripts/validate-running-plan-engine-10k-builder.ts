import assert from "node:assert/strict";
import {
  buildTenKPlanPreviewDraft,
  runningPlanPrescriptionIsExact,
  TEN_K_PLAN_BUILDER_SOURCE_KIND,
  TEN_K_PLAN_BUILDER_WEEKS,
  type TenKPlanCalendarRow,
  type TenKPlanPreviewDraft,
} from "../src/lib/plan-creation-engine";
import { validateTenKDiversityPolicy } from "../src/lib/plan-creation-engine/ten-k-diversity-policy";

function main() {
  const draft = validateHappyPath();
  validateRunnerLevelDiversityMatrix();
  validateConservativeDowngrade();
  validateBadDiversityGates();
  validateDefaultStartDateEndpoint();
  validateBackendDefaults();
  validateLongRunFallbackCorrection();
  validateUnsupportedFamilyFailsBeforeReview();
  validateBlockedLongRunPreferenceFailsBeforeReview();
  validateInvalidRunnerBasicsFailBeforeReview();
  validateInvalidFixedRestDayFailsBeforeReview();

  console.log("Running plan engine 10K builder checks passed.", {
    sourceKind: draft.sourceKind,
    weeks: TEN_K_PLAN_BUILDER_WEEKS,
    calendarRows: draft.calendarRows.length,
    nonRestRows: draft.calendarRows.filter((row) => !row.isRestDay).length,
    endpointDistanceMeters: draft.endpointProof.endpointDistanceMeters,
    finalDate: draft.endpointProof.finalDate,
    validationOk: draft.validation.ok,
  });
}

function validateHappyPath() {
  const result = buildTenKPlanPreviewDraft({
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel: "sometimes_runs",
    distanceFamily: "10K",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, true, "10K happy path must produce a review preview draft.");
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  const draft = result.draft;
  assert.equal(draft.sourceKind, TEN_K_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.source_kind, TEN_K_PLAN_BUILDER_SOURCE_KIND);
  assert.equal(draft.sourceStatus, "preview_ready");
  assert.equal(draft.source_status, "preview_ready");
  assert.equal(draft.persisted, false);
  assert.equal(draft.mutates, false);
  assert.equal(draft.callsOpenAi, false);
  assert.equal(draft.reviewSafety.persisted, false);
  assert.equal(draft.reviewSafety.confirmPathImplemented, false);
  assert.equal(draft.planFamily, "10K");
  assert.equal(draft.normalizedInputSummary.distanceFamily, "10K");
  assert.equal(draft.normalizedInputSummary.preferredLongRunDay, "Sunday");
  assert.equal(draft.normalizedInputSummary.daysPerWeek, 5);
  assert.deepEqual(draft.normalizedInputSummary.fixedRestDays, ["Wednesday", "Saturday"]);
  assert.deepEqual(draft.normalizedInputSummary.trainingWeekdays, [
    "Monday",
    "Tuesday",
    "Thursday",
    "Friday",
    "Sunday",
  ]);

  assert.equal(draft.calendarRows.length, TEN_K_PLAN_BUILDER_WEEKS * 7);
  assert.ok(draft.validation.ok, `Validation issues: ${draft.validation.issues.join(", ")}`);
  assert.ok(draft.validation.forbiddenOutputGateIdsChecked.includes("no_fake_precise_pace"));
  assert.ok(draft.validation.forbiddenOutputGateIdsChecked.includes("no_fake_personal_hr"));
  assert.ok(
    draft.validation.forbiddenOutputGateIdsChecked.includes(
      "no_5k_benchmark_normal_path_dependency",
    ),
  );
  assert.ok(draft.validation.forbiddenOutputGateIdsChecked.includes("no_watch_choice_gate"));

  validateFixedRestDays(draft.calendarRows);
  validatePreferredLongRunDay(draft.calendarRows);
  validateRecoveryAfterLongRuns(draft.calendarRows);
  validateRecoveryAfterSharpening(draft.calendarRows);
  validateCutbackWeeks(draft.calendarRows);
  validateTaperSharpeningWeek(draft.calendarRows);
  validateSingleDevelopmentTouchPerWeek(draft.calendarRows);
  validateEndpointExactness(draft.calendarRows);
  validateWatchExecutableSegments(draft.calendarRows);
  validateForbiddenOutputSignals(draft.calendarRows);
  validateNoNormalPathInputGates(draft.normalizedInputSummary);

  return draft;
}

function validateRunnerLevelDiversityMatrix() {
  const beginnerDraft = buildValidDraft("beginner_new_runner");
  assertWorkoutKinds(beginnerDraft, {
    includes: ["strides"],
    excludes: ["tempo", "intervals", "hills", "threshold"],
    label: "beginner_new_runner",
  });

  const sometimesDraft = buildValidDraft("sometimes_runs");
  assertWorkoutKinds(sometimesDraft, {
    includes: ["strides", "tempo", "intervals"],
    excludes: ["threshold"],
    label: "sometimes_runs standard",
  });

  const runsALotDraft = buildValidDraft("runs_a_lot");
  assertWorkoutKinds(runsALotDraft, {
    includes: ["strides", "tempo", "intervals", "hills"],
    excludes: ["threshold"],
    label: "runs_a_lot standard",
  });

  const professionalDraft = buildValidDraft("professional_competitive");
  assertWorkoutKinds(professionalDraft, {
    includes: ["strides", "tempo", "intervals", "hills"],
    excludes: ["threshold"],
    label: "professional_competitive standard",
  });
  assert.notDeepEqual(
    developmentSequence(professionalDraft.calendarRows),
    developmentSequence(runsALotDraft.calendarRows),
    "professional_competitive 10K must be visibly distinct from runs_a_lot.",
  );
}

function validateConservativeDowngrade() {
  const conservativeDraft = buildValidDraft("runs_a_lot", {
    age: 55,
    heightCm: 178,
    weightKg: 74,
  });

  assert.equal(conservativeDraft.normalizedInputSummary.loadContext, "conservative");
  assertWorkoutKinds(conservativeDraft, {
    includes: ["strides", "tempo"],
    excludes: ["intervals", "hills", "threshold"],
    label: "runs_a_lot conservative",
  });
}

function validateBadDiversityGates() {
  const sometimesDraft = buildValidDraft("sometimes_runs");
  const noIntervalsRows = replaceWorkoutKind(sometimesDraft.calendarRows, "intervals", "tempo");
  const noIntervalsIssues = validateTenKDiversityPolicy({
    runnerLevel: "sometimes_runs",
    loadContext: "standard",
    rows: noIntervalsRows,
  });
  assertIssueIncludes(noIntervalsIssues, "must include intervals");
  assertIssueIncludes(noIntervalsIssues, "must not use only strides plus tempo");

  const runsALotDraft = buildValidDraft("runs_a_lot");
  const noHillsRows = replaceWorkoutKind(runsALotDraft.calendarRows, "hills", "easy");
  const noHillsIssues = validateTenKDiversityPolicy({
    runnerLevel: "runs_a_lot",
    loadContext: "standard",
    rows: noHillsRows,
  });
  assertIssueIncludes(noHillsIssues, "must include hills");

  const beginnerDraft = buildValidDraft("beginner_new_runner");
  const unsafeBeginnerRows = replaceFirstWorkoutKind(
    beginnerDraft.calendarRows,
    "strides",
    "intervals",
  );
  const unsafeBeginnerIssues = validateTenKDiversityPolicy({
    runnerLevel: "beginner_new_runner",
    loadContext: "standard",
    rows: unsafeBeginnerRows,
  });
  assertIssueIncludes(unsafeBeginnerIssues, "must not include intervals");

  const thresholdRows = replaceFirstWorkoutKind(sometimesDraft.calendarRows, "easy", "threshold");
  const thresholdIssues = validateTenKDiversityPolicy({
    runnerLevel: "sometimes_runs",
    loadContext: "standard",
    rows: thresholdRows,
  });
  assertIssueIncludes(thresholdIssues, "must not include threshold");
}

function validateDefaultStartDateEndpoint() {
  const result = buildTenKPlanPreviewDraft({
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel: "sometimes_runs",
    distanceFamily: "10K",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
  });

  assert.equal(result.ok, true, "Omitted/default start date must still produce endpoint proof.");
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  validateEndpointExactness(result.draft.calendarRows);
}

function validateBackendDefaults() {
  const result = buildTenKPlanPreviewDraft({
    age: 42,
    heightCm: 170,
    weightKg: 72,
    runnerLevel: "beginner_new_runner",
    distanceFamily: "10K",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, true, "Missing optional inputs should use backend defaults.");
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  assert.equal(result.draft.normalizedInputSummary.daysPerWeek, 3);
  assert.deepEqual(result.draft.normalizedInputSummary.fixedRestDays, []);
  assert.equal(result.draft.normalizedInputSummary.preferredLongRunDay, "Sunday");
  assert.equal(result.draft.normalizedInputSummary.longRunDaySource, "backend_default");
}

function validateLongRunFallbackCorrection() {
  const result = buildTenKPlanPreviewDraft({
    age: 42,
    heightCm: 170,
    weightKg: 72,
    runnerLevel: "beginner_new_runner",
    distanceFamily: "10K",
    fixedRestDays: ["Sunday"],
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, true, "Blocked default long-run day should use backend fallback.");
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  assert.equal(result.draft.normalizedInputSummary.longRunDaySource, "backend_fallback");
  assert.notEqual(result.draft.normalizedInputSummary.preferredLongRunDay, "Sunday");
  assert.equal(
    result.draft.calendarRows.some((row) => !row.isRestDay && row.weekday === "Sunday"),
    false,
    "Fallback correction must still protect fixed rest days.",
  );
}

function validateUnsupportedFamilyFailsBeforeReview() {
  const result = buildTenKPlanPreviewDraft({
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel: "sometimes_runs",
    distanceFamily: "Half Marathon",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, false, "Non-10K families must fail before review in R3.");
  if (result.ok) {
    throw new Error("Unexpected 10K builder success for Half Marathon.");
  }

  assert.equal(result.unavailable.sourceStatus, "preview_unavailable");
  assert.equal(result.unavailable.persisted, false);
  assert.equal(result.unavailable.error.code, "unsupported_distance_family");
}

function validateBlockedLongRunPreferenceFailsBeforeReview() {
  const result = buildTenKPlanPreviewDraft({
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel: "sometimes_runs",
    distanceFamily: "10K",
    fixedRestDays: ["Sunday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, false, "Blocked preferred long-run day must fail before review.");
  if (result.ok) {
    throw new Error("Unexpected success for blocked preferred long-run day.");
  }

  assert.equal(result.unavailable.sourceStatus, "preview_unavailable");
  assert.equal(result.unavailable.persisted, false);
  assert.equal(result.unavailable.error.code, "long_run_day_blocked");
}

function validateInvalidRunnerBasicsFailBeforeReview() {
  const result = buildTenKPlanPreviewDraft({
    age: Number.NaN,
    heightCm: 178,
    weightKg: 74,
    runnerLevel: "sometimes_runs",
    distanceFamily: "10K",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, false, "Invalid runner basics must fail before review.");
  if (result.ok) {
    throw new Error("Unexpected success for invalid runner basics.");
  }

  assert.equal(result.unavailable.persisted, false);
  assert.equal(result.unavailable.error.code, "invalid_runner_basics");
}

function validateInvalidFixedRestDayFailsBeforeReview() {
  const result = buildTenKPlanPreviewDraft({
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel: "sometimes_runs",
    distanceFamily: "10K",
    fixedRestDays: ["Funday" as never],
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, false, "Invalid fixed rest day must fail before review.");
  if (result.ok) {
    throw new Error("Unexpected success for invalid fixed rest day.");
  }

  assert.equal(result.unavailable.persisted, false);
  assert.equal(result.unavailable.error.code, "invalid_fixed_rest_day");
}

function validateFixedRestDays(rows: readonly TenKPlanCalendarRow[]) {
  const violations = rows.filter(
    (row) => !row.isRestDay && (row.weekday === "Wednesday" || row.weekday === "Saturday"),
  );

  assert.deepEqual(violations, [], "Fixed rest day workouts must not leak.");
}

function validatePreferredLongRunDay(rows: readonly TenKPlanCalendarRow[]) {
  const longRows = rows.filter((row) =>
    ["long_run", "cutback_long_run", "final_selected_distance_day"].includes(row.workoutDayKind),
  );

  assert.ok(longRows.length > 0, "10K preview must include long-run/final endpoint rows.");
  assert.deepEqual(
    [...new Set(longRows.map((row) => row.weekday))],
    ["Sunday"],
    "Long run and endpoint rows must stay on preferred long-run day.",
  );
}

function validateRecoveryAfterLongRuns(rows: readonly TenKPlanCalendarRow[]) {
  const longRunRows = rows.filter((row) =>
    ["long_run", "cutback_long_run"].includes(row.workoutDayKind),
  );

  for (const longRunRow of longRunRows) {
    const nextRunningRow = rows.find(
      (row) => row.dayNumber > longRunRow.dayNumber && !row.isRestDay,
    );
    assert.ok(nextRunningRow, `Expected next running row after ${longRunRow.rowId}.`);
    assert.ok(
      nextRunningRow.workoutDayKind === "recovery" || nextRunningRow.workoutDayKind === "easy",
      `Next running row after ${longRunRow.rowId} must be recovery/easy, got ${nextRunningRow.workoutDayKind}.`,
    );
  }
}

function validateRecoveryAfterSharpening(rows: readonly TenKPlanCalendarRow[]) {
  const sharpeningRows = rows.filter((row) => ["intervals", "hills"].includes(row.workoutDayKind));

  assert.ok(sharpeningRows.length > 0, "Supported 10K preview must include sharper work.");

  for (const sharpeningRow of sharpeningRows) {
    const nextRunningRow = rows.find(
      (row) => row.dayNumber > sharpeningRow.dayNumber && !row.isRestDay,
    );
    assert.ok(nextRunningRow, `Expected next running row after ${sharpeningRow.rowId}.`);
    assert.ok(
      nextRunningRow.workoutDayKind === "recovery" || nextRunningRow.workoutDayKind === "easy",
      `Next running row after ${sharpeningRow.rowId} must be recovery/easy, got ${nextRunningRow.workoutDayKind}.`,
    );
  }
}

function validateCutbackWeeks(rows: readonly TenKPlanCalendarRow[]) {
  for (const weekNumber of [4, 8]) {
    const weekRows = rows.filter((row) => row.weekNumber === weekNumber);
    assert.ok(
      weekRows.some((row) => row.workoutDayKind === "cutback_long_run"),
      `Week ${weekNumber} must include cutback_long_run.`,
    );
    assert.equal(
      weekRows.some((row) => ["intervals", "hills", "threshold"].includes(row.workoutDayKind)),
      false,
      `Week ${weekNumber} must not include intervals, hills, or threshold.`,
    );
  }
}

function validateTaperSharpeningWeek(rows: readonly TenKPlanCalendarRow[]) {
  const weekRows = rows.filter((row) => row.weekNumber === 9);

  assert.ok(weekRows.some((row) => row.workoutDayKind === "strides"));
  assert.equal(
    weekRows.some((row) =>
      ["intervals", "hills", "tempo", "threshold"].includes(row.workoutDayKind),
    ),
    false,
    "Week 9 must include strides without intervals, hills, tempo, or threshold.",
  );
}

function validateSingleDevelopmentTouchPerWeek(rows: readonly TenKPlanCalendarRow[]) {
  for (let weekNumber = 1; weekNumber <= TEN_K_PLAN_BUILDER_WEEKS; weekNumber += 1) {
    const developmentCount = rows.filter(
      (row) => row.weekNumber === weekNumber && isDevelopmentTouch(row.workoutDayKind),
    ).length;
    assert.ok(developmentCount <= 1, `Week ${weekNumber} has ${developmentCount} touches.`);
  }
}

function validateEndpointExactness(rows: readonly TenKPlanCalendarRow[]) {
  const nonRestRows = rows.filter((row) => !row.isRestDay);
  const finalNonRestRow = nonRestRows.at(-1);

  assert.ok(finalNonRestRow, "10K preview must include non-rest rows.");
  assert.equal(finalNonRestRow.workoutDayKind, "final_selected_distance_day");
  assert.equal(finalNonRestRow.endpointDistanceMeters, 10_000);
  assert.notEqual(finalNonRestRow.workoutDayKind, "long_run");
  assert.notEqual(finalNonRestRow.workoutDayKind, "recovery");
  assert.notEqual(finalNonRestRow.workoutDayKind, "rest");

  const mainSegment = finalNonRestRow.segments.find((segment) => segment.segmentRole === "main");
  assert.ok(mainSegment, "Final 10K endpoint row must include a main segment.");
  assert.equal(mainSegment.primaryPrescription.mode, "distance");
  if (mainSegment.primaryPrescription.mode !== "distance") {
    throw new Error("Final 10K endpoint main segment must be distance-based.");
  }

  assert.equal(mainSegment.primaryPrescription.distanceMeters.min, 10_000);
  assert.equal(mainSegment.primaryPrescription.distanceMeters.max, 10_000);
}

function validateWatchExecutableSegments(rows: readonly TenKPlanCalendarRow[]) {
  const nonRestRows = rows.filter((row) => !row.isRestDay);

  assert.ok(nonRestRows.length > 0, "10K preview must include non-rest workout rows.");

  for (const row of nonRestRows) {
    assert.equal(row.watchExecutable, true, `${row.rowId} must be watch-executable.`);
    assert.equal(row.primaryContract, "numeric_structure", `${row.rowId} must be numeric.`);
    assert.equal(row.cueRole, "secondary_only", `${row.rowId} must keep cues secondary.`);
    assert.ok(row.segments.length > 0, `${row.rowId} must include segments.`);

    for (const segment of row.segments) {
      assert.ok(
        runningPlanPrescriptionIsExact(segment.primaryPrescription),
        `${row.rowId}.${segment.id} must have exact duration, distance, repeat, work, or recovery structure.`,
      );

      if (segment.targetTruthMode === "editable_default_hr") {
        const segmentText = JSON.stringify(segment);
        assert.match(segmentText, /editable default/i);
        assert.doesNotMatch(segmentText, /personal/i);
      }
    }
  }
}

function validateForbiddenOutputSignals(rows: readonly TenKPlanCalendarRow[]) {
  const text = JSON.stringify(rows);

  assert.doesNotMatch(text, /pace_min|pace_target|pace_range|race_pace/i);
  assert.doesNotMatch(text, /personal_hr|personal HR/i);
  assert.doesNotMatch(text, /effort_only/i);
  assert.doesNotMatch(text, /recent5k|recent_5k|5k_benchmark/i);
  assert.doesNotMatch(text, /watchAccess|no_watch|noWatch/i);
  assert.doesNotMatch(text, /metadata_only_endpoint/i);
}

function validateNoNormalPathInputGates(inputSummary: object) {
  assert.equal(Object.hasOwn(inputSummary, "watchAccess"), false);
  assert.equal(Object.hasOwn(inputSummary, "noWatchOrNoApp"), false);
  assert.equal(Object.hasOwn(inputSummary, "recent5kBenchmark"), false);
  assert.equal(Object.hasOwn(inputSummary, "targetTime"), false);
  assert.equal(Object.hasOwn(inputSummary, "personalHrZones"), false);
}

function buildValidDraft(
  runnerLevel: "beginner_new_runner" | "sometimes_runs" | "runs_a_lot" | "professional_competitive",
  runnerBasics: { age: number; heightCm: number; weightKg: number } = {
    age: 36,
    heightCm: 178,
    weightKg: 74,
  },
): TenKPlanPreviewDraft {
  const result = buildTenKPlanPreviewDraft({
    ...runnerBasics,
    runnerLevel,
    distanceFamily: "10K",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-08",
  });

  assert.equal(result.ok, true, `${runnerLevel} 10K fixture must build.`);
  if (!result.ok) {
    throw new Error(result.unavailable.error.message);
  }

  return result.draft;
}

function assertWorkoutKinds(
  draft: TenKPlanPreviewDraft,
  {
    includes,
    excludes,
    label,
  }: {
    includes: readonly string[];
    excludes: readonly string[];
    label: string;
  },
) {
  const kinds = workoutKindSet(draft.calendarRows);
  for (const includedKind of includes) {
    assert.ok(kinds.has(includedKind), `${label} must include ${includedKind}.`);
  }
  for (const excludedKind of excludes) {
    assert.equal(kinds.has(excludedKind), false, `${label} must not include ${excludedKind}.`);
  }
}

function workoutKindSet(rows: readonly TenKPlanCalendarRow[]) {
  return new Set(rows.filter((row) => !row.isRestDay).map((row) => row.workoutDayKind));
}

function developmentSequence(rows: readonly TenKPlanCalendarRow[]) {
  return rows
    .filter((row) => !row.isRestDay && isDevelopmentTouch(row.workoutDayKind))
    .map((row) => `${row.weekNumber}:${row.workoutDayKind}`);
}

function replaceWorkoutKind(
  rows: readonly TenKPlanCalendarRow[],
  fromKind: TenKPlanCalendarRow["workoutDayKind"],
  toKind: TenKPlanCalendarRow["workoutDayKind"],
) {
  return rows.map((row) =>
    row.workoutDayKind === fromKind ? { ...row, workoutDayKind: toKind } : row,
  );
}

function replaceFirstWorkoutKind(
  rows: readonly TenKPlanCalendarRow[],
  fromKind: TenKPlanCalendarRow["workoutDayKind"],
  toKind: TenKPlanCalendarRow["workoutDayKind"],
) {
  let replaced = false;

  return rows.map((row) => {
    if (replaced || row.workoutDayKind !== fromKind) {
      return row;
    }

    replaced = true;
    return { ...row, workoutDayKind: toKind };
  });
}

function assertIssueIncludes(issues: readonly string[], expectedSnippet: string) {
  assert.ok(
    issues.some((issue) => issue.includes(expectedSnippet)),
    `Expected diversity issue containing "${expectedSnippet}", got [${issues.join("; ")}].`,
  );
}

function isDevelopmentTouch(kind: TenKPlanCalendarRow["workoutDayKind"]) {
  return ["strides", "tempo", "intervals", "hills"].includes(kind);
}

main();
