import { type AiFirstPlanBlueprintTraceMetadata } from "@/lib/ai-first-plan-draft-metadata";
import { buildAiFirstPlanBlueprintPrompt } from "@/lib/ai-first-plan-blueprint-prompt";
import type { StructuredAuthoringInput } from "@/lib/ai-first-plan-blueprint-schema";
import { resolveAuthoringHorizonWeeks } from "@/lib/ai-first-plan-blueprint-policy";

export type AiFirstPlanBlueprintHorizonTraceMetadata = {
  requestedHorizonWeeks: number;
  aiAuthoredHorizonWeeks: number;
  backendExtendedWeeks: number;
  promptRequiredSlotCount: number;
  finalRequiredSlotCount: number;
  promptCharEstimateBefore: number | null;
  promptCharEstimateAfter: number | null;
  finalWorkoutCount: number | null;
};

export type AiFirstPlanBlueprintHorizonStrategy = AiFirstPlanBlueprintHorizonTraceMetadata & {
  openAiAuthoringInput: StructuredAuthoringInput;
};

export function resolveAiFirstPlanBlueprintHorizonStrategy({
  authoringInput,
  today,
  referenceExample,
  maxAuthoredWeeks,
}: {
  authoringInput: StructuredAuthoringInput;
  today?: string;
  referenceExample?: unknown;
  maxAuthoredWeeks?: number;
}): AiFirstPlanBlueprintHorizonStrategy {
  const requestedHorizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const authoredWeeksLimit = maxAuthoredWeeks ?? requestedHorizonWeeks;
  const boundedAuthoredWeeks = Math.max(1, Math.min(authoredWeeksLimit, requestedHorizonWeeks));
  const fullTargetDate = authoringInput.schedule.targetDate ?? null;
  const openAiAuthoringInput =
    boundedAuthoredWeeks === requestedHorizonWeeks
      ? authoringInput
      : {
          ...authoringInput,
          schedule: {
            ...authoringInput.schedule,
            targetDate: null,
            preparationHorizonWeeks: boundedAuthoredWeeks,
          },
          preferences: {
            ...authoringInput.preferences,
            notes: appendBoundedNote(
              authoringInput.preferences.notes,
              fullTargetDate
                ? `Full requested target-date horizon is ${fullTargetDate}; this diagnostic fixture authors only the opening ${boundedAuthoredWeeks}-week window and is not a reviewable full plan.`
                : `This diagnostic fixture authors only the opening ${boundedAuthoredWeeks}-week window and is not a reviewable full plan.`,
            ),
          },
        };

  return {
    openAiAuthoringInput,
    requestedHorizonWeeks,
    aiAuthoredHorizonWeeks: boundedAuthoredWeeks,
    backendExtendedWeeks: Math.max(0, requestedHorizonWeeks - boundedAuthoredWeeks),
    promptRequiredSlotCount: countRequiredRunningSlots(openAiAuthoringInput),
    finalRequiredSlotCount: countRequiredRunningSlots(authoringInput),
    promptCharEstimateBefore: estimateBlueprintPromptChars({
      authoringInput,
      today,
      referenceExample,
    }),
    promptCharEstimateAfter: estimateBlueprintPromptChars({
      authoringInput: openAiAuthoringInput,
      today,
      referenceExample,
    }),
    finalWorkoutCount: null,
  };
}

export function buildAiFirstPlanBlueprintHorizonTrace({
  strategy,
  promptCharEstimateAfter,
  finalWorkoutCount,
}: {
  strategy: AiFirstPlanBlueprintHorizonStrategy | null;
  promptCharEstimateAfter?: number | null;
  finalWorkoutCount?: number | null;
}): AiFirstPlanBlueprintHorizonTraceMetadata | undefined {
  if (!strategy) {
    return undefined;
  }

  return {
    requestedHorizonWeeks: strategy.requestedHorizonWeeks,
    aiAuthoredHorizonWeeks: strategy.aiAuthoredHorizonWeeks,
    backendExtendedWeeks: strategy.backendExtendedWeeks,
    promptRequiredSlotCount: strategy.promptRequiredSlotCount,
    finalRequiredSlotCount: strategy.finalRequiredSlotCount,
    promptCharEstimateBefore: strategy.promptCharEstimateBefore,
    promptCharEstimateAfter: promptCharEstimateAfter ?? strategy.promptCharEstimateAfter,
    finalWorkoutCount: finalWorkoutCount ?? strategy.finalWorkoutCount,
  };
}

function estimateBlueprintPromptChars({
  authoringInput,
  today,
  referenceExample,
}: {
  authoringInput: StructuredAuthoringInput;
  today?: string;
  referenceExample?: unknown;
}) {
  const prompt = buildAiFirstPlanBlueprintPrompt({
    authoringInput,
    today,
    referenceExample,
  });

  return (
    prompt.systemPrompt.length +
    prompt.userPrompt.length +
    JSON.stringify(prompt.responseSchema).length
  );
}

function countRequiredRunningSlots(authoringInput: StructuredAuthoringInput) {
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const runningDayCount = authoringInput.availability.preferredRunningDays.filter(
    (weekday) => !fixedRestDays.has(weekday),
  ).length;

  return runningDayCount * resolveAuthoringHorizonWeeks(authoringInput);
}

function appendBoundedNote(existingNote: string | null | undefined, addition: string) {
  const combined = [existingNote?.trim(), addition].filter(Boolean).join(" ");

  return combined.length > 500 ? `${combined.slice(0, 497)}...` : combined;
}
