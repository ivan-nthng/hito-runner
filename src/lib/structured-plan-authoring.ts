import { z } from "zod";
import {
  FUTURE_TEMPLATE_VERSION,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import { addDaysIso, diffDaysIso, todayIso } from "@/lib/training";

const weekdayValues = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const weekdaySchema = z.enum(weekdayValues);

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const recentRaceResultSchema = z.object({
  distance: z.string().trim().min(1),
  resultTime: z.string().trim().min(1),
  resultDate: isoDateSchema.optional().nullable(),
});

export const structuredPlanAuthoringInputSchema = z
  .object({
    goal: z.object({
      goalType: z.enum([
        "build_consistency",
        "distance_build",
        "5k",
        "10k",
        "half_marathon",
        "marathon",
        "ultra_marathon",
        "mountain_running",
      ]),
      goalLabel: z.string().trim().min(1).max(160),
      targetEventName: z.string().trim().max(160).optional().nullable(),
    }),
    schedule: z.object({
      startDate: isoDateSchema.default(todayIso()),
      targetDate: isoDateSchema.optional().nullable(),
      preparationHorizonWeeks: z.number().int().min(1).max(24).optional().nullable(),
    }),
    runnerProfile: z
      .object({
        experienceLevel: z.enum([
          "new_runner",
          "returning_runner",
          "consistent_runner",
          "experienced_runner",
        ]),
        baselineSessionsPerWeek: z.number().int().min(1).max(7),
        baselineLongRunKm: z.number().positive().max(80).optional().nullable(),
        baselineLongRunDurationMin: z.number().int().min(20).max(300).optional().nullable(),
        age: z.number().int().min(13).max(100).optional().nullable(),
        recentInjuryRecoveryContext: z.string().trim().max(500).optional().nullable(),
        preferredEffortLanguage: z
          .enum(["pace", "heart_rate", "rpe", "mixed"])
          .optional()
          .nullable(),
      })
      .superRefine((value, context) => {
        if (!value.baselineLongRunKm && !value.baselineLongRunDurationMin) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["baselineLongRunKm"],
            message: "Provide baselineLongRunKm or baselineLongRunDurationMin.",
          });
        }
      }),
    currentLevel: z
      .object({
        recentResultSummary: z.string().trim().max(500).optional().nullable(),
        recentRaceResults: z.array(recentRaceResultSchema).max(5).default([]),
        recent5kPaceSecondsPerKm: z
          .number()
          .positive()
          .max(20 * 60)
          .optional()
          .nullable(),
        currentEasyPaceRange: z.string().trim().max(120).optional().nullable(),
        currentTrainingLoadSummary: z.string().trim().max(500).optional().nullable(),
      })
      .default({
        recentRaceResults: [],
      }),
    availability: z
      .object({
        preferredRunningDays: z.array(weekdaySchema).min(1).max(7),
        unavailableDays: z.array(weekdaySchema).max(7).default([]),
        maxRunningDaysPerWeek: z.number().int().min(1).max(7),
        allowBackToBackDays: z.boolean().default(false),
        preferredLongRunDay: weekdaySchema.optional().nullable(),
      })
      .superRefine((value, context) => {
        const overlap = value.preferredRunningDays.filter((day) =>
          value.unavailableDays.includes(day),
        );

        if (overlap.length > 0) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["preferredRunningDays"],
            message: `Preferred and unavailable days overlap: ${overlap.join(", ")}.`,
          });
        }
      }),
    constraints: z
      .object({
        injuryConstraints: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
        hardConstraints: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
      })
      .default({
        injuryConstraints: [],
        hardConstraints: [],
      }),
    preferences: z
      .object({
        preferredWorkoutMix: z
          .enum(["balanced", "easy_heavy", "quality_light", "long_run_focus"])
          .optional()
          .nullable(),
        terrainFocus: z.enum(["standard", "rolling", "mountain"]).default("standard"),
        strengthOrMobilityInterest: z
          .enum(["none", "mobility", "strength", "both"])
          .optional()
          .nullable(),
        indoorTreadmillOk: z.boolean().default(false),
        notes: z.string().trim().max(500).optional().nullable(),
      })
      .default({
        indoorTreadmillOk: false,
      }),
  })
  .superRefine((value, context) => {
    if (!value.schedule.targetDate && !value.schedule.preparationHorizonWeeks) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["schedule", "targetDate"],
        message: "Provide targetDate or preparationHorizonWeeks.",
      });
    }

    if (value.schedule.targetDate) {
      const diffDays = diffDaysIso(value.schedule.targetDate, value.schedule.startDate);

      if (diffDays < 6) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["schedule", "targetDate"],
          message: "targetDate must be at least 7 days after startDate.",
        });
      }
    }
  });

