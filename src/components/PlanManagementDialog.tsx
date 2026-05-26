import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  summarizeImportedPlan,
  type ImportedPlan,
  validateImportedPlanJson,
} from "@/lib/imported-plan";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import {
  clearUpcomingSchedule,
  completeOnboarding,
  completeTextOnboarding,
  deleteActivePlan,
  applyActivePlanRefreshProposal,
  applyActivePlanScheduleReflowPreview,
  previewActivePlanScheduleEdit,
  proposeActivePlanRefresh,
  type ActivePlanScheduleEditInput,
  type ActivePlanScheduleEditPreview,
  type ProposeActivePlanRefreshResult,
  type ViewerSummary,
} from "@/lib/training-api";
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
import type { PlanExportStatus } from "@/components/plan-management/PlanExportMenu";
import {
  PlanImportPanel,
  type PlanImportStatus,
} from "@/components/plan-management/PlanImportPanel";
import {
  PlanLifecycleControls,
  type PlanLifecycleClearStatus,
  type PlanLifecycleDeleteStatus,
} from "@/components/plan-management/PlanLifecycleControls";
import {
  PlanRefreshPanel,
  type PlanRefreshApplyStatus,
  type PlanRefreshStatus,
} from "@/components/plan-management/PlanRefreshPanel";
import {
  PlanScheduleEditPanel,
  type PlanScheduleApplyStatus,
  type PlanScheduleEditSummary,
  type PlanSchedulePreviewStatus,
} from "@/components/plan-management/PlanScheduleEditPanel";
import {
  PlanTextReplacementPanel,
  type PlanTextReplacementStatus,
} from "@/components/plan-management/PlanTextReplacementPanel";
import { PlanSummaryHeader } from "@/components/plan-management/PlanSummaryHeader";
import { hitoToast } from "@/components/ui/hito-toast";

const REFRESH_ACTION_TOAST_ID = "open-plan-refresh-action";
const ASYNC_TOAST_STAGE_ONE_MS = 10_000;
const ASYNC_TOAST_STAGE_TWO_MS = 30_000;
const APPLY_SUCCESS_REDIRECT_DELAY_MS = 1_800;

