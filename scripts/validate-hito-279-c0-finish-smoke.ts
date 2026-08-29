import assert from "node:assert/strict";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import {
  buildReviewedAiGeneratedRunningPlanPreviewForUser,
  confirmRunningPlanDraftForUser,
  listSavedPlanReviewsForUser,
  restoreSavedPlanReviewForUser,
} from "../src/lib/running-plan-engine-actions";
import { saveRunnerBaselineForUserId } from "../src/lib/user-settings-actions";
import {
  formatDisposablePersistenceBlocker,
  resolveDisposablePersistencePreflight,
} from "./lib/qa-pool-persistence-proof";

const OWNED_TABLES = [
  "runner_profiles",
  "ai_plan_generation_responses",
  "adaptive_training_blueprint_versions",
  "adaptive_training_detailed_candidates",
  "adaptive_training_block_confirmations",
  "adaptive_training_continuation_input_revisions",
  "plan_cycles",
  "planned_workouts",
  "calendar_workout_mutation_events",
  "workout_logs",
  "workout_result_assets",
  "workout_actual_metrics",
  "workout_comparisons",
  "workout_ai_insights",
  "runner_activity_fact_snapshots",
  "runner_activity_metric_snapshots",
  "runner_activity_metric_observations",
  "runner_activity_evidence_revisions",
  "runner_activity_planned_workout_matches",
  "runner_activity_revisions",
  "runner_activity_source_revisions",
  "runner_activity_sources",
  "runner_activities",
  "runner_manual_workout_templates",
  "runner_entitlements",
  "runner_capability_usage",
] as const;

const preflight = resolveDisposablePersistencePreflight({
  options: { requirePersistence: true },
  includeNotRequested: false,
  envIncompleteReason: "HITO-279 C0 smoke requires the repository-managed local Supabase env.",
  envIncompleteOverrideHint: "Start and configure the pinned disposable local Hito Supabase stack.",
  invalidUrlReason: "The configured Supabase URL is invalid.",
  invalidUrlOverrideHint: "Restore the repository-managed local Supabase environment.",
  nonLoopbackBlockedReason: "HITO-279 C0 smoke is restricted to disposable loopback Supabase.",
  nonLoopbackOverrideHint: "Use the repository-managed local Supabase target only.",
});
if (!preflight.shouldRun) {
  throw new Error(formatDisposablePersistenceBlocker("HITO-279 C0 smoke", preflight));
}

const admin = createAdminSupabaseClient();
const email = `hito-279-c0-${crypto.randomUUID()}@example.test`;
const password = `Hito-279-C0-Aa1-${crypto.randomUUID()}`;
let userId: string | null = null;

