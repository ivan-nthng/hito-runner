import assert from "node:assert/strict";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  confirmManualWorkoutDraftForUser,
  reviewManualWorkoutDraft,
  validateManualWorkoutReviewExactness,
  type ManualWorkoutConfirmResult,
  type ManualWorkoutDraftInput,
} from "../../src/lib/manual-workout-authoring";
import type { AdditionalPlanPersistenceMetadata } from "../../src/lib/plan-authoring-snapshot";
import {
  assertManualBlockedResult,
  assertNoFakePaceOrHrInSerialized,
  formatJsonResult,
} from "./move-proof-assertions";
import { assertReady, buildReviewConfirmInput } from "./move-proof-fixtures";

type ConfirmDependencies = NonNullable<Parameters<typeof confirmManualWorkoutDraftForUser>[2]>;

export async function validateManualFirstCreateConfirmPersistenceContract() {
  validateStableReviewExactness();
  validateProtectedConflictShape();
  await validateManualConfirmPersistenceContract();
}

function validateStableReviewExactness() {
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    notes: "Keep it easy.",
  };
  const first = assertReady("stable review first", input);
  const second = assertReady("stable review second", input);
  const changedDate = assertReady("stable review changed date", {
    ...input,
    workoutDate: "2026-06-17",
  });

  assert.equal(first.reviewChecksum, second.reviewChecksum);
  assert.equal(first.reviewToken, second.reviewToken);
  assert.notEqual(first.reviewChecksum, changedDate.reviewChecksum);
  assert.equal(first.draft.sourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
  assert.equal(first.draft.source_kind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
  assert.equal(first.draft.persisted, false);
}

function validateProtectedConflictShape() {
  const result = reviewManualWorkoutDraft({
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    context: {
      mode: "user_built_plan_draft",
      targetDateProtection: "logged_workout",
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "draft_rejected");
  assert.equal(result.reason, "protected_date_conflict");
  assert.equal(result.persisted, false);
  assert.equal(result.conflicts.length, 1);
}

async function validateManualConfirmPersistenceContract() {
  const userId = "00000000-0000-4000-8000-000000000101";
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    notes: "Keep it easy.",
  };
  const reviewed = assertReady("manual confirm review", input);
  const persisted: Array<{
    userId: string;
    canonicalPlan: TrainingPlanV2;
    metadata: AdditionalPlanPersistenceMetadata | null;
  }> = [];

  const success = await confirmManualWorkoutDraftForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeConfirmDependencies({
      onPersist: (record) => persisted.push(record),
    }),
  );

  assert.equal(success.ok, true, formatJsonResult(success));
  if (success.ok) {
    assert.equal(success.persisted, true);
    assert.equal(success.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(success.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
    assert.equal(success.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(success.calendarRowCount, 1);
    assert.equal(success.nonRestWorkoutCount, 1);
    assert.equal(success.safety.trustedClientRows, false);
    assert.equal(success.safety.serverRebuiltReview, true);
    assert.equal(success.safety.callsOpenAi, false);
    assert.equal(success.sourceMetadata.reviewChecksum, reviewed.reviewChecksum);
    assert.equal(success.sourceMetadata.metricTruthMode, "structure_only");
  }

  assert.equal(persisted.length, 1);
  const persistedRecord = persisted[0]!;
  assert.equal(persistedRecord.userId, userId);
  assert.equal(persistedRecord.canonicalPlan.source_kind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(persistedRecord.canonicalPlan.planned_workouts.length, 1);
  assert.equal(persistedRecord.canonicalPlan.planned_workouts[0]!.date, input.workoutDate);
  assert.equal(
    persistedRecord.canonicalPlan.planned_workouts[0]!.workout_identity,
    "easy_aerobic_run",
  );
  assertNumericV2Segments(persistedRecord.canonicalPlan, "persisted manual plan");
  assertNoFakePaceOrHrInSerialized(persistedRecord.canonicalPlan, "persisted manual plan");
  assertManualPersistenceMetadata(
    persistedRecord.metadata,
    reviewed.reviewChecksum,
    input.workoutDate,
  );

  const changedDate = await confirmManualWorkoutDraftForUser(
    userId,
    buildReviewConfirmInput({ ...input, workoutDate: "2026-06-17" }, reviewed),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(changedDate, "stale_review", "changed date");

  const changedTemplate = await confirmManualWorkoutDraftForUser(
    userId,
    buildReviewConfirmInput({ ...input, templateKey: "steady_aerobic_run" }, reviewed),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(changedTemplate, "stale_review", "changed template");

  const changedEntries = await confirmManualWorkoutDraftForUser(
    userId,
    buildReviewConfirmInput(
      {
        ...input,
        entries: [
          {
            kind: "block",
            block: { blockKey: "easy_run_block", durationSeconds: 25 * 60 },
          },
        ],
      },
      reviewed,
    ),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(changedEntries, "stale_review", "changed entries");

  const invalidToken = await confirmManualWorkoutDraftForUser(
    userId,
    {
      ...buildReviewConfirmInput(input, reviewed),
      reviewToken: `${reviewed.reviewToken.slice(0, -1)}${
        reviewed.reviewToken.endsWith("0") ? "1" : "0"
      }`,
    },
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(invalidToken, "invalid_review", "invalid token");

  const staleChecksum = await confirmManualWorkoutDraftForUser(
    userId,
    {
      ...buildReviewConfirmInput(input, reviewed),
      reviewChecksum: "0".repeat(64),
    },
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(staleChecksum, "stale_review", "stale checksum");

  const protectedDate = await confirmManualWorkoutDraftForUser(
    userId,
    buildReviewConfirmInput(
      {
        ...input,
        context: {
          mode: "user_built_plan_draft",
          targetDateProtection: "logged_workout",
        },
      },
      reviewed,
    ),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(protectedDate, "protected_date_conflict", "protected date");

  const activePlanConflict = await confirmManualWorkoutDraftForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeConfirmDependencies({
      activePlan: { id: "active-plan-id" },
    }),
  );
  assertConfirmBlocked(activePlanConflict, "active_plan_exists", "active plan conflict");

  const restReview = assertReady("rest confirm review", {
    templateKey: "rest_day",
    workoutDate: "2026-06-15",
  });
  const restOnly = await confirmManualWorkoutDraftForUser(
    userId,
    buildReviewConfirmInput({ templateKey: "rest_day", workoutDate: "2026-06-15" }, restReview),
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(restOnly, "manual_workout_required", "rest-only first plan");

  const clientRowsAttempt = await confirmManualWorkoutDraftForUser(
    userId,
    {
      ...buildReviewConfirmInput(input, reviewed),
      canonicalPlan: persistedRecord.canonicalPlan,
    },
    buildFakeConfirmDependencies(),
  );
  assertConfirmBlocked(clientRowsAttempt, "invalid_review", "client-sent row payload");

  const persistenceFailure = await confirmManualWorkoutDraftForUser(
    userId,
    buildReviewConfirmInput(input, reviewed),
    buildFakeConfirmDependencies({ persistError: new Error("simulated insert failure") }),
  );
  assertConfirmBlocked(persistenceFailure, "persistence_failed", "persistence failure");

  const exactness = validateManualWorkoutReviewExactness(buildReviewConfirmInput(input, reviewed));
  assert.equal(exactness.ok, true);
}

function buildFakeConfirmDependencies(
  input: {
    activePlan?: unknown;
    persistError?: Error;
    onPersist?: (record: {
      userId: string;
      canonicalPlan: TrainingPlanV2;
      metadata: AdditionalPlanPersistenceMetadata | null;
    }) => void;
  } = {},
): ConfirmDependencies {
  return {
    getActivePlanForUser: async () => input.activePlan as never,
    createFirstPlanForUser: async (userId, canonicalPlan, _profilePatch, metadata) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.({ userId, canonicalPlan, metadata });

      return {
        ok: true,
        status: "applied",
        effectiveStartDate: canonicalPlan.start_date,
        appliedStartDate: canonicalPlan.start_date,
        normalizedFromStartDate: null,
        firstDayResolution: null,
        workoutCount: canonicalPlan.planned_workouts.filter(
          (workout) => workout.workout_type !== "rest",
        ).length,
      };
    },
  };
}

function assertConfirmBlocked(
  result: ManualWorkoutConfirmResult,
  reason: Extract<ManualWorkoutConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
}

function assertNumericV2Segments(plan: TrainingPlanV2, label: string) {
  for (const workout of plan.planned_workouts) {
    if (workout.workout_type === "rest") {
      continue;
    }

    assert.ok(workout.segments.length > 0, `${label} should have rich segments.`);

    for (const segment of workout.segments) {
      assert.ok(segment.prescription, `${label} segment should have a prescription.`);
      assert.notEqual(
        segment.prescription.mode,
        "none",
        `${label} non-rest segment should be executable.`,
      );
    }
  }
}

function assertManualPersistenceMetadata(
  metadata: AdditionalPlanPersistenceMetadata | null,
  reviewChecksum: string,
  workoutDate: string,
) {
  assert.ok(metadata?.goalMetadata, "manual confirm should persist goal metadata.");
  assert.ok(metadata?.planPreferences, "manual confirm should persist plan preference metadata.");

  const goalMetadata = metadata.goalMetadata as {
    manual_user_built_plan?: {
      source_kind?: string;
      source_status?: string;
      workout_authoring_source_kind?: string;
      template_key?: string;
      workout_date?: string;
      row_count?: number;
      review_payload_version?: string;
      review_checksum?: string;
      metric_truth_mode?: string;
    };
  };
  const manualMetadata = goalMetadata.manual_user_built_plan;

  assert.equal(manualMetadata?.source_kind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(manualMetadata?.source_status, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
  assert.equal(manualMetadata?.workout_authoring_source_kind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
  assert.equal(manualMetadata?.template_key, "easy_aerobic_run");
  assert.equal(manualMetadata?.workout_date, workoutDate);
  assert.equal(manualMetadata?.row_count, 1);
  assert.equal(manualMetadata?.review_checksum, reviewChecksum);
  assert.equal(manualMetadata?.metric_truth_mode, "structure_only");
}
