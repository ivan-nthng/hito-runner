import {
  plannedWorkoutRepeatChildLabel,
  reduceRepeatChildrenToChildFirst,
  type PlannedWorkoutRepeatChildPrescription,
  type PlannedWorkoutRepeatChildRole,
  type PlannedWorkoutUnitPrescription,
} from "@/lib/planned-workout-block-contract";
import {
  normalizeCalendarIconKey,
  normalizeCanonicalGoalContext,
  normalizeCanonicalMetricMode,
  resolveCanonicalWorkoutModel,
  normalizeWorkoutFamily,
  normalizeWorkoutIdentity,
  toCanonicalMetricModeJson,
  type CalendarIconKey,
  type CanonicalGoalContext,
  type CanonicalMetricModeJson,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
  type WorkoutSegmentLike,
} from "@/lib/rich-workout-model";
import { stableJsonEqual } from "@/lib/review-token-signing";

export const AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE = "ai_authored_plan_guidance" as const;
export const WORKOUT_DOCUMENT_HYDRATION_LABEL = "Hydration" as const;
export const WORKOUT_DOCUMENT_HYDRATION_CUE = "Take water." as const;

export const AI_AUTHORED_PACE_PROVENANCE_VALUES = [
  "benchmark_backed",
  "goal_informed_ai_estimate",
  "no_benchmark_ai_estimate",
] as const;
export type AiAuthoredPaceProvenance = (typeof AI_AUTHORED_PACE_PROVENANCE_VALUES)[number];

export const PRIMARY_EXECUTION_MODE_VALUES = ["pace", "heart_rate", "effort", "run_walk"] as const;
export type PrimaryExecutionMode = (typeof PRIMARY_EXECUTION_MODE_VALUES)[number];

export type WorkoutDocumentType = "easy" | "steady_or_easy" | "rest" | "long_run" | "quality";

export interface WorkoutDocumentTarget {
  primary_execution_mode?: PrimaryExecutionMode;
  target_source?: string;
  intensity?: string;
  hr_bpm_range?: string;
  hr_bpm?: string;
  hr_bpm_cap?: number;
  hr_bpm_min?: number;
  hr_bpm_max?: number;
  hr_target_source?: string;
  label?: string;
  source_note?: string;
  pace_min_per_km_range?: string;
  pace_seconds_per_km?: number;
  pace_min_seconds_per_km?: number;
  pace_max_seconds_per_km?: number;
  pace_range_min_km?: string;
  pace?: string;
  rpe?: string | number;
  cadence_spm_range?: string;
  cue?: string;
  hint?: string;
  extra?: Record<string, string | number>;
}

export type WorkoutDocumentUnitPrescription = PlannedWorkoutUnitPrescription;
type WorkoutDocumentRepeatChildRole = PlannedWorkoutRepeatChildRole;
export type WorkoutDocumentRepeatChildPrescription =
  PlannedWorkoutRepeatChildPrescription<WorkoutDocumentTarget> & { segment_id: string };

export interface WorkoutDocumentPrescription {
  mode: "time" | "distance" | "repeats" | "none";
  duration_min?: number;
  distance_km?: number;
  repeat_count?: number;
  children?: WorkoutDocumentRepeatChildPrescription[];
}

export interface WorkoutDocumentSection {
  type: string;
  segment_id?: string;
  segment_type?: string;
  label?: string | null;
  sequence?: number;
  prescription?: WorkoutDocumentPrescription;
  guidance?: string | null;
  duration_min?: number;
  distance_km?: number;
  repeats?: number;
  /**
   * Materialized readback for current timeline consumers. Repeat prescription.children
   * remains the authoritative persisted structure.
   */
  children?: WorkoutDocumentSection[];
  target?: WorkoutDocumentTarget;
}

export interface WorkoutDocumentContent<
  TMetricMode = CanonicalMetricModeJson,
  TSourceWorkoutType extends string | null = string | null,
> {
  workoutType: WorkoutDocumentType;
  sourceWorkoutType: TSourceWorkoutType;
  workoutFamily: CanonicalWorkoutFamily;
  workoutIdentity: CanonicalWorkoutIdentity;
  calendarIconKey: CalendarIconKey;
  metricMode: TMetricMode;
  title: string;
  notes: string | null;
  steps: WorkoutDocumentSection[];
}

export interface WorkoutDocument extends WorkoutDocumentContent {
  workoutDate: string;
  weekday: string;
  weekNumber: number;
  phase: string;
  sourceWorkoutId: string | null;
  goalContext: CanonicalGoalContext | null;
  plannedRpe: number | null;
  estimatedFatigue: string | null;
  recoveryPriority: string | null;
  displayOrder: number;
}

export type WorkoutDocumentValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export interface PersistedWorkoutDocumentRow {
  workout_date: unknown;
  weekday: unknown;
  week_number: unknown;
  phase: unknown;
  workout_type: unknown;
  source_workout_id: unknown;
  source_workout_type: unknown;
  workout_family: unknown;
  workout_identity: unknown;
  calendar_icon_key: unknown;
  goal_context: unknown;
  metric_mode: unknown;
  title: unknown;
  notes: unknown;
  planned_rpe: unknown;
  estimated_fatigue: unknown;
  recovery_priority: unknown;
  steps: unknown;
  display_order: unknown;
}

/** Strict authoring-boundary parser for the canonical camel-case document vocabulary. */
export function normalizeWorkoutDocument(
  value: unknown,
): WorkoutDocumentValidationResult<WorkoutDocument> {
  const document = unknownRecord(value);

  if (!document) {
    return invalidDocument("The workout document is invalid.");
  }

  return normalizePersistedWorkoutDocument({
    workout_date: document.workoutDate,
    weekday: document.weekday,
    week_number: document.weekNumber,
    phase: document.phase,
    workout_type: document.workoutType,
    source_workout_id: document.sourceWorkoutId,
    source_workout_type: document.sourceWorkoutType,
    workout_family: document.workoutFamily,
    workout_identity: document.workoutIdentity,
    calendar_icon_key: document.calendarIconKey,
    goal_context: document.goalContext,
    metric_mode: document.metricMode,
    title: document.title,
    notes: document.notes,
    planned_rpe: document.plannedRpe,
    estimated_fatigue: document.estimatedFatigue,
    recovery_priority: document.recoveryPriority,
    steps: document.steps,
    display_order: document.displayOrder,
  });
}

