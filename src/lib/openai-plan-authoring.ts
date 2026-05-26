import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "@/lib/structured-plan-authoring";
import type { TrainingPlanV2 } from "@/lib/imported-plan";
import {
  buildDeterministicRichWorkoutFallbackMetadata,
  buildRichWorkoutDraftNotRequestedMetadata,
  normalizeRichWorkoutDraftToTrainingPlan,
  richWorkoutDraftOpenAiSchema,
  type RichWorkoutDraftMetadata,
} from "@/lib/rich-workout-draft-authoring";
import { serverEnv } from "@/lib/supabase/env";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_PLAN_MODEL = "gpt-5";
const weekdayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export interface GeneratedPlanResult {
  authoringInput: ReturnType<typeof structuredPlanAuthoringInputSchema.parse>;
  canonicalPlan: ReturnType<typeof buildStructuredAuthoringPlan>;
  model: string;
  responseId: string | null;
  richDraftMetadata: RichWorkoutDraftMetadata;
  richDraftResponseId: string | null;
}

export interface GenerateCanonicalPlanFromTextOptions {
  enableRichWorkoutDraft?: boolean;
  repairAuthoringInput?: (value: unknown) => unknown;
  validationErrorPrefix?: string;
}

export interface GenerateRichWorkoutDraftForCanonicalPlanOptions {
  authoringText: string;
  authoringInput: ReturnType<typeof structuredPlanAuthoringInputSchema.parse>;
  deterministicPlan: TrainingPlanV2;
  timeoutMs?: number;
}

export async function generateCanonicalPlanFromText(
  authoringText: string,
  options: GenerateCanonicalPlanFromTextOptions = {},
): Promise<GeneratedPlanResult> {
  const apiKey = serverEnv.openAiApiKey;

  if (!apiKey) {
    throw new Error("OpenAI plan generation is not configured. Missing OPENAI_API_KEY.");
  }

  const model = serverEnv.openAiPlanModel ?? DEFAULT_OPENAI_PLAN_MODEL;
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
              text: buildUserPrompt(authoringText),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "structured_plan_authoring_input",
          strict: true,
          schema: structuredAuthoringOpenAiSchema,
        },
      },
    }),
  });

  const body = (await response.json()) as OpenAiResponseEnvelope;

  if (!response.ok) {
    throw new Error(
      `OpenAI plan generation failed with ${response.status}: ${extractOpenAiError(body)}`,
    );
  }

  const rawOutput = extractStructuredOutputText(body);
  const parsedOutput = safeParseJson(rawOutput);

  if (!parsedOutput) {
    throw new Error("OpenAI returned a non-JSON structured authoring payload.");
  }

  const authoringInputCandidate = options.repairAuthoringInput
    ? options.repairAuthoringInput(parsedOutput)
    : parsedOutput;
  const parsedAuthoringInput =
    structuredPlanAuthoringInputSchema.safeParse(authoringInputCandidate);

  if (!parsedAuthoringInput.success) {
    const issueSummary = parsedAuthoringInput.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(" | ");

    throw new Error(
      `${options.validationErrorPrefix ?? "OpenAI authoring input failed validation"}: ${issueSummary}`,
    );
  }

  const deterministicPlan = buildStructuredAuthoringPlan(parsedAuthoringInput.data);
  const richDraftResult = options.enableRichWorkoutDraft
    ? await generateRichWorkoutDraftForCanonicalPlan({
        authoringText,
        authoringInput: parsedAuthoringInput.data,
        deterministicPlan,
      }).catch((error: unknown) => ({
        canonicalPlan: deterministicPlan,
        metadata: buildDeterministicRichWorkoutFallbackMetadata(
          buildRichDraftFallbackReason(error),
        ),
        responseId: null,
      }))
    : {
        canonicalPlan: deterministicPlan,
        metadata: buildRichWorkoutDraftNotRequestedMetadata(),
        responseId: null,
      };

  return {
    authoringInput: parsedAuthoringInput.data,
    canonicalPlan: richDraftResult.canonicalPlan,
    model,
    responseId: body.id ?? null,
    richDraftMetadata: richDraftResult.metadata,
    richDraftResponseId: richDraftResult.responseId,
  };
}

export async function generateRichWorkoutDraftForCanonicalPlan({
  authoringText,
  authoringInput,
  deterministicPlan,
  timeoutMs,
}: GenerateRichWorkoutDraftForCanonicalPlanOptions) {
  const apiKey = serverEnv.openAiApiKey;

  if (!apiKey) {
    throw new RichDraftFallbackError("rich_draft_unavailable", [
      "OpenAI rich workout drafting is not configured.",
    ]);
  }

  return generateRichWorkoutDraftPlan({
    apiKey,
    model: serverEnv.openAiPlanModel ?? DEFAULT_OPENAI_PLAN_MODEL,
    authoringText,
    authoringInput,
    deterministicPlan,
    timeoutMs,
  });
}

