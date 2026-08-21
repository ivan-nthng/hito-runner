import type {
  CalendarIconKey,
  CanonicalWorkoutFamily,
  CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import type { WorkoutType } from "@/lib/training";
import { normalizeExecutableStepInstructions, type Step } from "@/lib/training";
import type {
  ManualWorkoutTargetTruthMode,
  ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";
import type { WorkoutDocumentSection } from "@/lib/workout-document";

type ManualWorkoutTemplateBlockKey =
  | "warmup_block"
  | "easy_run_block"
  | "steady_run_block"
  | "progression_block"
  | "tempo_block"
  | "threshold_block"
  | "interval_work_block"
  | "interval_recovery_block"
  | "hill_work_block"
  | "downhill_control_block"
  | "strides_block"
  | "long_run_body_block"
  | "long_run_finish_block"
  | "rest_walk_jog_recovery_block"
  | "cooldown_block"
  | "coach_cue_note_block";

type ManualWorkoutTemplateBlock = {
  blockKey: ManualWorkoutTemplateBlockKey;
  durationSeconds?: number;
  distanceMeters?: number;
  noteText?: string;
  label?: string;
};

type ManualWorkoutTemplateEntry =
  | { kind: "block"; block: ManualWorkoutTemplateBlock }
  | {
      kind: "repeat_group";
      group: {
        repeatCount: number;
        safetyKind:
          | "intervals"
          | "tempo_repeats"
          | "hill_repeats"
          | "downhill_control"
          | "run_walk"
          | "strides";
        groupLabel: string;
        children: ManualWorkoutTemplateBlock[];
      };
    };

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
  defaultSteps: WorkoutDocumentSection[];
  requiresWarmupCooldown: boolean;
  requiresRepeatGroup: boolean;
  repeatedIntensityRequiresRecovery: boolean;
  mappingGaps: string[];
}

export const VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS = [
  "rest_day",
  "recovery_jog",
  "easy_aerobic_run",
  "steady_aerobic_run",
  "long_aerobic_run",
  "progression_run",
  "controlled_tempo_session",
  "time_intervals",
  "uphill_repeats",
  "run_walk_adaptation",
] as const satisfies readonly ManualWorkoutTemplateKey[];

export const INTERNAL_SUPPORTED_MANUAL_WORKOUT_TEMPLATE_KEYS = [
  "easy_run_with_strides",
  "half_marathon_threshold_durability",
  "distance_intervals",
  "long_run_with_steady_finish",
  "cutback_long_run",
  "taper_long_run",
  "rolling_hills_session",
  "technical_trail_easy",
] as const satisfies readonly ManualWorkoutTemplateKey[];

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
    defaultSteps: [],
    requiresWarmupCooldown: false,
    requiresRepeatGroup: false,
    repeatedIntensityRequiresRecovery: false,
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
    mainBlock: block("easy_run_block", { durationSeconds: 15 * 60, label: "Recovery jog" }),
    defaultNotes: "Keep this deliberately relaxed.",
    warmupSeconds: 5 * 60,
    cooldownSeconds: 5 * 60,
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
    defaultSteps: templateSteps([
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
    ]),
    requiresWarmupCooldown: false,
    requiresRepeatGroup: true,
    repeatedIntensityRequiresRecovery: true,
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
    defaultSteps: templateSteps([
      entry(block("warmup_block", { durationSeconds: 10 * 60 })),
      entry(
        block("progression_block", {
          durationSeconds: 8 * 60,
          label: "Controlled opening stage",
        }),
      ),
      entry(
        block("progression_block", {
          durationSeconds: 8 * 60,
          label: "Middle progression stage",
        }),
      ),
      entry(
        block("progression_block", {
          durationSeconds: 9 * 60,
          label: "Steady closing stage",
        }),
      ),
      entry(block("cooldown_block", { durationSeconds: 5 * 60 })),
    ]),
    requiresWarmupCooldown: true,
    requiresRepeatGroup: false,
    repeatedIntensityRequiresRecovery: false,
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
    defaultSteps: templateSteps([
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
    ]),
    requiresWarmupCooldown: false,
    requiresRepeatGroup: true,
    repeatedIntensityRequiresRecovery: true,
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
  return listSupportedManualWorkoutTemplates();
}

export function listSupportedManualWorkoutTemplates(): ManualWorkoutTemplate[] {
  return Object.values(MANUAL_WORKOUT_TEMPLATE_REGISTRY);
}

export function listVisibleManualWorkoutStarterTemplates(): ManualWorkoutTemplate[] {
  return VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS.map(getManualWorkoutTemplate);
}

