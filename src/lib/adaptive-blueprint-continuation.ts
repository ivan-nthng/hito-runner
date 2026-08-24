import type { AiAuthoredBlueprintSummary } from "@/lib/ai-authored-plan-first-compiler";
import type {
  AdaptiveContinuationHorizonCheckIn,
  AdaptiveProjectionSchedulingPreference,
  BlueprintCalendarProjectionStatus,
} from "@/lib/adaptive-blueprint-product-contract";
import type { ContinuationDecisionResultV1 } from "@/lib/adaptive-training-decision";
import type {
  ContinuationCalendarOccupancyPacket,
  ContinuationCalendarOutcomePacket,
} from "@/lib/runner-calendar-persistence";
import type { RunnerTrainingPreferencesStorage } from "@/lib/runner-training-preferences";
import { addDaysIso, diffDaysIso, startOfWeekIso, weekdayLong } from "@/lib/training";
import type { ContinuationEvidencePacket } from "@/lib/workout-result-import/types";
import { normalizeWorkoutDocument, type WorkoutDocument } from "@/lib/workout-document";

export type AdaptiveContinuationBlockMode =
  | "normal_four_week"
  | "target_taper_boundary"
  | "resolved_interruption_bridge";

export type AdaptiveContinuationMissingReason =
  | "horizon_check_in_missing"
  | "horizon_check_in_superseded"
  | "goal_assumption_not_current"
  | "availability_not_confirmed"
  | "health_limitation_requires_review"
  | "interruption_not_resolved"
  | "clinician_guidance_requires_review"
  | "minimum_factual_window_not_closed"
  | "calendar_outcome_unresolved"
  | "factual_packet_mismatch"
  | "target_boundary_requires_review"
  | "blueprint_projection_interval_empty";

export type AdaptiveContinuationPreferenceConflictReason =
  | "projection_outside_candidate_interval"
  | "no_available_date_within_candidate_interval";

export interface AdaptiveContinuationPreferenceApplication {
  preferenceId: string;
  preference: AdaptiveProjectionSchedulingPreference;
  outcome: "applied" | "not_applied";
  conflictReason: AdaptiveContinuationPreferenceConflictReason | null;
}

export interface AdaptiveContinuationWindow {
  nextBlockStartDate: string;
  intervalStartDate: string;
  intervalEndDate: string;
  evidenceCutoffDate: string;
  readinessOpensDate: string;
  reviewDeadlineDate: string;
  mode: AdaptiveContinuationBlockMode;
}

