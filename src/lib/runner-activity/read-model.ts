import "@tanstack/react-start/server-only";

import { z } from "zod";
import { getRunnerActivityProgressFactsForUser } from "@/lib/runner-activity/fact-snapshots";
import { listRunnerActivityHistoryForUser } from "@/lib/runner-activity/history-read-model";
import {
  getRunnerActivityProgressMetricsForUser,
  metricRecalculationPendingReadback,
} from "@/lib/runner-activity/metric-snapshots";
import { runnerActivityFitSequencePendingReadback } from "@/lib/runner-activity/metric-formulas";
import type { RunnerActivityMetricCreationCause } from "@/lib/runner-activity/metric-snapshots";
import {
  projectRunnerActivityHistoryForProduct,
  projectRunnerActivityProgressForProduct,
  RUNNER_FITNESS_PROFILE_FORMULA_VERSION,
  RUNNER_FITNESS_PROFILE_HISTORY_FORMULA_VERSION,
  RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION,
  type RunnerActivityHistoryProductPage,
  type RunnerActivityProgressProductModel,
  type RunnerFitnessProfileActualEvidenceStateV1,
  type RunnerFitnessProfileComponentStateV1,
  type RunnerFitnessProfileLatestActivityV1,
  type RunnerFitnessProfileRolling90DayV1,
  type RunnerFitnessProfileSnapshotV1,
} from "@/lib/runner-activity/product-contract";
import type {
  RunnerActivityFitSequencePeriodRequest,
  RunnerActivityMutationReadback,
  RunnerActivityProgressReadModel,
} from "@/lib/runner-activity/read-model-types";
import type { ContinuationCalendarOutcomePacket } from "@/lib/runner-calendar-persistence";
import { getRunnerCalendarContextForUserId } from "@/lib/runner-calendar-context";
import { digestSha256Hex, stableJsonStringify } from "@/lib/review-token-signing";
import { addDaysIso, startOfWeekIso } from "@/lib/training";
import type { UserSettingsSummary } from "@/lib/user-settings-actions";
import type { ContinuationEvidencePacket } from "@/lib/workout-result-import/types";

const fitSequencePeriodSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.enum(["this_week", "last_7_days", "last_1_month", "last_6_months"]) })
    .strict(),
  z
    .object({
      kind: z.literal("custom"),
      startDate: z.string().date(),
      endDate: z.string().date(),
    })
    .strict(),
]);

export class RunnerActivityFitSequencePeriodInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunnerActivityFitSequencePeriodInputError";
  }
}

export function parseRunnerActivityFitSequencePeriodRequest(
  value: unknown,
): RunnerActivityFitSequencePeriodRequest {
  const parsed = fitSequencePeriodSchema.safeParse(value ?? { kind: "this_week" });
  if (!parsed.success) {
    throw new RunnerActivityFitSequencePeriodInputError("Choose a supported activity period.");
  }
  return parsed.data;
}

export async function getRunnerActivityProgressForUser(input: {
  userId: string;
  asOfDate?: string;
  sequencePeriod?: RunnerActivityFitSequencePeriodRequest;
  creationCause?: RunnerActivityMetricCreationCause;
}): Promise<RunnerActivityProgressReadModel> {
  const calendarContext = await getRunnerCalendarContextForUserId(input.userId);
  const asOfDate = z
    .string()
    .date()
    .parse(input.asOfDate ?? calendarContext.currentDate);
  const sequencePeriod = parseRunnerActivityFitSequencePeriodRequest(input.sequencePeriod);
  assertValidSequencePeriod(sequencePeriod, asOfDate);
  const factsPromise = getRunnerActivityProgressFactsForUser({
    userId: input.userId,
    asOfDate,
    creationCause: factualCreationCause(input.creationCause),
  });
  const progressMetricsPromise = getRunnerActivityProgressMetricsForUser({
    userId: input.userId,
    asOfDate,
    timeZone: calendarContext.timeZone,
    sequencePeriod,
    creationCause: input.creationCause,
  });
  try {
    const [facts, progressMetrics] = await Promise.all([factsPromise, progressMetricsPromise]);
    return {
      ...facts,
      ...progressMetrics,
    };
  } catch (error) {
    const facts = await factsPromise;
    return {
      ...facts,
      fitActivitySequence: runnerActivityFitSequencePendingReadback({
        asOfDate,
        timeZone: calendarContext.timeZone,
        period: sequencePeriod,
      }),
      advancedMetrics: metricRecalculationPendingReadback(error, asOfDate),
    };
  }
}

