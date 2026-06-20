import { type ReactNode, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { hitoToast } from "@/components/ui/hito-toast";
import {
  confirmManualWorkoutDeleteClear,
  reviewManualWorkoutDeleteClear,
} from "@/lib/training-api";
import type { ManualWorkoutDeleteClearReviewResult } from "@/lib/manual-workout-authoring";
import {
  formatManualDraftStructure,
  formatReadableDate,
  targetTruthModeLabel,
} from "@/components/manual-workout/manual-workout-authoring-utils";

export type ManualCopiedWorkoutSource = {
  activePlanId: string;
  sourceWorkoutId: string;
  sourceWorkoutDate: string;
  title: string;
};

export const MANUAL_COPY_PASTE_TOAST_ID = "manual-workout-copy-paste";

const MANUAL_DELETE_CLEAR_TOAST_ID = "manual-workout-delete-clear";

type ManualSourceActionStatus = "idle" | "reviewing" | "creating";
type ManualWorkoutDeleteClearReady = Extract<ManualWorkoutDeleteClearReviewResult, { ok: true }>;

export type ManualWorkoutSourceActionMenuProps = {
  activePlanId: string;
  canCopy?: boolean;
  canClear?: boolean;
  canMove?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onCleared?: () => void | Promise<void>;
  onCopy: (source: ManualCopiedWorkoutSource) => void;
  onMove?: (source: ManualCopiedWorkoutSource) => void;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  title: string;
};

export function ManualWorkoutSourceActionMenu({
  activePlanId,
  canCopy = true,
  canClear = false,
  canMove = false,
  children,
  disabled = false,
  onCleared,
  onCopy,
  onMove,
  sourceWorkoutDate,
  sourceWorkoutId,
  title,
}: ManualWorkoutSourceActionMenuProps) {
  const reviewManualWorkoutDeleteClearFn = useServerFn(reviewManualWorkoutDeleteClear);
  const confirmManualWorkoutDeleteClearFn = useServerFn(confirmManualWorkoutDeleteClear);
  const confirmInFlightRef = useRef(false);
  const [status, setStatus] = useState<ManualSourceActionStatus>("idle");
  const [deleteReviewResult, setDeleteReviewResult] =
    useState<ManualWorkoutDeleteClearReviewResult | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const isBusy = status !== "idle";

  const copySource = () => {
    const source = {
      activePlanId,
      sourceWorkoutDate,
      sourceWorkoutId,
      title,
    };
    onCopy(source);
    hitoToast.success({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: "Workout copied",
      description: `${title} is ready to paste into an empty future day.`,
    });
  };

  const moveSource = () => {
    onMove?.({
      activePlanId,
      sourceWorkoutDate,
      sourceWorkoutId,
      title,
    });
    hitoToast.success({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: "Move source selected",
      description: "Choose an empty future day and use Add to move this workout there.",
    });
  };

  const submitDeleteReview = async () => {
    if (disabled || !canClear || status !== "idle") return;

    setStatus("reviewing");
    setDeleteReviewResult(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_DELETE_CLEAR_TOAST_ID,
      title: "Reviewing clear",
      description: "Hito is checking whether this manual workout can be cleared.",
    });

    try {
      const result = await reviewManualWorkoutDeleteClearFn({
        data: {
          activePlanId,
          plannedWorkoutId: sourceWorkoutId,
        },
      });
      setStatus("idle");

      if (!result.ok) {
        setDeleteReviewResult(null);
        hitoToast.error({
          id: MANUAL_DELETE_CLEAR_TOAST_ID,
          title: "Clear blocked",
          description: result.message,
        });
        return;
      }

      setDeleteReviewResult(result);
      hitoToast.success({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: "Clear reviewed",
        description: "Confirm before Hito removes this planned workout.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not review this workout for clearing.";
      setStatus("idle");
      setDeleteReviewResult(null);
      hitoToast.error({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: "Clear review failed",
        description: message,
      });
    }
  };

  const confirmDeleteReview = async () => {
    if (!deleteReviewResult?.ok || confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setStatus("creating");
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_DELETE_CLEAR_TOAST_ID,
      title: "Clearing workout",
      description: "Hito is confirming the reviewed delete server-side.",
    });

    try {
      const result = await confirmManualWorkoutDeleteClearFn({
        data: {
          activePlanId,
          plannedWorkoutId: deleteReviewResult.plannedWorkoutId,
          reviewToken: deleteReviewResult.review.reviewToken,
          reviewChecksum: deleteReviewResult.review.reviewChecksum,
        },
      });

      if (!result.ok) {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setConfirmMessage(null);
        setDeleteReviewResult(null);
        hitoToast.error({
          id: MANUAL_DELETE_CLEAR_TOAST_ID,
          title: "Workout not cleared",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: "Workout cleared",
        description: "Refreshing the calendar from saved plan truth.",
      });
      confirmInFlightRef.current = false;
      setStatus("idle");
      setDeleteReviewResult(null);
      setConfirmMessage(null);
      await onCleared?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The planned workout could not be cleared.";
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConfirmMessage(null);
      setDeleteReviewResult(null);
      hitoToast.error({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: "Workout not cleared",
        description: message,
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{formatReadableDate(sourceWorkoutDate)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canCopy ? (
            <DropdownMenuItem disabled={disabled || isBusy} onSelect={copySource}>
              <Icon name="copy" size="xs" />
              Copy workout
            </DropdownMenuItem>
          ) : null}
          {canMove ? (
            <DropdownMenuItem disabled={disabled || isBusy} onSelect={moveSource}>
              <Icon name="arrow-right" size="xs" />
              Move workout
            </DropdownMenuItem>
          ) : null}
          {canClear ? (
            <>
              {canCopy || canMove ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                className="text-destructive"
                disabled={disabled || isBusy}
                onSelect={() => void submitDeleteReview()}
              >
                <Icon name="trash" size="xs" />
                Clear workout
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {deleteReviewResult ? (
        <ManualDeleteClearReviewDialog
          confirmMessage={confirmMessage}
          fallbackDate={sourceWorkoutDate}
          isBusy={isBusy}
          onConfirm={() => void confirmDeleteReview()}
          onOpenChange={(open) => {
            if (!open && !isBusy) {
              setDeleteReviewResult(null);
              setConfirmMessage(null);
            }
          }}
          open={Boolean(deleteReviewResult)}
          result={deleteReviewResult}
          status={status}
        />
      ) : null}
    </>
  );
}

function ManualDeleteClearReviewDialog({
  confirmMessage,
  fallbackDate,
  isBusy,
  onConfirm,
  onOpenChange,
  open,
  result,
  status,
}: {
  confirmMessage: string | null;
  fallbackDate: string;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  result: ManualWorkoutDeleteClearReviewResult;
  status: ManualSourceActionStatus;
}) {
  const dateLabel = formatReadableDate(result.ok ? result.workoutDate : fallbackDate);

  if (!result.ok) {
    return null;
  }

  return (
    <ManualDeleteClearReadyDialog
      confirmMessage={confirmMessage}
      dateLabel={dateLabel}
      isBusy={isBusy}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      result={result}
      status={status}
    />
  );
}

function ManualDeleteClearReadyDialog({
  confirmMessage,
  dateLabel,
  isBusy,
  onConfirm,
  onOpenChange,
  open,
  result,
  status,
}: {
  confirmMessage: string | null;
  dateLabel: string;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  result: ManualWorkoutDeleteClearReady;
  status: ManualSourceActionStatus;
}) {
  const draft = result.restore.review.draft;
  const metricPolicy = targetTruthModeLabel(result.restore.draftInput.targetTruthMode);
  const restoreLabels = [result.restore.label, ...result.restore.alternateLabels].join(" / ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog max-w-2xl border-hairline bg-background/95 p-0 backdrop-blur-xl"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Review clear workout</DialogTitle>
          <DialogDescription className="hito-body">
            Confirm before Hito removes this planned workout from your active plan.
          </DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body space-y-4">
          <div className="hito-row-group">
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">{dateLabel}</p>
                <p className="hito-list-row-copy">
                  Selected calendar day for the planned workout being cleared.
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                Verified
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
                  Hito deletes exactly this planned workout row. The active plan remains active and
                  the calendar refreshes from persisted plan truth.
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="warning">
                Planned only
              </span>
            </div>

            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">Restore affordance</p>
                <p className="hito-list-row-copy">
                  Backend returned reviewed next-step data for {restoreLabels}. Actual restore must
                  go back through the active-plan Add review flow.
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                {result.restore.label}
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
            data-tone="error"
            disabled={isBusy}
            onClick={onConfirm}
          >
            {status === "creating" ? (
              <>
                <Icon name="loader" size="xs" className="animate-spin" />
                Clearing workout...
              </>
            ) : (
              <>
                <Icon name="trash" size="xs" />
                Clear workout
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
