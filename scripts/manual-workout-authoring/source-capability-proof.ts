import assert from "node:assert/strict";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/active-plan-persistence";
import { resolveCalendarWorkoutSourceEditingCapabilities } from "../../src/lib/active-plan-workout-editing/source-capabilities";
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

  const futureCapability = resolveCalendarWorkoutSourceEditingCapabilities({
    provenancePlan: activePlan,
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
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: activePlan,
      workout: futureWorkout,
      log: skippedLog,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "skipped_logged_workout",
    "persisted skipped results should block direct source affordances",
    false,
    true,
  );

  assertSourceEditingBlocked(
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: activePlan,
      workout: futureWorkout,
      log: buildFakeWorkoutLog({ userId, plannedWorkoutId: futureWorkout.id }),
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "logged_workout",
    "completed logged results should block direct source affordances",
    false,
    true,
  );

  assertSourceEditingBlocked(
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: activePlan,
      workout: futureWorkout,
      log: null,
      evidenceWorkoutIds: new Set([futureWorkout.id]),
      currentDate,
    }),
    "evidence_backed_workout",
    "provider/comparison/AI evidence should block direct source affordances",
    false,
    true,
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
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: activePlan,
      workout: unsafeMetricWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    {
      canClear: true,
      canCopy: true,
      canEditContent: false,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "metric target truth should allow prescription copy while content edit remains blocked",
  );

  const unsupportedWorkout = {
    ...futureWorkout,
    id: "00000000-0000-4000-8000-000000000024",
    source_workout_type: "legacy_freeform_workout",
    workout_identity: "legacy_freeform_workout",
    workout_family: "unknown",
  } satisfies PersistedPlannedWorkoutRow;
  const unsupportedCapability = resolveCalendarWorkoutSourceEditingCapabilities({
    provenancePlan: activePlan,
    workout: unsupportedWorkout,
    log: null,
    evidenceWorkoutIds: new Set(),
    currentDate,
  });
  assertSourceEditingAllowed(
    unsupportedCapability,
    {
      canClear: true,
      canCopy: true,
      canEditContent: false,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "unsupported source metadata should still allow prescription copy and row move/clear",
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
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: activePlan,
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
  const missedCapability = resolveCalendarWorkoutSourceEditingCapabilities({
    provenancePlan: activePlan,
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
      canCopy: true,
      canEditContent: false,
      canDirectCopy: true,
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
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: activePlan,
      workout: oldMissedWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    {
      canClear: true,
      canCopy: true,
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
  const todayCapability = resolveCalendarWorkoutSourceEditingCapabilities({
    provenancePlan: activePlan,
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
    "today unlogged manual source rows should expose reviewed content edit",
  );

  assertSourceEditingBlocked(
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: activePlan,
      workout: todayWorkout,
      log: buildFakeWorkoutLog({ userId, plannedWorkoutId: todayWorkout.id }),
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    "logged_workout",
    "today logged rows should preserve lifecycle protection while exposing content edit",
    false,
    true,
  );
  assertSourceEditingBlocked(
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: activePlan,
      workout: todayWorkout,
      log: null,
      evidenceWorkoutIds: new Set([todayWorkout.id]),
      currentDate,
    }),
    "evidence_backed_workout",
    "today evidence-backed rows should preserve lifecycle protection while exposing content edit",
    false,
    true,
  );

  const presetPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000029",
    sourceKind: "ai_authored_plan_first_v1",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });
  const presetWorkout = {
    ...futureWorkout,
    plan_cycle_id: presetPlan.id,
    title: "AI-authored tempo repeats",
    source_workout_type: "controlled_tempo_session",
    workout_family: "tempo",
    workout_identity: "controlled_tempo_session",
    calendar_icon_key: "tempo",
    steps: [
      {
        type: "warmup",
        segment_id: "ai-warmup",
        segment_type: "warmup",
        label: "Warm up",
        sequence: 1,
        prescription: { mode: "time", duration_min: 10 },
        duration_min: 10,
      },
      {
        type: "intervals",
        segment_id: "ai-tempo-repeat",
        segment_type: "interval_block",
        label: "3 x tempo",
        sequence: 2,
        repeats: 3,
        prescription: {
          mode: "repeats",
          repeat_count: 3,
          children: [
            {
              role: "work",
              label: "Tempo work",
              sequence: 1,
              prescription: { mode: "time", duration_min: 8 },
              target: {
                target_source: "ai_authored_plan_guidance",
                pace: "4:50-5:00/km",
                intensity: "Controlled tempo effort",
                hr_target_source: "effort_only",
                extra: { hr_zone: "Z3" },
              },
            },
            {
              role: "recover",
              label: "Easy jog",
              sequence: 2,
              prescription: { mode: "time", duration_min: 2 },
            },
          ],
        },
      },
      {
        type: "cooldown",
        segment_id: "ai-cooldown",
        segment_type: "cooldown",
        label: "Cool down",
        sequence: 3,
        prescription: { mode: "time", duration_min: 10 },
        duration_min: 10,
      },
    ] as PersistedPlannedWorkoutRow["steps"],
  } satisfies PersistedPlannedWorkoutRow;
  assertSourceEditingAllowed(
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: presetPlan,
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
    "generated guidance targets remain eligible through the origin-neutral document contract",
  );

  const selectedPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000030",
    sourceKind: "ai_authored_plan_first_v1",
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
        segment_id: "selected-main",
        segment_type: "main",
        sequence: 1,
        prescription: { mode: "time", duration_min: 30 },
        duration_min: 30,
        target: { effort: "easy" },
      },
    ] as PersistedPlannedWorkoutRow["steps"],
  });
  assertSourceEditingAllowed(
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: selectedPlan,
      workout: selectedWorkout,
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
    "selected-plan generated rows should expose copy and content edit when rich identity reconstructs safely",
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
    workout_family: "steady",
    workout_identity: "steady_aerobic_run",
    calendar_icon_key: "steady",
  } satisfies PersistedPlannedWorkoutRow;
  assertSourceEditingAllowed(
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: importedPlan,
      workout: importedWorkout,
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
    "training-plan-v2 import rows should expose copy and content edit when workout_identity reconstructs safely",
  );

  const arbitraryOriginPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000035",
    sourceKind: "external_partner_confirmed_v4",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });
  assertSourceEditingAllowed(
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: arbitraryOriginPlan,
      workout: {
        ...importedWorkout,
        id: "00000000-0000-4000-8000-000000000036",
        plan_cycle_id: arbitraryOriginPlan.id,
      },
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
    "saved-plan origin must not govern materialized workout actions",
  );

  const unsupportedGeneratedWorkout = {
    ...selectedWorkout,
    id: "00000000-0000-4000-8000-000000000034",
    source_workout_type: "generated_freeform_workout",
    workout_identity: "unmapped_generated_workout",
  } satisfies PersistedPlannedWorkoutRow;
  assertSourceEditingAllowed(
    resolveCalendarWorkoutSourceEditingCapabilities({
      provenancePlan: selectedPlan,
      workout: unsupportedGeneratedWorkout,
      log: null,
      evidenceWorkoutIds: new Set(),
      currentDate,
    }),
    {
      canClear: true,
      canCopy: true,
      canEditContent: false,
      canMove: true,
      eligibility: "eligible_future_unlogged",
    },
    "generated rows without reconstructable template identity still copy their persisted prescription",
  );
}

