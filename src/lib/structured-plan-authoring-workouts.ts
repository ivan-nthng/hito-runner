import {
  type NormalizedStructuredInput,
  type StructuredWeekday,
  type TrainingPhase,
} from "@/lib/structured-plan-authoring-schema";
import {
  buildDefaultEstimatedHrTarget,
  buildEasyTarget,
  buildRepeatRecoveryTarget,
  buildSteadyFinishTarget,
  deriveBenchmarkPaceTargets,
} from "@/lib/structured-plan-authoring-metrics";
import {
  buildRestGuidance,
  deriveEasySupportKind,
  findNextRunningWeekdayAfterLongRun,
  isLimitedSharpeningSupport,
  isMountainSpecificPlan,
  roundToFive,
  shouldAvoidQuality,
  shouldUseBeginnerRunWalkAdaptation,
  shouldUseRecoveryFirstAfterLongRun,
} from "@/lib/structured-plan-authoring-policy";
import {
  buildCooldownSegment,
  buildEasyRunSegments,
  buildRunWalkAdaptationSegments,
  buildSteadyRunSegments,
  buildWarmupSegment,
  splitSubstantialEnduranceDuration,
} from "@/lib/structured-plan-authoring-segments";

export interface BuildWorkoutContext {
  workoutId: string;
  date: string;
  weekday: StructuredWeekday;
  weekNumber: number;
  phase: TrainingPhase;
  normalized: NormalizedStructuredInput;
}

export function buildRestWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "rest" as const,
    source_workout_type: "rest_and_recovery",
    title: "Rest and recovery",
    summary: shouldAvoidQuality(normalized)
      ? "Recovery day that keeps current constraints intact."
      : "No running scheduled today.",
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "rest" as const,
        guidance: buildRestGuidance(normalized),
      },
    ],
  };
}

export function buildEasyWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const easyDurationMin = deriveEasyDurationMin(normalized, weekNumber);
  const recoveryFirstAfterLongRun =
    shouldUseRecoveryFirstAfterLongRun(normalized) &&
    weekday ===
      findNextRunningWeekdayAfterLongRun(
        normalized.availability.runningDays,
        normalized.availability.longRunDay,
      );
  const technicalTrailExposure =
    !recoveryFirstAfterLongRun && isMountainSpecificPlan(normalized) && phase === "Base";
  const supportKind = recoveryFirstAfterLongRun
    ? "recovery"
    : deriveEasySupportKind({
        normalized,
        weekNumber,
        phase,
        technicalTrailExposure,
      });
  const sourceWorkoutType = technicalTrailExposure
    ? "technical_trail_easy"
    : supportKind === "recovery"
      ? "recovery_jog"
      : supportKind === "cutback"
        ? "cutback_aerobic_run"
        : "easy_aerobic_run";
  const runWalkAdaptation =
    !technicalTrailExposure && shouldUseBeginnerRunWalkAdaptation(normalized, weekNumber);
  const title = runWalkAdaptation
    ? supportKind === "recovery"
      ? "Recovery run/walk"
      : supportKind === "cutback"
        ? "Cutback run/walk adaptation"
        : "Run/walk adaptation"
    : technicalTrailExposure
      ? "Technical trail easy run"
      : supportKind === "recovery"
        ? "Recovery jog"
        : supportKind === "cutback"
          ? "Cutback aerobic run"
          : "Easy aerobic run";
  const summary = runWalkAdaptation
    ? supportKind === "recovery"
      ? `${easyDurationMin} min recovery run/walk to absorb the block.`
      : supportKind === "cutback"
        ? `${easyDurationMin} min lower-load run/walk adaptation.`
        : `${easyDurationMin} min beginner-friendly run/walk adaptation.`
    : technicalTrailExposure
      ? `${easyDurationMin} min easy running with low-risk trail or uneven-ground awareness.`
      : supportKind === "recovery"
        ? `${easyDurationMin} min very easy recovery running to absorb the block.`
        : supportKind === "cutback"
          ? `${easyDurationMin} min deliberately easy aerobic running for a lower-load week.`
          : `${easyDurationMin} min comfortable aerobic running.`;

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: sourceWorkoutType,
    title,
    summary,
    planned_rpe: 4,
    segments: runWalkAdaptation
      ? buildRunWalkAdaptationSegments({
          workoutId,
          durationMin: easyDurationMin,
          normalized,
          weekNumber,
          role: supportKind === "recovery" ? "recovery" : "support",
        })
      : buildEasyRunSegments({
          workoutId,
          durationMin: easyDurationMin,
          normalized,
          technicalTrailExposure,
          supportKind,
        }),
  };
}

