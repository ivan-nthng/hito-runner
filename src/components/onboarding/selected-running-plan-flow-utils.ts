import {
  isRecent5kPaceInAcceptedRange,
  isRecent5kTimeInAcceptedRange,
  type PlanGoalChoice,
  type StructuredConstructorState,
} from "@/components/onboarding/onboarding-form-model";
import { isRealIsoDate, parseDurationSeconds } from "@/lib/first-plan-authoring-utils";
import type { PlanPresetCardRequestInput } from "@/lib/plan-presets/schema";
import type {
  PlanGoalIntentInput,
  RunningPlanDistanceFamily,
  RunningPlanRunnerLevel,
} from "@/lib/plan-creation-engine";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import type {
  RunningPlanConfirmActionInput,
  RunningPlanPreviewActionInput,
  RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";

export type PlanGoalIntentDraftState = Pick<
  StructuredConstructorState,
  | "planGoalChoice"
  | "planGoalCustomDistanceKm"
  | "planGoalCustomDistanceLabel"
  | "planGoalFinishTime"
  | "planGoalTargetDate"
>;
export type PlanGoalSelectionId = Exclude<PlanGoalChoice, "">;

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
  goalSelection: PlanGoalSelectionId,
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

  const goalGate = resolveSelectedPlanGoalPreviewGate(state, goalSelection);

  if (!goalGate.ok) {
    return { ok: false, error: goalGate.error };
  }

  const planGoalIntent = buildSelectedPlanGoalIntentInput(state, goalSelection);

  if (!planGoalIntent.ok) {
    return { ok: false, error: planGoalIntent.error };
  }

  return {
    ok: true,
    input: {
      age: age.value,
      heightCm: heightCm.value,
      weightKg: weightKg.value,
      runnerLevel: mapRunnerLevelToPlanEngine(state.fitnessLevel),
      distanceFamily: distanceFamilyForGoalSelection(state, goalSelection),
      daysPerWeek,
      fixedRestDays: state.restDaysAnswered ? state.fixedRestDays : null,
      preferredLongRunDay: state.preferredLongRunDay || null,
      startDate: state.startDate.trim() || null,
      benchmark: benchmark.input,
      planGoalIntent: planGoalIntent.input,
    },
  };
}

export type SelectedPlanGoalPreviewGate =
  | { ok: true }
  | {
      ok: false;
      error: string;
      field: "goal" | "customDistance" | "finishTime" | "targetDate";
    };

export function resolveSelectedPlanGoalPreviewGate(
  state: PlanGoalIntentDraftState,
  goalSelection: PlanGoalSelectionId | null,
): SelectedPlanGoalPreviewGate {
  const goalChoice = state.planGoalChoice;

  if (!goalChoice) {
    return {
      ok: false,
      field: "goal",
      error: "Choose what you are training for before previewing.",
    };
  }

  if (goalChoice === "custom") {
    const customDistance = parsePlanGoalCustomDistanceKm(state.planGoalCustomDistanceKm);

    if (customDistance == null) {
      return {
        ok: false,
        field: "customDistance",
        error: "Enter a distance greater than 0 and up to 500 km.",
      };
    }
  }

  if (goalSelection && goalChoice !== goalSelection) {
    return {
      ok: false,
      field: "goal",
      error: `Choose ${planGoalChoiceLabel(goalChoice)} before previewing this goal.`,
    };
  }

  const targetFinishTime = state.planGoalFinishTime.trim();

  if (targetFinishTime) {
    const seconds = parseDurationSeconds(targetFinishTime);

    if (seconds == null || seconds < 5 * 60 || seconds > 48 * 60 * 60) {
      return {
        ok: false,
        field: "finishTime",
        error: "Finish time should be between 5 minutes and 48 hours.",
      };
    }
  }

  const targetDate = state.planGoalTargetDate.trim();

  if (targetDate && !isRealIsoDate(targetDate)) {
    return {
      ok: false,
      field: "targetDate",
      error: "Use a real date.",
    };
  }

  return { ok: true };
}

