import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Download,
  FileJson2,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  FUTURE_TEMPLATE_DOWNLOAD_PATH,
  summarizeImportedPlan,
  type ImportedPlan,
  validateImportedPlanJson,
} from "@/lib/imported-plan";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import {
  completeOnboarding,
  completeTextOnboarding,
  deleteActivePlan,
  type ViewerSummary,
} from "@/lib/training-api";
import { formatDate, type TrainingSnapshot } from "@/lib/training";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TextStatus = "idle" | "creating";
type JsonStatus = "idle" | "parsing" | "importing";
type DeleteStatus = "idle" | "deleting";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const isBusy = textStatus !== "idle" || jsonStatus !== "idle" || deleteStatus !== "idle";
  const importedSummary = importedPlan ? summarizeImportedPlan(importedPlan) : null;
  const replaceBlockedReason = isReplaceBlockedError(jsonError) ? jsonError : null;
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
    }
  }, [defaultStartDate, open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden border-hairline bg-background/95 p-0 backdrop-blur-xl">
        <DialogHeader className="border-b border-hairline px-6 py-5 text-left">
          <DialogTitle className="font-display text-3xl">Open plan</DialogTitle>
          <DialogDescription className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Review the active plan, create a replacement, or clear the current schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="grid gap-6">
            <section className="grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="hito-label hito-label-signal">Current plan</p>
                  <h2 className="mt-2 font-display text-3xl leading-tight">
                    {planMeta?.title ?? "Saved plan"}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {planMeta?.goal ??
                      snapshot?.profile?.goalLabel ??
                      `Saved schedule for ${runnerLabel}.`}
                  </p>
                </div>
                <span className="hito-status-pill" data-tone="success">
                  Active
                </span>
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
                  <CalendarDays className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
              </div>
            </section>

            <section className="hito-section-divider grid gap-4 pt-5">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-signal" strokeWidth={1.5} />
                  <h3 className="text-base font-medium text-foreground">Create a new plan</h3>
                </div>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Describe what should change. Hito will create a fresh saved plan from your
                  request.
                </p>
              </div>

              <label className="grid gap-2">
                <span className="hito-label">Plan request</span>
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
                <ChevronDown className="hito-disclosure-chevron" />
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
                      <Upload className="h-4 w-4" />
                      {selectedFileName ? "Choose another file" : "Upload JSON"}
                    </button>
                    {selectedFileName && (
                      <span className="text-sm text-muted-foreground">{selectedFileName}</span>
                    )}
                    <a
                      href={FUTURE_TEMPLATE_DOWNLOAD_PATH}
                      download
                      className="hito-button hito-button-ghost hito-button-sm"
                    >
                      <Download className="h-4 w-4 text-signal" />
                      Template
                    </a>
                  </div>

                  <label className="grid gap-2">
                    <span className="hito-label">Paste plan JSON</span>
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
                      className="hito-field hito-textarea-md font-mono text-xs"
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
                            {importedSummary.days} days · {importedSummary.workouts} workouts. Your
                            selected day becomes day 1 of this plan.
                          </p>
                        </div>
                        <span className="hito-status-pill" data-tone="success">
                          Valid
                        </span>
                      </div>
                      <div className="hito-list-row items-start">
                        <label className="grid flex-1 gap-2">
                          <span className="hito-label">Start training</span>
                          <input
                            type="date"
                            min={defaultStartDate}
                            value={requestedStartDate}
                            onChange={(event) => setRequestedStartDate(event.target.value)}
                            className="hito-field hito-field-md"
                          />
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
                      <FileJson2 className="h-4 w-4" />
                      {jsonStatus === "importing" ? "Importing plan..." : "Import JSON plan"}
                    </button>
                  </div>

                  <details className="hito-disclosure">
                    <summary className="hito-disclosure-summary">
                      <span>Need the first workout to replace the start day?</span>
                      <ChevronDown className="hito-disclosure-chevron" />
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
                <span>Delete active plan</span>
                <ChevronDown className="hito-disclosure-chevron" />
              </summary>
              <div className="hito-disclosure-body">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="hito-field-helper max-w-xl">
                    This archives the current active plan and clears your schedule. Logged workout
                    history stays attached to the archived plan.
                  </p>
                </div>
                {deleteError && <p className="hito-field-error">{deleteError}</p>}
                <label className="flex max-w-xl items-start gap-3 text-sm leading-relaxed text-muted-foreground">
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
                    <Trash2 className="h-4 w-4" />
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
      </DialogContent>
    </Dialog>
  );
}

function finishAtHome(onOpenChange: (open: boolean) => void) {
  onOpenChange(false);

  if (typeof window !== "undefined") {
    window.location.assign("/");
  }
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
