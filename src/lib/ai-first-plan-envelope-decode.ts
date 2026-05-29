import {
  isGoalFamilyCadencePlan,
  resolveAuthoringHorizonWeeks,
  resolveGoalFamilyIdentityPolicy,
} from "@/lib/ai-first-plan-blueprint-policy";
import {
  aiFirstPlanEnvelopeSchema,
  type AiFirstPlanEnvelope,
  type AiFirstPlanEnvelopeIssue,
  type StructuredAuthoringInput,
} from "@/lib/ai-first-plan-envelope-schema";
import {
  envelopeEmphasisCodeToLabel,
  envelopeFrequencyCodeToLabel,
  envelopeGoalFamilyCodeToLabel,
  envelopeGoalStyleCodeToLabel,
  envelopeLongRunModeCodeToLabel,
  envelopeMetricIntentCodeToLabel,
  envelopePhaseCodeToLabel,
  envelopeSupportCodeToLabel,
  envelopeTerrainCodeToLabel,
  envelopeWeekdayCodeToName,
  resolveEnvelopeGoalFamilyCode,
  resolveEnvelopeGoalStyleCode,
} from "@/lib/ai-first-plan-envelope-policy";

export type DecodedAiFirstPlanEnvelope = {
  planName: string;
  goalFamily: string;
  goalStyle: string;
  horizonWeeks: number;
  weeklyRhythm: {
    runDays: number;
    longRunDay: string | null;
    qualityFrequency: string;
    specialtyFrequency: string;
    supportBias: string;
  };
  longRunProgression: {
    mode: string;
    cutbackEveryWeeks: number;
    taperWeeks: number;
    peakIntent: string;
  };
  qualityEmphasis: {
    primary: string | null;
    secondary: string[];
  };
  terrainSupport: {
    terrain: string;
    support: string;
    downhillCaution: boolean;
  };
  metricGuidance: string;
  phases: Array<{
    phase: string;
    startWeek: number;
    endWeek: number;
    intent: string;
    emphasis: string[];
  }>;
  reviewAssumptions: string[];
};

export type AiFirstPlanEnvelopeDecodeResult =
  | {
      ok: true;
      envelope: AiFirstPlanEnvelope;
      decoded: DecodedAiFirstPlanEnvelope;
      issues: [];
    }
  | {
      ok: false;
      issues: AiFirstPlanEnvelopeIssue[];
      envelope?: AiFirstPlanEnvelope;
      decoded?: DecodedAiFirstPlanEnvelope;
    };

