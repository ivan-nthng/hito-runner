import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  confirmRunnerActivityOfficialResultForUser,
  correctRunnerActivityOfficialResultForUser,
  readCurrentRunnerActivityEvidenceForUser,
  recordRunnerActivitySessionRpeForUser,
  withdrawRunnerActivityOfficialResultForUser,
} from "../src/lib/runner-activity/activity-evidence";
import {
  createRunnerActivityPlannedWorkoutMatch,
  deleteRunnerActivityFromHistory,
  removeRunnerActivityOriginalFiles,
  removeRunnerActivityOriginalFilesForActivity,
} from "../src/lib/runner-activity/garmin-fit-source";
import {
  buildGate4ObservationDrafts,
  buildGate4SnapshotPayload,
  buildRunnerActivityFitSequence,
  gate4InputFingerprint,
  resolveRunnerActivityFitSequencePeriod,
  RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION,
} from "../src/lib/runner-activity/metric-formulas";
import {
  getHistoricalRunnerActivityMetricSnapshotForUser,
  getRunnerActivityAdvancedMetricsForUser,
  metricRecalculationPendingReadback,
  RunnerActivityMetricRecalculationPendingError,
} from "../src/lib/runner-activity/metric-snapshots";
import { listRunnerActivityHistoryForUser } from "../src/lib/runner-activity/history-read-model";
import {
  getRunnerActivityProgressForUser,
  parseRunnerActivityFitSequencePeriodRequest,
} from "../src/lib/runner-activity/read-model";
import { projectRunnerActivityProgressForProduct } from "../src/lib/runner-activity/product-contract";
import type {
  RunnerActivityAdvancedMetricsCurrent,
  RunnerActivityProgressReadModel,
} from "../src/lib/runner-activity/read-model-types";
import { addDaysIso, startOfWeekIso, todayIso } from "../src/lib/training";
import {
  QA_TEST_USER_OWNED_TABLES,
  QA_TESTER_POOL,
  getQaUserOwnedCounts,
  resetQaPoolUserData,
} from "./lib/qa-test-user-lifecycle.mjs";
import {
  createRunnerActivityProofRuntime,
  withRunnerActivityProofLeases,
} from "./lib/runner-activity-proof-runtime";
import {
  createGate4LifecycleFixtures,
  markRunnerActivitySourceRemovalPendingForFixture,
  persistGate4SyntheticActivity,
  type Gate4SyntheticActivity,
} from "./lib/runner-activity-gate-4-fixture";

const { supabase, ensureUser, signedInClient } = createRunnerActivityProofRuntime("gate4");
const AS_OF_DATE = todayIso();

async function main() {
  await withRunnerActivityProofLeases(["provider-engine", "isolation-a"], runValidation);
}

async function runValidation() {
  const owner = await ensureUser("provider-engine");
  const other = await ensureUser("isolation-a");
  await resetQaPoolUserData({ supabase, userId: owner.id });
  await resetQaPoolUserData({ supabase, userId: other.id });

  try {
    await proveFormulaBoundaryMatrix();
    proveFitActivitySequenceFormulaBoundaryMatrix();
    await proveRecordContextIdentity();
    await proveObservedRecordContextIdentity();
    const fixtures = await createGate4LifecycleFixtures({
      supabase,
      userId: owner.id,
      asOfDate: AS_OF_DATE,
    });

    await proveInvalidCustomSequencePeriods(owner.id);
    const initialProgress = await getRunnerActivityProgressForUser({
      userId: owner.id,
      asOfDate: AS_OF_DATE,
      sequencePeriod: sequencePeriodForProof(-9),
    });
    const initial = requireCurrent(initialProgress);
    assert.equal(initial.sessionRpeLoad.rolling28Day.current.metric.value, 674);
    assert.equal(initial.sessionRpeLoad.rolling28Day.current.metric.confidence, "partial");
    assertRecord(initial, "hito_observed_whole_activity", "5_km", 30 * 60);
    assertRecord(initial, "hito_observed_whole_activity", "10_km", 41 * 60);
    assertRecord(initial, "hito_observed_whole_activity", "half_marathon", 95 * 60);
    assert.equal(
      initial.records.items.some((record) => record.distanceMeters === 12_000),
      false,
    );
    assertGate5Unavailable(initial);
    await proveFitProgressInitialContract({
      userId: owner.id,
      progress: initialProgress,
      completedWithoutFitWorkoutId: fixtures.completedWithoutFitWorkoutId,
    });

    await proveStoredObservedRecordContextIdentity(owner.id);
    await proveAsOfCutoffExcludesFutureActivity(owner.id);
    await proveWorkoutLogDeletionLifecycle(owner.id, fixtures.elapsedOnly);
    await proveHistoricalFormulaVersionReadback(owner.id, initial);
    await proveImmutableRpeLifecycle(owner.id, fixtures.unplanned, initial.snapshotId);
    await proveDuplicateWorkoutLinkRejected(owner.id, fixtures.completed);
    await proveRpeActivityRevisionReattribution(owner.id, fixtures.completed);
    await proveOfficialResultLifecycle(owner.id, fixtures.planned60Observed38);
    await proveRawRemovalAndRevisionInvalidation(owner.id, fixtures.half);
    await provePartialRawRemovalTruth(owner.id, fixtures.exactFive);
    await proveFitUpdatingAndUnavailableStates(owner.id);
    await proveFreshReadNeverReturnsStale(owner.id);
    await proveMetricRls({ ownerRole: "provider-engine", otherRole: "isolation-a" });
    await proveFitProgressIsolation(other.id);

    const beforeDelete = requireCurrent(
      await getRunnerActivityProgressForUser({ userId: owner.id, asOfDate: AS_OF_DATE }),
    );
    assert.equal(
      beforeDelete.records.items.some(
        (record) => record.activityId === fixtures.exactFive.receipt.activityId,
      ),
      true,
    );
    const deletion = await deleteRunnerActivityFromHistory({
      userId: owner.id,
      activityId: fixtures.exactFive.receipt.activityId,
    });
    assert.equal(deletion.status, "current");
    if (deletion.status !== "current")
      throw new Error("Expected current activity deletion readback.");
    const afterDelete = requireCurrent(deletion.progress);
    assert.equal(
      afterDelete.records.items.some(
        (record) => record.activityId === fixtures.exactFive.receipt.activityId,
      ),
      false,
    );
  } finally {
    await resetQaPoolUserData({ supabase, userId: owner.id });
    await resetQaPoolUserData({ supabase, userId: other.id });
  }

  const ownerCounts = await getQaUserOwnedCounts(supabase, owner.id);
  const otherCounts = await getQaUserOwnedCounts(supabase, other.id);
  for (const table of QA_TEST_USER_OWNED_TABLES) {
    assert.equal(ownerCounts[table], 0, `${table} was not cleaned for the owner.`);
    assert.equal(otherCounts[table], 0, `${table} was not cleaned for the isolation user.`);
  }
  console.log("Runner activity Gate 4 metric contract passed.");
}