/** Strict write-boundary parser. Readback callers should keep using readWorkoutDocumentSections. */
export function normalizePersistedWorkoutDocument(
  row: PersistedWorkoutDocumentRow,
): WorkoutDocumentValidationResult<WorkoutDocument> {
  const workoutDate = readIsoDate(row.workout_date);
  const weekday = readString(row.weekday);
  const phase = readString(row.phase);
  const weekNumber = readPositiveInteger(row.week_number);
  const displayOrder = readNonNegativeInteger(row.display_order);
  const sourceWorkoutId = readNullableString(row.source_workout_id);
  const sourceWorkoutType = readNullableString(row.source_workout_type);
  const goalContext = normalizeNullableGoalContext(row.goal_context);
  const plannedRpe = readNullableRpe(row.planned_rpe);
  const estimatedFatigue = readNullableString(row.estimated_fatigue);
  const recoveryPriority = readNullableString(row.recovery_priority);

  if (
    !workoutDate ||
    !weekday ||
    !phase ||
    !weekNumber ||
    displayOrder == null ||
    sourceWorkoutId === INVALID_NULLABLE_STRING ||
    sourceWorkoutType === INVALID_NULLABLE_STRING ||
    goalContext === INVALID_GOAL_CONTEXT ||
    plannedRpe === INVALID_RPE ||
    estimatedFatigue === INVALID_NULLABLE_STRING ||
    recoveryPriority === INVALID_NULLABLE_STRING
  ) {
    return invalidDocument("The persisted workout identity or document metadata is invalid.");
  }

  const content = normalizeWorkoutDocumentContent({
    workoutType: row.workout_type,
    sourceWorkoutType,
    workoutFamily: row.workout_family,
    workoutIdentity: row.workout_identity,
    calendarIconKey: row.calendar_icon_key,
    metricMode: row.metric_mode,
    title: row.title,
    notes: row.notes,
    steps: row.steps,
  });

  if (!content.ok) {
    return content;
  }

  return {
    ok: true,
    value: {
      ...content.value,
      workoutDate,
      weekday,
      weekNumber,
      phase,
      sourceWorkoutId,
      goalContext,
      plannedRpe,
      estimatedFatigue,
      recoveryPriority,
      displayOrder,
    },
  };
}

export function normalizeWorkoutDocumentContent(
  value: unknown,
): WorkoutDocumentValidationResult<WorkoutDocumentContent> {
  const record = unknownRecord(value);
  const workoutType = readWorkoutDocumentType(record?.workoutType);
  const sourceWorkoutType = readNullableString(record?.sourceWorkoutType);
  const workoutFamily = normalizeWorkoutFamily(record?.workoutFamily);
  const workoutIdentity = normalizeWorkoutIdentity(record?.workoutIdentity);
  const calendarIconKey = normalizeCalendarIconKey(record?.calendarIconKey);
  const explicitMetricMode = normalizeCanonicalMetricMode(record?.metricMode);
  const title = readString(record?.title);
  const notes = readNullableString(record?.notes);
  const steps = normalizeWorkoutDocumentSectionsForWrite(record?.steps);

  if (
    !workoutType ||
    sourceWorkoutType === INVALID_NULLABLE_STRING ||
    !workoutFamily ||
    !workoutIdentity ||
    !calendarIconKey ||
    (record?.metricMode != null && !explicitMetricMode) ||
    !title ||
    notes === INVALID_NULLABLE_STRING ||
    !steps.ok ||
    (workoutType !== "rest" && steps.value.length === 0)
  ) {
    return invalidDocument(steps.ok ? "The workout document is invalid." : steps.message);
  }

  const canonicalModel = resolveCanonicalWorkoutModel({
    workoutType,
    sourceWorkoutType,
    workoutFamily,
    workoutIdentity,
    calendarIconKey,
    metricMode: explicitMetricMode,
    title,
    steps: steps.value as unknown as WorkoutSegmentLike[],
  });
  if (
    canonicalModel.workoutFamily !== workoutFamily ||
    canonicalModel.workoutIdentity !== workoutIdentity ||
    canonicalModel.calendarIconKey !== calendarIconKey
  ) {
    return invalidDocument("The workout document semantics are internally inconsistent.");
  }

  return {
    ok: true,
    value: {
      workoutType,
      sourceWorkoutType,
      workoutFamily,
      workoutIdentity,
      calendarIconKey,
      metricMode: toCanonicalMetricModeJson(canonicalModel.metricMode),
      title,
      notes,
      steps: steps.value,
    },
  };
}

export function readWorkoutDocumentSections(value: unknown): WorkoutDocumentSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord) as unknown as WorkoutDocumentSection[];
}

export type WorkoutDocumentNestedSegmentIdentityBackfillResult =
  | { ok: true; value: unknown[]; changed: boolean }
  | { ok: false; message: string };

/**
 * Adds identity only to legacy Repeat children that do not yet have it. The caller owns
 * eligibility and persistence; this helper deliberately does not normalize or rewrite any
 * other persisted workout truth.
 */
