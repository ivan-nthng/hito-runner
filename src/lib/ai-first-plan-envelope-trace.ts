import {
  decodeAiFirstPlanEnvelope,
  type DecodedAiFirstPlanEnvelope,
} from "@/lib/ai-first-plan-envelope-decode";
import {
  aiFirstPlanEnvelopeSchema,
  type AiFirstPlanEnvelopeExpansionResult,
  type StructuredAuthoringInput,
} from "@/lib/ai-first-plan-envelope-schema";
import { resolveAuthoringHorizonWeeks } from "@/lib/ai-first-plan-blueprint-policy";
import type { TrainingPlanV2 } from "@/lib/imported-plan";

export type AiFirstPlanEnvelopeSizeComparison = {
  envelopePromptCharEstimate: number | null;
  envelopeSystemPromptChars: number | null;
  envelopeUserPromptChars: number | null;
  envelopeResponseSchemaChars: number | null;
  envelopeOutputChars: number;
  envelopeLiveOutputChars: number | null;
  blueprintFullOutputChars: number | null;
  blueprintBoundedOutputChars: number | null;
  blueprintPromptCharEstimateBefore: number | null;
  blueprintPromptCharEstimateAfter: number | null;
  blueprintComparisonSummary?: {
    productionContract: "ai_first_plan_blueprint_v1";
    productionDefaultChanged: false;
    requestedHorizonWeeks: number;
    boundedOpenAiHorizonWeeks: number | null;
    boundedBlueprintAuthoredWorkoutRows: number;
    fullHorizonBlueprintAuthoredWorkoutRows: number;
  };
};

const longRunIdentities = new Set([
  "long_aerobic_run",
  "long_run_with_steady_finish",
  "cutback_long_run",
  "taper_long_run",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
  "ultra_time_on_feet_durability",
]);

const recoveryAfterLongRunIdentities = new Set(["recovery_jog", "easy_aerobic_run"]);

export function buildAiFirstPlanEnvelopeTrace({
  envelope,
  authoringInput,
  result,
  sizeComparison,
}: {
  envelope: unknown;
  authoringInput: StructuredAuthoringInput;
  result: AiFirstPlanEnvelopeExpansionResult;
  sizeComparison: AiFirstPlanEnvelopeSizeComparison;
}) {
  const parsed = aiFirstPlanEnvelopeSchema.safeParse(envelope);
  const decoded: DecodedAiFirstPlanEnvelope | null = parsed.success
    ? decodeAiFirstPlanEnvelope(parsed.data)
    : null;
  const canonicalPlan = result.ok ? result.canonicalPlan : null;

  return {
    sourceKind: "ai_first_plan_envelope_v1",
    sourceStatus: result.ok ? result.metadata.sourceStatus : "envelope_unavailable",
    fallbackReason: result.ok ? null : result.reason,
    requestSummary: {
      goalType: authoringInput.goal.goalType,
      goalStyle: authoringInput.goal.goalStyle ?? null,
      targetTimePresent: Boolean(authoringInput.goal.targetTime),
      targetDate: authoringInput.schedule.targetDate ?? null,
      requestedHorizonWeeks: resolveAuthoringHorizonWeeks(authoringInput),
      runningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
    },
    sizeComparison,
    decodedEnvelope: decoded
      ? {
          planName: decoded.planName,
          goalFamily: decoded.goalFamily,
          goalStyle: decoded.goalStyle,
          horizonWeeks: decoded.horizonWeeks,
          weeklyRhythm: decoded.weeklyRhythm,
          longRunProgression: decoded.longRunProgression,
          qualityEmphasis: decoded.qualityEmphasis,
          terrainSupport: decoded.terrainSupport,
          metricGuidance: decoded.metricGuidance,
          phases: decoded.phases.map((phase) => ({
            phase: phase.phase,
            weeks: `${phase.startWeek}-${phase.endWeek}`,
            intent: boundedTraceText(phase.intent),
            emphasis: phase.emphasis,
          })),
          reviewAssumptions: decoded.reviewAssumptions.map(boundedTraceText),
        }
      : null,
    validation: result.ok
      ? {
          issueCodes: [],
          issueSummary: [],
          repairs: result.metadata.repairs.map(boundedTraceText),
          specificityTrace: {
            ...result.metadata.specificityTrace,
            fulfilledIdentities: result.metadata.specificityTrace.fulfilledIdentities.slice(0, 16),
            safetyDowngrades: result.metadata.specificityTrace.safetyDowngrades
              .map((downgrade) => ({
                ...downgrade,
                message: boundedTraceText(downgrade.message),
              }))
              .slice(0, 16),
          },
        }
      : {
          issueCodes: result.issues.map((issue) => issue.code),
          issueSummary: result.issues
            .map((issue) => `${issue.code}: ${issue.message}`)
            .map(boundedTraceText),
          repairs: [],
        },
    expandedPlan: canonicalPlan
      ? {
          planName: canonicalPlan.plan_name,
          sourceKind: canonicalPlan.source_kind ?? null,
          weekCount: countWeeks(canonicalPlan),
          rowCount: canonicalPlan.planned_workouts.length,
          nonRestCount: canonicalPlan.planned_workouts.filter(
            (workout) => workout.workout_family !== "rest" && workout.workout_type !== "rest",
          ).length,
          firstSixWeeks: groupCanonicalIdentityTraceByWeek(canonicalPlan).slice(0, 6),
          identityCounts: countCanonicalWorkoutField(canonicalPlan, "workout_identity"),
          familyCounts: countCanonicalWorkoutField(canonicalPlan, "workout_family"),
          iconCounts: countCanonicalWorkoutField(canonicalPlan, "calendar_icon_key"),
          richRowCompleteness: summarizeRichRowCompleteness(canonicalPlan),
          safetyProofs: {
            fixedRestDay: summarizeFixedRestDayProof(canonicalPlan, authoringInput),
            preferredLongRunDay: summarizePreferredLongRunDayProof(canonicalPlan, authoringInput),
            recoveryFirstAfterLongRun: summarizeRecoveryFirstAfterLongRunProof(canonicalPlan),
            metricGates: summarizeMetricGateProof(canonicalPlan),
          },
        }
      : null,
    safetyMetadata: {
      persisted: false,
      rawPromptPrinted: false,
      rawAiPayloadPrinted: false,
      productionBlueprintPathChanged: false,
    },
  };
}

