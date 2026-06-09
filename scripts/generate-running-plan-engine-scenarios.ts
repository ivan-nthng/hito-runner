import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildHalfMarathonPlanPreviewDraft,
  buildMarathonBasePlanPreviewDraft,
  buildTenKPlanPreviewDraft,
  runningPlanPrescriptionIsExact,
  type BuildRunningPlanPreviewInput,
  type BuildTenKPlanPreviewInput,
  type RunningPlanDistanceFamily,
  type RunningPlanPreviewCalendarRow,
  type RunningPlanRunnerLevel,
} from "../src/lib/plan-creation-engine";

const ARTIFACT_DIR = "qa-artifacts/plan-engine-scenarios/2026-06-09";

type ScenarioInput = BuildTenKPlanPreviewInput | BuildRunningPlanPreviewInput;

interface ScenarioDefinition {
  scenarioId: string;
  bodyProfile: "light_thin_runner" | "average_runner" | "heavier_runner";
  input: ScenarioInput;
}

const baseInput = {
  daysPerWeek: 5,
  fixedRestDays: ["Wednesday", "Saturday"],
  preferredLongRunDay: "Sunday",
  startDate: "2026-06-15",
} as const;

const runnerBasicsByProfile = {
  light_thin_runner: { age: 30, heightCm: 178, weightKg: 62 },
  average_runner: { age: 36, heightCm: 178, weightKg: 74 },
  heavier_runner: { age: 55, heightCm: 178, weightKg: 92 },
} as const;

const scenarios: readonly ScenarioDefinition[] = [
  scenario("beginner_light_10k", "10K", "beginner_new_runner", "light_thin_runner"),
  scenario("beginner_heavy_10k", "10K", "beginner_new_runner", "heavier_runner"),
  scenario("sometimes_runs_average_10k", "10K", "sometimes_runs", "average_runner"),
  scenario("runs_a_lot_light_10k", "10K", "runs_a_lot", "light_thin_runner"),
  scenario("professional_competitive_10k", "10K", "professional_competitive", "light_thin_runner"),
  scenario("beginner_half_marathon", "Half Marathon", "beginner_new_runner", "average_runner"),
  scenario("sometimes_runs_half_marathon", "Half Marathon", "sometimes_runs", "average_runner"),
  scenario("runs_a_lot_half_marathon", "Half Marathon", "runs_a_lot", "light_thin_runner"),
  scenario(
    "professional_competitive_half_marathon",
    "Half Marathon",
    "professional_competitive",
    "light_thin_runner",
  ),
  scenario("beginner_marathon_base", "Marathon Base", "beginner_new_runner", "average_runner"),
  scenario("sometimes_runs_marathon_base", "Marathon Base", "sometimes_runs", "average_runner"),
  scenario("runs_a_lot_heavy_marathon_base", "Marathon Base", "runs_a_lot", "heavier_runner"),
  scenario(
    "professional_competitive_marathon_base",
    "Marathon Base",
    "professional_competitive",
    "light_thin_runner",
  ),
];

type ScenarioSummary = ReturnType<typeof buildSummary>;
type ScenarioComparisonEntry = ScenarioSummary["scenarioComparison"][number];
type PreviewReadyScenarioComparisonEntry = Extract<
  ScenarioComparisonEntry,
  { status: "preview_ready" }
>;

function main() {
  mkdirSync(ARTIFACT_DIR, { recursive: true });

  const scenarioOutputs = scenarios.map((definition) => {
    const output = buildScenarioOutput(definition);
    writeJson(`${definition.scenarioId}.json`, output);
    return output;
  });

  const summary = buildSummary(scenarioOutputs);
  writeJson("summary.json", summary);
  writeReadme();
  validateScenarioProof(summary);

  console.log("Running plan engine scenario JSON generated.", {
    artifactDirectory: ARTIFACT_DIR,
    scenarioCount: summary.scenarioCount,
    previewReadyCount: summary.previewReadyScenarios.length,
    unavailableCount: summary.unavailableScenarios.length,
    unresolvedRangeCount: summary.unresolvedRangeCount,
    unresolvedExecutableSegmentCount: summary.unresolvedExecutableSegmentCount,
  });
}