export function PlanManagementDialog({
  open,
  onOpenChange,
  snapshot,
  viewer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: TrainingSnapshot | null | undefined;
  viewer: ViewerSummary | null | undefined;
}) {
  const completeTextOnboardingFn = useServerFn(completeTextOnboarding);
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const deleteActivePlanFn = useServerFn(deleteActivePlan);
  const clearUpcomingScheduleFn = useServerFn(clearUpcomingSchedule);
  const proposeActivePlanRefreshFn = useServerFn(proposeActivePlanRefresh);
  const applyActivePlanRefreshProposalFn = useServerFn(applyActivePlanRefreshProposal);
  const previewActivePlanScheduleEditFn = useServerFn(previewActivePlanScheduleEdit);
  const applyActivePlanScheduleReflowPreviewFn = useServerFn(applyActivePlanScheduleReflowPreview);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportFrameRef = useRef<HTMLIFrameElement | null>(null);
  const exportResetTimerRef = useRef<number | null>(null);
  const refreshSuccessTimerRef = useRef<number | null>(null);
  const asyncToastTimersRef = useRef<number[]>([]);
  const dismissedAsyncToastIdsRef = useRef<Set<string>>(new Set());

  const planMeta = snapshot?.planMeta;
  const defaultStartDate = snapshot?.currentDate ?? todayLocalIso();
  const initialScheduleDefaults = deriveScheduleEditDefaults(snapshot);
  const [authoringText, setAuthoringText] = useState("");
  const [textStatus, setTextStatus] = useState<PlanTextReplacementStatus>("idle");
  const [textError, setTextError] = useState<string | null>(null);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [importedPlan, setImportedPlan] = useState<ImportedPlan | null>(null);
  const [requestedStartDate, setRequestedStartDate] = useState(defaultStartDate);
  const [jsonStatus, setJsonStatus] = useState<PlanImportStatus>("idle");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const [deleteStatus, setDeleteStatus] = useState<PlanLifecycleDeleteStatus>("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const [clearStatus, setClearStatus] = useState<PlanLifecycleClearStatus>("idle");
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearConfirmed, setClearConfirmed] = useState(false);
  const [clearBeforeImport, setClearBeforeImport] = useState(false);
  const [exportStatus, setExportStatus] = useState<PlanExportStatus>("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [refreshPrompt, setRefreshPrompt] = useState("");
  const [refreshStatus, setRefreshStatus] = useState<PlanRefreshStatus>("idle");
  const [refreshApplyStatus, setRefreshApplyStatus] = useState<PlanRefreshApplyStatus>("idle");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshStaleMessage, setRefreshStaleMessage] = useState<string | null>(null);
  const [refreshDecisionMessage, setRefreshDecisionMessage] = useState<string | null>(null);
  const [refreshResult, setRefreshResult] = useState<Extract<
    ProposeActivePlanRefreshResult,
    { ok: true }
  > | null>(null);
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
    textStatus !== "idle" ||
    jsonStatus !== "idle" ||
    deleteStatus !== "idle" ||
    clearStatus !== "idle" ||
    exportStatus !== "idle" ||
    refreshStatus !== "idle" ||
    refreshApplyStatus !== "idle" ||
    schedulePreviewStatus !== "idle" ||
    scheduleApplyStatus !== "idle";
  const importedSummary = importedPlan ? summarizeImportedPlan(importedPlan) : null;
  const replaceBlockedReason = isReplaceBlockedError(jsonError) ? jsonError : null;
  const canOfferClearBeforeImport = Boolean(planMeta && requestedStartDate > defaultStartDate);
  const runnerLabel = planMeta?.createdFor ?? viewer?.name ?? "Runner";
  const planWorkoutCount =
    snapshot?.workouts.filter((workout) => workout.type !== "rest").length ?? 0;
  const planDayCount = snapshot?.workouts.length ?? 0;
  const scheduleSummary = deriveScheduleEditSummary(snapshot, initialScheduleDefaults);

  useEffect(() => {
    if (!open) {
      setAuthoringText("");
      setTextStatus("idle");
      setTextError(null);
      setSelectedFileName(null);
      setJsonDraft("");
      setImportedPlan(null);
      setRequestedStartDate(defaultStartDate);
      setJsonStatus("idle");
      setJsonError(null);
      setFieldErrors([]);
      setDeleteStatus("idle");
      setDeleteError(null);
      setDeleteConfirmed(false);
      setClearStatus("idle");
      setClearError(null);
      setClearConfirmed(false);
      setClearBeforeImport(false);
      if (exportResetTimerRef.current != null && typeof window !== "undefined") {
        window.clearTimeout(exportResetTimerRef.current);
        exportResetTimerRef.current = null;
      }
      setExportStatus("idle");
      setExportError(null);
      setRefreshPrompt("");
      setRefreshStatus("idle");
      setRefreshApplyStatus("idle");
      setRefreshError(null);
      setRefreshStaleMessage(null);
      setRefreshDecisionMessage(null);
      setRefreshResult(null);
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
      if (refreshSuccessTimerRef.current != null && typeof window !== "undefined") {
        window.clearTimeout(refreshSuccessTimerRef.current);
        refreshSuccessTimerRef.current = null;
      }
    }
  }, [defaultStartDate, open, snapshot]);

  useEffect(() => {
    return () => {
      clearAsyncToastTimers(asyncToastTimersRef);
      hitoToast.dismiss(REFRESH_ACTION_TOAST_ID);
    };
  }, []);

  const showWorkingAsyncToast = ({
    id,
    title,
    description,
    stageOneDescription,
    stageTwoDescription,
  }: {
    id: string;
    title: string;
    description: string;
    stageOneDescription: string;
    stageTwoDescription: string;
  }) => {
    clearAsyncToastTimers(asyncToastTimersRef);
    dismissedAsyncToastIdsRef.current.delete(id);
    showWorkingToast(id, title, description, dismissedAsyncToastIdsRef);

    if (typeof window === "undefined") {
      return;
    }

    asyncToastTimersRef.current = [
      window.setTimeout(() => {
        if (!dismissedAsyncToastIdsRef.current.has(id)) {
          showWorkingToast(id, title, stageOneDescription, dismissedAsyncToastIdsRef);
        }
      }, ASYNC_TOAST_STAGE_ONE_MS),
      window.setTimeout(() => {
        if (!dismissedAsyncToastIdsRef.current.has(id)) {
          showWorkingToast(id, title, stageTwoDescription, dismissedAsyncToastIdsRef);
        }
      }, ASYNC_TOAST_STAGE_TWO_MS),
    ];
  };

  const showResolvedAsyncToast = ({
    id,
    type,
    title,
    description,
  }: {
    id: string;
    type: "success" | "error";
    title: string;
    description: string;
  }) => {
    clearAsyncToastTimers(asyncToastTimersRef);
    dismissedAsyncToastIdsRef.current.delete(id);

    const toastOptions = {
      id,
      duration: type === "success" ? 2800 : 7600,
      title,
      description,
    };

    if (type === "success") {
      hitoToast.success(toastOptions);
      return;
    }

    hitoToast.error(toastOptions);
  };

  const validateJsonDraft = (raw: string) => {
    setJsonStatus("parsing");
    setJsonError(null);
    setFieldErrors([]);
    setImportedPlan(null);

    const validation = validateImportedPlanJson(raw);

    if (!validation) {
      setJsonStatus("idle");
      setJsonError("The JSON content could not be parsed.");
      return;
    }

    if (!validation.success) {
      setFieldErrors(
        validation.error.issues.map((issue) => formatIssue(issue.path, issue.message)),
      );
      setJsonStatus("idle");
      return;
    }

    setImportedPlan(validation.data);
    setJsonStatus("idle");
  };

  const submitTextPlan = async () => {
    const trimmed = authoringText.trim();

    setTextError(null);

    if (trimmed.length < 20) {
      setTextError("Add a bit more detail so we can build the plan.");
      return;
    }

    setTextStatus("creating");

    try {
      const result = await completeTextOnboardingFn({
        data: {
          authoringText: trimmed,
          firstDayResolution: null,
        },
      });

      if (!result.ok) {
        setTextStatus("idle");
        setTextError("Could not create that plan yet. Refresh and try again.");
        return;
      }

      finishAtHome(onOpenChange);
    } catch (submitError) {
      setTextStatus("idle");
      setTextError(
        submitError instanceof Error ? submitError.message : "Could not create the plan.",
      );
    }
  };

  const submitImportedPlan = async (firstDayResolution: FirstDayResolution | null) => {
    if (!importedPlan) {
      setJsonError("Upload a valid JSON file before importing the plan.");
      return;
    }

    if (!requestedStartDate) {
      setJsonError("Choose when this plan should start.");
      return;
    }

    setJsonStatus("importing");
    setJsonError(null);

    try {
      if (clearBeforeImport && canOfferClearBeforeImport) {
        await clearUpcomingScheduleFn();
      }

      const result = await completeOnboardingFn({
        data: {
          importedPlan,
          firstDayResolution,
          requestedStartDate,
        },
      });

      if (!result.ok) {
        setJsonStatus("idle");
        setJsonError("Could not apply that plan yet. Refresh and try again.");
        return;
      }

      finishAtHome(onOpenChange);
    } catch (submitError) {
      setJsonStatus("idle");
      setJsonError(describeApplyError(submitError));
    }
  };

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

  const submitDeletePlan = async () => {
    setDeleteStatus("deleting");
    setDeleteError(null);

    try {
      await deleteActivePlanFn();
      finishAtHome(onOpenChange);
    } catch (submitError) {
      setDeleteStatus("idle");
      setDeleteError(submitError instanceof Error ? submitError.message : "Could not delete plan.");
    }
  };

  const submitExport = (format: "json" | "markdown") => {
    setExportStatus(format === "json" ? "exporting-json" : "exporting-markdown");
    setExportError(null);

    try {
      startPlanExportDownload(format, exportFrameRef.current?.name);
      scheduleExportStatusReset(exportResetTimerRef, setExportStatus);
    } catch (submitError) {
      setExportStatus("idle");
      setExportError(
        submitError instanceof Error
          ? submitError.message
          : "Could not start the active plan download.",
      );
    }
  };

  const submitRefreshProposal = async () => {
    const trimmed = refreshPrompt.trim();

    setRefreshError(null);
    setRefreshStaleMessage(null);
    setRefreshDecisionMessage(null);
    setRefreshApplyStatus("idle");
    setRefreshResult(null);

    if (trimmed.length < 8) {
      setRefreshError("Add a short note about what should change.");
      return;
    }

    setRefreshStatus("proposing");
    showWorkingAsyncToast({
      id: REFRESH_ACTION_TOAST_ID,
      title: "Preparing plan update",
      description:
        "This can take a little while. You can keep reviewing the proposal area while Hito works.",
      stageOneDescription:
        "Still working through your saved plan, recent logs, and comparison signals.",
      stageTwoDescription:
        "This proposal can take around a minute when the review window is larger.",
    });

    try {
      const result = await proposeActivePlanRefreshFn({
        data: {
          runnerPrompt: trimmed,
        },
      });

      if (!result.ok) {
        setRefreshStatus("idle");
        setRefreshError(result.message);
        showResolvedAsyncToast({
          id: REFRESH_ACTION_TOAST_ID,
          type: "error",
          title: "Proposal not available",
          description: result.message,
        });
        return;
      }

      setRefreshResult(result);
      setRefreshStatus("idle");
      showResolvedAsyncToast({
        id: REFRESH_ACTION_TOAST_ID,
        type: "success",
        title: "Proposal ready",
        description: "Review it before applying anything.",
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not generate a plan update proposal.";
      setRefreshStatus("idle");
      setRefreshError(message);
      showResolvedAsyncToast({
        id: REFRESH_ACTION_TOAST_ID,
        type: "error",
        title: "Proposal not ready",
        description: message,
      });
    }
  };

  const keepCurrentPlan = () => {
    setRefreshResult(null);
    setRefreshStaleMessage(null);
    setRefreshError(null);
    setRefreshApplyStatus("idle");
    setRefreshDecisionMessage("Kept current plan. Nothing changed.");
  };

  const submitApplyRefreshProposal = async () => {
    if (!refreshResult) {
      setRefreshError("Generate a proposal before applying an update.");
      return;
    }

    setRefreshApplyStatus("applying");
    setRefreshError(null);
    setRefreshStaleMessage(null);
    setRefreshDecisionMessage(null);
    showWorkingAsyncToast({
      id: REFRESH_ACTION_TOAST_ID,
      title: "Applying plan update",
      description: "Hito is rechecking the proposal before changing the active plan.",
      stageOneDescription: "Still rebuilding the remaining schedule and preserving fixed history.",
      stageTwoDescription:
        "This can take a little while when rest-day rules and recent logs need rechecking.",
    });

    try {
      const result = await applyActivePlanRefreshProposalFn({
        data: {
          proposal: refreshResult.proposal,
        },
      });

      if (!result.ok) {
        setRefreshApplyStatus("idle");
        setRefreshStaleMessage(result.message);
        showResolvedAsyncToast({
          id: REFRESH_ACTION_TOAST_ID,
          type: "error",
          title: "Update not applied",
          description: result.message,
        });
        return;
      }

      setRefreshApplyStatus("idle");
      setRefreshResult(null);
      setRefreshDecisionMessage(
        `Plan updated. ${result.refreshedWorkoutCount} future workouts are now in the active plan. Opening the updated plan...`,
      );
      showResolvedAsyncToast({
        id: REFRESH_ACTION_TOAST_ID,
        type: "success",
        title: "Plan updated",
        description: "The refreshed plan is now active.",
      });

      if (typeof window !== "undefined") {
        refreshSuccessTimerRef.current = window.setTimeout(() => {
          finishAtHome(onOpenChange);
        }, APPLY_SUCCESS_REDIRECT_DELAY_MS);
      } else {
        finishAtHome(onOpenChange);
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not apply the plan update.";
      setRefreshApplyStatus("idle");
      setRefreshError(message);
      showResolvedAsyncToast({
        id: REFRESH_ACTION_TOAST_ID,
        type: "error",
        title: "Update not applied",
        description: message,
      });
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
          title: "Update plan needed",
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

  const useSchedulePromptInRefresh = (prompt: string) => {
    setRefreshPrompt(prompt);
    setRefreshError(null);
    setRefreshStaleMessage(null);
    setRefreshDecisionMessage(
      "Schedule prompt copied to Update plan. Generate a proposal there before applying anything.",
    );
    setRefreshResult(null);
    hitoToast.success({
      title: "Prompt copied",
      description: "Open Update plan to generate a reviewed proposal.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="hito-dialog-overlay-stable"
        className="hito-dialog-stable hito-product-dialog h-[min(44rem,calc(100dvh-2rem))] max-w-2xl border-hairline bg-background/95 p-0 backdrop-blur-xl"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Open plan</DialogTitle>
          <DialogDescription className="hito-body max-w-lg">
            Review the active plan, create a replacement, or clear the current schedule.
          </DialogDescription>
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
              exportStatus={exportStatus}
              exportError={exportError}
              isBusy={isBusy}
              onExport={submitExport}
            />

            <PlanRefreshPanel
              available={Boolean(planMeta)}
              prompt={refreshPrompt}
              status={refreshStatus}
              applyStatus={refreshApplyStatus}
              result={refreshResult}
              error={refreshError}
              staleMessage={refreshStaleMessage}
              decisionMessage={refreshDecisionMessage}
              isBusy={isBusy}
              onPromptChange={(value) => {
                setRefreshPrompt(value);
                setRefreshError(null);
                setRefreshStaleMessage(null);
                setRefreshDecisionMessage(null);
                setRefreshResult(null);
              }}
              onGenerate={() => {
                void submitRefreshProposal();
              }}
              onApply={() => {
                void submitApplyRefreshProposal();
              }}
              onKeepCurrentPlan={keepCurrentPlan}
            />

            <PlanScheduleEditPanel
              available={Boolean(planMeta)}
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
              onUseRefreshPrompt={useSchedulePromptInRefresh}
            />

            <PlanTextReplacementPanel
              text={authoringText}
              status={textStatus}
              error={textError}
              isBusy={isBusy}
              onTextChange={(value) => {
                setAuthoringText(value);
                setTextError(null);
              }}
              onCreatePlan={() => {
                void submitTextPlan();
              }}
            />

            <PlanImportPanel
              fileInputRef={fileInputRef}
              isBusy={isBusy}
              selectedFileName={selectedFileName}
              jsonDraft={jsonDraft}
              importedPlanAvailable={Boolean(importedPlan)}
              importedSummary={importedSummary}
              requestedStartDate={requestedStartDate}
              defaultStartDate={defaultStartDate}
              clearBeforeImport={clearBeforeImport}
              canOfferClearBeforeImport={canOfferClearBeforeImport}
              fieldErrors={fieldErrors}
              jsonError={jsonError}
              status={jsonStatus}
              replaceBlockedReason={replaceBlockedReason}
              onFileChange={(file) => {
                setImportedPlan(null);
                setFieldErrors([]);
                setJsonError(null);

                if (!file) {
                  setSelectedFileName(null);
                  return;
                }

                setSelectedFileName(file.name);

                void file
                  .text()
                  .then((raw) => {
                    setJsonDraft(raw);
                    validateJsonDraft(raw);
                  })
                  .catch(() => {
                    setJsonStatus("idle");
                    setJsonError("The file could not be read as valid JSON.");
                  });
              }}
              onUploadClick={() => fileInputRef.current?.click()}
              onJsonDraftChange={(value) => {
                setJsonDraft(value);
                setImportedPlan(null);
                setFieldErrors([]);
                setJsonError(null);
              }}
              onValidateJson={() => validateJsonDraft(jsonDraft)}
              onRequestedStartDateChange={setRequestedStartDate}
              onClearBeforeImportChange={setClearBeforeImport}
              onImport={(firstDayResolution) => {
                void submitImportedPlan(firstDayResolution);
              }}
            />

            <PlanLifecycleControls
              planAvailable={Boolean(planMeta)}
              isBusy={isBusy}
              clearStatus={clearStatus}
              clearError={clearError}
              clearConfirmed={clearConfirmed}
              deleteStatus={deleteStatus}
              deleteError={deleteError}
              deleteConfirmed={deleteConfirmed}
              onClearConfirmedChange={setClearConfirmed}
              onDeleteConfirmedChange={setDeleteConfirmed}
              onClearUpcomingSchedule={() => {
                void submitClearUpcomingSchedule();
              }}
              onDeletePlan={() => {
                void submitDeletePlan();
              }}
            />
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
        <iframe
          ref={exportFrameRef}
          name="plan-export-download-frame"
          title="Plan export download"
          className="hidden"
          onLoad={() => {
            const frame = exportFrameRef.current;
            const bodyText = frame?.contentDocument?.body?.textContent?.trim();

            if (!bodyText) {
              return;
            }

            setExportStatus("idle");
            setExportError(bodyText);
          }}
        />
      </DialogContent>
    </Dialog>
  );
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

function startPlanExportDownload(
  format: "json" | "markdown",
  targetFrame = "plan-export-download-frame",
) {
  if (typeof window === "undefined") {
    throw new Error("Plan export can only start in the browser.");
  }

  const form = window.document.createElement("form");
  form.method = "GET";
  form.action = "/api/plan/export";
  form.target = targetFrame;
  form.style.display = "none";

  const formatField = window.document.createElement("input");
  formatField.type = "hidden";
  formatField.name = "format";
  formatField.value = format;

  form.appendChild(formatField);
  window.document.body.appendChild(form);
  form.submit();
  form.remove();
}

function scheduleExportStatusReset(
  exportResetTimerRef: MutableRefObject<number | null>,
  setExportStatus: Dispatch<SetStateAction<PlanExportStatus>>,
) {
  if (typeof window === "undefined") {
    setExportStatus("idle");
    return;
  }

  if (exportResetTimerRef.current != null) {
    window.clearTimeout(exportResetTimerRef.current);
  }

  exportResetTimerRef.current = window.setTimeout(() => {
    setExportStatus("idle");
    exportResetTimerRef.current = null;
  }, 1200);
}

function clearAsyncToastTimers(timerRef: MutableRefObject<number[]>) {
  if (typeof window === "undefined") {
    timerRef.current = [];
    return;
  }

  timerRef.current.forEach((timerId) => window.clearTimeout(timerId));
  timerRef.current = [];
}

function showWorkingToast(
  id: string,
  title: string,
  description: string,
  dismissedIdsRef: MutableRefObject<Set<string>>,
) {
  hitoToast.working({
    id,
    title,
    description,
    onDismiss: () => {
      dismissedIdsRef.current.add(id);
    },
  });
}

function formatIssue(path: (string | number)[], message: string) {
  if (!path.length) {
    return message;
  }

  return `${path.join(".")}: ${message}`;
}

function describeApplyError(submitError: unknown) {
  if (!(submitError instanceof Error)) {
    return "Could not apply the imported plan.";
  }

  if (/load failed|failed to fetch|networkerror/i.test(submitError.message)) {
    return "The import request did not complete, so the current saved plan was left unchanged. Retry the apply step.";
  }

  if (/not authenticated|signed in|session/i.test(submitError.message)) {
    return "Your sign-in session expired before the plan could be applied. Sign in again and retry.";
  }

  return submitError.message;
}

function isReplaceBlockedError(message: string | null) {
  return Boolean(
    message &&
    /would detach saved workout history|apply step is blocked|current saved plan stays unchanged/i.test(
      message,
    ),
  );
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
