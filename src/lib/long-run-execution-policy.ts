import type { CanonicalWorkoutIdentity } from "@/lib/rich-workout-model";

export const LONG_RUN_ANATOMY_IDENTITY_VALUES = [
  "long_aerobic_run",
  "cutback_long_run",
  "taper_long_run",
  "long_run_with_steady_finish",
  "marathon_steady_specificity",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
  "ultra_time_on_feet_durability",
] as const satisfies readonly CanonicalWorkoutIdentity[];

export type LongRunExecutionStageRole =
  | "entry"
  | "body"
  | "finish"
  | "settle"
  | "support"
  | "event";

export interface LongRunExecutionStage {
  role: LongRunExecutionStageRole;
  runnable: boolean;
  durationSeconds?: number;
  distanceMeters?: number;
  target?: {
    mode: "pace" | "heart_rate";
    command: string;
  };
  path?: string;
}

export type LongRunExecutionPolicyIssueCode =
  | "long_run_body_missing"
  | "long_run_anatomy_missing"
  | "long_run_decorative_split"
  | "long_run_target_mode_mixed"
  | "long_run_target_change_not_allowed"
  | "long_run_finish_role_missing"
  | "long_run_target_stage_too_short"
  | "progression_stage_count_invalid"
  | "progression_target_sequence_incomplete";

export interface LongRunExecutionPolicyIssue {
  code: LongRunExecutionPolicyIssueCode;
  message: string;
  path?: string;
}

const LONG_RUN_IDENTITY_SET = new Set<CanonicalWorkoutIdentity>(LONG_RUN_ANATOMY_IDENTITY_VALUES);
const SINGLE_COMMAND_LONG_RUN_IDENTITIES = new Set<CanonicalWorkoutIdentity>([
  "long_aerobic_run",
  "cutback_long_run",
  "taper_long_run",
]);
const CONTROLLED_CHANGE_LONG_RUN_IDENTITIES = new Set<CanonicalWorkoutIdentity>([
  "long_run_with_steady_finish",
  "marathon_steady_specificity",
]);
const EXTENDED_TIME_ON_FEET_IDENTITIES = new Set<CanonicalWorkoutIdentity>([
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
  "ultra_time_on_feet_durability",
]);

const ONE_HOUR_SECONDS = 60 * 60;
const NINETY_MINUTES_SECONDS = 90 * 60;
const TWO_HOURS_SECONDS = 120 * 60;
const MINIMUM_ENTRY_OR_SETTLE_SECONDS = 5 * 60;
const MINIMUM_CHANGED_LONG_RUN_STAGE_SECONDS = 15 * 60;

export function validateLongRunExecutionPolicy({
  workoutIdentity,
  stages,
}: {
  workoutIdentity: CanonicalWorkoutIdentity;
  stages: LongRunExecutionStage[];
}): LongRunExecutionPolicyIssue[] {
  if (workoutIdentity === "progression_run") {
    return validateProgressionStrategy(stages);
  }

  if (!LONG_RUN_IDENTITY_SET.has(workoutIdentity)) {
    return [];
  }

  return [
    ...validateLongRunAnatomy(workoutIdentity, stages),
    ...validateLongRunTargets(workoutIdentity, stages),
  ];
}

