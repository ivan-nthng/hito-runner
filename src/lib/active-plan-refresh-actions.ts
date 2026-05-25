import { randomUUID } from "node:crypto";
import {
  buildExactActivePlanRefreshDraft,
  mutableWorkoutGuardsStillOpen,
  parseActivePlanRefreshDraftPayload,
  rebuildActivePlanRefreshDraftWithRichWorkoutDraft,
  type ActivePlanRefreshDraft,
  type RefreshEvidenceSets,
} from "@/lib/active-plan-refresh-draft";
import {
  createAssignedPlanFromImportedSeed,
  getExistingPlanContext,
  rollbackInsertedPlan,
  type ExistingPlanContext,
  type PersistedPlanCycleRow,
  type PersistedPlannedWorkoutRow,
  type PersistedWorkoutLogRow,
} from "@/lib/active-plan-persistence";
import {
  capabilityLockedResponse,
  checkRunnerCapability,
} from "@/lib/entitlements/check-runner-capability";
import { recordRunnerCapabilityUsage } from "@/lib/entitlements/record-runner-capability-usage";
import {
  buildImportedPlanSeed,
  type ImportedPlanSeed,
  type ImportedWorkoutSeed,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import {
  buildPlanScopedStructuredAuthoringMetadata,
  mergePlanPersistenceMetadata,
} from "@/lib/plan-authoring-snapshot";
import { persistedWorkoutRowToImportedSeed } from "@/lib/persisted-plan-replacement";
import type {
  ActivePlanRefreshFingerprint,
  ActivePlanRefreshProposal,
} from "@/lib/plan-refresh-proposal";
import type {
  ActivePlanRefreshApplyPayload,
  ActivePlanRefreshProposalInput,
  ApplyActivePlanRefreshProposalResult,
  ProposeActivePlanRefreshResult,
} from "@/lib/active-plan-refresh-contract";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import type { RunnerCoachContext } from "@/lib/runner-coach-context";
import { buildDeterministicRichWorkoutFallbackMetadata } from "@/lib/rich-workout-draft-authoring";
import type { Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/backend/auth";
import { addDaysIso, diffDaysIso, weekdayLong, type TrainingSnapshot } from "@/lib/training";
import {
  mergeWeekdayRestInvariantIntoPlanPreferences,
  validateWorkoutsAgainstWeekdayRestInvariant,
  type WeekdayRestInvariant,
} from "@/lib/weekday-rest-invariants";

export {
  activePlanRefreshApplyInputSchema,
  activePlanRefreshProposalInputSchema,
} from "@/lib/active-plan-refresh-contract";
export type {
  ActivePlanRefreshApplyPayload,
  ActivePlanRefreshProposalInput,
  ApplyActivePlanRefreshProposalResult,
  ProposeActivePlanRefreshResult,
} from "@/lib/active-plan-refresh-contract";

type PersistedSnapshotLoader = (userId: string) => Promise<TrainingSnapshot>;
const REFRESH_PROPOSAL_OPENAI_TIMEOUT_MS = 45_000;
const REFRESH_RICH_WORKOUT_DRAFT_TIMEOUT_MS = 45_000;

export async function proposeActivePlanRefreshForCurrentRequest(
  data: ActivePlanRefreshProposalInput,
): Promise<ProposeActivePlanRefreshResult> {
  const auth = requireAuthenticatedUser();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  if (!persistedUserId) {
    throw new Error("Authentication is required for this action.");
  }

  return proposeActivePlanRefreshForUser(persistedUserId, data);
}

export async function proposeActivePlanRefreshForUser(
  userId: string,
  data: ActivePlanRefreshProposalInput,
): Promise<ProposeActivePlanRefreshResult> {
  const capabilityCheck = await checkRunnerCapability({
    userId,
    capabilityKey: "ai_plan_update",
  });

  if (!capabilityCheck.allowed) {
    return capabilityLockedResponse(capabilityCheck);
  }

  const { buildRunnerCoachContext } = await import("@/lib/runner-coach-context");
  const context = await buildRunnerCoachContext({ userId });
  const proposalResult = await buildBoundedActivePlanRefreshProposal({
    context,
    runnerPrompt: data.runnerPrompt,
  });
  const proposal = proposalResult.proposal;
  const planContext = await getExistingPlanContext(userId);

  if (!context.activePlan || !planContext.activePlan) {
    throw new Error("An active plan is required before Hito can prepare a plan update draft.");
  }

  const evidenceSets = await fetchRefreshEvidenceSets(
    userId,
    planContext.existingWorkouts.workouts.map((workout) => workout.id),
    planContext.existingWorkouts.logsByWorkoutId,
  );
  const deterministicRefreshDraft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan: planContext.activePlan,
    existingWorkouts: planContext.existingWorkouts,
    proposalOutput: proposal.output,
    fingerprint: proposal.output.applyContext.fingerprint,
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets,
  });
  const refreshDraft = proposalResult.fallbackReason
    ? rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
        draft: deterministicRefreshDraft,
        canonicalPlan: deterministicRefreshDraft.canonicalPlan,
        metadata: buildDeterministicRichWorkoutFallbackMetadata(proposalResult.fallbackReason),
      })
    : await buildRichActivePlanRefreshDraft({
        deterministicDraft: deterministicRefreshDraft,
        proposalOutput: proposal.output,
        runnerPrompt: data.runnerPrompt,
      });
  const proposalWithDraft = {
    ...proposal,
    output: {
      ...proposal.output,
      refreshDraft,
    },
  };

  await recordRunnerCapabilityUsage({
    userId,
    capabilityKey: "ai_plan_update",
  });

  return {
    ok: true,
    proposal: proposalWithDraft,
  };
}