function scenario(
  scenarioId: string,
  distanceFamily: RunningPlanDistanceFamily,
  runnerLevel: RunningPlanRunnerLevel,
  bodyProfile: ScenarioDefinition["bodyProfile"],
): ScenarioDefinition {
  return {
    scenarioId,
    bodyProfile,
    input: {
      ...baseInput,
      ...runnerBasicsByProfile[bodyProfile],
      runnerLevel,
      distanceFamily,
    },
  };
}

function buildScenarioOutput(definition: ScenarioDefinition) {
  const result = buildScenario(definition.input);
  if (!result.ok) {
    return {
      scenarioId: definition.scenarioId,
      status: "preview_unavailable" as const,
      family: definition.input.distanceFamily,
      runnerLevel: definition.input.runnerLevel,
      bodyProfile: definition.bodyProfile,
      input: definition.input,
      unavailable: result.unavailable,
    };
  }

  const draft = result.draft;
  const exactness = summarizeExactness(draft.calendarRows);
  const metricTruthScan = scanRunnerFacingMetricTruth(draft.calendarRows);

  return {
    scenarioId: definition.scenarioId,
    status: "preview_ready" as const,
    family: draft.planFamily,
    runnerLevel: definition.input.runnerLevel,
    bodyProfile: definition.bodyProfile,
    sourceKind: draft.sourceKind,
    loadContext: draft.normalizedInputSummary.loadContext,
    weekCount: maxWeekNumber(draft.calendarRows),
    rowCount: draft.calendarRows.length,
    nonRestRowCount: draft.calendarRows.filter((row) => !row.isRestDay).length,
    workoutKindCounts: countWorkoutKinds(draft.calendarRows),
    developmentSequence: developmentSequence(draft.calendarRows),
    durabilitySignals: summarizeDurabilitySignals(draft.calendarRows),
    longRunDetailVariety: summarizeLongRunDetailVariety(draft.calendarRows),
    endpointProof: draft.endpointProof,
    exactness,
    fakePrecisePaceAppears: metricTruthScan.fakePrecisePaceMatches.length > 0,
    fakePersonalHrAppears: metricTruthScan.fakePersonalHrMatches.length > 0,
    defaultHrReadback: {
      appears: metricTruthScan.editableDefaultHrMatches.length > 0,
      labelledEditableDefaultAdvisory:
        metricTruthScan.editableDefaultHrMatches.length > 0 &&
        metricTruthScan.fakePersonalHrMatches.length === 0,
    },
    metricTruthScan,
    draft,
  };
}

function buildScenario(input: ScenarioInput) {
  if (input.distanceFamily === "10K") {
    return buildTenKPlanPreviewDraft(input as BuildTenKPlanPreviewInput);
  }

  if (input.distanceFamily === "Half Marathon") {
    return buildHalfMarathonPlanPreviewDraft(input as BuildRunningPlanPreviewInput);
  }

  return buildMarathonBasePlanPreviewDraft(input as BuildRunningPlanPreviewInput);
}

