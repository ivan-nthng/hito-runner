import { resolveAuthoringHorizonWeeks } from "@/lib/ai-first-plan-blueprint-policy";
import {
  AI_FIRST_PLAN_ENVELOPE_SCHEMA_VERSION,
  envelopeEmphasisCodeValues,
  envelopeFrequencyCodeValues,
  envelopeGoalFamilyCodeValues,
  envelopeGoalStyleCodeValues,
  envelopeLongRunModeCodeValues,
  envelopeMetricIntentCodeValues,
  envelopePhaseCodeValues,
  envelopeSupportCodeValues,
  envelopeTerrainCodeValues,
  envelopeWeekdayCodeValues,
  type AiFirstPlanEnvelope,
  type StructuredAuthoringInput,
} from "@/lib/ai-first-plan-envelope-schema";
import {
  buildMockAiFirstPlanEnvelope,
  resolveEnvelopeGoalFamilyCode,
  resolveEnvelopeGoalStyleCode,
  weekdayNameToEnvelopeCode,
} from "@/lib/ai-first-plan-envelope-policy";

export type AiFirstPlanEnvelopePrompt = {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
  promptCharEstimate: number;
  systemPromptChars: number;
  userPromptChars: number;
  responseSchemaChars: number;
};

const phaseOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["pc", "startWeek", "endWeek", "intent", "emphasis"],
  properties: {
    pc: { type: "string", enum: [...envelopePhaseCodeValues] },
    startWeek: { type: "integer", minimum: 1, maximum: 52 },
    endWeek: { type: "integer", minimum: 1, maximum: 52 },
    intent: { type: "string", minLength: 1, maxLength: 280 },
    emphasis: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string", enum: [...envelopeEmphasisCodeValues] },
    },
  },
};

export const aiFirstPlanEnvelopeOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "planName",
    "goal",
    "horizonWeeks",
    "weeklyRhythm",
    "longRunProgression",
    "qualityEmphasis",
    "terrainSupport",
    "metricGuidance",
    "phases",
    "reviewAssumptions",
  ],
  properties: {
    schemaVersion: { type: "string", enum: [AI_FIRST_PLAN_ENVELOPE_SCHEMA_VERSION] },
    planName: { type: "string", minLength: 1, maxLength: 160 },
    goal: {
      type: "object",
      additionalProperties: false,
      required: ["family", "style"],
      properties: {
        family: { type: "string", enum: [...envelopeGoalFamilyCodeValues] },
        style: { type: "string", enum: [...envelopeGoalStyleCodeValues] },
      },
    },
    horizonWeeks: { type: "integer", minimum: 1, maximum: 52 },
    weeklyRhythm: {
      type: "object",
      additionalProperties: false,
      required: ["runDays", "longRunDay", "qualityFrequency", "specialtyFrequency", "supportBias"],
      properties: {
        runDays: { type: "integer", minimum: 1, maximum: 7 },
        longRunDay: { type: ["string", "null"], enum: [...envelopeWeekdayCodeValues, null] },
        qualityFrequency: { type: "string", enum: [...envelopeFrequencyCodeValues] },
        specialtyFrequency: { type: "string", enum: [...envelopeFrequencyCodeValues] },
        supportBias: { type: "string", enum: ["easy", "steady", "durability", "terrain"] },
      },
    },
    longRunProgression: {
      type: "object",
      additionalProperties: false,
      required: ["mode", "cutbackEveryWeeks", "taperWeeks", "peakIntent"],
      properties: {
        mode: { type: "string", enum: [...envelopeLongRunModeCodeValues] },
        cutbackEveryWeeks: { type: "integer", minimum: 0, maximum: 6 },
        taperWeeks: { type: "integer", minimum: 0, maximum: 4 },
        peakIntent: { type: "string", minLength: 1, maxLength: 280 },
      },
    },
    qualityEmphasis: {
      type: "object",
      additionalProperties: false,
      required: ["primary", "secondary"],
      properties: {
        primary: { type: ["string", "null"], enum: [...envelopeEmphasisCodeValues, null] },
        secondary: {
          type: "array",
          maxItems: 5,
          items: { type: "string", enum: [...envelopeEmphasisCodeValues] },
        },
      },
    },
    terrainSupport: {
      type: "object",
      additionalProperties: false,
      required: ["terrain", "support", "downhillCaution"],
      properties: {
        terrain: { type: "string", enum: [...envelopeTerrainCodeValues] },
        support: { type: "string", enum: [...envelopeSupportCodeValues] },
        downhillCaution: { type: "boolean" },
      },
    },
    metricGuidance: { type: "string", enum: [...envelopeMetricIntentCodeValues] },
    phases: { type: "array", minItems: 1, maxItems: 8, items: phaseOpenAiSchema },
    reviewAssumptions: {
      type: "array",
      maxItems: 8,
      items: { type: "string", minLength: 1, maxLength: 260 },
    },
  },
};