async function buildBoundedActivePlanRefreshProposal({
  context,
  runnerPrompt,
}: {
  context: RunnerCoachContext;
  runnerPrompt: string;
}): Promise<{
  proposal: ActivePlanRefreshProposal;
  fallbackReason: "refresh_proposal_timed_out" | null;
}> {
  const { buildDeterministicActivePlanRefreshProposal, generateActivePlanRefreshProposal } =
    await import("@/lib/plan-refresh-proposal");

  try {
    return {
      proposal: await withBoundedTimeout(
        generateActivePlanRefreshProposal({
          context,
          runnerPrompt,
          timeoutMs: REFRESH_PROPOSAL_OPENAI_TIMEOUT_MS,
        }),
        REFRESH_PROPOSAL_OPENAI_TIMEOUT_MS,
      ),
      fallbackReason: null,
    };
  } catch (error) {
    if (!isTimeoutLikeError(error)) {
      throw error;
    }

    const fallbackReason = "refresh_proposal_timed_out" as const;

    return {
      proposal: buildDeterministicActivePlanRefreshProposal({
        context,
        runnerPrompt,
        fallbackReason,
      }),
      fallbackReason,
    };
  }
}

async function buildRichActivePlanRefreshDraft({
  deterministicDraft,
  proposalOutput,
  runnerPrompt,
}: {
  deterministicDraft: ActivePlanRefreshDraft;
  proposalOutput: {
    review: { summary: string; proposedChanges: string[] };
    recommendedAuthoringPrompt: string;
  };
  runnerPrompt: string;
}) {
  const { buildRichDraftFallbackReason, generateRichWorkoutDraftForCanonicalPlan } =
    await import("@/lib/openai-plan-authoring");

  return withBoundedTimeout(
    generateRichWorkoutDraftForCanonicalPlan({
      authoringText: buildRefreshRichWorkoutDraftPrompt({
        deterministicPlan: deterministicDraft.canonicalPlan,
        proposalOutput,
        runnerPrompt,
      }),
      authoringInput: deterministicDraft.authoringSnapshot.authoringInput,
      deterministicPlan: deterministicDraft.canonicalPlan,
      timeoutMs: REFRESH_RICH_WORKOUT_DRAFT_TIMEOUT_MS,
    }),
    REFRESH_RICH_WORKOUT_DRAFT_TIMEOUT_MS,
  )
    .then((richDraftResult) =>
      rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
        draft: deterministicDraft,
        canonicalPlan: richDraftResult.canonicalPlan,
        metadata: richDraftResult.metadata,
      }),
    )
    .catch((error: unknown) =>
      rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
        draft: deterministicDraft,
        canonicalPlan: deterministicDraft.canonicalPlan,
        metadata: buildDeterministicRichWorkoutFallbackMetadata(
          error instanceof BoundedRefreshTimeoutError
            ? "rich_draft_timed_out"
            : buildRichDraftFallbackReason(error),
        ),
      }),
    );
}

function withBoundedTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new BoundedRefreshTimeoutError());
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

class BoundedRefreshTimeoutError extends Error {
  constructor() {
    super("Refresh OpenAI step timed out.");
    this.name = "BoundedRefreshTimeoutError";
  }
}

function isTimeoutLikeError(error: unknown) {
  return (
    error instanceof BoundedRefreshTimeoutError ||
    (error instanceof Error &&
      (error.name === "AbortError" || /timed?\s*out|timeout|aborted/i.test(error.message)))
  );
}