type StructuredPlanAuthoringInput = z.infer<typeof structuredPlanAuthoringInputSchema>;

interface NormalizedStructuredInput extends StructuredPlanAuthoringInput {
  schedule: StructuredPlanAuthoringInput["schedule"] & {
    horizonWeeks: number;
    endDate: string;
  };
  availability: StructuredPlanAuthoringInput["availability"] & {
    runningDays: (typeof weekdayValues)[number][];
    longRunDay: (typeof weekdayValues)[number];
    qualityDay: (typeof weekdayValues)[number] | null;
    steadyDay: (typeof weekdayValues)[number] | null;
  };
}

export function buildStructuredAuthoringPlan(input: StructuredPlanAuthoringInput): TrainingPlanV2 {
  const normalized = normalizeStructuredPlanAuthoringInput(input);
  const workouts = buildGeneratedWorkouts(normalized);

  return trainingPlanV2Schema.parse({
    schema_version: FUTURE_TEMPLATE_VERSION,
    plan_id: `generated-${slugify(normalized.goal.goalType)}-${normalized.schedule.startDate}`,
    plan_name: normalized.goal.goalLabel,
    source_kind: "structured_authoring_v1",
    created_at: new Date().toISOString(),
    generated_for: "You",
    goal: {
      goal_type: normalized.goal.goalType,
      goal_label: normalized.goal.goalLabel,
      ...(normalized.schedule.targetDate || normalized.goal.targetEventName
        ? {
            target_event: {
              ...(normalized.goal.targetEventName
                ? {
                    event_name: normalized.goal.targetEventName,
                    label: normalized.goal.targetEventName,
                  }
                : {}),
              ...(normalized.schedule.targetDate
                ? {
                    event_date: normalized.schedule.targetDate,
                    date: normalized.schedule.targetDate,
                  }
                : {}),
            },
          }
        : {}),
    },
    runner_profile: {
      experience_level: normalized.runnerProfile.experienceLevel,
      baseline_sessions_per_week: normalized.runnerProfile.baselineSessionsPerWeek,
      ...(normalized.runnerProfile.baselineLongRunKm
        ? { baseline_long_run_km: normalized.runnerProfile.baselineLongRunKm }
        : {}),
      ...(normalized.runnerProfile.baselineLongRunDurationMin
        ? { baseline_long_run_duration_min: normalized.runnerProfile.baselineLongRunDurationMin }
        : {}),
      ...(normalized.runnerProfile.age ? { age: normalized.runnerProfile.age } : {}),
      ...(normalized.runnerProfile.recentInjuryRecoveryContext
        ? {
            recent_injury_recovery_context: normalized.runnerProfile.recentInjuryRecoveryContext,
          }
        : {}),
      ...(normalized.runnerProfile.preferredEffortLanguage
        ? { preferred_effort_language: normalized.runnerProfile.preferredEffortLanguage }
        : {}),
      ...(normalized.currentLevel.recentResultSummary
        ? { recent_result_summary: normalized.currentLevel.recentResultSummary }
        : {}),
      ...(normalized.currentLevel.currentEasyPaceRange
        ? { current_easy_pace_range: normalized.currentLevel.currentEasyPaceRange }
        : {}),
      ...(normalized.currentLevel.currentTrainingLoadSummary
        ? { current_training_load_summary: normalized.currentLevel.currentTrainingLoadSummary }
        : {}),
      ...(normalized.currentLevel.recentRaceResults.length > 0
        ? {
            recent_race_results: normalized.currentLevel.recentRaceResults.map((entry) => ({
              distance: entry.distance,
              result_time: entry.resultTime,
              ...(entry.resultDate ? { result_date: entry.resultDate } : {}),
            })),
          }
        : {}),
    },
    start_date: normalized.schedule.startDate,
    preparation_horizon_weeks: normalized.schedule.horizonWeeks,
    ...(normalized.schedule.targetDate ? { target_date: normalized.schedule.targetDate } : {}),
    plan_preferences: {
      preferred_run_days: normalized.availability.runningDays,
      blocked_days: normalized.availability.unavailableDays,
      max_running_days_per_week: normalized.availability.maxRunningDaysPerWeek,
      allow_back_to_back_days: normalized.availability.allowBackToBackDays,
      preferred_long_run_day: normalized.availability.longRunDay,
      injury_constraints: normalized.constraints.injuryConstraints,
      hard_constraints: normalized.constraints.hardConstraints,
      ...(normalized.preferences.preferredWorkoutMix
        ? { preferred_workout_mix: normalized.preferences.preferredWorkoutMix }
        : {}),
      terrain_focus: normalized.preferences.terrainFocus,
      ...(normalized.preferences.strengthOrMobilityInterest
        ? {
            strength_or_mobility_interest: normalized.preferences.strengthOrMobilityInterest,
          }
        : {}),
      indoor_treadmill_ok: normalized.preferences.indoorTreadmillOk,
      ...(buildPreferenceNotes(normalized) ? { notes: buildPreferenceNotes(normalized) } : {}),
    },
    planned_workouts: workouts,
  });
}

