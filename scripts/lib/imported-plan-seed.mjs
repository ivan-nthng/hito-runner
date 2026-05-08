const FUTURE_TEMPLATE_VERSION = "training-plan-v2";

export function buildImportedPlanSeed(plan) {
  if (isTrainingPlanV2(plan)) {
    return buildTrainingPlanV2Seed(plan);
  }

  return buildLegacyImportedPlanSeed(plan);
}

function buildLegacyImportedPlanSeed(plan) {
  const workouts = plan.week_1_preview
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry, index) => {
      const workoutType = inferLegacyWorkoutType(entry.workout);
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
        notes: buildLegacyNotes(entry.details, entry.target),
        steps: buildLegacySteps(workoutType, entry.details, entry.target),
        displayOrder: index,
      };
    });

  return {
    profile: buildImportedProfile(plan.plan_name, plan.generated_for, workouts),
    title: plan.plan_name,
    goalSummary: `Imported JSON week for ${plan.generated_for}.`,
    sourceTemplate: "json-import-v1",
    startDate: plan.start_date,
    endDate: workouts.at(-1)?.workoutDate ?? plan.start_date,
    workouts,
  };
}

function buildTrainingPlanV2Seed(plan) {
  const workouts = plan.planned_workouts
    .slice()
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.week_number - right.week_number ||
        left.title.localeCompare(right.title),
    )
    .map((entry, index) => ({
      workoutDate: entry.date,
      weekday: entry.weekday,
      weekNumber: entry.week_number,
      phase: entry.phase,
      workoutType: normalizeV2WorkoutType(entry.workout_type),
      title: entry.title,
      notes: buildV2Notes(entry),
      steps: normalizeV2Segments(entry.segments, normalizeV2WorkoutType(entry.workout_type)),
      displayOrder: index,
    }));

  return {
    profile: buildImportedProfile(plan.plan_name, plan.generated_for, workouts, plan),
    title: plan.plan_name,
    goalSummary: buildV2GoalSummary(plan),
    sourceTemplate: FUTURE_TEMPLATE_VERSION,
    startDate: plan.start_date,
    endDate: workouts.at(-1)?.workoutDate ?? plan.start_date,
    workouts,
  };
}

function buildImportedProfile(planName, generatedFor, workouts, trainingPlan = null) {
  const baselineSessionsPerWeek =
    trainingPlan?.runner_profile?.baseline_sessions_per_week ??
    deriveBaselineSessionsPerWeek(workouts);
  const baselineLongRunKm = deriveBaselineLongRunKm(workouts, trainingPlan);

  return {
    goalType: deriveRunnerGoalType(planName, trainingPlan),
    goalLabel: trainingPlan?.goal?.goal_label?.trim() || planName,
    baselineSessionsPerWeek,
    baselineLongRunKm,
    baselineNotes: buildImportedProfileNotes(generatedFor, trainingPlan),
  };
}

function buildV2GoalSummary(plan) {
  const goalLabel = plan.goal?.goal_label?.trim();
  return goalLabel || `Imported ${FUTURE_TEMPLATE_VERSION} plan for ${plan.generated_for}.`;
}

function deriveBaselineSessionsPerWeek(workouts) {
  const countsByWeek = new Map();

  for (const workout of workouts) {
    if (workout.workoutType === "rest") {
      continue;
    }

    countsByWeek.set(workout.weekNumber, (countsByWeek.get(workout.weekNumber) ?? 0) + 1);
  }

  return Math.min(7, Math.max(0, ...Array.from(countsByWeek.values())));
}

function deriveRunnerGoalType(planName, trainingPlan = null) {
  const goalType = trainingPlan?.goal?.goal_type?.trim().toLowerCase();

  if (
    goalType &&
    ["5k", "10k", "half_marathon", "marathon", "first_race", "race_ready"].includes(goalType)
  ) {
    return "first_race";
  }

  if (goalType === "distance_build") {
    return "distance_build";
  }

  if (goalType === "build_consistency") {
    return "build_consistency";
  }

  return /marathon|race/i.test(planName)
    ? "first_race"
    : /distance|build/i.test(planName)
      ? "distance_build"
      : "build_consistency";
}

function deriveBaselineLongRunKm(workouts, trainingPlan = null) {
  const explicitKm = trainingPlan?.runner_profile?.baseline_long_run_km;

  if (explicitKm) {
    return explicitKm;
  }

  const explicitDuration = trainingPlan?.runner_profile?.baseline_long_run_duration_min;

  if (explicitDuration) {
    return Number((explicitDuration / 7).toFixed(1));
  }

  return workouts
    .filter((workout) => workout.workoutType === "long_run")
    .map((workout) => estimateDistanceKm(workout.steps, workout.workoutType))
    .reduce((max, value) => Math.max(max, value), 0);
}

