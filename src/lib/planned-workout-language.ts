import {
  resolveCanonicalWorkoutModel,
  type CalendarIconKey,
  type CanonicalMetricMode,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
  type LegacyWorkoutType,
  type WorkoutSegmentLike,
} from "@/lib/rich-workout-model";
import { reduceRepeatChildrenToChildFirst } from "@/lib/planned-workout-block-contract";

export const RUNNER_FACING_WORKOUT_TYPE_VALUES = [
  "rest",
  "recovery",
  "easy",
  "steady",
  "long_run",
  "progression",
  "tempo",
  "intervals",
  "hills",
  "run_walk",
] as const;

export type RunnerFacingWorkoutType = (typeof RUNNER_FACING_WORKOUT_TYPE_VALUES)[number];

export const RUNNER_FACING_WORKOUT_TYPE_LABELS: Record<RunnerFacingWorkoutType, string> = {
  rest: "Rest",
  recovery: "Recovery",
  easy: "Easy",
  steady: "Steady",
  long_run: "Long Run",
  progression: "Progression",
  tempo: "Tempo",
  intervals: "Intervals",
  hills: "Hills",
  run_walk: "Run/Walk",
};

export const RUNNER_FACING_BLOCK_TYPE_VALUES = [
  "warm_up",
  "run",
  "walk",
  "work",
  "recover",
  "finish",
  "cooldown",
  "repeat_set",
] as const;

export type RunnerFacingBlockType = (typeof RUNNER_FACING_BLOCK_TYPE_VALUES)[number];

export const RUNNER_FACING_BLOCK_TYPE_LABELS: Record<RunnerFacingBlockType, string> = {
  warm_up: "Warm-up",
  run: "Run",
  walk: "Walk",
  work: "Work",
  recover: "Recover",
  finish: "Finish",
  cooldown: "Cooldown",
  repeat_set: "Repeat set",
};

export interface PlannedWorkoutLanguageBlock {
  type: RunnerFacingBlockType;
  label: string;
  sequence: number;
  sourceSegmentType: string | null;
  sourceLabel: string | null;
  repeatCount: number | null;
  children: PlannedWorkoutLanguageBlock[];
}

export interface PlannedWorkoutLanguageReadModel {
  runnerFacingWorkoutType: RunnerFacingWorkoutType;
  runnerFacingWorkoutTypeLabel: string;
  runnerFacingBlocks: PlannedWorkoutLanguageBlock[];
  canonical: {
    workoutFamily: CanonicalWorkoutFamily;
    workoutIdentity: CanonicalWorkoutIdentity;
    calendarIconKey: CalendarIconKey;
  };
  metricTruth: {
    guidance: CanonicalMetricMode["guidance"];
    executableMode: CanonicalMetricMode["executableMode"];
    paceTargetsAllowed: boolean;
    hrTargetsAllowed: boolean;
    hrTargetSource: CanonicalMetricMode["hrTargetSource"];
    reason: string;
  };
  provenance: {
    sourceKind: string | null;
    sourceWorkoutType: string | null;
  };
}

export interface PlannedWorkoutLanguageInput {
  workoutType: LegacyWorkoutType;
  sourceWorkoutType?: string | null;
  sourceKind?: string | null;
  workoutFamily?: string | null;
  workoutIdentity?: string | null;
  calendarIconKey?: string | null;
  metricMode?: unknown;
  title?: string | null;
  steps?: WorkoutSegmentLike[] | null;
}