function normalizeStructuredPlanAuthoringInput(
  input: StructuredPlanAuthoringInput,
): NormalizedStructuredInput {
  const parsed = structuredPlanAuthoringInputSchema.parse(input);
  const runningDays = Array.from(
    new Set(
      parsed.availability.preferredRunningDays.filter(
        (day) => !parsed.availability.unavailableDays.includes(day),
      ),
    ),
  ).sort(compareWeekdays);

  if (runningDays.length === 0) {
    throw new Error("Structured plan authoring needs at least one available running day.");
  }

  const limitedRunningDays = runningDays.slice(0, parsed.availability.maxRunningDaysPerWeek);
  const longRunDay =
    parsed.availability.preferredLongRunDay &&
    limitedRunningDays.includes(parsed.availability.preferredLongRunDay)
      ? parsed.availability.preferredLongRunDay
      : (limitedRunningDays.at(-1) ?? "Sunday");
  const otherRunDays = limitedRunningDays.filter((day) => day !== longRunDay);
  const qualityDay =
    otherRunDays.length >= 1 && !shouldAvoidQuality(parsed) ? otherRunDays[0] : null;
  const steadyDay =
    otherRunDays.length >= 2 && parsed.preferences.preferredWorkoutMix !== "easy_heavy"
      ? otherRunDays[1]
      : null;
  const endDate = parsed.schedule.targetDate
    ? parsed.schedule.targetDate
    : addDaysIso(parsed.schedule.startDate, parsed.schedule.preparationHorizonWeeks! * 7 - 1);
  const horizonWeeks =
    parsed.schedule.preparationHorizonWeeks ??
    Math.max(1, Math.ceil((diffDaysIso(endDate, parsed.schedule.startDate) + 1) / 7));

  return {
    ...parsed,
    schedule: {
      ...parsed.schedule,
      horizonWeeks,
      endDate,
    },
    availability: {
      ...parsed.availability,
      preferredRunningDays: limitedRunningDays,
      runningDays: limitedRunningDays,
      longRunDay,
      qualityDay,
      steadyDay,
    },
  };
}

function buildGeneratedWorkouts(normalized: NormalizedStructuredInput) {
  const workouts = [];
  const totalDays = diffDaysIso(normalized.schedule.endDate, normalized.schedule.startDate) + 1;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset += 1) {
    const date = addDaysIso(normalized.schedule.startDate, dayOffset);
    const weekNumber = Math.floor(dayOffset / 7) + 1;
    const weekday = isoWeekday(date);
    const workoutId = `wk_${weekNumber}_${date}`;
    const phase = phaseForWeek(weekNumber, normalized.schedule.horizonWeeks);

    if (!normalized.availability.runningDays.includes(weekday)) {
      workouts.push(buildRestWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }));
      continue;
    }

    if (weekday === normalized.availability.longRunDay) {
      workouts.push(
        buildLongRunWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
      );
      continue;
    }

    if (weekday === normalized.availability.qualityDay) {
      workouts.push(
        buildQualityWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
      );
      continue;
    }

    if (weekday === normalized.availability.steadyDay) {
      workouts.push(
        buildSteadyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }),
      );
      continue;
    }

    workouts.push(buildEasyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }));
  }

  return workouts;
}

