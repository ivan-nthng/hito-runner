import type {
  CalendarIconKey,
  CanonicalWorkoutFamily,
  CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import type { WorkoutType } from "@/lib/training";
import type {
  ManualWorkoutBlockInput,
  ManualWorkoutConstructorEntryInput,
  ManualWorkoutRepeatSafetyKind,
  ManualWorkoutTargetTruthMode,
  ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";

export interface ManualWorkoutTemplate {
  templateKey: ManualWorkoutTemplateKey;
  label: string;
  workoutIdentity: CanonicalWorkoutIdentity;
  workoutFamily: CanonicalWorkoutFamily;
  calendarIconKey: CalendarIconKey;
  workoutType: WorkoutType;
  defaultTitle: string;
  defaultNotes: string | null;
  defaultTargetTruthMode: ManualWorkoutTargetTruthMode;
  allowedTargetTruthModes: ManualWorkoutTargetTruthMode[];
  defaultEntries: ManualWorkoutConstructorEntryInput[];
  requiresWarmupCooldown: boolean;
  requiresRepeatGroup: boolean;
  repeatedIntensityRequiresRecovery: boolean;
  longRunRequiresMultiBlockAboveSeconds: number | null;
  mappingGaps: string[];
}

export const MANUAL_WORKOUT_TEMPLATE_REGISTRY = {
  rest_day: {
    templateKey: "rest_day",
    label: "Rest day",
    workoutIdentity: "rest_and_recovery",
    workoutFamily: "rest",
    calendarIconKey: "rest",
    workoutType: "rest",
    defaultTitle: "Rest day",
    defaultNotes: "Rest day.",
    defaultTargetTruthMode: "none",
    allowedTargetTruthModes: ["none"],
    defaultEntries: [],
    requiresWarmupCooldown: false,
    requiresRepeatGroup: false,
    repeatedIntensityRequiresRecovery: false,
    longRunRequiresMultiBlockAboveSeconds: null,
    mappingGaps: [],
  },
  recovery_jog: supportTemplate({
    templateKey: "recovery_jog",
    label: "Recovery jog",
    workoutIdentity: "recovery_jog",
    workoutFamily: "recovery",
    calendarIconKey: "recovery",
    workoutType: "easy",
    defaultTitle: "Recovery jog",
    mainBlock: block("easy_run_block", { durationSeconds: 20 * 60, label: "Recovery jog" }),
    defaultNotes: "Keep this deliberately relaxed.",
  }),
  easy_aerobic_run: supportTemplate({
    templateKey: "easy_aerobic_run",
    label: "Easy aerobic run",
    workoutIdentity: "easy_aerobic_run",
    workoutFamily: "easy",
    calendarIconKey: "easy",
    workoutType: "easy",
    defaultTitle: "Easy aerobic run",
    mainBlock: block("easy_run_block", { durationSeconds: 30 * 60, label: "Easy aerobic running" }),
    defaultNotes: "Easy conversational running.",
  }),
  steady_aerobic_run: supportTemplate({
    templateKey: "steady_aerobic_run",
    label: "Steady aerobic run",
    workoutIdentity: "steady_aerobic_run",
    workoutFamily: "steady",
    calendarIconKey: "steady",
    workoutType: "steady_or_easy",
    defaultTitle: "Steady aerobic run",
    mainBlock: block("steady_run_block", {
      durationSeconds: 30 * 60,
      label: "Steady aerobic running",
    }),
    defaultNotes: "Steady support, not threshold work.",
  }),
  easy_run_with_strides: {
    templateKey: "easy_run_with_strides",
    label: "Easy run with strides",
    workoutIdentity: "easy_run_with_strides",
    workoutFamily: "easy",
    calendarIconKey: "easy",
    workoutType: "easy",
    defaultTitle: "Easy run with strides",
    defaultNotes: "Relaxed fast strides with full easy recoveries.",
    defaultTargetTruthMode: "structure_only",
    allowedTargetTruthModes: ["structure_only"],
    defaultEntries: [
      entry(block("easy_run_block", { durationSeconds: 10 * 60, label: "Easy support" })),
      repeatEntry({
        repeatCount: 6,
        safetyKind: "strides",
        groupLabel: "6 x 20 sec strides / 60 sec easy jog",
        workBlock: block("strides_block", { durationSeconds: 20, label: "Stride" }),
        recoveryBlock: block("interval_recovery_block", {
          durationSeconds: 60,
          label: "Easy jog recovery",
        }),
      }),
      entry(block("cooldown_block", { durationSeconds: 5 * 60 })),
    ],
    requiresWarmupCooldown: false,
    requiresRepeatGroup: true,
    repeatedIntensityRequiresRecovery: true,
    longRunRequiresMultiBlockAboveSeconds: null,
    mappingGaps: [],
  },
  progression_run: {
    templateKey: "progression_run",
    label: "Progression run",
    workoutIdentity: "progression_run",
    workoutFamily: "progression",
    calendarIconKey: "progression",
    workoutType: "quality",
    defaultTitle: "Progression run",
    defaultNotes: "Move gradually from easy to steady, not maximal.",
    defaultTargetTruthMode: "structure_only",
    allowedTargetTruthModes: ["structure_only"],
    defaultEntries: [
      entry(block("warmup_block", { durationSeconds: 10 * 60 })),
      entry(
        block("progression_block", {
          durationSeconds: 25 * 60,
          label: "Easy to steady progression",
        }),
      ),
      entry(block("cooldown_block", { durationSeconds: 5 * 60 })),
    ],
    requiresWarmupCooldown: true,
    requiresRepeatGroup: false,
    repeatedIntensityRequiresRecovery: false,
    longRunRequiresMultiBlockAboveSeconds: null,
    mappingGaps: [],
  },
  controlled_tempo_session: repeatWorkoutTemplate({
    templateKey: "controlled_tempo_session",
    label: "Controlled tempo session",
    workoutIdentity: "controlled_tempo_session",
    workoutFamily: "tempo",
    calendarIconKey: "tempo",
    workoutType: "quality",
    defaultTitle: "Controlled tempo session",
    defaultNotes: "Controlled tempo blocks with explicit easy recoveries.",
    safetyKind: "tempo_repeats",
    groupLabel: "3 x 8 min tempo / 2 min easy jog",
    workBlock: block("tempo_block", { durationSeconds: 8 * 60, label: "Tempo work" }),
    recoveryBlock: block("interval_recovery_block", {
      durationSeconds: 2 * 60,
      label: "Easy jog recovery",
    }),
    repeatCount: 3,
  }),
  half_marathon_threshold_durability: repeatWorkoutTemplate({
    templateKey: "half_marathon_threshold_durability",
    label: "Threshold durability",
    workoutIdentity: "half_marathon_threshold_durability",
    workoutFamily: "tempo",
    calendarIconKey: "tempo",
    workoutType: "quality",
    defaultTitle: "Threshold durability",
    defaultNotes: "Threshold durability with explicit recovery.",
    safetyKind: "tempo_repeats",
    groupLabel: "3 x 10 min threshold / 3 min easy jog",
    workBlock: block("threshold_block", { durationSeconds: 10 * 60, label: "Threshold work" }),
    recoveryBlock: block("interval_recovery_block", {
      durationSeconds: 3 * 60,
      label: "Easy jog recovery",
    }),
    repeatCount: 3,
  }),
  time_intervals: repeatWorkoutTemplate({
    templateKey: "time_intervals",
    label: "Time intervals",
    workoutIdentity: "time_intervals",
    workoutFamily: "intervals",
    calendarIconKey: "intervals",
    workoutType: "quality",
    defaultTitle: "Time intervals",
    defaultNotes: "Time-based work with explicit easy recoveries.",
    safetyKind: "intervals",
    groupLabel: "6 x 2 min work / 1 min easy jog",
    workBlock: block("interval_work_block", { durationSeconds: 2 * 60, label: "Work" }),
    recoveryBlock: block("interval_recovery_block", {
      durationSeconds: 60,
      label: "Easy jog recovery",
    }),
    repeatCount: 6,
  }),
  distance_intervals: repeatWorkoutTemplate({
    templateKey: "distance_intervals",
    label: "Distance intervals",
    workoutIdentity: "distance_intervals",
    workoutFamily: "intervals",
    calendarIconKey: "intervals",
    workoutType: "quality",
    defaultTitle: "Distance intervals",
    defaultNotes: "Distance-based work with explicit recovery.",
    safetyKind: "intervals",
    groupLabel: "6 x 400m work / 200m jog",
    workBlock: block("interval_work_block", { distanceMeters: 400, label: "Work" }),
    recoveryBlock: block("interval_recovery_block", {
      distanceMeters: 200,
      label: "Easy jog recovery",
    }),
    repeatCount: 6,
  }),
  long_aerobic_run: longRunTemplate({
    templateKey: "long_aerobic_run",
    label: "Long aerobic run",
    workoutIdentity: "long_aerobic_run",
    defaultTitle: "Long aerobic run",
    defaultNotes: "Long aerobic time with a small opener and cooldown.",
    bodySeconds: 75 * 60,
    finishBlock: block("coach_cue_note_block", {
      noteText: "Mid-run check: keep fueling and breathing calm.",
      label: "Checkpoint",
    }),
  }),
  long_run_with_steady_finish: longRunTemplate({
    templateKey: "long_run_with_steady_finish",
    label: "Long run with steady finish",
    workoutIdentity: "long_run_with_steady_finish",
    defaultTitle: "Long run with steady finish",
    defaultNotes: "Long aerobic body with a controlled steady finish.",
    bodySeconds: 60 * 60,
    finishBlock: block("long_run_finish_block", {
      durationSeconds: 15 * 60,
      label: "Controlled steady finish",
    }),
  }),
  cutback_long_run: longRunTemplate({
    templateKey: "cutback_long_run",
    label: "Cutback long run",
    workoutIdentity: "cutback_long_run",
    defaultTitle: "Cutback long run",
    defaultNotes: "Reduced long-run load.",
    bodySeconds: 50 * 60,
  }),
  taper_long_run: longRunTemplate({
    templateKey: "taper_long_run",
    label: "Taper long run",
    workoutIdentity: "taper_long_run",
    defaultTitle: "Taper long run",
    defaultNotes: "Reduced long run for taper.",
    bodySeconds: 40 * 60,
  }),
  uphill_repeats: repeatWorkoutTemplate({
    templateKey: "uphill_repeats",
    label: "Uphill repeats",
    workoutIdentity: "uphill_repeats",
    workoutFamily: "hills",
    calendarIconKey: "hills",
    workoutType: "quality",
    defaultTitle: "Uphill repeats",
    defaultNotes: "Uphill work with walk-jog recoveries; no exact grade prescription.",
    safetyKind: "hill_repeats",
    groupLabel: "8 x 45 sec uphill / walk-jog down",
    workBlock: block("hill_work_block", { durationSeconds: 45, label: "Uphill work" }),
    recoveryBlock: block("rest_walk_jog_recovery_block", {
      durationSeconds: 90,
      label: "Walk-jog down recovery",
    }),
    repeatCount: 8,
  }),
  rolling_hills_session: supportTemplate({
    templateKey: "rolling_hills_session",
    label: "Rolling hills session",
    workoutIdentity: "rolling_hills_session",
    workoutFamily: "hills",
    calendarIconKey: "hills",
    workoutType: "quality",
    defaultTitle: "Rolling hills session",
    mainBlock: block("steady_run_block", {
      durationSeconds: 30 * 60,
      label: "Rolling steady hills",
    }),
    defaultNotes: "Rolling terrain support without exact grade targets.",
    defaultTargetTruthMode: "structure_only",
    allowedTargetTruthModes: ["structure_only"],
  }),
  run_walk_adaptation: {
    templateKey: "run_walk_adaptation",
    label: "Run-walk session",
    workoutIdentity: "recovery_jog",
    workoutFamily: "recovery",
    calendarIconKey: "recovery",
    workoutType: "easy",
    defaultTitle: "Run-walk session",
    defaultNotes: "Adaptation through short run/walk repeats.",
    defaultTargetTruthMode: "structure_only",
    allowedTargetTruthModes: ["structure_only"],
    defaultEntries: [
      repeatEntry({
        repeatCount: 10,
        safetyKind: "run_walk",
        groupLabel: "10 x 1 min run / 1 min walk",
        workBlock: block("easy_run_block", { durationSeconds: 60, label: "Run" }),
        recoveryBlock: block("rest_walk_jog_recovery_block", {
          durationSeconds: 60,
          label: "Walk recovery",
        }),
      }),
      entry(block("cooldown_block", { durationSeconds: 5 * 60, label: "Walk-jog cooldown" })),
    ],
    requiresWarmupCooldown: false,
    requiresRepeatGroup: true,
    repeatedIntensityRequiresRecovery: true,
    longRunRequiresMultiBlockAboveSeconds: null,
    mappingGaps: [
      "Running Coach names run_walk_adaptation as an adaptation identity, but the current canonical identity list has no dedicated run-walk identity. Backend maps it to existing recovery_jog identity with explicit run/walk repeat anatomy.",
    ],
  },
  technical_trail_easy: supportTemplate({
    templateKey: "technical_trail_easy",
    label: "Technical trail easy",
    workoutIdentity: "technical_trail_easy",
    workoutFamily: "trail",
    calendarIconKey: "trail",
    workoutType: "easy",
    defaultTitle: "Technical trail easy",
    mainBlock: block("easy_run_block", {
      durationSeconds: 35 * 60,
      label: "Technical trail body",
    }),
    defaultNotes: "Easy technical trail running; cues are secondary to duration.",
    defaultTargetTruthMode: "structure_only",
    allowedTargetTruthModes: ["structure_only"],
    mappingGaps: [
      "Current executable segment vocabulary has no dedicated trail body block, so technical trail easy uses existing easy_run_block structure with technical trail identity metadata.",
    ],
  }),
} satisfies Record<ManualWorkoutTemplateKey, ManualWorkoutTemplate>;

export const MANUAL_WORKOUT_TEMPLATE_MAPPING_GAPS = Object.values(
  MANUAL_WORKOUT_TEMPLATE_REGISTRY,
).flatMap((template) =>
  template.mappingGaps.map((message) => ({
    templateKey: template.templateKey,
    message,
  })),
);

export function getManualWorkoutTemplate(
  templateKey: ManualWorkoutTemplateKey,
): ManualWorkoutTemplate {
  return MANUAL_WORKOUT_TEMPLATE_REGISTRY[templateKey];
}

export function listManualWorkoutTemplates(): ManualWorkoutTemplate[] {
  return Object.values(MANUAL_WORKOUT_TEMPLATE_REGISTRY);
}

function supportTemplate(input: {
  templateKey: ManualWorkoutTemplateKey;
  label: string;
  workoutIdentity: CanonicalWorkoutIdentity;
  workoutFamily: CanonicalWorkoutFamily;
  calendarIconKey: CalendarIconKey;
  workoutType: WorkoutType;
  defaultTitle: string;
  mainBlock: ManualWorkoutBlockInput;
  defaultNotes: string | null;
  defaultTargetTruthMode?: ManualWorkoutTargetTruthMode;
  allowedTargetTruthModes?: ManualWorkoutTargetTruthMode[];
  mappingGaps?: string[];
}): ManualWorkoutTemplate {
  return {
    templateKey: input.templateKey,
    label: input.label,
    workoutIdentity: input.workoutIdentity,
    workoutFamily: input.workoutFamily,
    calendarIconKey: input.calendarIconKey,
    workoutType: input.workoutType,
    defaultTitle: input.defaultTitle,
    defaultNotes: input.defaultNotes,
    defaultTargetTruthMode: input.defaultTargetTruthMode ?? "structure_only",
    allowedTargetTruthModes: input.allowedTargetTruthModes ?? [
      "structure_only",
      "editable_default_hr",
    ],
    defaultEntries: [
      entry(block("warmup_block", { durationSeconds: 10 * 60 })),
      entry(input.mainBlock),
      entry(block("cooldown_block", { durationSeconds: 5 * 60 })),
    ],
    requiresWarmupCooldown: false,
    requiresRepeatGroup: false,
    repeatedIntensityRequiresRecovery: false,
    longRunRequiresMultiBlockAboveSeconds: null,
    mappingGaps: input.mappingGaps ?? [],
  };
}

function repeatWorkoutTemplate(input: {
  templateKey: ManualWorkoutTemplateKey;
  label: string;
  workoutIdentity: CanonicalWorkoutIdentity;
  workoutFamily: CanonicalWorkoutFamily;
  calendarIconKey: CalendarIconKey;
  workoutType: WorkoutType;
  defaultTitle: string;
  defaultNotes: string | null;
  safetyKind: "intervals" | "tempo_repeats" | "hill_repeats" | "downhill_control";
  groupLabel: string;
  workBlock: ManualWorkoutBlockInput;
  recoveryBlock: ManualWorkoutBlockInput;
  repeatCount: number;
}): ManualWorkoutTemplate {
  return {
    templateKey: input.templateKey,
    label: input.label,
    workoutIdentity: input.workoutIdentity,
    workoutFamily: input.workoutFamily,
    calendarIconKey: input.calendarIconKey,
    workoutType: input.workoutType,
    defaultTitle: input.defaultTitle,
    defaultNotes: input.defaultNotes,
    defaultTargetTruthMode: "structure_only",
    allowedTargetTruthModes: ["structure_only"],
    defaultEntries: [
      entry(block("warmup_block", { durationSeconds: 15 * 60 })),
      repeatEntry({
        repeatCount: input.repeatCount,
        safetyKind: input.safetyKind,
        groupLabel: input.groupLabel,
        workBlock: input.workBlock,
        recoveryBlock: input.recoveryBlock,
      }),
      entry(block("cooldown_block", { durationSeconds: 10 * 60 })),
    ],
    requiresWarmupCooldown: true,
    requiresRepeatGroup: true,
    repeatedIntensityRequiresRecovery: true,
    longRunRequiresMultiBlockAboveSeconds: null,
    mappingGaps: [],
  };
}

function longRunTemplate(input: {
  templateKey: ManualWorkoutTemplateKey;
  label: string;
  workoutIdentity: CanonicalWorkoutIdentity;
  defaultTitle: string;
  defaultNotes: string | null;
  bodySeconds: number;
  finishBlock?: ManualWorkoutBlockInput;
}): ManualWorkoutTemplate {
  return {
    templateKey: input.templateKey,
    label: input.label,
    workoutIdentity: input.workoutIdentity,
    workoutFamily: "long",
    calendarIconKey: "long",
    workoutType: "long_run",
    defaultTitle: input.defaultTitle,
    defaultNotes: input.defaultNotes,
    defaultTargetTruthMode: "structure_only",
    allowedTargetTruthModes: ["structure_only", "editable_default_hr"],
    defaultEntries: [
      entry(block("warmup_block", { durationSeconds: 10 * 60, label: "Opener" })),
      entry(block("long_run_body_block", { durationSeconds: input.bodySeconds })),
      ...(input.finishBlock ? [entry(input.finishBlock)] : []),
      entry(block("cooldown_block", { durationSeconds: 5 * 60 })),
    ],
    requiresWarmupCooldown: false,
    requiresRepeatGroup: false,
    repeatedIntensityRequiresRecovery: false,
    longRunRequiresMultiBlockAboveSeconds: 60 * 60,
    mappingGaps: [],
  };
}

function block(
  blockKey: ManualWorkoutBlockInput["blockKey"],
  value: Omit<ManualWorkoutBlockInput, "blockKey">,
): ManualWorkoutBlockInput {
  return {
    blockKey,
    ...value,
  };
}

function entry(blockValue: ManualWorkoutBlockInput): ManualWorkoutConstructorEntryInput {
  return {
    kind: "block",
    block: blockValue,
  };
}

function repeatEntry(group: {
  repeatCount: number;
  safetyKind: ManualWorkoutRepeatSafetyKind;
  groupLabel: string;
  workBlock: ManualWorkoutBlockInput;
  recoveryBlock?: ManualWorkoutBlockInput;
}): ManualWorkoutConstructorEntryInput {
  return {
    kind: "repeat_group",
    group,
  };
}
