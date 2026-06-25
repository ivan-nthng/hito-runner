import {
  type DefaultEstimatedHrBand,
  type NormalizedStructuredInput,
  type StructuredMetricMode,
} from "@/lib/structured-plan-authoring-schema";
import {
  DEFAULT_ESTIMATED_HR_SOURCE_NOTE,
  buildDefaultEstimatedHrBandReadback,
} from "@/lib/heart-rate-zones";
import { deriveExecutableModeFromSegments } from "@/lib/rich-workout-model";
import {
  getRecent5kPaceSecondsPerKm,
  isMountainSpecificPlan,
} from "@/lib/structured-plan-authoring-policy";

export function buildGeneratedWorkoutMetricMode(
  normalized: NormalizedStructuredInput,
  segments: Array<{
    target?: Record<string, unknown>;
    recovery_target?: Record<string, unknown>;
    prescription?: Record<string, unknown>;
    duration_min?: number | null;
    distance_km?: number | null;
    repeat_count?: number | null;
    work_distance_km?: number | null;
    work_duration_min?: number | null;
    work_duration_sec?: number | null;
    recovery_distance_km?: number | null;
    recovery_duration_min?: number | null;
    recovery_duration_sec?: number | null;
  }>,
) {
  const metricMode = resolveStructuredMetricMode(normalized);
  const hasPaceTargets = segments.some((segment) => targetHasMetric(segment, "pace"));
  const hasPersonalHrTargets = segments.some((segment) => targetHasPersonalHrMetric(segment));
  const hasDefaultEstimatedHrTargets = segments.some((segment) =>
    targetHasDefaultEstimatedHrMetric(segment),
  );
  const structureExecutableMode = deriveExecutableModeFromSegments(segments);
  const executableMode =
    hasPaceTargets && hasPersonalHrTargets
      ? "mixed_metric_executable"
      : hasPaceTargets
        ? "pace_executable"
        : hasPersonalHrTargets
          ? "hr_executable"
          : structureExecutableMode;
  const guidance = hasPaceTargets
    ? hasPersonalHrTargets
      ? "mixed"
      : "pace"
    : hasPersonalHrTargets
      ? "heart_rate"
      : hasDefaultEstimatedHrTargets
        ? "heart_rate"
        : "effort";
  const hrTargetSource = hasPersonalHrTargets
    ? metricMode.heartRateTargetSource
    : hasDefaultEstimatedHrTargets
      ? "default_estimated_hr"
      : metricMode.heartRateTargetSource;

  return {
    guidance,
    executableMode,
    paceTargetsAllowed: hasPaceTargets,
    hrTargetsAllowed: hasPersonalHrTargets,
    hrTargetSource,
    hrTargetLabel: hasDefaultEstimatedHrTargets ? "Editable default estimated HR guidance" : null,
    hrTargetSourceNote: hasDefaultEstimatedHrTargets ? DEFAULT_ESTIMATED_HR_SOURCE_NOTE : null,
    reason:
      hasPaceTargets && hasPersonalHrTargets
        ? "Watch/app pace guidance and personal HR-zone truth allow mixed executable targets."
        : hasPaceTargets
          ? "Watch/app pace guidance and recent 5K benchmark truth allow broad pace targets."
          : hasPersonalHrTargets
            ? "Personal HR-zone truth allows HR executable targets."
            : hasDefaultEstimatedHrTargets
              ? "Watch/app execution support is available; this workout uses executable numeric structure with editable default estimated HR guidance, not personal HR-zone truth."
              : executableMode === "structure_only_executable"
                ? "Watch/app execution support is available; this workout uses executable duration, distance, repeat, work, and recovery structure without pace or HR targets."
                : "This workout requires correction because it lacks executable metric truth and executable numeric structure.",
  };
}

