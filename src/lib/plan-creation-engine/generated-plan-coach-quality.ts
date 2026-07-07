import {
  normalizedPlanGoalIntentSchema,
  type NormalizedPlanGoalIntent,
} from "@/lib/plan-creation-engine/plan-goal-intent";
import type {
  RunningPlanBenchmarkPaceTruth,
  RunningPlanDaysPerWeek,
  RunningPlanRunnerLevel,
} from "@/lib/plan-creation-engine/source-types";

export const GENERATED_PLAN_COACH_CONTRACT_VERSION = "generated_plan_feasibility_v1" as const;

export interface GeneratedPlanCoachFeasibilitySummary {
  contractVersion: typeof GENERATED_PLAN_COACH_CONTRACT_VERSION;
  previewOutcome: "feasible_ready" | "aggressive_warning" | "impossible_goal_with_reason";
  warnings: readonly string[];
  impossibleReason: string | null;
}

export interface EvaluateGeneratedPlanCoachFeasibilityInput {
  runnerLevel: RunningPlanRunnerLevel;
  daysPerWeek: RunningPlanDaysPerWeek;
  benchmarkPaceTruth: RunningPlanBenchmarkPaceTruth | null;
  planGoalIntent: NormalizedPlanGoalIntent;
}

export function evaluateGeneratedPlanCoachFeasibility(
  input: EvaluateGeneratedPlanCoachFeasibilityInput,
): GeneratedPlanCoachFeasibilitySummary {
  const horizonWeeks = input.planGoalIntent.feasibility.horizonDays
    ? Math.ceil(input.planGoalIntent.feasibility.horizonDays / 7)
    : null;
  const impossibleReasons = collectImpossibleReasons(input, horizonWeeks);
  const warnings = collectWarnings(input, horizonWeeks);
  const previewOutcome: GeneratedPlanCoachFeasibilitySummary["previewOutcome"] =
    impossibleReasons.length > 0
      ? "impossible_goal_with_reason"
      : warnings.length > 0
        ? "aggressive_warning"
        : "feasible_ready";

  return {
    contractVersion: GENERATED_PLAN_COACH_CONTRACT_VERSION,
    previewOutcome,
    warnings,
    impossibleReason: impossibleReasons[0] ?? null,
  };
}

export function applyGeneratedPlanCoachFeasibilityToGoalIntent(
  intent: NormalizedPlanGoalIntent,
  coachFeasibility: GeneratedPlanCoachFeasibilitySummary,
): NormalizedPlanGoalIntent {
  const status =
    coachFeasibility.previewOutcome === "impossible_goal_with_reason"
      ? "impossible_goal"
      : coachFeasibility.previewOutcome === "aggressive_warning"
        ? "aggressive_or_short_horizon"
        : intent.feasibility.status;

  return normalizedPlanGoalIntentSchema.parse({
    ...intent,
    feasibility: {
      status,
      reasons: uniqueStrings([
        ...intent.feasibility.reasons,
        `Generated-plan feasibility ${GENERATED_PLAN_COACH_CONTRACT_VERSION} evaluated this distance goal before AI authors the dated plan.`,
        ...coachFeasibility.warnings,
        ...(coachFeasibility.impossibleReason ? [coachFeasibility.impossibleReason] : []),
      ]),
      horizonDays: intent.feasibility.horizonDays,
    },
    assumptions: uniqueStrings([
      ...intent.assumptions,
      "Target finish time and outcome pace are goal intent only, not executable workout pace truth.",
      "Backend must keep generated workout pace/HR absent unless benchmark or personal HR truth supports it.",
      ...coachFeasibility.warnings,
    ]),
  });
}

