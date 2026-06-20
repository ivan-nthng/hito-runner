import assert from "node:assert/strict";
import type {
  ExistingPlanContext,
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/active-plan-persistence";
import {
  ACTIVE_PLAN_USER_EDIT_MUTATION_KIND,
  ACTIVE_PLAN_USER_EDIT_SOURCE_KIND,
} from "../../src/lib/active-plan-workout-editing/policy";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  addManualWorkoutToActivePlanForUser,
  reviewManualWorkoutDraft,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";

type AddDependencies = NonNullable<Parameters<typeof addManualWorkoutToActivePlanForUser>[2]>;

export async function validateManualActivePlanAddWorkoutContract() {
  const userId = "00000000-0000-4000-8000-000000000202";
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-17",
    notes: "Second reviewed workout.",
  };
  const reviewed = assertReady("manual active-plan add review", input);
  const activePlan = buildFakePlanCycle({
    userId,
    id: "11111111-1111-4111-8111-111111111111",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-16",
    endDate: "2026-06-16",
  });
  const firstWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "22222222-2222-4222-8222-222222222222",
    date: "2026-06-16",
    displayOrder: 0,
  });
  const persistedAdds: Array<{
    workoutDate: string;
    displayOrder: number;
    reviewChecksum: string;
  }> = [];

  const success = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout],
      onPersist: ({ workoutSeed, reviewMetadata }) => {
        persistedAdds.push({
          workoutDate: workoutSeed.workoutDate,
          displayOrder: workoutSeed.displayOrder,
          reviewChecksum: reviewMetadata.review_checksum,
        });
      },
    }),
  );

  assert.equal(success.ok, true, formatAddResult(success));
  if (success.ok) {
    assert.equal(success.status, "created");
    assert.equal(success.persisted, true);
    assert.equal(success.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(success.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(success.activePlanId, activePlan.id);
    assert.equal(success.workoutDate, input.workoutDate);
    assert.equal(success.calendarRowCount, 2);
    assert.equal(success.nonRestWorkoutCount, 2);
    assert.equal(success.reviewChecksum, reviewed.reviewChecksum);
    assert.equal(success.sourceMetadata.editSourceKind, ACTIVE_PLAN_USER_EDIT_SOURCE_KIND);
    assert.equal(
      success.sourceMetadata.mutationKind,
      ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.addWorkout,
    );
    assert.equal(success.sourceMetadata.originalPlanSourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(success.sourceMetadata.reviewChecksum, reviewed.reviewChecksum);
    assert.equal(success.sourceMetadata.metricTruthMode, "structure_only");
    assert.equal(success.safety.targetDayWasEmpty, true);
    assert.equal(success.safety.trustedClientRows, false);
    assert.equal(success.safety.serverRebuiltReview, true);
  }

  assert.deepEqual(persistedAdds, [
    {
      workoutDate: input.workoutDate,
      displayOrder: 1,
      reviewChecksum: reviewed.reviewChecksum,
    },
  ]);

  const changedDate = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput({ ...input, workoutDate: "2026-06-18" }, reviewed),
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(changedDate, "stale_review", "changed add-workout date");

  const invalidToken = await addManualWorkoutToActivePlanForUser(
    userId,
    {
      ...buildConfirmInput(input, reviewed),
      reviewToken: `${reviewed.reviewToken.slice(0, -1)}${
        reviewed.reviewToken.endsWith("0") ? "1" : "0"
      }`,
    },
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(invalidToken, "invalid_review", "invalid add-workout token");

  const clientRowsAttempt = await addManualWorkoutToActivePlanForUser(
    userId,
    {
      ...buildConfirmInput(input, reviewed),
      plannedWorkout: { workoutDate: "2026-06-19", title: "Trust me" },
    },
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(clientRowsAttempt, "invalid_review", "client-sent add row");

  const noActivePlan = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({ activePlan: null, workouts: [] }),
  );
  assertAddBlocked(noActivePlan, "no_active_plan", "missing active plan");

  const presetPlan = buildFakePlanCycle({
    userId,
    id: "33333333-3333-4333-8333-333333333333",
    sourceKind: "plan_preset_v1",
    startDate: "2026-06-16",
    endDate: "2026-06-16",
  });
  const presetAdd = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({ activePlan: presetPlan, workouts: [firstWorkout] }),
  );
  assert.equal(presetAdd.ok, true, formatAddResult(presetAdd));
  if (presetAdd.ok) {
    assert.equal(presetAdd.sourceKind, "plan_preset_v1");
    assert.equal(presetAdd.sourceMetadata.editSourceKind, ACTIVE_PLAN_USER_EDIT_SOURCE_KIND);
    assert.equal(presetAdd.sourceMetadata.originalPlanSourceKind, "plan_preset_v1");
    assert.equal(
      presetAdd.sourceMetadata.mutationKind,
      ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.addWorkout,
    );
  }

  const unsupportedSource = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan: buildFakePlanCycle({
        userId,
        id: "33333333-3333-4333-8333-333333333334",
        sourceKind: "legacy_unreviewed_plan_v0",
        startDate: "2026-06-16",
        endDate: "2026-06-16",
      }),
      workouts: [firstWorkout],
    }),
  );
  assertAddBlocked(
    unsupportedSource,
    "unsupported_active_plan_source",
    "unsupported active-plan source",
  );

  const occupiedWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "44444444-4444-4444-8444-444444444444",
    date: input.workoutDate,
    displayOrder: 1,
  });
  const occupiedDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout, occupiedWorkout] }),
  );
  assertAddBlocked(occupiedDay, "occupied_day", "occupied add-workout day");

  const protectedLoggedDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout, occupiedWorkout],
      logsByWorkoutId: new Map([
        [
          occupiedWorkout.id,
          buildFakeWorkoutLog({
            userId,
            plannedWorkoutId: occupiedWorkout.id,
          }),
        ],
      ]),
    }),
  );
  assertAddBlocked(protectedLoggedDay, "protected_day", "logged add-workout day");

  const protectedEvidenceDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout, occupiedWorkout],
      evidenceWorkoutIds: new Set([occupiedWorkout.id]),
    }),
  );
  assertAddBlocked(protectedEvidenceDay, "protected_day", "evidence add-workout day");

  const pastDateReview = assertReady("past add-workout review", {
    ...input,
    workoutDate: "2026-06-09",
  });
  const protectedPastDay = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput({ ...input, workoutDate: "2026-06-09" }, pastDateReview),
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(protectedPastDay, "protected_day", "past add-workout day");

  const activePlanMismatch = await addManualWorkoutToActivePlanForUser(
    userId,
    {
      activePlanId: "55555555-5555-4555-8555-555555555555",
      ...buildConfirmInput(input, reviewed),
    },
    buildFakeAddDependencies({ activePlan, workouts: [firstWorkout] }),
  );
  assertAddBlocked(activePlanMismatch, "stale_review", "active plan mismatch");

  const persistenceFailure = await addManualWorkoutToActivePlanForUser(
    userId,
    buildConfirmInput(input, reviewed),
    buildFakeAddDependencies({
      activePlan,
      workouts: [firstWorkout],
      persistError: new Error("simulated add failure"),
    }),
  );
  assertAddBlocked(persistenceFailure, "persistence_failed", "add-workout persistence failure");
}