function targetHasMetric(
  segment: { target?: Record<string, unknown>; recovery_target?: Record<string, unknown> },
  metric: "pace" | "hr",
) {
  const keys =
    metric === "pace"
      ? ["pace_min_per_km_range", "pace_range_min_km", "pace"]
      : ["hr_bpm_range", "hr_bpm"];

  return [segment.target, segment.recovery_target].some((target) =>
    keys.some((key) => {
      const value = target?.[key];

      return typeof value === "string" && value.trim().length > 0;
    }),
  );
}

function targetHasPersonalHrMetric(segment: {
  target?: Record<string, unknown>;
  recovery_target?: Record<string, unknown>;
}) {
  return [segment.target, segment.recovery_target].some(
    (target) =>
      targetHasMetric({ target }, "hr") && target?.hr_target_source === "personal_hr_zone",
  );
}

function targetHasDefaultEstimatedHrMetric(segment: {
  target?: Record<string, unknown>;
  recovery_target?: Record<string, unknown>;
}) {
  return [segment.target, segment.recovery_target].some(
    (target) =>
      targetHasMetric({ target }, "hr") && target?.hr_target_source === "default_estimated_hr",
  );
}

export function buildRepeatRecoveryTarget(normalized: NormalizedStructuredInput) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    intensity: "very_easy_recovery",
    ...(paceTargets?.recovery ? { pace_min_per_km_range: paceTargets.recovery } : {}),
    hint: "Very easy jog or walk; let breathing settle.",
  };
}

export function buildEasyTarget(
  normalized: NormalizedStructuredInput,
  options: {
    hrBand?: DefaultEstimatedHrBand | null;
    allowDefaultEstimatedHr?: boolean;
  } = {},
) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);
  const hrBand = options.hrBand === undefined ? "easy" : options.hrBand;

  return {
    intensity: "easy_aerobic",
    ...(paceTargets?.easy ? { pace_min_per_km_range: paceTargets.easy } : {}),
    ...(!paceTargets?.easy && hrBand
      ? buildDefaultEstimatedHrTarget(normalized, hrBand, {
          allowDefaultEstimatedHr: options.allowDefaultEstimatedHr === true,
        })
      : {}),
    cue: buildEasyCue(normalized),
  };
}

export function buildLongRunTarget(
  normalized: NormalizedStructuredInput,
  options: { allowDefaultEstimatedHr?: boolean } = {},
) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    intensity: "easy_aerobic",
    ...(paceTargets?.longRun ? { pace_min_per_km_range: paceTargets.longRun } : {}),
    ...(!paceTargets?.longRun
      ? buildDefaultEstimatedHrTarget(normalized, "longAerobic", {
          allowDefaultEstimatedHr: options.allowDefaultEstimatedHr === true,
        })
      : {}),
    cue: buildLongRunCue(normalized),
  };
}

export function buildLongRunCue(normalized: NormalizedStructuredInput) {
  if (isMountainSpecificPlan(normalized)) {
    return "Time-on-feet effort: climb patiently, power-hike steep sections, and descend under control.";
  }

  if (normalized.goal.goalType === "marathon") {
    return "Comfortable marathon durability: patient rhythm, familiar fueling routine if used, and no forced finish.";
  }

  if (normalized.goal.goalType === "ultra_marathon") {
    return "Patient time-on-feet durability; short hike breaks are allowed when they protect the full session.";
  }

  if (normalized.goal.goalType === "half_marathon") {
    return "Controlled endurance with enough restraint to finish steady.";
  }

  return "Comfortable enough to keep the full run controlled.";
}

export function buildSteadyFinishTarget(normalized: NormalizedStructuredInput) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    intensity: "steady_finish",
    ...(paceTargets?.steady ? { pace_min_per_km_range: paceTargets.steady } : {}),
    cue: "Slightly stronger than easy, never a race finish.",
  };
}

