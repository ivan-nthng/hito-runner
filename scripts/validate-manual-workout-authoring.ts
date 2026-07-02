import assert from "node:assert/strict";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  addManualWorkoutToActivePlanForUser,
  reviewManualWorkoutDraft,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../src/lib/manual-workout-authoring";
import type {
  ExistingPlanContext,
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../src/lib/active-plan-persistence";
import {
  isEditableActivePlanSourceKind,
  resolveActivePlanWorkoutEditability,
} from "../src/lib/active-plan-workout-editing/policy";
import type { Step } from "../src/lib/training";
import { formatReadableDate } from "../src/components/manual-workout/manual-workout-authoring-utils";
import {
  buildSkippedManualPersistenceResult,
  formatManualPersistenceBlocker,
  readManualPersistenceCliOptions,
  resolveManualPersistencePreflight,
  validateManualWorkoutDisposablePersistenceProof,
} from "./manual-workout-authoring/persistence-proof";
import { validateManualActivePlanAddWorkoutContract } from "./manual-workout-authoring/active-plan-add-proof";
import { validateManualConstructorSegmentTargetContract } from "./manual-workout-authoring/constructor-contract-proof";
import { validateManualCopyPasteContract } from "./manual-workout-authoring/copy-paste-proof";
import { validateManualDeleteClearContract } from "./manual-workout-authoring/delete-clear-proof";
import { validateManualEmptyActivePlanCreationContract } from "./manual-workout-authoring/empty-plan-proof";
import { validateManualActivePlanExportContract } from "./manual-workout-authoring/export-proof";
import { validateManualFirstCreateConfirmPersistenceContract } from "./manual-workout-authoring/confirm-persistence-proof";
import { validateManualMoveWorkoutContract } from "./manual-workout-authoring/move-proof";
import { validateManualPersistedFutureWorkoutEditContract } from "./manual-workout-authoring/persisted-edit-proof";
import { validateManualSavedTemplateContract } from "./manual-workout-authoring/saved-template-proof";
import { validateManualSourceEditingCapabilityReadback } from "./manual-workout-authoring/source-capability-proof";
import { validateManualTemplateDefaultSkeletons } from "./manual-workout-authoring/template-defaults-proof";

async function main() {
  const options = readManualPersistenceCliOptions();
  validateAcceptedFixtures();
  validateManualUserEnteredTargetFixtures();
  validateRejectedFixtures();
  validateManualConstructorSegmentTargetContract();
  validateManualTemplateDefaultSkeletons();
  validateManualDateOnlyLabels();
  validateUniversalActivePlanEditabilityPolicy();
  validateManualSourceEditingCapabilityReadback();
  await validateManualSavedTemplateContract();
  await validateManualEmptyActivePlanCreationContract();
  await validateManualFirstCreateConfirmPersistenceContract();
  await validateManualActivePlanAddWorkoutContract();
  await validateManualCopyPasteContract();
  await validateManualDeleteClearContract();
  await validateManualMoveWorkoutContract();
  await validateManualPersistedFutureWorkoutEditContract();
  validateManualActivePlanExportContract();

  const persistenceInput: ManualWorkoutDraftInput = {
    templateKey: "easy_aerobic_run",
    workoutDate: "2026-06-16",
    notes: "Keep it easy.",
  };
  const persistenceReview = assertReady("manual disposable persistence review", persistenceInput);
  const persistencePreflight = resolveManualPersistencePreflight(options);

  if (!persistencePreflight.shouldRun && options.requirePersistence) {
    throw new Error(formatManualPersistenceBlocker(persistencePreflight));
  }

  const persistenceProof = persistencePreflight.shouldRun
    ? await validateManualWorkoutDisposablePersistenceProof({
        input: persistenceInput,
        review: persistenceReview,
        preflight: persistencePreflight,
      })
    : buildSkippedManualPersistenceResult(persistencePreflight);

  console.log("Manual workout authoring review contract invariants passed.", {
    persistence: persistenceProof,
  });
}

function validateManualDateOnlyLabels() {
  assert.equal(
    formatReadableDate("2026-06-14"),
    "Sun, Jun 14",
    "manual date-only labels must not drift through UTC timezone conversion",
  );
}

function validateUniversalActivePlanEditabilityPolicy() {
  const userId = "00000000-0000-4000-8000-000000000010";
  const editableSources = [
    MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    "structured_authoring_v1",
    "ai_first_plan_blueprint_v1",
    "ai_first_plan_envelope_v1",
    "running_plan_engine_10k_builder_v1",
    "running_plan_engine_half_marathon_builder_v1",
    "running_plan_engine_marathon_base_builder_v1",
    "running_plan_engine_marathon_completion_builder_v1",
    "plan_preset_v1",
    "training_plan_v2_import",
    "active_plan_refresh_v1",
  ];

  for (const sourceKind of editableSources) {
    const activePlan = buildFakePlanCycle({
      userId,
      id: "00000000-0000-4000-8000-000000000011",
      sourceKind,
      startDate: "2026-06-16",
      endDate: "2026-06-30",
    });

    assert.equal(
      isEditableActivePlanSourceKind(sourceKind, activePlan),
      true,
      `${sourceKind} should be an editable active-plan source`,
    );

    for (const operation of ["add_workout", "clear_workout", "move_workout"] as const) {
      const editability = resolveActivePlanWorkoutEditability(activePlan, operation);
      assert.equal(editability.ok, true, `${sourceKind} ${operation} editability should pass.`);
      if (editability.ok) {
        assert.equal(editability.sourceKind, sourceKind);
        assert.equal(editability.operation, operation);
      }
    }
  }

  const unknownPlan = buildFakePlanCycle({
    userId,
    id: "00000000-0000-4000-8000-000000000012",
    sourceKind: "legacy_unreviewed_plan_v0",
    startDate: "2026-06-16",
    endDate: "2026-06-30",
  });
  const unknown = resolveActivePlanWorkoutEditability(unknownPlan, "add_workout");
  assert.equal(unknown.ok, false, "unknown active-plan source should stay blocked");
  if (!unknown.ok) {
    assert.equal(unknown.reason, "unsupported_active_plan_source");
  }

  const missingSource = resolveActivePlanWorkoutEditability(
    buildFakePlanCycle({
      userId,
      id: "00000000-0000-4000-8000-000000000013",
      sourceKind: null,
      startDate: "2026-06-16",
      endDate: "2026-06-30",
    }),
    "add_workout",
  );
  assert.equal(missingSource.ok, false, "missing source metadata should stay blocked");
  if (!missingSource.ok) {
    assert.equal(missingSource.reason, "unsupported_source_metadata");
  }
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
    paceExact.constructorContract.timeline[0]?.kind === "segment"
      ? paceExact.constructorContract.timeline[0].target.kind
      : null,
    "pace",
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
    "repeated intensity without recovery",
    {
      templateKey: "time_intervals",
      workoutDate: "2026-06-18",
      entries: [
        {
          kind: "block",
          block: { blockKey: "warmup_block", durationSeconds: 15 * 60 },
        },
        {
          kind: "repeat_group",
          group: {
            repeatCount: 6,
            safetyKind: "intervals",
            workBlock: { blockKey: "interval_work_block", durationSeconds: 2 * 60 },
          },
        },
        {
          kind: "block",
          block: { blockKey: "cooldown_block", durationSeconds: 10 * 60 },
        },
      ],
    },
    "missing_recovery",
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
    "default estimated HR target source",
    {
      templateKey: "easy_aerobic_run",
      workoutDate: "2026-06-16",
      entries: [
        {
          kind: "block",
          block: {
            blockKey: "easy_run_block",
            durationSeconds: 30 * 60,
            target: { hrTargetSource: "default_estimated_hr", hrBpmRange: "145-155" },
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
    `${label} should include ${expectedIssueCode}; got ${formatResult(result)}`,
  );

  return result;
}

type AddDependencies = NonNullable<Parameters<typeof addManualWorkoutToActivePlanForUser>[2]>;

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

function buildFakeAddDependencies(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  persistError?: Error;
  onPersist?: (record: {
    workoutSeed: Parameters<NonNullable<AddDependencies["persistWorkoutAdd"]>>[0]["workoutSeed"];
    reviewMetadata: Parameters<
      NonNullable<AddDependencies["persistWorkoutAdd"]>
    >[0]["reviewMetadata"];
  }) => void;
}): AddDependencies {
  return {
    currentDate: "2026-06-10",
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
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.({
        workoutSeed: record.workoutSeed,
        reviewMetadata: record.reviewMetadata,
      });

      return {
        plannedWorkout: buildFakePlannedWorkout({
          userId: record.userId,
          planCycleId: record.activePlan.id,
          id: "66666666-6666-4666-8666-666666666666",
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

function buildFakePlannedWorkoutFromReview({
  userId,
  planCycleId,
  id,
  date,
  displayOrder,
  review,
  weekday,
}: {
  userId: string;
  planCycleId: string;
  id: string;
  date: string;
  displayOrder: number;
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
  weekday?: string;
}): PersistedPlannedWorkoutRow {
  return buildFakePlannedWorkout({
    userId,
    planCycleId,
    id,
    date,
    displayOrder,
    title: review.draft.title,
    notes: review.draft.notes,
    weekday: weekday ?? review.draft.weekday,
    workoutType: review.draft.workoutType,
    sourceWorkoutType: review.draft.sourceWorkoutType,
    workoutFamily: review.draft.workoutFamily,
    workoutIdentity: review.draft.workoutIdentity,
    calendarIconKey: review.draft.calendarIconKey,
    metricMode: cloneJson(review.draft.metricMode) as PersistedPlannedWorkoutRow["metric_mode"],
    steps: cloneJson(review.draft.steps) as PersistedPlannedWorkoutRow["steps"],
  });
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

function assertNumericStructure(steps: Step[], label: string) {
  assert.ok(steps.length > 0, `${label} should have steps.`);

  for (const step of steps) {
    assert.ok(
      hasExecutableStructure(step),
      `${label} step ${step.label ?? step.type} should have numeric executable structure.`,
    );
  }
}

function assertRepeatWithRecovery(steps: Step[], label: string) {
  const repeatStep = steps.find((step) => step.repeats);

  assert.ok(repeatStep, `${label} should include a repeat step.`);
  assert.ok(repeatStep.repeats && repeatStep.repeats >= 2);
  assert.equal(Object.hasOwn(repeatStep, "work"), false, `${label} should not persist work.`);
  assert.equal(
    Object.hasOwn(repeatStep, "recovery"),
    false,
    `${label} should not persist recovery.`,
  );
  assert.ok(repeatStep.children?.length, `${label} repeat should include ordered children.`);
  assert.ok(
    repeatStep.children.every((child) => hasExecutableStructure(child)),
    `${label} repeat children should be numeric.`,
  );
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

function assertNoFakePaceOrHr(steps: Step[], label: string) {
  const allTargets = flattenSteps(steps).flatMap((step) => (step.target ? [step.target] : []));

  for (const target of allTargets) {
    assert.equal("pace" in target, false, `${label} should not include pace.`);
    assert.equal(
      "pace_min_per_km_range" in target,
      false,
      `${label} should not include pace range.`,
    );
    assert.equal("hr_bpm_range" in target, false, `${label} should not include HR range.`);
    assert.notEqual(
      target.hr_target_source,
      "personal_hr_zone",
      `${label} should not include personal HR-zone truth.`,
    );
  }
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

function hasExecutableStructure(step: Step) {
  if (step.duration_min || step.distance_km) {
    return true;
  }

  if (step.repeats && step.children?.length) {
    return step.children.every((child) => hasExecutableStructure(child));
  }

  return false;
}

function flattenSteps(steps: Step[]): Step[] {
  return steps.flatMap((step) => [step, ...(step.children ? flattenSteps(step.children) : [])]);
}

function readStepsForAssertion(value: PersistedPlannedWorkoutRow["steps"]): Step[] {
  return Array.isArray(value) ? (value as Step[]) : [];
}

function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