function assertSourceEditingBlocked(
  result: ReturnType<typeof resolveCalendarWorkoutSourceEditingCapabilities>,
  reason: NonNullable<ReturnType<typeof resolveCalendarWorkoutSourceEditingCapabilities>["reason"]>,
  label: string,
  canEditContent = false,
  canCopy = false,
) {
  assert.equal(
    result.canDirectCopy,
    canCopy,
    `${label}: direct copy capability should be truthful`,
  );
  assert.equal(result.canDirectMove, false, `${label}: direct move should be blocked`);
  assert.equal(result.canDragInitiate, false, `${label}: drag initiation should be blocked`);
  assert.equal(result.eligibility, "blocked", `${label}: eligibility should be blocked`);
  assert.equal(result.reason, reason, `${label}: blocked reason should be ${reason}`);
  assert.equal(typeof result.message, "string", `${label}: blocked message should be present`);
  assert.equal(
    result.canEditContent,
    canEditContent,
    `${label}: content edit should follow its date-based contract`,
  );
  assert.equal(
    result.editContentReason,
    canEditContent ? null : reason,
    `${label}: content edit reason should be independent from lifecycle protection`,
  );
}

function assertSourceEditingAllowed(
  result: ReturnType<typeof resolveCalendarWorkoutSourceEditingCapabilities>,
  expected: {
    canClear: boolean;
    canCopy: boolean;
    canEditContent: boolean;
    canMove: boolean;
    eligibility: Exclude<
      ReturnType<typeof resolveCalendarWorkoutSourceEditingCapabilities>["eligibility"],
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
      editContentReason: expected.canEditContent
        ? null
        : expected.eligibility === "eligible_past_unlogged"
          ? "protected_history"
          : "unsupported_source_workout",
      eligibility: expected.eligibility,
      reason: null,
    },
    label,
  );
}
