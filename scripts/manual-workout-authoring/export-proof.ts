import assert from "node:assert/strict";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
} from "../../src/lib/active-plan-persistence";
import { buildImportedPlanSeed, importedPlanSchema } from "../../src/lib/imported-plan";
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
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
  renderPlanExportJson,
  renderPlanExportMarkdown,
} from "../../src/lib/plan-export";
import { buildPersistedWorkoutInsertRows } from "../../src/lib/persisted-plan-replacement";

export function validateManualActivePlanExportContract() {
  const userId = "00000000-0000-4000-8000-000000000601";
  const activePlan = buildFakePlanCycle({
    userId,
    id: "99999999-9999-4999-8999-000000000601",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: "2026-06-18",
    endDate: "2026-06-22",
  });
  const firstReview = assertReady("manual export first workout", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-18",
    title: "First manual easy run",
  });
  const savedTemplateReview = assertReady("manual export saved-template workout", {
    templateKey: "steady_aerobic_run",
    workoutDate: "2026-06-20",
    title: "Saved steady template",
  });
  const copiedReview = assertReady("manual export copied workout", {
    templateKey: "easy_run_with_strides",
    workoutDate: "2026-06-22",
    title: "Copied strides workout",
  });
  const deletedReview = assertReady("manual export deleted workout", {
    templateKey: "long_aerobic_run",
    workoutDate: "2026-06-19",
    title: "Deleted long run",
  });
  const exportedWorkouts = [
    buildCanonicalPersistedPlannedWorkoutFromReview({
      userId,
      planCycleId: activePlan.id,
      id: "99999999-9999-4999-8999-000000000602",
      review: firstReview,
    }),
    buildCanonicalPersistedPlannedWorkoutFromReview({
      userId,
      planCycleId: activePlan.id,
      id: "99999999-9999-4999-8999-000000000603",
      review: savedTemplateReview,
    }),
    buildCanonicalPersistedPlannedWorkoutFromReview({
      userId,
      planCycleId: activePlan.id,
      id: "99999999-9999-4999-8999-000000000604",
      review: copiedReview,
    }),
  ];
  const deletedWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId,
    planCycleId: activePlan.id,
    id: "99999999-9999-4999-8999-000000000605",
    review: deletedReview,
  });
  const payload = buildActivePlanExportPayload({
    planCycle: activePlan,
    workouts: exportedWorkouts,
    exportedAt: "2026-06-12T12:00:00.000Z",
  });

  assert.equal(payload.plan.sourceKind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(payload.plan.sourceStatus, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
  assert.notEqual(payload.plan.planId, activePlan.id);
  assertNoUuid(payload.plan.planId, "manual export safe plan id");
  assert.equal(payload.summary.dayCount, 3);
  assert.equal(payload.summary.workoutCount, 3);
  assert.equal(payload.summary.weeksCount, 1);
  assert.deepEqual(
    payload.workouts.map((workout) => workout.date),
    ["2026-06-18", "2026-06-20", "2026-06-22"],
  );
  assert.equal(
    payload.workouts.some((workout) => workout.date === deletedWorkout.workout_date),
    false,
    "manual export should omit deleted/cleared workouts because it uses persisted active rows",
  );

  const exportedPlan = activePlanExportToTrainingPlanV2(payload);
  const parsedExport = importedPlanSchema.parse(exportedPlan);

  assert.equal(parsedExport.schema_version, "training-plan-v2");
  assert.equal(parsedExport.source_kind, MANUAL_USER_BUILT_PLAN_SOURCE_KIND);
  assert.equal(parsedExport.source_status, MANUAL_USER_BUILT_PLAN_SOURCE_STATUS);
  assert.equal(parsedExport.export_metadata?.export_format_version, "hito_active_plan_export_v1");
  assert.equal(parsedExport.export_metadata?.row_counts?.day_count, 3);
  assert.equal(parsedExport.export_metadata?.row_counts?.workout_count, 3);
  assert.equal(parsedExport.export_metadata?.privacy?.internal_database_ids_omitted, true);
  assert.equal(parsedExport.planned_workouts.length, 3);
  assert.equal(
    parsedExport.planned_workouts.some((workout) => workout.date === deletedWorkout.workout_date),
    false,
    "manual JSON export should not resurrect a deleted workout",
  );

  for (const workout of parsedExport.planned_workouts) {
    assert.ok(workout.workout_id.startsWith("manual-"), "manual workout ids should be source ids.");
    assert.ok(workout.weekday, `${workout.workout_id} should preserve weekday truth.`);
    assert.ok(workout.workout_identity, `${workout.workout_id} should preserve identity.`);
    assert.equal(workout.metric_mode?.executable_mode, "structure_only_executable");
    assert.ok(workout.segments.length > 0, `${workout.workout_id} should export segments.`);

    for (const segment of workout.segments) {
      assert.ok(segment.prescription, `${workout.workout_id} segment should have prescription.`);
      assert.notEqual(
        segment.prescription?.mode,
        "none",
        `${workout.workout_id} non-rest segment should remain executable.`,
      );
    }
  }

  const json = renderPlanExportJson(payload);
  const markdown = renderPlanExportMarkdown(payload);

  assert.doesNotThrow(() => importedPlanSchema.parse(JSON.parse(json)));
  assertNoPrivateManualExportData(json, userId, activePlan, exportedWorkouts, "manual JSON export");
  assertNoFakePaceOrHrInSerialized(json, "manual JSON export");
  assert.match(json, /"source_status": "manual_user_built_plan_created"/);
  assert.match(json, /"export_format_version": "hito_active_plan_export_v1"/);

  assert.match(markdown, /First manual easy run/);
  assert.match(markdown, /Saved steady template/);
  assert.match(markdown, /Copied strides workout/);
  assert.doesNotMatch(markdown, /Deleted long run/);
  assert.match(
    markdown,
    /Executable duration, distance, repeat, work, or recovery structure; no pace or personal HR target\./,
  );
  assert.doesNotMatch(markdown, /manual_user_built_plan_v1|manual_workout_authoring_v1/);
  assertNoPrivateManualExportData(
    markdown,
    userId,
    activePlan,
    exportedWorkouts,
    "manual Markdown export",
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

  if (!result.ok) {
    throw new Error(`${label} unexpectedly rejected.`);
  }

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

function assertNoFakePaceOrHrInSerialized(value: unknown, label: string) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(
    serialized,
    /paceMinPerKmRange|pace_min_per_km_range|"pace"/i,
    `${label} should not include fake pace truth.`,
  );
  assert.doesNotMatch(
    serialized,
    /personal_hr_zone|hrBpmRange|hr_bpm_range/i,
    `${label} should not include fake personal HR truth.`,
  );
}

function assertNoPrivateManualExportData(
  serialized: string,
  userId: string,
  activePlan: PersistedPlanCycleRow,
  exportedWorkouts: PersistedPlannedWorkoutRow[],
  label: string,
) {
  assert.doesNotMatch(serialized, new RegExp(escapeRegExp(userId)), `${label} leaked user id.`);
  assert.doesNotMatch(
    serialized,
    new RegExp(escapeRegExp(activePlan.id)),
    `${label} leaked internal plan id.`,
  );

  for (const workout of exportedWorkouts) {
    assert.doesNotMatch(
      serialized,
      new RegExp(escapeRegExp(workout.id)),
      `${label} leaked internal workout id ${workout.id}.`,
    );
  }

  assert.doesNotMatch(serialized, /supabase\.co|service_role|anon[_-]?key|access_token/i);
}

function assertNoUuid(value: string, label: string) {
  assert.doesNotMatch(
    value,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
    `${label} should not expose a raw UUID.`,
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}
