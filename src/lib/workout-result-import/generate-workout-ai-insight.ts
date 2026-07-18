import { z } from "zod";
import type {
  WorkoutComparisonCompletionState,
  WorkoutComparisonDifferencePayload,
  WorkoutComparisonStatus,
  WorkoutAiRecommendationLevel,
} from "@/lib/workout-result-import/types";
import { serverEnv } from "@/lib/supabase/env";
import type { BodyNote } from "@/lib/body-notes";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_WORKOUT_FEEDBACK_MODEL = "gpt-5";

const cautionFlagValues = [
  "evidence_unclear",
  "date_mismatch",
  "duration_shorter_than_planned",
  "duration_longer_than_planned",
  "distance_mismatch",
  "structured_steps_not_comparable",
  "body_discomfort_context",
  "manual_review_worthwhile",
] as const;

export interface WorkoutAiBodyNoteContext {
  source: "workout_log";
  interpretationBoundary: "caution_context_only";
  notes: Array<{
    area: BodyNote["area"];
    timing: BodyNote["timing"];
    sensation: BodyNote["sensation"];
    severity: BodyNote["severity"];
    note: string | null;
  }>;
}

export interface WorkoutAiPromptInput {
  plannedWorkout: {
    id: string;
    date: string;
    weekday: string;
    phase: string;
    weekNumber: number;
    title: string;
    workoutType: string;
    sourceWorkoutType: string | null;
    notes: string | null;
    plannedDurationMin: number;
    plannedDistanceKm: number | null;
    stepOutline: Array<{
      sequence: number;
      type: string;
      label: string | null;
      durationMin: number | null;
      distanceKm: number | null;
      repeats: number | null;
    }>;
  };
  actualMetrics: {
    id: string;
    activityLocalDate: string | null;
    actualDurationMin: number | null;
    actualDistanceKm: number | null;
    actualIntervalCount: number | null;
  };
  comparison: {
    comparisonStatus: WorkoutComparisonStatus;
    completionState: WorkoutComparisonCompletionState;
    comparisonConfidence: number;
    differencePayload: WorkoutComparisonDifferencePayload;
  };
  currentWeekContext: {
    weekNumber: number;
    weekStatus: string;
    plannedNonRestWorkoutCount: number;
    completedWorkoutCount: number;
    partialWorkoutCount: number;
    skippedWorkoutCount: number;
    pendingWorkoutCount: number;
  };
  nextWorkout: {
    date: string;
    title: string;
    workoutType: string;
    sourceWorkoutType: string | null;
    plannedDurationMin: number;
    plannedDistanceKm: number | null;
    notes: string | null;
  } | null;
  bodyNoteContext?: WorkoutAiBodyNoteContext;
}

export interface GeneratedWorkoutAiInsight {
  model: string;
  responseId: string | null;
  output: {
    analysisSummary: string;
    differenceExplanation: string;
    nextWorkoutRecommendation: string;
    recommendationLevel: WorkoutAiRecommendationLevel;
    cautionFlags: string[];
  };
}

const aiInsightSchema = z.object({
  analysisSummary: z.string().trim().min(20).max(260),
  differenceExplanation: z.string().trim().min(20).max(340),
  nextWorkoutRecommendation: z.string().trim().min(20).max(260),
  recommendationLevel: z.enum(["keep", "soft_adjust", "review"]),
  cautionFlags: z.array(z.enum(cautionFlagValues)).max(4),
});

export async function generateWorkoutAiInsight(
  input: WorkoutAiPromptInput,
): Promise<GeneratedWorkoutAiInsight> {
  const apiKey = serverEnv.openAiApiKey;

  if (!apiKey) {
    throw new Error("OpenAI workout feedback is not configured. Missing OPENAI_API_KEY.");
  }

  const model = serverEnv.openAiPlanModel ?? DEFAULT_OPENAI_WORKOUT_FEEDBACK_MODEL;
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildSystemPrompt(),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildUserPrompt(input),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "workout_feedback_ai_output",
          strict: true,
          schema: workoutFeedbackOpenAiSchema,
        },
      },
    }),
  });

  const body = (await response.json()) as OpenAiResponseEnvelope;

  if (!response.ok) {
    throw new Error(
      `OpenAI workout feedback failed with ${response.status}: ${extractOpenAiError(body)}`,
    );
  }

  const rawOutput = extractStructuredOutputText(body);
  const parsedOutput = safeParseJson(rawOutput);

  if (!parsedOutput) {
    throw new Error("OpenAI returned a non-JSON workout feedback payload.");
  }

  const parsedInsight = aiInsightSchema.safeParse(parsedOutput);

  if (!parsedInsight.success) {
    const issueSummary = parsedInsight.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(" | ");

    throw new Error(`OpenAI workout feedback failed validation: ${issueSummary}`);
  }

  return {
    model,
    responseId: body.id ?? null,
    output: parsedInsight.data,
  };
}

