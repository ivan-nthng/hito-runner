import type { PersistedPlannedWorkoutRow } from "@/lib/active-plan-persistence";
import { getManualWorkoutRepeatGroupChildren } from "@/lib/manual-workout-authoring/repeat-groups";
import {
  manualWorkoutDraftInputSchema,
  type ManualWorkoutBlockInput,
} from "@/lib/manual-workout-authoring/schema";
import { stableManualWorkoutChecksum64Hex } from "@/lib/manual-workout-authoring/review-exactness";
import { AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE } from "@/lib/workout-document";

type AiTargetPreservationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export function persistedManualWorkoutHasUnsafeMetricTruth(workout: PersistedPlannedWorkoutRow) {
  return hasUnsafeMetricTruth(workout.metric_mode) || hasUnsafeMetricTruth(workout.steps);
}

export function validatePreservedAiAuthoredTargetTruth(
  candidateInput: unknown,
  sourceInput: unknown,
): AiTargetPreservationResult {
  const candidate = manualWorkoutDraftInputSchema.safeParse(candidateInput);
  const source = manualWorkoutDraftInputSchema.safeParse(sourceInput);

  if (!candidate.success || !source.success) {
    return {
      ok: false,
      message: "The persisted workout target truth could not be verified.",
    };
  }

  const sourceTargetCounts = countAiAuthoredTargets(source.data.entries ?? []);

  for (const target of collectAiAuthoredTargets(candidate.data.entries ?? [])) {
    const checksum = stableManualWorkoutChecksum64Hex(target);
    const remaining = sourceTargetCounts.get(checksum) ?? 0;

    if (remaining === 0) {
      return {
        ok: false,
        message:
          "AI-authored target guidance must remain unchanged or be replaced by runner-entered guidance.",
      };
    }

    sourceTargetCounts.set(checksum, remaining - 1);
  }

  return { ok: true };
}

function hasUnsafeMetricTruth(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasUnsafeMetricTruth);
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const targetSource = record.target_source ?? record.targetSource;
  const hrTargetSource = record.hr_target_source ?? record.hrTargetSource;
  const sourceIsEditable =
    targetSource === "user_entered" ||
    targetSource === "runner_entered" ||
    targetSource === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE;
  const hrSourceIsEditable =
    hrTargetSource === undefined ||
    hrTargetSource === "user_entered" ||
    hrTargetSource === "runner_entered" ||
    (targetSource === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE &&
      (hrTargetSource === "personal_hr_zone" || hrTargetSource === "default_estimated_hr"));
  const hasPaceTarget =
    "pace" in record || "pace_min_per_km_range" in record || "paceMinPerKmRange" in record;
  const hasHrTarget = "hr_bpm_range" in record || "hrBpmRange" in record || "hr_bpm" in record;

  if (hasPaceTarget && !sourceIsEditable) {
    return true;
  }

  if (hasHrTarget && (!sourceIsEditable || !hrSourceIsEditable)) {
    return true;
  }

  if (
    hasHrTarget &&
    (record.hr_target_source === "personal_hr_zone" ||
      record.hrTargetSource === "personal_hr_zone" ||
      record.hr_target_source === "default_estimated_hr" ||
      record.hrTargetSource === "default_estimated_hr") &&
    targetSource !== AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE
  ) {
    return true;
  }

  return Object.values(record).some(hasUnsafeMetricTruth);
}

function countAiAuthoredTargets(
  entries: Parameters<typeof collectAiAuthoredTargets>[0],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const target of collectAiAuthoredTargets(entries)) {
    const checksum = stableManualWorkoutChecksum64Hex(target);
    counts.set(checksum, (counts.get(checksum) ?? 0) + 1);
  }

  return counts;
}

function collectAiAuthoredTargets(
  entries: NonNullable<ReturnType<typeof manualWorkoutDraftInputSchema.parse>["entries"]>,
): Array<NonNullable<ManualWorkoutBlockInput["target"]>> {
  const targets: Array<NonNullable<ManualWorkoutBlockInput["target"]>> = [];

  for (const entry of entries) {
    const blocks =
      entry.kind === "block" ? [entry.block] : getManualWorkoutRepeatGroupChildren(entry.group);

    for (const block of blocks) {
      const target = block.target;
      if (
        target &&
        [target.targetSource, target.paceTargetSource, target.hrTargetSource].includes(
          AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
        )
      ) {
        targets.push(target);
      }
    }
  }

  return targets;
}
