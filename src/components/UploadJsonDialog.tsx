import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Download, Upload } from "lucide-react";
import {
  FUTURE_TEMPLATE_DOWNLOAD_PATH,
  summarizeImportedPlan,
  type ImportedPlan,
  validateImportedPlanJson,
} from "@/lib/imported-plan";
import { completeOnboarding } from "@/lib/training-api";
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [importedPlan, setImportedPlan] = useState<ImportedPlan | null>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "applying">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const isBusy = status !== "idle";
  const summary = importedPlan ? summarizeImportedPlan(importedPlan) : null;
  const isBlockedReplace =
    Boolean(importedPlan) &&
    Boolean(error) &&
    /would detach saved workout history|apply step is blocked|current saved plan stays unchanged/i.test(
      error,
    );
  const describeApplyError = (submitError: unknown) => {
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
  };

  useEffect(() => {
    if (open) {
      return;
    }

    setSelectedFileName(null);
    setJsonDraft("");
    setImportedPlan(null);
    setStatus("idle");
    setError(null);
    setFieldErrors([]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-hairline bg-background/95 p-0 backdrop-blur-xl">
        <DialogHeader className="border-b border-hairline px-6 py-5 text-left">
          <DialogTitle className="font-display text-3xl">Advanced import</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Replace the current saved plan only when you already have a `training-plan-v2` Hito JSON
            file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 py-5">
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
              {selectedFileName ? "Choose another file" : "Upload JSON"}
            </button>
            <a
              href={FUTURE_TEMPLATE_DOWNLOAD_PATH}
              download
              className="hito-button hito-button-secondary hito-button-md"
            >
              <Download className="h-4 w-4 text-signal" />
              Download JSON template
            </a>
            {selectedFileName && (
              <span className="text-sm text-muted-foreground">{selectedFileName}</span>
            )}
          </div>

          <label className="grid gap-2">
            <span className="hito-label">JSON content</span>
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
              Validate JSON
            </button>
            <span className="hito-field-helper">
              Advanced import requires the canonical `training-plan-v2` contract.
            </span>
          </div>

          {summary && (
            <div className="hito-row-group">
              <div className="hito-list-row items-start">
                <div>
                  <p
                    className={
                      isBlockedReplace ? "hito-list-row-title text-warn" : "hito-list-row-title"
                    }
                  >
                    {isBlockedReplace ? (
                      <span className="inline-flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Replace blocked.
                      </span>
                    ) : (
                      "Ready to apply"
                    )}
                  </p>
                  <p className="hito-list-row-copy">
                    {isBlockedReplace
                      ? "This JSON parsed correctly, but applying it here would detach saved workout history."
                      : `${summary.days} days, ${summary.workouts} workouts from ${summary.contractLabel}.`}
                  </p>
                </div>
                <span
                  className="hito-status-pill"
                  data-tone={isBlockedReplace ? "warning" : "success"}
                >
                  {isBlockedReplace ? "Blocked" : "Valid"}
                </span>
              </div>
            </div>
          )}

          {fieldErrors.length > 0 && (
            <div className="hito-row-group">
              <div className="hito-list-row items-start">
                <div>
                  <p className="hito-label text-destructive">JSON shape mismatch</p>
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

        <DialogFooter className="hito-section-divider px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="hito-button hito-button-secondary hito-button-md"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy || !importedPlan || isBlockedReplace}
            onClick={async () => {
              if (!importedPlan) {
                setError("Upload a valid JSON file before applying the plan.");
                return;
              }

              setStatus("applying");
              setError(null);

              try {
                await completeOnboardingFn({
                  data: {
                    importedPlan,
                  },
                });
                onOpenChange(false);

                if (typeof window !== "undefined") {
                  window.location.assign("/");
                  return;
                }
              } catch (submitError) {
                setStatus("idle");
                setError(describeApplyError(submitError));
              }
            }}
            className="hito-button hito-button-primary hito-button-md"
          >
            {status === "parsing"
              ? "Checking JSON..."
              : status === "applying"
                ? "Applying plan..."
                : isBlockedReplace
                  ? "Apply blocked"
                  : "Apply plan"}
          </button>
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
