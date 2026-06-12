import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildHalfMarathonPlanPreviewDraft,
  buildMarathonBasePlanPreviewDraft,
  buildMarathonCompletionPlanPreviewDraft,
  buildTenKPlanPreviewDraft,
  isRunningPlanCompositionDevelopmentTouch,
  resolveRunningPlanCompositionWeek,
  RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
  runningPlanPrescriptionIsExact,
  summarizeRunnerFacingPreviewRichness,
  summarizeRunningPlanPreviewPrescriptionGrammar,
  type BuildRunningPlanPreviewInput,
  type BuildTenKPlanPreviewInput,
  type RunningPlanCompositionSignal,
  type RunningPlanDistanceFamily,
  type RunningPlanPreviewCalendarRow,
  type RunningPlanPreviewLoadContext,
  type RunningPlanRunnerLevel,
} from "../src/lib/plan-creation-engine";
import { findForbiddenRunnerFacingLanguageMatchesInText } from "../src/lib/plan-creation-engine/forbidden-runner-facing-language";
import {
  buildCoachReviewScenarioDefinitions,
  buildCoachReviewSubset,
  buildMatrixDimensionCoverage,
  buildScenarioDefinition,
  COACH_REVIEW_ARTIFACT_DIR,
  validateCoachReviewMatrixProof,
  writeCoachReviewReadme,
  type BodyProfile,
  type ScenarioDefinition,
  type ScenarioInput,
  type ScenarioSet,
} from "./running-plan-engine-scenarios/coach-review-matrix";

const ACCEPTANCE_ARTIFACT_DIR = "qa-artifacts/plan-engine-scenarios/2026-06-09";

const baseInput = {
  daysPerWeek: 5,
  fixedRestDays: ["Wednesday", "Saturday"],
  preferredLongRunDay: "Sunday",
  startDate: "2026-06-15",
} as const;

const scenarios: readonly ScenarioDefinition[] = [
  scenario("beginner_light_10k", "10K", "beginner_new_runner", "young_light"),
  scenario("beginner_heavy_10k", "10K", "beginner_new_runner", "older_heavier"),
  scenario("sometimes_runs_average_10k", "10K", "sometimes_runs", "average_adult"),
  scenario("runs_a_lot_light_10k", "10K", "runs_a_lot", "young_light"),
  scenario("professional_competitive_10k", "10K", "professional_competitive", "young_light"),
  scenario("beginner_half_marathon", "Half Marathon", "beginner_new_runner", "average_adult"),
  scenario("sometimes_runs_half_marathon", "Half Marathon", "sometimes_runs", "average_adult"),
  scenario("runs_a_lot_half_marathon", "Half Marathon", "runs_a_lot", "young_light"),
  scenario(
    "professional_competitive_half_marathon",
    "Half Marathon",
    "professional_competitive",
    "young_light",
  ),
  scenario("beginner_marathon_base", "Marathon Base", "beginner_new_runner", "average_adult"),
  scenario("sometimes_runs_marathon_base", "Marathon Base", "sometimes_runs", "average_adult"),
  scenario("runs_a_lot_heavy_marathon_base", "Marathon Base", "runs_a_lot", "older_heavier"),
  scenario(
    "professional_competitive_marathon_base",
    "Marathon Base",
    "professional_competitive",
    "young_light",
  ),
  scenario(
    "beginner_marathon_completion",
    "Marathon Completion",
    "beginner_new_runner",
    "average_adult",
  ),
  scenario(
    "sometimes_runs_marathon_completion",
    "Marathon Completion",
    "sometimes_runs",
    "average_adult",
  ),
  scenario(
    "runs_a_lot_heavy_marathon_completion",
    "Marathon Completion",
    "runs_a_lot",
    "older_heavier",
  ),
  scenario(
    "professional_competitive_marathon_completion",
    "Marathon Completion",
    "professional_competitive",
    "young_light",
  ),
];

type ScenarioSummary = ReturnType<typeof buildSummary>;
type ScenarioComparisonEntry = ScenarioSummary["scenarioComparison"][number];
type PreviewReadyScenarioComparisonEntry = Extract<
  ScenarioComparisonEntry,
  { status: "preview_ready" }
>;

