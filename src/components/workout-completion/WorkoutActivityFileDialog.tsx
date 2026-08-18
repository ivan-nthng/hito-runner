import { type RefObject, useRef, useState } from "react";
import { WorkoutFeedbackPanel } from "@/components/CompletionPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TrainingSnapshot, Workout } from "@/lib/training";
import type { WorkoutResultFeedbackSummary } from "@/lib/workout-result-import/types";

export function WorkoutActivityFileDialog({
  feedback,
  localActivityFileDesignFixtureEnabled,
  onOpenChange,
  open,
  returnFocusRef,
  snapshot,
  workout,
}: {
  feedback: WorkoutResultFeedbackSummary | null;
  localActivityFileDesignFixtureEnabled: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  snapshot: TrainingSnapshot;
  workout: Workout;
}) {
  const fallbackReturnFocusRef = useRef<HTMLElement | null>(null);
  const [isUploadInProgress, setIsUploadInProgress] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  return (
    <>
      {uploadNotice ? (
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {uploadNotice}
        </p>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && isUploadInProgress) {
            return;
          }

          if (nextOpen) {
            setUploadNotice(null);
          }

          onOpenChange(nextOpen);
        }}
      >
        <DialogContent
          className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
          overlayClassName="hito-dialog-overlay-stable"
          showCloseButton={!isUploadInProgress}
          onEscapeKeyDown={(event) => {
            if (isUploadInProgress) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (isUploadInProgress) {
              event.preventDefault();
            }
          }}
          onOpenAutoFocus={() => {
            const activeElement = document.activeElement;
            fallbackReturnFocusRef.current =
              activeElement instanceof HTMLElement ? activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            const returnTarget = returnFocusRef?.current ?? fallbackReturnFocusRef.current;

            if (!returnTarget?.isConnected) {
              return;
            }

            event.preventDefault();
            returnTarget.focus();
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Activity file</DialogTitle>
            <DialogDescription>
              Upload or review an activity file for this workout.
            </DialogDescription>
          </DialogHeader>

          <div
            className="hito-product-dialog-body-scroll-fill"
            aria-busy={isUploadInProgress || undefined}
          >
            <WorkoutFeedbackPanel
              workout={workout}
              snapshot={snapshot}
              feedback={feedback}
              localActivityFileDesignFixtureEnabled={localActivityFileDesignFixtureEnabled}
              onUploadInProgressChange={setIsUploadInProgress}
              onUploadSucceeded={(notice) => {
                setUploadNotice(notice);
                onOpenChange(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