export interface AdaptiveContinuationCandidateDraft {
  intervalStartDate: string;
  intervalEndDate: string;
  candidateContent: {
    contractVersion: "adaptive_detailed_block_review_candidate_v1";
    blockMode: AdaptiveContinuationBlockMode;
    interval: { startDate: string; endDate: string };
    workoutDocuments: WorkoutDocument[];
    factsUsed: {
      evidenceCutoffDate: string;
      calendarOutcomeFingerprint: string;
      evidenceRevisionFingerprint: string;
      targetIntervalOccupancyFingerprint: string;
    };
    factsMissing: string[];
    conflicts: AdaptiveContinuationCandidateConflict[];
    preferenceApplications: AdaptiveContinuationPreferenceApplication[];
    performanceAdaptation: {
      applied: boolean;
      mode: "blueprint_faithful" | "constraint_only" | "fact_shaped";
      comparableContextKeys: string[];
      reason:
        | "blueprint_faithful_no_performance_inference"
        | "constraint_only_no_performance_inference"
        | "fact_shaped_from_comparable_fit_and_rpe";
    };
    bridgeExceptionUsed: boolean;
  };
  inputSnapshot: {
    contractVersion: "adaptive_continuation_frozen_input_v1";
    blueprint: { id: string; version: number; sha256: string };
    confirmation: {
      id: string;
      blockMode: string;
      intervalStartDate: string;
      intervalEndDate: string;
      candidateId: string;
      candidateVersion: number;
      candidateSha256: string;
    };
    continuationInput: {
      id: string;
      revision: number;
      sha256: string;
      horizonCheckIn: AdaptiveContinuationHorizonCheckIn;
      activeProjectionPreferences: AdaptiveProjectionSchedulingPreference[];
    };
    normalizedProfileConstraints: {
      sha256: string;
      trainingPreferences: RunnerTrainingPreferencesStorage;
    };
    calendar: Omit<ContinuationCalendarOutcomePacket, "asOf">;
    evidence: Omit<ContinuationEvidencePacket, "asOf">;
    targetIntervalOccupancy: ContinuationCalendarOccupancyPacket;
    decision: ContinuationDecisionResultV1;
    decisionSha256: string;
    authoringBriefSha256: string;
  };
  inputProvenance: {
    kind: "adaptive_continuation_provider_authoring";
    contractVersion: "adaptive_continuation_authoring_brief_v2";
    decisionContractVersion: "continuation_decision_input_v1";
    decisionPolicyVersion: "continuation_decision_policy_v1";
    compilerVersion: `adaptive_continuation_compiler_v${number}`;
    retainedResponseId: string;
    retainedResponseSha256: string;
  };
  factReferences: Array<{ kind: string; sha256: string }>;
  confirmationLineage: {
    kind: "continuation_detailed_block_candidate";
    state: "unconfirmed";
    predecessorCandidateId: string;
    predecessorConfirmationId: string;
    blockMode: AdaptiveContinuationBlockMode;
    bridgeExceptionUsed: boolean;
  };
}

export type AdaptiveContinuationCandidateConflict = {
  code:
    | "target_date_occupied"
    | "global_fixed_rest_day_conflict"
    | "preferred_long_run_day_conflict"
    | "weekly_capacity_conflict";
  projectionId: string;
  date: string;
  message: string;
};

export function parseAdaptiveContinuationCandidateContent(
  value: unknown,
): AdaptiveContinuationCandidateDraft["candidateContent"] | null {
  const record = asRecord(value);
  const interval = asRecord(record?.interval);
  const factsUsed = asRecord(record?.factsUsed);
  const performanceAdaptation = asRecord(record?.performanceAdaptation);
  if (
    record?.contractVersion !== "adaptive_detailed_block_review_candidate_v1" ||
    !isOneOf(record.blockMode, [
      "normal_four_week",
      "target_taper_boundary",
      "resolved_interruption_bridge",
    ] as const) ||
    typeof interval?.startDate !== "string" ||
    typeof interval.endDate !== "string" ||
    !Array.isArray(record.workoutDocuments) ||
    typeof factsUsed?.evidenceCutoffDate !== "string" ||
    typeof factsUsed.calendarOutcomeFingerprint !== "string" ||
    typeof factsUsed.evidenceRevisionFingerprint !== "string" ||
    typeof factsUsed.targetIntervalOccupancyFingerprint !== "string" ||
    !isStringArray(record.factsMissing) ||
    !Array.isArray(record.conflicts) ||
    !Array.isArray(record.preferenceApplications) ||
    typeof performanceAdaptation?.applied !== "boolean" ||
    !isOneOf(performanceAdaptation.mode, [
      "blueprint_faithful",
      "constraint_only",
      "fact_shaped",
    ] as const) ||
    !isStringArray(performanceAdaptation.comparableContextKeys) ||
    !isOneOf(performanceAdaptation.reason, [
      "blueprint_faithful_no_performance_inference",
      "constraint_only_no_performance_inference",
      "fact_shaped_from_comparable_fit_and_rpe",
    ] as const) ||
    typeof record.bridgeExceptionUsed !== "boolean"
  ) {
    return null;
  }
  const workoutDocuments = record.workoutDocuments.map((document) =>
    normalizeWorkoutDocument(document),
  );
  const conflicts = record.conflicts.map(parseCandidateConflict);
  const preferenceApplications = record.preferenceApplications.map(parsePreferenceApplication);
  if (
    workoutDocuments.some((document) => !document.ok) ||
    conflicts.some((conflict) => conflict === null) ||
    preferenceApplications.some((application) => application === null)
  ) {
    return null;
  }
  return {
    contractVersion: "adaptive_detailed_block_review_candidate_v1",
    blockMode: record.blockMode,
    interval: { startDate: interval.startDate, endDate: interval.endDate },
    workoutDocuments: workoutDocuments.map((document) => {
      if (!document.ok) throw new Error(document.message);
      return document.value;
    }),
    factsUsed: {
      evidenceCutoffDate: factsUsed.evidenceCutoffDate,
      calendarOutcomeFingerprint: factsUsed.calendarOutcomeFingerprint,
      evidenceRevisionFingerprint: factsUsed.evidenceRevisionFingerprint,
      targetIntervalOccupancyFingerprint: factsUsed.targetIntervalOccupancyFingerprint,
    },
    factsMissing: [...record.factsMissing],
    conflicts: conflicts.flatMap((conflict) => (conflict ? [conflict] : [])),
    preferenceApplications: preferenceApplications.flatMap((application) =>
      application ? [application] : [],
    ),
    performanceAdaptation: {
      applied: performanceAdaptation.applied,
      mode: performanceAdaptation.mode,
      comparableContextKeys: [...performanceAdaptation.comparableContextKeys],
      reason: performanceAdaptation.reason,
    },
    bridgeExceptionUsed: record.bridgeExceptionUsed,
  };
}

