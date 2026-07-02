import assert from "node:assert/strict";

import type { buildRunningPlanCanonicalPlan } from "../../src/lib/running-plan-engine-review";
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
      assert.equal(row.metric_mode?.executable_mode, "structure_only_executable");
      assert.equal(row.metric_mode?.pace_targets_allowed, false);
    }
    assert.equal(row.metric_mode?.hr_targets_allowed, false);

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

export function validateNoFakePaceOrPersonalHr(rows: readonly unknown[]) {
  const serialized = JSON.stringify(rows);

  assert.doesNotMatch(serialized, /"pace_min_per_km_range"|"pace_range_min_km"|"pace"/i);
  assert.doesNotMatch(serialized, /race_pace_session/i);
  validateNoPersonalHrTargets(rows);
}

export function validateNoPersonalHrTargets(rows: readonly unknown[]) {
  const serialized = JSON.stringify(rows);

  assert.doesNotMatch(
    serialized,
    /personal_hr|personalized_hr|hr_zone_truth|"hr_targets_allowed":true/i,
  );
}

export function rowHasPaceTargets(row: CanonicalRunningPlanRow) {
  return JSON.stringify(row.segments).includes("pace_min_per_km_range");
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
