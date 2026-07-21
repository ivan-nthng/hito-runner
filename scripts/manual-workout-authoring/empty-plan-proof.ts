import assert from "node:assert/strict";
import type {
  EmptyActivePlanCreationInput,
  PersistedPlanCycleRow,
} from "../../src/lib/active-plan-persistence";
import {
  MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  addManualWorkoutToActivePlanForUser,
  createEmptyManualActivePlanForUser,
  type ManualEmptyPlanCreateResult,
  type ManualEmptyPlanSetupInput,
  type ManualWorkoutDraftInput,
} from "../../src/lib/manual-workout-authoring";
import { assertManualBlockedResult, formatJsonResult } from "./move-proof-assertions";
import {
  assertReady,
  buildFakeAddDependencies,
  buildReviewConfirmInput,
} from "./move-proof-fixtures";

type EmptyPlanDependencies = NonNullable<Parameters<typeof createEmptyManualActivePlanForUser>[2]>;

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
  const savedBaselines: ManualEmptyPlanSetupInput[] = [];
  const success = await createEmptyManualActivePlanForUser(
    userId,
    setup,
    buildFakeEmptyPlanDependencies({
      currentDate: "2026-06-12",
      onPersist: (record) => persisted.push(record),
      onSaveBaseline: (baseline) => savedBaselines.push(baseline),
    }),
  );

  assert.equal(success.ok, true, formatJsonResult(success));
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

  assert.deepEqual(savedBaselines, [setup]);
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
    buildReviewConfirmInput(draftInput, reviewed),
    buildFakeAddDependencies({
      activePlan: input.activePlan,
      workouts: [],
      currentDate: "2026-06-12",
      plannedWorkoutId: "33333333-3333-4333-8333-333333333401",
      onPersist: ({ workoutSeed, reviewMetadata }) => {
        persistedAdds.push({
          workoutDate: workoutSeed.workoutDate,
          displayOrder: workoutSeed.displayOrder,
          reviewChecksum: reviewMetadata.review_checksum,
        });
      },
    }),
  );

  assert.equal(result.ok, true, formatJsonResult(result));
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
    onSaveBaseline?: (baseline: ManualEmptyPlanSetupInput) => void;
  } = {},
): EmptyPlanDependencies {
  return {
    currentDate: input.currentDate ?? "2026-06-12",
    getActivePlanForUser: async () => input.activePlan ?? null,
    saveBaselineForUser: async (_userId, baseline) => {
      input.onSaveBaseline?.({
        age: baseline.age,
        heightCm: baseline.heightCm,
        weightKg: baseline.weightKg,
        runningLevel: baseline.fitnessLevel,
      });
      return {} as Awaited<ReturnType<NonNullable<EmptyPlanDependencies["saveBaselineForUser"]>>>;
    },
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

function assertEmptyPlanBlocked(
  result: ManualEmptyPlanCreateResult,
  reason: Extract<ManualEmptyPlanCreateResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label);
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
