export type LongDistanceHonestyGoal = "marathon" | "ultra_marathon" | "mountain_running";

export interface LongDistanceHonestyInput {
  goalType: string | null | undefined;
  runningDaysPerWeek: number | null | undefined;
  horizonWeeks: number | null | undefined;
  hasUsableBenchmark: boolean;
  targetTimeIntent?: boolean;
  baselineLongRunKm?: number | null;
  currentLoadKnown?: boolean;
  age?: number | null;
}

const LONG_DISTANCE_GOALS = new Set<LongDistanceHonestyGoal>([
  "marathon",
  "ultra_marathon",
  "mountain_running",
]);

export function buildLongDistanceHonestyAssumptions(input: LongDistanceHonestyInput) {
  const goal = normalizeLongDistanceGoal(input.goalType);

  if (!goal) {
    return [];
  }

  const assumptions: string[] = [];
  const goalLabel = formatLongDistanceGoal(goal);
  const runningDays = sanitizeRunningDays(input.runningDaysPerWeek);

  if (runningDays != null && runningDays <= 2) {
    assumptions.push(
      `With ${runningDays} running day(s) per week, this ${goalLabel} plan is finish-oriented and durability-limited; a longer horizon or more running days would better support race-specific durability.`,
    );
  } else if (runningDays === 3 && !input.hasUsableBenchmark) {
    assumptions.push(
      `With 3 running days per week and limited benchmark support, this ${goalLabel} plan stays conservative rather than pretending a full race-specific build.`,
    );
  } else if (runningDays === 3) {
    assumptions.push(
      `With 3 running days per week, this ${goalLabel} plan stays conservative; more running days would better support race-specific durability.`,
    );
  }

  const minimumHorizonWeeks = minimumLongDistanceHorizonWeeks(goal);

  if (
    input.horizonWeeks != null &&
    input.horizonWeeks > 0 &&
    input.horizonWeeks < minimumHorizonWeeks
  ) {
    assumptions.push(
      `The timeline is shorter than Hito would prefer for ${goalLabel} durability, so the plan stays conservative and avoids overpromising race-specific readiness.`,
    );
  }

  if (typeof input.age === "number" && input.age >= 55) {
    assumptions.push(
      `This ${goalLabel} plan keeps extra recovery margin for age-sensitive long-distance training, favoring gradual durability over dense intensity.`,
    );
  }

  if (
    input.currentLoadKnown === false ||
    longRunBaselineLooksLimited(goal, input.baselineLongRunKm)
  ) {
    assumptions.push(
      `Current long-run durability is limited or unclear, so Hito keeps the ${goalLabel} build conservative before adding more race-specific stress.`,
    );
  }

  if (input.targetTimeIntent && !input.hasUsableBenchmark) {
    assumptions.push(
      "Target-time intent is treated as directional because benchmark support is missing; guidance stays effort-based instead of promising target-specific pacing.",
    );
  } else if (!input.hasUsableBenchmark) {
    assumptions.push(
      `Without a recent benchmark, this ${goalLabel} plan uses effort-based guidance and conservative progression instead of precise race-specific targets.`,
    );
  }

  return uniqueAssumptions(assumptions).slice(0, 4);
}

function normalizeLongDistanceGoal(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return LONG_DISTANCE_GOALS.has(value as LongDistanceHonestyGoal)
    ? (value as LongDistanceHonestyGoal)
    : null;
}

function formatLongDistanceGoal(goal: LongDistanceHonestyGoal) {
  switch (goal) {
    case "marathon":
      return "marathon";
    case "ultra_marathon":
      return "ultra";
    case "mountain_running":
      return "mountain-running";
  }
}

function sanitizeRunningDays(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(1, Math.min(7, Math.round(value)));
}

function minimumLongDistanceHorizonWeeks(goal: LongDistanceHonestyGoal) {
  switch (goal) {
    case "ultra_marathon":
      return 18;
    case "marathon":
      return 14;
    case "mountain_running":
      return 12;
  }
}

function longRunBaselineLooksLimited(
  goal: LongDistanceHonestyGoal,
  baselineLongRunKm: number | null | undefined,
) {
  if (typeof baselineLongRunKm !== "number" || !Number.isFinite(baselineLongRunKm)) {
    return true;
  }

  const minimumSupportedBaselineKm = goal === "ultra_marathon" ? 12 : 10;

  return baselineLongRunKm < minimumSupportedBaselineKm;
}

function uniqueAssumptions(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
