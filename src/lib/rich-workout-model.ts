export const CANONICAL_WORKOUT_FAMILY_VALUES = [
  "rest",
  "recovery",
  "easy",
  "steady",
  "long",
  "tempo",
  "intervals",
  "progression",
  "race",
  "hills",
  "trail",
] as const;

export type CanonicalWorkoutFamily = (typeof CANONICAL_WORKOUT_FAMILY_VALUES)[number];

export const CANONICAL_WORKOUT_IDENTITY_VALUES = [
  "rest_and_recovery",
  "easy_aerobic_run",
  "recovery_jog",
  "steady_aerobic_run",
  "cutback_aerobic_run",
  "easy_run_with_strides",
  "long_aerobic_run",
  "long_run_with_steady_finish",
  "base_endpoint_marker",
  "cutback_long_run",
  "taper_long_run",
  "controlled_tempo_session",
  "half_marathon_threshold_durability",
  "half_readiness_marker",
  "marathon_steady_specificity",
  "distance_intervals",
  "time_intervals",
  "5k_sharpening_repeats",
  "10k_rhythm_intervals",
  "tenk_completion_or_checkpoint",
  "selected_distance_completion_or_checkpoint",
  "progression_run",
  "race_pace_session",
  "taper_tuneup_run",
  "uphill_repeats",
  "rolling_hills_session",
  "technical_trail_easy",
  "controlled_downhill_durability",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
  "ultra_time_on_feet_durability",
  "climbing_steady_run",
  "quality_session",
] as const;

export type CanonicalWorkoutIdentity = (typeof CANONICAL_WORKOUT_IDENTITY_VALUES)[number];

export const CALENDAR_ICON_KEY_VALUES = CANONICAL_WORKOUT_FAMILY_VALUES;

export type CalendarIconKey = (typeof CALENDAR_ICON_KEY_VALUES)[number];

export const CANONICAL_METRIC_GUIDANCE_VALUES = ["effort", "pace", "heart_rate", "mixed"] as const;

export type CanonicalMetricGuidance = (typeof CANONICAL_METRIC_GUIDANCE_VALUES)[number];

export const CANONICAL_EXECUTABLE_MODE_VALUES = [
  "pace_executable",
  "hr_executable",
  "mixed_metric_executable",
  "structure_only_executable",
  "correction_required",
  "effort_only",
  "none",
  "unknown",
] as const;

export type CanonicalExecutableMode = (typeof CANONICAL_EXECUTABLE_MODE_VALUES)[number];

export const HR_TARGET_SOURCE_VALUES = [
  "personal_hr_zone",
  "default_estimated_hr",
  "effort_only",
] as const;

export type HrTargetSource = (typeof HR_TARGET_SOURCE_VALUES)[number];

export type LegacyWorkoutType =
  | "easy"
  | "steady_or_easy"
  | "rest"
  | "long_run"
  | "quality"
  | "tempo"
  | "intervals"
  | "progression"
  | "race"
  | "recovery";

export interface CanonicalGoalContext {
  goalType: string;
  goalStyle?: string | null;
  terrainFocus?: "standard" | "rolling" | "mountain" | null;
  targetDate?: string | null;
  targetTime?: string | null;
}

export interface CanonicalMetricMode {
  guidance: CanonicalMetricGuidance;
  executableMode: CanonicalExecutableMode;
  paceTargetsAllowed: boolean;
  hrTargetsAllowed: boolean;
  hrTargetSource: HrTargetSource;
  hrTargetLabel: string | null;
  hrTargetSourceNote: string | null;
  reason: string;
}

export interface CanonicalMetricModeJson {
  guidance: CanonicalMetricGuidance;
  executable_mode: CanonicalExecutableMode;
  pace_targets_allowed: boolean;
  hr_targets_allowed: boolean;
  hr_target_source: HrTargetSource;
  hr_target_label?: string | null;
  hr_target_source_note?: string | null;
  reason: string;
}

export interface CanonicalWorkoutModel {
  workoutFamily: CanonicalWorkoutFamily;
  workoutIdentity: CanonicalWorkoutIdentity;
  calendarIconKey: CalendarIconKey;
  metricMode: CanonicalMetricMode;
}

