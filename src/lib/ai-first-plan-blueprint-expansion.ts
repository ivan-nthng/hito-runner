import type {
  AiBlueprintWorkout,
  CanonicalSegment,
  CanonicalWorkout,
} from "@/lib/ai-first-plan-blueprint-schema";
import {
  buildBlueprintSegmentTarget,
  type BlueprintSegmentTargetRole,
} from "@/lib/ai-first-plan-blueprint-metrics";
import { slugify } from "@/lib/ai-first-plan-blueprint-normalize";
import type { AiFirstPlanBlueprintNormalizationContext } from "@/lib/ai-first-plan-blueprint-validation";
import type { Step, StepPrescription } from "@/lib/training";

export function buildWorkoutSegments({
  workout,
  date,
  totalDurationMin,
  context,
  deterministicWorkout,
  repairs,
}: {
  workout: AiBlueprintWorkout;
  date: string;
  totalDurationMin: number;
  context: AiFirstPlanBlueprintNormalizationContext;
  deterministicWorkout: CanonicalWorkout | null;
  repairs: string[];
}): CanonicalSegment[] {
  return buildIdentitySegmentSpecs(workout, totalDurationMin).map((spec, index) =>
    buildBlueprintSegment({
      workout,
      date,
      sequence: index + 1,
      spec,
      context,
      deterministicWorkout,
      repairs,
    }),
  );
}

interface BlueprintSegmentSpec {
  segmentType: NonNullable<CanonicalSegment["segment_type"]>;
  label: string;
  guidance: string;
  durationMin?: number;
  prescription?: StepPrescription;
  targetRole: BlueprintSegmentTargetRole;
  recoveryTarget?: NonNullable<Step["target"]>;
}