function buildRefreshRichWorkoutDraftPrompt({
  deterministicPlan,
  proposalOutput,
  runnerPrompt,
}: {
  deterministicPlan: TrainingPlanV2;
  proposalOutput: {
    review: { summary: string; proposedChanges: string[] };
    recommendedAuthoringPrompt: string;
  };
  runnerPrompt: string;
}) {
  const dateRange = `${deterministicPlan.start_date} to ${deterministicPlan.end_date}`;

  return [
    "Active-plan refresh rich workout draft.",
    `Mutable refreshed schedule date range: ${dateRange}.`,
    "Protected past, logged, Garmin/evidence-backed, comparison, AI-insight, and body-note history is not included in this draft and must stay unchanged.",
    "Do not add, remove, move, reorder, or reinterpret workouts. Only enrich the provided deterministic refreshed schedule.",
    "",
    "Runner refresh request:",
    runnerPrompt.trim(),
    "",
    "Reviewed proposal summary:",
    proposalOutput.review.summary,
    "",
    "Reviewed proposed changes:",
    proposalOutput.review.proposedChanges.map((change) => `- ${change}`).join("\n"),
    "",
    "Recommended bounded authoring prompt:",
    proposalOutput.recommendedAuthoringPrompt,
  ].join("\n");
}

export async function applyActivePlanRefreshProposalForCurrentRequest(
  proposal: ActivePlanRefreshApplyPayload,
  loadSnapshot: PersistedSnapshotLoader,
): Promise<ApplyActivePlanRefreshProposalResult> {
  const auth = requireAuthenticatedUser();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  if (!persistedUserId) {
    throw new Error("Authentication is required for this action.");
  }

  return applyActivePlanRefreshProposalForUser(persistedUserId, proposal, loadSnapshot);
}

export async function applyActivePlanRefreshProposalForUser(
  userId: string,
  proposal: ActivePlanRefreshApplyPayload,
  loadSnapshot: PersistedSnapshotLoader,
): Promise<ApplyActivePlanRefreshProposalResult> {
  const { buildRunnerCoachContext } = await import("@/lib/runner-coach-context");
  const { buildActivePlanRefreshFingerprint } = await import("@/lib/plan-refresh-proposal");
  const currentContext = await buildRunnerCoachContext({ userId });

  if (!currentContext.activePlan) {
    return staleActivePlanRefreshResult();
  }

  const currentFingerprint = buildActivePlanRefreshFingerprint(currentContext);

  if (
    !sameActivePlanRefreshFingerprint(proposal.output.applyContext.fingerprint, currentFingerprint)
  ) {
    return staleActivePlanRefreshResult();
  }

  const parsedDraft = parseActivePlanRefreshDraftPayload(proposal.output.refreshDraft);

  if (!parsedDraft.ok) {
    return blockedActivePlanRefreshApplyResult();
  }

  if (
    !sameActivePlanRefreshFingerprint(parsedDraft.draft.proposalFingerprint, currentFingerprint)
  ) {
    return staleActivePlanRefreshResult();
  }

  const refreshedSeed = buildImportedPlanSeed(parsedDraft.draft.canonicalPlan);
  const planContext = await getExistingPlanContext(userId);

  if (!planContext.activePlan || planContext.activePlan.id !== currentFingerprint.activePlanId) {
    return staleActivePlanRefreshResult();
  }

  const evidenceSets = await fetchRefreshEvidenceSets(
    userId,
    planContext.existingWorkouts.workouts.map((workout) => workout.id),
    planContext.existingWorkouts.logsByWorkoutId,
  );

  if (!mutableWorkoutGuardsStillOpen(parsedDraft.draft, evidenceSets)) {
    return staleActivePlanRefreshResult();
  }

  const preparedRefresh = prepareActivePlanRefreshReplacementSafely({
    currentPlan: planContext.activePlan,
    existingWorkouts: planContext.existingWorkouts,
    evidenceSets,
    generatedSeed: refreshedSeed,
    proposal,
    fingerprint: currentFingerprint,
    weekdayRestInvariant: currentContext.weekdayRestInvariant,
  });

  if (!preparedRefresh.ok) {
    return blockedActivePlanRefreshApplyResult();
  }

  const replacement = await replaceActivePlanWithRefreshSeed(
    userId,
    preparedRefresh.value.importedSeed,
    preparedRefresh.value.copiedLogs,
    preparedRefresh.value.copiedEvidenceWorkouts,
    planContext.activePlan,
  );

  return {
    ok: true,
    status: "applied",
    archivedPlanId: replacement.archivedPlanId,
    activePlanId: replacement.activePlanId,
    fixedWorkoutCount: preparedRefresh.value.fixedWorkoutCount,
    refreshedWorkoutCount: preparedRefresh.value.refreshedWorkoutCount,
    snapshot: await loadSnapshot(userId),
  };
}

function staleActivePlanRefreshResult(): ApplyActivePlanRefreshProposalResult {
  return {
    ok: false,
    status: "stale",
    reason: "stale_proposal",
    message: "This proposal is no longer current. Review a fresh update before applying changes.",
  };
}

