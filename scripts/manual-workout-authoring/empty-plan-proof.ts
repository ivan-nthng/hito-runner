import assert from "node:assert/strict";
import type {
  EmptyActivePlanCreationInput,
  ExistingPlanContext,
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/active-plan-persistence";
import {
  MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  addManualWorkoutToActivePlanForUser,
  createEmptyManualActivePlanForUser,
  reviewManualWorkoutDraft,
  type ManualEmptyPlanCreateResult,
  type ManualEmptyPlanSetupInput,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";

type EmptyPlanDependencies = NonNullable<Parameters<typeof createEmptyManualActivePlanForUser>[2]>;
type AddDependencies = NonNullable<Parameters<typeof addManualWorkoutToActivePlanForUser>[2]>;

export async function validateManualEmptyActivePlanCreationContract() {
  const userId = "00000000-0000-4000-8000-000000000401";
  const setup: ManualEmptyPlanSetupInput = {
    age: 36,
    heightCm: 178,
    weightKg: 74.5,
    runningLevel: "beginner",
  };
  const persisted: Array<{
    userId: string;
    input: EmptyActivePlanCreationInput;
  }> = [];
  const success = await createEmptyManualActivePlanForUser(
    userId,
    setup,
    buildFakeEmptyPlanDependencies({
      currentDate: "2026-06-12",
      onPersist: (record) => persisted.push(record),
    }),
  );

  assert.equal(success.ok, true, formatEmptyPlanResult(success));
  if (success.ok) {
    assert.equal(success.status, "created");
    assert.equal(success.persisted, true);
    assert.equal(success.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(success.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
    assert.equal(success.activePlanId, "11111111-1111-4111-8111-111111111401");
    assert.equal(success.effectiveStartDate, "2026-06-12");
    assert.equal(success.workoutCount, 0);
    assert.equal(success.calendarRowCount, 0);
    assert.equal(success.nonRestWorkoutCount, 0);
    assert.deepEqual(success.setup, setup);
    assert.equal(success.sourceMetadata.creationMode, "empty_manual_setup");
    assert.equal(
      success.sourceMetadata.setupPayloadVersion,
      MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
    );
    assert.equal(success.sourceMetadata.rowCount, 0);
    assert.equal(success.sourceMetadata.nonRestRowCount, 0);
    assert.equal(success.sourceMetadata.runningLevel, setup.runningLevel);
    assert.equal(success.safety.createsFakeWorkout, false);
    assert.equal(success.safety.trustedClientRows, false);
    assert.equal(success.safety.callsOpenAi, false);
    assert.equal(success.safety.readyForManualAdd, true);
  }

  assert.equal(persisted.length, 1);
  const persistedRecord = persisted[0]!;
  assert.equal(persistedRecord.userId, userId);
  assert.equal(persistedRecord.input.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(persistedRecord.input.schemaVersion, "training-plan-v2");
  assert.equal(persistedRecord.input.sourceTemplate, "training-plan-v2");
  assert.equal(persistedRecord.input.startDate, "2026-06-12");
  assert.equal(persistedRecord.input.endDate, "2026-06-12");
  assert.equal(persistedRecord.input.profile.age, setup.age);
  assert.equal(persistedRecord.input.profile.heightCm, setup.heightCm);
  assert.equal(persistedRecord.input.profile.weightKg, setup.weightKg);
  assert.equal(persistedRecord.input.profilePatch?.age, setup.age);
  assert.equal(persistedRecord.input.profilePatch?.heightCm, setup.heightCm);
  assert.equal(persistedRecord.input.profilePatch?.weightKg, setup.weightKg);
  assert.equal(
    readNestedString(persistedRecord.input.goalMetadata, [
      "manual_user_built_plan",
      "creation_mode",
    ]),
    "empty_manual_setup",
  );
  assert.equal(
    readNestedNumber(persistedRecord.input.goalMetadata, ["manual_user_built_plan", "row_count"]),
    0,
  );
  assert.equal(
    readNestedNumber(persistedRecord.input.goalMetadata, [
      "manual_user_built_plan",
      "non_rest_row_count",
    ]),
    0,
  );
  assert.equal(
    readNestedString(persistedRecord.input.planPreferences, ["manual_setup", "running_level"]),
    setup.runningLevel,
  );

  const invalid = await createEmptyManualActivePlanForUser(
    userId,
    { ...setup, runningLevel: "elite" },
    buildFakeEmptyPlanDependencies(),
  );
  assertEmptyPlanBlocked(invalid, "invalid_input", "invalid running level");

  const activePlan = buildFakePlanCycle({
    userId,
    id: "22222222-2222-4222-8222-222222222401",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-12",
    endDate: "2026-06-12",
  });
  const activePlanConflict = await createEmptyManualActivePlanForUser(
    userId,
    setup,
    buildFakeEmptyPlanDependencies({ activePlan }),
  );
  assertEmptyPlanBlocked(activePlanConflict, "active_plan_exists", "existing active plan");

  const persistenceFailure = await createEmptyManualActivePlanForUser(
    userId,
    setup,
    buildFakeEmptyPlanDependencies({ persistError: new Error("simulated create failure") }),
  );
  assertEmptyPlanBlocked(
    persistenceFailure,
    "persistence_failed",
    "empty-plan persistence failure",
  );

  await assertFirstAddWorksOnEmptyManualPlan({ userId, activePlan });
}

async function assertFirstAddWorksOnEmptyManualPlan(input: {
  userId: string;
  activePlan: PersistedPlanCycleRow;
}) {
  const draftInput: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    notes: "First reviewed workout after empty setup.",
  };
  const reviewed = assertReady("first add after empty manual setup", draftInput);
  const persistedAdds: Array<{
    workoutDate: string;
    displayOrder: number;
    reviewChecksum: string;
  }> = [];

  const result = await addManualWorkoutToActivePlanForUser(
    input.userId,
    buildConfirmInput(draftInput, reviewed),
    buildFakeAddDependencies({
      activePlan: input.activePlan,
      workouts: [],
      onPersist: ({ workoutSeed, reviewMetadata }) => {
        persistedAdds.push({
          workoutDate: workoutSeed.workoutDate,
          displayOrder: workoutSeed.displayOrder,
          reviewChecksum: reviewMetadata.review_checksum,
        });
      },
    }),
  );

  assert.equal(result.ok, true, formatAddResult(result));
  if (result.ok) {
    assert.equal(result.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
    assert.equal(result.workoutSourceKind, MANUAL_WORKOUT_AUTHORING_SOURCE_KIND);
    assert.equal(result.calendarRowCount, 1);
    assert.equal(result.nonRestWorkoutCount, 1);
    assert.equal(result.safety.targetDayKind, "rest_day");
    assert.equal(result.safety.trustedClientRows, false);
    assert.equal(result.safety.serverRebuiltReview, true);
  }

  assert.deepEqual(persistedAdds, [
    {
      workoutDate: draftInput.workoutDate,
      displayOrder: 0,
      reviewChecksum: reviewed.reviewChecksum,
    },
  ]);
}

function buildFakeEmptyPlanDependencies(
  input: {
    activePlan?: PersistedPlanCycleRow | null;
    currentDate?: string;
    persistError?: Error;
    onPersist?: (record: { userId: string; input: EmptyActivePlanCreationInput }) => void;
  } = {},
): EmptyPlanDependencies {
  return {
    currentDate: input.currentDate ?? "2026-06-12",
    getActivePlanForUser: async () => input.activePlan ?? null,
    createEmptyPlanForUser: async (userId, creationInput) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.({ userId, input: creationInput });

      return {
        ok: true,
        status: "applied",
        effectiveStartDate: creationInput.startDate,
        appliedStartDate: creationInput.startDate,
        normalizedFromStartDate: null,
        firstDayResolution: null,
        workoutCount: 0,
        planCycle: buildFakePlanCycle({
          userId,
          id: "11111111-1111-4111-8111-111111111401",
          sourceKind: creationInput.sourceKind,
          startDate: creationInput.startDate,
          endDate: creationInput.endDate,
        }),
        workouts: [],
      };
    },
  };
}

function buildFakeAddDependencies(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  onPersist?: (record: {
    workoutSeed: Parameters<NonNullable<AddDependencies["persistWorkoutAdd"]>>[0]["workoutSeed"];
    reviewMetadata: Parameters<
      NonNullable<AddDependencies["persistWorkoutAdd"]>
    >[0]["reviewMetadata"];
  }) => void;
}): AddDependencies {
  return {
    currentDate: "2026-06-12",
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
      input.onPersist?.({
        workoutSeed: record.workoutSeed,
        reviewMetadata: record.reviewMetadata,
      });

      return {
        plannedWorkout: buildFakePlannedWorkout({
          userId: record.userId,
          planCycleId: record.activePlan.id,
          id: "33333333-3333-4333-8333-333333333401",
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

function assertReady(
  label: string,
  input: ManualWorkoutDraftInput,
): Extract<ManualWorkoutDraftReviewResult, { ok: true }> {
  const result = reviewManualWorkoutDraft(input);

  assert.equal(result.ok, true, `${label} should be accepted: ${formatReviewResult(result)}`);
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
            row_count: 0,
            non_rest_row_count: 0,
          },
        }
      : {},
    plan_preferences: isManualPlan
      ? {
          manual_setup: {
            setup_payload_version: MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
          },
          manual_workout_authoring_reviews: [],
        }
      : {},
    created_at: "2026-06-12T00:00:00.000Z",
    updated_at: "2026-06-12T00:00:00.000Z",
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
    created_at: "2026-06-12T00:00:00.000Z",
  };
}

function assertEmptyPlanBlocked(
  result: ManualEmptyPlanCreateResult,
  reason: Extract<ManualEmptyPlanCreateResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatEmptyPlanResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

function readNestedString(value: unknown, path: string[]) {
  const nested = readNestedValue(value, path);
  return typeof nested === "string" ? nested : null;
}

function readNestedNumber(value: unknown, path: string[]) {
  const nested = readNestedValue(value, path);
  return typeof nested === "number" ? nested : null;
}

function readNestedValue(value: unknown, path: string[]) {
  let current = value;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function formatEmptyPlanResult(result: ManualEmptyPlanCreateResult) {
  return JSON.stringify(result, null, 2);
}

function formatReviewResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}

function formatAddResult(result: ManualWorkoutAddToActivePlanResult) {
  return JSON.stringify(result, null, 2);
}
