import type {
  ManualWorkoutBlockInput,
  ManualWorkoutRepeatGroupInput,
} from "@/lib/manual-workout-authoring/schema";

const REPEAT_RECOVERY_BLOCK_KEYS = new Set<ManualWorkoutBlockInput["blockKey"]>([
  "interval_recovery_block",
  "rest_walk_jog_recovery_block",
  "easy_run_block",
]);

export function getManualWorkoutRepeatGroupChildren(
  group: ManualWorkoutRepeatGroupInput,
): ManualWorkoutBlockInput[] {
  if (group.children?.length) {
    return group.children;
  }

  return [group.workBlock, group.recoveryBlock].filter((block): block is ManualWorkoutBlockInput =>
    Boolean(block),
  );
}

export function getManualWorkoutRepeatGroupRecoveryChild(
  group: ManualWorkoutRepeatGroupInput,
): ManualWorkoutBlockInput | undefined {
  return (
    getManualWorkoutRepeatGroupChildren(group).find((block) =>
      isManualWorkoutRepeatRecoveryBlock(block.blockKey),
    ) ?? group.recoveryBlock
  );
}

export function isManualWorkoutRepeatRecoveryBlock(blockKey: ManualWorkoutBlockInput["blockKey"]) {
  return REPEAT_RECOVERY_BLOCK_KEYS.has(blockKey);
}
