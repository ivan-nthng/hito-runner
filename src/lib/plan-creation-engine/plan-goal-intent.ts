import { z } from "zod";
import {
  isRealIsoDate,
  parseDurationSeconds,
  parsePaceSecondsPerKm,
} from "@/lib/first-plan-authoring-utils";
import type { RunningPlanDistanceFamily } from "@/lib/plan-creation-engine/source-types";
import { diffDaysIso } from "@/lib/training";

export const PLAN_GOAL_INTENT_CONTRACT_VERSION = "plan_goal_intent_v1" as const;

export const PLAN_GOAL_INTENT_PRESET_DISTANCE_VALUES = [
  "10K",
  "Half Marathon",
  "Marathon",
] as const;

export type PlanGoalIntentPresetDistance = (typeof PLAN_GOAL_INTENT_PRESET_DISTANCE_VALUES)[number];

export const planGoalIntentDistanceInputSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("preset"),
      preset: z.enum(PLAN_GOAL_INTENT_PRESET_DISTANCE_VALUES),
    })
    .strict(),
  z
    .object({
      kind: z.literal("custom"),
      distanceKm: z.number().finite().positive().max(500),
      label: z.string().trim().min(1).max(80).optional().nullable(),
    })
    .strict(),
]);

export const planGoalIntentInputSchema = z
  .object({
    distance: planGoalIntentDistanceInputSchema.optional().nullable(),
    targetFinishTime: z.string().trim().min(1).max(32).optional().nullable(),
    targetOutcomePace: z.string().trim().min(1).max(32).optional().nullable(),
    targetDate: z.string().trim().optional().nullable(),
  })
  .strict();

export type PlanGoalIntentInput = z.output<typeof planGoalIntentInputSchema>;

export type PlanGoalIntentOutcomePaceSource =
  | "derived_from_finish_time"
  | "runner_entered_outcome_pace";

export type PlanGoalIntentFeasibilityStatus =
  | "supported"
  | "supported_with_assumptions"
  | "aggressive_or_short_horizon"
  | "impossible_goal"
  | "unsupported_for_current_builder";

export const normalizedPlanGoalIntentSchema = z
  .object({
    contractVersion: z.literal(PLAN_GOAL_INTENT_CONTRACT_VERSION),
    normalizedBy: z.literal("backend_plan_goal_intent_normalizer_v1"),
    distance: z
      .object({
        kind: z.enum(["preset", "custom"]),
        label: z.string().trim().min(1),
        distanceKm: z.number().positive(),
        distanceMeters: z.number().int().positive(),
        preset: z.enum(PLAN_GOAL_INTENT_PRESET_DISTANCE_VALUES).nullable(),
        source: z.enum(["selected_distance_family", "runner_selected_preset", "runner_custom"]),
      })
      .strict()
      .nullable(),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    targetFinishTime: z
      .object({
        seconds: z.number().int().positive(),
        label: z.string().trim().min(1),
      })
      .strict()
      .nullable(),
    targetOutcomePace: z
      .object({
        secondsPerKm: z.number().int().positive(),
        label: z.string().trim().min(1),
        source: z.enum(["derived_from_finish_time", "runner_entered_outcome_pace"]),
      })
      .strict()
      .nullable(),
    derivedOutcomePace: z
      .object({
        secondsPerKm: z.number().int().positive(),
        label: z.string().trim().min(1),
        source: z.literal("derived_from_finish_time"),
      })
      .strict()
      .nullable(),
    supplied: z
      .object({
        distance: z.boolean(),
        targetDate: z.boolean(),
        targetFinishTime: z.boolean(),
        targetOutcomePace: z.boolean(),
      })
      .strict(),
    omitted: z.array(z.enum(["distance", "targetDate", "targetFinishTime", "targetOutcomePace"])),
    feasibility: z
      .object({
        status: z.enum([
          "supported",
          "supported_with_assumptions",
          "aggressive_or_short_horizon",
          "impossible_goal",
          "unsupported_for_current_builder",
        ]),
        reasons: z.array(z.string().trim().min(1)),
        horizonDays: z.number().int().nullable(),
      })
      .strict(),
    assumptions: z.array(z.string().trim().min(1)),
    metricTruthPolicy: z
      .object({
        outcomePaceIsExecutableWorkoutTarget: z.literal(false),
        segmentPaceTargetsAllowedFromGoal: z.literal(false),
        hrTargetsAllowedFromGoal: z.literal(false),
      })
      .strict(),
  })
  .strict();

