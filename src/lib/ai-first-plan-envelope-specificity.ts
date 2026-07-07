import type { AuthoredWorkoutIdentity } from "@/lib/ai-first-plan-blueprint-taxonomy";
import type {
  AiFirstPlanEnvelope,
  AiFirstPlanEnvelopeSpecificityTrace,
  CanonicalWorkout,
  StructuredAuthoringInput,
} from "@/lib/ai-first-plan-envelope-schema";
import { finalizeGeneratedWorkoutRows } from "@/lib/structured-plan-authoring-finalize";
import {
  isCutbackWeek,
  isLimitedSharpeningSupport,
  phaseForWeek,
  resolveSupportedIntensityCadence,
  resolveSupportedSpecificityIdentityOptions,
  shouldAvoidQuality,
  shouldScheduleSupportedIntensityWeek,
  type SupportedSpecificityIdentity,
} from "@/lib/structured-plan-authoring-policy";
import {
  normalizeStructuredPlanAuthoringInput,
  type StructuredWeekday,
} from "@/lib/structured-plan-authoring";
import type { TrainingPhase } from "@/lib/structured-plan-authoring-schema";
import {
  buildFiveKSharpeningWorkout,
  buildHalfMarathonThresholdWorkout,
  buildAerobicStridesWorkout,
  buildProgressionWorkout,
  buildTempoWorkout,
  buildTenKRhythmWorkout,
  type BuildWorkoutContext,
} from "@/lib/structured-plan-authoring-workouts";

type RoadEnvelopeIdentity =
  | "5k_sharpening_repeats"
  | "10k_rhythm_intervals"
  | "half_marathon_threshold_durability";

const roadEnvelopeGoalTypes = new Set(["5k", "10k", "half_marathon", "marathon"]);
const longRunIdentities = new Set([
  "long_aerobic_run",
  "long_run_with_steady_finish",
  "cutback_long_run",
  "taper_long_run",
]);

