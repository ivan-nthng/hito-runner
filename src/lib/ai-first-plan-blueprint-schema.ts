import { z } from "zod";
import type { AiFirstPlanDraftMetadata } from "@/lib/ai-first-plan-draft-metadata";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import type { structuredPlanAuthoringInputSchema } from "@/lib/structured-plan-authoring";
import {
  authoredCalendarIconKeyValues,
  authoredWorkoutFamilyValues,
  authoredWorkoutIdentityValues,
  estimatedFatigueValues,
  metricIntentValues,
  phaseValues,
  recoveryPriorityValues,
  segmentIntentValues,
  weekdayValues,
} from "@/lib/ai-first-plan-blueprint-taxonomy";

export const AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION = "ai-first-plan-blueprint-v1";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const boundedTextSchema = z.string().trim().min(1).max(360);
const nullableBoundedTextSchema = z.string().trim().min(1).max(360).nullable();

const aiBlueprintWorkoutSchema = z
  .object({
    date: isoDateSchema,
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
export type StructuredAuthoringInput = z.output<typeof structuredPlanAuthoringInputSchema>;
export type AiBlueprintWeek = AiFirstPlanBlueprint["weeks"][number];
export type AiBlueprintWorkout = AiBlueprintWeek["plannedWorkouts"][number];
export type CanonicalWorkout = TrainingPlanV2["planned_workouts"][number];
export type CanonicalSegment = CanonicalWorkout["segments"][number];
export type NormalizationIssue = { code: string; message: string; path?: string };

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
  const plannedWorkoutItemSchema = {
    ...aiBlueprintWorkoutOpenAiSchema,
    properties: {
      ...aiBlueprintWorkoutOpenAiSchema.properties,
      date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    },
  };

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
              items: plannedWorkoutItemSchema,
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
