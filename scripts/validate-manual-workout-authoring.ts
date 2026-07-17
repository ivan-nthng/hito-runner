import assert from "node:assert/strict";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  reviewManualWorkoutDraft,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../src/lib/manual-workout-authoring";
import { buildManualWorkoutDraftInputFromPersistedWorkout } from "../src/lib/manual-workout-authoring/copy-paste-reconstruction";
import type { PersistedPlannedWorkoutRow } from "../src/lib/active-plan-persistence";
import {
  isEditableActivePlanSourceKind,
  isActivePlanWorkoutContentEditableSourceKind,
  isManualContentEditableActivePlanSourceKind,
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
import { validateManualConstructorDndContract } from "./manual-workout-authoring/constructor-dnd-contract-proof";
import { validateManualCopyPasteContract } from "./manual-workout-authoring/copy-paste-proof";
import { validateManualDeleteClearContract } from "./manual-workout-authoring/delete-clear-proof";
import { validateManualEmptyActivePlanCreationContract } from "./manual-workout-authoring/empty-plan-proof";
import { validateManualActivePlanExportContract } from "./manual-workout-authoring/export-proof";
import { validateManualFirstCreateConfirmPersistenceContract } from "./manual-workout-authoring/confirm-persistence-proof";
import { validateManualMoveWorkoutContract } from "./manual-workout-authoring/move-proof";
import {
  assertNoFakePaceOrHr,
  assertRepeatWithRecovery,
  formatJsonResult,
  readStepsForAssertion,
} from "./manual-workout-authoring/move-proof-assertions";
import { validateManualPersistedFutureWorkoutEditContract } from "./manual-workout-authoring/persisted-edit-proof";
import { validateManualSavedTemplateContract } from "./manual-workout-authoring/saved-template-proof";
import { validateManualSourceEditingCapabilityReadback } from "./manual-workout-authoring/source-capability-proof";
import { validateManualTemplateDefaultSkeletons } from "./manual-workout-authoring/template-defaults-proof";
import {
  assertReady,
  buildFakePlanCycle,
  buildFakePlannedWorkoutFromReview,
} from "./manual-workout-authoring/move-proof-fixtures";

async function main() {
  const options = readManualPersistenceCliOptions();
  validateAcceptedFixtures();
  validateManualUserEnteredTargetFixtures();
  validateOrderedRepeatChildrenRoundtrip();
  validateRejectedFixtures();
  validateManualConstructorSegmentTargetContract();
  validateManualConstructorDndContract();
  validateManualTemplateDefaultSkeletons();
  validateManualDateOnlyLabels();
  validateActivePlanLifecycleAndContentEditabilityPolicy();
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

function validateActivePlanLifecycleAndContentEditabilityPolicy() {
  const userId = "00000000-0000-4000-8000-000000000010";
  const lifecycleEditableSources = [
    MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    "structured_authoring_v1",
    "ai_authored_plan_first_v1",
    "training_plan_v2_import",
    "active_plan_refresh_v1",
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

    const copyEditability = resolveActivePlanWorkoutEditability(activePlan, "copy_workout");
    const contentEditability = resolveActivePlanWorkoutEditability(activePlan, "edit_workout");
    const shouldAllowCopy = isManualContentEditableActivePlanSourceKind(sourceKind);
    const shouldAllowContent = isActivePlanWorkoutContentEditableSourceKind(sourceKind, activePlan);

    assert.equal(
      copyEditability.ok,
      shouldAllowCopy,
      `${sourceKind} copy_workout editability should stay manual-content scoped.`,
    );
    assert.equal(
      contentEditability.ok,
      shouldAllowContent,
      `${sourceKind} edit_workout editability should follow reconstructable active-plan source scope.`,
    );
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

function validateOrderedRepeatChildrenRoundtrip() {
  const input: ManualWorkoutDraftInput = {
    templateKey: "controlled_tempo_session",
    workoutDate: "2026-06-18",
    entries: [
      {
        kind: "block",
        block: { blockKey: "warmup_block", durationSeconds: 12 * 60 },
      },
      {
        kind: "repeat_group",
        group: {
          repeatCount: 4,
          safetyKind: "tempo_repeats",
          groupLabel: "Tempo ladder",
          children: [
            { blockKey: "easy_run_block", durationSeconds: 3 * 60, label: "Settle" },
            {
              blockKey: "tempo_block",
              durationSeconds: 2 * 60,
              label: "Tempo press",
              target: { rpe: 7, cue: "Controlled, not all-out." },
            },
            { blockKey: "interval_recovery_block", durationSeconds: 60, label: "Float" },
          ],
        },
      },
      {
        kind: "block",
        block: { blockKey: "cooldown_block", durationSeconds: 10 * 60 },
      },
    ],
  };
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

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
