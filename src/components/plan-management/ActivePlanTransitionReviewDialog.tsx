import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import type {
  ActivePlanTransitionConfirmResult,
  ActivePlanTransitionReviewResult,
} from "@/lib/active-plan-transition-actions";
import { formatDate } from "@/lib/training";

type TransitionReviewOk = Extract<ActivePlanTransitionReviewResult, { ok: true }>;
type TransitionBlocked = Extract<ActivePlanTransitionReviewResult, { ok: false }>;

export function ActivePlanTransitionReviewDialog({
  confirmResult,
  onConfirm,
  onKeepCurrentPlan,
  onOpenChange,
  open,
  result,
  status,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ActivePlanTransitionReviewResult | null;
  confirmResult: ActivePlanTransitionConfirmResult | null;
  status: "idle" | "reviewing" | "confirming";
  onConfirm: () => void;
  onKeepCurrentPlan: () => void;
}) {
  const review = result?.ok ? result : null;
  const confirming = status === "confirming";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="hito-dialog-overlay-stable"
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Review active-plan change</DialogTitle>
          <DialogDescription className="hito-body max-w-2xl">
            This review is non-mutating. Your manual plan changes only after explicit confirmation.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          {review ? <TransitionReviewSummary review={review} /> : null}
          {result && !result.ok ? <TransitionBlockedNotice result={result} /> : null}
          {confirmResult && !confirmResult.ok ? (
            <TransitionBlockedNotice result={confirmResult} />
          ) : null}
          {confirmResult?.ok ? (
            <div className="hito-surface-wash" data-tone="signal">
              <p className="hito-list-row-title">Reviewed plan applied</p>
              <p className="hito-list-row-copy">
                The previous manual plan was archived as history and the reviewed plan is active.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            disabled={confirming}
            onClick={onKeepCurrentPlan}
          >
            Keep current plan
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-md"
            disabled={!review || confirming}
            onClick={onConfirm}
          >
            {confirming ? "Applying reviewed plan..." : "Apply reviewed plan"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransitionReviewSummary({ review }: { review: TransitionReviewOk }) {
  return (
    <div className="grid gap-4">
      <section className="hito-row-group">
        <div className="hito-list-row items-start">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ReviewFact label="Current plan" value={review.currentPlan.title} />
            <ReviewFact label="Current range" value={formatDateRange(review.currentPlan)} />
            <ReviewFact
              label="Current schedule"
              value={`${review.currentPlan.workoutCount} rows · ${review.currentPlan.upcomingWorkoutCount} upcoming`}
            />
            <ReviewFact label="Candidate plan" value={review.candidatePlan.planFamily} />
            <ReviewFact label="Candidate range" value={formatDateRange(review.candidatePlan)} />
            <ReviewFact
              label="Candidate schedule"
              value={`${review.candidatePlan.nonRestRowCount} runs · ${review.candidatePlan.rowCount} rows`}
            />
          </div>
        </div>
      </section>

      <section className="hito-surface-wash" data-tone="signal">
        <div className="flex items-start gap-3">
          <Icon name="calendar" size="sm" className="mt-0.5 text-signal" />
          <div className="min-w-0">
            <p className="hito-list-row-title">Upcoming manual workouts stay with history</p>
            <p className="hito-list-row-copy">{review.affectedManualSchedule.statement}</p>
            <p className="hito-field-helper mt-2">
              From {formatDate(review.affectedManualSchedule.affectedFromDate)} ·{" "}
              {review.affectedManualSchedule.upcomingWorkoutCount} upcoming manual rows affected
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="hito-row-group">
          <div className="hito-list-row items-start">
            <div className="grid gap-2">
              <p className="hito-label">History preserved</p>
              <p className="hito-list-row-copy">{review.preservedHistory.statement}</p>
              <div className="flex flex-wrap gap-2">
                <span className="hito-status-pill" data-tone="muted">
                  {review.preservedHistory.loggedWorkoutCount} logs
                </span>
                <span className="hito-status-pill" data-tone="muted">
                  {review.preservedHistory.providerEvidenceCount} evidence
                </span>
                <span className="hito-status-pill" data-tone="muted">
                  {review.preservedHistory.comparisonCount} comparisons
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hito-row-group">
          <div className="hito-list-row items-start">
            <div className="grid gap-2">
              <p className="hito-label">Metric honesty</p>
              <p className="hito-list-row-copy">
                {review.metricHonesty.paceTargetRowCount > 0
                  ? `${review.metricHonesty.paceTargetRowCount} rows include backend-backed pace targets.`
                  : "No backend-backed pace rows in this candidate."}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="hito-status-pill" data-tone="muted">
                  no fake pace
                </span>
                <span className="hito-status-pill" data-tone="muted">
                  no fake personal HR
                </span>
                <span className="hito-status-pill" data-tone="muted">
                  {review.metricHonesty.hrTargetRowCount} HR target rows
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hito-row-group">
        <div className="hito-list-row items-start">
          <div className="grid gap-2">
            <p className="hito-label">What Hito will preserve</p>
            <p className="hito-list-row-copy">{review.manualTemplates.statement}</p>
            <p className="hito-field-helper">
              Server rebuilt candidate: {review.safety.serverRebuiltCandidate ? "yes" : "no"} ·
              trusted client rows: {review.safety.trustedClientRows ? "yes" : "no"} · previous plan
              archived: {review.safety.oldPlanWillBeArchived ? "yes" : "no"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function TransitionBlockedNotice({
  result,
}: {
  result: TransitionBlocked | Extract<ActivePlanTransitionConfirmResult, { ok: false }>;
}) {
  return (
    <div className="hito-surface-wash" data-tone="destructive">
      <p className="hito-list-row-title">Plan change blocked</p>
      <p className="hito-list-row-copy">{result.message}</p>
      <p className="hito-field-helper mt-2">Reason: {result.reason}</p>
    </div>
  );
}

export function CustomPlanTransitionNotice({
  onOpenPlan,
  onUseQuick,
}: {
  onUseQuick: () => void;
  onOpenPlan: () => void;
}) {
  return (
    <div className="grid gap-4">
      <section className="hito-surface-wash" data-tone="signal">
        <div className="flex items-start gap-3">
          <Icon name="warning" size="sm" className="mt-0.5 text-signal" />
          <div className="min-w-0">
            <p className="hito-list-row-title">Custom plan transition is not live yet</p>
            <p className="hito-list-row-copy">
              Quick generated plans can use the reviewed active-plan transition now. A fully custom
              active-plan replacement needs its own reviewed candidate seam, so Hito will not change
              your current plan from this tab.
            </p>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="hito-button hito-button-primary hito-button-md"
          onClick={onUseQuick}
        >
          Use Quick plan
        </button>
        <button
          type="button"
          className="hito-button hito-button-secondary hito-button-md"
          onClick={onOpenPlan}
        >
          Open plan
        </button>
      </div>
    </div>
  );
}

export function UnsupportedActivePlanNotice({ onOpenPlan }: { onOpenPlan: () => void }) {
  return (
    <div className="hito-surface-wash" data-tone="destructive">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="hito-list-row-title">Create a plan is available for manual plans first</p>
          <p className="hito-list-row-copy">
            This reviewed transition currently supports active manual plans. Your current plan is
            unchanged.
          </p>
        </div>
        <button
          type="button"
          className="hito-button hito-button-secondary hito-button-sm shrink-0"
          onClick={onOpenPlan}
        >
          Open plan
        </button>
      </div>
    </div>
  );
}

function ReviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="hito-label">{label}</p>
      <p className="hito-body-small break-words text-muted-foreground">{value}</p>
    </div>
  );
}

function formatDateRange(input: { startDate: string; endDate: string }) {
  return `${formatDate(input.startDate, { month: "short", day: "numeric" })} - ${formatDate(
    input.endDate,
    { month: "short", day: "numeric" },
  )}`;
}
