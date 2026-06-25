const FUTURE_TEMPLATE_VERSION = "training-plan-v2";
const REMOVED_LEGACY_IMPORT_NOTICE =
  "Legacy week_1_preview[] JSON is no longer supported. Convert this file to training-plan-v2 before importing.";

export function buildImportedPlanSeed(plan) {
  if (!isTrainingPlanV2(plan)) {
    throw new Error(REMOVED_LEGACY_IMPORT_NOTICE);
  }

  return buildTrainingPlanV2Seed(plan);
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
      sourceWorkoutId: entry.workout_id,
      sourceWorkoutType: entry.source_workout_type ?? entry.workout_identity ?? null,
      workoutFamily: entry.workout_family ?? null,
      workoutIdentity: entry.workout_identity ?? null,
      calendarIconKey: entry.calendar_icon_key ?? entry.workout_family ?? null,
      goalContext: entry.goal_context ?? null,
      metricMode: entry.metric_mode ?? null,
      title: entry.title,
      notes: buildV2Notes(entry),
      plannedRpe: entry.planned_rpe ?? null,
      estimatedFatigue: entry.estimated_fatigue ?? null,
      recoveryPriority: entry.recovery_priority ?? null,
      steps: normalizeV2Segments(entry.segments),
      displayOrder: index,
    }));

  return {
    profile: buildImportedProfile(plan.plan_name, plan.generated_for, workouts, plan),
    title: plan.plan_name,
    goalSummary: buildV2GoalSummary(plan),
    sourceTemplate: FUTURE_TEMPLATE_VERSION,
    schemaVersion: plan.schema_version,
    sourceKind: plan.source_kind?.trim() || "training_plan_v2_import",
    startDate: plan.start_date,
    endDate: workouts.at(-1)?.workoutDate ?? plan.start_date,
    targetDate: deriveTargetDate(plan),
    goalMetadata: buildGoalMetadata(plan),
    planPreferences: buildPersistedPlanPreferences(plan),
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
    goalLabel:
      trainingPlan?.goal?.goal_label?.trim() ||
      trainingPlan?.runner_profile?.primary_goal?.trim() ||
      planName,
    baselineSessionsPerWeek,
    baselineLongRunKm,
    baselineNotes: buildImportedProfileNotes(generatedFor, trainingPlan),
  };
}

function buildV2GoalSummary(plan) {
  const goalLabel = plan.goal?.goal_label?.trim();

  if (goalLabel) {
    return goalLabel;
  }

  const primaryGoal = plan.runner_profile?.primary_goal?.trim();

  return primaryGoal || `Imported ${FUTURE_TEMPLATE_VERSION} plan for ${plan.generated_for}.`;
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
    trainingPlan?.runner_profile?.current_easy_aerobic_hr_bpm
      ? `Current easy aerobic HR ${trainingPlan.runner_profile.current_easy_aerobic_hr_bpm}`
      : null,
    trainingPlan?.runner_profile?.risk_policy,
    trainingPlan?.runner_profile?.secondary_goal,
  ]
    .filter((value) => Boolean(value?.trim()))
    .join(" · ");

  return notes || `Imported from JSON for ${generatedFor}.`;
}

function deriveTargetDate(plan) {
  return (
    plan.target_date ?? plan.goal?.target_event?.event_date ?? plan.goal?.target_event?.date ?? null
  );
}

function buildGoalMetadata(plan) {
  const targetDate = deriveTargetDate(plan);
  const goalType = plan.goal?.goal_type?.trim() || null;
  const goalLabel =
    plan.goal?.goal_label?.trim() || plan.runner_profile?.primary_goal?.trim() || null;
  const targetEvent = plan.goal?.target_event;
  const primaryGoal = plan.runner_profile?.primary_goal?.trim() || null;
  const secondaryGoal = plan.runner_profile?.secondary_goal?.trim() || null;

  const metadata = {
    ...(goalType ? { goal_type: goalType } : {}),
    ...(goalLabel ? { goal_label: goalLabel } : {}),
    ...(targetDate ? { target_date: targetDate } : {}),
    ...(targetEvent
      ? {
          target_event: {
            ...(targetEvent.label ? { label: targetEvent.label } : {}),
            ...(targetEvent.event_name ? { event_name: targetEvent.event_name } : {}),
            ...(targetDate ? { date: targetDate } : {}),
          },
        }
      : {}),
    ...(primaryGoal ? { primary_goal: primaryGoal } : {}),
    ...(secondaryGoal ? { secondary_goal: secondaryGoal } : {}),
  };

  return Object.keys(metadata).length > 0 ? metadata : null;
}