function main() {
  const acceptancePack = writeScenarioPack({
    artifactDirectory: ACCEPTANCE_ARTIFACT_DIR,
    definitions: scenarios,
    summaryKind: "acceptance_gate",
  });
  validateScenarioProof(acceptancePack.summary);

  const coachReviewDefinitions = buildCoachReviewScenarioDefinitions();
  const coachReviewPack = writeScenarioPack({
    artifactDirectory: COACH_REVIEW_ARTIFACT_DIR,
    definitions: coachReviewDefinitions,
    summaryKind: "coach_review_matrix",
    preservedJsonFiles: ["coach-review-subset.json"],
  });
  const coachReviewSubset = buildCoachReviewSubset(coachReviewPack.summary);
  writeJson(COACH_REVIEW_ARTIFACT_DIR, "coach-review-subset.json", coachReviewSubset);
  validateCoachReviewMatrixProof(coachReviewPack.summary, coachReviewSubset);

  console.log("Running plan engine scenario JSON generated.", {
    acceptance: {
      artifactDirectory: ACCEPTANCE_ARTIFACT_DIR,
      scenarioCount: acceptancePack.summary.scenarioCount,
      previewReadyCount: acceptancePack.summary.previewReadyScenarios.length,
      unavailableCount: acceptancePack.summary.unavailableScenarios.length,
      staleJsonRemoved: acceptancePack.cleanup.staleJsonRemoved,
    },
    coachReview: {
      artifactDirectory: COACH_REVIEW_ARTIFACT_DIR,
      scenarioCount: coachReviewPack.summary.scenarioCount,
      previewReadyCount: coachReviewPack.summary.previewReadyScenarios.length,
      unavailableCount: coachReviewPack.summary.unavailableScenarios.length,
      unresolvedRangeCount: coachReviewPack.summary.unresolvedRangeCount,
      unresolvedExecutableSegmentCount: coachReviewPack.summary.unresolvedExecutableSegmentCount,
      coachReviewSubsetCount: coachReviewSubset.selections.length,
      staleJsonRemoved: coachReviewPack.cleanup.staleJsonRemoved,
    },
  });
}

function scenario(
  scenarioId: string,
  distanceFamily: RunningPlanDistanceFamily,
  runnerLevel: RunningPlanRunnerLevel,
  bodyProfile: BodyProfile,
): ScenarioDefinition {
  return buildScenarioDefinition({
    scenarioId,
    scenarioSet: "acceptance_gate",
    distanceFamily,
    runnerLevel,
    bodyProfile,
    daysPerWeek: baseInput.daysPerWeek,
    restPattern: "wednesday_saturday",
    longRunPreference: "sunday",
    startPattern: "normal_monday",
  });
}

function writeScenarioPack({
  artifactDirectory,
  definitions,
  summaryKind,
  preservedJsonFiles = [],
}: {
  artifactDirectory: string;
  definitions: readonly ScenarioDefinition[];
  summaryKind: ScenarioSet;
  preservedJsonFiles?: readonly string[];
}) {
  mkdirSync(artifactDirectory, { recursive: true });
  const cleanup = pruneStaleScenarioJsonFiles({
    artifactDirectory,
    generatedScenarioIds: definitions.map((definition) => definition.scenarioId),
    preservedJsonFiles: ["summary.json", ...preservedJsonFiles],
  });

  const outputs = definitions.map((definition) => {
    const output = buildScenarioOutput(definition);
    writeJson(artifactDirectory, `${definition.scenarioId}.json`, output);
    return output;
  });

  const summary = buildSummary(outputs, {
    artifactDirectory,
    summaryKind,
    matrixDimensionCoverage: buildMatrixDimensionCoverage(definitions),
  });
  writeJson(artifactDirectory, "summary.json", summary);
  writeReadme(artifactDirectory, summaryKind, summary);

  return { outputs, summary, cleanup };
}

function pruneStaleScenarioJsonFiles({
  artifactDirectory,
  generatedScenarioIds,
  preservedJsonFiles,
}: {
  artifactDirectory: string;
  generatedScenarioIds: readonly string[];
  preservedJsonFiles: readonly string[];
}) {
  if (!existsSync(artifactDirectory)) {
    return { staleJsonRemoved: 0, removedFiles: [] as string[] };
  }

  const expectedJsonFiles = new Set([
    ...generatedScenarioIds.map((scenarioId) => `${scenarioId}.json`),
    ...preservedJsonFiles,
  ]);
  const removedFiles: string[] = [];

  for (const fileName of readdirSync(artifactDirectory)) {
    if (!fileName.endsWith(".json") || expectedJsonFiles.has(fileName)) {
      continue;
    }

    rmSync(join(artifactDirectory, fileName), { force: true });
    removedFiles.push(fileName);
  }

  return { staleJsonRemoved: removedFiles.length, removedFiles };
}

