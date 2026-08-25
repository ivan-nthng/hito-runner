import {
  isPositiveRecent5kPace,
  isPositiveRecent5kTime,
  type PlanGoalChoice,
  type StructuredConstructorState,
} from "@/components/onboarding/onboarding-form-model";
import { isRealIsoDate, parseDurationSeconds } from "@/lib/first-plan-authoring-utils";
import type { RunningPlanRunnerLevel } from "@/lib/plan-creation-engine";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import { generatedPlanRunnerCommentInputSchema } from "@/lib/structured-plan-authoring-schema";
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

export type RunningPlanAdmissionField =
  | "age"
  | "heightCm"
  | "weightKg"
  | "goal"
  | "customDistance"
  | "finishTime"
  | "targetDate"
  | "recent5kTime"
  | "recent5kPace"
  | "runnerComment";

export type RunningPlanAdmissionIssue = {
  field: RunningPlanAdmissionField | null;
  correction: string;
};

type RunningPlanGoalAdmissionIssue = RunningPlanAdmissionIssue & {
  field: "goal" | "customDistance" | "finishTime" | "targetDate";
};

export type RunningPlanAdmissionFailure = {
  ok: false;
  source: "client" | "server";
  title: "Plan preparation request cancelled";
  issues: readonly RunningPlanAdmissionIssue[];
  firstField: RunningPlanAdmissionField | null;
};

export type RunningPlanAdmissionResult =
  | { ok: true; input: RunningPlanPreviewActionInput }
  | RunningPlanAdmissionFailure;

export function buildRunningPlanPreviewInput(
  state: StructuredConstructorState,
  goalSelection: PlanGoalChoice | null,
): RunningPlanAdmissionResult {
  const age = requiredNumber(state.age, {
    min: 13,
    max: 100,
    integer: true,
  });
  const heightCm = requiredNumber(state.heightCm, {
    min: 120,
    max: 230,
    integer: true,
  });
  const weightKg = requiredNumber(state.weightKg, {
    min: 30,
    max: 250,
  });
  const daysPerWeek = optionalRunningDaysPerWeek(state.maxRunningDaysPerWeek);
  const benchmark = buildRunningPlanBenchmarkInput(state);
  const runnerComment = generatedPlanRunnerCommentInputSchema.safeParse(state.runnerComment);
  const issues: RunningPlanAdmissionIssue[] = [];

  if (!age.ok) {
    issues.push({ field: "age", correction: "Add an age from 13 to 100." });
  }
  if (!heightCm.ok) {
    issues.push({ field: "heightCm", correction: "Add a height from 120 to 230 cm." });
  }
  if (!weightKg.ok) {
    issues.push({ field: "weightKg", correction: "Add a weight from 30 to 250 kg." });
  }

  issues.push(...collectPlanGoalAdmissionIssues(state, goalSelection));

  if (!benchmark.ok) {
    issues.push({ field: benchmark.field, correction: benchmark.error });
  }
  if (!runnerComment.success) {
    issues.push({
      field: "runnerComment",
      correction: runnerComment.error.issues.at(0)?.message ?? "Review the optional plan context.",
    });
  }

  if (issues.length > 0) {
    return buildRunningPlanAdmissionFailure("client", issues);
  }

  if (!age.ok || !heightCm.ok || !weightKg.ok || !benchmark.ok || !runnerComment.success) {
    throw new Error("Running-plan admission invariants were not narrowed after validation.");
  }
  if (!goalSelection) {
    throw new Error("Running-plan goal selection was not narrowed after validation.");
  }

  const planGoalIntent = buildSelectedPlanGoalIntentInput(state, goalSelection);

  if (!planGoalIntent.ok) {
    return buildRunningPlanAdmissionFailure("client", [
      { field: "goal", correction: planGoalIntent.error },
    ]);
  }

  return {
    ok: true,
    input: {
      age: age.value,
      heightCm: heightCm.value,
      weightKg: weightKg.value,
      runnerLevel: mapRunnerLevelToPlanEngine(state.fitnessLevel),
      daysPerWeek,
      fixedRestDays: state.fixedRestDays.length > 0 ? state.fixedRestDays : null,
      preferredLongRunDay: state.preferredLongRunDay || null,
      startDate: state.startDate.trim() || null,
      benchmark: benchmark.input,
      planGoalIntent: planGoalIntent.input,
      ...(runnerComment.data ? { runnerComment: runnerComment.data } : {}),
    },
  };
}

export function mapRunningPlanPreviewResultToAdmissionFailure(
  result: RunningPlanPreviewActionResult,
): RunningPlanAdmissionFailure | null {
  if (result.ok || result.unavailable.previewOutcome !== "invalid_structural_input") {
    return null;
  }

  const { code, compilerDiagnostic, message } = result.unavailable.error;

  if (code === "invalid_plan_goal_intent") {
    return buildRunningPlanAdmissionFailure("server", [
      {
        field: "targetDate",
        correction: message || "Add your target date.",
      },
    ]);
  }

  const diagnosticField = mapCompilerDiagnosticPathToAdmissionField(compilerDiagnostic?.path);

  return buildRunningPlanAdmissionFailure("server", [
    {
      field: diagnosticField,
      correction: message,
    },
  ]);
}

