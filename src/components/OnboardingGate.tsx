import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Icon } from "@/components/ui/icon";
import {
  FUTURE_TEMPLATE_DOWNLOAD_PATH,
  summarizeImportedPlan,
  type ImportedPlan,
  validateImportedPlanJson,
} from "@/lib/imported-plan";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
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

  const submitTextPlan = async (
    authoringRequest: string,
    firstDayResolution: FirstDayResolution | null,
  ) => {
    setTextStatus("saving");
    setTextError(null);

    try {
      const result = await completeTextOnboardingFn({
        data: {
          authoringText: authoringRequest,
          firstDayResolution,
        },
      });

      if (!result.ok) {
        setTextStatus("idle");
        setTextError("Could not apply that plan yet. Refresh and try again.");
        return;
      }

      setTextStatus("finishing");
      openSavedHome();
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

    setJsonStatus("saving");
    setJsonError(null);

    try {
      const result = await completeOnboardingFn({
        data: {
          importedPlan,
          firstDayResolution,
        },
      });

      if (!result.ok) {
        setJsonStatus("idle");
        setJsonError("Could not apply that plan yet. Refresh and try again.");
        return;
      }

      setJsonStatus("finishing");
      openSavedHome();
    } catch (submitError) {
      setJsonStatus("idle");
      setJsonError(
        submitError instanceof Error ? submitError.message : "Could not import the JSON plan.",
      );
    }
  };

  return (
    <section className="hito-surface mx-auto max-w-4xl p-6 lg:p-10">
      <div className="max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-signal">Create a plan</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] lg:text-5xl">
          Describe your goal and current running.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Write a short description in your own words. We&apos;ll turn it into your first plan and
          open the same calendar you&apos;ll use afterward.
        </p>
      </div>

      <form
        className="mt-8 grid gap-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const trimmed = authoringText.trim();

          setTextError(null);

          if (trimmed.length < 20) {
            setTextError("Add a bit more detail so we can build the plan.");
            return;
          }

          await submitTextPlan(trimmed, null);
        }}
      >
        <div className="grid gap-4">
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/85">
            Include your goal, timeline, current level, recent result, and any schedule limits.
          </p>

          <label className="grid gap-2">
            <span className="hito-label hito-label-signal">Plan request</span>
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
                ? "Creating your plan..."
                : textStatus === "finishing"
                  ? "Opening your plan..."
                  : "Create plan"}
            </button>
          </div>

          <p className="hito-field-helper max-w-2xl">
            If today already has a workout planned, Hito keeps it and starts the new plan tomorrow
            by default.
          </p>

          <details className="hito-disclosure max-w-2xl">
            <summary className="hito-disclosure-summary">
              <span>Need the new plan to start today instead?</span>
              <Icon name="chevron-down" className="hito-disclosure-chevron" />
            </summary>
            <div className="hito-disclosure-body">
              <p className="hito-field-helper">
                Replace today only if the new first workout should overwrite today&apos;s planned
                workout.
              </p>
              <div>
                <button
                  type="button"
                  disabled={isBusy || authoringText.trim().length < 20}
                  onClick={() => {
                    const trimmed = authoringText.trim();

                    if (trimmed.length < 20) {
                      setTextError("Add a bit more detail so we can build the plan.");
                      return;
                    }

                    void submitTextPlan(trimmed, "replace_first_day");
                  }}
                  className="hito-button hito-button-outlined hito-button-sm border-destructive/28 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {textStatus === "saving" ? "Replacing today..." : "Replace today"}
                </button>
              </div>
            </div>
          </details>

          {textStatus === "finishing" && (
            <p className="hito-field-success">Your plan is ready. Opening it now…</p>
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
              Import from JSON
            </div>
            <div className="mt-1 text-sm text-foreground/90">Use an existing Hito plan file</div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Use this only if you already have a Hito plan file.
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
                  className="hito-button hito-button-secondary hito-button-md"
                >
                  <Icon name="upload" size="sm" />
                  {selectedFileName ? "Choose another file" : "Upload file"}
                </button>
                {selectedFileName && (
                  <span className="text-sm text-muted-foreground">{selectedFileName}</span>
                )}
              </div>

              <details className="hito-disclosure">
                <summary className="hito-disclosure-summary">
                  <span>Paste JSON or download a template</span>
                  <Icon name="chevron-down" className="hito-disclosure-chevron" />
                </summary>
                <div className="hito-disclosure-body">
                  <div>
                    <a
                      href={FUTURE_TEMPLATE_DOWNLOAD_PATH}
                      download
                      className="hito-button hito-button-ghost hito-button-sm"
                    >
                      <Icon name="download" size="sm" className="text-signal" />
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
                      Check JSON
                    </button>
                    <span className="hito-field-helper">Only Hito plan JSON works here.</span>
                  </div>
                </div>
              </details>

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

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={isBusy || !importedPlan}
                  onClick={() => {
                    void submitImportedPlan(null);
                  }}
                  className="hito-button hito-button-primary hito-button-md"
                >
                  {jsonStatus === "parsing"
                    ? "Checking JSON..."
                    : jsonStatus === "saving"
                      ? "Importing plan..."
                      : jsonStatus === "finishing"
                        ? "Opening your plan..."
                        : "Import plan"}
                </button>
              </div>

              <p className="hito-field-helper max-w-2xl">
                Import plan keeps today&apos;s workout and starts the new plan tomorrow.
              </p>

              <details className="hito-disclosure max-w-2xl">
                <summary className="hito-disclosure-summary">
                  <span>Need this file to replace today?</span>
                  <Icon name="chevron-down" className="hito-disclosure-chevron" />
                </summary>
                <div className="hito-disclosure-body">
                  <p className="hito-field-helper">
                    Replace today only if the file&apos;s first workout should overwrite
                    today&apos;s planned workout.
                  </p>
                  <div>
                    <button
                      type="button"
                      disabled={isBusy || !importedPlan}
                      onClick={() => {
                        void submitImportedPlan("replace_first_day");
                      }}
                      className="hito-button hito-button-outlined hito-button-sm border-destructive/28 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {jsonStatus === "saving" ? "Replacing today..." : "Replace today"}
                    </button>
                  </div>
                </div>
              </details>
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