export interface CanonicalWorkoutResolutionInput {
  workoutType: LegacyWorkoutType;
  sourceWorkoutType?: string | null;
  workoutFamily?: string | null;
  workoutIdentity?: string | null;
  calendarIconKey?: string | null;
  metricMode?: CanonicalMetricMode | CanonicalMetricModeJson | null;
  title?: string | null;
  steps?: WorkoutSegmentLike[] | null;
}

export interface WorkoutSegmentLike {
  type?: string | null;
  segment_type?: string | null;
  label?: string | null;
  target?: Record<string, unknown> | null;
  recovery_target?: Record<string, unknown> | null;
  prescription?: Record<string, unknown> | null;
  duration_min?: number | null;
  distance_km?: number | null;
  repeat_count?: number | null;
  work_distance_km?: number | null;
  work_duration_min?: number | null;
  work_duration_sec?: number | null;
  recovery_distance_km?: number | null;
  recovery_duration_min?: number | null;
  recovery_duration_sec?: number | null;
  work?: WorkoutSegmentLike | null;
  recovery?: WorkoutSegmentLike | null;
}

const FAMILY_VALUES = new Set<string>(CANONICAL_WORKOUT_FAMILY_VALUES);
const IDENTITY_VALUES = new Set<string>(CANONICAL_WORKOUT_IDENTITY_VALUES);
const ICON_VALUES = new Set<string>(CALENDAR_ICON_KEY_VALUES);
const GUIDANCE_VALUES = new Set<string>(CANONICAL_METRIC_GUIDANCE_VALUES);
const EXECUTABLE_MODE_VALUE_SET = new Set<string>(CANONICAL_EXECUTABLE_MODE_VALUES);
const HR_TARGET_SOURCE_VALUE_SET = new Set<string>(HR_TARGET_SOURCE_VALUES);

const identityFamilyMap: Record<CanonicalWorkoutIdentity, CanonicalWorkoutFamily> = {
  rest_and_recovery: "rest",
  easy_aerobic_run: "easy",
  recovery_jog: "recovery",
  steady_aerobic_run: "steady",
  cutback_aerobic_run: "easy",
  easy_run_with_strides: "easy",
  long_aerobic_run: "long",
  long_run_with_steady_finish: "long",
  base_endpoint_marker: "long",
  cutback_long_run: "long",
  taper_long_run: "long",
  controlled_tempo_session: "tempo",
  half_marathon_threshold_durability: "tempo",
  half_readiness_marker: "tempo",
  marathon_steady_specificity: "steady",
  distance_intervals: "intervals",
  time_intervals: "intervals",
  "5k_sharpening_repeats": "intervals",
  "10k_rhythm_intervals": "intervals",
  tenk_completion_or_checkpoint: "race",
  selected_distance_completion_or_checkpoint: "race",
  progression_run: "progression",
  race_pace_session: "race",
  taper_tuneup_run: "race",
  uphill_repeats: "hills",
  rolling_hills_session: "hills",
  technical_trail_easy: "trail",
  controlled_downhill_durability: "hills",
  hike_run_endurance: "trail",
  mountain_long_run_time_on_feet: "trail",
  ultra_time_on_feet_durability: "long",
  climbing_steady_run: "hills",
  quality_session: "intervals",
};

