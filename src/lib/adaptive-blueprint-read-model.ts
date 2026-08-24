import "@tanstack/react-start/server-only";

import type { AiAuthoredBlueprintSummary } from "@/lib/ai-authored-plan-first-compiler";
import {
  ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
  ADAPTIVE_CONTINUATION_COMPILER_VERSION,
} from "@/lib/adaptive-continuation-authoring";
import {
  buildAdaptiveContinuationCandidateConflicts,
  parseAdaptiveContinuationCandidateContent,
  parseAdaptiveContinuationHorizonCheckIn,
  resolveAdaptiveContinuationProjectionPreferences,
  resolveAdaptiveContinuationWindow,
  type AdaptiveContinuationWindow,
} from "@/lib/adaptive-blueprint-continuation";
import { getAdaptiveTrainingContinuationSourceStateForUser } from "@/lib/adaptive-blueprint-persistence";
import type {
  AdaptiveBlueprintCalendarReadModel,
  AdaptiveContinuationPublicContext,
  AdaptiveContinuationPublicState,
  AdaptiveProjectionSchedulingPreference,
  BlueprintCalendarProjection,
} from "@/lib/adaptive-blueprint-product-contract";
import {
  CONTINUATION_DECISION_CONTRACT_VERSION,
  CONTINUATION_DECISION_POLICY_VERSION,
  decideAdaptiveContinuation,
  type ContinuationDecisionInputV1,
} from "@/lib/adaptive-training-decision";
import { stableJsonEqual } from "@/lib/review-token-signing";
import { projectRunnerFitnessProfileForContinuation } from "@/lib/runner-activity/product-contract";
import { getRunnerFitnessProfileSnapshotForUser } from "@/lib/runner-activity/read-model";
import {
  getContinuationCalendarOccupancyPacket,
  getContinuationCalendarOutcomePacket,
} from "@/lib/runner-calendar-persistence";
import type { Json } from "@/lib/supabase/database";
import { getUserSettingsForUserId } from "@/lib/user-settings-actions";
import { getContinuationEvidencePacket } from "@/lib/workout-result-import/read-workout-result-feedback";

export async function getAdaptiveBlueprintCalendarReadModelForUser(
  userId: string,
  asOfDate: string,
): Promise<AdaptiveBlueprintCalendarReadModel> {
  const current = await getAdaptiveBlueprintContinuationDecisionForUser({ userId, asOfDate });
  if (!current) {
    return {
      projections: [],
      continuation: {
        status: "no_source",
        window: null,
        reasons: [],
        candidate: null,
        context: null,
      },
    };
  }
  const activePreferences = readProjectionPreferences(
    current.state.latestInputRevision?.active_projection_preferences ?? [],
  );
  const publicState = buildPublicContinuationState(current);
  const projections = current.blueprint.projections
    .filter((projection) => projection.date > current.state.confirmation.interval_end_date)
    .map((projection) => {
      const phase = current.blueprint.phases.find(
        (candidate) =>
          candidate.phase === projection.phase &&
          projection.date >= candidate.start_date &&
          projection.date <= candidate.end_date,
      );
      if (!phase || !phase.workout_families.includes(projection.cadence_or_workout_family)) {
        throw new Error("A persisted adaptive projection does not match its immutable phase.");
      }
      const inCurrentWindow =
        current.window &&
        projection.date >= current.window.intervalStartDate &&
        projection.date <= current.window.intervalEndDate;
      const status = !inCurrentWindow
        ? "planned"
        : publicState.status === "check_in_needed"
          ? "check_in_needed"
          : publicState.status === "candidate_ready"
            ? "ready_for_review"
            : publicState.status === "authoring_ready"
              ? "evidence_incomplete"
              : publicState.status === "not_ready"
                ? "evidence_incomplete"
                : "planned";
      return {
        kind: "blueprint_projection",
        blueprint: {
          id: current.state.blueprint.id,
          version: current.state.blueprint.version,
          sha256: current.state.blueprint.content_sha256,
        },
        projectionId: projection.projection_id,
        date: projection.date,
        phase: projection.phase,
        phaseCadence: phase.expected_weekly_cadence,
        workoutFamily: projection.cadence_or_workout_family,
        goalAssumption: projection.target_assumption,
        reviewTiming: projection.review_timing,
        status,
        activePreferenceIds: activePreferenceIds({
          revisionId: current.state.latestInputRevision?.id ?? null,
          projectionId: projection.projection_id,
          preferences: activePreferences,
        }),
        capabilities: {
          canOpenWorkout: false,
          canMutateWorkout: false,
          canAttachResultOrEvidence: false,
          canExpressSchedulingPreference: true,
        },
      } satisfies BlueprintCalendarProjection;
    });
  return { projections, continuation: publicState };
}

