import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "./structured-plan-authoring.mjs";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_PLAN_MODEL = "gpt-5";
const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function generateCanonicalPlanFromText(authoringText) {
  const apiKey = readEnv("OPENAI_API_KEY");

  if (!apiKey) {
    throw new Error("OpenAI plan generation is not configured. Missing OPENAI_API_KEY.");
  }

  const model = readEnv("OPENAI_PLAN_MODEL") ?? DEFAULT_OPENAI_PLAN_MODEL;
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

  const body = await response.json();

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

  const parsedAuthoringInput = structuredPlanAuthoringInputSchema.safeParse(parsedOutput);

  if (!parsedAuthoringInput.success) {
    const issueSummary = parsedAuthoringInput.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(" | ");

    throw new Error(`OpenAI authoring input failed validation: ${issueSummary}`);
  }

  return {
    authoringInput: parsedAuthoringInput.data,
    canonicalPlan: buildStructuredAuthoringPlan(parsedAuthoringInput.data),
    model,
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
    "Use exact weekday names: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.",
    "Keep notes concise and use them only for real constraints, assumptions, or preferences.",
    "Never invent auth, user ids, logs, completion markers, or post-workout results.",
  ].join("\n");
}

function buildUserPrompt(authoringText) {
  return [
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
    "Extract the user's intent into the required structured authoring input.",
    "Use null or conservative defaults only when the user did not provide enough detail.",
    "User request:",
    authoringText.trim(),
  ].join("\n\n");
}

function extractStructuredOutputText(response) {
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

function extractOpenAiError(response) {
  if (typeof response.error?.message === "string" && response.error.message.trim()) {
    return response.error.message.trim();
  }

  return "Unknown OpenAI error.";
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const structuredAuthoringOpenAiSchema = {
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
  ],
  properties: {
    goal: {
      type: "object",
      additionalProperties: false,
      required: ["goalType", "goalLabel", "targetEventName"],
      properties: {
        goalType: {
          type: "string",
          enum: ["build_consistency", "distance_build", "5k", "10k", "half_marathon", "marathon"],
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
      required: ["preferredWorkoutMix", "strengthOrMobilityInterest", "indoorTreadmillOk", "notes"],
      properties: {
        preferredWorkoutMix: {
          type: ["string", "null"],
          enum: ["balanced", "easy_heavy", "quality_light", "long_run_focus", null],
        },
        strengthOrMobilityInterest: {
          type: ["string", "null"],
          enum: ["none", "mobility", "strength", "both", null],
        },
        indoorTreadmillOk: { type: "boolean" },
        notes: { type: ["string", "null"] },
      },
    },
  },
};
