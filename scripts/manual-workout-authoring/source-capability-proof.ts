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
      canDirectCopy: futureCapability.canDirectCopy,
      canDirectMove: futureCapability.canDirectMove,
      canDragInitiate: futureCapability.canDragInitiate,
      eligibility: futureCapability.eligibility,
      reason: futureCapability.reason,
    },
    {
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
  assertSourceEditingBlocked(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: unsafeMetricWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "unsafe_metric_truth",
    "unsafe metric truth should block direct source affordances",
  );

  const unsupportedWorkout = {
    ...futureWorkout,
    id: "00000000-0000-4000-8000-000000000024",
    source_workout_type: "legacy_freeform_workout",
  } satisfies PersistedPlannedWorkoutRow;
  assertSourceEditingBlocked(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: unsupportedWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "unsupported_source_workout",
    "unsupported source metadata should block direct source affordances",
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

  const missedReview = assertReady("source editing missed recent source", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-09",
    title: "Recent missed unlogged source",
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
      canDirectCopy: missedCapability.canDirectCopy,
      canDirectMove: missedCapability.canDirectMove,
      canDragInitiate: missedCapability.canDragInitiate,
      eligibility: missedCapability.eligibility,
      reason: missedCapability.reason,
    },
    {
      canDirectCopy: false,
      canDirectMove: true,
      canDragInitiate: true,
      eligibility: "eligible_missed_unlogged_recent",
      reason: null,
    },
    "recent missed unlogged rows should expose move/drag source capability for valid current or future empty targets",
  );

  const oldMissedReview = assertReady("source editing expired missed source", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-02",
    title: "Expired missed source",
  });
  const oldMissedWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "00000000-0000-4000-8000-000000000027",
    review: oldMissedReview,
  });
  assertSourceEditingBlocked(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: oldMissedWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "missed_window_expired",
    "expired missed rows should block direct source affordances",
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
  assertSourceEditingBlocked(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan,
      workout: todayWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "past_not_missed_unlogged",
    "today source rows should not expose missed-workout drag/move affordances",
  );

  const presetPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000029",
    sourceKind: "plan_preset_v1",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });
  assertSourceEditingBlocked(
    resolveActivePlanWorkoutSourceEditingCapabilities({
      activePlan: presetPlan,
      workout: futureWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "unsupported_active_plan_source",
    "direct manual source affordances should stay manual-plan-only",
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

function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}
