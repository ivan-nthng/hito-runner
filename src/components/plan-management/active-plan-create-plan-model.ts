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
import type { UserSettingsSummary } from "@/lib/user-settings-actions";

type TransitionBlocked = Extract<ActivePlanTransitionReviewResult, { ok: false }>;

export function buildInitialCreatePlanState(
  snapshot: TrainingSnapshot | null | undefined,
  settings: UserSettingsSummary | null = null,
): StructuredConstructorState {
  const profile = snapshot?.profile;
  const schedule = snapshot?.planMeta?.schedulePreferences;
  const savedPreferences = settings?.trainingPreferences;

  return {
    age:
      settings?.age != null
        ? String(settings.age)
        : profile?.age != null
          ? String(profile.age)
          : "",
    heightCm:
      settings?.heightCm != null
        ? String(settings.heightCm)
        : profile?.heightCm != null
          ? String(profile.heightCm)
          : "",
    weightKg:
      settings?.weightKg != null
        ? String(settings.weightKg)
        : profile?.weightKg != null
          ? String(profile.weightKg)
          : "",
    fitnessLevel: settings?.fitnessLevel ?? "running_regularly",
    recent5kTime: "",
    recent5kPace: "",
    fixedRestDays: normalizeWeekdayNames(
      savedPreferences?.blocked_days ?? schedule?.fixedRestDays ?? [],
    ),
    maxRunningDaysPerWeek:
      savedPreferences?.max_running_days_per_week != null
        ? String(savedPreferences.max_running_days_per_week)
        : schedule?.maxRunningDaysPerWeek != null
          ? String(schedule.maxRunningDaysPerWeek)
          : "",
    preferredLongRunDay:
      normalizeWeekdayName(
        savedPreferences?.preferred_long_run_day ?? schedule?.preferredLongRunDay,
      ) ?? "",
    startDate: "",
    planGoalChoice: "",
    planGoalCustomDistanceKm: "",
    planGoalCustomDistanceLabel: "",
    planGoalFinishTime: "",
    planGoalTargetDate: "",
    runnerComment: "",
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
  input?: Pick<RunningPlanConfirmActionInput, "sourceKind">,
): TransitionBlocked {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: "invalid_review",
    message,
    sourceKind: input?.sourceKind,
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