function validateLongRunAnatomy(
  workoutIdentity: CanonicalWorkoutIdentity,
  stages: LongRunExecutionStage[],
): LongRunExecutionPolicyIssue[] {
  const issues: LongRunExecutionPolicyIssue[] = [];
  const runnable = runnableStages(stages);
  const bodyStages = runnable.filter((stage) => stage.role === "body");
  const durationSummary = summarizeParticipantExecutedRunnableDuration(runnable);
  const totalDurationSeconds =
    durationSummary.allStagesTimed ||
    durationSummary.knownTimedDurationSeconds > NINETY_MINUTES_SECONDS
      ? durationSummary.knownTimedDurationSeconds
      : null;

  if (bodyStages.length === 0) {
    issues.push({
      code: "long_run_body_missing",
      message: `${workoutIdentity} requires an explicit long-run body stage.`,
    });
    return issues;
  }

  if (hasDecorativeAdjacentBodySplit(stages)) {
    issues.push({
      code: "long_run_decorative_split",
      message:
        "Adjacent same-command body stages need a represented checkpoint or Hydration event; decorative splitting is not executable anatomy.",
    });
  }

  if (
    EXTENDED_TIME_ON_FEET_IDENTITIES.has(workoutIdentity) &&
    !hasRunnableStagesSeparatedByEvent(stages)
  ) {
    issues.push({
      code: "long_run_anatomy_missing",
      message: `${workoutIdentity} requires at least two meaningful time-on-feet stages separated by a checkpoint or Hydration event.`,
    });
    return issues;
  }

  if (
    totalDurationSeconds != null &&
    totalDurationSeconds <= ONE_HOUR_SECONDS &&
    !EXTENDED_TIME_ON_FEET_IDENTITIES.has(workoutIdentity)
  ) {
    return issues;
  }

  const hasMeaningfulEntryOrSettle = runnable.some(
    (stage) =>
      (stage.role === "entry" || stage.role === "settle") &&
      isMeaningfulTimedStage(stage, MINIMUM_ENTRY_OR_SETTLE_SECONDS),
  );
  const hasMeaningfulFinish = runnable.some(
    (stage) =>
      stage.role === "finish" &&
      isMeaningfulTimedStage(stage, MINIMUM_CHANGED_LONG_RUN_STAGE_SECONDS),
  );
  const hasMeaningfulChangedFinish = hasControlledChangedFinish(runnable);
  const hasSeparatedRunnableStages = hasRunnableStagesSeparatedByEvent(stages);

  if (totalDurationSeconds == null) {
    if (
      !hasMeaningfulEntryOrSettle &&
      !hasMeaningfulFinish &&
      !hasMeaningfulChangedFinish &&
      !hasSeparatedRunnableStages
    ) {
      issues.push({
        code: "long_run_anatomy_missing",
        message:
          "A distance-only or mixed-prescription long run must carry explicit entry, settle, finish, or checkpoint-separated anatomy; Backend will not invent elapsed time.",
      });
    }
    return issues;
  }

  if (totalDurationSeconds <= NINETY_MINUTES_SECONDS) {
    if (
      !hasMeaningfulEntryOrSettle &&
      !hasMeaningfulFinish &&
      !hasMeaningfulChangedFinish &&
      !hasSeparatedRunnableStages
    ) {
      issues.push({
        code: "long_run_anatomy_missing",
        message:
          "Long runs over 60 minutes require a meaningful entry, settle, deliberate finish, or checkpoint-separated runnable stage.",
      });
    }
    return issues;
  }

  if (totalDurationSeconds <= TWO_HOURS_SECONDS) {
    const hasEventWithClosingStage =
      hasEventBetweenBodyAndClosingStage(stages) || hasSeparatedRunnableStages;
    if (!hasEventWithClosingStage) {
      issues.push({
        code: "long_run_anatomy_missing",
        message:
          "Long runs over 90 minutes require a checkpoint or Hydration event between the long body and a meaningful runnable continuation or closing stage.",
      });
    }
    return issues;
  }

  if (!hasSeparatedRunnableStages) {
    issues.push({
      code: "long_run_anatomy_missing",
      message:
        "Long runs over 120 minutes require at least two meaningful runnable time-on-feet stages separated by a checkpoint or Hydration event.",
    });
  }

  return issues;
}

function validateLongRunTargets(
  workoutIdentity: CanonicalWorkoutIdentity,
  stages: LongRunExecutionStage[],
): LongRunExecutionPolicyIssue[] {
  const substantive = substantiveStages(stages).filter((stage) => stage.target);
  if (substantive.length === 0) {
    return [];
  }

  const issues: LongRunExecutionPolicyIssue[] = [];
  const modes = new Set(substantive.map((stage) => stage.target?.mode));
  if (modes.size > 1) {
    issues.push({
      code: "long_run_target_mode_mixed",
      message:
        "Current long-run strategies must use one substantive execution mode; pace-led and BPM-led stages cannot be mixed.",
    });
    return issues;
  }

  const commandStages = compressCommandStages(substantive);
  if (SINGLE_COMMAND_LONG_RUN_IDENTITIES.has(workoutIdentity) && commandStages.length > 1) {
    issues.push({
      code: "long_run_target_change_not_allowed",
      message: `${workoutIdentity} is a one-command strategy; meaningful anatomy may repeat but cannot change the substantive target.`,
      path: commandStages[1]?.path,
    });
    return issues;
  }

  if (CONTROLLED_CHANGE_LONG_RUN_IDENTITIES.has(workoutIdentity) && commandStages.length > 2) {
    issues.push({
      code: "long_run_target_change_not_allowed",
      message: `${workoutIdentity} permits at most one controlled same-mode target change.`,
      path: commandStages[2]?.path,
    });
    return issues;
  }

  if (CONTROLLED_CHANGE_LONG_RUN_IDENTITIES.has(workoutIdentity) && commandStages.length === 2) {
    const changedStage = commandStages[1]!;
    if (changedStage.role !== "finish") {
      issues.push({
        code: "long_run_finish_role_missing",
        message:
          "A controlled long-run target change must be authored as the explicit finish stage.",
        path: changedStage.path,
      });
    }
    if (
      changedStage.durationSeconds != null &&
      changedStage.durationSeconds < MINIMUM_CHANGED_LONG_RUN_STAGE_SECONDS
    ) {
      issues.push({
        code: "long_run_target_stage_too_short",
        message:
          "A changed long-run target needs a meaningful stage of at least 15 minutes; short target changes belong to interval or stride identities.",
        path: changedStage.path,
      });
    }
    if (changedStage.distanceMeters != null && changedStage.target?.mode !== "pace") {
      issues.push({
        code: "long_run_target_stage_too_short",
        message:
          "A distance-based changed long-run stage requires an authored pace command; Backend will not derive elapsed time or pace from BPM.",
        path: changedStage.path,
      });
    }
  }

  return issues;
}

