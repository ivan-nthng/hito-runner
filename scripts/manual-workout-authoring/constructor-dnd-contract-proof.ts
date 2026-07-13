import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  manualWorkoutActiveInsertionIndex,
  manualWorkoutDragTargetIndex,
  manualWorkoutInsertionIndex,
  moveEntry,
  moveRepeatGroupChild,
  type ManualWorkoutDropPosition,
} from "../../src/components/manual-workout/ManualWorkoutConstructorEditor.helpers";
import {
  getManualWorkoutRepeatGroupChildren,
  isManualWorkoutRepeatRecoveryBlock,
} from "../../src/lib/manual-workout-authoring/repeat-groups";
import {
  type ManualWorkoutConstructorEntryInput,
  type ManualWorkoutDraftInput,
  type ManualWorkoutRepeatGroupInput,
} from "../../src/lib/manual-workout-authoring";
import { assertReady } from "./move-proof-fixtures";

export function validateManualConstructorDndContract() {
  assertCanonicalInsertionIndex();
  assertTopLevelSectionReorder();
  assertRepeatContainerReorder();
  assertRepeatChildReorder();
}

function assertCanonicalInsertionIndex() {
  const total = 4;

  assert.equal(
    manualWorkoutActiveInsertionIndex({
      fromIndex: 2,
      overIndex: 0,
      position: "after",
      total,
    }),
    1,
    "after previous card should resolve to the gap insertion index",
  );
  assert.equal(
    manualWorkoutActiveInsertionIndex({
      fromIndex: 2,
      overIndex: 1,
      position: "before",
      total,
    }),
    1,
    "before next card should resolve to the same physical gap insertion index",
  );
  assert.equal(
    manualWorkoutActiveInsertionIndex({
      fromIndex: 2,
      overIndex: 2,
      position: "after",
      total,
    }),
    null,
    "dragging over the source card's no-op insertion should not render a slot",
  );
}

function assertTopLevelSectionReorder() {
  const entries = fixtureEntries();
  const reordered = moveEntryByDrop(entries, 2, 1, "before");

  assert.deepEqual(
    entryLabels(reordered),
    ["Warm-up", "Easy aerobic", "Repeat set", "Cooldown"],
    "top-level section drag should commit entry order through the shared drop-index math",
  );

  assertReady("top-level section DnD review", {
    entries: reordered,
    templateKey: "time_intervals",
    workoutDate: "2026-07-14",
  });
}

function assertRepeatContainerReorder() {
  const entries = fixtureEntries();
  const reordered = moveEntryByDrop(entries, 1, 2, "after");

  assert.deepEqual(
    entryLabels(reordered),
    ["Warm-up", "Easy aerobic", "Repeat set", "Cooldown"],
    "repeat container drag should behave as a normal top-level constructor entry",
  );
  assert.deepEqual(
    repeatChildLabels(reordered),
    ["Work", "Recover", "Easy steady"],
    "repeat container drag should move the container without rewriting ordered children",
  );

  assertReady("repeat container DnD review", {
    entries: reordered,
    templateKey: "time_intervals",
    workoutDate: "2026-07-15",
  });
}

