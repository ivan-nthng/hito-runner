import assert from "node:assert/strict";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/active-plan-persistence";
import { resolveActivePlanWorkoutSourceEditingCapabilities } from "../../src/lib/active-plan-workout-editing/source-capabilities";
import { type ManualWorkoutDraftInput } from "../../src/lib/manual-workout-authoring";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "../../src/lib/manual-workout-authoring/schema";
import {
  assertReady,
  buildCanonicalPersistedPlannedWorkoutFromReview,
  buildFakePlanCycle,
  buildFakePlannedWorkout,
  buildFakeWorkoutLog,
} from "./move-proof-fixtures";

export function validateManualSourceEditingCapabilityReadback() {
  const userId = "00000000-0000-4000-8000-000000000020";
  const currentDate = "2026-06-10";
  const activePlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000021",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });
  const futureReview = assertReady("source editing future manual source", {
    templateKey: "easy_run_with_strides",
    workoutDate: "2026-06-18",
    title: "Future unlogged source",
  });
  const futureWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "00000000-0000-4000-8000-000000000022",
    review: futureReview,
  });

  const futureCapability = resolveActivePlanWorkoutSourceEditingCapabilities({
    activePlan,
    workout: futureWorkout,
    log: null,
    evidenceWorkoutIds: new Set(),
    currentDate,
  });
  assert.deepEqual(
    {
      canMove: futureCapability.canMove,
      canClear: futureCapability.canClear,
      canCopy: futureCapability.canCopy,
      canEditContent: futureCapability.canEditContent,
      canDirectCopy: futureCapability.canDirectCopy,
      canDirectMove: futureCapability.canDirectMove,
      canDragInitiate: futureCapability.canDragInitiate,
      eligibility: futureCapability.eligibility,
      reason: futureCapability.reason,
    },
    {
      canMove: true,
      canClear: true,
      canCopy: true,
      canEditContent: true,
      canDirectCopy: true,
      canDirectMove: true,
      canDragInitiate: true,
      eligibility: "eligible_future_unlogged",
      reason: null,
    },
    "future unlogged manual source rows should expose direct copy/move/drag source capability",
  );

  const skippedLog = {
    ...buildFakeWorkoutLog({ userId, plannedWorkoutId: futureWorkout.id }),
    outcome: "skipped" as const,
  };
  assertSourceEditingBlocked(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: futureWorkout,
      log: skippedLog,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "skipped_logged_workout",
    "persisted skipped results should block direct source affordances",
  );

  assertSourceEditingBlocked(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: futureWorkout,
      log: buildFakeWorkoutLog({ userId, plannedWorkoutId: futureWorkout.id }),
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "logged_workout",
    "completed logged results should block direct source affordances",
  );

  assertSourceEditingBlocked(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: futureWorkout,
      log: null,
      evidenceWorkoutIds: new Set([futureWorkout.id]),
      currentDate,
    }),
    "evidence_backed_workout",
    "provider/comparison/AI evidence should block direct source affordances",
  );

  const unsafeMetricWorkout = {
    ...futureWorkout,
    id: "00000000-0000-4000-8000-000000000023",
    metric_mode: { mode: "pace_executable" },
    steps: [
      {
        type: "work",
        target: {
          pace: "5:00/km",
        },
      },
    ],
  } satisfies PersistedPlannedWorkoutRow;
  assertSourceEditingAllowed(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: unsafeMetricWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    {
      canClear: true,
      canCopy: false,
      canEditContent: false,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "metric target truth should allow move/clear/drag but block copy/content edit",
  );

  const unsupportedWorkout = {
    ...futureWorkout,
    id: "00000000-0000-4000-8000-000000000024",
    source_workout_type: "legacy_freeform_workout",
    workout_identity: "legacy_freeform_workout",
    workout_family: "unknown",
  } satisfies PersistedPlannedWorkoutRow;
  const unsupportedCapability = resolveActivePlanWorkoutSourceEditingCapabilities({
    activePlan,
    workout: unsupportedWorkout,
    log: null,
    evidenceWorkoutIds: new Set(),
    currentDate,
  });
  assertSourceEditingAllowed(
    unsupportedCapability,
    {
      canClear: true,
      canCopy: false,
      canEditContent: false,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "unsupported source metadata should still allow row move/clear but not copy/content edit",
  );

  const restWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: activePlan.id,
    id: "00000000-0000-4000-8000-000000000025",
    date: "2026-06-18",
    displayOrder: 2,
    title: "Rest day",
    workoutType: "rest",
    sourceWorkoutType: "rest",
    workoutFamily: "rest",
    workoutIdentity: "rest_day",
    calendarIconKey: "rest",
  });
  assertSourceEditingBlocked(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: restWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "rest_day",
    "rest rows should not expose direct workout source affordances",
  );

  const missedReview = assertReady("source editing past unlogged source", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-09",
    title: "Past unlogged source",
  });
  const missedWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "00000000-0000-4000-8000-000000000026",
    review: missedReview,
  });
  const missedCapability = resolveActivePlanWorkoutSourceEditingCapabilities({
    activePlan,
    workout: missedWorkout,
    log: null,
    evidenceWorkoutIds: new Set(),
    currentDate,
  });
  assert.deepEqual(
    {
      canMove: missedCapability.canMove,
      canClear: missedCapability.canClear,
      canCopy: missedCapability.canCopy,
      canEditContent: missedCapability.canEditContent,
      canDirectCopy: missedCapability.canDirectCopy,
      canDirectMove: missedCapability.canDirectMove,
      canDragInitiate: missedCapability.canDragInitiate,
      eligibility: missedCapability.eligibility,
      reason: missedCapability.reason,
    },
    {
      canMove: true,
      canClear: true,
      canCopy: false,
      canEditContent: false,
      canDirectCopy: false,
      canDirectMove: true,
      canDragInitiate: true,
      eligibility: "eligible_past_unlogged",
      reason: null,
    },
    "past missed unlogged rows should expose move/clear/drag source capability for valid Rest-day targets",
  );

  const oldMissedReview = assertReady("source editing older past unlogged source", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-02",
    title: "Older past unlogged source",
  });
  const oldMissedWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "00000000-0000-4000-8000-000000000027",
    review: oldMissedReview,
  });
  assertSourceEditingAllowed(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: oldMissedWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    {
      canClear: true,
      canCopy: false,
      canEditContent: false,
      canMove: true,
      eligibility: "eligible_past_unlogged",
    },
    "older missed unlogged rows should remain mutable when they have no log or evidence",
  );

  const todayReview = assertReady("source editing today source", {
    templateKey: "easy_aerobic_run",
    workoutDate: currentDate,
    title: "Today source",
  });
  const todayWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "00000000-0000-4000-8000-000000000028",
    review: todayReview,
  });
  const todayCapability = resolveActivePlanWorkoutSourceEditingCapabilities({
    activePlan,
    workout: todayWorkout,
    log: null,
    evidenceWorkoutIds: new Set(),
    currentDate,
  });
  assert.deepEqual(
    {
      canMove: todayCapability.canMove,
      canClear: todayCapability.canClear,
      canCopy: todayCapability.canCopy,
      canEditContent: todayCapability.canEditContent,
      canDirectCopy: todayCapability.canDirectCopy,
      canDirectMove: todayCapability.canDirectMove,
      canDragInitiate: todayCapability.canDragInitiate,
      eligibility: todayCapability.eligibility,
      reason: todayCapability.reason,
    },
    {
      canMove: true,
      canClear: true,
      canCopy: true,
      canEditContent: false,
      canDirectCopy: true,
      canDirectMove: true,
      canDragInitiate: true,
      eligibility: "eligible_current_unlogged",
      reason: null,
    },
    "today unlogged manual source rows should expose copy/move/drag but not persisted content edit",
  );

  const presetPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000029",
    sourceKind: "ai_first_plan_blueprint_v1",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });
  const presetWorkout = {
    ...futureWorkout,
    plan_cycle_id: presetPlan.id,
  } satisfies PersistedPlannedWorkoutRow;
  assertSourceEditingAllowed(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan: presetPlan,
      workout: presetWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    {
      canClear: true,
      canCopy: false,
      canEditContent: true,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "generated active-plan sources should expose content edit when the row reconstructs safely",
  );

  const selectedPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000030",
    sourceKind: "ai_first_plan_blueprint_v1",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });
  const selectedWorkout = buildFakePlannedWorkout({
    userId,
    planCycleId: selectedPlan.id,
    id: "00000000-0000-4000-8000-000000000031",
    date: "2026-06-18",
    displayOrder: 3,
    title: "Selected-plan aerobic run",
    sourceWorkoutType: "selected_plan_easy_run",
    workoutFamily: "easy",
    workoutIdentity: "easy_aerobic_run",
    calendarIconKey: "easy",
    steps: [
      {
        type: "work",
        segment_type: "main",
        duration_min: 30,
        target: { effort: "easy" },
      },
    ] as PersistedPlannedWorkoutRow["steps"],
  });
  assertSourceEditingAllowed(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan: selectedPlan,
      workout: selectedWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    {
      canClear: true,
      canCopy: false,
      canEditContent: true,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "selected-plan generated rows should expose content edit when rich identity reconstructs safely",
  );

  const importedPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000032",
    sourceKind: "training_plan_v2_import",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });
  const importedWorkout = {
    ...selectedWorkout,
    id: "00000000-0000-4000-8000-000000000033",
    plan_cycle_id: importedPlan.id,
    source_workout_type: "imported_steady_run",
    workout_identity: "steady_aerobic_run",
  } satisfies PersistedPlannedWorkoutRow;
  assertSourceEditingAllowed(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan: importedPlan,
      workout: importedWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    {
      canClear: true,
      canCopy: false,
      canEditContent: true,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "training-plan-v2 import rows should expose content edit when workout_identity reconstructs safely",
  );

  const unsupportedGeneratedWorkout = {
    ...selectedWorkout,
    id: "00000000-0000-4000-8000-000000000034",
    source_workout_type: "generated_freeform_workout",
    workout_identity: "unmapped_generated_workout",
  } satisfies PersistedPlannedWorkoutRow;
  assertSourceEditingAllowed(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan: selectedPlan,
      workout: unsupportedGeneratedWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    {
      canClear: true,
      canCopy: false,
      canEditContent: false,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "generated rows without reconstructable template identity should keep content edit blocked",
  );
}

function assertSourceEditingBlocked(
  result: ReturnType<typeof resolveActivePlanWorkoutSourceEditingCapabilities>,
  reason: NonNullable<
    ReturnType<typeof resolveActivePlanWorkoutSourceEditingCapabilities>["reason"]
  >,
  label: string,
) {
  assert.equal(result.canDirectCopy, false, `${label}: direct copy should be blocked`);
  assert.equal(result.canDirectMove, false, `${label}: direct move should be blocked`);
  assert.equal(result.canDragInitiate, false, `${label}: drag initiation should be blocked`);
  assert.equal(result.eligibility, "blocked", `${label}: eligibility should be blocked`);
  assert.equal(result.reason, reason, `${label}: blocked reason should be ${reason}`);
  assert.equal(typeof result.message, "string", `${label}: blocked message should be present`);
}

function assertSourceEditingAllowed(
  result: ReturnType<typeof resolveActivePlanWorkoutSourceEditingCapabilities>,
  expected: {
    canClear: boolean;
    canCopy: boolean;
    canEditContent: boolean;
    canMove: boolean;
    eligibility: Exclude<
      ReturnType<typeof resolveActivePlanWorkoutSourceEditingCapabilities>["eligibility"],
      "blocked"
    >;
  },
  label: string,
) {
  assert.deepEqual(
    {
      canClear: result.canClear,
      canCopy: result.canCopy,
      canDirectCopy: result.canDirectCopy,
      canDirectMove: result.canDirectMove,
      canDragInitiate: result.canDragInitiate,
      canEditContent: result.canEditContent,
      canMove: result.canMove,
      copyReason: result.copyReason,
      editContentReason: result.editContentReason,
      eligibility: result.eligibility,
      reason: result.reason,
    },
    {
      canClear: expected.canClear,
      canCopy: expected.canCopy,
      canDirectCopy: expected.canCopy,
      canDirectMove: expected.canMove,
      canDragInitiate: expected.canMove,
      canEditContent: expected.canEditContent,
      canMove: expected.canMove,
      copyReason: expected.canCopy ? null : "copy_requires_editor_support",
      editContentReason: expected.canEditContent ? null : "edit_content_requires_editor_support",
      eligibility: expected.eligibility,
      reason: null,
    },
    label,
  );
}