function parseCandidateConflict(value: unknown): AdaptiveContinuationCandidateConflict | null {
  const record = asRecord(value);
  if (
    !record ||
    !isOneOf(record.code, [
      "target_date_occupied",
      "global_fixed_rest_day_conflict",
      "preferred_long_run_day_conflict",
      "weekly_capacity_conflict",
    ] as const) ||
    typeof record.projectionId !== "string" ||
    typeof record.date !== "string" ||
    typeof record.message !== "string"
  ) {
    return null;
  }
  return {
    code: record.code,
    projectionId: record.projectionId,
    date: record.date,
    message: record.message,
  };
}

function parsePreferenceApplication(
  value: unknown,
): AdaptiveContinuationPreferenceApplication | null {
  const record = asRecord(value);
  const preference = parseProjectionPreference(record?.preference);
  const conflictReason =
    record?.conflictReason === null ||
    isOneOf(record?.conflictReason, [
      "projection_outside_candidate_interval",
      "no_available_date_within_candidate_interval",
    ] as const)
      ? record.conflictReason
      : undefined;
  if (
    typeof record?.preferenceId !== "string" ||
    !preference ||
    !isOneOf(record.outcome, ["applied", "not_applied"] as const) ||
    conflictReason === undefined
  ) {
    return null;
  }
  return {
    preferenceId: record.preferenceId,
    preference,
    outcome: record.outcome,
    conflictReason,
  };
}

