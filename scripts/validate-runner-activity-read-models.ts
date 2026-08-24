import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { recordRunnerActivitySessionRpeForUser } from "../src/lib/runner-activity/activity-evidence";
import { getRunnerActivityProgressFactsForUser } from "../src/lib/runner-activity/fact-snapshots";
import {
  createRunnerActivityPlannedWorkoutMatch,
  deleteRunnerActivityFromHistory,
  persistGarminFitActivitySource,
  removeRunnerActivityOriginalFilesForActivity,
} from "../src/lib/runner-activity/garmin-fit-source";
import { listRunnerActivityHistoryForUser } from "../src/lib/runner-activity/history-read-model";
import {
  projectRunnerActivityHistoryForProduct,
  projectRunnerActivityMutationReadbackForProduct,
  projectRunnerActivityProgressForProduct,
  projectRunnerFitnessProfileForContinuation,
  projectRunnerFitnessProfileForInitialPlan,
  projectRunnerFitnessProfileForOneOff,
  projectRunnerFitnessProfileForProgress,
  RUNNER_FITNESS_PROFILE_COMPONENT_STATES,
  type RunnerActivityHistoryProductPage,
  type RunnerActivityProgressProductModel,
} from "../src/lib/runner-activity/product-contract";
import {
  assembleRunnerFitnessProfileSnapshotV1,
  getRunnerActivityProgressForUser,
} from "../src/lib/runner-activity/read-model";
import { getPersistedRunnerCalendarSnapshot } from "../src/lib/runner-calendar-snapshot";
import { updateUserSettingsForUserId } from "../src/lib/user-settings-actions";
import { WORKOUT_RESULT_STORAGE_BUCKET } from "../src/lib/workout-result-import/internal-types";
import {
  addDaysIso,
  diffDaysIso,
  startOfWeekIso,
  todayIso,
  weekdayLong,
} from "../src/lib/training";
import {
  QA_TESTER_POOL,
  getQaUserOwnedCounts,
  resetQaPoolUserData,
} from "./lib/qa-test-user-lifecycle.mjs";
import {
  createRunnerActivityProofRuntime,
  loginQaPoolToLoopbackRuntime,
  withRunnerActivityProofLeases,
} from "./lib/runner-activity-proof-runtime";
import { seedRunnerDesignProfileFixture } from "./lib/runner-design-profile-fixture";
import { persistGate4SyntheticActivity } from "./lib/runner-activity-gate-4-fixture";

const boundaryOnly = process.argv.includes("--boundary-only");
const proofRuntime = boundaryOnly ? null : createRunnerActivityProofRuntime("gate2");
const { supabaseUrl, supabase, ensureUser, signedInClient } =
  proofRuntime ?? ({} as ReturnType<typeof createRunnerActivityProofRuntime>);
const AS_OF_DATE = todayIso();
const runtimeUrl =
  process.argv
    .find((argument) => argument.startsWith("--runtime-url="))
    ?.slice("--runtime-url=".length) ??
  process.env.RUNNER_ACTIVITY_RUNTIME_URL?.trim() ??
  null;
const scaleActivityCounts = parseScaleActivityCounts(process.argv.slice(2));
const PRIVATE_RUNNER_ACTIVITY_READ_MODEL = "runner-activity/read-model-types";
const PRODUCT_SOURCE_ROOTS = ["src/routes", "src/components"] as const;

async function main() {
  await proveProductReadModelImportBoundary();
  await proveRunnerFitnessProfileSnapshotContract();
  if (boundaryOnly) {
    console.log("Runner activity Product/read-model and fitness-profile boundaries passed.");
    return;
  }
  await withRunnerActivityProofLeases(["provider-engine", "isolation-a"], runValidation);
}

async function proveRunnerFitnessProfileSnapshotContract() {
  assert.deepEqual(RUNNER_FITNESS_PROFILE_COMPONENT_STATES, [
    "available",
    "partial",
    "unavailable",
    "updating",
    "not_applicable",
    "contradictory",
  ]);
  const history = fitnessProfileHistoryFixture();
  const fixture = fitnessProfileAssemblyFixture(history);
  const first = await assembleRunnerFitnessProfileSnapshotV1(fixture);
  const replay = await assembleRunnerFitnessProfileSnapshotV1(fixture);
  assert.deepEqual(replay, first);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.components.recent28Day.data), true);
  assert.match(first.snapshotId, /^[0-9a-f]{64}$/);
  assert.match(first.runnerFactsRevision, /^[0-9a-f]{64}$/);
  assert.equal(first.components.latestFive.data?.items.length, 5);
  assert.equal(first.components.latestFive.data?.inspectionOnly, true);
  assert.equal(first.components.rolling90Day.data?.acceptedActivityCount, 2);
  assert.equal(first.components.comparablePerformance.state, "unavailable");
  assert.deepEqual(first.components.comparablePerformance.reasonCodes, [
    "normalized_stream_not_persisted",
  ]);
  const serialized = JSON.stringify(first);
  assert.equal(serialized.includes("manual_garmin_fit"), false);
  assert.equal(serialized.includes("fit_current"), false);
  assert.equal(serialized.includes("detailChangeEligible"), false);

  const transportEquivalent = await assembleRunnerFitnessProfileSnapshotV1({
    ...fixture,
    history: {
      ...history,
      items: history.items.map((item) => ({
        ...item,
        source: {
          ...item.source,
          rawState: "removed" as const,
          originalRetained: false,
          reprocessingAvailable: false,
        },
        capabilities: { canRemoveOriginalFile: false },
      })),
    },
  });
  assert.deepEqual(transportEquivalent, first);

  const progressProjection = projectRunnerFitnessProfileForProgress(first);
  const initialPlanProjection = projectRunnerFitnessProfileForInitialPlan(first);
  const continuationProjection = projectRunnerFitnessProfileForContinuation(first);
  const oneOffProjection = projectRunnerFitnessProfileForOneOff(first);
  assert.equal(progressProjection.snapshotId, first.snapshotId);
  for (const projection of [
    progressProjection,
    initialPlanProjection,
    continuationProjection,
    oneOffProjection,
  ]) {
    assert.equal(projection.snapshotDefinitionVersion, first.version);
    assert.deepEqual(projection.formulaVersions, first.formulaVersions);
  }
  assert.equal(initialPlanProjection.runnerFactsRevision, first.runnerFactsRevision);
  assert.deepEqual(
    {
      state: initialPlanProjection.components.recent28Day.state,
      coverage: initialPlanProjection.components.recent28Day.coverage,
      reasonCodes: initialPlanProjection.components.recent28Day.reasonCodes,
    },
    {
      state: first.components.recent28Day.state,
      coverage: first.components.recent28Day.coverage,
      reasonCodes: first.components.recent28Day.reasonCodes,
    },
  );
  assert.deepEqual(
    initialPlanProjection.components.recent28Day.current,
    first.components.recent28Day.data?.current ?? null,
  );
  assert.deepEqual(
    initialPlanProjection.components.recent28Day.previous,
    first.components.recent28Day.data?.previous ?? null,
  );
  assert.deepEqual(
    initialPlanProjection.components.latestFive.coveredDates,
    first.components.latestFive.coverage.coveredDates,
  );
  assert.equal("items" in initialPlanProjection.components.latestFive, false);
  assert.equal("records" in initialPlanProjection.components.rolling90Day, false);
  assert.deepEqual(continuationProjection.comparableGroups, [
    {
      contextKey: "easy",
      acceptedActualDays: ["2026-08-01", "2026-08-08"],
      compatibleRpeDays: ["2026-08-01", "2026-08-08"],
    },
  ]);
  assert.equal("detailChangeEligible" in (continuationProjection.comparableGroups[0] ?? {}), false);
  assert.deepEqual(oneOffProjection.rolling90DayLongestDuration, {
    localDate: "2026-08-08",
    minutes: 60,
  });

  const changedRevision = await assembleRunnerFitnessProfileSnapshotV1({
    ...fixture,
    settings: fixture.settings
      ? { ...fixture.settings, profileRevision: fixture.settings.profileRevision + 1 }
      : null,
  });
  assert.notEqual(changedRevision.runnerFactsRevision, first.runnerFactsRevision);
  assert.notEqual(changedRevision.snapshotId, first.snapshotId);
  const contradictory = await assembleRunnerFitnessProfileSnapshotV1({
    ...fixture,
    evidence: { ...fixture.evidence, calendarOutcomeFingerprint: "9".repeat(64) },
  });
  assert.equal(contradictory.components.recent28Day.state, "contradictory");

  for (const [evidenceState, expectedState] of [
    ["completed_without_fit", "partial"],
    ["missing", "partial"],
    ["removed", "partial"],
    ["updating", "updating"],
  ] as const) {
    const stateSnapshot = await assembleRunnerFitnessProfileSnapshotV1({
      ...fixture,
      evidence: {
        ...fixture.evidence,
        workouts: fixture.evidence.workouts.map((workout, index) =>
          index === 0
            ? {
                ...workout,
                evidenceState,
                acceptedActualMetrics: null,
                missingReasons: [
                  evidenceState === "completed_without_fit"
                    ? "actual_metrics_missing"
                    : evidenceState === "updating"
                      ? "evidence_updating"
                      : evidenceState === "removed"
                        ? "evidence_removed"
                        : "evidence_missing",
                ],
              }
            : workout,
        ),
      },
    });
    assert.equal(stateSnapshot.components.recent28Day.state, expectedState);
    assert.equal(
      projectRunnerFitnessProfileForContinuation(stateSnapshot).comparableGroups[0]
        ?.acceptedActualDays.length,
      1,
    );
  }
}

