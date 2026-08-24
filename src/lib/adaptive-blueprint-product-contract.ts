import type { WorkoutDocument } from "@/lib/workout-document";

export type AdaptiveProjectionSchedulingPreference =
  | {
      kind: "avoid_projection_date";
      projectionId: string;
      date: string;
    }
  | {
      kind: "swap_projection_slots";
      firstProjectionId: string;
      secondProjectionId: string;
    };

export type AdaptiveContinuationManageability = "too_much" | "manageable" | "too_little";
export type AdaptiveContinuationHealthLimitation = "no" | "yes" | "unsure";
export type AdaptiveContinuationInterruptionStatus = "none" | "resolved" | "unresolved";
export type AdaptiveContinuationClinicianGuidance =
  | "not_applicable"
  | "permits_running"
  | "restricts_running"
  | "unclear";

export interface AdaptiveContinuationHorizonCheckIn {
  confirmationId: string;
  goalAssumptionCurrent: boolean;
  availabilityConfirmed: boolean;
  manageability: AdaptiveContinuationManageability;
  materialChangeReason: string | null;
  healthLimitation: AdaptiveContinuationHealthLimitation;
  interruptionStatus: AdaptiveContinuationInterruptionStatus;
  clinicianGuidance: AdaptiveContinuationClinicianGuidance;
}

export interface AdaptiveContinuationInput {
  expectedBlueprint: {
    id: string;
    version: number;
    sha256: string;
  };
  expectedConfirmationId: string;
  activeProjectionPreferences: AdaptiveProjectionSchedulingPreference[];
  horizonCheckIn: AdaptiveContinuationHorizonCheckIn | null;
}

export type BlueprintCalendarProjectionStatus =
  | "planned"
  | "check_in_needed"
  | "evidence_incomplete"
  | "ready_for_review"
  | "awaiting_runner_confirmation";

export interface BlueprintCalendarProjection {
  kind: "blueprint_projection";
  blueprint: {
    id: string;
    version: number;
    sha256: string;
  };
  projectionId: string;
  date: string;
  phase: string;
  phaseCadence: number;
  workoutFamily: string;
  goalAssumption: string;
  reviewTiming: string;
  status: BlueprintCalendarProjectionStatus;
  activePreferenceIds: string[];
  capabilities: {
    canOpenWorkout: false;
    canMutateWorkout: false;
    canAttachResultOrEvidence: false;
    canExpressSchedulingPreference: true;
  };
}

export interface AdaptiveBlueprintCalendarReadModel {
  projections: BlueprintCalendarProjection[];
  continuation: AdaptiveContinuationPublicState;
}

export type AdaptiveContinuationPublicContext = {
  blueprint: { id: string; version: number; sha256: string };
  confirmation: {
    id: string;
    intervalStartDate: string;
    intervalEndDate: string;
  };
  currentInputRevision: {
    id: string;
    revision: number;
    sha256: string;
    checkIn: AdaptiveContinuationHorizonCheckIn | null;
    activePreferences: AdaptiveProjectionSchedulingPreference[];
  } | null;
  dataQuality: {
    dueWorkoutCount: number;
    resolvedOutcomeCount: number;
    fitCurrentCount: number;
    completedWithoutFitCount: number;
    missingCount: number;
    updatingCount: number;
    removedCount: number;
  } | null;
  preferenceApplications: Array<{
    preferenceId: string;
    preference: AdaptiveProjectionSchedulingPreference;
    outcome: "applied" | "not_applied";
    conflictReason: string | null;
  }>;
  capabilities: {
    canSubmitInput: boolean;
    canPrepareCandidate: boolean;
    canReviewCandidate: boolean;
    canConfirmCandidate: boolean;
  };
};

export type AdaptiveContinuationPublicState =
  | {
      status: "no_source";
      window: null;
      reasons: string[];
      candidate: null;
      context: null;
    }
  | {
      status: "planned" | "check_in_needed" | "not_ready" | "authoring_ready";
      window: {
        startDate: string;
        endDate: string;
        blockMode: "normal_four_week" | "target_taper_boundary" | "resolved_interruption_bridge";
      } | null;
      reasons: string[];
      candidate: null;
      context: AdaptiveContinuationPublicContext;
    }
  | {
      status: "candidate_ready";
      window: {
        startDate: string;
        endDate: string;
        blockMode: "normal_four_week" | "target_taper_boundary" | "resolved_interruption_bridge";
      };
      reasons: [];
      candidate: {
        id: string;
        version: number;
        sha256: string;
        sourceResponseBound: true;
        blockMode: "normal_four_week" | "target_taper_boundary" | "resolved_interruption_bridge";
        interval: { startDate: string; endDate: string };
        workoutDocuments: WorkoutDocument[];
        factsUsed: {
          evidenceCutoffDate: string;
          calendarOutcomeFingerprint: string;
          evidenceRevisionFingerprint: string;
          targetIntervalOccupancyFingerprint: string;
        };
        factsMissing: string[];
        conflicts: Array<{
          code:
            | "target_date_occupied"
            | "global_fixed_rest_day_conflict"
            | "preferred_long_run_day_conflict"
            | "weekly_capacity_conflict";
          projectionId: string;
          date: string;
          message: string;
        }>;
        preferenceApplications: AdaptiveContinuationPublicContext["preferenceApplications"];
        performanceAdaptation: {
          applied: boolean;
          mode: "blueprint_faithful" | "constraint_only" | "fact_shaped";
          comparableContextKeys: string[];
          reason:
            | "blueprint_faithful_no_performance_inference"
            | "constraint_only_no_performance_inference"
            | "fact_shaped_from_comparable_fit_and_rpe";
        };
      };
      context: AdaptiveContinuationPublicContext;
    };
