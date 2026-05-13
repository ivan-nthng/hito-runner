import { z } from "zod";
import type {
  WorkoutComparisonCompletionState,
  WorkoutComparisonDifferencePayload,
  WorkoutComparisonStatus,
  WorkoutAiRecommendationLevel,
} from "@/lib/workout-result-import/types";
import { serverEnv } from "@/lib/supabase/env";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_WORKOUT_FEEDBACK_MODEL = "gpt-5";

const cautionFlagValues = [
  "evidence_unclear",
  "date_mismatch",
  "duration_shorter_than_planned",
  "duration_longer_than_planned",
  "distance_mismatch",
  "structured_steps_not_comparable",
  "manual_review_worthwhile",
] as const;

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
    actualAvgHr: number | null;
    actualMaxHr: number | null;
    actualAvgPower: number | null;
    actualAvgCadence: number | null;
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

  if (recommendationLevel === "review") {
    cautionFlags.add("manual_review_worthwhile");
  }

  return {
    ...generated,
    recommendationLevel,
    cautionFlags: [...cautionFlags],
  };
}

function buildSystemPrompt() {
  return [
    "You are Hito Running's bounded workout feedback interpreter.",
    "You receive only canonical backend truth: planned workout summary, normalized actual metrics, deterministic comparison, current week context, and the next workout summary.",
    "You must not invent raw metrics, comparison facts, medical advice, or plan mutations.",
    "Keep output concise, factual, and conservative.",
    "If the deterministic comparison is partial, mismatched, or unclear, say so plainly and avoid overconfident coaching.",
    "Do not use motivational fluff.",
    "The next-workout recommendation must be one bounded suggestion only, grounded in the supplied facts.",
    "Never imply that the plan was already changed.",
  ].join("\n");
}

function buildUserPrompt(input: WorkoutAiPromptInput) {
  return [
    "Generate one bounded workout interpretation JSON object.",
    "Interpret only the supplied facts.",
    "If evidence is weak or unclear, keep the recommendation cautious.",
    "Deterministic workout feedback input:",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
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
