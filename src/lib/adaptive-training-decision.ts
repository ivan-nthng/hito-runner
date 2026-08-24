import type { RunnerFitnessProfileContinuationProjectionV1 } from "@/lib/runner-activity/product-contract";

export const CONTINUATION_DECISION_CONTRACT_VERSION = "continuation_decision_input_v1" as const;
export const CONTINUATION_DECISION_POLICY_VERSION = "continuation_decision_policy_v1" as const;

export type ContinuationDecisionBlockModeV1 =
  | "normal_four_week"
  | "target_taper_boundary"
  | "resolved_interruption_bridge";

export type ContinuationDecisionMissingReasonV1 =
  | "check_in_missing"
  | "check_in_stale"
  | "goal_changed"
  | "availability_unconfirmed"
  | "health_review_required"
  | "interruption_unresolved"
  | "clinician_review_required"
  | "readiness_window_not_open"
  | "factual_window_not_closed"
  | "projection_interval_empty"
  | "calendar_outcome_unresolved"
  | "factual_packet_mismatch";

export interface ContinuationDecisionInputV1 {
  version: typeof CONTINUATION_DECISION_CONTRACT_VERSION;
  policyVersion: typeof CONTINUATION_DECISION_POLICY_VERSION;
  asOfDate: string;
  blueprint: {
    id: string;
    version: number;
    sha256: string;
    selectedTargetDate: string;
  };
  predecessorConfirmation: {
    id: string;
    intervalEndDate: string;
  };
  window: {
    intervalStartDate: string;
    intervalEndDate: string;
    evidenceCutoffDate: string;
    readinessOpensDate: string;
    mode: ContinuationDecisionBlockModeV1;
  } | null;
  continuationInput: {
    id: string;
    revision: number;
    sha256: string;
    confirmationId: string;
    goalAssumptionCurrent: boolean;
    availabilityConfirmed: boolean;
    manageability: "too_much" | "manageable" | "too_little";
    healthLimitation: "no" | "yes" | "unsure";
    interruptionStatus: "none" | "resolved" | "unresolved";
    clinicianGuidance: "not_applicable" | "permits_running" | "restricts_running" | "unclear";
    activePreferenceCount: number;
  } | null;
  projections: Array<{
    projectionId: string;
    date: string;
    phase: string;
    workoutFamily: string;
    targetAssumption: string;
    reviewTiming: string;
  }>;
  facts: {
    profileConstraintsFingerprint: string;
    calendarOutcomeFingerprint: string;
    evidenceRevisionFingerprint: string;
    targetIntervalOccupancyFingerprint: string;
    unresolvedCalendarOutcomeCount: number;
    fitnessProfile: RunnerFitnessProfileContinuationProjectionV1;
  };
}

export type ContinuationDecisionResultV1 =
  | {
      version: "continuation_decision_result_v1";
      policyVersion: typeof CONTINUATION_DECISION_POLICY_VERSION;
      status: "no_prescription";
      reasons: ContinuationDecisionMissingReasonV1[];
      fitnessProfile: RunnerFitnessProfileContinuationProjectionV1;
    }
  | {
      version: "continuation_decision_result_v1";
      policyVersion: typeof CONTINUATION_DECISION_POLICY_VERSION;
      status: "authoring_ready";
      authoringMode: "blueprint_faithful" | "constraint_only" | "fact_shaped";
      interval: {
        startDate: string;
        endDate: string;
        blockMode: ContinuationDecisionBlockModeV1;
      };
      projectionIds: string[];
      comparableContextKeys: string[];
      fitnessProfile: RunnerFitnessProfileContinuationProjectionV1;
    };

export function decideAdaptiveContinuation(
  input: ContinuationDecisionInputV1,
): ContinuationDecisionResultV1 {
  const reasons: ContinuationDecisionMissingReasonV1[] = [];
  const continuationInput = input.continuationInput;

  if (!continuationInput) {
    reasons.push("check_in_missing");
  } else {
    if (continuationInput.confirmationId !== input.predecessorConfirmation.id) {
      reasons.push("check_in_stale");
    }
    if (!continuationInput.goalAssumptionCurrent) reasons.push("goal_changed");
    if (!continuationInput.availabilityConfirmed) reasons.push("availability_unconfirmed");
    if (continuationInput.healthLimitation !== "no") reasons.push("health_review_required");
    if (continuationInput.interruptionStatus === "unresolved") {
      reasons.push("interruption_unresolved");
    }
    if (
      continuationInput.clinicianGuidance === "restricts_running" ||
      continuationInput.clinicianGuidance === "unclear"
    ) {
      reasons.push("clinician_review_required");
    }
  }

  if (!input.window || input.asOfDate < input.window.readinessOpensDate) {
    reasons.push("readiness_window_not_open");
  }
  if (input.window && input.asOfDate < input.window.evidenceCutoffDate) {
    reasons.push("factual_window_not_closed");
  }
  if (input.projections.length === 0) reasons.push("projection_interval_empty");
  if (input.facts.unresolvedCalendarOutcomeCount > 0) {
    reasons.push("calendar_outcome_unresolved");
  }
  if (
    !isSha256(input.facts.profileConstraintsFingerprint) ||
    !isSha256(input.facts.calendarOutcomeFingerprint) ||
    !isSha256(input.facts.evidenceRevisionFingerprint) ||
    !isSha256(input.facts.targetIntervalOccupancyFingerprint)
  ) {
    reasons.push("factual_packet_mismatch");
  }

  const uniqueReasons = Array.from(new Set(reasons));
  if (uniqueReasons.length > 0 || !input.window || !continuationInput) {
    return {
      version: "continuation_decision_result_v1",
      policyVersion: CONTINUATION_DECISION_POLICY_VERSION,
      status: "no_prescription",
      reasons: uniqueReasons,
      fitnessProfile: input.facts.fitnessProfile,
    };
  }

  const comparableContextKeys = input.facts.fitnessProfile.comparableGroups
    .filter((group) => group.acceptedActualDays.length >= 2 && group.compatibleRpeDays.length >= 2)
    .map((group) => group.contextKey)
    .sort();
  const constraintOnly =
    continuationInput.activePreferenceCount > 0 || continuationInput.manageability !== "manageable";

  return {
    version: "continuation_decision_result_v1",
    policyVersion: CONTINUATION_DECISION_POLICY_VERSION,
    status: "authoring_ready",
    authoringMode:
      comparableContextKeys.length > 0
        ? "fact_shaped"
        : constraintOnly
          ? "constraint_only"
          : "blueprint_faithful",
    interval: {
      startDate: input.window.intervalStartDate,
      endDate: input.window.intervalEndDate,
      blockMode: input.window.mode,
    },
    projectionIds: input.projections.map((projection) => projection.projectionId),
    comparableContextKeys,
    fitnessProfile: input.facts.fitnessProfile,
  };
}

function isSha256(value: string) {
  return /^[0-9a-f]{64}$/.test(value);
}