export async function getRunnerFitnessProfileSnapshotForUser(input: {
  userId: string;
  asOf: string;
  cutoffDate: string;
  settings: UserSettingsSummary | null;
  calendar: ContinuationCalendarOutcomePacket;
  evidence: ContinuationEvidencePacket;
}): Promise<RunnerFitnessProfileSnapshotV1> {
  const [progress, history] = await Promise.all([
    getRunnerActivityProgressForUser({
      userId: input.userId,
      asOfDate: input.cutoffDate,
      sequencePeriod: {
        kind: "custom",
        startDate: addDaysIso(input.cutoffDate, -89),
        endDate: input.cutoffDate,
      },
    }),
    listRunnerActivityHistoryForUser({ userId: input.userId, pageSize: 50 }),
  ]);
  return assembleRunnerFitnessProfileSnapshotV1({
    ...input,
    timeZone: input.settings?.calendarTimezone ?? "UTC",
    progress: projectRunnerActivityProgressForProduct(progress),
    history: projectRunnerActivityHistoryForProduct(history),
  });
}

export async function assembleRunnerFitnessProfileSnapshotV1(input: {
  userId: string;
  asOf: string;
  cutoffDate: string;
  timeZone: string;
  settings: UserSettingsSummary | null;
  calendar: ContinuationCalendarOutcomePacket;
  evidence: ContinuationEvidencePacket;
  progress: RunnerActivityProgressProductModel;
  history: RunnerActivityHistoryProductPage;
}): Promise<RunnerFitnessProfileSnapshotV1> {
  const evidenceByWorkoutId = new Map(
    input.evidence.workouts.map((workout) => [workout.calendarWorkoutId, workout]),
  );
  const calendarByWorkoutId = new Map(
    input.calendar.workouts.map((workout) => [workout.calendarWorkoutId, workout]),
  );
  const evidenceWorkouts = input.evidence.workouts.map((workout) => ({
    calendarWorkoutId: workout.calendarWorkoutId,
    workoutDate: workout.workoutDate,
    actualEvidenceState: publicActualEvidenceState(workout.evidenceState),
    acceptedActualMetricsAvailable: workout.acceptedActualMetrics !== null,
    missingReasons: [...workout.missingReasons].sort(),
  }));
  const recentReasonCodes = new Set<string>();
  const packetContradiction =
    input.calendar.cutoffDate !== input.cutoffDate ||
    input.evidence.cutoffDate !== input.cutoffDate ||
    input.evidence.calendarOutcomeFingerprint !== input.calendar.calendarOutcomeFingerprint;
  if (packetContradiction) recentReasonCodes.add("factual_packet_mismatch");
  for (const workout of evidenceWorkouts) {
    if (workout.actualEvidenceState !== "accepted_actual") {
      recentReasonCodes.add(`evidence_${workout.actualEvidenceState}`);
    }
    for (const reason of workout.missingReasons) recentReasonCodes.add(reason);
  }
  const progressUpdating =
    input.progress.advancedMetrics.status === "updating" ||
    input.progress.fitActivitySequence.status === "updating";
  const recentState = packetContradiction
    ? "contradictory"
    : progressUpdating ||
        evidenceWorkouts.some((workout) => workout.actualEvidenceState === "updating")
      ? "updating"
      : input.calendar.workouts.length === 0 &&
          input.progress.rolling28Day.current.eligibleActivityCount === 0
        ? "unavailable"
        : recentReasonCodes.size > 0 ||
            Object.values(input.progress.rolling28Day.current.facts).some(
              (metric) => metric.confidence === "partial",
            )
          ? "partial"
          : "available";
  const sessionRpeLoad =
    input.progress.advancedMetrics.status === "current"
      ? input.progress.advancedMetrics.sessionRpeLoad.rolling28Day.current
      : null;

  const latestItems = buildLatestFive({
    cutoffDate: input.cutoffDate,
    history: input.history,
    evidence: input.evidence,
    calendarByWorkoutId,
    evidenceByWorkoutId,
  });
  const latestState: RunnerFitnessProfileComponentStateV1 = progressUpdating
    ? "updating"
    : latestItems.length === 0
      ? "unavailable"
      : latestItems.some(
            (item) =>
              item.actualEvidenceState !== "accepted_actual" ||
              item.durationMin == null ||
              item.distanceKm == null,
          )
        ? "partial"
        : "available";
  const latestReasonCodes = latestState === "partial" ? ["inspection_fact_partial"] : [];

  const rolling90Day = buildRolling90Day(input.progress, input.cutoffDate);
  const rollingState: RunnerFitnessProfileComponentStateV1 = progressUpdating
    ? "updating"
    : rolling90Day.acceptedActivityCount === 0
      ? "unavailable"
      : rolling90Day.weeklyDistribution.some(
            (week) => week.missingDurationCount > 0 || week.missingDistanceCount > 0,
          )
        ? "partial"
        : "available";
  const constraintsReasonCodes = input.settings
    ? [
        "current_goal_not_exposed_by_identity_contract",
        "limitation_state_not_exposed_by_identity_contract",
        "preferred_units_not_exposed_by_identity_contract",
        "self_report_confirmation_not_exposed_by_identity_contract",
      ]
    : ["runner_profile_unavailable"];
  const constraintsState: RunnerFitnessProfileComponentStateV1 = input.settings
    ? "partial"
    : "unavailable";
  const constraints = input.settings
    ? {
        fitnessLevel: input.settings.fitnessLevel,
        trainingPreferences: input.settings.trainingPreferences,
        currentGoal: null,
        preferredUnits: null,
        limitationState: null,
        runnerEnteredFacts: {
          source: "runner_profile" as const,
          revision: input.settings.profileRevision,
          lastConfirmedAt: null,
        },
      }
    : null;
  const profileFingerprint = await fingerprint({
    revision: input.settings?.profileRevision ?? null,
    fitnessLevel: input.settings?.fitnessLevel ?? null,
    trainingPreferences: input.settings?.trainingPreferences ?? null,
    timeZone: input.timeZone,
  });
  const runnerActivityFingerprint = await fingerprint({
    rolling28Day: input.progress.rolling28Day,
    sequence: providerNeutralSequenceFacts(input.progress),
    latestItems,
    advancedMetrics:
      input.progress.advancedMetrics.status === "current"
        ? {
            status: input.progress.advancedMetrics.status,
            sessionRpeLoad: input.progress.advancedMetrics.sessionRpeLoad,
            records: input.progress.advancedMetrics.records,
            detailedMetrics: input.progress.advancedMetrics.detailedMetrics,
          }
        : {
            status: input.progress.advancedMetrics.status,
            reason: input.progress.advancedMetrics.reason,
          },
  });
  const runnerFactsRevision = await fingerprint({
    version: RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION,
    cutoffDate: input.cutoffDate,
    profileFingerprint,
    calendarOutcomeFingerprint: input.calendar.calendarOutcomeFingerprint,
    evidenceRevisionFingerprint: input.evidence.evidenceRevisionFingerprint,
    runnerActivityFingerprint,
  });
  const runnerActivityFormulaVersions = Array.from(
    new Set([
      input.progress.rolling28Day.current.formulaVersion,
      input.progress.rolling28Day.previous.formulaVersion,
      RUNNER_FITNESS_PROFILE_HISTORY_FORMULA_VERSION,
    ]),
  ).sort();
  const snapshotWithoutId = {
    version: RUNNER_FITNESS_PROFILE_SNAPSHOT_VERSION,
    runnerId: input.userId,
    asOf: input.asOf,
    cutoffDate: input.cutoffDate,
    timeZone: input.timeZone,
    runnerFactsRevision,
    formulaVersions: {
      profile: RUNNER_FITNESS_PROFILE_FORMULA_VERSION,
      runnerActivity: runnerActivityFormulaVersions,
      sessionRpeLoad:
        input.progress.advancedMetrics.status === "current"
          ? input.progress.advancedMetrics.sessionRpeLoad.formulaVersion
          : null,
    },
    provenance: {
      identityProfile: {
        revision: input.settings?.profileRevision ?? null,
        fingerprint: profileFingerprint,
      },
      calendarOutcomes: { fingerprint: input.calendar.calendarOutcomeFingerprint },
      resultEvidence: { fingerprint: input.evidence.evidenceRevisionFingerprint },
      runnerActivity: { fingerprint: runnerActivityFingerprint },
    },
    components: {
      constraints: {
        state: constraintsState,
        data: constraints,
        coverage: coverage(input.settings ? 2 : 0, 6, [], input.settings ? 4 : 6),
        reasonCodes: constraintsReasonCodes,
      },
      recent28Day: {
        state: recentState,
        data: {
          current: input.progress.rolling28Day.current,
          previous: input.progress.rolling28Day.previous,
          calendarOutcomes: input.calendar.workouts.map((workout) => ({
            calendarWorkoutId: workout.calendarWorkoutId,
            workoutDate: workout.workoutDate,
            workoutType: workout.workoutType,
            outcome: workout.outcome,
            sessionRpe: workout.sessionRpe,
            outcomeRevision: workout.outcomeRevision,
          })),
          evidence: {
            dueWorkoutCount: input.evidence.dueWorkoutCount,
            resolvedOutcomeCount: input.evidence.resolvedOutcomeCount,
            acceptedActualCount: evidenceWorkouts.filter(
              (workout) => workout.actualEvidenceState === "accepted_actual",
            ).length,
            completionOnlyCount: evidenceWorkouts.filter(
              (workout) => workout.actualEvidenceState === "completion_only",
            ).length,
            missingCount: evidenceWorkouts.filter(
              (workout) => workout.actualEvidenceState === "missing",
            ).length,
            updatingCount: evidenceWorkouts.filter(
              (workout) => workout.actualEvidenceState === "updating",
            ).length,
            removedCount: evidenceWorkouts.filter(
              (workout) => workout.actualEvidenceState === "removed",
            ).length,
            workouts: evidenceWorkouts,
          },
          sessionRpeLoad,
        },
        coverage: coverage(
          input.evidence.resolvedOutcomeCount,
          input.evidence.dueWorkoutCount,
          input.calendar.workouts.map((workout) => workout.workoutDate),
          Math.max(0, input.evidence.dueWorkoutCount - input.evidence.resolvedOutcomeCount),
        ),
        reasonCodes: Array.from(recentReasonCodes).sort(),
      },
      latestFive: {
        state: latestState,
        data:
          latestState === "unavailable"
            ? null
            : { inspectionOnly: true as const, items: latestItems },
        coverage: coverage(
          latestItems.length,
          Math.min(5, latestItems.length),
          latestItems.map((item) => item.localDate),
          0,
        ),
        reasonCodes: latestReasonCodes,
      },
      rolling90Day: {
        state: rollingState,
        data: rollingState === "unavailable" ? null : rolling90Day,
        coverage: coverage(
          rolling90Day.acceptedActivityCount,
          rolling90Day.acceptedActivityCount,
          rolling90Day.weeklyDistribution.flatMap((week) =>
            week.sessionCount > 0 ? [week.startDate] : [],
          ),
          rolling90Day.weeklyDistribution.reduce(
            (sum, week) => sum + week.missingDurationCount + week.missingDistanceCount,
            0,
          ),
        ),
        reasonCodes: rollingState === "partial" ? ["rolling_90_day_fact_partial"] : [],
      },
      comparablePerformance: {
        state: "unavailable" as const,
        data: null,
        coverage: coverage(0, 0, [], 0),
        reasonCodes: ["normalized_stream_not_persisted"],
      },
    },
  } satisfies Omit<RunnerFitnessProfileSnapshotV1, "snapshotId">;
  return deepFreeze({
    ...snapshotWithoutId,
    snapshotId: await fingerprint(snapshotWithoutId),
  });
}