export function buildAiFirstPlanEnvelopePrompt({
  authoringInput,
}: {
  authoringInput: StructuredAuthoringInput;
}): AiFirstPlanEnvelopePrompt {
  const policyGuide = buildMockAiFirstPlanEnvelope(authoringInput);
  const expectedGoal = {
    family: resolveEnvelopeGoalFamilyCode(authoringInput),
    style: resolveEnvelopeGoalStyleCode(authoringInput),
  };
  const expectedLongRunDay = authoringInput.availability.preferredLongRunDay
    ? weekdayNameToEnvelopeCode[authoringInput.availability.preferredLongRunDay]
    : null;
  const setupSummary = buildSetupSummary(
    authoringInput,
    policyGuide,
    expectedGoal,
    expectedLongRunDay,
  );
  const systemPrompt = [
    "You author one compact planning envelope for Hito Running.",
    "Return only valid JSON matching the provided ai-first-plan-envelope-v1 schema.",
    "The envelope is coaching intent only. Do not author workout rows, exact dates, segments, pace targets, HR targets, IDs, logs, or persistence state.",
    "Backend owns exact calendar slots, fixed rest days, long-run placement, workout identities, segments, metric gates, validation, review, and saving.",
    "Support evidence outranks ambition. Keep beginner and low-support runners conservative.",
    "Use compact codes exactly as requested. Keep text fields short and coach-readable.",
  ].join("\n");
  const userPrompt = [
    "Build a compact first-plan planning envelope from this validated backend setup.",
    "Hard requirements:",
    "- schemaVersion must be ai-first-plan-envelope-v1.",
    "- goal.family, goal.style, horizonWeeks, weeklyRhythm.runDays, and weeklyRhythm.longRunDay must match the expected backend values.",
    "- Do not add quality/specialty cadence beyond the backend policy guide.",
    "- If support is low or adaptation-first, use n for unsupported quality/specialty frequency.",
    "- Phases must cover the full horizon without gaps or overlaps.",
    "- Keep reviewAssumptions bounded and do not include secrets, raw prompts, or user/session data.",
    "",
    JSON.stringify(setupSummary, null, 2),
  ].join("\n");
  const responseSchemaChars = JSON.stringify(aiFirstPlanEnvelopeOpenAiSchema).length;

  return {
    systemPrompt,
    userPrompt,
    responseSchema: aiFirstPlanEnvelopeOpenAiSchema,
    promptCharEstimate: systemPrompt.length + userPrompt.length + responseSchemaChars,
    systemPromptChars: systemPrompt.length,
    userPromptChars: userPrompt.length,
    responseSchemaChars,
  };
}

function buildSetupSummary(
  authoringInput: StructuredAuthoringInput,
  policyGuide: AiFirstPlanEnvelope,
  expectedGoal: AiFirstPlanEnvelope["goal"],
  expectedLongRunDay: AiFirstPlanEnvelope["weeklyRhythm"]["longRunDay"],
) {
  return {
    expectedEnvelopeTruth: {
      goal: expectedGoal,
      horizonWeeks: resolveAuthoringHorizonWeeks(authoringInput),
      runDays: authoringInput.availability.maxRunningDaysPerWeek,
      longRunDay: expectedLongRunDay,
      qualityFrequency: policyGuide.weeklyRhythm.qualityFrequency,
      specialtyFrequency: policyGuide.weeklyRhythm.specialtyFrequency,
      supportBias: policyGuide.weeklyRhythm.supportBias,
      longRunMode: policyGuide.longRunProgression.mode,
      cutbackEveryWeeks: policyGuide.longRunProgression.cutbackEveryWeeks,
      taperWeeks: policyGuide.longRunProgression.taperWeeks,
      primaryEmphasis: policyGuide.qualityEmphasis.primary,
      secondaryEmphasis: policyGuide.qualityEmphasis.secondary,
      terrain: policyGuide.terrainSupport.terrain,
      support: policyGuide.terrainSupport.support,
      metricGuidance: policyGuide.metricGuidance,
    },
    validatedRunnerSetup: {
      goalType: authoringInput.goal.goalType,
      goalStyle: authoringInput.goal.goalStyle,
      targetTimePresent: Boolean(authoringInput.goal.targetTime),
      startDate: authoringInput.schedule.startDate,
      targetDate: authoringInput.schedule.targetDate ?? null,
      experienceLevel: authoringInput.runnerProfile.experienceLevel,
      baselineSessionsPerWeek: authoringInput.runnerProfile.baselineSessionsPerWeek,
      baselineLongRunKm: authoringInput.runnerProfile.baselineLongRunKm,
      baselineLongRunDurationMin: authoringInput.runnerProfile.baselineLongRunDurationMin,
      recentResultPresent: Boolean(authoringInput.currentLevel.recentResultSummary),
      recentRaceResultCount: authoringInput.currentLevel.recentRaceResults.length,
      recent5kPacePresent: Boolean(authoringInput.currentLevel.recent5kPaceSecondsPerKm),
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredRunningDays: authoringInput.availability.preferredRunningDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
      allowBackToBackDays: authoringInput.availability.allowBackToBackDays,
      terrainFocus: authoringInput.preferences.terrainFocus,
      strengthOrMobilityInterest: authoringInput.preferences.strengthOrMobilityInterest,
      watchAccess: authoringInput.execution.watchAccess,
      guidancePreference: authoringInput.execution.guidancePreference,
      notesSummary: boundedNonSecretText(authoringInput.preferences.notes),
    },
  };
}

function boundedNonSecretText(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (
    /\b(token|secret|password|cookie|session|authorization|auth|api[_-]?key|key|bearer|supabase|jwt)\b/i.test(
      normalized,
    )
  ) {
    return "[redacted]";
  }

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}
