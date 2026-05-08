import { z } from "zod";
import { stepPlannedDistanceKm, stepPlannedDurationMin } from "@/lib/training";
import type {
  RunnerProfileSummary,
  Step,
  StepPrescription,
  StepTarget,
  StepUnitPrescription,
  WorkoutType,
} from "@/lib/training";

export const LEGACY_IMPORT_ROOT_KEYS = [
  "plan_name",
  "generated_for",
  "start_date",
  "week_1_preview[]",
] as const;

export const LEGACY_IMPORT_ITEM_KEYS = ["date", "weekday", "workout", "details", "target"] as const;

export const FUTURE_TEMPLATE_VERSION = "training-plan-v2";
export const FUTURE_TEMPLATE_DOWNLOAD_PATH = "/templates/hito-training-plan-v2-template.json";

export const V2_IMPORT_ROOT_KEYS = [
  "schema_version",
  "plan_id",
  "plan_name",
  "source_kind",
  "created_at",
  "generated_for",
  "goal",
  "runner_profile",
  "start_date",
  "preparation_horizon_weeks",
  "preparation_horizon_months",
  "target_date",
  "plan_preferences",
  "planned_workouts[]",
] as const;

export const V2_IGNORED_WORKOUT_KEYS = [
  "status",
  "completion_state",
  "ai_adjustable",
  "garmin_sync_placeholder",
  "strava_sync_placeholder",
  "user_feedback_placeholder",
  "pain_tracking_placeholder",
] as const;

const targetValueSchema = z.union([z.string(), z.number()]);

const v2TargetSchema = z
  .object({
    intensity: z.string().trim().min(1).optional(),
    hr_bpm_range: z.string().trim().min(1).optional(),
    hr_bpm: z.string().trim().min(1).optional(),
    pace_min_per_km_range: z.string().trim().min(1).optional(),
    pace_range_min_km: z.string().trim().min(1).optional(),
    pace: z.string().trim().min(1).optional(),
    rpe: targetValueSchema.optional(),
    cadence_spm_range: z.string().trim().min(1).optional(),
    cue: z.string().trim().min(1).optional(),
    hint: z.string().trim().min(1).optional(),
    extra: z.record(z.string(), targetValueSchema).optional(),
  })
  .catchall(targetValueSchema);

export const importedPlanWorkoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekday: z.string().trim().min(1),
  workout: z.string().trim().min(1),
  details: z.string().trim().min(1),
  target: z.string().trim().nullable(),
});

export const legacyImportedPlanSchema = z.object({
  plan_name: z.string().trim().min(1),
  generated_for: z.string().trim().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week_1_preview: z.array(importedPlanWorkoutSchema).min(1),
});

