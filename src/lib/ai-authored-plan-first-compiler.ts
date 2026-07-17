import { z } from "zod";
import {
  FUTURE_TEMPLATE_VERSION,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import {
  canonicalFamilyToLegacyWorkoutType,
  deriveCanonicalMetricMode,
  normalizeWorkoutIdentity,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CalendarIconKey,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import {
  SELECTED_DISTANCE_ENDPOINT_IDENTITY,
  SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND,
} from "@/lib/plan-creation-engine/selected-distance-endpoint";
import { resolveAiAuthoredPlanFirstProviderHorizonWeeks } from "@/lib/ai-authored-plan-first-provider-contract";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring";
import { addDaysIso, startOfWeekIso, weekdayLong } from "@/lib/training";
import type { StepPrescription, StepTarget } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

type NormalizationIssue = { code: string; message: string; path?: string };
type StructuredAuthoringInput = StructuredPlanAuthoringInput;

export const AI_AUTHORED_PLAN_FIRST_SOURCE_KIND = "ai_authored_plan_first_v1" as const;

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isRealIsoDate, "Date must be a real ISO calendar date.");
const nullableStringSchema = z.string().trim().min(1).max(500).nullable();
const positiveNumberSchema = z.number().positive().nullable();
const positiveIntSchema = z.number().int().positive().nullable();

const aiAuthoredPlanFirstUnitSchema = z
  .object({
    duration_min: positiveNumberSchema.optional(),
    duration_sec: positiveNumberSchema.optional(),
    distance_km: positiveNumberSchema.optional(),
    target_pace: nullableStringSchema.optional(),
    target_hr: nullableStringSchema.optional(),
    effort: nullableStringSchema.optional(),
    jog: nullableStringSchema.optional(),
    notes: nullableStringSchema.optional(),
  })
  .strict();

const aiAuthoredPlanFirstBlockSchema = z
  .object({
    repeat: z.number().int().positive(),
    interval: aiAuthoredPlanFirstUnitSchema,
    recovery: aiAuthoredPlanFirstUnitSchema.nullable().optional(),
  })
  .strict();

const aiAuthoredPlanFirstStepSchema = z
  .object({
    phase: z.string().trim().min(1).max(120),
    duration_min: positiveNumberSchema.optional(),
    duration_sec: positiveNumberSchema.optional(),
    distance_km: positiveNumberSchema.optional(),
    target_pace: nullableStringSchema.optional(),
    target_hr: nullableStringSchema.optional(),
    repeat: positiveIntSchema.optional(),
    recovery_sec: positiveNumberSchema.optional(),
    blocks: z.array(aiAuthoredPlanFirstBlockSchema).nullable().optional(),
    notes: nullableStringSchema.optional(),
  })
  .strict();

const aiAuthoredPlanFirstDaySchema = z
  .object({
    type: z.string().trim().min(1).max(160),
    date: isoDateSchema.nullable().optional(),
    notes: nullableStringSchema.optional(),
    steps: z.array(aiAuthoredPlanFirstStepSchema).default([]),
  })
  .strict();

const aiAuthoredPlanFirstWeekSchema = z
  .object({
    week: z.number().int().min(1).max(52),
    estimated_km: positiveNumberSchema.optional(),
    monday: aiAuthoredPlanFirstDaySchema,
    tuesday: aiAuthoredPlanFirstDaySchema,
    wednesday: aiAuthoredPlanFirstDaySchema,
    thursday: aiAuthoredPlanFirstDaySchema,
    friday: aiAuthoredPlanFirstDaySchema,
    saturday: aiAuthoredPlanFirstDaySchema,
    sunday: aiAuthoredPlanFirstDaySchema,
  })
  .strict();

const aiAuthoredPlanFirstSchema = z
  .object({
    metadata: z
      .object({
        goal: z.string().trim().min(1).max(160),
        target_date: isoDateSchema.nullable().optional(),
        target_time: z.string().trim().min(1).max(32).nullable().optional(),
        athlete: z
          .object({
            age: z.number().int().min(13).max(100).nullable(),
            height_cm: z.number().positive().nullable(),
            weight_kg: z
              .union([z.string().trim().min(1).max(80), z.number()])
              .nullable()
              .optional(),
            experience: nullableStringSchema.optional(),
          })
          .strict()
          .nullable()
          .optional(),
        rest_days: z.array(z.enum(WEEKDAY_NAMES)).max(7).default([]),
        long_run_day: z.enum(WEEKDAY_NAMES).nullable().optional(),
        note: nullableStringSchema.optional(),
        warnings: z.array(z.string().trim().min(1).max(500)).max(12).nullable().optional(),
        assumptions: z.array(z.string().trim().min(1).max(500)).max(12).nullable().optional(),
      })
      .strict(),
    weeks: z.array(aiAuthoredPlanFirstWeekSchema).min(1).max(52),
  })
  .strict();

const providerDurationSecondsSchema = z.number().int().min(5).max(43_200).nullable();
const providerDistanceMetersSchema = z.number().int().min(10).max(500_000).nullable();
const MAX_PROVIDER_REPEAT_DURATION_SECONDS = 43_200;
const MAX_PROVIDER_REPEAT_DISTANCE_METERS = 200_000;

const aiAuthoredPlanFirstProviderUnitSchema = z
  .object({
    duration_seconds: providerDurationSecondsSchema,
    distance_meters: providerDistanceMetersSchema,
    pace: nullableStringSchema,
    hr_zone: nullableStringSchema,
    effort: nullableStringSchema,
    notes: nullableStringSchema,
  })
  .strict();

const aiAuthoredPlanFirstProviderRepeatChildSchema = aiAuthoredPlanFirstProviderUnitSchema.extend({
  role: z.enum(["work", "recover"]),
  label: z.string().trim().min(1).max(80),
});

const aiAuthoredPlanFirstProviderRepeatSchema = z
  .object({
    count: z.number().int().min(2).max(100),
    children: z.array(aiAuthoredPlanFirstProviderRepeatChildSchema).min(1).max(2),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.children[0]?.role !== "work") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["children", 0, "role"],
        message: "Repeat children must begin with a work child.",
      });
    }
    if (value.children[1] && value.children[1].role !== "recover") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["children", 1, "role"],
        message: "The second repeat child must be recovery.",
      });
    }

    value.children.forEach((child, index) => {
      if (child.duration_seconds == null && child.distance_meters == null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["children", index],
          message: "Each Repeat child needs a duration_seconds or distance_meters prescription.",
        });
      }
    });

    const expandedDurationSeconds =
      value.count *
      value.children.reduce((total, child) => total + (child.duration_seconds ?? 0), 0);
    if (expandedDurationSeconds > MAX_PROVIDER_REPEAT_DURATION_SECONDS) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["count"],
        message: `Expanded Repeat duration cannot exceed ${MAX_PROVIDER_REPEAT_DURATION_SECONDS} seconds.`,
      });
    }

    const expandedDistanceMeters =
      value.count *
      value.children.reduce((total, child) => total + (child.distance_meters ?? 0), 0);
    if (expandedDistanceMeters > MAX_PROVIDER_REPEAT_DISTANCE_METERS) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["count"],
        message: `Expanded Repeat distance cannot exceed ${MAX_PROVIDER_REPEAT_DISTANCE_METERS} meters.`,
      });
    }
  });

