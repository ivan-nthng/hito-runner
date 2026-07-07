import assert from "node:assert/strict";
import { allowsDefaultEstimatedHrTarget } from "../src/lib/default-estimated-hr-target-policy";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import type { RunningPlanDistanceFamily } from "../src/lib/plan-creation-engine";
import type { buildRunningPlanCanonicalPlan } from "../src/lib/running-plan-engine-review";
import {
  displayExecutableTargetEntries,
  displayWorkoutTargetReadbackEntries,
  primaryWorkoutTarget,
} from "../src/lib/training";

type RunningPlanCanonicalPlan = ReturnType<typeof buildRunningPlanCanonicalPlan>;
type CanonicalWorkout = RunningPlanCanonicalPlan["planned_workouts"][number];
type CanonicalSegment = CanonicalWorkout["segments"][number];

export function validateRunnerFacingTargetReadbackContract(
  canonicalPlan: RunningPlanCanonicalPlan,
  label: string,
) {
  const importedSeed = buildImportedPlanSeed(canonicalPlan);

  for (const row of canonicalPlan.planned_workouts) {
    const rowHasPace = rowHasPaceTargets(row);

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
      }

      if (row.workout_type !== "rest" && !rowHasPace) {
        for (const [targetKind, targetRecord] of [
          ["target", segment.target],
          ["recovery_target", segment.recovery_target],
        ] as const) {
          const hasDefaultEstimatedHr =
            targetRecord?.hr_target_source === "default_estimated_hr" ||
            typeof targetRecord?.hr_bpm_range === "string";

          if (!hasDefaultEstimatedHr) {
            continue;
          }

          assert.equal(
            canonicalSegmentAllowsDefaultEstimatedHr(row, segment, targetKind),
            true,
            `${label}: ${row.workout_id}.${segment.segment_type}.${targetKind} default estimated HR is allowed only on aerobic support main rows.`,
          );
          assert.equal(
            targetRecord?.hr_target_source,
            "default_estimated_hr",
            `${label}: ${row.workout_id}.${segment.segment_type}.${targetKind} estimated HR must preserve default source.`,
          );
          assert.match(
            String(targetRecord?.hr_bpm_range ?? ""),
            /^\d+-\d+ bpm$/,
            `${label}: ${row.workout_id}.${segment.segment_type}.${targetKind} estimated HR should expose a bpm range.`,
          );
        }

        const targetRecord = segment.target as Record<string, unknown> | undefined;
        if (!canonicalSegmentAllowsDefaultEstimatedHr(row, segment, "target")) {
          assert.notEqual(
            targetRecord?.hr_target_source,
            "default_estimated_hr",
            `${label}: ${row.workout_id}.${segment.segment_type} hard or non-aerobic no-benchmark segment must not use default estimated HR as executable target.`,
          );
          assert.equal(
            typeof targetRecord?.hr_bpm_range,
            "undefined",
            `${label}: ${row.workout_id}.${segment.segment_type} hard or non-aerobic no-benchmark segment must not expose estimated HR range.`,
          );
        }
        assert.notEqual(
          segment.recovery_target?.hr_target_source,
          "default_estimated_hr",
          `${label}: ${row.workout_id}.${segment.segment_type} recovery_target must not use default estimated HR as executable target.`,
        );
        assert.equal(
          typeof segment.recovery_target?.hr_bpm_range,
          "undefined",
          `${label}: ${row.workout_id}.${segment.segment_type} recovery_target must not expose estimated HR range.`,
        );
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

    for (const entry of [...executableEntries, ...readbackEntries]) {
      assert.notEqual(
        entry.key,
        "rpe",
        `${label}: ${workout.workoutDate} must not expose RPE as an executable target entry.`,
      );
      if (!hasPaceTruth) {
        assert.doesNotMatch(
          `${entry.label}: ${entry.value}`,
          /\b\d{2,3}\s*-\s*\d{2,3}\s*bpm|pace|\/km/i,
          `${label}: ${workout.workoutDate} structure-only runner-facing readback must not expose fake pace or HR.`,
        );
      }
    }

    if (hasPaceTruth) {
      assert.ok(
        executableEntries.some(
          (entry) => entry.key === "pace_min_per_km_range" || entry.key === "pace",
        ),
        `${label}: ${workout.workoutDate} benchmark-backed workout should expose pace target readback.`,
      );
    } else if (workout.metricMode.executableMode === "structure_only_executable") {
      assert.ok(
        readbackEntries.length > 0,
        `${label}: ${workout.workoutDate} structure-only workout must keep numeric readback.`,
      );
      if (importedWorkoutAllowsDefaultEstimatedHr(workout.sourceWorkoutType)) {
        if (executableEntries.some((entry) => entry.key === "hr_bpm_range")) {
          assert.ok(
            executableEntries.some(
              (entry) => entry.key === "hr_bpm_range" && entry.label === "Estimated HR",
            ),
            `${label}: ${workout.workoutDate} default HR readback should be labelled Estimated HR.`,
          );
          assert.equal(
            workout.metricMode.hrTargetsAllowed,
            false,
            `${label}: ${workout.workoutDate} Estimated HR fallback must not enable personal HR targets.`,
          );
          assert.equal(
            workout.metricMode.hrTargetSource,
            "default_estimated_hr",
            `${label}: ${workout.workoutDate} Estimated HR fallback should preserve default HR source metadata.`,
          );
        }
      } else {
        assert.equal(
          executableEntries.some((entry) => entry.key === "hr_bpm_range"),
          false,
          `${label}: ${workout.workoutDate} hard/no-benchmark workout must not expose default estimated HR target readback.`,
        );
      }
    }

    for (const entry of executableEntries) {
      assert.notEqual(
        entry.key,
        "intensity",
        `${label}: ${workout.workoutDate} effort intensity must not be treated as executable target truth.`,
      );
    }
  }
}

export function benchmarkPaceUsefulWorkoutKinds(family: RunningPlanDistanceFamily) {
  switch (family) {
    case "10K":
      return new Set(["tempo", "intervals"]);
    case "Half Marathon":
      return new Set(["tempo", "threshold", "progression"]);
    case "Marathon Completion":
      return new Set(["steady_aerobic_run", "progression", "tempo"]);
  }
}

function rowHasPaceTargets(row: CanonicalWorkout) {
  return JSON.stringify(row.segments).includes("pace_min_per_km_range");
}

function canonicalSegmentAllowsDefaultEstimatedHr(
  row: CanonicalWorkout,
  segment: CanonicalSegment,
  targetKind: "target" | "recovery_target" = "target",
) {
  return allowsDefaultEstimatedHrTarget({
    sourceWorkoutType: row.source_workout_type,
    workoutType: row.workout_type,
    segmentType: segment.segment_type,
    segmentId: segment.segment_id,
    targetKind,
  });
}

function importedWorkoutAllowsDefaultEstimatedHr(sourceWorkoutType: string | null | undefined) {
  return allowsDefaultEstimatedHrTarget({
    sourceWorkoutType,
    segmentType: "main",
  });
}
