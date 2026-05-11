import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Download, Upload } from "lucide-react";
import {
  FUTURE_TEMPLATE_DOWNLOAD_PATH,
  summarizeImportedPlan,
  type ImportedPlan,
  validateImportedPlanJson,
} from "@/lib/imported-plan";
import { completeOnboarding, completeTextOnboarding } from "@/lib/training-api";
import { cn } from "@/lib/utils";

type TextStatus = "idle" | "saving" | "finishing";
type JsonStatus = "idle" | "parsing" | "saving" | "finishing";

export function OnboardingGate() {
  const completeTextOnboardingFn = useServerFn(completeTextOnboarding);
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [authoringText, setAuthoringText] = useState("");
  const [textStatus, setTextStatus] = useState<TextStatus>("idle");
  const [textError, setTextError] = useState<string | null>(null);

  const [showJsonImport, setShowJsonImport] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [importedPlan, setImportedPlan] = useState<ImportedPlan | null>(null);
  const [jsonStatus, setJsonStatus] = useState<JsonStatus>("idle");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const isBusy = textStatus !== "idle" || jsonStatus !== "idle";
  const importedSummary = importedPlan ? summarizeImportedPlan(importedPlan) : null;

  const validateJsonDraft = validateJsonDraftFactory({
    setJsonError,
    setFieldErrors,
    setImportedPlan,
    setJsonStatus,
  });

  return (
    <section className="hito-surface mx-auto max-w-4xl p-6 lg:p-10">
      <div className="max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-signal">Create a plan</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] lg:text-5xl">
          Describe what you&apos;re training for.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Tell us your goal and current context in your own words. We use that description to build
          the first saved plan, then open the same calendar and workout flow you&apos;ll use
          afterward.
        </p>
      </div>

      <form
        className="mt-8 grid gap-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const trimmed = authoringText.trim();

          setTextError(null);

          if (trimmed.length < 20) {
            setTextError("Add a little more detail before building the first plan.");
            return;
          }

          setTextStatus("saving");

          try {
            await completeTextOnboardingFn({
              data: {
                authoringText: trimmed,
              },
            });
            setTextStatus("finishing");
            openSavedHome();
          } catch (submitError) {
            setTextStatus("idle");
            setTextError(
              submitError instanceof Error
                ? submitError.message
                : "Could not build the first plan from this description.",
            );
          }
        }}
      >
        <div className="grid gap-4">
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/85">
            Mention the goal, time horizon, current level, recent results, and any constraints that
            should shape the plan.
          </p>

          <label className="grid gap-2">
            <span className="hito-label hito-label-signal">Write your plan request here</span>
            <textarea
              autoFocus
              rows={9}
              value={authoringText}
              onChange={(event) => {
                setAuthoringText(event.target.value);
                setTextError(null);
              }}
              placeholder={
                "Goal: half marathon later this year.\nTarget horizon: around 16 weeks.\nCurrent level: running 3 times per week, long run 8 km.\nRecent results: 10K in 59:30 two months ago.\nContext: 34 years old, back from a light injury break.\nConstraints: no Tuesdays, prefer 4 runs per week, keep one full rest day."
              }
              className="hito-field hito-textarea-lg resize-y"
            />
          </label>

          {textError && <p className="hito-field-error">{textError}</p>}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isBusy || authoringText.trim().length < 20}
              className="hito-button hito-button-primary hito-button-lg"
            >
              {textStatus === "saving"
                ? "Building your plan..."
                : textStatus === "finishing"
                  ? "Opening your plan..."
                  : "Build my first plan"}
            </button>
            <span className="hito-field-helper">One compact request is enough to start.</span>
          </div>

          {textStatus === "finishing" && (
            <p className="hito-field-success">
              Your plan was created. Loading the saved calendar now…
            </p>
          )}
        </div>
      </form>

      <div className="hito-section-divider mt-8 pt-6">
        <button
          type="button"
          onClick={() => setShowJsonImport((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Advanced import
            </div>
            <div className="mt-1 text-sm text-foreground/90">Use a JSON plan file</div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              For existing `training-plan-v2` Hito plan files, migration, or testing. Most runners
              should describe the plan above.
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              showJsonImport && "rotate-180",
            )}
          />
        </button>

        {showJsonImport && (
          <div className="hito-section-divider mt-5 pt-5">
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
                  setFieldErrors([]);
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
                    setJsonError(null);
                  }}
                  placeholder='{"schema_version":"training-plan-v2","plan_name":"...","generated_for":"...","start_date":"...","planned_workouts":[...]}'
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
                  Validate JSON
                </button>
                <span className="hito-field-helper">
                  Advanced import requires the canonical `training-plan-v2` contract.
                </span>
              </div>

              {importedSummary && (
                <div className="hito-row-group">
                  <div className="hito-list-row">
                    <div>
                      <p className="hito-list-row-title">Ready to import</p>
                      <p className="hito-list-row-copy">
                        {importedSummary.days} days, {importedSummary.workouts} workouts from{" "}
                        {importedSummary.contractLabel}.
                      </p>
                    </div>
                    <span className="hito-status-pill" data-tone="success">
                      Valid
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

              {jsonError && <p className="hito-field-error">{jsonError}</p>}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={isBusy || !importedPlan}
                  onClick={async () => {
                    if (!importedPlan) {
                      setJsonError("Upload a valid JSON file before creating the saved plan.");
                      return;
                    }

                    setJsonStatus("saving");
                    setJsonError(null);

                    try {
                      await completeOnboardingFn({
                        data: {
                          importedPlan,
                        },
                      });
                      setJsonStatus("finishing");
                      openSavedHome();
                    } catch (submitError) {
                      setJsonStatus("idle");
                      setJsonError(
                        submitError instanceof Error
                          ? submitError.message
                          : "Could not import the JSON plan.",
                      );
                    }
                  }}
                  className="hito-button hito-button-primary hito-button-md"
                >
                  {jsonStatus === "parsing"
                    ? "Checking JSON..."
                    : jsonStatus === "saving"
                      ? "Importing plan..."
                      : jsonStatus === "finishing"
                        ? "Opening your plan..."
                        : "Apply JSON plan"}
                </button>
                <span className="hito-field-helper">
                  This does not replace the text-first setup path.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function formatIssue(path: (string | number)[], message: string) {
  if (!path.length) {
    return message;
  }

  return `${path.join(".")}: ${message}`;
}

function validateJsonDraftFactory({
  setJsonError,
  setFieldErrors,
  setImportedPlan,
  setJsonStatus,
}: {
  setJsonError: (value: string | null) => void;
  setFieldErrors: (value: string[]) => void;
  setImportedPlan: (value: ImportedPlan | null) => void;
  setJsonStatus: (value: JsonStatus) => void;
}) {
  return function validateJsonDraft(raw: string) {
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
}

function openSavedHome() {
  window.location.assign("/");
}