function blockedActivePlanRefreshApplyResult(): ApplyActivePlanRefreshProposalResult {
  return {
    ok: false,
    status: "blocked",
    reason: "invalid_refresh_plan",
    message:
      "This proposal no longer fits the remaining schedule safely. Generate a fresh proposal before applying changes.",
  };
}

function sameActivePlanRefreshFingerprint(
  expected: ActivePlanRefreshFingerprint,
  current: ActivePlanRefreshFingerprint,
) {
  return stableJsonStringify(expected) === stableJsonStringify(current);
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    );
  }

  return value;
}

function prepareActivePlanRefreshReplacementSafely(
  input: Parameters<typeof prepareActivePlanRefreshReplacement>[0],
) {
  try {
    return { ok: true as const, value: prepareActivePlanRefreshReplacement(input) };
  } catch {
    return { ok: false as const };
  }
}

function prepareActivePlanRefreshReplacement({
  currentPlan,
  existingWorkouts,
  evidenceSets,
  generatedSeed,
  proposal,
  fingerprint,
  weekdayRestInvariant,
}: {
  currentPlan: PersistedPlanCycleRow;
  existingWorkouts: ExistingPlanContext["existingWorkouts"];
  evidenceSets: RefreshEvidenceSets;
  generatedSeed: ImportedPlanSeed;
  proposal: ActivePlanRefreshApplyPayload;
  fingerprint: ActivePlanRefreshFingerprint;
  weekdayRestInvariant: WeekdayRestInvariant;
}) {
  const firstMutableDate = fingerprint.firstMutableDate;

  if (!firstMutableDate) {
    throw new Error("There is no remaining active schedule to update.");
  }

  const fixedRows = existingWorkouts.workouts.filter(
    (workout) =>
      workout.workout_date < firstMutableDate ||
      evidenceSets.loggedWorkoutIds.has(workout.id) ||
      evidenceSets.evidenceWorkoutIds.has(workout.id),
  );
  const fixedDates = new Set(fixedRows.map((workout) => workout.workout_date));
  const shiftedGeneratedSeed = shiftImportedSeedToStartDate(generatedSeed, firstMutableDate);
  const refreshedWorkouts = shiftedGeneratedSeed.workouts.filter(
    (workout) =>
      workout.workoutDate >= firstMutableDate &&
      (!fingerprint.lastMutableDate || workout.workoutDate <= fingerprint.lastMutableDate) &&
      !fixedDates.has(workout.workoutDate),
  );
  validateWorkoutsAgainstWeekdayRestInvariant(refreshedWorkouts, weekdayRestInvariant);
  const combinedWorkouts = normalizeRefreshReplacementWorkouts([
    ...fixedRows.map((workout) => persistedWorkoutRowToRefreshSeed(workout)),
    ...refreshedWorkouts,
  ]);

  if (!refreshedWorkouts.length) {
    throw new Error("The approved refresh did not produce any remaining schedule workouts.");
  }

  if (!combinedWorkouts.length) {
    throw new Error("The approved refresh did not produce a usable replacement plan.");
  }

  const copiedLogs = fixedRows.flatMap((workout) => {
    const log = existingWorkouts.logsByWorkoutId.get(workout.id);

    return log ? [{ log, sourceWorkoutId: workout.id, workoutDate: workout.workout_date }] : [];
  });
  const draftAuthoringMetadata = proposal.output.refreshDraft
    ? buildPlanScopedStructuredAuthoringMetadata({
        source: "active_plan_refresh",
        authoringInput: proposal.output.refreshDraft.authoringSnapshot.authoringInput,
        goalStyle: proposal.output.refreshDraft.authoringSnapshot.authoringInput.goal.goalStyle,
        targetTime: proposal.output.refreshDraft.authoringSnapshot.authoringInput.goal.targetTime,
        metricPolicySummary: proposal.output.refreshDraft.authoringSnapshot.metricPolicySummary,
        reviewAssumptions: [
          ...proposal.output.refreshDraft.reviewMetadata.targetTimeHonestyAssumptions,
          ...proposal.output.refreshDraft.reviewMetadata.longDistanceHonestyAssumptions,
        ],
      })
    : null;

  return {
    importedSeed: {
      ...generatedSeed,
      title: currentPlan.title,
      goalSummary: currentPlan.goal_summary,
      sourceKind: "active_plan_refresh_v1",
      startDate: combinedWorkouts[0]!.workoutDate,
      endDate: combinedWorkouts.at(-1)!.workoutDate,
      targetDate: currentPlan.target_date,
      goalMetadata: mergePlanPersistenceMetadata(
        currentPlan.goal_metadata,
        draftAuthoringMetadata?.goalMetadata,
      ),
      planPreferences: buildRefreshPlanPreferences(
        generatedSeed.planPreferences,
        proposal,
        fingerprint,
        weekdayRestInvariant,
        draftAuthoringMetadata?.planPreferences,
      ),
      workouts: combinedWorkouts,
    },
    copiedLogs,
    copiedEvidenceWorkouts: fixedRows
      .filter((workout) => evidenceSets.evidenceWorkoutIds.has(workout.id))
      .map((workout) => ({ sourceWorkoutId: workout.id, workoutDate: workout.workout_date })),
    fixedWorkoutCount: fixedRows.length,
    refreshedWorkoutCount: refreshedWorkouts.length,
  };
}

