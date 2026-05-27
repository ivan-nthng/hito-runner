import { z } from "zod";
import {
  FUTURE_TEMPLATE_VERSION,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import type {
  AiFirstPlanBlueprintTraceMetadata,
  AiFirstPlanDraftMetadata,
} from "@/lib/ai-first-plan-draft-authoring";
import {
  CANONICAL_METRIC_GUIDANCE_VALUES,
  HR_TARGET_SOURCE_VALUES,
  canonicalFamilyToLegacyWorkoutType,
  normalizeCanonicalGoalContext,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalMetricGuidance,
  type CanonicalMetricModeJson,
} from "@/lib/rich-workout-model";
import {
  buildStructuredAuthoringPlan,
  type structuredPlanAuthoringInputSchema,
} from "@/lib/structured-plan-authoring";
import {
  addDaysIso,
  diffDaysIso,
  normalizeExecutableStepInstructions,
  todayIso,
  weekdayLong,
  type Step,
  type StepPrescription,
} from "@/lib/training";

export const AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION = "ai-first-plan-blueprint-v1";

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
const segmentIntentValues = [
  "recovery",
  "easy_aerobic",
  "steady_aerobic",
  "long_durability",
  "tempo_sustained",
  "interval_repeats",
  "hill_strength",
  "trail_terrain",
  "progression",
  "race_tuneup",
  "rest",
] as const;
const metricIntentValues = [
  "effort_only",
  "pace_if_allowed",
  "default_hr_if_allowed",
  "mixed_if_allowed",
] as const;
const authoredWorkoutFamilyValues = [
  "recovery",
  "easy",
  "steady",
  "long",
  "tempo",
  "intervals",
  "progression",
  "race",
  "hills",
  "trail",
] as const;
const authoredWorkoutIdentityValues = [
  "easy_aerobic_run",
  "recovery_jog",
  "steady_aerobic_run",
  "cutback_aerobic_run",
  "easy_run_with_strides",
  "long_aerobic_run",
  "long_run_with_steady_finish",
  "cutback_long_run",
  "taper_long_run",
  "controlled_tempo_session",
  "half_marathon_threshold_durability",
  "marathon_steady_specificity",
  "distance_intervals",
  "time_intervals",
  "5k_sharpening_repeats",
  "10k_rhythm_intervals",
  "progression_run",
  "race_pace_session",
  "taper_tuneup_run",
  "uphill_repeats",
  "rolling_hills_session",
  "technical_trail_easy",
  "controlled_downhill_durability",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
  "ultra_time_on_feet_durability",
  "climbing_steady_run",
  "quality_session",
] as const;
const authoredCalendarIconKeyValues = authoredWorkoutFamilyValues;

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const boundedTextSchema = z.string().trim().min(1).max(360);
const nullableBoundedTextSchema = z.string().trim().min(1).max(360).nullable();
const hardWorkoutFamilies = new Set(["tempo", "intervals", "hills", "race"]);
const mainLikeSegmentTypes = new Set(["main", "tempo_block", "interval_block", "strides"]);
type AuthoredWorkoutIdentity = (typeof authoredWorkoutIdentityValues)[number];
type AuthoredWorkoutFamily = (typeof authoredWorkoutFamilyValues)[number];
type GoalFamilyPolicyKey =
  | "beginner_consistency"
  | "five_k"
  | "ten_k"
  | "half_marathon"
  | "marathon"
  | "ultra"
  | "mountain_trail";

type GoalFamilyCadenceKind = "none" | "quality" | "specialty";
type GoalFamilyCadenceFrequency = "none" | "weekly" | "every_two_weeks";

interface GoalFamilyIdentityPolicy {
  key: GoalFamilyPolicyKey;
  label: string;
  allowedIdentities: Set<AuthoredWorkoutIdentity>;
  expectedSupportIdentities: Set<AuthoredWorkoutIdentity>;
  expectedQualityIdentities: Set<AuthoredWorkoutIdentity>;
  longRunIdentities: Set<AuthoredWorkoutIdentity>;
  cutbackTaperIdentities: Set<AuthoredWorkoutIdentity>;
  specialtyIdentities: Set<AuthoredWorkoutIdentity>;
  excludedIdentities: Set<AuthoredWorkoutIdentity>;
  cadence: {
    kind: GoalFamilyCadenceKind;
    frequency: GoalFamilyCadenceFrequency;
    useLongRunSlot?: boolean;
  };
}

const supportIdentityValues = [
  "easy_aerobic_run",
  "recovery_jog",
  "steady_aerobic_run",
  "cutback_aerobic_run",
  "easy_run_with_strides",
] as const satisfies readonly AuthoredWorkoutIdentity[];
const baseLongRunIdentityValues = [
  "long_aerobic_run",
  "long_run_with_steady_finish",
  "cutback_long_run",
  "taper_long_run",
] as const satisfies readonly AuthoredWorkoutIdentity[];
const cutbackTaperIdentityValues = [
  "cutback_aerobic_run",
  "cutback_long_run",
  "taper_long_run",
  "taper_tuneup_run",
] as const satisfies readonly AuthoredWorkoutIdentity[];
const roadPerformanceIdentityValues = [
  "time_intervals",
  "distance_intervals",
  "5k_sharpening_repeats",
  "10k_rhythm_intervals",
  "controlled_tempo_session",
  "half_marathon_threshold_durability",
  "race_pace_session",
  "taper_tuneup_run",
] as const satisfies readonly AuthoredWorkoutIdentity[];

const identitySet = (values: readonly AuthoredWorkoutIdentity[]) =>
  new Set<AuthoredWorkoutIdentity>(values);
const allSupportAndLongIdentities = [
  ...supportIdentityValues,
  ...baseLongRunIdentityValues,
] as const satisfies readonly AuthoredWorkoutIdentity[];

const goalFamilyIdentityPolicies: Record<GoalFamilyPolicyKey, GoalFamilyIdentityPolicy> = {
  beginner_consistency: {
    key: "beginner_consistency",
    label: "Beginner / consistency",
    allowedIdentities: identitySet([
      ...supportIdentityValues,
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
      "progression_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet(["progression_run"]),
    longRunIdentities: identitySet(["long_aerobic_run"]),
    cutbackTaperIdentities: identitySet([
      "cutback_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    specialtyIdentities: identitySet([]),
    excludedIdentities: identitySet([
      "controlled_tempo_session",
      "time_intervals",
      "distance_intervals",
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "race_pace_session",
      "taper_tuneup_run",
      "quality_session",
    ]),
    cadence: { kind: "none", frequency: "none" },
  },
  five_k: {
    key: "five_k",
    label: "5K",
    allowedIdentities: identitySet([
      ...allSupportAndLongIdentities,
      "progression_run",
      "controlled_tempo_session",
      "time_intervals",
      "distance_intervals",
      "5k_sharpening_repeats",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([
      "5k_sharpening_repeats",
      "time_intervals",
      "distance_intervals",
      "controlled_tempo_session",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    longRunIdentities: identitySet(["long_aerobic_run", "cutback_long_run", "taper_long_run"]),
    cutbackTaperIdentities: identitySet(cutbackTaperIdentityValues),
    specialtyIdentities: identitySet(["5k_sharpening_repeats"]),
    excludedIdentities: identitySet([
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "ultra_time_on_feet_durability",
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "quality_session",
    ]),
    cadence: { kind: "quality", frequency: "weekly" },
  },
  ten_k: {
    key: "ten_k",
    label: "10K",
    allowedIdentities: identitySet([
      ...allSupportAndLongIdentities,
      "progression_run",
      "controlled_tempo_session",
      "time_intervals",
      "distance_intervals",
      "10k_rhythm_intervals",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([
      "10k_rhythm_intervals",
      "time_intervals",
      "distance_intervals",
      "controlled_tempo_session",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    longRunIdentities: identitySet(["long_aerobic_run", "cutback_long_run", "taper_long_run"]),
    cutbackTaperIdentities: identitySet(cutbackTaperIdentityValues),
    specialtyIdentities: identitySet(["10k_rhythm_intervals"]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "ultra_time_on_feet_durability",
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "quality_session",
    ]),
    cadence: { kind: "quality", frequency: "weekly" },
  },
  half_marathon: {
    key: "half_marathon",
    label: "Half marathon",
    allowedIdentities: identitySet([
      ...allSupportAndLongIdentities,
      "progression_run",
      "controlled_tempo_session",
      "half_marathon_threshold_durability",
      "time_intervals",
      "distance_intervals",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([
      "half_marathon_threshold_durability",
      "controlled_tempo_session",
      "time_intervals",
      "distance_intervals",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    longRunIdentities: identitySet([
      "long_aerobic_run",
      "long_run_with_steady_finish",
      "cutback_long_run",
      "taper_long_run",
    ]),
    cutbackTaperIdentities: identitySet(cutbackTaperIdentityValues),
    specialtyIdentities: identitySet([
      "half_marathon_threshold_durability",
      "long_run_with_steady_finish",
    ]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "marathon_steady_specificity",
      "ultra_time_on_feet_durability",
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "quality_session",
    ]),
    cadence: { kind: "quality", frequency: "weekly" },
  },
  marathon: {
    key: "marathon",
    label: "Marathon",
    allowedIdentities: identitySet([
      ...allSupportAndLongIdentities,
      "progression_run",
      "controlled_tempo_session",
      "marathon_steady_specificity",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([
      "marathon_steady_specificity",
      "controlled_tempo_session",
      "race_pace_session",
      "taper_tuneup_run",
    ]),
    longRunIdentities: identitySet([
      "long_aerobic_run",
      "long_run_with_steady_finish",
      "cutback_long_run",
      "taper_long_run",
    ]),
    cutbackTaperIdentities: identitySet(cutbackTaperIdentityValues),
    specialtyIdentities: identitySet([
      "marathon_steady_specificity",
      "long_run_with_steady_finish",
    ]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "ultra_time_on_feet_durability",
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "quality_session",
    ]),
    cadence: { kind: "quality", frequency: "every_two_weeks" },
  },
  ultra: {
    key: "ultra",
    label: "Ultra",
    allowedIdentities: identitySet([
      ...supportIdentityValues,
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
      "cutback_aerobic_run",
      "steady_aerobic_run",
      "ultra_time_on_feet_durability",
      "hike_run_endurance",
      "technical_trail_easy",
      "rolling_hills_session",
      "climbing_steady_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet([]),
    longRunIdentities: identitySet([
      "ultra_time_on_feet_durability",
      "hike_run_endurance",
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    cutbackTaperIdentities: identitySet([
      "cutback_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    specialtyIdentities: identitySet([
      "ultra_time_on_feet_durability",
      "hike_run_endurance",
      "technical_trail_easy",
      "rolling_hills_session",
      "climbing_steady_run",
    ]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "race_pace_session",
      "quality_session",
    ]),
    cadence: { kind: "specialty", frequency: "every_two_weeks" },
  },
  mountain_trail: {
    key: "mountain_trail",
    label: "Mountain / trail",
    allowedIdentities: identitySet([
      ...supportIdentityValues,
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
      "technical_trail_easy",
      "rolling_hills_session",
      "uphill_repeats",
      "controlled_downhill_durability",
      "hike_run_endurance",
      "mountain_long_run_time_on_feet",
      "ultra_time_on_feet_durability",
      "climbing_steady_run",
    ]),
    expectedSupportIdentities: identitySet(supportIdentityValues),
    expectedQualityIdentities: identitySet(["rolling_hills_session", "uphill_repeats"]),
    longRunIdentities: identitySet([
      "mountain_long_run_time_on_feet",
      "hike_run_endurance",
      "ultra_time_on_feet_durability",
      "long_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    cutbackTaperIdentities: identitySet([
      "cutback_aerobic_run",
      "cutback_long_run",
      "taper_long_run",
    ]),
    specialtyIdentities: identitySet([
      "technical_trail_easy",
      "rolling_hills_session",
      "uphill_repeats",
      "controlled_downhill_durability",
      "hike_run_endurance",
      "mountain_long_run_time_on_feet",
      "ultra_time_on_feet_durability",
      "climbing_steady_run",
    ]),
    excludedIdentities: identitySet([
      "5k_sharpening_repeats",
      "10k_rhythm_intervals",
      "half_marathon_threshold_durability",
      "marathon_steady_specificity",
      "race_pace_session",
      "taper_tuneup_run",
      "quality_session",
    ]),
    cadence: { kind: "specialty", frequency: "every_two_weeks" },
  },
};

type RequiredCadenceSlot = {
  date: string;
  weekday: string;
  kind: GoalFamilyCadenceKind;
  identityOptions: AuthoredWorkoutIdentity[];
  purpose: string;
};

type StructuredAuthoringInput = z.output<typeof structuredPlanAuthoringInputSchema>;
type AiBlueprintWeek = AiFirstPlanBlueprint["weeks"][number];
type AiBlueprintWorkout = AiBlueprintWeek["plannedWorkouts"][number];
type CanonicalWorkout = TrainingPlanV2["planned_workouts"][number];
type CanonicalSegment = CanonicalWorkout["segments"][number];
type NormalizationIssue = { code: string; message: string; path?: string };

const aiBlueprintWorkoutSchema = z
  .object({
    date: isoDateSchema.nullable(),
    weekday: z.enum(weekdayValues),
    workoutFamily: z.enum(authoredWorkoutFamilyValues),
    workoutIdentity: z.enum(authoredWorkoutIdentityValues),
    calendarIconKey: z.enum(authoredCalendarIconKeyValues),
    title: z.string().trim().min(1).max(160),
    summary: boundedTextSchema,
    plannedRpe: z.number().int().min(1).max(10),
    estimatedFatigue: z.enum(estimatedFatigueValues),
    recoveryPriority: z.enum(recoveryPriorityValues),
    segmentIntent: z.enum(segmentIntentValues),
    metricIntent: z.enum(metricIntentValues),
  })
  .strict();

const aiBlueprintWeekSchema = z
  .object({
    weekNumber: z.number().int().min(1).max(52),
    phase: z.enum(phaseValues),
    theme: boundedTextSchema,
    microcycleIntent: boundedTextSchema,
    cutbackWeek: z.boolean(),
    taperWeek: z.boolean(),
    longRunIntent: nullableBoundedTextSchema,
    longRunProgression: nullableBoundedTextSchema,
    plannedWorkouts: z.array(aiBlueprintWorkoutSchema).min(1).max(7),
  })
  .strict();

export const aiFirstPlanBlueprintSchema = z
  .object({
    schemaVersion: z.literal(AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION),
    planName: z.string().trim().min(1).max(160),
    generatedFor: z.string().trim().min(1).max(160),
    goalSummary: z.string().trim().min(1).max(240),
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
    weeks: z.array(aiBlueprintWeekSchema).min(1).max(52),
  })
  .strict();

export type AiFirstPlanBlueprint = z.output<typeof aiFirstPlanBlueprintSchema>;

export type AiFirstPlanBlueprintNormalizationResult =
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

export interface AiFirstPlanBlueprintPromptInput {
  authoringInput: StructuredAuthoringInput;
  today?: string;
  referenceExample?: unknown;
}

export function buildAiFirstPlanBlueprintPrompt({
  authoringInput,
  today = todayIso(),
  referenceExample,
}: AiFirstPlanBlueprintPromptInput) {
  return {
    systemPrompt: buildAiFirstPlanBlueprintSystemPrompt(),
    userPrompt: buildAiFirstPlanBlueprintUserPrompt({ authoringInput, today, referenceExample }),
    responseSchema: buildAiFirstPlanBlueprintOpenAiSchema(
      authoringInput.availability.maxRunningDaysPerWeek,
    ),
  };
}

export function normalizeAiFirstPlanBlueprintToTrainingPlan({
  blueprint,
  authoringInput,
}: {
  blueprint: unknown;
  authoringInput: StructuredAuthoringInput;
}): AiFirstPlanBlueprintNormalizationResult {
  const parsedBlueprint = aiFirstPlanBlueprintSchema.safeParse(blueprint);

  if (!parsedBlueprint.success) {
    const issues = parsedBlueprint.error.issues.slice(0, 12).map((issue) => ({
      code: "schema_invalid",
      path: issue.path.join(".") || "root",
      message: issue.message,
    }));

    return failedAiBlueprintNormalization(
      "ai_first_plan_blueprint_schema_invalid",
      issues,
      buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: null,
        normalizedWorkouts: null,
        sourceStatus: "deterministic_fallback",
        sourceKind: "structured_authoring_v1",
        fallbackReason: "ai_first_plan_blueprint_schema_invalid",
        issues,
        repairs: [],
      }),
    );
  }

  const context = buildNormalizationContext(authoringInput);
  const issues: NormalizationIssue[] = [];
  const repairs: string[] = [];

  validateBlueprintShell(parsedBlueprint.data, context, issues);

  if (issues.length > 0) {
    return failedAiBlueprintNormalization(
      "ai_first_plan_blueprint_validation_failed",
      issues,
      buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: parsedBlueprint.data,
        normalizedWorkouts: null,
        sourceStatus: "deterministic_fallback",
        sourceKind: "structured_authoring_v1",
        fallbackReason: "ai_first_plan_blueprint_validation_failed",
        issues,
        repairs,
      }),
    );
  }

  const deterministicPlan = buildStructuredAuthoringPlan(authoringInput);
  const deterministicByDate = new Map(
    deterministicPlan.planned_workouts.map((workout) => [workout.date, workout]),
  );
  const blueprintWorkouts = new Map<
    string,
    { week: AiBlueprintWeek; workout: AiBlueprintWorkout }
  >();

  for (const week of parsedBlueprint.data.weeks) {
    for (const workout of week.plannedWorkouts) {
      const date = resolveBlueprintWorkoutDate(workout, week, context);

      if (date) {
        blueprintWorkouts.set(date, { week, workout });
      }
    }
  }

  const normalizedWorkouts: CanonicalWorkout[] = [];
  const totalDays = context.expectedHorizonWeeks * 7;

  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = addDaysIso(context.authoringInput.schedule.startDate, offset);
    const weekNumber = Math.floor(offset / 7) + 1;
    const weekday = weekdayLong(date);
    const blueprintWorkout = blueprintWorkouts.get(date);
    const deterministicWorkout = deterministicByDate.get(date) ?? null;

    normalizedWorkouts.push(
      blueprintWorkout
        ? normalizeBlueprintWorkout({
            blueprint: parsedBlueprint.data,
            week: blueprintWorkout.week,
            workout: blueprintWorkout.workout,
            date,
            context,
            deterministicWorkout,
            repairs,
            issues,
          })
        : buildRestWorkout({
            date,
            weekday,
            weekNumber,
            phase: phaseForWeek(parsedBlueprint.data, weekNumber),
            context,
          }),
    );
  }

  validateNormalizedPlanDoctrine(normalizedWorkouts, context, issues);

  if (issues.length > 0) {
    return failedAiBlueprintNormalization(
      "ai_first_plan_blueprint_validation_failed",
      issues,
      buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: parsedBlueprint.data,
        normalizedWorkouts,
        sourceStatus: "deterministic_fallback",
        sourceKind: "structured_authoring_v1",
        fallbackReason: "ai_first_plan_blueprint_validation_failed",
        issues,
        repairs,
      }),
    );
  }

  const candidatePlan = {
    schema_version: FUTURE_TEMPLATE_VERSION,
    plan_id: `ai-first-plan-blueprint-${slugify(authoringInput.goal.goalType)}-${parsedBlueprint.data.startDate}`,
    plan_name: parsedBlueprint.data.planName,
    source_kind: "ai_first_plan_blueprint_v1",
    created_at: new Date(`${parsedBlueprint.data.startDate}T00:00:00.000Z`).toISOString(),
    generated_for: parsedBlueprint.data.generatedFor,
    goal: {
      goal_type: authoringInput.goal.goalType,
      goal_label: authoringInput.goal.goalLabel,
      ...(authoringInput.schedule.targetDate || authoringInput.goal.targetEventName
        ? {
            target_event: {
              ...(authoringInput.goal.targetEventName
                ? {
                    event_name: authoringInput.goal.targetEventName,
                    label: authoringInput.goal.targetEventName,
                  }
                : {}),
              ...(authoringInput.schedule.targetDate
                ? {
                    event_date: authoringInput.schedule.targetDate,
                    date: authoringInput.schedule.targetDate,
                  }
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
      ...(authoringInput.currentLevel.currentEasyPaceRange
        ? { current_easy_pace_range: authoringInput.currentLevel.currentEasyPaceRange }
        : {}),
      ...(authoringInput.currentLevel.currentTrainingLoadSummary
        ? { current_training_load_summary: authoringInput.currentLevel.currentTrainingLoadSummary }
        : {}),
    },
    start_date: parsedBlueprint.data.startDate,
    preparation_horizon_weeks: parsedBlueprint.data.preparationHorizonWeeks,
    ...(parsedBlueprint.data.targetDate ? { target_date: parsedBlueprint.data.targetDate } : {}),
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
    const issues = parsedPlan.error.issues.slice(0, 12).map((issue) => ({
      code: "training_plan_v2_invalid",
      path: issue.path.join(".") || "root",
      message: issue.message,
    }));

    return failedAiBlueprintNormalization(
      "ai_first_plan_blueprint_training_plan_v2_invalid",
      issues,
      buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: parsedBlueprint.data,
        normalizedWorkouts,
        sourceStatus: "deterministic_fallback",
        sourceKind: "structured_authoring_v1",
        fallbackReason: "ai_first_plan_blueprint_training_plan_v2_invalid",
        issues,
        repairs,
      }),
    );
  }

  return {
    ok: true,
    canonicalPlan: parsedPlan.data,
    metadata: {
      status: repairs.length > 0 ? "repaired_ai_draft" : "ai_authored",
      source: "openai_ai_first_plan_blueprint",
      validationIssues: [],
      repairs,
      reviewAssumptions: parsedBlueprint.data.reviewAssumptions,
      metricPolicySummary: parsedBlueprint.data.metricPolicySummary,
      blueprintTrace: buildAiFirstPlanBlueprintTrace({
        authoringInput,
        blueprint: parsedBlueprint.data,
        normalizedWorkouts: parsedPlan.data.planned_workouts,
        sourceStatus: repairs.length > 0 ? "repaired_ai_draft" : "ai_authored",
        sourceKind: parsedPlan.data.source_kind ?? "ai_first_plan_blueprint_v1",
        fallbackReason: null,
        issues: [],
        repairs,
      }),
    },
  };
}

function buildNormalizationContext(authoringInput: StructuredAuthoringInput) {
  const expectedHorizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const runningDays = new Set(
    authoringInput.availability.preferredRunningDays.filter((day) => !fixedRestDays.has(day)),
  );
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
  const goalFamilyPolicy = resolveGoalFamilyIdentityPolicy(authoringInput);
  const goalFamilyCadencePlan = isGoalFamilyCadencePlan(authoringInput, goalFamilyPolicy);

  return {
    authoringInput,
    expectedHorizonWeeks,
    fixedRestDays,
    runningDays,
    paceTargetsAllowed,
    estimatedMaxHr,
    defaultHrAllowed: Boolean(estimatedMaxHr),
    lowSupportBuildConsistency,
    goalFamilyPolicy,
    goalFamilyCadencePlan,
    requiredCadenceSlots: buildRequiredCadenceSlots(authoringInput, goalFamilyPolicy),
  };
}

function validateBlueprintShell(
  blueprint: AiFirstPlanBlueprint,
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  if (blueprint.startDate !== context.authoringInput.schedule.startDate) {
    issues.push({
      code: "start_date_mismatch",
      path: "startDate",
      message: `Blueprint startDate ${blueprint.startDate} does not match authoring startDate ${context.authoringInput.schedule.startDate}.`,
    });
  }

  if (blueprint.preparationHorizonWeeks !== context.expectedHorizonWeeks) {
    issues.push({
      code: "horizon_mismatch",
      path: "preparationHorizonWeeks",
      message: "Blueprint horizon must match the validated structured authoring horizon.",
    });
  }

  const expectedRestDays = [...context.fixedRestDays].sort();
  const blueprintRestDays = [...blueprint.planPreferences.fixedRestDays].sort();

  if (JSON.stringify(expectedRestDays) !== JSON.stringify(blueprintRestDays)) {
    issues.push({
      code: "fixed_rest_days_mismatch",
      path: "planPreferences.fixedRestDays",
      message: "Blueprint fixed rest days must match validated authoring input.",
    });
  }

  if (
    blueprint.planPreferences.maxRunningDaysPerWeek !==
    context.authoringInput.availability.maxRunningDaysPerWeek
  ) {
    issues.push({
      code: "running_days_per_week_mismatch",
      path: "planPreferences.maxRunningDaysPerWeek",
      message: "Blueprint max running days/week must match validated authoring input.",
    });
  }

  if (blueprint.weeks.length !== context.expectedHorizonWeeks) {
    issues.push({
      code: "week_count_mismatch",
      path: "weeks",
      message: `Blueprint must include exactly ${context.expectedHorizonWeeks} week(s).`,
    });
  }

  const seenDates = new Set<string>();

  for (const week of blueprint.weeks) {
    if (week.plannedWorkouts.length !== context.authoringInput.availability.maxRunningDaysPerWeek) {
      issues.push({
        code: "running_day_count_mismatch",
        path: `weeks.${week.weekNumber}.plannedWorkouts`,
        message: `Week ${week.weekNumber} has ${week.plannedWorkouts.length} authored workouts; expected ${context.authoringInput.availability.maxRunningDaysPerWeek}.`,
      });
    }

    if (!week.plannedWorkouts.some((workout) => isBlueprintLongRunIntent(workout))) {
      issues.push({
        code: "missing_weekly_long_run",
        path: `weeks.${week.weekNumber}.plannedWorkouts`,
        message: `Week ${week.weekNumber} needs one long-run intent so backend can preserve durability progression.`,
      });
    }

    validateHardDayDensity(week, context, issues);
    validateGoalFamilyCadenceWeek(week, context, issues);

    for (const workout of week.plannedWorkouts) {
      const date = resolveBlueprintWorkoutDate(workout, week, context);

      if (!date) {
        issues.push({
          code: "workout_date_unresolved",
          path: `weeks.${week.weekNumber}.${workout.weekday}`,
          message: "Blueprint workout must provide a date or weekday slot inside its week.",
        });
        continue;
      }

      if (seenDates.has(date)) {
        issues.push({
          code: "duplicate_workout_date",
          path: `weeks.${week.weekNumber}.plannedWorkouts`,
          message: `${date} appears more than once.`,
        });
      }

      seenDates.add(date);

      if (workout.date && workout.date !== date) {
        issues.push({
          code: "date_weekday_mismatch",
          path: `${workout.date}.weekday`,
          message: `${workout.date} does not match ${workout.weekday} inside week ${week.weekNumber}.`,
        });
      }

      if (context.fixedRestDays.has(workout.weekday)) {
        issues.push({
          code: "fixed_rest_day_violation",
          path: `${date}.workoutFamily`,
          message: `${date} is a fixed rest day and cannot contain an authored workout.`,
        });
      }

      if (!context.runningDays.has(workout.weekday)) {
        issues.push({
          code: "non_running_day_violation",
          path: `${date}.weekday`,
          message: `${date} is not one of the validated running days.`,
        });
      }

      if (
        isBlueprintLongRunIntent(workout) &&
        context.authoringInput.availability.preferredLongRunDay &&
        workout.weekday !== context.authoringInput.availability.preferredLongRunDay
      ) {
        issues.push({
          code: "preferred_long_run_day_violation",
          path: `${date}.weekday`,
          message: `Long runs should land on ${context.authoringInput.availability.preferredLongRunDay}.`,
        });
      }

      validateGoalFamilyWorkoutIdentity(workout, date, context, issues);

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
          path: `${date}.workoutIdentity`,
          message:
            "Low-support build-consistency plans cannot use tempo, interval, or race-like identities.",
        });
      }

      if (containsForbiddenCoachingClaims(workout)) {
        issues.push({
          code: "forbidden_coaching_claim",
          path: `${date}.summary`,
          message:
            "Blueprint contains exact elevation, medical, rehab, unsupported metric precision, or physiological truth claims.",
        });
      }
    }
  }

  validateGoalFamilyCadence(blueprint, context, issues);
}

function validateHardDayDensity(
  week: AiBlueprintWeek,
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  const hardWorkouts = week.plannedWorkouts
    .filter((workout) => hardWorkoutFamilies.has(workout.workoutFamily))
    .sort((a, b) => weekdayIndex(a.weekday) - weekdayIndex(b.weekday));
  const maxHardDays = context.authoringInput.availability.maxRunningDaysPerWeek <= 3 ? 1 : 2;

  if (hardWorkouts.length > maxHardDays) {
    issues.push({
      code: "hard_day_density_too_high",
      path: `weeks.${week.weekNumber}.plannedWorkouts`,
      message: `Week ${week.weekNumber} has ${hardWorkouts.length} hard days; max safe density is ${maxHardDays}.`,
    });
  }

  for (let index = 1; index < hardWorkouts.length; index += 1) {
    if (
      weekdayIndex(hardWorkouts[index]!.weekday) - weekdayIndex(hardWorkouts[index - 1]!.weekday) <=
      1
    ) {
      issues.push({
        code: "back_to_back_hard_days",
        path: `weeks.${week.weekNumber}.plannedWorkouts`,
        message: `Week ${week.weekNumber} has hard days too close together.`,
      });
      break;
    }
  }
}

function validateGoalFamilyCadenceWeek(
  week: AiBlueprintWeek,
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  if (!context.goalFamilyCadencePlan) {
    return;
  }

  const requiredCadenceSlot = context.requiredCadenceSlots.get(week.weekNumber);

  if (!requiredCadenceSlot) {
    return;
  }

  const cadenceWorkout = week.plannedWorkouts.find((workout) => {
    const date = resolveBlueprintWorkoutDate(workout, week, context);

    return date === requiredCadenceSlot.date;
  });

  if (
    !cadenceWorkout ||
    !requiredCadenceSlot.identityOptions.includes(cadenceWorkout.workoutIdentity)
  ) {
    issues.push({
      code: "missing_required_goal_family_cadence",
      path: `weeks.${week.weekNumber}.plannedWorkouts`,
      message: `Week ${week.weekNumber} must use the required ${requiredCadenceSlot.weekday} slot for ${context.goalFamilyPolicy.label} ${requiredCadenceSlot.kind} work.`,
    });
  }
}

function validateGoalFamilyCadence(
  blueprint: AiFirstPlanBlueprint,
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  if (!context.goalFamilyCadencePlan) {
    return;
  }

  const cadenceWeeks = new Set(
    blueprint.weeks
      .filter((week) =>
        week.plannedWorkouts.some((workout) => isBlueprintCadenceIntent(workout, context)),
      )
      .map((week) => week.weekNumber),
  );

  if (context.requiredCadenceSlots.size > 0) {
    return;
  }

  const step = context.goalFamilyPolicy.cadence.frequency === "weekly" ? 1 : 2;
  const cadenceLabel =
    context.goalFamilyPolicy.cadence.kind === "quality"
      ? "quality, rhythm, or tune-up"
      : "goal-family specialty";

  for (let weekNumber = 1; weekNumber <= context.expectedHorizonWeeks; weekNumber += step) {
    const nextWeekNumber = step === 1 ? weekNumber : weekNumber + 1;

    if (!cadenceWeeks.has(weekNumber) && !cadenceWeeks.has(nextWeekNumber)) {
      issues.push({
        code: "goal_family_identity_cadence_gap",
        path: `weeks.${weekNumber}`,
        message: `${context.goalFamilyPolicy.label} plans need ${cadenceLabel} identities on the required week-aware cadence.`,
      });
    }
  }
}

function validateGoalFamilyWorkoutIdentity(
  workout: AiBlueprintWorkout,
  date: string,
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  const policy = context.goalFamilyPolicy;

  if (policy.excludedIdentities.has(workout.workoutIdentity)) {
    issues.push({
      code: "goal_family_identity_excluded",
      path: `${date}.workoutIdentity`,
      message: `${workout.workoutIdentity} is not appropriate for ${policy.label} blueprint plans.`,
    });
    return;
  }

  if (!policy.allowedIdentities.has(workout.workoutIdentity)) {
    issues.push({
      code: "goal_family_identity_not_allowed",
      path: `${date}.workoutIdentity`,
      message: `${workout.workoutIdentity} is outside the backend ${policy.label} identity matrix.`,
    });
  }
}

function normalizeBlueprintWorkout({
  blueprint,
  week,
  workout,
  date,
  context,
  deterministicWorkout,
  repairs,
  issues,
}: {
  blueprint: AiFirstPlanBlueprint;
  week: AiBlueprintWeek;
  workout: AiBlueprintWorkout;
  date: string;
  context: ReturnType<typeof buildNormalizationContext>;
  deterministicWorkout: CanonicalWorkout | null;
  repairs: string[];
  issues: NormalizationIssue[];
}): CanonicalWorkout {
  const resolved = resolveCanonicalWorkoutModel({
    workoutFamily: workout.workoutFamily,
    workoutIdentity: workout.workoutIdentity,
    calendarIconKey: workout.calendarIconKey,
    title: workout.title,
  });
  const totalDurationMin = estimateBlueprintWorkoutDurationMin(workout, deterministicWorkout);
  if (
    resolved.workoutFamily !== workout.workoutFamily ||
    resolved.calendarIconKey !== workout.calendarIconKey
  ) {
    repairs.push(
      `${date}: canonicalized ${workout.workoutIdentity} to family ${resolved.workoutFamily} and icon ${resolved.calendarIconKey}.`,
    );
  }
  const canonicalWorkout = {
    ...workout,
    workoutFamily: resolved.workoutFamily,
    workoutIdentity: resolved.workoutIdentity,
    calendarIconKey: resolved.calendarIconKey,
  };
  const segments = normalizeExecutableStepInstructions(
    buildWorkoutSegments({
      workout: canonicalWorkout,
      date,
      totalDurationMin,
      context,
      deterministicWorkout,
      repairs,
    }),
  );

  if (
    totalDurationMin >= 35 &&
    (segments.length < 3 ||
      !segments.some((segment) => segment.segment_type === "warmup") ||
      !segments.some((segment) => mainLikeSegmentTypes.has(segment.segment_type ?? "")) ||
      !segments.some((segment) => segment.segment_type === "cooldown"))
  ) {
    issues.push({
      code: "one_block_substantial_workout",
      path: `${date}.segments`,
      message: `${workout.title} did not expand into warmup/main/cooldown structure.`,
    });
  }

  return {
    workout_id: `ai-blueprint-${slugify(workout.workoutIdentity)}-${date}`,
    date,
    weekday: workout.weekday,
    week_number: week.weekNumber,
    phase: week.phase,
    workout_type: canonicalFamilyToLegacyWorkoutType(
      resolved.workoutFamily,
      resolved.workoutIdentity,
    ),
    source_workout_type: resolved.workoutIdentity,
    workout_family: resolved.workoutFamily,
    workout_identity: resolved.workoutIdentity,
    calendar_icon_key: resolved.calendarIconKey,
    goal_context: normalizeBlueprintGoalContext(context.authoringInput, blueprint),
    metric_mode: buildWorkoutMetricMode(segments, context),
    title: workout.title,
    summary: workout.summary,
    planned_rpe: workout.plannedRpe,
    estimated_fatigue: workout.estimatedFatigue,
    recovery_priority: workout.recoveryPriority,
    segments,
  };
}

function buildRestWorkout({
  date,
  weekday,
  weekNumber,
  phase,
  context,
}: {
  date: string;
  weekday: string;
  weekNumber: number;
  phase: string;
  context: ReturnType<typeof buildNormalizationContext>;
}): CanonicalWorkout {
  const segments: CanonicalSegment[] = [
    {
      segment_id: `ai-blueprint-rest-${date}`,
      segment_type: "rest",
      sequence: 1,
      label: "Rest",
      guidance: "No running today. Keep the day genuinely restorative.",
      prescription: { mode: "none" },
      target: { cue: "Protect the recovery day so the next run can stay controlled." },
    },
  ];

  return {
    workout_id: `ai-blueprint-rest-${date}`,
    date,
    weekday,
    week_number: weekNumber,
    phase,
    workout_type: "rest",
    source_workout_type: "rest_and_recovery",
    workout_family: "rest",
    workout_identity: "rest_and_recovery",
    calendar_icon_key: "rest",
    goal_context: normalizeBlueprintGoalContext(context.authoringInput, null),
    metric_mode: toCanonicalMetricModeJson({
      guidance: "effort",
      paceTargetsAllowed: false,
      hrTargetsAllowed: false,
      hrTargetSource: "effort_only",
      hrTargetLabel: null,
      hrTargetSourceNote: null,
      reason: "Rest day has no execution metric targets.",
    }),
    title: "Rest and recovery",
    summary: "No running today. Keep the day genuinely restful.",
    planned_rpe: 1,
    estimated_fatigue: "very_low",
    recovery_priority: "high",
    segments,
  };
}

function buildWorkoutSegments({
  workout,
  date,
  totalDurationMin,
  context,
  deterministicWorkout,
  repairs,
}: {
  workout: AiBlueprintWorkout;
  date: string;
  totalDurationMin: number;
  context: ReturnType<typeof buildNormalizationContext>;
  deterministicWorkout: CanonicalWorkout | null;
  repairs: string[];
}): CanonicalSegment[] {
  return buildIdentitySegmentSpecs(workout, totalDurationMin).map((spec, index) =>
    buildBlueprintSegment({
      workout,
      date,
      sequence: index + 1,
      spec,
      context,
      deterministicWorkout,
      repairs,
    }),
  );
}

type BlueprintSegmentTargetRole = "warmup" | "main" | "cooldown" | "recovery";

interface BlueprintSegmentSpec {
  segmentType: NonNullable<CanonicalSegment["segment_type"]>;
  label: string;
  guidance: string;
  durationMin?: number;
  prescription?: StepPrescription;
  targetRole: BlueprintSegmentTargetRole;
  recoveryTarget?: NonNullable<Step["target"]>;
}

function buildIdentitySegmentSpecs(
  workout: AiBlueprintWorkout,
  totalDurationMin: number,
): BlueprintSegmentSpec[] {
  const split = splitBlueprintDuration(totalDurationMin);

  switch (workout.workoutIdentity) {
    case "controlled_tempo_session":
      return [
        warmupSpec(
          split.warmupMin,
          "Tempo warmup",
          "Start easy, then settle into smooth mechanics before the sustained work.",
        ),
        timedSpec({
          segmentType: "tempo_block",
          label: "Controlled tempo block",
          durationMin: split.mainMin,
          guidance:
            "Hold a comfortably hard effort that stays controlled from start to finish; this is not a race.",
          targetRole: "main",
        }),
        cooldownSpec(
          split.cooldownMin,
          "Tempo cooldown",
          "Ease back to relaxed running and let breathing settle before stopping.",
        ),
      ];
    case "half_marathon_threshold_durability":
      return [
        warmupSpec(
          split.warmupMin,
          "Threshold durability warmup",
          "Start conversational and prepare for sustained half-marathon strength work.",
        ),
        timedSpec({
          segmentType: "tempo_block",
          label: "Half-marathon threshold durability",
          durationMin: split.mainMin,
          guidance:
            "Run a sustained controlled block that builds threshold durability without forcing target pace.",
          targetRole: "main",
        }),
        cooldownSpec(
          split.cooldownMin,
          "Controlled threshold cooldown",
          "Finish easy and preserve enough freshness for the next support day.",
        ),
      ];
    case "5k_sharpening_repeats":
      return intervalSpecs({
        workout,
        split,
        label: `${fiveKSharpeningRepeatCount(totalDurationMin)} short 5K-rhythm reps`,
        guidance:
          "Keep the reps quick and coordinated. The goal is rhythm and repeatability, not an all-out finish.",
        repeatCount: fiveKSharpeningRepeatCount(totalDurationMin),
        repeatUnit: { mode: "distance", distance_km: 0.2 },
        recoveryMin: 2,
        warmupLabel: "5K sharpening warmup",
        cooldownLabel: "5K sharpening cooldown",
      });
    case "10k_rhythm_intervals":
      return intervalSpecs({
        workout,
        split,
        label: `${tenKRhythmRepeatCount(totalDurationMin)} rhythm reps`,
        guidance:
          "Settle into a strong but controlled rhythm. Each rep should feel sustainable enough to repeat.",
        repeatCount: tenKRhythmRepeatCount(totalDurationMin),
        repeatUnit: { mode: "time", duration_min: 4 },
        recoveryMin: 2,
        warmupLabel: "10K rhythm warmup",
        cooldownLabel: "10K rhythm cooldown",
      });
    case "time_intervals":
      return intervalSpecs({
        workout,
        split,
        label: `${timeIntervalRepeatCount(totalDurationMin)} x 3 min`,
        guidance:
          "Run each timed repeat with clean, repeatable form, then recover easily before the next one.",
        repeatCount: timeIntervalRepeatCount(totalDurationMin),
        repeatUnit: { mode: "time", duration_min: 3 },
        recoveryMin: 2,
        warmupLabel: "Interval warmup",
        cooldownLabel: "Interval cooldown",
      });
    case "distance_intervals":
      return intervalSpecs({
        workout,
        split,
        label: `${distanceIntervalRepeatCount(totalDurationMin)} x 400m`,
        guidance:
          "Keep every distance repeat fast but controlled; stop short of sprinting so the set stays repeatable.",
        repeatCount: distanceIntervalRepeatCount(totalDurationMin),
        repeatUnit: { mode: "distance", distance_km: 0.4 },
        recoveryMin: 2,
        warmupLabel: "Distance-interval warmup",
        cooldownLabel: "Distance-interval cooldown",
      });
    case "rolling_hills_session":
      return hillRepeatSpecs({
        split,
        label: `${hillRepeatCount(totalDurationMin, 4, 8)} rolling hill pickups`,
        guidance:
          "Use rolling terrain if available. Keep each uphill controlled, then recover on easier ground without chasing elevation numbers.",
        repeatCount: hillRepeatCount(totalDurationMin, 4, 8),
        repeatMin: 2,
        recoveryMin: 2,
        warmupLabel: "Rolling-hills warmup",
        cooldownLabel: "Rolling-hills cooldown",
      });
    case "uphill_repeats":
      return hillRepeatSpecs({
        split,
        label: `${hillRepeatCount(totalDurationMin, 5, 10)} uphill repeats`,
        guidance:
          "Run uphill with short, steady form. Recover easily downhill or on flat ground; effort matters more than pace.",
        repeatCount: hillRepeatCount(totalDurationMin, 5, 10),
        repeatMin: 2,
        recoveryMin: 2,
        warmupLabel: "Uphill-repeat warmup",
        cooldownLabel: "Uphill-repeat cooldown",
      });
    case "controlled_downhill_durability":
      return hillRepeatSpecs({
        split,
        label: `${downhillDurabilityRepeatCount(totalDurationMin)} controlled descents`,
        guidance:
          "Use only safe gentle downhill terrain. Descend smoothly under control, keep steps quick, and stop the descent work if footing is uncertain.",
        repeatCount: downhillDurabilityRepeatCount(totalDurationMin),
        repeatMin: 1,
        recoveryMin: 2,
        warmupLabel: "Downhill-control warmup",
        cooldownLabel: "Downhill-control cooldown",
      });
    case "technical_trail_easy":
      return enduranceSpecs({
        split,
        warmupLabel: "Easy footing check",
        warmupGuidance:
          "Start on forgiving trail or uneven ground if available and use the first minutes to scan footing.",
        mainLabel: "Low-risk technical trail body",
        mainGuidance:
          "Stay easy, shorten stride on uneven ground, and choose control over speed. Skip technical sections that feel risky.",
        finishLabel: "Controlled trail finish",
        finishGuidance:
          "Finish smooth and cautious; avoid aggressive descents or risky footing even if the legs feel good.",
      });
    case "climbing_steady_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Easy climbing opener",
        warmupGuidance:
          "Begin easy on flat, rolling, or gentle uphill terrain before settling into a steadier climbing rhythm.",
        mainLabel: "Steady climbing body",
        mainGuidance:
          "Use rolling or hilly terrain if available. Keep effort purposeful but controlled, and let pace vary with grade.",
        finishLabel: "Relaxed descent or flat finish",
        finishGuidance:
          "Ease off the climbing effort and keep any downhill running controlled instead of fast.",
      });
    case "hike_run_endurance":
      return enduranceSpecs({
        split,
        warmupLabel: "Easy mountain opening",
        warmupGuidance:
          "Start with easy running or brisk hiking and keep the first minutes comfortably aerobic.",
        mainLabel: "Hike-run endurance body",
        mainGuidance:
          "Power-hike steeper climbs, run gentle terrain easily, and descend under control. Keep the full block sustainable.",
        finishLabel: "Controlled mountain finish",
        finishGuidance:
          "Ease the effort down and keep descents careful. Finish with enough control to recover well.",
      });
    case "mountain_long_run_time_on_feet": {
      const mountainSplit = splitBlueprintDuration(Math.max(totalDurationMin, 55));

      return [
        warmupSpec(
          mountainSplit.warmupMin,
          "Mountain time-on-feet opening",
          "Start easier than planned effort and settle into the terrain rhythm before any climb or descent adds load.",
        ),
        timedSpec({
          segmentType: "main",
          label: "Mountain durability body",
          durationMin: mountainSplit.mainMin,
          guidance:
            "Keep the main block aerobic. Power-hike steeper climbs, run gentle terrain easily, and keep descents controlled.",
          targetRole: "main",
        }),
        {
          segmentType: "fueling" as const,
          label: "Time-on-feet and fueling check",
          guidance:
            "Use this checkpoint to keep effort patient and practice familiar fueling or hydration habits without forcing pace.",
          prescription: { mode: "none" as const },
          targetRole: "recovery" as const,
        },
        cooldownSpec(
          mountainSplit.cooldownMin,
          "Controlled mountain finish",
          "Finish with careful footing and enough reserve to recover well from terrain load.",
        ),
      ];
    }
    case "long_run_with_steady_finish": {
      const finishMin = Math.min(25, Math.max(10, Math.round(totalDurationMin * 0.22)));
      const openerMin = Math.min(12, Math.max(8, Math.round(totalDurationMin * 0.15)));
      const cooldownMin = Math.min(8, Math.max(5, Math.round(totalDurationMin * 0.08)));
      const mainMin = Math.max(25, totalDurationMin - openerMin - finishMin - cooldownMin);

      return [
        warmupSpec(
          openerMin,
          "Patient long-run opening",
          "Start deliberately easier than the rest of the run so the later steady finish stays controlled.",
        ),
        timedSpec({
          segmentType: "main",
          label: "Long aerobic body",
          durationMin: mainMin,
          guidance:
            "Keep the main block durable, relaxed, and repeatable. The goal is aerobic strength, not speed.",
          targetRole: "main",
        }),
        timedSpec({
          segmentType: "main",
          label: "Controlled steady finish",
          durationMin: finishMin,
          guidance:
            "Gently lift the effort late while staying sustainable and relaxed; finish strong, not strained.",
          targetRole: "main",
        }),
        cooldownSpec(
          cooldownMin,
          "Easy long-run cooldown",
          "Ease down and protect recovery for the next training day.",
        ),
      ];
    }
    case "cutback_long_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Gentle cutback opening",
        warmupGuidance:
          "Start very comfortably; this long run is here to absorb the block, not to make up missed work.",
        mainLabel: "Reduced long-run body",
        mainGuidance:
          "Keep the long-run body lower-load and aerobic so durability improves without adding hidden intensity.",
        finishLabel: "Easy absorption finish",
        finishGuidance: "Finish easy and controlled; do not turn this into a make-up workout.",
      });
    case "taper_long_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Fresh taper opening",
        warmupGuidance: "Start relaxed and keep the first section confidence-building.",
        mainLabel: "Shortened taper endurance",
        mainGuidance:
          "Keep the reduced long-run body smooth and fresh; the point is readiness, not peak stress.",
        finishLabel: "Freshness-preserving finish",
        finishGuidance: "Finish feeling fresh, with no late push.",
      });
    case "marathon_steady_specificity":
      return enduranceSpecs({
        split,
        warmupLabel: "Marathon-steady warmup",
        warmupGuidance:
          "Start easy and let the rhythm settle before the marathon-specific steady work.",
        mainLabel: "Controlled marathon-steady running",
        mainGuidance:
          "Hold a sustainable steady rhythm for marathon-aerobic durability. If pace is not allowed, keep this effort-based and patient.",
        finishLabel: "Marathon-steady cooldown",
        finishGuidance: "Ease down before stopping and protect the next day's recovery.",
      });
    case "race_pace_session":
      return enduranceSpecs({
        split,
        warmupLabel: "Race-rhythm warmup",
        warmupGuidance:
          "Start relaxed and prepare for controlled race-specific rhythm without rushing the first minutes.",
        mainLabel: "Controlled race-rhythm block",
        mainGuidance:
          "Practice race-specific rhythm only as far as backend metric gates support it; otherwise use controlled effort and smooth form.",
        finishLabel: "Race-rhythm cooldown",
        finishGuidance:
          "Ease back to relaxed running and finish with confidence rather than fatigue.",
      });
    case "taper_tuneup_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Fresh taper opening",
        warmupGuidance: "Start smooth and easy; the goal is freshness, not added load.",
        mainLabel: "Light taper tune-up",
        mainGuidance:
          "Keep the run easy with only a short controlled lift if the legs feel good. This should sharpen, not drain.",
        finishLabel: "Freshness check-out",
        finishGuidance: "Finish relaxed and leave energy in reserve.",
      });
    case "ultra_time_on_feet_durability": {
      const fuelingCheckMin = totalDurationMin >= 55 ? 0 : null;
      const ultraSplit = splitBlueprintDuration(Math.max(totalDurationMin, 50));
      const mainMin = fuelingCheckMin === 0 ? ultraSplit.mainMin : split.mainMin;

      return [
        warmupSpec(
          ultraSplit.warmupMin,
          "Patient time-on-feet opening",
          "Start easier than planned effort and settle into relaxed durability before terrain or fatigue adds load.",
        ),
        timedSpec({
          segmentType: "main",
          label: "Ultra durability body",
          durationMin: mainMin,
          guidance:
            "Keep the main block aerobic. Use short hike breaks on steeper ground or when fatigue rises, then return to easy running.",
          targetRole: "main",
        }),
        ...(fuelingCheckMin === 0
          ? [
              {
                segmentType: "fueling" as const,
                label: "Fueling and effort check",
                guidance:
                  "Use this checkpoint to keep effort patient and practice the plan's time-on-feet rhythm; do not force pace.",
                prescription: { mode: "none" as const },
                targetRole: "recovery" as const,
              },
            ]
          : []),
        cooldownSpec(
          ultraSplit.cooldownMin,
          "Controlled durability finish",
          "Finish relaxed and controlled. If form fades, hike briefly instead of forcing pace.",
        ),
      ];
    }
    case "recovery_jog":
      return enduranceSpecs({
        split,
        warmupLabel: "Recovery opening",
        warmupGuidance:
          "Start very easy and let the body tell you how much running it wants today.",
        mainLabel: "Gentle recovery jog",
        mainGuidance:
          "Keep the whole block relaxed and conversational. This run supports recovery, not fitness testing.",
        finishLabel: "Relaxed recovery finish",
        finishGuidance: "Finish softer than you started and leave the legs fresher.",
      });
    case "cutback_aerobic_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Cutback aerobic opening",
        warmupGuidance: "Start easy and keep this support day intentionally lower-load.",
        mainLabel: "Reduced aerobic body",
        mainGuidance:
          "Keep the main block comfortable and controlled so the week absorbs previous training.",
        finishLabel: "Cutback finish",
        finishGuidance: "Finish relaxed; do not add intensity just because the run feels short.",
      });
    case "steady_aerobic_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Steady aerobic opening",
        warmupGuidance: "Start easier than steady and let the rhythm build naturally.",
        mainLabel: "Steady aerobic body",
        mainGuidance:
          "Hold a purposeful but controlled aerobic rhythm that supports the goal without becoming tempo work.",
        finishLabel: "Composed steady finish",
        finishGuidance: "Ease down gradually and finish with relaxed form.",
      });
    case "easy_aerobic_run":
      return enduranceSpecs({
        split,
        warmupLabel: "Easy aerobic opening",
        warmupGuidance: "Start comfortably and let the stride settle before the main easy block.",
        mainLabel: "Easy aerobic body",
        mainGuidance:
          "Keep the effort conversational and sustainable. This support run builds consistency without extra strain.",
        finishLabel: "Easy relaxed finish",
        finishGuidance: "Finish feeling like you could have kept going a little longer.",
      });
    default:
      return enduranceSpecs({
        split,
        warmupLabel: "Warm up",
        warmupGuidance: openingGuidance(workout),
        mainLabel: mainLabel(workout),
        mainGuidance: mainGuidance(workout),
        finishLabel: "Cool down",
        finishGuidance: finishGuidance(workout),
      });
  }
}

