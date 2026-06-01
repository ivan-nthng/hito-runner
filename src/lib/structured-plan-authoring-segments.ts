import {
  type EasySupportKind,
  type NormalizedStructuredInput,
} from "@/lib/structured-plan-authoring-schema";
import {
  buildDefaultEstimatedHrTarget,
  buildEasyTarget,
  buildLongRunTarget,
  buildRepeatRecoveryTarget,
  deriveBenchmarkPaceTargets,
} from "@/lib/structured-plan-authoring-metrics";

export function buildEasyRunSegments({
  workoutId,
  durationMin,
  normalized,
  technicalTrailExposure,
  supportKind,
}: {
  workoutId: string;
  durationMin: number;
  normalized: NormalizedStructuredInput;
  technicalTrailExposure: boolean;
  supportKind: EasySupportKind;
}) {
  const isRecovery = supportKind === "recovery";
  const isCutback = supportKind === "cutback";
  const splitThresholdMin = technicalTrailExposure || isRecovery || isCutback ? 30 : 35;
  const easyHrBand = technicalTrailExposure ? null : isRecovery ? "recovery" : "easy";

  if (durationMin < splitThresholdMin) {
    return [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: technicalTrailExposure
          ? "Easy trail awareness"
          : isRecovery
            ? "Gentle recovery running"
            : isCutback
              ? "Reduced aerobic running"
              : "Easy aerobic running",
        guidance: technicalTrailExposure
          ? "Choose forgiving terrain if available. Keep the effort conversational, watch footing, and avoid risky technical sections."
          : isRecovery
            ? "Keep this lighter than a normal easy run; the purpose is recovery, not extra fitness."
            : isCutback
              ? "Keep this intentionally easy so the week absorbs training instead of adding a new stressor."
              : "Stay relaxed and conversational.",
        prescription: {
          mode: "time" as const,
          duration_min: durationMin,
        },
        target: buildEasyTarget(normalized, { hrBand: easyHrBand }),
      },
    ];
  }

  const openerMin = durationMin >= 45 ? 10 : 8;
  const finishMin = 5;
  const mainMin = durationMin - openerMin - finishMin;

  return [
    {
      segment_id: `${workoutId}_seg_1`,
      sequence: 1,
      segment_type: "warmup" as const,
      label: technicalTrailExposure
        ? "Gentle trail opening"
        : isRecovery
          ? "Very easy recovery opening"
          : isCutback
            ? "Gentle cutback opening"
            : "Easy opening rhythm",
      guidance: technicalTrailExposure
        ? "Start on forgiving terrain if available; keep attention on relaxed footing."
        : isRecovery
          ? "Start extra easy and let the legs loosen without chasing pace."
          : isCutback
            ? "Start softer than usual and keep the day intentionally low-stress."
            : "Start softer than planned and let breathing settle.",
      prescription: {
        mode: "time" as const,
        duration_min: openerMin,
      },
      duration_min: openerMin,
      target: buildEasyTarget(normalized, { hrBand: easyHrBand }),
    },
    {
      segment_id: `${workoutId}_seg_2`,
      sequence: 2,
      segment_type: "main" as const,
      label: technicalTrailExposure
        ? "Conversational trail running"
        : isRecovery
          ? "Easy recovery body"
          : isCutback
            ? "Reduced aerobic body"
            : "Conversational aerobic running",
      guidance: technicalTrailExposure
        ? "Keep the trail exposure low-risk and controlled; avoid chasing pace on uneven ground."
        : isRecovery
          ? "Stay relaxed and light. If the effort drifts up, shorten the run or slow down."
          : isCutback
            ? "Hold a comfortable rhythm that supports recovery for the next training block."
            : "Hold a relaxed, repeatable aerobic rhythm.",
      prescription: {
        mode: "time" as const,
        duration_min: mainMin,
      },
      duration_min: mainMin,
      target: buildEasyTarget(normalized, { hrBand: easyHrBand }),
    },
    {
      segment_id: `${workoutId}_seg_3`,
      sequence: 3,
      segment_type: "cooldown" as const,
      label: isRecovery
        ? "Recovery finish check-in"
        : isCutback
          ? "Low-stress finish check-in"
          : "Relaxed finish check-in",
      guidance: isRecovery
        ? "Finish feeling fresher than when you started."
        : isCutback
          ? "Finish relaxed; the win is leaving energy in reserve."
          : "Finish smooth and easy; you should feel like you could keep going.",
      prescription: {
        mode: "time" as const,
        duration_min: finishMin,
      },
      duration_min: finishMin,
      target: buildEasyTarget(normalized, { hrBand: easyHrBand }),
    },
  ];
}

