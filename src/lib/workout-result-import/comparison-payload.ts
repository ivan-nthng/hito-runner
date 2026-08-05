import type { Json } from "@/lib/supabase/database";
import { stableJsonEqual } from "@/lib/review-token-signing";
import type {
  WorkoutComparisonDifferencePayload,
  WorkoutComparisonFactStatus,
  WorkoutComparisonSupportStatus,
} from "@/lib/workout-result-import/types";

const FACT_STATUSES = new Set<WorkoutComparisonFactStatus>([
  "matched",
  "partial",
  "mismatch",
  "missing_actual",
  "not_applicable",
]);
const SUPPORT_STATUSES = new Set<WorkoutComparisonSupportStatus>([
  "compared",
  "missing_actual",
  "unsupported",
  "not_applicable",
]);
const CANONICAL_SIGNAL_FACT_ENTRIES = [
  ["activity_type", "activityType"],
  ["date_alignment", "dateAlignment"],
  ["duration", "duration"],
  ["distance", "distance"],
  ["structured_step_count", "structuredStepCount"],
] as const;
const CANONICAL_FACT_KEYS = new Set<string>(
  CANONICAL_SIGNAL_FACT_ENTRIES.map(([, factKey]) => factKey),
);

export const WORKOUT_COMPARISON_FORMULA_VERSION = "deterministic_workout_comparison_v1";

export function readWorkoutComparisonDifferencePayload(
  value: Json,
): WorkoutComparisonDifferencePayload | null {
  const payload = recordOrNull(value);

  if (
    !payload ||
    !isPlannedWorkoutPayload(payload.plannedWorkout) ||
    !isActualMetricsPayload(payload.actualMetrics) ||
    !isCanonicalSignalArray(payload.signals) ||
    !isSupportMatrixPayload(payload.supportMatrix) ||
    !isStepSummaryPayload(payload.stepSummary) ||
    !isSegmentSummaryPayload(payload.segmentSummary) ||
    !isSummaryPayload(payload.summary)
  ) {
    return null;
  }

  if (
    payload.facts !== undefined &&
    (!isFactsPayload(payload.facts) || !factsMatchSignals(payload.facts, payload.signals))
  ) {
    return null;
  }

  // Historical exact-dual rows remain readable, but Product receives one signals-only truth.
  return {
    plannedWorkout: payload.plannedWorkout,
    actualMetrics: payload.actualMetrics,
    signals: payload.signals,
    supportMatrix: payload.supportMatrix,
    stepSummary: payload.stepSummary,
    segmentSummary: payload.segmentSummary,
    summary: payload.summary,
  } as unknown as WorkoutComparisonDifferencePayload;
}

function factsMatchSignals(factsValue: Json | undefined, signalsValue: Json | undefined) {
  const facts = recordOrNull(factsValue);
  if (
    !facts ||
    !Array.isArray(signalsValue) ||
    signalsValue.length !== CANONICAL_SIGNAL_FACT_ENTRIES.length
  ) {
    return false;
  }

  const signalByKey = new Map(
    signalsValue.flatMap((candidate) => {
      const signal = recordOrNull(candidate);
      return typeof signal?.key === "string" ? [[signal.key, candidate] as const] : [];
    }),
  );
  if (signalByKey.size !== CANONICAL_SIGNAL_FACT_ENTRIES.length) return false;

  return CANONICAL_SIGNAL_FACT_ENTRIES.every(([signalKey, factKey]) =>
    stableJsonEqual(signalByKey.get(signalKey), facts[factKey]),
  );
}

function isPlannedWorkoutPayload(value: Json | undefined) {
  const row = recordOrNull(value);
  return (
    row != null &&
    typeof row.plannedWorkoutId === "string" &&
    typeof row.title === "string" &&
    typeof row.workoutDate === "string" &&
    typeof row.workoutType === "string" &&
    typeof row.plannedDurationMin === "number"
  );
}

function isActualMetricsPayload(value: Json | undefined) {
  const row = recordOrNull(value);
  return (
    row != null &&
    typeof row.actualMetricsId === "string" &&
    row.sourceKind === "garmin_fit" &&
    (typeof row.activityType === "string" || row.activityType === null)
  );
}

function isFactsPayload(value: Json | undefined) {
  const facts = recordOrNull(value);
  return (
    facts != null &&
    Object.keys(facts).length === CANONICAL_FACT_KEYS.size &&
    Object.keys(facts).every((key) => CANONICAL_FACT_KEYS.has(key)) &&
    isSignal(facts.activityType) &&
    isSignal(facts.dateAlignment) &&
    isSignal(facts.duration) &&
    isSignal(facts.distance) &&
    isSignal(facts.structuredStepCount)
  );
}

function isCanonicalSignalArray(value: Json | undefined) {
  if (!Array.isArray(value) || value.length !== CANONICAL_SIGNAL_FACT_ENTRIES.length) {
    return false;
  }

  const keys = value.flatMap((candidate) => {
    const signal = recordOrNull(candidate);
    return isSignal(candidate) && typeof signal?.key === "string" ? [signal.key] : [];
  });
  const canonicalKeys = new Set<string>(CANONICAL_SIGNAL_FACT_ENTRIES.map(([key]) => key));

  return (
    keys.length === canonicalKeys.size &&
    new Set(keys).size === keys.length &&
    keys.every((key) => canonicalKeys.has(key))
  );
}

function isSignal(value: Json | undefined) {
  const signal = recordOrNull(value);
  return (
    signal != null &&
    typeof signal.key === "string" &&
    typeof signal.label === "string" &&
    typeof signal.unit === "string" &&
    typeof signal.status === "string" &&
    FACT_STATUSES.has(signal.status as WorkoutComparisonFactStatus)
  );
}

function isSupportMatrixPayload(value: Json | undefined) {
  const supportMatrix = recordOrNull(value);
  return (
    supportMatrix != null &&
    Array.isArray(supportMatrix.signals) &&
    supportMatrix.signals.every((candidate) => {
      const signal = recordOrNull(candidate);
      return (
        signal != null &&
        typeof signal.key === "string" &&
        typeof signal.label === "string" &&
        typeof signal.status === "string" &&
        SUPPORT_STATUSES.has(signal.status as WorkoutComparisonSupportStatus)
      );
    })
  );
}

function isStepSummaryPayload(value: Json | undefined) {
  const summary = recordOrNull(value);
  return (
    summary != null &&
    (summary.status === "available" || summary.status === "not_applicable") &&
    Array.isArray(summary.steps)
  );
}

function isSegmentSummaryPayload(value: Json | undefined) {
  const summary = recordOrNull(value);
  return (
    summary != null &&
    (summary.status === "available" || summary.status === "not_applicable") &&
    Array.isArray(summary.groups)
  );
}

function isSummaryPayload(value: Json | undefined) {
  const summary = recordOrNull(value);
  return (
    summary != null &&
    typeof summary.comparedSignalCount === "number" &&
    typeof summary.visibleSignalCount === "number" &&
    Array.isArray(summary.comparedSignalKeys)
  );
}

function recordOrNull(value: Json | undefined): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