export function applyAiFirstPlanEnvelopeSpecificity({
  workouts,
  envelope,
  authoringInput,
}: {
  workouts: CanonicalWorkout[];
  envelope: AiFirstPlanEnvelope;
  authoringInput: StructuredAuthoringInput;
}) {
  const normalized = normalizeStructuredPlanAuthoringInput(authoringInput);
  const trace = buildInitialTrace(envelope);

  if (!roadEnvelopeGoalTypes.has(normalized.goal.goalType)) {
    trace.safetyDowngrades.push({
      reason: "non_road_goal_family",
      message:
        "Envelope specificity refinement leaves non-road terrain/ultra/marathon scaffolds unchanged.",
    });

    return { workouts, trace };
  }

  if (normalized.goal.goalType === "marathon") {
    trace.safetyDowngrades.push({
      reason: "marathon_low_support_preservation",
      message:
        "Marathon envelope expansion keeps existing low-support long-run/recovery archetypes instead of adding midweek load.",
    });

    return { workouts, trace };
  }

  if (shouldAvoidQuality(normalized)) {
    trace.safetyDowngrades.push({
      reason: "quality_avoidance_policy",
      message:
        "Backend quality-avoidance policy keeps envelope specificity out of this first plan.",
    });

    return { workouts, trace };
  }

  const targetIdentity = resolveRoadEnvelopeTargetIdentity(envelope, normalized.goal.goalType);

  if (!targetIdentity) {
    trace.safetyDowngrades.push({
      reason: "no_declared_road_specificity",
      message: "Envelope did not declare a road specificity emphasis that requires refinement.",
    });

    return { workouts, trace };
  }

  if (
    (targetIdentity === "5k_sharpening_repeats" || targetIdentity === "10k_rhythm_intervals") &&
    isLimitedSharpeningSupport(normalized)
  ) {
    trace.safetyDowngrades.push({
      reason: "limited_sharpening_support",
      message:
        "Backend support evidence keeps short-race sharpening at strides/progression/tempo support.",
    });

    return { workouts, trace };
  }

  const cadence = resolveSupportedIntensityCadence(normalized);

  if (!cadence.applies || cadence.frequency === "none") {
    trace.safetyDowngrades.push({
      reason: "cadence_policy_none",
      message: cadence.reason,
    });

    return { workouts, trace };
  }

  const candidateWeeks = selectCandidateWeeks({
    envelope,
    workouts,
    targetIdentity,
    halfMarathonLimit: normalized.goal.goalType === "half_marathon",
  });
  const nextWorkouts = [...workouts];

  trace.declaredCandidateWeekCount = candidateWeeks.length;

  for (const weekNumber of candidateWeeks) {
    const weekCadence = resolveSupportedIntensityCadence(normalized, weekNumber);

    if (!shouldScheduleSupportedIntensityWeek(normalized, weekNumber, weekCadence)) {
      trace.safetyDowngrades.push({
        weekNumber,
        reason: "cadence_week_not_scheduled",
        message: "Backend support cadence keeps envelope specificity out of this week.",
      });
      continue;
    }

    const allowedSpecificity = resolveSupportedSpecificityIdentityOptions(
      normalized,
      weekNumber,
      weekCadence,
    );
    const replacementIdentity = resolveAllowedEnvelopeReplacementIdentity(
      targetIdentity,
      allowedSpecificity,
    );

    if (!replacementIdentity) {
      trace.safetyDowngrades.push({
        weekNumber,
        reason: "specificity_identity_not_allowed",
        message:
          "Envelope specificity intent did not match a backend-allowed workout identity for this week.",
      });
      continue;
    }

    if (isCutbackWeek(weekNumber, normalized)) {
      trace.safetyDowngrades.push({
        weekNumber,
        reason: "cutback_week",
        message:
          "Cutback week keeps reduced aerobic support instead of adding envelope specificity.",
      });
      continue;
    }

    const phase = phaseForWeek(weekNumber, normalized.schedule.horizonWeeks);

    if (phase === "Taper") {
      trace.safetyDowngrades.push({
        weekNumber,
        reason: "taper_week",
        message: "Taper week keeps freshness-preserving work instead of added specificity.",
      });
      continue;
    }

    const index = findSafeReplacementIndex(
      nextWorkouts,
      weekNumber,
      normalized.availability.qualityDay,
    );

    if (index === null) {
      trace.safetyDowngrades.push({
        weekNumber,
        reason: "no_safe_quality_slot",
        message: "No safe non-long-run quality slot was available for envelope specificity.",
      });
      continue;
    }

    const current = nextWorkouts[index]!;

    if (current.workout_identity === replacementIdentity) {
      trace.fulfilledIdentities.push({
        weekNumber,
        date: current.date,
        phase,
        fromIdentity: replacementIdentity,
        toIdentity: replacementIdentity,
        declaredEmphasis: trace.primaryEmphasis,
        source: "already_fulfilled",
      });
      continue;
    }

    const replacement = buildSpecificityWorkout({
      targetIdentity: replacementIdentity,
      current,
      phase,
      normalized,
    });

    nextWorkouts[index] = replacement;
    trace.fulfilledIdentities.push({
      weekNumber,
      date: replacement.date,
      phase,
      fromIdentity: current.workout_identity ?? current.source_workout_type ?? "unknown",
      toIdentity: replacement.workout_identity ?? targetIdentity,
      declaredEmphasis: trace.primaryEmphasis,
      source: "backend_refinement",
    });
  }

  trace.genericSupportCollapse = summarizeGenericSupportCollapse({
    workouts: nextWorkouts,
    candidateWeeks,
    targetIdentity,
    fulfilledWeeks: new Set(trace.fulfilledIdentities.map((identity) => identity.weekNumber)),
  });

  return {
    workouts: nextWorkouts,
    trace,
  };
}

function resolveAllowedEnvelopeReplacementIdentity(
  targetIdentity: RoadEnvelopeIdentity,
  allowedSpecificity: readonly SupportedSpecificityIdentity[],
): SupportedSpecificityIdentity | null {
  if (allowedSpecificity.includes(targetIdentity)) {
    return targetIdentity;
  }

  return (
    allowedSpecificity.find(
      (identity) =>
        identity === "controlled_tempo_session" ||
        identity === "progression_run" ||
        identity === "easy_run_with_strides",
    ) ?? null
  );
}

