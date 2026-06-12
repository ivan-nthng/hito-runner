import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { hitoToast } from "@/components/ui/hito-toast";
import {
  confirmManualWorkoutMove,
  reviewManualWorkoutMove,
  type ManualWorkoutMoveReviewResult,
} from "@/lib/training-api";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
} from "@/lib/manual-workout-authoring/schema";
import {
  formatManualDraftStructure,
  formatReadableDate,
  targetTruthModeLabel,
} from "@/components/manual-workout/manual-workout-authoring-utils";

const MANUAL_MOVE_TOAST_ID = "manual-workout-move";

type ManualMoveStatus = "idle" | "reviewing" | "creating";
type ManualWorkoutMoveReady = Extract<ManualWorkoutMoveReviewResult, { ok: true }>;

export type ManualWorkoutMoveRequest = {
  activePlanId: string;
  requestId: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetDate: string;
  title: string;
};

export function ManualWorkoutMoveController({
  onMoved,
  onRequestHandled,
  request,
}: {
  request: ManualWorkoutMoveRequest | null;
  onRequestHandled: () => void;
  onMoved: () => void | Promise<void>;
}) {
  const reviewManualWorkoutMoveFn = useServerFn(reviewManualWorkoutMove);
  const confirmManualWorkoutMoveFn = useServerFn(confirmManualWorkoutMove);
  const confirmInFlightRef = useRef(false);
  const lastRequestIdRef = useRef<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<ManualWorkoutMoveRequest | null>(null);
  const [status, setStatus] = useState<ManualMoveStatus>("idle");
  const [reviewResult, setReviewResult] = useState<ManualWorkoutMoveReviewResult | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const isBusy = status !== "idle";

  useEffect(() => {
    if (!request || lastRequestIdRef.current === request.requestId) return;

    lastRequestIdRef.current = request.requestId;
    setActiveRequest(request);
    setStatus("reviewing");
    setReviewResult(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_MOVE_TOAST_ID,
      title: "Reviewing move",
      description: "Hito is checking the source workout and target day before anything changes.",
    });

    async function runMoveReview(nextRequest: ManualWorkoutMoveRequest) {
      try {
        const result = await reviewManualWorkoutMoveFn({
          data: {
            activePlanId: nextRequest.activePlanId,
            sourceWorkoutId: nextRequest.sourceWorkoutId,
            targetDate: nextRequest.targetDate,
          },
        });
        setStatus("idle");
        setReviewResult(result);

        if (!result.ok) {
          hitoToast.error({
            id: MANUAL_MOVE_TOAST_ID,
            title: "Move blocked",
            description: result.message,
          });
          return;
        }

        hitoToast.success({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Move reviewed",
          description: "Confirm the backend-reviewed move before Hito changes the plan.",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not review this workout move yet.";
        setStatus("idle");
        setReviewResult({
          ok: false,
          status: "blocked",
          reason: "invalid_input",
          message,
          persisted: false,
          sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
          workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
        });
        hitoToast.error({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Move review failed",
          description: message,
        });
      } finally {
        onRequestHandled();
      }
    }

    void runMoveReview(request);
  }, [onRequestHandled, request, reviewManualWorkoutMoveFn]);

  const confirmMoveReview = async () => {
    if (!reviewResult?.ok || confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setStatus("creating");
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_MOVE_TOAST_ID,
      title: "Moving workout",
      description: "Hito is confirming the reviewed move server-side.",
    });

    try {
      const result = await confirmManualWorkoutMoveFn({
        data: {
          activePlanId: reviewResult.activePlanId,
          sourceWorkoutId: reviewResult.sourceWorkoutId,
          targetDate: reviewResult.targetDate,
          reviewToken: reviewResult.review.reviewToken,
          reviewChecksum: reviewResult.review.reviewChecksum,
        },
      });

      if (!result.ok) {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setConfirmMessage(result.message);
        setReviewResult(result);
        hitoToast.error({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Workout not moved",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_MOVE_TOAST_ID,
        title: "Workout moved",
        description: "Refreshing the calendar from saved plan truth.",
      });
      confirmInFlightRef.current = false;
      setStatus("idle");
      setReviewResult(null);
      setActiveRequest(null);
      setConfirmMessage(null);
      await onMoved();
    } catch (error) {
      const message = error instanceof Error ? error.message : "The workout could not be moved.";
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConfirmMessage(message);
      hitoToast.error({
        id: MANUAL_MOVE_TOAST_ID,
        title: "Workout not moved",
        description: message,
      });
    }
  };

  if (!reviewResult) return null;

  return (
    <ManualWorkoutMoveReviewDialog
      confirmMessage={confirmMessage}
      fallbackRequest={activeRequest}
      isBusy={isBusy}
      onConfirm={() => void confirmMoveReview()}
      onOpenChange={(open) => {
        if (!open && !isBusy) {
          setReviewResult(null);
          setActiveRequest(null);
          setConfirmMessage(null);
        }
      }}
      open={Boolean(reviewResult)}
      result={reviewResult}
      status={status}
    />
  );
}

function ManualWorkoutMoveReviewDialog({
  confirmMessage,
  fallbackRequest,
  isBusy,
  onConfirm,
  onOpenChange,
  open,
  result,
  status,
}: {
  confirmMessage: string | null;
  fallbackRequest: ManualWorkoutMoveRequest | null;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  result: ManualWorkoutMoveReviewResult;
  status: ManualMoveStatus;
}) {
  if (!result.ok) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="hito-product-dialog max-w-xl">
          <DialogHeader className="hito-product-dialog-header">
            <DialogTitle className="hito-modal-title">Move blocked</DialogTitle>
            <DialogDescription className="hito-body">
              Hito could not approve moving this manual workout to the selected day.
            </DialogDescription>
          </DialogHeader>
          <div className="hito-product-dialog-body">
            <div className="hito-row-group">
              <div className="hito-list-row items-start">
                <div className="min-w-0">
                  <p className="hito-list-row-title">
                    {fallbackRequest?.title ?? "Selected workout"}
                  </p>
                  <p className="hito-list-row-copy">
                    {fallbackRequest
                      ? `${formatReadableDate(fallbackRequest.sourceWorkoutDate)} -> ${formatReadableDate(
                          fallbackRequest.targetDate,
                        )}`
                      : "Selected source and target date"}
                  </p>
                </div>
                <span className="hito-status-pill shrink-0" data-tone="warning">
                  Blocked
                </span>
              </div>
              <div className="hito-list-row items-start">
                <div className="min-w-0">
                  <p className="hito-list-row-title">{moveBlockedReasonLabel(result.reason)}</p>
                  <p className="hito-list-row-copy">{result.message}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-md"
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ManualWorkoutMoveReadyDialog
      confirmMessage={confirmMessage}
      isBusy={isBusy}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      result={result}
      status={status}
    />
  );
}

