import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  RUNNING_PLAN_COMPOSITION_GRAMMAR_VERSION,
  type BuildRunningPlanPreviewInput,
  type BuildTenKPlanPreviewInput,
  type RunningPlanDaysPerWeek,
  type RunningPlanDistanceFamily,
  type RunningPlanPrescriptionGrammarSummary,
  type RunningPlanRunnerLevel,
  type RunnerFacingRichnessSummary,
} from "../../src/lib/plan-creation-engine";
import type { WeekdayName } from "../../src/lib/weekday-rest-invariants";

export const COACH_REVIEW_ARTIFACT_DIR =
  "qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix";

export type ScenarioInput = BuildTenKPlanPreviewInput | BuildRunningPlanPreviewInput;
export type ScenarioSet = "acceptance_gate" | "coach_review_matrix";
export type BodyProfile = keyof typeof runnerBasicsByProfile;
export type RestPattern = keyof typeof restPatterns;
export type LongRunPreference = keyof typeof longRunPreferences;
export type StartPattern = keyof typeof startPatterns;

export interface ScenarioDefinition {
  scenarioId: string;
  scenarioSet: ScenarioSet;
  bodyProfile: BodyProfile;
  bodyProfileLabel: string;
  bodyLoadProfile: string;
  daysPerWeek: RunningPlanDaysPerWeek;
  restPattern: RestPattern;
  restPatternLabel: string;
  longRunPreference: LongRunPreference;
  longRunPreferenceLabel: string;
  startPattern: StartPattern;
  startPatternLabel: string;
  input: ScenarioInput;
}

export interface CoachReviewScenarioComparisonEntry {
  scenarioId: string;
  status: "preview_ready" | "preview_unavailable";
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  bodyProfile: BodyProfile;
  bodyLoadProfile: string;
  daysPerWeek: RunningPlanDaysPerWeek;
  restPattern: RestPattern;
  longRunPreference: LongRunPreference;
  startPattern: StartPattern;
  unavailableReason?: {
    code: string;
    message: string;
  };
  runnerFacingRichness?: RunnerFacingRichnessSummary;
  prescriptionGrammar?: RunningPlanPrescriptionGrammarSummary;
}

export interface CoachReviewScenarioSummary {
  generatedAt: string;
  artifactDirectory: string;
  summaryKind: ScenarioSet;
  scenarioCount: number;
  previewReadyScenarios: readonly string[];
  unavailableScenarios: readonly unknown[];
  unresolvedRangeCount: number;
  unresolvedExecutableSegmentCount: number;
  matrixDimensionCoverage: ReturnType<typeof buildMatrixDimensionCoverage>;
  unavailableReasonCounts: Record<string, number>;
  metricTruthProof: {
    fakePrecisePaceScenarioList: readonly string[];
    fakePersonalHrScenarioList: readonly string[];
    forbiddenRunnerFacingLanguageScenarioList: readonly string[];
  };
  compositionGrammarProof: {
    scenariosWithForbiddenCombinationHits: readonly unknown[];
    scenariosWithMultipleDevelopmentTouches: readonly string[];
  };
  runnerFacingRichnessProof: {
    scenariosWithIssues: readonly unknown[];
    maxIdentityDesertByScenario: Record<string, number>;
    distinctNonLongRunSignalsByScenario: Record<string, readonly string[]>;
  };
  prescriptionGrammarProof: {
    scenariosWithIssues: readonly unknown[];
    awkwardStandardDurationScenarioList: readonly string[];
    vagueEffortOnlyTargetScenarioList: readonly string[];
    fakePaceTargetScenarioList: readonly string[];
    fakePersonalHrTargetScenarioList: readonly string[];
  };
  createConfirmPersistBoundaryProof: {
    createPathEnabled: boolean;
    confirmPathEnabled: boolean;
    persistPathEnabled: boolean;
  };
  scenarioComparison: readonly CoachReviewScenarioComparisonEntry[];
}

