import "@tanstack/react-start/server-only";

import { z } from "zod";
import { getRunnerActivityProgressFactsForUser } from "@/lib/runner-activity/fact-snapshots";
import { listRunnerActivityHistoryForUser } from "@/lib/runner-activity/history-read-model";
import {
  getRunnerActivityAdvancedMetricsForUser,
  metricRecalculationPendingReadback,
} from "@/lib/runner-activity/metric-snapshots";
import type { RunnerActivityMetricCreationCause } from "@/lib/runner-activity/metric-snapshots";
import type {
  RunnerActivityMutationReadback,
  RunnerActivityProgressReadModel,
} from "@/lib/runner-activity/read-model-types";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";

export async function getRunnerActivityProgressForUser(input: {
  userId: string;
  asOfDate?: string;
  creationCause?: RunnerActivityMetricCreationCause;
}): Promise<RunnerActivityProgressReadModel> {
  const asOfDate = z
    .string()
    .date()
    .parse(input.asOfDate ?? (await getRunnerCalendarDateForUserId(input.userId)));
  const factsPromise = getRunnerActivityProgressFactsForUser({
    userId: input.userId,
    asOfDate,
    creationCause: factualCreationCause(input.creationCause),
  });
  const advancedMetricsPromise = getRunnerActivityAdvancedMetricsForUser({
    userId: input.userId,
    asOfDate,
    creationCause: input.creationCause,
  });
  try {
    const [facts, advancedMetrics] = await Promise.all([factsPromise, advancedMetricsPromise]);
    return {
      ...facts,
      advancedMetrics,
    };
  } catch (error) {
    const facts = await factsPromise;
    return {
      ...facts,
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