const sourceIdentityAliases: Record<string, CanonicalWorkoutIdentity> = {
  rest: "rest_and_recovery",
  rest_and_recovery: "rest_and_recovery",
  recovery: "recovery_jog",
  recovery_jog: "recovery_jog",
  easy: "easy_aerobic_run",
  easy_aerobic_run: "easy_aerobic_run",
  steady: "steady_aerobic_run",
  steady_or_easy: "steady_aerobic_run",
  steady_aerobic_run: "steady_aerobic_run",
  cutback: "cutback_aerobic_run",
  cutback_aerobic_run: "cutback_aerobic_run",
  strides: "easy_run_with_strides",
  aerobic_strides: "easy_run_with_strides",
  easy_run_with_strides: "easy_run_with_strides",
  long: "long_aerobic_run",
  long_run: "long_aerobic_run",
  long_aerobic_run: "long_aerobic_run",
  long_run_with_steady_finish: "long_run_with_steady_finish",
  base_endpoint_marker: "base_endpoint_marker",
  cutback_long_run: "cutback_long_run",
  taper_long_run: "taper_long_run",
  tempo: "controlled_tempo_session",
  controlled_tempo_session: "controlled_tempo_session",
  threshold: "half_marathon_threshold_durability",
  half_marathon_threshold_durability: "half_marathon_threshold_durability",
  half_readiness_marker: "half_readiness_marker",
  marathon_steady_specificity: "marathon_steady_specificity",
  intervals: "distance_intervals",
  distance_intervals: "distance_intervals",
  time_intervals: "time_intervals",
  "5k_sharpening_repeats": "5k_sharpening_repeats",
  "10k_rhythm_intervals": "10k_rhythm_intervals",
  "10k_completion_or_checkpoint": "tenk_completion_or_checkpoint",
  tenk_completion_or_checkpoint: "tenk_completion_or_checkpoint",
  selected_distance_completion_or_checkpoint: "selected_distance_completion_or_checkpoint",
  selected_distance_endpoint: "selected_distance_completion_or_checkpoint",
  completion_or_checkpoint: "selected_distance_completion_or_checkpoint",
  progression: "progression_run",
  progression_run: "progression_run",
  race: "race_pace_session",
  race_pace: "race_pace_session",
  race_pace_session: "race_pace_session",
  tune_up: "taper_tuneup_run",
  tuneup: "taper_tuneup_run",
  race_tune_up: "taper_tuneup_run",
  taper_tuneup_run: "taper_tuneup_run",
  uphill_repeats: "uphill_repeats",
  rolling_hills_session: "rolling_hills_session",
  technical_trail_easy: "technical_trail_easy",
  controlled_downhill_durability: "controlled_downhill_durability",
  hike_run_endurance: "hike_run_endurance",
  mountain_long_run_time_on_feet: "mountain_long_run_time_on_feet",
  ultra_time_on_feet_durability: "ultra_time_on_feet_durability",
  climbing_steady_run: "climbing_steady_run",
  quality: "quality_session",
  quality_session: "quality_session",
};

export function resolveCanonicalWorkoutModel(
  input: CanonicalWorkoutResolutionInput,
): CanonicalWorkoutModel {
  const explicitIdentity = normalizeWorkoutIdentity(input.workoutIdentity);
  const sourceIdentity = normalizeWorkoutIdentity(input.sourceWorkoutType);
  const identity =
    explicitIdentity ??
    sourceIdentity ??
    inferWorkoutIdentity(input.workoutType, input.title, input.steps ?? []);
  const explicitFamily = normalizeWorkoutFamily(input.workoutFamily);
  const workoutFamily =
    explicitIdentity || sourceIdentity
      ? identityFamilyMap[identity]
      : (explicitFamily ?? identityFamilyMap[identity]);
  const calendarIconKey = normalizeCalendarIconKey(input.calendarIconKey) ?? workoutFamily;
  const metricMode =
    workoutFamily === "rest"
      ? buildRestMetricMode()
      : (normalizeCanonicalMetricMode(input.metricMode) ??
        deriveCanonicalMetricMode(input.steps ?? []));

  return {
    workoutFamily,
    workoutIdentity: identity,
    calendarIconKey,
    metricMode,
  };
}

export function normalizeWorkoutFamily(value: unknown): CanonicalWorkoutFamily | null {
  const token = normalizeToken(value);

  return token && FAMILY_VALUES.has(token) ? (token as CanonicalWorkoutFamily) : null;
}

export function normalizeWorkoutIdentity(value: unknown): CanonicalWorkoutIdentity | null {
  const token = normalizeToken(value);

  if (!token) {
    return null;
  }

  if (IDENTITY_VALUES.has(token)) {
    return token as CanonicalWorkoutIdentity;
  }

  return sourceIdentityAliases[token] ?? null;
}

export function normalizeCalendarIconKey(value: unknown): CalendarIconKey | null {
  const token = normalizeToken(value);

  return token && ICON_VALUES.has(token) ? (token as CalendarIconKey) : null;
}