const runnerBasicsByProfile = {
  young_light: { age: 24, heightCm: 172, weightKg: 58 },
  average_adult: { age: 36, heightCm: 178, weightKg: 74 },
  older_heavier: { age: 58, heightCm: 176, weightKg: 96 },
  tall_heavier: { age: 42, heightCm: 190, weightKg: 105 },
  shorter_light: { age: 33, heightCm: 160, weightKg: 52 },
} as const;

const bodyProfileLabels: Record<BodyProfile, string> = {
  young_light: "young/light",
  average_adult: "average adult",
  older_heavier: "older/heavier",
  tall_heavier: "tall/heavier",
  shorter_light: "shorter/light",
};

const bodyLoadProfiles: Record<BodyProfile, string> = {
  young_light: "standard_load",
  average_adult: "standard_load",
  older_heavier: "conservative_load",
  tall_heavier: "conservative_load",
  shorter_light: "standard_load",
};

const restPatterns = {
  none: {
    label: "none",
    fixedRestDays: [] as readonly WeekdayName[],
  },
  wednesday_saturday: {
    label: "Wed/Sat",
    fixedRestDays: ["Wednesday", "Saturday"] as readonly WeekdayName[],
  },
  monday_friday: {
    label: "Mon/Fri",
    fixedRestDays: ["Monday", "Friday"] as readonly WeekdayName[],
  },
  tuesday_to_friday: {
    label: "Tue-Fri compressed",
    fixedRestDays: ["Tuesday", "Wednesday", "Thursday", "Friday"] as readonly WeekdayName[],
  },
} as const;

const longRunPreferences = {
  sunday: {
    label: "Sunday",
    preferredLongRunDay: "Sunday" as WeekdayName,
  },
  saturday: {
    label: "Saturday",
    preferredLongRunDay: "Saturday" as WeekdayName,
  },
  unset_default: {
    label: "unset/default",
    preferredLongRunDay: null,
  },
} as const;

const startPatterns = {
  normal_monday: {
    label: "normal Monday start",
    startDate: "2026-06-15",
  },
  midweek_wednesday: {
    label: "midweek Wednesday start",
    startDate: "2026-06-17",
  },
} as const;

const distanceFamilies = ["10K", "Half Marathon", "Marathon Base", "Marathon Completion"] as const;
const runnerLevels = [
  "beginner_new_runner",
  "sometimes_runs",
  "runs_a_lot",
  "professional_competitive",
] as const;
const bodyProfileKeys = [
  "young_light",
  "average_adult",
  "older_heavier",
  "tall_heavier",
  "shorter_light",
] as const;
const daysPerWeekValues = [3, 4, 5] as const satisfies readonly RunningPlanDaysPerWeek[];
const restPatternKeys = [
  "none",
  "wednesday_saturday",
  "monday_friday",
  "tuesday_to_friday",
] as const;
const longRunPreferenceKeys = ["sunday", "saturday", "unset_default"] as const;
const startPatternKeys = ["normal_monday", "midweek_wednesday"] as const;

export function buildScenarioDefinition({
  scenarioId,
  scenarioSet,
  distanceFamily,
  runnerLevel,
  bodyProfile,
  daysPerWeek,
  restPattern,
  longRunPreference,
  startPattern,
}: {
  scenarioId: string;
  scenarioSet: ScenarioSet;
  distanceFamily: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  bodyProfile: BodyProfile;
  daysPerWeek: RunningPlanDaysPerWeek;
  restPattern: RestPattern;
  longRunPreference: LongRunPreference;
  startPattern: StartPattern;
}): ScenarioDefinition {
  const restPatternDefinition = restPatterns[restPattern];
  const longRunPreferenceDefinition = longRunPreferences[longRunPreference];
  const startPatternDefinition = startPatterns[startPattern];

  return {
    scenarioId,
    scenarioSet,
    bodyProfile,
    bodyProfileLabel: bodyProfileLabels[bodyProfile],
    bodyLoadProfile: bodyLoadProfiles[bodyProfile],
    daysPerWeek,
    restPattern,
    restPatternLabel: restPatternDefinition.label,
    longRunPreference,
    longRunPreferenceLabel: longRunPreferenceDefinition.label,
    startPattern,
    startPatternLabel: startPatternDefinition.label,
    input: {
      ...runnerBasicsByProfile[bodyProfile],
      daysPerWeek,
      fixedRestDays: [...restPatternDefinition.fixedRestDays],
      preferredLongRunDay: longRunPreferenceDefinition.preferredLongRunDay,
      startDate: startPatternDefinition.startDate,
      runnerLevel,
      distanceFamily,
    },
  };
}