function buildBlueprintSegment({
  workout,
  date,
  sequence,
  spec,
  context,
  deterministicWorkout,
  repairs,
}: {
  workout: AiBlueprintWorkout;
  date: string;
  sequence: number;
  spec: BlueprintSegmentSpec;
  context: ReturnType<typeof buildNormalizationContext>;
  deterministicWorkout: CanonicalWorkout | null;
  repairs: string[];
}): CanonicalSegment {
  const prescription = spec.prescription ?? {
    mode: "time" as const,
    duration_min: spec.durationMin ?? 1,
  };
  const durationMin = prescription.mode === "time" ? prescription.duration_min : undefined;
  const distanceKm = prescription.mode === "distance" ? prescription.distance_km : undefined;

  return {
    segment_id: `${slugify(workout.workoutIdentity)}_${date}_seg_${sequence}`,
    segment_type: spec.segmentType,
    sequence,
    label: spec.label,
    ...(durationMin ? { duration_min: durationMin } : {}),
    ...(distanceKm ? { distance_km: distanceKm } : {}),
    guidance: spec.guidance,
    prescription,
    target:
      spec.segmentType === "fueling"
        ? {
            cue: "Keep the checkpoint practical and effort-controlled; do not chase metrics here.",
            hint: "Use familiar fueling or hydration habits only.",
          }
        : buildSegmentTarget({
            workout,
            segmentKind: spec.targetRole,
            context,
            deterministicWorkout,
            repairs,
          }),
    ...(spec.recoveryTarget ? { recovery_target: spec.recoveryTarget } : {}),
  } as CanonicalSegment;
}