export function buildRunWalkAdaptationSegments({
  workoutId,
  durationMin,
  normalized,
  weekNumber,
  role,
}: {
  workoutId: string;
  durationMin: number;
  normalized: NormalizedStructuredInput;
  weekNumber: number;
  role: "support" | "recovery" | "long";
}) {
  const warmupMin = role === "long" ? 8 : 5;
  const cooldownMin = 5;
  const runMin = weekNumber <= 1 ? 1 : weekNumber <= 3 ? 2 : 3;
  const walkMin = weekNumber <= 2 ? 2 : weekNumber <= 4 ? 1.5 : 1;
  const availableMin = Math.max(10, durationMin - warmupMin - cooldownMin);
  const repeatCount = Math.max(4, Math.min(10, Math.floor(availableMin / (runMin + walkMin))));
  const easyTarget = role === "long" ? buildLongRunTarget(normalized) : buildEasyTarget(normalized);

  return [
    {
      segment_id: `${workoutId}_seg_1`,
      sequence: 1,
      segment_type: "warmup" as const,
      label: role === "long" ? "Walk-first long-run opening" : "Walk-first adaptation opening",
      guidance:
        "Begin with brisk walking or the easiest possible shuffle. The goal is to arrive ready, not warmed up hard.",
      prescription: {
        mode: "time" as const,
        duration_min: warmupMin,
      },
      duration_min: warmupMin,
      target: buildEasyTarget(normalized, { hrBand: role === "recovery" ? "recovery" : "easy" }),
    },
    {
      segment_id: `${workoutId}_seg_2`,
      sequence: 2,
      segment_type: "interval_block" as const,
      label: role === "long" ? "Run/walk endurance body" : "Run/walk adaptation set",
      guidance:
        "Alternate relaxed running with planned walk breaks. Walk before breathing or form falls apart; this is adaptation, not interval training.",
      duration_min: availableMin,
      prescription: {
        mode: "repeats" as const,
        repeat_count: repeatCount,
        repeat_unit: {
          mode: "time" as const,
          duration_min: runMin,
        },
        recovery_unit: {
          mode: "time" as const,
          duration_min: walkMin,
        },
      },
      target: {
        ...easyTarget,
        intensity: "run_walk_adaptation",
        cue: "Run portions stay conversational; walk breaks are part of the plan.",
      },
      recovery_target: buildRepeatRecoveryTarget(normalized),
    },
    {
      segment_id: `${workoutId}_seg_3`,
      sequence: 3,
      segment_type: "cooldown" as const,
      label: "Walk-down finish",
      guidance:
        "Finish with easy walking or very easy jogging and stop while the body still feels under control.",
      prescription: {
        mode: "time" as const,
        duration_min: cooldownMin,
      },
      duration_min: cooldownMin,
      target: {
        ...buildDefaultEstimatedHrTarget(normalized, role === "recovery" ? "recovery" : "easy"),
        intensity: "walk_down_recovery",
        cue: "Keep this easier than the run/walk body.",
      },
    },
  ];
}

export function buildSteadyRunSegments({
  workoutId,
  durationMin,
  normalized,
}: {
  workoutId: string;
  durationMin: number;
  normalized: NormalizedStructuredInput;
}) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);
  const steadyTarget = {
    intensity: "steady_aerobic",
    ...(paceTargets?.steady ? { pace_min_per_km_range: paceTargets.steady } : {}),
    ...buildDefaultEstimatedHrTarget(normalized, "steady"),
    cue: "Controlled breathing, still sustainable.",
  };

  if (durationMin < 35) {
    return [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Steady aerobic running",
        guidance: "Keep the effort controlled, not race-like.",
        prescription: {
          mode: "time" as const,
          duration_min: durationMin,
        },
        target: steadyTarget,
      },
    ];
  }

  const openerMin = 10;
  const finishMin = 5;
  const mainMin = durationMin - openerMin - finishMin;

  return [
    {
      segment_id: `${workoutId}_seg_1`,
      sequence: 1,
      segment_type: "warmup" as const,
      label: "Controlled aerobic opener",
      guidance: "Begin easy before settling into steady work.",
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
      label: "Steady aerobic body",
      guidance: "Settle into a purposeful but repeatable aerobic rhythm.",
      prescription: {
        mode: "time" as const,
        duration_min: mainMin,
      },
      duration_min: mainMin,
      target: steadyTarget,
    },
    {
      segment_id: `${workoutId}_seg_3`,
      sequence: 3,
      segment_type: "cooldown" as const,
      label: "Smooth controlled finish",
      guidance: "Ease out of the steady effort and finish relaxed.",
      prescription: {
        mode: "time" as const,
        duration_min: finishMin,
      },
      duration_min: finishMin,
      target: buildEasyTarget(normalized),
    },
  ];
}

export function splitSubstantialEnduranceDuration(durationMin: number, minimumSplitMin: number) {
  if (durationMin < minimumSplitMin) {
    return null;
  }

  const openerMin = durationMin >= 60 ? 10 : 8;
  const finishMin = durationMin >= 55 ? 10 : 7;
  const mainMin = durationMin - openerMin - finishMin;

  if (mainMin < 15) {
    return null;
  }

  return { openerMin, mainMin, finishMin };
}

export function buildWarmupSegment(
  workoutId: string,
  sequence: number,
  durationMin: number,
  normalized: NormalizedStructuredInput,
) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    segment_id: `${workoutId}_seg_${sequence}`,
    sequence,
    segment_type: "warmup" as const,
    label: "Warmup",
    prescription: {
      mode: "time" as const,
      duration_min: durationMin,
    },
    duration_min: durationMin,
    target: {
      intensity: "easy",
      ...(paceTargets?.easy ? { pace_min_per_km_range: paceTargets.easy } : {}),
      ...buildDefaultEstimatedHrTarget(normalized, "easy"),
      cue: "Start gently and loosen up.",
    },
  };
}

export function buildCooldownSegment(
  workoutId: string,
  sequence: number,
  durationMin: number,
  normalized: NormalizedStructuredInput,
) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    segment_id: `${workoutId}_seg_${sequence}`,
    sequence,
    segment_type: "cooldown" as const,
    label: "Cooldown",
    prescription: {
      mode: "time" as const,
      duration_min: durationMin,
    },
    duration_min: durationMin,
    target: {
      ...(paceTargets?.recovery ? { pace_min_per_km_range: paceTargets.recovery } : {}),
      ...buildDefaultEstimatedHrTarget(normalized, "recovery"),
      hint: "Walk if needed before stopping.",
    },
  };
}