export function planGoalChoiceLabel(choice: Exclude<PlanGoalChoice, "">) {
  switch (choice) {
    case "10k":
      return "10K";
    case "half_marathon":
      return "Half Marathon";
    case "marathon":
      return "Marathon";
    case "custom":
      return "Custom";
  }
}

export function derivePlanGoalPaceReadback(state: PlanGoalIntentDraftState) {
  const finishSeconds = parseValidatedPlanGoalFinishTimeSeconds(state.planGoalFinishTime);

  if (finishSeconds == null) {
    return null;
  }

  const distanceKm = planGoalDistanceKmForChoice(state);

  if (distanceKm == null) {
    return null;
  }

  return formatPaceSecondsPerKm(Math.round(finishSeconds / distanceKm));
}

export function planGoalDistanceKmForChoice(state: PlanGoalIntentDraftState) {
  switch (state.planGoalChoice) {
    case "10k":
      return 10;
    case "half_marathon":
      return 21.1;
    case "marathon":
      return 42.195;
    case "custom":
      return parsePlanGoalCustomDistanceKm(state.planGoalCustomDistanceKm);
    case "":
      return null;
  }
}

export function parsePlanGoalCustomDistanceKm(value: string) {
  const distanceKm = Number(value.trim().replace(",", "."));

  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 500) {
    return null;
  }

  return distanceKm;
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
    return { ok: false, error: "Use a recent 5K time between 10:00 and 2:00:00." };
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

function distanceFamilyForGoalSelection(
  state: StructuredConstructorState,
  goalSelection: PlanGoalSelectionId,
): RunningPlanDistanceFamily {
  switch (goalSelection) {
    case "10k":
      return "10K";
    case "half_marathon":
      return "Half Marathon";
    case "marathon":
      return "Marathon Completion";
    case "custom": {
      const distanceKm = parsePlanGoalCustomDistanceKm(state.planGoalCustomDistanceKm);

      if (distanceKm == null || distanceKm <= 10) {
        return "10K";
      }

      if (distanceKm <= 21.1) {
        return "Half Marathon";
      }

      return "Marathon Completion";
    }
  }
}

function buildSelectedPlanGoalIntentInput(
  state: StructuredConstructorState,
  goalSelection: PlanGoalSelectionId,
): { ok: true; input: PlanGoalIntentInput } | { ok: false; error: string } {
  const targetFinishTime = state.planGoalFinishTime.trim();
  const targetDate = state.planGoalTargetDate.trim();
  const distance = selectedPlanGoalDistanceInput(state, goalSelection);

  if (!distance.ok) {
    return distance;
  }

  return {
    ok: true,
    input: {
      distance: distance.input,
      targetFinishTime: targetFinishTime || null,
      targetDate: targetDate || null,
    },
  };
}

function selectedPlanGoalDistanceInput(
  state: StructuredConstructorState,
  goalSelection: PlanGoalSelectionId,
): { ok: true; input: PlanGoalIntentInput["distance"] } | { ok: false; error: string } {
  if (goalSelection !== "custom") {
    return {
      ok: true,
      input: {
        kind: "preset",
        preset: planGoalPresetForSelection(goalSelection),
      },
    };
  }

  const distanceKm = parsePlanGoalCustomDistanceKm(state.planGoalCustomDistanceKm);

  if (distanceKm == null) {
    return {
      ok: false,
      error: "Enter a distance greater than 0 and up to 500 km.",
    };
  }

  return {
    ok: true,
    input: {
      kind: "custom",
      distanceKm,
      label: state.planGoalCustomDistanceLabel.trim() || null,
    },
  };
}

function planGoalPresetForSelection(
  goalSelection: Exclude<PlanGoalSelectionId, "custom">,
): "10K" | "Half Marathon" | "Marathon" {
  switch (goalSelection) {
    case "10k":
      return "10K";
    case "half_marathon":
      return "Half Marathon";
    case "marathon":
      return "Marathon";
  }
}

function parseValidatedPlanGoalFinishTimeSeconds(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const seconds = parseDurationSeconds(trimmed);

  if (seconds == null || seconds < 5 * 60 || seconds > 48 * 60 * 60) {
    return null;
  }

  return seconds;
}

function formatPaceSecondsPerKm(secondsPerKm: number) {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}/km`;
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