try {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null, "Disposable C0 owner creation must succeed.");
  assert.ok(created.data.user, "Disposable C0 owner must exist.");
  userId = created.data.user!.id;

  await saveRunnerBaselineForUserId(
    userId,
    {
      age: 34,
      heightCm: 178,
      weightKg: 72,
      fitnessLevel: "running_regularly",
      heartRateProfile: {
        zones: [
          { reference: "Z1", minBpm: 100, maxBpm: 120 },
          { reference: "Z2", minBpm: 121, maxBpm: 140 },
          { reference: "Z3", minBpm: 141, maxBpm: 155 },
          { reference: "Z4", minBpm: 156, maxBpm: 170 },
          { reference: "Z5", minBpm: 171, maxBpm: 190 },
        ],
      },
    },
    email,
  );

  let providerDispatchCount = 0;
  const preview = await buildReviewedAiGeneratedRunningPlanPreviewForUser(
    userId,
    {
      age: 34,
      heightCm: 178,
      weightKg: 72,
      runnerLevel: "runs_a_lot",
      daysPerWeek: 4,
      fixedRestDays: ["Tuesday", "Thursday", "Saturday"],
      preferredLongRunDay: "Sunday",
      startDate: "2026-08-29",
      benchmark: { kind: "unknown" },
      runnerComment: undefined,
      currentRunningLimitation: "no",
      planGoalIntent: {
        distance: { kind: "preset", preset: "Half Marathon" },
        targetDate: "2027-02-14",
      },
    },
    {
      aiPreview: {
        apiKey: "must-not-be-used",
        model: "must-not-be-used",
        fetchImpl: async () => {
          providerDispatchCount += 1;
          throw new Error("C0 must not dispatch a provider.");
        },
      },
    },
  );
  assert.equal(
    preview.ok,
    true,
    preview.ok
      ? "C0 must produce a reviewed starter plan."
      : `C0 must produce a reviewed starter plan: ${preview.unavailable.error.code} / ${preview.unavailable.error.message}`,
  );
  assert.equal(providerDispatchCount, 0, "C0 must produce zero provider dispatches.");
  if (!preview.ok) throw new Error(preview.unavailable.error.message);
  assert.equal(preview.draft.calendarRows.length, 28);
  assert.equal(preview.draft.callsOpenAi, false);
  assert.equal(preview.draft.aiGeneration.responseId, null);
  assert.equal(preview.draft.aiGeneration.source, "hito_c0_deterministic_starter_policy");
  assert.ok(preview.draft.sourceCandidate, "C0 must retain one canonical candidate.");

  const beforeConfirm = await ownedCounts(userId);
  assert.equal(beforeConfirm.ai_plan_generation_responses, 1);
  assert.equal(beforeConfirm.adaptive_training_blueprint_versions, 1);
  assert.equal(beforeConfirm.adaptive_training_detailed_candidates, 1);
  assert.equal(beforeConfirm.adaptive_training_block_confirmations, 0);
  assert.equal(beforeConfirm.planned_workouts, 0);
  assert.equal(beforeConfirm.calendar_workout_mutation_events, 0);

  const listed = await listSavedPlanReviewsForUser(userId);
  assert.equal(listed.records.length, 1);
  const summary = listed.records[0]!;
  assert.deepEqual(summary.validity, { state: "current", reason: null });
  assert.equal(summary.candidate.id, preview.draft.sourceCandidate!.candidateId);
  assert.equal(summary.candidate.version, preview.draft.sourceCandidate!.candidateVersion);
  assert.equal(summary.candidate.sha256, preview.draft.sourceCandidate!.candidateSha256);

  const restored = await restoreSavedPlanReviewForUser(userId, {
    candidateId: summary.candidate.id,
    candidateVersion: summary.candidate.version,
  });
  assert.equal(restored.ok, true);
  if (!restored.ok) throw new Error(restored.message);
  assert.equal(restored.status, "review_ready");
  if (restored.status !== "review_ready") throw new Error("Saved C0 review must be confirmable.");
  assert.deepEqual(restored.review.savedPlanReviewCandidate, summary.candidate);
  assert.equal(restored.review.reviewChecksum, preview.draft.reviewChecksum);

  const confirmed = await confirmRunningPlanDraftForUser(userId, {
    previewInput: restored.review.previewInput,
    sourceKind: restored.review.sourceKind,
    reviewToken: restored.review.reviewToken,
    reviewChecksum: restored.review.reviewChecksum,
    currentRunningLimitation: "no",
  });
  assert.equal(confirmed.ok, true, "Explicit C0 confirmation must succeed.");
  if (!confirmed.ok) throw new Error(confirmed.message);
  assert.equal(confirmed.calendarRowCount, 28);
  assert.equal(confirmed.safety.callsOpenAi, false);

  const afterConfirm = await ownedCounts(userId);
  assert.equal(afterConfirm.adaptive_training_block_confirmations, 1);
  assert.equal(afterConfirm.planned_workouts, 28);
  assert.equal(afterConfirm.calendar_workout_mutation_events, 28);
  assert.equal(providerDispatchCount, 0);

  console.log("HITO-279 C0 finish smoke passed.", {
    providerDispatchCount,
    retainedResponseCount: beforeConfirm.ai_plan_generation_responses,
    retainedCandidateCount: beforeConfirm.adaptive_training_detailed_candidates,
    confirmedCalendarRows: afterConfirm.planned_workouts,
  });
} finally {
  if (userId) {
    const deleted = await admin.auth.admin.deleteUser(userId);
    assert.equal(deleted.error, null, "Disposable C0 owner cleanup must succeed.");
    const remaining = await ownedCounts(userId);
    assert.deepEqual(
      Object.values(remaining),
      Array.from({ length: OWNED_TABLES.length }, () => 0),
      "Disposable C0 cleanup must leave all task-owned rows at zero.",
    );
  }
}

async function ownedCounts(ownerId: string) {
  const entries = await Promise.all(
    OWNED_TABLES.map(async (table) => {
      const result = await admin
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("user_id", ownerId);
      assert.equal(result.error, null, `Unable to count ${table}.`);
      return [table, result.count ?? 0] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<(typeof OWNED_TABLES)[number], number>;
}
