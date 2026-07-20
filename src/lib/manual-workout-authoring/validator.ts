import {
  type ManualWorkoutBlockInput,
  type ManualWorkoutConstructorEntryInput,
  type ManualWorkoutDraftIssue,
  type ManualWorkoutDraftProcessingOptions,
  type ManualWorkoutRepeatGroupInput,
  type ManualWorkoutTargetTruthMode,
  type ParsedManualWorkoutDraftInput,
} from "@/lib/manual-workout-authoring/schema";
import {
  getManualWorkoutTemplate,
  type ManualWorkoutTemplate,
} from "@/lib/manual-workout-authoring/templates";
import { validateManualWorkoutTargetInput } from "@/lib/manual-workout-authoring/target-input";
import {
  getManualWorkoutRepeatGroupChildren,
  isManualWorkoutRepeatRecoveryBlock,
} from "@/lib/manual-workout-authoring/repeat-groups";

export type ManualWorkoutDraftValidationResult =
  | {
      ok: true;
      template: ManualWorkoutTemplate;
      targetTruthMode: ManualWorkoutTargetTruthMode;
      entries: ManualWorkoutConstructorEntryInput[];
    }
  | {
      ok: false;
      issues: ManualWorkoutDraftIssue[];
    };

const NOTE_ONLY_BLOCKS = new Set<ManualWorkoutBlockInput["blockKey"]>([
  "coach_cue_note_block",
  "drills_mobility_note_block",
]);

const SUBSTANTIVE_WORK_BLOCKS = new Set<ManualWorkoutBlockInput["blockKey"]>([
  "steady_run_block",
  "progression_block",
  "tempo_block",
  "threshold_block",
  "interval_work_block",
  "hill_work_block",
  "downhill_control_block",
  "long_run_body_block",
  "long_run_finish_block",
  "strides_block",
]);

export function validateManualWorkoutDraft(
  input: ParsedManualWorkoutDraftInput,
  options: ManualWorkoutDraftProcessingOptions = {},
): ManualWorkoutDraftValidationResult {
  const template = getManualWorkoutTemplate(input.templateKey);
  const targetTruthMode = input.targetTruthMode ?? template.defaultTargetTruthMode;
  const entries = input.entries?.length ? input.entries : template.defaultEntries;
  const issues = validateManualWorkoutEntries(template, targetTruthMode, entries, options);

  if (issues.length > 0) {
    return {
      ok: false,
      issues,
    };
  }

  return {
    ok: true,
    template,
    targetTruthMode,
    entries,
  };
}

export function isManualWorkoutNoteOnlyBlock(blockKey: ManualWorkoutBlockInput["blockKey"]) {
  return NOTE_ONLY_BLOCKS.has(blockKey);
}

function validateManualWorkoutEntries(
  template: ManualWorkoutTemplate,
  targetTruthMode: ManualWorkoutTargetTruthMode,
  entries: ManualWorkoutConstructorEntryInput[],
  options: ManualWorkoutDraftProcessingOptions,
): ManualWorkoutDraftIssue[] {
  const issues: ManualWorkoutDraftIssue[] = [];

  if (!template.allowedTargetTruthModes.includes(targetTruthMode)) {
    issues.push({
      code: "unsafe_metric_truth",
      message: `${template.templateKey} does not allow ${targetTruthMode} target truth.`,
      path: ["targetTruthMode"],
    });
  }

  if (template.workoutType === "rest") {
    validateRestEntries(entries, issues);
    return issues;
  }

  if (targetTruthMode === "none") {
    issues.push({
      code: "unsafe_metric_truth",
      message: "Non-rest manual workouts require structure_only target truth.",
      path: ["targetTruthMode"],
    });
  }

  if (entries.length === 0) {
    issues.push({
      code: "missing_executable_structure",
      message: "Non-rest manual workouts require at least one executable block or repeat group.",
      path: ["entries"],
    });
  }

  for (const [index, entryValue] of entries.entries()) {
    validateEntry(entryValue, issues, ["entries", index], options);
  }

  if (
    template.requiresRepeatGroup &&
    !options.allowPersistedTemplateShape &&
    !entries.some((entryValue) => entryValue.kind === "repeat_group")
  ) {
    issues.push({
      code: "unsafe_block_structure",
      message: `${template.templateKey} requires an explicit repeat group.`,
      path: ["entries"],
    });
  }

  if (template.requiresWarmupCooldown) {
    validateWarmupCooldownChronology(entries, issues);
  }

  if (template.longRunRequiresMultiBlockAboveSeconds) {
    validateLongRunAnatomy(template, entries, issues);
  }

  return issues;
}