function supportTemplate(input: {
  templateKey: ManualWorkoutTemplateKey;
  label: string;
  workoutIdentity: CanonicalWorkoutIdentity;
  workoutFamily: CanonicalWorkoutFamily;
  calendarIconKey: CalendarIconKey;
  workoutType: WorkoutType;
  defaultTitle: string;
  mainBlock: ManualWorkoutTemplateBlock;
  warmupSeconds?: number;
  cooldownSeconds?: number;
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
    allowedTargetTruthModes: input.allowedTargetTruthModes ?? ["structure_only"],
    defaultSteps: templateSteps([
      entry(block("warmup_block", { durationSeconds: input.warmupSeconds ?? 10 * 60 })),
      entry(input.mainBlock),
      entry(block("cooldown_block", { durationSeconds: input.cooldownSeconds ?? 5 * 60 })),
    ]),
    requiresWarmupCooldown: false,
    requiresRepeatGroup: false,
    repeatedIntensityRequiresRecovery: false,
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
  workBlock: ManualWorkoutTemplateBlock;
  recoveryBlock: ManualWorkoutTemplateBlock;
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
    defaultSteps: templateSteps([
      entry(block("warmup_block", { durationSeconds: 15 * 60 })),
      repeatEntry({
        repeatCount: input.repeatCount,
        safetyKind: input.safetyKind,
        groupLabel: input.groupLabel,
        workBlock: input.workBlock,
        recoveryBlock: input.recoveryBlock,
      }),
      entry(block("cooldown_block", { durationSeconds: 10 * 60 })),
    ]),
    requiresWarmupCooldown: true,
    requiresRepeatGroup: true,
    repeatedIntensityRequiresRecovery: true,
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
  finishBlock?: ManualWorkoutTemplateBlock;
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
    allowedTargetTruthModes: ["structure_only"],
    defaultSteps: templateSteps([
      entry(block("warmup_block", { durationSeconds: 10 * 60, label: "Opener" })),
      entry(block("long_run_body_block", { durationSeconds: input.bodySeconds })),
      ...(input.finishBlock ? [entry(input.finishBlock)] : []),
      entry(block("cooldown_block", { durationSeconds: 5 * 60 })),
    ]),
    requiresWarmupCooldown: false,
    requiresRepeatGroup: false,
    repeatedIntensityRequiresRecovery: false,
    mappingGaps: [],
  };
}

function block(
  blockKey: ManualWorkoutTemplateBlock["blockKey"],
  value: Omit<ManualWorkoutTemplateBlock, "blockKey">,
): ManualWorkoutTemplateBlock {
  return {
    blockKey,
    ...value,
  };
}

function entry(blockValue: ManualWorkoutTemplateBlock): ManualWorkoutTemplateEntry {
  return {
    kind: "block",
    block: blockValue,
  };
}

function repeatEntry(group: {
  repeatCount: number;
  safetyKind: Extract<ManualWorkoutTemplateEntry, { kind: "repeat_group" }>["group"]["safetyKind"];
  groupLabel: string;
  workBlock: ManualWorkoutTemplateBlock;
  recoveryBlock?: ManualWorkoutTemplateBlock;
}): ManualWorkoutTemplateEntry {
  return {
    kind: "repeat_group",
    group: {
      ...group,
      children: [group.workBlock, group.recoveryBlock].filter(
        (block): block is ManualWorkoutTemplateBlock => Boolean(block),
      ),
    },
  };
}

function templateSteps(entries: ManualWorkoutTemplateEntry[]): WorkoutDocumentSection[] {
  return normalizeExecutableStepInstructions(
    entries.flatMap((entryValue, index) => {
      const sequence = index + 1;
      if (entryValue.kind === "block") {
        return entryValue.block.blockKey === "coach_cue_note_block"
          ? []
          : [templateBlockToStep(entryValue.block, sequence)];
      }

      const children = entryValue.group.children.map((child, childIndex) => {
        const prescription = templateBlockPrescription(child);
        return {
          segment_id: `manual-segment-${sequence}-child-${childIndex + 1}`,
          role: templateRepeatRole(child.blockKey),
          label: child.label ?? templateBlockLabel(child.blockKey),
          sequence: childIndex + 1,
          guidance: child.noteText ?? templateBlockGuidance(child.blockKey),
          prescription,
        };
      });

      return [
        {
          type: templateRepeatStepType(entryValue.group.safetyKind),
          segment_id: `manual-segment-${sequence}`,
          segment_type: templateRepeatSegmentType(entryValue.group.safetyKind),
          sequence,
          label: entryValue.group.groupLabel,
          prescription: {
            mode: "repeats" as const,
            repeat_count: entryValue.group.repeatCount,
            children,
          },
          repeats: entryValue.group.repeatCount,
          children: children.map((child) => ({
            type: templateRepeatChildStepType(child.role),
            segment_id: child.segment_id,
            segment_type: child.role,
            sequence: child.sequence,
            label: child.label,
            prescription: child.prescription,
            ...(child.prescription.duration_min
              ? { duration_min: child.prescription.duration_min }
              : {}),
            ...(child.prescription.distance_km
              ? { distance_km: child.prescription.distance_km }
              : {}),
            guidance: child.guidance,
          })),
        },
      ];
    }) as Step[],
  );
}

