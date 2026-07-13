import type {
  ManualWorkoutBlockInput,
  ManualWorkoutBlockKey,
  ManualWorkoutConstructorEntryInput,
  ManualWorkoutRepeatGroupInput,
} from "@/lib/manual-workout-authoring/schema";
import {
  getManualWorkoutRepeatGroupChildren,
  isManualWorkoutRepeatRecoveryBlock,
} from "@/lib/manual-workout-authoring/repeat-groups";
import { blockLabel } from "@/components/manual-workout/ManualWorkoutTrainingBlockGrammar.model";

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

export type ManualWorkoutDropPosition = "before" | "after";

export function manualWorkoutInsertionIndex(index: number, position: ManualWorkoutDropPosition) {
  return position === "after" ? index + 1 : index;
}

export function manualWorkoutDragTargetIndex(
  fromIndex: number,
  insertionIndex: number,
  total: number,
) {
  const boundedInsertionIndex = Math.max(0, Math.min(insertionIndex, total));
  return fromIndex < boundedInsertionIndex ? boundedInsertionIndex - 1 : boundedInsertionIndex;
}

export function manualWorkoutActiveInsertionIndex({
  fromIndex,
  overIndex,
  position,
  total,
}: {
  fromIndex: number;
  overIndex: number | null;
  position: ManualWorkoutDropPosition;
  total: number;
}) {
  if (overIndex == null) return null;

  const insertionIndex = manualWorkoutInsertionIndex(overIndex, position);
  const boundedInsertionIndex = Math.max(0, Math.min(insertionIndex, total));
  const targetIndex = manualWorkoutDragTargetIndex(fromIndex, boundedInsertionIndex, total);

  return targetIndex === fromIndex ? null : boundedInsertionIndex;
}

export function makeBlockEntry(
  blockKey: ManualWorkoutBlockKey,
): ManualWorkoutConstructorEntryInput {
  return {
    kind: "block",
    block: makeDefaultBlock(blockKey),
  };
}

export function makeRepeatEntry(): ManualWorkoutConstructorEntryInput {
  const repeatedSection = makeDefaultBlock("easy_run_block");

  return {
    kind: "repeat_group",
    group: {
      repeatCount: 3,
      safetyKind: "intervals",
      children: [repeatedSection],
      workBlock: repeatedSection,
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

export function repeatGroupWithChildren(
  group: ManualWorkoutRepeatGroupInput,
  children: ManualWorkoutBlockInput[],
): ManualWorkoutRepeatGroupInput {
  const nextChildren = children.length ? children : [group.workBlock];
  const previousChildren = getManualWorkoutRepeatGroupChildren(group);
  const childrenChanged =
    repeatChildSignature(previousChildren) !== repeatChildSignature(nextChildren);
  const recoveryBlock = nextChildren.find((child) =>
    isManualWorkoutRepeatRecoveryBlock(child.blockKey),
  );
  const nextGroup: ManualWorkoutRepeatGroupInput = {
    ...group,
    children: nextChildren,
    workBlock: nextChildren[0] ?? group.workBlock,
  };

  if (recoveryBlock) {
    nextGroup.recoveryBlock = recoveryBlock;
  } else {
    delete nextGroup.recoveryBlock;
  }

  if (childrenChanged) {
    delete nextGroup.groupLabel;
  }

  return nextGroup;
}

function repeatChildSignature(children: ManualWorkoutBlockInput[]) {
  return children
    .map((child) =>
      [
        child.blockKey,
        child.label ?? "",
        child.durationSeconds ?? "",
        child.distanceMeters ?? "",
        child.noteText ?? "",
      ].join(":"),
    )
    .join("|");
}

export function insertRepeatGroupChild(
  group: ManualWorkoutRepeatGroupInput,
  insertIndex: number,
  block: ManualWorkoutBlockInput,
) {
  const children = getManualWorkoutRepeatGroupChildren(group);
  const nextChildren = [...children];
  nextChildren.splice(Math.max(0, Math.min(insertIndex, nextChildren.length)), 0, block);
  return repeatGroupWithChildren(group, nextChildren);
}

export function moveRepeatGroupChild(
  group: ManualWorkoutRepeatGroupInput,
  fromIndex: number,
  toIndex: number,
) {
  const children = getManualWorkoutRepeatGroupChildren(group);
  if (toIndex < 0 || toIndex >= children.length) return group;

  const nextChildren = [...children];
  const [child] = nextChildren.splice(fromIndex, 1);
  if (!child) return group;

  nextChildren.splice(toIndex, 0, child);
  return repeatGroupWithChildren(group, nextChildren);
}

export type ManualWorkoutQuantityMode = "duration" | "distance" | "none";

export const QUANTITY_MODE_OPTIONS: Array<{ label: string; value: ManualWorkoutQuantityMode }> = [
  { label: "Duration", value: "duration" },
  { label: "Distance", value: "distance" },
  { label: "No duration", value: "none" },
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

export function clampInteger(value: string, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}