function splitBlueprintDuration(totalDurationMin: number) {
  if (totalDurationMin < 30) {
    return {
      warmupMin: 5,
      mainMin: Math.max(10, totalDurationMin - 10),
      cooldownMin: 5,
    };
  }

  const warmupMin = Math.min(12, Math.max(6, Math.round(totalDurationMin * 0.2)));
  const cooldownMin = Math.min(10, Math.max(5, Math.round(totalDurationMin * 0.15)));
  const mainMin = Math.max(10, totalDurationMin - warmupMin - cooldownMin);

  return { warmupMin, mainMin, cooldownMin };
}

function timedSpec({
  segmentType,
  label,
  durationMin,
  guidance,
  targetRole,
}: {
  segmentType: BlueprintSegmentSpec["segmentType"];
  label: string;
  durationMin: number;
  guidance: string;
  targetRole: BlueprintSegmentTargetRole;
}): BlueprintSegmentSpec {
  return {
    segmentType,
    label,
    durationMin,
    guidance,
    targetRole,
  };
}

function warmupSpec(durationMin: number, label: string, guidance: string): BlueprintSegmentSpec {
  return timedSpec({
    segmentType: "warmup",
    label,
    durationMin,
    guidance,
    targetRole: "warmup",
  });
}

function cooldownSpec(durationMin: number, label: string, guidance: string): BlueprintSegmentSpec {
  return timedSpec({
    segmentType: "cooldown",
    label,
    durationMin,
    guidance,
    targetRole: "cooldown",
  });
}

