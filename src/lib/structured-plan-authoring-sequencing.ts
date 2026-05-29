import {
  type LongRunGoalPolicy,
  type NormalizedStructuredInput,
  type StructuredPlanAuthoringInput,
} from "@/lib/structured-plan-authoring-schema";
import {
  buildLongRunTarget,
  buildSteadyFinishTarget,
} from "@/lib/structured-plan-authoring-metrics";
import {
  firstTaperWeek,
  getRecent5kPaceSecondsPerKm,
  isCutbackWeek,
  isHighAmbitionPlan,
  isLimitedSharpeningSupport,
  isMountainSpecificPlan,
  roundToFive,
  roundToTenth,
  shouldAddLongRunSteadyFinish,
  shouldUseBaseStrides,
  shouldUseProgressionSpecificity,
} from "@/lib/structured-plan-authoring-policy";
import {
  buildAerobicStridesWorkout,
  buildClimbingSteadyWorkout,
  buildControlledDownhillDurabilityWorkout,
  buildCutbackAerobicWorkout,
  buildDistanceIntervalsWorkout,
  buildEasyWorkout,
  buildFiveKSharpeningWorkout,
  buildHalfMarathonThresholdWorkout,
  buildHikeRunEnduranceWorkout,
  buildHillRepeatsWorkout,
  buildMarathonSteadySpecificityWorkout,
  buildProgressionWorkout,
  buildRollingHillsWorkout,
  buildSteadyWorkout,
  buildTaperTuneupWorkout,
  buildTechnicalTrailEasyWorkout,
  buildTempoWorkout,
  buildTenKRhythmWorkout,
  buildTimeIntervalsWorkout,
  buildUltraDurabilityWorkout,
  type BuildWorkoutContext,
} from "@/lib/structured-plan-authoring-workouts";

const longRunGoalPolicies: Record<
  StructuredPlanAuthoringInput["goal"]["goalType"],
  LongRunGoalPolicy
> = {
  build_consistency: { floorKm: 5, peakKm: 10, ceilingKm: 12 },
  distance_build: { floorKm: 7, peakKm: 15, ceilingKm: 18 },
  "5k": { floorKm: 6, peakKm: 12, ceilingKm: 14 },
  "10k": { floorKm: 8, peakKm: 16, ceilingKm: 18 },
  half_marathon: { floorKm: 10, peakKm: 20, ceilingKm: 22 },
  marathon: { floorKm: 12, peakKm: 30, ceilingKm: 32 },
  ultra_marathon: { floorKm: 14, peakKm: 34, ceilingKm: 38 },
  mountain_running: { floorKm: 10, peakKm: 26, ceilingKm: 30 },
};

export function buildLongRunWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const distanceKm = deriveLongRunDistanceKm(normalized, weekNumber);
  const durationMin = deriveLongRunDurationMin(normalized, weekNumber, distanceKm);
  const cutback = isCutbackWeek(weekNumber, normalized);
  const taper = phase === "Taper";
  const mountainSpecific = isMountainSpecificPlan(normalized);
  const hasSteadyFinish = !mountainSpecific && shouldAddLongRunSteadyFinish(normalized, weekNumber);
  const title = cutback
    ? "Cutback long run"
    : taper
      ? "Taper long run"
      : mountainSpecific
        ? "Mountain long run time-on-feet"
        : hasSteadyFinish
          ? "Long run with steady finish"
          : "Long aerobic run";

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "long_run" as const,
    source_workout_type: cutback
      ? "cutback_long_run"
      : taper
        ? "taper_long_run"
        : mountainSpecific
          ? "mountain_long_run_time_on_feet"
          : hasSteadyFinish
            ? "long_run_with_steady_finish"
            : "long_aerobic_run",
    title,
    summary: buildLongRunSummary(
      normalized,
      distanceKm,
      durationMin,
      cutback,
      taper,
      hasSteadyFinish,
    ),
    planned_rpe: 5,
    segments: buildLongRunSegments({
      workoutId,
      normalized,
      distanceKm,
      durationMin,
      cutback,
      taper,
      hasSteadyFinish,
    }),
  };
}

