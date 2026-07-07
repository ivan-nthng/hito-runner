import {
  isGoalFamilyCadencePlan,
  resolveAuthoringHorizonWeeks,
  resolveGoalFamilyIdentityPolicy,
} from "@/lib/ai-first-plan-blueprint-policy";
import { resolveSupportedIntensityCadence } from "@/lib/structured-plan-authoring-policy";
import type {
  AiFirstPlanEnvelope,
  EnvelopeEmphasisCode,
  EnvelopeFrequencyCode,
  EnvelopeGoalFamilyCode,
  EnvelopeGoalStyleCode,
  EnvelopeLongRunModeCode,
  EnvelopeMetricIntentCode,
  EnvelopePhaseCode,
  EnvelopeSupportCode,
  EnvelopeTerrainCode,
  EnvelopeWeekdayCode,
  StructuredAuthoringInput,
} from "@/lib/ai-first-plan-envelope-schema";

export const envelopeWeekdayCodeToName: Record<EnvelopeWeekdayCode, string> = {
  mo: "Monday",
  tu: "Tuesday",
  we: "Wednesday",
  th: "Thursday",
  fr: "Friday",
  sa: "Saturday",
  su: "Sunday",
};

export const weekdayNameToEnvelopeCode = Object.fromEntries(
  Object.entries(envelopeWeekdayCodeToName).map(([code, name]) => [name, code]),
) as Record<string, EnvelopeWeekdayCode>;

export const envelopeGoalFamilyCodeToLabel: Record<EnvelopeGoalFamilyCode, string> = {
  bc: "Beginner / consistency",
  "5k": "5K",
  "10k": "10K",
  hm: "Half marathon",
  m: "Marathon",
  u: "Ultra",
  mt: "Mountain / trail",
};

export const envelopeGoalStyleCodeToLabel: Record<EnvelopeGoalStyleCode, string> = {
  rel: "Relaxed",
  bal: "Balanced",
  amb: "Ambitious",
  tt: "Target time",
};

export const envelopePhaseCodeToLabel: Record<EnvelopePhaseCode, string> = {
  ba: "Base",
  bu: "Build",
  sp: "Specific",
  ta: "Taper",
};

export const envelopeFrequencyCodeToLabel: Record<EnvelopeFrequencyCode, string> = {
  n: "none",
  w: "weekly",
  e2: "every two weeks",
  e3: "every three weeks",
};

export const envelopeLongRunModeCodeToLabel: Record<EnvelopeLongRunModeCode, string> = {
  aer: "aerobic durability",
  steady_finish: "steady-finish long runs",
  specific: "goal-specific durability",
  tof: "time on feet",
  mountain_tof: "mountain time on feet",
};

export const envelopeEmphasisCodeToLabel: Record<EnvelopeEmphasisCode, string> = {
  easy: "easy aerobic support",
  rec: "recovery protection",
  steady: "steady aerobic support",
  prog: "progression rhythm",
  tempo: "controlled tempo",
  thr: "threshold durability",
  int: "interval rhythm",
  race: "race-rhythm specificity",
  marathon: "marathon steady specificity",
  trail: "technical trail control",
  hill: "hill strength",
  downhill: "controlled downhill durability",
  hike: "hike-run durability",
  tof: "time-on-feet durability",
  cutback: "cutback recovery",
  taper: "taper freshness",
};

export const envelopeMetricIntentCodeToLabel: Record<EnvelopeMetricIntentCode, string> = {
  effort: "effort only",
  default_hr: "default estimated HR if age supports it",
  gated_pace: "pace only when backend gates allow it",
  mixed: "mixed guidance with backend metric gates",
};

export const envelopeTerrainCodeToLabel: Record<EnvelopeTerrainCode, string> = {
  std: "standard",
  roll: "rolling",
  mtn: "mountain",
};