function enduranceSpecs({
  split,
  warmupLabel,
  warmupGuidance,
  mainLabel,
  mainGuidance,
  finishLabel,
  finishGuidance,
}: {
  split: ReturnType<typeof splitBlueprintDuration>;
  warmupLabel: string;
  warmupGuidance: string;
  mainLabel: string;
  mainGuidance: string;
  finishLabel: string;
  finishGuidance: string;
}): BlueprintSegmentSpec[] {
  return [
    warmupSpec(split.warmupMin, warmupLabel, warmupGuidance),
    timedSpec({
      segmentType: "main",
      label: mainLabel,
      durationMin: split.mainMin,
      guidance: mainGuidance,
      targetRole: "main",
    }),
    cooldownSpec(split.cooldownMin, finishLabel, finishGuidance),
  ];
}

function intervalSpecs({
  workout,
  split,
  label,
  guidance,
  repeatCount,
  repeatUnit,
  recoveryMin,
  warmupLabel,
  cooldownLabel,
}: {
  workout: AiBlueprintWorkout;
  split: ReturnType<typeof splitBlueprintDuration>;
  label: string;
  guidance: string;
  repeatCount: number;
  repeatUnit: NonNullable<StepPrescription["repeat_unit"]>;
  recoveryMin: number;
  warmupLabel: string;
  cooldownLabel: string;
}): BlueprintSegmentSpec[] {
  return [
    warmupSpec(
      split.warmupMin,
      warmupLabel,
      "Start easy, add a few relaxed form checks, and keep the first repeat under control.",
    ),
    {
      segmentType: "interval_block",
      label,
      guidance,
      prescription: {
        mode: "repeats",
        repeat_count: repeatCount,
        repeat_unit: repeatUnit,
        recovery_unit: {
          mode: "time",
          duration_min: recoveryMin,
        },
      },
      targetRole: "main",
      recoveryTarget: {
        intensity: "easy recovery",
        rpe: Math.max(2, workout.plannedRpe - 3),
        cue: "Recover easily enough that the next repeat stays smooth.",
      },
    },
    cooldownSpec(
      split.cooldownMin,
      cooldownLabel,
      "Ease down after the final repeat and finish with relaxed form.",
    ),
  ];
}