function assertRepeatChildReorder() {
  const entries = fixtureEntries();
  const repeatEntry = entries.find(
    (entry): entry is Extract<ManualWorkoutConstructorEntryInput, { kind: "repeat_group" }> =>
      entry.kind === "repeat_group",
  );

  assert.ok(repeatEntry, "fixture should include a repeat group");

  const reorderedGroup = moveRepeatChildByDrop(repeatEntry.group, 1, 2, "after");
  const children = getManualWorkoutRepeatGroupChildren(reorderedGroup);

  assert.deepEqual(
    children.map((child) => child.label),
    ["Work", "Easy steady", "Recover"],
    "repeat child drag should commit canonical group.children[] order",
  );
  assert.equal(
    reorderedGroup.workBlock,
    children[0],
    "repeat child reorder should keep legacy workBlock synchronized to the first child",
  );
  assert.equal(
    reorderedGroup.recoveryBlock,
    children.find((child) => isManualWorkoutRepeatRecoveryBlock(child.blockKey)),
    "repeat child reorder should keep legacy recoveryBlock synchronized to the recovery child",
  );
  assert.equal(
    reorderedGroup.groupLabel,
    undefined,
    "repeat child reorder should clear stale groupLabel readback after child order changes",
  );

  const nextEntries = entries.map((entry) =>
    entry === repeatEntry ? { kind: "repeat_group" as const, group: reorderedGroup } : entry,
  );
  const review = assertReady("repeat child DnD review", {
    entries: nextEntries,
    templateKey: "time_intervals",
    workoutDate: "2026-07-16",
  });
  const repeatReadback = review.constructorContract.timeline.find(
    (entryValue) => entryValue.kind === "repeat",
  );

  assert.ok(repeatReadback, "review readback should include the repeat group");
  assert.deepEqual(
    repeatReadback.children.map((child) => child.label),
    ["Work", "Easy steady", "Recover"],
    "review readback should preserve reordered repeat child labels",
  );
}

function moveEntryByDrop(
  entries: ManualWorkoutConstructorEntryInput[],
  fromIndex: number,
  overIndex: number,
  position: ManualWorkoutDropPosition,
) {
  const insertionIndex = manualWorkoutInsertionIndex(overIndex, position);
  const targetIndex = manualWorkoutDragTargetIndex(fromIndex, insertionIndex, entries.length);
  return moveEntry(entries, fromIndex, targetIndex);
}

function moveRepeatChildByDrop(
  group: ManualWorkoutRepeatGroupInput,
  fromIndex: number,
  overIndex: number,
  position: ManualWorkoutDropPosition,
) {
  const children = getManualWorkoutRepeatGroupChildren(group);
  const insertionIndex = manualWorkoutInsertionIndex(overIndex, position);
  const targetIndex = manualWorkoutDragTargetIndex(fromIndex, insertionIndex, children.length);
  return moveRepeatGroupChild(group, fromIndex, targetIndex);
}

function fixtureEntries(): ManualWorkoutConstructorEntryInput[] {
  return [
    {
      kind: "block",
      block: { blockKey: "warmup_block", durationSeconds: 10 * 60, label: "Warm-up" },
    },
    {
      kind: "repeat_group",
      group: {
        repeatCount: 3,
        safetyKind: "intervals",
        groupLabel: "Intervals set",
        children: [
          { blockKey: "interval_work_block", durationSeconds: 2 * 60, label: "Work" },
          {
            blockKey: "interval_recovery_block",
            durationSeconds: 60,
            label: "Recover",
          },
          { blockKey: "easy_run_block", durationSeconds: 90, label: "Easy steady" },
        ],
        workBlock: { blockKey: "interval_work_block", durationSeconds: 2 * 60, label: "Work" },
        recoveryBlock: {
          blockKey: "interval_recovery_block",
          durationSeconds: 60,
          label: "Recover",
        },
      },
    },
    {
      kind: "block",
      block: { blockKey: "easy_run_block", durationSeconds: 10 * 60, label: "Easy aerobic" },
    },
    {
      kind: "block",
      block: { blockKey: "cooldown_block", durationSeconds: 5 * 60, label: "Cooldown" },
    },
  ];
}

function entryLabels(entries: ManualWorkoutConstructorEntryInput[]) {
  return entries.map((entry) =>
    entry.kind === "repeat_group" ? "Repeat set" : (entry.block.label ?? entry.block.blockKey),
  );
}

function repeatChildLabels(entries: ManualWorkoutConstructorEntryInput[]) {
  const repeatEntry = entries.find(
    (entry): entry is Extract<ManualWorkoutConstructorEntryInput, { kind: "repeat_group" }> =>
      entry.kind === "repeat_group",
  );

  assert.ok(repeatEntry, "entries should include a repeat group");
  return getManualWorkoutRepeatGroupChildren(repeatEntry.group).map((child) => child.label);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  validateManualConstructorDndContract();
  console.log("Manual constructor DnD contract passed.");
}
