import {
  plannedWorkoutRepeatChildLabel,
  reduceRepeatChildrenToChildFirst,
  type PlannedWorkoutRepeatChildPrescription,
  type PlannedWorkoutRepeatChildRole,
  type PlannedWorkoutUnitPrescription,
} from "@/lib/planned-workout-block-contract";
import type {
  CalendarIconKey,
  CanonicalGoalContext,
  CanonicalMetricModeJson,
  CanonicalWorkoutFamily,
  CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";

export const AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE = "ai_authored_plan_guidance" as const;

export type WorkoutDocumentType = "easy" | "steady_or_easy" | "rest" | "long_run" | "quality";

export interface WorkoutDocumentTarget {
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
export type WorkoutDocumentRepeatChildRole = PlannedWorkoutRepeatChildRole;
export type WorkoutDocumentRepeatChildPrescription =
  PlannedWorkoutRepeatChildPrescription<WorkoutDocumentTarget>;

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
  sourceWorkoutId: string;
  goalContext: CanonicalGoalContext | null;
  plannedRpe: number | null;
  estimatedFatigue: string | null;
  recoveryPriority: string | null;
  displayOrder: number;
}

export function readWorkoutDocumentSections(value: unknown): WorkoutDocumentSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord) as WorkoutDocumentSection[];
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

export function workoutDocumentRepeatChildToSection(
  child: WorkoutDocumentRepeatChildPrescription,
): WorkoutDocumentSection {
  const prescription = { ...child.prescription };

  return {
    type: workoutDocumentSectionTypeForRepeatChild(child.role),
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

function unknownRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
