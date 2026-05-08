import { z } from "zod";

const FUTURE_TEMPLATE_VERSION = "training-plan-v2";
const weekdayValues = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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

export function buildStructuredAuthoringPlan(input) {
  const normalized = normalizeStructuredPlanAuthoringInput(input);
  const workouts = buildGeneratedWorkouts(normalized);

  return {
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
      ...(normalized.preferences.strengthOrMobilityInterest
        ? {
            strength_or_mobility_interest: normalized.preferences.strengthOrMobilityInterest,
          }
        : {}),
      indoor_treadmill_ok: normalized.preferences.indoorTreadmillOk,
      ...(buildPreferenceNotes(normalized) ? { notes: buildPreferenceNotes(normalized) } : {}),
    },
    planned_workouts: workouts,
  };
}

function normalizeStructuredPlanAuthoringInput(input) {
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
    : addDaysIso(parsed.schedule.startDate, parsed.schedule.preparationHorizonWeeks * 7 - 1);
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

function buildGeneratedWorkouts(normalized) {
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

function buildRestWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }) {
  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "rest",
    title: "Rest and recovery",
    summary: shouldAvoidQuality(normalized)
      ? "Recovery day that keeps current constraints intact."
      : "No running scheduled today.",
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "rest",
        guidance: buildRestGuidance(normalized),
      },
    ],
  };
}

function buildEasyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }) {
  const easyDurationMin = deriveEasyDurationMin(normalized, weekNumber);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy",
    title: "Easy aerobic run",
    summary: `${easyDurationMin} min comfortable aerobic running.`,
    planned_rpe: 4,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main",
        label: "Easy aerobic running",
        guidance: "Stay relaxed and conversational.",
        prescription: {
          mode: "time",
          duration_min: easyDurationMin,
        },
        target: buildEasyTarget(normalized),
      },
    ],
  };
}

function buildSteadyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }) {
  const steadyDurationMin = deriveEasyDurationMin(normalized, weekNumber) + 10;

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy",
    title: "Steady aerobic run",
    summary: `${steadyDurationMin} min steady aerobic support run.`,
    planned_rpe: 5,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main",
        label: "Steady aerobic running",
        guidance: "Keep the effort controlled, not race-like.",
        prescription: {
          mode: "time",
          duration_min: steadyDurationMin,
        },
        target: {
          intensity: "steady_aerobic",
          cue: "Controlled breathing, still sustainable.",
        },
      },
    ],
  };
}

function buildLongRunWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }) {
  const distanceKm = deriveLongRunDistanceKm(normalized, weekNumber);
  const durationMin = deriveLongRunDurationMin(normalized, weekNumber, distanceKm);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "long_run",
    title: "Long run",
    summary: normalized.runnerProfile.baselineLongRunKm
      ? `${distanceKm} km long aerobic run.`
      : `${durationMin} min long aerobic run.`,
    planned_rpe: 5,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main",
        label: "Long run",
        guidance: "Keep the effort comfortable enough to finish feeling in control.",
        prescription: normalized.runnerProfile.baselineLongRunKm
          ? {
              mode: "distance",
              distance_km: distanceKm,
            }
          : {
              mode: "time",
              duration_min: durationMin,
            },
        ...(normalized.runnerProfile.baselineLongRunKm
          ? { distance_km: distanceKm }
          : { duration_min: durationMin }),
        target: buildEasyTarget(normalized),
      },
    ],
  };
}

function buildQualityWorkout({ workoutId, date, weekday, weekNumber, phase, normalized }) {
  const workoutPattern = weekNumber % 3;

  if (workoutPattern === 1) {
    return buildTempoWorkout({ workoutId, date, weekday, weekNumber, phase });
  }

  if (workoutPattern === 2) {
    return buildDistanceIntervalsWorkout({ workoutId, date, weekday, weekNumber, phase });
  }

  return buildTimeIntervalsWorkout({ workoutId, date, weekday, weekNumber, phase });
}

function buildTempoWorkout({ workoutId, date, weekday, weekNumber, phase }) {
  const tempoDurationMin = Math.min(35, 16 + (weekNumber - 1) * 2);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "tempo",
    title: "Controlled tempo session",
    summary: `${tempoDurationMin} min controlled tempo running between easy and race effort.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "tempo_block",
        label: "Tempo block",
        guidance: "Stay controlled. You should finish strong, not desperate.",
        prescription: {
          mode: "time",
          duration_min: tempoDurationMin,
        },
        duration_min: tempoDurationMin,
        target: {
          intensity: "tempo",
          cue: "Comfortably hard, sustainable for the whole block.",
        },
      },
      buildCooldownSegment(workoutId, 3, 8),
    ],
  };
}

function buildDistanceIntervalsWorkout({ workoutId, date, weekday, weekNumber, phase }) {
  const repeatCount = Math.min(8, 4 + Math.floor((weekNumber - 1) / 3));

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality",
    title: "Intervals session",
    summary: `${repeatCount} x 400m at controlled 5K effort with 2 min recovery.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block",
        label: `${repeatCount} x 400m`,
        guidance: "Stay smooth and repeatable across all reps.",
        prescription: {
          mode: "repeats",
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "distance",
            distance_km: 0.4,
          },
          recovery_unit: {
            mode: "time",
            duration_min: 2,
          },
        },
        target: {
          intensity: "5k_effort",
          cue: "Fast but controlled, never sprinting.",
        },
      },
      buildCooldownSegment(workoutId, 3, 10),
    ],
  };
}

