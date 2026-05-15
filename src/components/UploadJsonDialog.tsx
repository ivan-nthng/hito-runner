import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ChevronDown, Download, Upload } from "lucide-react";
import {
  FUTURE_TEMPLATE_DOWNLOAD_PATH,
  summarizeImportedPlan,
  type ImportedPlan,
  validateImportedPlanJson,
} from "@/lib/imported-plan";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import { clearUpcomingSchedule, completeOnboarding } from "@/lib/training-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function UploadJsonDialog({
  open,
  onOpenChange,
  defaultStartDate,
  hasActivePlan = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStartDate?: string | null;
  hasActivePlan?: boolean;
}) {
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const clearUpcomingScheduleFn = useServerFn(clearUpcomingSchedule);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resolvedDefaultStartDate = defaultStartDate ?? todayLocalIso();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [importedPlan, setImportedPlan] = useState<ImportedPlan | null>(null);
  const [requestedStartDate, setRequestedStartDate] = useState(resolvedDefaultStartDate);
  const [status, setStatus] = useState<"idle" | "parsing" | "applying">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [clearBeforeImport, setClearBeforeImport] = useState(false);

  const isBusy = status !== "idle";
  const summary = importedPlan ? summarizeImportedPlan(importedPlan) : null;
  const replaceBlockedReason = isReplaceBlockedError(error) ? error : null;
  const canOfferClearBeforeImport = hasActivePlan && requestedStartDate > resolvedDefaultStartDate;

  useEffect(() => {
    if (open) {
      return;
    }

    setSelectedFileName(null);
    setJsonDraft("");
    setImportedPlan(null);
    setRequestedStartDate(resolvedDefaultStartDate);
    setStatus("idle");
    setError(null);
    setFieldErrors([]);
    setClearBeforeImport(false);
  }, [open, resolvedDefaultStartDate]);

  const submitPlan = async (firstDayResolution: FirstDayResolution | null) => {
    if (!importedPlan) {
      setError("Upload a valid JSON file before importing the plan.");
      return;
    }

    if (!requestedStartDate) {
      setError("Choose when this plan should start.");
      return;
    }

    setStatus("applying");
    setError(null);

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
        setStatus("idle");
        setError("Could not apply that plan yet. Refresh and try again.");
        return;
      }

      onOpenChange(false);

      if (typeof window !== "undefined") {
        window.location.assign("/");
      }
    } catch (submitError) {
      setStatus("idle");
      setError(describeApplyError(submitError));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden border-hairline bg-background/95 p-0 backdrop-blur-xl sm:max-h-[85dvh]">
        <DialogHeader className="border-b border-hairline px-6 py-5 text-left">
          <DialogTitle className="font-display text-3xl">Import plan</DialogTitle>
          <DialogDescription className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Use this only if you already have a Hito plan file.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
          <div className="grid gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                setImportedPlan(null);
                setFieldErrors([]);
                setError(null);

                if (!file) {
                  setSelectedFileName(null);
                  return;
                }

                setSelectedFileName(file.name);

                try {
                  const raw = await file.text();
                  setJsonDraft(raw);
                  applyValidation(raw, {
                    setError,
                    setFieldErrors,
                    setImportedPlan,
                    setStatus,
                  });
                } catch {
                  setStatus("idle");
                  setError("The file could not be read as valid JSON.");
                }
              }}
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
                className="hito-button hito-button-primary hito-button-md"
              >
                <Upload className="h-4 w-4" />
                {selectedFileName ? "Choose another file" : "Upload file"}
              </button>
              {selectedFileName && (
                <span className="text-sm text-muted-foreground">{selectedFileName}</span>
              )}
            </div>

            <details className="hito-disclosure">
              <summary className="hito-disclosure-summary">
                <span>Paste JSON or download a template</span>
                <ChevronDown className="hito-disclosure-chevron" />
              </summary>
              <div className="hito-disclosure-body">
                <div>
                  <a
                    href={FUTURE_TEMPLATE_DOWNLOAD_PATH}
                    download
                    className="hito-button hito-button-ghost hito-button-sm"
                  >
                    <Download className="h-4 w-4 text-signal" />
                    Download JSON template
                  </a>
                </div>
                <label className="grid gap-2">
                  <span className="hito-label">Paste plan JSON</span>
                  <textarea
                    rows={10}
                    value={jsonDraft}
                    onChange={(event) => {
                      setJsonDraft(event.target.value);
                      setImportedPlan(null);
                      setFieldErrors([]);
                      setError(null);
                    }}
                    placeholder='{"schema_version":"training-plan-v2","plan_name":"...","generated_for":"...","start_date":"...","planned_workouts":[...]}'
                    className="hito-field hito-textarea-md font-mono text-xs"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isBusy || !jsonDraft.trim()}
                    onClick={() =>
                      applyValidation(jsonDraft, {
                        setError,
                        setFieldErrors,
                        setImportedPlan,
                        setStatus,
                      })
                    }
                    className="hito-button hito-button-secondary hito-button-md"
                  >
                    Check JSON
                  </button>
                  <span className="hito-field-helper">Only Hito plan JSON works here.</span>
                </div>
              </div>
            </details>

            {summary && (
              <div className="hito-row-group">
                <div className="hito-list-row items-start">
                  <div>
                    <p
                      className={
                        replaceBlockedReason
                          ? "hito-list-row-title text-warn"
                          : "hito-list-row-title"
                      }
                    >
                      {replaceBlockedReason ? (
                        <span className="inline-flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Replace today is unavailable.
                        </span>
                      ) : (
                        "Ready to apply"
                      )}
                    </p>
                    <p className="hito-list-row-copy">
                      {replaceBlockedReason
                        ? "This file is valid, but replacing today here would detach saved workout history. Safe apply is still available."
                        : `${summary.days} days, ${summary.workouts} workouts from ${summary.contractLabel}.`}
                    </p>
                  </div>
                  <span
                    className="hito-status-pill"
                    data-tone={replaceBlockedReason ? "warning" : "success"}
                  >
                    {replaceBlockedReason ? "Replace blocked" : "Valid"}
                  </span>
                </div>
                <div className="hito-list-row items-start">
                  <label className="grid flex-1 gap-2">
                    <span className="hito-label">Start training</span>
                    <input
                      type="date"
                      min={resolvedDefaultStartDate}
                      value={requestedStartDate}
                      onChange={(event) => setRequestedStartDate(event.target.value)}
                      className="hito-field hito-field-md"
                    />
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className="hito-button hito-button-ghost hito-button-xs"
                      onClick={() => setRequestedStartDate(resolvedDefaultStartDate)}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className="hito-button hito-button-ghost hito-button-xs"
                      onClick={() => setRequestedStartDate(addDaysIso(resolvedDefaultStartDate, 1))}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      className="hito-button hito-button-ghost hito-button-xs"
                      onClick={() => setRequestedStartDate(addDaysIso(resolvedDefaultStartDate, 7))}
                    >
                      Next week
                    </button>
                  </div>
                </div>
                {canOfferClearBeforeImport && (
                  <div className="hito-list-row items-start">
                    <label className="flex max-w-lg items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={clearBeforeImport}
                        disabled={isBusy}
                        onChange={(event) => setClearBeforeImport(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-hairline text-signal focus:ring-signal"
                      />
                      <span>
                        Remove the current upcoming schedule before this later-starting plan is
                        applied. Saved workout history stays preserved.
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

            {error && <p className="hito-field-error">{error}</p>}
          </div>
        </div>

        <DialogFooter className="hito-section-divider grid gap-4 px-6 py-4 sm:space-x-0">
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="hito-button hito-button-secondary hito-button-md"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isBusy || !importedPlan || !requestedStartDate}
              onClick={() => {
                void submitPlan(null);
              }}
              className="hito-button hito-button-primary hito-button-md"
            >
              {status === "parsing"
                ? "Checking JSON..."
                : status === "applying"
                  ? "Importing plan..."
                  : "Import plan"}
            </button>
          </div>
          <details className="hito-disclosure">
            <summary className="hito-disclosure-summary">
              <span>Need this file to replace today?</span>
              <ChevronDown className="hito-disclosure-chevron" />
            </summary>
            <div className="hito-disclosure-body">
              <p className="hito-field-helper max-w-lg">
                Safe import keeps any existing workout on the chosen start day. Replace only if the
                file&apos;s first workout should overwrite it.
              </p>
              {replaceBlockedReason ? (
                <p className="hito-field-error">
                  Replace today is unavailable because it would detach saved workout history.
                </p>
              ) : null}
              <div>
                <button
                  type="button"
                  disabled={
                    isBusy || !importedPlan || !requestedStartDate || Boolean(replaceBlockedReason)
                  }
                  onClick={() => {
                    void submitPlan("replace_first_day");
                  }}
                  className="hito-button hito-button-outlined hito-button-sm border-destructive/28 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {status === "applying" ? "Replacing..." : "Replace start day"}
                </button>
              </div>
            </div>
          </details>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function applyValidation(
  raw: string,
  handlers: {
    setError: (value: string | null) => void;
    setFieldErrors: (value: string[]) => void;
    setImportedPlan: (value: ImportedPlan | null) => void;
    setStatus: (value: "idle" | "parsing" | "applying") => void;
  },
) {
  handlers.setStatus("parsing");
  handlers.setError(null);
  handlers.setFieldErrors([]);
  handlers.setImportedPlan(null);

  const validation = validateImportedPlanJson(raw);

  if (!validation) {
    handlers.setStatus("idle");
    handlers.setError("The JSON content could not be parsed.");
    return;
  }

  if (!validation.success) {
    handlers.setFieldErrors(
      validation.error.issues.map((issue) => formatIssue(issue.path, issue.message)),
    );
    handlers.setStatus("idle");
    return;
  }

  handlers.setImportedPlan(validation.data);
  handlers.setStatus("idle");
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
