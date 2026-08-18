import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { HitoButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { hitoToast } from "@/components/ui/hito-toast";
import {
  confirmManualWorkoutPersistedEdit,
  reconstructManualWorkoutPersistedEditDraft,
  reviewManualWorkoutPersistedEditDraft,
} from "@/lib/manual-workout-authoring";
import type {
  ManualWorkoutPersistedEditReconstructResult,
  ManualWorkoutPersistedEditReviewResult,
} from "@/lib/manual-workout-authoring";
import { formatReadableDate } from "@/components/manual-workout/manual-workout-authoring-utils";
import { ManualWorkoutConstructorEditor } from "@/components/manual-workout/ManualWorkoutConstructorEditor";
import { ManualWorkoutEditorDialogHeader } from "@/components/manual-workout/ManualWorkoutEditorDialogHeader";
import { focusManualWorkoutDialogCloseOnOpen } from "@/components/manual-workout/manual-workout-dialog-focus";
import { workoutFamilyColorVar } from "@/lib/workout-color-tokens";
import { workoutGlyphFromCalendarIconKey } from "@/lib/workout-glyph";
import type { WorkoutDocument, WorkoutDocumentEditProjection } from "@/lib/workout-document";

const MANUAL_PERSISTED_EDIT_TOAST_ID = "manual-workout-persisted-edit";

type PersistedEditStatus = "idle" | "loading" | "reviewing" | "saving";

type EditableDocumentState = {
  editProjection: WorkoutDocumentEditProjection;
  sourceDocument: WorkoutDocument;
};

type PersistedEditSourcePayload = {
  provenancePlanId?: string;
  plannedWorkoutId: string;
  workoutDate: string;
};

export function ManualWorkoutPersistedEditDialog({
  provenancePlanId,
  onEdited,
  onOpenChange,
  open,
  plannedWorkoutId,
  prepareSignal,
  title,
  workoutDate,
}: {
  provenancePlanId: string | null | undefined;
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
  const [draftState, setDraftState] = useState<EditableDocumentState | null>(null);
  const [loadedSourceKey, setLoadedSourceKey] = useState<string | null>(null);
  const [status, setStatus] = useState<PersistedEditStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ManualWorkoutPersistedEditReviewResult | null>(
    null,
  );

  const sourceKey = buildPersistedEditSourceKey({
    provenancePlanId,
    plannedWorkoutId,
    workoutDate,
  });
  const activeDraftState = loadedSourceKey === sourceKey ? draftState : null;
  const isBusy = status !== "idle";
  const readyReview = reviewResult?.ok ? reviewResult : null;
  const blockedMessage = reviewResult && !reviewResult.ok ? reviewResult.message : message;
  const shouldRenderDialog = open && (Boolean(activeDraftState) || Boolean(blockedMessage));
  const editorDocument = readyReview?.candidateDocument ?? buildEditableDocument(activeDraftState);

  const applyPersistedEditReconstructResult = useCallback(
    (result: ManualWorkoutPersistedEditReconstructResult | null | undefined) => {
      if (!result?.ok) {
        const nextMessage = result?.message ?? "This workout cannot be opened for editing yet.";
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
        editProjection: result.editProjection,
        sourceDocument: result.document,
      });
      setLoadedSourceKey(sourceKey);
      setStatus("idle");
      setMessage(null);
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
      data: buildPersistedEditSourcePayload({
        provenancePlanId,
        plannedWorkoutId,
        workoutDate,
      }),
    }).then((result) => {
      reconstructedDraftCacheRef.current = { result, sourceKey };
      if (reconstructRequestRef.current?.sourceKey === sourceKey) {
        reconstructRequestRef.current = null;
      }
      return result;
    });

    reconstructRequestRef.current = { promise, sourceKey };
    return promise;
  }, [plannedWorkoutId, provenancePlanId, reconstructEditDraftFn, sourceKey, workoutDate]);

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
          error instanceof Error ? error.message : "This workout could not be opened for editing.";
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

  const updateEditProjection = (
    next: Partial<Pick<WorkoutDocumentEditProjection, "notes" | "title">>,
  ) => {
    setDraftState((current) =>
      current ? { ...current, editProjection: { ...current.editProjection, ...next } } : current,
    );
    setReviewResult(null);
    setMessage(null);
  };

  const buildEditedProjection = () => {
    if (!activeDraftState) return null;

    return {
      ...activeDraftState.editProjection,
      notes: activeDraftState.editProjection.notes?.trim() || null,
      title: activeDraftState.editProjection.title.trim() || activeDraftState.sourceDocument.title,
    } satisfies WorkoutDocumentEditProjection;
  };

  const submitReview = async () => {
    if (!activeDraftState || isBusy) return;

    const editProjection = buildEditedProjection();
    if (!editProjection) return;

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
          ...buildPersistedEditSourcePayload({
            provenancePlanId,
            plannedWorkoutId,
            workoutDate,
          }),
          editProjection,
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
              editProjection: result.editProjection,
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
        error instanceof Error ? error.message : "This workout edit could not be reviewed.";
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
          ...buildPersistedEditSourcePayload({
            provenancePlanId,
            plannedWorkoutId,
            workoutDate,
          }),
          editProjection: readyReview.editProjection,
          reviewToken: readyReview.review.reviewToken,
          reviewChecksum: readyReview.review.reviewChecksum,
        },
      });

      if (!result.ok) {
        confirmInFlightRef.current = false;
        setStatus("idle");
        setReviewResult(null);
        setMessage(result.message);
        reconstructedDraftCacheRef.current = null;
        hitoToast.error({
          id: MANUAL_PERSISTED_EDIT_TOAST_ID,
          title: "Workout not updated",
          description: result.message,
        });
        await onEdited();
        return;
      }

      hitoToast.success({
        id: MANUAL_PERSISTED_EDIT_TOAST_ID,
        title: "Workout updated",
        description: "Refreshing from saved Calendar truth.",
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
          title={activeDraftState?.editProjection.title ?? title}
        />

        <div className="hito-product-dialog-body-scroll-fill">
          {activeDraftState ? (
            <div className="grid gap-4">
              <ManualWorkoutConstructorEditor
                allowedTargetTruthModes={[]}
                dateLabel={formatReadableDate(workoutDate)}
                entries={[]}
                entriesLocked
                entriesLockedMessage="Saved structure, targets, provenance, and extra metadata stay read-only here and are preserved during review."
                iconKey={workoutGlyphFromCalendarIconKey(
                  activeDraftState.editProjection.calendarIconKey,
                )}
                iconTone={workoutFamilyColorVar(
                  activeDraftState.editProjection.workoutFamily,
                  "content",
                )}
                isRestDraft={false}
                notes={activeDraftState.editProjection.notes ?? ""}
                notesPlaceholder="Optional notes or cues for this workout."
                onEntriesChange={() => undefined}
                onNotesChange={(notes) => updateEditProjection({ notes })}
                onTitleChange={(nextTitle) => updateEditProjection({ title: nextTitle })}
                readbackMode={Boolean(readyReview)}
                reviewedDocument={editorDocument}
                reviewDisabledReason={blockedMessage}
                selectedTemplateKey={null}
                showTargetGuidance={false}
                source="template"
                targetTruthMode="structure_only"
                templateOptions={[]}
                title={activeDraftState.editProjection.title}
              />
              <PersistedEditReviewReadback result={reviewResult} />
            </div>
          ) : (
            <div className="hito-list-row items-start">
              <Icon name="shield-alert" size="sm" className="mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="hito-body-md text-foreground">Edit unavailable</p>
                <p className="hito-body-sm mt-1 text-secondary">
                  {blockedMessage ?? "This workout cannot be opened for editing yet."}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <HitoButton
            type="button"
            size="md"
            variant="secondary"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            Close
          </HitoButton>
          {readyReview ? (
            <HitoButton
              type="button"
              loading={status === "saving"}
              size="md"
              variant="primary"
              disabled={isBusy}
              onClick={() => void confirmReview()}
            >
              {status === "saving" ? "Saving edit..." : "Save edited workout"}
            </HitoButton>
          ) : (
            <HitoButton
              type="button"
              loading={status === "reviewing"}
              size="md"
              variant="primary"
              disabled={!activeDraftState || isBusy}
              onClick={() => void submitReview()}
            >
              {status === "reviewing" ? "Reviewing edit..." : "Review edit"}
            </HitoButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildPersistedEditSourcePayload({
  provenancePlanId,
  plannedWorkoutId,
  workoutDate,
}: {
  provenancePlanId: string | null | undefined;
  plannedWorkoutId: string;
  workoutDate: string;
}): PersistedEditSourcePayload {
  return {
    ...(provenancePlanId ? { provenancePlanId } : {}),
    plannedWorkoutId,
    workoutDate,
  };
}

function buildPersistedEditSourceKey({
  provenancePlanId,
  plannedWorkoutId,
  workoutDate,
}: {
  provenancePlanId: string | null | undefined;
  plannedWorkoutId: string;
  workoutDate: string;
}) {
  return `${provenancePlanId ?? "no-provenance-plan"}:${plannedWorkoutId}:${workoutDate}`;
}

function buildEditableDocument(state: EditableDocumentState | null): WorkoutDocument | null {
  if (!state) return null;

  return {
    ...state.sourceDocument,
    ...state.editProjection,
  };
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
          <p className="hito-body-md text-foreground">Edit blocked</p>
          <p className="hito-body-sm mt-1 text-secondary">{result.message}</p>
        </div>
        <span className="hito-status-pill" data-tone="warning">
          Blocked
        </span>
      </div>
    );
  }

  return (
    <p className="hito-body-xs text-secondary">
      Hito reviewed the complete saved workout document. Nothing changes until you save the edited
      workout.
    </p>
  );
}
