import type { TrainingPlanV2 } from "@/lib/imported-plan";
import type {
  RunningPlanDistanceFamily,
  RunningPlanRunnerLevel,
} from "@/lib/plan-creation-engine/source-types";
import { selectedDistanceEndpointMainDistanceMeters } from "@/lib/plan-creation-engine/selected-distance-endpoint";
import type { RunningPlanPreviewLoadContext } from "@/lib/plan-creation-engine/preview-builder-shared";
import { diffDaysIso, startOfWeekIso } from "@/lib/training";

export const RUNNER_FACING_RICHNESS_GATE_VERSION = "runner_facing_richness_gate_v1" as const;

type RichnessSupportBand = "beginner_or_conservative" | "supported";
type HorizonBucket = "short" | "medium" | "long" | "very_long";
type RunnerFacingSignal =
  | "adaptation"
  | "strides"
  | "steady_aerobic_run"
  | "progression"
  | "tempo"
  | "half_specific_durability"
  | "threshold"
  | "intervals"
  | "hills"
  | "quality_session";
type LongRunSignal =
  | "long_run"
  | "long_run_with_steady_finish"
  | "cutback_long_run"
  | "taper_long_run"
  | "base_endpoint"
  | "selected_distance_endpoint"
  | "trail_long_run";

const MARATHON_MINIMUM_PRE_TAPER_LONG_RUN_PEAK_MINUTES = 150;
const MARATHON_TAPER_QUALITY_PROXIMITY_DAYS = 14;
const MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES = 45;
const MARATHON_MAX_DAY_BEFORE_LOAD_MINUTES = 25;

export interface RunnerFacingRichnessPreviewRow {
  date?: string | null;
  weekNumber: number;
  isRestDay: boolean;
  workoutDayKind?: string | null;
  title?: string | null;
  endpointDistanceMeters?: number | null;
  segments?: unknown;
}

export type RunnerFacingRichnessCanonicalRow = TrainingPlanV2["planned_workouts"][number];

export interface RunnerFacingRichnessInput<Row> {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  rows: readonly Row[];
}

export interface RunnerFacingRichnessSummary {
  gateVersion: typeof RUNNER_FACING_RICHNESS_GATE_VERSION;
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  horizonWeeks: number;
  supportBand: RichnessSupportBand;
  horizonBucket: HorizonBucket;
  maxAllowedIdentityDesertWeeks: number;
  longestIdentityDesertWeeks: number;
  nonLongRunSignalPlacements: number;
  nonLongRunSignalPlacementsAfterMidpoint: number;
  bridgeSignalPlacementsInSecondThird: number;
  bridgeSignalPlacementsInThirdThird: number;
  repeatRichWorkoutCount: number;
  longRunProgressionAssessed: boolean;
  longRunProgressionRatio: number | null;
  longRunProgressionDeltaMinutes: number | null;
  distinctNonLongRunSignals: readonly RunnerFacingSignal[];
  distinctLongRunSignals: readonly LongRunSignal[];
  longestRepeatedWeekShells: number;
  repeatedWeekShellSample: string | null;
  missingSourceWorkoutTypeCount: number;
  issues: readonly string[];
}

type NormalizedRichnessRow = {
  date: string | null;
  weekNumber: number;
  isRestDay: boolean;
  nonLongRunSignal: RunnerFacingSignal | null;
  longRunSignal: LongRunSignal | null;
  weekShellPart: string;
  sourceWorkoutTypeMissing: boolean;
  hasRepeatRichChildren: boolean;
  rowLoadMinutes: number | null;
  longRunLoadMinutes: number | null;
  endpointDistanceMeters: number | null;
  signalKey: string | null;
};

export function collectRunnerFacingPreviewRichnessIssues(
  input: RunnerFacingRichnessInput<RunnerFacingRichnessPreviewRow>,
) {
  return summarizeRunnerFacingPreviewRichness(input).issues;
}

export function collectRunnerFacingCanonicalRichnessIssues(
  input: RunnerFacingRichnessInput<RunnerFacingRichnessCanonicalRow>,
) {
  return summarizeRunnerFacingCanonicalRichness(input).issues;
}

export function summarizeRunnerFacingPreviewRichness(
  input: RunnerFacingRichnessInput<RunnerFacingRichnessPreviewRow>,
): RunnerFacingRichnessSummary {
  return summarizeRunnerFacingRichness({
    ...input,
    rows: input.rows.map(normalizePreviewRow),
  });
}

export function summarizeRunnerFacingCanonicalRichness(
  input: RunnerFacingRichnessInput<RunnerFacingRichnessCanonicalRow>,
): RunnerFacingRichnessSummary {
  return summarizeRunnerFacingRichness({
    ...input,
    rows: input.rows.map(normalizeCanonicalRow),
  });
}

