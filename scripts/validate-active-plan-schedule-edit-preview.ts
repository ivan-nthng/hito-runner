import {
  buildActivePlanScheduleReflowApplyPlan,
  buildActivePlanScheduleEditPreview,
  type ActivePlanScheduleEditPreview,
} from "../src/lib/active-plan-schedule-edit-preview";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../src/lib/active-plan-persistence";
import type { Json } from "../src/lib/supabase/database";

const ACTIVE_PLAN_ID = "plan-schedule-preview-fixture";
const USER_ID = "schedule-preview-user";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const previewOnlyWorkouts = buildWorkouts();
  const previewOnlyBefore = JSON.stringify(previewOnlyWorkouts);
  buildActivePlanScheduleEditPreview({
    activePlan: buildPlan(),
    workouts: previewOnlyWorkouts,
    currentDate: "2026-06-01",
    input: {
      activePlanId: ACTIVE_PLAN_ID,
      fixedRestDays: ["Tuesday", "Sunday"],
      preferredLongRunDay: "Thursday",
      runningDaysPerWeek: 4,
    },
  });
  assert(
    JSON.stringify(previewOnlyWorkouts) === previewOnlyBefore,
    "preview-only path should not mutate workout rows",
  );

  const applyWorkouts = buildWorkouts();
  const sameCountPreview = buildActivePlanScheduleEditPreview({
    activePlan: buildPlan(),
    workouts: applyWorkouts,
    currentDate: "2026-06-01",
    input: {
      activePlanId: ACTIVE_PLAN_ID,
      fixedRestDays: ["Tuesday", "Sunday"],
      preferredLongRunDay: "Thursday",
      runningDaysPerWeek: 4,
    },
  });

  assert(sameCountPreview.ok, "same-count schedule preview should succeed");
  assert(
    sameCountPreview.mode === "schedule_reflow",
    "same-count schedule preview should use schedule_reflow",
  );
  assert(
    sameCountPreview.proposedDateChanges.length > 0,
    "same-count schedule preview should include proposed date changes",
  );
  assert(
    sameCountPreview.fixedRestDayProof.ok,
    "same-count schedule preview should keep fixed rest days free of non-rest workouts",
  );
  assert(
    sameCountPreview.previewWorkouts.every(
      (workout) => workout.workoutFamily && workout.workoutIdentity,
    ),
    "same-count schedule preview should preserve stored rich workout fields",
  );

  const movedLongRun = sameCountPreview.proposedDateChanges.find(
    (change) => change.workoutId === "w1-long",
  );
  assert(movedLongRun, "mutable long run should be present in proposed changes");
  assert(
    movedLongRun.toWeekday === "Thursday",
    "mutable long run should move to the preferred long-run day",
  );
  assert(
    movedLongRun.richFieldsPreserved && movedLongRun.workoutIdentity === "long_aerobic_run",
    "mutable long run should preserve its rich identity while moving",
  );

  const applyPlan = buildActivePlanScheduleReflowApplyPlan({
    activePlan: buildPlan(),
    workouts: applyWorkouts,
    currentDate: "2026-06-01",
    input: {
      previewToken: sameCountPreview.previewToken,
      scheduleEditInput: {
        activePlanId: ACTIVE_PLAN_ID,
        fixedRestDays: ["Tuesday", "Sunday"],
        preferredLongRunDay: "Thursday",
        runningDaysPerWeek: 4,
      },
    },
  });

  assert(applyPlan.ok, "reviewed same-count token should produce an apply plan");
  assert(
    applyPlan.workoutUpdates.length === sameCountPreview.proposedDateChanges.length,
    "apply plan should persist only reviewed date moves",
  );
  assert(
    applyPlan.updatedPlanPreferences &&
      typeof applyPlan.updatedPlanPreferences === "object" &&
      !Array.isArray(applyPlan.updatedPlanPreferences),
    "apply plan should include updated active-plan schedule preferences",
  );

  const appliedRows = applyUpdatesToRows(applyWorkouts, applyPlan.workoutUpdates);
  const appliedLongRun = appliedRows.find((workout) => workout.id === "w1-long");
  const originalLongRun = applyWorkouts.find((workout) => workout.id === "w1-long");

  assert(appliedLongRun && originalLongRun, "long-run rows should exist after apply simulation");
  assert(
    appliedLongRun.workout_date === movedLongRun.toDate,
    "apply should move reviewed long run",
  );
  assert(
    JSON.stringify(appliedLongRun.steps) === JSON.stringify(originalLongRun.steps),
    "apply should preserve workout steps",
  );
  assert(
    appliedLongRun.workout_family === originalLongRun.workout_family &&
      appliedLongRun.workout_identity === originalLongRun.workout_identity &&
      appliedLongRun.calendar_icon_key === originalLongRun.calendar_icon_key &&
      JSON.stringify(appliedLongRun.goal_context) ===
        JSON.stringify(originalLongRun.goal_context) &&
      JSON.stringify(appliedLongRun.metric_mode) === JSON.stringify(originalLongRun.metric_mode),
    "apply should preserve rich fields, goal context, and metric mode",
  );
  assert(
    appliedRows
      .filter((workout) => workout.workout_type !== "rest")
      .every((workout) => workout.weekday !== "Tuesday" && workout.weekday !== "Sunday"),
    "applied same-count schedule should keep fixed rest days free of non-rest workouts",
  );

  const atomicSuccess = simulateAtomicPersistence({
    plan: buildPlan(),
    workouts: applyWorkouts,
    workoutUpdates: applyPlan.workoutUpdates,
    updatedPlanPreferences: applyPlan.updatedPlanPreferences,
  });
  assert(atomicSuccess.ok, "atomic apply simulation should commit valid reviewed moves");
  assert(
    JSON.stringify(atomicSuccess.plan.plan_preferences) ===
      JSON.stringify(applyPlan.updatedPlanPreferences),
    "atomic apply simulation should update plan preferences with workout moves",
  );
  assert(
    workoutDateSignature(atomicSuccess.workouts) === workoutDateSignature(appliedRows),
    "atomic apply simulation should persist the reviewed workout date metadata",
  );

  const atomicFailure = simulateAtomicPersistence({
    plan: buildPlan(),
    workouts: applyWorkouts,
    workoutUpdates: applyPlan.workoutUpdates,
    updatedPlanPreferences: applyPlan.updatedPlanPreferences,
    failBeforeCommit: true,
  });
  assert(!atomicFailure.ok, "atomic apply simulation should model failed commit");
  assert(
    JSON.stringify(atomicFailure.plan.plan_preferences) ===
      JSON.stringify(buildPlan().plan_preferences),
    "failed atomic apply should leave plan preferences unchanged",
  );
  assert(
    workoutDateSignature(atomicFailure.workouts) === workoutDateSignature(applyWorkouts),
    "failed atomic apply should leave workout date metadata unchanged",
  );

  const staleApplyPlan = buildActivePlanScheduleReflowApplyPlan({
    activePlan: {
      ...buildPlan(),
      updated_at: "2026-06-01T00:05:00.000Z",
    },
    workouts: buildWorkouts(),
    currentDate: "2026-06-01",
    input: {
      previewToken: sameCountPreview.previewToken,
      scheduleEditInput: {
        activePlanId: ACTIVE_PLAN_ID,
        fixedRestDays: ["Tuesday", "Sunday"],
        preferredLongRunDay: "Thursday",
        runningDaysPerWeek: 4,
      },
    },
  });

  assert(!staleApplyPlan.ok, "changed active plan should reject stale preview token");
  assert(staleApplyPlan.reason === "stale_preview", "changed active plan should be stale_preview");

  const protectedApplyPlan = buildActivePlanScheduleReflowApplyPlan({
    activePlan: buildPlan(),
    workouts: buildWorkouts(),
    currentDate: "2026-06-01",
    logsByWorkoutId: new Map<string, PersistedWorkoutLogRow>([["w1-long", buildLog("w1-long")]]),
    input: {
      previewToken: sameCountPreview.previewToken,
      scheduleEditInput: {
        activePlanId: ACTIVE_PLAN_ID,
        fixedRestDays: ["Tuesday", "Sunday"],
        preferredLongRunDay: "Thursday",
        runningDaysPerWeek: 4,
      },
    },
  });

  assert(!protectedApplyPlan.ok, "moved workout gaining a log after preview should reject apply");
  assert(
    protectedApplyPlan.reason === "stale_preview",
    "moved workout gaining a log should stale the preview",
  );

  const evidenceApplyPlan = buildActivePlanScheduleReflowApplyPlan({
    activePlan: buildPlan(),
    workouts: buildWorkouts(),
    currentDate: "2026-06-01",
    evidenceWorkoutIds: new Set(["w1-long"]),
    input: {
      previewToken: sameCountPreview.previewToken,
      scheduleEditInput: {
        activePlanId: ACTIVE_PLAN_ID,
        fixedRestDays: ["Tuesday", "Sunday"],
        preferredLongRunDay: "Thursday",
        runningDaysPerWeek: 4,
      },
    },
  });

  assert(!evidenceApplyPlan.ok, "moved workout gaining evidence after preview should reject apply");
  assert(
    evidenceApplyPlan.reason === "stale_preview",
    "moved workout gaining evidence should stale the preview",
  );

  const countChangePreview = buildActivePlanScheduleEditPreview({
    activePlan: buildPlan(),
    workouts: buildWorkouts(),
    currentDate: "2026-06-01",
    input: {
      activePlanId: ACTIVE_PLAN_ID,
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      runningDaysPerWeek: 3,
    },
  });

  assert(countChangePreview.ok, "count-change schedule preview should return a bounded result");
  assert(
    countChangePreview.mode === "requires_regeneration",
    "count-change schedule preview should require regeneration",
  );
  assert(
    countChangePreview.reason === "running_day_count_changed",
    "count-change schedule preview should explain the running-day count change",
  );

  const countChangeApplyPlan = buildActivePlanScheduleReflowApplyPlan({
    activePlan: buildPlan(),
    workouts: buildWorkouts(),
    currentDate: "2026-06-01",
    input: {
      previewToken: sameCountPreview.previewToken,
      scheduleEditInput: {
        activePlanId: ACTIVE_PLAN_ID,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
        runningDaysPerWeek: 3,
      },
    },
  });

  assert(!countChangeApplyPlan.ok, "requires_regeneration preview should not apply as reflow");
  assert(
    countChangeApplyPlan.reason === "requires_regeneration",
    "requires_regeneration apply should be rejected explicitly",
  );

  const protectedPreview = buildActivePlanScheduleEditPreview({
    activePlan: buildPlan(),
    workouts: buildWorkouts(),
    currentDate: "2026-06-01",
    logsByWorkoutId: new Map<string, PersistedWorkoutLogRow>([
      ["w2-steady", buildLog("w2-steady")],
    ]),
    evidenceWorkoutIds: new Set(["w2-quality"]),
    input: {
      activePlanId: ACTIVE_PLAN_ID,
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Thursday",
      runningDaysPerWeek: 4,
    },
  });

  assert(protectedPreview.ok, "protected workout schedule preview should succeed");
  assert(
    protectedPreview.mode === "schedule_reflow",
    "protected workout schedule preview should stay in schedule_reflow",
  );
  assert(
    protectedPreview.previewWorkouts.find((workout) => workout.workoutId === "w2-steady")
      ?.protection === "protected",
    "logged future workout should remain protected",
  );
  assert(
    protectedPreview.previewWorkouts.find((workout) => workout.workoutId === "w2-quality")
      ?.protection === "protected",
    "evidence-backed future workout should remain protected",
  );
  assert(
    protectedPreview.proposedDateChanges.every((change) => change.workoutId !== "w2-steady"),
    "logged future workout should not appear in proposed date changes",
  );
  assert(
    protectedPreview.proposedDateChanges.every((change) => change.workoutId !== "w2-quality"),
    "evidence-backed future workout should not appear in proposed date changes",
  );

  const protectedConflictPreview = buildActivePlanScheduleEditPreview({
    activePlan: buildPlan(),
    workouts: buildWorkouts(),
    currentDate: "2026-06-03",
    input: {
      activePlanId: ACTIVE_PLAN_ID,
      fixedRestDays: ["Tuesday", "Sunday"],
      preferredLongRunDay: "Thursday",
      runningDaysPerWeek: 4,
    },
  });

  assert(!protectedConflictPreview.ok, "protected fixed-rest conflict should fail safely");
  assert(
    protectedConflictPreview.reason === "protected_history_conflict",
    "protected fixed-rest conflict should be reported as protected_history_conflict",
  );

  printPreviewSummary("same-count", sameCountPreview);
  printPreviewSummary("count-change", countChangePreview);
  printPreviewSummary("protected", protectedPreview);
  console.log("Active-plan schedule edit preview/apply fixtures passed.");
}

