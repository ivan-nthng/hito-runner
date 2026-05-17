import "@tanstack/react-start/server-only";

import { z } from "zod";
import { serverEnv } from "@/lib/supabase/env";
import type { RunnerCoachContext } from "@/lib/runner-coach-context";
import { formatWeekdayList, weekdayRestInvariantToSignature } from "@/lib/weekday-rest-invariants";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_REFRESH_MODEL = "gpt-5";
const FIXED_TRUTH_REVIEW_ITEMS = [
  "Past workouts stay fixed.",
  "Logged history stays fixed.",
  "Only the remaining active schedule is under review.",
] as const;

export interface ActivePlanRefreshProposal {
  model: string;
  responseId: string | null;
  output: {
    proposalStatus: "proposal_only";
    applyContext: {
      generatedAt: string;
      fingerprint: ActivePlanRefreshFingerprint;
    };
    summary: string;
    rationale: string[];
    proposedChanges: string[];
    keepAsIs: string[];
    remainingScheduleScope: {
      scope: "remaining_active_schedule_only";
      startDate: string | null;
      endDate: string | null;
      totalRemainingWorkoutCount: number;
      targetedWorkoutCount: number;
    };
    review: {
      summary: string;
      rationale: string[];
      proposedChanges: string[];
      keepAsIs: string[];
      scope: {
        label: string;
        startDate: string | null;
        endDate: string | null;
        totalRemainingWorkoutCount: number;
        targetedWorkoutCount: number;
      };
      cautionContext: {
        included: boolean;
        note: string;
        bodyNoteCautions: Array<{
          date: string;
          title: string;
          maxSeverity: number;
        }>;
      };
      boundaryNote: string;
    };
    safety: {
      requiresExplicitApply: true;
      preservesPastAndLoggedHistory: true;
      doesNotMutatePlan: true;
    };
    recommendedAuthoringPrompt: string;
  };
}

export interface ActivePlanRefreshFingerprint {
  schemaVersion: "active-plan-refresh-fingerprint-v1";
  today: string;
  activePlanId: string;
  activePlanUpdatedAt: string;
  firstMutableDate: string | null;
  lastMutableDate: string | null;
  weekdayRestInvariantSignature: string;
  remainingScheduleSignature: string[];
  recentHistorySignature: string[];
}

export interface ActivePlanRefreshPromptPayload {
  runnerPrompt: string;
  scope: RunnerCoachContext["refreshBoundary"];
  activePlan: RunnerCoachContext["activePlan"];
  runner: Omit<RunnerCoachContext["runner"], "userId">;
  weekdayRestInvariant: RunnerCoachContext["weekdayRestInvariant"];
  remainingActiveSchedule: Array<{
    ref: string;
    date: string;
    title: string;
    workoutType: string;
    plannedDuration: string;
    plannedDistance: string | null;
    notes: string | null;
  }>;
  recentAdherence: RunnerCoachContext["recentAdherence"];
  recentActualLoad: RunnerCoachContext["recentActualLoad"];
  recentComparisonSignals: RunnerCoachContext["recentComparisonSignals"];
  bodyNoteCautions: RunnerCoachContext["bodyNoteCautions"];
}

const refreshProposalSchema = z.object({
  proposalStatus: z.literal("proposal_only"),
  summary: z.string().trim().min(20).max(400),
  rationale: z.array(z.string().trim().min(10).max(220)).min(1).max(5),
  proposedChanges: z.array(z.string().trim().min(10).max(220)).min(1).max(8),
  keepAsIs: z.array(z.string().trim().min(10).max(220)).max(6),
  remainingScheduleScope: z.object({
    scope: z.literal("remaining_active_schedule_only"),
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    targetWorkoutRefs: z.array(z.string().trim().min(1)).max(80),
  }),
  safety: z.object({
    requiresExplicitApply: z.literal(true),
    preservesPastAndLoggedHistory: z.literal(true),
    doesNotMutatePlan: z.literal(true),
  }),
  recommendedAuthoringPrompt: z.string().trim().min(20).max(1600),
});

export type RefreshProposalOutput = z.infer<typeof refreshProposalSchema>;

