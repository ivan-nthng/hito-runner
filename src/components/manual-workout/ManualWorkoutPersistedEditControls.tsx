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
  confirmManualWorkoutPersistedEdit,
  reconstructManualWorkoutPersistedEditDraft,
  reviewManualWorkoutPersistedEditDraft,
} from "@/lib/training-api";
import type {
  ManualWorkoutDraftInput,
  ManualWorkoutPersistedEditReviewResult,
  ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring";
import type { ManualWorkoutTemplateKey } from "@/lib/manual-workout-authoring/schema";
import {
  MANUAL_WORKOUT_TEMPLATES,
  cloneManualWorkoutEntries,
  formatManualDraftStructure,
  formatReadableDate,
  getDefaultManualWorkoutTemplate,
  targetTruthModeCopy,
  targetTruthModeLabel,
  templateIconKind,
  templateIconTone,
} from "@/components/manual-workout/manual-workout-authoring-utils";
import { ManualWorkoutConstructorEditor } from "@/components/manual-workout/ManualWorkoutConstructorEditor";

const MANUAL_PERSISTED_EDIT_TOAST_ID = "manual-workout-persisted-edit";

type PersistedEditStatus = "idle" | "loading" | "reviewing" | "saving";

type EditableDraftState = {
  baseDraftInput: ManualWorkoutDraftInput;
  entries: ManualWorkoutDraftInput["entries"];
  notes: string;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  title: string;
};

type PersistedEditSourcePayload = {
  activePlanId?: string;
  plannedWorkoutId: string;
  workoutDate: string;
};

export function ManualWorkoutPersistedEditDialog({
  activePlanId,
  onEdited,
  onOpenChange,
  open,
  plannedWorkoutId,
  title,
  workoutDate,
}: {
  activePlanId: string | null | undefined;
  onEdited: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  plannedWorkoutId: string;
  title: string;
  workoutDate: string;
}) {
  const reconstructEditDraftFn = useServerFn(reconstructManualWorkoutPersistedEditDraft);
  const reviewEditDraftFn = useServerFn(reviewManualWorkoutPersistedEditDraft);
  const confirmEditDraftFn = useServerFn(confirmManualWorkoutPersistedEdit);
  const confirmInFlightRef = useRef(false);
  const [draftState, setDraftState] = useState<EditableDraftState | null>(null);
  const [status, setStatus] = useState<PersistedEditStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ManualWorkoutPersistedEditReviewResult | null>(
    null,
  );

  const isBusy = status !== "idle";
  const readyReview = reviewResult?.ok ? reviewResult : null;
  const blockedMessage = reviewResult && !reviewResult.ok ? reviewResult.message : message;

  useEffect(() => {
    if (!open) return;

    let active = true;
    setStatus("loading");
    setMessage(null);
    setReviewResult(null);
    setDraftState(null);

    void (async () => {
      try {
        const result = await reconstructEditDraftFn({
          data: buildPersistedEditSourcePayload({ activePlanId, plannedWorkoutId, workoutDate }),
        });

        if (!active) return;

        if (!result?.ok) {
          const nextMessage =
            result?.message ?? "This manual workout cannot be reconstructed for editing yet.";
          setStatus("idle");
          setMessage(nextMessage);
          hitoToast.error({
            id: MANUAL_PERSISTED_EDIT_TOAST_ID,
            title: "Edit blocked",
            description: nextMessage,
          });
          return;
        }

        setDraftState({
          baseDraftInput: result.draftInput,
          entries: cloneManualWorkoutEntries(result.draftInput.entries),
          notes: result.draftInput.notes ?? "",
          targetTruthMode: result.draftInput.targetTruthMode,
          title: result.draftInput.title,
        });
        setStatus("idle");
      } catch (error) {
        if (!active) return;
        const nextMessage =
          error instanceof Error
            ? error.message
            : "This manual workout could not be reconstructed for editing.";
        setStatus("idle");
        setMessage(nextMessage);
        hitoToast.error({
          id: MANUAL_PERSISTED_EDIT_TOAST_ID,
          title: "Edit unavailable",
          description: nextMessage,
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [activePlanId, open, plannedWorkoutId, reconstructEditDraftFn, workoutDate]);

  const updateDraftState = (next: Partial<Omit<EditableDraftState, "baseDraftInput">>) => {
    setDraftState((current) => (current ? { ...current, ...next } : current));
    setReviewResult(null);
    setMessage(null);
  };

  const buildEditedDraftInput = () => {
    if (!draftState) return null;

    return {
      ...draftState.baseDraftInput,
      entries: cloneManualWorkoutEntries(draftState.entries),
      notes: draftState.notes.trim() || null,
      targetTruthMode: draftState.targetTruthMode,
      title: draftState.title.trim() || draftState.baseDraftInput.title,
      workoutDate: draftState.baseDraftInput.workoutDate,
    } satisfies ManualWorkoutDraftInput;
  };

  const submitReview = async () => {
    if (!draftState || isBusy) return;

    const draftInput = buildEditedDraftInput();
    if (!draftInput) return;

    setStatus("reviewing");
    setMessage(null);
    setReviewResult(null);
    hitoToast.working({
      id: MANUAL_PERSISTED_EDIT_TOAST_ID,
      title: "Reviewing edit",
      description: "Hito is validating the edited workout before anything is saved.",
    });

    try {
      const result = await reviewEditDraftFn({
        data: {
          ...buildPersistedEditSourcePayload({ activePlanId, plannedWorkoutId, workoutDate }),
          draftInput,
        },
      });
      setStatus("idle");
      setReviewResult(result);

      if (!result.ok) {
        hitoToast.error({
          id: MANUAL_PERSISTED_EDIT_TOAST_ID,
          title: "Edit blocked",
          description: result.message,
        });
        return;
      }

      setDraftState((current) =>
        current
          ? {
              ...current,
              baseDraftInput: result.draftInput,
              entries: cloneManualWorkoutEntries(result.draftInput.entries),
              notes: result.draftInput.notes ?? "",
              targetTruthMode: result.draftInput.targetTruthMode,
              title: result.draftInput.title,
            }
          : current,
      );
      hitoToast.success({
        id: MANUAL_PERSISTED_EDIT_TOAST_ID,
        title: "Edit reviewed",
        description: "Confirm the backend-reviewed edit before Hito updates the workout.",
      });
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "This manual workout edit could not be reviewed.";
      setStatus("idle");
      setMessage(nextMessage);
      hitoToast.error({
        id: MANUAL_PERSISTED_EDIT_TOAST_ID,
        title: "Review failed",
        description: nextMessage,
      });
    }
  };

  const confirmReview = async () => {
    if (!readyReview || confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setStatus("saving");
    setMessage(null);

    try {
      const result = await confirmEditDraftFn({
        data: {
          ...buildPersistedEditSourcePayload({ activePlanId, plannedWorkoutId, workoutDate }),
          draftInput: readyReview.draftInput,
          reviewToken: readyReview.review.reviewToken,
          reviewChecksum: readyReview.review.reviewChecksum,
        },
      });

      if (!result.ok) {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setMessage(result.message);
        hitoToast.error({
          id: MANUAL_PERSISTED_EDIT_TOAST_ID,
          title: "Workout not updated",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_PERSISTED_EDIT_TOAST_ID,
        title: "Workout updated",
        description: "Refreshing from saved plan truth.",
      });
      confirmInFlightRef.current = false;
      setStatus("idle");
      setReviewResult(null);
      setMessage(null);
      onOpenChange(false);
      await onEdited();
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "The edited workout could not be saved.";
      confirmInFlightRef.current = false;
      setStatus("idle");
      setMessage(nextMessage);
      hitoToast.error({
        id: MANUAL_PERSISTED_EDIT_TOAST_ID,
        title: "Workout not updated",
        description: nextMessage,
      });
    }
  };

  const template = getManualTemplateForDraft(draftState?.baseDraftInput.templateKey ?? null);
  const allowedTargetTruthModes = draftState
    ? Array.from(
        new Set<ManualWorkoutTargetTruthMode>([
          draftState.targetTruthMode,
          ...template.allowedTargetTruthModes,
        ]),
      )
    : template.allowedTargetTruthModes;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isBusy) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="hito-dialog-stable hito-product-dialog h-[min(44rem,calc(100dvh-2rem))] max-w-3xl border-hairline bg-background/95 p-0 backdrop-blur-xl"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Edit training</DialogTitle>
          <DialogDescription className="hito-body">
            {formatReadableDate(workoutDate)}. Hito reconstructs the saved workout into the manual
            constructor, then reviews the edit before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          {draftState ? (
            <div className="grid gap-4">
              <ManualWorkoutConstructorEditor
                allowedTargetTruthModes={allowedTargetTruthModes}
                dateLabel={formatReadableDate(workoutDate)}
                entries={draftState.entries}
                iconKey={templateIconKind(template)}
                iconTone={templateIconTone(template)}
                isRestDraft={template.workoutType === "rest"}
                notes={draftState.notes}
                onEntriesChange={(entries) => updateDraftState({ entries })}
                onNotesChange={(notes) => updateDraftState({ notes })}
                onTargetTruthModeChange={(targetTruthMode) => updateDraftState({ targetTruthMode })}
                onTitleChange={(nextTitle) => updateDraftState({ title: nextTitle })}
                reviewDisabledReason={blockedMessage}
                selectedTemplateKey={template.templateKey}
                source="template"
                sourceLabel="Saved workout"
                statusLabel={statusLabelFor(status, reviewResult)}
                targetTruthMode={draftState.targetTruthMode}
                templateOptions={MANUAL_WORKOUT_TEMPLATES}
                title={draftState.title}
              />
              <PersistedEditReviewReadback result={reviewResult} />
            </div>
          ) : (
            <div className="hito-list-row items-start">
              <Icon
                name={blockedMessage ? "shield-alert" : "loader"}
                size="sm"
                className="mt-0.5 text-muted-foreground"
              />
              <div className="min-w-0">
                <p className="hito-list-row-title">
                  {blockedMessage ? "Edit unavailable" : "Reconstructing saved workout"}
                </p>
                <p className="hito-list-row-copy">
                  {blockedMessage ??
                    "Hito is rebuilding the saved row into the manual constructor shape."}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
          {readyReview ? (
            <button
              type="button"
              className="hito-button hito-button-primary hito-button-md"
              disabled={isBusy}
              onClick={() => void confirmReview()}
            >
              {status === "saving" ? "Saving edit..." : "Save edited workout"}
            </button>
          ) : (
            <button
              type="button"
              className="hito-button hito-button-primary hito-button-md"
              disabled={!draftState || isBusy}
              onClick={() => void submitReview()}
            >
              {status === "reviewing" ? "Reviewing edit..." : "Review edit"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildPersistedEditSourcePayload({
  activePlanId,
  plannedWorkoutId,
  workoutDate,
}: {
  activePlanId: string | null | undefined;
  plannedWorkoutId: string;
  workoutDate: string;
}): PersistedEditSourcePayload {
  return {
    ...(activePlanId ? { activePlanId } : {}),
    plannedWorkoutId,
    workoutDate,
  };
}

function getManualTemplateForDraft(templateKey: ManualWorkoutTemplateKey | null) {
  if (!templateKey) return MANUAL_WORKOUT_TEMPLATES[0]!;
  return getDefaultManualWorkoutTemplate(templateKey);
}

function statusLabelFor(
  status: PersistedEditStatus,
  reviewResult: ManualWorkoutPersistedEditReviewResult | null,
) {
  if (status === "loading") return "Loading";
  if (status === "reviewing") return "Reviewing";
  if (status === "saving") return "Saving";
  if (reviewResult?.ok) return "Ready";
  if (reviewResult && !reviewResult.ok) return "Blocked";
  return "Draft";
}

function PersistedEditReviewReadback({
  result,
}: {
  result: ManualWorkoutPersistedEditReviewResult | null;
}) {
  if (!result) return null;

  if (!result.ok) {
    return (
      <div className="hito-list-row items-start">
        <div className="grid min-w-0 gap-2">
          <p className="hito-list-row-title">Edit blocked</p>
          <p className="hito-list-row-copy">{result.message}</p>
        </div>
        <span className="hito-status-pill" data-tone="warning">
          Blocked
        </span>
      </div>
    );
  }

  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">{result.draftReview.review.headline}</p>
          <p className="hito-list-row-copy">
            {formatManualDraftStructure(
              result.draftReview.draft.totalDurationMin,
              result.draftReview.draft.totalDistanceKm,
            )}
          </p>
        </div>
        <span className="hito-status-pill shrink-0" data-tone="success">
          Ready
        </span>
      </div>
      <div className="hito-list-row items-start">
        <div className="grid min-w-0 gap-2">
          {result.draftReview.review.bullets.map((bullet) => (
            <p key={bullet} className="hito-list-row-copy">
              {bullet}
            </p>
          ))}
          <p className="hito-field-helper">
            Save sends only the active plan id if present, planned workout id, workout date, edited
            draft input, review token, and checksum. The backend updates the same planned workout
            row.
          </p>
        </div>
      </div>
      <div className="hito-list-row items-start">
        <span className="hito-status-pill shrink-0" data-tone="muted">
          {targetTruthModeLabel(result.draftInput.targetTruthMode)}
        </span>
        <p className="hito-list-row-copy min-w-0">
          {targetTruthModeCopy(result.draftInput.targetTruthMode)}
        </p>
      </div>
    </div>
  );
}
