import type {
  ManualWorkoutBlockInput,
  ManualWorkoutConstructorContract,
  ManualWorkoutConstructorEntryInput,
  ManualWorkoutConstructorMetadataNote,
  ManualWorkoutConstructorRepeatGroup,
  ManualWorkoutConstructorSegment,
  ManualWorkoutConstructorSegmentRole,
  ManualWorkoutConstructorSegmentStructure,
  ManualWorkoutConstructorSegmentTarget,
  ManualWorkoutTargetTruthMode,
  ParsedManualWorkoutDraftInput,
} from "@/lib/manual-workout-authoring/schema";
import { MANUAL_WORKOUT_CONSTRUCTOR_CONTRACT_VERSION } from "@/lib/manual-workout-authoring/schema";
import type { ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import { resolveManualWorkoutTargetInput } from "@/lib/manual-workout-authoring/target-input";
import { isManualWorkoutNoteOnlyBlock } from "@/lib/manual-workout-authoring/validator";

interface BuildManualWorkoutConstructorContractInput {
  parsedInput: ParsedManualWorkoutDraftInput;
  template: ManualWorkoutTemplate;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  entries: ManualWorkoutConstructorEntryInput[];
}

export function buildManualWorkoutConstructorContract(
  input: BuildManualWorkoutConstructorContractInput,
): ManualWorkoutConstructorContract {
  const timeline: ManualWorkoutConstructorContract["timeline"] = [];
  const metadataNotes: ManualWorkoutConstructorMetadataNote[] = [];

  for (const entryValue of input.entries) {
    if (entryValue.kind === "block") {
      const resolved = blockToConstructorSegment(entryValue.block, input.targetTruthMode);

      if (resolved.kind === "metadata_note") {
        metadataNotes.push(resolved.note);
      } else {
        timeline.push(resolved.segment);
      }

      continue;
    }

    timeline.push(repeatGroupToConstructorEntry(entryValue.group, input.targetTruthMode));
  }

  return {
    version: MANUAL_WORKOUT_CONSTRUCTOR_CONTRACT_VERSION,
    templateKey: input.template.templateKey,
    workoutDate: input.parsedInput.workoutDate,
    title: input.parsedInput.title?.trim() || input.template.defaultTitle,
    workoutType: input.template.workoutType,
    timeline,
    metadataNotes,
  };
}

type ConstructorBlockResult =
  | {
      kind: "segment";
      segment: ManualWorkoutConstructorSegment;
    }
  | {
      kind: "metadata_note";
      note: ManualWorkoutConstructorMetadataNote;
    };

function blockToConstructorSegment(
  block: ManualWorkoutBlockInput,
  targetTruthMode: ManualWorkoutTargetTruthMode,
): ConstructorBlockResult {
  if (isManualWorkoutNoteOnlyBlock(block.blockKey)) {
    return {
      kind: "metadata_note",
      note: {
        label: block.label ?? defaultLabelForBlock(block.blockKey),
        text: block.noteText?.trim() ?? "",
      },
    };
  }

  return {
    kind: "segment",
    segment: {
      kind: "segment",
      role: roleForBlock(block.blockKey),
      label: block.label ?? defaultLabelForBlock(block.blockKey),
      structure: structureForBlock(block),
      target: targetForBlock(block, targetTruthMode),
      guidance: block.noteText?.trim() ?? null,
    },
  };
}

function repeatGroupToConstructorEntry(
  group: Extract<ManualWorkoutConstructorEntryInput, { kind: "repeat_group" }>["group"],
  targetTruthMode: ManualWorkoutTargetTruthMode,
): ManualWorkoutConstructorRepeatGroup {
  const children = [blockToConstructorSegment(group.workBlock, targetTruthMode)]
    .concat(
      group.recoveryBlock ? [blockToConstructorSegment(group.recoveryBlock, "structure_only")] : [],
    )
    .flatMap((resolved) => (resolved.kind === "segment" ? [resolved.segment] : []));

  return {
    kind: "repeat",
    label: defaultRepeatLabel(group.repeatCount, children),
    repeatCount: group.repeatCount,
    children,
  };
}

function roleForBlock(
  blockKey: ManualWorkoutBlockInput["blockKey"],
): ManualWorkoutConstructorSegmentRole {
  switch (blockKey) {
    case "warmup_block":
      return "warm_up";
    case "cooldown_block":
      return "cooldown";
    case "interval_recovery_block":
    case "rest_walk_jog_recovery_block":
      return "recover";
    case "long_run_finish_block":
      return "finish";
    case "easy_run_block":
    case "steady_run_block":
    case "long_run_body_block":
      return "run";
    case "progression_block":
    case "tempo_block":
    case "threshold_block":
    case "interval_work_block":
    case "hill_work_block":
    case "downhill_control_block":
    case "strides_block":
    default:
      return "work";
  }
}

function structureForBlock(
  block: ManualWorkoutBlockInput,
): ManualWorkoutConstructorSegmentStructure {
  if (block.durationSeconds && block.distanceMeters) {
    return {
      kind: "duration_and_distance",
      seconds: block.durationSeconds,
      meters: block.distanceMeters,
    };
  }

  if (block.distanceMeters) {
    return {
      kind: "distance",
      meters: block.distanceMeters,
    };
  }

  return {
    kind: "duration",
    seconds: block.durationSeconds ?? 0,
  };
}

function targetForBlock(
  block: ManualWorkoutBlockInput,
  targetTruthMode: ManualWorkoutTargetTruthMode,
): ManualWorkoutConstructorSegmentTarget {
  const resolved = resolveManualWorkoutTargetInput(block, targetTruthMode);

  if (!resolved.ok || resolved.target.kind === "none") {
    return { kind: "none" };
  }

  if (resolved.target.kind === "pace") {
    return {
      kind: "pace",
      source: resolved.target.source,
      ...(resolved.target.label ? { label: resolved.target.label } : {}),
      ...(resolved.target.pace ? { pace: resolved.target.pace } : {}),
      ...(resolved.target.paceSecondsPerKm
        ? { paceSecondsPerKm: resolved.target.paceSecondsPerKm }
        : {}),
      ...(resolved.target.paceMinPerKmRange
        ? { paceMinPerKmRange: resolved.target.paceMinPerKmRange }
        : {}),
      ...(resolved.target.paceRangeSecondsPerKm
        ? { paceRangeSecondsPerKm: resolved.target.paceRangeSecondsPerKm }
        : {}),
      ...(resolved.target.sourceNote ? { sourceNote: resolved.target.sourceNote } : {}),
    };
  }

  if (resolved.target.kind === "heart_rate") {
    return {
      kind: "heart_rate",
      source: resolved.target.source,
      ...(resolved.target.label ? { label: resolved.target.label } : {}),
      ...(resolved.target.hrBpmCap ? { hrBpmCap: resolved.target.hrBpmCap } : {}),
      ...(resolved.target.hrBpmRange ? { hrBpmRange: resolved.target.hrBpmRange } : {}),
      ...(resolved.target.hrBpmRangeValues
        ? { hrBpmRangeValues: resolved.target.hrBpmRangeValues }
        : {}),
      ...(resolved.target.sourceNote ? { sourceNote: resolved.target.sourceNote } : {}),
    };
  }

  return {
    kind: "effort_rpe",
    source: resolved.target.source,
    ...((resolved.target.label ?? resolved.target.intensity)
      ? { label: resolved.target.label ?? resolved.target.intensity }
      : {}),
    ...(resolved.target.cue ? { cue: resolved.target.cue } : {}),
    ...(resolved.target.rpe !== undefined ? { rpe: resolved.target.rpe } : {}),
    ...(resolved.target.sourceNote ? { sourceNote: resolved.target.sourceNote } : {}),
  };
}

function defaultLabelForBlock(blockKey: ManualWorkoutBlockInput["blockKey"]) {
  switch (blockKey) {
    case "warmup_block":
      return "Warm-up";
    case "cooldown_block":
      return "Cooldown";
    case "interval_recovery_block":
    case "rest_walk_jog_recovery_block":
      return "Recover";
    case "long_run_finish_block":
      return "Finish";
    case "easy_run_block":
    case "steady_run_block":
    case "long_run_body_block":
      return "Run";
    case "drills_mobility_note_block":
      return "Drills note";
    case "coach_cue_note_block":
      return "Coach cue";
    default:
      return "Work";
  }
}

function defaultRepeatLabel(repeatCount: number, children: ManualWorkoutConstructorSegment[]) {
  const childSummary = children
    .map((child) => `${defaultRoleLabel(child.role)} ${formatStructure(child.structure)}`.trim())
    .join(" + ");

  return childSummary ? `${repeatCount}x [${childSummary}]` : `${repeatCount}x repeat`;
}

function defaultRoleLabel(role: ManualWorkoutConstructorSegmentRole) {
  switch (role) {
    case "warm_up":
      return "Warm-up";
    case "run":
      return "Run";
    case "work":
      return "Work";
    case "recover":
      return "Recover";
    case "finish":
      return "Finish";
    case "cooldown":
      return "Cooldown";
    default:
      return role;
  }
}

function formatStructure(structure: ManualWorkoutConstructorSegmentStructure) {
  if (structure.kind === "distance") {
    return `${structure.meters}m`;
  }

  if (structure.kind === "duration_and_distance") {
    return `${formatSeconds(structure.seconds)} / ${structure.meters}m`;
  }

  return formatSeconds(structure.seconds);
}

function formatSeconds(seconds: number) {
  if (seconds <= 0) {
    return "";
  }

  if (seconds % 60 === 0) {
    return `${seconds / 60} min`;
  }

  return `${seconds} sec`;
}
