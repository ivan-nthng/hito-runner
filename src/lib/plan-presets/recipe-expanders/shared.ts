import type { TrainingPlanV2 } from "@/lib/imported-plan";
import {
  canonicalFamilyToLegacyWorkoutType,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import { buildSteadyFinishTarget } from "@/lib/structured-plan-authoring-metrics";
import type {
  NormalizedStructuredInput,
  StructuredWeekday,
  TrainingPhase,
} from "@/lib/structured-plan-authoring-schema";
import type { BuildWorkoutContext } from "@/lib/structured-plan-authoring-workouts";
import type { StructuredFirstPlanAuthoringInput } from "@/lib/structured-first-plan-onboarding";
import type { WeekdayName } from "@/lib/weekday-rest-invariants";

export type PlanPresetWorkout = TrainingPlanV2["planned_workouts"][number];

export function buildPresetNotes(presetName: string, existingNotes: string | null | undefined) {
  return [`Plan Preset: ${presetName}.`, existingNotes].filter(Boolean).join(" ");
}

export function replaceSpecificWorkoutInWeek(
  workouts: TrainingPlanV2["planned_workouts"],
  normalized: NormalizedStructuredInput,
  weekNumber: number,
  buildWorkout: (context: BuildWorkoutContext) => unknown,
  label: string,
) {
  const candidateIndex = chooseSafeSpecificCandidateIndex(workouts, weekNumber);

  if (candidateIndex === -1) {
    throw new Error(`Plan preset could not place ${label} safely.`);
  }

  const workout = workouts[candidateIndex]!;
  const replacement = buildWorkout(buildWorkoutContext(workout, normalized)) as PlanPresetWorkout;

  return workouts.map((candidate, index) => (index === candidateIndex ? replacement : candidate));
}

export function replaceLongRunWithSteadyFinish(
  workouts: TrainingPlanV2["planned_workouts"],
  normalized: NormalizedStructuredInput,
  weekNumber: number,
  recipeLabel = "Plan preset",
) {
  const longRunIndex = workouts.findIndex(
    (workout) => workout.week_number === weekNumber && workout.workout_type === "long_run",
  );

  if (longRunIndex === -1) {
    throw new Error(`${recipeLabel} could not place long-run variation safely.`);
  }

  const longRun = workouts[longRunIndex]!;
  const segments = longRun.segments.map((segment, index, sourceSegments) => {
    if (index !== sourceSegments.length - 1 || segment.segment_type === "warmup") {
      return segment;
    }

    return {
      ...segment,
      label: "Controlled steady finish",
      guidance:
        "Finish a little stronger than easy while staying smooth, controlled, and never race-like.",
      target: buildSteadyFinishTarget(normalized),
    };
  });
  const replacement = retagWorkout(
    {
      ...longRun,
      segments,
    },
    "long_run_with_steady_finish",
    "Long run with steady finish",
    "Long aerobic run with a controlled steady finish.",
  );

  return workouts.map((candidate, index) => (index === longRunIndex ? replacement : candidate));
}

export function expandSingleSegmentSupportRows(workouts: TrainingPlanV2["planned_workouts"]) {
  return workouts.map((workout) => {
    if (workout.workout_type === "rest" || workout.segments.length !== 1) {
      return workout;
    }

    const segment = workout.segments[0]!;
    const prescription = segment.prescription;

    if (!prescription || (prescription.mode !== "time" && prescription.mode !== "distance")) {
      return workout;
    }

    if (prescription.mode === "time" && typeof prescription.duration_min === "number") {
      const totalDurationMin = prescription.duration_min;

      if (totalDurationMin < 20) {
        return workout;
      }

      const warmupMin = Math.min(8, Math.max(5, Math.round(totalDurationMin * 0.2)));
      const cooldownMin = warmupMin;
      const mainMin = Math.max(10, totalDurationMin - warmupMin - cooldownMin);

      return {
        ...workout,
        segments: [
          buildSplitSupportSegment(workout.workout_id, segment, 1, "warmup", warmupMin),
          buildSplitSupportSegment(workout.workout_id, segment, 2, "main", mainMin),
          buildSplitSupportSegment(workout.workout_id, segment, 3, "cooldown", cooldownMin),
        ],
      };
    }

    if (prescription.mode === "distance" && typeof prescription.distance_km === "number") {
      const totalDistanceKm = prescription.distance_km;

      if (totalDistanceKm < 3) {
        return workout;
      }

      const warmupKm = Number(Math.max(0.5, totalDistanceKm * 0.2).toFixed(1));
      const cooldownKm = warmupKm;
      const mainKm = Number(Math.max(1, totalDistanceKm - warmupKm - cooldownKm).toFixed(1));

      return {
        ...workout,
        segments: [
          buildSplitSupportSegment(workout.workout_id, segment, 1, "warmup", warmupKm),
          buildSplitSupportSegment(workout.workout_id, segment, 2, "main", mainKm),
          buildSplitSupportSegment(workout.workout_id, segment, 3, "cooldown", cooldownKm),
        ],
      };
    }

    return workout;
  }) as TrainingPlanV2["planned_workouts"];
}

export function buildWorkoutContext(
  workout: TrainingPlanV2["planned_workouts"][number],
  normalized: NormalizedStructuredInput,
): BuildWorkoutContext {
  return {
    workoutId: workout.workout_id,
    date: workout.date,
    weekday: workout.weekday as StructuredWeekday,
    weekNumber: workout.week_number,
    phase: workout.phase as TrainingPhase,
    normalized,
  };
}

export function enforcePostLongRunRecovery(
  workouts: TrainingPlanV2["planned_workouts"],
): TrainingPlanV2["planned_workouts"] {
  const nextWorkouts = [...workouts];

  for (const [index, workout] of nextWorkouts.entries()) {
    if (workout.workout_type !== "long_run") continue;

    const nextRunningIndex = nextWorkouts.findIndex(
      (candidate, candidateIndex) => candidateIndex > index && candidate.workout_type !== "rest",
    );

    if (nextRunningIndex === -1) continue;

    const nextRunningWorkout = nextWorkouts[nextRunningIndex]!;

    if (
      nextRunningWorkout.workout_identity === "recovery_jog" ||
      nextRunningWorkout.workout_identity === "easy_aerobic_run"
    ) {
      continue;
    }

    nextWorkouts[nextRunningIndex] = retagWorkout(
      nextRunningWorkout,
      "recovery_jog",
      "Recovery jog",
      "Very easy recovery running after the long run.",
    );
  }

  return nextWorkouts;
}

export function retagWorkout(
  workout: TrainingPlanV2["planned_workouts"][number],
  identity: CanonicalWorkoutIdentity,
  title: string,
  summary: string,
): TrainingPlanV2["planned_workouts"][number] {
  const richWorkout = resolveCanonicalWorkoutModel({
    workoutType: workout.workout_type,
    sourceWorkoutType: identity,
    title,
    steps: workout.segments,
    metricMode: workout.metric_mode ?? null,
  });

  return {
    ...workout,
    workout_type: canonicalFamilyToLegacyWorkoutType(
      richWorkout.workoutFamily,
      richWorkout.workoutIdentity,
    ),
    source_workout_type: identity,
    title,
    summary,
    workout_family: richWorkout.workoutFamily,
    workout_identity: richWorkout.workoutIdentity,
    calendar_icon_key: richWorkout.calendarIconKey,
    metric_mode: toCanonicalMetricModeJson(richWorkout.metricMode),
  };
}

export function assertFixedRestAndLongRunDay({
  canonicalPlan,
  authoringInput,
  recipeLabel,
}: {
  canonicalPlan: TrainingPlanV2;
  authoringInput: StructuredFirstPlanAuthoringInput;
  recipeLabel: string;
}) {
  const fixedRestDays = new Set<WeekdayName>(authoringInput.availability.unavailableDays);
  const longRunDay = authoringInput.availability.preferredLongRunDay;

  for (const workout of canonicalPlan.planned_workouts) {
    if (workout.workout_type !== "rest" && fixedRestDays.has(workout.weekday as WeekdayName)) {
      throw new Error(`${recipeLabel} generated a workout on fixed rest day ${workout.weekday}.`);
    }

    if (workout.workout_type === "long_run" && longRunDay && workout.weekday !== longRunDay) {
      throw new Error(`${recipeLabel} did not preserve preferred long-run day.`);
    }
  }
}

export function countRows(canonicalPlan: TrainingPlanV2) {
  const calendarRows = canonicalPlan.planned_workouts.length;
  const nonRestRows = canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_type !== "rest",
  ).length;
  const weekCount = new Set(canonicalPlan.planned_workouts.map((workout) => workout.week_number))
    .size;

  return {
    calendarRows,
    nonRestRows,
    restRows: calendarRows - nonRestRows,
    weekCount,
  };
}