function templateBlockToStep(
  blockValue: ManualWorkoutTemplateBlock,
  sequence: number,
): WorkoutDocumentSection {
  const prescription = templateBlockPrescription(blockValue);
  return {
    type: templateStepType(blockValue.blockKey),
    segment_id: `manual-segment-${sequence}`,
    segment_type: templateSegmentType(blockValue.blockKey),
    sequence,
    label: blockValue.label ?? templateBlockLabel(blockValue.blockKey),
    prescription,
    guidance: blockValue.noteText ?? templateBlockGuidance(blockValue.blockKey),
    ...(prescription.duration_min ? { duration_min: prescription.duration_min } : {}),
    ...(prescription.distance_km ? { distance_km: prescription.distance_km } : {}),
    target: { hint: templateBlockGuidance(blockValue.blockKey) },
  };
}

function templateBlockPrescription(blockValue: ManualWorkoutTemplateBlock) {
  if (blockValue.distanceMeters) {
    return {
      mode: "distance" as const,
      distance_km: Number((blockValue.distanceMeters / 1000).toFixed(3)),
    };
  }
  if (blockValue.durationSeconds) {
    return {
      mode: "time" as const,
      duration_min: Number((blockValue.durationSeconds / 60).toFixed(2)),
    };
  }
  return { mode: "none" as const };
}

function templateRepeatRole(blockKey: ManualWorkoutTemplateBlockKey) {
  if (blockKey === "warmup_block") return "warm_up" as const;
  if (blockKey === "rest_walk_jog_recovery_block") return "walk" as const;
  if (blockKey === "interval_recovery_block") return "recover" as const;
  if (blockKey === "cooldown_block") return "cooldown" as const;
  if (blockKey === "long_run_finish_block") return "finish" as const;
  if (blockKey === "steady_run_block" || blockKey === "easy_run_block") return "run" as const;
  return "work" as const;
}

function templateRepeatChildStepType(role: ReturnType<typeof templateRepeatRole>) {
  if (role === "warm_up") return "warmup";
  if (role === "recover") return "recovery";
  if (role === "cooldown") return "cooldown";
  return role;
}

function templateStepType(blockKey: ManualWorkoutTemplateBlockKey) {
  if (blockKey === "warmup_block") return "warmup";
  if (blockKey === "cooldown_block") return "cooldown";
  if (blockKey === "steady_run_block") return "steady";
  if (blockKey === "progression_block") return "progression";
  if (blockKey === "tempo_block") return "tempo";
  if (blockKey === "threshold_block") return "threshold";
  if (blockKey === "hill_work_block") return "hills";
  if (blockKey === "long_run_body_block") return "long_run_body";
  if (blockKey === "long_run_finish_block") return "long_run_finish";
  if (blockKey === "strides_block") return "strides";
  if (blockKey === "rest_walk_jog_recovery_block" || blockKey === "interval_recovery_block")
    return "recovery";
  return "easy";
}

function templateSegmentType(blockKey: ManualWorkoutTemplateBlockKey) {
  if (blockKey === "warmup_block") return "warmup";
  if (blockKey === "cooldown_block") return "cooldown";
  if (blockKey === "long_run_finish_block") return "finish";
  if (blockKey === "interval_recovery_block" || blockKey === "rest_walk_jog_recovery_block")
    return "recovery";
  if (blockKey === "strides_block") return "strides";
  if (blockKey === "tempo_block" || blockKey === "threshold_block") return "tempo_block";
  if (
    blockKey === "hill_work_block" ||
    blockKey === "downhill_control_block" ||
    blockKey === "interval_work_block"
  )
    return "interval_block";
  return "main";
}

function templateRepeatStepType(
  kind: Extract<ManualWorkoutTemplateEntry, { kind: "repeat_group" }>["group"]["safetyKind"],
) {
  if (kind === "tempo_repeats") return "tempo";
  if (kind === "hill_repeats" || kind === "downhill_control") return "hills";
  if (kind === "run_walk") return "easy";
  if (kind === "strides") return "strides";
  return "intervals";
}

function templateRepeatSegmentType(
  kind: Extract<ManualWorkoutTemplateEntry, { kind: "repeat_group" }>["group"]["safetyKind"],
) {
  if (kind === "tempo_repeats") return "tempo_block";
  if (kind === "strides") return "strides";
  if (kind === "run_walk") return "recovery_jog";
  return "interval_block";
}

function templateBlockLabel(blockKey: ManualWorkoutTemplateBlockKey) {
  return blockKey
    .replace(/_block$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function templateBlockGuidance(blockKey: ManualWorkoutTemplateBlockKey) {
  if (blockKey === "warmup_block") return "Start easy and controlled.";
  if (blockKey === "cooldown_block") return "Finish easy; jog or walk before stopping.";
  if (blockKey === "interval_recovery_block" || blockKey === "rest_walk_jog_recovery_block")
    return "Recover easily before the next repeat.";
  if (blockKey === "hill_work_block")
    return "Run uphill with controlled form; no exact grade target.";
  if (blockKey === "long_run_finish_block") return "Keep the finish controlled, not race effort.";
  if (blockKey === "strides_block") return "Relaxed fast running with full control.";
  return "Use the numeric structure as the executable target.";
}