export function normalizeCanonicalMetricMode(value: unknown): CanonicalMetricMode | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const guidance = normalizeMetricGuidance(record.guidance);

  if (!guidance) {
    return null;
  }

  const paceTargetsAllowed = readBoolean(record.paceTargetsAllowed, record.pace_targets_allowed);
  const rawHrTargetsAllowed = readBoolean(record.hrTargetsAllowed, record.hr_targets_allowed);
  const hrTargetSource =
    normalizeHrTargetSource(record.hrTargetSource ?? record.hr_target_source) ??
    (rawHrTargetsAllowed ? "personal_hr_zone" : "effort_only");
  const hrTargetsAllowed = rawHrTargetsAllowed && hrTargetSource === "personal_hr_zone";
  const executableMode =
    normalizeExecutableMode(record.executableMode ?? record.executable_mode) ??
    inferExecutableModeFromMetricTruth({
      paceTargetsAllowed,
      hrTargetsAllowed,
      hrTargetSource,
      guidance,
    });
  const hrTargetLabel =
    readString(record.hrTargetLabel, record.hr_target_label, record.label) ?? null;
  const hrTargetSourceNote =
    readString(record.hrTargetSourceNote, record.hr_target_source_note, record.source_note) ?? null;
  const reason = typeof record.reason === "string" ? record.reason.trim().slice(0, 200) : "";

  return {
    guidance,
    executableMode,
    paceTargetsAllowed,
    hrTargetsAllowed,
    hrTargetSource,
    hrTargetLabel,
    hrTargetSourceNote,
    reason: reason || "Metric mode was provided by backend-compatible workout truth.",
  };
}

export function toCanonicalMetricModeJson(
  metricMode: CanonicalMetricMode,
): CanonicalMetricModeJson {
  return {
    guidance: metricMode.guidance,
    executable_mode: metricMode.executableMode,
    pace_targets_allowed: metricMode.paceTargetsAllowed,
    hr_targets_allowed: metricMode.hrTargetsAllowed,
    hr_target_source: metricMode.hrTargetSource,
    ...(metricMode.hrTargetLabel ? { hr_target_label: metricMode.hrTargetLabel } : {}),
    ...(metricMode.hrTargetSourceNote
      ? { hr_target_source_note: metricMode.hrTargetSourceNote }
      : {}),
    reason: metricMode.reason,
  };
}

export function normalizeCanonicalGoalContext(value: unknown): CanonicalGoalContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const goalType = readString(record.goalType, record.goal_type);

  if (!goalType) {
    return null;
  }

  return {
    goalType,
    goalStyle: readString(record.goalStyle, record.goal_style),
    terrainFocus: normalizeTerrainFocus(record.terrainFocus ?? record.terrain_focus),
    targetDate: readString(record.targetDate, record.target_date),
    targetTime: readString(record.targetTime, record.target_time),
  };
}

export function canonicalFamilyToLegacyWorkoutType(
  family: CanonicalWorkoutFamily,
  identity?: CanonicalWorkoutIdentity | null,
): Extract<LegacyWorkoutType, "easy" | "steady_or_easy" | "rest" | "long_run" | "quality"> {
  switch (family) {
    case "rest":
      return "rest";
    case "recovery":
    case "easy":
      return "easy";
    case "steady":
      return "steady_or_easy";
    case "long":
      return "long_run";
    case "trail":
      if (identity === "technical_trail_easy") return "easy";
      if (identity === "hike_run_endurance" || identity === "mountain_long_run_time_on_feet") {
        return "long_run";
      }
      return "quality";
    case "tempo":
    case "intervals":
    case "progression":
    case "race":
    case "hills":
      return "quality";
    default:
      return "quality";
  }
}