export function clampWorkoutAiInsight(
  input: WorkoutAiPromptInput,
  generated: GeneratedWorkoutAiInsight["output"],
) {
  const summary = input.comparison.differencePayload.summary;
  const comparison = input.comparison;
  const cautionFlags = new Set(generated.cautionFlags);
  let recommendationLevel = generated.recommendationLevel;

  if (comparison.completionState === "unclear") {
    cautionFlags.add("evidence_unclear");
    recommendationLevel =
      summary.mismatchSignals >= 2 || comparison.comparisonConfidence < 0.35
        ? "review"
        : recommendationLevel === "keep"
          ? "soft_adjust"
          : recommendationLevel;
  } else if (comparison.completionState === "partially_matched" && recommendationLevel === "keep") {
    recommendationLevel = "soft_adjust";
  }

  const signals = input.comparison.differencePayload.facts;

  if (signals.dateAlignment.status === "mismatch") {
    cautionFlags.add("date_mismatch");
  }

  if (signals.duration.status === "partial" || signals.duration.status === "mismatch") {
    if (
      typeof signals.duration.delta === "number" &&
      Number.isFinite(signals.duration.delta) &&
      signals.duration.delta < 0
    ) {
      cautionFlags.add("duration_shorter_than_planned");
    } else {
      cautionFlags.add("duration_longer_than_planned");
    }
  }

  if (signals.distance.status === "partial" || signals.distance.status === "mismatch") {
    cautionFlags.add("distance_mismatch");
  }

  if (signals.structuredStepCount.status === "not_applicable") {
    cautionFlags.add("structured_steps_not_comparable");
  }

  if (input.bodyNoteContext?.notes.length) {
    cautionFlags.add("body_discomfort_context");

    const maxSeverity = Math.max(
      ...input.bodyNoteContext.notes.map((bodyNote) => bodyNote.severity),
    );

    if (maxSeverity >= 4 && recommendationLevel === "keep") {
      recommendationLevel = "soft_adjust";
    }
  }

  if (recommendationLevel === "review") {
    cautionFlags.add("manual_review_worthwhile");
  }

  const boundedOutput = applyWorkoutAiTextQualityGate(input, {
    ...generated,
    recommendationLevel,
    cautionFlags: [...cautionFlags],
  });

  return {
    ...boundedOutput,
    recommendationLevel,
    cautionFlags: boundedOutput.cautionFlags,
  };
}

function buildSystemPrompt() {
  return [
    "You are Hito Running's bounded workout feedback interpreter.",
    "You receive only canonical backend truth: planned workout summary, normalized actual metrics, deterministic comparison, current week context, and the next workout summary.",
    "You may also receive saved workout-scoped body notes; use them only as caution context for this workout result.",
    "You must not invent raw metrics, comparison facts, diagnosis, medical advice, treatment instructions, injury certainty, or plan mutations.",
    "Pace, heart rate, power, cadence, and RPE are outside this interpretation contract unless they appear as supported deterministic comparison facts; do not mention numeric values for them.",
    "Keep output concise, factual, and conservative.",
    "Write in plain English only. Use complete sentences. Do not output dangling fragments, bullets, ampersands, markdown, emoji, or non-English characters.",
    "If the deterministic comparison is partial, mismatched, or unclear, say so plainly and avoid overconfident coaching.",
    "If body notes are present, do not diagnose them or claim causality; at most mention discomfort context, monitoring, or a conservative load choice when relevant.",
    "If body notes are absent, do not mention body discomfort.",
    "Do not use motivational fluff.",
    "The next-workout recommendation must be one bounded suggestion only, grounded in the supplied facts.",
    "Never imply that the plan was already changed.",
  ].join("\n");
}