export function backfillWorkoutDocumentNestedSegmentIds(
  value: unknown,
  createSegmentId: () => string = () => globalThis.crypto.randomUUID(),
): WorkoutDocumentNestedSegmentIdentityBackfillResult {
  if (!Array.isArray(value)) {
    return invalidDocument("The persisted workout requires an ordered steps array.");
  }

  const usedIds = new Set<string>();
  for (const section of value) {
    const record = unknownRecord(section);
    const sectionId = readString(record?.segment_id);
    if (sectionId && usedIds.has(sectionId)) {
      return invalidDocument("Workout sections require globally unique stable segment IDs.");
    }
    if (sectionId) usedIds.add(sectionId);

    const prescription = unknownRecord(record?.prescription);
    if (prescription?.mode !== "repeats") continue;
    if (!Array.isArray(prescription.children)) {
      return invalidDocument(
        "Repeat prescriptions require ordered children before identity backfill.",
      );
    }

    const materializedChildren = record?.children;
    if (
      materializedChildren !== undefined &&
      (!Array.isArray(materializedChildren) ||
        materializedChildren.length !== prescription.children.length)
    ) {
      return invalidDocument("Materialized repeat children do not match authoritative children.");
    }

    for (let index = 0; index < prescription.children.length; index += 1) {
      const childRecord = unknownRecord(prescription.children[index]);
      const materializedRecord = Array.isArray(materializedChildren)
        ? unknownRecord(materializedChildren[index])
        : null;
      if (!childRecord) {
        return invalidDocument("Repeat children must be objects before identity backfill.");
      }
      if (Array.isArray(materializedChildren) && !materializedRecord) {
        return invalidDocument("Materialized repeat children must be objects.");
      }

      const authoritativeId = readString(childRecord.segment_id);
      const materializedId = readString(materializedRecord?.segment_id);
      if (
        (childRecord.segment_id !== undefined && !authoritativeId) ||
        (materializedRecord?.segment_id !== undefined && !materializedId) ||
        (authoritativeId && materializedId && authoritativeId !== materializedId)
      ) {
        return invalidDocument("Materialized repeat child identity conflicts with its authority.");
      }
      const existingId = authoritativeId ?? materializedId;
      if (existingId) {
        if (usedIds.has(existingId)) {
          return invalidDocument("Repeat children require globally unique stable segment IDs.");
        }
        usedIds.add(existingId);
      }
    }
  }

  let changed = false;
  let steps: unknown[];
  try {
    steps = value.map((section) => {
      const record = unknownRecord(section)!;
      const prescription = unknownRecord(record.prescription);
      if (prescription?.mode !== "repeats" || !Array.isArray(prescription.children)) {
        return section;
      }

      const sourceMaterializedChildren = Array.isArray(record.children) ? record.children : null;
      const assignedChildIds: string[] = [];
      const children = prescription.children.map((child, index) => {
        const childRecord = unknownRecord(child)!;
        const existingId =
          readString(childRecord.segment_id) ??
          readString(unknownRecord(sourceMaterializedChildren?.[index])?.segment_id);
        if (existingId) {
          assignedChildIds.push(existingId);
          if (readString(childRecord.segment_id)) return child;
          changed = true;
          return { ...childRecord, segment_id: existingId };
        }

        const segmentId = createUniqueSegmentId(createSegmentId, usedIds);
        assignedChildIds.push(segmentId);
        usedIds.add(segmentId);
        changed = true;
        return { ...childRecord, segment_id: segmentId };
      });

      let materializedChildren: unknown = sourceMaterializedChildren ?? record.children;
      if (sourceMaterializedChildren) {
        materializedChildren = sourceMaterializedChildren.map((child, index) => {
          const childRecord = unknownRecord(child);
          const existingId = readString(childRecord?.segment_id);
          if (existingId) return child;
          changed = true;
          return { ...childRecord, segment_id: assignedChildIds[index] };
        });
      }

      return {
        ...record,
        prescription: { ...prescription, children },
        ...(materializedChildren !== undefined ? { children: materializedChildren } : {}),
      };
    });
  } catch (error) {
    return invalidDocument(
      error instanceof Error ? error.message : "Nested segment identity backfill failed.",
    );
  }

  return { ok: true, value: steps, changed };
}

function createUniqueSegmentId(createSegmentId: () => string, usedIds: ReadonlySet<string>) {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const candidate = createSegmentId().trim();
    if (candidate && !usedIds.has(candidate)) return candidate;
  }

  throw new Error("A unique nested segment ID could not be generated.");
}

export function normalizeWorkoutDocumentTarget(value: unknown): WorkoutDocumentTarget | undefined {
  const target = unknownRecord(value);
  if (!target) {
    return undefined;
  }

  const extra: Record<string, string | number> = {};
  const nestedExtra = unknownRecord(target.extra);

  for (const [key, entry] of [...Object.entries(nestedExtra ?? {}), ...Object.entries(target)]) {
    if (
      !WORKOUT_DOCUMENT_TARGET_KEY_SET.has(key) &&
      (typeof entry === "string" || (typeof entry === "number" && Number.isFinite(entry)))
    ) {
      extra[key] = entry;
    }
  }

  const paceRange = readString(target.pace_min_per_km_range ?? target.pace_range_min_km);

  return {
    ...primaryExecutionModeField(target.primary_execution_mode),
    ...stringField("target_source", target.target_source),
    ...stringField("intensity", target.intensity),
    ...stringField("hr_bpm_range", target.hr_bpm_range),
    ...stringField("hr_bpm", target.hr_bpm),
    ...numberField("hr_bpm_cap", target.hr_bpm_cap),
    ...numberField("hr_bpm_min", target.hr_bpm_min),
    ...numberField("hr_bpm_max", target.hr_bpm_max),
    ...stringField("hr_target_source", target.hr_target_source),
    ...stringField("label", target.label),
    ...stringField("source_note", target.source_note),
    ...(paceRange ? { pace_min_per_km_range: paceRange } : {}),
    ...stringField("pace", target.pace),
    ...numberField("pace_seconds_per_km", target.pace_seconds_per_km),
    ...numberField("pace_min_seconds_per_km", target.pace_min_seconds_per_km),
    ...numberField("pace_max_seconds_per_km", target.pace_max_seconds_per_km),
    ...stringOrNumberField("rpe", target.rpe),
    ...stringField("cadence_spm_range", target.cadence_spm_range),
    ...stringField("cue", target.cue),
    ...stringField("hint", target.hint),
    ...(Object.keys(extra).length > 0 ? { extra } : {}),
  };
}

