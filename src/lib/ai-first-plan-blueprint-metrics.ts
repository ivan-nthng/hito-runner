import type { AiBlueprintWorkout, CanonicalWorkout } from "@/lib/ai-first-plan-blueprint-schema";
import type { AiFirstPlanBlueprintNormalizationContext } from "@/lib/ai-first-plan-blueprint-validation";
import { mainLikeSegmentTypes } from "@/lib/ai-first-plan-blueprint-taxonomy";
import type { Step } from "@/lib/training";

export type BlueprintSegmentTargetRole = "warmup" | "main" | "cooldown" | "recovery";

export function buildBlueprintSegmentTarget({
  workout,
  segmentKind,
  context,
  deterministicWorkout,
  repairs,
}: {
  workout: AiBlueprintWorkout;
  segmentKind: BlueprintSegmentTargetRole;
  context: AiFirstPlanBlueprintNormalizationContext;
  deterministicWorkout: CanonicalWorkout | null;
  repairs: string[];
}): NonNullable<Step["target"]> {
  const target: NonNullable<Step["target"]> = {
    intensity: segmentIntensity(workout, segmentKind),
    rpe: segmentKind === "main" ? workout.plannedRpe : Math.max(2, workout.plannedRpe - 2),
    cue: segmentCue(workout, segmentKind),
    hint: segmentHint(workout, segmentKind),
  };

  if (context.paceTargetsAllowed && shouldApplyPaceTarget(workout, segmentKind)) {
    const paceTarget = findDeterministicPaceTarget(deterministicWorkout, segmentKind);

    if (paceTarget) {
      target.pace_min_per_km_range = paceTarget;
    }
  } else if (
    segmentKind === "main" &&
    (workout.metricIntent === "pace_if_allowed" || workout.metricIntent === "mixed_if_allowed")
  ) {
    repairs.push(
      `${workout.title}: kept pace intent effort-based because benchmark/watch gates did not allow numeric pace.`,
    );
  }

  return target;
}

function segmentIntensity(workout: AiBlueprintWorkout, segmentKind: BlueprintSegmentTargetRole) {
  if (segmentKind === "cooldown") {
    return "relaxed";
  }

  if (segmentKind === "recovery") {
    return "easy recovery";
  }

  if (segmentKind === "warmup") {
    return "easy";
  }

  switch (workout.workoutFamily) {
    case "race":
      return "controlled race-specific rhythm";
    case "tempo":
      return "comfortably hard and controlled";
    case "intervals":
      return "controlled faster running";
    case "hills":
      if (workout.workoutIdentity === "controlled_downhill_durability") {
        return "controlled downhill mechanics";
      }

      return "strong but controlled uphill effort";
    case "long":
      return "durable aerobic effort";
    case "trail":
      return "easy time-on-feet effort";
    case "steady":
      return "steady aerobic effort";
    case "recovery":
      return "very easy";
    default:
      return "easy to moderate";
  }
}

function segmentCue(workout: AiBlueprintWorkout, segmentKind: BlueprintSegmentTargetRole) {
  if (segmentKind !== "main") {
    return "Stay relaxed.";
  }

  switch (workout.workoutIdentity) {
    case "5k_sharpening_repeats":
      return "Quick, coordinated, and repeatable; never sprinting.";
    case "10k_rhythm_intervals":
      return "Strong rhythm you could repeat again, not a forced rep.";
    case "race_pace_session":
      return "Race rhythm by effort unless backend pace gates provide a range.";
    case "taper_tuneup_run":
      return "Light and sharp, with freshness protected.";
    case "marathon_steady_specificity":
      return "Steady, patient, and controlled; never a time trial.";
    case "controlled_downhill_durability":
      return "Quick relaxed cadence, controlled mechanics, and no risky descent.";
    case "hike_run_endurance":
      return "Run gentle terrain, power-hike steeper climbs, and keep effort aerobic.";
    case "mountain_long_run_time_on_feet":
      return "Time on feet and terrain control matter more than pace.";
    default:
      return workout.segmentIntent.replaceAll("_", " ");
  }
}

function segmentHint(workout: AiBlueprintWorkout, segmentKind: BlueprintSegmentTargetRole) {
  if (segmentKind !== "main") {
    return "Let breathing settle before changing effort.";
  }

  switch (workout.workoutIdentity) {
    case "5k_sharpening_repeats":
    case "10k_rhythm_intervals":
      return "If repeat quality fades, keep the next one smoother rather than harder.";
    case "race_pace_session":
      return "Use rhythm and control first; pace is optional only when backend truth allows it.";
    case "taper_tuneup_run":
      return "Stop the lift while it still feels easy to recover from.";
    case "marathon_steady_specificity":
      return "Durability comes from patience here, not proving marathon pace.";
    case "controlled_downhill_durability":
      return "Skip downhill work if footing is uncertain or control slips.";
    case "hike_run_endurance":
    case "mountain_long_run_time_on_feet":
      return "Use hiking breaks before fatigue turns into form breakdown.";
    default:
      return "Use the workout purpose, not the watch, as the first governor.";
  }
}

function shouldApplyPaceTarget(
  workout: AiBlueprintWorkout,
  segmentKind: BlueprintSegmentTargetRole,
) {
  if (segmentKind !== "main") {
    return false;
  }

  return !["hills", "trail"].includes(workout.workoutFamily);
}

function findDeterministicPaceTarget(
  deterministicWorkout: CanonicalWorkout | null,
  segmentKind: BlueprintSegmentTargetRole,
) {
  if (!deterministicWorkout) {
    return null;
  }

  const segment =
    deterministicWorkout.segments.find((candidate) =>
      segmentKind === "main"
        ? mainLikeSegmentTypes.has(candidate.segment_type ?? "")
        : candidate.segment_type === segmentKind,
    ) ??
    deterministicWorkout.segments.find((candidate) =>
      Boolean(candidate.target?.pace_min_per_km_range),
    );

  return segment?.target?.pace_min_per_km_range ?? segment?.target?.pace_range_min_km ?? null;
}