const v2RunnerProfileSchema = z
  .object({
    experience_level: z.string().trim().min(1).optional(),
    baseline_sessions_per_week: z.number().int().min(1).max(7).optional(),
    baseline_long_run_km: z.number().positive().optional(),
    baseline_long_run_duration_min: z.number().int().positive().optional(),
    age: z.number().int().min(1).max(120).optional(),
    height_cm: z.number().min(1).max(300).optional(),
    weight_kg: z.number().min(1).max(500).optional(),
    recent_injury_recovery_context: z.string().trim().min(1).optional(),
    preferred_effort_language: z.string().trim().min(1).optional(),
    recent_result_summary: z.string().trim().min(1).optional(),
    current_easy_pace_range: z.string().trim().min(1).optional(),
    current_training_load_summary: z.string().trim().min(1).optional(),
    recent_race_results: z
      .array(
        z
          .object({
            distance: z.string().trim().min(1),
            result_time: z.string().trim().min(1),
            result_date: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

const v2GoalSchema = z
  .object({
    goal_type: z.string().trim().min(1),
    goal_label: z.string().trim().min(1),
    target_event: z
      .object({
        label: z.string().trim().min(1).optional(),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        event_name: z.string().trim().min(1).optional(),
        event_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const v2PlanPreferencesSchema = z
  .object({
    preferred_running_days: z.array(z.string().trim().min(1)).optional(),
    preferred_run_days: z.array(z.string().trim().min(1)).optional(),
    unavailable_days: z.array(z.string().trim().min(1)).optional(),
    blocked_days: z.array(z.string().trim().min(1)).optional(),
    max_weekly_sessions: z.number().int().positive().optional(),
    max_running_days_per_week: z.number().int().positive().optional(),
    no_double_days: z.boolean().optional(),
    allow_back_to_back_days: z.boolean().optional(),
    preferred_long_run_day: z.string().trim().min(1).optional(),
    injury_constraints: z.array(z.string().trim().min(1)).optional(),
    hard_constraints: z.array(z.string().trim().min(1)).optional(),
    preferred_workout_mix: z.string().trim().min(1).optional(),
    strength_or_mobility_interest: z.string().trim().min(1).optional(),
    indoor_treadmill_ok: z.boolean().optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

const v2UnitPrescriptionSchema = z
  .object({
    mode: z.enum(["time", "distance", "none"]),
    duration_min: z.number().int().positive().optional(),
    distance_km: z.number().positive().optional(),
  })
  .strict()
  .superRefine((unit, context) => {
    if (unit.mode === "time" && !unit.duration_min) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["duration_min"],
        message: "time prescription units require duration_min.",
      });
    }

    if (unit.mode === "distance" && !unit.distance_km) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["distance_km"],
        message: "distance prescription units require distance_km.",
      });
    }
  });

const v2SegmentPrescriptionSchema = z
  .object({
    mode: z.enum(["time", "distance", "repeats", "none"]),
    duration_min: z.number().int().positive().optional(),
    distance_km: z.number().positive().optional(),
    repeat_count: z.number().int().positive().optional(),
    repeat_unit: v2UnitPrescriptionSchema.optional(),
    recovery_unit: v2UnitPrescriptionSchema.optional(),
  })
  .strict()
  .superRefine((prescription, context) => {
    if (prescription.mode === "time" && !prescription.duration_min) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["duration_min"],
        message: "time prescriptions require duration_min.",
      });
    }

    if (prescription.mode === "distance" && !prescription.distance_km) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["distance_km"],
        message: "distance prescriptions require distance_km.",
      });
    }

    if (prescription.mode === "repeats") {
      if (!prescription.repeat_count) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["repeat_count"],
          message: "repeat prescriptions require repeat_count.",
        });
      }

      if (!prescription.repeat_unit) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["repeat_unit"],
          message: "repeat prescriptions require repeat_unit.",
        });
      }
    }
  });

const v2SegmentSchema = z
  .object({
    segment_id: z.string().trim().min(1).optional(),
    segment_type: z.enum([
      "warmup",
      "main",
      "cooldown",
      "recovery",
      "rest",
      "mobility",
      "strength",
      "tempo_block",
      "interval_block",
    ]),
    label: z.string().trim().min(1).optional(),
    sequence: z.number().int().min(1).optional(),
    guidance: z.string().trim().min(1).optional(),
    prescription: v2SegmentPrescriptionSchema.optional(),
    duration_min: z.number().int().positive().optional(),
    distance_km: z.number().positive().optional(),
    target: v2TargetSchema.optional(),
    repeat_count: z.number().int().positive().optional(),
    work_distance_km: z.number().positive().optional(),
    recovery_duration_min: z.number().int().positive().optional(),
    recovery_distance_km: z.number().positive().optional(),
    recovery_target: v2TargetSchema.optional(),
  })
  .strict()
  .superRefine((segment, context) => {
    if (segment.prescription) {
      if (segment.segment_type === "interval_block" && segment.prescription.mode !== "repeats") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prescription", "mode"],
          message: "interval_block segments require prescription.mode = repeats.",
        });
      }

      if (segment.segment_type === "rest" && segment.prescription.mode !== "none") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prescription", "mode"],
          message: "rest segments require prescription.mode = none.",
        });
      }

      return;
    }

    if (segment.segment_type === "interval_block") {
      if (!segment.repeat_count) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["repeat_count"],
          message: "repeat_count is required for interval_block segments.",
        });
      }

      if (!segment.work_distance_km && !segment.duration_min) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["work_distance_km"],
          message: "interval_block segments need work_distance_km or duration_min.",
        });
      }

      return;
    }

    if (segment.segment_type === "rest") {
      return;
    }

    if (!segment.duration_min && !segment.distance_km) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["duration_min"],
        message: `${segment.segment_type} segments require duration_min or distance_km.`,
      });
    }
  });

