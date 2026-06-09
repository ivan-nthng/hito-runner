import type {
  RunningPlanDistanceFamily,
  RunningPlanRange,
  RunningPlanRepeatRecoveryPrescription,
  RunningPlanRepeatWorkPrescription,
  RunningPlanRunnerLevel,
  RunningPlanSegmentPrescription,
  RunningPlanWatchExecutableSegmentTemplate,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine/source-types";

export type RunningPlanPrescriptionLoadContext = "standard" | "conservative";

export interface ResolveRunningPlanPreviewSegmentsOptions {
  family: RunningPlanDistanceFamily;
  workoutDayKind: RunningPlanWorkoutDayKind;
  runnerLevel: RunningPlanRunnerLevel;
  loadContext: RunningPlanPrescriptionLoadContext;
  weekNumber: number;
  horizonWeeks: number;
  segments: readonly RunningPlanWatchExecutableSegmentTemplate[];
}

interface PrescriptionContext extends Omit<ResolveRunningPlanPreviewSegmentsOptions, "segments"> {
  segmentRole: RunningPlanWatchExecutableSegmentTemplate["segmentRole"];
}

export function resolveRunningPlanPreviewSegments({
  segments,
  ...context
}: ResolveRunningPlanPreviewSegmentsOptions): readonly RunningPlanWatchExecutableSegmentTemplate[] {
  return segments.map((segment) => {
    const resolvedContext = {
      ...context,
      segmentRole: segment.segmentRole,
    };
    const resolvedPrescription = resolveSegmentPrescription(
      segment.primaryPrescription,
      resolvedContext,
    );

    return enrichResolvedSegment({
      segment,
      context: resolvedContext,
      primaryPrescription: resolvedPrescription,
    });
  });
}

export function runningPlanPrescriptionIsExact(prescription: RunningPlanSegmentPrescription) {
  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return rangeIsExactPositive(prescription.durationSeconds);
    case "distance":
    case "distance_with_default_hr_cap":
      return rangeIsExactPositive(prescription.distanceMeters);
    case "recovery_time":
      return rangeIsExactPositive(prescription.recoveryDurationSeconds);
    case "recovery_distance":
      return rangeIsExactPositive(prescription.recoveryDistanceMeters);
    case "free_run_with_cap":
      return (
        rangeIsExactPositive(prescription.durationSecondsOrDistanceMeters) &&
        prescription.explicitCap.length > 0
      );
    case "repeat":
      return (
        rangeIsExactPositive(prescription.repeatCount) &&
        repeatWorkIsExact(prescription.work) &&
        repeatRecoveryIsExact(prescription.recovery)
      );
  }
}

function resolveSegmentPrescription(
  prescription: RunningPlanSegmentPrescription,
  context: PrescriptionContext,
): RunningPlanSegmentPrescription {
  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return {
        ...prescription,
        durationSeconds: resolveDurationRange(prescription.durationSeconds, context),
      };
    case "distance":
    case "distance_with_default_hr_cap":
      return {
        ...prescription,
        distanceMeters: resolveDistanceRange(prescription.distanceMeters, context),
      };
    case "recovery_time":
      return {
        ...prescription,
        recoveryDurationSeconds: resolveRecoveryDurationRange(
          prescription.recoveryDurationSeconds,
          context,
        ),
      };
    case "recovery_distance":
      return {
        ...prescription,
        recoveryDistanceMeters: resolveDistanceRange(prescription.recoveryDistanceMeters, context),
      };
    case "free_run_with_cap":
      return {
        ...prescription,
        durationSecondsOrDistanceMeters: resolveDurationRange(
          prescription.durationSecondsOrDistanceMeters,
          context,
        ),
      };
    case "repeat":
      return {
        ...prescription,
        repeatCount: resolveRepeatCountRange(prescription.repeatCount, context),
        work: resolveRepeatWork(prescription.work, context),
        recovery: resolveRepeatRecovery(prescription.recovery, context),
      };
  }
}

