import type { RefObject } from "react";
import { FUTURE_TEMPLATE_DOWNLOAD_PATH, type ImportedPlanSummary } from "@/lib/imported-plan";
import type { FirstDayResolution } from "@/lib/plan-apply-policy";
import { Icon } from "@/components/ui/icon";

export type PlanImportStatus = "idle" | "parsing" | "importing";

export function PlanImportPanel({
  fileInputRef,
  isBusy,
  selectedFileName,
  jsonDraft,
  importedPlanAvailable,
  importedSummary,
  requestedStartDate,
  defaultStartDate,
  clearBeforeImport,
  canOfferClearBeforeImport,
  fieldErrors,
  jsonError,
  status,
  replaceBlockedReason,
  onFileChange,
  onUploadClick,
  onJsonDraftChange,
  onValidateJson,
  onRequestedStartDateChange,
  onClearBeforeImportChange,
  onImport,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isBusy: boolean;
  selectedFileName: string | null;
  jsonDraft: string;
  importedPlanAvailable: boolean;
  importedSummary: ImportedPlanSummary | null;
  requestedStartDate: string;
  defaultStartDate: string;
  clearBeforeImport: boolean;
  canOfferClearBeforeImport: boolean;
  fieldErrors: string[];
  jsonError: string | null;
  status: PlanImportStatus;
  replaceBlockedReason: string | null;
  onFileChange: (file: File | null) => void;
  onUploadClick: () => void;
  onJsonDraftChange: (value: string) => void;
  onValidateJson: () => void;
  onRequestedStartDateChange: (value: string) => void;
  onClearBeforeImportChange: (checked: boolean) => void;
  onImport: (firstDayResolution: FirstDayResolution | null) => void;
}) {
  return (
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
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />

        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isBusy}
              onClick={onUploadClick}
              className="hito-button hito-button-secondary hito-button-md"
            >
              <Icon name="upload" size="sm" />
              {selectedFileName ? "Choose another file" : "Upload JSON"}
            </button>
            {selectedFileName ? <span className="hito-body-small">{selectedFileName}</span> : null}
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
              onChange={(event) => onJsonDraftChange(event.target.value)}
              placeholder='{"schema_version":"training-plan-v2","plan_name":"...","planned_workouts":[...]}'
              className="hito-field hito-textarea-md hito-technical-mono"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isBusy || !jsonDraft.trim()}
              onClick={onValidateJson}
              className="hito-button hito-button-secondary hito-button-md"
            >
              Check JSON
            </button>
            <span className="hito-field-helper">JSON stays the advanced path.</span>
          </div>

          {importedSummary ? (
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
                    onChange={(event) => onRequestedStartDateChange(event.target.value)}
                    className="hito-field hito-field-md"
                  />
                  <span className="hito-field-helper">
                    Hito applies this plan from the date you choose here; the JSON start date stays
                    source metadata, and fixed rest days may still affect workout placement.
                  </span>
                </label>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="hito-button hito-button-ghost hito-button-xs"
                    onClick={() => onRequestedStartDateChange(defaultStartDate)}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="hito-button hito-button-ghost hito-button-xs"
                    onClick={() => onRequestedStartDateChange(addDaysIso(defaultStartDate, 1))}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    className="hito-button hito-button-ghost hito-button-xs"
                    onClick={() => onRequestedStartDateChange(addDaysIso(defaultStartDate, 7))}
                  >
                    Next week
                  </button>
                </div>
              </div>
              {canOfferClearBeforeImport ? (
                <div className="hito-list-row items-start">
                  <label className="hito-control-label hito-control-label-sm max-w-xl">
                    <input
                      type="checkbox"
                      checked={clearBeforeImport}
                      data-state={clearBeforeImport ? "checked" : "unchecked"}
                      disabled={isBusy}
                      onChange={(event) => onClearBeforeImportChange(event.target.checked)}
                      className={`hito-checkbox hito-checkbox-sm${clearBeforeImport ? " hito-checkbox-checked" : ""}`}
                    />
                    <span>
                      Remove the current upcoming schedule before this later-starting plan is
                      applied. Saved workout history stays preserved.
                    </span>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          {fieldErrors.length > 0 ? (
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
          ) : null}

          {jsonError ? <p className="hito-field-error">{jsonError}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isBusy || !importedPlanAvailable || !requestedStartDate}
              onClick={() => onImport(null)}
              className="hito-button hito-button-secondary hito-button-md"
            >
              <Icon name="import" size="sm" />
              {status === "importing" ? "Importing plan..." : "Import JSON plan"}
            </button>
          </div>

          <details className="hito-disclosure">
            <summary className="hito-disclosure-summary">
              <span>Need the first workout to replace the start day?</span>
              <Icon name="chevron-down" className="hito-disclosure-chevron" />
            </summary>
            <div className="hito-disclosure-body">
              <p className="hito-field-helper">
                Safe import keeps the existing workout on that date if one is present. Replace only
                if the file&apos;s first workout should overwrite it.
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
                    !importedPlanAvailable ||
                    !requestedStartDate ||
                    Boolean(replaceBlockedReason)
                  }
                  data-tone="error"
                  onClick={() => onImport("replace_first_day")}
                  className="hito-button hito-button-outlined hito-button-sm"
                >
                  {status === "importing" ? "Replacing..." : "Replace start day"}
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </details>
  );
}

function addDaysIso(baseIso: string, days: number) {
  const date = new Date(`${baseIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