export async function readRunnerActivityMutationReadback(input: {
  userId: string;
  activityId: string;
  creationCause: "ingestion" | "backfill" | "source_removal" | "activity_delete" | "correction";
}): Promise<RunnerActivityMutationReadback> {
  const [history, progress] = await Promise.all([
    listRunnerActivityHistoryForUser({ userId: input.userId }),
    getRunnerActivityProgressForUser({
      userId: input.userId,
      creationCause: input.creationCause,
    }),
  ]);
  return { activityId: input.activityId, status: "current", history, progress };
}

function buildLatestFive(input: {
  cutoffDate: string;
  history: RunnerActivityHistoryProductPage;
  evidence: ContinuationEvidencePacket;
  calendarByWorkoutId: Map<string, ContinuationCalendarOutcomePacket["workouts"][number]>;
  evidenceByWorkoutId: Map<string, ContinuationEvidencePacket["workouts"][number]>;
}): RunnerFitnessProfileLatestActivityV1[] {
  const historyItems: RunnerFitnessProfileLatestActivityV1[] = input.history.items
    .filter(
      (activity) =>
        activity.historicalTime.localDate !== null &&
        activity.historicalTime.localDate <= input.cutoffDate &&
        !activity.quality.updating,
    )
    .map((activity) => {
      const workoutId = activity.plannedWorkout?.id ?? null;
      const calendar = workoutId ? input.calendarByWorkoutId.get(workoutId) : null;
      const evidence = workoutId ? input.evidenceByWorkoutId.get(workoutId) : null;
      return {
        activityId: activity.id,
        localDate: activity.historicalTime.localDate!,
        workoutContext: calendar?.workoutType ?? null,
        actualEvidenceState: evidence
          ? publicActualEvidenceState(evidence.evidenceState)
          : "accepted_actual",
        durationMin: activity.duration?.minutes ?? null,
        distanceKm: activity.distanceKm,
        paceSecondsPerKm: activity.pace?.secondsPerKm ?? null,
        averageHeartRate: activity.observedHeartRate?.averageBpm ?? null,
        elevationGainMetres: evidence?.acceptedActualMetrics?.elevationGainMetres ?? null,
        sessionRpe: calendar?.sessionRpe ?? null,
      };
    });
  const representedWorkoutIds = new Set(
    input.history.items
      .map((activity) => activity.plannedWorkout?.id ?? null)
      .filter((id): id is string => Boolean(id)),
  );
  const completionOnlyItems: RunnerFitnessProfileLatestActivityV1[] = input.evidence.workouts
    .filter(
      (workout) =>
        workout.workoutDate <= input.cutoffDate &&
        workout.evidenceState === "completed_without_fit" &&
        !representedWorkoutIds.has(workout.calendarWorkoutId),
    )
    .map((workout) => ({
      activityId: `calendar:${workout.calendarWorkoutId}`,
      localDate: workout.workoutDate,
      workoutContext: input.calendarByWorkoutId.get(workout.calendarWorkoutId)?.workoutType ?? null,
      actualEvidenceState: "completion_only",
      durationMin: null,
      distanceKm: null,
      paceSecondsPerKm: null,
      averageHeartRate: null,
      elevationGainMetres: null,
      sessionRpe: input.calendarByWorkoutId.get(workout.calendarWorkoutId)?.sessionRpe ?? null,
    }));
  return [...historyItems, ...completionOnlyItems]
    .sort(
      (left, right) =>
        right.localDate.localeCompare(left.localDate) ||
        left.activityId.localeCompare(right.activityId),
    )
    .slice(0, 5);
}

