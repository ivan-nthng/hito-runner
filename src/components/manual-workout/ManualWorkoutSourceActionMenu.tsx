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
import { HitoButton } from "@/components/ui/button";
import { hitoToast } from "@/components/ui/hito-toast";
import {
  confirmWorkoutCommandAction,
  reviewWorkoutCommandAction,
} from "@/lib/manual-workout-authoring";
import type {
  ReviewedWorkoutCommandCandidate,
  WorkoutCommand,
} from "@/lib/manual-workout-authoring";
import {
  formatManualDraftStructure,
  formatReadableDate,
  manualTemplateRunnerLabelFromKey,
} from "@/components/manual-workout/manual-workout-authoring-utils";
import { workoutDistanceKm, workoutDuration, type Workout } from "@/lib/training";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";
import type { ResolvedUiLocale } from "@/lib/ui-locale";

export type ManualCopiedWorkoutSource = {
  provenancePlanId: string | null;
  sourceWorkoutId: string;
  sourceWorkoutDate: string;
  title: string;
};

export const MANUAL_COPY_PASTE_TOAST_ID = "manual-workout-copy-paste";

const MANUAL_DELETE_CLEAR_TOAST_ID = "manual-workout-delete-clear";

type ManualSourceActionStatus = "idle" | "reviewing" | "creating";
type ManualWorkoutDeleteClearReady = ReviewedWorkoutCommandCandidate & {
  command: Extract<WorkoutCommand, { operation: "delete" | "clear" }>;
};

export type ManualWorkoutSourceActionMenuProps = {
  provenancePlanId: string | null;
  canAddActivity?: boolean;
  canCopy?: boolean;
  canClear?: boolean;
  canMove?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onCleared?: () => void | Promise<void>;
  onAddActivity?: (trigger: HTMLButtonElement) => void;
  onCopy: (source: ManualCopiedWorkoutSource) => void;
  onMove?: (source: ManualCopiedWorkoutSource) => void;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  title: string;
  workout: Workout;
};