const aiAuthoredPlanFirstProviderStepSchema = aiAuthoredPlanFirstProviderUnitSchema
  .extend({
    phase: z.string().trim().min(1).max(120),
    repeat: aiAuthoredPlanFirstProviderRepeatSchema.nullable(),
  })
  .superRefine((value, context) => {
    if (
      value.repeat &&
      [value.duration_seconds, value.distance_meters, value.pace, value.hr_zone, value.effort].some(
        (entry) => entry != null,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeat"],
        message:
          "Repeat parents are structural-only; prescriptions and targets belong to children.",
      });
    }
  });

const aiAuthoredPlanFirstProviderDaySchema = z
  .object({
    date: isoDateSchema,
    type: z.string().trim().min(1).max(160),
    notes: nullableStringSchema,
    steps: z.array(aiAuthoredPlanFirstProviderStepSchema).min(1).max(12),
  })
  .strict();

const aiAuthoredPlanFirstProviderWeekSchema = z
  .object({
    week: z.number().int().min(1).max(52),
    days: z.array(aiAuthoredPlanFirstProviderDaySchema).max(7),
  })
  .strict()
  .superRefine((value, context) => {
    const dates = value.days.map((day) => day.date);
    if (new Set(dates).size !== dates.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["days"],
        message: "A provider week cannot contain duplicate workout dates.",
      });
    }
  });

const aiAuthoredPlanFirstProviderDraftSchema = z
  .object({
    metadata: z
      .object({
        goal: z.string().trim().min(1).max(160),
        target_date: isoDateSchema.nullable(),
        target_time: z.string().trim().min(1).max(32).nullable(),
        long_run_day: z.enum(WEEKDAY_NAMES).nullable(),
        note: nullableStringSchema,
        warnings: z.array(z.string().trim().min(1).max(500)).max(12),
        assumptions: z.array(z.string().trim().min(1).max(500)).max(12),
      })
      .strict(),
    weeks: z.array(aiAuthoredPlanFirstProviderWeekSchema).min(1).max(52),
  })
  .strict();

export type AiAuthoredPlanFirstDraft = z.infer<typeof aiAuthoredPlanFirstSchema>;
export type AiAuthoredPlanFirstProviderDraft = z.infer<
  typeof aiAuthoredPlanFirstProviderDraftSchema
>;

export type AiAuthoredPlanFirstCompileResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      validationIssues: string[];
      reviewAssumptions: string[];
    }
  | {
      ok: false;
      reason: string;
      issues: NormalizationIssue[];
    };