function buildRolling90Day(
  progress: RunnerActivityProgressProductModel,
  cutoffDate: string,
): RunnerFitnessProfileRolling90DayV1 {
  const startDate = addDaysIso(cutoffDate, -89);
  const points =
    progress.fitActivitySequence.status === "ready" ||
    progress.fitActivitySequence.status === "empty"
      ? progress.fitActivitySequence.points.filter(
          (point) =>
            point.historicalTime.localDate >= startDate &&
            point.historicalTime.localDate <= cutoffDate,
        )
      : [];
  const weeks = new Map<
    string,
    {
      startDate: string;
      endDate: string;
      sessionCount: number;
      runningTimeMin: number;
      distanceKm: number;
      includedDurationCount: number;
      includedDistanceCount: number;
    }
  >();
  let longestDuration: RunnerFitnessProfileRolling90DayV1["longestDuration"] = null;
  let longestDistance: RunnerFitnessProfileRolling90DayV1["longestDistance"] = null;
  for (const point of points) {
    const localDate = point.historicalTime.localDate;
    const weekStart = startOfWeekIso(localDate);
    const current = weeks.get(weekStart) ?? {
      startDate: weekStart < startDate ? startDate : weekStart,
      endDate: addDaysIso(weekStart, 6) > cutoffDate ? cutoffDate : addDaysIso(weekStart, 6),
      sessionCount: 0,
      runningTimeMin: 0,
      distanceKm: 0,
      includedDurationCount: 0,
      includedDistanceCount: 0,
    };
    current.sessionCount += 1;
    const duration = point.observations.timer_duration.value;
    const distance = point.observations.distance.value;
    if (duration != null) {
      current.runningTimeMin += duration;
      current.includedDurationCount += 1;
      if (!longestDuration || duration > longestDuration.minutes) {
        longestDuration = { localDate, minutes: duration };
      }
    }
    if (distance != null) {
      current.distanceKm += distance;
      current.includedDistanceCount += 1;
      if (!longestDistance || distance > longestDistance.kilometers) {
        longestDistance = { localDate, kilometers: distance };
      }
    }
    weeks.set(weekStart, current);
  }
  const advanced = progress.advancedMetrics;
  return {
    window: {
      startDate,
      endDate: cutoffDate,
      cutoffDate,
      timezoneBasis: "historical_local_date",
      weekStartsOn: "monday",
    },
    acceptedActivityCount: points.length,
    weeklyDistribution: Array.from(weeks.values())
      .map((week) => ({
        startDate: week.startDate,
        endDate: week.endDate,
        sessionCount: week.sessionCount,
        runningTimeMin: week.includedDurationCount > 0 ? week.runningTimeMin : null,
        distanceKm: week.includedDistanceCount > 0 ? week.distanceKm : null,
        missingDurationCount: week.sessionCount - week.includedDurationCount,
        missingDistanceCount: week.sessionCount - week.includedDistanceCount,
      }))
      .sort((left, right) => left.startDate.localeCompare(right.startDate)),
    longestDuration,
    longestDistance,
    sessionRpeLoad:
      advanced.status === "current"
        ? {
            formulaVersion: advanced.sessionRpeLoad.formulaVersion,
            current: advanced.sessionRpeLoad.rolling28Day.current,
            previous: advanced.sessionRpeLoad.rolling28Day.previous,
          }
        : null,
    records: advanced.status === "current" ? advanced.records.items : [],
  };
}