function buildTimeIntervalsWorkout({ workoutId, date, weekday, weekNumber, phase }) {
  const repeatCount = Math.min(7, 4 + Math.floor((weekNumber - 1) / 4));

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality",
    title: "Intervals session",
    summary: `${repeatCount} x 3 min controlled intervals with 2 min recovery.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block",
        label: `${repeatCount} x 3 min`,
        guidance: "Keep each repeat repeatable and slightly quicker than tempo effort.",
        prescription: {
          mode: "repeats",
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time",
            duration_min: 3,
          },
          recovery_unit: {
            mode: "time",
            duration_min: 2,
          },
        },
        target: {
          intensity: "10k_effort",
          cue: "Quick, rhythmic running with controlled recovery.",
        },
      },
      buildCooldownSegment(workoutId, 3, 10),
    ],
  };
}

function buildWarmupSegment(workoutId, sequence, durationMin) {
  return {
    segment_id: `${workoutId}_seg_${sequence}`,
    sequence,
    segment_type: "warmup",
    label: "Warmup",
    prescription: {
      mode: "time",
      duration_min: durationMin,
    },
    duration_min: durationMin,
    target: {
      intensity: "easy",
      cue: "Start gently and loosen up.",
    },
  };
}

function buildCooldownSegment(workoutId, sequence, durationMin) {
  return {
    segment_id: `${workoutId}_seg_${sequence}`,
    sequence,
    segment_type: "cooldown",
    label: "Cooldown",
    prescription: {
      mode: "time",
      duration_min: durationMin,
    },
    duration_min: durationMin,
    target: {
      hint: "Walk if needed before stopping.",
    },
  };
}

function buildEasyTarget(normalized) {
  return {
    intensity: "easy_aerobic",
    ...(normalized.currentLevel.currentEasyPaceRange
      ? { pace_min_per_km_range: normalized.currentLevel.currentEasyPaceRange }
      : {}),
    cue:
      normalized.runnerProfile.preferredEffortLanguage === "heart_rate"
        ? "Stay clearly below hard effort and keep the heart rate drifting smoothly."
        : "Conversational effort throughout.",
  };
}

function deriveEasyDurationMin(normalized, weekNumber) {
  const base =
    normalized.runnerProfile.baselineLongRunDurationMin ??
    normalized.runnerProfile.baselineLongRunKm * 6;
  const progression = Math.min(20, Math.floor((weekNumber - 1) / 3) * 5);
  return roundToFive(Math.max(25, base * 0.55 + progression));
}

function deriveLongRunDistanceKm(normalized, weekNumber) {
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

function deriveLongRunDurationMin(normalized, weekNumber, distanceKm) {
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

function shouldAvoidQuality(normalized) {
  return [
    ...normalized.constraints.injuryConstraints,
    ...normalized.constraints.hardConstraints,
  ].some((value) => /avoid speed|no speed|avoid intensity|no intensity|injury/i.test(value));
}

function buildRestGuidance(normalized) {
  const constraint =
    normalized.constraints.injuryConstraints[0] ??
    normalized.constraints.hardConstraints[0] ??
    null;

  return constraint
    ? `Rest day keeps this constraint intact: ${constraint}`
    : "No running scheduled today.";
}

function buildPreferenceNotes(normalized) {
  const notes = [normalized.preferences.notes, normalized.currentLevel.recentResultSummary].filter(
    (value) => Boolean(value?.trim()),
  );

  return notes.join(" · ") || null;
}

function phaseForWeek(weekNumber, horizonWeeks) {
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

function compareWeekdays(left, right) {
  return weekdayValues.indexOf(left) - weekdayValues.indexOf(right);
}

function isoWeekday(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
}

function roundToFive(value) {
  return Math.round(value / 5) * 5;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addDaysIso(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDaysIso(a, b) {
  const left = new Date(`${a}T00:00:00Z`).getTime();
  const right = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((left - right) / (24 * 60 * 60 * 1000));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