export function buildActivePlanRefreshPromptPayload(
  context: RunnerCoachContext,
  runnerPrompt: string,
): ActivePlanRefreshPromptPayload {
  return {
    runnerPrompt: runnerPrompt.trim(),
    scope: context.refreshBoundary,
    activePlan: context.activePlan,
    runner: {
      displayName: context.runner.displayName,
      goalType: context.runner.goalType,
      goalLabel: context.runner.goalLabel,
      baselineSessionsPerWeek: context.runner.baselineSessionsPerWeek,
      baselineLongRunKm: context.runner.baselineLongRunKm,
      baselineNotes: context.runner.baselineNotes,
    },
    weekdayRestInvariant: context.weekdayRestInvariant,
    remainingActiveSchedule: context.remainingActiveSchedule.map((workout, index) => ({
      ref: workoutRefForIndex(index),
      date: workout.date,
      title: workout.title,
      workoutType: humanizeWorkoutType(workout.workoutType),
      plannedDuration: `${workout.plannedDurationMin} min`,
      plannedDistance: workout.plannedDistanceKm == null ? null : `${workout.plannedDistanceKm} km`,
      notes: workout.notes,
    })),
    recentAdherence: context.recentAdherence,
    recentActualLoad: context.recentActualLoad,
    recentComparisonSignals: context.recentComparisonSignals,
    bodyNoteCautions: context.bodyNoteCautions,
  };
}

export async function generateActivePlanRefreshProposal({
  context,
  runnerPrompt,
}: {
  context: RunnerCoachContext;
  runnerPrompt: string;
}): Promise<ActivePlanRefreshProposal> {
  if (!context.activePlan) {
    throw new Error("An active plan is required before requesting a refresh proposal.");
  }

  if (!context.remainingActiveSchedule.length) {
    throw new Error("There is no remaining active schedule to refresh.");
  }

  const apiKey = serverEnv.openAiApiKey;

  if (!apiKey) {
    throw new Error("OpenAI plan refresh is not configured. Missing OPENAI_API_KEY.");
  }

  const model = serverEnv.openAiPlanModel ?? DEFAULT_OPENAI_REFRESH_MODEL;
  const promptPayload = buildActivePlanRefreshPromptPayload(context, runnerPrompt);
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
              text: JSON.stringify(promptPayload),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "active_plan_refresh_proposal",
          strict: true,
          schema: activePlanRefreshOpenAiSchema,
        },
      },
    }),
  });

  const body = (await response.json()) as OpenAiResponseEnvelope;

  if (!response.ok) {
    throw new Error(
      `OpenAI plan refresh failed with ${response.status}: ${extractOpenAiError(body)}`,
    );
  }

  const rawOutput = extractStructuredOutputText(body);
  const parsedOutput = safeParseJson(rawOutput);

  if (!parsedOutput) {
    throw new Error("OpenAI returned a non-JSON plan refresh proposal payload.");
  }

  const parsedProposal = refreshProposalSchema.safeParse(parsedOutput);

  if (!parsedProposal.success) {
    const issueSummary = parsedProposal.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(" | ");

    throw new Error(`OpenAI plan refresh proposal failed validation: ${issueSummary}`);
  }

  return {
    model,
    responseId: body.id ?? null,
    output: buildReviewSafeActivePlanRefreshOutput(context, parsedProposal.data),
  };
}

function buildSystemPrompt() {
  return [
    "You are generating a bounded active-plan refresh proposal for Hito Running.",
    "Return only the structured JSON requested by the schema.",
    "This is proposal-only guidance. Do not claim that the plan has been changed.",
    "Past workouts, logged workout truth, Garmin actuals, comparisons, and body notes are fixed context only.",
    "You may propose changes only for the remaining active schedule listed in the input.",
    "Preserve fixed weekday rest days by default. If blocked weekdays are listed, do not place non-rest workouts on those weekdays unless the runner explicitly asked to change that constraint.",
    "When referring to workouts, use dates, titles, and plain workout descriptions, not internal refs or ids.",
    "Do not mention implementation field names such as plannedDurationMin, plannedDistanceKm, targetWorkoutRefs, or targetWorkoutIds.",
    "Keep deterministic comparison facts primary. Use body notes only as cautious discomfort context.",
    "Do not diagnose injury, prescribe treatment, or make medical claims.",
    "Be conservative. Prefer fewer, clearer adjustments over rewriting everything.",
    "Write complete plain-English sentences. Do not use bare abbreviations like HR; write heart rate if needed.",
    "The recommendedAuthoringPrompt is for a later deterministic plan-authoring step; it must not include past-date changes.",
  ].join("\n");
}