function buildImportedProfileNotes(generatedFor, trainingPlan = null) {
  const notes = [
    trainingPlan?.runner_profile?.recent_result_summary,
    trainingPlan?.runner_profile?.current_training_load_summary,
    trainingPlan?.runner_profile?.recent_injury_recovery_context,
  ]
    .filter((value) => Boolean(value?.trim()))
    .join(" · ");

  return notes || `Imported from JSON for ${generatedFor}.`;
}

function inferLegacyWorkoutType(workout) {
  if (/rest|recovery$/i.test(workout)) return "rest";
  if (/interval|tempo|speed|quality/i.test(workout)) return "quality";
  if (/long/i.test(workout)) return "long_run";
  if (/steady/i.test(workout)) return "steady_or_easy";
  return "easy";
}

function normalizeV2WorkoutType(workoutType) {
  switch (workoutType) {
    case "rest":
      return "rest";
    case "long_run":
      return "long_run";
    case "quality":
    case "tempo":
      return "quality";
    case "steady_or_easy":
      return "steady_or_easy";
    case "recovery":
    case "easy":
    default:
      return "easy";
  }
}

function buildLegacyNotes(details, target) {
  return target ? `${details} · Target: ${target}` : details;
}

function buildV2Notes(workout) {
  if (normalizeV2WorkoutType(workout.workout_type) === "rest") {
    const restHint = workout.segments.find((segment) => extractSegmentGuidance(segment))?.guidance;
    return restHint ?? workout.summary;
  }

  return workout.summary;
}

function buildLegacySteps(workoutType, details, target) {
  if (workoutType === "rest") {
    return [];
  }

  const targetPayload = parseLegacyTarget(target);
  const intervalMatch = details.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(m|km)/i);

  if (intervalMatch) {
    const repeats = Number(intervalMatch[1]);
    const workDistanceKm = normalizeDistance(Number(intervalMatch[2]), intervalMatch[3]);
    const prescription = {
      mode: "repeats",
      repeat_count: repeats,
      repeat_unit: {
        mode: "distance",
        distance_km: workDistanceKm,
      },
      recovery_unit: {
        mode: "none",
      },
    };

    return [
      {
        segment_id: "legacy-segment-1",
        segment_type: "interval_block",
        sequence: 1,
        label: details,
        prescription,
        type: "intervals",
        repeats,
        work: {
          type: "work",
          distance_km: workDistanceKm,
          prescription: prescription.repeat_unit,
          ...(targetPayload ? { target: targetPayload } : {}),
        },
        recovery: {
          type: "recovery",
          prescription: prescription.recovery_unit,
        },
      },
    ];
  }

  const distanceMatch = details.match(/(\d+(?:\.\d+)?)\s*km/i);
  const durationMatch = details.match(/(\d+(?:\.\d+)?)\s*min/i);
  const prescription = durationMatch
    ? {
        mode: "time",
        duration_min: Number(durationMatch[1]),
      }
    : distanceMatch
      ? {
          mode: "distance",
          distance_km: Number(distanceMatch[1]),
        }
      : undefined;

  return [
    {
      segment_id: "legacy-segment-1",
      segment_type: "main",
      sequence: 1,
      label: details,
      ...(prescription ? { prescription } : {}),
      type: "run",
      ...(distanceMatch ? { distance_km: Number(distanceMatch[1]) } : {}),
      ...(durationMatch ? { duration_min: Number(durationMatch[1]) } : {}),
      ...(targetPayload ? { target: targetPayload } : {}),
    },
  ];
}

function normalizeV2Segments(segments, workoutType) {
  if (workoutType === "rest") {
    return [];
  }

  return segments.flatMap((segment, index) => {
    if (segment.segment_type === "rest") {
      return [];
    }

    return [normalizeV2Segment(segment, index + 1)];
  });
}