function buildRestWorkout({
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

function buildEasyWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const easyDurationMin = deriveEasyDurationMin(normalized, weekNumber);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    title: "Easy aerobic run",
    summary: `${easyDurationMin} min comfortable aerobic running.`,
    planned_rpe: 4,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Easy aerobic running",
        guidance: "Stay relaxed and conversational.",
        prescription: {
          mode: "time" as const,
          duration_min: easyDurationMin,
        },
        target: buildEasyTarget(normalized),
      },
    ],
  };
}

function buildSteadyWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const steadyDurationMin = deriveEasyDurationMin(normalized, weekNumber) + 10;
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    title: "Steady aerobic run",
    summary: `${steadyDurationMin} min steady aerobic support run.`,
    planned_rpe: 5,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Steady aerobic running",
        guidance: "Keep the effort controlled, not race-like.",
        prescription: {
          mode: "time" as const,
          duration_min: steadyDurationMin,
        },
        target: {
          intensity: "steady_aerobic",
          ...(paceTargets?.steady ? { pace_min_per_km_range: paceTargets.steady } : {}),
          cue: "Controlled breathing, still sustainable.",
        },
      },
    ],
  };
}

function buildLongRunWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const distanceKm = deriveLongRunDistanceKm(normalized, weekNumber);
  const durationMin = deriveLongRunDurationMin(normalized, weekNumber, distanceKm);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "long_run" as const,
    title: "Long run",
    summary: normalized.runnerProfile.baselineLongRunKm
      ? `${distanceKm} km long aerobic run.`
      : `${durationMin} min long aerobic run.`,
    planned_rpe: 5,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Long run",
        guidance: buildLongRunGuidance(normalized),
        prescription: normalized.runnerProfile.baselineLongRunKm
          ? {
              mode: "distance" as const,
              distance_km: distanceKm,
            }
          : {
              mode: "time" as const,
              duration_min: durationMin,
            },
        ...(normalized.runnerProfile.baselineLongRunKm
          ? { distance_km: distanceKm }
          : { duration_min: durationMin }),
        target: buildLongRunTarget(normalized),
      },
    ],
  };
}

function buildQualityWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const workoutPattern = weekNumber % 3;

  if (normalized.preferences.terrainFocus === "mountain") {
    return workoutPattern === 1
      ? buildHillRepeatsWorkout({ workoutId, date, weekday, weekNumber, phase, normalized })
      : buildClimbingSteadyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (normalized.preferences.terrainFocus === "rolling" && workoutPattern === 2) {
    return buildRollingHillsWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (workoutPattern === 1) {
    return buildTempoWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (workoutPattern === 2) {
    return buildDistanceIntervalsWorkout({
      workoutId,
      date,
      weekday,
      weekNumber,
      phase,
      normalized,
    });
  }

  return buildTimeIntervalsWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
}

function buildRollingHillsWorkout({
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

function buildHillRepeatsWorkout({
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

function buildClimbingSteadyWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = deriveEasyDurationMin(normalized, weekNumber) + 10;
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    title: "Climbing steady run",
    summary: `${durationMin} min steady run with intentional hill exposure.`,
    planned_rpe: 6,
    segments: [
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
        target: {
          intensity: "steady_climbing",
          ...(paceTargets?.hillSteady ? { pace_min_per_km_range: paceTargets.hillSteady } : {}),
          cue: "Controlled climbing rhythm with relaxed descents.",
        },
      },
    ],
  };
}

function buildTempoWorkout({
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
          cue: "Comfortably hard, sustainable for the whole block.",
        },
      },
      buildCooldownSegment(workoutId, 3, 8, normalized),
    ],
  };
}

function buildDistanceIntervalsWorkout({
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
    title: "Intervals session",
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

function buildTimeIntervalsWorkout({
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
    title: "Intervals session",
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

function buildWarmupSegment(
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
      cue: "Start gently and loosen up.",
    },
  };
}

function buildCooldownSegment(
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
      hint: "Walk if needed before stopping.",
    },
  };
}