export function buildReviewSafeActivePlanRefreshOutput(
  context: RunnerCoachContext,
  proposal: RefreshProposalOutput,
): ActivePlanRefreshProposal["output"] {
  const allowedRefs = new Set(
    context.remainingActiveSchedule.map((_, index) => workoutRefForIndex(index)),
  );
  const requestedRefs = proposal.remainingScheduleScope.targetWorkoutRefs.filter((ref) =>
    allowedRefs.has(ref),
  );
  const totalRemainingWorkoutCount = context.remainingActiveSchedule.length;
  const modelTargetedWorkoutCount = requestedRefs.length;
  const runnerFacing = applyRefreshProposalTextQualityGate(context, proposal, {
    totalRemainingWorkoutCount,
    targetedWorkoutCount: modelTargetedWorkoutCount,
  });
  const targetedWorkoutCount = deriveReviewTargetedWorkoutCount(
    modelTargetedWorkoutCount,
    runnerFacing.proposedChanges,
    totalRemainingWorkoutCount,
  );
  const scope = {
    scope: "remaining_active_schedule_only" as const,
    startDate: context.refreshBoundary.firstMutableDate,
    endDate: context.refreshBoundary.lastMutableDate,
    totalRemainingWorkoutCount,
    targetedWorkoutCount,
  };

  return {
    proposalStatus: "proposal_only",
    applyContext: {
      generatedAt: context.generatedAt,
      fingerprint: buildActivePlanRefreshFingerprint(context),
    },
    summary: runnerFacing.summary,
    rationale: runnerFacing.rationale,
    proposedChanges: runnerFacing.proposedChanges,
    keepAsIs: runnerFacing.keepAsIs,
    remainingScheduleScope: scope,
    review: {
      ...runnerFacing,
      scope: {
        ...scope,
        label: buildScopeLabel(context, totalRemainingWorkoutCount, targetedWorkoutCount),
      },
      cautionContext: buildCautionReviewContext(context),
      boundaryNote:
        "This is a proposal only. Past and logged workouts stay fixed, and the active plan has not changed.",
    },
    safety: {
      requiresExplicitApply: true,
      preservesPastAndLoggedHistory: true,
      doesNotMutatePlan: true,
    },
    recommendedAuthoringPrompt: proposal.recommendedAuthoringPrompt,
  };
}

export function buildActivePlanRefreshFingerprint(
  context: RunnerCoachContext,
): ActivePlanRefreshFingerprint {
  if (!context.activePlan) {
    throw new Error("An active plan is required before fingerprinting a refresh proposal.");
  }

  return {
    schemaVersion: "active-plan-refresh-fingerprint-v1",
    today: context.today,
    activePlanId: context.activePlan.id,
    activePlanUpdatedAt: context.activePlan.updatedAt,
    firstMutableDate: context.refreshBoundary.firstMutableDate,
    lastMutableDate: context.refreshBoundary.lastMutableDate,
    weekdayRestInvariantSignature: weekdayRestInvariantToSignature(context.weekdayRestInvariant),
    remainingScheduleSignature: context.remainingActiveSchedule.map((workout) =>
      [
        workout.id,
        workout.date,
        workout.title,
        workout.workoutType,
        workout.plannedDurationMin,
        workout.plannedDistanceKm ?? "",
        workout.stepCount,
      ].join("|"),
    ),
    recentHistorySignature: context.recentWorkoutHistory.map((workout) =>
      [
        workout.id,
        workout.date,
        workout.outcome,
        workout.actualDurationMin ?? "",
        workout.actualDistanceKm ?? "",
        workout.rpe ?? "",
        workout.hasBodyNotes ? "body_notes" : "",
        workout.hasGarminActual ? "garmin" : "",
        workout.logUpdatedAt ?? "",
      ].join("|"),
    ),
  };
}