export function isEnvelopeGoalSpecificCadenceIdentity(
  identity: string | null | undefined,
  authoringInput: StructuredAuthoringInput,
) {
  if (!identity) return false;

  const normalized = normalizeStructuredPlanAuthoringInput(authoringInput);
  const targetIdentity = resolveRoadGoalPolicyIdentity(normalized.goal.goalType);
  const cadence = resolveSupportedIntensityCadence(normalized);

  return Boolean(
    targetIdentity &&
    identity === targetIdentity &&
    cadence.applies &&
    cadence.frequency !== "none" &&
    !shouldAvoidQuality(normalized) &&
    (identity !== "5k_sharpening_repeats" || !isLimitedSharpeningSupport(normalized)) &&
    (identity !== "10k_rhythm_intervals" || !isLimitedSharpeningSupport(normalized)),
  );
}

function resolveRoadEnvelopeTargetIdentity(
  envelope: AiFirstPlanEnvelope,
  goalType: StructuredAuthoringInput["goal"]["goalType"],
): RoadEnvelopeIdentity | null {
  const emphasis = new Set([
    envelope.qualityEmphasis.primary,
    ...envelope.qualityEmphasis.secondary,
    ...envelope.phases.flatMap((phase) => phase.emphasis),
  ]);

  if (goalType === "5k" && (emphasis.has("int") || emphasis.has("race"))) {
    return "5k_sharpening_repeats";
  }

  if (
    goalType === "10k" &&
    (emphasis.has("tempo") || emphasis.has("int") || emphasis.has("race"))
  ) {
    return "10k_rhythm_intervals";
  }

  if (goalType === "half_marathon" && (emphasis.has("thr") || emphasis.has("tempo"))) {
    return "half_marathon_threshold_durability";
  }

  return null;
}

function resolveRoadGoalPolicyIdentity(
  goalType: StructuredAuthoringInput["goal"]["goalType"],
): RoadEnvelopeIdentity | null {
  switch (goalType) {
    case "5k":
      return "5k_sharpening_repeats";
    case "10k":
      return "10k_rhythm_intervals";
    case "half_marathon":
      return "half_marathon_threshold_durability";
    default:
      return null;
  }
}

function buildInitialTrace(envelope: AiFirstPlanEnvelope): AiFirstPlanEnvelopeSpecificityTrace {
  return {
    goalFamily: envelope.goal.family,
    primaryEmphasis: envelope.qualityEmphasis.primary,
    secondaryEmphasis: envelope.qualityEmphasis.secondary,
    phaseEmphasis: envelope.phases.map((phase) => ({
      phaseCode: phase.pc,
      weeks: `${phase.startWeek}-${phase.endWeek}`,
      emphasis: phase.emphasis,
    })),
    declaredCandidateWeekCount: 0,
    fulfilledIdentities: [],
    safetyDowngrades: [],
    genericSupportCollapse: {
      collapsedWeekCount: 0,
      sampleWeeks: [],
    },
  };
}

function selectCandidateWeeks({
  envelope,
  workouts,
  targetIdentity,
  halfMarathonLimit,
}: {
  envelope: AiFirstPlanEnvelope;
  workouts: CanonicalWorkout[];
  targetIdentity: RoadEnvelopeIdentity;
  halfMarathonLimit: boolean;
}) {
  const phaseWeeks = new Set(
    envelope.phases
      .filter((phase) => phase.pc === "bu" || phase.pc === "sp")
      .flatMap((phase) =>
        Array.from(
          { length: phase.endWeek - phase.startWeek + 1 },
          (_value, index) => phase.startWeek + index,
        ),
      ),
  );
  const weeksWithCurrentTarget = new Set(
    workouts
      .filter((workout) => workout.workout_identity === targetIdentity)
      .map((workout) => workout.week_number),
  );
  const weeks = [...new Set(workouts.map((workout) => workout.week_number))]
    .filter((weekNumber) => phaseWeeks.has(weekNumber))
    .filter((weekNumber) => !weeksWithCurrentTarget.has(weekNumber))
    .sort((left, right) => left - right);

  if (!halfMarathonLimit) {
    return weeks;
  }

  return selectHalfMarathonCandidateWeeks(envelope, weeks);
}

