import "@tanstack/react-start/server-only";

import { z } from "zod";
import {
  capabilityLockedResponse,
  checkRunnerCapability,
} from "@/lib/entitlements/check-runner-capability";
import type { CapabilityLockedResponse } from "@/lib/entitlements/types";
import {
  chooseLongRunDay,
  FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES,
  FIRST_PLAN_GOAL_DISTANCE_VALUES,
  FIRST_PLAN_GOAL_STYLE_VALUES,
  FIRST_PLAN_TERRAIN_FOCUS_VALUES,
  FIRST_PLAN_WATCH_ACCESS_VALUES,
  formatGoalDistance,
  formatGoalStyle,
  guidancePreferenceToPreferredEffortLanguage,
  isWeekdayName,
  normalizeFirstPlanExecutionMode,
  parseDurationSeconds,
  parsePaceSecondsPerKm,
  pickEvenly,
  uniqueWeekdays,
  type FirstPlanGuidancePreference,
  type FirstPlanGoalDistance,
  type FirstPlanGoalStyle,
  type FirstPlanWatchAccess,
} from "@/lib/first-plan-authoring-utils";
import {
  generateCanonicalPlanFromText,
  type GeneratedPlanResult,
} from "@/lib/openai-plan-authoring";
import { importedPlanSchema, type TrainingPlanV2 } from "@/lib/imported-plan";
import { buildLongDistanceHonestyAssumptions } from "@/lib/running-plan-honesty";
import type { StructuredFirstPlanProfilePatch } from "@/lib/structured-first-plan-onboarding";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "@/lib/structured-plan-authoring";
import { diffDaysIso } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

const MAX_TRANSCRIPT_LENGTH = 4000;
const MIN_USEFUL_TRANSCRIPT_LENGTH = 12;

const weekdaySchema = z.enum(WEEKDAY_NAMES);
const goalDistanceSchema = z.enum(FIRST_PLAN_GOAL_DISTANCE_VALUES);
const goalStyleSchema = z.enum(FIRST_PLAN_GOAL_STYLE_VALUES);
const terrainFocusSchema = z.enum(FIRST_PLAN_TERRAIN_FOCUS_VALUES);
const watchAccessSchema = z.enum(FIRST_PLAN_WATCH_ACCESS_VALUES);
const guidancePreferenceSchema = z.enum(FIRST_PLAN_GUIDANCE_PREFERENCE_VALUES);
const strengthPreferenceSchema = z.enum(["none", "mobility", "strength_mobility"]);
const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date in YYYY-MM-DD format.");
const durationLikeSchema = z.string().trim().min(3).max(40);
type VoiceGoalDistance = FirstPlanGoalDistance;
type VoiceGoalStyle = FirstPlanGoalStyle;

const voiceToPlanContextSchema = z
  .object({
    fixedRestDays: z.array(weekdaySchema).max(7).optional().default([]),
    runningDaysPerWeek: z.number().int().min(1).max(7).optional().nullable(),
  })
  .strict()
  .default({
    fixedRestDays: [],
    runningDaysPerWeek: null,
  });

const voiceToPlanSupplementSchema = z
  .object({
    age: z.number().int().min(13).max(100).optional().nullable(),
    weightKg: z
      .number()
      .min(30)
      .max(250)
      .refine((value) => Number.isInteger(value * 2), "Weight must use 0.5 kg increments.")
      .optional()
      .nullable(),
    heightCm: z.number().int().min(120).max(230).optional().nullable(),
    fixedRestDays: z.array(weekdaySchema).max(7).optional().default([]),
    runningDaysPerWeek: z.number().int().min(1).max(7).optional().nullable(),
    goalDistance: goalDistanceSchema.optional().nullable(),
    goalStyle: goalStyleSchema.optional().nullable(),
    targetTime: durationLikeSchema.optional().nullable(),
    targetDate: isoDateSchema.optional().nullable(),
    recent5kTime: durationLikeSchema.optional().nullable(),
    recent5kPace: durationLikeSchema.optional().nullable(),
    terrainFocus: terrainFocusSchema.optional().nullable(),
    watchAccess: watchAccessSchema.optional().nullable(),
    guidancePreference: guidancePreferenceSchema.optional().nullable(),
    strengthPreference: strengthPreferenceSchema.optional().nullable(),
    comment: z.string().trim().max(600).optional().nullable(),
  })
  .strict()
  .default({
    fixedRestDays: [],
  });

const voiceToPlanConfirmRequestSchema = z
  .object({
    draft: z
      .object({
        authoringInput: structuredPlanAuthoringInputSchema,
        canonicalPlan: importedPlanSchema,
        summary: z.unknown().optional(),
      })
      .strict(),
    supplement: voiceToPlanSupplementSchema.optional().default({
      fixedRestDays: [],
    }),
  })
  .strict();