export function runningPlanAdmissionFieldErrors(
  failure: RunningPlanAdmissionFailure | null,
): Partial<Record<RunningPlanAdmissionField, string>> {
  if (!failure) {
    return {};
  }

  return Object.fromEntries(
    failure.issues.flatMap((issue) =>
      issue.field ? ([[issue.field, issue.correction]] as const) : [],
    ),
  );
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
  const issue = collectPlanGoalAdmissionIssues(state, goalSelection).at(0);

  return issue?.field ? { ok: false, field: issue.field, error: issue.correction } : { ok: true };
}

function collectPlanGoalAdmissionIssues(
  state: PlanGoalIntentDraftState,
  goalSelection: PlanGoalChoice | null,
): RunningPlanGoalAdmissionIssue[] {
  const issues: RunningPlanGoalAdmissionIssue[] = [];
  const goalChoice = state.planGoalChoice;

  if (!goalChoice) {
    issues.push({ field: "goal", correction: "Choose a training goal." });
    return issues;
  }

  if (goalChoice === "custom") {
    const customDistance = parsePlanGoalCustomDistanceKm(state.planGoalCustomDistanceKm);

    if (customDistance == null) {
      issues.push({
        field: "customDistance",
        correction: "Add a custom distance greater than 0 and up to 500 km.",
      });
    }
  }

  if (goalSelection && goalChoice !== goalSelection) {
    issues.push({
      field: "goal",
      correction: `Choose ${planGoalChoiceLabel(goalSelection)} before creating this plan.`,
    });
  }

  const targetFinishTime = state.planGoalFinishTime.trim();

  if (targetFinishTime) {
    const seconds = parseDurationSeconds(targetFinishTime);

    if (seconds == null || seconds <= 0) {
      issues.push({
        field: "finishTime",
        correction: "Use a positive finish time such as 45:00 or 3:50:00.",
      });
    }
  }

  const targetDate = state.planGoalTargetDate.trim();

  if (!targetDate) {
    issues.push({ field: "targetDate", correction: "Add your target date." });
  } else if (!isRealIsoDate(targetDate)) {
    issues.push({ field: "targetDate", correction: "Use a real target date." });
  }

  return issues;
}

function buildRunningPlanAdmissionFailure(
  source: RunningPlanAdmissionFailure["source"],
  issues: readonly RunningPlanAdmissionIssue[],
): RunningPlanAdmissionFailure {
  return {
    ok: false,
    source,
    title: "Plan preparation request cancelled",
    issues,
    firstField: issues.find((issue) => issue.field)?.field ?? null,
  };
}

function mapCompilerDiagnosticPathToAdmissionField(
  path: string | null | undefined,
): RunningPlanAdmissionField | null {
  if (!path) {
    return null;
  }

  const fieldByPath: readonly [string, RunningPlanAdmissionField][] = [
    ["age", "age"],
    ["height", "heightCm"],
    ["weight", "weightKg"],
    ["distance", "customDistance"],
    ["targetFinishTime", "finishTime"],
    ["targetDate", "targetDate"],
    ["recent5kTime", "recent5kTime"],
    ["recent5kPace", "recent5kPace"],
    ["runnerComment", "runnerComment"],
  ];

  return fieldByPath.find(([fragment]) => path.includes(fragment))?.[1] ?? null;
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
    } {
  if (!draft || !previewInput || !draft.reviewToken || !draft.reviewChecksum) {
    return {
      ok: false,
      message: invalidMessage,
      sourceKind: draft?.sourceKind,
    };
  }

  return {
    ok: true,
    input: {
      previewInput,
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
  | { ok: false; field: "recent5kTime" | "recent5kPace"; error: string } {
  const recent5kTime = state.recent5kTime.trim();
  const recent5kPace = state.recent5kPace.trim();
  const hasRecent5kTime = recent5kTime.length > 0;
  const hasRecent5kPace = recent5kPace.length > 0;

  if (hasRecent5kTime && !isPositiveRecent5kTime(recent5kTime)) {
    return {
      ok: false,
      field: "recent5kTime",
      error: "Use a positive recent 5K time such as 25:00.",
    };
  }

  if (hasRecent5kPace && !isPositiveRecent5kPace(recent5kPace)) {
    return {
      ok: false,
      field: "recent5kPace",
      error: "Use a positive recent 5K pace such as 5:00/km.",
    };
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

function buildSelectedPlanGoalIntentInput(
  state: StructuredConstructorState,
  goalSelection: PlanGoalSelectionId,
):
  | { ok: true; input: RunningPlanPreviewActionInput["planGoalIntent"] }
  | { ok: false; error: string } {
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
):
  | {
      ok: true;
      input: NonNullable<RunningPlanPreviewActionInput["planGoalIntent"]["distance"]>;
    }
  | { ok: false; error: string } {
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
    max,
    min,
  }: {
    min: number;
    max: number;
    integer?: boolean;
  },
): { ok: true; value: number } | { ok: false } {
  const parsed = optionalPlanPresetNumber(value, { min, max, integer });

  if (parsed == null) {
    return { ok: false };
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

function optionalRunningDaysPerWeek(value: string): RunningPlanPreviewActionInput["daysPerWeek"] {
  const parsed = optionalPlanPresetNumber(value, { min: 1, max: 7, integer: true });

  switch (parsed) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      return parsed;
    default:
      return null;
  }
}