export function buildPlannedWorkoutLanguage(
  input: PlannedWorkoutLanguageInput,
): PlannedWorkoutLanguageReadModel {
  const canonical = resolveCanonicalWorkoutModel({
    workoutType: input.workoutType,
    sourceWorkoutType: input.sourceWorkoutType,
    workoutFamily: input.workoutFamily,
    workoutIdentity: input.workoutIdentity,
    calendarIconKey: input.calendarIconKey,
    metricMode: input.metricMode,
    title: input.title,
    steps: input.steps,
  });
  const steps = input.steps ?? [];
  const runnerFacingWorkoutType = resolveRunnerFacingWorkoutType({
    sourceWorkoutType: input.sourceWorkoutType,
    title: input.title,
    steps,
    workoutFamily: canonical.workoutFamily,
    workoutIdentity: canonical.workoutIdentity,
  });

  return {
    runnerFacingWorkoutType,
    runnerFacingWorkoutTypeLabel: RUNNER_FACING_WORKOUT_TYPE_LABELS[runnerFacingWorkoutType],
    runnerFacingBlocks: steps.map((step, index) =>
      buildBlockLanguage(step, index, { runWalk: runnerFacingWorkoutType === "run_walk" }),
    ),
    canonical: {
      workoutFamily: canonical.workoutFamily,
      workoutIdentity: canonical.workoutIdentity,
      calendarIconKey: canonical.calendarIconKey,
    },
    metricTruth: {
      guidance: canonical.metricMode.guidance,
      executableMode: canonical.metricMode.executableMode,
      paceTargetsAllowed: canonical.metricMode.paceTargetsAllowed,
      hrTargetsAllowed: canonical.metricMode.hrTargetsAllowed,
      hrTargetSource: canonical.metricMode.hrTargetSource,
      reason: canonical.metricMode.reason,
    },
    provenance: {
      sourceKind: normalizeOptionalString(input.sourceKind),
      sourceWorkoutType: normalizeOptionalString(input.sourceWorkoutType),
    },
  };
}

function resolveRunnerFacingWorkoutType({
  sourceWorkoutType,
  title,
  steps,
  workoutFamily,
  workoutIdentity,
}: {
  sourceWorkoutType?: string | null;
  title?: string | null;
  steps: WorkoutSegmentLike[];
  workoutFamily: CanonicalWorkoutFamily;
  workoutIdentity: CanonicalWorkoutIdentity;
}): RunnerFacingWorkoutType {
  if (isRunWalkWorkout(sourceWorkoutType, title, steps, workoutIdentity)) {
    return "run_walk";
  }

  switch (workoutIdentity) {
    case "rest_and_recovery":
      return "rest";
    case "recovery_jog":
      return "recovery";
    case "easy_aerobic_run":
    case "cutback_aerobic_run":
    case "easy_run_with_strides":
      return "easy";
    case "steady_aerobic_run":
    case "marathon_steady_specificity":
      return "steady";
    case "long_aerobic_run":
    case "long_run_with_steady_finish":
    case "base_endpoint_marker":
    case "cutback_long_run":
    case "taper_long_run":
    case "tenk_completion_or_checkpoint":
    case "selected_distance_completion_or_checkpoint":
    case "hike_run_endurance":
    case "mountain_long_run_time_on_feet":
    case "ultra_time_on_feet_durability":
      return "long_run";
    case "progression_run":
      return "progression";
    case "controlled_tempo_session":
    case "half_marathon_threshold_durability":
    case "half_readiness_marker":
      return "tempo";
    case "distance_intervals":
    case "time_intervals":
    case "5k_sharpening_repeats":
    case "10k_rhythm_intervals":
    case "quality_session":
      return "intervals";
    case "uphill_repeats":
    case "rolling_hills_session":
    case "technical_trail_easy":
    case "controlled_downhill_durability":
    case "climbing_steady_run":
      return "hills";
    case "race_pace_session":
    case "taper_tuneup_run":
      return hasRepeatSet(steps) ? "intervals" : "tempo";
    default:
      return resolveRunnerFacingWorkoutTypeFromFamily(workoutFamily);
  }
}

function resolveRunnerFacingWorkoutTypeFromFamily(
  workoutFamily: CanonicalWorkoutFamily,
): RunnerFacingWorkoutType {
  switch (workoutFamily) {
    case "rest":
      return "rest";
    case "recovery":
      return "recovery";
    case "easy":
      return "easy";
    case "steady":
      return "steady";
    case "long":
    case "race":
      return "long_run";
    case "progression":
      return "progression";
    case "tempo":
      return "tempo";
    case "intervals":
      return "intervals";
    case "hills":
    case "trail":
      return "hills";
    default:
      return "easy";
  }
}

