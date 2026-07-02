import type {
  ManualWorkoutBlockInput,
  ManualWorkoutBlockKey,
  ManualWorkoutConstructorEntryInput,
  ManualWorkoutRepeatGroupInput,
} from "@/lib/manual-workout-authoring/schema";
import {
  formatDistanceMeters,
  formatDurationMin,
  segmentColorMeta,
  type StepTarget,
} from "@/lib/training";
import type {
  WorkoutStructureTimelineItem,
  WorkoutStructureTimelineReadbackEntry,
} from "@/components/workout-structure/WorkoutStructureTimeline";

export const BLOCK_MENU_GROUPS: Array<{ label: string; items: ManualWorkoutBlockKey[] }> = [
  { label: "Preparation", items: ["warmup_block", "drills_mobility_note_block"] },
  {
    label: "Run",
    items: ["easy_run_block", "steady_run_block", "progression_block", "strides_block"],
  },
  {
    label: "Quality",
    items: ["tempo_block", "threshold_block", "interval_work_block", "hill_work_block"],
  },
  {
    label: "Recovery",
    items: ["interval_recovery_block", "rest_walk_jog_recovery_block", "cooldown_block"],
  },
  {
    label: "Endurance",
    items: ["long_run_body_block", "long_run_finish_block", "downhill_control_block"],
  },
  { label: "Notes", items: ["coach_cue_note_block"] },
];

export const REPEAT_COUNT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

const DURATION_SECONDS_OPTIONS = [
  15, 20, 30, 45, 60, 75, 90, 120, 180, 240, 300, 480, 600, 720, 900, 1200, 1500, 1800, 2400, 2700,
  3600, 4500, 5400,
];

const DISTANCE_METERS_OPTIONS = [
  100, 200, 300, 400, 500, 600, 800, 1000, 1200, 1600, 2000, 3000, 4000, 5000, 8000, 10000, 12000,
  16000, 20000,
];

export function makeBlockEntry(
  blockKey: ManualWorkoutBlockKey,
): ManualWorkoutConstructorEntryInput {
  return {
    kind: "block",
    block: makeDefaultBlock(blockKey),
  };
}

export function makeRepeatEntry(): ManualWorkoutConstructorEntryInput {
  return {
    kind: "repeat_group",
    group: {
      repeatCount: 6,
      safetyKind: "intervals",
      groupLabel: "6 rounds repeat set",
      workBlock: makeDefaultBlock("interval_work_block"),
      recoveryBlock: makeDefaultBlock("interval_recovery_block"),
    },
  };
}

export function insertEntry(
  entries: ManualWorkoutConstructorEntryInput[],
  insertIndex: number,
  entry: ManualWorkoutConstructorEntryInput,
) {
  const nextEntries = [...entries];
  nextEntries.splice(Math.max(0, Math.min(insertIndex, nextEntries.length)), 0, entry);
  return nextEntries;
}

export function moveEntry(
  entries: ManualWorkoutConstructorEntryInput[],
  fromIndex: number,
  toIndex: number,
) {
  if (toIndex < 0 || toIndex >= entries.length) return entries;
  const nextEntries = [...entries];
  const [entry] = nextEntries.splice(fromIndex, 1);
  if (!entry) return entries;
  nextEntries.splice(toIndex, 0, entry);
  return nextEntries;
}

export function makeDefaultBlock(blockKey: ManualWorkoutBlockKey): ManualWorkoutBlockInput {
  if (blockKey === "drills_mobility_note_block") {
    return { blockKey, label: "Drills or mobility", noteText: "Add a short support note." };
  }
  if (blockKey === "coach_cue_note_block") {
    return { blockKey, label: "Coach cue", noteText: "Add a short cue." };
  }
  if (blockKey === "strides_block") {
    return { blockKey, durationSeconds: 20, label: "Stride" };
  }
  if (blockKey === "interval_work_block") {
    return { blockKey, durationSeconds: 2 * 60, label: "Work" };
  }
  if (blockKey === "interval_recovery_block") {
    return { blockKey, durationSeconds: 60, label: "Easy jog recovery" };
  }
  if (blockKey === "rest_walk_jog_recovery_block") {
    return { blockKey, durationSeconds: 90, label: "Walk-jog recovery" };
  }
  if (blockKey === "hill_work_block") {
    return { blockKey, durationSeconds: 45, label: "Uphill work" };
  }
  if (blockKey === "long_run_body_block") {
    return { blockKey, durationSeconds: 60 * 60, label: "Long-run body" };
  }
  if (blockKey === "long_run_finish_block") {
    return { blockKey, durationSeconds: 10 * 60, label: "Controlled finish" };
  }
  if (blockKey === "cooldown_block") {
    return { blockKey, durationSeconds: 5 * 60, label: "Cooldown" };
  }
  if (blockKey === "warmup_block") {
    return { blockKey, durationSeconds: 10 * 60, label: "Warmup" };
  }
  if (blockKey === "tempo_block") {
    return { blockKey, durationSeconds: 8 * 60, label: "Tempo work" };
  }
  if (blockKey === "threshold_block") {
    return { blockKey, durationSeconds: 10 * 60, label: "Threshold work" };
  }
  if (blockKey === "progression_block") {
    return { blockKey, durationSeconds: 25 * 60, label: "Easy to steady progression" };
  }
  if (blockKey === "downhill_control_block") {
    return { blockKey, durationSeconds: 45, label: "Controlled downhill" };
  }

  return { blockKey, durationSeconds: 10 * 60, label: blockLabel(blockKey) };
}

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
  return [group.workBlock, group.recoveryBlock].filter((block): block is ManualWorkoutBlockInput =>
    Boolean(block),
  );
}