export function summarizeIdentities(canonicalPlan: TrainingPlanV2) {
  return Array.from(
    new Set(
      canonicalPlan.planned_workouts
        .filter((workout) => workout.workout_type !== "rest")
        .map(
          (workout) =>
            workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type,
        ),
    ),
  );
}

export function hasLongRunInWeek(workouts: TrainingPlanV2["planned_workouts"], weekNumber: number) {
  return workouts.some(
    (workout) => workout.week_number === weekNumber && workout.workout_type === "long_run",
  );
}

export function hasSafeSpecificCandidateInWeek(
  workouts: TrainingPlanV2["planned_workouts"],
  weekNumber: number,
) {
  return chooseSafeSpecificCandidateIndex(workouts, weekNumber) !== -1;
}

function chooseSafeSpecificCandidateIndex(
  workouts: TrainingPlanV2["planned_workouts"],
  weekNumber: number,
) {
  const unsafeAfterLongRunDates = findPostLongRunNextWorkoutDates(workouts);
  const weekWorkouts = workouts
    .map((workout, index) => ({ workout, index }))
    .filter(({ workout }) => workout.week_number === weekNumber && workout.workout_type !== "rest")
    .sort((left, right) => left.workout.date.localeCompare(right.workout.date));
  const longRun = weekWorkouts.find(({ workout }) => workout.workout_type === "long_run");
  const previousBeforeLongRunDate = longRun
    ? weekWorkouts.filter(({ workout }) => workout.date < longRun.workout.date).at(-1)?.workout.date
    : null;
  const candidates = weekWorkouts.filter(
    ({ workout }) =>
      workout.workout_type !== "long_run" && !unsafeAfterLongRunDates.has(workout.date),
  );
  const nonAdjacentCandidates = candidates.filter(
    ({ workout }) => workout.date !== previousBeforeLongRunDate,
  );
  const preferredCandidates = nonAdjacentCandidates.length > 0 ? nonAdjacentCandidates : candidates;

  return (
    preferredCandidates.find(
      ({ workout }) =>
        workout.workout_identity === "steady_aerobic_run" ||
        workout.source_workout_type === "steady_aerobic_run",
    )?.index ??
    preferredCandidates.find(
      ({ workout }) =>
        workout.workout_identity === "easy_aerobic_run" ||
        workout.source_workout_type === "easy_aerobic_run",
    )?.index ??
    preferredCandidates[0]?.index ??
    -1
  );
}