async function proveFitProgressInitialContract(input: {
  userId: string;
  progress: RunnerActivityProgressReadModel;
  completedWithoutFitWorkoutId: string;
}) {
  const metrics = requireCurrent(input.progress);
  assert.equal(metrics.fitProgress.status, "current");
  if (metrics.fitProgress.status !== "current") {
    throw new Error("Expected current FIT Progress readback.");
  }
  const [period] = metrics.fitProgress.chart.advertisedPeriods;
  assert.equal(period.id, "28_days");
  assert.equal(period.label, "28 days");
  assert.equal(period.startDate, addDaysIso(AS_OF_DATE, -27));
  assert.equal(period.endDate, AS_OF_DATE);
  assert.equal(period.series.length, 5);
  assert.deepEqual(
    period.series.map((series) => series.id),
    ["sessions", "running_time", "distance", "elevation", "reported_load"],
  );

  const readySeries = period.series.map((series) => {
    assert.equal(series.status, "ready");
    if (series.status !== "ready") throw new Error("Expected ready FIT chart series.");
    return series;
  });
  const pointWindows = readySeries[0]!.points.map((point) => ({
    startDate: point.startDate,
    endDate: point.endDate,
    completion: point.completion,
  }));
  assert.equal(pointWindows[0]?.startDate, period.startDate);
  assert.equal(pointWindows.at(-1)?.endDate, period.endDate);
  for (const [index, point] of pointWindows.entries()) {
    if (index > 0) assert.equal(point.startDate, addDaysIso(pointWindows[index - 1]!.endDate, 1));
  }
  assert.equal(
    pointWindows[0]?.completion,
    startOfWeekIso(period.startDate) === period.startDate ? "complete" : "partial_start",
  );
  assert.equal(
    pointWindows.at(-1)?.completion,
    addDaysIso(startOfWeekIso(period.endDate), 6) === period.endDate ? "complete" : "to_date",
  );
  for (const series of readySeries.slice(1)) {
    assert.deepEqual(
      series.points.map((point) => [point.startDate, point.endDate, point.completion]),
      readySeries[0]!.points.map((point) => [point.startDate, point.endDate, point.completion]),
    );
  }

  assert.equal(sumReadySeries(readySeries, "sessions"), 7);
  assert.equal(sumReadySeries(readySeries, "distance"), 60.098);
  assert.equal(sumReadySeries(readySeries, "elevation"), 360);
  assert.ok(
    readySeries
      .find((series) => series.id === "running_time")
      ?.points.some((point) => point.state === "partial"),
  );
  assert.ok(
    readySeries
      .find((series) => series.id === "elevation")
      ?.points.some((point) => point.state === "partial"),
  );
  assert.ok(
    readySeries.every((series) =>
      series.points
        .filter((point) => point.coverage.candidateCount === 0)
        .every((point) => point.state === "available" && point.value === 0),
    ),
  );

  assert.deepEqual(
    metrics.fitProgress.personalBests.slots.map((slot) => slot.id),
    ["1_km", "5_km", "10_km", "half_marathon", "marathon"],
  );
  assert.equal(requireFitSlot(metrics, "1_km").state, "no_verified_time");
  assert.equal(requireFitSlot(metrics, "5_km").result?.elapsedSeconds, 1_800);
  assert.equal(requireFitSlot(metrics, "10_km").result?.elapsedSeconds, 2_460);
  assert.equal(requireFitSlot(metrics, "half_marathon").result?.elapsedSeconds, 5_700);
  assert.equal(requireFitSlot(metrics, "marathon").state, "no_verified_time");

  const noFitMatch = await supabase
    .from("runner_activity_planned_workout_matches")
    .select("id")
    .eq("user_id", input.userId)
    .eq("planned_workout_id", input.completedWithoutFitWorkoutId);
  if (noFitMatch.error) throw new Error(noFitMatch.error.message);
  assert.deepEqual(noFitMatch.data, []);
  const noFitLog = await supabase
    .from("workout_logs")
    .select("outcome")
    .eq("user_id", input.userId)
    .eq("planned_workout_id", input.completedWithoutFitWorkoutId)
    .single();
  if (noFitLog.error) throw new Error(noFitLog.error.message);
  assert.equal(noFitLog.data.outcome, "completed");

  const sequence = input.progress.fitActivitySequence;
  assert.equal(sequence.status, "ready");
  if (sequence.status !== "ready") throw new Error("Expected a ready FIT activity sequence.");
  assert.equal(sequence.selectedPeriod.id, "custom");
  assert.equal(sequence.selectedPeriod.startDate, addDaysIso(AS_OF_DATE, -9));
  assert.equal(sequence.selectedPeriod.endDate, AS_OF_DATE);
  assert.equal(sequence.completeness.eligibleActivityCount, 7);
  assert.equal(sequence.completeness.returnedPointCount, 7);
  assert.equal(sequence.points.length, 7);
  assert.deepEqual(
    sequence.points.map((point) => point.historicalTime.localDate),
    [-7, -6, -5, -4, -3, -2, -1].map((offset) => addDaysIso(AS_OF_DATE, offset)),
  );
  assert.ok(sequence.points.every((point, index) => point.sequenceIndex === index));
  const elapsedOnlyPoint = sequence.points.find(
    (point) => point.observations.timer_duration.state === "unavailable",
  );
  assert.ok(elapsedOnlyPoint);
  assert.equal(elapsedOnlyPoint.observations.observed_average_pace.state, "available");
  assert.equal(elapsedOnlyPoint.observations.observed_average_pace.basis.duration, "elapsed");
  assert.equal(elapsedOnlyPoint.observations.reported_load.state, "partial");
  assert.equal(sequence.coverage.timer_duration.includedCount, 6);
  assert.equal(sequence.coverage.reported_load.includedCount, 4);

  const product = projectRunnerActivityProgressForProduct(input.progress);
  assert.equal(product.fitProgress.status, "current");
  assert.equal(product.fitActivitySequence.status, "ready");
  assert.equal(JSON.stringify(product.fitProgress).includes("sourceRevisionId"), false);
  assert.equal(JSON.stringify(product.fitActivitySequence).includes("sourceRevisionId"), false);
  assert.equal(JSON.stringify(product.fitActivitySequence).includes("activityRevisionId"), false);
  assert.equal(JSON.stringify(product.fitProgress).includes("storage"), false);
}

function sumReadySeries(
  series: Array<Extract<RunnerActivityFitChartSeriesForProof, { status: "ready" }>>,
  id: "sessions" | "running_time" | "distance" | "elevation" | "reported_load",
) {
  return roundForProof(
    series
      .find((candidate) => candidate.id === id)!
      .points.reduce((sum, point) => sum + (point.value ?? 0), 0),
  );
}

type RunnerActivityFitChartSeriesForProof = Extract<
  RunnerActivityAdvancedMetricsCurrent["fitProgress"],
  { status: "current" }
>["chart"]["advertisedPeriods"][number]["series"][number];

function requireFitSlot(
  metrics: RunnerActivityAdvancedMetricsCurrent,
  id: "1_km" | "5_km" | "10_km" | "half_marathon" | "marathon",
) {
  assert.equal(metrics.fitProgress.status, "current");
  if (metrics.fitProgress.status !== "current") {
    throw new Error("Expected current FIT Progress readback.");
  }
  const slot = metrics.fitProgress.personalBests.slots.find((candidate) => candidate.id === id);
  if (!slot) throw new Error(`Missing FIT personal-best slot ${id}.`);
  return slot;
}

