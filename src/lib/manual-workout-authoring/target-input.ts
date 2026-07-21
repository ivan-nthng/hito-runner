import type {
  ManualWorkoutBlockInput,
  ManualWorkoutDraftIssue,
  ManualWorkoutDraftProcessingOptions,
  ManualWorkoutPrimaryExecutionMode,
  ManualWorkoutTargetSource,
  ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring/schema";
import type { StepTarget } from "@/lib/training";
import { AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE } from "@/lib/workout-document";

const USER_ENTERED_TARGET_SOURCE = "user_entered" as const;
const USER_ENTERED_SOURCE_ALIASES = new Set<ManualWorkoutTargetSource>([
  "user_entered",
  "runner_entered",
]);

const PACE_MIN_SECONDS_PER_KM = 2 * 60;
const PACE_MAX_SECONDS_PER_KM = 20 * 60;
const HR_MIN_BPM = 60;
const HR_MAX_BPM = 220;

type ManualTargetIssue = Omit<ManualWorkoutDraftIssue, "path"> & {
  path: Array<string | number>;
};

type ResolvedManualWorkoutTargetSource =
  | typeof USER_ENTERED_TARGET_SOURCE
  | typeof AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE;

export type ResolvedManualWorkoutTarget =
  | {
      kind: "none";
      label?: string;
      cue?: string;
      hint?: string;
      sourceNote?: string;
    }
  | {
      kind: "effort_rpe";
      primaryExecutionMode: "effort" | "run_walk";
      source: ResolvedManualWorkoutTargetSource;
      intensity?: string;
      label?: string;
      cue?: string;
      hint?: string;
      hrZone?: string;
      hrBpmRange?: string;
      hrBpmRangeValues?: { min: number; max: number };
      hrTargetSource?: "personal_hr_zone" | "default_estimated_hr" | "effort_only";
      rpe?: number;
      sourceNote?: string;
    }
  | {
      kind: "pace";
      primaryExecutionMode: "pace";
      source: ResolvedManualWorkoutTargetSource;
      intensity?: string;
      label?: string;
      cue?: string;
      hint?: string;
      hrZone?: string;
      hrBpmRange?: string;
      hrBpmRangeValues?: { min: number; max: number };
      hrTargetSource?: "personal_hr_zone" | "default_estimated_hr" | "effort_only";
      sourceNote?: string;
      pace?: string;
      paceSecondsPerKm?: number;
      paceMinPerKmRange?: string;
      paceRangeSecondsPerKm?: {
        min: number;
        max: number;
      };
    }
  | {
      kind: "heart_rate";
      primaryExecutionMode: "heart_rate";
      source: ResolvedManualWorkoutTargetSource;
      label?: string;
      cue?: string;
      hint?: string;
      sourceNote?: string;
      hrBpmCap?: number;
      hrBpmRange?: string;
      hrBpmRangeValues?: {
        min: number;
        max: number;
      };
      hrTargetSource?: "personal_hr_zone" | "default_estimated_hr" | "effort_only";
      hrZone?: string;
      hrZoneReference?: string;
      hrProfileSource?: "personal" | "estimated";
    };

type ResolvedManualWorkoutTargetResult =
  | {
      ok: true;
      target: ResolvedManualWorkoutTarget;
    }
  | {
      ok: false;
      issues: ManualTargetIssue[];
    };

export function resolveManualWorkoutTargetInput(
  block: ManualWorkoutBlockInput,
  targetTruthMode: ManualWorkoutTargetTruthMode,
  options: ManualWorkoutDraftProcessingOptions = {},
): ResolvedManualWorkoutTargetResult {
  const target = block.target;

  if (!target || targetTruthMode === "none") {
    return { ok: true, target: { kind: "none" } };
  }

  const issues: ManualTargetIssue[] = [];
  const hasPaceExact = hasText(target.pace);
  const hasPaceRange = hasText(target.paceMinPerKmRange);
  const hasHrCap = target.hrBpmCap !== undefined;
  const hasHrRange = hasText(target.hrBpmRange);
  const rpe = parseRpe(target.rpe, ["rpe"], issues);
  const hasEffort = rpe !== undefined || hasText(target.intensity);
  const hasPace = hasPaceExact || hasPaceRange;
  const hasHr = hasHrCap || hasHrRange;
  const targetSource = canonicalTargetSource(target.targetSource) ?? USER_ENTERED_TARGET_SOURCE;
  const paceTargetSource =
    canonicalTargetSource(target.paceTargetSource ?? target.targetSource) ??
    USER_ENTERED_TARGET_SOURCE;
  const hrTargetSource =
    canonicalTargetSource(target.hrTargetSource ?? target.targetSource) ??
    USER_ENTERED_TARGET_SOURCE;
  const preservesAiAuthoredTarget =
    targetSource === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE &&
    options.allowPreservedAiAuthoredTargets === true;
  const primaryExecutionMode = target.primaryExecutionMode;

  validateSource(target.targetSource, ["targetSource"], issues, options);

  if (hasPace) {
    validateSource(
      target.paceTargetSource ?? target.targetSource,
      ["paceTargetSource"],
      issues,
      options,
    );

    if (paceTargetSource !== targetSource) {
      issues.push({
        code: "unsafe_metric_truth",
        message: "Pace target provenance must match the target provenance.",
        path: ["paceTargetSource"],
      });
    }
  }

  if (hasHr || target.hrTargetSource) {
    const preservesAiHrMetadata =
      preservesAiAuthoredTarget &&
      (target.hrTargetSource === "personal_hr_zone" ||
        target.hrTargetSource === "default_estimated_hr" ||
        target.hrTargetSource === "effort_only");

    if (!preservesAiHrMetadata) {
      validateSource(
        target.hrTargetSource ?? target.targetSource,
        ["hrTargetSource"],
        issues,
        options,
      );
    }

    if (hasHr && hrTargetSource !== USER_ENTERED_TARGET_SOURCE && !preservesAiHrMetadata) {
      issues.push({
        code: "unsafe_metric_truth",
        message: "Executable manual heart-rate targets must be runner-entered.",
        path: ["hrTargetSource"],
      });
    }
  }

  if (hasPaceExact && hasPaceRange) {
    issues.push({
      code: "unsafe_metric_truth",
      message: "Manual workout pace targets must use either an exact pace or a range, not both.",
      path: ["pace"],
    });
  }

  if (hasHrCap && hasHrRange) {
    issues.push({
      code: "unsafe_metric_truth",
      message: "Manual workout HR targets must use either a bpm cap or a range, not both.",
      path: ["hrBpmCap"],
    });
  }

  const targetFamilies = [hasPace, hasHr, hasEffort].filter(Boolean).length;
  if (targetFamilies > 1 && !preservesAiAuthoredTarget) {
    issues.push({
      code: "unsafe_metric_truth",
      message: "Manual workout v1 supports one target family per segment.",
      path: [],
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  if (preservesAiAuthoredTarget) {
    validatePreservedAiPrimaryExecutionMode(
      primaryExecutionMode,
      { hasPace, hasHr, hasEffort },
      issues,
    );
    const hrRange =
      hasHrRange && target.hrBpmRange
        ? parseHrBpmRange(target.hrBpmRange, ["hrBpmRange"], issues)
        : null;
    if (issues.length > 0) {
      return { ok: false, issues };
    }
    const shared = {
      ...sharedTargetFields(target),
      ...(target.intensity ? { intensity: target.intensity } : {}),
      ...(target.hrZone ? { hrZone: target.hrZone } : {}),
      ...(target.hrZoneReference ? { hrZoneReference: target.hrZoneReference } : {}),
      ...(target.hrProfileSource ? { hrProfileSource: target.hrProfileSource } : {}),
      ...(target.hrBpmRange ? { hrBpmRange: target.hrBpmRange } : {}),
      ...(hrRange ? { hrBpmRangeValues: hrRange } : {}),
      ...(target.hrTargetSource === "personal_hr_zone" ||
      target.hrTargetSource === "default_estimated_hr" ||
      target.hrTargetSource === "effort_only"
        ? { hrTargetSource: target.hrTargetSource }
        : {}),
    };

    if (hasPaceExact && target.pace) {
      return {
        ok: true,
        target: {
          kind: "pace",
          primaryExecutionMode: "pace",
          source: AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
          ...shared,
          pace: target.pace,
        },
      };
    }

    if (hasPaceRange && target.paceMinPerKmRange) {
      return {
        ok: true,
        target: {
          kind: "pace",
          primaryExecutionMode: "pace",
          source: AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
          ...shared,
          paceMinPerKmRange: target.paceMinPerKmRange,
        },
      };
    }

    if (primaryExecutionMode === "heart_rate") {
      return {
        ok: true,
        target: {
          kind: "heart_rate",
          primaryExecutionMode,
          source: AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
          ...shared,
        },
      };
    }

    return {
      ok: true,
      target: {
        kind: "effort_rpe",
        primaryExecutionMode: primaryExecutionMode === "run_walk" ? "run_walk" : "effort",
        source: AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
        ...shared,
        ...(rpe !== undefined ? { rpe } : {}),
      },
    };
  }

  if (hasPaceExact && target.pace) {
    const paceSeconds = parsePaceSecondsPerKm(target.pace, ["pace"], issues);
    if (issues.length > 0 || paceSeconds == null) return { ok: false, issues };

    return {
      ok: true,
      target: {
        kind: "pace",
        primaryExecutionMode: "pace",
        source: USER_ENTERED_TARGET_SOURCE,
        ...sharedTargetFields(target),
        pace: formatPaceSecondsPerKm(paceSeconds),
        paceSecondsPerKm: paceSeconds,
      },
    };
  }

  if (hasPaceRange && target.paceMinPerKmRange) {
    const paceRange = parsePaceRangeSecondsPerKm(
      target.paceMinPerKmRange,
      ["paceMinPerKmRange"],
      issues,
    );
    if (issues.length > 0 || !paceRange) return { ok: false, issues };

    return {
      ok: true,
      target: {
        kind: "pace",
        primaryExecutionMode: "pace",
        source: USER_ENTERED_TARGET_SOURCE,
        ...sharedTargetFields(target),
        paceMinPerKmRange: `${formatPaceSecondsPerKm(paceRange.min)}-${formatPaceSecondsPerKm(
          paceRange.max,
        )}`,
        paceRangeSecondsPerKm: paceRange,
      },
    };
  }

  if (hasHrCap) {
    const hrBpmCap = parseHrBpm(target.hrBpmCap, ["hrBpmCap"], issues);
    if (issues.length > 0 || hrBpmCap == null) return { ok: false, issues };

    return {
      ok: true,
      target: {
        kind: "heart_rate",
        primaryExecutionMode: "heart_rate",
        source: USER_ENTERED_TARGET_SOURCE,
        ...sharedTargetFields(target),
        hrBpmCap,
      },
    };
  }

  if (hasHrRange && target.hrBpmRange) {
    const hrRange = parseHrBpmRange(target.hrBpmRange, ["hrBpmRange"], issues);
    if (issues.length > 0 || !hrRange) return { ok: false, issues };

    return {
      ok: true,
      target: {
        kind: "heart_rate",
        primaryExecutionMode: "heart_rate",
        source: USER_ENTERED_TARGET_SOURCE,
        ...sharedTargetFields(target),
        hrBpmRange: `${hrRange.min}-${hrRange.max} bpm`,
        hrBpmRangeValues: hrRange,
      },
    };
  }

  if (hasEffort) {
    return {
      ok: true,
      target: {
        kind: "effort_rpe",
        primaryExecutionMode: "effort",
        source: USER_ENTERED_TARGET_SOURCE,
        ...sharedTargetFields(target),
        ...(target.intensity ? { intensity: target.intensity } : {}),
        ...(rpe !== undefined ? { rpe } : {}),
      },
    };
  }

  return { ok: true, target: { kind: "none", ...sharedTargetFields(target) } };
}

export function validateManualWorkoutTargetInput(
  block: ManualWorkoutBlockInput,
  targetTruthMode: ManualWorkoutTargetTruthMode,
  path: Array<string | number>,
  options: ManualWorkoutDraftProcessingOptions = {},
): ManualWorkoutDraftIssue[] {
  const result = resolveManualWorkoutTargetInput(block, targetTruthMode, options);

  if (result.ok) {
    return [];
  }

  return result.issues.map((issue) => ({
    ...issue,
    path: [...path, "target", ...issue.path],
  }));
}

export function manualWorkoutTargetToStepTarget(
  resolved: ResolvedManualWorkoutTarget,
  fallbackHint: string,
): StepTarget {
  if (resolved.kind === "none") {
    return {
      hint: fallbackHint,
      ...(resolved.label ? { label: resolved.label } : {}),
      ...(resolved.sourceNote ? { source_note: resolved.sourceNote } : {}),
      ...(resolved.cue ? { cue: resolved.cue } : {}),
    };
  }

  const hint =
    resolved.hint ?? (resolved.source === USER_ENTERED_TARGET_SOURCE ? fallbackHint : undefined);
  const base: StepTarget = {
    primary_execution_mode: resolved.primaryExecutionMode,
    target_source: resolved.source,
    ...(hint ? { hint } : {}),
    ...(resolved.label ? { label: resolved.label } : {}),
    ...(resolved.sourceNote ? { source_note: resolved.sourceNote } : {}),
    ...(resolved.cue ? { cue: resolved.cue } : {}),
    ...("hrZone" in resolved && resolved.hrZone
      ? {
          extra: {
            hr_zone: resolved.hrZone,
            hr_zone_reference:
              "hrZoneReference" in resolved && resolved.hrZoneReference
                ? resolved.hrZoneReference
                : resolved.hrZone,
            ...("hrProfileSource" in resolved && resolved.hrProfileSource
              ? { hr_profile_source: resolved.hrProfileSource }
              : {}),
            ...("hrTargetSource" in resolved && resolved.hrTargetSource
              ? {
                  hr_profile_source:
                    resolved.hrTargetSource === "personal_hr_zone" ? "personal" : "estimated",
                }
              : {}),
          },
        }
      : {}),
    ...("hrTargetSource" in resolved && resolved.hrTargetSource
      ? { hr_target_source: resolved.hrTargetSource }
      : {}),
    ...("hrBpmRange" in resolved && resolved.hrBpmRange
      ? { hr_bpm_range: resolved.hrBpmRange }
      : {}),
    ...("hrBpmRangeValues" in resolved && resolved.hrBpmRangeValues
      ? {
          hr_bpm_min: resolved.hrBpmRangeValues.min,
          hr_bpm_max: resolved.hrBpmRangeValues.max,
        }
      : {}),
  };

  if (resolved.kind === "pace") {
    return {
      ...base,
      ...(resolved.intensity ? { intensity: resolved.intensity } : {}),
      ...(resolved.pace ? { pace: resolved.pace } : {}),
      ...(resolved.paceSecondsPerKm ? { pace_seconds_per_km: resolved.paceSecondsPerKm } : {}),
      ...(resolved.paceMinPerKmRange ? { pace_min_per_km_range: resolved.paceMinPerKmRange } : {}),
      ...(resolved.paceRangeSecondsPerKm
        ? {
            pace_min_seconds_per_km: resolved.paceRangeSecondsPerKm.min,
            pace_max_seconds_per_km: resolved.paceRangeSecondsPerKm.max,
          }
        : {}),
    };
  }

  if (resolved.kind === "heart_rate") {
    return {
      ...base,
      hr_target_source:
        resolved.source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE
          ? resolved.hrTargetSource
          : USER_ENTERED_TARGET_SOURCE,
      ...(resolved.hrBpmCap
        ? { hr_bpm: `${resolved.hrBpmCap} bpm`, hr_bpm_cap: resolved.hrBpmCap }
        : {}),
      ...(resolved.hrBpmRange ? { hr_bpm_range: resolved.hrBpmRange } : {}),
      ...(resolved.hrBpmRangeValues
        ? {
            hr_bpm_min: resolved.hrBpmRangeValues.min,
            hr_bpm_max: resolved.hrBpmRangeValues.max,
          }
        : {}),
    };
  }

  return {
    ...base,
    ...(resolved.intensity ? { intensity: resolved.intensity } : {}),
    ...(resolved.rpe !== undefined ? { rpe: resolved.rpe } : {}),
  };
}

export function hasManualWorkoutPaceTarget(resolved: ResolvedManualWorkoutTarget) {
  return resolved.kind === "pace";
}

export function hasManualWorkoutHrTarget(resolved: ResolvedManualWorkoutTarget) {
  return resolved.kind === "heart_rate";
}

function validatePreservedAiPrimaryExecutionMode(
  mode: ManualWorkoutPrimaryExecutionMode | undefined,
  targetFamilies: { hasPace: boolean; hasHr: boolean; hasEffort: boolean },
  issues: ManualTargetIssue[],
) {
  if (!mode) {
    issues.push({
      code: "unsafe_metric_truth",
      message: "AI-authored target guidance must retain its primary execution mode.",
      path: ["primaryExecutionMode"],
    });
    return;
  }

  const valid =
    (mode === "pace" &&
      targetFamilies.hasPace &&
      !targetFamilies.hasHr &&
      !targetFamilies.hasEffort) ||
    (mode === "heart_rate" &&
      targetFamilies.hasHr &&
      !targetFamilies.hasPace &&
      !targetFamilies.hasEffort) ||
    ((mode === "effort" || mode === "run_walk") &&
      targetFamilies.hasEffort &&
      !targetFamilies.hasPace &&
      !targetFamilies.hasHr);

  if (!valid) {
    issues.push({
      code: "unsafe_metric_truth",
      message:
        "AI-authored target guidance must retain exactly one target family matching its primary execution mode.",
      path: ["primaryExecutionMode"],
    });
  }
}

function validateSource(
  source: ManualWorkoutTargetSource | undefined,
  path: Array<string | number>,
  issues: ManualTargetIssue[],
  options: ManualWorkoutDraftProcessingOptions,
) {
  if (!source || USER_ENTERED_SOURCE_ALIASES.has(source)) {
    return;
  }

  if (
    source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE &&
    options.allowPreservedAiAuthoredTargets
  ) {
    return;
  }

  issues.push({
    code: "unsafe_metric_truth",
    message:
      "Manual target inputs must be runner-entered; generated, inferred, default, template, benchmark, target-time, and personal-zone targets are not supported in v1.",
    path,
  });
}

function canonicalTargetSource(
  source: ManualWorkoutTargetSource | undefined,
): ManualWorkoutTargetSource | undefined {
  return source === "runner_entered" ? USER_ENTERED_TARGET_SOURCE : source;
}

function sharedTargetFields(target: NonNullable<ManualWorkoutBlockInput["target"]>) {
  return {
    ...(target.label ? { label: target.label } : {}),
    ...(target.cue ? { cue: target.cue } : {}),
    ...(target.hint ? { hint: target.hint } : {}),
    ...(target.sourceNote ? { sourceNote: target.sourceNote } : {}),
  };
}

function parsePaceRangeSecondsPerKm(
  value: string,
  path: Array<string | number>,
  issues: ManualTargetIssue[],
) {
  const parts = value
    .replace(/\s+to\s+/i, "-")
    .replace(/[\u2013\u2014]/g, "-")
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 2) {
    issues.push({
      code: "invalid_input",
      message: "Pace ranges must use two min/km values, for example 5:10-5:25/km.",
      path,
    });
    return null;
  }

  const min = parsePaceSecondsPerKm(parts[0]!, path, issues);
  const max = parsePaceSecondsPerKm(parts[1]!, path, issues);

  if (min == null || max == null) {
    return null;
  }

  if (min > max) {
    issues.push({
      code: "invalid_input",
      message: "Pace ranges must be ordered from faster/lower seconds to slower/higher seconds.",
      path,
    });
    return null;
  }

  return { min, max };
}

function parsePaceSecondsPerKm(
  value: string,
  path: Array<string | number>,
  issues: ManualTargetIssue[],
) {
  const match = value
    .trim()
    .toLowerCase()
    .replace(/\s*(?:\/\s*km|per\s*km)$/i, "")
    .match(/^(\d{1,2}):([0-5]\d)$/);

  if (!match) {
    issues.push({
      code: "invalid_input",
      message: "Pace targets must use min/km format, for example 5:10/km.",
      path,
    });
    return null;
  }

  const seconds = Number(match[1]) * 60 + Number(match[2]);

  if (seconds < PACE_MIN_SECONDS_PER_KM || seconds > PACE_MAX_SECONDS_PER_KM) {
    issues.push({
      code: "invalid_input",
      message: "Pace targets must be between 2:00/km and 20:00/km.",
      path,
    });
    return null;
  }

  return seconds;
}

function formatPaceSecondsPerKm(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}/km`;
}

function parseHrBpmRange(value: string, path: Array<string | number>, issues: ManualTargetIssue[]) {
  const match = value
    .trim()
    .toLowerCase()
    .replace(/\s+to\s+/i, "-")
    .replace(/[\u2013\u2014]/g, "-")
    .match(/^(\d{2,3})\s*-\s*(\d{2,3})(?:\s*bpm)?$/);

  if (!match) {
    issues.push({
      code: "invalid_input",
      message: "HR ranges must use integer bpm values, for example 145-155 bpm.",
      path,
    });
    return null;
  }

  const min = parseHrBpm(Number(match[1]), path, issues);
  const max = parseHrBpm(Number(match[2]), path, issues);

  if (min == null || max == null) {
    return null;
  }

  if (min > max) {
    issues.push({
      code: "invalid_input",
      message: "HR ranges must be ordered lower to upper.",
      path,
    });
    return null;
  }

  return { min, max };
}

function parseHrBpm(
  value: string | number | undefined,
  path: Array<string | number>,
  issues: ManualTargetIssue[],
) {
  const normalized =
    typeof value === "number" ? value : Number(value?.trim().replace(/\s*bpm$/i, ""));

  if (!Number.isInteger(normalized)) {
    issues.push({
      code: "invalid_input",
      message: "HR targets must use integer bpm values.",
      path,
    });
    return null;
  }

  if (normalized < HR_MIN_BPM || normalized > HR_MAX_BPM) {
    issues.push({
      code: "invalid_input",
      message: "HR targets must be between 60 and 220 bpm.",
      path,
    });
    return null;
  }

  return normalized;
}

function parseRpe(
  value: string | number | undefined,
  path: Array<string | number>,
  issues: ManualTargetIssue[],
) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = typeof value === "number" ? value : Number(value.trim());

  if (!Number.isFinite(normalized) || normalized < 0 || normalized > 10) {
    issues.push({
      code: "invalid_input",
      message: "RPE targets must use the 0-10 perceived-exertion scale.",
      path,
    });
    return undefined;
  }

  return Number(normalized.toFixed(1));
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}
