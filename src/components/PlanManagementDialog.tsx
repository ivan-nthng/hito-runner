import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  clearUpcomingSchedule,
  applyActivePlanScheduleReflowPreview,
  previewActivePlanScheduleEdit,
  type ViewerSummary,
} from "@/lib/training-api";
import type {
  ActivePlanScheduleEditInput,
  ActivePlanScheduleEditPreview,
} from "@/lib/active-plan-schedule-edit-preview";
import type { TrainingSnapshot, Workout } from "@/lib/training";
import { WEEKDAY_OPTIONS, type WeekdayName } from "@/components/onboarding/onboarding-form-model";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PlanLifecycleControls,
  type PlanLifecycleClearStatus,
} from "@/components/plan-management/PlanLifecycleControls";
import {
  PlanScheduleEditPanel,
  type PlanScheduleApplyStatus,
  type PlanScheduleEditSummary,
  type PlanSchedulePreviewStatus,
} from "@/components/plan-management/PlanScheduleEditPanel";
import { PlanSummaryHeader } from "@/components/plan-management/PlanSummaryHeader";
import { hitoToast } from "@/components/ui/hito-toast";

export type PlanManagementDialogMode = "edit-schedule" | "clear-upcoming";

export function PlanManagementDialog({
  mode = "edit-schedule",
  open,
  onOpenChange,
  snapshot,
  viewer,
}: {
  mode?: PlanManagementDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: TrainingSnapshot | null | undefined;
  viewer: ViewerSummary | null | undefined;
}) {
  const clearUpcomingScheduleFn = useServerFn(clearUpcomingSchedule);
  const previewActivePlanScheduleEditFn = useServerFn(previewActivePlanScheduleEdit);
  const applyActivePlanScheduleReflowPreviewFn = useServerFn(applyActivePlanScheduleReflowPreview);

  const planMeta = snapshot?.planMeta;
  const defaultStartDate = snapshot?.currentDate ?? todayLocalIso();
  const initialScheduleDefaults = deriveScheduleEditDefaults(snapshot);

  const [clearStatus, setClearStatus] = useState<PlanLifecycleClearStatus>("idle");
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearConfirmed, setClearConfirmed] = useState(false);
  const [scheduleFixedRestDays, setScheduleFixedRestDays] = useState<WeekdayName[]>(
    initialScheduleDefaults.fixedRestDays,
  );
  const [scheduleRestDaysAnswered, setScheduleRestDaysAnswered] = useState(true);
  const [scheduleRunningDaysPerWeek, setScheduleRunningDaysPerWeek] = useState(
    String(initialScheduleDefaults.runningDaysPerWeek),
  );
  const [schedulePreferredLongRunDay, setSchedulePreferredLongRunDay] = useState<WeekdayName | "">(
    initialScheduleDefaults.preferredLongRunDay ?? "",
  );
  const [schedulePreviewStatus, setSchedulePreviewStatus] =
    useState<PlanSchedulePreviewStatus>("idle");
  const [scheduleApplyStatus, setScheduleApplyStatus] = useState<PlanScheduleApplyStatus>("idle");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleStaleMessage, setScheduleStaleMessage] = useState<string | null>(null);
  const [scheduleDecisionMessage, setScheduleDecisionMessage] = useState<string | null>(null);
  const [schedulePreviewResult, setSchedulePreviewResult] =
    useState<ActivePlanScheduleEditPreview | null>(null);
  const [scheduleReviewedInput, setScheduleReviewedInput] =
    useState<ActivePlanScheduleEditInput | null>(null);

  const isBusy =
    clearStatus !== "idle" || schedulePreviewStatus !== "idle" || scheduleApplyStatus !== "idle";
  const runnerLabel = planMeta?.createdFor ?? viewer?.name ?? "Runner";
  const planWorkoutCount =
    snapshot?.workouts.filter((workout) => workout.type !== "rest").length ?? 0;
  const planDayCount = snapshot?.workouts.length ?? 0;
  const scheduleSummary = deriveScheduleEditSummary(snapshot, initialScheduleDefaults);
  const dialogTitle = getDialogTitle(mode);
  const dialogDescription = getDialogDescription(mode);

  useEffect(() => {
    if (!open) {
      setClearStatus("idle");
      setClearError(null);
      setClearConfirmed(false);
      const nextScheduleDefaults = deriveScheduleEditDefaults(snapshot);
      setScheduleFixedRestDays(nextScheduleDefaults.fixedRestDays);
      setScheduleRestDaysAnswered(true);
      setScheduleRunningDaysPerWeek(String(nextScheduleDefaults.runningDaysPerWeek));
      setSchedulePreferredLongRunDay(nextScheduleDefaults.preferredLongRunDay ?? "");
      setSchedulePreviewStatus("idle");
      setScheduleApplyStatus("idle");
      setScheduleError(null);
      setScheduleStaleMessage(null);
      setScheduleDecisionMessage(null);
      setSchedulePreviewResult(null);
      setScheduleReviewedInput(null);
    }
  }, [open, snapshot]);

  const submitClearUpcomingSchedule = async () => {
    setClearStatus("clearing");
    setClearError(null);

    try {
      await clearUpcomingScheduleFn();
      finishAtHome(onOpenChange);
    } catch (submitError) {
      setClearStatus("idle");
      setClearError(
        submitError instanceof Error
          ? submitError.message
          : "Could not clear the upcoming schedule.",
      );
    }
  };

  const resetScheduleReview = () => {
    setScheduleError(null);
    setScheduleStaleMessage(null);
    setScheduleDecisionMessage(null);
    setScheduleApplyStatus("idle");
    setSchedulePreviewResult(null);
    setScheduleReviewedInput(null);
  };

  const buildScheduleEditInput = (): ActivePlanScheduleEditInput | null => {
    const runningDaysPerWeek = Number.parseInt(scheduleRunningDaysPerWeek, 10);

    if (!scheduleRestDaysAnswered) {
      setScheduleError("Choose fixed rest days or choose no fixed rest days first.");
      return null;
    }

    if (!Number.isInteger(runningDaysPerWeek) || runningDaysPerWeek < 1) {
      setScheduleError("Choose how many running days per week Hito should use.");
      return null;
    }

    return {
      fixedRestDays: scheduleFixedRestDays,
      preferredLongRunDay: schedulePreferredLongRunDay || null,
      runningDaysPerWeek,
      saveAsDefaultTrainingPreferences: false,
      intent: {
        source: "open_plan_edit_schedule",
      },
    };
  };

  const submitSchedulePreview = async () => {
    resetScheduleReview();

    const input = buildScheduleEditInput();

    if (!input) {
      return;
    }

    setScheduleReviewedInput(input);
    setSchedulePreviewStatus("previewing");

    try {
      const result = await previewActivePlanScheduleEditFn({ data: input });

      setSchedulePreviewStatus("idle");

      if (!result.ok) {
        setScheduleError(result.message);
        return;
      }

      setSchedulePreviewResult(result);

      if (result.mode === "requires_regeneration") {
        hitoToast.error({
          title: "Add plan needed",
          description: result.message,
          duration: 6800,
        });
        return;
      }

      hitoToast.success({
        title: "Schedule preview ready",
        description: "Review the date moves before applying anything.",
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not preview schedule changes.";
      setSchedulePreviewStatus("idle");
      setScheduleError(message);
    }
  };

  const submitApplyScheduleReflow = async () => {
    const result = schedulePreviewResult;

    if (!result?.ok || result.mode !== "schedule_reflow" || !scheduleReviewedInput) {
      setScheduleError("Review schedule changes before applying them.");
      return;
    }

    setScheduleApplyStatus("applying");
    setScheduleError(null);
    setScheduleStaleMessage(null);
    setScheduleDecisionMessage(null);

    try {
      const applyResult = await applyActivePlanScheduleReflowPreviewFn({
        data: {
          previewToken: result.previewToken,
          scheduleEditInput: scheduleReviewedInput,
        },
      });

      if (!applyResult.ok) {
        setScheduleApplyStatus("idle");
        setScheduleStaleMessage(applyResult.message);
        hitoToast.error({
          title: "Schedule not applied",
          description: applyResult.message,
          duration: 7200,
        });
        return;
      }

      setScheduleApplyStatus("idle");
      setScheduleDecisionMessage(
        `Schedule updated. ${applyResult.movedWorkoutCount} future workout${
          applyResult.movedWorkoutCount === 1 ? "" : "s"
        } moved. Opening the updated plan...`,
      );
      hitoToast.success({
        title: "Schedule updated",
        description: "The active plan now uses the reviewed schedule changes.",
      });
      finishAtHome(onOpenChange);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not apply schedule changes.";
      setScheduleApplyStatus("idle");
      setScheduleError(message);
      hitoToast.error({
        title: "Schedule not applied",
        description: message,
        duration: 7200,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="hito-dialog-overlay-stable"
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-wide hito-dialog-height-workflow"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">{dialogTitle}</DialogTitle>
          <DialogDescription className="hito-body max-w-lg">{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          <div className="grid gap-6">
            <PlanSummaryHeader
              planMeta={planMeta}
              goalFallback={snapshot?.profile?.goalLabel}
              runnerLabel={runnerLabel}
              planDayCount={planDayCount}
              planWorkoutCount={planWorkoutCount}
              defaultStartDate={defaultStartDate}
            />

            {mode === "edit-schedule" ? (
              <PlanScheduleEditPanel
                available={Boolean(planMeta)}
                defaultOpen
                fixedRestDays={scheduleFixedRestDays}
                restDaysAnswered={scheduleRestDaysAnswered}
                maxRunningDaysPerWeek={scheduleRunningDaysPerWeek}
                preferredLongRunDay={schedulePreferredLongRunDay}
                previewStatus={schedulePreviewStatus}
                applyStatus={scheduleApplyStatus}
                result={schedulePreviewResult}
                error={scheduleError}
                staleMessage={scheduleStaleMessage}
                decisionMessage={scheduleDecisionMessage}
                summary={scheduleSummary}
                isBusy={isBusy}
                onFixedRestDaysChange={setScheduleFixedRestDays}
                onRestDaysAnsweredChange={setScheduleRestDaysAnswered}
                onMaxRunningDaysPerWeekChange={setScheduleRunningDaysPerWeek}
                onPreferredLongRunDayChange={setSchedulePreferredLongRunDay}
                onReview={() => {
                  void submitSchedulePreview();
                }}
                onApply={() => {
                  void submitApplyScheduleReflow();
                }}
                onReviewAgain={resetScheduleReview}
              />
            ) : null}

            {mode === "clear-upcoming" ? (
              <PlanLifecycleControls
                planAvailable={Boolean(planMeta)}
                isBusy={isBusy}
                clearStatus={clearStatus}
                clearError={clearError}
                clearConfirmed={clearConfirmed}
                clearDefaultOpen={mode === "clear-upcoming"}
                onClearConfirmedChange={setClearConfirmed}
                onClearUpcomingSchedule={() => {
                  void submitClearUpcomingSchedule();
                }}
              />
            ) : null}
          </div>
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="hito-button hito-button-secondary hito-button-md"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDialogTitle(mode: PlanManagementDialogMode) {
  if (mode === "edit-schedule") {
    return "Edit schedule";
  }

  if (mode === "clear-upcoming") {
    return "Clear upcoming schedule";
  }
}

function getDialogDescription(mode: PlanManagementDialogMode) {
  if (mode === "edit-schedule") {
    return "Preview schedule changes before any future workout dates move.";
  }

  if (mode === "clear-upcoming") {
    return "Clear future scheduled workouts only after confirming history stays preserved.";
  }
}

function deriveScheduleEditSummary(
  snapshot: TrainingSnapshot | null | undefined,
  defaults: ScheduleEditDefaults,
): PlanScheduleEditSummary {
  const workoutCount = snapshot?.workouts.filter((workout) => workout.type !== "rest").length ?? 0;

  return {
    fixedRestDays: defaults.fixedRestDays,
    runningDaysPerWeek: defaults.runningDaysPerWeek,
    preferredLongRunDay: defaults.preferredLongRunDay,
    workoutCount,
  };
}

interface ScheduleEditDefaults {
  fixedRestDays: WeekdayName[];
  runningDaysPerWeek: number;
  preferredLongRunDay: WeekdayName | null;
}

function deriveScheduleEditDefaults(
  snapshot: TrainingSnapshot | null | undefined,
): ScheduleEditDefaults {
  const persistedPreferences = snapshot?.planMeta?.schedulePreferences ?? null;
  const workouts = snapshot?.workouts ?? [];
  const nonRestWorkouts = workouts.filter((workout) => workout.type !== "rest");
  const runningWeekdays = uniqueWeekdays(nonRestWorkouts.map((workout) => workout.weekday));
  const fallbackRunningDaysPerWeek = deriveRunningDaysPerWeek(
    nonRestWorkouts,
    runningWeekdays.length,
  );

  return {
    fixedRestDays: uniqueWeekdays(persistedPreferences?.fixedRestDays ?? []),
    runningDaysPerWeek: persistedPreferences?.runningDaysPerWeek ?? fallbackRunningDaysPerWeek,
    preferredLongRunDay:
      parseWeekdayName(persistedPreferences?.preferredLongRunDay) ??
      derivePreferredLongRunDay(nonRestWorkouts),
  };
}

function deriveRunningDaysPerWeek(workouts: Workout[], fallback: number) {
  const countsByWeek = new Map<number, number>();

  for (const workout of workouts) {
    countsByWeek.set(workout.week, (countsByWeek.get(workout.week) ?? 0) + 1);
  }

  const maxWeekCount = Math.max(0, ...countsByWeek.values());

  if (maxWeekCount > 0) {
    return Math.min(7, maxWeekCount);
  }

  if (fallback > 0) {
    return Math.min(7, fallback);
  }

  return 4;
}

function derivePreferredLongRunDay(workouts: Workout[]): WeekdayName | null {
  const longRun = workouts.find(
    (workout) =>
      workout.calendarIconKey === "long" ||
      workout.workoutFamily === "long" ||
      workout.type === "long_run",
  );

  return parseWeekdayName(longRun?.weekday);
}

function uniqueWeekdays(values: (string | null | undefined)[]) {
  const weekdays: WeekdayName[] = [];

  for (const value of values) {
    const weekday = parseWeekdayName(value);

    if (weekday && !weekdays.includes(weekday)) {
      weekdays.push(weekday);
    }
  }

  return weekdays;
}

function parseWeekdayName(value: string | null | undefined): WeekdayName | null {
  return WEEKDAY_OPTIONS.find((option) => option.value === value)?.value ?? null;
}

function finishAtHome(onOpenChange: (open: boolean) => void) {
  onOpenChange(false);

  if (typeof window !== "undefined") {
    window.location.assign("/");
  }
}

function todayLocalIso() {
  const date = new Date();
  return toLocalIso(date);
}

function toLocalIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