function fitnessProfileAssemblyFixture(history: RunnerActivityHistoryProductPage) {
  const progress = fitnessProfileProgressFixture();
  const calendarOutcomeFingerprint = "a".repeat(64);
  return {
    userId: "00000000-0000-4000-8000-000000000253",
    asOf: "2026-08-10T12:00:00.000Z",
    cutoffDate: "2026-08-10",
    timeZone: "America/Sao_Paulo",
    settings: {
      firstName: null,
      lastName: null,
      displayName: null,
      email: null,
      avatarUrl: null,
      age: 35,
      weightKg: 70,
      heightCm: 175,
      fitnessLevel: "intermediate" as const,
      profileRevision: 7,
      trainingPreferences: {
        blocked_days: [],
        preferred_long_run_day: "Sunday" as const,
        max_running_days_per_week: 4,
      },
      heartRateZones: {
        source: "age_estimate" as const,
        bands: [],
      },
      calendarTimezone: "America/Sao_Paulo",
      calendarTimezoneSource: "runner_preference" as const,
      uiLocalePreference: null,
      uiLocalePreferenceContractViolation: false,
    },
    calendar: {
      asOf: "2026-08-10T12:00:00.000Z",
      cutoffDate: "2026-08-10",
      calendarOutcomeFingerprint,
      workouts: [
        continuationCalendarWorkout("workout-1", "2026-08-01", 4),
        continuationCalendarWorkout("workout-2", "2026-08-08", 5),
      ],
    },
    evidence: {
      asOf: "2026-08-10T12:00:00.000Z",
      cutoffDate: "2026-08-10",
      calendarOutcomeFingerprint,
      evidenceRevisionFingerprint: "b".repeat(64),
      dueWorkoutCount: 2,
      resolvedOutcomeCount: 2,
      workouts: [
        continuationEvidenceWorkout("workout-1", "2026-08-01"),
        continuationEvidenceWorkout("workout-2", "2026-08-08"),
      ],
    },
    progress,
    history,
  };
}

function continuationCalendarWorkout(id: string, workoutDate: string, sessionRpe: number) {
  return {
    calendarWorkoutId: id,
    workoutDate,
    workoutType: "easy",
    outcome: "completed" as const,
    outcomeRevision: `${id}:outcome-v1`,
    sessionRpe,
    lifecycleState: "scheduled" as const,
    workoutFingerprint: `${id}:fingerprint`,
  };
}

function continuationEvidenceWorkout(id: string, workoutDate: string) {
  return {
    calendarWorkoutId: id,
    workoutDate,
    outcome: "completed" as const,
    outcomeRevision: `${id}:outcome-v1`,
    sessionRpe: id === "workout-1" ? 4 : 5,
    evidenceState: "fit_current" as const,
    acceptedActualMetrics: {
      activityStartedAt: `${workoutDate}T10:00:00.000Z`,
      activityLocalDate: workoutDate,
      durationMin: id === "workout-1" ? 45 : 60,
      distanceKm: id === "workout-1" ? 8 : 10,
      averageHeartRate: 142,
      maximumHeartRate: 160,
      averagePower: null,
      maximumPower: null,
      averageCadence: 170,
      calories: null,
      elevationGainMetres: 50,
      elevationLossMetres: 50,
      intervalCount: null,
    },
    comparisonStatus: "complete" as const,
    missingReasons: [],
  };
}

function fitnessProfileHistoryFixture(): RunnerActivityHistoryProductPage {
  return {
    items: Array.from({ length: 6 }, (_, index) => {
      const day = String(8 - index).padStart(2, "0");
      const workoutId = index < 2 ? `workout-${index + 1}` : null;
      return {
        id: `activity-${index + 1}`,
        identity: { label: "Run" as const },
        historicalTime: {
          localDate: `2026-08-${day}`,
          startedAt: `2026-08-${day}T10:00:00.000Z`,
          timezone: "America/Sao_Paulo",
        },
        distanceKm: 8 + index,
        duration: { minutes: 45 + index, basis: "timer" as const },
        pace: { secondsPerKm: 330, basis: "timer" as const },
        observedHeartRate: { averageBpm: 140 + index },
        plannedWorkout: workoutId
          ? {
              id: workoutId,
              title: "Easy",
              workoutDate: index === 0 ? "2026-08-01" : "2026-08-08",
            }
          : null,
        source: {
          kind: "manual_garmin_fit" as const,
          rawState: "available" as const,
          originalRetained: true,
          reprocessingAvailable: true,
        },
        quality: { updating: false },
        capabilities: { canRemoveOriginalFile: true },
      };
    }),
    nextCursor: null,
  };
}

function fitnessProfileProgressFixture(): RunnerActivityProgressProductModel {
  const period = {
    id: "custom" as const,
    label: "Custom" as const,
    startDate: "2026-05-13",
    endDate: "2026-08-10",
    asOfDate: "2026-08-10",
    timezoneBasis: {
      period: "runner_calendar_timezone" as const,
      activities: "historical_local_date" as const,
      timeZone: "America/Sao_Paulo",
    },
    futureInterval: null,
  };
  const quickPeriod = (
    id: "this_week" | "last_7_days" | "last_1_month" | "last_6_months",
    label: "This week" | "Last 7 days" | "Last 1 month" | "Last 6 months",
  ) => ({ ...period, id, label });
  const points = [
    fitnessProfileSequencePoint("activity-1", 0, "2026-08-01", 45, 8),
    fitnessProfileSequencePoint("activity-2", 1, "2026-08-08", 60, 10),
  ];
  const sequenceCoverage = {
    distance: sequenceCoverageMetric(2, 2),
    timer_duration: sequenceCoverageMetric(2, 2),
    observed_average_pace: sequenceCoverageMetric(2, 2),
    elevation_gain: sequenceCoverageMetric(2, 2),
    reported_load: sequenceCoverageMetric(2, 2),
  };
  const currentLoad = sessionLoadWindow("2026-07-14", "2026-08-10", 360);
  const previousLoad = sessionLoadWindow("2026-06-16", "2026-07-13", 300);
  return {
    status: "current",
    asOfDate: "2026-08-10",
    rolling28Day: {
      current: progressSnapshot("2026-07-14", "2026-08-10", 2),
      previous: progressSnapshot("2026-06-16", "2026-07-13", 1),
    },
    calendarWeeks: [],
    fitProgress: {
      status: "unavailable",
      reason: "historical_formula_version_without_fit_progress",
    },
    fitActivitySequence: {
      formulaVersion: "runner_activity_fit_sequence_v1",
      evidenceLabel: "From FIT file",
      advertisedPeriods: [
        quickPeriod("this_week", "This week"),
        quickPeriod("last_7_days", "Last 7 days"),
        quickPeriod("last_1_month", "Last 1 month"),
        quickPeriod("last_6_months", "Last 6 months"),
      ],
      selectedPeriod: period,
      status: "ready",
      completeness: {
        state: "complete",
        eligibleActivityCount: 2,
        returnedPointCount: 2,
      },
      coverage: sequenceCoverage,
      points,
    },
    advancedMetrics: {
      status: "current",
      historical: false,
      asOfDate: "2026-08-10",
      sessionRpeLoad: {
        formulaVersion: "runner_activity_session_rpe_load_v1",
        rolling28Day: { current: currentLoad, previous: previousLoad },
        calendarWeeks: [],
      },
      records: {
        availability: "available",
        items: [],
        unavailableReasons: [],
      },
      detailedMetrics: {
        status: "unavailable",
        reason: "normalized_stream_not_persisted",
      },
    },
  };
}

function progressSnapshot(startDate: string, endDate: string, count: number) {
  const metric = (value: number, unit: "sessions" | "minutes" | "kilometers" | "meters") => ({
    availability: "available" as const,
    confidence: "complete" as const,
    value,
    unit,
    includedActivityCount: count,
    missingActivityCount: 0,
    missingReasons: [],
  });
  return {
    window: {
      startDate,
      endDate,
      cutoffDate: "2026-08-10",
      timezoneBasis: "historical_local_date" as const,
      weekStartsOn: "monday" as const,
    },
    formulaVersion: "runner_activity_progress_facts_v1",
    eligibleActivityCount: count,
    facts: {
      sessions: metric(count, "sessions"),
      runningTime: metric(count * 50, "minutes"),
      distance: metric(count * 9, "kilometers"),
      elevationGain: metric(count * 50, "meters"),
      longestDistance: metric(count === 0 ? 0 : 10, "kilometers"),
      longestDuration: metric(count === 0 ? 0 : 60, "minutes"),
    },
  };
}

