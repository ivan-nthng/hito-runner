import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  reviewManualWorkoutDraft,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../src/lib/manual-workout-authoring";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "../src/lib/manual-workout-authoring/copy-paste-reconstruction";
import { AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES } from "../src/lib/ai-authored-plan-first-provider-contract";
import type { PersistedPlannedWorkoutRow } from "../src/lib/active-plan-persistence";
import {
  isContentCopyableCalendarWorkoutSourceKind,
  isEditableCalendarWorkoutSourceKind,
  resolveCalendarWorkoutEditability,
} from "../src/lib/active-plan-workout-editing/policy";
import { addDaysIso, todayIso, type Step } from "../src/lib/training";
import {
  canonicalFamilyToLegacyWorkoutType,
  resolveCanonicalWorkoutModel,
} from "../src/lib/rich-workout-model";
import { AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE } from "../src/lib/workout-document";
import { formatReadableDate } from "../src/components/manual-workout/manual-workout-authoring-utils";
import {
  buildSkippedDisposablePersistenceResult,
  formatDisposablePersistenceBlocker,
} from "./lib/qa-pool-persistence-proof";
import {
  readManualPersistenceCliOptions,
  resolveManualPersistencePreflight,
  validateManualWorkoutDisposablePersistenceProof,
} from "./manual-workout-authoring/persistence-proof";
import { validateStandaloneManualCalendarAddContract } from "./manual-workout-authoring/active-plan-add-proof";
import { validateManualConstructorSegmentTargetContract } from "./manual-workout-authoring/constructor-contract-proof";
import { validateManualConstructorDndContract } from "./manual-workout-authoring/constructor-dnd-contract-proof";
import { validateManualCopyPasteContract } from "./manual-workout-authoring/copy-paste-proof";
import { validateManualDeleteClearContract } from "./manual-workout-authoring/delete-clear-proof";
import { validateManualActivePlanExportContract } from "./manual-workout-authoring/export-proof";
import { validateManualMoveWorkoutContract } from "./manual-workout-authoring/move-proof";
import {
  assertNoFakePaceOrHr,
  assertRepeatWithRecovery,
  flattenSteps,
  formatJsonResult,
  hasExecutableStructure,
  readStepsForAssertion,
} from "./manual-workout-authoring/move-proof-assertions";
import { validateManualPersistedTodayAndFutureWorkoutEditContract } from "./manual-workout-authoring/persisted-edit-proof";
import { validateManualSavedTemplateContract } from "./manual-workout-authoring/saved-template-proof";
import { validateManualSourceEditingCapabilityReadback } from "./manual-workout-authoring/source-capability-proof";
import { validateManualTemplateDefaultSkeletons } from "./manual-workout-authoring/template-defaults-proof";
import { validateManualWorkoutTemplateCatalogContract } from "./manual-workout-authoring/template-catalog-proof";
import {
  assertReady,
  buildOrderedRepeatDraftInput,
  buildFakePlanCycle,
  buildFakePlannedWorkout,
  buildFakePlannedWorkoutFromReview,
} from "./manual-workout-authoring/move-proof-fixtures";
import { validateManualLongRunExecutionPolicyContract } from "./long-run-execution-policy-proof";

async function main() {
  const options = readManualPersistenceCliOptions();
  await validateStandaloneCalendarSourceBoundary();
  validateManualLongRunExecutionPolicyContract();
  validateAcceptedFixtures();
  validateManualTitleDurationContract();
  validateManualUserEnteredTargetFixtures();
  validateOrderedRepeatChildrenRoundtrip();
  validateRejectedFixtures();
  validateManualConstructorSegmentTargetContract();
  validateManualConstructorDndContract();
  validateManualTemplateDefaultSkeletons();
  await validateManualWorkoutTemplateCatalogContract();
  validateManualDateOnlyLabels();
  validateCalendarWorkoutContentEditabilityPolicy();
  validateClosedAiPersistedEditorIdentitySet();
  validateAiAuthoredOrderedRepeatRoleRoundtrip();
  validateManualSourceEditingCapabilityReadback();
  await validateManualSavedTemplateContract();
  await validateStandaloneManualCalendarAddContract();
  await validateManualCopyPasteContract();
  await validateManualDeleteClearContract();
  await validateManualMoveWorkoutContract();
  await validateManualPersistedTodayAndFutureWorkoutEditContract();
  validateManualActivePlanExportContract();

  const persistenceInput: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: addDaysIso(todayIso(), 1),
    notes: "Keep it easy.",
  };
  const persistenceReview = assertReady("manual disposable persistence review", persistenceInput);
  const persistencePreflight = resolveManualPersistencePreflight(options);

  if (!persistencePreflight.shouldRun && options.requirePersistence) {
    throw new Error(
      formatDisposablePersistenceBlocker(
        "Manual workout confirm persistence proof",
        persistencePreflight,
      ),
    );
  }

  const persistenceProof = persistencePreflight.shouldRun
    ? await validateManualWorkoutDisposablePersistenceProof({
        input: persistenceInput,
        review: persistenceReview,
        preflight: persistencePreflight,
      })
    : buildSkippedDisposablePersistenceResult(persistencePreflight);
  console.log("Manual workout authoring review contract invariants passed.", {
    persistence: persistenceProof,
  });
}