function buildPersistedPlanPreferences(plan) {
  const notes = [
    plan.plan_preferences?.notes?.trim() || null,
    plan.training_constraints?.intensity_distribution?.trim() || null,
    plan.training_constraints?.progression_policy?.trim() || null,
  ]
    .filter((value) => Boolean(value))
    .join(" · ");

  const preferences = {
    ...(plan.plan_preferences?.preferred_run_days
      ? { preferred_run_days: plan.plan_preferences.preferred_run_days }
      : {}),
    ...(plan.plan_preferences?.preferred_running_days
      ? { preferred_run_days: plan.plan_preferences.preferred_running_days }
      : {}),
    ...(plan.plan_preferences?.blocked_days
      ? { blocked_days: plan.plan_preferences.blocked_days }
      : {}),
    ...(plan.plan_preferences?.unavailable_days
      ? { blocked_days: plan.plan_preferences.unavailable_days }
      : {}),
    ...(plan.plan_preferences?.max_running_days_per_week
      ? { max_running_days_per_week: plan.plan_preferences.max_running_days_per_week }
      : {}),
    ...(plan.plan_preferences?.max_weekly_sessions
      ? { max_running_days_per_week: plan.plan_preferences.max_weekly_sessions }
      : {}),
    ...(typeof plan.plan_preferences?.allow_back_to_back_days === "boolean"
      ? { allow_back_to_back_days: plan.plan_preferences.allow_back_to_back_days }
      : {}),
    ...(typeof plan.plan_preferences?.no_double_days === "boolean"
      ? { allow_back_to_back_days: !plan.plan_preferences.no_double_days }
      : {}),
    ...(plan.plan_preferences?.preferred_long_run_day
      ? { preferred_long_run_day: plan.plan_preferences.preferred_long_run_day }
      : {}),
    ...(plan.plan_preferences?.injury_constraints
      ? { injury_constraints: plan.plan_preferences.injury_constraints }
      : {}),
    ...(plan.plan_preferences?.hard_constraints
      ? { hard_constraints: plan.plan_preferences.hard_constraints }
      : {}),
    ...(plan.plan_preferences?.preferred_workout_mix
      ? { preferred_workout_mix: plan.plan_preferences.preferred_workout_mix }
      : {}),
    ...(plan.plan_preferences?.strength_or_mobility_interest
      ? { strength_or_mobility_interest: plan.plan_preferences.strength_or_mobility_interest }
      : {}),
    ...(typeof plan.plan_preferences?.indoor_treadmill_ok === "boolean"
      ? { indoor_treadmill_ok: plan.plan_preferences.indoor_treadmill_ok }
      : {}),
    ...(plan.training_constraints?.running_days_per_week
      ? { max_running_days_per_week: plan.training_constraints.running_days_per_week }
      : {}),
    ...(plan.training_constraints?.full_rest_days
      ? { blocked_days: plan.training_constraints.full_rest_days }
      : {}),
    ...(plan.training_constraints?.long_run_day
      ? { preferred_long_run_day: plan.training_constraints.long_run_day }
      : {}),
    ...(notes ? { notes } : {}),
  };

  return Object.keys(preferences).length > 0 ? preferences : null;
}

function normalizeV2WorkoutType(workoutType) {
  switch (workoutType) {
    case "rest":
      return "rest";
    case "long_run":
      return "long_run";
    case "quality":
    case "tempo":
    case "intervals":
    case "progression":
    case "race":
      return "quality";
    case "steady_or_easy":
      return "steady_or_easy";
    case "recovery":
    case "easy":
    default:
      return "easy";
  }
}

function buildV2Notes(workout) {
  if (normalizeV2WorkoutType(workout.workout_type) === "rest") {
    const restHint = workout.segments.find((segment) => extractSegmentGuidance(segment))?.guidance;
    return restHint ?? workout.summary;
  }

  return workout.summary;
}

function normalizeV2Segments(segments) {
  return segments.flatMap((segment, index) => {
    if (segment.segment_type === "rest") {
      return [];
    }

    return [normalizeV2Segment(segment, index + 1)];
  });
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

  if (
    segment.segment_type === "interval_block" ||
    segment.segment_type === "strides" ||
    (segment.segment_type === "tempo_block" && prescription.mode === "repeats")
  ) {
    const repeatedType = segment.segment_type === "tempo_block" ? "tempo" : "intervals";

    return {
      segment_id: segmentId,
      segment_type: segment.segment_type,
      sequence: segment.sequence ?? sequence,
      label,
      guidance,
      prescription,
      type: repeatedType,
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

  if (
    segment.segment_type === "interval_block" ||
    segment.segment_type === "strides" ||
    (segment.segment_type === "tempo_block" && segment.repeat_count)
  ) {
    const workDurationMin =
      segment.work_duration_min ??
      (segment.work_duration_sec
        ? Number((segment.work_duration_sec / 60).toFixed(2))
        : undefined) ??
      segment.duration_min;
    const recoveryDurationMin =
      segment.recovery_duration_min ??
      (segment.recovery_duration_sec
        ? Number((segment.recovery_duration_sec / 60).toFixed(2))
        : undefined);

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
            duration_min: workDurationMin,
          },
      recovery_unit:
        recoveryDurationMin || segment.recovery_distance_km
          ? segment.recovery_distance_km
            ? {
                mode: "distance",
                distance_km: segment.recovery_distance_km,
              }
            : {
                mode: "time",
                duration_min: recoveryDurationMin,
              }
          : {
              mode: "none",
            },
    };
  }

  if (segment.segment_type === "rest" || segment.segment_type === "fueling") {
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

  const extra = {};

  for (const [key, value] of Object.entries(target.extra ?? {})) {
    if (
      key === "hr_bpm" ||
      key === "hr_bpm_range" ||
      key === "pace_range_min_km" ||
      key === "pace_min_per_km_range"
    ) {
      continue;
    }

    extra[key] = value;
  }

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
    ...(hrRange ? { hr_bpm_range: hrRange } : {}),
    ...(paceRange ? { pace_min_per_km_range: paceRange } : {}),
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
    case "activation":
    case "drills":
    case "mobility_optional":
      return "mobility";
    case "recovery_jog":
      return "recovery";
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
    case "mobility_optional":
      return "Optional mobility";
    case "strength":
      return "Strength";
    case "activation":
      return "Activation";
    case "drills":
      return "Drills";
    case "strides":
      return "Strides";
    case "recovery_jog":
      return "Recovery jog";
    case "fueling":
      return "Fueling";
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

function isTrainingPlanV2(plan) {
  return plan && typeof plan === "object" && plan.schema_version === FUTURE_TEMPLATE_VERSION;
}