export function buildCoachReviewScenarioDefinitions(): readonly ScenarioDefinition[] {
  const definitions: ScenarioDefinition[] = [];

  for (const distanceFamily of distanceFamilies) {
    for (const runnerLevel of runnerLevels) {
      for (const bodyProfile of bodyProfileKeys) {
        for (const daysPerWeek of daysPerWeekValues) {
          const rotationIndex = definitions.length;
          const restPattern = restPatternKeys[rotationIndex % restPatternKeys.length]!;
          const longRunPreference =
            longRunPreferenceKeys[
              Math.floor(rotationIndex / restPatternKeys.length) % longRunPreferenceKeys.length
            ]!;
          const startPattern =
            startPatternKeys[
              Math.floor(rotationIndex / (restPatternKeys.length * longRunPreferenceKeys.length)) %
                startPatternKeys.length
            ]!;

          definitions.push(
            buildScenarioDefinition({
              scenarioId: [
                "matrix",
                slugFamily(distanceFamily),
                runnerLevel,
                bodyProfile,
                `${daysPerWeek}d`,
                restPattern,
                longRunPreference,
                startPattern,
              ].join("__"),
              scenarioSet: "coach_review_matrix",
              distanceFamily,
              runnerLevel,
              bodyProfile,
              daysPerWeek,
              restPattern,
              longRunPreference,
              startPattern,
            }),
          );
        }
      }
    }
  }

  for (const distanceFamily of distanceFamilies) {
    for (const runnerLevel of runnerLevels) {
      for (const restPattern of restPatternKeys) {
        for (const longRunPreference of longRunPreferenceKeys) {
          for (const startPattern of startPatternKeys) {
            definitions.push(
              buildScenarioDefinition({
                scenarioId: [
                  "schedule_stress",
                  slugFamily(distanceFamily),
                  runnerLevel,
                  restPattern,
                  longRunPreference,
                  startPattern,
                ].join("__"),
                scenarioSet: "coach_review_matrix",
                distanceFamily,
                runnerLevel,
                bodyProfile: "average_adult",
                daysPerWeek: runnerLevel === "beginner_new_runner" ? 3 : 4,
                restPattern,
                longRunPreference,
                startPattern,
              }),
            );
          }
        }
      }
    }
  }

  return definitions;
}

export function buildMatrixDimensionCoverage(definitions: readonly ScenarioDefinition[]) {
  return {
    families: uniqueStrings(definitions.map((definition) => definition.input.distanceFamily)),
    runnerLevels: uniqueStrings(definitions.map((definition) => definition.input.runnerLevel)),
    bodyProfiles: uniqueStrings(definitions.map((definition) => definition.bodyProfile)),
    bodyLoadProfiles: uniqueStrings(definitions.map((definition) => definition.bodyLoadProfile)),
    daysPerWeek: uniqueStrings(definitions.map((definition) => String(definition.daysPerWeek))),
    restPatterns: uniqueStrings(definitions.map((definition) => definition.restPattern)),
    longRunPreferences: uniqueStrings(
      definitions.map((definition) => definition.longRunPreference),
    ),
    startPatterns: uniqueStrings(definitions.map((definition) => definition.startPattern)),
  };
}