function validateProgressionStrategy(
  stages: LongRunExecutionStage[],
): LongRunExecutionPolicyIssue[] {
  const substantive = substantiveStages(stages);
  const issues: LongRunExecutionPolicyIssue[] = [];

  if (substantive.length < 2 || substantive.length > 3) {
    issues.push({
      code: "progression_stage_count_invalid",
      message:
        "progression_run requires exactly two or three meaningful ordered progression stages.",
    });
    return issues;
  }

  const targeted = substantive.filter((stage) => stage.target);
  if (targeted.length === 0) {
    return issues;
  }

  if (targeted.length !== substantive.length) {
    issues.push({
      code: "progression_target_sequence_incomplete",
      message:
        "A targeted progression_run must author one numeric target for every substantive progression stage.",
    });
    return issues;
  }

  const commandStages = compressCommandStages(targeted);
  if (commandStages.length !== substantive.length) {
    issues.push({
      code: "progression_target_sequence_incomplete",
      message:
        "Each authored progression stage must advance to its own ordered command; repeated decorative command stages are not a progression.",
    });
  }

  for (const stage of substantive) {
    if (stage.durationSeconds != null && stage.durationSeconds < MINIMUM_ENTRY_OR_SETTLE_SECONDS) {
      issues.push({
        code: "progression_stage_count_invalid",
        message:
          "Progression stages must be meaningful runnable stages, not interval-sized micro-steps.",
        path: stage.path,
      });
    }
  }

  return issues;
}

function runnableStages(stages: LongRunExecutionStage[]) {
  return stages.filter((stage) => stage.runnable);
}

function substantiveStages(stages: LongRunExecutionStage[]) {
  return stages.filter((stage) => stage.role === "body" || stage.role === "finish");
}

function summarizeParticipantExecutedRunnableDuration(stages: LongRunExecutionStage[]) {
  return {
    knownTimedDurationSeconds: stages.reduce(
      (total, stage) => total + (stage.durationSeconds ?? 0),
      0,
    ),
    allStagesTimed: stages.every((stage) => stage.durationSeconds != null),
  };
}

function isMeaningfulTimedStage(stage: LongRunExecutionStage, minimumSeconds: number) {
  return stage.durationSeconds == null || stage.durationSeconds >= minimumSeconds;
}

function hasDecorativeAdjacentBodySplit(stages: LongRunExecutionStage[]) {
  for (let index = 0; index < stages.length - 1; index += 1) {
    const current = stages[index];
    const next = stages[index + 1];
    if (current?.role !== "body" || next?.role !== "body") continue;
    if (targetSignature(current) !== targetSignature(next)) continue;
    return true;
  }
  return false;
}

function hasControlledChangedFinish(stages: LongRunExecutionStage[]) {
  const commanded = substantiveStages(stages).filter((stage) => stage.target);
  const commandStages = compressCommandStages(commanded);
  const changedStage = commandStages.length === 2 ? commandStages[1] : null;
  return Boolean(
    changedStage && isMeaningfulTimedStage(changedStage, MINIMUM_CHANGED_LONG_RUN_STAGE_SECONDS),
  );
}

function hasRunnableStagesSeparatedByEvent(stages: LongRunExecutionStage[]) {
  for (const [index, stage] of stages.entries()) {
    if (stage.role !== "event") continue;
    const before = stages.slice(0, index).some(isMeaningfulSubstantiveStage);
    const after = stages.slice(index + 1).some(isMeaningfulSubstantiveStage);
    if (before && after) return true;
  }
  return false;
}

function hasEventBetweenBodyAndClosingStage(stages: LongRunExecutionStage[]) {
  for (const [index, stage] of stages.entries()) {
    if (stage.role !== "event") continue;
    const before = stages
      .slice(0, index)
      .some((candidate) => candidate.role === "body" && isMeaningfulSubstantiveStage(candidate));
    const after = stages
      .slice(index + 1)
      .some(
        (candidate) =>
          candidate.runnable &&
          candidate.role !== "entry" &&
          candidate.role !== "event" &&
          isMeaningfulRunnableStage(candidate),
      );
    if (before && after) return true;
  }
  return false;
}

function isMeaningfulSubstantiveStage(stage: LongRunExecutionStage) {
  return (stage.role === "body" || stage.role === "finish") && isMeaningfulRunnableStage(stage);
}

function isMeaningfulRunnableStage(stage: LongRunExecutionStage) {
  if (!stage.runnable) return false;
  if (stage.durationSeconds != null) {
    return stage.durationSeconds >= MINIMUM_ENTRY_OR_SETTLE_SECONDS;
  }
  return Boolean(stage.distanceMeters && stage.distanceMeters > 0);
}

function compressCommandStages(stages: LongRunExecutionStage[]) {
  const compressed: LongRunExecutionStage[] = [];
  for (const stage of stages) {
    const previous = compressed.at(-1);
    if (!previous || targetSignature(previous) !== targetSignature(stage)) {
      compressed.push(stage);
    }
  }
  return compressed;
}

function targetSignature(stage: LongRunExecutionStage) {
  return stage.target ? `${stage.target.mode}:${stage.target.command.trim()}` : "target:none";
}