function summarizeRunnerFacingRichness(input: {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  rows: readonly NormalizedRichnessRow[];
}): RunnerFacingRichnessSummary {
  const horizonWeeks = maxWeekNumber(input.rows);
  const supportBand = resolveSupportBand(input);
  const horizonBucket = resolveHorizonBucket(horizonWeeks);
  const protectedAdaptationWeeks = conservativeNoBenchmarkAdaptationWeeks({
    family: input.family,
    supportBand,
    horizonWeeks,
  });
  const maxAllowedIdentityDesertWeeks = maxAllowedIdentityDesert({
    family: input.family,
    supportBand,
    horizonBucket,
  });
  const weekSignalSummaries = buildWeekSignalSummaries(input.rows, horizonWeeks);
  const longestIdentityDesertWeeks = longestBooleanRun(
    weekSignalSummaries.map(
      (week) => week.weekNumber > protectedAdaptationWeeks && !week.hasNonLongRunSignal,
    ),
  );
  const nonLongRunSignals = input.rows
    .map((row) => row.nonLongRunSignal)
    .filter((signal): signal is RunnerFacingSignal => Boolean(signal));
  const nonLongRunSignalPlacements = nonLongRunSignals.length;
  const distinctNonLongRunSignals = uniqueStrings(nonLongRunSignals) as RunnerFacingSignal[];
  const distinctLongRunSignals = uniqueStrings(
    input.rows
      .map((row) => row.longRunSignal)
      .filter((signal): signal is LongRunSignal => Boolean(signal)),
  ) as LongRunSignal[];
  const nonLongRunSignalPlacementsAfterMidpoint = input.rows.filter(
    (row) => row.nonLongRunSignal && row.weekNumber > Math.floor(horizonWeeks / 2),
  ).length;
  const bridgeSignalPlacementsInSecondThird = input.rows.filter(
    (row) =>
      row.nonLongRunSignal &&
      signalIsBridge(row.nonLongRunSignal) &&
      weekIsInSecondThird(row.weekNumber, horizonWeeks),
  ).length;
  const bridgeSignalPlacementsInThirdThird = input.rows.filter(
    (row) =>
      row.nonLongRunSignal &&
      signalIsBridge(row.nonLongRunSignal) &&
      weekIsInThirdThird(row.weekNumber, horizonWeeks),
  ).length;
  const repeatRichWorkoutCount = input.rows.filter(
    (row) => !row.isRestDay && row.hasRepeatRichChildren,
  ).length;
  const longRunProgression = summarizeLongRunProgression(input.rows);
  const repeatedShellSummary = summarizeRepeatedWeekShells(input.rows, horizonWeeks);
  const missingSourceWorkoutTypeCount = input.rows.filter(
    (row) => row.sourceWorkoutTypeMissing,
  ).length;
  const issues = collectRichnessIssues({
    family: input.family,
    runnerLevel: input.runnerLevel,
    loadContext: input.loadContext,
    supportBand,
    horizonBucket,
    horizonWeeks,
    maxAllowedIdentityDesertWeeks,
    longestIdentityDesertWeeks,
    nonLongRunSignalPlacements,
    nonLongRunSignalPlacementsAfterMidpoint,
    bridgeSignalPlacementsInSecondThird,
    bridgeSignalPlacementsInThirdThird,
    repeatRichWorkoutCount,
    longRunProgressionAssessed: longRunProgression.assessed,
    longRunProgressionRatio: longRunProgression.progressionRatio,
    longRunProgressionDeltaMinutes: longRunProgression.deltaMinutes,
    distinctNonLongRunSignals,
    distinctLongRunSignals,
    longestRepeatedWeekShells: repeatedShellSummary.longestRepeatedWeekShells,
    missingSourceWorkoutTypeCount,
    rows: input.rows,
  });

  return {
    gateVersion: RUNNER_FACING_RICHNESS_GATE_VERSION,
    family: input.family,
    runnerLevel: input.runnerLevel,
    loadContext: input.loadContext,
    horizonWeeks,
    supportBand,
    horizonBucket,
    maxAllowedIdentityDesertWeeks,
    longestIdentityDesertWeeks,
    nonLongRunSignalPlacements,
    nonLongRunSignalPlacementsAfterMidpoint,
    bridgeSignalPlacementsInSecondThird,
    bridgeSignalPlacementsInThirdThird,
    repeatRichWorkoutCount,
    longRunProgressionAssessed: longRunProgression.assessed,
    longRunProgressionRatio: longRunProgression.progressionRatio,
    longRunProgressionDeltaMinutes: longRunProgression.deltaMinutes,
    distinctNonLongRunSignals,
    distinctLongRunSignals,
    longestRepeatedWeekShells: repeatedShellSummary.longestRepeatedWeekShells,
    repeatedWeekShellSample: repeatedShellSummary.repeatedWeekShellSample,
    missingSourceWorkoutTypeCount,
    issues,
  };
}

