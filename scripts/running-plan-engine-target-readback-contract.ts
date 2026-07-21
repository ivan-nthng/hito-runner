import assert from "node:assert/strict";
import { AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN } from "../src/lib/ai-authored-plan-first-provider-contract";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import type { buildRunningPlanCanonicalPlan } from "../src/lib/running-plan-engine-review";
import {
  displayExecutableTargetEntries,
  displayWorkoutTargetReadbackEntries,
  primaryWorkoutTarget,
} from "../src/lib/training";
import { workoutDocumentTargetToWire } from "../src/lib/workout-document";

type RunningPlanCanonicalPlan = ReturnType<typeof buildRunningPlanCanonicalPlan>;

export function validateRunnerFacingTargetReadbackContract(
  canonicalPlan: RunningPlanCanonicalPlan,
  label: string,
) {
  const importedSeed = buildImportedPlanSeed(canonicalPlan);

  for (const row of canonicalPlan.planned_workouts) {
    for (const segment of row.segments) {
      for (const target of [segment.target, segment.recovery_target]) {
        if (!target || typeof target !== "object") {
          continue;
        }

        const targetRecord = target as Record<string, unknown>;
        if ("rpe" in targetRecord) {
          assert.equal(
            targetRecord.target_source,
            "ai_authored_effort_guidance",
            `${label}: ${row.workout_id}.${segment.segment_type} generated RPE must stay AI-authored effort guidance.`,
          );
          assert.equal(
            targetRecord.hr_target_source,
            "effort_only",
            `${label}: ${row.workout_id}.${segment.segment_type} generated RPE must not become HR truth.`,
          );
          assert.equal(
            typeof targetRecord.rpe,
            "number",
            `${label}: ${row.workout_id}.${segment.segment_type} generated RPE must be numeric advisory effort.`,
          );
          assert.ok(
            Number(targetRecord.rpe) >= 1 && Number(targetRecord.rpe) <= 10,
            `${label}: ${row.workout_id}.${segment.segment_type} generated RPE must stay within 1-10.`,
          );
        }

        if (typeof targetRecord.hr_bpm_range === "string") {
          assert.match(
            targetRecord.hr_bpm_range,
            /^\d{2,3}-\d{2,3} bpm$/,
            `${label}: ${row.workout_id}.${segment.segment_type} must expose effective BPM guidance.`,
          );
          assert.ok(
            targetRecord.hr_target_source === "default_estimated_hr" ||
              targetRecord.hr_target_source === "personal_hr_zone",
            `${label}: ${row.workout_id}.${segment.segment_type} must preserve HR profile source.`,
          );
          assert.equal(
            targetRecord.target_source,
            "ai_authored_plan_guidance",
            `${label}: ${row.workout_id}.${segment.segment_type} must preserve AI-authored HR provenance.`,
          );
        }
      }
    }
  }

  for (const workout of importedSeed.workouts) {
    if (workout.workoutType === "rest") {
      continue;
    }

    const primaryTarget = primaryWorkoutTarget({ steps: workout.steps });
    const executableEntries = displayExecutableTargetEntries(primaryTarget, workout.metricMode);
    const readbackEntries = displayWorkoutTargetReadbackEntries(workout, { limit: 3 });
    const hasPaceTruth = workout.metricMode.paceTargetsAllowed === true;
    const hasHrTruth = executableEntries.some(
      (entry) => entry.key === "hr_bpm_range" || entry.key === "hr_bpm",
    );

    for (const entry of [...executableEntries, ...readbackEntries]) {
      if (!hasPaceTruth && !hasHrTruth) {
        assert.doesNotMatch(
          `${entry.label}: ${entry.value}`,
          /\b\d{2,3}\s*-\s*\d{2,3}\s*bpm|pace|\/km/i,
          `${label}: ${workout.workoutDate} structure-only runner-facing readback must not expose fake pace or HR.`,
        );
      }
    }

    if (hasHrTruth) {
      const hrEntries = executableEntries.filter(
        (entry) => entry.key === "hr_bpm_range" || entry.key === "hr_bpm",
      );
      assert.ok(
        hrEntries.length > 0,
        `${label}: ${workout.workoutDate} effective HR workout should expose BPM readback.`,
      );
      for (const entry of hrEntries) {
        assert.match(entry.value, /^\d{2,3}-\d{2,3} bpm$/);
      }
      assert.doesNotMatch(
        [...executableEntries, ...readbackEntries]
          .map((entry) => `${entry.label}: ${entry.value}`)
          .join("\n"),
        /\bZ[1-5](?:-Z[1-5])?\b/,
        `${label}: ${workout.workoutDate} runner-facing readback must not expose raw zone jargon.`,
      );
    }

    if (hasPaceTruth) {
      const paceEntries = executableEntries.filter(
        (entry) => entry.key === "pace_min_per_km_range" || entry.key === "pace",
      );
      assert.ok(
        paceEntries.length > 0,
        `${label}: ${workout.workoutDate} AI-authored pace workout should expose pace target readback.`,
      );
      for (const entry of paceEntries) {
        assert.match(
          entry.value,
          new RegExp(AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN),
          `${label}: ${workout.workoutDate} pace readback must stay machine-parseable min/km guidance.`,
        );
      }
      const exportedTarget = workoutDocumentTargetToWire(primaryTarget);
      const primaryPace = paceEntries[0]!;
      assert.equal(
        exportedTarget?.[primaryPace.key],
        primaryPace.value,
        `${label}: ${workout.workoutDate} export wire target must preserve AI-authored pace exactly.`,
      );
    } else if (workout.metricMode.executableMode === "structure_only_executable" && !hasHrTruth) {
      assert.ok(
        readbackEntries.length > 0,
        `${label}: ${workout.workoutDate} structure-only workout must keep numeric readback.`,
      );
      assert.equal(
        executableEntries.some((entry) => entry.key === "hr_bpm_range" || entry.key === "hr_bpm"),
        false,
        `${label}: ${workout.workoutDate} structure-only generated readback must not expose backend-estimated HR.`,
      );
    }

    if (primaryTarget?.primary_execution_mode === "effort") {
      assert.deepEqual(
        executableEntries.map((entry) => entry.key),
        primaryTarget.rpe == null ? ["intensity"] : ["rpe"],
        `${label}: ${workout.workoutDate} effort primary mode must expose exactly one authored effort command.`,
      );
    } else if (primaryTarget?.primary_execution_mode === "run_walk") {
      assert.deepEqual(
        executableEntries.map((entry) => entry.key),
        ["intensity"],
        `${label}: ${workout.workoutDate} run-walk primary mode must expose one command.`,
      );
    } else {
      assert.equal(
        executableEntries.some((entry) => entry.key === "intensity"),
        false,
        `${label}: ${workout.workoutDate} non-primary effort context must not compete with the watch command.`,
      );
    }
  }
}