export function workoutDocumentTargetToWire(
  target: WorkoutDocumentTarget | undefined,
): Record<string, string | number> | null {
  if (!target) {
    return null;
  }

  const output: Record<string, string | number> = {};
  const push = (key: string, value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      output[key] = value;
    } else if (typeof value === "string" && value.trim()) {
      output[key] = value.trim();
    }
  };

  push("target_source", target.target_source);
  push("primary_execution_mode", target.primary_execution_mode);
  push("intensity", target.intensity);
  push("hr_bpm_range", target.hr_bpm_range);
  push("hr_bpm", target.hr_bpm);
  push("hr_bpm_cap", target.hr_bpm_cap);
  push("hr_bpm_min", target.hr_bpm_min);
  push("hr_bpm_max", target.hr_bpm_max);
  push("hr_target_source", target.hr_target_source);
  push("label", target.label);
  push("source_note", target.source_note);
  push("pace_min_per_km_range", target.pace_min_per_km_range ?? target.pace_range_min_km);
  push("pace", target.pace);
  push("pace_seconds_per_km", target.pace_seconds_per_km);
  push("pace_min_seconds_per_km", target.pace_min_seconds_per_km);
  push("pace_max_seconds_per_km", target.pace_max_seconds_per_km);
  push("rpe", target.rpe);
  push("cadence_spm_range", target.cadence_spm_range);
  push("cue", target.cue);
  push("hint", target.hint);

  for (const [key, entry] of Object.entries(target.extra ?? {})) {
    push(key, entry);
  }

  return Object.keys(output).length > 0 ? output : null;
}

