import { Icon } from "@/components/ui/icon";

export type PlanTextReplacementStatus = "idle" | "creating";

export function PlanTextReplacementPanel({
  text,
  status,
  error,
  isBusy,
  onTextChange,
  onCreatePlan,
}: {
  text: string;
  status: PlanTextReplacementStatus;
  error: string | null;
  isBusy: boolean;
  onTextChange: (value: string) => void;
  onCreatePlan: () => void;
}) {
  return (
    <section className="hito-section-divider grid gap-4 pt-5">
      <div>
        <div className="flex items-center gap-2">
          <Icon name="sparkles" size="sm" className="text-signal" />
          <h3 className="hito-panel-title">Create a new plan</h3>
        </div>
        <p className="hito-body mt-2 max-w-xl">
          Describe what should change. Hito will create a fresh saved plan from your request.
        </p>
      </div>

      <label className="grid gap-2">
        <span className="hito-form-label">Plan request</span>
        <textarea
          rows={5}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Example: Build me a 10-week half marathon plan starting from 4 runs per week. Keep Mondays free and make the long run on Sunday."
          className="hito-field hito-textarea-md resize-y"
        />
      </label>

      {error ? <p className="hito-field-error">{error}</p> : null}

      <div>
        <button
          type="button"
          disabled={isBusy || text.trim().length < 20}
          onClick={onCreatePlan}
          className="hito-button hito-button-primary hito-button-md"
        >
          {status === "creating" ? "Creating plan..." : "Create new plan"}
        </button>
      </div>
    </section>
  );
}
