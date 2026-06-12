import type {
  RunningPlanDaysPerWeek,
  RunningPlanRunnerLevel,
} from "@/lib/plan-creation-engine/source-types";

export type BeginnerHalfMarathonLoadContext = "standard" | "conservative";
export type BeginnerHalfMarathonDevelopmentTouch = "strides" | "tempo";

export interface BeginnerHalfMarathonPolicyInput {
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: BeginnerHalfMarathonLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
}

export function isBeginnerHalfMarathonRunner(runnerLevel: RunningPlanRunnerLevel) {
  return runnerLevel === "beginner_new_runner";
}

export function resolveBeginnerHalfMarathonHorizonWeeks({
  runnerLevel,
  loadContext,
  daysPerWeek,
}: BeginnerHalfMarathonPolicyInput) {
  if (!isBeginnerHalfMarathonRunner(runnerLevel)) {
    return null;
  }

  const standardWeeksByDays: Readonly<Record<RunningPlanDaysPerWeek, number>> = {
    3: 32,
    4: 28,
    5: 24,
  };
  const conservativeExtensionWeeks = loadContext === "conservative" ? 4 : 0;

  return standardWeeksByDays[daysPerWeek] + conservativeExtensionWeeks;
}

export function resolveBeginnerHalfMarathonMinimumWeeks({
  loadContext,
  daysPerWeek,
}: Pick<BeginnerHalfMarathonPolicyInput, "loadContext" | "daysPerWeek">) {
  const standardMinimumByDays: Readonly<Record<RunningPlanDaysPerWeek, number>> = {
    3: 30,
    4: 26,
    5: 22,
  };
  const conservativeExtensionWeeks = loadContext === "conservative" ? 4 : 0;

  return standardMinimumByDays[daysPerWeek] + conservativeExtensionWeeks;
}

export function resolveBeginnerHalfMarathonAdaptationWeeks({
  loadContext,
  daysPerWeek,
}: Pick<BeginnerHalfMarathonPolicyInput, "loadContext" | "daysPerWeek">) {
  const standardAdaptationByDays: Readonly<Record<RunningPlanDaysPerWeek, number>> = {
    3: 8,
    4: 6,
    5: 4,
  };
  const conservativeExtensionWeeks = loadContext === "conservative" ? 2 : 0;

  return standardAdaptationByDays[daysPerWeek] + conservativeExtensionWeeks;
}

export function resolveBeginnerHalfMarathonCutbackWeeks(horizonWeeks: number) {
  const cutbackWeeks: number[] = [];
  const lastCutbackWeek = Math.max(4, horizonWeeks - 4);

  for (let weekNumber = 4; weekNumber <= lastCutbackWeek; weekNumber += 4) {
    cutbackWeeks.push(weekNumber);
  }

  return cutbackWeeks;
}

export function resolveBeginnerHalfMarathonTaperWeek(horizonWeeks: number) {
  return horizonWeeks - 1;
}

export function resolveBeginnerHalfMarathonEndpointWeek(horizonWeeks: number) {
  return horizonWeeks;
}

export function inferBeginnerHalfMarathonDaysPerWeek({
  loadContext,
  horizonWeeks,
}: {
  loadContext: BeginnerHalfMarathonLoadContext;
  horizonWeeks: number;
}): RunningPlanDaysPerWeek {
  if (loadContext === "conservative") {
    if (horizonWeeks >= 36) {
      return 3;
    }
    if (horizonWeeks >= 32) {
      return 4;
    }
    return 5;
  }

  if (horizonWeeks >= 32) {
    return 3;
  }
  if (horizonWeeks >= 28) {
    return 4;
  }
  return 5;
}

export function resolveBeginnerHalfMarathonDevelopmentTouch({
  loadContext,
  horizonWeeks,
  weekNumber,
}: {
  loadContext: BeginnerHalfMarathonLoadContext;
  horizonWeeks: number;
  weekNumber: number;
}): BeginnerHalfMarathonDevelopmentTouch | null {
  const daysPerWeek = inferBeginnerHalfMarathonDaysPerWeek({ loadContext, horizonWeeks });
  const cutbackWeeks = resolveBeginnerHalfMarathonCutbackWeeks(horizonWeeks);
  const adaptationWeeks = resolveBeginnerHalfMarathonAdaptationWeeks({ loadContext, daysPerWeek });
  const taperWeek = resolveBeginnerHalfMarathonTaperWeek(horizonWeeks);
  const endpointWeek = resolveBeginnerHalfMarathonEndpointWeek(horizonWeeks);

  if (
    weekNumber <= adaptationWeeks ||
    weekNumber === endpointWeek ||
    cutbackWeeks.includes(weekNumber)
  ) {
    return null;
  }

  if (weekNumber === taperWeek) {
    return "strides";
  }

  const tempoWeeks = selectBeginnerHalfMarathonTempoWeeks({
    loadContext,
    daysPerWeek,
    horizonWeeks,
    adaptationWeeks,
    cutbackWeeks,
    taperWeek,
  });
  if (tempoWeeks.includes(weekNumber)) {
    return "tempo";
  }

  const strideWeeks = selectBeginnerHalfMarathonStrideWeeks({
    horizonWeeks,
    adaptationWeeks,
    cutbackWeeks,
    taperWeek,
    tempoWeeks,
  });
  if (strideWeeks.includes(weekNumber)) {
    return "strides";
  }

  return null;
}