function providerNeutralSequenceFacts(progress: RunnerActivityProgressProductModel) {
  const sequence = progress.fitActivitySequence;
  if (sequence.status !== "ready" && sequence.status !== "empty") {
    return {
      status: sequence.status,
      reason: "reason" in sequence ? sequence.reason : "sequence_state_unavailable",
      formulaVersion: RUNNER_FITNESS_PROFILE_HISTORY_FORMULA_VERSION,
    };
  }
  return {
    status: sequence.status,
    formulaVersion: RUNNER_FITNESS_PROFILE_HISTORY_FORMULA_VERSION,
    period: {
      startDate: sequence.selectedPeriod.startDate,
      endDate: sequence.selectedPeriod.endDate,
      asOfDate: sequence.selectedPeriod.asOfDate,
      timeZone: sequence.selectedPeriod.timezoneBasis.timeZone,
    },
    points: sequence.points.map((point) => ({
      id: point.id,
      localDate: point.historicalTime.localDate,
      startedAt: point.historicalTime.startedAt,
      timeZone: point.historicalTime.timezone,
      runningContext: point.context.runningContext,
      observations: Object.fromEntries(
        Object.entries(point.observations).map(([key, observation]) => [
          key,
          {
            state: observation.state,
            value: observation.value,
            unit: observation.unit,
            coverage: observation.coverage,
            basis: observation.basis,
          },
        ]),
      ),
    })),
  };
}