export function buildSteadyWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const steadyDurationMin = deriveEasyDurationMin(normalized, weekNumber) + 10;

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    source_workout_type: "steady_aerobic_run",
    title: "Steady aerobic run",
    summary: `${steadyDurationMin} min steady aerobic support run.`,
    planned_rpe: 5,
    segments: buildSteadyRunSegments({ workoutId, durationMin: steadyDurationMin, normalized }),
  };
}

export function buildCutbackAerobicWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = Math.max(25, deriveEasyDurationMin(normalized, weekNumber) - 10);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: "cutback_aerobic_run",
    title: "Cutback aerobic run",
    summary: `${durationMin} min deliberately easy aerobic running for a lower-load week.`,
    planned_rpe: 4,
    segments: buildEasyRunSegments({
      workoutId,
      durationMin,
      normalized,
      technicalTrailExposure: false,
      supportKind: "cutback",
    }),
  };
}

export function buildTaperTuneupWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = Math.max(25, deriveEasyDurationMin(normalized, weekNumber) - 5);
  const paceTargets = deriveBenchmarkPaceTargets(normalized);
  const mountainSpecific = isMountainSpecificPlan(normalized);
  const segments =
    durationMin >= 30
      ? buildTaperTuneupSegments({ workoutId, durationMin, normalized, mountainSpecific })
      : [
          {
            segment_id: `${workoutId}_seg_1`,
            sequence: 1,
            segment_type: "main" as const,
            label: "Easy taper running",
            guidance: mountainSpecific
              ? "Stay fresh. Use smooth, low-risk terrain and avoid hard climbing or technical descent stress."
              : "Stay fresh. Add only a short controlled lift if the legs feel good.",
            prescription: {
              mode: "time" as const,
              duration_min: durationMin,
            },
            target: {
              intensity: "easy_with_short_lift",
              ...(paceTargets?.easy ? { pace_min_per_km_range: paceTargets.easy } : {}),
              cue: mountainSpecific
                ? "Light and relaxed; preserve freshness over terrain specificity."
                : "Light, relaxed, and never forced.",
            },
          },
        ];

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: "taper_tuneup_run",
    title: mountainSpecific ? "Mountain taper tune-up run" : "Taper tune-up run",
    summary: mountainSpecific
      ? `${durationMin} min easy tune-up that reduces terrain stress and keeps descents gentle.`
      : `${durationMin} min easy run with a short controlled lift to stay sharp.`,
    planned_rpe: 4,
    segments,
  };
}

function buildTaperTuneupSegments({
  workoutId,
  durationMin,
  normalized,
  mountainSpecific,
}: {
  workoutId: string;
  durationMin: number;
  normalized: NormalizedStructuredInput;
  mountainSpecific: boolean;
}) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);
  const openerMin = 8;
  const finishMin = 5;
  const mainMin = Math.max(10, durationMin - openerMin - finishMin);

  return [
    {
      segment_id: `${workoutId}_seg_1`,
      sequence: 1,
      segment_type: "warmup" as const,
      label: "Fresh taper opening",
      guidance: "Start smooth and easy; the goal is freshness, not added load.",
      prescription: {
        mode: "time" as const,
        duration_min: openerMin,
      },
      duration_min: openerMin,
      target: buildEasyTarget(normalized),
    },
    {
      segment_id: `${workoutId}_seg_2`,
      sequence: 2,
      segment_type: "main" as const,
      label: mountainSpecific ? "Low-stress terrain tune-up" : "Easy taper tune-up",
      guidance: mountainSpecific
        ? "Use smooth, low-risk terrain and avoid hard climbing or technical descent stress."
        : "Keep the run easy, with only a short controlled lift if the legs feel good.",
      prescription: {
        mode: "time" as const,
        duration_min: mainMin,
      },
      duration_min: mainMin,
      target: {
        intensity: "easy_with_short_lift",
        ...(paceTargets?.easy ? { pace_min_per_km_range: paceTargets.easy } : {}),
        cue: mountainSpecific
          ? "Light and relaxed; preserve freshness over terrain specificity."
          : "Light, relaxed, and never forced.",
      },
    },
    {
      segment_id: `${workoutId}_seg_3`,
      sequence: 3,
      segment_type: "cooldown" as const,
      label: "Freshness check-out",
      guidance: "Finish relaxed and leave energy in reserve.",
      prescription: {
        mode: "time" as const,
        duration_min: finishMin,
      },
      duration_min: finishMin,
      target: buildEasyTarget(normalized),
    },
  ];
}

