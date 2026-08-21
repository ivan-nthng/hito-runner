import { stableJsonEqual } from "@/lib/review-token-signing";
import {
  AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
  workoutDocumentRepeatChildren,
  type WorkoutDocument,
  type WorkoutDocumentSection,
  type WorkoutDocumentTarget,
} from "@/lib/workout-document";

type AiTargetPreservationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export function workoutDocumentHasUnsafeMetricTruth(document: WorkoutDocument) {
  return workoutDocumentValuesHaveUnsafeMetricTruth(document.metricMode, document.steps);
}

export function workoutDocumentValuesHaveUnsafeMetricTruth(metricMode: unknown, steps: unknown) {
  return hasUnsafeMetricTruth(metricMode) || hasUnsafeMetricTruth(steps);
}

export function validateWorkoutDocumentTargetEdit(
  source: WorkoutDocument,
  candidate: WorkoutDocument,
): AiTargetPreservationResult {
  if (
    workoutDocumentHasUnsafeMetricTruth(source) ||
    workoutDocumentHasUnsafeMetricTruth(candidate)
  ) {
    return {
      ok: false,
      message: "The workout document contains target provenance that cannot be edited safely.",
    };
  }

  const sourceTargets = collectWorkoutDocumentTargets(source.steps);
  const candidateTargets = collectWorkoutDocumentTargets(candidate.steps);

  for (const [path, sourceTarget] of sourceTargets) {
    if (sourceTarget.target_source !== AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE) continue;

    const candidateTarget = candidateTargets.get(path);
    if (!candidateTarget) {
      return {
        ok: false,
        message:
          "AI-authored target guidance must remain unchanged or be replaced by runner-entered guidance.",
      };
    }

    if (candidateTarget.target_source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE) {
      if (!stableJsonEqual(candidateTarget, sourceTarget)) {
        return {
          ok: false,
          message:
            "AI-authored target guidance must remain unchanged or be replaced by runner-entered guidance.",
        };
      }
      continue;
    }

    if (!isRunnerEnteredTarget(candidateTarget)) {
      return {
        ok: false,
        message:
          "AI-authored target guidance must remain unchanged or be replaced by runner-entered guidance.",
      };
    }
  }

  for (const [path, candidateTarget] of candidateTargets) {
    if (
      candidateTarget.target_source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE &&
      sourceTargets.get(path)?.target_source !== AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE
    ) {
      return {
        ok: false,
        message: "A workout edit cannot fabricate AI-authored target provenance.",
      };
    }
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

function collectWorkoutDocumentTargets(
  sections: readonly WorkoutDocumentSection[],
): Map<string, WorkoutDocumentTarget> {
  const targets = new Map<string, WorkoutDocumentTarget>();

  sections.forEach((section) => {
    const sectionAddress = `section:${section.segment_id}`;
    if (section.target) {
      targets.set(sectionAddress, section.target);
    }

    workoutDocumentRepeatChildren(section).forEach((child) => {
      if (child.target) {
        targets.set(`${sectionAddress}/child:${child.segment_id}`, child.target);
      }
    });
  });

  return targets;
}

function isRunnerEnteredTarget(target: WorkoutDocumentTarget) {
  return target.target_source === "user_entered" || target.target_source === "runner_entered";
}