const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const WEEKDAY_KEY_TO_NAME: Record<(typeof WEEKDAY_KEYS)[number], WeekdayName> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function compileAiAuthoredPlanFirstDraft({
  draft,
  authoringInput,
}: {
  draft: unknown;
  authoringInput: StructuredAuthoringInput;
}): AiAuthoredPlanFirstCompileResult {
  const normalized = normalizeAiAuthoredPlanFirstProviderDraft({ draft, authoringInput });

  if (!normalized.ok) {
    return normalized;
  }

  const parsed = aiAuthoredPlanFirstSchema.safeParse(normalizeNullishDraftFields(normalized.draft));

  if (!parsed.success) {
    return {
      ok: false,
      reason: "ai_authored_plan_first_schema_invalid",
      issues: parsed.error.issues.slice(0, 16).map((issue) => ({
        code: issue.code,
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    };
  }

  const issues: NormalizationIssue[] = [...normalized.issues];
  if (containsMedicalClaim(parsed.data)) {
    issues.push({
      code: "ai_authored_plan_first_medical_claim",
      path: "root",
      message: "AI-authored full-plan draft contains medical treatment or diagnostic language.",
    });
  }
  const compiled = compileParsedAiAuthoredPlanFirstDraft({
    draft: parsed.data,
    authoringInput,
    issues,
  });

  if (issues.some((issue) => isHardRejectIssue(issue.code))) {
    return {
      ok: false,
      reason: "ai_authored_plan_first_rejected_before_review",
      issues,
    };
  }

  const canonicalPlan = trainingPlanV2Schema.parse(compiled);

  return {
    ok: true,
    canonicalPlan,
    validationIssues: issues.map((issue) => `${issue.code}: ${issue.message}`),
    reviewAssumptions: buildReviewAssumptions(parsed.data, authoringInput, issues),
  };
}

export function buildAiAuthoredPlanFirstProviderDraft(
  draft: AiAuthoredPlanFirstDraft,
  bounds: { startDate?: string; endDate?: string } = {},
): AiAuthoredPlanFirstProviderDraft {
  const parsed = aiAuthoredPlanFirstSchema.parse(normalizeNullishDraftFields(draft));
  const providerDraft = {
    metadata: {
      goal: parsed.metadata.goal,
      target_date: parsed.metadata.target_date ?? null,
      target_time: parsed.metadata.target_time ?? null,
      long_run_day: parsed.metadata.long_run_day ?? null,
      note: parsed.metadata.note ?? null,
      warnings: parsed.metadata.warnings ?? [],
      assumptions: parsed.metadata.assumptions ?? [],
    },
    weeks: parsed.weeks.map((week) => ({
      week: week.week,
      days: WEEKDAY_KEYS.flatMap((weekdayKey) => {
        const day = week[weekdayKey];
        if (isRestDay(day)) return [];
        if (!day.date) {
          throw new Error(`AI-authored provider workout ${week.week}.${weekdayKey} needs a date.`);
        }
        if (
          (bounds.startDate && day.date < bounds.startDate) ||
          (bounds.endDate && day.date > bounds.endDate)
        ) {
          return [];
        }

        return [
          {
            date: day.date,
            type: day.type,
            notes: day.notes ?? null,
            steps: day.steps.map(buildProviderStepFromSpecimen),
          },
        ];
      }),
    })),
  };

  return aiAuthoredPlanFirstProviderDraftSchema.parse(providerDraft);
}

function normalizeAiAuthoredPlanFirstProviderDraft({
  draft,
  authoringInput,
}: {
  draft: unknown;
  authoringInput: StructuredAuthoringInput;
}):
  | { ok: true; draft: unknown; issues: NormalizationIssue[] }
  | { ok: false; reason: string; issues: NormalizationIssue[] } {
  const providerParsed = aiAuthoredPlanFirstProviderDraftSchema.safeParse(draft);

  if (!providerParsed.success) {
    const specimenParsed = aiAuthoredPlanFirstSchema.safeParse(normalizeNullishDraftFields(draft));
    if (specimenParsed.success) {
      return { ok: true, draft: specimenParsed.data, issues: [] };
    }

    return {
      ok: false,
      reason: "ai_authored_plan_first_provider_schema_invalid",
      issues: providerParsed.error.issues.slice(0, 16).map((issue) => ({
        code: issue.code,
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    };
  }

  const issues: NormalizationIssue[] = [];
  const startDate = authoringInput.schedule.startDate;
  const expectedHorizonWeeks = resolveAiAuthoredPlanFirstProviderHorizonWeeks(authoringInput);
  const authoredHorizonWeeks = providerParsed.data.weeks.length;
  const horizonWeeks = expectedHorizonWeeks ?? authoredHorizonWeeks;
  const endDate = authoringInput.schedule.targetDate ?? addDaysIso(startDate, horizonWeeks * 7 - 1);
  const firstWeekStart = startOfWeekIso(startDate);
  const authoredDates = new Set<string>();
  if (expectedHorizonWeeks != null && authoredHorizonWeeks !== expectedHorizonWeeks) {
    issues.push({
      code: "ai_authored_plan_first_week_count_mismatch",
      path: "weeks",
      message: `Expected ${expectedHorizonWeeks} complete calendar weeks, received ${authoredHorizonWeeks}.`,
    });
  }
  const weeks = providerParsed.data.weeks.map((week, weekIndex) => {
    const weekStart = addDaysIso(firstWeekStart, (week.week - 1) * 7);
    if (week.week !== weekIndex + 1) {
      issues.push({
        code: "ai_authored_plan_first_week_sequence_mismatch",
        path: `weeks.${weekIndex}.week`,
        message: `Expected week ${weekIndex + 1}, received week ${week.week}.`,
      });
    }

    const normalizedWeek: AiAuthoredPlanFirstDraft["weeks"][number] = {
      week: week.week,
      estimated_km: null,
      monday: providerRestDay(addDaysIso(weekStart, 0)),
      tuesday: providerRestDay(addDaysIso(weekStart, 1)),
      wednesday: providerRestDay(addDaysIso(weekStart, 2)),
      thursday: providerRestDay(addDaysIso(weekStart, 3)),
      friday: providerRestDay(addDaysIso(weekStart, 4)),
      saturday: providerRestDay(addDaysIso(weekStart, 5)),
      sunday: providerRestDay(addDaysIso(weekStart, 6)),
    };

    for (const day of week.days) {
      if (authoredDates.has(day.date)) {
        issues.push({
          code: "ai_authored_plan_first_duplicate_date",
          path: `weeks.${weekIndex}.days`,
          message: `${day.date} appears more than once in the provider draft.`,
        });
      }
      authoredDates.add(day.date);

      if (day.date < startDate || day.date > endDate) {
        issues.push({
          code: "ai_authored_plan_first_date_out_of_range",
          path: `weeks.${weekIndex}.days.${day.date}`,
          message: `${day.date} falls outside ${startDate} through ${endDate}.`,
        });
      }
      if (startOfWeekIso(day.date) !== weekStart) {
        issues.push({
          code: "ai_authored_plan_first_date_week_mismatch",
          path: `weeks.${weekIndex}.days.${day.date}`,
          message: `${day.date} does not belong to authored week ${week.week}.`,
        });
      }

      const weekdayKey = weekdayLong(day.date).toLowerCase() as (typeof WEEKDAY_KEYS)[number];
      normalizedWeek[weekdayKey] = {
        type: day.type,
        date: day.date,
        notes: day.notes,
        steps: day.steps.map(buildSpecimenStepFromProvider),
      };
    }

    return normalizedWeek;
  });

  return {
    ok: true,
    issues,
    draft: {
      metadata: {
        goal: providerParsed.data.metadata.goal,
        target_date: providerParsed.data.metadata.target_date,
        target_time: providerParsed.data.metadata.target_time,
        athlete: null,
        rest_days: [...authoringInput.availability.unavailableDays],
        long_run_day: providerParsed.data.metadata.long_run_day,
        note: providerParsed.data.metadata.note,
        warnings: providerParsed.data.metadata.warnings,
        assumptions: providerParsed.data.metadata.assumptions,
      },
      weeks,
    } satisfies AiAuthoredPlanFirstDraft,
  };
}

function buildProviderStepFromSpecimen(
  step: z.infer<typeof aiAuthoredPlanFirstStepSchema>,
): AiAuthoredPlanFirstProviderDraft["weeks"][number]["days"][number]["steps"][number] {
  const repeatBlock = step.blocks?.at(0) ?? null;
  const strideRepeat = !repeatBlock && step.repeat && step.duration_sec;
  const repeat = repeatBlock
    ? {
        count: repeatBlock.repeat,
        children: [
          buildProviderRepeatChild("work", "Work", repeatBlock.interval),
          ...(repeatBlock.recovery
            ? [buildProviderRepeatChild("recover" as const, "Recover", repeatBlock.recovery)]
            : []),
        ],
      }
    : strideRepeat
      ? {
          count: step.repeat!,
          children: [
            buildProviderRepeatChild("work", "Stride", step),
            buildProviderRepeatChild("recover", "Recover", {
              duration_sec: step.recovery_sec ?? 40,
              target_hr: "Z1",
              notes: "Easy walk or jog recovery.",
            }),
          ],
        }
      : null;

  return {
    phase: step.phase,
    duration_seconds: repeat ? null : durationSeconds(step),
    distance_meters: repeat ? null : distanceMeters(step),
    pace: repeat ? null : (step.target_pace ?? null),
    hr_zone: repeat ? null : (step.target_hr ?? null),
    effort: repeat ? null : null,
    notes: step.notes ?? null,
    repeat,
  };
}

function buildProviderRepeatChild(
  role: "work" | "recover",
  label: string,
  unit: z.infer<typeof aiAuthoredPlanFirstUnitSchema>,
) {
  return {
    role,
    label,
    duration_seconds: durationSeconds(unit),
    distance_meters: distanceMeters(unit),
    pace: unit.target_pace ?? null,
    hr_zone: unit.target_hr ?? null,
    effort: unit.effort ?? null,
    notes: unit.notes ?? null,
  };
}

function buildSpecimenStepFromProvider(
  step: z.infer<typeof aiAuthoredPlanFirstProviderStepSchema>,
): z.infer<typeof aiAuthoredPlanFirstStepSchema> {
  const work = step.repeat?.children[0] ?? null;
  const recovery = step.repeat?.children[1] ?? null;

  return {
    phase: step.phase,
    duration_min: null,
    duration_sec: step.repeat ? null : step.duration_seconds,
    distance_km: step.repeat
      ? null
      : step.distance_meters == null
        ? null
        : step.distance_meters / 1000,
    target_pace: step.repeat ? null : step.pace,
    target_hr: step.repeat ? null : step.hr_zone,
    repeat: null,
    recovery_sec: null,
    blocks:
      step.repeat && work
        ? [
            {
              repeat: step.repeat.count,
              interval: buildSpecimenUnitFromProvider(work),
              recovery: recovery ? buildSpecimenUnitFromProvider(recovery) : null,
            },
          ]
        : null,
    notes: step.notes,
  };
}

function buildSpecimenUnitFromProvider(
  unit: z.infer<typeof aiAuthoredPlanFirstProviderRepeatChildSchema>,
): z.infer<typeof aiAuthoredPlanFirstUnitSchema> {
  return {
    duration_min: null,
    duration_sec: unit.duration_seconds,
    distance_km: unit.distance_meters == null ? null : unit.distance_meters / 1000,
    target_pace: unit.pace,
    target_hr: unit.hr_zone,
    effort: unit.effort,
    jog: unit.role === "recover" ? unit.effort : null,
    notes: unit.notes,
  };
}

function providerRestDay(date: string): z.infer<typeof aiAuthoredPlanFirstDaySchema> {
  return { type: "Rest", date, notes: null, steps: [] };
}

function durationSeconds(value: { duration_min?: number | null; duration_sec?: number | null }) {
  const seconds = value.duration_sec ?? (value.duration_min ? value.duration_min * 60 : null);
  return seconds == null ? null : Math.max(5, Math.min(43_200, Math.round(seconds)));
}

function distanceMeters(value: { distance_km?: number | null }) {
  if (value.distance_km == null) return null;
  return Math.max(10, Math.min(500_000, Math.round(value.distance_km * 1000)));
}

function compileParsedAiAuthoredPlanFirstDraft({
  draft,
  authoringInput,
  issues,
}: {
  draft: AiAuthoredPlanFirstDraft;
  authoringInput: StructuredAuthoringInput;
  issues: NormalizationIssue[];
}): TrainingPlanV2 {
  const restDays = uniqueWeekdays([
    ...draft.metadata.rest_days,
    ...authoringInput.availability.unavailableDays,
  ]);
  const weekOneStart = startOfWeekIso(authoringInput.schedule.startDate);
  const workouts: TrainingPlanV2["planned_workouts"] = [];

  for (const week of draft.weeks) {
    for (const [weekdayIndex, weekdayKey] of WEEKDAY_KEYS.entries()) {
      const weekday = WEEKDAY_KEY_TO_NAME[weekdayKey];
      const day = week[weekdayKey];
      const date = day.date ?? addDaysIso(weekOneStart, (week.week - 1) * 7 + weekdayIndex);

      if (date < authoringInput.schedule.startDate) {
        continue;
      }

      if (weekdayLong(date) !== weekday) {
        issues.push({
          code: "ai_authored_plan_first_date_weekday_mismatch",
          path: `weeks.${week.week}.${weekdayKey}.date`,
          message: `${date} is ${weekdayLong(date)}, not ${weekday}.`,
        });
      }

      if (restDays.includes(weekday) && !isRestDay(day)) {
        issues.push({
          code: "ai_authored_plan_first_fixed_rest_day_violation",
          path: `weeks.${week.week}.${weekdayKey}`,
          message: `${weekday} is a fixed rest day but the AI-authored draft scheduled ${day.type}.`,
        });
      }

      workouts.push(
        isRestDay(day)
          ? buildRestWorkout({ date, weekday, weekNumber: week.week, authoringInput })
          : buildWorkout({
              day,
              date,
              weekday,
              weekNumber: week.week,
              totalWeeks: draft.weeks.length,
              authoringInput,
              issues,
            }),
      );
    }
  }

  if (workouts.length === 0 || workouts.every((workout) => workout.workout_type === "rest")) {
    issues.push({
      code: "ai_authored_plan_first_missing_workouts",
      path: "weeks",
      message: "AI-authored plan-first draft did not include any running workouts.",
    });
  }

  const firstDate = workouts.at(0)?.date ?? authoringInput.schedule.startDate;
  const targetDate = authoringInput.schedule.targetDate ?? draft.metadata.target_date ?? undefined;

  return {
    schema_version: FUTURE_TEMPLATE_VERSION,
    plan_id: `ai-authored-plan-first-${slugify(authoringInput.goal.goalLabel)}-${firstDate}`,
    plan_name: buildPlanName(draft, authoringInput),
    source_kind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
    source_status: "ai_authored",
    created_at: new Date(`${firstDate}T00:00:00.000Z`).toISOString(),
    generated_for: "Hito generated-plan runner",
    goal: {
      goal_type: "distance_goal",
      goal_label: authoringInput.goal.goalLabel,
      ...buildDistanceGoalFields(authoringInput),
      authored_outcome_target: {
        source: authoringInput.planGoalIntent?.targetFinishTime
          ? "runner_entered_target"
          : "ai_estimated_target",
        label:
          authoringInput.goal.targetTime ??
          draft.metadata.target_time ??
          `${authoringInput.goal.goalLabel} completion guidance`,
        finish_time_window: authoringInput.goal.targetTime ?? draft.metadata.target_time,
        rationale:
          "AI authored the full plan draft; outcome targets are review guidance, not backend-certified executable workout pace.",
        confidence: authoringInput.goal.targetTime ? "medium" : "low",
        assumptions: buildReviewAssumptions(draft, authoringInput, issues).slice(0, 6),
      },
      authored_horizon: {
        source: authoringInput.schedule.targetDate ? "runner_target_date" : "ai_proposed_horizon",
        weeks: draft.weeks.length,
        rationale:
          "AI authored a full dated plan draft; backend compiled the displayed calendar without rebuilding the coach plan.",
        assumptions: [
          "Calendar dates, fixed rest days, repeat structure, and persistence shape were backend-validated.",
        ],
      },
      ...(targetDate
        ? {
            target_event: {
              label: authoringInput.goal.targetEventName ?? authoringInput.goal.goalLabel,
              date: targetDate,
              event_date: targetDate,
              event_name: authoringInput.goal.targetEventName ?? authoringInput.goal.goalLabel,
            },
          }
        : {}),
    },
    runner_profile: {
      experience_level: authoringInput.runnerProfile.experienceLevel,
      baseline_sessions_per_week: authoringInput.runnerProfile.baselineSessionsPerWeek,
      ...(authoringInput.runnerProfile.baselineLongRunKm
        ? { baseline_long_run_km: authoringInput.runnerProfile.baselineLongRunKm }
        : {}),
      ...(authoringInput.runnerProfile.age ? { age: authoringInput.runnerProfile.age } : {}),
      ...(authoringInput.currentLevel.recentResultSummary
        ? { recent_result_summary: authoringInput.currentLevel.recentResultSummary }
        : {}),
    },
    start_date: firstDate,
    preparation_horizon_weeks: draft.weeks.length,
    ...(targetDate ? { target_date: targetDate } : {}),
    plan_preferences: {
      preferred_running_days: authoringInput.availability.preferredRunningDays,
      blocked_days: restDays,
      preferred_long_run_day:
        draft.metadata.long_run_day ?? authoringInput.availability.preferredLongRunDay ?? undefined,
      max_running_days_per_week: authoringInput.availability.maxRunningDaysPerWeek,
      allow_back_to_back_days: authoringInput.availability.allowBackToBackDays,
      terrain_focus: authoringInput.preferences.terrainFocus,
      notes: draft.metadata.note ?? authoringInput.preferences.notes ?? undefined,
    },
    training_constraints: {
      running_days_per_week: authoringInput.availability.maxRunningDaysPerWeek,
      full_rest_days: restDays,
      ...((draft.metadata.long_run_day ?? authoringInput.availability.preferredLongRunDay)
        ? {
            long_run_day:
              draft.metadata.long_run_day ?? authoringInput.availability.preferredLongRunDay,
          }
        : {}),
    },
    planned_workouts: workouts,
  };
}

function buildWorkout({
  day,
  date,
  weekday,
  weekNumber,
  totalWeeks,
  authoringInput,
  issues,
}: {
  day: z.infer<typeof aiAuthoredPlanFirstDaySchema>;
  date: string;
  weekday: string;
  weekNumber: number;
  totalWeeks: number;
  authoringInput: StructuredAuthoringInput;
  issues: NormalizationIssue[];
}): TrainingPlanV2["planned_workouts"][number] {
  if (day.steps.length === 0) {
    issues.push({
      code: "ai_authored_plan_first_missing_workout_steps",
      path: `${date}.steps`,
      message: `${day.type} on ${date} has no steps.`,
    });
  }

  const segments = day.steps.map((step, index) =>
    buildSegment({
      step,
      workoutType: day.type,
      date,
      sequence: index + 1,
      issues,
    }),
  );
  const model = resolveWorkoutIdentity(day.type, weekNumber, totalWeeks);
  const isEndpoint = workoutPrescribesSelectedDistance({ segments, authoringInput });
  const workoutIdentity = isEndpoint ? SELECTED_DISTANCE_ENDPOINT_IDENTITY : model.identity;
  const workoutFamily: CanonicalWorkoutFamily = isEndpoint ? "race" : model.family;
  const calendarIconKey: CalendarIconKey = isEndpoint ? "race" : model.icon;
  const legacyType = canonicalFamilyToLegacyWorkoutType(workoutFamily, workoutIdentity);
  const metricMode = toCanonicalMetricModeJson(deriveCanonicalMetricMode(segments));

  return {
    workout_id: `ai-plan-first-${slugify(workoutIdentity)}-${date}`,
    date,
    weekday,
    week_number: weekNumber,
    phase: phaseForWeek(weekNumber, totalWeeks),
    workout_type: legacyType,
    source_workout_type: isEndpoint ? SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND : workoutIdentity,
    workout_family: workoutFamily,
    workout_identity: workoutIdentity,
    calendar_icon_key: calendarIconKey,
    goal_context: buildGoalContext(authoringInput),
    metric_mode: {
      ...metricMode,
      reason:
        metricMode.guidance === "pace" || metricMode.guidance === "mixed"
          ? "AI-authored pace targets are persisted as coach guidance from the reviewed plan, not as backend-inferred goal pace."
          : metricMode.reason,
    },
    title: day.type,
    summary: day.notes ?? summarizeWorkout(day.type, segments.length),
    planned_rpe: plannedRpeForWorkoutType(day.type),
    estimated_fatigue: estimatedFatigueForWorkoutType(day.type),
    recovery_priority: recoveryPriorityForWorkoutType(day.type),
    segments,
  };
}

function buildSegment({
  step,
  workoutType,
  date,
  sequence,
  issues,
}: {
  step: z.infer<typeof aiAuthoredPlanFirstStepSchema>;
  workoutType: string;
  date: string;
  sequence: number;
  issues: NormalizationIssue[];
}): TrainingPlanV2["planned_workouts"][number]["segments"][number] {
  const repeatBlock = step.blocks?.at(0) ?? null;
  const segmentType = resolveSegmentType(step, workoutType, Boolean(repeatBlock));
  const target = buildTarget(step, `${date}.steps.${sequence}`, issues);

  if (repeatBlock) {
    return {
      segment_id: `ai-plan-first-${date}-segment-${sequence}`,
      segment_type: segmentType === "strides" ? "strides" : "interval_block",
      label: step.phase,
      sequence,
      guidance: step.notes ?? `${step.phase} as authored by the AI coach plan.`,
      prescription: {
        mode: "repeats",
        repeat_count: repeatBlock.repeat,
        children: [
          buildRepeatChild({
            role: "work",
            label: "Work",
            unit: repeatBlock.interval,
            sequence: 1,
            path: `${date}.steps.${sequence}.blocks.0.interval`,
            issues,
          }),
          ...(repeatBlock.recovery
            ? [
                buildRepeatChild({
                  role: "recover" as const,
                  label: "Recover",
                  unit: repeatBlock.recovery,
                  sequence: 2,
                  path: `${date}.steps.${sequence}.blocks.0.recovery`,
                  issues,
                }),
              ]
            : []),
        ],
      },
    };
  }

  if (step.repeat && step.duration_sec) {
    return {
      segment_id: `ai-plan-first-${date}-segment-${sequence}`,
      segment_type: "strides",
      label: step.phase,
      sequence,
      guidance: step.notes ?? "Repeat the authored stride block with relaxed form.",
      prescription: {
        mode: "repeats",
        repeat_count: step.repeat,
        children: [
          {
            role: "work",
            label: "Stride",
            sequence: 1,
            guidance: "Fast relaxed stride.",
            prescription: { mode: "time", duration_min: roundMinutes(step.duration_sec / 60) },
            ...(target ? { target } : {}),
          },
          {
            role: "recover",
            label: "Recover",
            sequence: 2,
            guidance: "Walk or jog easily until fully relaxed.",
            prescription: {
              mode: "time",
              duration_min: roundMinutes((step.recovery_sec ?? 40) / 60),
            },
            target: {
              target_source: "ai_authored_plan_guidance",
              hr_target_source: "effort_only",
              cue: "Recover by easy effort.",
              source_note:
                "AI-authored coach guidance from the reviewed plan; not backend-inferred executable pace or personal HR truth.",
            },
          },
        ],
      },
    };
  }

  const prescription = buildPrescription(step);

  if (!prescription) {
    issues.push({
      code: "ai_authored_plan_first_unconvertible_step",
      path: `${date}.steps.${sequence}`,
      message: `${step.phase} has no duration, distance, or repeat structure that can be displayed.`,
    });
  }

  return {
    segment_id: `ai-plan-first-${date}-segment-${sequence}`,
    segment_type: segmentType,
    label: step.phase,
    sequence,
    guidance: step.notes ?? `${step.phase} as authored by the AI coach plan.`,
    ...(prescription ? { prescription } : {}),
    ...(target ? { target } : {}),
  };
}

function buildRepeatChild({
  role,
  label,
  unit,
  sequence,
  path,
  issues,
}: {
  role: "work" | "recover";
  label: string;
  unit: z.infer<typeof aiAuthoredPlanFirstUnitSchema>;
  sequence: number;
  path: string;
  issues: NormalizationIssue[];
}): NonNullable<StepPrescription["children"]>[number] {
  const prescription = buildUnitPrescription(unit);
  const target = buildTarget(unit, path, issues);
  const guidance =
    unit.notes ??
    ("effort" in unit && unit.effort
      ? unit.effort
      : "jog" in unit && unit.jog
        ? unit.jog
        : `${label} block as authored by the AI coach plan.`);

  if (!prescription && !target) {
    issues.push({
      code: "ai_authored_plan_first_unconvertible_repeat_child",
      path,
      message: `${label} repeat child has no duration or distance prescription.`,
    });
  }

  return {
    role,
    label,
    sequence,
    guidance,
    prescription: prescription ?? { mode: "none" },
    ...(target ? { target } : {}),
  };
}

function buildPrescription(
  step: z.infer<typeof aiAuthoredPlanFirstStepSchema>,
): StepPrescription | null {
  return buildUnitPrescription(step);
}

function buildUnitPrescription(
  unit:
    | z.infer<typeof aiAuthoredPlanFirstStepSchema>
    | z.infer<typeof aiAuthoredPlanFirstUnitSchema>,
): { mode: "time"; duration_min: number } | { mode: "distance"; distance_km: number } | null {
  if (unit.distance_km) {
    return { mode: "distance", distance_km: roundKm(unit.distance_km) };
  }

  if (unit.duration_min) {
    return { mode: "time", duration_min: roundMinutes(unit.duration_min) };
  }

  if (unit.duration_sec) {
    return { mode: "time", duration_min: roundMinutes(unit.duration_sec / 60) };
  }

  return null;
}

function buildTarget(
  value:
    | z.infer<typeof aiAuthoredPlanFirstStepSchema>
    | z.infer<typeof aiAuthoredPlanFirstUnitSchema>,
  path: string,
  issues: NormalizationIssue[],
): StepTarget | undefined {
  const cues: string[] = [];
  const hints: string[] = [];
  const target: StepTarget = {
    target_source: "ai_authored_plan_guidance",
    hr_target_source: "effort_only",
    source_note:
      "AI-authored coach guidance from the reviewed plan; not backend-inferred executable pace or personal HR truth.",
  };

  if (value.target_pace) {
    cues.push(`Pace guidance: ${value.target_pace}`);
    target.intensity = "AI-authored pace guidance";
  }

  if (value.target_hr) {
    if (looksLikeRawBpmClaim(value.target_hr)) {
      issues.push({
        code: "ai_authored_plan_first_raw_bpm_claim",
        path,
        message: `Unsupported raw BPM heart-rate claim: ${value.target_hr}.`,
      });
    } else {
      hints.push(`HR-zone guidance: ${value.target_hr}`);
      target.intensity = target.intensity ?? "AI-authored HR-zone guidance";
    }
  }

  if ("effort" in value && value.effort) {
    target.intensity = target.intensity ?? value.effort;
    cues.push(`Effort: ${value.effort}`);
  }

  if ("jog" in value && value.jog) {
    hints.push(`Recovery cue: ${value.jog}`);
  }

  if (cues.length === 0 && hints.length === 0) {
    cues.push("Execute by reviewed AI-authored coach guidance.");
  }

  if (cues.length > 0) {
    target.cue = cues.join(" ");
  }
  if (hints.length > 0) {
    target.hint = hints.join(" ");
  }

  return target;
}

function buildRestWorkout({
  date,
  weekday,
  weekNumber,
  authoringInput,
}: {
  date: string;
  weekday: string;
  weekNumber: number;
  authoringInput: StructuredAuthoringInput;
}): TrainingPlanV2["planned_workouts"][number] {
  return {
    workout_id: `ai-plan-first-rest-${date}`,
    date,
    weekday,
    week_number: weekNumber,
    phase: "Recovery",
    workout_type: "rest",
    source_workout_type: "rest_and_recovery",
    workout_family: "rest",
    workout_identity: "rest_and_recovery",
    calendar_icon_key: "rest",
    goal_context: buildGoalContext(authoringInput),
    metric_mode: toCanonicalMetricModeJson({
      guidance: "effort",
      executableMode: "none",
      paceTargetsAllowed: false,
      hrTargetsAllowed: false,
      hrTargetSource: "effort_only",
      hrTargetLabel: null,
      hrTargetSourceNote: null,
      reason: "Rest day has no execution metric targets.",
    }),
    title: "Rest",
    summary: "No running today. Keep the day genuinely restorative.",
    planned_rpe: 1,
    estimated_fatigue: "very_low",
    recovery_priority: "high",
    segments: [
      {
        segment_id: `ai-plan-first-rest-${date}-segment-1`,
        segment_type: "rest",
        sequence: 1,
        label: "Rest",
        guidance: "No running today.",
        prescription: { mode: "none" },
      },
    ],
  };
}

function normalizeNullishDraftFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeNullishDraftFields);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(record)) {
    normalized[key] = entry === undefined ? null : normalizeNullishDraftFields(entry);
  }

  return normalized;
}

function isRestDay(day: z.infer<typeof aiAuthoredPlanFirstDaySchema>) {
  return /^rest$/i.test(day.type.trim());
}

function isHardRejectIssue(code: string) {
  return (
    code.includes("schema") ||
    code.includes("fixed_rest_day_violation") ||
    code.includes("date_") ||
    code.includes("week_count_mismatch") ||
    code.includes("week_sequence_mismatch") ||
    code.includes("duplicate_date") ||
    code.includes("missing_workouts") ||
    code.includes("missing_workout_steps") ||
    code.includes("unconvertible") ||
    code.includes("raw_bpm") ||
    code.includes("medical_claim")
  );
}

function isRealIsoDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function resolveSegmentType(
  step: z.infer<typeof aiAuthoredPlanFirstStepSchema>,
  workoutType: string,
  hasRepeatBlock: boolean,
): TrainingPlanV2["planned_workouts"][number]["segments"][number]["segment_type"] {
  const phase = step.phase.toLowerCase();
  const workout = workoutType.toLowerCase();

  if (phase.includes("warm")) return "warmup";
  if (phase.includes("cool")) return "cooldown";
  if (phase.includes("stride")) return "strides";
  if (hasRepeatBlock || workout.includes("interval") || workout.includes("tempo")) {
    return "interval_block";
  }
  if (phase.includes("recover")) return "recovery";
  if (workout.includes("tempo")) return "tempo_block";
  return "main";
}

function resolveWorkoutIdentity(
  workoutType: string,
  weekNumber: number,
  totalWeeks: number,
): {
  family: CanonicalWorkoutFamily;
  identity: CanonicalWorkoutIdentity;
  icon: CalendarIconKey;
} {
  const text = workoutType.toLowerCase();
  let identity: CanonicalWorkoutIdentity =
    normalizeWorkoutIdentity(workoutType) ?? "easy_aerobic_run";

  if (text.includes("marathon pace")) identity = "marathon_steady_specificity";
  else if (text.includes("medium long")) identity = "long_aerobic_run";
  else if (text.includes("long")) {
    identity = weekNumber >= totalWeeks - 1 ? "taper_long_run" : "long_aerobic_run";
  } else if (text.includes("tempo")) identity = "controlled_tempo_session";
  else if (text.includes("interval")) identity = "time_intervals";
  else if (text.includes("stride")) identity = "easy_run_with_strides";
  else if (text.includes("progression")) identity = "progression_run";
  else if (text.includes("hill")) identity = "uphill_repeats";

  const family = familyForIdentity(identity);
  return { family, identity, icon: family };
}

function familyForIdentity(identity: CanonicalWorkoutIdentity): CanonicalWorkoutFamily {
  return resolveCanonicalWorkoutModel({
    workoutType: "quality",
    workoutIdentity: identity,
  }).workoutFamily;
}

function workoutPrescribesSelectedDistance({
  segments,
  authoringInput,
}: {
  segments: TrainingPlanV2["planned_workouts"][number]["segments"];
  authoringInput: StructuredAuthoringInput;
}) {
  const expectedKm = authoringInput.planGoalIntent?.distance?.distanceKm ?? null;

  if (!expectedKm) {
    return false;
  }

  const distanceKm = segments.reduce((total, segment) => {
    const prescription = segment.prescription;
    if (!prescription) return total;
    if (prescription.mode === "distance") return total + (prescription.distance_km ?? 0);
    if (prescription.mode !== "repeats") return total;
    const childDistance = (prescription.children ?? []).reduce(
      (childTotal, child) =>
        childTotal +
        (child.prescription.mode === "distance" ? (child.prescription.distance_km ?? 0) : 0),
      0,
    );
    return total + childDistance * (prescription.repeat_count ?? 1);
  }, 0);

  return Math.abs(Math.round(distanceKm * 1000) - Math.round(expectedKm * 1000)) <= 5;
}

function buildGoalContext(authoringInput: StructuredAuthoringInput) {
  const distance = authoringInput.planGoalIntent?.distance;

  return {
    goal_type: "distance_goal",
    goal_style: authoringInput.goal.goalStyle ?? null,
    ...(distance
      ? {
          distance_km: distance.distanceKm,
          distance_meters: distance.distanceMeters,
        }
      : {}),
    target_date: authoringInput.schedule.targetDate ?? null,
    target_time: authoringInput.goal.targetTime ?? null,
  };
}

function buildDistanceGoalFields(authoringInput: StructuredAuthoringInput) {
  const distance = authoringInput.planGoalIntent?.distance;

  return distance
    ? {
        distance_km: distance.distanceKm,
        distance_meters: distance.distanceMeters,
      }
    : {};
}

function buildPlanName(draft: AiAuthoredPlanFirstDraft, authoringInput: StructuredAuthoringInput) {
  const targetTime = authoringInput.goal.targetTime ?? draft.metadata.target_time;
  return targetTime
    ? `${authoringInput.goal.goalLabel} plan (${targetTime})`
    : `${authoringInput.goal.goalLabel} plan`;
}

function buildReviewAssumptions(
  draft: AiAuthoredPlanFirstDraft,
  authoringInput: StructuredAuthoringInput,
  issues: readonly NormalizationIssue[],
) {
  return uniqueStrings([
    draft.metadata.note,
    ...(draft.metadata.assumptions ?? []),
    ...(draft.metadata.warnings ?? []),
    ...(authoringInput.planGoalIntent?.assumptions ?? []),
    "Paces and HR zones are AI-authored coach guidance; adjust with runner evidence, threshold testing, or personal Garmin/user zones.",
    ...issues
      .filter((issue) => !isHardRejectIssue(issue.code))
      .map((issue) => `${issue.code}: ${issue.message}`),
  ])
    .filter((value): value is string => Boolean(value))
    .slice(0, 12);
}

function summarizeWorkout(workoutType: string, segmentCount: number) {
  return `${workoutType} authored with ${segmentCount} displayable Hito section${segmentCount === 1 ? "" : "s"}.`;
}

function plannedRpeForWorkoutType(value: string) {
  const text = value.toLowerCase();
  if (text.includes("interval")) return 8;
  if (text.includes("tempo") || text.includes("marathon pace")) return 7;
  if (text.includes("long")) return 5;
  if (text.includes("stride")) return 4;
  return 3;
}

function estimatedFatigueForWorkoutType(value: string) {
  const text = value.toLowerCase();
  if (text.includes("interval") || text.includes("tempo") || text.includes("marathon pace")) {
    return "medium_high";
  }
  if (text.includes("long")) return "medium";
  return "low";
}

function recoveryPriorityForWorkoutType(value: string) {
  const text = value.toLowerCase();
  if (text.includes("interval") || text.includes("tempo") || text.includes("long")) {
    return "medium";
  }
  return "low";
}

function phaseForWeek(weekNumber: number, totalWeeks: number) {
  if (weekNumber > totalWeeks - 2) return "Taper";
  if (weekNumber > Math.round(totalWeeks * 0.68)) return "Specific";
  if (weekNumber > Math.round(totalWeeks * 0.35)) return "Build";
  return "Base";
}

function looksLikeRawBpmClaim(value: string) {
  const withoutZoneLabels = value.replace(/\bZ[1-5]\b/gi, "");
  return /\bbpm\b/i.test(withoutZoneLabels) || /\b\d{2,3}\b/.test(withoutZoneLabels);
}

function containsMedicalClaim(draft: AiAuthoredPlanFirstDraft) {
  return /\b(diagnos(?:e|is)|treat(?:ment)?|prescri(?:be|ption)|medical advice|doctor clearance)\b/i.test(
    JSON.stringify(draft),
  );
}

function roundKm(value: number) {
  return Math.round(value * 1000) / 1000;
}

function roundMinutes(value: number) {
  return Math.round(value * 100) / 100;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueWeekdays(values: readonly WeekdayName[]) {
  return WEEKDAY_NAMES.filter((day) => values.includes(day));
}

function uniqueStrings(values: readonly (string | null | undefined)[]) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[];
}