export function workoutDocumentRepeatCount(section: WorkoutDocumentSection): number | null {
  const value = section.repeats ?? section.prescription?.repeat_count;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function workoutDocumentRepeatChildren(
  section: WorkoutDocumentSection,
): WorkoutDocumentSection[] {
  if (section.prescription?.mode === "repeats") {
    const canonicalChildren = reduceRepeatChildrenToChildFirst<WorkoutDocumentTarget>({
      children: section.prescription.children,
      normalizeTarget: normalizeWorkoutDocumentTarget,
    }).children;

    if (canonicalChildren.length > 0) {
      return canonicalChildren.map(workoutDocumentRepeatChildToSection);
    }
  }

  return section.children ?? [];
}

/** The canonical timed-work calculation for review, persistence, and readback. */
export function workoutDocumentExecutableDurationMin(section: WorkoutDocumentSection): number {
  const directDuration = readPositiveDuration(
    section.duration_min ?? section.prescription?.duration_min,
  );
  const repeatCount = workoutDocumentRepeatCount(section);
  const children = workoutDocumentRepeatChildren(section);

  if (repeatCount && children.length > 0) {
    return (
      directDuration +
      repeatCount *
        children.reduce((total, child) => total + workoutDocumentExecutableDurationMin(child), 0)
    );
  }

  return directDuration;
}

export function workoutDocumentExecutableDurationForSections(
  sections: readonly WorkoutDocumentSection[],
): number {
  return sections.reduce(
    (total, section) => total + workoutDocumentExecutableDurationMin(section),
    0,
  );
}

function workoutDocumentRepeatChildToSection(
  child: PlannedWorkoutRepeatChildPrescription<WorkoutDocumentTarget>,
): WorkoutDocumentSection {
  const prescription = { ...child.prescription };

  return {
    type: workoutDocumentSectionTypeForRepeatChild(child.role),
    ...(child.segment_id ? { segment_id: child.segment_id } : {}),
    segment_type: child.role,
    label: child.label ?? plannedWorkoutRepeatChildLabel(child.role),
    sequence: child.sequence,
    prescription,
    ...(child.guidance ? { guidance: child.guidance } : {}),
    ...(prescription.mode === "time" ? { duration_min: prescription.duration_min } : {}),
    ...(prescription.mode === "distance" ? { distance_km: prescription.distance_km } : {}),
    ...(child.target ? { target: { ...child.target } } : {}),
  };
}

export function workoutDocumentRepeatChildRoleForSection(
  section: WorkoutDocumentSection,
): WorkoutDocumentRepeatChildRole | null {
  const role = (section.segment_type ?? section.type).trim().toLowerCase();

  switch (role) {
    case "warm_up":
    case "warmup":
      return "warm_up";
    case "walk":
      return "walk";
    case "run":
      return "run";
    case "work":
      return "work";
    case "recover":
    case "recovery":
      return "recover";
    case "finish":
      return "finish";
    case "cooldown":
    case "cool_down":
      return "cooldown";
    default:
      return null;
  }
}

const INVALID_NULLABLE_STRING = Symbol("invalid_nullable_string");
const INVALID_GOAL_CONTEXT = Symbol("invalid_goal_context");
const INVALID_RPE = Symbol("invalid_rpe");
const WORKOUT_DOCUMENT_TYPE_VALUES = new Set<WorkoutDocumentType>([
  "easy",
  "steady_or_easy",
  "rest",
  "long_run",
  "quality",
]);

function normalizeWorkoutDocumentSectionsForWrite(
  value: unknown,
): WorkoutDocumentValidationResult<WorkoutDocumentSection[]> {
  if (!Array.isArray(value)) {
    return invalidDocument("The workout document requires an ordered steps array.");
  }

  const sections: WorkoutDocumentSection[] = [];
  const segmentIds = new Set<string>();

  for (let index = 0; index < value.length; index += 1) {
    const section = normalizeWorkoutDocumentSectionForWrite(value[index], index);
    if (!section.ok) {
      return section;
    }

    const sectionIds = [
      section.value.segment_id,
      ...workoutDocumentRepeatChildren(section.value).map((child) => child.segment_id),
    ];
    if (sectionIds.some((segmentId) => !segmentId || segmentIds.has(segmentId))) {
      return invalidDocument("Workout sections require globally unique stable segment IDs.");
    }

    sectionIds.forEach((segmentId) => segmentIds.add(segmentId!));
    sections.push(section.value);
  }

  return { ok: true, value: sections };
}

function normalizeWorkoutDocumentSectionForWrite(
  value: unknown,
  index: number,
): WorkoutDocumentValidationResult<WorkoutDocumentSection> {
  const record = unknownRecord(value);
  const type = readString(record?.type);
  const segmentId = readString(record?.segment_id);
  const segmentType = readOptionalString(record?.segment_type);
  const label = readOptionalNullableString(record?.label);
  const sequence = readPositiveInteger(record?.sequence);
  const guidance = readOptionalNullableString(record?.guidance);
  const prescription = normalizeWorkoutDocumentPrescriptionForWrite(record?.prescription);
  const target = normalizeWorkoutDocumentTargetForWrite(record?.target);

  if (
    !record ||
    !type ||
    !segmentId ||
    segmentType === INVALID_NULLABLE_STRING ||
    label === INVALID_NULLABLE_STRING ||
    !sequence ||
    guidance === INVALID_NULLABLE_STRING ||
    !prescription.ok ||
    !target.ok
  ) {
    return invalidDocument(
      !prescription.ok
        ? prescription.message
        : !target.ok
          ? target.message
          : `Workout section ${index + 1} is invalid.`,
    );
  }

  const duration = readOptionalPositiveNumber(record.duration_min);
  const distance = readOptionalPositiveNumber(record.distance_km);
  const repeats = readOptionalPositiveInteger(record.repeats);
  if (duration === false || distance === false || repeats === false) {
    return invalidDocument(`Workout section ${index + 1} has an invalid executable value.`);
  }

  const resolvedPrescription = prescription.value;
  if (
    resolvedPrescription &&
    ((duration != null &&
      resolvedPrescription.duration_min != null &&
      duration !== resolvedPrescription.duration_min) ||
      (distance != null &&
        resolvedPrescription.distance_km != null &&
        distance !== resolvedPrescription.distance_km) ||
      (repeats != null &&
        resolvedPrescription.repeat_count != null &&
        repeats !== resolvedPrescription.repeat_count))
  ) {
    return invalidDocument(`Workout section ${index + 1} has conflicting executable truth.`);
  }

  const section: WorkoutDocumentSection = {
    type,
    segment_id: segmentId,
    ...(segmentType ? { segment_type: segmentType } : {}),
    ...(label !== undefined ? { label } : {}),
    sequence,
    ...(resolvedPrescription ? { prescription: resolvedPrescription } : {}),
    ...(guidance !== undefined ? { guidance } : {}),
    ...(duration != null ? { duration_min: duration } : {}),
    ...(distance != null ? { distance_km: distance } : {}),
    ...(repeats != null ? { repeats } : {}),
    ...(target.value ? { target: target.value } : {}),
  };

  if (resolvedPrescription?.mode === "repeats") {
    if (target.value) {
      return invalidDocument("Repeat parents cannot own executable target truth.");
    }

    const derivedChildren = workoutDocumentRepeatChildren(section);
    if (record.children !== undefined) {
      const materializedChildren = normalizeMaterializedRepeatChildren(record.children);
      if (
        !materializedChildren.ok ||
        !stableJsonEqual(materializedChildren.value, derivedChildren)
      ) {
        return invalidDocument(
          "Materialized repeat children do not match authoritative prescription children.",
        );
      }
    }
    section.children = derivedChildren;
  } else if (record.children !== undefined) {
    return invalidDocument("Only repeat prescriptions may include materialized children.");
  }

  return { ok: true, value: section };
}

function normalizeWorkoutDocumentPrescriptionForWrite(
  value: unknown,
): WorkoutDocumentValidationResult<WorkoutDocumentPrescription | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  const record = unknownRecord(value);
  const mode = readString(record?.mode);
  if (!record || !mode || !["time", "distance", "repeats", "none"].includes(mode)) {
    return invalidDocument("The workout prescription mode is invalid.");
  }

  const duration = readOptionalPositiveNumber(record.duration_min);
  const distance = readOptionalPositiveNumber(record.distance_km);
  const repeatCount = readOptionalPositiveInteger(record.repeat_count);
  if (duration === false || distance === false || repeatCount === false) {
    return invalidDocument("The workout prescription has an invalid executable value.");
  }

  if (mode === "time" && (duration == null || distance != null || repeatCount != null)) {
    return invalidDocument("Time prescriptions require only a positive duration.");
  }
  if (mode === "distance" && (distance == null || duration != null || repeatCount != null)) {
    return invalidDocument("Distance prescriptions require only a positive distance.");
  }
  if (mode === "none" && (duration != null || distance != null || repeatCount != null)) {
    return invalidDocument("None prescriptions cannot contain executable values.");
  }

  if (mode !== "repeats") {
    if (record.children !== undefined) {
      return invalidDocument("Only repeat prescriptions may own ordered children.");
    }
    return {
      ok: true,
      value: {
        mode,
        ...(duration != null ? { duration_min: duration } : {}),
        ...(distance != null ? { distance_km: distance } : {}),
      } as WorkoutDocumentPrescription,
    };
  }

  if (!repeatCount || !Array.isArray(record.children) || record.children.length === 0) {
    return invalidDocument("Repeat prescriptions require a count and ordered children.");
  }

  const children: WorkoutDocumentRepeatChildPrescription[] = [];
  const childSegmentIds = new Set<string>();
  for (let index = 0; index < record.children.length; index += 1) {
    const child = normalizeWorkoutDocumentRepeatChildForWrite(record.children[index], index);
    if (!child.ok) {
      return child;
    }
    if (childSegmentIds.has(child.value.segment_id)) {
      return invalidDocument("Repeat children require unique stable segment IDs.");
    }
    childSegmentIds.add(child.value.segment_id);
    children.push(child.value);
  }

  return { ok: true, value: { mode: "repeats", repeat_count: repeatCount, children } };
}

