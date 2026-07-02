import { z } from "zod";
import { trainingPlanV2Schema, type TrainingPlanV2 } from "@/lib/imported-plan";
import {
  CALENDAR_ICON_KEY_VALUES,
  CANONICAL_METRIC_GUIDANCE_VALUES,
  CANONICAL_WORKOUT_FAMILY_VALUES,
  CANONICAL_WORKOUT_IDENTITY_VALUES,
  canonicalFamilyToLegacyWorkoutType,
  normalizeCanonicalGoalContext,
  normalizeCanonicalMetricMode,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalMetricModeJson,
} from "@/lib/rich-workout-model";

export const RICH_WORKOUT_DRAFT_SCHEMA_VERSION = "rich-workout-draft-v1";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const boundedTextSchema = z.string().trim().min(1).max(280);
const nullableBoundedTextSchema = z.string().trim().min(1).max(280).nullable();

const richDraftGoalContextSchema = z
  .object({
    goalType: z.string().trim().min(1).max(80),
    goalStyle: nullableBoundedTextSchema,
    terrainFocus: z.enum(["standard", "rolling", "mountain"]).nullable(),
    targetDate: isoDateSchema.nullable(),
    targetTime: z.string().trim().min(1).max(32).nullable(),
  })
  .strict();

const richDraftMetricModeSchema = z
  .object({
    guidance: z.enum(CANONICAL_METRIC_GUIDANCE_VALUES),
    paceTargetsAllowed: z.boolean(),
    hrTargetsAllowed: z.boolean(),
    reason: z.string().trim().min(1).max(200),
  })
  .strict();

const richDraftUnitPrescriptionSchema = z
  .object({
    mode: z.enum(["time", "distance", "none"]),
    durationMin: z.number().positive().nullable(),
    distanceKm: z.number().positive().nullable(),
  })
  .strict();

const richDraftTargetSchema = z
  .object({
    intensity: nullableBoundedTextSchema,
    rpe: z.union([z.string().trim().min(1).max(16), z.number().min(1).max(10)]).nullable(),
    cue: nullableBoundedTextSchema,
    hint: nullableBoundedTextSchema,
    paceMinPerKmRange: nullableBoundedTextSchema,
    pace: nullableBoundedTextSchema,
    hrBpmRange: nullableBoundedTextSchema,
    hrBpm: nullableBoundedTextSchema,
  })
  .strict();

const richDraftRepeatChildRoleSchema = z.enum([
  "warm_up",
  "run",
  "walk",
  "work",
  "recover",
  "finish",
  "cooldown",
]);

const richDraftRepeatChildSchema = z
  .object({
    role: richDraftRepeatChildRoleSchema,
    label: nullableBoundedTextSchema.optional(),
    sequence: z.number().int().min(1).nullable().optional(),
    guidance: nullableBoundedTextSchema.optional(),
    prescription: richDraftUnitPrescriptionSchema,
    target: richDraftTargetSchema.optional(),
  })
  .strict();

const richDraftSegmentPrescriptionSchema = z
  .object({
    mode: z.enum(["time", "distance", "repeats", "none"]),
    durationMin: z.number().positive().nullable(),
    distanceKm: z.number().positive().nullable(),
    repeatCount: z.number().int().positive().nullable(),
    children: z.array(richDraftRepeatChildSchema).min(1).max(12).nullable().optional(),
  })
  .strict();

const richDraftSegmentSchema = z
  .object({
    segmentId: z.string().trim().min(1).max(120),
    segmentType: z.enum([
      "warmup",
      "main",
      "cooldown",
      "recovery",
      "rest",
      "mobility",
      "mobility_optional",
      "strength",
      "activation",
      "drills",
      "strides",
      "recovery_jog",
      "fueling",
      "tempo_block",
      "interval_block",
    ]),
    label: z.string().trim().min(1).max(120),
    sequence: z.number().int().min(1),
    prescription: richDraftSegmentPrescriptionSchema,
    guidance: boundedTextSchema,
    target: richDraftTargetSchema,
  })
  .strict();

