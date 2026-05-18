import type { RefObject } from "react";
import { Icon } from "@/components/ui/icon";
import {
  FUTURE_TEMPLATE_DOWNLOAD_PATH,
  summarizeImportedPlan,
  type ImportedPlan,
} from "@/lib/imported-plan";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";

type JsonStatus = "idle" | "parsing" | "saving" | "finishing";

interface JsonImportPanelProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFileName: string | null;
  setSelectedFileName: (value: string | null) => void;
  jsonDraft: string;
  setJsonDraft: (value: string) => void;
  fieldErrors: string[];
  jsonError: string | null;
  jsonStatus: JsonStatus;
  importedPlan: ImportedPlan | null;
  isBusy: boolean;
  validateJsonDraft: (raw: string) => void;
  submitImportedPlan: (firstDayResolution: FirstDayResolution | null) => Promise<void>;
  setImportedPlan: (value: ImportedPlan | null) => void;
  setFieldErrors: (value: string[]) => void;
  setJsonError: (value: string | null) => void;
  setJsonStatus: (value: JsonStatus) => void;
}

export function JsonImportPanel({
  fileInputRef,
  selectedFileName,
  setSelectedFileName,
  jsonDraft,
  setJsonDraft,
  fieldErrors,
  jsonError,
  jsonStatus,
  importedPlan,
  isBusy,
  validateJsonDraft,
  submitImportedPlan,
  setImportedPlan,
  setFieldErrors,
  setJsonError,
  setJsonStatus,
}: JsonImportPanelProps) {
  const importedSummary = importedPlan ? summarizeImportedPlan(importedPlan) : null;

  return (
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
        {selectedFileName && <span className="hito-body-small">{selectedFileName}</span>}
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
            <span className="hito-form-label">Paste plan JSON</span>
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
              className="hito-field hito-field-primary hito-textarea-md hito-technical-mono"
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
        Import plan keeps today's workout and starts the new plan tomorrow.
      </p>

      <details className="hito-disclosure max-w-2xl">
        <summary className="hito-disclosure-summary">
          <span>Need this file to replace today?</span>
          <Icon name="chevron-down" className="hito-disclosure-chevron" />
        </summary>
        <div className="hito-disclosure-body">
          <p className="hito-field-helper">
            Replace today only if the file's first workout should overwrite today's planned workout.
          </p>
          <div>
            <button
              type="button"
              disabled={isBusy || !importedPlan}
              data-tone="error"
              onClick={() => {
                void submitImportedPlan("replace_first_day");
              }}
              className="hito-button hito-button-outlined hito-button-sm"
            >
              {jsonStatus === "saving" ? "Replacing today..." : "Replace today"}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
