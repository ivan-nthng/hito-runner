import { z } from "zod";
import {
  FUTURE_TEMPLATE_VERSION,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import {
  CALENDAR_ICON_KEY_VALUES,
  CANONICAL_METRIC_GUIDANCE_VALUES,
  CANONICAL_WORKOUT_FAMILY_VALUES,
  CANONICAL_WORKOUT_IDENTITY_VALUES,
  HR_TARGET_SOURCE_VALUES,
  canonicalFamilyToLegacyWorkoutType,
  deriveExecutableModeFromSegments,
  normalizeCanonicalGoalContext,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalMetricGuidance,
  type CanonicalMetricModeJson,
  type CanonicalWorkoutFamily,
} from "@/lib/rich-workout-model";
import {
  type Step,
  type StepPrescription,
  addDaysIso,
  diffDaysIso,
  normalizeExecutableStepInstructions,
  todayIso,
  weekdayLong,
} from "@/lib/training";
import type { structuredPlanAuthoringInputSchema } from "@/lib/structured-plan-authoring";

export const AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION = "ai-first-plan-draft-v1";

const weekdayValues = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
const phaseValues = ["Base", "Build", "Specific", "Taper"] as const;
const estimatedFatigueValues = ["very_low", "low", "medium", "medium_high", "high"] as const;
const recoveryPriorityValues = ["low", "medium", "high"] as const;
const segmentTypeValues = [
  "warmup",
  "activation",
  "drills",
  "main",
  "tempo_block",
  "interval_block",
  "recovery",
  "recovery_jog",
  "strides",
  "fueling",
  "cooldown",
  "rest",
  "mobility_optional",
] as const;

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const boundedTextSchema = z.string().trim().min(1).max(360);
const nullableBoundedTextSchema = z.string().trim().min(1).max(360).nullable();
const mainLikeSegmentTypes = new Set(["main", "tempo_block", "interval_block", "strides"]);

type StructuredAuthoringInput = z.output<typeof structuredPlanAuthoringInputSchema>;
type AiDraftWeek = AiFirstPlanDraft["weeks"][number];
type AiDraftWorkout = AiDraftWeek["plannedWorkouts"][number];
type AiDraftSegment = AiDraftWorkout["segments"][number];
type CanonicalWorkout = TrainingPlanV2["planned_workouts"][number];
type CanonicalSegment = CanonicalWorkout["segments"][number];
type NormalizationIssue = { code: string; message: string; path?: string };

const aiDraftGoalContextSchema = z
  .object({
    goalType: z.string().trim().min(1).max(80),
    goalStyle: nullableBoundedTextSchema,
    terrainFocus: z.enum(["standard", "rolling", "mountain"]).nullable(),
    targetDate: isoDateSchema.nullable(),
    targetTime: z.string().trim().min(1).max(32).nullable(),
  })
  .strict();

const aiDraftMetricModeSchema = z
  .object({
    guidance: z.enum(CANONICAL_METRIC_GUIDANCE_VALUES),
    paceTargetsAllowed: z.boolean(),
    hrTargetsAllowed: z.boolean(),
    hrTargetSource: z.enum(HR_TARGET_SOURCE_VALUES),
    hrTargetLabel: nullableBoundedTextSchema,
    hrTargetSourceNote: nullableBoundedTextSchema,
    reason: z.string().trim().min(1).max(200),
  })
  .strict();

const aiDraftUnitPrescriptionSchema = z
  .object({
    mode: z.enum(["time", "distance", "none"]),
    durationMin: z.number().positive().nullable(),
    distanceKm: z.number().positive().nullable(),
  })
  .strict();

const aiDraftSegmentPrescriptionSchema = z
  .object({
    mode: z.enum(["time", "distance", "repeats", "none"]),
    durationMin: z.number().positive().nullable(),
    distanceKm: z.number().positive().nullable(),
    repeatCount: z.number().int().positive().nullable(),
    repeatUnit: aiDraftUnitPrescriptionSchema.nullable(),
    recoveryUnit: aiDraftUnitPrescriptionSchema.nullable(),
  })
  .strict();

const aiDraftTargetSchema = z
  .object({
    intensity: nullableBoundedTextSchema,
    rpe: z.union([z.string().trim().min(1).max(16), z.number().min(1).max(10)]).nullable(),
    cue: nullableBoundedTextSchema,
    hint: nullableBoundedTextSchema,
    paceMinPerKmRange: nullableBoundedTextSchema,
    pace: nullableBoundedTextSchema,
    hrBpmRange: nullableBoundedTextSchema,
    hrBpm: nullableBoundedTextSchema,
    hrTargetSource: z.enum(HR_TARGET_SOURCE_VALUES).nullable(),
    label: nullableBoundedTextSchema,
    sourceNote: nullableBoundedTextSchema,
  })
  .strict();

const aiDraftSegmentSchema = z
  .object({
    segmentId: z.string().trim().min(1).max(120),
    segmentType: z.enum(segmentTypeValues),
    label: z.string().trim().min(1).max(120),
    sequence: z.number().int().min(1),
    prescription: aiDraftSegmentPrescriptionSchema,
    guidance: boundedTextSchema,
    target: aiDraftTargetSchema,
  })
  .strict();

const aiDraftWorkoutSchema = z
  .object({
    date: isoDateSchema,
    weekday: z.enum(weekdayValues),
    workoutFamily: z.enum(CANONICAL_WORKOUT_FAMILY_VALUES),
    workoutIdentity: z.enum(CANONICAL_WORKOUT_IDENTITY_VALUES),
    calendarIconKey: z.enum(CALENDAR_ICON_KEY_VALUES),
    title: z.string().trim().min(1).max(160),
    summary: boundedTextSchema,
    plannedRpe: z.number().int().min(1).max(10),
    estimatedFatigue: z.enum(estimatedFatigueValues),
    recoveryPriority: z.enum(recoveryPriorityValues),
    goalContext: aiDraftGoalContextSchema,
    metricMode: aiDraftMetricModeSchema,
    segments: z.array(aiDraftSegmentSchema).min(1).max(10),
  })
  .strict();

const aiDraftWeekSchema = z
  .object({
    weekNumber: z.number().int().min(1).max(52),
    phase: z.enum(phaseValues),
    theme: boundedTextSchema,
    microcycleIntent: boundedTextSchema,
    cutbackWeek: z.boolean(),
    taperWeek: z.boolean(),
    plannedWorkouts: z.array(aiDraftWorkoutSchema).min(1).max(7),
  })
  .strict();

export const aiFirstPlanDraftSchema = z
  .object({
    schemaVersion: z.literal(AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION),
    planName: z.string().trim().min(1).max(160),
    generatedFor: z.string().trim().min(1).max(160),
    goal: z
      .object({
        goalType: z.string().trim().min(1).max(80),
        goalLabel: z.string().trim().min(1).max(160),
        goalStyle: nullableBoundedTextSchema,
        targetTime: z.string().trim().min(1).max(32).nullable(),
        targetDate: isoDateSchema.nullable(),
      })
      .strict(),
    startDate: isoDateSchema,
    targetDate: isoDateSchema.nullable(),
    preparationHorizonWeeks: z.number().int().min(1).max(52),
    planPreferences: z
      .object({
        preferredRunningDays: z.array(z.enum(weekdayValues)).min(1).max(7),
        fixedRestDays: z.array(z.enum(weekdayValues)).max(7),
        preferredLongRunDay: z.enum(weekdayValues).nullable(),
        maxRunningDaysPerWeek: z.number().int().min(1).max(7),
      })
      .strict(),
    reviewAssumptions: z.array(z.string().trim().min(1).max(280)).max(12),
    metricPolicySummary: z.string().trim().min(1).max(360),
    weeks: z.array(aiDraftWeekSchema).min(1).max(52),
  })
  .strict();

export type AiFirstPlanDraft = z.output<typeof aiFirstPlanDraftSchema>;

export interface AiFirstPlanBlueprintTraceMetadata {
  sourceKind: string | null;
  sourceStatus:
    | "ai_authored"
    | "repaired_ai_draft"
    | "deterministic_fallback"
    | "blueprint_unavailable";
  fallbackReason: string | null;
  model: string | null;
  timeoutMs: number | null;
  elapsedMs: number | null;
  opsMode?: string | null;
  opsFixture?: string | null;
  requestSummary: {
    goalFamily: string;
    goalType: string;
    goalStyle: string | null;
    goalDistance: string;
    targetTimePresent: boolean;
    targetDate: string | null;
    runningDaysPerWeek: number;
    fixedRestDays: string[];
    preferredLongRunDay: string | null;
  };
  blueprintCompleteness?: {
    expectedWeekCount: number;
    actualWeekCount: number;
    expectedRequiredSlotCount: number;
    actualAuthoredWorkoutCount: number;
    missingWeekNumbers: number[];
    firstMissingRequiredDates: string[];
  };
  blueprintHorizonStrategy?: {
    requestedHorizonWeeks: number;
    aiAuthoredHorizonWeeks: number;
    backendExtendedWeeks: number;
    promptRequiredSlotCount: number;
    finalRequiredSlotCount: number;
    promptCharEstimateBefore: number | null;
    promptCharEstimateAfter: number | null;
    finalWorkoutCount: number | null;
  };
  requiredCadenceSlots: Array<{
    weekNumber: number;
    date: string;
    weekday: string;
    kind: string;
    identityOptions: string[];
    purpose: string;
  }>;
  authoredBlueprintWeeks: Array<{
    weekNumber: number;
    phase: string | null;
    theme: string | null;
    identities: string[];
    families: string[];
    icons: string[];
    dates: string[];
  }>;
  validationIssueCodes: string[];
  validationIssueSummary: string[];
  repairs: string[];
  normalizedCanonicalWeeks: Array<{
    weekNumber: number;
    identities: string[];
    families: string[];
    icons: string[];
  }>;
  deterministicFallbackBoundary: {
    used: boolean;
    reason: string | null;
  };
  finalReviewedPlanIdentityCounts: Record<string, number>;
  finalReviewedPlanFamilyCounts: Record<string, number>;
  finalReviewedPlanIconCounts: Record<string, number>;
  persistedIdentityCounts: Record<string, number> | null;
}

export interface AiFirstPlanDraftMetadata {
  status: "ai_authored" | "repaired_ai_draft" | "expanded_from_envelope" | "deterministic_fallback";
  source:
    | "openai_ai_first_plan_draft"
    | "openai_ai_first_plan_blueprint"
    | "openai_ai_first_plan_envelope"
    | "deterministic_structured_generator";
  validationIssues: string[];
  repairs: string[];
  reviewAssumptions: string[];
  metricPolicySummary: string;
  blueprintTrace?: AiFirstPlanBlueprintTraceMetadata | null;
  envelopeTrace?: unknown;
}

export type AiFirstPlanDraftNormalizationResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      metadata: AiFirstPlanDraftMetadata;
    }
  | {
      ok: false;
      reason: string;
      issues: NormalizationIssue[];
      fallback: AiFirstPlanDraftMetadata;
    };

