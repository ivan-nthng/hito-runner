import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { hitoToast } from "@/components/ui/hito-toast";
import {
  confirmManualWorkoutPersistedEdit,
  reconstructManualWorkoutPersistedEditDraft,
  reviewManualWorkoutPersistedEditDraft,
} from "@/lib/manual-workout-authoring";
import type {
  ManualWorkoutDraftInput,
  ManualWorkoutPersistedEditReconstructResult,
  ManualWorkoutPersistedEditReviewResult,
  ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring";
import type { ManualWorkoutTemplateKey } from "@/lib/manual-workout-authoring/schema";
import {
  MANUAL_WORKOUT_TEMPLATES,
  cloneManualWorkoutEntries,
  formatReadableDate,
  getDefaultManualWorkoutTemplate,
  templateIconKind,
  templateIconTone,
} from "@/components/manual-workout/manual-workout-authoring-utils";
import { ManualWorkoutConstructorEditor } from "@/components/manual-workout/ManualWorkoutConstructorEditor";
import { ManualWorkoutEditorDialogHeader } from "@/components/manual-workout/ManualWorkoutEditorDialogHeader";
import { focusManualWorkoutDialogCloseOnOpen } from "@/components/manual-workout/manual-workout-dialog-focus";

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
  prepareSignal,
  title,
  workoutDate,
}: {
  activePlanId: string | null | undefined;
  onEdited: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  plannedWorkoutId: string;
  prepareSignal?: number;
  title: string;
  workoutDate: string;
}) {
  const reconstructEditDraftFn = useServerFn(reconstructManualWorkoutPersistedEditDraft);
  const reviewEditDraftFn = useServerFn(reviewManualWorkoutPersistedEditDraft);
  const confirmEditDraftFn = useServerFn(confirmManualWorkoutPersistedEdit);
  const confirmInFlightRef = useRef(false);
  const reconstructedDraftCacheRef = useRef<{
    result: ManualWorkoutPersistedEditReconstructResult;
    sourceKey: string;
  } | null>(null);
  const reconstructRequestRef = useRef<{
    promise: Promise<ManualWorkoutPersistedEditReconstructResult>;
    sourceKey: string;
  } | null>(null);
  const lastPrepareSignalRef = useRef<number | null>(null);
  const [draftState, setDraftState] = useState<EditableDraftState | null>(null);
  const [loadedSourceKey, setLoadedSourceKey] = useState<string | null>(null);
  const [status, setStatus] = useState<PersistedEditStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ManualWorkoutPersistedEditReviewResult | null>(
    null,
  );

  const sourceKey = buildPersistedEditSourceKey({ activePlanId, plannedWorkoutId, workoutDate });
  const activeDraftState = loadedSourceKey === sourceKey ? draftState : null;
  const isBusy = status !== "idle";
  const readyReview = reviewResult?.ok ? reviewResult : null;
  const blockedMessage = reviewResult && !reviewResult.ok ? reviewResult.message : message;
  const shouldRenderDialog = open && (Boolean(activeDraftState) || Boolean(blockedMessage));

  const applyPersistedEditReconstructResult = useCallback(
    (result: ManualWorkoutPersistedEditReconstructResult | null | undefined) => {
      if (!result?.ok) {
        const nextMessage =
          result?.message ?? "This manual workout cannot be opened for editing yet.";
        setStatus("idle");
        setLoadedSourceKey(sourceKey);
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
      setLoadedSourceKey(sourceKey);
      setStatus("idle");
    },
    [sourceKey],
  );

  const loadPersistedEditDraft = useCallback(() => {
    const cached = reconstructedDraftCacheRef.current;
    if (cached?.sourceKey === sourceKey) {
      return Promise.resolve(cached.result);
    }

    const existingRequest = reconstructRequestRef.current;
    if (existingRequest?.sourceKey === sourceKey) {
      return existingRequest.promise;
    }

    const promise = reconstructEditDraftFn({
      data: buildPersistedEditSourcePayload({ activePlanId, plannedWorkoutId, workoutDate }),
    }).then((result) => {
      reconstructedDraftCacheRef.current = { result, sourceKey };
      if (reconstructRequestRef.current?.sourceKey === sourceKey) {
        reconstructRequestRef.current = null;
      }
      return result;
    });

    reconstructRequestRef.current = { promise, sourceKey };
    return promise;
  }, [activePlanId, plannedWorkoutId, reconstructEditDraftFn, sourceKey, workoutDate]);

  useEffect(() => {
    if (!prepareSignal || lastPrepareSignalRef.current === prepareSignal) return;
    lastPrepareSignalRef.current = prepareSignal;

    void loadPersistedEditDraft().catch(() => {
      if (reconstructRequestRef.current?.sourceKey === sourceKey) {
        reconstructRequestRef.current = null;
      }
    });
  }, [loadPersistedEditDraft, prepareSignal, sourceKey]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setStatus("loading");
    setMessage(null);
    setReviewResult(null);

    setDraftState(null);
    setLoadedSourceKey(null);

    void (async () => {
      try {
        const result = await loadPersistedEditDraft();

        if (!active) return;

        applyPersistedEditReconstructResult(result);
      } catch (error) {
        if (!active) return;
        if (reconstructRequestRef.current?.sourceKey === sourceKey) {
          reconstructRequestRef.current = null;
        }
        const nextMessage =
          error instanceof Error
            ? error.message
            : "This manual workout could not be opened for editing.";
        setStatus("idle");
        setLoadedSourceKey(sourceKey);
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
  }, [applyPersistedEditReconstructResult, loadPersistedEditDraft, open, sourceKey]);

  const updateDraftState = (next: Partial<Omit<EditableDraftState, "baseDraftInput">>) => {
    setDraftState((current) => (current ? { ...current, ...next } : current));
    setReviewResult(null);
    setMessage(null);
  };

  const buildEditedDraftInput = () => {
    if (!activeDraftState) return null;

    return {
      ...activeDraftState.baseDraftInput,
      entries: cloneManualWorkoutEntries(activeDraftState.entries),
      notes: activeDraftState.notes.trim() || null,
      targetTruthMode: activeDraftState.targetTruthMode,
      title: activeDraftState.title.trim() || activeDraftState.baseDraftInput.title,
      workoutDate: activeDraftState.baseDraftInput.workoutDate,
    } satisfies ManualWorkoutDraftInput;
  };

  const submitReview = async () => {
    if (!activeDraftState || isBusy) return;

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

  const template = getManualTemplateForDraft(activeDraftState?.baseDraftInput.templateKey ?? null);
  const allowedTargetTruthModes = activeDraftState
    ? Array.from(
        new Set<ManualWorkoutTargetTruthMode>([
          activeDraftState.targetTruthMode,
          ...template.allowedTargetTruthModes,
        ]),
      )
    : template.allowedTargetTruthModes;

  return (
    <Dialog
      open={shouldRenderDialog}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isBusy) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        onOpenAutoFocus={focusManualWorkoutDialogCloseOnOpen}
        overlayClassName="hito-dialog-overlay-stable"
      >
        <ManualWorkoutEditorDialogHeader
          dateLabel={formatReadableDate(workoutDate)}
          statusLabel={statusLabelFor(status, reviewResult)}
          title={activeDraftState?.title ?? title}
        />

        <div className="hito-product-dialog-body-scroll-fill">
          {activeDraftState ? (
            <div className="grid gap-4">
              <ManualWorkoutConstructorEditor
                allowedTargetTruthModes={allowedTargetTruthModes}
                dateLabel={formatReadableDate(workoutDate)}
                entries={activeDraftState.entries}
                iconKey={templateIconKind(template)}
                iconTone={templateIconTone(template)}
                isRestDraft={template.workoutType === "rest"}
                notes={activeDraftState.notes}
                onEntriesChange={(entries) => updateDraftState({ entries })}
                onNotesChange={(notes) => updateDraftState({ notes })}
                onTargetTruthModeChange={(targetTruthMode) => updateDraftState({ targetTruthMode })}
                onTitleChange={(nextTitle) => updateDraftState({ title: nextTitle })}
                readbackMode={Boolean(readyReview)}
                reviewDisabledReason={blockedMessage}
                selectedTemplateKey={template.templateKey}
                source="template"
                targetTruthMode={activeDraftState.targetTruthMode}
                templateOptions={MANUAL_WORKOUT_TEMPLATES}
                title={activeDraftState.title}
              />
              <PersistedEditReviewReadback result={reviewResult} />
            </div>
          ) : (
            <div className="hito-list-row items-start">
              <Icon name="shield-alert" size="sm" className="mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="hito-list-row-title">Edit unavailable</p>
                <p className="hito-list-row-copy">
                  {blockedMessage ?? "This workout cannot be opened for editing yet."}
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
              disabled={!activeDraftState || isBusy}
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

function buildPersistedEditSourceKey({
  activePlanId,
  plannedWorkoutId,
  workoutDate,
}: {
  activePlanId: string | null | undefined;
  plannedWorkoutId: string;
  workoutDate: string;
}) {
  return `${activePlanId ?? "no-active-plan"}:${plannedWorkoutId}:${workoutDate}`;
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

  const warnings = result.draftReview.review.warnings;

  if (warnings.length === 0) {
    return (
      <p className="hito-field-helper">
        Hito reviewed this edit. Nothing changes until you save the edited workout.
      </p>
    );
  }

  return (
    <div className="hito-list-row items-start">
      <div className="grid min-w-0 gap-2">
        {warnings.map((warning) => (
          <p key={warning} className="hito-field-helper">
            Warning: {warning}
          </p>
        ))}
      </div>
    </div>
  );
}