export async function getAdaptiveBlueprintContinuationDecisionForUser(input: {
  userId: string;
  asOfDate: string;
}) {
  const state = await getAdaptiveTrainingContinuationSourceStateForUser(input.userId);
  if (!state) return null;
  const blueprint = readPersistedBlueprint(state.blueprint.blueprint_content);
  const activeProjectionPreferences = readProjectionPreferences(
    state.latestInputRevision?.active_projection_preferences ?? [],
  );
  const horizonCheckIn = parseAdaptiveContinuationHorizonCheckIn(
    state.latestInputRevision?.horizon_check_in ?? null,
  );
  const confirmation = {
    id: state.confirmation.id,
    blockMode: state.confirmation.block_mode,
    intervalStartDate: state.confirmation.interval_start_date,
    intervalEndDate: state.confirmation.interval_end_date,
    candidateId: state.confirmation.detailed_candidate_id,
    candidateVersion: state.confirmation.candidate_version,
    candidateSha256: state.confirmation.candidate_sha256,
  };
  const windowResult = resolveAdaptiveContinuationWindow({
    asOfDate: input.asOfDate,
    selectedTargetDate: blueprint.selectedTargetDate,
    confirmation,
    bridgeExceptionUsed: state.bridgeExceptionUsed,
    horizonCheckIn,
  });
  if ("status" in windowResult) {
    return {
      state,
      blueprint,
      confirmation,
      window: null,
      facts: null,
      projections: [],
      preferenceApplications: [],
      conflicts: [],
      decisionInput: null,
      decision: null,
      preliminary: windowResult,
    };
  }
  const window = windowResult;
  const facts = await getAdaptiveBlueprintContinuationFactsForUser({
    userId: input.userId,
    asOf: input.asOfDate,
    cutoffDate: window.evidenceCutoffDate,
    intervalStartDate: window.intervalStartDate,
    intervalEndDate: window.intervalEndDate,
  });
  if (!facts || !facts.targetIntervalOccupancy) {
    throw new Error("The adaptive continuation factual packet is unavailable.");
  }
  const intervalProjections = blueprint.projections.filter(
    (projection) =>
      projection.date >= window.intervalStartDate && projection.date <= window.intervalEndDate,
  );
  const preferenceResolution = resolveAdaptiveContinuationProjectionPreferences({
    projections: intervalProjections,
    preferences: activeProjectionPreferences,
    revisionId: state.latestInputRevision?.id ?? "unretained",
    intervalStartDate: window.intervalStartDate,
    intervalEndDate: window.intervalEndDate,
    occupiedDates: new Set(
      facts.targetIntervalOccupancy.occupiedDates.map((entry) => entry.workoutDate),
    ),
    trainingPreferences: facts.normalizedProfileConstraints.trainingPreferences,
  });
  const projections = intervalProjections.map((projection) => ({
    projectionId: projection.projection_id,
    date: preferenceResolution.assignedDates.get(projection.projection_id) ?? projection.date,
    phase: projection.phase,
    workoutFamily: projection.cadence_or_workout_family,
    targetAssumption: projection.target_assumption,
    reviewTiming: projection.review_timing,
  }));
  const packetMismatch =
    facts.calendar.cutoffDate !== window.evidenceCutoffDate ||
    facts.evidence.cutoffDate !== window.evidenceCutoffDate ||
    facts.evidence.calendarOutcomeFingerprint !== facts.calendar.calendarOutcomeFingerprint ||
    facts.targetIntervalOccupancy.intervalStartDate !== window.intervalStartDate ||
    facts.targetIntervalOccupancy.intervalEndDate !== window.intervalEndDate;
  const decisionInput: ContinuationDecisionInputV1 = {
    version: CONTINUATION_DECISION_CONTRACT_VERSION,
    policyVersion: CONTINUATION_DECISION_POLICY_VERSION,
    asOfDate: input.asOfDate,
    blueprint: {
      id: state.blueprint.id,
      version: state.blueprint.version,
      sha256: state.blueprint.content_sha256,
      selectedTargetDate: blueprint.selectedTargetDate,
    },
    predecessorConfirmation: {
      id: state.confirmation.id,
      intervalEndDate: state.confirmation.interval_end_date,
    },
    window: {
      intervalStartDate: window.intervalStartDate,
      intervalEndDate: window.intervalEndDate,
      evidenceCutoffDate: window.evidenceCutoffDate,
      readinessOpensDate: window.readinessOpensDate,
      mode: window.mode,
    },
    continuationInput:
      state.latestInputRevision && horizonCheckIn
        ? {
            id: state.latestInputRevision.id,
            revision: state.latestInputRevision.revision,
            sha256: state.latestInputRevision.content_sha256,
            confirmationId: horizonCheckIn.confirmationId,
            goalAssumptionCurrent: horizonCheckIn.goalAssumptionCurrent,
            availabilityConfirmed: horizonCheckIn.availabilityConfirmed,
            manageability: horizonCheckIn.manageability,
            healthLimitation: horizonCheckIn.healthLimitation,
            interruptionStatus: horizonCheckIn.interruptionStatus,
            clinicianGuidance: horizonCheckIn.clinicianGuidance,
            activePreferenceCount: activeProjectionPreferences.length,
          }
        : null,
    projections,
    facts: {
      profileConstraintsFingerprint: facts.fitnessProfileProjection.profileConstraintsFingerprint,
      calendarOutcomeFingerprint: packetMismatch
        ? "invalid"
        : facts.calendar.calendarOutcomeFingerprint,
      evidenceRevisionFingerprint: facts.evidence.evidenceRevisionFingerprint,
      targetIntervalOccupancyFingerprint:
        facts.targetIntervalOccupancy.calendarOccupancyFingerprint,
      unresolvedCalendarOutcomeCount: facts.calendar.workouts.filter(
        (workout) => workout.outcome === "unresolved",
      ).length,
      fitnessProfile: facts.fitnessProfileProjection,
    },
  };
  const decision = decideAdaptiveContinuation(decisionInput);
  const conflicts = buildAdaptiveContinuationCandidateConflicts({
    projections: intervalProjections,
    assignedDates: preferenceResolution.assignedDates,
    occupiedDates: new Set(
      facts.targetIntervalOccupancy.occupiedDates.map((entry) => entry.workoutDate),
    ),
    trainingPreferences: facts.normalizedProfileConstraints.trainingPreferences,
  });
  return {
    state,
    blueprint,
    confirmation,
    window,
    facts,
    projections,
    preferenceApplications: preferenceResolution.outcomes,
    conflicts,
    decisionInput,
    decision,
    preliminary: null,
  };
}