export function buildCoachReviewSubset(summary: CoachReviewScenarioSummary) {
  const criteria: Array<{
    label: string;
    family: RunningPlanDistanceFamily;
    runnerLevel: RunningPlanRunnerLevel;
    bodyProfile?: BodyProfile;
    bodyLoadProfile?: string;
    expectedStatus?: CoachReviewScenarioComparisonEntry["status"];
    expectedUnavailableCode?: string;
    daysPerWeek?: RunningPlanDaysPerWeek;
    restPattern?: RestPattern;
    longRunPreference?: LongRunPreference;
  }> = [
    {
      label: "beginner 10K young/light",
      family: "10K",
      runnerLevel: "beginner_new_runner",
      bodyProfile: "young_light",
      expectedStatus: "preview_ready",
    },
    {
      label: "beginner 10K heavier",
      family: "10K",
      runnerLevel: "beginner_new_runner",
      bodyLoadProfile: "conservative_load",
      expectedStatus: "preview_ready",
    },
    {
      label: "sometimes_runs 10K average",
      family: "10K",
      runnerLevel: "sometimes_runs",
      bodyProfile: "average_adult",
      expectedStatus: "preview_ready",
    },
    {
      label: "sometimes_runs 10K heavier",
      family: "10K",
      runnerLevel: "sometimes_runs",
      bodyLoadProfile: "conservative_load",
      expectedStatus: "preview_ready",
    },
    {
      label: "runs_a_lot 10K",
      family: "10K",
      runnerLevel: "runs_a_lot",
      expectedStatus: "preview_ready",
    },
    {
      label: "professional 10K",
      family: "10K",
      runnerLevel: "professional_competitive",
      expectedStatus: "preview_ready",
    },
    {
      label: "sometimes_runs Half Marathon",
      family: "Half Marathon",
      runnerLevel: "sometimes_runs",
      expectedStatus: "preview_ready",
    },
    {
      label: "conservative Half Marathon durability",
      family: "Half Marathon",
      runnerLevel: "runs_a_lot",
      bodyLoadProfile: "conservative_load",
      expectedStatus: "preview_ready",
    },
    {
      label: "runs_a_lot Half Marathon",
      family: "Half Marathon",
      runnerLevel: "runs_a_lot",
      expectedStatus: "preview_ready",
    },
    {
      label: "professional Half Marathon",
      family: "Half Marathon",
      runnerLevel: "professional_competitive",
      expectedStatus: "preview_ready",
    },
    {
      label: "sometimes_runs Marathon Base",
      family: "Marathon Base",
      runnerLevel: "sometimes_runs",
      expectedStatus: "preview_ready",
    },
    {
      label: "runs_a_lot heavy Marathon Base",
      family: "Marathon Base",
      runnerLevel: "runs_a_lot",
      bodyLoadProfile: "conservative_load",
      expectedStatus: "preview_ready",
    },
    {
      label: "professional Marathon Base",
      family: "Marathon Base",
      runnerLevel: "professional_competitive",
      expectedStatus: "preview_ready",
    },
    {
      label: "beginner Marathon Completion",
      family: "Marathon Completion",
      runnerLevel: "beginner_new_runner",
      bodyProfile: "young_light",
      daysPerWeek: 5,
      expectedStatus: "preview_ready",
    },
    {
      label: "sometimes_runs Marathon Completion",
      family: "Marathon Completion",
      runnerLevel: "sometimes_runs",
      expectedStatus: "preview_ready",
    },
    {
      label: "runs_a_lot heavy Marathon Completion",
      family: "Marathon Completion",
      runnerLevel: "runs_a_lot",
      bodyLoadProfile: "conservative_load",
      expectedStatus: "preview_ready",
    },
    {
      label: "professional Marathon Completion",
      family: "Marathon Completion",
      runnerLevel: "professional_competitive",
      expectedStatus: "preview_ready",
    },
    {
      label: "beginner Half Marathon bridge",
      family: "Half Marathon",
      runnerLevel: "beginner_new_runner",
      bodyProfile: "average_adult",
      daysPerWeek: 3,
      expectedStatus: "preview_ready",
    },
    {
      label: "beginner Marathon Base honest base",
      family: "Marathon Base",
      runnerLevel: "beginner_new_runner",
      bodyProfile: "young_light",
      daysPerWeek: 5,
      expectedStatus: "preview_ready",
    },
    {
      label: "conservative beginner Marathon Base honest base",
      family: "Marathon Base",
      runnerLevel: "beginner_new_runner",
      bodyLoadProfile: "conservative_load",
      expectedStatus: "preview_ready",
    },
    {
      label: "blocked long-run rest conflict",
      family: "10K",
      runnerLevel: "sometimes_runs",
      restPattern: "wednesday_saturday",
      longRunPreference: "saturday",
      expectedStatus: "preview_unavailable",
      expectedUnavailableCode: "long_run_day_blocked",
    },
    {
      label: "blocked compressed Half Marathon",
      family: "Half Marathon",
      runnerLevel: "runs_a_lot",
      restPattern: "tuesday_to_friday",
      longRunPreference: "sunday",
      daysPerWeek: 3,
      expectedStatus: "preview_unavailable",
      expectedUnavailableCode: "builder_validation_failed",
    },
  ];

  const selections = criteria.map((criterion) => {
    const entry = summary.scenarioComparison.find(
      (candidate) =>
        candidate.family === criterion.family &&
        candidate.runnerLevel === criterion.runnerLevel &&
        (!criterion.bodyProfile || candidate.bodyProfile === criterion.bodyProfile) &&
        (!criterion.bodyLoadProfile || candidate.bodyLoadProfile === criterion.bodyLoadProfile) &&
        (!criterion.daysPerWeek || candidate.daysPerWeek === criterion.daysPerWeek) &&
        (!criterion.restPattern || candidate.restPattern === criterion.restPattern) &&
        (!criterion.longRunPreference ||
          candidate.longRunPreference === criterion.longRunPreference) &&
        (!criterion.expectedStatus || candidate.status === criterion.expectedStatus) &&
        (!criterion.expectedUnavailableCode ||
          candidate.unavailableReason?.code === criterion.expectedUnavailableCode),
    );
    assert.ok(entry, `Expected coach-review subset scenario for ${criterion.label}.`);

    return {
      label: criterion.label,
      scenarioId: entry.scenarioId,
      scenarioFile: `${entry.scenarioId}.json`,
      status: entry.status,
      family: entry.family,
      runnerLevel: entry.runnerLevel,
      bodyProfile: entry.bodyProfile,
      bodyLoadProfile: entry.bodyLoadProfile,
      daysPerWeek: entry.daysPerWeek,
      restPattern: entry.restPattern,
      longRunPreference: entry.longRunPreference,
      startPattern: entry.startPattern,
      unavailableReason: entry.unavailableReason ?? null,
    };
  });

  return {
    generatedAt: summary.generatedAt,
    artifactDirectory: summary.artifactDirectory,
    purpose:
      "Small representative subset for Running Coach review. Full matrix remains available beside this file.",
    selectionCount: selections.length,
    selections,
  };
}