export interface AiFirstPlanDraftPromptInput {
  authoringInput: StructuredAuthoringInput;
  today?: string;
  referenceExample?: unknown;
}

export function buildAiFirstPlanDraftPrompt({
  authoringInput,
  today = todayIso(),
  referenceExample,
}: AiFirstPlanDraftPromptInput) {
  return {
    systemPrompt: buildAiFirstPlanDraftSystemPrompt(),
    userPrompt: buildAiFirstPlanDraftUserPrompt({ authoringInput, today, referenceExample }),
    responseSchema: aiFirstPlanDraftOpenAiSchema,
  };
}

export function normalizeAiFirstPlanDraftToTrainingPlan({
  draft,
  authoringInput,
}: {
  draft: unknown;
  authoringInput: StructuredAuthoringInput;
}): AiFirstPlanDraftNormalizationResult {
  const parsedDraft = aiFirstPlanDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    return failedAiDraftNormalization(
      "ai_first_plan_draft_schema_invalid",
      parsedDraft.error.issues.slice(0, 12).map((issue) => ({
        code: "schema_invalid",
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    );
  }

  const context = buildNormalizationContext(authoringInput);
  const issues: NormalizationIssue[] = [];
  const repairs: string[] = [];

  validateDraftPlanShell(parsedDraft.data, context, issues);

  if (issues.length > 0) {
    return failedAiDraftNormalization("ai_first_plan_draft_validation_failed", issues);
  }

  const normalizedWorkouts = parsedDraft.data.weeks.flatMap((week) =>
    week.plannedWorkouts.map((workout, index) =>
      normalizeAiDraftWorkout({
        draft: parsedDraft.data,
        week,
        workout,
        index,
        context,
        repairs,
        issues,
      }),
    ),
  );

  validateNormalizedPlanDoctrine(normalizedWorkouts, context, issues);

  if (issues.length > 0) {
    return failedAiDraftNormalization("ai_first_plan_draft_validation_failed", issues);
  }

  const endDate = normalizedWorkouts.at(-1)?.date ?? parsedDraft.data.startDate;
  const candidatePlan = {
    schema_version: FUTURE_TEMPLATE_VERSION,
    plan_id: `ai-first-plan-${slugify(authoringInput.goal.goalType)}-${parsedDraft.data.startDate}`,
    plan_name: parsedDraft.data.planName,
    source_kind: "ai_first_plan_draft_v1",
    created_at: new Date(`${parsedDraft.data.startDate}T00:00:00.000Z`).toISOString(),
    generated_for: parsedDraft.data.generatedFor,
    goal: {
      goal_type: authoringInput.goal.goalType,
      goal_label: authoringInput.goal.goalLabel,
      ...(authoringInput.schedule.targetDate || authoringInput.goal.targetEventName
        ? {
            target_event: {
              ...(authoringInput.goal.targetEventName
                ? { event_name: authoringInput.goal.targetEventName }
                : {}),
              ...(authoringInput.schedule.targetDate
                ? { event_date: authoringInput.schedule.targetDate }
                : {}),
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
      ...(authoringInput.runnerProfile.baselineLongRunDurationMin
        ? {
            baseline_long_run_duration_min: authoringInput.runnerProfile.baselineLongRunDurationMin,
          }
        : {}),
      ...(authoringInput.runnerProfile.age ? { age: authoringInput.runnerProfile.age } : {}),
      ...(authoringInput.currentLevel.recentResultSummary
        ? { recent_result_summary: authoringInput.currentLevel.recentResultSummary }
        : {}),
      ...(authoringInput.currentLevel.recent5kPaceSecondsPerKm
        ? {
            current_easy_pace_range: authoringInput.currentLevel.currentEasyPaceRange ?? undefined,
          }
        : {}),
    },
    start_date: parsedDraft.data.startDate,
    preparation_horizon_weeks: parsedDraft.data.preparationHorizonWeeks,
    ...(parsedDraft.data.targetDate ? { target_date: parsedDraft.data.targetDate } : {}),
    plan_preferences: {
      preferred_running_days: authoringInput.availability.preferredRunningDays,
      blocked_days: authoringInput.availability.unavailableDays,
      preferred_long_run_day: authoringInput.availability.preferredLongRunDay ?? undefined,
      max_running_days_per_week: authoringInput.availability.maxRunningDaysPerWeek,
      allow_back_to_back_days: authoringInput.availability.allowBackToBackDays,
      terrain_focus: authoringInput.preferences.terrainFocus,
    },
    training_constraints: {
      running_days_per_week: authoringInput.availability.maxRunningDaysPerWeek,
      full_rest_days: authoringInput.availability.unavailableDays,
      ...(authoringInput.availability.preferredLongRunDay
        ? { long_run_day: authoringInput.availability.preferredLongRunDay }
        : {}),
    },
    planned_workouts: normalizedWorkouts,
  };

  const parsedPlan = trainingPlanV2Schema.safeParse(candidatePlan);

  if (!parsedPlan.success) {
    return failedAiDraftNormalization(
      "ai_first_plan_training_plan_v2_invalid",
      parsedPlan.error.issues.slice(0, 12).map((issue) => ({
        code: "training_plan_v2_invalid",
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    );
  }

  return {
    ok: true,
    canonicalPlan: parsedPlan.data,
    metadata: {
      status: repairs.length > 0 ? "repaired_ai_draft" : "ai_authored",
      source: "openai_ai_first_plan_draft",
      validationIssues: [],
      repairs,
      reviewAssumptions: parsedDraft.data.reviewAssumptions,
      metricPolicySummary: parsedDraft.data.metricPolicySummary,
    },
  };
}

function buildNormalizationContext(authoringInput: StructuredAuthoringInput) {
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const runningDays = new Set(authoringInput.availability.preferredRunningDays);
  const paceTargetsAllowed = Boolean(
    authoringInput.execution.watchAccess === "watch_or_app" &&
    (authoringInput.execution.guidancePreference === "pace" ||
      authoringInput.execution.guidancePreference === "mixed") &&
    authoringInput.currentLevel.recent5kPaceSecondsPerKm,
  );
  const estimatedMaxHr =
    typeof authoringInput.runnerProfile.age === "number"
      ? Math.round(208 - 0.7 * authoringInput.runnerProfile.age)
      : null;
  const lowSupportBuildConsistency =
    authoringInput.goal.goalType === "build_consistency" &&
    (authoringInput.runnerProfile.experienceLevel === "new_runner" ||
      authoringInput.availability.maxRunningDaysPerWeek <= 3 ||
      (!authoringInput.currentLevel.recent5kPaceSecondsPerKm && !authoringInput.goal.targetTime));

  return {
    authoringInput,
    fixedRestDays,
    runningDays,
    paceTargetsAllowed,
    estimatedMaxHr,
    defaultHrAllowed: false,
    lowSupportBuildConsistency,
  };
}

function validateDraftPlanShell(
  draft: AiFirstPlanDraft,
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  if (draft.startDate !== context.authoringInput.schedule.startDate) {
    issues.push({
      code: "start_date_mismatch",
      path: "startDate",
      message: `Draft startDate ${draft.startDate} does not match authoring startDate ${context.authoringInput.schedule.startDate}.`,
    });
  }

  if (draft.preparationHorizonWeeks !== resolveAuthoringHorizonWeeks(context.authoringInput)) {
    issues.push({
      code: "horizon_mismatch",
      path: "preparationHorizonWeeks",
      message: "Draft horizon must match the validated structured authoring horizon.",
    });
  }

  const expectedRestDays = [...context.fixedRestDays].sort();
  const draftRestDays = [...draft.planPreferences.fixedRestDays].sort();

  if (JSON.stringify(expectedRestDays) !== JSON.stringify(draftRestDays)) {
    issues.push({
      code: "fixed_rest_days_mismatch",
      path: "planPreferences.fixedRestDays",
      message: "Draft fixed rest days must match validated authoring input.",
    });
  }

  if (
    draft.planPreferences.maxRunningDaysPerWeek !==
    context.authoringInput.availability.maxRunningDaysPerWeek
  ) {
    issues.push({
      code: "running_days_per_week_mismatch",
      path: "planPreferences.maxRunningDaysPerWeek",
      message: "Draft max running days/week must match validated authoring input.",
    });
  }

  const seenDates = new Set<string>();
  const expectedHorizonWeeks = resolveAuthoringHorizonWeeks(context.authoringInput);

  if (draft.weeks.length !== expectedHorizonWeeks) {
    issues.push({
      code: "week_count_mismatch",
      path: "weeks",
      message: `Draft must include exactly ${expectedHorizonWeeks} week(s).`,
    });
  }

  for (const week of draft.weeks) {
    if (week.plannedWorkouts.length !== 7) {
      issues.push({
        code: "incomplete_week",
        path: `weeks.${week.weekNumber}.plannedWorkouts`,
        message: `Week ${week.weekNumber} must include all 7 calendar days, including rest days.`,
      });
    }

    const nonRestCount = week.plannedWorkouts.filter(
      (workout) => workout.workoutFamily !== "rest",
    ).length;

    if (nonRestCount !== context.authoringInput.availability.maxRunningDaysPerWeek) {
      issues.push({
        code: "running_day_count_mismatch",
        path: `weeks.${week.weekNumber}.plannedWorkouts`,
        message: `Week ${week.weekNumber} has ${nonRestCount} running days; expected ${context.authoringInput.availability.maxRunningDaysPerWeek}.`,
      });
    }

    for (const workout of week.plannedWorkouts) {
      if (seenDates.has(workout.date)) {
        issues.push({
          code: "duplicate_workout_date",
          path: `weeks.${week.weekNumber}.plannedWorkouts`,
          message: `${workout.date} appears more than once.`,
        });
      }

      seenDates.add(workout.date);

      if (weekdayLong(workout.date) !== workout.weekday) {
        issues.push({
          code: "weekday_mismatch",
          path: `${workout.date}.weekday`,
          message: `${workout.date} is ${weekdayLong(workout.date)}, not ${workout.weekday}.`,
        });
      }

      if (context.fixedRestDays.has(workout.weekday) && workout.workoutFamily !== "rest") {
        issues.push({
          code: "fixed_rest_day_violation",
          path: `${workout.date}.workoutFamily`,
          message: `${workout.date} is a fixed rest day and cannot contain a non-rest workout.`,
        });
      }
    }
  }

  const allDates = draft.weeks.flatMap((week) =>
    week.plannedWorkouts.map((workout) => workout.date),
  );
  const sortedDates = [...allDates].sort();
  const expectedEndDate = addDaysIso(
    context.authoringInput.schedule.startDate,
    expectedHorizonWeeks * 7 - 1,
  );

  if (sortedDates[0] !== context.authoringInput.schedule.startDate) {
    issues.push({
      code: "start_date_missing",
      path: "weeks",
      message: `Draft must start on ${context.authoringInput.schedule.startDate}.`,
    });
  }

  if (sortedDates.at(-1) !== expectedEndDate) {
    issues.push({
      code: "end_date_missing",
      path: "weeks",
      message: `Draft must cover the full requested horizon through ${expectedEndDate}.`,
    });
  }

  for (let index = 1; index < sortedDates.length; index += 1) {
    if (diffDaysIso(sortedDates[index]!, sortedDates[index - 1]!) > 1) {
      issues.push({
        code: "date_gap",
        path: "weeks",
        message: "Draft dates must be contiguous enough for calendar rendering.",
      });
      break;
    }
  }
}

function resolveAuthoringHorizonWeeks(authoringInput: StructuredAuthoringInput) {
  if (authoringInput.schedule.preparationHorizonWeeks) {
    return authoringInput.schedule.preparationHorizonWeeks;
  }

  if (authoringInput.schedule.targetDate) {
    return Math.max(
      1,
      Math.ceil(
        (diffDaysIso(authoringInput.schedule.targetDate, authoringInput.schedule.startDate) + 1) /
          7,
      ),
    );
  }

  return 1;
}

function normalizeAiDraftWorkout({
  draft,
  week,
  workout,
  index,
  context,
  repairs,
  issues,
}: {
  draft: AiFirstPlanDraft;
  week: AiDraftWeek;
  workout: AiDraftWorkout;
  index: number;
  context: ReturnType<typeof buildNormalizationContext>;
  repairs: string[];
  issues: NormalizationIssue[];
}): CanonicalWorkout {
  const resolvedWorkout = resolveCanonicalWorkoutModel({
    workoutType: canonicalFamilyToLegacyWorkoutType(workout.workoutFamily, workout.workoutIdentity),
    workoutFamily: workout.workoutFamily,
    workoutIdentity: workout.workoutIdentity,
    calendarIconKey: workout.calendarIconKey,
    title: workout.title,
    steps: workout.segments.map((segment) => ({
      segment_type: segment.segmentType,
      label: segment.label,
      target: normalizeAiDraftTarget({
        workout,
        segment,
        context,
        repairs,
      }),
    })),
  });

  if (
    resolvedWorkout.workoutFamily !== workout.workoutFamily ||
    resolvedWorkout.calendarIconKey !== workout.calendarIconKey
  ) {
    issues.push({
      code: "taxonomy_mismatch",
      path: `${workout.date}.workoutIdentity`,
      message: `${workout.workoutIdentity} must use family ${resolvedWorkout.workoutFamily} and icon ${resolvedWorkout.calendarIconKey}.`,
    });
  }

  validateWorkoutDoctrine(workout, week, context, issues);

  const segments =
    workout.workoutFamily === "rest"
      ? normalizeRestSegments(workout)
      : normalizeExecutableStepInstructions(
          workout.segments.map((segment, segmentIndex) =>
            normalizeAiDraftSegment({
              workout,
              segment,
              segmentIndex,
              context,
              repairs,
            }),
          ),
        );
  const metricMode = buildWorkoutMetricMode(segments);

  return {
    workout_id: `ai-${slugify(workout.workoutIdentity)}-${workout.date}`,
    date: workout.date,
    weekday: workout.weekday,
    week_number: week.weekNumber,
    phase: week.phase,
    workout_type: canonicalFamilyToLegacyWorkoutType(
      resolvedWorkout.workoutFamily,
      resolvedWorkout.workoutIdentity,
    ),
    source_workout_type: resolvedWorkout.workoutIdentity,
    workout_family: resolvedWorkout.workoutFamily,
    workout_identity: resolvedWorkout.workoutIdentity,
    calendar_icon_key: resolvedWorkout.calendarIconKey,
    goal_context: normalizeDraftGoalContext(workout.goalContext, draft),
    metric_mode: metricMode,
    title: workout.title,
    summary: workout.summary,
    planned_rpe: workout.plannedRpe,
    estimated_fatigue: workout.estimatedFatigue,
    recovery_priority: workout.recoveryPriority,
    segments,
  };
}

function validateWorkoutDoctrine(
  workout: AiDraftWorkout,
  week: AiDraftWeek,
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  if (workout.workoutFamily === "rest") {
    if (
      workout.segments.length > 1 ||
      workout.segments.some((segment) => segment.segmentType !== "rest")
    ) {
      issues.push({
        code: "rest_day_not_sparse",
        path: `${workout.date}.segments`,
        message: "Rest days must stay sparse with only rest guidance.",
      });
    }

    return;
  }

  const segmentTypes = new Set(workout.segments.map((segment) => segment.segmentType));
  const substantialDurationMin = estimateWorkoutDurationMin(workout);
  const mustBeStructured =
    substantialDurationMin >= 35 ||
    ["long", "tempo", "intervals", "hills", "trail"].includes(workout.workoutFamily) ||
    /long|tempo|interval|hill|trail|ultra|mountain|threshold/i.test(workout.workoutIdentity);

  if (mustBeStructured) {
    if (!segmentTypes.has("warmup")) {
      issues.push({
        code: "missing_warmup",
        path: `${workout.date}.segments`,
        message: `${workout.title} needs a warmup segment.`,
      });
    }

    if (!workout.segments.some((segment) => mainLikeSegmentTypes.has(segment.segmentType))) {
      issues.push({
        code: "missing_main",
        path: `${workout.date}.segments`,
        message: `${workout.title} needs main-equivalent work.`,
      });
    }

    if (!segmentTypes.has("cooldown")) {
      issues.push({
        code: "missing_cooldown",
        path: `${workout.date}.segments`,
        message: `${workout.title} needs a cooldown segment.`,
      });
    }

    if (workout.segments.length < 3) {
      issues.push({
        code: "one_block_substantial_workout",
        path: `${workout.date}.segments`,
        message: `${workout.title} is too substantial to be a one-block workout.`,
      });
    }
  }

  if (
    context.lowSupportBuildConsistency &&
    [
      "controlled_tempo_session",
      "time_intervals",
      "distance_intervals",
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "race_pace_session",
      "taper_tuneup_run",
    ].includes(workout.workoutIdentity)
  ) {
    issues.push({
      code: "beginner_low_support_quality_cap",
      path: `${workout.date}.workoutIdentity`,
      message:
        "Low-support build-consistency plans cannot use tempo, interval, or race-like identities.",
    });
  }

  if (containsForbiddenCoachingClaims(workout)) {
    issues.push({
      code: "forbidden_coaching_claim",
      path: `${workout.date}.summary`,
      message: "Draft contains exact elevation, medical, rehab, or physiological truth claims.",
    });
  }

  if (week.taperWeek && workout.workoutFamily === "long" && substantialDurationMin >= 150) {
    issues.push({
      code: "taper_long_run_too_large",
      path: `${workout.date}.segments`,
      message: "Taper long runs must stay reduced relative to peak durability work.",
    });
  }
}

function normalizeAiDraftSegment({
  workout,
  segment,
  segmentIndex,
  context,
  repairs,
}: {
  workout: AiDraftWorkout;
  segment: AiDraftSegment;
  segmentIndex: number;
  context: ReturnType<typeof buildNormalizationContext>;
  repairs: string[];
}): CanonicalSegment {
  const prescription = normalizeDraftPrescription(segment);

  return {
    segment_id: `${slugify(workout.workoutIdentity)}_${workout.date}_seg_${segmentIndex + 1}`,
    segment_type: segment.segmentType,
    sequence: segmentIndex + 1,
    label: segment.label,
    guidance: segment.guidance,
    prescription,
    ...durationDistanceFromPrescription(prescription),
    target: normalizeAiDraftTarget({ workout, segment, context, repairs }),
  };
}

function normalizeRestSegments(workout: AiDraftWorkout): CanonicalSegment[] {
  const segment = workout.segments[0];

  return [
    {
      segment_id: `${slugify(workout.workoutIdentity)}_${workout.date}_rest`,
      segment_type: "rest",
      sequence: 1,
      label: segment?.label ?? "Rest",
      guidance: segment?.guidance ?? workout.summary,
      prescription: { mode: "none" },
      target: { cue: segment?.target.cue ?? "No running today." },
    },
  ];
}

function normalizeDraftPrescription(segment: AiDraftSegment): StepPrescription {
  const prescription = segment.prescription;

  if (segment.segmentType === "rest" || segment.segmentType === "fueling") {
    return { mode: "none" };
  }

  if (prescription.mode === "time" && prescription.durationMin) {
    return { mode: "time", duration_min: prescription.durationMin };
  }

  if (prescription.mode === "distance" && prescription.distanceKm) {
    return { mode: "distance", distance_km: prescription.distanceKm };
  }

  if (prescription.mode === "repeats" && prescription.repeatCount && prescription.repeatUnit) {
    return {
      mode: "repeats",
      repeat_count: prescription.repeatCount,
      repeat_unit: normalizeUnitPrescription(prescription.repeatUnit),
      ...(prescription.recoveryUnit
        ? { recovery_unit: normalizeUnitPrescription(prescription.recoveryUnit) }
        : {}),
    };
  }

  return { mode: "none" };
}

function normalizeUnitPrescription(
  unit: NonNullable<AiDraftSegment["prescription"]["repeatUnit"]>,
) {
  if (unit.mode === "time" && unit.durationMin) {
    return { mode: "time" as const, duration_min: unit.durationMin };
  }

  if (unit.mode === "distance" && unit.distanceKm) {
    return { mode: "distance" as const, distance_km: unit.distanceKm };
  }

  return { mode: "none" as const };
}

function durationDistanceFromPrescription(prescription: StepPrescription) {
  if (prescription.mode === "time" && prescription.duration_min) {
    return { duration_min: prescription.duration_min };
  }

  if (prescription.mode === "distance" && prescription.distance_km) {
    return { distance_km: prescription.distance_km };
  }

  return {};
}

function normalizeAiDraftTarget({
  workout,
  segment,
  context,
  repairs,
}: {
  workout: AiDraftWorkout;
  segment: AiDraftSegment;
  context: ReturnType<typeof buildNormalizationContext>;
  repairs: string[];
}): NonNullable<Step["target"]> {
  const target: NonNullable<Step["target"]> = {};

  if (segment.target.intensity) {
    target.intensity = segment.target.intensity;
  }

  if (segment.target.rpe !== null) {
    target.rpe = segment.target.rpe;
  }

  if (segment.target.cue) {
    target.cue = segment.target.cue;
  }

  if (segment.target.hint) {
    target.hint = segment.target.hint;
  }

  if (segment.target.paceMinPerKmRange || segment.target.pace) {
    if (context.paceTargetsAllowed) {
      if (segment.target.paceMinPerKmRange) {
        target.pace_min_per_km_range = segment.target.paceMinPerKmRange;
      }

      if (segment.target.pace) {
        target.pace = segment.target.pace;
      }
    } else {
      repairs.push(`${workout.date}: stripped unsupported pace target from ${segment.label}.`);
    }
  }

  const aiSuppliedHr = Boolean(segment.target.hrBpmRange || segment.target.hrBpm);

  if (aiSuppliedHr) {
    repairs.push(`${workout.date}: replaced AI-supplied HR target on ${segment.label}.`);
  }

  return target;
}

function buildWorkoutMetricMode(segments: CanonicalSegment[]): CanonicalMetricModeJson {
  const hasPace = segments.some((segment) => targetHasMetric(segment.target, "pace"));
  const hasPersonalHr = segments.some(
    (segment) =>
      targetHasMetric(segment.target, "hr") &&
      segment.target?.hr_target_source === "personal_hr_zone",
  );
  const executableMode =
    hasPace && hasPersonalHr
      ? "mixed_metric_executable"
      : hasPace
        ? "pace_executable"
        : hasPersonalHr
          ? "hr_executable"
          : deriveExecutableModeFromSegments(segments);
  const guidance: CanonicalMetricGuidance = hasPace
    ? hasPersonalHr
      ? "mixed"
      : "pace"
    : hasPersonalHr
      ? "heart_rate"
      : "effort";

  return toCanonicalMetricModeJson({
    guidance,
    executableMode,
    paceTargetsAllowed: hasPace,
    hrTargetsAllowed: hasPersonalHr,
    hrTargetSource: hasPersonalHr ? "personal_hr_zone" : "effort_only",
    hrTargetLabel: null,
    hrTargetSourceNote: null,
    reason:
      hasPace && hasPersonalHr
        ? "Pace guidance is gated by benchmark/watch truth, and HR guidance uses personal HR-zone truth."
        : hasPace
          ? "Pace guidance is gated by benchmark/watch truth."
          : hasPersonalHr
            ? "HR guidance uses personal HR-zone truth."
            : executableMode === "structure_only_executable"
              ? "Workout is executable by numeric duration, distance, repeat, work, and recovery structure without pace or HR targets."
              : "Workout requires correction because it lacks executable metric truth and executable numeric structure.",
  });
}

function targetHasMetric(target: Step["target"] | undefined, metric: "pace" | "hr") {
  if (!target) {
    return false;
  }

  if (metric === "pace") {
    return Boolean(target.pace_min_per_km_range || target.pace_range_min_km || target.pace);
  }

  return Boolean(target.hr_bpm_range || target.hr_bpm);
}

function normalizeDraftGoalContext(
  goalContext: AiDraftWorkout["goalContext"],
  draft: AiFirstPlanDraft,
): CanonicalWorkout["goal_context"] {
  const normalized = normalizeCanonicalGoalContext(goalContext);

  if (normalized) {
    return {
      goal_type: normalized.goalType,
      ...(normalized.goalStyle ? { goal_style: normalized.goalStyle } : {}),
      ...(normalized.terrainFocus ? { terrain_focus: normalized.terrainFocus } : {}),
      ...(normalized.targetDate ? { target_date: normalized.targetDate } : {}),
      ...(normalized.targetTime ? { target_time: normalized.targetTime } : {}),
    };
  }

  return {
    goal_type: draft.goal.goalType,
    ...(draft.goal.goalStyle ? { goal_style: draft.goal.goalStyle } : {}),
    ...(draft.goal.targetDate ? { target_date: draft.goal.targetDate } : {}),
    ...(draft.goal.targetTime ? { target_time: draft.goal.targetTime } : {}),
  };
}

function validateNormalizedPlanDoctrine(
  workouts: CanonicalWorkout[],
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  const longRuns = workouts.filter(
    (workout) => workout.workout_family === "long" || workout.workout_type === "long_run",
  );
  const preferredLongRunDay = context.authoringInput.availability.preferredLongRunDay;

  if (preferredLongRunDay) {
    const misplacedLongRuns = longRuns.filter((workout) => workout.weekday !== preferredLongRunDay);

    if (misplacedLongRuns.length > 0) {
      issues.push({
        code: "preferred_long_run_day_violation",
        path: "planned_workouts",
        message: `Long runs should land on ${preferredLongRunDay} when feasible.`,
      });
    }
  }

  const longRunLoads = longRuns.map((workout) => estimateCanonicalWorkoutLoad(workout));

  for (let index = 1; index < longRunLoads.length; index += 1) {
    if (longRunLoads[index]! > longRunLoads[index - 1]! * 1.45) {
      issues.push({
        code: "long_run_progression_too_steep",
        path: "planned_workouts",
        message: "Long-run progression jumps too aggressively between weeks.",
      });
      break;
    }
  }

  const taperLongRuns = longRuns.filter((workout) => /taper/i.test(workout.phase));
  const preTaperPeak = Math.max(
    0,
    ...longRuns
      .filter((workout) => !/taper/i.test(workout.phase))
      .map((workout) => estimateCanonicalWorkoutLoad(workout)),
  );

  if (
    preTaperPeak > 0 &&
    taperLongRuns.some((workout) => estimateCanonicalWorkoutLoad(workout) >= preTaperPeak)
  ) {
    issues.push({
      code: "taper_peak_violation",
      path: "planned_workouts",
      message: "Taper long runs must stay below the pre-taper long-run peak.",
    });
  }
}

function estimateWorkoutDurationMin(workout: AiDraftWorkout) {
  return workout.segments.reduce(
    (total, segment) => total + estimateSegmentDurationMin(segment),
    0,
  );
}

function estimateSegmentDurationMin(segment: AiDraftSegment) {
  const prescription = segment.prescription;

  if (prescription.mode === "time" && prescription.durationMin) {
    return prescription.durationMin;
  }

  if (prescription.mode === "distance" && prescription.distanceKm) {
    return prescription.distanceKm * 6;
  }

  if (prescription.mode === "repeats" && prescription.repeatCount && prescription.repeatUnit) {
    const work = estimateUnitDurationMin(prescription.repeatUnit);
    const recovery = prescription.recoveryUnit
      ? estimateUnitDurationMin(prescription.recoveryUnit)
      : 0;

    return prescription.repeatCount * (work + recovery);
  }

  return 0;
}

function estimateUnitDurationMin(unit: NonNullable<AiDraftSegment["prescription"]["repeatUnit"]>) {
  if (unit.mode === "time" && unit.durationMin) {
    return unit.durationMin;
  }

  if (unit.mode === "distance" && unit.distanceKm) {
    return unit.distanceKm * 6;
  }

  return 0;
}

function estimateCanonicalWorkoutLoad(workout: CanonicalWorkout) {
  return workout.segments.reduce((total, segment) => {
    const prescription = segment.prescription;

    if (typeof segment.distance_km === "number") {
      return total + segment.distance_km;
    }

    if (prescription?.distance_km) {
      return total + prescription.distance_km;
    }

    if (typeof segment.duration_min === "number") {
      return total + segment.duration_min / 6;
    }

    if (prescription?.duration_min) {
      return total + prescription.duration_min / 6;
    }

    return total;
  }, 0);
}

function containsForbiddenCoachingClaims(workout: AiDraftWorkout) {
  const text = JSON.stringify(workout).toLowerCase();

  return (
    /\b(?:elevation gain|vertical gain|vert)\b.*\b\d+\s*(?:m|meters|metres|ft|feet)\b/.test(text) ||
    /\b\d+\s*(?:m|meters|metres|ft|feet)\b.*\b(?:elevation gain|vertical gain|vert)\b/.test(text) ||
    /\b(?:diagnose|diagnosis|treat|treatment|rehab|rehabilitation|therapy|medical)\b/.test(text) ||
    /\b(?:threshold hr|aet|anaerobic threshold|lactate threshold heart rate)\b/.test(text)
  );
}

function failedAiDraftNormalization(
  reason: string,
  issues: NormalizationIssue[],
): Extract<AiFirstPlanDraftNormalizationResult, { ok: false }> {
  return {
    ok: false,
    reason,
    issues,
    fallback: {
      status: "deterministic_fallback",
      source: "deterministic_structured_generator",
      validationIssues: issues.map((issue) => issue.message).slice(0, 12),
      repairs: [],
      reviewAssumptions: [
        "Hito should use the deterministic structured generator because the AI-authored draft did not pass backend validation.",
      ],
      metricPolicySummary:
        "Deterministic fallback preserves existing pace, default-HR, fixed-rest-day, and effort-safety gates.",
    },
  };
}

function buildAiFirstPlanDraftSystemPrompt() {
  return [
    "You author a complete Hito Running first-plan draft from validated structured setup truth.",
    "Return only the ai-first-plan-draft-v1 JSON object requested by the schema.",
    "Your draft is not persisted directly. Hito backend validation normalizes it into canonical training-plan-v2 truth.",
    "Use Hito workout taxonomy only: workoutFamily, workoutIdentity, and calendarIconKey must be valid schema values.",
    "Respect fixed rest days as hard constraints and keep rest workouts sparse.",
    "Use the requested running days/week and preferred long-run day whenever feasible.",
    "Every substantial non-rest workout needs warmup, main-equivalent work, and cooldown segments with executable guidance.",
    "Do not output user ids, plan ids, logs, completion state, Garmin/Strava placeholders, provider sync placeholders, AI verdicts, or feedback placeholders.",
    "Do not invent medical, rehab, threshold-HR, lab-tested, exact elevation, or route-matching claims.",
    "Do not output numeric HR bpm targets. Set target.hrBpmRange and target.hrBpm to null; the backend may add labelled default estimated HR after validation.",
    "Do not invent personalized HR zones. If referring to HR, keep it non-numeric and clearly not personalized.",
    "Pace targets are allowed only when watch/app access plus pace or mixed preference plus usable recent benchmark truth support them.",
    "Return exactly preparationHorizonWeeks weeks and exactly seven plannedWorkouts per week, including rest days.",
    "Keep review assumptions concise and honest about weak support, target-time uncertainty, conservative load, and default HR guidance.",
  ].join("\n");
}

function buildAiFirstPlanDraftUserPrompt({
  authoringInput,
  today,
  referenceExample,
}: {
  authoringInput: StructuredAuthoringInput;
  today: string;
  referenceExample: unknown;
}) {
  return [
    `Today is ${today}.`,
    "Validated structured setup truth:",
    JSON.stringify(buildPromptAuthoringSummary(authoringInput)),
    "",
    "Allowed taxonomy:",
    JSON.stringify({
      workoutFamilies: CANONICAL_WORKOUT_FAMILY_VALUES,
      workoutIdentities: CANONICAL_WORKOUT_IDENTITY_VALUES,
      calendarIconKeys: CALENDAR_ICON_KEY_VALUES,
      metricGuidance: CANONICAL_METRIC_GUIDANCE_VALUES,
      hrTargetSources: HR_TARGET_SOURCE_VALUES,
      segmentTypes: segmentTypeValues,
    }),
    "",
    "Metric policy:",
    JSON.stringify(buildPromptMetricPolicy(authoringInput)),
    "",
    "Reference-style example guidance:",
    JSON.stringify(buildReferenceStyleSummary(referenceExample)),
  ].join("\n");
}

function buildPromptAuthoringSummary(authoringInput: StructuredAuthoringInput) {
  return {
    goal: authoringInput.goal,
    schedule: authoringInput.schedule,
    runnerProfile: authoringInput.runnerProfile,
    currentLevel: authoringInput.currentLevel,
    availability: authoringInput.availability,
    preferences: authoringInput.preferences,
    execution: authoringInput.execution,
  };
}

function buildPromptMetricPolicy(authoringInput: StructuredAuthoringInput) {
  return {
    pace:
      authoringInput.execution.watchAccess === "watch_or_app" &&
      (authoringInput.execution.guidancePreference === "pace" ||
        authoringInput.execution.guidancePreference === "mixed") &&
      authoringInput.currentLevel.recent5kPaceSecondsPerKm
        ? "Broad pace targets may be included where the benchmark supports them."
        : "Do not include numeric pace targets; use effort/cue language.",
    heartRate:
      typeof authoringInput.runnerProfile.age === "number"
        ? "Do not include numeric HR bpm targets. Backend may add labelled Default HR guidance from age after validation."
        : "Do not include numeric HR targets because age and personal HR zones are absent.",
  };
}

function buildReferenceStyleSummary(referenceExample: unknown) {
  if (!referenceExample || typeof referenceExample !== "object") {
    return {
      note: "Use varied week-by-week workout identities, warmup/main/cooldown structure, and runner-readable cues. Do not copy runtime placeholders.",
    };
  }

  const record = referenceExample as Record<string, unknown>;
  const workouts = Array.isArray(record.planned_workouts) ? record.planned_workouts : [];

  return {
    note: "Reference is for richness and weekly structure only; do not copy runtime placeholders, completion state, provider sync, feedback, or unsupported metrics.",
    sampleWorkouts: workouts.slice(0, 3).map((workout) => {
      const workoutRecord = workout as Record<string, unknown>;

      return {
        title: workoutRecord.title,
        summary: workoutRecord.summary,
        workoutType: workoutRecord.workout_type,
        phase: workoutRecord.phase,
        segments: Array.isArray(workoutRecord.segments)
          ? workoutRecord.segments.slice(0, 3).map((segment) => {
              const segmentRecord = segment as Record<string, unknown>;

              return {
                segmentType: segmentRecord.segment_type,
                label: segmentRecord.label,
                guidance: segmentRecord.guidance,
              };
            })
          : [],
      };
    }),
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const aiDraftGoalContextOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["goalType", "goalStyle", "terrainFocus", "targetDate", "targetTime"],
  properties: {
    goalType: { type: "string", maxLength: 80 },
    goalStyle: { type: ["string", "null"], maxLength: 360 },
    terrainFocus: { type: ["string", "null"], enum: ["standard", "rolling", "mountain", null] },
    targetDate: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    targetTime: { type: ["string", "null"], maxLength: 32 },
  },
} as const;

const aiDraftMetricModeOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "guidance",
    "paceTargetsAllowed",
    "hrTargetsAllowed",
    "hrTargetSource",
    "hrTargetLabel",
    "hrTargetSourceNote",
    "reason",
  ],
  properties: {
    guidance: { type: "string", enum: [...CANONICAL_METRIC_GUIDANCE_VALUES] },
    paceTargetsAllowed: { type: "boolean" },
    hrTargetsAllowed: { type: "boolean" },
    hrTargetSource: { type: "string", enum: [...HR_TARGET_SOURCE_VALUES] },
    hrTargetLabel: { type: ["string", "null"], maxLength: 360 },
    hrTargetSourceNote: { type: ["string", "null"], maxLength: 360 },
    reason: { type: "string", maxLength: 200 },
  },
} as const;

const aiDraftUnitPrescriptionOpenAiSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["mode", "durationMin", "distanceKm"],
  properties: {
    mode: { type: "string", enum: ["time", "distance", "none"] },
    durationMin: { type: ["number", "null"] },
    distanceKm: { type: ["number", "null"] },
  },
} as const;

const aiDraftSegmentPrescriptionOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "durationMin", "distanceKm", "repeatCount", "repeatUnit", "recoveryUnit"],
  properties: {
    mode: { type: "string", enum: ["time", "distance", "repeats", "none"] },
    durationMin: { type: ["number", "null"] },
    distanceKm: { type: ["number", "null"] },
    repeatCount: { type: ["integer", "null"] },
    repeatUnit: aiDraftUnitPrescriptionOpenAiSchema,
    recoveryUnit: aiDraftUnitPrescriptionOpenAiSchema,
  },
} as const;

const aiDraftTargetOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "intensity",
    "rpe",
    "cue",
    "hint",
    "paceMinPerKmRange",
    "pace",
    "hrBpmRange",
    "hrBpm",
    "hrTargetSource",
    "label",
    "sourceNote",
  ],
  properties: {
    intensity: { type: ["string", "null"], maxLength: 360 },
    rpe: { type: ["string", "number", "null"] },
    cue: { type: ["string", "null"], maxLength: 360 },
    hint: { type: ["string", "null"], maxLength: 360 },
    paceMinPerKmRange: { type: ["string", "null"], maxLength: 360 },
    pace: { type: ["string", "null"], maxLength: 360 },
    hrBpmRange: { type: ["string", "null"], maxLength: 360 },
    hrBpm: { type: ["string", "null"], maxLength: 360 },
    hrTargetSource: { type: ["string", "null"], enum: [...HR_TARGET_SOURCE_VALUES, null] },
    label: { type: ["string", "null"], maxLength: 360 },
    sourceNote: { type: ["string", "null"], maxLength: 360 },
  },
} as const;

const aiDraftSegmentOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["segmentId", "segmentType", "label", "sequence", "prescription", "guidance", "target"],
  properties: {
    segmentId: { type: "string", maxLength: 120 },
    segmentType: { type: "string", enum: [...segmentTypeValues] },
    label: { type: "string", maxLength: 120 },
    sequence: { type: "integer", minimum: 1 },
    prescription: aiDraftSegmentPrescriptionOpenAiSchema,
    guidance: { type: "string", maxLength: 360 },
    target: aiDraftTargetOpenAiSchema,
  },
} as const;

export const aiFirstPlanDraftOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "planName",
    "generatedFor",
    "goal",
    "startDate",
    "targetDate",
    "preparationHorizonWeeks",
    "planPreferences",
    "reviewAssumptions",
    "metricPolicySummary",
    "weeks",
  ],
  properties: {
    schemaVersion: { type: "string", enum: [AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION] },
    planName: { type: "string", maxLength: 160 },
    generatedFor: { type: "string", maxLength: 160 },
    goal: {
      type: "object",
      additionalProperties: false,
      required: ["goalType", "goalLabel", "goalStyle", "targetTime", "targetDate"],
      properties: {
        goalType: { type: "string", maxLength: 80 },
        goalLabel: { type: "string", maxLength: 160 },
        goalStyle: { type: ["string", "null"], maxLength: 360 },
        targetTime: { type: ["string", "null"], maxLength: 32 },
        targetDate: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      },
    },
    startDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    targetDate: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    preparationHorizonWeeks: { type: "integer", minimum: 1, maximum: 52 },
    planPreferences: {
      type: "object",
      additionalProperties: false,
      required: [
        "preferredRunningDays",
        "fixedRestDays",
        "preferredLongRunDay",
        "maxRunningDaysPerWeek",
      ],
      properties: {
        preferredRunningDays: {
          type: "array",
          minItems: 1,
          maxItems: 7,
          items: { type: "string", enum: [...weekdayValues] },
        },
        fixedRestDays: {
          type: "array",
          maxItems: 7,
          items: { type: "string", enum: [...weekdayValues] },
        },
        preferredLongRunDay: { type: ["string", "null"], enum: [...weekdayValues, null] },
        maxRunningDaysPerWeek: { type: "integer", minimum: 1, maximum: 7 },
      },
    },
    reviewAssumptions: {
      type: "array",
      maxItems: 12,
      items: { type: "string", maxLength: 280 },
    },
    metricPolicySummary: { type: "string", maxLength: 360 },
    weeks: {
      type: "array",
      minItems: 1,
      maxItems: 52,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "weekNumber",
          "phase",
          "theme",
          "microcycleIntent",
          "cutbackWeek",
          "taperWeek",
          "plannedWorkouts",
        ],
        properties: {
          weekNumber: { type: "integer", minimum: 1, maximum: 52 },
          phase: { type: "string", enum: [...phaseValues] },
          theme: { type: "string", maxLength: 360 },
          microcycleIntent: { type: "string", maxLength: 360 },
          cutbackWeek: { type: "boolean" },
          taperWeek: { type: "boolean" },
          plannedWorkouts: {
            type: "array",
            minItems: 1,
            maxItems: 7,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "date",
                "weekday",
                "workoutFamily",
                "workoutIdentity",
                "calendarIconKey",
                "title",
                "summary",
                "plannedRpe",
                "estimatedFatigue",
                "recoveryPriority",
                "goalContext",
                "metricMode",
                "segments",
              ],
              properties: {
                date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                weekday: { type: "string", enum: [...weekdayValues] },
                workoutFamily: { type: "string", enum: [...CANONICAL_WORKOUT_FAMILY_VALUES] },
                workoutIdentity: { type: "string", enum: [...CANONICAL_WORKOUT_IDENTITY_VALUES] },
                calendarIconKey: { type: "string", enum: [...CALENDAR_ICON_KEY_VALUES] },
                title: { type: "string", maxLength: 160 },
                summary: { type: "string", maxLength: 360 },
                plannedRpe: { type: "integer", minimum: 1, maximum: 10 },
                estimatedFatigue: { type: "string", enum: [...estimatedFatigueValues] },
                recoveryPriority: { type: "string", enum: [...recoveryPriorityValues] },
                goalContext: aiDraftGoalContextOpenAiSchema,
                metricMode: aiDraftMetricModeOpenAiSchema,
                segments: {
                  type: "array",
                  minItems: 1,
                  maxItems: 10,
                  items: aiDraftSegmentOpenAiSchema,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