function buildRepeatRecoveryTarget(normalized: NormalizedStructuredInput) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    intensity: "very_easy_recovery",
    ...(paceTargets?.recovery ? { pace_min_per_km_range: paceTargets.recovery } : {}),
    hint: "Very easy jog or walk; let breathing settle.",
  };
}

function buildEasyTarget(normalized: NormalizedStructuredInput) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    intensity: "easy_aerobic",
    ...((paceTargets?.easy ?? normalized.currentLevel.currentEasyPaceRange)
      ? { pace_min_per_km_range: paceTargets?.easy ?? normalized.currentLevel.currentEasyPaceRange }
      : {}),
    cue:
      normalized.runnerProfile.preferredEffortLanguage === "heart_rate"
        ? "Stay clearly below hard effort and keep the heart rate drifting smoothly."
        : "Conversational effort throughout.",
  };
}

function buildLongRunTarget(normalized: NormalizedStructuredInput) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    intensity: "easy_aerobic",
    ...((paceTargets?.longRun ?? normalized.currentLevel.currentEasyPaceRange)
      ? {
          pace_min_per_km_range:
            paceTargets?.longRun ?? normalized.currentLevel.currentEasyPaceRange,
        }
      : {}),
    cue: "Comfortable enough to keep the full run controlled.",
  };
}

function deriveBenchmarkPaceTargets(normalized: NormalizedStructuredInput) {
  const recent5kPaceSecondsPerKm = getRecent5kPaceSecondsPerKm(normalized);

  if (!recent5kPaceSecondsPerKm) {
    return null;
  }

  return {
    easy: buildPaceRange(recent5kPaceSecondsPerKm, 90, 150),
    recovery: buildPaceRange(recent5kPaceSecondsPerKm, 135, 225),
    longRun: buildPaceRange(recent5kPaceSecondsPerKm, 100, 170),
    steady: buildPaceRange(recent5kPaceSecondsPerKm, 60, 105),
    tempo: buildPaceRange(recent5kPaceSecondsPerKm, 25, 55),
    interval: buildPaceRange(recent5kPaceSecondsPerKm, 0, 25),
    rollingHill: buildPaceRange(recent5kPaceSecondsPerKm, 55, 120),
    hillRepeat: buildPaceRange(recent5kPaceSecondsPerKm, 70, 165),
    hillSteady: buildPaceRange(recent5kPaceSecondsPerKm, 75, 145),
  };
}

function getRecent5kPaceSecondsPerKm(normalized: NormalizedStructuredInput) {
  if (normalized.currentLevel.recent5kPaceSecondsPerKm) {
    return normalized.currentLevel.recent5kPaceSecondsPerKm;
  }

  const recent5k = normalized.currentLevel.recentRaceResults.find((result) =>
    /^5\s*k(m)?$/i.test(result.distance.trim()),
  );
  const resultSeconds = recent5k ? parseDurationSeconds(recent5k.resultTime) : null;

  return resultSeconds ? resultSeconds / 5 : null;
}

function buildPaceRange(
  recent5kPaceSecondsPerKm: number,
  fastDeltaSeconds: number,
  slowDeltaSeconds: number,
) {
  return `${formatPaceSecondsPerKm(
    recent5kPaceSecondsPerKm + fastDeltaSeconds,
  )}-${formatPaceSecondsPerKm(recent5kPaceSecondsPerKm + slowDeltaSeconds)}/km`;
}

function formatPaceSecondsPerKm(secondsPerKm: number) {
  const roundedSeconds = Math.round(secondsPerKm / 5) * 5;
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function parseDurationSeconds(value: string) {
  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.length !== 2 && parts.length !== 3) return null;
  if (parts.some((part) => !Number.isInteger(part) || part < 0)) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;

    if (seconds == null || seconds >= 60) return null;
    return minutes! * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;

  if (minutes == null || seconds == null || minutes >= 60 || seconds >= 60) return null;
  return hours! * 3600 + minutes * 60 + seconds;
}