function validateRestEntries(
  entries: ManualWorkoutConstructorEntryInput[],
  issues: ManualWorkoutDraftIssue[],
) {
  for (const [index, entryValue] of entries.entries()) {
    if (entryValue.kind === "repeat_group") {
      issues.push({
        code: "unsafe_block_structure",
        message: "Rest days cannot include repeat groups.",
        path: ["entries", index],
      });
      continue;
    }

    if (!NOTE_ONLY_BLOCKS.has(entryValue.block.blockKey)) {
      issues.push({
        code: "unsafe_block_structure",
        message: "Rest days can include notes only, not run blocks.",
        path: ["entries", index, "block", "blockKey"],
      });
    }
  }
}

function validateEntry(
  entryValue: ManualWorkoutConstructorEntryInput,
  issues: ManualWorkoutDraftIssue[],
  path: Array<string | number>,
  options: ManualWorkoutDraftProcessingOptions,
) {
  if (entryValue.kind === "block") {
    validateBlock(entryValue.block, issues, [...path, "block"], options);
    return;
  }

  validateRepeatGroup(entryValue.group, issues, [...path, "group"], options);
}

function validateBlock(
  block: ManualWorkoutBlockInput,
  issues: ManualWorkoutDraftIssue[],
  path: Array<string | number>,
  options: ManualWorkoutDraftProcessingOptions,
) {
  if (block.nestedRepeatGroup !== undefined) {
    issues.push({
      code: "nested_repeat_not_supported",
      message: "Nested repeats are not supported in manual workout authoring v1.",
      path: [...path, "nestedRepeatGroup"],
    });
  }

  issues.push(...validateManualWorkoutTargetInput(block, "structure_only", path, options));

  if (NOTE_ONLY_BLOCKS.has(block.blockKey)) {
    if (!block.noteText?.trim()) {
      issues.push({
        code: "missing_executable_structure",
        message: `${block.blockKey} requires noteText.`,
        path: [...path, "noteText"],
      });
    }

    return;
  }

  if (!block.durationSeconds && !block.distanceMeters) {
    issues.push({
      code: "missing_executable_structure",
      message: `${block.blockKey} requires durationSeconds or distanceMeters.`,
      path,
    });
  }
}

function validateRepeatGroup(
  group: ManualWorkoutRepeatGroupInput,
  issues: ManualWorkoutDraftIssue[],
  path: Array<string | number>,
  options: ManualWorkoutDraftProcessingOptions,
) {
  const children = getManualWorkoutRepeatGroupChildren(group);

  if (group.nestedRepeatGroup !== undefined) {
    issues.push({
      code: "nested_repeat_not_supported",
      message: "Nested repeats are not supported in manual workout authoring v1.",
      path: [...path, "nestedRepeatGroup"],
    });
  }

  if (children.length === 0) {
    issues.push({
      code: "missing_executable_structure",
      message: `${group.safetyKind} repeat groups require at least one child block.`,
      path: [...path, "children"],
    });
  }

  for (const [childIndex, child] of children.entries()) {
    validateBlock(child, issues, [...path, "children", childIndex], options);

    if (NOTE_ONLY_BLOCKS.has(child.blockKey)) {
      issues.push({
        code: "unsafe_block_structure",
        message: "Repeat groups can include executable child sections only, not note blocks.",
        path: [...path, "children", childIndex, "blockKey"],
      });
    }
  }

  if (
    requiresRecovery(group.safetyKind) &&
    !children.some((child) => isManualWorkoutRepeatRecoveryBlock(child.blockKey))
  ) {
    issues.push({
      code: "missing_recovery",
      message: `${group.safetyKind} repeat groups require an explicit recovery block.`,
      path: [...path, "children"],
    });
  }

  if (!hasCompatibleRepeatWorkChild(group.safetyKind, children)) {
    issues.push({
      code: "unsafe_block_structure",
      message: `${group.safetyKind} repeat group requires a compatible work child.`,
      path: [...path, "children"],
    });
  }
}