function buildLongRunSummary(
  normalized: NormalizedStructuredInput,
  distanceKm: number,
  durationMin: number,
  cutback: boolean,
  taper: boolean,
  hasSteadyFinish: boolean,
) {
  const loadLabel = normalized.runnerProfile.baselineLongRunKm
    ? `${distanceKm} km`
    : `${durationMin} min`;

  if (cutback) {
    return `${loadLabel} lower-load long run to absorb the block.`;
  }

  if (taper) {
    return `${loadLabel} reduced long run to freshen up before the goal.`;
  }

  if (isMountainSpecificPlan(normalized)) {
    return `${loadLabel} mountain time-on-feet run with controlled climbing, careful descents, and hike/run allowed on steep sections.`;
  }

  if (hasSteadyFinish) {
    return `${loadLabel} long run with an easy base and a controlled steady finish.`;
  }

  return `${loadLabel} long aerobic run.`;
}

function buildLongRunSegments({
  workoutId,
  normalized,
  distanceKm,
  durationMin,
  cutback,
  taper,
  hasSteadyFinish,
}: {
  workoutId: string;
  normalized: NormalizedStructuredInput;
  distanceKm: number;
  durationMin: number;
  cutback: boolean;
  taper: boolean;
  hasSteadyFinish: boolean;
}) {
  if (!hasSteadyFinish) {
    const splitLongRun = buildLongAerobicSupportSegments({
      workoutId,
      normalized,
      distanceKm,
      durationMin,
      cutback,
      taper,
    });

    if (splitLongRun) {
      return splitLongRun;
    }

    return [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: cutback
          ? "Cutback long aerobic running"
          : taper
            ? "Reduced taper long running"
            : isMountainSpecificPlan(normalized)
              ? "Mountain time-on-feet running"
              : "Long aerobic running",
        guidance: buildLongRunGuidance(normalized, cutback, taper),
        prescription: normalized.runnerProfile.baselineLongRunKm
          ? {
              mode: "distance" as const,
              distance_km: distanceKm,
            }
          : {
              mode: "time" as const,
              duration_min: durationMin,
            },
        ...(normalized.runnerProfile.baselineLongRunKm
          ? { distance_km: distanceKm }
          : { duration_min: durationMin }),
        target: buildLongRunTarget(normalized),
      },
    ];
  }

  if (normalized.runnerProfile.baselineLongRunKm) {
    const steadyFinishDistanceKm = Number(Math.max(1, distanceKm * 0.22).toFixed(1));
    const baseDistanceKm = Number(Math.max(1, distanceKm - steadyFinishDistanceKm).toFixed(1));

    return [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Easy long-run base",
        guidance: buildLongRunGuidance(normalized, false, false),
        prescription: {
          mode: "distance" as const,
          distance_km: baseDistanceKm,
        },
        distance_km: baseDistanceKm,
        target: buildLongRunTarget(normalized),
      },
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "main" as const,
        label: "Controlled steady finish",
        guidance: "Gently lift the effort late, but keep it sustainable and relaxed.",
        prescription: {
          mode: "distance" as const,
          distance_km: steadyFinishDistanceKm,
        },
        distance_km: steadyFinishDistanceKm,
        target: buildSteadyFinishTarget(normalized),
      },
    ];
  }

  const steadyFinishDurationMin = roundToFive(Math.min(25, Math.max(10, durationMin * 0.22)));
  const baseDurationMin = Math.max(25, durationMin - steadyFinishDurationMin);

  return [
    {
      segment_id: `${workoutId}_seg_1`,
      sequence: 1,
      segment_type: "main" as const,
      label: "Easy long-run base",
      guidance: buildLongRunGuidance(normalized, false, false),
      prescription: {
        mode: "time" as const,
        duration_min: baseDurationMin,
      },
      duration_min: baseDurationMin,
      target: buildLongRunTarget(normalized),
    },
    {
      segment_id: `${workoutId}_seg_2`,
      sequence: 2,
      segment_type: "main" as const,
      label: "Controlled steady finish",
      guidance: "Gently lift the effort late, but keep it sustainable and relaxed.",
      prescription: {
        mode: "time" as const,
        duration_min: steadyFinishDurationMin,
      },
      duration_min: steadyFinishDurationMin,
      target: buildSteadyFinishTarget(normalized),
    },
  ];
}

