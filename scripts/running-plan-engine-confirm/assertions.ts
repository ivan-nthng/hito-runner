import assert from "node:assert/strict";

import {
  collectSelectedDistanceEndpointIssues,
  selectedDistanceEndpointMainDistanceMeters,
} from "../../src/lib/plan-creation-engine";
import type {
  buildRunningPlanCanonicalPlan,
  RunningPlanPreviewDraft,
} from "../../src/lib/running-plan-engine-review";
import type { Database } from "../../src/lib/supabase/database";

type CanonicalRunningPlanRow = ReturnType<
  typeof buildRunningPlanCanonicalPlan
>["planned_workouts"][number];
type PersistedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];

export function validateCanonicalRowsAreNumeric(
  rows: readonly CanonicalRunningPlanRow[],
  options: { expectedMode: "structure_only" | "mixed" } = { expectedMode: "structure_only" },
) {
  for (const row of rows) {
    if (row.workout_type === "rest") continue;

    assert.ok(row.segments.length > 0, `${row.workout_id} must have segments.`);
    assert.ok(row.metric_mode, `${row.workout_id} must have metric mode.`);
    if (options.expectedMode === "structure_only" || !rowHasPaceTargets(row)) {
      assert.ok(
        ["structure_only_executable", "hr_executable"].includes(
          row.metric_mode?.executable_mode ?? "",
        ),
      );
      assert.equal(row.metric_mode?.pace_targets_allowed, false);
    }
    assert.equal(row.metric_mode?.hr_targets_allowed, rowHasHeartRateTargets(row));

    for (const segment of row.segments) {
      assert.ok(segment.prescription, `${row.workout_id}.${segment.segment_type} lacks structure.`);
      assert.notEqual(
        segment.prescription?.mode,
        "none",
        `${row.workout_id}.${segment.segment_type} must not be vague/none.`,
      );
    }
  }
}

export function validateAiAuthoredPaceAndEffectiveHrGuidance(rows: readonly unknown[]) {
  validateAiAuthoredPaceTargets(rows);
  validateEffectiveHeartRateTargets(rows);
}

export function validateEffectiveHeartRateTargets(rows: readonly unknown[]) {
  let targetCount = 0;

  visitRecords(rows, (record) => {
    if (typeof record.hr_bpm_range !== "string") {
      return;
    }

    targetCount += 1;
    assert.match(record.hr_bpm_range, /^\d{2,3}-\d{2,3} bpm$/);
    assert.ok(
      record.hr_target_source === "default_estimated_hr" ||
        record.hr_target_source === "personal_hr_zone",
      "Generated HR guidance must identify its effective profile source.",
    );
    assert.equal(
      record.target_source,
      "ai_authored_plan_guidance",
      "Generated HR guidance must retain AI-authored provenance.",
    );
  });

  assert.ok(targetCount > 0, "Generated plan proof must include effective BPM guidance.");
}

export function assertSelectedDistanceEndpointProof(input: {
  scenarioName: string;
  canonicalPlan: ReturnType<typeof buildRunningPlanCanonicalPlan>;
  draft: RunningPlanPreviewDraft;
  expectedEndpointMeters: number;
  expectedFinalDate?: string;
}) {
  const endpointIssues = collectSelectedDistanceEndpointIssues({
    rows: input.canonicalPlan.planned_workouts.map((workout) => ({
      id: workout.workout_id,
      date: workout.date,
      isRest: workout.workout_type === "rest",
      endpointKind: workout.source_workout_type,
      endpointIdentity: workout.workout_identity,
      endpointDistanceMeters: selectedDistanceEndpointMainDistanceMeters({
        endpointKind: workout.source_workout_type,
        segments: workout.segments,
      }),
    })),
    expectedDistanceMeters: input.expectedEndpointMeters,
    targetDate:
      input.expectedFinalDate ?? input.draft.normalizedInputSummary.planGoalIntent.targetDate,
    proof: input.draft.endpointProof,
  });

  assert.deepEqual(
    endpointIssues,
    [],
    `${input.scenarioName} endpoint issues: ${JSON.stringify(endpointIssues)}`,
  );
}

export function rowHasPaceTargets(row: CanonicalRunningPlanRow) {
  return /"pace_min_per_km_range"|"pace_range_min_km"|"pace"/i.test(JSON.stringify(row.segments));
}

function rowHasHeartRateTargets(row: CanonicalRunningPlanRow) {
  return /"hr_bpm_range"/i.test(JSON.stringify(row.segments));
}

function validateAiAuthoredPaceTargets(value: unknown) {
  if (Array.isArray(value)) {
    value.forEach(validateAiAuthoredPaceTargets);
    return;
  }
  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  if (typeof record.pace === "string") {
    assert.equal(
      record.target_source,
      "ai_authored_plan_guidance",
      "Pace guidance must preserve AI-authored provenance.",
    );
  }
  assert.equal(record.pace_seconds_per_km, undefined);
  assert.equal(record.pace_min_seconds_per_km, undefined);
  assert.equal(record.pace_max_seconds_per_km, undefined);
  Object.values(record).forEach(validateAiAuthoredPaceTargets);
}

function visitRecords(value: unknown, visitor: (record: Record<string, unknown>) => void) {
  if (Array.isArray(value)) {
    value.forEach((entry) => visitRecords(entry, visitor));
    return;
  }
  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  visitor(record);
  Object.values(record).forEach((entry) => visitRecords(entry, visitor));
}

export function validateNoClientRowsTrusted(rows: readonly PersistedWorkoutRow[]) {
  for (const row of rows) {
    assert.notEqual(row.title, "client tampered row");
  }
}

export function tamperReviewToken(token: string) {
  const replacement = token.endsWith("0") ? "1" : "0";

  return `${token.slice(0, -1)}${replacement}`;
}