function assertReady(
  label: string,
  input: ManualWorkoutDraftInput,
): Extract<ManualWorkoutDraftReviewResult, { ok: true }> {
  const result = reviewManualWorkoutDraft(input);

  assert.equal(result.ok, true, `${label} should be accepted: ${formatResult(result)}`);
  assert.equal(result.status, "draft_ready");
  assert.equal(result.draft.persisted, false);
  assert.equal(result.reviewToken.startsWith("manual-workout-review-v1."), true);
  assert.equal(result.reviewChecksum.length, 64);

  return result;
}

function buildConfirmInput(
  draftInput: unknown,
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>,
) {
  return {
    draftInput,
    reviewToken: review.reviewToken,
    reviewChecksum: review.reviewChecksum,
  };
}

function buildFakeAddDependencies(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  persistError?: Error;
  onPersist?: (record: {
    workoutSeed: Parameters<NonNullable<AddDependencies["persistWorkoutAdd"]>>[0]["workoutSeed"];
    reviewMetadata: Parameters<
      NonNullable<AddDependencies["persistWorkoutAdd"]>
    >[0]["reviewMetadata"];
  }) => void;
}): AddDependencies {
  return {
    currentDate: "2026-06-10",
    getExistingPlanContextForUser: async () =>
      ({
        activePlan: input.activePlan,
        existingWorkouts: {
          workouts: input.workouts,
          logsByWorkoutId: input.logsByWorkoutId ?? new Map(),
        },
      }) satisfies ExistingPlanContext,
    fetchEvidenceWorkoutIds: async () => input.evidenceWorkoutIds ?? new Set(),
    persistWorkoutAdd: async (record) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.({
        workoutSeed: record.workoutSeed,
        reviewMetadata: record.reviewMetadata,
      });

      return {
        plannedWorkout: buildFakePlannedWorkout({
          userId: record.userId,
          planCycleId: record.activePlan.id,
          id: "66666666-6666-4666-8666-666666666666",
          date: record.workoutSeed.workoutDate,
          displayOrder: record.workoutSeed.displayOrder,
          title: record.workoutSeed.title,
          workoutIdentity: record.workoutSeed.workoutIdentity,
        }),
        planCycle: {
          ...record.activePlan,
          end_date:
            record.workoutSeed.workoutDate > record.activePlan.end_date
              ? record.workoutSeed.workoutDate
              : record.activePlan.end_date,
        },
      };
    },
  };
}