const v2WorkoutSchema = z
  .object({
    workout_id: z.string().trim().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekday: z.string().trim().min(1),
    week_number: z.number().int().min(1),
    phase: z.string().trim().min(1),
    status: z.string().trim().min(1).optional(),
    completion_state: z.string().trim().min(1).optional(),
    ai_adjustable: z.boolean().optional(),
    garmin_sync_placeholder: z.boolean().optional(),
    strava_sync_placeholder: z.boolean().optional(),
    user_feedback_placeholder: z.boolean().optional(),
    pain_tracking_placeholder: z.boolean().optional(),
    segments: z.array(v2SegmentSchema).min(1),
    workout_type: z.enum([
      "easy",
      "steady_or_easy",
      "rest",
      "long_run",
      "quality",
      "tempo",
      "recovery",
    ]),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    planned_rpe: z.number().int().min(1).max(10).optional(),
    estimated_fatigue: z.string().trim().min(1).optional(),
    recovery_priority: z.string().trim().min(1).optional(),
  })
  .strict();

export const trainingPlanV2Schema = z
  .object({
    plan_id: z.string().trim().min(1).optional(),
    schema_version: z.literal(FUTURE_TEMPLATE_VERSION),
    plan_name: z.string().trim().min(1),
    source_kind: z.string().trim().min(1).optional(),
    created_at: z.string().datetime().optional(),
    generated_for: z.string().trim().min(1),
    goal: v2GoalSchema.optional(),
    runner_profile: v2RunnerProfileSchema.optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    preparation_horizon_weeks: z.number().int().positive().optional(),
    preparation_horizon_months: z.number().int().positive().optional(),
    target_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    plan_preferences: v2PlanPreferencesSchema.optional(),
    planned_workouts: z.array(v2WorkoutSchema).min(1),
  })
  .strict();

export const importedPlanSchema = z.union([legacyImportedPlanSchema, trainingPlanV2Schema]);

export type LegacyImportedPlan = z.infer<typeof legacyImportedPlanSchema>;
export type TrainingPlanV2 = z.infer<typeof trainingPlanV2Schema>;
export type ImportedPlan = z.infer<typeof importedPlanSchema>;

export interface ImportedWorkoutSeed {
  workoutDate: string;
  weekday: string;
  weekNumber: number;
  phase: string;
  workoutType: WorkoutType;
  title: string;
  notes: string | null;
  steps: Step[];
  displayOrder: number;
}

export interface ImportedPlanSeed {
  profile: RunnerProfileSummary;
  title: string;
  goalSummary: string;
  sourceTemplate: string;
  startDate: string;
  endDate: string;
  workouts: ImportedWorkoutSeed[];
}

export interface ImportedPlanSummary {
  planName: string;
  generatedFor: string;
  days: number;
  workouts: number;
  format: "legacy" | "training-plan-v2";
}

export function validateImportedPlanJson(raw: string) {
  try {
    const parsedJson = JSON.parse(raw) as unknown;

    if (isV2ImportCandidate(parsedJson)) {
      return trainingPlanV2Schema.safeParse(parsedJson);
    }

    return legacyImportedPlanSchema.safeParse(parsedJson);
  } catch {
    return null;
  }
}

export function summarizeImportedPlan(plan: ImportedPlan): ImportedPlanSummary {
  if (isTrainingPlanV2(plan)) {
    return {
      planName: plan.plan_name,
      generatedFor: plan.generated_for,
      days: plan.planned_workouts.length,
      workouts: plan.planned_workouts.filter((item) => item.workout_type !== "rest").length,
      format: "training-plan-v2",
    };
  }

  return {
    planName: plan.plan_name,
    generatedFor: plan.generated_for,
    days: plan.week_1_preview.length,
    workouts: plan.week_1_preview.filter((item) => !/rest|recovery$/i.test(item.workout)).length,
    format: "legacy",
  };
}

export function buildImportedPlanSeed(plan: ImportedPlan): ImportedPlanSeed {
  if (isTrainingPlanV2(plan)) {
    return buildTrainingPlanV2Seed(plan);
  }

  return buildLegacyImportedPlanSeed(plan);
}

function buildLegacyImportedPlanSeed(plan: LegacyImportedPlan): ImportedPlanSeed {
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

  const profile = buildImportedProfile(plan.plan_name, plan.generated_for, workouts);

  return {
    profile,
    title: plan.plan_name,
    goalSummary: `Imported JSON week for ${plan.generated_for}.`,
    sourceTemplate: "json-import-v1",
    startDate: plan.start_date,
    endDate: workouts.at(-1)?.workoutDate ?? plan.start_date,
    workouts,
  };
}