export function validateCoachReviewMatrixProof(
  summary: CoachReviewScenarioSummary,
  subset: ReturnType<typeof buildCoachReviewSubset>,
) {
  assert.equal(summary.summaryKind, "coach_review_matrix");
  assert.ok(summary.scenarioCount >= 300, "Coach review matrix must be broad, not static.");
  assert.ok(summary.previewReadyScenarios.length > 0, "Matrix must include preview-ready cases.");
  assert.ok(summary.unavailableScenarios.length > 0, "Matrix must keep unavailable cases.");
  assert.equal(summary.unresolvedRangeCount, 0);
  assert.equal(summary.unresolvedExecutableSegmentCount, 0);
  assert.deepEqual(summary.metricTruthProof.fakePrecisePaceScenarioList, []);
  assert.deepEqual(summary.metricTruthProof.fakePersonalHrScenarioList, []);
  assert.deepEqual(summary.metricTruthProof.forbiddenRunnerFacingLanguageScenarioList, []);
  assert.deepEqual(summary.compositionGrammarProof.scenariosWithForbiddenCombinationHits, []);
  assert.deepEqual(summary.compositionGrammarProof.scenariosWithMultipleDevelopmentTouches, []);
  assert.deepEqual(summary.runnerFacingRichnessProof.scenariosWithIssues, []);
  assert.deepEqual(summary.prescriptionGrammarProof.scenariosWithIssues, []);
  assert.deepEqual(summary.prescriptionGrammarProof.awkwardStandardDurationScenarioList, []);
  assert.deepEqual(summary.prescriptionGrammarProof.vagueEffortOnlyTargetScenarioList, []);
  assert.deepEqual(summary.prescriptionGrammarProof.fakePaceTargetScenarioList, []);
  assert.deepEqual(summary.prescriptionGrammarProof.fakePersonalHrTargetScenarioList, []);
  assert.equal(summary.createConfirmPersistBoundaryProof.createPathEnabled, false);
  assert.equal(summary.createConfirmPersistBoundaryProof.confirmPathEnabled, false);
  assert.equal(summary.createConfirmPersistBoundaryProof.persistPathEnabled, false);
  assert.equal(subset.selectionCount, 22);

  assertDimensionCoverage(summary.matrixDimensionCoverage.families, distanceFamilies);
  assertDimensionCoverage(summary.matrixDimensionCoverage.runnerLevels, runnerLevels);
  assertDimensionCoverage(summary.matrixDimensionCoverage.bodyProfiles, bodyProfileKeys);
  assertDimensionCoverage(summary.matrixDimensionCoverage.daysPerWeek, ["3", "4", "5"]);
  assertDimensionCoverage(summary.matrixDimensionCoverage.restPatterns, restPatternKeys);
  assertDimensionCoverage(
    summary.matrixDimensionCoverage.longRunPreferences,
    longRunPreferenceKeys,
  );
  assertDimensionCoverage(summary.matrixDimensionCoverage.startPatterns, startPatternKeys);

  validateBeginnerHalfMarathonBridgeMatrix(summary);
  validateUniversalNoDeadEndMatrix(summary);
  assert.equal(
    summary.unavailableReasonCounts.unsupported_runner_level_for_family ?? 0,
    0,
    "Coach-plausible plans must not be blocked by runner level alone.",
  );
  assert.ok(
    summary.unavailableReasonCounts.long_run_day_blocked > 0,
    "Matrix must keep blocked long-run/rest-day cases instead of dropping them.",
  );
  assert.ok(
    summary.unavailableReasonCounts.builder_validation_failed > 0,
    "Matrix must bound compressed low-availability plans as builder_validation_failed.",
  );
}