function sessionLoadWindow(startDate: string, endDate: string, value: number) {
  return {
    startDate,
    endDate,
    metric: {
      availability: "available" as const,
      confidence: "complete" as const,
      value,
      displayValue: value,
      unit: "arbitrary_units" as const,
      includedObservationCount: 2,
      unavailableObservationCount: 0,
      unavailableReasons: [],
    },
  };
}

function sequenceCoverageMetric(includedCount: number, eligibleActivityCount: number) {
  return {
    includedCount,
    eligibleActivityCount,
    missingCount: eligibleActivityCount - includedCount,
    label: `${includedCount}/${eligibleActivityCount}`,
  };
}

function fitnessProfileSequencePoint(
  id: string,
  sequenceIndex: number,
  localDate: string,
  durationMin: number,
  distanceKm: number,
) {
  const observation = (
    observationId:
      | "distance"
      | "timer_duration"
      | "observed_average_pace"
      | "elevation_gain"
      | "reported_load",
    value: number,
    unit: "kilometers" | "minutes" | "seconds_per_kilometer" | "meters" | "arbitrary_units",
    unitLabel: "km" | "min" | "/km" | "m" | "AU",
  ) => ({
    id: observationId,
    label: observationId,
    state: "available" as const,
    value,
    displayValue: String(value),
    unit,
    unitLabel,
    reason: null,
    reasonLabel: null,
    coverage: { includedCount: 1 as const, candidateCount: 1 as const, missingCount: 0 as const },
    basis: {
      duration: observationId === "timer_duration" ? ("timer" as const) : null,
      distance: observationId === "distance" ? ("whole_activity" as const) : null,
      effort: observationId === "reported_load" ? ("session_rpe" as const) : null,
    },
  });
  return {
    id,
    sequenceIndex,
    sameDayOrder: 0,
    label: "Run" as const,
    historicalTime: { localDate, startedAt: `${localDate}T10:00:00.000Z`, timezone: "UTC" },
    context: { state: "available" as const, runningContext: "easy" },
    evidence: { state: "current" as const, label: "From FIT file" as const },
    observations: {
      distance: observation("distance", distanceKm, "kilometers", "km"),
      timer_duration: observation("timer_duration", durationMin, "minutes", "min"),
      observed_average_pace: observation(
        "observed_average_pace",
        330,
        "seconds_per_kilometer",
        "/km",
      ),
      elevation_gain: observation("elevation_gain", 50, "meters", "m"),
      reported_load: observation("reported_load", 180, "arbitrary_units", "AU"),
    },
  };
}

async function proveProductReadModelImportBoundary() {
  const candidates = (
    await Promise.all(PRODUCT_SOURCE_ROOTS.map((root) => readSourceFilesRecursively(root)))
  ).flat();
  assertNoProductReadModelImports(
    await Promise.all(
      candidates.map(async (file) => ({
        file,
        source: await readFile(file, "utf8"),
      })),
    ),
  );

  assert.throws(
    () =>
      assertNoProductReadModelImports([
        {
          file: "src/components/__runner-activity-boundary-negative-fixture.tsx",
          source:
            'import type { RunnerActivityFitChartPoint } from "@/lib/runner-activity/read-model-types";',
        },
      ]),
    /must import @\/lib\/runner-activity\/product-contract/,
  );
}

function assertNoProductReadModelImports(candidates: Array<{ file: string; source: string }>) {
  const violations = candidates
    .filter(({ source }) => importedModuleSpecifiers(source).length > 0)
    .map(({ file }) => relative(process.cwd(), file))
    .sort();
  assert.deepEqual(
    violations,
    [],
    `Runner Activity public boundary violation: ${violations.join(", ")} imports provider-private ${PRIVATE_RUNNER_ACTIVITY_READ_MODEL}. Product routes/components and Design System source must import @/lib/runner-activity/product-contract; Backend-private runner-activity modules and proof-only scripts remain allowed.`,
  );
}

function importedModuleSpecifiers(source: string) {
  return Array.from(
    source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g),
    (match) => match[1],
  ).filter((specifier) => specifier.includes(PRIVATE_RUNNER_ACTIVITY_READ_MODEL));
}

async function readSourceFilesRecursively(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) return readSourceFilesRecursively(path);
      return entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
        ? [path]
        : [];
    }),
  );
  return files.flat();
}

async function runValidation() {
  assertProductMutationReadback(
    projectRunnerActivityMutationReadbackForProduct({
      activityId: "00000000-0000-4000-8000-000000000001",
      status: "updating",
      history: null,
      progress: null,
      reason: "read_model_recalculation_pending",
    }),
  );
  const runtimeSessions = runtimeUrl
    ? {
        owner: await prepareRuntimePoolIdentity(runtimeUrl, "provider-engine"),
        other: await prepareRuntimePoolIdentity(runtimeUrl, "isolation-a"),
      }
    : null;
  const owner = await ensureUser("provider-engine");
  const other = await ensureUser("isolation-a");
  await resetQaPoolUserData({ supabase, userId: owner.id });
  await resetQaPoolUserData({ supabase, userId: other.id });

  try {
    const plannedWorkoutId = await createPlannedWorkout(owner.id);
    const activities = {
      currentLongest: await persistSyntheticActivity({
        userId: owner.id,
        key: "current-longest",
        localDate: addDaysIso(AS_OF_DATE, -1),
        timerDurationMin: 60,
        elapsedDurationMin: 65,
        distanceKm: 10,
        elevationGainM: 100,
        averageHeartRate: 142,
      }),
      currentEasy: await persistSyntheticActivity({
        userId: owner.id,
        key: "current-easy",
        localDate: addDaysIso(AS_OF_DATE, -7),
        timerDurationMin: 30,
        elapsedDurationMin: 34,
        distanceKm: 5,
        elevationGainM: null,
        averageHeartRate: null,
      }),
      elapsedOnly: await persistSyntheticActivity({
        userId: owner.id,
        key: "elapsed-only",
        localDate: addDaysIso(AS_OF_DATE, -13),
        timerDurationMin: null,
        elapsedDurationMin: 40,
        distanceKm: 5,
        elevationGainM: 20,
        averageHeartRate: 135,
      }),
      distanceMissing: await persistSyntheticActivity({
        userId: owner.id,
        key: "distance-missing",
        localDate: addDaysIso(AS_OF_DATE, -21),
        timerDurationMin: 20,
        elapsedDurationMin: 22,
        distanceKm: null,
        elevationGainM: null,
        averageHeartRate: null,
      }),
      previousWindow: await persistSyntheticActivity({
        userId: owner.id,
        key: "previous-window",
        localDate: addDaysIso(AS_OF_DATE, -33),
        timerDurationMin: 45,
        elapsedDurationMin: 48,
        distanceKm: 7,
        elevationGainM: null,
        averageHeartRate: 138,
      }),
    };
    await createRunnerActivityPlannedWorkoutMatch({
      userId: owner.id,
      activityId: activities.currentLongest.receipt.activityId,
      sourceRevisionId: activities.currentLongest.receipt.sourceRevisionId,
      plannedWorkoutId,
    });

    await proveHistoryPagination({
      userId: owner.id,
      plannedWorkoutId,
      longestActivityId: activities.currentLongest.receipt.activityId,
      elapsedOnlyActivityId: activities.elapsedOnly.receipt.activityId,
    });
    const firstProgress = await proveFactSnapshots(owner.id);
    await proveSnapshotRls({
      ownerRole: "provider-engine",
      otherRole: "isolation-a",
      snapshotId: firstProgress.rolling28Day.current.id,
    });
    await proveEmptyHistoryAndProgress(other.id);

    const sourceRemoval = await removeRunnerActivityOriginalFilesForActivity({
      userId: owner.id,
      activityId: activities.currentLongest.receipt.activityId,
    });
    assert.equal(sourceRemoval.status, "current");
    if (sourceRemoval.status !== "current") throw new Error("Expected current source readback.");
    assert.equal(
      sourceRemoval.progress.rolling28Day.current.id,
      firstProgress.rolling28Day.current.id,
    );
    assert.equal(
      sourceRemoval.history.items.find(
        (item) => item.id === activities.currentLongest.receipt.activityId,
      )?.source.rawState,
      "removed",
    );

    await removeRunnerActivityOriginalFilesForActivity({
      userId: owner.id,
      activityId: activities.elapsedOnly.receipt.activityId,
    });
    const corrected = await persistSyntheticActivity({
      userId: owner.id,
      key: "elapsed-only",
      localDate: addDaysIso(AS_OF_DATE, -13),
      timerDurationMin: 50,
      elapsedDurationMin: 52,
      distanceKm: 5,
      elevationGainM: 20,
      averageHeartRate: 135,
      storageSuffix: "correction",
    });
    assert.equal(corrected.receipt.activityId, activities.elapsedOnly.receipt.activityId);
    assert.notEqual(
      corrected.receipt.activityRevisionId,
      activities.elapsedOnly.receipt.activityRevisionId,
    );
    const correctedProgress = await getRunnerActivityProgressFactsForUser({
      userId: owner.id,
      asOfDate: AS_OF_DATE,
      creationCause: "correction",
    });
    assert.notEqual(
      correctedProgress.rolling28Day.current.id,
      firstProgress.rolling28Day.current.id,
    );
    assert.equal(correctedProgress.rolling28Day.current.facts.runningTime.value, 160);
    assert.equal(correctedProgress.rolling28Day.current.facts.runningTime.confidence, "complete");

    const deletionReadback = await deleteRunnerActivityFromHistory({
      userId: owner.id,
      activityId: activities.currentEasy.receipt.activityId,
    });
    assert.equal(deletionReadback.status, "current");
    if (deletionReadback.status !== "current") throw new Error("Expected current delete readback.");
    assert.equal(deletionReadback.history.items.length, 4);
    assert.equal(deletionReadback.progress.rolling28Day.current.facts.sessions.value, 3);
    assert.notEqual(
      deletionReadback.progress.rolling28Day.current.id,
      correctedProgress.rolling28Day.current.id,
    );
    const removedSnapshot = await supabase
      .from("runner_activity_fact_snapshots")
      .select("id")
      .eq("id", correctedProgress.rolling28Day.current.id)
      .maybeSingle();
    if (removedSnapshot.error) throw new Error(removedSnapshot.error.message);
    assert.equal(removedSnapshot.data, null);

    if (runtimeUrl) {
      assert.ok(runtimeSessions);
      await proveRuntimeRoutes({
        userId: owner.id,
        runtimeUrl,
        cookie: runtimeSessions.owner.cookie,
        otherCookie: runtimeSessions.other.cookie,
      });
    }
  } finally {
    await resetQaPoolUserData({ supabase, userId: owner.id });
    await resetQaPoolUserData({ supabase, userId: other.id });
  }

  const ownerCounts = await getQaUserOwnedCounts(supabase, owner.id);
  const otherCounts = await getQaUserOwnedCounts(supabase, other.id);
  assert.equal(ownerCounts.runner_activities, 0);
  assert.equal(ownerCounts.runner_activity_fact_snapshots, 0);
  assert.equal(otherCounts.runner_activities, 0);
  assert.equal(otherCounts.runner_activity_fact_snapshots, 0);
  const measurement = await measureSnapshotReconciliation(owner.id, 30);
  console.log(JSON.stringify({ snapshotReconciliationMeasurement: measurement }));
  for (const activityCount of scaleActivityCounts) {
    const scaleMeasurement = await measureSnapshotReconciliation(owner.id, activityCount);
    console.log(JSON.stringify({ snapshotReconciliationScaleMeasurement: scaleMeasurement }));
  }
  console.log("Runner activity Gate 2 read-model contract passed.");
}

