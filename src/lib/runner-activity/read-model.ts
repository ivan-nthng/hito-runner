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
import type {
  RunnerActivityFitSequencePeriodRequest,
  RunnerActivityMutationReadback,
  RunnerActivityProgressReadModel,
} from "@/lib/runner-activity/read-model-types";
import { getRunnerCalendarContextForUserId } from "@/lib/runner-calendar-context";

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
