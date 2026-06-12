import {
  resolveRunningPlanCompositionWeek,
  type RunningPlanCompositionSignal,
  type RunningPlanCompositionWeek,
} from "@/lib/plan-creation-engine/composition-grammar";
import {
  inferBeginnerHalfMarathonDaysPerWeek,
  isBeginnerHalfMarathonRunner,
  resolveBeginnerHalfMarathonAdaptationWeeks,
  resolveBeginnerHalfMarathonCutbackLongRunMinutes,
  resolveBeginnerHalfMarathonLongRunMinuteBounds,
} from "@/lib/plan-creation-engine/beginner-half-marathon-policy";
import { isMarathonCompletionAdaptationWeek } from "@/lib/plan-creation-engine/marathon-completion-policy";
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
  if (shouldUseBeginnerHalfMarathonAdaptationCue(context)) {
    return enrichBeginnerHalfMarathonAdaptationSegment({ segment, primaryPrescription });
  }

  if (shouldUseMarathonCompletionAdaptationCue(context)) {
    return enrichMarathonCompletionAdaptationSegment({ segment, primaryPrescription });
  }

  if (context.family === "Half Marathon" && context.workoutDayKind === "tempo") {
    return enrichHalfMarathonTempoSegment({ segment, context, primaryPrescription });
  }

  if (context.family === "Marathon Completion" && context.workoutDayKind === "tempo") {
    return enrichMarathonCompletionTempoSegment({ segment, context, primaryPrescription });
  }

  if (context.family === "Marathon Completion" && context.workoutDayKind === "strides") {
    return enrichMarathonCompletionTurnoverSegment({ segment, primaryPrescription });
  }

  if (context.family === "Marathon Completion" && context.workoutDayKind === "steady_aerobic_run") {
    return enrichMarathonCompletionSteadySegment({ segment, primaryPrescription });
  }

  if (context.family === "Marathon Completion" && context.workoutDayKind === "progression") {
    return enrichMarathonCompletionProgressionSegment({ segment, primaryPrescription });
  }

  if (context.workoutDayKind === "long_run" && longRunShouldReceiveCompositionDetail(context)) {
    return enrichLongRunSegment({ segment, context, primaryPrescription });
  }

  if (context.family === "Marathon Completion" && context.workoutDayKind === "cutback_long_run") {
    return enrichMarathonCompletionCutbackSegment({ segment, primaryPrescription });
  }

  return { ...segment, primaryPrescription };
}

function shouldUseBeginnerHalfMarathonAdaptationCue(context: PrescriptionContext) {
  if (context.family !== "Half Marathon" || !isBeginnerHalfMarathonRunner(context.runnerLevel)) {
    return false;
  }

  if (
    context.workoutDayKind !== "easy" &&
    context.workoutDayKind !== "recovery" &&
    context.workoutDayKind !== "long_run"
  ) {
    return false;
  }

  const daysPerWeek = inferBeginnerHalfMarathonDaysPerWeek({
    loadContext: context.loadContext,
    horizonWeeks: context.horizonWeeks,
  });
  const adaptationWeeks = resolveBeginnerHalfMarathonAdaptationWeeks({
    loadContext: context.loadContext,
    daysPerWeek,
  });

  return context.weekNumber <= adaptationWeeks;
}

function shouldUseMarathonCompletionAdaptationCue(context: PrescriptionContext) {
  if (
    context.family !== "Marathon Completion" ||
    context.runnerLevel !== "beginner_new_runner" ||
    (context.workoutDayKind !== "easy" &&
      context.workoutDayKind !== "recovery" &&
      context.workoutDayKind !== "long_run")
  ) {
    return false;
  }

  return isMarathonCompletionAdaptationWeek(context);
}

