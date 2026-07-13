import {
  deriveCanonicalMetricMode,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalMetricMode,
} from "@/lib/rich-workout-model";
import {
  normalizeExecutableStepInstructions,
  stepPlannedDistanceKm,
  stepPlannedDurationMin,
  weekdayLong,
  type Step,
  type StepRepeatChildPrescription,
  type StepTarget,
  type StepUnitPrescription,
} from "@/lib/training";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
  type ManualWorkoutBlockInput,
  type ManualWorkoutCanonicalDraft,
  type ManualWorkoutConstructorEntryInput,
  type ManualWorkoutRepeatGroupInput,
  type ManualWorkoutTargetTruthMode,
  type ParsedManualWorkoutDraftInput,
} from "@/lib/manual-workout-authoring/schema";
import {
  manualWorkoutTargetToStepTarget,
  resolveManualWorkoutTargetInput,
} from "@/lib/manual-workout-authoring/target-input";
import type { ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import { isManualWorkoutNoteOnlyBlock } from "@/lib/manual-workout-authoring/validator";
import { getManualWorkoutRepeatGroupChildren } from "@/lib/manual-workout-authoring/repeat-groups";

export interface NormalizedManualWorkoutDraftResult {
  draft: ManualWorkoutCanonicalDraft;
  reviewWarnings: string[];
}

export function normalizeManualWorkoutDraft(input: {
  parsedInput: ParsedManualWorkoutDraftInput;
  template: ManualWorkoutTemplate;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  entries: ManualWorkoutConstructorEntryInput[];
}): NormalizedManualWorkoutDraftResult {
  const { parsedInput, template, targetTruthMode, entries } = input;
  const rawSteps =
    template.workoutType === "rest"
      ? []
      : entries.flatMap((entryValue, index) =>
          entryToSteps(entryValue, targetTruthMode, index + 1),
        );
  const steps = normalizeExecutableStepInstructions(rawSteps);
  const metricMode = buildManualWorkoutMetricMode(template, targetTruthMode, steps);
  const richWorkout = resolveCanonicalWorkoutModel({
    workoutType: template.workoutType,
    sourceWorkoutType: template.workoutIdentity,
    workoutFamily: template.workoutFamily,
    workoutIdentity: template.workoutIdentity,
    calendarIconKey: template.calendarIconKey,
    metricMode,
    title: parsedInput.title ?? template.defaultTitle,
    steps,
  });
  const workoutType = template.workoutType;
  const totalDurationMin = Number(
    steps.reduce((total, step) => total + stepPlannedDurationMin(step, workoutType), 0).toFixed(2),
  );
  const totalDistanceKm = Number(
    steps.reduce((total, step) => total + stepPlannedDistanceKm(step), 0).toFixed(2),
  );

  return {
    draft: {
      sourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      sourceStatus: MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
      source_kind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      persisted: false,
      templateKey: template.templateKey,
      workoutDate: parsedInput.workoutDate,
      weekday: weekdayLong(parsedInput.workoutDate),
      title: parsedInput.title?.trim() || template.defaultTitle,
      notes: parsedInput.notes?.trim() || template.defaultNotes,
      workoutType,
      sourceWorkoutType: template.templateKey,
      workoutFamily: richWorkout.workoutFamily,
      workoutIdentity: richWorkout.workoutIdentity,
      calendarIconKey: richWorkout.calendarIconKey,
      metricMode: toCanonicalMetricModeJson(richWorkout.metricMode),
      steps,
      plannedRpe: null,
      estimatedFatigue: null,
      recoveryPriority: null,
      totalDurationMin,
      totalDistanceKm,
      mappingGaps: template.mappingGaps,
    },
    reviewWarnings: template.mappingGaps,
  };
}

function entryToSteps(
  entryValue: ManualWorkoutConstructorEntryInput,
  targetTruthMode: ManualWorkoutTargetTruthMode,
  sequence: number,
): Step[] {
  if (entryValue.kind === "block") {
    const step = blockToStep(entryValue.block, targetTruthMode, sequence);
    return step ? [step] : [];
  }

  return [repeatGroupToStep(entryValue.group, targetTruthMode, sequence)];
}

function blockToStep(
  block: ManualWorkoutBlockInput,
  targetTruthMode: ManualWorkoutTargetTruthMode,
  sequence: number,
): Step | null {
  if (isManualWorkoutNoteOnlyBlock(block.blockKey)) {
    return null;
  }

  const prescription = blockToUnitPrescription(block);
  const target = buildTarget(block, targetTruthMode, defaultGuidanceForBlock(block));

  return {
    type: stepTypeForBlock(block.blockKey),
    segment_id: `manual-segment-${sequence}`,
    segment_type: segmentTypeForBlock(block.blockKey),
    sequence,
    label: block.label ?? defaultLabelForBlock(block.blockKey),
    prescription,
    guidance: block.noteText ?? defaultGuidanceForBlock(block),
    ...(prescription.duration_min ? { duration_min: prescription.duration_min } : {}),
    ...(prescription.distance_km ? { distance_km: prescription.distance_km } : {}),
    ...(target ? { target } : {}),
  };
}

function repeatGroupToStep(
  group: ManualWorkoutRepeatGroupInput,
  targetTruthMode: ManualWorkoutTargetTruthMode,
  sequence: number,
): Step {
  const children: StepRepeatChildPrescription[] = getManualWorkoutRepeatGroupChildren(group).map(
    (block, childIndex) => {
      const prescription = blockToUnitPrescription(block);
      const target = buildTarget(block, targetTruthMode, defaultGuidanceForBlock(block));

      return {
        role: repeatRoleForBlock(block.blockKey),
        label: block.label ?? defaultLabelForBlock(block.blockKey),
        sequence: childIndex + 1,
        guidance: block.noteText ?? defaultGuidanceForBlock(block),
        prescription,
        ...(target ? { target } : {}),
      };
    },
  );

  return {
    type: repeatStepType(group.safetyKind),
    segment_id: `manual-segment-${sequence}`,
    segment_type: repeatSegmentType(group.safetyKind),
    sequence,
    label: group.groupLabel ?? defaultRepeatLabel(group),
    prescription: {
      mode: "repeats",
      repeat_count: group.repeatCount,
      children,
    },
    repeats: group.repeatCount,
    children: children.map((child) => ({
      type: repeatChildStepType(child.role),
      segment_type: child.role,
      sequence: child.sequence,
      label: child.label,
      prescription: child.prescription,
      ...(child.prescription.duration_min ? { duration_min: child.prescription.duration_min } : {}),
      ...(child.prescription.distance_km ? { distance_km: child.prescription.distance_km } : {}),
      ...(child.target ? { target: child.target } : {}),
      guidance: child.guidance,
    })),
  };
}

function repeatRoleForBlock(
  blockKey: ManualWorkoutBlockInput["blockKey"],
): StepRepeatChildPrescription["role"] {
  switch (blockKey) {
    case "warmup_block":
      return "warm_up";
    case "walk_break_block":
    case "rest_walk_jog_recovery_block":
      return "walk";
    case "recovery_block":
    case "interval_recovery_block":
      return "recover";
    case "cooldown_block":
      return "cooldown";
    case "finish_block":
      return "finish";
    case "steady_run_block":
    case "easy_run_block":
      return "run";
    case "tempo_block":
    case "threshold_block":
    case "interval_work_block":
    case "hill_work_block":
    case "downhill_control_block":
    case "strides_block":
      return "work";
    default:
      return "run";
  }
}

function repeatChildStepType(role: StepRepeatChildPrescription["role"]) {
  switch (role) {
    case "warm_up":
      return "warmup";
    case "recover":
      return "recovery";
    case "cooldown":
      return "cooldown";
    case "finish":
      return "finish";
    case "walk":
      return "walk";
    case "work":
      return "work";
    case "run":
      return "run";
  }
}

function blockToUnitPrescription(block: ManualWorkoutBlockInput): StepUnitPrescription {
  if (block.distanceMeters) {
    return {
      mode: "distance",
      distance_km: metersToKm(block.distanceMeters),
    };
  }

  if (block.durationSeconds) {
    return {
      mode: "time",
      duration_min: secondsToMinutes(block.durationSeconds),
    };
  }

  return {
    mode: "none",
  };
}

function buildTarget(
  block: ManualWorkoutBlockInput,
  targetTruthMode: ManualWorkoutTargetTruthMode,
  fallbackHint: string,
): StepTarget {
  const resolved = resolveManualWorkoutTargetInput(block, targetTruthMode);

  if (!resolved.ok) {
    return { hint: fallbackHint };
  }

  return manualWorkoutTargetToStepTarget(resolved.target, fallbackHint);
}

function buildManualWorkoutMetricMode(
  template: ManualWorkoutTemplate,
  targetTruthMode: ManualWorkoutTargetTruthMode,
  steps: Step[],
): CanonicalMetricMode {
  if (template.workoutType === "rest" || targetTruthMode === "none") {
    return {
      guidance: "effort",
      executableMode: "none",
      paceTargetsAllowed: false,
      hrTargetsAllowed: false,
      hrTargetSource: "effort_only",
      hrTargetLabel: null,
      hrTargetSourceNote: null,
      reason: "Rest day has no executable running target.",
    };
  }

  return deriveCanonicalMetricMode(steps);
}

function stepTypeForBlock(blockKey: ManualWorkoutBlockInput["blockKey"]) {
  switch (blockKey) {
    case "warmup_block":
      return "warmup";
    case "cooldown_block":
      return "cooldown";
    case "steady_run_block":
      return "steady";
    case "progression_block":
      return "progression";
    case "tempo_block":
      return "tempo";
    case "threshold_block":
      return "threshold";
    case "hill_work_block":
      return "hills";
    case "long_run_body_block":
      return "long_run_body";
    case "long_run_finish_block":
      return "long_run_finish";
    case "strides_block":
      return "strides";
    case "rest_walk_jog_recovery_block":
    case "interval_recovery_block":
      return "recovery";
    case "easy_run_block":
    default:
      return "easy";
  }
}

function segmentTypeForBlock(blockKey: ManualWorkoutBlockInput["blockKey"]) {
  switch (blockKey) {
    case "warmup_block":
      return "warmup";
    case "cooldown_block":
      return "cooldown";
    case "interval_recovery_block":
    case "rest_walk_jog_recovery_block":
      return "recovery";
    case "strides_block":
      return "strides";
    case "tempo_block":
    case "threshold_block":
      return "tempo_block";
    case "hill_work_block":
    case "downhill_control_block":
    case "interval_work_block":
      return "interval_block";
    default:
      return "main";
  }
}

function repeatStepType(safetyKind: ManualWorkoutRepeatGroupInput["safetyKind"]) {
  switch (safetyKind) {
    case "tempo_repeats":
      return "tempo";
    case "hill_repeats":
    case "downhill_control":
      return "hills";
    case "run_walk":
      return "easy";
    case "strides":
      return "strides";
    case "intervals":
    default:
      return "intervals";
  }
}

function repeatSegmentType(safetyKind: ManualWorkoutRepeatGroupInput["safetyKind"]) {
  switch (safetyKind) {
    case "tempo_repeats":
      return "tempo_block";
    case "strides":
      return "strides";
    case "run_walk":
      return "recovery_jog";
    default:
      return "interval_block";
  }
}

function defaultLabelForBlock(blockKey: ManualWorkoutBlockInput["blockKey"]) {
  return blockKey
    .replace(/_block$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function defaultGuidanceForBlock(block: ManualWorkoutBlockInput) {
  switch (block.blockKey) {
    case "warmup_block":
      return "Start easy and controlled.";
    case "cooldown_block":
      return "Finish easy; jog or walk before stopping.";
    case "interval_recovery_block":
    case "rest_walk_jog_recovery_block":
      return "Recover easily before the next repeat.";
    case "hill_work_block":
      return "Run uphill with controlled form; no exact grade target.";
    case "long_run_finish_block":
      return "Keep the finish controlled, not race effort.";
    case "strides_block":
      return "Relaxed fast running with full control.";
    default:
      return "Use the numeric structure as the executable target.";
  }
}

function defaultRepeatLabel(group: ManualWorkoutRepeatGroupInput) {
  const childSummary = getManualWorkoutRepeatGroupChildren(group).map(formatBlockUnit).join(" / ");

  return childSummary ? `${group.repeatCount} x ${childSummary}` : `${group.repeatCount} x repeat`;
}

function formatBlockUnit(block: ManualWorkoutBlockInput) {
  if (block.distanceMeters) {
    return `${block.distanceMeters}m`;
  }

  if (block.durationSeconds) {
    if (block.durationSeconds % 60 === 0) {
      return `${block.durationSeconds / 60} min`;
    }

    return `${block.durationSeconds} sec`;
  }

  return block.label ?? defaultLabelForBlock(block.blockKey);
}

function metersToKm(meters: number) {
  return Number((meters / 1000).toFixed(3));
}

function secondsToMinutes(seconds: number) {
  return Number((seconds / 60).toFixed(2));
}