function buildBlockLanguage(
  segment: WorkoutSegmentLike,
  index: number,
  context: { runWalk: boolean },
): PlannedWorkoutLanguageBlock {
  const type = resolveBlockType(segment, context);
  const children = type === "repeat_set" ? buildRepeatChildren(segment, context) : [];

  return {
    type,
    label: RUNNER_FACING_BLOCK_TYPE_LABELS[type],
    sequence: readNumber((segment as { sequence?: unknown }).sequence) ?? index + 1,
    sourceSegmentType: normalizeToken(segment.segment_type ?? segment.type),
    sourceLabel: normalizeOptionalString(segment.label),
    repeatCount: readRepeatCount(segment),
    children,
  };
}

function buildRepeatChildren(
  segment: WorkoutSegmentLike,
  context: { runWalk: boolean },
): PlannedWorkoutLanguageBlock[] {
  const directChildren = Array.isArray((segment as { children?: unknown }).children)
    ? ((segment as { children?: WorkoutSegmentLike[] }).children ?? []).map((child, index) =>
        buildRepeatChildBlock(child, index, context),
      )
    : [];

  if (directChildren.length > 0) {
    return directChildren;
  }

  const prescription = recordValue(segment.prescription);
  if (normalizeToken(prescription?.mode) !== "repeats") {
    return [];
  }

  const reducedChildren = reduceRepeatChildrenToChildFirst({
    children: arrayValue(prescription?.children),
  });

  return reducedChildren.children.map((child, index) =>
    buildRepeatChildBlock(repeatPrescriptionChildSegment(child, index), index, context),
  );
}

function buildRepeatChildBlock(
  segment: WorkoutSegmentLike,
  index: number,
  context: { runWalk: boolean },
  role?: "work" | "recovery",
): PlannedWorkoutLanguageBlock {
  const type =
    role === "recovery"
      ? "recover"
      : role === "work" && context.runWalk
        ? "run"
        : resolveNonRepeatBlockType(segment);

  return {
    type,
    label: RUNNER_FACING_BLOCK_TYPE_LABELS[type],
    sequence: index + 1,
    sourceSegmentType: normalizeToken(segment.segment_type ?? segment.type),
    sourceLabel: normalizeOptionalString(segment.label),
    repeatCount: null,
    children: [],
  };
}

function resolveBlockType(
  segment: WorkoutSegmentLike,
  context: { runWalk: boolean },
): RunnerFacingBlockType {
  if (isRepeatSet(segment)) {
    return "repeat_set";
  }

  if (context.runWalk && /(?:^|_)easy_run(?:_|$)|\brun\b/.test(blockSemanticText(segment))) {
    return "run";
  }

  return resolveNonRepeatBlockType(segment);
}

function resolveNonRepeatBlockType(segment: WorkoutSegmentLike): RunnerFacingBlockType {
  const semanticText = blockSemanticText(segment);

  if (
    /(?:^|_)(warmup|warm_up|prep|preparation|activation|drills?)(?:_|$)|\bwarm[-\s]?up\b/.test(
      semanticText,
    )
  ) {
    return "warm_up";
  }

  if (/(?:^|_)(cooldown|cool_down)(?:_|$)|\bcool[-\s]?down\b/.test(semanticText)) {
    return "cooldown";
  }

  if (/(?:^|_)(walk|walking)(?:_|$)|\bwalk\b/.test(semanticText)) {
    return "walk";
  }

  if (
    /(?:^|_)(recover|recovery|walk|jog_recovery|rest_walk_jog_recovery)(?:_|$)/.test(semanticText)
  ) {
    return "recover";
  }

  if (/(?:^|_)(finish|closing|checkpoint|steady_finish)(?:_|$)|\bfinish\b/.test(semanticText)) {
    return "finish";
  }

  if (/(?:^|_)(tempo|threshold|interval|hill|work|stride|progression)(?:_|$)/.test(semanticText)) {
    return "work";
  }

  return "run";
}

