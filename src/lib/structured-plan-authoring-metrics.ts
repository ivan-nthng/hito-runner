import {
  type DefaultEstimatedHrBand,
  type NormalizedStructuredInput,
  type StructuredMetricMode,
} from "@/lib/structured-plan-authoring-schema";
import {
  getRecent5kPaceSecondsPerKm,
  isMountainSpecificPlan,
} from "@/lib/structured-plan-authoring-policy";

const DEFAULT_ESTIMATED_HR_LABEL = "Default HR guidance";
const DEFAULT_ESTIMATED_HR_SOURCE_NOTE = "Estimated from age, not personalized zones.";

const defaultEstimatedHrBands: Record<DefaultEstimatedHrBand, [number, number]> = {
  recovery: [0.55, 0.65],
  easy: [0.6, 0.72],
  longAerobic: [0.6, 0.75],
  steady: [0.7, 0.8],
  tempo: [0.8, 0.88],
};

export function buildGeneratedWorkoutMetricMode(
  normalized: NormalizedStructuredInput,
  segments: Array<{
    target?: Record<string, unknown>;
    recovery_target?: Record<string, unknown>;
  }>,
) {
  const metricMode = resolveStructuredMetricMode(normalized);
  const hasPaceTargets = segments.some((segment) => targetHasMetric(segment, "pace"));
  const hasHrTargets = segments.some((segment) => targetHasMetric(segment, "hr"));
  const guidance = hasPaceTargets
    ? hasHrTargets
      ? "mixed"
      : "pace"
    : hasHrTargets
      ? "heart_rate"
      : "effort";
  const hrTargetSource = hasHrTargets ? metricMode.heartRateTargetSource : "effort_only";
  const defaultHrSource =
    hrTargetSource === "default_estimated_hr"
      ? {
          hrTargetLabel: DEFAULT_ESTIMATED_HR_LABEL,
          hrTargetSourceNote: DEFAULT_ESTIMATED_HR_SOURCE_NOTE,
        }
      : {
          hrTargetLabel: null,
          hrTargetSourceNote: null,
        };

  return {
    guidance,
    paceTargetsAllowed: hasPaceTargets,
    hrTargetsAllowed: hasHrTargets,
    hrTargetSource,
    ...defaultHrSource,
    reason:
      hasPaceTargets && hasHrTargets
        ? "Watch/app pace guidance plus age-estimated default HR guidance are available; HR ranges are not personalized zones."
        : hasPaceTargets
          ? "Watch/app pace guidance and recent 5K benchmark truth allow broad pace targets."
          : hasHrTargets
            ? "Age-estimated default HR guidance is available; ranges are not personalized HR zones."
            : "Metric resolver keeps this workout effort-guided without numeric pace or HR targets.",
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
  options: { hrBand?: DefaultEstimatedHrBand | null } = {},
) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);
  const hrBand = options.hrBand === undefined ? "easy" : options.hrBand;

  return {
    intensity: "easy_aerobic",
    ...(paceTargets?.easy ? { pace_min_per_km_range: paceTargets.easy } : {}),
    ...(hrBand ? buildDefaultEstimatedHrTarget(normalized, hrBand) : {}),
    cue: buildEasyCue(normalized),
  };
}

export function buildLongRunTarget(normalized: NormalizedStructuredInput) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    intensity: "easy_aerobic",
    ...(paceTargets?.longRun ? { pace_min_per_km_range: paceTargets.longRun } : {}),
    ...buildDefaultEstimatedHrTarget(normalized, "longAerobic"),
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
    ...buildDefaultEstimatedHrTarget(normalized, "steady"),
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
) {
  const metricMode = resolveStructuredMetricMode(normalized);

  if (
    !metricMode.heartRateTargetsAllowed ||
    metricMode.heartRateTargetSource !== "default_estimated_hr" ||
    !metricMode.estimatedMaxHr
  ) {
    return {};
  }

  const [lowerPercent, upperPercent] = defaultEstimatedHrBands[band];
  const lowerBpm = roundBpmToNearestFive(metricMode.estimatedMaxHr * lowerPercent);
  const upperBpm = roundBpmToNearestFive(metricMode.estimatedMaxHr * upperPercent);

  return {
    hr_bpm_range: `${lowerBpm}-${upperBpm} bpm`,
    hr_target_source: "default_estimated_hr",
    label: DEFAULT_ESTIMATED_HR_LABEL,
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
    paceTargetsAllowed: Boolean(
      canFollowNumericTargets && wantsPaceTargets && recent5kPaceSecondsPerKm,
    ),
    heartRateTargetsAllowed: Boolean(estimatedMaxHr),
    heartRateTargetSource: estimatedMaxHr ? "default_estimated_hr" : "effort_only",
    estimatedMaxHr,
    recent5kPaceSecondsPerKm,
  };
}

export function buildEasyCue(normalized: NormalizedStructuredInput) {
  if (normalized.execution.guidancePreference === "heart_rate") {
    if (resolveStructuredMetricMode(normalized).heartRateTargetSource === "default_estimated_hr") {
      return "Use easy effort first; any HR range is an age-based default, not a personal zone.";
    }

    return "Use easy effort for now; no heart-rate target is available yet.";
  }

  return "Conversational effort throughout.";
}

export function deriveEstimatedMaxHr(age: number | null | undefined) {
  if (typeof age !== "number" || !Number.isFinite(age)) {
    return null;
  }

  return Math.round(208 - 0.7 * age);
}

export function roundBpmToNearestFive(value: number) {
  return Math.round(value / 5) * 5;
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