function normalizeWorkoutDocumentRepeatChildForWrite(
  value: unknown,
  index: number,
): WorkoutDocumentValidationResult<WorkoutDocumentRepeatChildPrescription> {
  const record = unknownRecord(value);
  const segmentId = readString(record?.segment_id);
  const role = readString(record?.role);
  const label = readOptionalString(record?.label);
  const sequence = readPositiveInteger(record?.sequence);
  const guidance = readOptionalString(record?.guidance);
  const prescription = normalizeWorkoutDocumentPrescriptionForWrite(record?.prescription);
  const target = normalizeWorkoutDocumentTargetForWrite(record?.target);

  if (
    !record ||
    !segmentId ||
    !role ||
    !["warm_up", "run", "walk", "work", "recover", "finish", "cooldown"].includes(role) ||
    label === INVALID_NULLABLE_STRING ||
    !sequence ||
    guidance === INVALID_NULLABLE_STRING ||
    !prescription.ok ||
    !prescription.value ||
    prescription.value.mode === "repeats" ||
    !target.ok
  ) {
    return invalidDocument(`Repeat child ${index + 1} is invalid.`);
  }

  return {
    ok: true,
    value: {
      segment_id: segmentId,
      role: role as WorkoutDocumentRepeatChildRole,
      ...(label ? { label } : {}),
      sequence,
      ...(guidance ? { guidance } : {}),
      prescription: prescription.value as WorkoutDocumentUnitPrescription,
      ...(target.value ? { target: target.value } : {}),
    },
  };
}

function normalizeMaterializedRepeatChildren(
  value: unknown,
): WorkoutDocumentValidationResult<WorkoutDocumentSection[]> {
  if (!Array.isArray(value)) {
    return invalidDocument("Materialized repeat children must be an array.");
  }

  const normalized: WorkoutDocumentSection[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const record = unknownRecord(value[index]);
    const type = readString(record?.type);
    const segmentId = readString(record?.segment_id);
    const segmentType = readOptionalString(record?.segment_type);
    const label = readOptionalNullableString(record?.label);
    const sequence = readPositiveInteger(record?.sequence);
    const guidance = readOptionalNullableString(record?.guidance);
    const prescription = normalizeWorkoutDocumentPrescriptionForWrite(record?.prescription);
    const target = normalizeWorkoutDocumentTargetForWrite(record?.target);
    if (
      !record ||
      !type ||
      !segmentId ||
      !sequence ||
      segmentType === INVALID_NULLABLE_STRING ||
      label === INVALID_NULLABLE_STRING ||
      guidance === INVALID_NULLABLE_STRING ||
      !prescription.ok ||
      !prescription.value ||
      prescription.value.mode === "repeats" ||
      !target.ok
    ) {
      return invalidDocument(`Materialized repeat child ${index + 1} is invalid.`);
    }

    normalized.push({
      type,
      segment_id: segmentId,
      ...(segmentType ? { segment_type: segmentType } : {}),
      ...(label !== undefined ? { label } : {}),
      sequence,
      prescription: prescription.value,
      ...(guidance !== undefined ? { guidance } : {}),
      ...(prescription.value.mode === "time"
        ? { duration_min: prescription.value.duration_min }
        : {}),
      ...(prescription.value.mode === "distance"
        ? { distance_km: prescription.value.distance_km }
        : {}),
      ...(target.value ? { target: target.value } : {}),
    });
  }

  return { ok: true, value: normalized };
}

function normalizeWorkoutDocumentTargetForWrite(
  value: unknown,
): WorkoutDocumentValidationResult<WorkoutDocumentTarget | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  const record = unknownRecord(value);
  if (!record) {
    return invalidDocument("Workout targets must be objects.");
  }

  const nestedExtra = unknownRecord(record.extra);
  if (record.extra !== undefined && !nestedExtra) {
    return invalidDocument("Workout target extras must be scalar metadata.");
  }

  for (const [key, entry] of Object.entries(record)) {
    if (key === "extra") continue;
    if (!WORKOUT_DOCUMENT_TARGET_KEY_SET.has(key)) {
      return invalidDocument(`Workout target field ${key} is unknown.`);
    }
    if (typeof entry !== "string" && !(typeof entry === "number" && Number.isFinite(entry))) {
      return invalidDocument(`Workout target field ${key} is invalid.`);
    }
    if (typeof entry === "string" && !entry.trim()) {
      return invalidDocument(`Workout target field ${key} is empty.`);
    }
  }

  for (const [key, entry] of Object.entries(nestedExtra ?? {})) {
    if (typeof entry !== "string" && !(typeof entry === "number" && Number.isFinite(entry))) {
      return invalidDocument(`Workout target extra ${key} is invalid.`);
    }
    if (record[key] !== undefined && !Object.is(record[key], entry)) {
      return invalidDocument(`Workout target extra ${key} conflicts with its canonical field.`);
    }
  }

  if (
    record.primary_execution_mode !== undefined &&
    !PRIMARY_EXECUTION_MODE_VALUES.includes(record.primary_execution_mode as PrimaryExecutionMode)
  ) {
    return invalidDocument("The workout target execution mode is invalid.");
  }

  const shapeIssue = validateWorkoutDocumentTargetShape(record);
  if (shapeIssue) {
    return invalidDocument(shapeIssue);
  }

  const normalized = normalizeWorkoutDocumentTarget(record);
  return normalized && Object.keys(normalized).length > 0
    ? { ok: true, value: normalized }
    : invalidDocument("Workout targets cannot be empty.");
}