function shiftImportedSeedToStartDate(importedSeed: ImportedPlanSeed, startDate: string) {
  const dayOffset = diffDaysIso(startDate, importedSeed.startDate);

  if (dayOffset === 0) {
    return importedSeed;
  }

  const workouts = importedSeed.workouts.map((workout) => {
    const workoutDate = addDaysIso(workout.workoutDate, dayOffset);

    return {
      ...workout,
      workoutDate,
      weekday: weekdayLong(workoutDate),
    };
  });

  return {
    ...importedSeed,
    startDate,
    endDate: workouts.at(-1)?.workoutDate ?? startDate,
    targetDate: importedSeed.targetDate ? addDaysIso(importedSeed.targetDate, dayOffset) : null,
    workouts,
  };
}

function normalizeRefreshReplacementWorkouts(workouts: ImportedWorkoutSeed[]) {
  const sorted = workouts
    .slice()
    .sort((left, right) =>
      left.workoutDate === right.workoutDate
        ? left.displayOrder - right.displayOrder
        : left.workoutDate.localeCompare(right.workoutDate),
    );
  const startDate = sorted[0]?.workoutDate ?? null;

  return sorted.map((workout, index) => ({
    ...workout,
    weekday: weekdayLong(workout.workoutDate),
    weekNumber: startDate ? Math.floor(diffDaysIso(workout.workoutDate, startDate) / 7) + 1 : 1,
    displayOrder: index,
  }));
}

function persistedWorkoutRowToRefreshSeed(
  workout: PersistedPlannedWorkoutRow,
): ImportedWorkoutSeed {
  return persistedWorkoutRowToImportedSeed(workout, {
    fallbackSourceWorkoutIdPrefix: "fixed",
  });
}

function buildRefreshPlanPreferences(
  planPreferences: Json | null,
  proposal: ActivePlanRefreshApplyPayload,
  fingerprint: ActivePlanRefreshFingerprint,
  weekdayRestInvariant: WeekdayRestInvariant,
  authoringPlanPreferences: Json | null | undefined = null,
): Json {
  const invariantAwarePreferences = mergeWeekdayRestInvariantIntoPlanPreferences(
    planPreferences,
    weekdayRestInvariant,
  );
  const base =
    invariantAwarePreferences &&
    typeof invariantAwarePreferences === "object" &&
    !Array.isArray(invariantAwarePreferences)
      ? invariantAwarePreferences
      : {};
  const authoringBase =
    authoringPlanPreferences &&
    typeof authoringPlanPreferences === "object" &&
    !Array.isArray(authoringPlanPreferences)
      ? authoringPlanPreferences
      : {};

  return {
    ...base,
    ...authoringBase,
    active_plan_refresh: {
      applied_at: new Date().toISOString(),
      proposal_generated_at: proposal.output.applyContext.generatedAt,
      proposal_model: proposal.model,
      proposal_response_id: proposal.responseId,
      source_active_plan_id: fingerprint.activePlanId,
      source_active_plan_updated_at: fingerprint.activePlanUpdatedAt,
      first_mutable_date: fingerprint.firstMutableDate,
      last_mutable_date: fingerprint.lastMutableDate,
      draft_checksum: proposal.output.refreshDraft?.checksum ?? null,
      draft_generated_at: proposal.output.refreshDraft?.generatedAt ?? null,
      rich_draft_status:
        proposal.output.refreshDraft?.richWorkoutDraftMetadata.status ?? "not_requested",
      rich_draft_source:
        proposal.output.refreshDraft?.richWorkoutDraftMetadata.source ??
        "deterministic_structured_generator",
      rich_draft_fallback_reason:
        proposal.output.refreshDraft?.richWorkoutDraftMetadata.fallbackReason ?? null,
      rich_draft_review_assumptions:
        proposal.output.refreshDraft?.richWorkoutDraftMetadata.reviewAssumptions ?? [],
      draft_source_assumption:
        proposal.output.refreshDraft?.authoringSnapshot.sourceAssumption ?? null,
      draft_metric_policy:
        proposal.output.refreshDraft?.authoringSnapshot.metricPolicySummary ?? null,
      affected_date_range: proposal.output.refreshDraft?.reviewMetadata.affectedDateRange ?? null,
      regenerated_workout_count:
        proposal.output.refreshDraft?.reviewMetadata.regeneratedWorkoutCount ?? null,
      preserved_workout_count:
        proposal.output.refreshDraft?.reviewMetadata.preservedWorkoutCount ?? null,
      long_run_peak_before_km:
        proposal.output.refreshDraft?.reviewMetadata.longRunPeakBeforeKm ?? null,
      long_run_peak_after_km:
        proposal.output.refreshDraft?.reviewMetadata.longRunPeakAfterKm ?? null,
      target_time_honesty_assumptions:
        proposal.output.refreshDraft?.reviewMetadata.targetTimeHonestyAssumptions ?? [],
      long_distance_honesty_assumptions:
        proposal.output.refreshDraft?.reviewMetadata.longDistanceHonestyAssumptions ?? [],
      review_summary: proposal.output.review.summary,
      proposed_changes: proposal.output.review.proposedChanges,
    },
  } as Json;
}

