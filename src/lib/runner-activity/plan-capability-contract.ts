import { z } from "zod";

export const RUNNER_PLAN_CAPABILITY_VECTOR_VERSION = "runner_plan_capability_vector_v1" as const;
export const RUNNER_PLAN_CAPABILITY_FORMULA_VERSION = "runner_plan_capability_formula_v1" as const;

export const RUNNER_PLAN_CAPABILITY_STATES = [
  "unavailable",
  "observed_sparse",
  "observed_pattern",
  "repeated_support",
  "historical_capacity_only",
  "updating",
  "contradictory",
] as const;

export type RunnerPlanCapabilityState = (typeof RUNNER_PLAN_CAPABILITY_STATES)[number];

export const RUNNER_PLAN_CAPABILITY_REASON_CODES = [
  "recent7_no_contacts",
  "recent7_duration_incomplete",
  "recent7_distance_incomplete",
  "recent7_classification_unavailable",
  "base28_slice_incomplete",
  "capacity90_partial_boundary",
  "capacity90_recurrence_unproven",
  "performance_whole_activity_unavailable",
  "performance_samples_unavailable",
  "performance_segment_unavailable",
  "source_revision_updating",
  "source_revision_contradictory",
  "capability_source_stale",
  "opening_anchor_unavailable",
  "limitation_state_unavailable",
  "limitation_not_cleared",
  "availability_ceiling_exceeded",
  "fixed_rest_day_capacity_insufficient",
  "outcome_state_unavailable",
  "outcome_not_permitted",
  "recovery_spacing_failed",
  "quality_density_failed",
  "plus_one_redistribution_only",
  "plus_one_supported_growth",
] as const;

export type RunnerPlanCapabilityReasonCode = (typeof RUNNER_PLAN_CAPABILITY_REASON_CODES)[number];

export type RunnerPlanCapabilitySourceActivityV1 = {
  activityId: string;
  activityRevisionId: string;
  sourceRevisionId: string;
  localDate: string;
  durationSeconds: number | null;
  distanceMetres: number | null;
  classification: "easy" | "long" | null;
};

export type RunnerPlanCapabilitySourceRecordV1 = {
  activityId: string;
  activityRevisionId: string;
  sourceRevisionId: string;
  evidenceRevisionId: string | null;
  recordClass: "hito_observed_whole_activity" | "runner_confirmed_official_result";
  distanceKey: string;
  distanceMetres: number;
  elapsedSeconds: number;
  eventDate: string | null;
  provenance: "canonical_activity_summary" | "runner_confirmed";
  formulaVersion: string;
};

export type RunnerPlanCapabilitySourceV1 = {
  version: "runner_plan_capability_source_v1";
  state: "current" | "updating" | "contradictory";
  activities: readonly RunnerPlanCapabilitySourceActivityV1[];
  records: readonly RunnerPlanCapabilitySourceRecordV1[];
  formulaVersions: readonly string[];
  reasonCodes: readonly ("source_revision_updating" | "source_revision_contradictory")[];
};

export type RunnerPlanCapabilityExactMetricV1<Unit extends string> = {
  unit: Unit;
  value: number | null;
  authority: "exact" | "unavailable";
  includedActivityCount: number;
  missingActivityCount: number;
  reasonCodes: RunnerPlanCapabilityReasonCode[];
};

export type SevenDayCapabilitySliceV1 = {
  sliceIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  startDate: string;
  endDate: string;
  completeSevenDays: true;
  contactCount: number;
  duration: RunnerPlanCapabilityExactMetricV1<"seconds">;
  distance: RunnerPlanCapabilityExactMetricV1<"metres">;
  eligibleEasyLongContacts: readonly {
    activityId: string;
    localDate: string;
    classification: "easy" | "long";
    durationSeconds: number | null;
    distanceMetres: number | null;
  }[];
  activityRevisionFingerprint: string;
};

export type RunnerPlanPerformanceEvidenceV1 = {
  phase: "phase_a_whole_activity_only";
  state: RunnerPlanCapabilityState;
  records: readonly RunnerPlanCapabilitySourceRecordV1[];
  contiguousSegmentEvidence: {
    state: "unavailable";
    reasonCodes: readonly ["performance_samples_unavailable", "performance_segment_unavailable"];
  };
  heartRateAuthority: "unavailable";
  reasonCodes: RunnerPlanCapabilityReasonCode[];
};

