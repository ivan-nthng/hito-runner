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
  FUTURE_TEMPLATE_DOWNLOAD_PATH,
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
  proposeActivePlanRefresh,
  type ProposeActivePlanRefreshResult,
  type ViewerSummary,
} from "@/lib/training-api";
import { formatDate, type TrainingSnapshot } from "@/lib/training";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hitoToast } from "@/components/ui/hito-toast";
import { Icon } from "@/components/ui/icon";

type TextStatus = "idle" | "creating";
type JsonStatus = "idle" | "parsing" | "importing";
type DeleteStatus = "idle" | "deleting";
type ClearStatus = "idle" | "clearing";
type ExportStatus = "idle" | "exporting-json" | "exporting-markdown";
type RefreshStatus = "idle" | "proposing";
type RefreshApplyStatus = "idle" | "applying";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportFrameRef = useRef<HTMLIFrameElement | null>(null);
  const exportResetTimerRef = useRef<number | null>(null);
  const refreshSuccessTimerRef = useRef<number | null>(null);
  const asyncToastTimersRef = useRef<number[]>([]);
  const dismissedAsyncToastIdsRef = useRef<Set<string>>(new Set());

  const planMeta = snapshot?.planMeta;
  const defaultStartDate = snapshot?.currentDate ?? todayLocalIso();
  const [authoringText, setAuthoringText] = useState("");
  const [textStatus, setTextStatus] = useState<TextStatus>("idle");
  const [textError, setTextError] = useState<string | null>(null);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [importedPlan, setImportedPlan] = useState<ImportedPlan | null>(null);
  const [requestedStartDate, setRequestedStartDate] = useState(defaultStartDate);
  const [jsonStatus, setJsonStatus] = useState<JsonStatus>("idle");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const [clearStatus, setClearStatus] = useState<ClearStatus>("idle");
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearConfirmed, setClearConfirmed] = useState(false);
  const [clearBeforeImport, setClearBeforeImport] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [refreshPrompt, setRefreshPrompt] = useState("");
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>("idle");
  const [refreshApplyStatus, setRefreshApplyStatus] = useState<RefreshApplyStatus>("idle");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshStaleMessage, setRefreshStaleMessage] = useState<string | null>(null);
  const [refreshDecisionMessage, setRefreshDecisionMessage] = useState<string | null>(null);
  const [refreshResult, setRefreshResult] = useState<ProposeActivePlanRefreshResult | null>(null);

  const isBusy =
    textStatus !== "idle" ||
    jsonStatus !== "idle" ||
    deleteStatus !== "idle" ||
    clearStatus !== "idle" ||
    exportStatus !== "idle" ||
    refreshStatus !== "idle" ||
    refreshApplyStatus !== "idle";
  const importedSummary = importedPlan ? summarizeImportedPlan(importedPlan) : null;
  const replaceBlockedReason = isReplaceBlockedError(jsonError) ? jsonError : null;
  const canOfferClearBeforeImport = Boolean(planMeta && requestedStartDate > defaultStartDate);
  const runnerLabel = planMeta?.createdFor ?? viewer?.name ?? "Runner";
  const planWorkoutCount =
    snapshot?.workouts.filter((workout) => workout.type !== "rest").length ?? 0;
  const planDayCount = snapshot?.workouts.length ?? 0;

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
      if (refreshSuccessTimerRef.current != null && typeof window !== "undefined") {
        window.clearTimeout(refreshSuccessTimerRef.current);
        refreshSuccessTimerRef.current = null;
      }
    }
  }, [defaultStartDate, open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="hito-dialog-overlay-stable"
        className="hito-dialog-stable hito-product-dialog h-[min(44rem,calc(100dvh-2rem))] max-w-2xl border-hairline bg-background/95 p-0 backdrop-blur-xl"
      >
        <DialogHeader className="border-b border-hairline px-6 py-5 text-left">
          <DialogTitle className="hito-modal-title">Open plan</DialogTitle>
          <DialogDescription className="hito-body max-w-lg">
            Review the active plan, create a replacement, or clear the current schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body">
          <div className="grid gap-6">
            <section className="grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="hito-label hito-label-signal">Current plan</p>
                  <h2 className="hito-section-title mt-2">{planMeta?.title ?? "Saved plan"}</h2>
                  <p className="hito-body mt-2 max-w-xl">
                    {planMeta?.goal ??
                      snapshot?.profile?.goalLabel ??
                      `Saved schedule for ${runnerLabel}.`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {planMeta ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          disabled={isBusy}
                          className="hito-button hito-button-ghost hito-button-sm"
                        >
                          <Icon name="download" size="sm" className="text-signal" />
                          {exportStatus === "idle" ? "Export" : "Preparing..."}
                          <Icon name="chevron-down" size="xs" className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Export active plan</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isBusy}
                          onSelect={(event) => {
                            event.preventDefault();
                            submitExport("json");
                          }}
                        >
                          <Icon name="import" size="sm" />
                          Export as JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isBusy}
                          onSelect={(event) => {
                            event.preventDefault();
                            submitExport("markdown");
                          }}
                        >
                          <Icon name="file-text" size="sm" />
                          Export as Markdown
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                  <span className="hito-status-pill" data-tone="success">
                    Active
                  </span>
                </div>
              </div>

              <div className="hito-row-group">
                <div className="hito-list-row">
                  <div>
                    <p className="hito-list-row-title">
                      {planMeta
                        ? `${planMeta.startDate >= defaultStartDate ? "Starts" : "Started"} ${formatDate(
                            planMeta.startDate,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}`
                        : "Plan dates unavailable"}
                    </p>
                    <p className="hito-list-row-copy">
                      {planDayCount} days · {planWorkoutCount} workouts
                      {planMeta?.raceDate
                        ? ` · target ${formatDate(planMeta.raceDate, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                  </div>
                  <Icon name="calendar" size="sm" className="text-muted-foreground" />
                </div>
              </div>

              {exportError ? <p className="hito-field-error">{exportError}</p> : null}
            </section>

            {planMeta ? (
              <details className="hito-disclosure">
                <summary className="hito-disclosure-summary">
                  <span>Update plan</span>
                  <Icon name="chevron-down" className="hito-disclosure-chevron" />
                </summary>
                <div className="hito-disclosure-body">
                  <div className="grid gap-4">
                    <div className="flex items-start gap-3">
                      <Icon name="refresh" size="sm" className="mt-0.5 text-signal" />
                      <div>
                        <p className="hito-list-row-title">
                          Ask for a proposal from your saved history.
                        </p>
                        <p className="hito-body-small mt-1 max-w-xl">
                          Hito reviews the active plan, recent logs, Garmin-backed comparison
                          signals, and workout body-note cautions. This does not apply changes.
                        </p>
                      </div>
                    </div>

                    <label className="grid gap-2">
                      <span className="hito-form-label">What should change?</span>
                      <textarea
                        rows={3}
                        maxLength={1200}
                        value={refreshPrompt}
                        disabled={isBusy}
                        onChange={(event) => {
                          setRefreshPrompt(event.target.value);
                          setRefreshError(null);
                          setRefreshStaleMessage(null);
                          setRefreshDecisionMessage(null);
                          setRefreshResult(null);
                        }}
                        placeholder="Example: I missed a few days and feel heavy. Adjust the rest of the plan without changing my race goal."
                        className="hito-field hito-textarea-md resize-y"
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={isBusy || refreshPrompt.trim().length < 8}
                        onClick={() => {
                          void submitRefreshProposal();
                        }}
                        className="hito-button hito-button-secondary hito-button-md"
                      >
                        <Icon name="refresh" size="sm" />
                        {refreshStatus === "proposing"
                          ? "Preparing proposal..."
                          : "Generate proposal"}
                      </button>
                      <span className="hito-field-helper">
                        Nothing changes until you choose Apply update.
                      </span>
                    </div>

                    {refreshError ? <p className="hito-field-error">{refreshError}</p> : null}
                    {refreshDecisionMessage ? (
                      <p className="hito-field-success">{refreshDecisionMessage}</p>
                    ) : null}

                    {refreshResult ? (
                      <PlanRefreshProposalReview
                        result={refreshResult}
                        applyStatus={refreshApplyStatus}
                        staleMessage={refreshStaleMessage}
                        isBusy={isBusy}
                        onApply={() => {
                          void submitApplyRefreshProposal();
                        }}
                        onKeepCurrentPlan={keepCurrentPlan}
                        onGenerateFresh={() => {
                          void submitRefreshProposal();
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </details>
            ) : null}

            <section className="hito-section-divider grid gap-4 pt-5">
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="sparkles" size="sm" className="text-signal" />
                  <h3 className="hito-panel-title">Create a new plan</h3>
                </div>
                <p className="hito-body mt-2 max-w-xl">
                  Describe what should change. Hito will create a fresh saved plan from your
                  request.
                </p>
              </div>

              <label className="grid gap-2">
                <span className="hito-form-label">Plan request</span>
                <textarea
                  rows={5}
                  value={authoringText}
                  onChange={(event) => {
                    setAuthoringText(event.target.value);
                    setTextError(null);
                  }}
                  placeholder="Example: Build me a 10-week half marathon plan starting from 4 runs per week. Keep Mondays free and make the long run on Sunday."
                  className="hito-field hito-textarea-md resize-y"
                />
              </label>

              {textError && <p className="hito-field-error">{textError}</p>}

              <div>
                <button
                  type="button"
                  disabled={isBusy || authoringText.trim().length < 20}
                  onClick={() => {
                    void submitTextPlan();
                  }}
                  className="hito-button hito-button-primary hito-button-md"
                >
                  {textStatus === "creating" ? "Creating plan..." : "Create new plan"}
                </button>
              </div>
            </section>

            <details className="hito-disclosure">
              <summary className="hito-disclosure-summary">
                <span>Import from JSON</span>
                <Icon name="chevron-down" className="hito-disclosure-chevron" />
              </summary>
              <div className="hito-disclosure-body">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    setImportedPlan(null);
                    setFieldErrors([]);
                    setJsonError(null);

                    if (!file) {
                      setSelectedFileName(null);
                      return;
                    }

                    setSelectedFileName(file.name);

                    try {
                      const raw = await file.text();
                      setJsonDraft(raw);
                      validateJsonDraft(raw);
                    } catch {
                      setJsonStatus("idle");
                      setJsonError("The file could not be read as valid JSON.");
                    }
                  }}
                />

                <div className="grid gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => fileInputRef.current?.click()}
                      className="hito-button hito-button-secondary hito-button-md"
                    >
                      <Icon name="upload" size="sm" />
                      {selectedFileName ? "Choose another file" : "Upload JSON"}
                    </button>
                    {selectedFileName && (
                      <span className="hito-body-small">{selectedFileName}</span>
                    )}
                    <a
                      href={FUTURE_TEMPLATE_DOWNLOAD_PATH}
                      download
                      className="hito-button hito-button-ghost hito-button-sm"
                    >
                      <Icon name="download" size="sm" className="text-signal" />
                      Template
                    </a>
                  </div>

                  <label className="grid gap-2">
                    <span className="hito-form-label">Paste plan JSON</span>
                    <textarea
                      rows={6}
                      value={jsonDraft}
                      onChange={(event) => {
                        setJsonDraft(event.target.value);
                        setImportedPlan(null);
                        setFieldErrors([]);
                        setJsonError(null);
                      }}
                      placeholder='{"schema_version":"training-plan-v2","plan_name":"...","planned_workouts":[...]}'
                      className="hito-field hito-textarea-md hito-technical-mono"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isBusy || !jsonDraft.trim()}
                      onClick={() => validateJsonDraft(jsonDraft)}
                      className="hito-button hito-button-secondary hito-button-md"
                    >
                      Check JSON
                    </button>
                    <span className="hito-field-helper">JSON stays the advanced path.</span>
                  </div>

                  {importedSummary && (
                    <div className="hito-row-group">
                      <div className="hito-list-row items-start">
                        <div>
                          <p className="hito-list-row-title">Choose the start day</p>
                          <p className="hito-list-row-copy">
                            {importedSummary.days} days · {importedSummary.workouts} workouts.
                          </p>
                        </div>
                        <span className="hito-status-pill" data-tone="success">
                          Valid
                        </span>
                      </div>
                      <div className="hito-list-row items-start">
                        <label className="grid flex-1 gap-2">
                          <span className="hito-form-label">Start training</span>
                          <input
                            type="date"
                            min={defaultStartDate}
                            value={requestedStartDate}
                            onChange={(event) => setRequestedStartDate(event.target.value)}
                            className="hito-field hito-field-md"
                          />
                          <span className="hito-field-helper">
                            Hito applies this plan from the date you choose here; the JSON start
                            date stays source metadata, and fixed rest days may still affect workout
                            placement.
                          </span>
                        </label>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className="hito-button hito-button-ghost hito-button-xs"
                            onClick={() => setRequestedStartDate(defaultStartDate)}
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            className="hito-button hito-button-ghost hito-button-xs"
                            onClick={() => setRequestedStartDate(addDaysIso(defaultStartDate, 1))}
                          >
                            Tomorrow
                          </button>
                          <button
                            type="button"
                            className="hito-button hito-button-ghost hito-button-xs"
                            onClick={() => setRequestedStartDate(addDaysIso(defaultStartDate, 7))}
                          >
                            Next week
                          </button>
                        </div>
                      </div>
                      {canOfferClearBeforeImport && (
                        <div className="hito-list-row items-start">
                          <label className="hito-body flex max-w-xl items-start gap-3">
                            <input
                              type="checkbox"
                              checked={clearBeforeImport}
                              disabled={isBusy}
                              onChange={(event) => setClearBeforeImport(event.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-hairline text-signal focus:ring-signal"
                            />
                            <span>
                              Remove the current upcoming schedule before this later-starting plan
                              is applied. Saved workout history stays preserved.
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {fieldErrors.length > 0 && (
                    <div className="hito-row-group">
                      <div className="hito-list-row items-start">
                        <div>
                          <p className="hito-label text-destructive">JSON issues</p>
                          <div className="mt-2 space-y-1">
                            {fieldErrors.slice(0, 5).map((issue) => (
                              <p key={issue} className="hito-field-error">
                                {issue}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {jsonError && <p className="hito-field-error">{jsonError}</p>}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isBusy || !importedPlan || !requestedStartDate}
                      onClick={() => {
                        void submitImportedPlan(null);
                      }}
                      className="hito-button hito-button-secondary hito-button-md"
                    >
                      <Icon name="import" size="sm" />
                      {jsonStatus === "importing" ? "Importing plan..." : "Import JSON plan"}
                    </button>
                  </div>

                  <details className="hito-disclosure">
                    <summary className="hito-disclosure-summary">
                      <span>Need the first workout to replace the start day?</span>
                      <Icon name="chevron-down" className="hito-disclosure-chevron" />
                    </summary>
                    <div className="hito-disclosure-body">
                      <p className="hito-field-helper">
                        Safe import keeps the existing workout on that date if one is present.
                        Replace only if the file&apos;s first workout should overwrite it.
                      </p>
                      {replaceBlockedReason ? (
                        <p className="hito-field-error">
                          Replace is unavailable because it would detach saved workout history.
                        </p>
                      ) : null}
                      <div>
                        <button
                          type="button"
                          disabled={
                            isBusy ||
                            !importedPlan ||
                            !requestedStartDate ||
                            Boolean(replaceBlockedReason)
                          }
                          onClick={() => {
                            void submitImportedPlan("replace_first_day");
                          }}
                          className="hito-button hito-button-outlined hito-button-sm border-destructive/28 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          {jsonStatus === "importing" ? "Replacing..." : "Replace start day"}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </details>

            <details className="hito-disclosure">
              <summary className="hito-disclosure-summary">
                <span>Clear upcoming schedule</span>
                <Icon name="chevron-down" className="hito-disclosure-chevron" />
              </summary>
              <div className="hito-disclosure-body">
                <div className="flex items-start gap-3">
                  <Icon name="clear-calendar" size="sm" className="mt-0.5 text-signal" />
                  <p className="hito-field-helper max-w-xl">
                    This removes the current active upcoming schedule from view so you can start a
                    later plan cleanly. Planned workouts and saved workout logs stay preserved as
                    history.
                  </p>
                </div>
                {clearError && <p className="hito-field-error">{clearError}</p>}
                <label className="hito-body flex max-w-xl items-start gap-3">
                  <input
                    type="checkbox"
                    checked={clearConfirmed}
                    disabled={isBusy}
                    onChange={(event) => setClearConfirmed(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-hairline text-signal focus:ring-signal"
                  />
                  <span>
                    I understand this clears the active upcoming schedule and keeps history
                    archived.
                  </span>
                </label>
                <div>
                  <button
                    type="button"
                    disabled={isBusy || !planMeta || !clearConfirmed}
                    onClick={() => {
                      void submitClearUpcomingSchedule();
                    }}
                    className="hito-button hito-button-secondary hito-button-sm"
                  >
                    <Icon name="clear-calendar" size="sm" />
                    {clearStatus === "clearing"
                      ? "Clearing schedule..."
                      : "Clear upcoming schedule"}
                  </button>
                </div>
              </div>
            </details>

            <details className="hito-disclosure">
              <summary className="hito-disclosure-summary">
                <span>Delete active plan</span>
                <Icon name="chevron-down" className="hito-disclosure-chevron" />
              </summary>
              <div className="hito-disclosure-body">
                <div className="flex items-start gap-3">
                  <Icon name="warning" size="sm" className="mt-0.5 text-destructive" />
                  <p className="hito-field-helper max-w-xl">
                    This archives the current active plan and clears your schedule. Logged workout
                    history stays attached to the archived plan.
                  </p>
                </div>
                {deleteError && <p className="hito-field-error">{deleteError}</p>}
                <label className="hito-body flex max-w-xl items-start gap-3">
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    disabled={isBusy}
                    onChange={(event) => setDeleteConfirmed(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-hairline text-signal focus:ring-signal"
                  />
                  <span>
                    I understand this clears the active schedule and keeps history archived.
                  </span>
                </label>
                <div>
                  <button
                    type="button"
                    disabled={isBusy || !planMeta || !deleteConfirmed}
                    onClick={() => {
                      void submitDeletePlan();
                    }}
                    className="hito-button hito-button-outlined hito-button-sm border-destructive/28 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Icon name="trash" size="sm" />
                    {deleteStatus === "deleting" ? "Deleting plan..." : "Delete plan"}
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>

        <DialogFooter className="hito-section-divider px-6 py-4 sm:space-x-0">
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

function PlanRefreshProposalReview({
  result,
  applyStatus,
  staleMessage,
  isBusy,
  onApply,
  onKeepCurrentPlan,
  onGenerateFresh,
}: {
  result: ProposeActivePlanRefreshResult;
  applyStatus: RefreshApplyStatus;
  staleMessage: string | null;
  isBusy: boolean;
  onApply: () => void;
  onKeepCurrentPlan: () => void;
  onGenerateFresh: () => void;
}) {
  const proposal = result.proposal.output;
  const review = proposal.review;
  const isApplying = applyStatus === "applying";

  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Proposal only</p>
          <p className="hito-list-row-copy">{review.summary}</p>
        </div>
        <span className="hito-status-pill" data-tone="signal">
          Review
        </span>
      </div>

      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">Why this update</p>
          <ul className="hito-body-small mt-2 grid gap-1.5">
            {review.rationale.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">What would change from today forward</p>
          <ul className="hito-body-small mt-2 grid gap-1.5">
            {review.proposedChanges.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      {review.keepAsIs.length > 0 ? (
        <div className="hito-list-row items-start">
          <div className="min-w-0">
            <p className="hito-list-row-title">What stays the same</p>
            <ul className="hito-body-small mt-2 grid gap-1.5">
              {review.keepAsIs.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Scope under review</p>
          <p className="hito-list-row-copy">{review.scope.label}</p>
        </div>
        <span className="hito-status-pill" data-tone="success">
          Future only
        </span>
      </div>

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Caution context</p>
          {review.cautionContext.included ? (
            <div className="mt-2 grid gap-1.5">
              <p className="hito-list-row-copy">{review.cautionContext.note}</p>
              {review.cautionContext.bodyNoteCautions.map((caution) => (
                <p key={`${caution.date}-${caution.title}`} className="hito-list-row-copy">
                  {formatDate(caution.date, { month: "short", day: "numeric" })}: {caution.title},
                  body-note severity up to {caution.maxSeverity}.
                </p>
              ))}
            </div>
          ) : (
            <p className="hito-list-row-copy">{review.cautionContext.note}</p>
          )}
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Nothing has changed yet</p>
          <p className="hito-list-row-copy">{review.boundaryNote}</p>
        </div>
        <span className="hito-status-pill" data-tone={isApplying ? "signal" : "warning"}>
          {isApplying ? "Applying" : "Not applied"}
        </span>
      </div>

      {staleMessage ? (
        <div className="hito-list-row items-start">
          <div>
            <p className="hito-list-row-title">Proposal no longer current</p>
            <p className="hito-list-row-copy">{staleMessage}</p>
          </div>
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            disabled={isBusy}
            onClick={onGenerateFresh}
          >
            <Icon name="refresh" size="sm" />
            Generate fresh proposal
          </button>
        </div>
      ) : null}

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Choose what happens</p>
          <p className="hito-list-row-copy">
            Hito rechecks the proposal before changing the active plan. Keeping the current plan
            leaves the schedule untouched.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <button
            type="button"
            className="hito-button hito-button-ghost hito-button-sm"
            disabled={isBusy}
            onClick={onKeepCurrentPlan}
          >
            Keep current plan
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm"
            disabled={isBusy || Boolean(staleMessage)}
            onClick={onApply}
          >
            {isApplying ? "Applying update..." : "Apply update"}
          </button>
        </div>
      </div>
    </div>
  );
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
  setExportStatus: Dispatch<SetStateAction<ExportStatus>>,
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

function addDaysIso(iso: string, days: number) {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toLocalIso(date);
}

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toLocalIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