function isRunWalkWorkout(
  sourceWorkoutType: string | null | undefined,
  title: string | null | undefined,
  steps: WorkoutSegmentLike[],
  workoutIdentity: CanonicalWorkoutIdentity,
) {
  const sourceType = normalizeToken(sourceWorkoutType);
  if (sourceType === "run_walk_adaptation" || sourceType === "run_walk") {
    return true;
  }

  if (workoutIdentity !== "recovery_jog") {
    return false;
  }

  const semanticText = normalizeToken(
    [title, ...flattenSegments(steps).map(segmentText)].join(" "),
  );

  return Boolean(
    hasRepeatSet(steps) &&
    semanticText &&
    /\brun\b/.test(semanticText) &&
    /\bwalk\b/.test(semanticText) &&
    !/\b(hill|tempo|threshold|interval)\b/.test(semanticText),
  );
}

function hasRepeatSet(steps: WorkoutSegmentLike[]) {
  return steps.some(isRepeatSet);
}

function isRepeatSet(segment: WorkoutSegmentLike) {
  return (
    readPrescriptionMode(segment) === "repeats" ||
    Boolean(readRepeatCount(segment)) ||
    /(?:^|_)(repeat|repeats|repeat_set|interval_group)(?:_|$)/.test(blockSemanticText(segment))
  );
}

function readRepeatCount(segment: WorkoutSegmentLike): number | null {
  return (
    readNumber(segment.repeat_count) ??
    readNumber((segment as { repeats?: unknown }).repeats) ??
    readNumber(recordValue(segment.prescription)?.repeat_count)
  );
}

function readPrescriptionMode(segment: WorkoutSegmentLike) {
  return normalizeToken(recordValue(segment.prescription)?.mode);
}

function blockSemanticText(segment: WorkoutSegmentLike) {
  return normalizeToken(segmentText(segment)) ?? "";
}

function segmentText(segment: WorkoutSegmentLike) {
  return [
    segment.segment_type,
    segment.type,
    segment.label,
    recordValue(segment.prescription)?.mode,
  ]
    .filter((part): part is string => typeof part === "string")
    .join(" ");
}

function flattenSegments(segments: WorkoutSegmentLike[]): WorkoutSegmentLike[] {
  return segments.flatMap((segment) => [segment]);
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function arrayValue(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function repeatPrescriptionChildSegment(child: unknown, index: number): WorkoutSegmentLike {
  const record = recordValue(child) ?? {};
  const role = normalizeToken(record.role) ?? "run";
  const prescription = recordValue(record.prescription) ?? { mode: "none" };
  const label =
    typeof record.label === "string" && record.label.trim()
      ? record.label.trim()
      : RUNNER_FACING_BLOCK_TYPE_LABELS[repeatChildRoleToBlockType(role)];

  return {
    type: role,
    segment_type: role,
    label,
    sequence: readNumber(record.sequence) ?? index + 1,
    guidance: typeof record.guidance === "string" ? record.guidance : null,
    prescription,
    target: recordValue(record.target),
    ...(typeof prescription.duration_min === "number"
      ? { duration_min: prescription.duration_min }
      : {}),
    ...(typeof prescription.distance_km === "number"
      ? { distance_km: prescription.distance_km }
      : {}),
  };
}

function repeatChildRoleToBlockType(role: string): RunnerFacingBlockType {
  switch (role) {
    case "warm_up":
    case "warmup":
      return "warm_up";
    case "walk":
      return "walk";
    case "work":
      return "work";
    case "recover":
    case "recovery":
      return "recover";
    case "finish":
      return "finish";
    case "cooldown":
    case "cool_down":
      return "cooldown";
    default:
      return "run";
  }
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function normalizeOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeToken(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
  return normalized || null;
}
