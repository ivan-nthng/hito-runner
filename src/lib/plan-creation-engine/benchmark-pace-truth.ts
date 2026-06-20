import { parseDurationSeconds, parsePaceSecondsPerKm } from "@/lib/first-plan-authoring-utils";
import {
  type RunningPlanBenchmarkInput,
  type RunningPlanBenchmarkPaceTruth,
  type RunningPlanSegmentPrescription,
  type RunningPlanWatchExecutableSegmentTemplate,
  type RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";
import { buildPaceRange, formatPaceSecondsPerKm } from "@/lib/structured-plan-authoring-metrics";

export function normalizeRunningPlanBenchmarkPaceTruth(
  benchmark: RunningPlanBenchmarkInput | null | undefined,
): RunningPlanBenchmarkPaceTruth | null {
  if (!benchmark || benchmark.kind === "unknown") {
    return null;
  }

  if (benchmark.kind === "recent_5k_time") {
    const seconds = parseDurationSeconds(benchmark.recent5kTime);
    if (!seconds || !recent5kTimeIsSupported(seconds)) {
      return null;
    }

    return buildBenchmarkPaceTruth({
      source: "recent_5k_time",
      paceSecondsPerKm: seconds / 5,
    });
  }

  const paceSecondsPerKm = parsePaceSecondsPerKm(benchmark.recent5kPace);
  if (!paceSecondsPerKm || !recent5kPaceIsSupported(paceSecondsPerKm)) {
    return null;
  }

  return buildBenchmarkPaceTruth({
    source: "recent_5k_pace",
    paceSecondsPerKm,
  });
}

export function buildSelectedPlanSegmentPaceTarget(input: {
  workoutDayKind: RunningPlanWorkoutDayKind;
  segment: RunningPlanWatchExecutableSegmentTemplate;
  benchmarkPaceTruth: RunningPlanBenchmarkPaceTruth | null;
}) {
  const { benchmarkPaceTruth, segment, workoutDayKind } = input;
  if (!benchmarkPaceTruth || !segmentCanCarryPaceTarget(segment)) {
    return null;
  }

  switch (workoutDayKind) {
    case "recovery":
      return buildPaceRange(benchmarkPaceTruth.paceSecondsPerKm, 135, 225);
    case "easy":
      return buildPaceRange(benchmarkPaceTruth.paceSecondsPerKm, 90, 150);
    case "long_run":
    case "cutback_long_run":
      return buildPaceRange(benchmarkPaceTruth.paceSecondsPerKm, 100, 170);
    case "steady_aerobic_run":
    case "progression":
      return buildPaceRange(benchmarkPaceTruth.paceSecondsPerKm, 60, 105);
    case "tempo":
    case "threshold":
      return buildPaceRange(benchmarkPaceTruth.paceSecondsPerKm, 25, 55);
    case "intervals":
      return buildPaceRange(benchmarkPaceTruth.paceSecondsPerKm, 0, 25);
    case "strides":
    case "hills":
    case "final_selected_distance_day":
    case "marathon_base_endpoint":
      return null;
  }
}

export function selectedPlanSegmentsContainPaceTargets(
  segments: readonly { target?: Record<string, unknown> | null }[],
) {
  return segments.some((segment) => {
    const target = segment.target;
    return (
      typeof target?.pace_min_per_km_range === "string" &&
      target.pace_min_per_km_range.trim().length > 0
    );
  });
}

function buildBenchmarkPaceTruth(input: {
  source: RunningPlanBenchmarkPaceTruth["source"];
  paceSecondsPerKm: number;
}): RunningPlanBenchmarkPaceTruth {
  return {
    kind: "recent_5k",
    source: input.source,
    paceSecondsPerKm: input.paceSecondsPerKm,
    label: `Recent 5K benchmark pace ${formatPaceSecondsPerKm(input.paceSecondsPerKm)}/km`,
  };
}

function segmentCanCarryPaceTarget(segment: RunningPlanWatchExecutableSegmentTemplate) {
  if (!["main", "checkpoint", "work", "finish"].includes(segment.segmentRole)) {
    return false;
  }

  return prescriptionCanCarryPaceTarget(segment.primaryPrescription);
}

function prescriptionCanCarryPaceTarget(prescription: RunningPlanSegmentPrescription): boolean {
  switch (prescription.mode) {
    case "time":
    case "distance":
    case "time_with_default_hr_cap":
    case "distance_with_default_hr_cap":
    case "free_run_with_cap":
      return true;
    case "repeat":
      return true;
    case "open_warmup":
    case "open_cooldown":
    case "recovery_time":
    case "recovery_distance":
      return false;
  }
}

function recent5kTimeIsSupported(seconds: number) {
  return seconds >= 10 * 60 && seconds <= 2 * 60 * 60;
}

function recent5kPaceIsSupported(secondsPerKm: number) {
  return secondsPerKm >= 2 * 60 && secondsPerKm <= 15 * 60;
}