function collectImpossibleReasons(
  input: EvaluateGeneratedPlanCoachFeasibilityInput,
  horizonWeeks: number | null,
) {
  const reasons: string[] = [];
  const intentStatus = input.planGoalIntent.feasibility.status;

  if (intentStatus === "impossible_goal" || intentStatus === "unsupported_for_current_builder") {
    reasons.push(
      input.planGoalIntent.feasibility.reasons.at(0) ??
        "This goal cannot be represented by Hito's current generated-plan contract.",
    );
  }

  const targetPaceSecondsPerKm = input.planGoalIntent.targetOutcomePace?.secondsPerKm ?? null;
  const targetToBenchmarkRatio =
    targetPaceSecondsPerKm != null && input.benchmarkPaceTruth
      ? targetPaceSecondsPerKm / input.benchmarkPaceTruth.paceSecondsPerKm
      : null;
  if (targetToBenchmarkRatio != null && targetToBenchmarkRatio <= 0.8 && (horizonWeeks ?? 0) < 16) {
    reasons.push(
      "The finish time needs more current fitness evidence or a longer runway. Hito can create a conservative build, but not a credible target-time plan from these inputs.",
    );
  }

  return uniqueStrings(reasons);
}

function collectWarnings(
  input: EvaluateGeneratedPlanCoachFeasibilityInput,
  horizonWeeks: number | null,
) {
  const warnings: string[] = [];
  const distanceMeters = input.planGoalIntent.distance?.distanceMeters ?? 10_000;
  const lowSupport = isLowSupport(input);

  if (input.planGoalIntent.feasibility.status === "aggressive_or_short_horizon") {
    warnings.push(...input.planGoalIntent.feasibility.reasons);
  }

  if (horizonWeeks == null) {
    warnings.push(
      "Target-date-specific readiness is unknown; AI must author a conservative dated plan inside the backend horizon.",
    );
  } else if (horizonIsAggressive({ distanceMeters, horizonWeeks, lowSupport })) {
    warnings.push(
      "Goal horizon is aggressive; return a conservative reviewed draft with warning copy, not fake precision.",
    );
  }

  const targetPaceSecondsPerKm = input.planGoalIntent.targetOutcomePace?.secondsPerKm ?? null;
  if (targetPaceSecondsPerKm != null && targetPaceSecondsPerKm < 300 && !input.benchmarkPaceTruth) {
    warnings.push(
      "Target finish time has no benchmark support; keep the generated plan effort-based and conservative.",
    );
  }

  if (
    targetPaceSecondsPerKm != null &&
    distanceMeters > 18_000 &&
    distanceMeters <= 25_000 &&
    targetPaceSecondsPerKm < 330 &&
    !input.benchmarkPaceTruth
  ) {
    warnings.push(
      "Half-distance target-time intent is ambitious without benchmark support; create a reviewed draft with caution assumptions, not fake executable pace.",
    );
  }

  if (distanceMeters >= 42_195 && (lowSupport || input.daysPerWeek <= 3)) {
    warnings.push(
      "Marathon-distance goals with low support need durability-first progression and honest target-time assumptions.",
    );
  }

  return uniqueStrings(warnings);
}

function horizonIsAggressive(input: {
  distanceMeters: number;
  horizonWeeks: number;
  lowSupport: boolean;
}) {
  if (input.distanceMeters <= 12_000) {
    return input.horizonWeeks < (input.lowSupport ? 12 : 8);
  }

  if (input.distanceMeters <= 25_000) {
    return input.horizonWeeks < (input.lowSupport ? 18 : 14);
  }

  if (input.distanceMeters <= 45_000) {
    return input.horizonWeeks < (input.lowSupport ? 28 : 24);
  }

  return input.horizonWeeks < 36;
}

function isLowSupport(input: EvaluateGeneratedPlanCoachFeasibilityInput) {
  return (
    input.runnerLevel === "beginner_new_runner" ||
    input.runnerLevel === "sometimes_runs" ||
    input.daysPerWeek <= 3 ||
    (input.benchmarkPaceTruth === null &&
      Boolean(input.planGoalIntent.targetFinishTime ?? input.planGoalIntent.targetOutcomePace))
  );
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