async function fetchRefreshEvidenceSets(
  userId: string,
  workoutIds: string[],
  logsByWorkoutId: Map<string, PersistedWorkoutLogRow>,
): Promise<RefreshEvidenceSets> {
  if (!workoutIds.length) {
    return {
      loggedWorkoutIds: new Set(logsByWorkoutId.keys()),
      evidenceWorkoutIds: new Set(),
    };
  }

  const supabase = createAdminSupabaseClient();
  const [assetsResult, actualMetricsResult, comparisonsResult, insightsResult] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_actual_metrics")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_comparisons")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
    supabase
      .from("workout_ai_insights")
      .select("planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", workoutIds),
  ]);

  if (assetsResult.error) throw new Error(assetsResult.error.message);
  if (actualMetricsResult.error) throw new Error(actualMetricsResult.error.message);
  if (comparisonsResult.error) throw new Error(comparisonsResult.error.message);
  if (insightsResult.error) throw new Error(insightsResult.error.message);

  return {
    loggedWorkoutIds: new Set(logsByWorkoutId.keys()),
    evidenceWorkoutIds: new Set([
      ...(assetsResult.data ?? []).map((row) => row.planned_workout_id),
      ...(actualMetricsResult.data ?? []).map((row) => row.planned_workout_id),
      ...(comparisonsResult.data ?? []).map((row) => row.planned_workout_id),
      ...(insightsResult.data ?? []).map((row) => row.planned_workout_id),
    ]),
  };
}

type AppliedEvidenceRelink =
  | {
      table: "workout_result_assets";
      id: string;
      plannedWorkoutId: string;
      workoutLogId: string | null;
    }
  | {
      table: "workout_actual_metrics";
      id: string;
      plannedWorkoutId: string;
      workoutLogId: string | null;
    }
  | {
      table: "workout_comparisons";
      id: string;
      plannedWorkoutId: string;
    }
  | {
      table: "workout_ai_insights";
      id: string;
      plannedWorkoutId: string;
    };

