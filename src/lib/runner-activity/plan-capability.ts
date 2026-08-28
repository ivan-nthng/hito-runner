import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";
import { stableJsonStringify } from "@/lib/review-token-signing";
import type { RunnerFitnessProfileSnapshotV1 } from "@/lib/runner-activity/product-contract";
import {
  RUNNER_PLAN_CAPABILITY_FORMULA_VERSION,
  RUNNER_PLAN_CAPABILITY_VECTOR_VERSION,
  type RunnerPlanCapabilityReasonCode,
  type RunnerPlanCapabilitySourceActivityV1,
  type RunnerPlanCapabilityState,
  type RunnerPlanCapabilityVectorV1,
  type SevenDayCapabilitySliceV1,
} from "@/lib/runner-activity/plan-capability-contract";
import { addDaysIso } from "@/lib/training";

const COMPLETE_SLICE_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const BASE28_SLICE_INDEXES = [0, 1, 2, 3] as const;

export function deriveRunnerPlanCapabilityVectorV1(input: {
  snapshot: RunnerFitnessProfileSnapshotV1;
  currentRunningLimitation?: "no" | "yes" | "unsure" | null;
}): RunnerPlanCapabilityVectorV1 {
  const { snapshot } = input;
  const source = snapshot.planAuthoringSource;
  const slices = COMPLETE_SLICE_INDEXES.map((sliceIndex) =>
    buildSlice(snapshot.cutoffDate, sliceIndex, source.activities),
  );
  const recent = slices[0]!;
  const sourceState = source.state;
  const recentState = capabilityStateForSlice(recent, sourceState);
  const baseState = aggregateWindowState(slices.slice(0, 4), sourceState, false);
  const capacityState = aggregateWindowState(slices, sourceState, recent.contactCount === 0);
  const limitation = input.currentRunningLimitation ?? "unavailable";
  const constraints = snapshot.components.constraints.data?.trainingPreferences ?? null;
  const outcomeAdmission = resolveOutcomeAdmission(snapshot);
  const openingAnchor = resolveOpeningAnchor(recent);
  const additionalEasyContact = resolveAdditionalEasyContact({
    recent,
    slices,
    openingAnchor,
    limitation,
    outcomeAdmission,
    maximumRunningDaysPerWeek: constraints?.max_running_days_per_week ?? null,
    fixedRestDays: constraints?.blocked_days ?? [],
    sourceState,
  });
  const performanceRecords = source.records.filter(
    (record) =>
      record.recordClass === "runner_confirmed_official_result" ||
      (record.recordClass === "hito_observed_whole_activity" &&
        source.activities.some(
          (activity) =>
            activity.activityId === record.activityId &&
            activity.distanceMetres === record.distanceMetres,
        )),
  );
  const performanceState: RunnerPlanCapabilityState =
    sourceState === "updating"
      ? "updating"
      : sourceState === "contradictory"
        ? "contradictory"
        : performanceRecords.length === 0
          ? "unavailable"
          : performanceRecords.length === 1
            ? "observed_sparse"
            : "observed_pattern";
  const reasonCodes = new Set<RunnerPlanCapabilityReasonCode>([
    ...source.reasonCodes,
    ...recent.duration.reasonCodes,
    ...recent.distance.reasonCodes,
    ...openingAnchor.reasonCodes,
    ...additionalEasyContact.reasonCodes,
    "capacity90_partial_boundary",
    "capacity90_recurrence_unproven",
    "performance_samples_unavailable",
    "performance_segment_unavailable",
  ]);
  if (recent.contactCount === 0) reasonCodes.add("recent7_no_contacts");
  if (performanceRecords.length === 0) reasonCodes.add("performance_whole_activity_unavailable");

  const sourceFingerprint = sha256(
    stableJsonStringify({
      snapshotVersion: snapshot.version,
      runnerFactsRevision: snapshot.runnerFactsRevision,
      cutoffDate: snapshot.cutoffDate,
      timeZone: snapshot.timeZone,
      provenance: snapshot.provenance,
      source,
      limitation,
    }),
  );
  const vectorWithoutId = {
    version: RUNNER_PLAN_CAPABILITY_VECTOR_VERSION,
    formulaVersion: RUNNER_PLAN_CAPABILITY_FORMULA_VERSION,
    snapshot: {
      version: snapshot.version,
      snapshotId: snapshot.snapshotId,
      runnerFactsRevision: snapshot.runnerFactsRevision,
    },
    cutoff: {
      date: snapshot.cutoffDate,
      timeZone: snapshot.timeZone,
      timezoneBasis: "historical_local_date" as const,
    },
    sourceFingerprint,
    sevenDaySlices: slices,
    windows: {
      recent7: { sliceIndex: 0 as const, state: recentState },
      base28: { sliceIndexes: BASE28_SLICE_INDEXES, state: baseState },
      capacity90: {
        completeSliceIndexes: COMPLETE_SLICE_INDEXES,
        leadingPartialBoundary: {
          startDate: addDaysIso(snapshot.cutoffDate, -89),
          endDate: addDaysIso(snapshot.cutoffDate, -84),
          completeSevenDays: false as const,
          contextOnly: true as const,
        },
        state: capacityState,
      },
    },
    performanceEvidence: {
      phase: "phase_a_whole_activity_only" as const,
      state: performanceState,
      records: performanceRecords,
      contiguousSegmentEvidence: {
        state: "unavailable" as const,
        reasonCodes: [
          "performance_samples_unavailable",
          "performance_segment_unavailable",
        ] as const,
      },
      heartRateAuthority: "unavailable" as const,
      reasonCodes: [
        ...(performanceRecords.length === 0
          ? (["performance_whole_activity_unavailable"] as const)
          : []),
        "performance_samples_unavailable" as const,
        "performance_segment_unavailable" as const,
      ],
    },
    evidenceConfidence: {
      recent7: recentState,
      base28: baseState,
      capacity90: capacityState,
      performanceEvidence: performanceState,
    },
    openingAnchor,
    additionalEasyContact,
    constraints: {
      maximumRunningDaysPerWeek: constraints?.max_running_days_per_week ?? null,
      fixedRestDays: [...(constraints?.blocked_days ?? [])].sort(),
      preferredLongRunDay: constraints?.preferred_long_run_day ?? null,
      currentRunningLimitation: limitation,
      outcomeAdmission,
    },
    reasonCodes: Array.from(reasonCodes).sort(),
  } satisfies Omit<RunnerPlanCapabilityVectorV1, "vectorId">;

  return deepFreeze({
    ...vectorWithoutId,
    vectorId: sha256(
      stableJsonStringify({
        ...vectorWithoutId,
        snapshot: {
          version: vectorWithoutId.snapshot.version,
          runnerFactsRevision: vectorWithoutId.snapshot.runnerFactsRevision,
        },
      }),
    ),
  });
}