function validateWorkoutDocumentTargetShape(record: Record<string, unknown>): string | null {
  const mode = record.primary_execution_mode as PrimaryExecutionMode | undefined;
  const targetSource = readString(record.target_source);
  const hrTargetSource = readString(record.hr_target_source);
  const pace = readString(record.pace);
  const canonicalPaceRange = readString(record.pace_min_per_km_range);
  const legacyPaceRange = readString(record.pace_range_min_km);
  const paceRange = canonicalPaceRange ?? legacyPaceRange;
  const hasPaceValues = Boolean(
    pace ||
    paceRange ||
    record.pace_seconds_per_km !== undefined ||
    record.pace_min_seconds_per_km !== undefined ||
    record.pace_max_seconds_per_km !== undefined,
  );
  const hasHrValues = Boolean(
    readString(record.hr_bpm_range) ||
    readString(record.hr_bpm) ||
    record.hr_bpm_cap !== undefined ||
    record.hr_bpm_min !== undefined ||
    record.hr_bpm_max !== undefined,
  );
  const hasRpe = record.rpe !== undefined;

  if (canonicalPaceRange && legacyPaceRange && canonicalPaceRange !== legacyPaceRange) {
    return "Workout pace range aliases conflict.";
  }
  if (
    record.hr_target_source !== undefined &&
    (!hrTargetSource || !WORKOUT_DOCUMENT_HR_TARGET_SOURCE_VALUES.has(hrTargetSource))
  ) {
    return "Workout targets require a known heart-rate provenance source.";
  }
  if (!mode) {
    if (targetSource || hrTargetSource) {
      return "Supplemental target context cannot claim executable target provenance.";
    }
    return hasPaceValues || hasHrValues || hasRpe
      ? "Executable workout targets require an explicit execution mode."
      : null;
  }
  if (!targetSource) {
    return "Executable workout targets require target provenance.";
  }

  if (mode === "pace") {
    if (hasHrValues || hasRpe) {
      return "Pace targets cannot contain heart-rate or RPE values.";
    }
    if (Boolean(pace) === Boolean(paceRange)) {
      return "Pace targets require exactly one exact pace or pace range.";
    }
    if (hrTargetSource && hrTargetSource !== "effort_only") {
      return "Pace targets may retain only effort-only heart-rate context.";
    }

    const exactSeconds = pace ? parsePaceSeconds(pace) : null;
    const rangeSeconds = paceRange
      ? parsePaceRangeSeconds(paceRange)
      : pace
        ? parsePaceRangeSeconds(pace)
        : null;
    if ((pace && exactSeconds == null && !rangeSeconds) || (paceRange && !rangeSeconds)) {
      return "Workout pace targets must use a valid min:sec per kilometre shape.";
    }
    if (
      record.pace_seconds_per_km !== undefined &&
      (!Number.isInteger(record.pace_seconds_per_km) ||
        (record.pace_seconds_per_km as number) <= 0 ||
        exactSeconds == null ||
        record.pace_seconds_per_km !== exactSeconds)
    ) {
      return "Exact pace seconds must match the canonical pace value.";
    }
    const minSeconds = record.pace_min_seconds_per_km;
    const maxSeconds = record.pace_max_seconds_per_km;
    if ((minSeconds === undefined) !== (maxSeconds === undefined)) {
      return "Pace range seconds must include both endpoints.";
    }
    if (
      minSeconds !== undefined &&
      (!Number.isInteger(minSeconds) ||
        !Number.isInteger(maxSeconds) ||
        (minSeconds as number) <= 0 ||
        (maxSeconds as number) <= (minSeconds as number) ||
        !rangeSeconds ||
        minSeconds !== rangeSeconds.min ||
        maxSeconds !== rangeSeconds.max)
    ) {
      return "Pace range seconds must match the canonical pace range.";
    }
    return null;
  }

  if (mode === "heart_rate") {
    if (hasPaceValues || hasRpe || readString(record.intensity)) {
      return "Heart-rate targets cannot contain pace, effort, or RPE values.";
    }
    if (!hrTargetSource || hrTargetSource === "effort_only") {
      return "Heart-rate targets require a known heart-rate provenance source.";
    }
    const cap = record.hr_bpm_cap;
    const range = readString(record.hr_bpm_range);
    if (Boolean(cap !== undefined) === Boolean(range)) {
      return "Heart-rate targets require exactly one cap or range.";
    }
    if (cap !== undefined) {
      if (!isPlausibleBpm(cap)) return "Heart-rate caps must be whole numbers from 30 to 250.";
      const display = readString(record.hr_bpm);
      if (display && !new RegExp(`^${cap}\\s*bpm$`, "i").test(display)) {
        return "Heart-rate cap display must match the canonical cap.";
      }
      if (record.hr_bpm_min !== undefined || record.hr_bpm_max !== undefined) {
        return "Heart-rate caps cannot contain range endpoints.";
      }
      return null;
    }

    const parsedRange = parseBpmRange(range!);
    if (!parsedRange) return "Heart-rate ranges must be increasing values from 30 to 250 BPM.";
    const min = record.hr_bpm_min;
    const max = record.hr_bpm_max;
    if ((min === undefined) !== (max === undefined)) {
      return "Heart-rate ranges must include both numeric endpoints when materialized.";
    }
    if (min !== undefined && (min !== parsedRange.min || max !== parsedRange.max)) {
      return "Heart-rate range endpoints must match the canonical range.";
    }
    if (record.hr_bpm !== undefined) {
      return "Heart-rate ranges cannot also contain a cap display.";
    }
    return null;
  }

  if (hasPaceValues || hasHrValues) {
    return "Effort and run-walk targets cannot contain pace or heart-rate values.";
  }
  if (hrTargetSource) {
    return "Effort and run-walk targets cannot claim heart-rate target provenance.";
  }
  if (mode === "effort") {
    const intensity = readString(record.intensity);
    if (Boolean(intensity) === hasRpe) {
      return "Effort targets require exactly one RPE or intensity value.";
    }
    if (hasRpe && !isValidRpe(record.rpe)) {
      return "RPE targets must be whole numbers from 0 to 10.";
    }
    return null;
  }

  if (!readString(record.intensity) || hasRpe) {
    return "Run-walk targets require one intensity value and cannot contain RPE.";
  }
  return null;
}