export const envelopeSupportCodeToLabel: Record<EnvelopeSupportCode, string> = {
  none: "none",
  mob: "mobility",
  str_mob: "strength / mobility",
};

export function buildMockAiFirstPlanEnvelope(
  authoringInput: StructuredAuthoringInput,
): AiFirstPlanEnvelope {
  const horizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const goalFamily = resolveEnvelopeGoalFamilyCode(authoringInput);
  const goalStyle = resolveEnvelopeGoalStyleCode(authoringInput);
  const goalPolicy = resolveGoalFamilyIdentityPolicy(authoringInput);
  const cadenceEnabled = isGoalFamilyCadencePlan(authoringInput, goalPolicy);
  const cadenceFrequency = resolveEnvelopeCadenceFrequency(authoringInput, cadenceEnabled);
  const isSpecialty = cadenceEnabled && goalPolicy.cadence.kind === "specialty";

  return {
    schemaVersion: "ai-first-plan-envelope-v1",
    planName: `${authoringInput.goal.goalLabel} Envelope Plan`,
    goal: {
      family: goalFamily,
      style: goalStyle,
    },
    horizonWeeks,
    weeklyRhythm: {
      runDays: authoringInput.availability.maxRunningDaysPerWeek,
      longRunDay: authoringInput.availability.preferredLongRunDay
        ? weekdayNameToEnvelopeCode[authoringInput.availability.preferredLongRunDay]
        : null,
      qualityFrequency: isSpecialty ? "n" : cadenceFrequency,
      specialtyFrequency: isSpecialty ? cadenceFrequency : "n",
      supportBias: resolveEnvelopeSupportBias(authoringInput),
    },
    longRunProgression: {
      mode: resolveEnvelopeLongRunModeCode(authoringInput),
      cutbackEveryWeeks: horizonWeeks >= 5 ? 4 : 0,
      taperWeeks: resolveEnvelopeTaperWeeks(authoringInput, horizonWeeks),
      peakIntent: resolveEnvelopePeakIntent(authoringInput),
    },
    qualityEmphasis: {
      primary: cadenceEnabled ? resolveEnvelopePrimaryEmphasis(authoringInput) : null,
      secondary: resolveEnvelopeSecondaryEmphasis(authoringInput),
    },
    terrainSupport: {
      terrain: resolveEnvelopeTerrainCode(authoringInput),
      support: resolveEnvelopeSupportCode(authoringInput),
      downhillCaution:
        authoringInput.goal.goalType === "mountain_running" ||
        authoringInput.preferences.terrainFocus === "mountain",
    },
    metricGuidance: resolveEnvelopeMetricIntentCode(authoringInput),
    phases: buildEnvelopePhaseBlocks(authoringInput, horizonWeeks),
    reviewAssumptions: [
      "AI authors compact coaching intent only; backend owns dates, rows, workout identities, segments, and metric targets.",
      "No numeric HR or pace truth is accepted from the envelope.",
    ],
  };
}

function resolveEnvelopeCadenceFrequency(
  authoringInput: StructuredAuthoringInput,
  cadenceEnabled: boolean,
): EnvelopeFrequencyCode {
  if (!cadenceEnabled) {
    return "n";
  }

  const supportedCadence = resolveSupportedIntensityCadence(authoringInput);
  const frequency =
    supportedCadence.applies && supportedCadence.frequency !== "none"
      ? supportedCadence.frequency
      : resolveGoalFamilyIdentityPolicy(authoringInput).cadence.frequency;

  return frequency === "weekly" ? "w" : "e2";
}

export function resolveEnvelopeGoalFamilyCode(
  authoringInput: StructuredAuthoringInput,
): EnvelopeGoalFamilyCode {
  switch (authoringInput.goal.goalType) {
    case "5k":
      return "5k";
    case "10k":
      return "10k";
    case "half_marathon":
      return "hm";
    case "marathon":
      return "m";
    case "ultra_marathon":
      return "u";
    case "mountain_running":
      return "mt";
    case "build_consistency":
    default:
      return "bc";
  }
}