function collectRichnessIssues(input: {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  supportBand: RichnessSupportBand;
  horizonBucket: HorizonBucket;
  horizonWeeks: number;
  maxAllowedIdentityDesertWeeks: number;
  longestIdentityDesertWeeks: number;
  nonLongRunSignalPlacements: number;
  nonLongRunSignalPlacementsAfterMidpoint: number;
  bridgeSignalPlacementsInSecondThird: number;
  bridgeSignalPlacementsInThirdThird: number;
  repeatRichWorkoutCount: number;
  longRunProgressionAssessed: boolean;
  longRunProgressionRatio: number | null;
  longRunProgressionDeltaMinutes: number | null;
  distinctNonLongRunSignals: readonly RunnerFacingSignal[];
  distinctLongRunSignals: readonly LongRunSignal[];
  longestRepeatedWeekShells: number;
  missingSourceWorkoutTypeCount: number;
  rows: readonly NormalizedRichnessRow[];
}) {
  const issues: string[] = [];
  const signalFloor = resolveSignalFloor(input);
  const conservativeEasyLongOnlyAllowed = allowsConservativeEasyLongOnly(input);
  const lowSupportDistinctTwoCoveredByLongRunRichness =
    signalFloor.requiresLongRunRichnessForLowSupportDistinctTwo &&
    input.distinctNonLongRunSignals.length === 2 &&
    input.distinctLongRunSignals.length >= 3;

  if (
    !conservativeEasyLongOnlyAllowed &&
    input.longestIdentityDesertWeeks > input.maxAllowedIdentityDesertWeeks
  ) {
    issues.push(
      `${input.family} runner-facing richness gate failed identity_desert_scan: ${input.longestIdentityDesertWeeks} consecutive weeks without non-long-run signal exceeds ${input.maxAllowedIdentityDesertWeeks}.`,
    );
  }

  if (
    !conservativeEasyLongOnlyAllowed &&
    input.nonLongRunSignalPlacements < signalFloor.minimumPlacements
  ) {
    issues.push(
      `${input.family} runner-facing richness gate failed family_signal_floor_scan: ${input.nonLongRunSignalPlacements} non-long-run signal placements is below ${signalFloor.minimumPlacements}.`,
    );
  }

  if (
    !conservativeEasyLongOnlyAllowed &&
    input.distinctNonLongRunSignals.length < signalFloor.minimumDistinctSignals &&
    !lowSupportDistinctTwoCoveredByLongRunRichness
  ) {
    issues.push(
      `${input.family} runner-facing richness gate failed family_signal_floor_scan: ${input.distinctNonLongRunSignals.join(", ") || "none"} has fewer than ${signalFloor.minimumDistinctSignals} distinct non-long-run signals.`,
    );
  }

  if (
    !conservativeEasyLongOnlyAllowed &&
    signalFloor.minimumPlacementsAfterMidpoint > 0 &&
    input.nonLongRunSignalPlacementsAfterMidpoint < signalFloor.minimumPlacementsAfterMidpoint
  ) {
    issues.push(
      `${input.family} runner-facing richness gate failed identity_desert_scan: ${input.nonLongRunSignalPlacementsAfterMidpoint} post-midpoint non-long-run signals is below ${signalFloor.minimumPlacementsAfterMidpoint}.`,
    );
  }

  if (
    signalFloor.requiresLongRunRichnessForLowSupportDistinctTwo &&
    input.distinctNonLongRunSignals.length === 2 &&
    input.distinctLongRunSignals.length < 3
  ) {
    issues.push(
      `${input.family} runner-facing richness gate failed long_run_only_richness_scan: two non-long-run identities require at least three long-run roles for low-support long horizons.`,
    );
  }

  if (input.longestRepeatedWeekShells > input.maxAllowedIdentityDesertWeeks + 1) {
    issues.push(
      `${input.family} runner-facing richness gate failed runner_facing_title_repetition_scan: ${input.longestRepeatedWeekShells} consecutive weeks share the same visible workout shell.`,
    );
  }

  if (input.missingSourceWorkoutTypeCount > 0) {
    issues.push(
      `${input.family} runner-facing richness gate failed source_workout_type_fallback_scan: ${input.missingSourceWorkoutTypeCount} canonical non-rest rows lack source_workout_type.`,
    );
  }

  if (requiresRepeatRichQuality(input) && input.repeatRichWorkoutCount < 1) {
    issues.push(
      `${input.family} runner-facing richness gate failed repeat_rich_quality_scan: supported distance-goal plans require at least one structural Repeat set with ordered children[].`,
    );
  }

  if (
    requiresLongRunProgression(input) &&
    input.longRunProgressionAssessed &&
    ((input.longRunProgressionRatio ?? 0) < 1.15 ||
      (input.longRunProgressionDeltaMinutes ?? 0) < 12)
  ) {
    issues.push(
      `${input.family} runner-facing richness gate failed long_run_progression_scan: pre-endpoint long-run peak must build meaningfully beyond early baseline before taper.`,
    );
  }

  if (input.family === "Marathon Completion") {
    issues.push(...collectMarathonCompletionReadinessIssues(input.rows));
  }

  issues.push(...collectEarlyPhaseLoadDensityIssues(input));

  issues.push(
    ...collectFamilySignalIssues({
      ...input,
      lowSupportDistinctTwoCoveredByLongRunRichness,
      conservativeEasyLongOnlyAllowed,
    }),
  );

  return issues;
}

function collectFamilySignalIssues(input: {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  supportBand: RichnessSupportBand;
  horizonWeeks: number;
  distinctNonLongRunSignals: readonly RunnerFacingSignal[];
  bridgeSignalPlacementsInSecondThird: number;
  bridgeSignalPlacementsInThirdThird: number;
  lowSupportDistinctTwoCoveredByLongRunRichness: boolean;
  conservativeEasyLongOnlyAllowed: boolean;
}) {
  const issues: string[] = [];
  const signals = new Set(input.distinctNonLongRunSignals);
  const shortConservativeHorizon = usesShortConservativeHorizonFloor(input);

  if (input.family === "10K") {
    if (
      !input.conservativeEasyLongOnlyAllowed &&
      !shortConservativeHorizon &&
      !signals.has("strides")
    ) {
      issues.push("10K runner-facing richness gate requires visible stride/turnover support.");
    }
    if (input.supportBand === "supported" && !signals.has("tempo") && !signals.has("intervals")) {
      issues.push("Supported 10K runner-facing richness gate requires tempo or interval signal.");
    }
  }

  if (input.family === "Half Marathon") {
    if (
      !signals.has("tempo") &&
      !signals.has("half_specific_durability") &&
      !signals.has("threshold") &&
      !signals.has("progression") &&
      !input.lowSupportDistinctTwoCoveredByLongRunRichness
    ) {
      issues.push(
        "Half Marathon runner-facing richness gate requires sustained durability beyond generic easy running.",
      );
    }
    if (
      input.supportBand === "supported" &&
      !signals.has("half_specific_durability") &&
      !signals.has("threshold") &&
      !signals.has("progression")
    ) {
      issues.push(
        "Supported Half Marathon runner-facing richness gate requires visible half-specific durability, progression, or threshold support beyond generic tempo.",
      );
    }
  }

  if (input.family === "Marathon Completion") {
    if (!signals.has("steady_aerobic_run") && !signals.has("progression")) {
      issues.push(
        "Marathon Completion runner-facing richness gate requires visible steady or progression support.",
      );
    }
    if (
      input.supportBand === "supported" &&
      input.runnerLevel === "professional_competitive" &&
      input.horizonWeeks >= 20 &&
      !signals.has("tempo")
    ) {
      issues.push(
        "Supported professional Marathon Completion runner-facing richness gate requires late controlled tempo support without race-pace claims.",
      );
    }
  }

  return issues;
}

