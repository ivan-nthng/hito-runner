import { useRef, useState } from "react";
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
  snapshot,
  workout,
}: {
  feedback: WorkoutResultFeedbackSummary | null;
  localActivityFileDesignFixtureEnabled: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  snapshot: TrainingSnapshot;
  workout: Workout;
}) {
  const fallbackReturnFocusRef = useRef<HTMLElement | null>(null);
  const [isUploadInProgress, setIsUploadInProgress] = useState(false);
  const [localFixtureFeedback, setLocalFixtureFeedback] =
    useState<WorkoutResultFeedbackSummary | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const activeFeedback = localFixtureFeedback ?? feedback;

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
            const returnTarget = fallbackReturnFocusRef.current;

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
              feedback={activeFeedback}
              localFixturePreviewActive={localFixtureFeedback != null}
              localActivityFileDesignFixtureEnabled={localActivityFileDesignFixtureEnabled}
              onLocalFixturePreviewChange={(nextFixtureFeedback) => {
                setLocalFixtureFeedback(nextFixtureFeedback);

                if (!nextFixtureFeedback) {
                  setUploadNotice(null);
                }
              }}
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