function buildIdentitySegmentSpecs(
  workout: AiBlueprintWorkout,
  totalDurationMin: number,
): BlueprintSegmentSpec[] {
  const split = splitBlueprintDuration(totalDurationMin);

  switch (workout.workoutIdentity) {
    case "controlled_tempo_session":
      return [
        warmupSpec(
          split.warmupMin,
          "Tempo warmup",
          "Start easy, then settle into smooth mechanics before the sustained work.",
        ),
        timedSpec({
          segmentType: "tempo_block",
          label: "Controlled tempo block",
          durationMin: split.mainMin,
          guidance:
            "Hold a comfortably hard effort that stays controlled from start to finish; this is not a race.",
          targetRole: "main",
        }),
        cooldownSpec(
          split.cooldownMin,
          "Tempo cooldown",
          "Ease back to relaxed running and let breathing settle before stopping.",
        ),
      ];
    case "half_marathon_threshold_durability":
      return [
        warmupSpec(
          split.warmupMin,
          "Threshold durability warmup",
          "Start conversational and prepare for sustained half-marathon strength work.",
        ),
        timedSpec({
          segmentType: "tempo_block",
          label: "Half-marathon threshold durability",
          durationMin: split.mainMin,
          guidance:
            "Run a sustained controlled block that builds threshold durability without forcing target pace.",
          targetRole: "main",
        }),
        cooldownSpec(
          split.cooldownMin,
          "Controlled threshold cooldown",
          "Finish easy and preserve enough freshness for the next support day.",
        ),
      ];
    case "5k_sharpening_repeats":
      return intervalSpecs({
        workout,
        split,
        label: `${fiveKSharpeningRepeatCount(totalDurationMin)} short 5K-rhythm reps`,
        guidance:
          "Keep the reps quick and coordinated. The goal is rhythm and repeatability, not an all-out finish.",
        repeatCount: fiveKSharpeningRepeatCount(totalDurationMin),
        repeatUnit: { mode: "distance", distance_km: 0.2 },
        recoveryMin: 2,
        warmupLabel: "5K sharpening warmup",
        cooldownLabel: "5K sharpening cooldown",
      });
    case "10k_rhythm_intervals":
      return intervalSpecs({
        workout,
        split,
        label: `${tenKRhythmRepeatCount(totalDurationMin)} rhythm reps`,
        guidance:
          "Settle into a strong but controlled rhythm. Each rep should feel sustainable enough to repeat.",
        repeatCount: tenKRhythmRepeatCount(totalDurationMin),
        repeatUnit: { mode: "time", duration_min: 4 },
        recoveryMin: 2,
        warmupLabel: "10K rhythm warmup",
        cooldownLabel: "10K rhythm cooldown",
      });
    case "time_intervals":
      return intervalSpecs({
        workout,
        split,
        label: `${timeIntervalRepeatCount(totalDurationMin)} x 3 min`,
        guidance:
          "Run each timed repeat with clean, repeatable form, then recover easily before the next one.",
        repeatCount: timeIntervalRepeatCount(totalDurationMin),
        repeatUnit: { mode: "time", duration_min: 3 },
        recoveryMin: 2,
        warmupLabel: "Interval warmup",
        cooldownLabel: "Interval cooldown",
      });
    case "distance_intervals":
      return intervalSpecs({
        workout,
        split,
        label: `${distanceIntervalRepeatCount(totalDurationMin)} x 400m`,
        guidance:
          "Keep every distance repeat fast but controlled; stop short of sprinting so the set stays repeatable.",
        repeatCount: distanceIntervalRepeatCount(totalDurationMin),
        repeatUnit: { mode: "distance", distance_km: 0.4 },
        recoveryMin: 2,
        warmupLabel: "Distance-interval warmup",
        cooldownLabel: "Distance-interval cooldown",
      });
    case "rolling_hills_session":
      return hillRepeatSpecs({
        split,
        label: `${hillRepeatCount(totalDurationMin, 4, 8)} rolling hill pickups`,
        guidance:
          "Use rolling terrain if available. Keep each uphill controlled, then recover on easier ground without chasing elevation numbers.",
        repeatCount: hillRepeatCount(totalDurationMin, 4, 8),
        repeatMin: 2,
        recoveryMin: 2,
        warmupLabel: "Rolling-hills warmup",
        cooldownLabel: "Rolling-hills cooldown",
      });
    case "uphill_repeats":
      return hillRepeatSpecs({
        split,
        label: `${hillRepeatCount(totalDurationMin, 5, 10)} uphill repeats`,
        guidance:
          "Run uphill with short, steady form. Recover easily downhill or on flat ground; effort matters more than pace.",
        repeatCount: hillRepeatCount(totalDurationMin, 5, 10),
        repeatMin: 2,
        recoveryMin: 2,
        warmupLabel: "Uphill-repeat warmup",
        cooldownLabel: "Uphill-repeat cooldown",
      });
    case "controlled_downhill_durability":
      return hillRepeatSpecs({
        split,
        label: `${downhillDurabilityRepeatCount(totalDurationMin)} controlled descents`,
        guidance:
          "Use only safe gentle downhill terrain. Descend smoothly under control, keep steps quick, and stop the descent work if footing is uncertain.",
        repeatCount: downhillDurabilityRepeatCount(totalDurationMin),
        repeatMin: 1,
        recoveryMin: 2,
        warmupLabel: "Downhill-control warmup",
        cooldownLabel: "Downhill-control cooldown",
      });
    case "technical_trail_easy":
      return enduranceSpecs({
        split,
        warmupLabel: "Easy footing check",
        warmupGuidance:
          "Start on forgiving trail or uneven ground if available and use the first minutes to scan footing.",
        mainLabel: "Low-risk technical trail body",
        mainGuidance:
          "Stay easy, shorten stride on uneven ground, and choose control over speed. Skip technical sections that feel risky.",
        finishLabel: "Controlled trail finish",
        finishGuidance:
          "Finish smooth and cautious; avoid aggressive descents or risky footing even if the legs feel good.",
      });
    case "climbing_steady_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Easy climbing opener",
        warmupGuidance:
          "Begin easy on flat, rolling, or gentle uphill terrain before settling into a steadier climbing rhythm.",
        mainLabel: "Steady climbing body",
        mainGuidance:
          "Use rolling or hilly terrain if available. Keep effort purposeful but controlled, and let pace vary with grade.",
        finishLabel: "Relaxed descent or flat finish",
        finishGuidance:
          "Ease off the climbing effort and keep any downhill running controlled instead of fast.",
      });
    case "hike_run_endurance":
      return enduranceSpecs({
        split,
        warmupLabel: "Easy mountain opening",
        warmupGuidance:
          "Start with easy running or brisk hiking and keep the first minutes comfortably aerobic.",
        mainLabel: "Hike-run endurance body",
        mainGuidance:
          "Power-hike steeper climbs, run gentle terrain easily, and descend under control. Keep the full block sustainable.",
        finishLabel: "Controlled mountain finish",
        finishGuidance:
          "Ease the effort down and keep descents careful. Finish with enough control to recover well.",
      });
    case "mountain_long_run_time_on_feet": {
      const mountainSplit = splitBlueprintDuration(Math.max(totalDurationMin, 55));

      return [
        warmupSpec(
          mountainSplit.warmupMin,
          "Mountain time-on-feet opening",
          "Start easier than planned effort and settle into the terrain rhythm before any climb or descent adds load.",
        ),
        timedSpec({
          segmentType: "main",
          label: "Mountain durability body",
          durationMin: mountainSplit.mainMin,
          guidance:
            "Keep the main block aerobic. Power-hike steeper climbs, run gentle terrain easily, and keep descents controlled.",
          targetRole: "main",
        }),
        {
          segmentType: "fueling" as const,
          label: "Time-on-feet and fueling check",
          guidance:
            "Use this checkpoint to keep effort patient and practice familiar fueling or hydration habits without forcing pace.",
          prescription: { mode: "none" as const },
          targetRole: "recovery" as const,
        },
        cooldownSpec(
          mountainSplit.cooldownMin,
          "Controlled mountain finish",
          "Finish with careful footing and enough reserve to recover well from terrain load.",
        ),
      ];
    }
    case "long_run_with_steady_finish": {
      const finishMin = Math.min(25, Math.max(10, Math.round(totalDurationMin * 0.22)));
      const openerMin = Math.min(12, Math.max(8, Math.round(totalDurationMin * 0.15)));
      const cooldownMin = Math.min(8, Math.max(5, Math.round(totalDurationMin * 0.08)));
      const mainMin = Math.max(25, totalDurationMin - openerMin - finishMin - cooldownMin);

      return [
        warmupSpec(
          openerMin,
          "Patient long-run opening",
          "Start deliberately easier than the rest of the run so the later steady finish stays controlled.",
        ),
        timedSpec({
          segmentType: "main",
          label: "Long aerobic body",
          durationMin: mainMin,
          guidance:
            "Keep the main block durable, relaxed, and repeatable. The goal is aerobic strength, not speed.",
          targetRole: "main",
        }),
        timedSpec({
          segmentType: "main",
          label: "Controlled steady finish",
          durationMin: finishMin,
          guidance:
            "Gently lift the effort late while staying sustainable and relaxed; finish strong, not strained.",
          targetRole: "main",
        }),
        cooldownSpec(
          cooldownMin,
          "Easy long-run cooldown",
          "Ease down and protect recovery for the next training day.",
        ),
      ];
    }
    case "cutback_long_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Gentle cutback opening",
        warmupGuidance:
          "Start very comfortably; this long run is here to absorb the block, not to make up missed work.",
        mainLabel: "Reduced long-run body",
        mainGuidance:
          "Keep the long-run body lower-load and aerobic so durability improves without adding hidden intensity.",
        finishLabel: "Easy absorption finish",
        finishGuidance: "Finish easy and controlled; do not turn this into a make-up workout.",
      });
    case "taper_long_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Fresh taper opening",
        warmupGuidance: "Start relaxed and keep the first section confidence-building.",
        mainLabel: "Shortened taper endurance",
        mainGuidance:
          "Keep the reduced long-run body smooth and fresh; the point is readiness, not peak stress.",
        finishLabel: "Freshness-preserving finish",
        finishGuidance: "Finish feeling fresh, with no late push.",
      });
    case "marathon_steady_specificity":
      return enduranceSpecs({
        split,
        warmupLabel: "Marathon-steady warmup",
        warmupGuidance:
          "Start easy and let the rhythm settle before the marathon-specific steady work.",
        mainLabel: "Controlled marathon-steady running",
        mainGuidance:
          "Hold a sustainable steady rhythm for marathon-aerobic durability. If pace is not allowed, keep this effort-based and patient.",
        finishLabel: "Marathon-steady cooldown",
        finishGuidance: "Ease down before stopping and protect the next day's recovery.",
      });
    case "race_pace_session":
      return enduranceSpecs({
        split,
        warmupLabel: "Race-rhythm warmup",
        warmupGuidance:
          "Start relaxed and prepare for controlled race-specific rhythm without rushing the first minutes.",
        mainLabel: "Controlled race-rhythm block",
        mainGuidance:
          "Practice race-specific rhythm only as far as backend metric gates support it; otherwise use controlled effort and smooth form.",
        finishLabel: "Race-rhythm cooldown",
        finishGuidance:
          "Ease back to relaxed running and finish with confidence rather than fatigue.",
      });
    case "taper_tuneup_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Fresh taper opening",
        warmupGuidance: "Start smooth and easy; the goal is freshness, not added load.",
        mainLabel: "Light taper tune-up",
        mainGuidance:
          "Keep the run easy with only a short controlled lift if the legs feel good. This should sharpen, not drain.",
        finishLabel: "Freshness check-out",
        finishGuidance: "Finish relaxed and leave energy in reserve.",
      });
    case "ultra_time_on_feet_durability": {
      const fuelingCheckMin = totalDurationMin >= 55 ? 0 : null;
      const ultraSplit = splitBlueprintDuration(Math.max(totalDurationMin, 50));
      const mainMin = fuelingCheckMin === 0 ? ultraSplit.mainMin : split.mainMin;

      return [
        warmupSpec(
          ultraSplit.warmupMin,
          "Patient time-on-feet opening",
          "Start easier than planned effort and settle into relaxed durability before terrain or fatigue adds load.",
        ),
        timedSpec({
          segmentType: "main",
          label: "Ultra durability body",
          durationMin: mainMin,
          guidance:
            "Keep the main block aerobic. Use short hike breaks on steeper ground or when fatigue rises, then return to easy running.",
          targetRole: "main",
        }),
        ...(fuelingCheckMin === 0
          ? [
              {
                segmentType: "fueling" as const,
                label: "Fueling and effort check",
                guidance:
                  "Use this checkpoint to keep effort patient and practice the plan's time-on-feet rhythm; do not force pace.",
                prescription: { mode: "none" as const },
                targetRole: "recovery" as const,
              },
            ]
          : []),
        cooldownSpec(
          ultraSplit.cooldownMin,
          "Controlled durability finish",
          "Finish relaxed and controlled. If form fades, hike briefly instead of forcing pace.",
        ),
      ];
    }
    case "recovery_jog":
      return enduranceSpecs({
        split,
        warmupLabel: "Recovery opening",
        warmupGuidance:
          "Start very easy and let the body tell you how much running it wants today.",
        mainLabel: "Gentle recovery jog",
        mainGuidance:
          "Keep the whole block relaxed and conversational. This run supports recovery, not fitness testing.",
        finishLabel: "Relaxed recovery finish",
        finishGuidance: "Finish softer than you started and leave the legs fresher.",
      });
    case "cutback_aerobic_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Cutback aerobic opening",
        warmupGuidance: "Start easy and keep this support day intentionally lower-load.",
        mainLabel: "Reduced aerobic body",
        mainGuidance:
          "Keep the main block comfortable and controlled so the week absorbs previous training.",
        finishLabel: "Cutback finish",
        finishGuidance: "Finish relaxed; do not add intensity just because the run feels short.",
      });
    case "steady_aerobic_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Steady aerobic opening",
        warmupGuidance: "Start easier than steady and let the rhythm build naturally.",
        mainLabel: "Steady aerobic body",
        mainGuidance:
          "Hold a purposeful but controlled aerobic rhythm that supports the goal without becoming tempo work.",
        finishLabel: "Composed steady finish",
        finishGuidance: "Ease down gradually and finish with relaxed form.",
      });
    case "easy_aerobic_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Easy aerobic opening",
        warmupGuidance: "Start comfortably and let the stride settle before the main easy block.",
        mainLabel: "Easy aerobic body",
        mainGuidance:
          "Keep the effort conversational and sustainable. This support run builds consistency without extra strain.",
        finishLabel: "Easy relaxed finish",
        finishGuidance: "Finish feeling like you could have kept going a little longer.",
      });
    default:
      return enduranceSpecs({
        split,
        warmupLabel: "Warm up",
        warmupGuidance: openingGuidance(workout),
        mainLabel: mainLabel(workout),
        mainGuidance: mainGuidance(workout),
        finishLabel: "Cool down",
        finishGuidance: finishGuidance(workout),
      });
  }
}