export function deriveCanonicalMetricMode(segments: WorkoutSegmentLike[]): CanonicalMetricMode {
  const hasPace = segments.some((segment) =>
    segmentContainsTargetKeys(segment, ["pace_min_per_km_range", "pace_range_min_km", "pace"]),
  );
  const hasHr = segments.some((segment) =>
    segmentContainsTargetKeys(segment, ["hr_bpm_range", "hr_bpm"]),
  );
  const hrMetadata = hasHr ? deriveHrTargetMetadata(segments) : null;
  const hasPersonalHr = hasHr && hrMetadata?.source === "personal_hr_zone";
  const fallbackExecutableMode = deriveExecutableModeFromSegments(segments);

  if (hasPace && hasPersonalHr) {
    return {
      guidance: "mixed",
      executableMode: "mixed_metric_executable",
      paceTargetsAllowed: true,
      hrTargetsAllowed: true,
      hrTargetSource: "personal_hr_zone",
      hrTargetLabel: hrMetadata?.label ?? null,
      hrTargetSourceNote: hrMetadata?.sourceNote ?? null,
      reason: "Workout includes explicit pace targets and personal heart-rate zone targets.",
    };
  }

  if (hasPace) {
    return {
      guidance: "pace",
      executableMode: "pace_executable",
      paceTargetsAllowed: true,
      hrTargetsAllowed: false,
      hrTargetSource: hrMetadata?.source ?? "effort_only",
      hrTargetLabel: hrMetadata?.source === "default_estimated_hr" ? hrMetadata.label : null,
      hrTargetSourceNote:
        hrMetadata?.source === "default_estimated_hr" ? hrMetadata.sourceNote : null,
      reason:
        hrMetadata?.source === "default_estimated_hr"
          ? "Workout includes pace targets; age-estimated HR is advisory only, not executable HR truth."
          : "Workout includes explicit pace targets.",
    };
  }

  if (hasPersonalHr) {
    return {
      guidance: "heart_rate",
      executableMode: "hr_executable",
      paceTargetsAllowed: false,
      hrTargetsAllowed: true,
      hrTargetSource: "personal_hr_zone",
      hrTargetLabel: hrMetadata?.label ?? null,
      hrTargetSourceNote: hrMetadata?.sourceNote ?? null,
      reason: "Workout includes explicit personal heart-rate zone targets.",
    };
  }

  return {
    guidance: hrMetadata?.source === "default_estimated_hr" ? "heart_rate" : "effort",
    executableMode: fallbackExecutableMode,
    paceTargetsAllowed: false,
    hrTargetsAllowed: false,
    hrTargetSource: hrMetadata?.source ?? "effort_only",
    hrTargetLabel: hrMetadata?.source === "default_estimated_hr" ? hrMetadata.label : null,
    hrTargetSourceNote:
      hrMetadata?.source === "default_estimated_hr" ? hrMetadata.sourceNote : null,
    reason:
      hrMetadata?.source === "default_estimated_hr"
        ? "Workout has executable numeric structure with default estimated HR guidance; HR remains non-personal and advisory."
        : fallbackExecutableMode === "structure_only_executable"
          ? "Workout has executable duration, distance, repeat, work, or recovery structure without pace or HR targets."
          : "Workout is missing executable numeric metric truth and executable structure.",
  };
}

export function deriveExecutableModeFromSegments(
  segments: WorkoutSegmentLike[],
): CanonicalExecutableMode {
  if (segments.length === 0) {
    return "correction_required";
  }

  const executionSegments = flattenWorkoutSegments(segments).filter(
    (segment) => !isNonRunningNoneSegment(segment),
  );

  if (executionSegments.length === 0) {
    return "none";
  }

  return executionSegments.every(segmentHasExecutableNumericStructure)
    ? "structure_only_executable"
    : "correction_required";
}

function deriveHrTargetMetadata(segments: WorkoutSegmentLike[]) {
  const targets = segments.flatMap((segment) =>
    [segment.target, segment.recovery_target].filter(
      (target): target is Record<string, unknown> =>
        Boolean(target) &&
        (typeof target.hr_bpm_range === "string" || typeof target.hr_bpm === "string"),
    ),
  );
  const sources = targets
    .map((target) => normalizeHrTargetSource(target.hr_target_source))
    .filter((source): source is HrTargetSource => Boolean(source));

  if (sources.length > 0 && sources.every((source) => source === "default_estimated_hr")) {
    const metadataTarget = targets.find(
      (target) => normalizeHrTargetSource(target.hr_target_source) === "default_estimated_hr",
    );

    return {
      source: "default_estimated_hr" as const,
      label: readString(metadataTarget?.label) ?? null,
      sourceNote: readString(metadataTarget?.source_note) ?? null,
    };
  }

  return {
    source: "personal_hr_zone" as const,
    label: null,
    sourceNote: null,
  };
}