const richDraftWorkoutSchema = z
  .object({
    workoutId: z.string().trim().min(1).max(160),
    date: isoDateSchema,
    workoutFamily: z.enum(CANONICAL_WORKOUT_FAMILY_VALUES),
    workoutIdentity: z.enum(CANONICAL_WORKOUT_IDENTITY_VALUES),
    calendarIconKey: z.enum(CALENDAR_ICON_KEY_VALUES),
    title: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(360),
    goalContext: richDraftGoalContextSchema.nullable(),
    metricMode: richDraftMetricModeSchema,
    segments: z.array(richDraftSegmentSchema).min(1).max(8),
  })
  .strict();

export const richWorkoutDraftSchema = z
  .object({
    schemaVersion: z.literal(RICH_WORKOUT_DRAFT_SCHEMA_VERSION),
    assumptions: z.array(z.string().trim().min(1).max(280)).max(8),
    workouts: z.array(richDraftWorkoutSchema).min(1).max(200),
  })
  .strict();

export type RichWorkoutDraft = z.output<typeof richWorkoutDraftSchema>;

export interface RichWorkoutDraftMetadata {
  status: "not_requested" | "rich_draft_applied" | "deterministic_fallback";
  source: "openai_rich_workout_draft" | "deterministic_structured_generator";
  fallbackReason: string | null;
  reviewAssumptions: string[];
}

export type RichWorkoutDraftNormalizationResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      metadata: RichWorkoutDraftMetadata;
    }
  | {
      ok: false;
      reason: string;
      issues: string[];
      fallback: RichWorkoutDraftMetadata;
    };

type CanonicalWorkout = TrainingPlanV2["planned_workouts"][number];
type CanonicalSegment = CanonicalWorkout["segments"][number];
type DraftWorkout = RichWorkoutDraft["workouts"][number];
type DraftSegment = DraftWorkout["segments"][number];
type DraftUnitPrescription = z.output<typeof richDraftUnitPrescriptionSchema>;
type DraftRepeatChild = z.output<typeof richDraftRepeatChildSchema>;

const MAIN_LIKE_SEGMENT_TYPES = new Set(["main", "tempo_block", "interval_block", "strides"]);

const PACE_TARGET_KEYS = ["pace_min_per_km_range", "pace_range_min_km", "pace"] as const;
const HR_TARGET_KEYS = [
  "hr_bpm_range",
  "hr_bpm",
  "hr_target_source",
  "label",
  "source_note",
] as const;