function collectMarathonCompletionReadinessIssues(rows: readonly NormalizedRichnessRow[]) {
  const issues: string[] = [];
  const endpointRow = [...rows]
    .reverse()
    .find((row) => !row.isRestDay && row.longRunSignal === "selected_distance_endpoint");

  if (!endpointRow) {
    return issues;
  }

  if ((endpointRow.endpointDistanceMeters ?? 0) < 42_195) {
    return issues;
  }

  const preTaperLongRunPeakMinutes = Math.max(
    0,
    ...rows
      .filter(
        (row) =>
          !row.isRestDay &&
          row.weekNumber < endpointRow.weekNumber &&
          row.longRunSignal &&
          row.longRunSignal !== "selected_distance_endpoint" &&
          row.longRunSignal !== "taper_long_run" &&
          row.longRunLoadMinutes != null,
      )
      .map((row) => row.longRunLoadMinutes ?? 0),
  );

  if (preTaperLongRunPeakMinutes < MARATHON_MINIMUM_PRE_TAPER_LONG_RUN_PEAK_MINUTES) {
    issues.push(
      `Marathon Completion runner-facing richness gate failed marathon_long_run_floor_scan: pre-taper long-run peak ${Math.round(preTaperLongRunPeakMinutes)} min is below ${MARATHON_MINIMUM_PRE_TAPER_LONG_RUN_PEAK_MINUTES} min before the 42.195 km endpoint.`,
    );
  }

  const raceWeekPreEndpointRows = rows.filter((row) =>
    isMarathonRaceWeekPreEndpointRow(endpointRow, row),
  );
  const raceWeekPreEndpointLoadMinutes = raceWeekPreEndpointRows.reduce(
    (total, row) => total + (row.rowLoadMinutes ?? 0),
    0,
  );

  if (raceWeekPreEndpointLoadMinutes > MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES) {
    issues.push(
      `Marathon Completion runner-facing richness gate failed marathon_race_week_load_scan: total pre-endpoint race-week load ${Math.round(raceWeekPreEndpointLoadMinutes)} min across ${raceWeekPreEndpointRows.length} row(s) is above ${MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES} min.`,
    );
  }

  for (const row of rows) {
    if (row.isRestDay || row === endpointRow || row.weekNumber > endpointRow.weekNumber) {
      continue;
    }

    const daysUntilEndpoint = daysUntilEndpointRow(endpointRow, row);
    const inRaceWeek = isMarathonRaceWeekPreEndpointRow(endpointRow, row);
    const inTaperProximity =
      inRaceWeek ||
      (daysUntilEndpoint != null &&
        daysUntilEndpoint > 0 &&
        daysUntilEndpoint <= MARATHON_TAPER_QUALITY_PROXIMITY_DAYS);

    if (inTaperProximity && isForbiddenMarathonTaperQuality(row)) {
      issues.push(
        `Marathon Completion runner-facing richness gate failed marathon_race_week_taper_scan: ${describeRichnessRow(row)} places ${describeRowSignal(row)} inside the final ${MARATHON_TAPER_QUALITY_PROXIMITY_DAYS} days before the endpoint.`,
      );
    }

    if (inRaceWeek && isUnsafeMarathonRaceWeekSignal(row)) {
      issues.push(
        `Marathon Completion runner-facing richness gate failed marathon_race_week_taper_scan: ${describeRichnessRow(row)} is not easy/recovery/rest before the marathon endpoint.`,
      );
    }

    if (
      inRaceWeek &&
      (row.rowLoadMinutes ?? 0) > MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES
    ) {
      issues.push(
        `Marathon Completion runner-facing richness gate failed marathon_race_week_load_scan: ${describeRichnessRow(row)} is ${Math.round(row.rowLoadMinutes ?? 0)} min, above ${MARATHON_MAX_RACE_WEEK_PRE_ENDPOINT_LOAD_MINUTES} min in race week.`,
      );
    }

    if (
      daysUntilEndpoint === 1 &&
      (row.nonLongRunSignal ||
        row.longRunSignal ||
        (row.rowLoadMinutes ?? 0) > MARATHON_MAX_DAY_BEFORE_LOAD_MINUTES)
    ) {
      issues.push(
        `Marathon Completion runner-facing richness gate failed marathon_day_before_scan: ${describeRichnessRow(row)} must be rest or a short easy shakeout before the endpoint.`,
      );
    }
  }

  return issues;
}

function isMarathonRaceWeekPreEndpointRow(
  endpointRow: NormalizedRichnessRow,
  row: NormalizedRichnessRow,
) {
  if (row.isRestDay || row === endpointRow || row.weekNumber > endpointRow.weekNumber) {
    return false;
  }

  if (endpointRow.date && row.date) {
    const raceWeekStart = startOfWeekIso(endpointRow.date);

    return row.date >= raceWeekStart && row.date < endpointRow.date;
  }

  return row.weekNumber === endpointRow.weekNumber;
}

function daysUntilEndpointRow(endpointRow: NormalizedRichnessRow, row: NormalizedRichnessRow) {
  if (!endpointRow.date || !row.date) {
    return null;
  }

  try {
    return diffDaysIso(endpointRow.date, row.date);
  } catch {
    return null;
  }
}

function isForbiddenMarathonTaperQuality(row: NormalizedRichnessRow) {
  return (
    row.longRunSignal === "long_run_with_steady_finish" ||
    row.nonLongRunSignal === "progression" ||
    row.nonLongRunSignal === "tempo" ||
    row.nonLongRunSignal === "threshold" ||
    row.nonLongRunSignal === "intervals" ||
    row.nonLongRunSignal === "hills" ||
    row.nonLongRunSignal === "quality_session"
  );
}

function isUnsafeMarathonRaceWeekSignal(row: NormalizedRichnessRow) {
  return (
    isForbiddenMarathonTaperQuality(row) ||
    row.nonLongRunSignal === "steady_aerobic_run" ||
    row.longRunSignal === "long_run" ||
    row.longRunSignal === "long_run_with_steady_finish" ||
    row.longRunSignal === "trail_long_run"
  );
}

function describeRichnessRow(row: NormalizedRichnessRow) {
  const date = row.date ? `${row.date} ` : "";
  return `${date}week ${row.weekNumber}`;
}