function applyRefreshProposalTextQualityGate(
  context: RunnerCoachContext,
  proposal: RefreshProposalOutput,
  scopeCounts: { totalRemainingWorkoutCount: number; targetedWorkoutCount: number },
) {
  const summary =
    sanitizeRunnerFacingProposalText(proposal.summary, 20, 320) ??
    fallbackProposalSummary(scopeCounts.totalRemainingWorkoutCount);
  const rationale = sanitizeRunnerFacingProposalList(proposal.rationale, 1, 5, [
    fallbackProposalRationale(context),
  ]);
  const proposedChanges = sanitizeRunnerFacingProposalList(proposal.proposedChanges, 1, 8, [
    fallbackProposedChange(scopeCounts.targetedWorkoutCount),
  ]);
  const keepAsIs = buildFixedTruthReviewItems(context, proposal.keepAsIs);

  return {
    summary,
    rationale,
    proposedChanges,
    keepAsIs,
  };
}

function sanitizeRunnerFacingProposalList(
  values: string[],
  minItems: number,
  maxItems: number,
  fallback: string[],
) {
  const sanitized = values
    .map((value) => sanitizeRunnerFacingProposalText(value, 10, 220))
    .filter((value): value is string => Boolean(value))
    .slice(0, maxItems);

  if (sanitized.length >= minItems) {
    return sanitized;
  }

  return fallback.slice(0, Math.max(minItems, 1));
}

function buildFixedTruthReviewItems(context: RunnerCoachContext, values: string[]) {
  const sanitized = values
    .map((value) => sanitizeRunnerFacingProposalText(value, 10, 220))
    .filter((value): value is string => Boolean(value));
  const weekdayRestItem = context.weekdayRestInvariant.blockedWeekdays.length
    ? [
        `Fixed rest days stay off: ${formatWeekdayList(
          context.weekdayRestInvariant.blockedWeekdays,
        )}.`,
      ]
    : [];

  return uniqueRunnerFacingItems([
    ...FIXED_TRUTH_REVIEW_ITEMS,
    ...weekdayRestItem,
    ...sanitized,
  ]).slice(0, 6);
}

function uniqueRunnerFacingItems(values: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(value);
  }

  return unique;
}

function deriveReviewTargetedWorkoutCount(
  modelTargetedWorkoutCount: number,
  proposedChanges: string[],
  totalRemainingWorkoutCount: number,
) {
  return Math.min(
    totalRemainingWorkoutCount,
    Math.max(modelTargetedWorkoutCount, proposedChanges.length),
  );
}

function sanitizeRunnerFacingProposalText(text: string, minLength: number, maxLength: number) {
  const normalized = text
    .normalize("NFKC")
    .replace(/\bHR\b/g, "heart rate")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized || containsUnsupportedCharacters(normalized)) {
    return null;
  }

  const withTerminalPunctuation = /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;

  if (!isCompleteRunnerSentence(withTerminalPunctuation)) {
    return null;
  }

  if (
    withTerminalPunctuation.length < minLength ||
    withTerminalPunctuation.length > maxLength ||
    containsInternalImplementationText(withTerminalPunctuation)
  ) {
    return null;
  }

  return withTerminalPunctuation;
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

  return /[A-Za-z0-9][.!?]$/.test(text);
}

function hasDanglingTrailingClause(text: string) {
  return /(?:^|[\s,;:])(?:and|or|but|because|while|although|though|when|with|without|for|to|keep|heart rate)\s*[.!?]$/i.test(
    text,
  );
}

function containsInternalImplementationText(text: string) {
  return (
    /\b(?:plannedDurationMin|plannedDistanceKm|targetWorkoutIds|targetWorkoutRefs|workoutId|workoutIds|sourceWorkoutType|remainingScheduleScope)\b/.test(
      text,
    ) || /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(text)
  );
}