function roundForProof(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

async function proveFormulaBoundaryMatrix() {
  const activity = syntheticFormulaActivity();
  const [completed] = await buildGate4ObservationDrafts([activity]);
  assert.equal(completed.value, 168);
  assert.equal(completed.confidence, "complete");

  const [partial] = await buildGate4ObservationDrafts([
    {
      ...activity,
      timerDurationMin: 28,
      evidence: {
        ...activity.evidence,
        sessionRpe: {
          ...activity.evidence.sessionRpe!,
          id: randomUUID(),
          sessionRpe: 7,
          completionOutcome: "partial",
        },
      },
    },
  ]);
  assert.equal(partial.value, 196);

  const [plannedDurationIgnored] = await buildGate4ObservationDrafts([
    {
      ...activity,
      timerDurationMin: 38,
      evidence: {
        ...activity.evidence,
        sessionRpe: {
          ...activity.evidence.sessionRpe!,
          id: randomUUID(),
          sessionRpe: 5,
        },
      },
    },
  ]);
  assert.equal(plannedDurationIgnored.value, 190);

  const [skipped] = await buildGate4ObservationDrafts([
    {
      ...activity,
      evidence: {
        ...activity.evidence,
        sessionRpe: {
          ...activity.evidence.sessionRpe!,
          id: randomUUID(),
          lifecycleState: "withdrawn",
          sessionRpe: null,
          completionOutcome: "skipped",
        },
      },
    },
  ]);
  assert.equal(skipped.availability, "unavailable");
  assert.equal(skipped.unavailableReason, "skipped_has_no_session_load");

  const currentFingerprint = await gate4InputFingerprint({ activities: [activity] });
  const priorFormulaFingerprint = await gate4InputFingerprint({
    activities: [activity],
    formulaSetVersion: "runner_activity_gate4_formula_set_v1",
  });
  assert.notEqual(currentFingerprint, priorFormulaFingerprint);
  await proveFitPersonalBestTieBreak();
}

function proveFitActivitySequenceFormulaBoundaryMatrix() {
  const thisWeek = resolveRunnerActivityFitSequencePeriod({
    asOfDate: "2026-08-19",
    timeZone: "America/Sao_Paulo",
    period: { kind: "this_week" },
  });
  assert.deepEqual(thisWeek, {
    id: "this_week",
    label: "This week",
    startDate: "2026-08-17",
    endDate: "2026-08-23",
    asOfDate: "2026-08-19",
    timezoneBasis: {
      period: "runner_calendar_timezone",
      activities: "historical_local_date",
      timeZone: "America/Sao_Paulo",
    },
    futureInterval: { startDate: "2026-08-20", endDate: "2026-08-23" },
  });
  assert.equal(
    resolveRunnerActivityFitSequencePeriod({
      asOfDate: "2026-08-19",
      timeZone: "UTC",
      period: { kind: "last_7_days" },
    }).startDate,
    "2026-08-13",
  );
  assert.equal(
    resolveRunnerActivityFitSequencePeriod({
      asOfDate: "2024-03-01",
      timeZone: "UTC",
      period: { kind: "last_1_month" },
    }).startDate,
    "2024-02-02",
  );
  assert.equal(
    resolveRunnerActivityFitSequencePeriod({
      asOfDate: "2024-08-31",
      timeZone: "UTC",
      period: { kind: "last_6_months" },
    }).startDate,
    "2024-03-01",
  );

  const earlier = {
    ...syntheticFormulaActivity(),
    id: "00000000-0000-4000-8000-000000000002",
    startedAt: `${AS_OF_DATE}T07:00:00Z`,
    distanceKm: 5,
    evidence: { sessionRpe: null, officialResult: null },
  };
  const later = {
    ...syntheticFormulaActivity(),
    id: "00000000-0000-4000-8000-000000000001",
    startedAt: `${AS_OF_DATE}T09:00:00Z`,
    distanceKm: null,
    evidence: { sessionRpe: null, officialResult: null },
  };
  const sequence = buildRunnerActivityFitSequence({
    asOfDate: AS_OF_DATE,
    timeZone: "UTC",
    period: { kind: "custom", startDate: AS_OF_DATE, endDate: AS_OF_DATE },
    activities: [later, earlier],
  });
  assert.equal(sequence.status, "ready");
  if (sequence.status !== "ready") throw new Error("Expected a ready FIT activity sequence.");
  assert.deepEqual(
    sequence.points.map((point) => [point.id, point.sequenceIndex, point.sameDayOrder]),
    [
      [earlier.id, 0, 1],
      [later.id, 1, 2],
    ],
  );
  assert.equal(sequence.completeness.eligibleActivityCount, 2);
  assert.equal(sequence.completeness.returnedPointCount, 2);
  assert.equal(sequence.points[1]?.observations.distance.state, "unavailable");
  assert.equal(sequence.points[1]?.observations.observed_average_pace.state, "unavailable");
  assert.equal(sequence.coverage.distance.includedCount, 1);

  const missingDate = buildRunnerActivityFitSequence({
    asOfDate: AS_OF_DATE,
    timeZone: "UTC",
    period: { kind: "this_week" },
    activities: [{ ...earlier, localDate: null }],
  });
  assert.equal(missingDate.status, "unavailable");
  assert.equal(
    missingDate.status === "unavailable" ? missingDate.reason : null,
    "accepted_fit_activity_missing_historical_local_date",
  );
  assert.deepEqual(missingDate.points, []);
}

async function proveInvalidCustomSequencePeriods(userId: string) {
  assert.throws(
    () => parseRunnerActivityFitSequencePeriodRequest({ kind: "latest_20" }),
    /supported activity period/i,
  );
  await assert.rejects(
    getRunnerActivityProgressForUser({
      userId,
      asOfDate: AS_OF_DATE,
      sequencePeriod: {
        kind: "custom",
        startDate: addDaysIso(AS_OF_DATE, -1),
        endDate: addDaysIso(AS_OF_DATE, 1),
      },
    }),
    /must not follow the runner's current date/i,
  );
  await assert.rejects(
    getRunnerActivityProgressForUser({
      userId,
      asOfDate: AS_OF_DATE,
      sequencePeriod: {
        kind: "custom",
        startDate: AS_OF_DATE,
        endDate: addDaysIso(AS_OF_DATE, -1),
      },
    }),
    /start date must not follow/i,
  );
}

function sequencePeriodForProof(startOffset: number) {
  return {
    kind: "custom" as const,
    startDate: addDaysIso(AS_OF_DATE, startOffset),
    endDate: AS_OF_DATE,
  };
}

async function proveFitPersonalBestTieBreak() {
  const preferredActivityId = "00000000-0000-4000-8000-000000000001";
  const laterActivityId = "00000000-0000-4000-8000-000000000002";
  const candidate = (id: string) => ({
    ...syntheticFormulaActivity(),
    id,
    activityRevisionId: randomUUID(),
    sourceRevisionId: randomUUID(),
    timerDurationMin: 29,
    elapsedDurationMin: 30,
    distanceKm: 5,
    rpeLinkState: "missing" as const,
    rpeInputPresent: false,
    evidence: { sessionRpe: null, officialResult: null },
  });
  const preferred = candidate(preferredActivityId);
  const later = candidate(laterActivityId);
  const build = async (activities: Array<ReturnType<typeof candidate>>) => {
    const observations = (await buildGate4ObservationDrafts(activities)).map((observation) => ({
      ...observation,
      id: randomUUID(),
      localDate: AS_OF_DATE,
    }));
    return buildGate4SnapshotPayload({
      id: randomUUID(),
      asOfDate: AS_OF_DATE,
      historical: false,
      activities,
      observations,
      activityRevisionIds: activities.map((activity) => activity.activityRevisionId),
      evidenceRevisionIds: [],
    });
  };

  for (const activities of [
    [later, preferred],
    [preferred, later],
  ]) {
    const slot = requireFitSlot(await build(activities), "5_km");
    assert.equal(slot.state, "available");
    if (slot.state !== "available") throw new Error("Expected available 5 km FIT result.");
    assert.equal(slot.result?.source.activityId, preferredActivityId);
  }
}

async function proveRecordContextIdentity() {
  const contexts = ["outdoor_road_flat_rolling", "track"];
  const activities = contexts.map((context, index) => {
    const activity = syntheticFormulaActivity();
    return {
      ...activity,
      evidence: {
        sessionRpe: null,
        officialResult: {
          id: randomUUID(),
          activityRevisionId: activity.activityRevisionId,
          kind: "official_result" as const,
          lifecycleState: "asserted" as const,
          sessionRpe: null,
          completionOutcome: null,
          officialDistanceM: 5_000,
          officialElapsedSeconds: 1_500 - index * 30,
          officialEventDate: AS_OF_DATE,
          officialContext: context,
          origin: "runner_direct" as const,
        },
      },
    };
  });
  const observations = (await buildGate4ObservationDrafts(activities)).map((observation) => ({
    ...observation,
    id: randomUUID(),
    localDate: AS_OF_DATE,
  }));
  const snapshot = buildGate4SnapshotPayload({
    id: randomUUID(),
    asOfDate: AS_OF_DATE,
    historical: false,
    activities,
    observations,
    activityRevisionIds: activities.map((activity) => activity.activityRevisionId),
    evidenceRevisionIds: activities.map((activity) => activity.evidence.officialResult.id),
  });
  const records = snapshot.records.items.filter(
    (record) =>
      record.recordClass === "runner_confirmed_official_result" && record.distanceKey === "5_km",
  );
  assert.deepEqual(records.map((record) => record.context).sort(), contexts.sort());
}

async function proveObservedRecordContextIdentity() {
  const contexts = ["outdoor_road_flat_rolling", "track", "treadmill", "trail_mountain"];
  const activities = contexts.map((recordContext, index) => ({
    ...syntheticFormulaActivity(),
    id: randomUUID(),
    activityRevisionId: randomUUID(),
    sourceRevisionId: randomUUID(),
    distanceKm: 5,
    elapsedDurationMin: 30 - index,
    recordContext,
    evidence: { sessionRpe: null, officialResult: null },
  }));
  const observations = (await buildGate4ObservationDrafts(activities)).map((observation) => ({
    ...observation,
    id: randomUUID(),
    localDate: AS_OF_DATE,
  }));
  const snapshot = buildGate4SnapshotPayload({
    id: randomUUID(),
    asOfDate: AS_OF_DATE,
    historical: false,
    activities,
    observations,
    activityRevisionIds: activities.map((activity) => activity.activityRevisionId),
    evidenceRevisionIds: [],
  });
  const records = snapshot.records.items.filter(
    (record) =>
      record.recordClass === "hito_observed_whole_activity" && record.distanceKey === "5_km",
  );
  assert.deepEqual(records.map((record) => record.context).sort(), contexts.sort());
}

async function proveStoredObservedRecordContextIdentity(userId: string) {
  const contexts = ["road", "track", "treadmill", "trail_mountain", null] as const;
  const activities = [];
  for (const [index, runningContext] of contexts.entries()) {
    activities.push(
      await persistGate4SyntheticActivity({
        supabase,
        userId,
        key: `observed-context-${runningContext ?? "unknown"}`,
        localDate: addDaysIso(AS_OF_DATE, -8 - index),
        timerDurationMin: 70 - index,
        elapsedDurationMin: 70 - index,
        distanceKm: 15,
        runningContext,
      }),
    );
  }

  const progress = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  const records = progress.records.items.filter(
    (record) =>
      record.recordClass === "hito_observed_whole_activity" && record.distanceKey === "15_km",
  );
  assert.equal(records.length, contexts.length);
  assert.deepEqual(
    records.map((record) => record.context).sort(compareNullableContext),
    [...contexts].sort(compareNullableContext),
  );
  assert.equal(
    records.every((record) =>
      activities.some((activity) => activity.receipt.activityId === record.activityId),
    ),
    true,
  );
}

function compareNullableContext(left: string | null, right: string | null) {
  return (left ?? "context_unknown").localeCompare(right ?? "context_unknown");
}

async function proveAsOfCutoffExcludesFutureActivity(userId: string) {
  const future = await persistGate4SyntheticActivity({
    supabase,
    userId,
    key: "as-of-cutoff-future",
    localDate: addDaysIso(AS_OF_DATE, 1),
    timerDurationMin: 24,
    elapsedDurationMin: 25,
    distanceKm: 5,
  });
  const current = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  assert.equal(
    current.records.items.some((record) => record.activityId === future.receipt.activityId),
    false,
  );
  assert.equal(
    current.evidence.activityRevisionIds.includes(future.receipt.activityRevisionId),
    false,
  );
}

async function proveWorkoutLogDeletionLifecycle(
  userId: string,
  activity: Gate4SyntheticActivity & { plannedWorkoutId: string },
) {
  const before = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  const log = await supabase
    .from("workout_logs")
    .select("id, outcome, rpe, actual_duration_min")
    .eq("user_id", userId)
    .eq("planned_workout_id", activity.plannedWorkoutId)
    .single();
  if (log.error) throw new Error(log.error.message);
  const beforeDeleteEvidence = await supabase
    .from("runner_activity_evidence_revisions")
    .select("origin, workout_log_id")
    .eq("user_id", userId)
    .eq("activity_id", activity.receipt.activityId)
    .eq("evidence_kind", "session_rpe")
    .order("revision_number", { ascending: false })
    .limit(1)
    .single();
  if (beforeDeleteEvidence.error) throw new Error(beforeDeleteEvidence.error.message);
  assert.equal(beforeDeleteEvidence.data.origin, "workout_log_backfill");
  assert.equal(beforeDeleteEvidence.data.workout_log_id, log.data.id);
  const deleted = await supabase.from("workout_logs").delete().eq("id", log.data.id).select("id");
  if (deleted.error) throw new Error(deleted.error.message);
  assert.deepEqual(deleted.data, [{ id: log.data.id }]);

  const withdrawn = await supabase
    .from("runner_activity_evidence_revisions")
    .select("lifecycle_state, change_reason, predecessor_revision_id")
    .eq("user_id", userId)
    .eq("activity_id", activity.receipt.activityId)
    .eq("evidence_kind", "session_rpe")
    .order("revision_number", { ascending: true });
  if (withdrawn.error) throw new Error(withdrawn.error.message);
  assert.equal(withdrawn.data.length, 2);
  const currentEvidence = withdrawn.data.at(-1)!;
  assert.equal(currentEvidence.lifecycle_state, "withdrawn");
  assert.equal(currentEvidence.change_reason, "workout_log_sync");
  assert.ok(currentEvidence.predecessor_revision_id);
  const afterDelete = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  assert.equal(
    afterDelete.sessionRpeLoad.rolling28Day.current.metric.value,
    (before.sessionRpeLoad.rolling28Day.current.metric.value ?? 0) - 120,
  );

  const restored = await supabase.from("workout_logs").insert({
    user_id: userId,
    planned_workout_id: activity.plannedWorkoutId,
    outcome: log.data.outcome,
    rpe: log.data.rpe,
    actual_duration_min: log.data.actual_duration_min,
  });
  if (restored.error) throw new Error(restored.error.message);
  const afterRestore = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  assert.equal(
    afterRestore.sessionRpeLoad.rolling28Day.current.metric.value,
    before.sessionRpeLoad.rolling28Day.current.metric.value,
  );
}

async function proveHistoricalFormulaVersionReadback(
  userId: string,
  current: RunnerActivityAdvancedMetricsCurrent,
) {
  const source = await supabase
    .from("runner_activity_metric_snapshots")
    .select("*")
    .eq("id", current.snapshotId)
    .single();
  if (source.error) throw new Error(source.error.message);
  const snapshotId = randomUUID();
  const formulaSetVersion = "runner_activity_gate4_formula_set_v0";
  const formulaVersions = {
    personalBest: "personal_best_elapsed_v0",
    sessionRpeLoad: "session_rpe_load_v0",
  };
  const sourceObservations = await supabase
    .from("runner_activity_metric_observations")
    .select("*")
    .eq("user_id", userId)
    .in("id", current.evidence.observationIds);
  if (sourceObservations.error) throw new Error(sourceObservations.error.message);
  assert.equal(sourceObservations.data.length, current.evidence.observationIds.length);
  const observationIdMap = new Map<string, string>();
  const versionedObservations = sourceObservations.data.map((observation) => {
    const id = randomUUID();
    observationIdMap.set(observation.id, id);
    return {
      ...observation,
      id,
      metric_formula_version:
        observation.metric_key === "personal_best_elapsed"
          ? formulaVersions.personalBest
          : formulaVersions.sessionRpeLoad,
    };
  });
  const insertedObservations = await supabase
    .from("runner_activity_metric_observations")
    .insert(versionedObservations);
  if (insertedObservations.error) throw new Error(insertedObservations.error.message);

  const metricPayload = structuredClone(current);
  metricPayload.snapshotId = snapshotId;
  metricPayload.historical = false;
  metricPayload.formulaSetVersion = formulaSetVersion;
  metricPayload.formulaVersions = formulaVersions;
  metricPayload.records.items = metricPayload.records.items.map((record) => ({
    ...record,
    observationId: observationIdMap.get(record.observationId)!,
    formulaVersion: formulaVersions.personalBest,
  }));
  for (const window of [
    metricPayload.sessionRpeLoad.rolling28Day.current,
    metricPayload.sessionRpeLoad.rolling28Day.previous,
    ...metricPayload.sessionRpeLoad.calendarWeeks,
  ]) {
    window.metric.observationIds = window.metric.observationIds.map(
      (observationId) => observationIdMap.get(observationId)!,
    );
  }
  metricPayload.evidence.observationIds = metricPayload.evidence.observationIds
    .map((observationId) => observationIdMap.get(observationId)!)
    .sort();
  const inserted = await supabase.from("runner_activity_metric_snapshots").insert({
    ...source.data,
    id: snapshotId,
    formula_set_version: formulaSetVersion,
    formula_versions: formulaVersions,
    metric_payload: metricPayload,
    observation_ids: metricPayload.evidence.observationIds,
  });
  if (inserted.error) throw new Error(inserted.error.message);
  const historical = await getHistoricalRunnerActivityMetricSnapshotForUser({
    userId,
    snapshotId,
  });
  assert.equal(historical.historical, true);
  assert.equal(historical.formulaSetVersion, formulaSetVersion);
  assert.deepEqual(historical.formulaVersions, formulaVersions);
  assert.deepEqual(historical.fitProgress, {
    status: "unavailable",
    reason: "historical_formula_version_without_fit_progress",
  });
  assert.ok(historical.records.items.every((record) => record.formulaVersion.endsWith("_v0")));
  assert.deepEqual(historical.evidence.observationIds, metricPayload.evidence.observationIds);
  const stillCurrent = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  assert.equal(stillCurrent.formulaSetVersion, RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION);
}

async function proveImmutableRpeLifecycle(
  userId: string,
  activity: Gate4SyntheticActivity,
  initialSnapshotId: string,
) {
  await assert.rejects(
    recordRunnerActivitySessionRpeForUser(userId, {
      activityId: activity.receipt.activityId,
      activityRevisionId: activity.receipt.activityRevisionId,
      rpe: 0,
      outcome: "completed",
    }),
  );
  const first = await recordRunnerActivitySessionRpeForUser(userId, {
    activityId: activity.receipt.activityId,
    activityRevisionId: activity.receipt.activityRevisionId,
    rpe: 4,
    outcome: "completed",
  });
  const firstMetrics = requireCurrent(first.progress);
  assert.equal(firstMetrics.sessionRpeLoad.rolling28Day.current.metric.value, 954);
  const historicalInitial = await getHistoricalRunnerActivityMetricSnapshotForUser({
    userId,
    snapshotId: initialSnapshotId,
  });
  assert.equal(historicalInitial.historical, true);
  assert.equal(historicalInitial.formulaSetVersion, RUNNER_ACTIVITY_GATE4_FORMULA_SET_VERSION);

  const corrected = await recordRunnerActivitySessionRpeForUser(userId, {
    activityId: activity.receipt.activityId,
    activityRevisionId: activity.receipt.activityRevisionId,
    rpe: 5,
    outcome: "completed",
    expectedEvidenceRevisionId: first.evidence.evidenceRevisionId,
  });
  const correctedMetrics = requireCurrent(corrected.progress);
  assert.equal(correctedMetrics.sessionRpeLoad.rolling28Day.current.metric.value, 1024);
  assert.notEqual(correctedMetrics.snapshotId, firstMetrics.snapshotId);

  const history = await supabase
    .from("runner_activity_evidence_revisions")
    .select("id, revision_number, predecessor_revision_id, session_rpe")
    .eq("user_id", userId)
    .eq("activity_id", activity.receipt.activityId)
    .eq("evidence_kind", "session_rpe")
    .order("revision_number", { ascending: true });
  if (history.error) throw new Error(history.error.message);
  assert.equal(history.data.length, 2);
  assert.equal(history.data[0].session_rpe, 4);
  assert.equal(history.data[1].session_rpe, 5);
  assert.equal(history.data[1].predecessor_revision_id, history.data[0].id);

  const stale = recordRunnerActivitySessionRpeForUser(userId, {
    activityId: activity.receipt.activityId,
    activityRevisionId: activity.receipt.activityRevisionId,
    rpe: 6,
    outcome: "completed",
    expectedEvidenceRevisionId: first.evidence.evidenceRevisionId,
  });
  await assert.rejects(stale, /stale/i);
}

async function proveDuplicateWorkoutLinkRejected(
  userId: string,
  completed: Gate4SyntheticActivity & { plannedWorkoutId: string },
) {
  const duplicate = await persistGate4SyntheticActivity({
    supabase,
    userId,
    key: "ambiguous-second-activity",
    localDate: addDaysIso(AS_OF_DATE, -4),
    timerDurationMin: 25,
    elapsedDurationMin: 27,
    distanceKm: 3.5,
  });
  await assert.rejects(
    createRunnerActivityPlannedWorkoutMatch({
      userId,
      activityId: duplicate.receipt.activityId,
      sourceRevisionId: duplicate.receipt.sourceRevisionId,
      plannedWorkoutId: completed.plannedWorkoutId,
    }),
    /duplicate key value violates unique constraint/,
  );
  const matches = await supabase
    .from("runner_activity_planned_workout_matches")
    .select("activity_id")
    .eq("user_id", userId)
    .eq("planned_workout_id", completed.plannedWorkoutId);
  if (matches.error) throw new Error(matches.error.message);
  assert.deepEqual(matches.data, [{ activity_id: completed.receipt.activityId }]);

  const unambiguous = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  assert.equal(
    unambiguous.sessionRpeLoad.rolling28Day.current.metric.unavailableReasons.includes(
      "activity_rpe_link_ambiguous",
    ),
    false,
  );

  await deleteRunnerActivityFromHistory({ userId, activityId: duplicate.receipt.activityId });
  const workout = await supabase
    .from("planned_workouts")
    .select("id, plan_cycle_id, origin_kind")
    .eq("id", completed.plannedWorkoutId)
    .eq("user_id", userId)
    .single();
  if (workout.error) throw new Error(workout.error.message);
  assert.equal(workout.data.plan_cycle_id, null);
  assert.equal(workout.data.origin_kind, "manual");
}

async function proveOfficialResultLifecycle(userId: string, activity: Gate4SyntheticActivity) {
  await assert.rejects(
    confirmRunnerActivityOfficialResultForUser(userId, {
      activityId: activity.receipt.activityId,
      activityRevisionId: activity.receipt.activityRevisionId,
      distanceMeters: 12_000,
      elapsedSeconds: 3_500,
      eventDate: activity.parsed.activityLocalDate!,
      context: "road",
    }),
  );
  const confirmed = await confirmRunnerActivityOfficialResultForUser(userId, {
    activityId: activity.receipt.activityId,
    activityRevisionId: activity.receipt.activityRevisionId,
    distanceMeters: 10_000,
    elapsedSeconds: 3_500,
    eventDate: activity.parsed.activityLocalDate!,
    context: "road",
  });
  const confirmedMetrics = requireCurrent(confirmed.progress);
  assertRecord(confirmedMetrics, "runner_confirmed_official_result", "10_km", 3_500);

  const corrected = await correctRunnerActivityOfficialResultForUser(userId, {
    activityId: activity.receipt.activityId,
    activityRevisionId: activity.receipt.activityRevisionId,
    distanceMeters: 10_000,
    elapsedSeconds: 3_400,
    eventDate: activity.parsed.activityLocalDate!,
    context: "road",
    expectedEvidenceRevisionId: confirmed.evidence.evidenceRevisionId,
  });
  const correctedMetrics = requireCurrent(corrected.progress);
  assertRecord(correctedMetrics, "runner_confirmed_official_result", "10_km", 3_400);
  const historical = await getHistoricalRunnerActivityMetricSnapshotForUser({
    userId,
    snapshotId: confirmedMetrics.snapshotId,
  });
  assertRecord(historical, "runner_confirmed_official_result", "10_km", 3_500);

  const withdrawn = await withdrawRunnerActivityOfficialResultForUser(userId, {
    activityId: activity.receipt.activityId,
    activityRevisionId: activity.receipt.activityRevisionId,
    expectedEvidenceRevisionId: corrected.evidence.evidenceRevisionId,
  });
  const withdrawnMetrics = requireCurrent(withdrawn.progress);
  assert.equal(
    withdrawnMetrics.records.items.some(
      (record) =>
        record.recordClass === "runner_confirmed_official_result" &&
        record.activityId === activity.receipt.activityId,
    ),
    false,
  );
  assert.ok(withdrawnMetrics.records.unavailableReasons.includes("official_result_not_confirmed"));
}

async function proveRpeActivityRevisionReattribution(
  userId: string,
  activity: Gate4SyntheticActivity & { plannedWorkoutId: string },
) {
  const priorEvidence = await readCurrentRunnerActivityEvidenceForUser({
    userId,
    activityId: activity.receipt.activityId,
    evidenceKind: "session_rpe",
  });
  assert.ok(priorEvidence);
  const direct = await recordRunnerActivitySessionRpeForUser(userId, {
    activityId: activity.receipt.activityId,
    activityRevisionId: activity.receipt.activityRevisionId,
    rpe: 8,
    outcome: "completed",
    expectedEvidenceRevisionId: priorEvidence.id,
  });
  const before = requireCurrent(direct.progress);
  const removed = await removeRunnerActivityOriginalFilesForActivity({
    userId,
    activityId: activity.receipt.activityId,
  });
  assert.equal(removed.status, "current");
  if (removed.status !== "current") throw new Error("Expected current source removal readback.");
  assert.notEqual(requireCurrent(removed.progress).snapshotId, before.snapshotId);

  const correctedSource = await persistGate4SyntheticActivity({
    supabase,
    ...activity.input,
    timerDurationMin: (activity.input.timerDurationMin ?? 0) + 1,
    storageSuffix: "revision-2",
  });
  assert.equal(correctedSource.receipt.activityId, activity.receipt.activityId);
  assert.notEqual(correctedSource.receipt.activityRevisionId, activity.receipt.activityRevisionId);
  const latestEvidence = await supabase
    .from("runner_activity_evidence_revisions")
    .select(
      "id, activity_revision_id, change_reason, predecessor_revision_id, session_rpe, completion_outcome, origin",
    )
    .eq("user_id", userId)
    .eq("activity_id", activity.receipt.activityId)
    .eq("evidence_kind", "session_rpe")
    .order("revision_number", { ascending: false })
    .limit(1)
    .single();
  if (latestEvidence.error) throw new Error(latestEvidence.error.message);
  assert.equal(
    latestEvidence.data.activity_revision_id,
    correctedSource.receipt.activityRevisionId,
  );
  assert.equal(latestEvidence.data.change_reason, "activity_revision_changed");
  assert.ok(latestEvidence.data.predecessor_revision_id);
  assert.equal(latestEvidence.data.session_rpe, 8);
  assert.equal(latestEvidence.data.completion_outcome, "completed");
  assert.equal(latestEvidence.data.origin, "runner_direct");
  const after = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  assert.equal(
    after.sessionRpeLoad.rolling28Day.current.metric.value,
    (before.sessionRpeLoad.rolling28Day.current.metric.value ?? 0) + 8,
  );

  const deletedLog = await supabase
    .from("workout_logs")
    .delete()
    .eq("user_id", userId)
    .eq("planned_workout_id", activity.plannedWorkoutId)
    .select("id");
  if (deletedLog.error) throw new Error(deletedLog.error.message);
  assert.equal(deletedLog.data.length, 1);
  const afterLogDelete = await readCurrentRunnerActivityEvidenceForUser({
    userId,
    activityId: activity.receipt.activityId,
    evidenceKind: "session_rpe",
  });
  assert.equal(afterLogDelete?.id, latestEvidence.data.id);
  assert.equal(afterLogDelete?.session_rpe, 8);
  assert.equal(afterLogDelete?.origin, "runner_direct");
}

async function proveRawRemovalAndRevisionInvalidation(
  userId: string,
  activity: Gate4SyntheticActivity,
) {
  const confirmed = await confirmRunnerActivityOfficialResultForUser(userId, {
    activityId: activity.receipt.activityId,
    activityRevisionId: activity.receipt.activityRevisionId,
    distanceMeters: 21_097.5,
    elapsedSeconds: 6_900,
    eventDate: activity.parsed.activityLocalDate!,
    context: "road",
  });
  const beforeRemoval = requireCurrent(confirmed.progress);
  const removed = await removeRunnerActivityOriginalFilesForActivity({
    userId,
    activityId: activity.receipt.activityId,
  });
  assert.equal(removed.status, "current");
  if (removed.status !== "current") throw new Error("Expected current source removal readback.");
  assert.notEqual(requireCurrent(removed.progress).snapshotId, beforeRemoval.snapshotId);

  const correctedSource = await persistGate4SyntheticActivity({
    supabase,
    ...activity.input,
    timerDurationMin: (activity.input.timerDurationMin ?? 0) + 1,
    storageSuffix: "revision-2",
  });
  assert.equal(correctedSource.receipt.activityId, activity.receipt.activityId);
  assert.notEqual(correctedSource.receipt.activityRevisionId, activity.receipt.activityRevisionId);
  const current = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  assert.equal(
    current.records.items.some(
      (record) =>
        record.recordClass === "runner_confirmed_official_result" &&
        record.activityId === activity.receipt.activityId,
    ),
    false,
  );
  assert.ok(current.records.unavailableReasons.includes("activity_revision_invalidated"));
  const evidence = await readCurrentRunnerActivityEvidenceForUser({
    userId,
    activityId: activity.receipt.activityId,
    evidenceKind: "official_result",
  });
  assert.equal(evidence?.activity_revision_id, activity.receipt.activityRevisionId);
  const invalidated = await supabase
    .from("runner_activity_metric_observations")
    .select("unavailable_reason")
    .eq("user_id", userId)
    .eq("activity_id", activity.receipt.activityId)
    .eq("unavailable_reason", "activity_revision_invalidated");
  if (invalidated.error) throw new Error(invalidated.error.message);
  assert.ok(invalidated.data.length > 0);
}

async function provePartialRawRemovalTruth(userId: string, first: Gate4SyntheticActivity) {
  const second = await persistGate4SyntheticActivity({
    supabase,
    userId,
    key: "partial-source-removal",
    localDate: addDaysIso(AS_OF_DATE, -8),
    timerDurationMin: 20,
    elapsedDurationMin: 22,
    distanceKm: 3,
  });
  let removalIndex = 0;
  await assert.rejects(
    removeRunnerActivityOriginalFiles(
      {
        userId,
        sourceRevisionIds: [first.receipt.sourceRevisionId, second.receipt.sourceRevisionId],
      },
      async (revision) => {
        removalIndex += 1;
        if (removalIndex === 2) throw new Error("Synthetic second-object removal failure.");
        if (!revision.raw_storage_bucket || !revision.raw_storage_path) return;
        const removed = await supabase.storage
          .from(revision.raw_storage_bucket)
          .remove([revision.raw_storage_path]);
        if (removed.error) throw new Error(removed.error.message);
      },
    ),
  );
  const states = await supabase
    .from("runner_activity_source_revisions")
    .select("id, raw_state, raw_storage_bucket, raw_storage_path")
    .in("id", [first.receipt.sourceRevisionId, second.receipt.sourceRevisionId]);
  if (states.error) throw new Error(states.error.message);
  const stateById = new Map(states.data.map((state) => [state.id, state]));
  assert.equal(stateById.get(first.receipt.sourceRevisionId)?.raw_state, "removed");
  assert.equal(stateById.get(first.receipt.sourceRevisionId)?.raw_storage_path, null);
  assert.equal(stateById.get(second.receipt.sourceRevisionId)?.raw_state, "available");
  const removedObject = await supabase.storage
    .from(first.receipt.rawStorageBucket!)
    .download(first.receipt.rawStoragePath!);
  assert.ok(removedObject.error);
  const afterRemovalProgress = await getRunnerActivityProgressForUser({
    userId,
    asOfDate: AS_OF_DATE,
    sequencePeriod: sequencePeriodForProof(-8),
  });
  const afterRemoval = requireCurrent(afterRemovalProgress);
  assert.equal(requireFitSlot(afterRemoval, "5_km").result?.elapsedSeconds, 2_640);
  assert.ok(
    afterRemovalProgress.fitActivitySequence.status === "ready" ||
      afterRemovalProgress.fitActivitySequence.status === "empty",
  );
  if (
    afterRemovalProgress.fitActivitySequence.status !== "ready" &&
    afterRemovalProgress.fitActivitySequence.status !== "empty"
  ) {
    throw new Error("Expected a complete FIT activity sequence after removal.");
  }
  assert.equal(
    afterRemovalProgress.fitActivitySequence.points.some(
      (point) => point.id === first.receipt.activityId,
    ),
    false,
  );

  const corrected = await persistGate4SyntheticActivity({
    supabase,
    ...first.input,
    timerDurationMin: 29,
    elapsedDurationMin: 29,
    storageSuffix: "fit-progress-correction",
  });
  assert.equal(corrected.receipt.activityId, first.receipt.activityId);
  assert.notEqual(corrected.receipt.activityRevisionId, first.receipt.activityRevisionId);
  const afterCorrectionProgress = await getRunnerActivityProgressForUser({
    userId,
    asOfDate: AS_OF_DATE,
    sequencePeriod: sequencePeriodForProof(-8),
  });
  const afterCorrection = requireCurrent(afterCorrectionProgress);
  assert.equal(requireFitSlot(afterCorrection, "5_km").result?.elapsedSeconds, 1_740);
  assert.equal(afterCorrectionProgress.fitActivitySequence.status, "ready");
  if (afterCorrectionProgress.fitActivitySequence.status !== "ready") {
    throw new Error("Expected a ready FIT activity sequence after correction.");
  }
  const correctedPoint = afterCorrectionProgress.fitActivitySequence.points.find(
    (point) => point.id === first.receipt.activityId,
  );
  assert.equal(correctedPoint?.observations.timer_duration.value, 29);

  const history = await listRunnerActivityHistoryForUser({ userId, pageSize: 50 });
  const retryable = history.items.find((item) => item.id === second.receipt.activityId);
  assert.ok(retryable);
  assert.equal(retryable.source.rawState, "available");
  assert.equal(retryable.source.originalRetained, true);
  assert.equal(retryable.quality.updating, false);
  assert.equal(retryable.capabilities.canRemoveOriginalFile, true);

  await markRunnerActivitySourceRemovalPendingForFixture({
    supabase,
    userId,
    sourceRevisionId: second.receipt.sourceRevisionId,
  });
  const pendingHistory = await listRunnerActivityHistoryForUser({ userId, pageSize: 50 });
  const pendingRetry = pendingHistory.items.find((item) => item.id === second.receipt.activityId);
  assert.ok(pendingRetry);
  assert.equal(pendingRetry.source.rawState, "removal_pending");
  assert.equal(pendingRetry.source.originalRetained, false);
  assert.equal(pendingRetry.quality.updating, false);
  assert.equal(pendingRetry.capabilities.canRemoveOriginalFile, true);

  await removeRunnerActivityOriginalFiles({
    userId,
    sourceRevisionIds: [second.receipt.sourceRevisionId],
  });
  const retried = await supabase
    .from("runner_activity_source_revisions")
    .select("raw_state")
    .eq("id", second.receipt.sourceRevisionId)
    .single();
  if (retried.error) throw new Error(retried.error.message);
  assert.equal(retried.data.raw_state, "removed");
  await deleteRunnerActivityFromHistory({ userId, activityId: second.receipt.activityId });
}

async function proveFitUpdatingAndUnavailableStates(userId: string) {
  const activity = await persistGate4SyntheticActivity({
    supabase,
    userId,
    key: "fit-progress-updating-1km",
    localDate: addDaysIso(AS_OF_DATE, -10),
    timerDurationMin: 4,
    elapsedDurationMin: 4,
    distanceKm: 1,
    elevationGainM: 12,
  });
  await markRunnerActivitySourceRemovalPendingForFixture({
    supabase,
    userId,
    sourceRevisionId: activity.receipt.sourceRevisionId,
  });
  const updatingProgress = await getRunnerActivityProgressForUser({
    userId,
    asOfDate: AS_OF_DATE,
    sequencePeriod: sequencePeriodForProof(-10),
  });
  assert.equal(updatingProgress.fitActivitySequence.status, "updating");
  assert.deepEqual(updatingProgress.fitActivitySequence.points, []);
  const updating = requireCurrent(updatingProgress);
  assert.equal(requireFitSlot(updating, "1_km").state, "updating");
  assert.equal(updating.fitProgress.status, "current");
  if (updating.fitProgress.status !== "current") {
    throw new Error("Expected current FIT Progress readback.");
  }
  assert.ok(
    updating.fitProgress.chart.advertisedPeriods[0].series.every(
      (series) => series.status === "updating" && series.points.length === 0,
    ),
  );

  const removal = await removeRunnerActivityOriginalFilesForActivity({
    userId,
    activityId: activity.receipt.activityId,
  });
  assert.equal(removal.status, "current");
  if (removal.status !== "current") throw new Error("Expected current source removal readback.");
  const removed = requireCurrent(removal.progress);
  const slot = requireFitSlot(removed, "1_km");
  assert.equal(slot.state, "unavailable");
  assert.equal(slot.reason, "fit_source_removed");
  assert.equal(removed.fitProgress.status, "current");
  if (removed.fitProgress.status !== "current") {
    throw new Error("Expected current FIT Progress readback.");
  }
  assert.ok(
    removed.fitProgress.chart.advertisedPeriods[0].series.some(
      (series) =>
        series.status === "ready" &&
        series.points.some((point) => point.reasons.includes("fit_source_removed")),
    ),
  );
  const removedSequence = await getRunnerActivityProgressForUser({
    userId,
    asOfDate: AS_OF_DATE,
    sequencePeriod: sequencePeriodForProof(-10),
  });
  assert.ok(
    removedSequence.fitActivitySequence.status === "ready" ||
      removedSequence.fitActivitySequence.status === "empty",
  );
  if (
    removedSequence.fitActivitySequence.status !== "ready" &&
    removedSequence.fitActivitySequence.status !== "empty"
  ) {
    throw new Error("Expected a complete FIT activity sequence after source removal.");
  }
  assert.equal(
    removedSequence.fitActivitySequence.points.some(
      (point) => point.id === activity.receipt.activityId,
    ),
    false,
  );
  await deleteRunnerActivityFromHistory({ userId, activityId: activity.receipt.activityId });
}

async function proveFitProgressIsolation(otherUserId: string) {
  const progress = await getRunnerActivityProgressForUser({
    userId: otherUserId,
    asOfDate: AS_OF_DATE,
  });
  assert.equal(progress.fitActivitySequence.status, "empty");
  if (progress.fitActivitySequence.status !== "empty") {
    throw new Error("Expected an empty isolated FIT activity sequence.");
  }
  assert.equal(progress.fitActivitySequence.completeness.eligibleActivityCount, 0);
  assert.deepEqual(progress.fitActivitySequence.points, []);
  const metrics = requireCurrent(progress);
  assert.equal(metrics.fitProgress.status, "current");
  if (metrics.fitProgress.status !== "current") {
    throw new Error("Expected current FIT Progress readback.");
  }
  assert.ok(
    metrics.fitProgress.chart.advertisedPeriods[0].series.every(
      (series) =>
        series.status === "ready" &&
        series.points.every(
          (point) =>
            point.state === "available" && point.value === 0 && point.coverage.candidateCount === 0,
        ),
    ),
  );
  assert.ok(
    metrics.fitProgress.personalBests.slots.every(
      (slot) => slot.state === "no_verified_time" && slot.result === null,
    ),
  );
}

async function proveFreshReadNeverReturnsStale(userId: string) {
  const current = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  const snapshot = await supabase
    .from("runner_activity_metric_snapshots")
    .select("*")
    .eq("id", current.snapshotId)
    .single();
  if (snapshot.error) throw new Error(snapshot.error.message);
  const removed = await supabase
    .from("runner_activity_metric_snapshots")
    .delete()
    .eq("id", current.snapshotId);
  if (removed.error) throw new Error(removed.error.message);
  const missingFitProgressPayload = structuredClone(snapshot.data.metric_payload) as Record<
    string,
    unknown
  >;
  delete missingFitProgressPayload.fitProgress;
  const poisoned = await supabase.from("runner_activity_metric_snapshots").insert({
    ...snapshot.data,
    metric_payload: missingFitProgressPayload,
  });
  if (poisoned.error) throw new Error(poisoned.error.message);

  await assert.rejects(getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }));
  const updating = metricRecalculationPendingReadback(
    new RunnerActivityMetricRecalculationPendingError(),
    AS_OF_DATE,
  );
  assert.equal(updating.status, "updating");
  assert.equal(updating.staleValuesReturned, false);
  assert.throws(() => metricRecalculationPendingReadback(new Error("database failed"), AS_OF_DATE));

  const cleanup = await supabase
    .from("runner_activity_metric_snapshots")
    .delete()
    .eq("id", current.snapshotId);
  if (cleanup.error) throw new Error(cleanup.error.message);
  const recovered = requireCurrent(
    await getRunnerActivityProgressForUser({ userId, asOfDate: AS_OF_DATE }),
  );
  assert.notEqual(recovered.snapshotId, current.snapshotId);
}