export type NormalizedPlanGoalIntent = z.output<typeof normalizedPlanGoalIntentSchema>;

export type NormalizePlanGoalIntentResult =
  | { ok: true; intent: NormalizedPlanGoalIntent }
  | { ok: false; reason: "invalid_plan_goal_intent"; message: string };

export function normalizePlanGoalIntent(input: {
  rawIntent?: PlanGoalIntentInput | null | undefined;
  distanceFamily?: RunningPlanDistanceFamily | null;
  startDate?: string | null;
  horizonWeeks?: number | null;
}): NormalizePlanGoalIntentResult {
  const parsed = planGoalIntentInputSchema.safeParse(input.rawIntent ?? {});

  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_plan_goal_intent",
      message: parsed.error.issues.at(0)?.message ?? "Invalid plan goal intent.",
    };
  }

  const raw = parsed.data;
  const distance = normalizeDistance(raw.distance ?? null, input.distanceFamily ?? null);
  const targetDate = normalizeOptionalDate(raw.targetDate ?? null);

  if (targetDate && !targetDate.ok) {
    return targetDate;
  }

  const targetFinishTime = normalizeTargetFinishTime(raw.targetFinishTime ?? null);
  if (targetFinishTime && !targetFinishTime.ok) {
    return targetFinishTime;
  }

  const runnerOutcomePace = normalizeRunnerOutcomePace(raw.targetOutcomePace ?? null);
  if (runnerOutcomePace && !runnerOutcomePace.ok) {
    return runnerOutcomePace;
  }

  const derivedOutcomePace =
    targetFinishTime?.value && distance
      ? {
          secondsPerKm: Math.round(targetFinishTime.value.seconds / distance.distanceKm),
          label: formatPaceSecondsPerKm(
            Math.round(targetFinishTime.value.seconds / distance.distanceKm),
          ),
          source: "derived_from_finish_time" as const,
        }
      : null;
  const targetOutcomePace = runnerOutcomePace?.value ?? derivedOutcomePace;
  const horizonDays = resolveHorizonDays({
    startDate: input.startDate ?? null,
    targetDate: targetDate?.value ?? null,
    horizonWeeks: input.horizonWeeks ?? null,
  });
  const supplied = {
    distance: Boolean(raw.distance),
    targetDate: Boolean(targetDate?.value),
    targetFinishTime: Boolean(targetFinishTime?.value),
    targetOutcomePace: Boolean(runnerOutcomePace?.value),
  };
  const omitted = (
    ["distance", "targetDate", "targetFinishTime", "targetOutcomePace"] as const
  ).filter((field) => !supplied[field]);
  const feasibility = resolveFeasibility({
    distance,
    distanceFamily: input.distanceFamily ?? null,
    horizonDays,
    supplied,
    targetOutcomePace,
  });
  const assumptions = buildPlanGoalIntentAssumptions({
    feasibilityReasons: feasibility.reasons,
    targetOutcomePace,
  });

  return {
    ok: true,
    intent: normalizedPlanGoalIntentSchema.parse({
      contractVersion: PLAN_GOAL_INTENT_CONTRACT_VERSION,
      normalizedBy: "backend_plan_goal_intent_normalizer_v1",
      distance,
      targetDate: targetDate?.value ?? null,
      targetFinishTime: targetFinishTime?.value ?? null,
      targetOutcomePace,
      derivedOutcomePace,
      supplied,
      omitted,
      feasibility,
      assumptions,
      metricTruthPolicy: {
        outcomePaceIsExecutableWorkoutTarget: false,
        segmentPaceTargetsAllowedFromGoal: false,
        hrTargetsAllowedFromGoal: false,
      },
    }),
  };
}

export function buildStructuredPlanGoalIntentInput(input: {
  goal: {
    goalType: string;
    targetTime?: string | null;
  };
  schedule: {
    targetDate?: string | null;
  };
}): PlanGoalIntentInput {
  return {
    distance: distanceInputForStructuredGoalType(input.goal.goalType),
    targetFinishTime: input.goal.targetTime ?? null,
    targetDate: input.schedule.targetDate ?? null,
  };
}

