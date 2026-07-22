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
            This review is non-mutating. Your calendar changes only after explicit confirmation.
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
                Past calendar history was carried forward and the reviewed plan now owns the future
                schedule.
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
            <ReviewFact label="Candidate plan" value={review.candidatePlan.goalLabel} />
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
            <p className="hito-list-row-title">Future mutable workouts will be replaced</p>
            <p className="hito-list-row-copy">{review.affectedManualSchedule.statement}</p>
            <p className="hito-field-helper mt-2">
              From {formatDate(review.affectedManualSchedule.affectedFromDate)} ·{" "}
              {review.affectedManualSchedule.upcomingWorkoutCount} future mutable rows affected
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
                  {review.preservedHistory.providerEvidenceCount} activity records
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
                  ? `${review.metricHonesty.paceTargetRowCount} workouts include pace guidance.`
                  : "This plan does not use pace guidance."}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="hito-status-pill" data-tone="muted">
                  {review.metricHonesty.paceTargetRowCount} pace-guided workouts
                </span>
                <span className="hito-status-pill" data-tone="muted">
                  {review.metricHonesty.hrTargetRowCount} BPM-guided workouts
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
              Your previous plan and completed history stay available after this change.
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
  const copy = transitionBlockedCopy(result.reason);

  return (
    <div className="hito-surface-wash" data-tone="destructive">
      <p className="hito-list-row-title">Plan change blocked</p>
      <p className="hito-list-row-copy">{copy}</p>
    </div>
  );
}

function transitionBlockedCopy(reason: TransitionBlocked["reason"]) {
  switch (reason) {
    case "unauthenticated":
      return "Sign in again before reviewing this plan change.";
    case "no_active_plan":
      return "Open your current plan, then try creating a replacement again.";
    case "persistence_failed":
      return "The new plan could not be saved. Your current plan is unchanged.";
    case "invalid_review":
    case "stale_review":
    case "input_mismatch":
    case "preview_unavailable":
      return "This review is no longer current. Refresh the preview and review the change again.";
  }
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