function buildBlueprintSegment({
  workout,
  date,
  sequence,
  spec,
  context,
  deterministicWorkout,
  repairs,
}: {
  workout: AiBlueprintWorkout;
  date: string;
  sequence: number;
  spec: BlueprintSegmentSpec;
  context: AiFirstPlanBlueprintNormalizationContext;
  deterministicWorkout: CanonicalWorkout | null;
  repairs: string[];
}): CanonicalSegment {
  const prescription = spec.prescription ?? {
    mode: "time" as const,
    duration_min: spec.durationMin ?? 1,
  };
  const durationMin = prescription.mode === "time" ? prescription.duration_min : undefined;
  const distanceKm = prescription.mode === "distance" ? prescription.distance_km : undefined;

  return {
    segment_id: `${slugify(workout.workoutIdentity)}_${date}_seg_${sequence}`,
    segment_type: spec.segmentType,
    sequence,
    label: spec.label,
    ...(durationMin ? { duration_min: durationMin } : {}),
    ...(distanceKm ? { distance_km: distanceKm } : {}),
    guidance: spec.guidance,
    prescription,
    target:
      spec.segmentType === "fueling"
        ? {
            cue: "Keep the checkpoint practical and effort-controlled; do not chase metrics here.",
            hint: "Use familiar fueling or hydration habits only.",
          }
        : buildBlueprintSegmentTarget({
            workout,
            segmentKind: spec.targetRole,
            context,
            deterministicWorkout,
            repairs,
          }),
    ...(spec.recoveryTarget ? { recovery_target: spec.recoveryTarget } : {}),
  } as CanonicalSegment;
}