function describeRowSignal(row: NormalizedRichnessRow) {
  return row.nonLongRunSignal ?? row.longRunSignal ?? "training load";
}

function allowsConservativeEasyLongOnly(input: {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  supportBand: RichnessSupportBand;
}) {
  return (
    input.family === "10K" &&
    input.runnerLevel === "beginner_new_runner" &&
    input.loadContext === "conservative" &&
    input.supportBand === "beginner_or_conservative"
  );
}

function conservativeNoBenchmarkAdaptationWeeks(input: {
  family: RunningPlanDistanceFamily;
  supportBand: RichnessSupportBand;
  horizonWeeks: number;
}) {
  if (input.supportBand !== "beginner_or_conservative" || input.family === "10K") {
    return 0;
  }

  return Math.min(4, Math.max(0, input.horizonWeeks - 1));
}

function resolveSignalFloor(input: {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  supportBand: RichnessSupportBand;
  horizonWeeks: number;
}) {
  let minimumPlacements = 2;
  let minimumDistinctSignals = 2;
  let minimumPlacementsAfterMidpoint = 0;

  if (input.horizonWeeks <= 12) {
    minimumPlacements = input.supportBand === "beginner_or_conservative" ? 1 : 2;
    minimumDistinctSignals = input.supportBand === "beginner_or_conservative" ? 1 : 2;
  } else if (input.horizonWeeks <= 16) {
    minimumPlacements = 3;
    minimumDistinctSignals = 2;
  } else if (input.horizonWeeks <= 20) {
    minimumPlacements = 3;
    minimumDistinctSignals = 2;
  } else if (input.horizonWeeks <= 24) {
    minimumPlacements = 4;
    minimumDistinctSignals = input.supportBand === "supported" ? 3 : 2;
    minimumPlacementsAfterMidpoint = 1;
  } else if (input.horizonWeeks <= 32) {
    minimumPlacements = 5;
    minimumDistinctSignals = 3;
    minimumPlacementsAfterMidpoint = 1;
  } else if (input.horizonWeeks <= 40) {
    minimumPlacements = 6;
    minimumDistinctSignals = 3;
    minimumPlacementsAfterMidpoint = 2;
  } else {
    minimumPlacements = 8;
    minimumDistinctSignals = 3;
    minimumPlacementsAfterMidpoint = 2;
  }

  if (input.family === "10K" && input.runnerLevel === "beginner_new_runner") {
    minimumDistinctSignals = 1;
  }

  if (input.family === "Marathon Completion" && input.supportBand === "beginner_or_conservative") {
    minimumDistinctSignals = 1;
  }

  return {
    minimumPlacements,
    minimumDistinctSignals,
    minimumPlacementsAfterMidpoint,
    requiresLongRunRichnessForLowSupportDistinctTwo:
      input.supportBand === "beginner_or_conservative" && input.horizonWeeks >= 24,
  };
}

function usesShortConservativeHorizonFloor(input: {
  supportBand: RichnessSupportBand;
  horizonWeeks: number;
}) {
  return input.supportBand === "beginner_or_conservative" && input.horizonWeeks <= 12;
}

function requiresRepeatRichQuality(input: {
  supportBand: RichnessSupportBand;
  horizonWeeks: number;
}) {
  return input.supportBand === "supported" && input.horizonWeeks >= 8;
}

function requiresLongRunProgression(input: {
  family: RunningPlanDistanceFamily;
  horizonWeeks: number;
}) {
  return input.family !== "10K" && input.horizonWeeks >= 12;
}

function maxAllowedIdentityDesert(input: {
  family: RunningPlanDistanceFamily;
  supportBand: RichnessSupportBand;
  horizonBucket: HorizonBucket;
}) {
  const supported = input.supportBand === "supported";
  const bucket = input.horizonBucket;

  if (input.family === "10K") {
    if (supported) {
      return { short: 2, medium: 2, long: 3, very_long: 3 }[bucket];
    }
    return { short: 2, medium: 3, long: 4, very_long: 4 }[bucket];
  }

  if (input.family === "Half Marathon") {
    if (supported) {
      return { short: 2, medium: 3, long: 3, very_long: 4 }[bucket];
    }
    return { short: 3, medium: 4, long: 4, very_long: 5 }[bucket];
  }

  if (supported) {
    return { short: 2, medium: 3, long: 4, very_long: 4 }[bucket];
  }

  return { short: 3, medium: 4, long: 4, very_long: 5 }[bucket];
}

function normalizePreviewRow(row: RunnerFacingRichnessPreviewRow): NormalizedRichnessRow {
  const signal = normalizeWorkoutKind(row.workoutDayKind ?? null);
  const isRestDay = row.isRestDay;
  const loadMinutes = !isRestDay ? rowLoadMinutes(row.segments) : null;
  const nonLongRunSignal = hasAdaptationEvidence(row.segments)
    ? "adaptation"
    : hasHalfSpecificDurabilityEvidence(row.segments)
      ? "half_specific_durability"
      : signal.nonLongRunSignal;

  return {
    date: row.date ?? null,
    weekNumber: row.weekNumber,
    isRestDay,
    nonLongRunSignal,
    longRunSignal: signal.longRunSignal,
    weekShellPart: isRestDay
      ? "rest"
      : normalizeWeekShellPart(row.workoutDayKind ?? row.title ?? "unknown"),
    sourceWorkoutTypeMissing: false,
    hasRepeatRichChildren: !isRestDay && rowHasRepeatRichChildren(row.segments),
    rowLoadMinutes: loadMinutes,
    longRunLoadMinutes: !isRestDay && signal.longRunSignal ? loadMinutes : null,
    endpointDistanceMeters: row.endpointDistanceMeters ?? null,
    signalKey: row.workoutDayKind ?? row.title ?? null,
  };
}