function parseScaleActivityCounts(args: string[]) {
  const argument = args.find((value) => value.startsWith("--scale="));
  if (!argument) return [];
  const counts = argument
    .slice("--scale=".length)
    .split(",")
    .map((value) => Number.parseInt(value, 10));
  assert.ok(counts.length > 0);
  assert.ok(counts.every((value) => Number.isInteger(value) && value > 30 && value <= 3000));
  return Array.from(new Set(counts));
}

async function measureSnapshotReconciliation(userId: string, activityCount: number) {
  try {
    if (activityCount === 30) {
      await seedRunnerDesignProfileFixture({ supabase, userId, asOfDate: AS_OF_DATE });
    } else {
      await seedAdditionalSyntheticActivities({ userId, activityCount });
    }
    await clearDerivedMetricRows(userId);

    const beforeMiss = await getQaUserOwnedCounts(supabase, userId);
    assert.equal(beforeMiss.runner_activities, activityCount);
    const sequencePeriod =
      activityCount === 30
        ? undefined
        : {
            kind: "custom" as const,
            startDate: addDaysIso(AS_OF_DATE, -55),
            endDate: AS_OF_DATE,
          };
    const reconciliationMiss = await measureProgressRead(userId, sequencePeriod);
    const afterMiss = await getQaUserOwnedCounts(supabase, userId);
    const warmReads = await measureProgressReads(
      userId,
      activityCount === 30 ? 1 : 3,
      sequencePeriod,
    );
    const afterWarm = await getQaUserOwnedCounts(supabase, userId);

    assert.equal(reconciliationMiss.progress.status, "current");
    assert.equal(reconciliationMiss.progress.advancedMetrics.status, "current");
    const productProgress = projectRunnerActivityProgressForProduct(reconciliationMiss.progress);
    assertProductProgressProjection(reconciliationMiss.progress, productProgress);
    if (activityCount > 30) {
      assertCompleteFitSequence(reconciliationMiss.progress.fitActivitySequence, activityCount);
      assert.equal(productProgress.fitActivitySequence.status, "ready");
      if (productProgress.fitActivitySequence.status !== "ready") {
        throw new Error("Expected a ready Product FIT activity sequence at scale.");
      }
      assert.equal(productProgress.fitActivitySequence.points.length, activityCount);
    }
    const expectedCalendarWeeks = expectedCalendarWeekCount(AS_OF_DATE);
    if (activityCount === 30) {
      assert.equal(reconciliationMiss.writeCount, expectedCalendarWeeks + 4);
      assert.equal(
        reconciliationMiss.readCount,
        expectedCalendarWeeks + 13,
        "FIT eligibility adds exactly two paged source-graph reads, never one query per activity.",
      );
    }
    assert.equal(afterMiss.runner_activity_fact_snapshots, expectedCalendarWeeks + 2);
    assert.equal(afterMiss.runner_activity_metric_snapshots, 1);
    assert.equal(
      afterMiss.runner_activity_metric_observations,
      activityCount + (activityCount === 30 ? 1 : 0),
    );
    assertCurrentWarmReads(
      warmReads,
      reconciliationMiss.progress.rolling28Day.current.id,
      reconciliationMiss.progress.advancedMetrics.status === "current"
        ? reconciliationMiss.progress.advancedMetrics.snapshotId
        : null,
      expectedWarmReadCount(activityCount, AS_OF_DATE),
    );
    assert.deepEqual(snapshotRowCounts(afterWarm), snapshotRowCounts(afterMiss));

    const planAuthorityRetirement =
      activityCount === 30 ? await proveDesignProfilePlanAuthorityRetirement(userId) : null;

    const mutationTarget = await supabase
      .from("runner_activities")
      .select("id, current_revision_id")
      .eq("user_id", userId)
      .eq("local_date", addDaysIso(AS_OF_DATE, -2))
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (mutationTarget.error) throw new Error(mutationTarget.error.message);
    assert.ok(mutationTarget.data.current_revision_id);
    const previousMetricSnapshotId =
      reconciliationMiss.progress.advancedMetrics.status === "current"
        ? reconciliationMiss.progress.advancedMetrics.snapshotId
        : null;
    assert.ok(previousMetricSnapshotId);

    const mutation = await recordRunnerActivitySessionRpeForUser(userId, {
      activityId: mutationTarget.data.id,
      activityRevisionId: mutationTarget.data.current_revision_id,
      rpe: 6,
      outcome: "completed",
      expectedEvidenceRevisionId: null,
    });
    assert.equal(mutation.progress.status, "current");
    assert.equal(mutation.progress.advancedMetrics.status, "current");
    if (mutation.progress.advancedMetrics.status !== "current") {
      throw new Error("Expected current Gate 4 readback after RPE mutation.");
    }
    assert.notEqual(mutation.progress.advancedMetrics.snapshotId, previousMetricSnapshotId);
    assert.equal(
      mutation.progress.rolling28Day.current.id,
      reconciliationMiss.progress.rolling28Day.current.id,
    );
    const afterMutation = await getQaUserOwnedCounts(supabase, userId);
    assert.equal(afterMutation.runner_activity_fact_snapshots, expectedCalendarWeeks + 2);
    assert.equal(afterMutation.runner_activity_metric_snapshots, 2);
    assert.equal(
      afterMutation.runner_activity_metric_observations,
      activityCount + (activityCount === 30 ? 2 : 1),
    );

    const postMutationWarmReads = await measureProgressReads(
      userId,
      activityCount === 30 ? 1 : 2,
      sequencePeriod,
    );
    assertCurrentWarmReads(
      postMutationWarmReads,
      reconciliationMiss.progress.rolling28Day.current.id,
      mutation.progress.advancedMetrics.snapshotId,
      expectedWarmReadCount(activityCount, AS_OF_DATE),
    );

    return {
      fixtureActivityCount: activityCount,
      reconciliationMiss: measurementReceipt(reconciliationMiss),
      warm: measurementSummary(warmReads),
      postMutationWarm: measurementSummary(postMutationWarmReads),
      reconciliationMissRowDelta: {
        factSnapshots:
          afterMiss.runner_activity_fact_snapshots - beforeMiss.runner_activity_fact_snapshots,
        metricSnapshots:
          afterMiss.runner_activity_metric_snapshots - beforeMiss.runner_activity_metric_snapshots,
        metricObservations:
          afterMiss.runner_activity_metric_observations -
          beforeMiss.runner_activity_metric_observations,
      },
      mutationRowDelta: {
        factSnapshots:
          afterMutation.runner_activity_fact_snapshots - afterWarm.runner_activity_fact_snapshots,
        metricSnapshots:
          afterMutation.runner_activity_metric_snapshots -
          afterWarm.runner_activity_metric_snapshots,
        metricObservations:
          afterMutation.runner_activity_metric_observations -
          afterWarm.runner_activity_metric_observations,
      },
      mutationProducedFreshMetricSnapshot: true,
      factualSnapshotRemainedCurrent: true,
      internalPayloadBytes: Buffer.byteLength(JSON.stringify(reconciliationMiss.progress), "utf8"),
      productPayloadBytes: Buffer.byteLength(JSON.stringify(productProgress), "utf8"),
      fitActivitySequence:
        reconciliationMiss.progress.fitActivitySequence.status === "ready" ||
        reconciliationMiss.progress.fitActivitySequence.status === "empty"
          ? {
              status: reconciliationMiss.progress.fitActivitySequence.status,
              eligibleActivityCount:
                reconciliationMiss.progress.fitActivitySequence.completeness.eligibleActivityCount,
              returnedPointCount:
                reconciliationMiss.progress.fitActivitySequence.completeness.returnedPointCount,
            }
          : { status: reconciliationMiss.progress.fitActivitySequence.status },
      planAuthorityRetirement,
    };
  } finally {
    await resetQaPoolUserData({ supabase, userId });
    const afterCleanup = await getQaUserOwnedCounts(supabase, userId);
    assert.ok(Object.values(afterCleanup).every((count) => count === 0));
  }
}