async function relinkRefreshEvidenceRows({
  userId,
  sourceWorkoutIds,
  nextWorkoutIdBySourceWorkoutId,
  nextLogIdBySourceLogId,
}: {
  userId: string;
  sourceWorkoutIds: string[];
  nextWorkoutIdBySourceWorkoutId: Map<string, string>;
  nextLogIdBySourceLogId: Map<string, string>;
}): Promise<() => Promise<void>> {
  if (!sourceWorkoutIds.length) {
    return async () => {};
  }

  const supabase = createAdminSupabaseClient();
  const [assetsResult, actualMetricsResult, comparisonsResult, insightsResult] = await Promise.all([
    supabase
      .from("workout_result_assets")
      .select("id, planned_workout_id, workout_log_id")
      .eq("user_id", userId)
      .in("planned_workout_id", sourceWorkoutIds),
    supabase
      .from("workout_actual_metrics")
      .select("id, planned_workout_id, workout_log_id")
      .eq("user_id", userId)
      .in("planned_workout_id", sourceWorkoutIds),
    supabase
      .from("workout_comparisons")
      .select("id, planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", sourceWorkoutIds),
    supabase
      .from("workout_ai_insights")
      .select("id, planned_workout_id")
      .eq("user_id", userId)
      .in("planned_workout_id", sourceWorkoutIds),
  ]);

  if (assetsResult.error) {
    throw new Error(assetsResult.error.message);
  }
  if (actualMetricsResult.error) {
    throw new Error(actualMetricsResult.error.message);
  }
  if (comparisonsResult.error) {
    throw new Error(comparisonsResult.error.message);
  }
  if (insightsResult.error) {
    throw new Error(insightsResult.error.message);
  }

  const appliedRelinks: AppliedEvidenceRelink[] = [];

  try {
    for (const asset of assetsResult.data ?? []) {
      const nextWorkoutId = nextWorkoutIdBySourceWorkoutId.get(asset.planned_workout_id);

      if (!nextWorkoutId) continue;

      const update = await supabase
        .from("workout_result_assets")
        .update({
          planned_workout_id: nextWorkoutId,
          workout_log_id: asset.workout_log_id
            ? (nextLogIdBySourceLogId.get(asset.workout_log_id) ?? null)
            : null,
        })
        .eq("id", asset.id)
        .eq("user_id", userId);

      if (update.error) throw new Error(update.error.message);

      appliedRelinks.push({
        table: "workout_result_assets",
        id: asset.id,
        plannedWorkoutId: asset.planned_workout_id,
        workoutLogId: asset.workout_log_id,
      });
    }

    for (const metrics of actualMetricsResult.data ?? []) {
      const nextWorkoutId = nextWorkoutIdBySourceWorkoutId.get(metrics.planned_workout_id);

      if (!nextWorkoutId) continue;

      const update = await supabase
        .from("workout_actual_metrics")
        .update({
          planned_workout_id: nextWorkoutId,
          workout_log_id: metrics.workout_log_id
            ? (nextLogIdBySourceLogId.get(metrics.workout_log_id) ?? null)
            : null,
        })
        .eq("id", metrics.id)
        .eq("user_id", userId);

      if (update.error) throw new Error(update.error.message);

      appliedRelinks.push({
        table: "workout_actual_metrics",
        id: metrics.id,
        plannedWorkoutId: metrics.planned_workout_id,
        workoutLogId: metrics.workout_log_id,
      });
    }

    for (const comparison of comparisonsResult.data ?? []) {
      const nextWorkoutId = nextWorkoutIdBySourceWorkoutId.get(comparison.planned_workout_id);

      if (!nextWorkoutId) continue;

      const update = await supabase
        .from("workout_comparisons")
        .update({ planned_workout_id: nextWorkoutId })
        .eq("id", comparison.id)
        .eq("user_id", userId);

      if (update.error) throw new Error(update.error.message);

      appliedRelinks.push({
        table: "workout_comparisons",
        id: comparison.id,
        plannedWorkoutId: comparison.planned_workout_id,
      });
    }

    for (const insight of insightsResult.data ?? []) {
      const nextWorkoutId = nextWorkoutIdBySourceWorkoutId.get(insight.planned_workout_id);

      if (!nextWorkoutId) continue;

      const update = await supabase
        .from("workout_ai_insights")
        .update({ planned_workout_id: nextWorkoutId })
        .eq("id", insight.id)
        .eq("user_id", userId);

      if (update.error) throw new Error(update.error.message);

      appliedRelinks.push({
        table: "workout_ai_insights",
        id: insight.id,
        plannedWorkoutId: insight.planned_workout_id,
      });
    }
  } catch (error) {
    await rollbackEvidenceRelinks(appliedRelinks);
    throw error;
  }

  return () => rollbackEvidenceRelinks(appliedRelinks);
}

async function rollbackEvidenceRelinks(appliedRelinks: AppliedEvidenceRelink[]) {
  if (!appliedRelinks.length) return;

  const supabase = createAdminSupabaseClient();

  for (const relink of appliedRelinks.slice().reverse()) {
    if (relink.table === "workout_result_assets") {
      const rollback = await supabase
        .from("workout_result_assets")
        .update({
          planned_workout_id: relink.plannedWorkoutId,
          workout_log_id: relink.workoutLogId,
        })
        .eq("id", relink.id);

      if (rollback.error) throw new Error(rollback.error.message);
    } else if (relink.table === "workout_actual_metrics") {
      const rollback = await supabase
        .from("workout_actual_metrics")
        .update({
          planned_workout_id: relink.plannedWorkoutId,
          workout_log_id: relink.workoutLogId,
        })
        .eq("id", relink.id);

      if (rollback.error) throw new Error(rollback.error.message);
    } else if (relink.table === "workout_comparisons") {
      const rollback = await supabase
        .from("workout_comparisons")
        .update({ planned_workout_id: relink.plannedWorkoutId })
        .eq("id", relink.id);

      if (rollback.error) throw new Error(rollback.error.message);
    } else {
      const rollback = await supabase
        .from("workout_ai_insights")
        .update({ planned_workout_id: relink.plannedWorkoutId })
        .eq("id", relink.id);

      if (rollback.error) throw new Error(rollback.error.message);
    }
  }
}

