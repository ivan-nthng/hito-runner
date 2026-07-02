import assert from "node:assert/strict";
import type {
  ManualWorkoutDirectMoveResult,
  ManualWorkoutDraftReviewResult,
  ManualWorkoutMoveConfirmResult,
  ManualWorkoutMoveReviewResult,
} from "../../src/lib/manual-workout-authoring";
import type { PersistedPlannedWorkoutRow } from "../../src/lib/active-plan-persistence";
import type { Step } from "../../src/lib/training";

export function assertMoveReviewBlocked(
  result: ManualWorkoutMoveReviewResult,
  reason: Extract<ManualWorkoutMoveReviewResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatMoveReviewResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

export function assertMoveConfirmBlocked(
  result: ManualWorkoutMoveConfirmResult,
  reason: Extract<ManualWorkoutMoveConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatMoveConfirmResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

export function assertDirectMoveBlocked(
  result: ManualWorkoutDirectMoveResult,
  reason: Extract<ManualWorkoutDirectMoveResult, { ok: false }>["reason"],
  label: string,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${formatDirectMoveResult(result)}`);

  if (!result.ok) {
    assert.equal(result.status, "blocked");
    assert.equal(result.persisted, false);
    assert.equal(result.reason, reason, `${label} should fail with ${reason}.`);
  }
}

export function assertRepeatWithRecovery(steps: Step[], label: string) {
  const repeatStep = steps.find((step) => step.repeats);

  assert.ok(repeatStep, `${label} should include a repeat step.`);
  assert.ok(repeatStep.repeats && repeatStep.repeats >= 2);
  assert.equal(Object.hasOwn(repeatStep, "work"), false, `${label} must not persist work.`);
  assert.equal(Object.hasOwn(repeatStep, "recovery"), false, `${label} must not persist recovery.`);
  assert.ok(repeatStep.children?.length, `${label} repeat should include ordered children.`);
  assert.ok(
    repeatStep.children.every((child) => hasExecutableStructure(child)),
    `${label} repeat children should be numeric.`,
  );
}

export function assertNoFakePaceOrHr(steps: Step[], label: string) {
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

export function readStepsForAssertion(value: PersistedPlannedWorkoutRow["steps"]): Step[] {
  return Array.isArray(value) ? (value as Step[]) : [];
}

export function formatResult(result: ManualWorkoutDraftReviewResult) {
  return JSON.stringify(result, null, 2);
}

export function formatMoveReviewResult(result: ManualWorkoutMoveReviewResult) {
  return JSON.stringify(result, null, 2);
}

export function formatMoveConfirmResult(result: ManualWorkoutMoveConfirmResult) {
  return JSON.stringify(result, null, 2);
}

export function formatDirectMoveResult(result: ManualWorkoutDirectMoveResult) {
  return JSON.stringify(result, null, 2);
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
