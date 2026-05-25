import { z } from "zod";
import {
  FUTURE_TEMPLATE_VERSION,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import {
  DEFAULT_FIRST_PLAN_EXECUTION_MODE,
  FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES,
  FIRST_PLAN_WATCH_ACCESS_VALUES,
} from "@/lib/first-plan-authoring-utils";
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

const watchAccessSchema = z.enum(FIRST_PLAN_WATCH_ACCESS_VALUES);

const guidancePreferenceSchema = z.enum(FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES);

const executionModeSchema = z.preprocess(
  (value) => value ?? DEFAULT_FIRST_PLAN_EXECUTION_MODE,
  z
    .object({
      watchAccess: watchAccessSchema.default(DEFAULT_FIRST_PLAN_EXECUTION_MODE.watchAccess),
      guidancePreference: guidancePreferenceSchema.default(
        DEFAULT_FIRST_PLAN_EXECUTION_MODE.guidancePreference,
      ),
    })
    .strict(),
);

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
    execution: executionModeSchema,
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

interface StructuredMetricMode {
  paceTargetsAllowed: boolean;
  heartRateTargetsAllowed: boolean;
  recent5kPaceSecondsPerKm: number | null;
}

type TrainingPhase = "Base" | "Build" | "Specific" | "Taper";

interface LongRunGoalPolicy {
  floorKm: number;
  peakKm: number;
  ceilingKm: number;
}

const longRunGoalPolicies: Record<
  StructuredPlanAuthoringInput["goal"]["goalType"],
  LongRunGoalPolicy
> = {
  build_consistency: { floorKm: 5, peakKm: 10, ceilingKm: 12 },
  distance_build: { floorKm: 7, peakKm: 15, ceilingKm: 18 },
  "5k": { floorKm: 6, peakKm: 12, ceilingKm: 14 },
  "10k": { floorKm: 8, peakKm: 16, ceilingKm: 18 },
  half_marathon: { floorKm: 10, peakKm: 20, ceilingKm: 22 },
  marathon: { floorKm: 12, peakKm: 30, ceilingKm: 32 },
  ultra_marathon: { floorKm: 14, peakKm: 34, ceilingKm: 38 },
  mountain_running: { floorKm: 10, peakKm: 26, ceilingKm: 30 },
};

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
    source_workout_type: "rest_and_recovery",
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
  const technicalTrailExposure = isMountainSpecificPlan(normalized) && phase === "Base";

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: technicalTrailExposure ? "technical_trail_easy" : "easy_aerobic_run",
    title: technicalTrailExposure ? "Technical trail easy run" : "Easy aerobic run",
    summary: technicalTrailExposure
      ? `${easyDurationMin} min easy running with low-risk trail or uneven-ground awareness.`
      : `${easyDurationMin} min comfortable aerobic running.`,
    planned_rpe: 4,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: technicalTrailExposure ? "Easy trail awareness" : "Easy aerobic running",
        guidance: technicalTrailExposure
          ? "Choose forgiving terrain if available. Keep the effort conversational, watch footing, and avoid risky technical sections."
          : "Stay relaxed and conversational.",
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
    source_workout_type: "steady_aerobic_run",
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
  const cutback = isCutbackWeek(weekNumber, normalized);
  const taper = phase === "Taper";
  const mountainSpecific = isMountainSpecificPlan(normalized);
  const hasSteadyFinish = !mountainSpecific && shouldAddLongRunSteadyFinish(normalized, weekNumber);
  const title = cutback
    ? "Cutback long run"
    : taper
      ? "Taper long run"
      : mountainSpecific
        ? "Mountain long run time-on-feet"
        : hasSteadyFinish
          ? "Long run with steady finish"
          : "Long aerobic run";

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "long_run" as const,
    source_workout_type: cutback
      ? "cutback_long_run"
      : taper
        ? "taper_long_run"
        : mountainSpecific
          ? "mountain_long_run_time_on_feet"
          : hasSteadyFinish
            ? "long_run_with_steady_finish"
            : "long_aerobic_run",
    title,
    summary: buildLongRunSummary(
      normalized,
      distanceKm,
      durationMin,
      cutback,
      taper,
      hasSteadyFinish,
    ),
    planned_rpe: 5,
    segments: buildLongRunSegments({
      workoutId,
      normalized,
      distanceKm,
      durationMin,
      cutback,
      taper,
      hasSteadyFinish,
    }),
  };
}

function buildLongRunSummary(
  normalized: NormalizedStructuredInput,
  distanceKm: number,
  durationMin: number,
  cutback: boolean,
  taper: boolean,
  hasSteadyFinish: boolean,
) {
  const loadLabel = normalized.runnerProfile.baselineLongRunKm
    ? `${distanceKm} km`
    : `${durationMin} min`;

  if (cutback) {
    return `${loadLabel} lower-load long run to absorb the block.`;
  }

  if (taper) {
    return `${loadLabel} reduced long run to freshen up before the goal.`;
  }

  if (isMountainSpecificPlan(normalized)) {
    return `${loadLabel} mountain time-on-feet run with controlled climbing, careful descents, and hike/run allowed on steep sections.`;
  }

  if (hasSteadyFinish) {
    return `${loadLabel} long run with an easy base and a controlled steady finish.`;
  }

  return `${loadLabel} long aerobic run.`;
}

