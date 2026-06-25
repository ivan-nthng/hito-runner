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
import { hitoToast } from "@/components/ui/hito-toast";
import {
  confirmManualWorkoutMove,
  moveManualWorkoutWithinActivePlan,
  reviewManualWorkoutMove,
} from "@/lib/manual-workout-authoring";
import type {
  ManualWorkoutDirectMoveResult,
  ManualWorkoutMoveConfirmResult,
  ManualWorkoutMoveReviewResult,
  ManualWorkoutMoveTargetMode,
} from "@/lib/manual-workout-authoring";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
} from "@/lib/manual-workout-authoring/schema";

const MANUAL_MOVE_TOAST_ID = "manual-workout-move";
const MOVE_UNAVAILABLE_MESSAGE =
  "Hito could not move this workout yet. Try again from the calendar.";

export type ManualWorkoutMoveRequest = {
  activePlanId: string;
  requestId: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetMode: ManualWorkoutMoveTargetMode;
  targetDate: string;
  title: string;
};

type ManualWorkoutMoveStatus = "idle" | "reviewing" | "confirming";
type ManualWorkoutMoveReady = Extract<ManualWorkoutMoveReviewResult, { ok: true }>;

export function ManualWorkoutMoveController({
  onDirectMoveSucceeded,
  onMoved,
  onOptimisticMoveRejected,
  onReplacementConfirming,
  onRequestHandled,
  request,
}: {
  request: ManualWorkoutMoveRequest | null;
  onDirectMoveSucceeded: (result: Extract<ManualWorkoutDirectMoveResult, { ok: true }>) => void;
  onRequestHandled: () => void;
  onOptimisticMoveRejected: () => void;
  onReplacementConfirming: (review: ManualWorkoutMoveReady) => void;
  onMoved: () => void | Promise<void>;
}) {
  const moveManualWorkoutWithinActivePlanFn = useServerFn(moveManualWorkoutWithinActivePlan);
  const reviewManualWorkoutMoveFn = useServerFn(reviewManualWorkoutMove);
  const confirmManualWorkoutMoveFn = useServerFn(confirmManualWorkoutMove);
  const moveInFlightRef = useRef(false);
  const lastRequestIdRef = useRef<string | null>(null);
  const confirmInFlightRef = useRef(false);
  const [reviewResult, setReviewResult] = useState<ManualWorkoutMoveReviewResult | null>(null);
  const [status, setStatus] = useState<ManualWorkoutMoveStatus>("idle");

  useEffect(() => {
    if (!request || lastRequestIdRef.current === request.requestId) return;

    if (moveInFlightRef.current) {
      onRequestHandled();
      return;
    }

    lastRequestIdRef.current = request.requestId;
    moveInFlightRef.current = true;

    async function runMove(nextRequest: ManualWorkoutMoveRequest) {
      if (nextRequest.targetMode === "workout_replacement") {
        try {
          await runReplacementReview(nextRequest);
        } finally {
          moveInFlightRef.current = false;
          onRequestHandled();
        }
        return;
      }

      try {
        const response = await moveManualWorkoutWithinActivePlanFn({
          data: {
            activePlanId: nextRequest.activePlanId,
            sourceWorkoutId: nextRequest.sourceWorkoutId,
            sourceWorkoutDate: nextRequest.sourceWorkoutDate,
            targetDate: nextRequest.targetDate,
          },
        });
        const result = isManualWorkoutDirectMoveResult(response)
          ? response
          : buildMoveUnavailableResult();

        if (!result.ok) {
          if (result.reason === "replacement_requires_review") {
            onOptimisticMoveRejected();
            await runReplacementReview(nextRequest);
            return;
          }

          onOptimisticMoveRejected();
          hitoToast.error({
            id: MANUAL_MOVE_TOAST_ID,
            title: "Move blocked",
            description: result.message,
          });
          return;
        }

        await onMoved();
        onDirectMoveSucceeded(result);
        hitoToast.success({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Workout moved",
          description: "Saved to your calendar.",
        });
      } catch {
        const result = buildMoveUnavailableResult();
        onOptimisticMoveRejected();
        hitoToast.error({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Workout not moved",
          description: result.message,
        });
      } finally {
        moveInFlightRef.current = false;
        onRequestHandled();
      }
    }

    async function runReplacementReview(nextRequest: ManualWorkoutMoveRequest) {
      setStatus("reviewing");
      setReviewResult(null);
      hitoToast.working({
        id: MANUAL_MOVE_TOAST_ID,
        title: "Reviewing replacement",
        description: "Hito is checking the target workout before anything is replaced.",
      });

      try {
        const response = await reviewManualWorkoutMoveFn({
          data: {
            activePlanId: nextRequest.activePlanId,
            sourceWorkoutId: nextRequest.sourceWorkoutId,
            sourceWorkoutDate: nextRequest.sourceWorkoutDate,
            targetDate: nextRequest.targetDate,
          },
        });
        const result = isManualWorkoutMoveReviewResult(response)
          ? response
          : buildMoveReviewUnavailableResult();

        if (!result.ok) {
          setStatus("idle");
          hitoToast.error({
            id: MANUAL_MOVE_TOAST_ID,
            title: "Move blocked",
            description: result.message,
          });
          return;
        }

        setReviewResult(result);
        setStatus("idle");
        hitoToast.success({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Replacement reviewed",
          description: "Confirm before Hito replaces the target workout.",
        });
      } catch {
        const result = buildMoveReviewUnavailableResult();
        setStatus("idle");
        hitoToast.error({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Move review failed",
          description: result.message,
        });
      }
    }

    void runMove(request);
  }, [
    moveManualWorkoutWithinActivePlanFn,
    onDirectMoveSucceeded,
    onMoved,
    onOptimisticMoveRejected,
    onRequestHandled,
    request,
    reviewManualWorkoutMoveFn,
  ]);

  const confirmReplacement = async () => {
    if (!reviewResult?.ok || confirmInFlightRef.current) return;

    onReplacementConfirming(reviewResult);
    confirmInFlightRef.current = true;
    setStatus("confirming");
    hitoToast.working({
      id: MANUAL_MOVE_TOAST_ID,
      title: "Replacing workout",
      description: "Hito is confirming the reviewed replacement.",
    });

    try {
      const response = await confirmManualWorkoutMoveFn({
        data: {
          activePlanId: reviewResult.activePlanId,
          sourceWorkoutId: reviewResult.sourceWorkoutId,
          sourceWorkoutDate: reviewResult.sourceWorkoutDate,
          targetDate: reviewResult.targetDate,
          reviewToken: reviewResult.review.reviewToken,
          reviewChecksum: reviewResult.review.reviewChecksum,
        },
      });
      const result = isManualWorkoutMoveConfirmResult(response)
        ? response
        : buildMoveConfirmUnavailableResult();

      if (!result.ok) {
        onOptimisticMoveRejected();
        confirmInFlightRef.current = false;
        setStatus("idle");
        setReviewResult(null);
        hitoToast.error({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Workout not replaced",
          description: result.message,
        });
        return;
      }

      confirmInFlightRef.current = false;
      setStatus("idle");
      setReviewResult(null);
      await onMoved();
      hitoToast.success({
        id: MANUAL_MOVE_TOAST_ID,
        title: "Workout replaced",
        description: "Saved to your calendar.",
      });
    } catch {
      const result = buildMoveConfirmUnavailableResult();
      onOptimisticMoveRejected();
      confirmInFlightRef.current = false;
      setStatus("idle");
      setReviewResult(null);
      hitoToast.error({
        id: MANUAL_MOVE_TOAST_ID,
        title: "Workout not replaced",
        description: result.message,
      });
    }
  };

  return (
    <ManualWorkoutMoveReplacementDialog
      onConfirm={() => void confirmReplacement()}
      onOpenChange={(open) => {
        if (!open && status === "idle") {
          setReviewResult(null);
        }
      }}
      review={reviewResult?.ok ? reviewResult : null}
      status={status}
    />
  );
}