function splitBlueprintDuration(totalDurationMin: number) {
  if (totalDurationMin < 30) {
    return {
      warmupMin: 5,
      mainMin: Math.max(10, totalDurationMin - 10),
      cooldownMin: 5,
    };
  }

  const warmupMin = Math.min(12, Math.max(6, Math.round(totalDurationMin * 0.2)));
  const cooldownMin = Math.min(10, Math.max(5, Math.round(totalDurationMin * 0.15)));
  const mainMin = Math.max(10, totalDurationMin - warmupMin - cooldownMin);

  return { warmupMin, mainMin, cooldownMin };
}

function timedSpec({
  segmentType,
  label,
  durationMin,
  guidance,
  targetRole,
}: {
  segmentType: BlueprintSegmentSpec["segmentType"];
  label: string;
  durationMin: number;
  guidance: string;
  targetRole: BlueprintSegmentTargetRole;
}): BlueprintSegmentSpec {
  return {
    segmentType,
    label,
    durationMin,
    guidance,
    targetRole,
  };
}

function warmupSpec(durationMin: number, label: string, guidance: string): BlueprintSegmentSpec {
  return timedSpec({
    segmentType: "warmup",
    label,
    durationMin,
    guidance,
    targetRole: "warmup",
  });
}

function cooldownSpec(durationMin: number, label: string, guidance: string): BlueprintSegmentSpec {
  return timedSpec({
    segmentType: "cooldown",
    label,
    durationMin,
    guidance,
    targetRole: "cooldown",
  });
}