function publicActualEvidenceState(
  state: ContinuationEvidencePacket["workouts"][number]["evidenceState"],
): RunnerFitnessProfileActualEvidenceStateV1 {
  if (state === "fit_current") return "accepted_actual";
  if (state === "completed_without_fit") return "completion_only";
  return state;
}

function coverage(
  includedCount: number,
  candidateCount: number,
  coveredDates: string[],
  missingCount: number,
) {
  return {
    includedCount,
    candidateCount,
    missingCount,
    coveredDates: Array.from(new Set(coveredDates)).sort(),
  };
}

async function fingerprint(value: unknown) {
  return digestSha256Hex(stableJsonStringify(value));
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function factualCreationCause(cause: RunnerActivityMetricCreationCause | undefined) {
  if (
    cause === "ingestion" ||
    cause === "backfill" ||
    cause === "source_removal" ||
    cause === "activity_delete" ||
    cause === "correction"
  ) {
    return cause;
  }
  return "read_reconciliation" as const;
}

function assertValidSequencePeriod(
  period: RunnerActivityFitSequencePeriodRequest,
  asOfDate: string,
) {
  if (period.kind !== "custom") return;
  if (period.startDate > period.endDate) {
    throw new RunnerActivityFitSequencePeriodInputError(
      "The custom activity period start date must not follow its end date.",
    );
  }
  if (period.endDate > asOfDate) {
    throw new RunnerActivityFitSequencePeriodInputError(
      "The custom activity period end date must not follow the runner's current date.",
    );
  }
}