export function resolveEnvelopeGoalStyleCode(
  authoringInput: StructuredAuthoringInput,
): EnvelopeGoalStyleCode {
  switch (authoringInput.goal.goalStyle) {
    case "relaxed":
      return "rel";
    case "ambitious":
      return "amb";
    case "target_time":
      return "tt";
    case "balanced":
    default:
      return "bal";
  }
}

export function resolveEnvelopeMetricIntentCode(
  authoringInput: StructuredAuthoringInput,
): EnvelopeMetricIntentCode {
  if (authoringInput.execution.guidancePreference === "effort") {
    return "effort";
  }

  if (
    authoringInput.execution.watchAccess === "watch_or_app" &&
    authoringInput.currentLevel.recent5kPaceSecondsPerKm
  ) {
    return authoringInput.execution.guidancePreference === "mixed" ? "mixed" : "gated_pace";
  }

  return authoringInput.runnerProfile.age ? "default_hr" : "effort";
}

function buildEnvelopePhaseBlocks(
  authoringInput: StructuredAuthoringInput,
  horizonWeeks: number,
): AiFirstPlanEnvelope["phases"] {
  const taperWeeks = resolveEnvelopeTaperWeeks(authoringInput, horizonWeeks);
  const specificEnd = Math.max(1, horizonWeeks - taperWeeks);

  if (horizonWeeks <= 3) {
    return [
      {
        pc: "ba",
        startWeek: 1,
        endWeek: Math.max(1, horizonWeeks - 1),
        intent: "Establish safe rhythm from the validated setup.",
        emphasis: ["easy", "rec"],
      },
      ...(horizonWeeks > 1
        ? [
            {
              pc: "ta" as const,
              startWeek: horizonWeeks,
              endWeek: horizonWeeks,
              intent: "Keep the final week fresh and controlled.",
              emphasis: ["taper", "easy"] as EnvelopeEmphasisCode[],
            },
          ]
        : []),
    ];
  }

  const baseEnd = Math.max(1, Math.floor(horizonWeeks * 0.35));
  const buildEnd = Math.max(baseEnd + 1, Math.floor(horizonWeeks * 0.7));
  const blocks: AiFirstPlanEnvelope["phases"] = [
    {
      pc: "ba",
      startWeek: 1,
      endWeek: baseEnd,
      intent: "Build dependable aerobic rhythm and protect recovery.",
      emphasis: ["easy", "rec", "steady"],
    },
    {
      pc: "bu",
      startWeek: baseEnd + 1,
      endWeek: Math.min(buildEnd, specificEnd),
      intent: "Progress durable running while keeping hard-day density safe.",
      emphasis: ["steady", resolveEnvelopePrimaryEmphasis(authoringInput) ?? "prog", "cutback"],
    },
  ];

  if (buildEnd < specificEnd) {
    blocks.push({
      pc: "sp",
      startWeek: buildEnd + 1,
      endWeek: specificEnd,
      intent: "Make goal-specific work visible without unsupported pace or HR precision.",
      emphasis: [resolveEnvelopePrimaryEmphasis(authoringInput) ?? "steady", "easy", "cutback"],
    });
  }

  if (taperWeeks > 0) {
    blocks.push({
      pc: "ta",
      startWeek: specificEnd + 1,
      endWeek: horizonWeeks,
      intent: "Reduce load and keep the runner fresh.",
      emphasis: ["taper", "easy", "rec"],
    });
  }

  return blocks.filter((block) => block.startWeek <= block.endWeek);
}

function resolveEnvelopePrimaryEmphasis(
  authoringInput: StructuredAuthoringInput,
): EnvelopeEmphasisCode | null {
  switch (authoringInput.goal.goalType) {
    case "5k":
      return "int";
    case "10k":
      return "tempo";
    case "half_marathon":
      return "thr";
    case "marathon":
      return "marathon";
    case "ultra_marathon":
      return "tof";
    case "mountain_running":
      return "hill";
    case "build_consistency":
    default:
      return "prog";
  }
}