async function validateStandaloneCalendarSourceBoundary() {
  const root = new URL("../", import.meta.url);
  const [
    retirementMigration,
    overflowMigration,
    occupiedUndoMigration,
    persistence,
    trainingApi,
    databaseTypes,
  ] = await Promise.all([
    readFile(
      new URL(
        "../supabase/migrations/20260810132840_retire_active_plan_calendar_authority.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../supabase/migrations/20260811125538_clear_calendar_future_workouts.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../supabase/migrations/20260816171845_occupied_move_replace_durable_undo.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../src/lib/active-plan-persistence.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/training-api.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/supabase/database.ts", import.meta.url), "utf8"),
  ]);
  const [sourceCapabilities, calendarOverflowActions, planExport, planExportRoute] =
    await Promise.all([
      readFile(
        new URL("../src/lib/active-plan-workout-editing/source-capabilities.ts", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../src/lib/calendar-overflow-actions.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/lib/plan-export.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/routes/api.plan.export.tsx", import.meta.url), "utf8"),
    ]);

  for (const path of [
    "src/lib/active-plan-lifecycle-actions.ts",
    "src/lib/active-plan-schedule-edit-contract.ts",
    "src/lib/active-plan-schedule-edit-preview.ts",
    "src/lib/active-plan-transition-actions.ts",
    "src/lib/active-plan-replacement-carry-forward.ts",
    "src/lib/plan-replacement-actions.ts",
  ]) {
    await assert.rejects(access(new URL(path, root)), undefined, `${path} must stay deleted`);
  }

  assert.match(
    retirementMigration,
    /update public\.plan_cycles[\s\S]*status = 'archived'[\s\S]*status = 'active'/,
  );
  assert.match(retirementMigration, /alter column status set default 'archived'/);
  assert.match(
    retirementMigration,
    /drop index if exists public\.plan_cycles_one_active_per_user_idx/,
  );
  assert.match(
    retirementMigration,
    /drop function if exists public\.apply_active_plan_schedule_reflow/,
  );
  assert.match(retirementMigration, /rename to apply_calendar_workout_mutation/);
  assert.match(retirementMigration, /rename to apply_calendar_workout_content_edit/);
  assert.match(
    retirementMigration,
    /create function public\.apply_reviewed_future_schedule_persistence/,
  );
  assert.match(
    overflowMigration,
    /create or replace function public\.clear_calendar_future_workouts/,
  );
  assert.match(overflowMigration, /pg_advisory_xact_lock/);
  assert.match(overflowMigration, /protected_future_schedule/);
  assert.match(
    overflowMigration,
    /revoke execute[\s\S]*from public, anon, authenticated;[\s\S]*grant execute[\s\S]*to service_role;/,
  );
  assert.match(
    occupiedUndoMigration,
    /create or replace function public\.apply_calendar_workout_mutation/,
  );
  assert.match(occupiedUndoMigration, /jsonb_typeof\(displaced_workout\) = 'object'/);
  assert.match(
    occupiedUndoMigration,
    /v_restore := to_jsonb\(v_target\);\s+v_undo_expires_at := clock_timestamp\(\) \+ interval '45 seconds';/,
  );
  assert.match(occupiedUndoMigration, /\(v_restore->>'workout_type'\)::public\.workout_type/);
  assert.doesNotMatch(
    occupiedUndoMigration,
    /displaced_workout->>'workout_type' = 'rest'|if v_target\.workout_type = 'rest'/,
  );
  assert.doesNotMatch(occupiedUndoMigration, /create table|alter table|create policy/i);
  assert.match(
    occupiedUndoMigration,
    /revoke execute[\s\S]*from public, anon, authenticated;[\s\S]*grant execute[\s\S]*to service_role;/,
  );

  assert.doesNotMatch(persistence, /export async function getActivePlan/);
  assert.doesNotMatch(persistence, /getExistingPlanContext|replaceActivePlan|carry.forward/i);
  assert.doesNotMatch(
    persistence,
    /getLatestMaterializedPlanProvenance|getMaterializedPlanProvenancesForUser|getPlanWorkouts/,
  );
  assert.match(persistence, /getSourcePlanProvenancesForUser/);
  assert.match(persistence, /sourcePlansById/);
  assert.doesNotMatch(trainingApi, /clearUpcomingSchedule|previewActivePlan|ScheduleReflow/);
  assert.doesNotMatch(
    trainingApi,
    /getLatestMaterializedPlanProvenance|getMaterializedPlanProvenancesForUser|getResolvedPlanWorkoutsWithLogs/,
  );
  assert.match(trainingApi, /getCalendarWorkoutsWithLogsForUser/);
  assert.match(trainingApi, /calendarContext:\s*\{/);
  assert.match(trainingApi, /planMeta:\s*null/);
  assert.match(databaseTypes, /apply_calendar_workout_mutation/);
  assert.match(databaseTypes, /apply_reviewed_future_schedule_persistence/);
  assert.doesNotMatch(databaseTypes, /apply_active_plan_workout|apply_active_plan_schedule_reflow/);
  assert.match(sourceCapabilities, /provenancePlan/);
  assert.doesNotMatch(sourceCapabilities, /provenancePlan\.status|status === "active"/);
  assert.match(calendarOverflowActions, /validateImportedPlanJson/);
  assert.match(calendarOverflowActions, /retainImportedPlanCandidateForUser/);
  assert.match(calendarOverflowActions, /getRunnerCalendarDateForUserId/);
  assert.match(calendarOverflowActions, /clearAtomicCalendarFutureWorkouts/);
  assert.match(calendarOverflowActions, /buildCalendarWorkoutExportPayload/);
  assert.doesNotMatch(
    calendarOverflowActions,
    /getMaterializedPlanProvenancesForUser|buildFutureCalendarExportProvenance/,
  );
  assert.match(calendarOverflowActions, /z\.literal\("delete_future_workouts"\)/);
  assert.match(calendarOverflowActions, /z\.literal\("start_new_plan"\)/);
  assert.doesNotMatch(calendarOverflowActions, /status:\s*["']active["']/);
  assert.match(planExport, /hito_calendar_workout_export_v1/);
  assert.match(planExportRoute, /scope:\s*z\.literal\("future-calendar"\)/);
}

function validateManualDateOnlyLabels() {
  assert.equal(
    formatReadableDate("2026-06-14"),
    "Sun, Jun 14",
    "manual date-only labels must not drift through UTC timezone conversion",
  );
}

function validateManualTitleDurationContract() {
  const input: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    title: "70 min easy aerobic run",
    entries: [
      {
        kind: "block",
        block: { blockKey: "easy_run_block", durationSeconds: 70 * 60, label: "Easy run" },
      },
    ],
  };
  const exact = reviewManualWorkoutDraft(input);
  assert.equal(exact.ok, true, exact.ok ? "" : formatJsonResult(exact));

  const mismatch = reviewManualWorkoutDraft({ ...input, title: "60 min easy aerobic run" });
  assert.equal(mismatch.ok, false);
  if (!mismatch.ok) {
    assert.equal(mismatch.reason, "unsafe_block_structure");
    assert.ok(mismatch.issues.some((issue) => issue.path?.[0] === "title"));
  }
}

function validateCalendarWorkoutContentEditabilityPolicy() {
  const userId = "00000000-0000-4000-8000-000000000010";
  const lifecycleEditableSources = [
    MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    "ai_authored_plan_first_v1",
    "training_plan_v2_import",
  ];

  for (const sourceKind of lifecycleEditableSources) {
    const activePlan = buildFakePlanCycle({
      userId,
      id: "00000000-0000-4000-8000-000000000011",
      sourceKind,
      startDate: "2026-06-16",
      endDate: "2026-06-30",
    });

    assert.equal(
      isEditableCalendarWorkoutSourceKind(sourceKind),
      true,
      `${sourceKind} should remain editable provenance for a runner-owned workout`,
    );

    for (const operation of ["add_workout", "clear_workout", "move_workout"] as const) {
      const editability = resolveCalendarWorkoutEditability(activePlan, operation);
      assert.equal(editability.ok, true, `${sourceKind} ${operation} editability should pass.`);
      if (editability.ok) {
        assert.equal(editability.sourceKind, sourceKind);
        assert.equal(editability.operation, operation);
      }
    }

    const copyEditability = resolveCalendarWorkoutEditability(activePlan, "copy_workout");
    const contentEditability = resolveCalendarWorkoutEditability(activePlan, "edit_workout");
    assert.equal(
      copyEditability.ok,
      true,
      `${sourceKind} copy_workout editability should reach persisted reconstruction guards.`,
    );
    assert.equal(isContentCopyableCalendarWorkoutSourceKind(sourceKind), true);
    assert.equal(
      contentEditability.ok,
      true,
      `${sourceKind} edit_workout editability should not depend on plan origin.`,
    );
  }

  assert.equal(
    isEditableCalendarWorkoutSourceKind("external_partner_import"),
    true,
    "plan origin is provenance and must not gate materialized workout actions",
  );
  assert.equal(
    isContentCopyableCalendarWorkoutSourceKind("external_partner_import"),
    true,
    "every persisted non-Rest prescription remains copyable across plan origins",
  );

  const unknownPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000012",
    sourceKind: "legacy_unreviewed_plan_v0",
    startDate: "2026-06-16",
    endDate: "2026-06-30",
  });
  const unknown = resolveCalendarWorkoutEditability(unknownPlan, "add_workout");
  assert.equal(unknown.ok, true, "unknown saved-plan provenance must not govern calendar actions");
  assert.equal(
    resolveCalendarWorkoutEditability(unknownPlan, "edit_workout").ok,
    true,
    "confirmed workout content editing should not inherit lifecycle source allowlists",
  );

  const noSourceArtifact = resolveCalendarWorkoutEditability(null, "add_workout");
  assert.equal(
    noSourceArtifact.ok,
    true,
    "a direct runner-owned Calendar workout must not require a source artifact",
  );
  if (noSourceArtifact.ok) {
    assert.equal(noSourceArtifact.sourceKind, "runner_owned_calendar_workout");
    assert.equal(noSourceArtifact.sourceStatus, null);
  }
}

function validateClosedAiPersistedEditorIdentitySet() {
  for (const [index, workoutIdentity] of AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES.entries()) {
    const model = resolveCanonicalWorkoutModel({
      workoutType: "quality",
      sourceWorkoutType: workoutIdentity,
      workoutIdentity,
      title: workoutIdentity,
      steps: [],
    });
    const workout = buildFakePlannedWorkout({
      userId: "00000000-0000-4000-8000-000000000041",
      planCycleId: "00000000-0000-4000-8000-000000000042",
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      date: "2026-07-22",
      displayOrder: index,
      title: workoutIdentity,
      workoutType: canonicalFamilyToLegacyWorkoutType(model.workoutFamily, model.workoutIdentity),
      sourceWorkoutType: workoutIdentity,
      workoutFamily: model.workoutFamily,
      workoutIdentity: model.workoutIdentity,
      calendarIconKey: model.calendarIconKey,
      steps: buildClosedIdentityProofSteps(workoutIdentity),
    });
    const reconstructed = buildManualWorkoutDraftInputFromPersistedWorkout(
      workout,
      workout.workout_date,
      {
        activePlanId: workout.plan_cycle_id,
        activePlanSourceKind: "ai_authored_plan_first_v1",
      },
    );
    assert.equal(
      reconstructed.ok,
      true,
      `${workoutIdentity} should reconstruct through the full manual editor contract`,
    );
    if (!reconstructed.ok) continue;

    const reviewed = reviewManualWorkoutDraft(reconstructed.draftInput, {
      allowPreservedAiAuthoredTargets: true,
      allowPersistedTemplateShape: true,
      ...reconstructed.processingOptions,
    });
    assert.equal(reviewed.ok, true, `${workoutIdentity} reconstructed review should pass`);
    if (!reviewed.ok) continue;
    assert.equal(reviewed.draft.workoutIdentity, workoutIdentity);
    assert.equal(
      reviewed.draft.steps[0]?.target?.primary_execution_mode,
      "effort",
      `${workoutIdentity} should retain AI primary execution mode`,
    );
    assert.equal(
      reviewed.draft.steps[0]?.target?.target_source,
      AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
      `${workoutIdentity} should retain AI target provenance`,
    );
  }
}

function buildClosedIdentityProofSteps(
  workoutIdentity: (typeof AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES)[number],
): Step[] {
  const runnable = (sequence: number): Step => ({
    type: "run",
    segment_type: "main",
    sequence,
    label: "AI-authored runnable block",
    prescription: { mode: "time", duration_min: 30 },
    duration_min: 30,
    target: {
      primary_execution_mode: "effort",
      target_source: AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
      intensity: "Easy conversational effort",
    },
  });

  if (workoutIdentity === "progression_run") {
    return [runnable(1), runnable(2)];
  }

  if (
    workoutIdentity === "hike_run_endurance" ||
    workoutIdentity === "mountain_long_run_time_on_feet" ||
    workoutIdentity === "ultra_time_on_feet_durability"
  ) {
    return [
      runnable(1),
      {
        type: "hydration",
        segment_type: "fueling",
        sequence: 2,
        label: "Hydration",
        guidance: "Take water.",
        prescription: { mode: "none" },
      },
      runnable(3),
    ];
  }

  return [runnable(1)];
}

function validateAiAuthoredOrderedRepeatRoleRoundtrip() {
  const model = resolveCanonicalWorkoutModel({
    workoutType: "quality",
    sourceWorkoutType: "time_intervals",
    workoutIdentity: "time_intervals",
    title: "AI-authored ordered repeat",
    steps: [],
  });
  const target = {
    primary_execution_mode: "effort" as const,
    target_source: AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
    intensity: "AI-authored controlled effort",
  };
  const children = [
    { role: "warm_up" as const, label: "Warm-up", duration: 5 },
    { role: "run" as const, label: "Run", duration: 4 },
    { role: "walk" as const, label: "Walk", duration: 1 },
    { role: "work" as const, label: "Work", duration: 3 },
    { role: "recover" as const, label: "Recover", duration: 2 },
    { role: "finish" as const, label: "Finish", duration: 2 },
    { role: "cooldown" as const, label: "Cooldown", duration: 5 },
  ].map((child, index) => ({
    role: child.role,
    label: child.label,
    sequence: index + 1,
    prescription: { mode: "time" as const, duration_min: child.duration },
    target,
  }));
  const workout = buildFakePlannedWorkout({
    userId: "00000000-0000-4000-8000-000000000051",
    planCycleId: "00000000-0000-4000-8000-000000000052",
    id: "00000000-0000-4000-8000-000000000053",
    date: "2026-07-22",
    displayOrder: 1,
    title: "AI-authored ordered repeat",
    workoutType: canonicalFamilyToLegacyWorkoutType(model.workoutFamily, model.workoutIdentity),
    sourceWorkoutType: "time_intervals",
    workoutFamily: model.workoutFamily,
    workoutIdentity: model.workoutIdentity,
    calendarIconKey: model.calendarIconKey,
    steps: [
      {
        type: "intervals",
        segment_type: "interval_block",
        sequence: 1,
        label: "AI-authored ordered repeat",
        prescription: {
          mode: "repeats",
          repeat_count: 2,
          children,
        },
        repeats: 2,
        children: children.map((child) => ({
          type: child.role,
          segment_type: child.role,
          sequence: child.sequence,
          label: child.label,
          prescription: child.prescription,
          duration_min: child.prescription.duration_min,
          target: child.target,
        })),
      },
    ],
  });
  const reconstructed = buildManualWorkoutDraftInputFromPersistedWorkout(
    workout,
    workout.workout_date,
    {
      activePlanId: workout.plan_cycle_id,
      activePlanSourceKind: "ai_authored_plan_first_v1",
    },
  );

  assert.equal(reconstructed.ok, true, "AI ordered Repeat should reconstruct");
  if (!reconstructed.ok) return;

  const reviewed = reviewManualWorkoutDraft(reconstructed.draftInput, {
    allowPreservedAiAuthoredTargets: true,
    allowPersistedTemplateShape: true,
    ...reconstructed.processingOptions,
  });
  assert.equal(reviewed.ok, true, "AI ordered Repeat should pass reconstructed review");
  if (!reviewed.ok) return;

  const repeat = reviewed.draft.steps[0];
  assert.equal(repeat?.target, undefined, "Repeat parent must stay structural");
  assert.deepEqual(
    repeat?.prescription?.children?.map((child) => child.role),
    ["warm_up", "run", "walk", "work", "recover", "finish", "cooldown"],
    "all canonical Repeat child roles must round-trip in order",
  );
  assert.ok(
    repeat?.prescription?.children?.every(
      (child) =>
        child.target?.primary_execution_mode === "effort" &&
        child.target.target_source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
    ),
    "unchanged AI Repeat child targets must retain mode and provenance",
  );
}

function validateAcceptedFixtures() {
  const rest = assertReady("rest day", {
    templateKey: "rest_day",
    workoutDate: "2026-06-15",
  });
  assert.equal(rest.draft.workoutIdentity, "rest_and_recovery");
  assert.equal(rest.draft.steps.length, 0);
  assert.equal(rest.draft.metricMode.executable_mode, "none");

  const easy = assertReady("easy aerobic", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
  });
  assert.equal(easy.draft.workoutIdentity, "easy_aerobic_run");
  assert.equal(easy.draft.metricMode.executable_mode, "structure_only_executable");
  assertNumericStructure(easy.draft.steps, "easy aerobic");
  assertNoFakePaceOrHr(easy.draft.steps, "easy aerobic");

  const longRun = assertReady("long run multi-block", {
    templateKey: "long_aerobic_run",
    workoutDate: "2026-06-21",
    entries: [
      {
        kind: "block",
        block: { blockKey: "warmup_block", durationSeconds: 10 * 60, label: "Opener" },
      },
      {
        kind: "block",
        block: { blockKey: "long_run_body_block", durationSeconds: 75 * 60 },
      },
      {
        kind: "block",
        block: { blockKey: "cooldown_block", durationSeconds: 5 * 60 },
      },
    ],
  });
  assert.equal(longRun.draft.workoutIdentity, "long_aerobic_run");
  assert.equal(longRun.draft.steps.length, 3);
  assert.ok(longRun.draft.totalDurationMin > 60);
  assertNumericStructure(longRun.draft.steps, "long run");

  const intervals = assertReady("interval repeat with recovery", {
    templateKey: "time_intervals",
    workoutDate: "2026-06-18",
  });
  assert.equal(intervals.draft.workoutIdentity, "time_intervals");
  assertRepeatWithRecovery(intervals.draft.steps, "time intervals");

  const hills = assertReady("hill repeat with recovery", {
    templateKey: "uphill_repeats",
    workoutDate: "2026-06-19",
  });
  assert.equal(hills.draft.workoutIdentity, "uphill_repeats");
  assertRepeatWithRecovery(hills.draft.steps, "uphill repeats");

  const runWalk = assertReady("run-walk repeat", {
    templateKey: "run_walk_adaptation",
    workoutDate: "2026-06-17",
  });
  assert.equal(runWalk.draft.workoutIdentity, "recovery_jog");
  assert.ok(
    runWalk.draft.mappingGaps.some((gap) => gap.includes("run_walk_adaptation")),
    "Run-walk accepted fixture should report the canonical identity mapping gap.",
  );
  assertRepeatWithRecovery(runWalk.draft.steps, "run-walk");
}

function validateOrderedRepeatChildrenRoundtrip() {
  const input = buildOrderedRepeatDraftInput("2026-06-18");
  const review = assertReady("ordered 3-child repeat", input);
  const children = assertOrderedRepeatChildren(review.draft.steps, "ordered 3-child repeat");

  assert.deepEqual(
    children.map((child) => child.label),
    ["Settle", "Tempo press", "Float"],
    "ordered 3-child repeat should preserve child order in normalized draft",
  );
  assert.deepEqual(
    children.map((child) => child.type),
    ["run", "work", "recovery"],
    "ordered 3-child repeat should preserve child section roles in normalized draft",
  );
  assertManualUserEnteredTarget(review.draft.steps, "rpe", "ordered child RPE target");

  const persisted = buildFakePlannedWorkoutFromReview({
    userId: "00000000-0000-4000-8000-000000000020",
    planCycleId: "00000000-0000-4000-8000-000000000021",
    id: "00000000-0000-4000-8000-000000000022",
    date: "2026-06-18",
    displayOrder: 1,
    review,
  });
  const reconstructed = buildManualWorkoutDraftInputFromPersistedWorkout(persisted, "2026-06-25", {
    activePlanId: "00000000-0000-4000-8000-000000000021",
    activePlanSourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  });

  assert.equal(reconstructed.ok, true, "ordered repeat should reconstruct from persisted steps");
  if (!reconstructed.ok) {
    throw new Error(`ordered repeat reconstruction failed: ${JSON.stringify(reconstructed)}`);
  }

  const reconstructedRepeat = reconstructed.draftInput.entries?.find(
    (entryValue) => entryValue.kind === "repeat_group",
  );
  assert.equal(
    reconstructedRepeat?.kind,
    "repeat_group",
    "ordered repeat reconstruction should keep repeat entry",
  );
  if (reconstructedRepeat?.kind === "repeat_group") {
    assert.deepEqual(
      reconstructedRepeat.group.children?.map((block) => block.label),
      ["Settle", "Tempo press", "Float"],
      "ordered repeat reconstruction should preserve all child blocks",
    );
  }

  const rereview = assertReady("reconstructed ordered 3-child repeat", reconstructed.draftInput);
  const rereviewChildren = assertOrderedRepeatChildren(
    rereview.draft.steps,
    "reconstructed ordered 3-child repeat",
  );
  assert.deepEqual(
    rereviewChildren.map((child) => child.label),
    ["Settle", "Tempo press", "Float"],
    "reconstructed ordered repeat should review without child loss",
  );
}

function validateManualUserEnteredTargetFixtures() {
  const paceExact = assertReady("runner-entered exact pace", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "easy_run_block",
          durationSeconds: 30 * 60,
          target: { targetSource: "user_entered", pace: "5:20/km" },
        },
      },
    ],
  });
  assert.equal(paceExact.draft.metricMode.executable_mode, "pace_executable");
  assert.equal(paceExact.draft.metricMode.pace_targets_allowed, true);
  assertManualUserEnteredTarget(paceExact.draft.steps, "pace", "runner-entered exact pace");
  assert.equal(
    paceExact.draft.steps.find((step) => step.target?.pace)?.target?.primary_execution_mode,
    "pace",
  );
  assert.equal(
    paceExact.draft.steps.find((step) => step.target?.pace)?.target?.pace,
    "5:20/km",
    "canonical reviewed draft should preserve exact runner-entered pace",
  );

  const paceRange = assertReady("runner-entered pace range", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "easy_run_block",
          durationSeconds: 30 * 60,
          target: { paceMinPerKmRange: "5:10-5:25/km" },
        },
      },
    ],
  });
  assertManualUserEnteredTarget(paceRange.draft.steps, "pace_min_per_km_range", "pace range");

  const hrCap = assertReady("runner-entered HR cap", {
    templateKey: "steady_aerobic_run",
    workoutDate: "2026-06-17",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "steady_run_block",
          durationSeconds: 35 * 60,
          target: { hrBpmCap: 155 },
        },
      },
    ],
  });
  assert.equal(hrCap.draft.metricMode.executable_mode, "hr_executable");
  assert.equal(hrCap.draft.metricMode.hr_targets_allowed, true);
  assert.equal(hrCap.draft.metricMode.hr_target_source, "user_entered");
  assertManualUserEnteredTarget(hrCap.draft.steps, "hr_bpm", "HR cap");
  assert.equal(
    hrCap.draft.steps.find((step) => step.target?.hr_bpm)?.target?.primary_execution_mode,
    "heart_rate",
  );

  const hrRange = assertReady("runner-entered HR range", {
    templateKey: "steady_aerobic_run",
    workoutDate: "2026-06-17",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "steady_run_block",
          durationSeconds: 35 * 60,
          target: { hrTargetSource: "user_entered", hrBpmRange: "145-155 bpm" },
        },
      },
    ],
  });
  assertManualUserEnteredTarget(hrRange.draft.steps, "hr_bpm_range", "HR range");

  const rpeLow = assertReady("runner-entered RPE zero", {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-18",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "easy_run_block",
          durationSeconds: 20 * 60,
          target: { rpe: 0, cue: "Keep this restorative." },
        },
      },
    ],
  });
  assertManualUserEnteredTarget(rpeLow.draft.steps, "rpe", "RPE zero");
  assert.equal(
    rpeLow.draft.steps.find((step) => step.target?.rpe === 0)?.target?.primary_execution_mode,
    "effort",
  );

  const rpeHigh = assertReady("runner-entered RPE ten", {
    templateKey: "controlled_tempo_session",
    workoutDate: "2026-06-18",
    entries: [
      {
        kind: "block",
        block: { blockKey: "warmup_block", durationSeconds: 10 * 60 },
      },
      {
        kind: "repeat_group",
        group: {
          repeatCount: 3,
          safetyKind: "tempo_repeats",
          workBlock: {
            blockKey: "tempo_block",
            durationSeconds: 5 * 60,
            target: { rpe: 10, label: "Runner-entered hard effort" },
          },
          recoveryBlock: { blockKey: "interval_recovery_block", durationSeconds: 2 * 60 },
        },
      },
      {
        kind: "block",
        block: { blockKey: "cooldown_block", durationSeconds: 10 * 60 },
      },
    ],
  });
  assertManualUserEnteredTarget(rpeHigh.draft.steps, "rpe", "RPE ten");
}