function buildScenarioOutput(definition: ScenarioDefinition) {
  const result = buildScenario(definition.input);
  if (!result.ok) {
    return {
      scenarioId: definition.scenarioId,
      scenarioSet: definition.scenarioSet,
      status: "preview_unavailable" as const,
      family: definition.input.distanceFamily,
      runnerLevel: definition.input.runnerLevel,
      bodyProfile: definition.bodyProfile,
      bodyProfileLabel: definition.bodyProfileLabel,
      bodyLoadProfile: definition.bodyLoadProfile,
      daysPerWeek: definition.daysPerWeek,
      restPattern: definition.restPattern,
      restPatternLabel: definition.restPatternLabel,
      longRunPreference: definition.longRunPreference,
      longRunPreferenceLabel: definition.longRunPreferenceLabel,
      startPattern: definition.startPattern,
      startPatternLabel: definition.startPatternLabel,
      input: definition.input,
      unavailable: result.unavailable,
    };
  }

  const draft = result.draft;
  const exactness = summarizeExactness(draft.calendarRows);
  const metricTruthScan = scanRunnerFacingMetricTruth(draft.calendarRows);
  const runnerFacingRichness = summarizeRunnerFacingPreviewRichness({
    family: draft.planFamily,
    runnerLevel: definition.input.runnerLevel,
    loadContext: draft.normalizedInputSummary.loadContext,
    rows: draft.calendarRows,
  });
  const prescriptionGrammar = summarizeRunningPlanPreviewPrescriptionGrammar(draft.calendarRows);

  return {
    scenarioId: definition.scenarioId,
    scenarioSet: definition.scenarioSet,
    status: "preview_ready" as const,
    family: draft.planFamily,
    runnerLevel: definition.input.runnerLevel,
    bodyProfile: definition.bodyProfile,
    bodyProfileLabel: definition.bodyProfileLabel,
    bodyLoadProfile: definition.bodyLoadProfile,
    daysPerWeek: definition.daysPerWeek,
    restPattern: definition.restPattern,
    restPatternLabel: definition.restPatternLabel,
    longRunPreference: definition.longRunPreference,
    longRunPreferenceLabel: definition.longRunPreferenceLabel,
    startPattern: definition.startPattern,
    startPatternLabel: definition.startPatternLabel,
    sourceKind: draft.sourceKind,
    loadContext: draft.normalizedInputSummary.loadContext,
    weekCount: maxWeekNumber(draft.calendarRows),
    rowCount: draft.calendarRows.length,
    nonRestRowCount: draft.calendarRows.filter((row) => !row.isRestDay).length,
    workoutKindCounts: countWorkoutKinds(draft.calendarRows),
    developmentSequence: developmentSequence(draft.calendarRows),
    compositionGrammar: summarizeCompositionGrammar({
      rows: draft.calendarRows,
      family: draft.planFamily,
      runnerLevel: definition.input.runnerLevel,
      loadContext: draft.normalizedInputSummary.loadContext,
    }),
    durabilitySignals: summarizeDurabilitySignals(draft.calendarRows),
    longRunDetailVariety: summarizeLongRunDetailVariety(draft.calendarRows),
    runnerFacingRichness,
    prescriptionGrammar,
    endpointProof: draft.endpointProof,
    exactness,
    fakePrecisePaceAppears: metricTruthScan.fakePrecisePaceMatches.length > 0,
    fakePersonalHrAppears: metricTruthScan.fakePersonalHrMatches.length > 0,
    forbiddenRunnerFacingLanguageAppears:
      metricTruthScan.forbiddenRunnerFacingLanguageMatches.length > 0,
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

  if (input.distanceFamily === "Marathon Base") {
    return buildMarathonBasePlanPreviewDraft(input as BuildRunningPlanPreviewInput);
  }

  return buildMarathonCompletionPlanPreviewDraft(input as BuildRunningPlanPreviewInput);
}

function buildSummary(
  outputs: readonly ReturnType<typeof buildScenarioOutput>[],
  {
    artifactDirectory,
    summaryKind,
    matrixDimensionCoverage,
  }: {
    artifactDirectory: string;
    summaryKind: ScenarioSet;
    matrixDimensionCoverage: ReturnType<typeof buildMatrixDimensionCoverage>;
  },
) {
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
    artifactDirectory,
    summaryKind,
    matrixDimensionCoverage,
    scenarioCount: outputs.length,
    previewReadyScenarios: readyOutputs.map((output) => output.scenarioId),
    unavailableScenarios: unavailableOutputs.map((output) => ({
      scenarioId: output.scenarioId,
      family: output.family,
      runnerLevel: output.runnerLevel,
      bodyProfile: output.bodyProfile,
      daysPerWeek: output.daysPerWeek,
      restPattern: output.restPattern,
      longRunPreference: output.longRunPreference,
      startPattern: output.startPattern,
      reason: output.unavailable.error,
    })),
    previewReadyCount: readyOutputs.length,
    unavailableCount: unavailableOutputs.length,
    countsByFamily: countBy(outputs, (output) => output.family),
    countsByRunnerLevel: countBy(outputs, (output) => output.runnerLevel),
    countsByBodyProfile: countBy(outputs, (output) => output.bodyProfile),
    countsByBodyLoadProfile: countBy(outputs, (output) => output.bodyLoadProfile),
    countsByDaysPerWeek: countBy(outputs, (output) => String(output.daysPerWeek)),
    countsByRestPattern: countBy(outputs, (output) => output.restPattern),
    countsByLongRunPreference: countBy(outputs, (output) => output.longRunPreference),
    countsByStartPattern: countBy(outputs, (output) => output.startPattern),
    countsByLoadContext: countBy(readyOutputs, (output) => output.loadContext),
    unavailableReasonCounts: countBy(unavailableOutputs, (output) => output.unavailable.error.code),
    rowCountSummary: summarizeNumberDistribution(readyOutputs.map((output) => output.rowCount)),
    nonRestRowCountSummary: summarizeNumberDistribution(
      readyOutputs.map((output) => output.nonRestRowCount),
    ),
    workoutKindCounts: aggregateWorkoutKindCounts(readyOutputs),
    developmentSequencesByScenario: Object.fromEntries(
      readyOutputs.map((output) => [output.scenarioId, output.developmentSequence]),
    ),
    compositionGrammarProof: {
      version: RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
      scenariosWithForbiddenCombinationHits: readyOutputs
        .filter((output) => output.compositionGrammar.forbiddenCombinationHits.length > 0)
        .map((output) => ({
          scenarioId: output.scenarioId,
          hits: output.compositionGrammar.forbiddenCombinationHits,
        })),
      scenariosWithMultipleDevelopmentTouches: readyOutputs
        .filter((output) =>
          Object.values(output.compositionGrammar.developmentTouchCountsByWeek).some(
            (count) => count > 1,
          ),
        )
        .map((output) => output.scenarioId),
      familySignalsByScenario: Object.fromEntries(
        readyOutputs.map((output) => [output.scenarioId, output.compositionGrammar.familySignals]),
      ),
    },
    runnerFacingRichnessProof: {
      scenariosWithIssues: readyOutputs
        .filter((output) => output.runnerFacingRichness.issues.length > 0)
        .map((output) => ({
          scenarioId: output.scenarioId,
          issues: output.runnerFacingRichness.issues,
        })),
      maxIdentityDesertByScenario: Object.fromEntries(
        readyOutputs.map((output) => [
          output.scenarioId,
          output.runnerFacingRichness.longestIdentityDesertWeeks,
        ]),
      ),
      distinctNonLongRunSignalsByScenario: Object.fromEntries(
        readyOutputs.map((output) => [
          output.scenarioId,
          output.runnerFacingRichness.distinctNonLongRunSignals,
        ]),
      ),
    },
    prescriptionGrammarProof: {
      scenariosWithIssues: readyOutputs
        .filter((output) => output.prescriptionGrammar.issueCount > 0)
        .map((output) => ({
          scenarioId: output.scenarioId,
          issues: output.prescriptionGrammar.issues,
        })),
      awkwardStandardDurationScenarioList: readyOutputs
        .filter((output) => output.prescriptionGrammar.awkwardStandardDurationCount > 0)
        .map((output) => output.scenarioId),
      vagueEffortOnlyTargetScenarioList: readyOutputs
        .filter((output) => output.prescriptionGrammar.vagueEffortOnlyTargetCount > 0)
        .map((output) => output.scenarioId),
      fakePaceTargetScenarioList: readyOutputs
        .filter((output) => output.prescriptionGrammar.fakePaceTargetCount > 0)
        .map((output) => output.scenarioId),
      fakePersonalHrTargetScenarioList: readyOutputs
        .filter((output) => output.prescriptionGrammar.fakePersonalHrTargetCount > 0)
        .map((output) => output.scenarioId),
    },
    endpointProof: {
      tenKExactEndpointScenarios: readyOutputs
        .filter(
          (output) =>
            output.family === "10K" && output.endpointProof.endpointDistanceMeters === 10_000,
        )
        .map((output) => output.scenarioId),
      halfExactEndpointScenarios: readyOutputs
        .filter(
          (output) =>
            output.family === "Half Marathon" &&
            output.endpointProof.endpointDistanceMeters === 21_100,
        )
        .map((output) => output.scenarioId),
      marathonBaseHonestEndpointScenarios: readyOutputs
        .filter(
          (output) =>
            output.family === "Marathon Base" &&
            output.endpointProof.endpointDistanceMeters === null,
        )
        .map((output) => output.scenarioId),
      marathonCompletionExactEndpointScenarios: readyOutputs
        .filter(
          (output) =>
            output.family === "Marathon Completion" &&
            output.endpointProof.endpointDistanceMeters === 42_195,
        )
        .map((output) => output.scenarioId),
    },
    unresolvedRangeCount,
    unresolvedExecutableSegmentCount,
    metricTruthProof: {
      unresolvedRangeCount,
      unresolvedExecutableSegmentCount,
      fakePrecisePaceScenarioList: readyOutputs
        .filter((output) => output.fakePrecisePaceAppears)
        .map((output) => output.scenarioId),
      fakePersonalHrScenarioList: readyOutputs
        .filter((output) => output.fakePersonalHrAppears)
        .map((output) => output.scenarioId),
      forbiddenRunnerFacingLanguageScenarioList: readyOutputs
        .filter((output) => output.forbiddenRunnerFacingLanguageAppears)
        .map((output) => output.scenarioId),
      editableDefaultHrAdvisoryScenarioList: readyOutputs
        .filter((output) => output.defaultHrReadback.appears)
        .map((output) => output.scenarioId),
    },
    createConfirmPersistBoundaryProof: {
      previewOnly: true,
      callsOpenAi: false,
      mutatesSupabase: false,
      createPathEnabled: false,
      confirmPathEnabled: false,
      persistPathEnabled: false,
      evidence:
        "Scenario generator calls deterministic preview builders only and writes local QA artifacts.",
    },
    scenarioComparison: outputs.map((output) => {
      if (output.status === "preview_unavailable") {
        return {
          scenarioId: output.scenarioId,
          scenarioSet: output.scenarioSet,
          status: output.status,
          family: output.family,
          runnerLevel: output.runnerLevel,
          bodyProfile: output.bodyProfile,
          bodyProfileLabel: output.bodyProfileLabel,
          bodyLoadProfile: output.bodyLoadProfile,
          daysPerWeek: output.daysPerWeek,
          restPattern: output.restPattern,
          restPatternLabel: output.restPatternLabel,
          longRunPreference: output.longRunPreference,
          longRunPreferenceLabel: output.longRunPreferenceLabel,
          startPattern: output.startPattern,
          startPatternLabel: output.startPatternLabel,
          unavailableReason: output.unavailable.error,
        };
      }

      return {
        scenarioId: output.scenarioId,
        scenarioSet: output.scenarioSet,
        status: output.status,
        family: output.family,
        runnerLevel: output.runnerLevel,
        bodyProfile: output.bodyProfile,
        bodyProfileLabel: output.bodyProfileLabel,
        bodyLoadProfile: output.bodyLoadProfile,
        daysPerWeek: output.daysPerWeek,
        restPattern: output.restPattern,
        restPatternLabel: output.restPatternLabel,
        longRunPreference: output.longRunPreference,
        longRunPreferenceLabel: output.longRunPreferenceLabel,
        startPattern: output.startPattern,
        startPatternLabel: output.startPatternLabel,
        sourceKind: output.sourceKind,
        loadContext: output.loadContext,
        weekCount: output.weekCount,
        rowCount: output.rowCount,
        nonRestRowCount: output.nonRestRowCount,
        workoutKindCounts: output.workoutKindCounts,
        developmentSequence: output.developmentSequence,
        compositionGrammar: output.compositionGrammar,
        durabilitySignals: output.durabilitySignals,
        longRunDetailVariety: output.longRunDetailVariety,
        runnerFacingRichness: output.runnerFacingRichness,
        prescriptionGrammar: output.prescriptionGrammar,
        endpointProof: output.endpointProof,
        exactness: output.exactness,
        fakePrecisePaceAppears: output.fakePrecisePaceAppears,
        fakePersonalHrAppears: output.fakePersonalHrAppears,
        forbiddenRunnerFacingLanguageAppears: output.forbiddenRunnerFacingLanguageAppears,
        defaultHrReadback: output.defaultHrReadback,
        metricTruthScan: output.metricTruthScan,
      };
    }),
  };
}