async function proveMetricRls(input: {
  ownerRole: keyof typeof QA_TESTER_POOL;
  otherRole: keyof typeof QA_TESTER_POOL;
}) {
  const ownerUser = await ensureUser(input.ownerRole);
  const ownEvidence = await supabase
    .from("runner_activity_evidence_revisions")
    .select("id, activity_id, activity_revision_id")
    .eq("user_id", ownerUser.id)
    .limit(1);
  if (ownEvidence.error) throw new Error(ownEvidence.error.message);
  assert.ok(ownEvidence.data.length > 0);

  const owner = await signedInClient(input.ownerRole);
  for (const table of [
    "runner_activity_evidence_revisions",
    "runner_activity_metric_observations",
    "runner_activity_metric_snapshots",
  ] as const) {
    const result = await owner.from(table).select("id");
    assert.equal(result.error?.code, "42501");
    assert.equal(result.data, null);
  }
  const forbiddenWrite = await owner.from("runner_activity_metric_snapshots").insert({
    user_id: (await owner.auth.getUser()).data.user?.id ?? randomUUID(),
    as_of_date: AS_OF_DATE,
    formula_set_version: "forbidden",
    formula_versions: {},
    input_fingerprint_sha256: "0".repeat(64),
    calculation_status: "current",
    metric_payload: {},
    observation_ids: [],
    input_activity_revisions: [],
    input_evidence_revisions: [],
    creation_cause: "read_reconciliation",
  });
  assert.ok(forbiddenWrite.error);
  const forbiddenRpc = await owner.rpc("append_runner_activity_evidence_revision", {
    p_user_id: (await owner.auth.getUser()).data.user?.id ?? randomUUID(),
    p_activity_id: ownEvidence.data[0]!.activity_id,
    p_expected_activity_revision_id: ownEvidence.data[0]!.activity_revision_id,
    p_evidence_kind: "session_rpe",
    p_lifecycle_state: "asserted",
    p_session_rpe: 5,
    p_completion_outcome: "completed",
  });
  assert.ok(forbiddenRpc.error);
  await owner.auth.signOut();

  const other = await signedInClient(input.otherRole);
  for (const table of [
    "runner_activity_evidence_revisions",
    "runner_activity_metric_observations",
    "runner_activity_metric_snapshots",
  ] as const) {
    const result = await other.from(table).select("id");
    assert.equal(result.error?.code, "42501");
    assert.equal(result.data, null);
  }
  await other.auth.signOut();
}