function validateBeginnerHalfMarathonBridgeMatrix(summary: CoachReviewScenarioSummary) {
  const beginnerHalfEntries = summary.scenarioComparison.filter(
    (entry) => entry.family === "Half Marathon" && entry.runnerLevel === "beginner_new_runner",
  );
  const unsupportedBeginnerHalfEntries = beginnerHalfEntries.filter(
    (entry) =>
      entry.status === "preview_unavailable" &&
      entry.unavailableReason?.code === "unsupported_runner_level_for_family",
  );

  assert.deepEqual(
    unsupportedBeginnerHalfEntries,
    [],
    "Coach-plausible beginner Half scenarios must not be blocked by runner level alone.",
  );

  for (const daysPerWeek of [3, 4, 5] as const) {
    for (const bodyLoadProfile of ["standard_load", "conservative_load"] as const) {
      const ready = beginnerHalfEntries.find(
        (entry) =>
          entry.status === "preview_ready" &&
          entry.daysPerWeek === daysPerWeek &&
          entry.bodyLoadProfile === bodyLoadProfile,
      );
      assert.ok(
        ready,
        `Beginner Half matrix must include preview-ready ${daysPerWeek}d ${bodyLoadProfile}.`,
      );

      const expectedWeeks =
        bodyLoadProfile === "conservative_load"
          ? ({ 3: 36, 4: 32, 5: 28 } as const)[daysPerWeek]
          : ({ 3: 32, 4: 28, 5: 24 } as const)[daysPerWeek];
      assert.equal(ready.weekCount, expectedWeeks);
      assert.equal(ready.endpointProof.endpointDistanceMeters, 21_100);
      assert.equal(ready.workoutKindCounts.threshold ?? 0, 0);
      assert.equal(ready.workoutKindCounts.intervals ?? 0, 0);
      assert.equal(ready.workoutKindCounts.hills ?? 0, 0);
      assert.ok(ready.workoutKindCounts.strides >= 2);
      assert.ok(ready.workoutKindCounts.cutback_long_run >= 4);
      assert.ok(
        ready.compositionGrammar.familySignals.some((signal) =>
          [
            "half_specific_durability",
            "half_long_run_durability",
            "half_long_run_steady_finish",
          ].includes(signal),
        ),
        `${ready.scenarioId} must preserve Half durability identity.`,
      );
    }
  }
}