function buildTrainingPlanV2Seed(plan: TrainingPlanV2): ImportedPlanSeed {
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

  const profile = buildImportedProfile(plan.plan_name, plan.generated_for, workouts, plan);

  return {
    profile,
    title: plan.plan_name,
    goalSummary: buildV2GoalSummary(plan),
    sourceTemplate: FUTURE_TEMPLATE_VERSION,
    startDate: plan.start_date,
    endDate: workouts.at(-1)?.workoutDate ?? plan.start_date,
    workouts,
  };
}

function buildImportedProfile(
  planName: string,
  generatedFor: string,
  workouts: ImportedWorkoutSeed[],
  trainingPlan?: TrainingPlanV2,
): RunnerProfileSummary {
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

function buildV2GoalSummary(plan: TrainingPlanV2) {
  const goalLabel = plan.goal?.goal_label?.trim();

  if (goalLabel) {
    return goalLabel;
  }

  return `Imported ${FUTURE_TEMPLATE_VERSION} plan for ${plan.generated_for}.`;
}

function deriveBaselineSessionsPerWeek(workouts: ImportedWorkoutSeed[]) {
  const countsByWeek = new Map<number, number>();

  for (const workout of workouts) {
    if (workout.workoutType === "rest") {
      continue;
    }

    countsByWeek.set(workout.weekNumber, (countsByWeek.get(workout.weekNumber) ?? 0) + 1);
  }

  return Math.min(7, Math.max(0, ...Array.from(countsByWeek.values())));
}

function inferGoalType(planName: string): RunnerProfileSummary["goalType"] {
  if (/marathon|race/i.test(planName)) {
    return "first_race";
  }

  if (/distance|build/i.test(planName)) {
    return "distance_build";
  }

  return "build_consistency";
}

function deriveRunnerGoalType(
  planName: string,
  trainingPlan?: TrainingPlanV2,
): RunnerProfileSummary["goalType"] {
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

  return inferGoalType(planName);
}

function deriveBaselineLongRunKm(workouts: ImportedWorkoutSeed[], trainingPlan?: TrainingPlanV2) {
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

function buildImportedProfileNotes(generatedFor: string, trainingPlan?: TrainingPlanV2) {
  const notes = [
    trainingPlan?.runner_profile?.recent_result_summary,
    trainingPlan?.runner_profile?.current_training_load_summary,
    trainingPlan?.runner_profile?.recent_injury_recovery_context,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" · ");

  if (notes) {
    return notes;
  }

  return `Imported from JSON for ${generatedFor}.`;
}

function inferLegacyWorkoutType(workout: string): WorkoutType {
  if (/rest|recovery$/i.test(workout)) {
    return "rest";
  }

  if (/interval|tempo|speed|quality/i.test(workout)) {
    return "quality";
  }

  if (/long/i.test(workout)) {
    return "long_run";
  }

  if (/steady/i.test(workout)) {
    return "steady_or_easy";
  }

  return "easy";
}

function normalizeV2WorkoutType(
  workoutType: TrainingPlanV2["planned_workouts"][number]["workout_type"],
): WorkoutType {
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

function buildLegacyNotes(details: string, target: string | null) {
  if (!target) {
    return details;
  }

  return `${details} · Target: ${target}`;
}

function buildV2Notes(workout: TrainingPlanV2["planned_workouts"][number]) {
  if (normalizeV2WorkoutType(workout.workout_type) === "rest") {
    const hint = workout.segments.find((segment) => extractSegmentGuidance(segment))?.guidance;
    return hint ?? workout.summary;
  }

  return workout.summary;
}

function buildLegacySteps(
  workoutType: WorkoutType,
  details: string,
  target: string | null,
): Step[] {
  if (workoutType === "rest") {
    return [];
  }

  const targetPayload = parseLegacyTarget(target);
  const intervalMatch = details.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(m|km)/i);

  if (intervalMatch) {
    const repeats = Number(intervalMatch[1]);
    const workDistanceKm = normalizeDistance(Number(intervalMatch[2]), intervalMatch[3]);
    const targetPayload = parseLegacyTarget(target);
    const prescription: StepPrescription = {
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
  const stepType = workoutType === "quality" ? "run" : "run";
  const segmentType = workoutType === "quality" ? "main" : "main";
  const prescription = durationMatch
    ? ({
        mode: "time",
        duration_min: Number(durationMatch[1]),
      } satisfies StepPrescription)
    : distanceMatch
      ? ({
          mode: "distance",
          distance_km: Number(distanceMatch[1]),
        } satisfies StepPrescription)
      : undefined;

  return [
    {
      segment_id: "legacy-segment-1",
      segment_type: segmentType,
      sequence: 1,
      label: details,
      ...(prescription ? { prescription } : {}),
      type: stepType,
      ...(distanceMatch ? { distance_km: Number(distanceMatch[1]) } : {}),
      ...(durationMatch ? { duration_min: Number(durationMatch[1]) } : {}),
      ...(targetPayload ? { target: targetPayload } : {}),
    },
  ];
}

function normalizeV2Segments(
  segments: TrainingPlanV2["planned_workouts"][number]["segments"],
  workoutType: WorkoutType,
): Step[] {
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

function normalizeV2Segment(
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
  sequence: number,
): Step {
  const target = normalizeSegmentTarget(segment.target);
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
        ...(normalizeSegmentTarget(segment.recovery_target)
          ? { target: normalizeSegmentTarget(segment.recovery_target) }
          : {}),
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

function buildSegmentPrescription(
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
): StepPrescription {
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

function normalizeUnitPrescription(
  unit: TrainingPlanV2["planned_workouts"][number]["segments"][number]["prescription"]["repeat_unit"],
): StepUnitPrescription {
  if (!unit) {
    return {
      mode: "none",
    };
  }

  return {
    mode: unit.mode,
    ...(unit.duration_min ? { duration_min: unit.duration_min } : {}),
    ...(unit.distance_km ? { distance_km: unit.distance_km } : {}),
  };
}

function normalizeSegmentTarget(
  target: TrainingPlanV2["planned_workouts"][number]["segments"][number]["target"] | undefined,
): StepTarget | undefined {
  if (!target) {
    return undefined;
  }

  const extra: Record<string, string | number> = {
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

  const hrRange =
    typeof target.hr_bpm_range === "string"
      ? target.hr_bpm_range
      : typeof target.hr_bpm === "string"
        ? target.hr_bpm
        : undefined;
  const paceRange =
    typeof target.pace_min_per_km_range === "string"
      ? target.pace_min_per_km_range
      : typeof target.pace_range_min_km === "string"
        ? target.pace_range_min_km
        : undefined;

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

function extractSegmentGuidance(
  segment: TrainingPlanV2["planned_workouts"][number]["segments"][number],
) {
  if (segment.guidance) {
    return {
      guidance: segment.guidance,
    };
  }

  if (typeof segment.target?.hint === "string") {
    return {
      guidance: segment.target.hint,
    };
  }

  return {
    guidance: null,
  };
}

function mapSegmentTypeToStepType(segmentType: string) {
  switch (segmentType) {
    case "tempo_block":
      return "tempo";
    case "main":
      return "run";
    default:
      return segmentType;
  }
}

function buildDefaultSegmentLabel(segmentType: string, sequence: number) {
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

function parseLegacyTarget(target: string | null) {
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

function estimateDistanceKm(steps: Step[], workoutType: WorkoutType) {
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

function estimateDurationFromDistanceKm(distanceKm: number, workoutType: WorkoutType) {
  if (!distanceKm) {
    return 0;
  }

  const pace = paceMinutesPerKm(workoutType);

  if (!pace) {
    return 0;
  }

  return Math.round(distanceKm * pace);
}

function paceMinutesPerKm(workoutType: WorkoutType) {
  const paceMap: Record<WorkoutType, number> = {
    easy: 7.0,
    steady_or_easy: 6.6,
    long_run: 6.8,
    quality: 5.8,
    rest: 0,
  };

  return paceMap[workoutType];
}

function normalizeDistance(distance: number, unit: string) {
  return unit.toLowerCase() === "km" ? distance : Number((distance / 1000).toFixed(3));
}

function isV2ImportCandidate(value: unknown): value is { schema_version: string } {
  return Boolean(
    value &&
    typeof value === "object" &&
    "schema_version" in value &&
    typeof value.schema_version === "string",
  );
}

export function isTrainingPlanV2(plan: ImportedPlan): plan is TrainingPlanV2 {
  return "schema_version" in plan && plan.schema_version === FUTURE_TEMPLATE_VERSION;
}