function summarizeFixedRestDayProof(
  plan: TrainingPlanV2,
  authoringInput: StructuredAuthoringInput,
) {
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const violations = plan.planned_workouts
    .filter((workout) => isNonRestWorkout(workout) && fixedRestDays.has(workout.weekday))
    .map((workout) => ({
      date: workout.date,
      weekday: workout.weekday,
      identity: workout.workout_identity ?? null,
    }));

  return {
    fixedRestDays: [...fixedRestDays],
    violationCount: violations.length,
    sampleViolations: violations.slice(0, 8),
  };
}

function summarizePreferredLongRunDayProof(
  plan: TrainingPlanV2,
  authoringInput: StructuredAuthoringInput,
) {
  const preferredLongRunDay = authoringInput.availability.preferredLongRunDay ?? null;
  const longRuns = plan.planned_workouts.filter(isLongRunWorkout);
  const violations = preferredLongRunDay
    ? longRuns
        .filter((workout) => workout.weekday !== preferredLongRunDay)
        .map((workout) => ({
          date: workout.date,
          weekday: workout.weekday,
          identity: workout.workout_identity ?? null,
        }))
    : [];

  return {
    preferredLongRunDay,
    longRunCount: longRuns.length,
    longRunWeekdayCounts: longRuns.reduce<Record<string, number>>((counts, workout) => {
      counts[workout.weekday] = (counts[workout.weekday] ?? 0) + 1;
      return counts;
    }, {}),
    violationCount: violations.length,
    sampleViolations: violations.slice(0, 8),
  };
}

