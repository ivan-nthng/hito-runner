import FitParser from "fit-file-parser";
import type { Json } from "@/lib/supabase/database";
import {
  ParsedActualWorkoutLap,
  ParsedActualWorkoutStep,
  ParsedGarminWorkout,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";

export async function parseGarminFitActivity(fileBuffer: Buffer): Promise<ParsedGarminWorkout> {
  const parser = new FitParser({
    force: true,
    speedUnit: "km/h",
    lengthUnit: "km",
    temperatureUnit: "celsius",
    elapsedRecordField: true,
    mode: "both",
  });

  let parsed: Record<string, unknown>;

  try {
    parsed = (await parser.parseAsync(Uint8Array.from(fileBuffer).buffer)) as unknown as Record<
      string,
      unknown
    >;
  } catch (error) {
    throw new WorkoutResultImportError(
      "fit_parse_failed",
      error instanceof Error ? error.message : "The Garmin FIT activity could not be parsed.",
      422,
    );
  }

  const sessions = asArray<Record<string, unknown>>(parsed.sessions);
  const laps = asArray<Record<string, unknown>>(parsed.laps);
  const records = asArray<Record<string, unknown>>(parsed.records);
  const workout = asRecord(parsed.workout);
  const activity = asRecord(parsed.activity);
  const activityMetrics = asArray<Record<string, unknown>>(parsed.activity_metrics);
  const firstSession =
    sessions[0] ?? asArray<Record<string, unknown>>(activity?.sessions)[0] ?? null;

  if (!firstSession || records.length === 0) {
    throw new WorkoutResultImportError(
      "fit_parse_failed",
      "The uploaded FIT file did not contain a usable Garmin activity session.",
      422,
    );
  }

  const normalizedLaps = laps.map((lap, index) => normalizeLap(lap, index));
  const normalizedSteps = buildActualSteps(normalizedLaps);
  const activityMetricsSummary = activityMetrics[0] ?? null;
  const providerLocalTimestamp =
    dateTimeOrNull(activity?.local_timestamp) ?? dateTimeOrNull(firstSession.local_timestamp);

  return {
    sourceKind: "garmin_fit",
    activityStartAt:
      dateTimeOrNull(firstSession.start_time) ??
      dateTimeOrNull(activity?.timestamp) ??
      dateTimeOrNull(firstSession.timestamp),
    activityLocalDate: toIsoDate(providerLocalTimestamp),
    totalDistanceKm: roundNumber(numberOrNull(firstSession.total_distance), 2),
    totalDurationMin: secondsToRoundedMinutes(
      numberOrNull(firstSession.total_timer_time) ?? numberOrNull(firstSession.total_elapsed_time),
    ),
    avgHeartRate:
      integerOrNull(firstSession.avg_heart_rate) ??
      integerOrNull(activityMetricsSummary?.avg_heart_rate),
    maxHeartRate:
      integerOrNull(firstSession.max_heart_rate) ??
      integerOrNull(activityMetricsSummary?.new_max_heart_rate),
    avgPower: integerOrNull(firstSession.avg_power),
    maxPower: integerOrNull(firstSession.max_power),
    totalCalories: integerOrNull(firstSession.total_calories),
    totalAscentM:
      integerOrNull(firstSession.total_ascent) ??
      integerOrNull(activityMetricsSummary?.total_ascent),
    totalDescentM:
      integerOrNull(firstSession.total_descent) ??
      integerOrNull(activityMetricsSummary?.total_descent),
    avgCadence: integerOrNull(firstSession.avg_cadence),
    avgTemperatureC: integerOrNull(firstSession.avg_temperature),
    gpsPointCount: records.length,
    lapCount: normalizedLaps.length,
    workoutName: stringOrNull(workout?.wkt_name),
    actualIntervalCount: countDistinctWorkoutStepIndexes(normalizedLaps),
    actualStepPayload: normalizedSteps as unknown as Json,
    lapPayload: normalizedLaps as unknown as Json,
    summaryPayload: buildSummaryPayload({
      parsed,
      firstSession,
      workout,
      providerLocalTimestamp,
      normalizedLaps,
      normalizedSteps,
      records,
    }),
  };
}

function normalizeLap(lap: Record<string, unknown>, index: number): ParsedActualWorkoutLap {
  return {
    sequence: index + 1,
    workoutStepIndex: integerOrNull(lap.wkt_step_index),
    startedAt: dateTimeOrNull(lap.start_time) ?? dateTimeOrNull(lap.timestamp),
    durationMin: secondsToRoundedMinutes(
      numberOrNull(lap.total_timer_time) ?? numberOrNull(lap.total_elapsed_time),
    ),
    distanceKm: roundNumber(numberOrNull(lap.total_distance), 2),
    avgHeartRate: integerOrNull(lap.avg_heart_rate),
    maxHeartRate: integerOrNull(lap.max_heart_rate),
    avgPower: integerOrNull(lap.avg_power),
    maxPower: integerOrNull(lap.max_power),
    avgCadence: integerOrNull(lap.avg_cadence),
    calories: integerOrNull(lap.total_calories),
    elevationGainM: integerOrNull(lap.total_ascent),
    elevationLossM: integerOrNull(lap.total_descent),
    intensity: stringOrNull(lap.intensity),
    lapTrigger: stringOrNull(lap.lap_trigger),
  };
}

function buildActualSteps(laps: ParsedActualWorkoutLap[]): ParsedActualWorkoutStep[] {
  if (laps.length === 0) {
    return [];
  }

  const hasStructuredIndexes = laps.some((lap) => lap.workoutStepIndex != null);

  if (!hasStructuredIndexes) {
    return laps.map((lap) => ({
      sequence: lap.sequence,
      workoutStepIndex: null,
      lapCount: 1,
      durationMin: lap.durationMin,
      distanceKm: lap.distanceKm,
      avgHeartRate: lap.avgHeartRate,
      maxHeartRate: lap.maxHeartRate,
      avgPower: lap.avgPower,
      maxPower: lap.maxPower,
      avgCadence: lap.avgCadence,
      calories: lap.calories,
      elevationGainM: lap.elevationGainM,
      elevationLossM: lap.elevationLossM,
    }));
  }

  const buckets = new Map<number | null, ParsedActualWorkoutLap[]>();

  for (const lap of laps) {
    const key = lap.workoutStepIndex;
    const bucket = buckets.get(key) ?? [];
    bucket.push(lap);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .sort((left, right) => {
      if (left[0] == null) return 1;
      if (right[0] == null) return -1;
      return left[0] - right[0];
    })
    .map(([workoutStepIndex, groupedLaps], index) => ({
      sequence: index + 1,
      workoutStepIndex,
      lapCount: groupedLaps.length,
      durationMin: sumRounded(groupedLaps.map((lap) => lap.durationMin)),
      distanceKm: sumRounded(groupedLaps.map((lap) => lap.distanceKm)),
      avgHeartRate: weightedAverage(groupedLaps, "avgHeartRate"),
      maxHeartRate: maxInteger(groupedLaps.map((lap) => lap.maxHeartRate)),
      avgPower: weightedAverage(groupedLaps, "avgPower"),
      maxPower: maxInteger(groupedLaps.map((lap) => lap.maxPower)),
      avgCadence: weightedAverage(groupedLaps, "avgCadence"),
      calories: sumIntegers(groupedLaps.map((lap) => lap.calories)),
      elevationGainM: sumIntegers(groupedLaps.map((lap) => lap.elevationGainM)),
      elevationLossM: sumIntegers(groupedLaps.map((lap) => lap.elevationLossM)),
    }));
}

function buildSummaryPayload(args: {
  parsed: Record<string, unknown>;
  firstSession: Record<string, unknown>;
  workout: Record<string, unknown> | null;
  providerLocalTimestamp: string | null;
  normalizedLaps: ParsedActualWorkoutLap[];
  normalizedSteps: ParsedActualWorkoutStep[];
  records: Record<string, unknown>[];
}): Json {
  const {
    parsed,
    firstSession,
    workout,
    providerLocalTimestamp,
    normalizedLaps,
    normalizedSteps,
    records,
  } = args;

  return {
    parser: {
      protocolVersion: numberOrNull(parsed.protocolVersion),
      profileVersion: numberOrNull(parsed.profileVersion),
      recordCount: records.length,
      lapCount: normalizedLaps.length,
      stepCount: normalizedSteps.length,
    },
    workout: workout
      ? {
          name: stringOrNull(workout.wkt_name),
          sport: stringOrNull(workout.sport),
          validStepCount: integerOrNull(workout.num_valid_steps),
        }
      : null,
    session: {
      sport: stringOrNull(firstSession.sport),
      subSport: stringOrNull(firstSession.sub_sport),
      startTime: dateTimeOrNull(firstSession.start_time),
      localStartTime: providerLocalTimestamp,
      localDateSource: providerLocalTimestamp ? "provider_local_timestamp" : null,
      totalDistanceKm: roundNumber(numberOrNull(firstSession.total_distance), 2),
      totalDurationMin: secondsToRoundedMinutes(
        numberOrNull(firstSession.total_timer_time) ??
          numberOrNull(firstSession.total_elapsed_time),
      ),
      avgHeartRate: integerOrNull(firstSession.avg_heart_rate),
      maxHeartRate: integerOrNull(firstSession.max_heart_rate),
      avgPower: integerOrNull(firstSession.avg_power),
      maxPower: integerOrNull(firstSession.max_power),
      avgCadence: integerOrNull(firstSession.avg_cadence),
      calories: integerOrNull(firstSession.total_calories),
    },
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value && typeof value === "object" && "value" in value) {
    const nested = (value as { value?: unknown }).value;
    return typeof nested === "number" && Number.isFinite(nested) ? nested : null;
  }

  return null;
}

function integerOrNull(value: unknown) {
  const numeric = numberOrNull(value);
  return numeric == null ? null : Math.round(numeric);
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function dateTimeOrNull(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
}

function secondsToRoundedMinutes(value: number | null) {
  if (value == null) {
    return null;
  }

  return roundNumber(value / 60, 2);
}

function roundNumber(value: number | null, digits: number) {
  if (value == null) {
    return null;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function sumRounded(values: Array<number | null>) {
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  return total > 0 ? roundNumber(total, 2) : null;
}

function sumIntegers(values: Array<number | null>) {
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  return total > 0 ? Math.round(total) : null;
}

function maxInteger(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => value != null);
  return filtered.length > 0 ? Math.max(...filtered) : null;
}

function weightedAverage(
  laps: ParsedActualWorkoutLap[],
  key: "avgHeartRate" | "avgPower" | "avgCadence",
) {
  let totalWeight = 0;
  let totalValue = 0;

  for (const lap of laps) {
    const value = lap[key];
    const weight = lap.durationMin ?? 0;

    if (value == null || weight <= 0) {
      continue;
    }

    totalWeight += weight;
    totalValue += value * weight;
  }

  return totalWeight > 0 ? Math.round(totalValue / totalWeight) : null;
}

function countDistinctWorkoutStepIndexes(laps: ParsedActualWorkoutLap[]) {
  const indexes = new Set<number>();

  for (const lap of laps) {
    if (lap.workoutStepIndex != null) {
      indexes.add(lap.workoutStepIndex);
    }
  }

  return indexes.size > 0 ? indexes.size : null;
}

function toIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}