export function distanceFamilyForStructuredGoalType(
  goalType: string,
): RunningPlanDistanceFamily | null {
  switch (goalType) {
    case "10k":
      return "10K";
    case "half_marathon":
      return "Half Marathon";
    case "marathon":
      return "Marathon Completion";
    default:
      return null;
  }
}

function distanceInputForStructuredGoalType(goalType: string): PlanGoalIntentInput["distance"] {
  switch (goalType) {
    case "5k":
      return { kind: "custom", distanceKm: 5, label: "5K" };
    case "10k":
      return { kind: "preset", preset: "10K" };
    case "half_marathon":
      return { kind: "preset", preset: "Half Marathon" };
    case "marathon":
      return { kind: "preset", preset: "Marathon" };
    default:
      return null;
  }
}

function normalizeDistance(
  distanceInput: PlanGoalIntentInput["distance"] | null,
  distanceFamily: RunningPlanDistanceFamily | null,
): NormalizedPlanGoalIntent["distance"] {
  if (distanceInput?.kind === "preset") {
    const distance = presetDistance(distanceInput.preset);

    return {
      kind: "preset",
      label: distanceInput.preset,
      distanceKm: distance.km,
      distanceMeters: distance.meters,
      preset: distanceInput.preset,
      source: "runner_selected_preset",
    };
  }

  if (distanceInput?.kind === "custom") {
    const distanceKm = roundDistanceKm(distanceInput.distanceKm);

    return {
      kind: "custom",
      label: distanceInput.label?.trim() || `${distanceKm} km`,
      distanceKm,
      distanceMeters: Math.round(distanceKm * 1000),
      preset: null,
      source: "runner_custom",
    };
  }

  if (!distanceFamily) {
    return null;
  }

  const preset = presetDistanceForFamily(distanceFamily);
  const distance = presetDistance(preset);

  return {
    kind: "preset",
    label: preset,
    distanceKm: distance.km,
    distanceMeters: distance.meters,
    preset,
    source: "selected_distance_family",
  };
}

function normalizeOptionalDate(
  value: string | null,
): { ok: true; value: string | null } | Extract<NormalizePlanGoalIntentResult, { ok: false }> {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return { ok: true, value: null };
  }

  if (!isRealIsoDate(trimmed)) {
    return {
      ok: false,
      reason: "invalid_plan_goal_intent",
      message: "Target date must be a real YYYY-MM-DD date.",
    };
  }

  return { ok: true, value: trimmed };
}

function normalizeTargetFinishTime(
  value: string | null,
):
  | { ok: true; value: NonNullable<NormalizedPlanGoalIntent["targetFinishTime"]> | null }
  | Extract<NormalizePlanGoalIntentResult, { ok: false }> {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return { ok: true, value: null };
  }

  const seconds = parseDurationSeconds(trimmed);

  if (seconds == null || seconds < 5 * 60 || seconds > 48 * 60 * 60) {
    return {
      ok: false,
      reason: "invalid_plan_goal_intent",
      message: "Target finish time must be between 5:00 and 48:00:00.",
    };
  }

  return {
    ok: true,
    value: {
      seconds,
      label: formatDurationSeconds(seconds),
    },
  };
}

function normalizeRunnerOutcomePace(
  value: string | null,
):
  | { ok: true; value: NonNullable<NormalizedPlanGoalIntent["targetOutcomePace"]> | null }
  | Extract<NormalizePlanGoalIntentResult, { ok: false }> {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return { ok: true, value: null };
  }

  const secondsPerKm = parsePaceSecondsPerKm(trimmed);

  if (secondsPerKm == null || secondsPerKm < 2 * 60 || secondsPerKm > 25 * 60) {
    return {
      ok: false,
      reason: "invalid_plan_goal_intent",
      message: "Target outcome pace must be between 2:00/km and 25:00/km.",
    };
  }

  return {
    ok: true,
    value: {
      secondsPerKm,
      label: formatPaceSecondsPerKm(secondsPerKm),
      source: "runner_entered_outcome_pace",
    },
  };
}

function resolveHorizonDays(input: {
  startDate: string | null;
  targetDate: string | null;
  horizonWeeks: number | null;
}) {
  if (input.startDate && input.targetDate) {
    return diffDaysIso(input.targetDate, input.startDate) + 1;
  }

  if (typeof input.horizonWeeks === "number" && Number.isFinite(input.horizonWeeks)) {
    return Math.max(1, Math.round(input.horizonWeeks * 7));
  }

  return null;
}