function summarizeRecoveryFirstAfterLongRunProof(plan: TrainingPlanV2) {
  const nonRest = plan.planned_workouts
    .filter(isNonRestWorkout)
    .sort((left, right) => left.date.localeCompare(right.date));
  const transitions = nonRest.flatMap((workout, index) => {
    if (!isLongRunWorkout(workout)) {
      return [];
    }

    const next = nonRest[index + 1];

    if (!next) {
      return [];
    }

    return [
      {
        longRunDate: workout.date,
        longRunIdentity: workout.workout_identity ?? null,
        nextDate: next.date,
        nextWeekday: next.weekday,
        nextIdentity: next.workout_identity ?? null,
        safeRecoveryFirst: recoveryAfterLongRunIdentities.has(next.workout_identity ?? ""),
      },
    ];
  });

  return {
    checkedTransitionCount: transitions.length,
    violationCount: transitions.filter((transition) => !transition.safeRecoveryFirst).length,
    sampleTransitions: transitions.slice(0, 10),
  };
}

function summarizeMetricGateProof(plan: TrainingPlanV2) {
  let segmentsWithPaceTargets = 0;
  let segmentsWithHrTargets = 0;
  let paceTargetGateViolations = 0;
  let personalHrWithoutZoneTruthSegments = 0;
  let defaultEstimatedHrSegments = 0;

  for (const workout of plan.planned_workouts) {
    for (const segment of workout.segments) {
      const target = segment.target;
      const hasPace = Boolean(
        target?.pace_min_per_km_range || target?.pace_range_min_km || target?.pace,
      );
      const hasHr = Boolean(target?.hr_bpm_range || target?.hr_bpm);

      if (hasPace) {
        segmentsWithPaceTargets += 1;

        if (workout.metric_mode?.pace_targets_allowed !== true) {
          paceTargetGateViolations += 1;
        }
      }

      if (hasHr) {
        segmentsWithHrTargets += 1;

        if (target?.hr_target_source === "default_estimated_hr") {
          defaultEstimatedHrSegments += 1;
        }

        if (
          target?.hr_target_source === "personal_hr_zone" ||
          workout.metric_mode?.hr_target_source === "personal_hr_zone"
        ) {
          personalHrWithoutZoneTruthSegments += 1;
        }
      }
    }
  }

  return {
    segmentsWithPaceTargets,
    segmentsWithHrTargets,
    paceTargetGateViolations,
    personalHrWithoutZoneTruthSegments,
    defaultEstimatedHrSegments,
  };
}

function isNonRestWorkout(workout: TrainingPlanV2["planned_workouts"][number]) {
  return workout.workout_family !== "rest" && workout.workout_type !== "rest";
}

function isLongRunWorkout(workout: TrainingPlanV2["planned_workouts"][number]) {
  return (
    longRunIdentities.has(workout.workout_identity ?? "") ||
    workout.workout_family === "long" ||
    workout.workout_type === "long_run"
  );
}

function groupCanonicalIdentityTraceByWeek(plan: TrainingPlanV2) {
  const byWeek = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of plan.planned_workouts) {
    byWeek.set(workout.week_number, [...(byWeek.get(workout.week_number) ?? []), workout]);
  }

  return [...byWeek.entries()]
    .sort(([left], [right]) => left - right)
    .map(([weekNumber, workouts]) => ({
      weekNumber,
      identities: workouts.map((workout) => workout.workout_identity ?? "unknown").slice(0, 7),
      families: workouts.map((workout) => workout.workout_family ?? "unknown").slice(0, 7),
      icons: workouts.map((workout) => workout.calendar_icon_key ?? "unknown").slice(0, 7),
    }));
}

function countCanonicalWorkoutField(
  plan: TrainingPlanV2,
  field: "workout_identity" | "workout_family" | "calendar_icon_key",
) {
  return plan.planned_workouts.reduce<Record<string, number>>((counts, workout) => {
    const value = workout[field] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function countWeeks(plan: TrainingPlanV2) {
  return new Set(plan.planned_workouts.map((workout) => workout.week_number)).size;
}

function summarizeRichRowCompleteness(plan: TrainingPlanV2) {
  const nonRest = plan.planned_workouts.filter(
    (workout) => workout.workout_family !== "rest" && workout.workout_type !== "rest",
  );
  const richRows = nonRest.filter(
    (workout) =>
      workout.workout_family &&
      workout.workout_identity &&
      workout.calendar_icon_key &&
      workout.goal_context &&
      workout.metric_mode &&
      workout.segments.length > 0,
  );

  return {
    nonRestRows: nonRest.length,
    completeRichRows: richRows.length,
    missingRichRows: nonRest.length - richRows.length,
  };
}

function boundedTraceText(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}