function inferWorkoutIdentity(
  workoutType: LegacyWorkoutType,
  title: string | null | undefined,
  steps: WorkoutSegmentLike[],
): CanonicalWorkoutIdentity {
  if (workoutType === "rest") {
    return "rest_and_recovery";
  }

  const titleText = title?.trim() ?? "";
  const semanticText = buildLegacySemanticText(titleText, steps);

  if (/\btaper\b/i.test(semanticText) && /\blong\b/i.test(semanticText)) return "taper_long_run";
  if (/\btaper\b|tune[-_\s]?up\b/i.test(semanticText)) return "taper_tuneup_run";
  if (/\bcutback\b/i.test(semanticText) && /\blong\b/i.test(semanticText)) {
    return "cutback_long_run";
  }
  if (/\bcutback\b/i.test(semanticText)) return "cutback_aerobic_run";
  if (/\bsteady\s+finish\b/i.test(semanticText)) return "long_run_with_steady_finish";
  if (/\btechnical\b.*\btrail\b|\btrail\b.*\bawareness\b/i.test(semanticText)) {
    return "technical_trail_easy";
  }
  if (/\bdownhill\b|\bdescent\b|\beccentric\b/i.test(semanticText)) {
    return "controlled_downhill_durability";
  }
  if (/\bhike[-_\s]?run\b|\bpower[-_\s]?hike\b/i.test(semanticText)) {
    return "hike_run_endurance";
  }
  if (
    /\bmountain\b.*\btime[-_\s]?on[-_\s]?feet\b|\btime[-_\s]?on[-_\s]?feet\b.*\bmountain\b/i.test(
      semanticText,
    )
  ) {
    return "mountain_long_run_time_on_feet";
  }
  if (
    /\bultra\b.*\btime[-_\s]?on[-_\s]?feet\b|\btime[-_\s]?on[-_\s]?feet\b.*\bdurability\b/i.test(
      semanticText,
    )
  ) {
    return "ultra_time_on_feet_durability";
  }
  if (/\brolling\b.*\bhills?\b|\bhills?\b.*\brolling\b/i.test(semanticText)) {
    return "rolling_hills_session";
  }
  if (/\bclimb(?:ing)?\b.*\bsteady\b|\bsteady\b.*\bclimb(?:ing)?\b/i.test(semanticText)) {
    return "climbing_steady_run";
  }
  if (/\buphill\b|\bhill\s+repeats?\b|\bhill\s+work\b/i.test(semanticText)) {
    return "uphill_repeats";
  }
  if (/\brace\s+week\b|\bleg\s+opener\b/i.test(semanticText)) return "taper_tuneup_run";
  if (/\btaper\b|tune[-_\s]?up\b/i.test(semanticText)) return "taper_tuneup_run";
  const hasRaceRhythmCue =
    /\brace\s+rhythm\b|\brace\s+pace\b|\brace[-_\s]?specific\b|\btime\s+trial\b/i.test(
      semanticText,
    );

  if (hasRaceRhythmCue) {
    return "race_pace_session";
  }
  if (/\bdistance\s+intervals?\b|\bintervals?\b.*\bdistance\b/i.test(semanticText)) {
    return "distance_intervals";
  }
  if (/\btime\s+intervals?\b|\bintervals?\b.*\btime\b/i.test(semanticText)) {
    return "time_intervals";
  }
  if (
    /\b(?:controlled|introductory|technique|short|longer|support|aerobic\s+power|reduced\s+load)\b.*\bintervals?\b/i.test(
      semanticText,
    ) ||
    hasSemanticSegmentType(steps, "interval_block")
  ) {
    return "distance_intervals";
  }
  if (/\bstrides?\b|\bsharpening\b/i.test(titleText)) return "easy_run_with_strides";
  if (/\b5k\b/i.test(semanticText)) return "5k_sharpening_repeats";
  if (/\b10k\b/i.test(semanticText)) return "10k_rhythm_intervals";
  if (/\bthreshold\b|\bhalf[-_\s]?marathon\b/i.test(semanticText)) {
    return "half_marathon_threshold_durability";
  }
  if (/\btempo\b/i.test(semanticText)) return "controlled_tempo_session";
  if (/\bmarathon\b/i.test(semanticText) && /\bsteady|specific/i.test(semanticText)) {
    return "marathon_steady_specificity";
  }
  if (/\bprogression\b/i.test(semanticText)) return "progression_run";
  if (/\brace\s+pace\b|\brace[-_\s]?specific\b|\btune[-_\s]?up\b/i.test(semanticText)) {
    return "race_pace_session";
  }
  if (/\btrail\b|\bmountain\b/i.test(semanticText)) return "technical_trail_easy";

  switch (workoutType) {
    case "recovery":
      return "recovery_jog";
    case "steady_or_easy":
      return "steady_aerobic_run";
    case "long_run":
      return "long_aerobic_run";
    case "tempo":
      return "controlled_tempo_session";
    case "intervals":
      return "distance_intervals";
    case "progression":
      return "progression_run";
    case "race":
      return "race_pace_session";
    case "quality":
      return "quality_session";
    case "easy":
    default:
      return "easy_aerobic_run";
  }
}