export function deriveBenchmarkPaceTargets(normalized: NormalizedStructuredInput) {
  const metricMode = resolveStructuredMetricMode(normalized);
  const recent5kPaceSecondsPerKm = metricMode.recent5kPaceSecondsPerKm;

  if (!metricMode.paceTargetsAllowed || !recent5kPaceSecondsPerKm) {
    return null;
  }

  return {
    easy: buildPaceRange(recent5kPaceSecondsPerKm, 90, 150),
    recovery: buildPaceRange(recent5kPaceSecondsPerKm, 135, 225),
    longRun: buildPaceRange(recent5kPaceSecondsPerKm, 100, 170),
    steady: buildPaceRange(recent5kPaceSecondsPerKm, 60, 105),
    tempo: buildPaceRange(recent5kPaceSecondsPerKm, 25, 55),
    interval: buildPaceRange(recent5kPaceSecondsPerKm, 0, 25),
    rollingHill: buildPaceRange(recent5kPaceSecondsPerKm, 55, 120),
    hillRepeat: buildPaceRange(recent5kPaceSecondsPerKm, 70, 165),
    hillSteady: buildPaceRange(recent5kPaceSecondsPerKm, 75, 145),
  };
}

export function buildDefaultEstimatedHrTarget(
  normalized: NormalizedStructuredInput,
  band: DefaultEstimatedHrBand,
  options: { allowDefaultEstimatedHr?: boolean } = {},
) {
  if (options.allowDefaultEstimatedHr !== true) {
    return {};
  }

  const readback = buildDefaultEstimatedHrBandReadback(normalized.runnerProfile.age, band);

  if (!readback) {
    return {};
  }

  return {
    hr_bpm_range: readback.rangeBpm,
    hr_target_source: "default_estimated_hr",
    label: `${readback.label} estimated HR guidance`,
    source_note: DEFAULT_ESTIMATED_HR_SOURCE_NOTE,
  };
}

export function resolveStructuredMetricMode(
  normalized: NormalizedStructuredInput,
): StructuredMetricMode {
  const recent5kPaceSecondsPerKm = getRecent5kPaceSecondsPerKm(normalized);
  const canFollowNumericTargets = normalized.execution.watchAccess === "watch_or_app";
  const wantsPaceTargets =
    normalized.execution.guidancePreference === "pace" ||
    normalized.execution.guidancePreference === "mixed";
  const estimatedMaxHr = deriveEstimatedMaxHr(normalized.runnerProfile.age);

  return {
    executableSurfaceSupported: canFollowNumericTargets,
    executableMode: canFollowNumericTargets ? "structure_only_executable" : "correction_required",
    paceTargetsAllowed: Boolean(
      canFollowNumericTargets && wantsPaceTargets && recent5kPaceSecondsPerKm,
    ),
    heartRateTargetsAllowed: false,
    heartRateTargetSource: estimatedMaxHr ? "default_estimated_hr" : "effort_only",
    defaultEstimatedHrAvailable: Boolean(estimatedMaxHr),
    estimatedMaxHr,
    recent5kPaceSecondsPerKm,
  };
}

export function buildEasyCue(normalized: NormalizedStructuredInput) {
  if (normalized.execution.guidancePreference === "heart_rate") {
    return "Use easy effort for now; no personal heart-rate target is available yet.";
  }

  return "Conversational effort throughout.";
}

export function deriveEstimatedMaxHr(age: number | null | undefined) {
  if (typeof age !== "number" || !Number.isFinite(age)) {
    return null;
  }

  return Math.round(208 - 0.7 * age);
}

export function buildPaceRange(
  recent5kPaceSecondsPerKm: number,
  fastDeltaSeconds: number,
  slowDeltaSeconds: number,
) {
  return `${formatPaceSecondsPerKm(
    recent5kPaceSecondsPerKm + fastDeltaSeconds,
  )}-${formatPaceSecondsPerKm(recent5kPaceSecondsPerKm + slowDeltaSeconds)}/km`;
}

export function formatPaceSecondsPerKm(secondsPerKm: number) {
  const roundedSeconds = Math.round(secondsPerKm / 5) * 5;
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