export async function getAdaptiveBlueprintContinuationFactsForUser(input: {
  userId: string;
  asOf: string;
  cutoffDate: string;
  intervalStartDate?: string;
  intervalEndDate?: string;
}) {
  const state = await getAdaptiveTrainingContinuationSourceStateForUser(input.userId);
  if (!state) return null;
  const calendar = await getContinuationCalendarOutcomePacket({
    userId: input.userId,
    calendarWorkoutIds: state.confirmation.calendar_workout_ids,
    asOf: input.asOf,
    cutoffDate: input.cutoffDate,
  });
  const [evidence, settings, targetIntervalOccupancy] = await Promise.all([
    getContinuationEvidencePacket({
      userId: input.userId,
      asOf: input.asOf,
      cutoffDate: input.cutoffDate,
      calendarOutcomeFingerprint: calendar.calendarOutcomeFingerprint,
      workouts: calendar.workouts,
    }),
    getUserSettingsForUserId(input.userId, null),
    input.intervalStartDate && input.intervalEndDate
      ? getContinuationCalendarOccupancyPacket({
          userId: input.userId,
          intervalStartDate: input.intervalStartDate,
          intervalEndDate: input.intervalEndDate,
        })
      : null,
  ]);
  const fitnessProfileSnapshot = await getRunnerFitnessProfileSnapshotForUser({
    userId: input.userId,
    asOf: input.asOf,
    cutoffDate: input.cutoffDate,
    settings,
    calendar,
    evidence,
  });
  const fitnessProfileProjection =
    projectRunnerFitnessProfileForContinuation(fitnessProfileSnapshot);
  return {
    normalizedProfileConstraintSha256: fitnessProfileProjection.profileConstraintsFingerprint,
    normalizedProfileConstraints: {
      sha256: fitnessProfileProjection.profileConstraintsFingerprint,
      trainingPreferences: fitnessProfileProjection.constraints?.trainingPreferences ?? {
        blocked_days: [],
        preferred_long_run_day: null,
        max_running_days_per_week: null,
      },
    },
    fitnessProfileSnapshot,
    fitnessProfileProjection,
    calendar,
    evidence,
    targetIntervalOccupancy,
  };
}