function buildLongRunSegments({
  workoutId,
  normalized,
  distanceKm,
  durationMin,
  cutback,
  taper,
  hasSteadyFinish,
}: {
  workoutId: string;
  normalized: NormalizedStructuredInput;
  distanceKm: number;
  durationMin: number;
  cutback: boolean;
  taper: boolean;
  hasSteadyFinish: boolean;
}) {
  if (!hasSteadyFinish) {
    return [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: cutback
          ? "Cutback long aerobic running"
          : taper
            ? "Reduced taper long running"
            : isMountainSpecificPlan(normalized)
              ? "Mountain time-on-feet running"
              : "Long aerobic running",
        guidance: buildLongRunGuidance(normalized, cutback, taper),
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
    ];
  }

  if (normalized.runnerProfile.baselineLongRunKm) {
    const steadyFinishDistanceKm = Number(Math.max(1, distanceKm * 0.22).toFixed(1));
    const baseDistanceKm = Number(Math.max(1, distanceKm - steadyFinishDistanceKm).toFixed(1));

    return [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Easy long-run base",
        guidance: buildLongRunGuidance(normalized, false, false),
        prescription: {
          mode: "distance" as const,
          distance_km: baseDistanceKm,
        },
        distance_km: baseDistanceKm,
        target: buildLongRunTarget(normalized),
      },
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "main" as const,
        label: "Controlled steady finish",
        guidance: "Gently lift the effort late, but keep it sustainable and relaxed.",
        prescription: {
          mode: "distance" as const,
          distance_km: steadyFinishDistanceKm,
        },
        distance_km: steadyFinishDistanceKm,
        target: buildSteadyFinishTarget(normalized),
      },
    ];
  }

  const steadyFinishDurationMin = roundToFive(Math.min(25, Math.max(10, durationMin * 0.22)));
  const baseDurationMin = Math.max(25, durationMin - steadyFinishDurationMin);

  return [
    {
      segment_id: `${workoutId}_seg_1`,
      sequence: 1,
      segment_type: "main" as const,
      label: "Easy long-run base",
      guidance: buildLongRunGuidance(normalized, false, false),
      prescription: {
        mode: "time" as const,
        duration_min: baseDurationMin,
      },
      duration_min: baseDurationMin,
      target: buildLongRunTarget(normalized),
    },
    {
      segment_id: `${workoutId}_seg_2`,
      sequence: 2,
      segment_type: "main" as const,
      label: "Controlled steady finish",
      guidance: "Gently lift the effort late, but keep it sustainable and relaxed.",
      prescription: {
        mode: "time" as const,
        duration_min: steadyFinishDurationMin,
      },
      duration_min: steadyFinishDurationMin,
      target: buildSteadyFinishTarget(normalized),
    },
  ];
}

function buildQualityWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  if (isCutbackWeek(weekNumber, normalized)) {
    return buildCutbackAerobicWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (isMountainSpecificPlan(normalized)) {
    return buildMountainQualityWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (phase === "Taper") {
    return buildTaperTuneupWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (phase === "Base") {
    if (shouldUseBaseStrides(normalized)) {
      return buildAerobicStridesWorkout({
        workoutId,
        date,
        weekday,
        weekNumber,
        phase,
        normalized,
      });
    }

    if (normalized.preferences.terrainFocus === "rolling" && weekNumber % 2 === 0) {
      return buildRollingHillsWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
    }

    return buildSteadyWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  const goalFamilyWorkout = buildGoalFamilyQualityWorkout({
    workoutId,
    date,
    weekday,
    weekNumber,
    phase,
    normalized,
  });

  if (goalFamilyWorkout) {
    return goalFamilyWorkout;
  }

  const workoutPattern = weekNumber % 3;

  if (normalized.preferences.terrainFocus === "rolling" && workoutPattern === 2) {
    return buildRollingHillsWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
  }

  if (phase === "Specific" && shouldUseProgressionSpecificity(normalized, weekNumber)) {
    return buildProgressionWorkout({ workoutId, date, weekday, weekNumber, phase, normalized });
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

function buildGoalFamilyQualityWorkout(context: BuildWorkoutContext) {
  const { normalized } = context;

  switch (normalized.goal.goalType) {
    case "5k":
      return isLimitedSharpeningSupport(normalized)
        ? buildAerobicStridesWorkout(context)
        : buildFiveKSharpeningWorkout(context);
    case "10k":
      return isLimitedSharpeningSupport(normalized)
        ? buildTempoWorkout(context)
        : buildTenKRhythmWorkout(context);
    case "half_marathon":
      return buildHalfMarathonThresholdWorkout(context);
    case "marathon":
      return buildMarathonSteadySpecificityWorkout(context);
    case "ultra_marathon":
      return buildUltraDurabilityWorkout(context);
    default:
      return null;
  }
}

function buildMountainQualityWorkout(context: BuildWorkoutContext) {
  if (context.phase === "Taper") {
    return buildTaperTuneupWorkout(context);
  }

  const pattern = context.weekNumber % 4;

  if (context.phase === "Base") {
    return pattern === 0
      ? buildRollingHillsWorkout(context)
      : buildTechnicalTrailEasyWorkout(context);
  }

  if (context.phase === "Build") {
    if (pattern === 0) return buildControlledDownhillDurabilityWorkout(context);
    if (pattern === 1) return buildHillRepeatsWorkout(context);
    if (pattern === 2) return buildRollingHillsWorkout(context);
    return buildClimbingSteadyWorkout(context);
  }

  if (pattern === 0) return buildHikeRunEnduranceWorkout(context);
  if (pattern === 1) return buildControlledDownhillDurabilityWorkout(context);
  if (pattern === 2) return buildClimbingSteadyWorkout(context);
  return buildHillRepeatsWorkout(context);
}

function buildCutbackAerobicWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = Math.max(25, deriveEasyDurationMin(normalized, weekNumber) - 10);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: "cutback_aerobic_run",
    title: "Cutback aerobic run",
    summary: `${durationMin} min deliberately easy aerobic running for a lower-load week.`,
    planned_rpe: 4,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Reduced aerobic running",
        guidance:
          "Keep this intentionally easy so the week absorbs training instead of adding a new stressor.",
        prescription: {
          mode: "time" as const,
          duration_min: durationMin,
        },
        target: buildEasyTarget(normalized),
      },
    ],
  };
}

function buildTaperTuneupWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = Math.max(25, deriveEasyDurationMin(normalized, weekNumber) - 5);
  const paceTargets = deriveBenchmarkPaceTargets(normalized);
  const mountainSpecific = isMountainSpecificPlan(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: "taper_tuneup_run",
    title: mountainSpecific ? "Mountain taper tune-up run" : "Taper tune-up run",
    summary: mountainSpecific
      ? `${durationMin} min easy tune-up that reduces terrain stress and keeps descents gentle.`
      : `${durationMin} min easy run with a short controlled lift to stay sharp.`,
    planned_rpe: 4,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Easy taper running",
        guidance: mountainSpecific
          ? "Stay fresh. Use smooth, low-risk terrain and avoid hard climbing or technical descent stress."
          : "Stay fresh. Add only a short controlled lift if the legs feel good.",
        prescription: {
          mode: "time" as const,
          duration_min: durationMin,
        },
        target: {
          intensity: "easy_with_short_lift",
          ...(paceTargets?.easy ? { pace_min_per_km_range: paceTargets.easy } : {}),
          cue: mountainSpecific
            ? "Light and relaxed; preserve freshness over terrain specificity."
            : "Light, relaxed, and never forced.",
        },
      },
    ],
  };
}

function buildProgressionWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = deriveEasyDurationMin(normalized, weekNumber) + 5;
  const steadyFinishDurationMin = Math.min(20, Math.max(10, roundToFive(durationMin * 0.3)));
  const baseDurationMin = Math.max(20, durationMin - steadyFinishDurationMin);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "progression" as const,
    source_workout_type: "progression_run",
    title: "Progression run",
    summary: `${durationMin} min starting easy and finishing controlled steady.`,
    planned_rpe: 6,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Easy opening",
        guidance: "Start deliberately comfortable and keep the first part patient.",
        prescription: {
          mode: "time" as const,
          duration_min: baseDurationMin,
        },
        duration_min: baseDurationMin,
        target: buildEasyTarget(normalized),
      },
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "main" as const,
        label: "Controlled progression finish",
        guidance: "Lift toward steady effort without turning it into a race.",
        prescription: {
          mode: "time" as const,
          duration_min: steadyFinishDurationMin,
        },
        duration_min: steadyFinishDurationMin,
        target: buildSteadyFinishTarget(normalized),
      },
    ],
  };
}

function buildAerobicStridesWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const easyDurationMin = Math.max(25, deriveEasyDurationMin(normalized, weekNumber) - 5);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: "aerobic_strides",
    title: "Easy run with relaxed strides",
    summary: `${easyDurationMin} min easy running with short relaxed strides for safe leg speed.`,
    planned_rpe: 5,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Easy aerobic running",
        guidance: "Keep the run conversational before the strides.",
        prescription: {
          mode: "time" as const,
          duration_min: easyDurationMin,
        },
        target: buildEasyTarget(normalized),
      },
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: "Relaxed strides",
        guidance:
          "Run quick but smooth for a few short strides. Stop while they still feel relaxed.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: isLimitedSharpeningSupport(normalized) ? 4 : 6,
          repeat_unit: {
            mode: "time" as const,
            duration_min: 0.5,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 1.5,
          },
        },
        target: {
          intensity: "relaxed_strides",
          cue: "Fast-feeling, light, and never sprinting.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
    ],
  };
}