function buildMoveUnavailableResult(): ManualWorkoutDirectMoveResult {
  return {
    ok: false,
    status: "blocked",
    reason: "persistence_failed",
    message: MOVE_UNAVAILABLE_MESSAGE,
    persisted: false,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  };
}

function buildMoveReviewUnavailableResult(): ManualWorkoutMoveReviewResult {
  return {
    ok: false,
    status: "blocked",
    reason: "persistence_failed",
    message: MOVE_UNAVAILABLE_MESSAGE,
    persisted: false,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  };
}

function buildMoveConfirmUnavailableResult(): ManualWorkoutMoveConfirmResult {
  return {
    ok: false,
    status: "blocked",
    reason: "persistence_failed",
    message: MOVE_UNAVAILABLE_MESSAGE,
    persisted: false,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  };
}

function isManualWorkoutDirectMoveResult(value: unknown): value is ManualWorkoutDirectMoveResult {
  if (!isRecord(value) || typeof value.ok !== "boolean") return false;
  if (!value.ok) return isMoveBlockedResult(value);

  return (
    value.status === "moved" &&
    value.persisted === true &&
    typeof value.activePlanId === "string" &&
    typeof value.plannedWorkoutId === "string" &&
    typeof value.sourceWorkoutDate === "string" &&
    typeof value.targetDate === "string" &&
    typeof value.targetWeekday === "string" &&
    typeof value.title === "string" &&
    typeof value.templateKey === "string" &&
    value.mutationMode === "direct_manual_edit"
  );
}