function buildSlice(
  cutoffDate: string,
  sliceIndex: (typeof COMPLETE_SLICE_INDEXES)[number],
  activities: readonly RunnerPlanCapabilitySourceActivityV1[],
): SevenDayCapabilitySliceV1 {
  const endDate = addDaysIso(cutoffDate, -(sliceIndex * 7));
  const startDate = addDaysIso(endDate, -6);
  const contacts = activities
    .filter((activity) => activity.localDate >= startDate && activity.localDate <= endDate)
    .sort(
      (left, right) =>
        left.localDate.localeCompare(right.localDate) ||
        left.activityId.localeCompare(right.activityId),
    );
  const missingDurationCount = contacts.filter(
    (activity) => activity.durationSeconds == null,
  ).length;
  const missingDistanceCount = contacts.filter(
    (activity) => activity.distanceMetres == null,
  ).length;
  return {
    sliceIndex,
    startDate,
    endDate,
    completeSevenDays: true,
    contactCount: contacts.length,
    duration: {
      unit: "seconds",
      value:
        missingDurationCount === 0
          ? contacts.reduce((sum, activity) => sum + (activity.durationSeconds ?? 0), 0)
          : null,
      authority: missingDurationCount === 0 ? "exact" : "unavailable",
      includedActivityCount: contacts.length - missingDurationCount,
      missingActivityCount: missingDurationCount,
      reasonCodes: missingDurationCount > 0 ? ["recent7_duration_incomplete"] : [],
    },
    distance: {
      unit: "metres",
      value:
        missingDistanceCount === 0
          ? contacts.reduce((sum, activity) => sum + (activity.distanceMetres ?? 0), 0)
          : null,
      authority: missingDistanceCount === 0 ? "exact" : "unavailable",
      includedActivityCount: contacts.length - missingDistanceCount,
      missingActivityCount: missingDistanceCount,
      reasonCodes: missingDistanceCount > 0 ? ["recent7_distance_incomplete"] : [],
    },
    eligibleEasyLongContacts: contacts.flatMap((activity) =>
      activity.classification
        ? [
            {
              activityId: activity.activityId,
              localDate: activity.localDate,
              classification: activity.classification,
              durationSeconds: activity.durationSeconds,
              distanceMetres: activity.distanceMetres,
            },
          ]
        : [],
    ),
    activityRevisionFingerprint: sha256(
      stableJsonStringify(
        contacts.map((activity) => ({
          activityId: activity.activityId,
          activityRevisionId: activity.activityRevisionId,
          sourceRevisionId: activity.sourceRevisionId,
        })),
      ),
    ),
  };
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function capabilityStateForSlice(
  slice: SevenDayCapabilitySliceV1,
  sourceState: "current" | "updating" | "contradictory",
): RunnerPlanCapabilityState {
  if (sourceState === "updating") return "updating";
  if (sourceState === "contradictory") return "contradictory";
  if (slice.contactCount === 0) return "unavailable";
  return slice.contactCount <= 2 ? "observed_sparse" : "observed_pattern";
}

function aggregateWindowState(
  slices: readonly SevenDayCapabilitySliceV1[],
  sourceState: "current" | "updating" | "contradictory",
  historicalOnly: boolean,
): RunnerPlanCapabilityState {
  if (sourceState === "updating") return "updating";
  if (sourceState === "contradictory") return "contradictory";
  const nonEmpty = slices.filter((slice) => slice.contactCount > 0);
  if (nonEmpty.length === 0) return "unavailable";
  if (historicalOnly) return "historical_capacity_only";
  return nonEmpty.length >= 2 ? "repeated_support" : "observed_sparse";
}

function resolveOpeningAnchor(recent: SevenDayCapabilitySliceV1) {
  const basis =
    recent.contactCount === 0
      ? "unavailable"
      : recent.distance.authority === "exact"
        ? "distance_metres"
        : recent.duration.authority === "exact"
          ? "duration_seconds"
          : "unavailable";
  const enforcedOpeningDemand =
    basis === "distance_metres"
      ? recent.distance.value
      : basis === "duration_seconds"
        ? recent.duration.value
        : null;
  const longValues = recent.eligibleEasyLongContacts
    .filter((contact) => contact.classification === "long")
    .map((contact) =>
      basis === "distance_metres" ? contact.distanceMetres : contact.durationSeconds,
    );
  const classificationComplete =
    recent.contactCount > 0 && recent.eligibleEasyLongContacts.length === recent.contactCount;
  const reasons: RunnerPlanCapabilityReasonCode[] = [];
  if (basis === "unavailable") reasons.push("opening_anchor_unavailable");
  if (recent.eligibleEasyLongContacts.length !== recent.contactCount && recent.contactCount > 0) {
    reasons.push("recent7_classification_unavailable");
  }
  return {
    basis,
    recent7DistanceMetres: recent.distance.value,
    recent7DurationSeconds: recent.duration.value,
    enforcedOpeningDemand,
    longRunDemand:
      classificationComplete &&
      longValues.length > 0 &&
      longValues.every((value): value is number => value != null)
        ? Math.max(...longValues)
        : null,
    reasonCodes: reasons,
  } as RunnerPlanCapabilityVectorV1["openingAnchor"];
}

function resolveOutcomeAdmission(
  snapshot: RunnerFitnessProfileSnapshotV1,
): RunnerPlanCapabilityVectorV1["constraints"]["outcomeAdmission"] {
  const recent = snapshot.components.recent28Day;
  if (recent.state === "updating" || recent.state === "contradictory") return "unavailable";
  const outcomes = recent.data?.calendarOutcomes ?? [];
  return outcomes.some((outcome) => outcome.outcome !== "completed")
    ? "not_permitted"
    : "permitted";
}

function resolveAdditionalEasyContact(input: {
  recent: SevenDayCapabilitySliceV1;
  slices: readonly SevenDayCapabilitySliceV1[];
  openingAnchor: RunnerPlanCapabilityVectorV1["openingAnchor"];
  limitation: RunnerPlanCapabilityVectorV1["constraints"]["currentRunningLimitation"];
  outcomeAdmission: RunnerPlanCapabilityVectorV1["constraints"]["outcomeAdmission"];
  maximumRunningDaysPerWeek: number | null;
  fixedRestDays: readonly string[];
  sourceState: "current" | "updating" | "contradictory";
}): RunnerPlanCapabilityVectorV1["additionalEasyContact"] {
  const currentContacts = input.recent.contactCount;
  const proposedContacts = currentContacts === 0 ? 0 : currentContacts + 1;
  const reasons: RunnerPlanCapabilityReasonCode[] = [];
  if (currentContacts === 0) {
    return {
      currentContacts,
      proposedContacts,
      decision: "not_applicable_reentry",
      supportSliceIndex: null,
      maximumOpeningDemand: null,
      reasonCodes: ["recent7_no_contacts"],
    };
  }
  if (input.openingAnchor.basis === "unavailable") reasons.push("opening_anchor_unavailable");
  if (input.limitation === "unavailable") reasons.push("limitation_state_unavailable");
  else if (input.limitation !== "no") reasons.push("limitation_not_cleared");
  if (input.outcomeAdmission === "unavailable") reasons.push("outcome_state_unavailable");
  else if (input.outcomeAdmission !== "permitted") reasons.push("outcome_not_permitted");
  if (
    input.maximumRunningDaysPerWeek != null &&
    proposedContacts > input.maximumRunningDaysPerWeek
  ) {
    reasons.push("availability_ceiling_exceeded");
  }
  if (proposedContacts > 7 - new Set(input.fixedRestDays).size) {
    reasons.push("fixed_rest_day_capacity_insufficient");
  }
  if (input.recent.eligibleEasyLongContacts.length !== currentContacts) {
    reasons.push("recent7_classification_unavailable");
  }
  if (input.sourceState !== "current") {
    reasons.push(
      input.sourceState === "updating"
        ? "source_revision_updating"
        : "source_revision_contradictory",
    );
  }
  if (reasons.length > 0) {
    return {
      currentContacts,
      proposedContacts,
      decision: "not_admitted",
      supportSliceIndex: null,
      maximumOpeningDemand: input.openingAnchor.enforcedOpeningDemand,
      reasonCodes: Array.from(new Set(reasons)).sort(),
    };
  }
  const basis = input.openingAnchor.basis;
  const support = input.slices.slice(1).find((slice) => {
    const metric = basis === "distance_metres" ? slice.distance : slice.duration;
    return slice.contactCount === proposedContacts && metric.authority === "exact";
  });
  if (support) {
    const supportDemand =
      basis === "distance_metres" ? support.distance.value : support.duration.value;
    return {
      currentContacts,
      proposedContacts,
      decision: "supported_growth",
      supportSliceIndex: support.sliceIndex,
      maximumOpeningDemand: Math.max(
        input.openingAnchor.enforcedOpeningDemand ?? 0,
        supportDemand ?? 0,
      ),
      reasonCodes: ["plus_one_supported_growth"],
    };
  }
  return {
    currentContacts,
    proposedContacts,
    decision: "redistribute_same_demand",
    supportSliceIndex: null,
    maximumOpeningDemand: input.openingAnchor.enforcedOpeningDemand,
    reasonCodes: ["plus_one_redistribution_only"],
  };
}