function enduranceSpecs({
  split,
  warmupLabel,
  warmupGuidance,
  mainLabel,
  mainGuidance,
  finishLabel,
  finishGuidance,
}: {
  split: ReturnType<typeof splitBlueprintDuration>;
  warmupLabel: string;
  warmupGuidance: string;
  mainLabel: string;
  mainGuidance: string;
  finishLabel: string;
  finishGuidance: string;
}): BlueprintSegmentSpec[] {
  return [
    warmupSpec(split.warmupMin, warmupLabel, warmupGuidance),
    timedSpec({
      segmentType: "main",
      label: mainLabel,
      durationMin: split.mainMin,
      guidance: mainGuidance,
      targetRole: "main",
    }),
    cooldownSpec(split.cooldownMin, finishLabel, finishGuidance),
  ];
}

function intervalSpecs({
  workout,
  split,
  label,
  guidance,
  repeatCount,
  repeatUnit,
  recoveryMin,
  warmupLabel,
  cooldownLabel,
}: {
  workout: AiBlueprintWorkout;
  split: ReturnType<typeof splitBlueprintDuration>;
  label: string;
  guidance: string;
  repeatCount: number;
  repeatUnit: NonNullable<StepPrescription["repeat_unit"]>;
  recoveryMin: number;
  warmupLabel: string;
  cooldownLabel: string;
}): BlueprintSegmentSpec[] {
  return [
    warmupSpec(
      split.warmupMin,
      warmupLabel,
      "Start easy, add a few relaxed form checks, and keep the first repeat under control.",
    ),
    {
      segmentType: "interval_block",
      label,
      guidance,
      prescription: {
        mode: "repeats",
        repeat_count: repeatCount,
        repeat_unit: repeatUnit,
        recovery_unit: {
          mode: "time",
          duration_min: recoveryMin,
        },
      },
      targetRole: "main",
      recoveryTarget: {
        intensity: "easy recovery",
        rpe: Math.max(2, workout.plannedRpe - 3),
        cue: "Recover easily enough that the next repeat stays smooth.",
      },
    },
    cooldownSpec(
      split.cooldownMin,
      cooldownLabel,
      "Ease down after the final repeat and finish with relaxed form.",
    ),
  ];
}