function buildLongRunGuidance(normalized: NormalizedStructuredInput) {
  if (normalized.preferences.terrainFocus === "mountain") {
    return "Keep the effort comfortable and include hills or rolling terrain when available; no exact elevation target.";
  }

  if (normalized.preferences.terrainFocus === "rolling") {
    return "Keep the effort comfortable and let mild rolling terrain be part of the run when available.";
  }

  return "Keep the effort comfortable enough to finish feeling in control.";
}

function deriveEasyDurationMin(normalized: NormalizedStructuredInput, weekNumber: number) {
  const base =
    normalized.runnerProfile.baselineLongRunDurationMin ??
    normalized.runnerProfile.baselineLongRunKm! * 6;
  const progression = Math.min(20, Math.floor((weekNumber - 1) / 3) * 5);
  return roundToFive(Math.max(25, base * 0.55 + progression));
}

function deriveLongRunDistanceKm(normalized: NormalizedStructuredInput, weekNumber: number) {
  const base =
    normalized.runnerProfile.baselineLongRunKm ??
    Number(((normalized.runnerProfile.baselineLongRunDurationMin ?? 60) / 7).toFixed(1));
  const mixBonus = normalized.preferences.preferredWorkoutMix === "long_run_focus" ? 1 : 0;
  const progression = Math.floor((weekNumber - 1) / 2) * 0.8;
  const downWeekAdjustment = weekNumber % 4 === 0 ? -1 : 0;
  const taperAdjustment = weekNumber === normalized.schedule.horizonWeeks ? -1 : 0;
  return Number(
    Math.max(6, base + progression + mixBonus + downWeekAdjustment + taperAdjustment).toFixed(1),
  );
}

function deriveLongRunDurationMin(
  normalized: NormalizedStructuredInput,
  weekNumber: number,
  distanceKm: number,
) {
  if (normalized.runnerProfile.baselineLongRunDurationMin) {
    const progression = Math.floor((weekNumber - 1) / 2) * 5;
    const downWeekAdjustment = weekNumber % 4 === 0 ? -10 : 0;
    const taperAdjustment = weekNumber === normalized.schedule.horizonWeeks ? -10 : 0;
    return roundToFive(
      Math.max(
        40,
        normalized.runnerProfile.baselineLongRunDurationMin +
          progression +
          downWeekAdjustment +
          taperAdjustment,
      ),
    );
  }

  return roundToFive(distanceKm * 6.5);
}

function shouldAvoidQuality(normalized: StructuredPlanAuthoringInput) {
  return [
    ...normalized.constraints.injuryConstraints,
    ...normalized.constraints.hardConstraints,
  ].some((value) => /avoid speed|no speed|avoid intensity|no intensity|injury/i.test(value));
}

function buildRestGuidance(normalized: StructuredPlanAuthoringInput) {
  const constraint =
    normalized.constraints.injuryConstraints[0] ??
    normalized.constraints.hardConstraints[0] ??
    null;

  if (constraint) {
    return `Rest day keeps this constraint intact: ${constraint}`;
  }

  return "No running scheduled today.";
}

function buildPreferenceNotes(normalized: StructuredPlanAuthoringInput) {
  const notes = [normalized.preferences.notes, normalized.currentLevel.recentResultSummary].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  return notes.join(" · ") || null;
}

function phaseForWeek(weekNumber: number, horizonWeeks: number) {
  if (horizonWeeks <= 2) {
    return weekNumber === horizonWeeks ? "Peak" : "Base";
  }

  const progress = weekNumber / horizonWeeks;

  if (progress <= 0.5) {
    return "Base";
  }

  if (progress <= 0.85) {
    return "Build";
  }

  return "Peak";
}

function compareWeekdays(
  left: (typeof weekdayValues)[number],
  right: (typeof weekdayValues)[number],
) {
  return weekdayValues.indexOf(left) - weekdayValues.indexOf(right);
}

function isoWeekday(isoDate: string): (typeof weekdayValues)[number] {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }) as (typeof weekdayValues)[number];
}

function roundToFive(value: number) {
  return Math.round(value / 5) * 5;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface BuildWorkoutContext {
  workoutId: string;
  date: string;
  weekday: (typeof weekdayValues)[number];
  weekNumber: number;
  phase: string;
  normalized: NormalizedStructuredInput;
}
