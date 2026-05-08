import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
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
  const router = useRouter();
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
          <DialogTitle className="font-display text-3xl">Upload JSON</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Replace the current saved plan with one JSON file.
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
              className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {selectedFileName ? "Choose another JSON" : "Upload JSON"}
            </button>
            <a
              href={FUTURE_TEMPLATE_DOWNLOAD_PATH}
              download
              className="inline-flex items-center gap-2 rounded-md border border-hairline bg-background/45 px-4 py-2 text-sm text-foreground/85 transition-colors hover:bg-accent"
            >
              <Download className="h-4 w-4 text-signal" />
              Download template
            </a>
            {selectedFileName && (
              <span className="text-sm text-muted-foreground">{selectedFileName}</span>
            )}
          </div>

          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              JSON content
            </span>
            <textarea
              rows={10}
              value={jsonDraft}
              onChange={(event) => {
                setJsonDraft(event.target.value);
                setImportedPlan(null);
                setFieldErrors([]);
                setError(null);
              }}
              placeholder='{"plan_name":"...","generated_for":"...","start_date":"...","week_1_preview":[...]} or {"schema_version":"training-plan-v2",...}'
              className="rounded-lg border border-hairline bg-background/50 px-4 py-3 font-mono text-xs leading-relaxed placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none"
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
              className="rounded-md border border-hairline px-4 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-60"
            >
              Validate JSON
            </button>
            <span className="text-[11px] text-muted-foreground">
              Keep this as the advanced fallback path.
            </span>
          </div>

          {summary && (
            <p
              className={
                isBlockedReplace
                  ? "text-sm leading-relaxed text-warn"
                  : "text-sm leading-relaxed text-foreground/85"
              }
            >
              {isBlockedReplace ? (
                <>
                  <span className="inline-flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Replace blocked.
                  </span>{" "}
                  This JSON parsed correctly, but applying it here would detach saved workout
                  history.
                </>
              ) : (
                <>
                  Ready to apply: {summary.days} days, {summary.workouts} workouts.
                </>
              )}
            </p>
          )}

          {fieldErrors.length > 0 && (
            <div className="space-y-2 text-sm text-destructive">
              <p className="text-[11px] uppercase tracking-[0.18em]">JSON shape mismatch</p>
              {fieldErrors.slice(0, 5).map((issue) => (
                <p key={issue}>{issue}</p>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="border-t border-hairline px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-hairline px-4 py-2 text-sm transition-colors hover:bg-accent"
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
                await router.invalidate();
                onOpenChange(false);
                await router.navigate({ to: "/" });
              } catch (submitError) {
                setStatus("idle");
                setError(
                  submitError instanceof Error
                    ? submitError.message
                    : "Could not apply the imported plan.",
                );
              }
            }}
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
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
