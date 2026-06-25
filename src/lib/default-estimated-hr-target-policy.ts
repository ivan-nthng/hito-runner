type DefaultEstimatedHrTargetKind = "target" | "recovery_target";

export type DefaultEstimatedHrTargetPolicyContext = {
  sourceWorkoutType?: string | null;
  workoutType?: string | null;
  segmentType?: string | null;
  segmentId?: string | null;
  targetKind?: DefaultEstimatedHrTargetKind;
};

const DEFAULT_ESTIMATED_HR_AEROBIC_SUPPORT_SOURCE_TYPES = new Set([
  "recovery",
  "easy",
  "long_run",
  "cutback_long_run",
  "recovery_jog",
  "easy_aerobic_run",
  "long_aerobic_run",
  "cutback_aerobic_run",
  "taper_long_run",
]);

const DEFAULT_ESTIMATED_HR_FIELDS = [
  "hr_bpm_range",
  "hr_bpm",
  "hr_target_source",
  "source_note",
] as const;

export function allowsDefaultEstimatedHrTarget({
  sourceWorkoutType,
  workoutType,
  segmentType,
  segmentId,
  targetKind = "target",
}: DefaultEstimatedHrTargetPolicyContext) {
  if (targetKind !== "target") {
    return false;
  }

  if (!defaultEstimatedHrSourceTypeIsAerobicSupport(sourceWorkoutType, workoutType)) {
    return false;
  }

  return segmentIsMainSupportWork(segmentType, segmentId);
}

export function defaultEstimatedHrSourceTypeIsAerobicSupport(
  sourceWorkoutType: string | null | undefined,
  workoutType?: string | null,
) {
  const source = sourceWorkoutType?.trim();

  if (source && DEFAULT_ESTIMATED_HR_AEROBIC_SUPPORT_SOURCE_TYPES.has(source)) {
    return true;
  }

  return Boolean(!source && workoutType && ["recovery", "easy", "long_run"].includes(workoutType));
}

export function targetIsDefaultEstimatedHr(target: Record<string, unknown> | undefined | null) {
  return (
    target?.hr_target_source === "default_estimated_hr" &&
    (typeof target.hr_bpm_range === "string" || typeof target.hr_bpm === "string")
  );
}

export function stripDisallowedDefaultEstimatedHrTargetsFromSegments<
  TSegment extends {
    segment_type?: string | null;
    segment_id?: string | null;
    target?: Record<string, unknown>;
    recovery_target?: Record<string, unknown>;
  },
>(
  segments: TSegment[],
  context: Pick<DefaultEstimatedHrTargetPolicyContext, "sourceWorkoutType" | "workoutType">,
): TSegment[] {
  return segments.map((segment) => {
    const target = sanitizeDefaultEstimatedHrTarget(segment.target, {
      ...context,
      segmentType: segment.segment_type,
      segmentId: segment.segment_id,
      targetKind: "target",
    });
    const recoveryTarget = sanitizeDefaultEstimatedHrTarget(segment.recovery_target, {
      ...context,
      segmentType: segment.segment_type,
      segmentId: segment.segment_id,
      targetKind: "recovery_target",
    });

    if (target === segment.target && recoveryTarget === segment.recovery_target) {
      return segment;
    }

    return {
      ...segment,
      ...(target ? { target } : {}),
      ...(recoveryTarget ? { recovery_target: recoveryTarget } : {}),
    } as TSegment;
  });
}

function sanitizeDefaultEstimatedHrTarget(
  target: Record<string, unknown> | undefined,
  context: DefaultEstimatedHrTargetPolicyContext,
) {
  if (!targetIsDefaultEstimatedHr(target) || allowsDefaultEstimatedHrTarget(context)) {
    return target;
  }

  const sanitized = { ...target };

  for (const field of DEFAULT_ESTIMATED_HR_FIELDS) {
    delete sanitized[field];
  }

  if (typeof sanitized.label === "string" && /estimated HR/i.test(sanitized.label)) {
    delete sanitized.label;
  }

  return sanitized;
}

function segmentIsMainSupportWork(
  segmentType: string | null | undefined,
  segmentId: string | null | undefined,
) {
  return segmentType === "main" || Boolean(segmentId?.endsWith("_main"));
}