function ManualWorkoutMoveReadyDialog({
  confirmMessage,
  isBusy,
  onConfirm,
  onOpenChange,
  open,
  result,
  status,
}: {
  confirmMessage: string | null;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  result: ManualWorkoutMoveReady;
  status: ManualMoveStatus;
}) {
  const draft = result.targetReview.draft;
  const sourceLabel = formatReadableDate(result.sourceWorkoutDate);
  const targetLabel = formatReadableDate(result.targetDate);
  const metricPolicy = targetTruthModeLabel(result.draftInput.targetTruthMode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hito-product-dialog max-w-2xl">
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Review move</DialogTitle>
          <DialogDescription className="hito-body">
            Confirm this backend-reviewed move before Hito changes your manual active plan.
          </DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body space-y-4">
          <div className="hito-row-group">
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">Move from</p>
                <p className="hito-list-row-copy">{sourceLabel}</p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                Verified
              </span>
            </div>
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">Move to</p>
                <p className="hito-list-row-copy">
                  {targetLabel} · {result.targetWeekday}
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="success">
                Empty day
              </span>
            </div>
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">{result.title}</p>
                <p className="hito-list-row-copy">
                  {formatManualDraftStructure(draft.totalDurationMin, draft.totalDistanceKm)} ·{" "}
                  {metricPolicy}
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                {result.templateKey.replaceAll("_", " ")}
              </span>
            </div>
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">What changes</p>
                <p className="hito-list-row-copy">
                  Hito moves exactly this planned workout row. The source day becomes empty, the
                  target day receives the workout, and the calendar refreshes from persisted truth.
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                Manual plan
              </span>
            </div>
            {confirmMessage ? (
              <div className="hito-list-row items-start">
                <p className="hito-field-error min-w-0">{confirmMessage}</p>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-md"
            disabled={isBusy}
            onClick={onConfirm}
          >
            {status === "creating" ? (
              <>
                <Icon name="loader" size="xs" className="animate-spin" />
                Moving workout...
              </>
            ) : (
              <>
                <Icon name="arrow-right" size="xs" />
                Move workout
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function moveBlockedReasonLabel(
  reason: Extract<ManualWorkoutMoveReviewResult, { ok: false }>["reason"],
) {
  if (reason === "occupied_day") return "Target day is occupied";
  if (reason === "protected_day") return "Protected day";
  if (reason === "target_date_unchanged") return "Choose a different day";
  if (reason === "source_workout_not_found") return "Workout not found";
  if (reason === "source_workout_not_in_active_plan") return "Workout is not in this plan";
  if (reason === "source_workout_not_supported") return "Workout cannot be moved here";
  if (reason === "unsupported_active_plan_source") return "Only manual plans can be changed here";
  if (reason === "stale_review") return "Review is stale";
  if (reason === "invalid_review") return "Review needs refresh";
  if (reason === "unauthenticated") return "Sign in required";
  if (reason === "persistence_failed") return "Could not save the change";
  if (reason === "no_active_plan") return "No active manual plan";
  return "Move needs review";
}