export type RunnerPlanCapabilityVectorV1 = {
  version: typeof RUNNER_PLAN_CAPABILITY_VECTOR_VERSION;
  formulaVersion: typeof RUNNER_PLAN_CAPABILITY_FORMULA_VERSION;
  vectorId: string;
  snapshot: {
    version: "runner_fitness_profile_snapshot_v1";
    snapshotId: string;
    runnerFactsRevision: string;
  };
  cutoff: {
    date: string;
    timeZone: string;
    timezoneBasis: "historical_local_date";
  };
  sourceFingerprint: string;
  sevenDaySlices: readonly SevenDayCapabilitySliceV1[];
  windows: {
    recent7: { sliceIndex: 0; state: RunnerPlanCapabilityState };
    base28: { sliceIndexes: readonly [0, 1, 2, 3]; state: RunnerPlanCapabilityState };
    capacity90: {
      completeSliceIndexes: readonly [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      leadingPartialBoundary: {
        startDate: string;
        endDate: string;
        completeSevenDays: false;
        contextOnly: true;
      };
      state: RunnerPlanCapabilityState;
    };
  };
  performanceEvidence: RunnerPlanPerformanceEvidenceV1;
  evidenceConfidence: {
    recent7: RunnerPlanCapabilityState;
    base28: RunnerPlanCapabilityState;
    capacity90: RunnerPlanCapabilityState;
    performanceEvidence: RunnerPlanCapabilityState;
  };
  openingAnchor: {
    basis: "distance_metres" | "duration_seconds" | "unavailable";
    recent7DistanceMetres: number | null;
    recent7DurationSeconds: number | null;
    enforcedOpeningDemand: number | null;
    longRunDemand: number | null;
    reasonCodes: RunnerPlanCapabilityReasonCode[];
  };
  additionalEasyContact: {
    currentContacts: number;
    proposedContacts: number;
    decision:
      | "not_applicable_reentry"
      | "not_admitted"
      | "redistribute_same_demand"
      | "supported_growth";
    supportSliceIndex: number | null;
    maximumOpeningDemand: number | null;
    reasonCodes: RunnerPlanCapabilityReasonCode[];
  };
  constraints: {
    maximumRunningDaysPerWeek: number | null;
    fixedRestDays: readonly string[];
    preferredLongRunDay: string | null;
    currentRunningLimitation: "no" | "yes" | "unsure" | "unavailable";
    outcomeAdmission: "permitted" | "not_permitted" | "unavailable";
  };
  reasonCodes: readonly RunnerPlanCapabilityReasonCode[];
};

const reasonCodeSchema = z.enum(RUNNER_PLAN_CAPABILITY_REASON_CODES);
const stateSchema = z.enum(RUNNER_PLAN_CAPABILITY_STATES);
const sourceRecordSchema = z
  .object({
    activityId: z.string().trim().min(1),
    activityRevisionId: z.string().trim().min(1),
    sourceRevisionId: z.string().trim().min(1),
    evidenceRevisionId: z.string().trim().min(1).nullable(),
    recordClass: z.enum(["hito_observed_whole_activity", "runner_confirmed_official_result"]),
    distanceKey: z.string().trim().min(1),
    distanceMetres: z.number().positive(),
    elapsedSeconds: z.number().positive(),
    eventDate: z.string().date().nullable(),
    provenance: z.enum(["canonical_activity_summary", "runner_confirmed"]),
    formulaVersion: z.string().trim().min(1),
  })
  .strict();
const metricSchema = <Unit extends "seconds" | "metres">(unit: Unit) =>
  z
    .object({
      unit: z.literal(unit),
      value: z.number().nonnegative().nullable(),
      authority: z.enum(["exact", "unavailable"]),
      includedActivityCount: z.number().int().nonnegative(),
      missingActivityCount: z.number().int().nonnegative(),
      reasonCodes: z.array(reasonCodeSchema),
    })
    .strict();
const sliceSchema = z
  .object({
    sliceIndex: z.number().int().min(0).max(11),
    startDate: z.string().date(),
    endDate: z.string().date(),
    completeSevenDays: z.literal(true),
    contactCount: z.number().int().nonnegative(),
    duration: metricSchema("seconds"),
    distance: metricSchema("metres"),
    eligibleEasyLongContacts: z.array(
      z
        .object({
          activityId: z.string().trim().min(1),
          localDate: z.string().date(),
          classification: z.enum(["easy", "long"]),
          durationSeconds: z.number().nonnegative().nullable(),
          distanceMetres: z.number().nonnegative().nullable(),
        })
        .strict(),
    ),
    activityRevisionFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();

export const runnerPlanCapabilityVectorSchema = z
  .object({
    version: z.literal(RUNNER_PLAN_CAPABILITY_VECTOR_VERSION),
    formulaVersion: z.literal(RUNNER_PLAN_CAPABILITY_FORMULA_VERSION),
    vectorId: z.string().regex(/^[0-9a-f]{64}$/),
    snapshot: z
      .object({
        version: z.literal("runner_fitness_profile_snapshot_v1"),
        snapshotId: z.string().trim().min(1),
        runnerFactsRevision: z.string().trim().min(1),
      })
      .strict(),
    cutoff: z
      .object({
        date: z.string().date(),
        timeZone: z.string().trim().min(1),
        timezoneBasis: z.literal("historical_local_date"),
      })
      .strict(),
    sourceFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
    sevenDaySlices: z.array(sliceSchema).length(12),
    windows: z
      .object({
        recent7: z.object({ sliceIndex: z.literal(0), state: stateSchema }).strict(),
        base28: z
          .object({
            sliceIndexes: z.tuple([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
            state: stateSchema,
          })
          .strict(),
        capacity90: z
          .object({
            completeSliceIndexes: z.tuple([
              z.literal(0),
              z.literal(1),
              z.literal(2),
              z.literal(3),
              z.literal(4),
              z.literal(5),
              z.literal(6),
              z.literal(7),
              z.literal(8),
              z.literal(9),
              z.literal(10),
              z.literal(11),
            ]),
            leadingPartialBoundary: z
              .object({
                startDate: z.string().date(),
                endDate: z.string().date(),
                completeSevenDays: z.literal(false),
                contextOnly: z.literal(true),
              })
              .strict(),
            state: stateSchema,
          })
          .strict(),
      })
      .strict(),
    performanceEvidence: z
      .object({
        phase: z.literal("phase_a_whole_activity_only"),
        state: stateSchema,
        records: z.array(sourceRecordSchema),
        contiguousSegmentEvidence: z
          .object({
            state: z.literal("unavailable"),
            reasonCodes: z.tuple([
              z.literal("performance_samples_unavailable"),
              z.literal("performance_segment_unavailable"),
            ]),
          })
          .strict(),
        heartRateAuthority: z.literal("unavailable"),
        reasonCodes: z.array(reasonCodeSchema),
      })
      .strict(),
    evidenceConfidence: z
      .object({
        recent7: stateSchema,
        base28: stateSchema,
        capacity90: stateSchema,
        performanceEvidence: stateSchema,
      })
      .strict(),
    openingAnchor: z
      .object({
        basis: z.enum(["distance_metres", "duration_seconds", "unavailable"]),
        recent7DistanceMetres: z.number().nonnegative().nullable(),
        recent7DurationSeconds: z.number().nonnegative().nullable(),
        enforcedOpeningDemand: z.number().nonnegative().nullable(),
        longRunDemand: z.number().nonnegative().nullable(),
        reasonCodes: z.array(reasonCodeSchema),
      })
      .strict(),
    additionalEasyContact: z
      .object({
        currentContacts: z.number().int().nonnegative(),
        proposedContacts: z.number().int().nonnegative(),
        decision: z.enum([
          "not_applicable_reentry",
          "not_admitted",
          "redistribute_same_demand",
          "supported_growth",
        ]),
        supportSliceIndex: z.number().int().min(1).max(11).nullable(),
        maximumOpeningDemand: z.number().nonnegative().nullable(),
        reasonCodes: z.array(reasonCodeSchema),
      })
      .strict(),
    constraints: z
      .object({
        maximumRunningDaysPerWeek: z.number().int().min(1).max(7).nullable(),
        fixedRestDays: z.array(z.string().trim().min(1)),
        preferredLongRunDay: z.string().trim().min(1).nullable(),
        currentRunningLimitation: z.enum(["no", "yes", "unsure", "unavailable"]),
        outcomeAdmission: z.enum(["permitted", "not_permitted", "unavailable"]),
      })
      .strict(),
    reasonCodes: z.array(reasonCodeSchema),
  })
  .strict() as unknown as z.ZodType<RunnerPlanCapabilityVectorV1>;