async function generateRichWorkoutDraftPlan({
  apiKey,
  model,
  authoringText,
  authoringInput,
  deterministicPlan,
  timeoutMs,
}: {
  apiKey: string;
  model: string;
  authoringText: string;
  authoringInput: ReturnType<typeof structuredPlanAuthoringInputSchema.parse>;
  deterministicPlan: TrainingPlanV2;
  timeoutMs?: number;
}) {
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => {
        controller.abort();
      }, timeoutMs)
    : null;

  const requestBody = JSON.stringify({
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: buildRichWorkoutDraftSystemPrompt(),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildRichWorkoutDraftUserPrompt({
              authoringText,
              authoringInput,
              deterministicPlan,
            }),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "rich_workout_draft",
        strict: true,
        schema: richWorkoutDraftOpenAiSchema,
      },
    },
  });

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: requestBody,
    signal: controller?.signal,
  }).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  const body = (await response.json()) as OpenAiResponseEnvelope;

  if (!response.ok) {
    throw new RichDraftFallbackError("rich_draft_request_failed", [extractOpenAiError(body)]);
  }

  const rawOutput = extractStructuredOutputText(body);
  const parsedOutput = safeParseJson(rawOutput);

  if (!parsedOutput) {
    throw new RichDraftFallbackError("rich_draft_non_json_output", [
      "OpenAI returned a non-JSON rich workout draft payload.",
    ]);
  }

  const normalized = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: deterministicPlan,
    draft: parsedOutput,
  });

  if (!normalized.ok) {
    throw new RichDraftFallbackError(normalized.reason, normalized.issues);
  }

  return {
    canonicalPlan: normalized.canonicalPlan,
    metadata: normalized.metadata,
    responseId: body.id ?? null,
  };
}

function buildSystemPrompt() {
  return [
    "You convert runner free text into one bounded authoring JSON object for Hito Running.",
    "Return only the structured authoring input object requested by the JSON schema.",
    "Do not return runtime state, completion state, sync state, AI verdicts, OCR state, or UI placeholders.",
    "Your output is generation input, not persisted truth. The app will deterministically generate the final canonical training plan from it.",
    "Be conservative when the user is ambiguous. Prefer simpler, safer plans over aggressive ones.",
    "If the user does not specify exact availability, default to Tuesday, Thursday, and Sunday running with Sunday as the long run day.",
    "If the user does not specify a target date or duration, default to 8 preparation weeks.",
    "If the user does not specify baseline long run distance, use 8 km unless the user clearly indicates less readiness; if distance is unknown but time is implied, use 60 minutes.",
    "If the user does not specify target execution mode, default to effort guidance and unknown watch/app access.",
    "Goal types may include build_consistency, distance_build, 5k, 10k, half_marathon, marathon, ultra_marathon, or mountain_running.",
    "Terrain focus must be standard, rolling, or mountain. Mountain running should use mountain terrain context.",
    "Target-time goals need honesty: if benchmark support is weak, keep the generated plan effort-based and conservative rather than promising race-specific pace precision.",
    "Marathon, ultra, and mountain goals with low frequency, weak benchmark support, unknown current load, or short timelines must be described as conservative, finish-oriented, or durability-limited instead of full race-specific preparation.",
    "Marathon, ultra, and mountain goals need credible long-run progression, cutbacks, tapering, and phase-specific workouts.",
    "Goal-family identity matters: 5K can use safe short-rep sharpening or strides, 10K can use rhythm or sustained quality, half marathon can use threshold or steady durability, marathon can use controlled steady/marathon-effort specificity and long-run durability, and ultra should stay durability/time-on-feet oriented rather than road-race sharpening.",
    "Mountain or trail plans need mountain-specific doctrine: progressive hill exposure, controlled descents/downhill durability, hike-run or power-hike allowance, time-on-feet guidance, cautious technical-terrain language, and no exact elevation-gain targets unless trusted route/elevation truth exists.",
    "Use exact weekday names: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.",
    "Keep notes concise and use them only for real constraints, assumptions, or preferences.",
    "Never invent auth, user ids, logs, completion markers, or post-workout results.",
  ].join("\n");
}

function buildUserPrompt(authoringText: string) {
  return [
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
    "Extract the user's intent into the required structured authoring input.",
    "Use null or conservative defaults only when the user did not provide enough detail.",
    "User request:",
    authoringText.trim(),
  ].join("\n\n");
}