export function ManualWorkoutSourceActionMenu({
  provenancePlanId,
  canAddActivity = false,
  canCopy = true,
  canClear = false,
  canMove = false,
  children,
  disabled = false,
  onAddActivity,
  onCleared,
  onCopy,
  onMove,
  sourceWorkoutDate,
  sourceWorkoutId,
  title,
  workout,
}: ManualWorkoutSourceActionMenuProps) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const reviewWorkoutCommandFn = useServerFn(reviewWorkoutCommandAction);
  const confirmWorkoutCommandFn = useServerFn(confirmWorkoutCommandAction);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const confirmInFlightRef = useRef(false);
  const [status, setStatus] = useState<ManualSourceActionStatus>("idle");
  const [deleteReviewResult, setDeleteReviewResult] =
    useState<ManualWorkoutDeleteClearReady | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const isBusy = status !== "idle";

  const copySource = () => {
    const source = {
      provenancePlanId,
      sourceWorkoutDate,
      sourceWorkoutId,
      title,
    };
    onCopy(source);
    hitoToast.success({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: t("Workout copied"),
      description: t("{title} is ready to paste into an empty day.", { title }),
    });
  };

  const moveSource = () => {
    onMove?.({
      provenancePlanId,
      sourceWorkoutDate,
      sourceWorkoutId,
      title,
    });
    hitoToast.success({
      id: MANUAL_COPY_PASTE_TOAST_ID,
      title: t("Move source selected"),
      description: t("Pick a day to move or replace from the calendar."),
    });
  };

  const submitDeleteReview = async () => {
    if (disabled || !canClear || status !== "idle") return;

    setStatus("reviewing");
    setDeleteReviewResult(null);
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_DELETE_CLEAR_TOAST_ID,
      title: t("Reviewing clear"),
      description: t("Hito is checking whether this manual workout can be cleared."),
    });

    try {
      const result = await reviewWorkoutCommandFn({
        data: {
          operation: "delete",
          workoutId: sourceWorkoutId,
        },
      });
      setStatus("idle");

      if (!result.ok) {
        setDeleteReviewResult(null);
        hitoToast.error({
          id: MANUAL_DELETE_CLEAR_TOAST_ID,
          title: t("Clear blocked"),
          description:
            result.issues[0]?.message ?? t("Could not review this workout for clearing."),
        });
        return;
      }

      if (!isReviewedDeleteClearCommandCandidate(result.candidate)) {
        setDeleteReviewResult(null);
        hitoToast.error({
          id: MANUAL_DELETE_CLEAR_TOAST_ID,
          title: t("Clear blocked"),
          description: t("Could not review this workout for clearing."),
        });
        return;
      }

      setDeleteReviewResult(result.candidate);
      hitoToast.success({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: t("Clear reviewed"),
        description: t("Confirm before Hito removes this Calendar workout."),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Could not review this workout for clearing.");
      setStatus("idle");
      setDeleteReviewResult(null);
      hitoToast.error({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: t("Clear review failed"),
        description: message,
      });
    }
  };

  const confirmDeleteReview = async () => {
    if (!deleteReviewResult || confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setStatus("creating");
    setConfirmMessage(null);
    hitoToast.working({
      id: MANUAL_DELETE_CLEAR_TOAST_ID,
      title: t("Clearing workout"),
      description: t("Hito is confirming this Calendar change before removing the workout row."),
    });

    try {
      const candidate = deleteReviewResult;
      const result = await confirmWorkoutCommandFn({
        data: {
          command: candidate.command,
          candidateId: candidate.candidateId,
          reviewToken: candidate.reviewToken,
          reviewChecksum: candidate.reviewChecksum,
        },
      });

      if (!result.ok || (result.operation !== "delete" && result.operation !== "clear")) {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setConfirmMessage(null);
        setDeleteReviewResult(null);
        hitoToast.error({
          id: MANUAL_DELETE_CLEAR_TOAST_ID,
          title: t("Workout not cleared"),
          description: result.ok ? t("The Calendar workout could not be cleared.") : result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: t("Workout cleared"),
        description: t("Refreshing from saved Calendar truth."),
      });
      confirmInFlightRef.current = false;
      setStatus("idle");
      setDeleteReviewResult(null);
      setConfirmMessage(null);
      await onCleared?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("The Calendar workout could not be cleared.");
      confirmInFlightRef.current = false;
      setStatus("idle");
      setConfirmMessage(null);
      setDeleteReviewResult(null);
      hitoToast.error({
        id: MANUAL_DELETE_CLEAR_TOAST_ID,
        title: t("Workout not cleared"),
        description: message,
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled} ref={menuTriggerRef}>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="hito-menu-width-standard">
          <DropdownMenuLabel>{formatReadableDate(sourceWorkoutDate, locale)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canAddActivity && onAddActivity ? (
            <>
              <DropdownMenuItem
                disabled={disabled || isBusy}
                onSelect={() => {
                  if (menuTriggerRef.current) onAddActivity(menuTriggerRef.current);
                }}
              >
                <Icon name="activity" size="xs" />
                {t("Add activity")}
              </DropdownMenuItem>
              {canCopy || canMove || canClear ? <DropdownMenuSeparator /> : null}
            </>
          ) : null}
          {canCopy ? (
            <DropdownMenuItem disabled={disabled || isBusy} onSelect={copySource}>
              <Icon name="copy" size="xs" />
              {t("Copy workout")}
            </DropdownMenuItem>
          ) : null}
          {canMove ? (
            <DropdownMenuItem disabled={disabled || isBusy} onSelect={moveSource}>
              <Icon name="arrow-right" size="xs" />
              {t("Move workout")}
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
                {t("Clear workout")}
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
          status={status}
          title={title}
          workout={workout}
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
  status,
  title,
  workout,
}: {
  confirmMessage: string | null;
  fallbackDate: string;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  status: ManualSourceActionStatus;
  title: string;
  workout: Workout;
}) {
  const locale = useHitoUiLocale();
  const dateLabel = formatReadableDate(fallbackDate, locale);

  return (
    <ManualDeleteClearReadyDialog
      confirmMessage={confirmMessage}
      dateLabel={dateLabel}
      isBusy={isBusy}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      status={status}
      title={title}
      workout={workout}
    />
  );
}

function isReviewedDeleteClearCommandCandidate(
  candidate: ReviewedWorkoutCommandCandidate,
): candidate is ManualWorkoutDeleteClearReady {
  return candidate.command.operation === "delete" || candidate.command.operation === "clear";
}

function ManualDeleteClearReadyDialog({
  confirmMessage,
  dateLabel,
  isBusy,
  onConfirm,
  onOpenChange,
  open,
  status,
  title,
  workout,
}: {
  confirmMessage: string | null;
  dateLabel: string;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  status: ManualSourceActionStatus;
  title: string;
  workout: Workout;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-wide"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-ui-title-md text-foreground">
            {t("Review clear workout")}
          </DialogTitle>
          <DialogDescription className="hito-body-md text-secondary">
            {t("Confirm before Hito removes this workout from your Calendar.")}
          </DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body space-y-4">
          <div className="hito-row-group">
            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-body-md text-foreground">{dateLabel}</p>
                <p className="hito-body-sm mt-1 text-secondary">
                  {t("Selected Calendar day for the workout being cleared.")}
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                {t("Verified")}
              </span>
            </div>

            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-body-md text-foreground">{title}</p>
                <p className="hito-body-sm mt-1 text-secondary">
                  {formatDeleteClearWorkoutSummary(workout, locale)}
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                {getHitoKnownProductMessage(
                  locale,
                  manualTemplateRunnerLabelFromKey(workout.workoutIdentity),
                )}
              </span>
            </div>

            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-body-md text-foreground">{t("What changes")}</p>
                <p className="hito-body-sm mt-1 text-secondary">
                  {t(
                    "Hito deletes exactly this workout row and refreshes the Calendar from saved truth.",
                  )}
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="warning">
                {t("Calendar only")}
              </span>
            </div>

            <div className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-body-md text-foreground">{t("If you need it again")}</p>
                <p className="hito-body-sm mt-1 text-secondary">
                  {t(
                    "Add it again from the Calendar later. Hito will review it as a new workout before saving anything.",
                  )}
                </p>
              </div>
              <span className="hito-status-pill shrink-0" data-tone="muted">
                {t("Add later")}
              </span>
            </div>

            {confirmMessage ? (
              <div className="hito-list-row items-start">
                <p className="hito-body-md font-medium text-negative min-w-0">{confirmMessage}</p>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <HitoButton
            type="button"
            size="md"
            variant="secondary"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </HitoButton>
          <HitoButton
            type="button"
            loading={status === "creating"}
            size="md"
            tone="error"
            variant="primary"
            disabled={isBusy}
            onClick={onConfirm}
          >
            {status === "creating" ? (
              <>
                <Icon name="loader" size="xs" className="animate-spin" />
                {t("Clearing workout...")}
              </>
            ) : (
              <>
                <Icon name="trash" size="xs" />
                {t("Clear workout")}
              </>
            )}
          </HitoButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDeleteClearWorkoutSummary(workout: Workout, locale: ResolvedUiLocale) {
  return `${formatManualDraftStructure(
    workoutDuration(workout),
    workoutDistanceKm(workout) ?? 0,
    locale,
  )} · ${getHitoKnownProductMessage(locale, "Workout guidance")}`;
}