function buildLongAerobicSupportSegments({
  workoutId,
  normalized,
  distanceKm,
  durationMin,
  cutback,
  taper,
}: {
  workoutId: string;
  normalized: NormalizedStructuredInput;
  distanceKm: number;
  durationMin: number;
  cutback: boolean;
  taper: boolean;
}) {
  if (normalized.runnerProfile.baselineLongRunKm) {
    if (distanceKm < 6) {
      return null;
    }

    const openingDistanceKm = roundToTenth(Math.max(1.5, distanceKm * 0.18));
    const finishDistanceKm = roundToTenth(Math.max(1, distanceKm * 0.12));
    const mainDistanceKm = roundToTenth(
      Math.max(2, distanceKm - openingDistanceKm - finishDistanceKm),
    );

    return [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "warmup" as const,
        label: cutback
          ? "Gentle cutback opening"
          : taper
            ? "Fresh taper opening"
            : "Patient long-run opening",
        guidance: cutback
          ? "Start very comfortably; this long run is here to absorb the block."
          : taper
            ? "Start relaxed and keep the first section confidence-building."
            : "Start deliberately easier than the rest of the run.",
        prescription: {
          mode: "distance" as const,
          distance_km: openingDistanceKm,
        },
        distance_km: openingDistanceKm,
        target: buildLongRunTarget(normalized),
      },
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "main" as const,
        label: cutback
          ? "Reduced long-run body"
          : taper
            ? "Shortened taper endurance"
            : isMountainSpecificPlan(normalized)
              ? "Mountain time-on-feet body"
              : "Long aerobic body",
        guidance: buildLongRunGuidance(normalized, cutback, taper),
        prescription: {
          mode: "distance" as const,
          distance_km: mainDistanceKm,
        },
        distance_km: mainDistanceKm,
        target: buildLongRunTarget(normalized),
      },
      {
        segment_id: `${workoutId}_seg_3`,
        sequence: 3,
        segment_type: "cooldown" as const,
        label: cutback
          ? "Easy absorption finish"
          : taper
            ? "Freshness-preserving finish"
            : "Patient finish",
        guidance: cutback
          ? "Finish easy and controlled; do not turn this into a make-up workout."
          : taper
            ? "Finish feeling fresh, with no late push."
            : isMountainSpecificPlan(normalized)
              ? "Finish with controlled descents and hike breaks if they protect the full session."
              : "Keep form tall and finish controlled rather than fast.",
        prescription: {
          mode: "distance" as const,
          distance_km: finishDistanceKm,
        },
        distance_km: finishDistanceKm,
        target: buildLongRunTarget(normalized),
      },
    ];
  }

  if (durationMin < 45) {
    return null;
  }

  const openingMin = 10;
  const finishMin = 10;
  const mainMin = durationMin - openingMin - finishMin;

  return [
    {
      segment_id: `${workoutId}_seg_1`,
      sequence: 1,
      segment_type: "warmup" as const,
      label: cutback
        ? "Gentle cutback opening"
        : taper
          ? "Fresh taper opening"
          : "Patient long-run opening",
      guidance: cutback
        ? "Start very comfortably; this long run is here to absorb the block."
        : taper
          ? "Start relaxed and keep the first section confidence-building."
          : "Start deliberately easier than the rest of the run.",
      prescription: {
        mode: "time" as const,
        duration_min: openingMin,
      },
      duration_min: openingMin,
      target: buildLongRunTarget(normalized),
    },
    {
      segment_id: `${workoutId}_seg_2`,
      sequence: 2,
      segment_type: "main" as const,
      label: cutback
        ? "Reduced long-run body"
        : taper
          ? "Shortened taper endurance"
          : isMountainSpecificPlan(normalized)
            ? "Mountain time-on-feet body"
            : "Long aerobic body",
      guidance: buildLongRunGuidance(normalized, cutback, taper),
      prescription: {
        mode: "time" as const,
        duration_min: mainMin,
      },
      duration_min: mainMin,
      target: buildLongRunTarget(normalized),
    },
    {
      segment_id: `${workoutId}_seg_3`,
      sequence: 3,
      segment_type: "cooldown" as const,
      label: cutback
        ? "Easy absorption finish"
        : taper
          ? "Freshness-preserving finish"
          : "Patient finish",
      guidance: cutback
        ? "Finish easy and controlled; do not turn this into a make-up workout."
        : taper
          ? "Finish feeling fresh, with no late push."
          : isMountainSpecificPlan(normalized)
            ? "Finish with controlled descents and hike breaks if they protect the full session."
            : "Keep form tall and finish controlled rather than fast.",
      prescription: {
        mode: "time" as const,
        duration_min: finishMin,
      },
      duration_min: finishMin,
      target: buildLongRunTarget(normalized),
    },
  ];
}

