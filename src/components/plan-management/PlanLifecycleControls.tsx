import { Icon } from "@/components/ui/icon";

export type PlanLifecycleClearStatus = "idle" | "clearing";

export function PlanLifecycleControls({
  planAvailable,
  isBusy,
  clearStatus,
  clearError,
  clearConfirmed,
  clearDefaultOpen = false,
  onClearConfirmedChange,
  onClearUpcomingSchedule,
}: {
  planAvailable: boolean;
  isBusy: boolean;
  clearStatus: PlanLifecycleClearStatus;
  clearError: string | null;
  clearConfirmed: boolean;
  clearDefaultOpen?: boolean;
  onClearConfirmedChange: (checked: boolean) => void;
  onClearUpcomingSchedule: () => void;
}) {
  return (
    <details className="hito-disclosure" open={clearDefaultOpen ? true : undefined}>
      <summary className="hito-disclosure-summary">
        <span>Clear upcoming schedule</span>
        <Icon name="chevron-down" className="hito-disclosure-chevron" />
      </summary>
      <div className="hito-disclosure-body">
        <div className="flex items-start gap-3">
          <Icon name="clear-calendar" size="sm" className="mt-0.5 text-signal" />
          <p className="hito-field-helper max-w-xl">
            This removes the current active upcoming schedule from view so you can start a later
            plan cleanly. Planned workouts and saved workout logs stay preserved as history.
          </p>
        </div>
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
          <span>
            I understand this clears the active upcoming schedule and keeps history archived.
          </span>
        </label>
        <div>
          <button
            type="button"
            disabled={isBusy || !planAvailable || !clearConfirmed}
            onClick={onClearUpcomingSchedule}
            className="hito-button hito-button-secondary hito-button-sm"
          >
            <Icon name="clear-calendar" size="sm" />
            {clearStatus === "clearing" ? "Clearing schedule..." : "Clear upcoming schedule"}
          </button>
        </div>
      </div>
    </details>
  );
}