function buildRestMetricMode(): CanonicalMetricMode {
  return {
    guidance: "effort",
    executableMode: "none",
    paceTargetsAllowed: false,
    hrTargetsAllowed: false,
    hrTargetSource: "effort_only",
    hrTargetLabel: null,
    hrTargetSourceNote: null,
    reason: "Rest day has no execution metric targets.",
  };
}

function inferExecutableModeFromMetricTruth({
  paceTargetsAllowed,
  hrTargetsAllowed,
  hrTargetSource,
  guidance,
}: {
  paceTargetsAllowed: boolean;
  hrTargetsAllowed: boolean;
  hrTargetSource: HrTargetSource;
  guidance: CanonicalMetricGuidance;
}): CanonicalExecutableMode {
  if (paceTargetsAllowed && hrTargetsAllowed && hrTargetSource === "personal_hr_zone") {
    return "mixed_metric_executable";
  }

  if (paceTargetsAllowed) {
    return "pace_executable";
  }

  if (hrTargetsAllowed && hrTargetSource === "personal_hr_zone") {
    return "hr_executable";
  }

  return guidance === "effort" ? "effort_only" : "unknown";
}

function flattenWorkoutSegments(segments: WorkoutSegmentLike[]): WorkoutSegmentLike[] {
  return segments.flatMap((segment) => [
    segment,
    ...(segment.work ? flattenWorkoutSegments([segment.work]) : []),
    ...(segment.recovery ? flattenWorkoutSegments([segment.recovery]) : []),
  ]);
}

function isNonRunningNoneSegment(segment: WorkoutSegmentLike) {
  const segmentType = normalizeToken(segment.segment_type ?? segment.type);
  const mode = normalizeToken(segment.prescription?.mode);

  return (
    mode === "none" &&
    ["rest", "fueling", "mobility", "mobility_optional", "activation", "drills"].includes(
      segmentType ?? "",
    )
  );
}

function segmentHasExecutableNumericStructure(segment: WorkoutSegmentLike): boolean {
  const prescription = segment.prescription;
  const mode = normalizeToken(prescription?.mode);

  if (mode === "time") {
    return positiveNumber(prescription?.duration_min) || positiveNumber(segment.duration_min);
  }

  if (mode === "distance") {
    return positiveNumber(prescription?.distance_km) || positiveNumber(segment.distance_km);
  }

  if (mode === "repeats") {
    return (
      positiveNumber(prescription?.repeat_count ?? segment.repeat_count) &&
      unitPrescriptionHasExecutableStructure(prescription?.repeat_unit) &&
      unitPrescriptionHasExecutableStructure(prescription?.recovery_unit)
    );
  }

  return (
    positiveNumber(segment.duration_min) ||
    positiveNumber(segment.distance_km) ||
    (positiveNumber(segment.repeat_count) &&
      (positiveNumber(segment.work_distance_km) ||
        positiveNumber(segment.work_duration_min) ||
        positiveNumber(segment.work_duration_sec)) &&
      (positiveNumber(segment.recovery_distance_km) ||
        positiveNumber(segment.recovery_duration_min) ||
        positiveNumber(segment.recovery_duration_sec)))
  );
}

