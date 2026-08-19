import assert from "node:assert/strict";
import type { PersistedPlanCycleRow } from "../../src/lib/active-plan-persistence";
import type {
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/runner-calendar-persistence";
import {
  copyManualWorkoutWithinActivePlanForUser,
  type ManualWorkoutDirectCopyDependencies,
  type ManualWorkoutDirectCopyResult,
} from "../../src/lib/manual-workout-authoring/copy-paste";
import { formatJsonResult } from "./move-proof-assertions";
import { buildFakePlanCycle, buildFakePlannedWorkout } from "./move-proof-fixtures";

export async function validateManualCopyPasteContract() {
  const userId = "00000000-0000-4000-8000-000000000401";
  const provenancePlan = {
    ...buildFakePlanCycle({
      userId,
      id: "99999999-9999-4999-8999-000000000401",
      sourceKind: "external_partner_confirmed_v4",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    }),
    status: "archived" as const,
  } satisfies PersistedPlanCycleRow;
  const sourceWorkout = {
    ...buildFakePlannedWorkout({
      userId,
      planCycleId: provenancePlan.id,
      originKind: "file_import",
      id: "99999999-9999-4999-8999-000000000402",
      date: "2026-06-10",
      displayOrder: 4,
      title: "Persisted prescription",
      workoutType: "quality",
      sourceWorkoutType: "external_quality",
      workoutFamily: "interval",
      workoutIdentity: "external_quality_v4",
      calendarIconKey: "intervals",
      steps: [
        {
          type: "work",
          label: "Persisted work",
          target: { pace: "4:30/km" },
        },
      ],
    }),
    metric_mode: {
      guidance: "pace",
      executable_mode: "pace_executable",
      pace_targets_allowed: true,
      hr_targets_allowed: false,
      hr_target_source: "effort_only",
      reason: "Workout includes explicit pace targets.",
    },
    goal_context: {
      goalType: "race_distance",
      goalStyle: null,
      distanceKm: 10,
      distanceMeters: 10_000,
      terrainFocus: null,
      targetDate: null,
      targetTime: null,
    },
  } satisfies PersistedPlannedWorkoutRow;

  let persistedCount = 0;
  let persistedSeed: PersistedCopySeed | null = null;
  const success = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      activePlanId: "11111111-1111-4111-8111-111111111111",
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-24",
    },
    buildDirectCopyDependencies({
      userId,
      plans: [provenancePlan],
      workouts: [sourceWorkout],
      currentDate: "2026-06-18",
      onPersist: ({ workoutSeed }) => {
        persistedCount += 1;
        persistedSeed = workoutSeed;
      },
    }),
  );

  assert.equal(success.ok, true, formatJsonResult(success));
  if (success.ok) {
    assert.equal(success.sourceKind, "file_import");
    assert.equal(success.activePlanId, provenancePlan.id);
    assert.equal(success.sourceWorkoutId, sourceWorkout.id);
    assert.equal(success.targetDate, "2026-06-24");
    assert.equal(success.targetWeekday, "Wednesday");
    assert.equal(success.safety.targetDayKind, "empty_day");
    assert.equal(success.safety.prescriptionCopiedFromPersistedWorkout, true);
    assert.equal(success.safety.reconstructedFromPersistedWorkout, false);
    assert.equal(success.safety.reviewedThroughManualAuthoring, false);
    assert.equal(success.safety.trustedClientRows, false);
    assert.equal(success.sourceMetadata.prescriptionSource, "persisted_planned_workout");
  }
  assert.equal(persistedCount, 1, "an eligible empty-date Paste must persist exactly once");
  assert.ok(persistedSeed, "the persisted prescription seed should be captured");
  assert.deepEqual(persistedSeed?.steps, sourceWorkout.steps);
  assert.deepEqual(persistedSeed?.metricMode, sourceWorkout.metric_mode);
  assert.deepEqual(persistedSeed?.goalContext, sourceWorkout.goal_context);
  assert.equal(persistedSeed?.title, sourceWorkout.title);
  assert.equal(persistedSeed?.workoutDate, "2026-06-24");
  assert.equal(persistedSeed?.weekday, "Wednesday");

  const restTarget = buildFakePlannedWorkout({
    userId,
    planCycleId: provenancePlan.id,
    id: "99999999-9999-4999-8999-000000000403",
    date: "2026-06-25",
    displayOrder: 5,
    title: "Rest",
    workoutType: "rest",
    sourceWorkoutType: "rest",
    workoutFamily: "rest",
    workoutIdentity: "rest_day",
    calendarIconKey: "rest",
  });
  await assertDirectCopyBlocked(
    userId,
    sourceWorkout,
    "2026-06-25",
    buildDirectCopyDependencies({
      userId,
      plans: [provenancePlan],
      workouts: [sourceWorkout, restTarget],
    }),
    "occupied_day",
    "a persisted Rest row is not an empty Paste target",
  );

  const occupiedTarget = {
    ...sourceWorkout,
    id: "99999999-9999-4999-8999-000000000404",
    workout_date: "2026-06-26",
  } satisfies PersistedPlannedWorkoutRow;
  await assertDirectCopyBlocked(
    userId,
    sourceWorkout,
    "2026-06-26",
    buildDirectCopyDependencies({
      userId,
      plans: [provenancePlan],
      workouts: [sourceWorkout, occupiedTarget],
    }),
    "occupied_day",
    "an occupied workout date is not a Paste target",
  );

  await assertDirectCopyBlocked(
    userId,
    sourceWorkout,
    "2026-06-17",
    buildDirectCopyDependencies({
      userId,
      plans: [provenancePlan],
      workouts: [sourceWorkout],
      currentDate: "2026-06-18",
    }),
    "protected_day",
    "a past target remains protected",
  );

  const restSource = { ...restTarget, workout_date: "2026-06-20" };
  await assertDirectCopyBlocked(
    userId,
    restSource,
    "2026-06-27",
    buildDirectCopyDependencies({
      userId,
      plans: [provenancePlan],
      workouts: [restSource],
    }),
    "source_workout_not_supported",
    "Rest rows are not Copy sources",
  );

  const clientRows = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-27",
      plannedWorkout: { steps: [] },
    },
    buildDirectCopyDependencies({
      userId,
      plans: [provenancePlan],
      workouts: [sourceWorkout],
    }),
  );
  assertDirectBlocked(clientRows, "client_payload_rejected", "client-sent workout rows");

  let protectedSourcePersistCount = 0;
  const protectedSource = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate: "2026-06-27",
    },
    buildDirectCopyDependencies({
      userId,
      plans: [provenancePlan],
      workouts: [sourceWorkout],
      logsByWorkoutId: new Map([
        [
          sourceWorkout.id,
          {
            id: "99999999-9999-4999-8999-000000000405",
            planned_workout_id: sourceWorkout.id,
            user_id: userId,
            outcome: "completed",
            actual_distance_km: 12,
            actual_duration_min: 60,
            rpe: 7,
            notes: "Actual truth stays on source.",
            intervals_completed: 4,
            body_notes: null,
            logged_at: "2026-06-10T12:00:00.000Z",
            updated_at: "2026-06-10T12:00:00.000Z",
          } satisfies PersistedWorkoutLogRow,
        ],
      ]),
      onPersist: () => {
        protectedSourcePersistCount += 1;
      },
    }),
  );
  assert.equal(protectedSource.ok, true, formatJsonResult(protectedSource));
  assert.equal(
    protectedSourcePersistCount,
    1,
    "logged/evidence source truth must not block prescription-only Copy",
  );
}