function selectHalfMarathonCandidateWeeks(envelope: AiFirstPlanEnvelope, weeks: number[]) {
  const buildWeeks = weeks.filter((weekNumber) => isEnvelopePhaseWeek(envelope, weekNumber, "bu"));
  const specificWeeks = weeks.filter((weekNumber) =>
    isEnvelopePhaseWeek(envelope, weekNumber, "sp"),
  );
  const selected = [buildWeeks[0], specificWeeks[0]].filter((weekNumber) => weekNumber != null);

  if (selected.length >= 2) {
    return [...new Set(selected)].sort((left, right) => left - right);
  }

  return weeks.slice(0, 2);
}

function isEnvelopePhaseWeek(
  envelope: AiFirstPlanEnvelope,
  weekNumber: number,
  phaseCode: AiFirstPlanEnvelope["phases"][number]["pc"],
) {
  return envelope.phases.some(
    (phase) =>
      phase.pc === phaseCode && weekNumber >= phase.startWeek && weekNumber <= phase.endWeek,
  );
}

function findSafeReplacementIndex(
  workouts: CanonicalWorkout[],
  weekNumber: number,
  qualityDay: StructuredWeekday | null,
) {
  const weekly = workouts
    .map((workout, index) => ({ workout, index }))
    .filter(({ workout }) => workout.week_number === weekNumber);
  const qualityDayCandidate =
    qualityDay &&
    weekly.find(
      ({ workout }) => workout.weekday === qualityDay && isSpecificityReplacementCandidate(workout),
    );

  if (qualityDayCandidate) {
    return qualityDayCandidate.index;
  }

  return weekly.find(({ workout }) => isSpecificityReplacementCandidate(workout))?.index ?? null;
}

function isSpecificityReplacementCandidate(workout: CanonicalWorkout) {
  if (workout.workout_type === "rest" || workout.workout_family === "rest") return false;
  if (workout.workout_family === "long") return false;
  if (longRunIdentities.has(workout.workout_identity ?? "")) return false;
  if (workout.workout_family === "recovery" || workout.workout_identity === "recovery_jog") {
    return false;
  }

  return true;
}

function buildSpecificityWorkout({
  targetIdentity,
  current,
  phase,
  normalized,
}: {
  targetIdentity: SupportedSpecificityIdentity;
  current: CanonicalWorkout;
  phase: TrainingPhase;
  normalized: ReturnType<typeof normalizeStructuredPlanAuthoringInput>;
}) {
  const context: BuildWorkoutContext = {
    workoutId: current.workout_id,
    date: current.date,
    weekday: current.weekday as StructuredWeekday,
    weekNumber: current.week_number,
    phase,
    normalized,
  };
  const draft = buildSpecificityDraft(targetIdentity, context);

  return finalizeGeneratedWorkoutRows([draft], normalized)[0]! as CanonicalWorkout;
}

function buildSpecificityDraft(
  targetIdentity: SupportedSpecificityIdentity,
  context: BuildWorkoutContext,
) {
  switch (targetIdentity) {
    case "5k_sharpening_repeats":
      return buildFiveKSharpeningWorkout(context);
    case "10k_rhythm_intervals":
      return buildTenKRhythmWorkout(context);
    case "half_marathon_threshold_durability":
      return buildHalfMarathonThresholdWorkout(context);
    case "controlled_tempo_session":
      return buildTempoWorkout(context);
    case "progression_run":
      return buildProgressionWorkout(context);
    case "easy_run_with_strides":
      return buildAerobicStridesWorkout(context);
    default:
      return buildProgressionWorkout(context);
  }
}

function summarizeGenericSupportCollapse({
  workouts,
  candidateWeeks,
  targetIdentity,
  fulfilledWeeks,
}: {
  workouts: CanonicalWorkout[];
  candidateWeeks: number[];
  targetIdentity: AuthoredWorkoutIdentity;
  fulfilledWeeks: ReadonlySet<number>;
}) {
  const collapsedWeeks = candidateWeeks.filter(
    (weekNumber) =>
      !fulfilledWeeks.has(weekNumber) &&
      !workouts.some(
        (workout) =>
          workout.week_number === weekNumber && workout.workout_identity === targetIdentity,
      ),
  );

  return {
    collapsedWeekCount: collapsedWeeks.length,
    sampleWeeks: collapsedWeeks.slice(0, 8),
  };
}
