import assert from "node:assert/strict";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/active-plan-persistence";
import { resolveActivePlanWorkoutSourceEditingCapabilities } from "../../src/lib/active-plan-workout-editing/source-capabilities";
import { buildImportedPlanSeed } from "../../src/lib/imported-plan";
import {
  buildManualWorkoutUserBuiltTrainingPlan,
  reviewManualWorkoutDraft,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
} from "../../src/lib/manual-workout-authoring/schema";
import { buildPersistedWorkoutInsertRows } from "../../src/lib/persisted-plan-replacement";

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
      canEditContent: true,
      canDirectCopy: true,
      canDirectMove: true,
      canDragInitiate: true,
      eligibility: "eligible_current_unlogged",
      reason: null,
    },
    "today unlogged manual source rows should expose direct copy/move/drag source capability",
  );

  const presetPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000029",
    sourceKind: "plan_preset_v1",
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
      canCopy: true,
      canEditContent: true,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "editable active-plan sources should expose row lifecycle affordances regardless of source kind",
  );

  const selectedPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000030",
    sourceKind: "running_plan_engine_10k_builder_v1",
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
      canEditContent: false,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "selected-plan generated rows should expose move/clear while copy/content edit stay editor-gated",
  );
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

function buildCanonicalPersistedPlannedWorkoutFromReview({
  userId,
  planCycleId,
  id,
  review,
}: {
  userId: string;
  planCycleId: string;
  id: string;
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
}): PersistedPlannedWorkoutRow {
  const canonicalPlan = buildManualWorkoutUserBuiltTrainingPlan(review.draft);
  const importedSeed = buildImportedPlanSeed(canonicalPlan);
  const [insertRow] = buildPersistedWorkoutInsertRows(planCycleId, userId, importedSeed.workouts);

  assert.ok(insertRow, "canonical persisted workout fixture should produce one insert row");

  return {
    id,
    created_at: "2026-06-10T00:00:00.000Z",
    ...insertRow,
  } satisfies PersistedPlannedWorkoutRow;
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

function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}