function validateUniversalNoDeadEndMatrix(summary: CoachReviewScenarioSummary) {
  const unsupportedRunnerLevelEntries = summary.scenarioComparison.filter(
    (entry) =>
      entry.status === "preview_unavailable" &&
      entry.unavailableReason?.code === "unsupported_runner_level_for_family",
  );

  assert.deepEqual(
    unsupportedRunnerLevelEntries,
    [],
    "Normal running-plan previews must route through horizon selection instead of runner-level dead ends.",
  );

  const expectedWeeksByFamily: Record<
    RunningPlanDistanceFamily,
    {
      standard_load: Record<RunningPlanDaysPerWeek, number>;
      conservative_load: Record<RunningPlanDaysPerWeek, number>;
    }
  > = {
    "10K": {
      standard_load: { 3: 16, 4: 14, 5: 12 },
      conservative_load: { 3: 20, 4: 18, 5: 16 },
    },
    "Half Marathon": {
      standard_load: { 3: 32, 4: 28, 5: 24 },
      conservative_load: { 3: 36, 4: 32, 5: 28 },
    },
    "Marathon Base": {
      standard_load: { 3: 40, 4: 32, 5: 24 },
      conservative_load: { 3: 52, 4: 40, 5: 32 },
    },
    "Marathon Completion": {
      standard_load: { 3: 80, 4: 64, 5: 56 },
      conservative_load: { 3: 96, 4: 76, 5: 68 },
    },
  };

  for (const family of distanceFamilies) {
    for (const daysPerWeek of [3, 4, 5] as const) {
      for (const bodyLoadProfile of ["standard_load", "conservative_load"] as const) {
        const ready = summary.scenarioComparison.find(
          (entry) =>
            entry.status === "preview_ready" &&
            entry.family === family &&
            entry.runnerLevel === "beginner_new_runner" &&
            entry.daysPerWeek === daysPerWeek &&
            entry.bodyLoadProfile === bodyLoadProfile,
        );

        assert.ok(
          ready,
          `Beginner ${family} matrix must include preview-ready ${daysPerWeek}d ${bodyLoadProfile}.`,
        );
        assert.equal(ready.weekCount, expectedWeeksByFamily[family][bodyLoadProfile][daysPerWeek]);

        if (family === "10K") {
          assert.equal(ready.endpointProof.endpointDistanceMeters, 10_000);
        } else if (family === "Half Marathon") {
          assert.equal(ready.endpointProof.endpointDistanceMeters, 21_100);
        } else if (family === "Marathon Base") {
          assert.equal(ready.endpointProof.endpointDistanceMeters, null);
          assert.equal(ready.workoutKindCounts.threshold ?? 0, 0);
          assert.equal(ready.workoutKindCounts.intervals ?? 0, 0);
          assert.equal(ready.workoutKindCounts.hills ?? 0, 0);
          assert.equal(ready.workoutKindCounts.tempo ?? 0, 0);
        } else {
          assert.equal(ready.endpointProof.endpointDistanceMeters, 42_195);
          assert.equal(ready.workoutKindCounts.marathon_base_endpoint ?? 0, 0);
          assert.equal(ready.workoutKindCounts.threshold ?? 0, 0);
          assert.equal(ready.workoutKindCounts.intervals ?? 0, 0);
          assert.equal(ready.workoutKindCounts.hills ?? 0, 0);
        }
      }
    }
  }
}