function parseProjectionPreference(value: unknown): AdaptiveProjectionSchedulingPreference | null {
  const record = asRecord(value);
  if (
    record?.kind === "avoid_projection_date" &&
    typeof record.projectionId === "string" &&
    typeof record.date === "string"
  ) {
    return {
      kind: record.kind,
      projectionId: record.projectionId,
      date: record.date,
    };
  }
  if (
    record?.kind === "swap_projection_slots" &&
    typeof record.firstProjectionId === "string" &&
    typeof record.secondProjectionId === "string"
  ) {
    return {
      kind: record.kind,
      firstProjectionId: record.firstProjectionId,
      secondProjectionId: record.secondProjectionId,
    };
  }
  return null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export type AdaptiveContinuationPreparation =
  | {
      status: "planned";
      projectionStatus: "planned";
      window: null;
      missingReasons: [];
    }
  | {
      status: "check_in_needed" | "evidence_incomplete";
      projectionStatus: "check_in_needed" | "evidence_incomplete";
      window: AdaptiveContinuationWindow | null;
      missingReasons: AdaptiveContinuationMissingReason[];
    }
  | {
      status: "candidate_ready";
      projectionStatus: "ready_for_review";
      window: AdaptiveContinuationWindow;
      missingReasons: [];
      candidate: AdaptiveContinuationCandidateDraft;
    };

type ConfirmationWindowInput = {
  id: string;
  blockMode: string;
  intervalStartDate: string;
  intervalEndDate: string;
  candidateId: string;
  candidateVersion: number;
  candidateSha256: string;
};

export function resolveAdaptiveContinuationWindow(input: {
  asOfDate: string;
  selectedTargetDate: string;
  confirmation: ConfirmationWindowInput;
  bridgeExceptionUsed: boolean;
  horizonCheckIn: AdaptiveContinuationHorizonCheckIn | null;
}): AdaptiveContinuationPreparation | AdaptiveContinuationWindow {
  const nextBlockStartDate = addDaysIso(input.confirmation.intervalEndDate, 1);
  const currentBridge = input.confirmation.blockMode === "resolved_interruption_bridge";
  const readinessOpensDate = addDaysIso(nextBlockStartDate, currentBridge ? -7 : -14);
  if (input.asOfDate < readinessOpensDate) {
    return { status: "planned", projectionStatus: "planned", window: null, missingReasons: [] };
  }
  const remainingDays = diffDaysIso(input.selectedTargetDate, nextBlockStartDate) + 1;
  if (remainingDays <= 0) {
    return { status: "planned", projectionStatus: "planned", window: null, missingReasons: [] };
  }

  let mode: AdaptiveContinuationBlockMode;
  let intervalEndDate: string;
  if (remainingDays <= 14) {
    mode = "target_taper_boundary";
    intervalEndDate = input.selectedTargetDate;
  } else if (
    input.horizonCheckIn?.interruptionStatus === "resolved" &&
    !input.bridgeExceptionUsed
  ) {
    mode = "resolved_interruption_bridge";
    intervalEndDate = addDaysIso(nextBlockStartDate, 13);
  } else if (remainingDays >= 28) {
    mode = "normal_four_week";
    intervalEndDate = addDaysIso(nextBlockStartDate, 27);
  } else {
    return {
      status: "evidence_incomplete",
      projectionStatus: "evidence_incomplete",
      window: null,
      missingReasons: ["target_boundary_requires_review"],
    };
  }
  return {
    nextBlockStartDate,
    intervalStartDate: nextBlockStartDate,
    intervalEndDate,
    evidenceCutoffDate: addDaysIso(input.confirmation.intervalStartDate, currentBridge ? 6 : 13),
    readinessOpensDate,
    reviewDeadlineDate: addDaysIso(nextBlockStartDate, -7),
    mode,
  };
}

export function parseAdaptiveContinuationHorizonCheckIn(
  value: unknown,
): AdaptiveContinuationHorizonCheckIn | null {
  if (value == null) return null;
  const record = asRecord(value);
  if (!record || Object.keys(record).length !== 8) {
    throw new Error("The adaptive horizon check-in is invalid.");
  }
  const materialChangeReason =
    record.materialChangeReason === null
      ? null
      : typeof record.materialChangeReason === "string" && record.materialChangeReason.length <= 500
        ? record.materialChangeReason
        : undefined;
  if (
    typeof record.confirmationId !== "string" ||
    typeof record.goalAssumptionCurrent !== "boolean" ||
    typeof record.availabilityConfirmed !== "boolean" ||
    !isOneOf(record.manageability, ["too_much", "manageable", "too_little"] as const) ||
    materialChangeReason === undefined ||
    !isOneOf(record.healthLimitation, ["no", "yes", "unsure"] as const) ||
    !isOneOf(record.interruptionStatus, ["none", "resolved", "unresolved"] as const) ||
    !isOneOf(record.clinicianGuidance, [
      "not_applicable",
      "permits_running",
      "restricts_running",
      "unclear",
    ] as const)
  ) {
    throw new Error("The adaptive horizon check-in is invalid.");
  }
  return {
    confirmationId: record.confirmationId,
    goalAssumptionCurrent: record.goalAssumptionCurrent,
    availabilityConfirmed: record.availabilityConfirmed,
    manageability: record.manageability,
    materialChangeReason,
    healthLimitation: record.healthLimitation,
    interruptionStatus: record.interruptionStatus,
    clinicianGuidance: record.clinicianGuidance,
  };
}

export function projectionStatusForPreparation(
  preparation: AdaptiveContinuationPreparation,
): BlueprintCalendarProjectionStatus {
  return preparation.projectionStatus;
}

export function resolveAdaptiveContinuationProjectionPreferences(input: {
  projections: AiAuthoredBlueprintSummary["projections"];
  preferences: readonly AdaptiveProjectionSchedulingPreference[];
  revisionId: string;
  intervalStartDate: string;
  intervalEndDate: string;
  occupiedDates: ReadonlySet<string>;
  trainingPreferences: RunnerTrainingPreferencesStorage;
}) {
  const assignedDates = new Map(
    input.projections.map((projection) => [projection.projection_id, projection.date]),
  );
  const outcomes: AdaptiveContinuationPreferenceApplication[] = [];
  for (const [index, preference] of input.preferences.entries()) {
    const preferenceId = `${input.revisionId}:${index}`;
    if (preference.kind === "swap_projection_slots") {
      const firstDate = assignedDates.get(preference.firstProjectionId);
      const secondDate = assignedDates.get(preference.secondProjectionId);
      if (!firstDate || !secondDate) {
        outcomes.push({
          preferenceId,
          preference: { ...preference },
          outcome: "not_applied",
          conflictReason: "projection_outside_candidate_interval",
        });
      } else {
        assignedDates.set(preference.firstProjectionId, secondDate);
        assignedDates.set(preference.secondProjectionId, firstDate);
        outcomes.push({
          preferenceId,
          preference: { ...preference },
          outcome: "applied",
          conflictReason: null,
        });
      }
      continue;
    }
    const currentDate = assignedDates.get(preference.projectionId);
    if (!currentDate) {
      outcomes.push({
        preferenceId,
        preference: { ...preference },
        outcome: "not_applied",
        conflictReason: "projection_outside_candidate_interval",
      });
      continue;
    }
    if (currentDate !== preference.date) {
      outcomes.push({
        preferenceId,
        preference: { ...preference },
        outcome: "applied",
        conflictReason: null,
      });
      continue;
    }
    const alternative = findAlternativeDate({
      currentProjectionId: preference.projectionId,
      currentDate,
      intervalStartDate: input.intervalStartDate,
      intervalEndDate: input.intervalEndDate,
      assignedDates,
      occupiedDates: input.occupiedDates,
      trainingPreferences: input.trainingPreferences,
    });
    if (!alternative) {
      outcomes.push({
        preferenceId,
        preference: { ...preference },
        outcome: "not_applied",
        conflictReason: "no_available_date_within_candidate_interval",
      });
    } else {
      assignedDates.set(preference.projectionId, alternative);
      outcomes.push({
        preferenceId,
        preference: { ...preference },
        outcome: "applied",
        conflictReason: null,
      });
    }
  }
  return { assignedDates, outcomes };
}

export function buildAdaptiveContinuationCandidateConflicts(input: {
  projections: AiAuthoredBlueprintSummary["projections"];
  assignedDates: ReadonlyMap<string, string>;
  occupiedDates: ReadonlySet<string>;
  trainingPreferences: RunnerTrainingPreferencesStorage;
}): AdaptiveContinuationCandidateConflict[] {
  const conflicts: AdaptiveContinuationCandidateConflict[] = [];
  const weekCounts = new Map<string, number>();
  for (const projection of input.projections) {
    const date = input.assignedDates.get(projection.projection_id) ?? projection.date;
    const week = startOfWeekIso(date);
    weekCounts.set(week, (weekCounts.get(week) ?? 0) + 1);
    if (input.occupiedDates.has(date)) {
      conflicts.push({
        code: "target_date_occupied",
        projectionId: projection.projection_id,
        date,
        message: "A runner-owned Calendar workout already occupies this candidate date.",
      });
    }
    if (input.trainingPreferences.blocked_days.some((weekday) => weekday === weekdayLong(date))) {
      conflicts.push({
        code: "global_fixed_rest_day_conflict",
        projectionId: projection.projection_id,
        date,
        message: "This Blueprint slot falls on a current fixed rest weekday.",
      });
    }
    if (
      projection.cadence_or_workout_family === "long" &&
      input.trainingPreferences.preferred_long_run_day &&
      weekdayLong(date) !== input.trainingPreferences.preferred_long_run_day
    ) {
      conflicts.push({
        code: "preferred_long_run_day_conflict",
        projectionId: projection.projection_id,
        date,
        message: `This long-run slot is not on preferred weekday ${input.trainingPreferences.preferred_long_run_day}.`,
      });
    }
  }
  if (input.trainingPreferences.max_running_days_per_week != null) {
    for (const projection of input.projections) {
      const date = input.assignedDates.get(projection.projection_id) ?? projection.date;
      if (
        (weekCounts.get(startOfWeekIso(date)) ?? 0) >
        input.trainingPreferences.max_running_days_per_week
      ) {
        conflicts.push({
          code: "weekly_capacity_conflict",
          projectionId: projection.projection_id,
          date,
          message: "This candidate week exceeds the current recurring weekly capacity.",
        });
      }
    }
  }
  return conflicts;
}

function findAlternativeDate(input: {
  currentProjectionId: string;
  currentDate: string;
  intervalStartDate: string;
  intervalEndDate: string;
  assignedDates: ReadonlyMap<string, string>;
  occupiedDates: ReadonlySet<string>;
  trainingPreferences: RunnerTrainingPreferencesStorage;
}) {
  const usedDates = new Set(
    [...input.assignedDates.entries()].flatMap(([projectionId, date]) =>
      projectionId === input.currentProjectionId ? [] : [date],
    ),
  );
  const candidates: string[] = [];
  for (
    let date = input.intervalStartDate;
    date <= input.intervalEndDate;
    date = addDaysIso(date, 1)
  ) {
    if (
      date !== input.currentDate &&
      !usedDates.has(date) &&
      !input.occupiedDates.has(date) &&
      !input.trainingPreferences.blocked_days.some((weekday) => weekday === weekdayLong(date)) &&
      withinWeeklyCapacity({
        date,
        assignedDates: input.assignedDates,
        excludedProjectionId: input.currentProjectionId,
        maxRunningDaysPerWeek: input.trainingPreferences.max_running_days_per_week,
      })
    ) {
      candidates.push(date);
    }
  }
  return (
    candidates.sort(
      (left, right) =>
        Math.abs(diffDaysIso(left, input.currentDate)) -
          Math.abs(diffDaysIso(right, input.currentDate)) || left.localeCompare(right),
    )[0] ?? null
  );
}

function withinWeeklyCapacity(input: {
  date: string;
  assignedDates: ReadonlyMap<string, string>;
  excludedProjectionId: string;
  maxRunningDaysPerWeek: number | null;
}) {
  if (input.maxRunningDaysPerWeek == null) return true;
  const week = startOfWeekIso(input.date);
  const count = [...input.assignedDates.entries()].filter(
    ([projectionId, date]) =>
      projectionId !== input.excludedProjectionId && startOfWeekIso(date) === week,
  ).length;
  return count < input.maxRunningDaysPerWeek;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isOneOf<const T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === "string" && values.includes(value);
}
