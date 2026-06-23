import {
  isRecent5kPaceInAcceptedRange,
  isRecent5kTimeInAcceptedRange,
  type StructuredConstructorState,
} from "@/components/onboarding/onboarding-form-model";
import type { PlanPresetCardId, PlanPresetCardRequestInput } from "@/lib/plan-presets/schema";
import type { RunningPlanDistanceFamily, RunningPlanRunnerLevel } from "@/lib/plan-creation-engine";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import type {
  RunningPlanConfirmActionInput,
  RunningPlanPreviewActionInput,
  RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";

export function buildPlanPresetCardInput(
  state: StructuredConstructorState,
): PlanPresetCardRequestInput {
  const age = optionalPlanPresetNumber(state.age, { min: 13, max: 100, integer: true });
  const weightKg = optionalPlanPresetNumber(state.weightKg, { min: 30, max: 250 });
  const heightCm = optionalPlanPresetNumber(state.heightCm, { min: 120, max: 230, integer: true });
  const runningDaysPerWeek = optionalPlanPresetNumber(state.maxRunningDaysPerWeek, {
    min: 1,
    max: 7,
    integer: true,
  });
  const recent5kTime = state.recent5kTime.trim();
  const targetTime = state.targetTime.trim();
  const targetDate = state.targetDate.trim();
  const startDate = state.startDate.trim();
  const comment = state.comment.trim();

  return {
    profile: {
      age,
      weightKg,
      heightCm,
    },
    benchmark: {
      fitnessLevel: state.fitnessLevel,
      recent5kTime: recent5kTime || null,
    },
    availability: {
      runningDaysPerWeek,
      fixedRestDays: state.restDaysAnswered ? state.fixedRestDays : null,
      preferredLongRunDay: state.preferredLongRunDay || null,
    },
    goal: {
      goalDistance: state.goalDistance,
      goalStyle: state.goalStyle,
      terrainFocus: state.terrainFocus,
      targetTime: targetTime || null,
      targetDate: targetDate || null,
    },
    execution: {
      watchAccess: state.watchAccess,
      guidancePreference: state.guidancePreference,
    },
    strength: {
      preference: state.strengthPreference,
    },
    schedule: {
      startDate: startDate || null,
      targetDate: targetDate || null,
    },
    comment: comment || null,
  };
}

export function buildPlanPresetCardInputKey(input: PlanPresetCardRequestInput) {
  return JSON.stringify(input);
}

export function buildRunningPlanPreviewInput(
  state: StructuredConstructorState,
  cardId: PlanPresetCardId,
): { ok: true; input: RunningPlanPreviewActionInput } | { ok: false; error: string } {
  const age = requiredNumber(state.age, {
    label: "Age",
    min: 13,
    max: 100,
    integer: true,
  });
  const heightCm = requiredNumber(state.heightCm, {
    label: "Height",
    min: 120,
    max: 230,
    integer: true,
  });
  const weightKg = requiredNumber(state.weightKg, {
    label: "Weight",
    min: 30,
    max: 250,
  });

  if (!age.ok) {
    return { ok: false, error: age.error };
  }
  if (!heightCm.ok) {
    return { ok: false, error: heightCm.error };
  }
  if (!weightKg.ok) {
    return { ok: false, error: weightKg.error };
  }

  const daysPerWeek = optionalPlanPresetNumber(state.maxRunningDaysPerWeek, {
    min: 1,
    max: 7,
    integer: true,
  });
  const benchmark = buildRunningPlanBenchmarkInput(state);

  if (!benchmark.ok) {
    return { ok: false, error: benchmark.error };
  }

  return {
    ok: true,
    input: {
      age: age.value,
      heightCm: heightCm.value,
      weightKg: weightKg.value,
      runnerLevel: mapRunnerLevelToPlanEngine(state.fitnessLevel),
      distanceFamily: distanceFamilyForPresetCard(cardId),
      daysPerWeek,
      fixedRestDays: state.restDaysAnswered ? state.fixedRestDays : null,
      preferredLongRunDay: state.preferredLongRunDay || null,
      startDate: state.startDate.trim() || null,
      benchmark: benchmark.input,
    },
  };
}

export function buildRunningPlanConfirmInput(
  draft: Extract<RunningPlanPreviewActionResult, { ok: true }>["draft"] | null,
  previewInput: RunningPlanPreviewActionInput | null,
  invalidMessage: string,
):
  | { ok: true; input: RunningPlanConfirmActionInput }
  | {
      ok: false;
      message: string;
      sourceKind?: RunningPlanConfirmActionInput["sourceKind"];
      planFamily?: RunningPlanConfirmActionInput["planFamily"];
    } {
  if (!draft || !previewInput || !draft.reviewToken || !draft.reviewChecksum) {
    return {
      ok: false,
      message: invalidMessage,
      sourceKind: draft?.sourceKind,
      planFamily: draft?.planFamily,
    };
  }

  return {
    ok: true,
    input: {
      previewInput,
      planFamily: draft.planFamily,
      sourceKind: draft.sourceKind,
      reviewToken: draft.reviewToken,
      reviewChecksum: draft.reviewChecksum,
    },
  };
}

function buildRunningPlanBenchmarkInput(state: StructuredConstructorState):
  | {
      ok: true;
      input: NonNullable<RunningPlanPreviewActionInput["benchmark"]>;
    }
  | { ok: false; error: string } {
  const recent5kTime = state.recent5kTime.trim();
  const recent5kPace = state.recent5kPace.trim();
  const hasRecent5kTime = recent5kTime.length > 0;
  const hasRecent5kPace = recent5kPace.length > 0;

  if (hasRecent5kTime && !isRecent5kTimeInAcceptedRange(recent5kTime)) {
    return { ok: false, error: "Use a recent 5K time between 18:00 and 55:00." };
  }

  if (hasRecent5kPace && !isRecent5kPaceInAcceptedRange(recent5kPace)) {
    return { ok: false, error: "Use a recent 5K pace between 2:00/km and 15:00/km." };
  }

  if (hasRecent5kTime) {
    return {
      ok: true,
      input: {
        kind: "recent_5k_time",
        recent5kTime,
      },
    };
  }

  if (hasRecent5kPace) {
    return {
      ok: true,
      input: {
        kind: "recent_5k_pace",
        recent5kPace,
      },
    };
  }

  return {
    ok: true,
    input: {
      kind: "unknown",
    },
  };
}

function distanceFamilyForPresetCard(cardId: PlanPresetCardId): RunningPlanDistanceFamily {
  switch (cardId) {
    case "10k":
      return "10K";
    case "half_marathon":
      return "Half Marathon";
    case "marathon":
      return "Marathon Base";
  }
}

function mapRunnerLevelToPlanEngine(level: RunnerFitnessLevel): RunningPlanRunnerLevel {
  switch (level) {
    case "new_to_running":
      return "beginner_new_runner";
    case "beginner":
      return "sometimes_runs";
    case "running_regularly":
      return "runs_a_lot";
    case "performance_focused":
      return "professional_competitive";
    case "custom":
      return "sometimes_runs";
  }
}

function requiredNumber(
  value: string,
  {
    integer = false,
    label,
    max,
    min,
  }: {
    label: string;
    min: number;
    max: number;
    integer?: boolean;
  },
): { ok: true; value: number } | { ok: false; error: string } {
  const parsed = optionalPlanPresetNumber(value, { min, max, integer });

  if (parsed == null) {
    return { ok: false, error: `${label} must be filled before selecting a plan preview.` };
  }

  return { ok: true, value: parsed };
}

function optionalPlanPresetNumber(
  value: string,
  {
    min,
    max,
    integer = false,
  }: {
    min: number;
    max: number;
    integer?: boolean;
  },
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }

  if (integer && !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}