export function buildProgressionWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = deriveEasyDurationMin(normalized, weekNumber) + 5;
  const steadyFinishDurationMin = Math.min(20, Math.max(10, roundToFive(durationMin * 0.3)));
  const baseDurationMin = Math.max(20, durationMin - steadyFinishDurationMin);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "progression" as const,
    source_workout_type: "progression_run",
    title: "Progression run",
    summary: `${durationMin} min starting easy and finishing controlled steady.`,
    planned_rpe: 6,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Easy opening",
        guidance: "Start deliberately comfortable and keep the first part patient.",
        prescription: {
          mode: "time" as const,
          duration_min: baseDurationMin,
        },
        duration_min: baseDurationMin,
        target: buildEasyTarget(normalized),
      },
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "main" as const,
        label: "Controlled progression finish",
        guidance: "Lift toward steady effort without turning it into a race.",
        prescription: {
          mode: "time" as const,
          duration_min: steadyFinishDurationMin,
        },
        duration_min: steadyFinishDurationMin,
        target: buildSteadyFinishTarget(normalized),
      },
    ],
  };
}

export function buildAerobicStridesWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const easyDurationMin = Math.max(25, deriveEasyDurationMin(normalized, weekNumber) - 5);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: "aerobic_strides",
    title: "Easy run with relaxed strides",
    summary: `${easyDurationMin} min easy running with short relaxed strides for safe leg speed.`,
    planned_rpe: 5,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Easy aerobic running",
        guidance: "Keep the run conversational before the strides.",
        prescription: {
          mode: "time" as const,
          duration_min: easyDurationMin,
        },
        target: buildEasyTarget(normalized),
      },
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: "Relaxed strides",
        guidance:
          "Run quick but smooth for a few short strides. Stop while they still feel relaxed.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: isLimitedSharpeningSupport(normalized) ? 4 : 6,
          repeat_unit: {
            mode: "time" as const,
            duration_min: 0.5,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 1.5,
          },
        },
        target: {
          intensity: "relaxed_strides",
          cue: "Fast-feeling, light, and never sprinting.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
    ],
  };
}

export function buildFiveKSharpeningWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = Math.min(10, 5 + Math.floor((weekNumber - 1) / 3));
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality" as const,
    source_workout_type: "5k_sharpening_repeats",
    title: "5K sharpening repeats",
    summary: `${repeatCount} short controlled reps for 5K rhythm without sprinting.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} short 5K-rhythm reps`,
        guidance:
          "Keep the reps quick and coordinated. The goal is rhythm and repeatability, not an all-out finish.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "distance" as const,
            distance_km: 0.2,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "5k_sharpening",
          ...(paceTargets?.interval ? { pace_min_per_km_range: paceTargets.interval } : {}),
          cue: "Controlled faster running; smooth, repeatable, and never sprinting.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

export function buildTenKRhythmWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = Math.min(6, 3 + Math.floor((weekNumber - 1) / 4));
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality" as const,
    source_workout_type: "10k_rhythm_intervals",
    title: "10K rhythm intervals",
    summary: `${repeatCount} controlled rhythm reps for sustained 10K-style quality.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} rhythm reps`,
        guidance:
          "Settle into a strong but controlled rhythm. Each rep should feel sustainable enough to repeat.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time" as const,
            duration_min: 4,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "10k_rhythm",
          ...(paceTargets?.tempo ? { pace_min_per_km_range: paceTargets.tempo } : {}),
          cue: "Rhythmic sustained quality, controlled rather than forced.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

export function buildHalfMarathonThresholdWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = phase === "Specific" ? 3 : 2;
  const blockDurationMin = Math.min(12, 8 + Math.floor((weekNumber - 1) / 5) * 2);
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "tempo" as const,
    source_workout_type: "half_marathon_threshold_durability",
    title: "Half marathon threshold durability",
    summary: `${repeatCount} controlled threshold blocks to build sustained aerobic strength.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} threshold blocks`,
        guidance:
          "Stay comfortably hard and even. This should build steady durability, not leave you depleted.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time" as const,
            duration_min: blockDurationMin,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 3,
          },
        },
        target: {
          intensity: "threshold_steady",
          ...(paceTargets?.tempo ? { pace_min_per_km_range: paceTargets.tempo } : {}),
          ...buildDefaultEstimatedHrTarget(normalized, "tempo"),
          cue: "Sustained and controlled, with enough restraint to finish strong.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

export function buildMarathonSteadySpecificityWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const steadyDurationMin = Math.min(45, 22 + Math.floor((weekNumber - 1) / 3) * 4);
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    source_workout_type: "marathon_steady_specificity",
    title: "Marathon steady specificity",
    summary: `${steadyDurationMin} min controlled steady running for marathon-specific durability.`,
    planned_rpe: 6,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "main" as const,
        label: "Controlled marathon-steady running",
        guidance:
          "Hold a sustainable steady rhythm. If you already use a fueling routine, keep it familiar and simple on longer steady days.",
        prescription: {
          mode: "time" as const,
          duration_min: steadyDurationMin,
        },
        duration_min: steadyDurationMin,
        target: {
          intensity: "marathon_steady",
          ...(paceTargets?.steady ? { pace_min_per_km_range: paceTargets.steady } : {}),
          ...buildDefaultEstimatedHrTarget(normalized, "steady"),
          cue: "Steady, patient, and controlled; never a time trial.",
        },
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

export function buildUltraDurabilityWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = Math.max(50, deriveEasyDurationMin(normalized, weekNumber) + 15);
  const durationSplit = splitSubstantialEnduranceDuration(durationMin, 45);
  const segments = durationSplit
    ? [
        {
          segment_id: `${workoutId}_seg_1`,
          sequence: 1,
          segment_type: "warmup" as const,
          label: "Patient time-on-feet opening",
          guidance:
            "Start easier than the planned effort and settle into relaxed durability before terrain or fatigue adds load.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.openerMin,
          },
          duration_min: durationSplit.openerMin,
          target: {
            intensity: "easy_time_on_feet",
            ...buildDefaultEstimatedHrTarget(normalized, "longAerobic"),
            cue: "Aerobic patience first; speed is not the goal.",
          },
        },
        {
          segment_id: `${workoutId}_seg_2`,
          sequence: 2,
          segment_type: "main" as const,
          label: "Ultra durability body",
          guidance:
            "Keep the main block aerobic. Use short hike breaks on steeper ground or when fatigue rises, then return to easy running.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.mainMin,
          },
          duration_min: durationSplit.mainMin,
          target: {
            intensity: "easy_time_on_feet",
            ...buildDefaultEstimatedHrTarget(normalized, "longAerobic"),
            cue: "Time on feet and recovery protection matter more than road-race speed.",
          },
        },
        {
          segment_id: `${workoutId}_seg_3`,
          sequence: 3,
          segment_type: "cooldown" as const,
          label: "Controlled durability finish",
          guidance:
            "Finish relaxed and controlled. If form fades, hike briefly instead of forcing pace.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.finishMin,
          },
          duration_min: durationSplit.finishMin,
          target: {
            intensity: "easy_time_on_feet",
            ...buildDefaultEstimatedHrTarget(normalized, "longAerobic"),
            hint: "Leave enough in reserve for the next training day.",
          },
        },
      ]
    : [
        {
          segment_id: `${workoutId}_seg_1`,
          sequence: 1,
          segment_type: "main" as const,
          label: "Ultra durability running",
          guidance:
            "Keep the full session aerobic. Use short hike breaks on steeper terrain or fatigue, and protect the next day's recovery.",
          prescription: {
            mode: "time" as const,
            duration_min: durationMin,
          },
          target: {
            intensity: "easy_time_on_feet",
            ...buildDefaultEstimatedHrTarget(normalized, "longAerobic"),
            cue: "Durability and patience matter more than road-race speed.",
          },
        },
      ];

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    source_workout_type: "ultra_time_on_feet_durability",
    title: "Ultra time-on-feet durability",
    summary: `${durationMin} min aerobic durability session with patient effort and hike/run allowance.`,
    planned_rpe: 5,
    segments,
  };
}

export function buildTechnicalTrailEasyWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = deriveEasyDurationMin(normalized, weekNumber);
  const durationSplit = splitSubstantialEnduranceDuration(durationMin, 30);
  const segments = durationSplit
    ? [
        {
          segment_id: `${workoutId}_seg_1`,
          sequence: 1,
          segment_type: "warmup" as const,
          label: "Easy footing check",
          guidance:
            "Start on forgiving trail or uneven ground if available. Keep the first minutes conversational while you scan footing.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.openerMin,
          },
          duration_min: durationSplit.openerMin,
          target: {
            ...buildEasyTarget(normalized, { hrBand: null }),
            cue: "Easy effort with relaxed trail awareness; no exact elevation target.",
          },
        },
        {
          segment_id: `${workoutId}_seg_2`,
          sequence: 2,
          segment_type: "main" as const,
          label: "Low-risk technical trail body",
          guidance:
            "Stay easy, shorten stride on uneven ground, and choose control over speed. Skip technical sections that feel risky.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.mainMin,
          },
          duration_min: durationSplit.mainMin,
          target: {
            ...buildEasyTarget(normalized, { hrBand: null }),
            cue: "Footing control and calm effort matter more than pace.",
          },
        },
        {
          segment_id: `${workoutId}_seg_3`,
          sequence: 3,
          segment_type: "cooldown" as const,
          label: "Controlled trail finish",
          guidance:
            "Finish smooth and cautious. Avoid aggressive descents or risky footing even if the legs feel good.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.finishMin,
          },
          duration_min: durationSplit.finishMin,
          target: {
            ...buildEasyTarget(normalized, { hrBand: null }),
            hint: "The win is relaxed control, not a faster split.",
          },
        },
      ]
    : [
        {
          segment_id: `${workoutId}_seg_1`,
          sequence: 1,
          segment_type: "main" as const,
          label: "Low-risk trail exposure",
          guidance:
            "Use forgiving trail or uneven ground if available. Keep effort easy, shorten stride, and skip technical sections that feel risky.",
          prescription: {
            mode: "time" as const,
            duration_min: durationMin,
          },
          target: {
            ...buildEasyTarget(normalized, { hrBand: null }),
            cue: "Easy effort with relaxed footing awareness; no exact elevation target.",
          },
        },
      ];

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: "technical_trail_easy",
    title: "Technical trail easy run",
    summary: `${durationMin} min easy trail exposure with cautious footing and no risky terrain requirement.`,
    planned_rpe: 4,
    segments,
  };
}

export function buildControlledDownhillDurabilityWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = Math.min(8, 4 + Math.floor((weekNumber - 1) / 4));

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality" as const,
    source_workout_type: "controlled_downhill_durability",
    title: "Controlled downhill durability",
    summary: `${repeatCount} short controlled descents for careful downhill durability, with easy recovery.`,
    planned_rpe: 6,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} controlled descents`,
        guidance:
          "Use a gentle grade only. Descend smoothly under control, keep steps quick, and stop the descent work if footing is uncertain.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time" as const,
            duration_min: 1,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "controlled_downhill_durability",
          cue: "Controlled descent skill and eccentric durability; never reckless downhill racing.",
        },
        recovery_target: {
          intensity: "very_easy_recovery",
          hint: "Walk or jog easily on flat or uphill ground before the next descent.",
        },
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

export function buildHikeRunEnduranceWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = Math.max(45, deriveEasyDurationMin(normalized, weekNumber) + 20);
  const durationSplit = splitSubstantialEnduranceDuration(durationMin, 45);
  const segments = durationSplit
    ? [
        {
          segment_id: `${workoutId}_seg_1`,
          sequence: 1,
          segment_type: "warmup" as const,
          label: "Easy mountain opening",
          guidance:
            "Start with easy running or brisk hiking and keep the first minutes comfortably aerobic.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.openerMin,
          },
          duration_min: durationSplit.openerMin,
          target: {
            intensity: "easy_time_on_feet",
            cue: "Settle into terrain rhythm before adding time-on-feet load.",
          },
        },
        {
          segment_id: `${workoutId}_seg_2`,
          sequence: 2,
          segment_type: "main" as const,
          label: "Hike-run endurance body",
          guidance:
            "Power-hike steeper climbs, run gentle terrain easily, and descend under control. Keep the full block sustainable.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.mainMin,
          },
          duration_min: durationSplit.mainMin,
          target: {
            intensity: "easy_time_on_feet",
            cue: "Time on feet matters more than pace; use effort control on climbs and descents.",
          },
        },
        {
          segment_id: `${workoutId}_seg_3`,
          sequence: 3,
          segment_type: "cooldown" as const,
          label: "Controlled mountain finish",
          guidance:
            "Ease the effort down and keep descents careful. Finish with enough control to recover well.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.finishMin,
          },
          duration_min: durationSplit.finishMin,
          target: {
            intensity: "easy_time_on_feet",
            hint: "Use hiking breaks if they keep the session aerobic.",
          },
        },
      ]
    : [
        {
          segment_id: `${workoutId}_seg_1`,
          sequence: 1,
          segment_type: "main" as const,
          label: "Mountain hike-run endurance",
          guidance:
            "Keep the whole session aerobic. Power-hike steep climbs, run gentle terrain easily, and descend with control rather than speed.",
          prescription: {
            mode: "time" as const,
            duration_min: durationMin,
          },
          target: {
            intensity: "easy_time_on_feet",
            cue: "Time on feet matters more than pace; use effort control on climbs and descents.",
          },
        },
      ];

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    source_workout_type: "hike_run_endurance",
    title: "Hike-run endurance",
    summary: `${durationMin} min time-on-feet session using easy running plus power-hike breaks on steeper climbs.`,
    planned_rpe: 5,
    segments,
  };
}

export function buildRollingHillsWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = Math.min(8, 4 + Math.floor((weekNumber - 1) / 4));
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality" as const,
    source_workout_type: "rolling_hills_session",
    title: "Rolling hills session",
    summary: `${repeatCount} relaxed hill pickups on rolling terrain with easy recovery.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} rolling hill pickups`,
        guidance:
          "Use gentle rolling terrain. Keep each uphill controlled and recover fully on easy ground.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "controlled_hill_effort",
          ...(paceTargets?.rollingHill ? { pace_min_per_km_range: paceTargets.rollingHill } : {}),
          cue: "Smooth uphill form; no exact elevation target.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

export function buildHillRepeatsWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = Math.min(10, 5 + Math.floor((weekNumber - 1) / 3));
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality" as const,
    source_workout_type: "uphill_repeats",
    title: "Uphill repeats",
    summary: `${repeatCount} controlled uphill repeats with easy downhill or flat recovery.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} uphill repeats`,
        guidance:
          "Run uphill with short, steady form. Recover easily downhill or on flat ground; do not chase elevation numbers.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "uphill_strength",
          ...(paceTargets?.hillRepeat ? { pace_min_per_km_range: paceTargets.hillRepeat } : {}),
          cue: "Use effort first on climbs; pace may drift slower on steeper grades.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

export function buildClimbingSteadyWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = deriveEasyDurationMin(normalized, weekNumber) + 10;
  const paceTargets = deriveBenchmarkPaceTargets(normalized);
  const durationSplit = splitSubstantialEnduranceDuration(durationMin, 35);
  const steadyTarget = {
    intensity: "steady_climbing",
    ...(paceTargets?.hillSteady ? { pace_min_per_km_range: paceTargets.hillSteady } : {}),
    cue: "Controlled climbing rhythm with relaxed descents.",
  };
  const segments = durationSplit
    ? [
        {
          segment_id: `${workoutId}_seg_1`,
          sequence: 1,
          segment_type: "warmup" as const,
          label: "Easy climbing opener",
          guidance:
            "Begin easy on flat, rolling, or gentle uphill terrain before settling into the steadier climbing rhythm.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.openerMin,
          },
          duration_min: durationSplit.openerMin,
          target: buildEasyTarget(normalized),
        },
        {
          segment_id: `${workoutId}_seg_2`,
          sequence: 2,
          segment_type: "main" as const,
          label: "Steady climbing body",
          guidance:
            "Use rolling or hilly terrain if available. Keep effort purposeful but controlled, and let pace vary with grade.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.mainMin,
          },
          duration_min: durationSplit.mainMin,
          target: steadyTarget,
        },
        {
          segment_id: `${workoutId}_seg_3`,
          sequence: 3,
          segment_type: "cooldown" as const,
          label: "Relaxed descent or flat finish",
          guidance:
            "Ease off the climbing effort and keep any downhill running controlled instead of fast.",
          prescription: {
            mode: "time" as const,
            duration_min: durationSplit.finishMin,
          },
          duration_min: durationSplit.finishMin,
          target: buildEasyTarget(normalized),
        },
      ]
    : [
        {
          segment_id: `${workoutId}_seg_1`,
          sequence: 1,
          segment_type: "main" as const,
          label: "Steady hill exposure",
          guidance:
            "Use rolling or hilly terrain if available. Keep effort steady and controlled; avoid exact elevation targets.",
          prescription: {
            mode: "time" as const,
            duration_min: durationMin,
          },
          target: steadyTarget,
        },
      ];

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    source_workout_type: "climbing_steady_run",
    title: "Climbing steady run",
    summary: `${durationMin} min steady run with intentional hill exposure.`,
    planned_rpe: 6,
    segments,
  };
}

export function buildTempoWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const tempoDurationMin = Math.min(35, 16 + (weekNumber - 1) * 2);
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "tempo" as const,
    source_workout_type: "controlled_tempo_session",
    title: "Controlled tempo session",
    summary: `${tempoDurationMin} min controlled tempo running between easy and race effort.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "tempo_block" as const,
        label: "Tempo block",
        guidance: "Stay controlled. You should finish strong, not desperate.",
        prescription: {
          mode: "time" as const,
          duration_min: tempoDurationMin,
        },
        duration_min: tempoDurationMin,
        target: {
          intensity: "tempo",
          ...(paceTargets?.tempo ? { pace_min_per_km_range: paceTargets.tempo } : {}),
          ...buildDefaultEstimatedHrTarget(normalized, "tempo"),
          cue: "Comfortably hard, sustainable for the whole block.",
        },
      },
      buildCooldownSegment(workoutId, 3, 8, normalized),
    ],
  };
}