function isManualWorkoutMoveReviewResult(value: unknown): value is ManualWorkoutMoveReviewResult {
  if (!isRecord(value) || typeof value.ok !== "boolean") return false;
  if (!value.ok) return isMoveBlockedResult(value);

  return (
    value.status === "review_ready" &&
    value.persisted === false &&
    typeof value.activePlanId === "string" &&
    typeof value.sourceWorkoutId === "string" &&
    typeof value.sourceWorkoutDate === "string" &&
    typeof value.targetDate === "string" &&
    typeof value.targetWeekday === "string" &&
    typeof value.title === "string" &&
    isRecord(value.review)
  );
}

function isManualWorkoutMoveConfirmResult(value: unknown): value is ManualWorkoutMoveConfirmResult {
  if (!isRecord(value) || typeof value.ok !== "boolean") return false;
  if (!value.ok) return isMoveBlockedResult(value);

  return (
    value.status === "moved" &&
    value.persisted === true &&
    typeof value.activePlanId === "string" &&
    typeof value.plannedWorkoutId === "string" &&
    typeof value.sourceWorkoutDate === "string" &&
    typeof value.targetDate === "string" &&
    typeof value.targetWeekday === "string" &&
    typeof value.title === "string" &&
    typeof value.templateKey === "string"
  );
}

function isMoveBlockedResult(
  value: Record<string, unknown>,
): value is Extract<ManualWorkoutDirectMoveResult, { ok: false }> {
  return (
    value.ok === false &&
    value.status === "blocked" &&
    value.persisted === false &&
    typeof value.reason === "string" &&
    typeof value.message === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function ManualWorkoutMoveReplacementDialog({
  onConfirm,
  onOpenChange,
  review,
  status,
}: {
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  review: ManualWorkoutMoveReady | null;
  status: ManualWorkoutMoveStatus;
}) {
  const busy = status !== "idle";

  return (
    <Dialog open={Boolean(review)} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-window hito-window-content-fit hito-info-window"
        overlayClassName="hito-dialog-overlay-stable hito-info-window-overlay"
      >
        <DialogHeader className="hito-info-window-header">
          <DialogTitle className="hito-info-window-title">Replace target workout?</DialogTitle>
          <DialogDescription className="hito-info-window-copy">
            This will replace the workout currently on the target day.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="hito-info-window-footer">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm"
            disabled={busy || !review}
            onClick={onConfirm}
          >
            {status === "confirming" ? "Replacing..." : "Replace workout"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