function buildUserPrompt(input: WorkoutAiPromptInput) {
  return [
    "Generate one bounded workout interpretation JSON object.",
    "All text fields must be clean runner-facing English sentences with normal punctuation.",
    "Interpret only the supplied facts.",
    "If evidence is weak or unclear, keep the recommendation cautious.",
    "Treat body-note context, if present, as secondary caution context under the deterministic comparison.",
    "Deterministic workout feedback input:",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}

export function buildWorkoutAiBodyNoteContext(
  bodyNotes: BodyNote[],
): WorkoutAiBodyNoteContext | undefined {
  const notes = bodyNotes.slice(0, 8).map((bodyNote) => ({
    area: bodyNote.area,
    timing: bodyNote.timing,
    sensation: bodyNote.sensation,
    severity: bodyNote.severity,
    note: sanitizeBodyNoteText(bodyNote.note),
  }));

  if (notes.length === 0) {
    return undefined;
  }

  return {
    source: "workout_log",
    interpretationBoundary: "caution_context_only",
    notes,
  };
}

function sanitizeBodyNoteText(note: string | null) {
  const trimmed = note?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  return trimmed.length <= 180 ? trimmed : `${trimmed.slice(0, 177).trimEnd()}...`;
}

export function applyWorkoutAiTextQualityGate(
  input: WorkoutAiPromptInput,
  generated: GeneratedWorkoutAiInsight["output"],
): GeneratedWorkoutAiInsight["output"] {
  return {
    ...generated,
    analysisSummary:
      sanitizeRunnerFacingAiText(generated.analysisSummary, 20, 260) ??
      fallbackAnalysisSummary(input),
    differenceExplanation:
      sanitizeRunnerFacingAiText(generated.differenceExplanation, 20, 340) ??
      fallbackDifferenceExplanation(input),
    nextWorkoutRecommendation:
      sanitizeRunnerFacingAiText(generated.nextWorkoutRecommendation, 20, 260) ??
      fallbackNextWorkoutRecommendation(input, generated.recommendationLevel),
  };
}

function sanitizeRunnerFacingAiText(text: string, minLength: number, maxLength: number) {
  const trimmed = text.normalize("NFKC").replace(/\s+/g, " ").trim();

  if (
    !trimmed ||
    containsUnsupportedCharacters(trimmed) ||
    containsUnsupportedActualMetricClaim(trimmed)
  ) {
    return null;
  }

  const withTerminalPunctuation = /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;

  if (!isCompleteRunnerSentence(withTerminalPunctuation)) {
    return null;
  }

  if (withTerminalPunctuation.length < minLength || withTerminalPunctuation.length > maxLength) {
    return null;
  }

  return withTerminalPunctuation;
}

function containsUnsupportedActualMetricClaim(text: string) {
  return (
    /\b\d+(?:\.\d+)?\s*(?:bpm|watts?|w|rpm)\b/i.test(text) ||
    /\brpe\s*(?:of\s*)?\d+(?:\.\d+)?\b/i.test(text) ||
    /\b\d{1,2}:\d{2}\s*(?:\/|per\s+)?km\b/i.test(text) ||
    /\b\d+(?:\.\d+)?\s*(?:min(?:ute)?s?)\s*(?:\/|per\s+)km\b/i.test(text)
  );
}

function containsUnsupportedCharacters(text: string) {
  if (/[\uFFFD\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u.test(text)) {
    return true;
  }

  return /[^\x20-\x7E]/.test(text);
}

function isCompleteRunnerSentence(text: string) {
  if (/[,&+\-/:;(]$/.test(text)) {
    return false;
  }

  if (/[,&+\-/:;(]\.$/.test(text) || hasDanglingTrailingClause(text)) {
    return false;
  }

  if (/\s[&+]\s/.test(text)) {
    return false;
  }

  if (/(\bmain\b|\bduration\b|\bdistance\b)\s*[-+]\d+\s*(min|km)\s*,?\s*&/i.test(text)) {
    return false;
  }

  return /[A-Za-z0-9][.!?]$/.test(text);
}

function hasDanglingTrailingClause(text: string) {
  return /(?:^|[\s,;:])(?:and|or|but|because|while|although|though|when|with|without|for|to)\s*[.!?]$/i.test(
    text,
  );
}

function fallbackAnalysisSummary(input: WorkoutAiPromptInput) {
  const completion = humanizeCompletionState(input.comparison.completionState);

  return `The deterministic comparison stays primary: this workout currently reads as ${completion}.`;
}

function fallbackDifferenceExplanation(input: WorkoutAiPromptInput) {
  const facts = input.comparison.differencePayload.facts;
  const limitedSignals = [
    facts.dateAlignment,
    facts.duration,
    facts.distance,
    facts.structuredStepCount,
  ].filter(
    (signal) =>
      signal.status === "partial" ||
      signal.status === "mismatch" ||
      signal.status === "missing_actual" ||
      signal.status === "not_applicable",
  );

  if (limitedSignals.length === 0) {
    return "The available factual checks do not show a major mismatch, so use the plan-vs-run section as the source of truth.";
  }

  const labels = limitedSignals
    .slice(0, 2)
    .map((signal) => describeFallbackSignalLimitation(signal))
    .join(" and ");

  return `Use the factual checks above with care because ${labels}.`;
}

function describeFallbackSignalLimitation(
  signal: WorkoutComparisonDifferencePayload["facts"][keyof WorkoutComparisonDifferencePayload["facts"]],
) {
  const label = signal.label.toLowerCase();

  if (signal.status === "not_applicable") {
    return `${label} was not part of this comparison`;
  }

  if (signal.status === "missing_actual") {
    return `${label} was missing from the uploaded result`;
  }

  return `${label} did not line up cleanly`;
}

function fallbackNextWorkoutRecommendation(
  input: WorkoutAiPromptInput,
  recommendationLevel: WorkoutAiRecommendationLevel,
) {
  if (recommendationLevel === "review") {
    return "Review the factual comparison before changing the next workout, and keep the next step conservative.";
  }

  if (input.bodyNoteContext?.notes.length) {
    return "Keep the next workout conservative if the noted discomfort is still present, and use the factual comparison above as the main guide.";
  }

  if (recommendationLevel === "soft_adjust") {
    return "Keep the next workout easy to moderate, and use the factual comparison above to decide whether to shorten it.";
  }

  return "The next workout can stay as planned, with the factual comparison above as the primary guide.";
}

function humanizeCompletionState(completionState: WorkoutComparisonCompletionState) {
  switch (completionState) {
    case "matched":
      return "matched";
    case "partially_matched":
      return "a partial match";
    default:
      return "unclear";
  }
}

function extractStructuredOutputText(response: OpenAiResponseEnvelope) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  for (const outputItem of response.output ?? []) {
    for (const part of outputItem.content ?? []) {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  throw new Error("OpenAI did not return structured workout feedback output.");
}

function extractOpenAiError(response: OpenAiResponseEnvelope) {
  if (typeof response.error?.message === "string" && response.error.message.trim()) {
    return response.error.message.trim();
  }

  return "Unknown OpenAI error.";
}

function safeParseJson(raw: string) {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

const workoutFeedbackOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "analysisSummary",
    "differenceExplanation",
    "nextWorkoutRecommendation",
    "recommendationLevel",
    "cautionFlags",
  ],
  properties: {
    analysisSummary: {
      type: "string",
      minLength: 20,
      maxLength: 260,
    },
    differenceExplanation: {
      type: "string",
      minLength: 20,
      maxLength: 340,
    },
    nextWorkoutRecommendation: {
      type: "string",
      minLength: 20,
      maxLength: 260,
    },
    recommendationLevel: {
      type: "string",
      enum: ["keep", "soft_adjust", "review"],
    },
    cautionFlags: {
      type: "array",
      maxItems: 4,
      items: {
        type: "string",
        enum: cautionFlagValues,
      },
    },
  },
} as const;

interface OpenAiResponseEnvelope {
  id?: string | null;
  output_text?: string | null;
  error?: {
    message?: string | null;
  } | null;
  output?: Array<{
    content?: Array<{
      text?: string | null;
    }>;
  }>;
}
