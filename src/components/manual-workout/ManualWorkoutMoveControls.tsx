import { useCallback, useEffect, useRef, useState } from "react";
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
import { HitoButton } from "@/components/ui/button";
import {
  confirmWorkoutCommandAction,
  reviewWorkoutCommandAction,
} from "@/lib/manual-workout-authoring";
import type {
  ManualWorkoutMoveTargetDayKind,
  ReviewedWorkoutCommandCandidate,
  WorkoutCommand,
} from "@/lib/manual-workout-authoring";

const MANUAL_MOVE_TOAST_ID = "manual-workout-move";
const MOVE_UNAVAILABLE_MESSAGE =
  "Hito could not move this workout yet. Try again from the calendar.";

export type ManualWorkoutMoveRequest = {
  provenancePlanId: string | null;
  requestId: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetDayKind: ManualWorkoutMoveTargetDayKind;
  targetDate: string;
  title: string;
};

export type ManualWorkoutMoveReviewReady = {
  reviewChecksum: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetDate: string;
};

export type ManualWorkoutMoveSuccess = {
  displacedWorkoutId: string | null;
  plannedWorkoutId: string;
  sourceWorkoutDate: string;
  targetDate: string;
  title: string;
  undoExpiresAt: string | null;
};

type ReviewedMoveCommandCandidate = ReviewedWorkoutCommandCandidate & {
  command: Extract<WorkoutCommand, { operation: "move" }>;
};

type ManualWorkoutMoveReady = {
  candidate: ReviewedMoveCommandCandidate;
  request: ManualWorkoutMoveRequest;
};

type ManualWorkoutMoveStatus = "idle" | "reviewing" | "confirming";

export function ManualWorkoutMoveController({
  onDirectMoveSucceeded,
  onMoved,
  onOptimisticMoveRejected,
  onReplacementConfirming,
  onReplacementMoveSucceeded,
  onRequestHandled,
  request,
}: {
  request: ManualWorkoutMoveRequest | null;
  onDirectMoveSucceeded: (result: ManualWorkoutMoveSuccess) => void;
  onRequestHandled: () => void;
  onOptimisticMoveRejected: () => void;
  onReplacementConfirming: (review: ManualWorkoutMoveReviewReady) => void;
  onReplacementMoveSucceeded: (result: ManualWorkoutMoveSuccess) => void;
  onMoved: () => void | Promise<void>;
}) {
  const reviewWorkoutCommandFn = useServerFn(reviewWorkoutCommandAction);
  const confirmWorkoutCommandFn = useServerFn(confirmWorkoutCommandAction);
  const moveInFlightRef = useRef(false);
  const lastRequestIdRef = useRef<string | null>(null);
  const confirmInFlightRef = useRef(false);
  const [reviewResult, setReviewResult] = useState<ManualWorkoutMoveReady | null>(null);
  const [status, setStatus] = useState<ManualWorkoutMoveStatus>("idle");

  const confirmReviewedMove = useCallback(
    async (ready: ManualWorkoutMoveReady, replacement: boolean) => {
      if (confirmInFlightRef.current) return;

      if (replacement) {
        onReplacementConfirming({
          reviewChecksum: ready.candidate.reviewChecksum,
          sourceWorkoutDate: ready.request.sourceWorkoutDate,
          sourceWorkoutId: ready.request.sourceWorkoutId,
          targetDate: ready.request.targetDate,
        });
      }
      confirmInFlightRef.current = true;
      setStatus("confirming");
      hitoToast.working({
        id: MANUAL_MOVE_TOAST_ID,
        title: replacement ? "Replacing workout" : "Moving workout",
        description: replacement
          ? "Hito is confirming the reviewed replacement."
          : "Hito is confirming the reviewed move.",
      });

      try {
        const candidate = ready.candidate;
        const response = await confirmWorkoutCommandFn({
          data: {
            command: candidate.command,
            candidateId: candidate.candidateId,
            reviewToken: candidate.reviewToken,
            reviewChecksum: candidate.reviewChecksum,
          },
        });

        if (!response.ok || response.operation !== "move") {
          onOptimisticMoveRejected();
          hitoToast.error({
            id: MANUAL_MOVE_TOAST_ID,
            title: replacement ? "Workout not replaced" : "Workout not moved",
            description: response.ok ? MOVE_UNAVAILABLE_MESSAGE : response.message,
          });
          return;
        }

        const persisted = parseMoveCommandResult(response.result);
        if (!persisted) {
          onOptimisticMoveRejected();
          hitoToast.error({
            id: MANUAL_MOVE_TOAST_ID,
            title: replacement ? "Workout not replaced" : "Workout not moved",
            description: MOVE_UNAVAILABLE_MESSAGE,
          });
          return;
        }

        const success: ManualWorkoutMoveSuccess = {
          ...persisted,
          title: ready.request.title,
        };
        if (replacement) {
          onReplacementMoveSucceeded(success);
        } else {
          onDirectMoveSucceeded(success);
        }
        await onMoved();
        hitoToast.success({
          id: MANUAL_MOVE_TOAST_ID,
          title: replacement ? "Workout replaced" : "Workout moved",
          description: "Saved to your calendar.",
        });
      } catch {
        onOptimisticMoveRejected();
        hitoToast.error({
          id: MANUAL_MOVE_TOAST_ID,
          title: replacement ? "Workout not replaced" : "Workout not moved",
          description: MOVE_UNAVAILABLE_MESSAGE,
        });
      } finally {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setReviewResult(null);
      }
    },
    [
      confirmWorkoutCommandFn,
      onDirectMoveSucceeded,
      onMoved,
      onOptimisticMoveRejected,
      onReplacementConfirming,
      onReplacementMoveSucceeded,
    ],
  );

  useEffect(() => {
    if (!request || lastRequestIdRef.current === request.requestId) return;

    if (moveInFlightRef.current) {
      onRequestHandled();
      return;
    }

    lastRequestIdRef.current = request.requestId;
    moveInFlightRef.current = true;

    async function runMove(nextRequest: ManualWorkoutMoveRequest) {
      setStatus("reviewing");
      setReviewResult(null);
      hitoToast.working({
        id: MANUAL_MOVE_TOAST_ID,
        title:
          nextRequest.targetDayKind === "workout_day" ? "Reviewing replacement" : "Reviewing move",
        description:
          nextRequest.targetDayKind === "workout_day"
            ? "Hito is checking the target workout before anything is replaced."
            : "Hito is checking the Calendar before moving this workout.",
      });

      try {
        const response = await reviewWorkoutCommandFn({
          data: {
            operation: "move",
            workoutId: nextRequest.sourceWorkoutId,
            targetDate: nextRequest.targetDate,
          },
        });
        if (!response.ok) {
          onOptimisticMoveRejected();
          hitoToast.error({
            id: MANUAL_MOVE_TOAST_ID,
            title: "Move blocked",
            description: response.issues[0]?.message ?? MOVE_UNAVAILABLE_MESSAGE,
          });
          return;
        }
        if (!isReviewedMoveCommandCandidate(response.candidate)) {
          onOptimisticMoveRejected();
          hitoToast.error({
            id: MANUAL_MOVE_TOAST_ID,
            title: "Move blocked",
            description: MOVE_UNAVAILABLE_MESSAGE,
          });
          return;
        }

        const ready = { candidate: response.candidate, request: nextRequest };
        if (ready.candidate.command.targetPolicy.targetDayKind === "workout_day") {
          setReviewResult(ready);
          setStatus("idle");
          hitoToast.success({
            id: MANUAL_MOVE_TOAST_ID,
            title: "Replacement reviewed",
            description: "Confirm before Hito replaces the target workout.",
          });
          return;
        }

        await confirmReviewedMove(ready, false);
      } catch {
        onOptimisticMoveRejected();
        hitoToast.error({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Move review failed",
          description: MOVE_UNAVAILABLE_MESSAGE,
        });
      } finally {
        moveInFlightRef.current = false;
        onRequestHandled();
        setStatus((current) => (current === "reviewing" ? "idle" : current));
      }
    }

    void runMove(request);
  }, [
    confirmReviewedMove,
    onOptimisticMoveRejected,
    onRequestHandled,
    request,
    reviewWorkoutCommandFn,
  ]);

  return (
    <ManualWorkoutMoveReplacementDialog
      onConfirm={() => {
        if (reviewResult) void confirmReviewedMove(reviewResult, true);
      }}
      onOpenChange={(open) => {
        if (!open && status === "idle") {
          setReviewResult(null);
        }
      }}
      review={reviewResult}
      status={status}
    />
  );
}