function normalizeCanonicalRow(row: RunnerFacingRichnessCanonicalRow): NormalizedRichnessRow {
  const sourceKind = row.source_workout_type ?? null;
  const directSignal = normalizeWorkoutKind(sourceKind);
  const identitySignal = normalizeCanonicalIdentity(row.workout_identity ?? null);
  const familySignal = normalizeCanonicalFamily(row.workout_family ?? null);
  const fallbackSignal =
    directSignal.nonLongRunSignal || directSignal.longRunSignal ? directSignal : identitySignal;
  const signal =
    fallbackSignal.nonLongRunSignal || fallbackSignal.longRunSignal ? fallbackSignal : familySignal;
  const isRestDay = row.workout_type === "rest";
  const loadMinutes = !isRestDay ? rowLoadMinutes(row.segments) : null;

  return {
    date: row.date,
    weekNumber: row.week_number,
    isRestDay,
    nonLongRunSignal: isRestDay
      ? null
      : hasAdaptationEvidence(row.segments)
        ? "adaptation"
        : hasHalfSpecificDurabilityEvidence(row.segments)
          ? "half_specific_durability"
          : signal.nonLongRunSignal,
    longRunSignal: isRestDay ? null : signal.longRunSignal,
    weekShellPart: isRestDay
      ? "rest"
      : normalizeWeekShellPart(sourceKind ?? row.workout_identity ?? row.title),
    sourceWorkoutTypeMissing: !isRestDay && !sourceKind,
    hasRepeatRichChildren: !isRestDay && rowHasRepeatRichChildren(row.segments),
    rowLoadMinutes: loadMinutes,
    longRunLoadMinutes: !isRestDay && signal.longRunSignal ? loadMinutes : null,
    endpointDistanceMeters: selectedDistanceEndpointMainDistanceMeters({
      endpointKind: sourceKind,
      segments: row.segments,
    }),
    signalKey: sourceKind ?? row.workout_identity ?? row.title,
  };
}

function collectEarlyPhaseLoadDensityIssues(input: {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
  supportBand: RichnessSupportBand;
  horizonWeeks: number;
  rows: readonly NormalizedRichnessRow[];
}) {
  if (input.supportBand !== "beginner_or_conservative") {
    return [];
  }

  const issues: string[] = [];
  const earlyWindow = Math.min(4, Math.max(1, input.horizonWeeks - 1));
  const earlyRows = input.rows
    .filter((row) => !row.isRestDay && row.weekNumber <= earlyWindow)
    .sort(compareRowsByDateThenWeek);

  const earlyStreak = longestConsecutiveDatedRunDays(earlyRows);
  if (earlyStreak > 2) {
    issues.push(
      `${input.family} runner-facing richness gate failed early_phase_load_density_scan: conservative early phase has ${earlyStreak} consecutive running days; cap is 2.`,
    );
  }

  for (const row of earlyRows) {
    if (row.weekNumber === 1 && isWeekOneConservativeDevelopmentSignal(row)) {
      issues.push(
        `${input.family} runner-facing richness gate failed early_phase_load_density_scan: ${describeRichnessRow(row)} must stay support-only before introducing ${describeRowSignal(row)}.`,
      );
    }

    if (isForbiddenConservativeEarlyHardSignal(input, row)) {
      issues.push(
        `${input.family} runner-facing richness gate failed early_phase_load_density_scan: ${describeRichnessRow(row)} contains ${describeRowSignal(row)} too early for conservative/no-benchmark support.`,
      );
    }

    const rowLoad = row.rowLoadMinutes ?? 0;
    const cap = earlyRowLoadCapMinutes(input, row);
    if (cap != null && rowLoad > cap) {
      issues.push(
        `${input.family} runner-facing richness gate failed early_phase_load_density_scan: ${describeRichnessRow(row)} is ${Math.round(rowLoad)} min, above the conservative early cap of ${cap} min.`,
      );
    }
  }

  return issues;
}

function isWeekOneConservativeDevelopmentSignal(row: NormalizedRichnessRow) {
  return Boolean(row.nonLongRunSignal && row.nonLongRunSignal !== "adaptation");
}

function isForbiddenConservativeEarlyHardSignal(
  input: {
    family: RunningPlanDistanceFamily;
    supportBand: RichnessSupportBand;
  },
  row: NormalizedRichnessRow,
) {
  const signal = row.nonLongRunSignal;
  const key = row.signalKey ?? "";

  if (
    signal === "threshold" ||
    signal === "tempo" ||
    signal === "intervals" ||
    signal === "hills" ||
    signal === "quality_session" ||
    /half_marathon_threshold_durability|time_intervals|distance_intervals|race_pace_session/i.test(
      key,
    )
  ) {
    return true;
  }

  if (
    input.family !== "10K" &&
    row.weekNumber <= 4 &&
    (signal === "progression" || /progression_run|controlled_tempo_session/i.test(key))
  ) {
    return true;
  }

  if (
    input.family === "10K" &&
    row.weekNumber <= 4 &&
    /10k_rhythm_intervals|controlled_tempo_session/i.test(key)
  ) {
    return true;
  }

  if (
    input.family === "Marathon Completion" &&
    row.weekNumber < 6 &&
    (row.longRunSignal === "long_run_with_steady_finish" ||
      /marathon_steady_specificity|long_run_with_steady_finish/i.test(key))
  ) {
    return true;
  }

  return false;
}

function earlyRowLoadCapMinutes(
  input: {
    family: RunningPlanDistanceFamily;
  },
  row: NormalizedRichnessRow,
) {
  if (row.weekNumber !== 1) {
    return null;
  }

  if (row.longRunSignal) {
    switch (input.family) {
      case "10K":
        return 35;
      case "Half Marathon":
        return 55;
      case "Marathon Completion":
        return 65;
    }
  }

  switch (input.family) {
    case "10K":
      return 30;
    case "Half Marathon":
      return 45;
    case "Marathon Completion":
      return 55;
  }
}