function buildPublicContinuationState(
  current: NonNullable<Awaited<ReturnType<typeof getAdaptiveBlueprintContinuationDecisionForUser>>>,
): AdaptiveContinuationPublicState {
  const context = buildPublicContinuationContext(current);
  if (current.preliminary) {
    return current.preliminary.status === "planned"
      ? { status: "planned", window: null, reasons: [], candidate: null, context }
      : {
          status: "not_ready",
          window: null,
          reasons: [...current.preliminary.missingReasons],
          candidate: null,
          context,
        };
  }
  if (!current.window || !current.decision) {
    return { status: "planned", window: null, reasons: [], candidate: null, context };
  }
  const window = {
    startDate: current.window.intervalStartDate,
    endDate: current.window.intervalEndDate,
    blockMode: current.window.mode,
  };
  if (current.decision.status === "no_prescription") {
    return {
      status: current.decision.reasons.some((reason) => reason.startsWith("check_in"))
        ? "check_in_needed"
        : "not_ready",
      window,
      reasons: [...current.decision.reasons],
      candidate: null,
      context,
    };
  }
  const candidate = current.state.continuationCandidates.find(
    (stored) =>
      stored.source_response_id &&
      candidateIsCurrent(stored.input_snapshot, stored.input_provenance, current),
  );
  if (candidate) {
    const content = parseAdaptiveContinuationCandidateContent(candidate.candidate_content);
    if (!content) {
      return {
        status: "not_ready",
        window,
        reasons: ["candidate_malformed"],
        candidate: null,
        context,
      };
    }
    return {
      status: "candidate_ready",
      window,
      reasons: [],
      candidate: {
        id: candidate.id,
        version: candidate.version,
        sha256: candidate.candidate_sha256,
        sourceResponseBound: true,
        blockMode: content.blockMode,
        interval: { ...content.interval },
        workoutDocuments: content.workoutDocuments,
        factsUsed: { ...content.factsUsed },
        factsMissing: [...content.factsMissing],
        conflicts: content.conflicts.map((conflict) => ({ ...conflict })),
        preferenceApplications: content.preferenceApplications.map((application) => ({
          ...application,
          preference: { ...application.preference },
        })),
        performanceAdaptation: {
          ...content.performanceAdaptation,
          comparableContextKeys: [...content.performanceAdaptation.comparableContextKeys],
        },
      },
      context: {
        ...context,
        capabilities: {
          ...context.capabilities,
          canPrepareCandidate: false,
          canReviewCandidate: true,
          canConfirmCandidate: true,
        },
      },
    };
  }
  return {
    status: "authoring_ready",
    window,
    reasons: [],
    candidate: null,
    context: {
      ...context,
      capabilities: { ...context.capabilities, canPrepareCandidate: true },
    },
  };
}

