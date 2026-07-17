import type { TrainingPlanV2 } from "@/lib/imported-plan";
import { selectedDistanceEndpointMainDistanceMeters } from "@/lib/plan-creation-engine/selected-distance-endpoint";
import { diffDaysIso, startOfWeekIso } from "@/lib/training";

const MARATHON_TAPER_QUALITY_PROXIMITY_DAYS = 14;
const MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES = 45;
const MARATHON_MAX_DAY_BEFORE_LOAD_MINUTES = 25;

export type RunnerFacingRichnessCanonicalRow = TrainingPlanV2["planned_workouts"][number];

export interface RunnerFacingRichnessInput<Row> {
  distanceMeters: number | null;
  rows: readonly Row[];
}

type LoadSafetyRow = {
  date: string;
  weekNumber: number;
  isRestDay: boolean;
  sourceKey: string;
  signal: "easy" | "recovery" | "long" | "hard" | "endpoint" | "other";
  rowLoadMinutes: number;
  endpointDistanceMeters: number | null;
};

export function collectRunnerFacingCanonicalRichnessIssues(
  input: RunnerFacingRichnessInput<RunnerFacingRichnessCanonicalRow>,
) {
  if ((input.distanceMeters ?? 0) < 42_195) {
    return [];
  }

  const rows = input.rows.map(normalizeCanonicalRow);
  const endpointRow = [...rows]
    .reverse()
    .find(
      (row) =>
        row.signal === "endpoint" && (row.endpointDistanceMeters ?? 0) >= 42_195 && !row.isRestDay,
    );

  if (!endpointRow) {
    return [];
  }

  return collectMarathonRaceWeekLoadIssues(rows, endpointRow);
}

export function isHardRunnerFacingRichnessIssue(issue: string) {
  return /marathon_race_week_load_scan|marathon_race_week_taper_scan|marathon_day_before_scan/i.test(
    issue,
  );
}

function collectMarathonRaceWeekLoadIssues(
  rows: readonly LoadSafetyRow[],
  endpointRow: LoadSafetyRow,
) {
  const issues: string[] = [];
  const raceWeekRows = rows.filter((row) => isRaceWeekPreEndpointRow(endpointRow, row));
  const raceWeekLoad = raceWeekRows.reduce((total, row) => total + row.rowLoadMinutes, 0);

  if (raceWeekLoad > MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES) {
    issues.push(
      `Marathon-distance safety gate failed marathon_race_week_load_scan: total pre-endpoint race-week load ${Math.round(raceWeekLoad)} min across ${raceWeekRows.length} row(s) is above ${MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES} min.`,
    );
  }

  for (const row of rows) {
    if (row.isRestDay || row === endpointRow || row.weekNumber > endpointRow.weekNumber) {
      continue;
    }

    const daysUntilEndpoint = safeDaysUntilEndpoint(endpointRow, row);
    const inRaceWeek = isRaceWeekPreEndpointRow(endpointRow, row);
    const inTaperWindow =
      inRaceWeek ||
      (daysUntilEndpoint != null &&
        daysUntilEndpoint > 0 &&
        daysUntilEndpoint <= MARATHON_TAPER_QUALITY_PROXIMITY_DAYS);

    if (inTaperWindow && row.signal === "hard") {
      issues.push(
        `Marathon-distance safety gate failed marathon_race_week_taper_scan: ${describeRow(row)} places ${row.sourceKey} inside the final ${MARATHON_TAPER_QUALITY_PROXIMITY_DAYS} days before the endpoint.`,
      );
    }

    if (inRaceWeek && !["easy", "recovery", "other"].includes(row.signal)) {
      issues.push(
        `Marathon-distance safety gate failed marathon_race_week_taper_scan: ${describeRow(row)} is not easy/recovery/rest before the marathon endpoint.`,
      );
    }

    if (inRaceWeek && row.rowLoadMinutes > MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES) {
      issues.push(
        `Marathon-distance safety gate failed marathon_race_week_load_scan: ${describeRow(row)} is ${Math.round(row.rowLoadMinutes)} min, above ${MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES} min in race week.`,
      );
    }

    if (
      daysUntilEndpoint === 1 &&
      (!["easy", "recovery", "other"].includes(row.signal) ||
        row.rowLoadMinutes > MARATHON_MAX_DAY_BEFORE_LOAD_MINUTES)
    ) {
      issues.push(
        `Marathon-distance safety gate failed marathon_day_before_scan: ${describeRow(row)} must be rest or a short easy shakeout before the endpoint.`,
      );
    }
  }

  return issues;
}

function normalizeCanonicalRow(row: RunnerFacingRichnessCanonicalRow): LoadSafetyRow {
  const sourceKey = [row.source_workout_type, row.workout_identity, row.workout_family, row.title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const endpointDistanceMeters = selectedDistanceEndpointMainDistanceMeters({
    endpointKind: row.source_workout_type,
    segments: row.segments,
  });

  return {
    date: row.date,
    weekNumber: row.week_number,
    isRestDay: row.workout_type === "rest",
    sourceKey,
    signal: classifySignal(sourceKey, endpointDistanceMeters),
    rowLoadMinutes: rowLoadMinutes(row.segments),
    endpointDistanceMeters,
  };
}

function classifySignal(sourceKey: string, endpointDistanceMeters: number | null) {
  if (endpointDistanceMeters != null) return "endpoint" as const;
  if (/recovery/.test(sourceKey)) return "recovery" as const;
  if (/easy|shakeout|support/.test(sourceKey)) return "easy" as const;
  if (/interval|tempo|threshold|hill|progression|quality|steady_finish|race_pace/.test(sourceKey)) {
    return "hard" as const;
  }
  if (/long|durability|time_on_feet/.test(sourceKey)) return "long" as const;
  return "other" as const;
}

function isRaceWeekPreEndpointRow(endpointRow: LoadSafetyRow, row: LoadSafetyRow) {
  if (row.isRestDay || row === endpointRow || row.weekNumber > endpointRow.weekNumber) {
    return false;
  }

  return row.date >= startOfWeekIso(endpointRow.date) && row.date < endpointRow.date;
}

function safeDaysUntilEndpoint(endpointRow: LoadSafetyRow, row: LoadSafetyRow) {
  try {
    return diffDaysIso(endpointRow.date, row.date);
  } catch {
    return null;
  }
}

function describeRow(row: LoadSafetyRow) {
  return `${row.date} week ${row.weekNumber}`;
}

function rowLoadMinutes(value: unknown) {
  return collectPrescriptions(value).reduce(
    (total, prescription) => total + prescriptionLoadMinutes(prescription),
    0,
  );
}

function collectPrescriptions(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) =>
    isRecord(entry) && "prescription" in entry ? [entry.prescription] : [],
  );
}

function prescriptionLoadMinutes(value: unknown): number {
  if (!isRecord(value)) {
    return 0;
  }

  if (value.mode === "time") {
    return typeof value.duration_min === "number" ? value.duration_min : 0;
  }

  if (value.mode === "distance") {
    return typeof value.distance_km === "number" ? value.distance_km * 6 : 0;
  }

  if (value.mode !== "repeats") {
    return 0;
  }

  const repeatCount = typeof value.repeat_count === "number" ? value.repeat_count : 1;
  const children = Array.isArray(value.children) ? value.children : [];
  const childMinutes = children.reduce(
    (total, child) => total + (isRecord(child) ? prescriptionLoadMinutes(child.prescription) : 0),
    0,
  );

  return repeatCount * childMinutes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