function hillRepeatSpecs({
  split,
  label,
  guidance,
  repeatCount,
  repeatMin,
  recoveryMin,
  warmupLabel,
  cooldownLabel,
}: {
  split: ReturnType<typeof splitBlueprintDuration>;
  label: string;
  guidance: string;
  repeatCount: number;
  repeatMin: number;
  recoveryMin: number;
  warmupLabel: string;
  cooldownLabel: string;
}): BlueprintSegmentSpec[] {
  return [
    warmupSpec(
      split.warmupMin,
      warmupLabel,
      "Start easy and use the opening minutes to find controlled form before any climbing effort.",
    ),
    {
      segmentType: "interval_block",
      label,
      guidance,
      prescription: {
        mode: "repeats",
        repeat_count: repeatCount,
        repeat_unit: {
          mode: "time",
          duration_min: repeatMin,
        },
        recovery_unit: {
          mode: "time",
          duration_min: recoveryMin,
        },
      },
      targetRole: "main",
      recoveryTarget: {
        intensity: "easy terrain recovery",
        rpe: 3,
        cue: "Recover on safe ground and keep descents controlled.",
      },
    },
    cooldownSpec(
      split.cooldownMin,
      cooldownLabel,
      "Finish controlled and avoid adding downhill risk late in the session.",
    ),
  ];
}

function timeIntervalRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 4, 7);
}

function distanceIntervalRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 4, 8);
}

function hillRepeatCount(totalDurationMin: number, min: number, max: number) {
  return boundedRepeatCount(totalDurationMin, min, max);
}

function fiveKSharpeningRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 5, 10);
}

function tenKRhythmRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 3, 6);
}

function downhillDurabilityRepeatCount(totalDurationMin: number) {
  return boundedRepeatCount(totalDurationMin, 4, 8);
}

function boundedRepeatCount(totalDurationMin: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(totalDurationMin / 10)));
}

function buildSegmentTarget({
  workout,
  segmentKind,
  context,
  deterministicWorkout,
  repairs,
}: {
  workout: AiBlueprintWorkout;
  segmentKind: BlueprintSegmentTargetRole;
  context: ReturnType<typeof buildNormalizationContext>;
  deterministicWorkout: CanonicalWorkout | null;
  repairs: string[];
}): NonNullable<Step["target"]> {
  const target: NonNullable<Step["target"]> = {
    intensity: segmentIntensity(workout, segmentKind),
    rpe: segmentKind === "main" ? workout.plannedRpe : Math.max(2, workout.plannedRpe - 2),
    cue: segmentCue(workout, segmentKind),
    hint: segmentHint(workout, segmentKind),
  };

  if (context.paceTargetsAllowed && shouldApplyPaceTarget(workout, segmentKind)) {
    const paceTarget = findDeterministicPaceTarget(deterministicWorkout, segmentKind);

    if (paceTarget) {
      target.pace_min_per_km_range = paceTarget;
    }
  } else if (
    segmentKind === "main" &&
    (workout.metricIntent === "pace_if_allowed" || workout.metricIntent === "mixed_if_allowed")
  ) {
    repairs.push(
      `${workout.title}: kept pace intent effort-based because benchmark/watch gates did not allow numeric pace.`,
    );
  }

  const defaultHrBand = defaultEstimatedHrBandForSegment(workout, segmentKind);

  if (context.defaultHrAllowed && defaultHrBand) {
    Object.assign(target, buildDefaultEstimatedHrTarget(context.estimatedMaxHr!, defaultHrBand));
  }

  return target;
}

function openingGuidance(workout: AiBlueprintWorkout) {
  if (workout.workoutFamily === "trail" || workout.workoutFamily === "hills") {
    return "Start controlled and use the opening minutes to read terrain, footing, and breathing.";
  }

  return "Start comfortably and let the stride settle before the main purpose of the run.";
}

function mainGuidance(workout: AiBlueprintWorkout) {
  if (workout.workoutFamily === "long") {
    return "Keep the effort durable and repeatable; finish with the same control you had early.";
  }

  if (workout.workoutFamily === "tempo") {
    return "Hold a controlled sustained effort without turning it into a race.";
  }

  if (workout.workoutFamily === "intervals") {
    return "Run the faster work with clean form and keep every repeat repeatable.";
  }

  if (workout.workoutFamily === "hills") {
    return "Use effort first on climbs and stay smooth; terrain makes pace less meaningful.";
  }

  if (workout.workoutFamily === "trail") {
    return "Keep terrain exposure cautious and controlled; hike briefly if form or footing degrades.";
  }

  if (workout.workoutFamily === "progression") {
    return "Progress gradually while keeping the final effort controlled, not maximal.";
  }

  return "Keep the purpose clear and sustainable for the next training day.";
}

function finishGuidance(workout: AiBlueprintWorkout) {
  if (workout.workoutFamily === "trail" || workout.workoutFamily === "hills") {
    return "Finish with controlled form and avoid adding risk late in the session.";
  }

  return "Ease down and finish feeling like you could have kept going a little longer.";
}

function mainLabel(workout: AiBlueprintWorkout) {
  switch (workout.workoutFamily) {
    case "tempo":
      return "Sustained controlled work";
    case "intervals":
      return "Controlled repeat block";
    case "hills":
      return "Hill effort block";
    case "trail":
      return "Terrain control block";
    case "long":
      return "Durability block";
    case "steady":
      return "Steady aerobic block";
    case "progression":
      return "Progression block";
    case "race":
      return "Tune-up block";
    default:
      return "Aerobic block";
  }
}

function segmentIntensity(workout: AiBlueprintWorkout, segmentKind: BlueprintSegmentTargetRole) {
  if (segmentKind === "cooldown") {
    return "relaxed";
  }

  if (segmentKind === "recovery") {
    return "easy recovery";
  }

  if (segmentKind === "warmup") {
    return "easy";
  }

  switch (workout.workoutFamily) {
    case "race":
      return "controlled race-specific rhythm";
    case "tempo":
      return "comfortably hard and controlled";
    case "intervals":
      return "controlled faster running";
    case "hills":
      if (workout.workoutIdentity === "controlled_downhill_durability") {
        return "controlled downhill mechanics";
      }

      return "strong but controlled uphill effort";
    case "long":
      return "durable aerobic effort";
    case "trail":
      return "easy time-on-feet effort";
    case "steady":
      return "steady aerobic effort";
    case "recovery":
      return "very easy";
    default:
      return "easy to moderate";
  }
}

