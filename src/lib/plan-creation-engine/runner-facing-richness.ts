import type { TrainingPlanV2 } from "@/lib/imported-plan";
import type {
  RunningPlanDistanceFamily,
  RunningPlanRunnerLevel,
} from "@/lib/plan-creation-engine/source-types";
import type { RunningPlanPreviewLoadContext } from "@/lib/plan-creation-engine/preview-builder-shared";

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

export interface RunnerFacingRichnessPreviewRow {
  weekNumber: number;
  isRestDay: boolean;
  workoutDayKind?: string | null;
  title?: string | null;
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
  distinctNonLongRunSignals: readonly RunnerFacingSignal[];
  distinctLongRunSignals: readonly LongRunSignal[];
  longestRepeatedWeekShells: number;
  repeatedWeekShellSample: string | null;
  missingSourceWorkoutTypeCount: number;
  issues: readonly string[];
}

type NormalizedRichnessRow = {
  weekNumber: number;
  isRestDay: boolean;
  nonLongRunSignal: RunnerFacingSignal | null;
  longRunSignal: LongRunSignal | null;
  weekShellPart: string;
  sourceWorkoutTypeMissing: boolean;
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
  const maxAllowedIdentityDesertWeeks = maxAllowedIdentityDesert({
    family: input.family,
    supportBand,
    horizonBucket,
  });
  const weekSignalSummaries = buildWeekSignalSummaries(input.rows, horizonWeeks);
  const longestIdentityDesertWeeks = longestBooleanRun(
    weekSignalSummaries.map((week) => !week.hasNonLongRunSignal),
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
    distinctNonLongRunSignals,
    distinctLongRunSignals,
    longestRepeatedWeekShells: repeatedShellSummary.longestRepeatedWeekShells,
    missingSourceWorkoutTypeCount,
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
  distinctNonLongRunSignals: readonly RunnerFacingSignal[];
  distinctLongRunSignals: readonly LongRunSignal[];
  longestRepeatedWeekShells: number;
  missingSourceWorkoutTypeCount: number;
}) {
  const issues: string[] = [];
  const signalFloor = resolveSignalFloor(input);
  const lowSupportDistinctTwoCoveredByLongRunRichness =
    signalFloor.requiresLongRunRichnessForLowSupportDistinctTwo &&
    input.distinctNonLongRunSignals.length === 2 &&
    input.distinctLongRunSignals.length >= 3;

  if (input.longestIdentityDesertWeeks > input.maxAllowedIdentityDesertWeeks) {
    issues.push(
      `${input.family} runner-facing richness gate failed identity_desert_scan: ${input.longestIdentityDesertWeeks} consecutive weeks without non-long-run signal exceeds ${input.maxAllowedIdentityDesertWeeks}.`,
    );
  }

  if (input.nonLongRunSignalPlacements < signalFloor.minimumPlacements) {
    issues.push(
      `${input.family} runner-facing richness gate failed family_signal_floor_scan: ${input.nonLongRunSignalPlacements} non-long-run signal placements is below ${signalFloor.minimumPlacements}.`,
    );
  }

  if (
    input.distinctNonLongRunSignals.length < signalFloor.minimumDistinctSignals &&
    !lowSupportDistinctTwoCoveredByLongRunRichness
  ) {
    issues.push(
      `${input.family} runner-facing richness gate failed family_signal_floor_scan: ${input.distinctNonLongRunSignals.join(", ") || "none"} has fewer than ${signalFloor.minimumDistinctSignals} distinct non-long-run signals.`,
    );
  }

  if (
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

  issues.push(
    ...collectFamilySignalIssues({
      ...input,
      lowSupportDistinctTwoCoveredByLongRunRichness,
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
}) {
  const issues: string[] = [];
  const signals = new Set(input.distinctNonLongRunSignals);

  if (input.family === "10K") {
    if (!signals.has("strides")) {
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

  if (input.family === "Marathon Base") {
    if (!signals.has("strides") && !signals.has("steady_aerobic_run")) {
      issues.push("Marathon Base runner-facing richness gate requires strides or steady support.");
    }
    if (
      input.supportBand === "supported" &&
      input.horizonWeeks >= 20 &&
      !signals.has("steady_aerobic_run") &&
      !signals.has("progression") &&
      !signals.has("hills")
    ) {
      issues.push(
        "Supported long-horizon Marathon Base runner-facing richness gate requires a steady, progression, or hill-strength bridge beyond tempo/strides.",
      );
    }
    if (
      input.supportBand === "supported" &&
      input.horizonWeeks >= 20 &&
      (input.bridgeSignalPlacementsInSecondThird < 1 ||
        input.bridgeSignalPlacementsInThirdThird < 1)
    ) {
      issues.push(
        "Supported long-horizon Marathon Base runner-facing richness gate requires bridge signals in both the second and third thirds.",
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
    minimumPlacements = 2;
    minimumDistinctSignals = 2;
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

  return {
    minimumPlacements,
    minimumDistinctSignals,
    minimumPlacementsAfterMidpoint,
    requiresLongRunRichnessForLowSupportDistinctTwo:
      input.supportBand === "beginner_or_conservative" && input.horizonWeeks >= 24,
  };
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
  const nonLongRunSignal = hasAdaptationEvidence(row.segments)
    ? "adaptation"
    : hasHalfSpecificDurabilityEvidence(row.segments)
      ? "half_specific_durability"
      : signal.nonLongRunSignal;

  return {
    weekNumber: row.weekNumber,
    isRestDay: row.isRestDay,
    nonLongRunSignal,
    longRunSignal: signal.longRunSignal,
    weekShellPart: row.isRestDay
      ? "rest"
      : normalizeWeekShellPart(row.workoutDayKind ?? row.title ?? "unknown"),
    sourceWorkoutTypeMissing: false,
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

  return {
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
  };
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
    case "marathon_base_endpoint":
      return { nonLongRunSignal: null, longRunSignal: "base_endpoint" };
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
    case "base_endpoint_marker":
      return { nonLongRunSignal: null, longRunSignal: "base_endpoint" };
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