function longestConsecutiveDatedRunDays(rows: readonly NormalizedRichnessRow[]) {
  let longest = 0;
  let current = 0;
  let previousDate: string | null = null;

  for (const row of rows) {
    if (!row.date) {
      continue;
    }

    current = previousDate && diffDaysIso(row.date, previousDate) === 1 ? current + 1 : 1;
    previousDate = row.date;
    longest = Math.max(longest, current);
  }

  return longest;
}

function compareRowsByDateThenWeek(left: NormalizedRichnessRow, right: NormalizedRichnessRow) {
  if (left.date && right.date && left.date !== right.date) {
    return left.date.localeCompare(right.date);
  }

  return left.weekNumber - right.weekNumber;
}

function hasAdaptationEvidence(value: unknown) {
  return /run[-_ ]?walk|adaptation/i.test(JSON.stringify(value));
}

function hasHalfSpecificDurabilityEvidence(value: unknown) {
  return /half[_ -]?marathon[_ -]?durability|half[_ -]?specific[_ -]?durability/i.test(
    JSON.stringify(value),
  );
}

function normalizeWorkoutKind(kind: string | null): {
  nonLongRunSignal: RunnerFacingSignal | null;
  longRunSignal: LongRunSignal | null;
} {
  switch (kind) {
    case "strides":
      return { nonLongRunSignal: "strides", longRunSignal: null };
    case "steady_aerobic_run":
      return { nonLongRunSignal: "steady_aerobic_run", longRunSignal: null };
    case "progression":
      return { nonLongRunSignal: "progression", longRunSignal: null };
    case "tempo":
      return { nonLongRunSignal: "tempo", longRunSignal: null };
    case "threshold":
      return { nonLongRunSignal: "threshold", longRunSignal: null };
    case "intervals":
      return { nonLongRunSignal: "intervals", longRunSignal: null };
    case "hills":
      return { nonLongRunSignal: "hills", longRunSignal: null };
    case "long_run":
      return { nonLongRunSignal: null, longRunSignal: "long_run" };
    case "cutback_long_run":
      return { nonLongRunSignal: null, longRunSignal: "cutback_long_run" };
    case "final_selected_distance_day":
      return { nonLongRunSignal: null, longRunSignal: "selected_distance_endpoint" };
    default:
      return { nonLongRunSignal: null, longRunSignal: null };
  }
}

function normalizeCanonicalIdentity(identity: string | null): {
  nonLongRunSignal: RunnerFacingSignal | null;
  longRunSignal: LongRunSignal | null;
} {
  switch (identity) {
    case "easy_run_with_strides":
      return { nonLongRunSignal: "strides", longRunSignal: null };
    case "steady_aerobic_run":
    case "marathon_steady_specificity":
    case "climbing_steady_run":
      return { nonLongRunSignal: "steady_aerobic_run", longRunSignal: null };
    case "progression_run":
      return { nonLongRunSignal: "progression", longRunSignal: null };
    case "controlled_tempo_session":
      return { nonLongRunSignal: "tempo", longRunSignal: null };
    case "half_marathon_threshold_durability":
      return { nonLongRunSignal: "threshold", longRunSignal: null };
    case "10k_rhythm_intervals":
    case "distance_intervals":
    case "time_intervals":
    case "5k_sharpening_repeats":
      return { nonLongRunSignal: "intervals", longRunSignal: null };
    case "uphill_repeats":
    case "rolling_hills_session":
    case "controlled_downhill_durability":
      return { nonLongRunSignal: "hills", longRunSignal: null };
    case "quality_session":
      return { nonLongRunSignal: "quality_session", longRunSignal: null };
    case "long_aerobic_run":
      return { nonLongRunSignal: null, longRunSignal: "long_run" };
    case "long_run_with_steady_finish":
      return { nonLongRunSignal: null, longRunSignal: "long_run_with_steady_finish" };
    case "cutback_long_run":
      return { nonLongRunSignal: null, longRunSignal: "cutback_long_run" };
    case "taper_long_run":
      return { nonLongRunSignal: null, longRunSignal: "taper_long_run" };
    case "tenk_completion_or_checkpoint":
    case "half_readiness_marker":
    case "selected_distance_completion_or_checkpoint":
    case "race_pace_session":
      return { nonLongRunSignal: null, longRunSignal: "selected_distance_endpoint" };
    case "hike_run_endurance":
    case "mountain_long_run_time_on_feet":
    case "ultra_time_on_feet_durability":
      return { nonLongRunSignal: null, longRunSignal: "trail_long_run" };
    default:
      return { nonLongRunSignal: null, longRunSignal: null };
  }
}

function normalizeCanonicalFamily(family: string | null): {
  nonLongRunSignal: RunnerFacingSignal | null;
  longRunSignal: LongRunSignal | null;
} {
  switch (family) {
    case "steady":
      return { nonLongRunSignal: "steady_aerobic_run", longRunSignal: null };
    case "progression":
      return { nonLongRunSignal: "progression", longRunSignal: null };
    case "tempo":
      return { nonLongRunSignal: "tempo", longRunSignal: null };
    case "intervals":
      return { nonLongRunSignal: "intervals", longRunSignal: null };
    case "hills":
      return { nonLongRunSignal: "hills", longRunSignal: null };
    case "long":
      return { nonLongRunSignal: null, longRunSignal: "long_run" };
    case "race":
      return { nonLongRunSignal: null, longRunSignal: "selected_distance_endpoint" };
    default:
      return { nonLongRunSignal: null, longRunSignal: null };
  }
}

function buildWeekSignalSummaries(rows: readonly NormalizedRichnessRow[], horizonWeeks: number) {
  return Array.from({ length: horizonWeeks }, (_, index) => {
    const weekNumber = index + 1;
    const weekRows = rows.filter((row) => row.weekNumber === weekNumber && !row.isRestDay);

    return {
      weekNumber,
      hasNonLongRunSignal: weekRows.some((row) => row.nonLongRunSignal),
    };
  });
}