function fallbackProposalSummary(totalRemainingWorkoutCount: number) {
  return `This proposal reviews the ${totalRemainingWorkoutCount} remaining workouts and keeps the plan refresh focused on the future schedule.`;
}

function fallbackProposalRationale(context: RunnerCoachContext) {
  const skippedOrPartial =
    context.recentAdherence.skippedCount + context.recentAdherence.partialCount;

  if (skippedOrPartial > 0) {
    return "Recent missed or partial workouts were included, so the proposal stays conservative.";
  }

  return "Recent saved training history was included, so the proposal stays grounded in the current plan.";
}

function fallbackProposedChange(targetedWorkoutCount: number) {
  if (targetedWorkoutCount > 0) {
    return `Review ${targetedWorkoutCount} highlighted upcoming workouts while keeping the rest of the plan steady.`;
  }

  return "Make any refresh conservative and limited to the upcoming schedule.";
}

function buildScopeLabel(
  context: RunnerCoachContext,
  totalRemainingWorkoutCount: number,
  targetedWorkoutCount: number,
) {
  const dateRange =
    context.refreshBoundary.firstMutableDate && context.refreshBoundary.lastMutableDate
      ? `${context.refreshBoundary.firstMutableDate} to ${context.refreshBoundary.lastMutableDate}`
      : "the remaining active schedule";

  return `Review covers ${totalRemainingWorkoutCount} remaining workouts from ${dateRange}; the proposal calls out ${targetedWorkoutCount} targeted workout${targetedWorkoutCount === 1 ? "" : "s"}.`;
}

function buildCautionReviewContext(context: RunnerCoachContext) {
  const bodyNoteCautions = context.bodyNoteCautions.slice(0, 3).map((caution) => ({
    date: caution.date,
    title: caution.title,
    maxSeverity: caution.maxSeverity,
  }));

  if (!bodyNoteCautions.length) {
    return {
      included: false,
      note: "No recent workout body-note cautions were included in this proposal.",
      bodyNoteCautions,
    };
  }

  return {
    included: true,
    note: "Recent workout body notes were included only as caution context.",
    bodyNoteCautions,
  };
}

function workoutRefForIndex(index: number) {
  return `remaining-${index + 1}`;
}

function humanizeWorkoutType(value: string) {
  return value.replaceAll("_", " ");
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

const activePlanRefreshOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "proposalStatus",
    "summary",
    "rationale",
    "proposedChanges",
    "keepAsIs",
    "remainingScheduleScope",
    "safety",
    "recommendedAuthoringPrompt",
  ],
  properties: {
    proposalStatus: { type: "string", enum: ["proposal_only"] },
    summary: { type: "string", minLength: 20, maxLength: 400 },
    rationale: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string", minLength: 10, maxLength: 220 },
    },
    proposedChanges: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string", minLength: 10, maxLength: 220 },
    },
    keepAsIs: {
      type: "array",
      maxItems: 6,
      items: { type: "string", minLength: 10, maxLength: 220 },
    },
    remainingScheduleScope: {
      type: "object",
      additionalProperties: false,
      required: ["scope", "startDate", "endDate", "targetWorkoutRefs"],
      properties: {
        scope: { type: "string", enum: ["remaining_active_schedule_only"] },
        startDate: {
          anyOf: [{ type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, { type: "null" }],
        },
        endDate: {
          anyOf: [{ type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, { type: "null" }],
        },
        targetWorkoutRefs: {
          type: "array",
          maxItems: 80,
          items: { type: "string", minLength: 1 },
        },
      },
    },
    safety: {
      type: "object",
      additionalProperties: false,
      required: ["requiresExplicitApply", "preservesPastAndLoggedHistory", "doesNotMutatePlan"],
      properties: {
        requiresExplicitApply: { type: "boolean", const: true },
        preservesPastAndLoggedHistory: { type: "boolean", const: true },
        doesNotMutatePlan: { type: "boolean", const: true },
      },
    },
    recommendedAuthoringPrompt: { type: "string", minLength: 20, maxLength: 1600 },
  },
} as const;

interface OpenAiResponseEnvelope {
  id?: string | null;
  output_text?: string;
  error?: {
    message?: string;
  };
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
}