function applyUpdatesToRows(
  workouts: PersistedPlannedWorkoutRow[],
  updates: Array<{
    workoutId: string;
    toDate: string;
    weekday: string;
    weekNumber: number;
    displayOrder: number;
  }>,
) {
  const updateByWorkoutId = new Map(updates.map((update) => [update.workoutId, update]));

  return workouts.map((workout) => {
    const update = updateByWorkoutId.get(workout.id);

    if (!update) {
      return { ...workout };
    }

    return {
      ...workout,
      workout_date: update.toDate,
      weekday: update.weekday,
      week_number: update.weekNumber,
      display_order: update.displayOrder,
    };
  });
}

function simulateAtomicPersistence({
  plan,
  workouts,
  workoutUpdates,
  updatedPlanPreferences,
  failBeforeCommit = false,
}: {
  plan: PersistedPlanCycleRow;
  workouts: PersistedPlannedWorkoutRow[];
  workoutUpdates: Array<{
    workoutId: string;
    toDate: string;
    weekday: string;
    weekNumber: number;
    displayOrder: number;
  }>;
  updatedPlanPreferences: Json;
  failBeforeCommit?: boolean;
}) {
  const copiedPlan = { ...plan };
  const copiedWorkouts = workouts.map((workout) => ({ ...workout }));

  if (failBeforeCommit) {
    return {
      ok: false as const,
      plan: copiedPlan,
      workouts: copiedWorkouts,
    };
  }

  return {
    ok: true as const,
    plan: {
      ...copiedPlan,
      plan_preferences: updatedPlanPreferences,
    },
    workouts: applyUpdatesToRows(copiedWorkouts, workoutUpdates),
  };
}