function parsePaceSeconds(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*\/\s*km$/i.exec(value.trim());
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  return seconds < 60 ? minutes * 60 + seconds : null;
}

function parsePaceRangeSeconds(value: string): { min: number; max: number } | null {
  const normalized = value.trim();
  const match = /^(\d{1,2}:\d{2})(?:\s*\/\s*km)?\s*-\s*(\d{1,2}:\d{2})\s*\/\s*km$/i.exec(
    normalized,
  );
  if (!match) return null;
  const min = parsePaceSeconds(`${match[1]}/km`);
  const max = parsePaceSeconds(`${match[2]}/km`);
  return min != null && max != null && min < max ? { min, max } : null;
}

function parseBpmRange(value: string): { min: number; max: number } | null {
  const match = /^(\d{2,3})\s*-\s*(\d{2,3})(?:\s*bpm)?$/i.exec(value.trim());
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  return isPlausibleBpm(min) && isPlausibleBpm(max) && min < max ? { min, max } : null;
}

function isPlausibleBpm(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 30 && (value as number) <= 250;
}

function isValidRpe(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isInteger(parsed) && (parsed as number) >= 0 && (parsed as number) <= 10;
}

function readWorkoutDocumentType(value: unknown): WorkoutDocumentType | null {
  return typeof value === "string" && WORKOUT_DOCUMENT_TYPE_VALUES.has(value as WorkoutDocumentType)
    ? (value as WorkoutDocumentType)
    : null;
}

function readIsoDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function readPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function readNonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function readOptionalPositiveInteger(value: unknown): number | null | false {
  return value === undefined ? null : (readPositiveInteger(value) ?? false);
}

function readOptionalPositiveNumber(value: unknown): number | null | false {
  return value === undefined
    ? null
    : typeof value === "number" && Number.isFinite(value) && value > 0
      ? value
      : false;
}

function readNullableString(value: unknown): string | null | typeof INVALID_NULLABLE_STRING {
  return value === null ? null : (readString(value) ?? INVALID_NULLABLE_STRING);
}

function readOptionalString(value: unknown): string | undefined | typeof INVALID_NULLABLE_STRING {
  return value === undefined ? undefined : (readString(value) ?? INVALID_NULLABLE_STRING);
}

function readOptionalNullableString(
  value: unknown,
): string | null | undefined | typeof INVALID_NULLABLE_STRING {
  return value === undefined ? undefined : readNullableString(value);
}

function readNullableRpe(value: unknown): number | null | typeof INVALID_RPE {
  return value === null
    ? null
    : typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10
      ? value
      : INVALID_RPE;
}

function normalizeNullableGoalContext(
  value: unknown,
): CanonicalGoalContext | null | typeof INVALID_GOAL_CONTEXT {
  return value === null ? null : (normalizeCanonicalGoalContext(value) ?? INVALID_GOAL_CONTEXT);
}

function invalidDocument(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

function workoutDocumentSectionTypeForRepeatChild(role: WorkoutDocumentRepeatChildRole) {
  switch (role) {
    case "warm_up":
      return "warmup";
    case "recover":
      return "recovery";
    default:
      return role;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const WORKOUT_DOCUMENT_TARGET_KEYS = [
  "primary_execution_mode",
  "target_source",
  "intensity",
  "hr_bpm_range",
  "hr_bpm",
  "hr_bpm_cap",
  "hr_bpm_min",
  "hr_bpm_max",
  "hr_target_source",
  "label",
  "source_note",
  "pace_min_per_km_range",
  "pace_range_min_km",
  "pace",
  "pace_seconds_per_km",
  "pace_min_seconds_per_km",
  "pace_max_seconds_per_km",
  "rpe",
  "cadence_spm_range",
  "cue",
  "hint",
  "extra",
] as const;

const WORKOUT_DOCUMENT_TARGET_KEY_SET = new Set<string>(WORKOUT_DOCUMENT_TARGET_KEYS);
const WORKOUT_DOCUMENT_HR_TARGET_SOURCE_VALUES = new Set([
  "personal_hr_zone",
  "user_entered",
  "runner_entered",
  "default_estimated_hr",
  "effort_only",
]);

function unknownRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readPositiveDuration(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function primaryExecutionModeField(value: unknown): Partial<WorkoutDocumentTarget> {
  return typeof value === "string" &&
    PRIMARY_EXECUTION_MODE_VALUES.includes(value as PrimaryExecutionMode)
    ? { primary_execution_mode: value as PrimaryExecutionMode }
    : {};
}

function stringField<K extends string>(key: K, value: unknown): Partial<Record<K, string>> {
  const resolved = readString(value);
  return resolved ? ({ [key]: resolved } as Record<K, string>) : {};
}

function numberField<K extends string>(key: K, value: unknown): Partial<Record<K, number>> {
  return typeof value === "number" && Number.isFinite(value)
    ? ({ [key]: value } as Record<K, number>)
    : {};
}

function stringOrNumberField<K extends string>(
  key: K,
  value: unknown,
): Partial<Record<K, string | number>> {
  return typeof value === "number" ? numberField(key, value) : stringField(key, value);
}