function findPostLongRunNextWorkoutDates(workouts: TrainingPlanV2["planned_workouts"]) {
  const dates = new Set<string>();
  const sortedWorkouts = [...workouts].sort((left, right) => left.date.localeCompare(right.date));

  for (const [index, workout] of sortedWorkouts.entries()) {
    if (workout.workout_type !== "long_run") continue;

    const nextWorkout = sortedWorkouts.find(
      (candidate, candidateIndex) => candidateIndex > index && candidate.workout_type !== "rest",
    );

    if (nextWorkout) {
      dates.add(nextWorkout.date);
    }
  }

  return dates;
}

function buildSplitSupportSegment(
  workoutId: string,
  sourceSegment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
  sequence: number,
  segmentType: "warmup" | "main" | "cooldown",
  amount: number,
) {
  const mode = sourceSegment.prescription?.mode;

  return {
    ...sourceSegment,
    segment_id: `${workoutId}_seg_${sequence}`,
    sequence,
    segment_type: segmentType,
    label:
      segmentType === "warmup"
        ? "Easy opening"
        : segmentType === "cooldown"
          ? "Relaxed finish"
          : (sourceSegment.label ?? "Aerobic running"),
    guidance:
      segmentType === "warmup"
        ? "Start relaxed and let the body settle into the run."
        : segmentType === "cooldown"
          ? "Ease down and finish with control."
          : sourceSegment.guidance,
    prescription:
      mode === "distance"
        ? {
            mode,
            distance_km: amount,
          }
        : {
            mode: "time" as const,
            duration_min: amount,
          },
    ...(mode === "distance" ? { distance_km: amount } : { duration_min: amount }),
  };
}
