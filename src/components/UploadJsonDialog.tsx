import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, FileJson2, Upload } from "lucide-react";
import {
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
      <DialogContent className="max-w-2xl border-hairline bg-background/95 p-0 backdrop-blur-xl">
        <DialogHeader className="border-b border-hairline px-6 py-5 text-left">
          <DialogTitle className="font-display text-3xl">Upload JSON</DialogTitle>
          <DialogDescription className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Use one JSON file to replace the current saved plan. You can work with your agent to
            generate or fill it with goals, weight, height, recent results, and recent training
            context.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-5">
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

          <div className="rounded-xl border border-dashed border-hairline bg-background/35 p-4">
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
              <span className="text-sm text-muted-foreground">
                {selectedFileName ?? "No file selected yet"}
              </span>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Expected keys: plan_name, generated_for, start_date, week_1_preview[]
            </p>
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
              placeholder='{"plan_name":"...","generated_for":"...","start_date":"...","week_1_preview":[...]}'
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
              Export comes later. This flow only parses and applies a new plan.
            </span>
          </div>

          {summary && (
            <div
              className={
                isBlockedReplace
                  ? "rounded-xl border border-warn/30 bg-warn/10 p-4"
                  : "rounded-xl border border-success/20 bg-success/10 p-4"
              }
            >
              <div
                className={
                  isBlockedReplace
                    ? "flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-warn"
                    : "flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-success"
                }
              >
                {isBlockedReplace ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {isBlockedReplace ? "Replace blocked" : "Ready to apply"}
              </div>
              <div className="mt-3 grid gap-3 text-sm text-foreground/85 sm:grid-cols-3">
                <p>Plan: {summary.planName}</p>
                <p>Days: {summary.days}</p>
                <p>Workouts: {summary.workouts}</p>
              </div>
              {isBlockedReplace && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                  This JSON parsed correctly, but it cannot replace the current saved plan without
                  detaching logged workout history.
                </p>
              )}
            </div>
          )}

          {fieldErrors.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-destructive">
                JSON shape mismatch
              </div>
              <div className="mt-3 space-y-2 text-sm text-foreground/85">
                {fieldErrors.slice(0, 5).map((issue) => (
                  <p key={issue}>{issue}</p>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="rounded-xl bg-gradient-to-br from-surface-elevated to-surface p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <FileJson2 className="h-3.5 w-3.5 text-signal" />
              Apply behavior
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">
              Confirming here replaces the current active plan and opens the updated calendar view.
              Saved workout history carries forward only when logged days still match exactly by
              date and workout content. Otherwise the apply step is blocked and the current saved
              plan stays unchanged.
            </p>
          </div>
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
