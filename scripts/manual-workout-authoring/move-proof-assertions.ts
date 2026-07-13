import assert from "node:assert/strict";
import type {
  ManualWorkoutDirectMoveResult,
  ManualWorkoutDraftReviewResult,
  ManualWorkoutMoveConfirmResult,
  ManualWorkoutMoveReviewResult,
} from "../../src/lib/manual-workout-authoring";
import type { PersistedPlannedWorkoutRow } from "../../src/lib/active-plan-persistence";
import type { Step } from "../../src/lib/training";

export function assertManualBlockedResult<Result extends { ok: boolean }, Reason extends string>(
  result: Result,
  reason: Reason,
  label: string,
  format: (result: Result) => string = formatJsonResult,
) {
  assert.equal(result.ok, false, `${label} should be blocked: ${format(result)}`);

  if (!result.ok) {
    const blocked = result as Result & {
      status: string;
      persisted: boolean;
      reason: Reason;
    };

    assert.equal(blocked.status, "blocked");
    assert.equal(blocked.persisted, false);
    assert.equal(blocked.reason, reason, `${label} should fail with ${reason}.`);
  }
}

export function assertMoveReviewBlocked(
  result: ManualWorkoutMoveReviewResult,
  reason: Extract<ManualWorkoutMoveReviewResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label, formatMoveReviewResult);
}

export function assertMoveConfirmBlocked(
  result: ManualWorkoutMoveConfirmResult,
  reason: Extract<ManualWorkoutMoveConfirmResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label, formatMoveConfirmResult);
}

export function assertDirectMoveBlocked(
  result: ManualWorkoutDirectMoveResult,
  reason: Extract<ManualWorkoutDirectMoveResult, { ok: false }>["reason"],
  label: string,
) {
  assertManualBlockedResult(result, reason, label, formatDirectMoveResult);
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
  return formatJsonResult(result);
}

export function formatMoveReviewResult(result: ManualWorkoutMoveReviewResult) {
  return formatJsonResult(result);
}

export function formatMoveConfirmResult(result: ManualWorkoutMoveConfirmResult) {
  return formatJsonResult(result);
}

export function formatDirectMoveResult(result: ManualWorkoutDirectMoveResult) {
  return formatJsonResult(result);
}

export function formatJsonResult(result: unknown) {
  return JSON.stringify(result, null, 2);
}

export function assertNoFakePaceOrHrInSerialized(value: unknown, label: string) {
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
