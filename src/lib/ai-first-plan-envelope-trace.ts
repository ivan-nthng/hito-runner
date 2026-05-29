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
  envelopeOutputChars: number;
  blueprintFullOutputChars: number | null;
  blueprintBoundedOutputChars: number | null;
  blueprintPromptCharEstimateBefore: number | null;
  blueprintPromptCharEstimateAfter: number | null;
};

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
