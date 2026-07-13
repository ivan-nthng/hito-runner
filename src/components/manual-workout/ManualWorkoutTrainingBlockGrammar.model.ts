import type {
  ManualWorkoutBlockInput,
  ManualWorkoutBlockKey,
  ManualWorkoutConstructorEntryInput,
  ManualWorkoutRepeatGroupInput,
} from "@/lib/manual-workout-authoring/schema";
import { getManualWorkoutRepeatGroupChildren } from "@/lib/manual-workout-authoring/repeat-groups";
import {
  displayTargetSupportEntries,
  formatDistanceMeters,
  formatDurationMin,
  formatPrescriptionDistanceKm,
  repeatChildSteps,
  repeatCountForStep,
  segmentColorMeta,
  type Step,
  type StepTarget,
} from "@/lib/training";
import type {
  WorkoutStructureTimelineItem,
  WorkoutStructureTimelineReadbackEntry,
} from "@/components/workout-structure/WorkoutStructureTimeline";

export function timelineItemsForEntry(
  entry: ManualWorkoutConstructorEntryInput,
  entryIndex: number,
): WorkoutStructureTimelineItem[] {
  if (entry.kind === "repeat_group") {
    const children = repeatGroupBlocks(entry.group);

    return Array.from({ length: entry.group.repeatCount }).flatMap((_, roundIndex) =>
      children.map((block, childIndex) =>
        timelineItemForBlock(block, {
          detailLabel: `${roundIndex + 1}/${entry.group.repeatCount} · ${blockSummary(block)}`,
          id: `entry-${entryIndex}-repeat-${roundIndex}-child-${childIndex}`,
          title: `${block.label ?? blockLabel(block.blockKey)} ${roundIndex + 1}/${entry.group.repeatCount}`,
        }),
      ),
    );
  }

  return [timelineItemForBlock(entry.block, { id: `entry-${entryIndex}-block` })];
}

function timelineItemForBlock(
  block: ManualWorkoutBlockInput,
  {
    detailLabel,
    id,
    title,
  }: {
    detailLabel?: string;
    id: string;
    title?: string;
  },
): WorkoutStructureTimelineItem {
  const label = block.label ?? blockLabel(block.blockKey);
  const metric = blockSummary(block);
  const readbackEntries = blockTargetReadbackEntries(block);

  return {
    id,
    kindLabel: label,
    detailLabel: detailLabel ?? metric,
    barLabel: compactBlockStructureBarLabel(block),
    metric,
    title: title ?? label,
    semanticKind: blockSemanticKind(block),
    target: blockTargetForTimeline(block),
    weight: blockTimelineWeight(block),
    readbackEntries,
    tooltipReadbackEntries: readbackEntries,
  };
}

function repeatGroupBlocks(group: ManualWorkoutRepeatGroupInput) {
  return getManualWorkoutRepeatGroupChildren(group);
}

export function entryDurationSeconds(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    return (
      getManualWorkoutRepeatGroupChildren(entry.group).reduce(
        (sum, block) => sum + blockDurationSeconds(block),
        0,
      ) * entry.group.repeatCount
    );
  }

  return blockDurationSeconds(entry.block);
}

function blockDurationSeconds(block: ManualWorkoutBlockInput) {
  return block.durationSeconds ?? 0;
}

export function entryDistanceMeters(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    return (
      getManualWorkoutRepeatGroupChildren(entry.group).reduce(
        (sum, block) => sum + blockDistanceMeters(block),
        0,
      ) * entry.group.repeatCount
    );
  }

  return blockDistanceMeters(entry.block);
}

function blockDistanceMeters(block: ManualWorkoutBlockInput) {
  return block.distanceMeters ?? 0;
}

function blockTimelineWeight(block: ManualWorkoutBlockInput) {
  if (block.durationSeconds) return block.durationSeconds;
  if (block.distanceMeters) return Math.max(block.distanceMeters / 10, 20);
  return 20;
}

export function blockSummary(block: ManualWorkoutBlockInput) {
  if (block.durationSeconds) return formatDurationMin(block.durationSeconds / 60, "segment");
  if (block.distanceMeters) return formatDistanceMeters(block.distanceMeters);
  if (block.noteText) return block.noteText;
  return "Structure";
}