function resolveEnvelopeSecondaryEmphasis(
  authoringInput: StructuredAuthoringInput,
): EnvelopeEmphasisCode[] {
  switch (authoringInput.goal.goalType) {
    case "ultra_marathon":
      return ["hike", "trail", "cutback"];
    case "mountain_running":
      return ["trail", "downhill", "tof"];
    case "marathon":
      return ["steady", "cutback", "taper"];
    case "half_marathon":
      return ["tempo", "prog", "cutback"];
    case "5k":
    case "10k":
      return ["prog", "taper", "rec"];
    case "build_consistency":
    default:
      return ["easy", "rec"];
  }
}

function resolveEnvelopeLongRunModeCode(
  authoringInput: StructuredAuthoringInput,
): EnvelopeLongRunModeCode {
  if (authoringInput.goal.goalType === "mountain_running") {
    return "mountain_tof";
  }

  if (authoringInput.goal.goalType === "ultra_marathon") {
    return "tof";
  }

  if (authoringInput.goal.goalType === "marathon") {
    return "specific";
  }

  if (
    authoringInput.goal.goalType === "half_marathon" &&
    authoringInput.goal.goalStyle !== "relaxed"
  ) {
    return "steady_finish";
  }

  return "aer";
}

function resolveEnvelopeTerrainCode(authoringInput: StructuredAuthoringInput): EnvelopeTerrainCode {
  if (
    authoringInput.goal.goalType === "mountain_running" ||
    authoringInput.preferences.terrainFocus === "mountain"
  ) {
    return "mtn";
  }

  return authoringInput.preferences.terrainFocus === "rolling" ? "roll" : "std";
}

function resolveEnvelopeSupportCode(authoringInput: StructuredAuthoringInput): EnvelopeSupportCode {
  if (
    authoringInput.preferences.strengthOrMobilityInterest === "strength" ||
    authoringInput.preferences.strengthOrMobilityInterest === "both"
  ) {
    return "str_mob";
  }

  if (authoringInput.preferences.strengthOrMobilityInterest === "mobility") {
    return "mob";
  }

  return "none";
}

function resolveEnvelopeSupportBias(
  authoringInput: StructuredAuthoringInput,
): AiFirstPlanEnvelope["weeklyRhythm"]["supportBias"] {
  if (
    authoringInput.goal.goalType === "mountain_running" ||
    authoringInput.preferences.terrainFocus === "mountain"
  ) {
    return "terrain";
  }

  if (authoringInput.goal.goalType === "ultra_marathon") {
    return "durability";
  }

  return authoringInput.preferences.preferredWorkoutMix === "easy_heavy" ? "easy" : "steady";
}

function resolveEnvelopeTaperWeeks(authoringInput: StructuredAuthoringInput, horizonWeeks: number) {
  if (horizonWeeks < 4) {
    return horizonWeeks > 1 ? 1 : 0;
  }

  if (
    authoringInput.goal.goalType === "marathon" ||
    authoringInput.goal.goalType === "ultra_marathon"
  ) {
    return Math.min(3, Math.max(1, Math.floor(horizonWeeks * 0.12)));
  }

  return Math.min(2, Math.max(1, Math.floor(horizonWeeks * 0.1)));
}

function resolveEnvelopePeakIntent(authoringInput: StructuredAuthoringInput) {
  switch (authoringInput.goal.goalType) {
    case "marathon":
      return "Peak with marathon-aerobic durability, not fake marathon pace.";
    case "ultra_marathon":
      return "Peak with patient time-on-feet durability and fueling practice.";
    case "mountain_running":
      return "Peak with conservative terrain durability and downhill control.";
    default:
      return "Peak conservatively within backend long-run progression limits.";
  }
}