function validateRejectedFixtures() {
  assertRejected(
    "nested repeat",
    {
      templateKey: "time_intervals",
      workoutDate: "2026-06-18",
      entries: [
        {
          kind: "repeat_group",
          group: {
            repeatCount: 4,
            safetyKind: "intervals",
            workBlock: { blockKey: "interval_work_block", durationSeconds: 60 },
            recoveryBlock: { blockKey: "interval_recovery_block", durationSeconds: 60 },
            nestedRepeatGroup: { repeatCount: 2 },
          },
        },
      ],
    },
    "nested_repeat_not_supported",
  );

  assertRejected(
    "generated pace source",
    {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-06-16",
      entries: [
        {
          kind: "block",
          block: {
            blockKey: "easy_run_block",
            durationSeconds: 30 * 60,
            target: { paceTargetSource: "hito_generated", paceMinPerKmRange: "5:10-5:25/km" },
          },
        },
      ],
    },
    "unsafe_metric_truth",
  );

  assertRejected(
    "inferred pace source",
    {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-06-16",
      entries: [
        {
          kind: "block",
          block: {
            blockKey: "easy_run_block",
            durationSeconds: 30 * 60,
            target: { paceTargetSource: "inferred", pace: "5:10/km" },
          },
        },
      ],
    },
    "unsafe_metric_truth",
  );

  assertRejected(
    "fake personal HR",
    {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-06-16",
      entries: [
        {
          kind: "block",
          block: {
            blockKey: "easy_run_block",
            durationSeconds: 30 * 60,
            target: { hrTargetSource: "personal_hr_zone", hrBpmRange: "145-155" },
          },
        },
      ],
    },
    "unsafe_metric_truth",
  );

  assertRejected(
    "out of range RPE",
    {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-06-16",
      entries: [
        {
          kind: "block",
          block: {
            blockKey: "easy_run_block",
            durationSeconds: 30 * 60,
            target: { rpe: "11" },
          },
        },
      ],
    },
    "invalid_input",
  );

  assertRejected(
    "unknown manual-only identity",
    {
      templateKey: "manual_only_magic_session",
      workoutDate: "2026-06-16",
    },
    "invalid_input",
  );
}