export function buildDistanceIntervalsWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = Math.min(8, 4 + Math.floor((weekNumber - 1) / 3));
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality" as const,
    source_workout_type: "distance_intervals",
    title: "Distance intervals",
    summary: `${repeatCount} x 400m at controlled 5K effort with 2 min recovery.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} x 400m`,
        guidance: "Stay smooth and repeatable across all reps.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "distance" as const,
            distance_km: 0.4,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "5k_effort",
          ...(paceTargets?.interval ? { pace_min_per_km_range: paceTargets.interval } : {}),
          cue: "Fast but controlled, never sprinting.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

export function buildTimeIntervalsWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = Math.min(7, 4 + Math.floor((weekNumber - 1) / 4));
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality" as const,
    source_workout_type: "time_intervals",
    title: "Time intervals",
    summary: `${repeatCount} x 3 min controlled intervals with 2 min recovery.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} x 3 min`,
        guidance: "Keep each repeat repeatable and slightly quicker than tempo effort.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time" as const,
            duration_min: 3,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "10k_effort",
          ...(paceTargets?.interval ? { pace_min_per_km_range: paceTargets.interval } : {}),
          cue: "Quick, rhythmic running with controlled recovery.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

function deriveEasyDurationMin(normalized: NormalizedStructuredInput, weekNumber: number) {
  const base =
    normalized.runnerProfile.baselineLongRunDurationMin ??
    normalized.runnerProfile.baselineLongRunKm! * 6;
  const ageAdjustment = normalized.runnerProfile.age && normalized.runnerProfile.age >= 60 ? -5 : 0;
  const frequencyAdjustment =
    normalized.runnerProfile.baselineSessionsPerWeek >= 5
      ? 5
      : normalized.runnerProfile.baselineSessionsPerWeek <= 2
        ? -5
        : 0;
  const progression = Math.min(18, Math.floor((weekNumber - 1) / 3) * 4);

  return roundToFive(Math.max(25, base * 0.52 + progression + ageAdjustment + frequencyAdjustment));
}