function buildPublicContinuationContext(
  current: NonNullable<Awaited<ReturnType<typeof getAdaptiveBlueprintContinuationDecisionForUser>>>,
): AdaptiveContinuationPublicContext {
  const revision = current.state.latestInputRevision;
  const evidenceWorkouts = current.facts?.evidence.workouts ?? [];
  const countEvidenceState = (state: (typeof evidenceWorkouts)[number]["evidenceState"]) =>
    evidenceWorkouts.filter((workout) => workout.evidenceState === state).length;
  return {
    blueprint: {
      id: current.state.blueprint.id,
      version: current.state.blueprint.version,
      sha256: current.state.blueprint.content_sha256,
    },
    confirmation: {
      id: current.state.confirmation.id,
      intervalStartDate: current.state.confirmation.interval_start_date,
      intervalEndDate: current.state.confirmation.interval_end_date,
    },
    currentInputRevision: revision
      ? {
          id: revision.id,
          revision: revision.revision,
          sha256: revision.content_sha256,
          checkIn: parseAdaptiveContinuationHorizonCheckIn(revision.horizon_check_in),
          activePreferences: readProjectionPreferences(revision.active_projection_preferences),
        }
      : null,
    dataQuality: current.facts
      ? {
          dueWorkoutCount: current.facts.evidence.dueWorkoutCount,
          resolvedOutcomeCount: current.facts.evidence.resolvedOutcomeCount,
          fitCurrentCount: countEvidenceState("fit_current"),
          completedWithoutFitCount: countEvidenceState("completed_without_fit"),
          missingCount: countEvidenceState("missing"),
          updatingCount: countEvidenceState("updating"),
          removedCount: countEvidenceState("removed"),
        }
      : null,
    preferenceApplications: current.preferenceApplications.map((application) => ({
      ...application,
      preference: { ...application.preference },
    })),
    capabilities: {
      canSubmitInput: true,
      canPrepareCandidate: false,
      canReviewCandidate: false,
      canConfirmCandidate: false,
    },
  };
}