function resolveFeasibility(input: {
  distance: NormalizedPlanGoalIntent["distance"];
  distanceFamily: RunningPlanDistanceFamily | null;
  horizonDays: number | null;
  supplied: NormalizedPlanGoalIntent["supplied"];
  targetOutcomePace: NormalizedPlanGoalIntent["targetOutcomePace"];
}): NormalizedPlanGoalIntent["feasibility"] {
  const reasons: string[] = [];
  let status: PlanGoalIntentFeasibilityStatus = "supported";

  if (input.distance?.kind === "custom" && input.distanceFamily) {
    status = maxFeasibility(status, "supported_with_assumptions");
    reasons.push(
      "Custom distance is supported by the unified AI-authored generated-plan path; the selected distance family is routing context only.",
    );
  }

  if (input.horizonDays != null && input.horizonDays <= 0) {
    status = "impossible_goal";
    reasons.push("Target date must be after the plan start date.");
  }

  if (
    status !== "impossible_goal" &&
    input.horizonDays != null &&
    input.distance?.distanceMeters != null &&
    input.distance.distanceMeters >= 42_195 &&
    input.horizonDays < 14
  ) {
    status = "impossible_goal";
    reasons.push("A marathon in less than two weeks is not enough time to prepare safely.");
  }

  if (input.horizonDays != null && input.horizonDays < 28) {
    status = maxFeasibility(status, "aggressive_or_short_horizon");
    reasons.push("Target date creates a short horizon; backend keeps plan load conservative.");
  }

  if (input.targetOutcomePace && input.targetOutcomePace.secondsPerKm < 180) {
    status = maxFeasibility(status, "aggressive_or_short_horizon");
    reasons.push(
      "Target outcome pace is very aggressive and not promiseable; it is stored as intent, not executable workout pace.",
    );
  }

  if (reasons.length === 0) {
    reasons.push("Goal intent is representable by the current backend plan-intent contract.");
  }

  return {
    status,
    reasons,
    horizonDays: input.horizonDays,
  };
}

function buildPlanGoalIntentAssumptions(input: {
  feasibilityReasons: readonly string[];
  targetOutcomePace: NormalizedPlanGoalIntent["targetOutcomePace"];
}) {
  const assumptions = [
    "Plan goal intent is review/readback context and does not create executable workout pace or HR targets.",
    ...input.feasibilityReasons,
  ];

  if (input.targetOutcomePace) {
    assumptions.push(
      "Outcome pace may summarize the desired result, but workout segment pace still requires benchmark-backed or user-entered target truth.",
    );
  }

  return Array.from(new Set(assumptions));
}

function presetDistanceForFamily(family: RunningPlanDistanceFamily): PlanGoalIntentPresetDistance {
  switch (family) {
    case "10K":
      return "10K";
    case "Half Marathon":
      return "Half Marathon";
    case "Marathon Completion":
      return "Marathon";
  }
}

function presetDistance(preset: PlanGoalIntentPresetDistance) {
  switch (preset) {
    case "10K":
      return { km: 10, meters: 10_000 };
    case "Half Marathon":
      return { km: 21.1, meters: 21_100 };
    case "Marathon":
      return { km: 42.195, meters: 42_195 };
  }
}

function roundDistanceKm(value: number) {
  return Math.round(value * 1000) / 1000;
}

function formatDurationSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(remainingSeconds)}`;
  }

  return `${minutes}:${pad2(remainingSeconds)}`;
}

function formatPaceSecondsPerKm(secondsPerKm: number) {
  return `${formatDurationSeconds(secondsPerKm)}/km`;
}

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

function maxFeasibility(
  current: PlanGoalIntentFeasibilityStatus,
  next: PlanGoalIntentFeasibilityStatus,
): PlanGoalIntentFeasibilityStatus {
  const order: PlanGoalIntentFeasibilityStatus[] = [
    "supported",
    "supported_with_assumptions",
    "aggressive_or_short_horizon",
    "unsupported_for_current_builder",
    "impossible_goal",
  ];

  return order.indexOf(next) > order.indexOf(current) ? next : current;
}