function summarizeRepeatedWeekShells(rows: readonly NormalizedRichnessRow[], horizonWeeks: number) {
  const shells = Array.from({ length: horizonWeeks }, (_, index) => {
    const weekNumber = index + 1;
    const shell = rows
      .filter((row) => row.weekNumber === weekNumber && !row.isRestDay)
      .map((row) => row.weekShellPart)
      .join("/");

    return shell || "none";
  });
  let longestRepeatedWeekShells = 0;
  let repeatedWeekShellSample: string | null = null;
  let currentShell: string | null = null;
  let currentRun = 0;

  for (const shell of shells) {
    if (shell === currentShell) {
      currentRun += 1;
    } else {
      currentShell = shell;
      currentRun = 1;
    }

    if (currentRun > longestRepeatedWeekShells) {
      longestRepeatedWeekShells = currentRun;
      repeatedWeekShellSample = shell;
    }
  }

  return { longestRepeatedWeekShells, repeatedWeekShellSample };
}

function summarizeLongRunProgression(rows: readonly NormalizedRichnessRow[]) {
  const buildLongRuns = rows
    .filter(
      (row) =>
        row.longRunSignal &&
        row.longRunSignal !== "selected_distance_endpoint" &&
        row.longRunSignal !== "taper_long_run" &&
        row.longRunLoadMinutes != null &&
        row.longRunLoadMinutes > 0,
    )
    .sort((left, right) => left.weekNumber - right.weekNumber);

  if (buildLongRuns.length < 3) {
    return {
      assessed: false,
      progressionRatio: null,
      deltaMinutes: null,
    };
  }

  const earlyWindowSize = Math.min(3, Math.max(1, Math.ceil(buildLongRuns.length * 0.25)));
  const earlyBaseline = Math.max(
    ...buildLongRuns.slice(0, earlyWindowSize).map((row) => row.longRunLoadMinutes ?? 0),
  );
  const laterPeak = Math.max(
    ...buildLongRuns.slice(earlyWindowSize).map((row) => row.longRunLoadMinutes ?? 0),
  );
  const deltaMinutes = Math.round((laterPeak - earlyBaseline) * 10) / 10;
  const progressionRatio =
    earlyBaseline > 0 ? Math.round((laterPeak / earlyBaseline) * 100) / 100 : null;

  return {
    assessed: true,
    progressionRatio,
    deltaMinutes,
  };
}

function rowHasRepeatRichChildren(value: unknown) {
  return collectPrescriptions(value).some(
    (prescription) =>
      isRecord(prescription) &&
      prescription.mode === "repeats" &&
      Array.isArray(prescription.children) &&
      prescription.children.length >= 2,
  );
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

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    if ("primaryPrescription" in entry) {
      return [entry.primaryPrescription];
    }

    if ("prescription" in entry) {
      return [entry.prescription];
    }

    return [];
  });
}

function prescriptionLoadMinutes(value: unknown): number {
  if (!isRecord(value)) {
    return 0;
  }

  if (value.mode === "time") {
    if (typeof value.duration_min === "number") {
      return value.duration_min;
    }

    return secondsRangeToMinutes(value.durationSeconds);
  }

  if (value.mode === "distance") {
    if (typeof value.distance_km === "number") {
      return value.distance_km * 6;
    }

    return metersRangeToMinutes(value.distanceMeters);
  }

  if (value.mode === "repeats") {
    const repeatCount =
      typeof value.repeat_count === "number"
        ? value.repeat_count
        : isRecord(value.repeatCount) && typeof value.repeatCount.max === "number"
          ? value.repeatCount.max
          : 1;
    const children = Array.isArray(value.children) ? value.children : [];
    const childMinutes = children.reduce((total, child) => {
      if (!isRecord(child)) {
        return total;
      }

      return total + prescriptionLoadMinutes(child.prescription);
    }, 0);

    return repeatCount * childMinutes;
  }

  return 0;
}

function secondsRangeToMinutes(value: unknown) {
  if (!isRecord(value)) {
    return 0;
  }

  const seconds = maxOrMinRangeValue(value);

  return seconds / 60;
}

function metersRangeToMinutes(value: unknown) {
  if (!isRecord(value)) {
    return 0;
  }

  const meters = maxOrMinRangeValue(value);

  return (meters / 1000) * 6;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function maxOrMinRangeValue(value: Record<string, unknown>) {
  if (typeof value.max === "number") {
    return value.max;
  }

  if (typeof value.min === "number") {
    return value.min;
  }

  return 0;
}

function signalIsBridge(signal: RunnerFacingSignal) {
  return (
    signal === "steady_aerobic_run" ||
    signal === "progression" ||
    signal === "half_specific_durability" ||
    signal === "threshold" ||
    signal === "hills"
  );
}

function weekIsInSecondThird(weekNumber: number, horizonWeeks: number) {
  return (
    weekNumber > Math.floor(horizonWeeks / 3) && weekNumber <= Math.floor((horizonWeeks * 2) / 3)
  );
}

function weekIsInThirdThird(weekNumber: number, horizonWeeks: number) {
  return weekNumber > Math.floor((horizonWeeks * 2) / 3);
}

function resolveSupportBand(input: {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPreviewLoadContext;
}): RichnessSupportBand {
  return input.runnerLevel === "beginner_new_runner" || input.loadContext === "conservative"
    ? "beginner_or_conservative"
    : "supported";
}

function resolveHorizonBucket(horizonWeeks: number): HorizonBucket {
  if (horizonWeeks <= 12) return "short";
  if (horizonWeeks <= 20) return "medium";
  if (horizonWeeks <= 32) return "long";
  return "very_long";
}

function longestBooleanRun(values: readonly boolean[]) {
  let longest = 0;
  let current = 0;

  for (const value of values) {
    if (value) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

function maxWeekNumber(rows: readonly { weekNumber: number }[]) {
  return Math.max(0, ...rows.map((row) => row.weekNumber));
}

function normalizeWeekShellPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values)].sort();
}
