export type PlanLifecycleClearStatus = "idle" | "clearing";

export const CLEAR_UPCOMING_CONFIRMATION_COPY =
  "I understand this clears the active upcoming schedule and keeps history archived.";

export function PlanLifecycleControls({
  isBusy,
  clearError,
  clearConfirmed,
  onClearConfirmedChange,
}: {
  isBusy: boolean;
  clearError: string | null;
  clearConfirmed: boolean;
  onClearConfirmedChange: (checked: boolean) => void;
}) {
  return (
    <div className="grid gap-3">
      {clearError ? <p className="hito-field-error">{clearError}</p> : null}
      <label className="hito-control-label hito-control-label-sm max-w-xl">
        <input
          type="checkbox"
          checked={clearConfirmed}
          data-state={clearConfirmed ? "checked" : "unchecked"}
          disabled={isBusy}
          onChange={(event) => onClearConfirmedChange(event.target.checked)}
          className={`hito-checkbox hito-checkbox-sm${clearConfirmed ? " hito-checkbox-checked" : ""}`}
        />
        <span>{CLEAR_UPCOMING_CONFIRMATION_COPY}</span>
      </label>
    </div>
  );
}