async function proveDesignProfilePlanAuthorityRetirement(userId: string) {
  const [snapshot, planCycles, plannedWorkouts, firstHistoryPage] = await Promise.all([
    getPersistedRunnerCalendarSnapshot(userId),
    supabase.from("plan_cycles").select("id, status, saved_plan_payload").eq("user_id", userId),
    supabase.from("planned_workouts").select("id, plan_cycle_id").eq("user_id", userId),
    listRunnerActivityHistoryForUser({ userId }),
  ]);

  if (planCycles.error) throw new Error(planCycles.error.message);
  if (plannedWorkouts.error) throw new Error(plannedWorkouts.error.message);

  const sourcePlanIds = new Set(
    plannedWorkouts.data
      .map((workout) => workout.plan_cycle_id)
      .filter((planId): planId is string => Boolean(planId)),
  );
  const activeAuthorityCount = planCycles.data.filter((plan) => plan.status === "active").length;
  const immutableSourceCount = planCycles.data.filter(
    (plan) => sourcePlanIds.has(plan.id) && plan.saved_plan_payload !== null,
  ).length;
  const materializedContainerCount = planCycles.data.filter(
    (plan) => sourcePlanIds.has(plan.id) && plan.saved_plan_payload === null,
  ).length;

  assert.equal(
    activeAuthorityCount,
    0,
    "Calendar readback must not require active plan authority.",
  );
  assert.equal(immutableSourceCount, 1);
  assert.equal(materializedContainerCount, 0);
  assert.equal(snapshot.workouts.length, 55);
  assert.equal(firstHistoryPage.items.length, 20);
  assert.ok(firstHistoryPage.nextCursor);

  return {
    activeAuthorityCount,
    immutableSourceCount,
    materializedContainerCount,
    workoutCount: snapshot.workouts.length,
    firstHistoryPageCount: firstHistoryPage.items.length,
  };
}

function assertCurrentWarmReads(
  reads: Array<Awaited<ReturnType<typeof measureProgressRead>>>,
  factualSnapshotId: string,
  metricSnapshotId: string | null,
  expectedReadCount: number,
) {
  assert.ok(reads.every((read) => read.writeCount === 0));
  assert.ok(reads.every((read) => read.readCount === expectedReadCount));
  assert.ok(reads.every((read) => (read.operations["GET runner_activity_revisions"] ?? 0) === 0));
  assert.ok(
    reads.every((read) => JSON.stringify(read.operations) === JSON.stringify(reads[0]?.operations)),
  );
  assert.ok(reads.every((read) => read.progress.status === "current"));
  assert.ok(reads.every((read) => read.progress.rolling28Day.current.id === factualSnapshotId));
  assert.ok(
    reads.every(
      (read) =>
        read.progress.advancedMetrics.status === "current" &&
        read.progress.advancedMetrics.snapshotId === metricSnapshotId,
    ),
  );
}

function assertCompleteFitSequence(
  sequence: Awaited<ReturnType<typeof getRunnerActivityProgressForUser>>["fitActivitySequence"],
  expectedActivityCount: number,
) {
  assert.equal(sequence.status, "ready");
  if (sequence.status !== "ready") {
    throw new Error("Expected a complete FIT activity sequence.");
  }
  assert.equal(sequence.completeness.state, "complete");
  assert.equal(sequence.completeness.eligibleActivityCount, expectedActivityCount);
  assert.equal(sequence.completeness.returnedPointCount, expectedActivityCount);
  assert.equal(sequence.points.length, expectedActivityCount);
  assert.equal(new Set(sequence.points.map((point) => point.id)).size, expectedActivityCount);

  let previousDate: string | null = null;
  let previousStartedAt: string | null = null;
  let previousId: string | null = null;
  let expectedSameDayOrder = 1;
  sequence.points.forEach((point, sequenceIndex) => {
    assert.equal(point.sequenceIndex, sequenceIndex);
    if (point.historicalTime.localDate === previousDate) {
      expectedSameDayOrder += 1;
      const previousSortKey = `${previousStartedAt ?? "\uffff"}:${previousId}`;
      const currentSortKey = `${point.historicalTime.startedAt ?? "\uffff"}:${point.id}`;
      assert.ok(
        previousSortKey.localeCompare(currentSortKey) <= 0,
        "Same-day FIT activities must keep deterministic started-at and identity order.",
      );
    } else {
      if (previousDate !== null) {
        assert.ok(previousDate < point.historicalTime.localDate);
      }
      expectedSameDayOrder = 1;
    }
    assert.equal(point.sameDayOrder, expectedSameDayOrder);
    previousDate = point.historicalTime.localDate;
    previousStartedAt = point.historicalTime.startedAt;
    previousId = point.id;
  });
}

function expectedWarmReadCount(activityCount: number, asOfDate: string) {
  const activityPages = Math.floor(activityCount / 500) + 1;
  const matchedWorkoutLogRead = activityCount === 30 ? 1 : 0;
  return 7 + matchedWorkoutLogRead + expectedCalendarWeekCount(asOfDate) + activityPages * 4;
}

function expectedCalendarWeekCount(asOfDate: string) {
  const firstWeek = startOfWeekIso(addDaysIso(asOfDate, -27));
  const lastWeek = startOfWeekIso(asOfDate);
  return diffDaysIso(lastWeek, firstWeek) / 7 + 1;
}

async function seedAdditionalSyntheticActivities(input: { userId: string; activityCount: number }) {
  const concurrency = 20;
  for (let offset = 0; offset < input.activityCount; offset += concurrency) {
    const batchSize = Math.min(concurrency, input.activityCount - offset);
    await Promise.all(
      Array.from({ length: batchSize }, (_, batchIndex) => {
        const index = offset + batchIndex;
        return persistSyntheticActivity({
          userId: input.userId,
          key: `scale-${index.toString().padStart(4, "0")}`,
          localDate: addDaysIso(AS_OF_DATE, -(index % 56)),
          timerDurationMin: 20 + (index % 70),
          elapsedDurationMin: 22 + (index % 70),
          distanceKm: 6.123 + index / 1_000_000,
          elevationGainM: index % 4 === 0 ? null : 10 + (index % 120),
          averageHeartRate: index % 5 === 0 ? null : 125 + (index % 35),
        });
      }),
    );
  }
}

async function clearDerivedMetricRows(userId: string) {
  for (const table of [
    "runner_activity_fact_snapshots",
    "runner_activity_metric_snapshots",
    "runner_activity_metric_observations",
  ] as const) {
    const result = await supabase.from(table).delete().eq("user_id", userId);
    if (result.error) throw new Error(result.error.message);
  }
}

