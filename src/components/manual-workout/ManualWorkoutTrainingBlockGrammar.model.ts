import type {
  ManualWorkoutBlockInput,
  ManualWorkoutBlockKey,
} from "@/lib/manual-workout-authoring/schema";
import { RUNNER_FACING_BLOCK_TYPE_LABELS } from "@/lib/planned-workout-language";
import {
  displayTargetEntries,
  formatDistanceMeters,
  formatDurationMin,
  formatPrescriptionDistanceKm,
  repeatChildSteps,
  repeatCountForStep,
  segmentColorMeta,
  type Step,
  type StepTarget,
} from "@/lib/training";

export function blockSummary(block: ManualWorkoutBlockInput) {
  if (block.durationSeconds) return formatDurationMin(block.durationSeconds / 60, "segment");
  if (block.distanceMeters) return formatDistanceMeters(block.distanceMeters);
  if (block.noteText) return block.noteText;
  return "Structure";
}

export function blockLabel(blockKey: string) {
  if (blockKey === "warmup_block") return RUNNER_FACING_BLOCK_TYPE_LABELS.warm_up;
  if (blockKey === "interval_work_block") return RUNNER_FACING_BLOCK_TYPE_LABELS.work;
  if (blockKey === "interval_recovery_block") return RUNNER_FACING_BLOCK_TYPE_LABELS.recover;
  if (blockKey === "cooldown_block") return RUNNER_FACING_BLOCK_TYPE_LABELS.cooldown;
  if (blockKey === "rest_walk_jog_recovery_block") return "Walk/jog";
  return readableToken(blockKey.replace(/_block$/, ""));
}

export function blockShortLabel(blockKey: string) {
  if (blockKey === "warmup_block") return "WU";
  if (blockKey === "cooldown_block") return "CD";
  if (blockKey === "interval_work_block") return "Work";
  if (blockKey === "interval_recovery_block") return "Rec";
  if (blockKey === "rest_walk_jog_recovery_block") return "Jog";
  if (blockKey === "long_run_body_block") return "Long";
  if (blockKey === "long_run_finish_block") return "Finish";
  if (blockKey.includes("note") || blockKey.includes("mobility")) return "Cue";
  return readableToken(blockKey.replace(/_block$/, "")).split(" ")[0] ?? "Step";
}

export function readableToken(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function blockColor(block: ManualWorkoutBlockInput) {
  return segmentColorMeta(blockSemanticKind(block), blockTargetForTimeline(block)).color;
}

export function blockKeyColor(blockKey: ManualWorkoutBlockKey) {
  return segmentColorMeta(blockSemanticKindForKey(blockKey)).color;
}

function blockSemanticKind(block: ManualWorkoutBlockInput) {
  return `${blockSemanticKindForKey(block.blockKey)} ${block.label ?? ""}`.trim();
}

function blockSemanticKindForKey(blockKey: ManualWorkoutBlockKey) {
  if (blockKey.includes("warmup")) return "warm up";
  if (blockKey.includes("cooldown")) return "cooldown";
  if (blockKey.includes("recovery")) return "recover";
  if (blockKey.includes("walk")) return "walk";
  if (blockKey.includes("long")) return "run";
  if (
    blockKey.includes("tempo") ||
    blockKey.includes("threshold") ||
    blockKey.includes("interval") ||
    blockKey.includes("hill") ||
    blockKey.includes("strides")
  ) {
    return "work";
  }
  if (blockKey.includes("finish")) return "finish";
  if (blockKey.includes("note") || blockKey.includes("mobility")) return "warm up";
  return "run";
}

function blockTargetForTimeline(block: ManualWorkoutBlockInput): StepTarget | undefined {
  const target = block.target;
  if (!target) return undefined;

  return {
    target_source: target.targetSource,
    intensity: target.intensity,
    label: target.label,
    source_note: target.sourceNote,
    pace: target.pace,
    pace_min_per_km_range: target.paceMinPerKmRange,
    hr_bpm_cap:
      typeof target.hrBpmCap === "number"
        ? target.hrBpmCap
        : Number.isFinite(Number(target.hrBpmCap))
          ? Number(target.hrBpmCap)
          : undefined,
    hr_bpm_range: target.hrBpmRange,
    hr_target_source: target.hrTargetSource,
    rpe: target.rpe,
    cue: target.cue,
    hint: target.hint,
  };
}

export function isNoteBlock(blockKey: ManualWorkoutBlockKey) {
  return blockKey === "drills_mobility_note_block" || blockKey === "coach_cue_note_block";
}

export type ManualWorkoutReadbackEntry =
  | {
      kind: "segment";
      id: string;
      markerColor: string;
      ordinal?: string;
      roleLabel?: string;
      title: string;
      targetSummary: string;
      durationSummary: string;
      nested?: boolean;
    }
  | {
      kind: "repeat";
      id: string;
      repeatCount: number;
      title: string;
      summary: string;
      children: ManualWorkoutReadbackSegmentEntry[];
    };

type ManualWorkoutReadbackSegmentEntry = Extract<ManualWorkoutReadbackEntry, { kind: "segment" }>;

export function workoutDocumentSectionsToManualReadbackEntries(
  steps: Step[],
): ManualWorkoutReadbackEntry[] {
  return steps.map((step, index) => {
    const repeatCount = repeatCountForStep(step);
    const children = repeatChildSteps(step);

    if (repeatCount && children.length > 0) {
      return {
        kind: "repeat",
        id: `manual-preview-repeat-${index}-${repeatCount}`,
        repeatCount,
        title: "Repeats",
        summary: repeatChildrenSummary(children.length),
        children: children.map((child, childIndex) =>
          stepToReadbackSegment(child, {
            id: `manual-preview-repeat-${index}-child-${childIndex}-${child.label ?? child.type}`,
            nested: true,
          }),
        ),
      };
    }

    return stepToReadbackSegment(step, {
      id: `manual-preview-segment-${index}-${step.label ?? step.type}`,
      ordinal: String(index + 1).padStart(2, "0"),
    });
  });
}

function stepToReadbackSegment(
  step: Step,
  options: {
    id: string;
    nested?: boolean;
    ordinal?: string;
    roleLabel?: string;
  },
): ManualWorkoutReadbackSegmentEntry {
  const meta = stepMeta(step);

  return {
    kind: "segment",
    id: options.id,
    markerColor: meta.color,
    nested: options.nested,
    ordinal: options.ordinal,
    roleLabel: options.roleLabel,
    title: step.label ?? meta.label,
    targetSummary: stepTargetSummary(step),
    durationSummary: stepStructureSummary(step),
  };
}

function stepTargetSummary(step: Step) {
  const entries = displayTargetEntries(step.target).slice(0, 2);

  if (entries.length === 0) return "No target";

  return entries.map((entry) => `${entry.label} · ${entry.value}`).join(" · ");
}

function stepStructureSummary(step: Step) {
  const durationMin = step.duration_min ?? step.prescription?.duration_min;
  const distanceKm = step.distance_km ?? step.prescription?.distance_km;
  const parts = [
    durationMin ? formatDurationMin(durationMin, "segment") : null,
    distanceKm ? formatPrescriptionDistanceKm(distanceKm) : null,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(" · ");

  return step.guidance ?? "Structure";
}

function stepMeta(step: Step) {
  return segmentColorMeta(
    `${step.segment_type ?? ""} ${step.type} ${step.label ?? ""}`,
    step.target,
  );
}

function repeatChildrenSummary(childCount: number) {
  return childCount === 1 ? "1 section repeats together" : `${childCount} sections repeat together`;
}