function assertRejected(
  label: string,
  input: unknown,
  expectedIssueCode: string,
): Extract<ManualWorkoutDraftReviewResult, { ok: false }> {
  const result = reviewManualWorkoutDraft(input);

  assert.equal(result.ok, false, `${label} should be rejected.`);
  assert.equal(result.status, "draft_rejected");
  assert.equal(result.persisted, false);
  assert.ok(
    result.issues.some((issue) => issue.code === expectedIssueCode),
    `${label} should include ${expectedIssueCode}; got ${formatJsonResult(result)}`,
  );

  return result;
}

function assertNumericStructure(steps: Step[], label: string) {
  assert.ok(steps.length > 0, `${label} should have steps.`);

  for (const step of steps) {
    assert.ok(
      hasExecutableStructure(step),
      `${label} step ${step.label ?? step.type} should have numeric executable structure.`,
    );
  }
}

function assertOrderedRepeatChildren(steps: Step[], label: string): Step[] {
  const repeatStep = steps.find((step) => step.repeats);

  assert.ok(repeatStep, `${label} should include a repeat step.`);
  assert.equal(Object.hasOwn(repeatStep, "work"), false, `${label} should not persist work.`);
  assert.equal(
    Object.hasOwn(repeatStep, "recovery"),
    false,
    `${label} should not persist recovery.`,
  );
  assert.equal(
    repeatStep.prescription?.children?.length,
    3,
    `${label} repeat prescription should preserve 3 ordered children.`,
  );
  assert.equal(
    repeatStep.children?.length,
    3,
    `${label} repeat readback should preserve 3 ordered children.`,
  );
  assert.ok(
    repeatStep.children?.every((child) => hasExecutableStructure(child)),
    `${label} repeat children should be numeric.`,
  );

  return repeatStep.children ?? [];
}

