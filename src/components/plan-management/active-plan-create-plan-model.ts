import {
  WEEKDAY_OPTIONS,
  type StructuredConstructorState,
  type WeekdayName,
} from "@/components/onboarding/onboarding-form-model";
import { buildRunningPlanConfirmInput } from "@/components/onboarding/selected-running-plan-flow-utils";
import type { ActivePlanTransitionReviewResult } from "@/lib/active-plan-transition-actions";
import type {
  RunningPlanConfirmActionInput,
  RunningPlanPreviewActionInput,
  RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";
import type { TrainingSnapshot } from "@/lib/training";

type TransitionBlocked = Extract<ActivePlanTransitionReviewResult, { ok: false }>;

export function buildInitialCreatePlanState(
  snapshot: TrainingSnapshot | null | undefined,
): StructuredConstructorState {
  const profile = snapshot?.profile;
  const schedule = snapshot?.planMeta?.schedulePreferences;

  return {
    age: profile?.age != null ? String(profile.age) : "",
    heightCm: profile?.heightCm != null ? String(profile.heightCm) : "",
    weightKg: profile?.weightKg != null ? String(profile.weightKg) : "",
    fitnessLevel: "running_regularly",
    recent5kTime: "",
    recent5kPace: "",
    fixedRestDays: normalizeWeekdayNames(schedule?.fixedRestDays ?? []),
    restDaysAnswered: true,
    maxRunningDaysPerWeek:
      schedule?.runningDaysPerWeek != null ? String(schedule.runningDaysPerWeek) : "",
    preferredLongRunDay: normalizeWeekdayName(schedule?.preferredLongRunDay) ?? "",
    goalDistance: "build_consistency",
    goalStyle: "balanced",
    targetTime: "",
    startDate: "",
    targetDate: "",
    terrainFocus: "standard",
    watchAccess: "watch_or_app",
    guidancePreference: "effort",
    strengthPreference: "none",
    comment: "",
  };
}

export function buildInitialCreatePlanStateKey(state: StructuredConstructorState) {
  return JSON.stringify(state);
}

export function buildCandidateInput(
  draft: Extract<RunningPlanPreviewActionResult, { ok: true }>["draft"] | null,
  previewInput: RunningPlanPreviewActionInput | null,
): { ok: true; input: RunningPlanConfirmActionInput } | { ok: false; result: TransitionBlocked } {
  const candidate = buildRunningPlanConfirmInput(
    draft,
    previewInput,
    "Refresh the selected preview before reviewing this plan change.",
  );

  if (!candidate.ok) {
    return {
      ok: false,
      result: buildTransitionBlockedResult(candidate.message, candidate),
    };
  }

  return {
    ok: true,
    input: candidate.input,
  };
}

export function buildTransitionBlockedResult(
  message: string,
  input?: Pick<RunningPlanConfirmActionInput, "planFamily" | "sourceKind">,
): TransitionBlocked {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: "invalid_review",
    message,
    sourceKind: input?.sourceKind,
    planFamily: input?.planFamily,
  };
}

function normalizeWeekdayNames(values: readonly string[]): WeekdayName[] {
  return values
    .map((value) => normalizeWeekdayName(value))
    .filter((value): value is WeekdayName => Boolean(value));
}

function normalizeWeekdayName(value: string | null | undefined): WeekdayName | null {
  if (!value) {
    return null;
  }

  const match = WEEKDAY_OPTIONS.find(
    (option) => option.value.toLowerCase() === value.trim().toLowerCase(),
  );

  return match?.value ?? null;
}