export function writeCoachReviewReadme(
  artifactDirectory: string,
  summary: CoachReviewScenarioSummary,
) {
  writeFileSync(
    join(artifactDirectory, "README.md"),
    `# Running Plan Engine Dynamic Scenario Matrix

Generated for Running Coach review on 2026-06-09.

Scope: deterministic preview-only running plan engine for 10K, Half Marathon, Marathon Base, and Marathon Completion.
No Supabase mutation, no OpenAI, no create/confirm/persistence path.

Run:

\`\`\`bash
node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts
\`\`\`

Outputs:

- \`summary.json\`: aggregate proof across the full dynamic matrix
- \`coach-review-subset.json\`: representative scenario list for human coaching review
- \`*.json\`: full scenario output, including preview-ready and preview-unavailable cases

Matrix dimensions:

- families: ${summary.matrixDimensionCoverage.families.join(", ")}
- runner levels: ${summary.matrixDimensionCoverage.runnerLevels.join(", ")}
- body/load profiles: ${summary.matrixDimensionCoverage.bodyProfiles.join(", ")}
- days/week: ${summary.matrixDimensionCoverage.daysPerWeek.join(", ")}
- rest patterns: ${summary.matrixDimensionCoverage.restPatterns.join(", ")}
- long-run preferences: ${summary.matrixDimensionCoverage.longRunPreferences.join(", ")}
- start patterns: ${summary.matrixDimensionCoverage.startPatterns.join(", ")}

Proof snapshot:

- total scenarios: ${summary.scenarioCount}
- preview-ready scenarios: ${summary.previewReadyScenarios.length}
- preview-unavailable scenarios: ${summary.unavailableScenarios.length}
- unresolved range count: ${summary.unresolvedRangeCount}
- unresolved executable segment count: ${summary.unresolvedExecutableSegmentCount}
- fake precise pace scenario list: ${summary.metricTruthProof.fakePrecisePaceScenarioList.length}
- fake personal HR scenario list: ${summary.metricTruthProof.fakePersonalHrScenarioList.length}
- forbidden runner-facing language scenario list: ${summary.metricTruthProof.forbiddenRunnerFacingLanguageScenarioList.length}

Review guidance:

- Start with \`coach-review-subset.json\` for a small human-readable pass.
- Use \`summary.json\` to inspect aggregate load, family, development-sequence, endpoint, and metric-truth proof.
- Inspect individual scenario JSON files only when a subset or summary row needs deeper review.
`,
    "utf8",
  );
}

function assertDimensionCoverage(
  actual: readonly string[],
  expected: readonly (string | number)[],
) {
  assert.deepEqual([...actual].sort(), expected.map((value) => String(value)).sort());
}

function slugFamily(family: RunningPlanDistanceFamily) {
  return family.toLowerCase().replace(/\s+/g, "_");
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values)];
}