function enrichResolvedSegment({
  segment,
  context,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  context: PrescriptionContext;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  if (context.family === "Half Marathon" && context.workoutDayKind === "tempo") {
    return enrichHalfMarathonTempoSegment({ segment, context, primaryPrescription });
  }

  if (context.workoutDayKind === "long_run" && longRunExceedsNinetyMinutes(context)) {
    return enrichLongRunSegment({ segment, context, primaryPrescription });
  }

  return { ...segment, primaryPrescription };
}

function enrichHalfMarathonTempoSegment({
  segment,
  context,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  context: PrescriptionContext;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  if (
    context.runnerLevel !== "sometimes_runs" ||
    context.loadContext !== "standard" ||
    context.weekNumber < 10 ||
    primaryPrescription.mode !== "repeat"
  ) {
    return { ...segment, primaryPrescription };
  }

  if (segment.segmentRole !== "work") {
    return { ...segment, primaryPrescription };
  }

  return {
    ...segment,
    primaryPrescription: {
      ...primaryPrescription,
      work: {
        ...primaryPrescription.work,
        intensityLabel: "half_marathon_durability_tempo",
      },
    },
    secondaryCue:
      "Controlled half-marathon durability: repeat smooth blocks without chasing speed.",
  };
}

function enrichLongRunSegment({
  segment,
  context,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  context: PrescriptionContext;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  if (context.family !== "Half Marathon" && context.family !== "Marathon Base") {
    return { ...segment, primaryPrescription };
  }

  const variant = longRunDetailVariant(context);

  if (segment.segmentRole === "main") {
    return {
      ...segment,
      primaryPrescription: withIntensityLabel(primaryPrescription, variant.mainIntensityLabel),
      secondaryCue: variant.mainCue,
    };
  }

  if (segment.segmentRole === "checkpoint") {
    return {
      ...segment,
      primaryPrescription: withIntensityLabel(
        primaryPrescription,
        variant.checkpointIntensityLabel,
      ),
      secondaryCue: variant.checkpointCue,
    };
  }

  if (segment.segmentRole === "finish") {
    return {
      ...segment,
      primaryPrescription: withIntensityLabel(primaryPrescription, variant.finishIntensityLabel),
      secondaryCue: variant.finishCue,
    };
  }

  return { ...segment, primaryPrescription };
}

function withIntensityLabel(
  prescription: RunningPlanSegmentPrescription,
  intensityLabel: string,
): RunningPlanSegmentPrescription {
  if (prescription.mode === "repeat") {
    return prescription;
  }

  return { ...prescription, intensityLabel };
}

function resolveRepeatWork(
  work: RunningPlanRepeatWorkPrescription,
  context: PrescriptionContext,
): RunningPlanRepeatWorkPrescription {
  if (work.mode === "time") {
    return { ...work, durationSeconds: resolveDurationRange(work.durationSeconds, context) };
  }

  return { ...work, distanceMeters: resolveDistanceRange(work.distanceMeters, context) };
}

function resolveRepeatRecovery(
  recovery: RunningPlanRepeatRecoveryPrescription,
  context: PrescriptionContext,
): RunningPlanRepeatRecoveryPrescription {
  if (recovery.mode === "recovery_time") {
    return {
      ...recovery,
      recoveryDurationSeconds: resolveRecoveryDurationRange(
        recovery.recoveryDurationSeconds,
        context,
      ),
    };
  }

  return {
    ...recovery,
    recoveryDistanceMeters: resolveDistanceRange(recovery.recoveryDistanceMeters, context),
  };
}

function longRunExceedsNinetyMinutes(context: PrescriptionContext) {
  return resolveLongRunDurationSeconds(context) > minutes(90);
}

function longRunDetailVariant(context: PrescriptionContext) {
  const variantIndex = context.weekNumber % 3;
  const isHalfMarathon = context.family === "Half Marathon";
  const steadyFinishIsSafe =
    context.loadContext === "standard" &&
    context.runnerLevel !== "beginner_new_runner" &&
    context.weekNumber >= Math.ceil(context.horizonWeeks * 0.65);

  if (isHalfMarathon && steadyFinishIsSafe && variantIndex === 2) {
    return {
      mainIntensityLabel: "half_marathon_durability_easy",
      mainCue: "Build relaxed time-on-feet before the short steady finish.",
      checkpointIntensityLabel: "fueling_and_posture_check",
      checkpointCue: "Check fueling, posture, and breathing before the finish block.",
      finishIntensityLabel: "controlled_steady_finish",
      finishCue: "Finish a touch steadier while staying clearly under race effort.",
    };
  }

  if (!isHalfMarathon && steadyFinishIsSafe && variantIndex === 2) {
    return {
      mainIntensityLabel: "marathon_base_durable_easy",
      mainCue: "Accumulate calm aerobic time without turning this into race prep.",
      checkpointIntensityLabel: "fueling_and_form_check",
      checkpointCue: "Check fueling, cadence, and relaxed form before the finish.",
      finishIntensityLabel: "durability_steady_finish",
      finishCue: "Finish steady and durable, not fast or race-specific.",
    };
  }

  if (variantIndex === 1) {
    return {
      mainIntensityLabel: isHalfMarathon
        ? "half_marathon_aerobic_durability"
        : "marathon_base_time_on_feet",
      mainCue: isHalfMarathon
        ? "Keep the long middle calm and continuous."
        : "Use this as durable time-on-feet, not a marathon race simulation.",
      checkpointIntensityLabel: "fueling_rhythm_check",
      checkpointCue: "Use the checkpoint to confirm fueling rhythm and relaxed cadence.",
      finishIntensityLabel: "controlled_easy_finish",
      finishCue: "Close controlled, with the same rhythm you can repeat next week.",
    };
  }

  return {
    mainIntensityLabel: isHalfMarathon
      ? "half_marathon_endurance_base"
      : "marathon_base_endurance_base",
    mainCue: isHalfMarathon
      ? "Settle into patient endurance for the half-marathon build."
      : "Settle into patient base endurance without chasing distance proof.",
    checkpointIntensityLabel: "posture_breathing_check",
    checkpointCue: "Use the checkpoint to reset posture and breathing before the final minutes.",
    finishIntensityLabel: "relaxed_durable_finish",
    finishCue: "Finish relaxed and durable, not depleted.",
  };
}

function resolveDurationRange(
  range: RunningPlanRange,
  context: PrescriptionContext,
): RunningPlanRange {
  if (rangeIsExactPositive(range)) {
    return range;
  }

  const specialDuration = resolveSpecialDurationSeconds(range, context);
  if (specialDuration !== null) {
    return exactRange(specialDuration);
  }

  return exactRange(pickRangeValue(range, context, "work_duration"));
}

function resolveRecoveryDurationRange(
  range: RunningPlanRange,
  context: PrescriptionContext,
): RunningPlanRange {
  if (rangeIsExactPositive(range)) {
    return range;
  }

  return exactRange(pickRangeValue(range, context, "recovery_duration"));
}

function resolveDistanceRange(
  range: RunningPlanRange,
  context: PrescriptionContext,
): RunningPlanRange {
  if (rangeIsExactPositive(range)) {
    return range;
  }

  return exactRange(roundToStep(pickRangeValue(range, context, "work_distance"), 100));
}

function resolveRepeatCountRange(
  range: RunningPlanRange,
  context: PrescriptionContext,
): RunningPlanRange {
  if (rangeIsExactPositive(range)) {
    return range;
  }

  return exactRange(Math.round(pickRangeValue(range, context, "repeat_count")));
}

function resolveSpecialDurationSeconds(
  range: RunningPlanRange,
  context: PrescriptionContext,
): number | null {
  if (context.segmentRole === "main" && context.workoutDayKind === "long_run") {
    return clampToRange(resolveLongRunDurationSeconds(context), range);
  }

  if (context.segmentRole === "main" && context.workoutDayKind === "cutback_long_run") {
    return clampToRange(resolveCutbackLongRunDurationSeconds(context), range);
  }

  if (context.segmentRole === "main" && context.workoutDayKind === "marathon_base_endpoint") {
    return clampToRange(resolveMarathonBaseEndpointDurationSeconds(context), range);
  }

  return null;
}

function resolveLongRunDurationSeconds(context: PrescriptionContext) {
  const familyBounds: Readonly<Record<RunningPlanDistanceFamily, { start: number; peak: number }>> =
    {
      "10K": { start: 60, peak: 85 },
      "Half Marathon": { start: 70, peak: 115 },
      "Marathon Base": { start: 75, peak: 120 },
    };
  const bounds = familyBounds[context.family];
  const phaseProgress = boundedProgress(context.weekNumber, context.horizonWeeks);
  const levelMinutes = context.runnerLevel === "professional_competitive" ? 5 : 0;
  const conservativeMinutes = context.loadContext === "conservative" ? -10 : 0;
  const rawMinutes =
    bounds.start +
    (bounds.peak - bounds.start) * phaseProgress +
    levelMinutes +
    conservativeMinutes;

  return minutes(roundToStep(rawMinutes, 5));
}

function resolveCutbackLongRunDurationSeconds(context: PrescriptionContext) {
  const familyMinutes: Readonly<Record<RunningPlanDistanceFamily, number>> = {
    "10K": 50,
    "Half Marathon": 65,
    "Marathon Base": 70,
  };
  const levelMinutes = context.runnerLevel === "professional_competitive" ? 5 : 0;
  const conservativeMinutes = context.loadContext === "conservative" ? -5 : 0;

  return minutes(familyMinutes[context.family] + levelMinutes + conservativeMinutes);
}

function resolveMarathonBaseEndpointDurationSeconds(context: PrescriptionContext) {
  const levelMinutes: Readonly<Record<RunningPlanRunnerLevel, number>> = {
    beginner_new_runner: 40,
    sometimes_runs: 50,
    runs_a_lot: 55,
    professional_competitive: 60,
  };
  const conservativeMinutes = context.loadContext === "conservative" ? -5 : 0;

  return minutes(levelMinutes[context.runnerLevel] + conservativeMinutes);
}

function pickRangeValue(
  range: RunningPlanRange,
  context: PrescriptionContext,
  purpose: "work_duration" | "recovery_duration" | "work_distance" | "repeat_count",
) {
  if (range.min === range.max) {
    return range.min;
  }

  const factor =
    purpose === "recovery_duration" ? 1 - runnerLoadFactor(context) : runnerLoadFactor(context);

  return clampToRange(range.min + (range.max - range.min) * factor, range);
}

function runnerLoadFactor(context: PrescriptionContext) {
  const baseByLevel: Readonly<Record<RunningPlanRunnerLevel, number>> = {
    beginner_new_runner: 0,
    sometimes_runs: 0.35,
    runs_a_lot: 0.7,
    professional_competitive: 1,
  };
  const conservativePenalty = context.loadContext === "conservative" ? 0.25 : 0;

  return Math.max(0, Math.min(1, baseByLevel[context.runnerLevel] - conservativePenalty));
}

function boundedProgress(weekNumber: number, horizonWeeks: number) {
  if (horizonWeeks <= 1) {
    return 0;
  }

  return Math.max(0, Math.min(1, (weekNumber - 1) / (horizonWeeks - 1)));
}

function repeatWorkIsExact(work: RunningPlanRepeatWorkPrescription) {
  if (work.mode === "time") {
    return rangeIsExactPositive(work.durationSeconds);
  }

  return rangeIsExactPositive(work.distanceMeters);
}

function repeatRecoveryIsExact(recovery: RunningPlanRepeatRecoveryPrescription) {
  if (recovery.mode === "recovery_time") {
    return rangeIsExactPositive(recovery.recoveryDurationSeconds);
  }

  return rangeIsExactPositive(recovery.recoveryDistanceMeters);
}

function rangeIsExactPositive(range: RunningPlanRange) {
  return (
    Number.isFinite(range.min) &&
    Number.isFinite(range.max) &&
    range.min > 0 &&
    range.max === range.min
  );
}

function exactRange(value: number): RunningPlanRange {
  return { min: value, max: value };
}

function clampToRange(value: number, range: RunningPlanRange) {
  return Math.max(range.min, Math.min(range.max, value));
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

function minutes(value: number) {
  return value * 60;
}