export const voiceToPlanDraftRequestSchema = z
  .object({
    transcript: z
      .string({
        required_error: "Add a transcript before generating a draft.",
        invalid_type_error: "Add a transcript before generating a draft.",
      })
      .transform(normalizeTranscript)
      .superRefine((value, context) => {
        if (!value) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Add a transcript before generating a draft.",
          });
          return;
        }

        if (value.length < MIN_USEFUL_TRANSCRIPT_LENGTH || isMostlyFillerTranscript(value)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Say a little more about your goal, current running, or schedule.",
          });
        }

        if (value.length > MAX_TRANSCRIPT_LENGTH) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Keep the transcript under ${MAX_TRANSCRIPT_LENGTH} characters before generating a draft.`,
          });
        }
      }),
    context: voiceToPlanContextSchema.optional().default({
      fixedRestDays: [],
      runningDaysPerWeek: null,
    }),
    supplement: voiceToPlanSupplementSchema.optional().default({
      fixedRestDays: [],
    }),
  })
  .strict()
  .superRefine((value, context) => {
    const fixedRestDays = uniqueWeekdays([
      ...value.context.fixedRestDays,
      ...value.supplement.fixedRestDays,
    ]);
    const allowedTrainingDayCount = WEEKDAY_NAMES.length - fixedRestDays.length;
    const runningDaysPerWeek =
      value.supplement.runningDaysPerWeek ?? value.context.runningDaysPerWeek;

    if (allowedTrainingDayCount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supplement", "fixedRestDays"],
        message: "Leave at least one weekday available for training.",
      });
      return;
    }

    if (runningDaysPerWeek && runningDaysPerWeek > allowedTrainingDayCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supplement", "runningDaysPerWeek"],
        message: "Running days per week must fit outside the fixed rest days.",
      });
    }
  });

export type VoiceToPlanDraftRequest = z.output<typeof voiceToPlanDraftRequestSchema>;
export type VoiceToPlanAuthoringInput = z.output<typeof structuredPlanAuthoringInputSchema>;
export type VoiceToPlanSupplement = z.output<typeof voiceToPlanSupplementSchema>;
export type VoiceToPlanConfirmRequest = z.output<typeof voiceToPlanConfirmRequestSchema>;
type VoiceToPlanReviewContext = {
  requestedGoalStyle: VoiceGoalStyle | null;
  requestedGoalStyleSource: "transcript" | "supplement" | null;
};
type ParsedVoiceToPlanDraftRequest = VoiceToPlanDraftRequest & {
  reviewContext: VoiceToPlanReviewContext;
};
export type VoiceToPlanMissingField =
  | "profile_age"
  | "profile_weight"
  | "profile_height"
  | "goal"
  | "target_time"
  | "current_level"
  | "availability"
  | "timeline";

export type VoiceToPlanDraftResult =
  | VoiceToPlanDraftSuccess
  | VoiceToPlanClarificationRequired
  | CapabilityLockedResponse
  | {
      ok: false;
      reason: "invalid_transcript" | "generation_failed";
      message: string;
    };

export interface VoiceToPlanDraftSuccess {
  ok: true;
  status: "draft_ready";
  sourceKind: "voice_transcript";
  transcript: {
    text: string;
    characterCount: number;
    maxCharacterCount: number;
  };
  context: {
    fixedRestDays: WeekdayName[];
    runningDaysPerWeek: number | null;
  };
  supplement: VoiceToPlanSupplement;
  review: VoiceToPlanDraftReview;
  draft: {
    authoringInput: VoiceToPlanAuthoringInput;
    canonicalPlan: TrainingPlanV2;
    summary: VoiceToPlanDraftSummary;
  };
  safety: {
    requiresExplicitApply: true;
    doesNotMutatePlan: true;
    rawTranscriptPersisted: false;
    usesCanonicalStructuredAuthoring: true;
  };
  model: string;
  responseId: string | null;
}

export interface VoiceToPlanClarificationRequired {
  ok: true;
  status: "clarification_required";
  sourceKind: "voice_transcript";
  transcript: {
    text: string;
    characterCount: number;
    maxCharacterCount: number;
  };
  context: {
    fixedRestDays: WeekdayName[];
    runningDaysPerWeek: number | null;
  };
  supplement: VoiceToPlanSupplement;
  clarification: {
    missingFields: VoiceToPlanClarificationField[];
    questions: string[];
    canAnswerBy: Array<"voice" | "manual_supplement">;
    understood: string[];
  };
  safety: VoiceToPlanSafetyFlags;
}

export interface VoiceToPlanClarificationField {
  field: VoiceToPlanMissingField;
  label: string;
  reason: string;
  question: string;
  manualFields: string[];
}

export interface VoiceToPlanDraftReview {
  runnerUnderstanding: {
    profile: string;
    inferredLevel: string;
    goal: string;
    availability: string;
    timeline: string;
  };
  planShape: {
    durationLabel: string;
    runningDaysPerWeek: number;
    activityMix: string[];
    terrainFocus: "standard" | "rolling" | "mountain";
    workoutCount: number;
  };
  assumptions: string[];
  nextActions: Array<
    "ok_create_plan" | "add_more_details" | "add_more_by_voice" | "fill_missing_details"
  >;
}

interface VoiceToPlanSafetyFlags {
  requiresExplicitApply: true;
  doesNotMutatePlan: true;
  rawTranscriptPersisted: false;
  usesCanonicalStructuredAuthoring: true;
}

export interface VoiceToPlanDraftSummary {
  planName: string;
  startDate: string;
  targetDate: string | null;
  workoutCount: number;
  fixedRestDays: WeekdayName[];
  runningDaysPerWeek: number;
}

export type VoiceToPlanConfirmParseResult =
  | {
      ok: true;
      request: VoiceToPlanConfirmRequest;
      authoringInput: VoiceToPlanAuthoringInput;
      canonicalPlan: TrainingPlanV2;
      profilePatch: StructuredFirstPlanProfilePatch;
    }
  | {
      ok: false;
      reason: "invalid_draft";
      message: string;
    };

export async function generateVoiceToPlanDraftForUser({
  userId,
  request,
  generatePlanFromText = generateCanonicalPlanFromText,
}: {
  userId: string;
  request: unknown;
  generatePlanFromText?: typeof generateCanonicalPlanFromText;
}): Promise<VoiceToPlanDraftResult> {
  const capabilityCheck = await checkRunnerCapability({
    userId,
    capabilityKey: "voice_to_plan",
  });

  if (!capabilityCheck.allowed) {
    return capabilityLockedResponse(capabilityCheck);
  }

  const parsedRequest = parseVoiceToPlanDraftRequest(request);

  if (!parsedRequest.ok) {
    return parsedRequest;
  }

  const sufficiency = evaluateVoicePlanningSufficiency(parsedRequest.request);

  if (!sufficiency.ok) {
    return buildClarificationRequired(parsedRequest.request, sufficiency.missingFields);
  }

  try {
    const generatedPlan = await generatePlanFromText(
      buildVoiceAuthoringPrompt(parsedRequest.request),
      {
        repairAuthoringInput: (value) => repairVoiceAuthoringInput(value, parsedRequest.request),
        validationErrorPrefix: "Voice-to-plan authoring input failed validation",
      },
    );

    return buildVoiceDraftSuccess(parsedRequest.request, generatedPlan);
  } catch {
    return {
      ok: false,
      reason: "generation_failed",
      message:
        "Could not turn that transcript into a reviewable plan yet. Edit the transcript and try again.",
    };
  }
}

function parseVoiceToPlanDraftRequest(value: unknown):
  | {
      ok: true;
      request: ParsedVoiceToPlanDraftRequest;
    }
  | {
      ok: false;
      reason: "invalid_transcript";
      message: string;
    } {
  const result = voiceToPlanDraftRequestSchema.safeParse(value);

  if (!result.success) {
    return {
      ok: false,
      reason: "invalid_transcript",
      message: formatVoiceToPlanInputError(result.error),
    };
  }

  const requestedStyle = resolveRequestedGoalStyleForReview(
    result.data.transcript,
    result.data.supplement,
  );
  const supplement = mergeSupplementWithTranscriptInference(
    result.data.transcript,
    result.data.supplement,
  );

  return {
    ok: true,
    request: {
      ...result.data,
      context: {
        fixedRestDays: uniqueWeekdays([
          ...result.data.context.fixedRestDays,
          ...supplement.fixedRestDays,
        ]),
        runningDaysPerWeek:
          supplement.runningDaysPerWeek ?? result.data.context.runningDaysPerWeek ?? null,
      },
      supplement,
      reviewContext: {
        requestedGoalStyle: requestedStyle.style,
        requestedGoalStyleSource: requestedStyle.source,
      },
    },
  };
}

export function parseVoiceToPlanConfirmRequest(value: unknown): VoiceToPlanConfirmParseResult {
  const result = voiceToPlanConfirmRequestSchema.safeParse(value);

  if (!result.success) {
    return {
      ok: false,
      reason: "invalid_draft",
      message: formatVoiceToPlanInputError(result.error),
    };
  }

  const supplement = normalizeVoiceSupplement(result.data.supplement);

  if (!hasRequiredProfileBasics(supplement)) {
    return {
      ok: false,
      reason: "invalid_draft",
      message: "Confirming a voice draft requires age, weight, and height.",
    };
  }

  try {
    const authoringInput = structuredPlanAuthoringInputSchema.parse(
      result.data.draft.authoringInput,
    );

    return {
      ok: true,
      request: {
        ...result.data,
        supplement,
      },
      authoringInput,
      canonicalPlan: buildStructuredAuthoringPlan(authoringInput),
      profilePatch: {
        age: supplement.age,
        weightKg: supplement.weightKg,
        heightCm: supplement.heightCm,
        baselineNotes: null,
      },
    };
  } catch {
    return {
      ok: false,
      reason: "invalid_draft",
      message:
        "This voice draft is no longer valid. Generate a fresh review before creating a plan.",
    };
  }
}

function evaluateVoicePlanningSufficiency(request: VoiceToPlanDraftRequest):
  | {
      ok: true;
    }
  | {
      ok: false;
      missingFields: VoiceToPlanClarificationField[];
    } {
  const missingFields = buildMissingFields(request);

  return missingFields.length > 0
    ? {
        ok: false,
        missingFields,
      }
    : {
        ok: true,
      };
}

function buildMissingFields(request: VoiceToPlanDraftRequest) {
  const transcript = request.transcript.toLowerCase();
  const supplement = request.supplement;
  const missingFields: VoiceToPlanClarificationField[] = [];

  if (!supplement.age) {
    missingFields.push(clarificationField("profile_age"));
  }

  if (!supplement.weightKg) {
    missingFields.push(clarificationField("profile_weight"));
  }

  if (!supplement.heightCm) {
    missingFields.push(clarificationField("profile_height"));
  }

  const goalDistance = supplement.goalDistance ?? inferGoalDistanceFromTranscript(transcript);

  if (!goalDistance) {
    missingFields.push(clarificationField("goal"));
  }

  if (supplement.goalStyle === "target_time" && !supplement.targetTime) {
    missingFields.push(clarificationField("target_time"));
  }

  if (!hasCurrentLevelSignal(request)) {
    missingFields.push(clarificationField("current_level"));
  }

  if (!hasAvailabilitySignal(request)) {
    missingFields.push(clarificationField("availability"));
  }

  if (isRaceOrDistanceGoal(goalDistance) && !hasTimelineSignal(request)) {
    missingFields.push(clarificationField("timeline"));
  }

  return missingFields;
}

function clarificationField(field: VoiceToPlanMissingField): VoiceToPlanClarificationField {
  switch (field) {
    case "profile_age":
      return {
        field,
        label: "Age",
        reason: "Profile age is required before Hito reviews a voice-created plan.",
        question: "How old are you?",
        manualFields: ["age"],
      };
    case "profile_weight":
      return {
        field,
        label: "Weight",
        reason: "Profile weight is required before Hito reviews a voice-created plan.",
        question: "What is your current weight in kilograms?",
        manualFields: ["weightKg"],
      };
    case "profile_height":
      return {
        field,
        label: "Height",
        reason: "Profile height is required before Hito reviews a voice-created plan.",
        question: "What is your height in centimeters?",
        manualFields: ["heightCm"],
      };
    case "goal":
      return {
        field,
        label: "Goal",
        reason: "Hito needs to know what you are training for before shaping the plan.",
        question:
          "What are you training for: consistency, 5K, 10K, half marathon, marathon, ultra, or mountain running?",
        manualFields: ["goalDistance", "goalStyle"],
      };
    case "target_time":
      return {
        field,
        label: "Target time",
        reason: "A target-time goal needs the actual time target before Hito reviews a plan.",
        question: "What target time should this plan train toward?",
        manualFields: ["targetTime"],
      };
    case "current_level":
      return {
        field,
        label: "Current level",
        reason: "Hito needs a readiness signal to avoid choosing the wrong starting load.",
        question: "What is your recent 5K time or pace, or how much have you been running lately?",
        manualFields: ["recent5kTime", "recent5kPace", "comment"],
      };
    case "availability":
      return {
        field,
        label: "Availability",
        reason: "Hito needs to know how many days per week you can realistically run.",
        question:
          "How many days per week can you realistically run, and are any weekdays fixed rest days?",
        manualFields: ["runningDaysPerWeek", "fixedRestDays"],
      };
    case "timeline":
      return {
        field,
        label: "Timeline",
        reason:
          "For a race or distance goal, Hito needs a preparation window before reviewing a plan.",
        question: "When is the race, or how many weeks do you want to prepare?",
        manualFields: ["targetDate", "comment"],
      };
  }
}

function buildClarificationRequired(
  request: VoiceToPlanDraftRequest,
  missingFields: VoiceToPlanClarificationField[],
): VoiceToPlanClarificationRequired {
  return {
    ok: true,
    status: "clarification_required",
    sourceKind: "voice_transcript",
    transcript: buildTranscriptSummary(request),
    context: {
      fixedRestDays: uniqueWeekdays(request.context.fixedRestDays),
      runningDaysPerWeek: request.context.runningDaysPerWeek ?? null,
    },
    supplement: request.supplement,
    clarification: {
      missingFields,
      questions: missingFields.map((field) => field.question),
      canAnswerBy: ["voice", "manual_supplement"],
      understood: buildUnderstoodSummary(request),
    },
    safety: buildVoiceSafetyFlags(),
  };
}

function buildVoiceAuthoringPrompt(request: VoiceToPlanDraftRequest) {
  const fixedRestDays = uniqueWeekdays(request.context.fixedRestDays);
  const contextLines = [
    "This is a runner-reviewed voice transcript. Treat it as ordinary authoring intent, not as permanent profile truth.",
  ];

  if (request.context.runningDaysPerWeek) {
    contextLines.push(
      `Known constructor context: the runner wants ${request.context.runningDaysPerWeek} running day(s) per week.`,
    );
  }

  if (fixedRestDays.length) {
    contextLines.push(
      `Known constructor context: fixed rest days are ${fixedRestDays.join(
        ", ",
      )}. Do not schedule running workouts on those days.`,
    );
  }

  for (const supplementLine of buildSupplementPromptLines(request.supplement)) {
    contextLines.push(supplementLine);
  }

  return [
    ...contextLines,
    "Return a plan-authoring draft only. Do not assume this draft has been applied.",
    "Confirmed transcript:",
    request.transcript,
  ].join("\n\n");
}

function repairVoiceAuthoringInput(value: unknown, request: VoiceToPlanDraftRequest) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;

  return {
    ...record,
    goal: repairVoiceGoal(record.goal, request.supplement),
    schedule: repairVoiceSchedule(record.schedule, request.supplement),
    runnerProfile: repairVoiceRunnerProfile(record.runnerProfile, request.supplement),
    currentLevel: repairVoiceCurrentLevel(record.currentLevel, request.supplement),
    availability: repairVoiceAvailability(record.availability, request.context),
    constraints: repairVoiceConstraints(record.constraints, request.supplement),
    preferences: repairVoicePreferences(record.preferences, request.supplement),
    execution: repairVoiceExecution(record.execution, request.supplement),
  };
}

function repairVoiceGoal(value: unknown, supplement: VoiceToPlanSupplement) {
  const goal = readObject(value);
  const goalType = supplement.goalDistance ?? readGoalDistance(goal?.goalType);
  const generatedGoalLabel = readString(goal?.goalLabel);

  return {
    ...(goal ?? {}),
    ...(goalType ? { goalType } : {}),
    ...(goalType && !generatedGoalLabel
      ? {
          goalLabel: buildSupplementGoalLabel({
            goalDistance: goalType,
            goalStyle: supplement.goalStyle ?? "balanced",
            targetTime: supplement.targetTime ?? null,
          }),
        }
      : {}),
  };
}

function repairVoiceSchedule(value: unknown, supplement: VoiceToPlanSupplement) {
  const schedule = readObject(value);

  return {
    ...(schedule ?? {}),
    ...(supplement.targetDate ? { targetDate: supplement.targetDate } : {}),
  };
}

function repairVoiceRunnerProfile(value: unknown, supplement: VoiceToPlanSupplement) {
  const runnerProfile = readObject(value);
  const execution = normalizeFirstPlanExecutionMode({
    watchAccess: supplement.watchAccess ?? null,
    guidancePreference: supplement.guidancePreference ?? null,
  });

  return {
    ...(runnerProfile ?? {}),
    ...(supplement.age ? { age: supplement.age } : {}),
    ...(supplement.guidancePreference
      ? {
          preferredEffortLanguage: guidancePreferenceToPreferredEffortLanguage(
            execution.guidancePreference,
          ),
        }
      : {}),
  };
}

function repairVoiceCurrentLevel(value: unknown, supplement: VoiceToPlanSupplement) {
  const currentLevel = readObject(value);

  if (supplement.recent5kTime) {
    const recent5kPaceSecondsPerKm = parseDurationSeconds(supplement.recent5kTime)! / 5;

    return {
      ...(currentLevel ?? {}),
      recentResultSummary: `Recent 5K time: ${supplement.recent5kTime}.`,
      recentRaceResults: [
        {
          distance: "5K",
          resultTime: supplement.recent5kTime,
          resultDate: null,
        },
      ],
      recent5kPaceSecondsPerKm,
      currentEasyPaceRange: readString(currentLevel?.currentEasyPaceRange) ?? null,
    };
  }

  if (supplement.recent5kPace) {
    const recent5kPaceSecondsPerKm = parsePaceSecondsPerKm(supplement.recent5kPace)!;

    return {
      ...(currentLevel ?? {}),
      recentResultSummary: `Recent 5K pace: ${supplement.recent5kPace}.`,
      recent5kPaceSecondsPerKm,
      currentEasyPaceRange: readString(currentLevel?.currentEasyPaceRange) ?? null,
    };
  }

  return currentLevel ?? {};
}

function repairVoiceAvailability(value: unknown, context: VoiceToPlanDraftRequest["context"]) {
  const availability = readObject(value);
  const fixedRestDays = uniqueWeekdays(context.fixedRestDays);
  const modelUnavailableDays = readWeekdays(availability?.unavailableDays);
  const unavailableDays = uniqueWeekdays([...modelUnavailableDays, ...fixedRestDays]);
  const allowedWeekdays = WEEKDAY_NAMES.filter((weekday) => !unavailableDays.includes(weekday));
  const requestedRunningDayCount =
    context.runningDaysPerWeek ?? readPositiveInteger(availability?.maxRunningDaysPerWeek);
  const runningDayCount = Math.max(
    1,
    Math.min(
      requestedRunningDayCount ?? Math.min(3, allowedWeekdays.length),
      allowedWeekdays.length,
    ),
  );
  const modelPreferredDays = readWeekdays(availability?.preferredRunningDays).filter((weekday) =>
    allowedWeekdays.includes(weekday),
  );
  const preferredRunningDays = fillPreferredRunningDays(
    modelPreferredDays,
    allowedWeekdays,
    runningDayCount,
  );
  const modelLongRunDay = readWeekday(availability?.preferredLongRunDay);
  const preferredLongRunDay =
    modelLongRunDay && preferredRunningDays.includes(modelLongRunDay)
      ? modelLongRunDay
      : chooseLongRunDay(preferredRunningDays);

  return {
    ...(availability ?? {}),
    preferredRunningDays,
    unavailableDays,
    maxRunningDaysPerWeek: runningDayCount,
    allowBackToBackDays:
      typeof availability?.allowBackToBackDays === "boolean"
        ? availability.allowBackToBackDays
        : false,
    preferredLongRunDay,
  };
}

function repairVoiceConstraints(value: unknown, supplement: VoiceToPlanSupplement) {
  const constraints = readObject(value);
  const hardConstraints = Array.isArray(constraints?.hardConstraints)
    ? [...constraints.hardConstraints]
    : [];

  if (supplement.targetTime) {
    hardConstraints.push(`Target time context: ${supplement.targetTime}.`);
  }

  if (supplement.comment) {
    hardConstraints.push(`Runner voice supplement: ${supplement.comment}`);
  }

  return {
    ...(constraints ?? {}),
    hardConstraints,
  };
}

function repairVoicePreferences(value: unknown, supplement: VoiceToPlanSupplement) {
  const preferences = readObject(value);
  const terrainFocus = normalizeSupplementTerrainFocus(supplement);

  return {
    ...(preferences ?? {}),
    terrainFocus: terrainFocus ?? readTerrainFocus(preferences?.terrainFocus) ?? "standard",
    ...(supplement.strengthPreference
      ? {
          strengthOrMobilityInterest:
            supplement.strengthPreference === "strength_mobility"
              ? "both"
              : supplement.strengthPreference,
        }
      : {}),
    ...(supplement.comment ? { notes: supplement.comment } : {}),
  };
}

function repairVoiceExecution(value: unknown, supplement: VoiceToPlanSupplement) {
  const execution = readObject(value);

  return normalizeFirstPlanExecutionMode({
    watchAccess: supplement.watchAccess ?? readWatchAccess(execution?.watchAccess),
    guidancePreference:
      supplement.guidancePreference ?? readGuidancePreference(execution?.guidancePreference),
  });
}

function buildVoiceDraftSuccess(
  request: ParsedVoiceToPlanDraftRequest,
  generatedPlan: GeneratedPlanResult,
): VoiceToPlanDraftSuccess {
  return {
    ok: true,
    status: "draft_ready",
    sourceKind: "voice_transcript",
    transcript: {
      text: request.transcript,
      characterCount: request.transcript.length,
      maxCharacterCount: MAX_TRANSCRIPT_LENGTH,
    },
    context: {
      fixedRestDays: uniqueWeekdays(request.context.fixedRestDays),
      runningDaysPerWeek: request.context.runningDaysPerWeek ?? null,
    },
    supplement: request.supplement,
    review: buildDraftReview(generatedPlan.canonicalPlan, generatedPlan.authoringInput, request),
    draft: {
      authoringInput: generatedPlan.authoringInput,
      canonicalPlan: generatedPlan.canonicalPlan,
      summary: buildDraftSummary(generatedPlan.canonicalPlan, generatedPlan.authoringInput),
    },
    safety: buildVoiceSafetyFlags(),
    model: generatedPlan.model,
    responseId: generatedPlan.responseId,
  };
}

function buildDraftSummary(
  canonicalPlan: TrainingPlanV2,
  authoringInput: VoiceToPlanAuthoringInput,
): VoiceToPlanDraftSummary {
  return {
    planName: canonicalPlan.plan_name,
    startDate: canonicalPlan.start_date,
    targetDate: canonicalPlan.target_date ?? null,
    workoutCount: canonicalPlan.planned_workouts.length,
    fixedRestDays: uniqueWeekdays(authoringInput.availability.unavailableDays),
    runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
  };
}

function buildDraftReview(
  canonicalPlan: TrainingPlanV2,
  authoringInput: VoiceToPlanAuthoringInput,
  request: ParsedVoiceToPlanDraftRequest,
): VoiceToPlanDraftReview {
  const fixedRestDays = uniqueWeekdays(authoringInput.availability.unavailableDays);
  const horizonWeeks =
    authoringInput.schedule.preparationHorizonWeeks ??
    (canonicalPlan.preparation_horizon_weeks || null);
  const terrainFocus = authoringInput.preferences.terrainFocus ?? "standard";

  return {
    runnerUnderstanding: {
      profile: `${request.supplement.age} years old, ${request.supplement.weightKg} kg, ${request.supplement.heightCm} cm.`,
      inferredLevel: formatExperienceLevel(authoringInput.runnerProfile.experienceLevel),
      goal: authoringInput.goal.goalLabel,
      availability: `${authoringInput.availability.maxRunningDaysPerWeek} running day(s) per week${
        fixedRestDays.length ? `, fixed rest on ${fixedRestDays.join(", ")}` : ""
      }.`,
      timeline: authoringInput.schedule.targetDate
        ? `Target date ${authoringInput.schedule.targetDate}.`
        : horizonWeeks
          ? `About ${horizonWeeks} weeks.`
          : "Open-ended preparation window.",
    },
    planShape: {
      durationLabel: authoringInput.schedule.targetDate
        ? `${canonicalPlan.start_date} to ${authoringInput.schedule.targetDate}`
        : horizonWeeks
          ? `${horizonWeeks} weeks`
          : "Flexible horizon",
      runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
      activityMix: buildActivityMix(authoringInput),
      terrainFocus,
      workoutCount: canonicalPlan.planned_workouts.length,
    },
    assumptions: buildReviewAssumptions(request, authoringInput),
    nextActions: [
      "ok_create_plan",
      "add_more_details",
      "add_more_by_voice",
      "fill_missing_details",
    ],
  };
}

function buildActivityMix(authoringInput: VoiceToPlanAuthoringInput) {
  const mix = ["easy runs", "long-run progression"];

  if (authoringInput.availability.maxRunningDaysPerWeek >= 3) {
    mix.push("one controlled quality workout when appropriate");
  }

  if (authoringInput.goal.goalType === "5k") {
    mix.push("safe short-rep sharpening when supported");
  } else if (authoringInput.goal.goalType === "10k") {
    mix.push("rhythm-focused sustained quality");
  } else if (authoringInput.goal.goalType === "half_marathon") {
    mix.push("threshold and steady durability");
  } else if (authoringInput.goal.goalType === "marathon") {
    mix.push("marathon steady-specificity and long-run durability");
  } else if (authoringInput.goal.goalType === "ultra_marathon") {
    mix.push("ultra time-on-feet durability");
  }

  if (authoringInput.preferences.terrainFocus === "rolling") {
    mix.push("occasional rolling-terrain guidance");
  }

  if (authoringInput.preferences.terrainFocus === "mountain") {
    mix.push("mountain terrain skills, controlled descents, and time-on-feet guidance");
  }

  if (
    authoringInput.preferences.strengthOrMobilityInterest &&
    authoringInput.preferences.strengthOrMobilityInterest !== "none"
  ) {
    mix.push("simple strength or mobility support");
  }

  return mix;
}

function buildReviewAssumptions(
  request: ParsedVoiceToPlanDraftRequest,
  authoringInput: VoiceToPlanAuthoringInput,
) {
  const assumptions = [];
  const requestedGoalStyle = request.reviewContext.requestedGoalStyle;
  const reviewedGoalStyle = inferReviewedGoalStyle(authoringInput);

  if (requestedGoalStyle && reviewedGoalStyle && requestedGoalStyle !== reviewedGoalStyle) {
    assumptions.push(buildGoalStyleMismatchAssumption(requestedGoalStyle, reviewedGoalStyle));
  }

  const targetTimeHonesty = buildVoiceTargetTimeHonestyAssumption(request, authoringInput);

  if (targetTimeHonesty) {
    assumptions.push(targetTimeHonesty);
  }

  assumptions.push(
    ...buildLongDistanceHonestyAssumptions({
      goalType: authoringInput.goal.goalType,
      runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
      horizonWeeks: deriveVoiceReviewHorizonWeeks(authoringInput),
      hasUsableBenchmark: Boolean(authoringInput.currentLevel.recent5kPaceSecondsPerKm),
      targetTimeIntent: hasVoiceTargetTimeIntent(request, authoringInput),
      baselineLongRunKm: authoringInput.runnerProfile.baselineLongRunKm,
      currentLoadKnown: Boolean(authoringInput.currentLevel.recent5kPaceSecondsPerKm),
      age: authoringInput.runnerProfile.age,
    }),
  );

  if (!request.supplement.terrainFocus && authoringInput.preferences.terrainFocus === "standard") {
    assumptions.push(
      "Terrain was treated as standard because no hill or mountain focus was supplied.",
    );
  }

  if (!request.supplement.targetDate && !authoringInput.schedule.targetDate) {
    assumptions.push("Timeline uses a conservative default horizon rather than a race date.");
  }

  if (!request.supplement.strengthPreference) {
    assumptions.push("Strength or mobility support stays minimal unless you add that preference.");
  }

  return assumptions;
}

function deriveVoiceReviewHorizonWeeks(authoringInput: VoiceToPlanAuthoringInput) {
  if (authoringInput.schedule.preparationHorizonWeeks) {
    return authoringInput.schedule.preparationHorizonWeeks;
  }

  if (!authoringInput.schedule.targetDate) {
    return null;
  }

  return Math.max(
    1,
    Math.ceil(
      (diffDaysIso(authoringInput.schedule.targetDate, authoringInput.schedule.startDate) + 1) / 7,
    ),
  );
}

function buildVoiceTargetTimeHonestyAssumption(
  request: ParsedVoiceToPlanDraftRequest,
  authoringInput: VoiceToPlanAuthoringInput,
) {
  const hasTargetTimeIntent = hasVoiceTargetTimeIntent(request, authoringInput);

  if (!hasTargetTimeIntent) {
    return null;
  }

  const hasBenchmark = Boolean(authoringInput.currentLevel.recent5kPaceSecondsPerKm);

  if (!hasBenchmark) {
    return "Target-time intent is noted, but without a recent 5K benchmark this draft stays effort-based and does not promise target-specific paces.";
  }

  if (request.supplement.targetTime && request.supplement.goalDistance) {
    const targetSeconds = parseDurationSeconds(request.supplement.targetTime);
    const goalDistanceKm = voiceGoalDistanceKmForTargetTime(request.supplement.goalDistance);
    const benchmarkPaceSeconds = authoringInput.currentLevel.recent5kPaceSecondsPerKm;

    if (targetSeconds && goalDistanceKm && benchmarkPaceSeconds) {
      const targetPaceSecondsPerKm = targetSeconds / goalDistanceKm;
      const minimumSupportBuffer = voiceMinimumTargetSupportBufferSeconds(
        request.supplement.goalDistance,
      );

      if (targetPaceSecondsPerKm < benchmarkPaceSeconds + minimumSupportBuffer) {
        return "The target time looks aggressive against the supplied 5K benchmark, so Hito keeps the plan conservative and treats the target as motivation rather than a guarantee.";
      }
    }
  }

  return null;
}

function hasVoiceTargetTimeIntent(
  request: ParsedVoiceToPlanDraftRequest,
  authoringInput: VoiceToPlanAuthoringInput,
) {
  return (
    request.supplement.goalStyle === "target_time" ||
    /\btarget(?:\s|-)?time\b/i.test(authoringInput.goal.goalLabel) ||
    authoringInput.constraints.hardConstraints.some((constraint) => /target time/i.test(constraint))
  );
}

function voiceGoalDistanceKmForTargetTime(goalDistance: VoiceGoalDistance) {
  switch (goalDistance) {
    case "5k":
      return 5;
    case "10k":
      return 10;
    case "half_marathon":
      return 21.1;
    case "marathon":
      return 42.2;
    case "ultra_marathon":
      return 50;
    case "build_consistency":
    case "mountain_running":
      return null;
  }
}

function voiceMinimumTargetSupportBufferSeconds(goalDistance: VoiceGoalDistance) {
  switch (goalDistance) {
    case "10k":
      return 10;
    case "half_marathon":
      return 25;
    case "marathon":
      return 45;
    case "ultra_marathon":
      return 60;
    case "5k":
    case "build_consistency":
    case "mountain_running":
      return 0;
  }
}

function inferReviewedGoalStyle(
  authoringInput: VoiceToPlanAuthoringInput,
): z.infer<typeof goalStyleSchema> | null {
  const goalLabel = authoringInput.goal.goalLabel.toLowerCase();

  if (/\btarget(?:\s|-)?time\b/.test(goalLabel)) return "target_time";
  if (/\brelaxed|conservative|gentle\b/.test(goalLabel)) return "relaxed";
  if (/\bambitious|aggressive\b/.test(goalLabel)) return "ambitious";
  if (/\bbalanced\b/.test(goalLabel)) return "balanced";

  return null;
}

function buildGoalStyleMismatchAssumption(
  requestedGoalStyle: z.infer<typeof goalStyleSchema>,
  reviewedGoalStyle: z.infer<typeof goalStyleSchema>,
) {
  return `You asked for ${formatGoalStyle(requestedGoalStyle)}. Hito is proposing ${formatGoalStyle(
    reviewedGoalStyle,
  )} based on the available schedule and readiness signals, so review that style change before creating the plan.`;
}

function buildVoiceSafetyFlags(): VoiceToPlanSafetyFlags {
  return {
    requiresExplicitApply: true,
    doesNotMutatePlan: true,
    rawTranscriptPersisted: false,
    usesCanonicalStructuredAuthoring: true,
  };
}

function fillPreferredRunningDays(
  modelPreferredDays: WeekdayName[],
  allowedWeekdays: readonly WeekdayName[],
  runningDayCount: number,
) {
  const selected = uniqueWeekdays(modelPreferredDays).filter((weekday) =>
    allowedWeekdays.includes(weekday),
  );

  for (const weekday of pickEvenly(allowedWeekdays, runningDayCount)) {
    if (selected.length >= runningDayCount) break;
    if (!selected.includes(weekday)) {
      selected.push(weekday);
    }
  }

  for (const weekday of allowedWeekdays) {
    if (selected.length >= runningDayCount) break;
    if (!selected.includes(weekday)) {
      selected.push(weekday);
    }
  }

  return uniqueWeekdays(selected).slice(0, runningDayCount);
}

function normalizeVoiceSupplement(supplement: VoiceToPlanSupplement): VoiceToPlanSupplement {
  return {
    ...supplement,
    fixedRestDays: uniqueWeekdays(supplement.fixedRestDays),
    runningDaysPerWeek: supplement.runningDaysPerWeek ?? null,
    terrainFocus: normalizeSupplementTerrainFocus(supplement),
    comment: supplement.comment?.trim() || null,
  };
}

function mergeSupplementWithTranscriptInference(
  transcript: string,
  supplement: VoiceToPlanSupplement,
): VoiceToPlanSupplement {
  const inferred = inferVoiceSupplementFromTranscript(transcript);

  return normalizeVoiceSupplement({
    ...supplement,
    age: supplement.age ?? inferred.age ?? null,
    weightKg: supplement.weightKg ?? inferred.weightKg ?? null,
    heightCm: supplement.heightCm ?? inferred.heightCm ?? null,
    fixedRestDays: uniqueWeekdays([...(inferred.fixedRestDays ?? []), ...supplement.fixedRestDays]),
    runningDaysPerWeek: supplement.runningDaysPerWeek ?? inferred.runningDaysPerWeek ?? null,
    goalDistance: supplement.goalDistance ?? inferred.goalDistance ?? null,
    goalStyle: supplement.goalStyle ?? inferred.goalStyle ?? null,
    targetTime: supplement.targetTime ?? inferred.targetTime ?? null,
    targetDate: supplement.targetDate ?? null,
    recent5kTime: supplement.recent5kTime ?? inferred.recent5kTime ?? null,
    recent5kPace: supplement.recent5kPace ?? inferred.recent5kPace ?? null,
    terrainFocus: supplement.terrainFocus ?? inferred.terrainFocus ?? null,
    watchAccess: supplement.watchAccess ?? null,
    guidancePreference: supplement.guidancePreference ?? null,
    strengthPreference: supplement.strengthPreference ?? inferred.strengthPreference ?? null,
    comment: supplement.comment ?? null,
  });
}

function resolveRequestedGoalStyleForReview(
  transcript: string,
  supplement: VoiceToPlanSupplement,
): { style: VoiceGoalStyle | null; source: VoiceToPlanReviewContext["requestedGoalStyleSource"] } {
  const transcriptStyle = inferExplicitGoalStyleCueFromTranscript(transcript);

  if (transcriptStyle) {
    return {
      style: transcriptStyle,
      source: "transcript",
    };
  }

  if (supplement.goalStyle) {
    return {
      style: supplement.goalStyle,
      source: "supplement",
    };
  }

  return {
    style: null,
    source: null,
  };
}

function inferVoiceSupplementFromTranscript(transcript: string): VoiceToPlanSupplement {
  const text = transcript.toLowerCase();
  const goalDistance = inferGoalDistanceFromTranscript(text);
  const terrainFocus = /\b(mountain|climb|climbing|hill repeats?|uphill)\b/i.test(transcript)
    ? "mountain"
    : /\b(rolling|hilly|hills)\b/i.test(transcript)
      ? "rolling"
      : null;

  return {
    age: inferAge(text),
    weightKg: inferWeightKg(text),
    heightCm: inferHeightCm(text),
    fixedRestDays: inferFixedRestDays(text),
    runningDaysPerWeek: inferRunningDaysPerWeek(text),
    goalDistance,
    goalStyle: inferGoalStyle(text),
    targetTime: inferTargetTime(text),
    targetDate: null,
    recent5kTime: inferRecent5kTime(text),
    recent5kPace: inferRecent5kPace(text),
    terrainFocus,
    strengthPreference: inferStrengthPreference(text),
    comment: null,
  };
}

function hasRequiredProfileBasics(
  supplement: VoiceToPlanSupplement,
): supplement is VoiceToPlanSupplement & {
  age: number;
  weightKg: number;
  heightCm: number;
} {
  return Boolean(supplement.age && supplement.weightKg && supplement.heightCm);
}

function hasCurrentLevelSignal(request: VoiceToPlanDraftRequest) {
  const transcript = request.transcript.toLowerCase();

  return Boolean(
    request.supplement.recent5kTime ||
    request.supplement.recent5kPace ||
    /\b(5k|five k|pace|pb|personal best|currently|weekly|per week|long run|beginner|new runner|returning|consistent|break|run\s+\d+)/i.test(
      transcript,
    ),
  );
}

function hasAvailabilitySignal(request: VoiceToPlanDraftRequest) {
  const transcript = request.transcript.toLowerCase();

  return Boolean(
    request.context.runningDaysPerWeek ||
    request.supplement.runningDaysPerWeek ||
    /\b([1-7]|one|two|three|four|five|six|seven)\s+(days|times|runs)\s+(a|per)\s+week\b/i.test(
      transcript,
    ),
  );
}

function hasTimelineSignal(request: VoiceToPlanDraftRequest) {
  const transcript = request.transcript.toLowerCase();

  return Boolean(
    request.supplement.targetDate ||
    /\b(\d{1,2}\s+(weeks|months)|weeks?|months?|january|february|march|april|may|june|july|august|september|october|november|december|race date|target date|by\s+\d{4}-\d{2}-\d{2})\b/i.test(
      transcript,
    ),
  );
}

function inferGoalDistanceFromTranscript(
  transcript: string,
): z.infer<typeof goalDistanceSchema> | null {
  if (/\b(build consistency|consistency|habit|start running)\b/i.test(transcript)) {
    return "build_consistency";
  }

  if (/\bmountain\b/i.test(transcript)) return "mountain_running";
  if (/\bultra\b/i.test(transcript)) return "ultra_marathon";
  if (/\bmarathon\b/i.test(transcript)) return "marathon";
  if (/\bhalf\b/i.test(transcript)) return "half_marathon";
  if (/\b10\s?k\b/i.test(transcript)) return "10k";
  if (/\b5\s?k\b/i.test(transcript)) return "5k";

  return null;
}

function inferAge(text: string) {
  const match =
    /\b(?:i(?:'m| am)|age(?:d)?|aged)\s*(\d{2})\b/i.exec(text) ??
    /\b(\d{2})\s*(?:years old|year old|yo)\b/i.exec(text);
  const value = match?.[1] ? Number(match[1]) : null;

  return value && value >= 13 && value <= 100 ? value : null;
}

function inferWeightKg(text: string) {
  const match = /\b(\d{2,3}(?:[.,]\d)?)\s*(?:kg|kilograms?)\b/i.exec(text);
  const value = match?.[1] ? Number(match[1].replace(",", ".")) : null;

  return value && value >= 30 && value <= 250 && Number.isInteger(value * 2) ? value : null;
}

function inferHeightCm(text: string) {
  const match = /\b(\d{3})\s*(?:cm|centimeters?)\b/i.exec(text);
  const value = match?.[1] ? Number(match[1]) : null;

  return value && value >= 120 && value <= 230 ? value : null;
}

function inferRunningDaysPerWeek(text: string) {
  const match =
    /\b([1-7])\s+(?:days|times|runs)\s+(?:a|per)\s+week\b/i.exec(text) ??
    /\b(one|two|three|four|five|six|seven)\s+(?:days|times|runs)\s+(?:a|per)\s+week\b/i.exec(text);
  const value = match?.[1] ? weekdayCountWordToNumber(match[1]) : null;

  return value && value >= 1 && value <= 7 ? value : null;
}

function inferFixedRestDays(text: string) {
  const snippets = text.match(
    /\b(?:rest|off|unavailable|can't run|cannot run|do not run|don't run)\b[^.?!]{0,100}/gi,
  );

  if (!snippets) {
    return [];
  }

  return uniqueWeekdays(
    snippets.flatMap((snippet) =>
      WEEKDAY_NAMES.filter((weekday) => new RegExp(`\\b${weekday}\\b`, "i").test(snippet)),
    ),
  );
}

function inferGoalStyle(text: string): z.infer<typeof goalStyleSchema> | null {
  if (/\btarget(?:\s|-)?time|sub\s?\d|under\s+\d/.test(text)) return "target_time";
  if (/\bambitious|aggressive|push\b/.test(text)) return "ambitious";
  if (/\brelaxed|easy|gentle|conservative\b/.test(text)) return "relaxed";
  if (/\bbalanced\b/.test(text)) return "balanced";

  return null;
}

function inferExplicitGoalStyleCueFromTranscript(text: string): VoiceGoalStyle | null {
  if (/\btarget(?:\s|-)?time\b/i.test(text)) return "target_time";
  if (/\bambitious\b/i.test(text)) return "ambitious";
  if (/\brelaxed\b/i.test(text)) return "relaxed";
  if (/\bbalanced\b/i.test(text)) return "balanced";

  return null;
}

function inferTargetTime(text: string) {
  const match = /\btarget(?:\s|-)?time\b[^0-9]{0,20}(\d{1,2}:\d{2}(?::\d{2})?)\b/i.exec(text);

  return match?.[1] ?? null;
}

function inferRecent5kPace(text: string) {
  const match = /\b5\s?k\b[^.?!]{0,50}\bpace\b[^0-9]{0,12}(\d{1,2}:\d{2})\s*(?:\/?\s*km)?/i.exec(
    text,
  );

  return match?.[1] ? `${match[1]}/km` : null;
}

function inferRecent5kTime(text: string) {
  if (/\b5\s?k\b[^.?!]{0,50}\bpace\b/i.test(text)) {
    return null;
  }

  const match =
    /\b5\s?k\b[^.?!]{0,50}\b(?:time|pb|personal best|result)\b[^0-9]{0,12}(\d{1,2}:\d{2}(?::\d{2})?)\b/i.exec(
      text,
    ) ??
    /\b(?:ran|run|finished)\b[^.?!]{0,30}\b5\s?k\b[^.?!]{0,30}\bin\b[^0-9]{0,12}(\d{1,2}:\d{2}(?::\d{2})?)\b/i.exec(
      text,
    );

  return match?.[1] ?? null;
}

function inferStrengthPreference(text: string): z.infer<typeof strengthPreferenceSchema> | null {
  if (/\bstrength\b/.test(text)) return "strength_mobility";
  if (/\bmobility\b/.test(text)) return "mobility";
  if (/\bno\s+(?:strength|gym|mobility)\b/.test(text)) return "none";

  return null;
}

function isRaceOrDistanceGoal(goalDistance: z.infer<typeof goalDistanceSchema> | null) {
  return Boolean(goalDistance && goalDistance !== "build_consistency");
}

function buildUnderstoodSummary(request: VoiceToPlanDraftRequest) {
  const understood = [];
  const goal =
    request.supplement.goalDistance ?? inferGoalDistanceFromTranscript(request.transcript);

  if (goal) understood.push(`Goal: ${formatGoalDistance(goal)}.`);
  if (request.supplement.runningDaysPerWeek || request.context.runningDaysPerWeek) {
    understood.push(
      `Availability: ${request.supplement.runningDaysPerWeek ?? request.context.runningDaysPerWeek} running day(s) per week.`,
    );
  }
  if (request.context.fixedRestDays.length) {
    understood.push(`Fixed rest days: ${request.context.fixedRestDays.join(", ")}.`);
  }
  if (request.supplement.recent5kTime) {
    understood.push(`Recent 5K time: ${request.supplement.recent5kTime}.`);
  }
  if (request.supplement.recent5kPace) {
    understood.push(`Recent 5K pace: ${request.supplement.recent5kPace}.`);
  }

  return understood;
}

function buildTranscriptSummary(request: VoiceToPlanDraftRequest) {
  return {
    text: request.transcript,
    characterCount: request.transcript.length,
    maxCharacterCount: MAX_TRANSCRIPT_LENGTH,
  };
}

function buildSupplementPromptLines(supplement: VoiceToPlanSupplement) {
  const lines = [];

  if (hasRequiredProfileBasics(supplement)) {
    lines.push(
      `Manual supplement: age ${supplement.age}, weight ${supplement.weightKg} kg, height ${supplement.heightCm} cm.`,
    );
  }

  if (supplement.goalDistance) {
    lines.push(
      `Manual supplement: goal distance is ${formatGoalDistance(supplement.goalDistance)}.`,
    );
  }

  if (supplement.goalStyle) {
    lines.push(`Manual supplement: goal style is ${formatGoalStyle(supplement.goalStyle)}.`);
  }

  if (supplement.targetTime) {
    lines.push(`Manual supplement: target time is ${supplement.targetTime}.`);
  }

  if (supplement.targetDate) {
    lines.push(`Manual supplement: target date is ${supplement.targetDate}.`);
  }

  if (supplement.recent5kTime) {
    lines.push(`Manual supplement: recent 5K time is ${supplement.recent5kTime}.`);
  }

  if (supplement.recent5kPace) {
    lines.push(`Manual supplement: recent 5K pace is ${supplement.recent5kPace}.`);
  }

  if (supplement.terrainFocus) {
    lines.push(`Manual supplement: terrain focus is ${supplement.terrainFocus}.`);
  }

  if (supplement.watchAccess) {
    lines.push(`Manual supplement: workout-following access is ${supplement.watchAccess}.`);
  }

  if (supplement.guidancePreference) {
    lines.push(`Manual supplement: guidance preference is ${supplement.guidancePreference}.`);
  }

  if (supplement.comment) {
    lines.push(`Manual supplement comment: ${supplement.comment}`);
  }

  return lines;
}

function buildSupplementGoalLabel({
  goalDistance,
  goalStyle,
  targetTime,
}: {
  goalDistance: z.infer<typeof goalDistanceSchema>;
  goalStyle: z.infer<typeof goalStyleSchema>;
  targetTime: string | null;
}) {
  const parts = [formatGoalDistance(goalDistance), formatGoalStyle(goalStyle)];

  if (goalStyle === "target_time" && targetTime) {
    parts.push(targetTime);
  }

  return parts.join(" · ");
}

function formatExperienceLevel(
  value: VoiceToPlanAuthoringInput["runnerProfile"]["experienceLevel"],
) {
  switch (value) {
    case "new_runner":
      return "New runner";
    case "returning_runner":
      return "Returning runner";
    case "consistent_runner":
      return "Consistent runner";
    case "experienced_runner":
      return "Experienced runner";
  }
}

function readGoalDistance(value: unknown): VoiceGoalDistance | null {
  return typeof value === "string" && goalDistanceSchema.safeParse(value).success
    ? (value as VoiceGoalDistance)
    : null;
}

function normalizeSupplementTerrainFocus(supplement: VoiceToPlanSupplement) {
  if (supplement.goalDistance === "mountain_running") {
    return "mountain" as const;
  }

  if (supplement.goalDistance === "marathon" || supplement.goalDistance === "ultra_marathon") {
    return supplement.terrainFocus ?? "standard";
  }

  return supplement.terrainFocus ?? null;
}

function readTerrainFocus(value: unknown) {
  return typeof value === "string" && terrainFocusSchema.safeParse(value).success
    ? (value as z.infer<typeof terrainFocusSchema>)
    : null;
}

function readObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function weekdayCountWordToNumber(value: string) {
  const normalized = value.toLowerCase();
  const numeric = Number(normalized);

  if (Number.isInteger(numeric)) {
    return numeric;
  }

  const wordMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
  };

  return wordMap[normalized] ?? null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readWatchAccess(value: unknown): FirstPlanWatchAccess | null {
  return typeof value === "string" && watchAccessSchema.safeParse(value).success
    ? (value as FirstPlanWatchAccess)
    : null;
}

function readGuidancePreference(value: unknown): FirstPlanGuidancePreference | null {
  return typeof value === "string" && guidancePreferenceSchema.safeParse(value).success
    ? (value as FirstPlanGuidancePreference)
    : null;
}

function readWeekday(value: unknown): WeekdayName | null {
  return typeof value === "string" && isWeekdayName(value) ? value : null;
}

function readWeekdays(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueWeekdays(value.filter(isWeekdayName));
}

function normalizeTranscript(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isMostlyFillerTranscript(value: string) {
  const words = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return true;
  }

  const fillerWords = new Set(["um", "uh", "hmm", "hm", "ah", "like", "yeah", "okay", "ok"]);
  const usefulWords = words.filter((word) => !fillerWords.has(word));

  return usefulWords.length < 3;
}

function formatVoiceToPlanInputError(error: z.ZodError) {
  const issue = error.issues[0];

  return issue?.message ?? "Check the transcript and try again.";
}