function buildRichWorkoutDraftSystemPrompt() {
  return [
    "You draft rich workout structure for a canonical Hito Running training-plan-v2 skeleton.",
    "Return only the rich workout draft JSON object requested by the schema.",
    "The backend will validate and normalize your output; your draft is never persisted directly.",
    "Keep the exact workoutId, date, and rest/running-day boundary from the skeleton.",
    "Every non-rest workout must include warmup, main-equivalent work, and cooldown segments.",
    "Rest days must stay sparse and must not become running workouts.",
    "Use only backend taxonomy values provided by the schema for workoutFamily, workoutIdentity, and calendarIconKey.",
    "Use effort, purpose, cue, and hint language to make support runs feel coach-authored.",
    "Do not invent numeric heart-rate targets. Set hrBpmRange and hrBpm to null; the backend preserves allowed personal/default HR truth separately.",
    "Do not invent numeric pace targets. Set paceMinPerKmRange and pace to null; the backend preserves allowed deterministic pace truth separately.",
    "If metricMode says pace or HR is not allowed, keep target wording effort-based.",
    "Do not change fixed rest days, target dates, event truth, runner profile truth, logs, or completion state.",
    "Keep assumptions short, runner-facing, and bounded.",
  ].join("\n");
}

function buildRichWorkoutDraftUserPrompt({
  authoringText,
  authoringInput,
  deterministicPlan,
}: {
  authoringText: string;
  authoringInput: ReturnType<typeof structuredPlanAuthoringInputSchema.parse>;
  deterministicPlan: TrainingPlanV2;
}) {
  return [
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
    "Draft richer workout structure for this already-validated structured authoring input.",
    "Use the deterministic skeleton as hard truth. Do not add, remove, move, or reorder workouts.",
    "For short recovery runs under 35 minutes, keep structure simple only if the skeleton is already simple.",
    "For normal non-rest workouts, include distinct warmup/main/cooldown segments with useful guidance.",
    "",
    "Original runner text:",
    authoringText.trim(),
    "",
    "Validated structured authoring input:",
    JSON.stringify(authoringInput),
    "",
    "Deterministic canonical skeleton:",
    JSON.stringify(buildCanonicalWorkoutDraftSkeleton(deterministicPlan)),
  ].join("\n");
}