export function blockLabel(blockKey: string) {
  if (blockKey === "warmup_block") return "Warm-up";
  if (blockKey === "interval_work_block") return "Work";
  if (blockKey === "interval_recovery_block") return "Recovery";
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

function compactBlockStructureBarLabel(block: ManualWorkoutBlockInput) {
  if (block.durationSeconds) return compactDurationLabel(block.durationSeconds / 60);
  if (block.distanceMeters) return `${Math.round(block.distanceMeters)}m`;
  return blockShortLabel(block.blockKey);
}

function compactDurationLabel(durationMin: number) {
  const totalSeconds = Math.max(1, Math.round(durationMin * 60));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
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

function blockTargetReadbackEntries(
  block: ManualWorkoutBlockInput,
): WorkoutStructureTimelineReadbackEntry[] {
  const target = block.target;
  if (!target) return [];

  const entries: WorkoutStructureTimelineReadbackEntry[] = [];
  const pace = target.pace || target.paceMinPerKmRange;
  if (pace) {
    entries.push({
      key: "pace",
      label: target.label ?? "Your pace target",
      value: pace,
    });
  }

  const hrValue =
    target.hrBpmCap != null
      ? `${target.hrBpmCap} bpm cap`
      : target.hrBpmRange
        ? target.hrBpmRange
        : null;
  if (hrValue) {
    entries.push({
      key: "heart_rate",
      label: target.label ?? "Your heart-rate target",
      value: hrValue,
    });
  }

  const rpeValue = joinTargetReadbackParts([
    target.rpe != null && target.rpe !== "" ? `RPE ${target.rpe}` : null,
    target.cue,
  ]);
  if (rpeValue || target.intensity) {
    entries.push({
      key: "rpe",
      label: target.label ?? "Effort (RPE 0-10)",
      value: rpeValue ?? target.intensity ?? "Runner-entered",
    });
  }

  return entries;
}

function joinTargetReadbackParts(parts: Array<string | null | undefined>) {
  const visibleParts = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return visibleParts.length ? visibleParts.join(" · ") : null;
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

export function manualConstructorEntriesToReadbackEntries(
  entries: ManualWorkoutConstructorEntryInput[],
): ManualWorkoutReadbackEntry[] {
  return entries.map((entry, index) => {
    if (entry.kind === "repeat_group") {
      const children = getManualWorkoutRepeatGroupChildren(entry.group);

      return {
        kind: "repeat",
        id: `repeat-readback-${index}-${entry.group.repeatCount}`,
        repeatCount: entry.group.repeatCount,
        title: "Repeats",
        summary: repeatChildrenSummary(children.length),
        children: children.map((block, childIndex) =>
          manualBlockToReadbackSegment(block, {
            id: `repeat-readback-child-${index}-${childIndex}-${block.blockKey}-${block.label ?? ""}`,
            nested: true,
          }),
        ),
      };
    }

    return manualBlockToReadbackSegment(entry.block, {
      id: `block-readback-${index}-${entry.block.blockKey}-${entry.block.label ?? ""}`,
      ordinal: String(index + 1).padStart(2, "0"),
    });
  });
}

export function manualWorkoutStepsToReadbackEntries(steps: Step[]): ManualWorkoutReadbackEntry[] {
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

function manualBlockToReadbackSegment(
  block: ManualWorkoutBlockInput,
  options: {
    id: string;
    nested?: boolean;
    ordinal?: string;
    roleLabel?: string;
  },
): ManualWorkoutReadbackSegmentEntry {
  return {
    kind: "segment",
    id: options.id,
    markerColor: blockColor(block),
    nested: options.nested,
    ordinal: options.ordinal,
    roleLabel: options.roleLabel,
    title: block.label ?? blockLabel(block.blockKey),
    targetSummary: manualBlockTargetSummary(block),
    durationSummary: blockSummary(block),
  };
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
  return {
    kind: "segment",
    id: options.id,
    markerColor: stepColor(step),
    nested: options.nested,
    ordinal: options.ordinal,
    roleLabel: options.roleLabel,
    title: step.label ?? readableStepLabel(step),
    targetSummary: stepTargetSummary(step),
    durationSummary: stepStructureSummary(step),
  };
}

function manualBlockTargetSummary(block: ManualWorkoutBlockInput) {
  const target = block.target;
  if (!target) return "No target";

  const pace = target.pace || target.paceMinPerKmRange;
  const heartRate =
    target.hrBpmCap != null
      ? `${target.hrBpmCap} bpm cap`
      : target.hrBpmRange
        ? target.hrBpmRange
        : null;
  const effort =
    target.rpe != null && target.rpe !== ""
      ? `RPE ${target.rpe}`
      : target.intensity || target.cue || null;
  const value = pace || heartRate || effort;

  return value ? [target.label, value].filter(Boolean).join(" · ") : "No target";
}

function stepTargetSummary(step: Step) {
  const entries = displayTargetSupportEntries(step.target).slice(0, 2);

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

function stepColor(step: Step) {
  return segmentColorMeta(
    `${step.segment_type ?? ""} ${step.type} ${step.label ?? ""}`,
    step.target,
  ).color;
}

function repeatChildrenSummary(childCount: number) {
  return childCount === 1 ? "1 section repeats together" : `${childCount} sections repeat together`;
}

function readableStepLabel(step: Step) {
  return step.type
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