function unitPrescriptionHasExecutableStructure(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const unit = value as Record<string, unknown>;
  const mode = normalizeToken(unit.mode);

  if (mode === "time") {
    return positiveNumber(unit.duration_min);
  }

  if (mode === "distance") {
    return positiveNumber(unit.distance_km);
  }

  return false;
}

function positiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function buildLegacySemanticText(title: string, steps: WorkoutSegmentLike[]) {
  return [title, ...steps.flatMap((step) => collectSegmentSemanticText(step))]
    .filter(Boolean)
    .join(" ");
}

function collectSegmentSemanticText(step: WorkoutSegmentLike): string[] {
  const entries = [step.type, step.segment_type, step.label];

  if (step.target) {
    entries.push(readTargetText(step.target, "intensity"));
    entries.push(readTargetText(step.target, "cue"));
    entries.push(readTargetText(step.target, "hint"));
  }

  if (step.recovery_target) {
    entries.push(readTargetText(step.recovery_target, "intensity"));
    entries.push(readTargetText(step.recovery_target, "cue"));
    entries.push(readTargetText(step.recovery_target, "hint"));
  }

  if (step.work) {
    entries.push(...collectSegmentSemanticText(step.work));
  }

  if (step.recovery) {
    entries.push(...collectSegmentSemanticText(step.recovery));
  }

  return entries.filter((entry): entry is string => Boolean(entry?.trim()));
}

function hasSemanticSegmentType(steps: WorkoutSegmentLike[], segmentType: string): boolean {
  return steps.some((step) => {
    if (step.segment_type === segmentType || step.type === segmentType) {
      return true;
    }

    return (
      (step.work ? hasSemanticSegmentType([step.work], segmentType) : false) ||
      (step.recovery ? hasSemanticSegmentType([step.recovery], segmentType) : false)
    );
  });
}

function readTargetText(target: Record<string, unknown>, key: string) {
  const value = target[key];

  return typeof value === "string" ? value : null;
}

function normalizeTerrainFocus(value: unknown): CanonicalGoalContext["terrainFocus"] {
  const token = normalizeToken(value);

  if (token === "standard" || token === "rolling" || token === "mountain") {
    return token;
  }

  return null;
}

function readString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function normalizeMetricGuidance(value: unknown): CanonicalMetricGuidance | null {
  const token = normalizeToken(value);

  return token && GUIDANCE_VALUES.has(token) ? (token as CanonicalMetricGuidance) : null;
}

function normalizeExecutableMode(value: unknown): CanonicalExecutableMode | null {
  const token = normalizeToken(value);

  return token && EXECUTABLE_MODE_VALUE_SET.has(token) ? (token as CanonicalExecutableMode) : null;
}

function segmentContainsTargetKeys(segment: WorkoutSegmentLike, keys: string[]): boolean {
  const targets = [
    segment.target,
    segment.recovery_target,
    segment.work?.target,
    segment.recovery?.target,
  ];

  if (
    targets.some((target) =>
      keys.some((key) => {
        const value = target?.[key];

        return typeof value === "string" && value.trim().length > 0;
      }),
    )
  ) {
    return true;
  }

  return [segment.work, segment.recovery].some(
    (child) => child != null && segmentContainsTargetKeys(child, keys),
  );
}

function normalizeHrTargetSource(value: unknown): HrTargetSource | null {
  const token = normalizeToken(value);

  return token && HR_TARGET_SOURCE_VALUE_SET.has(token) ? (token as HrTargetSource) : null;
}

function readBoolean(...values: unknown[]) {
  return values.some((value) => value === true);
}

function normalizeToken(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const token = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");

  return token || null;
}