function buildSummary(outputs: readonly ReturnType<typeof buildScenarioOutput>[]) {
  const readyOutputs = outputs.filter((output) => output.status === "preview_ready");
  const unavailableOutputs = outputs.filter((output) => output.status === "preview_unavailable");
  const unresolvedRangeCount = readyOutputs.reduce(
    (total, output) => total + output.exactness.unresolvedRangeCount,
    0,
  );
  const unresolvedExecutableSegmentCount = readyOutputs.reduce(
    (total, output) => total + output.exactness.unresolvedExecutableSegmentCount,
    0,
  );

  return {
    generatedAt: new Date().toISOString(),
    artifactDirectory: ARTIFACT_DIR,
    scenarioCount: outputs.length,
    previewReadyScenarios: readyOutputs.map((output) => output.scenarioId),
    unavailableScenarios: unavailableOutputs.map((output) => ({
      scenarioId: output.scenarioId,
      reason: output.unavailable.error,
    })),
    unresolvedRangeCount,
    unresolvedExecutableSegmentCount,
    scenarioComparison: outputs.map((output) => {
      if (output.status === "preview_unavailable") {
        return {
          scenarioId: output.scenarioId,
          status: output.status,
          family: output.family,
          runnerLevel: output.runnerLevel,
          bodyProfile: output.bodyProfile,
          unavailableReason: output.unavailable.error,
        };
      }

      return {
        scenarioId: output.scenarioId,
        status: output.status,
        family: output.family,
        runnerLevel: output.runnerLevel,
        bodyProfile: output.bodyProfile,
        sourceKind: output.sourceKind,
        loadContext: output.loadContext,
        weekCount: output.weekCount,
        rowCount: output.rowCount,
        nonRestRowCount: output.nonRestRowCount,
        workoutKindCounts: output.workoutKindCounts,
        developmentSequence: output.developmentSequence,
        durabilitySignals: output.durabilitySignals,
        longRunDetailVariety: output.longRunDetailVariety,
        endpointProof: output.endpointProof,
        exactness: output.exactness,
        fakePrecisePaceAppears: output.fakePrecisePaceAppears,
        fakePersonalHrAppears: output.fakePersonalHrAppears,
        defaultHrReadback: output.defaultHrReadback,
        metricTruthScan: output.metricTruthScan,
      };
    }),
  };
}

function summarizeExactness(rows: readonly RunningPlanPreviewCalendarRow[]) {
  const unresolved: string[] = [];
  const unresolvedRanges: string[] = findUnresolvedRangePaths(rows);
  let executableSegmentCount = 0;

  for (const row of rows) {
    if (row.isRestDay || !row.watchExecutable) {
      continue;
    }

    for (const segment of row.segments) {
      executableSegmentCount += 1;
      if (!runningPlanPrescriptionIsExact(segment.primaryPrescription)) {
        unresolved.push(`${row.rowId}.${segment.id}`);
      }
    }
  }

  return {
    executableSegmentCount,
    unresolvedRangeCount: unresolvedRanges.length,
    unresolvedRangeSample: unresolvedRanges.slice(0, 10),
    unresolvedExecutableSegmentCount: unresolved.length,
    unresolvedSample: unresolved.slice(0, 10),
  };
}

function validateScenarioProof(summary: ReturnType<typeof buildSummary>) {
  assert.equal(summary.scenarioCount, 13);
  assert.equal(summary.unresolvedRangeCount, 0);
  assert.equal(summary.unresolvedExecutableSegmentCount, 0);
  assert.deepEqual(
    summary.unavailableScenarios.map((scenario) => scenario.scenarioId),
    ["beginner_half_marathon", "beginner_marathon_base"],
  );

  const comparison = new Map(
    summary.scenarioComparison.map((entry) => [entry.scenarioId, entry] as const),
  );
  const tenK = comparison.get("professional_competitive_10k");
  const runsALotTenK = comparison.get("runs_a_lot_light_10k");
  const proHalf = comparison.get("professional_competitive_half_marathon");
  const runsALotHalf = comparison.get("runs_a_lot_half_marathon");
  const sometimesHalf = comparison.get("sometimes_runs_half_marathon");
  const proMarathon = comparison.get("professional_competitive_marathon_base");
  const sometimesMarathon = comparison.get("sometimes_runs_marathon_base");
  const runsALotMarathon = comparison.get("runs_a_lot_heavy_marathon_base");

  assertReady(tenK);
  assertReady(runsALotTenK);
  assertReady(sometimesHalf);
  assertReady(proHalf);
  assertReady(runsALotHalf);
  assertReady(sometimesMarathon);
  assertReady(proMarathon);
  assertReady(runsALotMarathon);
  assert.notDeepEqual(tenK.developmentSequence, runsALotTenK.developmentSequence);
  assert.notDeepEqual(proHalf.developmentSequence, runsALotHalf.developmentSequence);
  assert.notDeepEqual(proMarathon.developmentSequence, runsALotMarathon.developmentSequence);
  assert.equal(tenK.endpointProof.endpointDistanceMeters, 10_000);
  assert.ok(
    sometimesHalf.durabilitySignals.halfSpecificDurabilityRows.length > 0,
    "sometimes_runs_half_marathon must expose half-specific durability signal.",
  );
  assert.ok(
    sometimesHalf.longRunDetailVariety.checkpointIntentCount >= 2,
    "sometimes_runs_half_marathon long runs must vary checkpoint intent.",
  );
  assert.ok(
    sometimesMarathon.longRunDetailVariety.finishIntentCount >= 2,
    "sometimes_runs_marathon_base long runs must vary finish intent.",
  );
  assert.equal(proHalf.endpointProof.endpointDistanceMeters, 21_100);
  assert.equal(proMarathon.endpointProof.endpointDistanceMeters, null);

  for (const entry of summary.scenarioComparison) {
    if (entry.status !== "preview_ready") {
      continue;
    }
    assert.equal(entry.fakePrecisePaceAppears, false);
    assert.equal(entry.fakePersonalHrAppears, false);
  }
}