function candidateIsCurrent(
  inputSnapshot: Json,
  inputProvenance: Json,
  current: NonNullable<Awaited<ReturnType<typeof getAdaptiveBlueprintContinuationDecisionForUser>>>,
) {
  if (
    !isRecord(inputSnapshot) ||
    !isRecord(inputProvenance) ||
    inputProvenance.contractVersion !== ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION ||
    inputProvenance.compilerVersion !== ADAPTIVE_CONTINUATION_COMPILER_VERSION ||
    !current.decision ||
    !current.facts
  ) {
    return false;
  }
  return (
    stableJsonEqual(inputSnapshot.decision, current.decision) &&
    stableJsonEqual(inputSnapshot.blueprint, {
      id: current.state.blueprint.id,
      version: current.state.blueprint.version,
      sha256: current.state.blueprint.content_sha256,
    }) &&
    stableJsonEqual(
      inputSnapshot.continuationInput,
      current.state.latestInputRevision
        ? {
            id: current.state.latestInputRevision.id,
            revision: current.state.latestInputRevision.revision,
            sha256: current.state.latestInputRevision.content_sha256,
            horizonCheckIn: parseAdaptiveContinuationHorizonCheckIn(
              current.state.latestInputRevision.horizon_check_in,
            ),
            activeProjectionPreferences: readProjectionPreferences(
              current.state.latestInputRevision.active_projection_preferences,
            ),
          }
        : null,
    ) &&
    isRecord(inputSnapshot.normalizedProfileConstraints) &&
    inputSnapshot.normalizedProfileConstraints.sha256 ===
      current.facts.normalizedProfileConstraintSha256 &&
    isRecord(inputSnapshot.calendar) &&
    inputSnapshot.calendar.calendarOutcomeFingerprint ===
      current.facts.calendar.calendarOutcomeFingerprint &&
    isRecord(inputSnapshot.evidence) &&
    inputSnapshot.evidence.evidenceRevisionFingerprint ===
      current.facts.evidence.evidenceRevisionFingerprint &&
    isRecord(inputSnapshot.targetIntervalOccupancy) &&
    inputSnapshot.targetIntervalOccupancy.calendarOccupancyFingerprint ===
      current.facts.targetIntervalOccupancy?.calendarOccupancyFingerprint
  );
}

export function readPersistedAdaptiveBlueprint(value: Json): AiAuthoredBlueprintSummary {
  return readPersistedBlueprint(value);
}

function readPersistedBlueprint(value: Json): AiAuthoredBlueprintSummary {
  if (!isRecord(value)) {
    throw new Error("The persisted adaptive Blueprint has an invalid canonical shape.");
  }
  const candidate = value as unknown as AiAuthoredBlueprintSummary;
  if (
    typeof candidate.version !== "string" ||
    typeof candidate.startDate !== "string" ||
    typeof candidate.selectedTargetDate !== "string" ||
    typeof candidate.targetAssumption !== "string" ||
    !Array.isArray(candidate.phases) ||
    !Array.isArray(candidate.projections) ||
    !isRecord(candidate.detailedHorizon)
  ) {
    throw new Error("The persisted adaptive Blueprint has an invalid canonical shape.");
  }
  return candidate;
}

export function readAdaptiveProjectionPreferences(
  value: Json,
): AdaptiveProjectionSchedulingPreference[] {
  return readProjectionPreferences(value);
}

function readProjectionPreferences(value: Json): AdaptiveProjectionSchedulingPreference[] {
  if (!Array.isArray(value)) {
    throw new Error("The persisted adaptive projection preferences are invalid.");
  }
  return value.map((preference) => {
    if (!isRecord(preference)) {
      throw new Error("A persisted adaptive projection preference is invalid.");
    }
    if (
      preference.kind === "avoid_projection_date" &&
      typeof preference.projectionId === "string" &&
      typeof preference.date === "string"
    ) {
      return {
        kind: preference.kind,
        projectionId: preference.projectionId,
        date: preference.date,
      };
    }
    if (
      preference.kind === "swap_projection_slots" &&
      typeof preference.firstProjectionId === "string" &&
      typeof preference.secondProjectionId === "string"
    ) {
      return {
        kind: preference.kind,
        firstProjectionId: preference.firstProjectionId,
        secondProjectionId: preference.secondProjectionId,
      };
    }
    throw new Error("A persisted adaptive projection preference is invalid.");
  });
}

function activePreferenceIds(input: {
  revisionId: string | null;
  projectionId: string;
  preferences: readonly AdaptiveProjectionSchedulingPreference[];
}) {
  if (!input.revisionId) return [];
  return input.preferences.flatMap((preference, index) => {
    const applies =
      preference.kind === "avoid_projection_date"
        ? preference.projectionId === input.projectionId
        : preference.firstProjectionId === input.projectionId ||
          preference.secondProjectionId === input.projectionId;
    return applies ? [`${input.revisionId}:${index}`] : [];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