function assertCanonicalPersistedStridesShape(
  steps: PersistedPlannedWorkoutRow["steps"],
  label: string,
) {
  assert.ok(Array.isArray(steps), `${label} should store persisted executable steps.`);
  const repeatStep = steps.find(
    (step): step is Step =>
      Boolean(step) &&
      typeof step === "object" &&
      "segment_type" in step &&
      step.segment_type === "strides",
  );

  assert.equal(repeatStep?.segment_type, "strides");
  assert.equal(
    repeatStep?.type,
    "intervals",
    `${label} should preserve canonical imported strides repeat type.`,
  );
  const [workChild, recoveryChild] = repeatStep?.children ?? [];

  assert.equal(
    Object.hasOwn(repeatStep ?? {}, "work"),
    false,
    `${label} should not persist legacy nested work block.`,
  );
  assert.equal(
    workChild?.type,
    "work",
    `${label} persisted strides work block should use canonical child work type.`,
  );
  assert.equal(
    recoveryChild?.type,
    "recovery",
    `${label} persisted strides recovery child should stay canonical.`,
  );
}

function assertManualUserEnteredTarget(
  steps: Step[],
  key: "pace" | "pace_min_per_km_range" | "hr_bpm" | "hr_bpm_range" | "rpe",
  label: string,
) {
  const allTargets = flattenSteps(steps).flatMap((step) => (step.target ? [step.target] : []));
  const target = allTargets.find((candidate) => key in candidate);

  assert.ok(target, `${label} should include ${key}.`);
  assert.equal(
    target.target_source,
    "user_entered",
    `${label} target should preserve user-entered source semantics.`,
  );

  if (key === "hr_bpm" || key === "hr_bpm_range") {
    assert.equal(
      target.hr_target_source,
      "user_entered",
      `${label} HR target should preserve user-entered HR source semantics.`,
    );
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