function segmentCue(workout: AiBlueprintWorkout, segmentKind: BlueprintSegmentTargetRole) {
  if (segmentKind !== "main") {
    return "Stay relaxed.";
  }

  switch (workout.workoutIdentity) {
    case "5k_sharpening_repeats":
      return "Quick, coordinated, and repeatable; never sprinting.";
    case "10k_rhythm_intervals":
      return "Strong rhythm you could repeat again, not a forced rep.";
    case "race_pace_session":
      return "Race rhythm by effort unless backend pace gates provide a range.";
    case "taper_tuneup_run":
      return "Light and sharp, with freshness protected.";
    case "marathon_steady_specificity":
      return "Steady, patient, and controlled; never a time trial.";
    case "controlled_downhill_durability":
      return "Quick relaxed cadence, controlled mechanics, and no risky descent.";
    case "hike_run_endurance":
      return "Run gentle terrain, power-hike steeper climbs, and keep effort aerobic.";
    case "mountain_long_run_time_on_feet":
      return "Time on feet and terrain control matter more than pace.";
    default:
      return workout.segmentIntent.replaceAll("_", " ");
  }
}

function segmentHint(workout: AiBlueprintWorkout, segmentKind: BlueprintSegmentTargetRole) {
  if (segmentKind !== "main") {
    return "Let breathing settle before changing effort.";
  }

  switch (workout.workoutIdentity) {
    case "5k_sharpening_repeats":
    case "10k_rhythm_intervals":
      return "If repeat quality fades, keep the next one smoother rather than harder.";
    case "race_pace_session":
      return "Use rhythm and control first; pace is optional only when backend truth allows it.";
    case "taper_tuneup_run":
      return "Stop the lift while it still feels easy to recover from.";
    case "marathon_steady_specificity":
      return "Durability comes from patience here, not proving marathon pace.";
    case "controlled_downhill_durability":
      return "Skip downhill work if footing is uncertain or control slips.";
    case "hike_run_endurance":
    case "mountain_long_run_time_on_feet":
      return "Use hiking breaks before fatigue turns into form breakdown.";
    default:
      return "Use the workout purpose, not the watch, as the first governor.";
  }
}

function shouldApplyPaceTarget(
  workout: AiBlueprintWorkout,
  segmentKind: BlueprintSegmentTargetRole,
) {
  if (segmentKind !== "main") {
    return false;
  }

  return !["hills", "trail"].includes(workout.workoutFamily);
}

function findDeterministicPaceTarget(
  deterministicWorkout: CanonicalWorkout | null,
  segmentKind: BlueprintSegmentTargetRole,
) {
  if (!deterministicWorkout) {
    return null;
  }

  const segment =
    deterministicWorkout.segments.find((candidate) =>
      segmentKind === "main"
        ? mainLikeSegmentTypes.has(candidate.segment_type ?? "")
        : candidate.segment_type === segmentKind,
    ) ??
    deterministicWorkout.segments.find((candidate) =>
      Boolean(candidate.target?.pace_min_per_km_range),
    );

  return segment?.target?.pace_min_per_km_range ?? segment?.target?.pace_range_min_km ?? null;
}

function defaultEstimatedHrBandForSegment(
  workout: AiBlueprintWorkout,
  segmentKind: BlueprintSegmentTargetRole,
): DefaultEstimatedHrBand | null {
  if (segmentKind === "cooldown") {
    return "recovery";
  }

  if (segmentKind === "recovery") {
    return "recovery";
  }

  if (segmentKind === "warmup") {
    return "easy";
  }

  if (["intervals", "hills", "trail", "race"].includes(workout.workoutFamily)) {
    return null;
  }

  if (workout.workoutFamily === "recovery") {
    return "recovery";
  }

  if (workout.workoutFamily === "easy") {
    return "easy";
  }

  if (workout.workoutFamily === "long") {
    return "longAerobic";
  }

  if (workout.workoutFamily === "steady") {
    return "steady";
  }

  if (workout.workoutFamily === "tempo") {
    return "tempo";
  }

  return null;
}

function isBlueprintLongRunIntent(workout: AiBlueprintWorkout) {
  return (
    workout.workoutFamily === "long" ||
    workout.workoutIdentity === "hike_run_endurance" ||
    workout.workoutIdentity === "mountain_long_run_time_on_feet"
  );
}

function isBlueprintCadenceIntent(
  workout: AiBlueprintWorkout,
  context: ReturnType<typeof buildNormalizationContext>,
) {
  const policy = context.goalFamilyPolicy;

  return (
    policy.expectedQualityIdentities.has(workout.workoutIdentity) ||
    policy.specialtyIdentities.has(workout.workoutIdentity) ||
    (policy.cadence.useLongRunSlot && policy.longRunIdentities.has(workout.workoutIdentity)) ||
    (policy.cadence.kind === "quality" && isQualityFamily(workout.workoutFamily))
  );
}

function isQualityFamily(family: AuthoredWorkoutFamily) {
  return (
    family === "tempo" || family === "intervals" || family === "progression" || family === "race"
  );
}

type DefaultEstimatedHrBand = "recovery" | "easy" | "longAerobic" | "steady" | "tempo";

const defaultEstimatedHrBands: Record<DefaultEstimatedHrBand, [number, number]> = {
  recovery: [0.55, 0.65],
  easy: [0.6, 0.72],
  longAerobic: [0.6, 0.75],
  steady: [0.7, 0.8],
  tempo: [0.8, 0.88],
};

function buildDefaultEstimatedHrTarget(estimatedMaxHr: number, band: DefaultEstimatedHrBand) {
  const [lowerPercent, upperPercent] = defaultEstimatedHrBands[band];

  return {
    hr_bpm_range: `${roundBpmToNearestFive(estimatedMaxHr * lowerPercent)}-${roundBpmToNearestFive(
      estimatedMaxHr * upperPercent,
    )} bpm`,
    hr_target_source: "default_estimated_hr",
    label: "Default HR guidance",
    source_note: "Estimated from age, not personalized zones.",
  };
}