function buildFiveKSharpeningWorkout({
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
    source_workout_type: "5k_sharpening_repeats",
    title: "5K sharpening repeats",
    summary: `${repeatCount} short controlled reps for 5K rhythm without sprinting.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} short 5K-rhythm reps`,
        guidance:
          "Keep the reps quick and coordinated. The goal is rhythm and repeatability, not an all-out finish.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "distance" as const,
            distance_km: 0.2,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "5k_sharpening",
          ...(paceTargets?.interval ? { pace_min_per_km_range: paceTargets.interval } : {}),
          cue: "Controlled faster running; smooth, repeatable, and never sprinting.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

function buildTenKRhythmWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = Math.min(6, 3 + Math.floor((weekNumber - 1) / 4));
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality" as const,
    source_workout_type: "10k_rhythm_intervals",
    title: "10K rhythm intervals",
    summary: `${repeatCount} controlled rhythm reps for sustained 10K-style quality.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} rhythm reps`,
        guidance:
          "Settle into a strong but controlled rhythm. Each rep should feel sustainable enough to repeat.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time" as const,
            duration_min: 4,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "10k_rhythm",
          ...(paceTargets?.tempo ? { pace_min_per_km_range: paceTargets.tempo } : {}),
          cue: "Rhythmic sustained quality, controlled rather than forced.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

function buildHalfMarathonThresholdWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = phase === "Specific" ? 3 : 2;
  const blockDurationMin = Math.min(12, 8 + Math.floor((weekNumber - 1) / 5) * 2);
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "tempo" as const,
    source_workout_type: "half_marathon_threshold_durability",
    title: "Half marathon threshold durability",
    summary: `${repeatCount} controlled threshold blocks to build sustained aerobic strength.`,
    planned_rpe: 7,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} threshold blocks`,
        guidance:
          "Stay comfortably hard and even. This should build steady durability, not leave you depleted.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time" as const,
            duration_min: blockDurationMin,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 3,
          },
        },
        target: {
          intensity: "threshold_steady",
          ...(paceTargets?.tempo ? { pace_min_per_km_range: paceTargets.tempo } : {}),
          cue: "Sustained and controlled, with enough restraint to finish strong.",
        },
        recovery_target: buildRepeatRecoveryTarget(normalized),
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

function buildMarathonSteadySpecificityWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const steadyDurationMin = Math.min(45, 22 + Math.floor((weekNumber - 1) / 3) * 4);
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    source_workout_type: "marathon_steady_specificity",
    title: "Marathon steady specificity",
    summary: `${steadyDurationMin} min controlled steady running for marathon-specific durability.`,
    planned_rpe: 6,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "main" as const,
        label: "Controlled marathon-steady running",
        guidance:
          "Hold a sustainable steady rhythm. If you already use a fueling routine, keep it familiar and simple on longer steady days.",
        prescription: {
          mode: "time" as const,
          duration_min: steadyDurationMin,
        },
        duration_min: steadyDurationMin,
        target: {
          intensity: "marathon_steady",
          ...(paceTargets?.steady ? { pace_min_per_km_range: paceTargets.steady } : {}),
          cue: "Steady, patient, and controlled; never a time trial.",
        },
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

function buildUltraDurabilityWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = Math.max(50, deriveEasyDurationMin(normalized, weekNumber) + 15);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    source_workout_type: "ultra_time_on_feet_durability",
    title: "Ultra time-on-feet durability",
    summary: `${durationMin} min aerobic durability session with patient effort and hike/run allowance.`,
    planned_rpe: 5,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Ultra durability running",
        guidance:
          "Keep the full session aerobic. Use short hike breaks on steeper terrain or fatigue, and protect the next day's recovery.",
        prescription: {
          mode: "time" as const,
          duration_min: durationMin,
        },
        target: {
          intensity: "easy_time_on_feet",
          cue: "Durability and patience matter more than road-race speed.",
        },
      },
    ],
  };
}

function buildTechnicalTrailEasyWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = deriveEasyDurationMin(normalized, weekNumber);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "easy" as const,
    source_workout_type: "technical_trail_easy",
    title: "Technical trail easy run",
    summary: `${durationMin} min easy trail exposure with cautious footing and no risky terrain requirement.`,
    planned_rpe: 4,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Low-risk trail exposure",
        guidance:
          "Use forgiving trail or uneven ground if available. Keep effort easy, shorten stride, and skip technical sections that feel risky.",
        prescription: {
          mode: "time" as const,
          duration_min: durationMin,
        },
        target: {
          ...buildEasyTarget(normalized),
          cue: "Easy effort with relaxed footing awareness; no exact elevation target.",
        },
      },
    ],
  };
}

function buildControlledDownhillDurabilityWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const repeatCount = Math.min(8, 4 + Math.floor((weekNumber - 1) / 4));

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "quality" as const,
    source_workout_type: "controlled_downhill_durability",
    title: "Controlled downhill durability",
    summary: `${repeatCount} short controlled descents for careful downhill durability, with easy recovery.`,
    planned_rpe: 6,
    segments: [
      buildWarmupSegment(workoutId, 1, 12, normalized),
      {
        segment_id: `${workoutId}_seg_2`,
        sequence: 2,
        segment_type: "interval_block" as const,
        label: `${repeatCount} controlled descents`,
        guidance:
          "Use a gentle grade only. Descend smoothly under control, keep steps quick, and stop the descent work if footing is uncertain.",
        prescription: {
          mode: "repeats" as const,
          repeat_count: repeatCount,
          repeat_unit: {
            mode: "time" as const,
            duration_min: 1,
          },
          recovery_unit: {
            mode: "time" as const,
            duration_min: 2,
          },
        },
        target: {
          intensity: "controlled_downhill_durability",
          cue: "Controlled descent skill and eccentric durability; never reckless downhill racing.",
        },
        recovery_target: {
          intensity: "very_easy_recovery",
          hint: "Walk or jog easily on flat or uphill ground before the next descent.",
        },
      },
      buildCooldownSegment(workoutId, 3, 10, normalized),
    ],
  };
}

function buildHikeRunEnduranceWorkout({
  workoutId,
  date,
  weekday,
  weekNumber,
  phase,
  normalized,
}: BuildWorkoutContext) {
  const durationMin = Math.max(45, deriveEasyDurationMin(normalized, weekNumber) + 20);

  return {
    workout_id: workoutId,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "steady_or_easy" as const,
    source_workout_type: "hike_run_endurance",
    title: "Hike-run endurance",
    summary: `${durationMin} min time-on-feet session using easy running plus power-hike breaks on steeper climbs.`,
    planned_rpe: 5,
    segments: [
      {
        segment_id: `${workoutId}_seg_1`,
        sequence: 1,
        segment_type: "main" as const,
        label: "Mountain hike-run endurance",
        guidance:
          "Keep the whole session aerobic. Power-hike steep climbs, run gentle terrain easily, and descend with control rather than speed.",
        prescription: {
          mode: "time" as const,
          duration_min: durationMin,
        },
        target: {
          intensity: "easy_time_on_feet",
          cue: "Time on feet matters more than pace; use effort control on climbs and descents.",
        },
      },
    ],
  };
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
    source_workout_type: "rolling_hills_session",
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
    source_workout_type: "uphill_repeats",
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
    source_workout_type: "climbing_steady_run",
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
    source_workout_type: "controlled_tempo_session",
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
    source_workout_type: "distance_intervals",
    title: "Distance intervals",
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
    source_workout_type: "time_intervals",
    title: "Time intervals",
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
    ...(paceTargets?.easy ? { pace_min_per_km_range: paceTargets.easy } : {}),
    cue: buildEasyCue(normalized),
  };
}

function buildLongRunTarget(normalized: NormalizedStructuredInput) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    intensity: "easy_aerobic",
    ...(paceTargets?.longRun ? { pace_min_per_km_range: paceTargets.longRun } : {}),
    cue: buildLongRunCue(normalized),
  };
}

function buildLongRunCue(normalized: NormalizedStructuredInput) {
  if (isMountainSpecificPlan(normalized)) {
    return "Time-on-feet effort: climb patiently, power-hike steep sections, and descend under control.";
  }

  if (normalized.goal.goalType === "marathon") {
    return "Comfortable marathon durability: patient rhythm, familiar fueling routine if used, and no forced finish.";
  }

  if (normalized.goal.goalType === "ultra_marathon") {
    return "Patient time-on-feet durability; short hike breaks are allowed when they protect the full session.";
  }

  if (normalized.goal.goalType === "half_marathon") {
    return "Controlled endurance with enough restraint to finish steady.";
  }

  return "Comfortable enough to keep the full run controlled.";
}

function buildSteadyFinishTarget(normalized: NormalizedStructuredInput) {
  const paceTargets = deriveBenchmarkPaceTargets(normalized);

  return {
    intensity: "steady_finish",
    ...(paceTargets?.steady ? { pace_min_per_km_range: paceTargets.steady } : {}),
    cue: "Slightly stronger than easy, never a race finish.",
  };
}

function deriveBenchmarkPaceTargets(normalized: NormalizedStructuredInput) {
  const metricMode = resolveStructuredMetricMode(normalized);
  const recent5kPaceSecondsPerKm = metricMode.recent5kPaceSecondsPerKm;

  if (!metricMode.paceTargetsAllowed || !recent5kPaceSecondsPerKm) {
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

function resolveStructuredMetricMode(normalized: NormalizedStructuredInput): StructuredMetricMode {
  const recent5kPaceSecondsPerKm = getRecent5kPaceSecondsPerKm(normalized);
  const canFollowNumericTargets = normalized.execution.watchAccess === "watch_or_app";
  const wantsPaceTargets =
    normalized.execution.guidancePreference === "pace" ||
    normalized.execution.guidancePreference === "mixed";

  return {
    paceTargetsAllowed: Boolean(
      canFollowNumericTargets && wantsPaceTargets && recent5kPaceSecondsPerKm,
    ),
    heartRateTargetsAllowed: false,
    recent5kPaceSecondsPerKm,
  };
}

function buildEasyCue(normalized: NormalizedStructuredInput) {
  if (normalized.execution.guidancePreference === "heart_rate") {
    return "Use easy effort for now; no heart-rate zone target is available yet.";
  }

  return "Conversational effort throughout.";
}

function getRecent5kPaceSecondsPerKm(normalized: NormalizedStructuredInput) {
  return getRecent5kPaceSecondsPerKmFromCurrentLevel(normalized.currentLevel);
}

function hasUsableRecent5kBenchmark(normalized: StructuredPlanAuthoringInput) {
  return Boolean(getRecent5kPaceSecondsPerKmFromCurrentLevel(normalized.currentLevel));
}

function getRecent5kPaceSecondsPerKmFromCurrentLevel(
  currentLevel: StructuredPlanAuthoringInput["currentLevel"],
) {
  if (currentLevel.recent5kPaceSecondsPerKm) {
    return currentLevel.recent5kPaceSecondsPerKm;
  }

  const recent5k = currentLevel.recentRaceResults.find((result) =>
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

function buildLongRunGuidance(
  normalized: NormalizedStructuredInput,
  cutback: boolean,
  taper: boolean,
) {
  if (cutback) {
    return isMountainSpecificPlan(normalized)
      ? "Keep this deliberately comfortable and choose lower-stress terrain than the surrounding mountain long runs."
      : "Keep this deliberately comfortable and shorter than the surrounding long runs.";
  }

  if (taper) {
    return isMountainSpecificPlan(normalized)
      ? "Keep this reduced and confidence-building; avoid technical descent stress and finish fresher than you started."
      : "Keep this reduced and confidence-building; finish fresher than you started.";
  }

  if (isMountainSpecificPlan(normalized)) {
    return "Use time on feet as the anchor. Run gentle terrain easily, power-hike steeper climbs, descend smoothly under control, and avoid exact elevation targets.";
  }

  if (normalized.goal.goalType === "marathon") {
    return "Keep the effort patient and steady. Use longer runs for time-on-feet durability and a familiar fueling routine if you already have one.";
  }

  if (normalized.goal.goalType === "ultra_marathon") {
    return "Use time on feet as the anchor. Keep the session aerobic, add short hike breaks when useful, and protect recovery for the next run.";
  }

  if (normalized.goal.goalType === "half_marathon") {
    return "Keep this comfortable but purposeful so it builds steady durability without becoming a race effort.";
  }

  if (normalized.preferences.terrainFocus === "rolling") {
    return "Keep the effort comfortable and let mild rolling terrain be part of the run when available.";
  }

  return "Keep the effort comfortable enough to finish feeling in control.";
}

function isCutbackWeek(weekNumber: number, normalized: NormalizedStructuredInput) {
  return weekNumber > 1 && weekNumber < normalized.schedule.horizonWeeks && weekNumber % 4 === 0;
}

function isMountainSpecificPlan(normalized: NormalizedStructuredInput) {
  return (
    normalized.goal.goalType === "mountain_running" ||
    normalized.preferences.terrainFocus === "mountain"
  );
}

function shouldUseProgressionSpecificity(
  normalized: NormalizedStructuredInput,
  weekNumber: number,
) {
  if (weekNumber <= Math.ceil(normalized.schedule.horizonWeeks * 0.55)) return false;

  return (
    normalized.preferences.preferredWorkoutMix === "long_run_focus" ||
    ["half_marathon", "marathon", "ultra_marathon"].includes(normalized.goal.goalType)
  );
}

function shouldUseBaseStrides(normalized: NormalizedStructuredInput) {
  if (normalized.preferences.preferredWorkoutMix === "easy_heavy") {
    return false;
  }

  return ["5k", "10k"].includes(normalized.goal.goalType);
}

function isLimitedSharpeningSupport(normalized: NormalizedStructuredInput) {
  if (normalized.runnerProfile.baselineSessionsPerWeek <= 3) return true;
  if (normalized.runnerProfile.experienceLevel === "new_runner") return true;
  if (normalized.runnerProfile.age && normalized.runnerProfile.age >= 60) return true;

  return !getRecent5kPaceSecondsPerKm(normalized);
}

function shouldAddLongRunSteadyFinish(normalized: NormalizedStructuredInput, weekNumber: number) {
  if (isCutbackWeek(weekNumber, normalized)) return false;
  if (weekNumber <= Math.ceil(normalized.schedule.horizonWeeks * 0.5)) return false;
  if (phaseForWeek(weekNumber, normalized.schedule.horizonWeeks) === "Taper") return false;
  if (normalized.runnerProfile.baselineSessionsPerWeek < 4) return false;
  if (normalized.preferences.preferredWorkoutMix === "easy_heavy") return false;

  return (
    normalized.preferences.preferredWorkoutMix === "long_run_focus" ||
    ["half_marathon", "marathon", "ultra_marathon", "mountain_running"].includes(
      normalized.goal.goalType,
    )
  );
}

function deriveEasyDurationMin(normalized: NormalizedStructuredInput, weekNumber: number) {
  const base =
    normalized.runnerProfile.baselineLongRunDurationMin ??
    normalized.runnerProfile.baselineLongRunKm! * 6;
  const ageAdjustment = normalized.runnerProfile.age && normalized.runnerProfile.age >= 60 ? -5 : 0;
  const frequencyAdjustment =
    normalized.runnerProfile.baselineSessionsPerWeek >= 5
      ? 5
      : normalized.runnerProfile.baselineSessionsPerWeek <= 2
        ? -5
        : 0;
  const progression = Math.min(18, Math.floor((weekNumber - 1) / 3) * 4);

  return roundToFive(Math.max(25, base * 0.52 + progression + ageAdjustment + frequencyAdjustment));
}

function deriveLongRunDistanceKm(normalized: NormalizedStructuredInput, weekNumber: number) {
  const policy = longRunGoalPolicies[normalized.goal.goalType];
  const baseline =
    normalized.runnerProfile.baselineLongRunKm ??
    Number(((normalized.runnerProfile.baselineLongRunDurationMin ?? 60) / 7).toFixed(1));
  const startDistance = Math.max(policy.floorKm, Math.min(baseline, policy.peakKm * 0.72));
  const peakDistance = deriveLongRunPeakDistanceKm(normalized, policy, startDistance);
  const taperStartWeek = firstTaperWeek(normalized.schedule.horizonWeeks);
  const progressionEndWeek = Math.max(1, taperStartWeek - 1);

  if (weekNumber >= taperStartWeek) {
    return deriveTaperLongRunDistanceKm({
      normalized,
      policy,
      startDistance,
      peakDistance,
      taperStartWeek,
      weekNumber,
      progressionEndWeek,
    });
  }

  return deriveProgressiveLongRunDistanceKm({
    normalized,
    policy,
    startDistance,
    peakDistance,
    progressionEndWeek,
    weekNumber,
  });
}

function deriveProgressiveLongRunDistanceKm({
  normalized,
  policy,
  startDistance,
  peakDistance,
  progressionEndWeek,
  weekNumber,
}: {
  normalized: NormalizedStructuredInput;
  policy: LongRunGoalPolicy;
  startDistance: number;
  peakDistance: number;
  progressionEndWeek: number;
  weekNumber: number;
}) {
  const progressRatio =
    progressionEndWeek <= 1 ? 1 : Math.min(1, (weekNumber - 1) / (progressionEndWeek - 1));
  const progressionCurve = Math.pow(progressRatio, 0.85);
  const rawDistance = startDistance + (peakDistance - startDistance) * progressionCurve;
  const cutbackDistance = isCutbackWeek(weekNumber, normalized)
    ? Math.max(policy.floorKm, rawDistance * 0.82)
    : rawDistance;

  return Number(Math.min(policy.ceilingKm, cutbackDistance).toFixed(1));
}

function deriveTaperLongRunDistanceKm({
  normalized,
  policy,
  startDistance,
  peakDistance,
  taperStartWeek,
  weekNumber,
  progressionEndWeek,
}: {
  normalized: NormalizedStructuredInput;
  policy: LongRunGoalPolicy;
  startDistance: number;
  peakDistance: number;
  taperStartWeek: number;
  weekNumber: number;
  progressionEndWeek: number;
}) {
  const preTaperDistances = Array.from({ length: Math.max(1, taperStartWeek - 1) }, (_, index) =>
    deriveProgressiveLongRunDistanceKm({
      normalized,
      policy,
      startDistance,
      peakDistance,
      progressionEndWeek,
      weekNumber: index + 1,
    }),
  );
  const preTaperPeakDistance = Math.max(...preTaperDistances);
  const taperWeekCount = normalized.schedule.horizonWeeks - taperStartWeek + 1;
  const taperProgress =
    taperWeekCount <= 1 ? 1 : (weekNumber - taperStartWeek) / (taperWeekCount - 1);
  const firstTaperFactor = taperWeekCount <= 1 ? 0.65 : 0.76;
  const finalTaperFactor = 0.55;
  const taperFactor =
    firstTaperFactor + (finalTaperFactor - firstTaperFactor) * Math.min(1, taperProgress);
  const taperDistance = Math.max(policy.floorKm, preTaperPeakDistance * taperFactor);
  const reductionCap = Math.max(
    policy.floorKm,
    preTaperPeakDistance - Math.max(1, preTaperPeakDistance * 0.08),
  );

  return Number(Math.min(policy.ceilingKm, taperDistance, reductionCap).toFixed(1));
}

function deriveLongRunDurationMin(
  normalized: NormalizedStructuredInput,
  weekNumber: number,
  distanceKm: number,
) {
  if (normalized.runnerProfile.baselineLongRunDurationMin) {
    return roundToFive(Math.max(40, distanceKm * 6.8));
  }

  return roundToFive(distanceKm * 6.5);
}

function deriveLongRunPeakDistanceKm(
  normalized: NormalizedStructuredInput,
  policy: LongRunGoalPolicy,
  startDistance: number,
) {
  const frequency = normalized.runnerProfile.baselineSessionsPerWeek;
  const age = normalized.runnerProfile.age ?? null;
  const hasBenchmark = Boolean(getRecent5kPaceSecondsPerKm(normalized));
  const highAmbition = isHighAmbitionPlan(normalized);
  const shortHorizonPenalty =
    normalized.schedule.horizonWeeks < 10
      ? 4
      : normalized.schedule.horizonWeeks < 14 &&
          ["marathon", "ultra_marathon"].includes(normalized.goal.goalType)
        ? 2
        : 0;
  const frequencyAdjustment = frequency >= 5 ? 2 : frequency <= 3 ? -4 : 0;
  const experienceAdjustment =
    normalized.runnerProfile.experienceLevel === "experienced_runner"
      ? 1.5
      : normalized.runnerProfile.experienceLevel === "new_runner"
        ? -3
        : 0;
  const ageAdjustment = age && age >= 65 ? -4 : age && age >= 55 ? -2 : 0;
  const ambitionAdjustment = highAmbition && hasBenchmark && frequency >= 4 ? 1.5 : 0;
  const unsupportedTargetAdjustment = highAmbition && !hasBenchmark ? -1.5 : 0;
  const peak =
    policy.peakKm +
    frequencyAdjustment +
    experienceAdjustment +
    ageAdjustment +
    ambitionAdjustment +
    unsupportedTargetAdjustment -
    shortHorizonPenalty;

  return Math.min(policy.ceilingKm, Math.max(startDistance + 2, peak));
}

function isHighAmbitionPlan(normalized: NormalizedStructuredInput) {
  return (
    normalized.preferences.preferredWorkoutMix === "long_run_focus" ||
    normalized.constraints.hardConstraints.some((constraint) => /target time/i.test(constraint))
  );
}

function shouldAvoidQuality(normalized: StructuredPlanAuthoringInput) {
  if (shouldCapBuildConsistencyQuality(normalized)) {
    return true;
  }

  if (normalized.runnerProfile.baselineSessionsPerWeek < 3) {
    return true;
  }

  if (
    normalized.runnerProfile.experienceLevel === "new_runner" &&
    !normalized.currentLevel.recent5kPaceSecondsPerKm
  ) {
    return true;
  }

  if (
    normalized.runnerProfile.age &&
    normalized.runnerProfile.age >= 65 &&
    !normalized.currentLevel.recent5kPaceSecondsPerKm
  ) {
    return true;
  }

  return [
    ...normalized.constraints.injuryConstraints,
    ...normalized.constraints.hardConstraints,
  ].some((value) => /avoid speed|no speed|avoid intensity|no intensity|injury/i.test(value));
}

function shouldCapBuildConsistencyQuality(normalized: StructuredPlanAuthoringInput) {
  if (normalized.goal.goalType !== "build_consistency") {
    return false;
  }

  if (normalized.runnerProfile.experienceLevel === "new_runner") {
    return true;
  }

  if (
    normalized.runnerProfile.baselineSessionsPerWeek <= 3 ||
    normalized.availability.maxRunningDaysPerWeek <= 3
  ) {
    return true;
  }

  return !hasUsableRecent5kBenchmark(normalized) && !hasTargetTimePressure(normalized);
}

function hasTargetTimePressure(normalized: StructuredPlanAuthoringInput) {
  return normalized.constraints.hardConstraints.some((constraint) =>
    /target time/i.test(constraint),
  );
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

function phaseForWeek(weekNumber: number, horizonWeeks: number): TrainingPhase {
  if (horizonWeeks <= 1) {
    return "Base";
  }

  if (horizonWeeks <= 2) {
    return weekNumber === horizonWeeks ? "Taper" : "Base";
  }

  const progress = weekNumber / horizonWeeks;

  if (progress <= 0.3) {
    return "Base";
  }

  if (progress <= 0.65) {
    return "Build";
  }

  if (progress <= 0.88) {
    return "Specific";
  }

  return "Taper";
}

function firstTaperWeek(horizonWeeks: number) {
  for (let week = 1; week <= horizonWeeks; week += 1) {
    if (phaseForWeek(week, horizonWeeks) === "Taper") {
      return week;
    }
  }

  return horizonWeeks + 1;
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
  phase: TrainingPhase;
  normalized: NormalizedStructuredInput;
}
