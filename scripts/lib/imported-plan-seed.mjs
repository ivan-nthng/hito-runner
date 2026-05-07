export function buildImportedPlanSeed(plan) {
  const workouts = plan.week_1_preview
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry, index) => {
      const workoutType = inferWorkoutType(entry.workout);
      const title =
        entry.details.toLowerCase() === "recovery"
          ? entry.workout
          : `${entry.workout} · ${entry.details}`;

      return {
        workoutDate: entry.date,
        weekday: entry.weekday,
        weekNumber: 1,
        phase: "Imported week",
        workoutType,
        title,
        notes: buildNotes(entry.details, entry.target),
        steps: buildSteps(workoutType, entry.details, entry.target),
        displayOrder: index,
      };
    });

  const baselineSessionsPerWeek = workouts.filter(
    (workout) => workout.workoutType !== "rest",
  ).length;
  const baselineLongRunKm = workouts
    .filter((workout) => workout.workoutType === "long_run")
    .map((workout) => estimateDistanceKm(workout.steps, workout.workoutType))
    .reduce((max, value) => Math.max(max, value), 0);

  return {
    profile: {
      goalType: /marathon|race/i.test(plan.plan_name)
        ? "first_race"
        : /distance|build/i.test(plan.plan_name)
          ? "distance_build"
          : "build_consistency",
      goalLabel: plan.plan_name,
      baselineSessionsPerWeek,
      baselineLongRunKm,
      baselineNotes: `Imported from JSON for ${plan.generated_for}.`,
    },
    title: plan.plan_name,
    goalSummary: `Imported JSON week for ${plan.generated_for}.`,
    sourceTemplate: "json-import-v1",
    startDate: plan.start_date,
    endDate: workouts.at(-1)?.workoutDate ?? plan.start_date,
    workouts,
  };
}

function inferWorkoutType(workout) {
  if (/rest|recovery$/i.test(workout)) return "rest";
  if (/interval|tempo|speed|quality/i.test(workout)) return "quality";
  if (/long/i.test(workout)) return "long_run";
  if (/steady/i.test(workout)) return "steady_or_easy";
  return "easy";
}

function buildNotes(details, target) {
  return target ? `${details} · Target: ${target}` : details;
}

function buildSteps(workoutType, details, target) {
  if (workoutType === "rest") {
    return [];
  }

  const targetPayload = parseTarget(target);
  const intervalMatch = details.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(m|km)/i);

  if (intervalMatch) {
    const repeats = Number(intervalMatch[1]);
    const workDistanceKm = normalizeDistance(Number(intervalMatch[2]), intervalMatch[3]);

    return [
      {
        type: "intervals",
        repeats,
        work: {
          type: "work",
          distance_km: workDistanceKm,
          ...(targetPayload ? { target: targetPayload } : {}),
        },
        recovery: {
          type: "recovery",
        },
      },
    ];
  }

  const distanceMatch = details.match(/(\d+(?:\.\d+)?)\s*km/i);
  const durationMatch = details.match(/(\d+(?:\.\d+)?)\s*min/i);

  return [
    {
      type: "run",
      ...(distanceMatch ? { distance_km: Number(distanceMatch[1]) } : {}),
      ...(durationMatch ? { duration_min: Number(durationMatch[1]) } : {}),
      ...(targetPayload ? { target: targetPayload } : {}),
    },
  ];
}

function parseTarget(target) {
  if (!target) {
    return undefined;
  }

  const hrMatch = target.match(/HR\s*(\d{2,3})\s*-\s*(\d{2,3})/i);

  if (hrMatch) {
    return {
      hr_bpm: `${hrMatch[1]}-${hrMatch[2]}`,
    };
  }

  return {
    cue: target,
  };
}

function estimateDistanceKm(steps, workoutType) {
  let totalDistanceKm = 0;

  for (const step of steps) {
    if (step.distance_km) {
      totalDistanceKm += step.distance_km;
    }
  }

  if (totalDistanceKm > 0) {
    return Number(totalDistanceKm.toFixed(1));
  }

  let totalDurationMin = 0;

  for (const step of steps) {
    if (step.duration_min) {
      totalDurationMin += step.duration_min;
    }
  }

  if (!totalDurationMin) {
    return 0;
  }

  const paceMap = {
    easy: 7.0,
    steady_or_easy: 6.6,
    long_run: 6.8,
    quality: 5.8,
    rest: 0,
  };
  const pace = paceMap[workoutType];

  if (!pace) {
    return 0;
  }

  return Number((totalDurationMin / pace).toFixed(1));
}

function normalizeDistance(distance, unit) {
  return unit.toLowerCase() === "km" ? distance : Number((distance / 1000).toFixed(3));
}