function syntheticFormulaActivity() {
  const activityRevisionId = randomUUID();
  return {
    id: randomUUID(),
    activityRevisionId,
    sourceRevisionId: randomUUID(),
    localDate: AS_OF_DATE,
    startedAt: `${AS_OF_DATE}T08:00:00Z`,
    historicalTimezone: "UTC",
    timerDurationMin: 42,
    elapsedDurationMin: 45,
    distanceKm: null,
    elevationGainM: null,
    fitEvidence: { state: "eligible" as const, reason: null },
    recordContext: null,
    workoutClassification: null,
    rpeLinkState: "exact" as const,
    rpeInputPresent: true,
    evidence: {
      sessionRpe: {
        id: randomUUID(),
        activityRevisionId,
        kind: "session_rpe" as const,
        lifecycleState: "asserted" as const,
        sessionRpe: 4,
        completionOutcome: "completed" as const,
        officialDistanceM: null,
        officialElapsedSeconds: null,
        officialEventDate: null,
        officialContext: null,
        origin: "runner_direct" as const,
      },
      officialResult: null,
    },
  };
}

function requireCurrent(progress: RunnerActivityProgressReadModel) {
  assert.equal(progress.advancedMetrics.status, "current");
  if (progress.advancedMetrics.status !== "current") {
    throw new Error("Expected current Gate 4 metric readback.");
  }
  return progress.advancedMetrics;
}

function assertRecord(
  metrics: RunnerActivityAdvancedMetricsCurrent,
  recordClass: "hito_observed_whole_activity" | "runner_confirmed_official_result",
  distanceKey: string,
  elapsedSeconds: number,
) {
  assert.ok(
    metrics.records.items.some(
      (record) =>
        record.recordClass === recordClass &&
        record.distanceKey === distanceKey &&
        record.elapsedSeconds === elapsedSeconds,
    ),
    `Missing ${recordClass} ${distanceKey} at ${elapsedSeconds}s.`,
  );
}

function assertGate5Unavailable(metrics: RunnerActivityAdvancedMetricsCurrent) {
  assert.equal(metrics.records.calculatedWithinActivity.status, "unavailable");
  assert.equal(metrics.records.calculatedWithinActivity.reason, "normalized_stream_not_persisted");
  for (const metric of Object.values(metrics.streamDependentMetrics)) {
    assert.equal(metric.status, "unavailable");
    assert.equal(metric.reason, "normalized_stream_not_persisted");
  }
}

await main();