export function buildQualityWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  if (isCutbackWeek(weekNumber, normalized)) {
    return buildCutbackAerobicWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (isMountainSpecificPlan(normalized)) {
    return buildMountainQualityWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (phase === "Taper") {
    return buildTaperTuneupWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (phase === "Base") {
    if (shouldUseBaseStrides(normalized)) {
      return buildAerobicStridesWorkout({
        workoutId,
        date,
        weekday,
        weekNumber,
        phase,
        normalized,
      });
    }

    if (normalized.preferences.terrainFocus === "rolling" && weekNumber % 2 === 0) {
      return buildRollingHillsWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
    }

    return buildSteadyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  const goalFamilyWorkout = buildGoalFamilyQualityWorkout({
    workoutId,
    date,
    weekday,
    weekNumber,
    phase,
    normalized,
  });

  if (goalFamilyWorkout) {
    return goalFamilyWorkout;
  }

  const workoutPattern = weekNumber % 3;

  if (normalized.preferences.terrainFocus === "rolling" && workoutPattern === 2) {
    return buildRollingHillsWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (phase === "Specific" && shouldUseProgressionSpecificity(normalized, weekNumber)) {
    return buildProgressionWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (workoutPattern === 1) {
    return buildTempoWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (workoutPattern === 2) {
    return buildDistanceIntervalsWorkout({
      workoutId,
      date,
      weekday,
      weekNumber,
      phase,
      normalized,
    });
  }

  return buildTimeIntervalsWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
}

function buildGoalFamilyQualityWorkout(context: BuildWorkoutContext) {
  const { normalized } = context;

  switch (normalized.goal.goalType) {
    case "5k":
      return isLimitedSharpeningSupport(normalized)
        ? buildAerobicStridesWorkout(context)
        : buildFiveKSharpeningWorkout(context);
    case "10k":
      return isLimitedSharpeningSupport(normalized)
        ? buildTempoWorkout(context)
        : buildTenKRhythmWorkout(context);
    case "half_marathon":
      return buildHalfMarathonThresholdWorkout(context);
    case "marathon":
      return buildMarathonSteadySpecificityWorkout(context);
    case "ultra_marathon":
      return buildUltraDurabilityWorkout(context);
    default:
      return null;
  }
}

function buildMountainQualityWorkout(context: BuildWorkoutContext) {
  if (context.phase === "Taper") {
    return buildTaperTuneupWorkout(context);
  }

  const pattern = context.weekNumber % 4;

  if (context.phase === "Base") {
    return pattern === 0
      ? buildRollingHillsWorkout(context)
      : buildTechnicalTrailEasyWorkout(context);
  }

  if (context.phase === "Build") {
    if (pattern === 0) return buildControlledDownhillDurabilityWorkout(context);
    if (pattern === 1) return buildHillRepeatsWorkout(context);
    if (pattern === 2) return buildRollingHillsWorkout(context);
    return buildClimbingSteadyWorkout(context);
  }

  if (pattern === 0) return buildHikeRunEnduranceWorkout(context);
  if (pattern === 1) return buildControlledDownhillDurabilityWorkout(context);
  if (pattern === 2) return buildClimbingSteadyWorkout(context);
  return buildHillRepeatsWorkout(context);
}

function buildLongRunGuidance(
  normalized: NormalizedStructuredInput,
  cutback: boolean,
  taper: boolean,
) {
  if (cutback) {
    return isMountainSpecificPlan(normalized)
      ? "Keep this deliberately comfortable and choose lower-stress terrain than the surrounding mountain long runs."
      : "Keep this deliberately comfortable and shorter than the surrounding long runs.";
  }

  if (taper) {
    return isMountainSpecificPlan(normalized)
      ? "Keep this reduced and confidence-building; avoid technical descent stress and finish fresher than you started."
      : "Keep this reduced and confidence-building; finish fresher than you started.";
  }

  if (isMountainSpecificPlan(normalized)) {
    return "Use time on feet as the anchor. Run gentle terrain easily, power-hike steeper climbs, descend smoothly under control, and avoid exact elevation targets.";
  }

  if (normalized.goal.goalType === "marathon") {
    return "Keep the effort patient and steady. Use longer runs for time-on-feet durability and a familiar fueling routine if you already have one.";
  }

  if (normalized.goal.goalType === "ultra_marathon") {
    return "Use time on feet as the anchor. Keep the session aerobic, add short hike breaks when useful, and protect recovery for the next run.";
  }

  if (normalized.goal.goalType === "half_marathon") {
    return "Keep this comfortable but purposeful so it builds steady durability without becoming a race effort.";
  }

  if (normalized.preferences.terrainFocus === "rolling") {
    return "Keep the effort comfortable and let mild rolling terrain be part of the run when available.";
  }

  return "Keep the effort comfortable enough to finish feeling in control.";
}

function deriveLongRunDistanceKm(normalized: NormalizedStructuredInput, weekNumber: number) {
  const policy = longRunGoalPolicies[normalized.goal.goalType];
  const baseline =
    normalized.runnerProfile.baselineLongRunKm ??
    Number(((normalized.runnerProfile.baselineLongRunDurationMin ?? 60) / 7).toFixed(1));
  const startDistance = Math.max(policy.floorKm, Math.min(baseline, policy.peakKm * 0.72));
  const peakDistance = deriveLongRunPeakDistanceKm(normalized, policy, startDistance);
  const taperStartWeek = firstTaperWeek(normalized.schedule.horizonWeeks);
  const progressionEndWeek = Math.max(1, taperStartWeek - 1);

  if (weekNumber >= taperStartWeek) {
    return deriveTaperLongRunDistanceKm({
      normalized,
      policy,
      startDistance,
      peakDistance,
      taperStartWeek,
      weekNumber,
      progressionEndWeek,
    });
  }

  return deriveProgressiveLongRunDistanceKm({
    normalized,
    policy,
    startDistance,
    peakDistance,
    progressionEndWeek,
    weekNumber,
  });
}

function deriveProgressiveLongRunDistanceKm({
  normalized,
  policy,
  startDistance,
  peakDistance,
  progressionEndWeek,
  weekNumber,
}: {
  normalized: NormalizedStructuredInput;
  policy: LongRunGoalPolicy;
  startDistance: number;
  peakDistance: number;
  progressionEndWeek: number;
  weekNumber: number;
}) {
  const progressRatio =
    progressionEndWeek <= 1 ? 1 : Math.min(1, (weekNumber - 1) / (progressionEndWeek - 1));
  const progressionCurve = Math.pow(progressRatio, 0.85);
  const rawDistance = startDistance + (peakDistance - startDistance) * progressionCurve;
  const cutbackDistance = isCutbackWeek(weekNumber, normalized)
    ? Math.max(policy.floorKm, rawDistance * 0.82)
    : rawDistance;

  return Number(Math.min(policy.ceilingKm, cutbackDistance).toFixed(1));
}

function deriveTaperLongRunDistanceKm({
  normalized,
  policy,
  startDistance,
  peakDistance,
  taperStartWeek,
  weekNumber,
  progressionEndWeek,
}: {
  normalized: NormalizedStructuredInput;
  policy: LongRunGoalPolicy;
  startDistance: number;
  peakDistance: number;
  taperStartWeek: number;
  weekNumber: number;
  progressionEndWeek: number;
}) {
  const preTaperDistances = Array.from({ length: Math.max(1, taperStartWeek - 1) }, (_, index) =>
    deriveProgressiveLongRunDistanceKm({
      normalized,
      policy,
      startDistance,
      peakDistance,
      progressionEndWeek,
      weekNumber: index + 1,
    }),
  );
  const preTaperPeakDistance = Math.max(...preTaperDistances);
  const taperWeekCount = normalized.schedule.horizonWeeks - taperStartWeek + 1;
  const taperProgress =
    taperWeekCount <= 1 ? 1 : (weekNumber - taperStartWeek) / (taperWeekCount - 1);
  const firstTaperFactor = taperWeekCount <= 1 ? 0.65 : 0.76;
  const finalTaperFactor = 0.55;
  const taperFactor =
    firstTaperFactor + (finalTaperFactor - firstTaperFactor) * Math.min(1, taperProgress);
  const taperDistance = Math.max(policy.floorKm, preTaperPeakDistance * taperFactor);
  const reductionCap = Math.max(
    policy.floorKm,
    preTaperPeakDistance - Math.max(1, preTaperPeakDistance * 0.08),
  );

  return Number(Math.min(policy.ceilingKm, taperDistance, reductionCap).toFixed(1));
}

function deriveLongRunDurationMin(
  normalized: NormalizedStructuredInput,
  weekNumber: number,
  distanceKm: number,
) {
  if (normalized.runnerProfile.baselineLongRunDurationMin) {
    return roundToFive(Math.max(40, distanceKm * 6.8));
  }

  return roundToFive(distanceKm * 6.5);
}

function deriveLongRunPeakDistanceKm(
  normalized: NormalizedStructuredInput,
  policy: LongRunGoalPolicy,
  startDistance: number,
) {
  const frequency = normalized.runnerProfile.baselineSessionsPerWeek;
  const age = normalized.runnerProfile.age ?? null;
  const hasBenchmark = Boolean(getRecent5kPaceSecondsPerKm(normalized));
  const highAmbition = isHighAmbitionPlan(normalized);
  const shortHorizonPenalty =
    normalized.schedule.horizonWeeks < 10
      ? 4
      : normalized.schedule.horizonWeeks < 14 &&
          ["marathon", "ultra_marathon"].includes(normalized.goal.goalType)
        ? 2
        : 0;
  const frequencyAdjustment = frequency >= 5 ? 2 : frequency <= 3 ? -4 : 0;
  const experienceAdjustment =
    normalized.runnerProfile.experienceLevel === "experienced_runner"
      ? 1.5
      : normalized.runnerProfile.experienceLevel === "new_runner"
        ? -3
        : 0;
  const ageAdjustment = age && age >= 65 ? -4 : age && age >= 55 ? -2 : 0;
  const ambitionAdjustment = highAmbition && hasBenchmark && frequency >= 4 ? 1.5 : 0;
  const unsupportedTargetAdjustment = highAmbition && !hasBenchmark ? -1.5 : 0;
  const peak =
    policy.peakKm +
    frequencyAdjustment +
    experienceAdjustment +
    ageAdjustment +
    ambitionAdjustment +
    unsupportedTargetAdjustment -
    shortHorizonPenalty;

  return Math.min(policy.ceilingKm, Math.max(startDistance + 2, peak));
}