function workoutDateSignature(workouts: PersistedPlannedWorkoutRow[]) {
  return workouts
    .map(
      (workout) =>
        `${workout.id}:${workout.workout_date}:${workout.weekday}:${workout.week_number}:${workout.display_order}`,
    )
    .sort()
    .join("|");
}

function buildPlan(): PersistedPlanCycleRow {
  return {
    id: ACTIVE_PLAN_ID,
    user_id: USER_ID,
    status: "active",
    title: "Schedule Preview Fixture",
    goal_summary: "Fixture plan",
    source_template: "fixture",
    schema_version: "training-plan-v2",
    source_kind: "structured_first_plan",
    start_date: "2026-06-01",
    end_date: "2026-06-14",
    target_date: "2026-06-14",
    goal_metadata: null,
    plan_preferences: {
      blocked_days: ["Wednesday", "Sunday"],
      preferred_run_days: ["Monday", "Tuesday", "Thursday", "Saturday"],
      max_running_days_per_week: 4,
      preferred_long_run_day: "Saturday",
    },
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  };
}

function buildWorkouts(): PersistedPlannedWorkoutRow[] {
  return [
    buildWorkout("w1-easy", "2026-06-01", 1, "easy", "easy_aerobic_run", "easy"),
    buildWorkout("w1-steady", "2026-06-02", 1, "steady_or_easy", "steady_aerobic_run", "steady"),
    buildWorkout("w1-quality", "2026-06-04", 1, "quality", "rolling_hills_session", "hills"),
    buildWorkout("w1-long", "2026-06-06", 1, "long_run", "long_aerobic_run", "long"),
    buildWorkout("w2-easy", "2026-06-08", 2, "easy", "easy_aerobic_run", "easy"),
    buildWorkout("w2-steady", "2026-06-09", 2, "steady_or_easy", "steady_aerobic_run", "steady"),
    buildWorkout("w2-quality", "2026-06-11", 2, "quality", "rolling_hills_session", "hills"),
    buildWorkout("w2-long", "2026-06-13", 2, "long_run", "long_aerobic_run", "long"),
  ];
}