function countBy<T>(values: readonly T[], getKey: (value: T) => string) {
  return values.reduce<Record<string, number>>((counts, value) => {
    const key = getKey(value);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function summarizeNumberDistribution(values: readonly number[]) {
  if (values.length === 0) {
    return { min: null, max: null, uniqueValues: [] as number[] };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    uniqueValues: [...new Set(values)].sort((left, right) => left - right),
  };
}

function aggregateWorkoutKindCounts(
  outputs: readonly Extract<ReturnType<typeof buildScenarioOutput>, { status: "preview_ready" }>[],
) {
  return outputs.reduce<Record<string, number>>((aggregate, output) => {
    for (const [workoutKind, count] of Object.entries(output.workoutKindCounts)) {
      aggregate[workoutKind] = (aggregate[workoutKind] ?? 0) + count;
    }

    return aggregate;
  }, {});
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
  assert.equal(summary.scenarioCount, 17);
  assert.equal(summary.unresolvedRangeCount, 0);
  assert.equal(summary.unresolvedExecutableSegmentCount, 0);
  assert.deepEqual(summary.unavailableScenarios, []);
  assert.deepEqual(
    summary.runnerFacingRichnessProof.scenariosWithIssues,
    [],
    "Acceptance scenarios must satisfy runner-facing richness gates.",
  );
  assert.deepEqual(
    summary.prescriptionGrammarProof.scenariosWithIssues,
    [],
    "Acceptance scenarios must satisfy executable prescription grammar gates.",
  );

  const comparison = new Map(
    summary.scenarioComparison.map((entry) => [entry.scenarioId, entry] as const),
  );
  const tenK = comparison.get("professional_competitive_10k");
  const runsALotTenK = comparison.get("runs_a_lot_light_10k");
  const proHalf = comparison.get("professional_competitive_half_marathon");
  const runsALotHalf = comparison.get("runs_a_lot_half_marathon");
  const sometimesHalf = comparison.get("sometimes_runs_half_marathon");
  const beginnerHalf = comparison.get("beginner_half_marathon");
  const beginnerMarathon = comparison.get("beginner_marathon_base");
  const proMarathon = comparison.get("professional_competitive_marathon_base");
  const sometimesMarathon = comparison.get("sometimes_runs_marathon_base");
  const runsALotMarathon = comparison.get("runs_a_lot_heavy_marathon_base");
  const beginnerMarathonCompletion = comparison.get("beginner_marathon_completion");
  const sometimesMarathonCompletion = comparison.get("sometimes_runs_marathon_completion");
  const runsALotMarathonCompletion = comparison.get("runs_a_lot_heavy_marathon_completion");
  const proMarathonCompletion = comparison.get("professional_competitive_marathon_completion");

  assertReady(tenK);
  assertReady(runsALotTenK);
  assertReady(sometimesHalf);
  assertReady(beginnerHalf);
  assertReady(beginnerMarathon);
  assertReady(proHalf);
  assertReady(runsALotHalf);
  assertReady(sometimesMarathon);
  assertReady(proMarathon);
  assertReady(runsALotMarathon);
  assertReady(beginnerMarathonCompletion);
  assertReady(sometimesMarathonCompletion);
  assertReady(runsALotMarathonCompletion);
  assertReady(proMarathonCompletion);
  assert.notDeepEqual(tenK.developmentSequence, runsALotTenK.developmentSequence);
  assert.notDeepEqual(proHalf.developmentSequence, runsALotHalf.developmentSequence);
  assert.notDeepEqual(proMarathon.developmentSequence, runsALotMarathon.developmentSequence);
  assert.notDeepEqual(
    proMarathonCompletion.developmentSequence,
    runsALotMarathonCompletion.developmentSequence,
  );
  assert.equal(tenK.endpointProof.endpointDistanceMeters, 10_000);
  assert.ok(
    sometimesHalf.durabilitySignals.halfSpecificDurabilityRows.length > 0,
    "sometimes_runs_half_marathon must expose half-specific durability signal.",
  );
  assert.ok(
    sometimesHalf.longRunDetailVariety.checkpointIntentCount >= 2,
    "sometimes_runs_half_marathon long runs must vary checkpoint intent.",
  );
  assert.equal(beginnerHalf.weekCount, 24);
  assert.equal(beginnerHalf.rowCount, 168);
  assert.equal(beginnerHalf.nonRestRowCount, 120);
  assert.equal(beginnerHalf.endpointProof.endpointDistanceMeters, 21_100);
  assert.equal(beginnerHalf.workoutKindCounts.threshold ?? 0, 0);
  assert.equal(beginnerHalf.workoutKindCounts.intervals ?? 0, 0);
  assert.equal(beginnerHalf.workoutKindCounts.hills ?? 0, 0);
  assert.ok(
    beginnerHalf.workoutKindCounts.strides >= 3,
    "beginner_half_marathon must include light strides after adaptation.",
  );
  assert.ok(
    beginnerHalf.workoutKindCounts.cutback_long_run >= 4,
    "beginner_half_marathon must include repeated cutback long runs.",
  );
  assert.ok(
    beginnerHalf.durabilitySignals.halfSpecificDurabilityRows.length > 0,
    "beginner_half_marathon must expose half-specific durability signal.",
  );
  assert.ok(
    beginnerHalf.longRunDetailVariety.checkpointIntentCount >= 2,
    "beginner_half_marathon long runs must vary checkpoint intent.",
  );
  assert.equal(beginnerMarathon.weekCount, 24);
  assert.equal(beginnerMarathon.rowCount, 168);
  assert.equal(beginnerMarathon.nonRestRowCount, 120);
  assert.equal(beginnerMarathon.endpointProof.endpointDistanceMeters, null);
  assert.equal(beginnerMarathon.workoutKindCounts.tempo ?? 0, 0);
  assert.equal(beginnerMarathon.workoutKindCounts.threshold ?? 0, 0);
  assert.equal(beginnerMarathon.workoutKindCounts.intervals ?? 0, 0);
  assert.equal(beginnerMarathon.workoutKindCounts.hills ?? 0, 0);
  assert.ok(
    beginnerMarathon.compositionGrammar.familySignals.some((signal) =>
      ["marathon_base_time_on_feet", "marathon_base_steady_finish"].includes(signal),
    ),
    "beginner_marathon_base must use conservative durability before the base endpoint.",
  );
  assert.ok(
    beginnerMarathon.longRunDetailVariety.finishIntentCount >= 2,
    "beginner_marathon_base long runs must vary finish intent without marathon race-readiness claims.",
  );
  assert.ok(
    sometimesMarathon.longRunDetailVariety.finishIntentCount >= 2,
    "sometimes_runs_marathon_base long runs must vary finish intent.",
  );
  assert.equal(proHalf.endpointProof.endpointDistanceMeters, 21_100);
  assert.equal(proMarathon.endpointProof.endpointDistanceMeters, null);
  assert.equal(beginnerMarathonCompletion.weekCount, 56);
  assert.equal(beginnerMarathonCompletion.rowCount, 392);
  assert.equal(beginnerMarathonCompletion.nonRestRowCount, 280);
  assert.equal(beginnerMarathonCompletion.endpointProof.endpointDistanceMeters, 42_195);
  assert.equal(beginnerMarathonCompletion.workoutKindCounts.marathon_base_endpoint ?? 0, 0);
  assert.equal(beginnerMarathonCompletion.workoutKindCounts.tempo ?? 0, 0);
  assert.equal(beginnerMarathonCompletion.workoutKindCounts.threshold ?? 0, 0);
  assert.equal(beginnerMarathonCompletion.workoutKindCounts.intervals ?? 0, 0);
  assert.equal(beginnerMarathonCompletion.workoutKindCounts.hills ?? 0, 0);
  assert.ok(
    beginnerMarathonCompletion.workoutKindCounts.strides >= 4,
    "beginner_marathon_completion must include gentle stride support.",
  );
  assert.ok(
    beginnerMarathonCompletion.workoutKindCounts.steady_aerobic_run >= 4,
    "beginner_marathon_completion must include steady support without hard intensity.",
  );
  assert.ok(
    beginnerMarathonCompletion.compositionGrammar.familySignals.includes(
      "marathon_completion_exact_endpoint",
    ),
    "beginner_marathon_completion must prove exact 42195m endpoint grammar signal.",
  );
  assert.ok(
    beginnerMarathonCompletion.compositionGrammar.familySignals.includes(
      "marathon_completion_long_run_durability",
    ),
    "beginner_marathon_completion must prove long-run durability grammar signal.",
  );
  assert.equal(sometimesMarathonCompletion.endpointProof.endpointDistanceMeters, 42_195);
  assert.equal(runsALotMarathonCompletion.endpointProof.endpointDistanceMeters, 42_195);
  assert.equal(proMarathonCompletion.endpointProof.endpointDistanceMeters, 42_195);
  assert.equal(sometimesMarathonCompletion.workoutKindCounts.marathon_base_endpoint ?? 0, 0);
  assert.equal(runsALotMarathonCompletion.workoutKindCounts.marathon_base_endpoint ?? 0, 0);
  assert.equal(proMarathonCompletion.workoutKindCounts.marathon_base_endpoint ?? 0, 0);

  for (const entry of summary.scenarioComparison) {
    if (entry.status !== "preview_ready") {
      continue;
    }
    assert.deepEqual(
      entry.compositionGrammar.forbiddenCombinationHits,
      [],
      `${entry.scenarioId} must not contain forbidden composition combinations.`,
    );
    assert.ok(
      Object.values(entry.compositionGrammar.developmentTouchCountsByWeek).every(
        (count) => count <= 1,
      ),
      `${entry.scenarioId} must not contain more than one development touch per week.`,
    );
    assert.equal(entry.fakePrecisePaceAppears, false);
    assert.equal(entry.fakePersonalHrAppears, false);
    assert.equal(entry.forbiddenRunnerFacingLanguageAppears, false);
    assert.equal(entry.prescriptionGrammar.issueCount, 0);
  }

  assert.ok(
    tenK.compositionGrammar.familySignals.includes("ten_k_repeatability"),
    "professional_competitive_10k must prove repeatability through composition grammar.",
  );
  assert.ok(
    runsALotTenK.compositionGrammar.familySignals.includes("ten_k_hill_strength"),
    "runs_a_lot_light_10k must prove hill-strength grammar signal.",
  );
  assert.ok(
    sometimesHalf.compositionGrammar.familySignals.some((signal) =>
      [
        "half_specific_durability",
        "half_long_run_durability",
        "half_long_run_steady_finish",
      ].includes(signal),
    ),
    "sometimes_runs_half_marathon must prove half-specific durability grammar signal.",
  );
  assert.ok(
    proHalf.compositionGrammar.familySignals.includes("half_threshold_durability"),
    "professional_competitive_half_marathon must prove threshold durability grammar signal.",
  );
  assert.ok(
    sometimesMarathon.compositionGrammar.familySignals.includes("marathon_base_time_on_feet"),
    "sometimes_runs_marathon_base must prove time-on-feet grammar signal.",
  );
  assert.ok(
    proMarathon.compositionGrammar.familySignals.includes("marathon_base_hill_strength"),
    "professional_competitive_marathon_base must prove hill-strength grammar signal.",
  );
  assert.ok(
    sometimesMarathonCompletion.compositionGrammar.familySignals.includes(
      "marathon_completion_steady_support",
    ),
    "sometimes_runs_marathon_completion must prove steady support grammar signal.",
  );
  assert.ok(
    proMarathonCompletion.compositionGrammar.familySignals.includes(
      "marathon_completion_specificity",
    ),
    "professional_competitive_marathon_completion must prove specific support grammar signal.",
  );
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

function summarizeCompositionGrammar({
  rows,
  family,
  runnerLevel,
  loadContext,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
}) {
  const horizonWeeks = maxWeekNumber(rows);
  const weekProofs = Array.from({ length: horizonWeeks }, (_, index) => {
    const weekNumber = index + 1;
    const composition = resolveRunningPlanCompositionWeek({
      family,
      runnerLevel,
      loadContext,
      weekNumber,
      horizonWeeks,
    });
    const weekRows = rows.filter((row) => row.weekNumber === weekNumber);
    const actualDevelopmentTouches = weekRows
      .filter(
        (row) => !row.isRestDay && isRunningPlanCompositionDevelopmentTouch(row.workoutDayKind),
      )
      .map((row) => row.workoutDayKind);

    return {
      weekNumber,
      archetype: composition.archetype,
      plannedDevelopmentTouch: composition.developmentTouch,
      actualDevelopmentTouches,
      longRunRole: composition.longRunRole,
      familySignals: composition.familySignals,
    };
  });

  return {
    version: RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
    weekArchetypeSequence: weekProofs.map((week) => `${week.weekNumber}:${week.archetype}`),
    plannedDevelopmentSequence: weekProofs
      .filter((week) => week.plannedDevelopmentTouch)
      .map((week) => `${week.weekNumber}:${week.plannedDevelopmentTouch}`),
    actualDevelopmentSequence: weekProofs.flatMap((week) =>
      week.actualDevelopmentTouches.map((touch) => `${week.weekNumber}:${touch}`),
    ),
    developmentTouchCountsByWeek: Object.fromEntries(
      weekProofs.map((week) => [week.weekNumber, week.actualDevelopmentTouches.length]),
    ),
    familySignals: uniqueStrings(
      weekProofs.flatMap((week) => week.familySignals),
    ) as RunningPlanCompositionSignal[],
    longRunRoleSequence: weekProofs.map((week) => `${week.weekNumber}:${week.longRunRole}`),
    forbiddenCombinationHits: findForbiddenCompositionHits({ rows, family }),
  };
}

function findForbiddenCompositionHits({
  rows,
  family,
}: {
  rows: readonly RunningPlanPreviewCalendarRow[];
  family: RunningPlanDistanceFamily;
}) {
  const hits: string[] = [];
  const horizonWeeks = maxWeekNumber(rows);

  for (let weekNumber = 1; weekNumber <= horizonWeeks; weekNumber += 1) {
    const weekRows = rows.filter((row) => row.weekNumber === weekNumber);
    const weekKinds = weekRows.filter((row) => !row.isRestDay).map((row) => row.workoutDayKind);
    const developmentTouches = weekKinds.filter(isRunningPlanCompositionDevelopmentTouch);

    if (developmentTouches.length > 1) {
      hits.push(`week_${weekNumber}_multiple_development_touches`);
    }

    if (weekKinds.includes("intervals") && weekKinds.includes("hills")) {
      hits.push(`week_${weekNumber}_intervals_plus_hills`);
    }

    if (family === "10K" && weekKinds.includes("threshold")) {
      hits.push(`week_${weekNumber}_10k_threshold`);
    }

    if (family === "Marathon Base" && weekKinds.includes("intervals")) {
      hits.push(`week_${weekNumber}_marathon_base_intervals`);
    }

    if (
      family === "Marathon Completion" &&
      weekKinds.some((kind) => ["threshold", "intervals", "hills"].includes(kind))
    ) {
      hits.push(`week_${weekNumber}_marathon_completion_hard_intensity`);
    }

    const hasSteadyFinishLongRun = weekRows.some(
      (row) =>
        row.workoutDayKind === "long_run" &&
        ["controlled_steady_finish", "durability_steady_finish"].includes(
          segmentIntensityLabel(row, "finish") ?? "",
        ),
    );
    const hasMidweekDevelopment = weekKinds.some((kind) =>
      ["tempo", "threshold", "intervals", "hills"].includes(kind),
    );
    if (hasSteadyFinishLongRun && hasMidweekDevelopment) {
      hits.push(`week_${weekNumber}_steady_finish_plus_midweek_development`);
    }
  }

  return hits;
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
  const forbiddenRunnerFacingLanguageMatches: Array<{
    path: string;
    value: string;
    signals: readonly string[];
  }> = [];
  const editableDefaultHrMatches: Array<{ path: string; value: string }> = [];

  walkStrings(rows, "draft.calendarRows", (path, value) => {
    const forbiddenMatches = findForbiddenRunnerFacingLanguageMatchesInText(value);
    if (
      forbiddenMatches.some((match) =>
        [
          "fake_precise_pace_token",
          "race_pace_claim",
          "goal_pace_claim",
          "target_pace_claim",
        ].includes(match.signal),
      )
    ) {
      fakePrecisePaceMatches.push({ path, value });
    }
    if (forbiddenMatches.some((match) => match.signal === "fake_personal_hr_token")) {
      fakePersonalHrMatches.push({ path, value });
    }
    if (forbiddenMatches.length > 0) {
      forbiddenRunnerFacingLanguageMatches.push({
        path,
        value,
        signals: [...new Set(forbiddenMatches.map((match) => match.signal))],
      });
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
    forbiddenRunnerFacingLanguageMatches,
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

function maxWeekNumber(rows: readonly RunningPlanPreviewCalendarRow[]) {
  return Math.max(...rows.map((row) => row.weekNumber));
}

function writeJson(artifactDirectory: string, fileName: string, value: unknown) {
  writeFileSync(join(artifactDirectory, fileName), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeReadme(
  artifactDirectory: string,
  summaryKind: ScenarioSet,
  summary: ScenarioSummary,
) {
  if (summaryKind === "coach_review_matrix") {
    writeCoachReviewReadme(artifactDirectory, summary);
    return;
  }

  writeFileSync(
    join(artifactDirectory, "README.md"),
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
- beginner Half Marathon is auto-extended into a preview-ready bridge plan
- beginner Marathon Base is auto-extended into an honest preview-ready base plan
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
