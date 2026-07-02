import {
  ALL_SUPPORTED_RUNNING_PLAN_FAMILIES,
  meters,
  seconds,
} from "@/lib/plan-creation-engine/source-shared";
import type {
  RunningPlanEngineSourceModel,
  RunningPlanWorkoutDayTemplate,
} from "@/lib/plan-creation-engine/source-types";

const recoveryTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "recovery",
  label: "Recovery Run",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ALL_SUPPORTED_RUNNING_PLAN_FAMILIES,
  cueRole: "secondary_only",
  segments: [
    {
      id: "recovery_opening",
      order: 1,
      segmentRole: "opener",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(5),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Start relaxed.",
    },
    {
      id: "recovery_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "time_with_default_hr_cap",
        durationSeconds: seconds(20, 30),
        defaultHrZoneLabelOrCap: "editable default HR cap",
        intensityLabel: "softer_than_easy",
      },
      targetTruthMode: "editable_default_hr",
      secondaryCue: "Softer than a normal easy run.",
    },
    {
      id: "recovery_cooldown",
      order: 3,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(5),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish fresher than mid-run.",
    },
  ],
};

const easyTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "easy",
  label: "Easy Aerobic Run",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ALL_SUPPORTED_RUNNING_PLAN_FAMILIES,
  cueRole: "secondary_only",
  segments: [
    {
      id: "easy_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Settle gradually.",
    },
    {
      id: "easy_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "time_with_default_hr_cap",
        durationSeconds: seconds(30, 45),
        defaultHrZoneLabelOrCap: "editable default HR cap",
        intensityLabel: "easy_conversational",
      },
      targetTruthMode: "editable_default_hr",
      secondaryCue: "Conversational rhythm.",
    },
    {
      id: "easy_cooldown",
      order: 3,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(5),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Smooth finish.",
    },
  ],
};

const longRunTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "long_run",
  label: "Long Run",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ALL_SUPPORTED_RUNNING_PLAN_FAMILIES,
  cueRole: "secondary_only",
  segments: [
    {
      id: "long_opening",
      order: 1,
      segmentRole: "opener",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Start patient.",
    },
    {
      id: "long_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "time_with_default_hr_cap",
        durationSeconds: seconds(60, 120),
        defaultHrZoneLabelOrCap: "editable default HR ceiling",
        intensityLabel: "durable_easy",
      },
      targetTruthMode: "editable_default_hr",
      secondaryCue: "Durable, not rushed.",
    },
    {
      id: "long_checkpoint",
      order: 3,
      segmentRole: "checkpoint",
      primaryPrescription: {
        mode: "time",
        durationSeconds: seconds(3, 5),
        intensityLabel: "posture_fueling_check",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Stay calm through the middle.",
    },
    {
      id: "long_finish",
      order: 4,
      segmentRole: "finish",
      primaryPrescription: {
        mode: "time",
        durationSeconds: seconds(5),
        intensityLabel: "easy_finish",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish controlled.",
    },
  ],
};

const cutbackLongRunTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "cutback_long_run",
  label: "Cutback Long Run",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ALL_SUPPORTED_RUNNING_PLAN_FAMILIES,
  cueRole: "secondary_only",
  segments: [
    {
      id: "cutback_long_opening",
      order: 1,
      segmentRole: "opener",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Lighter week mindset.",
    },
    {
      id: "cutback_long_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "time_with_default_hr_cap",
        durationSeconds: seconds(40, 80),
        defaultHrZoneLabelOrCap: "editable default HR ceiling",
        intensityLabel: "reduced_long_run",
      },
      targetTruthMode: "editable_default_hr",
      secondaryCue: "Clearly easier than the prior peak.",
    },
    {
      id: "cutback_long_finish",
      order: 3,
      segmentRole: "finish",
      primaryPrescription: {
        mode: "time",
        durationSeconds: seconds(5),
        intensityLabel: "easy_finish",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish fresh.",
    },
  ],
};

const stridesTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "strides",
  label: "Easy Run With Strides",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only"],
  allowedFamilies: ALL_SUPPORTED_RUNNING_PLAN_FAMILIES,
  cueRole: "secondary_only",
  segments: [
    {
      id: "strides_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Open up gradually.",
    },
    {
      id: "strides_support",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "time",
        durationSeconds: seconds(10, 20),
        intensityLabel: "easy_support",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Keep it relaxed.",
    },
    {
      id: "strides_repeats",
      order: 3,
      segmentRole: "work",
      primaryPrescription: {
        mode: "repeat",
        repeatCount: { min: 4, max: 8 },
        children: [
          {
            role: "work",
            label: "Stride",
            prescription: {
              mode: "time",
              durationSeconds: { min: 20, max: 20 },
            },
            intensityLabel: "quick_relaxed_stride",
          },
          {
            role: "recover",
            label: "Easy jog",
            prescription: {
              mode: "time",
              durationSeconds: { min: 60, max: 60 },
            },
            intensityLabel: "easy_jog",
          },
        ],
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Quick feet, relaxed body; reset fully after each stride.",
    },
    {
      id: "strides_cooldown",
      order: 4,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(5),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish calm.",
    },
  ],
};

const steadyAerobicRunTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "steady_aerobic_run",
  label: "Steady Aerobic Run",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ["10K", "Half Marathon", "Marathon Base", "Marathon Completion"],
  cueRole: "secondary_only",
  segments: [
    {
      id: "steady_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Ease into the steady work.",
    },
    {
      id: "steady_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "time_with_default_hr_cap",
        durationSeconds: seconds(20, 35),
        defaultHrZoneLabelOrCap: "editable default HR cap",
        intensityLabel: "steady_aerobic",
      },
      targetTruthMode: "editable_default_hr",
      secondaryCue: "Smooth and controlled; this is base support, not race work.",
    },
    {
      id: "steady_cooldown",
      order: 3,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(5, 8),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Back off before the finish.",
    },
  ],
};

const progressionTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "progression",
  label: "Progression Run",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ["Half Marathon", "Marathon Completion"],
  cueRole: "secondary_only",
  segments: [
    {
      id: "progression_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(10, 12),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Start relaxed before building.",
    },
    {
      id: "progression_main",
      order: 2,
      segmentRole: "main",
      primaryPrescription: {
        mode: "time_with_default_hr_cap",
        durationSeconds: seconds(25, 40),
        defaultHrZoneLabelOrCap: "editable default HR cap",
        intensityLabel: "controlled_progression",
      },
      targetTruthMode: "editable_default_hr",
      secondaryCue: "Build gently from easy to steady; never chase pace.",
    },
    {
      id: "progression_finish",
      order: 3,
      segmentRole: "finish",
      primaryPrescription: {
        mode: "time",
        durationSeconds: seconds(5, 8),
        intensityLabel: "steady_but_controlled",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish a touch steadier while staying composed.",
    },
    {
      id: "progression_cooldown",
      order: 4,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(5, 8),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Let effort come back down.",
    },
  ],
};

const tempoTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "tempo",
  label: "Tempo Run",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ["10K", "Half Marathon", "Marathon Base", "Marathon Completion"],
  cueRole: "secondary_only",
  segments: [
    {
      id: "tempo_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(12, 15),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Prepare fully.",
    },
    {
      id: "tempo_repeats",
      order: 2,
      segmentRole: "work",
      primaryPrescription: {
        mode: "repeat",
        repeatCount: { min: 2, max: 3 },
        children: [
          {
            role: "work",
            label: "Tempo block",
            prescription: {
              mode: "time",
              durationSeconds: seconds(8, 12),
            },
            intensityLabel: "controlled_tempo",
          },
          {
            role: "recover",
            label: "Easy jog",
            prescription: {
              mode: "time",
              durationSeconds: seconds(2, 3),
            },
            intensityLabel: "easy_jog",
          },
        ],
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Strong and smooth; recover enough to repeat cleanly.",
    },
    {
      id: "tempo_cooldown",
      order: 3,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(8, 10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish composed.",
    },
  ],
};

const thresholdTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "threshold",
  label: "Threshold Intervals",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ["Half Marathon", "Marathon Base"],
  cueRole: "secondary_only",
  segments: [
    {
      id: "threshold_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(15),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Arrive calm.",
    },
    {
      id: "threshold_repeats",
      order: 2,
      segmentRole: "work",
      primaryPrescription: {
        mode: "repeat",
        repeatCount: { min: 3, max: 3 },
        children: [
          {
            role: "run",
            label: "Settle",
            prescription: {
              mode: "time",
              durationSeconds: seconds(3),
            },
            intensityLabel: "steady_settle",
          },
          {
            role: "work",
            label: "Threshold block",
            prescription: {
              mode: "time",
              durationSeconds: seconds(6, 8),
            },
            intensityLabel: "threshold_like_controlled",
          },
          {
            role: "recover",
            label: "Easy jog",
            prescription: {
              mode: "time",
              durationSeconds: seconds(3),
            },
            intensityLabel: "easy_jog",
          },
        ],
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Strong but controlled; fully reset.",
    },
    {
      id: "threshold_cooldown",
      order: 3,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Bring effort down gradually.",
    },
  ],
};

const intervalsTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "intervals",
  label: "Short Or Long Intervals",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only"],
  allowedFamilies: ["10K", "Half Marathon"],
  cueRole: "secondary_only",
  segments: [
    {
      id: "intervals_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(15),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Prepare fully.",
    },
    {
      id: "intervals_repeats",
      order: 2,
      segmentRole: "work",
      primaryPrescription: {
        mode: "repeat",
        repeatCount: { min: 4, max: 6 },
        children: [
          {
            role: "work",
            label: "Controlled repeat",
            prescription: {
              mode: "distance",
              distanceMeters: meters(400, 1000),
            },
            intensityLabel: "controlled_repeat",
          },
          {
            role: "recover",
            label: "Easy jog",
            prescription: {
              mode: "distance",
              distanceMeters: meters(200, 200),
            },
            intensityLabel: "easy_jog",
          },
        ],
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Repeat the same controlled rhythm.",
    },
    {
      id: "intervals_cooldown",
      order: 3,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish relaxed.",
    },
  ],
};

const hillsTemplate: RunningPlanWorkoutDayTemplate = {
  kind: "hills",
  label: "Hill Repeats",
  watchExecutable: true,
  primaryContract: "numeric_structure",
  targetTruthModes: ["structure_only", "editable_default_hr"],
  allowedFamilies: ALL_SUPPORTED_RUNNING_PLAN_FAMILIES,
  cueRole: "secondary_only",
  segments: [
    {
      id: "hills_warmup",
      order: 1,
      segmentRole: "warmup",
      primaryPrescription: {
        mode: "open_warmup",
        durationSeconds: seconds(15),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Warm fully before the hill.",
    },
    {
      id: "hills_repeats",
      order: 2,
      segmentRole: "work",
      primaryPrescription: {
        mode: "repeat",
        repeatCount: { min: 6, max: 10 },
        children: [
          {
            role: "work",
            label: "Uphill",
            prescription: {
              mode: "time",
              durationSeconds: { min: 45, max: 45 },
            },
            intensityLabel: "uphill_controlled",
          },
          {
            role: "walk",
            label: "Walk or jog down",
            prescription: {
              mode: "time",
              durationSeconds: { min: 75, max: 90 },
            },
            intensityLabel: "walk_or_jog_down",
          },
        ],
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Strong push, relaxed upper body; control the descent.",
    },
    {
      id: "hills_cooldown",
      order: 3,
      segmentRole: "cooldown",
      primaryPrescription: {
        mode: "open_cooldown",
        durationSeconds: seconds(10),
        intensityLabel: "easy",
      },
      targetTruthMode: "structure_only",
      secondaryCue: "Finish calm.",
    },
  ],
};

export const workoutDayTemplates: RunningPlanEngineSourceModel["workoutDayTemplates"] = {
  recovery: recoveryTemplate,
  easy: easyTemplate,
  long_run: longRunTemplate,
  cutback_long_run: cutbackLongRunTemplate,
  strides: stridesTemplate,
  steady_aerobic_run: steadyAerobicRunTemplate,
  progression: progressionTemplate,
  tempo: tempoTemplate,
  threshold: thresholdTemplate,
  intervals: intervalsTemplate,
  hills: hillsTemplate,
} as const;