async function replaceActivePlanWithRefreshSeed(
  userId: string,
  importedSeed: ImportedPlanSeed,
  copiedLogs: Array<{
    log: PersistedWorkoutLogRow;
    sourceWorkoutId: string;
    workoutDate: string;
  }>,
  copiedEvidenceWorkouts: Array<{ sourceWorkoutId: string; workoutDate: string }>,
  activePlan: PersistedPlanCycleRow,
) {
  const supabase = createAdminSupabaseClient();
  const insertedPlan = await createAssignedPlanFromImportedSeed(userId, importedSeed, "archived");
  const insertedWorkoutsByDate = new Map(
    insertedPlan.workouts.map((workout) => [workout.workout_date, workout]),
  );
  const insertedWorkoutIdBySourceId = new Map<string, string>();
  const copiedLogIdBySourceLogId = new Map<string, string>();

  for (const copiedLog of copiedLogs) {
    const nextWorkout = insertedWorkoutsByDate.get(copiedLog.workoutDate);

    if (nextWorkout) {
      insertedWorkoutIdBySourceId.set(copiedLog.sourceWorkoutId, nextWorkout.id);
    }
  }

  if (copiedLogs.length > 0) {
    const copiedLogRows = copiedLogs.map(({ log, sourceWorkoutId, workoutDate }) => {
      const nextWorkout = insertedWorkoutsByDate.get(workoutDate);

      if (!nextWorkout) {
        throw new Error(
          `Plan refresh lost the inserted fixed-history workout for ${workoutDate}. Current plan is unchanged.`,
        );
      }

      const copiedLogId = randomUUID();
      copiedLogIdBySourceLogId.set(log.id, copiedLogId);
      insertedWorkoutIdBySourceId.set(sourceWorkoutId, nextWorkout.id);

      return {
        id: copiedLogId,
        planned_workout_id: nextWorkout.id,
        user_id: userId,
        outcome: log.outcome,
        actual_distance_km: log.actual_distance_km,
        actual_duration_min: log.actual_duration_min,
        rpe: log.rpe,
        notes: log.notes,
        intervals_completed: log.intervals_completed,
        body_notes: log.body_notes,
        logged_at: log.logged_at,
        updated_at: log.updated_at,
      };
    });

    const logInsert = await supabase.from("workout_logs").insert(copiedLogRows);

    if (logInsert.error) {
      await rollbackInsertedPlan(insertedPlan.planCycle.id);
      throw new Error(logInsert.error.message);
    }
  }

  if (copiedEvidenceWorkouts.length > 0) {
    for (const { sourceWorkoutId, workoutDate } of copiedEvidenceWorkouts) {
      if (!insertedWorkoutIdBySourceId.has(sourceWorkoutId)) {
        const nextWorkout = insertedWorkoutsByDate.get(workoutDate);

        if (nextWorkout) {
          insertedWorkoutIdBySourceId.set(sourceWorkoutId, nextWorkout.id);
        }
      }

      if (!insertedWorkoutIdBySourceId.has(sourceWorkoutId)) {
        await rollbackInsertedPlan(insertedPlan.planCycle.id);
        throw new Error(
          `Plan refresh lost the inserted evidence-backed workout for ${workoutDate}. Current plan is unchanged.`,
        );
      }
    }
  }

  const archiveExisting = await supabase
    .from("plan_cycles")
    .update({ status: "archived" })
    .eq("id", activePlan.id)
    .eq("user_id", userId)
    .eq("status", "active")
    .select("id")
    .single();

  if (archiveExisting.error) {
    await rollbackInsertedPlan(insertedPlan.planCycle.id);
    throw new Error(archiveExisting.error.message);
  }

  let rollbackRelinkedEvidence: (() => Promise<void>) | null = null;

  try {
    if (copiedEvidenceWorkouts.length > 0) {
      rollbackRelinkedEvidence = await relinkRefreshEvidenceRows({
        userId,
        sourceWorkoutIds: copiedEvidenceWorkouts.map((workout) => workout.sourceWorkoutId),
        nextWorkoutIdBySourceWorkoutId: insertedWorkoutIdBySourceId,
        nextLogIdBySourceLogId: copiedLogIdBySourceLogId,
      });
    }

    const activateInserted = await supabase
      .from("plan_cycles")
      .update({ status: "active" })
      .eq("id", insertedPlan.planCycle.id)
      .eq("status", "archived")
      .select("id")
      .single();

    if (activateInserted.error) {
      throw new Error(activateInserted.error.message);
    }

    return {
      archivedPlanId: archiveExisting.data.id,
      activePlanId: activateInserted.data.id,
    };
  } catch (error) {
    let relinkRollbackError: unknown = null;

    if (rollbackRelinkedEvidence) {
      try {
        await rollbackRelinkedEvidence();
      } catch (rollbackError) {
        relinkRollbackError = rollbackError;
      }
    }

    await supabase
      .from("plan_cycles")
      .update({ status: "active" })
      .eq("id", activePlan.id)
      .eq("user_id", userId);

    if (!relinkRollbackError) {
      await rollbackInsertedPlan(insertedPlan.planCycle.id);
    }

    throw relinkRollbackError ?? error;
  }
}