async function measureProgressRead(
  userId: string,
  sequencePeriod?: Parameters<typeof getRunnerActivityProgressForUser>[0]["sequencePeriod"],
) {
  const requests: Array<{ method: string; table: string }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const requestUrl = new URL(input instanceof Request ? input.url : String(input));
    const method = (
      init?.method ?? (input instanceof Request ? input.method : "GET")
    ).toUpperCase();
    if (
      requestUrl.origin === new URL(supabaseUrl).origin &&
      requestUrl.pathname.startsWith("/rest/v1/")
    ) {
      requests.push({ method, table: requestUrl.pathname.slice("/rest/v1/".length) });
    }
    return originalFetch(input, init);
  };
  const startedAt = performance.now();
  try {
    const progress = await getRunnerActivityProgressForUser({
      userId,
      asOfDate: AS_OF_DATE,
      sequencePeriod,
    });
    return {
      progress,
      elapsedMs: Number((performance.now() - startedAt).toFixed(2)),
      readCount: requests.filter((request) => isReadMethod(request.method)).length,
      writeCount: requests.filter((request) => !isReadMethod(request.method)).length,
      operations: requestCounts(requests),
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function measureProgressReads(
  userId: string,
  count: number,
  sequencePeriod?: Parameters<typeof getRunnerActivityProgressForUser>[0]["sequencePeriod"],
) {
  const reads = [];
  for (let index = 0; index < count; index += 1) {
    reads.push(await measureProgressRead(userId, sequencePeriod));
  }
  return reads;
}

function isReadMethod(method: string) {
  return method === "GET" || method === "HEAD";
}

function requestCounts(requests: Array<{ method: string; table: string }>) {
  return Object.fromEntries(
    Array.from(
      requests.reduce((counts, request) => {
        const key = `${request.method} ${request.table}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    ).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function measurementReceipt(read: Awaited<ReturnType<typeof measureProgressRead>>) {
  return {
    elapsedMs: read.elapsedMs,
    readCount: read.readCount,
    writeCount: read.writeCount,
    operations: read.operations,
  };
}

function measurementSummary(reads: Array<Awaited<ReturnType<typeof measureProgressRead>>>) {
  const elapsedMs = reads.map((read) => read.elapsedMs).sort((left, right) => left - right);
  return {
    samples: reads.length,
    minElapsedMs: elapsedMs[0],
    medianElapsedMs: elapsedMs[Math.floor(elapsedMs.length / 2)],
    maxElapsedMs: elapsedMs.at(-1),
    readCounts: Array.from(new Set(reads.map((read) => read.readCount))),
    writeCounts: Array.from(new Set(reads.map((read) => read.writeCount))),
    operations: reads[0]?.operations ?? {},
  };
}

function snapshotRowCounts(counts: Awaited<ReturnType<typeof getQaUserOwnedCounts>>) {
  return {
    factSnapshots: counts.runner_activity_fact_snapshots,
    metricSnapshots: counts.runner_activity_metric_snapshots,
    metricObservations: counts.runner_activity_metric_observations,
  };
}

async function proveEmptyHistoryAndProgress(userId: string) {
  const history = await listRunnerActivityHistoryForUser({ userId });
  assert.deepEqual(history, { items: [], nextCursor: null });
  const progress = await getRunnerActivityProgressFactsForUser({ userId, asOfDate: AS_OF_DATE });
  const current = progress.rolling28Day.current;
  assert.equal(current.facts.sessions.availability, "unavailable");
  assert.equal(current.facts.sessions.value, null);
  assert.deepEqual(current.facts.sessions.missingReasons, ["no_recorded_activities"]);
  assert.equal(current.facts.runningTime.value, null);
  assert.equal(current.facts.distance.value, null);
}

async function prepareRuntimePoolIdentity(runtimeUrl: string, role: keyof typeof QA_TESTER_POOL) {
  const baseUrl = new URL(runtimeUrl);
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(baseUrl.hostname));
  const { cookie } = await loginQaPoolToLoopbackRuntime({ runtimeUrl, role });

  const provision = await fetch(new URL("/api/runner-activities", baseUrl), {
    headers: { cookie },
  });
  assert.equal(provision.status, 200);
  return { cookie };
}

async function proveRuntimeRoutes(input: {
  userId: string;
  runtimeUrl: string;
  cookie: string;
  otherCookie: string;
}) {
  const baseUrl = new URL(input.runtimeUrl);
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(baseUrl.hostname));

  const unauthorized = await fetch(new URL("/api/runner-activities", baseUrl));
  assert.equal(unauthorized.status, 401);
  assert.equal((await unauthorized.json()).code, "auth_required");

  const headers = { cookie: input.cookie };

  const routeSource = await persistSyntheticActivity({
    userId: input.userId,
    key: "runtime-source-remove",
    localDate: "2026-05-01",
    timerDurationMin: 25,
    elapsedDurationMin: 28,
    distanceKm: 4,
    elevationGainM: 10,
    averageHeartRate: 132,
  });
  const routeDelete = await persistSyntheticActivity({
    userId: input.userId,
    key: "runtime-history-delete",
    localDate: "2026-04-25",
    timerDurationMin: 20,
    elapsedDurationMin: 23,
    distanceKm: 3,
    elevationGainM: null,
    averageHeartRate: null,
  });

  for (const path of [
    `/api/runner-activities/${routeSource.receipt.activityId}/source`,
    `/api/runner-activities/${routeDelete.receipt.activityId}`,
  ]) {
    const crossRunnerMutation = await fetch(new URL(path, baseUrl), {
      method: "DELETE",
      headers: { cookie: input.otherCookie },
    });
    assert.equal(crossRunnerMutation.status, 404);
    const crossRunnerBody = await crossRunnerMutation.json();
    assert.equal(crossRunnerBody.ok, false);
    assert.equal(crossRunnerBody.code, "activity_not_found");
  }
  const unchangedOwnerActivities = await supabase
    .from("runner_activities")
    .select("id")
    .eq("user_id", input.userId)
    .in("id", [routeSource.receipt.activityId, routeDelete.receipt.activityId]);
  if (unchangedOwnerActivities.error) throw new Error(unchangedOwnerActivities.error.message);
  assert.equal(unchangedOwnerActivities.data.length, 2);

  const historyResponse = await fetch(new URL("/api/runner-activities?pageSize=2", baseUrl), {
    headers,
  });
  assert.equal(historyResponse.status, 200);
  const historyBody = await historyResponse.json();
  assert.equal(historyBody.ok, true);
  assert.equal(historyBody.history.items.length, 2);
  assert.ok(historyBody.history.nextCursor);
  assertProductHistoryProjection(historyBody.history);
  assert.doesNotMatch(
    JSON.stringify(historyBody.history),
    /activityRevisionId|normalizerVersion|dateBasis|recordingKind/,
  );

  const invalidCursor = await fetch(
    new URL("/api/runner-activities?cursor=not-a-cursor", baseUrl),
    { headers },
  );
  assert.equal(invalidCursor.status, 400);
  assert.equal((await invalidCursor.json()).code, "activity_history_request_invalid");

  const progressResponse = await fetch(new URL("/api/runner-activity-progress", baseUrl), {
    headers,
  });
  assert.equal(progressResponse.status, 200);
  const progressBody = await progressResponse.json();
  assert.equal(progressBody.ok, true);
  assertProductProgressShape(progressBody.progress);
  assert.equal(
    progressBody.progress.rolling28Day.current.formulaVersion,
    "runner_activity_facts_v1",
  );
  assert.doesNotMatch(
    JSON.stringify(progressBody.progress),
    /snapshotId|activityRevisionId|sourceRevisionId|evidenceRevisionId|observationId|creationCause|formulaSetVersion/,
  );

  const sourceRemoveResponse = await fetch(
    new URL(`/api/runner-activities/${routeSource.receipt.activityId}/source`, baseUrl),
    { method: "DELETE", headers },
  );
  assert.equal(sourceRemoveResponse.status, 200);
  const sourceRemoveBody = await sourceRemoveResponse.json();
  assert.equal(sourceRemoveBody.ok, true);
  assert.equal(sourceRemoveBody.readback.status, "current");
  assertProductMutationReadback(sourceRemoveBody.readback);
  assert.doesNotMatch(
    JSON.stringify(sourceRemoveBody.readback),
    /snapshotId|activityRevisionId|sourceRevisionId|evidenceRevisionId|observationId|creationCause|normalizerVersion/,
  );
  assert.equal(
    sourceRemoveBody.readback.history.items.find(
      (item: { id: string }) => item.id === routeSource.receipt.activityId,
    )?.source.rawState,
    "removed",
  );

  const deleteResponse = await fetch(
    new URL(`/api/runner-activities/${routeDelete.receipt.activityId}`, baseUrl),
    { method: "DELETE", headers },
  );
  assert.equal(deleteResponse.status, 200);
  const deleteBody = await deleteResponse.json();
  assert.equal(deleteBody.ok, true);
  assert.equal(deleteBody.readback.status, "current");
  assertProductMutationReadback(deleteBody.readback);
  assert.doesNotMatch(
    JSON.stringify(deleteBody.readback),
    /snapshotId|activityRevisionId|sourceRevisionId|evidenceRevisionId|observationId|creationCause|normalizerVersion/,
  );
  assert.equal(
    deleteBody.readback.history.items.some(
      (item: { id: string }) => item.id === routeDelete.receipt.activityId,
    ),
    false,
  );
}

async function proveHistoryPagination(input: {
  userId: string;
  plannedWorkoutId: string;
  longestActivityId: string;
  elapsedOnlyActivityId: string;
}) {
  const first = await listRunnerActivityHistoryForUser({ userId: input.userId, pageSize: 2 });
  assert.equal(first.items.length, 2);
  assert.ok(first.nextCursor);
  const second = await listRunnerActivityHistoryForUser({
    userId: input.userId,
    cursor: first.nextCursor,
    pageSize: 2,
  });
  assert.equal(second.items.length, 2);
  assert.ok(second.nextCursor);
  const third = await listRunnerActivityHistoryForUser({
    userId: input.userId,
    cursor: second.nextCursor,
    pageSize: 2,
  });
  assert.equal(third.items.length, 1);
  assert.equal(third.nextCursor, null);
  const items = [...first.items, ...second.items, ...third.items];
  assert.equal(new Set(items.map((item) => item.id)).size, 5);
  assert.deepEqual(
    items.map((item) => item.historicalTime.localDate),
    [-1, -7, -13, -21, -33].map((days) => addDaysIso(AS_OF_DATE, days)),
  );
  assert.equal(
    items.every((item) => item.identity.label === "Run"),
    true,
  );
  const longest = items.find((item) => item.id === input.longestActivityId);
  assert.equal(longest?.duration?.basis, "timer");
  assert.equal(longest?.pace?.secondsPerKm, 360);
  assert.equal(longest?.observedHeartRate?.averageBpm, 142);
  assert.equal(longest?.plannedWorkout?.id, input.plannedWorkoutId);
  const elapsedOnly = items.find((item) => item.id === input.elapsedOnlyActivityId);
  assert.equal(elapsedOnly?.duration?.basis, "elapsed");
  assert.equal(elapsedOnly?.pace?.basis, "elapsed");
  const serialized = JSON.stringify(items);
  assert.doesNotMatch(serialized, /storage_path|raw_original_file_name|fingerprint|\.fit/i);
  const productHistory = projectRunnerActivityHistoryForProduct({ items, nextCursor: null });
  assert.equal(productHistory.items.length, items.length);
  assertProductHistoryProjection(productHistory);
  assert.doesNotMatch(
    JSON.stringify(productHistory),
    /activityRevisionId|normalizerVersion|dateBasis|recordingKind/,
  );
  await assert.rejects(
    listRunnerActivityHistoryForUser({ userId: input.userId, cursor: "not-a-cursor" }),
    /cursor is invalid/i,
  );
}

function assertProductProgressProjection(
  internal: Awaited<ReturnType<typeof getRunnerActivityProgressForUser>>,
  product: ReturnType<typeof projectRunnerActivityProgressForProduct>,
) {
  assertProductProgressShape(product);
  assert.doesNotMatch(
    JSON.stringify(product),
    /snapshotId|activityRevisionId|sourceRevisionId|evidenceRevisionId|observationId|creationCause|formulaSetVersion/,
  );
  assert.ok(
    Buffer.byteLength(JSON.stringify(product), "utf8") <
      Buffer.byteLength(JSON.stringify(internal), "utf8"),
    "Product Progress projection must be smaller than the internal read model.",
  );
}

function assertProductProgressShape(
  product: ReturnType<typeof projectRunnerActivityProgressForProduct>,
) {
  assertExactKeys(product, [
    "advancedMetrics",
    "asOfDate",
    "calendarWeeks",
    "fitActivitySequence",
    "fitProgress",
    "rolling28Day",
    "status",
  ]);
  assertExactKeys(product.rolling28Day, ["current", "previous"]);
  assertProductSnapshot(product.rolling28Day.current);
  assertProductSnapshot(product.rolling28Day.previous);
  product.calendarWeeks.forEach(assertProductSnapshot);
  assertProductFitProgress(product.fitProgress);
  assertProductFitActivitySequence(product.fitActivitySequence);
  assertProductAdvancedMetrics(product.advancedMetrics);
}

function assertProductFitActivitySequence(
  sequence: ReturnType<typeof projectRunnerActivityProgressForProduct>["fitActivitySequence"],
) {
  const baseKeys = [
    "advertisedPeriods",
    "evidenceLabel",
    "formulaVersion",
    "points",
    "selectedPeriod",
    "status",
  ];
  if (sequence.status === "updating" || sequence.status === "unavailable") {
    assertExactKeys(sequence, [...baseKeys, "reason", "reasonLabel", "staleValuesReturned"]);
    assert.deepEqual(sequence.points, []);
    return;
  }
  assertExactKeys(sequence, [...baseKeys, "completeness", "coverage"]);
  assertExactKeys(sequence.completeness, ["eligibleActivityCount", "returnedPointCount", "state"]);
  assert.equal(
    sequence.completeness.eligibleActivityCount,
    sequence.completeness.returnedPointCount,
  );
  assert.equal(sequence.completeness.returnedPointCount, sequence.points.length);
  sequence.advertisedPeriods.forEach(assertFitSequencePeriod);
  assertFitSequencePeriod(sequence.selectedPeriod);
  for (const point of sequence.points) {
    assertExactKeys(point, [
      "context",
      "evidence",
      "historicalTime",
      "id",
      "label",
      "observations",
      "sameDayOrder",
      "sequenceIndex",
    ]);
    assertExactKeys(point.historicalTime, ["localDate", "startedAt", "timezone"]);
    assertExactKeys(point.context, ["runningContext", "state"]);
    assertExactKeys(point.evidence, ["label", "state"]);
    assert.deepEqual(Object.keys(point.observations), [
      "distance",
      "timer_duration",
      "observed_average_pace",
      "elevation_gain",
      "reported_load",
    ]);
    for (const observation of Object.values(point.observations)) {
      assertExactKeys(observation, [
        "basis",
        "coverage",
        "displayValue",
        "id",
        "label",
        "reason",
        "reasonLabel",
        "state",
        "unit",
        "unitLabel",
        "value",
      ]);
      assertExactKeys(observation.coverage, ["candidateCount", "includedCount", "missingCount"]);
      assertExactKeys(observation.basis, ["distance", "duration", "effort"]);
    }
  }
}

function assertFitSequencePeriod(
  period: ReturnType<
    typeof projectRunnerActivityProgressForProduct
  >["fitActivitySequence"]["selectedPeriod"],
) {
  assertExactKeys(period, [
    "asOfDate",
    "endDate",
    "futureInterval",
    "id",
    "label",
    "startDate",
    "timezoneBasis",
  ]);
  assertExactKeys(period.timezoneBasis, ["activities", "period", "timeZone"]);
  if (period.futureInterval) assertExactKeys(period.futureInterval, ["endDate", "startDate"]);
}

function assertProductFitProgress(
  progress: ReturnType<typeof projectRunnerActivityProgressForProduct>["fitProgress"],
) {
  if (progress.status === "updating") {
    assertExactKeys(progress, ["reason", "staleValuesReturned", "status"]);
    return;
  }
  if (progress.status === "unavailable") {
    assertExactKeys(progress, ["reason", "status"]);
    return;
  }

  assertExactKeys(progress, ["chart", "evidenceLabel", "personalBests", "status"]);
  assert.equal(progress.evidenceLabel, "From FIT file");
  assertExactKeys(progress.chart, ["advertisedPeriods"]);
  assert.equal(progress.chart.advertisedPeriods.length, 1);
  const [period] = progress.chart.advertisedPeriods;
  assertExactKeys(period, [
    "bucketResolution",
    "endDate",
    "id",
    "label",
    "series",
    "startDate",
    "state",
    "timezoneBasis",
    "weekStartsOn",
  ]);
  assert.equal(period.id, "28_days");
  assert.deepEqual(
    period.series.map((series) => series.id),
    ["sessions", "running_time", "distance", "elevation", "reported_load"],
  );
  for (const series of period.series) {
    const identityKeys = [
      "display",
      "evidenceLabel",
      "formulaVersion",
      "id",
      "points",
      "purpose",
      "status",
      "title",
      "unit",
      "unitLabel",
    ];
    if (series.status === "updating") {
      assertExactKeys(series, [...identityKeys, "reason", "reasonLabel", "staleValuesReturned"]);
      assert.deepEqual(series.points, []);
      continue;
    }
    assertExactKeys(series, identityKeys);
    for (const point of series.points) {
      assertExactKeys(point, [
        "accessibleLabel",
        "completion",
        "completionLabel",
        "coverage",
        "cutoffDate",
        "displayValue",
        "endDate",
        "id",
        "reasonLabels",
        "reasons",
        "shortLabel",
        "startDate",
        "state",
        "value",
      ]);
      assertExactKeys(point.coverage, ["candidateCount", "includedCount", "label", "missingCount"]);
    }
  }

  assertExactKeys(progress.personalBests, ["formulaVersion", "matchingRule", "slots"]);
  assert.deepEqual(
    progress.personalBests.slots.map((slot) => slot.id),
    ["1_km", "5_km", "10_km", "half_marathon", "marathon"],
  );
  for (const slot of progress.personalBests.slots) {
    assertExactKeys(slot, [
      "distanceMeters",
      "id",
      "label",
      "reason",
      "reasonLabel",
      "result",
      "state",
    ]);
    if (slot.result) {
      assertExactKeys(slot.result, [
        "displayValue",
        "elapsedSeconds",
        "eventDate",
        "evidenceLabel",
        "source",
      ]);
      assertExactKeys(slot.result.source, ["activityId"]);
    }
  }
}

function assertProductHistoryProjection(
  history: ReturnType<typeof projectRunnerActivityHistoryForProduct>,
) {
  assertExactKeys(history, ["items", "nextCursor"]);
  for (const item of history.items) {
    assertExactKeys(item, [
      "capabilities",
      "distanceKm",
      "duration",
      "historicalTime",
      "id",
      "identity",
      "observedHeartRate",
      "pace",
      "plannedWorkout",
      "quality",
      "source",
    ]);
    assertExactKeys(item.identity, ["label"]);
    assertExactKeys(item.historicalTime, ["localDate", "startedAt", "timezone"]);
    if (item.duration) assertExactKeys(item.duration, ["basis", "minutes"]);
    if (item.pace) assertExactKeys(item.pace, ["basis", "secondsPerKm"]);
    if (item.observedHeartRate) assertExactKeys(item.observedHeartRate, ["averageBpm"]);
    if (item.plannedWorkout) assertExactKeys(item.plannedWorkout, ["id", "title", "workoutDate"]);
    assertExactKeys(item.source, ["kind", "originalRetained", "rawState", "reprocessingAvailable"]);
    assertExactKeys(item.quality, ["updating"]);
    assertExactKeys(item.capabilities, ["canRemoveOriginalFile"]);
  }
}

function assertProductSnapshot(
  snapshot: ReturnType<typeof projectRunnerActivityProgressForProduct>["rolling28Day"]["current"],
) {
  assertExactKeys(snapshot, ["eligibleActivityCount", "facts", "formulaVersion", "window"]);
  assertExactKeys(snapshot.window, [
    "cutoffDate",
    "endDate",
    "startDate",
    "timezoneBasis",
    "weekStartsOn",
  ]);
  assertExactKeys(snapshot.facts, [
    "distance",
    "elevationGain",
    "longestDistance",
    "longestDuration",
    "runningTime",
    "sessions",
  ]);
  Object.values(snapshot.facts).forEach((metric) =>
    assertExactKeys(metric, [
      "availability",
      "confidence",
      "includedActivityCount",
      "missingActivityCount",
      "missingReasons",
      "unit",
      "value",
    ]),
  );
}

function assertProductAdvancedMetrics(
  metrics: ReturnType<typeof projectRunnerActivityProgressForProduct>["advancedMetrics"],
) {
  if (metrics.status === "updating") {
    assertExactKeys(metrics, ["asOfDate", "reason", "staleValuesReturned", "status"]);
    return;
  }

  assertExactKeys(metrics, [
    "asOfDate",
    "detailedMetrics",
    "historical",
    "records",
    "sessionRpeLoad",
    "status",
  ]);
  assertExactKeys(metrics.sessionRpeLoad, ["calendarWeeks", "formulaVersion", "rolling28Day"]);
  assertExactKeys(metrics.sessionRpeLoad.rolling28Day, ["current", "previous"]);
  [
    metrics.sessionRpeLoad.rolling28Day.current,
    metrics.sessionRpeLoad.rolling28Day.previous,
    ...metrics.sessionRpeLoad.calendarWeeks,
  ].forEach((window) => {
    assertExactKeys(window, ["endDate", "metric", "startDate"]);
    assertExactKeys(window.metric, [
      "availability",
      "confidence",
      "displayValue",
      "includedObservationCount",
      "unavailableObservationCount",
      "unavailableReasons",
      "unit",
      "value",
    ]);
  });
  assertExactKeys(metrics.records, ["availability", "items", "unavailableReasons"]);
  metrics.records.items.forEach((record) =>
    assertExactKeys(record, [
      "confidence",
      "context",
      "distanceKey",
      "distanceMeters",
      "elapsedSeconds",
      "eventDate",
      "id",
      "provenance",
      "recordClass",
    ]),
  );
  assertExactKeys(metrics.detailedMetrics, ["reason", "status"]);
}

function assertProductMutationReadback(
  readback: ReturnType<typeof projectRunnerActivityMutationReadbackForProduct>,
) {
  if (readback.status === "updating") {
    assertExactKeys(readback, ["activityId", "history", "progress", "reason", "status"]);
    return;
  }

  assertExactKeys(readback, ["activityId", "history", "progress", "status"]);
  assertProductHistoryProjection(readback.history);
  assertProductProgressShape(readback.progress);
}

function assertExactKeys(value: object, expected: string[]) {
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort());
}

async function proveFactSnapshots(userId: string) {
  const first = await getRunnerActivityProgressFactsForUser({ userId, asOfDate: AS_OF_DATE });
  const current = first.rolling28Day.current;
  assert.deepEqual(current.window, {
    startDate: addDaysIso(AS_OF_DATE, -27),
    endDate: AS_OF_DATE,
    cutoffDate: AS_OF_DATE,
    timezoneBasis: "historical_local_date",
    weekStartsOn: "monday",
  });
  assert.equal(current.facts.sessions.value, 4);
  assert.equal(current.facts.runningTime.value, 110);
  assert.equal(current.facts.runningTime.confidence, "partial");
  assert.equal(current.facts.runningTime.missingActivityCount, 1);
  assert.equal(current.facts.distance.value, 20);
  assert.equal(current.facts.distance.confidence, "partial");
  assert.equal(current.facts.elevationGain.value, 120);
  assert.equal(current.facts.elevationGain.confidence, "partial");
  assert.equal(current.facts.longestDistance.value, 10);
  assert.equal(current.facts.longestDuration.value, 60);
  assert.equal(first.rolling28Day.previous.facts.sessions.value, 1);
  assert.equal(first.interpretation.volumeIsFitness, false);
  assert.equal(first.interpretation.derivedCoachingMetricsAvailable, false);
  assert.equal(first.calendarWeeks.at(-1)?.window.cutoffDate, AS_OF_DATE);

  const repeated = await getRunnerActivityProgressFactsForUser({ userId, asOfDate: AS_OF_DATE });
  assert.equal(repeated.rolling28Day.current.id, current.id);
  assert.deepEqual(
    repeated.calendarWeeks.map((snapshot) => snapshot.id),
    first.calendarWeeks.map((snapshot) => snapshot.id),
  );
  return first;
}

async function proveSnapshotRls(input: {
  ownerRole: keyof typeof QA_TESTER_POOL;
  otherRole: keyof typeof QA_TESTER_POOL;
  snapshotId: string;
}) {
  const ownerClient = await signedInClient(input.ownerRole);
  const ownRead = await ownerClient
    .from("runner_activity_fact_snapshots")
    .select("id")
    .eq("id", input.snapshotId);
  assert.equal(ownRead.error?.code, "42501");
  assert.equal(ownRead.data, null);
  await ownerClient.auth.signOut();

  const otherClient = await signedInClient(input.otherRole);
  const crossRead = await otherClient
    .from("runner_activity_fact_snapshots")
    .select("id")
    .eq("id", input.snapshotId);
  assert.equal(crossRead.error?.code, "42501");
  assert.equal(crossRead.data, null);
  const forbiddenRpc = await otherClient.rpc("list_runner_activity_history_page", {
    p_user_id: (await otherClient.auth.getUser()).data.user?.id ?? "",
    p_page_size: 10,
  });
  assert.ok(forbiddenRpc.error);
  await otherClient.auth.signOut();
}

async function persistSyntheticActivity(input: {
  userId: string;
  key: string;
  localDate: string;
  timerDurationMin: number | null;
  elapsedDurationMin: number | null;
  distanceKm: number | null;
  elevationGainM: number | null;
  averageHeartRate: number | null;
  storageSuffix?: string;
}) {
  return persistGate4SyntheticActivity({ supabase, ...input });
}

async function createPlannedWorkout(userId: string) {
  await updateUserSettingsForUserId(userId, {
    firstName: "QA",
    lastName: "Runner",
    displayName: "Gate 2 Read Model",
    age: 36,
    weightKg: 72,
    heightCm: 178,
    fitnessLevel: "running_regularly",
    calendarTimezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const plannedWorkoutId = randomUUID();
  const workout = await supabase.from("planned_workouts").insert({
    id: plannedWorkoutId,
    user_id: userId,
    plan_cycle_id: null,
    origin_kind: "manual",
    workout_date: addDaysIso(AS_OF_DATE, -1),
    weekday: weekdayLong(addDaysIso(AS_OF_DATE, -1)),
    week_number: 1,
    phase: "Proof",
    workout_type: "easy",
    title: "Planned easy run",
    steps: [],
    display_order: 0,
  });
  if (workout.error) throw new Error(workout.error.message);
  return plannedWorkoutId;
}

await main();