function buildWorkoutMetricMode(
  segments: CanonicalSegment[],
  context: ReturnType<typeof buildNormalizationContext>,
): CanonicalMetricModeJson {
  const hasPace = segments.some((segment) => targetHasMetric(segment.target, "pace"));
  const hasHr = segments.some((segment) => targetHasMetric(segment.target, "hr"));
  const guidance: CanonicalMetricGuidance = hasPace
    ? hasHr
      ? "mixed"
      : "pace"
    : hasHr
      ? "heart_rate"
      : "effort";

  return toCanonicalMetricModeJson({
    guidance,
    paceTargetsAllowed: hasPace,
    hrTargetsAllowed: hasHr,
    hrTargetSource: hasHr ? "default_estimated_hr" : "effort_only",
    hrTargetLabel: hasHr ? "Default HR guidance" : null,
    hrTargetSourceNote: hasHr ? "Estimated from age, not personalized zones." : null,
    reason:
      hasPace && hasHr
        ? "Pace guidance is gated by benchmark/watch truth, and HR guidance is age-estimated default guidance."
        : hasPace
          ? "Pace guidance is gated by benchmark/watch truth."
          : hasHr
            ? "HR guidance is a broad age-estimated default, not personalized zones."
            : context.estimatedMaxHr
              ? "Metric resolver keeps this workout effort-guided; default HR is not useful for this workout type."
              : "Metric resolver keeps this workout effort-guided without numeric pace or HR targets.",
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

function normalizeBlueprintGoalContext(
  authoringInput: StructuredAuthoringInput,
  blueprint: AiFirstPlanBlueprint | null,
): CanonicalWorkout["goal_context"] {
  const normalized = normalizeCanonicalGoalContext({
    goalType: authoringInput.goal.goalType,
    goalStyle: authoringInput.goal.goalStyle ?? null,
    terrainFocus: authoringInput.preferences.terrainFocus ?? "standard",
    targetDate: authoringInput.schedule.targetDate ?? blueprint?.targetDate ?? null,
    targetTime: authoringInput.goal.targetTime ?? null,
  });

  return {
    goal_type: normalized?.goalType ?? authoringInput.goal.goalType,
    ...(normalized?.goalStyle ? { goal_style: normalized.goalStyle } : {}),
    ...(normalized?.terrainFocus ? { terrain_focus: normalized.terrainFocus } : {}),
    ...(normalized?.targetDate ? { target_date: normalized.targetDate } : {}),
    ...(normalized?.targetTime ? { target_time: normalized.targetTime } : {}),
  };
}

function validateNormalizedPlanDoctrine(
  workouts: CanonicalWorkout[],
  context: ReturnType<typeof buildNormalizationContext>,
  issues: NormalizationIssue[],
) {
  for (const workout of workouts) {
    if (context.fixedRestDays.has(workout.weekday) && workout.workout_family !== "rest") {
      issues.push({
        code: "fixed_rest_day_violation",
        path: `${workout.date}.workout_family`,
        message: `${workout.date} is a fixed rest day and cannot contain a non-rest workout.`,
      });
    }
  }

  const longRuns = workouts.filter(
    (workout) => workout.workout_family === "long" || workout.workout_type === "long_run",
  );
  const longRunLoads = longRuns.map((workout) => estimateCanonicalWorkoutLoad(workout));
  let previousNonCutbackLongRunLoad = longRunLoads[0] ?? 0;

  for (let index = 1; index < longRunLoads.length; index += 1) {
    const previousWorkout = longRuns[index - 1]!;
    const currentLoad = longRunLoads[index]!;
    const previousLoad = longRunLoads[index - 1]!;
    const isAllowedCutbackRebound =
      isCutbackLongRun(previousWorkout) &&
      previousNonCutbackLongRunLoad > 0 &&
      currentLoad <= previousNonCutbackLongRunLoad * 1.25;

    if (currentLoad > previousLoad * 1.5 && !isAllowedCutbackRebound) {
      issues.push({
        code: "long_run_progression_too_steep",
        path: "planned_workouts",
        message: `Long-run progression jumps too aggressively between weeks (${longRunLoads
          .map((load) => Number(load.toFixed(1)))
          .join(" -> ")}).`,
      });
      break;
    }

    if (!isCutbackLongRun(longRuns[index]!)) {
      previousNonCutbackLongRunLoad = Math.max(previousNonCutbackLongRunLoad, currentLoad);
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

function isCutbackLongRun(workout: CanonicalWorkout) {
  const sourceWorkoutType = workout.source_workout_type ?? "";

  return (
    sourceWorkoutType.includes("cutback") ||
    /cutback|reduced/i.test(workout.title) ||
    /cutback/i.test(workout.summary)
  );
}

function resolveBlueprintWorkoutDate(
  workout: AiBlueprintWorkout,
  week: AiBlueprintWeek,
  context: ReturnType<typeof buildNormalizationContext>,
) {
  const weekStart = addDaysIso(
    context.authoringInput.schedule.startDate,
    (week.weekNumber - 1) * 7,
  );
  const dateForWeekday = Array.from({ length: 7 }, (_, offset) =>
    addDaysIso(weekStart, offset),
  ).find((candidate) => weekdayLong(candidate) === workout.weekday);

  if (!dateForWeekday) {
    return null;
  }

  if (workout.date && workout.date !== dateForWeekday) {
    return null;
  }

  return workout.date ?? dateForWeekday;
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

function phaseForWeek(blueprint: AiFirstPlanBlueprint, weekNumber: number) {
  return blueprint.weeks.find((week) => week.weekNumber === weekNumber)?.phase ?? "Base";
}

function estimateBlueprintWorkoutDurationMin(
  workout: AiBlueprintWorkout,
  deterministicWorkout: CanonicalWorkout | null,
) {
  const deterministicDuration = deterministicWorkout
    ? estimateCanonicalWorkoutDurationMin(deterministicWorkout)
    : 0;

  if (deterministicDuration > 0) {
    if (workout.workoutIdentity === "cutback_long_run") {
      return Math.max(35, Math.round(deterministicDuration * 0.75));
    }

    if (workout.workoutIdentity === "taper_long_run") {
      return Math.max(30, Math.round(deterministicDuration * 0.65));
    }

    if (workout.workoutIdentity === "ultra_time_on_feet_durability") {
      return Math.max(50, Math.round(deterministicDuration * 0.9));
    }

    if (workout.workoutIdentity === "hike_run_endurance") {
      return Math.max(45, Math.round(deterministicDuration * 0.9));
    }

    return deterministicDuration;
  }

  switch (workout.workoutFamily) {
    case "long":
      return 75;
    case "tempo":
    case "intervals":
    case "hills":
    case "trail":
      return 50;
    case "steady":
      return 45;
    case "recovery":
      return 30;
    default:
      return 40;
  }
}

function estimateCanonicalWorkoutDurationMin(workout: CanonicalWorkout) {
  return workout.segments.reduce((total, segment) => {
    if (typeof segment.duration_min === "number") {
      return total + segment.duration_min;
    }

    if (segment.prescription?.duration_min) {
      return total + segment.prescription.duration_min;
    }

    if (typeof segment.distance_km === "number") {
      return total + segment.distance_km * 6;
    }

    if (segment.prescription?.distance_km) {
      return total + segment.prescription.distance_km * 6;
    }

    return total;
  }, 0);
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

    if (prescription?.mode === "repeats" && prescription.repeat_count && prescription.repeat_unit) {
      return (
        total +
        (estimateUnitDurationMin(prescription.repeat_unit) +
          (prescription.recovery_unit ? estimateUnitDurationMin(prescription.recovery_unit) : 0)) *
          prescription.repeat_count
      );
    }

    return total;
  }, 0);
}

function estimateUnitDurationMin(unit: NonNullable<StepPrescription["repeat_unit"]>) {
  if (unit.mode === "time" && unit.duration_min) {
    return unit.duration_min / 6;
  }

  if (unit.mode === "distance" && unit.distance_km) {
    return unit.distance_km;
  }

  return 0;
}

function containsForbiddenCoachingClaims(workout: AiBlueprintWorkout) {
  const text = JSON.stringify(workout).toLowerCase();

  return (
    /\b(?:elevation gain|vertical gain|vert)\b.*\b\d+\s*(?:m|meters|metres|ft|feet)\b/.test(text) ||
    /\b\d+\s*(?:m|meters|metres|ft|feet)\b.*\b(?:elevation gain|vertical gain|vert)\b/.test(text) ||
    /\b(?:diagnose|diagnosis|treat|treatment|rehab|rehabilitation|therapy|medical)\b/.test(text) ||
    /\b(?:threshold hr|aet|anaerobic threshold|lactate threshold heart rate)\b/.test(text) ||
    /\b\d{2,3}\s*-\s*\d{2,3}\s*bpm\b/.test(text)
  );
}

export function buildAiFirstPlanBlueprintTrace({
  authoringInput,
  blueprint,
  normalizedWorkouts,
  sourceStatus,
  sourceKind,
  fallbackReason,
  issues,
  repairs,
}: {
  authoringInput: StructuredAuthoringInput;
  blueprint: AiFirstPlanBlueprint | null;
  normalizedWorkouts: TrainingPlanV2["planned_workouts"] | null;
  sourceStatus: AiFirstPlanBlueprintTraceMetadata["sourceStatus"];
  sourceKind: string | null;
  fallbackReason: string | null;
  issues: Array<{ code: string; message: string; path?: string }>;
  repairs: string[];
}): AiFirstPlanBlueprintTraceMetadata {
  const context = buildNormalizationContext(authoringInput);
  const normalizedWeeks = normalizedWorkouts
    ? groupCanonicalIdentityTraceByWeek(normalizedWorkouts)
    : [];

  return {
    sourceKind,
    sourceStatus,
    fallbackReason,
    model: null,
    timeoutMs: null,
    elapsedMs: null,
    requestSummary: {
      goalFamily: context.goalFamilyPolicy.label,
      goalType: authoringInput.goal.goalType,
      goalStyle: authoringInput.goal.goalStyle ?? null,
      goalDistance: authoringInput.goal.goalType,
      targetTimePresent: Boolean(authoringInput.goal.targetTime),
      targetDate: authoringInput.schedule.targetDate ?? null,
      runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
    },
    requiredCadenceSlots: [...context.requiredCadenceSlots.entries()].map(([weekNumber, slot]) => ({
      weekNumber,
      date: slot.date,
      weekday: slot.weekday,
      kind: slot.kind,
      identityOptions: slot.identityOptions.slice(0, 12),
      purpose: boundedTraceText(slot.purpose),
    })),
    authoredBlueprintWeeks: blueprint ? groupAuthoredBlueprintTraceByWeek(blueprint) : [],
    validationIssueCodes: issues.map((issue) => issue.code).slice(0, 24),
    validationIssueSummary: issues
      .map((issue) => `${issue.code}: ${issue.message}`)
      .map(boundedTraceText)
      .slice(0, 12),
    repairs: repairs.map(boundedTraceText).slice(0, 12),
    normalizedCanonicalWeeks: normalizedWeeks,
    deterministicFallbackBoundary: {
      used: sourceStatus === "deterministic_fallback",
      reason: fallbackReason,
    },
    finalReviewedPlanIdentityCounts: normalizedWorkouts
      ? countCanonicalWorkoutField(normalizedWorkouts, "workout_identity")
      : {},
    finalReviewedPlanFamilyCounts: normalizedWorkouts
      ? countCanonicalWorkoutField(normalizedWorkouts, "workout_family")
      : {},
    finalReviewedPlanIconCounts: normalizedWorkouts
      ? countCanonicalWorkoutField(normalizedWorkouts, "calendar_icon_key")
      : {},
    persistedIdentityCounts: null,
  };
}

function groupAuthoredBlueprintTraceByWeek(blueprint: AiFirstPlanBlueprint) {
  return blueprint.weeks.slice(0, 52).map((week) => ({
    weekNumber: week.weekNumber,
    phase: week.phase,
    theme: boundedTraceText(week.theme),
    identities: week.plannedWorkouts.map((workout) => workout.workoutIdentity).slice(0, 7),
    families: week.plannedWorkouts.map((workout) => workout.workoutFamily).slice(0, 7),
    icons: week.plannedWorkouts.map((workout) => workout.calendarIconKey).slice(0, 7),
    dates: week.plannedWorkouts
      .map((workout) => workout.date ?? workout.weekday)
      .filter(Boolean)
      .slice(0, 7),
  }));
}

function groupCanonicalIdentityTraceByWeek(workouts: TrainingPlanV2["planned_workouts"]) {
  const byWeek = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of workouts) {
    byWeek.set(workout.week_number, [...(byWeek.get(workout.week_number) ?? []), workout]);
  }

  return [...byWeek.entries()]
    .sort(([left], [right]) => left - right)
    .slice(0, 52)
    .map(([weekNumber, weekWorkouts]) => ({
      weekNumber,
      identities: weekWorkouts.map((workout) => workout.workout_identity ?? "unknown").slice(0, 7),
      families: weekWorkouts.map((workout) => workout.workout_family ?? "unknown").slice(0, 7),
      icons: weekWorkouts.map((workout) => workout.calendar_icon_key ?? "unknown").slice(0, 7),
    }));
}

function countCanonicalWorkoutField(
  workouts: TrainingPlanV2["planned_workouts"],
  field: "workout_identity" | "workout_family" | "calendar_icon_key",
) {
  return workouts.reduce<Record<string, number>>((counts, workout) => {
    const value = workout[field] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function boundedTraceText(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function failedAiBlueprintNormalization(
  reason: string,
  issues: NormalizationIssue[],
  blueprintTrace?: AiFirstPlanBlueprintTraceMetadata,
): Extract<AiFirstPlanBlueprintNormalizationResult, { ok: false }> {
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
        "Hito should use the deterministic structured generator because the AI-authored blueprint did not pass backend validation.",
      ],
      metricPolicySummary:
        "Deterministic fallback preserves existing pace, default-HR, fixed-rest-day, and effort-safety gates.",
      blueprintTrace: blueprintTrace ?? null,
    },
  };
}

function buildAiFirstPlanBlueprintSystemPrompt() {
  return [
    "You author a compact Hito Running first-plan coaching blueprint from validated structured setup truth.",
    "Return only the ai-first-plan-blueprint-v1 JSON object requested by the schema.",
    "Your blueprint is not persisted directly. Hito backend expands it into canonical training-plan-v2 workouts and segments.",
    "Use Hito workout taxonomy only: workoutFamily, workoutIdentity, and calendarIconKey must be valid schema values.",
    "Return only authored running workouts in each week. The backend fills fixed rest days and unscheduled days.",
    "Never include rest/rest_and_recovery in plannedWorkouts. Rest days are not authored workouts.",
    "Respect fixed rest days as hard constraints and use the requested running days/week.",
    "Use the preferred long-run day whenever feasible and include exactly one long-run intent per week.",
    "Taper and final weeks still need a reduced long-run intent, usually taper_long_run, cutback_long_run, long_aerobic_run, hike_run_endurance, mountain_long_run_time_on_feet, or ultra_time_on_feet_durability depending on the goal.",
    "Follow the backend goal-family identity policy. Beginner/low-support plans stay mostly easy, recovery, steady, and long; supported performance, marathon, ultra, and mountain/trail plans use the required cadence slots for their specific workout identities.",
    "Do not fill required cadence slots with generic easy, steady, recovery, or long support work unless the slot explicitly asks for a long-run specialty identity.",
    "Keep segmentIntent compact: describe the session shape, not a full segment tree.",
    "Keep metricIntent compact. Do not output numeric HR, pace ranges, personalized zones, or metric targets.",
    "Do not output user ids, plan ids, logs, completion state, provider sync placeholders, AI verdicts, or feedback placeholders.",
    "Do not invent medical, rehab, threshold-HR, lab-tested, exact elevation, or route-matching claims.",
    "Keep review assumptions concise and honest about weak support, target-time uncertainty, conservative load, and default HR guidance.",
  ].join("\n");
}

function buildAiFirstPlanBlueprintUserPrompt({
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
    "Allowed compact blueprint taxonomy:",
    JSON.stringify({
      authoredWorkoutFamilies: authoredWorkoutFamilyValues,
      authoredWorkoutIdentities: authoredWorkoutIdentityValues,
      authoredCalendarIconKeys: authoredCalendarIconKeyValues,
      segmentIntents: segmentIntentValues,
      metricIntents: metricIntentValues,
      metricGuidance: CANONICAL_METRIC_GUIDANCE_VALUES,
      hrTargetSources: HR_TARGET_SOURCE_VALUES,
    }),
    "",
    "Metric policy:",
    JSON.stringify(buildPromptMetricPolicy(authoringInput)),
    "",
    "Goal-family identity policy:",
    JSON.stringify(buildPromptGoalFamilyIdentityPolicy(authoringInput)),
    "",
    "Required authored workout slots:",
    JSON.stringify(buildPromptRequiredWorkoutSlots(authoringInput)),
    "Use every required slot exactly once in the matching week. Do not add extra dates, omit slots, move slots, or place authored workouts on fixed rest days.",
    "Each week has one required long-run slot. That slot must use workoutFamily long, hike_run_endurance, mountain_long_run_time_on_feet, or ultra_time_on_feet_durability.",
    "If a slot includes requiredIdentityOptions, choose one of those identities for that exact slot. If mustBeQuality=true, use workoutFamily tempo, intervals, progression, or race unless the option itself is a backend long-run specialty.",
    "",
    "Reference-style example guidance:",
    JSON.stringify(buildReferenceStyleSummary(referenceExample)),
  ].join("\n");
}

function buildPromptRequiredWorkoutSlots(authoringInput: StructuredAuthoringInput) {
  const horizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const runningDays = new Set(
    authoringInput.availability.preferredRunningDays.filter((day) => !fixedRestDays.has(day)),
  );
  const preferredLongRunDay = authoringInput.availability.preferredLongRunDay ?? null;
  const policy = resolveGoalFamilyIdentityPolicy(authoringInput);
  const cadenceSlots = buildRequiredCadenceSlots(authoringInput, policy);

  return Array.from({ length: horizonWeeks }, (_value, weekIndex) => {
    const weekNumber = weekIndex + 1;
    const weekStart = addDaysIso(authoringInput.schedule.startDate, weekIndex * 7);
    const slots = Array.from({ length: 7 }, (_day, dayIndex) => {
      const date = addDaysIso(weekStart, dayIndex);
      const weekday = weekdayLong(date);

      if (!runningDays.has(weekday)) {
        return null;
      }

      return {
        date,
        weekday,
        mustBeLongRun: preferredLongRunDay ? weekday === preferredLongRunDay : false,
        mustBeQuality:
          cadenceSlots.get(weekNumber)?.date === date &&
          cadenceSlots.get(weekNumber)?.kind === "quality",
        ...(cadenceSlots.get(weekNumber)?.date === date
          ? {
              cadenceKind: cadenceSlots.get(weekNumber)!.kind,
              requiredIdentityOptions: cadenceSlots.get(weekNumber)!.identityOptions,
              cadencePurpose: cadenceSlots.get(weekNumber)!.purpose,
            }
          : {}),
      };
    }).filter(
      (
        slot,
      ): slot is {
        date: string;
        weekday: string;
        mustBeLongRun: boolean;
        mustBeQuality: boolean;
        cadenceKind?: GoalFamilyCadenceKind;
        requiredIdentityOptions?: AuthoredWorkoutIdentity[];
        cadencePurpose?: string;
      } => Boolean(slot),
    );

    return {
      weekNumber,
      slots,
    };
  });
}

function buildPromptGoalFamilyIdentityPolicy(authoringInput: StructuredAuthoringInput) {
  const policy = resolveGoalFamilyIdentityPolicy(authoringInput);

  return {
    family: policy.label,
    allowedIdentities: [...policy.allowedIdentities],
    expectedSupportIdentities: [...policy.expectedSupportIdentities],
    expectedQualityIdentities: [...policy.expectedQualityIdentities],
    longRunIdentities: [...policy.longRunIdentities],
    cutbackTaperIdentities: [...policy.cutbackTaperIdentities],
    specialtyIdentities: [...policy.specialtyIdentities],
    excludedIdentities: [...policy.excludedIdentities],
    cadence: buildPromptGoalFamilyCadencePolicy(authoringInput, policy),
  };
}

function buildRequiredCadenceSlots(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
) {
  const slots = new Map<number, RequiredCadenceSlot>();

  if (!isGoalFamilyCadencePlan(authoringInput, policy)) {
    return slots;
  }

  const horizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const runningDays = authoringInput.availability.preferredRunningDays.filter(
    (day) => !fixedRestDays.has(day),
  );
  const preferredLongRunDay = authoringInput.availability.preferredLongRunDay ?? null;
  const cadenceWeekday = chooseGoalFamilyCadenceWeekday(policy, runningDays, preferredLongRunDay);

  if (!cadenceWeekday) {
    return slots;
  }

  for (let weekIndex = 0; weekIndex < horizonWeeks; weekIndex += 1) {
    const weekNumber = weekIndex + 1;

    if (!shouldRequireGoalFamilyCadenceSlot(authoringInput, policy, weekNumber)) {
      continue;
    }

    const weekStart = addDaysIso(authoringInput.schedule.startDate, weekIndex * 7);
    const cadenceDate = Array.from({ length: 7 }, (_day, dayIndex) =>
      addDaysIso(weekStart, dayIndex),
    ).find((date) => weekdayLong(date) === cadenceWeekday);

    if (cadenceDate) {
      slots.set(weekNumber, {
        date: cadenceDate,
        weekday: cadenceWeekday,
        kind: policy.cadence.kind,
        identityOptions: cadenceIdentityOptionsForGoal(authoringInput, policy, weekNumber),
        purpose: cadencePurposeForGoal(authoringInput, policy, weekNumber),
      });
    }
  }

  return slots;
}

function resolveGoalFamilyIdentityPolicy(
  authoringInput: StructuredAuthoringInput,
): GoalFamilyIdentityPolicy {
  switch (authoringInput.goal.goalType) {
    case "5k":
      return goalFamilyIdentityPolicies.five_k;
    case "10k":
      return goalFamilyIdentityPolicies.ten_k;
    case "half_marathon":
      return goalFamilyIdentityPolicies.half_marathon;
    case "marathon":
      return goalFamilyIdentityPolicies.marathon;
    case "ultra_marathon":
      return goalFamilyIdentityPolicies.ultra;
    case "mountain_running":
      return goalFamilyIdentityPolicies.mountain_trail;
    case "build_consistency":
    default:
      return goalFamilyIdentityPolicies.beginner_consistency;
  }
}

function isGoalFamilyCadencePlan(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
) {
  if (policy.cadence.frequency === "none") {
    return false;
  }

  if (
    authoringInput.runnerProfile.experienceLevel === "new_runner" ||
    authoringInput.availability.maxRunningDaysPerWeek <= 3
  ) {
    return false;
  }

  if (policy.key === "half_marathon") {
    const hasPerformanceIntent =
      Boolean(authoringInput.goal.targetTime) ||
      authoringInput.goal.goalStyle === "target_time" ||
      authoringInput.goal.goalStyle === "ambitious";

    return hasPerformanceIntent || isBalancedHalfMarathonCadencePlan(authoringInput, policy);
  }

  return policy.key !== "beginner_consistency";
}

function isBalancedHalfMarathonCadencePlan(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
) {
  return (
    policy.key === "half_marathon" &&
    authoringInput.goal.goalStyle === "balanced" &&
    !authoringInput.goal.targetTime
  );
}

function buildPromptGoalFamilyCadencePolicy(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
) {
  if (!isGoalFamilyCadencePlan(authoringInput, policy)) {
    return {
      kind: "none",
      frequency: "none",
      reason: "Runner support level does not require forced quality or specialty cadence.",
    };
  }

  if (isBalancedHalfMarathonCadencePlan(authoringInput, policy)) {
    return {
      kind: "quality",
      frequency: "moderate_every_two_weeks_after_week_1",
      reason:
        "Supported balanced half-marathon plans may use Week 1 to acclimate, then need moderate half-specific rhythm from Week 2 without target-time intensity.",
    };
  }

  return policy.cadence;
}

function shouldRequireGoalFamilyCadenceSlot(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
  weekNumber: number,
) {
  if (isBalancedHalfMarathonCadencePlan(authoringInput, policy)) {
    return weekNumber >= 2 && weekNumber % 2 === 0;
  }

  return (
    policy.cadence.frequency === "weekly" ||
    (policy.cadence.frequency === "every_two_weeks" && weekNumber % 2 === 1)
  );
}

function chooseGoalFamilyCadenceWeekday(
  policy: GoalFamilyIdentityPolicy,
  runningDays: string[],
  preferredLongRunDay: string | null,
) {
  if (
    policy.cadence.useLongRunSlot &&
    preferredLongRunDay &&
    runningDays.includes(preferredLongRunDay)
  ) {
    return preferredLongRunDay;
  }

  const candidateOrder = ["Tuesday", "Thursday", "Monday", "Friday", "Wednesday", "Saturday"];

  return (
    candidateOrder.find(
      (weekday) => runningDays.includes(weekday) && weekday !== preferredLongRunDay,
    ) ?? null
  );
}

function cadenceIdentityOptionsForGoal(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
  weekNumber: number,
) {
  const isFinalTwoWeeks =
    weekNumber >= Math.max(1, resolveAuthoringHorizonWeeks(authoringInput) - 1);

  if (isBalancedHalfMarathonCadencePlan(authoringInput, policy)) {
    const balancedHalfOptions: AuthoredWorkoutIdentity[] = isFinalTwoWeeks
      ? ["taper_tuneup_run", "progression_run", "controlled_tempo_session"]
      : ["progression_run", "controlled_tempo_session", "half_marathon_threshold_durability"];

    return balancedHalfOptions.filter((identity) => policy.allowedIdentities.has(identity));
  }

  if (isFinalTwoWeeks) {
    const taperOptions = [...policy.cutbackTaperIdentities].filter((identity) =>
      policy.allowedIdentities.has(identity),
    );

    if (policy.cadence.kind === "specialty") {
      return [...new Set([...taperOptions, ...policy.specialtyIdentities])];
    }

    return [...new Set([...taperOptions, ...policy.expectedQualityIdentities])];
  }

  if (policy.cadence.useLongRunSlot) {
    return [...new Set([...policy.longRunIdentities, ...policy.specialtyIdentities])];
  }

  return [
    ...new Set([
      ...policy.expectedQualityIdentities,
      ...policy.specialtyIdentities,
      ...policy.longRunIdentities,
    ]),
  ].filter((identity) => policy.allowedIdentities.has(identity));
}

function cadencePurposeForGoal(
  authoringInput: StructuredAuthoringInput,
  policy: GoalFamilyIdentityPolicy,
  weekNumber: number,
) {
  const isFinalTwoWeeks =
    weekNumber >= Math.max(1, resolveAuthoringHorizonWeeks(authoringInput) - 1);

  if (isFinalTwoWeeks) {
    return "Reduced specificity that preserves freshness while keeping the goal-family signal visible.";
  }

  switch (policy.key) {
    case "five_k":
      return "Controlled faster-running rhythm or short sharpening repeats.";
    case "ten_k":
      return "Sustained rhythm, cruise-style intervals, or controlled faster running.";
    case "half_marathon":
      if (isBalancedHalfMarathonCadencePlan(authoringInput, policy)) {
        return "Moderate balanced half-marathon rhythm: progression, controlled tempo, or threshold durability without early target-time intensity.";
      }

      return "Half-marathon threshold durability, controlled tempo, or race-rhythm preparation.";
    case "marathon":
      return "Marathon-specific steady durability without unsupported race-pace precision.";
    case "ultra":
      return "Ultra time-on-feet, hike-run durability, or terrain-patient endurance.";
    case "mountain_trail":
      return "Trail, hill, downhill-control, climbing, or mountain time-on-feet specificity.";
    default:
      return "Safe goal-family cadence without adding unsupported hard-day density.";
  }
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
        ? "AI may mark metricIntent as pace_if_allowed or mixed_if_allowed. Backend will decide final pace targets."
        : "Use effort_only metricIntent; backend will not include numeric pace targets.",
    heartRate:
      typeof authoringInput.runnerProfile.age === "number"
        ? "AI must not include numeric HR. Backend may add labelled Default HR guidance from age after validation."
        : "AI must not include numeric HR; age and personal HR zones are absent.",
  };
}

function buildReferenceStyleSummary(referenceExample: unknown) {
  if (!referenceExample || typeof referenceExample !== "object") {
    return {
      note: "Use varied week-by-week workout identities and clear coaching intent. Do not author full segments; backend expands them.",
    };
  }

  const record = referenceExample as Record<string, unknown>;
  const workouts = Array.isArray(record.planned_workouts) ? record.planned_workouts : [];

  return {
    note: "Reference is for richness and weekly rhythm only; do not copy runtime placeholders, completion state, provider sync, feedback, or unsupported metrics.",
    sampleWorkouts: workouts.slice(0, 3).map((workout) => {
      const workoutRecord = workout as Record<string, unknown>;

      return {
        title: workoutRecord.title,
        summary: workoutRecord.summary,
        workoutType: workoutRecord.workout_type,
        phase: workoutRecord.phase,
      };
    }),
  };
}

function roundBpmToNearestFive(value: number) {
  return Math.round(value / 5) * 5;
}

function weekdayIndex(weekday: string) {
  return weekdayValues.indexOf(weekday as (typeof weekdayValues)[number]);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const aiBlueprintWorkoutOpenAiSchema = {
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
    "segmentIntent",
    "metricIntent",
  ],
  properties: {
    date: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    weekday: { type: "string", enum: [...weekdayValues] },
    workoutFamily: { type: "string", enum: [...authoredWorkoutFamilyValues] },
    workoutIdentity: { type: "string", enum: [...authoredWorkoutIdentityValues] },
    calendarIconKey: { type: "string", enum: [...authoredCalendarIconKeyValues] },
    title: { type: "string", maxLength: 160 },
    summary: { type: "string", maxLength: 360 },
    plannedRpe: { type: "integer", minimum: 1, maximum: 10 },
    estimatedFatigue: { type: "string", enum: [...estimatedFatigueValues] },
    recoveryPriority: { type: "string", enum: [...recoveryPriorityValues] },
    segmentIntent: { type: "string", enum: [...segmentIntentValues] },
    metricIntent: { type: "string", enum: [...metricIntentValues] },
  },
} as const;

const aiBlueprintWeekOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "weekNumber",
    "phase",
    "theme",
    "microcycleIntent",
    "cutbackWeek",
    "taperWeek",
    "longRunIntent",
    "longRunProgression",
    "plannedWorkouts",
  ],
  properties: {
    weekNumber: { type: "integer", minimum: 1, maximum: 52 },
    phase: { type: "string", enum: [...phaseValues] },
    theme: { type: "string", maxLength: 360 },
    microcycleIntent: { type: "string", maxLength: 360 },
    cutbackWeek: { type: "boolean" },
    taperWeek: { type: "boolean" },
    longRunIntent: { type: ["string", "null"], maxLength: 360 },
    longRunProgression: { type: ["string", "null"], maxLength: 360 },
    plannedWorkouts: {
      type: "array",
      minItems: 1,
      maxItems: 7,
      items: aiBlueprintWorkoutOpenAiSchema,
    },
  },
} as const;

export function buildAiFirstPlanBlueprintOpenAiSchema(runningDaysPerWeek = 7) {
  const boundedRunningDaysPerWeek = Math.min(7, Math.max(1, Math.round(runningDaysPerWeek)));

  return {
    ...aiFirstPlanBlueprintOpenAiSchema,
    properties: {
      ...aiFirstPlanBlueprintOpenAiSchema.properties,
      weeks: {
        ...aiFirstPlanBlueprintOpenAiSchema.properties.weeks,
        items: {
          ...aiBlueprintWeekOpenAiSchema,
          properties: {
            ...aiBlueprintWeekOpenAiSchema.properties,
            plannedWorkouts: {
              ...aiBlueprintWeekOpenAiSchema.properties.plannedWorkouts,
              minItems: boundedRunningDaysPerWeek,
              maxItems: boundedRunningDaysPerWeek,
            },
          },
        },
      },
    },
  } as const;
}

export const aiFirstPlanBlueprintOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "planName",
    "generatedFor",
    "goalSummary",
    "startDate",
    "targetDate",
    "preparationHorizonWeeks",
    "planPreferences",
    "reviewAssumptions",
    "metricPolicySummary",
    "weeks",
  ],
  properties: {
    schemaVersion: { type: "string", enum: [AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION] },
    planName: { type: "string", maxLength: 160 },
    generatedFor: { type: "string", maxLength: 160 },
    goalSummary: { type: "string", maxLength: 240 },
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
      items: aiBlueprintWeekOpenAiSchema,
    },
  },
} as const;