function assertReady(
  value: ScenarioComparisonEntry | undefined,
): asserts value is PreviewReadyScenarioComparisonEntry {
  assert.ok(value, "Expected scenario summary entry.");
  assert.equal(value.status, "preview_ready");
}

function countWorkoutKinds(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.workoutDayKind] = (counts[row.workoutDayKind] ?? 0) + 1;
    return counts;
  }, {});
}

function developmentSequence(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return rows
    .filter((row) => !row.isRestDay && isDevelopmentTouch(row.workoutDayKind))
    .map((row) => `${row.weekNumber}:${row.workoutDayKind}`);
}

function summarizeDurabilitySignals(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return {
    halfSpecificDurabilityRows: rows
      .filter((row) => !row.isRestDay && JSON.stringify(row.segments).includes("half_marathon"))
      .map((row) => ({
        rowId: row.rowId,
        weekNumber: row.weekNumber,
        workoutDayKind: row.workoutDayKind,
        signalLabels: row.segments.flatMap((segment) => prescriptionLabels(segment)),
      })),
  };
}

function summarizeLongRunDetailVariety(rows: readonly RunningPlanPreviewCalendarRow[]) {
  const longRunsOverNinety = rows.filter(
    (row) =>
      row.workoutDayKind === "long_run" &&
      mainSegmentDurationSeconds(row) !== null &&
      mainSegmentDurationSeconds(row)! > 90 * 60,
  );
  const checkpointIntents = uniqueStrings(
    longRunsOverNinety
      .map((row) => segmentIntensityLabel(row, "checkpoint"))
      .filter((value): value is string => Boolean(value)),
  );
  const finishIntents = uniqueStrings(
    longRunsOverNinety
      .map((row) => segmentIntensityLabel(row, "finish"))
      .filter((value): value is string => Boolean(value)),
  );

  return {
    longRunOverNinetyCount: longRunsOverNinety.length,
    checkpointIntentCount: checkpointIntents.length,
    finishIntentCount: finishIntents.length,
    checkpointIntents,
    finishIntents,
    samples: longRunsOverNinety.slice(0, 6).map((row) => ({
      rowId: row.rowId,
      weekNumber: row.weekNumber,
      mainMinutes: (mainSegmentDurationSeconds(row) ?? 0) / 60,
      checkpointIntent: segmentIntensityLabel(row, "checkpoint"),
      finishIntent: segmentIntensityLabel(row, "finish"),
    })),
  };
}

function prescriptionLabels(segment: RunningPlanPreviewCalendarRow["segments"][number]) {
  const prescription = segment.primaryPrescription;
  if (prescription.mode === "repeat") {
    return [prescription.work.intensityLabel, prescription.recovery.intensityLabel];
  }

  return [prescription.intensityLabel];
}

function mainSegmentDurationSeconds(row: RunningPlanPreviewCalendarRow) {
  const mainSegment = row.segments.find((segment) => segment.segmentRole === "main");
  if (!mainSegment || !("durationSeconds" in mainSegment.primaryPrescription)) {
    return null;
  }

  return mainSegment.primaryPrescription.durationSeconds.min;
}

