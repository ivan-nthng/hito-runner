import type { TrainingPlanV2 } from "@/lib/imported-plan";

export type AiFirstPlanDraftNormalizationIssue = {
  code: string;
  message: string;
  path?: string;
};

export interface AiFirstPlanBlueprintTraceMetadata {
  sourceKind: string | null;
  sourceStatus:
    | "ai_authored"
    | "repaired_ai_draft"
    | "deterministic_fallback"
    | "blueprint_unavailable";
  fallbackReason: string | null;
  model: string | null;
  timeoutMs: number | null;
  elapsedMs: number | null;
  opsMode?: string | null;
  opsFixture?: string | null;
  requestSummary: {
    goalFamily: string;
    goalType: string;
    goalStyle: string | null;
    goalDistance: string;
    targetTimePresent: boolean;
    targetDate: string | null;
    runningDaysPerWeek: number;
    fixedRestDays: string[];
    preferredLongRunDay: string | null;
  };
  blueprintCompleteness?: {
    expectedWeekCount: number;
    actualWeekCount: number;
    expectedRequiredSlotCount: number;
    actualAuthoredWorkoutCount: number;
    missingWeekNumbers: number[];
    firstMissingRequiredDates: string[];
  };
  blueprintHorizonStrategy?: {
    requestedHorizonWeeks: number;
    aiAuthoredHorizonWeeks: number;
    backendExtendedWeeks: number;
    promptRequiredSlotCount: number;
    finalRequiredSlotCount: number;
    promptCharEstimateBefore: number | null;
    promptCharEstimateAfter: number | null;
    finalWorkoutCount: number | null;
  };
  requiredCadenceSlots: Array<{
    weekNumber: number;
    date: string;
    weekday: string;
    kind: string;
    identityOptions: string[];
    purpose: string;
  }>;
  authoredBlueprintWeeks: Array<{
    weekNumber: number;
    phase: string | null;
    theme: string | null;
    identities: string[];
    families: string[];
    icons: string[];
    dates: string[];
  }>;
  validationIssueCodes: string[];
  validationIssueSummary: string[];
  repairs: string[];
  normalizedCanonicalWeeks: Array<{
    weekNumber: number;
    identities: string[];
    families: string[];
    icons: string[];
  }>;
  deterministicFallbackBoundary: {
    used: boolean;
    reason: string | null;
  };
  finalReviewedPlanIdentityCounts: Record<string, number>;
  finalReviewedPlanFamilyCounts: Record<string, number>;
  finalReviewedPlanIconCounts: Record<string, number>;
  persistedIdentityCounts: Record<string, number> | null;
}

export interface AiFirstPlanDraftMetadata {
  status: "ai_authored" | "repaired_ai_draft" | "expanded_from_envelope" | "deterministic_fallback";
  source:
    | "openai_ai_first_plan_draft"
    | "openai_ai_first_plan_blueprint"
    | "openai_ai_first_plan_envelope"
    | "deterministic_structured_generator";
  validationIssues: string[];
  repairs: string[];
  reviewAssumptions: string[];
  metricPolicySummary: string;
  blueprintTrace?: AiFirstPlanBlueprintTraceMetadata | null;
  envelopeTrace?: unknown;
}

export type AiFirstPlanDraftNormalizationResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      metadata: AiFirstPlanDraftMetadata;
    }
  | {
      ok: false;
      reason: string;
      issues: AiFirstPlanDraftNormalizationIssue[];
      fallback: AiFirstPlanDraftMetadata;
    };