function buildCanonicalWorkoutDraftSkeleton(plan: TrainingPlanV2) {
  return {
    schemaVersion: plan.schema_version,
    planName: plan.plan_name,
    sourceKind: plan.source_kind ?? null,
    goal: plan.goal ?? null,
    startDate: plan.start_date,
    targetDate: plan.target_date ?? null,
    planPreferences: plan.plan_preferences ?? null,
    workouts: plan.planned_workouts.map((workout) => ({
      workoutId: workout.workout_id,
      date: workout.date,
      weekday: workout.weekday,
      weekNumber: workout.week_number,
      phase: workout.phase,
      workoutType: workout.workout_type,
      sourceWorkoutType: workout.source_workout_type ?? null,
      workoutFamily: workout.workout_family ?? null,
      workoutIdentity: workout.workout_identity ?? null,
      calendarIconKey: workout.calendar_icon_key ?? null,
      title: workout.title,
      summary: workout.summary,
      goalContext: workout.goal_context ?? null,
      metricMode: workout.metric_mode ?? null,
      segments: workout.segments.map((segment) => ({
        segmentType: segment.segment_type,
        label: segment.label ?? null,
        prescription: segment.prescription ?? null,
        guidance: segment.guidance ?? null,
        target: {
          intensity: segment.target?.intensity ?? null,
          rpe: segment.target?.rpe ?? null,
          cue: segment.target?.cue ?? null,
          hint: segment.target?.hint ?? null,
          paceTargetPresent: Boolean(segment.target?.pace_min_per_km_range),
          hrTargetPresent: Boolean(segment.target?.hr_bpm_range || segment.target?.hr_bpm),
        },
      })),
    })),
  };
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

  throw new Error("OpenAI did not return structured text output.");
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

export function buildRichDraftFallbackReason(error: unknown) {
  if (error instanceof RichDraftFallbackError) {
    return error.reason;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "rich_draft_timed_out";
  }

  return "rich_draft_unavailable";
}

class RichDraftFallbackError extends Error {
  constructor(
    readonly reason: string,
    readonly issues: string[],
  ) {
    super(`${reason}: ${issues.slice(0, 3).join(" | ")}`);
  }
}

export const structuredAuthoringOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "goal",
    "schedule",
    "runnerProfile",
    "currentLevel",
    "availability",
    "constraints",
    "preferences",
    "execution",
  ],
  properties: {
    goal: {
      type: "object",
      additionalProperties: false,
      required: ["goalType", "goalLabel", "targetEventName"],
      properties: {
        goalType: {
          type: "string",
          enum: [
            "build_consistency",
            "distance_build",
            "5k",
            "10k",
            "half_marathon",
            "marathon",
            "ultra_marathon",
            "mountain_running",
          ],
        },
        goalLabel: { type: "string" },
        targetEventName: { type: ["string", "null"] },
      },
    },
    schedule: {
      type: "object",
      additionalProperties: false,
      required: ["startDate", "targetDate", "preparationHorizonWeeks"],
      properties: {
        startDate: { type: "string" },
        targetDate: { type: ["string", "null"] },
        preparationHorizonWeeks: { type: ["integer", "null"] },
      },
    },
    runnerProfile: {
      type: "object",
      additionalProperties: false,
      required: [
        "experienceLevel",
        "baselineSessionsPerWeek",
        "baselineLongRunKm",
        "baselineLongRunDurationMin",
        "age",
        "recentInjuryRecoveryContext",
        "preferredEffortLanguage",
      ],
      properties: {
        experienceLevel: {
          type: "string",
          enum: ["new_runner", "returning_runner", "consistent_runner", "experienced_runner"],
        },
        baselineSessionsPerWeek: { type: "integer" },
        baselineLongRunKm: { type: ["number", "null"] },
        baselineLongRunDurationMin: { type: ["integer", "null"] },
        age: { type: ["integer", "null"] },
        recentInjuryRecoveryContext: { type: ["string", "null"] },
        preferredEffortLanguage: {
          type: ["string", "null"],
          enum: ["pace", "heart_rate", "rpe", "mixed", null],
        },
      },
    },
    currentLevel: {
      type: "object",
      additionalProperties: false,
      required: [
        "recentResultSummary",
        "recentRaceResults",
        "recent5kPaceSecondsPerKm",
        "currentEasyPaceRange",
        "currentTrainingLoadSummary",
      ],
      properties: {
        recentResultSummary: { type: ["string", "null"] },
        recentRaceResults: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["distance", "resultTime", "resultDate"],
            properties: {
              distance: { type: "string" },
              resultTime: { type: "string" },
              resultDate: { type: ["string", "null"] },
            },
          },
        },
        recent5kPaceSecondsPerKm: { type: ["number", "null"] },
        currentEasyPaceRange: { type: ["string", "null"] },
        currentTrainingLoadSummary: { type: ["string", "null"] },
      },
    },
    availability: {
      type: "object",
      additionalProperties: false,
      required: [
        "preferredRunningDays",
        "unavailableDays",
        "maxRunningDaysPerWeek",
        "allowBackToBackDays",
        "preferredLongRunDay",
      ],
      properties: {
        preferredRunningDays: {
          type: "array",
          items: { type: "string", enum: weekdayNames },
        },
        unavailableDays: {
          type: "array",
          items: { type: "string", enum: weekdayNames },
        },
        maxRunningDaysPerWeek: { type: "integer" },
        allowBackToBackDays: { type: "boolean" },
        preferredLongRunDay: { type: ["string", "null"], enum: [...weekdayNames, null] },
      },
    },
    constraints: {
      type: "object",
      additionalProperties: false,
      required: ["injuryConstraints", "hardConstraints"],
      properties: {
        injuryConstraints: {
          type: "array",
          items: { type: "string" },
        },
        hardConstraints: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    preferences: {
      type: "object",
      additionalProperties: false,
      required: [
        "preferredWorkoutMix",
        "terrainFocus",
        "strengthOrMobilityInterest",
        "indoorTreadmillOk",
        "notes",
      ],
      properties: {
        preferredWorkoutMix: {
          type: ["string", "null"],
          enum: ["balanced", "easy_heavy", "quality_light", "long_run_focus", null],
        },
        terrainFocus: {
          type: "string",
          enum: ["standard", "rolling", "mountain"],
        },
        strengthOrMobilityInterest: {
          type: ["string", "null"],
          enum: ["none", "mobility", "strength", "both", null],
        },
        indoorTreadmillOk: { type: "boolean" },
        notes: { type: ["string", "null"] },
      },
    },
    execution: {
      type: "object",
      additionalProperties: false,
      required: ["watchAccess", "guidancePreference"],
      properties: {
        watchAccess: {
          type: "string",
          enum: ["none", "watch_or_app", "unknown"],
        },
        guidancePreference: {
          type: "string",
          enum: ["effort", "pace", "heart_rate", "mixed"],
        },
      },
    },
  },
} as const;

interface OpenAiResponseEnvelope {
  id?: string;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
}