function hillRepeatSpecs({
  split,
  label,
  guidance,
  repeatCount,
  repeatMin,
  recoveryMin,
  warmupLabel,
  cooldownLabel,
}: {
  split: ReturnType<typeof splitBlueprintDuration>;
  label: string;
  guidance: string;
  repeatCount: number;
  repeatMin: number;
  recoveryMin: number;
  warmupLabel: string;
  cooldownLabel: string;
}): BlueprintSegmentSpec[] {
  return [
    warmupSpec(
      split.warmupMin,
      warmupLabel,
      "Start easy and use the opening minutes to find controlled form before any climbing effort.",
    ),
    {
      segmentType: "interval_block",
      label,
      guidance,
      prescription: {
        mode: "repeats",
        repeat_count: repeatCount,
        repeat_unit: {
          mode: "time",
          duration_min: repeatMin,
        },
        recovery_unit: {
          mode: "time",
          duration_min: recoveryMin,
        },
      },
      targetRole: "main",
      recoveryTarget: {
        intensity: "easy terrain recovery",
        rpe: 3,
        cue: "Recover on safe ground and keep descents controlled.",
      },
    },
    cooldownSpec(
      split.cooldownMin,
      cooldownLabel,
      "Finish controlled and avoid adding downhill risk late in the session.",
    ),
  ];
}

function timeIntervalRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 4, 7);
}

function distanceIntervalRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 4, 8);
}

function hillRepeatCount(totalDurationMin: number, min: number, max: number) {
  return boundedRepeatCount(totalDurationMin, min, max);
}

function fiveKSharpeningRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 5, 10);
}

function tenKRhythmRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 3, 6);
}

function downhillDurabilityRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 4, 8);
}

function boundedRepeatCount(totalDurationMin: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(totalDurationMin / 10)));
}

function openingGuidance(workout: AiBlueprintWorkout) {
  if (workout.workoutFamily === "trail" || workout.workoutFamily === "hills") {
    return "Start controlled and use the opening minutes to read terrain, footing, and breathing.";
  }

  return "Start comfortably and let the stride settle before the main purpose of the run.";
}

function mainGuidance(workout: AiBlueprintWorkout) {
  if (workout.workoutFamily === "long") {
    return "Keep the effort durable and repeatable; finish with the same control you had early.";
  }

  if (workout.workoutFamily === "tempo") {
    return "Hold a controlled sustained effort without turning it into a race.";
  }

  if (workout.workoutFamily === "intervals") {
    return "Run the faster work with clean form and keep every repeat repeatable.";
  }

  if (workout.workoutFamily === "hills") {
    return "Use effort first on climbs and stay smooth; terrain makes pace less meaningful.";
  }

  if (workout.workoutFamily === "trail") {
    return "Keep terrain exposure cautious and controlled; hike briefly if form or footing degrades.";
  }

  if (workout.workoutFamily === "progression") {
    return "Progress gradually while keeping the final effort controlled, not maximal.";
  }

  return "Keep the purpose clear and sustainable for the next training day.";
}

function finishGuidance(workout: AiBlueprintWorkout) {
  if (workout.workoutFamily === "trail" || workout.workoutFamily === "hills") {
    return "Finish with controlled form and avoid adding risk late in the session.";
  }

  return "Ease down and finish feeling like you could have kept going a little longer.";
}

function mainLabel(workout: AiBlueprintWorkout) {
  switch (workout.workoutFamily) {
    case "tempo":
      return "Sustained controlled work";
    case "intervals":
      return "Controlled repeat block";
    case "hills":
      return "Hill effort block";
    case "trail":
      return "Terrain control block";
    case "long":
      return "Durability block";
    case "steady":
      return "Steady aerobic block";
    case "progression":
      return "Progression block";
    case "race":
      return "Tune-up block";
    default:
      return "Aerobic block";
  }
}