function parseLegacyTarget(target) {
  if (!target) {
    return undefined;
  }

  const hrMatch = target.match(/HR\s*(\d{2,3})\s*-\s*(\d{2,3})/i);

  if (hrMatch) {
    return {
      hr_bpm_range: `${hrMatch[1]}-${hrMatch[2]}`,
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
    totalDistanceKm += stepPlannedDistanceKm(step);
  }

  if (totalDistanceKm > 0) {
    return Number(totalDistanceKm.toFixed(1));
  }

  let totalDurationMin = 0;

  for (const step of steps) {
    totalDurationMin += stepPlannedDurationMin(step, workoutType);
  }

  if (!totalDurationMin) {
    return 0;
  }

  const pace = paceMinutesPerKm(workoutType);

  if (!pace) {
    return 0;
  }

  return Number((totalDurationMin / pace).toFixed(1));
}

function normalizeV2Segment(segment, sequence) {
  const target = normalizeSegmentTarget(segment.target);
  const recoveryTarget = normalizeSegmentTarget(segment.recovery_target);
  const guidance = extractSegmentGuidance(segment);
  const segmentId = segment.segment_id ?? `segment-${sequence}`;
  const label = segment.label ?? buildDefaultSegmentLabel(segment.segment_type, sequence);
  const prescription = buildSegmentPrescription(segment);

  if (segment.segment_type === "interval_block") {
    return {
      segment_id: segmentId,
      segment_type: segment.segment_type,
      sequence: segment.sequence ?? sequence,
      label,
      guidance,
      prescription,
      type: "intervals",
      repeats: prescription.repeat_count,
      work: {
        type: "work",
        ...(prescription.repeat_unit?.distance_km
          ? { distance_km: prescription.repeat_unit.distance_km }
          : {}),
        ...(prescription.repeat_unit?.duration_min
          ? { duration_min: prescription.repeat_unit.duration_min }
          : {}),
        ...(target ? { target } : {}),
        ...(prescription.repeat_unit ? { prescription: prescription.repeat_unit } : {}),
      },
      recovery: {
        type: "recovery",
        ...(prescription.recovery_unit?.distance_km
          ? { distance_km: prescription.recovery_unit.distance_km }
          : {}),
        ...(prescription.recovery_unit?.duration_min
          ? { duration_min: prescription.recovery_unit.duration_min }
          : {}),
        ...(recoveryTarget ? { target: recoveryTarget } : {}),
        ...(prescription.recovery_unit ? { prescription: prescription.recovery_unit } : {}),
      },
    };
  }

  return {
    segment_id: segmentId,
    segment_type: segment.segment_type,
    sequence: segment.sequence ?? sequence,
    label,
    guidance,
    prescription,
    type: mapSegmentTypeToStepType(segment.segment_type),
    ...(prescription.duration_min ? { duration_min: prescription.duration_min } : {}),
    ...(prescription.distance_km ? { distance_km: prescription.distance_km } : {}),
    ...(target ? { target } : {}),
  };
}

function buildSegmentPrescription(segment) {
  if (segment.prescription) {
    return {
      mode: segment.prescription.mode,
      ...(segment.prescription.duration_min
        ? { duration_min: segment.prescription.duration_min }
        : {}),
      ...(segment.prescription.distance_km
        ? { distance_km: segment.prescription.distance_km }
        : {}),
      ...(segment.prescription.repeat_count
        ? { repeat_count: segment.prescription.repeat_count }
        : {}),
      ...(segment.prescription.repeat_unit
        ? { repeat_unit: normalizeUnitPrescription(segment.prescription.repeat_unit) }
        : {}),
      ...(segment.prescription.recovery_unit
        ? { recovery_unit: normalizeUnitPrescription(segment.prescription.recovery_unit) }
        : {}),
    };
  }

  if (segment.segment_type === "interval_block") {
    return {
      mode: "repeats",
      repeat_count: segment.repeat_count,
      repeat_unit: segment.work_distance_km
        ? {
            mode: "distance",
            distance_km: segment.work_distance_km,
          }
        : {
            mode: "time",
            duration_min: segment.duration_min,
          },
      recovery_unit:
        segment.recovery_duration_min || segment.recovery_distance_km
          ? segment.recovery_distance_km
            ? {
                mode: "distance",
                distance_km: segment.recovery_distance_km,
              }
            : {
                mode: "time",
                duration_min: segment.recovery_duration_min,
              }
          : {
              mode: "none",
            },
    };
  }

  if (segment.segment_type === "rest") {
    return {
      mode: "none",
    };
  }

  if (segment.distance_km) {
    return {
      mode: "distance",
      distance_km: segment.distance_km,
    };
  }

  return {
    mode: "time",
    duration_min: segment.duration_min,
  };
}

function normalizeUnitPrescription(unit) {
  if (!unit) {
    return { mode: "none" };
  }

  return {
    mode: unit.mode,
    ...(unit.duration_min ? { duration_min: unit.duration_min } : {}),
    ...(unit.distance_km ? { distance_km: unit.distance_km } : {}),
  };
}

function normalizeSegmentTarget(target) {
  if (!target) {
    return undefined;
  }

  const extra = {
    ...(target.extra ?? {}),
  };

  for (const [key, value] of Object.entries(target)) {
    if (
      key === "intensity" ||
      key === "hr_bpm_range" ||
      key === "hr_bpm" ||
      key === "pace_min_per_km_range" ||
      key === "pace_range_min_km" ||
      key === "pace" ||
      key === "rpe" ||
      key === "cadence_spm_range" ||
      key === "cue" ||
      key === "hint" ||
      key === "extra"
    ) {
      continue;
    }

    extra[key] = value;
  }

  const hrRange = typeof target.hr_bpm_range === "string" ? target.hr_bpm_range : target.hr_bpm;
  const paceRange =
    typeof target.pace_min_per_km_range === "string"
      ? target.pace_min_per_km_range
      : target.pace_range_min_km;

  return {
    ...(typeof target.intensity === "string" ? { intensity: target.intensity } : {}),
    ...(hrRange ? { hr_bpm_range: hrRange, hr_bpm: hrRange } : {}),
    ...(paceRange
      ? {
          pace_min_per_km_range: paceRange,
          pace_range_min_km: paceRange,
        }
      : {}),
    ...(typeof target.pace === "string" ? { pace: target.pace } : {}),
    ...(typeof target.rpe === "string" || typeof target.rpe === "number"
      ? { rpe: target.rpe }
      : {}),
    ...(typeof target.cadence_spm_range === "string"
      ? { cadence_spm_range: target.cadence_spm_range }
      : {}),
    ...(typeof target.cue === "string" ? { cue: target.cue } : {}),
    ...(typeof target.hint === "string" ? { hint: target.hint } : {}),
    ...(Object.keys(extra).length > 0 ? { extra } : {}),
  };
}

function extractSegmentGuidance(segment) {
  if (segment.guidance) {
    return { guidance: segment.guidance };
  }

  if (typeof segment.target?.hint === "string") {
    return { guidance: segment.target.hint };
  }

  return { guidance: null };
}

function mapSegmentTypeToStepType(segmentType) {
  switch (segmentType) {
    case "tempo_block":
      return "tempo";
    case "main":
      return "run";
    default:
      return segmentType;
  }
}

function buildDefaultSegmentLabel(segmentType, sequence) {
  switch (segmentType) {
    case "warmup":
      return "Warmup";
    case "main":
      return "Main";
    case "cooldown":
      return "Cooldown";
    case "recovery":
      return "Recovery";
    case "rest":
      return "Rest";
    case "mobility":
      return "Mobility";
    case "strength":
      return "Strength";
    case "tempo_block":
      return "Tempo";
    case "interval_block":
      return "Intervals";
    default:
      return `Segment ${sequence}`;
  }
}

function stepPlannedDistanceKm(step) {
  let total = step.distance_km ?? 0;

  if (step.repeats && step.work?.distance_km) {
    total += step.repeats * step.work.distance_km;
  }

  if (step.repeats && step.recovery?.distance_km) {
    total += step.repeats * step.recovery.distance_km;
  }

  return total;
}

function stepPlannedDurationMin(step, workoutType) {
  let total = step.duration_min ?? 0;

  if (step.repeats && step.work) {
    const workDuration =
      step.work.duration_min ??
      estimateDurationFromDistanceKm(step.work.distance_km ?? 0, workoutType);
    const recoveryDuration =
      step.recovery?.duration_min ??
      estimateDurationFromDistanceKm(step.recovery?.distance_km ?? 0, "easy");
    total += step.repeats * (workDuration + recoveryDuration);
  }

  return total;
}

function estimateDurationFromDistanceKm(distanceKm, workoutType) {
  if (!distanceKm) {
    return 0;
  }

  const pace = paceMinutesPerKm(workoutType);
  return pace ? Math.round(distanceKm * pace) : 0;
}

function paceMinutesPerKm(workoutType) {
  const paceMap = {
    easy: 7.0,
    steady_or_easy: 6.6,
    long_run: 6.8,
    quality: 5.8,
    rest: 0,
  };

  return paceMap[workoutType];
}

function normalizeDistance(distance, unit) {
  return unit.toLowerCase() === "km" ? distance : Number((distance / 1000).toFixed(3));
}

function isTrainingPlanV2(plan) {
  return plan && typeof plan === "object" && plan.schema_version === FUTURE_TEMPLATE_VERSION;
}