export function normalizeRichWorkoutDraftToTrainingPlan({
  canonicalPlan,
  draft,
}: {
  canonicalPlan: TrainingPlanV2;
  draft: unknown;
}): RichWorkoutDraftNormalizationResult {
  const parsedDraft = richWorkoutDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    return failedNormalization(
      "rich_draft_schema_invalid",
      parsedDraft.error.issues
        .slice(0, 8)
        .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`),
    );
  }

  try {
    const draftByWorkoutKey = new Map(
      parsedDraft.data.workouts.map((workout) => [
        workoutKey(workout.workoutId, workout.date),
        workout,
      ]),
    );

    if (draftByWorkoutKey.size !== canonicalPlan.planned_workouts.length) {
      return failedNormalization("rich_draft_workout_count_mismatch", [
        `Expected ${canonicalPlan.planned_workouts.length} workouts but received ${draftByWorkoutKey.size}.`,
      ]);
    }

    const normalizedWorkouts = canonicalPlan.planned_workouts.map((baseWorkout) => {
      const draftWorkout = draftByWorkoutKey.get(
        workoutKey(baseWorkout.workout_id, baseWorkout.date),
      );

      if (!draftWorkout) {
        throw new RichDraftNormalizationError("rich_draft_missing_workout", [
          `${baseWorkout.workout_id} on ${baseWorkout.date} is missing from the rich draft.`,
        ]);
      }

      return normalizeDraftWorkout(baseWorkout, draftWorkout);
    });

    const parsedPlan = trainingPlanV2Schema.parse({
      ...canonicalPlan,
      source_kind: canonicalPlan.source_kind ?? "structured_authoring_v1",
      planned_workouts: normalizedWorkouts,
    });

    return {
      ok: true,
      canonicalPlan: parsedPlan,
      metadata: {
        status: "rich_draft_applied",
        source: "openai_rich_workout_draft",
        fallbackReason: null,
        reviewAssumptions: parsedDraft.data.assumptions.slice(0, 8),
      },
    };
  } catch (error) {
    if (error instanceof RichDraftNormalizationError) {
      return failedNormalization(error.reason, error.issues);
    }

    const message = error instanceof Error ? error.message : "Unknown rich draft normalizer error.";
    return failedNormalization("rich_draft_normalization_failed", [message]);
  }
}

export function buildDeterministicRichWorkoutFallbackMetadata(
  fallbackReason: string,
): RichWorkoutDraftMetadata {
  return {
    status: "deterministic_fallback",
    source: "deterministic_structured_generator",
    fallbackReason,
    reviewAssumptions: [
      "Hito used the deterministic structured generator because the rich workout draft did not pass backend validation.",
    ],
  };
}

export function buildRichWorkoutDraftNotRequestedMetadata(): RichWorkoutDraftMetadata {
  return {
    status: "not_requested",
    source: "deterministic_structured_generator",
    fallbackReason: null,
    reviewAssumptions: [],
  };
}

function normalizeDraftWorkout(
  baseWorkout: CanonicalWorkout,
  draftWorkout: DraftWorkout,
): CanonicalWorkout {
  if (baseWorkout.workout_type === "rest") {
    if (
      draftWorkout.workoutFamily !== "rest" ||
      draftWorkout.workoutIdentity !== "rest_and_recovery"
    ) {
      throw new RichDraftNormalizationError("rich_draft_changed_rest_day", [
        `${baseWorkout.date} is a protected rest day in canonical truth.`,
      ]);
    }

    return baseWorkout;
  }

  validateNonRestSegments(baseWorkout, draftWorkout);

  const resolvedWorkout = resolveCanonicalWorkoutModel({
    workoutType: baseWorkout.workout_type,
    workoutFamily: draftWorkout.workoutFamily,
    workoutIdentity: draftWorkout.workoutIdentity,
    calendarIconKey: draftWorkout.calendarIconKey,
    metricMode: baseWorkout.metric_mode ?? null,
    title: draftWorkout.title,
    steps: draftWorkout.segments.map((segment) => ({
      segment_type: segment.segmentType,
      label: segment.label,
      target: normalizeDraftTarget(segment.target, null, baseWorkout.metric_mode),
    })),
  });

  if (
    resolvedWorkout.workoutFamily !== draftWorkout.workoutFamily ||
    resolvedWorkout.calendarIconKey !== draftWorkout.calendarIconKey
  ) {
    throw new RichDraftNormalizationError("rich_draft_taxonomy_mismatch", [
      `${draftWorkout.workoutId} has inconsistent family/icon for ${draftWorkout.workoutIdentity}.`,
    ]);
  }

  const metricMode = normalizeSafeMetricMode(baseWorkout, draftWorkout);
  const segments = draftWorkout.segments.map((segment, index) =>
    normalizeDraftSegment(segment, index, baseWorkout, metricMode),
  );

  return {
    ...baseWorkout,
    workout_type: canonicalFamilyToLegacyWorkoutType(
      resolvedWorkout.workoutFamily,
      resolvedWorkout.workoutIdentity,
    ),
    source_workout_type: resolvedWorkout.workoutIdentity,
    workout_family: resolvedWorkout.workoutFamily,
    workout_identity: resolvedWorkout.workoutIdentity,
    calendar_icon_key: resolvedWorkout.calendarIconKey,
    goal_context: normalizeDraftGoalContext(draftWorkout.goalContext, baseWorkout),
    metric_mode: metricMode,
    title: draftWorkout.title,
    summary: draftWorkout.summary,
    segments,
  };
}

function validateNonRestSegments(baseWorkout: CanonicalWorkout, draftWorkout: DraftWorkout) {
  const segmentTypes = new Set(draftWorkout.segments.map((segment) => segment.segmentType));

  if (!segmentTypes.has("warmup")) {
    throw new RichDraftNormalizationError("rich_draft_missing_warmup", [
      `${draftWorkout.workoutId} needs a warmup segment.`,
    ]);
  }

  if (!draftWorkout.segments.some((segment) => MAIN_LIKE_SEGMENT_TYPES.has(segment.segmentType))) {
    throw new RichDraftNormalizationError("rich_draft_missing_main", [
      `${draftWorkout.workoutId} needs a main workout segment.`,
    ]);
  }

  if (!segmentTypes.has("cooldown")) {
    throw new RichDraftNormalizationError("rich_draft_missing_cooldown", [
      `${draftWorkout.workoutId} needs a cooldown segment.`,
    ]);
  }

  if (draftWorkout.date !== baseWorkout.date) {
    throw new RichDraftNormalizationError("rich_draft_date_mismatch", [
      `${draftWorkout.workoutId} tried to move ${baseWorkout.date} to ${draftWorkout.date}.`,
    ]);
  }
}

function normalizeDraftSegment(
  segment: DraftSegment,
  index: number,
  baseWorkout: CanonicalWorkout,
  metricMode: CanonicalMetricModeJson,
): CanonicalSegment {
  const baseSegment = findBaseSegmentForDraft(baseWorkout, segment, index);
  const prescription = normalizeDraftPrescription(segment, baseSegment);
  const repeatHasChildren =
    prescription.mode === "repeats" && Boolean(prescription.children?.length);

  return {
    segment_id: `${baseWorkout.workout_id}_seg_${index + 1}`,
    sequence: index + 1,
    segment_type: segment.segmentType,
    label: segment.label,
    guidance: segment.guidance,
    prescription,
    ...durationDistanceFromPrescription(prescription),
    ...(repeatHasChildren
      ? {}
      : { target: normalizeDraftTarget(segment.target, baseSegment?.target ?? null, metricMode) }),
  };
}

function normalizeDraftPrescription(
  segment: DraftSegment,
  baseSegment: CanonicalSegment | null,
): NonNullable<CanonicalSegment["prescription"]> {
  const prescription = segment.prescription;

  if (segment.segmentType === "rest" || segment.segmentType === "fueling") {
    return { mode: "none" };
  }

  if (prescription.mode === "none" && baseSegment?.prescription) {
    return baseSegment.prescription;
  }

  if (prescription.mode === "time" && prescription.durationMin) {
    return {
      mode: "time",
      duration_min: prescription.durationMin,
    };
  }

  if (prescription.mode === "distance" && prescription.distanceKm) {
    return {
      mode: "distance",
      distance_km: prescription.distanceKm,
    };
  }

  if (prescription.mode === "repeats") {
    const repeatChildren = normalizeDraftRepeatChildren(prescription.children);

    if (!prescription.repeatCount || repeatChildren.length === 0) {
      throw new RichDraftNormalizationError("rich_draft_invalid_repeat_prescription", [
        `${segment.segmentId} has an incomplete repeat prescription.`,
      ]);
    }

    return {
      mode: "repeats",
      repeat_count: prescription.repeatCount,
      children: repeatChildren,
    };
  }

  if (baseSegment?.prescription) {
    return baseSegment.prescription;
  }

  throw new RichDraftNormalizationError("rich_draft_invalid_prescription", [
    `${segment.segmentId} needs a valid time, distance, or repeat prescription.`,
  ]);
}

function normalizeDraftUnitPrescription(
  unit: DraftUnitPrescription,
): NonNullable<NonNullable<CanonicalSegment["prescription"]>["children"]>[number]["prescription"] {
  if (unit.mode === "time" && unit.durationMin) {
    return {
      mode: "time",
      duration_min: unit.durationMin,
    };
  }

  if (unit.mode === "distance" && unit.distanceKm) {
    return {
      mode: "distance",
      distance_km: unit.distanceKm,
    };
  }

  if (unit.mode === "none") {
    return { mode: "none" };
  }

  throw new RichDraftNormalizationError("rich_draft_invalid_repeat_child_prescription", [
    "Repeat child prescriptions need durationMin or distanceKm when mode is time or distance.",
  ]);
}

function normalizeDraftRepeatChildren(children: DraftRepeatChild[] | null | undefined) {
  return (children ?? []).map((child, index) => ({
    role: child.role,
    ...(child.label ? { label: child.label } : {}),
    sequence: child.sequence ?? index + 1,
    ...(child.guidance ? { guidance: child.guidance } : {}),
    prescription: normalizeDraftUnitPrescription(child.prescription),
    target: normalizeDraftTarget(child.target ?? emptyDraftTargetForRepeatChild(), null, null),
  }));
}

function emptyDraftTargetForRepeatChild(): DraftSegment["target"] {
  return {
    intensity: null,
    rpe: null,
    cue: null,
    hint: null,
    paceMinPerKmRange: null,
    pace: null,
    hrBpmRange: null,
    hrBpm: null,
  };
}

function durationDistanceFromPrescription(
  prescription: NonNullable<CanonicalSegment["prescription"]>,
) {
  if (prescription.mode === "time" && prescription.duration_min) {
    return { duration_min: prescription.duration_min };
  }

  if (prescription.mode === "distance" && prescription.distance_km) {
    return { distance_km: prescription.distance_km };
  }

  return {};
}

function normalizeDraftTarget(
  draftTarget: DraftSegment["target"],
  baseTarget: CanonicalSegment["target"] | null,
  metricMode: CanonicalMetricModeJson | null | undefined,
): CanonicalSegment["target"] {
  const target: NonNullable<CanonicalSegment["target"]> = {};

  if (draftTarget.intensity) {
    target.intensity = draftTarget.intensity;
  }

  if (draftTarget.rpe !== null) {
    target.rpe = draftTarget.rpe;
  }

  if (draftTarget.cue) {
    target.cue = draftTarget.cue;
  }

  if (draftTarget.hint) {
    target.hint = draftTarget.hint;
  }

  if (metricMode?.pace_targets_allowed && baseTarget) {
    copyTargetKeys(target, baseTarget, PACE_TARGET_KEYS);
  }

  if (metricMode?.hr_targets_allowed && baseTarget) {
    copyTargetKeys(target, baseTarget, HR_TARGET_KEYS);
  }

  return target;
}

function copyTargetKeys(
  target: NonNullable<CanonicalSegment["target"]>,
  source: CanonicalSegment["target"],
  keys: readonly string[],
) {
  if (!source) {
    return;
  }

  for (const key of keys) {
    const value = source[key as keyof typeof source];

    if (typeof value === "string" && value.trim()) {
      target[key as keyof typeof target] = value;
    }
  }
}

function normalizeSafeMetricMode(
  baseWorkout: CanonicalWorkout,
  draftWorkout: DraftWorkout,
): CanonicalMetricModeJson {
  const baseMetricMode = baseWorkout.metric_mode
    ? normalizeCanonicalMetricMode(baseWorkout.metric_mode)
    : null;
  const draftMetricMode = normalizeCanonicalMetricMode(draftWorkout.metricMode);
  const safeMetricMode = baseMetricMode ?? draftMetricMode;

  if (!safeMetricMode) {
    return {
      guidance: "effort",
      pace_targets_allowed: false,
      hr_targets_allowed: false,
      hr_target_source: "effort_only",
      reason:
        "Metric resolver keeps this workout effort-guided without numeric pace or HR targets.",
    };
  }

  return {
    ...toCanonicalMetricModeJson(safeMetricMode),
    pace_targets_allowed: Boolean(baseMetricMode?.paceTargetsAllowed),
    hr_targets_allowed: Boolean(baseMetricMode?.hrTargetsAllowed),
    reason: baseMetricMode?.reason ?? safeMetricMode.reason,
  };
}

function normalizeDraftGoalContext(
  draftGoalContext: DraftWorkout["goalContext"],
  baseWorkout: CanonicalWorkout,
): CanonicalWorkout["goal_context"] {
  const normalized =
    normalizeCanonicalGoalContext(draftGoalContext) ??
    normalizeCanonicalGoalContext(baseWorkout.goal_context);

  if (!normalized) {
    return baseWorkout.goal_context;
  }

  return {
    goal_type: normalized.goalType,
    ...(normalized.goalStyle ? { goal_style: normalized.goalStyle } : {}),
    ...(normalized.terrainFocus ? { terrain_focus: normalized.terrainFocus } : {}),
    ...(normalized.targetDate ? { target_date: normalized.targetDate } : {}),
    ...(normalized.targetTime ? { target_time: normalized.targetTime } : {}),
  };
}

function findBaseSegmentForDraft(
  baseWorkout: CanonicalWorkout,
  draftSegment: DraftSegment,
  index: number,
): CanonicalSegment | null {
  const byIndex = baseWorkout.segments[index];

  if (byIndex?.segment_type === draftSegment.segmentType) {
    return byIndex;
  }

  const byType = baseWorkout.segments.find(
    (segment) => segment.segment_type === draftSegment.segmentType,
  );

  return byType ?? byIndex ?? null;
}

function failedNormalization(
  reason: string,
  issues: string[],
): Extract<RichWorkoutDraftNormalizationResult, { ok: false }> {
  return {
    ok: false,
    reason,
    issues,
    fallback: buildDeterministicRichWorkoutFallbackMetadata(reason),
  };
}

function workoutKey(workoutId: string, date: string) {
  return `${workoutId}::${date}`;
}

class RichDraftNormalizationError extends Error {
  constructor(
    readonly reason: string,
    readonly issues: string[],
  ) {
    super(`${reason}: ${issues.join(" | ")}`);
  }
}

const richDraftGoalContextOpenAiSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["goalType", "goalStyle", "terrainFocus", "targetDate", "targetTime"],
  properties: {
    goalType: { type: "string", maxLength: 80 },
    goalStyle: { type: ["string", "null"], maxLength: 280 },
    terrainFocus: { type: ["string", "null"], enum: ["standard", "rolling", "mountain", null] },
    targetDate: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    targetTime: { type: ["string", "null"], maxLength: 32 },
  },
} as const;

const richDraftMetricModeOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["guidance", "paceTargetsAllowed", "hrTargetsAllowed", "reason"],
  properties: {
    guidance: { type: "string", enum: [...CANONICAL_METRIC_GUIDANCE_VALUES] },
    paceTargetsAllowed: { type: "boolean" },
    hrTargetsAllowed: { type: "boolean" },
    reason: { type: "string", maxLength: 200 },
  },
} as const;

const richDraftUnitPrescriptionOpenAiSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["mode", "durationMin", "distanceKm"],
  properties: {
    mode: { type: "string", enum: ["time", "distance", "none"] },
    durationMin: { type: ["number", "null"] },
    distanceKm: { type: ["number", "null"] },
  },
} as const;

const richDraftTargetOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["intensity", "rpe", "cue", "hint", "paceMinPerKmRange", "pace", "hrBpmRange", "hrBpm"],
  properties: {
    intensity: { type: ["string", "null"], maxLength: 280 },
    rpe: { type: ["string", "number", "null"] },
    cue: { type: ["string", "null"], maxLength: 280 },
    hint: { type: ["string", "null"], maxLength: 280 },
    paceMinPerKmRange: { type: ["string", "null"], maxLength: 280 },
    pace: { type: ["string", "null"], maxLength: 280 },
    hrBpmRange: { type: ["string", "null"], maxLength: 280 },
    hrBpm: { type: ["string", "null"], maxLength: 280 },
  },
} as const;

const richDraftRepeatChildOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["role", "label", "sequence", "guidance", "prescription", "target"],
  properties: {
    role: {
      type: "string",
      enum: ["warm_up", "run", "walk", "work", "recover", "finish", "cooldown"],
    },
    label: { type: ["string", "null"], maxLength: 280 },
    sequence: { type: ["integer", "null"] },
    guidance: { type: ["string", "null"], maxLength: 280 },
    prescription: richDraftUnitPrescriptionOpenAiSchema,
    target: richDraftTargetOpenAiSchema,
  },
} as const;

const richDraftSegmentPrescriptionOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "durationMin", "distanceKm", "repeatCount", "children"],
  properties: {
    mode: { type: "string", enum: ["time", "distance", "repeats", "none"] },
    durationMin: { type: ["number", "null"] },
    distanceKm: { type: ["number", "null"] },
    repeatCount: { type: ["integer", "null"] },
    children: {
      type: ["array", "null"],
      maxItems: 12,
      items: richDraftRepeatChildOpenAiSchema,
    },
  },
} as const;

const richDraftSegmentOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["segmentId", "segmentType", "label", "sequence", "prescription", "guidance", "target"],
  properties: {
    segmentId: { type: "string", maxLength: 120 },
    segmentType: {
      type: "string",
      enum: [
        "warmup",
        "main",
        "cooldown",
        "recovery",
        "rest",
        "mobility",
        "mobility_optional",
        "strength",
        "activation",
        "drills",
        "strides",
        "recovery_jog",
        "fueling",
        "tempo_block",
        "interval_block",
      ],
    },
    label: { type: "string", maxLength: 120 },
    sequence: { type: "integer" },
    prescription: richDraftSegmentPrescriptionOpenAiSchema,
    guidance: { type: "string", maxLength: 280 },
    target: richDraftTargetOpenAiSchema,
  },
} as const;

export const richWorkoutDraftOpenAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "assumptions", "workouts"],
  properties: {
    schemaVersion: { type: "string", enum: [RICH_WORKOUT_DRAFT_SCHEMA_VERSION] },
    assumptions: {
      type: "array",
      maxItems: 8,
      items: { type: "string", maxLength: 280 },
    },
    workouts: {
      type: "array",
      maxItems: 200,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "workoutId",
          "date",
          "workoutFamily",
          "workoutIdentity",
          "calendarIconKey",
          "title",
          "summary",
          "goalContext",
          "metricMode",
          "segments",
        ],
        properties: {
          workoutId: { type: "string", maxLength: 160 },
          date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          workoutFamily: { type: "string", enum: [...CANONICAL_WORKOUT_FAMILY_VALUES] },
          workoutIdentity: { type: "string", enum: [...CANONICAL_WORKOUT_IDENTITY_VALUES] },
          calendarIconKey: { type: "string", enum: [...CALENDAR_ICON_KEY_VALUES] },
          title: { type: "string", maxLength: 160 },
          summary: { type: "string", maxLength: 360 },
          goalContext: richDraftGoalContextOpenAiSchema,
          metricMode: richDraftMetricModeOpenAiSchema,
          segments: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: richDraftSegmentOpenAiSchema,
          },
        },
      },
    },
  },
} as const;