function enrichBeginnerHalfMarathonAdaptationSegment({
  segment,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  return {
    ...segment,
    primaryPrescription: withIntensityLabel(
      primaryPrescription,
      segment.segmentRole === "main" ? "beginner_run_walk_adaptation" : "easy_adaptation",
    ),
    secondaryCue:
      segment.segmentRole === "main"
        ? "Use relaxed run-walk as needed; the goal is adaptation, not continuous pressure."
        : "Keep the transition soft and beginner-safe.",
  };
}

function enrichMarathonCompletionAdaptationSegment({
  segment,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  return {
    ...segment,
    primaryPrescription: withIntensityLabel(
      primaryPrescription,
      segment.segmentRole === "main"
        ? "marathon_completion_run_walk_adaptation"
        : "easy_adaptation",
    ),
    secondaryCue:
      segment.segmentRole === "main"
        ? "Use run-walk as needed; the goal is durable adaptation toward marathon completion."
        : "Keep this soft so the long runway can build honestly.",
  };
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
    !compositionWeekHasSignal(context, "half_specific_durability") ||
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

function enrichMarathonCompletionTempoSegment({
  segment,
  context,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  context: PrescriptionContext;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  if (segment.segmentRole !== "work" || primaryPrescription.mode !== "repeat") {
    return { ...segment, primaryPrescription };
  }

  return {
    ...segment,
    primaryPrescription: {
      ...primaryPrescription,
      work: {
        ...primaryPrescription.work,
        intensityLabel:
          context.runnerLevel === "professional_competitive"
            ? "marathon_completion_controlled_tempo_support"
            : "marathon_completion_soft_tempo_support",
      },
    },
    secondaryCue: "Controlled completion support: stay smooth, patient, and clearly submaximal.",
  };
}

function enrichMarathonCompletionTurnoverSegment({
  segment,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  if (segment.segmentRole === "work" && primaryPrescription.mode === "repeat") {
    return {
      ...segment,
      primaryPrescription: {
        ...primaryPrescription,
        work: {
          ...primaryPrescription.work,
          intensityLabel: "marathon_completion_turnover",
        },
      },
      secondaryCue: "Relaxed turnover only; stay smooth and completion-focused.",
    };
  }

  return {
    ...segment,
    primaryPrescription: withIntensityLabel(primaryPrescription, "marathon_completion_turnover"),
  };
}

function enrichMarathonCompletionSteadySegment({
  segment,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  if (segment.segmentRole !== "main" && segment.segmentRole !== "finish") {
    return { ...segment, primaryPrescription };
  }

  return {
    ...segment,
    primaryPrescription: withIntensityLabel(
      primaryPrescription,
      "marathon_completion_steady_support",
    ),
    secondaryCue:
      segment.segmentRole === "main"
        ? "Hold steady support without turning this into a hard workout."
        : "Finish composed and ready to absorb the next long run.",
  };
}

function enrichMarathonCompletionProgressionSegment({
  segment,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  if (segment.segmentRole !== "main" && segment.segmentRole !== "finish") {
    return { ...segment, primaryPrescription };
  }

  return {
    ...segment,
    primaryPrescription: withIntensityLabel(
      primaryPrescription,
      segment.segmentRole === "main"
        ? "marathon_completion_progression_support"
        : "marathon_completion_controlled_finish",
    ),
    secondaryCue:
      segment.segmentRole === "main"
        ? "Let the run build gradually from easy to steady without forcing speed."
        : "Close composed; this supports completion durability, not a time goal.",
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
  if (
    context.family !== "Half Marathon" &&
    context.family !== "Marathon Base" &&
    context.family !== "Marathon Completion"
  ) {
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

function enrichMarathonCompletionCutbackSegment({
  segment,
  primaryPrescription,
}: {
  segment: RunningPlanWatchExecutableSegmentTemplate;
  primaryPrescription: RunningPlanSegmentPrescription;
}): RunningPlanWatchExecutableSegmentTemplate {
  if (segment.segmentRole !== "main") {
    return { ...segment, primaryPrescription };
  }

  return {
    ...segment,
    primaryPrescription: withIntensityLabel(
      primaryPrescription,
      "marathon_completion_cutback_protection",
    ),
    secondaryCue: "Use the cutback to absorb the marathon-completion bridge.",
  };
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

function longRunShouldReceiveCompositionDetail(context: PrescriptionContext) {
  if (longRunExceedsNinetyMinutes(context)) {
    return true;
  }

  const composition = resolveCompositionWeek(context);
  return (
    composition.longRunRole === "durability_checkpoint" ||
    composition.longRunRole === "steady_finish" ||
    composition.longRunRole === "taper"
  );
}

function longRunDetailVariant(context: PrescriptionContext) {
  const composition = resolveCompositionWeek(context);
  const variantIndex = context.weekNumber % 3;
  const isHalfMarathon = context.family === "Half Marathon";
  const isMarathonCompletion = context.family === "Marathon Completion";

  if (isMarathonCompletion && composition.longRunRole === "taper") {
    return {
      mainIntensityLabel: "marathon_completion_taper",
      mainCue: "Keep this reduced and confidence-building before the endpoint.",
      checkpointIntensityLabel: "taper_form_check",
      checkpointCue: "Check relaxed form without adding fatigue.",
      finishIntensityLabel: "easy_taper_finish",
      finishCue: "Finish fresher than you started.",
    };
  }

  if (isMarathonCompletion && composition.longRunRole === "steady_finish") {
    return {
      mainIntensityLabel: "marathon_completion_time_on_feet",
      mainCue: "Accumulate calm marathon-completion durability before the controlled finish.",
      checkpointIntensityLabel: "fueling_and_composure_check",
      checkpointCue: "Check fueling, posture, and mental patience before the finish role.",
      finishIntensityLabel: "marathon_completion_steady_finish",
      finishCue: "Finish steady and controlled; this is smooth durability, not a test.",
    };
  }

  if (isMarathonCompletion && composition.longRunRole === "durability_checkpoint") {
    return {
      mainIntensityLabel: "marathon_completion_time_on_feet",
      mainCue: "Build patient time-on-feet for exact marathon completion.",
      checkpointIntensityLabel:
        variantIndex === 1
          ? "marathon_completion_long_run_durability"
          : "marathon_completion_posture_check",
      checkpointCue:
        variantIndex === 1
          ? "Use the checkpoint to keep fueling rhythm repeatable."
          : "Reset shoulders, cadence, and breathing before continuing.",
      finishIntensityLabel:
        variantIndex === 2 ? "relaxed_durable_finish" : "controlled_easy_finish",
      finishCue:
        variantIndex === 2
          ? "Finish relaxed and durable, not depleted."
          : "Close controlled so the next week remains absorbable.",
    };
  }

  if (isHalfMarathon && composition.longRunRole === "steady_finish") {
    return {
      mainIntensityLabel: "half_marathon_durability_easy",
      mainCue: "Build relaxed time-on-feet before the short steady finish.",
      checkpointIntensityLabel: "fueling_and_posture_check",
      checkpointCue: "Check fueling, posture, and breathing before the finish block.",
      finishIntensityLabel: "controlled_steady_finish",
      finishCue: "Finish a touch steadier while staying clearly under race effort.",
    };
  }

  if (!isHalfMarathon && composition.longRunRole === "steady_finish") {
    return {
      mainIntensityLabel: "marathon_base_durable_easy",
      mainCue: "Accumulate calm aerobic time without turning this into race prep.",
      checkpointIntensityLabel: "fueling_and_form_check",
      checkpointCue: "Check fueling, cadence, and relaxed form before the finish.",
      finishIntensityLabel: "durability_steady_finish",
      finishCue: "Finish steady and durable, not fast or race-specific.",
    };
  }

  if (composition.longRunRole === "durability_checkpoint" && variantIndex === 1) {
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

  if (variantIndex === 1) {
    if (isMarathonCompletion) {
      return {
        mainIntensityLabel: "marathon_completion_time_on_feet",
        mainCue: "Settle into patient time-on-feet for the completion build.",
        checkpointIntensityLabel: "fueling_rhythm_check",
        checkpointCue: "Use the checkpoint to keep fueling and patience repeatable.",
        finishIntensityLabel: "controlled_easy_finish",
        finishCue: "Close controlled so the next week remains absorbable.",
      };
    }

    return {
      mainIntensityLabel: isHalfMarathon
        ? "half_marathon_endurance_base"
        : "marathon_base_endurance_base",
      mainCue: isHalfMarathon
        ? "Settle into patient endurance for the half-marathon build."
        : "Settle into patient base endurance without chasing distance proof.",
      checkpointIntensityLabel: "fueling_rhythm_check",
      checkpointCue: "Use the checkpoint to confirm fueling rhythm and relaxed cadence.",
      finishIntensityLabel: "controlled_easy_finish",
      finishCue: "Close controlled, with the same rhythm you can repeat next week.",
    };
  }

  if (variantIndex === 2) {
    if (isMarathonCompletion) {
      return {
        mainIntensityLabel: "marathon_completion_time_on_feet",
        mainCue: "Keep the long run patient while the bridge builds completion durability.",
        checkpointIntensityLabel: "marathon_completion_posture_check",
        checkpointCue: "Reset shoulders, cadence, and breathing before continuing.",
        finishIntensityLabel: "relaxed_durable_finish",
        finishCue: "Finish relaxed and durable, not depleted.",
      };
    }

    return {
      mainIntensityLabel: isHalfMarathon
        ? "half_marathon_endurance_base"
        : "marathon_base_endurance_base",
      mainCue: isHalfMarathon
        ? "Keep the long run patient while the bridge builds durability."
        : "Keep the base run patient and repeatable.",
      checkpointIntensityLabel: "cadence_relaxation_check",
      checkpointCue: "Check cadence, shoulders, and breathing before the closing minutes.",
      finishIntensityLabel: "relaxed_durable_finish",
      finishCue: "Finish relaxed and durable, not depleted.",
    };
  }

  if (isMarathonCompletion) {
    return {
      mainIntensityLabel: "marathon_completion_time_on_feet",
      mainCue: "Settle into patient completion-focused endurance.",
      checkpointIntensityLabel: "posture_breathing_check",
      checkpointCue: "Use the checkpoint to reset posture and breathing before the final minutes.",
      finishIntensityLabel: "settled_easy_finish",
      finishCue: "Finish settled, easy, and ready to absorb the week.",
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
    finishIntensityLabel: "settled_easy_finish",
    finishCue: "Finish settled, easy, and ready to absorb the week.",
  };
}

function compositionWeekHasSignal(
  context: PrescriptionContext,
  signal: RunningPlanCompositionSignal,
) {
  return resolveCompositionWeek(context).familySignals.includes(signal);
}

function resolveCompositionWeek(
  context: PrescriptionContext,
): Pick<RunningPlanCompositionWeek, "familySignals" | "longRunRole"> {
  const composition = resolveRunningPlanCompositionWeek({
    family: context.family,
    runnerLevel: context.runnerLevel,
    loadContext: context.loadContext,
    weekNumber: context.weekNumber,
    horizonWeeks: context.horizonWeeks,
  });

  return {
    familySignals: composition.familySignals,
    longRunRole: composition.longRunRole,
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

  return exactRange(
    roundDurationForPrescription(pickRangeValue(range, context, "work_duration"), {
      context,
      durationRole: "work",
    }),
  );
}

function resolveRecoveryDurationRange(
  range: RunningPlanRange,
  context: PrescriptionContext,
): RunningPlanRange {
  if (rangeIsExactPositive(range)) {
    return range;
  }

  return exactRange(
    roundDurationForPrescription(pickRangeValue(range, context, "recovery_duration"), {
      context,
      durationRole: "recovery",
    }),
  );
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
  if (context.family === "Marathon Completion") {
    const composition = resolveCompositionWeek(context);
    if (composition.longRunRole === "taper") {
      const taperMinutes: Readonly<Record<RunningPlanRunnerLevel, number>> = {
        beginner_new_runner: 50,
        sometimes_runs: 60,
        runs_a_lot: 70,
        professional_competitive: 75,
      };
      return minutes(taperMinutes[context.runnerLevel]);
    }

    const boundsByLevel: Readonly<Record<RunningPlanRunnerLevel, { start: number; peak: number }>> =
      {
        beginner_new_runner: { start: 45, peak: 170 },
        sometimes_runs: { start: 60, peak: 185 },
        runs_a_lot: { start: 75, peak: 205 },
        professional_competitive: { start: 85, peak: 215 },
      };
    const bounds = boundsByLevel[context.runnerLevel];
    const phaseProgress = boundedProgress(context.weekNumber, context.horizonWeeks);
    const conservativeMinutes = context.loadContext === "conservative" ? -10 : 0;
    const rawMinutes =
      bounds.start + (bounds.peak - bounds.start) * phaseProgress + conservativeMinutes;

    return minutes(roundToStep(rawMinutes, 5));
  }

  if (context.family === "Half Marathon" && isBeginnerHalfMarathonRunner(context.runnerLevel)) {
    const bounds = resolveBeginnerHalfMarathonLongRunMinuteBounds({
      loadContext: context.loadContext,
      horizonWeeks: context.horizonWeeks,
    });
    const phaseProgress = boundedProgress(context.weekNumber, context.horizonWeeks);
    const rawMinutes = bounds.start + (bounds.peak - bounds.start) * phaseProgress;

    return minutes(roundToStep(rawMinutes, 5));
  }

  const familyBounds: Readonly<Record<RunningPlanDistanceFamily, { start: number; peak: number }>> =
    {
      "10K": { start: 60, peak: 85 },
      "Half Marathon": { start: 70, peak: 115 },
      "Marathon Base": { start: 75, peak: 120 },
      "Marathon Completion": { start: 75, peak: 205 },
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
  if (context.family === "Half Marathon" && isBeginnerHalfMarathonRunner(context.runnerLevel)) {
    return minutes(
      resolveBeginnerHalfMarathonCutbackLongRunMinutes({
        loadContext: context.loadContext,
        horizonWeeks: context.horizonWeeks,
      }),
    );
  }

  const familyMinutes: Readonly<Record<RunningPlanDistanceFamily, number>> = {
    "10K": 50,
    "Half Marathon": 65,
    "Marathon Base": 70,
    "Marathon Completion": 80,
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

function roundDurationForPrescription(
  valueSeconds: number,
  input: {
    context: PrescriptionContext;
    durationRole: "work" | "recovery";
  },
) {
  const rounded = roundToStep(valueSeconds, durationStepSeconds(input));
  return Math.max(1, rounded);
}

function durationStepSeconds({
  context,
  durationRole,
}: {
  context: PrescriptionContext;
  durationRole: "work" | "recovery";
}) {
  if (
    context.segmentRole === "work" &&
    durationRole === "work" &&
    (context.workoutDayKind === "strides" || context.workoutDayKind === "hills")
  ) {
    return 15;
  }

  if (
    context.segmentRole === "work" &&
    durationRole === "recovery" &&
    (context.workoutDayKind === "strides" || context.workoutDayKind === "hills")
  ) {
    return 15;
  }

  return 60;
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