export function resolveBeginnerHalfMarathonLongRunMinuteBounds({
  loadContext,
  horizonWeeks,
}: {
  loadContext: BeginnerHalfMarathonLoadContext;
  horizonWeeks: number;
}) {
  const daysPerWeek = inferBeginnerHalfMarathonDaysPerWeek({ loadContext, horizonWeeks });
  const standardBoundsByDays: Readonly<
    Record<RunningPlanDaysPerWeek, { start: number; peak: number }>
  > = {
    3: { start: 55, peak: 110 },
    4: { start: 60, peak: 115 },
    5: { start: 65, peak: 120 },
  };
  const bounds = standardBoundsByDays[daysPerWeek];

  return loadContext === "conservative"
    ? { start: bounds.start - 5, peak: bounds.peak - 5 }
    : bounds;
}

export function resolveBeginnerHalfMarathonCutbackLongRunMinutes({
  loadContext,
  horizonWeeks,
}: {
  loadContext: BeginnerHalfMarathonLoadContext;
  horizonWeeks: number;
}) {
  const daysPerWeek = inferBeginnerHalfMarathonDaysPerWeek({ loadContext, horizonWeeks });
  const minutesByDays: Readonly<Record<RunningPlanDaysPerWeek, number>> = {
    3: 50,
    4: 55,
    5: 60,
  };
  const conservativeMinutes = loadContext === "conservative" ? -5 : 0;

  return minutesByDays[daysPerWeek] + conservativeMinutes;
}

function selectBeginnerHalfMarathonTempoWeeks({
  loadContext,
  daysPerWeek,
  horizonWeeks,
  adaptationWeeks,
  cutbackWeeks,
  taperWeek,
}: {
  loadContext: BeginnerHalfMarathonLoadContext;
  daysPerWeek: RunningPlanDaysPerWeek;
  horizonWeeks: number;
  adaptationWeeks: number;
  cutbackWeeks: readonly number[];
  taperWeek: number;
}) {
  const tempoCountByDays: Readonly<Record<RunningPlanDaysPerWeek, number>> =
    loadContext === "conservative" ? { 3: 0, 4: 1, 5: 1 } : { 3: 1, 4: 2, 5: 2 };
  const tempoCount = tempoCountByDays[daysPerWeek];
  const rawTargets =
    tempoCount === 1
      ? [Math.ceil(horizonWeeks * 0.72)]
      : [Math.ceil(horizonWeeks * 0.58), Math.ceil(horizonWeeks * 0.78)];

  return selectAvailableWeeks({
    rawTargets,
    minWeek: adaptationWeeks + 1,
    maxWeek: taperWeek - 1,
    blockedWeeks: cutbackWeeks,
  }).slice(0, tempoCount);
}

function selectBeginnerHalfMarathonStrideWeeks({
  horizonWeeks,
  adaptationWeeks,
  cutbackWeeks,
  taperWeek,
  tempoWeeks,
}: {
  horizonWeeks: number;
  adaptationWeeks: number;
  cutbackWeeks: readonly number[];
  taperWeek: number;
  tempoWeeks: readonly number[];
}) {
  return selectAvailableWeeks({
    rawTargets: [
      adaptationWeeks + 1,
      Math.ceil(horizonWeeks * 0.36),
      Math.ceil(horizonWeeks * 0.5),
      Math.ceil(horizonWeeks * 0.58),
      Math.ceil(horizonWeeks * 0.65),
      Math.ceil(horizonWeeks * 0.82),
    ],
    minWeek: adaptationWeeks + 1,
    maxWeek: taperWeek - 1,
    blockedWeeks: [...cutbackWeeks, ...tempoWeeks],
  });
}

function selectAvailableWeeks({
  rawTargets,
  minWeek,
  maxWeek,
  blockedWeeks,
}: {
  rawTargets: readonly number[];
  minWeek: number;
  maxWeek: number;
  blockedWeeks: readonly number[];
}) {
  const blocked = new Set(blockedWeeks);
  const selected: number[] = [];

  for (const rawTarget of rawTargets) {
    const weekNumber = nearestAvailableWeek({
      target: rawTarget,
      minWeek,
      maxWeek,
      blocked,
      selected,
    });
    if (weekNumber !== null) {
      selected.push(weekNumber);
    }
  }

  return selected;
}

function nearestAvailableWeek({
  target,
  minWeek,
  maxWeek,
  blocked,
  selected,
}: {
  target: number;
  minWeek: number;
  maxWeek: number;
  blocked: ReadonlySet<number>;
  selected: readonly number[];
}) {
  for (let offset = 0; offset <= maxWeek - minWeek; offset += 1) {
    const forward = target + offset;
    if (weekIsAvailable({ weekNumber: forward, minWeek, maxWeek, blocked, selected })) {
      return forward;
    }

    const backward = target - offset;
    if (weekIsAvailable({ weekNumber: backward, minWeek, maxWeek, blocked, selected })) {
      return backward;
    }
  }

  return null;
}

function weekIsAvailable({
  weekNumber,
  minWeek,
  maxWeek,
  blocked,
  selected,
}: {
  weekNumber: number;
  minWeek: number;
  maxWeek: number;
  blocked: ReadonlySet<number>;
  selected: readonly number[];
}) {
  return (
    weekNumber >= minWeek &&
    weekNumber <= maxWeek &&
    !blocked.has(weekNumber) &&
    !selected.includes(weekNumber)
  );
}
