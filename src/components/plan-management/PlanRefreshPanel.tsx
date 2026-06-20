import type { ProposeActivePlanRefreshResult } from "@/lib/active-plan-refresh-contract";
import { formatDate } from "@/lib/training";
import { Icon } from "@/components/ui/icon";

export type PlanRefreshStatus = "idle" | "proposing";
export type PlanRefreshApplyStatus = "idle" | "applying";
type PlanRefreshProposalResult = Extract<ProposeActivePlanRefreshResult, { ok: true }>;

export function PlanRefreshPanel({
  available,
  prompt,
  status,
  applyStatus,
  result,
  error,
  staleMessage,
  decisionMessage,
  isBusy,
  onPromptChange,
  onGenerate,
  onApply,
  onKeepCurrentPlan,
}: {
  available: boolean;
  prompt: string;
  status: PlanRefreshStatus;
  applyStatus: PlanRefreshApplyStatus;
  result: PlanRefreshProposalResult | null;
  error: string | null;
  staleMessage: string | null;
  decisionMessage: string | null;
  isBusy: boolean;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onApply: () => void;
  onKeepCurrentPlan: () => void;
}) {
  if (!available) {
    return null;
  }

  return (
    <details className="hito-disclosure">
      <summary className="hito-disclosure-summary">
        <span>Update plan</span>
        <Icon name="chevron-down" className="hito-disclosure-chevron" />
      </summary>
      <div className="hito-disclosure-body">
        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <Icon name="refresh" size="sm" className="mt-0.5 text-signal" />
            <div>
              <p className="hito-list-row-title">Ask for a proposal from your saved history.</p>
              <p className="hito-body-small mt-1 max-w-xl">
                Hito reviews the active plan, recent logs, Garmin-backed comparison signals, and
                workout body-note cautions. This does not apply changes.
              </p>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="hito-form-label">What should change?</span>
            <textarea
              rows={3}
              maxLength={1200}
              value={prompt}
              disabled={isBusy}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="Example: I missed a few days and feel heavy. Adjust the rest of the plan without changing my race goal."
              className="hito-field hito-textarea-md resize-y"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isBusy || prompt.trim().length < 8}
              onClick={onGenerate}
              className="hito-button hito-button-secondary hito-button-md"
            >
              <Icon name="refresh" size="sm" />
              {status === "proposing" ? "Preparing proposal..." : "Generate proposal"}
            </button>
            <span className="hito-field-helper">
              Nothing changes until you choose Apply update.
            </span>
          </div>

          {error ? <p className="hito-field-error">{error}</p> : null}
          {decisionMessage ? <p className="hito-field-success">{decisionMessage}</p> : null}

          {result ? (
            <PlanRefreshProposalReview
              result={result}
              applyStatus={applyStatus}
              staleMessage={staleMessage}
              isBusy={isBusy}
              onApply={onApply}
              onKeepCurrentPlan={onKeepCurrentPlan}
              onGenerateFresh={onGenerate}
            />
          ) : null}
        </div>
      </div>
    </details>
  );
}

function PlanRefreshProposalReview({
  result,
  applyStatus,
  staleMessage,
  isBusy,
  onApply,
  onKeepCurrentPlan,
  onGenerateFresh,
}: {
  result: PlanRefreshProposalResult;
  applyStatus: PlanRefreshApplyStatus;
  staleMessage: string | null;
  isBusy: boolean;
  onApply: () => void;
  onKeepCurrentPlan: () => void;
  onGenerateFresh: () => void;
}) {
  const proposal = result.proposal.output;
  const review = proposal.review;
  const isApplying = applyStatus === "applying";

  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Proposal only</p>
          <p className="hito-list-row-copy">{review.summary}</p>
        </div>
        <span className="hito-status-pill" data-tone="signal">
          Review
        </span>
      </div>

      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">Why this update</p>
          <ul className="hito-body-small mt-2 grid gap-1.5">
            {review.rationale.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">What would change from today forward</p>
          <ul className="hito-body-small mt-2 grid gap-1.5">
            {review.proposedChanges.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      {review.keepAsIs.length > 0 ? (
        <div className="hito-list-row items-start">
          <div className="min-w-0">
            <p className="hito-list-row-title">What stays the same</p>
            <ul className="hito-body-small mt-2 grid gap-1.5">
              {review.keepAsIs.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Scope under review</p>
          <p className="hito-list-row-copy">{review.scope.label}</p>
        </div>
        <span className="hito-status-pill" data-tone="success">
          Future only
        </span>
      </div>

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Caution context</p>
          {review.cautionContext.included ? (
            <div className="mt-2 grid gap-1.5">
              <p className="hito-list-row-copy">{review.cautionContext.note}</p>
              {review.cautionContext.bodyNoteCautions.map((caution) => (
                <p key={`${caution.date}-${caution.title}`} className="hito-list-row-copy">
                  {formatDate(caution.date, { month: "short", day: "numeric" })}: {caution.title},
                  body-note severity up to {caution.maxSeverity}.
                </p>
              ))}
            </div>
          ) : (
            <p className="hito-list-row-copy">{review.cautionContext.note}</p>
          )}
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Nothing has changed yet</p>
          <p className="hito-list-row-copy">{review.boundaryNote}</p>
        </div>
        <span className="hito-status-pill" data-tone={isApplying ? "signal" : "warning"}>
          {isApplying ? "Applying" : "Not applied"}
        </span>
      </div>

      {staleMessage ? (
        <div className="hito-list-row items-start">
          <div>
            <p className="hito-list-row-title">Proposal no longer current</p>
            <p className="hito-list-row-copy">{staleMessage}</p>
          </div>
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            disabled={isBusy}
            onClick={onGenerateFresh}
          >
            <Icon name="refresh" size="sm" />
            Generate fresh proposal
          </button>
        </div>
      ) : null}

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Choose what happens</p>
          <p className="hito-list-row-copy">
            Hito rechecks the proposal before changing the active plan. Keeping the current plan
            leaves the schedule untouched.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <button
            type="button"
            className="hito-button hito-button-ghost hito-button-sm"
            disabled={isBusy}
            onClick={onKeepCurrentPlan}
          >
            Keep current plan
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm"
            disabled={isBusy || Boolean(staleMessage)}
            onClick={onApply}
          >
            {isApplying ? "Applying update..." : "Apply update"}
          </button>
        </div>
      </div>
    </div>
  );
}