function validateWarmupCooldownChronology(
  entries: ManualWorkoutConstructorEntryInput[],
  issues: ManualWorkoutDraftIssue[],
) {
  const warmupIndex = entries.findIndex(
    (entryValue) => entryValue.kind === "block" && entryValue.block.blockKey === "warmup_block",
  );
  const cooldownIndex = entries.findIndex(
    (entryValue) => entryValue.kind === "block" && entryValue.block.blockKey === "cooldown_block",
  );
  const firstSubstantiveIndex = entries.findIndex((entryValue) =>
    entryValue.kind === "repeat_group"
      ? true
      : SUBSTANTIVE_WORK_BLOCKS.has(entryValue.block.blockKey),
  );

  if (warmupIndex < 0) {
    issues.push({
      code: "unsafe_block_structure",
      message: "This workout requires a warmup block before the main work.",
      path: ["entries"],
    });
  }

  if (cooldownIndex < 0) {
    issues.push({
      code: "unsafe_block_structure",
      message: "This workout requires a cooldown block after the main work.",
      path: ["entries"],
    });
  }

  if (firstSubstantiveIndex >= 0 && warmupIndex > firstSubstantiveIndex) {
    issues.push({
      code: "unsafe_block_structure",
      message: "Warmup must appear before substantive work.",
      path: ["entries"],
    });
  }

  if (firstSubstantiveIndex >= 0 && cooldownIndex >= 0 && cooldownIndex < firstSubstantiveIndex) {
    issues.push({
      code: "unsafe_block_structure",
      message: "Cooldown must appear after substantive work.",
      path: ["entries"],
    });
  }
}

function validateLongRunAnatomy(
  template: ManualWorkoutTemplate,
  entries: ManualWorkoutConstructorEntryInput[],
  issues: ManualWorkoutDraftIssue[],
) {
  const totalSeconds = entries.reduce((total, entryValue) => {
    if (entryValue.kind === "block") {
      return total + (entryValue.block.durationSeconds ?? 0);
    }

    const repeatSeconds = getManualWorkoutRepeatGroupChildren(entryValue.group).reduce(
      (childTotal, child) => childTotal + (child.durationSeconds ?? 0),
      0,
    );
    return total + entryValue.group.repeatCount * repeatSeconds;
  }, 0);

  if (
    totalSeconds <= (template.longRunRequiresMultiBlockAboveSeconds ?? Number.POSITIVE_INFINITY)
  ) {
    return;
  }

  const executableRunBlocks = entries.filter(
    (entryValue) =>
      entryValue.kind === "block" &&
      !NOTE_ONLY_BLOCKS.has(entryValue.block.blockKey) &&
      Boolean(entryValue.block.durationSeconds || entryValue.block.distanceMeters),
  );
  const hasLongRunBody = entries.some(
    (entryValue) =>
      entryValue.kind === "block" && entryValue.block.blockKey === "long_run_body_block",
  );

  if (!hasLongRunBody || executableRunBlocks.length < 2) {
    issues.push({
      code: "unsafe_block_structure",
      message:
        "Long runs over 60 minutes must include long-run body plus another executable block.",
      path: ["entries"],
    });
  }
}

function requiresRecovery(safetyKind: ManualWorkoutRepeatGroupInput["safetyKind"]) {
  return ["intervals", "tempo_repeats", "hill_repeats", "run_walk", "downhill_control"].includes(
    safetyKind,
  );
}

function hasCompatibleRepeatWorkChild(
  safetyKind: ManualWorkoutRepeatGroupInput["safetyKind"],
  children: ManualWorkoutBlockInput[],
) {
  switch (safetyKind) {
    case "intervals":
      return children.some((child) => child.blockKey === "interval_work_block");
    case "tempo_repeats":
      return children.some(
        (child) => child.blockKey === "tempo_block" || child.blockKey === "threshold_block",
      );
    case "hill_repeats":
      return children.some((child) => child.blockKey === "hill_work_block");
    case "run_walk":
      return children.some((child) => child.blockKey === "easy_run_block");
    case "strides":
      return children.some((child) => child.blockKey === "strides_block");
    case "downhill_control":
      return children.some((child) => child.blockKey === "downhill_control_block");
    default:
      return false;
  }
}