export function decodeAndValidateAiFirstPlanEnvelope({
  envelope,
  authoringInput,
}: {
  envelope: unknown;
  authoringInput: StructuredAuthoringInput;
}): AiFirstPlanEnvelopeDecodeResult {
  const parsed = aiFirstPlanEnvelopeSchema.safeParse(envelope);

  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.slice(0, 16).map((issue) => ({
        code: "envelope_schema_invalid",
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    };
  }

  const decoded = decodeAiFirstPlanEnvelope(parsed.data);
  const issues = validateAiFirstPlanEnvelope(parsed.data, authoringInput);

  if (issues.length > 0) {
    return {
      ok: false,
      envelope: parsed.data,
      decoded,
      issues,
    };
  }

  return {
    ok: true,
    envelope: parsed.data,
    decoded,
    issues: [],
  };
}

export function decodeAiFirstPlanEnvelope(
  envelope: AiFirstPlanEnvelope,
): DecodedAiFirstPlanEnvelope {
  return {
    planName: envelope.planName,
    goalFamily: envelopeGoalFamilyCodeToLabel[envelope.goal.family],
    goalStyle: envelopeGoalStyleCodeToLabel[envelope.goal.style],
    horizonWeeks: envelope.horizonWeeks,
    weeklyRhythm: {
      runDays: envelope.weeklyRhythm.runDays,
      longRunDay: envelope.weeklyRhythm.longRunDay
        ? envelopeWeekdayCodeToName[envelope.weeklyRhythm.longRunDay]
        : null,
      qualityFrequency: envelopeFrequencyCodeToLabel[envelope.weeklyRhythm.qualityFrequency],
      specialtyFrequency: envelopeFrequencyCodeToLabel[envelope.weeklyRhythm.specialtyFrequency],
      supportBias: envelope.weeklyRhythm.supportBias,
    },
    longRunProgression: {
      mode: envelopeLongRunModeCodeToLabel[envelope.longRunProgression.mode],
      cutbackEveryWeeks: envelope.longRunProgression.cutbackEveryWeeks,
      taperWeeks: envelope.longRunProgression.taperWeeks,
      peakIntent: envelope.longRunProgression.peakIntent,
    },
    qualityEmphasis: {
      primary: envelope.qualityEmphasis.primary
        ? envelopeEmphasisCodeToLabel[envelope.qualityEmphasis.primary]
        : null,
      secondary: envelope.qualityEmphasis.secondary.map(
        (emphasis) => envelopeEmphasisCodeToLabel[emphasis],
      ),
    },
    terrainSupport: {
      terrain: envelopeTerrainCodeToLabel[envelope.terrainSupport.terrain],
      support: envelopeSupportCodeToLabel[envelope.terrainSupport.support],
      downhillCaution: envelope.terrainSupport.downhillCaution,
    },
    metricGuidance: envelopeMetricIntentCodeToLabel[envelope.metricGuidance],
    phases: envelope.phases.map((phase) => ({
      phase: envelopePhaseCodeToLabel[phase.pc],
      startWeek: phase.startWeek,
      endWeek: phase.endWeek,
      intent: phase.intent,
      emphasis: phase.emphasis.map((emphasis) => envelopeEmphasisCodeToLabel[emphasis]),
    })),
    reviewAssumptions: envelope.reviewAssumptions,
  };
}

function validateAiFirstPlanEnvelope(
  envelope: AiFirstPlanEnvelope,
  authoringInput: StructuredAuthoringInput,
) {
  const issues: AiFirstPlanEnvelopeIssue[] = [];
  const horizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const expectedGoalFamily = resolveEnvelopeGoalFamilyCode(authoringInput);
  const expectedGoalStyle = resolveEnvelopeGoalStyleCode(authoringInput);
  const goalPolicy = resolveGoalFamilyIdentityPolicy(authoringInput);
  const cadenceEnabled = isGoalFamilyCadencePlan(authoringInput, goalPolicy);
  const preferredLongRunDay = authoringInput.availability.preferredLongRunDay ?? null;

  if (envelope.horizonWeeks !== horizonWeeks) {
    issues.push({
      code: "envelope_horizon_mismatch",
      path: "horizonWeeks",
      message: `Envelope horizon ${envelope.horizonWeeks} must match validated horizon ${horizonWeeks}.`,
    });
  }

  if (envelope.goal.family !== expectedGoalFamily) {
    issues.push({
      code: "envelope_goal_family_mismatch",
      path: "goal.family",
      message: "Envelope goal family must match validated runner setup.",
    });
  }

  if (envelope.goal.style !== expectedGoalStyle) {
    issues.push({
      code: "envelope_goal_style_mismatch",
      path: "goal.style",
      message: "Envelope goal style must match validated runner setup.",
    });
  }

  if (envelope.weeklyRhythm.runDays !== authoringInput.availability.maxRunningDaysPerWeek) {
    issues.push({
      code: "envelope_running_days_mismatch",
      path: "weeklyRhythm.runDays",
      message: "Envelope weekly running-day count must match validated setup.",
    });
  }

  if (preferredLongRunDay) {
    const envelopeLongRunDay = envelope.weeklyRhythm.longRunDay
      ? envelopeWeekdayCodeToName[envelope.weeklyRhythm.longRunDay]
      : null;

    if (envelopeLongRunDay !== preferredLongRunDay) {
      issues.push({
        code: "envelope_long_run_day_mismatch",
        path: "weeklyRhythm.longRunDay",
        message: `Envelope long-run day must preserve ${preferredLongRunDay}.`,
      });
    }
  }

  if (
    envelope.weeklyRhythm.longRunDay &&
    authoringInput.availability.unavailableDays.includes(
      envelopeWeekdayCodeToName[envelope.weeklyRhythm.longRunDay],
    )
  ) {
    issues.push({
      code: "envelope_long_run_on_fixed_rest_day",
      path: "weeklyRhythm.longRunDay",
      message: "Envelope long-run day cannot be a fixed rest day.",
    });
  }

  if (!cadenceEnabled && envelope.weeklyRhythm.qualityFrequency !== "n") {
    issues.push({
      code: "envelope_unsafe_quality_frequency",
      path: "weeklyRhythm.qualityFrequency",
      message: "Runner support level does not allow required quality cadence.",
    });
  }

  if (!cadenceEnabled && envelope.weeklyRhythm.specialtyFrequency !== "n") {
    issues.push({
      code: "envelope_unsafe_specialty_frequency",
      path: "weeklyRhythm.specialtyFrequency",
      message: "Runner support level does not allow required specialty cadence.",
    });
  }

  if (
    envelope.weeklyRhythm.qualityFrequency === "w" &&
    envelope.weeklyRhythm.specialtyFrequency === "w"
  ) {
    issues.push({
      code: "envelope_unsafe_combined_cadence",
      path: "weeklyRhythm",
      message: "Envelope cannot require weekly quality and weekly specialty at the same time.",
    });
  }

  if (envelope.goal.family === "bc" && envelope.goal.style === "tt") {
    issues.push({
      code: "envelope_unsupported_goal_style",
      path: "goal.style",
      message: "Build-consistency envelopes cannot use target-time style.",
    });
  }

  validatePhaseCoverage(envelope, horizonWeeks, issues);

  return issues.slice(0, 24);
}

function validatePhaseCoverage(
  envelope: AiFirstPlanEnvelope,
  horizonWeeks: number,
  issues: AiFirstPlanEnvelopeIssue[],
) {
  const coveredWeeks = new Set<number>();

  if (envelope.phases.length === 0) {
    issues.push({
      code: "envelope_missing_phases",
      path: "phases",
      message: "Envelope must include phase blocks.",
    });
    return;
  }

  for (const phase of envelope.phases) {
    if (phase.endWeek < phase.startWeek) {
      issues.push({
        code: "envelope_phase_range_invalid",
        path: `phases.${phase.pc}`,
        message: "Envelope phase endWeek must be greater than or equal to startWeek.",
      });
      continue;
    }

    for (let week = phase.startWeek; week <= phase.endWeek; week += 1) {
      if (coveredWeeks.has(week)) {
        issues.push({
          code: "envelope_phase_overlap",
          path: `phases.${phase.pc}`,
          message: `Week ${week} appears in more than one envelope phase.`,
        });
      }

      coveredWeeks.add(week);
    }
  }

  const missingWeeks = Array.from({ length: horizonWeeks }, (_value, index) => index + 1).filter(
    (week) => !coveredWeeks.has(week),
  );

  if (missingWeeks.length > 0) {
    issues.push({
      code: "envelope_phase_gap",
      path: "phases",
      message: `Envelope phase blocks must cover every week; missing ${missingWeeks
        .slice(0, 12)
        .join(", ")}.`,
    });
  }
}