function segmentIntensityLabel(
  row: RunningPlanPreviewCalendarRow,
  segmentRole: "checkpoint" | "finish",
) {
  const segment = row.segments.find((candidate) => candidate.segmentRole === segmentRole);
  if (!segment || !("intensityLabel" in segment.primaryPrescription)) {
    return null;
  }

  return segment.primaryPrescription.intensityLabel;
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values)];
}

function scanRunnerFacingMetricTruth(rows: readonly RunningPlanPreviewCalendarRow[]) {
  const fakePrecisePaceMatches: Array<{ path: string; value: string }> = [];
  const fakePersonalHrMatches: Array<{ path: string; value: string }> = [];
  const editableDefaultHrMatches: Array<{ path: string; value: string }> = [];

  walkStrings(rows, "draft.calendarRows", (path, value) => {
    if (/pace_min|pace_target|pace_range|race_pace/i.test(value)) {
      fakePrecisePaceMatches.push({ path, value });
    }
    if (/personal_hr|personal HR/i.test(value)) {
      fakePersonalHrMatches.push({ path, value });
    }
    if (/editable default/i.test(value)) {
      editableDefaultHrMatches.push({ path, value });
    }
  });

  return {
    scannedScopes: ["draft.calendarRows"],
    excludedInternalProofScopes: [
      "draft.endpointProof.rejectedGenericFinalOutputs",
      "draft.validation.forbiddenOutputGateIdsChecked",
      "draft.validation.rejectedOldBehaviorSignalsChecked",
      "topLevel.endpointProof",
      "summary.scenarioComparison",
    ],
    fakePrecisePaceMatches,
    fakePersonalHrMatches,
    editableDefaultHrMatches,
  };
}

function findUnresolvedRangePaths(value: unknown) {
  const unresolved: string[] = [];

  walkValues(value, "draft.calendarRows", (path, current) => {
    if (!isRangeLike(current)) {
      return;
    }

    if (current.min !== current.max) {
      unresolved.push(path);
    }
  });

  return unresolved;
}

function walkStrings(value: unknown, path: string, visit: (path: string, value: string) => void) {
  walkValues(value, path, (currentPath, currentValue) => {
    if (typeof currentValue === "string") {
      visit(currentPath, currentValue);
    }
  });
}

function walkValues(value: unknown, path: string, visit: (path: string, value: unknown) => void) {
  visit(path, value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walkValues(item, `${path}[${index}]`, visit);
    });
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  Object.entries(value).forEach(([key, child]) => {
    walkValues(child, `${path}.${key}`, visit);
  });
}

function isRangeLike(value: unknown): value is { min: number; max: number } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { min?: unknown; max?: unknown };
  return typeof candidate.min === "number" && typeof candidate.max === "number";
}

function isDevelopmentTouch(kind: string) {
  return ["strides", "tempo", "threshold", "intervals", "hills"].includes(kind);
}

function maxWeekNumber(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return Math.max(...rows.map((row) => row.weekNumber));
}

function writeJson(fileName: string, value: unknown) {
  writeFileSync(join(ARTIFACT_DIR, fileName), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeReadme() {
  writeFileSync(
    join(ARTIFACT_DIR, "README.md"),
    `# Running Plan Engine Scenario JSON Pack

Generated for QA fixture inspection on 2026-06-09.

Scope: deterministic preview-only running plan engine for 10K, Half Marathon, and Marathon Base.
No Supabase mutation, no OpenAI, no create/confirm/persistence path.

Run:

\`\`\`bash
node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts
\`\`\`

Proof focus:

- preview-ready non-rest rows have exact executable duration/distance/repeat/recovery values
- beginner Half Marathon and Marathon Base remain unavailable
- 10K endpoint remains exact 10000m
- Half Marathon endpoint remains exact 21100m
- Marathon Base remains an honest base endpoint, not 42195m race readiness
- professional_competitive development sequences differ from runs_a_lot
- no fake precise pace or personal HR targets are emitted
`,
    "utf8",
  );
}

main();