export function entryDurationSeconds(entry: ManualWorkoutConstructorEntryInput) {
  if (entry.kind === "repeat_group") {
    return (
      (blockDurationSeconds(entry.group.workBlock) +
        (entry.group.recoveryBlock ? blockDurationSeconds(entry.group.recoveryBlock) : 0)) *
      entry.group.repeatCount
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
      (blockDistanceMeters(entry.group.workBlock) +
        (entry.group.recoveryBlock ? blockDistanceMeters(entry.group.recoveryBlock) : 0)) *
      entry.group.repeatCount
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

export function repeatGroupSummary(group: ManualWorkoutRepeatGroupInput) {
  const children = [group.workBlock, group.recoveryBlock].filter(
    (block): block is ManualWorkoutBlockInput => Boolean(block),
  );
  const childSummary = children.map(repeatChildSummary).join(" + ");
  return `${group.repeatCount} rounds · ${childSummary}`;
}

export function blockSummary(block: ManualWorkoutBlockInput) {
  if (block.durationSeconds) return formatDurationMin(block.durationSeconds / 60, "segment");
  if (block.distanceMeters) return formatDistanceMeters(block.distanceMeters);
  if (block.noteText) return block.noteText;
  return "Structure";
}

function repeatChildSummary(block: ManualWorkoutBlockInput) {
  const label = block.label ?? blockLabel(block.blockKey);
  const summary = blockSummary(block);
  return summary === "Structure" ? label : `${label} ${summary}`;
}

export function blockLabel(blockKey: string) {
  if (blockKey === "warmup_block") return "Warm-up";
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

export type ManualWorkoutQuantityMode = "duration" | "distance" | "none";

export const QUANTITY_MODE_OPTIONS: Array<{ label: string; value: ManualWorkoutQuantityMode }> = [
  { label: "Duration", value: "duration" },
  { label: "Distance", value: "distance" },
  { label: "No quantity", value: "none" },
];

export function quantityModeForBlock(block: ManualWorkoutBlockInput): ManualWorkoutQuantityMode {
  if (block.distanceMeters) return "distance";
  if (block.durationSeconds) return "duration";
  return "none";
}

export function blockForQuantityMode(
  block: ManualWorkoutBlockInput,
  mode: string,
): ManualWorkoutBlockInput {
  if (mode === "distance") {
    return {
      ...block,
      distanceMeters: block.distanceMeters ?? 1000,
      durationSeconds: undefined,
    };
  }

  if (mode === "none") {
    return {
      ...block,
      distanceMeters: undefined,
      durationSeconds: undefined,
    };
  }

  return {
    ...block,
    distanceMeters: undefined,
    durationSeconds:
      block.durationSeconds ?? makeDefaultBlock(block.blockKey).durationSeconds ?? 600,
  };
}

export function blockWithQuantityValue(
  block: ManualWorkoutBlockInput,
  mode: ManualWorkoutQuantityMode,
  value: string,
): ManualWorkoutBlockInput {
  if (mode === "distance") {
    return {
      ...block,
      distanceMeters: value === "none" ? undefined : parsePositiveInteger(value),
      durationSeconds: undefined,
    };
  }

  if (mode === "none") {
    return {
      ...block,
      distanceMeters: undefined,
      durationSeconds: undefined,
    };
  }

  return {
    ...block,
    distanceMeters: undefined,
    durationSeconds: value === "none" ? undefined : parsePositiveInteger(value),
  };
}

export function durationOptionsFor(currentValue: number | undefined) {
  return optionsWithCurrentValue(DURATION_SECONDS_OPTIONS, currentValue, "No duration", (seconds) =>
    formatDurationMin(seconds / 60, "segment"),
  );
}

export function distanceOptionsFor(currentValue: number | undefined) {
  return optionsWithCurrentValue(
    DISTANCE_METERS_OPTIONS,
    currentValue,
    "No distance",
    formatDistanceMeters,
  );
}

function optionsWithCurrentValue(
  baseValues: number[],
  currentValue: number | undefined,
  emptyLabel: string,
  formatValue: (value: number) => string,
) {
  const values =
    currentValue && !baseValues.includes(currentValue)
      ? [...baseValues, currentValue].sort((a, b) => a - b)
      : baseValues;

  return [
    { label: emptyLabel, value: "none" },
    ...values.map((value) => ({ label: formatValue(value), value: String(value) })),
  ];
}

function parsePositiveInteger(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.max(1, Math.round(parsed));
}

export function clampInteger(value: string, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}