type PersistedCopySeed = Parameters<
  NonNullable<ManualWorkoutDirectCopyDependencies["persistWorkoutCopy"]>
>[0]["workoutSeed"];

function buildDirectCopyDependencies(input: {
  userId: string;
  plans: PersistedPlanCycleRow[];
  workouts: PersistedPlannedWorkoutRow[];
  currentDate?: string;
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  onPersist?: (
    input: Parameters<NonNullable<ManualWorkoutDirectCopyDependencies["persistWorkoutCopy"]>>[0],
  ) => void;
}): ManualWorkoutDirectCopyDependencies {
  return {
    currentDate: input.currentDate ?? "2026-06-18",
    getCalendarWorkoutContextForUser: async () => ({
      sourcePlansById: new Map(input.plans.map((plan) => [plan.id, plan])),
      existingWorkouts: {
        workouts: input.workouts,
        logsByWorkoutId: input.logsByWorkoutId ?? new Map(),
      },
    }),
    persistWorkoutCopy: async (persistInput) => {
      input.onPersist?.(persistInput);
      const targetId = "66666666-6666-4666-8666-666666666666";

      return {
        plannedWorkout: {
          ...persistInput.sourceWorkout,
          id: targetId,
          workout_date: persistInput.workoutSeed.workoutDate,
          weekday: persistInput.workoutSeed.weekday,
          week_number: persistInput.workoutSeed.weekNumber,
          display_order: persistInput.workoutSeed.displayOrder,
        },
      };
    },
  };
}

async function assertDirectCopyBlocked(
  userId: string,
  sourceWorkout: PersistedPlannedWorkoutRow,
  targetDate: string,
  dependencies: ManualWorkoutDirectCopyDependencies,
  reason: Extract<ManualWorkoutDirectCopyResult, { ok: false }>["reason"],
  label: string,
) {
  const result = await copyManualWorkoutWithinActivePlanForUser(
    userId,
    {
      sourceWorkoutId: sourceWorkout.id,
      sourceWorkoutDate: sourceWorkout.workout_date,
      targetDate,
    },
    dependencies,
  );
  assertDirectBlocked(result, reason, label);
}

function assertDirectBlocked(
  result: ManualWorkoutDirectCopyResult,
  reason: Extract<ManualWorkoutDirectCopyResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label}: ${formatJsonResult(result)}`);
  if (!result.ok) {
    assert.equal(result.persisted, false, `${label}: blocked copy must not persist`);
    assert.equal(result.reason, reason, `${label}: bounded reason`);
  }
}
