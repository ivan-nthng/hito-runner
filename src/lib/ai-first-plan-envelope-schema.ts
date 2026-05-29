import { z } from "zod";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import type { structuredPlanAuthoringInputSchema } from "@/lib/structured-plan-authoring";

export const AI_FIRST_PLAN_ENVELOPE_SCHEMA_VERSION = "ai-first-plan-envelope-v1";

export const envelopeGoalFamilyCodeValues = ["bc", "5k", "10k", "hm", "m", "u", "mt"] as const;
export const envelopeGoalStyleCodeValues = ["rel", "bal", "amb", "tt"] as const;
export const envelopeWeekdayCodeValues = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;
export const envelopePhaseCodeValues = ["ba", "bu", "sp", "ta"] as const;
export const envelopeFrequencyCodeValues = ["n", "w", "e2", "e3"] as const;
export const envelopeLongRunModeCodeValues = [
  "aer",
  "steady_finish",
  "specific",
  "tof",
  "mountain_tof",
] as const;
export const envelopeEmphasisCodeValues = [
  "easy",
  "rec",
  "steady",
  "prog",
  "tempo",
  "thr",
  "int",
  "race",
  "marathon",
  "trail",
  "hill",
  "downhill",
  "hike",
  "tof",
  "cutback",
  "taper",
] as const;
export const envelopeMetricIntentCodeValues = [
  "effort",
  "default_hr",
  "gated_pace",
  "mixed",
] as const;
export const envelopeTerrainCodeValues = ["std", "roll", "mtn"] as const;
export const envelopeSupportCodeValues = ["none", "mob", "str_mob"] as const;

const boundedTextSchema = z.string().trim().min(1).max(280);

const phaseBlockSchema = z
  .object({
    pc: z.enum(envelopePhaseCodeValues),
    startWeek: z.number().int().min(1).max(52),
    endWeek: z.number().int().min(1).max(52),
    intent: boundedTextSchema,
    emphasis: z.array(z.enum(envelopeEmphasisCodeValues)).min(1).max(6),
  })
  .strict();

export const aiFirstPlanEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(AI_FIRST_PLAN_ENVELOPE_SCHEMA_VERSION),
    planName: z.string().trim().min(1).max(160),
    goal: z
      .object({
        family: z.enum(envelopeGoalFamilyCodeValues),
        style: z.enum(envelopeGoalStyleCodeValues),
      })
      .strict(),
    horizonWeeks: z.number().int().min(1).max(52),
    weeklyRhythm: z
      .object({
        runDays: z.number().int().min(1).max(7),
        longRunDay: z.enum(envelopeWeekdayCodeValues).nullable(),
        qualityFrequency: z.enum(envelopeFrequencyCodeValues),
        specialtyFrequency: z.enum(envelopeFrequencyCodeValues),
        supportBias: z.enum(["easy", "steady", "durability", "terrain"]).default("easy"),
      })
      .strict(),
    longRunProgression: z
      .object({
        mode: z.enum(envelopeLongRunModeCodeValues),
        cutbackEveryWeeks: z.number().int().min(0).max(6),
        taperWeeks: z.number().int().min(0).max(4),
        peakIntent: boundedTextSchema,
      })
      .strict(),
    qualityEmphasis: z
      .object({
        primary: z.enum(envelopeEmphasisCodeValues).nullable(),
        secondary: z.array(z.enum(envelopeEmphasisCodeValues)).max(5),
      })
      .strict(),
    terrainSupport: z
      .object({
        terrain: z.enum(envelopeTerrainCodeValues),
        support: z.enum(envelopeSupportCodeValues),
        downhillCaution: z.boolean(),
      })
      .strict(),
    metricGuidance: z.enum(envelopeMetricIntentCodeValues),
    phases: z.array(phaseBlockSchema).min(1).max(8),
    reviewAssumptions: z.array(z.string().trim().min(1).max(260)).max(8),
  })
  .strict();

export type AiFirstPlanEnvelope = z.output<typeof aiFirstPlanEnvelopeSchema>;
export type AiFirstPlanEnvelopePhase = AiFirstPlanEnvelope["phases"][number];
export type StructuredAuthoringInput = z.output<typeof structuredPlanAuthoringInputSchema>;
export type CanonicalWorkout = TrainingPlanV2["planned_workouts"][number];

export type EnvelopeGoalFamilyCode = (typeof envelopeGoalFamilyCodeValues)[number];
export type EnvelopeGoalStyleCode = (typeof envelopeGoalStyleCodeValues)[number];
export type EnvelopeWeekdayCode = (typeof envelopeWeekdayCodeValues)[number];
export type EnvelopePhaseCode = (typeof envelopePhaseCodeValues)[number];
export type EnvelopeFrequencyCode = (typeof envelopeFrequencyCodeValues)[number];
export type EnvelopeLongRunModeCode = (typeof envelopeLongRunModeCodeValues)[number];
export type EnvelopeEmphasisCode = (typeof envelopeEmphasisCodeValues)[number];
export type EnvelopeMetricIntentCode = (typeof envelopeMetricIntentCodeValues)[number];
export type EnvelopeTerrainCode = (typeof envelopeTerrainCodeValues)[number];
export type EnvelopeSupportCode = (typeof envelopeSupportCodeValues)[number];

export type AiFirstPlanEnvelopeIssue = {
  code: string;
  message: string;
  path?: string;
};

export type AiFirstPlanEnvelopeExpansionResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      metadata: {
        sourceKind: "ai_first_plan_envelope_v1";
        sourceStatus: "expanded_from_envelope";
        validationIssues: string[];
        validationIssueCount: number;
        repairs: string[];
        reviewAssumptions: string[];
      };
    }
  | {
      ok: false;
      reason: "ai_first_plan_envelope_invalid" | "ai_first_plan_envelope_expansion_failed";
      issues: AiFirstPlanEnvelopeIssue[];
    };