function buildFakePlanCycle({
  userId,
  id,
  sourceKind,
  startDate,
  endDate,
}: {
  userId: string;
  id: string;
  sourceKind: string | null;
  startDate: string;
  endDate: string;
}): PersistedPlanCycleRow {
  const isManualPlan = sourceKind === MANUAL_USER_BUILT_PLAN_SOURCE_KIND;

  return {
    id,
    user_id: userId,
    status: "active",
    title: "Manual user-built plan",
    goal_summary: "Manual user-built plan",
    source_template: "training-plan-v2",
    schema_version: "training-plan-v2",
    source_kind: sourceKind,
    start_date: startDate,
    end_date: endDate,
    target_date: null,
    goal_metadata: isManualPlan
      ? {
          manual_user_built_plan: {
            source_kind: sourceKind,
            source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
          },
        }
      : {},
    plan_preferences: isManualPlan
      ? {
          manual_workout_authoring_reviews: [],
        }
      : {},
    created_at: "2026-06-10T00:00:00.000Z",
    updated_at: "2026-06-10T00:00:00.000Z",
  };
}

function buildFakePlannedWorkout({
  userId,
  planCycleId,
  id,
  date,
  displayOrder,
  title = "Easy aerobic run",
  notes = null,
  weekday = "Tuesday",
  workoutType = "easy",
  sourceWorkoutType = "easy",
  workoutFamily = "easy",
  workoutIdentity = "easy_aerobic_run",
  calendarIconKey = "easy",
  metricMode = null,
  steps = [],
}: {
  userId: string;
  planCycleId: string;
  id: string;
  date: string;
  displayOrder: number;
  title?: string;
  notes?: string | null;
  weekday?: string;
  workoutType?: PersistedPlannedWorkoutRow["workout_type"];
  sourceWorkoutType?: string | null;
  workoutFamily?: string | null;
  workoutIdentity?: string | null;
  calendarIconKey?: string | null;
  metricMode?: PersistedPlannedWorkoutRow["metric_mode"];
  steps?: PersistedPlannedWorkoutRow["steps"];
}): PersistedPlannedWorkoutRow {
  return {
    id,
    user_id: userId,
    plan_cycle_id: planCycleId,
    workout_date: date,
    weekday,
    week_number: 1,
    phase: "Manual build",
    workout_type: workoutType,
    source_workout_id: `manual-${date}-easy_aerobic_run`,
    source_workout_type: sourceWorkoutType,
    workout_family: workoutFamily,
    workout_identity: workoutIdentity,
    calendar_icon_key: calendarIconKey,
    goal_context: null,
    metric_mode: metricMode,
    title,
    notes,
    planned_rpe: null,
    estimated_fatigue: null,
    recovery_priority: null,
    steps,
    display_order: displayOrder,
    created_at: "2026-06-10T00:00:00.000Z",
  };
}

function buildFakeWorkoutLog({
  userId,
  plannedWorkoutId,
}: {
  userId: string;
  plannedWorkoutId: string;
}): PersistedWorkoutLogRow {
  return {
    id: "77777777-7777-4777-8777-777777777777",
    user_id: userId,
    planned_workout_id: plannedWorkoutId,
    outcome: "completed",
    actual_distance_km: 5,
    actual_duration_min: 35,
    rpe: 3,
    notes: null,
    body_notes: null,
    intervals_completed: null,
    logged_at: "2026-06-17T12:00:00.000Z",
    updated_at: "2026-06-17T12:00:00.000Z",
  };
}

function assertAddBlocked(
  result: ManualWorkoutAddToActivePlanResult,
  reason: Extract<ManualWorkoutAddToActivePlanResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatAddResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}

function formatAddResult(result: ManualWorkoutAddToActivePlanResult) {
  return JSON.stringify(result, null, 2);
}