function buildWorkout(
  id: string,
  workoutDate: string,
  weekNumber: number,
  workoutType: PersistedPlannedWorkoutRow["workout_type"],
  workoutIdentity: string,
  family: string,
): PersistedPlannedWorkoutRow {
  return {
    id,
    user_id: USER_ID,
    plan_cycle_id: ACTIVE_PLAN_ID,
    workout_date: workoutDate,
    weekday: new Date(`${workoutDate}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
    }),
    week_number: weekNumber,
    phase: weekNumber === 1 ? "Base" : "Build",
    workout_type: workoutType,
    source_workout_id: `source-${id}`,
    source_workout_type: workoutIdentity,
    workout_family: family,
    workout_identity: workoutIdentity,
    calendar_icon_key: family,
    goal_context: { goal_family: "half_marathon", purpose: workoutIdentity } as Json,
    metric_mode: { primary: "effort", pace: "disabled", heart_rate: "disabled" } as Json,
    title: titleForWorkout(workoutIdentity),
    notes: "Fixture workout.",
    planned_rpe: workoutType === "quality" ? 6 : 4,
    estimated_fatigue: workoutType === "long_run" ? "moderate" : "low",
    recovery_priority: workoutType === "long_run" ? "medium" : "low",
    steps: [
      {
        type: "warmup",
        label: "Easy opener",
        sequence: 1,
        guidance: "Start relaxed.",
        target: { cue: "relaxed" },
      },
      {
        type: "main",
        label: "Main block",
        sequence: 2,
        guidance: "Keep the assigned purpose.",
        target: { cue: "controlled" },
      },
      {
        type: "cooldown",
        label: "Easy finish",
        sequence: 3,
        guidance: "Finish smooth.",
        target: { cue: "smooth" },
      },
    ] as Json,
    display_order: weekNumber * 10 + Number(id.split("-").at(-1) === "long"),
    created_at: "2026-06-01T00:00:00.000Z",
  };
}

function buildLog(plannedWorkoutId: string): PersistedWorkoutLogRow {
  return {
    id: `log-${plannedWorkoutId}`,
    planned_workout_id: plannedWorkoutId,
    user_id: USER_ID,
    outcome: "completed",
    actual_distance_km: 8,
    actual_duration_min: 48,
    rpe: 5,
    notes: null,
    intervals_completed: null,
    logged_at: "2026-06-09T12:00:00.000Z",
    updated_at: "2026-06-09T12:00:00.000Z",
  };
}

function titleForWorkout(workoutIdentity: string) {
  return workoutIdentity
    .split("_")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
}

function printPreviewSummary(label: string, preview: ActivePlanScheduleEditPreview) {
  if (!preview.ok) {
    console.log(`${label}: ${preview.reason}`);
    return;
  }

  console.log(
    `${label}: ${preview.mode}; movable=${preview.movableFutureWorkoutCount}; preserved=${preview.preservedPastProtectedWorkoutCount}`,
  );
}

main();