function isReviewedMoveCommandCandidate(
  candidate: ReviewedWorkoutCommandCandidate,
): candidate is ReviewedMoveCommandCandidate {
  return candidate.command.operation === "move";
}

function parseMoveCommandResult(value: unknown): Omit<ManualWorkoutMoveSuccess, "title"> | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.plannedWorkoutId !== "string" ||
    typeof value.sourceWorkoutDate !== "string" ||
    typeof value.targetDate !== "string" ||
    (value.displacedWorkoutId !== null && typeof value.displacedWorkoutId !== "string") ||
    (value.undoExpiresAt !== null && typeof value.undoExpiresAt !== "string")
  ) {
    return null;
  }

  return {
    displacedWorkoutId: value.displacedWorkoutId,
    plannedWorkoutId: value.plannedWorkoutId,
    sourceWorkoutDate: value.sourceWorkoutDate,
    targetDate: value.targetDate,
    undoExpiresAt: value.undoExpiresAt,
  };
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
  const returnFocusDateRef = useRef<string | null>(null);

  if (review?.request.sourceWorkoutDate) {
    returnFocusDateRef.current = review.request.sourceWorkoutDate;
  }

  return (
    <Dialog open={Boolean(review)} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-window hito-window-content-fit hito-info-window"
        onCloseAutoFocus={(event) => {
          event.preventDefault();

          const sourceWorkoutDate = returnFocusDateRef.current;
          if (!sourceWorkoutDate) return;

          window.requestAnimationFrame(() => {
            const sourceLink = Array.from(
              document.querySelectorAll<HTMLAnchorElement>(
                `a[href="/workout/${sourceWorkoutDate}"]`,
              ),
            ).find((link) => link.getClientRects().length > 0);

            sourceLink?.parentElement
              ?.querySelector<HTMLButtonElement>('button[aria-label^="More activity actions for "]')
              ?.focus({ preventScroll: true });
          });
        }}
        overlayClassName="hito-dialog-overlay-stable hito-info-window-overlay"
      >
        <DialogHeader className="hito-info-window-header">
          <DialogTitle className="hito-info-window-title">Replace target workout?</DialogTitle>
          <DialogDescription className="hito-info-window-copy">
            This will replace the workout currently on the target day.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="hito-info-window-footer">
          <HitoButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </HitoButton>
          <HitoButton
            type="button"
            loading={status === "confirming"}
            size="sm"
            variant="primary"
            disabled={busy || !review}
            onClick={onConfirm}
          >
            {status === "confirming" ? "Replacing..." : "Replace workout"}
          </HitoButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
